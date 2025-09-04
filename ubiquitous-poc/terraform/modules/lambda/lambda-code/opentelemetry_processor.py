# OpenTelemetry Data Processor  
# Processes OpenTelemetry trace and metric data for infrastructure intelligence

import json
import os
import logging
import boto3
import base64
from datetime import datetime
from typing import Dict, Any, List

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Kafka client (placeholder)
class KafkaProducer:
    def __init__(self, bootstrap_servers: str):
        self.bootstrap_servers = bootstrap_servers
        logger.info(f"OpenTelemetry Kafka producer initialized for {bootstrap_servers}")
    
    def send(self, topic: str, data: dict):
        logger.info(f"Sending to Kafka topic {topic}: {len(json.dumps(data))} bytes")

def handler(event, context):
    """
    Lambda handler for OpenTelemetry data processing
    
    Processes OTLP (OpenTelemetry Protocol) data from collectors
    Transforms telemetry data for infrastructure intelligence platform
    """
    try:
        environment = os.environ.get('ENVIRONMENT', 'dev')
        kafka_servers = os.environ.get('KAFKA_BOOTSTRAP_SERVERS')
        s3_bucket = os.environ.get('S3_BUCKET')
        
        logger.info(f"Processing OpenTelemetry event in {environment} environment")
        
        # Initialize Kafka producer
        kafka_producer = KafkaProducer(kafka_servers)
        
        # Process telemetry data
        processed_records = []
        
        if 'Records' in event:
            # Kafka event source
            for record in event['Records']:
                kafka_data = json.loads(record['value'])
                processed_data = transform_otel_data(kafka_data)
                processed_records.extend(processed_data)
        else:
            # Direct invocation with OTLP data
            processed_data = transform_otel_data(event)
            processed_records.extend(processed_data)
        
        # Route processed data to appropriate topics
        route_telemetry_data(kafka_producer, processed_records)
        
        # Archive to S3 for audit
        if s3_bucket:
            s3_key = f"opentelemetry/{datetime.now().strftime('%Y/%m/%d/%H')}/{context.aws_request_id}.json"
            archive_to_s3(s3_bucket, s3_key, processed_records)
        
        logger.info(f"Successfully processed {len(processed_records)} OpenTelemetry records")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed_records': len(processed_records),
                'environment': environment,
                'timestamp': datetime.now().isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"ERROR processing OpenTelemetry data: {str(e)}")
        raise

def transform_otel_data(raw_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Transform OpenTelemetry data to Ubiquitous platform schema"""
    
    transformed_records = []
    
    # Process different telemetry data types
    
    # Resource Metrics (infrastructure topology)
    if 'resourceMetrics' in raw_data:
        for resource_metric in raw_data['resourceMetrics']:
            resource = resource_metric.get('resource', {})
            attributes = resource.get('attributes', [])
            
            # Extract resource information
            resource_info = {
                'source': 'opentelemetry',
                'type': 'infrastructure',
                'timestamp': datetime.now().isoformat(),
                'resource': extract_resource_attributes(attributes),
                'instrumentation_scope': resource_metric.get('instrumentationLibraryMetrics', [])
            }
            
            # Process metrics for this resource
            for scope_metric in resource_metric.get('scopeMetrics', []):
                for metric in scope_metric.get('metrics', []):
                    metric_record = transform_metric(metric, resource_info['resource'])
                    transformed_records.append(metric_record)
    
    # Resource Spans (trace data for service dependencies)
    if 'resourceSpans' in raw_data:
        for resource_span in raw_data['resourceSpans']:
            resource = resource_span.get('resource', {})
            attributes = resource.get('attributes', [])
            
            resource_info = extract_resource_attributes(attributes)
            
            for scope_span in resource_span.get('scopeSpans', []):
                for span in scope_span.get('spans', []):
                    span_record = transform_span(span, resource_info)
                    transformed_records.append(span_record)
    
    # Resource Logs (for infrastructure events)
    if 'resourceLogs' in raw_data:
        for resource_log in raw_data['resourceLogs']:
            resource = resource_log.get('resource', {})
            attributes = resource.get('attributes', [])
            
            resource_info = extract_resource_attributes(attributes)
            
            for scope_log in resource_log.get('scopeLogs', []):
                for log_record in scope_log.get('logRecords', []):
                    log_transformed = transform_log(log_record, resource_info)
                    transformed_records.append(log_transformed)
    
    logger.info(f"Transformed {len(transformed_records)} OpenTelemetry records")
    return transformed_records

def extract_resource_attributes(attributes: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Extract resource attributes from OpenTelemetry format"""
    resource = {}
    
    for attr in attributes:
        key = attr.get('key', '')
        value = attr.get('value', {})
        
        # Extract value based on type
        if 'stringValue' in value:
            resource[key] = value['stringValue']
        elif 'intValue' in value:
            resource[key] = int(value['intValue'])
        elif 'doubleValue' in value:
            resource[key] = float(value['doubleValue'])
        elif 'boolValue' in value:
            resource[key] = value['boolValue']
    
    return resource

def transform_metric(metric: Dict[str, Any], resource: Dict[str, Any]) -> Dict[str, Any]:
    """Transform OpenTelemetry metric to platform schema"""
    return {
        'source': 'opentelemetry',
        'type': 'metrics',
        'timestamp': datetime.now().isoformat(),
        'metric_name': metric.get('name', ''),
        'description': metric.get('description', ''),
        'unit': metric.get('unit', ''),
        'resource': resource,
        'data_points': metric.get('sum', metric.get('gauge', metric.get('histogram', {}))),
        'platform_schema_version': '1.0'
    }

def transform_span(span: Dict[str, Any], resource: Dict[str, Any]) -> Dict[str, Any]:
    """Transform OpenTelemetry span to service dependency data"""
    return {
        'source': 'opentelemetry', 
        'type': 'service_dependency',
        'timestamp': datetime.now().isoformat(),
        'trace_id': span.get('traceId', ''),
        'span_id': span.get('spanId', ''),
        'parent_span_id': span.get('parentSpanId', ''),
        'service_name': resource.get('service.name', ''),
        'operation_name': span.get('name', ''),
        'duration_ns': calculate_duration(span),
        'status': span.get('status', {}),
        'attributes': span.get('attributes', []),
        'resource': resource,
        'platform_schema_version': '1.0'
    }

def transform_log(log_record: Dict[str, Any], resource: Dict[str, Any]) -> Dict[str, Any]:
    """Transform OpenTelemetry log to platform event"""
    return {
        'source': 'opentelemetry',
        'type': 'events',
        'timestamp': datetime.now().isoformat(),
        'log_timestamp': log_record.get('timeUnixNano', 0),
        'severity': log_record.get('severityText', 'INFO'),
        'message': log_record.get('body', {}).get('stringValue', ''),
        'resource': resource,
        'attributes': log_record.get('attributes', []),
        'platform_schema_version': '1.0'
    }

def calculate_duration(span: Dict[str, Any]) -> int:
    """Calculate span duration in nanoseconds"""
    start_time = span.get('startTimeUnixNano', 0)
    end_time = span.get('endTimeUnixNano', 0)
    return int(end_time) - int(start_time)

def route_telemetry_data(kafka_producer: KafkaProducer, records: List[Dict[str, Any]]):
    """Route processed telemetry data to appropriate Kafka topics"""
    
    routing_stats = {
        'infrastructure-topology': 0,
        'metrics-timeseries': 0,
        'platform-events': 0,
        'service-dependencies': 0
    }
    
    for record in records:
        record_type = record.get('type', 'generic')
        
        if record_type == 'infrastructure':
            kafka_producer.send('infrastructure-topology', record)
            routing_stats['infrastructure-topology'] += 1
            
        elif record_type == 'metrics':
            kafka_producer.send('metrics-timeseries', record)
            routing_stats['metrics-timeseries'] += 1
            
        elif record_type == 'events':
            kafka_producer.send('platform-events', record)
            routing_stats['platform-events'] += 1
            
        elif record_type == 'service_dependency':
            kafka_producer.send('service-dependencies', record)
            routing_stats['service-dependencies'] += 1
    
    logger.info(f"Routing stats: {routing_stats}")

def archive_to_s3(bucket: str, key: str, data: List[Dict[str, Any]]):
    """Archive processed data to S3 for audit and replay"""
    try:
        s3_client = boto3.client('s3')
        
        archive_data = {
            'source': 'opentelemetry-processor',
            'processed_at': datetime.now().isoformat(),
            'record_count': len(data),
            'records': data
        }
        
        s3_client.put_object(
            Bucket=bucket,
            Key=key,
            Body=json.dumps(archive_data, indent=2),
            ContentType='application/json',
            ServerSideEncryption='aws:kms'
        )
        
        logger.info(f"Archived {len(data)} OpenTelemetry records to s3://{bucket}/{key}")
        
    except Exception as e:
        logger.error(f"Failed to archive to S3: {str(e)}")
        # Don't fail main processing for archival errors