import { mkdir, writeFile } from "fs/promises";
import { Sensor } from "./sensor.js";
import { computeStats } from "./stats.js";
import { Monitor } from "./monitor.js";

const tempSensor = {
    id : "temp-b127",
    name : "Température salle des serveurs",
    min : 18,
    max : 32,
    unit : "C",
    threshold : 28,
    direction : "above",
}

const humSensor = {
    id : "hum-b127",
    name : "Humiditée salle des serveurs",
    min : 35,
    max : 80,
    unit : "%",
    threshold : 50,
    direction : "bellow",
}

const temperature = new Sensor(tempSensor.id, { min: tempSensor.min, max: tempSensor.max });
const humidity = new Sensor(humSensor.id, { min: humSensor.min, max: humSensor.max });
const monitor = new Monitor({
  [tempSensor.id]: { threshold: tempSensor.threshold, direction: tempSensor.direction },
  [humSensor.id]: { threshold: humSensor.threshold, direction: humSensor.direction },
  }
);


const history = [];

function afficher(measure) {
  console.log(`${measure.createdAt} | ${measure.sensor} | ${measure.value}`);
}

function alert(alert){
 console.log(`ALERT ! ${alert.sensor} | ${alert.value} | ${alert.direction} | ${alert.threshold} `)
}

async function journaliser(measure) {
  history.push(measure);
  try {
    await mkdir("data", { recursive: true });
    await writeFile("data/measures.json", JSON.stringify(history, null, 2));
  } catch (error) {
    console.error("Ecriture impossible :", error.message);
  }
}

for (const sensor of [temperature, humidity]) {
  sensor.on("measure", afficher);
  sensor.on("measure", journaliser);
  sensor.on("measure", (measure) => {monitor.check(measure)});
  sensor.start();
}

monitor.on("alert", alert);


console.log("Deux capteurs demarres. Ctrl+C pour arreter.\n");

process.on("SIGINT", () => {
  temperature.stop();
  humidity.stop();

  console.log("\n--- Statistiques de la session ---");
  for (const sensor of [temperature, humidity]) {
    const measures = history.filter((measure) => measure.sensor === sensor.id);
    console.log(sensor.id, computeStats(measures));
  }
  process.exit(0);
});
