//dbSingleton.js
const mysql = require('mysql2');

let pool = null; // Initialize as null

const dbSingleton = {
  getConnection: () => {
    if (!pool) {
      // Only create the pool when explicitly requested
      pool = mysql.createPool({
        host: 'localhost',
        user: 'root',
        port: 3310,
        password: '',
        database: 'bogartfashion2',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      }).promise(); // Use .promise() to enable async/await

      // Event listener for errors in the pool
      pool.on('error', err => {
        console.error('Database pool error:', err);
      });

      console.log('MySQL connection pool created (promise-based).');
      console.log('Database connection details:', {
        host: 'localhost',
        user: 'root',
        port: 3310,
        database: 'bogartfashion2'
      });
    }

    return pool; // Return the connection pool
  },
  
  // Method to reset the connection (useful for testing)
  resetConnection: () => {
    if (pool) {
      pool.end();
      pool = null;
      console.log('Database connection pool reset.');
    }
  }
};

module.exports = dbSingleton;
