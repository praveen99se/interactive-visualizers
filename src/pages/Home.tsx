import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { nodeDetails, qaData } from '../data/homeData';
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  Database, 
  Globe, 
  Cpu, 
  Folder, 
  BookOpen,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  Inbox,
  Terminal,
  Activity,
  Server,
  Check,
  Code,
  ExternalLink,
  HelpCircle,
  Copy
} from 'lucide-react';

interface VisualizerItem {
  id: string;
  title: string;
  description: string;
  tags: string[];
  category: 'compute' | 'networking' | 'databases' | 'storage' | 'integration';
  path: string;
  icon: string;
  comingSoon?: boolean;
}

const visualizers: VisualizerItem[] = [
  {
    id: 'ec2',
    title: '💻 AWS EC2',
    description: 'Simulations of virtual compute instances, bootstrapping scripts, security groups, spot markets, placement groups, and EBS vs EFS',
    tags: ['Virtual Servers', 'EBS vs EFS', 'Placement Groups'],
    category: 'compute',
    path: '/visualizers/ec2',
    icon: '💻',
  },
  {
    id: 'load-balancer',
    title: '⚖️ Load Balancer',
    description: 'Understand load balancer stickiness mechanisms - cookies vs flow hashing',
    tags: ['Load Balancing', 'HTTP/TCP', 'High Availability'],
    category: 'networking',
    path: '/visualizers/load-balancer',
    icon: '⚖️',
  },
  {
    id: 'asg',
    title: '📈 ASG Auto Scaling Group',
    description: 'Visualize how ASG scales EC2 instances and integrates with load balancers',
    tags: ['EC2 Auto Scaling', 'Target Tracking', 'Cooldowns'],
    category: 'compute',
    path: '/visualizers/asg',
    icon: '📈',
  },
  {
    id: 'rds',
    title: '🛢️ AWS RDS',
    description: 'Diagrams and a live model for RDS Multi-AZ and read replicas',
    tags: ['Relational DB', 'Failover Playbook', 'Replicas'],
    category: 'databases',
    path: '/visualizers/rds',
    icon: '🛢️',
  },
  {
    id: 'aurora',
    title: '🌌 Amazon Aurora',
    description: 'Aurora architecture, serverless ACU simulation, and failover playbook',
    tags: ['Cloud-Native DB', 'ACU Autoscaling', 'Storage Engine'],
    category: 'databases',
    path: '/visualizers/aurora',
    icon: '🌌',
  },
  {
    id: 'elasticache',
    title: '⚡ AWS ElastiCache',
    description: 'Explore ElastiCache, Redis vs Memcached, and an interactive cache request simulator',
    tags: ['In-Memory Caching', 'Write-Through', 'Redis Cluster'],
    category: 'databases',
    path: '/visualizers/elasticache',
    icon: '⚡',
  },
  {
    id: 'route53',
    title: '🌐 AWS Route 53',
    description: 'Explore DNS resolution hierarchy, interactive routing policies, health checks, and VPC private zones',
    tags: ['Global DNS Router', 'Routing Policies', 'Health Checks'],
    category: 'networking',
    path: '/visualizers/route53',
    icon: '🌐',
  },
  {
    id: 's3',
    title: '🪣 AWS S3',
    description: 'Interactive diagrams and simulations for S3 buckets, object versioning, bucket policies, SSE encryption, lifecycle tiering, replication, and performance',
    tags: ['Object Storage', 'Lifecycle Policies', 'SSE Encryption'],
    category: 'storage',
    path: '/visualizers/s3',
    icon: '🪣',
  },
  {
    id: 'cloudfront',
    title: '⚡ Amazon CloudFront',
    description: 'Explore global edge content delivery, origin integrations (S3 OAC vs ALB VPC Origin), geo-restriction boundaries, cache invalidation pipelines, and global request routing',
    tags: ['Global CDN Cache', 'OAC Security', 'Origins'],
    category: 'networking',
    path: '/visualizers/cloudfront',
    icon: '⚡',
  },
  {
    id: 'storage-fs',
    title: '📂 Shared Filesystems & FSx',
    description: 'Explore POSIX file systems and the four Amazon FSx engines: Windows File Server (Single vs Multi-AZ), Lustre (HPC S3 integration), NetApp ONTAP, and OpenZFS via a dynamic multi-scenario simulation',
    tags: ['Shared File Storage', 'FSx Engines', 'POSIX Compliant'],
    category: 'storage',
    path: '/visualizers/storage-fs',
    icon: '📂',
  },
  {
    id: 'integration-messaging',
    title: '✉️ AWS Integration & Messaging',
    description: 'Deep-dive SQS queues, SNS Pub/Sub filtering, SQS+SNS Fanout configurations, Kinesis Streams & Firehose ingestion, and ActiveMQ/RabbitMQ protocols via an interactive message flow simulator',
    tags: ['Decoupled Pipelines', 'Message Queues', 'Pub/Sub Fanout'],
    category: 'integration',
    path: '/visualizers/integration-messaging',
    icon: '✉️',
  },
  {
    id: 'elastic-containers',
    title: '📦 AWS Containers & Kubernetes',
    description: 'Deep-dive into Docker vs VMs, Amazon ECS (EC2 vs Fargate), ECR registries, EKS Kubernetes, App Runner, and App2Container architectures with interactive models',
    tags: ['ECS Task Blades', 'EKS Kubernetes', 'Fargate Compute'],
    category: 'compute',
    path: '/visualizers/elastic-containers',
    icon: '📦',
  },
  {
    id: 'serverless',
    title: '⚡ AWS Serverless & Lambda',
    description: 'Master serverless architectures. Explore Lambda core triggers, concurrency limit throttling, SnapStart timelines, Edge compute (CloudFront Functions vs Lambda@Edge), secure VPC RDS Proxy pooling, and a dynamic scaling simulator',
    tags: ['Lambda Triggers', 'VPC RDS Proxy', 'Edge Compute'],
    category: 'compute',
    path: '/visualizers/serverless',
    icon: '⚡',
  },
  {
    id: 'databases-analytics',
    title: '🗄️ AWS Databases & Analytics',
    description: 'Master AWS database & analytics paradigms. Compare RDBMS, NoSQL, DocumentDB, ElastiCache systems, S3 Analytics pipelines (Glue Crawlers, Athena Serverless, Redshift Data Warehouses, EMR Spark compute), and specialized Graph (Neptune) or Ledger indexes',
    tags: ['Big Data Ingestion', 'SQL Analytics Athena', 'Redshift Clusters'],
    category: 'integration',
    path: '/visualizers/databases-analytics',
    icon: '🗄️',
  },
  {
    id: 'cloudwatch-events',
    title: '🛡️ Observability, Events & Audit',
    description: 'Explore AWS observability & systems governance. Simulate Log Ingest pipelines, SQL-like Logs Insights queries, threshold Alarms, real-time Metric Streams, EventBridge event routing, and CloudTrail / Config compliance remediations.',
    tags: ['CloudWatch Logs', 'EventBridge Bus', 'Trail Audit & Config'],
    category: 'integration',
    path: '/visualizers/cloudwatch-events',
    icon: '🛡️',
  },
  {
    id: 'governance-identity',
    title: '🔑 Governance & Identity',
    description: 'Master AWS Governance, Identity, and resource policy boundaries. Simulate AWS Organizations/OUs, Service Control Policies (SCPs), the multi-stage IAM Policy Evaluation Engine, SSO AD Group-to-Permission Sync, and AWS Control Tower landing zones.',
    tags: ['Organizations & SCPs', 'IAM Evaluation Tree', 'IAM Identity Center & AD', 'Control Tower Guardrails'],
    category: 'integration',
    path: '/visualizers/governance-identity',
    icon: '🔑',
  },
  {
    id: 'secrets-kms',
    title: '🔑 Secrets & KMS Cryptographic Encryption',
    description: 'Master AWS KMS keys, key policies, SSM Parameter Store Standard vs Advanced parameters, envelope client-side encryption, and global multi-region replication topologies (DynamoDB Global Tables local decryptions, S3 CRR Bucket Keys, shared AMIs).',
    tags: ['KMS Key Policies', 'SSM SecureString', 'Envelope Encryption', 'Multi-Region MRK Replicas'],
    category: 'integration',
    path: '/visualizers/secrets-kms',
    icon: '🔑',
  },
  {
    id: 'network-security',
    title: '🛡️ AWS Edge Security & DDoS Resilience',
    description: 'Master AWS edge security and threat intelligence layers. Explore ACM certificate validations, ALB permanent HTTP-to-HTTPS listener rules, API Gateway WAF WebACL rate limiting, Shield Advanced edge mitigation topologies, and deep GuardDuty, Inspector & Macie scanning telemetry.',
    tags: ['ACM Certs', 'WAF WebACL Rules', 'Shield Advanced', 'Volumetric DDoS mitigations', 'GuardDuty & Macie'],
    category: 'networking',
    path: '/visualizers/network-security',
    icon: '🛡️',
  },
  {
    id: 'networking-vpc',
    title: '🌐 AWS Networking & VPC Sandbox',
    description: 'Master VPC subnetting calculators, public/private IP address ranges, Internet Gateways (IGW), stateful Security Groups vs stateless NACLs with Ephemeral port mappings, Gateway/Interface PrivateLink endpoints, and BGP redundant hybrid VPN tunnels with parsed Flow Log telemetry.',
    tags: ['CIDR Subnets', 'NAT & Bastion HA', 'Stateful vs Stateless', 'VPC Endpoints & Peering', 'Flow Logs & VPN Tunnels'],
    category: 'networking',
    path: '/visualizers/networking-vpc',
    icon: '🌐',
  },
  {
    id: 'disaster-recovery',
    title: '🔄 AWS Disaster Recovery & Migration',
    description: 'Master AWS Disaster Recovery strategies (Backup/Restore, Pilot Light, Warm Standby, Multi-Site/Hot Site), multi-region active failovers, DMS continuous replication, RDS & Aurora MySQL migrations, and AWS Backup Vault Lock.',
    tags: ['Disaster Recovery', 'DMS', 'AWS Backup', 'Vault Lock', 'Multi-Region', 'Failover'],
    category: 'integration',
    path: '/visualizers/disaster-recovery',
    icon: '🔄',
  },
  {
    id: 'operations-ml',
    title: '⚙️ AWS Operations, Management & Machine Learning',
    description: 'Master AWS CloudFormation stack rollbacks, SSM Session/Patch/Automation operations, Cost Explorer reports, Outposts & Batch job queues, SES/Pinpoint campaign delivery pipelines, and dynamic SageMaker ML model deployments.',
    tags: ['CloudFormation IaC', 'SSM Session & Patch', 'Cost Explorer', 'SES SMTP & Pinpoint', 'SageMaker & AWS ML APIs', 'AWS Batch & Outposts'],
    category: 'integration',
    path: '/visualizers/operations-ml',
    icon: '⚙️',
  },
];

interface Scenario {
  id: string;
  icon: string;
  title: string;
  problem: string;
  solution: string;
  links: { name: string; path: string }[];
}

const scenarios: Scenario[] = [
  {
    id: 'db-scaling',
    icon: '🛢️',
    title: 'My database is bottlenecked and timing out under heavy read queries',
    problem: 'Relational databases experience query latency spikes when massive select traffic exhausts connection pools, locks shared pages, or saturates storage IOPS.',
    solution: 'Scale compute horizontally with Amazon RDS Read Replicas or transition to Amazon Aurora Serverless with native ACU auto-scaling clusters, and deploy Amazon ElastiCache (Redis) write-through layers to intercept repeat queries before hitting primary storage.',
    links: [
      { name: '🌌 Amazon Aurora Serverless ACU Sandbox', path: '/visualizers/aurora' },
      { name: '⚡ AWS ElastiCache Request Cache Simulator', path: '/visualizers/elasticache' },
      { name: '🛢️ AWS RDS Failover & Read Replica Model', path: '/visualizers/rds' }
    ]
  },
  {
    id: 'iot-streaming',
    icon: '✉️',
    title: 'I need to safely ingest, process, and store millions of high-frequency events',
    problem: 'Bursty data streams from applications or IoT sensors will overwhelm downstream processing systems, causing lost packets, buffer overruns, and severe system saturation.',
    solution: 'Decouple ingestion pipelines using highly scalable SQS message queues and SNS publish/subscribe fanout patterns, or capture streaming data using Kinesis Streams buffer logs to stream smoothly into Amazon Athena SQL layers via AWS Glue.',
    links: [
      { name: '✉️ AWS Messaging Queues & Streams Workbench', path: '/visualizers/integration-messaging' },
      { name: '🗄️ AWS Analytics Ingestion Pipelines (Glue/Athena)', path: '/visualizers/databases-analytics' }
    ]
  },
  {
    id: 'container-scaling',
    icon: '📦',
    title: 'My application takes too long to spin up tasks and scale out under sudden traffic spikes',
    problem: 'Standard monolithic deployments on slow VM bootstrap configurations increase boot latencies, failing to meet rapid scaling demands while connections start dropping.',
    solution: 'Convert workloads into microservices utilizing Docker containers. Deploy ECS capacity providers backed by AWS Fargate for serverless speed, or configure Amazon EKS to manage elastic container networks running inside auto-scaling node groups.',
    links: [
      { name: '📦 AWS ECS/EKS Container Workbench', path: '/visualizers/elastic-containers' },
      { name: '📈 EC2 Auto Scaling Target Tracking Simulator', path: '/visualizers/asg' }
    ]
  },
  {
    id: 'global-latency',
    icon: '🌐',
    title: 'Global users experience high latency when accessing my central application',
    problem: 'Physical distance creates geographic propagation latency, while repeated asset retrieval exhausts backend bandwidth, exposing systems to direct bot attacks.',
    solution: 'Deploy Amazon CloudFront to serve edge-cached assets globally, leverage S3 Object Access Control (OAC) to secure the storage origins, and configure Route 53 health checks and geoproximity routing.',
    links: [
      { name: '⚡ Amazon CloudFront Global CDN Sandbox', path: '/visualizers/cloudfront' },
      { name: '🌐 AWS Route 53 DNS Policy Router', path: '/visualizers/route53' }
    ]
  },
  {
    id: 'high-perf-fs',
    icon: '📂',
    title: 'I need high-throughput concurrent shared file mounts for HPC/Linux clusters',
    problem: 'Object storage lacks native POSIX file lock performance, and attaching single block drives simultaneously across massive server groups is not natively supported.',
    solution: 'Provision a high-performance Amazon FSx shared filesystem. Deploy FSx for Lustre for sub-millisecond HPC pipelines or FSx for NetApp ONTAP to manage native SMB/NFS file mounts.',
    links: [
      { name: '📂 POSIX Shared Filesystems & FSx Explorer', path: '/visualizers/storage-fs' },
      { name: '💻 AWS EC2 EBS vs EFS Sandbox', path: '/visualizers/ec2' }
    ]
  },
  {
    id: 'hybrid-failover',
    icon: '🌐',
    title: 'I need a failover system between my AWS VPC resources and my on-prem datacenter',
    problem: 'Catastrophic cloud outages or on-prem fiber breaks interrupt connections, leading to severe downtime for customers accessing mission-critical transaction gateways.',
    solution: 'Establish Amazon Route 53 DNS active-passive failover policies. Configure HTTP Health Checks to probe VPC Application Load Balancers. Reroute requests to the secondary on-premises gateway within seconds of VPC outages.',
    links: [
      { name: '🌐 AWS Route 53 DNS Policy Router', path: '/visualizers/route53' },
      { name: '💻 AWS EC2 Virtual Compute Clusters', path: '/visualizers/ec2' }
    ]
  },
  {
    id: 'edge-security',
    icon: '🛡️',
    title: 'My application endpoints are exposed to DDoS attacks and malicious Layer-7 HTTP floods',
    problem: 'Direct internet-facing load balancers and servers suffer under Layer-7 HTTP flood spikes, SQL injections, and cross-site scripting (XSS) bot attacks.',
    solution: 'Protect resources at the Edge. Front your ALB with an Amazon CloudFront CDN distribution secured with AWS WAF Web Access Control lists to block malicious patterns, rate-limit spam requests, and deploy AWS Shield for Layer-3/4 DDoS protection.',
    links: [
      { name: '⚡ Amazon CloudFront Global CDN Sandbox', path: '/visualizers/cloudfront' },
      { name: '⚖️ Load Balancer Topologies', path: '/visualizers/load-balancer' }
    ]
  },
  {
    id: 'data-warehouse',
    icon: '🗄️',
    title: 'I need real-time analytics, schema extraction, and OLAP data warehousing at scale',
    problem: 'Direct heavy BI analytical aggregation queries on operational transactional databases lock active tables, leading to query failures in customer-facing apps.',
    solution: 'Buffer transactional raw logs in S3 buckets. Auto-extract schemas using AWS Glue Crawlers, execute ad-hoc serverless SQL queries in Amazon Athena, catalog in Lake Formation, and aggregate datasets in an Amazon Redshift Data Warehouse for BI reports in QuickSight.',
    links: [
      { name: '🗄️ AWS Databases & Analytics Pipelines', path: '/visualizers/databases-analytics' },
      { name: '🪣 AWS S3 Object Data Lake Storage', path: '/visualizers/s3' }
    ]
  },
  {
    id: 'disaster-resilience',
    icon: '🔄',
    title: 'I need a secure database migration strategy and multi-region disaster recovery plan resilient to ransomware',
    problem: 'Catastrophic failures in a single region disrupt user sessions and take databases offline. Furthermore, malicious agents compromising root credentials can execute irreversible backups deletions, leaving data completely unrecoverable.',
    solution: 'Implement Database Migration Service (DMS) with continuous replication (CDC) to move databases to Amazon Aurora MySQL with zero-downtime, design a Route 53 multi-region DNS active failover architecture, and configure AWS Backup Vault Lock in rigid Compliance Mode to prevent unauthorized recovery point deletions.',
    links: [
      { name: '🔄 AWS Disaster Recovery & Migration Workbench', path: '/visualizers/disaster-recovery' },
      { name: '🌐 AWS Route 53 Multi-Region Failover Architecture', path: '/visualizers/route53' }
    ]
  }
];

export default function Home({ isDarkTheme }: { isDarkTheme: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  // Unified Simulation Mode
  const [simMode, setSimMode] = useState<'normal' | 'spike' | 'ddos' | 'failover' | 'outage'>('normal');

  // Node Inspector Selection
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Q&A Explorer States
  const [activeQaTab, setActiveQaTab] = useState<'compute' | 'networking' | 'database' | 'security' | 'storage' | 'integration'>('compute');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Copy indicators
  const [copiedNodeId, setCopiedNodeId] = useState<string | null>(null);
  
  // Backwards compatibility mappings for older SVGs
  const simSpikeActive = simMode === 'spike';
  const simFailoverActive = simMode === 'failover';
  const simSecAttackActive = simMode === 'ddos';

  // Live Telemetry States
  const [metrics, setMetrics] = useState({
    rps: 4200,
    latency: 24,
    cpu: 18,
    sessions: 1480,
    dbIops: 450,
    cacheHit: 88,
  });

  // Console Log stream
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

  // Fluctuating telemetry metrics based on active simulation mode
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(() => {
        let targetRps = 4200;
        let targetLatency = 24;
        let targetCpu = 18;
        let targetSessions = 1480;
        let targetDbIops = 450;
        let targetCacheHit = 88;

        if (simMode === 'normal') {
          targetRps = 4000 + Math.floor(Math.random() * 400);
          targetLatency = 20 + Math.random() * 6;
          targetCpu = 12 + Math.random() * 6;
          targetSessions = 1400 + Math.floor(Math.random() * 100);
          targetDbIops = 400 + Math.floor(Math.random() * 80);
          targetCacheHit = 86 + Math.floor(Math.random() * 4);
        } else if (simMode === 'spike') {
          targetRps = 14000 + Math.floor(Math.random() * 1200);
          targetLatency = 54 + Math.random() * 12;
          targetCpu = 76 + Math.random() * 8;
          targetSessions = 4500 + Math.floor(Math.random() * 300);
          targetDbIops = 2700 + Math.floor(Math.random() * 250);
          targetCacheHit = 95 + Math.floor(Math.random() * 2);
        } else if (simMode === 'ddos') {
          targetRps = 88000 + Math.floor(Math.random() * 4000);
          targetLatency = 14 + Math.random() * 4;
          targetCpu = 8 + Math.random() * 4;
          targetSessions = 48000 + Math.floor(Math.random() * 1500);
          targetDbIops = 420 + Math.floor(Math.random() * 40);
          targetCacheHit = 92 + Math.floor(Math.random() * 3);
        } else if (simMode === 'failover') {
          targetRps = 3800 + Math.floor(Math.random() * 250);
          targetLatency = 110 + Math.random() * 12;
          targetCpu = 28 + Math.random() * 6;
          targetSessions = 1420 + Math.floor(Math.random() * 60);
          targetDbIops = 440 + Math.floor(Math.random() * 40);
          targetCacheHit = 60 + Math.floor(Math.random() * 8);
        } else if (simMode === 'outage') {
          targetRps = 4100 + Math.floor(Math.random() * 200);
          targetLatency = 5000 + Math.floor(Math.random() * 500);
          targetCpu = 100;
          targetSessions = 1500 + Math.floor(Math.random() * 100);
          targetDbIops = 0;
          targetCacheHit = 0;
        }

        return {
          rps: Math.round(targetRps),
          latency: parseFloat(targetLatency.toFixed(1)),
          cpu: Math.round(targetCpu),
          sessions: Math.round(targetSessions),
          dbIops: Math.round(targetDbIops),
          cacheHit: Math.round(targetCacheHit),
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [simMode]);

  // Generate log stream messages responsive to the simulation mode
  useEffect(() => {
    let initialLogs: string[] = [];
    if (simMode === 'normal') {
      initialLogs = [
        '[INFO] Route 53 DNS geoproximity health checks: PASSING',
        '[INFO] CloudFront CDN edge cache hit ratio: 88.5%',
        '[INFO] ALB routing requests smoothly to us-east-1 Fargate cluster',
        '[INFO] Aurora Multi-AZ replication sync lag: 1.4ms',
      ];
    } else if (simMode === 'spike') {
      initialLogs = [
        '[WARN] CPU utilization threshold exceeded: 75% on ECS tasks',
        '[INFO] CloudWatch alarm trigger: ASG_Scale_Out',
        '[INFO] Launching +2 Fargate container task instances...',
        '[INFO] ElastiCache write-through caching absorbing repeat select queries',
      ];
    } else if (simMode === 'ddos') {
      initialLogs = [
        '[ALERT] DDoS Volumetric Threat detected at Edge (Route 53 Anycast)',
        '[INFO] AWS Shield Advanced activating mitigation scrubbers',
        '[SECURITY] WAF Block Rule 12 triggered: dropped 85,000 bad requests/sec',
        '[INFO] Backend ALB load stable: Legit sessions running unaffected',
      ];
    } else if (simMode === 'failover') {
      initialLogs = [
        '[ALERT] Health check failure detected in primary region (us-east-1)',
        '[INFO] Route 53 Failover Policy active: Rerouting DNS queries',
        '[INFO] Secondary active gateway online in us-west-2',
        '[WARN] Secondary DB cache cold: Warming up database indexing...',
      ];
    } else if (simMode === 'outage') {
      initialLogs = [
        '[CRITICAL] ECS Fargate tasks thread deadlock detected',
        '[ERROR] Database connection pool exhausted (Max Connections = 500)',
        '[ERROR] Backend API returning HTTP 504 Gateway Timeout',
        '[CRITICAL] 100% Request Error Rate detected on ALB listener',
      ];
    }
    setConsoleLogs(initialLogs);

    const logInterval = setInterval(() => {
      setConsoleLogs(prev => {
        let newLog = '';
        const timestamp = new Date().toLocaleTimeString();
        if (simMode === 'normal') {
          const logs = [
            `[${timestamp}] [INFO] ALB connection pooling stable: 1,420 active sess`,
            `[${timestamp}] [INFO] Database replica replication lag: 0.8ms`,
            `[${timestamp}] [INFO] DNS queries resolved globally via Route 53 in 12ms`,
            `[${timestamp}] [INFO] S3 bucket policy evaluation: ALLOW`,
          ];
          newLog = logs[Math.floor(Math.random() * logs.length)];
        } else if (simMode === 'spike') {
          const logs = [
            `[${timestamp}] [INFO] Fargate scale-out complete: 4 active tasks online`,
            `[${timestamp}] [WARN] DB IOPS spiking: read transactions/sec`,
            `[${timestamp}] [INFO] Cache hit rate increased to maintain database load`,
            `[${timestamp}] [INFO] Container CPU load stabilizing`,
          ];
          newLog = logs[Math.floor(Math.random() * logs.length)];
        } else if (simMode === 'ddos') {
          const logs = [
            `[${timestamp}] [SECURITY] Blocked Layer 7 HTTP flood signature from 14.120.x.x`,
            `[${timestamp}] [INFO] WAF rate-limiting rule dropped 12,400 sessions`,
            `[${timestamp}] [INFO] Shield mitigation active. Backend latency safe`,
            `[${timestamp}] [SECURITY] Auto-deflected volumetric spam packets to null route`,
          ];
          newLog = logs[Math.floor(Math.random() * logs.length)];
        } else if (simMode === 'failover') {
          const logs = [
            `[${timestamp}] [WARN] Primary region us-east-1 remains offline`,
            `[${timestamp}] [INFO] Serving 100% of live traffic from us-west-2 DR node`,
            `[${timestamp}] [INFO] DMS continuous replication catching up...`,
            `[${timestamp}] [INFO] DB cache warming up on secondary node`,
          ];
          newLog = logs[Math.floor(Math.random() * logs.length)];
        } else if (simMode === 'outage') {
          const logs = [
            `[${timestamp}] [ERROR] Connection timeout to Aurora database writer node`,
            `[${timestamp}] [CRITICAL] WebApp socket buffer full. Connection dropped.`,
            `[${timestamp}] [ERROR] HTTP 504 Gateway Timeout returned for client requests`,
            `[${timestamp}] [CRITICAL] Stack trace dumped: OutOfMemoryError in thread pool`,
          ];
          newLog = logs[Math.floor(Math.random() * logs.length)];
        }
        return [newLog, ...prev.slice(0, 4)];
      });
    }, 3000);

    return () => clearInterval(logInterval);
  }, [simMode]);

  // Copy helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNodeId(id);
    setTimeout(() => setCopiedNodeId(null), 2000);
  };

  // Active Category Counter Helper
  const getCategoryCount = (cat: string) => {
    if (cat === 'all') return visualizers.length;
    return visualizers.filter(v => v.category === cat).length;
  };

  // Filtered visualizers logic
  const filteredVisualizers = visualizers.filter((viz) => {
    const matchesSearch = 
      viz.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      viz.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      viz.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = activeCategory === 'all' || viz.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const activeScenario = scenarios.find(s => s.id === selectedScenarioId);

  const renderScenarioDiagram = (id: string) => {
    switch (id) {
      case 'db-scaling':
        return (
          <svg width="480" height="200" viewBox="0 0 480 200" className="w-full max-w-[480px]">
            <defs>
              <linearGradient id="db-grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="db-grad-green" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="db-grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="db-grad-rose" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#be123c" />
              </linearGradient>
            </defs>

            <style>{`
              .conduit { stroke-dasharray: 5, 4; animation: flowDash ${simSpikeActive ? '0.3s' : '1s'} linear infinite; }
              .conduit-fast { stroke-dasharray: 5, 4; animation: flowDash ${simSpikeActive ? '0.15s' : '0.5s'} linear infinite; }
              .conduit-static { stroke-dasharray: 4, 4; }
              @keyframes flowDash { to { stroke-dashoffset: -20; } }
              .node-box { transition: all 0.25s ease; cursor: pointer; }
              .node-box:hover { filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08)); transform: translateY(-1px); }
            `}</style>

            {/* Background pipelines */}
            <path d="M 120 100 Q 190 40 260 40" fill="none" stroke="#f43f5e" strokeWidth="2" className="conduit-fast" />
            <path d="M 120 100 Q 190 160 260 160" fill="none" stroke="#3b82f6" strokeWidth="2" className="conduit" />
            <path d="M 260 40 Q 190 20 50 100" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3,3" />
            <path d="M 370 160 L 400 160" fill="none" stroke="#10b981" strokeWidth="2" className="conduit" />
            <path d="M 370 40 Q 420 80 430 130" fill="none" stroke="#f59e0b" strokeWidth="1.5" className="conduit-static" />

            <line x1="50" y1="100" x2="70" y2="100" stroke="#94a3b8" strokeWidth="1.5" />

            {/* Client App Node */}
            <g className="node-box" transform="translate(10, 80)">
              <rect width="60" height="40" rx="8" fill="url(#db-grad-blue)" />
              <text x="30" y="24" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Client App</text>
            </g>

            {/* ALB Node */}
            <g className="node-box" transform="translate(85, 80)">
              <rect width="50" height="40" rx="8" fill="url(#db-grad-amber)" />
              <text x="25" y="24" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">AWS ALB</text>
            </g>

            {/* ElastiCache Node */}
            <g className="node-box" transform="translate(260, 20)">
              <rect width="110" height="40" rx="8" fill="url(#db-grad-rose)" />
              <text x="55" y="20" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">ElastiCache (Redis)</text>
              <text x="55" y="32" fill="#ffe4e6" fontSize="7" textAnchor="middle">{simSpikeActive ? '⚡ 99% Cache Hit' : '⚡ 0.5ms Cache Hit'}</text>
            </g>

            {/* Aurora Primary Writer DB */}
            <g className="node-box" transform="translate(260, 140)">
              <rect width="110" height="40" rx="8" fill={simSpikeActive ? "#e11d48" : "url(#db-grad-green)"} stroke={simSpikeActive ? "#f43f5e" : "none"} strokeWidth="1" />
              <text x="55" y="20" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Primary DB (Writer)</text>
              <text x="55" y="32" fill={simSpikeActive ? "#ffe4e6" : "#d1fae5"} fontSize="7" fontWeight="bold" textAnchor="middle">{simSpikeActive ? '🔥 High CPU Lockout!' : 'Transactional Writes'}</text>
            </g>

            {/* Aurora Replicas Readers DB */}
            <g className="node-box" transform="translate(400, 130)">
              <rect width="70" height="50" rx="8" fill="#047857" />
              <text x="35" y="22" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">Reader DBs</text>
              <text x="35" y="34" fill="#d1fae5" fontSize="7" textAnchor="middle">(Auto-Scaled)</text>
              <text x="35" y="44" fill="#34d399" fontSize="6.5" textAnchor="middle">{simSpikeActive ? '⚡ Fast Reads OK' : 'Reads Flow'}</text>
            </g>

            {/* Legend overlay indicators */}
            <rect x="10" y="10" width="80" height="30" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
            <circle cx="20" cy="18" r="2.5" fill="#f43f5e" />
            <text x="28" y="21" fill="#475569" fontSize="7" fontWeight="bold">Read requests</text>
            <circle cx="20" cy="27" r="2.5" fill="#3b82f6" />
            <text x="28" y="30" fill="#475569" fontSize="7" fontWeight="bold">Write requests</text>
          </svg>
        );
      case 'iot-streaming':
        return (
          <svg width="480" height="200" viewBox="0 0 480 200" className="w-full max-w-[480px]">
            <defs>
              <linearGradient id="str-grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#5b21b6" />
              </linearGradient>
              <linearGradient id="str-grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
              <linearGradient id="str-grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="str-grad-cyan" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#0891b2" />
              </linearGradient>
            </defs>

            <style>{`
              .conduit { stroke-dasharray: 5, 4; animation: flowDash ${simSpikeActive ? '0.3s' : '1s'} linear infinite; }
              .conduit-fast { stroke-dasharray: 5, 4; animation: flowDash ${simSpikeActive ? '0.15s' : '0.5s'} linear infinite; }
              @keyframes flowDash { to { stroke-dashoffset: -20; } }
              .node-box { transition: all 0.25s ease; cursor: pointer; }
              .node-box:hover { filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08)); transform: translateY(-1px); }
            `}</style>

            <path d="M 80 75 L 140 75" fill="none" stroke="#8b5cf6" strokeWidth="2" className="conduit-fast" />
            <path d="M 80 125 L 140 125" fill="none" stroke="#06b6d4" strokeWidth="2" className="conduit" />
            <path d="M 235 75 L 265 75" fill="none" stroke="#8b5cf6" strokeWidth="2" className="conduit" />
            <path d="M 345 75 L 390 75" fill="none" stroke="#10b981" strokeWidth="2" className="conduit" />
            <path d="M 235 125 L 265 125" fill="none" stroke="#06b6d4" strokeWidth="2" className="conduit" />
            <path d="M 345 125 L 390 125" fill="none" stroke="#f59e0b" strokeWidth="1.5" className="conduit" />

            <g className="node-box" transform="translate(10, 70)">
              <rect width="70" height="70" rx="10" fill="url(#str-grad-blue)" />
              <text x="35" y="32" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Bursty Clients</text>
              <text x="35" y="44" fill="#93c5fd" fontSize="7" textAnchor="middle">&amp; IoT Devices</text>
              <text x="35" y="54" fill="#60a5fa" fontSize="6.5" textAnchor="middle">{simSpikeActive ? '🔥 Spiking 10k/s' : '💼 Normal Load'}</text>
            </g>

            <g className="node-box" transform="translate(140, 55)">
              <rect width="95" height="40" rx="8" fill="#e0e7ff" stroke="#8b5cf6" strokeWidth="1" />
              <text x="47.5" y="18" fill="#4c1d95" fontSize="8" fontWeight="bold" textAnchor="middle">Amazon SQS</text>
              <text x="47.5" y="30" fill="#6d28d9" fontSize="7" textAnchor="middle">{simSpikeActive ? '⚡ Buffering [Safe]' : '[ Q | Q | Q ] buffer'}</text>
            </g>

            <g className="node-box" transform="translate(140, 105)">
              <rect width="95" height="40" rx="8" fill="#ecfeff" stroke="#06b6d4" strokeWidth="1" />
              <text x="47.5" y="18" fill="#083344" fontSize="8" fontWeight="bold" textAnchor="middle">Kinesis Stream</text>
              <text x="47.5" y="30" fill="#0891b2" fontSize="7" textAnchor="middle">{simSpikeActive ? '⚡ Sharding active' : '⚡ Real-time Shards'}</text>
            </g>

            <g className="node-box" transform="translate(265, 55)">
              <rect width="80" height="40" rx="8" fill="url(#str-grad-purple)" />
              <text x="40" y="20" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">AWS Lambda</text>
              <text x="40" y="32" fill="#ddd6fe" fontSize="7" textAnchor="middle">{simSpikeActive ? '⚙️ Scaling tasks' : 'Event Consumer'}</text>
            </g>

            <g className="node-box" transform="translate(265, 105)">
              <rect width="80" height="40" rx="8" fill="url(#str-grad-cyan)" />
              <text x="40" y="20" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">Athena SQL</text>
              <text x="40" y="32" fill="#cffafe" fontSize="7" textAnchor="middle">Serverless Queries</text>
            </g>

            <g className="node-box" transform="translate(390, 55)">
              <rect width="80" height="40" rx="8" fill="#065f46" />
              <text x="40" y="20" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">DynamoDB</text>
              <text x="40" y="32" fill="#a7f3d0" fontSize="7" textAnchor="middle">Key-Value Storage</text>
            </g>

            <g className="node-box" transform="translate(390, 105)">
              <rect width="80" height="40" rx="8" fill="url(#str-grad-amber)" />
              <text x="40" y="20" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">S3 Data Lake</text>
              <text x="40" y="32" fill="#fde68a" fontSize="7" textAnchor="middle">Glue Catalogs</text>
            </g>
          </svg>
        );
      case 'container-scaling':
        return (
          <svg width="480" height="200" viewBox="0 0 480 200" className="w-full max-w-[480px]">
            <defs>
              <linearGradient id="cnt-grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="cnt-grad-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>

            <style>{`
              .conduit { stroke-dasharray: 5, 4; animation: flowDash ${simSpikeActive ? '0.3s' : '1s'} linear infinite; }
              .scale-spawn { stroke-dasharray: 4, 3; animation: spawnFlash 1.5s ease-in-out infinite alternate; }
              @keyframes flowDash { to { stroke-dashoffset: -20; } }
              @keyframes spawnFlash { 
                0% { fill: rgba(16, 185, 129, 0.02); stroke: rgba(16, 185, 129, 0.4); } 
                100% { fill: rgba(16, 185, 129, 0.12); stroke: rgba(16, 185, 129, 0.9); }
              }
              .node-box { transition: all 0.25s ease; cursor: pointer; }
              .node-box:hover { filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08)); transform: translateY(-1px); }
            `}</style>

            <rect x="150" y="15" width="320" height="170" rx="12" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="6,4" />
            <text x="160" y="30" fill="#64748b" fontSize="8" fontWeight="bold" fontFamily="monospace">Amazon ECS Cluster (Fargate)</text>

            <path d="M 120 100 Q 180 60 210 60" fill="none" stroke="#f97316" strokeWidth="2" className="conduit" />
            <path d="M 120 100 Q 180 140 210 140" fill="none" stroke="#f97316" strokeWidth="2" className="conduit" />
            <path d="M 120 100 Q 220 30 330 60" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" />
            <path d="M 120 100 Q 220 170 330 140" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,3" />

            <line x1="10" y1="100" x2="60" y2="100" stroke="#94a3b8" strokeWidth="2" className="conduit" />

            <g className="node-box" transform="translate(10, 80)">
              <circle cx="20" cy="20" r="18" fill="url(#cnt-grad-blue)" />
              <text x="20" y="23" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Traffic</text>
            </g>

            <g className="node-box" transform="translate(65, 80)">
              <rect width="55" height="40" rx="8" fill="url(#cnt-grad-orange)" />
              <text x="27.5" y="24" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">AWS ALB</text>
            </g>

            <g className="node-box" transform="translate(210, 40)">
              <rect width="90" height="40" rx="8" fill="#1e293b" />
              <text x="45" y="20" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">Web Task 1</text>
              <text x="45" y="32" fill="#10b981" fontSize="7" textAnchor="middle">● Booted [Running]</text>
            </g>

            <g className="node-box" transform="translate(210, 120)">
              <rect width="90" height="40" rx="8" fill="#1e293b" />
              <text x="45" y="20" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">Web Task 2</text>
              <text x="45" y="32" fill="#10b981" fontSize="7" textAnchor="middle">● Booted [Running]</text>
            </g>

            {simSpikeActive ? (
              <>
                {/* Active Scaled-Out Task 3 */}
                <g className="node-box" transform="translate(330, 40)">
                  <rect width="115" height="40" rx="8" fill="#111827" stroke="#10b981" strokeWidth="1" />
                  <text x="57.5" y="20" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">Task 3 (Worker)</text>
                  <text x="57.5" y="32" fill="#10b981" fontSize="7" textAnchor="middle">● Auto-Spawned [OK]</text>
                </g>
                {/* Active Scaled-Out Task 4 */}
                <g className="node-box" transform="translate(330, 120)">
                  <rect width="115" height="40" rx="8" fill="#111827" stroke="#10b981" strokeWidth="1" />
                  <text x="57.5" y="20" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">Task 4 (Worker)</text>
                  <text x="57.5" y="32" fill="#10b981" fontSize="7" textAnchor="middle">● Auto-Spawned [OK]</text>
                </g>
              </>
            ) : (
              <>
                {/* Spawning placeholder Task 3 */}
                <g className="node-box" transform="translate(330, 40)">
                  <rect width="115" height="40" rx="8" strokeWidth="1.5" className="scale-spawn" />
                  <text x="57.5" y="20" fill="#047857" fontSize="8" fontWeight="bold" textAnchor="middle">Task 3 (Worker)</text>
                  <text x="57.5" y="32" fill="#059669" fontSize="7.5" fontWeight="bold" textAnchor="middle">📈 Idle Standby</text>
                </g>
                {/* Spawning placeholder Task 4 */}
                <g className="node-box" transform="translate(330, 120)">
                  <rect width="115" height="40" rx="8" strokeWidth="1.5" className="scale-spawn" />
                  <text x="57.5" y="20" fill="#047857" fontSize="8" fontWeight="bold" textAnchor="middle">Task 4 (Worker)</text>
                  <text x="57.5" y="32" fill="#059669" fontSize="7.5" fontWeight="bold" textAnchor="middle">📈 Idle Standby</text>
                </g>
              </>
            )}
          </svg>
        );
      case 'global-latency':
        return (
          <svg width="480" height="200" viewBox="0 0 480 200" className="w-full max-w-[480px]">
            <defs>
              <linearGradient id="gl-grad-violet" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" />
                <stop offset="100%" stopColor="#4c1d95" />
              </linearGradient>
              <linearGradient id="gl-grad-emerald" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <linearGradient id="gl-grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>

            <style>{`
              .conduit-green { stroke-dasharray: 4, 3; animation: flowDash 0.8s linear infinite; }
              .conduit-blue { stroke-dasharray: 5, 4; animation: flowDash 1.2s linear infinite; }
              @keyframes flowDash { to { stroke-dashoffset: -20; } }
              .node-box { transition: all 0.25s ease; cursor: pointer; }
              .node-box:hover { filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08)); transform: translateY(-1px); }
            `}</style>

            <rect x="160" y="15" width="310" height="170" rx="12" fill="none" stroke="#ddd6fe" strokeWidth="1.5" strokeDasharray="6,4" />
            <text x="170" y="30" fill="#7c3aed" fontSize="8" fontWeight="bold" fontFamily="monospace">AWS Global Edge Network</text>

            <path d="M 65 100 Q 120 60 190 60" fill="none" stroke="#7c3aed" strokeWidth="1.5" />
            <path d="M 190 60 Q 120 50 65 90" fill="none" stroke="#10b981" strokeWidth="2.5" className="conduit-green" />
            <path d="M 290 60 Q 340 60 380 90" fill="none" stroke="#3b82f6" strokeWidth="1.5" className="conduit-blue" />
            <path d="M 65 105 Q 220 160 380 150" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5,4" className="conduit-blue" />

            <g className="node-box" transform="translate(10, 80)">
              <rect width="55" height="40" rx="8" fill="#1e293b" />
              <text x="27.5" y="20" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Global</text>
              <text x="27.5" y="32" fill="#94a3b8" fontSize="8" textAnchor="middle">Users 🌐</text>
            </g>

            <g className="node-box" transform="translate(190, 40)">
              <rect width="100" height="40" rx="8" fill="url(#gl-grad-violet)" />
              <text x="50" y="20" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">CloudFront Edge</text>
              <text x="50" y="32" fill="#a7f3d0" fontSize="7" fontWeight="bold" textAnchor="middle">⚡ Cache Hit: 5ms</text>
            </g>

            <g className="node-box" transform="translate(380, 80)">
              <rect width="80" height="40" rx="8" fill="url(#gl-grad-amber)" />
              <text x="40" y="20" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">S3 Object OAC</text>
              <text x="40" y="32" fill="#fef3c7" fontSize="7.5" textAnchor="middle">(Secure Origin)</text>
            </g>

            <g className="node-box" transform="translate(380, 135)">
              <rect width="80" height="40" rx="8" fill="#1e1b4b" />
              <text x="40" y="20" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">ALB / EC2</text>
              <text x="40" y="32" fill="#c084fc" fontSize="7" textAnchor="middle">(Dynamic Origin)</text>
            </g>
          </svg>
        );
      case 'high-perf-fs':
        return (
          <svg width="480" height="200" viewBox="0 0 480 200" className="w-full max-w-[480px]">
            <defs>
              <linearGradient id="fs-grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="fs-grad-slate" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
            </defs>

            <style>{`
              .conduit-mount { stroke-dasharray: 4, 3; animation: flowDash ${simSpikeActive ? '0.3s' : '1s'} linear infinite; }
              .conduit-disk { stroke-dasharray: 3, 3; animation: flowDash ${simSpikeActive ? '0.15s' : '0.5s'} linear infinite; }
              @keyframes flowDash { to { stroke-dashoffset: -20; } }
              .node-box { transition: all 0.25s ease; cursor: pointer; }
              .node-box:hover { filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08)); transform: translateY(-1px); }
            `}</style>

            <path d="M 100 45 L 210 90" fill="none" stroke="#f59e0b" strokeWidth="1.5" className="conduit-mount" />
            <path d="M 100 100 L 210 100" fill="none" stroke="#f59e0b" strokeWidth="1.5" className="conduit-mount" />
            <path d="M 100 155 L 210 110" fill="none" stroke="#f59e0b" strokeWidth="1.5" className="conduit-mount" />
            <path d="M 330 100 L 375 100" fill="none" stroke="#10b981" strokeWidth="2.5" className="conduit-disk" />

            <rect x="15" y="15" width="95" height="170" rx="8" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
            <text x="25" y="28" fill="#64748b" fontSize="6.5" fontWeight="bold">EC2 Mounts Group</text>

            <g className="node-box" transform="translate(25, 30)">
              <rect width="75" height="30" rx="6" fill="url(#fs-grad-slate)" />
              <text x="37.5" y="18" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">Server A (Web)</text>
            </g>

            <g className="node-box" transform="translate(25, 85)">
              <rect width="75" height="30" rx="6" fill="url(#fs-grad-slate)" />
              <text x="37.5" y="18" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">Server B (API)</text>
            </g>

            <g className="node-box" transform="translate(25, 140)">
              <rect width="75" height="30" rx="6" fill="url(#fs-grad-slate)" />
              <text x="37.5" y="18" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">Server C (Batch)</text>
            </g>

            <g className="node-box" transform="translate(210, 80)">
              <rect width="120" height="40" rx="8" fill="url(#fs-grad-amber)" />
              <text x="60" y="20" fill="#ffffff" fontSize="8.5" fontWeight="bold" textAnchor="middle">Amazon FSx share</text>
              <text x="60" y="32" fill="#ffe4e6" fontSize="7.5" textAnchor="middle">{simSpikeActive ? '⚡ Cap: 20 Gbps OK' : 'Concurrent Mounts'}</text>
            </g>

            <g className="node-box" transform="translate(375, 75)">
              <rect width="80" height="50" rx="8" fill="#065f46" />
              <text x="40" y="20" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">SSD Disks Pool</text>
              <text x="40" y="32" fill="#34d399" fontSize="7" textAnchor="middle">{simSpikeActive ? '⚡ 50k IOPS Burst' : 'Sub-ms IOPS'}</text>
              <text x="40" y="42" fill="#a7f3d0" fontSize="6.5" textAnchor="middle">Active Share Disk</text>
            </g>
          </svg>
        );
      case 'hybrid-failover':
        return (
          <svg width="480" height="200" viewBox="0 0 480 200" className="w-full max-w-[480px]">
            <defs>
              <linearGradient id="fail-grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="fail-grad-red" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#b91c1c" />
              </linearGradient>
            </defs>

            <style>{`
              .conduit-failover-ok { stroke-dasharray: 5, 4; animation: flowDash 0.8s linear infinite; }
              @keyframes flowDash { to { stroke-dashoffset: -20; } }
              .node-box { transition: all 0.25s ease; cursor: pointer; }
              .node-box:hover { filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08)); transform: translateY(-1px); }
            `}</style>

            {/* Paths */}
            {simFailoverActive ? (
              <>
                {/* AWS Path - Broken Red */}
                <path d="M 240 50 Q 150 100 100 120" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3,3" />
                {/* On-Premises Path - Active Pulsing Green */}
                <path d="M 240 50 Q 330 100 380 120" fill="none" stroke="#10b981" strokeWidth="2.5" className="conduit-failover-ok" />
              </>
            ) : (
              <>
                {/* AWS Path - Active Pulsing Green */}
                <path d="M 240 50 Q 150 100 100 120" fill="none" stroke="#10b981" strokeWidth="2.5" className="conduit-failover-ok" />
                {/* On-Premises Path - Standby Grey */}
                <path d="M 240 50 Q 330 100 380 120" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4,4" />
              </>
            )}

            {/* DNS Node */}
            <g className="node-box" transform="translate(195, 10)">
              <rect width="90" height="40" rx="8" fill="#1e1b4b" />
              <text x="45" y="20" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">Route 53 DNS</text>
              <text x="45" y="32" fill="#c084fc" fontSize="7" textAnchor="middle">Failover Routing Policy</text>
            </g>

            {/* AWS Cloud Node */}
            <g className="node-box" transform="translate(20, 120)">
              <rect width="130" height="60" rx="10" fill={simFailoverActive ? "url(#fail-grad-red)" : "#0f766e"} />
              <text x="65" y="24" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">AWS Region (Primary)</text>
              {simFailoverActive ? (
                <>
                  <text x="65" y="40" fill="#fee2e2" fontSize="8" fontWeight="bold" textAnchor="middle">❌ VPC OUTAGE</text>
                  <text x="65" y="50" fill="#fca5a5" fontSize="6.5" textAnchor="middle">Health Check Failed</text>
                </>
              ) : (
                <>
                  <text x="65" y="40" fill="#ccfbf1" fontSize="8" fontWeight="bold" textAnchor="middle">● HEALTHY</text>
                  <text x="65" y="50" fill="#99f6e4" fontSize="6.5" textAnchor="middle">EC2/ALB top routing</text>
                </>
              )}
            </g>

            {/* On-Premises Datacenter Node */}
            <g className="node-box" transform="translate(330, 120)">
              <rect width="130" height="60" rx="10" fill={simFailoverActive ? "#047857" : "#475569"} />
              <text x="65" y="24" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">On-Premises Datacenter</text>
              {simFailoverActive ? (
                <>
                  <text x="65" y="40" fill="#d1fae5" fontSize="8" fontWeight="bold" textAnchor="middle">⚡ ACTIVE GATEWAY</text>
                  <text x="65" y="50" fill="#a7f3d0" fontSize="6.5" textAnchor="middle">Rerouted User Sessions</text>
                </>
              ) : (
                <>
                  <text x="65" y="40" fill="#f1f5f9" fontSize="8" textAnchor="middle">● STANDBY</text>
                  <text x="65" y="50" fill="#cbd5e1" fontSize="6.5" textAnchor="middle">Idle Recovery Link</text>
                </>
              )}
            </g>

            {/* R53 Health check line */}
            <line x1="240" y1="50" x2="240" y2="100" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
            <circle cx="240" cy="100" r="3" fill="#f59e0b" />
            <text x="240" y="112" fill="#d97706" fontSize="6" fontWeight="bold" textAnchor="middle">HTTP probe</text>
          </svg>
        );
      case 'edge-security':
        return (
          <svg width="480" height="200" viewBox="0 0 480 200" className="w-full max-w-[480px]">
            <defs>
              <linearGradient id="sec-grad-red" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#be123c" />
              </linearGradient>
              <linearGradient id="sec-grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
            </defs>

            <style>{`
              .conduit-green { stroke-dasharray: 4, 3; animation: flowDash 0.8s linear infinite; }
              .conduit-bot { stroke-dasharray: 3, 2; animation: flowDash 0.4s linear infinite; }
              @keyframes flowDash { to { stroke-dashoffset: -20; } }
              .waf-shield { transition: all 0.3s ease; }
              .node-box { transition: all 0.25s ease; cursor: pointer; }
              .node-box:hover { filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08)); transform: translateY(-1px); }
            `}</style>

            {/* Background Conduits */}
            <path d="M 80 60 Q 150 60 210 60" fill="none" stroke="#10b981" strokeWidth="2.5" className="conduit-green" />
            <path d="M 290 60 L 370 100" fill="none" stroke="#10b981" strokeWidth="2" className="conduit-green" />

            {simSecAttackActive ? (
              <>
                <path d="M 80 140 Q 140 140 210 130" fill="none" stroke="#ef4444" strokeWidth="2.5" className="conduit-bot" />
                <path d="M 210 130 Q 180 150 160 170" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="2,2" />
                <path d="M 210 130 Q 180 110 150 90" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="2,2" />
                <text x="210" y="165" fill="#e11d48" fontSize="8" fontWeight="black">🛡️ WAF BOUNCED 403</text>
              </>
            ) : (
              <path d="M 80 140 Q 150 140 210 140" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,4" />
            )}

            <line x1="290" y1="140" x2="370" y2="100" stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Users / Bots Node */}
            <g className="node-box" transform="translate(10, 50)">
              <rect width="70" height="100" rx="10" fill="#1e293b" />
              <text x="35" y="24" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Legit Users 👤</text>
              {simSecAttackActive ? (
                <>
                  <rect x="5" y="55" width="60" height="35" rx="4" fill="url(#sec-grad-red)" />
                  <text x="35" y="68" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">💥 BOTNET</text>
                  <text x="35" y="78" fill="#fee2e2" fontSize="6.5" textAnchor="middle">L7 Request Flood</text>
                </>
              ) : (
                <>
                  <rect x="5" y="55" width="60" height="35" rx="4" fill="#334155" />
                  <text x="35" y="76" fill="#94a3b8" fontSize="8" textAnchor="middle">Clients normal</text>
                </>
              )}
            </g>

            {/* AWS WAF Shield & CloudFront Edge Node */}
            <g className="node-box" transform="translate(210, 40)">
              <rect width="80" height="120" rx="10" fill={simSecAttackActive ? "#4c1d95" : "#1e1b4b"} stroke={simSecAttackActive ? "#f43f5e" : "#8b5cf6"} strokeWidth={simSecAttackActive ? "2" : "1"} className="waf-shield" />
              <text x="40" y="24" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">CloudFront</text>
              <text x="40" y="36" fill="#a7f3d0" fontSize="7" textAnchor="middle">Cache Enabled</text>
              
              <rect x="8" y="55" width="64" height="50" rx="6" fill={simSecAttackActive ? "#be123c" : "#3b82f6"} />
              <text x="40" y="68" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">AWS WAF</text>
              <text x="40" y="80" fill="#ffffff" fontSize="7" textAnchor="middle">ACL inspect</text>
              {simSecAttackActive ? (
                <text x="40" y="94" fill="#fecdd3" fontSize="7.5" fontWeight="bold" textAnchor="middle">🔒 Shield Active</text>
              ) : (
                <text x="40" y="94" fill="#dbeafe" fontSize="7" textAnchor="middle">Monitoring</text>
              )}
            </g>

            {/* Backend Origin DB/ALB Node */}
            <g className="node-box" transform="translate(370, 75)">
              <rect width="90" height="50" rx="8" fill="#0f766e" />
              <text x="45" y="20" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">Origin Backend</text>
              <text x="45" y="32" fill="#ccfbf1" fontSize="8" textAnchor="middle">ALB / EC2 / S3</text>
              <text x="45" y="42" fill="#99f6e4" fontSize="7.5" fontWeight="bold" textAnchor="middle">● Safe &amp; Online</text>
            </g>
          </svg>
        );
      case 'data-warehouse':
        return (
          <svg width="480" height="200" viewBox="0 0 480 200" className="w-full max-w-[480px]">
            <defs>
              <linearGradient id="dw-grad-amber" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
              <linearGradient id="dw-grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#7e22ce" />
              </linearGradient>
            </defs>

            <style>{`
              .conduit-data { stroke-dasharray: 4, 3; animation: flowDash 1.2s linear infinite; }
              @keyframes flowDash { to { stroke-dashoffset: -20; } }
              .node-box { transition: all 0.25s ease; cursor: pointer; }
              .node-box:hover { filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08)); transform: translateY(-1px); }
            `}</style>

            <path d="M 80 100 L 140 100" fill="none" stroke="#a855f7" strokeWidth="2.5" className="conduit-data" />
            <path d="M 230 100 L 265 100" fill="none" stroke="#a855f7" strokeWidth="2" className="conduit-data" />
            <path d="M 355 100 L 390 100" fill="none" stroke="#10b981" strokeWidth="2" className="conduit-data" />
            
            <path d="M 185 140 L 185 120" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />

            <g className="node-box" transform="translate(10, 75)">
              <rect width="70" height="50" rx="8" fill="#1e293b" />
              <text x="35" y="24" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">App Databases</text>
              <text x="35" y="36" fill="#94a3b8" fontSize="8" textAnchor="middle">OLTP Logs 🗄️</text>
            </g>

            <g className="node-box" transform="translate(140, 75)">
              <rect width="90" height="50" rx="8" fill="url(#dw-grad-amber)" />
              <text x="45" y="22" fill="#ffffff" fontSize="8.5" fontWeight="bold" textAnchor="middle">S3 Ingest Pool</text>
              <text x="45" y="34" fill="#fef3c7" fontSize="7.5" textAnchor="middle">Parquet Raw files</text>
              <text x="45" y="44" fill="#ffe4e6" fontSize="7.5" textAnchor="middle">Athena Serverless SQL</text>
            </g>

            <g className="node-box" transform="translate(140, 140)">
              <rect width="90" height="35" rx="6" fill="#78350f" />
              <text x="45" y="16" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">AWS Glue Crawler</text>
              <text x="45" y="26" fill="#fde68a" fontSize="7.5" textAnchor="middle">Auto-Extract Schema</text>
            </g>

            <g className="node-box" transform="translate(265, 75)">
              <rect width="90" height="50" rx="8" fill="url(#dw-grad-purple)" />
              <text x="45" y="24" fill="#ffffff" fontSize="8.5" fontWeight="bold" textAnchor="middle">Amazon Redshift</text>
              <text x="45" y="36" fill="#f3e8ff" fontSize="7.5" textAnchor="middle">OLAP Data Warehouse</text>
            </g>

            <g className="node-box" transform="translate(390, 65)">
              <rect width="80" height="70" rx="10" fill="#1e1b4b" stroke="#10b981" strokeWidth="1" />
              <text x="40" y="20" fill="#ffffff" fontSize="8.5" fontWeight="bold" textAnchor="middle">Amazon QuickSight</text>
              <text x="40" y="30" fill="#34d399" fontSize="7.5" textAnchor="middle">Visual BI reports</text>
              
              <rect x="18" y="42" width="10" height="20" fill="#10b981" rx="1" />
              <rect x="33" y="48" width="10" height="14" fill="#3b82f6" rx="1" />
              <rect x="48" y="38" width="10" height="24" fill="#f59e0b" rx="1" />
            </g>
          </svg>
        );
      default:
        return null;
    }
  };

  const renderSimulationWidgets = (scenarioId: string) => {
    const isLoadSpikeScenario = ['db-scaling', 'container-scaling', 'high-perf-fs', 'iot-streaming'].includes(scenarioId);
    
    if (isLoadSpikeScenario) {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs font-semibold">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Telemetry Spike Injector</span>
            <span className="text-slate-700">Simulate rapid workload surges on components:</span>
          </div>
          <button
            onClick={() => setSimMode(prev => prev === 'spike' ? 'normal' : 'spike')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
              simSpikeActive 
                ? 'bg-rose-100 border-rose-300 text-rose-800 animate-pulse' 
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span>{simSpikeActive ? '⚡ Spike Load Active' : '⚪ Inject Spike Load'}</span>
          </button>
        </div>
      );
    }

    if (scenarioId === 'hybrid-failover') {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs font-semibold">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">VPC Regional Outage Simulator</span>
            <span className="text-slate-700">Trigger simulated catastrophic cloud failure:</span>
          </div>
          <button
            onClick={() => setSimMode(prev => prev === 'failover' ? 'normal' : 'failover')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
              simFailoverActive 
                ? 'bg-red-100 border-red-300 text-red-800 animate-pulse' 
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span>{simFailoverActive ? '❌ Region Down - Failover Active' : '⚪ Trigger Region Outage'}</span>
          </button>
        </div>
      );
    }

    if (scenarioId === 'edge-security') {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs font-semibold">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">DDoS Threat Injector</span>
            <span className="text-slate-700">Inject layer-7 botnet HTTP request flood:</span>
          </div>
          <button
            onClick={() => setSimMode(prev => prev === 'ddos' ? 'normal' : 'ddos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 shrink-0 ${
              simSecAttackActive 
                ? 'bg-rose-100 border-rose-300 text-rose-800 animate-pulse' 
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <span>{simSecAttackActive ? '🧨 Injecting DDoS Bot Flood' : '⚪ Inject DDoS Attack'}</span>
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`transition-all duration-500 -mx-4 md:-mx-8 -my-8 px-4 md:px-8 py-8 min-h-screen ${
      isDarkTheme 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-slate-50 text-slate-800'
    }`}>
      <div className="flex flex-col gap-10">

        {/* Ultra-Premium Interactive Cloud Operations Workbench Hero */}
        <section className={`relative overflow-hidden rounded-3xl p-6 md:p-10 border shadow-2xl transition-all duration-500 ${
          isDarkTheme 
            ? 'bg-slate-950 text-white border-slate-800' 
            : 'bg-white text-slate-800 border-slate-205 shadow-md'
        }`}>

        
        {/* Neon Ambient Backdrop Glows */}
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none animate-pulse duration-5000"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none animate-pulse duration-7000"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Mission Control & Syslog HUD */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6 text-left">
            <div className="flex flex-col gap-5">
              <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold tracking-wider border transition-all ${
                isDarkTheme 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              } w-fit shadow-[inset_0_1px_4px_rgba(16,185,129,0.05)]`}>
                <Sparkles className={`w-3.5 h-3.5 animate-pulse ${isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'}`} /> 
                AWS ARCHITECT FLUID PLAYGROUND V3.0
              </span>
              
              <h1 className={`text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1] transition-all duration-300 ${
                isDarkTheme ? 'text-white' : 'text-slate-900'
              }`}>
                Master Cloud <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  Architecture Live
                </span>
              </h1>
              
              <p className={`text-xs md:text-sm leading-relaxed max-w-xl transition-all duration-300 ${
                isDarkTheme ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Deploy live network topologies, simulate system workloads, and audit microservice telemetry. Click on any network node to inspect its CLI endpoints and configuration logs.
              </p>
              
              {/* Simulation Mode Selectors */}
              <div className={`border rounded-2xl p-4 flex flex-col gap-3 backdrop-blur-md transition-all duration-300 ${
                isDarkTheme ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    Workload Simulation Controls
                  </span>
                  <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded border transition-all duration-300 ${
                    isDarkTheme ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                  }`}>
                    Mode: <span className="text-emerald-400 font-bold">{simMode.toUpperCase()}</span>
                  </span>
                </div>
                
                <div className="grid grid-cols-5 gap-1.5">
                  {(['normal', 'spike', 'ddos', 'failover', 'outage'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => {
                        setSimMode(mode);
                        setSelectedNodeId(null);
                      }}
                      className={`py-2 rounded-xl text-[9.5px] font-bold border transition-all capitalize ${
                        simMode === mode
                          ? mode === 'outage'
                            ? isDarkTheme ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-700'
                            : mode === 'failover'
                              ? isDarkTheme ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-700'
                              : isDarkTheme ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : isDarkTheme 
                            ? 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900' 
                            : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Monospace Operations Console Syslog */}
            <div className={`font-mono text-[10px] flex flex-col gap-2 min-h-[120px] shadow-inner relative overflow-hidden select-none rounded-2xl p-4 transition-all duration-300 ${
              isDarkTheme ? 'bg-slate-950 border border-slate-800/80 text-slate-300' : 'bg-slate-900 border border-slate-950 text-slate-200'
            }`}>
              <div className="absolute top-0 right-0 p-2 text-slate-500 text-[8px] font-bold">SYSLOG CONSOLE</div>
              <div className="flex items-center gap-1 text-slate-500 border-b border-slate-905 pb-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>telemetry-daemon-stream: connected</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {consoleLogs.map((log, i) => {
                  let colorClass = 'text-slate-400';
                  if (log.includes('[ERROR]') || log.includes('[CRITICAL]')) colorClass = 'text-rose-400';
                  else if (log.includes('[WARN]')) colorClass = 'text-amber-400';
                  else if (log.includes('[SECURITY]')) colorClass = 'text-cyan-400';
                  else if (log.includes('[ALERT]')) colorClass = 'text-indigo-400';
                  return (
                    <div key={i} className={`truncate transition-all ${colorClass}`}>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Telemetry Gauge HUD & Network SVG Map */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6 w-full">
            
            {/* Live Systems Telemetry Console Grid */}
            <div className={`border rounded-3xl p-5 shadow-xl flex flex-col gap-4 backdrop-blur-md transition-all duration-300 ${
              isDarkTheme ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`flex items-center justify-between border-b pb-3 transition-all duration-300 ${
                isDarkTheme ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest font-mono transition-all duration-300 ${
                    isDarkTheme ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    REAL-TIME SYSTEM GAUGES
                  </span>
                </div>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border transition-all duration-300 ${
                  isDarkTheme ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  VPC IP_ROUTE: <span className="text-emerald-400 font-bold">STABLE</span>
                </span>
              </div>

              {/* Gauges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                {[
                  { label: 'RPS RATE', value: metrics.rps.toLocaleString(), unit: 'Rps', color: 'from-cyan-500 to-blue-500', width: simMode === 'ddos' ? 'w-full' : simMode === 'spike' ? 'w-[75%]' : 'w-[40%]' },
                  { label: 'LATENCY', value: metrics.latency, unit: 'ms', color: 'from-amber-500 to-orange-500', width: simMode === 'outage' ? 'w-full animate-pulse' : simMode === 'failover' ? 'w-[65%]' : 'w-[20%]' },
                  { label: 'CPU LOAD', value: `${metrics.cpu}%`, unit: '', color: 'from-rose-500 to-red-500', width: simMode === 'outage' ? 'w-full' : simMode === 'spike' ? 'w-[80%]' : 'w-[25%]' },
                  { label: 'SESSIONS', value: metrics.sessions.toLocaleString(), unit: 'Active', color: 'from-indigo-500 to-violet-500', width: simMode === 'ddos' ? 'w-full' : simMode === 'spike' ? 'w-[60%]' : 'w-[28%]' },
                  { label: 'DB IOPS', value: metrics.dbIops.toLocaleString(), unit: 'Tx/s', color: 'from-emerald-500 to-teal-500', width: simMode === 'spike' ? 'w-[85%]' : 'w-[30%]' },
                  { label: 'CACHE HIT', value: `${metrics.cacheHit}%`, unit: '', color: 'from-pink-500 to-purple-500', width: `${metrics.cacheHit}%` },
                ].map((g, idx) => (
                  <div key={idx} className={`border rounded-xl p-2.5 flex flex-col justify-between shadow-md transition-all duration-300 ${
                    isDarkTheme ? 'bg-slate-950 border-slate-850' : 'bg-white border-slate-200'
                  }`}>
                    <span className={`text-[8px] font-bold uppercase tracking-wider font-mono transition-all duration-300 ${
                      isDarkTheme ? 'text-slate-500' : 'text-slate-400'
                    }`}>{g.label}</span>
                    <span className={`text-xs sm:text-sm font-black font-mono leading-none my-1 flex items-baseline gap-0.5 transition-all duration-300 ${
                      isDarkTheme ? 'text-white' : 'text-slate-800'
                    }`}>
                      {g.value} <span className="text-[8px] text-slate-500 font-normal">{g.unit}</span>
                    </span>
                    <div className={`h-1 w-full rounded-full overflow-hidden transition-all duration-300 ${
                      isDarkTheme ? 'bg-slate-800' : 'bg-slate-100'
                    }`}>
                      <div className={`h-full rounded-full bg-gradient-to-r ${g.color} ${g.width} transition-all duration-1000`}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Immersive SVG Network Map */}
              <div className={`border rounded-2xl p-2 flex items-center justify-center relative overflow-hidden shadow-inner min-h-[220px] transition-all duration-300 ${
                isDarkTheme ? 'bg-slate-950 border-slate-850' : 'bg-white border-slate-200 shadow-inner shadow-slate-100/50'
              }`}>
                <svg width="100%" height="210" viewBox="0 0 540 210" className="max-w-full overflow-visible">
                  <defs>
                    <pattern id="grid-pattern" width="18" height="18" patternUnits="userSpaceOnUse">
                      <path d="M 18 0 L 0 0 0 18" fill="none" stroke={isDarkTheme ? '#1e293b' : '#e2e8f0'} strokeWidth="0.8" opacity="0.3" />
                    </pattern>
                    <linearGradient id="g-dns" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#0369a1" />
                    </linearGradient>
                    <linearGradient id="g-cf" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#5b21b6" />
                    </linearGradient>
                    <linearGradient id="g-waf" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#9f1239" />
                    </linearGradient>
                    <linearGradient id="g-alb" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fb923c" />
                      <stop offset="100%" stopColor="#c2410c" />
                    </linearGradient>
                    <linearGradient id="g-ecs" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                    <linearGradient id="g-db" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                    <filter id="node-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#10b981" floodOpacity="0.2" />
                    </filter>
                  </defs>

                  <style>{`
                    .conduit-flow { stroke-dasharray: 6, 6; animation: dashFlow 1s linear infinite; }
                    .conduit-ddos { stroke-dasharray: 4, 4; animation: dashFlow 0.25s linear infinite; }
                    .conduit-failover-inactive { stroke-dasharray: 5, 5; opacity: 0.2; }
                    @keyframes dashFlow { to { stroke-dashoffset: -24; } }
                    .mesh-node { transition: all 0.25s ease; }
                    .mesh-node:hover { filter: brightness(1.15) drop-shadow(0 0 6px rgba(52,211,153,0.4)); }
                  `}</style>

                  <rect width="100%" height="100%" fill="url(#grid-pattern)" rx="12" />

                  {/* Packet routing streams based on simMode */}
                  {/* Users -> DNS */}
                  <line x1="20" y1="100" x2="70" y2="100" stroke={simMode === 'ddos' ? '#f43f5e' : simMode === 'outage' ? '#94a3b8' : '#34d399'} strokeWidth="1.8" className="conduit-flow" />
                  
                  {/* DNS -> CloudFront/WAF */}
                  <line x1="110" y1="100" x2="160" y2="100" stroke={simMode === 'ddos' ? '#f43f5e' : simMode === 'outage' ? '#94a3b8' : '#34d399'} strokeWidth="1.8" className="conduit-flow" />

                  {/* CloudFront/WAF -> ALB */}
                  <line x1="200" y1="100" x2="250" y2="100" stroke={simMode === 'outage' ? '#94a3b8' : '#34d399'} strokeWidth="1.8" className="conduit-flow" />

                  {/* DDoS Deflection to trash bin */}
                  {simMode === 'ddos' && (
                    <>
                      <path d="M 200 100 Q 200 160, 160 180" fill="none" stroke="#f43f5e" strokeWidth="2.2" className="conduit-ddos" />
                      <g transform="translate(148, 170)">
                        <circle cx="12" cy="12" r="8" fill="#be123c" stroke="#ffe4e6" strokeWidth="0.8" />
                        <text x="12" y="16" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">×</text>
                      </g>
                    </>
                  )}

                  {/* ALB -> ECS Compute paths */}
                  {simMode === 'failover' ? (
                    <>
                      {/* us-east-1 Primary is broken */}
                      <path d="M 290 100 Q 330 60, 370 60" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
                      {/* us-west-2 Secondary is active */}
                      <path d="M 290 100 Q 330 140, 370 140" fill="none" stroke="#34d399" strokeWidth="1.8" className="conduit-flow" />
                    </>
                  ) : (
                    <>
                      {/* Primary region active */}
                      <path d="M 290 100 Q 330 60, 370 60" fill="none" stroke={simMode === 'outage' ? '#94a3b8' : '#34d399'} strokeWidth="1.8" className="conduit-flow" />
                      {/* Secondary region standby */}
                      <path d="M 290 100 Q 330 140, 370 140" fill="none" stroke="#334155" strokeWidth="1.2" className="conduit-failover-inactive" />
                    </>
                  )}

                  {/* ECS -> Cache / DB paths */}
                  <line x1="390" y1="60" x2="450" y2="60" stroke={simMode === 'outage' ? '#ef4444' : '#34d399'} strokeWidth="1.2" />
                  <line x1="390" y1="140" x2="450" y2="140" stroke={simMode === 'failover' ? '#34d399' : '#334155'} strokeWidth="1.2" />

                  {/* Database sync pipeline */}
                  <path d="M 470 70 Q 485 100, 470 130" fill="none" stroke="#34d399" strokeWidth="1.2" strokeDasharray="2,2" className="animate-pulse" />

                  {/* Node 1: DNS Route 53 */}
                  <g className="mesh-node cursor-pointer" onClick={() => setSelectedNodeId('dns')}>
                    <circle cx="90" cy="100" r="16" fill="url(#g-dns)" stroke={selectedNodeId === 'dns' ? '#34d399' : '#0284c7'} strokeWidth="1.8" />
                    <text x="90" y="103" fill="#fff" fontSize="7" fontWeight="bold" textAnchor="middle">DNS53</text>
                    <text x="90" y="126" fill={isDarkTheme ? '#94a3b8' : '#64748b'} fontSize="7" textAnchor="middle">Route 53</text>
                  </g>

                  {/* Node 2: CloudFront CDN */}
                  <g className="mesh-node cursor-pointer" onClick={() => setSelectedNodeId('cdn')}>
                    <circle cx="180" cy="100" r="16" fill="url(#g-cf)" stroke={selectedNodeId === 'cdn' ? '#34d399' : '#7c3aed'} strokeWidth="1.8" />
                    <text x="180" y="103" fill="#fff" fontSize="7" fontWeight="bold" textAnchor="middle">CDN</text>
                    <text x="180" y="126" fill={isDarkTheme ? '#94a3b8' : '#64748b'} fontSize="7" textAnchor="middle">CloudFront</text>
                  </g>

                  {/* Node 3: WAF & Shield */}
                  <g className="mesh-node cursor-pointer" onClick={() => setSelectedNodeId('waf')}>
                    <rect x="168" y="52" width="24" height="24" rx="4" fill="url(#g-waf)" stroke={selectedNodeId === 'waf' ? '#34d399' : '#e11d48'} strokeWidth="1.5" />
                    <text x="180" y="66" fill="#fff" fontSize="8" fontWeight="black" textAnchor="middle">🛡️</text>
                    <text x="180" y="44" fill={simMode === 'ddos' ? '#f43f5e' : (isDarkTheme ? '#64748b' : '#8898aa')} fontSize="7" fontWeight="bold" textAnchor="middle">
                      {simMode === 'ddos' ? 'WAF: BLOCKED' : 'AWS WAF'}
                    </text>
                  </g>

                  {/* Node 4: Application Load Balancer */}
                  <g className="mesh-node cursor-pointer" onClick={() => setSelectedNodeId('alb')}>
                    <circle cx="270" cy="100" r="16" fill="url(#g-alb)" stroke={selectedNodeId === 'alb' ? '#34d399' : '#ea580c'} strokeWidth="1.8" />
                    <text x="270" y="103" fill="#fff" fontSize="7" fontWeight="bold" textAnchor="middle">ALB</text>
                    <text x="270" y="126" fill={isDarkTheme ? '#94a3b8' : '#64748b'} fontSize="7" textAnchor="middle">ELB ALB</text>
                  </g>

                  {/* Node 5: ECS Task Primary us-east-1 */}
                  <g className="mesh-node cursor-pointer" onClick={() => setSelectedNodeId('ecs')}>
                    <rect x="360" y="44" width="30" height="32" rx="5" fill={simMode === 'outage' ? '#991b1b' : 'url(#g-ecs)'} stroke={selectedNodeId === 'ecs' ? '#34d399' : '#2563eb'} strokeWidth="1.8" />
                    <text x="375" y="60" fill="#fff" fontSize="7.5" fontWeight="bold" textAnchor="middle">ECS</text>
                    <text x="375" y="70" fill="#fff" fontSize="6" textAnchor="middle">us-east-1</text>
                    <text x="375" y="88" fill={simMode === 'outage' ? '#f43f5e' : (isDarkTheme ? '#64748b' : '#8898aa')} fontSize="7" fontWeight="bold" textAnchor="middle">
                      {simMode === 'outage' ? '☠️ OUTAGE' : simMode === 'spike' ? 'Task (x4)' : 'Task (x2)'}
                    </text>
                  </g>

                  {/* Node 6: ECS Task Secondary us-west-2 */}
                  <g className="mesh-node cursor-pointer" onClick={() => setSelectedNodeId('ecs')}>
                    <rect x="360" y="124" width="30" height="32" rx="5" fill="url(#g-ecs)" opacity={simMode === 'failover' ? 1 : 0.4} stroke={selectedNodeId === 'ecs' ? '#34d399' : '#2563eb'} strokeWidth="1.8" />
                    <text x="375" y="140" fill="#fff" fontSize="7.5" fontWeight="bold" textAnchor="middle" opacity={simMode === 'failover' ? 1 : 0.5}>ECS</text>
                    <text x="375" y="150" fill="#fff" fontSize="6" textAnchor="middle" opacity={simMode === 'failover' ? 1 : 0.5}>us-west-2</text>
                    <text x="375" y="168" fill={isDarkTheme ? '#64748b' : '#94a3b8'} fontSize="7" textAnchor="middle">DR Standby</text>
                  </g>

                  {/* Node 7: ElastiCache Redis */}
                  <g className="mesh-node cursor-pointer" onClick={() => setSelectedNodeId('cache')}>
                    <circle cx="420" cy="100" r="14" fill="#be123c" opacity={simMode === 'outage' ? 0.3 : 0.9} stroke={selectedNodeId === 'cache' ? '#34d399' : '#f43f5e'} strokeWidth="1.5" />
                    <text x="420" y="103" fill="#fff" fontSize="6.5" fontWeight="bold" textAnchor="middle">Cache</text>
                    <text x="420" y="122" fill={isDarkTheme ? '#64748b' : '#94a3b8'} fontSize="7" textAnchor="middle">ElastiCache</text>
                  </g>

                  {/* Node 8: Aurora Primary DB */}
                  <g className="mesh-node cursor-pointer" onClick={() => setSelectedNodeId('db')}>
                    <rect x="461" y="44" width="28" height="24" rx="4" fill="url(#g-db)" stroke={selectedNodeId === 'db' ? '#34d399' : '#059669'} strokeWidth="1.5" />
                    <ellipse cx="475" cy="44" rx="14" ry="4" fill="#a7f3d0" stroke={selectedNodeId === 'db' ? '#34d399' : '#059669'} strokeWidth="0.8" />
                    <text x="475" y="58" fill="#fff" fontSize="7.5" fontWeight="bold" textAnchor="middle">DB-W</text>
                    <text x="475" y="80" fill={isDarkTheme ? '#64748b' : '#94a3b8'} fontSize="7" textAnchor="middle">Aurora Prim</text>
                  </g>

                  {/* Node 9: Aurora Replica DB */}
                  <g className="mesh-node cursor-pointer" onClick={() => setSelectedNodeId('db')}>
                    <rect x="461" y="124" width="28" height="24" rx="4" fill="url(#g-db)" opacity="0.7" stroke={selectedNodeId === 'db' ? '#34d399' : '#059669'} strokeWidth="1.5" />
                    <ellipse cx="475" cy="124" rx="14" ry="4" fill="#a7f3d0" opacity="0.7" stroke={selectedNodeId === 'db' ? '#34d399' : '#059669'} strokeWidth="0.8" />
                    <text x="475" y="138" fill="#fff" fontSize="7.5" fontWeight="bold" textAnchor="middle">DB-R</text>
                    <text x="475" y="160" fill={isDarkTheme ? '#64748b' : '#94a3b8'} fontSize="7" textAnchor="middle">Aurora Repl</text>
                  </g>

                  {/* Node 10: S3 Assets Storage */}
                  <g className="mesh-node cursor-pointer" onClick={() => setSelectedNodeId('s3')}>
                    <circle cx="475" cy="20" r="10" fill="#eab308" stroke={selectedNodeId === 's3' ? '#34d399' : '#ca8a04'} strokeWidth="1.2" />
                    <text x="475" y="23" fill="#fff" fontSize="7" fontWeight="bold" textAnchor="middle">S3</text>
                    <text x="508" y="23" fill={isDarkTheme ? '#64748b' : '#94a3b8'} fontSize="7.5" textAnchor="middle">S3 Bucket</text>
                  </g>
                </svg>
              </div>

              {/* Node Detail Inspector Drawer */}
              <div className={`rounded-2xl p-4 flex flex-col gap-3 min-h-[140px] text-left border transition-all duration-300 ${
                isDarkTheme ? 'bg-slate-950 border-slate-850 text-slate-300' : 'bg-white border-slate-200 shadow-sm text-slate-800'
              }`}>
                {selectedNodeId && nodeDetails[selectedNodeId] ? (
                  <div className="flex flex-col gap-3 animate-fadeIn">
                    <div className={`flex items-center justify-between border-b pb-2 transition-all ${
                      isDarkTheme ? 'border-slate-800' : 'border-slate-100'
                    }`}>
                      <div className="flex flex-col">
                        <span className={`text-xs font-black tracking-tight flex items-center gap-1.5 transition-all ${
                          isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'
                        }`}>
                          <Server className={`w-3.5 h-3.5 ${isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          {nodeDetails[selectedNodeId].title}
                        </span>
                        <span className={`text-[8px] uppercase tracking-widest font-mono transition-all ${
                          isDarkTheme ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          {nodeDetails[selectedNodeId].category}
                        </span>
                      </div>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider border transition-all ${
                        isDarkTheme ? 'bg-slate-900 border-slate-800 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}>
                        {nodeDetails[selectedNodeId].status}
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed font-medium transition-all ${
                      isDarkTheme ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {nodeDetails[selectedNodeId].desc}
                    </p>

                    {/* Copyable AWS CLI Window */}
                    <div className="flex flex-col gap-1.5">
                      <span className={`text-[8.5px] font-bold uppercase tracking-widest font-mono flex items-center gap-1 transition-all ${
                        isDarkTheme ? 'text-slate-500' : 'text-slate-450'
                      }`}>
                        <Code className="w-3 h-3" /> Copyable AWS CLI command
                      </span>
                      <div className={`rounded-xl p-3 flex items-center justify-between font-mono text-[9.5px] overflow-x-auto shadow-inner border transition-all duration-300 ${
                        isDarkTheme ? 'bg-slate-900 border-slate-800/80 text-emerald-400' : 'bg-slate-950 border-slate-900 text-emerald-400'
                      }`}>
                        <span className="truncate pr-4">{nodeDetails[selectedNodeId].cli}</span>
                        <button
                          onClick={() => copyToClipboard(nodeDetails[selectedNodeId].cli, selectedNodeId)}
                          className={`px-2 py-1 border rounded transition flex items-center gap-1 shrink-0 font-sans text-[9px] font-semibold ${
                            isDarkTheme 
                              ? 'bg-slate-950 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-white' 
                              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
                          }`}
                        >
                          {copiedNodeId === selectedNodeId ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className={`flex flex-col gap-1 pt-1.5 border-t text-[10.5px] transition-all ${
                      isDarkTheme ? 'border-slate-900' : 'border-slate-100'
                    }`}>
                      <span className={`text-[8.5px] font-bold uppercase tracking-widest font-mono transition-all ${
                        isDarkTheme ? 'text-emerald-500' : 'text-emerald-600'
                      }`}>Architect Best Practices:</span>
                      <ul className={`list-disc list-inside flex flex-col gap-1 transition-all ${
                        isDarkTheme ? 'text-slate-400' : 'text-slate-600'
                      }`}>
                        {nodeDetails[selectedNodeId].bestPractices.map((bp, i) => (
                          <li key={i} className="leading-relaxed">{bp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className={`flex items-center justify-center gap-2.5 h-full py-6 select-none transition-all duration-300 ${
                    isDarkTheme ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    <Terminal className={`w-5 h-5 shrink-0 ${isDarkTheme ? 'text-slate-700' : 'text-slate-300'}`} />
                    <span className="text-xs font-bold leading-relaxed tracking-wide text-center max-w-sm">
                      💡 Click on any active node (DNS53, CDN, ALB, ECS, DB, Cache) in the network grid above to inspect configuration logs, Security settings, and copyable AWS CLI commands!
                    </span>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Scenario Advisor Panel */}
      <section id="scenario-advisor" className={`border rounded-3xl p-6 md:p-8 flex flex-col gap-6 transition-all duration-500 ${
        isDarkTheme 
          ? 'bg-slate-900/60 border-slate-800/80 shadow-2xl text-slate-100' 
          : 'bg-white border-slate-200 shadow-sm text-slate-800'
      }`}>
        <div className="flex flex-col gap-1.5 animate-fadeIn">
          <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-all ${
            isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'
          }`}>
            <ShieldCheck className="w-4 h-4" /> Cloud Architect Advisor
          </span>
          <h2 className={`text-xl md:text-2xl font-extrabold tracking-tight transition-all ${
            isDarkTheme ? 'text-white' : 'text-slate-900'
          }`}>
            How Do I Design For Scale?
          </h2>
          <p className={`text-xs max-w-xl transition-all ${
            isDarkTheme ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Select a common production bottleneck scenario below. The advisor engine will outline optimal architectural blueprints and direct you to the corresponding sandbox modules.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Interactive Scenarios Selectors (col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-2.5 w-full">
            {scenarios.map((scenario) => {
              const isSelected = selectedScenarioId === scenario.id;
              const isNoneSelected = selectedScenarioId === null;
              
              // Call to Action / Invitation border styles when no scenario is selected
              let cardBgBorderClass = '';
              if (isSelected) {
                cardBgBorderClass = isDarkTheme
                  ? 'bg-slate-950 border-emerald-500/80 text-white shadow-lg'
                  : 'bg-slate-900 border-slate-900 text-white shadow-lg';
              } else if (isNoneSelected) {
                // Pulse invitation highlight class
                cardBgBorderClass = isDarkTheme
                  ? 'bg-slate-900/40 border-emerald-900/50 hover:bg-slate-900/80 hover:border-emerald-500 text-slate-200 shadow-md hover:-translate-y-0.5'
                  : 'bg-white border-emerald-300 hover:bg-slate-50 hover:border-emerald-500 text-slate-800 shadow-[0_4px_12px_rgba(16,185,129,0.04)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.12)] hover:-translate-y-0.5';
              } else {
                cardBgBorderClass = isDarkTheme
                  ? 'bg-slate-900/10 border-slate-850 hover:bg-slate-900/40 hover:border-slate-800 text-slate-400'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-800';
              }

              return (
                <button
                  key={scenario.id}
                  onClick={() => {
                    const nextId = isSelected ? null : scenario.id;
                    setSelectedScenarioId(nextId);
                    setSimMode('normal');
                  }}
                  className={`text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 w-full group ${cardBgBorderClass}`}
                >
                  <div className={`p-2.5 rounded-xl text-lg transition-all duration-300 border ${
                    isSelected 
                      ? 'bg-emerald-950/80 border-emerald-900/40 text-emerald-400' 
                      : isNoneSelected 
                        ? isDarkTheme 
                          ? 'bg-emerald-950/30 border-emerald-900/30 text-emerald-400' 
                          : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                        : isDarkTheme
                          ? 'bg-slate-950 border-slate-850 text-slate-400'
                          : 'bg-white border border-slate-200 text-slate-700'
                  }`}>
                    {scenario.icon}
                  </div>
                  <div className="flex-grow flex flex-col gap-1 pr-1">
                    <span className="text-xs font-bold tracking-tight leading-snug">
                      {scenario.title}
                    </span>
                    
                    {isNoneSelected ? (
                      <span className={`text-[9.5px] font-extrabold px-2.5 py-0.5 rounded-md border animate-pulse flex items-center gap-1.5 w-fit mt-1 shadow-sm transition-all duration-300 ${
                        isDarkTheme 
                          ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400' 
                          : 'bg-emerald-50/80 text-emerald-700 border-emerald-300/30'
                      }`}>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        Analyze Blueprint
                      </span>
                    ) : (
                      <span className={`text-[10px] leading-normal font-medium flex items-center gap-1 transition-all ${
                        isSelected 
                          ? 'text-slate-400' 
                          : isDarkTheme ? 'text-slate-500' : 'text-slate-500'
                      }`}>
                        {isSelected ? 'Active Blueprint' : 'Click to inspect blueprint'} 
                        <ChevronRight className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-90 text-emerald-400' : 'group-hover:translate-x-0.5'}`} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Rich Scenario Detail Display Pane (col-span-7) */}
          <div className="lg:col-span-7 h-full">
            {activeScenario ? (
              <div className={`border rounded-2xl p-6 flex flex-col gap-5 animate-fadeIn transition-all duration-300 ${
                isDarkTheme ? 'bg-slate-950/40 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200/80 text-slate-800'
              }`}>
                <div className={`flex items-center gap-2 pb-3 border-b transition-all duration-300 ${
                  isDarkTheme ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  <span className="text-2xl">{activeScenario.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">AWS Recommended Architecture</span>
                    <span className={`text-xs font-black tracking-tight leading-normal transition-all duration-300 ${
                      isDarkTheme ? 'text-white' : 'text-slate-800'
                    }`}>
                      {activeScenario.title}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest font-mono">The Engineering Challenge</span>
                  <p className={`text-xs leading-relaxed font-medium transition-all duration-300 ${
                    isDarkTheme ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {activeScenario.problem}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <span className={`text-[10.5px] font-bold uppercase tracking-widest font-mono transition-all duration-300 ${
                    isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'
                  }`}>Recommended Blueprint Solution</span>
                  <p className={`text-xs leading-relaxed font-medium transition-all duration-300 ${
                    isDarkTheme ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    {activeScenario.solution}
                  </p>
                </div>

                {/* Dynamic SVG Architectural Flow Diagram */}
                <div className={`flex flex-col gap-3 pt-2 border-t transition-all duration-300 ${
                  isDarkTheme ? 'border-slate-800' : 'border-slate-200/80'
                }`}>
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest font-mono">Interactive Flow Blueprint</span>
                  
                  {/* Interactive Toggle Widgets Bar */}
                  {renderSimulationWidgets(activeScenario.id)}

                  <div className={`rounded-2xl p-4 overflow-x-auto shadow-inner flex items-center justify-center border transition-all duration-300 ${
                    isDarkTheme ? 'bg-slate-950 border-slate-850' : 'bg-white border-slate-200'
                  }`}>
                    {renderScenarioDiagram(activeScenario.id)}
                  </div>
                </div>

                <div className={`flex flex-col gap-2.5 pt-2 border-t transition-all duration-300 ${
                  isDarkTheme ? 'border-slate-800' : 'border-slate-200/80'
                }`}>
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest font-mono">Launch Interactive Sandboxes</span>
                  <div className="flex flex-col gap-2">
                    {activeScenario.links.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className={`px-4 py-2.5 border rounded-xl text-xs font-semibold flex items-center justify-between transition-all group ${
                          isDarkTheme 
                            ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 hover:bg-slate-850' 
                            : 'bg-white border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          {link.name}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 text-slate-400 group-hover:text-emerald-500" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`shadow-md rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-6 min-h-[460px] relative overflow-hidden border transition-all duration-300 ${
                isDarkTheme ? 'bg-slate-950/30 border-slate-800 shadow-2xl shadow-black/30' : 'bg-white border-slate-200 shadow-md'
              }`}>
                {/* Floating ambient subtle backdrop glows */}
                <div className="absolute top-[-10%] left-[-10%] w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>

                <div className="relative w-full flex items-center justify-center">
                  <svg width="240" height="240" viewBox="0 0 240 240" className="overflow-visible max-w-full">
                    <defs>
                      <radialGradient id="hub-grad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#047857" />
                      </radialGradient>
                      <radialGradient id="glow-grad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    <style>{`
                      @keyframes rotClock {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                      @keyframes rotCounter {
                        0% { transform: rotate(360deg); }
                        100% { transform: rotate(0deg); }
                      }
                      .spin-clock {
                        animation: rotClock 28s linear infinite;
                        transform-origin: 120px 120px;
                      }
                      .spin-counter {
                        animation: rotCounter 32s linear infinite;
                        transform-origin: 120px 120px;
                      }
                      .ping-node {
                        animation: pulseGlow 2.5s ease-in-out infinite alternate;
                        transform-origin: 120px 120px;
                      }
                      @keyframes pulseGlow {
                        0% { filter: drop-shadow(0 0 2px rgba(16, 185, 129, 0.3)); opacity: 0.8; }
                        100% { filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.7)); opacity: 1; }
                      }
                    `}</style>

                    {/* Orbit lines */}
                    <circle cx="120" cy="120" r="95" fill="none" stroke={isDarkTheme ? '#1e293b' : '#f1f5f9'} strokeWidth="2.5" />
                    <circle cx="120" cy="120" r="70" fill="none" stroke={isDarkTheme ? '#334155' : '#e2e8f0'} strokeWidth="1.5" strokeDasharray="6,4" />
                    <circle cx="120" cy="120" r="45" fill="none" stroke={isDarkTheme ? '#475569' : '#cbd5e1'} strokeWidth="1" opacity="0.6" />

                    {/* Core Hub with active glow */}
                    <circle cx="120" cy="120" r="30" fill="url(#glow-grad)" className="ping-node" />
                    <circle cx="120" cy="120" r="16" fill="url(#hub-grad)" stroke="#ffffff" strokeWidth="2" className="ping-node" />
                    
                    {/* Tiny nodes rotating clockwise (Middle orbit: radius 70) */}
                    <g className="spin-clock">
                      {/* Database icon node (emerald) */}
                      <g transform="translate(120, 10)">
                        <circle cx="0" cy="0" r="9" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
                        <text x="0" y="3" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">DB</text>
                      </g>
                      {/* Compute node (blue) */}
                      <g transform="translate(120, 230)">
                        <circle cx="0" cy="0" r="9" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                        <text x="0" y="3" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">VM</text>
                      </g>
                    </g>

                    {/* Tiny nodes rotating counter-clockwise (Outer orbit: radius 95) */}
                    <g className="spin-counter">
                      {/* Network DNS node (violet) */}
                      <g transform="translate(25, 120)">
                        <circle cx="0" cy="0" r="9" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1.5" />
                        <text x="0" y="2.5" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">DNS</text>
                      </g>
                      {/* Security Shield node (rose) */}
                      <g transform="translate(215, 120)">
                        <circle cx="0" cy="0" r="9" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />
                        <text x="0" y="3.5" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">🛡️</text>
                      </g>
                    </g>

                    {/* connection crosshair overlays */}
                    <line x1="120" y1="104" x2="120" y2="70" stroke={isDarkTheme ? '#475569' : '#cbd5e1'} strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="120" y1="136" x2="120" y2="170" stroke={isDarkTheme ? '#475569' : '#cbd5e1'} strokeWidth="1" strokeDasharray="2,2" />
                  </svg>
                </div>

                <div className="flex flex-col gap-2.5 max-w-sm relative z-10">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-mono font-bold tracking-widest uppercase animate-pulse w-fit mx-auto shadow-sm border transition-all duration-300 ${
                    isDarkTheme ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    ⚡ advisor engine: ready
                  </span>
                  <h3 className={`text-base font-extrabold transition-all duration-300 ${
                    isDarkTheme ? 'text-white' : 'text-slate-800'
                  }`}>
                    No Bottleneck Profile Selected
                  </h3>
                  <p className={`text-xs leading-relaxed font-medium transition-all duration-300 ${
                    isDarkTheme ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Select one of the architectural challenges on the left. The advisor engine will construct the corresponding solution blueprint, live simulations, and interactive conduits.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* AWS Cloud Architect Q&A Explorer Section */}
      <section id="qa-explorer" className={`border rounded-3xl p-6 md:p-8 flex flex-col gap-6 scroll-mt-24 transition-all duration-500 ${
        isDarkTheme 
          ? 'bg-slate-900/60 border-slate-800/80 shadow-2xl text-slate-100' 
          : 'bg-white border-slate-200 shadow-sm text-slate-800'
      }`}>
        <div className="flex flex-col gap-1.5 animate-fadeIn">
          <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 font-mono transition-all ${
            isDarkTheme ? 'text-emerald-400' : 'text-emerald-600'
          }`}>
            <HelpCircle className="w-4 h-4" /> Cloud Architect Knowledge Base
          </span>
          <h2 className={`text-xl md:text-2xl font-extrabold tracking-tight transition-all ${
            isDarkTheme ? 'text-white' : 'text-slate-900'
          }`}>
            AWS Architect Q&A Explorer
          </h2>
          <p className={`text-xs max-w-xl transition-all ${
            isDarkTheme ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Explore deep-dive technical explanations for standard architectural interview topics and cloud design patterns. Launch the interactive sandbox models to visualize each concept in action.
          </p>
        </div>

        {/* Tab Headers */}
        <div className={`flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1 border-b transition-all duration-300 ${
          isDarkTheme ? 'border-slate-800' : 'border-slate-100'
        }`}>
          {(['compute', 'networking', 'database', 'security', 'storage', 'integration'] as const).map(tab => {
            const isActive = activeQaTab === tab;
            let themeClass = 'bg-slate-900 text-white border-slate-900';
            let hoverClass = isDarkTheme 
              ? 'hover:bg-slate-800 hover:border-slate-700 text-slate-400 hover:text-white' 
              : 'hover:bg-slate-50 hover:border-slate-350 text-slate-600';
            
            if (isActive) {
              if (tab === 'compute') themeClass = 'bg-cyan-500 border-cyan-500 text-white';
              else if (tab === 'networking') themeClass = 'bg-violet-500 border-violet-500 text-white';
              else if (tab === 'database') themeClass = 'bg-emerald-500 border-emerald-500 text-white';
              else if (tab === 'security') themeClass = 'bg-rose-500 border-rose-500 text-white';
              else if (tab === 'storage') themeClass = 'bg-amber-500 border-amber-500 text-white';
              else if (tab === 'integration') themeClass = 'bg-indigo-500 border-indigo-500 text-white';
            }

            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveQaTab(tab);
                  setExpandedQuestionId(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all capitalize ${
                  isActive ? themeClass : `${isDarkTheme ? 'bg-slate-950 border-slate-850' : 'bg-white border-slate-200'} ${hoverClass}`
                }`}
              >
                {tab === 'integration' ? 'Integration & DR' : tab}
              </button>
            );
          })}
        </div>

        {/* Questions Grid */}
        <div className="flex flex-col gap-3">
          {qaData[activeQaTab].map(item => {
            const isExpanded = expandedQuestionId === item.id;
            return (
              <div
                key={item.id}
                className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
                  isExpanded 
                    ? isDarkTheme ? 'border-slate-750 bg-slate-950/60 shadow-inner' : 'border-slate-900 bg-slate-50/50 shadow-sm' 
                    : isDarkTheme ? 'border-slate-850 bg-slate-900/10 hover:border-slate-750 hover:shadow-sm' : 'border-slate-200 bg-white hover:border-slate-350 hover:shadow-xs'
                }`}
              >
                {/* Header/Question Trigger */}
                <button
                  onClick={() => setExpandedQuestionId(isExpanded ? null : item.id)}
                  className={`w-full text-left p-4 flex items-center justify-between gap-4 font-bold text-xs md:text-sm transition-all duration-300 ${
                    isDarkTheme ? 'text-slate-200 hover:text-white' : 'text-slate-800 hover:text-slate-900'
                  }`}
                >
                  <span className="leading-snug">{item.q}</span>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''} ${isDarkTheme ? 'text-slate-300' : 'text-slate-900'}`} />
                </button>

                {/* Content Panel */}
                {isExpanded && (
                  <div className={`px-4 pb-5 pt-1 border-t flex flex-col gap-4 animate-fadeIn text-left transition-all ${
                    isDarkTheme ? 'border-slate-850' : 'border-slate-100'
                  }`}>
                    <p className={`text-xs leading-relaxed font-medium transition-all duration-300 ${
                      isDarkTheme ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {item.a}
                    </p>

                    {/* Architectural Flow Diagram */}
                    {item.diagram && (
                      <div className="flex flex-col gap-1.5">
                        <span className={`text-[9px] font-bold uppercase tracking-widest font-mono flex items-center gap-1 transition-all ${
                          isDarkTheme ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          <Code className="w-3 h-3" /> System Architecture Layout
                        </span>
                        <pre className="bg-slate-900 border border-slate-850 rounded-xl p-3 font-mono text-[9px] text-emerald-400 leading-relaxed overflow-x-auto shadow-inner">
                          {item.diagram}
                        </pre>
                      </div>
                    )}

                    {/* Launch sandbox button */}
                    <Link
                      to={item.sandboxLink}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all w-fit shadow-md hover:shadow-lg hover:-translate-y-0.5 ${
                        isDarkTheme 
                          ? 'bg-slate-950 border border-slate-800 text-white hover:bg-slate-900 hover:border-slate-700' 
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{item.sandboxName}</span>
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Main Search & Interactive Visualizers Grid Section */}
      <section id="visualizers-explorer" className="flex flex-col gap-6 scroll-mt-24">
        
        {/* Search & Category Filter Header */}
        <div className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b pb-5 transition-all duration-300 ${
          isDarkTheme ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5 animate-fadeIn">
            <div className={`p-2 rounded-xl transition-all ${
              isDarkTheme ? 'bg-slate-950 border border-slate-850 text-slate-350 shadow-inner' : 'bg-slate-900 text-white'
            }`}>
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <h2 className={`text-xl font-extrabold tracking-tight transition-all ${
                isDarkTheme ? 'text-white' : 'text-slate-900'
              }`}>AWS Modules Registry</h2>
              <p className={`text-xs transition-all ${
                isDarkTheme ? 'text-slate-400' : 'text-slate-500'
              }`}>Filter modules dynamically by service type or keywords</p>
            </div>
          </div>

          {/* Search bar input container */}
          <div className="relative max-w-sm w-full">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-all ${
              isDarkTheme ? 'text-slate-550' : 'text-slate-400'
            } pointer-events-none`} />
            <input
              type="text"
              placeholder="Search by S3, ALB, failover, versions..."
              className={`w-full pl-9 pr-8 py-2 border rounded-xl text-xs font-medium transition-all ${
                isDarkTheme 
                  ? 'bg-slate-900 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-slate-650' 
                  : 'bg-white border-slate-300 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-800'
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded border transition-all ${
                  isDarkTheme 
                    ? 'text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border-slate-800' 
                    : 'text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 border-slate-200'
                }`}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Custom Category Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all duration-300 ${
              activeCategory === 'all'
                ? isDarkTheme ? 'bg-slate-100 border-slate-100 text-slate-950' : 'bg-slate-900 border-slate-900 text-white'
                : isDarkTheme ? 'bg-slate-900 border-slate-800/80 text-slate-400 hover:bg-slate-800 hover:border-slate-700 hover:text-white' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
            }`}
          >
            <span>All Modules</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono transition-all duration-300 ${
              activeCategory === 'all' 
                ? isDarkTheme ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 text-slate-300' 
                : isDarkTheme ? 'bg-slate-950 border border-slate-850 text-slate-500' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>{getCategoryCount('all')}</span>
          </button>

          <button
            onClick={() => setActiveCategory('compute')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all duration-300 ${
              activeCategory === 'compute'
                ? 'bg-cyan-500 border-cyan-500 text-white'
                : isDarkTheme ? 'bg-slate-900 border-slate-800/80 text-slate-400 hover:bg-slate-800 hover:border-slate-700 hover:text-white' : 'bg-white border-slate-200 hover:bg-cyan-50 hover:border-cyan-200 text-slate-600'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 shrink-0" />
            <span>Compute &amp; Containers</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono transition-all duration-300 ${
              activeCategory === 'compute' 
                ? 'bg-cyan-600 text-cyan-100' 
                : isDarkTheme ? 'bg-slate-950 border border-slate-850 text-slate-500' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>{getCategoryCount('compute')}</span>
          </button>

          <button
            onClick={() => setActiveCategory('networking')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all duration-300 ${
              activeCategory === 'networking'
                ? 'bg-violet-500 border-violet-500 text-white'
                : isDarkTheme ? 'bg-slate-900 border-slate-800/80 text-slate-400 hover:bg-slate-800 hover:border-slate-700 hover:text-white' : 'bg-white border-slate-200 hover:bg-violet-50 hover:border-violet-200 text-slate-600'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>Networking &amp; CDN</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono transition-all duration-300 ${
              activeCategory === 'networking' 
                ? 'bg-violet-600 text-violet-100' 
                : isDarkTheme ? 'bg-slate-950 border border-slate-850 text-slate-500' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>{getCategoryCount('networking')}</span>
          </button>

          <button
            onClick={() => setActiveCategory('databases')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all duration-300 ${
              activeCategory === 'databases'
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : isDarkTheme ? 'bg-slate-900 border-slate-800/80 text-slate-400 hover:bg-slate-800 hover:border-slate-700 hover:text-white' : 'bg-white border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 text-slate-600'
            }`}
          >
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>Databases &amp; Cache</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono transition-all duration-300 ${
              activeCategory === 'databases' 
                ? 'bg-emerald-600 text-emerald-100' 
                : isDarkTheme ? 'bg-slate-950 border border-slate-850 text-slate-500' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>{getCategoryCount('databases')}</span>
          </button>

          <button
            onClick={() => setActiveCategory('storage')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all duration-300 ${
              activeCategory === 'storage'
                ? 'bg-amber-500 border-amber-500 text-white'
                : isDarkTheme ? 'bg-slate-900 border-slate-800/80 text-slate-400 hover:bg-slate-800 hover:border-slate-700 hover:text-white' : 'bg-white border-slate-200 hover:bg-amber-50 hover:border-amber-200 text-slate-600'
            }`}
          >
            <Folder className="w-3.5 h-3.5 shrink-0" />
            <span>Storage &amp; Filesystems</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono transition-all duration-300 ${
              activeCategory === 'storage' 
                ? 'bg-amber-600 text-amber-100' 
                : isDarkTheme ? 'bg-slate-950 border border-slate-850 text-slate-500' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>{getCategoryCount('storage')}</span>
          </button>

          <button
            onClick={() => setActiveCategory('integration')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all duration-300 ${
              activeCategory === 'integration'
                ? 'bg-indigo-500 border-indigo-500 text-white'
                : isDarkTheme ? 'bg-slate-900 border-slate-800/80 text-slate-400 hover:bg-slate-800 hover:border-slate-700 hover:text-white' : 'bg-white border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-600'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 shrink-0" />
            <span>Messaging &amp; Analytics</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono transition-all duration-300 ${
              activeCategory === 'integration' 
                ? 'bg-indigo-600 text-indigo-100' 
                : isDarkTheme ? 'bg-slate-950 border border-slate-850 text-slate-500' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>{getCategoryCount('integration')}</span>
          </button>
        </div>

        {/* Dynamic Display Grid */}
        {filteredVisualizers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVisualizers.map((viz) => {
              // Custom Category Styles
              let accentClass = '';
              let badgeBg = '';

              if (viz.category === 'compute') {
                accentClass = isDarkTheme ? 'hover:border-cyan-500 hover:shadow-cyan-950/20' : 'hover:border-cyan-400 hover:shadow-cyan-50/50';
                badgeBg = isDarkTheme ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-900/50' : 'bg-cyan-50 text-cyan-700 border border-cyan-200';
              } else if (viz.category === 'networking') {
                accentClass = isDarkTheme ? 'hover:border-violet-500 hover:shadow-violet-950/20' : 'hover:border-violet-400 hover:shadow-violet-50/50';
                badgeBg = isDarkTheme ? 'bg-violet-950/40 text-violet-400 border border-violet-900/50' : 'bg-violet-50 text-violet-700 border border-violet-200';
              } else if (viz.category === 'databases') {
                accentClass = isDarkTheme ? 'hover:border-emerald-500 hover:shadow-emerald-950/20' : 'hover:border-emerald-400 hover:shadow-emerald-50/50';
                badgeBg = isDarkTheme ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200';
              } else if (viz.category === 'storage') {
                accentClass = isDarkTheme ? 'hover:border-amber-500 hover:shadow-amber-950/20' : 'hover:border-amber-400 hover:shadow-amber-50/50';
                badgeBg = isDarkTheme ? 'bg-amber-950/40 text-amber-400 border border-amber-900/50' : 'bg-amber-50 text-amber-700 border border-amber-200';
              } else if (viz.category === 'integration') {
                accentClass = isDarkTheme ? 'hover:border-indigo-500 hover:shadow-indigo-950/20' : 'hover:border-indigo-400 hover:shadow-indigo-50/50';
                badgeBg = isDarkTheme ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/50' : 'bg-indigo-50 text-indigo-700 border border-indigo-200';
              } else {
                accentClass = isDarkTheme ? 'hover:border-slate-700 hover:shadow-slate-950/20' : 'hover:border-slate-400 hover:shadow-slate-100';
                badgeBg = isDarkTheme ? 'bg-slate-950 border border-slate-850 text-slate-400' : 'bg-slate-100 text-slate-700 border border-slate-200';
              }

              return (
                <Link
                  key={viz.id}
                  to={viz.path}
                  className={`relative flex flex-col justify-between rounded-2xl p-5 transition-all duration-300 shadow-sm hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${accentClass} ${
                    isDarkTheme 
                      ? 'bg-slate-900/60 border border-slate-800/80 text-slate-100' 
                      : 'bg-white border border-slate-200 text-slate-800'
                  } ${
                    viz.comingSoon ? 'opacity-60 cursor-not-allowed hover:translate-y-0 hover:shadow-sm' : ''
                  }`}
                  onClick={(e) => viz.comingSoon && e.preventDefault()}
                >
                  <div className="flex flex-col gap-4">
                    {/* Header Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className={`text-3xl rounded-xl p-2.5 shrink-0 border transition-all ${
                        isDarkTheme ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-100'
                      }`}>
                        {viz.icon}
                      </div>

                      {/* Status Badges */}
                      {viz.comingSoon ? (
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border shrink-0 transition-all ${
                          isDarkTheme ? 'bg-slate-950 border-slate-850 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}>
                          ● Roadmap
                        </span>
                      ) : (
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border shrink-0 flex items-center gap-1.5 transition-all ${
                          isDarkTheme ? 'bg-emerald-950/40 border-emerald-900/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Online
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <h3 className={`text-sm font-bold tracking-tight transition-all ${
                        isDarkTheme ? 'text-white' : 'text-slate-800'
                      }`}>
                        {viz.title}
                      </h3>
                      <p className={`text-[11.5px] leading-relaxed font-medium transition-all ${
                        isDarkTheme ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {viz.description}
                      </p>
                    </div>
                  </div>

                  {/* Tag List & Links (Bottom) */}
                  <div className={`mt-5 pt-4 border-t flex flex-col gap-3 transition-all ${
                    isDarkTheme ? 'border-slate-800' : 'border-slate-100'
                  }`}>
                    <div className="flex flex-wrap gap-1.5">
                      {/* Domain Badge */}
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${badgeBg}`}>
                        {viz.category}
                      </span>
                      {viz.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className={`px-2 py-0.5 text-[9px] font-bold rounded border transition-all ${
                            isDarkTheme ? 'bg-slate-950 text-slate-400 border-slate-850' : 'bg-slate-50 text-slate-500 border border-slate-200'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {!viz.comingSoon && (
                      <div className={`text-[10px] font-bold flex items-center gap-1 transition-all ${
                        isDarkTheme ? 'text-slate-500 group-hover:text-slate-350' : 'text-slate-400 group-hover:text-slate-600'
                      }`}>
                        Open Architect sandbox <ChevronRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className={`border-2 border-dashed rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
            isDarkTheme ? 'border-slate-850 bg-slate-900/10' : 'border-slate-200 bg-slate-50/50'
          }`}>
            <div className={`p-3 rounded-full border transition-all ${
              isDarkTheme ? 'bg-slate-950 text-slate-500 border-slate-850' : 'bg-slate-100 text-slate-400 border border-slate-200'
            }`}>
              <Search className="w-6 h-6" />
            </div>
            <h3 className={`text-sm font-bold ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>No Modules Match Your Search</h3>
            <p className={`text-xs max-w-xs leading-relaxed transition-all ${isDarkTheme ? 'text-slate-400' : 'text-slate-500'}`}>
              We couldn't find any visualizer matching <span className={`font-semibold ${isDarkTheme ? 'text-slate-300' : 'text-slate-700'}`}>"{searchTerm}"</span> under the selected category. Try resetting filters.
            </p>
            <button 
              onClick={() => { setSearchTerm(''); setActiveCategory('all'); }} 
              className={`mt-2 text-xs font-bold border px-3 py-1.5 rounded-xl transition-all ${
                isDarkTheme 
                  ? 'text-emerald-450 border-emerald-900 bg-slate-950 hover:bg-emerald-950/20' 
                  : 'text-emerald-600 hover:text-emerald-700 border-emerald-200 bg-white hover:bg-emerald-50'
              }`}
            >
              Reset All Filters
            </button>
          </div>
        )}
      </section>

      {/* Global Learning Section */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col gap-2 max-w-xl text-left">
            <span className="text-emerald-400 text-xs font-extrabold uppercase tracking-widest font-mono flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> Comprehensive Cloud Architect Blueprints
            </span>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">How This Workbench Visualizes Infrastructure</h2>
            <p className="text-slate-300 text-xs leading-relaxed mt-2 font-medium">
              Every sandbox dashboard is engineered using self-contained React engines. They track client state, enqueue packet distributions, trigger failures, and simulate high-scale pipelines live.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full md:w-auto shrink-0">
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-1 min-w-[180px]">
              <span className="text-[9px] font-extrabold text-emerald-400 uppercase tracking-widest font-mono">1. Interactive Control</span>
              <span className="text-xs font-bold text-white">Adjust Spikes &amp; Nodes</span>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">Trigger failovers, inject lag, simulate heavy payloads.</p>
            </div>
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 flex flex-col gap-1 min-w-[180px]">
              <span className="text-[9px] font-extrabold text-cyan-400 uppercase tracking-widest font-mono">2. Structured Telemetry</span>
              <span className="text-xs font-bold text-white">Trace Terminal Logs</span>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">Observe event propagation in detailed log streams.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
  );
}
