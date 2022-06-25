import express from "express";
import axios from "axios";
import SaveInDB from "../schemas/PaymentSchema.js";
import dotenv from "dotenv";
dotenv.config();
const router = express.Router();

const clientID = process.env.CASHFREE_CLIENT_ID;
const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

router.post("/create/order", async (req, res) => {
  var oid = "OD_" + Math.floor(Math.random() * 99999999);
  try {
    const result = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      {
        order_id: oid,
        order_amount: req.body.amt,
        order_currency: "INR",
        order_note: "Additional order info",
        customer_details: {
          customer_id: "1234518745",
          customer_email: "ritik9628@gmail.com",
          customer_phone: "8979478808",
        },
        // order_meta:{
        //   return_url:"http://localhost:5000/payments/return?cf_id={order_id}&cf_token={order_token}"
        // }
      },
      {
        headers: {
          "x-api-version": "2022-01-01",
          "x-client-id": clientID,
          "x-client-secret": clientSecret,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    // console.log(result.data);
    res.status(200).send(result.data);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.post("/save", async (req, res) => {
  try {
    const checkinserver = await axios.get(
      `https://sandbox.cashfree.com/pg/orders/${req.body.order.orderId}`,
      {
        headers: {
          "x-api-version": "2022-01-01",
          "x-client-id": clientID,
          "x-client-secret": clientSecret,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    console.log(req.body.order.status);
    console.log(checkinserver.data.order_status);
    if (
      checkinserver.data.order_status === "PAID" &&
      req.body.order.status === "PAID"
    ) {
      const saveindb = await SaveInDB.create({
        data: req.body,
        paymentPlatform: "Cashfree",
      });
      // console.log(saveindb);
      res.status(200).send({ msg: "Payment paid" });
    } else {
      res.status(200).send({ msg: "Payment not paid yet" });
    }
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

router.post("/create/refund", async (req, res) => {
  var rid = "REFUND_" + Math.floor(Math.random() * 99999999);
  const { oid, amt, _id } = req.body;
  try {
    const result = await axios.post(
      `https://sandbox.cashfree.com/pg/orders/${oid}/refunds`,
      {
        refund_amount: amt,
        refund_id: rid,
        refund_note: "Refunded by RJ16",
      },
      {
        headers: {
          "x-api-version": "2022-01-01",
          "x-client-id": clientID,
          "x-client-secret": clientSecret,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    try {
      const refundInDb = await SaveInDB.updateOne(
        { _id },
        {
          $set: {
            refund: result.data,
          },
        }
      );
      res.status(200).send(refundInDb);
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
  // var rid = "REFUND_" + Math.floor(Math.random() * 99999999);
  const { oid, rid, _id } = req.body;
  try {
    const result = await axios.get(
      `https://sandbox.cashfree.com/pg/orders/${oid}/refunds/${rid}`,
      {
        headers: {
          "x-api-version": "2022-01-01",
          "x-client-id": clientID,
          "x-client-secret": clientSecret,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    try {
      const refundInDb = await SaveInDB.updateOne(
        { _id },
        {
          $set: {
            refund: result.data,
          },
        }
      );
      res.status(200).send(refundInDb);
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
