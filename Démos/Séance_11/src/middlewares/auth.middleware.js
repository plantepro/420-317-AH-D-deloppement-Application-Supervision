import jwt from "jsonwebtoken"; //引入JWT 服务器登陆成功后 签发一个有签名，有效期有限的通行证，客户端每次请求都携带，服务器验证签名即可，不必为验证每次请求而重新记住登陆状态
//JWT 验证方式不需要保存服务器端的登录会话；

// Authentification : qui es-tu ? Absence ou invalidite du jeton => 401.
//保护中间件 - protect函数
export function protect(req, res, next) { 
  const header = req.headers.authorization; //读取请求头中的Authorization

  if (!header?.startsWith("Bearer ")) {//检查是否适用bearer token 格式
    return res.status(401).json({ error: "Jeton absent" });
  }

  try {
    const token = header.slice("Bearer ".length);//提取真正的token
    const payload = jwt.verify(token, process.env.JWT_SECRET); //验证token， 每次受保护请求：验证签名 Token是否过期等
    //WT 并没有被加密。它的 Header 和 Payload 可以被解码查看，所以不要把密码或其他敏感秘密放入 Payload。签名的作用是帮助验证内容没有被篡改，而不是隐藏内容。
    req.user = { id: payload.id, role: payload.role }; //把解码并验证后的用户信息保存到请求对象中
    next(); //验证通过 继续执行后面的中间件或Controller
  } catch {
    res.status(401).json({ error: "Jeton invalide ou expire" }); //没有Token 或Token无效，已过期
  }
}

// Autorisation : as-tu le droit ? Identifie mais pas autorise => 403.
// Toujours placee APRES protect, car elle lit req.user.
export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Acces refuse" });
    }
    next();
  };
}
