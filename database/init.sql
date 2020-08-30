CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER,
  prod_id INTEGER,
  rating INTEGER,
  date VARCHAR(50),
  summary VARCHAR(50),
  body VARCHAR(280),
  recommend BOOLEAN,
  reported BOOLEAN,
  reviewer_name VARCHAR(50),
  reviewer_email VARCHAR(50),
  response VARCHAR(280),
  helpfulness INTEGER,
  PRIMARY KEY (id)
);