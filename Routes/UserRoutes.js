const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const cnt = require('../DB/dbConnection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

const secretKey = process.env.SECRET_KEY;
const refreshSecretKey = process.env.REFRESH_SECRET_KEY;


router.post('/login', (req, res) => {
  const { user_email, password } = req.body;

  cnt.query('SELECT * FROM users WHERE user_email = ?', [user_email], (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid user_email or password' });
    }

    const user = results[0];

    bcrypt.compare(password, user.password, (bcryptErr, isMatch) => {
      if (bcryptErr || !isMatch) {
        return res.status(401).json({ error: 'Invalid user_email or password' });
      }

      const accessToken = jwt.sign(
        { userId: user.id, user_email: user.user_email, role: user.role,password: user.password }, // Include the user's role
        secretKey,
        { expiresIn: '1h' }
      );
      

      const refreshToken = jwt.sign(
        { userId: user.id, user_email: user.user_email, role: user.role ,password: user.password }, // Include the user's role
        refreshSecretKey,
        { expiresIn: '7d' }
      );

      res.json({ accessToken, refreshToken });
      return accessToken;
    });
  });
});

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
      // Hash the password before saving it
      bcrypt.hash(req.body.password, 10, function (bcryptErr, hash) {
        if (bcryptErr) {
          console.error(bcryptErr);
          res.status(500).send('Internal Server Error');
          return;
        }

        // Save the user only if the access token is valid and the role is admin
        cnt.query('INSERT INTO users VALUES(?,?,?,?,?,?)', [req.body.id, req.body.user_name, req.body.user_email, hash, req.body.role, req.body.otp], function (queryErr, rows, fields) {
          if (queryErr) {
            console.error(queryErr);
            res.status(500).send('Internal Server Error');
            return;
          }

          console.log('User saved successfully');
          res.send({ rows, message: 'post res send' });
        });
      });
    } else {
      // Access denied if the user does not have the role of an admin
      return res.status(403).json({ error: 'Forbidden: User does not have the admin role' });
    }
  });
});

router.get('/', (req, res) => {
    console.log("get req");
    cnt.query('select * from users', function (err, rows, feilds) {
        if (err) {
            console.error(err);
            res.status(500).send('Internal Server Error');
            return;
        }

        console.log('users loaded successfully');
        res.send({ rows, message: 'post res send' });
    });
});

router.put('/', (req, res) => {
  const accessToken = req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (!accessToken) {
    return res.status(401).json({ error: 'Unauthorized: Access token is missing' });
  }
  jwt.verify(accessToken, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid access token' });
    }
    if (decoded && decoded.user_email && decoded.role === 'admin') {

      bcrypt.hash(req.body.password, 10, function (bcryptErr, hash) {
        if (bcryptErr) {
          console.error(bcryptErr);
          res.status(500).send('Internal Server Error');
          return;
        }
        cnt.query('UPDATE users SET user_name=?,user_email=?,password=?,role=? WHERE id=?', [req.body.user_name, req.body.user_email, hash, req.body.role, req.body.id], function (queryErr, rows, fields) {
          if (queryErr) {
            console.error(queryErr);
            res.status(500).send('Internal Server Error');
            return;
          }

          console.log('User update successfully');
          res.send({ rows, message: 'post res send' });
        });
      });
    } else {

      return res.status(403).json({ error: 'Forbidden: User does not have the admin role' });
    }
  });
});

router.delete('/', (req, res) => {
  const accessToken = req.headers.authorization && req.headers.authorization.split(' ')[1];

  if (!accessToken) {
    return res.status(401).json({ error: 'Unauthorized: Access token is missing' });
  }

  jwt.verify(accessToken, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid access token' });
    }

    if (decoded && decoded.user_email && decoded.role === 'admin') {
      const userId = req.query.id; // Access user ID from the query parameters

      if (!userId) {
        return res.status(400).json({ error: 'Bad Request: User ID is missing in query parameters' });
      }

      // Check if the user with the given ID exists
      cnt.query('SELECT * FROM users WHERE id=?', [userId], function (queryErr, rows, fields) {
        if (queryErr) {
          console.error(queryErr);
          res.status(500).send('Internal Server Error');
          return;
        }

        if (rows.length === 0) {
          return res.status(404).json({ error: 'Not Found: User with the specified ID does not exist' });
        }

        // User exists, proceed with deletion
        cnt.query('DELETE FROM users WHERE id=?', [userId], function (deleteErr, deleteResult) {
          if (deleteErr) {
            console.error(deleteErr);
            res.status(500).send('Internal Server Error');
            return;
          }

          console.log('User deleted successfully');
          res.send({ result: deleteResult, message: 'User deleted successfully' });
        });
      });
    } else {
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
      const userId = req.query.id; // Access user ID from the query parameters

      if (!userId) {
        return res.status(400).json({ error: 'Bad Request: User ID is missing in query parameters' });
      }

      cnt.query('SELECT * FROM users WHERE id=?', [userId], function (queryErr, rows, fields) {
        if (queryErr) {
          console.error(queryErr);
          res.status(500).send('Internal Server Error');
          return;
        }

        if (rows.length === 0) {
          // User with the specified ID does not exist
          return res.status(404).json({ error: 'Not Found: User with the specified ID does not exist' });
        }

        // User exists, return the user information
        console.log('User search successfully');
        res.send({ user: rows[0], message: 'User search successfully' });
      });
    } else {
      return res.status(403).json({ error: 'Forbidden: User does not have the admin role' });
    }
  });
});


module.exports = router;

