import axios from "axios";

export async function createWebhook(shop, token, webhook) {
  const url = getCreateWebhookUrl(shop);
  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": token,
  };
  const body = {
    webhook,
  };
  console.log(webhook);
  try {
    const result = await axios.post(url, body, { headers });
    console.log("Created webhook:::", result.data);
    return result.data;
  } catch (error) {
    console.error("Error creating a new webhook: ", error.response.data);
  }
}

function getBaseUrl(shop) {
  return `https://${shop}`;
}

function getCreateWebhookUrl(shop) {
  return `${getBaseUrl(shop)}/admin/api/2021-04/webhooks.json`;
}
