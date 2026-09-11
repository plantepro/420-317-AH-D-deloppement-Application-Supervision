# Séance 2 — réponses

## Partie 4 — Remplacer les capteurs simulés par de vrais appareils

**Un seul fichier : `index.js`**, et une seule ligne dedans — celle qui relie la source au
moniteur.

`sensor.js` disparaîtrait (l'appareil réel le remplace), mais `monitor.js`, les seuils, la
journalisation et les statistiques ne changeraient pas d'une ligne. C'est exactement ce qui
se produira à la séance 14 avec l'ESP32.

Si nous avions mis la décision d'alerte dans le `Sensor`, il faudrait au contraire tout
réécrire ce jour-là : l'appareil réel publie une valeur, il ne publie pas d'alerte.

## Partie 5 — Constater le blocage

### 1. Mesures de température affichées pendant les 3 secondes

**Aucune.** Le `setInterval` du capteur ne peut pas s'exécuter : le fil est occupé par la
boucle `while`.

### 2. Mesures d'humidité affichées

**Aucune non plus.**

Le capteur d'humidité est pourtant un objet distinct, avec son propre `setInterval`. Mais Node
n'a qu'**un seul fil d'exécution** pour tout notre code. Tant que la boucle `while` l'occupe,
aucune autre fonction ne peut démarrer — ni celle de l'humidité, ni un `console.log`, ni la
réponse à une requête HTTP.

Les deux capteurs ne sont pas indépendants dans les faits : ils partagent le même fil.

### 3. Écart entre les horodatages

Environ **5 secondes** au lieu de 2 : les 2 secondes prévues plus les 3 secondes de blocage.

`setInterval` n'est pas une garantie de ponctualitém c'est une demande. Node l'honore quand
le fil se libère.

### Conclusion

`writeFileSync` produit exactement le même effet que cette boucle : pendant l'écriture, le fil
est bloqué. Dans un serveur, cela signifie que **tous** les clients attendent, y compris les
capteurs qui essaient d'envoyer leurs mesures. Alors qu'un seul d'entre eux a déclenché
l'écriture.