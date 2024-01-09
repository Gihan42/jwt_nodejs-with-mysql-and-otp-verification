const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const cnt = require('../DB/dbConnection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const validator = require('validator');


require('dotenv').config();


router.get('/verify-Otp', function (req, res) {
    const email = req.query.user_email;
    const otpCode = req.query.otp;
    cnt.query('SELECT * FROM otp WHERE user_email=?', [email], function (queryErr, rows, fields) {
    if (queryErr) {
        console.error(queryErr);
        return res.status(500).send('Internal Server Error search');
    }
    else if (rows[0].otp == otpCode) {
        console.log('VERIFY OTP ')
        res.send({ otp: rows[0], message: 'otp search successfully' });
    }
    else {
        res.status(404).json({ error: 'give the correct otp' });
    }
});
});


router.get('/verify', function (req, res) {
    const userEmail = req.query.user_email;
    console.log('verify-'+userEmail);
    if (!userEmail) {
        return res.status(400).json({ error: 'Bad Request: User email is missing in query parameters' });
    }
    searchUser(userEmail);
    res.status(200).json({ message: 'OTP saved successfully' });
});



function searchUser(user_email) {
    const email = user_email;
   
    console.log('search-'+email)

cnt.query('SELECT * FROM otp WHERE user_email=?', [email], function (queryErr, rows, fields) {
    if (queryErr) {
        console.error(queryErr);
        return res.status(500).send('Internal Server Error search');
    }

   else if (rows.length === 0) {
        createUser(user_email);
    } 
    else if(rows.length != 0){
        
        updateUserOTP(email);

        console.log('OTP search successful');
    }
    
});
};


function createUser(user_email) {
    const otpCode = 0;
    console.log('create-', user_email);
    console.log('create-',otpCode)
    cnt.query('INSERT INTO otp (user_email, otp) VALUES (?, ?)', [user_email,otpCode], function (queryErr, rows, fields) {
        if (queryErr) {
          console.error(queryErr);
        }
        else {
            updateUserOTP(user_email);
            console.log('otp saved successfully',+rows);
        }
        // updateUserOTP(user_email);
        
      });
};

function updateUserOTP(user_email) {
    const otp = generatedOtp();
    console.log('update'+otp)
    console.log('update-'+user_email)
    cnt.query('UPDATE otp SET otp=? WHERE user_email=?', [otp,user_email], function (queryErr, rows, fields) {
        if (queryErr) {
          console.error(queryErr);
        }
        createAndSendOtp(user_email)
        console.log('otp update successfully');
        
      });
}

function generatedOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

function createAndSendOtp(userEmail) {
    console.log('send otp' + userEmail);
    
    // Create a transporter object
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'gihanmadushanka807@gmail.com',
            pass: process.env.PASS
        }
    });
    const otp = generatedOtp();
    // Define the email options
    const mailOptions = {
        from: process.env.USER,
        to: userEmail,
        subject: 'Hello their',
        text: `Your One-Time Password (OTP) is: ${otp}`
    };

    // Send the email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
    return otp;
};



module.exports = router;

