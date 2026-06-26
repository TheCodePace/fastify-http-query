# Why this plugin?

The HTTP parser in Node.js has accepted the `QUERY` method since
[`http.METHODS`](https://nodejs.org/api/http.html#httpmethods) started listing
it (Node.js `>= 22`). So the bytes come in cleanly — but Fastify's router and
shorthand layer does not know about `QUERY` out of the box.

Without this plugin you would have to:

1. Call `fastify.addHttpMethod('QUERY', { hasBody: true })` yourself, guarding
   against double registration.
2. Add an `onRequest` hook that enforces the spec's "Content-Type required"
   and "body required" rules, throwing `400`s for both cases.
3. Reimplement the `app.query()` route shorthand so you can write
   `app.query('/search', handler)` instead of the more verbose route options.
4. Ship consistent error codes that consumers can `instanceof`-check.

This plugin does all four, in about fifty lines, and exposes the error
constructors as named exports so consumers can pattern-match them.

## What it does not do

- It does not cache responses for you. `@fastify/caching` does, and the spec
  treats caching as orthogonal to the method itself.
- It does not compute ETags. `@fastify/etag` does, and it works on `QUERY`
  responses out of the box because ETags are derived from the response body.
- It does not implement byte-range / partial responses (spec §2.8). The draft
  itself notes that byte ranges "offer little value" for query results; use
  your query format's own paging instead.

The philosophy is the same as Fastify's for `GET`: the **core enables the
method**, **caching and conditional handling are composed from the ecosystem**.

## See also

- [Installation](/guide/installation)
- [Quick start](/guide/quick-start)
- [API reference](/api/)
