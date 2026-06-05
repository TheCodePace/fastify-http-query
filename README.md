# @thecodespace/fastify-http-query

[![CI](https://github.com/thecodespace/fastify-http-query/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/thecodespace/fastify-http-query/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/@thecodespace/fastify-http-query.svg?style=flat)](https://www.npmjs.com/package/@thecodespace/fastify-http-query)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-brightgreen?style=flat)](https://github.com/neostandard/neostandard)

Fastify HTTP `QUERY` plugin; with this you can enable the HTTP `QUERY` method in Fastify.

`QUERY` is a **safe, idempotent, cacheable** HTTP method that — unlike `GET` —
carries a request **body** describing the query operation. It is defined by the
IETF draft
[_HTTP QUERY Method_](https://httpwg.org/http-extensions/draft-ietf-httpbis-safe-method-w-body.html)
(`draft-ietf-httpbis-safe-method-w-body`).

## Install

```
npm i @thecodespace/fastify-http-query
```

### Requirements

Requires a Node.js version that lists `QUERY` in `http.METHODS` (Node.js `>= 22`),
so the HTTP parser accepts incoming `QUERY` requests.

### Compatibility

| Plugin version | Fastify version |
| -------------- | --------------- |
| `>=1.x`        | `^5.x`          |

Please note that if a Fastify version is out of support, then so are the corresponding versions of this plugin
in the table above.
See [Fastify's LTS policy](https://github.com/fastify/fastify/blob/main/docs/Reference/LTS.md) for more details.

## Usage

Register the plugin **before** declaring any `QUERY` route. The plugin adds the
`QUERY` method to Fastify (via
[`addHttpMethod`](https://fastify.dev/docs/latest/Reference/Server/#addhttpmethod))
and exposes the `query` route shorthand:

```js
import Fastify from 'fastify'
import fastifyHttpQuery from '@thecodespace/fastify-http-query'

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

```
curl -X QUERY http://localhost:3000/search \
  -H 'content-type: application/json' \
  --data '{"q":"fastify"}'
```

The plugin has no options.

## Specification compliance

The plugin is strict about the parts of the specification a server is required
to enforce:

| Behavior | Result |
| --- | --- |
| `QUERY` route shorthand + `supportedMethods` entry | provided |
| Request body is parsed (per the request `Content-Type`) | provided |
| Request **without** a `Content-Type` header | rejected with `400` (`FST_ERR_QUERY_MISSING_CONTENT_TYPE`) |
| Request **without** a body | rejected with `400` (`FST_ERR_QUERY_EMPTY_BODY`) |
| Unsupported media type | `415` (Fastify's native content-type handling) |

### Out of scope

The following parts of the specification are concerns of the application or of
intermediaries/caches, not of this plugin, and are left to you:

- **Caching & cache key** — the spec requires a cache key that incorporates the
  request content. This is a cache/intermediary concern.
- **`Content-Location`** — a successful response _may_ point at a `GET`-able
  resource for the results. Set it in your handler when appropriate.
- **Conditional and Range requests** — handle via `ETag`/`If-*` and your query
  format's own paging in your handler.

## Safety, idempotency & caching

`QUERY` is **safe** (it does not request a change to the target resource),
**idempotent**, and its response is **cacheable**. Treat your `QUERY` handlers
accordingly — do not mutate state.

## License

Licensed under [MIT](./LICENSE).
