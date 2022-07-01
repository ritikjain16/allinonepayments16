import express from "express";
import axios from "axios";
import jsSHA from "jssha";
import dotenv from "dotenv";
dotenv.config();
const router = express.Router();

const payuhostname = process.env.PAYU_HOSTNAME;
const mid = process.env.PAYU_MID;
const salt1 = process.env.PAYU_MID;

router.get("/create/order", async (req, res) => {
  const txnid = "OD_" + Math.floor(Math.random() * 99999999);
  const amount = "100";
  const firstname = "Ritik Jain";
  const productinfo = "Shopping";
  const email = "ritik9628@gmail.com";

  const hashString = `${mid}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt1}`;

  var sha = new jsSHA("SHA-512", "TEXT");
  sha.update(hashString);
  var hash = sha.getHash("HEX");
  console.log(hash);

  try {
    const result = await axios.post(
      `${payuhostname}?key=${mid}&txnid=${txnid}&amount=${amount}&firstname=${firstname}&email=${email}&phone="8979478808&productinfo=${productinfo}&surl="http://localhost:5000/payments/payu/result"&furl="http://localhost:5000/payments/payu/result"&hash=${hash}`,
      {},
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
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

router.get("/result", async (req, res) => {
  try {
    console.log(req.body);
  } catch (e) {
    console.log(e);
    res.status(400).send(e);
  }
});

export default router;
