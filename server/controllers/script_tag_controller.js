import axios from "axios";

export async function createScriptTag(shop, token, src) {
  const url = getCreateScriptTagUrl(shop);
  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": token,
  };
  const body = {
    script_tag: {
      event: "onload",
      src,
    },
  };
  try {
    const result = await axios.post(url, body, { headers });
    console.log("All my script tags:::", result.data);
    return result.data;
  } catch (error) {
    console.error("Error creating a new tag: ", error);
  }
}

export async function getAllScriptTags(shop, token, src) {
  const url = getAllScriptTagsUrl(shop, src);
  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": token,
  };
  try {
    const result = await axios.get(url, { headers });
    const { script_tags } = result.data;
    if (src)
      return {
        script_tags,
        installed: !!script_tags.length,
      };
    console.log(result.data);
    return result.data;
  } catch (error) {
    console.error("Error getting all script tags: ", error.response.status);
    if (error.response.status === 401) {
      return { status: 401 };
    }
  }
}

export async function deleteScriptTag(shop, token, id) {
  const url = getDeleteScriptTagUrl(shop, id);
  const headers = {
    "Content-Type": "application/json",
    "X-Shopify-Access-Token": token,
  };
  try {
    const result = await axios.delete(url, { headers });
    return result;
  } catch (error) {
    console.error("Error deleting script tag: ", error);
  }
}

function getBaseUrl(shop) {
  return `https://${shop}`;
}

function getAllScriptTagsUrl(shop, src) {
  const query = src ? `?src=${src}` : "";
  return `${getBaseUrl(shop)}/admin/api/2021-01/script_tags.json${query}`;
}

function getScriptTagUrl(shop, id) {
  return `${getBaseUrl(shop)}/admin/api/2021-01/script_tags/${id}.json`;
}

function getCreateScriptTagUrl(shop) {
  return `${getBaseUrl(shop)}/admin/api/2021-01/script_tags.json`;
}

function getDeleteScriptTagUrl(shop, id) {
  return `${getBaseUrl(shop)}/admin/api/2021-01/script_tags/${id}.json`;
}
