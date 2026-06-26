# API Reference

The plugin exports a single default, the plugin function itself, and two
error constructors. The plugin is also responsible for **augmenting the
Fastify type** to add the `query` route shorthand.

## `fastifyHttpQuery` (default export)

```ts
import type { FastifyPluginAsync } from 'fastify'

const fastifyHttpQuery: FastifyPluginAsync
export default fastifyHttpQuery
```

A standard [`FastifyPluginAsync`](https://fastify.dev/docs/latest/Reference/Plugins/)
that wraps the implementation with
[`fastify-plugin`](https://github.com/fastify/fastify-plugin) so its effects
(added HTTP method, `onRequest` hook) are visible to the parent scope.

The plugin takes **no options**.

### What it does

1. Registers the `QUERY` method via
   [`fastify.addHttpMethod('QUERY', { hasBody: true })`](https://fastify.dev/docs/latest/Reference/Server/#addhttpmethod)
   if it is not already in `fastify.supportedMethods`. The guard prevents
   double-registration when the plugin is loaded twice.
2. Installs an `onRequest` hook that, for `QUERY` requests only:
   - Rejects requests without a `Content-Type` header with
     `FST_ERR_QUERY_MISSING_CONTENT_TYPE` (`400`).
   - Rejects requests without a body (no `Content-Length > 0` and no
     `Transfer-Encoding`) with `FST_ERR_QUERY_EMPTY_BODY` (`400`).

See [`index.js`](https://github.com/TheCodePace/fastify-http-query/blob/main/index.js)
for the implementation.

## `app.query` (Fastify instance augmentation)

The plugin augments `FastifyInstance` with a `query` route shorthand so you
can write:

```ts
app.query('/search', { schema: { body: { ... } } }, async (request) => {
  return runSearch(request.body)
})
```

This is exactly the shape of every other Fastify route shorthand
(`get`, `post`, `put`, ...). The TypeScript declaration is in
[`types/index.d.ts`](https://github.com/TheCodePace/fastify-http-query/blob/main/types/index.d.ts):

```ts
declare module 'fastify' {
  interface FastifyInstance<...> {
    query: RouteShorthandMethod<RawServer, RawRequest, RawReply, TypeProvider, Logger>
  }
}
```

After `await app.register(fastifyHttpQuery)`, `app.query` is available and
fully typed against your route's schema.

## Error constructors

```ts
import {
  MissingContentTypeError,
  EmptyBodyError
} from '@thecodepace/fastify-http-query'
```

Both are thrown by the plugin's `onRequest` hook and are also exported so
you can match them in a custom error handler. See
[Error codes](/errors/) for details.

| Constructor | Code | Status |
| --- | --- | --- |
| `MissingContentTypeError` | `FST_ERR_QUERY_MISSING_CONTENT_TYPE` | `400` |
| `EmptyBodyError` | `FST_ERR_QUERY_EMPTY_BODY` | `400` |
