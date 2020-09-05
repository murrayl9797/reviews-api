const { Pool, Client } = require('pg');
const {
  DB_USER,
  DB_HOST,
  DB_DATABASE,
  DB_PASSWORD,
  DB_PORT,
  CSV_PATH
} = require('./config');

// Connection to Postgres DB
const client = new Client({
  user: DB_USER,
  host: DB_HOST,
  database: DB_DATABASE,
  password: DB_PASSWORD,
  port: DB_PORT,
});
var start = Date.now();

const tableName = 'meta_data';
// Connect to DB
client.connect()
  .then(res => {
    console.log('Connected to the DB! Add index to reviews first! ', Date.now() - start, ' ms');

    return client.query(`
      DROP TABLE IF EXISTS ${tableName};
    `)
  })
  .then(res => {
    console.log(`Cleared ${tableName} table, recreate now: `, Date.now() - start, ' ms');

    // Create index for reviews table
    return client.query(`
      CREATE TABLE ${tableName} AS (
        SELECT
          product_id,
          SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END)::integer AS stars1,
          SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END)::integer AS stars2,
          SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END)::integer AS stars3,
          SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END)::integer AS stars4,
          SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END)::integer AS stars5,
          SUM(CASE WHEN recommend THEN 1 ELSE 0 END)::integer AS rec_true,
          SUM(CASE WHEN recommend THEN 0 ELSE 1 END)::integer AS rec_false,
          COUNT(*)::integer AS total_count
        FROM reviews
        GROUP BY product_id
      );
    `);
  })
  .then(res => {
    console.log(`${tableName} created correctly! Make product_id primary key`, Date.now() - start, ' ms');

    return client.query(`
      ALTER TABLE ${tableName}
      ADD COLUMN sum_size INTEGER,
      ADD COLUMN sum_fit INTEGER,
      ADD COLUMN sum_width INTEGER,
      ADD COLUMN sum_comfort INTEGER,
      ADD COLUMN sum_quality INTEGER,
      ADD COLUMN sum_length INTEGER,
      ADD PRIMARY KEY (product_id);
    `);
  })
  .then(res => {
    console.log(`Successfully made product_id primary key and new columns! `, Date.now() - start, ' ms');
    console.log(`Time to add char data. `, Date.now() - start, ' ms');

    return client.query(`
      UPDATE meta_data
      SET
        sum_size = subq.sum_size,
        sum_fit = subq.sum_fit,
        sum_width = subq.sum_width,
        sum_comfort = subq.sum_comfort,
        sum_quality = subq.sum_quality,
        sum_length = subq.sum_length
      FROM (
        SELECT
          product_id,
          SUM(CASE WHEN name = 'Size' THEN value ELSE 0 END)::integer AS sum_size,
          SUM(CASE WHEN name = 'Fit' THEN value ELSE 0 END)::integer AS sum_fit,
          SUM(CASE WHEN name = 'Width' THEN value ELSE 0 END)::integer AS sum_width,
          SUM(CASE WHEN name = 'Comfort' THEN value ELSE 0 END)::integer AS sum_comfort,
          SUM(CASE WHEN name = 'Quality' THEN value ELSE 0 END)::integer AS sum_quality,
          SUM(CASE WHEN name = 'Length' THEN value ELSE 0 END)::integer AS sum_length
        FROM char_revs_joined
        GROUP BY product_id
        ) as subq
      WHERE meta_data.product_id = subq.product_id;
    `);
  })
  .then(res => {
    console.log(`Finished updating ${tableName}!`, Date.now() - start, ' ms');
    client.end();
  })
  .catch(err => {
    console.log(`Error in creating ${tableName} table: `, err);
    client.end();
  })

/*
// Put product_id into table
INSERT INTO meta_data (product_id) (SELECT DISTINCT product_id FROM reviews);

// Update counts for rating = 1
UPDATE meta_data
SET meta_data.stars1 = subq.s1count
FROM (
  SELECT product_id, COUNT(rating) AS s1count FROM reviews WHERE rating = 1 GROUP BY product_id
) as subq
WHERE meta_data.product_id = subq.product_id;


// This will get two columns: (product_id, count) of all 1 star ratings for each product
SELECT product_id, COUNT(rating) FROM reviews WHERE rating = 1 GROUP BY product_id;

// Trying to do the above in one query:
SELECT
    product_id,
    SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END)::integer AS stars1,
    SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END)::integer AS stars2,
    SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END)::integer AS stars3,
    SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END)::integer AS stars4,
    SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END)::integer AS stars5,
    SUM(CASE WHEN recommend THEN 1 ELSE 0 END)::integer AS rec_true,
    SUM(CASE WHEN recommend THEN 0 ELSE 1 END)::integer AS rec_false,
    COUNT(*)::integer AS total_count
FROM reviews
GROUP BY product_id;



// Now to add characteristic data
UPDATE meta_data
SET
  meta_data.sum_size = subq.sum_size,
  meta_data.sum_fit = subq.sum_fit,
  meta_data.sum_width = subq.sum_width,
  meta_data.sum_comfort = subq.sum_comfort,
  meta_data.sum_quality = subq.sum_quality,
  meta_data.sum_length = subq.sum_length,
FROM (
  SELECT
    product_id,
    SUM(CASE WHEN name = 'Size' THEN value ELSE 0 END)::integer AS sum_size,
    SUM(CASE WHEN name = 'Fit' THEN value ELSE 0 END)::integer AS sum_fit,
    SUM(CASE WHEN name = 'Width' THEN value ELSE 0 END)::integer AS sum_width,
    SUM(CASE WHEN name = 'Comfort' THEN value ELSE 0 END)::integer AS sum_comfort,
    SUM(CASE WHEN name = 'Quality' THEN value ELSE 0 END)::integer AS sum_quality,
    SUM(CASE WHEN name = 'Length' THEN value ELSE 0 END)::integer AS sum_length
  FROM char_revs_joined
  GROUP BY product_id
) as subq
WHERE meta_data.product_id = subq.product_id;
*/

