# Ubiquitous Wizard of Oz MVP - Claude Execution Plan
## Transforming Basic React Shell to Executive-Ready Demo Platform

**Document Version:** 1.0  
**Date:** August 30, 2025  
**Execution Method:** Claude Code Sessions Only  
**Total Timeline:** 15-20 Claude Sessions (6 weeks)  
**Goal:** Create convincing CIO-ready demo showcasing $41.6M annual value

---

## Executive Summary

This plan outlines how to transform the current basic React application into a **Wizard of Oz MVP** that looks and feels like the full $28M Ubiquitous platform described in ubiquitous-solution.md. Using synthetic data generation and strategic UI development, we'll create a compelling demo that can sell the vision to executive leadership while being fully executable via Docker/Kubernetes locally.

**Key Strategy:**
- **Frontend First:** Build the impressive UI/UX from ubiquitous-solution.md wireframes
- **Synthetic at Scale:** Generate realistic data simulating 50,000+ nodes
- **Smart Facades:** Create convincing but lightweight backend responses
- **Executive Focus:** Prioritize features that demonstrate ROI and value
- **Demo-Driven:** Build specific scenarios that showcase $41.6M in savings

---

## 1. Current State vs Target Vision

### What We Have Now
```
ubiquitous-poc/
├── frontend/          # Basic React shell with placeholder pages
├── backend/           # FastAPI with 72 endpoints (mostly mocked)
├── datagen/          # Basic data generation
├── docker-compose.yml # 7 containers configured
└── k8s/              # Kubernetes manifests ready
```

### What We Need for CIO Demo
Based on ubiquitous-solution.md, we need to showcase:

1. **Infrastructure Dependency Graph** - 50,000+ nodes with real-time updates
2. **Executive Value Reporting** - Multi-tier ROI analytics ($41.6M savings)
3. **Security Command Center** - Vulnerability heat maps and threat visualization
4. **FinOps Dashboard** - Cost optimization with Terraform code generation
5. **Incident Command Center** - Real-time telemetry correlation
6. **Network Protocol Analysis** - Geographic latency heatmaps
7. **Greenfield Planning Assistant** - Architecture recommendations
8. **ARB Decision Support** - Automated documentation and risk scoring

---

## 2. Docker Architecture for Wizard of Oz MVP

### Container Strategy
```yaml
# Enhanced docker-compose.yml structure
services:
  # 1. Frontend - The Star of the Show
  frontend:
    image: ubiquitous-frontend:mvp
    features:
      - React 18 with Vite
      - Cytoscape.js for 50K node graphs
      - D3.js for executive charts
      - Chart.js for real-time metrics
      - Socket.io for live updates
    ports: ["3000:3000"]
  
  # 2. API Backend - Smart Facade
  backend:
    image: ubiquitous-api:mvp
    features:
      - FastAPI with 100+ endpoints
      - GraphQL for complex queries
      - WebSocket for real-time
      - Synthetic response generation
    ports: ["8000:8000"]
  
  # 3. Graph Database - Simulated Scale
  neo4j:
    image: neo4j:5.13
    environment:
      - NEO4J_PLUGINS=["apoc", "graph-data-science"]
    data:
      - 50,000 infrastructure nodes
      - 500,000 relationships
      - Pre-computed queries
  
  # 4. Time-Series DB - Metrics Theater
  timescaledb:
    image: timescale/timescaledb:latest
    data:
      - 90 days of metrics
      - 1-second granularity
      - Pre-aggregated views
  
  # 5. Data Generator - The Magic Maker
  datagen:
    image: ubiquitous-datagen:mvp
    features:
      - Realistic infrastructure topology
      - Business-hours patterns
      - Incident simulation
      - Cost fluctuation modeling
  
  # 6. Cache - Performance Illusion
  redis:
    image: redis:7-alpine
    purpose:
      - Pre-computed graph layouts
      - Executive report caching
      - WebSocket state
  
  # 7. Nginx - Professional Polish
  nginx:
    image: nginx:alpine
    features:
      - SSL termination
      - Response compression
      - Static asset caching
```

---

## 3. Claude Session Execution Plan

### Phase 1: Foundation (Sessions 1-4)

#### Session 1: Enhanced Data Generator
**Goal:** Create sophisticated synthetic data that simulates Capital Group scale

```python
# datagen/infrastructure_generator.py
class InfrastructureGenerator:
    def generate_topology(self):
        # Generate 50,000 nodes across:
        # - 5 data centers
        # - 200 applications
        # - 1,500 microservices
        # - 8,000 containers
        # - 15,000 VMs
        # - 20,000+ network devices
        
    def generate_relationships(self):
        # Create 500,000 realistic dependencies
        # - Service-to-service
        # - Database connections
        # - Load balancer mappings
        # - Security zones
        
    def generate_metrics(self):
        # 90 days of time-series data
        # - CPU, memory, disk, network
        # - Request rates, error rates
        # - Latency distributions
        # - Cost allocations
```

**Deliverables:**
- [ ] Generate Capital Group-scale topology
- [ ] Create realistic metric patterns
- [ ] Implement incident scenarios
- [ ] Build cost model with savings opportunities

#### Session 2: Cytoscape Graph Visualization
**Goal:** Build the impressive 50K node infrastructure graph

```typescript
// frontend/src/components/InfrastructureGraph.tsx
const InfrastructureGraph = () => {
  // Cytoscape configuration for massive graphs
  const cytoscapeConfig = {
    layout: {
      name: 'fcose', // Fast Compound Spring Embedder
      quality: 'proof', // Optimized for large graphs
      animate: false,
      randomize: false,
      nodeRepulsion: 4500,
      idealEdgeLength: 50,
      edgeElasticity: 0.45,
      nestingFactor: 0.1
    },
    style: [
      {
        selector: 'node',
        style: {
          'background-color': 'data(color)',
          'label': 'data(label)',
          'width': 'mapData(importance, 0, 10, 20, 60)',
          'height': 'mapData(importance, 0, 10, 20, 60)'
        }
      }
    ],
    performance: {
      motionBlur: true,
      wheelSensitivity: 0.1,
      pixelRatio: 'auto'
    }
  };
};
```

**Deliverables:**
- [ ] Implement Cytoscape with WebGL renderer
- [ ] Create multi-level zoom with LOD
- [ ] Add real-time status updates
- [ ] Build interactive filtering

#### Session 3: Executive Value Dashboard
**Goal:** Create the CIO/CEO dashboard showing $41.6M in value

```typescript
// frontend/src/components/ExecutiveValueReport.tsx
const ExecutiveValueReport = () => {
  // Multi-tier reporting with impressive visualizations
  const valueMetrics = {
    quarterly: {
      savings: '$15.2M',
      ytdSavings: '$41.8M',
      roi: '149%',
      payback: '18 months'
    },
    categories: [
      { name: 'Incident Reduction', value: 18.2, detail: '35% MTTR improvement' },
      { name: 'Cloud Optimization', value: 12.1, detail: '22% cost reduction' },
      { name: 'Security Prevention', value: 9.1, detail: '1.5 breaches avoided' },
      { name: 'Developer Productivity', value: 10.3, detail: '42% efficiency gain' }
    ]
  };
};
```

**Deliverables:**
- [ ] Build executive summary dashboard
- [ ] Create ROI trend visualizations
- [ ] Implement value source breakdown
- [ ] Add drill-down capabilities

#### Session 4: Demo Scenario Engine
**Goal:** Create scripted scenarios that showcase key value propositions

```python
# backend/demo_scenarios.py
class DemoScenarioEngine:
    scenarios = {
        'cloud_cost_spiral': {
            'duration': '4 minutes',
            'savings': '$780K/month',
            'story': 'Detect and fix 40% AWS bill increase'
        },
        'security_breach_prevention': {
            'duration': '3 minutes',
            'savings': '$6.08M',
            'story': 'Prevent critical vulnerability exploitation'
        },
        'outage_prevention': {
            'duration': '5 minutes',
            'savings': '$2.1M',
            'story': 'Predict and prevent trading system outage'
        }
    }
    
    def play_scenario(self, scenario_id):
        # Orchestrate frontend updates
        # Trigger metric changes
        # Show resolution path
        # Calculate and display savings
```

**Deliverables:**
- [ ] Implement 4 key demo scenarios
- [ ] Create WebSocket orchestration
- [ ] Build narrative progression
- [ ] Add value realization tracking

### Phase 2: Core Capabilities (Sessions 5-10)

#### Session 5: Security Command Center
**Goal:** Build threat visualization that impresses security-conscious executives

```typescript
// frontend/src/components/SecurityCommandCenter.tsx
const SecurityCommandCenter = () => {
  // Impressive security visualizations
  return (
    <div className="security-command-center">
      <ThreatLevelIndicator level="MEDIUM" activeThreats={3} />
      <VulnerabilityHeatMap data={vulnerabilityData} />
      <AttackSurfaceVisualization topology={networkTopology} />
      <ComplianceStatusDashboard frameworks={['PCI', 'SOX', 'GDPR']} />
    </div>
  );
};
```

**Deliverables:**
- [ ] Create vulnerability heat map
- [ ] Build attack surface visualization
- [ ] Implement compliance tracking
- [ ] Add real-time threat updates

#### Session 6: FinOps Cost Optimization
**Goal:** Demonstrate concrete cost savings with IaC integration

```typescript
// frontend/src/components/FinOpsAnalyzer.tsx
const FinOpsAnalyzer = () => {
  // Show real Terraform code for optimization
  const terraformRecommendations = [
    {
      title: 'Rightsize EC2 Instances',
      savings: '$342K/month',
      terraform: `
        - instance_type = "m5.4xlarge"
        + instance_type = "m5.2xlarge"
      `
    },
    {
      title: 'Implement Spot Instances',
      savings: '$198K/month',
      terraform: `
        + spot_price = "0.0464"
        + spot_type  = "persistent"
      `
    }
  ];
};
```

**Deliverables:**
- [ ] Build cost analysis dashboard
- [ ] Generate Terraform recommendations
- [ ] Create savings calculator
- [ ] Add one-click optimization

#### Session 7: Incident Command Center
**Goal:** Real-time incident correlation that shows platform intelligence

```typescript
// frontend/src/components/IncidentCommandCenter.tsx
const IncidentCommandCenter = () => {
  // Real-time telemetry correlation
  const incidentData = {
    status: 'ACTIVE',
    service: 'API Gateway',
    impact: '45K users',
    blastRadius: ['Auth Service', 'User Service', 'Payment API'],
    telemetry: {
      cpu: 98,
      memory: 87,
      requests: '12K/s → 3K/s',
      errors: '0.1% → 45%',
      latency: '45ms → 2300ms'
    },
    timeline: [
      '14:20 - Cache invalidation detected',
      '14:21 - Memory pressure increase',
      '14:23 - Cascading failures begin',
      '14:24 - Auto-scaling triggered'
    ]
  };
};
```

**Deliverables:**
- [ ] Create incident visualization
- [ ] Build service dependency tree
- [ ] Implement timeline reconstruction
- [ ] Add automated remediation

#### Session 8: Network Protocol Analysis
**Goal:** Geographic visualization showing global infrastructure

```typescript
// frontend/src/components/NetworkAnalysis.tsx
const NetworkProtocolAnalysis = () => {
  // Geographic latency visualization
  const latencyMap = {
    datacenters: [
      { location: 'Virginia', lat: 38.7, lng: -77.4, latency: 0 },
      { location: 'Oregon', lat: 45.5, lng: -122.6, latency: 67 },
      { location: 'Ireland', lat: 53.3, lng: -6.2, latency: 89 },
      { location: 'Singapore', lat: 1.3, lng: 103.8, latency: 234 }
    ]
  };
};
```

**Deliverables:**
- [ ] Build geographic heat map
- [ ] Create latency visualization
- [ ] Add protocol analysis
- [ ] Implement hop tracing

#### Session 9: Greenfield Planning Assistant
**Goal:** AI-powered recommendations that save architecture time

```typescript
// frontend/src/components/GreenFieldPlanning.tsx
const GreenFieldPlanning = () => {
  // Architecture recommendations based on similar workloads
  const recommendations = {
    stack: ['Node.js 18', 'PostgreSQL RDS', 'Redis Cluster', 'AWS Lambda'],
    sizing: {
      web: '4x m5.xlarge',
      app: '6x m5.2xlarge',
      db: 'db.r5.2xlarge Multi-AZ'
    },
    cost: {
      dev: '$1.2K/mo',
      qa: '$2.4K/mo',
      prod: '$8.7K/mo'
    },
    compliance: ['PCI DSS', 'SOX', 'Data Encryption'],
    observability: ['DataDog APM', 'CloudWatch', 'OpenTelemetry']
  };
};
```

**Deliverables:**
- [ ] Create planning wizard UI
- [ ] Build recommendation engine
- [ ] Generate IaC templates
- [ ] Add cost projections

#### Session 10: Performance & Polish
**Goal:** Optimize for impressive demo performance

**Deliverables:**
- [ ] Implement lazy loading
- [ ] Add smooth animations
- [ ] Create loading states
- [ ] Polish UI/UX details

### Phase 3: Demo Excellence (Sessions 11-15)

#### Session 11: Demo Mode & Presenter View
**Goal:** Create presenter-friendly demo features

```typescript
// frontend/src/components/DemoMode.tsx
const DemoMode = () => {
  // Presenter controls
  const controls = {
    scenarios: ['Cost Spiral', 'Security Breach', 'Outage Prevention'],
    speed: ['Normal', 'Fast', 'Skip to Resolution'],
    highlights: ['Enable tooltips', 'Show value callouts', 'Pause on savings']
  };
};
```

**Deliverables:**
- [ ] Build presenter control panel
- [ ] Add demo annotations
- [ ] Create smooth transitions
- [ ] Implement pause/resume

#### Session 12: Data Realism Enhancement
**Goal:** Make synthetic data indistinguishable from production

**Deliverables:**
- [ ] Add Capital Group-specific details
- [ ] Create realistic service names
- [ ] Implement actual AWS services
- [ ] Add real technology stack

#### Session 13: Executive Storytelling
**Goal:** Create compelling narratives for each persona

**Deliverables:**
- [ ] CIO journey (strategic value)
- [ ] CFO journey (cost savings)
- [ ] CISO journey (risk reduction)
- [ ] CTO journey (innovation)

#### Session 14: Kubernetes Deployment
**Goal:** Deploy to local K8s for enterprise credibility

```yaml
# k8s/ubiquitous-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ubiquitous-frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ubiquitous-frontend
  template:
    spec:
      containers:
      - name: frontend
        image: ubiquitous-frontend:mvp
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

**Deliverables:**
- [ ] Create K8s manifests
- [ ] Implement Ingress
- [ ] Add ConfigMaps
- [ ] Test local deployment

#### Session 15: Final Demo Preparation
**Goal:** Perfect the demo flow and materials

**Deliverables:**
- [ ] Create demo script
- [ ] Build slide deck
- [ ] Record backup video
- [ ] Prepare Q&A responses

---

## 4. Key Demo Scenarios

### Scenario 1: The $2M Trading System Crisis (5 minutes)
**Setup:** Monday morning, trading system showing degradation
**Journey:**
1. Alert appears in Incident Command Center
2. Dependency graph shows affected services (impressive visualization)
3. Click to see 45,000 users impacted
4. AI identifies root cause: Database connection pool exhaustion
5. One-click remediation with Terraform code
6. Show $2M in prevented losses

**Key Visuals:**
- Real-time graph with 10,000+ nodes
- Service dependency cascade animation
- Automated remediation with IaC

### Scenario 2: The AWS Cost Spiral (4 minutes)
**Setup:** Monthly AWS bill increased 40% ($2M → $2.8M)
**Journey:**
1. FinOps dashboard shows cost anomaly
2. Drill down to wasteful services
3. AI generates optimization recommendations
4. Show actual Terraform code changes
5. Project $780K monthly savings

**Key Visuals:**
- Cost breakdown treemap
- Terraform code generation
- Savings calculator with ROI

### Scenario 3: Security Breach Prevention (3 minutes)
**Setup:** Critical vulnerability in production
**Journey:**
1. Security Command Center shows threat escalation
2. Dependency map reveals exposure
3. Automated patch orchestration
4. Show $6.08M breach cost avoided

**Key Visuals:**
- Vulnerability heat map
- Attack surface visualization
- Compliance dashboard update

### Scenario 4: Executive Value Rollup (2 minutes)
**Setup:** Quarterly board meeting prep
**Journey:**
1. CEO dashboard showing $41.6M annual value
2. Drill to department breakdowns
3. Show industry benchmarking (top 5%)
4. Export board-ready PDF

**Key Visuals:**
- Multi-tier value reporting
- ROI trend visualization
- Industry comparison charts

---

## 5. Technical Implementation Details

### Frontend Technology Stack
```javascript
// package.json key dependencies
{
  "dependencies": {
    "react": "^18.2.0",
    "vite": "^4.5.0",
    "cytoscape": "^3.28.0",
    "cytoscape-fcose": "^2.2.0",
    "d3": "^7.8.0",
    "chart.js": "^4.4.0",
    "react-chartjs-2": "^5.2.0",
    "socket.io-client": "^4.6.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "react-leaflet": "^4.2.0",
    "framer-motion": "^10.16.0"
  }
}
```

### Backend Synthetic Data Strategy
```python
# backend/synthetic_data.py
class SyntheticDataEngine:
    def __init__(self):
        self.companies = ['Capital', 'Financial', 'Investment', 'Asset', 'Wealth']
        self.services = ['Trading', 'Portfolio', 'Risk', 'Compliance', 'Settlement']
        self.environments = ['prod', 'staging', 'qa', 'dev']
        
    def generate_realistic_names(self):
        # Create believable service names
        # prod-trading-api-01
        # risk-calculation-service
        # portfolio-optimization-engine
        
    def generate_metrics_with_patterns(self):
        # Business hours: Higher load 9-5 EST
        # Market hours: Spike at open/close
        # End of month: Batch processing spikes
        # Random incidents: Occasional anomalies
```

### Performance Optimizations
```typescript
// frontend/src/utils/performance.ts
export const performanceOptimizations = {
  // Virtual scrolling for large lists
  virtualScrolling: {
    itemHeight: 50,
    overscan: 10,
    scrollDebounce: 16
  },
  
  // Canvas rendering for graphs
  graphRendering: {
    renderer: 'webgl',
    hideEdgesOnViewport: true,
    textureOnViewport: true,
    motionBlur: true
  },
  
  // Lazy loading strategies
  lazyLoading: {
    intersection: { rootMargin: '100px' },
    suspense: true,
    prefetch: 'hover'
  },
  
  // WebSocket batching
  realtimeUpdates: {
    batchSize: 100,
    batchInterval: 100,
    compression: true
  }
};
```

---

## 6. Success Metrics

### Demo Success Criteria
- [ ] **Visual Impact:** "Wow" reaction within first 30 seconds
- [ ] **Performance:** 50K nodes render in <3 seconds
- [ ] **Believability:** Executives believe it's real
- [ ] **Value Clear:** $41.6M savings understood
- [ ] **Action Driver:** Clear next steps requested

### Technical Validation
- [ ] **Docker:** Runs on 16GB MacBook Pro
- [ ] **Kubernetes:** Deploys to local K8s
- [ ] **Data Scale:** 50K+ nodes render smoothly
- [ ] **Real-time:** <200ms update latency
- [ ] **Stability:** No crashes during demo

---

## 7. Risk Mitigation

### Demo Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Performance issues with 50K nodes | Pre-compute layouts, use WebGL, implement LOD |
| Unbelievable data | Use real Capital Group terminology and structure |
| Technical failure during demo | Record backup video, practice recovery |
| Questions about backend | Show architecture diagrams, discuss roadmap |
| ROI skepticism | Reference IBM/Gartner reports, show calculations |

---

## 8. Session Execution Checklist

### Pre-Session Setup
- [ ] Review previous session code
- [ ] Update Docker containers
- [ ] Check memory/CPU resources
- [ ] Prepare test data

### During Session
- [ ] Focus on visual impact
- [ ] Test as you build
- [ ] Commit working code frequently
- [ ] Document for handoff

### Post-Session
- [ ] Test full demo flow
- [ ] Update documentation
- [ ] Plan next session
- [ ] Note improvements needed

---

## 9. Deliverable Timeline

### Week 1-2 (Sessions 1-5)
- Working infrastructure graph with 50K nodes
- Executive value dashboard with ROI
- Basic demo scenarios
- Security Command Center

### Week 3-4 (Sessions 6-10)
- FinOps dashboard with Terraform
- Incident Command Center
- Network analysis with geo
- Greenfield planning
- Performance optimization

### Week 5-6 (Sessions 11-15)
- Demo mode and controls
- Enhanced data realism
- Executive narratives
- Kubernetes deployment
- Final polish and practice

---

## 10. Key Success Factors

### Must-Have for CIO Demo
1. **Visual Excellence:** Professional, modern, impressive UI
2. **Scale Credibility:** Handle 50K+ nodes smoothly
3. **Value Clarity:** $41.6M savings clearly demonstrated
4. **Real Scenarios:** Believable problems and solutions
5. **Executive Language:** ROI, efficiency, risk reduction

### Nice-to-Have
1. Mobile responsive design
2. PDF export functionality
3. Multiple color themes
4. Accessibility features
5. Multi-language support

---

## Conclusion

This Wizard of Oz MVP plan creates a compelling demonstration of the Ubiquitous platform vision using only Claude Code sessions. By focusing on frontend excellence, synthetic data at scale, and carefully crafted demo scenarios, we can create a convincing prototype that sells the $41.6M value proposition to executive leadership.

The key is balancing visual impact with technical credibility—making it impressive enough to excite executives while believable enough to justify investment. With 15-20 focused Claude sessions, we can transform the current basic React shell into a demo-ready platform that looks like a $28M enterprise solution.

**Next Steps:**
1. Begin Session 1: Enhanced Data Generator
2. Set up development environment
3. Prepare demo scenarios
4. Schedule stakeholder preview sessions

---

**Document Control:**
- Version: 1.0
- Date: August 30, 2025
- Purpose: Claude-executable plan for Wizard of Oz MVP
- Owner: Development Team