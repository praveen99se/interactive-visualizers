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
  {
    id: 'elasticache',
    title: 'AWS ElastiCache',
    description: 'In-memory caching overview, Redis vs Memcached parameters, and cache simulator',
    category: 'cloud',
    tags: ['AWS', 'ElastiCache', 'Caching'],
    path: '/visualizers/elasticache',
    icon: '⚡',
    lastUpdated: '2026-05-23',
  },
  {
    id: 'route53',
    title: 'AWS Route 53',
    description: 'Explore DNS resolution hierarchy, interactive routing policies, health checks, and VPC private zones',
    category: 'cloud',
    tags: ['AWS', 'DNS', 'Networking'],
    path: '/visualizers/route53',
    icon: '🌐',
    lastUpdated: '2026-05-23',
  },
  {
    id: 'ec2',
    title: 'AWS EC2',
    description: 'Interactive simulations of EC2 instances, User Data, Security Groups, Spot Fleets, EBS vs EFS, and lifecycles',
    category: 'cloud',
    tags: ['AWS', 'Compute', 'EC2'],
    path: '/visualizers/ec2',
    icon: '💻',
    lastUpdated: '2026-05-24',
  },
  {
    id: 's3',
    title: 'AWS S3',
    description: 'Interactive diagrams and simulations for S3 buckets, object versioning, bucket policies, SSE encryption, lifecycle tiering, replication, and performance.',
    category: 'cloud',
    tags: ['AWS', 'Storage', 'S3'],
    path: '/visualizers/s3',
    icon: '🪣',
    lastUpdated: '2026-05-25',
  },
  {
    id: 'cloudfront',
    title: 'AWS CloudFront',
    description: 'Explore global edge content delivery, origin integrations (S3 OAC vs ALB VPC Origin), geo-restriction boundaries, cache invalidation pipelines, and an interactive global request routing simulator.',
    category: 'cloud',
    tags: ['AWS', 'CloudFront', 'Caching', 'Networking'],
    path: '/visualizers/cloudfront',
    icon: '⚡',
    lastUpdated: '2026-05-26',
  },
  {
    id: 'storage-fs',
    title: 'Shared Filesystems & FSx',
    description: 'Explore POSIX file systems and the four Amazon FSx engines: Windows File Server (Single vs Multi-AZ), Lustre (HPC S3 integration), NetApp ONTAP, and OpenZFS via a dynamic multi-scenario simulation.',
    category: 'cloud',
    tags: ['AWS', 'Storage', 'FSx', 'Infrastructure'],
    path: '/visualizers/storage-fs',
    icon: '📂',
    lastUpdated: '2026-05-26',
  },
  {
    id: 'integration-messaging',
    title: 'AWS Integration & Messaging',
    description: 'Deep-dive SQS queues, SNS Pub/Sub filtering, SQS+SNS Fanout configurations, Kinesis Streams & Firehose ingestion, and ActiveMQ/RabbitMQ protocols via an interactive message flow simulator.',
    category: 'cloud',
    tags: ['AWS', 'Messaging', 'Integration', 'Queues'],
    path: '/visualizers/integration-messaging',
    icon: '✉️',
    lastUpdated: '2026-05-26',
  },
  {
    id: 'elastic-containers',
    title: 'AWS Containers & Kubernetes',
    description: 'Deep dive into Docker vs VMs, Amazon ECS (EC2 vs Fargate), ECR registries, EKS Kubernetes, App Runner, and App2Container architectures with interactive models.',
    category: 'cloud',
    tags: ['AWS', 'Containers', 'ECS', 'EKS', 'ECR', 'Docker', 'Fargate'],
    path: '/visualizers/elastic-containers',
    icon: '📦',
    lastUpdated: '2026-05-28',
  },
  {
    id: 'governance-identity',
    title: 'AWS Governance & Identity',
    description: 'Master AWS Governance, Identity, and resource policy boundaries. Simulate AWS Organizations/OUs, Service Control Policies (SCPs), the multi-stage IAM Policy Evaluation Engine, SSO AD Group-to-Permission Sync, and AWS Control Tower landing zones.',
    category: 'cloud',
    tags: ['AWS', 'Organizations', 'SCPs', 'IAM', 'Active Directory', 'Control Tower'],
    path: '/visualizers/governance-identity',
    icon: '🔑',
    lastUpdated: '2026-05-31',
  },
  {
    id: 'secrets-kms',
    title: 'AWS Secrets & KMS Cryptographic Encryption',
    description: 'Master AWS KMS keys, key policies, SSM Parameter Store standard/advanced secure parameters, envelope client-side encryption, and global multi-region replication topologies (DynamoDB Global Tables local decryptions, S3 CRR Bucket Keys, shared AMIs).',
    category: 'cloud',
    tags: ['AWS', 'KMS', 'SSM Parameter Store', 'Secrets Manager', 'Encryption', 'Multi-Region Keys'],
    path: '/visualizers/secrets-kms',
    icon: '🔑',
    lastUpdated: '2026-05-31',
  },
  {
    id: 'network-security',
    title: 'AWS Edge Security & DDoS Resilience',
    description: 'Master AWS edge security and threat intelligence layers. Explore ACM certificate validations, ALB permanent HTTP-to-HTTPS listeners rules, API Gateway WAF WebACL rate limiting, Shield Advanced edge mitigation topologies, and deep GuardDuty, Inspector & Macie scanning telemetry.',
    category: 'cloud',
    tags: ['ACM', 'WAF WebACL', 'Shield Advanced', 'DDoS Mitigation', 'GuardDuty & Macie'],
    path: '/visualizers/network-security',
    icon: '🛡️',
    lastUpdated: '2026-05-31',
  },
  {
    id: 'networking-vpc',
    title: 'AWS Networking & VPC Sandbox',
    description: 'Master VPC subnetting calculators, public/private IP address ranges, Internet Gateways (IGW), stateful Security Groups vs stateless NACLs with Ephemeral port mappings, Gateway/Interface PrivateLink endpoints, and BGP redundant hybrid VPN tunnels with parsed Flow Log telemetry.',
    category: 'cloud',
    tags: ['VPC', 'Subnets', 'Security Groups', 'NACLs', 'VPN', 'PrivateLink'],
    path: '/visualizers/networking-vpc',
    icon: '🌐',
    lastUpdated: '2026-05-31',
  },
  // Add more visualizers here as you create them
];

export const getVisualizerById = (id: string) => {
  return visualizerRegistry.find((viz) => viz.id === id);
};

export const getVisualizersByCategory = (category: string) => {
  return visualizerRegistry.filter((viz) => viz.category === category);
};
