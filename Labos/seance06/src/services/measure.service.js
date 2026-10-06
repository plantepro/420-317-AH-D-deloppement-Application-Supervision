import { computeStats } from "../stats.js";

// Cette couche ignore HTTP : ni req, ni res.
// measures est une ressource EN LECTURE SEULE : aucune mesure n'est jamais
// creee par cette API. Elles arrivent par le capteur simule ou par MQTT
// (seance 14), directement dans ce service -- jamais par une route HTTP.
let nextId = 1; //自增ID，用于为每个测量数据分配唯一的ID。初始值为1，每次添加新的测量数据时，nextId会自增1。
const measures = [];

// add() n'est pas exposee par une route : elle est appelee par le capteur
// simule dans index.js, et le sera par l'acquisition MQTT a la seance 14.
export function add({ sensor, value }) {
  const measure = { id: String(nextId++), sensor, value, createdAt: new Date().toISOString() }; //创建一个新的测量对象，包含id(nextId本身为数字变成string)、sensor、value和createdAt属性，其中id是一个自增的字符串，sensor是传感器的名称，value是测量值，createdAt是当前时间的ISO字符串。
  measures.push(measure);
  return measure;
}

export function list({ min } = {}) {
  if (min === undefined) return measures;
  return measures.filter((measure) => measure.value > min);
}

export function getById(id) {
  return measures.find((measure) => measure.id === id) ?? null; //measures.find()作用是遍历measures数组，查找第一个满足条件的元素。条件是measure.id是否等于传入的id。如果找到了，就返回该测量数据；如果找不到，就返回null。
}

export function getLatest() {
  return measures.at(-1) ?? null;
}

export function getStats() {
  return computeStats(measures);
}
