# Installation

```sh
npm i @thecodepace/fastify-http-query
```

## Requirements

The plugin requires a Node.js version that lists `QUERY` in
[`http.METHODS`](https://nodejs.org/api/http.html#httpmethods) — i.e.
**Node.js `>= 22`**. On older runtimes, the HTTP parser rejects `QUERY`
requests before they reach the application.

## Compatibility

| Plugin version | Fastify version |
| -------------- | --------------- |
| `>= 1.x`       | `^5.x`          |

When a Fastify version is out of support, so are the corresponding versions
of this plugin. See
[Fastify's LTS policy](https://github.com/fastify/fastify/blob/main/docs/Reference/LTS.md)
for the current support window.

## Next steps

- [Quick start](/guide/quick-start) — register the plugin and define your
  first `app.query()` route.
- [API reference](/api/) — the exact symbols exported by the plugin and
  their TypeScript surface.
