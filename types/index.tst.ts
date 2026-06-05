import Fastify, { type FastifyError, type FastifyPluginAsync } from 'fastify'
import { expect, test } from 'tstyche'
import fastifyHttpQuery, {
  fastifyHttpQuery as namedExport,
  MissingContentTypeError,
  EmptyBodyError
} from './index.js'

const app = Fastify()

test('exports a Fastify async plugin as default and named', () => {
  expect(fastifyHttpQuery).type.toBeAssignableTo<FastifyPluginAsync>()
  expect(namedExport).type.toBeAssignableTo<FastifyPluginAsync>()
})

test('exports typed error constructors', () => {
  expect(new MissingContentTypeError()).type.toBeAssignableTo<FastifyError>()
  expect(new EmptyBodyError()).type.toBeAssignableTo<FastifyError>()
  expect(new MissingContentTypeError().code).type.toBe<'FST_ERR_QUERY_MISSING_CONTENT_TYPE'>()
  expect(new EmptyBodyError().code).type.toBe<'FST_ERR_QUERY_EMPTY_BODY'>()
})

test('decorates the instance with a `query` route shorthand', () => {
  expect(app).type.toHaveProperty('query')
  expect(app.query).type.toBeCallableWith('/search', async () => ({ ok: true }))
})

test('the `query` shorthand accepts route options with a schema', () => {
  expect(app.query).type.toBeCallableWith(
    '/search',
    { schema: { body: { type: 'object' } } },
    async () => ({ ok: true })
  )
})

test('the `query` shorthand accepts the options-with-handler form', () => {
  expect(app.query).type.toBeCallableWith('/search', {
    handler: async () => ({ ok: true })
  })
})

test('the `query` shorthand infers the typed request body', () => {
  app.query<{ Body: { q: string } }>('/search', async (request) => {
    expect(request.body).type.toBe<{ q: string }>()
    return { ok: true }
  })
})

test('the `query` shorthand rejects a non-string path', () => {
  expect(app.query).type.not.toBeCallableWith(42, async () => ({ ok: true }))
})
