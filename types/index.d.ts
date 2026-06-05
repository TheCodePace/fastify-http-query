import {
  FastifyBaseLogger,
  FastifyError,
  FastifyPluginAsync,
  FastifyTypeProvider,
  FastifyTypeProviderDefault,
  RawReplyDefaultExpression,
  RawRequestDefaultExpression,
  RawServerBase,
  RawServerDefault,
  RouteShorthandMethod
} from 'fastify'

declare module 'fastify' {
  interface FastifyInstance<
    RawServer extends RawServerBase = RawServerDefault,
    RawRequest extends RawRequestDefaultExpression<RawServer> = RawRequestDefaultExpression<RawServer>,
    RawReply extends RawReplyDefaultExpression<RawServer> = RawReplyDefaultExpression<RawServer>,
    Logger extends FastifyBaseLogger = FastifyBaseLogger,
    TypeProvider extends FastifyTypeProvider = FastifyTypeProviderDefault
  > {
    /**
     * Register a route that responds to the HTTP `QUERY` method.
     * Enabled by the `@thecodepace/fastify-http-query` plugin.
     */
    query: RouteShorthandMethod<RawServer, RawRequest, RawReply, TypeProvider, Logger>;
  }
}

type FastifyHttpQuery = FastifyPluginAsync

declare const fastifyHttpQuery: FastifyHttpQuery

/**
 * Constructor of the `FastifyError` thrown by the plugin for a given error
 * `code` and `400` status.
 */
export interface QueryErrorConstructor<Code extends string> {
  new (): FastifyError & { code: Code; statusCode: 400 }
  readonly prototype: FastifyError & { code: Code; statusCode: 400 }
}

/** Thrown when a `QUERY` request is missing the `Content-Type` header. */
export const MissingContentTypeError: QueryErrorConstructor<'FST_ERR_QUERY_MISSING_CONTENT_TYPE'>

/** Thrown when a `QUERY` request has no body. */
export const EmptyBodyError: QueryErrorConstructor<'FST_ERR_QUERY_EMPTY_BODY'>

export default fastifyHttpQuery
export { fastifyHttpQuery }
