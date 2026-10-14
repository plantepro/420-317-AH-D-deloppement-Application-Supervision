import jwt from "jsonwebtoken";
//JWT 验证方式不需要保存服务器端的登录会话
//服务器登录成功后，签发一个有签名、有效期有限的通行证。客户端每次请求都携带它，服务器验证签名即可，不必为了验证每次请求而重新记住登录状态
import User from "../models/user.model.js";

// Le role n'est pas un parametre : tout compte cree par l'API est un reader.
// Un operator ou un admin se cree autrement (npm run seed:users).
export async function register({ email, password }) {
  const user = await User.create({ email, password });
  return { id: user._id, email: user.email, role: user.role };
}

// Retourne null si le courriel est inconnu OU si le mot de passe est faux :
// l'appelant ne peut pas (et ne doit pas) savoir lequel des deux.
export async function login({ email, password }) {
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    return null;
  }

  //登录时：签发
  const token = jwt.sign( //创建并签署JWT
    { id: user._id, role: user.role }, //用户再MongoDB中的ID， user.role 用户角色
    process.env.JWT_SECRET,//用来签名和验证的密钥
    { expiresIn: "2h" }, //Token有效期为2小时
  );

  return { token, user: { id: user._id, email: user.email, role: user.role } };
}
