import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Shield,
  Activity,
  ChevronRight,
  ChevronDown,
  Network,
  Lightbulb,
  Sliders,
  Zap,
  Database,
  HardDrive,
  RefreshCw,
  Layers,
  Cloud
} from 'lucide-react';
import RDSComparativeView from '../../components/visualizers/RDSComparativeView';
import UniqueRDSFeatures from '../../components/visualizers/UniqueRDSFeatures';

type TabType = 'overview' | 'connect' | 'multiaz' | 'replicas' | 'sim' | 'advanced' | 'best' | 'notebook' | 'unique';
type EngineType = 'postgres' | 'mysql' | 'maria' | 'oracle' | 'mssql' | 'aurora';
type FeatureTab = 'backup' | 'clone' | 'security' | 'ml' | 'proxy';

type Metrics = {
  writes: number;
  reads: number;
  readTarget: string;
  writerTps: number;
  replicaEach: number | null;
  failState: string;
  stale: string;
};

// Provider-Specific Engine Data Definition
const getProviderEngineDetails = (prov: string): Record<EngineType, { title: string; desc: string; specs: { k: string; v: string }[]; cases: string[] }> => {
  if (prov === 'azure') {
    return {
      postgres: {
        title: '🐘 Azure Database for PostgreSQL (Flexible Server)',
        desc: 'Fully managed PostgreSQL engine on Azure Linux VMs. Features Zone-Redundant High Availability, auto-growing storage up to 16 TiB, and native pgvector integration for AI workloads.',
        specs: [
          { k: 'Default Port', v: '5432' },
          { k: 'Max Storage', v: '16 TiB (Auto-grow)' },
          { k: 'High Availability', v: 'Zone-Redundant Standby (Same/Cross Zone)' },
          { k: 'Read Replicas', v: 'Up to 5 active Flexible Server replicas' }
        ],
        cases: ['Enterprise PostgreSQL applications', 'Vector embeddings & AI similarity search via pgvector', 'GIS and spatial mapping with PostGIS']
      },
      mysql: {
        title: '🐬 Azure Database for MySQL (Flexible Server)',
        desc: 'Fully managed MySQL database engine providing fine-grained database tuning, burstable and memory-optimized compute tier scaling, and automated backups.',
        specs: [
          { k: 'Default Port', v: '3306' },
          { k: 'Max Storage', v: '16 TiB (Auto-grow)' },
          { k: 'High Availability', v: 'Zone-Redundant Standby' },
          { k: 'Read Replicas', v: 'Up to 10 active read replicas' }
        ],
        cases: ['LAMP stack web services on Azure', 'E-commerce transactional backends', 'High-concurrency web portals']
      },
      maria: {
        title: '🦭 MariaDB on Azure (Legacy / Retired)',
        desc: 'Azure MariaDB Single Server is retired. Microsoft recommends migrating existing MariaDB instances to Azure Database for MySQL Flexible Server.',
        specs: [
          { k: 'Default Port', v: '3306' },
          { k: 'Max Storage', v: '4 TiB (Legacy)' },
          { k: 'Lifecycle Status', v: '⚠️ Retired — Migrate to MySQL Flexible' },
          { k: 'Read Replicas', v: 'Legacy read-replica support' }
        ],
        cases: ['Legacy MariaDB workloads', 'Migration paths toward MySQL Flexible Server']
      },
      oracle: {
        title: '🔶 Oracle Database@Azure',
        desc: 'Oracle Database services running natively on dedicated OCI Exadata infrastructure co-located inside Microsoft Azure datacenters for zero-latency integration.',
        specs: [
          { k: 'Default Port', v: '1521' },
          { k: 'Max Storage', v: '100+ TiB (Exadata Storage Nodes)' },
          { k: 'High Availability', v: 'Oracle Real Application Clusters (RAC)' },
          { k: 'Read Replicas', v: 'Active Data Guard Replicas' }
        ],
        cases: ['Core banking and enterprise ERP systems', 'Mission-critical Oracle workloads on Azure', 'Exadata cloud migration']
      },
      mssql: {
        title: '🪟 Azure SQL Database / Managed Instance',
        desc: 'Microsoft\'s flagship cloud-native SQL Server database engine. Offers serverless auto-scaling, Active Directory / Entra ID authentication, and Hyperscale storage.',
        specs: [
          { k: 'Default Port', v: '1433' },
          { k: 'Max Storage', v: '100 TiB (Hyperscale Tier)' },
          { k: 'High Availability', v: 'AlwaysOn Availability Groups / Zone-Redundant' },
          { k: 'Read Replicas', v: 'Up to 30 Read-Scale Replicas (Hyperscale)' }
        ],
        cases: ['Corporate .NET / C# enterprise applications', 'Active Directory integrated storage', 'Multi-tenant SaaS backends']
      },
      aurora: {
        title: '🌌 Azure SQL Hyperscale (Cloud-Native) ⭐',
        desc: 'Azure\'s tier for massive scaling. Built on a decoupled log-structured storage architecture with auto-scaling compute, rapid database clones, and instant snapshot restores.',
        specs: [
          { k: 'Compatibility', v: 'SQL Server / T-SQL Compliant' },
          { k: 'Max Storage', v: '100 TiB (Auto-scales in 10 GB increments)' },
          { k: 'High Availability', v: 'Multi-zone Page Server replication' },
          { k: 'Read Replicas', v: 'Up to 30 Read-Scale Replicas' }
        ],
        cases: ['Large-scale enterprise databases (> 10 TiB)', 'High-concurrency analytics and transaction processing', 'Instant database copy/cloning pipelines']
      }
    };
  }

  if (prov === 'gcp') {
    return {
      postgres: {
        title: '🐘 Google Cloud SQL for PostgreSQL',
        desc: 'Fully managed PostgreSQL service on Google Cloud infrastructure. Supports automatic storage expansion, point-in-time recovery, and Cloud IAM database authentication.',
        specs: [
          { k: 'Default Port', v: '5432' },
          { k: 'Max Storage', v: '64 TiB (Auto-resize)' },
          { k: 'High Availability', v: 'Regional HA (Primary + Standby in 2 Zones)' },
          { k: 'Read Replicas', v: 'Up to 10 active read replicas' }
        ],
        cases: ['High-throughput web applications', 'Geospatial mapping via PostGIS', 'Microservices backend datastores']
      },
      mysql: {
        title: '🐬 Google Cloud SQL for MySQL',
        desc: 'Google Cloud\'s fully managed relational database for MySQL. Offers automated maintenance, continuous WAL backups, and Cloud SQL Auth Proxy for secure zero-IP access.',
        specs: [
          { k: 'Default Port', v: '3306' },
          { k: 'Max Storage', v: '64 TiB (Auto-resize)' },
          { k: 'High Availability', v: 'Regional HA Standby' },
          { k: 'Read Replicas', v: 'Up to 10 active read replicas' }
        ],
        cases: ['GCP-hosted web applications', 'E-commerce transactional stores', 'Analytics staging databases']
      },
      maria: {
        title: '🦭 MariaDB on Google Cloud (Marketplace / GCE)',
        desc: 'MariaDB deployments running on Google Compute Engine VMs or pre-configured GCP Marketplace images with persistent disk attach.',
        specs: [
          { k: 'Default Port', v: '3306' },
          { k: 'Max Storage', v: '64 TiB (Persistent Disk)' },
          { k: 'High Availability', v: 'Regional Managed Instance Groups (MIG)' },
          { k: 'Read Replicas', v: 'Custom Galera / Async replication' }
        ],
        cases: ['Custom MariaDB engine configurations', 'Self-managed enterprise MariaDB on GCP']
      },
      oracle: {
        title: '🔶 Oracle on Google Bare Metal Solution (BMS)',
        desc: 'Dedicated, unshared bare-metal hardware infrastructure running in GCP datacenters with sub-millisecond interconnect to Google Cloud services.',
        specs: [
          { k: 'Default Port', v: '1521' },
          { k: 'Max Storage', v: 'Multi-TB SAN Storage Arrays' },
          { k: 'High Availability', v: 'Oracle Data Guard / RAC' },
          { k: 'Read Replicas', v: 'Active Data Guard Replicas' }
        ],
        cases: ['Enterprise legacy Oracle migration to GCP', 'High IOPS transaction engines']
      },
      mssql: {
        title: '🪟 Google Cloud SQL for SQL Server',
        desc: 'Fully managed Microsoft SQL Server on Google Cloud. Includes Microsoft license mobility, automated backups, and cross-region replica failover.',
        specs: [
          { k: 'Default Port', v: '1433' },
          { k: 'Max Storage', v: '64 TiB' },
          { k: 'High Availability', v: 'Regional HA (AlwaysOn Availability Groups)' },
          { k: 'Read Replicas', v: 'Up to 10 read replicas' }
        ],
        cases: ['Enterprise .NET applications on GCP', 'Windows Server compute workloads', 'Corporate reporting datastores']
      },
      aurora: {
        title: '🌌 Google AlloyDB for PostgreSQL (Cloud-Native) ⭐',
        desc: 'Google\'s cloud-native, PostgreSQL-compatible database. Features a decoupled log-structured storage engine, 4x faster execution than standard PostgreSQL, and built-in Vertex AI ML integrations.',
        specs: [
          { k: 'Compatibility', v: '100% PostgreSQL Compliant' },
          { k: 'Max Storage', v: 'Auto-scaling storage pool (Elastic)' },
          { k: 'High Availability', v: 'Regional HA with ultra-fast failover (< 1s)' },
          { k: 'Read Replicas', v: 'Up to 20 Read Pool instances' }
        ],
        cases: ['High-concurrency enterprise SaaS applications', 'Real-time hybrid transactional and analytical processing (HTAP)', 'In-database Vertex AI ML scoring']
      }
    };
  }

  return {
    postgres: {
      title: '🐘 PostgreSQL Engine',
      desc: 'An advanced, enterprise-grade open-source relational database. Highly popular for complex queries, JSON-based document storage, and spatial indexing.',
      specs: [
        { k: 'Default Port', v: '5432' },
        { k: 'Max Storage', v: '64 TiB' },
        { k: 'High Availability', v: 'Multi-AZ Standby' },
        { k: 'Read Replicas', v: 'Up to 5 active replicas' }
      ],
      cases: ['Complex analytics and reporting systems', 'JSON document hybrid relational structures', 'GIS and spatial mapping applications']
    },
    mysql: {
      title: '🐬 MySQL Engine',
      desc: 'The world\'s most popular open-source relational database. Renowned for its speed, reliability, simplicity, and massive developer ecosystem.',
      specs: [
        { k: 'Default Port', v: '3306' },
        { k: 'Max Storage', v: '64 TiB' },
        { k: 'High Availability', v: 'Multi-AZ Standby' },
        { k: 'Read Replicas', v: 'Up to 5 active replicas' }
      ],
      cases: ['High-traffic web logs and CMS sites', 'LAMP-stack web applications', 'Standard transactional catalog stores']
    },
    maria: {
      title: '🦭 MariaDB Engine',
      desc: 'A community-developed, commercially supported fork of MySQL. Designed as a drop-in replacement with additional storage engines and security features.',
      specs: [
        { k: 'Default Port', v: '3306' },
        { k: 'Max Storage', v: '64 TiB' },
        { k: 'High Availability', v: 'Multi-AZ Standby' },
        { k: 'Read Replicas', v: 'Up to 5 active replicas' }
      ],
      cases: ['Standard web applications', 'Enterprise MySQL migrations', 'High-concurrency e-commerce backends']
    },
    oracle: {
      title: '🔶 Oracle Database',
      desc: 'A premium, highly secure proprietary relational database engine. Packed with advanced enterprise features, heavy-duty processing, and licensing flexibility.',
      specs: [
        { k: 'Default Port', v: '1521' },
        { k: 'Max Storage', v: '64 TiB' },
        { k: 'High Availability', v: 'Multi-AZ Standby' },
        { k: 'Read Replicas', v: '❌ Not supported on standard RDS' }
      ],
      cases: ['Corporate ERP systems and core banking', 'Legacy migration pipelines', 'Highly demanding enterprise transactional storage']
    },
    mssql: {
      title: '🪟 Microsoft SQL Server',
      desc: 'Microsoft\'s proprietary enterprise relational database. Extensively integrated with Windows ecosystem, active directories, and corporate tooling.',
      specs: [
        { k: 'Default Port', v: '1433' },
        { k: 'Max Storage', v: '64 TiB' },
        { k: 'High Availability', v: 'Multi-AZ Standby (AlwaysOn)' },
        { k: 'Read Replicas', v: '❌ Not supported on standard RDS' }
      ],
      cases: ['Windows-backed web and desktop apps', 'Enterprise .NET backends', 'Active Directory integrated storage environments']
    },
    aurora: {
      title: '🌌 Amazon Aurora (Cloud-Native) ⭐',
      desc: 'AWS\'s premium, cloud-native relational database. Built on a shared, log-structured distributed storage system that heals and auto-scales natively up to 128 TiB.',
      specs: [
        { k: 'Compatibility', v: 'PostgreSQL or MySQL compliant' },
        { k: 'Max Storage', v: '128 TiB (auto-scales)' },
        { k: 'High Availability', v: 'Storage replication 6-ways across 3 AZs' },
        { k: 'Read Replicas', v: 'Up to 15 active replicas with near-zero lag' }
      ],
      cases: ['Enterprise SaaS platforms with extreme write/read workloads', 'Highly auto-scaling microservices', 'Mission-critical database setups with ultra-fast failover']
    }
  };
};

interface RDSVisualizerProps {
  provider?: 'aws' | 'azure' | 'gcp' | 'comparative';
  setProvider?: (provider: 'aws' | 'azure' | 'gcp' | 'comparative') => void;
}

export default function RDSVisualizer({ provider = 'aws', setProvider }: RDSVisualizerProps) {
  const [activeSection, setActiveSection] = useState<TabType>('notebook');

  // Visual Architect Notes & Mental Models State
  const [selectedNote, setSelectedNote] = useState<string>('rds_what_is');
  const [expandedCategory, setExpandedCategory] = useState<string>('rds_fundamentals');

  // Interactive Note Simulator State
  const [nbTpsSimulation, setNbTpsSimulation] = useState<number>(500);
  const [nbReadRatio, setNbReadRatio] = useState<number>(80);
  const [nbReplicaCount, setNbReplicaCount] = useState<number>(3);
  const [selectedEngine, setSelectedEngine] = useState<EngineType>('postgres');

  const isComparative = provider === 'comparative';
  const isAzure = provider === 'azure';
  const isGcp = provider === 'gcp';

  const engineDetails = getProviderEngineDetails(provider);

  const handleNavigateToDemo = (prov: 'aws' | 'azure' | 'gcp', section: any) => {
    if (setProvider) {
      setProvider(prov);
    }
    setActiveSection((section === 'storage' || section === 'backup') ? 'overview' : section);
  };

  // Simulator State
  const [mode, setMode] = useState<'single' | 'multi' | 'multi_rr'>('multi');
  const [readRoute, setReadRoute] = useState<'writer' | 'replicas' | 'smart'>('replicas');
  const [tps, setTps] = useState(120);
  const [lag, setLag] = useState(3);
  const [azFailed, setAzFailed] = useState(false);
  const [logHtml, setLogHtml] = useState('Click "Simulate WRITE/READ" to see which endpoint is used, then toggle zone failure to see failover behavior.');

  // Best practice Tab & Sub-tabs State
  const [bestTab, setBestTab] = useState<'arch' | 'sg' | 'proxy' | 'multiaz' | 'replicas' | 'engines' | 'checklist'>('arch');

  // Advanced Features Sub-tabs State
  const [activeFeatureTab, setActiveFeatureTab] = useState<FeatureTab>('backup');
  const [pitrDays, setPitrDays] = useState<number>(3);
  const [proxyConcurrency, setProxyConcurrency] = useState<number>(200);
  const [activeMlQuery, setActiveMlQuery] = useState<'sentiment' | 'fraud' | 'churn'>('sentiment');

  // Premium Interactive Connectivity Ingress states
  const [ingressSource, setIngressSource] = useState<'internet' | 'app' | 'bastion'>('app');

  // Premium Interactive Multi-AZ failover stepper states
  const [failoverStep, setFailoverStep] = useState<number>(0);
  const [failoverLogs, setFailoverLogs] = useState<string[]>([
    '💡 Click "Trigger Failover State Transition ⏭" to simulate a Cloud Zone disaster recovery failover.'
  ]);

  // Premium Interactive Replica lag slider state
  const [replicaWalLag, setReplicaWalLag] = useState<number>(3);

  // Premium Interactive ML sql sandbox state
  const [mlLogs, setMlLogs] = useState<string[]>([]);
  const [mlOutput, setMlOutput] = useState<any[]>([]);
  const [mlIsLoading, setMlIsLoading] = useState<boolean>(false);

  // Sandbox states for PITR slider & Database Cloning CoW allocations
  const [pitrTargetTime, setPitrTargetTime] = useState<number>(720); // 720 minutes = 12:00 PM
  const [cloneDivergedBlocks, setCloneDivergedBlocks] = useState<number>(0);
  const [cloneLogs, setCloneLogs] = useState<string[]>([
    '💡 Click "Simulate Write on Cloned DB" to trigger copy-on-write storage allocations.'
  ]);

  const logFailover = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setFailoverLogs((prev) => [`${time} — ${msg}`, ...prev].slice(0, 40));
  };

  // Provider-aware Security Checklist Items
  const getProviderSecItems = (prov: string) => {
    if (prov === 'azure') {
      return [
        { label: 'Encryption at rest enabled using Azure Key Vault CMEK Key', done: true },
        { label: 'TLS enforced (require_secure_transport = ON in server parameters)', done: true },
        { label: 'Placed in Delegated VNet Subnet / Private Endpoint (No public route)', done: true },
        { label: 'Public Network Access flag set to DISABLED', done: false },
        { label: 'Network Security Group (NSG) restricts inbound strictly to App NSG', done: true },
        { label: 'Microsoft Entra ID (Azure AD) Database Authentication enabled', done: false },
        { label: 'Azure Key Vault configured with automated credential rotation', done: true },
        { label: 'Azure Resource Locks (CanNotDelete) turned ON', done: false },
        { label: 'Azure Activity Log enabled for all management API calls', done: true },
        { label: 'Azure Monitor and Query Performance Insight enabled', done: false }
      ];
    }
    if (prov === 'gcp') {
      return [
        { label: 'Encryption at rest enabled using Cloud KMS CMEK Key', done: true },
        { label: 'TLS enforced (require_ssl = ON in database flags)', done: true },
        { label: 'Cloud SQL connected via Private IP / Private Service Access (PSA)', done: true },
        { label: 'Public IP interface set to DISABLED', done: false },
        { label: 'VPC Firewall Rules restrict inbound strictly to App Tag', done: true },
        { label: 'Google Cloud IAM Database Authentication enabled', done: false },
        { label: 'GCP Secret Manager configured with automated credential rotation', done: true },
        { label: 'Database Instance Deletion Protection flag turned ON', done: false },
        { label: 'Cloud Audit Logs enabled for all Data Access and Admin Activity', done: true },
        { label: 'Cloud Monitoring and Query Insights enabled', done: false }
      ];
    }
    return [
      { label: 'Encryption at rest (KMS Key)', done: true },
      { label: 'TLS enforced (force_ssl=1 in parameter group)', done: true },
      { label: 'RDS placed in Private Subnets (No route to IGW)', done: true },
      { label: 'Publicly Accessible flag set to FALSE', done: false },
      { label: 'Security Group restricts inbound strictly to App SG', done: true },
      { label: 'IAM Database Authentication enabled', done: false },
      { label: 'Secrets Manager configured with automated credential rotation', done: true },
      { label: 'Database Deletion Protection turned ON', done: false },
      { label: 'AWS CloudTrail logging enabled for all database API calls', done: true },
      { label: 'Enhanced Monitoring and Performance Insights enabled', done: false }
    ];
  };

  const [secItems, setSecItems] = useState(getProviderSecItems(provider));

  useEffect(() => {
    setSecItems(getProviderSecItems(provider));
  }, [provider]);

  const toggleSecItem = (index: number) => {
    setSecItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], done: !copy[index].done };
      return copy;
    });
  };

  const handleCloneWrite = () => {
    setCloneDivergedBlocks((prev) => prev + 1);
    const newIdx = cloneDivergedBlocks + 1;
    const time = new Date().toLocaleTimeString();
    setCloneLogs((prev) => [
      `${time} — [CLONE WRITE #${newIdx}] Client intercepts table insert. Copy-on-Write allocates a new block segment. Shared physical storage remains read-only and safe!`,
      ...prev
    ].slice(0, 20));
  };

  const runMlInference = () => {
    setMlIsLoading(true);
    setMlLogs([`[INIT] Spawning asynchronous query worker...`]);
    setMlOutput([]);

    const serviceName = isAzure ? 'Azure OpenAI REST API' : isGcp ? 'Vertex AI Prediction API' : 'PostgreSQL SageMaker API';
    const endpointName = isAzure ? 'sp_invoke_external_rest_endpoint' : isGcp ? 'ml_predict_row' : `aws-sagemaker-model-${activeMlQuery}`;
    
    setTimeout(() => {
      setMlLogs(prev => [...prev, `[INFO] Establishing TCP session with ${serviceName}...`]);
    }, 300);

    setTimeout(() => {
      setMlLogs(prev => [...prev, `[INFO] Invoking model server endpoint: '${endpointName}'...`]);
    }, 600);

    setTimeout(() => {
      setMlLogs(prev => [...prev, `[SUCCESS] Model service returned payload in 28ms. Replaying table grid...`]);
      setMlIsLoading(false);
      if (activeMlQuery === 'sentiment') {
        setMlOutput([
          { review: "Highly recommend! Fast performance.", sentiment: "POSITIVE", confidence: "99.8%" },
          { review: "The database connection kept timeout error...", sentiment: "NEGATIVE", confidence: "96.5%" },
          { review: "Standard engine setup, works ok", sentiment: "NEUTRAL", confidence: "78.2%" }
        ]);
      } else if (activeMlQuery === 'fraud') {
        setMlOutput([
          { txn: "TxN-09241 ($4,500 from Moscow IP)", risk: "HIGH RISK (98.2%)", action: "🚫 Blocked" },
          { txn: "TxN-09242 ($15.20 local grocery)", risk: "LOW RISK (0.4%)", action: "✅ Allowed" },
          { txn: "TxN-09243 ($320 online shopping)", risk: "MEDIUM RISK (42.1%)", action: "✅ Allowed" }
        ]);
      } else {
        setMlOutput([
          { user: "User-8823 (Active, 10 queries/day)", score: "Low Churn Risk (1.2%)", status: "Healthy" },
          { user: "User-8824 (Inactive 30 days, plan canceled)", score: "High Churn Risk (94.8%)", status: "📩 Target Promo" },
          { user: "User-8825 (Queries dropped 50%)", score: "Medium Churn Risk (58.4%)", status: "📩 Target Promo" }
        ]);
      }
    }, 1000);
  };

  const getProviderMlFlows = (prov: string) => {
    if (prov === 'azure') {
      return {
        lambda: {
          sql: `-- Invoke Azure OpenAI Sentiment Analysis via REST in SQL\nDECLARE @response NVARCHAR(MAX);\nEXEC sp_invoke_external_rest_endpoint\n  @url = N'https://cog-openai.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2023-05-15',\n  @method = N'POST',\n  @payload = N'{"messages":[{"role":"user","content":"Analyze sentiment of feedback"}]}',\n  @response = @response OUTPUT;\nSELECT customer_id, feedback_text, @response AS azure_openai_sentiment\nFROM feedback_reviews LIMIT 3;`,
          note: '→ Best for: Azure OpenAI chat completions & sentiment scoring directly inside T-SQL / Azure SQL'
        },
        app: {
          sql: `-- Invoke Azure Machine Learning model endpoint from SQL\nDECLARE @response NVARCHAR(MAX);\nEXEC sp_invoke_external_rest_endpoint\n  @url = N'https://fraud-eval.eastus.inference.ml.azure.com/score',\n  @method = N'POST',\n  @payload = N'{"amount": 8400, "client_ip": "198.51.100.12"}',\n  @response = @response OUTPUT;\nSELECT txn_id, amount_usd, @response AS risk_score\nFROM pending_transactions WHERE risk_score > 0.8;`,
          note: '→ Best for: Real-time fraud scoring via Azure Machine Learning REST endpoints'
        },
        pgml: {
          sql: `-- Call Azure Cognitive Services Churn Predictor\nDECLARE @response NVARCHAR(MAX);\nEXEC sp_invoke_external_rest_endpoint\n  @url = N'https://churn-eval.cognitiveservices.azure.com/predict',\n  @method = N'POST',\n  @payload = N'{"active_weeks": 4, "tickets": 9}',\n  @response = @response OUTPUT;\nSELECT user_account, active_weeks, @response AS churn_probability\nFROM premium_members ORDER BY churn_probability DESC LIMIT 2;`,
          note: '→ Best for: Customer churn scoring using Azure Cognitive Services'
        }
      };
    }
    if (prov === 'gcp') {
      return {
        lambda: {
          sql: `-- Invoke Vertex AI sentiment analysis directly inside Cloud SQL / AlloyDB SQL\nSELECT customer_id, review_text,\n  ml_predict_row(\n    'projects/my-gcp-project/locations/us-central1/models/sentiment-v2',\n    json_build_object('text', review_text)\n  ) -> 'predictions' -> 0 AS sentiment_result\nFROM feedback_reviews\nLIMIT 3;`,
          note: '→ Best for: Direct SQL row streaming to Vertex AI online prediction models'
        },
        app: {
          sql: `-- Call Vertex AI Fraud Classifier model endpoint inside SQL\nSELECT txn_id, amount_usd,\n  ml_predict_row(\n    'projects/my-gcp-project/locations/us-central1/models/fraud-v4',\n    json_build_object('amount', amount_usd, 'ip', client_ip)\n  ) -> 'risk_score' AS risk_score\nFROM pending_transactions\nWHERE risk_score > 0.8;`,
          note: '→ Best for: In-database real-time fraud risk classification'
        },
        pgml: {
          sql: `-- Call Vertex AI Customer Churn Evaluator in SQL\nSELECT user_account, active_weeks,\n  ml_predict_row(\n    'projects/my-gcp-project/locations/us-central1/models/churn-v1',\n    json_build_object('weeks', active_weeks, 'tickets', support_tickets)\n  ) -> 'churn_probability' AS churn_probability\nFROM premium_members\nORDER BY churn_probability DESC LIMIT 2;`,
          note: '→ Best for: Automated churn probability calculations in AlloyDB / Cloud SQL'
        }
      };
    }
    return {
      lambda: {
        sql: `-- RDS Lambda Bridge Pattern:\nSELECT customer_id, feedback_text,\n  aws_comprehend.detect_sentiment(\n    feedback_text, 'en'\n  ) AS sentiment\nFROM feedback_reviews\nLIMIT 3;`,
        note: '→ Best for: batch scoring, async ML cron jobs, offloaded processing'
      },
      app: {
        sql: `-- App-Layer / SageMaker Inference Pattern:\nSELECT txn_id, amount_usd,\n  aws_sagemaker.invoke_endpoint(\n    'fraud-classification-v4',\n    'application/json',\n    amount_usd, client_ip\n  ) AS risk_score\nFROM pending_transactions\nWHERE risk_score > 0.8;`,
        note: '→ Best for: real-time predictions at request time, low-latency API routes'
      },
      pgml: {
        sql: `-- PostgreSQL pgml Extension:\nSELECT user_account, active_weeks,\n  pgml.predict(\n    'churn_model',\n    ARRAY[active_weeks, support_tickets]\n  ) AS churn_probability\nFROM premium_members\nORDER BY churn_probability DESC LIMIT 2;`,
        note: '→ Best for: in-database ML, high-throughput feature queries without external calls'
      }
    };
  };

  const mlFlows = getProviderMlFlows(provider);

  // Metrics calculation
  const [metrics, setMetrics] = useState<Metrics>({
    writes: 90,
    reads: 30,
    readTarget: 'replicas',
    writerTps: 90,
    replicaEach: 15,
    failState: 'OK',
    stale: 'Low'
  });

  const lastWriteAtRef = useRef<number>(0);

  const splitTraffic = (t: number) => {
    const writes = Math.round(t * 0.25);
    const reads = t - writes;
    return { writes, reads };
  };

  const staleRisk = (m: string, readRoute: string, lag: number): string => {
    if (readRoute === 'writer') return 'Low';
    if (m !== 'multi_rr') return 'Low';
    if (lag >= 12) return 'High';
    if (lag >= 5) return 'Med';
    return 'Low';
  };

  const effectiveReadTarget = (m: string, readRoute: string): string => {
    if (readRoute === 'writer') return 'writer';
    if (readRoute === 'replicas') return m === 'multi_rr' ? 'replicas' : 'writer';
    const within = Date.now() - lastWriteAtRef.current < 10000;
    if (within) return 'writer';
    return m === 'multi_rr' ? 'replicas' : 'writer';
  };

  const badge = (cls: string, txt: string) => `<span class="rds-badge ${cls}">${txt}</span>`;
  const log = (msg: string) => {
    setLogHtml((prev) => `<b>${new Date().toLocaleTimeString()}</b> — ${msg}<br><span style="color:var(--color-text-tertiary)">${prev}</span>`);
  };

  useEffect(() => {
    const { writes, reads } = splitTraffic(tps);
    const readTarget = effectiveReadTarget(mode, readRoute);
    let writerTps = writes;
    let replicaEach: number | null = null;
    if (readTarget === 'writer') {
      writerTps += reads;
    } else {
      const rrCount = 2;
      replicaEach = Math.round(reads / rrCount);
    }

    const m: Metrics = {
      writes,
      reads,
      readTarget,
      writerTps,
      replicaEach,
      failState: !azFailed ? 'OK' : (mode === 'single' ? 'OUTAGE / DEGRADED' : 'FAILOVER (Standby Active)'),
      stale: staleRisk(mode, readRoute, lag)
    };
    setMetrics(m);
  }, [mode, readRoute, tps, lag, azFailed]);

  const sendWrite = () => {
    lastWriteAtRef.current = Date.now();
    const zoneName = isAzure ? 'East US Zone 1' : isGcp ? 'us-central1-a' : 'AZ-a';
    const standbyZone = isAzure ? 'East US Zone 2' : isGcp ? 'us-central1-b' : 'AZ-b';
    if (azFailed && mode === 'single') {
      log(`${badge('rds-bbad', 'WRITE failed')} Database Instance is down in ${zoneName}. Single-zone configuration has no recovery standby.`);
    } else if (azFailed) {
      log(`${badge('rds-bwarn', 'WRITE ok')} Route successfully redirected to Standby in ${standbyZone}. Endpoint stays the same.`);
    } else {
      log(`${badge('rds-bok', 'WRITE ok')} Transaction successfully committed to <b>Primary DB Instance</b> writer endpoint.`);
    }
  };

  const sendRead = () => {
    const target = effectiveReadTarget(mode, readRoute);
    if (azFailed && mode === 'single') {
      log(`${badge('rds-bbad', 'READ failed')} Database Instance is down. App cannot retrieve data.`);
    } else if (target === 'writer') {
      log(`${badge('rds-binfo', 'READ ok')} Strongly Consistent read successfully fetched directly from the <b>Primary Writer</b>.`);
    } else {
      const risk = staleRisk(mode, readRoute, lag);
      const cls = risk === 'High' ? 'rds-bbad' : risk === 'Med' ? 'rds-bwarn' : 'rds-binfo';
      log(`${badge(cls, 'READ')} Asynchronous read served from <b>Read Replicas</b>. lag: ~${lag}s. Stale-read risk evaluation: <b>${risk}</b>.`);
    }
  };

  const toggleAzFail = () => {
    setAzFailed((s) => !s);
    const zoneName = isAzure ? 'East US Zone 1' : isGcp ? 'us-central1-a' : 'AZ-a';
    if (!azFailed) {
      if (mode === 'single') {
        log(`${badge('rds-bbad', 'CRITICAL OUTAGE')} ${zoneName} suffered a physical datacenter power event. Writer DB is DOWN.`);
      } else {
        log(`${badge('rds-bwarn', 'Zone failover triggered')} ${zoneName} offline. Standby promotion triggered. Gateway shifts records automatically. App reconnects in ~30s.`);
      }
    } else {
      log(`${badge('rds-bok', 'Restored')} ${zoneName} power restored. Subnets and nodes are in normal cluster synchronization state.`);
    }
  };

  const resetSim = () => {
    setAzFailed(false);
    lastWriteAtRef.current = 0;
    setLogHtml('Click "Simulate WRITE/READ" to see which endpoint is used, then toggle zone failure.');
  };

  return (
    <div className="rds-container">
      <style>{`
        /* Premium Encapsulated Developer Workspace Theme */
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .rds-container {
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
          color: var(--color-text-primary, #1e293b);
          background: var(--rds-bg-gradient, radial-gradient(circle at 10% 20%, rgba(240, 253, 244, 0.15) 0%, rgba(255, 255, 255, 1) 90%));

          /* Gradients and colors for 3D database cylinders (light mode default) */
          --metal-ok-1: #a7f3d0;
          --metal-ok-2: #6ee7b7;
          --metal-ok-3: #34d399;
          --metal-ok-4: #059669;
          --lid-ok-1: #d1fae5;
          --lid-ok-2: #6ee7b7;

          --metal-warn-1: #fde047;
          --metal-warn-2: #facc15;
          --metal-warn-3: #eab308;
          --metal-warn-4: #ca8a04;
          --lid-warn-1: #fef9c3;
          --lid-warn-2: #facc15;

          --metal-rep-1: #ddd6fe;
          --metal-rep-2: #c084fc;
          --metal-rep-3: #a78bfa;
          --metal-rep-4: #7c3aed;
          --lid-replica-1: #f3e8ff;
          --lid-replica-2: #a78bfa;

          --metal-app-1: #dbeafe;
          --metal-app-2: #93c5fd;
          --metal-app-3: #60a5fa;
          --metal-app-4: #2563eb;
          --lid-app-1: #eff6ff;
          --lid-app-2: #60a5fa;

          --c-db-ok-1: #ddd6fe;
          --c-db-ok-2: #c084fc;
          --c-db-ok-3: #a78bfa;
          --c-db-ok-4: #7c3aed;
          --l-db-ok-1: #f3e8ff;
          --l-db-ok-2: #a78bfa;

          --c-db-fail-1: #fecaca;
          --c-db-fail-2: #f87171;
          --c-db-fail-3: #ef4444;
          --c-db-fail-4: #b91c1c;
          --l-db-fail-1: #fee2e2;
          --l-db-fail-2: #f87171;

          --g-dark-1: #f8fafc;
          --g-dark-2: #f1f5f9;
          --g-public-1: #eff6ff;
          --g-public-2: #dbeafe;
          --g-app-1: #ecfdf5;
          --g-app-2: #d1fae5;
          --g-replica-1: #f5f3ff;
          --g-replica-2: #e0e7ff;

          --rds-subnets-bg: rgba(255, 255, 255, 0.7);
          --rds-inner-card-bg: #f8fafc;
          --rds-inner-card-border: #e2e8f0;
          --rds-inner-card-text: #334155;
          --rds-row-hover-bg: #ffffff;
          --rds-row-hover-border: #cbd5e1;

          --color-text-primary: #1e293b;
          --color-text-secondary: #475569;
          --color-text-tertiary: #64748b;
          --color-border-secondary: #e2e8f0;
          --rds-svg-line-stroke: #cbd5e1;

          --color-red: #dc2626;
          --color-amber: #d97706;
          --color-green: #16a34a;
          --color-blue: #2563eb;
          --color-purple: #7c3aed;
        }
        
        .rds-h {
          font-size: 24px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
          background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #1d4ed8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
        }

        .rds-sub {
          font-size: 13.5px;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 20px;
          max-width: 90%;
        }

        .rds-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 10px;
        }

        .rds-tb {
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          background: #ffffff;
          color: #475569;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .rds-tb:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
          transform: translateY(-1px);
        }

        .rds-tb.rds-on {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          color: #ffffff !important;
          border-color: #059669 !important;
          font-weight: 600 !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2) !important;
        }

        .rds-card {
          border: 1px solid rgba(16, 185, 129, 0.12);
          border-radius: 20px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          margin-bottom: 20px;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(16, 185, 129, 0.02);
          transition: all 0.25s ease;
        }
        
        .rds-card:hover {
          box-shadow: 0 12px 35px -5px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(16, 185, 129, 0.03);
          border-color: rgba(16, 185, 129, 0.2);
        }

        .rds-sec {
          font-size: 11.5px;
          font-weight: 700;
          color: #047857;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 20px 0 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .rds-sec:first-child {
          margin-top: 0;
        }

        .rds-grid2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .rds-grid3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .rds-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
          margin-bottom: 8px;
          font-size: 12.5px;
          line-height: 1.5;
          transition: all 0.15s ease;
        }

        .rds-row:hover {
          background: #ffffff;
          border-color: #cbd5e1;
          transform: translateX(2px);
        }

        .rds-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 11px;
          color: #fff;
          font-weight: 700;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        }

        .rds-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rds-binfo { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; }
        .rds-bok { background: #f0fdf4; color: #166534; border: 1px solid #dcfce7; }
        .rds-bwarn { background: #fffbeb; color: #9a3412; border: 1px solid #fef3c7; }
        .rds-bbad { background: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; }
        .rds-bpurple { background: #faf5ff; color: #6b21a8; border: 1px solid #f3e8ff; }

        .rds-kpi {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .rds-k {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 12px;
          text-align: center;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.01);
        }
        
        .rds-k:hover {
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }

        .rds-k .t {
          font-size: 10.5px;
          color: #64748b;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 600;
        }

        .rds-k .v {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }

        .rds-controls {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .rds-ctrl {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 14px;
        }

        .rds-ctrl label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 8px;
        }

        .rds-ctrl select {
          width: 100%;
          padding: 8px 12px;
          font-size: 12px;
          font-family: inherit;
          font-weight: 500;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          background: #ffffff;
          outline: none;
          color: #1e293b;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
          transition: all 0.15s ease;
        }

        .rds-ctrl select:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }

        .rds-ctrl input[type="range"] {
          width: 100%;
          height: 6px;
          border-radius: 999px;
          background: #e2e8f0;
          outline: none;
          cursor: pointer;
          accent-color: #10b981;
        }

        .rds-ctrl .out {
          font-size: 11px;
          color: #475569;
          margin-top: 8px;
          font-family: 'JetBrains Mono', monospace;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 6px;
          display: inline-block;
        }

        .rds-mono {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
        }

        .rds-btnbar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .rds-btn {
          font-size: 12px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .rds-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
          transform: translateY(-1px);
        }

        .rds-btn.rds-primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: #059669;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .rds-btn.rds-primary:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
        }

        .rds-log {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 16px;
          font-size: 11.5px;
          color: #e2e8f0;
          font-family: 'JetBrains Mono', monospace;
          line-height: 1.7;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);
        }

        ul.rds-ck, ul.rds-wn {
          padding-left: 0;
          margin-bottom: 0;
        }

        ul.rds-ck li, ul.rds-wn li {
          font-size: 12.5px;
          margin-bottom: 8px;
          list-style: none;
          padding-left: 22px;
          position: relative;
          line-height: 1.5;
          color: #334155;
        }

        ul.rds-ck li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: 800;
          font-size: 14px;
        }

        ul.rds-wn li::before {
          content: "⚠️";
          position: absolute;
          left: 0;
          font-size: 11px;
          top: 1px;
        }

        .rds-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          line-height: 1.5;
        }

        .rds-table th {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 10px 12px;
          text-align: left;
          font-weight: 700;
          color: #475569;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rds-table td {
          border: 1px solid #e2e8f0;
          padding: 10px 12px;
          color: #334155;
        }

        .rds-table tr:nth-child(even) {
          background: rgba(248, 250, 252, 0.5);
        }

        .rds-code-container {
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          background: #f8fafc;
          padding: 16px;
          margin-top: 12px;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.01);
        }

        .rds-svg-bg {
          background-color: #f8fafc;
          border: 1px solid #cbd5e1;
          background-image: radial-gradient(rgba(100, 116, 139, 0.15) 1.2px, transparent 1.2px) !important;
          background-size: 16px 16px;
        }

        .rds-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11.5px;
          white-space: pre-wrap;
          line-height: 1.6;
          color: #334155;
        }
        
        .rds-subtabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          border-bottom: 1px dashed #e2e8f0;
          padding-bottom: 10px;
        }

        .rds-subtb {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          font-size: 11.5px;
          font-weight: 500;
          cursor: pointer;
          background: #ffffff;
          color: #475569;
          transition: all 0.15s ease;
          outline: none;
        }

        .rds-subtb:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .rds-subtb.rds-on {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
          color: #ffffff !important;
          border-color: #1d4ed8 !important;
          font-weight: 600 !important;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.15) !important;
        }

        .rds-subtb.rds-on-purple {
          background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%) !important;
          color: #ffffff !important;
          border-color: #6d28d9 !important;
          font-weight: 600 !important;
          box-shadow: 0 2px 6px rgba(124, 58, 237, 0.15) !important;
        }

        @keyframes activeNodePulse {
          0%, 100% { filter: drop-shadow(0 0 3px var(--pulse-color)); opacity: 0.95; }
          50% { filter: drop-shadow(0 0 12px var(--pulse-color)); opacity: 1; }
        }
        
        .active-glow-node {
          animation: activeNodePulse 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes flowAnim {
          to { stroke-dashoffset: -20; }
        }

        .flow-active-line {
          stroke-dasharray: 6, 4;
          animation: flowAnim 0.8s linear infinite;
        }

        .arch-scenario-btn {
          font-size: 12px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .arch-scenario-btn:hover {
          background: #f8fafc;
          color: #0f172a;
          transform: translateY(-1px);
        }

        .arch-scenario-btn.active {
          background: #f0fdf4;
          color: #047857;
          border-color: #059669;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.12);
        }

        .asg-btn {
          font-size: 12px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
          outline: none;
        }

        .asg-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .asg-btn.asg-on {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          border-color: #059669;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
        }

        .asg-log {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px 14px;
          background: #0f172a;
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          white-space: pre-wrap;
          line-height: 1.6;
          color: #e2e8f0;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.15);
        }

        .asg-card {
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 16px;
          background: #ffffff;
          margin-bottom: 12px;
        }

        .rds-gcard {
          border-radius: 16px;
          padding: 16px;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1px solid #86efac;
          box-shadow: 0 4px 20px rgba(22, 163, 74, 0.05);
        }

        /* Dark Mode Overrides */
        .dark .rds-container {
          background: #020617 !important;
          color: #f8fafc !important;

          --rds-bg-gradient: radial-gradient(circle at 10% 20%, #0f172a 0%, #020617 90%);

          --metal-ok-1: #064e3b;
          --metal-ok-2: #065f46;
          --metal-ok-3: #047857;
          --metal-ok-4: #059669;
          --lid-ok-1: #064e3b;
          --lid-ok-2: #047857;

          --metal-warn-1: #78350f;
          --metal-warn-2: #92400e;
          --metal-warn-3: #b45309;
          --metal-warn-4: #d97706;
          --lid-warn-1: #78350f;
          --lid-warn-2: #b45309;

          --metal-rep-1: #4c1d95;
          --metal-rep-2: #5b21b6;
          --metal-rep-3: #6d28d9;
          --metal-rep-4: #7c3aed;
          --lid-replica-1: #4c1d95;
          --lid-replica-2: #6d28d9;

          --metal-app-1: #1e3a8a;
          --metal-app-2: #1e40af;
          --metal-app-3: #2563eb;
          --metal-app-4: #3b82f6;
          --lid-app-1: #1e3a8a;
          --lid-app-2: #2563eb;

          --c-db-ok-1: #4c1d95;
          --c-db-ok-2: #5b21b6;
          --c-db-ok-3: #6d28d9;
          --c-db-ok-4: #7c3aed;
          --l-db-ok-1: #4c1d95;
          --l-db-ok-2: #6d28d9;

          --c-db-fail-1: #7f1d1d;
          --c-db-fail-2: #991b1b;
          --c-db-fail-3: #b91c1c;
          --c-db-fail-4: #ef4444;
          --l-db-fail-1: #7f1d1d;
          --l-db-fail-2: #b91c1c;

          --g-dark-1: #0b1329;
          --g-dark-2: #020617;
          --g-public-1: #172554;
          --g-public-2: #1e3a8a;
          --g-app-1: #022c22;
          --g-app-2: #064e3b;
          --g-replica-1: #2e1065;
          --g-replica-2: #3b0764;

          --rds-subnets-bg: rgba(15, 23, 42, 0.4);
          --rds-inner-card-bg: rgba(15, 23, 42, 0.6);
          --rds-inner-card-border: rgba(51, 65, 85, 0.6);
          --rds-inner-card-text: #cbd5e1;
          --rds-row-hover-bg: rgba(30, 41, 59, 0.8);
          --rds-row-hover-border: rgba(100, 116, 139, 0.8);

          --color-text-primary: #f8fafc;
          --color-text-secondary: #94a3b8;
          --color-text-tertiary: #64748b;
          --color-border-secondary: rgba(51, 65, 85, 0.6);
          --rds-svg-line-stroke: rgba(100, 116, 139, 0.5);

          --color-red: #f87171;
          --color-amber: #fbbf24;
          --color-green: #4ade80;
          --color-blue: #60a5fa;
          --color-purple: #a78bfa;
        }
        .dark .rds-card,
        .dark [class*="rds-card"] {
          background: rgba(15, 23, 42, 0.75) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }
        .dark .rds-card b,
        .dark .rds-card strong,
        .dark .rds-card h3,
        .dark .rds-card h4 {
          color: #ffffff !important;
        }
        .dark .rds-tabs {
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .rds-tb {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #94a3b8 !important;
        }
        .dark .rds-tb:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #f8fafc !important;
        }
        .dark .rds-tb.rds-on {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          color: #ffffff !important;
          border-color: #10b981 !important;
          font-weight: 600 !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25) !important;
        }
        .dark .rds-sec {
          color: #94a3b8 !important;
        }
        .dark .rds-log,
        .dark .rds-terminal {
          background: #020617 !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #38bdf8 !important;
        }
        .dark .rds-btn {
          background: rgba(15, 23, 42, 0.8) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .rds-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
        }
        .dark select,
        .dark input,
        .dark textarea {
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
          border-color: rgba(51, 65, 85, 0.8) !important;
        }
        .dark select option {
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
        }

        .dark .rds-subtabs {
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .rds-subtb {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .rds-subtb:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
        }
        .dark .rds-subtb.rds-on {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
          color: #ffffff !important;
          border-color: #3b82f6 !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2) !important;
          font-weight: 600 !important;
        }

        .dark .rds-row {
          background: var(--rds-inner-card-bg) !important;
          border-color: var(--rds-inner-card-border) !important;
          color: var(--rds-inner-card-text) !important;
        }
        .dark .rds-row:hover {
          background: var(--rds-row-hover-bg) !important;
          border-color: var(--rds-row-hover-border) !important;
        }

        .dark .rds-table th {
          background: rgba(15, 23, 42, 0.8) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #f8fafc !important;
        }
        .dark .rds-table td {
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }

        .dark .rds-code-container {
          background: rgba(15, 23, 42, 0.5) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .rds-code {
          color: #38bdf8 !important;
        }

        /* Inner cards */
        .rds-inner-card-grey {
          background: var(--rds-inner-card-bg) !important;
          border: 1px solid var(--rds-inner-card-border) !important;
          color: var(--rds-inner-card-text) !important;
        }
        .rds-inner-card-green {
          background: rgba(16, 185, 129, 0.08) !important;
          border: 1px solid rgba(16, 185, 129, 0.3) !important;
          color: var(--color-text-primary) !important;
        }
        .dark .rds-inner-card-green {
          background: rgba(16, 185, 129, 0.15) !important;
          border: 1px solid rgba(16, 185, 129, 0.5) !important;
        }
        .rds-inner-card-red {
          background: rgba(239, 68, 68, 0.08) !important;
          border: 1px solid rgba(239, 68, 68, 0.3) !important;
          color: var(--color-text-primary) !important;
        }
        .dark .rds-inner-card-red {
          background: rgba(239, 68, 68, 0.15) !important;
          border: 1px solid rgba(239, 68, 68, 0.5) !important;
        }
        .rds-inner-card-amber {
          background: rgba(245, 158, 11, 0.08) !important;
          border: 1px solid rgba(245, 158, 11, 0.3) !important;
          color: var(--color-text-primary) !important;
        }
        .dark .rds-inner-card-amber {
          background: rgba(245, 158, 11, 0.15) !important;
          border: 1px solid rgba(245, 158, 11, 0.5) !important;
        }
        .rds-inner-card-blue {
          background: rgba(37, 99, 235, 0.08) !important;
          border: 1px solid rgba(37, 99, 235, 0.3) !important;
          color: var(--color-text-primary) !important;
        }
        .dark .rds-inner-card-blue {
          background: rgba(37, 99, 235, 0.15) !important;
          border: 1px solid rgba(37, 99, 235, 0.5) !important;
        }
        .rds-inner-card-purple {
          background: rgba(124, 58, 237, 0.08) !important;
          border: 1px solid rgba(124, 58, 237, 0.3) !important;
          color: var(--color-text-primary) !important;
        }
        .dark .rds-inner-card-purple {
          background: rgba(124, 58, 237, 0.15) !important;
          border: 1px solid rgba(124, 58, 237, 0.5) !important;
        }

        .dark .rds-k {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .rds-k .t {
          color: #94a3b8 !important;
        }
        .dark .rds-k .v {
          color: #ffffff !important;
        }

        .rds-btn-purple {
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%) !important;
          border-color: #6d28d9 !important;
          color: #ffffff !important;
          box-shadow: 0 4px 12px rgba(124, 58, 237, 0.2) !important;
        }
        .rds-btn-purple:hover {
          background: linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%) !important;
          box-shadow: 0 4px 14px rgba(109, 40, 217, 0.25) !important;
        }

        .rds-btn-danger {
          border: 1px solid #fca5a5 !important;
          color: #dc2626 !important;
          background: #fef2f2 !important;
        }
        .dark .rds-btn-danger {
          border: 1px solid rgba(239, 68, 68, 0.5) !important;
          color: #f87171 !important;
          background: rgba(239, 68, 68, 0.15) !important;
        }

        .rds-svg-text-primary {
          fill: var(--color-text-primary) !important;
        }
        .rds-svg-text-secondary {
          fill: var(--color-text-secondary) !important;
        }

        /* Developer Academy Notes & Visual Mental Models Styling */
        .acad-dir-container {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .acad-dir-header {
          padding: 10px 14px;
          background: var(--color-background-secondary);
          border-bottom: 1px solid var(--color-border-tertiary);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--color-text-primary);
        }
        .acad-dir-folder-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 700;
          border: none;
          background: var(--color-background-primary);
          color: var(--color-text-primary);
          border-bottom: 1px solid var(--color-border-tertiary);
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .acad-dir-folder-btn:hover {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
        }
        .acad-dir-item-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px 8px 24px;
          font-size: 11px;
          font-weight: 600;
          color: var(--color-text-secondary);
          border: none;
          border-left: 3px solid transparent;
          background: var(--color-background-primary);
          transition: all 0.15s ease;
          text-align: left;
          cursor: pointer;
        }
        .acad-dir-item-btn:hover {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
          border-left-color: var(--color-border-tertiary);
        }
        .acad-dir-item-btn.acad-active {
          background: #eff6ff;
          color: #0284c7;
          border-left-color: #0ea5e9;
          font-weight: 800;
        }
        .dark .acad-dir-item-btn.acad-active {
          background: rgba(2, 132, 199, 0.15);
          color: #38bdf8;
          border-left-color: #38bdf8;
        }
        .acad-detail-card {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .acad-hero-badge {
          background: #e0f2fe;
          border: 1.5px solid #bae6fd;
          color: #0369a1;
          font-size: 9.5px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3.5px 10px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .acad-takeaway-box {
          background: linear-gradient(135deg, var(--color-background-primary) 0%, var(--color-background-secondary) 100%);
          border-left: 4px solid #0ea5e9;
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 11.5px;
          line-height: 1.6;
          color: var(--color-text-secondary);
          border-top: 1px solid var(--color-border-tertiary);
          border-right: 1px solid var(--color-border-tertiary);
          border-bottom: 1px solid var(--color-border-tertiary);
        }
        .acad-plain-english {
          background: rgba(2, 132, 199, 0.07);
          border-left: 4px solid #0ea5e9;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 16px;
          font-size: 12.5px;
          line-height: 1.6;
          color: var(--color-text-primary);
          border-top: 1px solid var(--color-border-tertiary);
          border-right: 1px solid var(--color-border-tertiary);
          border-bottom: 1px solid var(--color-border-tertiary);
        }
        .dark .acad-plain-english {
          background: rgba(56, 189, 248, 0.12);
        }
        .acad-analogy-box {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%);
          border: 1.5px solid rgba(245, 158, 11, 0.35);
          border-radius: 12px;
          padding: 16px;
          margin: 16px 0;
          font-size: 12px;
          line-height: 1.6;
          color: var(--color-text-primary);
        }
        .dark .acad-analogy-box {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%);
          border-color: rgba(245, 158, 11, 0.3);
        }
        .acad-gotcha-box {
          background: rgba(239, 68, 68, 0.06);
          border-left: 4px solid #ef4444;
          border-radius: 10px;
          padding: 14px 16px;
          margin: 16px 0;
          font-size: 11.5px;
          line-height: 1.55;
          color: var(--color-text-secondary);
          border-top: 1px solid var(--color-border-tertiary);
          border-right: 1px solid var(--color-border-tertiary);
          border-bottom: 1px solid var(--color-border-tertiary);
        }
        .dark .acad-gotcha-box {
          background: rgba(239, 68, 68, 0.12);
        }
        .acad-flow-step {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: var(--color-background-secondary);
          border-radius: 8px;
          border: 1px solid var(--color-border-tertiary);
          font-size: 11.5px;
          flex: 1 1 160px;
        }
        .acad-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--color-border-tertiary);
        }
        .acad-table th {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
          font-weight: 800;
          padding: 10px 12px;
          border-bottom: 1.5px solid var(--color-border-tertiary);
          text-align: left;
        }
        .acad-table td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--color-border-tertiary);
          color: var(--color-text-secondary);
        }
        .acad-table tr:last-child td {
          border-bottom: none;
        }
        .acad-terminal {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 12px;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          color: #cbd5e1;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
        }
        .acad-advice-box {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          color: var(--color-text-secondary);
        }
      `}</style>

      {/* Flagship Header */}
      <div style={{ padding: '14px 16px 4px' }}>
        <div className="rds-h">
          {isComparative ? (
            <span>⚖️ Multi-Cloud Database Comparison — AWS RDS vs Azure DB vs GCP Cloud SQL</span>
          ) : isAzure ? (
            <span>🛢️ Azure Database for PostgreSQL / MySQL Flexible Server</span>
          ) : isGcp ? (
            <span>🛢️ Google Cloud SQL &amp; AlloyDB Database Services</span>
          ) : (
            <span>🛢️ Amazon RDS — Relational Database Service Visualizer</span>
          )}
        </div>
        <div className="rds-sub">
          {isComparative ? (
            <span>Side-by-side architectural comparison of managed relational databases across AWS, Azure, and GCP.</span>
          ) : isAzure ? (
            <span>Managed database server instances in Azure VNet boundaries. Auto-grow storage, zone-redundant HA, and read replicas.</span>
          ) : isGcp ? (
            <span>Managed relational databases in GCP VPC boundaries. High Availability failovers, WAL read replicas, and Cloud SQL Auth Proxy.</span>
          ) : (
            <span>Managed database server engine inside your VPC boundaries. Easily scale compute, handle synchronous Multi-AZ failovers, configure read replicas, pool database connections with RDS Proxy, and leverage built-in machine learning models.</span>
          )}
        </div>
      </div>

      {/* Main Navigation Tabs */}
      {!isComparative && (
        <div className="rds-tabs">
          <button className={`rds-tb ${activeSection === 'notebook' ? 'rds-on' : ''}`} onClick={() => setActiveSection('notebook')}>📖 1) Visual Notes &amp; Theories</button>
          <button className={`rds-tb ${activeSection === 'overview' ? 'rds-on' : ''}`} onClick={() => setActiveSection('overview')}>⚖️ 2) Concept &amp; Engines</button>
          <button className={`rds-tb ${activeSection === 'connect' ? 'rds-on' : ''}`} onClick={() => setActiveSection('connect')}>🔌 3) Connectivity &amp; SGs</button>
          <button className={`rds-tb ${activeSection === 'multiaz' ? 'rds-on' : ''}`} onClick={() => setActiveSection('multiaz')}>🛡️ 4) High Availability HA</button>
          <button className={`rds-tb ${activeSection === 'replicas' ? 'rds-on' : ''}`} onClick={() => setActiveSection('replicas')}>📖 5) Read Scaling</button>
          <button className={`rds-tb ${activeSection === 'sim' ? 'rds-on' : ''}`} onClick={() => setActiveSection('sim')}>🎮 6) Live Simulation</button>
          <button className={`rds-tb ${activeSection === 'advanced' ? 'rds-on' : ''}`} onClick={() => setActiveSection('advanced')}>🚀 7) Advanced Features</button>
          <button className={`rds-tb ${activeSection === 'best' ? 'rds-on' : ''}`} onClick={() => setActiveSection('best')}>🏗️ 8) Best-Practice Guides</button>
          <button className={`rds-tb ${activeSection === 'unique' ? 'rds-on' : ''}`} onClick={() => setActiveSection('unique')}>✨ Unique Features</button>
        </div>
      )}

      {isComparative && (
        <RDSComparativeView onNavigateToDemo={handleNavigateToDemo} />
      )}

      {!isComparative && activeSection === 'unique' && (
        <UniqueRDSFeatures provider={provider as 'aws' | 'azure' | 'gcp'} />
      )}

      {!isComparative && activeSection !== 'unique' && (
        <>
          {/* Tab 1: Concept & Engines */}
          {activeSection === 'overview' && (
            <div>
              <div className="rds-sec">
                {isAzure ? 'Azure Database Flexible Server — Managed DB Instances in VNet' : isGcp ? 'Google Cloud SQL — Managed DB Instances in VPC' : 'Amazon RDS — Managed DB Instances inside VPC'}
              </div>
              <div className="rds-card">
                <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                  {isAzure ? 'Azure Flexible Server manages patching, automated backups, storage auto-growth, zone-redundant HA, and scaling of PostgreSQL & MySQL engines in your Azure VNet.' : isGcp ? 'Cloud SQL handles OS patching, automated WAL backups, storage auto-resizing, regional HA failover, and scaling of PostgreSQL, MySQL & SQL Server engines in GCP VPC networks.' : 'RDS manages patching, automated backups, software licensing, scaling, and operational overhead of relational engines. Your applications connect directly to standard SQL protocols via managed DNS endpoints.'}
                </div>
                <div className="rds-grid2" style={{ marginBottom: '16px' }}>
                  <div className="rds-inner-card-grey" style={{ borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#16a34a' }}>Core Architectural Components</div>
                    <div className="rds-row"><div className="rds-dot">A</div><div><b>DB Instance (Writer):</b> {isAzure ? 'Primary Flexible Server instance with vCPU, RAM, and Managed Premium SSD (io1/gp3).' : isGcp ? 'Primary Cloud SQL instance compute node with Persistent Disk SSD.' : 'The primary read/write database server instance containing target compute (vCPU) and storage (EBS gp3/io2).'}</div></div>
                    <div className="rds-row"><div className="rds-dot">B</div><div><b>DB Subnet / VPC Network:</b> {isAzure ? 'Delegated VNet Subnet (Microsoft.DBforPostgreSQL/flexibleServers) spanning Availability Zones.' : isGcp ? 'Private Service Access (PSA) subnets spanning GCP Availability Zones in your VPC network.' : 'List of subnets spanning at least two Availability Zones (AZs) in your VPC where RDS can launch resources.'}</div></div>
                    <div className="rds-row"><div className="rds-dot">C</div><div><b>Firewall Rules / Security Groups:</b> {isAzure ? 'Network Security Group (NSG) rules filtering port 5432/3306 inbound traffic.' : isGcp ? 'VPC Firewall Rules filtering port 5432/3306 inbound traffic.' : 'Network firewall rules limiting inbound access to target DB engines (5432 / 3306) at the elastic network interface.'}</div></div>
                    <div className="rds-row"><div className="rds-dot">D</div><div><b>DNS Endpoint:</b> {isAzure ? 'Flexible Server FQDN (database.postgres.database.azure.com) mapped to primary server IP.' : isGcp ? 'Cloud SQL Private IP or Auth Proxy endpoint mapped to primary instance.' : 'Fully Qualified Domain Name (FQDN) mapped to the primary server IP (survives instance recreation).'}</div></div>
                  </div>
                  <div className="rds-inner-card-grey" style={{ borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#1d4ed8' }}>Common Topologies &amp; Features</div>
                    <div className="rds-row"><div className="rds-dot">1</div><div><b>High Availability Standby:</b> {isAzure ? 'Zone-Redundant Standby server in alternate availability zone with synchronous WAL replication.' : isGcp ? 'Regional HA Standby node in secondary GCP zone with synchronous disk replication.' : 'Multi-AZ Standby database in an alternate AZ receiving synchronous transaction updates for DR failover.'}</div></div>
                    <div className="rds-row"><div className="rds-dot">2</div><div><b>Read Replicas:</b> {isAzure ? 'Up to 5 (or 10) Flexible Server Read Replicas receiving async log streams.' : isGcp ? 'Up to 10 Cloud SQL Read Replicas (20 in AlloyDB) receiving async WAL streams.' : 'Scaling nodes receiving asynchronous log streaming to offload select queries from primary.'}</div></div>
                    <div className="rds-row"><div className="rds-dot">3</div><div><b>Connection Proxy / Pool:</b> {isAzure ? 'Built-in PgBouncer on Azure Flexible Server for high-performance socket pooling.' : isGcp ? 'Cloud SQL Auth Proxy & built-in PgBouncer for secure zero-IP connection multiplexing.' : 'RDS Proxy connection pooling engine that mitigates connection bottlenecks and speeds up failover.'}</div></div>
                  </div>
                </div>

                {/* Subnet Groups Zonal SVG */}
                <div className="rds-inner-card-grey" style={{ borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                    📐 Engine-Aware {isAzure ? 'Azure VNet Subnet' : isGcp ? 'GCP VPC Network' : 'AWS VPC Subnet'} Zonal Topology
                  </div>

                  <svg width="100%" viewBox="0 0 680 160" className="rds-svg-bg" style={{ borderRadius: '12px' }}>
                    <defs>
                      <linearGradient id="m-ok" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--metal-ok-1)" />
                        <stop offset="35%" stopColor="var(--metal-ok-2)" />
                        <stop offset="70%" stopColor="var(--metal-ok-3)" />
                        <stop offset="100%" stopColor="var(--metal-ok-4)" />
                      </linearGradient>
                      <linearGradient id="m-warn" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--metal-warn-1)" />
                        <stop offset="35%" stopColor="var(--metal-warn-2)" />
                        <stop offset="70%" stopColor="var(--metal-warn-3)" />
                        <stop offset="100%" stopColor="var(--metal-warn-4)" />
                      </linearGradient>
                      <linearGradient id="m-rep" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--metal-rep-1)" />
                        <stop offset="35%" stopColor="var(--metal-rep-2)" />
                        <stop offset="70%" stopColor="var(--metal-rep-3)" />
                        <stop offset="100%" stopColor="var(--metal-rep-4)" />
                      </linearGradient>

                      <linearGradient id="l-ok" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--lid-ok-1)" />
                        <stop offset="100%" stopColor="var(--lid-ok-2)" />
                      </linearGradient>
                      <linearGradient id="l-warn" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--lid-warn-1)" />
                        <stop offset="100%" stopColor="var(--lid-warn-2)" />
                      </linearGradient>
                      <linearGradient id="l-rep" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--lid-replica-1)" />
                        <stop offset="100%" stopColor="var(--lid-replica-2)" />
                      </linearGradient>

                      <marker id="arr-sync" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                      <marker id="arr-async" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6" /></marker>
                      <marker id="arr-aurora" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#0284c7" /></marker>
                    </defs>

                    {/* Zone 1 */}
                    <rect x="15" y="15" width="200" height="130" rx="10" fill="var(--rds-subnets-bg)" stroke="var(--rds-svg-line-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="115" y="28" textAnchor="middle" fontSize="9" fontWeight="bold" className="rds-svg-text-secondary" fontFamily="monospace">
                      {isAzure ? 'East US Zone 1' : isGcp ? 'us-central1-a' : 'us-east-1a Subnet'}
                    </text>
                    
                    {/* Zone 2 */}
                    <rect x="240" y="15" width="200" height="130" rx="10" fill="var(--rds-subnets-bg)" stroke="var(--rds-svg-line-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="340" y="28" textAnchor="middle" fontSize="9" fontWeight="bold" className="rds-svg-text-secondary" fontFamily="monospace">
                      {isAzure ? 'East US Zone 2' : isGcp ? 'us-central1-b' : 'us-east-1b Subnet'}
                    </text>

                    {/* Zone 3 */}
                    <rect x="465" y="15" width="200" height="130" rx="10" fill="var(--rds-subnets-bg)" stroke="var(--rds-svg-line-stroke)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="565" y="28" textAnchor="middle" fontSize="9" fontWeight="bold" className="rds-svg-text-secondary" fontFamily="monospace">
                      {isAzure ? 'East US Zone 3' : isGcp ? 'us-central1-c' : 'us-east-1c Subnet'}
                    </text>

                    {/* Nodes Render */}
                    {selectedEngine === 'aurora' ? (
                      <>
                        <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                          <path d="M 70 48 L 70 76 A 45 7 0 0 0 160 76 L 160 48 A 45 7 0 0 1 70 48 Z" fill="url(#m-ok)" stroke="#10b981" strokeWidth="1" />
                          <ellipse cx="115" cy="48" rx="45" ry="7" fill="url(#l-ok)" stroke="#10b981" strokeWidth="1" />
                          <text x="115" y="66" textAnchor="middle" fontSize="9.5" fill="#064e3b" fontWeight="bold">🐘 Primary Writer</text>
                          <text x="115" y="86" textAnchor="middle" fontSize="7" fill="#047857" fontFamily="monospace">Active (Zone 1)</text>
                        </g>

                        <g className="active-glow-node" style={{ '--pulse-color': '#8b5cf6' } as React.CSSProperties}>
                          <path d="M 295 48 L 295 76 A 45 7 0 0 0 385 76 L 385 48 A 45 7 0 0 1 295 48 Z" fill="url(#m-rep)" stroke="#8b5cf6" strokeWidth="1" />
                          <ellipse cx="340" cy="48" rx="45" ry="7" fill="url(#l-rep)" stroke="#8b5cf6" strokeWidth="1" />
                          <text x="340" y="66" textAnchor="middle" fontSize="9.5" fill="#4c1d95" fontWeight="bold">📖 {isAzure ? 'Hyperscale Reader' : isGcp ? 'AlloyDB Read Pool' : 'Aurora Reader'}</text>
                          <text x="340" y="86" textAnchor="middle" fontSize="7" fill="#6d28d9" fontFamily="monospace">Lag &lt; 20ms (Zone 2)</text>
                        </g>

                        <rect x="30" y="96" width="620" height="42" rx="8" fill="var(--rds-inner-card-bg)" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,2" />
                        <text x="340" y="107" textAnchor="middle" fontSize="9" fill="#0284c7" fontWeight="bold">
                          {isAzure ? '🌌 Azure SQL Hyperscale Page Server Shards' : isGcp ? '🌌 AlloyDB Log-Structured Distributed Storage' : '🌌 Cloud-Native Shared Storage Pool (Replicated 6-Ways)'}
                        </text>
                        
                        <rect x="50" y="114" width="60" height="18" rx="3" fill="var(--rds-container-bg, #ffffff)" stroke="#0284c7" strokeWidth="0.5"/>
                        <text x="80" y="124" textAnchor="middle" fontSize="7.5" fill="#0284c7" fontFamily="monospace">Disk A1 / A2</text>

                        <rect x="275" y="114" width="60" height="18" rx="3" fill="var(--rds-container-bg, #ffffff)" stroke="#0284c7" strokeWidth="0.5"/>
                        <text x="305" y="124" textAnchor="middle" fontSize="7.5" fill="#0284c7" fontFamily="monospace">Disk B1 / B2</text>

                        <rect x="500" y="114" width="60" height="18" rx="3" fill="var(--rds-container-bg, #ffffff)" stroke="#0284c7" strokeWidth="0.5"/>
                        <text x="530" y="124" textAnchor="middle" fontSize="7.5" fill="#0284c7" fontFamily="monospace">Disk C1 / C2</text>

                        <path d="M 115 84 L 115 96" stroke="#0284c7" strokeWidth="1.5" className="flow-active-line" markerEnd="url(#arr-aurora)"/>
                        <path d="M 340 84 L 340 96" stroke="#0284c7" strokeWidth="1" strokeDasharray="2,2"/>
                      </>
                    ) : (
                      <>
                        <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                          <path d="M 65 52 L 65 92 A 50 10 0 0 0 165 92 L 165 52 A 50 10 0 0 1 65 52 Z" fill="url(#m-ok)" stroke="#10b981" strokeWidth="1.5" />
                          <ellipse cx="115" cy="52" rx="50" ry="10" fill="url(#l-ok)" stroke="#10b981" strokeWidth="1.5" />
                          <text x="115" y="72" textAnchor="middle" fontSize="10" fill="#064e3b" fontWeight="bold">🐘 Primary Writer</text>
                          <text x="115" y="86" textAnchor="middle" fontSize="7" className="rds-svg-text-secondary" fontFamily="monospace">In-Service (Active)</text>
                        </g>

                        <g className="active-glow-node" style={{ '--pulse-color': '#f59e0b' } as React.CSSProperties}>
                          <path d="M 290 52 L 290 92 A 50 10 0 0 0 390 92 L 390 52 A 50 10 0 0 1 290 52 Z" fill="url(#m-warn)" stroke="#d97706" strokeWidth="1" />
                          <ellipse cx="340" cy="52" rx="50" ry="10" fill="url(#l-warn)" stroke="#d97706" strokeWidth="1" />
                          <text x="340" y="72" textAnchor="middle" fontSize="10" fill="#78350f" fontWeight="bold">🛡️ Standby Replica</text>
                          <text x="340" y="86" textAnchor="middle" fontSize="7" className="rds-svg-text-secondary" fontFamily="monospace">Passive (Standby)</text>
                        </g>

                        <g className="active-glow-node" style={{ '--pulse-color': '#8b5cf6' } as React.CSSProperties}>
                          <path d="M 515 52 L 515 92 A 50 10 0 0 0 615 92 L 615 52 A 50 10 0 0 1 515 52 Z" fill="url(#m-rep)" stroke="#8b5cf6" strokeWidth="1" />
                          <ellipse cx="565" cy="52" rx="50" ry="10" fill="url(#l-rep)" stroke="#8b5cf6" strokeWidth="1" />
                          <text x="565" y="72" textAnchor="middle" fontSize="10.5" fill="#4c1d95" fontWeight="bold">📖 Read Replica</text>
                          <text x="565" y="86" textAnchor="middle" fontSize="7" fill="#6d28d9" fontFamily="monospace">Asynchronous WAL</text>
                        </g>

                        <line x1="165" y1="72" x2="290" y2="72" stroke="#10b981" strokeWidth="2" className="flow-active-line" markerEnd="url(#arr-sync)" />
                        <text x="227.5" y="62" textAnchor="middle" fontSize="7.5" fill="#15803d" fontWeight="bold" fontFamily="monospace">Sync 🔄</text>

                        <path d="M 165 72 Q 340 135 515 72" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,2" className="flow-active-line" markerEnd="url(#arr-async)" />
                        <text x="340" y="132" textAnchor="middle" fontSize="8.5" fill="#7c3aed" fontWeight="bold" fontFamily="monospace">Async WAL ➡️</text>
                      </>
                    )}
                  </svg>
                </div>

                {/* Engine Selector details */}
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Supported Relational Database Engines</div>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {(Object.keys(engineDetails) as EngineType[]).map((eng) => (
                      <button
                        key={eng}
                        onClick={() => setSelectedEngine(eng)}
                        className={`rds-subtb ${selectedEngine === eng ? 'rds-on' : ''}`}
                      >
                        {engineDetails[eng].title.split(' ')[0]} {engineDetails[eng].title.substring(2)}
                      </button>
                    ))}
                  </div>
                  <div className="rds-inner-card-grey" style={{ borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: '#16a34a' }}>
                      {engineDetails[selectedEngine].title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px', lineHeight: '1.45' }}>
                      {engineDetails[selectedEngine].desc}
                    </div>
                    <div className="rds-grid2" style={{ gap: '10px' }}>
                      <div>
                        <div className="rds-sec">Engine Specifications</div>
                        {engineDetails[selectedEngine].specs.map((sp, i) => (
                          <div className="rds-mono" style={{ fontSize: '11px', marginBottom: '4px' }} key={i}>
                            <span style={{ color: 'var(--color-text-tertiary)' }}>{sp.k}:</span> <b>{sp.v}</b>
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="rds-sec">Ideal workloads</div>
                        <ul className="rds-ck">
                          {engineDetails[selectedEngine].cases.map((cs, i) => (
                            <li key={i}>{cs}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 2: Connectivity & Security Groups */}
          {activeSection === 'connect' && (
            <div>
              <div className="rds-sec">
                {isAzure ? 'Interactive Azure VNet Security & NSG Rules Sandbox' : isGcp ? 'Interactive GCP VPC Network & Firewall Rules Sandbox' : 'Interactive Network Topology & Security Group Ingress Sandbox'}
              </div>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
                <button 
                  className={`arch-scenario-btn ${ingressSource === 'app' ? 'active' : ''}`}
                  onClick={() => setIngressSource('app')}
                >
                  🟢 Route 1: Standard Application Traffic (Allowed)
                </button>
                <button 
                  className={`arch-scenario-btn ${ingressSource === 'bastion' ? 'active' : ''}`}
                  onClick={() => setIngressSource('bastion')}
                  style={{ borderColor: '#8b5cf6', color: ingressSource === 'bastion' ? '#8b5cf6' : '' }}
                >
                  🟤 Route 2: Administrative Tunnel / Proxy Ingress (Allowed)
                </button>
                <button 
                  className={`arch-scenario-btn ${ingressSource === 'internet' ? 'active' : ''}`}
                  onClick={() => setIngressSource('internet')}
                  style={{ borderColor: '#ef4444', color: ingressSource === 'internet' ? '#ef4444' : '' }}
                >
                  🔴 Route 3: Public Internet Connection (Blocked!)
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '16px', alignItems: 'start' }}>
                
                <div className="rds-card rds-inner-card-grey" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
                  <div style={{ alignSelf: 'flex-start', display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                      🔍 {ingressSource === 'app' ? 'App-to-DB Connection Flow' : ingressSource === 'bastion' ? 'Admin SSH / Proxy SQL Tunnel Ingress' : 'Unauthenticated Public Attack Route'}
                    </span>
                    <span style={{ fontSize: '11px', color: ingressSource === 'internet' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                      ● {ingressSource === 'internet' ? 'ACCESS BLOCKED' : 'SECURE INBOUND ACTIVE'}
                    </span>
                  </div>

                  <svg width="100%" viewBox="0 0 680 240" className="rds-svg-bg" style={{ borderRadius: '12px' }}>
                    <defs>
                      <linearGradient id="c-app" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--metal-app-1)" />
                        <stop offset="100%" stopColor="var(--metal-app-2)" />
                      </linearGradient>
                      <linearGradient id="c-db-ok" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--c-db-ok-1)" />
                        <stop offset="35%" stopColor="var(--c-db-ok-2)" />
                        <stop offset="70%" stopColor="var(--c-db-ok-3)" />
                        <stop offset="100%" stopColor="var(--c-db-ok-4)" />
                      </linearGradient>
                      <linearGradient id="c-db-fail" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--c-db-fail-1)" />
                        <stop offset="35%" stopColor="var(--c-db-fail-2)" />
                        <stop offset="70%" stopColor="var(--c-db-fail-3)" />
                        <stop offset="100%" stopColor="var(--c-db-fail-4)" />
                      </linearGradient>

                      <linearGradient id="l-db-ok" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--l-db-ok-1)" />
                        <stop offset="100%" stopColor="var(--l-db-ok-2)" />
                      </linearGradient>
                      <linearGradient id="l-db-fail" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--l-db-fail-1)" />
                        <stop offset="100%" stopColor="var(--l-db-fail-2)" />
                      </linearGradient>

                      <marker id="acn-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" /></marker>
                      <marker id="acn-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                      <marker id="acn-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6" /></marker>
                      <marker id="acn-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444" /></marker>
                    </defs>

                    <line x1="10" y1="5" x2="10" y2="235" stroke="var(--rds-svg-line-stroke)" strokeWidth="1" strokeDasharray="3,3"/>
                    <text x="18" y="16" fontSize="8" className="rds-svg-text-secondary" fontFamily="monospace">PUBLIC INTERNET BOUNDARY</text>

                    <rect x="55" y="15" width="615" height="210" rx="12" fill="none" stroke="var(--rds-svg-line-stroke)" strokeWidth="1.2" />
                    <text x="362.5" y="27" textAnchor="middle" fontSize="10.5" fontWeight="bold" className="rds-svg-text-secondary" fontFamily="monospace">
                      {isAzure ? 'Azure VNet (10.0.0.0/16)' : isGcp ? 'GCP VPC Network (10.0.0.0/16)' : 'VPC (10.0.0.0/16)'}
                    </text>

                    <rect x="65" y="42" width="165" height="172" rx="8" fill="var(--rds-subnets-bg)" stroke="var(--rds-svg-line-stroke)" strokeWidth="1" />
                    <text x="147.5" y="54" textAnchor="middle" fontSize="8.5" fontWeight="bold" className="rds-svg-text-secondary" fontFamily="monospace">Public Subnets (0.0.0.0/0)</text>
                    
                    <g opacity={ingressSource === 'app' ? 1 : 0.65}>
                      <rect x="80" y="68" width="135" height="42" rx="6" fill="var(--rds-inner-card-bg)" stroke={ingressSource === 'app' ? '#3b82f6' : 'var(--rds-inner-card-border)'} strokeWidth={1} />
                      <text x="147.5" y="85" textAnchor="middle" fontSize="10" fontWeight="bold" className="rds-svg-text-primary">
                        {isAzure ? '🌐 Azure App Gateway' : isGcp ? '🌐 Cloud Load Balancer' : '🌐 sg-alb (ALB)'}
                      </text>
                      <text x="147.5" y="98" textAnchor="middle" fontSize="7.5" fill="#2563eb" fontFamily="monospace">Allow: Port 443</text>
                    </g>

                    <g opacity={ingressSource === 'bastion' ? 1 : 0.65}>
                      <rect x="80" y="132" width="135" height="42" rx="6" fill="var(--rds-inner-card-bg)" stroke={ingressSource === 'bastion' ? '#f59e0b' : 'var(--rds-inner-card-border)'} strokeWidth={1} />
                      <text x="147.5" y="149" textAnchor="middle" fontSize="10" fontWeight="bold" className="rds-svg-text-primary">
                        {isAzure ? '🔒 Bastion / Proxy' : isGcp ? '🔒 Identity Proxy' : '🔒 sg-bastion (Jump)'}
                      </text>
                      <text x="147.5" y="162" textAnchor="middle" fontSize="7.5" fill="#b45309" fontFamily="monospace">Allow: Port 22 / Proxy</text>
                    </g>

                    <rect x="250" y="42" width="170" height="172" rx="8" fill="var(--rds-subnets-bg)" stroke="var(--rds-svg-line-stroke)" strokeWidth="1" />
                    <text x="335" y="54" textAnchor="middle" fontSize="8.5" fontWeight="bold" className="rds-svg-text-secondary" fontFamily="monospace">Private App Subnets</text>
                    
                    <g opacity={ingressSource === 'app' ? 1 : 0.65}>
                      <rect x="265" y="90" width="140" height="52" rx="6" fill="var(--rds-inner-card-bg)" stroke={ingressSource === 'app' ? '#10b981' : 'var(--rds-inner-card-border)'} strokeWidth={1} />
                      <text x="335" y="112" textAnchor="middle" fontSize="10.5" fontWeight="bold" className="rds-svg-text-primary">
                        {isAzure ? '⚙️ App Service / VM' : isGcp ? '⚙️ GKE / App Engine' : '⚙️ sg-app (App Server)'}
                      </text>
                      <text x="335" y="127" textAnchor="middle" fontSize="7.5" fill="#16a34a" fontFamily="monospace">
                        {isAzure ? 'Allow: from App NSG' : isGcp ? 'Allow: from App Tag' : 'Allow: from sg-alb'}
                      </text>
                    </g>

                    <rect x="440" y="42" width="220" height="172" rx="8" fill="var(--rds-subnets-bg)" stroke="var(--rds-svg-line-stroke)" strokeWidth="1" />
                    <text x="550" y="54" textAnchor="middle" fontSize="8.5" fontWeight="bold" className="rds-svg-text-secondary" fontFamily="monospace">
                      {isAzure ? 'Delegated DB Subnet' : isGcp ? 'Private Service Access' : 'Private DB Subnets'}
                    </text>
                    
                    <g opacity={ingressSource !== 'internet' ? 1 : 0.4} className={ingressSource !== 'internet' ? 'active-glow-node' : ''} style={{ '--pulse-color': '#7c3aed' } as React.CSSProperties}>
                      <path d="M 475 110 L 475 140 A 55 12 0 0 0 585 140 L 585 110 A 55 12 0 0 1 475 110 Z" fill={ingressSource === 'internet' ? 'url(#c-db-fail)' : 'url(#c-db-ok)'} stroke={ingressSource === 'internet' ? '#ef4444' : '#8b5cf6'} strokeWidth="1.5" />
                      <ellipse cx="530" cy="110" rx="55" ry="12" fill={ingressSource === 'internet' ? 'url(#l-db-fail)' : 'url(#l-db-ok)'} stroke={ingressSource === 'internet' ? '#ef4444' : '#8b5cf6'} strokeWidth="1.5" />
                      
                      <text x="530" y="90" textAnchor="middle" fontSize="11.5" fontWeight="bold" className="rds-svg-text-primary">
                        {isAzure ? '🗄️ Azure Flexible Server' : isGcp ? '🗄️ Cloud SQL / AlloyDB' : '🗄️ Amazon RDS'}
                      </text>
                      <text x="530" y="128" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill={ingressSource === 'internet' ? '#991b1b' : '#5b21b6'}>
                        {ingressSource === 'app' ? 'allowed from App Subnet' : ingressSource === 'bastion' ? 'allowed from Admin Proxy' : '❌ Public Ingress BLOCKED'}
                      </text>
                    </g>

                    {ingressSource === 'app' && (
                      <>
                        <line x1="5" y1="90" x2="80" y2="90" stroke="#3b82f6" strokeWidth="2.5" className="flow-active-line" markerEnd="url(#acn-blue)"/>
                        <path d="M 215 90 L 265 110" fill="none" stroke="#3b82f6" strokeWidth="2" className="flow-active-line" markerEnd="url(#acn-blue)"/>
                        <text x="240" y="93" fontSize="7.5" fill="#2563eb" fontWeight="bold">HTTP 8080</text>
                        <path d="M 405 120 L 470 120" fill="none" stroke="#10b981" strokeWidth="2.5" className="flow-active-line" markerEnd="url(#acn-green)" />
                        <text x="435" y="112" fontSize="7.5" fill="#16a34a" fontWeight="bold">SQL Port 5432</text>
                      </>
                    )}

                    {ingressSource === 'bastion' && (
                      <>
                        <line x1="5" y1="154" x2="80" y2="154" stroke="#f59e0b" strokeWidth="2" className="flow-active-line" markerEnd="url(#acn-purple)"/>
                        <text x="42.5" y="145" fontSize="7.5" fill="#b45309" fontWeight="bold">Tunneled</text>
                        <path d="M 215 154 L 470 125" fill="none" stroke="#8b5cf6" strokeWidth="2" className="flow-active-line" markerEnd="url(#acn-purple)" />
                        <text x="330" y="148" fontSize="8" fill="#7c3aed" fontWeight="bold">SQL Forwarding</text>
                      </>
                    )}

                    {ingressSource === 'internet' && (
                      <>
                        <path d="M 5 120 L 440 120" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="5,3" className="flow-active-line" markerEnd="url(#acn-red)"/>
                        <text x="220" y="112" fontSize="9.5" fill="#ef4444" fontWeight="bold">💥 Public TCP Query (Direct Attack)</text>
                        <g transform="translate(440, 120)">
                          <circle cx="0" cy="0" r="14" fill="#ef4444" />
                          <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#fff" fontWeight="bold">STOP</text>
                        </g>
                      </>
                    )}
                  </svg>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="asg-card rds-inner-card-grey" style={{ borderLeft: '3px solid #2563eb', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      🔒 Ingress Policy Status
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                      {ingressSource === 'app' && '🟢 Compliant Access Path'}
                      {ingressSource === 'bastion' && '🟣 Secure Admin Tunnel'}
                      {ingressSource === 'internet' && '🔴 Boundary Threat Blocked'}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-secondary)', paddingBottom: '4px' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Internet Gateway Route:</span>
                        <span style={{ fontWeight: 'bold', color: '#ef4444' }}>BLOCKED</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-secondary)', paddingBottom: '4px' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Security Firewall Chain:</span>
                        <span style={{ fontWeight: 'bold', color: '#16a34a' }}>ENFORCED</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-secondary)', paddingBottom: '4px' }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Public IP Address:</span>
                        <span style={{ fontWeight: 'bold', color: '#ef4444' }}>DISABLED</span>
                      </div>
                    </div>
                  </div>

                  <div className="asg-card rds-inner-card-grey" style={{ padding: '12px 14px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                      ⚙️ Network Engineering Explanation
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                      {ingressSource === 'app' && (
                        <span>
                          <b>Production Best Practice:</b> The client app in the private subnet is the ONLY node whitelisted to query the database. Network rules restrict ingress strictly to app server security scopes rather than static public IPs.
                        </span>
                      )}
                      {ingressSource === 'bastion' && (
                        <span>
                          <b>Secure Admin Operations:</b> DBAs establish an SSH or Auth Proxy tunnel. SQL traffic is fully encrypted inside the secure wrapper and whitelisted by backend firewall rules.
                        </span>
                      )}
                      {ingressSource === 'internet' && (
                        <span>
                          <b>Absolute Isolation:</b> Public access is disabled, and database instances reside in subnets lacking public routes. Direct internet probes are physically stopped at the network perimeter.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              <div className="rds-grid2" style={{ gap: '12px', marginTop: '14px' }}>
                <div className="rds-inner-card-grey" style={{ borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#1e3a8a' }}>Standard Connectivity Best Practices</div>
                  <ul className="rds-ck">
                    <li><b>Public Network Access = Disabled:</b> Prevents generation of internet-routable public IPs. Internal private endpoints ensure database queries remain within cloud boundaries.</li>
                    <li><b>Private VPC / VNet Subnets:</b> Place databases in subnets lacking routes pointing to an Internet Gateway (IGW) route table.</li>
                    <li><b>Port Enforcements:</b> Enforce SSL/TLS encryption (`require_ssl=1`) to encrypt data in transit between app instances and database nodes.</li>
                  </ul>
                </div>
                <div className="rds-inner-card-grey" style={{ borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#166534' }}>Identity-Based DB Authentication</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '6px' }}>
                    {isAzure ? 'Use Microsoft Entra ID (Azure AD) tokens to authenticate database connections without hardcoded passwords.' : isGcp ? 'Use Google Cloud IAM database authentication tokens with automated 1-hour expiration limits.' : 'Instead of static database passwords, apps request short-lived IAM credentials (15-minute token validity) via IAM signature V4.'}
                  </div>
                  <ul className="rds-ck">
                    <li>No long-term passwords stored on disk or in configuration files</li>
                    <li>Fine-grained IAM policy bindings restrict access by role/identity</li>
                    <li>Mandates SSL/TLS connections for all authenticating users</li>
                  </ul>
                </div>
              </div>

            </div>
          )}

          {/* Tab 3: High Availability Multi-AZ */}
          {activeSection === 'multiaz' && (
            <div>
              <div className="rds-sec">
                {isAzure ? 'Interactive Azure Zone-Redundant High Availability Failover Sandbox' : isGcp ? 'Interactive Google Cloud SQL Regional High Availability Failover Sandbox' : 'Interactive Multi-AZ Disaster Recovery Failover Sandbox'}
              </div>
              
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button 
                  className="asg-btn asg-on" 
                  onClick={() => {
                    const next = (failoverStep + 1) % 6;
                    setFailoverStep(next);
                    const zone1 = isAzure ? 'East US Zone 1' : isGcp ? 'us-central1-a' : 'us-east-1a';
                    const zone2 = isAzure ? 'East US Zone 2' : isGcp ? 'us-central1-b' : 'us-east-1b';

                    if (next === 0) {
                      setFailoverLogs(['💡 Sandbox reset. Database cluster in normal, synchronized HA operational state.']);
                    } else if (next === 1) {
                      logFailover(`💥 [0s] DISASTER EVENT: Datacenter power failure in ${zone1}! Primary DB is unreachable.`);
                    } else if (next === 2) {
                      logFailover(`⚙️ [10s] EVICTION: High availability manager fencing off primary node in ${zone1} to prevent split-brain writes.`);
                    } else if (next === 3) {
                      logFailover(`🌐 [20s] ROUTING PROPAGATION: Gateway record shifting from ${zone1} to ${zone2}.`);
                    } else if (next === 4) {
                      logFailover(`⚡ [30s] PROMOTION: Standby node in ${zone2} mounting block volumes and replaying transaction journals.`);
                    } else if (next === 5) {
                      logFailover(`🟢 [45s] IN-SERVICE: Recovery complete! Node in ${zone2} promoted to Primary Writer. App connections restored.`);
                    }
                  }}
                  style={{ fontSize: '11.5px', padding: '7px' }}
                >
                  {failoverStep === 5 ? '🔄 Reset Simulator' : '⏭ Trigger Failover State Transition'}
                </button>
                <button 
                  className="asg-btn"
                  onClick={() => {
                    setFailoverStep(0);
                    setFailoverLogs(['💡 Sandbox reset. Database cluster in normal, synchronized HA operational state.']);
                  }}
                  style={{ fontSize: '11.5px', padding: '7px' }}
                >
                  🔄 Reset
                </button>

                <span style={{ fontSize: '12px', color: '#475569', marginLeft: '10px' }}>
                  Active Phase: <b style={{ color: '#0f172a' }}>{failoverStep} of 5</b> — {
                    failoverStep === 0 ? 'Normal Active Cluster' :
                    failoverStep === 1 ? 'Primary Node Crash' :
                    failoverStep === 2 ? 'Active Writer Eviction' :
                    failoverStep === 3 ? 'Gateway Traffic Routing' :
                    failoverStep === 4 ? 'Standby Journal Recovery' : 'Failover In-Service'
                  }
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '16px', alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="rds-card rds-inner-card-grey" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
                    <svg width="100%" viewBox="0 0 680 180" className="rds-svg-bg" style={{ borderRadius: '12px' }}>
                      <defs>
                        <linearGradient id="ha-ok" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="var(--metal-ok-1)" />
                          <stop offset="35%" stopColor="var(--metal-ok-2)" />
                          <stop offset="70%" stopColor="var(--metal-ok-3)" />
                          <stop offset="100%" stopColor="var(--metal-ok-4)" />
                        </linearGradient>
                        <linearGradient id="ha-fail" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="var(--c-db-fail-1)" />
                          <stop offset="35%" stopColor="var(--c-db-fail-2)" />
                          <stop offset="70%" stopColor="var(--c-db-fail-3)" />
                          <stop offset="100%" stopColor="var(--c-db-fail-4)" />
                        </linearGradient>
                        <linearGradient id="ha-warn" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="var(--metal-warn-1)" />
                          <stop offset="35%" stopColor="var(--metal-warn-2)" />
                          <stop offset="70%" stopColor="var(--metal-warn-3)" />
                          <stop offset="100%" stopColor="var(--metal-warn-4)" />
                        </linearGradient>

                        <linearGradient id="hl-ok" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--lid-ok-1)" />
                          <stop offset="100%" stopColor="var(--lid-ok-2)" />
                        </linearGradient>
                        <linearGradient id="hl-fail" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--l-db-fail-1)" />
                          <stop offset="100%" stopColor="var(--l-db-fail-2)" />
                        </linearGradient>
                        <linearGradient id="hl-warn" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--lid-warn-1)" />
                          <stop offset="100%" stopColor="var(--lid-warn-2)" />
                        </linearGradient>

                        <marker id="arr-ha-g" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                        <marker id="arr-ha-r" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444" /></marker>
                      </defs>

                      {/* Primary Zone */}
                      <rect x="15" y="15" width="290" height="150" rx="10" fill="var(--rds-subnets-bg)" stroke={failoverStep >= 1 && failoverStep <= 3 ? '#ef4444' : 'var(--rds-svg-line-stroke)'} strokeWidth="1" strokeDasharray="3,3" />
                      <text x="160" y="28" textAnchor="middle" fontSize="10" fontWeight="bold" className="rds-svg-text-secondary" fontFamily="monospace">
                        {isAzure ? 'East US Zone 1 (Primary)' : isGcp ? 'us-central1-a (Primary Zone)' : 'us-east-1a (Primary Zone)'}
                      </text>

                      {failoverStep === 0 ? (
                         <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties} transform="translate(45, 45)">
                           <path d="M 15 35 L 15 75 A 45 10 0 0 0 105 75 L 105 35 A 45 10 0 0 1 15 35 Z" fill="url(#ha-ok)" stroke="#10b981" strokeWidth="1.5" />
                           <ellipse cx="60" cy="35" rx="45" ry="10" fill="url(#hl-ok)" stroke="#10b981" strokeWidth="1.5" />
                           <text x="60" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#064e3b">✍️ Primary Writer</text>
                           <text x="60" y="55" textAnchor="middle" fontSize="8" fill="#047857" fontFamily="monospace">Active (Healthy)</text>
                         </g>
                      ) : failoverStep === 1 ? (
                         <g className="active-glow-node" style={{ '--pulse-color': '#ef4444' } as React.CSSProperties} transform="translate(45, 45)">
                           <path d="M 15 35 L 15 75 A 45 10 0 0 0 105 75 L 105 35 A 45 10 0 0 1 15 35 Z" fill="url(#ha-fail)" stroke="#ef4444" strokeWidth="2" />
                           <ellipse cx="60" cy="35" rx="45" ry="10" fill="url(#hl-fail)" stroke="#ef4444" strokeWidth="2" />
                           <text x="60" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#9f1239">💥 Crashed DB</text>
                           <text x="60" y="55" textAnchor="middle" fontSize="8" fill="#ef4444" fontFamily="monospace">Hardware Fault</text>
                         </g>
                      ) : (
                         <g opacity="0.4" transform="translate(45, 45)">
                           <path d="M 15 35 L 15 75 A 45 10 0 0 0 105 75 L 105 35 A 45 10 0 0 1 15 35 Z" fill="url(#ha-fail)" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
                           <ellipse cx="60" cy="35" rx="45" ry="10" fill="url(#hl-fail)" stroke="#ef4444" strokeWidth="1.5" />
                           <text x="60" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ef4444" style={{ textDecoration: 'line-through' }}>✍️ Writer DB</text>
                           <text x="60" y="55" textAnchor="middle" fontSize="8" fill="#ef4444" fontFamily="monospace">Evicted Node</text>
                           <path d="M 10 15 L 110 80 M 110 15 L 10 80" stroke="#ef4444" strokeWidth="1.5" opacity="0.4" />
                         </g>
                      )}

                      {/* Standby Zone */}
                      <rect x="375" y="15" width="290" height="150" rx="10" fill="var(--rds-subnets-bg)" stroke={failoverStep === 5 ? '#10b981' : 'var(--rds-svg-line-stroke)'} strokeWidth="1" strokeDasharray="3,3" />
                      <text x="520" y="28" textAnchor="middle" fontSize="10" fontWeight="bold" className="rds-svg-text-secondary" fontFamily="monospace">
                        {isAzure ? 'East US Zone 2 (Standby)' : isGcp ? 'us-central1-b (Standby Zone)' : 'us-east-1b (Standby Zone)'}
                      </text>

                      {failoverStep <= 3 ? (
                         <g transform="translate(405, 45)">
                           <path d="M 15 35 L 15 75 A 45 10 0 0 0 105 75 L 105 35 A 45 10 0 0 1 15 35 Z" fill="var(--rds-inner-card-bg)" stroke="var(--rds-inner-card-border)" strokeWidth="1" />
                           <ellipse cx="60" cy="35" rx="45" ry="10" fill="var(--rds-inner-card-bg)" stroke="var(--rds-inner-card-border)" strokeWidth="1" />
                           <text x="60" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" className="rds-svg-text-primary">🛡️ Standby DB</text>
                           <text x="60" y="55" textAnchor="middle" fontSize="8" className="rds-svg-text-secondary" fontFamily="monospace">Passive (Standby)</text>
                         </g>
                      ) : failoverStep === 4 ? (
                         <g className="active-glow-node" style={{ '--pulse-color': '#f59e0b' } as React.CSSProperties} transform="translate(405, 45)">
                           <path d="M 15 35 L 15 75 A 45 10 0 0 0 105 75 L 105 35 A 45 10 0 0 1 15 35 Z" fill="url(#ha-warn)" stroke="#d97706" strokeWidth="1.5" />
                           <ellipse cx="60" cy="35" rx="45" ry="10" fill="url(#hl-warn)" stroke="#d97706" strokeWidth="1.5" />
                           <text x="60" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#78350f">⚡ Recovering DB</text>
                           <text x="60" y="55" textAnchor="middle" fontSize="8" fill="#b45309" fontFamily="monospace">Replaying Journals</text>
                         </g>
                      ) : (
                         <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties} transform="translate(405, 45)">
                           <path d="M 15 35 L 15 75 A 45 10 0 0 0 105 75 L 105 35 A 45 10 0 0 1 15 35 Z" fill="url(#ha-ok)" stroke="#10b981" strokeWidth="2" />
                           <ellipse cx="60" cy="35" rx="45" ry="10" fill="url(#hl-ok)" stroke="#10b981" strokeWidth="2" />
                           <text x="60" y="20" textAnchor="middle" fontSize="11.5" fontWeight="bold" fill="#064e3b">✍️ Promoted DB</text>
                           <text x="60" y="55" textAnchor="middle" fontSize="8" fill="#16a34a" fontFamily="monospace">Writer (Active)</text>
                         </g>
                      )}

                      {failoverStep === 0 ? (
                         <>
                           <path d="M 305 95 L 375 95" fill="none" stroke="#10b981" strokeWidth="2.5" className="flow-active-line" markerEnd="url(#arr-ha-g)" />
                           <text x="340" y="84" textAnchor="middle" fontSize="7.5" fill="#15803d" fontWeight="bold" fontFamily="monospace">SYNC 🔄</text>
                         </>
                      ) : (
                         <>
                           <path d="M 305 95 L 375 95" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
                           <text x="340" y="84" textAnchor="middle" fontSize="7.5" fill="#ef4444" fontWeight="bold" fontFamily="monospace">BLOCKED</text>
                         </>
                      )}
                    </svg>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                      📟 Disaster Recovery (DR) Event Logs
                    </div>
                    <div className="asg-log" style={{ minHeight: '100px', maxHeight: '140px', overflowY: 'auto' }}>
                      {failoverLogs.map((entry, idx) => (
                        <div key={idx} style={{ marginBottom: idx === failoverLogs.length - 1 ? 0 : 5 }}>
                          {entry}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="asg-card rds-inner-card-grey" style={{ borderLeft: '3px solid #f59e0b', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                      ⚙️ Failover Active Phase
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                      {failoverStep === 0 && '🟢 Cluster Healthy'}
                      {failoverStep === 1 && '🚨 Zone Outage'}
                      {failoverStep === 2 && '🚧 Evicting Old Primary'}
                      {failoverStep === 3 && '🌐 Gateway Traffic Shift'}
                      {failoverStep === 4 && '⚡ Standby Journal Recovery'}
                      {failoverStep === 5 && '🟢 Standby Promoted to Writer'}
                    </div>

                    <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                      {isAzure ? (
                        <span>Zone-Redundant Flexible Server maintains synchronous storage replication between Zone 1 and Zone 2. In case of a zone failure, Azure Gateway automatically redirects incoming connections to the promoted standby.</span>
                      ) : isGcp ? (
                        <span>Cloud SQL Regional HA leverages synchronous disk replication between primary and standby zones. In an outage, regional failover takes under 60 seconds with zero data loss (RPO = 0).</span>
                      ) : (
                        <span>RDS Multi-AZ maintains synchronous physical block replication between AZ-a and AZ-b. On failure, RDS shifts DNS CNAME records to point to the new Primary node without changing app connection strings.</span>
                      )}
                    </div>
                  </div>

                  <div className="asg-card rds-inner-card-grey" style={{ padding: '12px 14px', fontSize: '11px', lineHeight: '1.4' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                      📊 Target RPO &amp; RTO Guarantees
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div><b>RPO (Recovery Point Objective):</b> 0 seconds (Synchronous replication ensures zero data loss).</div>
                      <div><b>RTO (Recovery Time Objective):</b> 30 – 60 seconds automatic failover time.</div>
                    </div>
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* Tab 4: Read Scaling & Replicas */}
          {activeSection === 'replicas' && (
            <div>
              <div className="rds-sec">
                {isAzure ? 'Interactive Azure Flexible Server Read Replica Scaling & Lag Sandbox' : isGcp ? 'Interactive Google Cloud SQL Read Replica Scaling & Lag Sandbox' : 'Interactive Read Replica Scaling & Replication Lag Sandbox'}
              </div>

              <div className="rds-ctrl rds-inner-card-grey" style={{ marginBottom: '14px' }}>
                <label style={{ color: 'var(--color-text-secondary)' }}>Simulate Read-Ahead Log (WAL) Streaming Lag Delay (seconds)</label>
                <input type="range" min="0" max="30" value={replicaWalLag} onChange={(e) => setReplicaWalLag(Number(e.target.value))} />
                <div className="out" style={{ color: replicaWalLag > 5 ? 'var(--color-red)' : replicaWalLag > 2 ? 'var(--color-amber)' : 'var(--color-green)' }}>
                  Active WAL Lag: <b>{replicaWalLag} seconds</b>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '16px', alignItems: 'start' }}>
                <div className="rds-card rds-inner-card-grey" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
                  <svg width="100%" viewBox="0 0 680 180" className="rds-svg-bg" style={{ borderRadius: '12px' }}>
                    <defs>
                      <marker id="arr-rep-p" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6" /></marker>
                    </defs>

                    <rect x="25" y="25" width="180" height="130" rx="10" fill="var(--g-app-1)" stroke="#10b981" strokeWidth="1.5" />
                    <text x="115" y="42" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#064e3b">✍️ Primary Writer</text>
                    <text x="115" y="55" textAnchor="middle" fontSize="7.5" fill="#047857" fontFamily="monospace">Commit Log: LSN 0/1A9F400</text>
                    
                    <g transform="translate(65, 65)">
                      <path d="M 10 20 L 10 50 A 40 8 0 0 0 90 50 L 90 20 A 40 8 0 0 1 10 20 Z" fill="url(#m-ok)" stroke="#10b981" strokeWidth="1" />
                      <ellipse cx="50" cy="20" rx="40" ry="8" fill="url(#l-ok)" stroke="#10b981" strokeWidth="1" />
                      <text x="50" y="38" textAnchor="middle" fontSize="8.5" fill="#064e3b" fontWeight="bold">Primary DB Node</text>
                    </g>

                    <rect x="360" y="15" width="295" height="150" rx="10" fill="var(--g-replica-1)" stroke="#8b5cf6" strokeWidth="1.5" />
                    <text x="507.5" y="30" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#4c1d95">📖 Asynchronous Read Replicas</text>
                    
                    <g transform="translate(380, 42)">
                      <rect x="0" y="0" width="120" height="110" rx="8" fill="var(--rds-inner-card-bg)" stroke="#8b5cf6" strokeWidth="1" />
                      <text x="60" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#4c1d95">Replica 1</text>
                      <text x="60" y="28" textAnchor="middle" fontSize="7" fill={replicaWalLag > 5 ? '#ef4444' : '#6d28d9'} fontFamily="monospace">Lag: ~{replicaWalLag}s</text>

                      <path d="M 20 50 L 20 75 A 40 7 0 0 0 100 75 L 100 50 A 40 7 0 0 1 20 50 Z" fill="url(#m-rep)" stroke="#8b5cf6" strokeWidth="1" />
                      <ellipse cx="60" cy="50" rx="40" ry="7" fill="url(#l-rep)" stroke="#8b5cf6" strokeWidth="1" />
                      <text x="60" y="66" textAnchor="middle" fontSize="8" fill="#4c1d95" fontWeight="bold">Read Replica #1</text>
                    </g>

                    <g transform="translate(515, 42)">
                      <rect x="0" y="0" width="120" height="110" rx="8" fill="var(--rds-inner-card-bg)" stroke="#8b5cf6" strokeWidth="1" />
                      <text x="60" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#4c1d95">Replica 2</text>
                      <text x="60" y="28" textAnchor="middle" fontSize="7" fill={replicaWalLag > 5 ? '#ef4444' : '#6d28d9'} fontFamily="monospace">Lag: ~{replicaWalLag}s</text>

                      <path d="M 20 50 L 20 75 A 40 7 0 0 0 100 75 L 100 50 A 40 7 0 0 1 20 50 Z" fill="url(#m-rep)" stroke="#8b5cf6" strokeWidth="1" />
                      <ellipse cx="60" cy="50" rx="40" ry="7" fill="url(#l-rep)" stroke="#8b5cf6" strokeWidth="1" />
                      <text x="60" y="66" textAnchor="middle" fontSize="8" fill="#4c1d95" fontWeight="bold">Read Replica #2</text>
                    </g>

                    <path d="M 205 90 C 270 90, 300 65, 380 65" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,2" className="flow-active-line" markerEnd="url(#arr-rep-p)" />
                    <path d="M 205 90 C 270 90, 380 115, 515 115" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeDasharray="5,2" className="flow-active-line" markerEnd="url(#arr-rep-p)" />
                    <text x="330" y="80" textAnchor="middle" fontSize="8.5" fill="#7c3aed" fontWeight="bold" fontFamily="monospace">Async Log Stream</text>
                  </svg>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {replicaWalLag > 2 ? (
                    <div className="asg-card rds-inner-card-amber" style={{ borderLeft: '3px solid #f59e0b', padding: '12px 14px' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>
                        ⚠️ Eventual Consistency Risk
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                        Primary writer updated rows at `T-0`. Replicas are still catching up with WAL log offsets.
                        <br /><br />
                        Reading from replicas now will serve <b>stale data</b> that is {replicaWalLag} seconds behind real-time.
                      </div>
                    </div>
                  ) : (
                    <div className="asg-card rds-inner-card-green" style={{ borderLeft: '3px solid #10b981', padding: '12px 14px' }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
                        🟢 Strong Read Consistency
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                        Minimal WAL lag delay of {replicaWalLag}s.
                        <br /><br />
                        Replicas are fully caught up. Reads served are near-100% strongly consistent with zero risk of stale data.
                      </div>
                    </div>
                  )}

                  <div className="asg-card rds-inner-card-grey" style={{ padding: '12px 14px', fontSize: '11px', lineHeight: '1.4' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '4px' }}>🛡️ Mitigating Replica Lag</div>
                    To prevent serving stale data to a user who just wrote something:
                    <ul style={{ paddingLeft: '14px', margin: '4px 0 0 0' }}>
                      <li><b>Read-Your-Own-Writes:</b> Force queries to go to the <b>Primary Writer</b> for 10-15s immediately following a transaction write.</li>
                      <li><b>Redis Caching:</b> Cache updates synchronously in Redis / MemoryStore for instant read-backs.</li>
                    </ul>
                  </div>
                </div>

              </div>

              <div className="rds-grid2" style={{ gap: '12px', marginTop: '14px' }}>
                <div className="rds-inner-card-grey" style={{ borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#1d4ed8' }}>Ideal Scaling Workloads</div>
                  <ul className="rds-ck">
                    <li><b>Read Scaling:</b> Distribute heavy query traffic (reporting dashboards, read-only feeds) across active read replicas.</li>
                    <li><b>Offload Analytics:</b> Run complex SQL analytics queries without locking rows or utilizing compute resources on your Primary transaction DB.</li>
                    <li><b>Cross-Region Disaster Recovery:</b> Build replicas in different geographical regions to achieve local low-latency reads for global users.</li>
                  </ul>
                </div>
                <div className="rds-inner-card-grey" style={{ borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#dc2626' }}>Gotchas &amp; Replica Lag</div>
                  <ul className="rds-wn">
                    <li><b>Asynchronous Lag:</b> Replicas are split seconds behind the primary. Monitor replica lag telemetry metrics.</li>
                    <li><b>Stale Reads:</b> Reading a row immediately after updating it on the writer may return old data if routed to a lagging replica.</li>
                    <li><b>Promotion Overhead:</b> Replicas can be promoted to a primary standalone database, but this is a manual lifecycle event that severs replication pipelines.</li>
                  </ul>
                </div>
              </div>

            </div>
          )}

          {/* Tab 5: Live Simulation */}
          {activeSection === 'sim' && (
            <div>
              <div className="rds-sec">
                {isAzure ? 'Interactive Azure Traffic Routing, Replication Lag & Zone Failover Simulation' : isGcp ? 'Interactive GCP Traffic Routing, Replication Lag & Regional Failover Simulation' : 'Interactive Traffic Routing, Replication Lag & Failover Simulation'}
              </div>
              <div className="rds-card">
                <div className="rds-controls">
                  <div className="rds-ctrl">
                    <label>Deployment Mode</label>
                    <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
                      <option value="single">Single-Zone (Writer instance only)</option>
                      <option value="multi">High Availability (Writer + Synchronous Standby)</option>
                      <option value="multi_rr">HA + 2 Read Replicas (HA &amp; Read Scaled)</option>
                    </select>
                    <div className="out">Mode: <b>{mode === 'single' ? 'Single-Zone' : mode === 'multi' ? 'High Availability' : 'HA + 2 Replicas'}</b></div>
                  </div>

                  <div className="rds-ctrl">
                    <label>Read Routing Configuration</label>
                    <select value={readRoute} onChange={(e) => setReadRoute(e.target.value as any)}>
                      <option value="writer">Reads &rarr; Writer endpoint directly (Strong Consistency)</option>
                      <option value="replicas">Reads &rarr; Replicas (if present, else Writer)</option>
                      <option value="smart">Smart Routing: force Writer within 10s of writes, else Replicas</option>
                    </select>
                    <div className="out">Strategy: <b>{readRoute.toUpperCase()}</b></div>
                  </div>

                  <div className="rds-ctrl">
                    <label>Client Traffic Volume (TPS Load)</label>
                    <input type="range" min="10" max="400" value={tps} onChange={(e) => setTps(Number(e.target.value))} />
                    <div className="out">Total Load: <b>{tps} TPS</b> (Writes: 25% | Reads: 75%)</div>
                  </div>

                  <div className="rds-ctrl">
                    <label>Replica Lag Delay (seconds)</label>
                    <input type="range" min="0" max="30" value={lag} onChange={(e) => setLag(Number(e.target.value))} disabled={mode !== 'multi_rr'} />
                    <div className="out">Active Delay: <b>{lag} seconds</b></div>
                  </div>
                </div>

                <div className="rds-kpi">
                  <div className="rds-k">
                    <div className="t">Writer TPS Load</div>
                    <div className="rds-v">{metrics.writerTps} TPS</div>
                  </div>
                  <div className="rds-k">
                    <div className="t">Replica TPS (each)</div>
                    <div className="rds-v">{metrics.replicaEach !== null ? `${metrics.replicaEach} TPS` : '—'}</div>
                  </div>
                  <div className="rds-k">
                    <div className="t">Failover Cluster State</div>
                    <div className="rds-v" style={{ color: azFailed ? (mode === 'single' ? 'var(--color-red)' : 'var(--color-amber)') : 'var(--color-green)' }}>{metrics.failState}</div>
                  </div>
                  <div className="rds-k">
                    <div className="t">Stale Read Risk</div>
                    <div className="rds-v" style={{ color: metrics.stale === 'High' ? 'var(--color-red)' : metrics.stale === 'Med' ? 'var(--color-amber)' : 'var(--color-green)' }}>{metrics.stale}</div>
                  </div>
                </div>

                <div className="rds-btnbar">
                  <button className="rds-btn rds-primary" onClick={sendWrite}>✍️ Simulate WRITE</button>
                  <button className="rds-btn" onClick={sendRead}>📖 Simulate READ</button>
                  <button className="rds-btn rds-btn-danger" onClick={toggleAzFail}>⚡ Toggle Zone Failure</button>
                  <button className="rds-btn" onClick={resetSim}>🔄 Reset Sim</button>
                </div>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch', marginTop: '16px' }}>
                  <div className="rds-card rds-inner-card-grey" style={{ flex: 7, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.02)', margin: 0 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'activeNodePulse 1.5s infinite', '--pulse-color': 'rgba(16, 185, 129, 0.5)' } as React.CSSProperties}></span>
                        Live Active Traffic Ingress Diagram
                      </div>
                      
                      <svg width="100%" viewBox="0 0 680 260" className="rds-svg-bg" style={{ borderRadius: '12px' }}>
                        <defs>
                          <linearGradient id="metal-writer-ok" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--metal-ok-1)" />
                            <stop offset="35%" stopColor="var(--metal-ok-2)" />
                            <stop offset="70%" stopColor="var(--metal-ok-3)" />
                            <stop offset="100%" stopColor="var(--metal-ok-4)" />
                          </linearGradient>
                          <linearGradient id="metal-writer-fail" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--c-db-fail-1)" />
                            <stop offset="35%" stopColor="var(--c-db-fail-2)" />
                            <stop offset="70%" stopColor="var(--c-db-fail-3)" />
                            <stop offset="100%" stopColor="var(--c-db-fail-4)" />
                          </linearGradient>
                          <linearGradient id="metal-standby-ok" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--metal-warn-1)" />
                            <stop offset="35%" stopColor="var(--metal-warn-2)" />
                            <stop offset="70%" stopColor="var(--metal-warn-3)" />
                            <stop offset="100%" stopColor="var(--metal-warn-4)" />
                          </linearGradient>
                          <linearGradient id="metal-replica" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--metal-rep-1)" />
                            <stop offset="35%" stopColor="var(--metal-rep-2)" />
                            <stop offset="70%" stopColor="var(--metal-rep-3)" />
                            <stop offset="100%" stopColor="var(--metal-rep-4)" />
                          </linearGradient>
                          <linearGradient id="metal-app" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--metal-app-1)" />
                            <stop offset="35%" stopColor="var(--metal-app-2)" />
                            <stop offset="70%" stopColor="var(--metal-app-3)" />
                            <stop offset="100%" stopColor="var(--metal-app-4)" />
                          </linearGradient>

                          <linearGradient id="lid-writer-ok" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--lid-ok-1)" />
                            <stop offset="100%" stopColor="var(--lid-ok-2)" />
                          </linearGradient>
                          <linearGradient id="lid-writer-fail" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--l-db-fail-1)" />
                            <stop offset="100%" stopColor="var(--l-db-fail-2)" />
                          </linearGradient>
                          <linearGradient id="lid-standby-ok" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--lid-warn-1)" />
                            <stop offset="100%" stopColor="var(--lid-warn-2)" />
                          </linearGradient>
                          <linearGradient id="lid-replica" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--lid-replica-1)" />
                            <stop offset="100%" stopColor="var(--lid-replica-2)" />
                          </linearGradient>
                          <linearGradient id="lid-app" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--lid-app-1)" />
                            <stop offset="100%" stopColor="var(--lid-app-2)" />
                          </linearGradient>

                          <marker id="arr-write" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--color-blue)" />
                          </marker>
                          <marker id="arr-read" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--color-purple)" />
                          </marker>
                          <marker id="arr-sync" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                            <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--color-green)" />
                          </marker>
                        </defs>

                        {/* Zone Boundaries */}
                        <rect x="215" y="30" width="220" height="205" rx="12" fill="var(--rds-subnets-bg)" stroke="var(--rds-svg-line-stroke)" strokeWidth="1" strokeDasharray="4,4" />
                        <text x="325" y="44" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--color-text-secondary)" letterSpacing="0.02em" fontFamily="inherit">
                          {isAzure ? 'East US Zone 1 (Primary)' : isGcp ? 'us-central1-a (Primary Zone)' : 'us-east-1a (Primary Zone)'}
                        </text>

                        <rect x="445" y="30" width="220" height="205" rx="12" fill="var(--rds-subnets-bg)" stroke="var(--rds-svg-line-stroke)" strokeWidth="1" strokeDasharray="4,4" />
                        <text x="555" y="44" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--color-text-secondary)" letterSpacing="0.02em" fontFamily="inherit">
                          {isAzure ? 'East US Zone 2 (Standby)' : isGcp ? 'us-central1-b (Standby Zone)' : 'us-east-1b (Standby Zone)'}
                        </text>

                        {/* APP TIER */}
                        <g transform="translate(20, 75)">
                          <rect x="0" y="0" width="165" height="110" rx="16" fill="url(#metal-app)" stroke="#2563eb" strokeWidth="1.5" className="active-glow-node" style={{ '--pulse-color': 'rgba(37, 99, 235, 0.25)' } as React.CSSProperties} />
                          <rect x="5" y="5" width="155" height="100" rx="11" fill="#1e293b" />
                          
                          <rect x="12" y="16" width="141" height="20" rx="4" fill="#0f172a" stroke="#334155" />
                          <circle cx="22" cy="26" r="3" fill="#10b981" />
                          <circle cx="30" cy="26" r="1.5" fill="#3b82f6" style={{ animation: 'activeNodePulse 1s infinite', '--pulse-color': '#3b82f6' } as React.CSSProperties} />
                          <rect x="45" y="24" width="70" height="4" rx="2" fill="#1e293b" />
                          <rect x="45" y="24" width="45" height="4" rx="2" fill="#10b981" />
                          
                          <rect x="12" y="42" width="141" height="20" rx="4" fill="#0f172a" stroke="#334155" />
                          <circle cx="22" cy="52" r="3" fill="#10b981" />
                          <circle cx="30" cy="52" r="1.5" fill="#3b82f6" style={{ animation: 'activeNodePulse 1.2s infinite', '--pulse-color': '#3b82f6' } as React.CSSProperties} />
                          <rect x="45" y="50" width="70" height="4" rx="2" fill="#1e293b" />
                          <rect x="45" y="50" width="60" height="4" rx="2" fill="#0284c7" />

                          <text x="82.5" y="78" textAnchor="middle" fontSize="10" fill="#e2e8f0" fontWeight="bold" fontFamily="inherit">💻 App Compute Tier</text>
                          <text x="82.5" y="92" textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="monospace">Load: {tps} TPS (25% W | 75% R)</text>
                        </g>

                        {(() => {
                          const writerIsActive = !azFailed;
                          const writerIsSingleDown = azFailed && mode === 'single';
                          const writerIsMultiFailed = azFailed && mode !== 'single';

                          let wBodyFill = 'url(#metal-writer-ok)';
                          let wLidFill = 'url(#lid-writer-ok)';
                          let wStroke = 'var(--color-green)';
                          let wText = 'var(--color-green)';
                          let wStatus = 'WRITER: Active WAL';
                          let wGlow = 'active-glow-node';
                          let wPulse = 'rgba(16, 185, 129, 0.35)';

                          if (writerIsSingleDown || writerIsMultiFailed) {
                            wBodyFill = 'url(#metal-writer-fail)';
                            wLidFill = 'url(#lid-writer-fail)';
                            wStroke = 'var(--color-red)';
                            wText = 'var(--color-red)';
                            wStatus = writerIsSingleDown ? '🚨 OFFLINE (NO HA)' : '❌ EVICTED (Zone Crash)';
                            wGlow = '';
                            wPulse = '';
                          }

                          const standbyActive = mode !== 'single';
                          const standbyIsPromoted = azFailed && standbyActive;

                          let sBodyFill = 'url(#metal-standby-ok)';
                          let sLidFill = 'url(#lid-standby-ok)';
                          let sStroke = 'var(--color-amber)';
                          let sText = 'var(--color-amber)';
                          let sStatus = '🛡️ PASSIVE HOT STANDBY';
                          let sGlow = '';
                          let sPulse = 'rgba(251, 191, 36, 0.15)';

                          if (standbyIsPromoted) {
                            sBodyFill = 'url(#metal-writer-ok)';
                            sLidFill = 'url(#lid-writer-ok)';
                            sStroke = 'var(--color-green)';
                            sText = 'var(--color-green)';
                            sStatus = '✍️ PROMOTED ACTIVE WRITER';
                            sGlow = 'active-glow-node';
                            sPulse = 'rgba(16, 185, 129, 0.4)';
                          }

                          const activeWriterY = standbyIsPromoted ? 180 : 90;

                          return (
                            <>
                              {writerIsSingleDown ? (
                                <>
                                  <path d="M 185 130 C 210 130, 220 95, 235 90" fill="none" stroke="var(--color-red)" strokeWidth="2.5" strokeDasharray="4,4" />
                                  <text x="215" y="112" fontSize="8" fontWeight="bold" fill="var(--color-red)" textAnchor="middle">❌ OFFLINE</text>
                                </>
                              ) : (
                                <>
                                  <path d={`M 185 120 C 210 120, 220 ${activeWriterY - 10}, 245 ${activeWriterY - 10}`} fill="none" stroke="var(--color-blue)" strokeWidth="2.5" className="flow-active-line" markerEnd="url(#arr-write)" />
                                  <text x="215" y={activeWriterY - 15} fontSize="8.5" fontWeight="bold" fill="var(--color-blue)" textAnchor="middle">Writes: {metrics.writes} TPS</text>

                                  {metrics.readTarget === 'writer' ? (
                                    <>
                                      <path d={`M 185 140 C 210 140, 220 ${activeWriterY + 10}, 245 ${activeWriterY + 10}`} fill="none" stroke="var(--color-blue)" strokeWidth="2.5" className="flow-active-line" markerEnd="url(#arr-write)" />
                                      <text x="215" y={activeWriterY + 22} fontSize="8.5" fontWeight="bold" fill="var(--color-blue)" textAnchor="middle">Reads: {metrics.reads} TPS</text>
                                    </>
                                  ) : (
                                    mode === 'multi_rr' && (
                                      <>
                                        <path d="M 185 140 C 220 140, 360 85, 480 85" fill="none" stroke="var(--color-purple)" strokeWidth="2" className="flow-active-line" markerEnd="url(#arr-read)" />
                                        <path d="M 185 145 C 220 145, 360 165, 480 165" fill="none" stroke="var(--color-purple)" strokeWidth="2" className="flow-active-line" markerEnd="url(#arr-read)" />
                                        <text x="235" y="160" fontSize="8.5" fontWeight="bold" fill="var(--color-purple)" textAnchor="middle">Reads (Split): {metrics.reads} TPS</text>
                                      </>
                                    )
                                  )}
                                </>
                              )}

                              {/* PRIMARY WRITER */}
                              <g transform="translate(250, 52)" className={wGlow} style={{ '--pulse-color': wGlow ? wPulse : '' } as React.CSSProperties}>
                                <path d="M 15 40 L 15 80 A 45 12 0 0 0 105 80 L 105 40 A 45 12 0 0 1 15 40 Z" fill={wBodyFill} stroke={wStroke} strokeWidth="1.5" />
                                <ellipse cx="60" cy="40" rx="45" ry="12" fill={wLidFill} stroke={wStroke} strokeWidth="1.5" />
                                <text x="60" y="24" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={wText}>🐘 Primary DB Writer</text>
                                <text x="60" y="65" textAnchor="middle" fontSize="8" fontWeight="bold" fill={wText} opacity="0.95">{wStatus}</text>
                                <text x="60" y="98" textAnchor="middle" fontSize="9" fontWeight="800" fill={wText}>{writerIsActive ? `Load: ${metrics.writerTps} TPS` : '0 TPS — Unreachable'}</text>
                              </g>

                              {/* STANDBY */}
                              {standbyActive && (
                                <g transform="translate(250, 142)" className={sGlow} style={{ '--pulse-color': sGlow ? sPulse : '' } as React.CSSProperties}>
                                  <path d="M 15 40 L 15 80 A 45 12 0 0 0 105 80 L 105 40 A 45 12 0 0 1 15 40 Z" fill={sBodyFill} stroke={sStroke} strokeWidth="1.5" />
                                  <ellipse cx="60" cy="40" rx="45" ry="12" fill={sLidFill} stroke={sStroke} strokeWidth="1.5" />
                                  <text x="60" y="24" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={sText}>{standbyIsPromoted ? '🛡️ Promoted DB Writer' : '🛡️ HA Standby DB'}</text>
                                  <text x="60" y="65" textAnchor="middle" fontSize="8" fontWeight="bold" fill={sText} opacity="0.95">{sStatus}</text>
                                  <text x="60" y="98" textAnchor="middle" fontSize="9" fontWeight="800" fill={sText}>{standbyIsPromoted ? `Load: ${metrics.writerTps} TPS` : 'State: Mirrored Commit'}</text>
                                </g>
                              )}

                              {standbyActive && (
                                writerIsActive ? (
                                  <>
                                    <path d="M 310 135 L 310 180" fill="none" stroke="var(--color-green)" strokeWidth="2.5" className="flow-active-line" markerEnd="url(#arr-sync)" />
                                    <text x="345" y="158" fontSize="8" fontWeight="bold" fill="var(--color-green)" textAnchor="middle">SYNC COMMITS 🔄</text>
                                  </>
                                ) : (
                                  <>
                                    <path d="M 310 135 L 310 180" fill="none" stroke="var(--color-red)" strokeWidth="1.5" strokeDasharray="3,3" />
                                    <text x="345" y="158" fontSize="8" fontWeight="bold" fill="var(--color-red)" textAnchor="middle">LINK BROKEN ❌</text>
                                  </>
                                )
                              )}

                              {/* REPLICAS */}
                              {mode === 'multi_rr' && (
                                <>
                                  <g transform="translate(485, 48)" className="active-glow-node" style={{ '--pulse-color': 'rgba(139, 92, 246, 0.25)' } as React.CSSProperties}>
                                    <path d="M 12 32 L 12 64 A 36 10 0 0 0 84 64 L 84 32 A 36 10 0 0 1 12 32 Z" fill="url(#metal-replica)" stroke="var(--color-purple)" strokeWidth="1" />
                                    <ellipse cx="48" cy="32" rx="36" ry="10" fill="url(#lid-replica)" stroke="var(--color-purple)" strokeWidth="1" />
                                    <text x="48" y="18" textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--color-purple)">📖 Read Replica 1</text>
                                    <text x="48" y="52" textAnchor="middle" fontSize="7.5" fill="var(--color-purple)" fontFamily="monospace">Lag: {lag}s | {metrics.replicaEach} TPS</text>
                                  </g>

                                  <g transform="translate(485, 138)" className="active-glow-node" style={{ '--pulse-color': 'rgba(139, 92, 246, 0.25)' } as React.CSSProperties}>
                                    <path d="M 12 32 L 12 64 A 36 10 0 0 0 84 64 L 84 32 A 36 10 0 0 1 12 32 Z" fill="url(#metal-replica)" stroke="var(--color-purple)" strokeWidth="1" />
                                    <ellipse cx="48" cy="32" rx="36" ry="10" fill="url(#lid-replica)" stroke="var(--color-purple)" strokeWidth="1" />
                                    <text x="48" y="18" textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--color-purple)">📖 Read Replica 2</text>
                                    <text x="48" y="52" textAnchor="middle" fontSize="7.5" fill="var(--color-purple)" fontFamily="monospace">Lag: {lag}s | {metrics.replicaEach} TPS</text>
                                  </g>
                                </>
                              )}
                            </>
                          );
                        })()}
                      </svg>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: '1.5' }}>
                      💡 <b>Tip:</b> Toggling zone failure with HA enabled demonstrates automatic node shift: traffic is seamlessly routed to the promoted standby writer, maintaining app availability.
                    </div>
                  </div>

                  <div style={{ flex: 3, position: 'relative' }}>
                    <div className="rds-log" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, marginTop: 0, minHeight: 'unset', maxHeight: 'none', overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: logHtml }} />
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Tab 6: Advanced Features */}
          {activeSection === 'advanced' && (
            <div>
              <div className="rds-sec">Advanced Enterprise Features: Backup Sandbox, CoW Cloning, Security Grade, ML SQL &amp; Connection Proxy</div>
              <div className="rds-card">
                
                <div className="rds-subtabs">
                  <button className={`rds-subtb ${activeFeatureTab === 'backup' ? 'rds-on' : ''}`} onClick={() => setActiveFeatureTab('backup')}>💾 6.1) Backup PITR Sandbox</button>
                  <button className={`rds-subtb ${activeFeatureTab === 'clone' ? 'rds-on' : ''}`} onClick={() => setActiveFeatureTab('clone')}>🧬 6.2) DB Cloning Sandbox</button>
                  <button className={`rds-subtb ${activeFeatureTab === 'security' ? 'rds-on' : ''}`} onClick={() => setActiveFeatureTab('security')}>🔒 6.3) Security HUD Grade</button>
                  <button className={`rds-subtb ${activeFeatureTab === 'ml' ? 'rds-on' : ''}`} onClick={() => setActiveFeatureTab('ml')}>🤖 6.4) ML SQL Sandbox</button>
                  <button className={`rds-subtb ${activeFeatureTab === 'proxy' ? 'rds-on' : ''}`} onClick={() => setActiveFeatureTab('proxy')}>🔀 6.5) Connection Pooling</button>
                </div>

                {/* Sub-tab 6.1: Backup & Restore */}
                {activeFeatureTab === 'backup' && (() => {
                  const formatPitrTime = (m: number) => {
                    const hh = String(Math.floor(m / 60)).padStart(2, '0');
                    const mm = String(m % 60).padStart(2, '0');
                    return `${hh}:${mm}:00 UTC`;
                  };

                  const pitrTimeFormatted = formatPitrTime(pitrTargetTime);
                  
                  return (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-amber)' }}>💾 Point-in-Time Recovery (PITR) Snapshots &amp; Log Timeline Simulator</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: '1.45' }}>
                        {isAzure ? 'Azure Flexible Server combines daily automated backups with continuous Write-Ahead Log (WAL) archiving to Azure Storage. Restore your database down to any exact millisecond commit.' : isGcp ? 'Cloud SQL combines daily automated disk snapshots with continuous WAL archiving in Google Cloud Storage. Restore down to any target second.' : 'RDS combines daily automated incremental backups with 5-minute transaction Write-Ahead Log (WAL) streams uploaded to Amazon S3. Restore your cluster down to any exact millisecond commit.'}
                      </div>
                      
                      <div className="rds-grid2" style={{ gap: '14px', marginBottom: '14px' }}>
                        <div className="rds-ctrl">
                          <label>1. Set Backup Retention Window (Days)</label>
                          <input type="range" min="1" max="35" value={pitrDays} onChange={(e) => setPitrDays(Number(e.target.value))} />
                          <div className="out" style={{ color: 'var(--color-amber)' }}>Retention Period: <b>{pitrDays} days</b> (Range: 1–35 days)</div>
                        </div>

                        <div className="rds-ctrl">
                          <label>2. Drag Target Recovery Point (Timeline Time)</label>
                          <input type="range" min="0" max="1439" value={pitrTargetTime} onChange={(e) => setPitrTargetTime(Number(e.target.value))} />
                          <div className="out" style={{ color: 'var(--color-blue)' }}>Point-In-Time: <b>{pitrTimeFormatted}</b></div>
                        </div>
                      </div>

                      <div className="rds-inner-card-grey" style={{ borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                        <div style={{ fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                          📊 Point-In-Time Recovery Timeline (Active Restore Frame)
                        </div>
                        
                        <svg width="100%" height="90" viewBox="0 0 640 90" className="rds-svg-bg" style={{ borderRadius: '6px' }}>
                          <rect x="30" y="45" width="580" height="8" rx="4" fill="var(--rds-inner-card-border)" />
                          <rect x="30" y="45" width="580" height="8" rx="4" fill="var(--color-green)" opacity="0.3" />
                          
                          <circle cx="50" cy="49" r="6" fill="var(--color-green)" />
                          <text x="50" y="32" textAnchor="middle" fontSize="8" fill="var(--color-green)" fontWeight="bold">Snapshot 00:00</text>
                          
                          <circle cx="240" cy="49" r="6" fill="var(--color-green)" />
                          <text x="240" y="32" textAnchor="middle" fontSize="8" fill="var(--color-green)" fontWeight="bold">Snapshot 08:00</text>

                          <circle cx="430" cy="49" r="6" fill="var(--color-green)" />
                          <text x="430" y="32" textAnchor="middle" fontSize="8" fill="var(--color-green)" fontWeight="bold">Snapshot 16:00</text>
                          
                          {(() => {
                            const px = 30 + (pitrTargetTime / 1439) * 580;
                            return (
                              <g>
                                <line x1={px} y1="12" x2={px} y2="78" stroke="var(--color-blue)" strokeWidth="2" strokeDasharray="2,2" />
                                <polygon points={`${px},40 ${px - 5},30 ${px + 5},30`} fill="var(--color-blue)" />
                                <circle cx={px} cy="49" r="8" fill="var(--color-blue)" className="active-glow-node" style={{ '--pulse-color': 'rgba(2, 132, 199, 0.4)' } as React.CSSProperties} />
                                <text x={px} y="74" textAnchor="middle" fontSize="9" fill="var(--color-blue)" fontWeight="bold">Target Point: {pitrTimeFormatted}</text>
                              </g>
                            );
                          })()}
                          
                          <text x="590" y="18" textAnchor="end" fontSize="8" fill="var(--color-text-secondary)" fontFamily="monospace">Continuous WAL Streams ➡️ Cloud Storage</text>
                        </svg>
                      </div>

                      <div className="rds-grid2" style={{ gap: '14px', marginBottom: '14px' }}>
                        <div className="rds-inner-card-grey" style={{ borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ fontWeight: 600, fontSize: '11px', color: 'var(--color-blue)', marginBottom: '8px', fontFamily: 'monospace' }}>
                            ⚡ Monospace Recovery Journal Logs
                          </div>
                          <div className="rds-mono" style={{ fontSize: '10.5px', color: 'var(--color-text-primary)', lineHeight: '1.5', minHeight: '120px' }}>
                            <span style={{ color: 'var(--color-text-secondary)' }}>[1/4]</span> Probing storage catalog for base daily snapshot...<br/>
                            <span style={{ color: 'var(--color-green)' }}>[SUCCESS]</span> Found base snapshot <span style={{ color: 'var(--color-green)', fontWeight: 'bold' }}>`db-snap-daily-t00`</span><br/>
                            <span style={{ color: 'var(--color-text-secondary)' }}>[2/4]</span> Deploying new database compute node in isolated subnet...<br/>
                            <span style={{ color: 'var(--color-text-secondary)' }}>[3/4]</span> Replaying Write-Ahead Log (WAL) segments...<br/>
                            <span style={{ color: 'var(--color-blue)' }}>[INFO]</span> Streamed WAL logs from snapshot to target restore frame {pitrTimeFormatted}<br/>
                            <span style={{ color: 'var(--color-amber)' }}>[SUCCESS]</span> Database fully recovered to {pitrTimeFormatted}. Status: <span style={{ color: 'var(--color-green)', fontWeight: 'bold' }}>ACTIVE</span>
                          </div>
                        </div>

                        <div className="rds-inner-card-grey" style={{ borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          <div style={{ fontWeight: 600, fontSize: '12.5px', color: 'var(--color-green)', marginBottom: '6px' }}>
                            🛡️ Automatic Restoration Guarantees
                          </div>
                          <ul className="rds-ck" style={{ fontSize: '11.5px' }}>
                            <li><b>Zero Downtime Impact:</b> Restores create a new separate database instance, leaving the active production database untouched.</li>
                            <li><b>RPO Precision:</b> Restore resolution down to the exact second or millisecond timestamp.</li>
                            <li><b>Automated Cleanup:</b> Retention policies automatically purge obsolete snapshots beyond the specified retention window.</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Sub-tab 6.2: Database Cloning */}
                {activeFeatureTab === 'clone' && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-purple)' }}>🧬 Copy-on-Write Database Fast Cloning Sandbox</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: '1.45' }}>
                      {isAzure ? 'Azure SQL Hyperscale and Flexible Server support fast Copy-on-Write database cloning. Clones share underlying physical storage pages until rows are modified.' : isGcp ? 'AlloyDB and Cloud SQL support fast Point-In-Time Database Clones without copying physical disk blocks upfront.' : 'Amazon RDS / Aurora supports Copy-on-Write database cloning. Creating a clone takes seconds regardless of database size because data blocks are shared until modified.'}
                    </div>

                    <div className="rds-grid2" style={{ gap: '14px', marginBottom: '14px' }}>
                      <div className="rds-inner-card-grey" style={{ borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#10b981' }}>Original DB Storage Blocks</div>
                        <div className="rds-row"><div className="rds-dot" style={{ background: '#10b981' }}>P1</div><div>Physical Page 1042 (Base Data)</div></div>
                        <div className="rds-row"><div className="rds-dot" style={{ background: '#10b981' }}>P2</div><div>Physical Page 1043 (Shared Read-Only)</div></div>
                      </div>
                      <div className="rds-inner-card-grey" style={{ borderRadius: '8px', padding: '12px' }}>
                        <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#8b5cf6' }}>Cloned DB CoW Blocks (Allocated: {cloneDivergedBlocks})</div>
                        <div className="rds-row"><div className="rds-dot" style={{ background: '#8b5cf6' }}>C1</div><div>Pointers to Page 1042/1043 (0 GB added)</div></div>
                        {cloneDivergedBlocks > 0 && (
                          <div className="rds-row"><div className="rds-dot" style={{ background: '#ef4444' }}>C2</div><div><b>New CoW Block #{cloneDivergedBlocks}:</b> Diverged Delta Page</div></div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '14px' }}>
                      <button className="rds-btn rds-primary" onClick={handleCloneWrite}>✍️ Simulate Write on Cloned DB</button>
                      <button className="rds-btn" onClick={() => { setCloneDivergedBlocks(0); setCloneLogs(['💡 Reset clone pointers.']); }}>🔄 Reset Clone Blocks</button>
                    </div>

                    <div className="asg-log" style={{ minHeight: '80px', maxHeight: '120px', overflowY: 'auto' }}>
                      {cloneLogs.map((entry, idx) => (
                        <div key={idx}>{entry}</div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sub-tab 6.3: Security HUD Grade */}
                {activeFeatureTab === 'security' && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-green)' }}>
                      🔒 {isAzure ? 'Azure Database Security Compliance HUD' : isGcp ? 'Google Cloud SQL Security Compliance HUD' : 'Amazon RDS Security Compliance HUD'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
                      Interactive security posture assessment. Toggle compliance items to calculate your real-time security grade.
                    </div>

                    <div className="rds-grid2" style={{ gap: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {secItems.map((item, idx) => (
                          <div key={idx} className="rds-row" style={{ cursor: 'pointer' }} onClick={() => toggleSecItem(idx)}>
                            <input type="checkbox" checked={item.done} onChange={() => {}} style={{ marginTop: '3px' }} />
                            <span style={{ fontSize: '11.5px', color: item.done ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)', textDecoration: item.done ? 'none' : 'line-through' }}>
                              {item.label}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="rds-inner-card-grey" style={{ borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>Security Posture Score</div>
                        {(() => {
                          const doneCount = secItems.filter(i => i.done).length;
                          const pct = Math.round((doneCount / secItems.length) * 100);
                          const grade = pct >= 90 ? 'A+' : pct >= 70 ? 'B' : pct >= 50 ? 'C' : 'F';
                          const gradeColor = pct >= 90 ? '#10b981' : pct >= 70 ? '#3b82f6' : pct >= 50 ? '#f59e0b' : '#ef4444';
                          
                          return (
                            <>
                              <div style={{ fontSize: '48px', fontWeight: '800', color: gradeColor, margin: '8px 0' }}>{grade}</div>
                              <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{pct}% Compliant ({doneCount} / {secItems.length} Controls)</div>
                              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '6px', textAlign: 'center' }}>
                                {pct >= 90 ? '🔒 Production Grade: Enterprise hardening policies enforced!' : '⚠️ Warning: Unenforced security controls detected!'}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tab 6.4: ML SQL Sandbox */}
                {activeFeatureTab === 'ml' && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-purple)' }}>
                      🤖 {isAzure ? 'In-Database Azure OpenAI & Azure ML SQL Sandbox' : isGcp ? 'In-Database Vertex AI ML SQL Sandbox' : 'In-Database Machine Learning (ML) SQL Sandbox'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                      {isAzure ? 'Execute Machine Learning and OpenAI sentiment analysis directly inside SQL queries using REST endpoints.' : isGcp ? 'Execute Vertex AI online predictions directly inside Cloud SQL or AlloyDB SQL queries using ml_predict_row.' : 'Execute machine learning models directly inside SQL queries using Amazon Comprehend, SageMaker, or pgml extension.'}
                    </div>

                    <div className="rds-subtabs">
                      <button
                        className={`rds-subtb ${activeMlQuery === 'sentiment' ? 'rds-on-purple' : ''}`}
                        onClick={() => { setActiveMlQuery('sentiment'); setMlOutput([]); setMlLogs([]); }}
                      >
                        💬 Sentiment Analysis ({isAzure ? 'Azure OpenAI' : isGcp ? 'Vertex AI' : 'Comprehend'})
                      </button>
                      <button
                        className={`rds-subtb ${activeMlQuery === 'fraud' ? 'rds-on-purple' : ''}`}
                        onClick={() => { setActiveMlQuery('fraud'); setMlOutput([]); setMlLogs([]); }}
                      >
                        💳 Transaction Fraud Evaluator ({isAzure ? 'Azure ML' : isGcp ? 'Vertex AI' : 'SageMaker'})
                      </button>
                      <button
                        className={`rds-subtb ${activeMlQuery === 'churn' ? 'rds-on-purple' : ''}`}
                        onClick={() => { setActiveMlQuery('churn'); setMlOutput([]); setMlLogs([]); }}
                      >
                        📈 Churn Prediction Models
                      </button>
                    </div>

                    <div className="rds-grid2" style={{ gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <div className="rds-sec" style={{ color: 'var(--color-purple)' }}>Active SQL Inference Query Block</div>
                        <div className="rds-code-container">
                          <div className="rds-code">
                            {activeMlQuery === 'sentiment' && mlFlows.lambda.sql}
                            {activeMlQuery === 'fraud' && mlFlows.app.sql}
                            {activeMlQuery === 'churn' && mlFlows.pgml.sql}
                          </div>
                        </div>
                        <button className="rds-btn rds-btn-purple" onClick={runMlInference} style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}>
                          ⚡ Run ML Inference Query inside DB
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div className="rds-inner-card-grey" style={{ borderRadius: '8px', padding: '12px', flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '10.5px', color: 'var(--color-text-secondary)', marginBottom: '6px', fontFamily: 'monospace' }}>
                            📟 Query ML Inference Terminal Streams
                          </div>
                          <div className="rds-mono" style={{ fontSize: '10px', color: 'var(--color-text-primary)', minHeight: '80px', lineHeight: '1.5' }}>
                            {mlIsLoading ? (
                              <div style={{ color: 'var(--color-amber)', animation: 'activeNodePulse 1s infinite', '--pulse-color': 'var(--color-amber)' } as React.CSSProperties}>
                                Connecting to Cloud ML Inference Endpoint... 🚀
                              </div>
                            ) : mlLogs.length === 0 ? (
                              <span style={{ color: 'var(--color-text-tertiary)' }}>Click "Run ML Inference Query inside DB" to view inference executions.</span>
                            ) : null}
                            {mlLogs.map((log, idx) => (
                              <div key={idx}>{log}</div>
                            ))}
                          </div>
                        </div>

                        {mlOutput.length > 0 && (
                          <div className="rds-inner-card-grey" style={{ borderRadius: '8px', padding: '12px' }}>
                            <div style={{ fontWeight: 600, fontSize: '11px', color: 'var(--color-green)', marginBottom: '6px', fontFamily: 'monospace' }}>
                              📊 SQL GRID RESULT SET (Model Returns)
                            </div>
                            <table className="rds-table" style={{ fontSize: '10px' }}>
                              <thead>
                                <tr>
                                  {activeMlQuery === 'sentiment' && (
                                    <>
                                      <th>Customer Feedback Comment</th>
                                      <th>Sentiment</th>
                                      <th>Confidence</th>
                                    </>
                                  )}
                                  {activeMlQuery === 'fraud' && (
                                    <>
                                      <th>Inbound Transaction ID</th>
                                      <th>ML Score</th>
                                      <th>Action Result</th>
                                    </>
                                  )}
                                  {activeMlQuery === 'churn' && (
                                    <>
                                      <th>Target Customer Account</th>
                                      <th>Churn Propensity</th>
                                      <th>Engagement Status</th>
                                    </>
                                  )}
                                </tr>
                              </thead>
                              <tbody>
                                {mlOutput.map((row, idx) => (
                                  <tr key={idx}>
                                    {activeMlQuery === 'sentiment' && (
                                      <>
                                        <td>{row.review}</td>
                                        <td style={{ color: row.sentiment === 'NEGATIVE' ? 'var(--color-red)' : 'var(--color-green)', fontWeight: 'bold' }}>{row.sentiment}</td>
                                        <td style={{ color: 'var(--color-blue)' }}>{row.confidence}</td>
                                      </>
                                    )}
                                    {activeMlQuery === 'fraud' && (
                                      <>
                                        <td>{row.txn}</td>
                                        <td style={{ color: row.risk.includes('HIGH') ? 'var(--color-red)' : 'var(--color-green)', fontWeight: 'bold' }}>{row.risk}</td>
                                        <td style={{ color: 'var(--color-blue)' }}>{row.action}</td>
                                      </>
                                    )}
                                    {activeMlQuery === 'churn' && (
                                      <>
                                        <td>{row.user}</td>
                                        <td style={{ color: row.score.includes('High') ? 'var(--color-red)' : 'var(--color-green)', fontWeight: 'bold' }}>{row.score}</td>
                                        <td style={{ color: 'var(--color-purple)' }}>{row.status}</td>
                                      </>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-tab 6.5: Connection Pooling */}
                {activeFeatureTab === 'proxy' && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-blue)' }}>
                      🔀 {isAzure ? 'Built-in PgBouncer & Azure Connection Proxy Pool' : isGcp ? 'Cloud SQL Auth Proxy & Built-in PgBouncer Pool' : 'RDS Proxy Serverless Connection Multiplexing Pool Simulator'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: '1.45' }}>
                      {isAzure ? 'Azure Flexible Server includes built-in PgBouncer for high-concurrency connection pooling, preventing thread memory exhaustion.' : isGcp ? 'Cloud SQL Auth Proxy and built-in PgBouncer manage secure client sockets, multiplexing incoming app requests down to stable database backend connections.' : 'RDS Proxy acts as a high-performance proxy pool, scaling connections down to small persistent pipes to avoid database out-of-memory errors.'}
                    </div>

                    <div className="rds-ctrl rds-inner-card-grey" style={{ marginBottom: '14px' }}>
                      <label style={{ color: 'var(--color-text-secondary)' }}>Set Active App Ingress Connection Surge (TCP Clients)</label>
                      <input type="range" min="10" max="1000" value={proxyConcurrency} onChange={(e) => setProxyConcurrency(Number(e.target.value))} />
                      <div className="out" style={{ color: 'var(--color-blue)', background: 'var(--rds-inner-card-bg)', border: '1px solid var(--rds-inner-card-border)' }}>Incoming Surge Load: <b>{proxyConcurrency} Active TCP Clients</b></div>
                    </div>

                    <div className="rds-grid3" style={{ marginBottom: '14px' }}>
                      <div className="rds-k">
                        <div className="t" style={{ color: 'var(--color-red)' }}>Incoming Surge</div>
                        <div className="v" style={{ color: 'var(--color-red)' }}>{proxyConcurrency} Sockets</div>
                      </div>
                      <div className="rds-k">
                        <div className="t" style={{ color: 'var(--color-green)' }}>Pooled DB Backends</div>
                        <div className="v" style={{ color: 'var(--color-green)' }}>
                          {Math.max(10, Math.min(60, Math.round(proxyConcurrency * 0.05 + 8)))} Pipes
                        </div>
                      </div>
                      <div className="rds-k">
                        <div className="t" style={{ color: 'var(--color-blue)' }}>CPU Context Savings</div>
                        <div className="v" style={{ color: 'var(--color-blue)' }}>
                          {Math.round((1 - (Math.max(10, Math.min(60, Math.round(proxyConcurrency * 0.05 + 8))) / proxyConcurrency)) * 100)}%
                        </div>
                      </div>
                    </div>

                    <div className="rds-inner-card-grey" style={{ padding: '12px', marginBottom: '14px' }}>
                      <div style={{ fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px', color: 'var(--color-text-tertiary)' }}>
                        🔀 Real-Time Connection Pooling Multiplexing Path
                      </div>
                      
                      <svg width="100%" height="100" viewBox="0 0 640 100" className="rds-svg-bg" style={{ borderRadius: '6px' }}>
                        <defs>
                          <linearGradient id="p-db-body" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="var(--metal-ok-1)" />
                            <stop offset="35%" stopColor="var(--metal-ok-2)" />
                            <stop offset="70%" stopColor="var(--metal-ok-3)" />
                            <stop offset="100%" stopColor="var(--metal-ok-4)" />
                          </linearGradient>
                          <linearGradient id="p-db-lid" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--lid-ok-1)" />
                            <stop offset="100%" stopColor="var(--lid-ok-2)" />
                          </linearGradient>
                        </defs>

                        <rect x="20" y="15" width="100" height="70" rx="6" fill="var(--g-public-1)" stroke="var(--color-blue)" strokeWidth="1" />
                        <text x="70" y="32" textAnchor="middle" fontSize="9" fill="var(--color-blue)" fontWeight="bold">⚡ App Surge</text>
                        <text x="70" y="50" textAnchor="middle" fontSize="12" fill="var(--color-text-primary)" fontWeight="bold">{proxyConcurrency}</text>
                        <text x="70" y="66" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)" fontWeight="600">TCP Sockets</text>

                        <rect x="250" y="15" width="140" height="70" rx="6" fill="var(--g-app-1)" stroke="var(--color-blue)" strokeWidth="1.5" className="active-glow-node" style={{ '--pulse-color': 'var(--color-blue)' } as React.CSSProperties} />
                        <text x="320" y="38" textAnchor="middle" fontSize="10.5" fill="var(--color-text-primary)" fontWeight="bold">
                          {isAzure ? '🔄 PgBouncer Pool' : isGcp ? '🔄 Cloud SQL Auth Proxy' : '🔄 RDS Proxy Pool'}
                        </text>
                        <text x="320" y="58" textAnchor="middle" fontSize="8.5" fill="var(--color-blue)" fontWeight="bold">Multiplexing Active</text>
                        <text x="320" y="72" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)" fontFamily="monospace">Queue Draining</text>

                        <path d="M 532 25 L 532 65 A 38 7 0 0 0 608 65 L 608 25 A 38 7 0 0 1 532 25 Z" fill="url(#p-db-body)" stroke="var(--color-green)" strokeWidth="1" />
                        <ellipse cx="570" cy="25" rx="38" ry="7" fill="url(#p-db-lid)" stroke="var(--color-green)" strokeWidth="1" />
                        <text x="570" y="16" textAnchor="middle" fontSize="9" fill="var(--color-green)" fontWeight="bold">🐘 DB Node</text>
                        <text x="570" y="58" textAnchor="middle" fontSize="11" fill="var(--color-text-primary)" fontWeight="bold">{Math.max(10, Math.min(60, Math.round(proxyConcurrency * 0.05 + 8)))}</text>
                        <text x="570" y="74" textAnchor="middle" fontSize="7.5" fill="var(--color-green)">Stable Sockets</text>

                        <path d="M 120 30 L 250 45" fill="none" stroke="var(--color-red)" strokeWidth="1.5" className="flow-active-line" style={{ strokeDasharray: '4, 2' } as React.CSSProperties} />
                        <path d="M 120 50 L 250 50" fill="none" stroke="var(--color-red)" strokeWidth="1.5" className="flow-active-line" style={{ strokeDasharray: '4, 2' } as React.CSSProperties} />
                        <path d="M 120 70 L 250 55" fill="none" stroke="var(--color-red)" strokeWidth="1.5" className="flow-active-line" style={{ strokeDasharray: '4, 2' } as React.CSSProperties} />
                        <path d="M 390 50 L 532 50" fill="none" stroke="var(--color-green)" strokeWidth="3" className="flow-active-line" style={{ strokeDasharray: '8, 4' } as React.CSSProperties} />
                      </svg>
                    </div>

                    <div className="rds-inner-card-green" style={{ borderRadius: '8px', padding: '12px', fontSize: '12px', lineHeight: '1.5' }}>
                      🚀 <b>Proxy Connection Pooling Advantage:</b> Without proxy pooling, launching {proxyConcurrency} app connections opens {proxyConcurrency} direct TCP sockets, exhausting backend memory. With proxy multiplexing, connections are pooled down to just <b>{Math.max(10, Math.min(60, Math.round(proxyConcurrency * 0.05 + 8)))}</b> backend pipes!
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* Tab 7: Best-Practice Guides */}
          {activeSection === 'best' && (
            <div>
              <div className="rds-sec">Best-Practice Architecture, Security Chains &amp; Guides</div>
              <div className="rds-card">
                <div className="rds-subtabs">
                  <button className={`rds-subtb ${bestTab === 'arch' ? 'rds-on' : ''}`} onClick={() => setBestTab('arch')}>🏗️ Architecture Map</button>
                  <button className={`rds-subtb ${bestTab === 'sg' ? 'rds-on' : ''}`} onClick={() => setBestTab('sg')}>🔒 Firewall &amp; Security Rules</button>
                  <button className={`rds-subtb ${bestTab === 'proxy' ? 'rds-on' : ''}`} onClick={() => setBestTab('proxy')}>🔄 Connection Proxy Guides</button>
                  <button className={`rds-subtb ${bestTab === 'multiaz' ? 'rds-on' : ''}`} onClick={() => setBestTab('multiaz')}>🛡️ High Availability Comparison</button>
                  <button className={`rds-subtb ${bestTab === 'replicas' ? 'rds-on' : ''}`} onClick={() => setBestTab('replicas')}>📖 Replica Strategies</button>
                  <button className={`rds-subtb ${bestTab === 'checklist' ? 'rds-on' : ''}`} onClick={() => setBestTab('checklist')}>✅ Audit Checklist</button>
                </div>

                {bestTab === 'arch' && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-blue)' }}>
                      Production Grade {isAzure ? 'Azure Flexible Server' : isGcp ? 'Google Cloud SQL' : 'AWS RDS'} Topology Map
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                      High Availability Standby combined with scale-out Read Replicas and connection proxies in a private network layout.
                    </div>

                    <svg width="100%" viewBox="0 0 660 380" className="rds-svg-bg" style={{ display: 'block', borderRadius: '8px' }}>
                      <rect x="20" y="20" width="620" height="340" rx="10" fill="var(--rds-subnets-bg)" stroke="var(--rds-svg-line-stroke)" strokeWidth="1" />
                      <text x="330" y="40" textAnchor="middle" fontSize="11" fill="var(--color-text-tertiary)" fontWeight="bold">
                        {isAzure ? 'Azure VNet Network (Spanning 3 Zones)' : isGcp ? 'GCP VPC Network (Spanning 3 Zones)' : 'AWS VPC Network (Spanning 3 Zones)'}
                      </text>

                      <rect x="40" y="60" width="170" height="80" rx="6" fill="var(--rds-inner-card-bg)" stroke="#10b981" strokeWidth="1" />
                      <text x="125" y="80" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#064e3b">✍️ Primary Writer</text>
                      <text x="125" y="98" textAnchor="middle" fontSize="8" fill="#047857" fontFamily="monospace">Zone 1 (In-Service)</text>

                      <rect x="245" y="60" width="170" height="80" rx="6" fill="var(--rds-inner-card-bg)" stroke="#f59e0b" strokeWidth="1" />
                      <text x="330" y="80" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#78350f">🛡️ HA Standby</text>
                      <text x="330" y="98" textAnchor="middle" fontSize="8" fill="#b45309" fontFamily="monospace">Zone 2 (Sync Copy)</text>

                      <rect x="450" y="60" width="170" height="80" rx="6" fill="var(--rds-inner-card-bg)" stroke="#8b5cf6" strokeWidth="1" />
                      <text x="535" y="80" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#4c1d95">📖 Read Replica</text>
                      <text x="535" y="98" textAnchor="middle" fontSize="8" fill="#6d28d9" fontFamily="monospace">Zone 3 (Async Copy)</text>

                      <rect x="40" y="180" width="580" height="150" rx="8" fill="var(--rds-inner-card-bg)" stroke="var(--rds-inner-card-border)" strokeWidth="1" />
                      <text x="330" y="205" textAnchor="middle" fontSize="11" fontWeight="bold" className="rds-svg-text-primary">
                        🔒 Security Controls &amp; Management Layer
                      </text>
                      <text x="330" y="230" textAnchor="middle" fontSize="9.5" fill="var(--color-text-secondary)">
                        {isAzure ? 'Entra ID Auth • Key Vault CMEK • Automated Backups • Activity Logs' : isGcp ? 'Cloud IAM Auth • Cloud KMS CMEK • Continuous WAL Backups • Audit Logs' : 'IAM DB Auth • KMS Key Encryption • S3 WAL Backups • CloudTrail Logs'}
                      </text>
                    </svg>
                  </div>
                )}

                {bestTab === 'sg' && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-blue)' }}>Least-Privilege Security Rules Chain</div>
                    <div className="rds-row rds-inner-card-blue">
                      <div style={{ fontWeight: 600, minWidth: '90px' }}>🌐 App Gateway</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Inbound HTTPS 443 from public internet. Outbound restricted to app tier.</div>
                    </div>
                    <div className="rds-row rds-inner-card-green">
                      <div style={{ fontWeight: 600, minWidth: '90px' }}>⚙️ App Tier</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Inbound restricted to gateway. Outbound database port (5432/3306) restricted to proxy/database.</div>
                    </div>
                    <div className="rds-row rds-inner-card-amber">
                      <div style={{ fontWeight: 600, minWidth: '90px' }}>🗄️ DB Tier</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Inbound port restricted strictly to app/proxy tier security scope. Public access disabled.</div>
                    </div>
                  </div>
                )}

                {bestTab === 'proxy' && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-blue)' }}>Connection Proxy Advantages</div>
                    <ul className="rds-ck">
                      <li><b>Survive Failovers:</b> Applications maintain proxy connections during database zone failovers without dropping client sessions.</li>
                      <li><b>Thread Pooling:</b> Multiplexes high-concurrency connection spikes down to small, stable backend database thread pools.</li>
                      <li><b>Secrets Rotation:</b> Integrates with cloud secret management to handle credential rotation transparently.</li>
                    </ul>
                  </div>
                )}

                {bestTab === 'multiaz' && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-amber)' }}>High Availability Standby Mechanics</div>
                    <ul className="rds-ck">
                      <li><b>Synchronous Replication:</b> Transactions commit to both primary and standby nodes before acknowledging success.</li>
                      <li><b>Automatic Failover:</b> High availability monitors detect primary node faults and initiate failovers within 30-60s.</li>
                    </ul>
                  </div>
                )}

                {bestTab === 'replicas' && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-purple)' }}>Read Replica Scaling Strategies</div>
                    <ul className="rds-ck">
                      <li><b>Offload Read Load:</b> Route reporting queries and read-only traffic away from the primary writer.</li>
                      <li><b>Async WAL Streaming:</b> Log-based replication keeps replicas updated with low latency.</li>
                    </ul>
                  </div>
                )}

                {bestTab === 'checklist' && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-green)' }}>Database Security Audit Checklist</div>
                    <ul className="rds-ck">
                      <li>Public Access Disabled (Private Endpoint / Private IP active)</li>
                      <li>KMS / Key Vault Encryption at Rest Enabled</li>
                      <li>SSL/TLS Data-in-Transit Enforcement ON</li>
                      <li>IAM / Entra ID Database Authentication Configured</li>
                      <li>Automated Backups &amp; Point-in-Time Recovery Active</li>
                    </ul>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 8: VISUAL ARCHITECT NOTES & THEORIES (HUMANIZED & SORTED)             */}
          {/* ========================================================================= */}
          {activeSection === 'notebook' && (
            <div className="space-y-6 animate-fadeIn text-left" style={{ color: 'var(--color-text-primary)' }}>
              
              {/* Header Hero Card */}
              <div className="card text-left" style={{ borderLeft: '4px solid #0284c7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 font-display">
                      <BookOpen className="w-5 h-5 text-sky-600" /> Relational Database (RDS &amp; Aurora) Notes &amp; Mental Models
                    </h2>
                    <p className="text-xs mt-1.5 leading-relaxed font-sans font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      Simplified, beginner-friendly relational database theories sorted progressively from managed fundamentals to synchronous Multi-AZ failovers, read scaling, cloud-native Aurora storage, and PITR backups with everyday real-world analogies.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className="acad-hero-badge" style={{ background: '#e0f2fe', borderColor: '#7dd3fc', color: '#0369a1' }}>🎓 Beginner to Pro</span>
                    <span className="acad-hero-badge" style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#b45309' }}>💡 Real-World Mental Models</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Sidebar Category Explorer */}
                <div className="lg:col-span-3 space-y-4 text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest block pl-1 font-mono" style={{ color: 'var(--color-text-tertiary)' }}>Curriculum Directory:</span>
                  
                  <div className="acad-dir-container">
                    <div className="acad-dir-header">
                      <Database className="w-4 h-4 text-sky-600" />
                      <span>Database Modules</span>
                    </div>

                    {/* LEVEL 1: RDS FUNDAMENTALS */}
                    <div>
                      <button 
                        onClick={() => setExpandedCategory(expandedCategory === 'rds_fundamentals' ? '' : 'rds_fundamentals')}
                        className="acad-dir-folder-btn"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-sky-500" />
                          🐣 Level 1 · Fundamentals
                        </span>
                        {expandedCategory === 'rds_fundamentals' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      {expandedCategory === 'rds_fundamentals' && (
                        <div className="py-1 font-semibold" style={{ background: 'var(--color-background-primary)', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                          <button 
                            onClick={() => setSelectedNote('rds_what_is')}
                            className={`acad-dir-item-btn ${selectedNote === 'rds_what_is' ? 'acad-active' : ''}`}
                          >
                            1.1 What is Managed RDS? (Apartment Handyman)
                          </button>
                          <button 
                            onClick={() => setSelectedNote('engine_selection')}
                            className={`acad-dir-item-btn ${selectedNote === 'engine_selection' ? 'acad-active' : ''}`}
                          >
                            1.2 Engine Comparison (Vehicle Types)
                          </button>
                          <button 
                            onClick={() => setSelectedNote('subnet_groups_vpc')}
                            className={`acad-dir-item-btn ${selectedNote === 'subnet_groups_vpc' ? 'acad-active' : ''}`}
                          >
                            1.3 Subnet Groups &amp; VPC Security (Bank Vault)
                          </button>
                        </div>
                      )}
                    </div>

                    {/* LEVEL 2: HIGH AVAILABILITY */}
                    <div>
                      <button 
                        onClick={() => setExpandedCategory(expandedCategory === 'high_availability' ? '' : 'high_availability')}
                        className="acad-dir-folder-btn"
                      >
                        <span className="flex items-center gap-1.5">
                          <Shield className="w-3.5 h-3.5 text-emerald-500" />
                          🛡️ Level 2 · High Availability
                        </span>
                        {expandedCategory === 'high_availability' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      {expandedCategory === 'high_availability' && (
                        <div className="py-1 font-semibold" style={{ background: 'var(--color-background-primary)', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                          <button 
                            onClick={() => setSelectedNote('multiaz_synchronous')}
                            className={`acad-dir-item-btn ${selectedNote === 'multiaz_synchronous' ? 'acad-active' : ''}`}
                          >
                            2.1 Multi-AZ Failover (Cockpit Co-Pilot)
                          </button>
                          <button 
                            onClick={() => setSelectedNote('multiaz_readable_clusters')}
                            className={`acad-dir-item-btn ${selectedNote === 'multiaz_readable_clusters' ? 'acad-active' : ''}`}
                          >
                            2.2 Multi-AZ with 2 Readable Standbys
                          </button>
                        </div>
                      )}
                    </div>

                    {/* LEVEL 3: READ SCALING */}
                    <div>
                      <button 
                        onClick={() => setExpandedCategory(expandedCategory === 'read_scaling' ? '' : 'read_scaling')}
                        className="acad-dir-folder-btn"
                      >
                        <span className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-indigo-500" />
                          📖 Level 3 · Read Scaling
                        </span>
                        {expandedCategory === 'read_scaling' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      {expandedCategory === 'read_scaling' && (
                        <div className="py-1 font-semibold" style={{ background: 'var(--color-background-primary)', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                          <button 
                            onClick={() => setSelectedNote('read_replicas_scaling')}
                            className={`acad-dir-item-btn ${selectedNote === 'read_replicas_scaling' ? 'acad-active' : ''}`}
                          >
                            3.1 Read Replicas (Chef vs Waiters)
                          </button>
                          <button 
                            onClick={() => setSelectedNote('replica_promotion_dr')}
                            className={`acad-dir-item-btn ${selectedNote === 'replica_promotion_dr' ? 'acad-active' : ''}`}
                          >
                            3.2 Replica Promotion &amp; Cross-Region DR
                          </button>
                        </div>
                      )}
                    </div>

                    {/* LEVEL 4: AURORA ARCHITECTURE */}
                    <div>
                      <button 
                        onClick={() => setExpandedCategory(expandedCategory === 'aurora_arch' ? '' : 'aurora_arch')}
                        className="acad-dir-folder-btn"
                      >
                        <span className="flex items-center gap-1.5">
                          <Cloud className="w-3.5 h-3.5 text-purple-500" />
                          🌌 Level 4 · Aurora Cloud-Native
                        </span>
                        {expandedCategory === 'aurora_arch' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      {expandedCategory === 'aurora_arch' && (
                        <div className="py-1 font-semibold" style={{ background: 'var(--color-background-primary)', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                          <button 
                            onClick={() => setSelectedNote('aurora_storage_engine')}
                            className={`acad-dir-item-btn ${selectedNote === 'aurora_storage_engine' ? 'acad-active' : ''}`}
                          >
                            4.1 Distributed Storage (Shared Google Doc)
                          </button>
                          <button 
                            onClick={() => setSelectedNote('aurora_global_cloning')}
                            className={`acad-dir-item-btn ${selectedNote === 'aurora_global_cloning' ? 'acad-active' : ''}`}
                          >
                            4.2 Global Database &amp; Fast Clones
                          </button>
                        </div>
                      )}
                    </div>

                    {/* LEVEL 5: BACKUPS & OPTIMIZATION */}
                    <div>
                      <button 
                        onClick={() => setExpandedCategory(expandedCategory === 'backups_opt' ? '' : 'backups_opt')}
                        className="acad-dir-folder-btn"
                      >
                        <span className="flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                          🚀 Level 5 · Backups &amp; Proxy
                        </span>
                        {expandedCategory === 'backups_opt' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      {expandedCategory === 'backups_opt' && (
                        <div className="py-1 font-semibold" style={{ background: 'var(--color-background-primary)' }}>
                          <button 
                            onClick={() => setSelectedNote('backups_pitr')}
                            className={`acad-dir-item-btn ${selectedNote === 'backups_pitr' ? 'acad-active' : ''}`}
                          >
                            5.1 Backups &amp; PITR (DVR Time Machine)
                          </button>
                          <button 
                            onClick={() => setSelectedNote('rds_proxy_pooling')}
                            className={`acad-dir-item-btn ${selectedNote === 'rds_proxy_pooling' ? 'acad-active' : ''}`}
                          >
                            5.2 RDS Proxy (Nightclub Bouncer)
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                  <div className="acad-advice-box rounded-2xl p-4 text-[11px] leading-relaxed font-semibold space-y-1">
                    <span className="font-extrabold flex items-center gap-1.5 mb-1 text-[11.5px]" style={{ color: 'var(--color-text-primary)' }}>
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Interactive Quick-Launch
                    </span>
                    Click any topic to reveal beginner-friendly mental models, real-world analogies, interactive widgets, and instant simulator links!
                  </div>
                </div>

                {/* Right Active Note Workspace */}
                <div className="lg:col-span-9 space-y-6 text-left">

                  {/* NOTE 1.1: WHAT IS MANAGED RDS */}
                  {selectedNote === 'rds_what_is' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🐣 Level 1 · Fundamentals</span>
                          <h3 className="text-xl font-black mt-2 font-display">1.1 What is Amazon RDS? (The Managed Database Service)</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveSection('overview')}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                          >
                            <Zap className="w-3.5 h-3.5" /> Open Concept Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> Amazon RDS (Relational Database Service) is a <strong>fully managed database service</strong>. Instead of manually buying servers, installing Linux, configuring PostgreSQL or MySQL, scheduling daily backup cron jobs, and patching security vulnerabilities yourself on EC2, AWS takes care of all the server maintenance so you can focus 100% on writing SQL queries and building your app.
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Full-Service Luxury Apartment vs Buying an Empty House
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          • <strong>Self-Managed Database on EC2 (Buying an Empty House)</strong>: If a pipe bursts (hard drive fails), you have to fix the plumbing yourself. If the roof leaks (OS security bug), you have to climb the ladder and patch it. If you need more rooms (storage full), you have to hire contractors and take down walls manually.
                          <br />• <strong>Managed RDS (Luxury Concierge Condo)</strong>: The building maintenance staff automatically fixes broken pipes, security guards protect the building, and if you need a bigger apartment, the manager upgrades your unit with one click!
                        </p>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '18px 0 10px' }}>The 4 Core Superpowers of Managed RDS</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                        <div className="acad-flow-step">
                          <RefreshCw style={{ width: '20px', height: '20px', color: 'var(--color-blue)', flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: 'var(--color-text-primary)' }}>1. Automated Patching</strong>
                            <span style={{ fontSize: '10.5px' }}>Security patches and engine minor updates apply automatically during your maintenance window.</span>
                          </div>
                        </div>
                        <div className="acad-flow-step">
                          <Shield style={{ width: '20px', height: '20px', color: 'var(--color-green)', flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: 'var(--color-text-primary)' }}>2. Point-in-Time Recovery</strong>
                            <span style={{ fontSize: '10.5px' }}>Continuous transaction log backups allow 1-second precision rollbacks up to 35 days in the past.</span>
                          </div>
                        </div>
                        <div className="acad-flow-step">
                          <Layers style={{ width: '20px', height: '20px', color: 'var(--color-purple)', flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: 'var(--color-text-primary)' }}>3. 1-Click Multi-AZ HA</strong>
                            <span style={{ fontSize: '10.5px' }}>Synchronous physical standby in a second datacenter with automatic 60-second DNS failover.</span>
                          </div>
                        </div>
                        <div className="acad-flow-step">
                          <HardDrive style={{ width: '20px', height: '20px', color: 'var(--color-orange)', flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: 'var(--color-text-primary)' }}>4. Storage Auto-Scaling</strong>
                            <span style={{ fontSize: '10.5px' }}>EBS storage automatically grows up to 64 TiB with zero database downtime or lockouts.</span>
                          </div>
                        </div>
                      </div>

                      {/* Gotcha Warning */}
                      <div className="acad-gotcha-box">
                        <strong>⚠️ Crucial Beginner Rule: No Direct SSH / Root Operating System Access</strong>
                        <p style={{ margin: '4px 0 0' }}>
                          Because RDS is a managed service, AWS manages the underlying operating system. You connect to RDS using standard database clients (like <code>psql</code>, <code>mysql</code>, or DBeaver) over standard database ports, but you <strong>cannot SSH into the virtual machine</strong> or access root bash commands!
                        </p>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                        <button 
                          onClick={() => setActiveSection('overview')}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <Zap className="w-3.5 h-3.5" /> Explore Supported Engines &amp; Specs
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 1.2: ENGINE SELECTION */}
                  {selectedNote === 'engine_selection' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🐣 Level 1 · Fundamentals</span>
                          <h3 className="text-xl font-black mt-2 font-display">1.2 Database Engine Comparison (Choosing the Right Tool)</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveSection('overview')}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                          >
                            <Zap className="w-3.5 h-3.5" /> Go to Engines Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> RDS supports 6 major relational database engines. Picking the right engine depends on your application needs, licensing budget, and performance requirements.
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Choosing the Right Vehicle for the Job
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          • <strong>PostgreSQL (The Swiss Army Knife 4x4)</strong>: Can handle highway driving (standard SQL), heavy cargo (JSON documents), mountain trails (GIS maps), and AI vector search (pgvector).
                          <br />• <strong>MySQL / MariaDB (The Popular Commuter Sedan)</strong>: Reliable, low cost, easy to maintain, and powers the vast majority of web applications worldwide.
                          <br />• <strong>Amazon Aurora (The Formula 1 Supersonic Racecar)</strong>: Custom-engineered for extreme speed, delivering up to 5x higher throughput with distributed cloud-native storage.
                          <br />• <strong>Oracle &amp; SQL Server (The Armored Corporate Limousines)</strong>: Heavy, high enterprise license fees, built for legacy corporate software and Active Directory compliance.
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="acad-table">
                          <thead>
                            <tr>
                              <th>Engine</th>
                              <th>Port</th>
                              <th>Max Storage</th>
                              <th>Read Replicas</th>
                              <th>Best Used For</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>🐘 PostgreSQL</strong></td>
                              <td><code>5432</code></td>
                              <td>64 TiB</td>
                              <td>Up to 15 (WAL)</td>
                              <td>Modern web apps, JSON data, pgvector AI similarity, PostGIS</td>
                            </tr>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>🐬 MySQL</strong></td>
                              <td><code>3306</code></td>
                              <td>64 TiB</td>
                              <td>Up to 15 (Binlog)</td>
                              <td>E-commerce carts, WordPress, LAMP web stacks, high concurrency</td>
                            </tr>
                            <tr>
                              <td><strong className="text-purple font-bold">🌌 Amazon Aurora ⭐</strong></td>
                              <td><code>5432 / 3306</code></td>
                              <td>128 TiB (Auto)</td>
                              <td>Up to 15 (&lt;10ms lag)</td>
                              <td>High-throughput enterprise workloads, 5x standard performance</td>
                            </tr>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>🪟 Microsoft SQL Server</strong></td>
                              <td><code>1433</code></td>
                              <td>64 TiB</td>
                              <td>AlwaysOn AG (Multi-AZ)</td>
                              <td>Enterprise .NET backends, Windows Active Directory environments</td>
                            </tr>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>🔶 Oracle DB</strong></td>
                              <td><code>1521</code></td>
                              <td>64 TiB</td>
                              <td>Active Data Guard</td>
                              <td>Core banking, enterprise ERP systems, legacy corporate migrations</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* NOTE 1.3: SUBNET GROUPS & VPC */}
                  {selectedNote === 'subnet_groups_vpc' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🐣 Level 1 · Fundamentals</span>
                          <h3 className="text-xl font-black mt-2 font-display">1.3 DB Subnet Groups &amp; VPC Security Shield</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveSection('connect')}
                            className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                          >
                            <Network className="w-3.5 h-3.5" /> Go to Connectivity Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> A <strong>DB Subnet Group</strong> is a bundle of private VPC subnets spanning at least 2 distinct Availability Zones. Databases must <strong>never have a Public IP address</strong>—they live strictly inside private subnets and only accept inbound traffic from your application servers.
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Bank Vault in the Underground Basement
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          You would never build a bank vault on the public sidewalk with a glass front door! Instead, you place the vault in the <strong>restricted underground basement (Private Subnets)</strong>. The only way inside is through the bank teller counter (EC2 Web Servers) who check your security ID badge (Security Group rules) before retrieving money from the vault!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>3-Tier Defense-in-Depth Pipeline:</h4>
                          
                          <div className="space-y-2 font-mono text-[10.5px]">
                            <div className="p-2 rounded" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                              <p className="font-bold text-blue">Tier 1: Public Subnet (ALB)</p>
                              <span>Accepts Port 443 HTTPS from the public Internet.</span>
                            </div>
                            <div className="p-2 rounded" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                              <p className="font-bold text-green">Tier 2: Private App Subnet (EC2)</p>
                              <span>Accepts Port 80/8080 traffic ONLY from the ALB Security Group.</span>
                            </div>
                            <div className="p-2 rounded" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                              <p className="font-bold text-purple">Tier 3: Private Data Subnet (RDS)</p>
                              <span>Accepts Port 5432/3306 ONLY from the EC2 App Security Group!</span>
                            </div>
                          </div>

                          <div className="acad-takeaway-box">
                            <strong>💡 Pro Security Rule:</strong> Set <code>PubliclyAccessible = false</code> and configure the RDS Security Group Inbound Rule to authorize <code>sg-app-servers</code> by Security Group ID instead of IP ranges!
                          </div>
                        </div>

                        <div className="asg-card p-4 rounded-xl flex flex-col justify-center text-center">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-tertiary)' }}>Multi-AZ Subnet Group Architecture</span>
                          
                          <div className="space-y-2 font-mono text-[10px] text-left">
                            <div className="p-2.5 rounded-lg flex items-center justify-between" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                              <span className="text-orange font-bold">us-east-1a (Private Subnet 1)</span>
                              <span className="text-green font-bold">Primary Writer (10.0.10.5)</span>
                            </div>
                            <div className="p-2.5 rounded-lg flex items-center justify-between" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                              <span className="text-blue font-bold">us-east-1b (Private Subnet 2)</span>
                              <span className="text-blue font-bold">Multi-AZ Standby (10.0.20.8)</span>
                            </div>
                            <div className="p-2.5 rounded-lg flex items-center justify-between" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                              <span className="text-purple font-bold">us-east-1c (Private Subnet 3)</span>
                              <span className="text-purple font-bold">Read Replica 1 (10.0.30.12)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NOTE 2.1: MULTI-AZ SYNCHRONOUS FAILOVER */}
                  {selectedNote === 'multiaz_synchronous' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🛡️ Level 2 · High Availability</span>
                          <h3 className="text-xl font-black mt-2 font-display">2.1 Multi-AZ Synchronous Failover (Disaster Recovery)</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveSection('multiaz')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                          >
                            <Shield className="w-3.5 h-3.5" /> Go to High Availability Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> Enabling Multi-AZ creates a <strong>synchronous physical clone</strong> of your database in a completely different physical data center building. Every write transaction is committed to both zones simultaneously. If lightning strikes the primary zone, AWS automatically redirects your database DNS endpoint to the standby in under 60 seconds with <strong>zero data loss</strong>!
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Co-Pilot in the Airplane Cockpit
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          While Captain Primary flies the plane and writes into the flight log, Co-Pilot Standby records every entry simultaneously in real time. If Captain Primary suddenly faints (datacenter outage or hardware crash), Co-Pilot Standby grabs the controls in 60 seconds and continues flying the plane smoothly without dropping altitude or losing a single flight log entry!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>Multi-AZ Automatic Failover Sequence:</h4>
                          
                          <ol className="list-decimal pl-4 space-y-2">
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>1. Primary Outage Detected:</strong> AWS automated health probes detect unresponsiveness in Zone A.</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>2. Promote Standby:</strong> Standby database in Zone B is promoted to primary read-write status.</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>3. DNS CNAME Flip:</strong> Database endpoint (e.g. <code>db.xyz.us-east-1.rds.amazonaws.com</code>) is updated to point to Zone B's IP.</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>4. Auto-Rebuild:</strong> Once Zone A recovers, RDS provisions a new standby in Zone A to restore redundancy.</li>
                          </ol>

                          <div className="acad-gotcha-box">
                            <strong>⚠️ Critical Exam &amp; Production Fact:</strong>
                            <p style={{ margin: '4px 0 0' }}>
                              In standard RDS Multi-AZ, the Standby instance is <strong>INACTIVE and CANNOT be queried</strong>! It does NOT offload read traffic. To query backup nodes, use <em>Multi-AZ DB Clusters with 2 Readable Standbys</em> or <em>Read Replicas</em>.
                            </p>
                          </div>
                        </div>

                        <div className="asg-card p-4 rounded-xl flex flex-col justify-center text-center">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-tertiary)' }}>Synchronous Replication Cycle</span>
                          
                          <div className="space-y-2 font-mono text-[10px] text-left">
                            <div className="p-2.5 rounded-lg flex items-center justify-between" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #86efac' }}>
                              <span className="text-green font-bold">1. App writes SQL INSERT</span>
                              <span className="text-green font-bold">Primary AZ-1a</span>
                            </div>
                            <div className="p-2.5 rounded-lg flex items-center justify-between" style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid #7dd3fc' }}>
                              <span className="text-blue font-bold">2. Synchronous Storage Replication</span>
                              <span className="text-blue font-bold">Standby AZ-1b</span>
                            </div>
                            <div className="p-2.5 rounded-lg flex items-center justify-between" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                              <span className="font-bold">3. ACK returned to Application</span>
                              <span className="text-green font-bold">Commit Complete</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NOTE 2.2: MULTI-AZ READABLE CLUSTERS */}
                  {selectedNote === 'multiaz_readable_clusters' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🛡️ Level 2 · High Availability</span>
                          <h3 className="text-xl font-black mt-2 font-display">2.2 Multi-AZ with 2 Readable Standbys (Active-Active Scaling)</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveSection('multiaz')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                          >
                            <Shield className="w-3.5 h-3.5" /> Go to High Availability Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> Multi-AZ DB Clusters provide <strong>1 Primary Writer + 2 Readable Standbys across 3 separate Availability Zones</strong>. Unlike standard Multi-AZ, the two standbys are active and serve read-only queries, while local NVMe SSD storage delivers up to 2x faster commit speeds (&lt;35ms)!
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Two Backup Pilots Who Also Assist Passengers
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          Instead of having an emergency co-pilot who sits silently in the corner doing nothing, the airline has two fully qualified co-pilots who serve refreshments and help passengers during normal flight, but are ready to take control of the airplane in under 35 seconds if needed!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>Key Architectural Advantages:</h4>
                          
                          <ul className="list-disc pl-4 space-y-2">
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Sub-35ms Commit Latency:</strong> Uses local NVMe SSD storage for lightning-fast write transactions.</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Readable Standby Endpoints:</strong> Route reporting, dashboard, and analytical queries to standbys via the Reader Endpoint.</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>35-Second Failovers:</strong> Zero-downtime failovers that are 2x faster than traditional Multi-AZ.</li>
                          </ul>

                          <div className="acad-takeaway-box">
                            <strong>💡 Engine Support:</strong> Available for MySQL 8.0+ and PostgreSQL 13.4+ on Amazon RDS.
                          </div>
                        </div>

                        <div className="asg-card p-4 rounded-xl flex flex-col justify-center text-center font-mono text-xs">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-tertiary)' }}>3-AZ Cluster Topology</span>
                          
                          <div className="space-y-2 text-left text-[10.5px]">
                            <div className="p-2 rounded flex justify-between items-center" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #86efac' }}>
                              <span className="text-green font-bold">AZ-1a: Primary Writer</span>
                              <span className="text-green font-bold">Read / Write</span>
                            </div>
                            <div className="p-2 rounded flex justify-between items-center" style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid #7dd3fc' }}>
                              <span className="text-blue font-bold">AZ-1b: Readable Standby 1</span>
                              <span className="text-blue font-bold">Read-Only</span>
                            </div>
                            <div className="p-2 rounded flex justify-between items-center" style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid #c084fc' }}>
                              <span className="text-purple font-bold">AZ-1c: Readable Standby 2</span>
                              <span className="text-purple font-bold">Read-Only</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NOTE 3.1: READ REPLICAS & ASYNC WAL */}
                  {selectedNote === 'read_replicas_scaling' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">📖 Level 3 · Read Scaling</span>
                          <h3 className="text-xl font-black mt-2 font-display">3.1 Read Replicas &amp; Async WAL Streaming</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveSection('replicas')}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                          >
                            <Activity className="w-3.5 h-3.5" /> Go to Read Scaling Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> In most web applications, <strong>80% to 90% of all database queries are Reads</strong> (browsing products, viewing feeds, running analytical reports). <strong>Read Replicas</strong> allow you to create up to 15 read-only copies of your database to offload query load from the primary writer.
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Master Chef Cooking vs Waiters Handing Out Menus
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          If the Master Chef (Primary Writer) had to stop cooking every time 50 diners asked to see the dessert menu (SELECT queries), the kitchen would crash with huge delays! Instead, the chef focuses 100% on cooking the food (Writes), while 4 waiters distribute printed copies of the menu to all tables (Read Replicas).
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Interactive Read/Write TPS Simulator HUD */}
                        <div className="asg-card p-4 rounded-xl space-y-3">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block" style={{ color: 'var(--color-text-tertiary)' }}>Interactive Read Scaling Load Calculator</span>
                          
                          <div className="space-y-2 text-xs">
                            <div>
                              <div className="flex justify-between font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                <span>Total App TPS: {nbTpsSimulation} queries/sec</span>
                              </div>
                              <input 
                                type="range" 
                                min="100" 
                                max="2000" 
                                step="50"
                                value={nbTpsSimulation} 
                                onChange={(e) => setNbTpsSimulation(parseInt(e.target.value))}
                                className="accent-indigo-600 w-full"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                <span>Read vs Write Ratio: {nbReadRatio}% Reads / {100 - nbReadRatio}% Writes</span>
                              </div>
                              <input 
                                type="range" 
                                min="50" 
                                max="95" 
                                value={nbReadRatio} 
                                onChange={(e) => setNbReadRatio(parseInt(e.target.value))}
                                className="accent-indigo-600 w-full"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                <span>Active Read Replicas: {nbReplicaCount} nodes</span>
                              </div>
                              <input 
                                type="range" 
                                min="1" 
                                max="10" 
                                value={nbReplicaCount} 
                                onChange={(e) => setNbReplicaCount(parseInt(e.target.value))}
                                className="accent-indigo-600 w-full"
                              />
                            </div>
                          </div>

                          <div className="p-3 rounded-lg font-mono text-[10.5px] space-y-1" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                            <p>Writer Load (Writes only): <span className="text-orange font-bold font-semibold">{Math.round(nbTpsSimulation * ((100 - nbReadRatio) / 100))} TPS</span></p>
                            <p>Offloaded Read Load: <span className="text-blue font-bold font-semibold">{Math.round(nbTpsSimulation * (nbReadRatio / 100))} TPS</span></p>
                            <p>Load Per Replica: <span className="text-green font-bold font-semibold">{Math.round((nbTpsSimulation * (nbReadRatio / 100)) / nbReplicaCount)} TPS / node</span></p>
                          </div>
                        </div>

                        <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>Asynchronous Replication &amp; Lag:</h4>
                          <p className="leading-relaxed">
                            Read Replicas use <strong>Asynchronous Replication</strong> (streaming PostgreSQL WAL logs or MySQL Binary Logs). The master does NOT wait for replicas before confirming transactions.
                          </p>

                          <div className="acad-gotcha-box">
                            <strong>⚠️ The Replication Lag Gotcha (Eventual Consistency):</strong>
                            <p style={{ margin: '4px 0 0' }}>
                              If a user updates their profile picture and immediately refreshes their feed from a lagging Read Replica, they might see the old picture for 200 milliseconds until the replica catches up! For strict consistency, read immediately-updated data from the Primary.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NOTE 3.2: REPLICA PROMOTION & DR */}
                  {selectedNote === 'replica_promotion_dr' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">📖 Level 3 · Read Scaling</span>
                          <h3 className="text-xl font-black mt-2 font-display">3.2 Read Replica Promotion &amp; Cross-Region DR</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveSection('replicas')}
                            className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                          >
                            <Activity className="w-3.5 h-3.5" /> Go to Read Scaling Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> You can take any Read Replica and <strong>promote it into an independent read-write database</strong>. Cross-Region Read Replicas also serve as the ultimate Disaster Recovery shield against entire AWS datacenter regional blackouts.
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Promoting the Vice President to President During an Emergency
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          If a company president (Primary in US-East) becomes unavailable due to a hurricane, the Vice President located safely in Europe (Cross-Region Read Replica in EU-West) is immediately sworn into office (Promoted) to make executive decisions and keep the entire company running without interruption!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>Top 3 Use Cases for Replica Promotion:</h4>
                          
                          <ol className="list-decimal pl-4 space-y-2">
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Cross-Region Disaster Recovery:</strong> Failover to a secondary region (e.g. <code>us-east-1</code> &rarr; <code>eu-west-1</code>) during catastrophic regional outages.</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Zero-Downtime Major Engine Upgrades:</strong> Upgrade a replica to a new major PostgreSQL version (e.g. v14 &rarr; v16), test thoroughly, and promote to become the new primary master.</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Staging &amp; Testing Sandboxes:</strong> Promote a replica into a standalone staging database to run heavy destructive load tests on real production data with zero risk to live customers.</li>
                          </ol>
                        </div>

                        <div className="asg-card p-4 rounded-xl flex flex-col justify-center text-center font-mono text-xs">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-tertiary)' }}>Cross-Region Replication Topology</span>
                          
                          <div className="space-y-2 text-left">
                            <div className="p-2.5 rounded-lg flex items-center justify-between" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                              <span className="text-orange font-bold">us-east-1 (N. Virginia)</span>
                              <span className="text-green font-bold">Primary Master (Writes)</span>
                            </div>
                            <div className="p-2.5 rounded-lg flex items-center justify-between" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                              <span className="text-blue font-bold">eu-west-1 (Ireland)</span>
                              <span className="text-blue font-bold">Cross-Region Replica (&lt;1s Lag)</span>
                            </div>
                            <div className="p-2.5 rounded-lg flex items-center justify-between" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                              <span className="text-purple font-bold">ap-northeast-1 (Tokyo)</span>
                              <span className="text-purple font-bold">Cross-Region Replica (&lt;1s Lag)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NOTE 4.1: AURORA STORAGE ENGINE */}
                  {selectedNote === 'aurora_storage_engine' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🌌 Level 4 · Aurora Cloud-Native</span>
                          <h3 className="text-xl font-black mt-2 font-display">4.1 Aurora Distributed Storage Virtualization</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveSection('sim')}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                          >
                            <Zap className="w-3.5 h-3.5" /> Go to Simulator
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> Traditional databases attach a single virtual hard drive (EBS volume) to a single database server. Amazon Aurora completely redesigns this by <strong>decoupling compute from storage</strong>. Aurora storage is a distributed, auto-healing storage fleet that automatically replicates database records <strong>6 ways across 3 separate Availability Zones</strong>.
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: A Shared Live Google Doc vs Emailing Word Attachments
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          • <strong>Standard RDS (Emailing Word Attachments)</strong>: When you want to save a change, you have to write the entire heavy document to disk and email the 50MB file to backup replicas.
                          <br />• <strong>Aurora (Shared Live Cloud Google Doc)</strong>: Up to 15 team members can view the document simultaneously. The database engine never writes heavy disk pages—it only streams tiny, lightweight keystrokes (redo log records) across 100 Gbps cloud networks, making it 5x faster!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>The 4/6 Write &amp; 3/6 Read Quorum System:</h4>
                          <p className="leading-relaxed">
                            Every 10 GB storage chunk is duplicated 6 times (2 copies in AZ-A, 2 in AZ-B, 2 in AZ-C).
                          </p>
                          <ul className="list-disc pl-4 space-y-1.5">
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Write Quorum (4 of 6):</strong> A write is confirmed as soon as 4 out of 6 storage nodes acknowledge receipt. Even if 2 nodes are down, writes continue smoothly!</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Read Quorum (3 of 6):</strong> Aurora can sustain the total loss of an entire Availability Zone + 1 additional node (3 nodes down) without losing read availability!</li>
                          </ul>

                          <div className="acad-takeaway-box">
                            <strong>💡 Auto-Healing:</strong> If a storage disk suffers bit-rot or failure, Aurora automatically heals the corrupted block in the background by copying healthy segments from the other 5 copies!
                          </div>
                        </div>

                        <div className="asg-card p-4 rounded-xl flex flex-col justify-center text-center font-mono text-xs">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-tertiary)' }}>6-Way Storage Quorum Visualizer</span>
                          
                          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                            <div className="p-2 rounded" style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid #7dd3fc' }}>
                              <p className="font-bold text-blue">AZ-A (2 copies)</p>
                              <span>Disk 1 &bull; Disk 2</span>
                            </div>
                            <div className="p-2 rounded" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #86efac' }}>
                              <p className="font-bold text-green">AZ-B (2 copies)</p>
                              <span>Disk 3 &bull; Disk 4</span>
                            </div>
                            <div className="p-2 rounded" style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid #c084fc' }}>
                              <p className="font-bold text-purple">AZ-C (2 copies)</p>
                              <span>Disk 5 &bull; Disk 6</span>
                            </div>
                          </div>

                          <p className="text-[10px] mt-4 leading-normal" style={{ color: 'var(--color-text-secondary)' }}>
                            Storage auto-expands from 10 GB up to 128 TiB dynamically in 10 GB increments. You only pay for the exact storage you write.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NOTE 4.2: AURORA GLOBAL & CLONING */}
                  {selectedNote === 'aurora_global_cloning' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🌌 Level 4 · Aurora Cloud-Native</span>
                          <h3 className="text-xl font-black mt-2 font-display">4.2 Aurora Global Database &amp; Fast Database Cloning</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveSection('advanced')}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                          >
                            <Zap className="w-3.5 h-3.5" /> Go to Advanced Features
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> <strong>Aurora Global Database</strong> spans across up to 5 global AWS regions with storage replication latency under 1 second. <strong>Fast Database Cloning</strong> creates a complete, isolated copy of a 20 Terabyte database in 15 seconds for testing with zero storage cost until you write new data!
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Bookmark Pointers vs Photocopying 10,000 Pages
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          If you want to give a 10,000-page book to a colleague to edit, traditional databases make you stand at the copy machine for 4 hours photocopying every page (slow &amp; wastes paper). Aurora Fast Clone simply places a bookmark pointer pointing to the original pages (<strong>Copy-on-Write</strong>). When your colleague edits page 42, Aurora only stores the new page 42—saving you hours of time and 99% on storage costs!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>Superpowers of Aurora Global &amp; Clones:</h4>
                          
                          <ul className="list-disc pl-4 space-y-2">
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Under 1-Second Global Replication:</strong> Storage-level dedicated network replication across 5 AWS regions with zero performance penalty on the primary writer.</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>1-Minute Cross-Region Disaster Recovery:</strong> If a primary region suffers a total disaster, promote a secondary region in &lt;1 minute with zero data loss ($RPO &lt; 1s$).</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Instant Sandbox CI/CD Environments:</strong> Spin up fresh 50TB database clones in seconds to run automated end-to-end integration tests.</li>
                          </ul>
                        </div>

                        <div className="asg-card p-4 rounded-xl flex flex-col justify-center text-center font-mono text-xs">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-tertiary)' }}>Aurora Global Cluster Architecture</span>
                          
                          <div className="space-y-2 text-left text-[10.5px]">
                            <div className="p-2.5 rounded-lg flex items-center justify-between" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #86efac' }}>
                              <span className="text-green font-bold">us-east-1 (Primary Region)</span>
                              <span className="text-green font-bold">Read / Write Leader</span>
                            </div>
                            <div className="p-2.5 rounded-lg flex items-center justify-between" style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid #7dd3fc' }}>
                              <span className="text-blue font-bold">eu-central-1 (Frankfurt)</span>
                              <span className="text-blue font-bold">Global Replica (&lt;800ms)</span>
                            </div>
                            <div className="p-2.5 rounded-lg flex items-center justify-between" style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid #c084fc' }}>
                              <span className="text-purple font-bold">ap-southeast-1 (Singapore)</span>
                              <span className="text-purple font-bold">Global Replica (&lt;900ms)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NOTE 5.1: BACKUPS & PITR */}
                  {selectedNote === 'backups_pitr' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🚀 Level 5 · Backups &amp; Proxy</span>
                          <h3 className="text-xl font-black mt-2 font-display">5.1 Automated Backups &amp; Point-in-Time Recovery (PITR)</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveSection('advanced')}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> Go to Advanced Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> RDS continuously streams transaction logs (WAL) to Amazon S3 alongside daily automated volume snapshots. This enables <strong>Point-in-Time Recovery (PITR)</strong> down to the exact second so you can recover from accidental deletions or corrupted data.
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The DVR Security Camera Rewind / Time Machine
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          If a rogue script or tired engineer accidentally runs <code>DROP TABLE customers;</code> in production at <strong>14:22:15 UTC</strong>, you don&apos;t have to restore from yesterday&apos;s backup and lose 24 hours of sales. You open RDS PITR and tell AWS: <em>&ldquo;Restore a new database instance to exactly 14:22:14 UTC (1 second before the disaster)!&rdquo;</em>
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>Automated Backups vs Manual DB Snapshots:</h4>
                          
                          <table className="acad-table">
                            <thead>
                              <tr>
                                <th>Feature</th>
                                <th>Automated Backups</th>
                                <th>Manual Snapshots</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td><strong style={{ color: 'var(--color-text-primary)' }}>Retention</strong></td>
                                <td>1 to 35 days (Configurable)</td>
                                <td>Kept forever until deleted</td>
                              </tr>
                              <tr>
                                <td><strong style={{ color: 'var(--color-text-primary)' }}>Precision</strong></td>
                                <td>Exact second Point-In-Time</td>
                                <td>Exact point of snapshot trigger</td>
                              </tr>
                              <tr>
                                <td><strong style={{ color: 'var(--color-text-primary)' }}>On DB Delete</strong></td>
                                <td>Deleted with database</td>
                                <td>Preserved in AWS account</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="asg-card p-4 rounded-xl flex flex-col justify-center text-center font-mono text-xs">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-tertiary)' }}>Point-In-Time Timeline Restoration</span>
                          
                          <div className="space-y-2 text-left text-[10px]">
                            <div className="p-2 rounded flex justify-between items-center" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                              <span>00:00 UTC &rarr; Daily Snapshot</span>
                              <span className="text-green font-bold">Base Backup Saved</span>
                            </div>
                            <div className="p-2 rounded flex justify-between items-center" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                              <span>00:00 - 14:22 UTC &rarr; WAL Streaming</span>
                              <span className="text-blue font-bold">Logs continuous in S3</span>
                            </div>
                            <div className="p-2 rounded flex justify-between items-center" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid #fca5a5' }}>
                              <span className="text-red font-bold">14:22:15 UTC &rarr; Accidental Drop</span>
                              <span className="text-red font-bold">Disaster Occurred</span>
                            </div>
                            <div className="p-2 rounded flex justify-between items-center" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #86efac' }}>
                              <span className="text-green font-bold">PITR Target: 14:22:14 UTC</span>
                              <span className="text-green font-bold">100% Data Restored!</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NOTE 5.2: RDS PROXY & POOLING */}
                  {selectedNote === 'rds_proxy_pooling' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🚀 Level 5 · Backups &amp; Proxy</span>
                          <h3 className="text-xl font-black mt-2 font-display">5.2 Amazon RDS Proxy &amp; Connection Pooling</h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveSection('advanced')}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                          >
                            <Zap className="w-3.5 h-3.5" /> Go to Advanced Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> Opening a database connection is CPU-heavy and consumes megabytes of server RAM. Serverless workloads (like AWS Lambda) can spin up 5,000 functions simultaneously, which can crash database memory with connection overload. <strong>Amazon RDS Proxy</strong> sits between your apps and the database, pooling connections and sharing them efficiently.
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Velvet Rope Bouncer at an Exclusive Club
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          If 1,000 party guests (Lambda functions) all rushed through the front door at once, the doors would break and the club would descend into chaos! Instead, the velvet rope bouncer (RDS Proxy) manages the door, maintaining 50 VIP tables (warm connection pool) and escorting guests in and out quickly and smoothly!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>Why RDS Proxy is Essential for Serverless:</h4>
                          
                          <ul className="list-disc pl-4 space-y-2">
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Multiplexing / Connection Sharing:</strong> Allows thousands of Lambda invocations to share a small pool of database connections without exhausting database memory limits.</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>66% Faster Failovers:</strong> RDS Proxy automatically bypasses DNS caching during Multi-AZ failover, cutting failover times from 60 seconds down to &lt;20 seconds!</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>IAM Authentication &amp; Secrets Manager:</strong> Enforces IAM authentication and manages database passwords through AWS Secrets Manager automatically.</li>
                          </ul>
                        </div>

                        <div className="asg-card p-4 rounded-xl flex flex-col justify-center text-center font-mono text-xs">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-tertiary)' }}>RDS Proxy Architecture Pipeline</span>
                          
                          <div className="flex items-center justify-center gap-1.5 text-[9.5px]">
                            <div className="p-2.5 rounded-lg" style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid #fde68a' }}>
                              <p className="font-bold text-orange">⚡ 1,000 Lambdas</p>
                              <span>High Concurrency</span>
                            </div>
                            <span style={{ color: 'var(--color-text-tertiary)' }}>&rarr;</span>
                            <div className="p-2.5 rounded-lg" style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid #7dd3fc' }}>
                              <p className="font-bold text-blue">🛡️ RDS Proxy</p>
                              <span>50 Pooled Conns</span>
                            </div>
                            <span style={{ color: 'var(--color-text-tertiary)' }}>&rarr;</span>
                            <div className="p-2.5 rounded-lg" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #86efac' }}>
                              <p className="font-bold text-green">🛢️ RDS Database</p>
                              <span>Protected CPU &amp; RAM</span>
                            </div>
                          </div>

                          <p className="text-[10px] mt-4 leading-normal max-w-xs mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
                            Protects your database from connection pool exhaustion while preserving application response times.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
