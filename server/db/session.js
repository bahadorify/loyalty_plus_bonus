import redis from "./index";

//db keys
const SESSIONS = "sessions";

export async function getAccessToken(shop) {
  const keys = await redis.keys(`sessions:${shop}:${shop}*`);
  const key = keys[0];
  const accessToken = await redis.hget(key, "accessToken");
  return accessToken;
}

export async function getSessionData(ctx) {
  const { shop } = ctx.params;
  const accessToken = await getAccessToken(shop);
  return { shop, accessToken };
}
