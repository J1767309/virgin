-- Virgin Hotels Performance Portal Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS weekly_updates CASCADE;
DROP TABLE IF EXISTS tactics CASCADE;
DROP TABLE IF EXISTS quarterly_strategies CASCADE;
DROP TABLE IF EXISTS annual_strategies CASCADE;
DROP TABLE IF EXISTS paid_media_data CASCADE;
DROP TABLE IF EXISTS web_analytics_data CASCADE;
DROP TABLE IF EXISTS str_data CASCADE;
DROP TABLE IF EXISTS user_hotel_assignments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS hotels CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS brand_type CASCADE;
DROP TYPE IF EXISTS hotel_status_type CASCADE;
DROP TYPE IF EXISTS user_role_type CASCADE;
DROP TYPE IF EXISTS user_scope_type CASCADE;
DROP TYPE IF EXISTS period_type CASCADE;
DROP TYPE IF EXISTS discipline_type CASCADE;
DROP TYPE IF EXISTS tactic_status_type CASCADE;

-- Create ENUM types
CREATE TYPE brand_type AS ENUM ('virgin_hotels', 'virgin_limited_edition');
CREATE TYPE hotel_status_type AS ENUM ('active', 'inactive');
CREATE TYPE user_role_type AS ENUM ('administrator', 'editor', 'viewer');
CREATE TYPE user_scope_type AS ENUM ('corporate', 'property');
CREATE TYPE period_type AS ENUM ('weekly', 'monthly');
CREATE TYPE discipline_type AS ENUM ('sales', 'revenue_management', 'ecommerce');
CREATE TYPE tactic_status_type AS ENUM ('not_started', 'in_progress', 'completed');

-- Hotels table
CREATE TABLE hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    brand brand_type NOT NULL,
    region TEXT NOT NULL,
    status hotel_status_type DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role user_role_type NOT NULL DEFAULT 'viewer',
    scope user_scope_type NOT NULL DEFAULT 'property',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User hotel assignments
CREATE TABLE user_hotel_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, hotel_id)
);

-- STR/STAR Performance Metrics
CREATE TABLE str_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    period_type period_type NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    occupancy_actual DECIMAL(5,2),
    occupancy_budget DECIMAL(5,2),
    occupancy_prior_year DECIMAL(5,2),
    occupancy_comp_set DECIMAL(5,2),
    adr_actual DECIMAL(10,2),
    adr_budget DECIMAL(10,2),
    adr_prior_year DECIMAL(10,2),
    adr_comp_set DECIMAL(10,2),
    revpar_actual DECIMAL(10,2),
    revpar_budget DECIMAL(10,2),
    revpar_prior_year DECIMAL(10,2),
    revpar_comp_set DECIMAL(10,2),
    mpi DECIMAL(6,2),
    ari DECIMAL(6,2),
    rgi DECIMAL(6,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Web Analytics Data
CREATE TABLE web_analytics_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    period_type period_type NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    sessions INTEGER,
    users INTEGER,
    bounce_rate DECIMAL(5,2),
    booking_engine_conversion_rate DECIMAL(5,2),
    revenue_direct_bookings DECIMAL(12,2),
    traffic_organic INTEGER,
    traffic_paid INTEGER,
    traffic_direct INTEGER,
    traffic_referral INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Paid Media Data
CREATE TABLE paid_media_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    period_type period_type NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    channel TEXT NOT NULL,
    spend DECIMAL(10,2),
    roas DECIMAL(6,2),
    cpa DECIMAL(10,2),
    impressions INTEGER,
    clicks INTEGER,
    ctr DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Annual Strategies
CREATE TABLE annual_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    strategy_summary TEXT,
    sales_strategy TEXT,
    rm_strategy TEXT,
    ecommerce_strategy TEXT,
    revenue_goal DECIMAL(12,2),
    revpar_goal DECIMAL(10,2),
    market_share_goal DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    UNIQUE(hotel_id, year)
);

-- Quarterly Strategies
CREATE TABLE quarterly_strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    annual_strategy_id UUID REFERENCES annual_strategies(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
    strategy_summary TEXT,
    sales_initiatives TEXT,
    rm_initiatives TEXT,
    ecommerce_initiatives TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    UNIQUE(hotel_id, year, quarter)
);

-- Tactics
CREATE TABLE tactics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    quarterly_strategy_id UUID REFERENCES quarterly_strategies(id) ON DELETE SET NULL,
    discipline discipline_type NOT NULL,
    description TEXT NOT NULL,
    owner_id UUID REFERENCES users(id),
    due_date DATE,
    status tactic_status_type DEFAULT 'not_started',
    kpi_target TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly Updates (5:15 Updates)
CREATE TABLE weekly_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    str_summary TEXT,
    web_analytics_summary TEXT,
    paid_media_summary TEXT,
    tactics_deployed TEXT,
    whats_working TEXT,
    whats_not_working TEXT,
    adjustments_planned TEXT,
    promotions_in_market TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_str_data_hotel_id ON str_data(hotel_id);
CREATE INDEX idx_str_data_period ON str_data(period_start, period_end);
CREATE INDEX idx_web_analytics_hotel_id ON web_analytics_data(hotel_id);
CREATE INDEX idx_paid_media_hotel_id ON paid_media_data(hotel_id);
CREATE INDEX idx_tactics_hotel_id ON tactics(hotel_id);
CREATE INDEX idx_tactics_status ON tactics(status);
CREATE INDEX idx_weekly_updates_hotel_id ON weekly_updates(hotel_id);
CREATE INDEX idx_user_hotel_assignments_user ON user_hotel_assignments(user_id);
CREATE INDEX idx_user_hotel_assignments_hotel ON user_hotel_assignments(hotel_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tactics table
CREATE TRIGGER update_tactics_updated_at
    BEFORE UPDATE ON tactics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
