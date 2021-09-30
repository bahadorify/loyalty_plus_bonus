import Axios from "axios";
import Router from "koa-router";
import { generateJWT } from "../authHnadler";

const router = new Router({ prefix: "/loyall" });

// get bonus reservations for merchant
router.post("/merchants/:merchantId/bonusreservations", async (ctx) => {
  const { merchantId } = ctx.params;
  const { apiKey, endpoint } = ctx.request.body;
  const axios = authorize(apiKey);
  try {
    const response = await axios.get(
      `${endpoint}/merchants/${merchantId}/bonusreservations`
    );
    ctx.body = { status: response.status, data: response.data };
  } catch (error) {
    console.log("Entered merchant id is wrong.", error);
    if (error.code === "ENOTFOUND") {
      ctx.body = {
        status: "ENOTFOUND",
      };
    } else {
      ctx.body = {
        status: error.response.status,
        data: error.response.data,
      };
    }
  }
});

// get all members in program
router.post("/programs/:programId/members", async (ctx) => {
  const { apiKey, endpoint } = ctx.request.body;
  const { programId } = ctx.params;
  const axios = authorize(apiKey);
  try {
    const response = await axios.get(
      `${endpoint}/programs/${programId}/members`
    );
    ctx.body = { status: response.status, data: response.data };
  } catch (error) {
    console.log("Entered program id is wrong.");
    if (error.code === "ENOTFOUND") {
      ctx.body = {
        status: "ENOTFOUND",
      };
    } else {
      ctx.body = {
        status: error.response.status,
        data: error.response.data,
      };
    }
  }
});

// join bonus program, returns phone number
router.post("/programs/memberregistration/:shop", async (ctx) => {
  try {
    const { programId, apiKey, endpoint } = await getApiSettings(ctx);
    const { phoneNumber, email } = ctx.request.body;
    const axios = authorize(apiKey);
    // const joinResult = await axios.post(
    //   `${endpoint}/programs/${programId}/memberregistration`,
    //   {
    //     phoneNumber,
    //     email,
    //   }
    // );
    // send verification code to mobil
    await axios.post(
      `${endpoint}/programs/${programId}/members/createverificationcode`,
      {
        phoneNumber,
        expiresIn: 600,
        language: "en",
      }
    );

    ctx.body = { phoneNumber };
  } catch (error) {
    console.log("CANNOT REGISTER MEMBER", error);
  }
});

// get verification code on phone
router.post("/programs/members/createverificationcode/:shop", async (ctx) => {
  try {
    const { programId, apiKey, endpoint } = await getApiSettings(ctx);
    const axios = authorize(apiKey);
    const result = await axios.post(
      `${endpoint}/programs/${programId}/members/createverificationcode`,
      ctx.request.body
    );
    ctx.body = result.status;
  } catch (error) {
    console.log("CANNOT GET VERIFICATION CODE", error);
  }
});

// verify verification code
router.post("/programs/members/verifyverificationcode/:shop", async (ctx) => {
  try {
    const { programId, apiKey, endpoint } = await getApiSettings(ctx);
    const axios = authorize(apiKey);
    const { shop } = ctx.params;
    const { phoneNumber, code } = ctx.request.body;
    const result = await axios.post(
      `${endpoint}/programs/${programId}/members/verifyverificationcode`,
      { phoneNumber, code }
    );
    // check if phone number is member (has memberId)
    const memberResult = await axios.get(
      `${endpoint}/programs/${programId}/members/byphone?phoneNumber=${phoneNumber}`
    );
    const member = memberResult.data[0];
    const memberId = member ? member.id : null;

    // generate JWT token and send to storefront
    const jwt = generateJWT({ memberId, phoneNumber, code, shop });
    ctx.body = {
      token: jwt,
      memberId,
      // status: result.status
    };
  } catch (error) {
    console.log("VERIFICATION error:", error);
    const { status } = error.response;
    if (status === 400 || status === 404) {
      ctx.body = error.response.data;
    } else {
      console.log("CANNOT VERIFY CODE");
    }
  }
});

// Calculate order bonus (check terminalId and baxNumber)
router.post("/merchants/:merchantId/orderbonus", async (ctx) => {
  try {
    const { merchantId } = ctx.params;
    const { apiKey, endpoint, terminalId, baxNumber } = ctx.request.body;
    const axios = authorize(apiKey);
    const result = await axios.post(
      `${endpoint}/merchants/${merchantId}/orderbonus`,
      {
        terminalId,
        baxNumber,
        transactionSum: 1000,
      }
    );
    console.log("BAX", result.data);
    ctx.body = { status: result.status, body: result.body };
  } catch (error) {
    console.log("TERMINAL ERROR", error.response.status);
    ctx.body = {
      status: error.response.status,
      data: error.response.data,
    };
  }
});

/**
 * Calculate default order bonus
 * Will return how much bonus this order will generate for a new/non-registered member
 */
router.get("/merchants/orderbonus/:shop", async (ctx) => {
  try {
    const { price } = ctx.query;
    const {
      programId,
      apiKey,
      endpoint,
      merchantId,
      terminalId,
      baxNumber,
    } = await getApiSettings(ctx);

    const axios = authorize(apiKey);
    const bonusResult = await axios.post(
      `${endpoint}/merchants/${merchantId}/orderbonus`,
      {
        terminalId,
        baxNumber,
        transactionSum: price,
      }
    );
    ctx.body = bonusResult.data;
  } catch (error) {
    console.log("Cannot get default order bonus", error);
  }
});

// get member and bonus
router.get("/programs/members/byphone/:shop", async (ctx) => {
  try {
    const { phoneNumber, memberId, price } = ctx.query;
    // check if member exists
    if (memberId) {
      const {
        programId,
        apiKey,
        endpoint,
        merchantId,
        terminalId,
        baxNumber,
      } = await getApiSettings(ctx);
      const axios = authorize(apiKey);
      const availableBonusResult = await axios.get(
        `${endpoint}/merchants/${merchantId}/bonus/${memberId}`
      );

      const bonusResult = await axios.post(
        `${endpoint}/merchants/${merchantId}/orderbonus/${memberId}`,
        {
          terminalId,
          baxNumber,
          transactionSum: price,
        }
      );

      const { availableBonus } = availableBonusResult.data;
      const productBonus = bonusResult.data;

      ctx.body = {
        memberId,
        availableBonus,
        productBonus,
      };
    } else {
      ctx.body = { memberId };
    }
  } catch (error) {
    console.log("CANNOT GET MEMBER STATUS", error);
  }
});

// get member
router.get("/programs/members/byphone/justmember/:shop", async (ctx) => {
  try {
    const { phoneNumber } = ctx.query;
    const { programId, apiKey, endpoint } = await getApiSettings(ctx);
    const axios = authorize(apiKey);

    const memberResult = await axios.get(
      `${endpoint}/programs/${programId}/members/byphone?phoneNumber=${phoneNumber}`
    );
    ctx.body = memberResult.data[0];
  } catch (error) {
    console.log("CANNOT GET MEMBER", error);
  }
});

export default router;

// helper functions
// ================
function authorize(token) {
  const instance = Axios.create();
  instance.interceptors.request.use((config) => {
    config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  });
  return instance;
}

async function getApiSettings(ctx) {
  const { shop } = ctx.params;
  const baseUrl = ctx.request.origin;
  const axiosNoAuth = Axios.create();
  const loyaltyApiResult = await axiosNoAuth.get(
    `${baseUrl}/api/loyalty-settings/${shop}`
  );
  return loyaltyApiResult.data;
}
