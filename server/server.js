const express = require('express');
const app = express();
const port = 4444;

// host: 'the-name-for-my-postgres-container-within-the-docker-compose-yml-file'
const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'db',
  database: 'postgres',
  password: 'password',
  port: 5432,
})
client.connect();


app.get('/', (req, res) => {
  //res.send('Hello Liam!');
  console.log('Request received!');
  //client.connect();
  client.query('SELECT COUNT(*) FROM reviews;', (err, dbResponse) => {
    if (err) {
      res.status(400);
      res.send('Database is not connected successfully!');
    }
    res.send(dbResponse);
    client.end();
  });
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))