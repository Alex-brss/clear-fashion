const { connect } = require('http2');
const {MongoClient} = require('mongodb');
const fs = require('fs');
 
var MONGODB_URI = process.env.MONGODB_URI;
//MONGODB_URI="mongodb+srv://Alexbr:Cookiemata2001@cluster0.qqzriy3.mongodb.net/test";
const MONGODB_DB_NAME = 'clearfashion';
var client, db, collection;
 
async function connectMongoDb(){
    console.log('Connecting to MongoDB ...');
    client = await MongoClient.connect(MONGODB_URI, {'useNewUrlParser': true});
    db =  client.db(MONGODB_DB_NAME)
    collection = db.collection('products'); 
}
 
async function productsPushMongoDb(){
    await connectMongoDb();
    console.log('Pushing new products to MongoDB ...');
    let rawdata = fs.readFileSync('products.json');
    let products = JSON.parse(rawdata);
    products.map(product => {
        product._id = product.uuid;
        delete product.uuid;
    });
    const alredyExist = await collection.find({}).toArray();
    console.log("a");
    products = products.filter(product => !alredyExist.some(product2 => product2._id == product._id));
    if(products.length != 0)
    {
        const result = await collection.insertMany(products);
        console.log(result);
    }
    else
    {
        console.log("No new products");
    }
    //process.exit(0);
}
 
async function fetchProducts(brand = undefined, maxPrice = undefined, sortedByPrice = false, sortedByDate = false, scrapedLessThanTwoWeeksAgo = false,limit = 12){
    await connectMongoDb();
    console.log('Fetching products from MongoDB ...');
    var result = "none";
    var query = {};
    if (brand != undefined) query.brand = brand;
    if (maxPrice != undefined) query.price = {$lt: maxPrice};
    result = await collection.find(query);
    if (sortedByPrice) result = result.sort({price: 1});
    if (sortedByDate) result = result.sort({scrapDate: -1});
    result = await result.limit(limit).toArray();
    if (scrapedLessThanTwoWeeksAgo) result = result.filter(product => new Date(product.scrapDate) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000));
    return result;
    //process.exit(0);
}


async function fetchProductsByUuid(uuid) {
    await connectMongoDb();
    console.log(`Fetching product with uuid=${uuid} from MongoDB ...`);
    const query = {_id: uuid};
    const result = await collection.findOne(query);
    console.log(result);
    return result;
    //process.exit(0);
  }
  
module.exports={
    fetchProducts,
    fetchProductsByUuid
}
 
//productsPushMongoDb();
//fetchProducts("Dedicated", 10 ,true, false, false);//brand, lessThan, sortedByPrice, sortedByDate, scrapedLessThanTwoWeeksAgo
//fetchProductsByUuid('b3b12d7be201a8e7d029c557a2b4bc73');
//fetchProducts2("Dedicated", 100 ,true,false,false);