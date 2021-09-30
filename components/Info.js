import { Card, Layout, SettingToggle, TextStyle } from "@shopify/polaris";
import React from "react";

function info() {
  return (
    <Layout.AnnotatedSection
      title={`NB!`}
      description="Make sure to make the following changes in your store settings before using the app."
    >
      <Card sectioned>
        <TextStyle variation="strong">
          Make phone number on Checkout mandatory.
        </TextStyle>
        <ul>
          <li>
            Go to <em>Settings > Checkout > Form options</em> and make the{" "}
            <em>Shipping address phone number</em> required.
          </li>
        </ul>
      </Card>
    </Layout.AnnotatedSection>
  );
}

export default info;
