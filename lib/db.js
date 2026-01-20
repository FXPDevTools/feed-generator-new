import mysql from "mysql2/promise";
import dotenv from "dotenv";
// Load .env in Node server context; default resolves from the project root (process.cwd()).
dotenv.config();

const { MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE } = process.env;

if (!MYSQL_HOST || !MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
  console.error('[db] Missing MySQL env vars. Got:', {
    MYSQL_HOST: !!MYSQL_HOST,
    MYSQL_USER: !!MYSQL_USER,
    MYSQL_PASSWORD: !!MYSQL_PASSWORD,
    MYSQL_DATABASE: !!MYSQL_DATABASE,
  });
  throw new Error('Missing MySQL environment variables. Ensure .env is loaded and variables are set.');
}

export const pool = mysql.createPool({
  host: MYSQL_HOST,
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  port: process.env.MYSQL_PORT || 3306,
  ssl: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});