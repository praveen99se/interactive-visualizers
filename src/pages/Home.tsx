import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Server
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
    id: 'alb-nlb',
    title: '🍪 ALB vs NLB Stickiness',
    description: 'Understand load balancer stickiness mechanisms - cookies vs flow hashing',
    tags: ['Load Balancing', 'HTTP/TCP', 'High Availability'],
    category: 'networking',
    path: '/visualizers/alb-nlb',
    icon: '⚡',
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
    id: 'ec2',
    title: '💻 AWS EC2',
    description: 'Simulations of virtual compute instances, bootstrapping scripts, security groups, spot markets, placement groups, and EBS vs EFS',
    tags: ['Virtual Servers', 'EBS vs EFS', 'Placement Groups'],
    category: 'compute',
    path: '/visualizers/ec2',
    icon: '💻',
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
  // Upcoming Roadmap Items
  {
    id: 'sorting-algorithms',
    title: '🔀 Sorting Algorithms',
    description: 'Visualize how different sorting algorithms work in real-time',
    tags: ['Algorithms', 'Data Structures'],
    category: 'compute',
    path: '/visualizers/sorting',
    icon: '📊',
    comingSoon: true,
  },
  {
    id: 'network-topology',
    title: '🌐 Network Topology',
    description: 'Explore OSI model, TCP/IP stack, and network protocols',
    tags: ['Networking', 'Education'],
    category: 'networking',
    path: '/visualizers/network',
    icon: '📡',
    comingSoon: true,
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
      { name: '🍪 ALB vs NLB Load Balancing Topologies', path: '/visualizers/alb-nlb' }
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
  }
];

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  // Interactive Simulation States
  const [simSpikeActive, setSimSpikeActive] = useState(false);
  const [simFailoverActive, setSimFailoverActive] = useState(false);
  const [simSecAttackActive, setSimSecAttackActive] = useState(false);

  // Live Telemetry states for Hero Section
  const [heroReqPerSec, setHeroReqPerSec] = useState(4284);
  const [heroLatency, setHeroLatency] = useState(24.5);
  const [heroCpuLoad, setHeroCpuLoad] = useState(16.8);
  const [heroActiveUsers, setHeroActiveUsers] = useState(1480);
  const [heroTrafficState, setHeroTrafficState] = useState<'normal' | 'spike' | 'ddos'>('normal');
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      if (heroTrafficState === 'normal') {
        setHeroReqPerSec(prev => {
          const delta = Math.floor(Math.random() * 40) - 20;
          return Math.max(4200, Math.min(prev + delta, 4450));
        });
        setHeroLatency(prev => {
          const delta = (Math.random() * 1.2 - 0.6);
          return Math.max(22.0, Math.min(parseFloat((prev + delta).toFixed(1)), 27.0));
        });
        setHeroCpuLoad(prev => {
          const delta = (Math.random() * 2 - 1);
          return Math.max(14.0, Math.min(parseFloat((prev + delta).toFixed(1)), 20.0));
        });
        setHeroActiveUsers(prev => {
          const delta = Math.floor(Math.random() * 8) - 4;
          return Math.max(1420, Math.min(prev + delta, 1550));
        });
      } else if (heroTrafficState === 'spike') {
        setHeroReqPerSec(prev => {
          const delta = Math.floor(Math.random() * 100) - 50;
          return Math.max(8300, Math.min(prev + delta, 8800));
        });
        setHeroLatency(prev => {
          const delta = (Math.random() * 3 - 1);
          return Math.max(55.0, Math.min(parseFloat((prev + delta).toFixed(1)), 72.0));
        });
        setHeroCpuLoad(prev => {
          const delta = (Math.random() * 4 - 2);
          return Math.max(68.0, Math.min(parseFloat((prev + delta).toFixed(1)), 82.0));
        });
        setHeroActiveUsers(prev => {
          const delta = Math.floor(Math.random() * 30) - 15;
          return Math.max(3400, Math.min(prev + delta, 3700));
        });
      } else if (heroTrafficState === 'ddos') {
        setHeroReqPerSec(prev => {
          const delta = Math.floor(Math.random() * 150) - 75;
          return Math.max(12400, Math.min(prev + delta, 13200));
        });
        setHeroLatency(prev => {
          const delta = (Math.random() * 1.5 - 0.75);
          return Math.max(23.0, Math.min(parseFloat((prev + delta).toFixed(1)), 28.5));
        });
        setHeroCpuLoad(prev => {
          const delta = (Math.random() * 1.5 - 0.75);
          return Math.max(22.0, Math.min(parseFloat((prev + delta).toFixed(1)), 29.0));
        });
        setHeroActiveUsers(prev => {
          const delta = Math.floor(Math.random() * 50) - 25;
          return Math.max(5100, Math.min(prev + delta, 5500));
        });
      }
    }, 1200);

    return () => clearInterval(timer);
  }, [heroTrafficState]);

  const nodeDetails: Record<string, { title: string; desc: string; metric1: string; metric2: string; status: string }> = {
    cdn: {
      title: 'Amazon CloudFront CDN',
      desc: 'Global edge content delivery network cache. Intercepts static assets requests and delivers them with ultra-low latency.',
      metric1: 'Edge Latency: < 5ms',
      metric2: 'Cache Hit Ratio: 94.8%',
      status: 'Active / Edge Layer'
    },
    waf: {
      title: 'AWS WAF Firewall',
      desc: 'Layer-7 Web Application Firewall. Auto-inspects headers, payloads, IP reputations, and triggers rate-limiting rules.',
      metric1: heroTrafficState === 'ddos' ? 'Threat Rate: 8.5k/s [BLOCKED]' : 'Threat Rate: 0/s [SAFE]',
      metric2: 'Rule Evaluation: <0.2ms',
      status: heroTrafficState === 'ddos' ? 'SHIELD PROTECT MODE' : 'Active / Monitoring'
    },
    alb: {
      title: 'Application Load Balancer',
      desc: 'Layer-7 sticky routing router. Hashes flow targets, monitors server cluster health, and performs SSL termination.',
      metric1: `Active Conns: ${heroActiveUsers.toLocaleString()}`,
      metric2: `RPS Flow: ${heroTrafficState === 'ddos' ? '~1,450 (Legit)' : `~${Math.round(heroReqPerSec * 0.95).toLocaleString()}`}`,
      status: 'Active / Healthy'
    },
    ecs: {
      title: 'Amazon ECS (Fargate Compute)',
      desc: 'Serverless Docker container blades running node applications. Managed automatically inside a highly secure isolated VPC.',
      metric1: `Cpu Load: ${heroCpuLoad}%`,
      metric2: heroTrafficState === 'spike' ? 'Task Blades: 6 Provisioned' : 'Task Blades: 2 Provisioned',
      status: heroTrafficState === 'spike' ? 'Auto-Scaling Triggered' : 'Normal / Stable'
    },
    db: {
      title: 'Amazon Aurora Multi-AZ Cluster',
      desc: 'Cloud-native database cluster with automatic storage scaling and sub-10ms replica syncing across physical locations.',
      metric1: heroTrafficState === 'spike' ? 'Database Latency: 4.8ms' : 'Database Latency: 0.8ms',
      metric2: heroTrafficState === 'spike' ? 'ACU Allocation: 12.5 ACU' : 'ACU Allocation: 2.0 ACU',
      status: heroTrafficState === 'spike' ? 'Storage IOPS Scale Out' : 'Active / Sync OK'
    }
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
            onClick={() => setSimSpikeActive(prev => !prev)}
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
            onClick={() => setSimFailoverActive(prev => !prev)}
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
            onClick={() => setSimSecAttackActive(prev => !prev)}
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
    <div className="flex flex-col gap-10">

      {/* Premium Light-Theme Interactive Operations Hero Workbench */}
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-emerald-50/40 rounded-3xl p-8 md:p-12 text-slate-800 border border-slate-200/80 shadow-xl">
        
        {/* Soft Ambient Radial Backdrops for Light Theme Depth */}
        <div className="absolute top-[-10%] left-[-15%] w-[450px] h-[450px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none animate-pulse duration-5000"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[450px] h-[450px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none animate-pulse duration-7000"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          {/* Left Column: Heading, Telemetry Controls & Overview */}
          <div className="lg:col-span-6 flex flex-col gap-6 text-left">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[10.5px] font-bold tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 w-fit shadow-[inset_0_1px_4px_rgba(16,185,129,0.05)]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-spin" style={{ animationDuration: '4s' }} /> 
              V3.0 AWS ARCHITECT WORKBENCH SANDBOX
            </span>
            
            <h1 className="text-3.5xl md:text-5.5xl font-black tracking-tight leading-[1.1] text-slate-950 select-none">
              Master Cloud Architecture <br />
              <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600 bg-clip-text text-transparent">
                Interactively &amp; Live
              </span>
            </h1>
            
            <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-xl font-medium tracking-wide">
              Interact directly with live network grids, event messaging buses, database clusters, and caching pipelines. Toggle operational workloads below to observe system telemetry update in real-time.
            </p>
            
            {/* Call to Actions */}
            <div className="flex flex-wrap gap-3.5">
              <a 
                href="#visualizers-explorer" 
                className="px-5.5 py-3.5 bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black rounded-2xl text-xs flex items-center gap-2.5 transition-all duration-300 shadow-[0_4px_18px_rgba(5,150,105,0.25)] hover:shadow-[0_8px_24px_rgba(5,150,105,0.45)] hover:-translate-y-0.5"
              >
                Launch Sandboxes <ArrowRight className="w-4 h-4 stroke-[2.8]" />
              </a>
              <a 
                href="#scenario-advisor" 
                className="px-5.5 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl text-xs border border-slate-200 shadow-sm hover:border-slate-350 transition-all duration-300 hover:-translate-y-0.5"
              >
                Inspect Blueprints
              </a>
            </div>

            {/* Live Traffic State Controller HUD */}
            <div className="bg-white/80 border border-slate-200/80 rounded-2xl p-4 flex flex-col gap-3 max-w-md backdrop-blur-sm shadow-md mt-1.5">
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                    Simulation Control Unit
                  </span>
                </div>
                <span className="text-[9px] font-mono text-slate-400 uppercase">
                  State: <span className="text-emerald-600 font-bold">{heroTrafficState}</span>
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => setHeroTrafficState('normal')}
                  className={`px-3 py-2 rounded-xl text-[10.5px] font-bold border transition-all duration-300 ${
                    heroTrafficState === 'normal'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm shadow-emerald-100'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  🟢 Normal
                </button>
                
                <button
                  onClick={() => setHeroTrafficState('spike')}
                  className={`px-3 py-2 rounded-xl text-[10.5px] font-bold border transition-all duration-300 ${
                    heroTrafficState === 'spike'
                      ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-sm shadow-amber-100 animate-pulse'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  ⚡ Spike Load
                </button>
                
                <button
                  onClick={() => setHeroTrafficState('ddos')}
                  className={`px-3 py-2 rounded-xl text-[10.5px] font-bold border transition-all duration-300 ${
                    heroTrafficState === 'ddos'
                      ? 'bg-rose-50 border-rose-400 text-rose-700 shadow-sm shadow-rose-100'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                  }`}
                >
                  🔒 DDoS Block
                </button>
              </div>
            </div>

          </div>

          {/* Right Column: Live Workstation Telemetry Console & SVG Mesh */}
          <div className="lg:col-span-6 flex flex-col gap-4 w-full">
            
            {/* Interactive Operations Console Pane (Light Theme Dashboard) */}
            <div className="bg-white/95 border border-slate-200/80 rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden flex flex-col gap-5 text-slate-800 backdrop-blur-sm">
              
              {/* Header Status Row */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      heroTrafficState === 'ddos' ? 'bg-rose-400' : heroTrafficState === 'spike' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      heroTrafficState === 'ddos' ? 'bg-rose-500' : heroTrafficState === 'spike' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}></span>
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    LIVE SYSTEM CONSOLE HUD
                  </span>
                </div>
                
                <span className="text-[9px] font-mono bg-slate-50 border border-slate-200/60 text-slate-500 px-2 py-0.5 rounded-md">
                  VPC_STATUS: <span className="text-emerald-600 font-bold">ONLINE</span>
                </span>
              </div>

              {/* Four Live Telemetry Counters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 flex flex-col gap-1 shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">REQ RATE</span>
                  <span className="text-sm md:text-base font-black text-indigo-600 font-mono leading-none">
                    {heroReqPerSec.toLocaleString()} <span className="text-[9px] text-slate-400 font-normal">RPS</span>
                  </span>
                  <div className="h-1 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        heroTrafficState === 'ddos' ? 'bg-rose-500 w-full' : heroTrafficState === 'spike' ? 'bg-amber-500 w-[70%]' : 'bg-indigo-500 w-[35%]'
                      }`}
                    ></div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 flex flex-col gap-1 shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">LATENCY</span>
                  <span className="text-sm md:text-base font-black text-amber-600 font-mono leading-none">
                    {heroLatency.toFixed(1)} <span className="text-[9px] text-slate-400 font-normal">ms</span>
                  </span>
                  <div className="h-1 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        heroTrafficState === 'ddos' ? 'bg-emerald-500 w-[20%]' : heroTrafficState === 'spike' ? 'bg-rose-500 w-[85%]' : 'bg-emerald-500 w-[25%]'
                      }`}
                    ></div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 flex flex-col gap-1 shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">CPU LOAD</span>
                  <span className={`text-sm md:text-base font-black font-mono leading-none ${
                    heroCpuLoad > 50 ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    {heroCpuLoad.toFixed(1)}<span className="text-[10px] text-slate-400 font-normal">%</span>
                  </span>
                  <div className="h-1 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        heroTrafficState === 'ddos' ? 'bg-emerald-500 w-[28%]' : heroTrafficState === 'spike' ? 'bg-rose-500 w-[78%]' : 'bg-emerald-500 w-[18%]'
                      }`}
                    ></div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-3 flex flex-col gap-1 shadow-sm">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">CONNS</span>
                  <span className="text-sm md:text-base font-black text-cyan-600 font-mono leading-none">
                    {heroActiveUsers.toLocaleString()} <span className="text-[9px] text-slate-400 font-normal">Sess</span>
                  </span>
                  <div className="h-1 w-full bg-slate-200 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        heroTrafficState === 'ddos' ? 'bg-rose-500 w-[90%]' : heroTrafficState === 'spike' ? 'bg-amber-500 w-[60%]' : 'bg-emerald-500 w-[30%]'
                      }`}
                    ></div>
                  </div>
                </div>

              </div>

              {/* Dynamic Isometric AWS Routing SVG mesh */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex items-center justify-center relative overflow-hidden shadow-inner">
                
                <svg width="100%" height="210" viewBox="0 0 500 210" className="max-w-full overflow-visible">
                  <defs>
                    {/* Blueprint grid backdrop pattern */}
                    <pattern id="blueprint-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="1.2" />
                    </pattern>

                    <linearGradient id="grad-cdn" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#6b21a8" />
                    </linearGradient>
                    <linearGradient id="grad-waf" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#be123c" />
                    </linearGradient>
                    <linearGradient id="grad-alb" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#c2410c" />
                    </linearGradient>
                    <linearGradient id="grad-ecs" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                    <linearGradient id="grad-db" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                    
                    {/* Light-theme Shadow Filter for floatation effect */}
                    <filter id="float-shadow-light" x="-20%" y="-20%" width="140%" height="150%">
                      <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#64748b" floodOpacity="0.2" />
                    </filter>
                  </defs>

                  <style>{`
                    .packet-stream { stroke-dasharray: 8, 8; animation: flowDash 1.6s linear infinite; }
                    .packet-stream-fast { stroke-dasharray: 6, 6; animation: flowDash 0.7s linear infinite; }
                    .packet-stream-ddos { stroke-dasharray: 4, 4; animation: flowDash 0.3s linear infinite; }
                    @keyframes flowDash { to { stroke-dashoffset: -32; } }
                    .iso-node { transition: all 0.3s ease; }
                    .iso-node:hover { filter: brightness(1.05) drop-shadow(0 0 8px rgba(16,185,129,0.2)); }
                  `}</style>

                  {/* Render subtle engineering blueprint backdrop grid */}
                  <rect width="100%" height="100%" fill="url(#blueprint-grid)" rx="16" />

                  {/* Deflected Path for blocked DDoS bots */}
                  {heroTrafficState === 'ddos' && (
                    <>
                      <path 
                        d="M 150 80 Q 150 135, 110 155 C 90 165, 50 165, 30 155" 
                        fill="none" 
                        stroke="#f43f5e" 
                        strokeWidth="2.5" 
                        className="packet-stream-ddos" 
                      />
                      {/* Trash Block Node */}
                      <g transform="translate(16, 142)">
                        <circle cx="14" cy="14" r="10" fill="#be123c" stroke="#ffe4e6" strokeWidth="1" />
                        <text x="14" y="18" fill="#ffffff" fontSize="11" fontWeight="extrabold" textAnchor="middle">×</text>
                      </g>
                    </>
                  )}

                  {/* Packet Streams based on traffic State */}
                  {heroTrafficState === 'normal' && (
                    <>
                      <line x1="10" y1="80" x2="50" y2="80" stroke="#0d9488" strokeWidth="2" className="packet-stream" />
                      <line x1="50" y1="80" x2="150" y2="80" stroke="#0d9488" strokeWidth="2" className="packet-stream" />
                      <line x1="150" y1="80" x2="250" y2="80" stroke="#0d9488" strokeWidth="2" className="packet-stream" />
                      <line x1="250" y1="80" x2="350" y2="80" stroke="#0d9488" strokeWidth="2" className="packet-stream" />
                      <line x1="350" y1="80" x2="450" y2="80" stroke="#0d9488" strokeWidth="2" className="packet-stream" />
                    </>
                  )}

                  {heroTrafficState === 'spike' && (
                    <>
                      <line x1="10" y1="80" x2="50" y2="80" stroke="#d97706" strokeWidth="2.5" className="packet-stream-fast" />
                      <line x1="50" y1="80" x2="150" y2="80" stroke="#d97706" strokeWidth="2.5" className="packet-stream-fast" />
                      <line x1="150" y1="80" x2="250" y2="80" stroke="#d97706" strokeWidth="2.5" className="packet-stream-fast" />
                      <line x1="250" y1="80" x2="350" y2="80" stroke="#d97706" strokeWidth="2.5" className="packet-stream-fast" />
                      <line x1="350" y1="80" x2="450" y2="80" stroke="#d97706" strokeWidth="2.5" className="packet-stream-fast" />
                    </>
                  )}

                  {heroTrafficState === 'ddos' && (
                    <>
                      {/* Heavy Spam coming in from public client */}
                      <line x1="10" y1="80" x2="50" y2="80" stroke="#e11d48" strokeWidth="3" className="packet-stream-ddos" />
                      <line x1="50" y1="80" x2="150" y2="80" stroke="#e11d48" strokeWidth="3" className="packet-stream-ddos" />
                      
                      {/* Clean Filtered stream passing to ALB and backend */}
                      <line x1="150" y1="80" x2="250" y2="80" stroke="#0d9488" strokeWidth="1.5" className="packet-stream" />
                      <line x1="250" y1="80" x2="350" y2="80" stroke="#0d9488" strokeWidth="1.5" className="packet-stream" />
                      <line x1="350" y1="80" x2="450" y2="80" stroke="#0d9488" strokeWidth="1.5" className="packet-stream" />
                    </>
                  )}

                  {/* static link background lines */}
                  <line x1="10" y1="80" x2="50" y2="80" stroke="#cbd5e1" strokeWidth="1.5" />
                  <line x1="50" y1="80" x2="150" y2="80" stroke="#cbd5e1" strokeWidth="1.5" />
                  <line x1="150" y1="80" x2="250" y2="80" stroke="#cbd5e1" strokeWidth="1.5" />
                  <line x1="250" y1="80" x2="350" y2="80" stroke="#cbd5e1" strokeWidth="1.5" />
                  <line x1="350" y1="80" x2="450" y2="80" stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* 1. CDN Edge Node: Globe with distribution rings */}
                  <g 
                    className="iso-node cursor-pointer"
                    onMouseEnter={() => setHoveredNode('cdn')}
                    onMouseLeave={() => setHoveredNode(null)}
                    transform={hoveredNode === 'cdn' ? 'translate(0, -6)' : 'translate(0, 0)'}
                    filter="url(#float-shadow-light)"
                  >
                    {/* Glowing halo */}
                    {hoveredNode === 'cdn' && (
                      <circle cx="50" cy="80" r="22" fill="none" stroke="#c084fc" strokeWidth="1.5" className="animate-pulse" />
                    )}
                    <circle cx="50" cy="80" r="14" fill="url(#grad-cdn)" opacity="0.9" />
                    <ellipse cx="50" cy="80" rx="20" ry="7" fill="none" stroke="#e9d5ff" strokeWidth="1.3" transform="rotate(-15 50 80)" />
                    <ellipse cx="50" cy="80" rx="20" ry="7" fill="none" stroke="#e9d5ff" strokeWidth="1.3" transform="rotate(45 50 80)" />
                    <circle cx="32" cy="75" r="2" fill="#f3e8ff" />
                    <circle cx="68" cy="85" r="2" fill="#f3e8ff" />
                    <text x="50" y="120" fill={hoveredNode === 'cdn' ? '#8b5cf6' : '#64748b'} fontSize="8" fontWeight="bold" textAnchor="middle">CloudFront CDN</text>
                  </g>

                  {/* 2. WAF Firewall Node: High Accuracy Brick Shield */}
                  <g 
                    className="iso-node cursor-pointer"
                    onMouseEnter={() => setHoveredNode('waf')}
                    onMouseLeave={() => setHoveredNode(null)}
                    transform={hoveredNode === 'waf' ? 'translate(0, -6)' : 'translate(0, 0)'}
                    filter="url(#float-shadow-light)"
                  >
                    {/* Glowing halo */}
                    {hoveredNode === 'waf' && (
                      <circle cx="150" cy="80" r="22" fill="none" stroke="#fda4af" strokeWidth="1.5" className="animate-pulse" />
                    )}
                    <path d="M 136 68 L 164 68 Q 164 88, 150 96 Q 136 88, 136 68 Z" fill="url(#grad-waf)" opacity="0.95" />
                    {/* Detailed Brick lines inside shield */}
                    <line x1="139" y1="74" x2="161" y2="74" stroke="#ffe4e6" strokeWidth="1.2" opacity="0.8" />
                    <line x1="137" y1="81" x2="163" y2="81" stroke="#ffe4e6" strokeWidth="1.2" opacity="0.8" />
                    <line x1="141" y1="88" x2="159" y2="88" stroke="#ffe4e6" strokeWidth="1.2" opacity="0.8" />
                    {/* Vertical interlocking joints */}
                    <line x1="147" y1="68" x2="147" y2="74" stroke="#ffe4e6" strokeWidth="0.8" opacity="0.8" />
                    <line x1="155" y1="68" x2="155" y2="74" stroke="#ffe4e6" strokeWidth="0.8" opacity="0.8" />
                    <line x1="142" y1="74" x2="142" y2="81" stroke="#ffe4e6" strokeWidth="0.8" opacity="0.8" />
                    <line x1="150" y1="74" x2="150" y2="81" stroke="#ffe4e6" strokeWidth="0.8" opacity="0.8" />
                    <line x1="158" y1="74" x2="158" y2="81" stroke="#ffe4e6" strokeWidth="0.8" opacity="0.8" />
                    
                    <text 
                      x="150" 
                      y="120" 
                      fill={heroTrafficState === 'ddos' ? '#e11d48' : hoveredNode === 'waf' ? '#f43f5e' : '#64748b'} 
                      fontSize="8" 
                      fontWeight="bold" 
                      textAnchor="middle"
                    >
                      {heroTrafficState === 'ddos' ? '🔒 AWS WAF (ACTIVE)' : 'AWS WAF'}
                    </text>
                  </g>

                  {/* 3. ALB Router Node: Branching arrows core hub */}
                  <g 
                    className="iso-node cursor-pointer"
                    onMouseEnter={() => setHoveredNode('alb')}
                    onMouseLeave={() => setHoveredNode(null)}
                    transform={hoveredNode === 'alb' ? 'translate(0, -6)' : 'translate(0, 0)'}
                    filter="url(#float-shadow-light)"
                  >
                    {/* Glowing halo */}
                    {hoveredNode === 'alb' && (
                      <circle cx="250" cy="80" r="22" fill="none" stroke="#fed7aa" strokeWidth="1.5" className="animate-pulse" />
                    )}
                    <circle cx="250" cy="80" r="14" fill="url(#grad-alb)" opacity="0.9" />
                    <circle cx="250" cy="80" r="7" fill="#ffedd5" />
                    {/* Branching distribution lines representing loadbalancer */}
                    <path d="M 248 76 Q 254 70, 258 70" fill="none" stroke="#f97316" strokeWidth="1.2" />
                    <path d="M 248 80 L 259 80" fill="none" stroke="#f97316" strokeWidth="1.2" />
                    <path d="M 248 84 Q 254 90, 258 90" fill="none" stroke="#f97316" strokeWidth="1.2" />
                    
                    <text x="250" y="120" fill={hoveredNode === 'alb' ? '#c2410c' : '#64748b'} fontSize="8" fontWeight="bold" textAnchor="middle">Elastic ALB</text>
                  </g>

                  {/* 4. ECS Compute Node: Detailed Dual Server Rack Blades with Ticking CPU lights */}
                  <g 
                    className="iso-node cursor-pointer"
                    onMouseEnter={() => setHoveredNode('ecs')}
                    onMouseLeave={() => setHoveredNode(null)}
                    transform={hoveredNode === 'ecs' ? 'translate(0, -6)' : 'translate(0, 0)'}
                    filter="url(#float-shadow-light)"
                  >
                    {/* Glowing halo */}
                    {hoveredNode === 'ecs' && (
                      <circle cx="350" cy="80" r="24" fill="none" stroke="#93c5fd" strokeWidth="1.5" className="animate-pulse" />
                    )}
                    
                    {/* Task Blade 1 */}
                    <rect x="330" y="66" width="16" height="28" rx="3" fill="url(#grad-ecs)" stroke="#cbd5e1" strokeWidth="0.8" />
                    <line x1="334" y1="72" x2="342" y2="72" stroke="#fff" strokeWidth="1.2" opacity="0.9" />
                    <line x1="334" y1="78" x2="342" y2="78" stroke="#fff" strokeWidth="1.2" opacity="0.9" />
                    <circle cx="334" cy="86" r="1.5" fill="#4ade80" className="animate-pulse" />
                    <circle cx="342" cy="86" r="1" fill="#60a5fa" />

                    {/* Task Blade 2 */}
                    <rect x="354" y="66" width="16" height="28" rx="3" fill="url(#grad-ecs)" stroke="#cbd5e1" strokeWidth="0.8" />
                    <line x1="358" y1="72" x2="366" y2="72" stroke="#fff" strokeWidth="1.2" opacity="0.9" />
                    <line x1="358" y1="78" x2="366" y2="78" stroke="#fff" strokeWidth="1.2" opacity="0.9" />
                    <circle cx="358" cy="86" r="1.5" fill="#4ade80" />
                    <circle cx="366" cy="86" r="1" fill="#60a5fa" className="animate-pulse" />

                    {/* Task Blade 3 (Auto-Spawned in Spike load active) */}
                    {heroTrafficState === 'spike' && (
                      <g className="animate-bounce">
                        <rect x="342" y="74" width="16" height="28" rx="3" fill="#1d4ed8" stroke="#3b82f6" strokeWidth="1" />
                        <line x1="346" y1="80" x2="354" y2="80" stroke="#fff" strokeWidth="1.2" />
                        <line x1="346" y1="86" x2="354" y2="86" stroke="#fff" strokeWidth="1.2" />
                        <circle cx="346" cy="94" r="1.5" fill="#34d399" className="animate-ping" />
                      </g>
                    )}

                    <text x="350" y="120" fill={hoveredNode === 'ecs' ? '#1d4ed8' : '#64748b'} fontSize="8" fontWeight="bold" textAnchor="middle">
                      {heroTrafficState === 'spike' ? 'ECS Fargate (x3 Tasks)' : 'ECS Fargate (x2 Tasks)'}
                    </text>
                  </g>

                  {/* 5. Aurora DB Node: Multi-AZ Replica Tower Cluster */}
                  <g 
                    className="iso-node cursor-pointer"
                    onMouseEnter={() => setHoveredNode('db')}
                    onMouseLeave={() => setHoveredNode(null)}
                    transform={hoveredNode === 'db' ? 'translate(0, -6)' : 'translate(0, 0)'}
                    filter="url(#float-shadow-light)"
                  >
                    {/* Glowing halo */}
                    {hoveredNode === 'db' && (
                      <circle cx="450" cy="80" r="22" fill="none" stroke="#a7f3d0" strokeWidth="1.5" className="animate-pulse" />
                    )}

                    {/* Replica DB Cylinder (back smaller AZ-B) */}
                    <path d="M 458 66 Q 468 69, 478 66 L 478 80 Q 468 83, 458 80 Z" fill="#047857" opacity="0.75" stroke="#a7f3d0" strokeWidth="0.8" />
                    <ellipse cx="468" cy="66" rx="10" ry="3" fill="#34d399" stroke="#a7f3d0" strokeWidth="0.8" />

                    {/* Primary DB Cylinder (front active AZ-A) */}
                    <path d="M 436 78 Q 450 82, 464 78 L 464 96 Q 450 100, 436 96 Z" fill="url(#grad-db)" opacity="0.95" />
                    <ellipse cx="450" cy="78" rx="14" ry="4" fill="#6ee7b7" stroke="#cbd5e1" strokeWidth="0.8" />
                    <path d="M 436 84 Q 450 88, 464 84" fill="none" stroke="#cbd5e1" strokeWidth="0.6" opacity="0.7" />
                    <path d="M 436 90 Q 450 94, 464 90" fill="none" stroke="#cbd5e1" strokeWidth="0.6" opacity="0.7" />

                    {/* Sync Arrow from primary to replica */}
                    <path d="M 454 86 Q 468 86, 466 76" fill="none" stroke="#34d399" strokeWidth="1.2" strokeDasharray="2,2" className="animate-pulse" />
                    
                    <text x="450" y="120" fill={hoveredNode === 'db' ? '#047857' : '#64748b'} fontSize="8" fontWeight="bold" textAnchor="middle">Aurora Multi-AZ</text>
                  </g>
                  
                </svg>

              </div>

              {/* Dynamic Interactive Telemetry Panel HUD (Below SVG - Light Theme details) */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col gap-2 min-h-[92px] transition-all duration-300 shadow-inner text-slate-700">
                {hoveredNode && nodeDetails[hoveredNode] ? (
                  <div className="flex flex-col gap-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between border-b border-slate-200/80 pb-1.5">
                      <span className="text-xs font-black text-emerald-700 tracking-tight flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-emerald-600" />
                        {nodeDetails[hoveredNode].title}
                      </span>
                      <span className="text-[8.5px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                        {nodeDetails[hoveredNode].status}
                      </span>
                    </div>
                    <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium">
                      {nodeDetails[hoveredNode].desc}
                    </p>
                    <div className="flex gap-4 mt-0.5 text-[10px] font-mono text-emerald-700 font-bold">
                      <span>● {nodeDetails[hoveredNode].metric1}</span>
                      <span>● {nodeDetails[hoveredNode].metric2}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2.5 h-full py-3 text-slate-500 select-none">
                    <Terminal className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                    <span className="text-xs font-bold leading-relaxed tracking-wide text-center">
                      💡 Pro-Tip: Hover over any detailed AWS service icon in the network above to inspect its real-time console parameters!
                    </span>
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Scenario Advisor Panel */}
      <section id="scenario-advisor" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Cloud Architect Advisor
          </span>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
            How Do I Design For Scale?
          </h2>
          <p className="text-xs text-slate-500 max-w-xl">
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
                cardBgBorderClass = 'bg-slate-900 border-slate-900 text-white shadow-lg';
              } else if (isNoneSelected) {
                // Pulse invitation highlight class
                cardBgBorderClass = 'bg-white border-emerald-300 hover:bg-slate-50 hover:border-emerald-500 text-slate-800 shadow-[0_4px_12px_rgba(16,185,129,0.04)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.12)] hover:-translate-y-0.5';
              } else {
                cardBgBorderClass = 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 text-slate-800';
              }

              return (
                <button
                  key={scenario.id}
                  onClick={() => {
                    const nextId = isSelected ? null : scenario.id;
                    setSelectedScenarioId(nextId);
                    setSimSpikeActive(false);
                    setSimFailoverActive(false);
                    setSimSecAttackActive(false);
                  }}
                  className={`text-left p-4 rounded-2xl border transition-all duration-300 flex items-start gap-3.5 w-full group ${cardBgBorderClass}`}
                >
                  <div className={`p-2.5 rounded-xl text-lg transition-all duration-300 ${
                    isSelected 
                      ? 'bg-emerald-950/80 text-emerald-400' 
                      : isNoneSelected 
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                        : 'bg-white border border-slate-200 text-slate-700'
                  }`}>
                    {scenario.icon}
                  </div>
                  <div className="flex-grow flex flex-col gap-1 pr-1">
                    <span className="text-xs font-bold tracking-tight leading-snug">
                      {scenario.title}
                    </span>
                    
                    {isNoneSelected ? (
                      <span className="text-[9.5px] bg-emerald-50/80 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-md border border-emerald-300/30 animate-pulse flex items-center gap-1.5 w-fit mt-1 shadow-sm">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                        </span>
                        Analyze Blueprint
                      </span>
                    ) : (
                      <span className={`text-[10px] leading-normal font-medium flex items-center gap-1 ${
                        isSelected ? 'text-slate-400' : 'text-slate-500'
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
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 flex flex-col gap-5 animate-fadeIn">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
                  <span className="text-2xl">{activeScenario.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">AWS Recommended Architecture</span>
                    <span className="text-xs font-black text-slate-800 tracking-tight leading-normal">
                      {activeScenario.title}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest font-mono">The Engineering Challenge</span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {activeScenario.problem}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10.5px] font-bold text-emerald-600 uppercase tracking-widest font-mono">Recommended Blueprint Solution</span>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">
                    {activeScenario.solution}
                  </p>
                </div>

                {/* Dynamic SVG Architectural Flow Diagram */}
                <div className="flex flex-col gap-3 pt-2 border-t border-slate-200/80">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest font-mono">Interactive Flow Blueprint</span>
                  
                  {/* Interactive Toggle Widgets Bar */}
                  {renderSimulationWidgets(activeScenario.id)}

                  <div className="bg-white border border-slate-200 rounded-2xl p-4 overflow-x-auto shadow-inner flex items-center justify-center">
                    {renderScenarioDiagram(activeScenario.id)}
                  </div>
                </div>

                <div className="flex flex-col gap-2.5 pt-2 border-t border-slate-200/80">
                  <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest font-mono">Launch Interactive Sandboxes</span>
                  <div className="flex flex-col gap-2">
                    {activeScenario.links.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className="px-4 py-2.5 bg-white border border-slate-200 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-between transition-all group"
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
              <div className="bg-white border border-slate-200 shadow-md rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-6 min-h-[460px] relative overflow-hidden">
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
                    <circle cx="120" cy="120" r="95" fill="none" stroke="#f1f5f9" strokeWidth="2.5" />
                    <circle cx="120" cy="120" r="70" fill="none" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="6,4" />
                    <circle cx="120" cy="120" r="45" fill="none" stroke="#cbd5e1" strokeWidth="1" opacity="0.6" />

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
                    <line x1="120" y1="104" x2="120" y2="70" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="120" y1="136" x2="120" y2="170" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2,2" />
                  </svg>
                </div>

                <div className="flex flex-col gap-2.5 max-w-sm relative z-10">
                  <span className="px-3 py-1 rounded-full text-[9px] font-mono font-bold tracking-widest bg-emerald-50 border border-emerald-200 text-emerald-700 uppercase animate-pulse w-fit mx-auto shadow-sm">
                    ⚡ advisor engine: ready
                  </span>
                  <h3 className="text-base font-extrabold text-slate-800">
                    No Bottleneck Profile Selected
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Select one of the architectural challenges on the left. The advisor engine will construct the corresponding solution blueprint, live simulations, and interactive conduits.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Search & Interactive Visualizers Grid Section */}
      <section id="visualizers-explorer" className="flex flex-col gap-6 scroll-mt-24">
        
        {/* Search & Category Filter Header */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2.5">
            <div className="bg-slate-900 text-white p-2 rounded-xl">
              <Layers className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">AWS Modules Registry</h2>
              <p className="text-xs text-slate-500">Filter modules dynamically by service type or keywords</p>
            </div>
          </div>

          {/* Search bar input container */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by S3, ALB, failover, versions..."
              className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-800 transition-colors placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded border border-slate-200"
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
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              activeCategory === 'all'
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-600'
            }`}
          >
            <span>All Modules</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
              activeCategory === 'all' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>{getCategoryCount('all')}</span>
          </button>

          <button
            onClick={() => setActiveCategory('compute')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              activeCategory === 'compute'
                ? 'bg-cyan-500 border-cyan-500 text-white'
                : 'bg-white border-slate-200 hover:bg-cyan-50 hover:border-cyan-200 text-slate-600'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 shrink-0" />
            <span>Compute &amp; Containers</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
              activeCategory === 'compute' ? 'bg-cyan-600 text-cyan-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>{getCategoryCount('compute')}</span>
          </button>

          <button
            onClick={() => setActiveCategory('networking')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              activeCategory === 'networking'
                ? 'bg-violet-500 border-violet-500 text-white'
                : 'bg-white border-slate-200 hover:bg-violet-50 hover:border-violet-200 text-slate-600'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span>Networking &amp; CDN</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
              activeCategory === 'networking' ? 'bg-violet-600 text-violet-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>{getCategoryCount('networking')}</span>
          </button>

          <button
            onClick={() => setActiveCategory('databases')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              activeCategory === 'databases'
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'bg-white border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 text-slate-600'
            }`}
          >
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span>Databases &amp; Cache</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
              activeCategory === 'databases' ? 'bg-emerald-600 text-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>{getCategoryCount('databases')}</span>
          </button>

          <button
            onClick={() => setActiveCategory('storage')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              activeCategory === 'storage'
                ? 'bg-amber-500 border-amber-500 text-white'
                : 'bg-white border-slate-200 hover:bg-amber-50 hover:border-amber-200 text-slate-600'
            }`}
          >
            <Folder className="w-3.5 h-3.5 shrink-0" />
            <span>Storage &amp; Filesystems</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
              activeCategory === 'storage' ? 'bg-amber-600 text-amber-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>{getCategoryCount('storage')}</span>
          </button>

          <button
            onClick={() => setActiveCategory('integration')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              activeCategory === 'integration'
                ? 'bg-indigo-500 border-indigo-500 text-white'
                : 'bg-white border-slate-200 hover:bg-indigo-50 hover:border-indigo-200 text-slate-600'
            }`}
          >
            <Inbox className="w-3.5 h-3.5 shrink-0" />
            <span>Messaging &amp; Analytics</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
              activeCategory === 'integration' ? 'bg-indigo-600 text-indigo-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>{getCategoryCount('integration')}</span>
          </button>
        </div>

        {/* Dynamic Display Grid */}
        {filteredVisualizers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVisualizers.map((viz) => {
              // Custom Category Styles
              let accentClass = 'hover:border-slate-400 hover:shadow-slate-100';
              let badgeBg = 'bg-slate-100 text-slate-700';

              if (viz.category === 'compute') {
                accentClass = 'hover:border-cyan-400 hover:shadow-cyan-50/50';
                badgeBg = 'bg-cyan-50 text-cyan-700 border border-cyan-200';
              } else if (viz.category === 'networking') {
                accentClass = 'hover:border-violet-400 hover:shadow-violet-50/50';
                badgeBg = 'bg-violet-50 text-violet-700 border border-violet-200';
              } else if (viz.category === 'databases') {
                accentClass = 'hover:border-emerald-400 hover:shadow-emerald-50/50';
                badgeBg = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
              } else if (viz.category === 'storage') {
                accentClass = 'hover:border-amber-400 hover:shadow-amber-50/50';
                badgeBg = 'bg-amber-50 text-amber-700 border border-amber-200';
              } else if (viz.category === 'integration') {
                accentClass = 'hover:border-indigo-400 hover:shadow-indigo-50/50';
                badgeBg = 'bg-indigo-50 text-indigo-700 border border-indigo-200';
              }

              return (
                <Link
                  key={viz.id}
                  to={viz.path}
                  className={`relative flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-5 transition-all duration-300 shadow-sm hover:-translate-y-0.5 hover:shadow-md cursor-pointer ${accentClass} ${
                    viz.comingSoon ? 'opacity-60 cursor-not-allowed hover:translate-y-0 hover:shadow-sm' : ''
                  }`}
                  onClick={(e) => viz.comingSoon && e.preventDefault()}
                >
                  <div className="flex flex-col gap-4">
                    {/* Header Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-3xl bg-slate-50 border border-slate-100 rounded-xl p-2.5 shrink-0">
                        {viz.icon}
                      </div>

                      {/* Status Badges */}
                      {viz.comingSoon ? (
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 px-2 py-0.5 bg-slate-100 rounded border border-slate-200 shrink-0">
                          ● Roadmap
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded border border-emerald-200 shrink-0 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          Online
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-sm font-bold text-slate-800 tracking-tight">
                        {viz.title}
                      </h3>
                      <p className="text-[11.5px] text-slate-500 leading-relaxed font-medium">
                        {viz.description}
                      </p>
                    </div>
                  </div>

                  {/* Tag List & Links (Bottom) */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {/* Domain Badge */}
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded ${badgeBg}`}>
                        {viz.category}
                      </span>
                      {viz.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-[9px] font-bold bg-slate-50 text-slate-500 rounded border border-slate-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {!viz.comingSoon && (
                      <div className="text-[10px] font-bold text-slate-400 group-hover:text-slate-600 flex items-center gap-1">
                        Open Architect sandbox <ChevronRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-3 bg-slate-50/50">
            <div className="bg-slate-100 p-3 rounded-full text-slate-400 border border-slate-200">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-700">No Modules Match Your Search</h3>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              We couldn't find any visualizer matching <span className="font-semibold text-slate-700">"{searchTerm}"</span> under the selected category. Try resetting filters.
            </p>
            <button 
              onClick={() => { setSearchTerm(''); setActiveCategory('all'); }} 
              className="mt-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 border border-emerald-200 bg-white hover:bg-emerald-50 px-3 py-1.5 rounded-xl transition-colors"
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
  );
}
