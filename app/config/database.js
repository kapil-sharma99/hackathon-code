const mysql = require('mysql2');

// Create a connection pool to the MySQL database
const pool = mysql.createPool({
  host: 'localhost',      // Update with your MySQL host
  user: 'root',           // Update with your MySQL username
  password: 'password',   // Update with your MySQL password
  database: 'hackathon',  // Update with your database name
});

module.exports = pool.promise();