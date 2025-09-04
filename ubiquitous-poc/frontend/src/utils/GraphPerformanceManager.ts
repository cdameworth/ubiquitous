/**
 * Graph Performance Manager
 * Handles performance optimizations for large-scale infrastructure graphs
 */

import { GraphNode, GraphEdge, GraphData } from '../services/InfrastructureGraphService';

export interface ViewportBounds {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PerformanceConfig {
  maxVisibleNodes: number;
  maxVisibleEdges: number;
  lodThresholds: {
    zoom: number;
    maxNodes: number;
  }[];
  clusteringThreshold: number;
  renderBatchSize: number;
  updateThrottleMs: number;
}

export interface ClusterNode {
  id: string;
  label: string;
  type: 'cluster';
  children: GraphNode[];
  bounds: ViewportBounds;
  aggregatedMetrics: Record<string, number>;
}

export interface PerformanceMetrics {
  renderTime: number;
  nodeCount: number;
  edgeCount: number;
  clusterCount: number;
  fps: number;
  memoryUsage: number;
  lastUpdateTime: number;
}

class GraphPerformanceManager {
  private config: PerformanceConfig;
  private performanceMetrics: PerformanceMetrics;
  private spatialIndex: Map<string, GraphNode[]>;
  private renderQueue: GraphNode[];
  private updateTimer: number | null = null;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = {
      maxVisibleNodes: 5000,
      maxVisibleEdges: 10000,
      lodThresholds: [
        { zoom: 0.1, maxNodes: 50 },    // Global overview
        { zoom: 0.5, maxNodes: 200 },   // Regional view
        { zoom: 1.0, maxNodes: 1000 },  // Service view
        { zoom: 2.0, maxNodes: 5000 },  // Detailed view
        { zoom: 3.0, maxNodes: 15000 }  // Full detail
      ],
      clusteringThreshold: 1000,
      renderBatchSize: 500,
      updateThrottleMs: 16, // ~60 FPS
      ...config
    };

    this.performanceMetrics = {
      renderTime: 0,
      nodeCount: 0,
      edgeCount: 0,
      clusterCount: 0,
      fps: 60,
      memoryUsage: 0,
      lastUpdateTime: Date.now()
    };

    this.spatialIndex = new Map();
    this.renderQueue = [];
  }

  /**
   * Apply level-of-detail filtering based on zoom level
   */
  applyLevelOfDetail(
    data: GraphData,
    zoom: number,
    viewport: ViewportBounds
  ): { nodes: GraphNode[]; edges: GraphEdge[] } {
    const startTime = performance.now();

    // Find appropriate LOD threshold
    const lodThreshold = this.config.lodThresholds
      .slice()
      .reverse()
      .find(threshold => zoom >= threshold.zoom) || this.config.lodThresholds[0];

    // Priority-based node filtering
    const prioritizedNodes = this.prioritizeNodes(data.nodes, zoom, viewport);
    const visibleNodes = prioritizedNodes.slice(0, Math.min(lodThreshold.maxNodes, this.config.maxVisibleNodes));
    
    // Edge filtering - only include edges between visible nodes
    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    const visibleEdges = data.edges
      .filter(edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
      .slice(0, this.config.maxVisibleEdges);

    // Update performance metrics
    this.performanceMetrics.renderTime = performance.now() - startTime;
    this.performanceMetrics.nodeCount = visibleNodes.length;
    this.performanceMetrics.edgeCount = visibleEdges.length;
    this.performanceMetrics.lastUpdateTime = Date.now();

    return { nodes: visibleNodes, edges: visibleEdges };
  }

  /**
   * Prioritize nodes based on importance, proximity, and zoom level
   */
  private prioritizeNodes(
    nodes: GraphNode[],
    zoom: number,
    viewport: ViewportBounds
  ): GraphNode[] {
    // Node type priority weights
    const typePriority: Record<string, number> = {
      'aws-region': 100,
      'vpc': 90,
      'eks-cluster': 80,
      'rds-instance': 70,
      'ec2-instance': 60,
      'pod': 50,
      'aws-service': 65
    };

    // Status priority weights
    const statusPriority: Record<string, number> = {
      'critical': 100,
      'warning': 80,
      'degraded': 70,
      'healthy': 50,
      'unknown': 30
    };

    // Cost priority (higher cost = higher priority)
    const getCostPriority = (cost?: number): number => {
      if (!cost) return 0;
      if (cost > 100000) return 100;
      if (cost > 50000) return 80;
      if (cost > 10000) return 60;
      if (cost > 1000) return 40;
      return 20;
    };

    return nodes
      .map(node => ({
        ...node,
        priority: (
          (typePriority[node.type] || 50) * 0.4 +
          (statusPriority[node.status] || 50) * 0.3 +
          getCostPriority(node.cost) * 0.2 +
          (Math.random() * 10) // Small random factor for variety
        )
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Create spatial clusters for performance
   */
  createSpatialClusters(
    nodes: GraphNode[],
    viewport: ViewportBounds,
    zoom: number
  ): { clusters: ClusterNode[]; remainingNodes: GraphNode[] } {
    if (nodes.length < this.config.clusteringThreshold) {
      return { clusters: [], remainingNodes: nodes };
    }

    const clusters: ClusterNode[] = [];
    const remainingNodes: GraphNode[] = [];
    
    // Simple grid-based clustering
    const gridSize = Math.max(10, Math.floor(50 / zoom)); // Smaller grids at higher zoom
    const nodeGrid: Map<string, GraphNode[]> = new Map();

    // Distribute nodes into grid cells
    nodes.forEach(node => {
      // Use hash of node ID for consistent positioning
      const hash = this.hashCode(node.id);
      const gridX = Math.floor((hash % 1000) / gridSize);
      const gridY = Math.floor(((hash / 1000) % 1000) / gridSize);
      const gridKey = `${gridX},${gridY}`;
      
      if (!nodeGrid.has(gridKey)) {
        nodeGrid.set(gridKey, []);
      }
      nodeGrid.get(gridKey)!.push(node);
    });

    // Create clusters from grid cells with multiple nodes
    nodeGrid.forEach((gridNodes, gridKey) => {
      if (gridNodes.length > 3) {
        // Create cluster
        const [gridX, gridY] = gridKey.split(',').map(Number);
        
        // Aggregate metrics
        const aggregatedMetrics: Record<string, number> = {};
        gridNodes.forEach(node => {
          Object.entries(node.properties).forEach(([key, value]) => {
            if (typeof value === 'number') {
              aggregatedMetrics[key] = (aggregatedMetrics[key] || 0) + value;
            }
          });
        });

        clusters.push({
          id: `cluster-${gridKey}`,
          label: `${gridNodes.length} ${gridNodes[0].type}s`,
          type: 'cluster',
          children: gridNodes,
          bounds: {
            x1: gridX * gridSize,
            y1: gridY * gridSize,
            x2: (gridX + 1) * gridSize,
            y2: (gridY + 1) * gridSize
          },
          aggregatedMetrics
        });
      } else {
        // Add individual nodes
        remainingNodes.push(...gridNodes);
      }
    });

    this.performanceMetrics.clusterCount = clusters.length;
    
    return { clusters, remainingNodes };
  }

  /**
   * Throttled update handler for real-time changes
   */
  throttledUpdate(updateFn: () => void): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = window.setTimeout(() => {
      updateFn();
      this.updateTimer = null;
    }, this.config.updateThrottleMs);
  }

  /**
   * Batch render nodes for smooth performance
   */
  async batchRenderNodes(
    nodes: GraphNode[],
    renderFn: (batch: GraphNode[]) => Promise<void>
  ): Promise<void> {
    const batches = this.chunkArray(nodes, this.config.renderBatchSize);
    
    for (let i = 0; i < batches.length; i++) {
      await renderFn(batches[i]);
      
      // Yield to browser between batches
      if (i < batches.length - 1) {
        await this.yieldToMain();
      }
    }
  }

  /**
   * Memory usage estimation
   */
  estimateMemoryUsage(data: GraphData): number {
    // Rough estimation in MB
    const nodeSize = 200; // bytes per node (rough estimate)
    const edgeSize = 100; // bytes per edge
    
    const totalBytes = (data.nodes.length * nodeSize) + (data.edges.length * edgeSize);
    return Math.round(totalBytes / 1024 / 1024 * 100) / 100; // MB rounded to 2 decimal places
  }

  /**
   * Performance monitoring and FPS tracking
   */
  startPerformanceMonitoring(onUpdate: (metrics: PerformanceMetrics) => void): () => void {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFrame = () => {
      frameCount++;
      const currentTime = performance.now();
      
      // Update FPS every second
      if (currentTime - lastTime >= 1000) {
        this.performanceMetrics.fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // Estimate memory usage (approximation)
        if ('memory' in performance) {
          this.performanceMetrics.memoryUsage = Math.round(
            (performance as any).memory.usedJSHeapSize / 1024 / 1024
          );
        }
        
        onUpdate({ ...this.performanceMetrics });
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFrame);
    };

    animationId = requestAnimationFrame(measureFrame);

    // Return cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }

  /**
   * Optimize graph layout for performance
   */
  getOptimalLayoutConfig(nodeCount: number, edgeCount: number): any {
    // Choose layout based on graph size
    if (nodeCount > 10000) {
      // For very large graphs, use simple grid layout
      return {
        name: 'grid',
        animate: false,
        fit: true,
        padding: 20,
        avoidOverlap: false // Disable for performance
      };
    } else if (nodeCount > 2000) {
      // For large graphs, use fast cose-bilkent
      return {
        name: 'cose-bilkent',
        animate: false,
        randomize: false,
        numIter: 500,
        tile: true,
        tilingPaddingVertical: 10,
        tilingPaddingHorizontal: 10,
        gravityRangeCompound: 1.5,
        gravityCompound: 1.0,
        gravityRange: 3.8
      };
    } else if (nodeCount > 500) {
      // For medium graphs, use cola
      return {
        name: 'cola',
        animate: false,
        randomize: false,
        maxSimulationTime: 2000,
        edgeLength: 80,
        nodeSpacing: 20,
        flow: { axis: 'y', minSeparation: 30 }
      };
    } else {
      // For small graphs, use full cose-bilkent with animation
      return {
        name: 'cose-bilkent',
        animate: true,
        animationDuration: 1000,
        randomize: false,
        numIter: 1000,
        tile: true,
        quality: 'proof',
        gravityRangeCompound: 1.5,
        gravityCompound: 1.0
      };
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Update performance configuration
   */
  updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Utility: Hash function for consistent node positioning
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Utility: Chunk array into batches
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Utility: Yield control to main thread
   */
  private yieldToMain(): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, 0);
    });
  }

  /**
   * Build spatial index for fast viewport queries
   */
  buildSpatialIndex(nodes: GraphNode[], gridSize: number = 100): void {
    this.spatialIndex.clear();
    
    nodes.forEach(node => {
      // Use consistent positioning based on node hash
      const hash = this.hashCode(node.id);
      const x = hash % 10000;
      const y = Math.floor(hash / 10000) % 10000;
      
      const gridX = Math.floor(x / gridSize);
      const gridY = Math.floor(y / gridSize);
      const gridKey = `${gridX},${gridY}`;
      
      if (!this.spatialIndex.has(gridKey)) {
        this.spatialIndex.set(gridKey, []);
      }
      this.spatialIndex.get(gridKey)!.push(node);
    });
  }

  /**
   * Get nodes within viewport using spatial index
   */
  getNodesInViewport(viewport: ViewportBounds, gridSize: number = 100): GraphNode[] {
    const startGridX = Math.floor(viewport.x1 / gridSize);
    const endGridX = Math.floor(viewport.x2 / gridSize);
    const startGridY = Math.floor(viewport.y1 / gridSize);
    const endGridY = Math.floor(viewport.y2 / gridSize);
    
    const visibleNodes: GraphNode[] = [];
    
    for (let x = startGridX; x <= endGridX; x++) {
      for (let y = startGridY; y <= endGridY; y++) {
        const gridKey = `${x},${y}`;
        const gridNodes = this.spatialIndex.get(gridKey) || [];
        visibleNodes.push(...gridNodes);
      }
    }
    
    return visibleNodes;
  }

  /**
   * Optimize edge rendering based on importance
   */
  optimizeEdgeVisibility(
    edges: GraphEdge[],
    visibleNodeIds: Set<string>,
    zoom: number
  ): GraphEdge[] {
    // Edge importance scoring
    const getEdgeImportance = (edge: GraphEdge): number => {
      const typeWeights: Record<string, number> = {
        'critical': 100,
        'depends_on': 80,
        'contains': 70,
        'connects_to': 50
      };
      
      const baseWeight = typeWeights[edge.type] || 50;
      const weightMultiplier = edge.weight || 1;
      
      return baseWeight * weightMultiplier;
    };

    // Filter and sort edges
    const relevantEdges = edges
      .filter(edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
      .map(edge => ({
        ...edge,
        importance: getEdgeImportance(edge)
      }))
      .sort((a, b) => b.importance - a.importance);

    // Apply zoom-based edge limit
    const maxEdges = Math.floor(this.config.maxVisibleEdges * Math.min(zoom, 2));
    
    return relevantEdges.slice(0, maxEdges);
  }

  /**
   * Generate performance recommendations
   */
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.performanceMetrics.fps < 30) {
      recommendations.push('🔴 Low FPS detected - reduce visible nodes or disable animations');
    }
    
    if (this.performanceMetrics.nodeCount > 5000) {
      recommendations.push('🟡 High node count - consider increasing clustering threshold');
    }
    
    if (this.performanceMetrics.memoryUsage > 500) {
      recommendations.push('🟡 High memory usage - enable more aggressive level-of-detail');
    }
    
    if (this.performanceMetrics.renderTime > 100) {
      recommendations.push('🔴 Slow rendering - reduce max visible elements');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Performance is optimal');
    }
    
    return recommendations;
  }

  /**
   * Auto-tune performance settings based on device capabilities
   */
  autoTunePerformance(): PerformanceConfig {
    // Detect device capabilities
    const isHighEnd = navigator.hardwareConcurrency >= 8;
    const isLowEnd = navigator.hardwareConcurrency <= 2;
    
    // Check for mobile devices
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    let tuningMultiplier = 1.0;
    
    if (isLowEnd || isMobile) {
      tuningMultiplier = 0.5; // Reduce limits for low-end devices
    } else if (isHighEnd) {
      tuningMultiplier = 1.5; // Increase limits for high-end devices
    }
    
    const tunedConfig: PerformanceConfig = {
      ...this.config,
      maxVisibleNodes: Math.floor(this.config.maxVisibleNodes * tuningMultiplier),
      maxVisibleEdges: Math.floor(this.config.maxVisibleEdges * tuningMultiplier),
      clusteringThreshold: Math.floor(this.config.clusteringThreshold * tuningMultiplier),
      renderBatchSize: Math.floor(this.config.renderBatchSize * tuningMultiplier)
    };
    
    this.config = tunedConfig;
    return tunedConfig;
  }

  /**
   * Memory cleanup and garbage collection hints
   */
  cleanup(): void {
    this.spatialIndex.clear();
    this.renderQueue = [];
    
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
    
    // Suggest garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }
  }

  /**
   * Export performance data for analysis
   */
  exportPerformanceData(): string {
    const data = {
      config: this.config,
      metrics: this.performanceMetrics,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory || 'unknown'
    };
    
    return JSON.stringify(data, null, 2);
  }
}

export default GraphPerformanceManager;