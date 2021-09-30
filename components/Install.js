import { Layout, SettingToggle, TextStyle } from "@shopify/polaris";
import React, { useState, useEffect } from "react";
import useAxios from "../hooks/useAxios";

function Install({ shopOrigin }) {
  const axios = useAxios();
  const [isInstalled, setIsInstalled] = useState(false);
  const [scriptTagId, setScriptTagId] = useState("");
  // const ST_URL = `${process.env.HOST}/script_tag`;
  const ST_URL = `${process.env.HOST}/script_tag`;
  const ST_SRC = "https://myshopify.com/";
  const titleText = isInstalled ? "Uninstall" : "Install";

  async function setInitialInstalled() {
    let { data } = await axios.get(`${ST_URL}/all?src=${ST_SRC}`);
    console.log("script tag data installation", data);
    if (data.status === 401) {
      window.location.replace(`${ST_URL}/auth?shop=${shopOrigin}`);
    }
    setIsInstalled(data.installed);
    if (data.installed) {
      setScriptTagId(data.script_tags[0].id);
    }
  }
  useEffect(() => {
    setInitialInstalled();
  }, []);

  async function handleAction() {
    if (!isInstalled) {
      const result = await axios.post(ST_URL, { src: ST_SRC });
      setScriptTagId(result.data.script_tag.id);
      if (result.status === 200) console.log("Installed!");
    } else {
      const result = await axios.delete(`${ST_URL}?id=${scriptTagId}`);
      if (result.status === 200) console.log("Uninstalled!");
    }
    setIsInstalled(!isInstalled);
  }
  return (
    <Layout.AnnotatedSection
      title={`${titleText} Loyalty+`}
      description="Toggle Loyalty+ installation on your shop. To see the changes, please wait a few seconds."
    >
      <SettingToggle
        action={{
          content: titleText,
          onAction: handleAction,
        }}
        enabled={true}
      >
        Loyalty+ components are{" "}
        <TextStyle variation="strong">
          {isInstalled ? "installed" : "uninstalled"}.
        </TextStyle>
      </SettingToggle>
    </Layout.AnnotatedSection>
  );
}

export default Install;
