var jwt = require('jsonwebtoken')
var fs = require('fs')
var path = require('path')

const token = {
    privateKey: fs.readFileSync(path.resolve(__dirname, './private.key'), 'utf8'),
    publicKey: fs.readFileSync(path.resolve(__dirname, './public.key'), 'utf8'),
    authOptions: {
        expiresIn: '300s',
        algorithm: 'RS256',
    },
    validate: async (req) => {
        return new Promise((resolve, reject) => {
            const _token = req.headers.authorization && req.headers.authorization.split(" ")[0] === 'Bearer'
            ? req.headers.authorization.split(" ")[1]
            : (req.body.token || req.query.token || req.headers['x-access-token'])
                jwt.verify(_token, token.publicKey, token.authOptions, (err) => {
                    resolve(err === null);
                })
        })
    },
    generate: (payload) => {
        return jwt.sign(payload, token.privateKey, token.authOptions)
    }
}

module.exports = token

