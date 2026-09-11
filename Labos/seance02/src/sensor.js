import { EventEmitter } from "events";

/**
 * Un capteur simule.
 * Il annonce ses mesures et ne connait pas ceux qui l'ecoutent.
 * A la seance 14, un ESP32 reel le remplacera en produisant le meme format.
 */
export class Sensor extends EventEmitter {
  constructor(id, { min, max }) {
    super();
    this.id = id;
    this.min = min;
    this.max = max;
    this.timer = null;
  }

  read() {
    const value = this.min + Math.random() * (this.max - this.min);
    return Number(value.toFixed(1));
  }

  start(intervalMs = 2000) {
    if (this.timer) return;

    this.timer = setInterval(() => {
          // Format fixe a la seance 1 : une valeur, un instant, un capteur.
          // Ni unite ni seuil : ils appartiennent au capteur, pas a la mesure.
          const measure = {
            sensor: this.id,
            value: this.read(),
            createdAt: new Date().toISOString(),
          };

          this.emit("measure", measure);
      }, intervalMs);
  }

  stop() {
    clearInterval(this.timer);
    this.timer = null;
  }
}
