/**
 * Infrastructure Graph Data Service
 * Handles efficient loading and management of large-scale infrastructure graphs
 */

import axios from 'axios';

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  category: string;
  status: string;
  cost?: number;
  properties: Record<string, any>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight?: number;
  properties: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    categories: string[];
    lastUpdated: string;
  };
}

export interface GraphLevel {
  level: number;
  name: string;
  nodeTypes: string[];
  maxNodes: number;
  description: string;
}

class InfrastructureGraphService {
  private baseUrl: string;
  private cache: Map<string, GraphData>;
  private levels: GraphLevel[];

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    
    // Define hierarchical levels for level-of-detail rendering
    this.levels = [
      {
        level: 0,
        name: 'Global Overview',
        nodeTypes: ['aws-region'],
        maxNodes: 10,
        description: 'AWS regions and global infrastructure'
      },
      {
        level: 1,
        name: 'Regional Infrastructure',
        nodeTypes: ['aws-region', 'vpc'],
        maxNodes: 50,
        description: 'Regional view with VPCs'
      },
      {
        level: 2,
        name: 'VPC Services',
        nodeTypes: ['aws-region', 'vpc', 'eks-cluster', 'rds-instance'],
        maxNodes: 200,
        description: 'Major services within VPCs'
      },
      {
        level: 3,
        name: 'Service Details',
        nodeTypes: ['vpc', 'eks-cluster', 'rds-instance', 'ec2-instance', 'aws-service'],
        maxNodes: 1000,
        description: 'Detailed service topology'
      },
      {
        level: 4,
        name: 'Full Infrastructure',
        nodeTypes: ['aws-region', 'vpc', 'eks-cluster', 'pod', 'rds-instance', 'ec2-instance', 'aws-service'],
        maxNodes: 5000,
        description: 'Complete infrastructure view'
      }
    ];
  }

  /**
   * Get infrastructure graph data with level-of-detail filtering
   */
  async getInfrastructureGraph(level: number = 2, category?: string): Promise<GraphData> {
    const cacheKey = `graph-${level}-${category || 'all'}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      // Return cached if less than 5 minutes old
      const cacheAge = Date.now() - new Date(cached.metadata.lastUpdated).getTime();
      if (cacheAge < 5 * 60 * 1000) {
        return cached;
      }
    }

    try {
      const params = new URLSearchParams({
        level: level.toString(),
        max_nodes: this.levels[level]?.maxNodes.toString() || '1000'
      });
      
      if (category) {
        params.append('category', category);
      }

      const response = await axios.get(`${this.baseUrl}/api/infrastructure/graph?${params}`);
      const graphData: GraphData = response.data;

      // Cache the result
      this.cache.set(cacheKey, graphData);

      return graphData;
    } catch (error) {
      console.error('Failed to fetch infrastructure graph:', error);
      
      // Return fallback data
      return this.generateFallbackData(level);
    }
  }

  /**
   * Get detailed node information with children
   */
  async getNodeDetails(nodeId: string): Promise<{
    node: GraphNode;
    children: GraphNode[];
    dependencies: GraphEdge[];
    metrics: Record<string, any>;
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/infrastructure/nodes/${nodeId}/details`);
      return response.data;
    } catch (error) {
      console.error(`Failed to fetch node details for ${nodeId}:`, error);
      throw error;
    }
  }

  /**
   * Search nodes by query with fuzzy matching
   */
  async searchNodes(query: string, limit: number = 50): Promise<GraphNode[]> {
    try {
      const params = new URLSearchParams({
        query,
        limit: limit.toString()
      });

      const response = await axios.get(`${this.baseUrl}/api/infrastructure/search?${params}`);
      return response.data.nodes;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Get graph performance metrics
   */
  async getGraphMetrics(): Promise<{
    totalNodes: number;
    totalEdges: number;
    nodesByType: Record<string, number>;
    edgesByType: Record<string, number>;
    performanceStats: {
      avgQueryTime: number;
      memoryUsage: number;
      cacheHitRate: number;
    };
  }> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/infrastructure/metrics`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch graph metrics:', error);
      throw error;
    }
  }

  /**
   * Get nodes within a specific boundary (for viewport-based loading)
   */
  async getNodesInBounds(
    x1: number, y1: number, x2: number, y2: number, 
    zoom: number, maxNodes: number = 1000
  ): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
    try {
      const params = new URLSearchParams({
        x1: x1.toString(),
        y1: y1.toString(),
        x2: x2.toString(),
        y2: y2.toString(),
        zoom: zoom.toString(),
        max_nodes: maxNodes.toString()
      });

      const response = await axios.get(`${this.baseUrl}/api/infrastructure/bounds?${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch bounded nodes:', error);
      return { nodes: [], edges: [] };
    }
  }

  /**
   * Get dependency path between two nodes
   */
  async getDependencyPath(sourceId: string, targetId: string): Promise<{
    path: GraphNode[];
    edges: GraphEdge[];
    criticalPath: boolean;
    impactScore: number;
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/infrastructure/dependency-path/${sourceId}/${targetId}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch dependency path:', error);
      throw error;
    }
  }

  /**
   * Update node status (for demo scenarios)
   */
  async updateNodeStatus(nodeId: string, status: string, properties?: Record<string, any>): Promise<void> {
    try {
      await axios.patch(`${this.baseUrl}/api/infrastructure/nodes/${nodeId}/status`, {
        status,
        properties: properties || {}
      });
      
      // Clear relevant cache entries
      this.clearCacheByPattern(`graph-`);
    } catch (error) {
      console.error(`Failed to update node status for ${nodeId}:`, error);
      throw error;
    }
  }

  /**
   * Generate fallback data for offline/error scenarios
   */
  private generateFallbackData(level: number): GraphData {
    const levelConfig = this.levels[level] || this.levels[2];
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    // Generate sample nodes based on level
    if (levelConfig.nodeTypes.includes('aws-region')) {
      nodes.push({
        id: 'us-east-1',
        label: 'US East 1',
        type: 'aws-region',
        category: 'infrastructure',
        status: 'healthy',
        properties: { region: 'us-east-1', availability_zones: 6 }
      });
    }

    if (levelConfig.nodeTypes.includes('vpc')) {
      nodes.push({
        id: 'vpc-trading',
        label: 'Trading VPC',
        type: 'vpc',
        category: 'network',
        status: 'healthy',
        properties: { cidr: '10.0.0.0/16', region: 'us-east-1' }
      });
      
      edges.push({
        id: 'edge-region-vpc',
        source: 'us-east-1',
        target: 'vpc-trading',
        type: 'contains',
        properties: {}
      });
    }

    if (levelConfig.nodeTypes.includes('eks-cluster')) {
      nodes.push({
        id: 'eks-trading-prod',
        label: 'Trading Prod',
        type: 'eks-cluster',
        category: 'compute',
        status: 'healthy',
        cost: 45000,
        properties: { version: '1.27', nodes: 15 }
      });
      
      if (nodes.find(n => n.id === 'vpc-trading')) {
        edges.push({
          id: 'edge-vpc-eks',
          source: 'vpc-trading',
          target: 'eks-trading-prod',
          type: 'contains',
          properties: {}
        });
      }
    }

    return {
      nodes,
      edges,
      metadata: {
        totalNodes: nodes.length,
        totalEdges: edges.length,
        categories: [...new Set(nodes.map(n => n.category))],
        lastUpdated: new Date().toISOString()
      }
    };
  }

  /**
   * Clear cache entries matching a pattern
   */
  private clearCacheByPattern(pattern: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Get available graph levels
   */
  getAvailableLevels(): GraphLevel[] {
    return [...this.levels];
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    entries: number;
    totalSize: number;
    hitRate: number;
  } {
    let totalSize = 0;
    for (const [key, data] of this.cache.entries()) {
      totalSize += JSON.stringify(data).length;
    }

    return {
      entries: this.cache.size,
      totalSize,
      hitRate: 0.85 // Placeholder - would be tracked in real implementation
    };
  }
}

// Create singleton instance
export const infrastructureGraphService = new InfrastructureGraphService();
export default InfrastructureGraphService;