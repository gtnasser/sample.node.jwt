const token = require("./token")

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
      let payload = {
        id: user[0].id,
        username: user[0].username,
        key: user[0].key,
        roles: user[0].roles,
        features: user[0].features
      }
      const _token = token.generate(payload)
      payload.token = _token
      setTimeout(() => resolve(payload), 500)
    } else {
      reject('Usuário ou senha inválidos!')
    }
})
}

module.exports = {
  users,
  authenticate
}
