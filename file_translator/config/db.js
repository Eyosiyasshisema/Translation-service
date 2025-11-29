import pkg from 'pg';
import dotenv from "dotenv";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pkg;
export const pool = new Pool({
  user: process.env.POSTGRES_DB_USER,
  host: process.env.POSTGRES_DB_HOST,
  database: process.env.POSTGRES_DB_NAME,
  password: process.env.POSTGRES_DB_PASSWORD,
  port: process.env.POSTGRES_DB_PORT ? parseInt(process.env.POSTGRES_DB_PORT) : 5432,
});

export const connectDB = async () => {
  try {
    await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
};