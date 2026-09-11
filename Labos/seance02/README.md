# Supervision — 420-317-AH

## État après la séance 2

Deux capteurs simulés produisent des mesures au format fixé à la séance 1 et les journalisent
dans `data/measures.json`.

```
src/sensor.js    classe Sensor (EventEmitter) — annonce, n'affiche pas
src/stats.js     computeStats() — sera exposé par une route à la séance 3
src/index.js     trois auditeurs branchés sur deux capteurs
src/sensor.js    classe Monitor (EventEmitter)— surveille les alertes et annonce
docs/questions.md  réponses de l'expérience de blocage
```

## Lancer

```
npm install
npm run dev      # Ctrl+C affiche les statistiques par capteur
```
