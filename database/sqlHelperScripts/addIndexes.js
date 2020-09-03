const { Pool, Client } = require('pg');
const {
  DB_USER,
  DB_HOST,
  DB_DATABASE,
  DB_PASSWORD,
  DB_PORT,
  CSV_PATH
} = '../config.js';

// Connection to Postgres DB
const client = new Client({
  user: DB_USER,
  host: DB_HOST,
  database: DB_DATABASE,
  password: DB_PASSWORD,
  port: DB_PORT,
});


// Connect to DB
client.connect()
  .then(res => {
    console.log('Connected to the DB! Add index to reviews first!', new Date());

    // Create index for reviews table
    return client.query(`
      CREATE INDEX IF NOT EXISTS revs_prod_index ON
      reviews (product_id);
    `);
  })
  .then(res => {
    console.log('Created index for reviews table!', new Date());
    console.log('Now create index for chars_revs_joined');

    // Create index for reviews table
    return client.query(`
      CREATE INDEX IF NOT EXISTS char_revs_prod_index ON
      char_revs_joined (product_id);
    `);
  })
  .then(res => {
    console.log('Created index for char_revs_joined table! ', new Date());
    console.log('Now create index for rev_photos');

    // Create index for reviews table
    return client.query(`
      CREATE INDEX IF NOT EXISTS rev_photos_rev_index ON
      rev_photos (review_id);
    `);
  })
  .then(res => {
    console.log('Created index for rev_photos table! ', new Date());
    console.log('Finished making indexes!');
    client.end();
  })
  .catch(err => {
    console.log('Error in creating indexes! : ', err);
    client.end();
  })