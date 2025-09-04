from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import random
import uuid

router = APIRouter(prefix="/api/greenfield", tags=["Greenfield App Planning"])

@router.get("/architecture-recommendations")
async def get_architecture_recommendations(
    app_type: str = Query(..., description="Type of application: web, api, mobile, data_processing, ml"),
    scale: str = Query("medium", description="Expected scale: small, medium, large, enterprise"),
    requirements: Optional[str] = Query(None, description="Specific requirements (comma-separated)")
):
    """Support for new application architecture decisions"""
    
    valid_app_types = ["web", "api", "mobile", "data_processing", "ml"]
    if app_type not in valid_app_types:
        raise HTTPException(status_code=400, detail="Invalid app_type")
    
    # Base architecture patterns
    architecture_patterns = {
        "web": {
            "frontend": ["React", "Vue.js", "Angular"],
            "backend": ["Node.js", "Python FastAPI", "Java Spring Boot"],
            "database": ["PostgreSQL", "MySQL", "MongoDB"],
            "cache": ["Redis", "Memcached"],
            "deployment": ["Docker", "Kubernetes", "Serverless"]
        },
        "api": {
            "framework": ["FastAPI", "Express.js", "Spring Boot", "ASP.NET Core"],
            "database": ["PostgreSQL", "MySQL", "DynamoDB"],
            "cache": ["Redis", "ElastiCache"],
            "auth": ["JWT", "OAuth2", "Auth0"],
            "deployment": ["EKS", "Lambda", "ECS"]
        },
        "mobile": {
            "approach": ["React Native", "Flutter", "Native iOS/Android"],
            "backend": ["Node.js API", "Python FastAPI", "Firebase"],
            "database": ["Firestore", "PostgreSQL", "DynamoDB"],
            "auth": ["Firebase Auth", "Auth0", "Cognito"],
            "push_notifications": ["FCM", "APNS", "AWS SNS"]
        },
        "data_processing": {
            "processing": ["Apache Spark", "Apache Flink", "Apache Beam"],
            "storage": ["S3", "HDFS", "Snowflake"],
            "orchestration": ["Airflow", "Prefect", "Step Functions"],
            "monitoring": ["DataDog", "CloudWatch", "Grafana"],
            "compute": ["EMR", "Databricks", "EKS"]
        },
        "ml": {
            "framework": ["TensorFlow", "PyTorch", "Scikit-learn"],
            "deployment": ["SageMaker", "MLflow", "Kubeflow"],
            "data": ["S3", "Snowflake", "Feature Store"],
            "compute": ["GPU instances", "SageMaker", "EKS with GPU"],
            "monitoring": ["MLflow", "Weights & Biases", "Neptune"]
        }
    }
    
    base_pattern = architecture_patterns[app_type]
    
    # Scale-based adjustments
    scale_configs = {
        "small": {
            "compute": "Single instance or serverless",
            "database": "Managed service, single instance",
            "caching": "Optional, in-memory cache",
            "load_balancing": "Application Load Balancer",
            "monitoring": "Basic CloudWatch metrics"
        },
        "medium": {
            "compute": "Auto-scaling group with 2-5 instances",
            "database": "Multi-AZ deployment with read replicas",
            "caching": "Redis cluster with replication",
            "load_balancing": "ALB with multiple targets",
            "monitoring": "Enhanced monitoring and alerting"
        },
        "large": {
            "compute": "Kubernetes cluster with horizontal scaling",
            "database": "Clustered database with sharding",
            "caching": "Distributed cache with clustering",
            "load_balancing": "Multi-region load balancing",
            "monitoring": "Comprehensive observability stack"
        },
        "enterprise": {
            "compute": "Multi-region Kubernetes with service mesh",
            "database": "Global database with multi-master replication",
            "caching": "Global cache distribution",
            "load_balancing": "Global traffic management",
            "monitoring": "Enterprise observability and APM"
        }
    }
    
    scale_config = scale_configs[scale]
    
    # Generate specific recommendations
    recommendations = {
        "architecture_overview": {
            "pattern": app_type.replace("_", " ").title() + " Application",
            "scale": scale,
            "deployment_model": random.choice(["cloud-native", "hybrid", "multi-cloud"]),
            "estimated_complexity": random.choice(["low", "medium", "high", "very_high"])
        },
        "technology_stack": base_pattern,
        "infrastructure": scale_config,
        "security_recommendations": [
            {
                "category": "authentication",
                "recommendation": "Implement OAuth2/OIDC with JWT tokens",
                "priority": "high",
                "tools": ["Auth0", "Keycloak", "AWS Cognito"]
            },
            {
                "category": "network_security", 
                "recommendation": "Use VPC with private subnets and NAT gateways",
                "priority": "high",
                "tools": ["AWS VPC", "Network ACLs", "Security Groups"]
            },
            {
                "category": "data_encryption",
                "recommendation": "Encrypt data at rest and in transit",
                "priority": "high", 
                "tools": ["TLS 1.3", "KMS", "Database encryption"]
            },
            {
                "category": "secrets_management",
                "recommendation": "Use dedicated secrets management service",
                "priority": "medium",
                "tools": ["AWS Secrets Manager", "HashiCorp Vault", "Azure Key Vault"]
            }
        ],
        "performance_considerations": [
            {
                "aspect": "caching_strategy",
                "recommendation": "Implement multi-layer caching",
                "details": "Application-level, database query, and CDN caching",
                "expected_improvement": "70-90% response time reduction"
            },
            {
                "aspect": "database_optimization",
                "recommendation": "Use read replicas and connection pooling",
                "details": "Separate read/write workloads, optimize query performance",
                "expected_improvement": "50-80% database load reduction"
            },
            {
                "aspect": "auto_scaling",
                "recommendation": "Implement predictive auto-scaling",
                "details": "Scale based on traffic patterns and resource utilization",
                "expected_improvement": "30-50% cost optimization"
            }
        ],
        "estimated_costs": {
            "development_phase": {
                "duration_months": random.randint(3, 12),
                "team_size": random.randint(3, 12),
                "estimated_cost": random.randint(200000, 2000000)
            },
            "operational_monthly": {
                "infrastructure": random.randint(1000, 50000),
                "monitoring": random.randint(500, 5000),
                "security": random.randint(300, 3000),
                "total": random.randint(1800, 58000)
            }
        },
        "risk_assessment": [
            {
                "risk": "Technology adoption complexity",
                "probability": random.choice(["low", "medium", "high"]),
                "impact": random.choice(["low", "medium", "high"]),
                "mitigation": "Proof of concept and team training"
            },
            {
                "risk": "Scalability bottlenecks", 
                "probability": "medium",
                "impact": "high",
                "mitigation": "Load testing and performance monitoring"
            },
            {
                "risk": "Vendor lock-in",
                "probability": random.choice(["low", "medium"]),
                "impact": "medium", 
                "mitigation": "Use open standards and portable technologies"
            }
        ]
    }
    
    # Add requirement-specific recommendations
    if requirements:
        req_list = [req.strip().lower() for req in requirements.split(",")]
        specific_recs = []
        
        for req in req_list:
            if "real-time" in req or "streaming" in req:
                specific_recs.append({
                    "requirement": req,
                    "technology": "Apache Kafka + WebSockets",
                    "implementation": "Event-driven architecture with message queues"
                })
            elif "ai" in req or "ml" in req:
                specific_recs.append({
                    "requirement": req,
                    "technology": "TensorFlow Serving + MLflow",
                    "implementation": "ML pipeline with model versioning and A/B testing"
                })
            elif "mobile" in req:
                specific_recs.append({
                    "requirement": req,
                    "technology": "React Native + Firebase",
                    "implementation": "Cross-platform mobile app with cloud backend"
                })
        
        if specific_recs:
            recommendations["requirement_specific"] = specific_recs
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "app_type": app_type,
        "scale": scale,
        "requirements": requirements.split(",") if requirements else [],
        "recommendations": recommendations
    }

@router.get("/technology-comparison")
async def get_technology_comparison(
    category: str = Query(..., description="Technology category: database, framework, cloud, deployment"),
    use_case: Optional[str] = Query(None, description="Specific use case context")
):
    """Compare technology options for specific architectural components"""
    
    comparisons = {
        "database": [
            {
                "name": "PostgreSQL",
                "type": "Relational",
                "pros": ["ACID compliance", "Rich feature set", "Strong community", "JSON support"],
                "cons": ["Vertical scaling limits", "Complex replication", "Memory usage"],
                "use_cases": ["Transactional apps", "Complex queries", "Data integrity critical"],
                "cost_rating": 4,  # 1-5 scale
                "performance_rating": 4,
                "learning_curve": 3,
                "scalability_rating": 3
            },
            {
                "name": "MongoDB", 
                "type": "Document",
                "pros": ["Flexible schema", "Horizontal scaling", "Developer friendly", "Built-in replication"],
                "cons": ["Memory hungry", "Limited transactions", "Query complexity"],
                "use_cases": ["Content management", "Rapid prototyping", "Flexible data models"],
                "cost_rating": 3,
                "performance_rating": 4,
                "learning_curve": 4,
                "scalability_rating": 5
            },
            {
                "name": "DynamoDB",
                "type": "NoSQL",
                "pros": ["Fully managed", "Auto-scaling", "Consistent performance", "AWS integration"],
                "cons": ["Vendor lock-in", "Complex pricing", "Limited query flexibility"],
                "use_cases": ["Serverless apps", "Gaming", "IoT applications"],
                "cost_rating": 2,
                "performance_rating": 5,
                "learning_curve": 3,
                "scalability_rating": 5
            }
        ],
        "framework": [
            {
                "name": "FastAPI",
                "language": "Python",
                "pros": ["High performance", "Auto documentation", "Type hints", "Async support"],
                "cons": ["Python ecosystem", "Newer framework", "Limited middleware"],
                "use_cases": ["APIs", "Data science", "Rapid development"],
                "cost_rating": 5,
                "performance_rating": 5,
                "learning_curve": 4,
                "scalability_rating": 4
            },
            {
                "name": "Express.js",
                "language": "JavaScript",
                "pros": ["Mature ecosystem", "Flexible", "Large community", "NPM packages"],
                "cons": ["Single threaded", "Callback complexity", "Security concerns"],
                "use_cases": ["Web apps", "REST APIs", "Real-time apps"],
                "cost_rating": 5,
                "performance_rating": 3,
                "learning_curve": 4,
                "scalability_rating": 3
            },
            {
                "name": "Spring Boot",
                "language": "Java",
                "pros": ["Enterprise ready", "Rich ecosystem", "Strong typing", "Production features"],
                "cons": ["Complex setup", "Memory usage", "Learning curve"],
                "use_cases": ["Enterprise apps", "Microservices", "Complex systems"],
                "cost_rating": 3,
                "performance_rating": 4,
                "learning_curve": 2,
                "scalability_rating": 5
            }
        ],
        "cloud": [
            {
                "name": "AWS",
                "pros": ["Largest provider", "Comprehensive services", "Global reach", "Mature platform"],
                "cons": ["Complex pricing", "Vendor lock-in", "Learning curve", "Cost can escalate"],
                "use_cases": ["Enterprise", "Startups", "Global applications"],
                "cost_rating": 2,
                "performance_rating": 5,
                "learning_curve": 2,
                "scalability_rating": 5
            },
            {
                "name": "Google Cloud",
                "pros": ["Strong ML/AI", "Competitive pricing", "Kubernetes native", "Data analytics"],
                "cons": ["Smaller ecosystem", "Less enterprise adoption", "Regional limitations"],
                "use_cases": ["Data science", "ML applications", "Kubernetes workloads"],
                "cost_rating": 4,
                "performance_rating": 4,
                "learning_curve": 3,
                "scalability_rating": 4
            },
            {
                "name": "Azure",
                "pros": ["Microsoft integration", "Hybrid cloud", "Enterprise focus", "Strong support"],
                "cons": ["Complex interface", "Windows-centric", "Pricing complexity"],
                "use_cases": ["Microsoft shops", "Enterprise", "Hybrid scenarios"],
                "cost_rating": 3,
                "performance_rating": 4,
                "learning_curve": 3,
                "scalability_rating": 4
            }
        ],
        "deployment": [
            {
                "name": "Kubernetes",
                "pros": ["Container orchestration", "Auto-scaling", "Self-healing", "Portable"],
                "cons": ["Complex setup", "Resource overhead", "Learning curve", "Operational burden"],
                "use_cases": ["Microservices", "Multi-cloud", "Complex applications"],
                "cost_rating": 2,
                "performance_rating": 4,
                "learning_curve": 1,
                "scalability_rating": 5
            },
            {
                "name": "Docker Compose",
                "pros": ["Simple setup", "Developer friendly", "Version control", "Local development"],
                "cons": ["Single host", "No orchestration", "Limited scaling", "Not production-ready"],
                "use_cases": ["Development", "Small applications", "Prototyping"],
                "cost_rating": 5,
                "performance_rating": 3,
                "learning_curve": 5,
                "scalability_rating": 1
            },
            {
                "name": "Serverless",
                "pros": ["No infrastructure", "Auto-scaling", "Pay per use", "Fast deployment"],
                "cons": ["Cold starts", "Vendor lock-in", "Limited runtime", "Debugging challenges"],
                "use_cases": ["Event-driven", "APIs", "Batch processing"],
                "cost_rating": 4,
                "performance_rating": 3,
                "learning_curve": 4,
                "scalability_rating": 5
            }
        ]
    }
    
    if category not in comparisons:
        raise HTTPException(status_code=400, detail="Invalid category")
    
    options = comparisons[category]
    
    # Add scoring and recommendations
    for option in options:
        option["overall_score"] = (
            option["cost_rating"] + 
            option["performance_rating"] + 
            option["learning_curve"] + 
            option["scalability_rating"]
        ) / 4
        
        # Add contextual recommendation
        if use_case:
            if use_case.lower() in " ".join(option["use_cases"]).lower():
                option["recommended_for_use_case"] = True
                option["recommendation_reason"] = f"Well-suited for {use_case} based on typical use cases"
            else:
                option["recommended_for_use_case"] = False
        else:
            option["recommended_for_use_case"] = None
    
    # Sort by overall score
    options.sort(key=lambda x: x["overall_score"], reverse=True)
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "category": category,
        "use_case": use_case,
        "comparison": {
            "total_options": len(options),
            "evaluation_criteria": ["cost", "performance", "learning_curve", "scalability"],
            "top_recommendation": options[0]["name"],
            "options": options
        },
        "decision_matrix": {
            "best_for_cost": max(options, key=lambda x: x["cost_rating"])["name"],
            "best_for_performance": max(options, key=lambda x: x["performance_rating"])["name"],
            "easiest_to_learn": max(options, key=lambda x: x["learning_curve"])["name"],
            "most_scalable": max(options, key=lambda x: x["scalability_rating"])["name"]
        }
    }

@router.get("/best-practices")
async def get_best_practices(
    domain: str = Query(..., description="Domain: security, performance, scalability, monitoring, testing"),
    app_type: Optional[str] = Query(None, description="Application type for context")
):
    """Architecture and development best practices"""
    
    practices = {
        "security": [
            {
                "category": "Authentication & Authorization",
                "practices": [
                    "Implement OAuth2/OIDC for authentication",
                    "Use JWT tokens with short expiration times",
                    "Implement role-based access control (RBAC)",
                    "Never store credentials in code or config files"
                ]
            },
            {
                "category": "Data Protection",
                "practices": [
                    "Encrypt data at rest and in transit (TLS 1.3+)",
                    "Use strong key management (KMS, Vault)",
                    "Implement data masking for sensitive information",
                    "Regular security audits and penetration testing"
                ]
            },
            {
                "category": "Network Security",
                "practices": [
                    "Use private subnets and VPCs",
                    "Implement defense in depth with multiple security layers",
                    "Regular security patching and updates",
                    "Monitor and log all security events"
                ]
            }
        ],
        "performance": [
            {
                "category": "Application Performance",
                "practices": [
                    "Implement caching at multiple layers",
                    "Use connection pooling for databases",
                    "Optimize database queries and indexing",
                    "Implement asynchronous processing where possible"
                ]
            },
            {
                "category": "Frontend Performance",
                "practices": [
                    "Minimize and compress static assets",
                    "Use CDN for global content delivery",
                    "Implement lazy loading for images and components",
                    "Optimize critical rendering path"
                ]
            },
            {
                "category": "Backend Performance",
                "practices": [
                    "Profile application performance regularly",
                    "Use appropriate data structures and algorithms",
                    "Implement request/response compression",
                    "Monitor and optimize memory usage"
                ]
            }
        ],
        "scalability": [
            {
                "category": "Horizontal Scaling",
                "practices": [
                    "Design stateless applications",
                    "Use microservices architecture for complex systems",
                    "Implement auto-scaling based on metrics",
                    "Use load balancers with health checks"
                ]
            },
            {
                "category": "Database Scaling",
                "practices": [
                    "Implement read replicas for read-heavy workloads",
                    "Consider sharding for large datasets",
                    "Use appropriate indexing strategies",
                    "Implement database connection pooling"
                ]
            },
            {
                "category": "Caching Strategies",
                "practices": [
                    "Implement Redis or Memcached for session storage",
                    "Use application-level caching for frequently accessed data",
                    "Implement cache invalidation strategies",
                    "Consider CDN for static content"
                ]
            }
        ],
        "monitoring": [
            {
                "category": "Application Monitoring",
                "practices": [
                    "Implement structured logging with correlation IDs",
                    "Use distributed tracing for microservices",
                    "Monitor business metrics, not just technical metrics",
                    "Set up proactive alerting with appropriate thresholds"
                ]
            },
            {
                "category": "Infrastructure Monitoring",
                "practices": [
                    "Monitor CPU, memory, disk, and network metrics",
                    "Implement health checks for all services",
                    "Use synthetic monitoring for critical user journeys",
                    "Monitor external dependencies and third-party services"
                ]
            },
            {
                "category": "Performance Monitoring",
                "practices": [
                    "Track response times and error rates",
                    "Monitor database query performance",
                    "Implement APM (Application Performance Monitoring)",
                    "Set up real user monitoring (RUM)"
                ]
            }
        ],
        "testing": [
            {
                "category": "Test Strategy",
                "practices": [
                    "Implement test pyramid: unit > integration > e2e",
                    "Achieve at least 80% code coverage for critical paths",
                    "Use test-driven development (TDD) for complex logic",
                    "Implement contract testing for API boundaries"
                ]
            },
            {
                "category": "Quality Assurance",
                "practices": [
                    "Use static code analysis and linting",
                    "Implement continuous integration/deployment (CI/CD)",
                    "Perform load testing before production releases",
                    "Use feature flags for safe deployments"
                ]
            },
            {
                "category": "Testing Environments",
                "practices": [
                    "Maintain staging environment that mirrors production",
                    "Use containerization for consistent test environments",
                    "Implement database seeding for test data",
                    "Test disaster recovery procedures regularly"
                ]
            }
        ]
    }
    
    if domain not in practices:
        raise HTTPException(status_code=400, detail="Invalid domain")
    
    domain_practices = practices[domain]
    
    # Add implementation examples based on app type
    if app_type:
        for category in domain_practices:
            category["implementation_examples"] = []
            if app_type == "web" and domain == "performance":
                category["implementation_examples"] = [
                    "Use React.memo() for expensive components",
                    "Implement service worker for caching",
                    "Use webpack bundle splitting"
                ]
            elif app_type == "api" and domain == "security":
                category["implementation_examples"] = [
                    "Implement rate limiting with Redis",
                    "Use helmet.js for security headers",
                    "Validate all input with joi or similar"
                ]
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "domain": domain,
        "app_type": app_type,
        "best_practices": {
            "categories": len(domain_practices),
            "total_practices": sum(len(cat["practices"]) for cat in domain_practices),
            "practices": domain_practices
        },
        "implementation_checklist": [
            practice
            for category in domain_practices
            for practice in category["practices"]
        ]
    }