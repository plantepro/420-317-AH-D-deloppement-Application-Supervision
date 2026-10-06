import Sensor from "../models/sensor.model.js";
import Measure from "../models/measure.model.js";

// Test 1 : capteur sans id
const sensor1 = new Sensor({
  name: "Temperature",
  unit: "°C",
  min: 18,
  max: 32,
  threshold: 30,
  direction: "above",
});

const error1 = sensor1.validateSync();

console.log("Test 1 - Sensor sans id:", error1 ? "PASS" : "FAIL");

// Test 2 : id avec un caractère interdit
const sensor2 = new Sensor({
  _id: "salle b1/127",
  name: "Temperature",
  unit: "°C",
  min: 18,
  max: 32,
  threshold: 30,
  direction: "above",
});

const error2 = sensor2.validateSync();

console.log("Test 2 - ID invalide:", error2 ? "PASS" : "FAIL");

// Test 3 : id valide
const sensor3 = new Sensor({
  _id: "temp-b127",
  name: "Temperature",
  unit: "°C",
  min: 18,
  max: 32,
  threshold: 30,
  direction: "above",
});

const error3 = sensor3.validateSync();

console.log("Test 3 - ID valide:", !error3 ? "PASS" : "FAIL");

// Test 4 : direction invalide
const sensor4 = new Sensor({
  _id: "temp-b128",
  name: "Temperature",
  unit: "°C",
  min: 18,
  max: 32,
  threshold: 30,
  direction: "wrong",
});

const error4 = sensor4.validateSync();

console.log("Test 4 - Direction invalide:", error4 ? "PASS" : "FAIL");

// Test 5 : mesure sans capteur
const measure5 = new Measure({
  value: 25,
});

const error5 = measure5.validateSync();

console.log("Test 5 - Mesure sans capteur:", error5 ? "PASS" : "FAIL");

// Test 6 : mesure avec un id de capteur texte
const measure6 = new Measure({
  sensor: "temp-b127",
  value: 25,
});

const error6 = measure6.validateSync();

console.log("Test 6 - ID de capteur texte:", !error6 ? "PASS" : "FAIL");

// Test 7 : valeur non numérique
const measure7 = new Measure({
  sensor: "temp-b127",
  value: "bonjour",
});

const error7 = measure7.validateSync();

console.log(
  "Test 7 - Valeur non numérique:",
  error7 ? "PASS" : "FAIL"
);

// Test 8 : valeur hors bornes
const measure8 = new Measure({
  sensor: "temp-b127",
  value: 100,
});

const error8 = measure8.validateSync();

console.log(
  "Test 8 - Valeur hors bornes:",
  error8 ? "PASS" : "FAIL"
);