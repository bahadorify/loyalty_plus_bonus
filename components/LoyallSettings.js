import {
  Badge,
  Button,
  Card,
  Form,
  FormLayout,
  Icon,
  InlineError,
  Layout,
} from "@shopify/polaris";
import Joi from "joi";
import React, { useState, useEffect } from "react";
import useAxios from "../hooks/useAxios";
import useForm from "../hooks/useForm";
import { checkLoyallConnection } from "../services/loyallService";

function LoyallSettings({ shopOrigin }) {
  const axios = useAxios();
  const API_URL = `${process.env.HOST}/api`;
  const [apiKey, setApiKey] = useState("");
  const [programId, setProgramId] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [terminalId, setTerminalId] = useState("");
  const [baxNumber, setBaxNumber] = useState("");

  const data = {
    apiKey,
    programId,
    merchantId,
    endpoint,
    terminalId,
    baxNumber,
  };
  const schema = {
    apiKey: Joi.string().required().label("API key"),
    programId: Joi.string().required().label("Program ID"),
    merchantId: Joi.string().required().label("Merchant ID"),
    endpoint: Joi.string().required().label("Endpoint"),
    terminalId: Joi.string().required().label("Terminal ID"),
    baxNumber: Joi.string().required().label("BAX number"),
  };

  const doSubmit = async () => {
    setIsConnected(undefined);
    console.log("API Key", apiKey);
    console.log("Program ID", programId);
    console.log("Merchant ID", merchantId);
    console.log("Endpoint", endpoint);
    console.log("Terminal ID", terminalId);
    console.log("BAX number", baxNumber);
    const result = await axios.post(`${API_URL}/loyalty-settings`, {
      apiKey,
      programId,
      merchantId,
      endpoint,
      terminalId,
      baxNumber,
    });
    console.log(result);
    await checkApiSettings(
      apiKey,
      programId,
      merchantId,
      endpoint,
      terminalId,
      baxNumber
    );
  };
  const { handleSubmit, renderTextField } = useForm(data, schema, doSubmit);

  const [isConnected, setIsConnected] = useState(undefined);
  const [loyallError, setLoyallError] = useState("");

  useEffect(() => {
    async function fetchData() {
      console.log(shopOrigin);
      // get loyalty settings
      const settings = await axios.get(`${API_URL}/loyalty-settings`);
      const {
        apiKey,
        programId,
        merchantId,
        endpoint,
        terminalId,
        baxNumber,
      } = settings.data;
      setApiKey(apiKey);
      setProgramId(programId);
      setMerchantId(merchantId);
      setEndpoint(endpoint);
      setTerminalId(terminalId);
      setBaxNumber(baxNumber);
      // check if settings are correct
      await checkApiSettings(
        apiKey,
        programId,
        merchantId,
        endpoint,
        terminalId,
        baxNumber
      );
    }
    fetchData();
  }, []);

  // badge info
  const [badge, setBadge] = useState({
    status: "warning",
    text: "Loading...",
  });
  const badgeInfo = () => {
    let result = {};
    if (isConnected) {
      result = {
        status: "success",
        text: "Connected",
      };
    } else if (isConnected === undefined) {
      result = {
        status: "warning",
        text: "Loading...",
      };
    } else {
      result = {
        status: "critical",
        text: "Not connected",
      };
    }
    return result;
  };

  useEffect(() => {
    setBadge(badgeInfo());
  }, [isConnected]);

  const checkApiSettings = async (
    apiKey,
    programId,
    merchantId,
    endpoint,
    terminalId,
    baxNumber
  ) => {
    const { connectionStatus, message } = await checkLoyallConnection(
      apiKey,
      programId,
      merchantId,
      endpoint,
      terminalId,
      baxNumber
    );
    setIsConnected(connectionStatus);
    setLoyallError(message);
  };

  return (
    <Layout.AnnotatedSection
      title={
        <>
          Loyalty+ integration &nbsp;
          <Badge status={badge.status}>{badge.text}</Badge>
        </>
      }
      description={
        <>
          The following settings will be used to integrate Loyalty+ API with
          your shopify store.
          <br />
          <br />
          {loyallError ? (
            <InlineError
              message={loyallError.map((m, idx) => {
                return (
                  <React.Fragment key={idx}>
                    {m} <br />
                  </React.Fragment>
                );
              })}
            />
          ) : (
            ""
          )}
        </>
      }
    >
      <Card sectioned>
        <Form onSubmit={handleSubmit}>
          <FormLayout>
            {renderTextField("apiKey", "API key", apiKey, setApiKey)}
            {renderTextField(
              "programId",
              "Program ID",
              programId,
              setProgramId
            )}
            {renderTextField(
              "merchantId",
              "Merchant ID",
              merchantId,
              setMerchantId
            )}
            {renderTextField("endpoint", "Endpoint", endpoint, setEndpoint)}
            {renderTextField(
              "terminalId",
              "Terminal ID",
              terminalId,
              setTerminalId
            )}
            {renderTextField(
              "baxNumber",
              "BAX number",
              baxNumber,
              setBaxNumber
            )}
            <Button submit>Submit</Button>
          </FormLayout>
        </Form>
      </Card>
    </Layout.AnnotatedSection>
  );
}

export default LoyallSettings;
