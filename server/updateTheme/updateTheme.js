import Axios from "axios";
import fs from "fs";
import path from "path";
import { updateList, newUploadsList } from "./updateList";

const themeApi = "admin/api/2021-04/";
export async function updateTheme(shop, accessToken) {
  const axios = Axios.create({
    baseURL: `https://${shop}/${themeApi}`,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
  });
  try {
    const mainThemeId = await getThemeId(axios);
    if (!mainThemeId) return;

    // update assets
    updateList.forEach(async (li) => {
      await updateAsset(mainThemeId, axios, li.key, li.filePath, li.toReplace, li.setAfter);
    });

    // upload assets
    newUploadsList.forEach(async (li) => {
      await uploadLiquidToTheme(
        axios,
        mainThemeId,
        getFile(li.filePath),
        li.key
      );
    });

    // set HOST from .env file into loayltyVars
    const loayltyVarsRaw = getFile("../../liquid/snippets/loyalty-vars.liquid");
    const loayltyVars = `${loayltyVarsRaw}`.replace(
      "hereGoesLoyaltyHostName",
      `${process.env.HOST}`
    );
    await uploadLiquidToTheme(
      axios,
      mainThemeId,
      loayltyVars,
      "snippets/loyalty-vars.liquid"
    );
  } catch (error) {
    console.log("update theme error:", error);
    // console.log("update theme error data:", error.response);
  }
}

async function uploadLiquidToTheme(axios, id, page, pageName) {
  const body = {
    asset: {
      key: pageName,
      value: `${page}`,
    },
  };
  await axios.put(`/themes/${id}/assets.json`, body);
  console.log("Upload page", pageName);
}

function getFile(fileName) {
  return fs.readFileSync(path.resolve(__dirname, fileName));
}

async function updateAsset(id, axios, key, filePath, toReplace, setAfter = false) {
  try {
    const { data } = await axios.get(
      `/themes/${id}/assets.json?asset[key]=${key}`
    );
    console.log("Theme liquid file");
    if (!data.asset.value) return;

    const snippet = getFile(filePath);
    let newPage = data.asset.value;
    console.log("snippet", snippet);
    if (newPage.includes(snippet)) {
      console.log(`Asset already has the snippet installed: ${key}`);
      return;
    }
    for (let text of toReplace) {
      if (newPage.includes(text)) {
        newPage = setAfter ?  
        data.asset.value.replace(text, `${text}\n${snippet}\n`)
        : data.asset.value.replace(text, `\n${snippet}\n${text}`);
        if (newPage) {
          await uploadLiquidToTheme(axios, id, newPage, key);
          console.log(`Asset updated: ${key}. Replaced text: ${text}`);
        }
        return;
      }
    }
    console.log(`Could not update the file ${key}`);
  } catch (error) {
    console.log(`Error - file not found on theme: ${key}`);
  }
}

async function getThemeId(axios) {
  const { data } = await axios.get("/themes.json");
  // console.log("Themes found: ", data);
  const mainTheme = data.themes.find((theme) => theme.role === "main");
  if (!mainTheme) {
    console.log("No main theme found!");
    return;
  }
  // console.log("The main theme is :", mainTheme);
  console.log("The main theme is :", mainTheme.id, mainTheme.name);

  return mainTheme.id;
}
