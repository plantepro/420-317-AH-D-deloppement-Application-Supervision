import mongoose from "mongoose";
import bcrypt from "bcrypt";

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
    select: false, //表示普通 Mongoose 查询默认不返回密码字段. 登录时才需要：.select("+password")
  },
  role: {
    type: String,
    enum: ["reader", "operator", "admin"], //用户记录的角色必须符合模型规定
    default: "reader",
  },
});

// Avant chaque save() : on hache, a moins que le mot de passe n'ait pas bouge.
// Sans isModified, un simple changement de role hacherait un hash deja hache.
userSchema.pre("save", async function () { 
  if (!this.isModified("password")) return; //新建用户：密码字段是新设置的，需要哈希。修改用户角色，但密码没有变化：不重新哈希
  this.password = await bcrypt.hash(this.password, 10); //如果改变，就使用 bcrypt.hash() 进行哈希。
});

userSchema.methods.comparePassword = function (candidate) { // 将输入密码与保存的哈希进行验证
  return bcrypt.compare(candidate, this.password); //candidate 是用户本次输入的原始密码，this.password 是数据库用户文档中的哈希值。
  //bcrypt.compare() 会验证输入密码是否与保存的哈希匹配，而不是要求两者字符串完全相同。
};

export default mongoose.model("User", userSchema); //这句代码把 userSchema 编译成名为 User 的 Mongoose Model。因此，User 不仅知道用户有哪些字段，也关联了这个 Schema 上定义的中间件。
/**
 * ① 注册 hook
userSchema.pre("save", function)


② 创建 Model
mongoose.model("User", userSchema)


③ 调用 Model
User.create({ email, password, role })


④ Mongoose 内部执行保存流程
触发已注册的 pre("save") hook


⑤ 执行密码哈希
bcrypt.hash(this.password, 10)
 */
