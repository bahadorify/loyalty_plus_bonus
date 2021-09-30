import axios from "axios";

export async function checkLoyallConnection(
  apiKey,
  programId,
  merchantId,
  endpoint,
  terminalId,
  baxNumber
) {
  try {
    if (
      !apiKey ||
      !programId ||
      !merchantId ||
      !endpoint ||
      !terminalId ||
      !baxNumber
    ) {
      console.log("false no input");
      return {
        connectionStatus: false,
      };
    }
    const responseMerchant = await axios.post(
      `${LOYALL_URL}/merchants/${merchantId}/bonusreservations`,
      {
        apiKey,
        endpoint,
      }
    );
    const responseProgram = await axios.post(
      `${LOYALL_URL}/programs/${programId}/members`,
      {
        apiKey,
        endpoint,
      }
    );
    const responseTerminal = await axios.post(
      `${LOYALL_URL}/merchants/${merchantId}/orderbonus`,
      {
        apiKey,
        endpoint,
        terminalId,
        baxNumber,
      }
    );
    const response = {
      connectionStatus: false,
      message: "",
    };

    // handle errors on settings page
    if (
      responseMerchant?.data.status === 200 &&
      responseProgram?.data.status === 200 &&
      responseTerminal?.data.status === 200
    ) {
      response.connectionStatus = true;
      return response;
    }
    response.message = [
      "The following settings are wrong. Please correct the values and try again: ",
    ];
    if (
      responseProgram?.data.status === 401 &&
      responseMerchant?.data.status === 401
    ) {
      response.message.push("- both Program ID & Merchant ID", "- or API key");
    } else if (responseProgram?.data.status === 401) {
      response.message.push("- Program ID");
    } else if (responseMerchant?.data.status === 401) {
      response.message.push("- Merchant ID");
    }
    if (responseProgram?.data.status === "ENOTFOUND") {
      response.message.push("- Endpoint");
    }
    if (responseTerminal?.data.status === 500) {
      response.message.push("- Termina ID and/or BAX number");
    }
    return response;
  } catch (error) {
    console.error("Error connecting to Loyall API.", error);
    return {
      connectionStatus: false,
      message: "Error connecting to Loyall API.",
    };
  }
}
// constants
// ================
const LOYALL_URL = `${process.env.HOST}/loyall`;
