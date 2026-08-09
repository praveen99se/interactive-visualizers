import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Shield,
  Activity,
  ChevronRight,
  ChevronDown,
  Info,
  Check,
  Copy,
  Cpu,
  Network
} from 'lucide-react';
import AuroraComparativeView from '../../components/visualizers/AuroraComparativeView';
import UniqueAuroraFeatures from '../../components/visualizers/UniqueAuroraFeatures';

type TabType = 'overview' | 'endpoints' | 'failover' | 'global' | 'serverless' | 'cloning' | 'hardening' | 'notebook' | 'unique';

interface SecItem {
  label: string;
  done: boolean;
}

// Provider-specific Terraform Infrastructure Snippets
const terraformAuroraClusterCode = `resource "aws_rds_cluster" "aurora_db" {
  cluster_identifier      = "aurora-production-cluster"
  engine                  = "aurora-postgresql"
  engine_version          = "15.4"
  database_name           = "aurora_academy"
  master_username         = "db_admin"
  master_password         = var.db_password
  backup_retention_period = 7
  preferred_backup_window = "02:00-03:00"
  
  # Shared Storage is automatic - no EBS volume allocations needed!
  storage_encrypted   = true
  deletion_protection = true

  # Enable Built-in Machine Learning Integrations
  enable_local_write_double_buffer = false # Double buffering not needed for Aurora
}

resource "aws_rds_cluster_instance" "cluster_instances" {
  count               = 3
  identifier          = "aurora-node-\${count.index}"
  cluster_identifier  = aws_rds_cluster.aurora_db.id
  instance_class      = "db.r6g.xlarge"
  engine              = aws_rds_cluster.aurora_db.engine
  engine_version      = aws_rds_cluster.aurora_db.engine_version

  # Priority failover tier: counts[0] promoted first
  promotion_tier      = count.index
  publicly_accessible = false
}`;

const terraformAzureHyperscaleCode = `resource "azurerm_mssql_server" "sql_server" {
  name                         = "sql-hyperscale-prod"
  resource_group_name          = azurerm_resource_group.rg.name
  location                     = "East US"
  version                      = "12.0"
  administrator_login          = "db_admin"
  administrator_login_password = var.db_password
}

resource "azurerm_mssql_database" "hyperscale_db" {
  name           = "hyperscale_academy"
  server_id      = azurerm_mssql_server.sql_server.id
  sku_name       = "HS_Gen5_4" # Azure SQL Hyperscale Tier
  max_size_gb    = 1024
  read_scale     = true
  zone_redundant = true

  # Multi-tier Page Server & RBPEX SSD cache storage configuration
  short_term_backup_retention_policy {
    retention_days = 7
  }
}`;

const terraformGcpAlloyDbCode = `resource "google_alloydb_cluster" "alloydb_cluster" {
  cluster_id = "alloydb-production-cluster"
  location   = "us-central1"
  network    = google_compute_network.vpc.id

  initial_user {
    password = var.db_password
  }
}

resource "google_alloydb_instance" "primary_instance" {
  cluster       = google_alloydb_cluster.alloydb_cluster.name
  instance_id   = "primary-instance"
  instance_type = "PRIMARY"
  
  machine_config {
    cpu_count = 8
  }

  # Columnar acceleration and Vertex AI predictions enabled
  database_flags = {
    "alloydb.enable_columnar_engine" = "on"
  }
}`;

// Provider-specific SQL ML Queries
const auroraMlSqlQueryCode = `-- Invoke Amazon Comprehend ML analysis directly inside Postgres/MySQL SQL queries
SELECT 
  customer_id, 
  review_date,
  review_text,
  aws_comprehend.detect_sentiment(
    review_text, 
    'en'
  ) AS sentiment_result,
  aws_comprehend.detect_sentiment_confidence(
    review_text, 
    'en'
  ) AS confidence_score
FROM customer_reviews
WHERE product_category = 'ComputeNodes'
  AND review_date >= CURRENT_DATE - INTERVAL '7 days'
LIMIT 10;`;

const azureMlSqlQueryCode = `-- Call Azure OpenAI Sentiment Analysis directly inside Azure SQL Database
DECLARE @retval INT, @response NVARCHAR(MAX);
EXEC @retval = sp_invoke_external_rest_endpoint
    @url = N'https://cog-openai.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2023-05-15',
    @method = N'POST',
    @headers = N'{"Content-Type":"application/json", "api-key":"<secret>"}',
    @payload = N'{"messages":[{"role":"user","content":"Analyze sentiment of customer review: Great database performance!"}]}',
    @response = @response OUTPUT;
SELECT customer_id, review_text, @response AS azure_openai_response
FROM customer_reviews
LIMIT 10;`;

const gcpMlSqlQueryCode = `-- Invoke Vertex AI model predictions directly inside AlloyDB/Spanner SQL queries
SELECT 
  customer_id, 
  review_date,
  review_text,
  ml_predict_row(
    'projects/my-gcp-project/locations/us-central1/models/sentiment-v2',
    json_build_object('text', review_text)
  ) -> 'predictions' -> 0 AS sentiment_result
FROM customer_reviews
WHERE review_date >= CURRENT_DATE - INTERVAL '7 days'
LIMIT 10;`;

interface AuroraVisualizerProps {
  provider?: 'aws' | 'azure' | 'gcp' | 'comparative';
  setProvider?: (provider: 'aws' | 'azure' | 'gcp' | 'comparative') => void;
}

export default function AuroraVisualizer({ provider = 'aws', setProvider }: AuroraVisualizerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');

  const isComparative = provider === 'comparative';
  const isAzure = provider === 'azure';
  const isGcp = provider === 'gcp';

  const handleNavigateToDemo = (prov: 'aws' | 'azure' | 'gcp', tab: any) => {
    if (setProvider) {
      setProvider(prov);
    }
    setActiveTab(tab === 'arch' ? 'overview' : tab);
  };

  // Visual Architect Academy Notebook states
  const [selectedNote, setSelectedNote] = useState<string>('shared_storage');
  const [expandedCategory, setExpandedCategory] = useState<string>('aurora_storage');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Interactive Failover Priority Calculator states
  const [nbReplica1Tier, setNbReplica1Tier] = useState<number>(0);
  const [nbReplica2Tier, setNbReplica2Tier] = useState<number>(1);
  const [nbReplica3Tier, setNbReplica3Tier] = useState<number>(2);

  // Interactive Copy-on-Write Database Cloning states
  const [nbBaselineGb, setNbBaselineGb] = useState<number>(100);
  const [nbCloneModifiedPct, setNbCloneModifiedPct] = useState<number>(15);

  // ==========================================
  // STATE DEFINITIONS
  // ==========================================

  // Tab 1: Storage & Self-Healing
  const [copies, setCopies] = useState<boolean[]>([true, true, true, true, true, true]);
  const [storageLog, setStorageLog] = useState<string>('Quorum status nominal. Six segment copies active across three Availability Zones.');
  const [usedGb, setUsedGb] = useState<number>(35);
  const [allocatedGb, setAllocatedGb] = useState<number>(40);
  const [expandStatus, setExpandStatus] = useState<string>('✅ No storage expansion needed');
  const [expandColor, setExpandColor] = useState<string>('#15803d');

  // Update storage log on provider switch
  useEffect(() => {
    if (isAzure) {
      setStorageLog('Page Server status nominal. 6 Page Server shards (128GB RBPEX SSD) active across 3 Availability Zones.');
    } else if (isGcp) {
      setStorageLog('Paxos Consensus status nominal. 6 Sharded Log Storage Nodes active with Paxos consensus sharding.');
    } else {
      setStorageLog('Quorum status nominal. Six segment copies active across three Availability Zones.');
    }
  }, [provider]);

  // Tab 2: Endpoints & Routing
  const [activeSource, setActiveSource] = useState<'client' | 'proxy' | 'analytics'>('client');

  // Tab 3: Failover Playbook Stepper
  const [failoverStep, setFailoverStep] = useState<number>(1);
  const [failoverActive, setFailoverActive] = useState<boolean>(false);
  const [failoverLogs, setFailoverLogs] = useState<string[]>([
    '[00:00:00] Cluster nominal. Primary Writer operating on us-east-1a (Priority 0).'
  ]);
  const [writerState, setWriterState] = useState<'healthy' | 'dead'>('healthy');
  const [replicaState, setReplicaState] = useState<'reader' | 'promoted'>('reader');

  // Tab 4: Global DB DR
  const [globalLag] = useState<number>(0.2);
  const [secRegionState, setSecRegionState] = useState<'replica' | 'promoted'>('replica');
  const [globalLogs, setGlobalLogs] = useState<string[]>([
    'Global database sync active. Direct hardware-virtualized replication streaming redo logs from us-east-1 to ap-southeast-1.'
  ]);
  const [globalActive, setGlobalActive] = useState<boolean>(false);

  // Tab 5: Serverless Scaling
  const [connections, setConnections] = useState<number>(50);
  const [acu, setAcu] = useState<number>(2);
  const [ram, setRam] = useState<string>('4.0 GB');
  const [cost, setCost] = useState<string>('0.12');
  const [scaleStatus, setScaleStatus] = useState<string>('✅ Stable');
  const [scaleColor, setScaleColor] = useState<string>('#15803d');

  // Tab 6: Copy-on-Write Cloning
  const [cloneWrites, setCloneWrites] = useState<number>(0);
  const [cloneLog, setCloneLog] = useState<string[]>([
    'Clone db_clone_staging initialized in 2.1 seconds. Shares 100% of physical storage pages with production.'
  ]);

  // Tab 7: Hardening HUD & Zero-ETL & ML
  const [activeFeatureTab, setActiveFeatureTab] = useState<'security' | 'zeroetl' | 'ml'>('security');
  
  const getProviderSecChecks = (prov: string): SecItem[] => {
    if (prov === 'azure') {
      return [
        { label: 'Azure Key Vault TDE AES-256 Storage encryption enabled', done: true },
        { label: 'Inbound TLS 1.2+ transport forced (Enforce TLS)', done: true },
        { label: 'Database instances isolated inside VNet Private Endpoints', done: true },
        { label: 'Public network access disabled on SQL Gateway', done: true },
        { label: 'Least-privilege Network Security Group (NSG) port rules configured', done: false },
        { label: 'Microsoft Entra ID (Azure AD) Database Authentication enabled', done: false },
        { label: 'Azure Key Vault configured with automatic credential rotations', done: true },
        { label: 'Resource Locks (CanNotDelete) activated on Database cluster', done: false },
        { label: 'Azure Monitor & Defender for SQL threat protection enabled', done: false }
      ];
    }
    if (prov === 'gcp') {
      return [
        { label: 'Customer-Managed Encryption Keys (CMEK) via Cloud KMS AES-256', done: true },
        { label: 'Inbound TLS 1.3 transport compulsory', done: true },
        { label: 'Database instances isolated via Private Service Connect / VPC', done: true },
        { label: 'Public IP address access disabled', done: true },
        { label: 'VPC Firewall rules restricted to authorized application subnets', done: false },
        { label: 'Google Cloud IAM Database Authentication enabled', done: false },
        { label: 'Cloud Secret Manager configured with automatic credential rotation', done: true },
        { label: 'Cluster lifecycle Deletion Protection flag activated', done: false },
        { label: 'Cloud Audit Logs & Cloud Monitoring metrics enabled', done: false }
      ];
    }
    return [
      { label: 'KMS AES-256 Storage volume encryption enabled', done: true },
      { label: 'Inbound TLS transport forced (force_ssl = 1)', done: true },
      { label: 'Database instances locked inside isolated private subnets', done: true },
      { label: 'PubliclyAccessible cluster parameters disabled (default)', done: true },
      { label: 'Least-privilege security group port references configured', done: false },
      { label: 'AWS IAM Database Authentication enabled for app tier', done: false },
      { label: 'Secrets Manager configured with automatic credential rotations', done: true },
      { label: 'Cluster lifecycle Deletion Protection activated', done: false },
      { label: 'RDS Enhanced CloudWatch Monitoring enabled', done: false }
    ];
  };

  const [secChecks, setSecChecks] = useState<SecItem[]>(getProviderSecChecks(provider));

  useEffect(() => {
    setSecChecks(getProviderSecChecks(provider));
  }, [provider]);

  const [activeMlQuery, setActiveMlQuery] = useState<'sentiment' | 'fraud' | 'churn'>('sentiment');
  const [mlOutput, setMlOutput] = useState<any[]>([]);
  const [mlLogs, setMlLogs] = useState<string[]>([]);
  const [mlIsLoading, setMlIsLoading] = useState<boolean>(false);
  const [zeroEtlStatus, setZeroEtlStatus] = useState<'idle' | 'syncing'>('idle');
  const [zeroEtlLogs, setZeroEtlLogs] = useState<string[]>([]);

  // ==========================================
  // STORAGE TAB SIMULATOR LOGIC
  // ==========================================
  const failOneCopy = () => {
    const failedIdx = copies.findIndex(val => val === true);
    if (failedIdx === -1) {
      setStorageLog('⚠️ All storage sector copies failed. Write and read quorum collapsed. Data service offline!');
      return;
    }
    const newCopies = [...copies];
    newCopies[failedIdx] = false;
    setCopies(newCopies);

    const healthyCount = newCopies.filter(Boolean).length;
    if (healthyCount >= 4) {
      if (isAzure) {
        setStorageLog(`⚠️ Page Server ${failedIdx + 1} experienced node outage. Hyperscale continues serving reads & writes via remaining Page Servers & Log Service.`);
      } else if (isGcp) {
        setStorageLog(`⚠️ Storage Paxos node ${failedIdx + 1} failed. Consensus achieved across remaining nodes (Write quorum 4/6 ACK ok).`);
      } else {
        setStorageLog(`⚠️ Segment copy ${failedIdx + 1} experienced disk failure. Aurora continues serving reads & writes via quorum (Write 4/6, Read 3/6 ok).`);
      }
    } else if (healthyCount === 3) {
      setStorageLog(`🚨 Copy ${failedIdx + 1} failed. Write Quorum collapsed! Cluster locked in READ-ONLY mode (Read 3/6 ok).`);
    } else {
      setStorageLog(`🚨 Critical drive failure. Storage quorum collapsed! Database is completely unreachable.`);
    }
  };

  const selfHealStorage = () => {
    const repairIdx = copies.findIndex(val => val === false);
    if (repairIdx === -1) {
      setStorageLog('Quorum status nominal. All 6 drive copies are already 100% healthy.');
      return;
    }
    setStorageLog('🔄 Initiating self-healing storage rebuild. Fetching redo segments from healthy disk copies to reconstruct sector...');

    let currentCopies = [...copies];
    const timer = setInterval(() => {
      const nextFailedIdx = currentCopies.findIndex(val => val === false);
      if (nextFailedIdx === -1) {
        clearInterval(timer);
        setStorageLog('✅ Background self-healing rebuild complete. All 6 copies back to healthy synchrony.');
        return;
      }
      currentCopies[nextFailedIdx] = true;
      setCopies([...currentCopies]);
    }, 450);
  };

  const resetStorageCopies = () => {
    setCopies([true, true, true, true, true, true]);
    if (isAzure) {
      setStorageLog('Page Server status nominal. 6 Page Server shards (128GB RBPEX SSD) active across 3 Availability Zones.');
    } else if (isGcp) {
      setStorageLog('Paxos Consensus status nominal. 6 Sharded Log Storage Nodes active with Paxos consensus sharding.');
    } else {
      setStorageLog('Quorum status nominal. Six segment copies active across three Availability Zones.');
    }
  };

  const handleUsedGbChange = (val: number) => {
    setUsedGb(val);
    let newAlloc = allocatedGb;
    let expanded = false;
    while (val > newAlloc && newAlloc < 131072) {
      newAlloc += 10;
      expanded = true;
    }
    if (expanded) {
      setAllocatedGb(newAlloc);
      setExpandStatus('⚠️ Storage auto-expanded (+10 GB segment)');
      setExpandColor('#d97706');
      setTimeout(() => {
        setExpandStatus('✅ Storage allocation stabilized');
        setExpandColor('#15803d');
      }, 900);
    } else {
      setExpandStatus('✅ No storage expansion needed');
      setExpandColor('#15803d');
    }
  };

  // ==========================================
  // FAILOVER PLAYBOOK STEPPER LOGIC
  // ==========================================
  const triggerNextFailoverStep = () => {
    if (failoverActive) return;

    const loc1 = isAzure ? 'East US Zone 1' : isGcp ? 'us-central1-a' : 'us-east-1a';
    const loc2 = isAzure ? 'East US Zone 2' : isGcp ? 'us-central1-b' : 'us-east-1b';

    if (failoverStep === 1) {
      setFailoverActive(true);
      setWriterState('dead');
      setFailoverLogs(prev => [
        `[T+0s] 💥 Power death/outage detected in ${loc1}. Primary Writer database unresponsive.`,
        ...prev
      ]);
      setFailoverStep(2);
      setFailoverActive(false);
    } else if (failoverStep === 2) {
      setFailoverActive(true);
      setFailoverLogs(prev => [
        `[T+8s] 🛡️ Fencing off dead Writer instance in ${loc1} to prevent split-brain partition writes.`,
        ...prev
      ]);
      setFailoverStep(3);
      setFailoverActive(false);
    } else if (failoverStep === 3) {
      setFailoverActive(true);
      setFailoverLogs(prev => [
        `[T+12s] 🔄 Selecting Standby Replica with highest failover priority...`,
        `[T+15s] ⚡ Promoting Replica 1 (${loc2}) to active Primary Writer!`,
        ...prev
      ]);
      setReplicaState('promoted');
      setFailoverStep(4);
      setFailoverActive(false);
    } else if (failoverStep === 4) {
      setFailoverActive(true);
      setFailoverLogs(prev => [
        `[T+18s] 🔌 Connection Gateway DNS mapping shifted to promoted ${loc2} instance.`,
        `[T+22s] 🔄 Connection pool multiplexer intercepts target IP shifts smoothly.`,
        ...prev
      ]);
      setFailoverStep(5);
      setFailoverActive(false);
    } else if (failoverStep === 5) {
      setFailoverActive(true);
      setFailoverLogs(prev => [
        `[T+25s] ✅ Cluster recovery nominal. Gateway accepts app traffic. Zero transactional data loss!`,
        ...prev
      ]);
      setFailoverActive(false);
    }
  };

  const autoPlayFailover = () => {
    if (failoverStep !== 1) return;
    setFailoverActive(true);
    setWriterState('dead');

    const loc1 = isAzure ? 'East US Zone 1' : isGcp ? 'us-central1-a' : 'us-east-1a';
    const loc2 = isAzure ? 'East US Zone 2' : isGcp ? 'us-central1-b' : 'us-east-1b';

    setFailoverLogs(prev => [`[T+0s] 💥 Power death/outage detected in ${loc1}. Primary Writer database unresponsive.`, ...prev]);

    setTimeout(() => {
      setFailoverLogs(prev => [`[T+8s] 🛡️ Fencing off dead Writer instance in ${loc1} to prevent split-brain partition writes.`, ...prev]);
    }, 1000);

    setTimeout(() => {
      setReplicaState('promoted');
      setFailoverLogs(prev => [
        `[T+12s] 🔄 Selecting Standby Replica with highest failover priority...`,
        `[T+15s] ⚡ Promoting Replica 1 (${loc2}) to active Primary Writer!`,
        ...prev
      ]);
    }, 2000);

    setTimeout(() => {
      setFailoverLogs(prev => [
        `[T+18s] 🔌 Connection Gateway DNS mapping shifted to promoted ${loc2} instance.`,
        `[T+22s] 🔄 Connection pool multiplexer intercepts target IP shifts smoothly.`,
        ...prev
      ]);
    }, 3000);

    setTimeout(() => {
      setFailoverLogs(prev => [`[T+25s] ✅ Cluster recovery nominal. Gateway accepts app traffic. Zero transactional data loss!`, ...prev]);
      setFailoverStep(5);
      setFailoverActive(false);
    }, 4000);
  };

  const resetFailoverSim = () => {
    setFailoverStep(1);
    setFailoverActive(false);
    setWriterState('healthy');
    setReplicaState('reader');
    const loc1 = isAzure ? 'East US Zone 1' : isGcp ? 'us-central1-a' : 'us-east-1a';
    setFailoverLogs([
      `[00:00:00] Cluster nominal. Primary Writer operating on ${loc1} (Priority 0).`
    ]);
  };

  // ==========================================
  // GLOBAL DB FAILOVER SIMULATOR
  // ==========================================
  const triggerGlobalFailover = () => {
    if (globalActive) return;
    setGlobalActive(true);

    const primaryReg = isAzure ? 'East US' : isGcp ? 'Iowa (us-central1)' : 'N. Virginia (us-east-1)';
    const secReg = isAzure ? 'West Europe' : isGcp ? 'Singapore (asia-southeast1)' : 'Singapore (ap-southeast-1)';

    setGlobalLogs(prev => [
      `[DR+0s] 🔴 Primary Region ${primaryReg} catastrophic power outage triggered.`,
      ...prev
    ]);

    setTimeout(() => {
      setGlobalLogs(prev => [
        `[DR+5s] ⚠️ Health checking nodes. ${primaryReg} unresponsive. Initiating global database disaster failover...`,
        ...prev
      ]);
    }, 1000);

    setTimeout(() => {
      setGlobalLogs(prev => [
        `[DR+12s] 🔌 Severing lag synchronization channel. Locking ${secReg} warm storage.`,
        ...prev
      ]);
    }, 2000);

    setTimeout(() => {
      setGlobalLogs(prev => [
        `[DR+18s] 👑 Promoting ${secReg} replica cluster to master standalone primary database!`,
        ...prev
      ]);
      setSecRegionState('promoted');
    }, 3000);

    setTimeout(() => {
      setGlobalLogs(prev => [
        `[DR+24s] ✅ Promotion completed successfully. Global endpoint updated. RPO = ${globalLag}s, RTO = 24s. ${secReg} Writer online!`,
        ...prev
      ]);
      setGlobalActive(false);
    }, 4000);
  };

  const resetGlobalDb = () => {
    setSecRegionState('replica');
    setGlobalActive(false);
    const primaryReg = isAzure ? 'East US' : isGcp ? 'us-central1' : 'us-east-1';
    const secReg = isAzure ? 'West Europe' : isGcp ? 'asia-southeast1' : 'ap-southeast-1';
    setGlobalLogs([
      `Global database sync active. Direct hardware-virtualized replication streaming redo logs from ${primaryReg} to ${secReg}.`
    ]);
  };

  // ==========================================
  // SERVERLESS ACU SCALING EFFECT
  // ==========================================
  useEffect(() => {
    const computedAcu = Math.max(0.5, Math.min(256, Math.ceil(connections / 20)));
    setAcu(computedAcu);
    
    if (isAzure) {
      setRam(`${(computedAcu * 3).toFixed(1)} GB`);
      setCost((computedAcu * 0.15).toFixed(2));
    } else if (isGcp) {
      setRam(`${(computedAcu * 2.5).toFixed(1)} GB`);
      setCost((computedAcu * 0.14).toFixed(2));
    } else {
      setRam(`${(computedAcu * 2).toFixed(1)} GB`);
      setCost((computedAcu * 0.12).toFixed(2));
    }

    const unitName = isAzure ? 'vCores' : isGcp ? 'vCores / Processing Units' : 'ACUs';

    if (connections < 50) {
      setScaleStatus('✅ Stable (Cooling Down)');
      setScaleColor('#15803d');
    } else if (connections < 250) {
      setScaleStatus(`⬆️ Scaling Compute (${unitName} Auto-expanding)`);
      setScaleColor('#d97706');
    } else {
      setScaleStatus('🔥 High Concurrency Load (Scaling Max)');
      setScaleColor('#dc2626');
    }
  }, [connections, provider]);

  // ==========================================
  // DATABASE CLONING SIMULATOR
  // ==========================================
  const simulateCloneWrite = () => {
    const newWrites = cloneWrites + 1;
    setCloneWrites(newWrites);
    const costSavings = Math.round((1 - (newWrites * 0.008 / 100)) * 100);
    setCloneLog(prev => [
      `[Clone Write #${newWrites}] Diverged page block #${Math.round(Math.random() * 80000 + 400)} allocated on metadata map. Cost savings: ${costSavings}% relative to full snapshot copies.`,
      ...prev
    ]);
  };

  const resetCloneSim = () => {
    setCloneWrites(0);
    setCloneLog([
      'Clone db_clone_staging initialized in 2.1 seconds. Shares 100% of physical storage pages with production.'
    ]);
  };

  // ==========================================
  // HARDENING SCORE LOGIC
  // ==========================================
  const toggleSecCheck = (index: number) => {
    setSecChecks(prev => {
      const next = [...prev];
      next[index] = { ...next[index], done: !next[index].done };
      return next;
    });
  };

  const passedChecksCount = secChecks.filter(c => c.done).length;
  const totalChecksCount = secChecks.length;
  const scorePct = Math.round((passedChecksCount / totalChecksCount) * 100);

  let grade = 'F';
  let gradeColor = '#ef4444';
  if (scorePct >= 95) { grade = 'A+'; gradeColor = '#10b981'; }
  else if (scorePct >= 85) { grade = 'A'; gradeColor = '#059669'; }
  else if (scorePct >= 75) { grade = 'B'; gradeColor = '#2563eb'; }
  else if (scorePct >= 60) { grade = 'C'; gradeColor = '#d97706'; }
  else if (scorePct >= 45) { grade = 'D'; gradeColor = '#ea580c'; }

  // ==========================================
  // MACHINE LEARNING SQL SANDBOX LOGIC
  // ==========================================
  const getProviderMlQueries = (prov: string): Record<string, { sql: string, logs: string[], results: any[] }> => {
    if (prov === 'azure') {
      return {
        sentiment: {
          sql: `-- Call Azure OpenAI Sentiment Analysis via REST in SQL\nDECLARE @response NVARCHAR(MAX);\nEXEC sp_invoke_external_rest_endpoint\n  @url = N'https://cog-openai.openai.azure.com/openai/deployments/gpt-4/chat/completions?api-version=2023-05-15',\n  @method = N'POST',\n  @payload = N'{"messages":[{"role":"user","content":"Analyze sentiment of feedback"}]}',\n  @response = @response OUTPUT;\nSELECT customer_id, feedback_text, @response AS azure_openai_sentiment\nFROM feedback_reviews LIMIT 3;`,
          logs: [
            'Connecting to Azure SQL Database REST Endpoint broker...',
            'Authenticating via Managed Identity & Key Vault token...',
            'Dispatching HTTP POST request to Azure OpenAI gpt-4 deployment...',
            'Parsing returned JSON response payload...'
          ],
          results: [
            { id: 'C-1042', feedback: 'Amazing response time! Absolutely loved it.', sentiment: 'POSITIVE', conf: '0.98' },
            { id: 'C-2871', feedback: 'Laggy streaming connections during failovers.', sentiment: 'NEGATIVE', conf: '0.84' },
            { id: 'C-0994', feedback: 'The visualizer works as expected.', sentiment: 'NEUTRAL', conf: '0.76' }
          ]
        },
        fraud: {
          sql: `-- Invoke Azure Machine Learning model endpoint from SQL\nDECLARE @response NVARCHAR(MAX);\nEXEC sp_invoke_external_rest_endpoint\n  @url = N'https://fraud-eval.eastus.inference.ml.azure.com/score',\n  @method = N'POST',\n  @payload = N'{"amount": 8400, "client_ip": "198.51.100.12"}',\n  @response = @response OUTPUT;\nSELECT txn_id, amount_usd, @response AS risk_score\nFROM pending_transactions WHERE risk_score > 0.8;`,
          logs: [
            'Validating Managed Identity credentials with Azure Entra ID...',
            'Forwarding parameters to Azure Machine Learning inference endpoint...',
            'Evaluating regression prediction scoring vectors...',
            'Writing prediction columns back to relational query workspace...'
          ],
          results: [
            { id: 'TXN-984', feedback: 'Amount: $8,400 | IP: 198.51.100.12', sentiment: 'HIGH RISK', conf: '0.94' },
            { id: 'TXN-201', feedback: 'Amount: $9,250 | IP: 203.0.113.43', sentiment: 'HIGH RISK', conf: '0.89' }
          ]
        },
        churn: {
          sql: `-- Call Azure Cognitive Services Churn Predictor\nDECLARE @response NVARCHAR(MAX);\nEXEC sp_invoke_external_rest_endpoint\n  @url = N'https://churn-eval.cognitiveservices.azure.com/predict',\n  @method = N'POST',\n  @payload = N'{"active_weeks": 4, "tickets": 9}',\n  @response = @response OUTPUT;\nSELECT user_account, active_weeks, @response AS churn_probability\nFROM premium_members ORDER BY churn_probability DESC LIMIT 2;`,
          logs: [
            'Retrieving Key Vault authorization secrets...',
            'Invoking custom customer-churn-evaluator REST endpoint...',
            'Parsing probability vectors...',
            'Sorting tabular results in relational query engine...'
          ],
          results: [
            { id: 'USR-8821', feedback: 'Active: 4 weeks | Support tickets: 9', sentiment: 'HIGH CHURN', conf: '0.91' },
            { id: 'USR-4309', feedback: 'Active: 8 weeks | Support tickets: 5', sentiment: 'MED CHURN', conf: '0.74' }
          ]
        }
      };
    }
    if (prov === 'gcp') {
      return {
        sentiment: {
          sql: `-- Invoke Vertex AI sentiment analysis directly inside AlloyDB/Spanner SQL\nSELECT customer_id, review_text,\n  ml_predict_row(\n    'projects/my-gcp-project/locations/us-central1/models/sentiment-v2',\n    json_build_object('text', review_text)\n  ) -> 'predictions' -> 0 AS sentiment_result\nFROM feedback_reviews\nLIMIT 3;`,
          logs: [
            'Connecting to AlloyDB / Spanner Vertex AI integration socket...',
            'Authorizing cluster Service Account via Cloud IAM...',
            'Streaming SQL row values to Vertex AI online prediction endpoint...',
            'Parsing returned JSON prediction objects...'
          ],
          results: [
            { id: 'C-1042', feedback: 'Amazing response time! Absolutely loved it.', sentiment: 'POSITIVE', conf: '0.98' },
            { id: 'C-2871', feedback: 'Laggy streaming connections during failovers.', sentiment: 'NEGATIVE', conf: '0.84' },
            { id: 'C-0994', feedback: 'The visualizer works as expected.', sentiment: 'NEUTRAL', conf: '0.76' }
          ]
        },
        fraud: {
          sql: `-- Call Vertex AI Fraud Classifier model endpoint inside SQL\nSELECT txn_id, amount_usd,\n  ml_predict_row(\n    'projects/my-gcp-project/locations/us-central1/models/fraud-v4',\n    json_build_object('amount', amount_usd, 'ip', client_ip)\n  ) -> 'risk_score' AS risk_score\nFROM pending_transactions\nWHERE risk_score > 0.8;`,
          logs: [
            'Authorizing credentials via Cloud KMS encryption...',
            'Forwarding parameters to Vertex AI model fraud-v4...',
            'Evaluating regression prediction arrays...',
            'Writing result columns back to active relational table...'
          ],
          results: [
            { id: 'TXN-984', feedback: 'Amount: $8,400 | IP: 198.51.100.12', sentiment: 'HIGH RISK', conf: '0.94' },
            { id: 'TXN-201', feedback: 'Amount: $9,250 | IP: 203.0.113.43', sentiment: 'HIGH RISK', conf: '0.89' }
          ]
        },
        churn: {
          sql: `-- Call Vertex AI Customer Churn Evaluator in SQL\nSELECT user_account, active_weeks,\n  ml_predict_row(\n    'projects/my-gcp-project/locations/us-central1/models/churn-v1',\n    json_build_object('weeks', active_weeks, 'tickets', support_tickets)\n  ) -> 'churn_probability' AS churn_probability\nFROM premium_members\nORDER BY churn_probability DESC LIMIT 2;`,
          logs: [
            'Reading cluster metadata configuration settings...',
            'Invoking custom customer-churn-evaluator endpoint via gRPC stream...',
            'Parsing returned probability vectors...',
            'Sorting tabular results in relational query engine...'
          ],
          results: [
            { id: 'USR-8821', feedback: 'Active: 4 weeks | Support tickets: 9', sentiment: 'HIGH CHURN', conf: '0.91' },
            { id: 'USR-4309', feedback: 'Active: 8 weeks | Support tickets: 5', sentiment: 'MED CHURN', conf: '0.74' }
          ]
        }
      };
    }
    return {
      sentiment: {
        sql: `SELECT customer_id, feedback_text,\n  aws_comprehend.detect_sentiment(\n    feedback_text, 'en'\n  ) AS sentiment\nFROM feedback_reviews\nLIMIT 3;`,
        logs: [
          'Connecting to local Aurora ML extension socket...',
          'Authorizing cluster role IAM-AuroraMLBroker to aws:comprehend...',
          'Streaming SQL row values to Comprehend synchronous endpoint...',
          'Parsing schema payload returns...'
        ],
        results: [
          { id: 'C-1042', feedback: 'Amazing response time! Absolutely loved it.', sentiment: 'POSITIVE', conf: '0.98' },
          { id: 'C-2871', feedback: 'Laggy streaming connections during failovers.', sentiment: 'NEGATIVE', conf: '0.84' },
          { id: 'C-0994', feedback: 'The visualizer works as expected.', sentiment: 'NEUTRAL', conf: '0.76' }
        ]
      },
      fraud: {
        sql: `SELECT txn_id, amount_usd,\n  aws_sagemaker.invoke_endpoint(\n    'fraud-classification-v4',\n    'application/json',\n    amount_usd, client_ip, hour_of_day\n  ) AS risk_score\nFROM pending_transactions\nWHERE risk_score > 0.8;`,
        logs: [
          'Authorizing credentials handshake via KMS encryption...',
          'Forwarding parameters to SageMaker model fraud-classification-v4...',
          'Evaluating regression prediction arrays...',
          'Writing result columns back to active relational table...'
        ],
        results: [
          { id: 'TXN-984', feedback: 'Amount: $8,400 | IP: 198.51.100.12', sentiment: 'HIGH RISK', conf: '0.94' },
          { id: 'TXN-201', feedback: 'Amount: $9,250 | IP: 203.0.113.43', sentiment: 'HIGH RISK', conf: '0.89' }
        ]
      },
      churn: {
        sql: `SELECT user_account, active_weeks,\n  aws_sagemaker.invoke_endpoint(\n    'customer-churn-evaluator',\n    'text/csv',\n    active_weeks, support_tickets\n  ) AS churn_probability\nFROM premium_members\nORDER BY churn_probability DESC LIMIT 2;`,
        logs: [
          'Reading cluster metadata configuration settings...',
          'Invoking custom customer-churn-evaluator endpoint via CSV stream...',
          'Parsing returned probability vectors...',
          'Sorting tabular results in relational query engine...'
        ],
        results: [
          { id: 'USR-8821', feedback: 'Active: 4 weeks | Support tickets: 9', sentiment: 'HIGH CHURN', conf: '0.91' },
          { id: 'USR-4309', feedback: 'Active: 8 weeks | Support tickets: 5', sentiment: 'MED CHURN', conf: '0.74' }
        ]
      }
    };
  };

  const mlQueries = getProviderMlQueries(provider);

  const runMlInference = () => {
    setMlIsLoading(true);
    setMlOutput([]);
    setMlLogs([]);

    let currentLogIdx = 0;
    const interval = setInterval(() => {
      if (currentLogIdx < mlQueries[activeMlQuery].logs.length) {
        setMlLogs(prev => [...prev, `[CLI-INFERENCE] ${mlQueries[activeMlQuery].logs[currentLogIdx]}`]);
        currentLogIdx++;
      } else {
        clearInterval(interval);
        setMlIsLoading(false);
        setMlOutput(mlQueries[activeMlQuery].results);
      }
    }, 350);
  };

  // ==========================================
  // ZERO-ETL LOGIC
  // ==========================================
  const runZeroEtlSync = () => {
    if (zeroEtlStatus === 'syncing') return;
    setZeroEtlStatus('syncing');
    setZeroEtlLogs([]);

    const syncSteps = isAzure ? [
      'Establishing Azure Synapse Link change feed connection with Azure SQL / Cosmos DB...',
      'Streaming operational log updates directly to Synapse / Microsoft Fabric Lakehouse...',
      'Syncing schema feedback_reviews in columnar Parquet format...',
      'Streaming 8,432 WAL transaction segments (zero-ETL HTAP pipeline)...',
      'Azure Synapse analytical views & Delta tables refreshed!',
      'Pipeline stabilized in continuous sync mode. Current replication lag: < 1 second.'
    ] : isGcp ? [
      'Establishing Datastream CDC continuous replication pipeline with BigQuery...',
      'Mapping AlloyDB WAL redo log files directly to BigQuery storage slots...',
      'Syncing schema feedback_reviews - replaying transactions to BigQuery...',
      'Streaming 8,432 CDC log segments (zero ETL data pipeline)...',
      'BigQuery data warehouse materialized views refreshed!',
      'Pipeline stabilized in continuous sync mode. Current replication lag: < 1 second.'
    ] : [
      'Establishing Zero-ETL continuous replication pipeline with Redshift...',
      'Mapping Aurora transaction redo log WAL files directly to Redshift storage nodes...',
      'Syncing schema feedback_reviews - replaying transactions...',
      'Streaming 8,432 WAL data segments (replicated, zero ETL engineering compute)...',
      'Redshift data warehouse materialized views refreshed!',
      'Pipeline stabilized in continuous sync mode. Current replication lag: < 1 second.'
    ];

    let currentStepIdx = 0;
    const interval = setInterval(() => {
      if (currentStepIdx < syncSteps.length) {
        setZeroEtlLogs(prev => [...prev, `[ZERO-ETL] ${syncSteps[currentStepIdx]}`]);
        currentStepIdx++;
      } else {
        clearInterval(interval);
        setZeroEtlStatus('idle');
      }
    }, 450);
  };

  return (
    <div className="aurora-container">
      <style>{`
        /* Encapsulated styling under .aurora- */
        .aurora-container {
          font-family: var(--font-sans, system-ui, sans-serif);
          color: #1e293b;
        }
        .aurora-h {
          font-size: 26px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .aurora-sub {
          font-size: 13.5px;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 20px;
        }
        .aurora-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 18px;
          border-bottom: 1.5px solid #e2e8f0;
          padding-bottom: 12px;
        }
        .aurora-tb {
          padding: 6px 14px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          font-size: 12px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.8);
          color: #475569;
          transition: all 0.15s ease-in-out;
          outline: none;
          font-weight: 500;
        }
        .aurora-tb:hover {
          background: #f1f5f9;
          border-color: #94a3b8;
          color: #0f172a;
        }
        .aurora-tb.aurora-on {
          background: #16a34a;
          color: #fff;
          border-color: #16a34a;
          box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);
        }
        .aurora-card {
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 16px;
          padding: 14px 16px;
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.02);
          margin-bottom: 14px;
        }
        .aurora-sec {
          font-size: 11px;
          font-weight: 700;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 16px 0 8px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 4px;
        }
        .aurora-sec:first-child { margin-top: 0; }
        .aurora-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .aurora-grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .aurora-row {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 8px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: rgba(248, 250, 252, 0.8);
          margin-bottom: 6px;
          font-size: 12px;
          line-height: 1.45;
        }
        .aurora-dot {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 10px;
          color: #fff;
          font-weight: 600;
          background: #2563eb;
        }
        .aurora-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }
        .aurora-binfo { background: #dbeafe; color: #1d4ed8; }
        .aurora-bok { background: #dcfce7; color: #15803d; }
        .aurora-bwarn { background: #fef3c7; color: #b45309; }
        .aurora-bbad { background: #fee2e2; color: #b91c1c; }
        .aurora-bpurple { background: #ede9fe; color: #7c3aed; }
        .aurora-kpi { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }
        .aurora-k {
          background: rgba(248, 250, 252, 0.85);
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 10px;
          text-align: center;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.01);
        }
        .aurora-k .t { font-size: 10px; color: #64748b; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
        .aurora-k .v { font-size: 16px; font-weight: 700; color: #0f172a; }
        .aurora-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
        .aurora-ctrl {
          background: rgba(248, 250, 252, 0.85);
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 12px;
        }
        .aurora-ctrl label { display: block; font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px; }
        .aurora-ctrl select {
          width: 100%;
          padding: 6px;
          font-size: 12px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          background: #ffffff;
          outline: none;
          transition: all 0.15s;
        }
        .aurora-ctrl select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
        }
        .aurora-ctrl input[type="range"] {
          width: 100%;
          padding: 6px;
          font-size: 12px;
          border: 0.5px solid #cbd5e1;
          border-radius: 4px;
          background: #ffffff;
        }
        .aurora-ctrl .out { font-size: 11px; color: #475569; margin-top: 6px; font-family: var(--font-mono, monospace); }
        .aurora-mono { font-family: var(--font-mono, monospace); font-size: 11px; }
        .aurora-btnbar { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .aurora-btn {
          font-size: 12px;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s;
          outline: none;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        }
        .aurora-btn:hover { background: #f8fafc; color: #0f172a; border-color: #94a3b8; }
        .aurora-btn.aurora-primary {
          background: #16a34a;
          border-color: #16a34a;
          color: #fff;
          box-shadow: 0 2px 4px rgba(22, 163, 74, 0.15);
        }
        .aurora-btn.aurora-primary:hover { background: #15803d; border-color: #15803d; }
        .aurora-btn.aurora-primary:disabled { background: #93c5fd; border-color: #93c5fd; color: #fff; cursor: not-allowed; }
        .aurora-log {
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          padding: 12px;
          background: #f8fafc;
          color: #1e293b;
          font-size: 11px;
          font-family: var(--font-mono, monospace);
          line-height: 1.6;
          min-height: 90px;
          max-height: 180px;
          overflow-y: auto;
          margin-top: 12px;
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.03);
        }
        ul.aurora-ck, ul.aurora-wn { padding-left: 0; margin-bottom: 0; }
        ul.aurora-ck li, ul.aurora-wn li { font-size: 12px; margin-bottom: 6px; list-style: none; padding-left: 18px; position: relative; line-height: 1.4; color: #475569; }
        ul.aurora-ck li::before { content: "✓"; position: absolute; left: 0; color: #15803d; font-weight: 700; }
        ul.aurora-wn li::before { content: "⚠️"; position: absolute; left: 0; font-size: 10px; }
        .aurora-table { width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.4; }
        .aurora-table th { background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-weight: 600; color: #475569; }
        .aurora-table td { border: 1px solid #cbd5e1; padding: 8px; color: #1e293b; }
        .aurora-table tr:nth-child(even) { background: rgba(248, 250, 252, 0.5); }
        .aurora-code-container { border: 1px solid #cbd5e1; border-radius: 8px; background: #f8fafc; padding: 12px; margin-top: 10px; }
        .aurora-code { font-family: var(--font-mono, monospace); font-size: 11px; white-space: pre-wrap; line-height: 1.45; color: #1e293b; }
        
        .aurora-subtabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 8px; }
        .aurora-subtb {
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid #cbd5e1;
          font-size: 11px;
          cursor: pointer;
          background: #ffffff;
          color: #475569;
          transition: all 0.15s;
          outline: none;
          font-weight: 500;
        }
        .aurora-subtb:hover { background: #f8fafc; color: #0f172a; border-color: #94a3b8; }
        .aurora-subtb.aurora-on { background: #16a34a; color: #fff; border-color: #16a34a; }
        .aurora-subtb.aurora-on-purple { background: #7c3aed; color: #fff; border-color: #7c3aed; }
        
        .aurora-svg-bg {
          background-color: #f8fafc;
          background-image: radial-gradient(#cbd5e1 1.2px, transparent 1.2px);
          background-size: 14px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
        }
        
        @keyframes activeNodePulse {
          0% { filter: drop-shadow(0 0 2px var(--pulse-color)); }
          50% { filter: drop-shadow(0 0 10px var(--pulse-color)); }
          100% { filter: drop-shadow(0 0 2px var(--pulse-color)); }
        }
        .active-glow-node {
          animation: activeNodePulse 2.5s infinite;
        }
        @keyframes flowAnim {
          to { stroke-dashoffset: -20; }
        }
        .flow-active-line {
          stroke-dasharray: 6, 4;
          animation: flowAnim 1s linear infinite;
        }
        @keyframes ledBlink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .led-blink {
          animation: ledBlink 1s infinite;
        }

        /* Premium Academy Directory Styles */
        .acad-dir-container {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .acad-dir-header {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
          padding: 16px;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--color-border-tertiary);
        }
        .acad-dir-folder-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--color-background-primary);
          border: none;
          border-bottom: 1px solid var(--color-border-tertiary);
          font-size: 10px;
          font-weight: 800;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .acad-dir-folder-btn:hover {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
        }
        .acad-dir-item-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          font-size: 12px;
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
          color: var(--color-text-info);
          border-left-color: var(--color-border-tertiary);
        }
        .acad-dir-item-btn.acad-active {
          background: #eff6ff;
          color: #0284c7;
          border-left-color: #0ea5e9;
          font-weight: 800;
        }
        .acad-detail-card {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 16px;
          padding: 28px;
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
          padding: 18px;
          font-size: 12px;
          line-height: 1.6;
          color: var(--color-text-secondary);
          font-weight: 600;
          border-top: 1px solid var(--color-border-tertiary);
          border-right: 1px solid var(--color-border-tertiary);
          border-bottom: 1px solid var(--color-border-tertiary);
        }
        .acad-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--color-border-tertiary);
        }
        .acad-table th {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
          font-weight: 800;
          padding: 12px 14px;
          border-bottom: 1.5px solid var(--color-border-tertiary);
          text-align: left;
        }
        .acad-table td {
          padding: 12px 14px;
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
          padding: 14px;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          color: #cbd5e1;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
        }

        /* Theme Aware Colors */
        .text-orange { color: #c2410c !important; fill: #c2410c !important; }
        .text-blue { color: #0369a1 !important; fill: #0369a1 !important; }
        .text-purple { color: #7c3aed !important; fill: #7c3aed !important; }
        .text-green { color: #16a34a !important; fill: #16a34a !important; }
        .text-red { color: #ef4444 !important; fill: #ef4444 !important; }
        .text-slate { color: #64748b !important; fill: #64748b !important; }

        .dark .text-orange { color: #f97316 !important; fill: #f97316 !important; }
        .dark .text-blue { color: #38bdf8 !important; fill: #38bdf8 !important; }
        .dark .text-purple { color: #a78bfa !important; fill: #a78bfa !important; }
        .dark .text-green { color: #4ade80 !important; fill: #4ade80 !important; }
        .dark .text-red { color: #f87171 !important; fill: #f87171 !important; }
        .dark .text-slate { color: #94a3b8 !important; fill: #94a3b8 !important; }

        /* Card Colors */
        .aurora-card-orange { border-left: 3px solid #c2410c !important; }
        .dark .aurora-card-orange { border-left: 3px solid #f97316 !important; }
        .aurora-card-blue { border-left: 3px solid #0369a1 !important; }
        .dark .aurora-card-blue { border-left: 3px solid #38bdf8 !important; }
        .aurora-card-purple { border-left: 3px solid #7c3aed !important; }
        .dark .aurora-card-purple { border-left: 3px solid #a78bfa !important; }
        .aurora-card-slate { border-left: 3px solid #64748b !important; }
        .dark .aurora-card-slate { border-left: 3px solid #94a3b8 !important; }

        /* SVG Overrides */
        .aurora-svg-rect {
          fill: var(--color-background-primary);
          stroke: var(--color-border-secondary);
          transition: all 0.3s ease;
        }
        .dark .aurora-svg-rect {
          fill: rgba(15, 23, 42, 0.8) !important;
          stroke: rgba(51, 65, 85, 0.6) !important;
        }
        .aurora-svg-rect-blue {
          fill: #eff6ff;
          stroke: #93c5fd;
          transition: all 0.3s ease;
        }
        .dark .aurora-svg-rect-blue {
          fill: rgba(2, 132, 199, 0.15) !important;
          stroke: rgba(56, 189, 248, 0.4) !important;
        }
        .aurora-svg-rect-purple {
          fill: #f5f3ff;
          stroke: #a78bfa;
          transition: all 0.3s ease;
        }
        .dark .aurora-svg-rect-purple {
          fill: rgba(124, 58, 237, 0.15) !important;
          stroke: rgba(167, 139, 250, 0.4) !important;
        }
        .aurora-svg-rect-red {
          fill: #fff1f2;
          stroke: #fca5a5;
          transition: all 0.3s ease;
        }
        .dark .aurora-svg-rect-red {
          fill: rgba(239, 68, 68, 0.15) !important;
          stroke: rgba(248, 113, 113, 0.4) !important;
        }
        .aurora-svg-rect-orange {
          fill: #fff7ed;
          stroke: #ffedd5;
          transition: all 0.3s ease;
        }
        .dark .aurora-svg-rect-orange {
          fill: rgba(234, 88, 12, 0.15) !important;
          stroke: rgba(249, 115, 22, 0.4) !important;
        }
        .aurora-svg-rect-green {
          fill: #f0fdf4;
          stroke: #86efac;
          transition: all 0.3s ease;
        }
        .dark .aurora-svg-rect-green {
          fill: rgba(16, 185, 129, 0.15) !important;
          stroke: rgba(74, 222, 128, 0.4) !important;
        }
        .aurora-svg-rect-grey {
          fill: #f8fafc;
          stroke: #cbd5e1;
          transition: all 0.3s ease;
        }
        .dark .aurora-svg-rect-grey {
          fill: rgba(148, 163, 184, 0.1) !important;
          stroke: rgba(148, 163, 184, 0.4) !important;
        }
        .aurora-svg-rect-blue-dashed {
          fill: rgba(239, 246, 255, 0.4);
          stroke: #93c5fd;
          transition: all 0.3s ease;
        }
        .dark .aurora-svg-rect-blue-dashed {
          fill: rgba(30, 41, 59, 0.2) !important;
          stroke: rgba(56, 189, 248, 0.4) !important;
        }
        .aurora-svg-text-primary {
          fill: #1e293b;
          transition: all 0.3s ease;
        }
        .dark .aurora-svg-text-primary {
          fill: #f8fafc !important;
        }
        .aurora-svg-text-secondary {
          fill: #475569;
          transition: all 0.3s ease;
        }
        .dark .aurora-svg-text-secondary {
          fill: #94a3b8 !important;
        }

        .aurora-svg-drive-rect {
          transition: all 0.3s ease;
        }
        .aurora-svg-drive-rect.healthy {
          fill: #f0fdf4;
          stroke: #86efac;
        }
        .aurora-svg-drive-rect.failed {
          fill: #fff1f2;
          stroke: #fecdd3;
        }
        .dark .aurora-svg-drive-rect.healthy {
          fill: rgba(16, 185, 129, 0.15) !important;
          stroke: rgba(16, 185, 129, 0.4) !important;
        }
        .dark .aurora-svg-drive-rect.failed {
          fill: rgba(239, 68, 68, 0.15) !important;
          stroke: rgba(239, 68, 68, 0.4) !important;
        }

        .aurora-svg-chassis-rect {
          transition: all 0.3s ease;
        }
        .aurora-svg-chassis-rect.healthy {
          fill: #f0fdf4;
          stroke: #86efac;
        }
        .aurora-svg-chassis-rect.failed {
          fill: #fff1f2;
          stroke: #ef4444;
        }
        .aurora-svg-chassis-rect.promoted {
          fill: #f5f3ff;
          stroke: #7c3aed;
        }
        .aurora-svg-chassis-rect.replica {
          fill: rgba(255,255,255,0.8);
          stroke: #cbd5e1;
        }
        .dark .aurora-svg-chassis-rect.healthy {
          fill: rgba(16, 185, 129, 0.15) !important;
          stroke: rgba(16, 185, 129, 0.5) !important;
        }
        .dark .aurora-svg-chassis-rect.failed {
          fill: rgba(239, 68, 68, 0.15) !important;
          stroke: rgba(239, 68, 68, 0.5) !important;
        }
        .dark .aurora-svg-chassis-rect.promoted {
          fill: rgba(124, 58, 237, 0.15) !important;
          stroke: rgba(167, 139, 250, 0.5) !important;
        }
        .dark .aurora-svg-chassis-rect.replica {
          fill: rgba(15, 23, 42, 0.6) !important;
          stroke: rgba(51, 65, 85, 0.6) !important;
        }

        /* Developer Notebook styling */
        .aurora-note-title {
          color: var(--color-text-primary);
        }
        .aurora-note-desc {
          color: var(--color-text-secondary);
        }
        .aurora-notebook-label {
          color: var(--color-text-primary);
        }
        .aurora-notebook-copy-btn {
          padding: 4px;
          border-radius: 4px;
          background: var(--color-background-tertiary);
          border: 1px solid var(--color-border-tertiary);
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .aurora-notebook-copy-btn:hover {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
        }
        .aurora-notebook-inner-card {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .aurora-notebook-inner-card-title {
          font-size: 10px;
          font-weight: 800;
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-family: var(--font-mono);
          display: block;
          margin-bottom: 12px;
        }
        .aurora-notebook-inner-subcard-white {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
        }
        .aurora-notebook-inner-subcard-grey {
          background: var(--color-background-tertiary);
          border: 1px solid var(--color-border-tertiary);
        }
        .aurora-notebook-inner-subcard-blue {
          background: #eff6ff;
          border: 1px solid #93c5fd;
        }
        .dark .aurora-notebook-inner-subcard-blue {
          background: rgba(2, 132, 199, 0.15) !important;
          border-color: rgba(56, 189, 248, 0.3) !important;
        }
        .aurora-notebook-inner-subcard-green {
          background: #f0fdf4;
          border: 1px solid #86efac;
        }
        .dark .aurora-notebook-inner-subcard-green {
          background: rgba(16, 185, 129, 0.15) !important;
          border-color: rgba(16, 185, 129, 0.3) !important;
        }
        .aurora-notebook-input {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 4px;
          padding: 4px;
          color: var(--color-text-primary);
          outline: none;
        }

        .failover-step-indicator {
          text-align: center;
          padding: 6px 2px;
          border-radius: 6px;
          font-size: 9.5px;
          font-weight: bold;
          transition: all 0.2s ease;
        }
        .failover-step-indicator.active {
          background: #dcfce7;
          border: 1px solid #86efac;
          color: #15803d;
        }
        .failover-step-indicator.inactive {
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #64748b;
        }
        .dark .failover-step-indicator.active {
          background: rgba(16, 185, 129, 0.15) !important;
          border-color: rgba(16, 185, 129, 0.4) !important;
          color: #4ade80 !important;
        }
        .dark .failover-step-indicator.inactive {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #94a3b8 !important;
        }

        /* Centralized Dark Theme Overrides for .aurora- elements */
        .dark .aurora-container {
          color: var(--color-text-primary) !important;
        }
        .dark .aurora-h {
          color: var(--color-text-primary) !important;
        }
        .dark .aurora-sub {
          color: var(--color-text-secondary) !important;
        }
        .dark .aurora-card {
          background: rgba(15, 23, 42, 0.75) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: var(--color-text-secondary) !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }
        .dark .aurora-card b,
        .dark .aurora-card strong,
        .dark .aurora-card h2,
        .dark .aurora-card h3,
        .dark .aurora-card h4,
        .dark .aurora-card .aurora-card-title {
          color: #ffffff !important;
        }
        .dark .aurora-tabs {
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .aurora-tb {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #94a3b8 !important;
        }
        .dark .aurora-tb:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #f8fafc !important;
        }
        .dark .aurora-tb.aurora-on {
          background: #16a34a !important;
          color: #fff !important;
          border-color: #16a34a !important;
        }
        .dark .aurora-sec {
          color: #cbd5e1 !important;
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .aurora-row {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: var(--color-text-secondary) !important;
        }
        .dark .aurora-svg-bg {
          background-color: #020617 !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          background-image: radial-gradient(rgba(51, 65, 85, 0.4) 1.2px, transparent 1.2px) !important;
        }
        .dark .aurora-btn {
          background: rgba(15, 23, 42, 0.8) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .aurora-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
        }
        .dark .aurora-subtb {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #94a3b8 !important;
        }
        .dark .aurora-subtb:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #f8fafc !important;
        }
        
        /* Theme aware classes for SVG frames and colored buttons */
        .aurora-svg-frame {
          fill: rgba(255, 255, 255, 0.75);
          stroke: #cbd5e1;
          transition: all 0.3s ease;
        }
        .dark .aurora-svg-frame {
          fill: rgba(15, 23, 42, 0.6) !important;
          stroke: rgba(51, 65, 85, 0.6) !important;
        }
        
        .aurora-btn-red {
          border-color: #fca5a5;
          background: #fef2f2;
          color: #b91c1c;
        }
        .dark .aurora-btn-red {
          border-color: rgba(239, 68, 68, 0.4) !important;
          background: rgba(239, 68, 68, 0.15) !important;
          color: #f87171 !important;
        }
        
        .aurora-btn-green {
          border-color: #86efac;
          background: #f0fdf4;
          color: #15803d;
        }
        .dark .aurora-btn-green {
          border-color: rgba(16, 185, 129, 0.4) !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: #4ade80 !important;
        }
      `}</style>

      {/* Header Panel */}
      <div className="mb-6">
        <h1 className="aurora-h">
          {isComparative ? (
            <span>⚖️ Multi-Cloud Cloud-Native Database Comparison — AWS Aurora vs Azure Hyperscale vs GCP Spanner/AlloyDB</span>
          ) : isAzure ? (
            <span>🌌 Azure SQL Database Hyperscale &amp; Cosmos DB for PostgreSQL</span>
          ) : isGcp ? (
            <span>🌌 Google Cloud Spanner &amp; AlloyDB for PostgreSQL</span>
          ) : (
            <span>🌌 Amazon Aurora — Cloud-Native Distributed Database Visualizer</span>
          )}
        </h1>
        <p className="aurora-sub">
          {isComparative ? (
            <span>Side-by-side architectural comparison of enterprise cloud-native relational databases across AWS, Azure, and GCP.</span>
          ) : isAzure ? (
            <span>Multi-tier page server caches, Azure SQL Serverless compute scaling, and cross-region auto-failover groups.</span>
          ) : isGcp ? (
            <span>TrueTime API atomic clock consensus, AlloyDB columnar acceleration, and Cloud Spanner multi-region scaling.</span>
          ) : (
            <span>Explore virtualized shared storage quorums, serverless v2 elastic capacity hubs, point-in-time recovery playbooks, copy-on-write clones, Zero-ETL streams, and in-database ML executors.</span>
          )}
        </p>
      </div>

      {/* Navigation tabs */}
      {!isComparative && (
        <div className="aurora-tabs">
          <button className={`aurora-tb ${activeTab === 'notebook' ? 'aurora-on' : ''}`} onClick={() => setActiveTab('notebook')}>📓 Visual Architect Notes</button>
          <button className={`aurora-tb ${activeTab === 'overview' ? 'aurora-on' : ''}`} onClick={() => setActiveTab('overview')}>💾 1. Shared Storage Quorum</button>
          <button className={`aurora-tb ${activeTab === 'endpoints' ? 'aurora-on' : ''}`} onClick={() => setActiveTab('endpoints')}>🔌 2. Endpoints &amp; Routing</button>
          <button className={`aurora-tb ${activeTab === 'failover' ? 'aurora-on' : ''}`} onClick={() => setActiveTab('failover')}>💥 3. Failover Playbook Stepper</button>
          <button className={`aurora-tb ${activeTab === 'global' ? 'aurora-on' : ''}`} onClick={() => setActiveTab('global')}>🌎 4. Global DR Sync</button>
          <button className={`aurora-tb ${activeTab === 'serverless' ? 'aurora-on' : ''}`} onClick={() => setActiveTab('serverless')}>⚡ 5. Serverless Scaling</button>
          <button className={`aurora-tb ${activeTab === 'cloning' ? 'aurora-on' : ''}`} onClick={() => setActiveTab('cloning')}>🧬 6. Copy-on-Write Clones</button>
          <button className={`aurora-tb ${activeTab === 'hardening' ? 'aurora-on' : ''}`} onClick={() => setActiveTab('hardening')}>🔒 7. Hardening HUD &amp; Analytics</button>
          <button className={`aurora-tb ${activeTab === 'unique' ? 'aurora-on' : ''}`} onClick={() => setActiveTab('unique')}>✨ Unique Features</button>
        </div>
      )}

      {isComparative && (
        <AuroraComparativeView onNavigateToDemo={handleNavigateToDemo} />
      )}

      {!isComparative && activeTab === 'unique' && (
        <UniqueAuroraFeatures provider={provider} />
      )}

      {!isComparative && activeTab !== 'unique' && (
        <>

      {/* Primary Display Card */}
      <div className="aurora-card">

        {/* ==========================================
            TAB 1: STORAGE & QUORUM
            ========================================== */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {isAzure ? 'Storage Engine: Multi-Tier Page Server Caches & RBPEX Local SSD Storage' :
                 isGcp ? 'Storage Engine: Log-Based Sharded Paxos Consensus Storage Engine' :
                 'Storage Engine: Redo Log Replication & Drive Quorum Virtualizations'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {isAzure ? 'Azure SQL Hyperscale decouples compute, log services, and 128 GB sharded page servers with 3-way RBPEX SSD storage redundancy.' :
                 isGcp ? 'AlloyDB and Cloud Spanner sharded log storage uses Paxos consensus sharding (Write consensus quorum ACK) across Availability Zones.' :
                 'Aurora writes ONLY redo log vectors to a shared quorum storage layer replicated 6-ways across 3 AZs.'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', alignItems: 'start' }}>
              <div>
                <svg width="100%" viewBox="0 0 680 400" className="aurora-svg-bg" style={{ display: 'block' }}>
                  <defs>
                    <marker id="arr-g" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                    <marker id="arr-p" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#7c3aed" /></marker>
                  </defs>

                  {/* Region text label */}
                  <text x="340" y="24" textAnchor="middle" fontSize="11" className="aurora-svg-text-secondary" fontWeight="700" letterSpacing="0.05em">
                    {isAzure ? 'VNet — East US (3 Availability Zones)' : isGcp ? 'VPC — us-central1 (3 Availability Zones)' : 'VPC — us-east-1 (3 Availability Zones)'}
                  </text>

                  {/* Compute Layer Frame */}
                  <rect x="20" y="38" width="640" height="72" rx="12" className="aurora-svg-frame" strokeWidth="1" />
                  <text x="340" y="52" textAnchor="middle" fontSize="9" className="aurora-svg-text-secondary" fontWeight="700" letterSpacing="0.05em">
                    {isAzure ? 'AZURE HYPERSCALE COMPUTE FLEET' : isGcp ? 'ALLOYDB / SPANNER COMPUTE FLEET' : 'AURORA ELAPSED COMPUTE FLEET'}
                  </text>
 
                  {/* Primary Instance */}
                  <g transform="translate(40, 60)">
                    <rect width="170" height="38" rx="8" className="aurora-svg-rect-purple" strokeWidth="1.5" />
                    <circle cx="16" cy="19" r="4.5" fill="#7c3aed" className="led-blink" />
                    <text x="30" y="23" fontSize="11.5" className="text-purple" fontWeight="bold">
                      {isAzure ? '✍️ Primary Compute (Z-1)' : isGcp ? '✍️ Leader Node (Zone A)' : '✍️ Primary Writer (AZ-1)'}
                    </text>
                    <rect x="145" y="14" width="16" height="10" rx="3" fill="#10b981" />
                  </g>
 
                  {/* Reader 1 */}
                  <g transform="translate(250, 60)">
                    <rect width="170" height="38" rx="8" className="aurora-svg-rect-blue" strokeWidth="1" />
                    <circle cx="16" cy="19" r="4.5" fill="#3b82f6" className="led-blink" />
                    <text x="30" y="23" fontSize="11.5" className="text-blue" fontWeight="bold">
                      {isAzure ? '📖 Read Replica 1' : isGcp ? '📖 Read Pool Node 1' : '📖 Reader Replica 1'}
                    </text>
                    <rect x="145" y="14" width="16" height="10" rx="3" fill="#3b82f6" />
                  </g>
 
                  {/* Reader 2 */}
                  <g transform="translate(460, 60)">
                    <rect width="170" height="38" rx="8" className="aurora-svg-rect-blue" strokeWidth="1" />
                    <circle cx="16" cy="19" r="4.5" fill="#3b82f6" className="led-blink" />
                    <text x="30" y="23" fontSize="11.5" className="text-blue" fontWeight="bold">
                      {isAzure ? '📖 Read Replica 2' : isGcp ? '📖 Read Pool Node 2' : '📖 Reader Replica 2'}
                    </text>
                    <rect x="145" y="14" width="16" height="10" rx="3" fill="#3b82f6" />
                  </g>
 
                  {/* Shared Storage Frame */}
                  <rect x="20" y="150" width="640" height="230" rx="14" className="aurora-svg-rect-blue-dashed" strokeWidth="1" strokeDasharray="4,2" />
                  <text x="340" y="168" textAnchor="middle" fontSize="9.5" className="text-blue" fontWeight="700" letterSpacing="0.05em">
                    {isAzure ? 'HYPERSCALE MULTI-TIER PAGE SERVERS & RBPEX CACHE STORAGE' :
                     isGcp ? 'ALLOYDB LOG-BASED SHARDED PAXOS CONSENSUS STORAGE LAYER' :
                     'SHARED 6-WAY VIRTUALIZED DISTRIBUTED STORAGE LAYER'}
                  </text>

                  {/* Redo stream paths (static pipelines behind particles) */}
                  <path d="M 125 98 L 125 215" fill="none" stroke="var(--color-border-tertiary)" strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M 125 98 L 125 258" fill="none" stroke="var(--color-border-tertiary)" strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M 335 98 L 340 215" fill="none" stroke="var(--color-border-tertiary)" strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M 335 98 L 340 258" fill="none" stroke="var(--color-border-tertiary)" strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M 545 98 L 555 215" fill="none" stroke="var(--color-border-tertiary)" strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M 545 98 L 555 258" fill="none" stroke="var(--color-border-tertiary)" strokeWidth="1.5" strokeDasharray="3,3" />
 
                  {/* Subnet Zone 1 */}
                  <g transform="translate(35, 185)">
                    <rect width="180" height="150" rx="8" className="aurora-svg-frame" strokeWidth="1" />
                    <text x="90" y="20" textAnchor="middle" fontSize="10.5" className="aurora-svg-text-secondary" fontWeight="bold">
                      {isAzure ? 'Zone 1 (East US 1)' : isGcp ? 'Zone A (us-central1-a)' : 'AZ-1 (us-east-1a)'}
                    </text>
                    
                    <g transform="translate(15, 30)">
                      <rect width="150" height="40" rx="6" className={`aurora-svg-drive-rect ${copies[0] ? 'healthy' : 'failed'}`} strokeWidth="1.5" />
                      <circle cx="15" cy="20" r="3.5" fill={copies[0] ? '#10b981' : '#ef4444'} className={!copies[0] ? 'led-blink' : undefined} />
                      <text x="30" y="24" fontSize="10" className={copies[0] ? 'text-green' : 'text-red'} fontWeight="600">
                        {copies[0] ? (isAzure ? 'Page Server 1 (128GB)' : isGcp ? 'Paxos Log Shard 1' : 'Storage Drive Copy 1') : 'Drive 1 Outage ❌'}
                      </text>
                      {copies[0] && <text x="110" y="34" fontSize="7" className="text-green" fontFamily="monospace">Active ACK</text>}
                    </g>
                    
                    <g transform="translate(15, 85)">
                      <rect width="150" height="40" rx="6" className={`aurora-svg-drive-rect ${copies[1] ? 'healthy' : 'failed'}`} strokeWidth="1.5" />
                      <circle cx="15" cy="20" r="3.5" fill={copies[1] ? '#10b981' : '#ef4444'} className={!copies[1] ? 'led-blink' : undefined} />
                      <text x="30" y="24" fontSize="10" className={copies[1] ? 'text-green' : 'text-red'} fontWeight="600">
                        {copies[1] ? (isAzure ? 'Page Server 2 (128GB)' : isGcp ? 'Paxos Log Shard 2' : 'Storage Drive Copy 2') : 'Drive 2 Outage ❌'}
                      </text>
                      {copies[1] && <text x="110" y="34" fontSize="7" className="text-green" fontFamily="monospace">Active ACK</text>}
                    </g>
                  </g>
 
                  {/* Subnet Zone 2 */}
                  <g transform="translate(250, 185)">
                    <rect width="180" height="150" rx="8" className="aurora-svg-frame" strokeWidth="1" />
                    <text x="90" y="20" textAnchor="middle" fontSize="10.5" className="aurora-svg-text-secondary" fontWeight="bold">
                      {isAzure ? 'Zone 2 (East US 2)' : isGcp ? 'Zone B (us-central1-b)' : 'AZ-2 (us-east-1b)'}
                    </text>
                    
                    <g transform="translate(15, 30)">
                      <rect width="150" height="40" rx="6" className={`aurora-svg-drive-rect ${copies[2] ? 'healthy' : 'failed'}`} strokeWidth="1.5" />
                      <circle cx="15" cy="20" r="3.5" fill={copies[2] ? '#10b981' : '#ef4444'} className={!copies[2] ? 'led-blink' : undefined} />
                      <text x="30" y="24" fontSize="10" className={copies[2] ? 'text-green' : 'text-red'} fontWeight="600">
                        {copies[2] ? (isAzure ? 'Page Server 3 (128GB)' : isGcp ? 'Paxos Log Shard 3' : 'Storage Drive Copy 3') : 'Drive 3 Outage ❌'}
                      </text>
                      {copies[2] && <text x="110" y="34" fontSize="7" className="text-green" fontFamily="monospace">Active ACK</text>}
                    </g>
                    
                    <g transform="translate(15, 85)">
                      <rect width="150" height="40" rx="6" className={`aurora-svg-drive-rect ${copies[3] ? 'healthy' : 'failed'}`} strokeWidth="1.5" />
                      <circle cx="15" cy="20" r="3.5" fill={copies[3] ? '#10b981' : '#ef4444'} className={!copies[3] ? 'led-blink' : undefined} />
                      <text x="30" y="24" fontSize="10" className={copies[3] ? 'text-green' : 'text-red'} fontWeight="600">
                        {copies[3] ? (isAzure ? 'Page Server 4 (128GB)' : isGcp ? 'Paxos Log Shard 4' : 'Storage Drive Copy 4') : 'Drive 4 Outage ❌'}
                      </text>
                      {copies[3] && <text x="110" y="34" fontSize="7" className="text-green" fontFamily="monospace">Active ACK</text>}
                    </g>
                  </g>
 
                  {/* Subnet Zone 3 */}
                  <g transform="translate(465, 185)">
                    <rect width="180" height="150" rx="8" className="aurora-svg-frame" strokeWidth="1" />
                    <text x="90" y="20" textAnchor="middle" fontSize="10.5" className="aurora-svg-text-secondary" fontWeight="bold">
                      {isAzure ? 'Zone 3 (East US 3)' : isGcp ? 'Zone C (us-central1-c)' : 'AZ-3 (us-east-1c)'}
                    </text>
                    
                    <g transform="translate(15, 30)">
                      <rect width="150" height="40" rx="6" className={`aurora-svg-drive-rect ${copies[4] ? 'healthy' : 'failed'}`} strokeWidth="1.5" />
                      <circle cx="15" cy="20" r="3.5" fill={copies[4] ? '#10b981' : '#ef4444'} className={!copies[4] ? 'led-blink' : undefined} />
                      <text x="30" y="24" fontSize="10" className={copies[4] ? 'text-green' : 'text-red'} fontWeight="600">
                        {copies[4] ? (isAzure ? 'Page Server 5 (128GB)' : isGcp ? 'Paxos Log Shard 5' : 'Storage Drive Copy 5') : 'Drive 5 Outage ❌'}
                      </text>
                      {copies[4] && <text x="110" y="34" fontSize="7" className="text-green" fontFamily="monospace">Active ACK</text>}
                    </g>
                    
                    <g transform="translate(15, 85)">
                      <rect width="150" height="40" rx="6" className={`aurora-svg-drive-rect ${copies[5] ? 'healthy' : 'failed'}`} strokeWidth="1.5" />
                      <circle cx="15" cy="20" r="3.5" fill={copies[5] ? '#10b981' : '#ef4444'} className={!copies[5] ? 'led-blink' : undefined} />
                      <text x="30" y="24" fontSize="10" className={copies[5] ? 'text-green' : 'text-red'} fontWeight="600">
                        {copies[5] ? (isAzure ? 'Page Server 6 (128GB)' : isGcp ? 'Paxos Log Shard 6' : 'Storage Drive Copy 6') : 'Drive 6 Outage ❌'}
                      </text>
                      {copies[5] && <text x="110" y="34" fontSize="7" className="text-green" fontFamily="monospace">Active ACK</text>}
                    </g>
                  </g>
 
                  <text x="340" y="365" textAnchor="middle" fontSize="11" className="text-green" fontWeight="bold">
                    Self-Healing Storage rebuilds segments instantly on healthy nodes if sectors fail.
                  </text>
                </svg>
              </div>
 
              <div>
                {/* Drive Quorum Hardening Status */}
                <div className="aurora-card" style={{ marginBottom: '12px', borderTop: '3px solid #10b981' }}>
                  <div className="text-green" style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px' }}>🛠️ Drive Failures &amp; Quorum HUD</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    Replicates data across 6 storage units. Test node failures to observe read/write quorum ACKs.
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px' }}>
                    <div className="aurora-notebook-inner-subcard-grey" style={{ padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9.5px', color: 'var(--color-text-secondary)' }}>Write Quorum (needs 4/6)</div>
                      <div className={copies.filter(Boolean).length >= 4 ? 'text-green' : 'text-red'} style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
                        {copies.filter(Boolean).length >= 4 ? '🟢 Stable ACK' : '🔴 Blocked'} ({copies.filter(Boolean).length}/6)
                      </div>
                    </div>
                    <div className="aurora-notebook-inner-subcard-grey" style={{ padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
                      <div style={{ fontSize: '9.5px', color: 'var(--color-text-secondary)' }}>Read Quorum (needs 3/6)</div>
                      <div className={copies.filter(Boolean).length >= 3 ? 'text-green' : 'text-red'} style={{ fontSize: '13px', fontWeight: 700, marginTop: '2px' }}>
                        {copies.filter(Boolean).length >= 3 ? '🟢 Stable ACK' : '🔴 Blocked'} ({copies.filter(Boolean).length}/6)
                      </div>
                    </div>
                  </div>

                  <div className="aurora-mono aurora-notebook-inner-subcard-grey" style={{ padding: '8px', borderRadius: '6px', minHeight: '52px', fontSize: '9.5px', lineHeight: 1.45 }}>
                    {storageLog}
                  </div>

                  <div className="aurora-btnbar" style={{ marginTop: '8px' }}>
                    <button className="aurora-btn aurora-btn-red" onClick={failOneCopy}>💥 Fail 1 copy</button>
                    <button className="aurora-btn aurora-btn-green" onClick={selfHealStorage}>🔄 Self-heal rebuild</button>
                    <button className="aurora-btn" onClick={resetStorageCopies}>Reset</button>
                  </div>
                </div>

                {/* Auto-Expanding used/allocated simulator */}
                <div className="aurora-card" style={{ borderTop: '3px solid #0284c7' }}>
                  <div className="text-blue" style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px' }}>📈 Dynamic Segment Allocation</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    Storage grows automatically in 10 GB increments as database volume size increases.
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Active Used Size:</span> <b>{usedGb} GB</b>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="115"
                      value={usedGb}
                      onChange={(e) => handleUsedGbChange(Number(e.target.value))}
                      className="aurora-ctrl" style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer', margin: '6px 0' } as React.CSSProperties}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Allocated: <b>{allocatedGb} GB</b></span>
                      <span className={expandColor === '#d97706' ? 'text-orange' : 'text-green'} style={{ fontWeight: 'bold' }}>{expandStatus}</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--color-background-tertiary)', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' }}>
                      <div style={{ height: '100%', width: `${Math.round((usedGb / allocatedGb) * 100)}%`, background: '#2563eb', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 2: ENDPOINTS & ROUTING
            ========================================== */}
        {activeTab === 'endpoints' && (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {isAzure ? 'Database Gateway & Ingress Connection Routing' :
                 isGcp ? 'Instance Networking & AlloyDB / Spanner Ingress Routing' :
                 'Cluster Routing & Endpoint Management'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {isAzure ? 'Configure connections to Primary SQL Gateway, Read-Scale secondary listener, and Azure SQL Serverless REST Endpoints.' :
                 isGcp ? 'Configure connections to AlloyDB Primary IP, Read Pool load-balanced IP, and Cloud SQL / AlloyDB Auth Proxy.' :
                 'Configure connections to Writer, Reader pool, Custom groups, and Serverless Data APIs (HTTPS).'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', alignItems: 'start' }}>
              <div>
                <svg width="100%" viewBox="0 0 680 340" className="aurora-svg-bg" style={{ display: 'block' }}>
                  <defs>
                    <marker id="arr-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#2563eb" /></marker>
                  </defs>

                  {/* App Sources */}
                  <g style={{ cursor: 'pointer' }} onClick={() => setActiveSource('client')}>
                    <rect x="30" y="30" width="160" height="60" rx="10" fill={activeSource === 'client' ? 'rgba(37, 99, 235, 0.1)' : 'var(--color-background-primary)'} stroke={activeSource === 'client' ? '#2563eb' : 'var(--color-border-tertiary)'} strokeWidth={activeSource === 'client' ? 2 : 1} className={activeSource === 'client' ? 'active-glow-node' : undefined} style={{ '--pulse-color': 'rgba(37, 99, 235, 0.25)' } as React.CSSProperties} />
                    <text x="110" y="58" textAnchor="middle" fontSize="12" className={activeSource === 'client' ? 'text-blue' : 'aurora-svg-text-secondary'} fontWeight="bold">💻 Standard OLTP App</text>
                    <text x="110" y="74" textAnchor="middle" fontSize="8.5" fill="#64748b">{isAzure ? 'App Service / AKS' : isGcp ? 'GKE / Cloud Run' : 'Web App / ECS Cluster'}</text>
                  </g>

                  <g style={{ cursor: 'pointer' }} onClick={() => setActiveSource('proxy')}>
                    <rect x="30" y="130" width="160" height="60" rx="10" fill={activeSource === 'proxy' ? 'rgba(124, 58, 237, 0.1)' : 'var(--color-background-primary)'} stroke={activeSource === 'proxy' ? '#7c3aed' : 'var(--color-border-tertiary)'} strokeWidth={activeSource === 'proxy' ? 2 : 1} className={activeSource === 'proxy' ? 'active-glow-node' : undefined} style={{ '--pulse-color': 'rgba(124, 58, 237, 0.25)' } as React.CSSProperties} />
                    <text x="110" y="158" textAnchor="middle" fontSize="12" className={activeSource === 'proxy' ? 'text-purple' : 'aurora-svg-text-secondary'} fontWeight="bold">⚡ Serverless Functions</text>
                    <text x="110" y="174" textAnchor="middle" fontSize="8.5" fill="#64748b">{isAzure ? 'Azure Functions (Private Link)' : isGcp ? 'Cloud Functions (Auth Proxy)' : 'RDS Proxy / TCP Pool'}</text>
                  </g>

                  <g style={{ cursor: 'pointer' }} onClick={() => setActiveSource('analytics')}>
                    <rect x="30" y="230" width="160" height="60" rx="10" fill={activeSource === 'analytics' ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-background-primary)'} stroke={activeSource === 'analytics' ? '#10b981' : 'var(--color-border-tertiary)'} strokeWidth={activeSource === 'analytics' ? 2 : 1} className={activeSource === 'analytics' ? 'active-glow-node' : undefined} style={{ '--pulse-color': 'rgba(16, 185, 129, 0.25)' } as React.CSSProperties} />
                    <text x="110" y="258" textAnchor="middle" fontSize="12" className={activeSource === 'analytics' ? 'text-green' : 'aurora-svg-text-secondary'} fontWeight="bold">📊 Analytics Worker</text>
                    <text x="110" y="274" textAnchor="middle" fontSize="8.5" fill="#64748b">Heavy OLAP Queries</text>
                  </g>

                  {/* Static routes under particles */}
                  <path d="M 190 60 L 270 80" fill="none" stroke="var(--color-border-tertiary)" strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M 450 80 L 520 70" fill="none" stroke="var(--color-border-tertiary)" strokeWidth="1.5" strokeDasharray="3,3" />

                  {/* Endpoints */}
                  <g transform="translate(270, 60)">
                    <rect width="180" height="40" rx="8" fill="rgba(255,255,255,0.9)" stroke={activeSource === 'client' ? '#2563eb' : 'var(--color-border-tertiary)'} strokeWidth={activeSource === 'client' ? 2 : 1} className="aurora-svg-rect" />
                    <text x="90" y="20" textAnchor="middle" fontSize="10.5" fill="#1e293b" fontWeight="bold">✍️ Primary Endpoint</text>
                    <text x="90" y="32" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">
                      {isAzure ? 'sql-hyperscale.database.windows.net' : isGcp ? 'alloydb-primary.internal (10.0.1.5)' : 'cluster.writer.rds.com'}
                    </text>
                  </g>

                  <g transform="translate(270, 150)">
                    <rect width="180" height="40" rx="8" fill="rgba(255,255,255,0.9)" stroke={activeSource === 'analytics' ? '#10b981' : 'var(--color-border-tertiary)'} strokeWidth={activeSource === 'analytics' ? 2 : 1} className="aurora-svg-rect" />
                    <text x="90" y="20" textAnchor="middle" fontSize="10.5" fill="#1e293b" fontWeight="bold">📖 Reader Endpoint</text>
                    <text x="90" y="32" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">
                      {isAzure ? 'sql-hyperscale.database.windows.net (ReadOnly)' : isGcp ? 'alloydb-readpool.internal (10.0.1.6)' : 'cluster.reader-ro.rds.com'}
                    </text>
                  </g>

                  <g transform="translate(270, 240)">
                    <rect width="180" height="40" rx="8" fill="rgba(255,255,255,0.9)" stroke={activeSource === 'proxy' ? '#7c3aed' : 'var(--color-border-tertiary)'} strokeWidth={activeSource === 'proxy' ? 2 : 1} className="aurora-svg-rect" />
                    <text x="90" y="20" textAnchor="middle" fontSize="10.5" fill="#1e293b" fontWeight="bold">🔌 Proxy / REST API</text>
                    <text x="90" y="32" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">
                      {isAzure ? 'private-endpoint.database.windows.net' : isGcp ? 'alloydb-auth-proxy.internal' : 'data-api.ap-region.rds.com'}
                    </text>
                  </g>

                  {/* Compute instances */}
                  <g transform="translate(520, 45)">
                    <rect width="130" height="48" rx="8" className="aurora-svg-rect-orange" strokeWidth="1.5" />
                    <text x="65" y="22" textAnchor="middle" fontSize="11" className="text-orange" fontWeight="bold">Primary Instance</text>
                    <text x="65" y="36" textAnchor="middle" fontSize="9" fill="#16a34a" fontWeight="bold">🟢 Active R/W</text>
                  </g>

                  <g transform="translate(520, 145)">
                    <rect width="130" height="48" rx="8" className="aurora-svg-rect" strokeWidth="1.5" />
                    <text x="65" y="22" textAnchor="middle" fontSize="11" className="aurora-svg-text-primary" fontWeight="bold">Reader Node A</text>
                    <text x="65" y="36" textAnchor="middle" fontSize="9" fill="#2563eb" fontWeight="bold">🔵 Online Reader</text>
                  </g>

                  <g transform="translate(520, 245)">
                    <rect width="130" height="48" rx="8" className="aurora-svg-rect" strokeWidth="1.5" />
                    <text x="65" y="22" textAnchor="middle" fontSize="11" className="aurora-svg-text-primary" fontWeight="bold">Reader Node B</text>
                    <text x="65" y="36" textAnchor="middle" fontSize="9" fill="#2563eb" fontWeight="bold">🔵 Online Reader</text>
                  </g>
                </svg>
              </div>

              <div>
                <div className="aurora-card aurora-card-blue" style={{ paddingLeft: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#1e3a8a' }}>👑 Primary Cluster Endpoint</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                    {isAzure ? 'Routes directly to East US primary database instance. Automatically redirects connections on failovers.' :
                     isGcp ? 'Routes directly to AlloyDB primary instance IP or Spanner leader node in us-central1.' :
                     'Static CNAME routing strictly to N. Virginia primary database instance. Shifts IP addresses automatically on failovers.'}
                  </div>
                </div>
                <div className="aurora-card aurora-card-green" style={{ paddingLeft: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#064e3b' }}>📖 Reader Load-Balanced Endpoint</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                    Spreads heavy read-only SELECT connections across all reader/page-server nodes dynamically via round-robin listeners.
                  </div>
                </div>
                <div className="aurora-card aurora-card-purple" style={{ paddingLeft: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#581c87' }}>🔌 Serverless Proxy &amp; REST API Endpoint</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                    {isAzure ? 'Enables Private Endpoint connectivity and connection pool management for Azure Functions and container workloads.' :
                     isGcp ? 'AlloyDB / Cloud SQL Auth Proxy manages IAM authentication and secure gRPC/TCP connections.' :
                     'Enables HTTP-based SQL execution over standard JSON calls. Eliminates persistent socket limits for Lambda.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: FAILOVER PLAYBOOK STEPPER
            ========================================== */}
        {activeTab === 'failover' && (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {isAzure ? 'Disaster Recovery: High-Availability Failover Stepper' :
                 isGcp ? 'Disaster Recovery: Paxos Leader Election Failover Stepper' :
                 'Disaster Recovery: Sub-30s Failover Playbook Stepper'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {isAzure ? 'Simulate Availability Zone blackout in East US Zone 1 and monitor connection gateway redirection.' :
                 isGcp ? 'Simulate Zone blackout in us-central1-a and monitor seamless Paxos leader re-election.' :
                 'Simulate Availability Zone blackout in us-east-1a and monitor recovery streams.'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '14px', alignItems: 'start' }}>
              <div>
                {/* Interactive State-Reactive Vector Map */}
                <svg width="100%" viewBox="0 0 680 230" className="aurora-svg-bg" style={{ display: 'block', marginBottom: '12px' }}>
                  <defs>
                    <marker id="arr-failover" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#2563eb" /></marker>
                  </defs>

                  <g transform="translate(250, 15)">
                    <rect width="180" height="42" rx="8" fill="rgba(255,255,255,0.9)" stroke="#2563eb" strokeWidth="1.5" />
                    <text x="90" y="20" textAnchor="middle" fontSize="10.5" fill="#1e293b" fontWeight="bold">🔌 Ingress Endpoint Gateway</text>
                    <text x="90" y="32" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">
                      {isAzure ? 'sql-hyperscale.database.windows.net' : isGcp ? 'alloydb-primary.internal' : 'cluster.writer.rds.com'}
                    </text>
                  </g>

                  {/* Static routes */}
                  <path d="M 340 57 L 125 105" fill="none" stroke={writerState === 'dead' ? '#ef4444' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M 340 57 L 335 105" fill="none" stroke={replicaState === 'promoted' ? '#16a34a' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M 340 57 L 545 105" fill="none" stroke="var(--color-border-tertiary)" strokeWidth="1.5" strokeDasharray="3,3" />

                  {/* AZ-1 Instance */}
                  <g transform="translate(40, 105)">
                    <rect width="170" height="72" rx="10" className={`aurora-svg-chassis-rect ${writerState === 'healthy' ? 'healthy' : 'failed'}`} strokeWidth={writerState === 'healthy' ? 1.5 : 2} />
                    <text x="85" y="22" textAnchor="middle" fontSize="11" className={writerState === 'healthy' ? 'text-green' : 'text-red'} fontWeight="bold">
                      {isAzure ? 'Zone 1 (East US 1)' : isGcp ? 'Zone A (us-central1-a)' : 'AZ-1 us-east-1a'}
                    </text>
                    
                    {writerState === 'healthy' ? (
                      <>
                        <text x="85" y="42" textAnchor="middle" fontSize="10" fill="#15803d" fontWeight="600">✍️ Primary Node</text>
                        <circle cx="15" cy="52" r="3.5" fill="#10b981" className="led-blink" />
                        <text x="30" y="55" fontSize="8" fill="#475569">R/W nominal</text>
                      </>
                    ) : (
                      <>
                        <text x="85" y="42" textAnchor="middle" fontSize="10" fill="#b91c1c" fontWeight="bold">💥 Zone Outage</text>
                        <circle cx="15" cy="52" r="3.5" fill="#ef4444" className="led-blink" />
                        <text x="30" y="55" fontSize="8" fill="#b91c1c" fontWeight="bold">Connection lost</text>
                      </>
                    )}
                  </g>

                  {/* AZ-2 Instance */}
                  <g transform="translate(250, 105)">
                    <rect width="170" height="72" rx="10" className={`aurora-svg-chassis-rect ${replicaState === 'promoted' ? 'promoted' : 'replica'}`} strokeWidth={replicaState === 'promoted' ? 2 : 1.5} />
                    <text x="85" y="22" textAnchor="middle" fontSize="11" className="aurora-svg-text-primary" fontWeight="bold">
                      {isAzure ? 'Zone 2 (East US 2)' : isGcp ? 'Zone B (us-central1-b)' : 'AZ-2 us-east-1b'}
                    </text>
                    
                    {replicaState === 'promoted' ? (
                      <>
                        <text x="85" y="42" textAnchor="middle" fontSize="10" fill="#5b21b6" fontWeight="bold">👑 PROMOTED PRIMARY</text>
                        <circle cx="15" cy="52" r="3.5" fill="#10b981" className="led-blink" />
                        <text x="30" y="55" fontSize="8" fill="#7c3aed" fontWeight="bold">Serving reads/writes</text>
                      </>
                    ) : (
                      <>
                        <text x="85" y="42" textAnchor="middle" fontSize="10" fill="#2563eb" fontWeight="600">📖 Reader Replica 1</text>
                        <circle cx="15" cy="52" r="3.5" fill="#3b82f6" className="led-blink" />
                        <text x="30" y="55" fontSize="8" fill="#475569">Standby (Priority 0)</text>
                      </>
                    )}
                  </g>

                  {/* AZ-3 Instance */}
                  <g transform="translate(460, 105)">
                    <rect width="170" height="72" rx="10" className="aurora-svg-rect" strokeWidth="1.5" />
                    <text x="85" y="22" textAnchor="middle" fontSize="11" className="aurora-svg-text-primary" fontWeight="bold">
                      {isAzure ? 'Zone 3 (East US 3)' : isGcp ? 'Zone C (us-central1-c)' : 'AZ-3 us-east-1c'}
                    </text>
                    <text x="85" y="42" textAnchor="middle" fontSize="10" fill="#2563eb" fontWeight="600">📖 Reader Replica 2</text>
                    <circle cx="15" cy="52" r="3.5" fill="#3b82f6" className="led-blink" />
                    <text x="30" y="55" fontSize="8" fill="#475569">Standby (Priority 1)</text>
                  </g>
                </svg>

                {/* Steps Timeline bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '14px', position: 'relative' }}>
                  {[
                    { s: 1, label: '1. Outage Detected' },
                    { s: 2, label: '2. Heartbeat Fence' },
                    { s: 3, label: '3. Gateway Shift' },
                    { s: 4, label: '4. Promotion' },
                    { s: 5, label: '5. Gateway Active' }
                  ].map((step) => (
                    <div key={step.s} className={`failover-step-indicator ${failoverStep >= step.s ? 'active' : 'inactive'}`}>
                      {step.label}
                    </div>
                  ))}
                </div>

                {/* Actions Toolbar */}
                <div className="aurora-btnbar" style={{ marginBottom: '12px' }}>
                  <button className="aurora-btn aurora-primary" disabled={failoverStep === 5} onClick={triggerNextFailoverStep}>Step-by-Step Playbook ➡️</button>
                  <button className="aurora-btn" disabled={failoverStep !== 1} onClick={autoPlayFailover}>Auto-Play Failover Simulator ⚡</button>
                  <button className="aurora-btn" onClick={resetFailoverSim}>Reset cluster state 🔄</button>
                </div>
              </div>

              <div>
                <div className="aurora-card aurora-notebook-inner-subcard-grey" style={{ minHeight: '180px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'monospace' }}>
                    📟 PLAYBOOK TIMELINE STREAMS
                  </div>
                  <div className="aurora-mono" style={{ fontSize: '9.5px', color: '#334155', minHeight: '120px', lineHeight: 1.5 }}>
                    {failoverLogs.map((log, i) => (
                      <div key={i} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)', padding: '4px 0' }}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 4: GLOBAL DB SYNC
            ========================================== */}
        {activeTab === 'global' && (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {isAzure ? 'Auto-Failover Groups: Multi-Region Async Geo-Replication' :
                 isGcp ? 'Cloud Spanner Multi-Region: Paxos Atomic Clock Synchronous Sync' :
                 'Global Database: Hardware-Accelerated Multi-Region Replication'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {isAzure ? 'Azure Auto-Failover Groups replicate transaction log updates from East US (Primary) to West Europe (Secondary) with automatic failover listeners.' :
                 isGcp ? 'Cloud Spanner / AlloyDB cross-region replication streams state updates across global regions using TrueTime atomic clock consensus.' :
                 'Aurora Global Databases bypass SQL engines, replicating redo blocks directly at the storage level in N. Virginia (Primary) and Singapore (Warm Standby).'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', alignItems: 'start' }}>
              <div>
                <svg width="100%" viewBox="0 0 680 240" className="aurora-svg-bg" style={{ display: 'block' }}>
                  <defs>
                    <marker id="arr-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#7c3aed" /></marker>
                  </defs>

                  {/* Primary Region */}
                  <rect x="20" y="30" width="260" height="180" rx="12" className={`aurora-svg-rect ${secRegionState === "replica" ? "active-glow-node" : ""}`} stroke={secRegionState === 'promoted' ? '#fca5a5' : '#c4b5fd'} strokeWidth={secRegionState === 'promoted' ? 1.5 : 2} style={{ '--pulse-color': 'rgba(124, 58, 237, 0.15)' } as React.CSSProperties} />
                  <text x="150" y="52" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="bold">
                    {isAzure ? '🌎 PRIMARY EAST US' : isGcp ? '🌎 PRIMARY IOWA (us-central1)' : '🌎 PRIMARY N. VIRGINIA (us-east-1)'}
                  </text>

                  {secRegionState === 'replica' ? (
                    <g transform="translate(40, 70)">
                      <rect width="220" height="34" rx="6" className="aurora-svg-rect-purple" strokeWidth="1" />
                      <circle cx="15" cy="17" r="3.5" fill="#10b981" className="led-blink" />
                      <text x="30" y="21" fontSize="10" className="text-purple" fontWeight="bold">Active Primary Writer DB</text>
                    </g>
                  ) : (
                    <g transform="translate(40, 70)">
                      <rect width="220" height="34" rx="6" className="aurora-svg-rect-red" strokeWidth="1" />
                      <circle cx="15" cy="17" r="3.5" fill="#ef4444" className="led-blink" />
                      <text x="30" y="21" fontSize="10" fill="#be123c" fontWeight="bold">Catastrophic Outage 💥</text>
                    </g>
                  )}

                  <rect x="40" y="115" width="220" height="34" rx="6" className="aurora-svg-rect" strokeWidth="1" />
                  <text x="150" y="136" textAnchor="middle" fontSize="10.5" fill="#475569">Storage (3-zone redundancy)</text>

                  <rect x="40" y="160" width="220" height="34" rx="6" className="aurora-svg-rect-grey" strokeWidth="1" />
                  <text x="150" y="181" textAnchor="middle" fontSize="10" fill="#1e293b" fontWeight="bold">Global replication channel</text>

                  {/* Secondary Region */}
                  <rect x="400" y="30" width="260" height="180" rx="12" className={`aurora-svg-rect ${secRegionState === "promoted" ? "active-glow-node" : ""}`} stroke={secRegionState === 'promoted' ? '#16a34a' : 'var(--color-border-tertiary)'} strokeWidth={secRegionState === 'promoted' ? 2 : 1.5} style={{ '--pulse-color': 'rgba(22, 163, 74, 0.15)' } as React.CSSProperties} />
                  <text x="530" y="52" textAnchor="middle" fontSize="11" className={secRegionState === 'promoted' ? 'text-green' : 'aurora-svg-text-secondary'} fontWeight="bold">
                    {isAzure ? '🌏 WEST EUROPE' : isGcp ? '🌏 SINGAPORE (asia-southeast1)' : '🌏 SINGAPORE (ap-southeast-1)'}
                  </text>

                  <g transform="translate(420, 70)">
                    <rect width="220" height="34" rx="6" className={secRegionState === 'promoted' ? 'aurora-svg-rect-blue' : 'aurora-svg-rect-grey'} strokeWidth="1" />
                    <circle cx="15" cy="17" r="3.5" fill="#10b981" className="led-blink" />
                    <text x="30" y="21" fontSize="10" fill={secRegionState === 'promoted' ? '#15803d' : '#0f766e'} fontWeight="bold">
                      {secRegionState === 'promoted' ? '👑 Promoted Primary Writer' : '📖 Standby Secondary Pool'}
                    </text>
                  </g>

                  <rect x="420" y="115" width="220" height="34" rx="6" className="aurora-svg-rect" strokeWidth="1" />
                  <text x="530" y="136" textAnchor="middle" fontSize="10.5" fill="#475569">Storage (3-zone redundancy)</text>

                  <rect x="420" y="160" width="220" height="34" rx="6" className="aurora-svg-rect-grey" strokeWidth="1" />
                  <text x="530" y="181" textAnchor="middle" fontSize="10" fill="#1e293b" fontWeight="bold">Active local reads served locally</text>

                  {/* Replication line (WAN) */}
                  <path d="M 280 177 L 400 177" fill="none" stroke={secRegionState === 'replica' ? '#7c3aed' : '#ef4444'} strokeWidth="2.5" strokeDasharray={secRegionState === 'replica' ? '4,4' : '1,5'} className={secRegionState === 'replica' ? 'flow-active-line' : undefined} />
                  
                  {secRegionState === 'replica' && (
                    <>
                      <circle r="3.5" fill="#7c3aed">
                        <animateMotion dur="1.2s" repeatCount="indefinite" path="M 280 177 L 400 177" />
                      </circle>
                      <text x="340" y="165" textAnchor="middle" fontSize="10.5" fill="#7c3aed" fontWeight="bold">Storage sync (lag: &lt;1s)</text>
                    </>
                  )}
                  {secRegionState === 'promoted' && (
                    <text x="340" y="165" textAnchor="middle" fontSize="10.5" fill="#ef4444" fontWeight="bold">❌ DR Sync severed</text>
                  )}
                </svg>
              </div>

              <div>
                <div className="aurora-card" style={{ borderTop: '3px solid #7c3aed' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#581c87', marginBottom: '6px' }}>💥 Global DR Disaster Promotion</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>
                    Test promoting secondary region from read-only to active primary when main region fails.
                  </div>

                  <div className="aurora-mono aurora-notebook-inner-subcard-grey" style={{ padding: '8px', borderRadius: '6px', fontSize: '9.5px', minHeight: '62px',  lineHeight: 1.4, marginBottom: '8px' }}>
                    {globalLogs[0]}
                  </div>

                  <div className="aurora-btnbar">
                    <button className="aurora-btn" style={{ background: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5' }} onClick={triggerGlobalFailover}>💥 Primary Outage</button>
                    <button className="aurora-btn" onClick={resetGlobalDb}>Reset DR link 🔄</button>
                  </div>
                </div>

                <div className="aurora-card">
                  <div style={{ fontWeight: 600, fontSize: '11.5px', color: '#1e293b', marginBottom: '6px' }}>📋 Global DB Metrics</div>
                  <div className="aurora-row" style={{ padding: '6px' }}><span style={{ minWidth: '100px', color: 'var(--color-text-secondary)' }}>RPO (Data Lag)</span><b>{isGcp ? '0 s (Paxos)' : '< 1 second'}</b></div>
                  <div className="aurora-row" style={{ padding: '6px' }}><span style={{ minWidth: '100px', color: 'var(--color-text-secondary)' }}>RTO (Promotion)</span><b>{isGcp ? '< 10s' : '< 1 minute'}</b></div>
                  <div className="aurora-row" style={{ padding: '6px' }}><span style={{ minWidth: '100px', color: 'var(--color-text-secondary)' }}>Target Regions</span><b>Up to 5 Regions</b></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 5: SERVERLESS SCALING
            ========================================== */}
        {activeTab === 'serverless' && (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {isAzure ? 'Azure SQL Serverless: Dynamic vCore Auto-Scaling' :
                 isGcp ? 'AlloyDB / Cloud Spanner Autoscaling: Elastic Capacity Scaling' :
                 'Serverless v2: Instant ACU Compute Auto-Scaling'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {isAzure ? 'Azure SQL Serverless scales vCores up and down dynamically in seconds based on active query load with auto-pause/resume capability.' :
                 isGcp ? 'AlloyDB and Cloud Spanner scale compute units / vCores dynamically to absorb traffic spikes with zero connection drops.' :
                 'Aurora Serverless v2 scales compute capacity (ACUs) up and down dynamically in seconds based on live connections and CPU load.'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', alignItems: 'start' }}>
              <div>
                <div className="aurora-card aurora-notebook-inner-subcard-grey" style={{ padding: '14px', marginBottom: '12px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Simulate Client Connection Spikes (TCP sockets): <b>{connections} active clients</b>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="500"
                    value={connections}
                    onChange={(e) => setConnections(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
                  />
                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', marginTop: '4px', textAlign: 'right' }}>Slider limits: 10 to 500 connections</div>
                </div>

                <div className="aurora-grid3" style={{ marginBottom: '12px' }}>
                  <div className="aurora-k">
                    <div className="t" style={{ color: '#7c3aed' }}>{isAzure ? 'vCores' : isGcp ? 'Units / vCores' : 'Compute ACUs'}</div>
                    <div className="v" style={{ fontSize: '20px' }}>{acu} {isAzure ? 'vCores' : isGcp ? 'Units' : 'ACUs'}</div>
                  </div>
                  <div className="aurora-k">
                    <div className="t" style={{ color: '#10b981' }}>RAM Capacity</div>
                    <div className="v" style={{ fontSize: '20px' }}>{ram}</div>
                  </div>
                  <div className="aurora-k">
                    <div className="t" style={{ color: '#0284c7' }}>Cost Rate</div>
                    <div className="v" style={{ fontSize: '20px' }}>${cost}/hr</div>
                  </div>
                </div>

                <div className="aurora-card" style={{ borderLeft: `4px solid ${scaleColor}`, background: 'rgba(16, 185, 129, 0.15)', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: scaleColor, fontWeight: 'bold' }}>
                    {scaleStatus}
                  </div>
                  <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px', lineHeight: 1.4 }}>
                    {isAzure ? 'Azure SQL Serverless automatically manages vCores and memory allocation, scaling compute seamlessly without interrupting active SQL transactions.' :
                     isGcp ? 'AlloyDB and Spanner autoscaling scales processing units smoothly to match workload spikes without cold starts.' :
                     'Aurora ACU scaling is instantaneous. A single ACU allocates 2 GB RAM with proportionate CPU slices, ensuring memory expands smoothly without cold starts.'}
                  </div>
                </div>
              </div>

              <div>
                <svg width="100%" height="210" viewBox="0 0 240 210" className="aurora-svg-bg" style={{ display: 'block' }}>
                  <text x="120" y="24" textAnchor="middle" fontSize="10.5" className="aurora-svg-text-secondary" fontWeight="700" letterSpacing="0.05em">COMPUTE CAPACITY SCALING HUD</text>

                  <circle cx="120" cy="115" r="56" fill="none" stroke="var(--color-border-tertiary)" strokeWidth="6" />
                  
                  <circle
                    cx="120"
                    cy="115"
                    r="56"
                    fill="none"
                    stroke={scaleColor}
                    strokeWidth="6"
                    strokeDasharray="351.85"
                    strokeDashoffset={351.85 - (351.85 * Math.min(connections, 500) / 500)}
                    strokeLinecap="round"
                    transform="rotate(-90 120 115)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out, stroke 0.5s' }}
                  />
                  
                  <circle cx="120" cy="115" r={Math.min(48, 16 + acu * 1.4)} fill="rgba(37, 99, 235, 0.05)" stroke={scaleColor} strokeWidth="2.5" className="active-glow-node" style={{ '--pulse-color': scaleColor } as React.CSSProperties} />
                  
                  <text x="120" y="112" textAnchor="middle" dominantBaseline="central" fontSize="16" className="aurora-svg-text-primary" fontWeight="800">
                    {acu} {isAzure ? 'vCore' : isGcp ? 'Unit' : 'ACU'}
                  </text>
                  <text x="120" y="128" textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#64748b" fontWeight="600" letterSpacing="0.05em">ALLOCATED CAPACITY</text>

                  <text x="120" y="192" textAnchor="middle" fontSize="9.5" fill="#475569" fontWeight="600" fontFamily="monospace">
                    {isAzure ? '1 vCore ≈ 3 GB RAM' : isGcp ? '1 Unit ≈ 2.5 GB RAM' : '1 ACU = 2 GB RAM'}
                  </text>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 6: COPY-ON-WRITE CLONING
            ========================================== */}
        {activeTab === 'cloning' && (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {isAzure ? 'Azure SQL Hyperscale Fast Copy & Clone Virtualization' :
                 isGcp ? 'AlloyDB / Cloud Spanner On-Demand Copy-on-Write Cloning' :
                 'Copy-on-Write Database Cloning Virtualization'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {isAzure ? 'Azure SQL Hyperscale creates fast staging clones in seconds using Page Server snapshot pointers without copying physical storage files.' :
                 isGcp ? 'AlloyDB and Spanner clones create instant staging pointers across sharded storage blocks at zero initial storage overhead.' :
                 'Aurora Database Clones are created instantly (under 3s) at zero initial storage cost, sharing identical physical data blocks with production.'}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', alignItems: 'start' }}>
              <div>
                <svg width="100%" viewBox="0 0 680 260" className="aurora-svg-bg" style={{ display: 'block' }}>
                  <defs>
                    <marker id="arr-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#7c3aed" /></marker>
                  </defs>

                  <g transform="translate(30, 20)">
                    <rect width="180" height="52" rx="10" className="aurora-svg-rect-blue" stroke="#10b981" strokeWidth="1.5" />
                    <text x="90" y="24" textAnchor="middle" fontSize="11" className="text-green" fontWeight="bold">🏭 Production Writer DB</text>
                    <text x="90" y="38" textAnchor="middle" fontSize="8.5" fill="#065f46" fontFamily="monospace">Active Volume size: 100 TB</text>
                  </g>

                  <g transform="translate(470, 20)">
                    <rect width="180" height="52" rx="10" className="aurora-svg-rect-purple" stroke="#7c3aed" strokeWidth="1.5" />
                    <text x="90" y="24" textAnchor="middle" fontSize="11" className="text-purple" fontWeight="bold">🧬 Dev/Staging Clone DB</text>
                    <text x="90" y="38" textAnchor="middle" fontSize="8.5" fill="#5b21b6" fontFamily="monospace">Virtual Volume size: 100 TB</text>
                  </g>

                  <rect x="30" y="105" width="620" height="135" rx="14" className="aurora-svg-rect-blue-dashed" stroke="#10b981" strokeWidth="1" strokeDasharray="4,2" />
                  <text x="340" y="122" textAnchor="middle" fontSize="9.5" className="text-green" fontWeight="700" letterSpacing="0.05em">SHARED VIRTUAL STORAGE VOLUMES (COPY-ON-WRITE BLOCKS)</text>

                  <g transform="translate(50, 140)">
                    <rect width="130" height="38" rx="6" className="aurora-svg-rect" strokeWidth="1.5" />
                    <text x="65" y="23" textAnchor="middle" fontSize="9.5" className="aurora-svg-text-primary" fontWeight="bold">Block A (Shared)</text>
                    <rect x="105" y="6" width="16" height="8" rx="2" fill="#10b981" />
                  </g>

                  <g transform="translate(195, 140)">
                    <rect width="130" height="38" rx="6" className="aurora-svg-rect" strokeWidth="1.5" />
                    <text x="65" y="23" textAnchor="middle" fontSize="9.5" className="aurora-svg-text-primary" fontWeight="bold">Block B (Shared)</text>
                    <rect x="105" y="6" width="16" height="8" rx="2" fill="#10b981" />
                  </g>

                  <g transform="translate(340, 140)">
                    <rect width="130" height="38" rx="6" className="aurora-svg-rect" strokeWidth="1.5" />
                    <text x="65" y="23" textAnchor="middle" fontSize="9.5" className="aurora-svg-text-primary" fontWeight="bold">Block C (Shared)</text>
                    <rect x="105" y="6" width="16" height="8" rx="2" fill="#10b981" />
                  </g>

                  <g transform="translate(485, 140)">
                    <rect width="150" height="38" rx="6" className={cloneWrites > 0 ? 'aurora-svg-rect-orange active-glow-node' : 'aurora-svg-rect'} stroke={cloneWrites > 0 ? '#f59e0b' : 'var(--color-border-tertiary)'} strokeWidth={cloneWrites > 0 ? 2 : 1.5} style={{ '--pulse-color': 'rgba(245,158,11,0.4)' } as React.CSSProperties} />
                    <text x="75" y="23" textAnchor="middle" fontSize="9.5" className={cloneWrites > 0 ? 'text-orange' : 'aurora-svg-text-primary'} fontWeight="bold">
                      {cloneWrites > 0 ? `Diverged #${cloneWrites}` : 'Block D (Shared)'}
                    </text>
                    <rect x="120" y="6" width="18" height="8" rx="2" fill={cloneWrites > 0 ? '#f59e0b' : '#10b981'} />
                  </g>
                </svg>

                <div className="aurora-btnbar" style={{ marginTop: '10px' }}>
                  <button className="aurora-btn aurora-primary" onClick={simulateCloneWrite}>✍️ Execute Write on Clone DB (Mutate Block)</button>
                  <button className="aurora-btn" onClick={resetCloneSim}>Reset Clone Sandbox 🔄</button>
                </div>
              </div>

              <div>
                <div className="aurora-card aurora-notebook-inner-subcard-grey" style={{ minHeight: '210px' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'monospace' }}>
                    📟 COPY-ON-WRITE METADATA LOGS
                  </div>
                  <div className="aurora-mono" style={{ fontSize: '9.5px', color: '#334155', minHeight: '150px', lineHeight: 1.5 }}>
                    {cloneLog.map((log, i) => (
                      <div key={i} style={{ borderBottom: '0.5px solid var(--color-border-tertiary)', padding: '4px 0' }}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 7: HARDENING HUD & ANALYTICS
            ========================================== */}
        {activeTab === 'hardening' && (
          <div>
            <div className="aurora-subtabs">
              <button className={`aurora-subtb ${activeFeatureTab === 'security' ? 'aurora-on' : ''}`} onClick={() => setActiveFeatureTab('security')}>🔒 Security HUD &amp; Checklist</button>
              <button className={`aurora-subtb ${activeFeatureTab === 'zeroetl' ? 'aurora-on' : ''}`} onClick={() => setActiveFeatureTab('zeroetl')}>⚡ Zero-ETL Analytics Pipeline</button>
              <button className={`aurora-subtb ${activeFeatureTab === 'ml' ? 'aurora-on-purple' : ''}`} onClick={() => setActiveFeatureTab('ml')}>🤖 In-Database SQL ML Sandbox</button>
            </div>

            {/* Sub-tab 7.1: Security HUD */}
            {activeFeatureTab === 'security' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                      {isAzure ? 'Azure SQL Database Security Hardening Checklist' :
                       isGcp ? 'Google Cloud Spanner / AlloyDB Security Hardening Checklist' :
                       'Amazon Aurora Database Security Hardening Checklist'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                      Audit key security recommendations to achieve an A+ database security hardening score.
                    </div>

                    <div className="space-y-2">
                      {secChecks.map((check, idx) => (
                        <div key={idx} className="aurora-row" style={{ cursor: 'pointer' }} onClick={() => toggleSecCheck(idx)}>
                          <input type="checkbox" checked={check.done} onChange={() => {}} style={{ accentColor: '#16a34a', cursor: 'pointer' }} />
                          <span style={{ fontSize: '11.5px', color: check.done ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', textDecoration: check.done ? 'none' : 'none' }}>
                            {check.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="aurora-card" style={{ textAlign: 'center', borderTop: `4px solid ${gradeColor}` }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Hardening Score</div>
                      <div style={{ fontSize: '42px', fontWeight: 900, color: gradeColor, margin: '4px 0' }}>{grade}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)' }}>{scorePct}% Audit Passed</div>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                        {passedChecksCount} of {totalChecksCount} hardening requirements satisfied
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 7.2: Zero-ETL Streaming */}
            {activeFeatureTab === 'zeroetl' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '14px', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                      {isAzure ? '⚡ Azure Synapse Link & Fabric Lakehouse Zero-ETL Pipeline' :
                       isGcp ? '⚡ Datastream to BigQuery Real-Time Zero-ETL Pipeline' :
                       '⚡ Amazon Aurora Zero-ETL to Redshift Integration'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                      {isAzure ? 'Replicates database WAL change feeds directly into Synapse / Fabric Lakehouse for zero-ETL analytics.' :
                       isGcp ? 'Streams AlloyDB / Spanner WAL logs directly into BigQuery data warehouse with sub-second replication lag.' :
                       'Replicates transactional redo WAL logs directly to Amazon Redshift without custom data engineering ETL pipelines.'}
                    </div>

                    <svg width="100%" viewBox="0 0 680 160" className="aurora-svg-bg" style={{ display: 'block', marginBottom: '12px' }}>
                      <g transform="translate(30, 40)">
                        <rect width="190" height="70" rx="10" className="aurora-svg-rect-blue" stroke="#2563eb" strokeWidth="1.5" />
                        <text x="95" y="32" textAnchor="middle" fontSize="12" className="text-blue" fontWeight="bold">
                          {isAzure ? 'Azure SQL Hyperscale' : isGcp ? 'AlloyDB / Spanner' : 'Amazon Aurora DB'}
                        </text>
                        <text x="95" y="50" textAnchor="middle" fontSize="9" fill="#475569">Transactional Engine (OLTP)</text>
                      </g>

                      <g transform="translate(460, 40)">
                        <rect width="190" height="70" rx="10" className="aurora-svg-rect-green" stroke="#16a34a" strokeWidth="1.5" />
                        <text x="95" y="32" textAnchor="middle" fontSize="12" className="text-green" fontWeight="bold">
                          {isAzure ? 'Synapse / Fabric' : isGcp ? 'BigQuery Warehouse' : 'Amazon Redshift'}
                        </text>
                        <text x="95" y="50" textAnchor="middle" fontSize="9" fill="#475569">Analytical Warehouse (OLAP)</text>
                      </g>

                      <path d="M 220 75 L 460 75" fill="none" stroke={zeroEtlStatus === 'syncing' ? '#10b981' : '#cbd5e1'} strokeWidth="2.5" strokeDasharray={zeroEtlStatus === 'syncing' ? '4,4' : '2,2'} className={zeroEtlStatus === 'syncing' ? 'flow-active-line' : undefined} />

                      {zeroEtlStatus === 'syncing' && (
                        <circle r="4" fill="#10b981" className="active-glow-node" style={{ '--pulse-color': 'rgba(16,185,129,0.4)' } as React.CSSProperties}>
                          <animateMotion dur="1s" repeatCount="indefinite" path="M 220 75 L 460 75" />
                        </circle>
                      )}
                    </svg>
                  </div>

                  <div>
                    <div className="aurora-card" style={{ borderTop: '3px solid #10b981' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: '#166534', marginBottom: '6px' }}>⚡ Start analytical syncing</div>
                      <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>
                        Test starting real-time log-structured Zero-ETL pipeline sync logs.
                      </div>

                      <div className="aurora-mono aurora-notebook-inner-subcard-grey" style={{ padding: '8px', borderRadius: '6px', fontSize: '9.5px', minHeight: '62px',  lineHeight: 1.45, marginBottom: '8px' }}>
                        {zeroEtlLogs.length === 0 ? (
                          <span style={{ color: 'var(--color-text-secondary)' }}>Click "Initiate Zero-ETL Sync" to monitor continuous synchronization.</span>
                        ) : zeroEtlLogs.map((log, i) => <div key={i}>{log}</div>)}
                      </div>

                      <div className="aurora-btnbar">
                        <button className="aurora-btn aurora-primary" disabled={zeroEtlStatus === 'syncing'} onClick={zeroEtlLogs.length > 0 ? () => setZeroEtlLogs([]) : runZeroEtlSync}>
                          {zeroEtlLogs.length > 0 ? 'Clear sync logs 🔄' : (isAzure ? 'Initiate Synapse Link Sync 🚀' : isGcp ? 'Initiate Datastream BigQuery Sync 🚀' : 'Initiate Zero-ETL Redshift Sync 🚀')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 7.3: In-Database ML Inference */}
            {activeFeatureTab === 'ml' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '14px', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>🤖 SQL Machine Learning &amp; AI Query Sandbox</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                      {isAzure ? 'Azure SQL Database supports calling Azure OpenAI REST models directly from T-SQL stored procedures.' :
                       isGcp ? 'AlloyDB and Cloud Spanner support direct Vertex AI predictions using ml_predict_row in SQL SELECT statements.' :
                       'Aurora PostgreSQL and MySQL support direct, real-time machine learning inferences inside standard SELECT queries.'}
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <button className={`aurora-subtb ${activeMlQuery === 'sentiment' ? 'aurora-on-purple' : ''}`} onClick={() => { setActiveMlQuery('sentiment'); setMlOutput([]); setMlLogs([]); }}>
                        🗣️ Sentiment {isAzure ? 'Azure OpenAI' : isGcp ? 'Vertex AI' : 'Comprehend'}
                      </button>
                      <button className={`aurora-subtb ${activeMlQuery === 'fraud' ? 'aurora-on-purple' : ''}`} onClick={() => { setActiveMlQuery('fraud'); setMlOutput([]); setMlLogs([]); }}>
                        💳 Transaction {isAzure ? 'Azure ML' : isGcp ? 'Vertex AI Fraud' : 'SageMaker'}
                      </button>
                      <button className={`aurora-subtb ${activeMlQuery === 'churn' ? 'aurora-on-purple' : ''}`} onClick={() => { setActiveMlQuery('churn'); setMlOutput([]); setMlLogs([]); }}>
                        📈 Customer Churn Classifier
                      </button>
                    </div>

                    <div className="aurora-code-container" style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '12px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)' }}>
                      <div className="aurora-code" style={{ color: '#38bdf8', fontSize: '10.5px', textShadow: '0 0 2px rgba(56,189,248,0.2)' }}>
                        {mlQueries[activeMlQuery]?.sql}
                      </div>
                    </div>
                    <button className="aurora-btn aurora-primary" style={{ background: '#7c3aed', borderColor: '#7c3aed', width: '100%', justifyContent: 'center', marginTop: '8px' }} onClick={runMlInference}>
                      ⚡ Execute ML Inference Query inside DB
                    </button>
                  </div>

                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="aurora-notebook-inner-subcard-grey" style={{ borderRadius: '8px', padding: '10px' }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: '4px' }}>📟 ML CLUSTER INFERENCE STREAMS</div>
                        <div className="aurora-mono aurora-note-desc" style={{ fontSize: '9px', minHeight: '62px', lineHeight: 1.45 }}>
                          {mlIsLoading ? (
                            <div style={{ color: '#b45309', animation: 'activeNodePulse 1.2s infinite', '--pulse-color': 'rgba(180, 83, 9, 0.4)' } as React.CSSProperties}>
                              Connecting to inference nodes... 🚀
                            </div>
                          ) : mlLogs.length === 0 ? (
                            <span style={{ color: 'var(--color-text-secondary)' }}>Click "Execute ML Inference Query inside DB" to monitor transactions.</span>
                          ) : mlLogs.map((log, i) => <div key={i}>{log}</div>)}
                        </div>
                      </div>

                      {mlOutput.length > 0 && (
                        <div className="aurora-notebook-inner-subcard-white" style={{ borderRadius: '8px', padding: '10px' }}>
                          <div style={{ fontSize: '10.5px', color: '#047857', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: '4px' }}>📊 SQL RESULT COLUMN VALUES</div>
                          <table className="aurora-table" style={{ fontSize: '9.5px' }}>
                            <thead>
                              <tr style={{ background: '#f1f5f9' }}>
                                <th style={{ padding: '4px' }}>Feedback Content/Metric</th>
                                <th style={{ padding: '4px' }}>Prediction Column</th>
                                <th style={{ padding: '4px' }}>Confidence Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {mlOutput.map((row, i) => (
                                <tr key={i}>
                                  <td style={{ padding: '4px' }}>{row.feedback}</td>
                                  <td className={row.sentiment.includes('NEGATIVE') || row.sentiment.includes('HIGH') ? 'text-red' : 'text-green'} style={{ padding: '4px', fontWeight: 'bold' }}>{row.sentiment}</td>
                                  <td className="text-blue" style={{ padding: '4px' }}>{row.conf}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 8: VISUAL ARCHITECT NOTES (DEVELOPER ACADEMY)                         */}
        {/* ========================================================================= */}
        {activeTab === 'notebook' && (
          <div className="space-y-6 animate-fadeIn text-left" style={{ color: 'var(--color-text-primary)' }}>
            
            <div className="card text-left">
              <h2 className="text-xl font-bold flex items-center gap-2 font-display aurora-note-title">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                {isAzure ? 'Azure SQL Database Hyperscale Academy' :
                 isGcp ? 'GCP Cloud Spanner & AlloyDB Academy' :
                 'AWS Amazon Aurora Academy'}
              </h2>
              <p className="text-xs mt-1.5 leading-relaxed font-sans font-semibold aurora-note-desc">
                {isAzure ? 'A premium, high-fidelity visual workbook covering Azure Hyperscale Page Server SSD caching, Log Service separation, Auto-failover Groups, and Synapse Link HTAP sync.' :
                 isGcp ? 'A premium, high-fidelity visual workbook covering TrueTime API atomic clock consensus, AlloyDB columnar acceleration, Cloud Spanner Paxos sharding, and Vertex AI integrations.' :
                 'A premium, high-fidelity visual workbook covering 6-way storage replication quorums, cluster endpoints routing logic, failover priority promotions, database Copy-on-Write cloning, and native ML inferences.'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Sidebar Category Explorer */}
              <div className="lg:col-span-3 space-y-4 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest block pl-1 font-mono aurora-note-desc">Module Explorer Directory:</span>
                
                <div className="acad-dir-container">
                  <div className="acad-dir-header">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Module Explorer</span>
                  </div>

                  {/* CATEGORY 1: STORAGE ARCHITECTURE */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'aurora_storage' ? '' : 'aurora_storage')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                        1. Storage Architecture
                      </span>
                      {expandedCategory === 'aurora_storage' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'aurora_storage' && (
                      <div className="acad-dir-subfolder py-1 font-semibold">
                        <button 
                          onClick={() => setSelectedNote('shared_storage')}
                          className={`acad-dir-item-btn ${selectedNote === 'shared_storage' ? 'acad-active' : ''}`}
                        >
                          {isAzure ? 'Page Server SSD Shards' : isGcp ? 'Paxos Consensus Shards' : '6-Way Quorum Replicas'}
                        </button>
                        <button 
                          onClick={() => setSelectedNote('log_structured')}
                          className={`acad-dir-item-btn ${selectedNote === 'log_structured' ? 'acad-active' : ''}`}
                        >
                          Log-Structured Storage
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CATEGORY 2: ROUTING & FAILOVER */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'routing_failover' ? '' : 'routing_failover')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-indigo-500" />
                        2. Routing &amp; Failover
                      </span>
                      {expandedCategory === 'routing_failover' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'routing_failover' && (
                      <div className="acad-dir-subfolder py-1 font-semibold">
                        <button 
                          onClick={() => setSelectedNote('endpoints_routing')}
                          className={`acad-dir-item-btn ${selectedNote === 'endpoints_routing' ? 'acad-active' : ''}`}
                        >
                          Gateway &amp; Endpoints
                        </button>
                        <button 
                          onClick={() => setSelectedNote('failover_priority')}
                          className={`acad-dir-item-btn ${selectedNote === 'failover_priority' ? 'acad-active' : ''}`}
                        >
                          Failover Promotion Math
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CATEGORY 3: ADVANCED STORAGE */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'advanced_storage' ? '' : 'advanced_storage')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Network className="w-3.5 h-3.5 text-teal-500" />
                        3. Advanced Storage
                      </span>
                      {expandedCategory === 'advanced_storage' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'advanced_storage' && (
                      <div className="acad-dir-subfolder py-1 font-semibold">
                        <button 
                          onClick={() => setSelectedNote('db_cloning')}
                          className={`acad-dir-item-btn ${selectedNote === 'db_cloning' ? 'acad-active' : ''}`}
                        >
                          Copy-on-Write Cloning
                        </button>
                        <button 
                          onClick={() => setSelectedNote('backtrack_pitr')}
                          className={`acad-dir-item-btn ${selectedNote === 'backtrack_pitr' ? 'acad-active' : ''}`}
                        >
                          Backtrack &amp; Recovery
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CATEGORY 4: DB INTEGRATIONS */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'integrations' ? '' : 'integrations')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-red-500" />
                        4. DB Integrations
                      </span>
                      {expandedCategory === 'integrations' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'integrations' && (
                      <div className="bg-slate-50/50 py-1 font-semibold">
                        <button 
                          onClick={() => setSelectedNote('zero_etl')}
                          className={`acad-dir-item-btn ${selectedNote === 'zero_etl' ? 'acad-active' : ''}`}
                        >
                          {isAzure ? 'Synapse Link Sync' : isGcp ? 'Datastream BigQuery' : 'Zero-ETL Warehouse sync'}
                        </button>
                        <button 
                          onClick={() => setSelectedNote('in_database_ml')}
                          className={`acad-dir-item-btn ${selectedNote === 'in_database_ml' ? 'acad-active' : ''}`}
                        >
                          SQL Machine Learning
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="aurora-notebook-advice-box rounded-2xl p-4 text-[11px] leading-relaxed space-y-1">
                  <span className="text-slate-800 font-extrabold flex items-center gap-1.5 mb-1 text-[11.5px]">
                    <Info className="w-3.5 h-3.5 text-emerald-600" /> Academy Advice
                  </span>
                  "Select any database module topic in the tree directory to load interactive widgets, calculations, and infrastructure configurations."
                </div>
              </div>

              {/* Right Active Note Workspace */}
              <div className="lg:col-span-9 space-y-6 text-left">

                {/* NOTE 1: STORAGE ARCHITECTURE */}
                {selectedNote === 'shared_storage' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Cloud-Native Storage</span>
                        <h3 className="text-xl font-black mt-2 font-display aurora-note-title">
                          {isAzure ? 'Azure SQL Hyperscale Multi-Tier Page Servers' :
                           isGcp ? 'Google Cloud Spanner & AlloyDB Paxos Consensus Shards' :
                           'Amazon Aurora Shared Storage 6-Way Quorum'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('overview')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Storage Quorum
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 1 of 8</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed aurora-note-desc">
                      {isAzure ? 'Azure SQL Hyperscale decouples database compute from storage using Page Servers sharded into 128 GB data pools with local RBPEX SSD caches and a dedicated Log Service.' :
                       isGcp ? 'Cloud Spanner and AlloyDB decouple compute and storage into Paxos sharded consensus groups, streaming log updates with external consistency.' :
                       'Traditional databases replicate data by writing full page blocks to local EBS volumes. Amazon Aurora decouples compute from storage, utilizing a virtualized shared storage volume replicated 6-ways across 3 AZs.'}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs aurora-note-desc">
                        <span className="font-extrabold block aurora-notebook-label">Storage Mathematics &amp; Quorums:</span>
                        
                        <ul className="list-disc pl-4 space-y-2">
                          <li>
                            <strong className="aurora-notebook-label">Write Quorum (4/6):</strong> A write is committed once 4 copies acknowledge receipt of the redo vectors, surviving the loss of an entire Availability Zone without write downtime.
                          </li>
                          <li>
                            <strong className="aurora-notebook-label">Read Quorum (3/6):</strong> Read operations verify sequence LSN markers across 3 node confirmations for up-to-date reads.
                          </li>
                        </ul>

                        <div className="acad-takeaway-box font-sans">
                          <strong>💡 Rebuild Performance:</strong> Background storage nodes self-heal automatically by streaming missing log vectors from healthy nodes in seconds.
                        </div>
                      </div>

                      {/* Visual HCL Code block */}
                      <div className="flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider font-mono aurora-note-desc">Terraform Infrastructure Snippet</span>
                          <button 
                            onClick={() => {
                              const code = isAzure ? terraformAzureHyperscaleCode : isGcp ? terraformGcpAlloyDbCode : terraformAuroraClusterCode;
                              navigator.clipboard.writeText(code);
                              setCopiedNoteId('tf-code');
                              setTimeout(() => setCopiedNoteId(null), 2000);
                            }}
                            className="aurora-notebook-copy-btn"
                          >
                            {copiedNoteId === 'tf-code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <pre className="acad-terminal text-[10px] leading-relaxed overflow-x-auto h-64">
                          {isAzure ? terraformAzureHyperscaleCode : isGcp ? terraformGcpAlloyDbCode : terraformAuroraClusterCode}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 2: LOG-STRUCTURED STORAGE */}
                {selectedNote === 'log_structured' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Replication Engine</span>
                        <h3 className="text-xl font-black mt-2 font-display aurora-note-title">"The Log is the Database" Architecture</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('overview')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Storage Quorum
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 2 of 8</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed aurora-note-desc">
                      In traditional database engines, modified pages in the buffer pool are periodically flushed to storage. Cloud-native engines write only redo log vectors to storage, avoiding heavy page write operations.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs aurora-note-desc">
                        <span className="font-extrabold block aurora-notebook-label">Redo-Only Storage Streaming:</span>
                        <p className="leading-relaxed">
                          When a transaction commits, the engine streams <strong>only the redo log vectors</strong> directly to storage nodes. The storage nodes reconstruct relational pages in the background when a read occurs.
                        </p>

                        <div className="acad-takeaway-box">
                          <strong>⚡ Performance Results:</strong> By writing only redo logs, network write I/O is reduced by <strong>up to 90%</strong>, delivering up to 5x higher throughput!
                        </div>
                      </div>

                      <div className="aurora-notebook-inner-card rounded-xl p-4 flex flex-col justify-center text-center font-mono text-xs">
                        <span className="aurora-notebook-inner-card-title block mb-4">Replication Pipeline Comparison</span>
                        
                        <div className="space-y-3 text-left max-w-xs mx-auto">
                          <div className="aurora-notebook-inner-subcard-white p-2.5 rounded-lg">
                            <span className="text-red font-bold font-mono">Standard Engine Pipeline:</span>
                            <p className="text-slate-500 mt-0.5 text-[9.5px]">App commits &rarr; writes WAL &rarr; flushes heavy data pages &rarr; syncs secondary storage.</p>
                          </div>
                          <div className="aurora-notebook-inner-subcard-white p-2.5 rounded-lg">
                            <span className="text-green font-bold font-mono">Cloud-Native Engine Pipeline:</span>
                            <p className="text-slate-500 mt-0.5 text-[9.5px]">App commits &rarr; streams lightweight redo log vectors to storage. Storage handles page reconstruction in background.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 3: CLUSTER ENDPOINTS */}
                {selectedNote === 'endpoints_routing' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Routing Ingress</span>
                        <h3 className="text-xl font-black mt-2 font-display aurora-note-title">
                          {isAzure ? 'Azure SQL Gateway & Private Endpoint Routing' :
                           isGcp ? 'AlloyDB / Spanner IP & Auth Proxy Ingress Routing' :
                           'Aurora DNS Endpoint Mappings'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('endpoints')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Endpoints
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 3 of 8</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed aurora-note-desc">
                      Cloud-native databases provide multiple ingress endpoints that separate transactional write traffic from read-only analytical query workloads.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs aurora-note-desc">
                        <h4 className="font-bold text-xs aurora-notebook-label">Types of Endpoints:</h4>
                        
                        <ul className="list-disc pl-4 space-y-2">
                          <li>
                            <strong className="aurora-notebook-label">Primary Endpoint:</strong> Points directly to the current primary writer node for insert, update, and delete traffic.
                          </li>
                          <li>
                            <strong className="aurora-notebook-label">Reader Endpoint:</strong> Load-balances read-only traffic across all active read replicas in the cluster.
                          </li>
                          <li>
                            <strong className="aurora-notebook-label">Proxy / Private Endpoint:</strong> Manages authentication, connection pooling, and secure private network connectivity.
                          </li>
                        </ul>
                      </div>

                      <div className="aurora-notebook-inner-card rounded-xl p-4 flex flex-col justify-center font-mono text-[10.5px]">
                        <span className="aurora-notebook-inner-card-title block mb-3 text-center">Endpoint Routing Matrix</span>
                        
                        <div className="space-y-2.5">
                          <div className="aurora-notebook-inner-subcard-white p-2 rounded-lg flex items-center justify-between">
                            <span className="text-slate-600 font-semibold font-mono">
                              {isAzure ? 'sql-hyperscale.database.windows.net' : isGcp ? 'alloydb-primary.internal' : 'cluster-writer.rds.amazonaws.com'}
                            </span>
                            <span className="text-red font-bold">&rarr; Primary Node</span>
                          </div>
                          <div className="aurora-notebook-inner-subcard-white p-2 rounded-lg flex items-center justify-between">
                            <span className="text-slate-600 font-semibold font-mono">
                              {isAzure ? 'sql-hyperscale (ApplicationIntent=ReadOnly)' : isGcp ? 'alloydb-readpool.internal' : 'cluster-reader.rds.amazonaws.com'}
                            </span>
                            <span className="text-blue font-bold">&rarr; Reader Pool</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 4: FAILOVER PROMOTION */}
                {selectedNote === 'failover_priority' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Cluster High Availability</span>
                        <h3 className="text-xl font-black mt-2 font-display aurora-note-title">Failover Priorities &amp; Promotion Mechanics</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('failover')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Failover Stepper
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 4 of 8</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed aurora-note-desc">
                      If the primary database instance suffers a hardware outage, the cluster automatically promotes one of the read replicas to be the new writer in under 30 seconds.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="aurora-notebook-inner-card rounded-xl p-4 flex flex-col justify-between space-y-4">
                        <div>
                          <span className="aurora-notebook-inner-card-title block mb-2">Failover Priority Calculator</span>
                          
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center text-slate-650">
                              <span className="font-semibold font-mono">Replica 1 (AZ-A) Promotion Tier</span>
                              <select 
                                value={nbReplica1Tier} 
                                onChange={(e) => setNbReplica1Tier(parseInt(e.target.value))}
                                className="aurora-notebook-input rounded p-1 outline-none"
                              >
                                {Array.from({ length: 5 }, (_, i) => (
                                  <option key={i} value={i}>Tier {i}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex justify-between items-center text-slate-650">
                              <span className="font-semibold font-mono">Replica 2 (AZ-B) Promotion Tier</span>
                              <select 
                                value={nbReplica2Tier} 
                                onChange={(e) => setNbReplica2Tier(parseInt(e.target.value))}
                                className="aurora-notebook-input rounded p-1 outline-none"
                              >
                                {Array.from({ length: 5 }, (_, i) => (
                                  <option key={i} value={i}>Tier {i}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex justify-between items-center text-slate-650">
                              <span className="font-semibold font-mono">Replica 3 (AZ-C) Promotion Tier</span>
                              <select 
                                value={nbReplica3Tier} 
                                onChange={(e) => setNbReplica3Tier(parseInt(e.target.value))}
                                className="aurora-notebook-input rounded p-1 outline-none"
                              >
                                {Array.from({ length: 5 }, (_, i) => (
                                  <option key={i} value={i}>Tier {i}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {(() => {
                            const tiers = [
                              { name: "Replica 1 (AZ-A)", tier: nbReplica1Tier },
                              { name: "Replica 2 (AZ-B)", tier: nbReplica2Tier },
                              { name: "Replica 3 (AZ-C)", tier: nbReplica3Tier }
                            ];
                            const sorted = [...tiers].sort((a, b) => a.tier - b.tier);
                            const winner = sorted[0];
                            const ties = sorted.filter(t => t.tier === winner.tier);
                            const tieText = ties.length > 1 
                              ? ` (Tie! Arbitrary tiebreaker applied between ${ties.map(t => t.name).join(' & ')})` 
                              : '';
                            return (
                              <div className="aurora-notebook-inner-subcard-white p-3 rounded-lg font-mono text-[10.5px] mt-4 space-y-1.5 aurora-note-desc">
                                <p>First Promotion Candidate: <span className="text-purple font-bold">{winner.name}</span></p>
                                <p className="text-[10px] opacity-90 font-sans italic">Priority Rule: Replica with the lowest Tier number (Tier 0 &gt; Tier 1) is chosen first.{tieText}</p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      <div className="space-y-4 text-xs leading-relaxed animate-fadeIn aurora-note-desc">
                        <span className="font-extrabold block aurora-notebook-label">Promotion Rules &amp; Steps:</span>
                        <ol className="list-decimal pl-4 space-y-1.5">
                          <li>
                            <strong className="aurora-notebook-label">Tier Scan:</strong> Scans read replicas for the lowest promotion tier.
                          </li>
                          <li>
                            <strong className="aurora-notebook-label">Size Match:</strong> Promotes the replica matching the instance size of the failed writer.
                          </li>
                          <li>
                            <strong className="aurora-notebook-label">DNS / Gateway Shift:</strong> Ingress endpoint updated to point to the promoted node without needing data recovery playback.
                          </li>
                        </ol>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 5: COPY-ON-WRITE CLONING */}
                {selectedNote === 'db_cloning' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Zero-Copy Clones</span>
                        <h3 className="text-xl font-black mt-2 font-display aurora-note-title">Copy-on-Write Database Cloning</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('cloning')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Clones Simulator
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 5 of 8</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed aurora-note-desc">
                      Fast Database Cloning creates instant test/staging environments using Copy-on-Write metadata maps, saving storage costs.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs leading-relaxed aurora-note-desc">
                        <h4 className="font-bold text-xs aurora-notebook-label">Copy-on-Write Mechanics:</h4>
                        <p>
                          Clones reference the **exact same storage segments** as production initially. As writes occur, new copies of modified page blocks are created.
                        </p>

                        <div className="acad-takeaway-box animate-fadeIn">
                          <strong>💡 Professional Practice:</strong> Use cloning in CI/CD test pipelines to spin up instant staging databases and terminate them after tests complete!
                        </div>
                      </div>

                      <div className="aurora-notebook-inner-card rounded-xl p-4 flex flex-col justify-between space-y-4 font-mono text-xs">
                        <div>
                          <span className="aurora-notebook-inner-card-title block mb-3">Clone Page Storage Calculator</span>
                          
                          <div className="space-y-3.5 mb-2.5">
                            <div>
                              <label className="block text-slate-500 mb-1">Baseline Production DB Size</label>
                              <input 
                                type="number" 
                                value={nbBaselineGb} 
                                onChange={(e) => setNbBaselineGb(Math.max(1, parseInt(e.target.value) || 0))}
                                className="w-full aurora-notebook-input rounded p-1 font-mono"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-slate-500 mb-1">Percentage of pages modified in Clone: {nbCloneModifiedPct}%</label>
                              <input 
                                type="range" 
                                min="0" 
                                max="100" 
                                value={nbCloneModifiedPct} 
                                onChange={(e) => setNbCloneModifiedPct(parseInt(e.target.value))}
                                className="w-full accent-emerald-600 cursor-ew-resize"
                              />
                            </div>
                          </div>

                          {(() => {
                            const cloneAllocated = (nbBaselineGb * (nbCloneModifiedPct / 100));
                            const totalStorageUsed = nbBaselineGb + cloneAllocated;
                            const standardCopyUsed = nbBaselineGb * 2;
                            const storageSavedPct = ((standardCopyUsed - totalStorageUsed) / standardCopyUsed) * 100;
                            return (
                              <div className="aurora-notebook-inner-subcard-white p-3 rounded-lg text-[10.5px] space-y-1.5 aurora-note-desc">
                                <p>Baseline Data Shared: <span className="font-bold aurora-notebook-label">{nbBaselineGb} GB</span></p>
                                <p>Diverged Page storage: <span className="font-bold text-blue">{cloneAllocated.toFixed(1)} GB</span></p>
                                <p className="border-t border-slate-100 pt-1.5 text-green font-bold">Storage saved: {storageSavedPct.toFixed(1)}%</p>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 6: BACKTRACK & RECOVERY */}
                {selectedNote === 'backtrack_pitr' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Disaster Recovery</span>
                        <h3 className="text-xl font-black mt-2 font-display aurora-note-title">Backtrack vs Point-in-Time Recovery</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('failover')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Recovery Playbook
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 6 of 8</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed aurora-note-desc">
                      If an operator accidentally executes a destructive SQL statement, backtracking rewinds storage markers back to a specific timestamp in seconds without snapshot restores.
                    </p>
                  </div>
                )}

                {/* NOTE 7: ZERO-ETL */}
                {selectedNote === 'zero_etl' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Analytics Streaming</span>
                        <h3 className="text-xl font-black mt-2 font-display aurora-note-title">
                          {isAzure ? 'Azure Synapse Link & Fabric Lakehouse Zero-ETL' :
                           isGcp ? 'Datastream BigQuery Real-Time Zero-ETL Sync' :
                           'Aurora Zero-ETL to Redshift Integration'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => { setActiveTab('hardening'); setActiveFeatureTab('zeroetl'); }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Zero-ETL Sync
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 7 of 8</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed aurora-note-desc">
                      Zero-ETL integration streams database transaction WAL logs directly to data warehouses without building custom Glue/Spark ETL data pipelines.
                    </p>
                  </div>
                )}

                {/* NOTE 8: SQL MACHINE LEARNING */}
                {selectedNote === 'in_database_ml' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">AI Integration</span>
                        <h3 className="text-xl font-black mt-2 font-display aurora-note-title">
                          {isAzure ? 'Azure OpenAI REST T-SQL Inferences' :
                           isGcp ? 'AlloyDB / Spanner Vertex AI SQL Predictions' :
                           'In-Database SQL Machine Learning'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => { setActiveTab('hardening'); setActiveFeatureTab('ml'); }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to SQL ML Inference
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 8 of 8</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed aurora-note-desc">
                      Call AI algorithms directly inside standard SQL queries, eliminating batch Python export scripts.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs leading-relaxed aurora-note-desc">
                        <span className="font-extrabold block aurora-notebook-label">SQL Prediction Syntax:</span>
                        <p>
                          Execute sentiment, classification, and regression ML predictions directly inside your `SELECT` statements!
                        </p>
                      </div>

                      <div className="flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black uppercase tracking-wider font-mono aurora-note-desc">SQL ML Prediction Query</span>
                          <button 
                            onClick={() => {
                              const code = isAzure ? azureMlSqlQueryCode : isGcp ? gcpMlSqlQueryCode : auroraMlSqlQueryCode;
                              navigator.clipboard.writeText(code);
                              setCopiedNoteId('ml-sql');
                              setTimeout(() => setCopiedNoteId(null), 2000);
                            }}
                            className="aurora-notebook-copy-btn"
                          >
                            {copiedNoteId === 'ml-sql' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <pre className="acad-terminal text-[10px] leading-relaxed overflow-x-auto h-64">
                          {isAzure ? azureMlSqlQueryCode : isGcp ? gcpMlSqlQueryCode : auroraMlSqlQueryCode}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

      </div>

      {/* Footer trigger */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <button
          onClick={() => alert(`Copied ${isAzure ? 'Azure Hyperscale' : isGcp ? 'Google AlloyDB/Spanner' : 'Amazon Aurora'} Terraform deployment script to clipboard!`)}
          style={{
            padding: '8px 18px',
            borderRadius: '20px',
            border: '0.5px solid var(--color-border-secondary, #cbd5e1)',
            fontSize: '11.5px',
            cursor: 'pointer',
            background: 'var(--color-background-secondary, #f8fafc)',
            color: 'var(--color-text-primary, #0f172a)',
            fontWeight: 500,
            transition: 'all 0.15s'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = 'var(--color-background-secondary, #f8fafc)'; }}
        >
          Get Infrastructure Configuration Script ↗
        </button>
      </div>
        </>
      )}
    </div>
  );
}
