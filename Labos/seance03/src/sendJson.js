// Une API repond toujours en JSON, meme pour ses erreurs, et toujours
// dans la meme forme : le client n'a qu'un seul cas a traiter.
// GET     ──┐
// POST    ──┤
// PUT     ──┼──→ sendJson() → JSON response
// DELETE  ──┘
//负责 JSON API 响应
export function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}
