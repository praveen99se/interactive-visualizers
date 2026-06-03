export interface NodeDetail {
  title: string;
  category: string;
  status: string;
  desc: string;
  metrics: string[];
  cli: string;
  bestPractices: string[];
}

export const nodeDetails: Record<string, NodeDetail> = {
  dns: {
    title: 'Amazon Route 53 DNS',
    category: 'Global Traffic Routing',
    status: 'Active / Healthy',
    desc: 'Amazon Route 53 is a highly available and scalable Domain Name System (DNS) web service. It translates human-readable domain names into IP addresses and routes end-user requests to AWS infrastructure.',
    metrics: ['Health Check: Passing', 'Policy: Active-Passive DR Failover', 'Latency: 12ms'],
    cli: 'aws route53 list-resource-record-sets --hosted-zone-id Z1PA6795UKMFR9',
    bestPractices: [
      'Enable Route 53 health checks on load balancer endpoints to automate routing failover.',
      'Use geoproximity or latency-based routing to serve global requests from the nearest AWS region.'
    ]
  },
  cdn: {
    title: 'Amazon CloudFront CDN',
    category: 'Edge Cache Distribution',
    status: 'Active / Edge Layer',
    desc: 'Amazon CloudFront is a fast content delivery network (CDN) service that securely delivers data, videos, applications, and APIs to customers globally with low latency and high transfer speeds.',
    metrics: ['Edge Locations: 450+', 'Cache Hit Rate: 94.8%', 'Average Edge Latency: 5ms'],
    cli: 'aws cloudfront create-invalidation --distribution-id E2A1B2C3D4E5F6 --paths "/*"',
    bestPractices: [
      'Implement Origin Access Control (OAC) to secure S3 storage buckets, allowing read access only via CloudFront.',
      'Cache static assets at the edge with long TTLs to reduce API gateway bandwidth charges.'
    ]
  },
  waf: {
    title: 'AWS WAF & Shield',
    category: 'Edge Security & Threat Mitigation',
    status: 'Monitoring Mode',
    desc: 'AWS WAF is a web application firewall that helps protect your web applications or APIs against web exploits. AWS Shield provides automatic, always-on DDoS mitigation.',
    metrics: ['Rule Count: 8 Active Rules', 'Volumetric DDoS: Protected', 'Evaluation: < 0.2ms'],
    cli: 'aws wafv2 get-web-acl --name ProductionACL --scope REGIONAL --id 1234a56b-78cd-90ef-1234-5678abcdef',
    bestPractices: [
      'Configure IP rate-limiting rules in WAF to prevent brute force attacks and malicious scrapers.',
      'Activate AWS Shield Advanced to defend against large-scale volumetric Layer 3/4 network floods.'
    ]
  },
  alb: {
    title: 'Application Load Balancer (ALB)',
    category: 'Layer 7 High Availability Routing',
    status: 'Active / Healthy',
    desc: 'Elastic Load Balancing automatically distributes incoming application traffic across multiple targets, such as Amazon EC2 instances, containers, IP addresses, and Lambda functions.',
    metrics: ['Connection Count: 1,420 sessions', 'Sticky Session: Enabled (Cookie-based)', 'Flow Type: Layer 7 HTTP/HTTPS'],
    cli: 'aws elbv2 describe-load-balancers --load-balancer-arns arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/Prod-ALB/123456',
    bestPractices: [
      'Configure redundant listener rules to automatically redirect HTTP traffic to HTTPS.',
      'Integrate with Auto Scaling groups to balance container workload traffic horizontally.'
    ]
  },
  ecs: {
    title: 'Amazon ECS (Fargate Compute)',
    category: 'Serverless Container Orchestration',
    status: 'Active / Auto-Scaling',
    desc: 'Amazon Elastic Container Service (ECS) is a highly scalable, container orchestration service that supports Docker containers and allows you to easily run applications on a managed cluster.',
    metrics: ['Cluster Type: Serverless Fargate', 'Task Blades: 2 Running', 'Avg Thread Count: 48'],
    cli: 'aws ecs update-service --cluster ProductionCluster --service WebService --force-new-deployment',
    bestPractices: [
      'Utilize ECS capacity providers backed by Fargate Spot to cut development and non-production compute costs.',
      'Implement strict Security Groups restricting task ingress to ALB traffic only.'
    ]
  },
  cache: {
    title: 'Amazon ElastiCache Redis',
    category: 'In-Memory Cache Interceptor',
    status: 'Active / High Hit Rate',
    desc: 'Amazon ElastiCache is a fully managed in-memory data store and cache service. It improves the performance of web applications by retrieving information from fast, managed in-memory data stores.',
    metrics: ['Cache Type: Redis Cluster', 'Hit Rate: 88.5%', 'Command Latency: < 1ms'],
    cli: 'aws elasticache describe-cache-clusters --cache-cluster-id prod-redis-cluster',
    bestPractices: [
      'Implement a cache-aside or write-through database strategy to optimize relational read loads.',
      'Deploy replica nodes across Multiple Availability Zones to prevent cache data loss during server failures.'
    ]
  },
  db: {
    title: 'Amazon Aurora Multi-AZ DB',
    category: 'Cloud-Native Relational Database',
    status: 'Active / Replication OK',
    desc: 'Amazon Aurora is a MySQL and PostgreSQL-compatible relational database built for the cloud. It combines the performance and availability of traditional databases with the simplicity of open-source databases.',
    metrics: ['Database Type: PostgreSQL-compatible', 'Replication Lag: 1.2ms', 'Autoscaling Capacity: v2 ACUs active'],
    cli: 'aws rds failover-db-cluster --db-cluster-identifier prod-aurora-cluster',
    bestPractices: [
      'Offload heavy analytical select queries to read replicas, leaving the primary writer node dedicated to transaction writes.',
      'Enable Aurora Serverless v2 to automatically scale ACUs up and down based on immediate query spikes.'
    ]
  },
  s3: {
    title: 'Amazon S3 Object Storage',
    category: 'Secure Cloud-Scale Object Store',
    status: 'Active / Encrypted',
    desc: 'Amazon Simple Storage Service (Amazon S3) is an object storage service offering industry-leading scalability, data availability, security, and performance.',
    metrics: ['Storage Class: S3 Standard', 'Encryption: SSE-KMS Enabled', 'Replication: Cross-Region Active'],
    cli: 'aws s3api put-bucket-encryption --bucket prod-media-assets --server-side-encryption-configuration ...',
    bestPractices: [
      'Enable S3 Bucket Versioning and Object Lock to prevent accidental deletions and ransomware overrides.',
      'Configure S3 Lifecycle rules to automatically transition older, unused files to cheaper Glacier vaults.'
    ]
  }
};

export interface QaItem {
  id: string;
  q: string;
  a: string;
  diagram: string;
  sandboxLink: string;
  sandboxName: string;
}

export const qaData: Record<'compute' | 'networking' | 'database' | 'security' | 'storage' | 'integration', QaItem[]> = {
  compute: [
    {
      id: 'comp-1',
      q: 'How do you mitigate "Cold Starts" in AWS Lambda for latency-critical APIs?',
      a: 'Lambda cold starts happen when an execution environment is initialized from scratch. To mitigate this: (1) Use **Lambda SnapStart** for Java runtimes, which restores a snapshot of the execution state instead of boot loading. (2) Configure **Provisioned Concurrency** to pre-warm containers for high-traffic spikes. (3) Reduce package size, avoid heavy framework imports, and keep VPC configurations optimized to reduce initial elastic network interface (ENI) attachments.',
      diagram: `User Request ──► [ Route 53 ] ──► [ CloudFront ] ──► [ Lambda Warm Environment ] (Latency: ~5ms)
                                                └─► [ Init cold container ] (Latency: ~1500ms)`,
      sandboxLink: '/visualizers/serverless',
      sandboxName: 'Launch Serverless & Lambda Sandbox'
    },
    {
      id: 'comp-2',
      q: 'What is the architectural difference between EC2 Placement Groups?',
      a: 'EC2 Placement Groups determine how instances are physically distributed in the underlying hardware. **Cluster Placement Groups** pack instances close together in a single availability zone, providing low-latency 10Gbps networking for HPC. **Spread Placement Groups** place instances on separate physical racks to guarantee hardware isolation. **Partition Placement Groups** isolate instances in separate racks (partitions) within an AZ to support large distributed workloads like Hadoop/Cassandra.',
      diagram: `[ RACK 1 ] Instance A  │  [ RACK 2 ] Instance B  │  [ RACK 3 ] Instance C  ◄── Spread Group (Isolated Host Hardware)`,
      sandboxLink: '/visualizers/ec2',
      sandboxName: 'Launch EC2 compute Sandbox'
    },
    {
      id: 'comp-3',
      q: 'When should I choose ECS Fargate over ECS backed by EC2 launch type?',
      a: 'Choose **ECS Fargate** when you want a serverless compute engine where AWS manages the underlying EC2 instances. It eliminates operating system patching, cluster host scaling, and server configurations. Choose **ECS EC2** when you require deep control over host hardware, need custom disk mount configurations (like Amazon FSx), or run high-performance workloads that can benefit from sharing host daemon resource allocations.',
      diagram: `[ ECS Control Plane ]
       ├──► [ AWS Fargate ] (Serverless: AWS manages OS, patching, scaling VMs)
       └──► [ EC2 Clusters ] (Host Managed: User patches OS, manages storage mounts)`,
      sandboxLink: '/visualizers/elastic-containers',
      sandboxName: 'Launch ECS & Containers Sandbox'
    }
  ],
  networking: [
    {
      id: 'net-1',
      q: 'Why use an NLB instead of an ALB for high-throughput TCP workloads?',
      a: 'The **Application Load Balancer (ALB)** is Layer 7 (HTTP/HTTPS aware), performing cookie stickiness, path-based routing, and payload evaluations. The **Network Load Balancer (NLB)** is Layer 4 (TCP/UDP), built for ultra-high throughput (millions of requests/sec) with sub-millisecond latencies. NLBs expose static IP addresses (or Elastic IPs) per subnet, which is critical for IP whitelisting, whereas ALBs only expose DNS names.',
      diagram: `TCP Packet ──► [ NLB (Layer 4) ] ──► Flow Hash routing ──► Target EC2 (Static IPs, Sub-ms latency)
HTTP Payload ──► [ ALB (Layer 7) ] ──► Path & Header evaluation ──► Target Container`,
      sandboxLink: '/visualizers/alb-nlb',
      sandboxName: 'Launch ALB vs NLB Stickiness Sandbox'
    },
    {
      id: 'net-2',
      q: 'What is the security boundary difference between Security Groups and Network ACLs?',
      a: '**Security Groups** are stateful, applied at the elastic network interface (ENI) level. If you allow inbound traffic on port 80, the return outbound traffic is allowed automatically. **Network ACLs (NACLs)** are stateless, applied at the VPC subnet boundary. You must explicitly configure both inbound allow rules and outbound rules targeting ephemeral ports (1024-65535) for traffic to flow.',
      diagram: `Client Request ──► [ Subnet: NACL Stateless Rule ] ──► [ ENI: Security Group Stateful Rule ] ──► EC2 Instance
               ◄── [ Ephemeral Port Allow Required ] ◄── [ Allowed Automatically (Stateful) ] ◄── Return traffic`,
      sandboxLink: '/visualizers/networking-vpc',
      sandboxName: 'Launch VPC Networking Sandbox'
    },
    {
      id: 'net-3',
      q: 'How does Route 53 Active-Passive failover routing policies operate?',
      a: 'Route 53 active-passive failover routes all traffic to a primary region (like us-east-1). Route 53 continuously probes the primary Application Load Balancer via HTTP health checks. If the primary region goes offline, the health check fails, and Route 53 automatically redirects DNS record resolutions to the passive secondary disaster recovery region (like us-west-2).',
      diagram: `User DNS ──► [ Route 53 ] ─── (Probe: Ok) ───► [ us-east-1 ALB ] (Primary Writer)
                └── [ Route 53 ] ─── (Probe: Fail) ──► [ us-west-2 ALB ] (DR Failover)`,
      sandboxLink: '/visualizers/route53',
      sandboxName: 'Launch Route 53 Routing Sandbox'
    }
  ],
  database: [
    {
      id: 'db-1',
      q: 'How does Amazon Aurora scale ACUs dynamically under sudden traffic spikes?',
      a: 'Amazon Aurora Serverless v2 scales compute capacity dynamically in increments of **Aurora Capacity Units (ACUs)** (1 ACU = ~2GB RAM and associated CPU). Aurora monitors real-time CPU utilization, memory pressure, and connection counts. Compute is scaled instantly without disrupting connections, since storage is detached and shared globally across virtual storage volumes.',
      diagram: `Incoming Spikes ──► [ Aurora DB Node ] ──► Detached Virtual SSD Volume (Instant scale from 2 to 32 ACUs)`,
      sandboxLink: '/visualizers/aurora',
      sandboxName: 'Launch Aurora Serverless Sandbox'
    },
    {
      id: 'db-2',
      q: 'What is the performance difference between RDS Read Replicas and Multi-AZ?',
      a: '**Multi-AZ** deployments are for disaster recovery and high availability; writes are replicated **synchronously** to a standby instance in a different AZ, ensuring zero data loss during failovers. **Read Replicas** are for scaling read workloads; data is replicated **asynchronously** to read-only instances. RDS Read Replicas can be promoted to standalone databases if the master fails.',
      diagram: `Client Write ──► [ Master DB (AZ-A) ] ── (Synchronous replication) ──► [ Standby DB (AZ-B) ] (Failover DR)
                    │
                    └── (Asynchronous replication) ──► [ Read Replicas (AZ-C) ] (Scale Reads)`,
      sandboxLink: '/visualizers/rds',
      sandboxName: 'Launch RDS Multi-AZ Sandbox'
    },
    {
      id: 'db-3',
      q: 'When should I choose write-through versus cache-aside in ElastiCache Redis?',
      a: 'Choose **Cache-Aside** when your database reads are frequent but database writes are sparse; data is cached only when a read miss occurs. It keeps the cache small but can result in stale data. Choose **Write-Through** when you write data frequently and require cache-data consistency; data is written to the cache and database simultaneously, ensuring the cache is always fresh.',
      diagram: `Cache-Aside:  Read Miss ──► [ Cache Check ] ── (Miss) ──► [ Read DB ] ──► [ Write Cache ]
Write-Through: Write Data ──► [ Write Cache & DB simultaneously ] ──► Data always consistent`,
      sandboxLink: '/visualizers/elasticache',
      sandboxName: 'Launch ElastiCache Redis Sandbox'
    }
  ],
  security: [
    {
      id: 'sec-1',
      q: 'How does Envelope Encryption secure data objects at scale using AWS KMS?',
      a: 'Envelope Encryption uses a Customer Master Key (CMK) managed by KMS to encrypt a **Data Key (DK)**. The local application server uses the plaintext Data Key to encrypt files client-side. The plaintext Data Key is then destroyed, leaving only the encrypted Data Key stored alongside the encrypted data object. This prevents sending large files to KMS for encryption, saving API throughput.',
      diagram: `KMS ──► Generates Plaintext & Encrypted Data Key (DK) 
App Server ──► Encrypts File using Plaintext DK ──► Stores [ Encrypted File ] + [ Encrypted DK ]`,
      sandboxLink: '/visualizers/secrets-kms',
      sandboxName: 'Launch Secrets & KMS Sandbox'
    },
    {
      id: 'sec-2',
      q: 'How does the IAM Evaluation Engine resolve conflicting policies?',
      a: 'The IAM policy evaluation tree follows a strict flow: (1) By default, all requests are **Denied**. (2) An **Explicit Deny** in any policy (IAM User, Resource-based, SCP) overrides any Allow. (3) If no explicit deny exists, an **Explicit Allow** in user policies or resource policies grants access. (4) If no explicit allow exists, access is implicitly denied.',
      diagram: `Request ──► [ Organization SCP Allow? ] ──► [ Resource Policy Allow? ] ──► [ Explicit Deny Check ] ──► Allow/Deny`,
      sandboxLink: '/visualizers/governance-identity',
      sandboxName: 'Launch Governance & Identity Sandbox'
    },
    {
      id: 'sec-3',
      q: 'How does AWS Shield Advanced mitigate Layer 7 DDoS floods?',
      a: 'AWS Shield Advanced protects edge points (CloudFront, Route 53) against large volumetric attacks. When a threat is detected: (1) Anycast DNS routing absorbs volume. (2) WAF WebACL rules inspect packet signatures. (3) Shield automatically creates rate-limiting rules at the edge to throttle bot scrapers, allowing legitimate traffic to route cleanly to Application Load Balancers.',
      diagram: `Botnet Traffic ──► [ Route 53 Anycast / WAF Rules ] ── (Deflects spam) ──► Null Route / 403 Forbidden
Legit Users    ──► [ CloudFront CDN / ALB Origin ] ── (Clean flow) ───► Backend ECS compute`,
      sandboxLink: '/visualizers/network-security',
      sandboxName: 'Launch DDoS & WAF Sandbox'
    }
  ],
  storage: [
    {
      id: 'stor-1',
      q: 'How do S3 Lifecycle policies transition objects to secure glacier storage?',
      a: 'S3 Lifecycle rules automate file tiering to minimize cost: (1) Static files sit in **S3 Standard**. (2) After 30 days of no access, they transition to **S3 Standard-IA** (Infrequent Access). (3) After 90 days, they move to **Amazon Glacier** (retrieval times: minutes to hours). (4) After 180 days, they can be migrated to **Glacier Deep Archive** (cheapest storage, 12-hour recovery) or auto-deleted.',
      diagram: `S3 Standard ($0.023/GB) ──► Standard-IA ($0.0125/GB) ──► Glacier ($0.0036/GB) ──► Deep Archive ($0.00099/GB)`,
      sandboxLink: '/visualizers/s3',
      sandboxName: 'Launch Amazon S3 Sandbox'
    },
    {
      id: 'stor-2',
      q: 'When should I choose Amazon FSx for Lustre versus FSx for NetApp ONTAP?',
      a: 'Choose **FSx for Lustre** when you require high-performance, parallel file system storage for High-Performance Computing (HPC), machine learning, or video rendering. It integrates natively with S3 datasets. Choose **FSx for NetApp ONTAP** when you migrate enterprise Linux/Windows storage arrays to AWS, requiring native SMB/NFS support, active directories, and deduplication features.',
      diagram: `HPC Batch Nodes ──► [ FSx for Lustre Parallel Mount ] ◄── High-speed concurrent read/write locks
Enterprise VMs   ──► [ FSx for NetApp ONTAP Multi-Protocol ] ◄── SMB / NFS Active Directory sync`,
      sandboxLink: '/visualizers/storage-fs',
      sandboxName: 'Launch shared FSx Sandbox'
    },
    {
      id: 'stor-3',
      q: 'What is the speed difference between Amazon EBS and Amazon EFS?',
      a: '**Amazon EBS (Elastic Block Store)** is block storage for a single EC2 instance, providing sub-millisecond local latencies (like an SSD). **Amazon EFS (Elastic File System)** is shared file storage that can mount concurrently across thousands of instances in a VPC. EBS is faster for local database compute, whereas EFS is optimal for shared container code directories.',
      diagram: `EC2 Instance A ──► [ EBS SSD Block ] (Local mount, single instance, sub-ms IOPS)
EC2 Instance A, B, C ──► [ EFS POSIX mount ] (Shared mount, thousands of instances)`,
      sandboxLink: '/visualizers/ec2',
      sandboxName: 'Launch EC2 Storage Sandbox'
    }
  ],
  integration: [
    {
      id: 'int-1',
      q: 'How does the SNS and SQS Fanout pattern ensure message delivery with zero packet loss?',
      a: 'The Fanout pattern sends a message to an **Amazon SNS Topic**, which duplicates and pushes it to multiple subscribed **Amazon SQS Queues** concurrently. This decouples worker tasks; if one consumer system crashes, its messages sit safely buffered inside its dedicated SQS queue, preventing data loss while other queues process work normally.',
      diagram: `Publisher App ──► [ SNS Topic ] ├──► [ SQS Queue A ] ──► Worker service A
                              └──► [ SQS Queue B ] ──► Worker service B (Safe buffer queue)`,
      sandboxLink: '/visualizers/integration-messaging',
      sandboxName: 'Launch SQS/SNS Messaging Sandbox'
    },
    {
      id: 'int-2',
      q: 'What is the difference between RTO and RPO in Active-Passive Pilot Light disaster recovery?',
      a: '**RPO (Recovery Point Objective)** is the maximum tolerable data loss (e.g. 5 minutes of transactions). **RTO (Recovery Time Objective)** is the downtime duration before the system is back online (e.g., 2 hours). **Pilot Light** DR maintains database replication continuously, but compute nodes are kept offline/scaled down, yielding low RPO and medium RTO.',
      diagram: `Active Region (Primary)  ── (DMS continuous CDC replication) ──► Passive Region (DR Standby)
Compute Nodes (Online)                                               Compute Nodes (OFFLINE / Scaled down)`,
      sandboxLink: '/visualizers/disaster-recovery',
      sandboxName: 'Launch Disaster Recovery Sandbox'
    },
    {
      id: 'int-3',
      q: 'How do Glue Crawlers and Athena query data lakes without server setups?',
      a: 'To analyze raw datasets in S3: (1) Run an **AWS Glue Crawler** to inspect the files, automatically parsing parquet/CSV schemas and populating the **Glue Data Catalog**. (2) Run **Amazon Athena**, a serverless query engine that executes standard ANSI SQL queries directly against S3 objects using the schema catalog, paying only per raw GB scanned.',
      diagram: `Raw files (S3) ──► [ Glue Crawler scans schema ] ──► [ Glue Catalog ] ◄── [ Athena SQL query interface ]`,
      sandboxLink: '/visualizers/databases-analytics',
      sandboxName: 'Launch Analytics Sandbox'
    }
  ]
};
