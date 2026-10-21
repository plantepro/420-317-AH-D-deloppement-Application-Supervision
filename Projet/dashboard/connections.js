/**
 * Les connexions entre le tableau de bord et le serveur.
 *
 * C'est le SEUL fichier a ecrire cote tableau de bord : src/public/connections.js.
 * Tout le reste (dashboard.js, index.html, style.css) est fourni et ne change pas : il appelle
 * les fonctions ci-dessous et ne sait rien de l'adresse des routes ni du nom des evenements.
 *
 * Neuf TODO, dans cet ordre, tous dans CE fichier :
 *   REST   : 1 connexion, 2 liste des capteurs, 3 mesures, 4 statistiques, 5 creation
 *   SOCKET : 6 ouverture, 7 etat de la connexion, 8 mesures et alertes, 9 capteurs
 *
 * Ou trouver les reponses : le README de votre serveur contient le tableau des routes (methode,
 * chemin, role) et le tableau des evenements Socket.IO (nom, contenu). Les noms sont a copier
 * tels quels : une lettre de travers et rien ne se passe, sans erreur.
 *
 * Tant qu'un TODO n'est pas fait, la page affiche son message d'erreur : c'est voulu,
 * cela vous dit ou vous en etes.
 */

// ---------------------------------------------------------------------------
// FOURNI : le jeton et la fonction api(). Rien a modifier.
// ---------------------------------------------------------------------------

const TOKEN_KEY = "token"; //定义常量， 作为浏览器sessionStorage中储存Token的键名
//sessionStorage 通常在当前浏览器标签页的会话期间保留数据，关闭该标签页后，数据通常会被清除。
export function getToken() { //read token
  return sessionStorage.getItem(TOKEN_KEY); //从浏览器的 sessionStorage 读取已经保存的 Token。例如，用户登录成功后，浏览器可能存储了一个 JWT。之后请求服务器时，就可以通过 getToken() 取出它。如果这个键不存在，getItem() 会返回 null。
}
export function saveToken(token) { //将服务器返回的 Token 保存到浏览器会话存储中。
  sessionStorage.setItem(TOKEN_KEY, token);
}
export function clearToken() { //删除保存的 Token,例如，用户退出登录，或者服务器返回 401 Unauthorized 表示当前认证无效时，应用可能需要清除 Token，避免继续使用失效凭证
  sessionStorage.removeItem(TOKEN_KEY);
}

let sessionExpiredHandler = () => {}; //会话过期处理函数,定义了一个变量，初始值是一个什么也不做的空函数
/** dashboard.js y inscrit ce qu'il faut faire quand le serveur repond 401. */
export function onSessionExpired(handler) { //注册会话过期时的处理逻辑, 允许 dashboard.js 把自己的处理函数传进来，交给 connections.js 保存。
  sessionExpiredHandler = handler;
}

/**
 * Appelle l'API et retourne le JSON recu.
 *   api("/chemin")                                   -> GET
 *   api("/chemin", { method: "POST", body: {...} })  -> envoie body en JSON
 * 向服务器发送一个 HTTP POST 请求，并将对象作为 JSON 请求体。登录时，前端会把邮箱和密码发送给服务器。具体路由地址还需要查看服务器README
 * Elle ajoute l'en-tete Authorization quand un jeton existe, et leve une Error dont le
 * message est lisible par l'utilisateur : celui du serveur ({ error } ou { errors: [...] }).
 * Un 401 avec jeton signifie que la session a expire : le tableau de bord revient a la
 * connexion.
 * 当 Token（令牌）存在时，api() 函数会添加 Authorization 请求头，并抛出一个 Error 错误对象，其错误信息是用户能够看懂的，也就是服务器返回的错误信息（{ error } 或 { errors: [...] }）。
 * 如果请求携带了 Token，却收到了 HTTP 401 响应，就意味着会话已经过期，Dashboard（仪表板）会返回登录界面。
 */

//向服务器发送 HTTP 请求，自动携带 JWT，并在服务器返回 401 时处理会话失效。
//处理 1. 请求体使用什么格式；2.请求是否携带身份认证信息。


async function api(path, { method = "GET", body } = {}) { //申明异步，请求路径，解构函数2 并为method设置默认值“GET”
  const token = getToken();//读取token
  const headers = {}; //准备请求头
  if (body !== undefined) headers["Content-Type"] = "application/json"; //只有当请求体 body 存在时，才添加：Content-Type: application/json  这告诉服务器：请求体的数据格式是 JSON。
  if (token) headers.Authorization = `Bearer ${token}`; //如果 Token 存在，就添加认证请求头：Authorization: Bearer <JWT>

  const response = await fetch(path, { //fetch() 是浏览器提供的 HTTP 请求 API
    method, //请求方法，例如 GET、POST
    headers, //请求头，包括 Content-Type 和 Authorization
    body: body === undefined ? undefined : JSON.stringify(body), //三元表达式，发送给服务器的请求数据
  });
//检查 HTTP 401：会话失效
  if (response.status === 401 && token) { //判断对话失效，必须同时满足：1. 服务器返回的 HTTP 状态码是 401。2. 发起请求时，本地存在 Token。
    sessionExpiredHandler(); //调用之前注册的会话失效处理函数（dashboard.js)。最终会执行 logout()，清除 Token、断开 Socket.IO 连接并返回登录界面。
    throw new Error("Session expiree, reconnectez-vous"); //即使调用 sessionExpiredHandler() 已经触发了退出登录流程，这里仍然会抛出一个错误，终止当前 api() 调用的正常执行，并让调用它的代码进入 catch（如果有）。
  }
  // 尝试把服务器响应解析为 JSON。
  // 如果 HTTP 响应不成功，读取服务器返回的错误信息，转换成 JavaScript 的 Error，交给调用函数的地方显示
  // 如果请求成功，返回解析后的数据。

  const content = await response.json().catch(() => ({})); // 解析响应内容，解析之后，content 就是一个 JavaScript 对象，可以被content.errors读取 un 204 n'a pas de corps
  //catch(() => ({})) 服务器可能返回一个空响应，或者返回的内容不是 JSON。此时 response.json() 可能抛出解析错误。
  if (!response.ok) { //为什么加这个？fetch（）的特点：即使服务器返回 HTTP 400、403 或 500，fetch() 通常也不会自动抛出错误。因此，我们需要自己检查response.ok 并回应布尔值
    throw new Error(content.errors?.join(", ") ?? content.error ?? `Erreur ${response.status}`);
  }//?.：可选链 ??：空值合并运算符
  //优先级1： content.errors 如果服务器返回错误数组，就把数组里的错误合并，join(", ") 是把数组元素合并为一个字符串，并用逗号和空格分隔。。
  //优先级 2：content.error 如果没有可用的错误数组，就读取单个错误消息。
  //优先级 3：HTTP 状态码 如果前两种方式都没有提供消息，就使用 Erreur 400、Erreur 500 等作为备用。
  return content; //只有前面的错误检查通过后，程序才会执行这行代码， api() 会把解析后的 JavaScript 对象返回给调用者。
  //于是 login() 就可以获得这个对象，dashboard.js 也就可以执行saveToken(response.token);
}

// ---------------------------------------------------------------------------
// REST : cinq fonctions a ecrire avec api()
//
// Rappel de api(chemin, { method, body }) : elle retourne le JSON deja decode (un objet ou
// un tableau JavaScript, pas du texte) et leve une Error si le serveur refuse.
// ---------------------------------------------------------------------------

/**
 * TODO 1 : se connecter.
 *
 * Appelle la route de connexion du serveur.
 *
 * @param {string} email     le courriel saisi
 * @param {string} password  le mot de passe saisi
 * @returns {Promise<{ token: string, user: { id: string, email: string, role: string } }>}
 *          la reponse du serveur, TELLE QUELLE (ne retournez pas seulement le jeton :
 *          dashboard.js lit response.token).
 * @throws  Error("Identifiants invalides") si le serveur refuse : api() s'en charge.
 *
 * Exemple de valeur retournee :
 *   { token: "eyJhbGciOi...", user: { id: "665f...", email: "a@b.ca", role: "operator" } }
 *
 * Attention : le serveur attend les champs "email" et "password" dans le corps JSON.
 */
/**
 * 老师的要求 
 * 1. 请求体必须包含 email 和 password 两个字段。
 * 2. 必须调用服务器真正存在的登录路由。
 * 3. 成功时返回服务器的完整响应，不能只返回 Token。
 * 4. 如果服务器拒绝请求，让已有的 api() 处理错误，不要再写一套重复的错误处理逻辑。
 * dashboard.js 已经写好了调用方式， login() 的返回值必须让 response.token 能够正常读取
 */
export async function login(email, password) {
  //throw new Error("TODO 1 : login n'est pas encore ecrite (connections.js)");
  return api("/api/auth/login", { method : "POST", body:{email,password} })
}

/**
 * TODO 2 : la liste des capteurs.
 *
 * @returns {Promise<Array<{
 *   _id: string, name: string, unit: string, min: number, max: number,
 *   threshold: number, direction: "above" | "below", active: boolean
 * }>>}  un TABLEAU de capteurs, tous les capteurs (actifs ou non).
 *
 * Exemple de valeur retournee :
 *   [ { _id: "temp-b127", name: "Salle A", unit: "C", min: 0, max: 50,
 *       threshold: 28, direction: "above", active: true } ]
 *
 * Ne filtrez rien : dashboard.js garde lui-meme les capteurs actifs.
 */
export async function loadSensors() {
  //throw new Error("TODO 2 : loadSensors n'est pas encore ecrite (connections.js)");
  return api("/api/sensors");
}

/**
 * TODO 3 : les dernieres mesures d'UN capteur.
 *
 * @param {string} sensorId  l'identifiant du capteur, par exemple "temp-b127"
 * @param {object} options
 * @param {number} options.limit  nombre de mesures voulues (toujours fourni)
 * @param {number} [options.min]  garder les valeurs >= min (undefined : pas de borne)
 * @param {number} [options.max]  garder les valeurs <= max (undefined : pas de borne)
 * @returns {Promise<Array<{ _id: string, value: number, createdAt: string }>>}
 *          un TABLEAU de mesures, la plus RECENTE en premier (c'est l'ordre du serveur).
 *
 * Exemple de valeur retournee :
 *   [ { _id: "6650...", value: 24.3, createdAt: "2026-10-14T16:02:11.000Z" },
 *     { _id: "6650...", value: 24.1, createdAt: "2026-10-14T16:02:09.000Z" } ]
 *
 * La route ne renvoie PAS ce tableau directement : elle renvoie un objet
 *   { data: [ ...les mesures... ], pagination: { page, limit, total, pages } }
 * Il faut donc retourner la propriete "data", et rien d'autre.
 *
 * Deux pieges :
 *   - n'ajoutez min ou max a l'adresse QUE s'il est defini. Un "?min=" vide est lu comme 0
 *     par le serveur et filtre les valeurs negatives sans prevenir ;
 *   - construisez l'adresse avec URLSearchParams, pas avec des morceaux de texte colles.
 *
 * Les noms des parametres de la route (capteur, limite, bornes) sont dans le README du serveur,
 * section sur les filtres. Le serveur plafonne la limite a 100.
 */
export async function loadMeasures(sensorId, { min, max, limit } = {}) {
  // new Error("TODO 3 : loadMeasures n'est pas encore ecrite (connections.js)");
  const params = {
    sensor: sensorId,
    limit: limit
  };
  if (min!==undefined){
    params.min = min
  }
  if (max!==undefined){
    params.max = max
  }
  const query = new URLSearchParams(params);
  const response = await api("/api/measures" + "?"+ query.toString())

  return response.data
}

/**
 * TODO 4 : les statistiques d'UN capteur.
 *
 * @param {string} sensorId  l'identifiant du capteur
 * @returns {Promise<{ count: number, min: number | null, max: number | null, average: number | null }>}
 *          un OBJET, calcule par le serveur pour ce seul capteur. Le tableau de bord
 *          n'additionne rien lui-meme.
 *
 * Exemple de valeur retournee :
 *   { count: 142, min: 18.2, max: 31.9, average: 24.67 }
 * Capteur sans mesure : { count: 0, min: null, max: null, average: null }
 *
 * Attention : sans l'identifiant du capteur dans l'adresse, le serveur calcule les statistiques
 * de TOUTES les mesures, tous capteurs confondus.
 */
export async function loadStatistics(sensorId) {
  throw new Error("TODO 4 : loadStatistics n'est pas encore ecrite (connections.js)");
}

/**
 * TODO 5 : creer un capteur.
 *
 * @param {{ id: string, name: string, unit: string, min: number, max: number,
 *           threshold: number, direction: "above" | "below" }} sensor
 *        deja au bon format (nombres, pas du texte) : envoyez-le tel quel dans le corps JSON.
 * @returns {Promise<object>}  le capteur cree, tel que repondu par le serveur
 *          (avec son champ "_id", pas "id").
 * @throws  Error dont le message vient du serveur (400 donnee invalide, 403 role insuffisant,
 *          409 identifiant deja utilise) : api() s'en charge, dashboard.js l'affiche sous le
 *          formulaire. Vous n'avez rien a ajouter.
 *
 * Ne creez PAS la carte vous-meme apres la reponse : le serveur annonce la creation a
 * tous les navigateurs par un evenement (voir TODO 9), le votre compris.
 */
export async function createSensor(sensor) {
  throw new Error("TODO 5 : createSensor n'est pas encore ecrite (connections.js)");
}

// ---------------------------------------------------------------------------
// SOCKET : quatre fonctions a ecrire avec la variable globale io()
//
// Une fonction "bind" ne RETOURNE rien : elle inscrit des ecouteurs avec socket.on(nom, fonction)
// et c'est tout. Les fonctions a appeler (handlers.xxx) sont deja ecrites dans dashboard.js.
// Le nom d'un evenement est un TEXTE copie du README du serveur, par exemple "measure".
// ---------------------------------------------------------------------------

/**
 * TODO 6 : ouvrir la connexion Socket.IO.
 *
 * @param {string} token  le jeton JWT obtenu a la connexion
 * @returns {Socket}  le socket retourne par io(), tel quel
 *
 * io() est fourni par le script /socket.io/socket.io.js, que le serveur sert lui-meme
 * (voir index.html) : c'est une variable globale, rien a importer. Le serveur refuse toute
 * connexion sans jeton : transmettez-le dans l'option "auth", sous le nom "token".
 */
export function openSocket(token) {
  throw new Error("TODO 6 : openSocket n'est pas encore ecrite (connections.js)");
}

/**
 * TODO 7 : suivre l'etat de la connexion.
 *
 * @param {Socket} socket  le socket du TODO 6
 * @param {{ connected: () => void, disconnected: () => void, refused: (message: string) => void }} handlers
 * @returns {void}
 *
 * Inscrivez un ecouteur pour chacun des trois evenements d'etat de Socket.IO :
 *
 *   evenement Socket.IO  | quand                                    | appelez
 *   ---------------------+------------------------------------------+---------------------------
 *   "connect"            | la connexion reussit (aussi apres une    | handlers.connected()
 *                        | coupure)                                 |
 *   "disconnect"         | la connexion tombe                       | handlers.disconnected()
 *   "connect_error"      | une tentative echoue (recoit une erreur) | handlers.refused(error.message)
 *
 * Ces trois noms sont fixes, propres a Socket.IO : ils ne sont pas dans le README du serveur
 * mais dans la documentation de la bibliotheque. "connected" et "disconnected" n'ont aucun
 * parametre; "refused" recoit le TEXTE de l'erreur (error.message), pas l'objet Error.
 */
export function bindConnection(socket, handlers) {
  throw new Error("TODO 7 : bindConnection n'est pas encore ecrite (connections.js)");
}

/**
 * TODO 8 : ecouter les mesures et les alertes.
 *
 * @param {Socket} socket
 * @param {{ measure: (m: object) => void, alert: (a: object) => void, recovery: (r: object) => void }} handlers
 * @returns {void}
 *
 * Inscrivez un ecouteur pour chacun des trois evenements que le serveur diffuse (leurs noms
 * sont dans le tableau des evenements du README du serveur). Chaque fonction de "handlers"
 * recoit directement le contenu de l'evenement, sans transformation :
 *
 *   evenement du serveur   | contenu (un objet)                                         | appelez
 *   -----------------------+------------------------------------------------------------+------------------
 *   une nouvelle mesure    | { _id, sensor: "temp-b127", value: 24.3, createdAt }       | handlers.measure
 *   un capteur passe en    | { sensor: "temp-b127", value: 31.2, threshold: 28,         | handlers.alert
 *   alerte                 |   direction: "above", createdAt }                          |
 *   un capteur redevient   | meme forme que l'alerte                                    | handlers.recovery
 *   normal                 |                                                            |
 *
 * Remarque : dans l'evenement, "sensor" est l'identifiant (un texte). Dans la reponse REST du
 * TODO 3, c'est un objet. Ne les melangez pas : dashboard.js sait deja lequel il recoit.
 */
export function bindMeasures(socket, handlers) {
  throw new Error("TODO 8 : bindMeasures n'est pas encore ecrite (connections.js)");
}

/**
 * TODO 9 : ecouter les changements de capteurs.
 *
 * @param {Socket} socket
 * @param {{ created: (s: object) => void, updated: (s: object) => void, deleted: (p: { id: string }) => void }} handlers
 * @returns {void}
 *
 * Le serveur annonce chaque changement fait par l'API, y compris ceux des autres
 * utilisateurs. Inscrivez un ecouteur pour chacun des trois evenements (noms dans le README
 * du serveur). Chaque fonction de "handlers" recoit directement le contenu :
 *
 *   evenement du serveur  | contenu                                              | appelez
 *   ----------------------+------------------------------------------------------+------------------
 *   un capteur est cree   | le capteur : { _id, name, unit, ..., active }        | handlers.created
 *   un capteur est modifie| le capteur a jour, meme forme (activation et seuil   | handlers.updated
 *   (dont activer et      |   compris)                                           |
 *   desactiver)           |                                                      |
 *   un capteur est        | seulement l'identifiant : { id: "temp-b127" }        | handlers.deleted
 *   supprime              |                                                      |
 */
export function bindSensors(socket, handlers) {
  throw new Error("TODO 9 : bindSensors n'est pas encore ecrite (connections.js)");
}
