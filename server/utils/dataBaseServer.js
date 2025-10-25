import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { header } from '../tools/formattedPrint.js';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
});

pool.getConnection()
    .then(connection => {
        console.log(header(process.env.PORT), 'Connection to MySQL was established successfully.');
        connection.release();
    })
    .catch(err => {
        console.error(header(process.env.PORT), 'Error connecting to the database:', err.message);
    });

export default pool;