import Router from "koa-router";
import {
  createScriptTag,
  deleteScriptTag,
  getAllScriptTags,
} from "../controllers/script_tag_controller";

const router = new Router({ prefix: "/script_tag" });

router.get("/", async (ctx) => {
  ctx.body = "Get a script tag";
});
router.get("/all", async (ctx) => {
  const { shop, accessToken } = ctx.sessionFromToken;
  try {
    const src = ctx.query?.src;
    const result = await getAllScriptTags(shop, accessToken, src);
    console.log("script tag result: ", result);
    ctx.body = result;
  } catch (error) {
    console.log("script tag error", error);
  }
});
router.post("/", async (ctx) => {
  const { shop, accessToken } = ctx.sessionFromToken;
  const { src } = ctx.request.body;
  const result = await createScriptTag(shop, accessToken, src);
  ctx.body = result;
});
router.delete("/", async (ctx) => {
  const { shop, accessToken } = ctx.sessionFromToken;
  const id = ctx.query?.id;
  if (id) {
    const result = await deleteScriptTag(shop, accessToken, id);
    ctx.body = result.status;
  }
});

export default router;
