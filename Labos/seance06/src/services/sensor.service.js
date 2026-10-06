// Cette couche ignore HTTP : ni req, ni res.
// sensors a besoin du CRUD complet : c'est le tableau de bord qui cree un
// capteur pour commencer a ecouter le bon sujet MQTT (seance 14).
const sensors = [];

export function create({ id, name, unit, threshold, direction }) {
  // id et active sont poses ICI, avant tout etalement de donnees recues :
  // le service reste la seule source de verite sur ces deux champs.
  const sensor = { //不能写service.create(req.body) 因为req.body中没有id和active字段，这两个字段应该由服务端控制，id由客户端提供，active初始值为true。
    id,
    name,
    unit,
    threshold,
    direction,
    active: true, //不能是active:active, 因为post创建sensor时，client不能控制active的值，active应该由服务端控制，初始值为true，表示传感器是激活状态。
  };
  sensors.push(sensor);
  return sensor;
}

export function list() {
  return sensors;
}

export function getById(id) {
  return sensors.find((sensor) => sensor.id === id) ?? null;
}

export function replace(id, { name, unit, threshold, direction , active}) { 
  const index = sensors.findIndex((sensor) => sensor.id === id); //findIndex()方法返回数组中满足提供的测试函数的第一个元素的索引。如果没有找到符合条件的元素，则返回-1。
  if (index === -1) return null; //如果没有找到符合条件的元素，则返回null。

  sensors[index] = { ...sensors[index], name, unit, threshold, direction, active}; //使用扩展运算符(...)创建一个新的对象，该对象包含原始传感器对象的所有属性，并覆盖指定的属性（name、unit、threshold、direction、active）。然后将该新对象赋值给sensors数组中对应索引的位置，从而实现对传感器的替换。
  return sensors[index];//返回更新后的传感器对象。
}

export function remove(id) {
  const index = sensors.findIndex((sensor) => sensor.id === id); 
  if (index === -1) return false;

  sensors.splice(index, 1); //splice()方法用于从数组中添加或删除元素。这里的sensors.splice(index, 1)表示从sensors数组中删除从索引index开始的1个元素，即删除指定索引的传感器对象。
  return true;
}
