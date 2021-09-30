import Router from "koa-router";
import Axios from "axios";
import { getSessionData } from "../db/session";

const router = new Router({ prefix: "/transactions" });

router.post("/order_created/:shop", async (ctx) => {
  try {
    const { shop } = ctx.params;
    const body = ctx.request.body;
    console.log(shop);
    console.log("WEEBHOOOK at work");

    const baseUrl = process.env.HOST;
    const axiosNoAuth = Axios.create();
    const registerTransactionResult = await axiosNoAuth.post(
      `${baseUrl}/transactions/register/${shop}`,
      body
    );

    console.log("REGISTER transaction result");
    // ctx.body = registerTransactionResult;
    ctx.body = {
      status: 200,
      message: "transaction registered!",
    };
  } catch (error) {
    console.log(error);
  }
});

router.post("/register/:shop", async (ctx) => {
  try {
    // get merchantId, programId
    const {
      merchantId,
      programId,
      apiKey,
      endpoint,
      terminalId,
      baxNumber,
    } = await getApiSettings(ctx);
    const body = ctx.request.body;
    const { shop } = ctx.params;

    const transactionLines = body.line_items.map((x) => ({
      count: x.quantity,
      outValueSum: x.price,
      supplierName: x.vendor,
      // supplierNumber: "232323",
      inValueSum: 0,
      itemNo: x.id,
      productName: x.name,
      productGroupName: x.title,
      productGroupNumber: x.product_id,
    }));

    // phone number
    const { customer } = body;
    const phone =
      customer.default_address.phone || customer.shipping_address.phone;
    const country =
      customer.default_address.country_code ||
      customer.shipping_address.country_code;
    const email = customer.email;
    const countryCodes = {
      NO: "47",
      SE: "46",
    };
    const countryCode = countryCodes[country];
    const phoneNumber = countryCode + phone;

    const vatCode =
      Number(body.current_subtotal_price) === 0
        ? 0
        : (
            Number(body.total_tax) / Number(body.current_subtotal_price)
          ).toFixed(4);

    // if no payment add N/A for payment details
    if (!body.payment_details) {
      body.payment_details = {
        credit_card_company: "N/A",
        credit_card_number: "N/A",
      };
    }

    // transaction body
    const transactionBody = {
      merchantId: merchantId,
      programId: programId,
      // memberId: 617829,
      memberPhoneNumber: phoneNumber,
      seller: shop,
      storeName: shop,
      externalOrderId: body.id,
      transactionType: "SALE",
      payment: {
        paymentType: body.payment_details.credit_card_company,
        terminalId: terminalId,
        baxNumber: baxNumber,
        maskedPan: body.payment_details.credit_card_number,
        transactionReference: body.id,
        transactionAuthCode: body.token,
        transactionSum: Number(body.current_subtotal_price),
        vatSum: Number(body.total_tax),
        vatCode,
      },
      transactionLines,
    }; // ;

    console.log(transactionBody);

    const axios = authorize(apiKey);
    // if no memberId but phone number, only register transaction and register member

    console.log("before join");
    const joinResult = await axios.post(
      `${endpoint}/programs/${programId}/memberregistration`,
      {
        phoneNumber,
        email,
        firstName: body.customer.first_name,
        lastName: body.customer.last_name,
        street: body.default_address.address1,
        city: body.default_address.city,
        zipCode: body.default_address.zip,
        language: "no",
        sendRegistrationLink: true,
      }
    );
    console.log("after join");

    const result = await axios.post(
      `${endpoint}/merchants/${merchantId}/transactions`,
      transactionBody
    );

    // if memberId exists, create bonus reservation and register transaction

    console.log("TT registered!");
    if (result.status === 200) {
      ctx.body = {
        status: 200,
        message: "transaction registered!",
      };
    }
  } catch (error) {
    console.log(error);
  }
});

export default router;

// helper functions
// ================
function authorize(token) {
  const instance = Axios.create();
  instance.interceptors.request.use((config) => {
    config.headers["Authorization"] = `Bearer ${token}`;
    return config;
  });
  return instance;
}

async function getApiSettings(ctx) {
  const { shop } = ctx.params;
  const baseUrl = ctx.request.origin;
  const axiosNoAuth = Axios.create();
  const loyaltyApiResult = await axiosNoAuth.get(
    `${baseUrl}/api/loyalty-settings/${shop}`
  );
  return loyaltyApiResult.data;
}

function sanitizePhoneNumber(numberStr) {
  return numberStr.replace(/\s/g, "");
}
