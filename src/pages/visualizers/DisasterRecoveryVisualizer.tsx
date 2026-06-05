import { useState, useEffect } from 'react';
import {
  RefreshCw,
  Activity,
  Play,
  Shield,
  Zap,
  Database,
  Globe,
  Lock,
  Unlock,
  AlertTriangle,
  BookOpen,
  Sliders,
  Trash2,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';

type TabType = 'strategies' | 'multiregion' | 'dms' | 'backup' | 'playbook' | 'notebook';

interface LogRow {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export default function DisasterRecoveryVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');
  const [selectedNote, setSelectedNote] = useState<string>('rto_rpo');
  const [expandedCategory, setExpandedCategory] = useState<string>('fundamentals');

  // ==========================================
  // ACADEMY NOTEBOOK TAB 6 EXTENDED STATES
  // ==========================================
  const [activeStrategyTab, setActiveStrategyTab] = useState<'backup' | 'pilot' | 'warm' | 'hot'>('backup');
  const [chaosSimType, setChaosSimType] = useState<'rds_failover' | 'az_blackhole' | 'dns_split_brain'>('rds_failover');
  const [chaosConsoleLogs, setChaosConsoleLogs] = useState<LogRow[]>([]);
  const [chaosSimStatus, setChaosSimStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [dmsMatrixSource, setDmsMatrixSource] = useState<string>('oracle');
  const [dmsMatrixTarget, setDmsMatrixTarget] = useState<string>('aurora');
  const [isCdcAnimating, setIsCdcAnimating] = useState<boolean>(true);
  const [calcDataSizeTB, setCalcDataSizeTB] = useState<number>(100);
  const [calcBandwidthMbps, setCalcBandwidthMbps] = useState<number>(100);

  // TAB 1 STATE: RPO/RTO & Cost Calculator
  // ==========================================
  const [selectedStrategy, setSelectedStrategy] = useState<'backup' | 'pilot' | 'warm' | 'hot'>('pilot');
  const [rpoMinutes, setRpoMinutes] = useState<number>(60);
  const [rtoHours, setRtoHours] = useState<number>(4);
  const [hourlyDowntimeCost, setHourlyDowntimeCost] = useState<number>(5000);

  // Auto-sync strategy type based on user RPO/RTO sliders
  useEffect(() => {
    if (rpoMinutes <= 1 && rtoHours <= 0.1) {
      setSelectedStrategy('hot');
    } else if (rpoMinutes <= 15 && rtoHours <= 1) {
      setSelectedStrategy('warm');
    } else if (rpoMinutes <= 60 && rtoHours <= 4) {
      setSelectedStrategy('pilot');
    } else {
      setSelectedStrategy('backup');
    }
  }, [rpoMinutes, rtoHours]);

  const updateStrategyParameters = (strat: 'backup' | 'pilot' | 'warm' | 'hot') => {
    setSelectedStrategy(strat);
    if (strat === 'hot') {
      setRpoMinutes(0.5); // < 1 min
      setRtoHours(0.05);  // Real-time failover
    } else if (strat === 'warm') {
      setRpoMinutes(10);
      setRtoHours(0.5);
    } else if (strat === 'pilot') {
      setRpoMinutes(60);
      setRtoHours(4);
    } else {
      setRpoMinutes(1440); // 24 hours
      setRtoHours(24);     // 24 hours
    }
  };

  // Cost Equations
  const getMonthlyInfraCost = () => {
    if (selectedStrategy === 'hot') return 9500;
    if (selectedStrategy === 'warm') return 2800;
    if (selectedStrategy === 'pilot') return 750;
    return 95; // Backup & Restore
  };

  const getEstimatedDowntimeCost = () => {
    return rtoHours * hourlyDowntimeCost;
  };

  // ==========================================
  // TAB 2 STATE: AWS Multi-Region Failover
  // ==========================================
  const [failoverScenario, setFailoverScenario] = useState<'pilot' | 'warm' | 'hot'>('pilot');
  const [regionAStatus, setRegionAStatus] = useState<'healthy' | 'degraded' | 'offline'>('healthy');
  const [failoverState, setFailoverState] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [failoverLogs, setFailoverLogs] = useState<LogRow[]>([]);
  const [trafficSplit, setTrafficSplit] = useState<number>(100); // 100% to Region A, 0% to B (or 50/50 in Active-Active)

  useEffect(() => {
    if (failoverScenario === 'hot') {
      setTrafficSplit(50); // Active-Active
    } else {
      setTrafficSplit(100); // Primary gets 100%
    }
  }, [failoverScenario]);

  const triggerDisasterOutage = () => {
    setRegionAStatus('offline');
    setFailoverState('running');
    setFailoverLogs([]);
    const timestamp = new Date().toLocaleTimeString();

    setFailoverLogs(prev => [
      ...prev,
      { timestamp, message: `🚨 [ALERT] CloudWatch Alarm "ALB-RegionA-UnhealthyHostCount" triggered CRITICAL state in us-east-1!`, type: 'error' },
      { timestamp, message: `💥 [OUTAGE] Direct outage detected. Region us-east-1 ALB is returning 504 Gateway Timeouts.`, type: 'error' }
    ]);
  };

  const executeFailoverSwitchover = async () => {
    if (failoverState !== 'running') return;
    const timestamp = new Date().toLocaleTimeString();

    if (failoverScenario === 'pilot') {
      setFailoverLogs(prev => [
        ...prev,
        { timestamp, message: `🔄 [FAILOVER] Initiating Pilot Light DR Switchover Plan to eu-west-1...`, type: 'info' },
        { timestamp, message: `📦 [ROUTE 53] Route 53 Active-Passive Health Check fails. Edge pop redirects public queries to eu-west-1 failover ALB.`, type: 'warn' },
        { timestamp, message: `⚡ [COMPUTE] Launching Auto Scaling Group trigger to expand from 0 standby nodes to 4 production-size EC2 instances...`, type: 'info' }
      ]);
      await new Promise(r => setTimeout(r, 1200));

      setFailoverLogs(prev => [
        ...prev,
        { timestamp, message: `💻 [EC2 PROVISIONING] Standby instances launched and booting from pre-baked AMIs...`, type: 'info' },
        { timestamp, message: `🛢️ [AURORA] Promoting regional Aurora secondary cluster in eu-west-1 to standalone WRITER role...`, type: 'warn' }
      ]);
      await new Promise(r => setTimeout(r, 1000));

      setFailoverLogs(prev => [
        ...prev,
        { timestamp, message: `🟢 [SUCCESS] Aurora promoted in 18 seconds. DB connection string endpoint remapped to local cluster.`, type: 'success' },
        { timestamp, message: `✅ [SUCCESS] 4 EC2 compute instances successfully register with Target Group. Health checks PASSED.`, type: 'success' },
        { timestamp, message: `🏆 [COMPLETE] Switchover fully complete in 3.5 minutes. Traffic split updated to 0% us-east-1, 100% eu-west-1.`, type: 'success' }
      ]);
      setTrafficSplit(0);
      setFailoverState('success');

    } else if (failoverScenario === 'warm') {
      setFailoverLogs(prev => [
        ...prev,
        { timestamp, message: `🔄 [FAILOVER] Initiating Warm Standby DR Promotion sequence in eu-west-1...`, type: 'info' },
        { timestamp, message: `📦 [ROUTE 53] Traffic re-routing via Latency-Based Dynamic Failover mapping...`, type: 'info' },
        { timestamp, message: `⚡ [COMPUTE] Warm Standby currently has 1 active minimal compute instance. Scaling up ASG to 4 nodes immediate hot target...`, type: 'warn' }
      ]);
      await new Promise(r => setTimeout(r, 800));

      setFailoverLogs(prev => [
        ...prev,
        { timestamp, message: `🛢️ [AURORA GLOBAL DB] Promoting Aurora PostgreSQL replica instance in eu-west-1 to PRIMARY...`, type: 'info' },
        { timestamp, message: `💻 [ASG SCALE] Hot-standby instances ready. Target group scaling completed in 45 seconds.`, type: 'success' }
      ]);
      await new Promise(r => setTimeout(r, 800));

      setFailoverLogs(prev => [
        ...prev,
        { timestamp, message: `🟢 [SUCCESS] Primary promoted, write operations re-routed to eu-west-1 local endpoint.`, type: 'success' },
        { timestamp, message: `🏆 [COMPLETE] Warm Standby DR switchover completed in 72 seconds. RTO target surpassed!`, type: 'success' }
      ]);
      setTrafficSplit(0);
      setFailoverState('success');

    } else {
      // Hot Site (Active-Active)
      setFailoverLogs(prev => [
        ...prev,
        { timestamp, message: `🔄 [FAILOVER] Active-Active Hot Site failure detection processing...`, type: 'info' },
        { timestamp, message: `📦 [ROUTE 53] Route 53 Anycast immediately senses us-east-1 health probe fail. DNS failover occurred instantly!`, type: 'success' },
        { timestamp, message: `💡 [INFO] eu-west-1 was already running at 100% capacity and routing 50% of global traffic actively.`, type: 'info' }
      ]);
      await new Promise(r => setTimeout(r, 500));

      setFailoverLogs(prev => [
        ...prev,
        { timestamp, message: `🛢️ [AURORA DATASTORE] Aurora Global Database multi-region write endpoint auto-failover completed instantly.`, type: 'success' },
        { timestamp, message: `🏆 [COMPLETE] Failover switchover completed in less than 2 seconds (Near Zero-RTO / Zero-RPO!). Traffic fully consolidated to eu-west-1.`, type: 'success' }
      ]);
      setTrafficSplit(0);
      setFailoverState('success');
    }
  };

  const resetFailoverSim = () => {
    setRegionAStatus('healthy');
    setFailoverState('idle');
    setFailoverLogs([]);
    if (failoverScenario === 'hot') {
      setTrafficSplit(50);
    } else {
      setTrafficSplit(100);
    }
  };

  // ==========================================
  // TAB 3 STATE: Database Migration Service (DMS)
  // ==========================================
  const [dmsMode, setDmsMode] = useState<'full_load' | 'cdc' | 'multi_az'>('full_load');
  const [dmsStatus, setDmsStatus] = useState<'idle' | 'migrating' | 'replicating' | 'failed' | 'promoted'>('idle');
  const [dmsProgress, setDmsProgress] = useState<number>(0);
  const [dmsLogs, setDmsLogs] = useState<LogRow[]>([]);
  const [migrationDowntime, setMigrationDowntime] = useState<string>('0 minutes');

  // Multi-AZ status trigger
  const [dmsNodeActive, setDmsNodeActive] = useState<'primary' | 'standby' | 'recovering'>('primary');

  const triggerDmsMigration = async () => {
    if (dmsStatus === 'migrating' || dmsStatus === 'replicating') return;
    setDmsStatus('migrating');
    setDmsProgress(0);
    setDmsLogs([]);
    setDmsNodeActive('primary');
    const timestamp = new Date().toLocaleTimeString();

    setDmsLogs(prev => [
      ...prev,
      { timestamp, message: `🔌 [DMS CONNECT] Connecting to Source: On-Premises Oracle Enterprise Database (Port 1521)...`, type: 'info' },
      { timestamp, message: `🔌 [DMS CONNECT] Connecting to Target: AWS Aurora MySQL-Compatible Instance (Port 3306)...`, type: 'info' },
      { timestamp, message: `🛡️ [REPLICATION] Spawning AWS DMS Replication Instance (dms-repl-node-large)...`, type: 'info' }
    ]);
    await new Promise(r => setTimeout(r, 600));

    setDmsLogs(prev => [
      ...prev,
      { timestamp, message: `⚙️ [MAPPING] Schema conversion validated. Remapping oracle schema HR_PROD to mysql schema aws_hr_prod...`, type: 'success' },
      { timestamp, message: `🚀 [START] Starting Full-Load Phase: Migrating static table indexes and data blocks...`, type: 'success' }
    ]);

    // Simulate progress bar
    for (let p = 10; p <= 100; p += 15) {
      const currentProgress = Math.min(p, 100);
      setDmsProgress(currentProgress);
      setDmsLogs(prev => [
        ...prev,
        { timestamp: new Date().toLocaleTimeString(), message: `📦 [FULL LOAD] Replicating data tables blocks: ${currentProgress}% complete...`, type: 'info' }
      ]);
      await new Promise(r => setTimeout(r, 400));
    }

    const completeTime = new Date().toLocaleTimeString();
    if (dmsMode === 'full_load') {
      setDmsLogs(prev => [
        ...prev,
        { timestamp: completeTime, message: `🟢 [SUCCESS] Full Load migration completed successfully. All schemas and rows loaded.`, type: 'success' },
        { timestamp: completeTime, message: `⚠️ [DOWNTIME WARNING] Database offline since migration start. Total downtime: 45 minutes for final sync switchover.`, type: 'warn' }
      ]);
      setDmsStatus('promoted');
      setMigrationDowntime('45 minutes');
    } else {
      // Continuous Replication (CDC)
      setDmsLogs(prev => [
        ...prev,
        { timestamp: completeTime, message: `🟢 [SUCCESS] Full Load completed. Transitioning seamlessly to Continuous Replication (CDC) Mode...`, type: 'success' },
        { timestamp: completeTime, message: `⚡ [CDC REPLICATING] Listening to Source Engine transaction redo-logs / binlogs...`, type: 'info' },
        { timestamp: completeTime, message: `💡 [INFO] Live updates on premises will replicate automatically to Aurora within milliseconds. Downtime for cutover is near zero (<10s).`, type: 'success' }
      ]);
      setDmsStatus('replicating');
      setMigrationDowntime('<10 seconds');
    }
  };

  const triggerLiveUpdate = () => {
    if (dmsStatus !== 'replicating') return;
    const timestamp = new Date().toLocaleTimeString();
    setDmsLogs(prev => [
      ...prev,
      { timestamp, message: `⚡ [SOURCE INGEST] Dynamic transaction on-premises: UPDATE employee SET salary = 125000 WHERE id = 102;`, type: 'info' },
      { timestamp, message: `🔍 [CDC STREAM] DMS Replication instance captured redo-log buffer insert. Replicating packet...`, type: 'warn' },
      { timestamp, message: `🟢 [TARGET APPLY] Target Aurora MySQL successfully updated (1 row affected). Replication Lag: 42ms.`, type: 'success' }
    ]);
  };

  const simulateDmsFailover = async () => {
    if (dmsMode !== 'multi_az' || dmsStatus === 'idle') return;
    const timestamp = new Date().toLocaleTimeString();

    setDmsNodeActive('recovering');
    setDmsLogs(prev => [
      ...prev,
      { timestamp, message: `🚨 [FAILOVER ALERT] Primary DMS Replication Node in AZ us-east-1a experienced a physical hypervisor crash!`, type: 'error' },
      { timestamp, message: `🔄 [HEALTH AUDIT] Automated recovery triggered. Promoting synchronous Hot Standby Node in us-east-1b...`, type: 'warn' }
    ]);
    await new Promise(r => setTimeout(r, 1200));

    setDmsNodeActive('standby');
    setDmsLogs(prev => [
      ...prev,
      { timestamp, message: `🟢 [PROMOTED] Standby DMS node promoted to PRIMARY. Routing endpoint remapped seamlessly.`, type: 'success' },
      { timestamp, message: `✅ [CDC RESUME] Replication tasks resumed without data loss. Continuous CDC pipeline is ACTIVE.`, type: 'success' }
    ]);
  };

  const resetDmsSim = () => {
    setDmsStatus('idle');
    setDmsProgress(0);
    setDmsLogs([]);
    setDmsNodeActive('primary');
    setMigrationDowntime('0 minutes');
  };

  // ==========================================
  // TAB 4 STATE: AWS Backup & Vault Lock
  // ==========================================
  const [vaultLockMode, setVaultLockMode] = useState<'none' | 'governance' | 'compliance'>('none');
  const [backupStatus, setBackupStatus] = useState<'idle' | 'backing_up' | 'backed_up'>('idle');
  const [attackStatus, setAttackStatus] = useState<'none' | 'evaluating' | 'breached' | 'prevented'>('none');
  const [backupLogs, setBackupLogs] = useState<LogRow[]>([]);

  const triggerBackupJob = async () => {
    setBackupStatus('backing_up');
    setAttackStatus('none');
    setBackupLogs([]);
    const timestamp = new Date().toLocaleTimeString();

    setBackupLogs(prev => [
      ...prev,
      { timestamp, message: `🔄 [BACKUP TASK] Initiating global backup schedule for EBS volumes, EFS shares, and RDS instances...`, type: 'info' },
      { timestamp, message: `🔒 [ENCRYPTION] Encrypting backups at rest with KMS Customer Managed Key key-backup-root...`, type: 'info' }
    ]);
    await new Promise(r => setTimeout(r, 1000));

    setBackupLogs(prev => [
      ...prev,
      { timestamp, message: `📦 [VAULT WRITE] Writing Recovery Points: ebs-snap-8b21c, rds-snapshot-98ca1, efs-backup-29cae...`, type: 'success' },
      { timestamp, message: `🟢 [SUCCESS] All target backup recovery points successfully aggregated inside "secured-production-vault".`, type: 'success' }
    ]);
    setBackupStatus('backed_up');
  };

  const triggerRansomwareAttack = async () => {
    if (backupStatus !== 'backed_up') return;
    setAttackStatus('evaluating');
    const timestamp = new Date().toLocaleTimeString();

    setBackupLogs(prev => [
      ...prev,
      { timestamp, message: `🚨 [ATTACK SIMULATION] Malicious actor / Compromised Administrator credentials compromised Account Root login!`, type: 'error' },
      { timestamp, message: `💥 [RANSOMWARE] Hacker deploys ransomware to wipe local production databases...`, type: 'error' },
      { timestamp, message: `💣 [DELETION ATTEMPT] Hacker attempts immediate deletion of all AWS Backup vault Recovery Points to prevent recovery...`, type: 'error' }
    ]);
    await new Promise(r => setTimeout(r, 1200));

    if (vaultLockMode === 'none') {
      setAttackStatus('breached');
      setBackupLogs(prev => [
        ...prev,
        { timestamp, message: `💀 [BREACHED] Vault Lock is disabled! API call backup:DeleteRecoveryPoint executed with 200 OK.`, type: 'error' },
        { timestamp, message: `💥 [OUTAGE COMPLETE] All backups successfully deleted. Ransomware attack succeeded. Data is UNRECOVERABLE!`, type: 'error' }
      ]);
    } else if (vaultLockMode === 'governance') {
      setAttackStatus('prevented');
      setBackupLogs(prev => [
        ...prev,
        { timestamp, message: `🛡️ [VAULT LOCK WARNING] Governance Vault Lock is ACTIVE. Blocked standard root user deletion!`, type: 'warn' },
        { timestamp, message: `💡 [INFO] Vault can only be altered by users having a specific IAM override permission (e.g. backup:DeleteVaultLockConfiguration).`, type: 'info' },
        { timestamp, message: `🟢 [PREVENTED] Recovery points preserved. Admin overrides can still delete if authorized, but standard hackers blocked.`, type: 'success' }
      ]);
    } else {
      // Compliance Mode
      setAttackStatus('prevented');
      setBackupLogs(prev => [
        ...prev,
        { timestamp, message: `🔒 [COMPLIANCE LOCK SHIELD] AWS Backup Vault Lock is in strictly enforced COMPLIANCE MODE!`, type: 'success' },
        { timestamp, message: `🚫 [CRITICAL BLOCKED] Vault lock is absolute. Modification or deletion of recovery points is completely disabled by AWS hardware enforcement.`, type: 'success' },
        { timestamp, message: `💡 [HARD ENFORCEMENT] Even AWS Root Account login or AWS Support cannot bypass, reduce, or delete recovery points until the retention window expires!`, type: 'success' },
        { timestamp, message: `🏆 [COMPLETE RESILIENCE] Backup recovery points intact. Hacker completely blocked. Ransomware failure!`, type: 'success' }
      ]);
    }
  };

  const resetBackupSim = () => {
    setBackupStatus('idle');
    setAttackStatus('none');
    setBackupLogs([]);
  };

  const runChaosSimulation = async () => {
    if (chaosSimStatus === 'running') return;
    setChaosSimStatus('running');
    setChaosConsoleLogs([]);
    const timestamp = new Date().toLocaleTimeString();

    if (chaosSimType === 'rds_failover') {
      setChaosConsoleLogs(prev => [
        ...prev,
        { timestamp, message: `🧪 [CHAOS INJECT] Executing RDS failover command via AWS FIS (Fault Injection Service)...`, type: 'info' },
        { timestamp, message: `💀 [RDS EVENT] Rebooting primary DB instance in us-east-1a with-failover...`, type: 'warn' }
      ]);
      await new Promise(r => setTimeout(r, 800));
      setChaosConsoleLogs(prev => [
        ...prev,
        { timestamp: new Date().toLocaleTimeString(), message: `📢 [MONITOR] Route 53 dynamic CNAME health probe senses latency spike. Alerting alarm engine...`, type: 'info' },
        { timestamp: new Date().toLocaleTimeString(), message: `🔄 [FAILOVER] Aurora DB cluster automatically promotes synchronous hot-standby node in us-east-1b...`, type: 'warn' }
      ]);
      await new Promise(r => setTimeout(r, 800));
      setChaosConsoleLogs(prev => [
        ...prev,
        { timestamp: new Date().toLocaleTimeString(), message: `🟢 [SUCCESS] Standby node promoted to Primary. Target group endpoint switched in 12.4 seconds!`, type: 'success' },
        { timestamp: new Date().toLocaleTimeString(), message: `🏆 [COMPLETE] Chaos test complete. Outage minimized via RDS Multi-AZ.`, type: 'success' }
      ]);
      setChaosSimStatus('success');
    } else if (chaosSimType === 'az_blackhole') {
      setChaosConsoleLogs(prev => [
        ...prev,
        { timestamp, message: `🧪 [CHAOS INJECT] Injecting network blackout into Availability Zone us-east-1a...`, type: 'info' },
        { timestamp, message: `⚠️ [VPC EVENT] Revoking Route Table paths and blocking security group ports to mock physical fiber cuts...`, type: 'error' }
      ]);
      await new Promise(r => setTimeout(r, 800));
      setChaosConsoleLogs(prev => [
        ...prev,
        { timestamp: new Date().toLocaleTimeString(), message: `📢 [ASG MONITOR] EC2 Auto-Scaling Group senses 3 degraded instances in us-east-1a (Health checks failing)...`, type: 'warn' },
        { timestamp: new Date().toLocaleTimeString(), message: `⚙️ [ORCHESTRATION] Terminating dead nodes. Spawning 3 new replacement instances in us-east-1b & us-east-1c...`, type: 'info' }
      ]);
      await new Promise(r => setTimeout(r, 800));
      setChaosConsoleLogs(prev => [
        ...prev,
        { timestamp: new Date().toLocaleTimeString(), message: `🟢 [SUCCESS] ASG fleet restored. 100% healthy nodes successfully registered behind the ALB.`, type: 'success' },
        { timestamp: new Date().toLocaleTimeString(), message: `🏆 [COMPLETE] AZ network split survived via robust Multi-AZ EC2 provisioning and self-healing ASG loops.`, type: 'success' }
      ]);
      setChaosSimStatus('success');
    } else {
      // dns_split_brain
      setChaosConsoleLogs(prev => [
        ...prev,
        { timestamp, message: `🧪 [CHAOS INJECT] Testing local Route 53 Resolver query hijack / split-brain simulation...`, type: 'info' },
        { timestamp, message: `🚨 [DNS SYSTEM] Overriding local client subnet cache responses with conflicting authoritative answers...`, type: 'error' }
      ]);
      await new Promise(r => setTimeout(r, 800));
      setChaosConsoleLogs(prev => [
        ...prev,
        { timestamp: new Date().toLocaleTimeString(), message: `🔍 [AUDIT] Inspecting routing latency under Active-Active splits. Analyzing split TTL caches...`, type: 'info' },
        { timestamp: new Date().toLocaleTimeString(), message: `⚙️ [MITIGATION] Hard-reloading resolver tables. Forcing Route 53 health-check failover to healthy Anycast nodes...`, type: 'warn' }
      ]);
      await new Promise(r => setTimeout(r, 800));
      setChaosConsoleLogs(prev => [
        ...prev,
        { timestamp: new Date().toLocaleTimeString(), message: `🟢 [SUCCESS] Route 53 split-horizon resolved. Resolver nodes flushed successfully.`, type: 'success' },
        { timestamp: new Date().toLocaleTimeString(), message: `🏆 [COMPLETE] Client traffic fully synchronized back to global root authoritative servers.`, type: 'success' }
      ]);
      setChaosSimStatus('success');
    }
  };


  return (
    <div className="dr-container animate-fadeIn">
      {styleBlock()}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-200 dark:border-slate-800 mb-6 text-left">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20 animate-pulse">
            <RefreshCw className="w-6 h-6 stroke-[2]" />
          </span>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <span className="dr-gradient-title">AWS Disaster Recovery &amp; Migration Workbench</span>
              <span className="bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800 uppercase tracking-widest font-mono">
                SaaS Academy
              </span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Covering DR strategy planning, DMS database continuous replication, Multi-Region Active failovers, and AWS Backup Vault Lock ransomware resilience.</p>
          </div>
        </div>
      </div>

      {/* Tab navigation bar */}
      <div className="da-tabs">
        <button className={`da-tb ${activeTab === 'notebook' ? 'da-on-notebook' : ''}`} onClick={() => setActiveTab('notebook')}>
          <BookOpen className="w-4 h-4" /> 📓 Visual Architect Notes
        </button>
        <button className={`da-tb ${activeTab === 'strategies' ? 'da-on-strategies' : ''}`} onClick={() => setActiveTab('strategies')}>
          <Sliders className="w-4 h-4" /> 1. DR Strategies &amp; Cost Optimizer
        </button>
        <button className={`da-tb ${activeTab === 'multiregion' ? 'da-on-multiregion' : ''}`} onClick={() => setActiveTab('multiregion')}>
          <Globe className="w-4 h-4" /> 2. Multi-Region Failover Simulator
        </button>
        <button className={`da-tb ${activeTab === 'dms' ? 'da-on-dms' : ''}`} onClick={() => setActiveTab('dms')}>
          <Database className="w-4 h-4" /> 3. Database Migration Service (DMS)
        </button>
        <button className={`da-tb ${activeTab === 'backup' ? 'da-on-backup' : ''}`} onClick={() => setActiveTab('backup')}>
          <Shield className="w-4 h-4" /> 4. AWS Backup &amp; Vault Lock
        </button>
        <button className={`da-tb ${activeTab === 'playbook' ? 'da-on-playbook' : ''}`} onClick={() => setActiveTab('playbook')}>
          <BookOpen className="w-4 h-4" /> 5. Recovery Playbook
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DISASTER RECOVERY STRATEGIES & COST OPTIMIZER                       */}
      {/* ========================================================================= */}
      {activeTab === 'strategies' && (
        <div className="space-y-6 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sidebar Controls */}
            <div className="lg:col-span-5 da-card border-t-4 border-t-teal-500 dark:border-t-teal-500/50 flex flex-col justify-between text-left">
              <div>
                <h3 className="da-card-title text-teal-700 dark:text-teal-400">
                  <Sliders className="w-5 h-5 text-teal-500 dark:text-teal-400" /> RTO / RPO Target Calibration
                </h3>
                <p className="da-card-desc mb-6">
                  Adjust the Recovery Time Objective (RTO) and Recovery Point Objective (RPO) sliders to immediately map the matching AWS architectural blueprint, estimating backup infrastructure monthly hosting overhead vs estimated downtime losses.
                </p>

                {/* RPO Slider */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Recovery Point Objective (RPO)
                    </label>
                    <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-xs font-bold rounded">
                      {rpoMinutes >= 60 ? `${(rpoMinutes / 60).toFixed(1)} Hours` : `${rpoMinutes} Minutes`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="1440"
                    step="10"
                    value={rpoMinutes}
                    onChange={(e) => setRpoMinutes(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-600 dark:accent-teal-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Active-Active (&lt;1m)</span>
                    <span>1 Hour (Pilot Light)</span>
                    <span>24 Hours (Backup)</span>
                  </div>
                </div>

                {/* RTO Slider */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Recovery Time Objective (RTO)
                    </label>
                    <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-xs font-bold rounded">
                      {rtoHours >= 1 ? `${rtoHours.toFixed(1)} Hours` : `${(rtoHours * 60).toFixed(0)} Minutes`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="48"
                    step="0.5"
                    value={rtoHours}
                    onChange={(e) => setRtoHours(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-600 dark:accent-teal-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>Instant Failover</span>
                    <span>4 Hours (Pilot Light)</span>
                    <span>48 Hours (Backup)</span>
                  </div>
                </div>

                {/* Downtime Cost Per Hour */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                      Business Downtime Cost / Hour
                    </label>
                    <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-bold rounded">
                      ${hourlyDowntimeCost.toLocaleString()} / Hour
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="20000"
                    step="500"
                    value={hourlyDowntimeCost}
                    onChange={(e) => setHourlyDowntimeCost(Number(e.target.value))}
                    className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-600 dark:accent-rose-500"
                  />
                </div>
              </div>

              {/* Direct Strategy buttons selection */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-4 mt-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">Or select preset blueprint:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => updateStrategyParameters('backup')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      selectedStrategy === 'backup' 
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-400 shadow-sm' 
                        : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    💾 Backup &amp; Restore
                  </button>
                  <button
                    onClick={() => updateStrategyParameters('pilot')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      selectedStrategy === 'pilot' 
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-400 shadow-sm' 
                        : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    🕯️ Pilot Light
                  </button>
                  <button
                    onClick={() => updateStrategyParameters('warm')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      selectedStrategy === 'warm' 
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-400 shadow-sm' 
                        : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    🔥 Warm Standby
                  </button>
                  <button
                    onClick={() => updateStrategyParameters('hot')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                      selectedStrategy === 'hot' 
                        ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-400 shadow-sm' 
                        : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    🌐 Multi-Site (Active-Active)
                  </button>
                </div>
              </div>
            </div>

            {/* Right Detailed Output Card */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="da-blueprint-card">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
                <h4 className="text-xs uppercase font-extrabold tracking-wider mb-2" style={{ color: 'var(--da-blueprint-accent)' }}>AWS Architectural Blueprint</h4>
                
                {selectedStrategy === 'backup' && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--da-blueprint-text)' }}>
                      💾 Option 1: Backup &amp; Restore
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--da-blueprint-muted)' }}>
                      Saves database dump recovery points and compute images (AMIs) in cold storage vaults. During a disaster, database backups are fetched from S3, compute machines are built from scratch, and application routes are updated.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                      <div className="da-blueprint-inner">
                        <span className="text-[10px] block uppercase" style={{ color: 'var(--da-blueprint-muted)' }}>Infrastructure Cost</span>
                        <span className="text-lg font-black font-mono" style={{ color: 'var(--da-blueprint-accent)' }}>${getMonthlyInfraCost()} / mo</span>
                      </div>
                      <div className="da-blueprint-inner">
                        <span className="text-[10px] block uppercase" style={{ color: 'var(--da-blueprint-muted)' }}>Estimated Downtime Loss</span>
                        <span className="text-lg font-black font-mono" style={{ color: 'var(--da-blueprint-accent-rose)' }}>${getEstimatedDowntimeCost().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedStrategy === 'pilot' && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--da-blueprint-text)' }}>
                      🕯️ Option 2: Pilot Light Approach
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--da-blueprint-muted)' }}>
                      Data (databases, files) is replicated continuously in synchronous or asynchronous replication states to the alternate region. Standby compute systems are provisioned but kept completely powered off or scaled to absolute zero (active database, dormant compute).
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                      <div className="da-blueprint-inner">
                        <span className="text-[10px] block uppercase" style={{ color: 'var(--da-blueprint-muted)' }}>Infrastructure Cost</span>
                        <span className="text-lg font-black font-mono" style={{ color: 'var(--da-blueprint-accent)' }}>${getMonthlyInfraCost()} / mo</span>
                      </div>
                      <div className="da-blueprint-inner">
                        <span className="text-[10px] block uppercase" style={{ color: 'var(--da-blueprint-muted)' }}>Estimated Downtime Loss</span>
                        <span className="text-lg font-black font-mono" style={{ color: 'var(--da-blueprint-accent-rose)' }}>${getEstimatedDowntimeCost().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedStrategy === 'warm' && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--da-blueprint-text)' }}>
                      🔥 Option 3: Warm Standby (Scaled Down Hot)
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--da-blueprint-muted)' }}>
                      Maintains a functionally minimal active replica version of the production environment always running in Region B (e.g. 1 EC2 instance instead of 10, database replica online). During failover, the Auto Scaling group quickly scales up to production volume.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                      <div className="da-blueprint-inner">
                        <span className="text-[10px] block uppercase" style={{ color: 'var(--da-blueprint-muted)' }}>Infrastructure Cost</span>
                        <span className="text-lg font-black font-mono" style={{ color: 'var(--da-blueprint-accent)' }}>${getMonthlyInfraCost()} / mo</span>
                      </div>
                      <div className="da-blueprint-inner">
                        <span className="text-[10px] block uppercase" style={{ color: 'var(--da-blueprint-muted)' }}>Estimated Downtime Loss</span>
                        <span className="text-lg font-black font-mono" style={{ color: 'var(--da-blueprint-accent-rose)' }}>${getEstimatedDowntimeCost().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedStrategy === 'hot' && (
                  <div className="space-y-4 animate-fadeIn">
                    <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--da-blueprint-text)' }}>
                      🌐 Option 4: Multi-Site Active-Active (Hot Site)
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--da-blueprint-muted)' }}>
                      Full-scale replica systems run continuously in active-active split traffic modes in both Region A and Region B. Route 53 utilizes Anycast or Latency routing to partition active workloads. Zero data loss and near zero-RTO.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                      <div className="da-blueprint-inner">
                        <span className="text-[10px] block uppercase" style={{ color: 'var(--da-blueprint-muted)' }}>Infrastructure Cost</span>
                        <span className="text-lg font-black font-mono" style={{ color: 'var(--da-blueprint-accent)' }}>${getMonthlyInfraCost().toLocaleString()} / mo</span>
                      </div>
                      <div className="da-blueprint-inner">
                        <span className="text-[10px] block uppercase" style={{ color: 'var(--da-blueprint-muted)' }}>Estimated Downtime Loss</span>
                        <span className="text-lg font-black font-mono" style={{ color: 'var(--da-blueprint-accent-rose)' }}>${getEstimatedDowntimeCost().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Interactive Cost Comparison Bars */}
              <div className="da-inner-card border border-t-4 border-t-teal-500/60 rounded-2xl p-5 space-y-4 text-xs">
                <span className="font-extrabold text-slate-800 dark:text-slate-200 block">Financial Tradeoff Analysis (Monthly Budget Breakdown)</span>
                
                {/* Cost Bar 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">AWS Infrastructure Running Costs:</span>
                    <span className="text-teal-600 dark:text-teal-400 font-mono font-bold">${getMonthlyInfraCost().toLocaleString()} / mo</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                    <div 
                      className="bg-teal-600 dark:bg-teal-500 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min((getMonthlyInfraCost() / 9500) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Cost Bar 2 */}
                <div className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Disaster Exposure Cost Risk (Based on RTO):</span>
                    <span className="text-rose-600 dark:text-rose-400 font-mono font-bold">${getEstimatedDowntimeCost().toLocaleString()} / incident</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3.5 overflow-hidden">
                    <div 
                      className="bg-rose-500 h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min((getEstimatedDowntimeCost() / 240000) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="p-3 da-svg-bg border rounded-xl leading-relaxed text-slate-600 dark:text-slate-400 text-[11px]">
                  <strong className="text-slate-900 dark:text-white">💡 Architectural Rule of Thumb:</strong> As RPO and RTO approach zero, your monthly infrastructure running costs increase exponentially because you replicate full-scale active database and application clusters in the standby region.
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: MULTI-REGION ACTIVE FAILOVER SIMULATOR                             */}
      {/* ========================================================================= */}
      {activeTab === 'multiregion' && (
        <div className="space-y-6 text-left animate-fadeIn">
          <div className="da-card border-t-4 border-t-sky-500 dark:border-t-sky-500/50 text-left">
            <h2 className="da-card-title text-sky-700 dark:text-sky-400">
              <Globe className="w-5 h-5 text-sky-500 dark:text-sky-400" /> AWS Multi-Region Failover Architecture Simulator
            </h2>
            <p className="da-card-desc">
              Trigger a simulated primary region failure inside <strong>us-east-1</strong>. Witness Route 53 redirection telemetry, automated database promotions, and scaled-down EC2 scaling operations inside <strong>eu-west-1</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Sidebar Controller */}
            <div className="lg:col-span-4 da-card border-t-4 border-t-sky-500 dark:border-t-sky-500/50 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block mb-2">1. Select Failover Strategy:</span>
                <select 
                  value={failoverScenario} 
                  onChange={(e) => setFailoverScenario(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs rounded-lg p-2 font-medium mb-4 cursor-pointer text-slate-700 dark:text-slate-300"
                >
                  <option value="pilot">🕯️ Pilot Light (Dormant EC2 Standby, Active DB)</option>
                  <option value="warm">🔥 Warm Standby (Scaled-Down Active Standby)</option>
                  <option value="hot">🌐 Multi-Site (Active-Active 50/50 Split)</option>
                </select>

                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Region A (us-east-1) Health:</span>
                    <span className={`px-2 py-0.5 rounded font-bold uppercase ${regionAStatus === 'healthy' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
                      {regionAStatus}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Active Routing Traffic Split:</span>
                    <span className="text-sky-600 dark:text-sky-400 font-bold font-mono">
                      {trafficSplit}% us-east-1 / {100 - trafficSplit}% eu-west-1
                    </span>
                  </div>
                </div>
              </div>

              {/* Simulation Action buttons */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                {regionAStatus === 'healthy' ? (
                  <button
                    onClick={triggerDisasterOutage}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-md shadow-rose-500/10 dark:shadow-rose-500/20 flex items-center justify-center gap-1.5"
                  >
                    <AlertTriangle className="w-4 h-4 animate-bounce" /> Trigger Region A Failure
                  </button>
                ) : (
                  <button
                    onClick={executeFailoverSwitchover}
                    disabled={failoverState !== 'running'}
                    className={`w-full font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      failoverState === 'running' 
                        ? 'bg-sky-600 hover:bg-sky-700 text-white shadow-md shadow-sky-500/10 dark:shadow-sky-500/20' 
                        : 'bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-600 border border-slate-200/50 dark:border-slate-800/80 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-4 h-4" /> Trigger Switchover Failover
                  </button>
                )}

                <button
                  onClick={resetFailoverSim}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-300 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" /> Reset Environment
                </button>
              </div>
            </div>

            {/* High-Fidelity SVG Diagram */}
            <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 border-t-4 border-t-sky-500/80 p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl min-h-[380px]">
              <div className="absolute right-3 top-3 flex items-center gap-2">
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-[10px] font-bold text-sky-400 rounded-md font-mono flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-sky-500 animate-pulse" /> TELEMETRY ACTIVE
                </span>
              </div>

              {/* Render high-contrast architectural diagram */}
              <div className="flex-grow flex items-center justify-center">
                <svg viewBox="0 0 700 240" className="w-full h-auto">
                  {/* Outer Frame Grid Gradients */}
                  <defs>
                    <linearGradient id="regionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#0f172a" stopOpacity="0.9" />
                    </linearGradient>
                  </defs>

                  {/* Route 53 Core Global Endpoint */}
                  <g transform="translate(350, 25)">
                    <rect x="-60" y="-12" width="120" height="24" rx="6" fill="#4f46e5" stroke="#818cf8" strokeWidth="1" />
                    <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="0.5">🌐 Route 53 DNS</text>
                  </g>

                  {/* Region 1 Frame (us-east-1) */}
                  <g transform="translate(40, 60)">
                    <rect x="0" y="0" width="280" height="150" rx="8" fill="url(#regionGradient)" stroke={regionAStatus === 'offline' ? '#f43f5e' : '#4f46e5'} strokeWidth="1.5" strokeDasharray={regionAStatus === 'offline' ? '6,4' : 'none'} />
                    <text x="12" y="18" fill={regionAStatus === 'offline' ? '#f43f5e' : '#818cf8'} fontSize="9" fontWeight="bold">🇺🇸 us-east-1 (Primary Region)</text>
                    
                    {/* ALB Ingress Card */}
                    <g transform="translate(20, 30)">
                      <rect x="0" y="0" width="240" height="30" rx="6" fill="#1e293b" stroke={regionAStatus === 'offline' ? '#f43f5e' : '#334155'} strokeWidth="1" />
                      <text x="12" y="18" fill="#e2e8f0" fontSize="9" fontWeight="bold">ALB Ingress Gateway</text>
                      <circle cx="220" cy="15" r="4" fill={regionAStatus === 'healthy' ? '#10b981' : '#f43f5e'} className={regionAStatus === 'healthy' ? 'pulse-circle' : ''} />
                    </g>

                    {/* EC2 Instance cluster cards */}
                    <g transform="translate(20, 70)">
                      <rect x="0" y="0" width="110" height="32" rx="6" fill="#0f172a" stroke={regionAStatus === 'offline' ? '#f43f5e' : '#10b981'} strokeWidth="1" />
                      <text x="8" y="14" fill="#e2e8f0" fontSize="8" fontWeight="bold">EC2 Web Servers</text>
                      <text x="8" y="24" fill="#64748b" fontSize="7">Status: {regionAStatus === 'healthy' ? '4 Nodes Active' : 'Offline'}</text>
                    </g>

                    {/* RDS/Aurora writer database */}
                    <g transform="translate(150, 70)">
                      <rect x="0" y="0" width="110" height="32" rx="6" fill="#0f172a" stroke={regionAStatus === 'offline' ? '#f43f5e' : '#4f46e5'} strokeWidth="1" />
                      <text x="8" y="14" fill="#e2e8f0" fontSize="8" fontWeight="bold">🛢️ Aurora MySQL</text>
                      <text x="8" y="24" fill="#818cf8" fontSize="7" fontWeight="bold">Role: WRITER</text>
                    </g>
                  </g>

                  {/* Region 2 Frame (eu-west-1 Standby) */}
                  <g transform="translate(380, 60)">
                    <rect x="0" y="0" width="280" height="150" rx="8" fill="url(#regionGradient)" stroke={failoverState === 'success' ? '#10b981' : '#4f46e5'} strokeWidth="1.5" />
                    <text x="12" y="18" fill={failoverState === 'success' ? '#10b981' : '#818cf8'} fontSize="9" fontWeight="bold">🇪🇺 eu-west-1 (Secondary Region)</text>
                    
                    {/* ALB Ingress Card */}
                    <g transform="translate(20, 30)">
                      <rect x="0" y="0" width="240" height="30" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                      <text x="12" y="18" fill="#e2e8f0" fontSize="9" fontWeight="bold">ALB Ingress Gateway</text>
                      <circle cx="220" cy="15" r="4" fill={failoverState === 'success' || failoverScenario === 'hot' ? '#10b981' : '#e2e8f0'} />
                    </g>

                    {/* EC2 Instance cluster cards */}
                    <g transform="translate(20, 70)">
                      <rect x="0" y="0" width="110" height="32" rx="6" fill="#0f172a" stroke="#4f46e5" strokeWidth="1" />
                      <text x="8" y="14" fill="#e2e8f0" fontSize="8" fontWeight="bold">EC2 Web Servers</text>
                      <text x="8" y="24" fill="#818cf8" fontSize="7" fontWeight="bold">
                        {failoverState === 'success' ? '4 Nodes Active' : failoverScenario === 'warm' ? '1 Node Active' : '0 Nodes (Dormant)'}
                      </text>
                    </g>

                    {/* RDS/Aurora replica reader database */}
                    <g transform="translate(150, 70)">
                      <rect x="0" y="0" width="110" height="32" rx="6" fill="#0f172a" stroke="#818cf8" strokeWidth="1" />
                      <text x="8" y="14" fill="#e2e8f0" fontSize="8" fontWeight="bold">🛢️ Aurora MySQL</text>
                      <text x="8" y="24" fill={failoverState === 'success' ? '#10b981' : '#fb923c'} fontSize="7" fontWeight="bold">
                        {failoverState === 'success' ? 'Role: WRITER' : 'Role: REPLICA'}
                      </text>
                    </g>
                  </g>

                  {/* Flow Conduits (Route 53 to Region A) */}
                  <path d="M 330 37 L 180 90" fill="none" strokeWidth="1.5" className={regionAStatus === 'healthy' ? 'dr-flow-blue' : 'dr-flow-red'} />
                  {/* Flow Conduits (Route 53 to Region B) */}
                  <path d="M 370 37 L 520 90" fill="none" strokeWidth="1.5" className={failoverState === 'success' || failoverScenario === 'hot' ? 'dr-flow-green' : 'dr-flow-blue'} />

                  {/* Database Replication Conduit connecting Region A Writer to Region B Reader */}
                  <path d="M 235 147 L 465 147" fill="none" strokeWidth="2" strokeDasharray="5,4" stroke={failoverState === 'success' ? '#64748b' : '#fb923c'} />
                </svg>
              </div>

              {/* Telemetry live logs */}
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                <div className="bg-slate-50 dark:bg-slate-950 px-3 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">failover-telemetry.log</span>
                </div>
                <div className="bg-slate-900 dark:bg-slate-950 p-3 h-24 overflow-y-auto text-[10px] font-mono leading-relaxed text-slate-300">
                  {failoverLogs.length === 0 ? (
                    <div className="text-slate-400 italic text-center py-4">Environment idle. Click "Trigger Region A Failure" to execute failover plan scenarios.</div>
                  ) : (
                    failoverLogs.map((log, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-indigo-400">{log.timestamp}</span>
                        <span className={log.type === 'error' ? 'text-rose-400 font-bold' : log.type === 'success' ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: DATABASE MIGRATION SERVICE (DMS) & REPLICATION HUB                 */}
      {/* ========================================================================= */}
      {activeTab === 'dms' && (
        <div className="space-y-6 text-left animate-fadeIn">
          <div className="da-card border-t-4 border-t-orange-500 dark:border-t-orange-500/50 text-left">
            <h2 className="da-card-title text-orange-700 dark:text-orange-400">
              <Database className="w-5 h-5 text-orange-500 dark:text-orange-400" /> Database Migration Service (DMS) &amp; Replication Engine
            </h2>
            <p className="da-card-desc">
              AWS DMS migrates relational databases (Oracle, MySQL, SQL Server) to AWS securely. Replicate databases dynamically with <strong>Continuous Replication (CDC)</strong> and simulate **Multi-AZ Replication Failover** parameters.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Sidebar Controls */}
            <div className="lg:col-span-4 da-card border-t-4 border-t-orange-500 dark:border-t-orange-500/50 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block mb-2">1. Migration Mode Selection:</span>
                <div className="flex bg-slate-100 dark:bg-slate-900 border dark:border-slate-800 p-0.5 rounded-lg text-xs mb-4">
                  <button
                    onClick={() => setDmsMode('full_load')}
                    className={`flex-1 py-1 rounded-md font-bold transition-all ${
                      dmsMode === 'full_load'
                        ? 'bg-white dark:bg-slate-800 shadow text-orange-600 dark:text-orange-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Full Load
                  </button>
                  <button
                    onClick={() => setDmsMode('cdc')}
                    className={`flex-1 py-1 rounded-md font-bold transition-all ${
                      dmsMode === 'cdc'
                        ? 'bg-white dark:bg-slate-800 shadow text-orange-600 dark:text-orange-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Load &amp; CDC
                  </button>
                  <button
                    onClick={() => setDmsMode('multi_az')}
                    className={`flex-1 py-1 rounded-md font-bold transition-all ${
                      dmsMode === 'multi_az'
                        ? 'bg-white dark:bg-slate-800 shadow text-orange-600 dark:text-orange-400'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Multi-AZ Task
                  </button>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Replication Task State:</span>
                    <span className="text-orange-600 dark:text-orange-400 font-bold uppercase">{dmsStatus}</span>
                  </div>

                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Estimated Migration Downtime:</span>
                    <span className={`font-bold ${migrationDowntime.includes('45') ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {migrationDowntime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Control Action Buttons */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  onClick={triggerDmsMigration}
                  disabled={dmsStatus === 'migrating'}
                  className={`w-full font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    dmsStatus === 'migrating' 
                      ? 'bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-600 border border-slate-200/50 dark:border-slate-800/80 cursor-not-allowed' 
                      : 'bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/10 dark:shadow-orange-500/20'
                  }`}
                >
                  <Play className="w-4 h-4" /> Start DMS Task
                </button>

                {dmsMode === 'cdc' && dmsStatus === 'replicating' && (
                  <button
                    onClick={triggerLiveUpdate}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-4 h-4 animate-pulse" /> Simulate Live Source Update
                  </button>
                )}

                {dmsMode === 'multi_az' && dmsStatus !== 'idle' && (
                  <button
                    onClick={simulateDmsFailover}
                    disabled={dmsNodeActive !== 'primary'}
                    className={`w-full font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      dmsNodeActive === 'primary' 
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/10 dark:shadow-rose-500/20' 
                        : 'bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-600 border border-slate-200/50 dark:border-slate-800/80 cursor-not-allowed'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" /> Trigger DMS Multi-AZ Failover
                  </button>
                )}

                <button
                  onClick={resetDmsSim}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-300 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" /> Reset Migration
                </button>
              </div>
            </div>

            {/* Interactive SVG Diagram */}
            <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 border-t-4 border-t-orange-500/80 p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl min-h-[380px]">
              
              {/* Progress bar overlay for Full Load */}
              {dmsStatus === 'migrating' && (
                <div className="absolute top-3 left-6 right-6 bg-slate-900 border border-orange-500/20 rounded-xl p-3 text-xs text-white z-10 flex items-center justify-between gap-4">
                  <div className="flex-grow">
                    <div className="flex justify-between font-bold text-[10px] text-slate-400 uppercase mb-1">
                      <span>Database Full Load Status</span>
                      <span>{dmsProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div className="bg-orange-500 h-full rounded-full transition-all duration-300" style={{ width: `${dmsProgress}%` }} />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex-grow flex items-center justify-center">
                <svg viewBox="0 0 700 220" className="w-full h-auto">
                  {/* Source On Premises DB */}
                  <g transform="translate(60, 100)">
                    <rect x="-40" y="-30" width="80" height="60" rx="8" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                    <text x="0" y="-6" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">🏠 On-Premise</text>
                    <text x="0" y="8" fill="#cbd5e1" fontSize="8" textAnchor="middle">Oracle DB</text>
                    <text x="0" y="18" fill="#64748b" fontSize="7" textAnchor="middle" className="font-mono">Port: 1521</text>
                  </g>

                  {/* DMS Replication Engine Box */}
                  <g transform="translate(350, 100)">
                    {dmsMode === 'multi_az' ? (
                      <g>
                        {/* Synchronous Boundary */}
                        <rect x="-105" y="-55" width="210" height="110" rx="12" fill="none" stroke="#4f46e5" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="0" y="-42" fill="#818cf8" fontSize="8" fontWeight="bold" textAnchor="middle">DMS Task Multi-AZ Boundary</text>

                        {/* Primary Node */}
                        <g transform="translate(-50, 0)">
                          <rect x="-40" y="-25" width="80" height="50" rx="6" fill="#0f172a" stroke={dmsNodeActive === 'primary' ? '#10b981' : dmsNodeActive === 'recovering' ? '#f43f5e' : '#64748b'} strokeWidth="1.5" />
                          <text x="0" y="-6" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">Primary Node</text>
                          <text x="0" y="6" fill="#cbd5e1" fontSize="7" textAnchor="middle">AZ: us-east-1a</text>
                          <text x="0" y="16" fill={dmsNodeActive === 'primary' ? '#10b981' : '#f43f5e'} fontSize="7" fontWeight="bold" textAnchor="middle">
                            {dmsNodeActive === 'primary' ? 'ONLINE' : 'CRASHED'}
                          </text>
                        </g>

                        {/* Standby Node */}
                        <g transform="translate(50, 0)">
                          <rect x="-40" y="-25" width="80" height="50" rx="6" fill="#0f172a" stroke={dmsNodeActive === 'standby' ? '#10b981' : '#4f46e5'} strokeWidth="1.5" />
                          <text x="0" y="-6" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">Standby Node</text>
                          <text x="0" y="6" fill="#cbd5e1" fontSize="7" textAnchor="middle">AZ: us-east-1b</text>
                          <text x="0" y="16" fill={dmsNodeActive === 'standby' ? '#10b981' : '#818cf8'} fontSize="7" fontWeight="bold" textAnchor="middle">
                            {dmsNodeActive === 'standby' ? 'ACTIVE PRIMARY' : 'STANDBY'}
                          </text>
                        </g>
                      </g>
                    ) : (
                      <g>
                        <rect x="-80" y="-35" width="160" height="70" rx="8" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="1.5" />
                        <text x="0" y="-12" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">⚡ DMS Repl Task</text>
                        <text x="0" y="4" fill="#cbd5e1" fontSize="8" textAnchor="middle">Instance: node-large</text>
                        <text x="0" y="16" fill="#818cf8" fontSize="7" textAnchor="middle">Auto-Scale Task Active</text>
                      </g>
                    )}
                  </g>

                  {/* Target AWS RDS Aurora DB */}
                  <g transform="translate(630, 100)">
                    <rect x="-40" y="-30" width="80" height="60" rx="8" fill="#1e293b" stroke="#10b981" strokeWidth="1.5" />
                    <text x="0" y="-6" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">☁️ AWS Cloud</text>
                    <text x="0" y="8" fill="#cbd5e1" fontSize="8" textAnchor="middle">Aurora MySQL</text>
                    <text x="0" y="18" fill="#10b981" fontSize="7" textAnchor="middle" className="font-mono">Port: 3306</text>
                  </g>

                  {/* Flow conduits: Source -> Replication instance */}
                  <path d="M 105 100 L 240 100" fill="none" strokeWidth="2.5" className={dmsStatus === 'migrating' || dmsStatus === 'replicating' ? 'dr-flow-blue' : 'dr-flow-gray'} />
                  {/* Flow conduits: Replication instance -> Target */}
                  <path d="M 460 100 L 585 100" fill="none" strokeWidth="2.5" className={dmsStatus === 'migrating' || dmsStatus === 'replicating' ? 'dr-flow-green' : 'dr-flow-gray'} />
                </svg>
              </div>

              {/* Logs output console */}
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                <div className="bg-slate-50 dark:bg-slate-950 px-3 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">dms-replication.log</span>
                </div>
                <div className="bg-slate-900 dark:bg-slate-950 p-3 h-24 overflow-y-auto text-[10px] font-mono leading-relaxed text-slate-300">
                  {dmsLogs.length === 0 ? (
                    <div className="text-slate-400 italic text-center py-4">DMS migration environment idle. Click "Start DMS Task" to begin database schema copy.</div>
                  ) : (
                    dmsLogs.map((log, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-orange-400">{log.timestamp}</span>
                        <span className={log.type === 'error' ? 'text-rose-400 font-bold' : log.type === 'success' ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AWS BACKUP & VAULT LOCK RANSOMWARE SANDBOX                        */}
      {/* ========================================================================= */}
      {activeTab === 'backup' && (
        <div className="space-y-6 text-left animate-fadeIn">
          <div className="da-card border-t-4 border-t-emerald-500 dark:border-t-emerald-500/50 text-left">
            <h2 className="da-card-title text-emerald-700 dark:text-emerald-400">
              <Shield className="w-5 h-5 text-emerald-500 dark:text-emerald-400" /> AWS Backup Vault Lock Ransomware Sandbox
            </h2>
            <p className="da-card-desc">
              Understand how AWS Backup Vault Lock guards backups. Toggle between <strong>Governance Mode</strong> and <strong>Compliance Mode (Enforced Lock)</strong>, then trigger a simulated ransomware attack to evaluate resilience.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Sidebar Controls */}
            <div className="lg:col-span-4 da-card border-t-4 border-t-emerald-500 dark:border-t-emerald-500/50 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block mb-2">1. Backup Vault Lock Strategy:</span>
                <div className="space-y-2 mb-4">
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer select-none">
                    <input
                      type="radio"
                      name="vaultLock"
                      checked={vaultLockMode === 'none'}
                      onChange={() => setVaultLockMode('none')}
                      className="text-emerald-600 accent-emerald-600 dark:accent-emerald-500"
                    />
                    🔓 No Lock (Standard Unprotected Vault)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer select-none">
                    <input
                      type="radio"
                      name="vaultLock"
                      checked={vaultLockMode === 'governance'}
                      onChange={() => setVaultLockMode('governance')}
                      className="text-emerald-600 accent-emerald-600 dark:accent-emerald-500"
                    />
                    🛡️ Governance Mode (Administrator can bypass)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer select-none">
                    <input
                      type="radio"
                      name="vaultLock"
                      checked={vaultLockMode === 'compliance'}
                      onChange={() => setVaultLockMode('compliance')}
                      className="text-emerald-600 accent-emerald-600 dark:accent-emerald-500"
                    />
                    🔒 Compliance Mode (Zero-trust enforce Lock)
                  </label>
                </div>

                <div className="p-3 da-svg-bg rounded-xl text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed border border-slate-200 dark:border-slate-800">
                  {vaultLockMode === 'none' && '⚠️ BACKUPS AT RISK: A compromised root key or malicious hacker can delete recovery points immediately, leading to total data loss.'}
                  {vaultLockMode === 'governance' && 'ℹ️ GOVERNANCE: Deletions are blocked for standard users, but authorized administrators with explicit credentials can delete recovery points or remove lock.'}
                  {vaultLockMode === 'compliance' && '🚀 ZERO-TRUST: Compliance mode locks the vault hardware. No user (including the Account Creator or AWS Support) can delete recovery points until retention windows expire!'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                <button
                  onClick={triggerBackupJob}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 dark:shadow-emerald-500/20"
                >
                  <RefreshCw className="w-4 h-4" /> Run Backup Job
                </button>

                <button
                  onClick={triggerRansomwareAttack}
                  disabled={backupStatus !== 'backed_up'}
                  className={`w-full font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    backupStatus === 'backed_up' 
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-500/10 dark:shadow-rose-500/20' 
                      : 'bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-600 border border-slate-200/50 dark:border-slate-800/80 cursor-not-allowed'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" /> Simulate Ransomware Attack
                </button>

                <button
                  onClick={resetBackupSim}
                  className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:border-slate-800 dark:text-slate-300 font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Reset Sandbox
                </button>
              </div>
            </div>

            {/* High-Fidelity SVG Simulator */}
            <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 border-t-4 border-t-emerald-500/80 p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl min-h-[380px]">
              
              {/* Attack assessment popup alerts */}
              {attackStatus !== 'none' && (
                <div className={`absolute top-3 left-6 right-6 border rounded-xl p-3 text-xs z-10 flex items-center gap-3 animate-fadeIn ${attackStatus === 'breached' ? 'bg-rose-950/80 border-rose-500 text-rose-200' : 'bg-emerald-950/80 border-emerald-500 text-emerald-200'}`}>
                  <span className="p-1.5 rounded-lg bg-black/40 text-lg">
                    {attackStatus === 'breached' ? '💀' : '🛡️'}
                  </span>
                  <div>
                    <span className="font-extrabold block">
                      {attackStatus === 'breached' ? 'VAULT BREACHED - DATA LOSS!' : 'ATTACK BLOCKED SUCCESSFULLY'}
                    </span>
                    <span className="text-[10px] text-slate-300">
                      {attackStatus === 'breached' ? 'All backups have been deleted by the hacker. Vault had no protection locks active.' : 'AWS Backup Vault Lock successfully blocked delete recovery points commands.'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex-grow flex items-center justify-center">
                <svg viewBox="0 0 700 220" className="w-full h-auto">
                  {/* AWS Workloads (EBS, RDS, EFS) */}
                  <g transform="translate(80, 110)">
                    {/* EBS */}
                    <g transform="translate(0, -40)">
                      <rect x="-35" y="-12" width="70" height="24" rx="4" fill="#1e293b" stroke="#4f46e5" strokeWidth="1" />
                      <text x="0" y="4" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">💻 EBS Volume</text>
                    </g>
                    {/* RDS */}
                    <g transform="translate(0, 0)">
                      <rect x="-35" y="-12" width="70" height="24" rx="4" fill="#1e293b" stroke="#10b981" strokeWidth="1" />
                      <text x="0" y="4" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">🛢️ RDS MySQL</text>
                    </g>
                    {/* EFS */}
                    <g transform="translate(0, 40)">
                      <rect x="-35" y="-12" width="70" height="24" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
                      <text x="0" y="4" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">📂 EFS Share</text>
                    </g>
                  </g>

                  {/* AWS Backup Controller Engine */}
                  <g transform="translate(280, 110)">
                    <circle cx="0" cy="0" r="30" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="2" />
                    <text x="0" y="3" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle">🛡️ Backup</text>
                    <text x="0" y="12" fill="#818cf8" fontSize="7" textAnchor="middle">Engine</text>

                    {/* Flow markers */}
                    <circle cx="0" cy="0" r="33" fill="none" stroke="#818cf8" strokeWidth="1" strokeDasharray="4,4" className="pulse-circle" />
                  </g>

                  {/* Secure Vault with Vault Lock status */}
                  <g transform="translate(540, 110)">
                    {/* Vault Body */}
                    <rect x="-60" y="-50" width="120" height="100" rx="10" fill="#0f172a" stroke={vaultLockMode === 'compliance' ? '#10b981' : vaultLockMode === 'governance' ? '#fb923c' : '#64748b'} strokeWidth="2" />
                    <text x="0" y="-32" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">🔒 Backup Vault</text>
                    
                    {/* Vault Locks state graphics */}
                    <g transform="translate(0, 10)">
                      <circle cx="0" cy="0" r="16" fill={vaultLockMode === 'compliance' ? '#065f46' : vaultLockMode === 'governance' ? '#9a3412' : '#1e293b'} />
                      {vaultLockMode === 'none' ? (
                        <g>
                          <Unlock className="w-5 h-5 text-slate-400" x="-10" y="-10" />
                          <text x="0" y="26" fill="#cbd5e1" fontSize="8" textAnchor="middle">NO LOCK</text>
                        </g>
                      ) : vaultLockMode === 'governance' ? (
                        <g>
                          <Shield className="w-5 h-5 text-orange-400" x="-10" y="-10" />
                          <text x="0" y="26" fill="#fb923c" fontSize="8" textAnchor="middle" fontWeight="bold">GOVERNANCE</text>
                        </g>
                      ) : (
                        <g>
                          <Lock className="w-5 h-5 text-emerald-400" x="-10" y="-10" />
                          <text x="0" y="26" fill="#10b981" fontSize="8" textAnchor="middle" fontWeight="bold">COMPLIANCE</text>
                        </g>
                      )}
                    </g>
                  </g>

                  {/* Flow links: Workloads -> Backup Engine */}
                  <path d="M 120 70 L 250 110" fill="none" strokeWidth="1.5" className={backupStatus === 'backing_up' ? 'dr-flow-blue' : 'dr-flow-gray'} />
                  <path d="M 120 110 L 250 110" fill="none" strokeWidth="1.5" className={backupStatus === 'backing_up' ? 'dr-flow-blue' : 'dr-flow-gray'} />
                  <path d="M 120 150 L 250 110" fill="none" strokeWidth="1.5" className={backupStatus === 'backing_up' ? 'dr-flow-blue' : 'dr-flow-gray'} />

                  {/* Flow link: Backup Engine -> Vault */}
                  <path d="M 310 110 L 480 110" fill="none" strokeWidth="2.5" className={backupStatus === 'backing_up' ? 'dr-flow-green' : 'dr-flow-gray'} />
                </svg>
              </div>

              {/* Console log output */}
              <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md">
                <div className="bg-slate-50 dark:bg-slate-950 px-3 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">backup-vault.log</span>
                </div>
                <div className="bg-slate-900 dark:bg-slate-950 p-3 h-24 overflow-y-auto text-[10px] font-mono leading-relaxed text-slate-300">
                  {backupLogs.length === 0 ? (
                    <div className="text-slate-400 italic text-center py-4">Vault sandbox idle. Click "Run Backup Job" to capture system state.</div>
                  ) : (
                    backupLogs.map((log, index) => (
                      <div key={index} className="flex gap-2">
                        <span className="text-emerald-400">{log.timestamp}</span>
                        <span className={log.type === 'error' ? 'text-rose-400 font-bold' : log.type === 'success' ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: ARCHITECT'S RECOVERY PLAYBOOK & TIPS                               */}
      {/* ========================================================================= */}
      {activeTab === 'playbook' && (
        <div className="space-y-6 text-left animate-fadeIn">
          <div className="da-card border-t-4 border-t-indigo-500 dark:border-t-indigo-500/50 text-left">
            <h2 className="da-card-title text-indigo-700 dark:text-indigo-400">
              <BookOpen className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Architect's Disaster Recovery Playbook &amp; Strategy Tips
            </h2>
            <p className="da-card-desc">
              Master disaster recovery governance, database migration schemas conversions, and cost optimization trade-offs under AWS best practices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            
            {/* Box 1 */}
            <div className="da-card border-t-4 border-t-indigo-500 dark:border-t-indigo-500/50 text-left space-y-3">
              <h4 className="font-extrabold text-slate-900 dark:text-indigo-300 text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                📂 1. Schema Migration &amp; AWS SCT
              </h4>
              <p>
                When migrating databases across different database engines (e.g. Oracle or SQL Server to AWS Aurora MySQL/PostgreSQL), schema structures are incompatible. You must use the **AWS Schema Conversion Tool (SCT)**:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>SCT analyzes your source database schemas, functions, stored procedures, and triggers, converting them to equivalent target MySQL/PostgreSQL statements.</li>
                <li>Identifies statements that cannot be automatically converted, outputting detailed remediation steps.</li>
                <li>Once the schema is loaded via SCT, **AWS DMS** is started to execute the data load migration.</li>
              </ul>
            </div>

            {/* Box 2 */}
            <div className="da-card border-t-4 border-t-indigo-500 dark:border-t-indigo-500/50 text-left space-y-3">
              <h4 className="font-extrabold text-slate-900 dark:text-indigo-300 text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                🛢️ 2. RDS &amp; Aurora Global Database DR
              </h4>
              <p>
                To achieve low multi-region recovery objectives (near zero RPO/RTO) for mission-critical databases, configure **Amazon Aurora Global Databases**:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Aurora Global Database replicates data physical blocks directly from the storage layer (bypassing SQL engine overheads), reducing multi-region replication lag to under 1 second.</li>
                <li>During a disaster in Region A, promoting the secondary database in Region B takes less than 1 minute, with zero data loss options.</li>
                <li>Enables regional read scaling, allowing eu-west-1 clients to run local queries against read replicas with minimal latency.</li>
              </ul>
            </div>

            {/* Box 3 */}
            <div className="da-card border-t-4 border-t-indigo-500 dark:border-t-indigo-500/50 text-left space-y-3">
              <h4 className="font-extrabold text-slate-900 dark:text-indigo-300 text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                🔒 3. AWS Backup Vault Lock Best Practices
              </h4>
              <p>
                Safeguard backup recovery points from accidental deletions, insider threats, or malicious ransomware:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Use **Compliance Mode** to enforce write-once-read-many (WORM) storage. Compliance lock holds even if administrator credentials or root logins are compromised.</li>
                <li>Set a custom cooling-off period (1 to 7 days) during which you can still disable or delete Compliance Lock before it becomes permanently locked.</li>
                <li>Combine with **AWS Backup Audit Manager** to continuously audit backup compliance scores.</li>
              </ul>
            </div>

            {/* Box 4 */}
            <div className="da-card border-t-4 border-t-indigo-500 dark:border-t-indigo-500/50 text-left space-y-3">
              <h4 className="font-extrabold text-slate-900 dark:text-indigo-300 text-sm flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                🌐 4. Hybrid On-Premise Migration Strategy
              </h4>
              <p>
                Seamlessly bridge on-premises data centers with the AWS Cloud during long-term migrations:
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Connect locations using **AWS Direct Connect** or redundant IPSec VPN tunnels to guarantee reliable bandwidth and secure data transfers.</li>
                <li>Deploy a DMS replication node inside AWS VPC private subnets, mapping it to target databases via private security groups.</li>
                <li>Use **AWS Storage Gateway** (File, Volume, or Tape gateways) to replicate legacy files directly to Amazon S3.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      {activeTab === 'notebook' && (
        <div className="space-y-6 animate-fadeIn text-left">
          
          <div className="da-card border-t-4 border-t-amber-500 dark:border-t-amber-500/50 text-left">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 font-display">
              <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" /> Disaster Recovery &amp; Database Migration Notes
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed font-sans font-semibold">
              Explore Disaster Recovery metrics (RTO/RPO), AWS Database Migration Service (DMS) continuous replication, Schema Conversion Tool (SCT), and Backup Vault Lock governance strategies.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Sidebar Category Explorer */}
            <div className="lg:col-span-3 space-y-4 text-left">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest block pl-1">DR Module Directory:/</span>
              
              <div className="acad-dir-container">
                <div className="acad-dir-header">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Module Explorer</span>
                </div>

                {/* CATEGORY 1: DISASTER RECOVERY FUNDAMENTALS */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'fundamentals' ? '' : 'fundamentals')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      1. DR Fundamentals
                    </span>
                    {expandedCategory === 'fundamentals' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'fundamentals' && (
                    <div className="bg-slate-50/50 dark:bg-slate-900/50 py-1 border-b border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={() => setSelectedNote('rto_rpo')}
                        className={`acad-dir-item-btn ${selectedNote === 'rto_rpo' ? 'acad-active' : ''}`}
                      >
                        RTO &amp; RPO Taxonomy
                      </button>
                      <button 
                        onClick={() => setSelectedNote('dr_strategies')}
                        className={`acad-dir-item-btn ${selectedNote === 'dr_strategies' ? 'acad-active' : ''}`}
                      >
                        DR Strategy Blueprints
                      </button>
                      <button 
                        onClick={() => setSelectedNote('dr_tips')}
                        className={`acad-dir-item-btn ${selectedNote === 'dr_tips' ? 'acad-active' : ''}`}
                      >
                        HA &amp; Chaos Tips
                      </button>
                    </div>
                  )}
                </div>

                {/* CATEGORY 2: MULTI-REGION & HYBRID */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'failover' ? '' : 'failover')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-500" />
                      2. Multi-Region &amp; Hybrid
                    </span>
                    {expandedCategory === 'failover' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'failover' && (
                    <div className="bg-slate-50/50 dark:bg-slate-900/50 py-1 border-b border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={() => setSelectedNote('failover_routing')}
                        className={`acad-dir-item-btn ${selectedNote === 'failover_routing' ? 'acad-active' : ''}`}
                      >
                        Route 53 Failover Routing
                      </button>
                      <button 
                        onClick={() => setSelectedNote('aurora_global_db')}
                        className={`acad-dir-item-btn ${selectedNote === 'aurora_global_db' ? 'acad-active' : ''}`}
                      >
                        Aurora Global Databases
                      </button>
                      <button 
                        onClick={() => setSelectedNote('hybrid_backup')}
                        className={`acad-dir-item-btn ${selectedNote === 'hybrid_backup' ? 'acad-active' : ''}`}
                      >
                        On-Premises &amp; Hybrid Backup
                      </button>
                    </div>
                  )}
                </div>

                {/* CATEGORY 3: DB & BACKUP GOVERNANCE */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'governance' ? '' : 'governance')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-500" />
                      3. DB &amp; Backup Governance
                    </span>
                    {expandedCategory === 'governance' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'governance' && (
                    <div className="bg-slate-50/50 dark:bg-slate-900/50 py-1 border-b border-slate-100 dark:border-slate-800">
                      <button 
                        onClick={() => setSelectedNote('dms_replication')}
                        className={`acad-dir-item-btn ${selectedNote === 'dms_replication' ? 'acad-active' : ''}`}
                      >
                        AWS DMS CDC Continuous Sync
                      </button>
                      <button 
                        onClick={() => setSelectedNote('aws_sct')}
                        className={`acad-dir-item-btn ${selectedNote === 'aws_sct' ? 'acad-active' : ''}`}
                      >
                        AWS Schema Conversion Tool (SCT)
                      </button>
                      <button 
                        onClick={() => setSelectedNote('backup_vault_lock')}
                        className={`acad-dir-item-btn ${selectedNote === 'backup_vault_lock' ? 'acad-active' : ''}`}
                      >
                        AWS Backup Vault Lock &amp; WORM
                      </button>
                    </div>
                  )}
                </div>

                {/* CATEGORY 4: ENTERPRISE MIGRATION SUITE */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'migration_suite' ? '' : 'migration_suite')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-indigo-500" />
                      4. Enterprise Migration Suite
                    </span>
                    {expandedCategory === 'migration_suite' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'migration_suite' && (
                    <div className="bg-slate-50/50 dark:bg-slate-900/50 py-1">
                      <button 
                        onClick={() => setSelectedNote('mgn_ads')}
                        className={`acad-dir-item-btn ${selectedNote === 'mgn_ads' ? 'acad-active' : ''}`}
                      >
                        ADS &amp; MGN Orchestration
                      </button>
                      <button 
                        onClick={() => setSelectedNote('large_data_transfer')}
                        className={`acad-dir-item-btn ${selectedNote === 'large_data_transfer' ? 'acad-active' : ''}`}
                      >
                        Large Scale Data Transfer
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-[11px] leading-relaxed text-slate-400 font-semibold space-y-1">
                <span className="text-white font-extrabold flex items-center gap-1.5 mb-1 text-[11.5px]">
                  <Info className="w-3.5 h-3.5 text-indigo-400" /> Academy Advice
                </span>
                "Choose any module from the tree above. Each view includes custom interactive elements, dynamic code blocks, or structural system architecture diagrams."
              </div>
            </div>

            {/* Right Active Note Workspace */}
            <div className="lg:col-span-9 space-y-6 text-left">

              {/* ========================================================================= */}
              {/* CONCEPT 1: RTO & RPO TAXONOMY                                             */}
              {/* ========================================================================= */}
              {selectedNote === 'rto_rpo' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Disaster Recovery Metrics</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 font-display">RTO &amp; RPO Technical Taxonomy</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('strategies')}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Info className="w-3 h-3" /> Go to DR Strategies
                      </button>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Concept 1 of 10</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Recovery Point Objective (RPO) and Recovery Time Objective (RTO) are the critical architectural pillars that dictate the engineering complexity, system redundancy, and cost requirements of a Disaster Recovery framework.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 dark:text-white block">Core Architecture Characteristics:</span>
                      <table className="acad-table">
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            <th>Recovery Point (RPO)</th>
                            <th>Recovery Time (RTO)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="font-extrabold">Definition</td>
                            <td className="text-slate-600 dark:text-slate-300">Maximum tolerable data loss margin</td>
                            <td className="text-slate-600 dark:text-slate-300">Maximum tolerable downtime duration</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">Focus Area</td>
                            <td className="text-blue-700 dark:text-blue-400 font-semibold">Databases &amp; Backups frequency</td>
                            <td className="text-indigo-700 dark:text-indigo-400 font-semibold">Infrastructure spin-up &amp; routing</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">Measured In</td>
                            <td>Seconds, Minutes, or Hours</td>
                            <td>Minutes, Hours, or Days</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">Cost Dependency</td>
                            <td className="text-emerald-700 dark:text-emerald-400 font-bold">Continuous replication cost</td>
                            <td className="text-emerald-700 dark:text-emerald-400 font-bold">Standby resources provisioning cost</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="acad-takeaway-box">
                        <strong>💡 Professional Architect Takeaway:</strong><br />
                        Achieving near-zero RTO and RPO requires a Multi-Site Active-Active configuration, which forces you to run identical, fully operational production infrastructure in both regions. This doubles your baseline computing and licensing costs. Ensure stakeholders align business value with these budgets!
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 block uppercase tracking-wider">Disaster Timeline Visualizer</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Understand where RPO and RTO apply relative to a disaster event</p>
                      </div>

                      <div className="w-full py-4 rounded-xl border border-slate-100 flex items-center justify-center da-svg-bg">
                        <svg className="w-full max-w-[360px] h-[180px]" viewBox="0 0 360 180">
                          {/* Timeline horizontal line */}
                          <line x1="20" y1="90" x2="340" y2="90" stroke="var(--da-card-border)" strokeWidth="3" />
                          
                          {/* Events nodes */}
                          {/* 1. Last Backup Commit */}
                          <circle cx="60" cy="90" r="6" fill="var(--da-svg-indigo-border)" />
                          <text x="60" y="65" fill="var(--da-svg-indigo-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Last Backup Commit</text>
                          <text x="60" y="75" fill="var(--da-text-muted)" fontSize="6.5" textAnchor="middle">12:00 PM</text>

                          {/* 2. Disaster Event */}
                          <circle cx="180" cy="90" r="8" fill="var(--da-svg-red-border)" className="dr-node-glow" />
                          <text x="180" y="65" fill="var(--da-svg-red-text)" fontSize="8" fontWeight="black" textAnchor="middle">💥 DISASTER EVENT</text>
                          <text x="180" y="75" fill="var(--da-svg-red-border)" fontSize="7" fontWeight="bold" textAnchor="middle">1:00 PM</text>

                          {/* 3. Restoration Point */}
                          <circle cx="300" cy="90" r="6" fill="var(--da-svg-green-border)" />
                          <text x="300" y="65" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">System Restored</text>
                          <text x="300" y="75" fill="var(--da-text-muted)" fontSize="6.5" textAnchor="middle">5:00 PM</text>

                          {/* RPO Bracket line */}
                          <path d="M 60 110 H 180" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" strokeDasharray="3,3" />
                          <path d="M 60 106 V 114" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" />
                          <path d="M 180 106 V 114" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" />
                          <text x="120" y="125" fill="var(--da-svg-indigo-text)" fontSize="8" fontWeight="black" textAnchor="middle">RPO (Data Loss)</text>
                          <text x="120" y="135" fill="var(--da-text-muted)" fontSize="6.5" textAnchor="middle">Margin: 60 Minutes</text>

                          {/* RTO Bracket line */}
                          <path d="M 180 110 H 300" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1.5" strokeDasharray="3,3" />
                          <path d="M 180 106 V 114" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                          <path d="M 300 106 V 114" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                          <text x="240" y="125" fill="var(--da-svg-green-text)" fontSize="8" fontWeight="black" textAnchor="middle">RTO (Downtime)</text>
                          <text x="240" y="135" fill="var(--da-text-muted)" fontSize="6.5" textAnchor="middle">Duration: 4 Hours</text>
                        </svg>
                      </div>

                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                        📊 Note: RPO limits are strictly dictated by data persistence strategies (backups frequency vs continuous replication), whereas RTO is capped by deployment orchestration speed.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 2: DR STRATEGY BLUEPRINTS                                         */}
              {/* ========================================================================= */}
              {selectedNote === 'dr_strategies' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Architecture Blueprints</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 font-display">AWS DR Strategy Blueprints &amp; Redundancies</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('strategies')}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 dark:bg-teal-700 dark:hover:bg-teal-600 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Info className="w-3 h-3" /> Go to DR Strategies
                      </button>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Concept 2 of 10</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    AWS categorizes disaster recovery strategies into four distinct archetypes. Selecting a strategy is a trade-off between the Cost of Infrastructure and the Cost of Downtime. Explore the architectures below:
                  </p>

                  <div className="space-y-4">
                    {/* Inner strategy tab switcher */}
                    <div className="flex flex-wrap gap-2 mb-4 da-inner-card p-1.5 rounded-xl border w-fit">
                      {(['backup', 'pilot', 'warm', 'hot'] as const).map((strat) => (
                        <button
                          key={strat}
                          onClick={() => setActiveStrategyTab(strat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all select-none ${
                            activeStrategyTab === strat
                              ? 'bg-amber-600 text-white shadow-md shadow-amber-500/10'
                              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          {strat === 'backup' && '💾 Backup & Restore'}
                          {strat === 'pilot' && '🔥 Pilot Light'}
                          {strat === 'warm' && '⛅ Warm Standby'}
                          {strat === 'hot' && '⚡ Multi-Site Active'}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                      
                      <div className="md:col-span-7 flex flex-col justify-between">
                        <div className="da-inner-card border rounded-xl p-4 space-y-3 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                          {activeStrategyTab === 'backup' && (
                            <div>
                              <strong className="text-blue-700 dark:text-blue-400 block text-sm mb-1">💾 Backup &amp; Restore Strategy (Highest RTO/RPO)</strong>
                              Daily or hourly snapshots and database transactions are stored securely in Amazon S3. In the recovery region, the compute environment is entirely <strong>Cold (0 active servers)</strong>. During disaster recovery, standard scripts provision network infrastructure, deploy server templates (AMIs), and restore backups from S3.
                              <div className="mt-2 text-[10.5px] text-slate-600 dark:text-slate-400">
                                <strong>RPO:</strong> &lt; 24 hours | <strong>RTO:</strong> &lt; 24 hours | <strong>Cost:</strong> Minimal ($)
                              </div>
                            </div>
                          )}
                          {activeStrategyTab === 'pilot' && (
                            <div>
                              <strong className="text-indigo-700 dark:text-indigo-400 block text-sm mb-1">🔥 Pilot Light Strategy (Low Cost Standby)</strong>
                              The databases and persistent storages are <strong>actively running</strong> in the standby region to replicate data in real time. However, application servers and other components are completely turned off or unprovisioned.
                              When a failover triggers, we quickly boot standby EC2 instances from AMIs and map endpoints.
                              <div className="mt-2 text-[10.5px] text-slate-600 dark:text-slate-400">
                                <strong>RPO:</strong> &lt; 60 mins | <strong>RTO:</strong> &lt; 4 hours | <strong>Cost:</strong> Low ($$)
                              </div>
                            </div>
                          )}
                          {activeStrategyTab === 'warm' && (
                            <div>
                              <strong className="text-purple-700 dark:text-purple-400 block text-sm mb-1">⛅ Warm Standby Strategy (Scaled Down Fleet)</strong>
                              A scaled-down but <strong>fully functional</strong> copy of the primary infrastructure runs in the secondary region. Web servers are active (e.g. running 1 instance instead of 4), and database replication is live. Upon failover, the system automatically triggers an Auto Scaling Group scale-up rule to expand computing to full production size, resulting in sub-hour RTO.
                              <div className="mt-2 text-[10.5px] text-slate-600 dark:text-slate-400">
                                <strong>RPO:</strong> &lt; 15 mins | <strong>RTO:</strong> &lt; 1 hour | <strong>Cost:</strong> Medium ($$$)
                              </div>
                            </div>
                          )}
                          {activeStrategyTab === 'hot' && (
                            <div>
                              <strong className="text-rose-700 dark:text-rose-400 block text-sm mb-1">⚡ Multi-Site Active-Active (Zero Downtime)</strong>
                              Two fully operational, mirrored environments handle traffic concurrently in both regions. Route 53 utilizes Anycast latency routing to split traffic between Region A and Region B. Database replication is handled at the hardware physical layer (e.g. Aurora Global Database), guaranteeing sub-second replication and immediate RTO failovers.
                              <div className="mt-2 text-[10.5px] text-slate-600 dark:text-slate-400">
                                <strong>RPO:</strong> Near-Zero | <strong>RTO:</strong> Near-Zero | <strong>Cost:</strong> Extreme ($$$$)
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="acad-takeaway-box mt-3 text-[11px]">
                          <strong>🛠️ Structural Selection Rule:</strong><br />
                          Choose the strategy that aligns with your business SLAs. If downtime costs $50,000/hour, investing in a Warm Standby or Multi-Site is financially justified. If downtime is tolerable, choose Backup &amp; Restore to conserve cloud budget.
                        </div>
                      </div>

                      <div className="md:col-span-5 acad-sim-diagram flex flex-col justify-center items-center relative overflow-hidden min-h-[220px] da-svg-bg border border-slate-200">
                        <span className="absolute top-2 left-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Architectural Blueprint</span>
                        
                        {activeStrategyTab === 'backup' && (
                          <svg className="w-full max-w-[340px] h-[170px]" viewBox="0 0 420 190">
                            {/* Region A (Primary: Active) */}
                            <rect x="10" y="25" width="180" height="150" rx="8" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" strokeDasharray="3,3" />
                            <text x="100" y="42" fill="var(--da-svg-indigo-text)" fontSize="9" fontWeight="bold" textAnchor="middle">Active Region (us-east-1)</text>
                            
                            {/* Active Compute */}
                            <rect x="25" y="55" width="60" height="30" rx="4" fill="var(--da-card-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.2" />
                            <text x="55" y="70" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">Web Server</text>
                            <text x="55" y="79" fill="var(--da-svg-green-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">● Live</text>

                            {/* Active Database */}
                            <rect x="115" y="55" width="60" height="30" rx="4" fill="var(--da-card-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.2" />
                            <text x="145" y="70" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">Primary DB</text>
                            <text x="145" y="79" fill="var(--da-svg-green-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">● Active</text>

                            {/* Cloud S3 */}
                            <rect x="65" y="115" width="80" height="30" rx="4" fill="var(--da-card-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.2" />
                            <text x="105" y="130" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">Amazon S3</text>
                            <text x="105" y="139" fill="var(--da-svg-indigo-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">Snapshots OK</text>

                            {/* Region B (Secondary: Cold) */}
                            <rect x="230" y="25" width="180" height="150" rx="8" fill="none" stroke="var(--da-card-border)" strokeWidth="1.5" strokeDasharray="3,3" />
                            <text x="320" y="42" fill="var(--da-text-muted)" fontSize="9" fontWeight="bold" textAnchor="middle">Secondary (Cold DR)</text>

                            {/* Cold Compute Silhouette */}
                            <rect x="245" y="55" width="60" height="30" rx="4" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1.2" strokeDasharray="3,3" />
                            <text x="275" y="74" fill="var(--da-text-muted)" fontSize="7.5" fontWeight="bold" textAnchor="middle">EC2 (Cold)</text>

                            {/* Cold Storage / DB S3 replica */}
                            <rect x="280" y="115" width="80" height="30" rx="4" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1.2" strokeDasharray="3,3" />
                            <text x="320" y="134" fill="var(--da-text-muted)" fontSize="7.5" fontWeight="bold" textAnchor="middle">S3 Standby</text>

                            {/* DB Backup Cross Region replication pipeline */}
                            <path d="M 145 130 H 280" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" strokeDasharray="4,4" className="dr-flow-blue" />
                            <text x="212.5" y="122" fill="var(--da-svg-indigo-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Snapshot Copy</text>
                          </svg>
                        )}

                        {activeStrategyTab === 'pilot' && (
                          <svg className="w-full max-w-[340px] h-[170px]" viewBox="0 0 420 190">
                            {/* Region A (Primary: Active) */}
                            <rect x="10" y="25" width="180" height="150" rx="8" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" strokeDasharray="3,3" />
                            <text x="100" y="42" fill="var(--da-svg-indigo-text)" fontSize="9" fontWeight="bold" textAnchor="middle">Active Region (us-east-1)</text>
                            
                            {/* Web App */}
                            <rect x="65" y="55" width="80" height="30" rx="4" fill="var(--da-card-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.2" />
                            <text x="105" y="70" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">Web Server</text>
                            <text x="105" y="79" fill="var(--da-svg-green-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">● Running</text>

                            {/* DB Primary */}
                            <rect x="65" y="115" width="80" height="30" rx="4" fill="var(--da-card-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.2" />
                            <text x="105" y="130" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">RDS Writer</text>
                            <text x="105" y="139" fill="var(--da-svg-green-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">● Read/Write</text>

                            {/* Region B (Secondary: Pilot Light) */}
                            <rect x="230" y="25" width="180" height="150" rx="8" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1.5" strokeDasharray="3,3" />
                            <text x="320" y="42" fill="var(--da-svg-green-text)" fontSize="9" fontWeight="bold" textAnchor="middle">Pilot Light (eu-west-1)</text>

                            {/* EC2 dormant (ASG templates ready, 0 instances) */}
                            <rect x="280" y="55" width="80" height="30" rx="4" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1.2" strokeDasharray="3,3" />
                            <text x="320" y="70" fill="var(--da-text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">Compute (ASG=0)</text>
                            <text x="320" y="79" fill="var(--da-svg-amber-text)" fontSize="6" fontWeight="bold" textAnchor="middle">💤 Cold AMI</text>

                            {/* DB Active Replica */}
                            <rect x="280" y="115" width="80" height="30" rx="4" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.2" />
                            <text x="320" y="130" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">RDS Standby</text>
                            <text x="320" y="139" fill="var(--da-svg-green-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">🟢 Live Replica</text>

                            {/* Replication line */}
                            <path d="M 145 130 H 280" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1.5" className="dr-flow-green" />
                            <text x="212.5" y="122" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Active DB Sync</text>
                          </svg>
                        )}

                        {activeStrategyTab === 'warm' && (
                          <svg className="w-full max-w-[340px] h-[170px]" viewBox="0 0 420 190">
                            {/* Region A (Primary: Active) */}
                            <rect x="10" y="25" width="180" height="150" rx="8" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" strokeDasharray="3,3" />
                            <text x="100" y="42" fill="var(--da-svg-indigo-text)" fontSize="9" fontWeight="bold" textAnchor="middle">Active Region (us-east-1)</text>

                            {/* Web App */}
                            <rect x="65" y="55" width="80" height="30" rx="4" fill="var(--da-card-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.2" />
                            <text x="105" y="70" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">Active Fleet (N=4)</text>
                            <text x="105" y="79" fill="var(--da-svg-green-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">● Running</text>

                            {/* DB Primary */}
                            <rect x="65" y="115" width="80" height="30" rx="4" fill="var(--da-card-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.2" />
                            <text x="105" y="130" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">RDS Primary Writer</text>
                            <text x="105" y="139" fill="var(--da-svg-green-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">● Read/Write</text>

                            {/* Region B (Warm Standby Secondary) */}
                            <rect x="230" y="25" width="180" height="150" rx="8" fill="none" stroke="var(--da-svg-purple-border)" strokeWidth="1.5" strokeDasharray="3,3" />
                            <text x="320" y="42" fill="var(--da-svg-purple-text)" fontSize="9" fontWeight="bold" textAnchor="middle">Warm Standby (eu-west-1)</text>

                            {/* EC2 warm compute */}
                            <rect x="280" y="55" width="80" height="30" rx="4" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1.2" />
                            <text x="320" y="70" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">EC2 Warm (N=1)</text>
                            <text x="320" y="79" fill="var(--da-svg-purple-text)" fontSize="6" fontWeight="bold" textAnchor="middle">⛅ Active Minimal</text>

                            {/* DB Active Replica */}
                            <rect x="280" y="115" width="80" height="30" rx="4" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.2" />
                            <text x="320" y="130" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">RDS Standby</text>
                            <text x="320" y="139" fill="var(--da-svg-green-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">🟢 Live Replica</text>

                            {/* Replication line */}
                            <path d="M 145 130 H 280" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1.5" className="dr-flow-green" />
                            <text x="212.5" y="122" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Active DB Sync</text>
                          </svg>
                        )}

                        {activeStrategyTab === 'hot' && (
                          <svg className="w-full max-w-[340px] h-[170px]" viewBox="0 0 420 190">
                            {/* Route 53 Anycast */}
                            <g transform="translate(180, 5)">
                              <rect x="0" y="0" width="60" height="20" rx="3" fill="var(--da-card-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1" />
                              <text x="30" y="12" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">Route 53</text>
                            </g>

                            {/* Region A (Active Mirror) */}
                            <rect x="10" y="45" width="180" height="130" rx="8" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" />
                            <text x="100" y="60" fill="var(--da-svg-indigo-text)" fontSize="7.5" fontWeight="black" textAnchor="middle">Active us-east-1 (50%)</text>

                            {/* Web nodes */}
                            <rect x="25" y="75" width="60" height="30" rx="4" fill="var(--da-card-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.2" />
                            <text x="55" y="90" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">App Fleet</text>
                            <text x="55" y="99" fill="var(--da-svg-green-text)" fontSize="6" fontWeight="bold" textAnchor="middle">● Active</text>

                            {/* Storage database */}
                            <rect x="115" y="75" width="60" height="30" rx="4" fill="var(--da-card-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.2" />
                            <text x="145" y="90" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">Aurora Volume</text>
                            <text x="145" y="99" fill="var(--da-svg-green-text)" fontSize="6" fontWeight="bold" textAnchor="middle">● Active-Active</text>

                            {/* Region B (Active Mirror) */}
                            <rect x="230" y="45" width="180" height="130" rx="8" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                            <text x="320" y="60" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="black" textAnchor="middle">Active eu-west-1 (50%)</text>

                            {/* Web nodes */}
                            <rect x="245" y="75" width="60" height="30" rx="4" fill="var(--da-card-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.2" />
                            <text x="275" y="90" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">App Fleet</text>
                            <text x="275" y="99" fill="var(--da-svg-green-text)" fontSize="6" fontWeight="bold" textAnchor="middle">● Active</text>

                            {/* Storage database */}
                            <rect x="335" y="75" width="60" height="30" rx="4" fill="var(--da-card-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.2" />
                            <text x="365" y="90" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">Aurora Volume</text>
                            <text x="365" y="99" fill="var(--da-svg-green-text)" fontSize="6" fontWeight="bold" textAnchor="middle">● Active-Active</text>

                            {/* Anycast Flow lines */}
                            <path d="M 180 15 L 100 45" fill="none" className="dr-flow-blue" strokeWidth="1.5" />
                            <path d="M 240 15 L 320 45" fill="none" className="dr-flow-blue" strokeWidth="1.5" />

                            {/* NVMe physical block sync pipeline */}
                            <path d="M 175 90 H 335" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="2.5" className="dr-flow-green" />
                            <text x="255" y="82" fill="var(--da-svg-green-text)" fontSize="7" fontWeight="black" textAnchor="middle">Physical Storage Sync Mirror</text>
                          </svg>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 3: HIGH AVAILABILITY & CHAOS TIPS                                  */}
              {/* ========================================================================= */}
              {selectedNote === 'dr_tips' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Resilience &amp; Testing</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 font-display">High Availability &amp; Chaos Engineering</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('multiregion')}
                        className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Zap className="w-3 h-3" /> Go to Failover Simulator
                      </button>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Concept 3 of 10</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Surviving a regional failure requires separating High Availability (HA) from Disaster Recovery (DR) and continuously validating systems via automated backups and chaos injection.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    
                    <div className="md:col-span-6 space-y-4">
                      <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <div>
                          <strong className="text-slate-900 dark:text-white block font-bold">1. High Availability (HA) vs. Disaster Recovery (DR)</strong>
                          <strong>HA (Multi-AZ)</strong> targets localized hardware/software failures, providing automated synchronous failover within a single AWS region under minute boundaries. <strong>DR (Multi-Region)</strong> targets geographic catastrophe, re-routing traffic across global networks under hours boundaries.
                        </div>
                        <div>
                          <strong className="text-slate-900 dark:text-white block font-bold">2. Automated Restore Validation</strong>
                          Backing up data is useless if the recovery points are corrupted. Automate backup verification using **AWS Backup Restore Testing**: it triggers isolated, mock restores on a cron schedule, logs output telemetry, and destroys test instances automatically.
                        </div>
                        <div>
                          <strong className="text-slate-900 dark:text-white block font-bold">3. Chaos Engineering: Test to Trust</strong>
                          Do not wait for a real failure to find out if your Route 53 health checks work. Use **AWS Fault Injection Service (FIS)** to routinely execute automated disruption scenarios (RDS crash, packet leaks, AZ blackholes) to guarantee resilient runbooks.
                        </div>
                      </div>

                      <div className="acad-takeaway-box text-xs leading-normal">
                        <strong>💡 Chaos Philosophy:</strong> System failure is an absolute certainty. Chaos engineering does not create instability; it exposes latent bugs that already exist.
                      </div>
                    </div>

                    <div className="md:col-span-6 acad-sim-diagram flex flex-col justify-between min-h-[320px]">
                      <div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 block uppercase tracking-wider">AWS FIS Chaos Sandbox Terminal</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Select a failure drill and trigger the automated attack simulator</p>
                      </div>

                      <div className="space-y-2 mt-4">
                        <span className="text-[9.5px] font-extrabold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Select Chaos Target Vector:</span>
                        <div className="grid grid-cols-3 gap-1">
                          <button
                            onClick={() => setChaosSimType('rds_failover')}
                            className={`p-1.5 rounded-lg border text-[10px] font-bold text-center transition-all ${
                              chaosSimType === 'rds_failover'
                                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-600 dark:border-amber-500 text-amber-900 dark:text-amber-200 shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-800'
                            }`}
                          >
                            🛢️ RDS Failover
                          </button>
                          <button
                            onClick={() => setChaosSimType('az_blackhole')}
                            className={`p-1.5 rounded-lg border text-[10px] font-bold text-center transition-all ${
                              chaosSimType === 'az_blackhole'
                                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-600 dark:border-amber-500 text-amber-900 dark:text-amber-200 shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-800'
                            }`}
                          >
                            🔌 AZ Blackhole
                          </button>
                          <button
                            onClick={() => setChaosSimType('dns_split_brain')}
                            className={`p-1.5 rounded-lg border text-[10px] font-bold text-center transition-all ${
                              chaosSimType === 'dns_split_brain'
                                ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-600 dark:border-amber-500 text-amber-900 dark:text-amber-200 shadow-sm'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-800'
                            }`}
                          >
                            🌐 DNS Brain
                          </button>
                        </div>
                      </div>

                      {/* Blinking Retro Terminal Console Output */}
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md mt-3">
                        <div className="bg-slate-50 dark:bg-slate-950 px-3 py-2 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-rose-400" />
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider">aws-fis-chaos.log</span>
                        </div>
                        <div className="bg-slate-900 dark:bg-slate-950 p-3 h-32 overflow-y-auto text-[10px] font-mono leading-relaxed text-slate-300">
                          {chaosConsoleLogs.length === 0 ? (
                            <div className="text-slate-400 italic py-6 text-center">
                              Console idle. Ready for FIS Injection.<br />
                              <span className="animate-pulse">_</span>
                            </div>
                          ) : (
                            chaosConsoleLogs.map((log, idx) => (
                              <div key={idx} className="flex gap-2">
                                <span className="text-amber-500">{log.timestamp}</span>
                                <span className={log.type === 'error' ? 'text-rose-500 font-bold' : log.type === 'warn' ? 'text-amber-400' : 'text-emerald-400'}>
                                  {log.message}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <button
                        onClick={runChaosSimulation}
                        disabled={chaosSimStatus === 'running'}
                        className={`w-full font-black text-xs py-2 rounded-xl mt-3 transition-all flex items-center justify-center gap-1.5 shadow-md ${
                          chaosSimStatus === 'running'
                            ? 'bg-slate-100 dark:bg-slate-900/60 text-slate-400 dark:text-slate-600 border border-slate-200/50 dark:border-slate-800/80 cursor-not-allowed'
                            : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/10 dark:shadow-rose-500/20'
                        }`}
                      >
                        <Zap className="w-4 h-4" /> {chaosSimStatus === 'running' ? 'Injecting Fault...' : '⚡ Inject Chaos Simulation'}
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 4: ROUTE 53 FAILOVER ROUTING                                      */}
              {/* ========================================================================= */}
              {selectedNote === 'failover_routing' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Multi-Region &amp; Hybrid</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 font-display">Route 53 Active-Passive DNS Failover</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('multiregion')}
                        className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Activity className="w-3 h-3" /> Go to Failover Simulator
                      </button>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Concept 4 of 10</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Amazon Route 53 routes globally distributed users to active resources. During a region-wide outage, Route 53 automatically shifts DNS resolutions to the disaster recovery region using health probe status feeds.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 dark:text-white block">Technical Failover Pillars:</span>
                      
                      <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        <div>
                          <strong className="text-slate-800 dark:text-white block">1. Anycast Routing Plane</strong>
                          Users connect to any of the dozens of Route 53 Edge Locations worldwide. Requests are processed at the nearest POP, optimizing latency and resilience against Layer-3/4 DDoS attacks.
                        </div>
                        <div>
                          <strong className="text-slate-800 dark:text-white block">2. Route 53 Health Checks</strong>
                          Route 53 probes endpoints every 10 or 30 seconds. If an endpoint fails consecutive checks, it is flagged as Unhealthy, removing its A/CNAME record from DNS answers.
                        </div>
                        <div>
                          <strong className="text-slate-800 dark:text-white block">3. DNS TTL (Time To Live) Limits</strong>
                          Browsers and local ISP recursive resolvers cache DNS answers. To ensure immediate failover re-routing, set the TTL for failover records to <strong>60 seconds or lower</strong> (e.g. 10s or 30s) to minimize cached stale routes.
                        </div>
                      </div>

                      <div className="acad-takeaway-box">
                        <strong>🛡️ Active-Passive vs Active-Active:</strong><br />
                        Active-Passive routes 100% of traffic to Primary, sending traffic to standby only if Primary fails. Active-Active utilizes Latency or Weighted records to split traffic between both regions concurrently, facilitating immediate near-zero RTO failover.
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 block uppercase tracking-wider">DNS Routing Topology</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Route 53 re-routing active traffic around degraded Region A</p>
                      </div>

                      <div className="w-full rounded-xl p-4 flex items-center justify-center da-svg-bg border border-slate-200">
                        <svg className="w-full max-w-[340px] h-[190px]" viewBox="0 0 340 190">
                          {/* Client node */}
                          <g transform="translate(140, 10)">
                            <rect x="0" y="0" width="60" height="24" rx="4" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1.2" />
                            <text x="30" y="15" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">Global Clients</text>
                          </g>

                          {/* Route 53 Edge Node */}
                          <g transform="translate(125, 60)">
                            <rect x="0" y="0" width="90" height="30" rx="4" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" />
                            <text x="45" y="18" fill="var(--da-svg-indigo-text)" fontSize="8" fontWeight="black" textAnchor="middle">Route 53 Edge</text>
                            <text x="45" y="26" fill="var(--da-svg-indigo-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">TTL: 10s Active</text>
                          </g>

                          {/* Client to Route 53 Conduit */}
                          <path d="M 170 34 V 60" fill="none" className="dr-flow-blue" strokeWidth="2" />

                          {/* Region A Node (DEGRADED) */}
                          <g transform="translate(15, 130)">
                            <rect x="0" y="0" width="110" height="45" rx="4" fill="var(--da-svg-red-bg)" stroke="var(--da-svg-red-border)" strokeWidth="1.2" />
                            <text x="55" y="15" fill="var(--da-svg-red-text)" fontSize="7.5" fontWeight="black" textAnchor="middle">Region A (us-east-1)</text>
                            <rect x="25" y="24" width="60" height="12" rx="2" fill="var(--da-svg-red-border)" />
                            <text x="55" y="32" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">⚠️ UNHEALTHY</text>
                          </g>

                          {/* Region B (HEALTHY STANDBY) */}
                          <g transform="translate(215, 130)">
                            <rect x="0" y="0" width="110" height="45" rx="4" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.2" />
                            <text x="55" y="15" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="black" textAnchor="middle">Region B (eu-west-1)</text>
                            <rect x="25" y="24" width="60" height="12" rx="2" fill="var(--da-svg-green-border)" />
                            <text x="55" y="32" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">🟢 ACTIVE STANDBY</text>
                          </g>

                          {/* Conduit paths */}
                          {/* Route 53 to Region A (Blocked) */}
                          <path d="M 145 90 H 70 V 130" fill="none" stroke="var(--da-svg-red-border)" strokeWidth="2" strokeDasharray="3,3" />
                          <g transform="translate(95, 95)">
                            <circle cx="8" cy="8" r="8" fill="var(--da-svg-red-border)" />
                            <text x="8" y="11" fill="#ffffff" fontSize="9.5" fontWeight="black" textAnchor="middle">×</text>
                          </g>

                          {/* Route 53 to Region B (Active) */}
                          <path d="M 195 90 H 270 V 130" fill="none" className="dr-flow-green" strokeWidth="2.5" />
                        </svg>
                      </div>

                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                        💡 Health probes measure latency and TCP/HTTP return status. Unhealthy nodes are removed automatically without administrator intervention.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 5: AURORA GLOBAL DATABASES                                        */}
              {/* ========================================================================= */}
              {selectedNote === 'aurora_global_db' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Database Synchronization</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 font-display">Amazon Aurora Global Databases</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Concept 5 of 10</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Amazon Aurora Global Databases enable low-latency cross-region replication by executing physical replication directly within the storage volume cluster layer, completely bypassing the compute database engines.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 dark:text-white block">Aurora Storage Layer Mechanics:</span>
                      
                      <div className="space-y-3.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        <div>
                          <strong className="text-slate-800 dark:text-white block">1. Physical Block Replication</strong>
                          Standard database replication streams SQL statements or logical binlogs, which must be executed by the target DB node. Aurora Global Databases stream raw physical blocks directly between NVMe storage systems, minimizing lag.
                        </div>
                        <div>
                          <strong className="text-slate-800 dark:text-white block">2. Sub-Second Cross-Region Latency</strong>
                          Replication lag between us-east-1 and eu-west-1 is typically <strong>under 1 second (1000ms)</strong>. This guarantees a near-zero RPO boundary, ensuring that database commits are copied to the DR region almost immediately.
                        </div>
                        <div>
                          <strong className="text-slate-800 dark:text-white block">3. Multi-Region Write Forwarding</strong>
                          Normally replica endpoints are strictly read-only. Aurora write-forwarding allows secondary clusters to accept write requests from local apps, automatically forwarding them to the Primary Writer region under the hood.
                        </div>
                      </div>

                      <div className="acad-takeaway-box">
                        <strong>🔄 Database Promotion Failover:</strong><br />
                        During a regional outage, promoting the secondary Aurora replica in eu-west-1 to Primary Writer role takes less than 30 seconds. The local engine is converted to standalone mode with zero reboots required.
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 block uppercase tracking-wider">Physical Storage Replication</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Continuous block transfers bypass SQL execution overheads</p>
                      </div>

                      <div className="w-full rounded-xl p-4 flex flex-col items-center justify-center da-svg-bg border border-slate-200">
                        <svg className="w-full max-w-[340px] h-[160px]" viewBox="0 0 340 160">
                          {/* Region 1 Storage Node */}
                          <g transform="translate(10, 45)">
                            <rect x="0" y="0" width="110" height="70" rx="6" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" />
                            <text x="55" y="15" fill="var(--da-svg-indigo-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Primary Cluster</text>
                            <text x="55" y="25" fill="var(--da-svg-indigo-text)" fontSize="6.5" opacity="0.8" fontWeight="bold" textAnchor="middle">us-east-1</text>
                            
                            <rect x="10" y="34" width="90" height="28" rx="2" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1" />
                            <text x="55" y="44" fill="var(--da-text-title)" fontSize="6.5" fontWeight="black" textAnchor="middle">NVMe Storage SSD</text>
                            <text x="55" y="54" fill="var(--da-svg-indigo-border)" fontSize="6" fontWeight="bold" textAnchor="middle">Active Writes OK</text>
                          </g>

                          {/* Region 2 Storage Node */}
                          <g transform="translate(220, 45)">
                            <rect x="0" y="0" width="110" height="70" rx="6" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1.5" />
                            <text x="55" y="15" fill="var(--da-text-title)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Standby Cluster</text>
                            <text x="55" y="25" fill="var(--da-text-muted)" fontSize="6.5" fontWeight="bold" textAnchor="middle">eu-west-1</text>
                            
                            <rect x="10" y="34" width="90" height="28" rx="2" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1" />
                            <text x="55" y="44" fill="var(--da-text-muted)" fontSize="6.5" fontWeight="black" textAnchor="middle">NVMe Storage SSD</text>
                            <text x="55" y="54" fill="var(--da-svg-green-text)" fontSize="6" fontWeight="bold" textAnchor="middle">Replica Read OK</text>
                          </g>

                          {/* Replication Conduit arrow */}
                          <path d="M 120 80 H 220" fill="none" className="dr-flow-green" strokeWidth="3.5" />
                          
                          <text x="170" y="65" fill="var(--da-svg-green-text)" fontSize="7" fontWeight="black" textAnchor="middle">Physical Storage Sync</text>
                          <text x="170" y="73" fill="var(--da-text-muted)" fontSize="6" fontWeight="bold" textAnchor="middle">Lag &lt; 900ms</text>
                        </svg>
                      </div>

                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                        💡 Since storage replication is handled asynchronously, there is no performance penalty or writing latency impact on the Primary DB cluster.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 6: ON-PREMISES & HYBRID BACKUP                                    */}
              {/* ========================================================================= */}
              {selectedNote === 'hybrid_backup' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">On-Premises Integration</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 font-display">AWS Backup Gateway &amp; Hybrid Storage DR</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Concept 6 of 10</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Bridging legacy infrastructure with AWS requires seamless hybrid backup channels. Deploying AWS Backup Gateway connects on-premises hypervisors natively to secure cloud vaults.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    
                    <div className="md:col-span-6 space-y-4">
                      <span className="text-xs font-black text-slate-800 dark:text-white block">Hybrid Backup Architecture:</span>
                      <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <div>
                          <strong className="text-slate-900 dark:text-white block font-bold">1. AWS Backup Gateway</strong>
                          A lightweight VMware ESXi, Hyper-V, or physical virtual appliance deployed locally on-premises. It connects local hypervisors directly to AWS Backup endpoints over the internet, public endpoints, or private VPC interfaces via AWS Direct Connect.
                        </div>
                        <div>
                          <strong className="text-slate-900 dark:text-white block font-bold">2. Cross-Account Backup Vault Copying</strong>
                          To isolate data from primary AWS account compromises (ransomware or root logins), configure automated cross-account copies. Backup jobs replicate snapshots into a secondary AWS account containing a strictly guarded backup vault.
                        </div>
                        <div>
                          <strong className="text-slate-900 dark:text-white block font-bold">3. Immutable WORM Vaults</strong>
                          Lock the vaults using **AWS Backup Vault Lock**. Write-Once-Read-Many policies ensure recovery points remain completely undeletable by standard users or external hijackers.
                        </div>
                      </div>

                      <div className="acad-takeaway-box text-xs">
                        <strong>🛡️ Lock Compliance Recommendation:</strong> Always combine local network encryption with an enforced AWS Backup Vault Lock policy in Compliance Mode to achieve high-grade resilience.
                      </div>
                    </div>

                    <div className="md:col-span-6 acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 block uppercase tracking-wider">Hybrid Backup Flow Topology</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">On-premises VMs replicating snapshots directly to immutable cloud vaults</p>
                      </div>

                      <div className="w-full rounded-xl p-3 flex items-center justify-center da-svg-bg border border-slate-200">
                        <svg className="w-full max-w-[340px] h-[170px]" viewBox="0 0 340 170">
                          {/* On Premises Datacenter */}
                          <rect x="5" y="25" width="105" height="120" rx="5" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1.2" />
                          <text x="57.5" y="38" fill="var(--da-text-title)" fontSize="8" fontWeight="bold" textAnchor="middle">On-Premises Data</text>
                          
                          <rect x="15" y="55" width="85" height="26" rx="3" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1" />
                          <text x="57.5" y="71" fill="var(--da-text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">VMware ESXi Cluster</text>

                          <rect x="15" y="90" width="85" height="26" rx="3" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1" />
                          <text x="57.5" y="106" fill="var(--da-svg-amber-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Backup Gateway</text>

                          {/* Network connection */}
                          <path d="M 110 103 H 220" fill="none" className="dr-flow-blue" strokeWidth="2.5" />
                          <text x="165" y="93" fill="var(--da-svg-indigo-text)" fontSize="7" fontWeight="black" textAnchor="middle">IPSec / DX Link</text>

                          {/* AWS Cloud */}
                          <rect x="220" y="25" width="115" height="120" rx="5" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.2" />
                          <text x="277.5" y="38" fill="var(--da-svg-green-text)" fontSize="8" fontWeight="bold" textAnchor="middle">AWS Cloud Region</text>

                          <rect x="230" y="55" width="95" height="30" rx="3" fill="var(--da-card-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.2" />
                          <text x="277.5" y="70" fill="var(--da-text-title)" fontSize="7" fontWeight="black" textAnchor="middle">Backup Vault</text>
                          <text x="277.5" y="79" fill="var(--da-svg-green-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">🔒 Locked WORM</text>
                        </svg>
                      </div>

                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold">
                        📊 Note: Deploying the lightweight gateway appliance requires zero modifications to existing virtual machine configurations.
                      </span>
                    </div>

                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 7: AWS DMS CDC CONTINUOUS SYNC                                    */}
              {/* ========================================================================= */}
              {selectedNote === 'dms_replication' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Database &amp; Backup Governance</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 font-display">AWS DMS CDC Continuous Sync</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('dms')}
                        className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Database className="w-3 h-3" /> Go to DMS Simulator
                      </button>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Concept 7 of 10</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    AWS Database Migration Service (DMS) executes continuous database synchronizations. Integrating **Change Data Capture (CDC)** engines reads native log buffers in real time to capture active commits without database downtime.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    
                    {/* Left Column: Interactive compatibility matrix */}
                    <div className="md:col-span-6 space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      
                      <div className="da-inner-card border rounded-xl p-4 space-y-3">
                        <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest block">DMS Migration Pair Compatibility Matrix</span>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 block mb-1">1. Select Source DB:</label>
                            <select
                              value={dmsMatrixSource}
                              onChange={(e) => setDmsMatrixSource(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-1 text-[11px] font-extrabold text-slate-700 dark:text-slate-300"
                            >
                              <option value="oracle">Oracle Enterprise</option>
                              <option value="sqlserver">Microsoft SQL Server</option>
                              <option value="mysql">MySQL Engine</option>
                              <option value="postgres">PostgreSQL Engine</option>
                              <option value="mongodb">MongoDB / NoSQL</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-extrabold text-slate-600 dark:text-slate-400 block mb-1">2. Select Target DB:</label>
                            <select
                              value={dmsMatrixTarget}
                              onChange={(e) => setDmsMatrixTarget(e.target.value)}
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-1 text-[11px] font-extrabold text-slate-700 dark:text-slate-300"
                            >
                              <option value="aurora">Amazon Aurora Cluster</option>
                              <option value="rds_pg">RDS PostgreSQL</option>
                              <option value="s3">Amazon S3 Lakehouse</option>
                              <option value="redshift">Amazon Redshift</option>
                              <option value="dynamodb">Amazon DynamoDB</option>
                            </select>
                          </div>
                        </div>

                        {/* Calculated Compatibility Card */}
                        <div className="da-svg-bg border p-2.5 rounded-lg text-[10.5px] leading-relaxed text-slate-600 dark:text-slate-300">
                          {dmsMatrixSource === dmsMatrixTarget || 
                          (dmsMatrixSource === 'mysql' && dmsMatrixTarget === 'aurora') ||
                          (dmsMatrixSource === 'postgres' && dmsMatrixTarget === 'rds_pg') ? (
                            <div>
                              <span className="text-emerald-700 dark:text-emerald-400 font-extrabold block">✅ HOMOGENEOUS MIGRATION PATH</span>
                              Engines are highly compatible. Schema conversion is NOT required. You can load DDL tables directly using AWS DMS with high structural conversion rates.
                              <span className="block mt-1 font-bold text-slate-700 dark:text-slate-200">Recommended CDC Mode: Native Replication Logs</span>
                            </div>
                          ) : (
                            <div>
                              <span className="text-indigo-700 dark:text-indigo-400 font-extrabold block">🔄 HETEROGENEOUS MIGRATION PATH</span>
                              Engines are completely different! **AWS Schema Conversion Tool (SCT)** MUST be executed first to parse legacy procedures/triggers into compatible dialects.
                              <span className="block mt-1 font-bold text-slate-700 dark:text-slate-200">
                                {dmsMatrixSource === 'oracle' && 'CDC mechanism: Oracle Redo Logs via LogMiner or Binary Reader.'}
                                {dmsMatrixSource === 'sqlserver' && 'CDC mechanism: MS-CDC (Microsoft Change Data Capture).'}
                                {dmsMatrixSource === 'mysql' && 'CDC mechanism: MySQL Binary Logs (row-based binlog).'}
                                {dmsMatrixSource === 'postgres' && 'CDC mechanism: PostgreSQL Replication Slots (pglogical).'}
                                {dmsMatrixSource === 'mongodb' && 'CDC mechanism: MongoDB Replication Oplog buffer.'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="acad-takeaway-box">
                        <strong>⚡ CDC Stream Engine Lag:</strong><br />
                        AWS DMS runs Multi-AZ replication instances inside private VPC subnets. It continuously streams changes asynchronously from source transaction logs to the cloud, guaranteeing replication lags <strong>under 100ms</strong> under typical operations.
                      </div>
                    </div>

                    {/* Right Column: Flowchart SVG with play-pause animation toggle */}
                    <div className="md:col-span-6 acad-sim-diagram flex flex-col justify-between min-h-[300px] relative overflow-hidden">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 block uppercase tracking-wider">Change Data Capture (CDC) Pipeline</span>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Real-time log-scraping and delivery parser channel</p>
                        </div>
                        <button
                          onClick={() => setIsCdcAnimating(!isCdcAnimating)}
                          className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-black transition-all select-none shadow-sm"
                        >
                          {isCdcAnimating ? '⏸️ Pause CDC' : '▶️ Play CDC Stream'}
                        </button>
                      </div>

                      <div className="w-full rounded-xl p-4 flex items-center justify-center my-4 da-svg-bg border border-slate-200">
                        <svg className="w-full max-w-[340px] h-[160px]" viewBox="0 0 340 160">
                          {/* Source Database */}
                          <g transform="translate(10, 45)">
                            <rect x="0" y="0" width="80" height="60" rx="4" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1.2" />
                            <text x="40" y="16" fill="var(--da-text-title)" fontSize="7.5" fontWeight="black" textAnchor="middle">Source DB</text>
                            <text x="40" y="24" fill="var(--da-text-muted)" fontSize="6" textAnchor="middle">Oracle/MySQL</text>
                            
                            <rect x="8" y="34" width="64" height="18" rx="2" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1" />
                            <text x="40" y="46" fill="var(--da-text-muted)" fontSize="6.5" fontWeight="bold" textAnchor="middle">Redo/Binlogs</text>
                          </g>

                          {/* DMS Replication Node */}
                          <g transform="translate(125, 45)">
                            <rect x="0" y="0" width="90" height="60" rx="6" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" />
                            <text x="45" y="16" fill="var(--da-svg-indigo-text)" fontSize="7.5" fontWeight="black" textAnchor="middle">AWS DMS</text>
                            <text x="45" y="24" fill="var(--da-svg-indigo-text)" fontSize="6" fontWeight="bold" textAnchor="middle">Replication Host</text>
                            <rect x="15" y="34" width="60" height="18" rx="2" fill="var(--da-svg-indigo-border)" />
                            <text x="45" y="46" fill="#ffffff" fontSize="6.5" fontWeight="black" textAnchor="middle">CDC Parser</text>
                          </g>

                          {/* Target Aurora DB */}
                          <g transform="translate(250, 45)">
                            <rect x="0" y="0" width="80" height="60" rx="4" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.2" />
                            <text x="40" y="16" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="black" textAnchor="middle">Target Aurora</text>
                            <text x="40" y="24" fill="var(--da-svg-green-text)" opacity="0.8" fontSize="6" textAnchor="middle">AWS Cloud</text>
                            <rect x="15" y="34" width="50" height="18" rx="1.5" fill="var(--da-svg-green-border)" />
                            <text x="40" y="46" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle">SQL Tables</text>
                          </g>

                          {/* CDC conduits and flying packet dots */}
                          <path d="M 90 75 H 125" fill="none" className={isCdcAnimating ? 'dr-flow-blue' : 'dr-flow-gray'} strokeWidth="2.5" />
                          <path d="M 215 75 H 250" fill="none" className={isCdcAnimating ? 'dr-flow-green' : 'dr-flow-gray'} strokeWidth="2.5" />
                        </svg>
                      </div>

                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold leading-normal">
                        📊 Note: Continuous replication reduces application cutover downtime to just a few seconds since target schemas are fully synchronized.
                      </span>
                    </div>

                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 8: AWS SCHEMA CONVERSION TOOL (SCT)                                */}
              {/* ========================================================================= */}
              {selectedNote === 'aws_sct' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Database &amp; Backup Governance</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 font-display">AWS Schema Conversion Tool (SCT)</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('dms')}
                        className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Database className="w-3 h-3" /> Go to DMS Simulator
                      </button>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Concept 8 of 10</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Migrating databases across different engines (heterogeneous, e.g. Oracle to PostgreSQL) requires schema translation. **AWS Schema Conversion Tool (SCT)** handles code and database object conversion natively.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    
                    <div className="md:col-span-6 space-y-4">
                      <span className="text-xs font-black text-slate-800 dark:text-white block">SCT Structural Conversion Process:</span>
                      
                      <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <div>
                          <strong className="text-slate-900 dark:text-white block font-bold">1. Translation Report Generation</strong>
                          SCT scans source database schemas, tables, functions, stored procedures, packages, and triggers. It produces an evaluation report detailing how much code can be converted automatically (typically 80-90%) and highlights compatibility remediation items.
                        </div>
                        <div>
                          <strong className="text-slate-900 dark:text-white block font-bold">2. Schema Translation &amp; DDL Loading</strong>
                          Once rules are verified, SCT writes clean compatible DDL scripts (e.g. converting Oracle PL/SQL to PostgreSQL PL/pgSQL). It loads these directly onto the target Amazon Aurora cluster.
                        </div>
                        <div>
                          <strong className="text-slate-900 dark:text-white block font-bold">3. SCT Extension Pack</strong>
                          For native functions that have no equivalent standard target dialect SQL blocks, the SCT Extension Pack is installed on the target database, emulating source functions to maintain application behavior.
                        </div>
                      </div>

                      <div className="acad-takeaway-box text-xs">
                        <strong>🛡️ DMS vs SCT Roles:</strong> Remember: **SCT** converts the structural containers (tables, procedures, columns, views), while **DMS** handles loading and replicating the raw data blocks.
                      </div>
                    </div>

                    <div className="md:col-span-6 acad-sim-diagram flex flex-col justify-between min-h-[300px] relative overflow-hidden">
                      <div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 block uppercase tracking-wider">Multi-Phase Schema Translation Flow</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">How SCT converts structures before DMS loads database tables</p>
                      </div>

                      <div className="w-full rounded-xl p-4 flex items-center justify-center my-4 da-svg-bg border border-slate-200">
                        <svg className="w-full max-w-[340px] h-[160px]" viewBox="0 0 340 160">
                          {/* Source Database */}
                          <g transform="translate(10, 45)">
                            <rect x="0" y="0" width="80" height="70" rx="4" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1.2" />
                            <text x="40" y="16" fill="var(--da-text-title)" fontSize="7.5" fontWeight="black" textAnchor="middle">Source DB</text>
                            <text x="40" y="26" fill="var(--da-text-muted)" fontSize="6.5" textAnchor="middle">PL/SQL Schema</text>
                            
                            <rect x="10" y="38" width="60" height="24" rx="2" fill="var(--da-svg-red-bg)" stroke="var(--da-svg-red-border)" strokeWidth="1" />
                            <text x="40" y="48" fill="var(--da-svg-red-text)" fontSize="6" fontWeight="bold" textAnchor="middle">Triggers &amp; Stored</text>
                            <text x="40" y="56" fill="var(--da-svg-red-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">Procedures</text>
                          </g>

                          {/* SCT Engine */}
                          <g transform="translate(125, 45)">
                            <rect x="0" y="0" width="90" height="70" rx="6" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1.5" />
                            <text x="45" y="18" fill="var(--da-svg-purple-text)" fontSize="8" fontWeight="black" textAnchor="middle">AWS SCT</text>
                            <rect x="15" y="28" width="60" height="34" rx="2" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1" />
                            <text x="45" y="40" fill="var(--da-svg-purple-text)" fontSize="7.5" fontWeight="black" textAnchor="middle">Translation</text>
                            <text x="45" y="49" fill="var(--da-svg-purple-text)" fontSize="7.5" fontWeight="black" textAnchor="middle">Engine</text>
                            <text x="45" y="56" fill="var(--da-svg-purple-text)" opacity="0.8" fontSize="5.5" fontWeight="bold" textAnchor="middle">Applying Rules...</text>
                          </g>

                          {/* Target Database */}
                          <g transform="translate(250, 45)">
                            <rect x="0" y="0" width="80" height="70" rx="4" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.2" />
                            <text x="40" y="16" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="black" textAnchor="middle">Target DB</text>
                            <text x="40" y="26" fill="var(--da-svg-green-text)" opacity="0.8" fontSize="6.5" textAnchor="middle">PL/pgSQL Schema</text>
                            
                            <rect x="10" y="38" width="60" height="24" rx="2" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1" />
                            <text x="40" y="48" fill="var(--da-svg-green-text)" fontSize="6" fontWeight="bold" textAnchor="middle">Converted SQL</text>
                            <text x="40" y="56" fill="var(--da-svg-green-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">DDL Loaded</text>
                          </g>

                          {/* Flow channels */}
                          <path d="M 90 80 H 125" fill="none" className="dr-flow-blue" strokeWidth="2.5" />
                          <path d="M 215 80 H 250" fill="none" className="dr-flow-green" strokeWidth="2.5" />
                        </svg>
                      </div>

                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold leading-normal">
                        💡 Note: Running the conversion utility does not access or duplicate production records, avoiding performance overheads.
                      </span>
                    </div>

                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 9: AWS BACKUP VAULT LOCK & WORM                                    */}
              {/* ========================================================================= */}
              {selectedNote === 'backup_vault_lock' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Database &amp; Backup Governance</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 font-display">AWS Backup Vault Lock &amp; WORM</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('backup')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Shield className="w-3 h-3" /> Go to Backup &amp; Vault
                      </button>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Concept 9 of 10</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    AWS Backup Vault Lock enforces write-once-read-many (WORM) storage controls on backup recovery points. By lock-securing vaults, you prevent accidental deletions, rogue administrator adjustments, or ransomware backup sabotage.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 dark:text-white block">Vault Lock Technical Modes:</span>
                      
                      <div className="space-y-3.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        <div>
                          <strong className="text-slate-800 dark:text-white block">1. Governance Mode</strong>
                          Enforces block permissions that prevent backup deletions by standard users. However, authorized administrators with explicit, highly guarded IAM roles can override restrictions and delete backups if required.
                        </div>
                        <div>
                          <strong className="text-slate-800 dark:text-white block">2. Compliance Mode (Immutable WORM)</strong>
                          Locks the vault permanently. Once the cooling-off period expires, **no user—not even the AWS root account or AWS support—can delete the vault lock or remove backup recovery points** until their retention expiration date.
                        </div>
                        <div>
                          <strong className="text-slate-800 dark:text-white block">3. Cooling-Off Grace Period</strong>
                          Compliance Mode provides a custom cooling-off window (1 to 7 days). During this grace period, you can still test, adjust, or disable the compliance lock. Once the window closes, the lock is irreversible.
                        </div>
                      </div>

                      <div className="acad-takeaway-box">
                        <strong>🛡️ Ransomware Prevention Strategy:</strong><br />
                        Hackers compromising credentials frequently target backups first, deleting all recovery points to force ransom payouts. Vault Lock in Compliance Mode makes backups completely immune to deletions, ensuring recovery points remain secure and available.
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 block uppercase tracking-wider">Ransomware Sabotage Attack Test</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Attempt to delete immutable backups under Vault Compliance Lock</p>
                      </div>

                      <div className="w-full rounded-xl p-4 flex flex-col items-center justify-center space-y-4 da-svg-bg border border-slate-200">
                        <div className="flex items-center gap-3 bg-red-950/80 border border-red-800/40 p-3 rounded-lg w-full">
                          <span className="p-1.5 bg-red-900 rounded text-red-200">
                            <AlertTriangle className="w-4 h-4 stroke-[2]" />
                          </span>
                          <div>
                            <span className="text-[9px] font-black text-red-300 block uppercase tracking-wider">Unauthorized Hacker Terminal</span>
                            <span className="font-mono text-[10.5px] text-red-100 block mt-0.5">aws backup delete-recovery-point --vault-name SecVault</span>
                          </div>
                        </div>

                        <div className="w-12 h-12 bg-[var(--da-svg-green-bg)] border border-[var(--da-svg-green-border)] text-[var(--da-svg-green-text)] rounded-full flex items-center justify-center dr-node-glow">
                          <Lock className="w-6 h-6 stroke-[2.5]" />
                        </div>

                        <div className="bg-slate-950 border border-red-900/40 p-2.5 rounded-md w-full text-center">
                          <span className="font-mono text-[10px] text-rose-500 font-extrabold block">🚨 ACCESS DENIED: delete-recovery-point failed</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Reason: Vault Lock in Compliance Mode forbids manual deletions.</span>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                        💡 Combining Compliance Lock with cross-account backup vault copies protects your enterprise data against root account compromises.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 10: AWS ADS & MGN MIGRATION                                       */}
              {/* ========================================================================= */}
              {selectedNote === 'mgn_ads' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Enterprise Migration Suite</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 font-display">AWS Application Discovery Service &amp; MGN Orchestration</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('playbook')}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <BookOpen className="w-3 h-3" /> Go to Recovery Playbook
                      </button>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Concept 10 of 10</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Large-scale cloud migrations require structured planning and block-level replication pipelines. AWS utilizes **ADS** for environmental audits and **MGN** for continuous server conversions.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    
                    <div className="md:col-span-6 space-y-4">
                      <span className="text-xs font-black text-slate-800 dark:text-white block">System Technical Profiles:</span>
                      
                      <div className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <div>
                          <strong className="text-slate-900 dark:text-white block font-bold">1. AWS Application Discovery Service (ADS)</strong>
                          Discovers on-premises infrastructure dependencies. Deploys **Discovery Agents** on servers or runs **Agentless Collectors** on VMware vCenter. It builds a map of CPU/RAM limits, hardware specifications, and network traffic, exporting a migration roadmap.
                        </div>
                        <div>
                          <strong className="text-slate-900 dark:text-white block font-bold">2. AWS Application Migration Service (MGN)</strong>
                          AWS's primary tool for lifting-and-shifting physical servers or hypervisors into AWS. It uses an **AWS Replication Agent** installed on source VMs to stream block-level modifications continuously into a private replication staging area in AWS.
                        </div>
                        <div>
                          <strong className="text-slate-900 dark:text-white block font-bold">3. Staging Area &amp; Cutover Conversions</strong>
                          The Staging Area runs low-cost replication instances and lightweight EBS storage nodes. During cutover, MGN automatically executes driver conversions (converting hypervisor drivers to AWS PV/NVMe drivers) and boots a production EC2 instance.
                        </div>
                      </div>

                      <div className="acad-takeaway-box text-xs">
                        <strong>🛡️ Cutover Objective:</strong> MGN block replication occurs asynchronously during active runtime. Cutover downtime is strictly limited to the reboot sequence (typically under 5 minutes).
                      </div>
                    </div>

                    <div className="md:col-span-6 acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 block uppercase tracking-wider">AWS MGN Block Replication Pipeline</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Streaming continuous host storage sectors into cloud staging subnets</p>
                      </div>

                      <div className="w-full rounded-xl p-4 flex items-center justify-center da-svg-bg border border-slate-200">
                        <svg className="w-full max-w-[340px] h-[170px]" viewBox="0 0 340 170">
                          {/* On Premises Server */}
                          <g transform="translate(10, 45)">
                            <rect x="0" y="0" width="80" height="70" rx="4" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1.2" />
                            <text x="40" y="16" fill="var(--da-text-title)" fontSize="7.5" fontWeight="black" textAnchor="middle">Source Server</text>
                            <text x="40" y="25" fill="var(--da-text-muted)" fontSize="6" textAnchor="middle">Physical Host / VM</text>
                            
                            <rect x="10" y="36" width="60" height="24" rx="2" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1" />
                            <text x="40" y="47" fill="var(--da-svg-amber-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">Replication Agent</text>
                            <text x="40" y="55" fill="var(--da-svg-amber-text)" opacity="0.8" fontSize="5.5" fontWeight="bold" textAnchor="middle">Block Parser</text>
                          </g>

                          {/* AWS MGN Staging Subnet */}
                          <g transform="translate(125, 30)">
                            <rect x="0" y="0" width="90" height="100" rx="6" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" />
                            <text x="45" y="14" fill="var(--da-svg-indigo-text)" fontSize="7.5" fontWeight="black" textAnchor="middle">MGN Staging Area</text>
                            <text x="45" y="21" fill="var(--da-svg-indigo-text)" opacity="0.8" fontSize="5.5" textAnchor="middle">us-east-1a Subnet</text>
                            
                            <rect x="10" y="32" width="70" height="24" rx="2" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1" />
                            <text x="45" y="43" fill="var(--da-text-title)" fontSize="6" fontWeight="bold" textAnchor="middle">Replication Instance</text>

                            <rect x="10" y="64" width="70" height="24" rx="2" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1" />
                            <text x="45" y="75" fill="var(--da-svg-purple-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">Staging EBS</text>
                            <text x="45" y="83" fill="var(--da-svg-purple-text)" opacity="0.8" fontSize="5.5" fontWeight="bold" textAnchor="middle">Continuous Copy</text>
                          </g>

                          {/* Launched Target EC2 */}
                          <g transform="translate(250, 45)">
                            <rect x="0" y="0" width="80" height="70" rx="4" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.2" />
                            <text x="40" y="16" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="black" textAnchor="middle">Target EC2</text>
                            <text x="40" y="25" fill="var(--da-svg-green-text)" opacity="0.8" fontSize="6" textAnchor="middle">Converted VM</text>
                            <rect x="10" y="36" width="60" height="24" rx="1.5" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1" />
                            <text x="40" y="47" fill="var(--da-svg-green-text)" fontSize="6.5" fontWeight="black" textAnchor="middle">AMI Conversion</text>
                            <text x="40" y="55" fill="var(--da-svg-green-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">● Ready for Cut</text>
                          </g>

                          {/* Replication pathways */}
                          <path d="M 90 80 H 125" fill="none" className="dr-flow-blue" strokeWidth="2.5" />
                          <path d="M 215 80 H 250" fill="none" className="dr-flow-green" strokeWidth="2.5" />
                        </svg>
                      </div>

                      <span className="text-[10px] text-slate-600 dark:text-slate-400 font-semibold leading-normal">
                        💡 Note: Drivers are dynamically injected into the target filesystem during staging, allowing instant booting upon final promotion.
                      </span>
                    </div>

                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 11: LARGE SCALE DATA TRANSFER                                     */}
              {/* ========================================================================= */}
              {selectedNote === 'large_data_transfer' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Large Scale Migration</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 font-display">Large Scale Data Transfer Channels</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Concept 11 of 10</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Transferring large datasets (terabytes or petabytes) requires balancing network bandwidth constraints against physical shipping times. Explore standard pathways and run our calculator below:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    
                    <div className="md:col-span-6 space-y-3.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <div>
                        <strong className="text-slate-900 dark:text-white block font-bold">1. Network Transfer (DataSync &amp; Direct Connect)</strong>
                        **AWS DataSync** automates network replication over NFS, SMB, or S3, utilizing custom multi-threaded transfers. Pair with a dedicated **AWS Direct Connect** (1G/10G/100G fiber connection) to guarantee bandwidth speeds.
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block font-bold">2. Physical Snow Family Transport</strong>
                        When bandwidth is narrow, transfer physically:
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                          <li><strong>Snowcone (8–14 TB)</strong>: Lightweight, ruggedized edge-computing and file transfer unit.</li>
                          <li><strong>Snowball Edge (80–100 TB)</strong>: Heavy-duty storage or compute optimized device with local KMS encryption.</li>
                          <li><strong>Snowmobile (Up to 100 PB)</strong>: A 45-foot shipping container towed by a semi-trailer to ingest massive datacenters.</li>
                        </ul>
                      </div>
                      <div>
                        <strong className="text-slate-900 dark:text-white block font-bold">3. AWS Transfer Family</strong>
                        A managed service to ingest daily transfers using legacy SFTP, FTPS, and FTP structures directly into Amazon S3 or EFS files.
                      </div>
                    </div>

                    <div className="md:col-span-6 acad-sim-diagram flex flex-col justify-between min-h-[340px]">
                      <div>
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 block uppercase tracking-wider">Feasibility &amp; ETA Calculator</span>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">Determine if physical transport saves time over network streaming</p>
                      </div>

                      {/* Calculator Sliders */}
                      <div className="space-y-3 mt-3">
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                            <span>📦 Total Dataset Size:</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">{calcDataSizeTB} TB</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5000"
                            value={calcDataSizeTB}
                            onChange={(e) => setCalcDataSizeTB(Number(e.target.value))}
                            className="w-full accent-indigo-600 dark:accent-indigo-500 bg-slate-200 dark:bg-slate-800 h-1 rounded"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                            <span>🌐 Available Net Bandwidth:</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                              {calcBandwidthMbps >= 1000 ? `${(calcBandwidthMbps / 1000).toFixed(1)} Gbps` : `${calcBandwidthMbps} Mbps`}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="10000"
                            step="10"
                            value={calcBandwidthMbps}
                            onChange={(e) => setCalcBandwidthMbps(Number(e.target.value))}
                            className="w-full accent-indigo-600 dark:accent-indigo-500 bg-slate-200 dark:bg-slate-800 h-1 rounded"
                          />
                        </div>
                      </div>

                      {/* Computed Outputs */}
                      <div className="da-svg-bg border p-3 rounded-lg text-[10px] font-mono leading-relaxed text-slate-600 dark:text-slate-300 space-y-1.5 mt-3">
                        <div className="flex justify-between">
                          <span>🌐 Network Transfer (80% Eff):</span>
                          <span className="text-amber-600 dark:text-amber-400 font-extrabold">
                            {(() => {
                              const days = (calcDataSizeTB * 8000000) / (calcBandwidthMbps * 0.8) / 86400;
                              if (days < 1) return `${(days * 24).toFixed(1)} hours`;
                              if (days > 365) return `${(days / 365).toFixed(1)} years`;
                              return `${days.toFixed(1)} days`;
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>📦 Physical Snow Family Ingest:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">~7 to 10 days (Est)</span>
                        </div>
                        <div className="border-t border-slate-200 dark:border-slate-800 pt-1.5 text-[9.5px] leading-normal font-sans text-slate-500 dark:text-slate-400">
                          <strong className="text-slate-900 dark:text-white block font-bold text-[10px] mb-0.5">🧠 Architect Smart Recommendation:</strong>
                          {(() => {
                            const days = (calcDataSizeTB * 8000000) / (calcBandwidthMbps * 0.8) / 86400;
                            if (days < 5) {
                              return '🚀 Stream Online: Network transfer is highly feasible and faster than ordering, copying, and shipping physical devices. Utilize AWS DataSync.';
                            } else if (calcDataSizeTB < 15) {
                              return '📦 Deploy AWS Snowcone: Faster and more secure physical transport. Bypass local network congestion limits.';
                            } else if (calcDataSizeTB < 400) {
                              return '📦 Deploy AWS Snowball Edge: Ordering a storage-optimized Snowball Edge will save weeks of network congestion and secure raw disks.';
                            } else {
                              return '🚛 Dispatch AWS Snowmobile: Extreme petabyte scale warrants ordering a physical ruggedized shipping trailer to prevent months of ingestion delay.';
                            }
                          })()}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function styleBlock() {
  return (
    <style>{`
      .dr-container {
        font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
        color: var(--da-text);
        background-color: transparent;
        padding: 20px;
        border-radius: 16px;
        transition: all 0.25s ease;

        /* Base Variables (Light Mode) */
        --da-bg: #f8fafc;
        --da-text: #334155;
        --da-text-title: #0f172a;
        --da-text-muted: #475569;
        
        --da-card-bg: rgba(255, 255, 255, 0.7);
        --da-card-border: rgba(226, 232, 240, 0.8);
        --da-card-shadow: 0 10px 30px -10px rgba(148, 163, 184, 0.12), 0 1px 3px rgba(148, 163, 184, 0.02);
        
        --da-tab-bg: rgba(255, 255, 255, 0.5);
        --da-tab-border: rgba(226, 232, 240, 0.8);
        --da-tab-text: #475569;
        --da-tab-hover-bg: rgba(255, 255, 255, 0.9);
        --da-tab-hover-border: #cbd5e1;
        --da-tab-hover-text: #0f172a;
        
        --da-input-bg: #ffffff;
        --da-input-color: #0f172a;
        --da-input-border: rgba(226, 232, 240, 0.85);
        
        --da-code-bg: #090d16;
        --da-code-border: #1e293b;
        --da-code-text: #cbd5e1;
        
        --da-table-border: rgba(226, 232, 240, 0.85);
        --da-table-th-bg: #f8fafc;
        --da-table-th-text: #475569;
        --da-table-td-text: #334155;

        --da-svg-bg: #f8fafc;
        --da-svg-grid: radial-gradient(rgba(99, 102, 241, 0.07) 1.5px, transparent 1.5px);
        
        --da-svg-indigo-bg: #e0e7ff;
        --da-svg-indigo-border: #6366f1;
        --da-svg-indigo-text: #4338ca;
        
        --da-svg-green-bg: #dcfce7;
        --da-svg-green-border: #10b981;
        --da-svg-green-text: #047857;
        
        --da-svg-red-bg: #fee2e2;
        --da-svg-red-border: #f43f5e;
        --da-svg-red-text: #be123c;
        
        --da-svg-amber-bg: #fef3c7;
        --da-svg-amber-border: #f59e0b;
        --da-svg-amber-text: #b45309;

        --da-svg-purple-bg: #f3e8ff;
        --da-svg-purple-border: #a855f7;
        --da-svg-purple-text: #7e22ce;

        /* Academy mapping variables (Light mode) */
        --acad-dir-bg: #ffffff;
        --acad-dir-border: rgba(226, 232, 240, 0.8);
        --acad-dir-header-bg: #f8fafc;
        --acad-dir-header-text: #0f172a;
        --acad-dir-folder-btn-bg: rgba(248, 250, 252, 0.6);
        --acad-dir-folder-btn-text: #334155;
        --acad-dir-folder-hover-bg: rgba(241, 245, 249, 0.8);
        --acad-dir-item-btn-bg: transparent;
        --acad-dir-item-text: #475569;
        --acad-dir-item-hover-bg: rgba(254, 243, 199, 0.4);
        --acad-dir-item-hover-text: #b45309;
        --acad-dir-item-active-bg: #fef3c7;
        --acad-dir-item-active-text: #b45309;
        --acad-dir-item-active-border: #d97706;

        --acad-detail-bg: rgba(255, 255, 255, 0.8);
        --acad-detail-border: rgba(226, 232, 240, 0.8);
        --acad-detail-text: #334155;
        
        --acad-hero-badge-bg: #ecfdf5;
        --acad-hero-badge-border: #a7f3d0;
        --acad-hero-badge-text: #065f46;

        --acad-takeaway-border: #4f46e5;
        --acad-takeaway-bg: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.8) 100%);
        --acad-takeaway-text: #334155;
        
        --acad-terminal-bg: #090d16;
        --acad-terminal-text: #cbd5e1;

        /* Blueprint Card variables (Light mode) */
        --da-blueprint-bg: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%);
        --da-blueprint-text: #0f172a;
        --da-blueprint-muted: #475569;
        --da-blueprint-accent: #2563eb;
        --da-blueprint-accent-rose: #be123c;
        --da-blueprint-inner-bg: rgba(255, 255, 255, 0.7);
        --da-blueprint-inner-border: rgba(14, 165, 233, 0.2);
      }

      /* Centralized Dark Mode Overrides mapping */
      .dark .dr-container {
        background-color: transparent !important;
        color: #cbd5e1 !important;

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
        
        --da-code-bg: #020617;
        --da-code-border: rgba(51, 65, 85, 0.6);
        --da-code-text: #38bdf8;
        
        --da-table-border: rgba(51, 65, 85, 0.6);
        --da-table-th-bg: rgba(15, 23, 42, 0.8);
        --da-table-th-text: #94a3b8;
        --da-table-td-text: #cbd5e1;

        --da-svg-bg: #020617;
        --da-svg-grid: radial-gradient(rgba(51, 65, 85, 0.5) 1.2px, transparent 1.2px);
        
        --da-svg-indigo-bg: rgba(59, 130, 246, 0.15);
        --da-svg-indigo-border: rgba(59, 130, 246, 0.5);
        --da-svg-indigo-text: #60a5fa;
        
        --da-svg-green-bg: rgba(16, 185, 129, 0.15);
        --da-svg-green-border: rgba(16, 185, 129, 0.5);
        --da-svg-green-text: #4ade80;
        
        --da-svg-red-bg: rgba(244, 63, 94, 0.15);
        --da-svg-red-border: rgba(244, 63, 94, 0.5);
        --da-svg-red-text: #f87171;
        
        --da-svg-amber-bg: rgba(245, 158, 11, 0.15);
        --da-svg-amber-border: rgba(245, 158, 11, 0.5);
        --da-svg-amber-text: #fbbf24;

        --da-svg-purple-bg: rgba(192, 132, 252, 0.15);
        --da-svg-purple-border: rgba(192, 132, 252, 0.5);
        --da-svg-purple-text: #c084fc;

        /* Academy mapping variables (Dark mode) */
        --acad-dir-bg: rgba(15, 23, 42, 0.5);
        --acad-dir-border: rgba(51, 65, 85, 0.6);
        --acad-dir-header-bg: rgba(15, 23, 42, 0.9);
        --acad-dir-header-text: #ffffff;
        --acad-dir-folder-btn-bg: rgba(15, 23, 42, 0.7);
        --acad-dir-folder-btn-text: #94a3b8;
        --acad-dir-folder-hover-bg: rgba(30, 41, 59, 0.8);
        --acad-dir-item-btn-bg: transparent;
        --acad-dir-item-text: #94a3b8;
        --acad-dir-item-hover-bg: rgba(30, 41, 59, 0.8);
        --acad-dir-item-hover-text: #fbbf24;
        --acad-dir-item-active-bg: rgba(245, 158, 11, 0.15);
        --acad-dir-item-active-text: #fbbf24;
        --acad-dir-item-active-border: #f59e0b;

        --acad-detail-bg: rgba(15, 23, 42, 0.75);
        --acad-detail-border: rgba(51, 65, 85, 0.6);
        --acad-detail-text: #cbd5e1;
        
        --acad-hero-badge-bg: rgba(16, 185, 129, 0.15);
        --acad-hero-badge-border: rgba(16, 185, 129, 0.3);
        --acad-hero-badge-text: #4ade80;

        --acad-takeaway-border: rgba(51, 65, 85, 0.6);
        --acad-takeaway-bg: rgba(15, 23, 42, 0.6);
        --acad-takeaway-text: #cbd5e1;
        
        --acad-terminal-bg: #020617;
        --acad-terminal-text: #cbd5e1;

        /* Blueprint Card variables (Dark mode) */
        --da-blueprint-bg: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
        --da-blueprint-text: #ffffff;
        --da-blueprint-muted: #94a3b8;
        --da-blueprint-accent: #60a5fa;
        --da-blueprint-accent-rose: #f43f5e;
        --da-blueprint-inner-bg: rgba(255, 255, 255, 0.05);
        --da-blueprint-inner-border: rgba(255, 255, 255, 0.1);
      }

      .dr-gradient-title {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #2563eb 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      .dark .dr-gradient-title {
        background: linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #60a5fa 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      /* Mapping Tailwind slate utility overrides inside .dr-container exactly like OperationsAndMLVisualizer */
      .dr-container .text-slate-900,
      .dr-container .text-slate-800,
      .dr-container .text-slate-850,
      .dr-container .text-slate-505 {
        color: var(--da-text-title) !important;
      }
      .dr-container .text-slate-700,
      .dr-container .text-slate-650 {
        color: var(--da-text) !important;
      }
      .dr-container .text-slate-600,
      .dr-container .text-slate-550,
      .dr-container .text-slate-500,
      .dr-container .text-slate-450,
      .dr-container .text-slate-400 {
        color: var(--da-text-muted) !important;
      }

      .da-card {
        background: var(--da-card-bg);
        border: 1px solid var(--da-card-border);
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 20px;
        box-shadow: var(--da-card-shadow);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .da-card:hover {
        transform: translateY(-2px);
        border-color: rgba(99, 102, 241, 0.25);
        box-shadow: 0 20px 25px -5px rgba(148, 163, 184, 0.15), 0 10px 10px -5px rgba(148, 163, 184, 0.05);
      }
      .da-blueprint-card {
        background: var(--da-blueprint-bg) !important;
        color: var(--da-blueprint-text) !important;
        border: 1px solid var(--da-card-border) !important;
        border-radius: 16px;
        padding: 24px;
        margin-bottom: 20px;
        box-shadow: var(--da-card-shadow);
        position: relative;
        overflow: hidden;
      }
      .da-blueprint-inner {
        background: var(--da-blueprint-inner-bg) !important;
        border: 1px solid var(--da-blueprint-inner-border) !important;
        border-radius: 12px;
        padding: 12px;
      }
      .da-card-title {
        font-size: 17px;
        font-weight: 800;
        color: var(--da-text-title);
        margin-bottom: 10px;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: color 0.2s ease;
      }
      .da-card:hover .da-card-title {
        color: #4f46e5;
      }
      .da-card-desc {
        font-size: 13px;
        color: var(--da-text-muted);
        line-height: 1.6;
      }
      .da-tabs {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 24px;
        border-bottom: 1px solid var(--da-card-border);
        padding-bottom: 12px;
      }
      .da-tb {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 18px;
        border-radius: 12px;
        border: 1.5px solid var(--da-tab-border);
        font-size: 12.5px;
        font-weight: 600;
        color: var(--da-tab-text);
        background: var(--da-tab-bg);
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        outline: none;
      }
      .da-tb:hover {
        background: var(--da-tab-hover-bg);
        border-color: var(--da-tab-hover-border);
        color: var(--da-tab-hover-text);
        transform: translateY(-1px);
      }
      .da-tb.da-on-notebook {
        background: rgba(217, 119, 6, 0.08);
        color: #b45309;
        border-color: rgba(217, 119, 6, 0.4);
        box-shadow: 0 4px 12px rgba(217, 119, 6, 0.08);
      }
      .da-tb.da-on-strategies {
        background: rgba(13, 148, 136, 0.08);
        color: #0f766e;
        border-color: rgba(13, 148, 136, 0.4);
        box-shadow: 0 4px 12px rgba(13, 148, 136, 0.08);
      }
      .da-tb.da-on-multiregion {
        background: rgba(2, 132, 199, 0.08);
        color: #0369a1;
        border-color: rgba(2, 132, 199, 0.4);
        box-shadow: 0 4px 12px rgba(2, 132, 199, 0.08);
      }
      .da-tb.da-on-dms {
        background: rgba(234, 88, 12, 0.08);
        color: #c2410c;
        border-color: rgba(234, 88, 12, 0.4);
        box-shadow: 0 4px 12px rgba(234, 88, 12, 0.08);
      }
      .da-tb.da-on-backup {
        background: rgba(5, 150, 105, 0.08);
        color: #047857;
        border-color: rgba(5, 150, 105, 0.4);
        box-shadow: 0 4px 12px rgba(5, 150, 105, 0.08);
      }
      .da-tb.da-on-playbook {
        background: rgba(99, 102, 241, 0.08);
        color: #4f46e5;
        border-color: rgba(99, 102, 241, 0.4);
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
      }

      .dr-flow-blue {
        stroke: #3b82f6;
        stroke-dasharray: 6,4;
        animation: flowDash 0.8s linear infinite;
      }
      .dr-flow-green {
        stroke: #10b981;
        stroke-dasharray: 6,4;
        animation: flowDash 0.6s linear infinite;
      }
      .dr-flow-red {
        stroke: #ef4444;
        stroke-dasharray: 5,4;
        animation: flowDash 0.4s linear infinite;
      }
      .dr-flow-gray {
        stroke: #64748b;
        stroke-dasharray: 4,4;
      }
      
      @keyframes flowDash {
        to { stroke-dashoffset: -20; }
      }

      .pulse-circle {
        animation: pingCircle 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        transform-origin: center;
      }
      @keyframes pingCircle {
        75%, 100% {
          transform: scale(1.4);
          opacity: 0;
        }
      }

      .da-edu-card {
        background: var(--da-card-bg);
        border: 1px solid var(--da-card-border);
        border-radius: 16px;
        padding: 24px;
        box-shadow: var(--da-card-shadow);
        backdrop-filter: blur(12px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .da-edu-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 20px -8px rgba(79, 70, 229, 0.12);
        border-color: #c7d2fe;
      }
      
      /* Academy mappings styled exactly using CSS variables */
      .acad-dir-container {
        background: var(--acad-dir-bg);
        border: 1px solid var(--acad-dir-border);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.03);
        backdrop-filter: blur(12px);
      }
      .acad-dir-header {
        background: var(--acad-dir-header-bg);
        color: var(--acad-dir-header-text);
        border-bottom: 1.5px solid var(--acad-dir-border);
        padding: 16px;
        font-weight: 800;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .acad-dir-folder-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: var(--acad-dir-folder-btn-bg);
        border: none;
        border-bottom: 1px solid var(--acad-dir-border);
        font-size: 10.5px;
        font-weight: 800;
        color: var(--acad-dir-folder-btn-text);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      .acad-dir-folder-btn:hover {
        background: var(--acad-dir-folder-hover-bg);
      }
      .acad-dir-item-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 18px;
        font-size: 12px;
        font-weight: 600;
        color: var(--acad-dir-item-text);
        border: none;
        border-left: 3px solid transparent;
        background: var(--acad-dir-item-btn-bg);
        transition: all 0.15s ease;
        text-align: left;
        cursor: pointer;
      }
      .acad-dir-item-btn:hover {
        background: var(--acad-dir-item-hover-bg);
        color: var(--acad-dir-item-hover-text);
      }
      .acad-dir-item-btn.acad-active {
        background: var(--acad-dir-item-active-bg);
        color: var(--acad-dir-item-active-text);
        border-left-color: var(--acad-dir-item-active-border);
        font-weight: 800;
      }
      .acad-detail-card {
        background: var(--acad-detail-bg);
        border: 1px solid var(--acad-detail-border);
        border-radius: 16px;
        padding: 28px;
        box-shadow: var(--da-card-shadow);
        backdrop-filter: blur(16px);
      }
      .acad-hero-badge {
        background: var(--acad-hero-badge-bg);
        border: 1.5px solid var(--acad-hero-badge-border);
        color: var(--acad-hero-badge-text);
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
        background: var(--acad-takeaway-bg);
        border-left: 4px solid var(--acad-takeaway-border);
        border-radius: 12px;
        padding: 18px;
        font-size: 12px;
        line-height: 1.6;
        color: var(--acad-takeaway-text);
        font-weight: 600;
        border-top: 1px solid var(--da-card-border);
        border-right: 1px solid var(--da-card-border);
        border-bottom: 1px solid var(--da-card-border);
      }
      .acad-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--da-table-border);
      }
      .acad-table th {
        background: var(--da-table-th-bg);
        color: var(--da-table-th-text);
        font-weight: 800;
        padding: 12px 14px;
        border-bottom: 1.5px solid var(--da-table-border);
        text-align: left;
      }
      .acad-table td {
        padding: 12px 14px;
        border-bottom: 1px solid var(--da-table-border);
        color: var(--da-table-td-text);
      }
      .acad-table tr:last-child td {
        border-bottom: none;
      }
      .acad-sim-diagram {
        background: var(--da-svg-bg);
        background-image: var(--da-svg-grid);
        background-size: 16px 16px;
        border: 1.5px solid var(--da-card-border);
        border-radius: 16px;
        padding: 18px;
        box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.02);
        position: relative;
      }
      .da-svg-bg {
        background-color: var(--da-svg-bg) !important;
        background-image: var(--da-svg-grid) !important;
        background-size: 16px 16px !important;
        border-color: var(--da-card-border) !important;
      }
      .da-inner-card {
        background-color: rgba(248, 250, 252, 0.5) !important;
        border-color: var(--da-card-border) !important;
      }
      .acad-terminal {
        background: var(--acad-terminal-bg);
        border: 1.5px solid var(--da-code-border);
        border-radius: 12px;
        padding: 14px;
        font-family: 'Fira Code', 'Courier New', Courier, monospace;
        color: var(--acad-terminal-text);
        box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
      }
      
      .dr-node-glow {
        animation: drNodeGlow 1.5s infinite alternate;
      }
      @keyframes drNodeGlow {
        from { filter: drop-shadow(0 0 2px rgba(79, 70, 229, 0.3)); }
        to { filter: drop-shadow(0 0 10px rgba(79, 70, 229, 0.7)); }
      }

      /* Custom inputs style */
      .dr-container select,
      .dr-container input:not([type="checkbox"]),
      .dr-container textarea {
        background-color: var(--da-input-bg) !important;
        color: var(--da-input-color) !important;
        border-color: var(--da-input-border) !important;
      }
      
      .dark .da-card:hover .da-card-title {
        color: #6366f1 !important;
      }
      .dark .da-tb.da-on-notebook {
        background: rgba(245, 158, 11, 0.15) !important;
        color: #fbbf24 !important;
        border-color: rgba(245, 158, 11, 0.4) !important;
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.1) !important;
      }
      .dark .da-tb.da-on-strategies {
        background: rgba(13, 148, 136, 0.15) !important;
        color: #2dd4bf !important;
        border-color: rgba(13, 148, 136, 0.4) !important;
        box-shadow: 0 4px 12px rgba(13, 148, 136, 0.1) !important;
      }
      .dark .da-tb.da-on-multiregion {
        background: rgba(14, 165, 233, 0.15) !important;
        color: #38bdf8 !important;
        border-color: rgba(14, 165, 233, 0.4) !important;
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.1) !important;
      }
      .dark .da-tb.da-on-dms {
        background: rgba(234, 88, 12, 0.15) !important;
        color: #fb923c !important;
        border-color: rgba(234, 88, 12, 0.4) !important;
        box-shadow: 0 4px 12px rgba(234, 88, 12, 0.1) !important;
      }
      .dark .da-tb.da-on-backup {
        background: rgba(16, 185, 129, 0.15) !important;
        color: #4ade80 !important;
        border-color: rgba(16, 185, 129, 0.4) !important;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1) !important;
      }
      .dark .da-tb.da-on-playbook {
        background: rgba(99, 102, 241, 0.15) !important;
        color: #a5b4fc !important;
        border-color: rgba(99, 102, 241, 0.4) !important;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1) !important;
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
      
      .dark select option {
        background-color: #0f172a !important;
        color: #f1f5f9 !important;
      }
    `}</style>
  );
}
