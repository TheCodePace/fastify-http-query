# Quick start

Register the plugin **before** declaring any `QUERY` route. The plugin adds
the `QUERY` method to Fastify via
[`addHttpMethod`](https://fastify.dev/docs/latest/Reference/Server/#addhttpmethod)
and exposes the `query` route shorthand.

## Minimal example

```js
import Fastify from 'fastify'
import fastifyHttpQuery from '@thecodepace/fastify-http-query'

const app = Fastify()
await app.register(fastifyHttpQuery)

// QUERY route — the body carries the query, just like GET carries the URL.
app.query('/search', {
  schema: {
    body: {
      type: 'object',
      properties: { q: { type: 'string' } },
      required: ['q']
    }
  }
}, async (request) => {
  return runSearch(request.body.q)
})

await app.listen({ port: 3000 })
```

## Calling it

```sh
curl -X QUERY http://localhost:3000/search \
  -H 'content-type: application/json' \
  --data '{"q":"fastify"}'
```

A missing `Content-Type` or an empty body is rejected with `400`; see
[Error codes](/errors/) for the exact codes.

## Plugin options

The plugin has no options. The signature is purely a `FastifyPluginAsync`:

```ts
import type { FastifyPluginAsync } from 'fastify'

const fastifyHttpQuery: FastifyPluginAsync
```

## What registering actually does

1. Calls `fastify.addHttpMethod('QUERY', { hasBody: true })` if `QUERY` is not
   already in `fastify.supportedMethods` (guards against double registration).
2. Adds an `onRequest` hook that, for `QUERY` requests only:
   - Rejects requests without a `Content-Type` header with
     `FST_ERR_QUERY_MISSING_CONTENT_TYPE`.
   - Rejects requests without a body (no `Content-Length > 0` and no
     `Transfer-Encoding`) with `FST_ERR_QUERY_EMPTY_BODY`.

Both errors carry `statusCode: 400` and can be matched with `instanceof`
against the exported error constructors — see [Error codes](/errors/).

## Next steps

- Add [caching and conditional requests](/guide/caching) on top of `@fastify/etag`
  and `@fastify/caching`.
- Set a [Content-Location](/guide/content-location) header on successful
  responses.
