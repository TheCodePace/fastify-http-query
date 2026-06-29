# Content-Location

A successful `QUERY` response _may_ name a `GET`-able resource that represents
the same result. Set it in your handler:

```js
app.query('/search', async (request, reply) => {
  const { id, results } = await runSearch(request.body)
  reply.header('content-location', `/search/results/${id}`)
  return results
})
```

This lets a cache revalidate via `GET /search/results/<id>` instead of
re-sending the original `QUERY` body, and matches the convention a client
already understands for `GET` responses.

## When to use it

- The result is stable enough to be addressable as its own resource (a saved
  search, a paginated view, a materialized query).
- You want clients and intermediaries to be able to bookmark, link to, or
  share the result.

## When to skip it

- The result is ephemeral and only meaningful with the original query body.
- You do not have (or do not want to expose) a `GET`-able representation.

The spec describes this as a `MAY` — the field is optional.
