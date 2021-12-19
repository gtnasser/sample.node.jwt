# sample.node.jwt - API com autenticação por token JWT

Features:
  * rota [POST /login] usada para autenticar	 o usuário, retorna token JWT com dados do usuário
  * rota [GET /help] retorn a lista das rotas implementadas 
  * rota [GET /user] valida o token e retorna a lista de usuarios 
  * rota [GET /user/:id] valida o token e retorna dados do usuario selecionado
  * serviço de autenticação usuário/senha
  * serviço de geração e validação do token
  * proteção da rota [POST /login] por token

## 1. criar novo projeto, configurar e instalar as dependencias 

```
$ mkdir sample.node.jwt
$ cd sample.node.jwt
$ npm -y init
```

## 2. Associar o projeto a um repositorio externo

```
$ git init
```

### Nodemon

O Nodemon sera usado para reiniciar a aplicacao toda vez que o codigo fonte for alterado.
Vamos instalar como dependencia apenas para o desenvolvimento, ele nao sera incluido no pacote final de producao. 
```
$ npm install --save-dev nodemon
```
Vamos indicar no package.json que o nodemon sera executado atraves do comando ```$ npm start```.
```
{
  "scripts": {
    "start": "nodemon index.js"
  },
}
```

Podemos incluir mais arquivos ou pastas que serao ignorados pelo Nodemom relacionando-os no arquivo nodemon.json
```
{
  "ignoreRoot": ["diretorios", “ou”, “arquivos”, “ignorados”]
}
```

### Express

O [Express](https://expressjs.com) sera usado para definir as rotas e gerenciar as requisicoes na API.
```
$ npm i --save express
```

### JsonWebToken

O [JsonWebToken](https://github.com/auth0/node-jsonwebtoken) sera usado para manipular o token
```
$ npm i --save jsonwebtoken
```

## 3. Server 

Implementar o servidor básico e as rotas, deixando o body das requisições acessível como um objeto JSON.
```
const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }))
app.use(express.json()) 

let users = [
    { "id": "1", "username": "admin", "password": "1234" },
    { "id": "3", "username": "viewer", "password": "4321" },
    { "id": "2", "username": "demo", "password": "demo" },
]

app.get("/", (req, res) => {
    res.json({
        info: 'This is an API demo!',
        path: req.route.path,
        headers: req.headers
    });
});

app.get('/help', (req, res) => {
    res.json({
        routes: [
            { method: 'GET', path: '/help' },
            { method: 'GET', path: '/user' },
            { method: 'GET', path: '/user:id' },
            { method: 'POST', path: '/login' },
        ]
    });
});

app.get('/user', (req, res) => {
    res.json(users.map((u) => [u.id, u.username] ));
});

app.get('/user/:id', (req, res) => {
    res.status(400).send({ error: 'Rotina não implementada' })
});

app.post('/login', (req, res) => {
    res.status(401).send({ error: 'Não autorizado' })
});

app.listen(PORT, () => {
    console.log(`Running in http://localhost:${PORT}`);
})

app.all('*', (req, res) => {
    res.status(404).send()
});
```

## 4. Login

Implementar um serviço que autentica o usuário (login)

Criar um modulo de validação do usuário. Mover a lista de usuários para este módulo
services/user.js
```
users = [
  {
      "id": "1",
      "username": "admin",
      "password": "1234",
      "key": "wh44hds6dhd6s5d",
      "roles": ["admin"],
      "features": ["f12","m3"]
  },
  {
      "id": "3",
      "username": "viewer",
      "password": "4321",
      "key": "2fd4e1c67a2d28fc",
      "roles": ["user"],
      "features": ["r12","f25","m43"]
  },
  {
      "id": "2",
      "username": "demo",
      "password": "demo",
      "key": "2h3o273ksfdr55s",
      "roles": ["user"],
      "features": ["r12","r13","f2","m4"]
  },
]

authenticate = function(username, password) {
  return new Promise((resolve, reject) => {
    let user = this.users.filter((u) => u.username == username && u.password == password)
    if (user.length) {
      let info = {
        id: user[0].id,
        username: user[0].username,
        key: user[0].key,
        roles: user[0].roles,
        features: user[0].features
      }
      setTimeout(() => resolve(info), 500)
    } else {
      reject('Usuário ou senha inválidos!')
    }
})
}

module.exports = {
  users,
  authenticate
}
```

Importar este módulo no app. 
index.js
```
const user = require("./src/services/user")
```

Criar a rota do login validando o usuario
```
app.post('/login', (req, res) => {
    const { username, password } = req.body
    user.authenticate(username, password)
        .then((result) => {
            res.send(result);
        })
        .catch((err) => {
            res.status(400).send({ error: err })
        })
})
```

## 5. JWT

Gerar um certificado. Executar o script para gerar os arquivos com as chaves pública e privada. A senha solicitada pelo comando pode ficar em branco. Os arquivos **_private.key_** e **_public.key_** deverão ficar na pasta **_services_**.
```
$ ssh-keygen -t rsa -b 2048 -m PEM -f private.key
$ openssl rsa -in private.key -pubout -outform PEM -out public.key
```

Incluir no .gitignore as linhas para para ignorar as chaves
```
# Auth keys files
src/*.pub
src/*.key
```

Implementar um serviço gere um novo token e valide um token existente.
token.js
```
var jwt = require('jsonwebtoken')
var fs = require('fs')
var path = require('path')

const token = {
    privateKey: fs.readFileSync(path.resolve(__dirname, './private.key'), 'utf8'),
    publicKey: fs.readFileSync(path.resolve(__dirname, './public.key'), 'utf8'),
    authOptions: {
        expiresIn: '180s',
        algorithm: 'RS256',
    },
    generate: (payload) => {
        return jwt.sign(payload, token.privateKey, token.authOptions)
    }
}

module.exports = token
```

Incluir a chamada para a geração do token após a autenticação do usuário, retornando o token e as informações do usuário
user.js
```
const token = require("./token")
authenticate...
      const _token_ = token.generate(payload)
      payload.token = _token
      setTimeout(() => resolve(payload), 500)
...
```

Verificar se o token passado é válido
token.js
```
token...
    validate: async (req) => {
        return new Promise((resolve, reject) => {
            const _token = req.headers.authorization && req.headers.authorization.split(" ")[0] === 'Bearer'
            ? req.headers.authorization.split(" ")[1]
            : (req.body.token || req.query.token || req.headers['x-access-token'])
                jwt.verify(_token, token.publicKey, token.authOptions, (err) => {
                    resolve(err === null);
                })
        })1234
    }
```

Retornar a consulta do usuário pelo id, somente se o token passado é válido
index.js
```
app.get('/user/:id', (req, res, next) => {
    if (!token.validate(req)) {
        res.status(401).send(req.headers)
    }
    else {
        let _user = user.users.filter((u) => u.id == req.params.id)
        if (_user.length)
            res.json(_user)
        else res.status(204).send()
    }
});
```

# TO RUN

Para executar o serviço ```$ npm run dev```

1. Execute ```GET /user``` para obter a lista de usuários
2. Execute ```GET /user/3``` para receber **401 Unauthorized**
3. Execute ```POST /login``` passando os dados de um usuário (ex admin/1234) para receber o token
3. Execute ```POST /login``` passando dados inválidos para receber **400 Bad Request**
4. Execute novamente ```GET /user/3``` enviando o token para receber **200 OK** e os dados do usuário 3 
5. Execute ```GET /user/5``` para receber um **204 No Content**
6. Execute novamente ```GET /user/3``` após 5min (para expirar o token) para receber **401 Unauthorized**

Exemplos:

Curl:

curl -X GET http://localhost:3000/user/3
curl -X POST --data "username=admin&password=1234" http://localhost:3000/login
curl -X GET -H "Authorization:Bearer eyJhbG...yNUIug" http://localhost:3000/user/3

Postman: 

POST 
body x-www-form-urlencoded
username=admin
password=1234

GET
Auth Bearer Token
eyJhbG...yNUIug


