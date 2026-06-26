---
layout: home
title: "@thecodepace/fastify-http-query"
hero:
  name: "@thecodepace/fastify-http-query"
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
