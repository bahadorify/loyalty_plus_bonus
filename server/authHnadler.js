import axios from "axios";
import jwt from "jsonwebtoken";

/**
 * Generate JWT using phone and verification token
 */
export function generateJWT({ phoneNumber, memberId, code, shop }) {
  return jwt.sign(
    {
      phoneNumber,
      memberId,
      code,
      shop,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "6h",
    }
  );
}

/**
 * Verify JWT token using the secret key
 */
export async function verifyJWT(token, protocol, host) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // check if memberId matches\
    // usefull e.g., when signed in as non-member, then registered as member
    // check if membership status has changed
    const { phoneNumber, memberId, shop } = decoded;
    const url = `${
      protocol ? protocol + "://" : ""
    }${host}/loyall/programs/members/byphone/justmember/${shop}?phoneNumber=${phoneNumber}`;
    console.log("decoded", decoded, "url", url);
    const memberResult = await axios.get(url);
    const member = memberResult.data;
    const newMemberId = member ? member.id : null;
    if (memberId !== newMemberId) throw new Error("Member status changed");
    return decoded;
  } catch (error) {
    throw new Error("Cannot verify jwt", error);
  }
}
