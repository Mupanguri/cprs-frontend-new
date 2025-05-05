-- Users table
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  role_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  UNIQUE(user_id, role)
);

-- Guilds table
CREATE TABLE IF NOT EXISTS guilds (
  guild_id SERIAL PRIMARY KEY,
  guild_name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User guilds table
CREATE TABLE IF NOT EXISTS user_guilds (
  user_guild_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  guild_id INTEGER REFERENCES guilds(guild_id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, guild_id)
);

-- Fees table
CREATE TABLE IF NOT EXISTS fees (
  fee_id SERIAL PRIMARY KEY,
  guild_id INTEGER REFERENCES guilds(guild_id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  payment_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  fee_id INTEGER REFERENCES fees(fee_id) ON DELETE CASCADE,
  amount_paid DECIMAL(10, 2) NOT NULL,
  payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  receipt_number VARCHAR(100),
  payment_method VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  document_id SERIAL PRIMARY KEY,
  guild_id INTEGER REFERENCES guilds(guild_id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Family census table
CREATE TABLE IF NOT EXISTS family_census (
  census_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE UNIQUE,
  title VARCHAR(20),
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  surname VARCHAR(100) NOT NULL,
  gender VARCHAR(20),
  date_of_birth DATE,
  marital_status VARCHAR(50),
  type_of_marriage VARCHAR(50),
  place_of_marriage VARCHAR(255),
  marriage_number VARCHAR(50),
  married_to VARCHAR(255),
  address TEXT,
  phone_cell_number VARCHAR(50),
  section_name VARCHAR(100),
  email_address VARCHAR(255) NOT NULL,
  place_of_baptism VARCHAR(255),
  baptism_number VARCHAR(50),
  groupsGuild VARCHAR(100),
  occupation VARCHAR(100),
  skills TEXT,
  profession VARCHAR(100),
  church_support_card VARCHAR(50),
  last_paid DATE,
  any_other_comments TEXT,
  date_of_submission TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- OTP codes table
CREATE TABLE IF NOT EXISTS otp_codes (
  otp_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  otp VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);