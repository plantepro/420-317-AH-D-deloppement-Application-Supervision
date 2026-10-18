import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/user.model.js";

/**
 * Cree un administrateur et un operateur.
 *
 * Il n'existe volontairement AUCUNE route pour creer un compte privilegie :
 * POST /api/auth/register fabrique toujours un reader. Les comptes
 * privilegies naissent ici, avec acces a la base.
 *
 * Les mots de passe viennent du fichier .env, jamais du code :
 *   SEED_ADMIN_PASSWORD=...
 *   SEED_OPERATOR_PASSWORD=...
 *
 * Relancer le script est sans danger : un compte existant n'est pas recree.
 *
 * Usage : npm run seed:users
 */
// 定义了两个预设账号的配置:
// email	预设账号的邮箱
// role	要创建的账号角色
// variable	从环境变量读取密码时使用的变量名
// 例：创建管理员账号时，使用 admin@supervision.test 作为邮箱，角色设为 admin，密码从环境变量 SEED_ADMIN_PASSWORD 中读取。
//环境变量在这里是提供初始化账号所需密码的来源；具体如何创建数据库记录，取决于后面的 main() 函数。
const COMPTES = [
  { email: "admin@supervision.test", role: "admin", variable: "SEED_ADMIN_PASSWORD" },
  { email: "operator@supervision.test", role: "operator", variable: "SEED_OPERATOR_PASSWORD" },
];

//脚本需要从环境变量中取得 MongoDB 连接地址 MONGO_URI。如果没有配置，程序就报错并退出。
async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI absent : verifiez votre fichier .env");
    process.exit(1);
  }

  for (const { variable } of COMPTES) {
    if (!process.env[variable]) {
      console.error(`${variable} absent : verifiez votre fichier .env`);
      process.exit(1);
    }
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });

  for (const { email, role, variable } of COMPTES) {
    const existant = await User.findOne({ email });
    if (existant) {
      console.log(`Deja present : ${email} (${existant.role})`); //检查这个邮箱的用户是否已经存在
      continue;
    }
    // create() passe par save() : le hook de hachage s'applique.
    await User.create({ email, password: process.env[variable], role }); //会执行保存流程，因此会触发模型里的 pre("save")，对密码进行 bcrypt 哈希。属于 Mongoose 的框架内部实现
    console.log(`Cree : ${email} (${role})`);
  }

  await mongoose.disconnect(); //完成后关闭数据库连接
}

main().catch((error) => {
  console.error("Echec :", error.message);
  process.exit(1);
});
