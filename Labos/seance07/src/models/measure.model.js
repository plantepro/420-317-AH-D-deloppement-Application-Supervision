import mongoose from "mongoose";

const measureSchema = new mongoose.Schema({
  sensor: {
    // String, pas ObjectId : Sensor a maintenant un _id texte.
    type: String,
    ref: "Sensor", // 引用Sensor模型 告诉mongoose如果有人要求populate sensor 你应该去Sensor Model找
    required: true,
    index: true, //索引字段，方便查询
  },
  value: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now, //默认值为当前时间
    index: true, //索引字段，方便查询
  },
});

export default mongoose.model("Measure", measureSchema);
