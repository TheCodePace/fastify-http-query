# @thecodepace/fastify-http-query

[![CI](https://github.com/thecodepace/fastify-http-query/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/thecodepace/fastify-http-query/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/@thecodepace/fastify-http-query.svg?style=flat)](https://www.npmjs.com/package/@thecodepace/fastify-http-query)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-brightgreen?style=flat)](https://github.com/neostandard/neostandard)

Fastify HTTP `QUERY` plugin; with this you can enable the HTTP `QUERY` method in Fastify.

`QUERY` is a **safe, idempotent, cacheable** HTTP method that — unlike `GET` —
carries a request **body** describing the query operation. It is defined by the
IETF draft
[_HTTP QUERY Method_](https://httpwg.org/http-extensions/draft-ietf-httpbis-safe-method-w-body.html)
(`draft-ietf-httpbis-safe-method-w-body`).

## Install

```
npm i @thecodepace/fastify-http-query
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
| Cacheable responses / `Cache-Control` | via [`@fastify/caching`](https://github.com/fastify/fastify-caching) — see below |
| Conditional requests (`ETag` / `304`) | via [`@fastify/etag`](https://github.com/fastify/fastify-etag) — ETag from results |
| `Content-Location` on 2xx | set by your handler — see below |
| Range / partial requests | not implemented (spec §2.8) |

## Caching & conditional requests

`QUERY` responses are **cacheable** and support **conditional requests**, just
like `GET`. This plugin follows Fastify's model: **core enables the method;
caching is composed from the ecosystem** — exactly as you would cache `GET`.
There is no bespoke cache here.

### Conditional requests (`ETag` / `304`) with `@fastify/etag`

[`@fastify/etag`](https://github.com/fastify/fastify-etag) computes an `ETag`
from the **response payload** and answers `If-None-Match` with `304`. Because the
ETag is derived from the **results**, two `QUERY` requests with different bodies
naturally produce different ETags — so conditional handling is correct for
`QUERY` with no extra configuration.

```js
import fastifyHttpQuery from '@thecodepace/fastify-http-query'
import etag from '@fastify/etag'

await app.register(fastifyHttpQuery)
await app.register(etag)

app.query('/search', (request) => runSearch(request.body))
// QUERY /search {"q":"a"}                         -> 200, ETag: "…"
// QUERY /search {"q":"a"}  If-None-Match: "…"      -> 304 Not Modified
// QUERY /search {"q":"b"}  If-None-Match: "<a>"    -> 200 (different results)
```

### `Cache-Control` with `@fastify/caching`

[`@fastify/caching`](https://github.com/fastify/fastify-caching) manages
`Cache-Control`/`Expires` and provides `reply.etag()`:

```js
import caching from '@fastify/caching'

await app.register(caching, { privacy: caching.privacy.PRIVATE, expiresIn: 3600 })
// QUERY responses now carry: Cache-Control: private, max-age=3600
```

### ⚠️ Shared-cache caveat (body-keying)

The spec requires a cache key that **incorporates the request body**. Origin-side
tools above key on the **results** and are safe. However, **shared intermediary
caches (CDNs/proxies) key on method + URL only** and are *not* body-aware — they
can serve the wrong result for a different body sent to the same URL. So do not
let an untrusted shared cache store `QUERY` responses: keep them `private` /
`no-store` at the edge, or place a body-aware cache in front. (Fastify likewise
does not manage downstream caches for `GET`.)

### `Content-Location` (spec §2.3)

A successful response _may_ name a `GET`-able resource for the results. Set it in
your handler:

```js
app.query('/search', async (request, reply) => {
  const { id, results } = await runSearch(request.body)
  reply.header('content-location', `/search/results/${id}`)
  return results
})
```

### Not implemented

- **Range/partial requests** (spec §2.8) — the spec itself notes byte ranges
  "offer little value" for query results; use your query format's own paging.

## Safety & idempotency

`QUERY` is **safe** (it does not request a change to the target resource) and
**idempotent**. Treat your `QUERY` handlers accordingly — do not mutate state.

## Commit conventions

This project uses [Conventional Commits](https://www.conventionalcommits.org/),
enforced locally by [lefthook](https://lefthook.com/) + [commitlint](https://commitlint.js.org/)
and in CI by `.github/workflows/commitlint.yml`.

- `commit-msg` hook → `commitlint` (config in `commitlint.config.mjs`,
  extends `@commitlint/config-conventional`).
- `pre-commit` hook → `eslint` on staged files, then `npm test`.
- On every PR, the `Lint commits` workflow runs **two jobs**:
  - `commitlint` — lints every commit in the PR with
    `commitlint --from <base> --to <head>`.
  - `pr-title` — lints the PR title itself with
    [`wagoid/commitlint-github-action`](https://github.com/wagoid/commitlint-github-action),
    using the same `commitlint.config.mjs`. This matters when the PR is
    squash- or rebase-merged, since the title becomes the commit message
    on `main`.

Allowed types follow the conventional preset (`feat`, `fix`, `chore`,
`docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `revert`).

After cloning, run `npm install` (or `npx lefthook install` manually if
`ignore-scripts=true` is set in `.npmrc`) to install the Git hooks.

## Releasing

Releases are driven by [`standard-version`](https://github.com/conventional-changelog/standard-version),
which reads the Conventional Commits history to determine the next SemVer bump,
updates `package.json`, generates `CHANGELOG.md`, and creates a Git tag.

Available scripts:

| Script | Purpose |
| --- | --- |
| `npm run release:dry` | Preview the next version, changelog, and tag without writing anything. |
| `npm run release` | Bump the version, update the changelog, and create the tag. |
| `npm run release:first` | Tag the very first release (e.g. `1.0.0`) without re-bumping `package.json`. |

### Release flow

1. Make sure `main` is clean and all changes are merged.
2. Run `npm run release:dry` to confirm the next version, the changelog entry,
   and the commit/tag messages look right.
3. Run `npm run release`. This will:
   - Bump `package.json` according to the commits since the last tag.
   - Regenerate `CHANGELOG.md`.
   - Create a release commit and an annotated `vX.Y.Z` tag (the
     `pre-commit` lefthook hook — `eslint` + `npm test` — runs against the
     release commit; pass `--no-verify` only if you know why).
4. Push the branch and the tag:
   ```sh
   git push --follow-tags origin main
   ```
5. Publish to npm:
   ```sh
   npm publish
   ```

### Forcing a specific bump

To override the auto-detected bump, pass `--release-as` to `standard-version`
(e.g. `npx standard-version --release-as minor`). This is useful for the
occasional case where a `feat:` was missed or you want a hotfix `patch` on top
of a feature-only window.

## License

Licensed under [MIT](./LICENSE).
