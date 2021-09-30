import Axios from "axios";
import { v4 as uuidv4 } from "uuid";
import Router from "koa-router";
import { getAccessToken } from "../db/session";
import { verifyJWT } from "../authHnadler";

const router = new Router({ prefix: "/discounts" });

// get price rules
router.get("/price_rules/:shop", async (ctx) => {
  const { shop, accessToken } = await getSessionData(ctx);
  const axios = authorize(accessToken);
  const url = getPriceRuleUrl(shop);
  const result = await axios.get(url);
  ctx.body = result.data;
});

// create price rule
router.post("/price_rules/:shop", async (ctx) => {
  const { shop, accessToken } = await getSessionData(ctx);
  const axios = authorize(accessToken);
  const url = getPriceRuleUrl(shop);
  const date = new Date();
  const { discountValue } = ctx.request.body;
  const body = {
    price_rule: {
      title: `LOYALTY${discountValue}`,
      target_type: "line_item",
      target_selection: "all",
      allocation_method: "across",
      value_type: "fixed_amount",
      value: `-${discountValue}`,
      customer_selection: "all",
      starts_at: date,
    },
  };
  const result = await axios.post(url, body);
  ctx.body = result.data;
});

// delete price rule by id and all its discount codes
router.delete("/price_rules/:shop/:pr_id/:resRef", async (ctx) => {
  try {
    // loyall api
    // get merchantId, apiKey,..
    const { merchantId, apiKey, endpoint } = await getApiSettings(ctx);
    const { resRef: reservationReference } = ctx.params;

    // Loyall API : create bonus reservation
    const axiosLoyall = authorizeLoyall(apiKey);
    const bonusRes = await axiosLoyall.delete(
      `${endpoint}/merchants/${merchantId}/bonusreservations/${reservationReference}`
    );

    // shopify api
    const { shop, accessToken } = await getSessionData(ctx);
    const axios = authorize(accessToken);
    const { pr_id } = ctx.params;
    const url = getDiscountCodeUrl(shop, pr_id);
    const dc_result = await axios.get(url);
    for (let code of dc_result.data.discount_codes) {
      const dc_id = code.id;
      const delUrl = getDiscountCodeIdUrl(shop, pr_id, dc_id);
      await axios.delete(delUrl);
    }
    const delUrl1 = getPriceRuleIdUrl(shop, pr_id);
    await axios.delete(delUrl1);

    ctx.body = {
      message: `Deleted price rule ${pr_id} and all of its discount codes`,
    };
  } catch (error) {
    console.log(error);
  }
});

// delete all price rules
router.delete("/price_rules/:shop", async (ctx) => {
  try {
    const { shop, accessToken } = await getSessionData(ctx);
    const axios = authorize(accessToken);
    const url = getPriceRuleUrl(shop);
    const result = await axios.get(url);
    for (let rule of result.data.price_rules) {
      const id = rule.id;
      const delUrl = getPriceRuleIdUrl(shop, id);
      await axios.delete(delUrl);
    }

    ctx.body = "deleted all price rules";
  } catch (error) {
    console.log(error);
  }
});

// get discount codes for price rule
router.get("/discount_codes/:shop/:pr_id", async (ctx) => {
  const { shop, accessToken } = await getSessionData(ctx);
  const { pr_id } = ctx.params;
  const axios = authorize(accessToken);
  const url = getDiscountCodeUrl(shop, pr_id);
  const result = await axios.get(url);
  ctx.body = result.data;
});

// get a single discount code and price rule
router.get("/discount_code/:shop/:pr_id/:dc_id", async (ctx) => {
  try {
    const { shop, accessToken } = await getSessionData(ctx);
    const { pr_id, dc_id } = ctx.params;
    const axios = authorize(accessToken);
    const urlDC = getSingleDiscountCodeUrl(shop, pr_id, dc_id);
    const urlPR = getSinglePriceRuleUrl(shop, pr_id);
    const resultDC = await axios.get(urlDC);
    const resultPR = await axios.get(urlPR);
    const result = {
      ...resultDC.data,
      ends_at: resultPR.data.price_rule.ends_at,
    };
    // console.log(`THIS IS SPARTA`);
    // console.log(resultPR);
    console.log(result);
    ctx.body = result;
  } catch (error) {
    console.log("Error fetching discount code", error);
  }
});

// create a discount code with price_rule
router.post("/discount_codes", async (ctx) => {
  try {
    const { host, "x-forwarded-proto": protocol } = ctx.request.header;
    const { discountValue, token } = ctx.request.body;
    const decoded = await verifyJWT(token, protocol, host);
    console.log("DEDCODEDD", decoded);
    const { shop, memberId } = decoded;

    // get merchantId, apiKey,..
    const { merchantId, apiKey, endpoint } = await getApiSettings(ctx, shop);
    const { accessToken } = await getSessionData(ctx, shop);
    // shopify API
    const axios = authorize(accessToken);
    const url = getPriceRuleUrl(shop);
    const date = new Date();
    // expires 6 hrs after creation
    const expirySeconds = 21600;
    const expriyDate = new Date(date.getTime() + expirySeconds * 1000);
    const discountCode = `LOYALTY${Math.floor(
      Math.random() * 10001
    )}OFF${discountValue}KR`;
    const body = {
      price_rule: {
        title: discountCode,
        target_type: "line_item",
        target_selection: "all",
        allocation_method: "across",
        value_type: "fixed_amount",
        value: `-${discountValue}`,
        customer_selection: "all",
        starts_at: date,
        ends_at: expriyDate,
        usage_limit: 1,
      },
    };
    const priceRuleResult = await axios.post(url, body);
    const priceRuleId = priceRuleResult.data.price_rule.id;
    const url1 = getDiscountCodeUrl(shop, priceRuleId);
    const body1 = {
      discount_code: {
        code: discountCode,
      },
    };
    const result = await axios.post(url1, body1);

    // Loyall API : create bonus reservation
    const axiosLoyall = authorizeLoyall(apiKey);
    const bonusRes = await axiosLoyall.post(
      `${endpoint}/merchants/${merchantId}/bonusreservation`,
      {
        memberId,
        reservationReference: uuidv4(),
        reservationAmount: discountValue,
        expiresIn: expirySeconds,
      }
    );

    // prepare response body
    ctx.body = {
      ...result.data.discount_code,
      discount_value: Number(discountValue) * 100,
      reservationReference: bonusRes.data.reservationReference,
    };
  } catch (error) {
    if (error.message === "Cannot verify jwt") ctx.status = 401;
    console.log("Something went wrong while generating the discount", error);
  }
});

// delete discount code by id
router.delete("/discount_codes/:shop/:pr_id/:dc_id", async (ctx) => {
  const { shop, accessToken } = await getSessionData(ctx);
  const { pr_id, dc_id } = ctx.params;
  const axios = authorize(accessToken);
  const url = getDiscountCodeIdUrl(shop, pr_id, dc_id);
  const result = await axios.delete(url);
  ctx.body = result.data;
});

// delete all discount codes and price rules
router.delete("/discount_codes/:shop", async (ctx) => {
  try {
    const { shop, accessToken } = await getSessionData(ctx);
    const axios = authorize(accessToken);
    const url = getPriceRuleUrl(shop);
    const result = await axios.get(url);
    for (let rule of result.data.price_rules) {
      const pr_id = rule.id;
      const url1 = getDiscountCodeUrl(shop, pr_id);
      const dc_result = await axios.get(url1);
      for (let code of dc_result.data.discount_codes) {
        const dc_id = code.id;
        const delUrl = getDiscountCodeIdUrl(shop, pr_id, dc_id);
        await axios.delete(delUrl);
      }
      const delUrl1 = getPriceRuleIdUrl(shop, pr_id);
      await axios.delete(delUrl1);
    }

    ctx.body = "deleted all discount codes and price rules";
  } catch (error) {
    console.log(error);
  }
});

/////////////////////////////////////////////////////////////
//******************************************************** */
// helper functions
// ================
function authorizeLoyall(token) {
  const instance = Axios.create();
  instance.interceptors.request.use((config) => {
    config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  });
  return instance;
}

async function getApiSettings(ctx, shop = undefined) {
  if (!shop) shop = ctx.params.shop;
  const baseUrl = ctx.request.origin;
  const axiosNoAuth = Axios.create();
  const loyaltyApiResult = await axiosNoAuth.get(
    `${baseUrl}/api/loyalty-settings/${shop}`
  );
  return loyaltyApiResult.data;
}

function authorize(token) {
  const instance = Axios.create();
  instance.interceptors.request.use((config) => {
    config.headers["Content-Type"] = `application/json`;
    config.headers["X-Shopify-Access-Token"] = `${token}`;
    return config;
  });
  return instance;
}

async function getSessionData(ctx, shop = undefined) {
  if (!shop) shop = ctx.params.shop;
  const accessToken = await getAccessToken(shop);
  return { shop, accessToken };
}

function getBaseUrl(shop) {
  return `https://${shop}`;
}

function getPriceRuleUrl(shop) {
  return `${getBaseUrl(shop)}/admin/api/2021-04/price_rules.json`;
}

function getSinglePriceRuleUrl(shop, id) {
  return `${getBaseUrl(shop)}/admin/api/2021-04/price_rules/${id}.json`;
}

function getPriceRuleIdUrl(shop, id) {
  return `${getBaseUrl(shop)}/admin/api/2021-04/price_rules/${id}.json`;
}

function getDiscountCodeUrl(shop, priceRuleId) {
  return `${getBaseUrl(
    shop
  )}/admin/api/2021-04/price_rules/${priceRuleId}/discount_codes.json`;
}

function getSingleDiscountCodeUrl(shop, priceRuleId, discountCodeId) {
  return `${getBaseUrl(
    shop
  )}/admin/api/2021-04/price_rules/${priceRuleId}/discount_codes/${discountCodeId}.json`;
}

function getDiscountCodeIdUrl(shop, priceRuleId, discountCodeId) {
  return `${getBaseUrl(
    shop
  )}/admin/api/2021-04/price_rules/${priceRuleId}/discount_codes/${discountCodeId}.json`;
}

export default router;
