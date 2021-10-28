const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');

require('dotenv/config');

// correction cors errors
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-Width, Content-Type, Accept"
    );
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET, POST, PATCH, PUT, DELETE, OPTIONS"
    );
    next();
});

const api = process.env.API_URL;
const productsRouter = require('./routers/products');
const categoriesRouter = require('./routers/categories');

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extend: false }));
//app.use(morgan('tiny'));


// Routers
app.use(`${api}/products`, productsRouter);
app.use(`${api}/categories`, categoriesRouter);

mongoose.connect(process.env.CONNECT_STRING)
    .then(() => {
        console.log('Database connection is ready')
    }).catch((err) => {
    console.log(err)
});


app.listen(3000, () => {
    console.log(api);
    console.log('Server is running http://localhost:3000');
});

module.exports = app;
