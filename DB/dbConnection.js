var mysql = require('mysql');
require('dotenv').config();
var connection;

const tableNameOne = 'customer';
const tableNameTwo = 'item';
const tableNameThree = 'users';
const tableNameFour = 'otp';

function dbConnection() {
    if (!connection) {
        connection = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        const databaseName = process.env.DB_DATABASE;

        // Connect to MySQL server
        connection.connect((err) => {
            if (err) {
                console.error('Error connecting to MySQL server:', err);
                return;
            }

            console.log('Connected to MySQL server');

            // Check if the database exists, and create it if not
            connection.query(`CREATE DATABASE IF NOT EXISTS ${databaseName}`, (err) => {
                if (err) {
                    console.error('Error creating database:', err);
                } else {
                    console.log('Database "nodeWithMysql" created (if not existed)');
                }

                // Switch to the created database
                connection.query(`USE ${databaseName}`, (err) => {
                    if (err) {
                        console.error('Error switching to database:', err);
                    } else {
                        console.log('Switched to database "nodeWithMysql"');

                    const createTableOneQuery = `
                        CREATE TABLE IF NOT EXISTS ${tableNameOne} (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            name VARCHAR(255) NOT NULL
                        )
                    `;

                    const createTableTwoQuery = `
                        CREATE TABLE IF NOT EXISTS ${tableNameTwo} (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            item_name VARCHAR(255) NOT NULL,
                            price DOUBLE
                        )
                    `;
                    const createTableThreeQuery = `
                        CREATE TABLE IF NOT EXISTS ${tableNameThree} (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            user_name VARCHAR(255) NOT NULL,
                            user_email VARCHAR(255) NOT NULL,
                            password VARCHAR(255) NOT NULL,
                            role VARCHAR(255) NOT NULL
                            
                        )
                    `;
                    const createTableFourQuery = `
                        CREATE TABLE IF NOT EXISTS ${tableNameFour} (
                            user_email VARCHAR(255) PRIMARY KEY,
                            otp INT
                        )
                    `;     
                        connection.query(createTableOneQuery);
                        connection.query(createTableTwoQuery);
                        connection.query(createTableThreeQuery);
                        connection.query(createTableFourQuery);

                    }
                });
            });
        });
    }

    return connection;
}

module.exports = dbConnection();

