import mongoose from "mongoose";

const sensorSchema = new mongoose.Schema({ //sensor数据的蓝图 规则表
  // _id choisi par l'utilisateur, pas genere par Mongo : cet identifiant
  // deviendra le nom du sujet MQTT auquel le serveur s'abonne (seance 14).
  _id: {
    type: String, //传感器的ID是字符串类型
    required: true, //传感器的ID是必填的
    match: /^[a-zA-Z0-9_-]+$/,  //传感器的ID必须匹配正则表达式 /^[a-zA-Z0-9_-]+$/，即只能包含字母、数字、下划线和连字符
  },
  name: { type: String, required: true, trim: true }, //传感器的名称是字符串类型，必填，去掉前后空格
  room: { type: String, trim: true },
  unit: { type: String, required: true, trim: true },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  threshold: { type: Number, required: true },
  direction: { type: String, required: true, enum: ["above", "below"] },
  active: { type: Boolean, default: true },
});

export default mongoose.model("Sensor", sensorSchema); //导出传感器model，模型名称为"Sensor"，使用sensorSchema作为模式
//model拿着schema这个蓝图，提供操作数据库的接口