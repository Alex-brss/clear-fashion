const { Console } = require('console');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const { connect } = require('http2');
//const {MongoClient} = require('mongodb');
const productsDb = require('./productsDatabase.js');

const PORT = 8092;

const app = express();

module.exports = app;

app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());

app.options('*', cors());

app.get('/', (request, response) => {
  response.send({'ack': true});
});

app.get('/products/search', async (req, res) => {
  const limit = parseInt(req.query.limit) || 12;
  const brand = req.query.brand || undefined;
  const price = parseInt(req.query.price) || undefined;
  
  var products = await productsDb.fetchProducts(brand, price, true,false,false,limit);
  if(products == null){console.log('no product found');products='No product found';}

  res.send(products);
});

// Endpoint to get a product by UUID
app.get('/products/*', async (req, res) => {
  var product = await productsDb.fetchProductsByUuid(req.params[0]);
  if(product == null){console.log('no product found');product='No product found';}
  res.send(product);
});



app.listen(PORT);

console.log(`📡 Running on port ${PORT}`);
