const { Pool, Client } = require('pg');
const tableName = 'reviews';
const {
  DB_USER,
  DB_HOST,
  DB_DATABASE,
  DB_PASSWORD,
  DB_PORT,
  CSV_PATH
} = require('./config.js');

// Connection to Postgres DB
const client = new Client({
  user: DB_USER,
  host: DB_HOST,
  database: DB_DATABASE,
  password: DB_PASSWORD,
  port: DB_PORT,
});
var start = Date.now();

// Connect to DB
client.connect()
  .then(res => {

    return client.query(`
      SELECT setval('reviews_id_seq', (SELECT MAX(id) FROM reviews)+1);
    `)
  })
  .then(res => {
    console.log(`Successfully made id auto increment!`);
    client.end();
  })
  .catch(err => {
    console.log(`Error in making id auto increment!`, err);
    client.end();
  })