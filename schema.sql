-- Drop existing tables if they exist
DROP TABLE IF EXISTS query_results;
DROP TABLE IF EXISTS schedules;

-- Create schedules table
CREATE TABLE schedules (
    id UUID PRIMARY KEY,
    query TEXT NOT NULL,
    model TEXT,
    is_active BOOLEAN DEFAULT true,
    status TEXT CHECK (status IN ('scheduled', 'processing', 'completed', 'error')),
    frequency TEXT CHECK (frequency IN ('immediate', 'daily', 'weekly')),
    time TIME,
    week_day TEXT CHECK (week_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
    next_run TIMESTAMP WITH TIME ZONE,
    last_run TIMESTAMP WITH TIME ZONE,
    last_error TEXT,
    last_error_time TIMESTAMP WITH TIME ZONE,
    last_result TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create query_results table
CREATE TABLE query_results (
    id SERIAL PRIMARY KEY,
    schedule_id UUID REFERENCES schedules(id),
    query TEXT NOT NULL,
    result TEXT NOT NULL,
    model TEXT,
    citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 