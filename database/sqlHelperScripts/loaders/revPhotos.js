const fs = require("fs");
const { Pool, Client } = require('pg');
const copyFrom = require('pg-copy-streams').from;
const tableName = 'rev_photos';

//https://images.unsplash.com/photo-1555689502-c4b22d76c56f?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=668&q=80
//id,review_id,url
let fileStream = fs.createReadStream("/Users/liammurray/Desktop/hr/sdc/sdc-csvs/reviews_photos.csv", {start: 17});
// Connection to Postgres DB
const pool = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'password',
  port: 5432,
})


// Connect to DB
pool.connect()
  .then(res => {
    console.log('Connected to the DB!');

    //Drop table if exists
    return pool.query(`DROP TABLE IF EXISTS ${tableName};`);
  })
  .then(res => {
    // Create tables if they're not there:
    return pool.query(`
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id INTEGER,
        review_id INTEGER,
        url VARCHAR(200),
        PRIMARY KEY (id)
      );
    `);
  })
  .then(res => {
    console.log(`Successfully created ${tableName} table! `, Object.keys(res));

    // Actually pipe the CSV's now
    console.log(`Begin piping ${tableName} CSV!`);

    //const query = "COPY events (person, action, thing) FROM STDIN CSV"
    var dbStream = pool.query(copyFrom(`COPY ${tableName} (id, review_id, url) FROM STDIN CSV`));

    fileStream.on('error', (error) =>{
        console.log(`Error in reading file: ${error}`)
    })

    dbStream.on('error', (error) => {
        console.log(`Error in copy command: ${error}`)
        pool.end();
    })

    dbStream.on('finish', () => {
        console.log(`Completed loading data into ${tableName}`);
        pool.end();
    })
    fileStream.pipe(dbStream);
  })
  .catch(e => {
    console.log('Error in connecting/querying: ', e);
  });



