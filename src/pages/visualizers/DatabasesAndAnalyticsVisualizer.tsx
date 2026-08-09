import React, { useState, useEffect } from 'react';
import {
  Database,
  Sliders,
  Play,
  RefreshCw,
  Terminal,
  Activity,
  Server,
  BookOpen,
  TrendingUp,
  Shield,
  Info,
  LayoutDashboard
} from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import DatabasesAndAnalyticsComparativeView from '../../components/visualizers/DatabasesAndAnalyticsComparativeView';
import UniqueDatabasesAndAnalyticsFeatures from '../../components/visualizers/UniqueDatabasesAndAnalyticsFeatures';

type TabType = 'intro' | 'rdbms' | 'nosql' | 'lakehouse' | 'warehousing' | 'streaming' | 'ingestion' | 'unique';

interface DataLakeRecord {
  timestamp: string;
  recordsIngested: number;
  queryLatencyMs: number;
}

interface FlinkEvent {
  id: string;
  timestamp: string;
  amount: number;
  location: string;
  status: 'APPROVED' | 'FRAUD_SUSPECT';
}

interface DBDetails {
  title: string;
  emoji: string;
  badgeClass: string;
  awsServices: string;
  engineTypes: string;
  storageScaling: string;
  idealWorkload: string;
  desc: string;
  metrics: {
    write: number;
    read: number;
    rigidity: number;
    complexity: number;
    scale: number;
  };
}

const CATEGORY_MAP: Record<string, DBDetails> = {
  rdbms: {
    title: '📑 RDBMS (Relational Databases)',
    emoji: '📑',
    badgeClass: 'badge-blue',
    awsServices: 'Amazon RDS, Amazon Aurora',
    engineTypes: 'Aurora Serverless v2, RDS PostgreSQL, RDS MySQL, RDS MariaDB, RDS SQL Server, RDS Oracle',
    storageScaling: 'Aurora: Decoupled shared log-structured storage auto-scaling up to 128TB. RDS: VM coupled EBS storage blocks.',
    idealWorkload: 'Core banking transactions, financial records, ERP platforms, complex relational joins with high SQL complexity.',
    desc: 'Structured database engines matching tabular relationships. Enforces rigid schemas, strict primary/foreign key mappings, and 100% ACID transactional compliance.',
    metrics: { write: 75, read: 85, rigidity: 95, complexity: 95, scale: 75 }
  },
  nosql_kv: {
    title: '⚡ NoSQL (Key-Value Transactions)',
    emoji: '⚡',
    badgeClass: 'badge-purple',
    awsServices: 'Amazon DynamoDB, Amazon Keyspaces',
    engineTypes: 'DynamoDB Provisioned / On-Demand tables, DynamoDB Global Tables, Keyspaces (Cassandra compatible)',
    storageScaling: 'Serverless partitioning across dynamic SSD pools based on partition key hashes.',
    idealWorkload: 'E-commerce shopping carts, real-time gaming state, massive user profiles, IoT device logs with key-value lookup.',
    desc: 'Horizontal sharding database engines optimized to scale to millions of requests per second. Delivers single-digit millisecond latency at any scale without joins.',
    metrics: { write: 98, read: 95, rigidity: 10, complexity: 30, scale: 98 }
  },
  nosql_doc: {
    title: '📂 NoSQL (Document Store)',
    emoji: '📂',
    badgeClass: 'badge-teal',
    awsServices: 'Amazon DocumentDB',
    engineTypes: 'DocumentDB (with MongoDB compatibility) Serverless and Provisioned clusters',
    storageScaling: 'Decoupled log-structured document volume replicating 6-ways across 3 AZs. Scale reads to 15 replicas.',
    idealWorkload: 'Content management, customer profile catalogs, nested mobile app session state directories.',
    desc: 'Stores, indexes, and queries nested hierarchical JSON document trees natively. Provides high throughput and decoupled scaling while maintaining MongoDB API support.',
    metrics: { write: 88, read: 88, rigidity: 15, complexity: 50, scale: 88 }
  },
  object: {
    title: '🪣 Object Storage',
    emoji: '🪣',
    badgeClass: 'badge-amber',
    awsServices: 'Amazon S3, S3 Glacier',
    engineTypes: 'S3 Standard, S3 Express One Zone, S3 Infrequent Access, S3 Glacier Deep Archive',
    storageScaling: 'Serverless flat namespace storing infinite, unstructured data blocks up to 5TB per object.',
    idealWorkload: 'Analytical data lake raw layers, static website media assets, compliance archives, backups.',
    desc: 'High durability (11 9s) serverless object storage layer. Supports object lifecycle transition engines to automate cost-efficient tiering from hot storage to deep archives.',
    metrics: { write: 80, read: 60, rigidity: 5, complexity: 20, scale: 100 }
  },
  analytics: {
    title: '📊 Data Warehouse & OLAP',
    emoji: '📊',
    badgeClass: 'badge-coral',
    awsServices: 'Amazon Redshift, Amazon Athena',
    engineTypes: 'Redshift Provisioned / Serverless, Redshift Spectrum, Athena (Serverless Presto SQL)',
    storageScaling: 'Redshift: Massive Parallel Processing (MPP) columnar block cluster. Athena: Serverless query coordinator over S3.',
    idealWorkload: 'Enterprise business intelligence dashboards, ad-hoc raw log scanning on S3, heavy reporting aggregations.',
    desc: 'Columnar analytical database engines designed to scan petabytes of data. Converts typical row-based disks to column blocks, drastically reducing disk scans.',
    metrics: { write: 60, read: 50, rigidity: 85, complexity: 92, scale: 95 }
  },
  search: {
    title: '🔎 Search Index (Fuzzy & Log Search)',
    emoji: '🔎',
    badgeClass: 'badge-blue',
    awsServices: 'Amazon OpenSearch Service',
    engineTypes: 'OpenSearch Provisioned Cluster, OpenSearch Serverless, UltraWarm storage, Cold tier backups',
    storageScaling: 'Distributed shard partitions (Primary + Replicas) with dedicated coordinating nodes.',
    idealWorkload: 'Application log auditing dashboards, fuzzy catalog searching, real-time analytics autocomplete.',
    desc: 'Specialized fuzzy search indexing engine designed for full-text search matching, fuzzy querying, and real-time application log indexing and visualization.',
    metrics: { write: 82, read: 90, rigidity: 20, complexity: 75, scale: 90 }
  },
  graph: {
    title: '🕸️ Graph Network (Neptune)',
    emoji: '🕸️',
    badgeClass: 'badge-purple',
    awsServices: 'Amazon Neptune',
    engineTypes: 'Neptune Gremlin Property Graphs, Neptune W3C RDF SPARQL, Neptune Streams CDC',
    storageScaling: 'Decoupled graph storage volume auto-scaling up to 128TB. Auto-replicated across 3 AZs.',
    idealWorkload: 'Fraud ring network tracing, user social network maps, recommenders, deep identity resolution.',
    desc: 'Specially optimized database designed to traverse complex, highly connected many-to-many networks of nodes (vertices) and relationships (edges) in milliseconds.',
    metrics: { write: 72, read: 80, rigidity: 25, complexity: 88, scale: 82 }
  },
  ledger: {
    title: '🛡️ Ledger (Immutable Audit Logs)',
    emoji: '🛡️',
    badgeClass: 'badge-coral',
    awsServices: 'Amazon QLDB',
    engineTypes: 'Amazon QLDB (Quantum Ledger Database) serverless engine',
    storageScaling: 'Serverless append-only journal ledger cryptographically chained using SHA-256 blocks.',
    idealWorkload: 'Supply chain asset logs, DMV vehicle registrations, corporate compliance audit trails, banking logs.',
    desc: 'A centralized, fully managed ledger database that provides an immutable, cryptographically verifiable transaction journal ledger ensuring no records can be deleted.',
    metrics: { write: 65, read: 72, rigidity: 80, complexity: 40, scale: 78 }
  },
  timeseries: {
    title: '📈 Time-Series (Telemetry & IoT)',
    emoji: '📈',
    badgeClass: 'badge-amber',
    awsServices: 'Amazon Timestream',
    engineTypes: 'Timestream for Live Metrics, Timestream for Historical Reports',
    storageScaling: 'Serverless decoupled tiering: Hot metrics stored in RAM; Cold historical records migrated to magnetic disks.',
    idealWorkload: 'IoT sensor telemetry streams, application performance metrics monitoring, stock trade ticking streams.',
    desc: 'Purpose-built time-series engine designed to ingest trillions of append-only chronological events. Features built-in SQL functions for advanced time intervals.',
    metrics: { write: 92, read: 85, rigidity: 40, complexity: 65, scale: 90 }
  },
  etl: {
    title: '⚙️ ETL & Catalog Governance',
    emoji: '⚙️',
    badgeClass: 'badge-green',
    awsServices: 'AWS Glue, AWS Lake Formation',
    engineTypes: 'Glue Crawler, Glue Data Catalog Database, Glue Schema Registry, Glue Serverless Spark/Ray Jobs',
    storageScaling: 'Serverless Hive schema metadata directory + dynamically allocated Spark DPU worker cores.',
    idealWorkload: 'Automated schema discovery on S3 raw landing paths, JSON/CSV to Parquet data compaction pipelines.',
    desc: 'The glue of the AWS analytical portfolio. Crawls files to populate central metastores, enforces data catalog security, and runs serverless code pipelines.',
    metrics: { write: 85, read: 70, rigidity: 75, complexity: 70, scale: 95 }
  }
};

interface DatabasesAndAnalyticsVisualizerProps {
  provider?: 'aws' | 'azure' | 'gcp' | 'comparative';
  setProvider?: (provider: 'aws' | 'azure' | 'gcp' | 'comparative') => void;
}

export default function DatabasesAndAnalyticsVisualizer({ provider = 'aws', setProvider }: DatabasesAndAnalyticsVisualizerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('intro');

  const isComparative = provider === 'comparative';
  const isAzure = provider === 'azure';
  const isGcp = provider === 'gcp';

  const t = (text: string) => {
    if (provider === 'azure') {
      return text
        .replace(/Amazon RDS/gi, 'Azure SQL Database / Azure DB for PostgreSQL')
        .replace(/Amazon Aurora/gi, 'Azure SQL Hyperscale')
        .replace(/Amazon DynamoDB/gi, 'Azure Cosmos DB')
        .replace(/DynamoDB/g, 'Cosmos DB')
        .replace(/Amazon DocumentDB/gi, 'Azure Cosmos DB (MongoDB API)')
        .replace(/Amazon Redshift/gi, 'Azure Synapse Analytics')
        .replace(/Redshift/g, 'Synapse')
        .replace(/Amazon Athena/gi, 'Azure Synapse Serverless SQL')
        .replace(/Amazon OpenSearch/gi, 'Azure AI Search')
        .replace(/Amazon Neptune/gi, 'Azure Cosmos DB Gremlin API')
        .replace(/Amazon QLDB/gi, 'Azure Confidential Ledger')
        .replace(/Amazon Timestream/gi, 'Azure Data Explorer (Kusto)')
        .replace(/Amazon EMR/gi, 'Azure HDInsight / Databricks')
        .replace(/AWS Glue/gi, 'Azure Data Factory')
        .replace(/CloudWatch/g, 'Azure Monitor')
        .replace(/Amazon S3/gi, 'Azure Blob Storage / ADLS Gen2');
    }
    if (provider === 'gcp') {
      return text
        .replace(/Amazon RDS/gi, 'Google Cloud SQL')
        .replace(/Amazon Aurora/gi, 'AlloyDB / Cloud Spanner')
        .replace(/Amazon DynamoDB/gi, 'Google Cloud Bigtable / Firestore')
        .replace(/DynamoDB/g, 'Bigtable')
        .replace(/Amazon DocumentDB/gi, 'Google Cloud Firestore')
        .replace(/Amazon Redshift/gi, 'Google BigQuery')
        .replace(/Redshift/g, 'BigQuery')
        .replace(/Amazon Athena/gi, 'BigQuery Serverless / Omni')
        .replace(/Amazon OpenSearch/gi, 'Vertex AI Search / Cloud Search')
        .replace(/Amazon Neptune/gi, 'Google Cloud Spanner Graph')
        .replace(/Amazon QLDB/gi, 'Google Cloud Ledger')
        .replace(/Amazon Timestream/gi, 'Cloud Bigtable Time-Series')
        .replace(/Amazon EMR/gi, 'Google Cloud Dataproc')
        .replace(/AWS Glue/gi, 'Google Cloud Dataflow / Data Catalog')
        .replace(/CloudWatch/g, 'Cloud Monitoring')
        .replace(/Amazon S3/gi, 'Google Cloud Storage (GCS)');
    }
    return text;
  };

  const getProviderServices = (key: string): string => {
    if (isAzure) {
      switch (key) {
        case 'rdbms': return 'Azure SQL Database, Azure DB for PostgreSQL, Azure DB for MySQL';
        case 'nosql_kv': return 'Azure Cosmos DB (Table & Cassandra API)';
        case 'nosql_doc': return 'Azure Cosmos DB (MongoDB API & NoSQL API)';
        case 'object': return 'Azure Blob Storage, Azure Data Lake Storage Gen2';
        case 'analytics': return 'Azure Synapse Analytics, Azure Databricks, Microsoft Fabric';
        case 'search': return 'Azure AI Search (formerly Cognitive Search)';
        case 'graph': return 'Azure Cosmos DB (Gremlin Graph API)';
        case 'ledger': return 'Azure Confidential Ledger';
        case 'timeseries': return 'Azure Data Explorer (Kusto Engine)';
        case 'etl': return 'Azure Data Factory, Azure Purview';
        default: return 'Azure Managed Database Services';
      }
    }
    if (isGcp) {
      switch (key) {
        case 'rdbms': return 'Google Cloud SQL, Cloud Spanner, AlloyDB';
        case 'nosql_kv': return 'Google Cloud Bigtable, Cloud Firestore (Key-Value)';
        case 'nosql_doc': return 'Google Cloud Firestore (Document store API)';
        case 'object': return 'Google Cloud Storage (GCS Standard/Coldline/Archive)';
        case 'analytics': return 'Google BigQuery, BigQuery Serverless, BigQuery Omni';
        case 'search': return 'Google Vertex AI Search / Cloud Search';
        case 'graph': return 'Google Cloud Spanner Graph';
        case 'ledger': return 'Google Cloud Ledger / Blockchain Engine';
        case 'timeseries': return 'Google Cloud Bigtable (Time-Series Mode)';
        case 'etl': return 'Google Cloud Dataflow, Cloud Data Catalog, Dataplex';
        default: return 'Google Cloud Database Services';
      }
    }
    return CATEGORY_MAP[key]?.awsServices || '';
  };

  const Translate = ({ children }: { children: React.ReactNode }): React.ReactElement => {
    if (provider === 'aws') {
      return <>{children}</>;
    }

    const translateNode = (node: React.ReactNode): React.ReactNode => {
      if (typeof node === 'string') {
        return t(node);
      }
      if (typeof node === 'number') {
        return node;
      }
      if (React.isValidElement(node)) {
        if (node.type === 'pre' || node.type === 'code' || (node.props && (node.props.className === 'da-terminal' || node.props.className === 'da-code-card'))) {
          return node;
        }
        if (node.props && node.props.children) {
          if (typeof node.props.children === 'function') {
            return node;
          }
          const translatedChildren = React.Children.map(node.props.children, translateNode);
          return React.cloneElement(node, { ...node.props, children: translatedChildren });
        }
        return node;
      }
      if (Array.isArray(node)) {
        return node.map((child, index) => <React.Fragment key={index}>{translateNode(child)}</React.Fragment>);
      }
      return node;
    };

    return <>{translateNode(children)}</>;
  };

  const handleNavigateToDemo = (prov: 'aws' | 'azure' | 'gcp', tab: any) => {
    if (setProvider) {
      setProvider(prov);
    }
    setActiveTab(tab === 'dynamo' ? 'nosql' : tab === 'redshift' ? 'warehousing' : tab === 'emr' ? 'streaming' : tab);
  };
  const [isDark, setIsDark] = useState<boolean>(
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    // Check initial state
    setIsDark(document.documentElement.classList.contains('dark'));

    // Set up observer to watch for theme switches on <html> element
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // ==========================================
  // TAB 1 STATE: Workload Recommendation Wizard
  // ==========================================
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [answers, setAnswers] = useState({
    structure: '',
    latency: '',
    relations: '',
    scaling: ''
  });
  const [recommendedDb, setRecommendedDb] = useState<string | null>(null);
  const [recReason, setRecReason] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('rdbms');

  const resetWizard = () => {
    setWizardStep(1);
    setAnswers({ structure: '', latency: '', relations: '', scaling: '' });
    setRecommendedDb(null);
    setRecReason('');
  };

  const handleSelectAnswer = (key: string, value: string) => {
    const nextAnswers = { ...answers, [key]: value };
    setAnswers(nextAnswers);

    if (wizardStep < 4) {
      setWizardStep((prev) => prev + 1);
    } else {
      let db = 'Amazon RDS / Aurora';
      let reason = 'Based on your highly structured relational schema and strict ACID transaction needs, Amazon Aurora with decoupled log storage replicates data 6-ways across 3 AZs for bulletproof operations.';

      if (nextAnswers.structure === 'semi-structured' && nextAnswers.latency === 'sub-ms') {
        db = 'Amazon ElastiCache (Redis)';
        reason = 'Sub-millisecond latency caching is perfect for in-memory Redis. It bypasses relational disks to serve user session profiles and rapid hot keys instantly.';
      } else if (nextAnswers.structure === 'semi-structured' && nextAnswers.relations === 'no-relations') {
        db = 'Amazon DynamoDB';
        reason = 'A serverless, sharded NoSQL database scaling dynamically with single-digit millisecond latency, partitioning tables using key hashes across physical SSD clusters.';
      } else if (nextAnswers.structure === 'json-docs') {
        db = 'Amazon DocumentDB';
        reason = 'Perfect for running MongoDB JSON documents, decoupling compute and storage to scale read operations across 15 read replicas in minutes.';
      } else if (nextAnswers.relations === 'deep-networks') {
        db = 'Amazon Neptune (Graph)';
        reason = 'Handles highly connected property graphs (Gremlin) and W3C RDF (SPARQL), with Neptune Streams capturing CDC graph updates to index Search nodes.';
      } else if (nextAnswers.latency === 'analytical-olap') {
        db = 'Amazon Redshift (OLAP)';
        reason = 'An enterprise-scale columnar MPP data warehouse that runs complex aggregate analytics across millions of rows with Redshift Spectrum S3 querying.';
      } else if (nextAnswers.scaling === 'serverless-queries') {
        db = 'Amazon Athena (S3 Queries)';
        reason = 'A serverless, zero-compute-infrastructure Presto SQL service querying raw CSV, JSON, or columnar Parquet files directly inside Amazon S3 lakes.';
      } else if (nextAnswers.scaling === 'append-only-time') {
        db = 'Amazon Timestream (Time-series)';
        reason = 'Specially tuned to ingest trillions of chronological IoT metrics, automatically tiering hot writes to memory and cold metrics to magnetic storage.';
      }

      setRecommendedDb(db);
      setRecReason(reason);
      setWizardStep(5);
    }
  };

  // ==========================================
  // TAB 2 STATE: Relational & Aurora Failover
  // ==========================================
  const [failoverState, setFailoverState] = useState<'idle' | 'master-crash' | 'promoting-reader' | 'route53-updating' | 'completed'>('idle');
  const [failoverLogs, setFailoverLogs] = useState<string[]>([]);
  const [masterActive, setMasterActive] = useState<boolean>(true);
  const [promotedReaderId, setPromotedReaderId] = useState<string | null>(null);

  const addFailoverLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setFailoverLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  };

  const triggerAuroraFailover = async () => {
    if (failoverState !== 'idle') return;

    setFailoverLogs([]);
    setFailoverState('master-crash');
    setMasterActive(false);
    addFailoverLog('⚠️ CRITICAL: Primary writer instance "aurora-writer-us-east-1a" encountered a physical hypervisor crash.');
    addFailoverLog('🚨 MONITOR: Aurora Cluster Manager detects loss of writer node heartbeat (timeout breached).');

    await new Promise((r) => setTimeout(r, 2000));
    setFailoverState('promoting-reader');
    setPromotedReaderId('aurora-reader-us-east-1b');
    addFailoverLog('⚙️ FAILOVER: Promoting replica "aurora-reader-us-east-1b" in Availability Zone 1B to primary Writer role.');
    addFailoverLog('🔗 STORAGE: Promoted node immediately mounts shared replicated SSD storage with full read/write descriptors.');

    await new Promise((r) => setTimeout(r, 2000));
    setFailoverState('route53-updating');
    addFailoverLog('🌐 ROUTE53: Updating cluster primary DNS CNAME endpoints.');
    addFailoverLog('🔄 NETWORKING: CNAME record re-routed from AZ-1A IP to AZ-1B IP (TTL: 1 second).');

    await new Promise((r) => setTimeout(r, 1800));
    setFailoverState('completed');
    addFailoverLog('✅ SUCCESS: Failover completed in 24.5 seconds. Replicas are synchronizing. Write traffic restored successfully!');
  };

  const resetAuroraScenario = () => {
    setFailoverState('idle');
    setFailoverLogs([]);
    setMasterActive(true);
    setPromotedReaderId(null);
  };

  // ==========================================
  // TAB 3 STATE: NoSQL Cache-Aside Simulator & DynamoDB Hash
  // ==========================================
  const [cacheSimMode, setCacheSimMode] = useState<'hit' | 'miss'>('hit');
  const [cacheLogs, setCacheLogs] = useState<string[]>([]);
  const [cacheState, setCacheState] = useState<'idle' | 'checking-cache' | 'cache-hit' | 'cache-miss' | 'querying-db' | 'populating-cache' | 'completed'>('idle');
  const [dynamoInputUser, setDynamoInputUser] = useState<string>('alice_99');
  const [dynamoHashResult, setDynamoHashResult] = useState<{ hash: string; partition: number }>({ hash: '8b4c5d3a', partition: 2 });

  const addCacheLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setCacheLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  };

  const triggerCacheScenario = async () => {
    if (cacheState !== 'idle') return;

    setCacheLogs([]);
    setCacheState('checking-cache');
    addCacheLog(`🚀 REQUEST: App server receives HTTP request for user profile "${dynamoInputUser}".`);
    addCacheLog('🔌 CACHE CHECK: Querying ElastiCache Redis memory pool cluster.');

    await new Promise((r) => setTimeout(r, 1200));

    if (cacheSimMode === 'hit') {
      setCacheState('cache-hit');
      addCacheLog('🟢 CACHE HIT: Found pre-cached profile inside Redis memory slot.');
      addCacheLog('⏱️ METRIC: In-memory query returned in 0.23 milliseconds.');
      await new Promise((r) => setTimeout(r, 1000));
      setCacheState('completed');
      addCacheLog('✅ SUCCESS: Request served directly from cache pool. Backing database bypassed.');
    } else {
      setCacheState('cache-miss');
      addCacheLog(`🟡 CACHE MISS: Profile "${dynamoInputUser}" not found in Redis memory index.`);
      
      await new Promise((r) => setTimeout(r, 1200));
      setCacheState('querying-db');
      addCacheLog('🛢️ DB QUERY: Routing read operation to backing relational store (Amazon RDS PostgreSQL).');
      addCacheLog('⏱️ METRIC: Relational query finished in 5.82 milliseconds.');

      await new Promise((r) => setTimeout(r, 1200));
      setCacheState('populating-cache');
      addCacheLog('💾 CACHE POPULATE: App server asynchronously writes queried database record to Redis for subsequent reads.');

      await new Promise((r) => setTimeout(r, 1000));
      setCacheState('completed');
      addCacheLog('✅ SUCCESS: Request completed successfully. Subsequent requests will cache hit.');
    }
  };

  const calculateDynamoHash = (username: string) => {
    setDynamoInputUser(username);
    // Dynamic simulated hash calculation
    let hashVal = 0;
    for (let i = 0; i < username.length; i++) {
      hashVal = username.charCodeAt(i) + ((hashVal << 5) - hashVal);
    }
    const hex = Math.abs(hashVal).toString(16).substring(0, 8);
    const partition = (Math.abs(hashVal) % 4) + 1;
    setDynamoHashResult({ hash: hex || '00000000', partition });
  };

  const resetCacheScenario = () => {
    setCacheState('idle');
    setCacheLogs([]);
  };

  // ==========================================
  // TAB 4 STATE: Athena & Lake Formation
  // ==========================================
  const [lakeRole, setLakeRole] = useState<'admin' | 'marketing' | 'auditor'>('admin');
  const [lakeLogs, setLakeLogs] = useState<string[]>([]);
  const lakeData = [
    { id: '101', name: 'John Doe', email: 'john.doe@example.com', region: 'US', sales: 4500 },
    { id: '102', name: 'Jane Smith', email: 'jane.smith@example.com', region: 'EU', sales: 8200 },
    { id: '103', name: 'Hans Meier', email: 'hans.m@example.de', region: 'EU', sales: 3100 },
    { id: '104', name: 'Hiro Tanaka', email: 'hiro@example.co.jp', region: 'APAC', sales: 9400 }
  ];

  const changeLakeRole = (role: 'admin' | 'marketing' | 'auditor') => {
    setLakeRole(role);
    const time = new Date().toLocaleTimeString();
    if (role === 'admin') {
      setLakeLogs([
        `[${time}] Role: DATA_ADMINISTRATOR authenticated.`,
        '🔓 Lake Formation yields unrestricted permissions.',
        '📝 Result columns: ALL (user_id, name, email, region, sales). Row filter: NONE.'
      ]);
    } else if (role === 'marketing') {
      setLakeLogs([
        `[${time}] Role: MARKETING_ANALYST authenticated.`,
        '🔒 Lake Formation intercepts metadata access. Masking policy applied to column "email".',
        '📝 Result columns: PII column [email] mapped to "****@***.com" filter mask.'
      ]);
    } else {
      setLakeLogs([
        `[${time}] Role: EU_REGIONAL_AUDITOR authenticated.`,
        '🔒 Lake Formation enforces row-level filter constraint: WHERE region = \'EU\'.',
        '📝 Row filter: Only 2 rows visible. Regions other than EU are completely filtered out.'
      ]);
    }
  };

  // ==========================================
  // NEW: AWS GLUE SERVERLESS ETL & SCHEMA REGISTRY STATE
  // ==========================================
  const [glueJobState, setGlueJobState] = useState<'idle' | 'crawling' | 'etl-running' | 'completed'>('idle');
  const [glueLogs, setGlueLogs] = useState<string[]>([]);
  const [glueFileType, setGlueFileType] = useState<'json' | 'csv' | 'parquet'>('json');
  const [glueJobType, setGlueJobType] = useState<'spark' | 'ray' | 'python-shell'>('spark');
  const [glueSchemaRegistry, setGlueSchemaRegistry] = useState<boolean>(true);

  const runGlueCrawler = async () => {
    if (glueJobState !== 'idle') return;
    setGlueJobState('crawling');
    setGlueLogs([]);
    const time = new Date().toLocaleTimeString();
    setGlueLogs(prev => [`[${time}] CRAWLER: AWS Glue Crawler "s3-raw-crawler" spawned. Scanning s3://raw-landing-bucket/...`, ...prev]);
    
    await new Promise(r => setTimeout(r, 1200));
    setGlueLogs(prev => [`[${time}] CRAWLER: Inferred folder file format: ${glueFileType.toUpperCase()}. Scanning directory structure.`, ...prev]);
    
    await new Promise(r => setTimeout(r, 1200));
    setGlueLogs(prev => [`[${time}] CRAWLER: Cataloged 1 new table schema [flight_raw_records] inside Glue Database "lakehouse_db".`, ...prev]);
    setGlueLogs(prev => [`[${time}] CRAWLER: Identified schema: [id (int), name (string), email (string), region (string), sales (double)].`, ...prev]);
    setGlueJobState('idle');
  };

  const runGlueEtlJob = async () => {
    if (glueJobState !== 'idle') return;
    setGlueJobState('etl-running');
    setGlueLogs([]);
    const time = new Date().toLocaleTimeString();
    setGlueLogs(prev => [`[${time}] GLUE JOB: Spawning serverless Glue ${glueJobType.toUpperCase()} Executor nodes (10 DPUs configured).`, ...prev]);

    if (glueSchemaRegistry) {
      await new Promise(r => setTimeout(r, 800));
      setGlueLogs(prev => [`[${time}] SCHEMA REGISTRY: Validating source stream compatibility using AVRO schema ID #71a94.`, ...prev]);
      setGlueLogs(prev => [`[${time}] SCHEMA REGISTRY: Validation SUCCESS. 0 malformed records or poisoned pills detected.`, ...prev]);
    }

    await new Promise(r => setTimeout(r, 1200));
    setGlueLogs(prev => [`[${time}] GLUE JOB: Extracting raw ${glueFileType.toUpperCase()} objects from S3 Landing Zone.`, ...prev]);
    setGlueLogs(prev => [`[${time}] GLUE JOB: Applying Transformations (Mapping types, filtering null fields, consolidating files).`, ...prev]);

    await new Promise(r => setTimeout(r, 1500));
    setGlueLogs(prev => [`[${time}] GLUE JOB: Writing transformed snappy-compressed Columnar PARQUET blocks to s3://refined-lakehouse-bucket/year=2026/...`, ...prev]);
    setGlueLogs(prev => [`[${time}] GLUE JOB: Updating Glue Data Catalog partition indexes.`, ...prev]);

    setGlueJobState('completed');
    setGlueLogs(prev => [`[${time}] ✅ GLUE JOB SUCCESS: Serverless ETL complete. Saved 82% storage space, query speedup 12x.`, ...prev]);
  };

  const resetGlueSandbox = () => {
    setGlueJobState('idle');
    setGlueLogs([]);
    setGlueFileType('json');
    setGlueJobType('spark');
    setGlueSchemaRegistry(true);
  };

  // ==========================================
  // TAB 5 STATE: Redshift Warehousing & DR Snapshot
  // ==========================================
  const [redshiftState, setRedshiftState] = useState<'idle' | 'snapshotting' | 'replicating' | 'recovering' | 'completed'>('idle');
  const [redshiftLogs, setRedshiftLogs] = useState<string[]>([]);

  // ==========================================
  // NEW ATHENA PERFORMANCE & FEDERATED STATES
  // ==========================================
  const [athenaFormat, setAthenaFormat] = useState<'row' | 'columnar'>('row');
  const [athenaCompress, setAthenaCompress] = useState<boolean>(false);
  const [athenaPartition, setAthenaPartition] = useState<boolean>(false);
  const [athenaFileSize, setAthenaFileSize] = useState<'small' | 'large'>('small');
  
  const [federatedDb, setFederatedDb] = useState<string>('dynamodb');
  const [federatedState, setFederatedState] = useState<'idle' | 'querying' | 'fetching' | 'saving' | 'completed'>('idle');
  const [federatedLogs, setFederatedLogs] = useState<string[]>([]);

  const triggerFederatedQuery = async () => {
    if (federatedState !== 'idle') return;
    setFederatedLogs([]);
    setFederatedState('querying');
    const time = new Date().toLocaleTimeString();
    setFederatedLogs(prev => [`[${time}] DISPATCH: Athena Federated Query engine parses request: "SELECT * FROM federated_${federatedDb}"`, ...prev]);
    
    await new Promise(r => setTimeout(r, 1200));
    setFederatedState('fetching');
    setFederatedLogs(prev => [`[${time}] CONNECTOR: Invoking AWS Lambda Data Source Connector for ${federatedDb.toUpperCase()}`, ...prev]);
    setFederatedLogs(prev => [`[${time}] QUERY: Lambda connector establishes JDBC/connection socket, executing targeted scan on external table...`, ...prev]);

    await new Promise(r => setTimeout(r, 1500));
    setFederatedState('saving');
    setFederatedLogs(prev => [`[${time}] METADATA: Fetched records from external database successfully (250 items).`, ...prev]);
    setFederatedLogs(prev => [`[${time}] S3 WRITE: Query results compiled, serialized, and persisted to central Athena S3 output query bucket.`, ...prev]);

    await new Promise(r => setTimeout(r, 1000));
    setFederatedState('completed');
    setFederatedLogs(prev => [`[${time}] ✅ SUCCESS: Federated query complete! Data aggregated seamlessly across S3 and remote ${federatedDb.toUpperCase()} pool.`, ...prev]);
  };

  const resetFederatedQuery = () => {
    setFederatedState('idle');
    setFederatedLogs([]);
  };

  // ==========================================
  // NEW REDSHIFT MPP EXECUTOR & SNAPSHOT STATES
  // ==========================================
  const [redshiftQuery, setRedshiftQuery] = useState<string>('sales-sum');
  const [redshiftMppState, setRedshiftMppState] = useState<'idle' | 'client-send' | 'leader-plan' | 'compute-scan' | 'leader-aggregate' | 'client-receive' | 'completed'>('idle');
  const [redshiftMppLogs, setRedshiftMppLogs] = useState<string[]>([]);
  
  const [rsSnapshotFreq, setRsSnapshotFreq] = useState<'5h' | '8h' | 'scheduled'>('8h');
  const [rsCrossRegion, setRsCrossRegion] = useState<boolean>(false);
  const [rsRetention, setRsRetention] = useState<number>(7);
  const [rsSnapshotsList, setRsSnapshotsList] = useState<{id: string; time: string; type: string; size: string}[]>([
    { id: 'rs-snap-initial', time: '10:00:00 AM', type: 'Manual', size: '12.4 GB' }
  ]);
  const [rsDRState, setRsDRState] = useState<'idle' | 'snapshotting' | 'replicating' | 'restoring' | 'completed'>('idle');
  const [rsDRLogs, setRsDRLogs] = useState<string[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('rs-snap-initial');

  const triggerRedshiftMppQuery = async () => {
    if (redshiftMppState !== 'idle') return;
    setRedshiftMppLogs([]);
    setRedshiftMppState('client-send');
    const time = new Date().toLocaleTimeString();
    setRedshiftMppLogs(prev => [`[${time}] CLIENT: Dispatching SQL query via JDBC/ODBC connection endpoint.`, ...prev]);

    await new Promise(r => setTimeout(r, 1000));
    setRedshiftMppState('leader-plan');
    setRedshiftMppLogs(prev => [`[${time}] LEADER NODE: Parsing SQL statement, analyzing PostgreSQL metadata schema, and compiling parallel execution plan.`, ...prev]);
    setRedshiftMppLogs(prev => [`[${time}] LEADER NODE: Distributing task partitions across computed column slices.`, ...prev]);

    await new Promise(r => setTimeout(r, 1500));
    setRedshiftMppState('compute-scan');
    setRedshiftMppLogs(prev => [`[${time}] COMPUTE NODES: Massively Parallel Processing (MPP) activated! Compute Node #1 & #2 executing scans concurrently.`, ...prev]);
    setRedshiftMppLogs(prev => [`[${time}] COLUMNAR STORAGE: OLAP columnar disk blocks filter out unneeded columns, scanning ONLY the target fields. Ignored 85% of table schema!`, ...prev]);

    await new Promise(r => setTimeout(r, 1500));
    setRedshiftMppState('leader-aggregate');
    setRedshiftMppLogs(prev => [`[${time}] LEADER NODE: Gathering computed aggregations from all data node slices and performing final SQL compile.`, ...prev]);

    await new Promise(r => setTimeout(r, 1000));
    setRedshiftMppState('client-receive');
    setRedshiftMppLogs(prev => [`[${time}] CLIENT: Result received (10x faster than traditional OLTP row-by-row scans).`, ...prev]);
    
    await new Promise(r => setTimeout(r, 800));
    setRedshiftMppState('completed');
    setRedshiftMppLogs(prev => [`[${time}] ✅ SUCCESS: Analytics OLAP query completed. PB-scale storage aggregated efficiently thanks to parallel columnar indices.`, ...prev]);
  };

  const resetRedshiftMpp = () => {
    setRedshiftMppState('idle');
    setRedshiftMppLogs([]);
  };

  const triggerRsManualSnapshot = async () => {
    if (rsDRState !== 'idle') return;
    setRsDRLogs([]);
    setRsDRState('snapshotting');
    const time = new Date().toLocaleTimeString();
    setRsDRLogs(prev => [`[${time}] 📸 SNAPSHOT: Initiating consistent point-in-time snapshot backup.`, ...prev]);
    
    await new Promise(r => setTimeout(r, 1200));
    const snapId = `rs-snap-manual-${Math.floor(Math.random() * 9000) + 1000}`;
    const newSnap = {
      id: snapId,
      time: new Date().toLocaleTimeString(),
      type: 'Manual',
      size: '12.8 GB'
    };
    setRsSnapshotsList(prev => [...prev, newSnap]);
    setSelectedSnapshot(snapId);
    setRsDRLogs(prev => [`[${time}] 💾 SUCCESS: Snapshot "${snapId}" saved incrementally inside S3 bucket (size: 12.8 GB).`, ...prev]);

    if (rsCrossRegion) {
      setRsDRState('replicating');
      setRsDRLogs(prev => [`[${time}] 📡 REPLICATION: Replicating snapshot "${snapId}" automatically to secondary recovery region for disaster recovery (DR).`, ...prev]);
      await new Promise(r => setTimeout(r, 1500));
    }

    setRsDRState('completed');
    setRsDRLogs(prev => [`[${time}] ✅ COMPLETED: Snapshot operations completed. Retention enforcement rule set to ${rsRetention} days.`, ...prev]);
  };

  const triggerRsRestoreSnapshot = async () => {
    if (rsDRState !== 'idle') return;
    setRsDRLogs([]);
    setRsDRState('restoring');
    const time = new Date().toLocaleTimeString();
    setRsDRLogs(prev => [`[${time}] ⚙️ RESTORE: Restoring snapshot "${selectedSnapshot}" into a brand new PostgreSQL-compatible Redshift cluster.`, ...prev]);
    setRsDRLogs(prev => [`[${time}] S3 PULL: Fetching incremental blocks from backup vault...`, ...prev]);

    await new Promise(r => setTimeout(r, 2000));
    setRsDRState('completed');
    setRsDRLogs(prev => [`[${time}] ✅ SUCCESS: Restoration complete! Redshift Cluster "rs-restored-node" is online and accepting JDBC/ODBC queries.`, ...prev]);
  };

  const resetRsDR = () => {
    setRsDRState('idle');
    setRsDRLogs([]);
  };

  const addRedshiftLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setRedshiftLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  };

  const triggerRedshiftDR = async () => {
    if (redshiftState !== 'idle') return;

    setRedshiftLogs([]);
    setRedshiftState('snapshotting');
    addRedshiftLog('🚀 DR EVENT: Disaster Recovery runbook triggered for Redshift Cluster "dw-prod-us-east-1".');
    addRedshiftLog('💾 SNAPSHOT: Creating consistent, incremental backup slice of current data nodes.');

    await new Promise((r) => setTimeout(r, 2000));
    setRedshiftState('replicating');
    addRedshiftLog('📡 COPY: Replicating snapshot metadata and blocks securely to S3 bucket in secondary recovery region "us-west-2" (Cross-Region Copy).');
    addRedshiftLog('🔒 SECURITY: Snapshot blocks encrypted using destination region AWS KMS Key alias/dw-dr.');

    await new Promise((r) => setTimeout(r, 2000));
    setRedshiftState('recovering');
    addRedshiftLog('⚙️ RESTORE: Standby cluster creation launched in "us-west-2" AZ-2A/2B using replicated snapshots.');
    addRedshiftLog('⚡ MPP COMPUTE: Provisioning slices and leader node; importing database metadata.');

    await new Promise((r) => setTimeout(r, 2000));
    setRedshiftState('completed');
    addRedshiftLog('🌐 CNAME SWITCH: Flipping warehouse client endpoint DNS record to the us-west-2 cluster.');
    addRedshiftLog('✅ SUCCESS: Disaster Recovery complete. Cluster dw-prod-us-west-2 is active and serving federated queries!');
  };

  const resetRedshiftDR = () => {
    setRedshiftState('idle');
    setRedshiftLogs([]);
  };

  // ==========================================
  // NEW: AMAZON EMR, OPENSEARCH, & QUICKSIGHT SPICE STATES
  // ==========================================
  const [emrClusterType, setEmrClusterType] = useState<'long-running' | 'transient'>('long-running');
  const [emrMasterState, setEmrMasterState] = useState<'idle' | 'provisioning' | 'active'>('active');
  const [emrCoreCount, setEmrCoreCount] = useState<number>(3);
  const [emrTaskCount, setEmrTaskCount] = useState<number>(0);
  const [emrWorkload, setEmrWorkload] = useState<'idle' | 'spark-jobs' | 'presto-queries' | 'flink-aggregations'>('idle');
  const [emrLogs, setEmrLogs] = useState<string[]>([]);
  const [emrSpotPrice, setEmrSpotPrice] = useState<number>(0.24);

  const triggerEmrJob = async (jobType: 'spark' | 'presto' | 'flink') => {
    if (emrMasterState !== 'active' || emrWorkload !== 'idle') return;
    setEmrLogs([]);
    const time = new Date().toLocaleTimeString();
    setEmrLogs(prev => [`[${time}] EMR MASTER: Initializing Big Data ${jobType.toUpperCase()} partition task mapping...`, ...prev]);

    if (jobType === 'spark') {
      setEmrWorkload('spark-jobs');
      setEmrLogs(prev => [`[${time}] EMR MASTER: Task coordinates distributed across ${emrCoreCount} Core Nodes storing HDFS blocks.`, ...prev]);
      
      // Auto-scaling task nodes (Spot instances!)
      if (emrTaskCount < 4) {
        setEmrLogs(prev => [`[${time}] AUTO-SCALING: Surging workload detected. Programmatic scale-up triggered!`, ...prev]);
        setEmrLogs(prev => [`[${time}] SPOT PROVISIONER: Requesting 4 optional Task Nodes (Spot purchasing option).`, ...prev]);
        await new Promise(r => setTimeout(r, 1200));
        setEmrTaskCount(4);
        setEmrSpotPrice(0.08); // Spot pricing discount!
        setEmrLogs(prev => [`[${time}] SPOT PROVISIONER: 4 Task Nodes provisioned at Spot price ($0.08/hr vs $0.24/hr on-demand).`, ...prev]);
      }
      
      await new Promise(r => setTimeout(r, 1500));
      setEmrLogs(prev => [`[${time}] SPARK: Running vast data processing job (machine learning and web indexing calculations).`, ...prev]);
      await new Promise(r => setTimeout(r, 1500));
      setEmrLogs(prev => [`[${time}] ✅ SUCCESS: Spark job complete. Output stored in Refined S3 Lake.`, ...prev]);
    } else if (jobType === 'presto') {
      setEmrWorkload('presto-queries');
      setEmrLogs(prev => [`[${time}] PRESTO: Executing ad-hoc SQL queries on external Hive/Glue metastore schemas.`, ...prev]);
      await new Promise(r => setTimeout(r, 1800));
      setEmrLogs(prev => [`[${time}] ✅ SUCCESS: Presto ad-hoc scan complete. Returned 4.8M rows in 1.8s.`, ...prev]);
    } else {
      setEmrWorkload('flink-aggregations');
      setEmrLogs(prev => [`[${time}] FLINK: Initializing stateful sliding window aggregations on Kinesis streams.`, ...prev]);
      await new Promise(r => setTimeout(r, 1800));
      setEmrLogs(prev => [`[${time}] ✅ SUCCESS: Flink stream aggregator is running hot.`, ...prev]);
    }
    
    setEmrWorkload('idle');
    if (emrClusterType === 'transient') {
      setEmrLogs(prev => [`[${time}] TRANSIENT SHUTDOWN: Transient temporary cluster job complete. Tearing down EC2 instances...`, ...prev]);
      await new Promise(r => setTimeout(r, 1000));
      setEmrTaskCount(0);
      setEmrMasterState('idle');
      setEmrLogs(prev => [`[${time}] 💀 TRANSIENT TERMINATED: Cluster fully decommissioned. Total run cost minimized.`, ...prev]);
    }
  };

  const provisionEmrCluster = async () => {
    setEmrMasterState('provisioning');
    setEmrLogs([]);
    const time = new Date().toLocaleTimeString();
    setEmrLogs(prev => [`[${time}] PROVISIONER: Provisioning Master Node (m5.xlarge, coordinates health)...`, ...prev]);
    await new Promise(r => setTimeout(r, 1000));
    setEmrLogs(prev => [`[${time}] PROVISIONER: Bootstrapping ${emrCoreCount} Core Nodes (m5.xlarge, stores HDFS tasks)...`, ...prev]);
    await new Promise(r => setTimeout(r, 1200));
    setEmrMasterState('active');
    setEmrLogs(prev => [`[${time}] 🟢 ACTIVE: Hadoop EMR Cluster online and health status verified.`, ...prev]);
  };

  const resetEmrCluster = () => {
    setEmrMasterState('active');
    setEmrCoreCount(3);
    setEmrTaskCount(0);
    setEmrWorkload('idle');
    setEmrLogs([]);
    setEmrSpotPrice(0.24);
  };

  // OpenSearch Search states
  const [osSearchQuery, setOsSearchQuery] = useState<string>('auth-error');
  const [osIngestPath, setOsIngestPath] = useState<'dynamodb' | 'kinesis-firehose' | 'cloudwatch'>('dynamodb');
  const [osState, setOsState] = useState<'idle' | 'searching' | 'ingesting'>('idle');
  const [osLogs, setOsLogs] = useState<string[]>([]);
  const [osSearchResults, setOsSearchResults] = useState<{id: string; message: string; matchedField: string; dbLatency: string}[]>([]);

  const triggerOsSearch = async () => {
    if (osState !== 'idle') return;
    setOsState('searching');
    setOsSearchResults([]);
    setOsLogs([]);
    const time = new Date().toLocaleTimeString();
    setOsLogs(prev => [`[${time}] USER SEARCH: Executing full-text partial query for "${osSearchQuery}"...`, ...prev]);
    
    await new Promise(r => setTimeout(r, 800));
    // Simulate finding matching fields on OpenSearch
    const results = [
      { id: 'usr-8924', message: 'Auth failed for token key', matchedField: `message: *${osSearchQuery}* (PARTIAL MATCH)`, dbLatency: '15ms (OpenSearch Index)' },
      { id: 'usr-1049', message: 'System login auth timeout exception', matchedField: `message: *${osSearchQuery}* (PARTIAL MATCH)`, dbLatency: '15ms (OpenSearch Index)' }
    ];
    setOsSearchResults(results);
    setOsLogs(prev => [`[${time}] OPENSEARCH: Succession to Elasticsearch. Scanned index. Found ${results.length} partially matching record IDs.`, ...prev]);
    setOsLogs(prev => [`[${time}] 💡 INTEGRATION PATTERN: OpenSearch provides the search capability. We will now fetch the WHOLE items from DynamoDB via primary keys.`, ...prev]);

    // Fetch whole item from DynamoDB!
    await new Promise(r => setTimeout(r, 1200));
    setOsLogs(prev => [`[${time}] DYNAMODB: BatchGetItem request dispatched for primary keys [usr-8924, usr-1049].`, ...prev]);
    setOsLogs(prev => [`[${time}] DYNAMODB: Fetched complete row records (Profile, email, logs) successfully (latency: 4ms).`, ...prev]);
    setOsState('idle');
    setOsLogs(prev => [`[${time}] ✅ COMPLETED: Wholesome search resolved! Search complementary index matched ID, DB resolved details.`, ...prev]);
  };

  const triggerOsIngestion = async () => {
    if (osState !== 'idle') return;
    setOsState('ingesting');
    setOsLogs([]);
    const time = new Date().toLocaleTimeString();
    
    if (osIngestPath === 'dynamodb') {
      setOsLogs(prev => [`[${time}] CRUD WRITE: Item inserted into DynamoDB table.`, ...prev]);
      await new Promise(r => setTimeout(r, 800));
      setOsLogs(prev => [`[${time}] DYNAMODB STREAMS: Stream segment captured the database mutation log.`, ...prev]);
      await new Promise(r => setTimeout(r, 1000));
      setOsLogs(prev => [`[${time}] AWS LAMBDA: Stream trigger invokes Lambda function to parse mutation.`, ...prev]);
      await new Promise(r => setTimeout(r, 1000));
      setOsLogs(prev => [`[${time}] OPENSEARCH: Lambda connector index writes the search documents in bulk (TLS encrypted).`, ...prev]);
    } else if (osIngestPath === 'kinesis-firehose') {
      setOsLogs(prev => [`[${time}] KINESIS DATA STREAMS: Heavy event stream ingested at 50,000 req/sec.`, ...prev]);
      await new Promise(r => setTimeout(r, 800));
      setOsLogs(prev => [`[${time}] KINESIS FIREHOSE: Aggregating and buffering micro-batches (near real-time).`, ...prev]);
      await new Promise(r => setTimeout(r, 1000));
      setOsLogs(prev => [`[${time}] AWS LAMBDA: Firehose invokes Lambda to transform telemetry payload format.`, ...prev]);
      await new Promise(r => setTimeout(r, 1000));
      setOsLogs(prev => [`[${time}] OPENSEARCH: Buffered payload written and indexed in OpenSearch cluster.`, ...prev]);
    } else {
      setOsLogs(prev => [`[${time}] CLOUDWATCH LOGS: System logs generated by application nodes.`, ...prev]);
      await new Promise(r => setTimeout(r, 800));
      setOsLogs(prev => [`[${time}] SUBSCRIPTION FILTER: Log filter rule intercepts logs and schedules batch delivery.`, ...prev]);
      await new Promise(r => setTimeout(r, 1000));
      setOsLogs(prev => [`[${time}] KINESIS FIREHOSE: Firehose buffers logs and forwards them to OpenSearch bulk endpoints.`, ...prev]);
    }
    
    setOsState('idle');
    setOsLogs(prev => [`[${time}] ✅ INGESTED: Search documents refreshed and fully indexed.`, ...prev]);
  };

  const resetOsSandbox = () => {
    setOsState('idle');
    setOsLogs([]);
    setOsSearchResults([]);
    setOsSearchQuery('auth-error');
  };

  // QuickSight SPICE states
  const [qsSpiceEnabled, setQsSpiceEnabled] = useState<boolean>(true);
  const [qsQueryLatency, setQsQueryLatency] = useState<number>(15);
  const [qsLogs, setQsLogs] = useState<string[]>([]);
  const [qsQuerying, setQsQuerying] = useState<boolean>(false);

  const runQsDashboardQuery = async () => {
    if (qsQuerying) return;
    setQsQuerying(true);
    setQsLogs([]);
    const time = new Date().toLocaleTimeString();
    setQsLogs(prev => [`[${time}] QUICKSIGHT: Dashboard rendering analytical visualization charts...`, ...prev]);

    await new Promise(r => setTimeout(r, 600));
    if (qsSpiceEnabled) {
      setQsQueryLatency(15); // Sub-second in-memory calculation!
      setQsLogs(prev => [`[${time}] SPICE CACHE HIT: Query completed instantly using Super-fast, Parallel, In-memory Calculation Engine.`, ...prev]);
      setQsLogs(prev => [`[${time}] 🚀 LATENCY: 15ms. Bypassed S3/Athena/Redshift querying and avoided network overhead.`, ...prev]);
    } else {
      setQsQueryLatency(480); // Sluggish direct query!
      setQsLogs(prev => [`[${time}] SPICE CACHE MISS: Querying Amazon Athena and scanning raw data lake S3 files directly.`, ...prev]);
      setQsLogs(prev => [`[${time}] ⚠️ LATENCY: 480ms. High query processing overhead, scanning S3 Parquet paths...`, ...prev]);
    }
    setQsQuerying(false);
  };

  // ==========================================
  // TAB 6 STATE: Streaming Analytics (Flink)
  // ==========================================
  const [flinkStreaming, setFlinkStreaming] = useState<boolean>(false);
  const [flinkEvents, setFlinkEvents] = useState<FlinkEvent[]>([]);
  const [flinkLogs, setFlinkLogs] = useState<string[]>([]);
  const [flinkWindowCount, setFlinkWindowCount] = useState<number>(0);
  const [flinkWindowSum, setFlinkWindowSum] = useState<number>(0);
  const [flinkFraudCount, setFlinkFraudCount] = useState<number>(0);

  const toggleFlinkStreaming = () => {
    if (flinkStreaming) {
      setFlinkStreaming(false);
      setFlinkLogs((prev) => [`[${new Date().toLocaleTimeString()}] Flink stream processor paused.`, ...prev]);
    } else {
      setFlinkStreaming(true);
      setFlinkEvents([]);
      setFlinkLogs([
        `[${new Date().toLocaleTimeString()}] Flink streaming consumer subscribed to Amazon MSK topic "user-transactions".`,
        '⚙️ FLINK STATE: Initialized 10-second sliding event aggregation window (Slide: 2 seconds).'
      ]);
      setFlinkWindowCount(0);
      setFlinkWindowSum(0);
      setFlinkFraudCount(0);
    }
  };

  useEffect(() => {
    if (!flinkStreaming) return;

    const interval = setInterval(() => {
      const isFraud = Math.random() > 0.85;
      const amount = isFraud ? Math.floor(Math.random() * 5000) + 4000 : Math.floor(Math.random() * 200) + 10;
      const locations = ['New York', 'London', 'Berlin', 'Tokyo', 'Unknown Proxy'];
      const location = isFraud ? 'Unknown Proxy' : locations[Math.floor(Math.random() * locations.length)];
      
      const newEvent: FlinkEvent = {
        id: `txn-${Math.floor(Math.random() * 90000) + 10000}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        amount,
        location,
        status: isFraud ? 'FRAUD_SUSPECT' : 'APPROVED'
      };

      setFlinkEvents((prev) => [newEvent, ...prev].slice(0, 8));
      
      // Update Flink Window Aggregates
      setFlinkWindowCount((c) => c + 1);
      setFlinkWindowSum((s) => s + amount);
      if (isFraud) {
        setFlinkFraudCount((f) => f + 1);
        setFlinkLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] 🚨 FLINK ALERT: Stateful window logic flags anomalous transaction ${newEvent.id} for $${amount} from location [${location}]. Status set to FRAUD_SUSPECT.`,
          ...prev
        ]);
      } else {
        setFlinkLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] Event aggregated: ${newEvent.id} ($${amount}) approved from [${location}].`,
          ...prev
        ]);
      }

    }, 2000);

    return () => clearInterval(interval);
  }, [flinkStreaming]);

  // ==========================================
  // TAB 7 STATE: Ingestion Sandbox
  // ==========================================
  const [ingestionType, setIngestionType] = useState<'streaming' | 'batch'>('streaming');
  const [sandboxState, setSandboxState] = useState<'idle' | 'ingesting' | 'aggregating' | 'storing' | 'indexing' | 'visualizing' | 'completed'>('idle');
  const [sandboxLogs, setSandboxLogs] = useState<string[]>([]);
  const [telemetryData, setTelemetryData] = useState<DataLakeRecord[]>([
    { timestamp: '11:00', recordsIngested: 4000, queryLatencyMs: 15 },
    { timestamp: '11:05', recordsIngested: 8500, queryLatencyMs: 12 },
    { timestamp: '11:10', recordsIngested: 12000, queryLatencyMs: 9 }
  ]);

  const addSandboxLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setSandboxLogs((prev) => [`[${time}] ${msg}`, ...prev]);
  };

  const triggerIngestionSandbox = async () => {
    if (sandboxState !== 'idle') return;

    setSandboxLogs([]);
    setSandboxState('ingesting');
    
    if (ingestionType === 'streaming') {
      addSandboxLog('🚀 INGESTION TRIGGERED: Real-Time Big Data Streaming pipeline activated.');
      addSandboxLog('📡 CLIENT: Device payloads stream into Amazon MSK (Apache Kafka) partitioned topics.');
      
      await new Promise((r) => setTimeout(r, 1500));
      setSandboxState('aggregating');
      addSandboxLog('⚙️ STREAM PROCESSING: Apache Flink pulls stream brokers, aggregating counts and telemetry metrics in a 5s event sliding window.');

      await new Promise((r) => setTimeout(r, 1500));
      setSandboxState('storing');
      addSandboxLog('🪣 DATA LAKE: Structured metrics written asynchronously to S3 refined bucket segmented by partition key paths.');

      await new Promise((r) => setTimeout(r, 1500));
      setSandboxState('indexing');
      addSandboxLog('🔎 OPENSEARCH: Indexing telemetry logs directly to Amazon OpenSearch shards cluster. Replica shards sync metrics.');

      await new Promise((r) => setTimeout(r, 1500));
      setSandboxState('visualizing');
      addSandboxLog('📊 BI QUICKSIGHT: Caching dataset to SPICE In-Memory engine for real-time visual representation.');

      await new Promise((r) => setTimeout(r, 1500));
      setSandboxState('completed');
      addSandboxLog('✅ SUCCESS: Streaming pipeline processing completed. Real-time Recharts visual graphs mapped.');
      
      setTelemetryData((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          recordsIngested: Math.floor(Math.random() * 8000) + 15000,
          queryLatencyMs: Math.floor(Math.random() * 5) + 3
        }
      ]);

    } else {
      addSandboxLog('🚀 INGESTION TRIGGERED: Batch Data Lakehouse pipeline activated.');
      addSandboxLog('🛢️ BATCH INGEST: Dumping database transaction logs in batches directly into S3 Raw backup bucket.');

      await new Promise((r) => setTimeout(r, 1500));
      setSandboxState('aggregating');
      addSandboxLog('⚙️ GLUE ETL: Launching serverless AWS Glue Spark ETL cluster. Schema mapped and converted to columnar Parquet.');

      await new Promise((r) => setTimeout(r, 1500));
      setSandboxState('storing');
      addSandboxLog('🪣 COLUMNAR LAKEHOUSE: Columnar Parquet objects cataloged and partitioned efficiently inside S3 refined buckets.');

      await new Promise((r) => setTimeout(r, 1500));
      setSandboxState('indexing');
      addSandboxLog('📖 GLUE CATALOG: Crawler scans refined S3 prefixes, populating Hive schemas inside Glue Data Catalog.');

      await new Promise((r) => setTimeout(r, 1500));
      setSandboxState('visualizing');
      addSandboxLog('🔍 ATHENA SQL: Coordinator parses query and distributes work tasks to scan-nodes querying raw Parquet.');

      await new Promise((r) => setTimeout(r, 1500));
      setSandboxState('completed');
      addSandboxLog('✅ SUCCESS: Batch ingestion complete. Athena query scanned 120MB, updating charts.');

      setTelemetryData((prev) => [
        ...prev,
        {
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          recordsIngested: Math.floor(Math.random() * 50000) + 80000,
          queryLatencyMs: Math.floor(Math.random() * 150) + 200
        }
      ]);
    }
  };

  const resetSandbox = () => {
    setSandboxState('idle');
    setSandboxLogs([]);
  };

  return (
    <div className="da-container animate-fadeIn">
      <style>{`
        .da-container {
          font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
          color: var(--da-text);
          background-color: var(--da-bg);
          padding: 24px;
          border-radius: 16px;
          transition: all 0.25s ease;

          /* Light Mode Colors */
          --da-bg: #f8fafc;
          --da-text: #1e293b;
          --da-text-title: #0f172a;
          --da-text-muted: #475569;
          --da-card-bg: rgba(255, 255, 255, 0.75);
          --da-card-border: rgba(226, 232, 240, 0.85);
          --da-card-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.08), 0 2px 8px -1px rgba(148, 163, 184, 0.04);
          
          --da-tab-bg: rgba(255, 255, 255, 0.85);
          --da-tab-border: rgba(226, 232, 240, 0.85);
          --da-tab-text: #475569;
          --da-tab-hover-bg: #f8fafc;
          --da-tab-hover-border: #cbd5e1;
          --da-tab-hover-text: #1e293b;
          
          --da-input-bg: #ffffff;
          --da-input-color: #0f172a;
          --da-input-border: rgba(226, 232, 240, 0.85);
          
          --da-btn-sec-bg: #ffffff;
          --da-btn-sec-color: #334155;
          --da-btn-sec-border: #cbd5e1;
          --da-btn-sec-hover-bg: #f1f5f9;
          
          --da-code-bg: #090d16;
          --da-code-border: #1e293b;
          --da-code-text: #94a3b8;
          
          --da-table-border: rgba(226, 232, 240, 0.85);
          --da-table-th-bg: #f8fafc;
          --da-table-th-text: #475569;
          --da-table-td-text: #334155;
          --da-table-hover-bg: #f8fafc;

          --da-main-content-bg: #ffffff;
          --da-main-content-border: #e2e8f0;

          /* SVG standard colors */
          --da-svg-bg: #f8fafc;
          --da-svg-grid: radial-gradient(rgba(14, 165, 233, 0.08) 1.5px, transparent 1.5px);
          --da-svg-text-dark: #1e293b;
          --da-svg-text-light: #ffffff;
          
          --da-svg-green-bg: #effaf3;
          --da-svg-green-border: #10b981;
          --da-svg-green-text: #15803d;
          --da-svg-green-subtext: #166534;
          
          --da-svg-red-bg: #fdf2f2;
          --da-svg-red-border: #f87171;
          --da-svg-red-text: #b91c1c;
          --da-svg-red-subtext: #991b1b;
          
          --da-svg-amber-bg: #fff7ed;
          --da-svg-amber-border: #ea580c;
          --da-svg-amber-text: #c2410c;
          --da-svg-amber-subtext: #7c2d12;

          --da-svg-purple-bg: #faf5ff;
          --da-svg-purple-border: #a855f7;
          --da-svg-purple-text: #7e22ce;
          --da-svg-purple-subtext: #581c87;

          --da-svg-blue-bg: #eff6ff;
          --da-svg-blue-border: #3b82f6;
          --da-svg-blue-text: #1d4ed8;
          --da-svg-blue-subtext: #1e40af;

          --da-svg-subnet-bg: rgba(243, 244, 246, 0.45);
          --da-svg-subnet-border: #9ca3af;
          --da-svg-subnet-text: #374151;

          --da-svg-node-fill: #ffffff;
          --da-svg-node-border: #cbd5e1;
        }

        .dark .da-container {
          background-color: #020617 !important;
          color: #cbd5e1 !important;

          /* Dark Mode Colors */
          --da-bg: #020617;
          --da-text: #cbd5e1;
          --da-text-title: #ffffff;
          --da-text-muted: #94a3b8;
          --da-card-bg: rgba(15, 23, 42, 0.75);
          --da-card-border: rgba(51, 65, 85, 0.6);
          --da-card-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          
          --da-tab-bg: rgba(15, 23, 42, 0.6);
          --da-tab-border: rgba(51, 65, 85, 0.6);
          --da-tab-text: #94a3b8;
          --da-tab-hover-bg: rgba(30, 41, 59, 0.8);
          --da-tab-hover-border: rgba(51, 65, 85, 0.6);
          --da-tab-hover-text: #f8fafc;
          
          --da-input-bg: #0f172a;
          --da-input-color: #f1f5f9;
          --da-input-border: rgba(51, 65, 85, 0.8);
          
          --da-btn-sec-bg: rgba(15, 23, 42, 0.8);
          --da-btn-sec-color: #cbd5e1;
          --da-btn-sec-border: rgba(51, 65, 85, 0.6);
          --da-btn-sec-hover-bg: rgba(30, 41, 59, 0.8);
          
          --da-code-bg: #020617;
          --da-code-border: rgba(51, 65, 85, 0.6);
          --da-code-text: #38bdf8;
          
          --da-table-border: rgba(51, 65, 85, 0.6);
          --da-table-th-bg: rgba(15, 23, 42, 0.8);
          --da-table-th-text: #94a3b8;
          --da-table-td-text: #cbd5e1;
          --da-table-hover-bg: rgba(30, 41, 59, 0.4);

          --da-main-content-bg: rgba(15, 23, 42, 0.5);
          --da-main-content-border: rgba(51, 65, 85, 0.6);

          /* SVG standard colors */
          --da-svg-bg: #020617;
          --da-svg-grid: radial-gradient(rgba(51, 65, 85, 0.5) 1.2px, transparent 1.2px);
          --da-svg-text-dark: #cbd5e1;
          --da-svg-text-light: #ffffff;
          
          --da-svg-green-bg: rgba(16, 185, 129, 0.15);
          --da-svg-green-border: rgba(16, 185, 129, 0.4);
          --da-svg-green-text: #4ade80;
          --da-svg-green-subtext: #a7f3d0;
          
          --da-svg-red-bg: rgba(239, 68, 68, 0.15);
          --da-svg-red-border: rgba(239, 68, 68, 0.5);
          --da-svg-red-text: #f87171;
          --da-svg-red-subtext: #fca5a5;
          
          --da-svg-amber-bg: rgba(245, 158, 11, 0.15);
          --da-svg-amber-border: rgba(245, 158, 11, 0.5);
          --da-svg-amber-text: #fbbf24;
          --da-svg-amber-subtext: #fef08a;

          --da-svg-purple-bg: rgba(168, 85, 247, 0.15);
          --da-svg-purple-border: rgba(168, 85, 247, 0.5);
          --da-svg-purple-text: #e9d5ff;
          --da-svg-purple-subtext: #f3e8ff;

          --da-svg-blue-bg: rgba(59, 130, 246, 0.15);
          --da-svg-blue-border: rgba(59, 130, 246, 0.5);
          --da-svg-blue-text: #93c5fd;
          --da-svg-blue-subtext: #bfdbfe;

          --da-svg-subnet-bg: rgba(15, 23, 42, 0.45);
          --da-svg-subnet-border: rgba(148, 163, 184, 0.4);
          --da-svg-subnet-text: #cbd5e1;

          --da-svg-node-fill: rgba(15, 23, 42, 0.8);
          --da-svg-node-border: rgba(51, 65, 85, 0.8);
        }

        .da-card {
          background: var(--da-card-bg);
          border: 1.5px solid var(--da-card-border);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(16px);
          margin-bottom: 24px;
          box-shadow: var(--da-card-shadow);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .da-card:hover {
          border-color: #0284c7;
          box-shadow: 0 12px 24px -4px rgba(2, 132, 199, 0.08), 0 4px 12px -2px rgba(2, 132, 199, 0.03);
          transform: translateY(-1px);
        }
        .da-card-title {
          font-size: 16.5px;
          font-weight: 800;
          color: var(--da-text-title);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.02em;
        }
        .da-card-desc {
          font-size: 12.5px;
          color: var(--da-text-muted);
          line-height: 1.65;
        }
        .da-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          border-bottom: 1.5px solid var(--da-card-border);
          padding-bottom: 10px;
        }
        .da-tb {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 12px;
          border: 1.5px solid var(--da-tab-border);
          font-size: 12px;
          font-weight: 600;
          color: var(--da-tab-text);
          background: var(--da-tab-bg);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease-in-out;
          outline: none;
        }
        .da-tb:hover {
          background: var(--da-tab-hover-bg);
          border-color: var(--da-tab-hover-border);
          color: var(--da-tab-hover-text);
        }
        .da-tb.da-on {
          background: #0284c7 !important;
          color: #ffffff !important;
          border-color: #0284c7 !important;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25) !important;
        }

        /* Custom dynamic visualizer backdrops */
        .da-svg-bg {
          background-color: var(--da-svg-bg) !important;
          background-image: var(--da-svg-grid) !important;
          background-size: 16px 16px;
          border: 1.5px solid var(--da-card-border);
          transition: all 0.25s ease;
        }
        
        .active-svg-glow {
          animation: activeGlow 2s infinite alternate;
        }
        @keyframes activeGlow {
          0% { filter: drop-shadow(0 0 2px rgba(14, 165, 233, 0.15)); }
          100% { filter: drop-shadow(0 0 8px rgba(14, 165, 233, 0.45)); }
        }

        /* hardware-accelerated marching ants streams */
        .da-flow-blue, .da-flow-sky {
          stroke: #0ea5e9;
          stroke-dasharray: 6,4;
          animation: flowDash 1s linear infinite;
        }
        .da-flow-green {
          stroke: #10b981;
          stroke-dasharray: 6,4;
          animation: flowDash 0.8s linear infinite;
        }
        .da-flow-purple {
          stroke: #a855f7;
          stroke-dasharray: 6,4;
          animation: flowDash 1s linear infinite;
        }
        .da-flow-orange {
          stroke: #f97316;
          stroke-dasharray: 6,4;
          animation: flowDash 1.2s linear infinite;
        }
        @keyframes flowDash {
          to {
            stroke-dashoffset: -20;
          }
        }

        .da-node-btn {
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .da-node-btn:hover {
          filter: drop-shadow(0 4px 12px rgba(14, 165, 233, 0.45));
          opacity: 0.95;
        }
        
        .pulse-circle {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        /* Centralized Tailwind Overrides under .da-container */
        .da-container .text-gray-900 {
          color: var(--da-text-title) !important;
        }
        .da-container .text-gray-800 {
          color: var(--da-text-title) !important;
        }
        .da-container .text-gray-700 {
          color: var(--da-text-title) !important;
        }
        .da-container .text-gray-650 {
          color: var(--da-text-title) !important;
        }
        .da-container .text-gray-600 {
          color: var(--da-text-muted) !important;
        }
        .da-container .text-gray-500 {
          color: var(--da-text-muted) !important;
        }
        .da-container .text-slate-900 {
          color: var(--da-text-title) !important;
        }
        .da-container .text-slate-800 {
          color: var(--da-text-title) !important;
        }
        .da-container .text-slate-700 {
          color: var(--da-text-title) !important;
        }
        .da-container .text-slate-650 {
          color: var(--da-text-title) !important;
        }
        .da-container .text-slate-660 {
          color: var(--da-text-muted) !important;
        }
        .da-container .text-slate-600 {
          color: var(--da-text-muted) !important;
        }
        .da-container .text-slate-500 {
          color: var(--da-text-muted) !important;
        }
        .da-container .bg-white {
          background-color: var(--da-card-bg) !important;
        }
        .da-container .bg-slate-50 {
          background-color: var(--da-bg) !important;
        }
        .da-container .bg-slate-100 {
          background-color: var(--da-bg) !important;
        }
        .da-container .hover\:bg-slate-50:hover,
        .da-container .hover\:bg-slate-100:hover,
        .da-container .hover\:bg-slate-200:hover,
        .da-container .hover\:bg-sky-50:hover {
          background-color: var(--da-tab-hover-bg) !important;
        }
        .da-container .border-gray-200,
        .da-container .border-slate-200,
        .da-container .border-slate-100,
        .da-container .border-slate-150 {
          border-color: var(--da-card-border) !important;
        }

        .dark .da-sec,
        .dark .da-kk {
          color: #94a3b8 !important;
        }
        .dark .da-log,
        .dark .da-terminal {
          background: #020617 !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #38bdf8 !important;
        }
        .dark .da-btn {
          background: rgba(15, 23, 42, 0.8) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .da-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
        }
        .dark .da-met {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark ul.da-ck li {
          color: #cbd5e1 !important;
        }
        .dark .da-inst,
        .dark .da-instance {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .da-inst .meta,
        .dark .da-instance .meta {
          color: #94a3b8 !important;
        }

        /* Node Status Overrides */
        .dark .da-ok {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: #4ade80 !important;
        }
        .dark .da-warm {
          border-color: #f59e0b !important;
          background: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
        }
        .dark .da-drain {
          border-color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }
        .dark .da-down {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.15) !important;
          color: #f87171 !important;
        }

        /* Alert dark overrides */
        .dark .da-container .bg-blue-50 {
          background-color: rgba(59, 130, 246, 0.15) !important;
          color: #93c5fd !important;
        }
        .dark .da-container .bg-purple-50 {
          background-color: rgba(168, 85, 247, 0.15) !important;
          color: #e9d5ff !important;
        }
        .dark .da-container .bg-teal-50 {
          background-color: rgba(20, 184, 166, 0.15) !important;
          color: #99f6e4 !important;
        }
        .dark .da-container .bg-emerald-50,
        .dark .da-container .bg-green-50 {
          background-color: rgba(16, 185, 129, 0.15) !important;
          color: #a7f3d0 !important;
        }
        .dark .da-container .bg-amber-50,
        .dark .da-container .bg-orange-50 {
          background-color: rgba(245, 158, 11, 0.15) !important;
          color: #fef08a !important;
        }
        .dark .da-container .text-purple-900 {
          color: #e9d5ff !important;
        }
        .dark .da-container .text-purple-950 {
          color: #ffffff !important;
        }
        .dark .da-container .text-orange-900 {
          color: #fef08a !important;
        }
        .dark .da-container .text-orange-950 {
          color: #ffffff !important;
        }
        .dark .da-container .text-emerald-900 {
          color: #a7f3d0 !important;
        }
        .dark .da-container .text-emerald-950 {
          color: #ffffff !important;
        }

        /* General form overrides */
        .da-container select,
        .da-container input,
        .da-container textarea {
          background-color: var(--da-input-bg) !important;
          color: var(--da-input-color) !important;
          border-color: var(--da-input-border) !important;
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
        `}</style>

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 mb-6">
        <div className="flex items-center gap-2">
          <span className={`p-2 rounded-lg text-white ${provider === 'azure' ? 'bg-blue-600' : provider === 'gcp' ? 'bg-emerald-600' : 'bg-sky-500'}`}>
            <Database className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {provider === 'azure' ? 'Azure Databases & Analytics Visualizer' :
               provider === 'gcp' ? 'Google Cloud Databases & Analytics Visualizer' :
               'AWS Databases & Analytics Visualizer'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {provider === 'azure' ? 'Explore Azure SQL, Cosmos DB partitioning, Synapse Data Lakehouse, Data Factory ETL, Event Hubs, and Stream Analytics' :
               provider === 'gcp' ? 'Explore Cloud SQL/Spanner, Cloud Bigtable, BigQuery Lakehouse, Dataflow ETL, Pub/Sub Streams, and Dataproc Analytics' :
               'Explore RDBMS failures, NoSQL partitions, Lakehouse governance, Redshift warehouses, MSK Streams, and Flink sliding window engines'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs navigation bar */}
      {!isComparative && (
        <div className="da-tabs">
          <button className={`da-tb ${activeTab === 'intro' ? 'da-on' : ''}`} onClick={() => setActiveTab('intro')}>
            <BookOpen className="w-4 h-4" /> 1. Choosing the Right DB &amp; Theory
          </button>
          <button className={`da-tb ${activeTab === 'rdbms' ? 'da-on' : ''}`} onClick={() => setActiveTab('rdbms')}>
            <Server className="w-4 h-4" /> 2. {provider === 'azure' ? 'Azure SQL & Cosmos DB' : provider === 'gcp' ? 'Cloud SQL & Cloud Spanner' : 'RDS & Aurora Cluster'}
          </button>
          <button className={`da-tb ${activeTab === 'nosql' ? 'da-on' : ''}`} onClick={() => setActiveTab('nosql')}>
            <Database className="w-4 h-4" /> 3. NoSQL Suite &amp; Cache-Aside
          </button>
          <button className={`da-tb ${activeTab === 'lakehouse' ? 'da-on' : ''}`} onClick={() => setActiveTab('lakehouse')}>
            <Shield className="w-4 h-4" /> 4. {provider === 'azure' ? 'Synapse & Data Lake Governance' : provider === 'gcp' ? 'BigQuery & Dataplex Governance' : 'Athena & Lake Governance'}
          </button>
          <button className={`da-tb ${activeTab === 'warehousing' ? 'da-on' : ''}`} onClick={() => setActiveTab('warehousing')}>
            <TrendingUp className="w-4 h-4" /> 5. {provider === 'azure' ? 'Synapse Warehousing & DR' : provider === 'gcp' ? 'BigQuery Warehousing & DR' : 'Redshift Warehousing & DR'}
          </button>
          <button className={`da-tb ${activeTab === 'streaming' ? 'da-on' : ''}`} onClick={() => setActiveTab('streaming')}>
            <Activity className="w-4 h-4" /> 6. {provider === 'azure' ? 'Event Hubs & Stream Analytics' : provider === 'gcp' ? 'Pub/Sub & Dataflow Analytics' : 'Streaming Kafka & Flink'}
          </button>
          <button className={`da-tb ${activeTab === 'ingestion' ? 'da-on' : ''}`} onClick={() => setActiveTab('ingestion')}>
            <LayoutDashboard className="w-4 h-4" /> 7. {provider === 'azure' ? 'Data Factory & Ingestion' : provider === 'gcp' ? 'Dataflow & Dataprep Ingestion' : 'Ingestion Sandbox & OpenSearch'}
          </button>
          <button className={`da-tb ${activeTab === 'unique' ? 'da-on' : ''}`} onClick={() => setActiveTab('unique')}>
            ✨ Unique Features
          </button>
        </div>
      )}

      {isComparative && (
        <DatabasesAndAnalyticsComparativeView onNavigateToDemo={handleNavigateToDemo} />
      )}

      {!isComparative && activeTab === 'unique' && (
        <UniqueDatabasesAndAnalyticsFeatures provider={provider as 'aws' | 'azure' | 'gcp'} />
      )}

      {!isComparative && activeTab !== 'unique' && (
        <Translate>
          <>

      {/* ========================================================================= */}
      {/* TAB 1: HOW TO CHOOSE THE RIGHT DATABASE & SELECTOR WIZARD                  */}
      {/* ========================================================================= */}
      {activeTab === 'intro' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Interactive Selector Wizard Card */}
            <div className="lg:col-span-5 da-card flex flex-col justify-between">
              <div>
                <h3 className="da-card-title text-sky-700">
                  <Sliders className="w-5 h-5" /> AWS Workload Database Selector Wizard
                </h3>
                <p className="da-card-desc mb-5">
                  Answer 4 simple architectural questions to dynamically evaluate your application parameters and recommend the optimal AWS data store.
                </p>

                {wizardStep === 1 && (
                  <div className="space-y-4 animate-fadeIn">
                    <span className="da-label font-bold text-slate-800 text-xs">Step 1: What is your primary data format / structure?</span>
                    <div className="grid grid-cols-1 gap-2.5">
                      <button onClick={() => handleSelectAnswer('structure', 'relational')} className="p-3 text-left border border-slate-200 rounded-xl hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold">
                        📑 Relational: Highly structured tables, strict SQL schemas, rigid ACID compliance
                      </button>
                      <button onClick={() => handleSelectAnswer('structure', 'semi-structured')} className="p-3 text-left border border-slate-200 rounded-xl hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold">
                        ⚡ Key-Value / Semi-structured: Dynamic key value scales, high writes, no joins
                      </button>
                      <button onClick={() => handleSelectAnswer('structure', 'json-docs')} className="p-3 text-left border border-slate-200 rounded-xl hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold">
                        📂 Document: Nested hierarchical JSON documents (MongoDB compatible)
                      </button>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && (
                  <div className="space-y-4 animate-fadeIn">
                    <span className="da-label font-bold text-slate-800 text-xs">Step 2: What are your data latency requirements?</span>
                    <div className="grid grid-cols-1 gap-2.5">
                      <button onClick={() => handleSelectAnswer('latency', 'sub-ms')} className="p-3 text-left border border-slate-200 rounded-xl hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold">
                        ⏱️ Sub-millisecond: Ultra fast in-memory query retrieval (cache memory)
                      </button>
                      <button onClick={() => handleSelectAnswer('latency', 'single-digit-ms')} className="p-3 text-left border border-slate-200 rounded-xl hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold">
                        ⚡ Single-digit millisecond: Fast sharded transaction writes/reads
                      </button>
                      <button onClick={() => handleSelectAnswer('latency', 'analytical-olap')} className="p-3 text-left border border-slate-200 rounded-xl hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold">
                        📊 Analytical (OLAP): Columnar aggregations, complex data warehouse metrics
                      </button>
                    </div>
                  </div>
                )}

                {wizardStep === 3 && (
                  <div className="space-y-4 animate-fadeIn">
                    <span className="da-label font-bold text-slate-800 text-xs">Step 3: What is the relationship mapping complexity?</span>
                    <div className="grid grid-cols-1 gap-2.5">
                      <button onClick={() => handleSelectAnswer('relations', 'no-relations')} className="p-3 text-left border border-slate-200 rounded-xl hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold">
                        📦 Independent rows: Simple lookups by single primary key partitions
                      </button>
                      <button onClick={() => handleSelectAnswer('relations', 'heavy-joins')} className="p-3 text-left border border-slate-200 rounded-xl hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold">
                        🔗 Primary-Foreign keys: Multi-table relational joins and structured SQL relations
                      </button>
                      <button onClick={() => handleSelectAnswer('relations', 'deep-networks')} className="p-3 text-left border border-slate-200 rounded-xl hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold">
                        🕸️ Graph Network: Many-to-many nodes, fraud rings, friend recommended products
                      </button>
                    </div>
                  </div>
                )}

                {wizardStep === 4 && (
                  <div className="space-y-4 animate-fadeIn">
                    <span className="da-label font-bold text-slate-800 text-xs">Step 4: Select scaling and ingestion traits:</span>
                    <div className="grid grid-cols-1 gap-2.5">
                      <button onClick={() => handleSelectAnswer('scaling', 'auto-scaling')} className="p-3 text-left border border-slate-200 rounded-xl hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold">
                        📈 Massive global writes: Automatically scaled throughput volumes (serverless)
                      </button>
                      <button onClick={() => handleSelectAnswer('scaling', 'serverless-queries')} className="p-3 text-left border border-slate-200 rounded-xl hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold">
                        ☁️ Zero-Compute Queries: Serverless SQL scanning over S3 cold storage files
                      </button>
                      <button onClick={() => handleSelectAnswer('scaling', 'append-only-time')} className="p-3 text-left border border-slate-200 rounded-xl hover:bg-sky-50 hover:border-sky-300 text-xs font-semibold">
                        ⏱️ Time-Series: Append-only chronological tracking of sensor metrics
                      </button>
                    </div>
                  </div>
                )}

                {wizardStep === 5 && (
                  <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 text-center animate-fadeIn">
                    <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider block mb-1">Recommended AWS Database</span>
                    <h4 className="text-xl font-bold text-sky-950 mb-2">{recommendedDb}</h4>
                    <p className="text-xs text-sky-900 leading-relaxed max-w-sm mx-auto mb-4 font-medium">
                      {recReason}
                    </p>
                    <button onClick={resetWizard} className="px-4 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-500 transition-all flex items-center gap-1.5 mx-auto">
                      <RefreshCw className="w-3.5 h-3.5" /> Start Selector Wizard Over
                    </button>
                  </div>
                )}
              </div>

              {wizardStep < 5 && (
                <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-6">
                  <span className="text-[10px] font-bold text-slate-400">STEP {wizardStep} OF 4</span>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-sky-500 transition-all duration-300" style={{ width: `${(wizardStep / 4) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* In-depth Database Theory Panels */}
            <div className="lg:col-span-7 da-card space-y-4">
              <h3 className="da-card-title text-slate-800">
                <BookOpen className="w-5 h-5 text-sky-500" /> Deep-Dive AWS Database Engine Architecture &amp; Theory
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="border border-slate-150 rounded-xl p-3 bg-slate-50 hover:border-sky-300 transition-all">
                  <span className="font-bold text-sky-700 block mb-1">📂 Amazon DocumentDB (JSON Document)</span>
                  <p className="text-slate-650 leading-relaxed text-[11px]">
                    A fully managed MongoDB-compatible document store that decouples compute and storage. It replicates log data 6-ways across 3 AZs. Reads scale up to 15 distributed compute replicas dynamically without data duplication copies.
                  </p>
                </div>

                <div className="border border-slate-150 rounded-xl p-3 bg-slate-50 hover:border-sky-300 transition-all">
                  <span className="font-bold text-purple-700 block mb-1">🕸️ Amazon Neptune &amp; Neptune Streams</span>
                  <p className="text-slate-650 leading-relaxed text-[11px]">
                    Graph store running Gremlin (property graph) and SPARQL (RDF RDF Triple). **Neptune Streams** logs live CDC graph operations (node/edge mutations), letting you run downstream Lambda events, replicate regions, or sync index logs inside OpenSearch.
                  </p>
                </div>

                <div className="border border-slate-150 rounded-xl p-3 bg-slate-50 hover:border-sky-300 transition-all">
                  <span className="font-bold text-emerald-700 block mb-1">⚡ Amazon Keyspaces (Cassandra Store)</span>
                  <p className="text-slate-650 leading-relaxed text-[11px]">
                    A serverless, scalable wide-column database compatible with Apache Cassandra. Applications query metrics using CQL (Cassandra Query Language). Handles decentralized node partitioning with single-digit millisecond latency.
                  </p>
                </div>

                <div className="border border-slate-150 rounded-xl p-3 bg-slate-50 hover:border-sky-300 transition-all">
                  <span className="font-bold text-orange-700 block mb-1">📈 Amazon Timestream (Time-Series)</span>
                  <p className="text-slate-650 leading-relaxed text-[11px]">
                    Serverless metric engine processing trillions of daily sensor feeds. Utilizes a decoupled architecture tiering metric storage: hot, sub-ms metric writes are indexed in-memory, then automatically migrated to cheap magnetic disks for historical reports.
                  </p>
                </div>
              </div>

              <div className="bg-sky-50 border border-sky-150 rounded-xl p-3 text-[11px] leading-relaxed text-slate-700 flex gap-2">
                <Info className="w-5 h-5 text-sky-600 shrink-0" />
                <div>
                  <span className="font-bold text-sky-950 block">Decoupled Storage Architecture Advantage:</span>
                  Decoupling database compute cores from their physical disk partitions (like Aurora, DocumentDB, and Timestream do) allows AWS to scale disk volumes automatically on-demand up to 128TB, scale compute replicas instantly, and recover from failures in seconds.
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* INTERACTIVE AWS DATABASE CATEGORY ARCHITECTURE EXPLORER BOARD             */}
          {/* ========================================================================= */}
          <div className="da-card bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
            <h3 className="da-card-title text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-sky-500 animate-pulse" /> 🧩 AWS Database Architecture Matrix &amp; Interactive Explorer
            </h3>
            <p className="da-card-desc mb-6 text-slate-650 text-[11px] leading-relaxed">
              AWS offers specialized database engines optimized for unique workload profiles rather than forcing all patterns into a single database. Review the visual database categories below, toggle to explore their active architectural topologies, configurations, and core capability comparisons.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Selector Panel: Category list */}
              <div className="lg:col-span-4 flex flex-col gap-2.5 max-h-[500px] overflow-y-auto pr-2">
                {Object.entries(CATEGORY_MAP).map(([key, item]) => {
                  const isActive = selectedCategory === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={`p-3 text-left border rounded-xl transition-all duration-200 text-xs flex items-center justify-between font-semibold outline-none ${
                        isActive
                          ? 'bg-sky-50 border-sky-400 text-sky-950 shadow-sm ring-1 ring-sky-300'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-sm">{item.emoji}</span>
                        <div className="text-left">
                          <span className="block font-bold text-[11.5px]">{item.title.split(' (')[0]}</span>
                          <span className="block text-[9.5px] text-slate-400 font-medium truncate max-w-[170px]">{item.awsServices}</span>
                        </div>
                      </div>
                      <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-extrabold ${item.badgeClass}`}>
                        {key.toUpperCase()}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Right Panel: Detail and Topology Diagram */}
              <div className="lg:col-span-8 border border-slate-150 rounded-2xl p-5 bg-slate-50/50 flex flex-col justify-between">
                <div>
                  {/* Category Metadata Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-3 mb-4 gap-2">
                    <div className="text-left">
                      <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                        <span className="text-base">{CATEGORY_MAP[selectedCategory].emoji}</span>
                        {CATEGORY_MAP[selectedCategory].title}
                      </h4>
                      <p className="text-[10px] text-sky-700 font-bold mt-0.5">
                        {isAzure ? 'Azure Services: ' : isGcp ? 'GCP Services: ' : 'AWS Services: '}{getProviderServices(selectedCategory)}
                      </p>
                    </div>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase self-start sm:self-center ${CATEGORY_MAP[selectedCategory].badgeClass}`}>
                      {selectedCategory}
                    </span>
                  </div>

                  <p className="text-[11.5px] leading-relaxed text-slate-655 text-left mb-4 font-medium">
                    {CATEGORY_MAP[selectedCategory].desc}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10.5px] mb-4 text-left">
                    <div className="bg-white border border-slate-200 rounded-xl p-3">
                      <span className="font-bold text-slate-800 block mb-1">⚙️ Types &amp; Configurations:</span>
                      <span className="text-slate-600 leading-normal block">{CATEGORY_MAP[selectedCategory].engineTypes}</span>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-xl p-3">
                      <span className="font-bold text-slate-800 block mb-1">⚡ Storage &amp; Scaling Strategy:</span>
                      <span className="text-slate-600 leading-normal block">{CATEGORY_MAP[selectedCategory].storageScaling}</span>
                    </div>
                  </div>

                  {/* Operational Topology SVG Diagram */}
                  <div className="w-full h-[180px] rounded-xl border border-slate-200 relative flex items-center justify-center shadow-inner bg-white overflow-hidden mb-4">
                    
                    {selectedCategory === 'rdbms' && (
                      <svg className="w-full h-full max-w-[480px] da-svg-bg" viewBox="0 0 480 160">
                        <defs>
                          <marker id="ex-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--da-svg-node-border)" />
                          </marker>
                        </defs>
                        <path d="M 70 80 L 130 50" fill="none" stroke="var(--da-svg-blue-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        <path d="M 70 80 L 130 110" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1" strokeDasharray="3 2" markerEnd="url(#ex-arrow)" />
                        <path d="M 220 50 L 340 80" fill="none" stroke="var(--da-svg-blue-border)" strokeWidth="2.5" strokeDasharray="5,3" className="da-flow-blue" />
                        <path d="M 220 110 L 340 80" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        
                        <g transform="translate(10, 55)">
                          <rect width="60" height="50" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <text x="30" y="24" fill="var(--da-svg-text-dark)" fontSize="8" fontWeight="bold" textAnchor="middle">📱 CLIENT</text>
                          <text x="30" y="38" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">SQL Aggs</text>
                        </g>
                        <g transform="translate(130, 25)">
                          <rect width="90" height="50" rx="8" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="2" />
                          <text x="45" y="22" fill="var(--da-svg-green-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">🛢️ WRITER (1A)</text>
                          <text x="45" y="35" fill="var(--da-text)" fontSize="7.5" textAnchor="middle">Primary Node</text>
                          <text x="45" y="44" fill="var(--da-svg-green-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Status: Active</text>
                        </g>
                        <g transform="translate(130, 85)">
                          <rect width="90" height="50" rx="8" fill="var(--da-svg-blue-bg)" stroke="var(--da-svg-blue-border)" strokeWidth="2" />
                          <text x="45" y="22" fill="var(--da-svg-blue-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">🔌 READER (1B)</text>
                          <text x="45" y="35" fill="var(--da-text)" fontSize="7.5" textAnchor="middle">Replica Node</text>
                          <text x="45" y="44" fill="var(--da-svg-blue-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Status: Standby</text>
                        </g>
                        <g transform="translate(340, 45)">
                          <rect width="120" height="70" rx="10" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="2.5" />
                          <text x="60" y="26" fill="var(--da-svg-amber-text)" fontSize="10.5" fontWeight="extrabold" textAnchor="middle">⚡ SHARED STORAGE</text>
                          <text x="60" y="44" fill="var(--da-svg-amber-text)" fontSize="8" textAnchor="middle">6-way Replicated Pool</text>
                          <text x="60" y="58" fill="var(--da-svg-green-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">Auto-scales up to 128TB</text>
                        </g>
                      </svg>
                    )}

                    {selectedCategory === 'nosql_kv' && (
                      <svg className="w-full h-full max-w-[480px] da-svg-bg" viewBox="0 0 480 160">
                        <defs>
                          <marker id="ex-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--da-svg-node-border)" />
                          </marker>
                        </defs>
                        <path d="M 75 80 H 130" fill="none" stroke="var(--da-svg-purple-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        <path d="M 215 80 L 290 40" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                        <path d="M 215 80 H 290" fill="none" stroke="var(--da-svg-purple-border)" strokeWidth="2" strokeDasharray="5,3" className="da-flow-purple" />
                        <path d="M 215 80 L 290 120" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                        
                        <g transform="translate(15, 55)">
                          <rect width="60" height="50" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <text x="30" y="24" fill="var(--da-svg-text-dark)" fontSize="8" fontWeight="bold" textAnchor="middle">📱 CLIENT</text>
                          <text x="30" y="38" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">key: user_412</text>
                        </g>
                        <g transform="translate(130, 50)">
                          <rect width="85" height="60" rx="8" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="2" />
                          <text x="42.5" y="22" fill="var(--da-svg-purple-text)" fontSize="9" fontWeight="extrabold" textAnchor="middle">🔑 HASH ENGINE</text>
                          <text x="42.5" y="38" fill="var(--da-svg-purple-text)" fontSize="7.5" textAnchor="middle">Computes MD5/SHA</text>
                          <text x="42.5" y="48" fill="var(--da-svg-purple-text)" fontSize="7" fontStyle="italic" textAnchor="middle">Partition Routing</text>
                        </g>
                        
                        {/* Partitions */}
                        <g transform="translate(290, 20)">
                          <rect width="170" height="30" rx="4" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <text x="10" y="18" fill="var(--da-text-muted)" fontSize="8.5" fontWeight="bold">Partition 0 (SSD)</text>
                          <text x="160" y="18" fill="var(--da-text-muted)" fontSize="8" textAnchor="end">Slots: 0k - 10k</text>
                        </g>
                        <g transform="translate(290, 65)">
                          <rect width="170" height="30" rx="4" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1.5" />
                          <text x="10" y="18" fill="var(--da-svg-purple-text)" fontSize="8.5" fontWeight="bold">Partition 1 (SSD) MATCH</text>
                          <text x="160" y="18" fill="var(--da-svg-purple-text)" fontSize="8" fontWeight="bold" textAnchor="end">⚡ 2.5ms lookup</text>
                        </g>
                        <g transform="translate(290, 110)">
                          <rect width="170" height="30" rx="4" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <text x="10" y="18" fill="var(--da-text-muted)" fontSize="8.5" fontWeight="bold">Partition 2 (SSD)</text>
                          <text x="160" y="18" fill="var(--da-text-muted)" fontSize="8" textAnchor="end">Slots: 20k+</text>
                        </g>
                      </svg>
                    )}

                    {selectedCategory === 'nosql_doc' && (
                      <svg className="w-full h-full max-w-[480px] da-svg-bg" viewBox="0 0 480 160">
                        <defs>
                          <marker id="ex-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--da-svg-node-border)" />
                          </marker>
                        </defs>
                        <path d="M 85 80 H 135" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        <path d="M 215 80 H 270" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="2" strokeDasharray="5,3" className="da-flow-green" />
                        <path d="M 360 80 H 400" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        
                        <g transform="translate(15, 50)">
                          <rect width="70" height="60" rx="6" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                          <text x="35" y="18" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">📂 JSON DOC</text>
                          <text x="35" y="32" fill="var(--da-text-muted)" fontSize="6.5" textAnchor="middle" fontFamily="monospace">{"{id: 9,"}</text>
                          <text x="35" y="44" fill="var(--da-text-muted)" fontSize="6.5" textAnchor="middle" fontFamily="monospace">{" name: 'A'}"}</text>
                        </g>
                        <g transform="translate(135, 55)">
                          <rect width="80" height="50" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <text x="40" y="24" fill="var(--da-svg-text-dark)" fontSize="8" fontWeight="bold" textAnchor="middle">📱 APP SERVER</text>
                          <text x="40" y="38" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">Parses JSON</text>
                        </g>
                        <g transform="translate(270, 45)">
                          <rect width="90" height="70" rx="10" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="2" />
                          <text x="45" y="22" fill="var(--da-svg-green-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">🛢️ PRIMARY WRITER</text>
                          <text x="45" y="40" fill="var(--da-text)" fontSize="7.5" textAnchor="middle">DocumentDB Node</text>
                          <text x="45" y="56" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">BSON Serializer</text>
                        </g>
                        <g transform="translate(400, 45)">
                          <rect width="70" height="70" rx="10" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" />
                          <text x="35" y="24" fill="var(--da-svg-amber-text)" fontSize="8" fontWeight="extrabold" textAnchor="middle">⚡ STORAGE</text>
                          <text x="35" y="40" fill="var(--da-svg-amber-text)" fontSize="7" textAnchor="middle">Shared Log SSD</text>
                          <text x="35" y="54" fill="var(--da-svg-green-text)" fontSize="7" fontWeight="bold" textAnchor="middle">6-way Sync</text>
                        </g>
                      </svg>
                    )}

                    {selectedCategory === 'object' && (
                      <svg className="w-full h-full max-w-[480px] da-svg-bg" viewBox="0 0 480 160">
                        <defs>
                          <marker id="ex-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--da-svg-node-border)" />
                          </marker>
                        </defs>
                        <path d="M 60 80 H 120" fill="none" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        <path d="M 215 80 H 265" fill="none" stroke="var(--da-svg-amber-border)" strokeWidth="2" strokeDasharray="5,3" className="da-flow-orange" />
                        <path d="M 360 80 H 405" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#ex-arrow)" />
                        
                        <g transform="translate(10, 55)">
                          <circle cx="25" cy="25" r="22" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" />
                          <text x="25" y="28" fill="var(--da-svg-amber-text)" fontSize="9" fontWeight="bold" textAnchor="middle">📁 RAW</text>
                        </g>
                        <g transform="translate(120, 35)">
                          <rect width="95" height="90" rx="8" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="2.5" />
                          <rect x="5" y="5" width="85" height="16" rx="2.5" fill="var(--da-svg-amber-bg)" />
                          <text x="47.5" y="16.5" fill="var(--da-svg-amber-text)" fontSize="8" fontWeight="extrabold" textAnchor="middle">🪣 S3 STANDARD</text>
                          <text x="47.5" y="44" fill="var(--da-svg-amber-text)" fontSize="7.5" textAnchor="middle">Active Object Pool</text>
                          <text x="47.5" y="60" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">11 9s Durability</text>
                          <text x="47.5" y="74" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">Hot Tier - Milliseconds</text>
                        </g>
                        <g transform="translate(265, 35)">
                          <rect width="95" height="90" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" strokeDasharray="3 3" />
                          <rect x="5" y="5" width="85" height="16" rx="2.5" fill="var(--da-svg-node-fill)" />
                          <text x="47.5" y="16.5" fill="var(--da-svg-amber-text)" fontSize="8" fontWeight="bold" textAnchor="middle">S3 INFREQUENT</text>
                          <text x="47.5" y="44" fill="var(--da-text-muted)" fontSize="7.5" textAnchor="middle">Lifecycle Trigger</text>
                          <text x="47.5" y="60" fill="var(--da-svg-amber-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">90-day filter Rule</text>
                          <text x="47.5" y="74" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">Saves 40% cost</text>
                        </g>
                        <g transform="translate(405, 35)">
                          <rect width="70" height="90" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <rect x="4" y="4" width="62" height="16" rx="2" fill="var(--da-svg-node-fill)" />
                          <text x="35" y="15" fill="var(--da-text-muted)" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">GLACIER</text>
                          <text x="35" y="40" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">Archive Tier</text>
                          <text x="35" y="52" fill="var(--da-svg-red-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">🔒 Locked</text>
                          <text x="35" y="66" fill="var(--da-text-muted)" fontSize="6.5" textAnchor="middle">Saves 95% vs</text>
                          <text x="35" y="76" fill="var(--da-text-muted)" fontSize="6.5" textAnchor="middle">S3 Standard</text>
                        </g>
                      </svg>
                    )}

                    {selectedCategory === 'analytics' && (
                      <svg className="w-full h-full max-w-[480px] da-svg-bg" viewBox="0 0 480 160">
                        <defs>
                          <marker id="ex-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--da-svg-node-border)" />
                          </marker>
                        </defs>
                        <path d="M 85 80 H 130" fill="none" stroke="var(--da-svg-red-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        <path d="M 230 80 L 290 45" fill="none" stroke="var(--da-svg-red-border)" strokeWidth="2" strokeDasharray="5,3" className="da-flow-orange" />
                        <path d="M 230 80 L 290 115" fill="none" stroke="var(--da-svg-red-border)" strokeWidth="2" strokeDasharray="5,3" className="da-flow-orange" />
                        <path d="M 380 45 L 430 80" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                        <path d="M 380 115 L 430 80" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                        
                        <g transform="translate(10, 50)">
                          <rect width="75" height="60" rx="6" fill="var(--da-svg-red-bg)" stroke="var(--da-svg-red-border)" strokeWidth="1.5" />
                          <text x="37.5" y="20" fill="var(--da-svg-red-text)" fontSize="8" fontWeight="bold" textAnchor="middle">📊 SQL QUERY</text>
                          <text x="37.5" y="36" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">SELECT SUM()</text>
                          <text x="37.5" y="48" fill="var(--da-text-muted)" fontSize="6.5" textAnchor="middle" fontStyle="italic">from pb_sales</text>
                        </g>
                        <g transform="translate(130, 45)">
                          <rect width="100" height="70" rx="8" fill="var(--da-svg-red-bg)" stroke="var(--da-svg-red-border)" strokeWidth="2" />
                          <text x="50" y="24" fill="var(--da-svg-red-text)" fontSize="9" fontWeight="extrabold" textAnchor="middle">👑 LEADER NODE</text>
                          <text x="50" y="42" fill="var(--da-text)" fontSize="7.5" textAnchor="middle">Compiles Plan</text>
                          <text x="50" y="56" fill="var(--da-svg-red-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Distributes slices</text>
                        </g>
                        
                        {/* Compute Nodes */}
                        <g transform="translate(290, 20)">
                          <rect width="90" height="45" rx="6" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <text x="45" y="18" fill="var(--da-text-muted)" fontSize="8" fontWeight="bold" textAnchor="middle">🖥️ COMPUTE 1</text>
                          <text x="45" y="32" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Executing Scan</text>
                        </g>
                        <g transform="translate(290, 95)">
                          <rect width="90" height="45" rx="6" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <text x="45" y="18" fill="var(--da-text-muted)" fontSize="8" fontWeight="bold" textAnchor="middle">🖥️ COMPUTE 2</text>
                          <text x="45" y="32" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Executing Scan</text>
                        </g>
                        <g transform="translate(400, 45)">
                          <rect width="70" height="70" rx="8" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" />
                          <text x="35" y="26" fill="var(--da-svg-amber-text)" fontSize="8" fontWeight="extrabold" textAnchor="middle">📊 COLUMN</text>
                          <text x="35" y="38" fill="var(--da-svg-amber-text)" fontSize="8" fontWeight="extrabold" textAnchor="middle">BLOCKS</text>
                          <text x="35" y="54" fill="var(--da-svg-amber-text)" fontSize="7" textAnchor="middle">Skips unused</text>
                          <text x="35" y="62" fill="var(--da-svg-amber-text)" fontSize="7" textAnchor="middle">fields (90% faster)</text>
                        </g>
                      </svg>
                    )}

                    {selectedCategory === 'search' && (
                      <svg className="w-full h-full max-w-[480px] da-svg-bg" viewBox="0 0 480 160">
                        <defs>
                          <marker id="ex-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--da-svg-node-border)" />
                          </marker>
                        </defs>
                        <path d="M 85 80 H 130" fill="none" stroke="var(--da-svg-blue-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        <path d="M 230 80 H 275" fill="none" stroke="var(--da-svg-blue-border)" strokeWidth="2.5" strokeDasharray="5,3" className="da-flow-blue" />
                        <path d="M 375 80 H 415" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        
                        <g transform="translate(10, 50)">
                          <rect width="75" height="60" rx="6" fill="var(--da-svg-blue-bg)" stroke="var(--da-svg-blue-border)" strokeWidth="1.5" />
                          <text x="37.5" y="20" fill="var(--da-svg-blue-text)" fontSize="8.5" fontWeight="bold" textAnchor="middle">🔎 USER SEARCH</text>
                          <text x="37.5" y="36" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">Query: "auth*"</text>
                          <text x="37.5" y="48" fill="var(--da-svg-blue-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Fuzzy Match</text>
                        </g>
                        <g transform="translate(130, 45)">
                          <rect width="100" height="70" rx="8" fill="var(--da-svg-blue-bg)" stroke="var(--da-svg-blue-border)" strokeWidth="2" />
                          <text x="50" y="24" fill="var(--da-svg-blue-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">👑 COORDINATOR</text>
                          <text x="50" y="42" fill="var(--da-text)" fontSize="7.5" textAnchor="middle">Master Node</text>
                          <text x="50" y="56" fill="var(--da-svg-blue-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Splits execution</text>
                        </g>
                        <g transform="translate(275, 25)">
                          <rect width="100" height="110" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                          <rect x="5" y="5" width="90" height="14" rx="2" fill="var(--da-svg-green-bg)" />
                          <text x="50" y="15" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">Data Nodes (Shards)</text>
                          
                          <rect x="10" y="26" width="35" height="30" rx="2" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                          <text x="27.5" y="42" fill="var(--da-svg-green-text)" fontSize="8" fontWeight="bold" textAnchor="middle">P0</text>
                          <rect x="55" y="26" width="35" height="30" rx="2" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                          <text x="72.5" y="42" fill="var(--da-svg-green-text)" fontSize="8" fontWeight="bold" textAnchor="middle">P1</text>
                          
                          <rect x="10" y="65" width="35" height="30" rx="2" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1" strokeDasharray="2 2" />
                          <text x="27.5" y="82" fill="var(--da-text-muted)" fontSize="8" textAnchor="middle">R0</text>
                          <rect x="55" y="65" width="35" height="30" rx="2" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1" strokeDasharray="2 2" />
                          <text x="72.5" y="82" fill="var(--da-text-muted)" fontSize="8" textAnchor="middle">R1</text>
                        </g>
                        <g transform="translate(415, 50)">
                          <rect width="55" height="60" rx="6" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <ellipse cx="27.5" cy="20" rx="16" ry="6" fill="var(--da-svg-node-border)" />
                          <text x="27.5" y="38" fill="var(--da-text-muted)" fontSize="7.5" fontWeight="bold" textAnchor="middle">UltraWarm</text>
                          <text x="27.5" y="48" fill="var(--da-text-muted)" fontSize="6.5" textAnchor="middle">S3 cold tier</text>
                        </g>
                      </svg>
                    )}

                    {selectedCategory === 'graph' && (
                      <svg className="w-full h-full max-w-[480px] da-svg-bg" viewBox="0 0 480 160">
                        <defs>
                          <marker id="ex-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--da-svg-node-border)" />
                          </marker>
                        </defs>
                        <path d="M 80 80 H 130" fill="none" stroke="var(--da-svg-purple-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        <path d="M 230 80 H 260" fill="none" stroke="var(--da-svg-purple-border)" strokeWidth="2.5" strokeDasharray="5,3" className="da-flow-purple" />
                        <path d="M 375 80 H 410" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        
                        <g transform="translate(10, 50)">
                          <rect width="70" height="60" rx="6" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1.5" />
                          <text x="35" y="20" fill="var(--da-svg-purple-text)" fontSize="8.5" fontWeight="bold" textAnchor="middle">🕸️ GRAPH </text>
                          <text x="35" y="36" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">Gremlin: Hop 3</text>
                          <text x="35" y="48" fill="var(--da-svg-purple-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Find rings</text>
                        </g>
                        <g transform="translate(130, 45)">
                          <rect width="100" height="70" rx="8" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="2" />
                          <text x="50" y="24" fill="var(--da-svg-purple-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">👑 GRAPH ENGINE</text>
                          <text x="50" y="42" fill="var(--da-text)" fontSize="7.5" textAnchor="middle">Traverses indices</text>
                          <text x="50" y="56" fill="var(--da-svg-purple-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Neptune Cluster</text>
                        </g>
                        
                        {/* Connected Graph Topology */}
                        <g transform="translate(260, 20)">
                          <rect width="115" height="120" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <circle cx="30" cy="40" r="10" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1.5" />
                          <text x="30" y="43" fill="var(--da-svg-purple-text)" fontSize="8" fontWeight="bold" textAnchor="middle">U1</text>
                          
                          <circle cx="85" cy="40" r="10" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" />
                          <text x="85" y="43" fill="var(--da-svg-amber-text)" fontSize="8" fontWeight="bold" textAnchor="middle">A1</text>
                          
                          <circle cx="57" cy="95" r="10" fill="var(--da-svg-blue-bg)" stroke="var(--da-svg-blue-border)" strokeWidth="1.5" />
                          <text x="57" y="98" fill="var(--da-svg-blue-text)" fontSize="8" fontWeight="bold" textAnchor="middle">U2</text>
                          
                          {/* Edges */}
                          <line x1="40" y1="40" x2="75" y2="40" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <line x1="30" y1="50" x2="49" y2="87" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <line x1="80" y1="49" x2="65" y2="87" stroke="var(--da-svg-purple-border)" strokeWidth="2" strokeDasharray="3 1" />
                        </g>
                        
                        <g transform="translate(410, 45)">
                          <rect width="60" height="70" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <text x="30" y="24" fill="var(--da-text-muted)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">📡 STREAM</text>
                          <text x="30" y="40" fill="var(--da-text-muted)" fontSize="7.5" textAnchor="middle">CDC Graph</text>
                          <text x="30" y="54" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Lambda Sync</text>
                        </g>
                      </svg>
                    )}

                    {selectedCategory === 'ledger' && (
                      <svg className="w-full h-full max-w-[480px] da-svg-bg" viewBox="0 0 480 160">
                        <defs>
                          <marker id="ex-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--da-svg-node-border)" />
                          </marker>
                        </defs>
                        <path d="M 85 80 H 130" fill="none" stroke="var(--da-svg-red-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        <path d="M 220 80 H 265" fill="none" stroke="var(--da-svg-red-border)" strokeWidth="2.5" strokeDasharray="5,3" className="da-flow-orange" />
                        <path d="M 375 80 H 410" fill="none" stroke="var(--da-svg-red-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        
                        <g transform="translate(10, 50)">
                          <rect width="75" height="60" rx="6" fill="var(--da-svg-red-bg)" stroke="var(--da-svg-red-border)" strokeWidth="1.5" />
                          <text x="37.5" y="20" fill="var(--da-svg-red-text)" fontSize="8.5" fontWeight="bold" textAnchor="middle">📝 WRITE TXN</text>
                          <text x="37.5" y="36" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">Balance Update</text>
                          <text x="37.5" y="48" fill="var(--da-svg-red-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Append Only</text>
                        </g>
                        <g transform="translate(130, 45)">
                          <rect width="90" height="70" rx="8" fill="var(--da-svg-red-bg)" stroke="var(--da-svg-red-border)" strokeWidth="2" />
                          <text x="45" y="22" fill="var(--da-svg-red-text)" fontSize="9" fontWeight="extrabold" textAnchor="middle">🗂️ JOURNAL</text>
                          <text x="45" y="40" fill="var(--da-text)" fontSize="7.5" textAnchor="middle">Immutable block</text>
                          <text x="45" y="54" fill="var(--da-svg-red-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Tamper Proof</text>
                        </g>
                        <g transform="translate(265, 45)">
                          <rect width="110" height="70" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" />
                          <rect x="5" y="5" width="100" height="15" rx="2" fill="var(--da-svg-amber-bg)" />
                          <text x="55" y="15" fill="var(--da-svg-amber-text)" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">🔒 SHA-256 CHAIN</text>
                          <text x="55" y="38" fill="var(--da-svg-amber-text)" fontSize="8" fontWeight="bold" textAnchor="middle">Block Chaining</text>
                          <text x="55" y="52" fill="var(--da-svg-amber-text)" fontSize="7" textAnchor="middle">Cryptographic Proof</text>
                        </g>
                        <g transform="translate(410, 45)">
                          <rect width="60" height="70" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <text x="30" y="24" fill="var(--da-text-muted)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">📋 AUDIT</text>
                          <text x="30" y="40" fill="var(--da-text-muted)" fontSize="7.5" textAnchor="middle">Verifiable</text>
                          <text x="30" y="54" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">State Table</text>
                        </g>
                      </svg>
                    )}

                    {selectedCategory === 'timeseries' && (
                      <svg className="w-full h-full max-w-[480px] da-svg-bg" viewBox="0 0 480 160">
                        <defs>
                          <marker id="ex-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--da-svg-node-border)" />
                          </marker>
                        </defs>
                        <path d="M 85 80 H 130" fill="none" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        <path d="M 230 80 H 265" fill="none" stroke="var(--da-svg-amber-border)" strokeWidth="2.5" strokeDasharray="5,3" className="da-flow-orange" />
                        <path d="M 375 80 H 410" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        
                        <g transform="translate(10, 50)">
                          <rect width="75" height="60" rx="6" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" />
                          <text x="37.5" y="20" fill="var(--da-svg-amber-text)" fontSize="8.5" fontWeight="bold" textAnchor="middle">📈 METRICS FEED</text>
                          <text x="37.5" y="36" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">IoT Telemetry</text>
                          <text x="37.5" y="48" fill="var(--da-svg-amber-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">100k writes/s</text>
                        </g>
                        <g transform="translate(130, 45)">
                          <rect width="100" height="70" rx="8" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="2" />
                          <text x="50" y="24" fill="var(--da-svg-amber-text)" fontSize="9" fontWeight="extrabold" textAnchor="middle">💾 MEMORY TIER</text>
                          <text x="50" y="42" fill="var(--da-text)" fontSize="7.5" textAnchor="middle">Hot writes buffer</text>
                          <text x="50" y="56" fill="var(--da-svg-amber-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Sub-ms writes</text>
                        </g>
                        <g transform="translate(265, 45)">
                          <rect width="110" height="70" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <rect x="5" y="5" width="100" height="15" rx="2" fill="var(--da-svg-node-fill)" />
                          <text x="55" y="15" fill="var(--da-text-muted)" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">⚡ MIGRATOR</text>
                          <text x="55" y="38" fill="var(--da-svg-amber-text)" fontSize="8" fontWeight="bold" textAnchor="middle">Auto-Tiering</text>
                          <text x="55" y="52" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">Memory to Disk</text>
                        </g>
                        <g transform="translate(410, 45)">
                          <rect width="60" height="70" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <text x="30" y="24" fill="var(--da-text-muted)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">🖲️ DISK</text>
                          <text x="30" y="40" fill="var(--da-text-muted)" fontSize="7.5" textAnchor="middle">Magnetic</text>
                          <text x="30" y="54" fill="var(--da-svg-amber-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Cold tier</text>
                        </g>
                      </svg>
                    )}

                    {selectedCategory === 'etl' && (
                      <svg className="w-full h-full max-w-[480px] da-svg-bg" viewBox="0 0 480 160">
                        <defs>
                          <marker id="ex-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                            <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--da-svg-node-border)" />
                          </marker>
                        </defs>
                        <path d="M 65 80 L 115 45" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        <path d="M 65 80 L 115 115" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" strokeDasharray="2,2" />
                        <path d="M 205 45 L 260 80" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1.5" markerEnd="url(#ex-arrow)" />
                        <path d="M 330 80 H 400" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="2.5" strokeDasharray="5,3" className="da-flow-green" />
                        
                        <g transform="translate(10, 55)">
                          <rect width="55" height="50" rx="6" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                          <text x="27.5" y="24" fill="var(--da-svg-green-text)" fontSize="8" fontWeight="bold" textAnchor="middle">🪣 RAW S3</text>
                          <text x="27.5" y="38" fill="var(--da-text-muted)" fontSize="7.5" textAnchor="middle">JSON files</text>
                        </g>
                        <g transform="translate(115, 20)">
                          <rect width="90" height="50" rx="6" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                          <text x="45" y="18" fill="var(--da-svg-green-text)" fontSize="8" fontWeight="extrabold" textAnchor="middle">🕷️ CRAWLER</text>
                          <text x="45" y="32" fill="var(--da-text-muted)" fontSize="7.5" textAnchor="middle">Scans files</text>
                          <text x="45" y="42" fill="var(--da-svg-green-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Infers Schema</text>
                        </g>
                        <g transform="translate(115, 90)">
                          <rect width="90" height="50" rx="6" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                          <text x="45" y="18" fill="var(--da-text-muted)" fontSize="8" fontWeight="bold" textAnchor="middle">REGISTRY</text>
                          <text x="45" y="32" fill="var(--da-text-muted)" fontSize="7.5" textAnchor="middle">AVRO checking</text>
                          <text x="45" y="42" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">Prevents poison</text>
                        </g>
                        <g transform="translate(240, 45)">
                          <rect width="90" height="70" rx="8" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="2" />
                          <text x="45" y="24" fill="var(--da-svg-green-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">📚 DATA CATALOG</text>
                          <text x="45" y="42" fill="var(--da-text)" fontSize="7.5" textAnchor="middle">Hive Metastore</text>
                          <text x="45" y="56" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Schema Database</text>
                        </g>
                        <g transform="translate(400, 50)">
                          <rect width="70" height="60" rx="8" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" />
                          <text x="35" y="24" fill="var(--da-svg-amber-text)" fontSize="8" fontWeight="extrabold" textAnchor="middle">⚡ SPARK</text>
                          <text x="35" y="38" fill="var(--da-svg-amber-text)" fontSize="7.5" textAnchor="middle">Serverless ETL</text>
                          <text x="35" y="48" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">DPU Transform</text>
                        </g>
                      </svg>
                    )}

                  </div>

                  {/* Capabilities Comparison Progress Bars */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-left">
                    <span className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider block mb-3 border-b border-slate-100 pb-1">
                      📊 Engine Characteristics &amp; Capability Ratings
                    </span>
                    <div className="space-y-3">
                      {/* Write Throughput */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                          <span>🚀 WRITE THROUGHPUT / INGESTION SPEED</span>
                          <span className="text-amber-700 font-mono">{CATEGORY_MAP[selectedCategory].metrics.write}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-150">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${CATEGORY_MAP[selectedCategory].metrics.write}%` }}
                          />
                        </div>
                      </div>

                      {/* Read Latency */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                          <span>⏱️ READ LATENCY / QUERY RETRIEVAL SPEED</span>
                          <span className="text-emerald-700 font-mono">{CATEGORY_MAP[selectedCategory].metrics.read}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-150">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${CATEGORY_MAP[selectedCategory].metrics.read}%` }}
                          />
                        </div>
                      </div>

                      {/* Schema Rigidity */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                          <span>📑 SCHEMA RIGIDITY / STRUCTURE REGULATION</span>
                          <span className="text-sky-700 font-mono">{CATEGORY_MAP[selectedCategory].metrics.rigidity}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-150">
                          <div
                            className="h-full bg-sky-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${CATEGORY_MAP[selectedCategory].metrics.rigidity}%` }}
                          />
                        </div>
                      </div>

                      {/* Query Complexity */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                          <span>🔗 QUERY COMPLEXITY / MULTI-RELATION JOIN CAPABILITIES</span>
                          <span className="text-purple-700 font-mono">{CATEGORY_MAP[selectedCategory].metrics.complexity}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-150">
                          <div
                            className="h-full bg-purple-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${CATEGORY_MAP[selectedCategory].metrics.complexity}%` }}
                          />
                        </div>
                      </div>

                      {/* Storage Scalability */}
                      <div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-700 mb-1">
                          <span>📈 STORAGE SCALABILITY / MAXIMUM DATA POOL CAPACITY</span>
                          <span className="text-indigo-700 font-mono">{CATEGORY_MAP[selectedCategory].metrics.scale}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-150">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${CATEGORY_MAP[selectedCategory].metrics.scale}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Ideal Workload Banner */}
                <div className="mt-4 bg-sky-50 border border-sky-150 rounded-xl p-3 text-[11px] leading-relaxed text-slate-700 flex gap-2 text-left">
                  <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-sky-950 block">🎯 Ideal Workload Profile Fitment:</span>
                    <span className="text-slate-800 font-medium block mt-0.5">{CATEGORY_MAP[selectedCategory].idealWorkload}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* NEW: Unified AWS Database & Analytics Directory Table */}
          <div className="da-card bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6">
            <h3 className="da-card-title text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-sky-500 animate-pulse" /> Unified AWS Database &amp; Analytics Portfolio Directory
            </h3>
            <p className="da-card-desc mb-4 text-slate-650 text-[11px] leading-relaxed">
              AWS offers specialized database engines optimized for unique workload profiles rather than forcing all patterns into a single database. Review the unified directory below to choose the correct data structure, storage type, and cloud service.
            </p>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold text-[10.5px]">
                    <th className="p-3 border-r border-slate-200">Category</th>
                    <th className="p-3 border-r border-slate-200">AWS Services</th>
                    <th className="p-3 border-r border-slate-200">Storage &amp; Scaling model</th>
                    <th className="p-3 border-r border-slate-200">Core Characteristics</th>
                    <th className="p-3">Ideal Workloads</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-150 hover:bg-slate-50 text-slate-600">
                    <td className="p-3 border-r border-slate-200 font-extrabold text-sky-700">📑 RDBMS (Relational)</td>
                    <td className="p-3 border-r border-slate-200">
                      <span className="font-bold text-slate-800 block">Amazon RDS</span>
                      <span className="font-bold text-sky-700 block">Amazon Aurora</span>
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      • VM coupled Block storage (EBS)<br />
                      • Decoupled log-structured shared storage volume (up to 128TB)
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      Highly structured tables, strict SQL schemas, rigid ACID compliance, complex relational joins.
                    </td>
                    <td className="p-3 font-semibold text-slate-800">ERP systems, financial records, traditional enterprise transactions.</td>
                  </tr>

                  <tr className="border-b border-slate-150 hover:bg-slate-50 text-slate-600">
                    <td className="p-3 border-r border-slate-200 font-extrabold text-purple-700">⚡ NoSQL (Key-Value)</td>
                    <td className="p-3 border-r border-slate-200">
                      <span className="font-bold text-slate-800 block">Amazon DynamoDB</span>
                      <span className="font-bold text-purple-700 block">Amazon Keyspaces</span>
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      • Partitioned SSD tables (Serverless)<br />
                      • Cassandra CQL compatible serverless scale
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      Horizontal scaling, dynamic key-value attributes, single-digit millisecond latency at any scale, no complex table joins.
                    </td>
                    <td className="p-3 font-semibold text-slate-800">High-volume user shopping carts, IoT telemetry, massive write clickstreams.</td>
                  </tr>

                  <tr className="border-b border-slate-150 hover:bg-slate-50 text-slate-600">
                    <td className="p-3 border-r border-slate-200 font-extrabold text-indigo-700">📂 NoSQL (Document)</td>
                    <td className="p-3 border-r border-slate-200">
                      <span className="font-bold text-indigo-700 block">Amazon DocumentDB</span>
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      • MongoDB compatible decoupled engine<br />
                      • Scale up to 15 read replicas instantly
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      Native JSON document store. Replicates log blocks 6-ways across 3 Availability Zones. Decouples compute from disk.
                    </td>
                    <td className="p-3 font-semibold text-slate-800">Content management directories, mobile user profile catalogs.</td>
                  </tr>

                  <tr className="border-b border-slate-150 hover:bg-slate-50 text-slate-600">
                    <td className="p-3 border-r border-slate-200 font-extrabold text-emerald-700">⏱️ In-Memory Cache</td>
                    <td className="p-3 border-r border-slate-200">
                      <span className="font-bold text-slate-800 block">Amazon ElastiCache</span>
                      <span className="font-bold text-emerald-700 block">Amazon MemoryDB</span>
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      • RAM-based memory partitions<br />
                      • Redis &amp; Memcached compliance
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      Micro-second data delivery, high-performance in-memory caching layers, atomic counters, Redis sorted sets.
                    </td>
                    <td className="p-3 font-semibold text-slate-800">Database query accelerators, real-time gaming leaderboards, session profiles.</td>
                  </tr>

                  <tr className="border-b border-slate-150 hover:bg-slate-50 text-slate-600">
                    <td className="p-3 border-r border-slate-200 font-extrabold text-amber-700">🪣 Object Store</td>
                    <td className="p-3 border-r border-slate-200">
                      <span className="font-bold text-slate-800 block">Amazon S3</span>
                      <span className="font-bold text-amber-700 block">S3 Glacier / Archive</span>
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      • HTTP Object store API (Serverless)<br />
                      • Unlimited scalable storage
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      Flat namespace directory, high durability (11 9s), object lifecycle policy triggers, S3 batch jobs.
                    </td>
                    <td className="p-3 font-semibold text-slate-800">Static site assets hosting, analytical data lake repositories, cold logs backup.</td>
                  </tr>

                  <tr className="border-b border-slate-150 hover:bg-slate-50 text-slate-600">
                    <td className="p-3 border-r border-slate-200 font-extrabold text-teal-700">📊 Data Warehouse &amp; OLAP</td>
                    <td className="p-3 border-r border-slate-200">
                      <span className="font-bold text-slate-800 block">Amazon Redshift</span>
                      <span className="font-bold text-teal-700 block">Amazon Athena</span>
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      • Columnar block MPP data warehouse<br />
                      • Serverless S3 direct querying
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      Petabyte analytics, serverless SQL directly on raw S3 buckets, columnar indexes reducing scanned bytes.
                    </td>
                    <td className="p-3 font-semibold text-slate-800">Complex business intelligence analytics, S3 raw logs scanning.</td>
                  </tr>

                  <tr className="border-b border-slate-150 hover:bg-slate-50 text-slate-600">
                    <td className="p-3 border-r border-slate-200 font-extrabold text-sky-700">🔎 Search Index</td>
                    <td className="p-3 border-r border-slate-200">
                      <span className="font-bold text-sky-700 block">Amazon OpenSearch</span>
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      • ElasticSearch successor shards<br />
                      • Dedicated Master &amp; Data nodes
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      Full-text search parsing, fuzzy partial matches, real-time log indexing, UltraWarm S3 backups integration.
                    </td>
                    <td className="p-3 font-semibold text-slate-800">Application log analysis, full-text catalog lookups, search complement stores.</td>
                  </tr>

                  <tr className="border-b border-slate-150 hover:bg-slate-50 text-slate-600">
                    <td className="p-3 border-r border-slate-200 font-extrabold text-indigo-850">🕸️ Graph Network</td>
                    <td className="p-3 border-r border-slate-200">
                      <span className="font-bold text-indigo-850 block">Amazon Neptune</span>
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      • Decoupled Graph compute engine<br />
                      • Gremlin &amp; SPARQL compatible
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      Fast relational graph index maps, many-to-many relationship traversals, Neptune Streams CDC integrations.
                    </td>
                    <td className="p-3 font-semibold text-slate-800">Fraud ring network detection, user social graph maps, recommendation webs.</td>
                  </tr>

                  <tr className="border-b border-slate-150 hover:bg-slate-50 text-slate-600">
                    <td className="p-3 border-r border-slate-200 font-extrabold text-rose-700">🛡️ Ledger (Immutable)</td>
                    <td className="p-3 border-r border-slate-200">
                      <span className="font-bold text-rose-700 block">Amazon QLDB</span>
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      • Cryptographically verifiable ledger<br />
                      • Append-only transaction log journal
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      Centralized trust tracking, historical document audits, cryptographic hash chains preventing database tampering.
                    </td>
                    <td className="p-3 font-semibold text-slate-800">Supply chain custody audits, vehicle registration records, banking histories.</td>
                  </tr>

                  <tr className="border-b border-slate-150 hover:bg-slate-50 text-slate-600">
                    <td className="p-3 border-r border-slate-200 font-extrabold text-orange-600">📈 Time-Series</td>
                    <td className="p-3 border-r border-slate-200">
                      <span className="font-bold text-orange-600 block">Amazon Timestream</span>
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      • Decoupled serverless metric memory<br />
                      • Auto-migrates hot metrics to magnetic disk
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      Ingests trillions of daily events chronologically, built-in time-series SQL math functions, auto-scaling metric indexes.
                    </td>
                    <td className="p-3 font-semibold text-slate-800">IoT sensor monitoring tracking, application server logs telemetry.</td>
                  </tr>

                  <tr className="hover:bg-slate-50 text-slate-600">
                    <td className="p-3 border-r border-slate-200 font-extrabold text-emerald-800">⚙️ ETL &amp; Metastore</td>
                    <td className="p-3 border-r border-slate-200">
                      <span className="font-bold text-slate-800 block">AWS Glue</span>
                      <span className="font-bold text-emerald-800 block">AWS Lake Formation</span>
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      • Centralized database Metastore<br />
                      • Serverless ETL engines (Spark/Ray)
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      Infers columns schemas via crawlers, converts raw text to snappy Parquet, row-level and column-level security gates.
                    </td>
                    <td className="p-3 font-semibold text-slate-800">Schema crawling catalogs, database conversions, central lake security rules.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: RELATIONAL DEEP-DIVE & AURORA FAILOVER PLAYBOOK                     */}
      {/* ========================================================================= */}
      {activeTab === 'rdbms' && (
        <div className="space-y-6">
          <div className="da-card">
            <h2 className="da-card-title text-sky-700">
              <Server className="w-5 h-5" /> AWS Relational Databases: Amazon RDS &amp; Aurora Architecture
            </h2>
            <p className="da-card-desc mb-3">
              Amazon RDS provisions standard VM engines with local EBS disks (compute and storage coupled). **Amazon Aurora** decouples compute from the storage layer, deploying a log-structured shared storage cluster that replicates blocks 6-ways across 3 AZs.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Interactive Aurora Replication Diagram */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 min-h-[460px] flex flex-col justify-between shadow-sm">
              <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Amazon Aurora Decoupled Multi-AZ Storage Cluster</h3>
                  <p className="text-[11px] text-slate-500">Trigger writer node failure toPromote replica and re-route Route 53 CNAME in real-time</p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={failoverState !== 'idle'}
                    onClick={triggerAuroraFailover}
                    className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" /> Simulate Master Failover
                  </button>
                  <button
                    onClick={resetAuroraScenario}
                    className="p-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* SVG Diagram Canvas */}
              <div className="w-full h-[280px] rounded-xl border border-slate-200 p-2 relative overflow-hidden flex items-center justify-center shadow-inner bg-slate-50">
                <svg className="w-full h-full max-w-[620px] da-svg-bg" viewBox="0 0 600 280">
                  <defs>
                    <marker id="aurora-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--da-svg-node-border)" />
                    </marker>
                    <marker id="aurora-arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--da-svg-blue-border)" />
                    </marker>
                  </defs>

                  {/* CNAME endpoint lines */}
                  <path d="M 300 20 L 150 70" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" strokeDasharray="3 3" />
                  
                  {/* Decoupled storage link lines */}
                  <path d="M 150 120 L 300 210" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="2.5" markerEnd="url(#aurora-arrow)" />
                  <path d="M 450 120 L 300 210" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="2.5" markerEnd="url(#aurora-arrow)" />

                  {/* Active Flows */}
                  {masterActive && (
                    <>
                      <path d="M 300 20 L 150 70" fill="none" stroke="var(--da-svg-blue-border)" strokeWidth="3.5" className="da-flow-blue" />
                      <path d="M 150 120 L 300 210" fill="none" stroke="var(--da-svg-blue-border)" strokeWidth="3" className="da-flow-blue" />
                    </>
                  )}

                  {failoverState === 'promoting-reader' && (
                    <path d="M 450 120 L 300 210" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="3" className="da-flow-green" />
                  )}

                  {failoverState === 'route53-updating' && (
                    <path d="M 300 20 L 450 70" fill="none" stroke="var(--da-svg-blue-border)" strokeWidth="3.5" className="da-flow-blue" />
                  )}

                  {failoverState === 'completed' && (
                    <>
                      <path d="M 300 20 L 450 70" fill="none" stroke="var(--da-svg-blue-border)" strokeWidth="3" className="da-flow-blue" />
                      <path d="M 450 120 L 300 210" fill="none" stroke="var(--da-svg-blue-border)" strokeWidth="3" className="da-flow-blue" />
                    </>
                  )}

                  {/* Route 53 endpoint node */}
                  <g transform="translate(230, 2)" className="da-node-btn">
                    <rect width="140" height="32" rx="8" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="2" />
                    <text x="70" y="14" fill="var(--da-svg-green-text)" fontSize="8.5" fontWeight="bold" textAnchor="middle">🌐 ROUTE 53 CNAME</text>
                    <text x="70" y="24" fill="var(--da-text-muted)" fontSize="7.5" textAnchor="middle" fontFamily="monospace">aurora-cluster.endpoint...</text>
                  </g>

                  {/* AZ boundaries */}
                  <rect x="20" y="52" width="260" height="110" rx="10" fill="transparent" stroke="var(--da-svg-node-border)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="35" y="68" fill="var(--da-text-muted)" fontSize="7.5" fontWeight="bold">AVAILABILITY ZONE 1A</text>

                  <rect x="320" y="52" width="260" height="110" rx="10" fill="transparent" stroke="var(--da-svg-node-border)" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="335" y="68" fill="var(--da-text-muted)" fontSize="7.5" fontWeight="bold">AVAILABILITY ZONE 1B</text>

                  {/* Instances */}
                  <g transform="translate(60, 75)" className="da-node-btn">
                    <rect width="180" height="70" rx="12" fill={masterActive ? 'var(--da-svg-blue-bg)' : 'var(--da-svg-red-bg)'} stroke={masterActive ? 'var(--da-svg-blue-border)' : 'var(--da-svg-red-border)'} strokeWidth="2.5" />
                    <text x="90" y="24" fill={masterActive ? 'var(--da-svg-blue-text)' : 'var(--da-svg-red-text)'} fontSize="11" fontWeight="bold" textAnchor="middle">
                      {masterActive ? '🛢️ PRIMARY WRITER' : '💥 WRITER CRASHED'}
                    </text>
                    <text x="90" y="44" fill="var(--da-text)" fontSize="8.5" textAnchor="middle" fontWeight="500">aurora-writer-us-east-1a</text>
                    <text x="90" y="58" fill={masterActive ? 'var(--da-svg-green-text)' : 'var(--da-svg-red-text)'} fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      {masterActive ? 'Status: Active Writes' : 'Status: Connection Lost'}
                    </text>
                  </g>

                  <g transform="translate(360, 75)" className="da-node-btn">
                    <rect width="180" height="70" rx="12" fill={
                      promotedReaderId === 'aurora-reader-us-east-1b' ? 'var(--da-svg-green-bg)' : 'var(--da-svg-blue-bg)'
                    } stroke={
                      promotedReaderId === 'aurora-reader-us-east-1b' ? 'var(--da-svg-green-border)' : 'var(--da-svg-blue-border)'
                    } strokeWidth="2.5" />
                    <text x="90" y="24" fill={
                      promotedReaderId === 'aurora-reader-us-east-1b' ? 'var(--da-svg-green-text)' : 'var(--da-svg-blue-text)'
                    } fontSize="11" fontWeight="bold" textAnchor="middle">
                      {promotedReaderId === 'aurora-reader-us-east-1b' ? '🛢️ PROMOTED WRITER' : '🔌 REPLICA READER'}
                    </text>
                    <text x="90" y="44" fill="var(--da-text)" fontSize="8.5" textAnchor="middle" fontWeight="500">aurora-reader-us-east-1b</text>
                    <text x="90" y="58" fill="var(--da-svg-green-text)" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      {promotedReaderId === 'aurora-reader-us-east-1b' ? 'Status: Master writes active' : 'Status: Standby replica ready'}
                    </text>
                  </g>

                  {/* Decoupled storage block */}
                  <g transform="translate(180, 195)" className="da-node-btn">
                    <rect width="240" height="70" rx="12" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="3" />
                    <text x="120" y="24" fill="var(--da-svg-amber-text)" fontSize="12.5" fontWeight="bold" textAnchor="middle">⚡ DECOUPLED SHARED SSD</text>
                    <text x="120" y="42" fill="var(--da-svg-amber-text)" fontSize="9" textAnchor="middle" fontWeight="semibold">Auto-Scales blocks up to 128 TB</text>
                    <text x="120" y="56" fill="var(--da-svg-green-text)" fontSize="9" fontWeight="bold" textAnchor="middle">6-way active replication across 3 AZs</text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Aurora logs trace console */}
            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col h-[460px] shadow-inner">
              <div className="flex items-center gap-2 text-slate-700 font-mono text-xs border-b border-slate-200 pb-2 mb-3">
                <Terminal className="w-4 h-4 text-sky-600" />
                <span>Aurora Failover Active Trace</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2.5 font-mono text-[10.5px] leading-relaxed text-slate-700 pr-1">
                {failoverLogs.length === 0 ? (
                  <span className="text-slate-500 block text-center mt-32 italic">Click "Simulate Master Failover" to run the Multi-AZ automated reader promotion runbook.</span>
                ) : (
                  failoverLogs.map((log, idx) => {
                    let color = 'text-slate-650';
                    if (log.includes('⚠️') || log.includes('🚨')) color = 'text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded';
                    if (log.includes('⚙️')) color = 'text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded';
                    if (log.includes('🌐')) color = 'text-sky-700 font-semibold bg-sky-50 px-1.5 py-0.5 rounded';
                    if (log.includes('✅')) color = 'text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded';
                    return (
                      <div key={idx} className={`${color} border-b border-slate-100 pb-1.5`}>
                        {log}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: NOSQL DATABASE SUITE & CACHE-ASIDE REDIS SIMULATION                */}
      {/* ========================================================================= */}
      {activeTab === 'nosql' && (
        <div className="space-y-6">
          <div className="da-card">
            <h2 className="da-card-title text-sky-700">
              <Database className="w-5 h-5" /> NoSQL Database Suite: DynamoDB, Key Hashing, and Caching
            </h2>
            <p className="da-card-desc">
              NoSQL engines scale horizontally by sharding key distributions. DynamoDB hashes primary keys to route lookups to dedicated physical SSD partitions. ElastiCache Redis stores hot session keys in-memory to serve reads in sub-milliseconds.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left side: Cache-aside simulator */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 min-h-[460px] flex flex-col justify-between shadow-sm">
              <div className="w-full flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">ElastiCache Redis Cache-Aside Simulation</h3>
                  <p className="text-[11px] text-slate-500">Test profile queries to compare in-memory cache hits vs backing database disk misses</p>
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={cacheSimMode}
                    onChange={(e) => setCacheSimMode(e.target.value as 'hit' | 'miss')}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs outline-none"
                  >
                    <option value="hit">Mode: Cache Hit (Fast)</option>
                    <option value="miss">Mode: Cache Miss (Slow)</option>
                  </select>
                  <button
                    disabled={cacheState !== 'idle'}
                    onClick={triggerCacheScenario}
                    className="px-3.5 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" /> Fetch Profile
                  </button>
                  <button
                    onClick={resetCacheScenario}
                    className="p-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cache-Aside SVG graphics */}
              <div className="w-full h-[280px] rounded-xl border border-slate-200 p-2 relative overflow-hidden flex items-center justify-center shadow-inner bg-slate-50">
                <svg className="w-full h-full max-w-[620px] da-svg-bg" viewBox="0 0 600 280">
                  <path d="M 70 140 H 125" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="2.5" markerEnd="url(#aurora-arrow)" />
                  <path d="M 210 137 Q 240 72.5, 290 72.5" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="2.5" markerEnd="url(#aurora-arrow)" />
                  <path d="M 210 137 Q 240 197.5, 290 197.5" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="2.5" markerEnd="url(#aurora-arrow)" />
                  <path d="M 400 197.5 H 480" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="2" markerEnd="url(#aurora-arrow)" />

                  {/* Cache hit flow line */}
                  {cacheState === 'checking-cache' && (
                    <path d="M 210 137 Q 240 72.5, 290 72.5" fill="none" stroke="var(--da-svg-purple-border)" strokeWidth="3.5" className="da-flow-purple" />
                  )}

                  {/* Cache hit success flow line */}
                  {cacheState === 'cache-hit' && (
                    <path d="M 290 72.5 Q 240 72.5, 210 137" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="3.5" className="da-flow-green" />
                  )}

                  {/* Cache miss flow lines */}
                  {cacheState === 'cache-miss' && (
                    <path d="M 290 72.5 Q 240 72.5, 210 137" fill="none" stroke="var(--da-svg-red-border)" strokeWidth="2.5" strokeDasharray="3 3" />
                  )}

                  {/* Backing DB query flow line */}
                  {cacheState === 'querying-db' && (
                    <path d="M 210 137 Q 240 197.5, 290 197.5" fill="none" stroke="var(--da-svg-blue-border)" strokeWidth="3.5" className="da-flow-blue" />
                  )}

                  {/* Write cache on database return */}
                  {cacheState === 'populating-cache' && (
                    <>
                      <path d="M 400 197.5 H 480" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="3" className="da-flow-green" />
                      <path d="M 290 197.5 Q 240 197.5, 210 137" fill="none" stroke="var(--da-svg-blue-border)" strokeWidth="2.5" />
                    </>
                  )}

                  {/* Nodes */}
                  <g transform="translate(10, 105)" className="da-node-btn">
                    <rect width="60" height="70" rx="10" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="2" />
                    <rect x="5" y="5" width="50" height="30" rx="6" fill="var(--da-svg-node-fill)" />
                    <text x="30" y="24" fill="var(--da-svg-text-dark)" fontSize="10.5" fontWeight="bold" textAnchor="middle">📱 USER</text>
                    <text x="30" y="50" fill="var(--da-text-muted)" fontSize="8.5" fontWeight="bold" textAnchor="middle">Web Client</text>
                    <text x="30" y="60" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">Profile Query</text>
                  </g>

                  <g transform="translate(125, 100)" className="da-node-btn">
                    <rect x="4" y="4" width="85" height="75" rx="10" fill="transparent" />
                    <rect width="85" height="75" rx="10" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="2.5" />
                    <rect x="8" y="8" width="69" height="18" rx="4" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1" />
                    <text x="42.5" y="20.5" fill="var(--da-svg-purple-text)" fontSize="9.5" fontWeight="bold" textAnchor="middle">⚡ APP SERVER</text>
                    <text x="42.5" y="42" fill="var(--da-svg-purple-text)" fontSize="8" fontWeight="bold" textAnchor="middle">Node.js API</text>
                    <rect x="10" y="50" width="65" height="16" rx="4" fill="var(--da-svg-purple-bg)" />
                    <text x="42.5" y="61" fill="var(--da-svg-purple-text)" fontSize="7.5" textAnchor="middle" fontWeight="bold">
                      {cacheState === 'checking-cache' ? 'Checking Cache' :
                       cacheState === 'querying-db' ? 'Querying DB' : 'Status: Idle'}
                    </text>
                  </g>

                  <g transform="translate(290, 35)" className="da-node-btn">
                    <rect x="4" y="4" width="135" height="75" rx="10" fill="transparent" />
                    <rect width="135" height="75" rx="10" fill="var(--da-svg-red-bg)" stroke="var(--da-svg-red-border)" strokeWidth="2.5" />
                    <rect x="10" y="10" width="115" height="20" rx="4" fill="var(--da-svg-red-border)" />
                    <circle cx="20" cy="20" r="3.5" fill={cacheState === 'cache-hit' ? '#10b981' : '#ef4444'} className="pulse-circle" />
                    <circle cx="20" cy="20" r="3.5" fill={cacheState === 'cache-hit' ? '#10b981' : '#ef4444'} />
                    <circle cx="29" cy="20" r="2.5" fill="#10b981" />
                    <circle cx="36" cy="20" r="2.5" fill="#10b981" />
                    <circle cx="43" cy="20" r="2.5" fill="#6b7280" />
                    <text x="115" y="23" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="end">REDIS CACHE</text>
                    
                    <text x="67.5" y="47" fill="var(--da-svg-red-text)" fontSize="9" fontWeight="bold" textAnchor="middle">ElastiCache Cluster</text>
                    <text x="67.5" y="61" fill={
                      cacheState === 'cache-hit' ? 'var(--da-svg-green-text)' :
                      cacheState === 'cache-miss' ? 'var(--da-svg-red-text)' : 'var(--da-text-muted)'
                    } fontSize="9" fontWeight="bold" textAnchor="middle">
                      {cacheState === 'cache-hit' ? '🟢 HIT (0.2ms)' :
                       cacheState === 'cache-miss' ? '❌ MISS' : 'Status: Online'}
                    </text>
                  </g>

                  <g transform="translate(290, 160)" className="da-node-btn">
                    <ellipse cx="55" cy="65" rx="45" ry="10" fill="transparent" />
                    <path d="M 10 15 V 55 A 45 10 0 0 0 100 55 V 15 Z" fill="var(--da-svg-blue-bg)" stroke="var(--da-svg-blue-border)" strokeWidth="2.5" />
                    <ellipse cx="55" cy="15" rx="45" ry="10" fill="var(--da-svg-blue-bg)" stroke="var(--da-svg-blue-border)" strokeWidth="2.5" />
                    <path d="M 10 26 A 45 8 0 0 0 100 26" fill="none" stroke="var(--da-svg-blue-border)" strokeWidth="1" strokeDasharray="3 3" />
                    <path d="M 10 38 A 45 8 0 0 0 100 38" fill="none" stroke="var(--da-svg-blue-border)" strokeWidth="1.5" />
                    
                    <text x="55" y="23" fill="var(--da-svg-blue-text)" fontSize="9.5" fontWeight="bold" textAnchor="middle">🛢️ PRIMARY DB</text>
                    <text x="55" y="43" fill="var(--da-text-muted)" fontSize="8" textAnchor="middle" fontWeight="semibold">PostgreSQL / RDS</text>
                    <text x="55" y="56" fill="var(--da-svg-blue-text)" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      {cacheState === 'querying-db' ? 'Disk Query (6ms)' : 'Persistent SSD'}
                    </text>
                  </g>

                  <g transform="translate(480, 160)" className="da-node-btn">
                    <rect x="4" y="4" width="110" height="75" rx="10" fill="transparent" />
                    <rect width="110" height="75" rx="10" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="2.5" />
                    <rect x="8" y="8" width="94" height="18" rx="4" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1" />
                    <text x="55" y="20.5" fill="var(--da-svg-green-text)" fontSize="9" fontWeight="bold" textAnchor="middle">⚡ DYNAMODB</text>
                    <text x="55" y="43" fill="var(--da-svg-green-text)" fontSize="8.5" textAnchor="middle" fontWeight="semibold">Decoupled NoSQL</text>
                    <text x="55" y="56" fill="var(--da-svg-green-text)" fontSize="8.5" fontWeight="bold" textAnchor="middle">Consistent Sub-10ms</text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Right side: Cache logs trace & Dynamo Hash wizard */}
            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between h-[460px] shadow-inner">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-700 font-mono text-xs border-b border-slate-200 pb-2">
                  <Sliders className="w-4 h-4 text-sky-600" />
                  <span>DynamoDB Partition Key Hashing</span>
                </div>
                
                <div className="space-y-2 text-xs">
                  <span className="text-[11px] font-semibold text-slate-700 block">Enter partition key (e.g. username):</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={dynamoInputUser}
                      onChange={(e) => calculateDynamoHash(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="border border-slate-200 rounded-xl p-3 bg-white space-y-2 mt-2 font-mono text-[11px]">
                    <div className="flex justify-between"><span className="text-slate-500">Hash Value:</span><span className="font-bold text-sky-700">{dynamoHashResult.hash}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Target Partition:</span><span className="font-bold text-emerald-700">SSD Node #{dynamoHashResult.partition}</span></div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] leading-relaxed text-slate-700 border-t border-slate-200 pt-3 mt-3">
                {cacheLogs.length === 0 ? (
                  <span className="text-slate-500 block text-center mt-8 italic">Click "Fetch Profile" to watch cache pipeline actions.</span>
                ) : (
                  cacheLogs.map((log, idx) => {
                    let color = 'text-slate-650';
                    if (log.includes('🟢')) color = 'text-emerald-700 font-semibold bg-emerald-50 px-1 rounded';
                    if (log.includes('🟡') || log.includes('❌')) color = 'text-amber-700 font-semibold bg-amber-50 px-1 rounded';
                    if (log.includes('🛢️')) color = 'text-sky-700 font-semibold bg-sky-50 px-1 rounded';
                    if (log.includes('✅')) color = 'text-emerald-700 font-semibold bg-emerald-50 px-1 rounded';
                    return <div key={idx} className={`${color} pb-1 border-b border-slate-100`}>{log}</div>;
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ATHENA SERVERLESS & DATA LAKEHOUSE GOVERNANCE                       */}
      {/* ========================================================================= */}
      {activeTab === 'lakehouse' && (
        <div className="space-y-6">
          <div className="da-card">
            <h2 className="da-card-title text-sky-700">
              <Shield className="w-5 h-5" /> Serverless Queries &amp; Data Governance: Amazon Athena &amp; AWS Lake Formation
            </h2>
            <p className="da-card-desc">
              **Amazon Athena** runs serverless SQL queries directly on S3 data using Presto distributed coordinator-worker nodes. **AWS Lake Formation** sits in front of S3 and the Glue Catalog to enforce centralized row-level, column-level, and database-level security policies.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Athena Coordinator-Worker diagram */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 border-b border-slate-150 pb-2 mb-3">
                  Amazon Athena Presto Query Coordinator-Worker Architecture
                </h3>
                <p className="text-[11.5px] text-slate-600 mb-4 leading-relaxed">
                  When a client issues a SQL query, Athena does not spin up a database server. It parses the SQL query using a serverless **Coordinator Node**, checks table schema columns inside the **Glue Data Catalog**, and partitions the scanner workload among hundreds of dedicated **Worker Nodes** scanning Parquet objects in parallel.
                </p>
                
                {/* SVG Coordinator-Worker */}
                <div className="w-full h-[250px] rounded-xl border border-slate-200 relative p-2.5 flex items-center justify-center shadow-inner bg-slate-50 overflow-hidden">
                  <svg className="w-full h-full da-svg-bg" viewBox="0 0 540 240">
                    <defs>
                      <marker id="lake-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                      </marker>
                    </defs>

                    {/* Path links */}
                    <path d="M 80 120 H 135" fill="none" stroke="#3b82f6" strokeWidth="2.5" markerEnd="url(#lake-arrow)" />
                    <path d="M 260 115 Q 290 47, 325 47" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />
                    <path d="M 260 115 H 325" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />
                    <path d="M 260 115 Q 290 191, 325 191" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />

                    <path d="M 420 47 Q 460 47, 460 100" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />
                    <path d="M 420 120 H 460" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />
                    <path d="M 420 191 Q 460 191, 460 135" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />

                    {/* Nodes */}
                    <g transform="translate(15, 80)" className="da-node-btn">
                      <rect width="65" height="80" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                      <rect x="4" y="4" width="57" height="30" rx="4" fill="var(--da-svg-bg)" />
                      <text x="32.5" y="22" fill="var(--da-svg-text-dark)" fontSize="9.5" fontWeight="bold" textAnchor="middle">📱 CLIENT</text>
                      <text x="32.5" y="52" fill="var(--da-text-muted)" fontSize="8" fontWeight="bold" textAnchor="middle">SQL Query</text>
                      <text x="32.5" y="66" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">Select *</text>
                    </g>

                    <g transform="translate(135, 55)" className="da-node-btn">
                      <rect width="122" height="117" rx="8" fill="var(--da-svg-blue-bg)" stroke="var(--da-svg-blue-border)" strokeWidth="2.5" />
                      <rect x="6" y="6" width="110" height="26" rx="4" fill="var(--da-svg-blue-bg)" stroke="var(--da-svg-blue-border)" strokeWidth="1" />
                      <text x="61" y="22" fill="var(--da-svg-blue-text)" fontSize="10" fontWeight="bold" textAnchor="middle">🔍 COORDINATOR</text>
                      <text x="61" y="48" fill="var(--da-svg-blue-subtext)" fontSize="8.5" textAnchor="middle" fontWeight="semibold">Parses SQL Query</text>
                      <text x="61" y="64" fill="var(--da-svg-green-text)" fontSize="8.5" fontWeight="bold" textAnchor="middle">Checks Glue Catalog</text>
                      <rect x="12" y="78" width="98" height="18" rx="3.5" fill="var(--da-svg-green-bg)" />
                      <text x="61" y="90" fill="var(--da-svg-green-text)" fontSize="8" fontWeight="bold" textAnchor="middle">Task Optimizer</text>
                    </g>

                    {/* Workers */}
                    <g transform="translate(325, 20)" className="da-node-btn">
                      <rect width="95" height="55" rx="6" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                      <rect x="4" y="4" width="87" height="16" rx="3" fill="var(--da-svg-bg)" />
                      <circle cx="12" cy="12" r="3.5" fill="var(--da-svg-green-border)" />
                      <text x="51" y="15" fill="var(--da-svg-text-dark)" fontSize="9" fontWeight="bold" textAnchor="middle">👷 Worker #1</text>
                      <text x="47" y="40" fill="var(--da-text-muted)" fontSize="8" textAnchor="middle" fontWeight="semibold">Scan Partition A</text>
                    </g>
                    <g transform="translate(325, 92)" className="da-node-btn">
                      <rect width="95" height="55" rx="6" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                      <rect x="4" y="4" width="87" height="16" rx="3" fill="var(--da-svg-bg)" />
                      <circle cx="12" cy="12" r="3.5" fill="var(--da-svg-green-border)" />
                      <text x="51" y="15" fill="var(--da-svg-text-dark)" fontSize="9" fontWeight="bold" textAnchor="middle">👷 Worker #2</text>
                      <text x="47" y="40" fill="var(--da-text-muted)" fontSize="8" textAnchor="middle" fontWeight="semibold">Scan Partition B</text>
                    </g>
                    <g transform="translate(325, 164)" className="da-node-btn">
                      <rect width="95" height="55" rx="6" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                      <rect x="4" y="4" width="87" height="16" rx="3" fill="var(--da-svg-bg)" />
                      <circle cx="12" cy="12" r="3.5" fill="var(--da-svg-green-border)" />
                      <text x="51" y="15" fill="var(--da-svg-text-dark)" fontSize="9" fontWeight="bold" textAnchor="middle">👷 Worker #3</text>
                      <text x="47" y="40" fill="var(--da-text-muted)" fontSize="8" textAnchor="middle" fontWeight="semibold">Scan Partition C</text>
                    </g>

                    {/* S3 Lake */}
                    <g transform="translate(460, 65)" className="da-node-btn">
                      <ellipse cx="32" cy="75" rx="30" ry="9" fill="var(--da-svg-green-bg)" />
                      <path d="M 2 20 V 75 A 30 9 0 0 0 62 75 V 20 Z" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" strokeWidth="2" />
                      <ellipse cx="32" cy="20" rx="30" ry="9" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="2" />
                      <path d="M 2 34 A 30 8 0 0 0 62 34" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                      <path d="M 2 48 A 30 8 0 0 0 62 48" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1.2" opacity="0.5" />
                      
                      <text x="32" y="32" fill="var(--da-svg-green-text)" fontSize="12" fontWeight="bold" textAnchor="middle">🪣 S3</text>
                      <text x="32" y="56" fill="var(--da-svg-green-subtext)" fontSize="9" textAnchor="middle" fontWeight="bold">Parquet</text>
                      <text x="32" y="66" fill="var(--da-svg-green-subtext)" fontSize="8.5" textAnchor="middle">Lake</text>
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            {/* Lake Formation data governance Sandbox */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 border-b border-slate-150 pb-2 mb-3">
                  AWS Lake Formation Governance Sandbox
                </h3>
                <p className="text-[11.5px] text-slate-600 mb-4 leading-relaxed">
                  Select a security role below. Watch how Lake Formation automatically intercepts metadata and filters rows and columns dynamically.
                </p>

                {/* Role Toggles */}
                <div className="flex gap-2 mb-4">
                  <button onClick={() => changeLakeRole('admin')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${lakeRole === 'admin' ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'}`}>
                    👑 Data Admin
                  </button>
                  <button onClick={() => changeLakeRole('marketing')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${lakeRole === 'marketing' ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'}`}>
                    📊 Marketing Analyst
                  </button>
                  <button onClick={() => changeLakeRole('auditor')} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${lakeRole === 'auditor' ? 'bg-sky-600 text-white border-sky-600' : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'}`}>
                    🕵️ EU Auditor
                  </button>
                </div>

                {/* Visible Data Grid */}
                <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                        <th className="p-2 border-r border-slate-200">ID</th>
                        <th className="p-2 border-r border-slate-200">Name</th>
                        <th className="p-2 border-r border-slate-200">Email Address (PII)</th>
                        <th className="p-2 border-r border-slate-200">Region</th>
                        <th className="p-2">Sales</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lakeData
                        .filter((row) => lakeRole !== 'auditor' || row.region === 'EU')
                        .map((row, index) => (
                          <tr key={index} className="border-b border-slate-150 last:border-0 hover:bg-slate-50 text-slate-600">
                            <td className="p-2 border-r border-slate-200 font-mono font-bold">{row.id}</td>
                            <td className="p-2 border-r border-slate-200">{row.name}</td>
                            <td className="p-2 border-r border-slate-200 text-slate-500">
                              {lakeRole === 'marketing' ? '****@***.com' : row.email}
                            </td>
                            <td className="p-2 border-r border-slate-200 font-bold">{row.region}</td>
                            <td className="p-2 font-mono font-bold text-sky-700">${row.sales.toLocaleString()}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Lake formation audit console */}
                <div className="bg-slate-50 border border-slate-250 rounded-xl p-3 h-[110px] font-mono text-[10px] text-slate-750 overflow-y-auto space-y-1.5 shadow-inner">
                  {lakeLogs.length === 0 ? (
                    <span className="text-slate-500 italic block text-center mt-8">Select a role above to trace governance logging.</span>
                  ) : (
                    lakeLogs.map((log, idx) => {
                      let color = 'text-slate-650';
                      if (log.includes('Role:')) color = 'text-sky-700 font-semibold bg-sky-50 px-1 rounded';
                      if (log.includes('🔓') || log.includes('🔒')) color = 'text-purple-700 font-semibold bg-purple-50 px-1 rounded';
                      return <div key={idx} className={`${color} pb-1 border-b border-slate-100`}>{log}</div>;
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* NEW: AWS GLUE SERVERLESS ETL & SCHEMA REGISTRY SANDBOX                   */}
          {/* ========================================================================= */}
          <div className="da-card bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mt-6">
            <div className="w-full flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-purple-600 animate-pulse" /> Sandbox: AWS Glue Serverless ETL &amp; Schema Registry
                </h3>
                <p className="text-[11px] text-slate-500">Configure crawler schemas, stream registries, and Spark conversion jobs to Parquet lakehouses</p>
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {/* File format */}
                <select
                  value={glueFileType}
                  onChange={(e) => setGlueFileType(e.target.value as 'json' | 'csv' | 'parquet')}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none font-bold text-slate-700"
                >
                  <option value="json">Source format: JSON (Raw)</option>
                  <option value="csv">Source format: CSV (Raw)</option>
                </select>

                {/* Job engine */}
                <select
                  value={glueJobType}
                  onChange={(e) => setGlueJobType(e.target.value as 'spark' | 'ray' | 'python-shell')}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none font-bold text-slate-700"
                >
                  <option value="spark">Engine: Apache Spark (Serverless)</option>
                  <option value="ray">Engine: Ray Distributed (Python)</option>
                  <option value="python-shell">Engine: Python Shell (Lightweight)</option>
                </select>

                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700">
                  <label htmlFor="registry-chk" className="cursor-pointer">Schema Registry:</label>
                  <input
                    id="registry-chk"
                    type="checkbox"
                    checked={glueSchemaRegistry}
                    onChange={(e) => setGlueSchemaRegistry(e.target.checked)}
                    className="w-3.5 h-3.5 accent-purple-600 cursor-pointer"
                  />
                </div>

                <button
                  disabled={glueJobState !== 'idle'}
                  onClick={runGlueCrawler}
                  className="px-3.5 py-2 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
                >
                  🕸️ Run Crawler
                </button>

                <button
                  disabled={glueJobState !== 'idle'}
                  onClick={runGlueEtlJob}
                  className="px-3.5 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-500 disabled:bg-slate-200 disabled:text-slate-400 transition-colors shadow-sm"
                >
                  ⚙️ Run ETL Job
                </button>

                <button
                  onClick={resetGlueSandbox}
                  className="p-2 bg-slate-100 text-slate-650 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Glue SVG Pipeline */}
              <div className="lg:col-span-8 bg-slate-50 rounded-xl border border-slate-200 p-3 relative overflow-hidden flex items-center justify-center min-h-[350px] shadow-inner">
                <svg className="w-full h-full max-w-[660px] da-svg-bg rounded-lg" viewBox="0 0 650 320">
                  <defs>
                    <marker id="glue-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {/* Flow conduits */}
                  <path d="M 90 90 H 155" fill="none" stroke="#cbd5e1" strokeWidth="2.5" markerEnd="url(#glue-arrow)" />
                  <path d="M 255 90 H 315" fill="none" stroke="#cbd5e1" strokeWidth="2.5" markerEnd="url(#glue-arrow)" />
                  <path d="M 430 90 H 495" fill="none" stroke="#cbd5e1" strokeWidth="2.5" markerEnd="url(#glue-arrow)" />
                  
                  {/* Crawler link paths */}
                  <path d="M 372 135 V 205" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#glue-arrow)" />
                  <path d="M 195 240 H 290" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#glue-arrow)" />

                  {/* Active Crawler Flow */}
                  {glueJobState === 'crawling' && (
                    <>
                      <path d="M 195 240 H 290" fill="none" stroke="#0ea5e9" strokeWidth="2" className="da-flow-blue" />
                      <path d="M 372 135 V 205" fill="none" stroke="#0ea5e9" strokeWidth="2" className="da-flow-blue" />
                    </>
                  )}

                  {/* Active ETL job flow */}
                  {glueJobState === 'etl-running' && (
                    <>
                      <path d="M 90 90 H 155" fill="none" stroke="#a855f7" strokeWidth="3" className="da-flow-purple" />
                      <path d="M 255 90 H 315" fill="none" stroke="#ea580c" strokeWidth="3" className="da-flow-orange" />
                      <path d="M 430 90 H 495" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                    </>
                  )}

                  {glueJobState === 'completed' && (
                    <>
                      <path d="M 90 90 H 155" fill="none" stroke="#10b981" strokeWidth="2.5" />
                      <path d="M 255 90 H 315" fill="none" stroke="#10b981" strokeWidth="2.5" />
                      <path d="M 430 90 H 495" fill="none" stroke="#10b981" strokeWidth="2.5" />
                    </>
                  )}

                  {/* 1. S3 Landing zone (Raw) */}
                  <g transform="translate(10, 52)">
                    <ellipse cx="40" cy="65" rx="35" ry="9" fill="var(--da-svg-amber-bg)" />
                    <path d="M 5 20 V 65 A 35 9 0 0 0 75 65 V 20 Z" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-amber-border)" strokeWidth="2" />
                    <ellipse cx="40" cy="20" rx="35" ry="9" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="2" />
                    <text x="40" y="32" fill="var(--da-svg-amber-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">🪣 RAW S3</text>
                    <text x="40" y="52" fill="var(--da-svg-amber-subtext)" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {glueFileType.toUpperCase()} Files
                    </text>
                  </g>

                  {/* 2. Schema Registry */}
                  <g transform="translate(155, 52)">
                    <rect width="100" height="75" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-purple-border)" strokeWidth="2.5" className={glueSchemaRegistry ? 'active-svg-glow' : ''} />
                    <rect x="4" y="4" width="92" height="18" rx="3" fill="var(--da-svg-purple-bg)" />
                    <text x="50" y="16.5" fill="var(--da-svg-purple-text)" fontSize="8" fontWeight="extrabold" textAnchor="middle">📃 REGISTRY</text>
                    <text x="50" y="38" fill="var(--da-svg-purple-subtext)" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {glueSchemaRegistry ? 'AVRO Verified' : 'Registry Bypass'}
                    </text>
                    <text x="50" y="52" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">Enforces compatibility</text>
                  </g>

                  {/* 3. Glue Spark ETL Job compute engine */}
                  <g transform="translate(315, 45)">
                    <rect width="115" height="90" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-amber-border)" strokeWidth="2.5" />
                    <rect x="4" y="4" width="107" height="20" rx="3.5" fill="var(--da-svg-amber-bg)" />
                    <text x="57.5" y="17.5" fill="var(--da-svg-amber-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">⚙️ GLUE JOB ({glueJobType.toUpperCase()})</text>
                    <circle cx="57.5" cy="55" r="16" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-amber-border)" strokeWidth="2" strokeDasharray="3 3" className={glueJobState === 'etl-running' ? 'pulse-circle' : ''} />
                    <text x="57.5" y="58.5" fill="var(--da-svg-amber-text)" fontSize="10" fontWeight="extrabold" textAnchor="middle">SPARK</text>
                    <text x="57.5" y="82" fill="var(--da-svg-amber-subtext)" fontSize="7" textAnchor="middle">10 DPUs Configured</text>
                  </g>

                  {/* 4. S3 Refined Zone (Parquet) */}
                  <g transform="translate(495, 52)">
                    <ellipse cx="40" cy="65" rx="35" ry="9" fill="var(--da-svg-green-bg)" />
                    <path d="M 5 20 V 65 A 35 9 0 0 0 75 65 V 20 Z" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" strokeWidth="2" />
                    <ellipse cx="40" cy="20" rx="35" ry="9" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="2" />
                    <text x="40" y="32" fill="var(--da-svg-green-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">🪣 REFINED S3</text>
                    <text x="40" y="52" fill="var(--da-svg-green-subtext)" fontSize="8" fontWeight="bold" textAnchor="middle">PARQUET Blocks</text>
                  </g>

                  {/* 5. Glue Crawler (Bottom Left) */}
                  <g transform="translate(75, 205)">
                    <rect width="120" height="70" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-blue-border)" strokeWidth="2" className={glueJobState === 'crawling' ? 'active-svg-glow' : ''} />
                    <rect x="4" y="4" width="112" height="18" rx="3" fill="var(--da-svg-blue-bg)" />
                    <text x="60" y="16.5" fill="var(--da-svg-blue-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">🕸️ GLUE CRAWLER</text>
                    <text x="60" y="38" fill="var(--da-svg-blue-subtext)" fontSize="8" fontWeight="bold" textAnchor="middle">Scans raw files</text>
                    <text x="60" y="52" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">Infers columns schemas</text>
                  </g>

                  {/* 6. Centralized Glue Catalog Database (Bottom Center-Right) */}
                  <g transform="translate(290, 205)">
                    <rect width="165" height="70" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" strokeWidth="2.5" />
                    <rect x="4" y="4" width="157" height="18" rx="3.5" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1" />
                    <text x="82.5" y="16.5" fill="var(--da-svg-green-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">📖 CENTRAL GLUE CATALOG</text>
                    <text x="82.5" y="38" fill="var(--da-svg-green-subtext)" fontSize="8" textAnchor="middle" fontWeight="bold">Central Unified Hive Metastore</text>
                    <text x="82.5" y="52" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Syncs schemas to Athena SQL</text>
                  </g>
                </svg>
              </div>

              {/* Glue Trace Console */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 shadow-sm flex flex-col justify-between h-[350px]">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-2">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                        <Terminal className="w-4 h-4 text-sky-500" /> Glue Console Log Trace
                      </span>
                      <span className="badge bg-purple-50 text-purple-700 text-[10px] font-bold">DPU: active</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-950 rounded-xl p-3 h-[250px] font-mono text-[9px] text-slate-300 overflow-y-auto space-y-1.5 shadow-inner">
                      {glueLogs.length === 0 ? (
                        <span className="text-slate-500 italic block text-center mt-24">Select schema options and trigger crawlers or serverless ETL jobs.</span>
                      ) : (
                        glueLogs.map((log, idx) => {
                          let color = 'text-slate-350';
                          if (log.includes('CRAWLER:')) color = 'text-sky-400 font-bold';
                          if (log.includes('SCHEMA REGISTRY:')) color = 'text-purple-400 font-bold';
                          if (log.includes('SUCCESS') || log.includes('✅')) color = 'text-emerald-400 font-bold bg-emerald-950/40 px-1 rounded';
                          if (log.includes('GLUE JOB:')) color = 'text-amber-400';
                          return <div key={idx} className={`${color} pb-0.5 border-b border-slate-800/40`}>{log}</div>;
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Glue Core Theory specifications sheet */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t border-slate-100 pt-4 text-left">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="font-bold text-xs text-sky-950 block">🕸️ AWS Glue Schema Crawlers</span>
                <p className="text-[10px] leading-relaxed text-slate-600">
                  Crawlers programmatically connect to datastores (S3, RDS, DynamoDB), parse file formats (CSV, Parquet, JSON), determine keys, and write inferred catalog table schemas inside the centralized databases Metastore.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="font-bold text-xs text-purple-950 block">🛡️ AWS Glue Schema Registry</span>
                <p className="text-[10px] leading-relaxed text-slate-600">
                  Enforces schema consistency rules across streaming interfaces (Kinesis Streams/Kafka brokers). Compares JSON or AVRO message payloads to registered metadata models, filtering out invalid, malformed fields automatically.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <span className="font-bold text-xs text-emerald-950 block">⚡ Serverless ETL Engines (Spark, Ray)</span>
                <p className="text-[10px] leading-relaxed text-slate-600">
                  Runs massively parallel serverless transformation clusters. Convert nested, heavy rows into snappy-compressed columnar Parquet blocks—**reducing S3 data scanned bytes by up to 85%** and speeding Athena query speeds 12x.
                </p>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* NEW: ATHENA PERFORMANCE TUNER & FEDERATED WORKBENCH                      */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 border-t border-slate-200 pt-6">
            {/* Left Column: Performance Tuner Workbench */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 border-b border-slate-150 pb-2 mb-3 flex items-center gap-1.5">
                  📈 Athena Query Performance &amp; Cost Optimizer Workbench
                </h3>
                <p className="text-[11px] text-slate-500 mb-4">
                  Handwritten Notes Reference: Implement columnar formatting, SNAPPY compression, S3 dataset partitioning, and optimized file sizes (&gt;128MB) to reduce scanned bytes.
                </p>

                {/* Optimizers Control Panel */}
                <div className="space-y-4 text-xs">
                  {/* Format Toggle */}
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <div>
                      <span className="font-bold text-slate-700 block">1. Storage Format (Parquet/ORC vs Row)</span>
                      <span className="text-[10px] text-slate-500">Columnar scans only target columns; Row (CSV/JSON) scans full lines.</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setAthenaFormat('row')}
                        className={`px-3 py-1 rounded-lg font-bold text-[10px] border transition-all ${athenaFormat === 'row' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'}`}
                      >
                        CSV/JSON (Row)
                      </button>
                      <button
                        onClick={() => setAthenaFormat('columnar')}
                        className={`px-3 py-1 rounded-lg font-bold text-[10px] border transition-all ${athenaFormat === 'columnar' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white border-slate-200 text-slate-650 hover:bg-slate-50'}`}
                      >
                        Parquet/ORC
                      </button>
                    </div>
                  </div>

                  {/* Compression Toggle */}
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <div>
                      <span className="font-bold text-slate-700 block">2. Data Compression (Snappy/Gzip)</span>
                      <span className="text-[10px] text-slate-500">Compressing files minimizes data retrieval sizes over S3 network.</span>
                    </div>
                    <button
                      onClick={() => setAthenaCompress(!athenaCompress)}
                      className={`px-4 py-1.5 rounded-lg font-bold text-[10px] border transition-all ${athenaCompress ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {athenaCompress ? '🟢 Enabled (Snappy)' : '❌ Disabled (Plain)'}
                    </button>
                  </div>

                  {/* Partitioning Toggle */}
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <div>
                      <span className="font-bold text-slate-700 block">3. Dataset Partitioning (Virtual Columns)</span>
                      <span className="text-[10px] text-slate-500">Limits scans to directories matching virtual prefix (e.g. year=1991).</span>
                    </div>
                    <button
                      onClick={() => setAthenaPartition(!athenaPartition)}
                      className={`px-4 py-1.5 rounded-lg font-bold text-[10px] border transition-all ${athenaPartition ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {athenaPartition ? '🟢 Enabled (Partitioned)' : '❌ Disabled (Full Scan)'}
                    </button>
                  </div>

                  {/* File Size Toggle */}
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    <div>
                      <span className="font-bold text-slate-700 block">4. File Size Consolidation (&gt;128 MB)</span>
                      <span className="text-[10px] text-slate-500">Larger consolidated files minimize Glue/S3 directory metadata overhead.</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setAthenaFileSize('small')}
                        className={`px-3 py-1 rounded-lg font-bold text-[10px] border transition-all ${athenaFileSize === 'small' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-white border-slate-200 text-slate-650'}`}
                      >
                        Small Files (&lt;10MB)
                      </button>
                      <button
                        onClick={() => setAthenaFileSize('large')}
                        className={`px-3 py-1 rounded-lg font-bold text-[10px] border transition-all ${athenaFileSize === 'large' ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-white border-slate-200 text-slate-650'}`}
                      >
                        Large Files (&gt;128MB)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Live Cost & Performance Stats Indicator */}
              <div className="mt-4 border-t border-slate-150 pt-4 space-y-3">
                <span className="text-xs font-bold text-slate-700 block">Simulated Execution Metrics:</span>
                
                {/* Metrics boxes */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  {/* Scanned size */}
                  <div className="border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase mb-0.5">Bytes Scanned</span>
                    <span className={`text-sm font-extrabold ${athenaFormat === 'columnar' && athenaPartition ? 'text-emerald-700' : 'text-slate-800'}`}>
                      {(() => {
                        let size = 500; // GB
                        if (athenaCompress) size = size * 0.3;
                        if (athenaFormat === 'columnar') size = size * 0.05;
                        if (athenaPartition) size = size * 0.1;
                        return size >= 1 ? `${size.toFixed(1)} GB` : `${(size * 1024).toFixed(0)} MB`;
                      })()}
                    </span>
                  </div>

                  {/* Scanned Cost */}
                  <div className="border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase mb-0.5">Query Cost ($)</span>
                    <span className="text-sm font-extrabold text-sky-700">
                      ${(() => {
                        let size = 500; // GB
                        if (athenaCompress) size = size * 0.3;
                        if (athenaFormat === 'columnar') size = size * 0.05;
                        if (athenaPartition) size = size * 0.1;
                        let cost = (size / 1024) * 5; // $5 per TB
                        return cost < 0.01 ? '0.001' : cost.toFixed(3);
                      })()}
                    </span>
                  </div>

                  {/* Latency */}
                  <div className="border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                    <span className="text-[9px] font-bold text-slate-400 block uppercase mb-0.5">Scan Latency</span>
                    <span className="text-sm font-extrabold text-amber-700">
                      {(() => {
                        let latency = 18.5; // s
                        if (athenaCompress) latency *= 0.6;
                        if (athenaFormat === 'columnar') latency *= 0.15;
                        if (athenaPartition) latency *= 0.2;
                        if (athenaFileSize === 'large') latency *= 0.8;
                        return `${latency.toFixed(2)}s`;
                      })()}
                    </span>
                  </div>
                </div>

                {/* Directory S3 Path Box */}
                <div className="bg-slate-900 text-slate-200 p-2.5 rounded-xl text-[10.5px] font-mono leading-relaxed overflow-x-auto shadow-inner">
                  <div className="text-slate-400 text-[9px] uppercase font-bold mb-1 border-b border-slate-800 pb-0.5">Target S3 Directory Path</div>
                  {athenaPartition ? (
                    <span className="text-emerald-400">s3://athena-flight-bucket/parquet/year=1991/month=1/day=1/</span>
                  ) : (
                    <span className="text-amber-400">s3://athena-flight-bucket/raw-logs/*</span>
                  )}
                  <span className="block text-slate-500 mt-1 text-[9px]">
                    {athenaFormat === 'columnar' ? '🚀 COLUMNAR SCAN: Scanning only selected index bytes!' : '⚠️ ROW SCAN: Scanning all table columns across full text files!'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Federated Query Active Simulator Map */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 border-b border-slate-150 pb-2 mb-3 flex items-center justify-between">
                  <span>🔌 Athena Federated Queries (Multi-Source Connectors)</span>
                  <span className="badge bg-purple-50 text-purple-700 text-[10px]">Lambda Connectors</span>
                </h3>
                <p className="text-[11.5px] text-slate-650 mb-3 leading-relaxed">
                  Handwritten Notes Reference: Run SQL queries across relational, non-relational, object &amp; custom data pools (AWS/on-premise). Utilizes Lambda datasource connectors and saves final consolidated aggregates back into S3.
                </p>

                {/* Federated Control bar */}
                <div className="flex gap-2 mb-3">
                  <select
                    value={federatedDb}
                    onChange={(e) => setFederatedDb(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs outline-none font-bold text-slate-700"
                  >
                    <option value="dynamodb">Source: Amazon DynamoDB</option>
                    <option value="rds-aurora">Source: RDS Aurora Cluster</option>
                    <option value="elasticache">Source: ElastiCache Redis</option>
                    <option value="documentdb">Source: Amazon DocumentDB</option>
                    <option value="redshift">Source: Amazon Redshift DW</option>
                    <option value="emr-hbase">Source: HBase in EMR Hadoop</option>
                    <option value="on-prem">Source: On-Premises database</option>
                  </select>
                  <button
                    disabled={federatedState !== 'idle'}
                    onClick={triggerFederatedQuery}
                    className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-500 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" /> Query Source
                  </button>
                  <button
                    onClick={resetFederatedQuery}
                    className="p-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Brand New Federated Query SVG Map */}
                <div className="w-full h-[250px] rounded-xl border border-slate-200 relative p-1.5 flex items-center justify-center shadow-inner bg-slate-50 overflow-hidden">
                  <svg className="w-full h-full da-svg-bg" viewBox="0 0 540 240">
                    <defs>
                      <marker id="fed-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                      </marker>
                    </defs>

                    {/* Base conduits */}
                    <path d="M 90 45 Q 130 25, 170 45" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M 220 90 V 125" fill="none" stroke="#a855f7" strokeWidth="2" markerEnd="url(#fed-arrow)" />
                    
                    <path d="M 195 155 Q 120 160, 85 140" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#fed-arrow)" />
                    <path d="M 195 155 Q 120 195, 85 205" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#fed-arrow)" />
                    <path d="M 245 155 H 370" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#fed-arrow)" />
                    <path d="M 245 155 Q 315 195, 380 205" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#fed-arrow)" />
                    <path d="M 245 155 Q 345 160, 445 140" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#fed-arrow)" />

                    {/* Active flow animations */}
                    {federatedState === 'querying' && (
                      <path d="M 220 90 V 125" fill="none" stroke="#a855f7" strokeWidth="3" className="da-flow-purple" />
                    )}

                    {federatedState === 'fetching' && (
                      <>
                        <path d="M 220 90 V 125" fill="none" stroke="#a855f7" strokeWidth="3" className="da-flow-purple" />
                        {federatedDb === 'dynamodb' && <path d="M 195 155 Q 120 160, 85 140" fill="none" stroke="#ea580c" strokeWidth="3.5" className="da-flow-orange" />}
                        {federatedDb === 'rds-aurora' && <path d="M 195 155 Q 120 195, 85 205" fill="none" stroke="#10b981" strokeWidth="3.5" className="da-flow-green" />}
                        {federatedDb === 'elasticache' && <path d="M 245 155 H 370" fill="none" stroke="#ef4444" strokeWidth="3.5" className="da-flow-orange" />}
                        {federatedDb === 'documentdb' && <path d="M 245 155 Q 315 195, 380 205" fill="none" stroke="#a855f7" strokeWidth="3.5" className="da-flow-purple" />}
                        {federatedDb === 'redshift' && <path d="M 245 155 Q 345 160, 445 140" fill="none" stroke="#0ea5e9" strokeWidth="3.5" className="da-flow-blue" />}
                        {federatedDb === 'emr-hbase' && <path d="M 245 155 H 370" fill="none" stroke="#3b82f6" strokeWidth="3.5" className="da-flow-blue" />}
                        {federatedDb === 'on-prem' && <path d="M 245 155 Q 315 195, 380 205" fill="none" stroke="#64748b" strokeWidth="3" className="da-flow-sky" />}
                      </>
                    )}

                    {federatedState === 'saving' && (
                      <path d="M 170 45 Q 130 25, 90 45" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                    )}

                    {/* Nodes */}
                    <g transform="translate(20, 20)" className="da-node-btn">
                      <rect width="70" height="50" rx="8" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                      <text x="35" y="22" fill="var(--da-svg-green-text)" fontSize="10.5" fontWeight="bold" textAnchor="middle">🪣 S3</text>
                      <text x="35" y="38" fill="var(--da-svg-green-subtext)" fontSize="8" textAnchor="middle">Results Storage</text>
                    </g>

                    <g transform="translate(170, 25)" className="da-node-btn">
                      <rect width="110" height="65" rx="8" fill="var(--da-svg-blue-bg)" stroke="var(--da-svg-blue-border)" strokeWidth="2.5" />
                      <text x="55" y="24" fill="var(--da-svg-blue-text)" fontSize="11" fontWeight="bold" textAnchor="middle">🔍 ATHENA</text>
                      <text x="55" y="44" fill="var(--da-svg-blue-subtext)" fontSize="8.5" textAnchor="middle">Federated Query</text>
                      <text x="55" y="54" fill="var(--da-svg-blue-text)" fontSize="7.5" textAnchor="middle" fontWeight="bold">Distributor Engine</text>
                    </g>

                    <g transform="translate(195, 125)" className="da-node-btn">
                      <circle cx="25" cy="25" r="28" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="2" />
                      <circle cx="25" cy="25" r="28" fill="none" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" className={federatedState === 'fetching' ? 'pulse-circle' : ''} />
                      <text x="25" y="31" fill="var(--da-svg-amber-text)" fontSize="18" fontWeight="bold" textAnchor="middle">λ</text>
                      <text x="25" y="46" fill="var(--da-svg-amber-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">CONNECTOR</text>
                    </g>

                    <g transform="translate(10, 120)" className="da-node-btn">
                      <rect width="75" height="40" rx="5" fill={federatedDb === 'dynamodb' ? 'var(--da-svg-amber-bg)' : 'var(--da-svg-node-fill)'} stroke={federatedDb === 'dynamodb' ? 'var(--da-svg-amber-border)' : 'var(--da-svg-node-border)'} strokeWidth="1.5" />
                      <text x="37.5" y="24" fill="var(--da-svg-text-dark)" fontSize="8" fontWeight="bold" textAnchor="middle">⚡ DynamoDB</text>
                    </g>
                    <g transform="translate(10, 185)" className="da-node-btn">
                      <rect width="75" height="40" rx="5" fill={federatedDb === 'rds-aurora' ? 'var(--da-svg-green-bg)' : 'var(--da-svg-node-fill)'} stroke={federatedDb === 'rds-aurora' ? 'var(--da-svg-green-border)' : 'var(--da-svg-node-border)'} strokeWidth="1.5" />
                      <text x="37.5" y="24" fill="var(--da-svg-text-dark)" fontSize="8" fontWeight="bold" textAnchor="middle">🛢️ RDS Aurora</text>
                    </g>
                    
                    <g transform="translate(370, 140)" className="da-node-btn">
                      <rect width="80" height="40" rx="5" fill={federatedDb === 'elasticache' || federatedDb === 'emr-hbase' ? 'var(--da-svg-blue-bg)' : 'var(--da-svg-node-fill)'} stroke={federatedDb === 'elasticache' || federatedDb === 'emr-hbase' ? 'var(--da-svg-blue-border)' : 'var(--da-svg-node-border)'} strokeWidth="1.5" />
                      <text x="40" y="24" fill="var(--da-svg-text-dark)" fontSize="8" fontWeight="bold" textAnchor="middle">
                        {federatedDb === 'emr-hbase' ? '📦 HBase EMR' : '🔌 Redis Cache'}
                      </text>
                    </g>

                    <g transform="translate(380, 185)" className="da-node-btn">
                      <rect width="85" height="40" rx="5" fill={federatedDb === 'documentdb' || federatedDb === 'on-prem' ? 'var(--da-svg-purple-bg)' : 'var(--da-svg-node-fill)'} stroke={federatedDb === 'documentdb' || federatedDb === 'on-prem' ? 'var(--da-svg-purple-border)' : 'var(--da-svg-node-border)'} strokeWidth="1.5" />
                      <text x="42.5" y="24" fill="var(--da-svg-text-dark)" fontSize="8" fontWeight="bold" textAnchor="middle">
                        {federatedDb === 'on-prem' ? '🏢 On-Prem DB' : '🗄️ DocumentDB'}
                      </text>
                    </g>

                    <g transform="translate(445, 120)" className="da-node-btn">
                      <rect width="75" height="40" rx="5" fill={federatedDb === 'redshift' ? 'var(--da-svg-blue-bg)' : 'var(--da-svg-node-fill)'} stroke={federatedDb === 'redshift' ? 'var(--da-svg-blue-border)' : 'var(--da-svg-node-border)'} strokeWidth="1.5" />
                      <text x="37.5" y="24" fill="var(--da-svg-text-dark)" fontSize="8" fontWeight="bold" textAnchor="middle">⚡ Redshift DW</text>
                    </g>
                  </svg>
                </div>
              </div>

              {/* Federated trace console logs */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 h-[90px] font-mono text-[9px] text-slate-700 overflow-y-auto space-y-1 mt-3 shadow-inner">
                {federatedLogs.length === 0 ? (
                  <span className="text-slate-500 italic block text-center mt-5">Select a database source and click "Query Source" to simulate the Lambda SQL pipeline.</span>
                ) : (
                  federatedLogs.map((log, idx) => {
                    let color = 'text-slate-650';
                    if (log.includes('✅') || log.includes('SUCCESS')) color = 'text-emerald-700 font-semibold bg-emerald-50 px-1 rounded';
                    if (log.includes('CONNECTOR') || log.includes('DISPATCH')) color = 'text-purple-700 font-semibold bg-purple-50 px-1 rounded';
                    if (log.includes('S3 WRITE')) color = 'text-sky-700 font-semibold bg-sky-50 px-1 rounded';
                    return <div key={idx} className={`${color} pb-0.5 border-b border-slate-100`}>{log}</div>;
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: REDSHIFT WAREHOUSING & DR SNAPSHOT SIMULATOR                        */}
      {/* ========================================================================= */}
      {activeTab === 'warehousing' && (
        <div className="space-y-6">
          {/* Section Introduction */}
          <div className="da-card">
            <h2 className="da-card-title text-sky-700">
              <TrendingUp className="w-5 h-5" /> Enterprise Warehousing: Amazon Redshift (OLAP) &amp; Disaster Recovery Coordinator
            </h2>
            <p className="da-card-desc text-slate-700">
              Amazon Redshift is an enterprise-grade, PostgreSQL-compatible, column-oriented OLAP (Online Analytical Processing) data warehouse designed for petabyte-scale analytics. It employs a Leader Node for query plan compilation and parallel task distribution, executing scans across concurrent Compute Nodes. This console lets you simulate MPP Query optimization and coordinate automatic cross-region incremental disaster recovery (DR) snapshots.
            </p>
            <div className="mt-3 bg-sky-50 border border-sky-150 rounded-xl p-3.5 flex gap-2.5 items-start shadow-sm">
              <Info className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
              <div className="text-[11.5px] leading-relaxed text-slate-700">
                <span className="font-bold text-sky-900">💡 Exam Tip &amp; Notebook Reference:</span> Analyze raw files in S3 using serverless SQL with Athena. For PB-scale data warehousing, high-speed joins, and complex OLAP aggregations, use Redshift MPP. Compute nodes execute scans concurrently across columnar data blocks, bypassing 85% of standard row files. Automated snapshot policies copy incremental blocks to S3 every 5h/8h/schedule with customizable retention and cross-region replication for instant DR failover.
              </div>
            </div>
          </div>

          {/* Interactive Sandboxes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: MPP Parallel Query Engine Simulator */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 border-b border-slate-150 pb-2.5 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sky-850">🎛️ Leader-Compute MPP Parallel Query Sandbox</span>
                  <span className="badge bg-sky-50 text-sky-700 text-[10px] font-extrabold uppercase">OLAP Engine</span>
                </h3>
                <p className="text-[11.5px] text-slate-600 mb-4 leading-relaxed">
                  Select a heavy analytical query. Watch how the **Leader Node** compiles an execution plan, sends task slices to **Compute Nodes**, and scans <i>only the specific columnar index data blocks</i> instead of scanning the full tables.
                </p>

                {/* SQL Query Selection */}
                <div className="space-y-3 mb-4">
                  <div className="bg-slate-50 border border-slate-150 rounded-xl p-3">
                    <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1.5">Select Analytical OLAP Query:</label>
                    <select
                      value={redshiftQuery}
                      onChange={(e) => {
                        setRedshiftQuery(e.target.value);
                        resetRedshiftMpp();
                      }}
                      disabled={redshiftMppState !== 'idle'}
                      className="w-full bg-white border border-slate-250 rounded-lg p-1.5 text-xs outline-none font-bold text-slate-700"
                    >
                      <option value="sales-sum">📊 Category Revenue: SELECT category, SUM(revenue) FROM sales GROUP BY category;</option>
                      <option value="user-join">🔗 Region Counts: SELECT u.region, COUNT(t.id) FROM users u JOIN transactions t ON u.id = t.user_id GROUP BY u.region;</option>
                      <option value="window-agg">📈 Regional Sales Trend: SELECT year, region, SUM(amount) OVER (PARTITION BY region ORDER BY year) FROM orders WHERE year &gt;= 1991;</option>
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      disabled={redshiftMppState !== 'idle'}
                      onClick={triggerRedshiftMppQuery}
                      className="flex-1 py-2 bg-sky-600 hover:bg-sky-550 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:bg-slate-150 disabled:text-slate-400"
                    >
                      <Play className="w-3.5 h-3.5" /> Execute MPP Query
                    </button>
                    <button
                      onClick={resetRedshiftMpp}
                      className="px-3.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center"
                      title="Reset Simulator"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* MPP Architecture SVG */}
                <div className="w-full h-[220px] rounded-xl border border-slate-200 relative p-1.5 flex items-center justify-center shadow-inner bg-slate-50 overflow-hidden">
                  <svg className="w-full h-full da-svg-bg" viewBox="0 0 460 220">
                    <defs>
                      <marker id="rs-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                      </marker>
                    </defs>

                    {/* Client Link to Leader Node */}
                    <path d="M 45 110 H 95" fill="none" stroke="#64748b" strokeWidth="2" markerEnd="url(#rs-arrow)" />
                    {redshiftMppState === 'client-send' && (
                      <path d="M 45 110 H 95" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-sky" />
                    )}
                    {redshiftMppState === 'client-receive' && (
                      <path d="M 95 110 H 45" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                    )}

                    {/* Leader Node to Compute Node 1 and 2 */}
                    <path d="M 180 110 L 225 50" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#rs-arrow)" />
                    <path d="M 180 110 L 225 170" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#rs-arrow)" />

                    {redshiftMppState === 'leader-plan' && (
                      <>
                        <path d="M 180 110 L 225 50" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="4 4" className="da-flow-blue" />
                        <path d="M 180 110 L 225 170" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="4 4" className="da-flow-blue" />
                      </>
                    )}
                    {redshiftMppState === 'compute-scan' && (
                      <>
                        <path d="M 180 110 L 225 50" fill="none" stroke="#8b5cf6" strokeWidth="3" className="da-flow-purple" />
                        <path d="M 180 110 L 225 170" fill="none" stroke="#8b5cf6" strokeWidth="3" className="da-flow-purple" />
                      </>
                    )}
                    {redshiftMppState === 'leader-aggregate' && (
                      <>
                        <path d="M 225 50 L 180 110" fill="none" stroke="#eab308" strokeWidth="3" className="da-flow-orange" />
                        <path d="M 225 170 L 180 110" fill="none" stroke="#eab308" strokeWidth="3" className="da-flow-orange" />
                      </>
                    )}

                    {/* Spectrum direct query to S3 */}
                    <path d="M 335 50 H 385" fill="none" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="2 3" markerEnd="url(#rs-arrow)" />
                    <path d="M 335 170 H 385" fill="none" stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="2 3" markerEnd="url(#rs-arrow)" />

                    {/* Client Node */}
                    <g transform="translate(5, 80)" className="da-node-btn">
                      <rect width="40" height="60" rx="6" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                      <rect x="3" y="3" width="34" height="18" rx="3" fill="var(--da-svg-bg)" />
                      <text x="20" y="14" fill="var(--da-svg-text-dark)" fontSize="7" fontWeight="bold" textAnchor="middle">📱 CLIENT</text>
                      <text x="20" y="35" fill="var(--da-text-muted)" fontSize="6.5" textAnchor="middle">BI Tool</text>
                      <text x="20" y="45" fill="#0284c7" fontSize="6" fontWeight="bold" textAnchor="middle">JDBC/ODBC</text>
                    </g>

                    {/* Leader Node */}
                    <g transform="translate(95, 65)" className="da-node-btn">
                      <rect width="85" height="90" rx="8" fill="var(--da-svg-blue-bg)" stroke="var(--da-svg-blue-border)" strokeWidth="2" />
                      {redshiftMppState === 'leader-plan' && (
                        <rect width="85" height="90" rx="8" fill="none" stroke="var(--da-svg-blue-border)" strokeWidth="2.5" className="pulse-border" />
                      )}
                      
                      <rect x="5" y="5" width="75" height="15" rx="3" fill="var(--da-svg-blue-bg)" stroke="var(--da-svg-blue-border)" strokeWidth="0.5" />
                      <text x="42.5" y="15" fill="var(--da-svg-blue-text)" fontSize="8" fontWeight="extrabold" textAnchor="middle">👑 LEADER NODE</text>
                      
                      <text x="42.5" y="35" fill="var(--da-svg-blue-subtext)" fontSize="6.5" textAnchor="middle" fontWeight="bold">Plan Compiler</text>
                      <text x="42.5" y="47" fill="var(--da-svg-blue-text)" fontSize="6.5" textAnchor="middle">Task Optimizer</text>
                      
                      {/* Mini state visualization banner */}
                      <rect x="8" y="58" width="69" height="24" rx="3" fill="var(--da-svg-bg)" stroke="var(--da-card-border)" />
                      <text x="42.5" y="67" fill="var(--da-text-muted)" fontSize="6.5" fontWeight="bold" textAnchor="middle">STAGE:</text>
                      <text x="42.5" y="77" fill="var(--da-svg-blue-text)" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        {redshiftMppState.toUpperCase()}
                      </text>
                    </g>

                    {/* Compute Node #1 */}
                    <g transform="translate(225, 10)" className="da-node-btn">
                      <rect width="110" height="80" rx="6" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="2" />
                      {redshiftMppState === 'compute-scan' && (
                        <rect width="110" height="80" rx="6" fill="none" stroke="var(--da-svg-purple-border)" strokeWidth="2" className="pulse-border" />
                      )}
                      <rect x="4" y="4" width="102" height="13" rx="2" fill="var(--da-svg-purple-border)" />
                      <text x="55" y="13" fill="var(--da-svg-text-light)" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">👷 COMPUTE NODE #1</text>
                      
                      <text x="55" y="30" fill="var(--da-svg-purple-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Slice A: Columnar SSD</text>
                      
                      {/* Columnar Data Scanning blocks visual representation */}
                      <g transform="translate(8, 38)">
                        {/* Category column */}
                        <rect x="5" y="2" width="18" height="8" rx="1.5" fill={redshiftQuery !== 'user-join' && redshiftMppState === 'compute-scan' ? '#10b981' : 'var(--da-svg-node-border)'} />
                        <rect x="5" y="12" width="18" height="8" rx="1.5" fill={redshiftQuery !== 'user-join' && redshiftMppState === 'compute-scan' ? '#10b981' : 'var(--da-svg-node-border)'} />
                        <rect x="5" y="22" width="18" height="8" rx="1.5" fill={redshiftQuery !== 'user-join' && redshiftMppState === 'compute-scan' ? '#10b981' : 'var(--da-svg-node-border)'} />
                        <text x="14" y="32" fill="var(--da-svg-purple-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">Cat</text>

                        {/* Revenue column */}
                        <rect x="30" y="2" width="20" height="8" rx="1.5" fill={redshiftQuery === 'sales-sum' && redshiftMppState === 'compute-scan' ? '#3b82f6' : 'var(--da-svg-node-border)'} />
                        <rect x="30" y="12" width="20" height="8" rx="1.5" fill={redshiftQuery === 'sales-sum' && redshiftMppState === 'compute-scan' ? '#3b82f6' : 'var(--da-svg-node-border)'} />
                        <rect x="30" y="22" width="20" height="8" rx="1.5" fill={redshiftQuery === 'sales-sum' && redshiftMppState === 'compute-scan' ? '#3b82f6' : 'var(--da-svg-node-border)'} />
                        <text x="40" y="32" fill="var(--da-svg-purple-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">Rev</text>

                        {/* Unused column */}
                        <rect x="58" y="2" width="30" height="8" rx="1.5" fill={redshiftQuery === 'user-join' && redshiftMppState === 'compute-scan' ? '#3b82f6' : 'var(--da-svg-node-border)'} />
                        <rect x="58" y="12" width="30" height="8" rx="1.5" fill={redshiftQuery === 'user-join' && redshiftMppState === 'compute-scan' ? '#3b82f6' : 'var(--da-svg-node-border)'} />
                        <rect x="58" y="22" width="30" height="8" rx="1.5" fill={redshiftQuery === 'user-join' && redshiftMppState === 'compute-scan' ? '#3b82f6' : 'var(--da-svg-node-border)'} />
                        <text x="73" y="32" fill="var(--da-svg-purple-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">User/Reg</text>
                      </g>
                    </g>

                    {/* Compute Node #2 */}
                    <g transform="translate(225, 110)" className="da-node-btn">
                      <rect width="110" height="80" rx="6" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="2" />
                      {redshiftMppState === 'compute-scan' && (
                        <rect width="110" height="80" rx="6" fill="none" stroke="var(--da-svg-purple-border)" strokeWidth="2" className="pulse-border" />
                      )}
                      <rect x="4" y="4" width="102" height="13" rx="2" fill="var(--da-svg-purple-border)" />
                      <text x="55" y="13" fill="var(--da-svg-text-light)" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">👷 COMPUTE NODE #2</text>
                      
                      <text x="55" y="30" fill="var(--da-svg-purple-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Slice B: Columnar SSD</text>
                      
                      {/* Columnar Data Scanning blocks visual representation */}
                      <g transform="translate(8, 38)">
                        {/* Category column */}
                        <rect x="5" y="2" width="18" height="8" rx="1.5" fill={redshiftQuery !== 'user-join' && redshiftMppState === 'compute-scan' ? '#10b981' : 'var(--da-svg-node-border)'} />
                        <rect x="5" y="12" width="18" height="8" rx="1.5" fill={redshiftQuery !== 'user-join' && redshiftMppState === 'compute-scan' ? '#10b981' : 'var(--da-svg-node-border)'} />
                        <rect x="5" y="22" width="18" height="8" rx="1.5" fill={redshiftQuery !== 'user-join' && redshiftMppState === 'compute-scan' ? '#10b981' : 'var(--da-svg-node-border)'} />
                        <text x="14" y="32" fill="var(--da-svg-purple-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">Cat</text>

                        {/* Revenue column */}
                        <rect x="30" y="2" width="20" height="8" rx="1.5" fill={redshiftQuery === 'sales-sum' && redshiftMppState === 'compute-scan' ? '#3b82f6' : 'var(--da-svg-node-border)'} />
                        <rect x="30" y="12" width="20" height="8" rx="1.5" fill={redshiftQuery === 'sales-sum' && redshiftMppState === 'compute-scan' ? '#3b82f6' : 'var(--da-svg-node-border)'} />
                        <rect x="30" y="22" width="20" height="8" rx="1.5" fill={redshiftQuery === 'sales-sum' && redshiftMppState === 'compute-scan' ? '#3b82f6' : 'var(--da-svg-node-border)'} />
                        <text x="40" y="32" fill="var(--da-svg-purple-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">Rev</text>

                        {/* Unused column */}
                        <rect x="58" y="2" width="30" height="8" rx="1.5" fill={redshiftQuery === 'user-join' && redshiftMppState === 'compute-scan' ? '#3b82f6' : 'var(--da-svg-node-border)'} />
                        <rect x="58" y="12" width="30" height="8" rx="1.5" fill={redshiftQuery === 'user-join' && redshiftMppState === 'compute-scan' ? '#3b82f6' : 'var(--da-svg-node-border)'} />
                        <rect x="58" y="22" width="30" height="8" rx="1.5" fill={redshiftQuery === 'user-join' && redshiftMppState === 'compute-scan' ? '#3b82f6' : 'var(--da-svg-node-border)'} />
                        <text x="73" y="32" fill="var(--da-svg-purple-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">User/Reg</text>
                      </g>
                    </g>

                    {/* External S3 Data Lake (Redshift Spectrum) */}
                    <g transform="translate(385, 60)" className="da-node-btn">
                      <ellipse cx="30" cy="65" rx="25" ry="8" fill="var(--da-svg-green-bg)" />
                      <path d="M 5 20 V 65 A 25 8 0 0 0 55 65 V 20 Z" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" strokeWidth="2" />
                      <ellipse cx="30" cy="20" rx="25" ry="8" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="2" />
                      <path d="M 5 32 A 25 6 0 0 0 55 32" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                      <path d="M 5 45 A 25 6 0 0 0 55 45" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1.5" opacity="0.5" />
                      <text x="30" y="32" fill="var(--da-svg-green-text)" fontSize="9" fontWeight="bold" textAnchor="middle">🪣 S3</text>
                      <text x="30" y="55" fill="var(--da-svg-green-subtext)" fontSize="6.5" fontWeight="bold" textAnchor="middle">Spectrum Lake</text>
                    </g>
                  </svg>
                </div>
              </div>

              {/* Dynamic Console Output for MPP Query */}
              <div className="mt-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">📟 MPP Query Execution Log:</span>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 h-[110px] font-mono text-[9.5px] text-slate-200 overflow-y-auto space-y-1 shadow-inner">
                  {redshiftMppLogs.length === 0 ? (
                    <span className="text-slate-500 italic block text-center mt-7">Select an OLAP SQL query and click "Execute MPP Query" to trigger parallel scans.</span>
                  ) : (
                    redshiftMppLogs.map((log, idx) => {
                      let color = 'text-slate-350';
                      if (log.includes('✅') || log.includes('SUCCESS')) color = 'text-emerald-400 font-semibold bg-emerald-950/40 px-1 rounded';
                      if (log.includes('LEADER NODE:')) color = 'text-sky-300 font-semibold bg-sky-950/40 px-1 rounded';
                      if (log.includes('COMPUTE NODES:')) color = 'text-purple-300 font-semibold bg-purple-950/40 px-1 rounded';
                      if (log.includes('COLUMNAR STORAGE:')) color = 'text-amber-300 font-semibold bg-amber-950/40 px-1 rounded';
                      return <div key={idx} className={`${color} pb-0.5 border-b border-slate-800/60`}>{log}</div>;
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Incremental Snapshots & Disaster Recovery Coordinator */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-800 border-b border-slate-150 pb-2.5 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-sky-850">💾 Snapshot Registry &amp; Cross-Region DR</span>
                  <span className="badge bg-purple-50 text-purple-700 text-[10px] font-extrabold uppercase">Encrypted Backups</span>
                </h3>
                <p className="text-[11.5px] text-slate-650 mb-3 leading-relaxed">
                  Configure automated backup frequency, KMS encrypted Cross-Region copy, and retention. Take incremental manual snapshots or trigger instant recovery restoration into a brand new PostgreSQL cluster.
                </p>

                {/* Settings Panel */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-150 rounded-xl p-3 mb-3 text-xs">
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Backup Frequency:</label>
                    <select
                      value={rsSnapshotFreq}
                      onChange={(e) => setRsSnapshotFreq(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-1 outline-none font-bold text-slate-700"
                    >
                      <option value="5h">⏱️ Every 5 Hours</option>
                      <option value="8h">⏱️ Every 8 Hours</option>
                      <option value="scheduled">📅 Custom Cron Schedule</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Retention Policy:</label>
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="range"
                        min="1"
                        max="35"
                        value={rsRetention}
                        onChange={(e) => setRsRetention(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-655"
                      />
                      <span className="font-mono font-bold text-sky-800 text-[11px] shrink-0">{rsRetention}d</span>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-between bg-white border border-slate-200 p-2 rounded-lg mt-0.5">
                    <div>
                      <span className="font-bold text-slate-700 block text-[10.5px]">Cross-Region Snapshot Copy (DR):</span>
                      <span className="text-[9px] text-slate-500 leading-none">Auto copy newly taken snapshots to us-west-2</span>
                    </div>
                    <button
                      onClick={() => setRsCrossRegion(!rsCrossRegion)}
                      className={`px-3 py-1 rounded-lg font-bold text-[9.5px] border transition-all ${rsCrossRegion ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
                    >
                      {rsCrossRegion ? '🟢 Auto Copy On' : '❌ Copy Off'}
                    </button>
                  </div>
                </div>

                {/* Snapshot Action Buttons */}
                <div className="flex gap-2 mb-3">
                  <button
                    disabled={rsDRState !== 'idle'}
                    onClick={triggerRsManualSnapshot}
                    className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-550 text-white rounded-lg text-xs font-bold transition-all disabled:bg-slate-150 disabled:text-slate-400 flex items-center justify-center gap-1"
                  >
                    📸 Manual Snapshot
                  </button>
                  <button
                    disabled={rsDRState !== 'idle'}
                    onClick={triggerRsRestoreSnapshot}
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-555 text-white rounded-lg text-xs font-bold transition-all disabled:bg-slate-150 disabled:text-slate-400 flex items-center justify-center gap-1"
                  >
                    ⚙️ Restore Selected
                  </button>
                  <button
                    onClick={resetRsDR}
                    className="px-2.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex items-center justify-center"
                    title="Reset DR Log"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Snapshot List Table */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">📸 Available Cluster Snapshots (stored in S3):</span>
                  <div className="max-h-[110px] overflow-y-auto border border-slate-200 rounded-xl bg-slate-50">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-slate-150 border-b border-slate-200 text-slate-700 font-bold text-[8.5px] uppercase">
                          <th className="p-2 pl-3">Snapshot Identifier</th>
                          <th className="p-2">Type</th>
                          <th className="p-2">Timestamp</th>
                          <th className="p-2 pr-3 text-right">Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rsSnapshotsList.map((snap) => {
                          const isSelected = selectedSnapshot === snap.id;
                          return (
                            <tr
                              key={snap.id}
                              onClick={() => setSelectedSnapshot(snap.id)}
                              className={`cursor-pointer hover:bg-sky-50 border-b border-slate-100 transition-colors ${isSelected ? 'bg-sky-100/70 border-sky-300 font-semibold text-sky-950' : 'text-slate-650'}`}
                            >
                              <td className="p-2 pl-3 flex items-center gap-1.5">
                                <span className={isSelected ? 'text-sky-600' : 'text-slate-350'}>{isSelected ? '🔵' : '⚪'}</span>
                                {snap.id}
                              </td>
                              <td className="p-2">
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${snap.type === 'Manual' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-750'}`}>
                                  {snap.type}
                                </span>
                              </td>
                              <td className="p-2">{snap.time}</td>
                              <td className="p-2 pr-3 text-right font-mono font-bold">{snap.size}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* DR Trace Terminal */}
              <div className="mt-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">📡 DR Snapshot &amp; Replication Log:</span>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 h-[110px] font-mono text-[9.5px] text-slate-200 overflow-y-auto space-y-1 shadow-inner">
                  {rsDRLogs.length === 0 ? (
                    <span className="text-slate-500 italic block text-center mt-7">Click "Manual Snapshot" or "Restore Selected" to coordinate backups.</span>
                  ) : (
                    rsDRLogs.map((log, idx) => {
                      let color = 'text-slate-355';
                      if (log.includes('✅') || log.includes('SUCCESS')) color = 'text-emerald-400 font-semibold bg-emerald-950/40 px-1 rounded';
                      if (log.includes('📸 SNAPSHOT:')) color = 'text-purple-300 font-semibold bg-purple-950/40 px-1 rounded';
                      if (log.includes('📡 REPLICATION:')) color = 'text-fuchsia-300 font-semibold bg-fuchsia-950/40 px-1 rounded';
                      if (log.includes('⚙️ RESTORE:') || log.includes('S3 PULL:')) color = 'text-cyan-300 font-semibold bg-cyan-950/40 px-1 rounded';
                      return <div key={idx} className={`${color} pb-0.5 border-b border-slate-800/60`}>{log}</div>;
                    })
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Full Width Bottom Card: Reorganized Automated Multi-Region DR failover runbook */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-1">
              <div>
                <h3 className="font-bold text-sm text-slate-850 flex items-center gap-1.5">
                  <span>🌐 Automated Cross-Region Disaster Recovery (DR) Failover Plan</span>
                  <span className="badge bg-rose-50 text-rose-700 text-[10px] font-extrabold uppercase">Multi-Region Hot Standby</span>
                </h3>
                <p className="text-[11.5px] text-slate-500">Initiate automated replica failovers and watch active clusters switch dynamically from us-east-1 to us-west-2</p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={redshiftState !== 'idle'}
                  onClick={triggerRedshiftDR}
                  className="px-3.5 py-1.5 bg-rose-605 hover:bg-rose-550 text-white rounded-lg text-xs font-bold transition-all disabled:bg-slate-150 disabled:text-slate-400 flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" /> Trigger DR Failover Recovery
                </button>
                <button
                  onClick={resetRedshiftDR}
                  className="p-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Complex Redshift MPP DR Map SVG */}
              <div className="lg:col-span-8 bg-slate-50 border border-slate-200 rounded-xl p-2 h-[280px] flex items-center justify-center shadow-inner overflow-hidden relative">
                <svg className="w-full h-full max-w-[620px] da-svg-bg" viewBox="0 0 600 280">
                  {/* Client path */}
                  <path d="M 70 140 H 130" fill="none" stroke="#64748b" strokeWidth="2.5" markerEnd="url(#rs-arrow)" />
                  {/* Leader to Compute slice paths */}
                  <path d="M 215 140 L 280 62.5" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#rs-arrow)" />
                  <path d="M 215 140 L 280 197.5" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#rs-arrow)" />
                  
                  {/* Redshift Spectrum path to S3 */}
                  <path d="M 400 62.5 H 455" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#rs-arrow)" />
                  <path d="M 400 197.5 H 455" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#rs-arrow)" />

                  {/* Active flow animations during DR */}
                  {redshiftState === 'snapshotting' && (
                    <path d="M 215 140 L 280 62.5" fill="none" stroke="#f97316" strokeWidth="3.5" className="da-flow-orange" />
                  )}

                  {redshiftState === 'replicating' && (
                    <>
                      <path d="M 400 62.5 H 455" fill="none" stroke="#a855f7" strokeWidth="3.5" className="da-flow-purple" />
                      <path d="M 400 197.5 H 455" fill="none" stroke="#a855f7" strokeWidth="3.5" className="da-flow-purple" />
                    </>
                  )}

                  {redshiftState === 'recovering' && (
                    <path d="M 215 140 L 280 197.5" fill="none" stroke="#10b981" strokeWidth="3.5" className="da-flow-green" />
                  )}

                  {redshiftState === 'completed' && (
                    <>
                      <path d="M 70 140 H 130" fill="none" stroke="#10b981" strokeWidth="3.5" className="da-flow-green" />
                      <path d="M 215 140 L 280 197.5" fill="none" stroke="#10b981" strokeWidth="3.5" className="da-flow-green" />
                    </>
                  )}

                  {/* Nodes */}
                  <g transform="translate(10, 105)" className="da-node-btn">
                    <rect width="60" height="70" rx="10" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="2" />
                    <rect x="5" y="5" width="50" height="30" rx="6" fill="var(--da-svg-bg)" />
                    <text x="30" y="24" fill="var(--da-svg-text-dark)" fontSize="10.5" fontWeight="bold" textAnchor="middle">📱 CLIENT</text>
                    <text x="30" y="50" fill="var(--da-text-muted)" fontSize="8" fontWeight="bold" textAnchor="middle">BI Dashboard</text>
                    <text x="30" y="60" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">Analytics SQL</text>
                  </g>

                  {/* Redshift Leader Node */}
                  <g transform="translate(130, 95)" className="da-node-btn">
                    <rect width="85" height="90" rx="10" fill="var(--da-svg-blue-bg)" stroke="var(--da-svg-blue-border)" strokeWidth="2.5" />
                    <rect x="8" y="8" width="69" height="20" rx="4" fill="var(--da-svg-blue-bg)" stroke="var(--da-svg-blue-border)" strokeWidth="1" />
                    <text x="42.5" y="21" fill="var(--da-svg-blue-text)" fontSize="9" fontWeight="bold" textAnchor="middle">👑 LEADER NODE</text>
                    <text x="42.5" y="44" fill="var(--da-svg-blue-subtext)" fontSize="8" fontWeight="bold" textAnchor="middle">Client endpoint</text>
                    <text x="42.5" y="58" fill="var(--da-svg-blue-text)" fontSize="7.5" textAnchor="middle" fontWeight="semibold">Query planner</text>
                    <rect x="12" y="68" width="61" height="14" rx="3" fill="var(--da-svg-green-bg)" />
                    <text x="42.5" y="77" fill="var(--da-svg-green-text)" fontSize="7" textAnchor="middle" fontWeight="bold">SQL Gateway</text>
                  </g>

                  {/* Redshift Compute Nodes */}
                  <g transform="translate(280, 25)" className="da-node-btn">
                    <rect width="120" height="75" rx="8" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="2.5" />
                    <rect x="8" y="8" width="104" height="15" rx="3" fill="var(--da-svg-purple-border)" />
                    <text x="60" y="19" fill="var(--da-svg-text-light)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">👷 COMPUTE NODE #1</text>
                    
                    <text x="60" y="42" fill="var(--da-svg-purple-text)" fontSize="8.5" fontWeight="bold" textAnchor="middle">Slice A: Columnar SSD</text>
                    <rect x="15" y="52" width="90" height="14" rx="3" fill="var(--da-svg-node-fill)" />
                    <text x="60" y="62" fill="var(--da-svg-purple-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Active execution</text>
                  </g>

                  <g transform="translate(280, 160)" className="da-node-btn">
                    <rect width="120" height="75" rx="8" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="2.5" />
                    <rect x="8" y="8" width="104" height="15" rx="3" fill="var(--da-svg-purple-border)" />
                    <text x="60" y="19" fill="var(--da-svg-text-light)" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">👷 COMPUTE NODE #2</text>
                    
                    <text x="60" y="42" fill="var(--da-svg-purple-text)" fontSize="8.5" fontWeight="bold" textAnchor="middle">Slice B: Columnar SSD</text>
                    <rect x="15" y="52" width="90" height="14" rx="3" fill={redshiftState === 'recovering' ? 'var(--da-svg-amber-bg)' : 'var(--da-svg-node-fill)'} />
                    <text x="60" y="62" fill={redshiftState === 'recovering' ? 'var(--da-svg-amber-text)' : 'var(--da-svg-purple-text)'} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                      {redshiftState === 'recovering' ? 'Re-assembling slice' : 'Active execution'}
                    </text>
                  </g>

                  {/* S3 querying via Redshift Spectrum */}
                  <g transform="translate(455, 25)" className="da-node-btn">
                    <rect width="135" height="75" rx="8" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="2" />
                    <rect x="8" y="8" width="119" height="18" rx="4" fill="var(--da-svg-amber-bg)" />
                    <text x="67.5" y="21" fill="var(--da-svg-amber-text)" fontSize="8.5" fontWeight="bold" textAnchor="middle">🔍 REDSHIFT SPECTRUM</text>
                    <text x="67.5" y="44" fill="var(--da-svg-amber-text)" fontSize="8" fontWeight="bold" textAnchor="middle">Query external tables</text>
                    <text x="67.5" y="58" fill="var(--da-svg-amber-subtext)" fontSize="8" textAnchor="middle" fontWeight="semibold">Scan S3 Parquet directly</text>
                  </g>

                  <g transform="translate(455, 160)" className="da-node-btn">
                    <ellipse cx="67.5" cy="55" rx="55" ry="12" fill="var(--da-svg-green-bg)" />
                    <path d="M 12.5 15 V 55 A 55 12 0 0 0 122.5 55 V 15 Z" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" strokeWidth="2.5" />
                    <ellipse cx="67.5" cy="15" rx="55" ry="12" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="2.5" />
                    <path d="M 12.5 28 A 55 10 0 0 0 122.5 28" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                    <path d="M 12.5 40 A 55 10 0 0 0 122.5 40" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1.5" opacity="0.5" />
                    
                    <text x="67.5" y="24" fill="var(--da-svg-green-text)" fontSize="10" fontWeight="bold" textAnchor="middle">🪣 REFINED S3 LAKE</text>
                    <text x="67.5" y="44" fill="var(--da-svg-green-subtext)" fontSize="8" textAnchor="middle" fontWeight="semibold">dw-backups-bucket</text>
                    <text x="67.5" y="56" fill="var(--da-svg-green-text)" fontSize="8" fontWeight="bold" textAnchor="middle">Incremental snapshots</text>
                  </g>
                </svg>
              </div>

              {/* Redshift DR logs trace console */}
              <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col h-[280px] shadow-inner">
                <div className="flex items-center gap-2 text-slate-700 font-mono text-xs border-b border-slate-200 pb-2 mb-3">
                  <Terminal className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span className="font-bold text-slate-800">DR Automated Failover Console</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] leading-relaxed text-slate-700 pr-1">
                  {redshiftLogs.length === 0 ? (
                    <span className="text-slate-400 block text-center mt-20 italic">Click "Trigger DR Failover Recovery" to initiate the automated regional hot-standby switchover plan.</span>
                  ) : (
                    redshiftLogs.map((log, idx) => {
                      let color = 'text-slate-650';
                      if (log.includes('🚀') || log.includes('🚨')) color = 'text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded';
                      if (log.includes('💾') || log.includes('⚙️')) color = 'text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded';
                      if (log.includes('📡')) color = 'text-purple-700 font-semibold bg-purple-50 px-1.5 py-0.5 rounded';
                      if (log.includes('✅') || log.includes('🌐')) color = 'text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded';
                      return (
                        <div key={idx} className={`${color} border-b border-slate-100 pb-1.5`}>
                          {log}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================================= */}
      {/* TAB 6: STREAMING ANALYTICS (KAFKA MSK & FLINK)                            */}
      {/* ========================================================================= */}
      {activeTab === 'streaming' && (
        <div className="space-y-6">
          <div className="da-card">
            <h2 className="da-card-title text-sky-700">
              <Activity className="w-5 h-5" /> Stateful Streaming: Amazon MSK (Apache Kafka) &amp; Amazon Managed Service for Apache Flink
            </h2>
            <p className="da-card-desc font-medium text-slate-700">
              **Amazon MSK** manages Apache Kafka broker nodes across private subnets for high-throughput stream ingestion. **Apache Flink** consumes Kafka topics, executing stateful rolling aggregations on streams using sliding event windows.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Real-time Flink streaming event visualizer grid */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 min-h-[460px] flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-full flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Apache Flink 10-Second Event Sliding Window</h3>
                    <p className="text-[11px] text-slate-500">Aggregates mock credit-card streams. Flags values exceeding $4000 as FRAUD_SUSPECT.</p>
                  </div>
                  
                  <button
                    onClick={toggleFlinkStreaming}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                      flinkStreaming ? 'bg-rose-600 text-white hover:bg-rose-500' : 'bg-sky-600 text-white hover:bg-sky-500'
                    }`}
                  >
                    <Play className="w-3.5 h-3.5" />
                    {flinkStreaming ? 'Pause Stream Ingestion' : 'Start Streaming Ingestion'}
                  </button>
                </div>

                {/* Event Window Counters Display */}
                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Window Events Count</span>
                    <span className="text-xl font-bold font-mono text-sky-700">{flinkWindowCount}</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Sliding window sales</span>
                    <span className="text-xl font-bold font-mono text-emerald-700">${flinkWindowSum.toLocaleString()}</span>
                  </div>
                  <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Anomalous triggers</span>
                    <span className="text-xl font-bold font-mono text-rose-700">{flinkFraudCount}</span>
                  </div>
                </div>

                {/* Brand New Stateful MSK & Flink SVG Diagram */}
                <div className="w-full h-[150px] rounded-xl border border-slate-200 p-1 mb-4 relative overflow-hidden flex items-center justify-center shadow-inner bg-slate-50">
                  <svg className="w-full h-full da-svg-bg" viewBox="0 0 540 150">
                    <defs>
                      <marker id="stream-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                      </marker>
                    </defs>

                    {/* Pathways */}
                    <path d="M 60 75 H 155" fill="none" stroke="var(--da-svg-purple-border)" strokeWidth="2.5" markerEnd="url(#stream-arrow)" />
                    <path d="M 235 75 H 335" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="2.5" markerEnd="url(#stream-arrow)" />

                    {/* Streaming flow animations */}
                    {flinkStreaming && (
                      <>
                        <path d="M 60 75 H 155" fill="none" stroke="var(--da-svg-purple-border)" strokeWidth="3" className="da-flow-purple" />
                        <path d="M 235 75 H 335" fill="none" stroke="var(--da-svg-blue-border)" strokeWidth="3" className="da-flow-blue" />
                      </>
                    )}

                    {/* 1. Ingestion Source (Client Station) */}
                    <g transform="translate(10, 40)" className="da-node-btn">
                      <rect width="50" height="70" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                      <circle cx="25" cy="20" r="10" fill="var(--da-svg-bg)" />
                      <text x="25" y="24" fill="var(--da-svg-text-dark)" fontSize="12" textAnchor="middle">💳</text>
                      <text x="25" y="46" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="bold" textAnchor="middle">TX SOURCES</text>
                      <text x="25" y="56" fill={flinkStreaming ? 'var(--da-svg-green-border)' : 'var(--da-text-muted)'} fontSize="6.5" fontWeight="bold" textAnchor="middle">
                        {flinkStreaming ? 'STREAMING' : 'PAUSED'}
                      </text>
                    </g>

                    {/* 2. Amazon MSK (Kafka) Brokers */}
                    <g transform="translate(155, 25)" className="da-node-btn">
                      <rect width="80" height="100" rx="8" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="2" />
                      
                      {/* Topic Partition shelves */}
                      <rect x="6" y="6" width="68" height="18" rx="3" fill="var(--da-svg-purple-border)" />
                      <text x="40" y="17.5" fill="var(--da-svg-text-light)" fontSize="8" fontWeight="bold" textAnchor="middle">📦 KAFKA MSK</text>
                      
                      <rect x="8" y="32" width="64" height="15" rx="3" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-purple-border)" strokeWidth="1" />
                      <text x="40" y="42" fill="var(--da-svg-purple-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Partition #0</text>
                      <circle cx="16" cy="39.5" r="2.5" fill={flinkStreaming ? 'var(--da-svg-purple-border)' : 'var(--da-svg-node-border)'} className={flinkStreaming ? 'pulse-circle' : ''} />

                      <rect x="8" y="53" width="64" height="15" rx="3" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-purple-border)" strokeWidth="1" />
                      <text x="40" y="63" fill="var(--da-svg-purple-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Partition #1</text>

                      <rect x="8" y="74" width="64" height="15" rx="3" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-purple-border)" strokeWidth="1" />
                      <text x="40" y="84" fill="var(--da-svg-purple-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Partition #2</text>
                    </g>

                    {/* 3. Stateful Apache Flink Engine */}
                    <g transform="translate(335, 20)" className="da-node-btn">
                      <rect width="185" height="110" rx="10" fill="var(--da-svg-node-fill)" stroke={flinkWindowSum > 4000 ? 'var(--da-svg-red-border)' : 'var(--da-svg-green-border)'} strokeWidth="2.5" />
                      
                      {/* Flink header */}
                      <rect x="8" y="8" width="169" height="18" rx="4" fill={flinkWindowSum > 4000 ? 'var(--da-svg-red-border)' : 'var(--da-svg-green-border)'} />
                      <text x="92.5" y="20.5" fill="var(--da-svg-text-light)" fontSize="9" fontWeight="bold" textAnchor="middle">🐿️ APACHE FLINK ENGINE</text>

                      {/* State status details */}
                      <text x="14" y="42" fill="var(--da-text-muted)" fontSize="8" fontWeight="bold">Window Sum:</text>
                      <text x="95" y="42.5" fill={flinkWindowSum > 4000 ? 'var(--da-svg-red-text)' : 'var(--da-svg-green-text)'} fontSize="11" fontWeight="bold" fontFamily="monospace">${flinkWindowSum.toLocaleString()}</text>

                      {/* Events Count */}
                      <text x="14" y="58" fill="var(--da-text-muted)" fontSize="8" fontWeight="bold">Events Count:</text>
                      <text x="95" y="58.5" fill="var(--da-svg-text-dark)" fontSize="10" fontWeight="bold" fontFamily="monospace">{flinkWindowCount}</text>

                      {/* Stateful window graphic */}
                      <rect x="8" y="70" width="169" height="32" rx="4" fill="var(--da-svg-bg)" stroke="var(--da-card-border)" strokeWidth="1.5" />
                      
                      {flinkWindowSum > 4000 ? (
                        <>
                          <rect x="12" y="74" width="161" height="24" rx="3" fill="var(--da-svg-red-bg)" stroke="var(--da-svg-red-border)" strokeWidth="1" />
                          <circle cx="24" cy="86" r="5" fill="var(--da-svg-red-border)" className="pulse-circle" />
                          <circle cx="24" cy="86" r="4" fill="var(--da-svg-red-border)" />
                          <text x="40" y="89" fill="var(--da-svg-red-text)" fontSize="8" fontWeight="bold">🚨 FRAUD_SUSPECT LIMIT EXCEEDED</text>
                        </>
                      ) : (
                        <>
                          <rect x="12" y="74" width="161" height="24" rx="3" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1" />
                          <circle cx="24" cy="86" r="4" fill="var(--da-svg-green-border)" />
                          <text x="36" y="89" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="bold">🟢 STREAM HEALTHY - STABLE TRANSACTIONS</text>
                        </>
                      )}
                    </g>
                  </svg>
                </div>

                {/* Incoming streams logs grid */}
                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
                        <th className="p-2">TXN ID</th>
                        <th className="p-2">Timestamp</th>
                        <th className="p-2">Amount</th>
                        <th className="p-2">Source Location</th>
                        <th className="p-2">Window Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {flinkEvents.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400 italic bg-slate-50">Ingestion dormant. Click "Start Streaming Ingestion" above.</td>
                        </tr>
                      ) : (
                        flinkEvents.map((evt, idx) => (
                          <tr key={idx} className="border-b border-slate-150 hover:bg-slate-50 text-[11px] text-slate-600 animate-fadeIn">
                            <td className="p-2 font-mono font-bold">{evt.id}</td>
                            <td className="p-2 text-slate-500">{evt.timestamp}</td>
                            <td className="p-2 font-bold font-mono text-slate-800">${evt.amount.toLocaleString()}</td>
                            <td className="p-2">{evt.location}</td>
                            <td className="p-2 font-bold">
                              <span className={`badge ${evt.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                {evt.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Apache Flink internal state logs console */}
            <div className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col h-[460px] shadow-inner">
              <div className="flex items-center gap-2 text-slate-700 font-mono text-xs border-b border-slate-200 pb-2 mb-3">
                <Terminal className="w-4 h-4 text-sky-600" />
                <span>Apache Flink Stateful Sliding aggregations</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[9.5px] leading-relaxed text-slate-750 pr-1">
                {flinkLogs.length === 0 ? (
                  <span className="text-slate-500 block text-center mt-32 italic">Dormant. Aggregator sliding logs will output here in real-time.</span>
                ) : (
                  flinkLogs.map((log, idx) => {
                    let color = 'text-slate-650';
                    if (log.includes('ALERT') || log.includes('🚨')) color = 'text-rose-700 font-semibold bg-rose-50 p-1.5 rounded border border-rose-100';
                    if (log.includes('Flink streaming')) color = 'text-sky-700 font-bold bg-sky-50 px-1 rounded';
                    return <div key={idx} className={`${color} pb-1 border-b border-slate-100`}>{log}</div>;
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: BIG DATA INGESTION PIPELINES SANDBOX & OPENSEARCH                  */}
      {/* ========================================================================= */}
      {activeTab === 'ingestion' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Main Title Card */}
          <div className="da-card bg-white/80 border border-slate-200/80 rounded-2xl p-6 shadow-sm">
            <h2 className="da-card-title text-sky-700 font-extrabold flex items-center gap-2 text-lg">
              <LayoutDashboard className="w-5 h-5 text-sky-600" /> Advanced Big Data Pipelines &amp; Search Analytics Workbench
            </h2>
            <p className="da-card-desc text-slate-650 text-xs leading-relaxed max-w-4xl">
              This interactive workbench visualizes large-scale serverless batch pipelines, real-time message streaming, and distributed full-text search indexing. Configure multi-node **Amazon EMR (Hadoop/Spark)** clusters, implement **Amazon OpenSearch Service** complementary key-lookup search patterns, and compare the performance speedup of **QuickSight SPICE** caching engines.
            </p>
          </div>

          {/* ========================================================================= */}
          {/* SANDBOX SECTION 1: BIG DATA PIPELINE SIMULATOR                            */}
          {/* ========================================================================= */}
          <div className="da-card bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="w-full flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-4 mb-4 gap-4">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-sky-500 animate-pulse" /> Sandbox 1: Production Ingestion Pipeline Simulator
                </h3>
                <p className="text-[11px] text-slate-500">Simulate streaming ingestion through MSK/Flink vs. batch ETL pipelines to refined S3 pools</p>
              </div>
              
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={ingestionType}
                  onChange={(e) => setIngestionType(e.target.value as 'streaming' | 'batch')}
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none font-bold text-slate-700"
                >
                  <option value="streaming">Track: Real-Time Stream (MSK ➔ Flink)</option>
                  <option value="batch">Track: Batch Data Lakehouse (S3 ➔ Glue ETL)</option>
                </select>
                <button
                  disabled={sandboxState !== 'idle'}
                  onClick={triggerIngestionSandbox}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Play className="w-3.5 h-3.5" /> Run Ingestion Sandbox
                </button>
                <button
                  onClick={resetSandbox}
                  className="p-2 bg-slate-100 text-slate-650 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                  title="Reset Simulator"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sandbox SVG viewport */}
              <div className="lg:col-span-8 bg-slate-50 rounded-xl border border-slate-200 p-3 relative overflow-hidden flex items-center justify-center min-h-[350px] shadow-inner">
                <svg className="w-full h-full max-w-[660px] da-svg-bg rounded-lg" viewBox="0 0 650 320">
                  <defs>
                    <marker id="ingest-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {/* Dynamic path lines */}
                  {/* Top Track: Streaming */}
                  <path d="M 95 87.5 H 145" fill="none" stroke="#cbd5e1" strokeWidth="2.5" markerEnd="url(#ingest-arrow)" />
                  <path d="M 240 87.5 H 290" fill="none" stroke="#cbd5e1" strokeWidth="2.5" markerEnd="url(#ingest-arrow)" />
                  <path d="M 385 87.5 H 450" fill="none" stroke="#cbd5e1" strokeWidth="2.5" markerEnd="url(#ingest-arrow)" />

                  {/* Bottom Track: Batch */}
                  <path d="M 95 240 H 145" fill="none" stroke="#cbd5e1" strokeWidth="2.5" markerEnd="url(#ingest-arrow)" />
                  <path d="M 240 237.5 H 290" fill="none" stroke="#cbd5e1" strokeWidth="2.5" markerEnd="url(#ingest-arrow)" />
                  <path d="M 385 237.5 H 450" fill="none" stroke="#cbd5e1" strokeWidth="2.5" markerEnd="url(#ingest-arrow)" />

                  {/* Output Consumer dotted links */}
                  <path d="M 570 87.5 V 163 H 440" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#ingest-arrow)" />
                  <path d="M 575 240 V 163 H 440" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" markerEnd="url(#ingest-arrow)" />

                  {/* Active telemetry lasers */}
                  {sandboxState === 'ingesting' && (
                    <>
                      {ingestionType === 'streaming' && <path d="M 95 87.5 H 145" fill="none" stroke="#a855f7" strokeWidth="3" className="da-flow-purple" />}
                      {ingestionType === 'batch' && <path d="M 95 240 H 145" fill="none" stroke="#ea580c" strokeWidth="3" className="da-flow-orange" />}
                    </>
                  )}

                  {sandboxState === 'aggregating' && (
                    <>
                      {ingestionType === 'streaming' && <path d="M 240 87.5 H 290" fill="none" stroke="#a855f7" strokeWidth="3" className="da-flow-purple" />}
                      {ingestionType === 'batch' && <path d="M 240 237.5 H 290" fill="none" stroke="#ea580c" strokeWidth="3" className="da-flow-orange" />}
                    </>
                  )}

                  {sandboxState === 'storing' && (
                    <>
                      {ingestionType === 'streaming' && <path d="M 385 87.5 H 450" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />}
                      {ingestionType === 'batch' && <path d="M 385 237.5 H 450" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />}
                    </>
                  )}

                  {sandboxState === 'indexing' && (
                    <>
                      {ingestionType === 'streaming' && <path d="M 570 87.5 V 163 H 440" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-blue" />}
                      {ingestionType === 'batch' && <path d="M 385 237.5 H 450" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />}
                    </>
                  )}

                  {sandboxState === 'visualizing' && (
                    <>
                      {ingestionType === 'streaming' && <path d="M 570 87.5 V 163 H 440" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-blue" />}
                      {ingestionType === 'batch' && <path d="M 575 240 V 163 H 440" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-blue" />}
                    </>
                  )}

                  {sandboxState === 'completed' && (
                    <>
                      <path d="M 570 87.5 V 163 H 440" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                      <path d="M 575 240 V 163 H 440" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                    </>
                  )}

                  {/* Input Nodes */}
                  <g transform="translate(15, 52)">
                    <rect width="80" height="70" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                    <rect x="4" y="4" width="72" height="18" rx="3.5" fill="var(--da-svg-bg)" />
                    <text x="40" y="16.5" fill="var(--da-svg-text-dark)" fontSize="8" fontWeight="extrabold" textAnchor="middle">📱 IoT SENSORS</text>
                    <text x="40" y="38" fill="var(--da-svg-purple-text)" fontSize="8.5" fontWeight="bold" textAnchor="middle">Real-Time</text>
                    <text x="40" y="52" fill="var(--da-text-muted)" fontSize="7.5" textAnchor="middle">Sensor Metrics</text>
                  </g>

                  <g transform="translate(15, 205)">
                    <rect width="80" height="70" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                    <rect x="4" y="4" width="72" height="18" rx="3.5" fill="var(--da-svg-bg)" />
                    <text x="40" y="16.5" fill="var(--da-svg-text-dark)" fontSize="8" fontWeight="extrabold" textAnchor="middle">🛢️ APP LOGS</text>
                    <text x="40" y="38" fill="var(--da-svg-amber-text)" fontSize="8.5" fontWeight="bold" textAnchor="middle">Batch OLTP</text>
                    <text x="40" y="52" fill="var(--da-text-muted)" fontSize="7.5" textAnchor="middle">Raw Logs Pool</text>
                  </g>

                  {/* Top track nodes (Streaming) */}
                  <g transform="translate(145, 50)">
                    <rect x="2" y="2" width="95" height="75" rx="8" fill="var(--da-svg-purple-bg)" />
                    <rect width="95" height="75" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-purple-border)" strokeWidth="2" />
                    <rect x="5" y="5" width="85" height="18" rx="3" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1" />
                    <text x="47.5" y="17.5" fill="var(--da-svg-purple-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">⚡ KAFKA MSK</text>
                    <text x="47.5" y="41" fill="var(--da-svg-purple-text)" fontSize="8.5" textAnchor="middle" fontWeight="bold">Brokers Cluster</text>
                    <rect x="10" y="52" width="75" height="13" rx="2" fill="var(--da-svg-purple-bg)" />
                    <text x="47.5" y="61" fill="var(--da-svg-purple-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Serverless Shards</text>
                  </g>

                  <g transform="translate(290, 50)">
                    <rect x="2" y="2" width="95" height="75" rx="8" fill="var(--da-svg-purple-bg)" />
                    <rect width="95" height="75" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-purple-border)" strokeWidth="2" />
                    <rect x="5" y="5" width="85" height="18" rx="3" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1" />
                    <text x="47.5" y="17.5" fill="var(--da-svg-purple-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">⚙️ FLINK</text>
                    <text x="47.5" y="41" fill="var(--da-svg-purple-text)" fontSize="8.5" textAnchor="middle" fontWeight="bold">Stream Aggs</text>
                    <rect x="10" y="52" width="75" height="13" rx="2" fill="var(--da-svg-purple-bg)" />
                    <text x="47.5" y="61.5" fill="var(--da-svg-purple-text)" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">Sliding Window</text>
                  </g>

                  {/* Bottom track nodes (Batch) */}
                  <g transform="translate(145, 200)">
                    <rect x="2" y="2" width="95" height="75" rx="8" fill="var(--da-svg-amber-bg)" />
                    <rect width="95" height="75" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-amber-border)" strokeWidth="2" />
                    <rect x="5" y="5" width="85" height="18" rx="3" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1" />
                    <text x="47.5" y="17.5" fill="var(--da-svg-amber-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">🪣 RAW S3</text>
                    <text x="47.5" y="41" fill="var(--da-svg-amber-text)" fontSize="8.5" textAnchor="middle" fontWeight="bold">Ingest Buffer</text>
                    <rect x="10" y="52" width="75" height="13" rx="2" fill="var(--da-svg-amber-bg)" />
                    <text x="47.5" y="61" fill="var(--da-svg-amber-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Unstructured DB</text>
                  </g>

                  <g transform="translate(290, 200)">
                    <rect x="2" y="2" width="95" height="75" rx="8" fill="var(--da-svg-amber-bg)" />
                    <rect width="95" height="75" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-amber-border)" strokeWidth="2" />
                    <rect x="5" y="5" width="85" height="18" rx="3" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1" />
                    <text x="47.5" y="17.5" fill="var(--da-svg-amber-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">⚙️ GLUE SPARK</text>
                    <text x="47.5" y="41" fill="var(--da-svg-amber-text)" fontSize="8.5" textAnchor="middle" fontWeight="bold">Batch Spark ETL</text>
                    <rect x="10" y="52" width="75" height="13" rx="2" fill="var(--da-svg-amber-bg)" />
                    <text x="47.5" y="61.5" fill="var(--da-svg-amber-text)" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">Parquet Convert</text>
                  </g>

                  {/* Destination Nodes */}
                  <g transform="translate(440, 40)">
                    <ellipse cx="70" cy="75" rx="60" ry="12" fill="var(--da-svg-green-bg)" />
                    <path d="M 10 20 V 75 A 60 12 0 0 0 130 75 V 20 Z" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" strokeWidth="2.5" />
                    <ellipse cx="70" cy="20" rx="60" ry="12" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="2.5" />
                    <path d="M 10 32 A 60 10 0 0 0 130 32" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="70" y="30.5" fill="var(--da-svg-green-text)" fontSize="10" fontWeight="extrabold" textAnchor="middle">🪣 DATA LAKE S3</text>
                    <text x="70" y="51" fill="var(--da-svg-green-text)" fontSize="8.5" textAnchor="middle" fontWeight="bold">Refined Parquet</text>
                    <text x="70" y="64" fill="var(--da-svg-green-text)" fontSize="8" fontWeight="bold" textAnchor="middle">dw-backups-bucket</text>
                  </g>

                  <g transform="translate(440, 200)">
                    <rect x="2" y="2" width="135" height="80" rx="8" fill="var(--da-svg-green-bg)" />
                    <rect width="135" height="80" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" strokeWidth="2.5" />
                    <rect x="6" y="6" width="123" height="18" rx="3.5" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1" />
                    <text x="67.5" y="18.5" fill="var(--da-svg-green-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">📖 GLUE CATALOG</text>
                    <text x="67.5" y="44" fill="var(--da-svg-green-text)" fontSize="8.5" textAnchor="middle" fontWeight="bold">Central Metadata Store</text>
                    <text x="67.5" y="59" fill="var(--da-svg-green-text)" fontSize="8" textAnchor="middle">Lake Formation Governance</text>
                  </g>

                  {/* Output Consumer Nodes */}
                  <g transform="translate(290, 133)">
                    <rect x="2" y="2" width="150" height="60" rx="6" fill="var(--da-svg-blue-bg)" />
                    <rect width="150" height="60" rx="6" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-blue-border)" strokeWidth="2" />
                    <text x="75" y="20.5" fill="var(--da-svg-blue-text)" fontSize="9" fontWeight="extrabold" textAnchor="middle">📊 QUICKSIGHT (BI)</text>
                    <text x="75" y="36.5" fill="var(--da-svg-blue-text)" fontSize="8.5" textAnchor="middle" fontWeight="bold">SPICE Caching Engine</text>
                    <text x="75" y="49" fill="var(--da-svg-green-text)" fontSize="8" fontWeight="extrabold" textAnchor="middle">Sub-second Latency</text>
                  </g>

                  <g transform="translate(115, 133)">
                    <rect x="2" y="2" width="160" height="60" rx="6" fill="var(--da-svg-blue-bg)" />
                    <rect width="160" height="60" rx="6" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-blue-border)" strokeWidth="2" />
                    <text x="80" y="20.5" fill="var(--da-svg-blue-text)" fontSize="9" fontWeight="extrabold" textAnchor="middle">🔎 OPENSEARCH CLUSTER</text>
                    <text x="80" y="36.5" fill="var(--da-svg-blue-text)" fontSize="8.5" textAnchor="middle" fontWeight="bold">Primary &amp; Replica Shards</text>
                    <text x="80" y="49" fill="var(--da-text-muted)" fontSize="8" textAnchor="middle">Indexing log telemetry</text>
                  </g>
                </svg>
              </div>

              {/* Sandbox logger trace console */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 shadow-sm flex flex-col justify-between h-[350px]">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 mb-2">
                      <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                        <Terminal className="w-4 h-4 text-sky-500" /> Pipeline Console Trace
                      </span>
                      <span className="badge bg-sky-50 text-sky-700 text-[10px] font-bold">Trace Active</span>
                    </div>

                    <div className="h-[180px] w-full mt-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={telemetryData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(51, 65, 85, 0.5)" : "#e2e8f0"} />
                          <XAxis dataKey="timestamp" stroke={isDark ? "#94a3b8" : "#475569"} fontSize={8} />
                          <YAxis stroke={isDark ? "#94a3b8" : "#475569"} fontSize={8} />
                          <Tooltip contentStyle={{ fontSize: '9px', borderRadius: '8px', background: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#cbd5e1' : '#1e293b', borderColor: isDark ? '#334155' : '#cbd5e1' }} />
                          <Bar dataKey="recordsIngested" fill="#0ea5e9" radius={[3, 3, 0, 0]} name="Vol Ingested" />
                          <Bar dataKey="queryLatencyMs" fill="#a855f7" radius={[3, 3, 0, 0]} name="Speed (ms)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-950 rounded-xl p-3 h-[100px] font-mono text-[9px] text-slate-300 overflow-y-auto space-y-1.5 shadow-inner">
                    {sandboxLogs.length === 0 ? (
                      <span className="text-slate-500 italic block text-center mt-7">Select track and click run pipeline button to trace.</span>
                    ) : (
                      sandboxLogs.map((log, idx) => {
                        let color = 'text-slate-350';
                        if (log.includes('TRIGGERED:')) color = 'text-sky-400 font-bold bg-sky-950/40 px-1 rounded';
                        if (log.includes('STREAM') || log.includes('GLUE')) color = 'text-purple-400 font-bold';
                        if (log.includes('SUCCESS') || log.includes('✅')) color = 'text-emerald-400 font-bold bg-emerald-950/40 px-1 rounded';
                        return <div key={idx} className={`${color} pb-0.5 border-b border-slate-800/50`}>{log}</div>;
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SANDBOX SECTION 2: AMAZON EMR CLUSTER & AUTO-SCALING                      */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* EMR Control Deck */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Sliders className="w-4 h-4 text-emerald-500" /> Sandbox 2: Amazon EMR Cluster Controller
                </h3>
                
                {/* Cluster Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Cluster Model Mode:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setEmrClusterType('long-running')}
                      className={`py-1.5 rounded-lg text-[10.5px] font-bold border transition-all ${
                        emrClusterType === 'long-running'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                      }`}
                    >
                      Long-Running (HA)
                    </button>
                    <button
                      onClick={() => setEmrClusterType('transient')}
                      className={`py-1.5 rounded-lg text-[10.5px] font-bold border transition-all ${
                        emrClusterType === 'transient'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                      }`}
                    >
                      Transient (Temporary)
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    {emrClusterType === 'long-running' 
                      ? '✓ Ideal for continuous multi-tenant workloads. Storage persistent on HDFS blocks.'
                      : '✓ Powers down core nodes instantly on job completion to minimize runtime cost.'
                    }
                  </p>
                </div>

                {/* Core Nodes Count */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">Bootstrap Core Nodes (HDFS):</label>
                    <span className="font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{emrCoreCount} Nodes</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="6"
                    value={emrCoreCount}
                    disabled={emrMasterState === 'provisioning'}
                    onChange={(e) => setEmrCoreCount(Number(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <span className="text-[9.5px] text-slate-500 block">Core instances manage the HDFS filesystem directory.</span>
                </div>

                {/* Task Nodes Count */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-bold text-slate-700">Scaling Task Nodes:</label>
                    <span className="font-bold font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{emrTaskCount} Nodes</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="6"
                    value={emrTaskCount}
                    disabled={emrMasterState === 'provisioning'}
                    onChange={(e) => setEmrTaskCount(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <span className="text-[9.5px] text-slate-500 block">Task nodes execute jobs without local HDFS storage overhead.</span>
                </div>

                {/* Purchasing Options */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10.5px] font-bold text-slate-700">Bidding Option:</span>
                    <span className="badge bg-amber-50 text-amber-700 text-[10px] font-extrabold flex items-center gap-0.5">
                      {emrTaskCount > 0 ? '⚡ Spot Active' : 'On-Demand'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center font-mono text-[10px] text-slate-600">
                    <span>Spot Node Cost:</span>
                    <span className="font-bold text-emerald-700">${emrSpotPrice}/hr <span className="text-[8.5px] text-slate-400 font-normal line-through">$0.24</span></span>
                  </div>
                  <div className="text-[9px] text-slate-500 leading-normal border-t border-slate-200/60 pt-1">
                    Spot purchasing utilizes spare EC2 capacity, offering up to a **70% discount** for scaling compute nodes!
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={provisionEmrCluster}
                    disabled={emrMasterState === 'provisioning'}
                    className="py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors shadow-sm disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-1"
                  >
                    <Server className="w-3.5 h-3.5" /> Boot Cluster
                  </button>
                  <button
                    onClick={() => triggerEmrJob('spark')}
                    disabled={emrMasterState !== 'active' || emrWorkload !== 'idle'}
                    className="py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-500 transition-colors shadow-sm disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5" /> Spark Batch
                  </button>
                  <button
                    onClick={() => triggerEmrJob('presto')}
                    disabled={emrMasterState !== 'active' || emrWorkload !== 'idle'}
                    className="py-2 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-500 transition-colors shadow-sm disabled:bg-slate-200 disabled:text-slate-400 flex items-center justify-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5" /> Presto SQL
                  </button>
                  <button
                    onClick={resetEmrCluster}
                    className="py-2 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reset EMR
                  </button>
                </div>
              </div>
            </div>

            {/* EMR SVG Diagram */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">Hadoop/Spark Distributed Node Architecture</h4>
                    <p className="text-[11px] text-slate-500">Visualizes physical roles: Master (coordinates), Core (HDFS storage), and optional Spot Task nodes</p>
                  </div>
                  <span className={`badge text-[10px] font-bold ${
                    emrMasterState === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-650'
                  }`}>
                    Status: {emrMasterState.toUpperCase()}
                  </span>
                </div>

                <div className="w-full h-[240px] rounded-xl border border-slate-200 relative flex items-center justify-center shadow-inner bg-slate-50 overflow-hidden">
                  <svg className="w-full h-full max-w-[620px] da-svg-bg" viewBox="0 0 600 240">
                    <defs>
                      <marker id="emr-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                      </marker>
                    </defs>

                    {/* Master connection paths */}
                    <path d="M 125 120 Q 210 50, 290 50" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#emr-arrow)" />
                    <path d="M 125 120 H 290" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#emr-arrow)" />
                    <path d="M 125 120 Q 210 190, 290 190" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#emr-arrow)" />

                    {/* Active flow animations */}
                    {emrWorkload === 'spark-jobs' && (
                      <>
                        <path d="M 125 120 Q 210 50, 290 50" fill="none" stroke="#a855f7" strokeWidth="3" className="da-flow-purple" />
                        <path d="M 125 120 H 290" fill="none" stroke="#a855f7" strokeWidth="3" className="da-flow-purple" />
                        <path d="M 125 120 Q 210 190, 290 190" fill="none" stroke="#a855f7" strokeWidth="3" className="da-flow-purple" />
                      </>
                    )}
                    {emrWorkload === 'presto-queries' && (
                      <>
                        <path d="M 125 120 Q 210 50, 290 50" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-blue" />
                        <path d="M 125 120 H 290" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-blue" />
                        <path d="M 125 120 Q 210 190, 290 190" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-blue" />
                      </>
                    )}
                    {emrWorkload === 'flink-aggregations' && (
                      <>
                        <path d="M 125 120 Q 210 50, 290 50" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                        <path d="M 125 120 H 290" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                        <path d="M 125 120 Q 210 190, 290 190" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                      </>
                    )}

                    {/* Master Node */}
                    <g transform="translate(15, 65)">
                      <rect width="110" height="110" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-blue-border)" strokeWidth="2.5" />
                      <rect x="5" y="5" width="100" height="24" rx="4" fill="var(--da-svg-blue-bg)" stroke="var(--da-svg-blue-border)" strokeWidth="1" />
                      <text x="55" y="20.5" fill="var(--da-svg-blue-text)" fontSize="9" fontWeight="extrabold" textAnchor="middle">👑 MASTER NODE</text>
                      
                      {/* Active coordinator dial */}
                      <circle cx="55" cy="68" r="22" fill="var(--da-svg-bg)" stroke="var(--da-svg-node-border)" />
                      <circle cx="55" cy="68" r="22" fill="none" stroke="var(--da-svg-blue-border)" strokeWidth="2" strokeDasharray="6 3" className={emrWorkload !== 'idle' ? 'pulse-circle' : ''} />
                      <text x="55" y="71" fill="var(--da-svg-text-dark)" fontSize="8" fontWeight="bold" textAnchor="middle">
                        {emrWorkload !== 'idle' ? 'SPARK RUN' : 'HA OK'}
                      </text>
                      <text x="55" y="102" fill="var(--da-text-muted)" fontSize="7" textAnchor="middle">m5.xlarge (Coord)</text>
                    </g>

                    {/* Core Nodes Block (HDFS Storage Capacity) */}
                    <g transform="translate(290, 15)">
                      <rect width="130" height="100" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" strokeWidth="2" />
                      <rect x="4" y="4" width="122" height="20" rx="3.5" fill="var(--da-svg-green-bg)" />
                      <text x="65" y="17" fill="var(--da-svg-green-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">🗄️ CORE FLEET ({emrCoreCount})</text>
                      
                      {/* Dynamically drawn core server slots */}
                      {Array.from({ length: Math.min(emrCoreCount, 4) }).map((_, idx) => (
                        <g key={idx} transform={`translate(${10 + idx * 28}, 32)`}>
                          <rect width="24" height="42" rx="3" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                          <rect x="2" y="2" width="20" height="8" rx="1.5" fill="var(--da-svg-green-bg)" />
                          <text x="12" y="8" fill="var(--da-svg-green-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">HDFS</text>
                          <circle cx="6" cy="22" r="2" fill="var(--da-svg-green-border)" />
                          <circle cx="18" cy="22" r="2" fill="var(--da-svg-green-border)" />
                          <circle cx="12" cy="32" r="2" fill="var(--da-svg-green-border)" />
                        </g>
                      ))}
                      {emrCoreCount > 4 && (
                        <text x="65" y="90" fill="var(--da-svg-green-text)" fontSize="8" fontWeight="bold" textAnchor="middle">+ {emrCoreCount - 4} More Core Nodes</text>
                      )}
                      <text x="65" y="93" fill="var(--da-svg-green-text)" fontSize="7" textAnchor="middle" fontWeight="bold">Stores Local Blocks</text>
                    </g>

                    {/* Task Nodes Block (Spot Compute) */}
                    <g transform="translate(290, 125)">
                      <rect width="130" height="100" rx="8" fill="var(--da-svg-node-fill)" stroke={emrTaskCount > 0 ? "var(--da-svg-amber-border)" : "var(--da-svg-node-border)"} strokeWidth="2" />
                      <rect x="4" y="4" width="122" height="20" rx="3.5" fill={emrTaskCount > 0 ? "var(--da-svg-amber-bg)" : "var(--da-svg-bg)"} />
                      <text x="65" y="17" fill={emrTaskCount > 0 ? "var(--da-svg-amber-text)" : "var(--da-text-muted)"} fontSize="8.5" fontWeight="extrabold" textAnchor="middle">⚡ TASK FLEET ({emrTaskCount})</text>
                      
                      {emrTaskCount === 0 ? (
                        <text x="65" y="60" fill="var(--da-text-muted)" fontSize="8.5" fontStyle="italic" textAnchor="middle">No Task Nodes (Idle)</text>
                      ) : (
                        <>
                          {Array.from({ length: Math.min(emrTaskCount, 4) }).map((_, idx) => (
                            <g key={idx} transform={`translate(${10 + idx * 28}, 32)`}>
                              <rect width="24" height="42" rx="3" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" className={emrWorkload === 'spark-jobs' ? 'active-svg-glow' : ''} />
                              <rect x="2" y="2" width="20" height="8" rx="1.5" fill="var(--da-svg-amber-bg)" />
                              <text x="12" y="8" fill="var(--da-svg-amber-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">SPOT</text>
                              <line x1="4" y1="20" x2="20" y2="20" stroke="var(--da-svg-amber-border)" strokeWidth="2" />
                              <line x1="4" y1="28" x2="20" y2="28" stroke="var(--da-svg-amber-border)" strokeWidth="2" />
                              <circle cx="12" cy="36" r="2.5" fill="var(--da-svg-amber-border)" className={emrWorkload !== 'idle' ? 'pulse-circle' : ''} />
                            </g>
                          ))}
                          {emrTaskCount > 4 && (
                            <text x="65" y="90" fill="var(--da-svg-amber-text)" fontSize="8" fontWeight="bold" textAnchor="middle">+ {emrTaskCount - 4} Task Nodes</text>
                          )}
                          <text x="65" y="93" fill="var(--da-svg-amber-text)" fontSize="7" textAnchor="middle" fontWeight="bold">Compute-Only Nodes</text>
                        </>
                      )}
                    </g>

                    {/* Output Bucket */}
                    <g transform="translate(490, 80)">
                      <ellipse cx="35" cy="85" rx="30" ry="10" fill="var(--da-svg-green-bg)" />
                      <path d="M 5 25 V 85 A 30 10 0 0 0 65 85 V 25 Z" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" strokeWidth="2" />
                      <ellipse cx="35" cy="25" rx="30" ry="10" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="2" />
                      <text x="35" y="38" fill="var(--da-svg-green-text)" fontSize="9" fontWeight="extrabold" textAnchor="middle">🪣 REF S3</text>
                      <text x="35" y="60" fill="var(--da-svg-green-text)" fontSize="8" textAnchor="middle">Output</text>
                      <text x="35" y="72" fill="var(--da-svg-green-text)" fontSize="8" textAnchor="middle">Data Lake</text>
                    </g>
                    <path d="M 420 65 H 490" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#emr-arrow)" />
                    <path d="M 420 175 H 490" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#emr-arrow)" />

                    {emrWorkload !== 'idle' && (
                      <>
                        <path d="M 420 65 H 490" fill="none" stroke="#10b981" strokeWidth="2.5" className="da-flow-green" />
                        <path d="M 420 175 H 490" fill="none" stroke="#10b981" strokeWidth="2.5" className="da-flow-green" />
                      </>
                    )}
                  </svg>
                </div>
              </div>

              {/* Real-time EMR logger trace */}
              <div className="bg-slate-900 border border-slate-950 rounded-xl p-3 h-[90px] font-mono text-[9px] text-slate-300 overflow-y-auto space-y-1 mt-3 shadow-inner">
                {emrLogs.length === 0 ? (
                  <span className="text-slate-500 italic block text-center mt-6">EMR Cluster online. Select job type and trigger analytics work.</span>
                ) : (
                  emrLogs.map((log, idx) => {
                    let color = 'text-slate-350';
                    if (log.includes('ACTIVE:')) color = 'text-emerald-400 font-bold bg-emerald-950/40 px-1 rounded';
                    if (log.includes('AUTO-SCALING:')) color = 'text-amber-400 font-bold bg-amber-950/40 px-1 rounded animate-pulse';
                    if (log.includes('SUCCESS') || log.includes('✅')) color = 'text-emerald-400 font-bold bg-emerald-950/40 px-1 rounded border border-emerald-900/50';
                    if (log.includes('SPARK') || log.includes('PRESTO') || log.includes('FLINK')) color = 'text-sky-300 font-semibold';
                    return <div key={idx} className={`${color} pb-0.5 border-b border-slate-800/40`}>{log}</div>;
                  })
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SANDBOX SECTION 3: AMAZON OPENSEARCH SERVICE                              */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* OpenSearch Integrations Controller */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <BookOpen className="w-4 h-4 text-sky-500" /> Sandbox 3: OpenSearch Search Index
                </h3>

                {/* Query selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">1. Full-text Lookup Phrase:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={osSearchQuery}
                      onChange={(e) => setOsSearchQuery(e.target.value)}
                      placeholder="e.g. auth-error, timeout"
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none font-bold text-slate-700 focus:border-sky-500 transition-colors"
                    />
                    <button
                      onClick={triggerOsSearch}
                      disabled={osState !== 'idle'}
                      className="px-3 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-500 transition-colors shadow-sm"
                    >
                      Search
                    </button>
                  </div>
                  <span className="text-[9.5px] text-slate-500 block">OpenSearch parses fuzzy matches across all database shards.</span>
                </div>

                {/* Ingestion track */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">2. Ingest Inflow Pathway:</label>
                  <select
                    value={osIngestPath}
                    onChange={(e) => setOsIngestPath(e.target.value as 'dynamodb' | 'kinesis-firehose' | 'cloudwatch')}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none font-bold text-slate-700"
                  >
                    <option value="dynamodb">DynamoDB Streams (CDC lambda sync)</option>
                    <option value="kinesis-firehose">Kinesis Firehose (Near-realtime streams)</option>
                    <option value="cloudwatch">CloudWatch Logs Subscription filter</option>
                  </select>
                  
                  <div className="pt-1 flex gap-2">
                    <button
                      onClick={triggerOsIngestion}
                      disabled={osState !== 'idle'}
                      className="flex-1 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-500 transition-colors shadow-sm disabled:bg-slate-200 disabled:text-slate-400"
                    >
                      🔒 Trigger Ingest Pipeline
                    </button>
                    <button
                      onClick={resetOsSandbox}
                      className="px-2.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Live Database complementary index results grid */}
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                  <span className="text-[10px] font-extrabold text-slate-700 block border-b border-slate-200 pb-1 flex justify-between">
                    <span>📋 Complementary Index Results</span>
                    <span className="text-sky-600 font-mono text-[9px]">Resolved rows</span>
                  </span>
                  
                  {osSearchResults.length === 0 ? (
                    <span className="text-[9.5px] text-slate-400 italic block text-center py-4">No results matched. Click Search above.</span>
                  ) : (
                    <div className="space-y-2">
                      {osSearchResults.map((res, i) => (
                        <div key={i} className="bg-white border border-slate-200 rounded-lg p-2 text-[9.5px] leading-normal space-y-1">
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-800">Key: <span className="font-mono text-sky-700">{res.id}</span></span>
                            <span className="text-emerald-700 bg-emerald-50 px-1 rounded text-[8px] font-extrabold">{res.dbLatency}</span>
                          </div>
                          <div className="text-slate-650">{res.message}</div>
                          <div className="text-[8px] font-semibold text-slate-400 border-t border-slate-100 pt-0.5">{res.matchedField}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* OpenSearch SVG Integration Pipeline */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">Complementary Index lookup &amp; Ingest Architecture</h4>
                    <p className="text-[11px] text-slate-500">How OpenSearch maps indexes to fast DynamoDB key retrieval &amp; buffered ingestion pipelines</p>
                  </div>
                </div>

                <div className="w-full h-[240px] rounded-xl border border-slate-200 relative flex items-center justify-center shadow-inner bg-slate-50 overflow-hidden">
                  <svg className="w-full h-full max-w-[620px] da-svg-bg" viewBox="0 0 600 240">
                    <defs>
                      <marker id="os-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#cbd5e1" />
                      </marker>
                    </defs>

                    {/* Pathways */}
                    {/* Path 1: DynamoDB Stream Ingestion */}
                    <path d="M 80 50 H 140" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#os-arrow)" />
                    <path d="M 215 50 H 265" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#os-arrow)" />
                    {osState === 'ingesting' && osIngestPath === 'dynamodb' && (
                      <>
                        <path d="M 80 50 H 140" fill="none" stroke="#ea580c" strokeWidth="2.5" className="da-flow-orange" />
                        <path d="M 215 50 H 265" fill="none" stroke="#a855f7" strokeWidth="2.5" className="da-flow-purple" />
                      </>
                    )}

                    {/* Path 2: Kinesis Firehose Ingestion */}
                    <path d="M 80 120 H 140" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#os-arrow)" />
                    <path d="M 215 120 H 265" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#os-arrow)" />
                    {osState === 'ingesting' && osIngestPath === 'kinesis-firehose' && (
                      <>
                        <path d="M 80 120 H 140" fill="none" stroke="#a855f7" strokeWidth="2.5" className="da-flow-purple" />
                        <path d="M 215 120 H 265" fill="none" stroke="#10b981" strokeWidth="2.5" className="da-flow-green" />
                      </>
                    )}

                    {/* Path 3: CloudWatch Logs Ingestion */}
                    <path d="M 80 190 H 140" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#os-arrow)" />
                    <path d="M 215 190 H 265" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#os-arrow)" />
                    {osState === 'ingesting' && osIngestPath === 'cloudwatch' && (
                      <>
                        <path d="M 80 190 H 140" fill="none" stroke="#0ea5e9" strokeWidth="2.5" className="da-flow-blue" />
                        <path d="M 215 190 H 265" fill="none" stroke="#cbd5e1" strokeWidth="2.5" className="da-flow-sky" />
                      </>
                    )}

                    {/* Path 4: Complementary Search Loop (OS lookup -> key lookup) */}
                    <path d="M 440 50 Q 520 80, 500 135" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#os-arrow)" />
                    <path d="M 500 160 Q 420 185, 340 185" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#os-arrow)" />
                    {osState === 'searching' && (
                      <>
                        <path d="M 440 50 Q 520 80, 500 135" fill="none" stroke="#0ea5e9" strokeWidth="2.5" className="da-flow-blue" />
                        <path d="M 500 160 Q 420 185, 340 185" fill="none" stroke="#ea580c" strokeWidth="2.5" className="da-flow-orange" />
                      </>
                    )}

                    {/* Ingestion Source Nodes */}
                    <g transform="translate(10, 20)">
                      <rect width="70" height="55" rx="5" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" />
                      <text x="35" y="16" fill="var(--da-svg-amber-text)" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">🗄️ DynamoDB</text>
                      <rect x="5" y="24" width="60" height="10" rx="1.5" fill="var(--da-svg-amber-bg)" />
                      <text x="35" y="31.5" fill="var(--da-svg-amber-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">STREAMS CDC</text>
                      <text x="35" y="47" fill="var(--da-text-muted)" fontSize="6" textAnchor="middle">Table Mutations</text>
                    </g>

                    <g transform="translate(10, 92)">
                      <rect width="70" height="55" rx="5" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-purple-border)" strokeWidth="1.5" />
                      <text x="35" y="16" fill="var(--da-svg-purple-text)" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">⚡ KINESIS</text>
                      <rect x="5" y="24" width="60" height="10" rx="1.5" fill="var(--da-svg-purple-bg)" />
                      <text x="35" y="31.5" fill="var(--da-svg-purple-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">DATA FIREHOSE</text>
                      <text x="35" y="47" fill="var(--da-text-muted)" fontSize="6" textAnchor="middle">Raw Streams</text>
                    </g>

                    <g transform="translate(10, 162)">
                      <rect width="70" height="55" rx="5" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-blue-border)" strokeWidth="1.5" />
                      <text x="35" y="16" fill="var(--da-svg-blue-text)" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">📋 CLOUDWATCH</text>
                      <rect x="5" y="24" width="60" height="10" rx="1.5" fill="var(--da-svg-blue-bg)" />
                      <text x="35" y="31.5" fill="var(--da-svg-blue-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">SUBSCRIPTION</text>
                      <text x="35" y="47" fill="var(--da-text-muted)" fontSize="6" textAnchor="middle">Log rule filters</text>
                    </g>

                    {/* Middle Transformation Node (Lambda Connector) */}
                    <g transform="translate(140, 25)">
                      <rect width="75" height="190" rx="6" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" />
                      <rect x="5" y="5" width="65" height="16" rx="2" fill="var(--da-svg-amber-bg)" />
                      <text x="37.5" y="16" fill="var(--da-svg-amber-text)" fontSize="7" fontWeight="extrabold" textAnchor="middle">λ LAMBDAS</text>
                      
                      {/* Lambda nodes */}
                      <g transform="translate(17, 30)">
                        <circle cx="20" cy="20" r="16" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-amber-border)" className={osState === 'ingesting' && osIngestPath === 'dynamodb' ? 'pulse-circle' : ''} />
                        <text x="20" y="24" fill="var(--da-svg-amber-text)" fontSize="12" fontWeight="bold" textAnchor="middle">λ</text>
                      </g>
                      <g transform="translate(17, 85)">
                        <circle cx="20" cy="20" r="16" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-amber-border)" className={osState === 'ingesting' && osIngestPath === 'kinesis-firehose' ? 'pulse-circle' : ''} />
                        <text x="20" y="24" fill="var(--da-svg-amber-text)" fontSize="12" fontWeight="bold" textAnchor="middle">λ</text>
                      </g>
                      <g transform="translate(17, 140)">
                        <circle cx="20" cy="20" r="16" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-amber-border)" />
                        <text x="20" y="24" fill="var(--da-svg-amber-text)" fontSize="12" fontWeight="bold" textAnchor="middle">λ</text>
                      </g>
                    </g>

                    {/* OpenSearch Service Core Cluster */}
                    <g transform="translate(265, 25)">
                      <rect width="175" height="190" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-blue-border)" strokeWidth="2.5" />
                      <rect x="5" y="5" width="165" height="20" rx="3.5" fill="var(--da-svg-blue-bg)" />
                      <text x="87.5" y="18" fill="var(--da-svg-blue-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">🔎 OPENSEARCH CLUSTER</text>
                      
                      {/* Coordinating Master Node */}
                      <g transform="translate(10, 32)">
                        <rect width="155" height="28" rx="4" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-blue-border)" />
                        <circle cx="15" cy="14" r="3.5" fill="var(--da-svg-blue-border)" />
                        <text x="32" y="17" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="extrabold">Coordinating Master Node</text>
                        <text x="32" y="24.5" fill="var(--da-text-muted)" fontSize="6.5">Config &amp; cluster management</text>
                      </g>
                      
                      {/* Shard Partition Data Nodes */}
                      <g transform="translate(10, 66)">
                        <rect width="155" height="52" rx="4" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" />
                        <rect x="4" y="4" width="147" height="12" rx="2" fill="var(--da-svg-green-bg)" />
                        <text x="77.5" y="12" fill="var(--da-svg-green-text)" fontSize="7" fontWeight="extrabold" textAnchor="middle">Data Nodes (Primary Shards)</text>
                        
                        {/* Shards boxes */}
                        <g transform="translate(15, 20)">
                          <rect width="25" height="24" rx="2" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                          <text x="12.5" y="14" fill="var(--da-svg-green-text)" fontSize="8.5" fontWeight="bold" textAnchor="middle">P0</text>
                        </g>
                        <g transform="translate(48, 20)">
                          <rect width="25" height="24" rx="2" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                          <text x="12.5" y="14" fill="var(--da-svg-green-text)" fontSize="8.5" fontWeight="bold" textAnchor="middle">P1</text>
                        </g>
                        
                        {/* Replica Shards */}
                        <g transform="translate(81, 20)">
                          <rect width="25" height="24" rx="2" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1" strokeDasharray="2 2" />
                          <text x="12.5" y="14" fill="var(--da-text-muted)" fontSize="8.5" fontWeight="bold" textAnchor="middle">R0</text>
                        </g>
                        <g transform="translate(114, 20)">
                          <rect width="25" height="24" rx="2" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1" strokeDasharray="2 2" />
                          <text x="12.5" y="14" fill="var(--da-text-muted)" fontSize="8.5" fontWeight="bold" textAnchor="middle">R1</text>
                        </g>
                      </g>

                      {/* UltraWarm Tier */}
                      <g transform="translate(10, 124)">
                        <rect width="155" height="26" rx="4" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" />
                        <ellipse cx="15" cy="13" rx="10" ry="3" fill="var(--da-svg-node-border)" />
                        <text x="32" y="16" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="extrabold">UltraWarm Nodes</text>
                        <text x="32" y="23.5" fill="var(--da-text-muted)" fontSize="6.5">Near-line caching tier</text>
                      </g>

                      {/* Cold S3 Storage */}
                      <g transform="translate(10, 156)">
                        <rect width="155" height="26" rx="4" fill="var(--da-svg-bg)" stroke="var(--da-svg-node-border)" strokeDasharray="2 2" />
                        <text x="77.5" y="16.5" fill="var(--da-text-muted)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Cold Tier (S3 backups bucket)</text>
                      </g>
                    </g>

                    {/* Right Hand: Client Complementary Search patterns */}
                    <g transform="translate(480, 130)">
                      <rect width="80" height="40" rx="4" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                      <text x="40" y="16" fill="var(--da-svg-green-text)" fontSize="8" fontWeight="extrabold" textAnchor="middle">🏢 COMPLEMENT</text>
                      <text x="40" y="26" fill="var(--da-svg-green-subtext)" fontSize="7" textAnchor="middle">DYNAMODB KEY</text>
                      <text x="40" y="35" fill="var(--da-svg-green-subtext)" fontSize="6.5" fontStyle="italic" textAnchor="middle">BatchGetItem</text>
                    </g>
                  </svg>
                </div>
              </div>

              {/* Ingress Trace Console */}
              <div className="bg-slate-900 border border-slate-950 rounded-xl p-3 h-[90px] font-mono text-[9px] text-slate-300 overflow-y-auto space-y-1 mt-3 shadow-inner">
                {osLogs.length === 0 ? (
                  <span className="text-slate-500 italic block text-center mt-6">OpenSearch Ingest Engine ready. Select path and run pipeline.</span>
                ) : (
                  osLogs.map((log, idx) => {
                    let color = 'text-slate-350';
                    if (log.includes('USER SEARCH:') || log.includes('OPENSEARCH:')) color = 'text-sky-300 font-semibold';
                    if (log.includes('INTEGRATION PATTERN:')) color = 'text-purple-300 font-bold bg-purple-950/40 px-1 rounded animate-pulse';
                    if (log.includes('DYNAMODB:') || log.includes('BatchGetItem')) color = 'text-amber-400 font-semibold';
                    if (log.includes('SUCCESS') || log.includes('✅')) color = 'text-emerald-400 font-bold bg-emerald-950/40 px-1 rounded border border-emerald-905/50';
                    return <div key={idx} className={`${color} pb-0.5 border-b border-slate-800/40`}>{log}</div>;
                  })
                )}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SANDBOX SECTION 4: QUICKSIGHT SPICE IN-MEMORY GAUGES                      */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* QuickSight SPICE Performance Deck */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <TrendingUp className="w-4 h-4 text-sky-600" /> Sandbox 4: QuickSight SPICE Caching
                </h3>

                {/* SPICE Enable Toggle */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">In-Memory SPICE Caching:</label>
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">SPICE Caching Engine</span>
                      <span className="text-[10px] text-slate-500 leading-normal">Super-fast, Parallel, In-memory Engine</span>
                    </div>
                    <button
                      onClick={() => setQsSpiceEnabled(!qsSpiceEnabled)}
                      className={`px-4 py-1.5 rounded-lg font-extrabold text-[10px] border transition-all ${
                        qsSpiceEnabled 
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-650'
                      }`}
                    >
                      {qsSpiceEnabled ? '🟢 ENABLED' : '❌ DISABLED'}
                    </button>
                  </div>
                  <p className="text-[9.5px] text-slate-500 leading-relaxed">
                    SPICE accelerates analytics dashboard latency from minutes down to **sub-seconds** by skipping S3 files and Athena compute networks entirely.
                  </p>
                </div>

                {/* Action button */}
                <button
                  disabled={qsQuerying}
                  onClick={runQsDashboardQuery}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:bg-slate-200"
                >
                  <Play className="w-3.5 h-3.5" /> Query Analytical Dashboard
                </button>
              </div>
            </div>

            {/* QuickSight SPICE Latency Gauge Gauge */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">QuickSight Analytics Query Latency Gauge</h4>
                    <p className="text-[11px] text-slate-500">Compares direct data lake Athena/S3 queries (sluggish) with SPICE memory speed</p>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    Query Latency: <span className={qsSpiceEnabled ? "text-emerald-700" : "text-amber-700"}>{qsQueryLatency}ms</span>
                  </span>
                </div>

                <div className="w-full h-[220px] rounded-xl border border-slate-200 relative flex items-center justify-center shadow-inner bg-slate-50 overflow-hidden">
                  <svg className="w-full h-full max-w-[500px]" viewBox="0 0 400 200">
                    <defs>
                      <linearGradient id="gauge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="30%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>

                    {/* Outer arch path representing speedometer */}
                    <path
                      d="M 60 160 A 130 130 0 0 1 340 160"
                      fill="none"
                      stroke="url(#gauge-gradient)"
                      strokeWidth="24"
                      strokeLinecap="round"
                    />

                    {/* Scale markers */}
                    <text x="50" y="180" fill="var(--da-text-muted)" fontSize="10" textAnchor="middle" fontWeight="bold">0ms</text>
                    <text x="110" y="80" fill="var(--da-text-muted)" fontSize="10" textAnchor="middle" fontWeight="bold">50ms</text>
                    <text x="200" y="40" fill="var(--da-text-muted)" fontSize="10" textAnchor="middle" fontWeight="bold">250ms</text>
                    <text x="350" y="180" fill="var(--da-text-muted)" fontSize="10" textAnchor="middle" fontWeight="bold">500ms</text>
 
                    {/* Needle */}
                    {qsSpiceEnabled ? (
                      /* Needle pointing to 15ms (left side) */
                      <g transform="translate(200, 160) rotate(-75)">
                        <polygon points="-4,0 4,0 0,-115" fill="var(--da-svg-text-dark)" />
                        <circle cx="0" cy="0" r="8" fill="var(--da-svg-green-border)" stroke="var(--da-svg-node-fill)" strokeWidth="2" />
                      </g>
                    ) : (
                      /* Needle pointing to 480ms (right side) */
                      <g transform="translate(200, 160) rotate(70)">
                        <polygon points="-4,0 4,0 0,-115" fill="var(--da-svg-text-dark)" />
                        <circle cx="0" cy="0" r="8" fill="var(--da-svg-red-border)" stroke="var(--da-svg-node-fill)" strokeWidth="2" />
                      </g>
                    )}
 
                    {/* Core stats panel */}
                    <rect x="135" y="115" width="130" height="50" rx="8" fill="var(--da-svg-node-fill)" stroke="var(--da-card-border)" strokeWidth="1.5" />
                    <text x="200" y="132" fill="var(--da-text-muted)" fontSize="8" fontWeight="bold" textAnchor="middle">QUERY LATENCY</text>
                    <text x="200" y="157" fill={qsSpiceEnabled ? "var(--da-svg-green-text)" : "var(--da-svg-red-text)"} fontSize="20" fontWeight="black" textAnchor="middle" className="font-mono">
                      {qsQueryLatency} ms
                    </text>
 
                    {/* Performance classification text */}
                    <text x="200" y="187" fill={qsSpiceEnabled ? "var(--da-svg-green-text)" : "var(--da-svg-amber-text)"} fontSize="9.5" fontWeight="bold" textAnchor="middle">
                      {qsSpiceEnabled ? "🚀 SUB-SECOND IN-MEMORY SPEED" : "⚠️ SLUGGISH DIRECT SCAN QUERY"}
                    </text>
                  </svg>
                </div>
              </div>

              {/* SPICE latency logs */}
              <div className="bg-slate-900 border border-slate-950 rounded-xl p-3 h-[90px] font-mono text-[9px] text-slate-300 overflow-y-auto space-y-1 mt-3 shadow-inner">
                {qsLogs.length === 0 ? (
                  <span className="text-slate-500 italic block text-center mt-6">QuickSight BI Engine ready. Trigger query scanner.</span>
                ) : (
                  qsLogs.map((log, idx) => {
                    let color = 'text-slate-350';
                    if (log.includes('SPICE CACHE HIT:')) color = 'text-emerald-400 font-bold bg-emerald-950/40 px-1 rounded animate-pulse';
                    if (log.includes('SPICE CACHE MISS:')) color = 'text-amber-400 font-bold bg-amber-950/40 px-1 rounded';
                    if (log.includes('LATENCY:')) color = qsSpiceEnabled ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold';
                    return <div key={idx} className={`${color} pb-0.5 border-b border-slate-800/40`}>{log}</div>;
                  })
                )}
              </div>
            </div>
          </div>

          {/* Quick specs details for OpenSearch and QuickSight SPICE at the bottom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            <div className="border border-slate-150 rounded-2xl p-4 bg-white shadow-sm hover:border-sky-300 transition-all">
              <h4 className="font-bold text-xs text-sky-800 block mb-2">🔎 Amazon OpenSearch Service &amp; DynamoDB Complement Pattern</h4>
              <p className="text-[11.5px] leading-relaxed text-slate-600 mb-2">
                DynamoDB limits complex query searches to partition keys and local indexes. By syncing updates to an **OpenSearch** cluster using DynamoDB Streams + Lambda triggers, you enable powerful fuzzy and full-text partial matches. When searching, you query the fast OpenSearch index (15ms), fetch document IDs, and issue high-speed BatchGetItem keys directly to DynamoDB (4ms) to return complete rows with 100% data integrity.
              </p>
            </div>

            <div className="border border-slate-150 rounded-2xl p-4 bg-white shadow-sm hover:border-sky-300 transition-all">
              <h4 className="font-bold text-xs text-sky-800 block mb-2">📊 Super-fast Parallel In-memory SPICE Caching</h4>
              <p className="text-[11.5px] leading-relaxed text-slate-600 mb-2">
                **SPICE** (Super-fast, Parallel, In-memory Calculation Engine) represents QuickSight's in-memory storage. Loading dataset snapshots into SPICE memory blocks bypasses raw data stores like S3/Athena or active relational Redshift databases entirely. Queries are served inside 15ms sub-second times, drastically reducing query costs by avoiding redundant S3/Athena column scanning charges.
              </p>
            </div>
          </div>
        </div>
      )}
          </>
        </Translate>
      )}
    </div>
  );
}
