/**
 * Le tableau de bord : tout l'affichage. FOURNI, rien a modifier ici.
 *
 * Ce fichier ne sait pas COMMENT on parle au serveur : il appelle les fonctions de
 * connections.js (les TODO). Chaque appel est repere par un commentaire "connections.js".
 *
 * Regle de securite : tout ce qui vient du reseau (nom d'un capteur, valeur, message
 * d'erreur) est ecrit avec textContent. Jamais de HTML construit a partir d'une donnee :
 * le nom d'un capteur est saisi par quelqu'un, il pourrait contenir une balise.
 */
import {
  getToken, saveToken, clearToken, onSessionExpired,
  login, loadSensors, loadMeasures, loadStatistics, createSensor,
  openSocket, bindConnection, bindMeasures, bindSensors,
} from "/connections.js";

const MAX_POINTS = 20;        // taille du graphique et du tableau
const REFRESH_DELAY = 500;    // regroupe les rafraichissements d'un meme capteur (ms)

const loginSection = document.querySelector("#login");
const dashboardSection = document.querySelector("#dashboard");
const loginForm = document.querySelector("#login-form");
const loginError = document.querySelector("#login-error");
const statusLight = document.querySelector("#status");
const userLabel = document.querySelector("#user");
const sensorForm = document.querySelector("#sensor-form");
const sensorFormError = document.querySelector("#sensor-form-error");
const statusMessage = document.querySelector("#message");
const sensorsContainer = document.querySelector("#sensors");
const emptyMessage = document.querySelector("#empty");

let socket = null;
let generation = 0;          // change a chaque rechargement complet : ecarte les reponses perimees
const cards = new Map();     // identifiant du capteur -> carte (voir createCard)

// ----------------------------------------------------------------- Messages

function showMessage(text, isError = false) {
  statusMessage.textContent = text;
  statusMessage.className = isError ? "error" : "";
}

function updateEmpty() {
  emptyMessage.hidden = cards.size > 0;
}

function showDashboard(connected) {
  loginSection.hidden = connected;
  dashboardSection.hidden = !connected;
}

// Le role sert UNIQUEMENT a cacher le formulaire aux comptes qui n'y ont pas droit.
// La vraie verification est faite par le serveur (403) : rien ici n'est une protection.
function roleFromToken(token) {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64)).role;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ Etat

function isExceeded(sensor, value) {
  return sensor.direction === "above" ? value > sensor.threshold : value < sensor.threshold;
}

function showState(card, inAlert) {
  card.element.classList.toggle("alert", inAlert);
  card.state.textContent = inAlert ? `Alerte (seuil ${card.sensor.threshold})` : "Normal";
}

function showStatistics(card, stats) {
  card.stats.textContent = stats.count > 0
    ? `${stats.count} mesures, min ${stats.min}, max ${stats.max}, moyenne ${stats.average.toFixed(2)}`
    : "Aucune statistique";
}

function showTable(card) {
  const { field, order } = card.sort;
  const direction = order === "asc" ? 1 : -1;

  // Le tri porte sur ces vingt mesures, copiees : l'ordre recu du serveur n'est pas touche.
  const rows = [...card.measures].sort((a, b) =>
    field === "value"
      ? direction * (a.value - b.value)
      : direction * (new Date(a.createdAt) - new Date(b.createdAt)),
  );

  card.body.replaceChildren();
  if (rows.length === 0) {
    const cell = card.body.insertRow().insertCell();
    cell.colSpan = 2;
    cell.textContent = "Aucune mesure";
  }
  for (const measure of rows) {
    const row = card.body.insertRow();
    row.insertCell().textContent = new Date(measure.createdAt).toLocaleTimeString();
    row.insertCell().textContent = measure.value;
  }

  for (const button of card.element.querySelectorAll("thead button")) {
    const active = button.dataset.field === field;
    const arrow = active ? (order === "asc" ? " ▲" : " ▼") : "";
    button.textContent = button.dataset.label + arrow;
  }
}

// --------------------------------------------------------------- Les cartes

function readBound(input) {
  // Un champ vide donne undefined : loadMeasures ne doit alors rien envoyer.
  const text = input.value.trim();
  return text === "" || !Number.isFinite(Number(text)) ? undefined : Number(text);
}

function createCard(sensor) {
  const element = document.createElement("article");
  const title = document.createElement("h2");
  const value = document.createElement("p");
  const state = document.createElement("p");
  const stats = document.createElement("p");
  const chartArea = document.createElement("div");
  const canvas = document.createElement("canvas");
  const error = document.createElement("p");

  title.textContent = sensor.name;
  value.className = "value";
  value.textContent = "--";
  state.className = "state";
  stats.className = "stats";
  stats.textContent = "Chargement...";
  chartArea.className = "chart-area";
  chartArea.append(canvas);
  error.className = "card-error";
  error.setAttribute("role", "alert");

  // Les deux champs qui filtrent le tableau (par l'API, pas dans le navigateur).
  const filter = document.createElement("p");
  filter.className = "filter";
  const minInput = document.createElement("input");
  const maxInput = document.createElement("input");
  for (const input of [minInput, maxInput]) {
    input.type = "number";
    input.step = "any";
  }
  filter.append("Valeur min ", minInput, " max ", maxInput);

  const details = document.createElement("details");
  details.open = true;
  const summary = document.createElement("summary");
  summary.textContent = `${MAX_POINTS} dernieres mesures`;
  const table = document.createElement("table");
  const header = table.createTHead().insertRow();
  const body = table.createTBody();
  details.append(summary, filter, table);

  element.append(title, value, state, stats, error, chartArea, details);
  sensorsContainer.append(element);

  const chart = new Chart(canvas, {
    type: "line",
    data: {
      labels: [],
      datasets: [{ label: `${sensor.name} (${sensor.unit})`, data: [], borderColor: "#2e7d32" }],
    },
    // Sans animation : un graphique qui rebondit a chaque mesure fatigue l'oeil.
    options: { animation: false, maintainAspectRatio: false },
  });

  const card = {
    sensor, element, title, value, state, stats, error, chart, body, minInput, maxInput,
    measures: [],                                   // le contenu du tableau
    sort: { field: "createdAt", order: "desc" },
    lastValue: null,
    requestNumber: 0,                               // numero de la derniere requete du tableau
    timer: null,
  };

  for (const [field, label] of [["createdAt", "Heure"], ["value", "Valeur"]]) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.label = label;
    button.dataset.field = field;
    button.addEventListener("click", () => {
      const { sort } = card;
      // Meme colonne : on inverse. Autre colonne : la valeur du plus petit au plus grand,
      // l'heure du plus recent au plus ancien.
      const order = sort.field === field
        ? (sort.order === "desc" ? "asc" : "desc")
        : (field === "value" ? "asc" : "desc");
      card.sort = { field, order };
      showTable(card);
    });
    header.insertCell().append(button);
  }

  // Changer une borne relance la requete : le filtre est applique par le serveur.
  for (const input of [minInput, maxInput]) {
    input.addEventListener("change", () => refreshCard(card));
  }

  showTable(card);
  showState(card, false);
  cards.set(sensor._id, card);
  updateEmpty();
  return card;
}

function removeCard(id) {
  const card = cards.get(id);
  if (!card) return;
  clearTimeout(card.timer);
  card.chart.destroy();
  card.element.remove();
  cards.delete(id);
  updateEmpty();
}

// ------------------------------------------------------------ Les donnees

/**
 * Relit le tableau et les statistiques aupres du serveur.
 * Appelee au chargement, quand un filtre change, et apres chaque mesure recue.
 * Le numero de requete ecarte une reponse lente arrivee apres une plus recente.
 */
async function refreshCard(card) { //
  const requestNumber = ++card.requestNumber;
  const id = card.sensor._id;
  try {
    const [measures, stats] = await Promise.all([ //Promise.all() wait for the completion of the two async reqs, then receive the result through Array Destructuring：const [measures, stats] = ...
      
      // connections.js, TODO 3 et TODO 4
      // requesting two types of donnes ensemble: 1. loadMeasures() 2. LoadStatistcs(id)
      // measures 接收的是 loadMeasures() 返回的测量数组，stats 接收的是 loadStatistics() 返回的统计结果。
      loadMeasures(id, {
        min: readBound(card.minInput),
        max: readBound(card.maxInput),
        limit: MAX_POINTS,
      }), //min 和 max 来自用户在 Dashboard 中填写的输入框，因此这个调用还支持筛选测量值。
      loadStatistics(id),
    ]);

    if (requestNumber !== card.requestNumber || cards.get(id) !== card) return;
    card.measures = measures; //测量数组存进 card.measures，随后用于刷新表格；
    card.error.textContent = "";
    showTable(card);
    showStatistics(card, stats); //统计结果则用于刷新统计区域。
  } catch (e) {
    if (requestNumber !== card.requestNumber || cards.get(id) !== card) return;
    card.error.textContent = e.message;
  }
}

// Une rafale de mesures ne doit pas lancer une rafale de requetes : une seule par delai.
function scheduleRefresh(card) {
  if (card.timer) return;
  card.timer = setTimeout(() => {
    card.timer = null;
    refreshCard(card);
  }, REFRESH_DELAY);
}

function addPoint(card, measure) {
  const { labels, datasets } = card.chart.data;
  labels.push(new Date(measure.createdAt).toLocaleTimeString()); //添加时间标签
  datasets[0].data.push(measure.value); //2. 添加测量值

  // Fenetre glissante : sans cette limite, la page ralentit puis devient illisible.
  if (labels.length > MAX_POINTS) { //是否超过限制点数
    labels.shift(); //删除最早的时间标签
    datasets[0].data.shift(); //删除与之对应的最早测量值。
  } //
  card.chart.update(); //通知 Chart.js 更新图表，把数据或配置的变化显示到页面上。

  card.lastValue = measure.value;
  card.value.textContent = `${measure.value.toFixed(1)} ${card.sensor.unit}`;
} //更新最新测量值的显示

async function fillCard(card) {
  const id = card.sensor._id;
  try {
    // connections.js, TODO 3 : la reponse est triee de la plus RECENTE a la plus ancienne,
    // le graphique se lit de l'ancienne a la recente.
    const measures = await loadMeasures(id, { limit: MAX_POINTS }); //ici it only passed limit, which means it requires the measures with a designated number,it doesn't set the filter conditions for min & max
    if (cards.get(id) !== card) return;
    for (const measure of [...measures].reverse()) addPoint(card, measure);
    //measures 是刚刚收到的数组。
    // [...measures].reverse() 创建一个副本，再将顺序反转。
    // addPoint(card, measure) 把每条测量记录添加到图表中。
    // 为什么反转？因为 API 返回的是最新记录在前，而图表需要按照从旧到新的顺序显示

    // L'etat d'alerte n'est pas stocke : on le deduit de la derniere valeur.
    if (card.lastValue !== null) showState(card, isExceeded(card.sensor, card.lastValue));
  } catch (e) {
    if (cards.get(id) === card) card.error.textContent = e.message;
  }
  await refreshCard(card);
}

async function reloadAll() {
  const current = ++generation;
  showMessage("Chargement...");
  for (const id of [...cards.keys()]) removeCard(id);
  updateEmpty();

  try {
    const sensors = await loadSensors(); // connections.js, TODO 2
    if (current !== generation) return;
    const newCards = sensors.filter((s) => s.active).map(createCard);
    await Promise.all(newCards.map(fillCard));
    if (current === generation) showMessage("");
  } catch (e) {
    if (current === generation) showMessage(`Chargement impossible : ${e.message}`, true);
  }
}

// ------------------------------------------------- Ce que fait le socket
//Handler	什么时候调用	页面预期表现
// connected()	Socket.IO 连接成功	显示 En direct，调用 reloadAll()
// disconnected()	连接断开	显示 Reconnexion...
// refused(text)	连接尝试失败	显示 Reconnexion...；如果 token 无效，则退出登录
const connectionHandlers = {
  connected() {//这里定义了一个普通的 JavaScript 对象，connected() 是对象中的一个方法。它的内容规定了：当连接成功事件被处理时，将状态改成 En direct，然后调用 reloadAll()。
    statusLight.textContent = "En direct";
    statusLight.className = "ok";
    // Apres une coupure, les mesures manquees ne reviennent pas : on recharge tout.
    reloadAll();
  },
  disconnected() {
    statusLight.textContent = "Reconnexion...";
    statusLight.className = "ko";
  },
  refused(text) {
    statusLight.textContent = "Reconnexion...";
    statusLight.className = "ko";
    if (text === "Jeton absent ou invalide") logout("Session expiree, reconnectez-vous");
  },
};

const measureHandlers = {
  measure(measure) {
    const card = cards.get(measure.sensor);
    if (!card) return;
    addPoint(card, measure);
    scheduleRefresh(card); // le tableau et les statistiques sont relus aupres du serveur
  },
  alert(alert) {
    const card = cards.get(alert.sensor);
    if (card) showState(card, true);
  },
  recovery(recovery) {
    const card = cards.get(recovery.sensor);
    if (card) showState(card, false);
  },
};

const sensorHandlers = {
  created(sensor) {
    if (!sensor.active || cards.has(sensor._id)) return;
    fillCard(createCard(sensor));
  },
  updated(sensor) {
    const card = cards.get(sensor._id);
    if (!sensor.active) return removeCard(sensor._id);   // desactive : il disparait
    if (!card) return fillCard(createCard(sensor));       // reactive : il revient avec son historique
    card.sensor = sensor;
    card.title.textContent = sensor.name;
    card.chart.data.datasets[0].label = `${sensor.name} (${sensor.unit})`;
    card.chart.update();
    if (card.lastValue !== null) showState(card, isExceeded(sensor, card.lastValue));
  },
  deleted({ id }) {
    removeCard(id);
  },
};

// --------------------------------------------------------------- Session

function start() {
  const token = getToken();
  showDashboard(true);
  showMessage("");
  const role = roleFromToken(token);
  userLabel.textContent = role ? `role : ${role}` : "";
  sensorForm.hidden = !["operator", "admin"].includes(role);

  statusLight.textContent = "Connexion...";
  statusLight.className = "";
  try {//在这里注意理解异步事件驱动概念和事件驱动编程概念（programmation événementielle）
    socket = openSocket(token);     //负责建立连接，但调用它不代表连接已经成功。                 // connections.js, TODO 6
     // bindConnection(...) 负责注册监听器，socket = openSocket("invalid-test-token");        但注册监听器不代表监听器立即执行。
     // connections.js, TODO 6， 调用 openSocket(token)，请求建立 Socket.IO 连接。
    bindConnection(socket, connectionHandlers);      // TODO 7
    //注意：bindConnection() 叫做异步事件驱动，不是直接调用 connectionHandlers.connected()，而是把这个函数注册起来，等连接事件发生时再执行。
    // 为什么要先注册监听器？
    // 假设网络需要 200 毫秒才能完成连接。
    // 如果代码只创建 Socket，却没有监听连接事件，前端就不知道什么时候应该把状态更新为 En direct，也不知道什么时候开始执行 reloadAll()。
    // 通过事件监听器，程序可以在连接成功时自动执行后续工作。这是一种典型的事件驱动编程（programmation événementielle）。
    bindMeasures(socket, measureHandlers);           // TODO 8
    bindSensors(socket, sensorHandlers);             // TODO 9
  } catch (e) {
    statusLight.textContent = "Hors ligne";
    statusLight.className = "ko";
    showMessage(e.message, true);
  }
}

function logout(text = "") {
  generation += 1;
  if (socket) socket.disconnect();
  socket = null;
  clearToken();
  for (const id of [...cards.keys()]) removeCard(id);
  updateEmpty();
  loginError.textContent = text;
  showDashboard(false);
}

//当登录会话失效时，通知 Dashboard 执行 logout()，并显示“会话已过期，请重新登录”。真正触发它的逻辑在 connections.js 已有的 api() 函数中：sessionExpiredHandler();
onSessionExpired(() => logout("Session expiree, reconnectez-vous")); //清除本地 token、断开实时连接，并让用户重新登录。

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";
  try {
    const response = await login(                  // connections.js, TODO 1
      document.querySelector("#email").value,
      document.querySelector("#password").value,
    ); //1. 通过 REST API 发送账号密码 等待登录请求完成，取得服务器返回的 response。
    saveToken(response.token); //2.从服务器返回的response.token 取出 JWT，保存到浏览器的 sessionStorage。此函数在connections.js里面定义
    start(); //3.开始加载 Dashboard，start() 先读取 Token 和角色，再调用 openSocket(token) 建立 Socket.IO 连接，随后注册连接、测量值和传感器事件处理器。connections.js 里的 api() 会自动给需要身份验证的请求添加：headers.Authorization = `Bearer ${token}`;
  //start（）建立连接 并在这里注册事件处理函数，（370-388行）
  // Socket.IO 连接成功后，Socket.IO 会自动调用这个函数。异步事件驱动
  //这些代码依次执行。Socket.IO 的连接则可能需要一些时间才能完成。
  //在连接等待期间，JavaScript 可以继续执行后面的代码，注册测量值和传感器事件监听器。等连接成功后，Socket.IO 才触发连接事件，进而执行 connected()。
  //因此，reloadAll() 不是由 start() 直接调用的，而是通过“连接事件 → 事件处理器 → reloadAll()”这条调用链间接执行的。
  // 这个事件回调再调用 reloadAll()。
  } catch (e) {
    loginError.textContent = e.message;
  }
});

sensorForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  sensorFormError.textContent = "";
  try {
    await createSensor({                            // connections.js, TODO 5
      id: document.querySelector("#sensor-id").value.trim(),
      name: document.querySelector("#sensor-name").value.trim(),
      unit: document.querySelector("#sensor-unit").value.trim(),
      min: Number(document.querySelector("#sensor-min").value),
      max: Number(document.querySelector("#sensor-max").value),
      threshold: Number(document.querySelector("#sensor-threshold").value),
      direction: document.querySelector("#sensor-direction").value,
    });
    sensorForm.reset();
  } catch (e) {
    sensorFormError.textContent = e.message;
  }
});

document.querySelector("#logout").addEventListener("click", () => logout());

if (getToken()) start();
