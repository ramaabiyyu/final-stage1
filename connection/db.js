// import postgres pool
const {Pool} = require('pg')

const dbPool = new Pool({
    database: 'personal-web-b30',
    port: 5432,
    user: "postgres",
    password: "Kiyama18",
    idleTimeoutMillis: 0
})

module.exports = dbPool //untuk digunakan di Index