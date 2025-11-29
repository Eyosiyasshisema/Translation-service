-- init.sql: run this to create tables in your PostgreSQL DB

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS offices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT,
  license_docs JSONB,
  languages_supported JSONB,
  rates JSONB,
  verification_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs (
  id SERIAL PRIMARY KEY,
  job_uuid UUID DEFAULT uuid_generate_v4(),
  customer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  office_id INTEGER REFERENCES offices(id),
  status TEXT DEFAULT 'created',
  source_lang TEXT,
  target_lang TEXT,
  pages_estimate INTEGER,
  price_cents INTEGER,
  urgency_days INTEGER,
  original_file_key TEXT,
  final_file_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS files (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
  file_type TEXT,
  s3_key TEXT,
  hash TEXT,
  uploaded_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id),
  amount_cents INTEGER,
  currency TEXT,
  gateway TEXT,
  status TEXT,
  gateway_txn_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS offices (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  business_name TEXT,
  license_docs JSONB,
  languages_supported JSONB,
  rates JSONB,
  verification_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);


CREATE TABLE IF NOT EXISTS verifications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES jobs(id),
  verification_token TEXT,
  signed_by TEXT,
  file_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
