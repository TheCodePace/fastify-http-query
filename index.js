import fp from "fastify-plugin";

async function fastifyHttpQuery(fastify, options, next) {}

export default fp(fastifyHttpQuery, {
  fastify: "5.x",
  name: "@thecodespace/fastify-http-query",
});
export { fastifyHttpQuery };
