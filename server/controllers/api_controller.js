import redis from "../db";

export async function getLoyaltySettings(shop) {
  try {
    // const result = await getDbDoc("active_shops", shop);
    const result = await redis.hgetall(getShopKey(shop));
    return result;
  } catch (error) {
    console.log("Error getting loyalty settings from DB", error);
  }
}

export async function postLoyalSettings(shop, settings) {
  try {
    return await redis.hmset(getShopKey(shop), settings);
  } catch (error) {
    console.error("Error writing loyalty settings to db", error);
  }
}

// db constants
// ============
const LOYALL_SETTINGS = "loyall:settings";

// helper functions
// ================
function getShopKey(shop) {
  return `${LOYALL_SETTINGS}:${shop}`;
}
