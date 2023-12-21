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

  // Check if the access token is present in the header
  if (!accessToken) {
    return res.status(401).json({ error: 'Unauthorized: Access token is missing' });
  }

  // Verify the access token
  jwt.verify(accessToken, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid access token' });
    }

    // Check if the user has the role of an admin
    if (decoded && decoded.user_email && decoded.role === 'admin') {
      // Check if the required fields are present in the request body
      if (!req.body.id || !req.body.name) {
        return res.status(400).json({ error: 'Bad Request: Missing required fields in the request body' });
      }

      // Insert data into the customer table
      cnt.query('INSERT INTO customer (id, name) VALUES (?, ?)', [req.body.id, req.body.name], function (queryErr, rows, fields) {
        if (queryErr) {
          console.error(queryErr);
          return res.status(500).send('Internal Server Error');
        }

        console.log('Customer saved successfully');
        res.send({ rows, message: 'post res send' });
      });
    } else {
      // Access denied if the user does not have the role of an admin
      return res.status(403).json({ error: 'Forbidden: User does not have the admin role' });
    }
  });
});

router.get('/', (req, res) => {
    console.log("get req");
    cnt.query('select * from customer', function (err, rows, feilds) {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        console.log('Customer loaded successfully');
        res.send({ rows, message: 'post res send' });
    });
});

router.put('/', (req, res) => {
  const accessToken = req.headers.authorization && req.headers.authorization.split(' ')[1];

  // Check if the access token is present in the header
  if (!accessToken) {
    return res.status(401).json({ error: 'Unauthorized: Access token is missing' });
  }

  // Verify the access token
  jwt.verify(accessToken, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid access token' });
    }

    // Check if the user has the role of an admin
    if (decoded && decoded.user_email && decoded.role === 'admin') {
      // Check if the required fields are present in the request body
      if (!req.body.id || !req.body.name) {
        return res.status(400).json({ error: 'Bad Request: Missing required fields in the request body' });
      }

      // Insert data into the customer table
      cnt.query('UPDATE customer SET name=? WHERE id=?', [req.body.name,req.body.id], function (queryErr, rows, fields) {
        if (queryErr) {
          console.error(queryErr);
          return res.status(500).send('Internal Server Error');
        }

        console.log('Customer update successfully');
        res.send({ rows, message: 'post res send' });
      });
    } else {
      // Access denied if the user does not have the role of an admin
      return res.status(403).json({ error: 'Forbidden: User does not have the admin role' });
    }
  });
});

router.delete('/', (req, res) => {
  const accessToken = req.headers.authorization && req.headers.authorization.split(' ')[1];

  // Check if the access token is present in the header
  if (!accessToken) {
    return res.status(401).json({ error: 'Unauthorized: Access token is missing' });
  }

  // Verify the access token
  jwt.verify(accessToken, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid access token' });
    }

    // Check if the user has the role of an admin
      if (decoded && decoded.user_email && decoded.role === 'admin') {
        
        const customerId = req.query.id
      // Check if the required fields are present in the request body
      if (!customerId) {
        return res.status(400).json({ error: 'Bad Request: Missing required fields in the request body' });
      }
      cnt.query('SELECT * FROM customer WHERE id=?', [customerId], function (queryErr, rows, fields) {
        if (queryErr) {
          console.error(queryErr);
          res.status(500).send('Internal Server Error');
          return;
        }

        if (rows.length === 0) {
          return res.status(404).json({ error: 'Not Found: customer with the specified ID does not exist' });
        }
         cnt.query('DELETE FROM customer WHERE id=?', [customerId], function (deleteErr, deleteResult) {
          if (deleteErr) {
            console.error(deleteErr);
            res.status(500).send('Internal Server Error');
            return;
          }

          console.log('customer deleted successfully');
          res.send({ result: deleteResult, message: 'User deleted successfully' });
         });
          
          
      });
    } else {
      // Access denied if the user does not have the role of an admin
      return res.status(403).json({ error: 'Forbidden: User does not have the admin role' });
    }
  });
});
router.get('/search', (req, res) => {
  const accessToken = req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (!accessToken) {
    return res.status(401).json({ error: 'Unauthorized: Access token is missing' });
  }

  jwt.verify(accessToken, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid access token' });
    }

    if (decoded && decoded.user_email && decoded.role === 'admin') {
      const customerId = req.query.id; // Access user ID from the query parameters

      if (!customerId) {
        return res.status(400).json({ error: 'Bad Request: customer ID is missing in query parameters' });
      }

      cnt.query('SELECT * FROM customer WHERE id=?', [customerId], function (queryErr, rows, fields) {
        if (queryErr) {
          console.error(queryErr);
          res.status(500).send('Internal Server Error');
          return;
        }

        if (rows.length === 0) {
          // customer with the specified ID does not exist
          return res.status(404).json({ error: 'Not Found: customer with the specified ID does not exist' });
        }

        // customer exists, return the customer information
        console.log('customer search successfully');
        res.send({ customer: rows[0], message: 'customer search successfully' });
      });
    } else {
      return res.status(403).json({ error: 'Forbidden: User does not have the admin role' });
    }
  });
});

module.exports = router;

