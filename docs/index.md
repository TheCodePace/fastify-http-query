---
layout: home
title: "@thecodepace/fastify-http-query"
hero:
  name: "fastify-http-query"
  text: Fastify HTTP QUERY method plugin
  tagline: Enable the safe, idempotent, cacheable HTTP QUERY method in Fastify.
  actions:
    - theme: brand
      text: Get started
      link: /guide/what-is-query
    - theme: alt
      text: API reference
      link: /api/
    - theme: alt
      text: View on GitHub
      link: https://github.com/TheCodePace/fastify-http-query
features:
  - title: HTTP QUERY, native to Fastify
    details: Registers the QUERY method with Fastify's router and adds an `app.query()` shorthand — the same ergonomics as `app.get()` for a method that carries its query in the body.
  - title: Spec-strict by default
    details: Rejects QUERY requests without a Content-Type header or without a body, returning the precise errors the IETF draft requires a server to enforce.
  - title: Plays well with the Fastify ecosystem
    details: Conditional requests and caching are composed from @fastify/etag and @fastify/caching — the same way you would for GET. No bespoke cache.
---

::: warning Deprecated
This package is deprecated and no longer needed on Fastify `>= 5.11.0`.

Native support for the HTTP `QUERY` method ([RFC 10008](https://datatracker.ietf.org/doc/html/rfc10008)) is built into Fastify core starting from **[v5.11.0](https://github.com/fastify/fastify/releases/tag/v5.11.0)** ([#6832](https://github.com/fastify/fastify/pull/6832)), including `QUERY` in `supportedMethods`, the `fastify.query()` shorthand, TypeScript types, and `Content-Type` header enforcement (`FST_ERR_ROUTE_MISSING_CONTENT_TYPE`).

**Migration:** Upgrade to `fastify >= 5.11.0` (or `>= 5.12.6` if you rely on media types that allow an empty body, fixed in [#7060](https://github.com/fastify/fastify/pull/7060)), uninstall `@thecodepace/fastify-http-query`, and remove `app.register(fastifyHttpQuery)`. Your `app.query()` routes will work out of the box. If your code checks for `FST_ERR_QUERY_MISSING_CONTENT_TYPE`, switch to Fastify's `FST_ERR_ROUTE_MISSING_CONTENT_TYPE`.
:::

## What is this?

`@thecodepace/fastify-http-query` is a Fastify plugin that enables the
[HTTP QUERY method](https://httpwg.org/http-extensions/draft-ietf-httpbis-safe-method-w-body.html).
`QUERY` is a **safe, idempotent, cacheable** HTTP method that — unlike `GET` —
carries a request **body** describing the query operation.

This documentation site complements the project's
[README](https://github.com/TheCodePace/fastify-http-query#readme) and
[CHANGELOG](https://github.com/TheCodePace/fastify-http-query/blob/main/CHANGELOG.md).
The README stays the canonical install/usage reference; this site adds a
navigable surface for the parts that benefit from a sidebar: the API reference,
the error codes, and the integration patterns.

## Where to next

- New to HTTP QUERY? Start with [What is HTTP QUERY?](/guide/what-is-query)
- Ready to install? Jump to [Installation](/guide/installation)
- Looking for a specific symbol? Check the [API reference](/api/)
- Hitting an error code? See [Error codes](/errors/)
