import dns from "dns";

dns.setServers(["1.1.1.1"]);

import "dotenv/config"; //在index.js里import 'dotenv/config'; 加载.env 到process.env. 就可以在process.env.MONGO_URI里取得.env里的MONGO_URI的值
//process.env.MONGO_URI就能拿到.env里面的MONGO_URI=...
//process.env.PORT就能拿到.env里面的PORT=...
import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { Sensor } from "./sensor.js";
import * as measureService from "./services/measure.service.js";



await connectDatabase(); //先连接MongoDB，成功以后再app.listen，否则如果MongoDB连接不上，app.listen就会报错

// Le capteur simule alimente le service directement -- pas de route HTTP.
// A la seance 14, l'acquisition MQTT fera exactement la meme chose.
//
// Note : ce capteur simule n'exige PAS qu'un document Sensor "temp-b127"
// existe en base. La liaison mesure -> capteur n'est qu'une convention
// (le champ "sensor" contient cette chaine) tant qu'on ne fait pas de
// populate, ou tant que la seance 14 ne filtre pas sur les capteurs actifs
// en base. Creez le capteur via POST /api/sensors si vous voulez que
// populate("sensor", "name unit") renvoie autre chose que null.
const sensor = new Sensor("temp-b127", { min: 18, max: 32 });
sensor.on("measure", (measure) => measureService.add(measure));
sensor.start();

app.listen(process.env.PORT || 3000, () => //如果.env里面有PORT，就用PORT，否则就用3000
  console.log(`http://localhost:${process.env.PORT || 3000}`),
);
