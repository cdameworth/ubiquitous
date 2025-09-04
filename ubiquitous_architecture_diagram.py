import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle
import matplotlib.lines as mlines

# Create figure with PowerPoint slide aspect ratio (16:9)
fig, ax = plt.subplots(figsize=(16, 9))
ax.set_xlim(0, 100)
ax.set_ylim(0, 100)
ax.axis('off')

# Title
plt.title('Ubiquitous - Enterprise Infrastructure Intelligence Platform', 
          fontsize=16, fontweight='bold', pad=20)

# Color scheme
colors = {
    'datasource': '#E8F4FD',    # Light blue for data sources
    'ingestion': '#FFF3E0',     # Light orange for ingestion
    'processing': '#F3E5F5',    # Light purple for processing
    'storage': '#E0F2F1',       # Light cyan for storage
    'intelligence': '#FFF9C4',   # Light yellow for ML/AI
    'service': '#E8F5E9',       # Light green for services
    'visualization': '#FCE4EC',  # Light pink for visualization
    'header': '#1976D2'         # Dark blue for headers
}

# Function to draw rounded rectangle
def draw_component(ax, text, x, y, width, height, color, fontsize=8, bold=True):
    rect = FancyBboxPatch((x, y), width, height,
                          boxstyle="round,pad=0.05",
                          facecolor=color,
                          edgecolor='#666666',
                          linewidth=1.2)
    ax.add_patch(rect)
    fontweight = 'bold' if bold else 'normal'
    ax.text(x + width/2, y + height/2, text,
           ha='center', va='center', fontsize=fontsize, 
           fontweight=fontweight, wrap=True)

# Function to draw arrow
def draw_arrow(ax, x1, y1, x2, y2, style='solid', width=1.5, color='#555555'):
    arrow = FancyArrowPatch((x1, y1), (x2, y2),
                           arrowstyle='->', mutation_scale=12,
                           linestyle=style, linewidth=width,
                           color=color)
    ax.add_patch(arrow)

# Draw section headers
headers = [
    ('DATA SOURCES', 10, 92),
    ('INGESTION', 26, 92),
    ('PROCESSING', 42, 92),
    ('STORAGE', 42, 52),
    ('INTELLIGENCE', 58, 92),
    ('SERVICES', 74, 92),
    ('VISUALIZATION', 90, 92),
    ('EXEC REPORTING', 90, 28)
]

for header, x, y in headers:
    ax.text(x, y, header, fontsize=10, fontweight='bold', 
            color=colors['header'], ha='center')

# Data Sources (8 systems) - proper spacing to avoid storage overlap
data_sources = [
    ('DataDog\nMonitoring', 4, 86, 11, 4.5),
    ('AWS CloudWatch\nNative AWS', 4, 80.5, 11, 4.5),
    ('Tanium\nEndpoint', 4, 75, 11, 4.5),
    ('OpenTelemetry\nObservability', 4, 69.5, 11, 4.5),
    ('Flexera\nIT Assets', 4, 64, 11, 4.5),
    ('Terraform\nIaC', 4, 58.5, 11, 4.5),
    ('GitHub\nCode Repos', 4, 53, 11, 4.5),
    ('ServiceNow\nITSM', 4, 47.5, 11, 4.5)
]

for name, x, y, w, h in data_sources:
    draw_component(ax, name, x, y, w, h, colors['datasource'])

# Data Ingestion Layer
ingestion = [
    ('Apache Kafka\nEvent Stream\n1M+ events/s', 20, 75, 11, 7),
    ('Apache NiFi\nETL Pipeline', 20, 65, 11, 6),
    ('API Gateway\nREST/GraphQL', 20, 56, 11, 6),
]

for name, x, y, w, h in ingestion:
    draw_component(ax, name, x, y, w, h, colors['ingestion'])

# Data Processing
processing = [
    ('Apache Spark\nBatch', 36, 82, 11, 5),
    ('Apache Flink\nStream', 36, 75, 11, 5),
]

for name, x, y, w, h in processing:
    draw_component(ax, name, x, y, w, h, colors['processing'])

# Storage Layer
storage = [
    ('Snowflake\nData Lake\n5yr retention', 36, 40, 11, 7),
    ('TimescaleDB\nTime-Series\n90d hot data', 36, 30, 11, 6),
    ('Neo4j Graph\n10M+ nodes\n100M+ edges', 36, 20, 11, 7)
]

for name, x, y, w, h in storage:
    draw_component(ax, name, x, y, w, h, colors['storage'])

# Intelligence Layer
intelligence = [
    ('ML/AI Engine\nTensorFlow\nAnomaly Det.', 52, 82, 11, 7),
    ('Rules Engine\nDrools\nCompliance', 52, 72, 11, 6),
    ('Analytics\nDatabricks\nInsights', 52, 62, 11, 6)
]

for name, x, y, w, h in intelligence:
    draw_component(ax, name, x, y, w, h, colors['intelligence'])

# Application Services (6 core features)
services = [
    ('Network\nAnalysis\nProtocol/Latency', 68, 82, 11, 6),
    ('Observability\nRecommender\nGap Analysis', 68, 74, 11, 6),
    ('FinOps\nAnalyzer\nCost Opt', 68, 66, 11, 6),
    ('Security\nScanner\nCVE/Compliance', 68, 58, 11, 6),
    ('DR Readiness\nRPO/RTO\nValidation', 68, 50, 11, 6),
    ('CMDB Sync\nReal-time\n98% Accuracy', 68, 42, 11, 6)
]

for name, x, y, w, h in services:
    draw_component(ax, name, x, y, w, h, colors['service'])

# Visualization Layer
visualization = [
    ('React Web App\nSingle Pane', 84, 84, 11, 5),
    ('D3.js/Cytoscape\nGraph Viz\n50K nodes', 84, 76, 11, 6),
    ('Grafana\nDashboards', 84, 68, 11, 5),
    ('PowerBI\nReporting', 84, 60, 11, 5)
]

# Executive Reporting Layer
executive_reporting = [
    ('Executive ROI\nAnalytics\nValue Tracking', 84, 50, 11, 7),
    ('Multi-Level\nReporting\nCEO to Team', 84, 41, 11, 6),
    ('Fiscal Period\nAnalysis\nM/Q/A/FY', 84, 33, 11, 6)
]

for name, x, y, w, h in visualization:
    draw_component(ax, name, x, y, w, h, colors['visualization'])

# Executive Reporting
for name, x, y, w, h in executive_reporting:
    draw_component(ax, name, x, y, w, h, '#F0F8FF', 8)  # Alice Blue for reporting layer

# Draw connections
# Data sources to ingestion - updated for 8 sources
for _, x, y, w, h in data_sources[:3]:  # DataDog, AWS CloudWatch, Tanium to Kafka
    draw_arrow(ax, x+w, y+h/2, 20, 78, width=1.2)
    
for _, x, y, w, h in data_sources[3:6]:  # OpenTelemetry, Flexera, Terraform to NiFi
    draw_arrow(ax, x+w, y+h/2, 20, 68, width=1.2)
    
for _, x, y, w, h in data_sources[6:]:  # GitHub, ServiceNow to API Gateway
    draw_arrow(ax, x+w, y+h/2, 20, 59, width=1.2)

# Ingestion to Processing
draw_arrow(ax, 31, 78, 36, 84, width=1.5)  # Kafka to Spark
draw_arrow(ax, 31, 78, 36, 77, width=1.5)  # Kafka to Flink
draw_arrow(ax, 31, 68, 36, 43, width=1.5)  # NiFi to Data Lake
draw_arrow(ax, 31, 59, 36, 43, width=1.5)  # API to Data Lake

# Processing to Storage
draw_arrow(ax, 47, 84, 47, 47, width=1.5)  # Spark to storage
draw_arrow(ax, 47, 77, 47, 36, width=1.5)  # Flink to TimescaleDB

# Storage connections
draw_arrow(ax, 42, 40, 42, 27, width=1.2)  # Data Lake to Neo4j
draw_arrow(ax, 42, 30, 42, 27, width=1.2)  # TimescaleDB to Neo4j

# Storage to Intelligence
draw_arrow(ax, 47, 24, 52, 85, width=1.5)  # Neo4j to ML
draw_arrow(ax, 47, 33, 52, 65, width=1.5)  # TimescaleDB to Analytics

# Intelligence to Services
draw_arrow(ax, 63, 85, 68, 85, width=1.5)  # ML to Network Analysis
draw_arrow(ax, 63, 65, 68, 69, width=1.5)  # Analytics to FinOps
draw_arrow(ax, 63, 75, 68, 61, width=1.5)  # Rules to Security
draw_arrow(ax, 47, 24, 68, 45, width=1.2, style='dashed')  # Graph to CMDB

# Services to Visualization
for i, (_, x, y, w, h) in enumerate(services[:4]):
    viz_y = 87 - (i * 6)
    draw_arrow(ax, x+w, y+h/2, 84, viz_y, width=1.2)

# PowerBI gets data from Data Lake for reporting
draw_arrow(ax, 47, 43, 84, 62, width=1.2, style='dashed')  # Data Lake to PowerBI

# Services to Executive Reporting (data flows for ROI calculation)
for i, (_, x, y, w, h) in enumerate(services):
    # Connect all services to Executive ROI Analytics
    draw_arrow(ax, x+w, y+h/2, 84, 53, width=1.0, style='dashed')

# Executive reporting internal flow (ROI -> Multi-Level -> Fiscal)
draw_arrow(ax, 89.5, 50, 89.5, 47, width=1.2)  # ROI to Multi-Level
draw_arrow(ax, 89.5, 41, 89.5, 39, width=1.2)  # Multi-Level to Fiscal

# Add key metrics boxes
metrics_box = """Key Metrics:
• 1M+ events/sec ingestion
• <2 sec query response
• 50K nodes visualization
• 99.95% SLA availability"""

ax.text(4, 30, metrics_box, fontsize=8,
        bbox=dict(boxstyle="round,pad=0.5", 
                 facecolor='white', edgecolor='gray'))

roi_box = """ROI Highlights:
• 35% MTTR reduction
• 20% cloud cost savings
• 50% compliance audit reduction
• 8-month payback period
• 575% 5-year ROI"""

ax.text(4, 15, roi_box, fontsize=8,
        bbox=dict(boxstyle="round,pad=0.5", 
                 facecolor='#E8F5E9', edgecolor='gray'))

phases_box = """Implementation Phases:
Phase 1: Foundation (Q1-Q2)
Phase 2: Enhanced Visibility (Q3-Q4)
Phase 3: Intelligence Layer (Y2 Q1-Q2)
Phase 4: Advanced Automation (Y2 Q3-Q4)"""

ax.text(52, 30, phases_box, fontsize=8,
        bbox=dict(boxstyle="round,pad=0.5", 
                 facecolor='#FFF3E0', edgecolor='gray'))

# Add legend
legend_elements = [
    mlines.Line2D([0], [0], color='#555555', linewidth=1.5, 
                  label='Primary Data Flow', marker='>', markersize=6),
    mlines.Line2D([0], [0], color='#555555', linewidth=1.2, linestyle='--',
                  label='Secondary Flow', marker='>', markersize=6),
    patches.Patch(facecolor=colors['datasource'], label='Data Sources'),
    patches.Patch(facecolor=colors['ingestion'], label='Ingestion'),
    patches.Patch(facecolor=colors['processing'], label='Processing'),
    patches.Patch(facecolor=colors['storage'], label='Storage'),
    patches.Patch(facecolor=colors['intelligence'], label='ML/AI'),
    patches.Patch(facecolor=colors['service'], label='Services'),
    patches.Patch(facecolor=colors['visualization'], label='Visualization'),
    patches.Patch(facecolor='#F0F8FF', label='Executive Reporting')
]
ax.legend(handles=legend_elements, loc='lower right', fontsize=7, ncol=3)

# Add subtitle
ax.text(50, 5, 'Capital Group Infrastructure Intelligence Solution', 
        fontsize=10, ha='center', style='italic')

plt.tight_layout()

# Save as high-resolution PNG for PowerPoint
plt.savefig('/Users/cdameworth/Documents/projects/cg_adm/Ubiquitous.png', 
            dpi=300, bbox_inches='tight', facecolor='white', edgecolor='none')

# Also save as PDF for vector graphics
plt.savefig('/Users/cdameworth/Documents/projects/cg_adm/Ubiquitous.pdf', 
            bbox_inches='tight', facecolor='white', edgecolor='none')

print("Ubiquitous architecture diagram saved as:")
print("  - Ubiquitous.png (300 DPI for PowerPoint)")
print("  - Ubiquitous.pdf (vector format)")
print("\nDiagram includes:")
print("  • 8 data sources (DataDog, AWS CloudWatch, Tanium, OpenTelemetry, Flexera, Terraform, GitHub, ServiceNow)")
print("  • Data ingestion layer (Kafka, NiFi, API Gateway)")
print("  • Processing & storage (Spark, Flink, Snowflake, TimescaleDB, Neo4j)")
print("  • Intelligence layer (ML/AI, Rules Engine, Analytics)")
print("  • 6 core application services")
print("  • Visualization layer (React, D3.js, Grafana, PowerBI)")
print("  • Key metrics and ROI highlights")

plt.show()