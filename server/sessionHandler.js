import { Session } from "@shopify/shopify-api/dist/auth/session";
import redis from "./db";

// db keys
const SESSIONS = "sessions";

export async function storeCallback(session) {
  const { shop, id } = session;
  try {
    // redis
    // session:shop:id
    // 1. check redis if key for shop's session exists
    let sessionIds = await redis.keys(`${SESSIONS}:${shop}:*`);
    const pipeline = redis.pipeline();
    // delete all exisiting sessions for shop
    // except ones containing "myshopify.com" in session id
    if (sessionIds.length) {
      sessionIds = sessionIds.filter((value) => {
        // const re = /session:.+:.+myshopify\.com.*/;
        const re = new RegExp(`${SESSIONS}:.+:.+myshopify\.com.*`);
        return !value.match(re);
      });
      console.log("\nIDS TO BE DELETED:", sessionIds);
      pipeline.del(sessionIds);
    }
    // write session to new hash
    pipeline.hmset(`${SESSIONS}:${shop}:${id}`, { ...session });

    const pipeRes = await pipeline.exec();
    console.log("Wrote session to REDIS", id, pipeRes);
    //
    return true;
  } catch (error) {
    console.error("ERROR StoreCB", error);
  }
}

export async function loadCallback(id) {
  try {
    console.log("loadCallback", id);
    if (!id) return false;

    const keys = await redis.keys(`${SESSIONS}:*:${id}`);
    const session = await redis.hgetall(keys[0]);
    if (session.onlineAccessInfo)
      session.onlineAccessInfo = JSON.parse(session.onlineAccessInfo);

    // console.log("REDIS load:\n=====\n", session);
    return Object.assign(new Session(), session);
  } catch (error) {
    console.error("Error session loadCallback", error);
    return false;
  }
}

export async function deleteCallback(id) {
  try {
    let sessionIds = await redis.keys(`${SESSIONS}:*:${id}`);
    if (sessionIds.length) redis.del(sessionIds);
    console.log("deleteCallback", id);
    await deleteDbDoc("sessions", id);
  } catch (error) {
    console.error("ERROR DELETEcb", error);
  }
}
