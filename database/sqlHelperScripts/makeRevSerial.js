const { Pool, Client } = require('pg');
const tableName = 'reviews';

// Connection to Postgres DB
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'password',
  port: 5432,
})
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