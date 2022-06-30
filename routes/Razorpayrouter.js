import express from "express";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import crypto from "crypto";
import SaveInDb from "../schemas/PaymentSchema.js";
import { authmiddleware } from "../authmiddleware.js";
dotenv.config();
const router = express.Router();

const keyid = process.env.RAZORPAY_KEY_ID;
const keysecret = process.env.RAZORPAY_KEY_SECRET;

var instance = new Razorpay({
  key_id: keyid,
  key_secret: keysecret,
});

router.post("/create/order", authmiddleware, async (req, res) => {
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

router.post("/save", authmiddleware, async (req, res) => {
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

router.post("/create/refund", authmiddleware, async (req, res) => {
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

router.post("/get/refund", authmiddleware, async (req, res) => {
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

router.post("/create/link", authmiddleware, async (req, res) => {
  const { amt, name, email, contact } = req.body;
  try {
    var result = await instance.paymentLink.create({
      amount: parseInt(amt) * 100,
      currency: "INR",
      // accept_partial: true,
      // first_min_partial_amount: 100,
      description: "AllinOnePayments",
      customer: {
        name,
        email,
        contact,
      },
      notify: {
        sms: true,
        email: true,
      },
      reminder_enable: true,
      notes: {
        policy_name: "RJ Payments",
      },
      options: {
        checkout: {
          name: "AllinOnePayments",
        },
      },
      // callback_url: "https://example-callback-url.com/",
      // callback_method: "get",
    });
    res.status(200).send(result);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.post("/get/link/status", authmiddleware, async (req, res) => {
  const { id } = req.body;
  try {
    const result = await instance.paymentLink.fetch(id);
    // console.log(result);
    if (result.status === "paid") {
      try {
        const findstatus = await SaveInDb.findOne({
          paymentPlatform: "RazorpayPayMentLink",
          "data.id": id,
        });
        if (findstatus) {
          const updatestatus = await SaveInDb.updateOne(
            { paymentPlatform: "RazorpayPayMentLink", "data.id": id },
            {
              $set: {
                data: result,
                paymentPlatform: "RazorpayPayMentLink",
              },
            }
          );
          // console.log(updatestatus);
          res.status(200).send(result);
        } else {
          try {
            const save = await SaveInDb.create({
              data: result,
              paymentPlatform: "RazorpayPayMentLink",
            });
            // console.log(save);
            res.status(200).send(result);
          } catch (e) {
            console.log(e);
            res.status(400).send(e);
          }
        }
      } catch (e) {
        console.log(e);
        res.status(400).send(e);
      }
    } else {
      res.status(200).send(result);
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.post("/create/qr", authmiddleware, async (req, res) => {
  const { amt } = req.body;
  try {
    const result = await instance.qrCode.create({
      // type: "bharat_qr",
      type: "upi_qr",
      name: "AllinOnePayments",
      usage: "single_use",
      fixed_amount: true,
      payment_amount: parseInt(amt) * 100,
      description: "AllinOnePayments Platform",
      // customer_id: "cust_HKsR5se84c5LTO",
      // close_by: 1681615838,
      notes: {
        purpose: "Test UPI QR code notes",
      },
    });

    res.status(200).send(result);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.post("/get/qr/status", authmiddleware, async (req, res) => {
  const { id } = req.body;
  try {
    const result = await instance.qrCode.fetch(id);
    res.status(200).send(result);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

export default router;
