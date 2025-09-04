# Ubiquitous Platform: Comprehensive Data Integration Architecture
## Backend and Data Layer Implementation Guide

---

## Executive Summary

This document provides a comprehensive technical architecture for integrating 8 external data sources (DataDog, AWS CloudWatch, Tanium, OpenTelemetry, Flexera, Terraform, GitHub, ServiceNow) into the Ubiquitous platform's 10 core capabilities. It details the data flow, processing requirements, storage strategies, and API architecture needed to power each frontend page with real-time and historical data.

---

## 1. Page-to-Data Source Mapping Matrix

### 1.1 Network Protocol Analysis Page
**Primary Data Sources:**
- **DataDog**: Network performance metrics, APM traces, network flow logs
- **AWS CloudWatch**: VPC Flow Logs, ALB/NLB metrics, Direct Connect metrics
- **OpenTelemetry**: Distributed tracing data, service mesh metrics

**Data Requirements:**
```yaml
Real-time Metrics:
  - Latency: p50, p95, p99 per endpoint
  - Throughput: requests/sec, bytes/sec
  - Error rates: by protocol, endpoint, region
  - Network topology: live connection mapping

Historical Data:
  - 90-day retention for trend analysis
  - 5-minute aggregation for heatmaps
  - Packet-level data for last 24 hours
```

**Processing Pipeline:**
1. **Ingestion**: Kafka topics for network events (1M events/sec capacity)
2. **Stream Processing**: Apache Flink for real-time latency calculations
3. **Storage**: TimescaleDB for time-series, Neo4j for topology
4. **Aggregation**: 5-min, 1-hour, 1-day rollups

### 1.2 FinOps Dashboard
**Primary Data Sources:**
- **AWS CloudWatch**: Cost and Usage Reports, Reserved Instance utilization
- **Flexera**: License optimization, software asset management
- **Terraform**: Infrastructure state files, resource configurations
- **ServiceNow**: CMDB for cost allocation mapping

**Data Requirements:**
```yaml
Cost Metrics:
  - Real-time spend rate (per minute)
  - Resource utilization vs. provisioned capacity
  - Reserved vs. on-demand vs. spot usage
  - Tag-based cost allocation

IaC Integration:
  - Current Terraform state analysis
  - Optimization recommendations with code generation
  - Drift detection between actual and declared
```

**Processing Pipeline:**
1. **Batch Processing**: Daily AWS CUR ingestion via S3 -> Spark
2. **Real-time Updates**: CloudWatch metrics every 5 minutes
3. **Terraform Analysis**: Git webhook triggers for state file analysis
4. **Storage**: Snowflake for historical costs, PostgreSQL for recommendations

### 1.3 Security Scanner
**Primary Data Sources:**
- **Tanium**: Endpoint security data, vulnerability scans, compliance status
- **GitHub**: Dependency scanning, secret scanning, code security analysis
- **AWS CloudWatch**: GuardDuty findings, Security Hub alerts
- **ServiceNow**: Security incident tickets, vulnerability management

**Data Requirements:**
```yaml
Vulnerability Data:
  - CVE correlation with CVSS scores
  - Dependency trees with transitive vulnerabilities
  - Real-time threat intelligence feeds
  - Compliance framework mappings (PCI, SOX, GDPR)

Security Metrics:
  - Attack surface enumeration
  - Encryption coverage analysis
  - Zero-trust readiness scoring
```

**Processing Pipeline:**
1. **Continuous Scanning**: Tanium agents report every 15 minutes
2. **GitHub Webhooks**: Immediate updates on code changes
3. **Threat Intelligence**: External feed integration (MITRE ATT&CK)
4. **Storage**: Neo4j for dependency graphs, PostgreSQL for vulnerabilities

### 1.4 Observability Recommender
**Primary Data Sources:**
- **DataDog**: Current monitoring coverage, alert configurations
- **OpenTelemetry**: Instrumentation coverage, trace sampling rates
- **AWS CloudWatch**: CloudWatch Logs Insights, metrics coverage
- **ServiceNow**: Incident patterns, MTTR statistics

**Data Requirements:**
```yaml
Coverage Analysis:
  - Instrumented vs. uninstrumented services
  - Log aggregation completeness
  - Metric collection gaps
  - Distributed tracing coverage

Best Practices:
  - Industry standard comparisons
  - Maturity model scoring
  - Alert effectiveness metrics
```

**Processing Pipeline:**
1. **Discovery**: Daily service discovery across all sources
2. **Gap Analysis**: ML model for identifying monitoring blindspots
3. **Recommendations**: Rule engine for best practice suggestions
4. **Storage**: PostgreSQL for recommendations, Redis for caching

### 1.5 DR Readiness & Execution
**Primary Data Sources:**
- **AWS CloudWatch**: Backup status, RDS snapshots, EBS snapshots
- **ServiceNow**: DR test results, runbook execution history
- **Terraform**: Infrastructure definitions for DR environments
- **DataDog**: Service dependencies, critical path analysis

**Data Requirements:**
```yaml
DR Metrics:
  - RPO/RTO validation per service
  - Backup success rates and retention
  - Failover test results
  - Dependency chain mapping

Execution Support:
  - Step-by-step runbook generation
  - Automated validation checks
  - Recovery time estimation
```

**Processing Pipeline:**
1. **Continuous Validation**: Hourly RPO/RTO checks
2. **Dependency Mapping**: Real-time service dependency updates
3. **Simulation Engine**: Weekly DR simulation runs
4. **Storage**: PostgreSQL for runbooks, TimescaleDB for test results

### 1.6 Real-Time CMDB
**Primary Data Sources:**
- **ServiceNow**: Existing CMDB records
- **DataDog**: Auto-discovered infrastructure
- **AWS CloudWatch**: EC2, RDS, Lambda inventory
- **Tanium**: Endpoint inventory, software installations
- **OpenTelemetry**: Service registry, API endpoints

**Data Requirements:**
```yaml
Configuration Items:
  - Real-time state (< 1 minute lag)
  - Historical changes with audit trail
  - Relationship mappings
  - Drift detection from baselines

Auto-Discovery:
  - Network scanning results
  - Cloud resource discovery
  - Container/Kubernetes resources
```

**Processing Pipeline:**
1. **Bi-directional Sync**: ServiceNow <-> Ubiquitous every 30 seconds
2. **Auto-Discovery**: Continuous scanning and reconciliation
3. **Drift Detection**: Every 5 minutes against baselines
4. **Storage**: Neo4j for relationships, PostgreSQL for configurations

### 1.7 Outage Context & Incident Intelligence
**Primary Data Sources:**
- **DataDog**: APM traces, error tracking, anomaly detection
- **AWS CloudWatch**: CloudWatch alarms, X-Ray traces
- **ServiceNow**: Incident tickets, change calendar
- **OpenTelemetry**: Distributed traces, service mesh metrics

**Data Requirements:**
```yaml
Incident Context:
  - Real-time telemetry correlation
  - Blast radius calculation
  - Timeline reconstruction (5-min precision)
  - Customer impact analysis

Root Cause Analysis:
  - Anomaly detection across metrics
  - Change correlation
  - Dependency impact assessment
```

**Processing Pipeline:**
1. **Real-time Correlation**: Flink CEP for event correlation
2. **Anomaly Detection**: ML models on streaming data
3. **Impact Analysis**: Graph traversal for blast radius
4. **Storage**: TimescaleDB for metrics, ElasticSearch for logs

### 1.8 Greenfield Application Planning
**Primary Data Sources:**
- **ServiceNow**: Application portfolio, similar workloads
- **AWS CloudWatch**: Historical usage patterns, cost data
- **Terraform**: Existing infrastructure patterns, module library
- **DataDog**: Performance baselines, capacity requirements

**Data Requirements:**
```yaml
Workload Analysis:
  - Similar application patterns
  - Resource consumption profiles
  - Cost projections
  - Compliance requirements

Architecture Patterns:
  - Recommended technology stacks
  - Infrastructure sizing models
  - Network topology templates
```

**Processing Pipeline:**
1. **Pattern Mining**: ML clustering on existing workloads
2. **Cost Modeling**: Regression analysis on historical data
3. **Template Generation**: IaC template creation
4. **Storage**: PostgreSQL for patterns, S3 for templates

### 1.9 ARB Decision Support
**Primary Data Sources:**
- **GitHub**: Code complexity metrics, technical debt analysis
- **ServiceNow**: Change history, incident correlation
- **Terraform**: Infrastructure complexity, resource dependencies
- **DataDog**: Performance impact analysis

**Data Requirements:**
```yaml
Architecture Metrics:
  - Technical debt quantification
  - Complexity scores
  - Risk assessment data
  - Performance baselines

Decision Support:
  - Cost-benefit analysis
  - Compliance impact
  - Performance projections
```

**Processing Pipeline:**
1. **Code Analysis**: Daily GitHub repository scanning
2. **Risk Scoring**: ML model for risk assessment
3. **Impact Modeling**: Simulation engine for changes
4. **Storage**: PostgreSQL for assessments, Neo4j for dependencies

### 1.10 Executive Value Reporting
**Primary Data Sources:**
- **All Sources**: Aggregated metrics from all capabilities
- **ServiceNow**: Incident reduction, MTTR improvements
- **AWS CloudWatch**: Cost savings, optimization metrics
- **Flexera**: License optimization savings

**Data Requirements:**
```yaml
Value Metrics:
  - Cost savings (daily, monthly, quarterly, annual)
  - Time savings (automation, efficiency)
  - Risk reduction (incidents prevented)
  - Compliance improvements

Reporting Hierarchy:
  - Team level metrics
  - Department aggregations
  - Executive summaries
  - Board-level dashboards
```

**Processing Pipeline:**
1. **Continuous Aggregation**: Real-time value tracking
2. **Attribution Engine**: Value attribution to teams/initiatives
3. **Forecasting**: ML models for trend projection
4. **Storage**: Snowflake data warehouse for historical analysis

---

## 2. Data Ingestion Architecture

### 2.1 Ingestion Patterns by Source

```yaml
DataDog:
  Method: REST API + Webhooks
  Frequency: 
    - Metrics: 1-minute pull
    - Events: Real-time push via webhooks
    - Logs: Streaming via API
  Volume: ~500K metrics/min, 100K events/hour
  Authentication: API Key with rate limiting
  
AWS CloudWatch:
  Method: AWS SDK + S3 Events
  Frequency:
    - Metrics: 5-minute pull
    - Logs: Kinesis Data Firehose streaming
    - Cost Reports: Daily S3 delivery
  Volume: ~1M metrics/min, 10GB logs/hour
  Authentication: IAM role with cross-account access

Tanium:
  Method: REST API + GraphQL
  Frequency:
    - Endpoint data: 15-minute pull
    - Vulnerabilities: Hourly pull
    - Compliance: Daily pull
  Volume: ~50K endpoints, 500K vulnerabilities
  Authentication: OAuth 2.0 with certificate

OpenTelemetry:
  Method: OTLP (gRPC/HTTP)
  Frequency: Real-time push
  Volume: ~2M spans/min, 5M metrics/min
  Authentication: mTLS with client certificates

Flexera:
  Method: REST API
  Frequency:
    - License data: Daily pull
    - Usage metrics: Hourly pull
  Volume: ~10K licenses, 100K usage records
  Authentication: API Token

Terraform:
  Method: Git webhooks + S3
  Frequency: On commit (webhooks)
  Volume: ~1K state files, 100K resources
  Authentication: GitHub App + AWS IAM

GitHub:
  Method: GraphQL API + Webhooks
  Frequency:
    - Code metrics: On push
    - Security scans: On PR
  Volume: ~500 repos, 10K PRs/month
  Authentication: GitHub App with fine-grained permissions

ServiceNow:
  Method: REST API + Webhooks
  Frequency:
    - CMDB: 30-second bi-directional sync
    - Incidents: Real-time push
    - Changes: Real-time push
  Volume: ~100K CIs, 5K incidents/month
  Authentication: OAuth 2.0
```

### 2.2 Kafka Topic Architecture

```yaml
Topics:
  # Network Data
  network.metrics:
    Partitions: 50
    Retention: 24 hours
    Throughput: 1M msgs/sec
    
  network.topology:
    Partitions: 10
    Retention: 7 days
    Throughput: 10K msgs/sec
    
  # Security Data  
  security.vulnerabilities:
    Partitions: 20
    Retention: 30 days
    Throughput: 100K msgs/sec
    
  security.incidents:
    Partitions: 10
    Retention: 90 days
    Throughput: 10K msgs/sec
    
  # Cost Data
  finops.costs:
    Partitions: 20
    Retention: 90 days
    Throughput: 50K msgs/sec
    
  finops.optimization:
    Partitions: 10
    Retention: 30 days
    Throughput: 10K msgs/sec
    
  # CMDB Data
  cmdb.changes:
    Partitions: 30
    Retention: 7 days
    Throughput: 500K msgs/sec
    
  # Observability Data
  observability.metrics:
    Partitions: 100
    Retention: 24 hours
    Throughput: 5M msgs/sec
    
  observability.traces:
    Partitions: 50
    Retention: 7 days
    Throughput: 2M msgs/sec
```

---

## 3. Data Processing Pipelines

### 3.1 Stream Processing (Apache Flink)

```python
# Example Flink Job for Network Latency Analysis
class LatencyAnalysisJob:
    """
    Processes network metrics to calculate latency patterns
    and generate heatmap data
    """
    
    def process_stream(self):
        # Source: Kafka network.metrics topic
        network_stream = env.add_source(
            KafkaSource.builder()
                .set_topics("network.metrics")
                .set_starting_offsets(OffsetsInitializer.latest())
                .build()
        )
        
        # Window aggregation for 5-minute heatmaps
        latency_windows = network_stream \
            .key_by(lambda x: (x.source_region, x.dest_region)) \
            .window(TumblingEventTimeWindows.of(Time.minutes(5))) \
            .aggregate(
                LatencyAggregator(),
                LatencyWindowFunction()
            )
        
        # Calculate percentiles
        percentiles = latency_windows \
            .map(calculate_percentiles) \
            .filter(lambda x: x.sample_size > 100)
        
        # Detect anomalies
        anomalies = percentiles \
            .key_by(lambda x: x.route) \
            .flatmap(AnomalyDetector())
        
        # Sink to TimescaleDB and alert system
        percentiles.add_sink(TimescaleDBSink("network_latency_5min"))
        anomalies.add_sink(AlertingSink("latency_anomalies"))
```

### 3.2 Batch Processing (Apache Spark)

```python
# Example Spark Job for FinOps Cost Analysis
class CostOptimizationJob:
    """
    Daily batch job to analyze AWS costs and generate
    optimization recommendations
    """
    
    def run_analysis(self, spark):
        # Load AWS Cost and Usage Report
        cur_df = spark.read.parquet("s3://cost-reports/current/")
        
        # Load resource utilization from CloudWatch
        utilization_df = spark.read.parquet("s3://metrics/utilization/")
        
        # Load Flexera license data
        license_df = spark.read.parquet("s3://flexera/licenses/")
        
        # Join datasets
        combined_df = cur_df.join(
            utilization_df,
            ["resource_id", "date"],
            "left"
        ).join(
            license_df,
            ["software_id"],
            "left"
        )
        
        # Calculate waste
        waste_df = combined_df.withColumn(
            "waste_amount",
            when(col("utilization") < 30, col("cost") * 0.7)
            .when(col("utilization") < 50, col("cost") * 0.4)
            .otherwise(0)
        )
        
        # Generate recommendations
        recommendations = waste_df \
            .groupBy("service", "instance_type", "region") \
            .agg(
                sum("waste_amount").alias("total_waste"),
                avg("utilization").alias("avg_utilization"),
                count("resource_id").alias("resource_count")
            ) \
            .filter(col("total_waste") > 1000) \
            .withColumn(
                "recommendation",
                generate_recommendation_udf(
                    col("service"),
                    col("instance_type"),
                    col("avg_utilization")
                )
            )
        
        # Generate Terraform code for recommendations
        terraform_code = recommendations.rdd \
            .map(generate_terraform_code) \
            .collect()
        
        # Save results
        recommendations.write.mode("overwrite") \
            .parquet("s3://recommendations/finops/daily/")
        
        return recommendations, terraform_code
```

### 3.3 Machine Learning Pipeline

```python
# Example ML Pipeline for Anomaly Detection
class AnomalyDetectionPipeline:
    """
    ML pipeline for detecting anomalies across multiple metrics
    using ensemble methods
    """
    
    def train_models(self):
        # Load training data from TimescaleDB
        training_data = load_timeseries_data(
            metrics=["cpu", "memory", "network", "disk"],
            period="30d",
            aggregation="5min"
        )
        
        # Feature engineering
        features = self.engineer_features(training_data)
        
        # Train ensemble of models
        models = {
            "isolation_forest": IsolationForest(
                contamination=0.01,
                n_estimators=100
            ),
            "lstm_autoencoder": self.build_lstm_autoencoder(),
            "prophet": Prophet(
                yearly_seasonality=False,
                weekly_seasonality=True,
                daily_seasonality=True
            )
        }
        
        # Train and validate each model
        for name, model in models.items():
            X_train, X_val = train_test_split(features, test_size=0.2)
            model.fit(X_train)
            
            # Calculate validation metrics
            predictions = model.predict(X_val)
            metrics = calculate_metrics(X_val, predictions)
            
            # Save model to MLflow
            mlflow.sklearn.log_model(
                model,
                f"anomaly_detection/{name}",
                registered_model_name=f"anomaly_{name}"
            )
            mlflow.log_metrics(metrics)
        
        return models
    
    def predict_anomalies(self, real_time_data):
        # Load models from MLflow
        models = self.load_models()
        
        # Ensemble prediction
        predictions = []
        for model in models.values():
            pred = model.predict_proba(real_time_data)
            predictions.append(pred)
        
        # Weighted average based on model performance
        ensemble_prediction = np.average(
            predictions,
            weights=self.model_weights,
            axis=0
        )
        
        # Generate alerts for high-confidence anomalies
        anomalies = ensemble_prediction > self.threshold
        
        return anomalies
```

---

## 4. Storage Architecture

### 4.1 Database Selection by Data Type

```yaml
Neo4j (Graph Database):
  Purpose: Relationships and topology
  Data:
    - Infrastructure dependencies
    - Service mesh topology
    - Security vulnerability chains
    - Impact analysis graphs
  Scale: 10M nodes, 100M relationships
  Query Pattern: Graph traversal, shortest path, impact radius

TimescaleDB (Time-Series):
  Purpose: Metrics and real-time data
  Data:
    - Performance metrics (CPU, memory, network)
    - Latency measurements
    - Cost metrics over time
    - Incident timelines
  Scale: 90 days hot data, 5-min aggregation
  Query Pattern: Time-range queries, aggregations, rollups

PostgreSQL (Relational):
  Purpose: Structured configuration data
  Data:
    - CMDB records
    - Recommendations
    - Runbooks and procedures
    - User configurations
  Scale: 1M records, complex joins
  Query Pattern: CRUD operations, complex filters

Snowflake (Data Warehouse):
  Purpose: Historical analysis and reporting
  Data:
    - 5+ years of historical metrics
    - Cost analysis data
    - Compliance audit trails
    - Executive reporting data
  Scale: Petabytes of compressed data
  Query Pattern: Complex analytical queries, aggregations

ElasticSearch (Search/Logs):
  Purpose: Log aggregation and search
  Data:
    - Application logs
    - Audit logs
    - Security events
    - Change logs
  Scale: 30 days hot, 1 year warm
  Query Pattern: Full-text search, log correlation

Redis (Cache):
  Purpose: High-performance caching
  Data:
    - Session state
    - Frequent query results
    - Real-time dashboards
    - Temporary calculations
  Scale: 100GB in-memory
  Query Pattern: Key-value lookups, pub/sub
```

### 4.2 Data Retention and Tiering Strategy

```yaml
Hot Tier (0-7 days):
  Storage: NVMe SSD
  Databases: TimescaleDB, Redis, ElasticSearch
  Access: < 100ms response time
  Use Case: Real-time dashboards, active incidents

Warm Tier (7-90 days):
  Storage: Standard SSD
  Databases: TimescaleDB (compressed), PostgreSQL
  Access: < 1s response time
  Use Case: Recent analysis, trend detection

Cold Tier (90 days - 1 year):
  Storage: HDD + S3
  Databases: Snowflake, S3 Parquet files
  Access: < 10s response time
  Use Case: Historical analysis, compliance

Archive Tier (1+ years):
  Storage: S3 Glacier
  Databases: S3 Glacier Deep Archive
  Access: Hours to retrieve
  Use Case: Compliance, audit requirements
```

---

## 5. API Architecture

### 5.1 FastAPI Backend Structure

```python
# Main API structure
app/
├── routers/
│   ├── network_analysis.py      # Network protocol endpoints
│   ├── finops.py                # FinOps analysis endpoints
│   ├── security.py              # Security scanner endpoints
│   ├── observability.py         # Observability recommender
│   ├── dr_readiness.py          # DR planning endpoints
│   ├── cmdb.py                  # Real-time CMDB endpoints
│   ├── outage_context.py        # Incident intelligence
│   ├── greenfield.py            # Greenfield planning
│   ├── arb_support.py           # ARB decision support
│   └── executive.py             # Executive reporting
├── services/
│   ├── data_ingestion/
│   │   ├── datadog_client.py
│   │   ├── cloudwatch_client.py
│   │   ├── tanium_client.py
│   │   ├── opentelemetry_client.py
│   │   ├── flexera_client.py
│   │   ├── terraform_client.py
│   │   ├── github_client.py
│   │   └── servicenow_client.py
│   ├── processing/
│   │   ├── stream_processor.py
│   │   ├── batch_processor.py
│   │   └── ml_pipeline.py
│   └── storage/
│       ├── neo4j_service.py
│       ├── timescale_service.py
│       ├── postgres_service.py
│       └── cache_service.py
├── models/
│   ├── network_models.py
│   ├── security_models.py
│   ├── finops_models.py
│   └── cmdb_models.py
└── core/
    ├── config.py
    ├── security.py
    └── dependencies.py
```

### 5.2 Example API Implementation

```python
# network_analysis.py - Network Protocol Analysis endpoints
from fastapi import APIRouter, Query, WebSocket
from typing import List, Optional
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/network", tags=["Network Analysis"])

@router.get("/latency-heatmap")
async def get_latency_heatmap(
    start_time: datetime = Query(default=datetime.now() - timedelta(hours=1)),
    end_time: datetime = Query(default=datetime.now()),
    aggregation: str = Query(default="5min", regex="^(1min|5min|1hour|1day)$"),
    regions: Optional[List[str]] = Query(default=None)
):
    """
    Get latency heatmap data for network visualization
    
    Data Flow:
    1. Query TimescaleDB for latency metrics in time range
    2. Aggregate by source/destination pairs
    3. Calculate percentiles (p50, p95, p99)
    4. Format for D3.js heatmap visualization
    """
    
    # Query TimescaleDB
    query = """
    SELECT 
        source_region,
        dest_region,
        time_bucket($1, timestamp) as time_bucket,
        percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms) as p50,
        percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) as p95,
        percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms) as p99,
        count(*) as sample_count
    FROM network_latency
    WHERE timestamp >= $2 AND timestamp <= $3
        AND ($4::text[] IS NULL OR source_region = ANY($4))
        AND ($4::text[] IS NULL OR dest_region = ANY($4))
    GROUP BY source_region, dest_region, time_bucket
    ORDER BY time_bucket DESC
    """
    
    results = await timescale_service.execute_query(
        query,
        aggregation,
        start_time,
        end_time,
        regions
    )
    
    # Format for heatmap
    heatmap_data = format_latency_heatmap(results)
    
    # Add anomaly detection results
    anomalies = await ml_service.detect_latency_anomalies(
        heatmap_data,
        threshold=0.95
    )
    
    return {
        "heatmap": heatmap_data,
        "anomalies": anomalies,
        "metadata": {
            "start_time": start_time,
            "end_time": end_time,
            "aggregation": aggregation,
            "total_samples": sum(r["sample_count"] for r in results)
        }
    }

@router.websocket("/real-time-topology")
async def websocket_topology(websocket: WebSocket):
    """
    WebSocket endpoint for real-time network topology updates
    
    Data Flow:
    1. Subscribe to Kafka network.topology topic
    2. Stream topology changes to frontend
    3. Include dependency updates and impact analysis
    """
    await websocket.accept()
    
    # Subscribe to Kafka topic
    consumer = create_kafka_consumer("network.topology")
    
    try:
        while True:
            # Get latest topology update
            message = await consumer.get_next_message()
            
            # Query Neo4j for full topology context
            topology = await neo4j_service.get_network_topology(
                center_node=message["node_id"],
                depth=3
            )
            
            # Calculate impact radius
            impact = await calculate_impact_radius(
                topology,
                message["change_type"]
            )
            
            # Send to frontend
            await websocket.send_json({
                "type": "topology_update",
                "data": {
                    "topology": topology,
                    "change": message,
                    "impact": impact,
                    "timestamp": datetime.now().isoformat()
                }
            })
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        await consumer.close()
        await websocket.close()

@router.get("/protocol-analysis")
async def analyze_protocols(
    service_id: str,
    time_range: str = Query(default="1h", regex="^(1h|6h|24h|7d)$")
):
    """
    Analyze network protocols for a specific service
    
    Data Flow:
    1. Get service topology from Neo4j
    2. Query DataDog APM for protocol-level traces
    3. Analyze CloudWatch VPC Flow Logs
    4. Correlate with OpenTelemetry spans
    5. Generate protocol optimization recommendations
    """
    
    # Get service dependencies
    dependencies = await neo4j_service.get_service_dependencies(service_id)
    
    # Collect protocol metrics from multiple sources
    datadog_metrics = await datadog_client.get_protocol_metrics(
        service_id,
        time_range
    )
    
    flow_logs = await cloudwatch_client.get_vpc_flow_logs(
        service_id,
        time_range
    )
    
    otel_traces = await opentelemetry_client.get_protocol_traces(
        service_id,
        time_range
    )
    
    # Analyze protocols
    analysis = analyze_protocol_patterns(
        datadog_metrics,
        flow_logs,
        otel_traces
    )
    
    # Generate recommendations
    recommendations = generate_protocol_recommendations(analysis)
    
    return {
        "service_id": service_id,
        "dependencies": dependencies,
        "protocols": analysis["protocols"],
        "performance": analysis["performance"],
        "recommendations": recommendations,
        "potential_savings": calculate_bandwidth_savings(recommendations)
    }
```

---

## 6. Real-Time Data Processing

### 6.1 WebSocket Architecture

```python
# WebSocket manager for real-time updates
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}
        self.subscriptions: Dict[str, Set[str]] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        if client_id not in self.active_connections:
            self.active_connections[client_id] = []
        self.active_connections[client_id].append(websocket)
    
    async def subscribe(self, client_id: str, topics: List[str]):
        """Subscribe client to specific data topics"""
        if client_id not in self.subscriptions:
            self.subscriptions[client_id] = set()
        self.subscriptions[client_id].update(topics)
    
    async def broadcast_to_topic(self, topic: str, data: dict):
        """Broadcast data to all clients subscribed to topic"""
        for client_id, topics in self.subscriptions.items():
            if topic in topics:
                for connection in self.active_connections.get(client_id, []):
                    try:
                        await connection.send_json({
                            "topic": topic,
                            "data": data,
                            "timestamp": datetime.now().isoformat()
                        })
                    except:
                        await self.disconnect(connection, client_id)

# Real-time data streaming service
class RealTimeDataService:
    def __init__(self):
        self.manager = ConnectionManager()
        self.kafka_consumers = {}
        
    async def start_streaming(self):
        """Start streaming data from Kafka to WebSocket clients"""
        
        # Start consumers for each topic
        topics = [
            "network.metrics",
            "security.incidents", 
            "finops.costs",
            "cmdb.changes",
            "observability.alerts"
        ]
        
        for topic in topics:
            consumer = create_kafka_consumer(topic)
            self.kafka_consumers[topic] = consumer
            
            # Start background task for each topic
            asyncio.create_task(
                self.stream_topic(topic, consumer)
            )
    
    async def stream_topic(self, topic: str, consumer):
        """Stream data from Kafka topic to WebSocket clients"""
        
        while True:
            try:
                # Get batch of messages
                messages = await consumer.get_messages(max_messages=100)
                
                for message in messages:
                    # Process based on topic
                    processed_data = await self.process_message(
                        topic,
                        message
                    )
                    
                    # Broadcast to subscribers
                    await self.manager.broadcast_to_topic(
                        topic,
                        processed_data
                    )
                    
            except Exception as e:
                logger.error(f"Streaming error for {topic}: {e}")
                await asyncio.sleep(5)  # Retry after 5 seconds
```

---

## 7. Data Transformation and Aggregation

### 7.1 ETL Pipeline for Each Data Source

```python
# DataDog ETL Pipeline
class DataDogETL:
    """ETL pipeline for DataDog metrics and events"""
    
    async def extract(self):
        """Extract data from DataDog API"""
        
        # Metrics extraction
        metrics = await self.datadog_client.query_metrics(
            from_time=self.last_sync_time,
            to_time=datetime.now(),
            queries=[
                "avg:system.cpu.user{*} by {host}",
                "avg:system.mem.used{*} by {host}",
                "sum:network.bytes_sent{*} by {host,interface}",
                "avg:aws.elb.latency{*} by {loadbalancer}"
            ]
        )
        
        # APM traces extraction
        traces = await self.datadog_client.get_traces(
            from_time=self.last_sync_time,
            services=self.monitored_services
        )
        
        # Events extraction
        events = await self.datadog_client.get_events(
            from_time=self.last_sync_time,
            tags=["severity:critical", "severity:error"]
        )
        
        return {
            "metrics": metrics,
            "traces": traces,
            "events": events
        }
    
    def transform(self, raw_data):
        """Transform DataDog data to Ubiquitous format"""
        
        transformed = {
            "metrics": [],
            "topology": [],
            "incidents": []
        }
        
        # Transform metrics
        for metric in raw_data["metrics"]:
            transformed["metrics"].append({
                "timestamp": metric["timestamp"],
                "host": metric["tags"]["host"],
                "metric_name": metric["metric"],
                "value": metric["value"],
                "unit": metric["unit"],
                "tags": metric["tags"]
            })
        
        # Extract topology from traces
        for trace in raw_data["traces"]:
            for span in trace["spans"]:
                if span["parent_id"]:
                    transformed["topology"].append({
                        "source": span["parent_service"],
                        "target": span["service"],
                        "operation": span["operation"],
                        "latency_ms": span["duration"] / 1000000,
                        "timestamp": span["start_time"]
                    })
        
        # Transform events to incidents
        for event in raw_data["events"]:
            if event["alert_type"] in ["error", "warning"]:
                transformed["incidents"].append({
                    "source": "datadog",
                    "severity": event["priority"],
                    "title": event["title"],
                    "description": event["text"],
                    "tags": event["tags"],
                    "timestamp": event["date_happened"]
                })
        
        return transformed
    
    async def load(self, transformed_data):
        """Load transformed data into appropriate storage"""
        
        # Metrics to TimescaleDB
        await self.timescale_service.insert_metrics(
            transformed_data["metrics"]
        )
        
        # Topology to Neo4j
        await self.neo4j_service.update_topology(
            transformed_data["topology"]
        )
        
        # Incidents to PostgreSQL and notification system
        for incident in transformed_data["incidents"]:
            await self.postgres_service.insert_incident(incident)
            await self.notification_service.send_alert(incident)
        
        # Update last sync time
        self.last_sync_time = datetime.now()

# AWS CloudWatch ETL Pipeline
class CloudWatchETL:
    """ETL pipeline for AWS CloudWatch data"""
    
    async def extract(self):
        """Extract data from CloudWatch"""
        
        # EC2 metrics
        ec2_metrics = await self.cloudwatch_client.get_metrics(
            namespace="AWS/EC2",
            metric_names=[
                "CPUUtilization",
                "NetworkIn",
                "NetworkOut",
                "DiskReadBytes",
                "DiskWriteBytes"
            ],
            dimensions={"InstanceId": self.ec2_instances}
        )
        
        # RDS metrics
        rds_metrics = await self.cloudwatch_client.get_metrics(
            namespace="AWS/RDS",
            metric_names=[
                "DatabaseConnections",
                "CPUUtilization",
                "FreeableMemory",
                "ReadLatency",
                "WriteLatency"
            ],
            dimensions={"DBInstanceIdentifier": self.rds_instances}
        )
        
        # Cost and Usage Report
        cur_data = await self.s3_client.get_object(
            bucket="aws-cost-reports",
            key=f"cur/{datetime.now().strftime('%Y%m%d')}.parquet"
        )
        
        # VPC Flow Logs
        flow_logs = await self.cloudwatch_logs_client.query(
            log_group="/aws/vpc/flowlogs",
            query="""
            fields srcaddr, dstaddr, protocol, bytes, packets
            | stats sum(bytes) as total_bytes by srcaddr, dstaddr
            """
        )
        
        return {
            "ec2_metrics": ec2_metrics,
            "rds_metrics": rds_metrics,
            "cost_data": cur_data,
            "flow_logs": flow_logs
        }
```

---

## 8. Security and Compliance

### 8.1 Data Security Implementation

```yaml
Encryption:
  At Rest:
    - Database: AES-256 encryption for all databases
    - File Storage: S3 SSE-KMS with customer managed keys
    - Backup: Encrypted snapshots with separate KMS keys
  
  In Transit:
    - API: TLS 1.3 for all HTTPS connections
    - Database: SSL/TLS for all database connections
    - Kafka: SSL encryption with mTLS authentication
    - Service Mesh: Istio with automatic mTLS

Authentication:
  API Layer:
    - OAuth 2.0 with JWT tokens
    - API key management with rotation
    - Rate limiting per client
  
  Service-to-Service:
    - mTLS between all services
    - Service accounts with RBAC
    - Short-lived tokens (15 minutes)
  
  Data Sources:
    - Dedicated service accounts per source
    - Credential vault (HashiCorp Vault)
    - Automatic credential rotation

Data Privacy:
  PII Handling:
    - Automatic PII detection and masking
    - Tokenization for sensitive fields
    - Data retention policies
  
  Audit Logging:
    - All data access logged
    - Immutable audit trail
    - 7-year retention for compliance
  
  GDPR Compliance:
    - Right to be forgotten implementation
    - Data portability APIs
    - Consent management
```

---

## 9. Performance Optimization

### 9.1 Query Optimization Strategies

```sql
-- TimescaleDB: Continuous aggregates for real-time dashboards
CREATE MATERIALIZED VIEW network_latency_5min
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('5 minutes', timestamp) AS bucket,
    source_region,
    dest_region,
    percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms) AS p50,
    percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) AS p95,
    percentile_cont(0.99) WITHIN GROUP (ORDER BY latency_ms) AS p99,
    avg(latency_ms) AS avg_latency,
    count(*) AS sample_count
FROM network_latency
GROUP BY bucket, source_region, dest_region
WITH NO DATA;

-- Add refresh policy
SELECT add_continuous_aggregate_policy('network_latency_5min',
    start_offset => INTERVAL '10 minutes',
    end_offset => INTERVAL '1 minute',
    schedule_interval => INTERVAL '1 minute');

-- Neo4j: Index for dependency queries
CREATE INDEX service_dependency_idx FOR (s:Service) ON (s.name, s.environment);
CREATE INDEX relationship_idx FOR ()-[r:DEPENDS_ON]-() ON (r.strength);

-- PostgreSQL: Partial indexes for recommendations
CREATE INDEX active_recommendations_idx 
ON recommendations (service_id, created_at) 
WHERE status = 'active' AND priority IN ('critical', 'high');
```

### 9.2 Caching Strategy

```python
# Redis caching layer
class CacheService:
    """Multi-level caching strategy"""
    
    def __init__(self):
        self.redis_client = redis.Redis(
            connection_pool=redis.ConnectionPool(
                max_connections=100,
                decode_responses=True
            )
        )
        
        # Cache TTLs by data type
        self.ttl_config = {
            "dashboard_metrics": 30,      # 30 seconds
            "topology_graph": 300,         # 5 minutes
            "recommendations": 3600,        # 1 hour
            "cost_analysis": 1800,         # 30 minutes
            "executive_report": 86400      # 24 hours
        }
    
    async def get_or_compute(
        self,
        key: str,
        compute_func: callable,
        data_type: str = "default"
    ):
        """Get from cache or compute if missing"""
        
        # Try to get from cache
        cached = self.redis_client.get(key)
        if cached:
            return json.loads(cached)
        
        # Compute if not in cache
        result = await compute_func()
        
        # Store in cache with appropriate TTL
        ttl = self.ttl_config.get(data_type, 60)
        self.redis_client.setex(
            key,
            ttl,
            json.dumps(result)
        )
        
        return result
    
    def invalidate_pattern(self, pattern: str):
        """Invalidate all keys matching pattern"""
        
        keys = self.redis_client.keys(pattern)
        if keys:
            self.redis_client.delete(*keys)
```

---

## 10. Monitoring and Observability

### 10.1 Platform Self-Monitoring

```yaml
Metrics Collection:
  Application Metrics:
    - API request rates and latencies
    - Database query performance
    - Cache hit rates
    - Queue depths and processing rates
    
  Infrastructure Metrics:
    - CPU, memory, disk, network utilization
    - Container resource usage
    - Kafka lag and throughput
    - Database connection pools
    
  Business Metrics:
    - Data ingestion rates per source
    - Processing pipeline latencies
    - Alert generation rates
    - User engagement metrics

Distributed Tracing:
  OpenTelemetry Integration:
    - Automatic instrumentation for all services
    - Custom spans for business logic
    - Baggage propagation for context
    - Sampling rate: 10% for normal, 100% for errors

Logging:
  Structured Logging:
    - JSON format for all logs
    - Correlation IDs across services
    - Log levels: DEBUG, INFO, WARN, ERROR, FATAL
    - Automatic PII masking

Alerting:
  Alert Rules:
    - Data ingestion failures
    - Processing pipeline delays > 5 minutes
    - Database connection exhaustion
    - API error rates > 1%
    - Cost anomalies > 20%
```

---

## 11. Disaster Recovery

### 11.1 Backup and Recovery Strategy

```yaml
Backup Strategy:
  Databases:
    Neo4j:
      - Full backup: Daily at 2 AM UTC
      - Incremental: Every 6 hours
      - Retention: 30 days
      
    TimescaleDB:
      - Continuous archiving to S3
      - Point-in-time recovery: 7 days
      - Logical backup: Weekly
      
    PostgreSQL:
      - Streaming replication to standby
      - Daily pg_dump to S3
      - Retention: 90 days
      
    Snowflake:
      - Time Travel: 90 days
      - Fail-safe: Additional 7 days
      - Cross-region replication
      
  Configuration:
    - Git repository for all configs
    - Secrets in HashiCorp Vault
    - Terraform state in S3 with versioning

Recovery Procedures:
  RTO Targets:
    - Critical services: 15 minutes
    - Core platform: 1 hour
    - Full recovery: 4 hours
    
  RPO Targets:
    - Real-time data: 5 minutes
    - Configuration: 0 (git versioned)
    - Historical data: 1 hour
```

---

## 12. Implementation Roadmap

### Phase 1: Foundation (Months 1-2)
- Set up Kafka infrastructure
- Implement DataDog and CloudWatch ingestion
- Deploy TimescaleDB and Neo4j
- Build basic API endpoints
- Create real-time data streaming

### Phase 2: Core Processing (Months 3-4)
- Deploy Flink stream processing
- Implement Spark batch jobs
- Build ML anomaly detection
- Add ServiceNow integration
- Create recommendation engine

### Phase 3: Advanced Features (Months 5-6)
- Complete all data source integrations
- Implement executive reporting
- Add predictive analytics
- Deploy full monitoring
- Performance optimization

---

## Conclusion

This comprehensive data integration architecture provides the foundation for the Ubiquitous platform to ingest, process, and serve data from 8 critical sources to power 10 core capabilities. The architecture emphasizes:

1. **Real-time Processing**: Sub-second latency for critical metrics
2. **Scalability**: Handle millions of events per second
3. **Reliability**: Multiple fallback mechanisms and DR procedures
4. **Security**: End-to-end encryption and compliance
5. **Intelligence**: ML-driven insights and recommendations

The modular design allows for phased implementation while maintaining the ability to scale to full production requirements handling 50,000+ infrastructure nodes and providing real-time intelligence to drive operational excellence.