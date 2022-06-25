import mongoose from "mongoose";

const paymentSchema = mongoose.Schema({
  data: Object,
  refund:Object,
  paymentPlatform:String
});

export default mongoose.model("allinonepayment", paymentSchema);
