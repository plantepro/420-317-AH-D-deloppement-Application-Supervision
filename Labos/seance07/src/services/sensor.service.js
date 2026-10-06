import Sensor from "../models/sensor.model.js"; //导入传感器模型，操作数据

// Cette couche ignore HTTP : ni req, ni res.
// sensors garde le CRUD complet : c'est le tableau de bord qui cree un
// capteur pour commencer a ecouter le bon sujet MQTT (seance 14).


//以下为mongoose的Model API，提供对数据库的操作接口。 Mongoose是Node.js用来和MongoDB交互的ODM
export async function create({ id, name, unit, min, max, threshold, direction }) {
  // _id vient du client : c'est le nom du sujet MQTT auquel on s'abonnera. id由客户端提供：它是我们将要订阅的MQTT主题的名称。
  // active est pose ICI, avant tout etalement de donnees recues : le service reste la seule source de verite sur ce champ. active在这里设置，在接收到任何数据之前：服务仍然是该字段的唯一真实来源。
  return Sensor.create({ _id: id, name, unit, min, max, threshold, direction });
}

export async function list() {
  return Sensor.find(); //返回所有传感器数据
}

export async function getById(id) {
  return Sensor.findById(id);
}

export async function replace(id, { name, unit, min, max, threshold, direction, active }) {
  // new: true renvoie le document A JOUR. runValidators applique les
  // contraintes du schema (dont l'enum de direction) a la mise a jour.
  return Sensor.findByIdAndUpdate(
    id,
    { name, unit, min, max, threshold, direction, active },
    { new: true, runValidators: true }, //返回更新后的文档，并运行验证器
  );
}

export async function remove(id) {
  const deleted = await Sensor.findByIdAndDelete(id); //删除传感器数据，返回删除的文档，如果没有找到则返回null
  return deleted !== null; //返回布尔值，表示是否删除成功
}
