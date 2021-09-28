const express = require('express')

const user = require('./src/services/user')
const token = require('./src/services/token')

const app = express();
const PORT = 3000;

// attach JSON body object into request parameter & use JSON response
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

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
            { method: 'GET', path: '/help', action: 'show this API routes' },
            { method: 'GET', path: '/user', action: 'show user list' },
            { method: 'GET', path: '/user/id', action: 'if valid token, show user info by id' },
            { method: 'POST', path: '/login', action: 'validate username/password, returns token' },
        ]
    });
});

app.get('/user/:id', (req, res, next) => {
    token.validate(req)
    .then( (valid) => {
        if (!valid) {
            res.status(401).send()
        }
        else {
            let _user = user.users.filter((u) => u.id == req.params.id)
            if (_user.length)
                res.json(_user)
            else res.status(204).send()
        }
    })
});

app.get('/user', (req, res) => {
    res.json(user.users.map((u) => [u.id, u.username] ));
});

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

app.all('*', (req, res) => {
    res.status(404).send()
});

app.listen(PORT, () => {
    console.log(`Running in http://localhost:${PORT}`);
})

