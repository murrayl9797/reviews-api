const fs = require("fs");
const { Pool, Client } = require('pg');
const copyFrom = require('pg-copy-streams').from;
const tableName = 'reviews';

//id,product_id,rating,date,summary,body,recommend,reported,reviewer_name,reviewer_email,response,helpfulness
let fileStream = fs.createReadStream("/Users/liammurray/Desktop/hr/sdc/sdc-csvs/reviews.csv", {start: 108});
// Connection to Postgres DB
const pool = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'password',
  port: 5432,
})


// Code to stream CSV's into DB
/*let csvData = [];
const fastcsv = require("fast-csv");
let i = 0;
const qString = `INSERT INTO reviews (id, prod_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness)
                 VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`
let csvStream = fastcsv
  .parse( {from_line: 2} )
  .on("data", function(data) {
    csvData.push(data);
    i++;
    i % 10000 === 0 ? console.log(i) : true;
    // if (data[0] !== "id") {
    //   pool.query(`
    //     INSERT INTO reviews (id, prod_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness)
    //     VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    //     `, data)
    //     .then(res => {
    //       //console.log(res.rows[0])
    //     })
    //     .catch(e => console.log('Query error: ', e));
    // }
    //console.log(i, ' : ', data);
    if (i >= 10) {
      //pool.end();
      csvStream.close();
    }
  })
  .on("end", function() {
    console.log('Successfully added csv to DB!')
    //pool.end();
  })
  .on("error", function(e) {
    //console.log('Error in stream!!!: ', e);
    csvStream.close();
  });
*/



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
        prod_id INTEGER,
        rating INTEGER,
        date VARCHAR(500),
        summary VARCHAR(500),
        body VARCHAR(500),
        recommend BOOLEAN,
        reported BOOLEAN,
        reviewer_name VARCHAR(500),
        reviewer_email VARCHAR(500),
        response VARCHAR(500),
        helpfulness INTEGER,
        PRIMARY KEY (id)
      );
    `);
  })
  .then(res => {
    console.log(`Successfully created ${tableName} table! `, Object.keys(res));

    // Actually pipe the CSV's now
    console.log(`Begin piping ${tableName} CSV!`);

    //const query = "COPY events (person, action, thing) FROM STDIN CSV"
    const queryS = `COPY ${tableName} (id, prod_id, rating, date, summary, body, recommend, reported, reviewer_name, reviewer_email, response, helpfulness) FROM STDIN CSV`;
    var dbStream = pool.query(copyFrom(queryS));

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



