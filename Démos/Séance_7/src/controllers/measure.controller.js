import * as service from "../services/measure.service.js";

export async function list(req, res, next) {
  try {
    const min = req.query.min === undefined ? undefined : Number(req.query.min); //req.query是Express提供的属性，表示请求的查询字符串参数。req.query.min表示查询字符串中名为min的参数的值。如果min参数不存在，则返回undefined。否则，将其转换为数字类型。
    res.status(200).json(await service.list({ min }));
  } catch (error) {
    next(error);
  }
}

export async function getOne(req, res, next) {
  try {
    const measure = await service.getById(req.params.id);
    if (!measure) {
      return res.status(404).json({ error: "Mesure introuvable" });
    }
    res.status(200).json(measure);
  } catch (error) {
    next(error);
  }
}

export async function getLatest(req, res, next) {
  try {
    const measure = await service.getLatest();
    if (!measure) {
      return res.status(404).json({ error: "Aucune mesure enregistree" });
    }
    res.status(200).json(measure);
  } catch (error) {
    next(error);
  }
}

export async function getStats(req, res, next) {
  try {
    res.status(200).json(await service.getStats());
  } catch (error) {
    next(error);
  }
}
