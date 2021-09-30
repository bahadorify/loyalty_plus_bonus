import Router from "koa-router";
import { createWebhook } from "../controllers/webhook_controller";
import { getSessionData } from "../db/session";

const router = new Router({ prefix: "/webhooks" });

router.post("/create_order/:shop", async (ctx) => {
  const { shop, accessToken } = ctx.sessionFromToken
    ? ctx.sessionFromToken
    : await getSessionData(ctx);

  const webhook = {
    topic: "orders/create",
    address: `${process.env.HOST}/transactions/order_created/${shop}`,
    format: "json",
  };

  const result = await createWebhook(shop, accessToken, webhook);
  ctx.body = result;
});

export default router;
