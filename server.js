import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import PaytmPaymentRouter from "./routes/paymentPaytm.js";
import CashfreeRouter from "./routes/CashfreeRouter.js";
import Razorpayrouter from "./routes/NewRazorpay.js";
// import Razorpayrouter from "./routes/Razorpayrouter.js";
import PayuRouter from "./routes/PayuRouter.js";
import dotenv from "dotenv";
import SavePaymentInDB from "./schemas/PaymentSchema.js";
import { authmiddleware } from "./authmiddleware.js";
dotenv.config();

const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGOOSE_URL)
  .then(() => {
    console.log("Mongo connected");
  })
  .catch((e) => {
    console.log("Errror ========> " + e);
  });

app.use("/payments/paytm", PaytmPaymentRouter);
app.use("/payments/cashfree", CashfreeRouter);
app.use("/payments/razorpay", Razorpayrouter);
app.use("/payments/payu", PayuRouter);

app.post("/orders/get", authmiddleware, async (req, res) => {
  try {
    const getallpayments = await SavePaymentInDB.find()
      .sort({ $natural: -1 })
      .limit(50);
    res.status(200).send(getallpayments);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

app.post("/orders/get/limited", authmiddleware, async (req, res) => {
  try {
    const skip =
      req.query.skip && /^\d+$/.test(req.query.skip)
        ? Number(req.query.skip)
        : 0;
    const getallpayments = await SavePaymentInDB.find({}, undefined, {
      skip,
      limit: 3,
    }).sort({ $natural: -1 });
    res.status(200).send(getallpayments);
  } catch (e) {
    res.status(400).send(e);
  }
});

app.listen(port, () => {
  console.log(`Listening on ${port}`);
});
