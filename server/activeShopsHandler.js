// activeShopsHandler

import redis from "./db";

// db keys
const ACTIVE_SHOPS = "shops:active";

export async function getActiveShops() {
  // const snapshot = await getAllDbDocs(ACTIVE_SHOPS);
  const result = await redis.smembers(ACTIVE_SHOPS);
  const activeShops = {};
  // if (!snapshot.empty) {
  //   snapshot.forEach((shop) => {
  //     activeShops[shop.id] = process.env.SCOPES;
  //   });
  // }
  result.forEach((shop) => {
    activeShops[shop] = process.env.SCOPES;
  });
  return activeShops;
}

export async function addActiveShop(shop) {
  // await updateDbDoc(ACTIVE_SHOPS, shop, { scope });
  await redis.sadd(ACTIVE_SHOPS, shop);
}

export async function deleteActiveShop(shop) {
  // await deleteDbDoc(ACTIVE_SHOPS, shop);
  await redis.srem(ACTIVE_SHOPS, shop);
}
