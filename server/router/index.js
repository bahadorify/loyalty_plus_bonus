import combinedRouters from "koa-combine-routers";
import scriptTagRouter from "./script_tag";
import apiRouter from "./api";
import loyallRouter from "./loyall";
import discountsRouter from "./discounts";
import webhookRouter from "./webhook";
import transactionsRouter from "./transactions";

const router = combinedRouters(
  scriptTagRouter,
  apiRouter,
  loyallRouter,
  discountsRouter,
  webhookRouter,
  transactionsRouter
);

export default router;
