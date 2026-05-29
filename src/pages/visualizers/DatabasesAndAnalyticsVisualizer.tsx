import { useState, useEffect } from 'react';
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

type TabType = 'intro' | 'rdbms' | 'nosql' | 'lakehouse' | 'warehousing' | 'streaming' | 'ingestion';

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

export default function DatabasesAndAnalyticsVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('intro');

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
  // TAB 5 STATE: Redshift Warehousing & DR Snapshot
  // ==========================================
  const [redshiftState, setRedshiftState] = useState<'idle' | 'snapshotting' | 'replicating' | 'recovering' | 'completed'>('idle');
  const [redshiftLogs, setRedshiftLogs] = useState<string[]>([]);

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
      {/* Styles block for premium, isolated light-theme look */}
      <style>{`
        .da-container {
          font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
          color: #1e293b;
          background-color: #f8fafc;
          padding: 24px;
          border-radius: 16px;
        }
        .da-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02);
          margin-bottom: 24px;
          transition: all 0.2s ease;
        }
        .da-card:hover {
          border-color: #0ea5e9;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -4px rgba(0, 0, 0, 0.04);
        }
        .da-card-title {
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .da-card-desc {
          font-size: 12.5px;
          color: #475569;
          line-height: 1.65;
        }
        .da-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-tertiary, #e2e8f0); padding-bottom: 10px; }
        .da-tb { padding: 6px 14px; border-radius: var(--border-radius-lg, 12px); border: 0.5px solid var(--color-border-secondary, #cbd5e1); font-size: 12px; cursor: pointer; background: var(--color-background-secondary, #f8fafc); color: var(--color-text-secondary, #475569); transition: all 0.15s; outline: none; font-weight: 500; display: inline-flex; align-items: center; gap: 4px; }
        .da-tb:hover { background: var(--color-background-tertiary, #f1f5f9); }
        .da-tb.da-on { background: #16a34a; color: #fff; border-color: #16a34a; font-weight: 500; }
        
        /* Neon glows keyframe animations */
        @keyframes da-pulse-purple {
          0%, 100% {
            stroke-width: 3px;
            opacity: 0.8;
            filter: drop-shadow(0 0 2px rgba(168, 85, 247, 0.6));
          }
          50% {
            stroke-width: 5px;
            opacity: 1;
            filter: drop-shadow(0 0 6px rgba(168, 85, 247, 1)) drop-shadow(0 0 12px rgba(168, 85, 247, 0.5));
          }
        }
        @keyframes da-pulse-green {
          0%, 100% {
            stroke-width: 3px;
            opacity: 0.8;
            filter: drop-shadow(0 0 2px rgba(16, 185, 129, 0.6));
          }
          50% {
            stroke-width: 5px;
            opacity: 1;
            filter: drop-shadow(0 0 6px rgba(16, 185, 129, 1)) drop-shadow(0 0 12px rgba(16, 185, 129, 0.5));
          }
        }
        @keyframes da-pulse-blue {
          0%, 100% {
            stroke-width: 3px;
            opacity: 0.8;
            filter: drop-shadow(0 0 2px rgba(14, 165, 233, 0.6));
          }
          50% {
            stroke-width: 5px;
            opacity: 1;
            filter: drop-shadow(0 0 6px rgba(14, 165, 233, 1)) drop-shadow(0 0 12px rgba(14, 165, 233, 0.5));
          }
        }
        @keyframes da-pulse-orange {
          0%, 100% {
            stroke-width: 3px;
            opacity: 0.8;
            filter: drop-shadow(0 0 2px rgba(249, 115, 22, 0.6));
          }
          50% {
            stroke-width: 5px;
            opacity: 1;
            filter: drop-shadow(0 0 6px rgba(249, 115, 22, 1)) drop-shadow(0 0 12px rgba(249, 115, 22, 0.5));
          }
        }
        .da-flow-purple {
          stroke: #c084fc;
          animation: da-pulse-purple 1.5s infinite;
        }
        .da-flow-green {
          stroke: #10b981;
          animation: da-pulse-green 1.5s infinite;
        }
        .da-flow-blue {
          stroke: #0ea5e9;
          animation: da-pulse-blue 1.5s infinite;
        }
        .da-flow-orange {
          stroke: #f97316;
          animation: da-pulse-orange 1.5s infinite;
        }
        .da-node-btn {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .da-node-btn:hover {
          filter: drop-shadow(0 0 4px rgba(14, 165, 233, 0.3));
        }
      `}</style>

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 mb-6">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-sky-500 rounded-lg text-white">
            <Database className="w-6 h-6" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AWS Databases &amp; Analytics Visualizer</h1>
            <p className="text-xs text-slate-500 mt-0.5">Explore RDBMS failures, NoSQL partitions, Lakehouse governance, Redshift warehouses, MSK Streams, and Flink sliding window engines</p>
          </div>
        </div>
      </div>

      {/* Tabs navigation bar */}
      <div className="da-tabs">
        <button className={`da-tb ${activeTab === 'intro' ? 'da-on' : ''}`} onClick={() => setActiveTab('intro')}>
          <BookOpen className="w-4 h-4" /> 1. Choosing the Right DB &amp; Theory
        </button>
        <button className={`da-tb ${activeTab === 'rdbms' ? 'da-on' : ''}`} onClick={() => setActiveTab('rdbms')}>
          <Server className="w-4 h-4" /> 2. RDS &amp; Aurora Cluster
        </button>
        <button className={`da-tb ${activeTab === 'nosql' ? 'da-on' : ''}`} onClick={() => setActiveTab('nosql')}>
          <Database className="w-4 h-4" /> 3. NoSQL Suite &amp; Cache-Aside
        </button>
        <button className={`da-tb ${activeTab === 'lakehouse' ? 'da-on' : ''}`} onClick={() => setActiveTab('lakehouse')}>
          <Shield className="w-4 h-4" /> 4. Athena &amp; Lake Governance
        </button>
        <button className={`da-tb ${activeTab === 'warehousing' ? 'da-on' : ''}`} onClick={() => setActiveTab('warehousing')}>
          <TrendingUp className="w-4 h-4" /> 5. Redshift Warehousing &amp; DR
        </button>
        <button className={`da-tb ${activeTab === 'streaming' ? 'da-on' : ''}`} onClick={() => setActiveTab('streaming')}>
          <Activity className="w-4 h-4" /> 6. Streaming Kafka &amp; Flink
        </button>
        <button className={`da-tb ${activeTab === 'ingestion' ? 'da-on' : ''}`} onClick={() => setActiveTab('ingestion')}>
          <LayoutDashboard className="w-4 h-4" /> 7. Ingestion Sandbox &amp; OpenSearch
        </button>
      </div>

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
              <div className="w-full h-[280px] bg-slate-50 rounded-xl border border-slate-150 p-2 relative overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full max-w-[620px]" viewBox="0 0 600 280">
                  <defs>
                    <marker id="aurora-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                    </marker>
                    <marker id="aurora-arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#0ea5e9" />
                    </marker>
                  </defs>

                  {/* CNAME endpoint lines */}
                  <path d="M 300 20 L 150 70" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 3" />
                  
                  {/* Decoupled storage link lines */}
                  <path d="M 150 120 L 300 210" fill="none" stroke="#cbd5e1" strokeWidth="2.5" markerEnd="url(#aurora-arrow)" />
                  <path d="M 450 120 L 300 210" fill="none" stroke="#cbd5e1" strokeWidth="2.5" markerEnd="url(#aurora-arrow)" />

                  {/* Active Flows */}
                  {masterActive && (
                    <>
                      <path d="M 300 20 L 150 70" fill="none" stroke="#0ea5e9" strokeWidth="3.5" className="da-flow-blue" />
                      <path d="M 150 120 L 300 210" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-blue" />
                    </>
                  )}

                  {failoverState === 'promoting-reader' && (
                    <path d="M 450 120 L 300 210" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                  )}

                  {failoverState === 'route53-updating' && (
                    <path d="M 300 20 L 450 70" fill="none" stroke="#0ea5e9" strokeWidth="3.5" className="da-flow-blue" />
                  )}

                  {failoverState === 'completed' && (
                    <>
                      <path d="M 300 20 L 450 70" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-blue" />
                      <path d="M 450 120 L 300 210" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-blue" />
                    </>
                  )}

                  {/* Route 53 endpoint node */}
                  <g transform="translate(230, 2)">
                    <rect width="140" height="32" rx="6" fill="#f0fdf4" stroke="#0d9488" strokeWidth="1.5" />
                    <text x="70" y="15" fill="#0d9488" fontSize="8" fontWeight="bold" textAnchor="middle">🌐 ROUTE 53 CNAME</text>
                    <text x="70" y="25" fill="#475569" fontSize="7" textAnchor="middle" fontFamily="monospace">aurora-cluster.endpoint...</text>
                  </g>

                  {/* AZ boundaries */}
                  <rect x="20" y="52" width="260" height="110" rx="8" fill="rgba(148, 163, 184, 0.04)" stroke="#cbd5e1" strokeDasharray="3 3" />
                  <text x="35" y="70" fill="#94a3b8" fontSize="7" fontWeight="bold">AVAILABILITY ZONE 1A</text>

                  <rect x="320" y="52" width="260" height="110" rx="8" fill="rgba(148, 163, 184, 0.04)" stroke="#cbd5e1" strokeDasharray="3 3" />
                  <text x="335" y="70" fill="#94a3b8" fontSize="7" fontWeight="bold">AVAILABILITY ZONE 1B</text>

                  {/* Instances */}
                  <g transform="translate(60, 75)">
                    <rect width="180" height="70" rx="8" fill={masterActive ? '#eff6ff' : '#fef2f2'} stroke={masterActive ? '#3b82f6' : '#ef4444'} strokeWidth="2.5" />
                    <text x="90" y="24" fill={masterActive ? '#1d4ed8' : '#dc2626'} fontSize="11" fontWeight="bold" textAnchor="middle">
                      {masterActive ? '🛢️ PRIMARY WRITER' : '💥 WRITER CRASHED'}
                    </text>
                    <text x="90" y="44" fill="#475569" fontSize="8.5" textAnchor="middle">aurora-writer-us-east-1a</text>
                    <text x="90" y="58" fill={masterActive ? '#059669' : '#dc2626'} fontSize="8" fontWeight="bold" textAnchor="middle">
                      {masterActive ? 'Status: Active Writes' : 'Status: Connection Lost'}
                    </text>
                  </g>

                  <g transform="translate(360, 75)">
                    <rect width="180" height="70" rx="8" fill={
                      promotedReaderId === 'aurora-reader-us-east-1b' ? '#f0fdf4' : '#eff6ff'
                    } stroke={
                      promotedReaderId === 'aurora-reader-us-east-1b' ? '#10b981' : '#3b82f6'
                    } strokeWidth="2.5" />
                    <text x="90" y="24" fill={
                      promotedReaderId === 'aurora-reader-us-east-1b' ? '#047857' : '#1d4ed8'
                    } fontSize="11" fontWeight="bold" textAnchor="middle">
                      {promotedReaderId === 'aurora-reader-us-east-1b' ? '🛢️ PROMOTED WRITER' : '🔌 REPLICA READER'}
                    </text>
                    <text x="90" y="44" fill="#475569" fontSize="8.5" textAnchor="middle">aurora-reader-us-east-1b</text>
                    <text x="90" y="58" fill="#0d9488" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {promotedReaderId === 'aurora-reader-us-east-1b' ? 'Status: Master writes active' : 'Status: Standby replica ready'}
                    </text>
                  </g>

                  {/* Decoupled storage block */}
                  <g transform="translate(180, 195)">
                    <rect width="240" height="70" rx="10" fill="#fffdfa" stroke="#d97706" strokeWidth="3" />
                    <text x="120" y="24" fill="#b45309" fontSize="12" fontWeight="bold" textAnchor="middle">⚡ DECOUPLED SHARED SSD</text>
                    <text x="120" y="42" fill="#78350f" fontSize="8.5" textAnchor="middle">Auto-Scales blocks up to 128 TB</text>
                    <text x="120" y="56" fill="#059669" fontSize="8" fontWeight="bold" textAnchor="middle">6-way active replication across 3 AZs</text>
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
              <div className="w-full h-[280px] bg-slate-50 rounded-xl border border-slate-150 p-2 relative overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full max-w-[620px]" viewBox="0 0 600 280">
                  <path d="M 60 140 H 130" fill="none" stroke="#94a3b8" strokeWidth="2.5" markerEnd="url(#aurora-arrow)" />
                  <path d="M 210 140 Q 250 80, 310 80" fill="none" stroke="#94a3b8" strokeWidth="2.5" markerEnd="url(#aurora-arrow)" />
                  <path d="M 210 140 Q 250 200, 310 200" fill="none" stroke="#94a3b8" strokeWidth="2.5" markerEnd="url(#aurora-arrow)" />
                  <path d="M 390 200 H 480" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#aurora-arrow)" />

                  {/* Cache hit flow line */}
                  {cacheState === 'checking-cache' && (
                    <path d="M 210 140 Q 250 80, 310 80" fill="none" stroke="#c084fc" strokeWidth="3.5" className="da-flow-purple" />
                  )}

                  {cacheState === 'cache-hit' && (
                    <path d="M 310 80 Q 250 80, 210 140" fill="none" stroke="#10b981" strokeWidth="3.5" className="da-flow-green" />
                  )}

                  {/* Cache miss flow lines */}
                  {cacheState === 'cache-miss' && (
                    <path d="M 310 80 Q 250 80, 210 140" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="3 3" />
                  )}

                  {cacheState === 'querying-db' && (
                    <path d="M 210 140 Q 250 200, 310 200" fill="none" stroke="#0ea5e9" strokeWidth="3.5" className="da-flow-blue" />
                  )}

                  {cacheState === 'populating-cache' && (
                    <>
                      <path d="M 390 200 H 480" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                      <path d="M 310 200 Q 250 200, 210 140" fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
                    </>
                  )}

                  {/* Nodes */}
                  <g transform="translate(10, 105)">
                    <rect width="50" height="70" rx="5" fill="#f8fafc" stroke="#64748b" strokeWidth="2" />
                    <text x="25" y="30" fill="#475569" fontSize="9" fontWeight="bold" textAnchor="middle">📱 USER</text>
                    <text x="25" y="46" fill="#64748b" fontSize="7.5" textAnchor="middle">Request</text>
                  </g>

                  <g transform="translate(130, 105)">
                    <rect width="80" height="70" rx="8" fill="#fcf7ff" stroke="#a855f7" strokeWidth="2.5" />
                    <text x="40" y="26" fill="#7e22ce" fontSize="10" fontWeight="bold" textAnchor="middle">⚡ APP SERVER</text>
                    <text x="40" y="44" fill="#581c87" fontSize="7.5" textAnchor="middle">Node.js API</text>
                    <text x="40" y="58" fill="#64748b" fontSize="7" textAnchor="middle" fontWeight="bold">
                      {cacheState === 'checking-cache' ? 'Checking Cache' :
                       cacheState === 'querying-db' ? 'Querying DB' : 'Status: Idle'}
                    </text>
                  </g>

                  <g transform="translate(310, 45)">
                    <rect width="120" height="70" rx="8" fill="#fef2f2" stroke="#ef4444" strokeWidth="2.5" />
                    <text x="60" y="24" fill="#dc2626" fontSize="10" fontWeight="bold" textAnchor="middle">🔌 REDIS CACHE</text>
                    <text x="60" y="40" fill="#991b1b" fontSize="8" textAnchor="middle">ElastiCache Mem</text>
                    <text x="60" y="54" fill={
                      cacheState === 'cache-hit' ? '#059669' :
                      cacheState === 'cache-miss' ? '#dc2626' : '#64748b'
                    } fontSize="8" fontWeight="bold" textAnchor="middle">
                      {cacheState === 'cache-hit' ? '🟢 HIT (0.2ms)' :
                       cacheState === 'cache-miss' ? '❌ MISS' : 'Status: Online'}
                    </text>
                  </g>

                  <g transform="translate(310, 165)">
                    <rect width="120" height="70" rx="8" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2.5" />
                    <text x="60" y="24" fill="#1d4ed8" fontSize="10" fontWeight="bold" textAnchor="middle">🛢️ PRIMARY DB</text>
                    <text x="60" y="40" fill="#475569" fontSize="8" textAnchor="middle">PostgreSQL / RDS</text>
                    <text x="60" y="54" fill="#1d4ed8" fontSize="7.5" fontWeight="semibold" textAnchor="middle">
                      {cacheState === 'querying-db' ? 'Disk Query (6ms)' : 'Persistent Storage'}
                    </text>
                  </g>

                  <g transform="translate(480, 165)">
                    <rect width="110" height="70" rx="8" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1.5" />
                    <text x="55" y="24" fill="#15803d" fontSize="9" fontWeight="bold" textAnchor="middle">🗄️ DYNAMODB</text>
                    <text x="55" y="40" fill="#166534" fontSize="7" textAnchor="middle">Decoupled NoSQL</text>
                    <text x="55" y="54" fill="#15803d" fontSize="7" fontWeight="bold" textAnchor="middle">Consistent Sub-10ms</text>
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
                <div className="w-full h-[180px] bg-slate-50 border border-slate-150 rounded-xl relative p-1 flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 400 180">
                    <defs>
                      <marker id="lake-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                      </marker>
                    </defs>

                    {/* Path links */}
                    <path d="M 50 90 H 130" fill="none" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#lake-arrow)" />
                    <path d="M 210 90 Q 230 40, 270 40" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />
                    <path d="M 210 90 H 270" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />
                    <path d="M 210 90 Q 230 140, 270 140" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />

                    <path d="M 330 40 Q 360 40, 360 70" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />
                    <path d="M 330 90 Q 360 90, 360 90" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />
                    <path d="M 330 140 Q 360 140, 360 110" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />

                    {/* Nodes */}
                    <g transform="translate(5, 65)">
                      <rect width="45" height="50" rx="4" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
                      <text x="22" y="24" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">📱 CLIENT</text>
                      <text x="22" y="36" fill="#64748b" fontSize="6.5" textAnchor="middle">SQL Query</text>
                    </g>

                    <g transform="translate(130, 55)">
                      <rect width="80" height="70" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
                      <text x="40" y="26" fill="#1d4ed8" fontSize="8.5" fontWeight="bold" textAnchor="middle">🔍 COORDINATOR</text>
                      <text x="40" y="42" fill="#1e40af" fontSize="7" textAnchor="middle">Parses SQL Query</text>
                      <text x="40" y="54" fill="#0d9488" fontSize="6.5" fontWeight="bold" textAnchor="middle">Glue Catalog Check</text>
                    </g>

                    {/* Workers */}
                    <g transform="translate(270, 20)">
                      <rect width="60" height="36" rx="4" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
                      <text x="30" y="16" fill="#475569" fontSize="7.5" fontWeight="bold" textAnchor="middle">👷 Worker #1</text>
                      <text x="30" y="26" fill="#64748b" fontSize="6" textAnchor="middle">Scans S3 file partition A</text>
                    </g>
                    <g transform="translate(270, 72)">
                      <rect width="60" height="36" rx="4" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
                      <text x="30" y="16" fill="#475569" fontSize="7.5" fontWeight="bold" textAnchor="middle">👷 Worker #2</text>
                      <text x="30" y="26" fill="#64748b" fontSize="6" textAnchor="middle">Scans S3 file partition B</text>
                    </g>
                    <g transform="translate(270, 124)">
                      <rect width="60" height="36" rx="4" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
                      <text x="30" y="16" fill="#475569" fontSize="7.5" fontWeight="bold" textAnchor="middle">👷 Worker #3</text>
                      <text x="30" y="26" fill="#64748b" fontSize="6" textAnchor="middle">Scans S3 file partition C</text>
                    </g>

                    {/* S3 Lake */}
                    <g transform="translate(355, 60)">
                      <rect width="40" height="60" rx="4" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
                      <text x="20" y="24" fill="#15803d" fontSize="8.5" fontWeight="bold" textAnchor="middle">🪣 S3</text>
                      <text x="20" y="38" fill="#166534" fontSize="6.5" textAnchor="middle">Parquet</text>
                      <text x="20" y="48" fill="#166534" fontSize="6.5" textAnchor="middle">Lake</text>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: REDSHIFT WAREHOUSING & DR SNAPSHOT SIMULATOR                        */}
      {/* ========================================================================= */}
      {activeTab === 'warehousing' && (
        <div className="space-y-6">
          <div className="da-card">
            <h2 className="da-card-title text-sky-700">
              <TrendingUp className="w-5 h-5" /> Enterprise Warehousing: Amazon Redshift, Spectrum, &amp; Disaster Recovery
            </h2>
            <p className="da-card-desc">
              Amazon Redshift is a columnar MPP (Massively Parallel Processing) data warehouse separating compute and leader nodes. **Redshift Spectrum** runs queries directly over S3 data lakes without database ingestion, using automated snapshot logs for cross-region disaster recovery (DR).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* In-depth Redshift MPP architecture diagram */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 min-h-[460px] flex flex-col justify-between shadow-sm">
              <div className="w-full flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Amazon Redshift MPP Columnar cluster Architecture</h3>
                  <p className="text-[11px] text-slate-500">Trigger simulated Disaster Recovery failover and watch snapshots restore in us-west-2</p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={redshiftState !== 'idle'}
                    onClick={triggerRedshiftDR}
                    className="px-3.5 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" /> Trigger DR Failover Recovery
                  </button>
                  <button
                    onClick={resetRedshiftDR}
                    className="p-1.5 bg-slate-100 text-slate-605 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Complex Redshift MPP SVG */}
              <div className="w-full h-[280px] bg-slate-50 rounded-xl border border-slate-150 p-2 relative overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full max-w-[620px]" viewBox="0 0 600 280">
                  {/* Client path */}
                  <path d="M 50 140 H 130" fill="none" stroke="#64748b" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  {/* Leader to Compute slice paths */}
                  <path d="M 210 140 L 290 80" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  <path d="M 210 140 L 290 200" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  
                  {/* Redshift Spectrum path to S3 */}
                  <path d="M 390 80 Q 420 40, 480 40" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#aurora-arrow)" />
                  <path d="M 390 200 Q 420 240, 480 240" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#aurora-arrow)" />

                  {/* Active flow animations during DR */}
                  {redshiftState === 'snapshotting' && (
                    <path d="M 210 140 L 290 80" fill="none" stroke="#f97316" strokeWidth="3" className="da-flow-orange" />
                  )}

                  {redshiftState === 'replicating' && (
                    <>
                      <path d="M 390 80 Q 420 40, 480 40" fill="none" stroke="#a855f7" strokeWidth="3" className="da-flow-purple" />
                      <path d="M 390 200 Q 420 240, 480 240" fill="none" stroke="#a855f7" strokeWidth="3" className="da-flow-purple" />
                    </>
                  )}

                  {redshiftState === 'recovering' && (
                    <path d="M 210 140 L 290 200" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                  )}

                  {redshiftState === 'completed' && (
                    <>
                      <path d="M 50 140 H 130" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                      <path d="M 210 140 L 290 200" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                    </>
                  )}

                  {/* Nodes */}
                  <g transform="translate(5, 115)">
                    <rect width="45" height="50" rx="4" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
                    <text x="22" y="24" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">📱 CLIENT</text>
                    <text x="22" y="36" fill="#64748b" fontSize="6" textAnchor="middle">Analytics SQL</text>
                  </g>

                  {/* Redshift Leader Node */}
                  <g transform="translate(130, 105)">
                    <rect width="80" height="70" rx="8" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2.5" />
                    <text x="40" y="26" fill="#1d4ed8" fontSize="10" fontWeight="bold" textAnchor="middle">🛢️ LEADER NODE</text>
                    <text x="40" y="44" fill="#1e40af" fontSize="7.5" textAnchor="middle">Client endpoint</text>
                    <text x="40" y="58" fill="#0d9488" fontSize="7" textAnchor="middle" fontWeight="semibold">Query planner</text>
                  </g>

                  {/* Redshift Compute Nodes */}
                  <g transform="translate(290, 45)">
                    <rect width="100" height="60" rx="6" fill="#fdf4ff" stroke="#a855f7" strokeWidth="2" />
                    <text x="50" y="20" fill="#7e22ce" fontSize="9" fontWeight="bold" textAnchor="middle">👷 COMPUTE NODE #1</text>
                    <text x="50" y="34" fill="#581c87" fontSize="7.5" textAnchor="middle">Slice A: columnar SSD</text>
                    <text x="50" y="48" fill="#a855f7" fontSize="6.5" textAnchor="middle">Active execution</text>
                  </g>

                  <g transform="translate(290, 175)">
                    <rect width="100" height="60" rx="6" fill="#fdf4ff" stroke="#a855f7" strokeWidth="2" />
                    <text x="50" y="20" fill="#7e22ce" fontSize="9" fontWeight="bold" textAnchor="middle">👷 COMPUTE NODE #2</text>
                    <text x="50" y="34" fill="#581c87" fontSize="7.5" textAnchor="middle">Slice B: columnar SSD</text>
                    <text x="50" y="48" fill="#0d9488" fontSize="6.5" textAnchor="middle">
                      {redshiftState === 'recovering' ? 'Re-assembling slice' : 'Active execution'}
                    </text>
                  </g>

                  {/* S3 querying via Redshift Spectrum */}
                  <g transform="translate(480, 15)">
                    <rect width="115" height="70" rx="6" fill="#fff7ed" stroke="#ea580c" strokeWidth="2" />
                    <text x="57" y="22" fill="#ea580c" fontSize="8" fontWeight="bold" textAnchor="middle">🔍 REDSHIFT SPECTRUM</text>
                    <text x="57" y="38" fill="#ea580c" fontSize="7.5" textAnchor="middle">Query external tables</text>
                    <text x="57" y="52" fill="#7c2d12" fontSize="7" textAnchor="middle">Scan S3 Parquet directly</text>
                  </g>

                  <g transform="translate(480, 195)">
                    <rect width="115" height="70" rx="6" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
                    <text x="57" y="24" fill="#15803d" fontSize="9" fontWeight="bold" textAnchor="middle">🪣 REFINED S3 LAKE</text>
                    <text x="57" y="42" fill="#166534" fontSize="7.5" textAnchor="middle">Incremental snapshots</text>
                    <text x="57" y="56" fill="#059669" fontSize="7" fontWeight="bold" textAnchor="middle">dw-backups-bucket</text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Redshift DR logs trace console */}
            <div className="lg:col-span-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col h-[460px] shadow-inner">
              <div className="flex items-center gap-2 text-slate-700 font-mono text-xs border-b border-slate-200 pb-2 mb-3">
                <Terminal className="w-4 h-4 text-sky-600" />
                <span>DW Snapshot Recovery Trace</span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-2.5 font-mono text-[10.5px] leading-relaxed text-slate-700 pr-1">
                {redshiftLogs.length === 0 ? (
                  <span className="text-slate-500 block text-center mt-32 italic">Click "Trigger DR Failover Recovery" to initiate encrypted cross-region cluster copy recovery playbooks.</span>
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
        <div className="space-y-6">
          <div className="da-card">
            <h2 className="da-card-title text-sky-700">
              <LayoutDashboard className="w-5 h-5" /> Production Sandbox: Real-Time Streaming Ingestion vs. Batch ETL Pipelines
            </h2>
            <p className="da-card-desc">
              Compare architectural pipelines in a live ingestion sandbox. Connect telemetry signals to MSK Streaming or run AWS Glue Batch ETL to refined S3 partitions. Query metrics instantly via Athena, OpenSearch clusters, and SPICE-cached QuickSight dashboards.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sandbox Canvas diagram */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 min-h-[460px] flex flex-col justify-between shadow-sm">
              <div className="w-full flex items-center justify-between border-b border-slate-150 pb-3 mb-4">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Big Data Sandbox Pipeline Simulator</h3>
                  <p className="text-[11px] text-slate-500">Toggle Ingestion Pipeline model below, execute, and inspect system telemetry</p>
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={ingestionType}
                    onChange={(e) => setIngestionType(e.target.value as 'streaming' | 'batch')}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs outline-none font-semibold text-slate-800"
                  >
                    <option value="streaming">Track: Real-Time Stream Ingestion</option>
                    <option value="batch">Track: Batch Data Lakehouse Ingestion</option>
                  </select>
                  <button
                    disabled={sandboxState !== 'idle'}
                    onClick={triggerIngestionSandbox}
                    className="px-3.5 py-1.5 bg-sky-600 text-white rounded-lg text-xs font-semibold hover:bg-sky-500 disabled:bg-slate-200 disabled:text-slate-400 transition-colors flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" /> Run Ingestion Sandbox
                  </button>
                  <button
                    onClick={resetSandbox}
                    className="p-1.5 bg-slate-100 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Large Ingestion Diagram */}
              <div className="w-full h-[280px] bg-slate-50 rounded-xl border border-slate-150 p-2 relative overflow-hidden flex items-center justify-center">
                <svg className="w-full h-full max-w-[620px]" viewBox="0 0 600 280">
                  {/* Connecting lines */}
                  {/* Top: Streaming */}
                  <path d="M 60 75 H 140" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  <path d="M 210 75 H 280" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  <path d="M 350 75 H 430" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />

                  {/* Bottom: Batch */}
                  <path d="M 60 195 H 140" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  <path d="M 210 195 H 280" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  <path d="M 350 195 H 430" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />

                  {/* Output Consumer links */}
                  <path d="M 490 75 V 140 H 420" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#aurora-arrow)" />
                  <path d="M 490 195 V 140 H 420" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#aurora-arrow)" />

                  {/* Flow glows */}
                  {sandboxState === 'ingesting' && (
                    <>
                      {ingestionType === 'streaming' && <path d="M 60 75 H 140" fill="none" stroke="#a855f7" strokeWidth="3" className="da-flow-purple" />}
                      {ingestionType === 'batch' && <path d="M 60 195 H 140" fill="none" stroke="#ea580c" strokeWidth="3" className="da-flow-orange" />}
                    </>
                  )}

                  {sandboxState === 'aggregating' && (
                    <>
                      {ingestionType === 'streaming' && <path d="M 210 75 H 280" fill="none" stroke="#a855f7" strokeWidth="3" className="da-flow-purple" />}
                      {ingestionType === 'batch' && <path d="M 210 195 H 280" fill="none" stroke="#ea580c" strokeWidth="3" className="da-flow-orange" />}
                    </>
                  )}

                  {sandboxState === 'storing' && (
                    <>
                      {ingestionType === 'streaming' && <path d="M 350 75 H 430" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />}
                      {ingestionType === 'batch' && <path d="M 350 195 H 430" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />}
                    </>
                  )}

                  {sandboxState === 'indexing' && (
                    <>
                      {ingestionType === 'streaming' && <path d="M 490 75 V 140 H 420" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-blue" />}
                      {ingestionType === 'batch' && <path d="M 350 195 H 430" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />}
                    </>
                  )}

                  {sandboxState === 'visualizing' && (
                    <>
                      {ingestionType === 'streaming' && <path d="M 490 75 V 140 H 420" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-blue" />}
                      {ingestionType === 'batch' && <path d="M 490 195 V 140 H 420" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-blue" />}
                    </>
                  )}

                  {sandboxState === 'completed' && (
                    <>
                      <path d="M 490 75 V 140 H 420" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                      <path d="M 490 195 V 140 H 420" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                    </>
                  )}

                  {/* Input Nodes */}
                  <g transform="translate(10, 50)">
                    <rect width="50" height="50" rx="4" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
                    <text x="25" y="22" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">📱 IoT SENSORS</text>
                    <text x="25" y="34" fill="#a855f7" fontSize="6.5" fontWeight="bold" textAnchor="middle">Streaming</text>
                  </g>

                  <g transform="translate(10, 170)">
                    <rect width="50" height="50" rx="4" fill="#ffffff" stroke="#64748b" strokeWidth="1.5" />
                    <text x="25" y="22" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">🛢️ APP LOGS</text>
                    <text x="25" y="34" fill="#f97316" fontSize="6.5" fontWeight="bold" textAnchor="middle">Batch OLTP</text>
                  </g>

                  {/* Top path nodes */}
                  <g transform="translate(140, 45)">
                    <rect width="70" height="60" rx="6" fill="#fdf4ff" stroke="#a855f7" strokeWidth="2" />
                    <text x="35" y="22" fill="#7e22ce" fontSize="8" fontWeight="bold" textAnchor="middle">⚡ KAFKA MSK</text>
                    <text x="35" y="36" fill="#581c87" fontSize="6.5" textAnchor="middle">Broker Clusters</text>
                    <text x="35" y="46" fill="#a855f7" fontSize="6" fontWeight="bold" textAnchor="middle">Serverless option</text>
                  </g>

                  <g transform="translate(280, 45)">
                    <rect width="70" height="60" rx="6" fill="#fdf4ff" stroke="#a855f7" strokeWidth="2" />
                    <text x="35" y="22" fill="#7e22ce" fontSize="8" fontWeight="bold" textAnchor="middle">⚙️ APACHE FLINK</text>
                    <text x="35" y="36" fill="#581c87" fontSize="6.5" textAnchor="middle">Stream aggregates</text>
                    <text x="35" y="46" fill="#64748b" fontSize="6" textAnchor="middle">10s Event sliding</text>
                  </g>

                  {/* Bottom path nodes */}
                  <g transform="translate(140, 165)">
                    <rect width="70" height="60" rx="6" fill="#fff7ed" stroke="#ea580c" strokeWidth="2" />
                    <text x="35" y="22" fill="#ea580c" fontSize="8" fontWeight="bold" textAnchor="middle">🪣 RAW S3</text>
                    <text x="35" y="36" fill="#c2410c" fontSize="6.5" textAnchor="middle">Ingest Buffer</text>
                    <text x="35" y="46" fill="#7c2d12" fontSize="6" textAnchor="middle">unstructured logs</text>
                  </g>

                  <g transform="translate(280, 165)">
                    <rect width="70" height="60" rx="6" fill="#fff7ed" stroke="#ea580c" strokeWidth="2" />
                    <text x="35" y="22" fill="#ea580c" fontSize="8" fontWeight="bold" textAnchor="middle">⚙️ GLUE SPARK</text>
                    <text x="35" y="36" fill="#c2410c" fontSize="6.5" textAnchor="middle">Batch Spark ETL</text>
                    <text x="35" y="46" fill="#78350f" fontSize="6" textAnchor="middle">convert to Parquet</text>
                  </g>

                  {/* Central Destination Nodes */}
                  <g transform="translate(430, 45)">
                    <rect width="110" height="60" rx="8" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2.5" />
                    <text x="55" y="22" fill="#15803d" fontSize="9" fontWeight="bold" textAnchor="middle">🪣 DATA LAKE S3</text>
                    <text x="55" y="36" fill="#166534" fontSize="7" textAnchor="middle">Refined Parquet</text>
                    <text x="55" y="48" fill="#059669" fontSize="6" fontWeight="bold" textAnchor="middle">Centralized Lakehouse</text>
                  </g>

                  <g transform="translate(430, 175)">
                    <rect width="110" height="60" rx="8" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2.5" />
                    <text x="55" y="22" fill="#15803d" fontSize="9" fontWeight="bold" textAnchor="middle">📖 GLUE CATALOG</text>
                    <text x="55" y="36" fill="#166534" fontSize="7" textAnchor="middle">Centralized Metadata</text>
                    <text x="55" y="48" fill="#059669" fontSize="6.5" textAnchor="middle">Lake Formation security</text>
                  </g>

                  {/* Output Consumer Nodes */}
                  <g transform="translate(290, 110)">
                    <rect width="130" height="60" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
                    <text x="65" y="20" fill="#1d4ed8" fontSize="8.5" fontWeight="bold" textAnchor="middle">📊 QUICKSIGHT (BI)</text>
                    <text x="65" y="34" fill="#1e40af" fontSize="7" textAnchor="middle">SPICE Caching Engine</text>
                    <text x="65" y="46" fill="#059669" fontSize="6" fontWeight="bold" textAnchor="middle">Sub-second visuals</text>
                  </g>

                  <g transform="translate(140, 110)">
                    <rect width="130" height="60" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
                    <text x="65" y="20" fill="#1d4ed8" fontSize="8.5" fontWeight="bold" textAnchor="middle">🔎 OPENSEARCH CLUSTER</text>
                    <text x="65" y="34" fill="#1e40af" fontSize="7" textAnchor="middle">Master / Data / UltraWarm</text>
                    <text x="65" y="46" fill="#475569" fontSize="6" textAnchor="middle">Shard partitions &amp; indexes</text>
                  </g>
                </svg>
              </div>
            </div>

            {/* Ingestion sandbox telemetry console & chart */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between h-[460px] shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-slate-150 pb-2 mb-2">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1">
                    <Activity className="w-4 h-4 text-sky-500" /> Active Sandbox Load
                  </span>
                  <span className="badge bg-emerald-50 text-emerald-700 text-[10px]">SPICE Caching Online</span>
                </div>

                {/* Recharts chart */}
                <div className="h-[180px] w-full mt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={telemetryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="timestamp" stroke="#94a3b8" fontSize={8.5} />
                      <YAxis stroke="#94a3b8" fontSize={8.5} />
                      <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                      <Bar dataKey="recordsIngested" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Volume Ingested" />
                      <Bar dataKey="queryLatencyMs" fill="#a855f7" radius={[4, 4, 0, 0]} name="SQL Speed (ms)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sandbox logger trace console */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 h-[160px] font-mono text-[9px] text-slate-700 overflow-y-auto space-y-1.5 shadow-inner">
                {sandboxLogs.length === 0 ? (
                  <span className="text-slate-500 italic block text-center mt-14">Dormant. Select pipeline and click execute button to map pathways.</span>
                ) : (
                  sandboxLogs.map((log, idx) => {
                    let color = 'text-slate-650';
                    if (log.includes('TRIGGERED:')) color = 'text-sky-700 font-semibold bg-sky-50 px-1 rounded';
                    if (log.includes('STREAM') || log.includes('GLUE')) color = 'text-purple-700 font-semibold bg-purple-50 px-1 rounded';
                    if (log.includes('SUCCESS') || log.includes('✅')) color = 'text-emerald-700 font-semibold bg-emerald-50 px-1 rounded border border-emerald-100';
                    return <div key={idx} className={`${color} pb-1 border-b border-slate-100`}>{log}</div>;
                  })
                )}
              </div>
            </div>
          </div>

          {/* Quick specs details for OpenSearch and QuickSight SPICE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-150 rounded-2xl p-4 bg-white shadow-sm hover:border-sky-300 transition-all">
              <h4 className="font-bold text-xs text-sky-800 block mb-2">🔎 Amazon OpenSearch Cluster Deep-Dive</h4>
              <p className="text-[11.5px] leading-relaxed text-slate-600 mb-2">
                OpenSearch partitions indexing data into physical chunks called **Shards**. To ensure disaster recovery and high availability, shards are backed up into **Replica Shards** synced across Availability Zones. 
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] mt-3 font-mono">
                <div className="border border-slate-200 rounded-lg p-1.5 bg-slate-50">
                  <span className="font-bold text-sky-700 block">Master Nodes</span>
                  Coordinating cluster configurations
                </div>
                <div className="border border-slate-200 rounded-lg p-1.5 bg-slate-50">
                  <span className="font-bold text-purple-700 block">Data Nodes</span>
                  Indices, shard segments, search runs
                </div>
                <div className="border border-slate-200 rounded-lg p-1.5 bg-slate-50">
                  <span className="font-bold text-emerald-700 block">UltraWarm Nodes</span>
                  Query backups on cold S3 directly
                </div>
              </div>
            </div>

            <div className="border border-slate-150 rounded-2xl p-4 bg-white shadow-sm hover:border-sky-300 transition-all">
              <h4 className="font-bold text-xs text-sky-800 block mb-2">📊 Amazon QuickSight SPICE Caching Engine</h4>
              <p className="text-[11.5px] leading-relaxed text-slate-600 mb-2">
                **SPICE** (Super-fast, Parallel, In-memory Calculation Engine) represents QuickSight's robust memory cache. Instead of querying S3, Athena, or Redshift databases repeatedly (saving cost and avoiding network latency), SPICE loads dataset blocks directly in-memory to render visual charts under a sub-second response time.
              </p>
              <div className="bg-sky-50 border border-sky-100 rounded-xl p-2.5 text-[10.5px] leading-relaxed text-slate-700 mt-2">
                <span className="font-bold text-sky-950 block">BI Performance Tip:</span>
                Configure scheduled SPICE refreshes (e.g. hourly or daily) or trigger programmatic API catalog synchronizations on Glue ETL task completions to ensure data accuracy in visual dashboards.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
