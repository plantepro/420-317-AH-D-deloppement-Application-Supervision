import mongoose from "mongoose";
import bcrypt from "bcrypt"; //引入哈希算法 

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  // select: false : le hash n'est JAMAIS renvoye par une requete ordinaire.
  // Pour le lire (a la connexion), il faut le demander : .select("+password")
  password: {
    type: String,
    required: true,
    select: false,
  },
  role: {
    type: String,
    enum: ["reader", "operator", "admin"], // 角色枚举
    default: "reader",
  },
});

// Avant chaque save() : on hache, a moins que le mot de passe n'ait pas bouge.
// Sans isModified, un simple changement de role hacherait un hash deja hache.
//为什么放在model而不是controller？因为如果每个 Controller 都单独负责哈希，未来新增一个重置密码的接口时，很容易忘记哈希，导致明文密码被存进数据库。
userSchema.pre("save", async function () { //pre("save")在Mongoose保存用户之前执行
//isModified("password") 也很重要：如果每次保存用户都重新哈希已有的哈希值，用户以后就无法正常登录了。
  if (!this.isModified("password")) return; //检查密码字段是否被修改，如果密码没有被修改，就直接保存，若变化，先哈希再保存
  this.password = await bcrypt.hash(this.password, 10); //哈希密码，10是盐的轮数 
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
