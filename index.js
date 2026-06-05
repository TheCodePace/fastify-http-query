import createError from '@fastify/error'
import fp from 'fastify-plugin'

const QUERY_METHOD = 'QUERY'

export const MissingContentTypeError = createError(
  'FST_ERR_QUERY_MISSING_CONTENT_TYPE',
  'QUERY requests must include a Content-Type header',
  400
)

export const EmptyBodyError = createError(
  'FST_ERR_QUERY_EMPTY_BODY',
  'QUERY requests must include a request body',
  400
)

async function fastifyHttpQuery (fastify) {
  // `addHttpMethod` overrides existing methods, so guard against
  // registering QUERY more than once when the plugin is loaded twice.
  if (!fastify.supportedMethods.includes(QUERY_METHOD)) {
    fastify.addHttpMethod(QUERY_METHOD, { hasBody: true })
  }

  // Enforce the spec's server requirements before the body is parsed.
  // https://httpwg.org/http-extensions/draft-ietf-httpbis-safe-method-w-body.html
  fastify.addHook('onRequest', async (request) => {
    if (request.method !== QUERY_METHOD) return

    // "Servers MUST fail the request if the Content-Type request field is
    // missing or is inconsistent with the request content."
    if (!request.headers['content-type']) {
      throw new MissingContentTypeError()
    }

    // "The content of the request and its media type define the query."
    // A QUERY request without content has no query to perform.
    const contentLength = request.headers['content-length']
    const hasBody =
      request.headers['transfer-encoding'] !== undefined ||
      (contentLength !== undefined && Number(contentLength) > 0)
    if (!hasBody) {
      throw new EmptyBodyError()
    }
  })
}

export default fp(fastifyHttpQuery, {
  fastify: '5.x',
  name: '@thecodespace/fastify-http-query',
})
export { fastifyHttpQuery }
