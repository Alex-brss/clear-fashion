// Invoking strict mode https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode#invoking_strict_mode
'use strict';

/*
Description of the available api
GET https://clear-fashion-api.vercel.app/
Search for specific products
This endpoint accepts the following optional query string parameters:
- `page` - page of products to return
- `size` - number of products to return
GET https://clear-fashion-api.vercel.app/brands
Search for available brands list
*/

// current products on the page
let currentProducts = [];
let currentPagination = {};
let nbBrands = 0;
let nbRecentProducts = 0;
let lastReleaseDate = NaN;
let p50 = 0;
let p90 = 0;
let p95 = 0;

// instantiate the selectors
const selectShow = document.querySelector('#show-select');
const selectPage = document.querySelector('#page-select');
const sectionProducts = document.querySelector('#products');
const spanNbProducts = document.querySelector('#nbProducts');
const brandSelect = document.querySelector('#brand-select');
const sortSelect = document.querySelector('#sort-select');
const showOnlySelectSale = document.querySelector('#showOnly-select-sale');
const showOnlySelectNew = document.querySelector('#showOnly-select-new');
const showOnlySelectFavorite = document.querySelector('#showOnly-select-favorite');
const spanLastReleasedDate = document.querySelector('#spanLastReleased');
const productDiv = document.querySelectorAll(".product");
const spanNbBrands = document.querySelector('#nbBrands');
const spanNbRecentProducts = document.querySelector('#nbRecentProducts');
const spanP50 = document.querySelector('#spanP50');
const spanP90 = document.querySelector('#spanP90');
const spanP95 = document.querySelector('#spanP95');


/**
 * Set global value
 * @param {Array} result - products to display
 * @param {Object} meta - pagination meta info
 */
const setCurrentProducts = ({result, meta}) => {
  currentProducts = result;
  currentPagination = meta;
};

/**
 * Fetch products from api
 * @param  {Number}  [page=1] - current page to fetch
 * @param  {Number}  [size=12] - size of the page
 * @return {Object}
 */
const fetchProducts = async (page = 1, size = 12, brand = "all", sortBy = "price-asc", filter = [false, false, false]) => {
  try {
    const response = await fetch(
      `https://clear-fashion-server-ochre.vercel.app/products/search?limit=9999` + (brand !== "all" ? `&brand=${brand}` : "")
    );
    const body = await response.json();

    if (body.error) {
      console.error(body);
      return {currentProducts, currentPagination};
    }
    var result = body.result;
    
    // filters
    if(filter[0]) {
      result = result.filter(product => product.price < 50);
    }
    if(filter[1]) {
      result = result.filter(product => (new Date() - new Date(product.scrapDate)) / (1000 * 60 * 60 * 24) < 14);
    }
    if(filter[2]) {
      result = result.filter(product => (JSON.parse(localStorage.getItem("favorites")) || []).includes(product._id));
    };

    var meta = {
      currentPage: page,
      pageCount: Math.ceil(result.length / size),
      pageSize: size,
      count: result.length
    };
    
    if(sortBy === "price-asc") {
      result.sort((a, b) => a.price - b.price);
    }
    else if(sortBy === "price-desc") {
      result.sort((a, b) => b.price - a.price);
    }
    else if(sortBy === "date-asc") {
      result.sort((a, b) => new Date(b.scrapDate) - new Date(a.scrapDate));
    }
    else if(sortBy === "date-desc") {
      result.sort((a, b) => new Date(a.scrapDate) - new Date(b.scrapDate));
    }

    nbBrands = 0
    if(result.length > 0){
      result.reduce((acc, product) => {
        if(!acc[product.brand]) {
          acc[product.brand] = 1;
          nbBrands++;
        }
        return acc;
      }, {});
    };

    nbRecentProducts = result.filter(product => (new Date() - new Date(product.scrapDate)) / (1000 * 60 * 60 * 24) < 14).length;

    lastReleaseDate = result.length > 0 ? result.reduce(function(a,b) {
      return new Date(a.scrapDate) > new Date(b.scrapDate) ? a : b;
    }).scrapDate : "Nan";

    if(result.length > 0)
    {
      p50 = [...result].sort((a, b) => a.price - b.price)[Math.floor(result.length / 2)].price;
      p90 = [...result].sort((a, b) => a.price - b.price)[Math.floor(result.length * 0.9)].price;
      p95 = [...result].sort((a, b) => a.price - b.price)[Math.floor(result.length * 0.95)].price;
    }
    else
    {
      p50 = 0;
      p90 = 0;
      p95 = 0;
    }

    var result = result.slice((page - 1) * size, page * size);
    return {result, meta};
    
  } 
  catch (error) 
  {
    console.error(error);
    return {currentProducts, currentPagination};
  }
};

/**
 * Render list of products
 * @param  {Array} products
 */
const renderProducts = products => {
  const fragment = document.createDocumentFragment();
  const div = document.createElement('div');
  const template = products
    .map((product,index) => {
      
      return `
      <div class="product" id=${product._id}>
        <span>${product.brand}<br></span>
        <a href="${product.link}" target="_blank">${product.name}
          <img src=${product.image} class="image"></a>
        <span>${product.price !== null ? product.price : 0}€<br></span>
        <span id="${product._id}-fav">`
      + ((JSON.parse(localStorage.getItem("favorites")) || []).includes(product._id) ? `❤️ <button onclick=deleteToFavorite("` + product._id + `")>Delete from favorite</button>` : `<button onclick=addToFavorite(currentProducts[${index}]._id)>Add to favorite</button>`) + `
      </span>
      </div>
    `;
    })
    .join('');

  div.innerHTML = template;
  fragment.appendChild(div);
  sectionProducts.innerHTML = '<h2>Products</h2>';
  sectionProducts.appendChild(fragment);
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderPagination = pagination => {
  const {currentPage, pageCount} = pagination;
  const options = Array.from(
    {'length': pageCount},
    (value, index) => `<option value="${index + 1}">${index + 1}</option>`
  ).join('');

  selectPage.innerHTML = options;
  selectPage.selectedIndex = currentPage - 1;
};

/**
 * Render page selector
 * @param  {Object} pagination
 */
const renderIndicators = pagination => {
  const {count} = pagination;
  spanNbProducts.innerHTML = count;
  spanLastReleasedDate.innerHTML = lastReleaseDate;
  spanNbRecentProducts.innerHTML = nbRecentProducts;
  spanNbBrands.innerHTML =nbBrands;

  spanP50.innerHTML = p50+" €";
  spanP90.innerHTML = p90+" €";
  spanP95.innerHTML = p95+" €";

};


const renderBrands = brands => {
  const options = brands
    .map(brand => `<option value="${brand}">${brand}</option>`)
    .join('');

  brandSelect.innerHTML = options;
};





const render = (products, pagination) => {
  renderProducts(products);
  renderPagination(pagination);
  renderIndicators(pagination);
};

async function fetchBrands() {
  try {
    const response = await fetch(
      'https://clear-fashion-server-ochre.vercel.app/brands'
    );
    const body = await response.json();

    if (body.success !== true) {
      console.error(error);
    }
    else {
      var brands = body.data.result;
      brands.unshift("all");
      renderBrands(brands);
    }
  } catch (error) {
    console.error(error);
  }
}

function addToFavorite(product) {
  var favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favorites.push(product);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  document.getElementById(product + "-fav").innerHTML = `❤️ <button onclick=deleteToFavorite("` + product + `")>Delete from favorite</button>`;
}

async function deleteToFavorite(product) {
  var favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  favorites = favorites.filter(favorite => favorite != product);
  localStorage.setItem("favorites", JSON.stringify(favorites));
  document.getElementById(product + "-fav").innerHTML = `<button onclick=addToFavorite("` + product + `")>Add to favorite</button>`;
  if(showOnlySelectFavorite.checked){
    const products = await fetchProducts(1, currentPagination.pageSize, brandSelect.value, sortSelect.value, [showOnlySelectSale.checked, showOnlySelectNew.checked, showOnlySelectFavorite.checked]);
    setCurrentProducts(products);
    render(currentProducts, currentPagination);
  }
}

selectShow.addEventListener('change', async (event) => {
  const products = await fetchProducts(1, parseInt(event.target.value), brandSelect.value, sortSelect.value, [showOnlySelectSale.checked, showOnlySelectNew.checked, showOnlySelectFavorite.checked]);

  setCurrentProducts(products);
  render(currentProducts, currentPagination);
});

selectPage.addEventListener('change', async (event) => {
  const products = await fetchProducts(parseInt(event.target.value), currentPagination.pageSize, brandSelect.value, sortSelect.value, [showOnlySelectSale.checked, showOnlySelectNew.checked, showOnlySelectFavorite.checked]);

  setCurrentProducts(products);
  render(currentProducts, currentPagination);
});

brandSelect.addEventListener('change', async (event) => {
  const products = await fetchProducts(1, currentPagination.pageSize, event.target.value, sortSelect.value, [showOnlySelectSale.checked, showOnlySelectNew.checked, showOnlySelectFavorite.checked]);
  setCurrentProducts(products);
  render(currentProducts, currentPagination);
});

sortSelect.addEventListener('change', async (event) => {
  const products = await fetchProducts(1, currentPagination.pageSize, brandSelect.value, event.target.value, [showOnlySelectSale.checked, showOnlySelectNew.checked, showOnlySelectFavorite.checked]);

  setCurrentProducts(products);
  render(currentProducts, currentPagination);
});

showOnlySelectFavorite.addEventListener('change', async (event) => {
  const products = await fetchProducts(1, currentPagination.pageSize, brandSelect.value, sortSelect.value, [showOnlySelectSale.checked, showOnlySelectNew.checked, event.target.checked]);

  setCurrentProducts(products);
  render(currentProducts, currentPagination);
});

showOnlySelectSale.addEventListener('change', async (event) => {
  const products = await fetchProducts(1, currentPagination.pageSize, brandSelect.value, sortSelect.value, [event.target.checked, showOnlySelectNew.checked, showOnlySelectFavorite.checked]);

  setCurrentProducts(products);
  render(currentProducts, currentPagination);
});

showOnlySelectNew.addEventListener('change', async (event) => {
  const products = await fetchProducts(1, currentPagination.pageSize, brandSelect.value, sortSelect.value, [showOnlySelectSale.checked, event.target.checked, showOnlySelectFavorite.checked]);

  setCurrentProducts(products);
  render(currentProducts, currentPagination);
});



document.addEventListener('DOMContentLoaded', async () => {
  const products = await fetchProducts();

  setCurrentProducts(products);
  render(currentProducts, currentPagination);
});

fetchBrands();