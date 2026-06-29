# Caching & conditional requests

`QUERY` responses are **cacheable** and support **conditional requests**, the
same way `GET` responses do. This plugin follows Fastify's model: **the core
enables the method; caching is composed from the ecosystem** — exactly as you
would cache `GET`. There is no bespoke cache here.

## Conditional requests with `@fastify/etag`

[`@fastify/etag`](https://github.com/fastify/fastify-etag) computes an `ETag`
from the **response payload** and answers `If-None-Match` with `304`. Because
the ETag is derived from the **results**, two `QUERY` requests with different
bodies naturally produce different ETags — so conditional handling is correct
for `QUERY` with no extra configuration.

```js
import Fastify from 'fastify'
import fastifyHttpQuery from '@thecodepace/fastify-http-query'
import etag from '@fastify/etag'

const app = Fastify()
await app.register(fastifyHttpQuery)
await app.register(etag)

app.query('/search', (request) => runSearch(request.body))

await app.listen({ port: 3000 })
```

Try:

```sh
# First call — full response, with an ETag.
curl -i -X QUERY http://localhost:3000/search \
  -H 'content-type: application/json' \
  --data '{"q":"a"}'

# Same body, matching If-None-Match — 304 Not Modified.
curl -i -X QUERY http://localhost:3000/search \
  -H 'content-type: application/json' \
  -H 'if-none-match: "<the-etag-from-above>"' \
  --data '{"q":"a"}'

# Different body, same If-None-Match — 200 with a fresh response.
curl -i -X QUERY http://localhost:3000/search \
  -H 'content-type: application/json' \
  -H 'if-none-match: "<the-etag-from-above>"' \
  --data '{"q":"b"}'
```

## `Cache-Control` with `@fastify/caching`

[`@fastify/caching`](https://github.com/fastify/fastify-caching) manages
`Cache-Control` / `Expires` and provides `reply.etag()`:

```js
import caching from '@fastify/caching'

await app.register(caching, {
  privacy: caching.privacy.PRIVATE,
  expiresIn: 3600
})
// QUERY responses now carry: Cache-Control: private, max-age=3600
```

## Shared-cache caveat (body-keying)

The spec requires a cache key that **incorporates the request body**. Origin-
side tools like `@fastify/etag` and `@fastify/caching` key on the **results** or
the URL+method, and are safe because the body that produced a cached entry is
implicit in the entry itself.

**Shared intermediary caches (CDNs / proxies) key on method + URL only** and
are *not* body-aware — they can serve the wrong result for a different body
sent to the same URL. So:

- Do not let an untrusted shared cache store `QUERY` responses.
- Keep them `private` / `no-store` at the edge.
- Or place a body-aware cache in front.

Fastify likewise does not manage downstream caches for `GET`; the same
caveats apply.

## Next steps

- Set a [Content-Location](/guide/content-location) on `2xx` responses so
  caches can be revalidated via `GET`.
