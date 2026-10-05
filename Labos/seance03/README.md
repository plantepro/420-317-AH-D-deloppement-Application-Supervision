# Supervision — 420-317-AH

## État après la séance 3

API HTTP native, sans framework.
在这个 Lab 里还在写 原生 Node HTTP server。Seance 5 会替代成Express

| Route | Renvoie | Codes |
|---|---|---|
| `GET /` | la page | 200 |
| `GET /api/measures` | toutes les mesures | 200 |
| `GET /api/measures?min=` | celles au-dessus du seuil | 200 |
| `GET /api/measures/latest` | la plus récente | 200 / 404 |
| `GET /api/measures/stats` | min, max, moyenne, nombre | 200 |
| `POST /api/measures` | la mesure créée | 201 / 400 |
| toute autre | erreur JSON | 404 |

## Ce qui est pénible (à revoir en séance 5)

- Chaque route répète la vérification de méthode et de chemin
- Un `return` oublié fait répondre deux fois
- Le corps du POST doit être assemblé à la main
- Une condition et un `Content-Type` par fichier statique
- Le routage et la logique métier sont dans la même fonction

## Lancer

```
npm install
npm run dev
```

npm run dev
     │
     ↓
server.js
     │
     ├── import Sensor
     ├── import sendJson
     │
     ├── 创建 measures []
     │
     ├── new Sensor(...)
     │
     ├── sensor.start()
     │       │
     │       ↓
     │   不断产生 measure
     │       │
     │       ↓
     │   measures.push(...)
     │
     ├── http.createServer(...)
     │
     └── server.listen(3000)
              │
              ↓
        等待浏览器请求
              │
              ↓
   GET /api/measures
              │
              ↓
       req + res
              │
              ↓
        判断 method/path
              │
              ↓
   sendJson(res, 200, measures)
              │
              ↓
          浏览器看到 JSON


数据流动：

                 Node.js
────────────────────────────────────

        Sensor
           │
           │ emit()
           ↓
       EventEmitter
           │
           ↓
   .on("measure", ...)
           │
           ↓
      measures[]
           ↑
           │
      res.json()
           │
           ↓
       Express
           ↑
           │
      HTTP Request
           ↑
        Browser

1. sendJson
看老师的 sendJson()：

export function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

可以拆成：

HTTP Response
│
├── Status
│   └── 200
│
├── Headers
│   └── Content-Type: application/json
│
└── Body
    └── JSON.stringify(payload)
具体例子

调用：

sendJson(res, 200, {
    sensor: "temp-b127",
    value: 25
});

这里：

payload = {
    sensor: "temp-b127",
    value: 25
}

payload 就是这个 JavaScript object。

然后：

JSON.stringify(payload)

变成：

{"sensor":"temp-b127","value":25}

这个东西被放进 HTTP Body。

最终 HTTP response 可以理解成：

HTTP/1.1 200 OK
Content-Type: application/json

{"sensor":"temp-b127","value":25}

你看：

HTTP/1.1 200 OK
↑
status
Content-Type: application/json
↑
header
{"sensor":"temp-b127","value":25}
↑
body = payload 转成 JSON 后的结果

2. Server.js
createServer() 创建服务器
listen（） 让服务器开始监听某个port

