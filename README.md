# reviews-api
API Set up to handle front end requests for Reviews and Ratings information.

## Usage
Ensure docker is installed on machine in use.

Then simply run 'docker-compose up -d' to start up the DB and API.

To stop these two, run 'docker-compose stop'


## ETL The Data
To upload the data, make sure you have access to the CSV's, then update the Postgres DB host and CSV Path in the config file in 'reviews_api/database/'.

Once you have the config file correctly updated, you begin by running the Nodejs scripts for all of the loaders:
- node database/sqlHelperScripts/loaders/charRevs.js
- node database/sqlHelperScripts/loaders/chars.js
- node database/sqlHelperScripts/loaders/revPhotos.js
- node database/sqlHelperScripts/loaders/revs.js

(The last CSV will take a while to load)

After these have loaded, create the meta data table by running:
- node database/sqlHelperScripts/joinCharRevs.js

Then, add the indexes to greatly improve query times:
- node database/sqlHelperScripts/addIndexes.js

Next, we will initialize the meta data table:
- node database/sqlHelperScripts/initMetaTable.js

Lastly, ensure the serial value is correct for when we add reviews to the DB via POST requests:
- node database/sqlHelperScripts/makeRevSerial.js


After that, the DB should be up and ready to go!