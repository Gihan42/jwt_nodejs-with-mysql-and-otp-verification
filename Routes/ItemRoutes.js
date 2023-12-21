const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const cnt = require('../DB/dbConnection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Use body-parser middleware to parse incoming request bodies
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const secretKey = process.env.SECRET_KEY;
const refreshSecretKey = process.env.REFRESH_SECRET_KEY;

router.post('/', (req, res) => {
    const accessToken = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!accessToken) {
    return res.status(401).json({ error: 'Unauthorized: Access token is missing' });
    };

    jwt.verify(accessToken, secretKey, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Unauthorized: Invalid access token' });
        }
        if (decoded && decoded.user_email && decoded.role === 'admin') { 
            if (!req.body.id || !req.body.item_name || !req.body.price) {
                return res.status(400).json({ error: 'Bad Request: Missing required fields in the request body' });
            };
                cnt.query('INSERT INTO item VALUES(?,?,?)', [req.body.id, req.body.item_name,req.body.price], function (err, rows, fields) {
                    if (err) {
                        console.error(err);
                        res.status(500).send('Internal Server Error');
                        return;
                    }

                    console.log('item saved successfully');
                    res.send({ rows, message: 'post res send' });
                });
        }else {
         return res.status(403).json({ error: 'Forbidden: User does not have the admin role' });
        }
    })
});

module.exports = router;

