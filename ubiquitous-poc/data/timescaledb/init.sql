-- Ubiquitous TimescaleDB Schema Initialization
-- Infrastructure metrics and time-series data

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- System Metrics Table
CREATE TABLE system_metrics (
    time TIMESTAMPTZ NOT NULL,
    service_name TEXT NOT NULL,
    cluster_name TEXT NOT NULL,
    region TEXT NOT NULL,
    environment TEXT NOT NULL,
    -- Performance metrics
    cpu_utilization DOUBLE PRECISION,
    memory_utilization DOUBLE PRECISION,
    disk_utilization DOUBLE PRECISION,
    network_in_bytes BIGINT,
    network_out_bytes BIGINT,
    -- Application metrics
    request_count INTEGER,
    response_time_ms DOUBLE PRECISION,
    error_rate DOUBLE PRECISION,
    throughput_rps DOUBLE PRECISION,
    active_connections INTEGER,
    -- Resource metrics
    pod_count INTEGER,
    replica_count INTEGER,
    pending_pods INTEGER,
    failed_pods INTEGER
);

-- Create hypertable for system metrics (partition by time)
SELECT create_hypertable('system_metrics', 'time', chunk_time_interval => INTERVAL '1 hour');

-- Database Performance Metrics
CREATE TABLE database_metrics (
    time TIMESTAMPTZ NOT NULL,
    db_identifier TEXT NOT NULL,
    db_engine TEXT NOT NULL,
    instance_class TEXT NOT NULL,
    region TEXT NOT NULL,
    -- Performance metrics
    cpu_utilization DOUBLE PRECISION,
    database_connections INTEGER,
    read_iops DOUBLE PRECISION,
    write_iops DOUBLE PRECISION,
    read_latency_ms DOUBLE PRECISION,
    write_latency_ms DOUBLE PRECISION,
    read_throughput_bytes BIGINT,
    write_throughput_bytes BIGINT,
    -- Storage metrics
    free_storage_bytes BIGINT,
    free_memory_bytes BIGINT,
    swap_usage_bytes BIGINT,
    -- Query metrics
    slow_queries INTEGER,
    deadlocks INTEGER,
    lock_waits INTEGER,
    buffer_cache_hit_ratio DOUBLE PRECISION
);

SELECT create_hypertable('database_metrics', 'time', chunk_time_interval => INTERVAL '1 hour');

-- Network Performance Metrics
CREATE TABLE network_metrics (
    time TIMESTAMPTZ NOT NULL,
    source_service TEXT NOT NULL,
    target_service TEXT NOT NULL,
    source_cluster TEXT,
    target_cluster TEXT,
    connection_type TEXT, -- HTTP, gRPC, Database, etc.
    region TEXT NOT NULL,
    -- Latency metrics
    avg_latency_ms DOUBLE PRECISION,
    p50_latency_ms DOUBLE PRECISION,
    p95_latency_ms DOUBLE PRECISION,
    p99_latency_ms DOUBLE PRECISION,
    -- Traffic metrics
    request_count INTEGER,
    byte_count BIGINT,
    error_count INTEGER,
    timeout_count INTEGER,
    -- Connection metrics
    active_connections INTEGER,
    connection_pool_utilization DOUBLE PRECISION,
    tcp_retransmissions INTEGER,
    packet_loss_rate DOUBLE PRECISION
);

SELECT create_hypertable('network_metrics', 'time', chunk_time_interval => INTERVAL '1 hour');

-- Cost Metrics Table
CREATE TABLE cost_metrics (
    time TIMESTAMPTZ NOT NULL,
    resource_id TEXT NOT NULL,
    resource_type TEXT NOT NULL, -- EKS, RDS, EC2, S3, etc.
    resource_name TEXT NOT NULL,
    region TEXT NOT NULL,
    environment TEXT NOT NULL,
    cost_center TEXT,
    -- Cost data
    hourly_cost DOUBLE PRECISION,
    daily_cost DOUBLE PRECISION,
    monthly_cost DOUBLE PRECISION,
    -- Usage metrics
    usage_quantity DOUBLE PRECISION,
    usage_unit TEXT, -- hours, GB, requests, etc.
    -- Optimization metrics
    estimated_waste DOUBLE PRECISION,
    optimization_potential DOUBLE PRECISION,
    rightsizing_recommendation TEXT
);

SELECT create_hypertable('cost_metrics', 'time', chunk_time_interval => INTERVAL '1 day');

-- Security Events Table
CREATE TABLE security_events (
    time TIMESTAMPTZ NOT NULL,
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- vulnerability, compliance, incident, etc.
    severity TEXT NOT NULL, -- critical, high, medium, low
    resource_id TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    service_name TEXT,
    cluster_name TEXT,
    region TEXT NOT NULL,
    -- Event details
    description TEXT,
    source TEXT, -- scanner, manual, automated
    status TEXT, -- open, in_progress, resolved
    -- Risk assessment
    cvss_score DOUBLE PRECISION,
    exploitability_score DOUBLE PRECISION,
    business_impact_score DOUBLE PRECISION,
    -- Resolution tracking
    assigned_to TEXT,
    resolved_at TIMESTAMPTZ,
    resolution_time_hours INTEGER
);

SELECT create_hypertable('security_events', 'time', chunk_time_interval => INTERVAL '1 day');

-- Incident Metrics Table
CREATE TABLE incident_metrics (
    time TIMESTAMPTZ NOT NULL,
    incident_id TEXT NOT NULL,
    incident_type TEXT NOT NULL, -- outage, performance, security
    severity TEXT NOT NULL,
    status TEXT NOT NULL, -- investigating, identified, monitoring, resolved
    affected_services TEXT[], -- array of service names
    cluster_name TEXT,
    region TEXT,
    -- Impact metrics
    affected_users INTEGER,
    revenue_impact DOUBLE PRECISION,
    duration_minutes INTEGER,
    -- Resolution metrics
    detection_time_minutes INTEGER,
    acknowledgment_time_minutes INTEGER,
    resolution_time_minutes INTEGER,
    -- Root cause
    root_cause_category TEXT,
    root_cause_description TEXT,
    preventable BOOLEAN
);

SELECT create_hypertable('incident_metrics', 'time', chunk_time_interval => INTERVAL '1 day');

-- Business Value Metrics Table
CREATE TABLE business_value_metrics (
    time TIMESTAMPTZ NOT NULL,
    metric_type TEXT NOT NULL, -- cost_savings, time_savings, efficiency, risk_reduction
    category TEXT NOT NULL, -- infrastructure, automation, process, etc.
    service_name TEXT,
    cluster_name TEXT,
    region TEXT,
    team TEXT,
    -- Value metrics
    cost_savings_usd DOUBLE PRECISION,
    time_savings_hours DOUBLE PRECISION,
    efficiency_gain_percent DOUBLE PRECISION,
    risk_reduction_score DOUBLE PRECISION,
    -- Context
    initiative_name TEXT,
    description TEXT,
    measurement_method TEXT,
    confidence_level TEXT -- high, medium, low
);

SELECT create_hypertable('business_value_metrics', 'time', chunk_time_interval => INTERVAL '1 day');

-- Compliance Metrics Table
CREATE TABLE compliance_metrics (
    time TIMESTAMPTZ NOT NULL,
    framework TEXT NOT NULL, -- PCI_DSS, GDPR, SOX, ISO27001
    control_id TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    service_name TEXT,
    region TEXT,
    -- Compliance status
    status TEXT NOT NULL, -- compliant, non_compliant, not_applicable
    compliance_score DOUBLE PRECISION, -- 0-100
    -- Assessment details
    last_assessment TIMESTAMPTZ,
    assessor TEXT,
    evidence_collected BOOLEAN,
    remediation_required BOOLEAN,
    -- Risk and impact
    risk_level TEXT, -- high, medium, low
    business_impact TEXT,
    remediation_effort_hours INTEGER
);

SELECT create_hypertable('compliance_metrics', 'time', chunk_time_interval => INTERVAL '1 day');

-- Create indexes for better query performance
CREATE INDEX idx_system_metrics_service ON system_metrics (service_name, time DESC);
CREATE INDEX idx_system_metrics_cluster ON system_metrics (cluster_name, time DESC);
CREATE INDEX idx_system_metrics_environment ON system_metrics (environment, time DESC);

CREATE INDEX idx_database_metrics_identifier ON database_metrics (db_identifier, time DESC);
CREATE INDEX idx_database_metrics_engine ON database_metrics (db_engine, time DESC);

CREATE INDEX idx_network_metrics_services ON network_metrics (source_service, target_service, time DESC);
CREATE INDEX idx_network_metrics_clusters ON network_metrics (source_cluster, target_cluster, time DESC);

CREATE INDEX idx_cost_metrics_resource ON cost_metrics (resource_id, time DESC);
CREATE INDEX idx_cost_metrics_type ON cost_metrics (resource_type, time DESC);
CREATE INDEX idx_cost_metrics_environment ON cost_metrics (environment, time DESC);

CREATE INDEX idx_security_events_type ON security_events (event_type, time DESC);
CREATE INDEX idx_security_events_severity ON security_events (severity, time DESC);
CREATE INDEX idx_security_events_status ON security_events (status, time DESC);

CREATE INDEX idx_incident_metrics_type ON incident_metrics (incident_type, time DESC);
CREATE INDEX idx_incident_metrics_severity ON incident_metrics (severity, time DESC);
CREATE INDEX idx_incident_metrics_status ON incident_metrics (status, time DESC);

CREATE INDEX idx_business_value_type ON business_value_metrics (metric_type, time DESC);
CREATE INDEX idx_business_value_category ON business_value_metrics (category, time DESC);

CREATE INDEX idx_compliance_framework ON compliance_metrics (framework, time DESC);
CREATE INDEX idx_compliance_status ON compliance_metrics (status, time DESC);

-- Create continuous aggregates for common time-based queries
-- Hourly system metrics rollup
CREATE MATERIALIZED VIEW system_metrics_hourly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 hour', time) AS time_hour,
    service_name,
    cluster_name,
    region,
    environment,
    AVG(cpu_utilization) as avg_cpu_utilization,
    MAX(cpu_utilization) as max_cpu_utilization,
    AVG(memory_utilization) as avg_memory_utilization,
    MAX(memory_utilization) as max_memory_utilization,
    AVG(response_time_ms) as avg_response_time_ms,
    MAX(response_time_ms) as max_response_time_ms,
    AVG(error_rate) as avg_error_rate,
    MAX(error_rate) as max_error_rate,
    SUM(request_count) as total_requests
FROM system_metrics 
GROUP BY time_hour, service_name, cluster_name, region, environment;

-- Daily cost metrics rollup
CREATE MATERIALIZED VIEW cost_metrics_daily
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 day', time) AS time_day,
    resource_type,
    region,
    environment,
    cost_center,
    SUM(daily_cost) as total_daily_cost,
    AVG(daily_cost) as avg_daily_cost,
    SUM(estimated_waste) as total_waste,
    COUNT(*) as resource_count
FROM cost_metrics 
GROUP BY time_day, resource_type, region, environment, cost_center;

-- Weekly business value rollup
CREATE MATERIALIZED VIEW business_value_weekly
WITH (timescaledb.continuous) AS
SELECT 
    time_bucket('1 week', time) AS time_week,
    metric_type,
    category,
    region,
    team,
    SUM(cost_savings_usd) as total_cost_savings,
    SUM(time_savings_hours) as total_time_savings,
    AVG(efficiency_gain_percent) as avg_efficiency_gain,
    AVG(risk_reduction_score) as avg_risk_reduction
FROM business_value_metrics 
GROUP BY time_week, metric_type, category, region, team;

-- Enable continuous aggregate policies for automatic refresh
SELECT add_continuous_aggregate_policy('system_metrics_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset => INTERVAL '1 hour',
    schedule_interval => INTERVAL '1 hour');

SELECT add_continuous_aggregate_policy('cost_metrics_daily',
    start_offset => INTERVAL '2 days',
    end_offset => INTERVAL '1 day',
    schedule_interval => INTERVAL '1 day');

SELECT add_continuous_aggregate_policy('business_value_weekly',
    start_offset => INTERVAL '2 weeks',
    end_offset => INTERVAL '1 week',
    schedule_interval => INTERVAL '1 day');

-- Create retention policies to manage data growth
-- Keep raw system metrics for 90 days
SELECT add_retention_policy('system_metrics', INTERVAL '90 days');

-- Keep raw database metrics for 90 days  
SELECT add_retention_policy('database_metrics', INTERVAL '90 days');

-- Keep raw network metrics for 90 days
SELECT add_retention_policy('network_metrics', INTERVAL '90 days');

-- Keep cost metrics for 2 years (financial requirements)
SELECT add_retention_policy('cost_metrics', INTERVAL '2 years');

-- Keep security events for 1 year (compliance requirements)
SELECT add_retention_policy('security_events', INTERVAL '1 year');

-- Keep incident metrics for 1 year  
SELECT add_retention_policy('incident_metrics', INTERVAL '1 year');

-- Keep business value metrics for 3 years (ROI tracking)
SELECT add_retention_policy('business_value_metrics', INTERVAL '3 years');

-- Keep compliance metrics for 7 years (regulatory requirements)
SELECT add_retention_policy('compliance_metrics', INTERVAL '7 years');

-- Create views for common queries
-- Current system health view
CREATE VIEW current_system_health AS
SELECT DISTINCT ON (service_name, cluster_name)
    service_name,
    cluster_name,
    region,
    environment,
    time,
    cpu_utilization,
    memory_utilization,
    response_time_ms,
    error_rate,
    throughput_rps,
    CASE 
        WHEN error_rate > 5 OR response_time_ms > 2000 THEN 'unhealthy'
        WHEN error_rate > 1 OR response_time_ms > 1000 THEN 'degraded'
        ELSE 'healthy'
    END as health_status
FROM system_metrics
ORDER BY service_name, cluster_name, time DESC;

-- Current database performance view
CREATE VIEW current_database_performance AS
SELECT DISTINCT ON (db_identifier)
    db_identifier,
    db_engine,
    region,
    time,
    cpu_utilization,
    database_connections,
    read_latency_ms,
    write_latency_ms,
    buffer_cache_hit_ratio,
    CASE 
        WHEN cpu_utilization > 80 OR read_latency_ms > 100 THEN 'critical'
        WHEN cpu_utilization > 60 OR read_latency_ms > 50 THEN 'warning'
        ELSE 'normal'
    END as performance_status
FROM database_metrics
ORDER BY db_identifier, time DESC;

-- Cost optimization opportunities view
CREATE VIEW cost_optimization_opportunities AS
SELECT 
    resource_id,
    resource_type,
    resource_name,
    region,
    environment,
    AVG(estimated_waste) as avg_daily_waste,
    AVG(optimization_potential) as avg_optimization_potential,
    AVG(daily_cost) as avg_daily_cost,
    (AVG(estimated_waste) * 30) as monthly_waste_estimate
FROM cost_metrics
WHERE time >= NOW() - INTERVAL '7 days'
GROUP BY resource_id, resource_type, resource_name, region, environment
HAVING AVG(estimated_waste) > 0
ORDER BY avg_daily_waste DESC;

-- Sample data insertion function
CREATE OR REPLACE FUNCTION insert_sample_metrics() RETURNS void AS $$
DECLARE
    current_time TIMESTAMPTZ;
    service_names TEXT[] := ARRAY['auth-service', 'payment-api', 'user-management', 'notification-service', 'analytics-engine'];
    cluster_names TEXT[] := ARRAY['prod-trading-cluster', 'prod-risk-cluster', 'prod-portfolio-cluster', 'staging-apps-cluster', 'dev-microservices-cluster'];
    regions TEXT[] := ARRAY['us-east-1', 'us-west-2'];
    environments TEXT[] := ARRAY['production', 'staging', 'development'];
    service_name TEXT;
    cluster_name TEXT;
    region TEXT;
    environment TEXT;
    i INTEGER;
BEGIN
    current_time := NOW();
    
    -- Insert sample system metrics for the last 24 hours
    FOR i IN 1..288 LOOP -- 288 = 24 hours * 12 (every 5 minutes)
        FOREACH service_name IN ARRAY service_names LOOP
            FOREACH cluster_name IN ARRAY cluster_names LOOP
                region := regions[1 + (random() * (array_length(regions, 1) - 1))::int];
                environment := environments[1 + (random() * (array_length(environments, 1) - 1))::int];
                
                INSERT INTO system_metrics VALUES (
                    current_time - (i * interval '5 minutes'),
                    service_name,
                    cluster_name,
                    region,
                    environment,
                    20 + random() * 60, -- cpu_utilization
                    30 + random() * 50, -- memory_utilization  
                    10 + random() * 80, -- disk_utilization
                    1000000 + random() * 5000000, -- network_in_bytes
                    800000 + random() * 4000000, -- network_out_bytes
                    100 + random() * 1000, -- request_count
                    50 + random() * 500, -- response_time_ms
                    random() * 5, -- error_rate
                    10 + random() * 100, -- throughput_rps
                    5 + random() * 95, -- active_connections
                    2 + random() * 8, -- pod_count
                    2 + random() * 8, -- replica_count
                    random() * 2, -- pending_pods
                    random() * 1 -- failed_pods
                );
            END LOOP;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Sample metrics data inserted successfully';
END;
$$ LANGUAGE plpgsql;