import axios from "axios";
import Router from "koa-router";
import { verifyJWT } from "../authHnadler";
import {
  getLoyaltySettings,
  postLoyalSettings,
} from "../controllers/api_controller";

const router = new Router({ prefix: "/api" });

// authentication: verify jwt token
router.post("/verify-auth-token", async (ctx) => {
  try {
    const { token } = ctx.request.body;
    const decoded = verifyJWT(token);
    ctx.body = decoded;
  } catch (error) {
    console.log("verify-auth-token error", error);
    ctx.status = 401;
  }
});

// authentication: verify jwt token and return data
router.post("/verify-auth-token-get-data", async (ctx) => {
  try {
    const { host, "x-forwarded-proto": protocol } = ctx.request.header;
    const { token, price } = ctx.request.body;

    const decoded = await verifyJWT(token, protocol, host);

    // get member info
    const { shop, phoneNumber, memberId } = decoded;
    let url;
    let memberResponse = { data: {} };
    if (memberId) {
      url = `${protocol}://${host}/loyall/programs/members/byphone/${shop}?phoneNumber=${phoneNumber}&memberId=${memberId}&price=${price}`;
      memberResponse = await axios.get(url);
    }
    // send data to client
    ctx.body = { ...decoded, ...memberResponse.data };

    // decoded example {
    //   phoneNumber: '47999999',
    //   memberId: '12123252345',
    //   code: '70h5ta',
    //   shop: 'loyall-dev.myshopify.com',
    //   iat: 1631695846,
    //   exp: 1631717446
    // }
    // memberResponse example
    // {
    //   member: {
    //     id: 617829,
    //     firstName: 'Dev',
    //     lastName: 'Team',
    //     email: 'dev@omegamedia.no',
    //     phoneNumber: '4799999999',
    //     street: 'The street',
    //     zipCode: '5912',
    //     city: 'Bergen'
    //   },
    //   availableBonus: 10450270,
    //   productBonus: { bonusAmount: 5499.9, bonusPercent: 10 }
    // }
  } catch (error) {
    console.log("verify-auth-token error", error);
    ctx.status = 401;
  }
});

// get loyalty settings, shop from session
router.get("/loyalty-settings", async (ctx) => {
  const { shop } = ctx.sessionFromToken;
  const result = await getLoyaltySettings(shop);
  ctx.body = result;
});

// get loyalty settings, shop fron url
router.get("/loyalty-settings/:shop", async (ctx) => {
  const { shop } = ctx.params;
  const result = await getLoyaltySettings(shop);
  ctx.body = result;
});

router.post("/loyalty-settings", async (ctx) => {
  const { shop } = ctx.sessionFromToken;
  // request body in the following form
  // {apiKey, programId, merchantId, endpoint}
  const result = await postLoyalSettings(shop, ctx.request.body);
  ctx.body = result;
});
export default router;
