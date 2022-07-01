import dotenv from "dotenv";
dotenv.config();
const FRONTEND_URL = process.env.FRONTEND_URL;
const USERNAME_R = process.env.USERNAME_R;
const ADMINPASS = process.env.ADMINPASS;
const BACKEND_URL = process.env.BACKEND_URL;
export const authmiddleware = (req, res, next) => {
  if (
    req.get("origin") === FRONTEND_URL ||
    BACKEND_URL + req.baseUrl + req.path ===
      BACKEND_URL + "/payments/razorpay/get/link/status/client"
  ) {
    next();
  } else {
    if (req.headers.authorization === `${USERNAME_R}:${ADMINPASS}`) {
      next();
    } else {
      res.status(400).send({ msg: "Authentication Error" });
    }
  }
};
