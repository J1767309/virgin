require('dotenv').config({ path: '../.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  console.error('\nPlease set these in your .env.local file');
  process.exit(1);
}

// Use the SQL HTTP API
async function executeSQL(sql) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: sql
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL execution failed: ${text}`);
  }

  return response.json();
}

async function createSchema() {
  console.log('This script provides the SQL schema for manual execution in Supabase Dashboard.');
  console.log('\nPlease go to your Supabase SQL Editor');
  console.log('\nCopy and paste the following SQL:\n');
  console.log('='.repeat(80));
  console.log(`
-- Virgin Hotels Performance Portal Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create hotels table
CREATE TABLE IF NOT EXISTS hotels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    brand TEXT NOT NULL CHECK (brand IN ('virgin_hotels', 'virgin_limited_edition')),
    region TEXT NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('administrator', 'editor', 'viewer')),
    scope TEXT NOT NULL DEFAULT 'property' CHECK (scope IN ('corporate', 'property')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user hotel assignments table
CREATE TABLE IF NOT EXISTS user_hotel_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, hotel_id)
);

-- Create STR/STAR Performance Metrics table
CREATE TABLE IF NOT EXISTS str_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
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

-- Create Web Analytics Data table
CREATE TABLE IF NOT EXISTS web_analytics_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
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

-- Create Paid Media Data table
CREATE TABLE IF NOT EXISTS paid_media_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
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

-- Create Annual Strategies table
CREATE TABLE IF NOT EXISTS annual_strategies (
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

-- Create Quarterly Strategies table
CREATE TABLE IF NOT EXISTS quarterly_strategies (
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

-- Create Tactics table
CREATE TABLE IF NOT EXISTS tactics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
    quarterly_strategy_id UUID REFERENCES quarterly_strategies(id) ON DELETE SET NULL,
    discipline TEXT NOT NULL CHECK (discipline IN ('sales', 'revenue_management', 'ecommerce')),
    description TEXT NOT NULL,
    owner_id UUID REFERENCES users(id),
    due_date DATE,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    kpi_target TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Weekly Updates (5:15 Updates) table
CREATE TABLE IF NOT EXISTS weekly_updates (
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
CREATE INDEX IF NOT EXISTS idx_str_data_hotel_id ON str_data(hotel_id);
CREATE INDEX IF NOT EXISTS idx_str_data_period ON str_data(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_web_analytics_hotel_id ON web_analytics_data(hotel_id);
CREATE INDEX IF NOT EXISTS idx_paid_media_hotel_id ON paid_media_data(hotel_id);
CREATE INDEX IF NOT EXISTS idx_tactics_hotel_id ON tactics(hotel_id);
CREATE INDEX IF NOT EXISTS idx_tactics_status ON tactics(status);
CREATE INDEX IF NOT EXISTS idx_weekly_updates_hotel_id ON weekly_updates(hotel_id);
CREATE INDEX IF NOT EXISTS idx_user_hotel_assignments_user ON user_hotel_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_hotel_assignments_hotel ON user_hotel_assignments(hotel_id);

-- Enable Row Level Security on all tables
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hotel_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE str_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE paid_media_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarterly_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE tactics ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_updates ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
-- Hotels: All authenticated users can read
CREATE POLICY "Hotels are viewable by authenticated users" ON hotels
    FOR SELECT TO authenticated USING (true);

-- Users: Authenticated users can read all users
CREATE POLICY "Users are viewable by authenticated users" ON users
    FOR SELECT TO authenticated USING (true);

-- Users: Admins can manage users
CREATE POLICY "Admins can manage users" ON users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'administrator'
        )
    );

-- STR Data: Authenticated users can read
CREATE POLICY "STR data is viewable by authenticated users" ON str_data
    FOR SELECT TO authenticated USING (true);

-- STR Data: Editors and admins can insert/update
CREATE POLICY "Editors can manage STR data" ON str_data
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role IN ('administrator', 'editor')
        )
    );

-- Similar policies for other data tables
CREATE POLICY "Web analytics viewable by authenticated" ON web_analytics_data
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Editors can manage web analytics" ON web_analytics_data
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role IN ('administrator', 'editor')
        )
    );

CREATE POLICY "Paid media viewable by authenticated" ON paid_media_data
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Editors can manage paid media" ON paid_media_data
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role IN ('administrator', 'editor')
        )
    );

CREATE POLICY "Strategies viewable by authenticated" ON annual_strategies
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Editors can manage annual strategies" ON annual_strategies
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role IN ('administrator', 'editor')
        )
    );

CREATE POLICY "Quarterly strategies viewable by authenticated" ON quarterly_strategies
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Editors can manage quarterly strategies" ON quarterly_strategies
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role IN ('administrator', 'editor')
        )
    );

CREATE POLICY "Tactics viewable by authenticated" ON tactics
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Editors can manage tactics" ON tactics
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role IN ('administrator', 'editor')
        )
    );

CREATE POLICY "Weekly updates viewable by authenticated" ON weekly_updates
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Editors can manage weekly updates" ON weekly_updates
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role IN ('administrator', 'editor')
        )
    );

CREATE POLICY "User assignments viewable by authenticated" ON user_hotel_assignments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage user assignments" ON user_hotel_assignments
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users u
            WHERE u.id = auth.uid() AND u.role = 'administrator'
        )
    );
`);
  console.log('='.repeat(80));
}

createSchema();
