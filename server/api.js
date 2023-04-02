const { Console } = require('console');
const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const { connect } = require('http2');
const productsDb = require('./productsDatabase.js');

const app = express();



app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());

app.options('*', cors());

app.get('/', (request, response) => {
  response.send({'ack': true});
});

app.get('/products/search', async (req, res) => {

  try
  {
    const limit = parseInt(req.query.limit) || 12;
    const brand = req.query.brand || undefined;
    const price = parseInt(req.query.price) || undefined;
  
    var products = await productsDb.fetchProducts(brand, price, true,false,false,limit);
    if(products == null){console.log('no product found');products='No product found';}

    res.send({result:products});
  }
  catch(e) {
    console.error(e);
    res.send({ error:"invalid search : no product found"});
  }
  
});

// Endpoint to get a product by UUID
app.get('/products/:id', async (req, res) => {
  try
  {
    var product = await productsDb.fetchProductsByUuid(req.params[0]);
    if(product == null){console.log('no product found');product='No product found';}
    res.send({result : product});
  }
  catch(e) {
    console.error(e);
    res.send({ error:"invalid search : no product found"});
  } 
});

app.get('/brands', async (req, res) => {
  console.log("Requete : /brands, params : ", req.query);
  var body = {}
  body.success = true;
  var brands = await productsDb.fetchAllBrands();
  body.data = {}
  body.data.result = brands;
  res.send(body);
});



app.listen(process.env.PORT||8092,()=>console.log(`📡 Running on port ${process.env.PORT||8092}`));
module.exports = app;


