# Error codes

The plugin throws two `FastifyError` subclasses, both with `statusCode: 400`.
They are created with
[`@fastify/error`](https://github.com/fastify/fastify-error), so each has a
stable `code` you can match against, plus a `statusCode` of `400`.

## Reference

| Constructor | `code` | `statusCode` | When |
| --- | --- | --- | --- |
| `MissingContentTypeError` | `FST_ERR_QUERY_MISSING_CONTENT_TYPE` | `400` | `QUERY` request arrived without a `Content-Type` header. |
| `EmptyBodyError` | `FST_ERR_QUERY_EMPTY_BODY` | `400` | `QUERY` request arrived with no body (no `Content-Length > 0` and no `Transfer-Encoding`). |

## Source

Both constructors are created in
[`index.js`](https://github.com/TheCodePace/fastify-http-query/blob/main/index.js)
and re-exported from
[`types/index.d.ts`](https://github.com/TheCodePace/fastify-http-query/blob/main/types/index.d.ts).

```js
// index.js
export const MissingContentTypeError = createError(
  'FST_ERR_QUERY_MISSING_CONTENT_TYPE',
  'QUERY requests must include a Content-Type header',
  400
)

export const EmptyBodyError = createError(
  'FST_ERR_QUERY_EMPTY_BODY',
  'QUERY requests must include a request body',
  400
)
```

## Matching them

The exported constructors are real classes, so you can use `instanceof`:

```js
import {
  MissingContentTypeError,
  EmptyBodyError
} from '@thecodepace/fastify-http-query'

app.setErrorHandler((error, request, reply) => {
  if (error instanceof MissingContentTypeError) {
    // Surface a friendlier message; status is already 400.
    reply.send({ error: 'missing_content_type' })
    return
  }
  if (error instanceof EmptyBodyError) {
    reply.send({ error: 'empty_body' })
    return
  }
  reply.send(error)
})
```

Or match on the `code` string if you would rather not import the classes:

```js
app.setErrorHandler((error, request, reply) => {
  if (error.code === 'FST_ERR_QUERY_MISSING_CONTENT_TYPE') { /* ... */ }
  if (error.code === 'FST_ERR_QUERY_EMPTY_BODY') { /* ... */ }
  reply.send(error)
})
```

## Why these errors exist

Both errors enforce the parts of
[draft-ietf-httpbis-safe-method-w-body](https://httpwg.org/http-extensions/draft-ietf-httpbis-safe-method-w-body.html)
that a server is **required** to enforce:

- "Servers MUST fail the request if the `Content-Type` request field is
  missing or is inconsistent with the request content."
- "The content of the request and its media type define the query." A `QUERY`
  request without content has no query to perform.
