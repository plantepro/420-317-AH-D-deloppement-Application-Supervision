import * as service from "../services/sensor.service.js";

export async function list(req, res, next) {
  try {
    res.status(200).json(await service.list());
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const sensor = await service.getById(req.params.id);
    if (!sensor) {
      return res.status(404).json({ error: "Capteur introuvable" });
    }
    res.status(200).json(sensor);
  } catch (error) {
    next(error);
  }
}

export async function create(req, res, next) {
  try {
    // Extraction explicite : le client ne doit pas pouvoir ecrire "active"
    // ou tout autre champ non prevu (voir la demo : active: false impose).
    const { id, name, unit, threshold, direction } = req.body;
    res.status(201).json(await service.create({ id, name, unit, threshold, direction })); //没有包含active字段，因为active字段是由服务端控制的，初始值为true，表示传感器是激活状态。
  } catch (error) {
    next(error);
  }
}

export async function replace(req, res, next) {
  try {
    const { name, unit, threshold, direction, active } = req.body;
    const updated = await service.replace(req.params.id, { name, unit, threshold, direction, active }); //没有包含id字段，因为id字段是由客户端提供的，不能被修改。active字段是可选的，如果客户端不提供，则保持原来的值。
    if (!updated) {
      return res.status(404).json({ error: "Capteur introuvable" });
    }
    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
}

export async function remove(req, res, next) {
  try {
    if (!await service.remove(req.params.id)) {
      return res.status(404).json({ error: "Capteur introuvable" }); //如果没有找到符合条件的元素，则返回404状态码和错误信息。
    }
    // 204 : pas de corps, donc end() et non json().
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
