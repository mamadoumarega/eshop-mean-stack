const express = require('express');
const app = express();

const dotenv = require('dotenv/config')


app.get('/', (req, res) => {
    res.send('Hello api from the backend');
})


app.listen(3000, () => {
    console.log('Server is running http://localhost:3000');
})
