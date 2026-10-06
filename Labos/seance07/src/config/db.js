import mongoose from "mongoose"; //取代const sensors = []; 通过service - mongoose - mongoDB

export async function connectDatabase() { //异步连接数据库
  const uri = process.env.MONGO_URI; //取得mongodb+srv://等等 MONGO_URI的值, 变成 const uri
//刚才安装npm install dotenv --save-dev 之后, 在index.js里import 'dotenv/config'; 就可以在process.env.MONGO_URI里取得.env里的MONGO_URI的值
  if (!uri) { //mongo—_uri是否存在？ 
    console.error("MONGO_URI absent : verifiez votre fichier .env"); //如果不存在, 就打印出MONGO_URI absent : verifiez votre fichier .env
    process.exit(1); //退出程序, 1表示有错误
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 }); //连接数据库, 如果5秒内没有连接上, 就报错
    console.log("Connecte a MongoDB"); //如果连接成功, 就打印出Connecte a MongoDB
  } catch (error) {
    // Mieux vaut refuser de demarrer que servir un serveur a moitie mort.
    console.error("Connexion impossible :", error.message); //如果连接失败, 就打印出Connexion impossible : + 错误信息
    process.exit(1); //退出程序, 1表示有错误
  }
}
