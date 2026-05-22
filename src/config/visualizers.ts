export interface VisualizerConfig {
  id: string;
  title: string;
  description: string;
  category: 'cloud' | 'networking' | 'algorithms' | 'data-structures';
  tags: string[];
  path: string;
  icon: string;
  comingSoon?: boolean;
  author?: string;
  lastUpdated?: string;
}

export const visualizerRegistry: VisualizerConfig[] = [
  {
    id: 'alb-nlb',
    title: 'ALB vs NLB Stickiness',
    description: 'Understand load balancer stickiness mechanisms - cookies vs flow hashing',
    category: 'cloud',
    tags: ['AWS', 'Load Balancing', 'Cloud'],
    path: '/visualizers/alb-nlb',
    icon: '🍪',
    lastUpdated: '2025-01-20',
  },
  {
    id: 'asg',
    title: 'ASG Auto Scaling Group',
    description: 'Explore Auto Scaling Groups, health checks, and scale policies with an interactive model',
    category: 'cloud',
    tags: ['AWS', 'Auto Scaling', 'Cloud'],
    path: '/visualizers/asg',
    icon: '📈',
    lastUpdated: '2026-05-22',
  },
  {
    id: 'rds',
    title: 'AWS RDS',
    description: 'Diagrams and simulation for RDS connectivity, Multi-AZ, and read replicas',
    category: 'cloud',
    tags: ['AWS', 'RDS', 'Databases'],
    path: '/visualizers/rds',
    icon: '🛢️',
    lastUpdated: '2026-05-22',
  },
  {
    id: 'aurora',
    title: 'Amazon Aurora',
    description: 'Aurora architecture, serverless ACU simulation, and failover playbook',
    category: 'cloud',
    tags: ['AWS', 'Aurora', 'Databases'],
    path: '/visualizers/aurora',
    icon: '🌌',
    lastUpdated: '2026-05-22',
  },
  // Add more visualizers here as you create them
];

export const getVisualizerById = (id: string) => {
  return visualizerRegistry.find((viz) => viz.id === id);
};

export const getVisualizersByCategory = (category: string) => {
  return visualizerRegistry.filter((viz) => viz.category === category);
};
