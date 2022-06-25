import express from "express";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import SaveInDb from "../schemas/PaymentSchema.js";
dotenv.config();

const router = express.Router();

const keyid = process.env.RAZORPAY_KEY_ID;
const keysecret = process.env.RAZORPAY_KEY_SECRET;

var instance = new Razorpay({
  key_id: keyid,
  key_secret: keysecret,
});

router.post("/create/order", async (req, res) => {
  const { amt } = req.body;
  var oid = "OD_" + Math.floor(Math.random() * 99999999);
  var options = {
    amount: amt, // amount in the smallest currency unit
    currency: "INR",
    receipt: oid,
  };
  instance.orders.create(options, function (err, order) {
    res.status(200).send({ order, keyid });
  });
});

router.post("/save", async (req, res) => {
  const { obj } = req.body;
  try {
    const hash = crypto
      .createHmac("sha256", keysecret)
      .update(obj.razorpay_order_id + "|" + obj.razorpay_payment_id)
      .digest("hex");
    if (hash === obj.razorpay_signature) {
      try {
        const save = await SaveInDb.create({
          data: obj,
          paymentPlatform: "Razorpay",
        });
        res.status(200).send({ msg: "Payment Success" });
      } catch (e) {
        console.log(e);
        res.status(400).send(e);
      }
    } else {
      res.status(200).send({ msg: "Payment Failed" });
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.post("/create/refund", async (req, res) => {
  const { pid, amt, _id } = req.body;
  var rid = "REFUND_" + Math.floor(Math.random() * 99999999);
  try {
    const res1 = await instance.payments.refund(pid, {
      amount: amt,
      speed: "optimum",
      receipt: rid,
    });
    try {
      const refund = await SaveInDb.updateOne(
        { _id },
        {
          $set: {
            refund: res1,
          },
        }
      );
      res.status(200).send({ msg: "Refund Success" });
    } catch (e) {
      console.log(e);
      res.status(400).send(e);
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.post("/get/refund", async (req, res) => {
  const { pid, rid, _id } = req.body;
  try {
    const res1 = await instance.payments.fetchRefund(pid, rid);
    try {
      const refund = await SaveInDb.updateOne(
        { _id },
        {
          $set: {
            refund: res1,
          },
        }
      );
      res.status(200).send({ msg: "Refund Fetched Successfully" });
    } catch (e) {
      console.log(e);
      res.status(400).send(e);
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

export default router;
