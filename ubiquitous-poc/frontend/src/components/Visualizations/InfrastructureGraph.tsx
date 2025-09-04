import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import cytoscape, { Core, NodeSingular, EdgeSingular } from 'cytoscape';
import cola from 'cytoscape-cola';
import coseBilkent from 'cytoscape-cose-bilkent';
import nodeHtmlLabel from 'cytoscape-node-html-label';
import './InfrastructureGraph.css';

// Register Cytoscape extensions
cytoscape.use(cola);
cytoscape.use(coseBilkent);
cytoscape.use(nodeHtmlLabel);

interface GraphNode {
  id: string;
  label: string;
  type: string;
  category: string;
  status: string;
  cost?: number;
  properties: Record<string, any>;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight?: number;
  properties: Record<string, any>;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    categories: string[];
    lastUpdated: string;
  };
}

interface InfrastructureGraphProps {
  data?: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
  className?: string;
  showMinimap?: boolean;
  enableClustering?: boolean;
  maxVisibleNodes?: number;
}

interface ViewState {
  zoom: number;
  pan: { x: number; y: number };
  selectedNodes: string[];
  visibleNodes: string[];
  currentLevel: number;
  filterCategory: string | null;
}

const InfrastructureGraph: React.FC<InfrastructureGraphProps> = ({
  data,
  width = 1200,
  height = 800,
  onNodeClick,
  onEdgeClick,
  className = '',
  showMinimap = true,
  enableClustering = true,
  maxVisibleNodes = 5000
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewState, setViewState] = useState<ViewState>({
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedNodes: [],
    visibleNodes: [],
    currentLevel: 0,
    filterCategory: null
  });
  const [performanceStats, setPerformanceStats] = useState({
    renderTime: 0,
    nodeCount: 0,
    edgeCount: 0,
    fps: 60
  });

  // Memoize node styles for performance
  const nodeStyles = useMemo(() => ({
    'aws-region': {
      'background-color': '#ff6b35',
      'shape': 'round-rectangle',
      'width': '80px',
      'height': '40px',
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '12px',
      'color': 'white',
      'font-weight': 'bold',
      'border-width': 2,
      'border-color': '#d45529'
    },
    'vpc': {
      'background-color': '#4a90e2',
      'shape': 'round-rectangle',
      'width': '70px',
      'height': '35px',
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '11px',
      'color': 'white',
      'border-width': 2,
      'border-color': '#357abd'
    },
    'eks-cluster': {
      'background-color': '#f39c12',
      'shape': 'hexagon',
      'width': '60px',
      'height': '60px',
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '10px',
      'color': 'white',
      'font-weight': 'bold',
      'border-width': 2,
      'border-color': '#d68910'
    },
    'pod': {
      'background-color': '#27ae60',
      'shape': 'ellipse',
      'width': '40px',
      'height': '40px',
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '9px',
      'color': 'white',
      'border-width': 1,
      'border-color': '#229954'
    },
    'rds-instance': {
      'background-color': '#8e44ad',
      'shape': 'round-diamond',
      'width': '50px',
      'height': '50px',
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '9px',
      'color': 'white',
      'border-width': 2,
      'border-color': '#7d3c98'
    },
    'ec2-instance': {
      'background-color': '#e74c3c',
      'shape': 'rectangle',
      'width': '45px',
      'height': '30px',
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '9px',
      'color': 'white',
      'border-width': 1,
      'border-color': '#cb4335'
    },
    'aws-service': {
      'background-color': '#17a2b8',
      'shape': 'triangle',
      'width': '35px',
      'height': '35px',
      'label': 'data(label)',
      'text-valign': 'center',
      'text-halign': 'center',
      'font-size': '8px',
      'color': 'white',
      'border-width': 1,
      'border-color': '#138496'
    }
  }), []);

  // Memoize edge styles
  const edgeStyles = useMemo(() => ({
    'contains': {
      'line-color': '#95a5a6',
      'target-arrow-color': '#95a5a6',
      'target-arrow-shape': 'triangle',
      'curve-style': 'straight',
      'width': 2,
      'arrow-scale': 1.2
    },
    'connects_to': {
      'line-color': '#3498db',
      'target-arrow-color': '#3498db',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'width': 1.5,
      'line-style': 'dashed'
    },
    'depends_on': {
      'line-color': '#e67e22',
      'target-arrow-color': '#e67e22',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'width': 2.5
    },
    'critical': {
      'line-color': '#e74c3c',
      'target-arrow-color': '#e74c3c',
      'target-arrow-shape': 'triangle',
      'curve-style': 'straight',
      'width': 3,
      'line-style': 'solid'
    }
  }), []);

  // Level-of-detail filtering for performance
  const getVisibleElements = useCallback((allData: GraphData, zoom: number, centerX: number, centerY: number) => {
    if (!allData?.nodes) return { nodes: [], edges: [] };

    // For small datasets (< 1000 nodes), show all nodes to avoid over-filtering
    if (allData.nodes.length < 1000) {
      return {
        nodes: [...allData.nodes],
        edges: [...allData.edges]
      };
    }
    
    // For larger datasets, use priority-based filtering with minimum threshold
    const maxNodes = Math.min(maxVisibleNodes, Math.max(100, Math.floor(zoom * maxVisibleNodes)));
    
    // Priority-based filtering
    const priorityMap: Record<string, number> = {
      'aws-region': 10,
      'vpc': 9,
      'eks-cluster': 8,
      'rds-instance': 7,
      'ec2-instance': 6,
      'pod': 5,
      'aws-service': 4
    };

    // Sort nodes by priority (remove random distance for consistency)
    const sortedNodes = [...allData.nodes]
      .map(node => ({
        ...node,
        priority: priorityMap[node.type] || 1
      }))
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxNodes);

    // Get visible node IDs
    const visibleNodeIds = new Set(sortedNodes.map(n => n.id));
    
    // Filter edges to only include those connecting visible nodes
    const visibleEdges = allData.edges.filter(edge => 
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );

    return {
      nodes: sortedNodes,
      edges: visibleEdges
    };
  }, [maxVisibleNodes]);

  // Convert data to Cytoscape format
  const cytoscapeElements = useMemo(() => {
    if (!data) return [];

    const visibleData = getVisibleElements(data, viewState.zoom, viewState.pan.x, viewState.pan.y);
    
    const elements = [
      // Add nodes
      ...visibleData.nodes.map(node => ({
        data: {
          id: node.id,
          label: node.label,
          type: node.type,
          category: node.category,
          status: node.status,
          cost: node.cost,
          ...node.properties
        },
        classes: node.type
      })),
      // Add edges
      ...visibleData.edges.map(edge => ({
        data: {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          weight: edge.weight,
          ...edge.properties
        },
        classes: edge.type
      }))
    ];

    return elements;
  }, [data, viewState, getVisibleElements]);

  // Initialize Cytoscape
  useEffect(() => {
    if (!containerRef.current || !data) return;

    const startTime = performance.now();
    setLoading(true);

    // Create base style array
    const baseStyles = [
      // Node styles
      ...Object.entries(nodeStyles).map(([selector, style]) => ({
        selector: `.${selector}`,
        style
      })),
      // Edge styles  
      ...Object.entries(edgeStyles).map(([selector, style]) => ({
        selector: `.${selector}`,
        style
      })),
      // Selected state
      {
        selector: 'node:selected',
        style: {
          'border-width': 4,
          'border-color': '#fff',
          'overlay-color': '#fff',
          'overlay-padding': 10,
          'overlay-opacity': 0.2
        }
      },
      // Hover state
      {
        selector: 'node:active',
        style: {
          'overlay-color': '#fff',
          'overlay-padding': 8,
          'overlay-opacity': 0.1
        }
      }
    ];

    const cy = cytoscape({
      container: containerRef.current,
      elements: cytoscapeElements,
      style: baseStyles,
      layout: {
        name: 'grid',
        fit: true,
        padding: 50,
        avoidOverlap: true,
        avoidOverlapPadding: 50,
        nodeDimensionsIncludeLabels: true,
        spacingFactor: 1.5,
        condense: false,
        rows: undefined,
        cols: undefined,
        position: function(node: any) { return {}; },
        sort: undefined,
        animate: false
      },
      // Performance optimizations
      wheelSensitivity: 0.1,
      minZoom: 0.1,
      maxZoom: 3,
      zoomingEnabled: true,
      userZoomingEnabled: true,
      panningEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: true,
      selectionType: 'additive',
      autoungrabify: false,
      autounselectify: false
    });

    // Event handlers
    cy.on('tap', 'node', (event) => {
      const node = event.target;
      const nodeData: GraphNode = {
        id: node.data('id'),
        label: node.data('label'),
        type: node.data('type'),
        category: node.data('category'),
        status: node.data('status'),
        cost: node.data('cost'),
        properties: node.data()
      };
      
      if (onNodeClick) {
        onNodeClick(nodeData);
      }
      
      // Update selected nodes
      setViewState(prev => ({
        ...prev,
        selectedNodes: [nodeData.id]
      }));
    });

    cy.on('tap', 'edge', (event) => {
      const edge = event.target;
      const edgeData: GraphEdge = {
        id: edge.data('id'),
        source: edge.data('source'),
        target: edge.data('target'),
        type: edge.data('type'),
        weight: edge.data('weight'),
        properties: edge.data()
      };
      
      if (onEdgeClick) {
        onEdgeClick(edgeData);
      }
    });

    // Viewport change tracking for level-of-detail
    cy.on('viewport', () => {
      const zoom = cy.zoom();
      const pan = cy.pan();
      
      setViewState(prev => ({
        ...prev,
        zoom,
        pan
      }));
    });

    // Double-click to focus and expand
    cy.on('dbltap', 'node', (event) => {
      const node = event.target;
      
      // Animate to focus on the node
      cy.animate({
        zoom: Math.min(2, cy.zoom() * 1.5),
        center: { eles: node }
      }, {
        duration: 300
      });

      // Load children if it's a container node
      const nodeType = node.data('type');
      if (['aws-region', 'vpc', 'eks-cluster'].includes(nodeType)) {
        // This would trigger loading of child nodes in a real implementation
        console.log(`Expanding ${nodeType}: ${node.data('label')}`);
      }
    });

    // Performance monitoring
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measurePerformance = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setPerformanceStats(prev => ({
          ...prev,
          fps,
          nodeCount: cy.nodes().length,
          edgeCount: cy.edges().length
        }));
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measurePerformance);
    };
    
    requestAnimationFrame(measurePerformance);

    cyRef.current = cy;
    
    // Ensure nodes are visible and properly positioned
    if (cy.elements().length > 0) {
      cy.fit();
      cy.center();
      console.log(`Graph initialized: ${cy.nodes().length} nodes, ${cy.edges().length} edges`);
    }
    
    const renderTime = performance.now() - startTime;
    setPerformanceStats(prev => ({ ...prev, renderTime }));
    setLoading(false);

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [cytoscapeElements, nodeStyles, edgeStyles, enableClustering, onNodeClick, onEdgeClick]);

  // Search functionality
  const searchNodes = useCallback((query: string) => {
    if (!cyRef.current || !query.trim()) {
      // Reset search - show all nodes
      cyRef.current?.elements().removeClass('dimmed searched');
      return;
    }

    const cy = cyRef.current;
    const searchQuery = query.toLowerCase();
    
    // Find matching nodes
    const matchingNodes = cy.nodes().filter(node => {
      const label = node.data('label')?.toLowerCase() || '';
      const type = node.data('type')?.toLowerCase() || '';
      const category = node.data('category')?.toLowerCase() || '';
      
      return label.includes(searchQuery) || 
             type.includes(searchQuery) || 
             category.includes(searchQuery);
    });

    // Style: dim all, highlight matches
    cy.elements().addClass('dimmed');
    matchingNodes.removeClass('dimmed').addClass('searched');
    
    // Animate to show first match
    if (matchingNodes.length > 0) {
      cy.animate({
        center: { eles: matchingNodes.first() },
        zoom: Math.max(1, cy.zoom())
      }, { duration: 300 });
    }
  }, []);

  // Filter by category
  const filterByCategory = useCallback((category: string | null) => {
    if (!cyRef.current) return;
    
    const cy = cyRef.current;
    
    if (!category) {
      // Show all
      cy.elements().removeClass('filtered');
      setViewState(prev => ({ ...prev, filterCategory: null }));
    } else {
      // Hide non-matching
      cy.elements().addClass('filtered');
      cy.nodes(`[category = "${category}"]`).removeClass('filtered');
      cy.edges().removeClass('filtered'); // Keep all edges visible
      setViewState(prev => ({ ...prev, filterCategory: category }));
    }
  }, []);

  // Reset view
  const resetView = useCallback(() => {
    if (!cyRef.current) return;
    
    cyRef.current.animate({
      zoom: 1,
      center: { eles: cyRef.current.elements() }
    }, { duration: 500 });
    
    cyRef.current.elements().removeClass('dimmed searched filtered');
    setViewState(prev => ({
      ...prev,
      zoom: 1,
      selectedNodes: [],
      filterCategory: null
    }));
  }, []);

  // Get unique categories for filtering
  const categories = useMemo(() => {
    if (!data?.nodes) return [];
    return [...new Set(data.nodes.map(n => n.category))].sort();
  }, [data]);

  if (!data) {
    return (
      <div className={`infrastructure-graph loading ${className}`}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading infrastructure topology...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`infrastructure-graph ${className}`}>
      {/* Controls Panel */}
      <div className="graph-controls">
        <div className="control-group">
          <input
            type="text"
            placeholder="Search nodes..."
            className="search-input"
            onChange={(e) => searchNodes(e.target.value)}
          />
          
          <select
            value={viewState.filterCategory || ''}
            onChange={(e) => filterByCategory(e.target.value || null)}
            className="category-filter"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          <button onClick={resetView} className="reset-btn">
            Reset View
          </button>
          
          <div className="navigation-help" title="Navigation: Click & drag to pan, scroll to zoom, double-click to focus">
            🗺️ Navigation
          </div>
        </div>
        
        {/* Performance Stats */}
        <div className="performance-stats">
          <span>Nodes: {performanceStats.nodeCount.toLocaleString()}</span>
          <span>Edges: {performanceStats.edgeCount.toLocaleString()}</span>
          <span>FPS: {performanceStats.fps}</span>
          <span>Render: {performanceStats.renderTime.toFixed(0)}ms</span>
        </div>
      </div>

      {/* Graph Container */}
      <div 
        ref={containerRef}
        className="cytoscape-container"
        style={{ width, height }}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Rendering {data.metadata.totalNodes.toLocaleString()} nodes...</p>
        </div>
      )}

      {/* Minimap */}
      {showMinimap && cyRef.current && (
        <div className="minimap">
          <div className="minimap-viewport" />
        </div>
      )}

      {/* Legend */}
      <div className="graph-legend">
        <h4>Infrastructure Types</h4>
        <div className="legend-items">
          {Object.entries(nodeStyles).map(([type, style]) => (
            <div key={type} className="legend-item">
              <div 
                className="legend-color"
                style={{ 
                  backgroundColor: style['background-color'],
                  borderColor: style['border-color']
                }}
              />
              <span>{type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status Bar */}
      <div className="status-bar">
        <div className="status-item">
          <strong>Total Infrastructure:</strong> {data.metadata.totalNodes.toLocaleString()} nodes
        </div>
        <div className="status-item">
          <strong>Visible:</strong> {performanceStats.nodeCount.toLocaleString()} nodes
        </div>
        <div className="status-item">
          <strong>Last Updated:</strong> {new Date(data.metadata.lastUpdated).toLocaleTimeString()}
        </div>
        {viewState.filterCategory && (
          <div className="status-item">
            <strong>Filter:</strong> {viewState.filterCategory}
          </div>
        )}
      </div>
    </div>
  );
};

export default InfrastructureGraph;