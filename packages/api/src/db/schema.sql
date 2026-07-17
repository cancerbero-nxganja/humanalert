-- Migration 001: Initial schema for HumanAlert

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source VARCHAR(20) NOT NULL CHECK (source IN ('app', 'web', 'landing')),
  context TEXT NOT NULL,
  rating VARCHAR(20) NOT NULL,
  message TEXT,
  email VARCHAR(255),
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_source ON feedback (source);
CREATE INDEX IF NOT EXISTS idx_feedback_language ON feedback (language);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(30) NOT NULL,
  severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status VARCHAR(10) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'expired')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  radius_km DOUBLE PRECISION NOT NULL DEFAULT 5,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts (created_at DESC);

-- Missing persons table (privacy-first: minimal data)
CREATE TABLE IF NOT EXISTS missing_persons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status VARCHAR(20) NOT NULL DEFAULT 'missing' CHECK (status IN ('missing', 'found', 'case_closed')),
  first_name TEXT NOT NULL,
  last_name_initial CHAR(1) NOT NULL,
  age_range_min INT NOT NULL,
  age_range_max INT NOT NULL,
  gender VARCHAR(20) NOT NULL CHECK (gender IN ('male', 'female', 'nonbinary', 'unknown')),
  physical_description TEXT,
  last_seen_at TIMESTAMPTZ NOT NULL,
  last_seen_lat DOUBLE PRECISION NOT NULL,
  last_seen_lon DOUBLE PRECISION NOT NULL,
  last_seen_location_desc TEXT,
  photo_hash TEXT,
  contact_hash TEXT NOT NULL,
  amber_alert BOOLEAN NOT NULL DEFAULT FALSE,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_missing_persons_status ON missing_persons (status);

-- Map pins table
CREATE TABLE IF NOT EXISTS map_pins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(30) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  upvotes INT NOT NULL DEFAULT 0,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_map_pins_category ON map_pins (category);

-- Animal alerts table
CREATE TABLE IF NOT EXISTS animal_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  species VARCHAR(20) NOT NULL,
  name TEXT,
  photo_url TEXT,
  last_seen_lat DOUBLE PRECISION NOT NULL,
  last_seen_lon DOUBLE PRECISION NOT NULL,
  contact_hash TEXT NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'LOST' CHECK (status IN ('LOST', 'FOUND', 'REUNITED')),
  description TEXT,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_animal_alerts_status ON animal_alerts (status);
