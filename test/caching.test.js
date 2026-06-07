import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { request } from 'node:http'
import Fastify from 'fastify'
import fastifyEtag from '@fastify/etag'
import fastifyCaching from '@fastify/caching'
import fastifyHttpQuery from '../index.js'

// These tests prove the "pure delegation" caching model: QUERY caching is
// achieved by composing this plugin with the standard Fastify caching plugins,
// exactly as one would for GET. No QUERY-specific cache code lives here.

function query (app, { url = '/search', headers = {}, payload } = {}) {
  return app.inject({
    method: 'QUERY',
    url,
    headers: { 'content-type': 'application/json', ...headers },
    payload
  })
}

describe('@fastify/etag works with QUERY (conditional requests)', () => {
  function build (t) {
    const app = Fastify()
    app.register(fastifyHttpQuery)
    app.register(fastifyEtag)
    app.register(async (instance) => {
      instance.query('/search', async (request) => ({ echo: request.body }))
    })
    t.after(() => app.close())
    return app
  }

  test('a QUERY response carries an ETag derived from the results', async (t) => {
    const app = build(t)

    const res = await query(app, { payload: JSON.stringify({ q: 'a' }) })

    assert.strictEqual(res.statusCode, 200)
    assert.ok(res.headers.etag, 'expected an etag header')
  })

  test('matching If-None-Match yields 304 with an empty body', async (t) => {
    const app = build(t)

    const first = await query(app, { payload: JSON.stringify({ q: 'a' }) })
    const etag = first.headers.etag

    const second = await query(app, {
      payload: JSON.stringify({ q: 'a' }),
      headers: { 'if-none-match': etag }
    })

    assert.strictEqual(second.statusCode, 304)
    assert.strictEqual(second.body, '')
  })

  test('a different body yields a different result, ETag and a 200', async (t) => {
    const app = build(t)

    const a = await query(app, { payload: JSON.stringify({ q: 'a' }) })
    const b = await query(app, { payload: JSON.stringify({ q: 'b' }) })

    assert.notStrictEqual(a.headers.etag, b.headers.etag)

    // The ETag of body "a" must NOT satisfy a conditional request for body "b".
    const conditional = await query(app, {
      payload: JSON.stringify({ q: 'b' }),
      headers: { 'if-none-match': a.headers.etag }
    })

    assert.strictEqual(conditional.statusCode, 200)
    assert.strictEqual(conditional.headers.etag, b.headers.etag)
  })
})

describe('@fastify/caching works with QUERY (Cache-Control & etag store)', () => {
  test('sets a Cache-Control header on a QUERY response', async (t) => {
    const app = Fastify()
    app.register(fastifyHttpQuery)
    app.register(fastifyCaching, {
      privacy: fastifyCaching.privacy.PRIVATE,
      expiresIn: 3600
    })
    app.register(async (instance) => {
      instance.query('/search', async (request) => ({ echo: request.body }))
    })
    t.after(() => app.close())

    const res = await query(app, { payload: JSON.stringify({ q: 'a' }) })

    assert.strictEqual(res.statusCode, 200)
    assert.strictEqual(res.headers['cache-control'], 'private, max-age=3600')
  })

  test('reply.etag() drives a 304 via the etag store', async (t) => {
    const app = Fastify()
    app.register(fastifyHttpQuery)
    app.register(fastifyCaching)
    app.register(async (instance) => {
      instance.query('/search', async (request, reply) => {
        reply.etag('a-stable-etag')
        return { echo: request.body }
      })
    })
    t.after(() => app.close())

    const first = await query(app, { payload: JSON.stringify({ q: 'a' }) })
    assert.strictEqual(first.statusCode, 200)
    assert.strictEqual(first.headers.etag, 'a-stable-etag')

    const second = await query(app, {
      payload: JSON.stringify({ q: 'a' }),
      headers: { 'if-none-match': 'a-stable-etag' }
    })
    assert.strictEqual(second.statusCode, 304)
  })
})

describe('over the wire (real HTTP parser + @fastify/etag)', () => {
  function wireQuery (app, { headers = {}, body } = {}) {
    const { port } = app.server.address()
    return new Promise((resolve, reject) => {
      const req = request(
        {
          host: '127.0.0.1',
          port,
          method: 'QUERY',
          path: '/search',
          headers: { 'content-type': 'application/json', ...headers }
        },
        (res) => {
          let data = ''
          res.setEncoding('utf8')
          res.on('data', (chunk) => { data += chunk })
          res.on('end', () => resolve({ statusCode: res.statusCode, etag: res.headers.etag, body: data }))
        }
      )
      req.on('error', reject)
      if (body !== undefined) req.write(body)
      req.end()
    })
  }

  test('a real QUERY gets an ETag and a follow-up If-None-Match returns 304', async (t) => {
    const app = Fastify()
    app.register(fastifyHttpQuery)
    app.register(fastifyEtag)
    app.register(async (instance) => {
      instance.query('/search', async (request) => ({ echo: request.body }))
    })
    t.after(() => app.close())
    await app.listen({ port: 0, host: '127.0.0.1' })

    const first = await wireQuery(app, { body: JSON.stringify({ q: 'a' }) })
    assert.strictEqual(first.statusCode, 200)
    assert.ok(first.etag)

    const second = await wireQuery(app, {
      body: JSON.stringify({ q: 'a' }),
      headers: { 'if-none-match': first.etag }
    })
    assert.strictEqual(second.statusCode, 304)
    assert.strictEqual(second.body, '')
  })
})
