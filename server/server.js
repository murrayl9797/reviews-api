const express = require('express');
const bodyParser = require('body-parser');
const redis = require('redis');
const app = express();
const {
  EXPRESS_PORT,
  REDIS_HOST,
  REDIS_PORT,
  PG_HOST,
  PG_PORT,
  PG_USER,
  PG_DATABASE,
  PG_PASSWORD,
} = require('./config.js');


/***********************************************************/
/*******************Connect to Postgres*********************/
/***********************************************************/
const { Client, Pool } = require('pg');
const pool = new Pool({
  user: PG_USER,
  host: PG_HOST,
  database: PG_DATABASE,
  password: PG_PASSWORD,
  port: PG_PORT,
});
const connectToDB = () => {
  pool.connect()
    .then(client => {
      console.log(`Connected to Postgres DB!`);
      client.release();
    })
    .catch(err => {
      console.log(`Couldn't connect to Postgres, try again.`);
      setTimeout(() => {
        connectToDB();
      }, 3000);
    });
};
connectToDB();

/***********************************************************/
/*******************Connect to Redis************************/
/***********************************************************/
const redisClient = redis.createClient({
  host: REDIS_HOST,
  port: REDIS_PORT
});

redisClient.on("error", (error) => {
  console.error('Redis error:', error);
});

// Promisify Redis Functions
const { promisify } = require("util");
const getAsync = promisify(redisClient.get).bind(redisClient);
const setExAsync = promisify(redisClient.setex).bind(redisClient);
// getAsync('liam')
//   .then((data) => console.log(data === null))
//   .catch((data) => console.log('no', data));


/***********************************************************/
/*************************Middleware************************/
/***********************************************************/
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


//http://100.25.168.124/loaderio-eadb06ef7fa24ede3c3f4b0f355a7bd4.txt
app.get('/loaderio-eadb06ef7fa24ede3c3f4b0f355a7bd4.txt', (req, res) => {
  res.send('loaderio-eadb06ef7fa24ede3c3f4b0f355a7bd4');
})



/***********************************************************/
/*************************Routes****************************/
/***********************************************************/
app.get('/', (req, res) => {
  console.log(`Received API request for /`);
  res.send('This is the review API!');
})

/************************************/
/***Main get request for reviews*****/
/************************************/
app.get('/reviews', (req, res) => {
  console.log(`Received API request for /reviews`);

  // Parse query parameters
  const product_id = req.query.product_id || 1;
  const page = req.query.page || 0;
  const count = req.query.count || 5;
  const sort = req.query.sort || 'newest';
  const sortParam = sort === 'newest' ? 'date' : 'helpfulness';
  // ^ have to figure out what to do for 'relevant'

  // Initialize response object
  const respObj = {
    product: product_id,
    page: page,
    count: count,
    results: [],
  }

  // Query for reviews
  pool.connect()
    .then(client => {

    return client.query(`
        SELECT * FROM reviews
        WHERE product_id = $1
        ORDER BY $2 DESC;
      `
      , [product_id, sortParam])
        .then(dbRes => {
          //console.log(`Received response from query: `, dbRes.rows);

          // Slice according to page and count
          const reviewArray = dbRes.rows.slice(page*count, page*count + count);

          reviewArray.forEach((revObj) => {
            // For each review object, add it to results (need to get photos still)
            respObj.results.push(
              {
                review_id: revObj.id,
                rating: revObj.rating,
                summary: revObj.summary,
                recommend: revObj.recommend,
                response: revObj.response,
                body: revObj.body,
                date: revObj.date,
                reviewer_name: revObj.reviewer_name,
                helpfulness: revObj.helpfulness,
                photos: [], // Need to query photos table
              }
            )
          })

          client.release();
          res.send(respObj);
        })
        .catch(err => {
          console.log(`Error when querying: `, err);
          client.release();
          res.send(404);
        });
    })
    .catch(err => {
      console.log(`Error connecting to DB!`, err);
    });
})


/************************************/
/***Get request for meta data********/
/************************************/
app.get('/reviews/meta', (req, res) => {
  console.log(`Received API request for /reviews/meta`);

  const product_id = req.query.product_id;

  const respObj = {
    product_id: product_id,
    ratings: {},
    recommended: {},
    characteristics: {}
  };

  pool.connect()
    .then(client => {

    return client.query(`
        SELECT * FROM meta_data
        WHERE product_id = $1
      `
      , [product_id])
        .then(dbRes => {
          //console.log(dbRes.rows);
          if (dbRes.rows.length === 0) {
            throw 'Product has no meta_data!';
          }

          const metaObj = dbRes.rows[0];
          // Now that we have meta data, parse it and format correctly

          respObj.ratings["1"] = metaObj.stars1;
          respObj.ratings["2"] = metaObj.stars2;
          respObj.ratings["3"] = metaObj.stars3;
          respObj.ratings["4"] = metaObj.stars4;
          respObj.ratings["5"] = metaObj.stars5;

          respObj.recommended["0"] = metaObj.rec_false;
          respObj.recommended["1"] = metaObj.rec_true;

          // Characteristics
          for (let key in metaObj) {
            if (key.slice(0, 4) === "sum_" && metaObj[key] > 0) {
              const char = key.slice(4);
              respObj.characteristics[char] = {
                value: (metaObj[key] / metaObj.total_count).toFixed(3)
              }
            }
          }

          client.release();
          res.send(respObj);
        })
        .catch(err => {
          console.log(`Error in retrieving meta data!`, err);
          client.release();
          res.send(404);
        });
    })
    .catch(err => {
      console.log(`Error connecting to DB!`, err);
    });

})


/************************************/
/*****Put request for helpful********/
/************************************/
app.put('/reviews/:review_id/helpful', (req, res) => {
  console.log(`Received API request for /reviews/${req.params.review_id}/helpful`);

  pool.connect()
    .then(client => {

      return client.query(`
        UPDATE reviews
        SET helpfulness = helpfulness + 1
        WHERE id = $1;
      `, [Number(req.params.review_id)])
        .then(dbRes => {
          //console.log('DB Response: ', dbRes);
          if (dbRes.rowCount === 0) {
            throw 'Product does not exist';
          }

          client.release();
          res.send(`Successfully incremented helpful count for review id: ${req.params.review_id}`);
        })
        .catch(err => {
          console.log(`Error in incrementing helpful count for that review id: `, err);
          client.release();
          res.status(204).send(`Error in incrementing helpful count for that review id`)
        });
    })
    .catch(err => {
      console.log(`Error connecting to DB!`, err);
    });
});



/************************************/
/*****Put request for report*********/
/************************************/
app.put('/reviews/:review_id/report', (req, res) => {
  console.log(`Received API request for /reviews/${req.params.review_id}/report`);

  pool.connect()
    .then(client => {
      return client.query(`
        UPDATE reviews
        SET reported = TRUE
        WHERE id = $1;
      `, [Number(req.params.review_id)])
        .then(dbRes => {
          //console.log('DB Response: ', dbRes);
          if (dbRes.rowCount === 0) {
            throw 'Product does not exist';
          }

          client.release();
          res.send(`Successfully reported review with review id: ${req.params.review_id}`);
        })
        .catch(err => {
          console.log(`Error in reporting that review id: `, err);
          client.release();
          res.status(204).send(`Error in reporting that review id`)
        });
    })
    .catch(err => {
      console.log(`Error connecting to DB!`, err);
    });

});


/************************************/
/*****Post request for review********/
/************************************/
app.post('/reviews', (req, res) => {
  console.log(`Received API post request for /reviews`);

  //console.log(`Body: `, req.body);
  // Destructure the received review
  const {
    product_id,
    rating,
    summary,
    body,
    recommend,
    name,
    email,
    photos,
    characteristics
  } = req.body;

  pool.connect()
    .then(client => {

      return client.query(`
        INSERT INTO reviews (product_id, rating, summary, body, recommend, reviewer_name, reviewer_email)
        VALUES ($1, $2, $3, $4, $5, $6, $7);
      `, [product_id, rating, summary, body, recommend, name, email])
        .then(dbRes => {
          console.log(`Successfully inserted into reviews table!`);

          // Would also need to update photos, characteristics, and meta data table

          client.release();
          res.send(201);
        })
        .catch(err => {
          console.log(`Could not insert into DB!`, err);
          client.release();
          res.send(404);
        });
    })
    .catch(err => {
      console.log(`Error connecting to DB!`, err);
    });

});






/********************/
/*****Start-Up*******/
/********************/
app.listen(EXPRESS_PORT, () => {
  console.log(`Example app listening on port ${EXPRESS_PORT}!`)
});