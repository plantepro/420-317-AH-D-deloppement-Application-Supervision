import { computeStats } from "../stats.js";

// Cette couche ignore HTTP : ni req, ni res.
// A la seance 7 elle passera a MongoDB, a la seance 14 elle sera appelee
// par MQTT au lieu d'Express. Dans les deux cas, sans changer d'interface.
const measures = [];

export function add({ sensor, value }) {//这个函数会将一个新的测量数据添加到measures数组中。它接受一个对象参数，包含sensor和value属性。sensor表示传感器的名称，value表示测量值。函数会创建一个新的测量对象，包含sensor、value和createdAt属性，其中createdAt是当前时间的ISO字符串。然后将测量对象添加到measures数组中，并返回该对象。
  const measure = { sensor, value, createdAt: new Date().toISOString() }; //创建一个新的测量对象，包含sensor、value和createdAt属性，其中createdAt是当前时间的ISO字符串。
  measures.push(measure); //将测量对象添加到measures数组中。
  return measure;//返回该对象。
}

export function list({ min } = {}) {
  if (min === undefined) return measures; //如果min参数未定义，则返回所有测量数据。
  return measures.filter((measure) => measure.value > min);
}

export function getLatest() {
  return measures.at(-1) ?? null;
}

export function getStats() {
  return computeStats(measures);
}
