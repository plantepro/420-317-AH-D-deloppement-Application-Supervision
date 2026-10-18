import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

// Le role n'est pas un parametre : tout compte cree par l'API est un reader.
// Un operator ou un admin se cree autrement (npm run seed:users).
// 通过 API 注册创建的账号始终是 reader。operator 和 admin 账号通过 npm run seed:users 等项目提供的方式创建。
export async function register({ email, password }) {
  const user = await User.create({ email, password });
  return { id: user._id, email: user.email, role: user.role };
}

// Retourne null si le courriel est inconnu OU si le mot de passe est faux :
// l'appelant ne peut pas (et ne doit pas) savoir lequel des deux.
export async function login({ email, password }) {
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");
//findOne 是Mongoose 模型执行查询的常见写法。向数据库查询匹配的用户
  //服务器不会简单地把用户输入的密码与数据库中的密码字符串直接比较，而是调用 comparePassword() 验证。
  //.select("+password") 并不是把密码加密，而是要求查询结果包含密码字段。因为模型设置了 select: false
  if (!user || !(await user.comparePassword(password))) { 
    // 1. !user：数据库没有找到这个用户，直接返回 null。
    // 2. ! (await user.comparePassword(password))：找到了用户，但输入的密码验证不通过，也返回 null。
    return null;
  }

  //- 把用户 ID 和角色写入令牌的载荷。
  // - 使用服务器环境变量 JWT_SECRET 对令牌进行签名。
  // - 设置令牌有效期为 2 小时。
  // 因此，用户不需要知道 JWT_SECRET，也不需要手动生成令牌。
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" },
  );

  return { token, user: { id: user._id, email: user.email, role: user.role } }; //服务器成功登录后，实际返回对象结构
}
