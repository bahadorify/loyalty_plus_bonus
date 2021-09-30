import React, { useEffect, useState } from "react";
import { ResourcePicker } from "@shopify/app-bridge-react";
import { Card, Layout, Page } from "@shopify/polaris";
import store from "store-js";
import Install from "../components/install";
import LoyallSettings from "../components/LoyallSettings";
import Info from "../components/Info";

export default function index({ shopOrigin }) {
  return (
    <Page title="Settings">
      <Layout>
        <Info />
        <LoyallSettings shopOrigin={shopOrigin} />
        <Install shopOrigin={shopOrigin} />
      </Layout>
    </Page>
  );
}
