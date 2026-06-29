# What is HTTP QUERY?

`QUERY` is an HTTP method defined by the IETF draft
[_HTTP QUERY Method_](https://httpwg.org/http-extensions/draft-ietf-httpbis-safe-method-w-body.html)
(`draft-ietf-httpbis-safe-method-w-body`). It is meant for the common case where
a client needs to **describe a query** (filters, projections, paging, joins…)
and the server decides how to satisfy it.

## Why a new method?

Three properties distinguish `QUERY` from the verbs you already know:

- **Safe** — calling it does not request a change to the target resource. Like
  `GET`, it can be retried freely.
- **Idempotent** — repeated identical calls produce the same observable
  effect. Like `GET` and `PUT`.
- **Cacheable** — responses can be stored and reused, with the same
  `Cache-Control`, `ETag` / `If-None-Match`, and freshness rules as `GET`.

The key difference from `GET`: `QUERY` **carries a body**. `GET` is restricted
to the URL, which makes complex query descriptions awkward (long query
strings, server-side URL-length limits, opaque encoded blobs). `QUERY` lets
the body carry the description in whatever media type fits — JSON, CQL,
GraphQL, SQL — while keeping the method safe.

## When to use it

Use `QUERY` whenever you would reach for `GET` but the query itself is too
rich, structured, or sensitive for a URL. Typical cases:

- Search endpoints with structured filters (`POST` is the common workaround;
  `QUERY` is the explicit, cache-friendly answer).
- GraphQL-style "send me a query document" endpoints without violating the
  `POST`-everywhere convention some CDNs enforce.
- Read-only RPC where the body is the request and the response is
  cacheable.

Do **not** use `QUERY` to mutate state — `POST`, `PUT`, `PATCH`, and `DELETE`
remain the right tools there.

## What the spec requires of a server

A server that supports `QUERY` is required to:

- Accept a request body and parse it according to the `Content-Type`.
- Reject requests **without** a `Content-Type` header.
- Reject requests **without** a body.
- Treat the response as cacheable and respect `Cache-Control`, `ETag`, and
  conditional headers (`If-None-Match`).
- Optionally set a `Content-Location` on `2xx` responses pointing at a
  `GET`-able representation of the same result.

This plugin enforces the first three and lets you opt in to the caching and
conditional-request behaviour via the standard Fastify ecosystem plugins.

## Reference

- IETF draft: [draft-ietf-httpbis-safe-method-w-body](https://httpwg.org/http-extensions/draft-ietf-httpbis-safe-method-w-body.html)
