import { body, validationResult } from "express-validator"; // express-validator模块是一个用于验证和清理Express.js请求数据的中间件库。这里吧这个模块中的两个东西导入进来。
// body意思是我要验证HTTPrequest body里面的name字段。 body("name") - 找到req.body.name - trim() - notEmpty(),返回的不是最终结果而是一个validation chanin, 这个chain可以被express的中间件使用。
// validationResult是一个函数，用于从请求中提取验证结果。它会检查之前定义的验证规则，并返回一个包含验证错误的对象，如果没有错误，则返回一个空对象。

function  handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }

// Le middleware s'execute AVANT le controleur : quand celui-ci demarre,
// les donnees sont deja saines.
// POST : active n'existe pas dans les regles -> ignore silencieusement
// si le client l'envoie quand meme (le controleur ne le lira pas non plus)
export const validateSensorCreate = [ // POST请求的验证规则，active字段不存在于规则中，如果客户端仍然发送它，则会被静默忽略（控制器也不会读取它）
  body("id").trim().notEmpty() 
    .withMessage("L'ID est requis"), //验证id字段是否为空，如果为空则返回错误信息 trim()方法用于去除字符串的前后空格，notEmpty()方法用于验证字符串是否为空，如果为空则返回错误信息 withMessage()方法用于设置自定义的错误信息。
  body("name").trim().notEmpty()
    .withMessage("Le nom du capteur est requis"), //验证name字段是否为空，如果为空则返回错误信息
  body("unit").trim().notEmpty()
    .withMessage("L'unite est requise"), //验证unit字段是否为空，如果为空则返回错误信息
  body("threshold").isFloat()
    .withMessage("Le seuil doit etre un nombre"), //验证threshold字段是否为浮点数，如果不是则返回错误信息
  body("direction").isIn(["above", "below"])
    .withMessage("direction doit etre 'above' ou 'below'"), //验证direction字段是否为"above"或"below"，如果不是则返回错误信息
  handleValidationErrors, //调用handleValidationErrors函数来处理验证结果，如果有错误则返回400状态码和错误信息，否则继续执行下一个中间件
];

// PUT : active devient modifiable, mais reste optionnel (on peut modifier
// seulement le seuil sans re-envoyer active a chaque fois)
export const validateSensorUpdate = [ // PUT请求的验证规则，active字段变为可选，但仍然可以修改
  body("name").trim().notEmpty().withMessage("Le nom ne peut pas etre vide"),
  body("unit").trim().notEmpty().withMessage("L'unite ne peut pas etre vide"),
  body("threshold").isFloat().withMessage("Le seuil doit etre un nombre"),
  body("direction").isIn(["above", "below"]).withMessage("direction doit etre 'above' ou 'below'"),
  body("active").isBoolean().withMessage("active doit etre un booleen"), //验证active字段是否为布尔值，如果不是则返回错误信息
  handleValidationErrors,
];