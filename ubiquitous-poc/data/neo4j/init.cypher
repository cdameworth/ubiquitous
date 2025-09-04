// Ubiquitous AWS Infrastructure Schema Initialization
// Create constraints and indexes for optimal performance

// Service constraints
CREATE CONSTRAINT service_name IF NOT EXISTS FOR (s:Service) REQUIRE s.name IS UNIQUE;
CREATE CONSTRAINT service_id IF NOT EXISTS FOR (s:Service) REQUIRE s.id IS UNIQUE;

// AWS Resource constraints  
CREATE CONSTRAINT resource_arn IF NOT EXISTS FOR (r:AWSResource) REQUIRE r.arn IS UNIQUE;
CREATE CONSTRAINT cluster_name IF NOT EXISTS FOR (c:EKSCluster) REQUIRE c.name IS UNIQUE;
CREATE CONSTRAINT db_identifier IF NOT EXISTS FOR (d:RDSInstance) REQUIRE d.identifier IS UNIQUE;
CREATE CONSTRAINT ec2_instance_id IF NOT EXISTS FOR (e:EC2Instance) REQUIRE e.instance_id IS UNIQUE;

// Application constraints
CREATE CONSTRAINT app_name IF NOT EXISTS FOR (a:Application) REQUIRE a.name IS UNIQUE;
CREATE CONSTRAINT deployment_id IF NOT EXISTS FOR (d:Deployment) REQUIRE d.id IS UNIQUE;

// Create indexes for performance
CREATE INDEX service_status IF NOT EXISTS FOR (s:Service) ON (s.status);
CREATE INDEX resource_region IF NOT EXISTS FOR (r:AWSResource) ON (r.region);
CREATE INDEX resource_type IF NOT EXISTS FOR (r:AWSResource) ON (r.type);
CREATE INDEX cluster_status IF NOT EXISTS FOR (c:EKSCluster) ON (c.status);
CREATE INDEX db_status IF NOT EXISTS FOR (d:RDSInstance) ON (d.status);
CREATE INDEX app_environment IF NOT EXISTS FOR (a:Application) ON (a.environment);
CREATE INDEX deployment_status IF NOT EXISTS FOR (d:Deployment) ON (d.status);

// Sample AWS Infrastructure - EKS Clusters
CREATE (prod_trading:EKSCluster {
    name: 'prod-trading-cluster',
    arn: 'arn:aws:eks:us-east-1:123456789012:cluster/prod-trading-cluster',
    region: 'us-east-1',
    version: '1.28',
    status: 'ACTIVE',
    endpoint: 'https://ABCD1234.gr7.us-east-1.eks.amazonaws.com',
    created_at: datetime('2023-08-15T10:30:00Z'),
    node_groups: 3,
    total_nodes: 45,
    instance_types: ['m5.large', 'm5.xlarge', 'c5.2xlarge'],
    cost_monthly: 8400.00,
    vpc_id: 'vpc-12345678',
    subnet_ids: ['subnet-12345', 'subnet-67890', 'subnet-abcde']
});

CREATE (prod_risk:EKSCluster {
    name: 'prod-risk-cluster', 
    arn: 'arn:aws:eks:us-east-1:123456789012:cluster/prod-risk-cluster',
    region: 'us-east-1',
    version: '1.28',
    status: 'ACTIVE',
    endpoint: 'https://EFGH5678.gr7.us-east-1.eks.amazonaws.com',
    created_at: datetime('2023-09-20T14:15:00Z'),
    node_groups: 2,
    total_nodes: 28,
    instance_types: ['m5.large', 'c5.xlarge'],
    cost_monthly: 5600.00,
    vpc_id: 'vpc-12345678',
    subnet_ids: ['subnet-fghij', 'subnet-klmno']
});

CREATE (prod_portfolio:EKSCluster {
    name: 'prod-portfolio-cluster',
    arn: 'arn:aws:eks:us-east-1:123456789012:cluster/prod-portfolio-cluster', 
    region: 'us-east-1',
    version: '1.27',
    status: 'ACTIVE',
    endpoint: 'https://IJKL9012.gr7.us-east-1.eks.amazonaws.com',
    created_at: datetime('2023-07-10T09:45:00Z'),
    node_groups: 4,
    total_nodes: 52,
    instance_types: ['m5.xlarge', 'c5.2xlarge', 'r5.large'],
    cost_monthly: 9800.00,
    vpc_id: 'vpc-87654321',
    subnet_ids: ['subnet-pqrst', 'subnet-uvwxy']
});

CREATE (staging_apps:EKSCluster {
    name: 'staging-apps-cluster',
    arn: 'arn:aws:eks:us-west-2:123456789012:cluster/staging-apps-cluster',
    region: 'us-west-2', 
    version: '1.28',
    status: 'ACTIVE',
    endpoint: 'https://MNOP3456.gr7.us-west-2.eks.amazonaws.com',
    created_at: datetime('2023-10-05T16:20:00Z'),
    node_groups: 2,
    total_nodes: 18,
    instance_types: ['m5.medium', 'm5.large'],
    cost_monthly: 2800.00,
    vpc_id: 'vpc-staging01',
    subnet_ids: ['subnet-stage1', 'subnet-stage2']
});

CREATE (dev_microservices:EKSCluster {
    name: 'dev-microservices-cluster',
    arn: 'arn:aws:eks:us-west-2:123456789012:cluster/dev-microservices-cluster',
    region: 'us-west-2',
    version: '1.27', 
    status: 'ACTIVE',
    endpoint: 'https://QRST7890.gr7.us-west-2.eks.amazonaws.com',
    created_at: datetime('2023-11-12T11:00:00Z'),
    node_groups: 1,
    total_nodes: 12,
    instance_types: ['t3.medium', 't3.large'],
    cost_monthly: 1400.00,
    vpc_id: 'vpc-dev01',
    subnet_ids: ['subnet-dev1', 'subnet-dev2']
});

// RDS PostgreSQL Instances
CREATE (rds_trading_primary:RDSInstance {
    identifier: 'trading-primary-postgres',
    arn: 'arn:aws:rds:us-east-1:123456789012:db:trading-primary-postgres',
    engine: 'postgres',
    engine_version: '15.4',
    instance_class: 'db.r6g.2xlarge',
    status: 'available',
    region: 'us-east-1',
    allocated_storage: 2000,
    storage_type: 'gp3',
    multi_az: true,
    backup_retention: 7,
    cost_monthly: 2800.00,
    vpc_id: 'vpc-12345678',
    subnet_group: 'trading-db-subnet-group',
    parameter_group: 'trading-postgres-15'
});

CREATE (rds_trading_replica:RDSInstance {
    identifier: 'trading-replica-postgres',
    arn: 'arn:aws:rds:us-east-1:123456789012:db:trading-replica-postgres', 
    engine: 'postgres',
    engine_version: '15.4',
    instance_class: 'db.r6g.xlarge',
    status: 'available',
    region: 'us-east-1',
    allocated_storage: 2000,
    storage_type: 'gp3',
    multi_az: false,
    backup_retention: 0,
    cost_monthly: 1400.00,
    vpc_id: 'vpc-12345678',
    subnet_group: 'trading-db-subnet-group',
    parameter_group: 'trading-postgres-15'
});

CREATE (rds_risk_primary:RDSInstance {
    identifier: 'risk-analytics-postgres',
    arn: 'arn:aws:rds:us-east-1:123456789012:db:risk-analytics-postgres',
    engine: 'postgres',
    engine_version: '15.4',
    instance_class: 'db.r6g.xlarge', 
    status: 'available',
    region: 'us-east-1',
    allocated_storage: 1000,
    storage_type: 'gp3',
    multi_az: true,
    backup_retention: 14,
    cost_monthly: 1800.00,
    vpc_id: 'vpc-12345678',
    subnet_group: 'risk-db-subnet-group',
    parameter_group: 'risk-postgres-15'
});

CREATE (rds_portfolio_primary:RDSInstance {
    identifier: 'portfolio-data-postgres',
    arn: 'arn:aws:rds:us-east-1:123456789012:db:portfolio-data-postgres',
    engine: 'postgres', 
    engine_version: '14.9',
    instance_class: 'db.r6g.large',
    status: 'available',
    region: 'us-east-1',
    allocated_storage: 500,
    storage_type: 'gp2',
    multi_az: false,
    backup_retention: 7,
    cost_monthly: 900.00,
    vpc_id: 'vpc-87654321',
    subnet_group: 'portfolio-db-subnet-group',
    parameter_group: 'default.postgres14'
});

CREATE (rds_staging_postgres:RDSInstance {
    identifier: 'staging-shared-postgres',
    arn: 'arn:aws:rds:us-west-2:123456789012:db:staging-shared-postgres',
    engine: 'postgres',
    engine_version: '15.4',
    instance_class: 'db.t3.large',
    status: 'available', 
    region: 'us-west-2',
    allocated_storage: 200,
    storage_type: 'gp2',
    multi_az: false,
    backup_retention: 3,
    cost_monthly: 280.00,
    vpc_id: 'vpc-staging01',
    subnet_group: 'staging-db-subnet-group',
    parameter_group: 'default.postgres15'
});

// RDS Oracle Instances (Legacy)
CREATE (rds_oracle_legacy:RDSInstance {
    identifier: 'legacy-financial-oracle',
    arn: 'arn:aws:rds:us-east-1:123456789012:db:legacy-financial-oracle',
    engine: 'oracle-ee',
    engine_version: '19.0.0.0.ru-2023-07.rur-2023-07.r1',
    instance_class: 'db.r5.4xlarge',
    status: 'available',
    region: 'us-east-1',
    allocated_storage: 5000,
    storage_type: 'io1',
    iops: 10000,
    multi_az: true,
    backup_retention: 30,
    cost_monthly: 12800.00,
    license_model: 'bring-your-own-license',
    vpc_id: 'vpc-12345678',
    subnet_group: 'oracle-db-subnet-group',
    parameter_group: 'oracle-ee-19-custom'
});

CREATE (rds_oracle_compliance:RDSInstance {
    identifier: 'compliance-reporting-oracle',
    arn: 'arn:aws:rds:us-east-1:123456789012:db:compliance-reporting-oracle',
    engine: 'oracle-ee',
    engine_version: '19.0.0.0.ru-2023-07.rur-2023-07.r1',
    instance_class: 'db.r5.2xlarge',
    status: 'available',
    region: 'us-east-1',
    allocated_storage: 2000,
    storage_type: 'gp3',
    multi_az: false,
    backup_retention: 14,
    cost_monthly: 6400.00,
    license_model: 'bring-your-own-license',
    vpc_id: 'vpc-87654321',
    subnet_group: 'compliance-db-subnet-group',
    parameter_group: 'oracle-ee-19-compliance'
});

// EC2 SQL Server Instances
CREATE (ec2_sqlserver_reporting:EC2Instance {
    instance_id: 'i-0123456789abcdef0',
    name: 'reporting-sqlserver-01',
    instance_type: 'm5.2xlarge',
    region: 'us-east-1',
    availability_zone: 'us-east-1a',
    status: 'running',
    private_ip: '10.0.1.50',
    vpc_id: 'vpc-12345678',
    subnet_id: 'subnet-12345',
    security_groups: ['sg-sqlserver-reporting'],
    sqlserver_edition: 'Enterprise',
    sqlserver_version: '2019',
    license_type: 'dedicated_host',
    cost_monthly: 2100.00,
    cpu_utilization: 45.2,
    memory_utilization: 68.5,
    storage_gb: 1000
});

CREATE (ec2_sqlserver_analytics:EC2Instance {
    instance_id: 'i-0fedcba987654321f',
    name: 'analytics-sqlserver-01', 
    instance_type: 'm5.xlarge',
    region: 'us-east-1',
    availability_zone: 'us-east-1b',
    status: 'running',
    private_ip: '10.0.2.75',
    vpc_id: 'vpc-12345678',
    subnet_id: 'subnet-67890',
    security_groups: ['sg-sqlserver-analytics'],
    sqlserver_edition: 'Standard',
    sqlserver_version: '2019',
    license_type: 'license_included',
    cost_monthly: 850.00,
    cpu_utilization: 32.1,
    memory_utilization: 54.3,
    storage_gb: 500
});

CREATE (ec2_sqlserver_legacy:EC2Instance {
    instance_id: 'i-abcdef0123456789a',
    name: 'legacy-sqlserver-01',
    instance_type: 'm5.large',
    region: 'us-east-1', 
    availability_zone: 'us-east-1c',
    status: 'running',
    private_ip: '10.0.3.100',
    vpc_id: 'vpc-87654321',
    subnet_id: 'subnet-abcde',
    security_groups: ['sg-sqlserver-legacy'],
    sqlserver_edition: 'Standard',
    sqlserver_version: '2017',
    license_type: 'dedicated_host',
    cost_monthly: 750.00,
    cpu_utilization: 25.8,
    memory_utilization: 42.1,
    storage_gb: 300
});

CREATE (ec2_sqlserver_dev:EC2Instance {
    instance_id: 'i-987654321fedcba9s',
    name: 'dev-sqlserver-01',
    instance_type: 't3.large',
    region: 'us-west-2',
    availability_zone: 'us-west-2a',
    status: 'running',
    private_ip: '10.1.1.25',
    vpc_id: 'vpc-dev01',
    subnet_id: 'subnet-dev1', 
    security_groups: ['sg-sqlserver-dev'],
    sqlserver_edition: 'Express',
    sqlserver_version: '2019',
    license_type: 'license_included',
    cost_monthly: 120.00,
    cpu_utilization: 15.2,
    memory_utilization: 28.7,
    storage_gb: 100
});

// Applications and Services
CREATE (auth_service:Service {
    id: 'auth-service-v2.1',
    name: 'auth-service',
    type: 'microservice',
    environment: 'production',
    status: 'healthy',
    version: '2.1.4',
    port: 8080,
    protocol: 'HTTP',
    health_endpoint: '/health',
    replicas: 6,
    cpu_request: '500m',
    cpu_limit: '1000m',
    memory_request: '1Gi',
    memory_limit: '2Gi'
});

CREATE (payment_api:Service {
    id: 'payment-api-v1.8',
    name: 'payment-api',
    type: 'api',
    environment: 'production',
    status: 'healthy',
    version: '1.8.2',
    port: 8000,
    protocol: 'HTTPS',
    health_endpoint: '/api/health',
    replicas: 8,
    cpu_request: '750m',
    cpu_limit: '1500m',
    memory_request: '2Gi',
    memory_limit: '4Gi'
});

CREATE (user_management:Service {
    id: 'user-mgmt-v3.0',
    name: 'user-management',
    type: 'microservice', 
    environment: 'production',
    status: 'warning',
    version: '3.0.1',
    port: 9000,
    protocol: 'HTTP',
    health_endpoint: '/status',
    replicas: 4,
    cpu_request: '400m',
    cpu_limit: '800m',
    memory_request: '1.5Gi',
    memory_limit: '3Gi'
});

CREATE (notification_service:Service {
    id: 'notification-svc-v1.5',
    name: 'notification-service',
    type: 'service',
    environment: 'production', 
    status: 'healthy',
    version: '1.5.3',
    port: 7000,
    protocol: 'HTTP',
    health_endpoint: '/ping',
    replicas: 3,
    cpu_request: '300m',
    cpu_limit: '600m',
    memory_request: '512Mi',
    memory_limit: '1Gi'
});

CREATE (analytics_engine:Service {
    id: 'analytics-engine-v2.3',
    name: 'analytics-engine',
    type: 'batch_processor',
    environment: 'production',
    status: 'healthy',
    version: '2.3.0',
    port: 8888,
    protocol: 'HTTP',
    health_endpoint: '/health/ready',
    replicas: 12,
    cpu_request: '2000m',
    cpu_limit: '4000m',
    memory_request: '8Gi',
    memory_limit: '16Gi'
});

// Applications
CREATE (trading_app:Application {
    name: 'trading-platform',
    type: 'web_application',
    environment: 'production',
    status: 'active',
    version: '4.2.1',
    business_criticality: 'critical',
    compliance_requirements: ['SOX', 'FINRA'],
    team_owner: 'Trading Platform Team',
    cost_center: 'TR-001'
});

CREATE (risk_app:Application {
    name: 'risk-management-system',
    type: 'analytical_platform',
    environment: 'production',
    status: 'active',
    version: '3.1.5',
    business_criticality: 'high',
    compliance_requirements: ['SOX', 'Basel III'],
    team_owner: 'Risk Analytics Team',
    cost_center: 'RM-002'
});

CREATE (portfolio_app:Application {
    name: 'portfolio-management',
    type: 'web_application',
    environment: 'production',
    status: 'active',
    version: '2.8.3',
    business_criticality: 'high',
    compliance_requirements: ['SOX'],
    team_owner: 'Portfolio Management Team',
    cost_center: 'PM-003'
});

// Create relationships between services and clusters
CREATE (auth_service)-[:DEPLOYED_ON]->(prod_trading);
CREATE (auth_service)-[:DEPLOYED_ON]->(prod_risk);
CREATE (payment_api)-[:DEPLOYED_ON]->(prod_trading);
CREATE (user_management)-[:DEPLOYED_ON]->(prod_portfolio);
CREATE (notification_service)-[:DEPLOYED_ON]->(prod_trading);
CREATE (analytics_engine)-[:DEPLOYED_ON]->(prod_risk);

// Create relationships between services and databases
CREATE (auth_service)-[:CONNECTS_TO]->(rds_trading_primary);
CREATE (payment_api)-[:CONNECTS_TO]->(rds_trading_primary);
CREATE (payment_api)-[:READS_FROM]->(rds_trading_replica);
CREATE (user_management)-[:CONNECTS_TO]->(rds_portfolio_primary);
CREATE (analytics_engine)-[:CONNECTS_TO]->(rds_risk_primary);
CREATE (analytics_engine)-[:CONNECTS_TO]->(rds_oracle_legacy);

// Create relationships between applications and services
CREATE (trading_app)-[:USES]->(auth_service);
CREATE (trading_app)-[:USES]->(payment_api);
CREATE (trading_app)-[:USES]->(notification_service);

CREATE (risk_app)-[:USES]->(auth_service);
CREATE (risk_app)-[:USES]->(analytics_engine);
CREATE (risk_app)-[:USES]->(user_management);

CREATE (portfolio_app)-[:USES]->(auth_service);
CREATE (portfolio_app)-[:USES]->(user_management);
CREATE (portfolio_app)-[:USES]->(notification_service);

// Service dependencies
CREATE (payment_api)-[:DEPENDS_ON]->(auth_service);
CREATE (user_management)-[:DEPENDS_ON]->(auth_service);
CREATE (notification_service)-[:DEPENDS_ON]->(user_management);
CREATE (analytics_engine)-[:DEPENDS_ON]->(auth_service);

// Database replication relationships
CREATE (rds_trading_primary)-[:REPLICATES_TO]->(rds_trading_replica);

// Legacy system relationships
CREATE (rds_oracle_legacy)-[:LEGACY_MIGRATION_TARGET]->(rds_trading_primary);
CREATE (rds_oracle_compliance)-[:LEGACY_MIGRATION_TARGET]->(rds_risk_primary);

// SQL Server application relationships  
CREATE (ec2_sqlserver_reporting)-[:HOSTS_DATABASE_FOR]->(trading_app);
CREATE (ec2_sqlserver_analytics)-[:HOSTS_DATABASE_FOR]->(risk_app);
CREATE (ec2_sqlserver_legacy)-[:HOSTS_DATABASE_FOR]->(portfolio_app);

RETURN "AWS Infrastructure schema initialized successfully";