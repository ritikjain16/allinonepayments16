import express from "express";
import axios from "axios";
import jsSHA from "jssha";
// import payu from "payu-sdk";

const router = express.Router();

// payu.

const payuhostname = "https://test.payu.in/_payment";
const mid = "WlCxm7aK";
const salt1 = "1MoCl3d7EU";
// const mid = "1S2RCU";
// const salt1 = "BB7O06PiPjL1wF6pl2QYtsfsKCSYZCwe";
const salt2 =
  "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDFUjhC87ryn6xCl3l05y8YRXSoLeMxm8RZkTnolzs2QoYxrRKy60wHiOZqdLE06zW9ZacTpiRKQFRkXud3ypHFMWInjHNxMAFlb4852d6jWZKb7x7BMNApOK7KuQG6QcIVzsBdwbI1whCzszXBNrwG4GEphAiryy/ASaY5uWeppL+iSAJqLP76uuxY5+13NQdkbTxP0ai5lEbK+HhgdHp3Cor5lCtmtD5FwF7lG9a9PROVldF4EHb+HhBJ9vBduFjIID7FHVRxEDtLjnPcy0shwFh8KD/Yy49bUSPtShS9YSC/BS0d7ultH1Tu02eAuS21CQKXdNfA06LtObXOkZ65AgMBAAECggEAVRnty+pkYYm9+IZtyp5+cEBcXMBVsSqWF28MA6Vd0zwDtl8HpoTWqJVBkv47AzDCX6n80fugwSlXfGZ1+/MwxVRUGex4SYPDxmTD59ZwMBFMqtYJdJbB4FVjBWmfNh5wP4mI66bDXm4RV/9dmrQpiemx3f7k4nriYFMjTtgIvl/dSpEZxPvtE0quiD2+F17nMuk59krUnZOriMMl9JsV9ZJ/PzcY7DCunJk/s32Au3Cg0RQ/tmPIS5rnaJfrAzyJHWpCxlfPNRxYznyhzn+ag8ivJlATL+T/7qn/6qqe9kC1JJoKSvsrt3V+uJU7JXA/gv0dE/vfHlVgDpUt87j0hQKBgQD9PKMzY08lSPHyNyRCof89wPdRBc26YVY5uifO11wgusjDhbDrKjdOev8yrnbgvGu7M8VFKcV3VfSm8btpUakGZAIzVx1+MOOaj0xbJTT8mXi9g+OLKhigeKxLtw8q+JmaojbU4wPr9qb1xC+XFi7g9alxyBlPbIGMbFO94N7wawKBgQDHeWTTdswm9X1HdBBleOZZ9OYHjT+VCaIF0OkqE5+ot3rN8wK0glu+e38wUZZndBNcQt2lhjBrN0flz/lXbq2VRPm7nNsPWPxhmX4wIO+gzcqbv61m2s42/gPk287PfrwG22AoDhcHVFBWaqpNLmWzSlJ+4D/jpD7UMlNUHOnmawKBgBvp6zNm5vp9J+5DFcQihzgPZTORKDQ7Nn32fxzVsFoLPMYQnofNh3snI6o6gPAU1Os1sbEGAbY9y1H7o2Tgk3kY3QU7vQyD5xLKaOhDGaweXqjFOPfGFCDcLGHMM+fQr13UM6cTvwLrlUvR7E0DLPevHJZmMCQJGd6YskJj3y8xAoGBAKpUtI4F0UorMjEDoMSlOj3ya0JjkLmZIitJOvDdFOai1lBqhBLThbfgCLmf0YjBi46q4k1niozjBZftwYKxVbQy0/UqebxfRhOpWCGM3lI3qBzazh0YFiLLQVP5hl2UYMaSKUfK0EtH6doA9y80wU8Z1dvVbXjbVXMpDhKzJd/FAoGBAMsyEApxwbX9coc5ex/0gxmDBLr2C5JZkArJU9V2EZRCLPQIG1zqdDAgqbJww5diimzW4fwuh8KE4xhW3litIhSDFLhjmCuVNeihBjeha1EXFWsvN/cEb6MDtTON3Tnw4dDgbDM24nJvccFAYHNSBWH4Gi2gn39Y/NIlnlNgmwrb";

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
