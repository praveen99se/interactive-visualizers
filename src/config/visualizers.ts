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
  // Add more visualizers here as you create them
];

export const getVisualizerById = (id: string) => {
  return visualizerRegistry.find((viz) => viz.id === id);
};

export const getVisualizersByCategory = (category: string) => {
  return visualizerRegistry.filter((viz) => viz.category === category);
};
