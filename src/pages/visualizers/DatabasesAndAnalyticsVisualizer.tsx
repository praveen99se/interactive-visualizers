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
                      <rect width="65" height="80" rx="8" fill="rgba(255, 255, 255, 0.95)" stroke="#64748b" strokeWidth="1.5" />
                      <rect x="4" y="4" width="57" height="30" rx="4" fill="#f1f5f9" />
                      <text x="32.5" y="22" fill="#1e293b" fontSize="9.5" fontWeight="bold" textAnchor="middle">📱 CLIENT</text>
                      <text x="32.5" y="52" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">SQL Query</text>
                      <text x="32.5" y="66" fill="#64748b" fontSize="7" textAnchor="middle">Select *</text>
                    </g>

                    <g transform="translate(135, 55)" className="da-node-btn">
                      <rect x="3" y="3" width="122" height="117" rx="8" fill="rgba(59, 130, 246, 0.1)" />
                      <rect width="122" height="117" rx="8" fill="rgba(239, 246, 255, 0.95)" stroke="#3b82f6" strokeWidth="2.5" />
                      <rect x="6" y="6" width="110" height="26" rx="4" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="1" />
                      <text x="61" y="22" fill="#1d4ed8" fontSize="10" fontWeight="bold" textAnchor="middle">🔍 COORDINATOR</text>
                      <text x="61" y="48" fill="#1e40af" fontSize="8.5" textAnchor="middle" fontWeight="semibold">Parses SQL Query</text>
                      <text x="61" y="64" fill="#0d9488" fontSize="8.5" fontWeight="bold" textAnchor="middle">Checks Glue Catalog</text>
                      <rect x="12" y="78" width="98" height="18" rx="3.5" fill="#ccfbf1" />
                      <text x="61" y="90" fill="#0d9488" fontSize="8" fontWeight="bold" textAnchor="middle">Task Optimizer</text>
                    </g>

                    {/* Workers */}
                    <g transform="translate(325, 20)" className="da-node-btn">
                      <rect width="95" height="55" rx="6" fill="rgba(248, 250, 252, 0.95)" stroke="#64748b" strokeWidth="1.5" />
                      <rect x="4" y="4" width="87" height="16" rx="3" fill="#f1f5f9" />
                      <circle cx="12" cy="12" r="3.5" fill="#10b981" />
                      <text x="51" y="15" fill="#475569" fontSize="9" fontWeight="bold" textAnchor="middle">👷 Worker #1</text>
                      <text x="47" y="40" fill="#64748b" fontSize="8" textAnchor="middle" fontWeight="semibold">Scan Partition A</text>
                    </g>
                    <g transform="translate(325, 92)" className="da-node-btn">
                      <rect width="95" height="55" rx="6" fill="rgba(248, 250, 252, 0.95)" stroke="#64748b" strokeWidth="1.5" />
                      <rect x="4" y="4" width="87" height="16" rx="3" fill="#f1f5f9" />
                      <circle cx="12" cy="12" r="3.5" fill="#10b981" />
                      <text x="51" y="15" fill="#475569" fontSize="9" fontWeight="bold" textAnchor="middle">👷 Worker #2</text>
                      <text x="47" y="40" fill="#64748b" fontSize="8" textAnchor="middle" fontWeight="semibold">Scan Partition B</text>
                    </g>
                    <g transform="translate(325, 164)" className="da-node-btn">
                      <rect width="95" height="55" rx="6" fill="rgba(248, 250, 252, 0.95)" stroke="#64748b" strokeWidth="1.5" />
                      <rect x="4" y="4" width="87" height="16" rx="3" fill="#f1f5f9" />
                      <circle cx="12" cy="12" r="3.5" fill="#10b981" />
                      <text x="51" y="15" fill="#475569" fontSize="9" fontWeight="bold" textAnchor="middle">👷 Worker #3</text>
                      <text x="47" y="40" fill="#64748b" fontSize="8" textAnchor="middle" fontWeight="semibold">Scan Partition C</text>
                    </g>

                    {/* S3 Lake */}
                    <g transform="translate(460, 65)" className="da-node-btn">
                      <ellipse cx="32" cy="75" rx="30" ry="9" fill="rgba(22, 163, 74, 0.15)" />
                      <path d="M 2 20 V 75 A 30 9 0 0 0 62 75 V 20 Z" fill="rgba(240, 253, 244, 0.95)" stroke="#16a34a" strokeWidth="2" />
                      <ellipse cx="32" cy="20" rx="30" ry="9" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
                      <path d="M 2 34 A 30 8 0 0 0 62 34" fill="none" stroke="#86efac" strokeWidth="1" strokeDasharray="3 3" />
                      <path d="M 2 48 A 30 8 0 0 0 62 48" fill="none" stroke="#86efac" strokeWidth="1.2" />
                      
                      <text x="32" y="32" fill="#15803d" fontSize="12" fontWeight="bold" textAnchor="middle">🪣 S3</text>
                      <text x="32" y="56" fill="#166534" fontSize="9" textAnchor="middle" fontWeight="bold">Parquet</text>
                      <text x="32" y="66" fill="#166534" fontSize="8.5" textAnchor="middle">Lake</text>
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
                      <rect width="70" height="50" rx="8" fill="rgba(240, 253, 244, 0.95)" stroke="#16a34a" strokeWidth="1.5" />
                      <text x="35" y="22" fill="#15803d" fontSize="10.5" fontWeight="bold" textAnchor="middle">🪣 S3</text>
                      <text x="35" y="38" fill="#166534" fontSize="8" textAnchor="middle">Results Storage</text>
                    </g>

                    <g transform="translate(170, 25)" className="da-node-btn">
                      <rect width="110" height="65" rx="8" fill="rgba(239, 246, 255, 0.95)" stroke="#3b82f6" strokeWidth="2.5" />
                      <text x="55" y="24" fill="#1d4ed8" fontSize="11" fontWeight="bold" textAnchor="middle">🔍 ATHENA</text>
                      <text x="55" y="44" fill="#1e40af" fontSize="8.5" textAnchor="middle">Federated Query</text>
                      <text x="55" y="54" fill="#475569" fontSize="7.5" textAnchor="middle" fontWeight="bold">Distributor Engine</text>
                    </g>

                    <g transform="translate(195, 125)" className="da-node-btn">
                      <circle cx="25" cy="25" r="28" fill="rgba(255, 247, 237, 0.95)" stroke="#ea580c" strokeWidth="2" />
                      <circle cx="25" cy="25" r="28" fill="none" stroke="#ea580c" strokeWidth="1.5" className={federatedState === 'fetching' ? 'pulse-circle' : ''} />
                      <text x="25" y="31" fill="#ea580c" fontSize="18" fontWeight="bold" textAnchor="middle">λ</text>
                      <text x="25" y="46" fill="#ea580c" fontSize="6.5" fontWeight="bold" textAnchor="middle">CONNECTOR</text>
                    </g>

                    <g transform="translate(10, 120)" className="da-node-btn">
                      <rect width="75" height="40" rx="5" fill={federatedDb === 'dynamodb' ? '#ffedd5' : '#ffffff'} stroke={federatedDb === 'dynamodb' ? '#ea580c' : '#cbd5e1'} strokeWidth="1.5" />
                      <text x="37.5" y="24" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">⚡ DynamoDB</text>
                    </g>
                    <g transform="translate(10, 185)" className="da-node-btn">
                      <rect width="75" height="40" rx="5" fill={federatedDb === 'rds-aurora' ? '#dcfce7' : '#ffffff'} stroke={federatedDb === 'rds-aurora' ? '#16a34a' : '#cbd5e1'} strokeWidth="1.5" />
                      <text x="37.5" y="24" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">🛢️ RDS Aurora</text>
                    </g>
                    
                    <g transform="translate(370, 140)" className="da-node-btn">
                      <rect width="80" height="40" rx="5" fill={federatedDb === 'elasticache' || federatedDb === 'emr-hbase' ? '#eff6ff' : '#ffffff'} stroke={federatedDb === 'elasticache' || federatedDb === 'emr-hbase' ? '#3b82f6' : '#cbd5e1'} strokeWidth="1.5" />
                      <text x="40" y="24" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">
                        {federatedDb === 'emr-hbase' ? '📦 HBase EMR' : '🔌 Redis Cache'}
                      </text>
                    </g>

                    <g transform="translate(380, 185)" className="da-node-btn">
                      <rect width="85" height="40" rx="5" fill={federatedDb === 'documentdb' || federatedDb === 'on-prem' ? '#fdf4ff' : '#ffffff'} stroke={federatedDb === 'documentdb' || federatedDb === 'on-prem' ? '#a855f7' : '#cbd5e1'} strokeWidth="1.5" />
                      <text x="42.5" y="24" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">
                        {federatedDb === 'on-prem' ? '🏢 On-Prem DB' : '🗄️ DocumentDB'}
                      </text>
                    </g>

                    <g transform="translate(445, 120)" className="da-node-btn">
                      <rect width="75" height="40" rx="5" fill={federatedDb === 'redshift' ? '#f0f9ff' : '#ffffff'} stroke={federatedDb === 'redshift' ? '#0ea5e9' : '#cbd5e1'} strokeWidth="1.5" />
                      <text x="37.5" y="24" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">⚡ Redshift DW</text>
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
                      <rect width="40" height="60" rx="6" fill="rgba(255, 255, 255, 0.95)" stroke="#64748b" strokeWidth="1.5" />
                      <rect x="3" y="3" width="34" height="18" rx="3" fill="#f1f5f9" />
                      <text x="20" y="14" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">📱 CLIENT</text>
                      <text x="20" y="35" fill="#64748b" fontSize="6.5" textAnchor="middle">BI Tool</text>
                      <text x="20" y="45" fill="#0284c7" fontSize="6" fontWeight="bold" textAnchor="middle">JDBC/ODBC</text>
                    </g>

                    {/* Leader Node */}
                    <g transform="translate(95, 65)" className="da-node-btn">
                      <rect width="85" height="90" rx="8" fill="rgba(239, 246, 255, 0.95)" stroke="#3b82f6" strokeWidth="2" />
                      {redshiftMppState === 'leader-plan' && (
                        <rect width="85" height="90" rx="8" fill="none" stroke="#3b82f6" strokeWidth="2.5" className="pulse-border" />
                      )}
                      
                      <rect x="5" y="5" width="75" height="15" rx="3" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5" />
                      <text x="42.5" y="15" fill="#1d4ed8" fontSize="8" fontWeight="extrabold" textAnchor="middle">👑 LEADER NODE</text>
                      
                      <text x="42.5" y="35" fill="#1e40af" fontSize="6.5" textAnchor="middle" fontWeight="bold">Plan Compiler</text>
                      <text x="42.5" y="47" fill="#0891b2" fontSize="6.5" textAnchor="middle">Task Optimizer</text>
                      
                      {/* Mini state visualization banner */}
                      <rect x="8" y="58" width="69" height="24" rx="3" fill="#f8fafc" stroke="#e2e8f0" />
                      <text x="42.5" y="67" fill="#475569" fontSize="6.5" fontWeight="bold" textAnchor="middle">STAGE:</text>
                      <text x="42.5" y="77" fill="#0369a1" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                        {redshiftMppState.toUpperCase()}
                      </text>
                    </g>

                    {/* Compute Node #1 */}
                    <g transform="translate(225, 10)" className="da-node-btn">
                      <rect width="110" height="80" rx="6" fill="rgba(253, 244, 255, 0.95)" stroke="#a855f7" strokeWidth="2" />
                      {redshiftMppState === 'compute-scan' && (
                        <rect width="110" height="80" rx="6" fill="none" stroke="#a855f7" strokeWidth="2" className="pulse-border" />
                      )}
                      <rect x="4" y="4" width="102" height="13" rx="2" fill="#6b21a8" />
                      <text x="55" y="13" fill="#ffffff" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">👷 COMPUTE NODE #1</text>
                      
                      <text x="55" y="30" fill="#7e22ce" fontSize="7" fontWeight="bold" textAnchor="middle">Slice A: Columnar SSD</text>
                      
                      {/* Columnar Data Scanning blocks visual representation */}
                      <g transform="translate(8, 38)">
                        {/* Category column */}
                        <rect x="5" y="2" width="18" height="8" rx="1.5" fill={redshiftQuery !== 'user-join' && redshiftMppState === 'compute-scan' ? '#10b981' : '#cbd5e1'} />
                        <rect x="5" y="12" width="18" height="8" rx="1.5" fill={redshiftQuery !== 'user-join' && redshiftMppState === 'compute-scan' ? '#10b981' : '#cbd5e1'} />
                        <rect x="5" y="22" width="18" height="8" rx="1.5" fill={redshiftQuery !== 'user-join' && redshiftMppState === 'compute-scan' ? '#10b981' : '#cbd5e1'} />
                        <text x="14" y="32" fill="#6b21a8" fontSize="5.5" fontWeight="bold" textAnchor="middle">Cat</text>

                        {/* Revenue column */}
                        <rect x="30" y="2" width="20" height="8" rx="1.5" fill={redshiftQuery === 'sales-sum' && redshiftMppState === 'compute-scan' ? '#3b82f6' : '#cbd5e1'} />
                        <rect x="30" y="12" width="20" height="8" rx="1.5" fill={redshiftQuery === 'sales-sum' && redshiftMppState === 'compute-scan' ? '#3b82f6' : '#cbd5e1'} />
                        <rect x="30" y="22" width="20" height="8" rx="1.5" fill={redshiftQuery === 'sales-sum' && redshiftMppState === 'compute-scan' ? '#3b82f6' : '#cbd5e1'} />
                        <text x="40" y="32" fill="#6b21a8" fontSize="5.5" fontWeight="bold" textAnchor="middle">Rev</text>

                        {/* Unused column */}
                        <rect x="58" y="2" width="30" height="8" rx="1.5" fill={redshiftQuery === 'user-join' && redshiftMppState === 'compute-scan' ? '#3b82f6' : '#cbd5e1'} />
                        <rect x="58" y="12" width="30" height="8" rx="1.5" fill={redshiftQuery === 'user-join' && redshiftMppState === 'compute-scan' ? '#3b82f6' : '#cbd5e1'} />
                        <rect x="58" y="22" width="30" height="8" rx="1.5" fill={redshiftQuery === 'user-join' && redshiftMppState === 'compute-scan' ? '#3b82f6' : '#cbd5e1'} />
                        <text x="73" y="32" fill="#6b21a8" fontSize="5.5" fontWeight="bold" textAnchor="middle">User/Reg</text>
                      </g>
                    </g>

                    {/* Compute Node #2 */}
                    <g transform="translate(225, 110)" className="da-node-btn">
                      <rect width="110" height="80" rx="6" fill="rgba(253, 244, 255, 0.95)" stroke="#a855f7" strokeWidth="2" />
                      {redshiftMppState === 'compute-scan' && (
                        <rect width="110" height="80" rx="6" fill="none" stroke="#a855f7" strokeWidth="2" className="pulse-border" />
                      )}
                      <rect x="4" y="4" width="102" height="13" rx="2" fill="#6b21a8" />
                      <text x="55" y="13" fill="#ffffff" fontSize="7.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle">👷 COMPUTE NODE #2</text>
                      
                      <text x="55" y="30" fill="#7e22ce" fontSize="7" fontWeight="bold" textAnchor="middle">Slice B: Columnar SSD</text>
                      
                      {/* Columnar Data Scanning blocks visual representation */}
                      <g transform="translate(8, 38)">
                        {/* Category column */}
                        <rect x="5" y="2" width="18" height="8" rx="1.5" fill={redshiftQuery !== 'user-join' && redshiftMppState === 'compute-scan' ? '#10b981' : '#cbd5e1'} />
                        <rect x="5" y="12" width="18" height="8" rx="1.5" fill={redshiftQuery !== 'user-join' && redshiftMppState === 'compute-scan' ? '#10b981' : '#cbd5e1'} />
                        <rect x="5" y="22" width="18" height="8" rx="1.5" fill={redshiftQuery !== 'user-join' && redshiftMppState === 'compute-scan' ? '#10b981' : '#cbd5e1'} />
                        <text x="14" y="32" fill="#6b21a8" fontSize="5.5" fontWeight="bold" textAnchor="middle">Cat</text>

                        {/* Revenue column */}
                        <rect x="30" y="2" width="20" height="8" rx="1.5" fill={redshiftQuery === 'sales-sum' && redshiftMppState === 'compute-scan' ? '#3b82f6' : '#cbd5e1'} />
                        <rect x="30" y="12" width="20" height="8" rx="1.5" fill={redshiftQuery === 'sales-sum' && redshiftMppState === 'compute-scan' ? '#3b82f6' : '#cbd5e1'} />
                        <rect x="30" y="22" width="20" height="8" rx="1.5" fill={redshiftQuery === 'sales-sum' && redshiftMppState === 'compute-scan' ? '#3b82f6' : '#cbd5e1'} />
                        <text x="40" y="32" fill="#6b21a8" fontSize="5.5" fontWeight="bold" textAnchor="middle">Rev</text>

                        {/* Unused column */}
                        <rect x="58" y="2" width="30" height="8" rx="1.5" fill={redshiftQuery === 'user-join' && redshiftMppState === 'compute-scan' ? '#3b82f6' : '#cbd5e1'} />
                        <rect x="58" y="12" width="30" height="8" rx="1.5" fill={redshiftQuery === 'user-join' && redshiftMppState === 'compute-scan' ? '#3b82f6' : '#cbd5e1'} />
                        <rect x="58" y="22" width="30" height="8" rx="1.5" fill={redshiftQuery === 'user-join' && redshiftMppState === 'compute-scan' ? '#3b82f6' : '#cbd5e1'} />
                        <text x="73" y="32" fill="#6b21a8" fontSize="5.5" fontWeight="bold" textAnchor="middle">User/Reg</text>
                      </g>
                    </g>

                    {/* External S3 Data Lake (Redshift Spectrum) */}
                    <g transform="translate(385, 60)" className="da-node-btn">
                      <ellipse cx="30" cy="65" rx="25" ry="8" fill="rgba(22, 163, 74, 0.15)" />
                      <path d="M 5 20 V 65 A 25 8 0 0 0 55 65 V 20 Z" fill="rgba(240, 253, 244, 0.95)" stroke="#16a34a" strokeWidth="2" />
                      <ellipse cx="30" cy="20" rx="25" ry="8" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
                      <path d="M 5 32 A 25 6 0 0 0 55 32" fill="none" stroke="#86efac" strokeWidth="1" strokeDasharray="3 3" />
                      <path d="M 5 45 A 25 6 0 0 0 55 45" fill="none" stroke="#86efac" strokeWidth="1.5" />
                      <text x="30" y="32" fill="#15803d" fontSize="9" fontWeight="bold" textAnchor="middle">🪣 S3</text>
                      <text x="30" y="55" fill="#166534" fontSize="6.5" fontWeight="bold" textAnchor="middle">Spectrum Lake</text>
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
                    <text x="42.5" y="21" fill="#1d4ed8" fontSize="9" fontWeight="bold" textAnchor="middle">👑 LEADER NODE</text>
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

              <div className="w-full h-[330px] rounded-xl border border-slate-200 p-2 relative overflow-hidden flex items-center justify-center shadow-inner bg-slate-50">
                <svg className="w-full h-full max-w-[620px] da-svg-bg" viewBox="0 0 650 320">
                  {/* Connecting lines */}
                  {/* Top: Streaming */}
                  <path d="M 95 87.5 H 145" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  <path d="M 240 87.5 H 290" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  <path d="M 385 87.5 H 450" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />

                  {/* Bottom: Batch */}
                  <path d="M 95 240 H 145" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  <path d="M 240 237.5 H 290" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />
                  <path d="M 385 237.5 H 450" fill="none" stroke="#cbd5e1" strokeWidth="2" markerEnd="url(#aurora-arrow)" />

                  {/* Output Consumer links */}
                  <path d="M 570 87.5 V 163 H 440" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#aurora-arrow)" />
                  <path d="M 575 240 V 163 H 440" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#aurora-arrow)" />

                  {/* Flow glows */}
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
                  <g transform="translate(15, 55)" className="da-node-btn">
                    <rect width="80" height="70" rx="8" fill="rgba(255, 255, 255, 0.95)" stroke="#64748b" strokeWidth="1.5" />
                    <rect x="4" y="4" width="72" height="18" rx="3" fill="#f1f5f9" />
                    <text x="40" y="16.5" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">📱 IoT SENSORS</text>
                    <text x="40" y="38" fill="#a855f7" fontSize="8" fontWeight="bold" textAnchor="middle">Real-Time</text>
                    <text x="40" y="52" fill="#64748b" fontSize="7.5" textAnchor="middle">Telemetry Data</text>
                  </g>

                  <g transform="translate(15, 205)" className="da-node-btn">
                    <rect width="80" height="70" rx="8" fill="rgba(255, 255, 255, 0.95)" stroke="#64748b" strokeWidth="1.5" />
                    <rect x="4" y="4" width="72" height="18" rx="3" fill="#f1f5f9" />
                    <text x="40" y="16.5" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">🛢️ APP LOGS</text>
                    <text x="40" y="38" fill="#ea580c" fontSize="8" fontWeight="bold" textAnchor="middle">Batch OLTP</text>
                    <text x="40" y="52" fill="#64748b" fontSize="7.5" textAnchor="middle">Server Activity</text>
                  </g>

                  {/* Top path nodes */}
                  <g transform="translate(145, 50)" className="da-node-btn">
                    <rect x="3" y="3" width="95" height="75" rx="8" fill="rgba(168, 85, 247, 0.1)" />
                    <rect width="95" height="75" rx="8" fill="rgba(253, 244, 255, 0.95)" stroke="#a855f7" strokeWidth="2.5" />
                    <rect x="5" y="5" width="85" height="18" rx="3" fill="#faf5ff" stroke="#e9d5ff" strokeWidth="1" />
                    <text x="47.5" y="18" fill="#7e22ce" fontSize="9" fontWeight="bold" textAnchor="middle">⚡ KAFKA MSK</text>
                    <text x="47.5" y="42" fill="#581c87" fontSize="8" textAnchor="middle" fontWeight="semibold">Broker Cluster</text>
                    <rect x="12" y="52" width="71" height="13" rx="2.5" fill="#f3e8ff" />
                    <text x="47.5" y="61" fill="#7e22ce" fontSize="7" fontWeight="bold" textAnchor="middle">Serverless Shards</text>
                  </g>

                  <g transform="translate(290, 50)" className="da-node-btn">
                    <rect x="3" y="3" width="95" height="75" rx="8" fill="rgba(168, 85, 247, 0.1)" />
                    <rect width="95" height="75" rx="8" fill="rgba(253, 244, 255, 0.95)" stroke="#a855f7" strokeWidth="2.5" />
                    <rect x="5" y="5" width="85" height="18" rx="3" fill="#faf5ff" stroke="#e9d5ff" strokeWidth="1" />
                    <text x="47.5" y="18" fill="#7e22ce" fontSize="9" fontWeight="bold" textAnchor="middle">⚙️ FLINK</text>
                    <text x="47.5" y="42" fill="#581c87" fontSize="8" textAnchor="middle" fontWeight="semibold">Stream Aggs</text>
                    <rect x="12" y="52" width="71" height="13" rx="2.5" fill="#f3e8ff" />
                    <text x="47.5" y="61.5" fill="#7e22ce" fontSize="7" fontWeight="bold" textAnchor="middle">Sliding Window</text>
                  </g>

                  {/* Bottom path nodes */}
                  <g transform="translate(145, 200)" className="da-node-btn">
                    <rect x="3" y="3" width="95" height="75" rx="8" fill="rgba(234, 88, 12, 0.1)" />
                    <rect width="95" height="75" rx="8" fill="rgba(255, 247, 237, 0.95)" stroke="#ea580c" strokeWidth="2.5" />
                    <rect x="5" y="5" width="85" height="18" rx="3" fill="#fff7ed" stroke="#ffedd5" strokeWidth="1" />
                    <text x="47.5" y="18" fill="#ea580c" fontSize="9" fontWeight="bold" textAnchor="middle">🪣 RAW S3</text>
                    <text x="47.5" y="42" fill="#c2410c" fontSize="8" textAnchor="middle" fontWeight="semibold">Ingest Buffer</text>
                    <rect x="12" y="52" width="71" height="13" rx="2.5" fill="#ffedd5" />
                    <text x="47.5" y="61.5" fill="#7c2d12" fontSize="7" fontWeight="bold" textAnchor="middle">Unstructured</text>
                  </g>

                  <g transform="translate(290, 200)" className="da-node-btn">
                    <rect x="3" y="3" width="95" height="75" rx="8" fill="rgba(234, 88, 12, 0.1)" />
                    <rect width="95" height="75" rx="8" fill="rgba(255, 247, 237, 0.95)" stroke="#ea580c" strokeWidth="2.5" />
                    <rect x="5" y="5" width="85" height="18" rx="3" fill="#fff7ed" stroke="#ffedd5" strokeWidth="1" />
                    <text x="47.5" y="18" fill="#ea580c" fontSize="9" fontWeight="bold" textAnchor="middle">⚙️ GLUE SPARK</text>
                    <text x="47.5" y="42" fill="#c2410c" fontSize="8" textAnchor="middle" fontWeight="semibold">Batch Spark ETL</text>
                    <rect x="12" y="52" width="71" height="13" rx="2.5" fill="#ffedd5" />
                    <text x="47.5" y="61.5" fill="#7c2d12" fontSize="7" fontWeight="bold" textAnchor="middle">Parquet Convert</text>
                  </g>

                  {/* Central Destination Nodes */}
                  <g transform="translate(440, 40)" className="da-node-btn">
                    <ellipse cx="70" cy="75" rx="60" ry="12" fill="rgba(22, 163, 74, 0.15)" />
                    <path d="M 10 20 V 75 A 60 12 0 0 0 130 75 V 20 Z" fill="rgba(240, 253, 244, 0.95)" stroke="#16a34a" strokeWidth="2.5" />
                    <ellipse cx="70" cy="20" rx="60" ry="12" fill="#dcfce7" stroke="#16a34a" strokeWidth="2.5" />
                    <path d="M 10 32 A 60 10 0 0 0 130 32" fill="none" stroke="#86efac" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="70" y="30" fill="#15803d" fontSize="11" fontWeight="bold" textAnchor="middle">🪣 DATA LAKE S3</text>
                    <text x="70" y="52" fill="#166534" fontSize="9" textAnchor="middle" fontWeight="semibold">Refined Parquet</text>
                    <text x="70" y="65" fill="#059669" fontSize="8.5" fontWeight="bold" textAnchor="middle">dw-backups-bucket</text>
                  </g>

                  <g transform="translate(440, 200)" className="da-node-btn">
                    <rect x="4" y="4" width="135" height="80" rx="8" fill="rgba(22, 163, 74, 0.1)" />
                    <rect width="135" height="80" rx="8" fill="rgba(240, 253, 244, 0.95)" stroke="#16a34a" strokeWidth="2.5" />
                    <rect x="6" y="6" width="123" height="18" rx="3" fill="#dcfce7" stroke="#86efac" strokeWidth="1" />
                    <text x="67.5" y="19" fill="#15803d" fontSize="9" fontWeight="bold" textAnchor="middle">📖 GLUE CATALOG</text>
                    <text x="67.5" y="44" fill="#166534" fontSize="8.5" textAnchor="middle" fontWeight="semibold">Centralized Metadata</text>
                    <text x="67.5" y="60" fill="#059669" fontSize="8" textAnchor="middle">Lake Formation Scopes</text>
                  </g>

                  {/* Output Consumer Nodes */}
                  <g transform="translate(290, 133)" className="da-node-btn">
                    <rect x="3" y="3" width="150" height="60" rx="6" fill="rgba(59, 130, 246, 0.1)" />
                    <rect width="150" height="60" rx="6" fill="rgba(239, 246, 255, 0.95)" stroke="#3b82f6" strokeWidth="2" />
                    <text x="75" y="20.5" fill="#1d4ed8" fontSize="9.5" fontWeight="bold" textAnchor="middle">📊 QUICKSIGHT (BI)</text>
                    <text x="75" y="36" fill="#1e40af" fontSize="8.5" textAnchor="middle" fontWeight="semibold">SPICE Caching Engine</text>
                    <text x="75" y="49" fill="#059669" fontSize="8" fontWeight="bold" textAnchor="middle">Sub-second Visuals</text>
                  </g>

                  <g transform="translate(135, 133)" className="da-node-btn">
                    <rect x="3" y="3" width="150" height="60" rx="6" fill="rgba(59, 130, 246, 0.1)" />
                    <rect width="150" height="60" rx="6" fill="rgba(239, 246, 255, 0.95)" stroke="#3b82f6" strokeWidth="2" />
                    <text x="75" y="20.5" fill="#1d4ed8" fontSize="9.5" fontWeight="bold" textAnchor="middle">🔎 OPENSEARCH CLUSTER</text>
                    <text x="75" y="36" fill="#1e40af" fontSize="8.5" textAnchor="middle" fontWeight="semibold">Master / Data Nodes</text>
                    <text x="75" y="49" fill="#475569" fontSize="8" textAnchor="middle">Shard partitions &amp; indexes</text>
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
