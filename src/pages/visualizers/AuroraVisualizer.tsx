import { useState, useEffect } from 'react';

type TabType = 'overview' | 'endpoints' | 'failover' | 'global' | 'serverless' | 'cloning' | 'hardening';

interface SecItem {
  label: string;
  done: boolean;
}

export default function AuroraVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

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

  // Tab 5: Serverless v2 Scaling
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
  const [secChecks, setSecChecks] = useState<SecItem[]>([
    { label: 'KMS AES-256 Storage volume encryption enabled', done: true },
    { label: 'Inbound TLS transport forced (force_ssl = 1)', done: true },
    { label: 'Database instances locked inside isolated private subnets', done: true },
    { label: 'PubliclyAccessible cluster parameters disabled (default)', done: true },
    { label: 'Least-privilege security group port references configured', done: false },
    { label: 'AWS IAM Database Authentication enabled for app tier', done: false },
    { label: 'Secrets Manager configured with automatic credential rotations', done: true },
    { label: 'Cluster lifecycle Deletion Protection activated', done: false },
    { label: 'RDS Enhanced CloudWatch Monitoring enabled', done: false }
  ]);
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
      setStorageLog(`⚠️ Segment copy ${failedIdx + 1} experienced disk failure. Aurora continues serving reads & writes via quorum (Write 4/6, Read 3/6 ok).`);
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
    setStorageLog('Quorum status nominal. Six segment copies active across three Availability Zones.');
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

    if (failoverStep === 1) {
      setFailoverActive(true);
      setWriterState('dead');
      setFailoverLogs(prev => [
        `[T+0s] 💥 Power death/outage detected in us-east-1a (AZ-1). Writer database unresponsive.`,
        ...prev
      ]);
      setFailoverStep(2);
      setFailoverActive(false);
    } else if (failoverStep === 2) {
      setFailoverActive(true);
      setFailoverLogs(prev => [
        `[T+8s] 🛡️ Fencing off dead Writer instance in us-east-1a to prevent split-brain partition writes.`,
        ...prev
      ]);
      setFailoverStep(3);
      setFailoverActive(false);
    } else if (failoverStep === 3) {
      setFailoverActive(true);
      setFailoverLogs(prev => [
        `[T+12s] 🔄 Selecting Reader Replica with highest failover priority...`,
        `[T+15s] ⚡ Promoting Replica 1 (us-east-1b, Priority 0) to active Primary Writer!`,
        ...prev
      ]);
      setReplicaState('promoted');
      setFailoverStep(4);
      setFailoverActive(false);
    } else if (failoverStep === 4) {
      setFailoverActive(true);
      setFailoverLogs(prev => [
        `[T+18s] 🔌 Cluster Writer Endpoint DNS CNAME mapping shifted to promoted us-east-1b instance.`,
        `[T+22s] 🔄 RDS Proxy connection pool multiplexer intercepts target IP shifts smoothly.`,
        ...prev
      ]);
      setFailoverStep(5);
      setFailoverActive(false);
    } else if (failoverStep === 5) {
      setFailoverActive(true);
      setFailoverLogs(prev => [
        `[T+25s] ✅ Cluster recovery nominal. RDS Proxy accepts app traffic. Zero transactional data loss!`,
        ...prev
      ]);
      setFailoverActive(false);
    }
  };

  const autoPlayFailover = () => {
    if (failoverStep !== 1) return;
    setFailoverActive(true);
    setWriterState('dead');
    setFailoverLogs(prev => [`[T+0s] 💥 Power death/outage detected in us-east-1a (AZ-1). Writer database unresponsive.`, ...prev]);

    setTimeout(() => {
      setFailoverLogs(prev => [`[T+8s] 🛡️ Fencing off dead Writer instance in us-east-1a to prevent split-brain partition writes.`, ...prev]);
    }, 1000);

    setTimeout(() => {
      setReplicaState('promoted');
      setFailoverLogs(prev => [
        `[T+12s] 🔄 Selecting Reader Replica with highest failover priority...`,
        `[T+15s] ⚡ Promoting Replica 1 (us-east-1b, Priority 0) to active Primary Writer!`,
        ...prev
      ]);
    }, 2000);

    setTimeout(() => {
      setFailoverLogs(prev => [
        `[T+18s] 🔌 Cluster Writer Endpoint DNS CNAME mapping shifted to promoted us-east-1b instance.`,
        `[T+22s] 🔄 RDS Proxy connection pool multiplexer intercepts target IP shifts smoothly.`,
        ...prev
      ]);
    }, 3000);

    setTimeout(() => {
      setFailoverLogs(prev => [`[T+25s] ✅ Cluster recovery nominal. RDS Proxy accepts app traffic. Zero transactional data loss!`, ...prev]);
      setFailoverStep(5);
      setFailoverActive(false);
    }, 4000);
  };

  const resetFailoverSim = () => {
    setFailoverStep(1);
    setFailoverActive(false);
    setWriterState('healthy');
    setReplicaState('reader');
    setFailoverLogs([
      '[00:00:00] Cluster nominal. Primary Writer operating on us-east-1a (Priority 0).'
    ]);
  };

  // ==========================================
  // GLOBAL DB FAILOVER SIMULATOR
  // ==========================================
  const triggerGlobalFailover = () => {
    if (globalActive) return;
    setGlobalActive(true);
    setGlobalLogs(prev => [
      `[DR+0s] 🔴 Primary Region us-east-1 (N. Virginia) catastrophic power outage triggered.`,
      ...prev
    ]);

    setTimeout(() => {
      setGlobalLogs(prev => [
        `[DR+5s] ⚠️ Health checking nodes. N. Virginia unresponsive. Initiating global database disaster failover...`,
        ...prev
      ]);
    }, 1000);

    setTimeout(() => {
      setGlobalLogs(prev => [
        `[DR+12s] 🔌 severing lag synchronization channel. Locking ap-southeast-1 (Singapore) warm storage.`,
        ...prev
      ]);
    }, 2000);

    setTimeout(() => {
      setGlobalLogs(prev => [
        `[DR+18s] 👑 Promoting Singapore replica cluster to master standalone primary database!`,
        ...prev
      ]);
      setSecRegionState('promoted');
    }, 3000);

    setTimeout(() => {
      setGlobalLogs(prev => [
        `[DR+24s] ✅ Promotion completed successfully. Global endpoint updated. RPO = ${globalLag}s, RTO = 24s. Singapore Writer online!`,
        ...prev
      ]);
      setGlobalActive(false);
    }, 4000);
  };

  const resetGlobalDb = () => {
    setSecRegionState('replica');
    setGlobalActive(false);
    setGlobalLogs([
      'Global database sync active. Direct hardware-virtualized replication streaming redo logs from us-east-1 to ap-southeast-1.'
    ]);
  };

  // ==========================================
  // SERVERLESS ACU SCALING EFFECT
  // ==========================================
  useEffect(() => {
    const computedAcu = Math.max(0.5, Math.min(256, Math.ceil(connections / 20)));
    setAcu(computedAcu);
    setRam(`${(computedAcu * 2).toFixed(1)} GB`);
    setCost((computedAcu * 0.12).toFixed(2));

    if (connections < 50) {
      setScaleStatus('✅ Stable (Cooling Down)');
      setScaleColor('#15803d');
    } else if (connections < 250) {
      setScaleStatus('⬆️ scaling compute (ACUs Auto-expanding)');
      setScaleColor('#d97706');
    } else {
      setScaleStatus('🔥 High Concurrency Load (Scaling Max)');
      setScaleColor('#dc2626');
    }
  }, [connections]);

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
  const mlQueries: Record<string, { sql: string, logs: string[], results: any[] }> = {
    sentiment: {
      sql: `SELECT customer_id, feedback_text,\n  aws_comprehend_detect_sentiment(\n    feedback_text, 'en'\n  ) AS sentiment\nFROM feedback_reviews\nLIMIT 3;`,
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
      sql: `SELECT txn_id, amount_usd,\n  aws_sagemaker_invoke_endpoint(\n    'fraud-classification-v4',\n    'application/json',\n    amount_usd, client_ip, hour_of_day\n  ) AS risk_score\nFROM pending_transactions\nWHERE risk_score > 0.8;`,
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
      sql: `SELECT user_account, active_weeks,\n  aws_sagemaker_invoke_endpoint(\n    'customer-churn-evaluator',\n    'text/csv',\n    active_weeks, support_tickets\n  ) AS churn_probability\nFROM premium_members\nORDER BY churn_probability DESC LIMIT 2;`,
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
  // ZERO-ETL TO REDSHIFT LOGIC
  // ==========================================
  const runZeroEtlSync = () => {
    if (zeroEtlStatus === 'syncing') return;
    setZeroEtlStatus('syncing');
    setZeroEtlLogs([]);

    const syncSteps = [
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

  const compareRows = [
    ['Storage Layer', 'Virtual, Shared, 6-Way Copy Quorum Volume', 'Dedicated, Static EBS Disk Mirroring'],
    ['Write Cost Scale', 'Redo log records only (No heavy page writes)', 'Writes full modified data pages'],
    ['Read Replicas Pool', 'Up to 15 replicas (Shares same storage, no lag)', 'Up to 5 replicas (Async WAL streaming lag)'],
    ['Failover Promotion', 'sub-30 seconds (Shared volumes need no recovery)', '30–60 seconds (Needs full storage recovery)'],
    ['Serverless Autoscaler', 'Serverless v2 elastic scaling (in seconds)', '❌ Not supported'],
    ['Global DR Cluster', 'Dedicated global replica engine (lag < 1s)', 'Async cross-region standard replicas'],
    ['Database Cloning', 'Copy-on-Write (Instant, zero storage cost clones)', '❌ Full snapshot restore only'],
    ['Built-in ML Invoker', 'Pure SQL endpoints (SageMaker/Comprehend)', '❌ Requires external Python pipelines']
  ];

  return (
    <div className="aurora-container">
      <style>{`
        /* Encapsulated styling under .aurora- */
        .aurora-container { font-family: var(--font-sans, system-ui, sans-serif); color: var(--color-text-primary, #0f172a); }
        .aurora-h { font-size: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; color: var(--color-text-primary, #0f172a); }
        .aurora-sub { font-size: 13px; color: var(--color-text-secondary, #475569); line-height: 1.5; margin-bottom: 16px; }
        .aurora-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-tertiary, #e2e8f0); padding-bottom: 10px; }
        .aurora-tb { padding: 6px 14px; border-radius: var(--border-radius-lg, 12px); border: 0.5px solid var(--color-border-secondary, #cbd5e1); font-size: 12px; cursor: pointer; background: var(--color-background-secondary, #f8fafc); color: var(--color-text-secondary, #475569); transition: all 0.15s; outline: none; font-weight: 500; }
        .aurora-tb:hover { background: var(--color-background-tertiary, #f1f5f9); }
        .aurora-tb.aurora-on { background: #16a34a; color: #fff; border-color: #16a34a; font-weight: 500; }
        .aurora-card { border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-lg, 12px); padding: 14px 16px; background: var(--color-background-primary, #ffffff); margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .aurora-sec { font-size: 11px; font-weight: 600; color: var(--color-text-secondary, #475569); text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0 8px; }
        .aurora-sec:first-child { margin-top: 0; }
        .aurora-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .aurora-grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .aurora-row { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-md, 8px); background: var(--color-background-secondary, #f8fafc); margin-bottom: 6px; font-size: 12px; line-height: 1.45; }
        .aurora-dot { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 10px; color: #fff; font-weight: 600; background: #2563eb; }
        .aurora-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }
        .aurora-binfo { background: #dbeafe; color: #1d4ed8; }
        .aurora-bok { background: #dcfce7; color: #15803d; }
        .aurora-bwarn { background: #fef3c7; color: #b45309; }
        .aurora-bbad { background: #fee2e2; color: #b91c1c; }
        .aurora-bpurple { background: #ede9fe; color: #7c3aed; }
        .aurora-kpi { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }
        .aurora-k { background: var(--color-background-secondary, #f8fafc); border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-md, 8px); padding: 10px; text-align: center; }
        .aurora-k .t { font-size: 10px; color: var(--color-text-tertiary, #64748b); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        .aurora-k .v { font-size: 16px; font-weight: 700; color: var(--color-text-primary, #0f172a); }
        .aurora-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
        .aurora-ctrl { background: var(--color-background-secondary, #f8fafc); border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-md, 8px); padding: 12px; }
        .aurora-ctrl label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-secondary, #475569); margin-bottom: 6px; }
        .aurora-ctrl select { width: 100%; padding: 6px; font-size: 12px; border: 2px solid #2563eb; border-radius: 4px; background: var(--color-background-primary, #ffffff); outline: none; }
        .aurora-ctrl input[type="range"] { width: 100%; padding: 6px; font-size: 12px; border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: 4px; background: var(--color-background-primary, #ffffff); }
        .aurora-ctrl .out { font-size: 11px; color: var(--color-text-secondary, #475569); margin-top: 6px; font-family: var(--font-mono, monospace); }
        .aurora-mono { font-family: var(--font-mono, monospace); font-size: 11px; }
        .aurora-btnbar { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .aurora-btn { font-size: 12px; padding: 6px 12px; border-radius: 6px; border: 0.5px solid var(--color-border-secondary, #cbd5e1); background: var(--color-background-primary, #ffffff); color: var(--color-text-primary, #0f172a); cursor: pointer; transition: all 0.15s; outline: none; display: inline-flex; align-items: center; gap: 4px; }
        .aurora-btn:hover { background: var(--color-background-secondary, #f8fafc); }
        .aurora-btn.aurora-primary { background: #2563eb; border-color: #2563eb; color: #fff; }
        .aurora-btn.aurora-primary:hover { background: #1d4ed8; }
        .aurora-log { background: var(--color-background-secondary, #f8fafc); border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-md, 8px); padding: 12px; font-size: 11px; color: var(--color-text-secondary, #475569); line-height: 1.6; min-height: 90px; max-height: 180px; overflow-y: auto; margin-top: 12px; }
        ul.aurora-ck, ul.aurora-wn { padding-left: 0; margin-bottom: 0; }
        ul.aurora-ck li, ul.aurora-wn li { font-size: 12px; margin-bottom: 6px; list-style: none; padding-left: 18px; position: relative; line-height: 1.4; color: var(--color-text-secondary, #475569); }
        ul.aurora-ck li::before { content: "✓"; position: absolute; left: 0; color: #15803d; font-weight: 700; }
        ul.aurora-wn li::before { content: "⚠️"; position: absolute; left: 0; font-size: 10px; }
        .aurora-table { width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.4; }
        .aurora-table th { background: var(--color-background-secondary, #f8fafc); border: 0.5px solid var(--color-border-tertiary, #e2e8f0); padding: 8px; text-align: left; font-weight: 600; color: var(--color-text-secondary, #475569); }
        .aurora-table td { border: 0.5px solid var(--color-border-tertiary, #e2e8f0); padding: 8px; color: var(--color-text-primary, #0f172a); }
        .aurora-table tr:nth-child(even) { background: var(--color-background-secondary, #f8fafc); }
        .aurora-code-container { border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: 8px; background: var(--color-background-secondary, #f8fafc); padding: 12px; margin-top: 10px; }
        .aurora-code { font-family: var(--font-mono, monospace); font-size: 11px; white-space: pre-wrap; line-height: 1.45; color: var(--color-text-primary, #0f172a); }
        
        .aurora-subtabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; border-bottom: 1px dashed var(--color-border-tertiary, #e2e8f0); padding-bottom: 8px; }
        .aurora-subtb { padding: 4px 10px; border-radius: 6px; border: 0.5px solid var(--color-border-secondary, #cbd5e1); font-size: 11px; cursor: pointer; background: var(--color-background-primary, #ffffff); color: var(--color-text-secondary, #475569); transition: all 0.15s; outline: none; }
        .aurora-subtb:hover { background: var(--color-background-secondary, #f8fafc); }
        .aurora-subtb.aurora-on { background: #2563eb; color: #fff; border-color: #2563eb; font-weight: 500; }
        .aurora-subtb.aurora-on-purple { background: #7c3aed; color: #fff; border-color: #7c3aed; font-weight: 500; }
        
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
      `}</style>

      {/* Header Panel */}
      <div className="mb-6">
        <h1 className="aurora-h">
          🌌 Amazon Aurora — Cloud-Native Distributed Database Visualizer
        </h1>
        <p className="aurora-sub">
          Explore virtualized shared storage quorums, serverless v2 elastic capacity hubs, point-in-time recovery playbooks, copy-on-write clones, Zero-ETL streams, and in-database ML executors.
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="aurora-tabs">
        <button className={`aurora-tb ${activeTab === 'overview' ? 'aurora-on' : ''}`} onClick={() => setActiveTab('overview')}>💾 1. Shared Storage Quorum</button>
        <button className={`aurora-tb ${activeTab === 'endpoints' ? 'aurora-on' : ''}`} onClick={() => setActiveTab('endpoints')}>🔌 2. Endpoints &amp; Routing</button>
        <button className={`aurora-tb ${activeTab === 'failover' ? 'aurora-on' : ''}`} onClick={() => setActiveTab('failover')}>💥 3. Failover Playbook Stepper</button>
        <button className={`aurora-tb ${activeTab === 'global' ? 'aurora-on' : ''}`} onClick={() => setActiveTab('global')}>🌎 4. Global DR Sync</button>
        <button className={`aurora-tb ${activeTab === 'serverless' ? 'aurora-on' : ''}`} onClick={() => setActiveTab('serverless')}>⚡ 5. Serverless v2 Scaling</button>
        <button className={`aurora-tb ${activeTab === 'cloning' ? 'aurora-on' : ''}`} onClick={() => setActiveTab('cloning')}>🧬 6. Copy-on-Write Clones</button>
        <button className={`aurora-tb ${activeTab === 'hardening' ? 'aurora-on' : ''}`} onClick={() => setActiveTab('hardening')}>🔒 7. Hardening HUD &amp; Analytics</button>
      </div>

      {/* Primary Display Card */}
      <div className="aurora-card">

        {/* ==========================================
            TAB 1: STORAGE & QUORUM
            ========================================== */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Storage Engine: Redo log replication &amp; Drive Quorum virtualizations</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Aurora writes ONLY redo log vectors to a shared quorum storage layer replicated 6-ways across 3 AZs.</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', alignItems: 'start' }}>
              <div>
                <svg width="100%" viewBox="0 0 680 400" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <defs>
                    <linearGradient id="g-light-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f8fafc" />
                      <stop offset="100%" stopColor="#f1f5f9" />
                    </linearGradient>
                    <marker id="arr-g" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                    <marker id="arr-p" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6" /></marker>
                  </defs>

                  {/* Grid Background */}
                  <rect width="680" height="400" fill="url(#g-light-bg)" />
                  <text x="340" y="24" textAnchor="middle" fontSize="10.5" fill="#64748b" fontWeight="600" fontFamily="sans-serif">AWS Private Subnets (3 Availability Zones)</text>

                  {/* Compute Layer */}
                  <rect x="20" y="38" width="640" height="70" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
                  <text x="340" y="52" textAnchor="middle" fontSize="9.5" fill="#7c3aed" fontWeight="bold" fontFamily="monospace">AURORA COMPUTE INSTANCES</text>

                  <rect x="40" y="62" width="170" height="34" rx="4" fill="#ede9fe" stroke="#a78bfa" strokeWidth="0.5" />
                  <text x="125" y="79" textAnchor="middle" fontSize="11" fill="#4c1d95" fontWeight="bold">✍️ Writer (us-east-1a)</text>

                  <rect x="250" y="62" width="170" height="34" rx="4" fill="#f3e8ff" stroke="#c084fc" strokeWidth="0.5" />
                  <text x="335" y="79" textAnchor="middle" fontSize="11" fill="#6b21a8" fontWeight="bold">📖 Reader 1 (us-east-1b)</text>

                  <rect x="460" y="62" width="170" height="34" rx="4" fill="#f3e8ff" stroke="#c084fc" strokeWidth="0.5" />
                  <text x="545" y="79" textAnchor="middle" fontSize="11" fill="#6b21a8" fontWeight="bold">📖 Reader 2 (us-east-1c)</text>

                  {/* Shared Storage Area */}
                  <rect x="20" y="150" width="640" height="230" rx="10" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
                  <text x="340" y="168" textAnchor="middle" fontSize="10" fill="#047857" fontWeight="bold" fontFamily="monospace">SHARED VIRTUALIZED DISTRIBUTED STORAGE LAYER</text>

                  {/* AZ-1 Nodes */}
                  <rect x="35" y="185" width="180" height="150" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
                  <text x="125" y="200" textAnchor="middle" fontSize="10" fill="#047857" fontWeight="bold">AZ-1 (Subnet 1a)</text>
                  
                  <rect x="50" y="215" width="150" height="32" rx="4" fill={copies[0] ? '#ecfdf5' : '#fef2f2'} stroke={copies[0] ? '#10b981' : '#fca5a5'} strokeWidth="1" />
                  <text x="125" y="235" textAnchor="middle" fontSize="10.5" fill={copies[0] ? '#065f46' : '#991b1b'} fontWeight="500">{copies[0] ? 'Storage Copy 1 ✅' : 'Copy 1 Outage ❌'}</text>
                  
                  <rect x="50" y="258" width="150" height="32" rx="4" fill={copies[1] ? '#ecfdf5' : '#fef2f2'} stroke={copies[1] ? '#10b981' : '#fca5a5'} strokeWidth="1" />
                  <text x="125" y="278" textAnchor="middle" fontSize="10.5" fill={copies[1] ? '#065f46' : '#991b1b'} fontWeight="500">{copies[1] ? 'Storage Copy 2 ✅' : 'Copy 2 Outage ❌'}</text>

                  {/* AZ-2 Nodes */}
                  <rect x="250" y="185" width="180" height="150" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
                  <text x="340" y="200" textAnchor="middle" fontSize="10" fill="#047857" fontWeight="bold">AZ-2 (Subnet 1b)</text>
                  
                  <rect x="265" y="215" width="150" height="32" rx="4" fill={copies[2] ? '#ecfdf5' : '#fef2f2'} stroke={copies[2] ? '#10b981' : '#fca5a5'} strokeWidth="1" />
                  <text x="340" y="235" textAnchor="middle" fontSize="10.5" fill={copies[2] ? '#065f46' : '#991b1b'} fontWeight="500">{copies[2] ? 'Storage Copy 3 ✅' : 'Copy 3 Outage ❌'}</text>
                  
                  <rect x="265" y="258" width="150" height="32" rx="4" fill={copies[3] ? '#ecfdf5' : '#fef2f2'} stroke={copies[3] ? '#10b981' : '#fca5a5'} strokeWidth="1" />
                  <text x="340" y="278" textAnchor="middle" fontSize="10.5" fill={copies[3] ? '#065f46' : '#991b1b'} fontWeight="500">{copies[3] ? 'Storage Copy 4 ✅' : 'Copy 4 Outage ❌'}</text>

                  {/* AZ-3 Nodes */}
                  <rect x="465" y="185" width="180" height="150" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
                  <text x="555" y="200" textAnchor="middle" fontSize="10" fill="#047857" fontWeight="bold">AZ-3 (Subnet 1c)</text>
                  
                  <rect x="480" y="215" width="150" height="32" rx="4" fill={copies[4] ? '#ecfdf5' : '#fef2f2'} stroke={copies[4] ? '#10b981' : '#fca5a5'} strokeWidth="1" />
                  <text x="555" y="235" textAnchor="middle" fontSize="10.5" fill={copies[4] ? '#065f46' : '#991b1b'} fontWeight="500">{copies[4] ? 'Storage Copy 5 ✅' : 'Copy 5 Outage ❌'}</text>
                  
                  <rect x="480" y="258" width="150" height="32" rx="4" fill={copies[5] ? '#ecfdf5' : '#fef2f2'} stroke={copies[5] ? '#10b981' : '#fca5a5'} strokeWidth="1" />
                  <text x="555" y="278" textAnchor="middle" fontSize="10.5" fill={copies[5] ? '#065f46' : '#991b1b'} fontWeight="500">{copies[5] ? 'Storage Copy 6 ✅' : 'Copy 6 Outage ❌'}</text>

                  {/* Redo stream paths */}
                  <line x1="125" y1="96" x2="125" y2="150" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="3,2" className="flow-active-line" markerEnd="url(#arr-p)" />
                  <line x1="335" y1="96" x2="335" y2="150" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3,2" className="flow-active-line" markerEnd="url(#arr-p)" />
                  <line x1="545" y1="96" x2="545" y2="150" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="3,2" className="flow-active-line" markerEnd="url(#arr-p)" />
                  <text x="155" y="130" fontSize="9.5" fill="#7c3aed" fontWeight="bold">Redo Record Stream</text>

                  <text x="340" y="365" textAnchor="middle" fontSize="10.5" fill="#047857" fontWeight="bold">Self-Healing Storage rebuilds segments instantly on healthy nodes if sectors fail.</text>
                </svg>
              </div>

              <div>
                {/* Drive Quorum Hardening Status */}
                <div className="aurora-card" style={{ marginBottom: '12px', borderTop: '3px solid #10b981' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#1b4332', marginBottom: '6px' }}>🛠️ Drive Failures &amp; Quorum HUD</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>Aurora replicates data to 6 storage drives. Test failures to see read/write quorum.</div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '9.5px', color: '#64748b' }}>Write Quorum (needs 4/6)</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: copies.filter(Boolean).length >= 4 ? '#16a34a' : '#dc2626', marginTop: '2px' }}>
                        {copies.filter(Boolean).length >= 4 ? '🟢 Stable ACK' : '🔴 Blocked'} ({copies.filter(Boolean).length}/6)
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', padding: '6px', borderRadius: '6px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '9.5px', color: '#64748b' }}>Read Quorum (needs 3/6)</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: copies.filter(Boolean).length >= 3 ? '#16a34a' : '#dc2626', marginTop: '2px' }}>
                        {copies.filter(Boolean).length >= 3 ? '🟢 Stable ACK' : '🔴 Blocked'} ({copies.filter(Boolean).length}/6)
                      </div>
                    </div>
                  </div>

                  <div className="aurora-mono" style={{ background: '#f1f5f9', padding: '8px', borderRadius: '6px', minHeight: '52px', fontSize: '9.5px', color: '#334155', border: '1px solid #e2e8f0', lineHeight: 1.45 }}>
                    {storageLog}
                  </div>

                  <div className="aurora-btnbar" style={{ marginTop: '8px' }}>
                    <button className="aurora-btn" style={{ borderColor: '#fca5a5', background: '#fef2f2', color: '#b91c1c' }} onClick={failOneCopy}>💥 Fail 1 copy</button>
                    <button className="aurora-btn" style={{ borderColor: '#86efac', background: '#f0fdf4', color: '#15803d' }} onClick={selfHealStorage}>🔄 Self-heal rebuild</button>
                    <button className="aurora-btn" onClick={resetStorageCopies}>Reset</button>
                  </div>
                </div>

                {/* Auto-Expanding used/allocated simulator */}
                <div className="aurora-card" style={{ borderTop: '3px solid #0284c7' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f4c5c', marginBottom: '6px' }}>📈 Dynamic Segment Allocation</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>Aurora storage grows automatically in 10 GB increments as database size increases.</div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Active Used Size:</span> <b>{usedGb} GB</b>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="115"
                      value={usedGb}
                      onChange={(e) => handleUsedGbChange(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer', margin: '6px 0' }}
                    />
                    <div style={{ fontSize: '11px', color: '#334155', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Allocated: <b>{allocatedGb} GB</b></span>
                      <span style={{ color: expandColor, fontWeight: 'bold' }}>{expandStatus}</span>
                    </div>
                    <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' }}>
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
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Cluster Routing &amp; Endpoint Management</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Configure connections to Writer, Reader pool, Custom groups, and Serverless Data APIs (HTTPS).</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', alignItems: 'start' }}>
              <div>
                <svg width="100%" viewBox="0 0 680 340" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <rect width="680" height="340" fill="url(#g-light-bg)" />

                  {/* Sources */}
                  <g className="active-glow-node" style={{ '--pulse-color': 'rgba(37, 99, 235, 0.2)' } as React.CSSProperties}>
                    <rect x="30" y="30" width="160" height="60" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth={activeSource === 'client' ? 2 : 0.5} style={{ cursor: 'pointer' }} onClick={() => setActiveSource('client')} />
                    <text x="110" y="58" textAnchor="middle" fontSize="12" fill="#1d4ed8" fontWeight="bold">💻 Standard OLTP App</text>
                    <text x="110" y="74" textAnchor="middle" fontSize="8.5" fill="#60a5fa">Web App / ECS Driver</text>
                  </g>

                  <g className="active-glow-node" style={{ '--pulse-color': 'rgba(124, 58, 237, 0.2)' } as React.CSSProperties}>
                    <rect x="30" y="130" width="160" height="60" rx="6" fill="#f5f3ff" stroke="#7c3aed" strokeWidth={activeSource === 'proxy' ? 2 : 0.5} style={{ cursor: 'pointer' }} onClick={() => setActiveSource('proxy')} />
                    <text x="110" y="158" textAnchor="middle" fontSize="12" fill="#6d28d9" fontWeight="bold">⚡ Serverless Lambda</text>
                    <text x="110" y="174" textAnchor="middle" fontSize="8.5" fill="#a78bfa">VPC Data API / Proxy Pool</text>
                  </g>

                  <g className="active-glow-node" style={{ '--pulse-color': 'rgba(16, 185, 129, 0.2)' } as React.CSSProperties}>
                    <rect x="30" y="230" width="160" height="60" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth={activeSource === 'analytics' ? 2 : 0.5} style={{ cursor: 'pointer' }} onClick={() => setActiveSource('analytics')} />
                    <text x="110" y="258" textAnchor="middle" fontSize="12" fill="#047857" fontWeight="bold">📊 Analytics Worker</text>
                    <text x="110" y="274" textAnchor="middle" fontSize="8.5" fill="#34d399">PowerBI / Heavy Reports</text>
                  </g>

                  {/* Endpoints */}
                  <rect x="270" y="60" width="180" height="40" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="360" y="80" textAnchor="middle" fontSize="10.5" fill="#1e293b" fontWeight="bold">✍️ Writer Endpoint</text>
                  <text x="360" y="93" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">cluster.writer.rds.com</text>

                  <rect x="270" y="150" width="180" height="40" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="360" y="170" textAnchor="middle" fontSize="10.5" fill="#1e293b" fontWeight="bold">📖 Reader Endpoint</text>
                  <text x="360" y="183" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">cluster.reader-ro.rds.com</text>

                  <rect x="270" y="240" width="180" height="40" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="360" y="260" textAnchor="middle" fontSize="10.5" fill="#1e293b" fontWeight="bold">🔌 Data API Endpoint</text>
                  <text x="360" y="273" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">data-api.ap-region.rds.com</text>

                  {/* Database Compute instances */}
                  <rect x="520" y="45" width="130" height="48" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="585" y="68" textAnchor="middle" fontSize="11" fill="#334155" fontWeight="bold">Writer Instance</text>
                  <text x="585" y="82" textAnchor="middle" fontSize="8.5" fill="#16a34a" fontWeight="bold">Primary</text>

                  <rect x="520" y="145" width="130" height="48" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="585" y="168" textAnchor="middle" fontSize="11" fill="#334155" fontWeight="bold">Replica A</text>
                  <text x="585" y="182" textAnchor="middle" fontSize="8.5" fill="#2563eb">Reader Node</text>

                  <rect x="520" y="245" width="130" height="48" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="585" y="268" textAnchor="middle" fontSize="11" fill="#334155" fontWeight="bold">Replica B</text>
                  <text x="585" y="282" textAnchor="middle" fontSize="8.5" fill="#2563eb">Reader Node</text>

                  {/* Ingress Paths dynamic tracing */}
                  {activeSource === 'client' && (
                    <>
                      <path d="M 190 60 L 270 80" fill="none" stroke="#2563eb" strokeWidth="2.5" className="flow-active-line" />
                      <path d="M 450 80 L 520 70" fill="none" stroke="#2563eb" strokeWidth="2.5" className="flow-active-line" />
                    </>
                  )}
                  {activeSource === 'proxy' && (
                    <>
                      <path d="M 190 160 L 270 260" fill="none" stroke="#7c3aed" strokeWidth="2.5" className="flow-active-line" />
                      <path d="M 450 260 L 520 70" fill="none" stroke="#7c3aed" strokeWidth="2" className="flow-active-line" />
                      <path d="M 450 260 L 520 170" fill="none" stroke="#7c3aed" strokeWidth="2" className="flow-active-line" />
                    </>
                  )}
                  {activeSource === 'analytics' && (
                    <>
                      <path d="M 190 260 L 270 170" fill="none" stroke="#10b981" strokeWidth="2.5" className="flow-active-line" />
                      <path d="M 450 170 L 520 170" fill="none" stroke="#10b981" strokeWidth="2" className="flow-active-line" />
                      <path d="M 450 170 L 520 270" fill="none" stroke="#10b981" strokeWidth="2" className="flow-active-line" />
                    </>
                  )}
                </svg>
              </div>

              <div>
                <div className="aurora-card" style={{ borderLeft: '4px solid #2563eb', paddingLeft: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#1e3a8a' }}>👑 Writer Cluster Endpoint</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                    Static CNAME routing strictly to N. Virginia primary database instance. Bypasses replicas. On failovers, targets shift IP addresses automatically in seconds.
                  </div>
                </div>
                <div className="aurora-card" style={{ borderLeft: '4px solid #10b981', paddingLeft: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#064e3b' }}>📖 Reader Load-balanced Endpoint</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                    Spreads heavy read-only SELECT connections across all reader nodes dynamically via round-robin DNS records. Bypasses primary writes.
                  </div>
                </div>
                <div className="aurora-card" style={{ borderLeft: '4px solid #7c3aed', paddingLeft: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#581c87' }}>🔌 Serverless Data API Endpoint</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '3px' }}>
                    Enables HTTP-based SQL execution over standard JSON calls. Eliminates persistent socket limits. Perfect for containerized Lambda structures.
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
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Disaster Recovery: Sub-30s Failover Playbook Stepper</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Simulate a full Availability Zone blackout in us-east-1a and monitor recovery streams.</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '14px', alignItems: 'start' }}>
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {/* AZ-1 Writer Node */}
                  <div style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px',
                    textAlign: 'center',
                    background: writerState === 'healthy' ? '#ecfdf5' : '#fef2f2',
                    borderColor: writerState === 'healthy' ? '#10b981' : '#ef4444'
                  }}>
                    <div style={{ fontSize: '18px' }}>{writerState === 'healthy' ? '✍️' : '💥'}</div>
                    <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#1e293b', marginTop: '4px' }}>AZ-1 N. Virginia</div>
                    <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: writerState === 'healthy' ? '#15803d' : '#b91c1c' }}>
                      {writerState === 'healthy' ? 'Writer (Healthy)' : 'AZ FAILED (Unreachable)'}
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>Instance Priority: 0</div>
                  </div>

                  {/* AZ-2 Reader Node */}
                  <div style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px',
                    textAlign: 'center',
                    background: replicaState === 'promoted' ? '#f5f3ff' : '#eff6ff',
                    borderColor: replicaState === 'promoted' ? '#7c3aed' : '#3b82f6'
                  }}>
                    <div style={{ fontSize: '18px' }}>👑</div>
                    <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#1e293b', marginTop: '4px' }}>AZ-2 us-east-1b</div>
                    <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: replicaState === 'promoted' ? '#6d28d9' : '#1d4ed8' }}>
                      {replicaState === 'promoted' ? 'PROMOTED WRITER' : 'Replica 1 (Ready)'}
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>Instance Priority: 0 (Backup Primary)</div>
                  </div>

                  {/* AZ-3 Reader Node */}
                  <div style={{
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px',
                    textAlign: 'center',
                    background: '#eff6ff',
                    borderColor: '#3b82f6'
                  }}>
                    <div style={{ fontSize: '18px' }}>📖</div>
                    <div style={{ fontWeight: 700, fontSize: '11.5px', color: '#1e293b', marginTop: '4px' }}>AZ-3 us-east-1c</div>
                    <div style={{ fontSize: '10.5px', fontWeight: 'bold', color: '#1d4ed8' }}>
                      Replica 2 (Serving Reads)
                    </div>
                    <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>Instance Priority: 1</div>
                  </div>
                </div>

                {/* Steps Timeline bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', marginBottom: '14px', position: 'relative' }}>
                  {[
                    { s: 1, label: '1. Outage Detected' },
                    { s: 2, label: '2. Heartbeat Fence' },
                    { s: 3, label: '3. DNS Shift' },
                    { s: 4, label: '4. promotion' },
                    { s: 5, label: '5. Proxy active' }
                  ].map((step) => (
                    <div key={step.s} style={{
                      textAlign: 'center',
                      padding: '6px 2px',
                      borderRadius: '6px',
                      fontSize: '9.5px',
                      fontWeight: 'bold',
                      background: failoverStep >= step.s ? '#dcfce7' : '#f1f5f9',
                      border: `1px solid ${failoverStep >= step.s ? '#86efac' : '#cbd5e1'}`,
                      color: failoverStep >= step.s ? '#15803d' : '#64748b'
                    }}>
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
                <div className="aurora-card" style={{ background: '#f8fafc', minHeight: '180px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'monospace' }}>
                    📟 PLAYBOOK TIMELINE STREAMS
                  </div>
                  <div className="aurora-mono" style={{ fontSize: '9.5px', color: '#334155', minHeight: '120px', lineHeight: 1.5 }}>
                    {failoverLogs.map((log, i) => (
                      <div key={i} style={{ borderBottom: '0.5px solid #cbd5e1', padding: '4px 0' }}>
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
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Global Database: Hardware-Accelerated Multi-Region Replication</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Aurora Global Databases bypass SQL engines, replicating redo blocks directly at the storage level in N. Virginia (Primary) and Singapore (Warm Standby).</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', alignItems: 'start' }}>
              <div>
                <svg width="100%" viewBox="0 0 680 240" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <rect width="680" height="240" fill="url(#g-light-bg)" />

                  {/* Primary Region us-east-1 */}
                  <rect x="20" y="30" width="260" height="180" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="1" />
                  <text x="150" y="52" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="bold">🌎 PRIMARY N. VIRGINIA (us-east-1)</text>

                  <rect x="40" y="70" width="220" height="34" rx="4" fill="#ede9fe" stroke="#a78bfa" strokeWidth="0.5" />
                  <text x="150" y="91" textAnchor="middle" fontSize="11" fill="#4c1d95" fontWeight="bold">Writer Node (Active Primary)</text>

                  <rect x="40" y="115" width="220" height="34" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
                  <text x="150" y="136" textAnchor="middle" fontSize="11" fill="#64748b">Shared Storage Volume (6 copies)</text>

                  <rect x="40" y="160" width="220" height="34" rx="4" fill="#fffbeb" stroke="#fcd34d" strokeWidth="0.5" />
                  <text x="150" y="181" textAnchor="middle" fontSize="11" fill="#92400e" fontWeight="bold">Global replication engine channel</text>

                  {/* Secondary Region ap-southeast-1 */}
                  <rect x="400" y="30" width="260" height="180" rx="8" fill={secRegionState === 'promoted' ? '#faf5ff' : '#ecfdf5'} stroke={secRegionState === 'promoted' ? '#c4b5fd' : '#a7f3d0'} strokeWidth="1" />
                  <text x="530" y="52" textAnchor="middle" fontSize="11" fill={secRegionState === 'promoted' ? '#7c3aed' : '#047857'} fontWeight="bold">🌏 SINGAPORE (ap-southeast-1)</text>

                  <rect x="420" y="70" width="220" height="34" rx="4" fill={secRegionState === 'promoted' ? '#ede9fe' : '#ccfbf1'} stroke={secRegionState === 'promoted' ? '#a78bfa' : '#5eead4'} strokeWidth="0.5" />
                  <text x="530" y="91" textAnchor="middle" fontSize="11" fill={secRegionState === 'promoted' ? '#4c1d95' : '#0f766e'} fontWeight="bold">
                    {secRegionState === 'promoted' ? '✍️ promoted WRITER DB' : '📖 warm standby replica pool'}
                  </text>

                  <rect x="420" y="115" width="220" height="34" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
                  <text x="530" y="136" textAnchor="middle" fontSize="11" fill="#64748b">Shared Storage Volume (6 copies)</text>

                  <rect x="420" y="160" width="220" height="34" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
                  <text x="530" y="181" textAnchor="middle" fontSize="11" fill="#334155" fontWeight="bold">Active local reads served locally</text>

                  {/* Global replicator channel arrow */}
                  <line x1="280" y1="180" x2="400" y2="180" stroke="#7c3aed" strokeWidth="3" strokeDasharray="6,4" className="flow-active-line" markerEnd="url(#arr-p)" />
                  <text x="340" y="165" textAnchor="middle" fontSize="10.5" fill="#7c3aed" fontWeight="bold">lag: &lt; 1s</text>
                </svg>
              </div>

              <div>
                <div className="aurora-card" style={{ borderTop: '3px solid #7c3aed' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#581c87', marginBottom: '6px' }}>💥 Global DR Disaster promotion</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>Test promoting Singapore from a read-only secondary to active writer when us-east-1 fails.</div>

                  <div className="aurora-mono" style={{ background: '#f1f5f9', padding: '8px', borderRadius: '6px', fontSize: '9.5px', color: '#334155', minHeight: '62px', border: '1px solid #cbd5e1', lineHeight: 1.4, marginBottom: '8px' }}>
                    {globalLogs[0]}
                  </div>

                  <div className="aurora-btnbar">
                    <button className="aurora-btn" style={{ background: '#fee2e2', color: '#b91c1c', borderColor: '#fca5a5' }} onClick={triggerGlobalFailover}>💥 N. Virginia Outage</button>
                    <button className="aurora-btn" onClick={resetGlobalDb}>Reset DR link 🔄</button>
                  </div>
                </div>

                <div className="aurora-card">
                  <div style={{ fontWeight: 600, fontSize: '11.5px', color: '#1e293b', marginBottom: '6px' }}>📋 Global DB parameters</div>
                  <div className="aurora-row" style={{ padding: '6px' }}><span style={{ minWidth: '100px', color: '#64748b' }}>RPO (Data Lag)</span><b>&lt; 1 second</b></div>
                  <div className="aurora-row" style={{ padding: '6px' }}><span style={{ minWidth: '100px', color: '#64748b' }}>RTO (Promotion)</span><b>&lt; 1 minute</b></div>
                  <div className="aurora-row" style={{ padding: '6px' }}><span style={{ minWidth: '100px', color: '#64748b' }}>Max Target Regions</span><b>5 Regions</b></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 5: SERVERLESS V2 SCALING
            ========================================== */}
        {activeTab === 'serverless' && (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Serverless v2: Instant ACU Compute Auto-Scaling</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Aurora Serverless v2 scales compute capacity (ACUs) up and down dynamically in seconds based on live connections and CPU load.</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', alignItems: 'start' }}>
              <div>
                <div className="aurora-card" style={{ background: '#f8fafc', padding: '14px', marginBottom: '12px' }}>
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
                  <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '4px', textAlign: 'right' }}>Slider limits: 10 to 500 connections</div>
                </div>

                <div className="aurora-grid3" style={{ marginBottom: '12px' }}>
                  <div className="aurora-k">
                    <div className="t" style={{ color: '#7c3aed' }}>Compute ACUs</div>
                    <div className="v" style={{ fontSize: '20px' }}>{acu} ACUs</div>
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

                <div className="aurora-card" style={{ borderLeft: `4px solid ${scaleColor}`, background: '#ecfdf5', padding: '10px' }}>
                  <div style={{ fontSize: '11px', color: scaleColor, fontWeight: 'bold' }}>
                    {scaleStatus}
                  </div>
                  <div style={{ fontSize: '11px', color: '#047857', marginTop: '2px', lineHeight: 1.4 }}>
                    Aurora ACU scaling is instantaneous. A single ACU allocates 2 GB RAM with proportionate CPU slices, ensuring memory expands smoothly to handle query peaks without cold starts.
                  </div>
                </div>
              </div>

              <div>
                <svg width="100%" height="210" viewBox="0 0 240 210" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <rect width="240" height="210" fill="url(#g-light-bg)" />
                  <text x="120" y="24" textAnchor="middle" fontSize="10.5" fill="#64748b" fontWeight="600">ACU CAPACITY SCALING HUD</text>

                  {/* Circular Dial HUD representing ACU capacity size */}
                  <circle cx="120" cy="115" r="56" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                  
                  {/* Scaled circle representing active capacity */}
                  <circle cx="120" cy="115" r={Math.min(56, 12 + acu * 1.6)} fill="#eff6ff" stroke="#2563eb" strokeWidth="2.5" className="active-glow-node" style={{ '--pulse-color': 'rgba(37, 99, 235, 0.4)' } as React.CSSProperties} />
                  
                  <text x="120" y="115" textAnchor="middle" dominantBaseline="central" fontSize="16" fill="#1e3a8a" fontWeight="bold">{acu} ACU</text>
                  <text x="120" y="132" textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#64748b">Allocated</text>

                  <text x="120" y="192" textAnchor="middle" fontSize="9.5" fill="#64748b" fontFamily="monospace">1 ACU = 2 GB RAM</text>
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
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Copy-on-Write Database Cloning Virtualization</div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Aurora Database Clones are created instantly (under 3s) at zero initial storage cost, sharing identical physical data blocks with the production database.</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', alignItems: 'start' }}>
              <div>
                <svg width="100%" viewBox="0 0 680 260" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                  <rect width="680" height="260" fill="url(#g-light-bg)" />

                  {/* Production DB */}
                  <rect x="30" y="30" width="180" height="50" rx="6" fill="#ede9fe" stroke="#a78bfa" strokeWidth="1" />
                  <text x="120" y="52" textAnchor="middle" fontSize="11" fill="#4c1d95" fontWeight="bold">🏭 Production Writer DB</text>
                  <text x="120" y="68" textAnchor="middle" fontSize="8" fill="#7c3aed" fontFamily="monospace">Volume size: 100 TB</text>

                  {/* Staging DB Clone */}
                  <rect x="470" y="30" width="180" height="50" rx="6" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="1" />
                  <text x="560" y="52" textAnchor="middle" fontSize="11" fill="#4c1d95" fontWeight="bold">🧬 Dev / Staging Clone DB</text>
                  <text x="560" y="68" textAnchor="middle" fontSize="8" fill="#7c3aed" fontFamily="monospace">Volume size: 100 TB</text>

                  {/* Shared storage space */}
                  <rect x="30" y="115" width="620" height="120" rx="8" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
                  <text x="340" y="132" textAnchor="middle" fontSize="10.5" fill="#047857" fontWeight="bold" fontFamily="monospace">SHARED DISK STORAGE BLOCKS (COPY-ON-WRITE)</text>

                  {/* Shared Blocks */}
                  <rect x="50" y="150" width="150" height="34" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="125" y="172" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="bold">Physical Block A (Shared)</text>

                  <rect x="220" y="150" width="150" height="34" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="295" y="172" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="bold">Physical Block B (Shared)</text>

                  <rect x="390" y="150" width="100" height="34" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="440" y="172" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="bold">Block C (Shared)</text>

                  {/* Diverged Blocks */}
                  <rect x="510" y="150" width="120" height="34" rx="4" fill={cloneWrites > 0 ? '#fffbeb' : '#f8fafc'} stroke={cloneWrites > 0 ? '#f59e0b' : '#cbd5e1'} strokeWidth="1" className={cloneWrites > 0 ? 'active-glow-node' : ''} style={{ '--pulse-color': 'rgba(245, 158, 11, 0.4)' } as React.CSSProperties} />
                  <text x="570" y="172" textAnchor="middle" fontSize="10" fill={cloneWrites > 0 ? '#b45309' : '#64748b'} fontWeight="bold">
                    {cloneWrites > 0 ? `Diverged Block D 🧬` : 'Shared Block D'}
                  </text>

                  <text x="340" y="215" textAnchor="middle" fontSize="10" fill="#047857" fontWeight="bold">At clone creation: 0 pages copied. Disk storage increases only as clone pages diverge.</text>

                  {/* Connecting vectors */}
                  <line x1="120" y1="80" x2="125" y2="115" stroke="#4c1d95" strokeWidth="1.5" markerEnd="url(#arr-p)" />
                  <line x1="560" y1="80" x2="550" y2="115" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arr-p)" />
                </svg>
              </div>

              <div>
                <div className="aurora-card" style={{ borderTop: '3px solid #7c3aed' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#581c87', marginBottom: '6px' }}>💰 Diverged Write Simulator</div>
                  <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>Test writing to the staging clone database. Watch storage costs remain optimized.</div>

                  <div className="aurora-mono" style={{ background: '#f1f5f9', padding: '8px', borderRadius: '6px', fontSize: '9.5px', color: '#334155', minHeight: '62px', border: '1px solid #cbd5e1', lineHeight: 1.45, marginBottom: '8px' }}>
                    {cloneLog[0]}
                  </div>

                  <div className="aurora-btnbar">
                    <button className="aurora-btn aurora-primary" onClick={simulateCloneWrite}>⚡ Simulate WRITE on Clone DB</button>
                    <button className="aurora-btn" onClick={resetCloneSim}>Reset clone volume 🔄</button>
                  </div>
                </div>

                <div className="aurora-card">
                  <div style={{ fontWeight: 600, fontSize: '11px', color: '#1e293b', marginBottom: '4px' }}>🛡️ Cloning advantages</div>
                  <ul className="aurora-ck" style={{ fontSize: '11px' }}>
                    <li>Instant metadata-only copy</li>
                    <li>No impact on primary performance</li>
                    <li>Supports dev/analytics isolation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 7: HARDENING HUD & ECOSYSTEM
            ========================================== */}
        {activeTab === 'hardening' && (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <button className={`aurora-subtb ${activeFeatureTab === 'security' ? 'aurora-on' : ''}`} onClick={() => setActiveFeatureTab('security')}>🔒 Security HUD Checklist</button>
                <button className={`aurora-subtb ${activeFeatureTab === 'zeroetl' ? 'aurora-on' : ''}`} onClick={() => setActiveFeatureTab('zeroetl')}>⚡ Zero-ETL Redshift Sync</button>
                <button className={`aurora-subtb ${activeFeatureTab === 'ml' ? 'aurora-on' : ''}`} onClick={() => setActiveFeatureTab('ml')}>🤖 In-DB ML Inference</button>
              </div>
            </div>

            {/* Sub-tab 7.1: Security Checklist HUD */}
            {activeFeatureTab === 'security' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '14px', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>VPC Database Boundary Compliance Checklist</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Auditing database environments against AWS Well-Architected guidelines. Click checkboxes to secure.</div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                      {secChecks.map((check, i) => (
                        <div
                          key={i}
                          onClick={() => toggleSecCheck(i)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            border: '1px solid #cbd5e1',
                            borderRadius: '8px',
                            background: check.done ? '#ecfdf5' : '#fff1f2',
                            borderColor: check.done ? '#86efac' : '#fecdd3',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ fontSize: '12px' }}>{check.done ? '✅' : '⬜'}</div>
                          <div style={{ fontSize: '9.5px', fontWeight: 'bold', color: check.done ? '#047857' : '#be123c' }}>{check.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="aurora-card" style={{ display: 'flex', gap: '14px', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                      <svg width="70" height="70" viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
                        <circle
                          cx="18"
                          cy="18"
                          r="16"
                          fill="none"
                          stroke={gradeColor}
                          strokeWidth="2.5"
                          strokeDasharray="100"
                          strokeDashoffset={100 - scorePct}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                        />
                        <text x="18" y="18" textAnchor="middle" dominantBaseline="central" fontSize="10.5" fill={gradeColor} fontWeight="bold">{grade}</text>
                      </svg>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>Hardening Grade: <span style={{ color: gradeColor }}>{grade}</span></div>
                        <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '2px', lineHeight: 1.45 }}>
                          Database satisfies <b>{passedChecksCount} of {totalChecksCount}</b> Well-Architected production checklists.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comparative table: Standard RDS vs Aurora */}
                <div style={{ marginTop: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '8px' }}>⚖️ Comparative Matrix: Amazon Aurora vs Standard RDS</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="aurora-table">
                      <thead>
                        <tr>
                          <th>Engine Feature Parameters</th>
                          <th style={{ color: '#2563eb' }}>Amazon Aurora</th>
                          <th style={{ color: '#475569' }}>Standard RDS (MySQL/PG)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compareRows.map((row, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 'bold' }}>{row[0]}</td>
                            <td style={{ color: '#2563eb', fontWeight: 600 }}>{row[1]}</td>
                            <td>{row[2]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-tab 7.2: Zero-ETL Redshift Sync */}
            {activeFeatureTab === 'zeroetl' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '14px', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>Zero-ETL Analytical Data Warehouse Pipeline</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>Stream transactions continuously to Amazon Redshift without setting up glue code or ETL scripts.</div>
                    
                    <svg width="100%" viewBox="0 0 680 180" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                      <rect width="680" height="180" fill="url(#g-light-bg)" />

                      {/* Aurora cluster storage */}
                      <rect x="20" y="45" width="200" height="90" rx="6" fill="#f0fdf4" stroke="#86efac" strokeWidth="1" />
                      <text x="125" y="72" textAnchor="middle" fontSize="12" fill="#166534" fontWeight="bold">🐘 Aurora Cluster Volume</text>
                      <text x="125" y="90" textAnchor="middle" fontSize="8.5" fill="#15803d" fontFamily="monospace">Redo block segments</text>
                      <text x="125" y="108" textAnchor="middle" fontSize="8.5" fill="#64748b">writes transaction changes</text>

                      {/* Redshift storage */}
                      <rect x="460" y="45" width="200" height="90" rx="6" fill="#eff6ff" stroke="#93c5fd" strokeWidth="1" />
                      <text x="560" y="72" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="bold">📊 Amazon Redshift DW</text>
                      <text x="560" y="90" textAnchor="middle" fontSize="8.5" fill="#2563eb" fontFamily="monospace">Replicated schemas</text>
                      <text x="560" y="108" textAnchor="middle" fontSize="8.5" fill="#64748b">Analytical views updated</text>

                      {/* Zero-ETL sync stream */}
                      <line x1="220" y1="90" x2="460" y2="90" stroke="#10b981" strokeWidth="4" strokeDasharray="8,4" className="flow-active-line" markerEnd="url(#arr-g)" />
                      <text x="340" y="75" textAnchor="middle" fontSize="10.5" fill="#047857" fontWeight="bold">Continuous Zero-ETL Sync</text>
                      <text x="340" y="112" textAnchor="middle" fontSize="8" fill="#64748b">latency &lt; 1s · serverless</text>
                    </svg>
                  </div>

                  <div>
                    <div className="aurora-card" style={{ borderTop: '3px solid #10b981' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: '#166534', marginBottom: '6px' }}>⚡ Start analytical syncing</div>
                      <div style={{ fontSize: '11px', color: '#475569', marginBottom: '8px' }}>Test starting real-time log structured Zero-ETL pipeline sync logs to Redshift.</div>

                      <div className="aurora-mono" style={{ background: '#f1f5f9', padding: '8px', borderRadius: '6px', fontSize: '9.5px', color: '#334155', minHeight: '62px', border: '1px solid #cbd5e1', lineHeight: 1.45, marginBottom: '8px' }}>
                        {zeroEtlLogs.length === 0 ? (
                          <span style={{ color: '#64748b' }}>Click "Initiate Zero-ETL Redshift Sync" to monitor continuous synchronization.</span>
                        ) : zeroEtlLogs.map((log, i) => <div key={i}>{log}</div>)}
                      </div>

                      <div className="aurora-btnbar">
                        <button className="aurora-btn aurora-primary" disabled={zeroEtlStatus === 'syncing'} onClick={zeroEtlLogs.length > 0 ? () => setZeroEtlLogs([]) : runZeroEtlSync}>
                          {zeroEtlLogs.length > 0 ? 'Clear sync logs 🔄' : 'Initiate Zero-ETL Redshift Sync 🚀'}
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
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Aurora PostgreSQL and MySQL support direct, real-time machine learning inferences inside standard SELECT queries.</div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <button className={`aurora-subtb ${activeMlQuery === 'sentiment' ? 'aurora-on-purple' : ''}`} onClick={() => { setActiveMlQuery('sentiment'); setMlOutput([]); setMlLogs([]); }}>🗣️ Sentiment Comprehend</button>
                      <button className={`aurora-subtb ${activeMlQuery === 'fraud' ? 'aurora-on-purple' : ''}`} onClick={() => { setActiveMlQuery('fraud'); setMlOutput([]); setMlLogs([]); }}>💳 Transaction SageMaker</button>
                      <button className={`aurora-subtb ${activeMlQuery === 'churn' ? 'aurora-on-purple' : ''}`} onClick={() => { setActiveMlQuery('churn'); setMlOutput([]); setMlLogs([]); }}>📈 Customer Churn Classifier</button>
                    </div>

                    <div className="aurora-code-container" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '12px' }}>
                      <div className="aurora-code" style={{ color: '#4c1d95', fontSize: '10.5px' }}>
                        {mlQueries[activeMlQuery].sql}
                      </div>
                    </div>
                    <button className="aurora-btn aurora-primary" style={{ background: '#7c3aed', borderColor: '#7c3aed', width: '100%', justifyContent: 'center', marginTop: '8px' }} onClick={runMlInference}>
                      ⚡ Execute ML Inference Query inside DB
                    </button>
                  </div>

                  <div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', fontFamily: 'monospace', marginBottom: '4px' }}>📟 ML CLUSTER INFERENCE STREAMS</div>
                        <div className="aurora-mono" style={{ fontSize: '9px', color: '#334155', minHeight: '62px', lineHeight: 1.45 }}>
                          {mlIsLoading ? (
                            <div style={{ color: '#b45309', animation: 'activeNodePulse 1.2s infinite', '--pulse-color': 'rgba(180, 83, 9, 0.4)' } as React.CSSProperties}>
                              Connecting to SageMaker inference nodes... 🚀
                            </div>
                          ) : mlLogs.length === 0 ? (
                            <span style={{ color: '#64748b' }}>Click "Execute ML Inference Query inside DB" to monitor transactions.</span>
                          ) : mlLogs.map((log, i) => <div key={i}>{log}</div>)}
                        </div>
                      </div>

                      {mlOutput.length > 0 && (
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px' }}>
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
                                  <td style={{ padding: '4px', fontWeight: 'bold', color: row.sentiment.includes('NEGATIVE') || row.sentiment.includes('HIGH') ? '#b91c1c' : '#15803d' }}>{row.sentiment}</td>
                                  <td style={{ padding: '4px', color: '#2563eb' }}>{row.conf}</td>
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

      </div>

      {/* Footer trigger */}
      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <button
          onClick={() => alert("Copied Terraform deployment payload request to clipboard! Generating dynamic multi-AZ serverless v2 Aurora cluster topology script.")}
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
          Get Terraform Configuration for Multi-AZ Aurora Cluster ↗
        </button>
      </div>
    </div>
  );
}
