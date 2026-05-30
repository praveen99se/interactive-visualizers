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
          background: rgba(255, 255, 255, 0.75);
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(16px);
          margin-bottom: 24px;
          box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.08), 0 2px 8px -1px rgba(148, 163, 184, 0.04);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .da-card:hover {
          border-color: #0ea5e9;
          box-shadow: 0 12px 24px -4px rgba(14, 165, 233, 0.08), 0 4px 12px -2px rgba(14, 165, 233, 0.03);
          transform: translateY(-1px);
        }
        .da-card-title {
          font-size: 16.5px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.02em;
        }
        .da-card-desc {
          font-size: 12.5px;
          color: #475569;
          line-height: 1.65;
        }
        .da-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          border-bottom: 1.5px solid rgba(226, 232, 240, 0.8);
          padding-bottom: 10px;
        }
        .da-tb {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 12px;
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          background: rgba(255, 255, 255, 0.85);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease-in-out;
          outline: none;
        }
        .da-tb:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #1e293b;
        }
        .da-tb.da-on {
          background: #0284c7;
          color: #ffffff;
          border-color: #0284c7;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.12);
        }

        /* Custom dynamic visualizer backdrops */
        .da-svg-bg {
          background-color: #f8fafc;
          background-image: radial-gradient(rgba(14, 165, 233, 0.08) 1.5px, transparent 1.5px);
          background-size: 16px 16px;
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
          filter: drop-shadow(0 0 8px rgba(14, 165, 233, 0.4));
          transform: translateY(-1px);
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
              <div className="w-full h-[280px] rounded-xl border border-slate-200 p-2 relative overflow-hidden flex items-center justify-center shadow-inner bg-slate-50">
                <svg className="w-full h-full max-w-[620px] da-svg-bg" viewBox="0 0 600 280">
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
                  <g transform="translate(230, 2)" className="da-node-btn">
                    <rect width="140" height="32" rx="8" fill="rgba(240, 253, 244, 0.95)" stroke="#0d9488" strokeWidth="2" />
                    <text x="70" y="14" fill="#0d9488" fontSize="8.5" fontWeight="bold" textAnchor="middle">🌐 ROUTE 53 CNAME</text>
                    <text x="70" y="24" fill="#475569" fontSize="7.5" textAnchor="middle" fontFamily="monospace">aurora-cluster.endpoint...</text>
                  </g>

                  {/* AZ boundaries */}
                  <rect x="20" y="52" width="260" height="110" rx="10" fill="rgba(148, 163, 184, 0.02)" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="35" y="68" fill="#94a3b8" fontSize="7.5" fontWeight="bold">AVAILABILITY ZONE 1A</text>

                  <rect x="320" y="52" width="260" height="110" rx="10" fill="rgba(148, 163, 184, 0.02)" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="335" y="68" fill="#94a3b8" fontSize="7.5" fontWeight="bold">AVAILABILITY ZONE 1B</text>

                  {/* Instances */}
                  <g transform="translate(60, 75)" className="da-node-btn">
                    <rect width="180" height="70" rx="12" fill={masterActive ? 'rgba(239, 246, 255, 0.95)' : 'rgba(254, 242, 242, 0.95)'} stroke={masterActive ? '#3b82f6' : '#ef4444'} strokeWidth="2.5" />
                    <text x="90" y="24" fill={masterActive ? '#1d4ed8' : '#dc2626'} fontSize="11" fontWeight="bold" textAnchor="middle">
                      {masterActive ? '🛢️ PRIMARY WRITER' : '💥 WRITER CRASHED'}
                    </text>
                    <text x="90" y="44" fill="#1e293b" fontSize="8.5" textAnchor="middle" fontWeight="500">aurora-writer-us-east-1a</text>
                    <text x="90" y="58" fill={masterActive ? '#059669' : '#dc2626'} fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      {masterActive ? 'Status: Active Writes' : 'Status: Connection Lost'}
                    </text>
                  </g>

                  <g transform="translate(360, 75)" className="da-node-btn">
                    <rect width="180" height="70" rx="12" fill={
                      promotedReaderId === 'aurora-reader-us-east-1b' ? 'rgba(240, 253, 244, 0.95)' : 'rgba(239, 246, 255, 0.95)'
                    } stroke={
                      promotedReaderId === 'aurora-reader-us-east-1b' ? '#10b981' : '#3b82f6'
                    } strokeWidth="2.5" />
                    <text x="90" y="24" fill={
                      promotedReaderId === 'aurora-reader-us-east-1b' ? '#047857' : '#1d4ed8'
                    } fontSize="11" fontWeight="bold" textAnchor="middle">
                      {promotedReaderId === 'aurora-reader-us-east-1b' ? '🛢️ PROMOTED WRITER' : '🔌 REPLICA READER'}
                    </text>
                    <text x="90" y="44" fill="#1e293b" fontSize="8.5" textAnchor="middle" fontWeight="500">aurora-reader-us-east-1b</text>
                    <text x="90" y="58" fill="#0d9488" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      {promotedReaderId === 'aurora-reader-us-east-1b' ? 'Status: Master writes active' : 'Status: Standby replica ready'}
                    </text>
                  </g>

                  {/* Decoupled storage block */}
                  <g transform="translate(180, 195)" className="da-node-btn">
                    <rect width="240" height="70" rx="12" fill="rgba(255, 253, 250, 0.95)" stroke="#d97706" strokeWidth="3" />
                    <text x="120" y="24" fill="#b45309" fontSize="12.5" fontWeight="bold" textAnchor="middle">⚡ DECOUPLED SHARED SSD</text>
                    <text x="120" y="42" fill="#78350f" fontSize="9" textAnchor="middle" fontWeight="semibold">Auto-Scales blocks up to 128 TB</text>
                    <text x="120" y="56" fill="#059669" fontSize="9" fontWeight="bold" textAnchor="middle">6-way active replication across 3 AZs</text>
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
                  <path d="M 70 140 H 125" fill="none" stroke="#94a3b8" strokeWidth="2.5" markerEnd="url(#aurora-arrow)" />
                  <path d="M 210 137 Q 240 72.5, 290 72.5" fill="none" stroke="#94a3b8" strokeWidth="2.5" markerEnd="url(#aurora-arrow)" />
                  <path d="M 210 137 Q 240 197.5, 290 197.5" fill="none" stroke="#94a3b8" strokeWidth="2.5" markerEnd="url(#aurora-arrow)" />
                  <path d="M 400 197.5 H 480" fill="none" stroke="#94a3b8" strokeWidth="2" markerEnd="url(#aurora-arrow)" />

                  {/* Cache hit flow line */}
                  {cacheState === 'checking-cache' && (
                    <path d="M 210 137 Q 240 72.5, 290 72.5" fill="none" stroke="#c084fc" strokeWidth="3.5" className="da-flow-purple" />
                  )}

                  {cacheState === 'cache-hit' && (
                    <path d="M 290 72.5 Q 240 72.5, 210 137" fill="none" stroke="#10b981" strokeWidth="3.5" className="da-flow-green" />
                  )}

                  {/* Cache miss flow lines */}
                  {cacheState === 'cache-miss' && (
                    <path d="M 290 72.5 Q 240 72.5, 210 137" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="3 3" />
                  )}

                  {cacheState === 'querying-db' && (
                    <path d="M 210 137 Q 240 197.5, 290 197.5" fill="none" stroke="#0ea5e9" strokeWidth="3.5" className="da-flow-blue" />
                  )}

                  {cacheState === 'populating-cache' && (
                    <>
                      <path d="M 400 197.5 H 480" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                      <path d="M 290 197.5 Q 240 197.5, 210 137" fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
                    </>
                  )}

                  {/* Nodes */}
                  <g transform="translate(10, 105)" className="da-node-btn">
                    <rect width="60" height="70" rx="10" fill="rgba(248, 250, 252, 0.95)" stroke="#64748b" strokeWidth="2" />
                    <rect x="5" y="5" width="50" height="30" rx="6" fill="#f1f5f9" />
                    <text x="30" y="24" fill="#1e293b" fontSize="10.5" fontWeight="bold" textAnchor="middle">📱 USER</text>
                    <text x="30" y="50" fill="#475569" fontSize="8.5" fontWeight="bold" textAnchor="middle">Web Client</text>
                    <text x="30" y="60" fill="#64748b" fontSize="7" textAnchor="middle">Profile Query</text>
                  </g>

                  <g transform="translate(125, 100)" className="da-node-btn">
                    <rect x="4" y="4" width="85" height="75" rx="10" fill="rgba(168, 85, 247, 0.1)" />
                    <rect width="85" height="75" rx="10" fill="rgba(252, 247, 255, 0.95)" stroke="#a855f7" strokeWidth="2.5" />
                    <rect x="8" y="8" width="69" height="18" rx="4" fill="#faf5ff" stroke="#e9d5ff" strokeWidth="1" />
                    <text x="42.5" y="20.5" fill="#7e22ce" fontSize="9.5" fontWeight="bold" textAnchor="middle">⚡ APP SERVER</text>
                    <text x="42.5" y="42" fill="#581c87" fontSize="8" fontWeight="bold" textAnchor="middle">Node.js API</text>
                    <rect x="10" y="50" width="65" height="16" rx="4" fill="#f3e8ff" />
                    <text x="42.5" y="61" fill="#7e22ce" fontSize="7.5" textAnchor="middle" fontWeight="bold">
                      {cacheState === 'checking-cache' ? 'Checking Cache' :
                       cacheState === 'querying-db' ? 'Querying DB' : 'Status: Idle'}
                    </text>
                  </g>

                  <g transform="translate(290, 35)" className="da-node-btn">
                    <rect x="4" y="4" width="135" height="75" rx="10" fill="rgba(239, 68, 68, 0.1)" />
                    <rect width="135" height="75" rx="10" fill="rgba(254, 242, 242, 0.95)" stroke="#ef4444" strokeWidth="2.5" />
                    <rect x="10" y="10" width="115" height="20" rx="4" fill="#7f1d1d" />
                    <circle cx="20" cy="20" r="3.5" fill={cacheState === 'cache-hit' ? '#10b981' : '#ef4444'} className="pulse-circle" />
                    <circle cx="20" cy="20" r="3.5" fill={cacheState === 'cache-hit' ? '#10b981' : '#ef4444'} />
                    <circle cx="29" cy="20" r="2.5" fill="#10b981" />
                    <circle cx="36" cy="20" r="2.5" fill="#10b981" />
                    <circle cx="43" cy="20" r="2.5" fill="#6b7280" />
                    <text x="115" y="23" fill="#ffffff" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="end">REDIS CACHE</text>
                    
                    <text x="67.5" y="47" fill="#991b1b" fontSize="9" fontWeight="bold" textAnchor="middle">ElastiCache Cluster</text>
                    <text x="67.5" y="61" fill={
                      cacheState === 'cache-hit' ? '#059669' :
                      cacheState === 'cache-miss' ? '#dc2626' : '#475569'
                    } fontSize="9" fontWeight="bold" textAnchor="middle">
                      {cacheState === 'cache-hit' ? '🟢 HIT (0.2ms)' :
                       cacheState === 'cache-miss' ? '❌ MISS' : 'Status: Online'}
                    </text>
                  </g>

                  <g transform="translate(290, 160)" className="da-node-btn">
                    <ellipse cx="55" cy="65" rx="45" ry="10" fill="rgba(59, 130, 246, 0.15)" />
                    <path d="M 10 15 V 55 A 45 10 0 0 0 100 55 V 15 Z" fill="rgba(239, 246, 255, 0.95)" stroke="#3b82f6" strokeWidth="2.5" />
                    <ellipse cx="55" cy="15" rx="45" ry="10" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2.5" />
                    <path d="M 10 26 A 45 8 0 0 0 100 26" fill="none" stroke="#93c5fd" strokeWidth="1" strokeDasharray="3 3" />
                    <path d="M 10 38 A 45 8 0 0 0 100 38" fill="none" stroke="#93c5fd" strokeWidth="1.5" />
                    
                    <text x="55" y="23" fill="#1d4ed8" fontSize="9.5" fontWeight="bold" textAnchor="middle">🛢️ PRIMARY DB</text>
                    <text x="55" y="43" fill="#475569" fontSize="8" textAnchor="middle" fontWeight="semibold">PostgreSQL / RDS</text>
                    <text x="55" y="56" fill="#1e40af" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      {cacheState === 'querying-db' ? 'Disk Query (6ms)' : 'Persistent SSD'}
                    </text>
                  </g>

                  <g transform="translate(480, 160)" className="da-node-btn">
                    <rect x="4" y="4" width="110" height="75" rx="10" fill="rgba(22, 163, 74, 0.1)" />
                    <rect width="110" height="75" rx="10" fill="rgba(240, 253, 244, 0.95)" stroke="#16a34a" strokeWidth="2.5" />
                    <rect x="8" y="8" width="94" height="18" rx="4" fill="#dcfce7" stroke="#86efac" strokeWidth="1" />
                    <text x="55" y="20.5" fill="#15803d" fontSize="9" fontWeight="bold" textAnchor="middle">⚡ DYNAMODB</text>
                    <text x="55" y="43" fill="#166534" fontSize="8.5" textAnchor="middle" fontWeight="semibold">Decoupled NoSQL</text>
                    <text x="55" y="56" fill="#15803d" fontSize="8.5" fontWeight="bold" textAnchor="middle">Consistent Sub-10ms</text>
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
                <div className="w-full h-[180px] rounded-xl border border-slate-200 relative p-1 flex items-center justify-center shadow-inner bg-slate-50">
                  <svg className="w-full h-full da-svg-bg" viewBox="0 0 400 180">
                    <defs>
                      <marker id="lake-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                      </marker>
                    </defs>

                    {/* Path links */}
                    <path d="M 50 90 H 115" fill="none" stroke="#3b82f6" strokeWidth="2.5" markerEnd="url(#lake-arrow)" />
                    <path d="M 210 87 Q 225 36, 255 36" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />
                    <path d="M 210 87 H 255" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />
                    <path d="M 210 87 Q 225 144, 255 144" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />

                    <path d="M 325 36 Q 348 36, 348 70" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />
                    <path d="M 325 90 H 348" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />
                    <path d="M 325 144 Q 348 144, 348 95" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#lake-arrow)" />

                    {/* Nodes */}
                    <g transform="translate(5, 60)" className="da-node-btn">
                      <rect width="45" height="60" rx="8" fill="rgba(255, 255, 255, 0.95)" stroke="#64748b" strokeWidth="1.5" />
                      <rect x="4" y="4" width="37" height="22" rx="4" fill="#f1f5f9" />
                      <text x="22.5" y="18" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">📱 CLIENT</text>
                      <text x="22.5" y="40" fill="#475569" fontSize="6.5" fontWeight="bold" textAnchor="middle">SQL Query</text>
                      <text x="22.5" y="50" fill="#64748b" fontSize="5.5" textAnchor="middle">Select *</text>
                    </g>

                    <g transform="translate(115, 45)" className="da-node-btn">
                      <rect x="3" y="3" width="95" height="85" rx="8" fill="rgba(59, 130, 246, 0.1)" />
                      <rect width="95" height="85" rx="8" fill="rgba(239, 246, 255, 0.95)" stroke="#3b82f6" strokeWidth="2" />
                      <rect x="6" y="6" width="83" height="20" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                      <text x="47.5" y="19" fill="#1d4ed8" fontSize="8.5" fontWeight="bold" textAnchor="middle">🔍 COORDINATOR</text>
                      <text x="47.5" y="42" fill="#1e40af" fontSize="7" textAnchor="middle" fontWeight="semibold">Parses SQL Query</text>
                      <text x="47.5" y="56" fill="#0d9488" fontSize="7.5" fontWeight="bold" textAnchor="middle">Checks Glue Schema</text>
                      <rect x="10" y="66" width="75" height="12" rx="3" fill="#ccfbf1" />
                      <text x="47.5" y="74.5" fill="#0d9488" fontSize="6.5" fontWeight="bold" textAnchor="middle">Task Optimizer</text>
                    </g>

                    {/* Workers */}
                    <g transform="translate(255, 15)" className="da-node-btn">
                      <rect width="70" height="42" rx="6" fill="rgba(248, 250, 252, 0.95)" stroke="#64748b" strokeWidth="1.5" />
                      <rect x="4" y="4" width="62" height="12" rx="3" fill="#f1f5f9" />
                      <circle cx="10" cy="10" r="2.5" fill="#10b981" />
                      <text x="38" y="13" fill="#475569" fontSize="7.5" fontWeight="bold" textAnchor="middle">👷 Worker #1</text>
                      <text x="35" y="32" fill="#64748b" fontSize="6.5" textAnchor="middle" fontWeight="semibold">Scan Partition A</text>
                    </g>
                    <g transform="translate(255, 69)" className="da-node-btn">
                      <rect width="70" height="42" rx="6" fill="rgba(248, 250, 252, 0.95)" stroke="#64748b" strokeWidth="1.5" />
                      <rect x="4" y="4" width="62" height="12" rx="3" fill="#f1f5f9" />
                      <circle cx="10" cy="10" r="2.5" fill="#10b981" />
                      <text x="38" y="13" fill="#475569" fontSize="7.5" fontWeight="bold" textAnchor="middle">👷 Worker #2</text>
                      <text x="35" y="32" fill="#64748b" fontSize="6.5" textAnchor="middle" fontWeight="semibold">Scan Partition B</text>
                    </g>
                    <g transform="translate(255, 123)" className="da-node-btn">
                      <rect width="70" height="42" rx="6" fill="rgba(248, 250, 252, 0.95)" stroke="#64748b" strokeWidth="1.5" />
                      <rect x="4" y="4" width="62" height="12" rx="3" fill="#f1f5f9" />
                      <circle cx="10" cy="10" r="2.5" fill="#10b981" />
                      <text x="38" y="13" fill="#475569" fontSize="7.5" fontWeight="bold" textAnchor="middle">👷 Worker #3</text>
                      <text x="35" y="32" fill="#64748b" fontSize="6.5" textAnchor="middle" fontWeight="semibold">Scan Partition C</text>
                    </g>

                    {/* S3 Lake */}
                    <g transform="translate(348, 50)" className="da-node-btn">
                      <ellipse cx="22" cy="55" rx="20" ry="6" fill="rgba(22, 163, 74, 0.15)" />
                      <path d="M 2 15 V 55 A 20 6 0 0 0 42 55 V 15 Z" fill="rgba(240, 253, 244, 0.95)" stroke="#16a34a" strokeWidth="2" />
                      <ellipse cx="22" cy="15" rx="20" ry="6" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
                      <path d="M 2 25 A 20 5 0 0 0 42 25" fill="none" stroke="#86efac" strokeWidth="1" strokeDasharray="2 2" />
                      <path d="M 2 35 A 20 5 0 0 0 42 35" fill="none" stroke="#86efac" strokeWidth="1.2" />
                      
                      <text x="22" y="25" fill="#15803d" fontSize="9.5" fontWeight="bold" textAnchor="middle">🪣 S3</text>
                      <text x="22" y="45" fill="#166534" fontSize="7" textAnchor="middle" fontWeight="bold">Parquet</text>
                      <text x="22" y="52" fill="#166534" fontSize="6.5" textAnchor="middle">Lake</text>
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
              <div className="w-full h-[280px] rounded-xl border border-slate-200 p-2 relative overflow-hidden flex items-center justify-center shadow-inner bg-slate-50">
                <svg className="w-full h-full max-w-[620px] da-svg-bg" viewBox="0 0 600 280">
                  {/* Client path */}
                  <path d="M 70 140 H 130" fill="none" stroke="#64748b" strokeWidth="2.5" markerEnd="url(#aurora-arrow)" />
                  {/* Leader to Compute slice paths */}
                  <path d="M 215 140 L 280 62.5" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  <path d="M 215 140 L 280 197.5" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  
                  {/* Redshift Spectrum path to S3 */}
                  <path d="M 400 62.5 H 455" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#aurora-arrow)" />
                  <path d="M 400 197.5 H 455" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#aurora-arrow)" />

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
                    <rect width="60" height="70" rx="10" fill="rgba(255, 255, 255, 0.95)" stroke="#64748b" strokeWidth="2" />
                    <rect x="5" y="5" width="50" height="30" rx="6" fill="#f1f5f9" />
                    <text x="30" y="24" fill="#1e293b" fontSize="10.5" fontWeight="bold" textAnchor="middle">📱 CLIENT</text>
                    <text x="30" y="50" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">BI Dashboard</text>
                    <text x="30" y="60" fill="#64748b" fontSize="7" textAnchor="middle">Analytics SQL</text>
                  </g>

                  {/* Redshift Leader Node */}
                  <g transform="translate(130, 95)" className="da-node-btn">
                    <rect x="4" y="4" width="85" height="90" rx="10" fill="rgba(59, 130, 246, 0.1)" />
                    <rect width="85" height="90" rx="10" fill="rgba(239, 246, 255, 0.95)" stroke="#3b82f6" strokeWidth="2.5" />
                    <rect x="8" y="8" width="69" height="20" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                    <text x="42.5" y="21" fill="#1d4ed8" fontSize="9" fontWeight="bold" textAnchor="middle">🛢️ LEADER NODE</text>
                    <text x="42.5" y="44" fill="#1e40af" fontSize="8" fontWeight="bold" textAnchor="middle">Client endpoint</text>
                    <text x="42.5" y="58" fill="#0d9488" fontSize="7.5" textAnchor="middle" fontWeight="semibold">Query planner</text>
                    <rect x="12" y="68" width="61" height="14" rx="3" fill="#ccfbf1" />
                    <text x="42.5" y="77" fill="#0f766e" fontSize="7" textAnchor="middle" fontWeight="bold">SQL Gateway</text>
                  </g>

                  {/* Redshift Compute Nodes */}
                  <g transform="translate(280, 25)" className="da-node-btn">
                    <rect x="4" y="4" width="120" height="75" rx="8" fill="rgba(168, 85, 247, 0.1)" />
                    <rect width="120" height="75" rx="8" fill="rgba(253, 244, 255, 0.95)" stroke="#a855f7" strokeWidth="2.5" />
                    <rect x="8" y="8" width="104" height="15" rx="3" fill="#581c87" />
                    <text x="60" y="19" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">👷 COMPUTE NODE #1</text>
                    
                    <text x="60" y="42" fill="#7e22ce" fontSize="8.5" fontWeight="bold" textAnchor="middle">Slice A: Columnar SSD</text>
                    <rect x="15" y="52" width="90" height="14" rx="3" fill="#f3e8ff" />
                    <text x="60" y="62" fill="#6b21a8" fontSize="7.5" fontWeight="bold" textAnchor="middle">Active execution</text>
                  </g>

                  <g transform="translate(280, 160)" className="da-node-btn">
                    <rect x="4" y="4" width="120" height="75" rx="8" fill="rgba(168, 85, 247, 0.1)" />
                    <rect width="120" height="75" rx="8" fill="rgba(253, 244, 255, 0.95)" stroke="#a855f7" strokeWidth="2.5" />
                    <rect x="8" y="8" width="104" height="15" rx="3" fill="#581c87" />
                    <text x="60" y="19" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">👷 COMPUTE NODE #2</text>
                    
                    <text x="60" y="42" fill="#7e22ce" fontSize="8.5" fontWeight="bold" textAnchor="middle">Slice B: Columnar SSD</text>
                    <rect x="15" y="52" width="90" height="14" rx="3" fill={redshiftState === 'recovering' ? '#fef3c7' : '#f3e8ff'} />
                    <text x="60" y="62" fill={redshiftState === 'recovering' ? '#b45309' : '#6b21a8'} fontSize="7.5" fontWeight="bold" textAnchor="middle">
                      {redshiftState === 'recovering' ? 'Re-assembling slice' : 'Active execution'}
                    </text>
                  </g>

                  {/* S3 querying via Redshift Spectrum */}
                  <g transform="translate(455, 25)" className="da-node-btn">
                    <rect x="3" y="3" width="135" height="75" rx="8" fill="rgba(234, 88, 12, 0.1)" />
                    <rect width="135" height="75" rx="8" fill="rgba(255, 247, 237, 0.95)" stroke="#ea580c" strokeWidth="2" />
                    <rect x="8" y="8" width="119" height="18" rx="4" fill="#ffedd5" />
                    <text x="67.5" y="21" fill="#c2410c" fontSize="8.5" fontWeight="bold" textAnchor="middle">🔍 REDSHIFT SPECTRUM</text>
                    <text x="67.5" y="44" fill="#ea580c" fontSize="8" fontWeight="bold" textAnchor="middle">Query external tables</text>
                    <text x="67.5" y="58" fill="#7c2d12" fontSize="8" textAnchor="middle" fontWeight="semibold">Scan S3 Parquet directly</text>
                  </g>

                  <g transform="translate(455, 160)" className="da-node-btn">
                    <ellipse cx="67.5" cy="55" rx="55" ry="12" fill="rgba(22, 163, 74, 0.15)" />
                    <path d="M 12.5 15 V 55 A 55 12 0 0 0 122.5 55 V 15 Z" fill="rgba(240, 253, 244, 0.95)" stroke="#16a34a" strokeWidth="2.5" />
                    <ellipse cx="67.5" cy="15" rx="55" ry="12" fill="#dcfce7" stroke="#16a34a" strokeWidth="2.5" />
                    <path d="M 12.5 28 A 55 10 0 0 0 122.5 28" fill="none" stroke="#86efac" strokeWidth="1" strokeDasharray="3 3" />
                    <path d="M 12.5 40 A 55 10 0 0 0 122.5 40" fill="none" stroke="#86efac" strokeWidth="1.5" />
                    
                    <text x="67.5" y="24" fill="#15803d" fontSize="10" fontWeight="bold" textAnchor="middle">🪣 REFINED S3 LAKE</text>
                    <text x="67.5" y="44" fill="#166534" fontSize="8" textAnchor="middle" fontWeight="semibold">dw-backups-bucket</text>
                    <text x="67.5" y="56" fill="#059669" fontSize="8" fontWeight="bold" textAnchor="middle">Incremental snapshots</text>
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

                {/* Brand New Stateful MSK & Flink SVG Diagram */}
                <div className="w-full h-[150px] rounded-xl border border-slate-200 p-1 mb-4 relative overflow-hidden flex items-center justify-center shadow-inner bg-slate-50">
                  <svg className="w-full h-full da-svg-bg" viewBox="0 0 540 150">
                    <defs>
                      <marker id="stream-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                      </marker>
                    </defs>

                    {/* Pathways */}
                    <path d="M 60 75 H 155" fill="none" stroke="#e9d5ff" strokeWidth="2.5" markerEnd="url(#stream-arrow)" />
                    <path d="M 235 75 H 335" fill="none" stroke="#cbd5e1" strokeWidth="2.5" markerEnd="url(#stream-arrow)" />

                    {/* Streaming flow animations */}
                    {flinkStreaming && (
                      <>
                        <path d="M 60 75 H 155" fill="none" stroke="#a855f7" strokeWidth="3" className="da-flow-purple" />
                        <path d="M 235 75 H 335" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-blue" />
                      </>
                    )}

                    {/* 1. Ingestion Source (Client Station) */}
                    <g transform="translate(10, 40)" className="da-node-btn">
                      <rect width="50" height="70" rx="8" fill="rgba(255, 255, 255, 0.95)" stroke="#64748b" strokeWidth="1.5" />
                      <circle cx="25" cy="20" r="10" fill="#f1f5f9" />
                      <text x="25" y="24" fill="#64748b" fontSize="12" textAnchor="middle">💳</text>
                      <text x="25" y="46" fill="#1e293b" fontSize="7.5" fontWeight="bold" textAnchor="middle">TX SOURCES</text>
                      <text x="25" y="56" fill={flinkStreaming ? '#059669' : '#64748b'} fontSize="6.5" fontWeight="bold" textAnchor="middle">
                        {flinkStreaming ? 'STREAMING' : 'PAUSED'}
                      </text>
                    </g>

                    {/* 2. Amazon MSK (Kafka) Brokers */}
                    <g transform="translate(155, 25)" className="da-node-btn">
                      <rect x="4" y="4" width="80" height="100" rx="8" fill="rgba(168, 85, 247, 0.1)" />
                      <rect width="80" height="100" rx="8" fill="rgba(253, 244, 255, 0.95)" stroke="#a855f7" strokeWidth="2" />
                      
                      {/* Topic Partition shelves */}
                      <rect x="6" y="6" width="68" height="18" rx="3" fill="#7e22ce" />
                      <text x="40" y="17.5" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">📦 KAFKA MSK</text>
                      
                      <rect x="8" y="32" width="64" height="15" rx="3" fill="#f3e8ff" stroke="#e9d5ff" strokeWidth="1" />
                      <text x="40" y="42" fill="#7e22ce" fontSize="7" fontWeight="bold" textAnchor="middle">Partition #0</text>
                      <circle cx="16" cy="39.5" r="2.5" fill={flinkStreaming ? '#a855f7' : '#94a3b8'} className={flinkStreaming ? 'pulse-circle' : ''} />

                      <rect x="8" y="53" width="64" height="15" rx="3" fill="#f3e8ff" stroke="#e9d5ff" strokeWidth="1" />
                      <text x="40" y="63" fill="#7e22ce" fontSize="7" fontWeight="bold" textAnchor="middle">Partition #1</text>

                      <rect x="8" y="74" width="64" height="15" rx="3" fill="#f3e8ff" stroke="#e9d5ff" strokeWidth="1" />
                      <text x="40" y="84" fill="#7e22ce" fontSize="7" fontWeight="bold" textAnchor="middle">Partition #2</text>
                    </g>

                    {/* 3. Stateful Apache Flink Engine */}
                    <g transform="translate(335, 20)" className="da-node-btn">
                      <rect x="4" y="4" width="185" height="110" rx="10" fill={flinkWindowSum > 4000 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'} />
                      <rect width="185" height="110" rx="10" fill="rgba(255, 255, 255, 0.95)" stroke={flinkWindowSum > 4000 ? '#ef4444' : '#10b981'} strokeWidth="2.5" />
                      
                      {/* Flink header */}
                      <rect x="8" y="8" width="169" height="18" rx="4" fill={flinkWindowSum > 4000 ? '#ef4444' : '#10b981'} />
                      <text x="92.5" y="20.5" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">🐿️ APACHE FLINK ENGINE</text>

                      {/* State status details */}
                      <text x="14" y="42" fill="#475569" fontSize="8" fontWeight="bold">Window Sum:</text>
                      <text x="95" y="42.5" fill={flinkWindowSum > 4000 ? '#dc2626' : '#059669'} fontSize="11" fontWeight="bold" fontFamily="monospace">${flinkWindowSum.toLocaleString()}</text>

                      <text x="14" y="58" fill="#475569" fontSize="8" fontWeight="bold">Events Count:</text>
                      <text x="95" y="58.5" fill="#1e293b" fontSize="10" fontWeight="bold" fontFamily="monospace">{flinkWindowCount}</text>

                      {/* Stateful window graphic */}
                      <rect x="8" y="70" width="169" height="32" rx="4" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5" />
                      
                      {flinkWindowSum > 4000 ? (
                        <>
                          <rect x="12" y="74" width="161" height="24" rx="3" fill="#fef2f2" stroke="#fca5a5" strokeWidth="1" />
                          <circle cx="24" cy="86" r="5" fill="#ef4444" className="pulse-circle" />
                          <circle cx="24" cy="86" r="4" fill="#ef4444" />
                          <text x="40" y="89" fill="#991b1b" fontSize="8" fontWeight="bold">🚨 FRAUD_SUSPECT LIMIT EXCEEDED</text>
                        </>
                      ) : (
                        <>
                          <rect x="12" y="74" width="161" height="24" rx="3" fill="#f0fdf4" stroke="#86efac" strokeWidth="1" />
                          <circle cx="24" cy="86" r="4" fill="#10b981" />
                          <text x="36" y="89" fill="#14532d" fontSize="7.5" fontWeight="bold">🟢 STREAM HEALTHY - STABLE TRANSACTIONS</text>
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
              <div className="w-full h-[280px] rounded-xl border border-slate-200 p-2 relative overflow-hidden flex items-center justify-center shadow-inner bg-slate-50">
                <svg className="w-full h-full max-w-[620px] da-svg-bg" viewBox="0 0 600 280">
                  {/* Connecting lines */}
                  {/* Top: Streaming */}
                  <path d="M 70 72.5 H 140" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  <path d="M 215 72.5 H 280" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  <path d="M 355 72.5 H 425" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />

                  {/* Bottom: Batch */}
                  <path d="M 70 197.5 H 140" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  <path d="M 215 197.5 H 280" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  <path d="M 355 197.5 H 425" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />

                  {/* Output Consumer links */}
                  <path d="M 480 72.5 V 133 H 410" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#aurora-arrow)" />
                  <path d="M 480 197.5 V 133 H 410" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#aurora-arrow)" />

                  {/* Flow glows */}
                  {sandboxState === 'ingesting' && (
                    <>
                      {ingestionType === 'streaming' && <path d="M 70 72.5 H 140" fill="none" stroke="#a855f7" strokeWidth="3" className="da-flow-purple" />}
                      {ingestionType === 'batch' && <path d="M 70 197.5 H 140" fill="none" stroke="#ea580c" strokeWidth="3" className="da-flow-orange" />}
                    </>
                  )}

                  {sandboxState === 'aggregating' && (
                    <>
                      {ingestionType === 'streaming' && <path d="M 215 72.5 H 280" fill="none" stroke="#a855f7" strokeWidth="3" className="da-flow-purple" />}
                      {ingestionType === 'batch' && <path d="M 215 197.5 H 280" fill="none" stroke="#ea580c" strokeWidth="3" className="da-flow-orange" />}
                    </>
                  )}

                  {sandboxState === 'storing' && (
                    <>
                      {ingestionType === 'streaming' && <path d="M 355 72.5 H 425" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />}
                      {ingestionType === 'batch' && <path d="M 355 197.5 H 425" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />}
                    </>
                  )}

                  {sandboxState === 'indexing' && (
                    <>
                      {ingestionType === 'streaming' && <path d="M 480 72.5 V 133 H 410" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-blue" />}
                      {ingestionType === 'batch' && <path d="M 355 197.5 H 425" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />}
                    </>
                  )}

                  {sandboxState === 'visualizing' && (
                    <>
                      {ingestionType === 'streaming' && <path d="M 480 72.5 V 133 H 410" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-blue" />}
                      {ingestionType === 'batch' && <path d="M 480 197.5 V 133 H 410" fill="none" stroke="#0ea5e9" strokeWidth="3" className="da-flow-blue" />}
                    </>
                  )}

                  {sandboxState === 'completed' && (
                    <>
                      <path d="M 480 72.5 V 133 H 410" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                      <path d="M 480 197.5 V 133 H 410" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                    </>
                  )}

                  {/* Input Nodes */}
                  <g transform="translate(10, 45)" className="da-node-btn">
                    <rect width="60" height="55" rx="8" fill="rgba(255, 255, 255, 0.95)" stroke="#64748b" strokeWidth="1.5" />
                    <rect x="4" y="4" width="52" height="15" rx="3" fill="#f1f5f9" />
                    <text x="30" y="14" fill="#1e293b" fontSize="7" fontWeight="bold" textAnchor="middle">📱 IoT SENSORS</text>
                    <text x="30" y="32" fill="#a855f7" fontSize="6.5" fontWeight="bold" textAnchor="middle">Real-Time</text>
                    <text x="30" y="44" fill="#64748b" fontSize="6" textAnchor="middle">Telemetry</text>
                  </g>

                  <g transform="translate(10, 170)" className="da-node-btn">
                    <rect width="60" height="55" rx="8" fill="rgba(255, 255, 255, 0.95)" stroke="#64748b" strokeWidth="1.5" />
                    <rect x="4" y="4" width="52" height="15" rx="3" fill="#f1f5f9" />
                    <text x="30" y="14" fill="#1e293b" fontSize="7" fontWeight="bold" textAnchor="middle">🛢️ APP LOGS</text>
                    <text x="30" y="32" fill="#ea580c" fontSize="6.5" fontWeight="bold" textAnchor="middle">Batch OLTP</text>
                    <text x="30" y="44" fill="#64748b" fontSize="6" textAnchor="middle">Server logs</text>
                  </g>

                  {/* Top path nodes */}
                  <g transform="translate(140, 40)" className="da-node-btn">
                    <rect x="3" y="3" width="75" height="65" rx="8" fill="rgba(168, 85, 247, 0.1)" />
                    <rect width="75" height="65" rx="8" fill="rgba(253, 244, 255, 0.95)" stroke="#a855f7" strokeWidth="2.5" />
                    <rect x="5" y="5" width="65" height="15" rx="3" fill="#faf5ff" stroke="#e9d5ff" strokeWidth="1" />
                    <text x="37.5" y="16" fill="#7e22ce" fontSize="8" fontWeight="bold" textAnchor="middle">⚡ KAFKA MSK</text>
                    <text x="37.5" y="36" fill="#581c87" fontSize="7" textAnchor="middle" fontWeight="semibold">Broker Cluster</text>
                    <rect x="8" y="46" width="59" height="11" rx="2.5" fill="#f3e8ff" />
                    <text x="37.5" y="54" fill="#7e22ce" fontSize="6" fontWeight="bold" textAnchor="middle">Serverless</text>
                  </g>

                  <g transform="translate(280, 40)" className="da-node-btn">
                    <rect x="3" y="3" width="75" height="65" rx="8" fill="rgba(168, 85, 247, 0.1)" />
                    <rect width="75" height="65" rx="8" fill="rgba(253, 244, 255, 0.95)" stroke="#a855f7" strokeWidth="2.5" />
                    <rect x="5" y="5" width="65" height="15" rx="3" fill="#faf5ff" stroke="#e9d5ff" strokeWidth="1" />
                    <text x="37.5" y="16" fill="#7e22ce" fontSize="8" fontWeight="bold" textAnchor="middle">⚙️ FLINK</text>
                    <text x="37.5" y="36" fill="#581c87" fontSize="7" textAnchor="middle" fontWeight="semibold">Stream Aggs</text>
                    <rect x="8" y="46" width="59" height="11" rx="2.5" fill="#f3e8ff" />
                    <text x="37.5" y="54" fill="#7e22ce" fontSize="6.5" fontWeight="bold" textAnchor="middle">Sliding Window</text>
                  </g>

                  {/* Bottom path nodes */}
                  <g transform="translate(140, 165)" className="da-node-btn">
                    <rect x="3" y="3" width="75" height="65" rx="8" fill="rgba(234, 88, 12, 0.1)" />
                    <rect width="75" height="65" rx="8" fill="rgba(255, 247, 237, 0.95)" stroke="#ea580c" strokeWidth="2.5" />
                    <rect x="5" y="5" width="65" height="15" rx="3" fill="#fff7ed" stroke="#ffedd5" strokeWidth="1" />
                    <text x="37.5" y="16" fill="#ea580c" fontSize="8" fontWeight="bold" textAnchor="middle">🪣 RAW S3</text>
                    <text x="37.5" y="36" fill="#c2410c" fontSize="7.5" textAnchor="middle" fontWeight="semibold">Ingest Buffer</text>
                    <rect x="8" y="46" width="59" height="11" rx="2.5" fill="#ffedd5" />
                    <text x="37.5" y="54.5" fill="#7c2d12" fontSize="6" fontWeight="bold" textAnchor="middle">Unstructured</text>
                  </g>

                  <g transform="translate(280, 165)" className="da-node-btn">
                    <rect x="3" y="3" width="75" height="65" rx="8" fill="rgba(234, 88, 12, 0.1)" />
                    <rect width="75" height="65" rx="8" fill="rgba(255, 247, 237, 0.95)" stroke="#ea580c" strokeWidth="2.5" />
                    <rect x="5" y="5" width="65" height="15" rx="3" fill="#fff7ed" stroke="#ffedd5" strokeWidth="1" />
                    <text x="37.5" y="16" fill="#ea580c" fontSize="8" fontWeight="bold" textAnchor="middle">⚙️ GLUE SPARK</text>
                    <text x="37.5" y="36" fill="#c2410c" fontSize="7.5" textAnchor="middle" fontWeight="semibold">Batch Spark ETL</text>
                    <rect x="8" y="46" width="59" height="11" rx="2.5" fill="#ffedd5" />
                    <text x="37.5" y="54.5" fill="#7c2d12" fontSize="6" fontWeight="bold" textAnchor="middle">Parquet Convert</text>
                  </g>

                  {/* Central Destination Nodes */}
                  <g transform="translate(425, 30)" className="da-node-btn">
                    <ellipse cx="60" cy="65" rx="50" ry="10" fill="rgba(22, 163, 74, 0.15)" />
                    <path d="M 10 15 V 55 A 50 10 0 0 0 110 55 V 15 Z" fill="rgba(240, 253, 244, 0.95)" stroke="#16a34a" strokeWidth="2.5" />
                    <ellipse cx="60" cy="15" rx="50" ry="10" fill="#dcfce7" stroke="#16a34a" strokeWidth="2.5" />
                    <path d="M 10 26 A 50 8 0 0 0 110 26" fill="none" stroke="#86efac" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="60" y="24" fill="#15803d" fontSize="9.5" fontWeight="bold" textAnchor="middle">🪣 DATA LAKE S3</text>
                    <text x="60" y="42" fill="#166534" fontSize="7.5" textAnchor="middle" fontWeight="semibold">Refined Parquet</text>
                    <text x="60" y="53" fill="#059669" fontSize="7" fontWeight="bold" textAnchor="middle">dw-backups-bucket</text>
                  </g>

                  <g transform="translate(425, 170)" className="da-node-btn">
                    <rect x="4" y="4" width="115" height="70" rx="8" fill="rgba(22, 163, 74, 0.1)" />
                    <rect width="115" height="70" rx="8" fill="rgba(240, 253, 244, 0.95)" stroke="#16a34a" strokeWidth="2.5" />
                    <rect x="6" y="6" width="103" height="15" rx="3" fill="#dcfce7" stroke="#86efac" strokeWidth="1" />
                    <text x="57.5" y="16.5" fill="#15803d" fontSize="8" fontWeight="bold" textAnchor="middle">📖 GLUE CATALOG</text>
                    <text x="57.5" y="38" fill="#166534" fontSize="7.5" textAnchor="middle" fontWeight="semibold">Centralized Metadata</text>
                    <text x="57.5" y="52" fill="#059669" fontSize="7" textAnchor="middle">Lake Formation Scopes</text>
                  </g>

                  {/* Output Consumer Nodes */}
                  <g transform="translate(280, 107)" className="da-node-btn">
                    <rect x="3" y="3" width="130" height="52" rx="6" fill="rgba(59, 130, 246, 0.1)" />
                    <rect width="130" height="52" rx="6" fill="rgba(239, 246, 255, 0.95)" stroke="#3b82f6" strokeWidth="2" />
                    <text x="65" y="18" fill="#1d4ed8" fontSize="8.5" fontWeight="bold" textAnchor="middle">📊 QUICKSIGHT (BI)</text>
                    <text x="65" y="32" fill="#1e40af" fontSize="7.5" textAnchor="middle" fontWeight="semibold">SPICE Caching Engine</text>
                    <text x="65" y="44" fill="#059669" fontSize="7" fontWeight="bold" textAnchor="middle">Sub-second Visuals</text>
                  </g>

                  <g transform="translate(130, 107)" className="da-node-btn">
                    <rect x="3" y="3" width="130" height="52" rx="6" fill="rgba(59, 130, 246, 0.1)" />
                    <rect width="130" height="52" rx="6" fill="rgba(239, 246, 255, 0.95)" stroke="#3b82f6" strokeWidth="2" />
                    <text x="65" y="18" fill="#1d4ed8" fontSize="8.5" fontWeight="bold" textAnchor="middle">🔎 OPENSEARCH CLUSTER</text>
                    <text x="65" y="32" fill="#1e40af" fontSize="7.5" textAnchor="middle" fontWeight="semibold">Master / Data Nodes</text>
                    <text x="65" y="44" fill="#475569" fontSize="6.5" textAnchor="middle">Shard partitions &amp; indexes</text>
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
