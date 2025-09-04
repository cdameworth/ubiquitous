# DataDog Data Processor
# Processes DataDog API data and transforms for Ubiquitous platform

import json
import os
import logging
import boto3
import time
from datetime import datetime
from typing import Dict, Any, List

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Kafka client (placeholder - requires kafka-python package in deployment)
class KafkaProducer:
    def __init__(self, bootstrap_servers: str):
        self.bootstrap_servers = bootstrap_servers
        logger.info(f"Kafka producer initialized for {bootstrap_servers}")
    
    def send(self, topic: str, data: dict):
        logger.info(f"Sending to Kafka topic {topic}: {len(json.dumps(data))} bytes")

def handler(event, context):
    """
    Lambda handler for DataDog data processing
    
    Processes incoming DataDog webhook events and API responses
    Transforms data for Ubiquitous platform consumption
    """
    try:
        environment = os.environ.get('ENVIRONMENT', 'dev')
        kafka_servers = os.environ.get('KAFKA_BOOTSTRAP_SERVERS')
        s3_bucket = os.environ.get('S3_BUCKET')
        
        logger.info(f"Processing DataDog event in {environment} environment")
        logger.info(f"Event type: {event.get('Records', [{}])[0].get('eventName', 'direct_invoke')}")
        
        # Initialize Kafka producer
        kafka_producer = KafkaProducer(kafka_servers)
        
        # Process event data
        processed_records = []
        
        if 'Records' in event:
            # Kafka event source
            for record in event['Records']:
                kafka_data = json.loads(record['value'])
                processed_data = transform_datadog_data(kafka_data)
                processed_records.append(processed_data)
        else:
            # Direct API invocation
            processed_data = transform_datadog_data(event)
            processed_records.append(processed_data)
        
        # Send transformed data to output topics
        for record in processed_records:
            # Infrastructure topology updates
            if record.get('type') == 'infrastructure':
                kafka_producer.send('infrastructure-topology', record)
            
            # Metrics for time-series storage
            if record.get('type') == 'metrics':
                kafka_producer.send('metrics-timeseries', record)
            
            # Events for incident correlation
            if record.get('type') == 'events':
                kafka_producer.send('platform-events', record)
        
        # Archive raw data to S3
        if s3_bucket:
            s3_key = f"datadog/{datetime.now().strftime('%Y/%m/%d/%H')}/{context.aws_request_id}.json"
            archive_to_s3(s3_bucket, s3_key, processed_records)
        
        logger.info(f"Successfully processed {len(processed_records)} DataDog records")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed_records': len(processed_records),
                'environment': environment,
                'timestamp': datetime.now().isoformat()
            })
        }
        
    except Exception as e:
        logger.error(f"ERROR processing DataDog data: {str(e)}")
        raise

def transform_datadog_data(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """Transform DataDog data to Ubiquitous platform schema"""
    
    transformed = {
        'source': 'datadog',
        'timestamp': datetime.now().isoformat(),
        'platform_schema_version': '1.0',
        'raw_data_size': len(json.dumps(raw_data))
    }
    
    # Detect data type and transform accordingly
    if 'series' in raw_data and isinstance(raw_data['series'], list):
        # Metrics data
        transformed['type'] = 'metrics'
        transformed['metrics'] = []
        
        for series in raw_data['series']:
            metric = {
                'name': series.get('metric', ''),
                'host': series.get('host', ''),
                'tags': series.get('tags', []),
                'points': series.get('points', []),
                'unit': series.get('unit', ''),
                'metadata': series.get('metadata', {})
            }
            transformed['metrics'].append(metric)
    
    elif 'title' in raw_data and 'text' in raw_data:
        # Event data
        transformed['type'] = 'events'
        transformed['event'] = {
            'title': raw_data['title'],
            'text': raw_data['text'],
            'tags': raw_data.get('tags', []),
            'priority': raw_data.get('priority', 'normal'),
            'source_type': raw_data.get('source_type_name', 'custom'),
            'date_happened': raw_data.get('date_happened', time.time())
        }
    
    elif 'hosts' in raw_data or 'containers' in raw_data:
        # Infrastructure data
        transformed['type'] = 'infrastructure'
        transformed['infrastructure'] = {
            'hosts': raw_data.get('hosts', []),
            'containers': raw_data.get('containers', []),
            'services': raw_data.get('services', []),
            'discovery_timestamp': datetime.now().isoformat()
        }
    
    else:
        # Generic data
        transformed['type'] = 'generic'
        transformed['data'] = raw_data
    
    logger.info(f"Transformed DataDog {transformed['type']} data: {transformed.get('metrics', transformed.get('event', {}).get('title', 'generic'))}")
    
    return transformed

def archive_to_s3(bucket: str, key: str, data: List[Dict[str, Any]]):
    """Archive processed data to S3 for audit and replay"""
    try:
        s3_client = boto3.client('s3')
        
        archive_data = {
            'source': 'datadog-processor',
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
        
        logger.info(f"Archived {len(data)} records to s3://{bucket}/{key}")
        
    except Exception as e:
        logger.error(f"Failed to archive to S3: {str(e)}")
        # Don't fail the main processing for archival errors