import express from "express";
import PaytmChecksum from "paytmchecksum";
import https from "https";
import dotenv from "dotenv";
import SavePaymentInDB from "../schemas/PaymentSchema.js";
dotenv.config();
const mid = process.env.PAYTM_MERCHANT_ID;
const mkey = process.env.PAYTM_MERCHANT_KEY;
const paytmHostname = "securegw-stage.paytm.in";
// const paytmHostname = "securegw.paytm.in";

const router = express.Router();
// -------------------------------------

router.post("/send/mid", async (req, res) => {
  res.status(200).send({ mid: mid });
});

// -----------------------------------------------
router.post("/create/order", async (req, res) => {
  var paytmParams = {};

  const { oid, amt } = req.body;

  paytmParams.body = {
    requestType: "Payment",
    mid: mid,
    websiteName: "My_Paytm_Js_Checkout",
    orderId: oid,
    callbackUrl: "http://localhost:5000/getalldata",
    txnAmount: {
      value: amt,
      currency: "INR",
    },
    userInfo: {
      custId: "CUST_001",
    },
  };

  PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), mkey).then(
    function (checksum) {
      paytmParams.head = {
        signature: checksum,
      };

      var post_data = JSON.stringify(paytmParams);

      var options = {
        /* for Staging */
        hostname: `${paytmHostname}` /* for Production */, // hostname: 'securegw.paytm.in',

        port: 443,
        path: `/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${oid}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": post_data.length,
        },
      };

      var response = "";
      var post_req = https.request(options, function (post_res) {
        post_res.on("data", function (chunk) {
          response += chunk;
        });

        post_res.on("end", function () {
          // console.log("Response: ", response);
          res.status(200).send(response);
        });
      });

      post_req.write(post_data);
      post_req.end();
    }
  );
});
// -----------------------------------------------

router.post("/save", async (req, res) => {
  // console.log(req.body);

  var received_data = req.body;
  var paytmChecksum = "";
  var paytmParams = {};

  for (var key in received_data) {
    if (key == "CHECKSUMHASH") {
      paytmChecksum = received_data[key];
    } else {
      paytmParams[key] = received_data[key];
    }
  }

  var isValidChecksum = PaytmChecksum.verifySignature(
    paytmParams,
    mkey,
    paytmChecksum
  );
  if (isValidChecksum) {
    console.log("Checksum Matched");
    getresponse(received_data.ORDERID, res);
    // res.status(200).send({ msg: "Payment Success" });
  } else {
    console.log("Checksum Mismatched");
    // res.status(200).send({ msg: "Payment Failed" });
  }
});

const getresponse = (ORDERID, res) => {
  var paytmParams = {};

  /* body parameters */
  paytmParams.body = {
    /* Find your MID in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys */
    mid: mid,

    /* Enter your order id which needs to be check status for */
    orderId: ORDERID,
  };

  /**
   * Generate checksum by parameters we have in body
   * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
   */
  PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), mkey).then(
    function (checksum) {
      /* head parameters */
      paytmParams.head = {
        /* put generated checksum value here */
        signature: checksum,
      };

      /* prepare JSON string for request */
      var post_data = JSON.stringify(paytmParams);

      var options = {
        /* for Staging */
        hostname: `${paytmHostname}`,

        /* for Production */
        // hostname: 'securegw.paytm.in',

        port: 443,
        path: "/v3/order/status",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": post_data.length,
        },
      };

      // Set up the request
      var response = "";
      var post_req = https.request(options, function (post_res) {
        post_res.on("data", function (chunk) {
          response += chunk;
        });

        post_res.on("end", async function () {
          // console.log("Response: ", response);
          // res.status(200).send(response);
          var myobj = JSON.parse(response);
          // console.log(myobj.body.resultInfo.resultStatus);
          if (myobj.body.resultInfo.resultStatus === "TXN_SUCCESS") {
            // save data in database
            try {
              const saveindb = await SavePaymentInDB.create({
                // resultStatus: myobj.body.resultInfo.resultStatus,
                // resultMsg: myobj.body.resultInfo.resultMsg,
                // resultCode: myobj.body.resultInfo.resultCode,
                // txnId: myobj.body.txnId,
                // bankTxnId: myobj.body.bankTxnId,
                // orderId: myobj.body.orderId,
                // txnAmount: myobj.body.txnAmount,
                // paymentMode: myobj.body.paymentMode,
                // txnDate: myobj.body.txnDate,
                // refundID: "",
                // refAmt: myobj.body.txnAmount,
                // refundStatus: "",
                data: myobj.body,
                paymentPlatform: "Paytm",
              });
              res.status(200).send({ msg: "Payment Succcess!!" });
            } catch (e) {
              console.log(e);
              res.status(400).send(e);
            }
          } else {
            res.status(200).send({ msg: myobj.body.resultInfo.resultStatus });
          }
        });
      });

      // post the data
      post_req.write(post_data);
      post_req.end();
    }
  );
};
// --------------------------------------------------------
router.post("/create/refund", async (req, res) => {
  const { orderId, txnId, refId, refundAmount, _id } = req.body;
  refundamt(orderId, txnId, refId, refundAmount, res, _id);
});

const refundamt = (orderId, txnId, refId, refundAmount, res, _id) => {
  var paytmParams = {};

  paytmParams.body = {
    mid: mid,
    txnType: "REFUND",
    orderId,
    txnId,
    refId,
    refundAmount,
  };

  /*
   * Generate checksum by parameters we have in body
   * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
   */
  PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), mkey).then(
    function (checksum) {
      paytmParams.head = {
        signature: checksum,
      };

      var post_data = JSON.stringify(paytmParams);

      var options = {
        /* for Staging */
        hostname: `${paytmHostname}`,

        /* for Production */
        // hostname: 'securegw.paytm.in',

        port: 443,
        path: "/refund/apply",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": post_data.length,
        },
      };

      var response = "";
      var post_req = https.request(options, function (post_res) {
        post_res.on("data", function (chunk) {
          response += chunk;
        });

        post_res.on("end", async function () {
          // console.log("Response: ", response);

          var myobj = JSON.parse(response);
          // console.log(myobj);
          try {
            const refundtheamt = await SavePaymentInDB.updateOne(
              {
                _id,
              },
              {
                $set: {
                  // refundID: myobj.body.refId,
                  // refID1: myobj.body.refundId,
                  // resultStatus: myobj.body.resultInfo.resultStatus,
                  // resultMsg: myobj.body.resultInfo.resultMsg,
                  // resultCode: myobj.body.resultInfo.resultCode,
                  refund: myobj.body,
                },
              }
            );
            res.status(200).send(response);
          } catch (e) {
            console.log(e);
            res.status(400).send(e);
          }
        });
      });

      post_req.write(post_data);
      post_req.end();
    }
  );
};

// --------------------------------------------------------

router.post("/get/refund", async (req, res) => {
  const { orderId, refId, _id } = req.body;
  refundstatus(orderId, refId, res, _id);
});

const refundstatus = (orderId, refId, res, _id) => {
  var paytmParams = {};

  paytmParams.body = {
    mid: mid,
    orderId,
    refId,
  };

  /*
   * Generate checksum by parameters we have in body
   * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
   */
  PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), mkey).then(
    function (checksum) {
      paytmParams.head = {
        signature: checksum,
      };

      var post_data = JSON.stringify(paytmParams);

      var options = {
        /* for Staging */
        hostname: `${paytmHostname}`,

        /* for Production */
        // hostname: 'securegw.paytm.in',

        port: 443,
        path: "/v2/refund/status",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": post_data.length,
        },
      };

      var response = "";
      var post_req = https.request(options, function (post_res) {
        post_res.on("data", function (chunk) {
          response += chunk;
        });

        post_res.on("end", async function () {
          // console.log("Response: ", response);
          var myobj = JSON.parse(response);
          // console.log(myobj);
          try {
            const refundtheamt = await SavePaymentInDB.updateOne(
              {
                _id,
              },
              {
                $set: {
                  // resultStatus: myobj.body.resultInfo.resultStatus,
                  // resultMsg: myobj.body.resultInfo.resultMsg,
                  // resultCode: myobj.body.resultInfo.resultCode,
                  refund: myobj.body,
                },
              }
            );
            res.status(200).send(response);
          } catch (e) {
            console.log(e);
            res.status(400).send(e);
          }
        });
      });

      post_req.write(post_data);
      post_req.end();
    }
  );
};

// --------------------------------------

router.post("/generate/payment/link", async (req, res) => {
  generateLink(res);
});

const generateLink = (res) => {
  var paytmParams = {};
  paytmParams.body = {
    mid: mid,
    linkType: "GENERIC",
    linkDescription: "Test Payment 16",
    linkName: "Test",
    // amount: 10,
    // sendSms: true,
    // sendEmail: true,
    // customerContact: {
    //   customerName: "RJ16",
    //   customerEmail: "ritik9628@gmail.com",
    //   customerMobile: "8979478808",
    // },
    // statusCallbackUrl:""
  };

  /*
   * Generate checksum by parameters we have in body
   * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys
   */
  PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), mkey).then(
    function (checksum) {
      paytmParams.head = {
        tokenType: "AES",
        signature: checksum,
      };

      var post_data = JSON.stringify(paytmParams);

      var options = {
        /* for Staging */
        hostname: `${paytmHostname}`,

        /* for Production */
        // hostname: 'securegw.paytm.in',

        port: 443,
        path: "/link/create",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": post_data.length,
        },
      };

      var response = "";
      var post_req = https.request(options, function (post_res) {
        post_res.on("data", function (chunk) {
          response += chunk;
        });

        post_res.on("end", function () {
          console.log("Response: ", response);
          res.status(200).send(response);
        });
      });

      post_req.write(post_data);
      post_req.end();
    }
  );
};

// ---------------------------------------

export default router;
