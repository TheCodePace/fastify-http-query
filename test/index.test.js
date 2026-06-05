import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { request } from 'node:http'
import Fastify from 'fastify'
import fastifyHttpQuery, {
  fastifyHttpQuery as namedExport,
  MissingContentTypeError,
  EmptyBodyError
} from '../index.js'

// Register the plugin, then register the routes in a child plugin so that the
// `query` shorthand added by `fastifyHttpQuery` is available when they load.
function build (t, routes) {
  const app = Fastify()
  app.register(fastifyHttpQuery)
  if (routes) app.register(routes)
  t.after(() => app.close())
  return app
}

// Issue a real QUERY request over TCP so that Node's HTTP parser (llhttp) — not
// just `inject()` — is exercised. This proves the wire-level method is accepted.
function wireQuery (app, { path = '/search', headers, body } = {}) {
  const { port } = app.server.address()
  return new Promise((resolve, reject) => {
    const req = request(
      { host: '127.0.0.1', port, method: 'QUERY', path, headers },
      (res) => {
        let data = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => resolve({ statusCode: res.statusCode, body: data }))
      }
    )
    req.on('error', reject)
    if (body !== undefined) req.write(body)
    req.end()
  })
}

describe('registration', () => {
  test('registers the QUERY method and the `query` shorthand', async (t) => {
    const app = build(t)
    await app.ready()

    assert.ok(app.supportedMethods.includes('QUERY'))
    assert.equal(typeof app.query, 'function')
  })

  test('does not re-register QUERY when it is already supported', async (t) => {
    const app = Fastify()
    app.addHttpMethod('QUERY', { hasBody: true })
    app.register(fastifyHttpQuery)
    app.register(async (instance) => {
      instance.query('/search', async (request) => ({ echo: request.body }))
    })
    t.after(() => app.close())

    const res = await app.inject({
      method: 'QUERY',
      url: '/search',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ q: 'guard' })
    })

    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.json(), { echo: { q: 'guard' } })
  })

  test('the `query` shorthand is available in nested plugins', async (t) => {
    const app = build(t, async (instance) => {
      instance.register(async (nested) => {
        nested.query('/nested', async () => ({ ok: true }))
      })
    })

    const res = await app.inject({
      method: 'QUERY',
      url: '/nested',
      headers: { 'content-type': 'application/json' },
      payload: '{}'
    })

    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.json(), { ok: true })
  })
})

describe('valid requests', () => {
  test('parses the body of a valid QUERY request', async (t) => {
    const app = build(t, async (instance) => {
      instance.query('/search', async (request) => ({ echo: request.body }))
    })

    const res = await app.inject({
      method: 'QUERY',
      url: '/search',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ q: 'fastify' })
    })

    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.json(), { echo: { q: 'fastify' } })
  })

  test('accepts a Content-Type with parameters (charset)', async (t) => {
    const app = build(t, async (instance) => {
      instance.query('/search', async (request) => ({ echo: request.body }))
    })

    const res = await app.inject({
      method: 'QUERY',
      url: '/search',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      payload: JSON.stringify({ q: 'fastify' })
    })

    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.json(), { echo: { q: 'fastify' } })
  })

  test('accepts a body sent with transfer-encoding instead of content-length', async (t) => {
    const app = build(t, async (instance) => {
      instance.query('/search', async (request) => ({ echo: request.body }))
    })

    const res = await app.inject({
      method: 'QUERY',
      url: '/search',
      headers: {
        'content-type': 'application/json',
        'transfer-encoding': 'chunked'
      },
      payload: JSON.stringify({ q: 'chunked' })
    })

    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.json(), { echo: { q: 'chunked' } })
  })

  test('validates the body against a route schema', async (t) => {
    const app = build(t, async (instance) => {
      instance.query('/search', {
        schema: {
          body: {
            type: 'object',
            required: ['q'],
            properties: { q: { type: 'string' } }
          }
        }
      }, async (request) => ({ echo: request.body }))
    })

    const ok = await app.inject({
      method: 'QUERY',
      url: '/search',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ q: 'fastify' })
    })
    assert.equal(ok.statusCode, 200)
    assert.deepEqual(ok.json(), { echo: { q: 'fastify' } })

    // Body parsing and validation still run for QUERY: an invalid body is a
    // validation error, distinct from the plugin's own 400s.
    const invalid = await app.inject({
      method: 'QUERY',
      url: '/search',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({})
    })
    assert.equal(invalid.statusCode, 400)
    assert.equal(invalid.json().code, 'FST_ERR_VALIDATION')
  })

  test('does not interfere with other HTTP methods', async (t) => {
    const app = build(t, async (instance) => {
      instance.get('/search', async () => ({ via: 'get' }))
    })

    const res = await app.inject({ method: 'GET', url: '/search' })

    assert.equal(res.statusCode, 200)
    assert.deepEqual(res.json(), { via: 'get' })
  })
})

describe('spec enforcement', () => {
  test('rejects a QUERY request without a Content-Type', async (t) => {
    const app = build(t, async (instance) => {
      instance.query('/search', async () => ({ ok: true }))
    })

    const res = await app.inject({
      method: 'QUERY',
      url: '/search',
      payload: 'anything'
    })

    assert.equal(res.statusCode, 400)
    assert.deepEqual(res.json(), {
      statusCode: 400,
      code: 'FST_ERR_QUERY_MISSING_CONTENT_TYPE',
      error: 'Bad Request',
      message: 'QUERY requests must include a Content-Type header'
    })
  })

  test('rejects a QUERY request with no body', async (t) => {
    const app = build(t, async (instance) => {
      instance.query('/search', async () => ({ ok: true }))
    })

    const res = await app.inject({
      method: 'QUERY',
      url: '/search',
      headers: { 'content-type': 'application/json' }
    })

    assert.equal(res.statusCode, 400)
    assert.deepEqual(res.json(), {
      statusCode: 400,
      code: 'FST_ERR_QUERY_EMPTY_BODY',
      error: 'Bad Request',
      message: 'QUERY requests must include a request body'
    })
  })

  test('rejects a QUERY request with a zero-length body', async (t) => {
    const app = build(t, async (instance) => {
      instance.query('/search', async () => ({ ok: true }))
    })

    const res = await app.inject({
      method: 'QUERY',
      url: '/search',
      headers: { 'content-type': 'application/json', 'content-length': '0' }
    })

    assert.equal(res.statusCode, 400)
    assert.equal(res.json().code, 'FST_ERR_QUERY_EMPTY_BODY')
  })
})

describe('over the wire (real HTTP parser)', () => {
  test('Node accepts the QUERY method and the handler runs', async (t) => {
    const app = build(t, async (instance) => {
      instance.query('/search', async (request) => ({ echo: request.body }))
    })
    await app.listen({ port: 0, host: '127.0.0.1' })

    const res = await wireQuery(app, {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ q: 'wire' })
    })

    assert.equal(res.statusCode, 200)
    assert.deepEqual(JSON.parse(res.body), { echo: { q: 'wire' } })
  })

  test('enforcement also applies to real requests', async (t) => {
    const app = build(t, async (instance) => {
      instance.query('/search', async () => ({ ok: true }))
    })
    await app.listen({ port: 0, host: '127.0.0.1' })

    const res = await wireQuery(app, { body: 'anything' })

    assert.equal(res.statusCode, 400)
    assert.equal(JSON.parse(res.body).code, 'FST_ERR_QUERY_MISSING_CONTENT_TYPE')
  })
})

describe('exported errors', () => {
  test('default and named exports are the same plugin', () => {
    assert.equal(fastifyHttpQuery, namedExport)
  })

  test('MissingContentTypeError', () => {
    const err = new MissingContentTypeError()
    assert.ok(err instanceof Error)
    assert.equal(err.code, 'FST_ERR_QUERY_MISSING_CONTENT_TYPE')
    assert.equal(err.statusCode, 400)
    assert.equal(err.message, 'QUERY requests must include a Content-Type header')
  })

  test('EmptyBodyError', () => {
    const err = new EmptyBodyError()
    assert.ok(err instanceof Error)
    assert.equal(err.code, 'FST_ERR_QUERY_EMPTY_BODY')
    assert.equal(err.statusCode, 400)
    assert.equal(err.message, 'QUERY requests must include a request body')
  })
})

// QUERY responses are cacheable per the spec, but the cache key (which must
// incorporate the request body) and `Content-Location` are concerns of the
// application/intermediary, not of this plugin. These tests pin the contract:
// the plugin neither caches nor interferes with caching done by the handler.
describe('caching is left to the application', () => {
  test('does not add caching headers of its own', async (t) => {
    const app = build(t, async (instance) => {
      instance.query('/search', async (request) => ({ echo: request.body }))
    })

    const res = await app.inject({
      method: 'QUERY',
      url: '/search',
      headers: { 'content-type': 'application/json' },
      payload: '{}'
    })

    assert.equal(res.statusCode, 200)
    assert.equal(res.headers['cache-control'], undefined)
    assert.equal(res.headers.vary, undefined)
    assert.equal(res.headers['content-location'], undefined)
  })

  test('preserves cache-related headers set by the handler', async (t) => {
    const app = build(t, async (instance) => {
      instance.query('/search', async (request, reply) => {
        reply.header('cache-control', 'max-age=60')
        reply.header('content-location', '/search/results/1')
        return { echo: request.body }
      })
    })

    const res = await app.inject({
      method: 'QUERY',
      url: '/search',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ q: 'fastify' })
    })

    assert.equal(res.statusCode, 200)
    assert.equal(res.headers['cache-control'], 'max-age=60')
    assert.equal(res.headers['content-location'], '/search/results/1')
    assert.deepEqual(res.json(), { echo: { q: 'fastify' } })
  })
})
