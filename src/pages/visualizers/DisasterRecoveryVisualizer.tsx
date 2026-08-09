import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Zap,
  Shield,
  Globe,
  Activity,
  Play,
  Database,
  Lock,
  Unlock,
  AlertTriangle,
  Sliders,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import DisasterRecoveryComparativeView from '../../components/visualizers/DisasterRecoveryComparativeView';
import UniqueDisasterRecoveryFeatures from '../../components/visualizers/UniqueDisasterRecoveryFeatures';

type TabType = 'notebook' | 'strategies' | 'multiregion' | 'dms' | 'backup' | 'playbook' | 'unique';

interface LogRow {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

interface DisasterRecoveryVisualizerProps {
  provider?: 'aws' | 'azure' | 'gcp' | 'comparative';
  setProvider?: (provider: 'aws' | 'azure' | 'gcp' | 'comparative') => void;
}

export default function DisasterRecoveryVisualizer({ provider = 'aws', setProvider }: DisasterRecoveryVisualizerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');

  const isComparative = provider === 'comparative';

  const t = (text: string) => {
    if (provider === 'azure') {
      return text
        .replace(/AWS Backup/gi, 'Azure Backup')
        .replace(/AWS Elastic Disaster Recovery/gi, 'Azure Site Recovery (ASR)')
        .replace(/Route 53/gi, 'Azure Traffic Manager / Front Door')
        .replace(/S3 Cross-Region Replication/gi, 'Azure Geo-Redundant Storage (GRS)');
    }
    if (provider === 'gcp') {
      return text
        .replace(/AWS Backup/gi, 'Google Cloud Backup and DR')
        .replace(/AWS Elastic Disaster Recovery/gi, 'GCP Backup and DR Engine')
        .replace(/Route 53/gi, 'Google Cloud DNS Failover')
        .replace(/S3 Cross-Region Replication/gi, 'GCS Dual-Region Turbo Replication');
    }
    return text;
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
        if (node.type === 'pre' || node.type === 'code' || (node.props && (node.props.className === 'dr-terminal' || node.props.className === 'dr-code-card'))) {
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
    setActiveTab(tab === 'rpo-rto' ? 'strategies' : tab === 'architect' ? 'notebook' : tab);
  };
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
      {!isComparative && (
        <Translate>
        <div className="da-tabs">
          <button className={`da-tb ${activeTab === 'notebook' ? 'da-on-notebook' : ''}`} onClick={() => setActiveTab('notebook')}>
            <BookOpen className="w-4 h-4 text-amber-500" /> 📖 1) Visual Notes &amp; Theories
          </button>
          <button className={`da-tb ${activeTab === 'strategies' ? 'da-on-strategies' : ''}`} onClick={() => setActiveTab('strategies')}>
            <Sliders className="w-4 h-4 text-sky-500" /> 🎯 2) DR Strategies &amp; Cost Optimizer
          </button>
          <button className={`da-tb ${activeTab === 'multiregion' ? 'da-on-multiregion' : ''}`} onClick={() => setActiveTab('multiregion')}>
            <Globe className="w-4 h-4 text-blue-500" /> 🌐 3) Multi-Region Failover Simulator
          </button>
          <button className={`da-tb ${activeTab === 'dms' ? 'da-on-dms' : ''}`} onClick={() => setActiveTab('dms')}>
            <Database className="w-4 h-4 text-orange-500" /> 🛢️ 4) Database Migration Service (DMS)
          </button>
          <button className={`da-tb ${activeTab === 'backup' ? 'da-on-backup' : ''}`} onClick={() => setActiveTab('backup')}>
            <Shield className="w-4 h-4 text-emerald-500" /> 🔒 5) AWS Backup &amp; Vault Lock
          </button>
          <button className={`da-tb ${activeTab === 'playbook' ? 'da-on-playbook' : ''}`} onClick={() => setActiveTab('playbook')}>
            <BookOpen className="w-4 h-4 text-purple-500" /> 📑 6) Recovery Playbook
          </button>
          <button className={`da-tb ${activeTab === 'unique' ? 'da-on-backup' : ''}`} onClick={() => setActiveTab('unique')}>
            ✨ Unique Features
          </button>
        </div>
      </Translate>
      )}

      {isComparative && (
        <DisasterRecoveryComparativeView onNavigateToDemo={handleNavigateToDemo} />
      )}

      {!isComparative && activeTab === 'unique' && (
        <UniqueDisasterRecoveryFeatures provider={provider} />
      )}

      {!isComparative && activeTab !== 'unique' && (
        <Translate>
          <>

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
        <div className="space-y-6 animate-fadeIn text-left" style={{ color: 'var(--da-text)' }}>
          
          {/* Header Hero Card */}
          <div className="da-card text-left" style={{ borderLeft: '4px solid #f59e0b', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                  <BookOpen className="w-5 h-5 text-amber-500" /> AWS, Azure &amp; GCP Disaster Recovery &amp; Database Migration Academy
                </h2>
                <p className="text-xs mt-1.5 leading-relaxed font-sans font-semibold" style={{ color: 'var(--da-text-muted)' }}>
                  Complete 11-topic interactive disaster recovery and enterprise migration curriculum sorted across 4 core levels. Master RTO &amp; RPO SLAs, the 4 DR Strategy Archetypes, FIS Chaos Engineering, Route 53 Failover, Aurora Global DBs, DMS Change Data Capture (CDC), Schema Conversion Tool (SCT), Backup Vault Lock, MGN Orchestration, and Snowball Data Transfer.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="acad-hero-badge">🎓 11 Complete Modules</span>
                <span className="acad-hero-badge" style={{ background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.35)', color: '#d97706' }}>💡 Everyday Mental Models</span>
                <span className="acad-hero-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)', color: '#10b981' }}>🌐 AWS / Azure / GCP</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Sidebar Category Explorer */}
            <div className="lg:col-span-3 space-y-4 text-left">
              <span className="text-[10px] font-black uppercase tracking-widest block pl-1 font-mono" style={{ color: 'var(--da-text-muted)' }}>Curriculum Directory (11 Modules):</span>
              
              <div className="acad-dir-container">
                <div className="acad-dir-header">
                  <BookOpen className="w-4 h-4 text-amber-500" />
                  <span>DR &amp; Migration Explorer</span>
                </div>

                {/* LEVEL 1: DR FUNDAMENTALS */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'fundamentals' ? '' : 'fundamentals')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-amber-500" />
                      1. DR Core Fundamentals
                    </span>
                    {expandedCategory === 'fundamentals' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'fundamentals' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('rto_rpo')}
                        className={`acad-dir-item-btn ${selectedNote === 'rto_rpo' ? 'acad-active' : ''}`}
                      >
                        1.1 RTO &amp; RPO SLA Metrics
                      </button>
                      <button 
                        onClick={() => setSelectedNote('dr_strategies')}
                        className={`acad-dir-item-btn ${selectedNote === 'dr_strategies' ? 'acad-active' : ''}`}
                      >
                        1.2 The 4 DR Blueprints
                      </button>
                      <button 
                        onClick={() => setSelectedNote('dr_tips')}
                        className={`acad-dir-item-btn ${selectedNote === 'dr_tips' ? 'acad-active' : ''}`}
                      >
                        1.3 HA vs DR &amp; FIS Chaos
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 2: MULTI-REGION & HYBRID */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'failover' ? '' : 'failover')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      2. Multi-Region Failover
                    </span>
                    {expandedCategory === 'failover' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'failover' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('failover_routing')}
                        className={`acad-dir-item-btn ${selectedNote === 'failover_routing' ? 'acad-active' : ''}`}
                      >
                        2.1 Route 53 DNS Failover
                      </button>
                      <button 
                        onClick={() => setSelectedNote('aurora_global_db')}
                        className={`acad-dir-item-btn ${selectedNote === 'aurora_global_db' ? 'acad-active' : ''}`}
                      >
                        2.2 Aurora Global Databases
                      </button>
                      <button 
                        onClick={() => setSelectedNote('hybrid_backup')}
                        className={`acad-dir-item-btn ${selectedNote === 'hybrid_backup' ? 'acad-active' : ''}`}
                      >
                        2.3 On-Prem &amp; Hybrid Backup
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 3: DB & BACKUP GOVERNANCE */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'governance' ? '' : 'governance')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      3. DB &amp; Backup Governance
                    </span>
                    {expandedCategory === 'governance' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'governance' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('dms_replication')}
                        className={`acad-dir-item-btn ${selectedNote === 'dms_replication' ? 'acad-active' : ''}`}
                      >
                        3.1 AWS DMS CDC Continuous Sync
                      </button>
                      <button 
                        onClick={() => setSelectedNote('aws_sct')}
                        className={`acad-dir-item-btn ${selectedNote === 'aws_sct' ? 'acad-active' : ''}`}
                      >
                        3.2 AWS Schema Conversion (SCT)
                      </button>
                      <button 
                        onClick={() => setSelectedNote('backup_vault_lock')}
                        className={`acad-dir-item-btn ${selectedNote === 'backup_vault_lock' ? 'acad-active' : ''}`}
                      >
                        3.3 Backup Vault Lock (WORM)
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 4: ENTERPRISE MIGRATION SUITE */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'migration_suite' ? '' : 'migration_suite')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-purple-500" />
                      4. Enterprise Migration
                    </span>
                    {expandedCategory === 'migration_suite' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'migration_suite' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)' }}>
                      <button 
                        onClick={() => setSelectedNote('mgn_ads')}
                        className={`acad-dir-item-btn ${selectedNote === 'mgn_ads' ? 'acad-active' : ''}`}
                      >
                        4.1 ADS Audit &amp; MGN Migration
                      </button>
                      <button 
                        onClick={() => setSelectedNote('large_data_transfer')}
                        className={`acad-dir-item-btn ${selectedNote === 'large_data_transfer' ? 'acad-active' : ''}`}
                      >
                        4.2 Snow Family &amp; DataSync ETA
                      </button>
                    </div>
                  )}
                </div>

              </div>

              <div className="acad-advice-box rounded-2xl p-4 text-[11px] leading-relaxed font-semibold space-y-1">
                <span className="font-extrabold flex items-center gap-1.5 mb-1 text-[11.5px]" style={{ color: 'var(--da-text-title)' }}>
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Interactive Quick-Launch
                </span>
                Click any of the 11 Disaster Recovery modules to explore multi-cloud AWS, Azure &amp; GCP comparison tables, real-world analogies, and interactive simulators!
              </div>
            </div>

            {/* Right Active Note Workspace */}
            <div className="lg:col-span-9 space-y-6 text-left">

              {/* MODULE 1.1: RTO & RPO TAXONOMY */}
              {selectedNote === 'rto_rpo' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">1.1 DR Core Fundamentals</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        1.1 Recovery Time Objective (RTO) &amp; Recovery Point Objective (RPO) Metrics
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('strategies')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Strategies Optimizer
                    </button>
                  </div>

                  {/* What & Why Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Globe className="w-3.5 h-3.5 text-amber-500" /> What Is It &amp; Why Needed?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        **RPO (Recovery Point Objective)** specifies how much data loss your business can tolerate (measured in time before disaster). **RTO (Recovery Time Objective)** specifies how much system downtime your business can tolerate before systems must be back online.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Activity className="w-3.5 h-3.5 text-emerald-500" /> What Problem Does It Solve?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Provides quantifiable business SLAs that dictate how frequently database backups must occur (for low RPO) and how automated infrastructure provisioning/failover must be (for low RTO).
                      </p>
                    </div>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong>
                    <br />• <strong>RPO (Data Loss Clock)</strong>: &ldquo;If a datacenter catches fire at 2:00 PM and our last database backup was at 1:00 PM, we lost 1 hour of customer data.&rdquo; (RPO = 1 Hour).
                    <br />• <strong>RTO (Downtime Clock)</strong>: &ldquo;If the site goes down at 2:00 PM and we get servers running in standby region by 2:15 PM, our downtime was 15 minutes.&rdquo; (RTO = 15 Mins).
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Word Document Auto-Save vs Computer Boot Time
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      • <strong>RPO</strong>: How often Microsoft Word auto-saves your essay. If it auto-saves every 5 minutes and your laptop battery dies, you lose at most 5 minutes of typing!
                      <br />• <strong>RTO</strong>: How many minutes it takes you to find a spare laptop charger, plug it in, press the power button, and reopen your document!
                    </p>
                  </div>

                  <div className="overflow-x-auto">
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
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Focus Area</strong></td>
                          <td style={{ color: '#2563eb', fontWeight: 600 }}>Databases, Snapshots &amp; Transaction Logs</td>
                          <td style={{ color: '#7c3aed', fontWeight: 600 }}>Infrastructure spin-up &amp; DNS Failover routing</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Cost Driver</strong></td>
                          <td>Continuous cross-region data replication bandwidth</td>
                          <td>Pre-provisioned standby server capacity</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MODULE 1.2: DR STRATEGY BLUEPRINTS */}
              {selectedNote === 'dr_strategies' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">1.2 DR Core Fundamentals</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        1.2 The 4 Disaster Recovery Strategy Blueprints
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('strategies')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Strategies Optimizer
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Strategy Switcher */}
                    <div className="flex flex-wrap gap-2 p-1.5 rounded-xl border w-fit" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      {(['backup', 'pilot', 'warm', 'hot'] as const).map((strat) => (
                        <button
                          key={strat}
                          onClick={() => setActiveStrategyTab(strat)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all select-none ${
                            activeStrategyTab === strat
                              ? 'bg-amber-600 text-white shadow'
                              : 'hover:bg-slate-200 dark:hover:bg-slate-800'
                          }`}
                        >
                          {strat === 'backup' && '💾 1. Backup & Restore'}
                          {strat === 'pilot' && '🔥 2. Pilot Light'}
                          {strat === 'warm' && '⛅ 3. Warm Standby'}
                          {strat === 'hot' && '⚡ 4. Multi-Site Active'}
                        </button>
                      ))}
                    </div>

                    <div className="p-4 rounded-xl border text-xs leading-relaxed" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      {activeStrategyTab === 'backup' && (
                        <div>
                          <strong className="text-blue-600 block text-sm mb-1">💾 1. Backup &amp; Restore Strategy (Lowest Cost, Highest RTO/RPO)</strong>
                          Snapshots and backups are saved to S3. Secondary region compute is <strong>Cold (0 servers running)</strong>. On failure, Terraform/CloudFormation provisions subnets, EC2, and restores DBs from S3.
                          <div className="mt-2 font-bold" style={{ color: 'var(--da-text-muted)' }}>
                            RPO: &lt; 24 hours | RTO: &lt; 24 hours | Cost: $ (Minimal)
                          </div>
                        </div>
                      )}
                      {activeStrategyTab === 'pilot' && (
                        <div>
                          <strong className="text-amber-600 block text-sm mb-1">🔥 2. Pilot Light Strategy (Active Database, Cold Compute)</strong>
                          The database is actively replicating to the standby region in real time, but app servers are OFF (or AMIs ready). Upon failover, Auto Scaling Groups quickly launch EC2 instances and connect to the active DB.
                          <div className="mt-2 font-bold" style={{ color: 'var(--da-text-muted)' }}>
                            RPO: &lt; 60 mins | RTO: &lt; 4 hours | Cost: $$ (Low)
                          </div>
                        </div>
                      )}
                      {activeStrategyTab === 'warm' && (
                        <div>
                          <strong className="text-purple-600 block text-sm mb-1">⛅ 3. Warm Standby Strategy (Scaled-Down Live Fleet)</strong>
                          A minimal, scaled-down copy of full infrastructure runs 24/7 in the secondary region (e.g. 1 EC2 instance instead of 10). Upon failover, Auto Scaling immediately scales up the fleet to 100% capacity.
                          <div className="mt-2 font-bold" style={{ color: 'var(--da-text-muted)' }}>
                            RPO: &lt; 15 mins | RTO: &lt; 1 hour | Cost: $$$ (Medium)
                          </div>
                        </div>
                      )}
                      {activeStrategyTab === 'hot' && (
                        <div>
                          <strong className="text-emerald-600 block text-sm mb-1">⚡ 4. Multi-Site Active-Active (Zero Downtime, Near-Zero RPO/RTO)</strong>
                          Two identical, fully operational production regions handle live customer traffic simultaneously. Route 53 splits traffic 50/50. Physical storage mirrors commits instantly.
                          <div className="mt-2 font-bold" style={{ color: 'var(--da-text-muted)' }}>
                            RPO: Near-Zero | RTO: Near-Zero | Cost: $$$$ (High)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="acad-table">
                      <thead>
                        <tr>
                          <th>Strategy</th>
                          <th>Standby Compute State</th>
                          <th>Database State</th>
                          <th>Typical RTO</th>
                          <th>Typical RPO</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>Backup &amp; Restore</strong></td>
                          <td>None (Cold)</td>
                          <td>Periodic Snapshots in S3</td>
                          <td>Hours to Days</td>
                          <td>24 Hours</td>
                        </tr>
                        <tr>
                          <td><strong>Pilot Light</strong></td>
                          <td>Cold (AMIs/Templates Ready)</td>
                          <td>Live Replicating DB Writer/Reader</td>
                          <td>1 to 4 Hours</td>
                          <td>Minutes</td>
                        </tr>
                        <tr>
                          <td><strong>Warm Standby</strong></td>
                          <td>Live Scaled-Down Fleet (e.g. 20% capacity)</td>
                          <td>Live Synchronized Replica</td>
                          <td>Minutes</td>
                          <td>Seconds</td>
                        </tr>
                        <tr>
                          <td><strong>Multi-Site Active</strong></td>
                          <td>Live 100% Mirrored Capacity</td>
                          <td>Bi-Directional Synchronous Cluster</td>
                          <td>Sub-Second</td>
                          <td>Sub-Second</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MODULE 1.3: HA VS DR & CHAOS ENGINEERING */}
              {selectedNote === 'dr_tips' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">1.3 DR Core Fundamentals</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        1.3 High Availability vs Disaster Recovery &amp; AWS FIS Chaos Engineering
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('multiregion')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Chaos Simulator
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong>
                    <br />• <strong>High Availability (HA)</strong>: Protects against localized hardware failures within a single region (spanning multiple Availability Zones). Synchronous failover happens in seconds!
                    <br />• <strong>Disaster Recovery (DR)</strong>: Protects against regional catastrophes (e.g. natural disaster destroying an entire AWS region). Asynchronous failover across global regions.
                    <br />• <strong>AWS Fault Injection Service (FIS)</strong>: A managed chaos engineering service that lets you safely inject artificial faults (RDS failover, CPU spikes, network latency) to test runbooks before real disasters strike!
                  </div>

                  {/* Interactive Chaos Simulator */}
                  <div className="p-4 rounded-xl border space-y-3" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                    <h4 className="text-xs font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                      <Zap className="w-4 h-4 text-amber-500" /> Interactive AWS FIS Fault Injection Simulator
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setChaosSimType('rds_failover')}
                        className={`p-2 rounded-lg border text-xs font-extrabold ${chaosSimType === 'rds_failover' ? 'bg-amber-600 text-white' : ''}`}
                      >
                        🛢️ RDS Primary Crash
                      </button>
                      <button
                        onClick={() => setChaosSimType('az_blackhole')}
                        className={`p-2 rounded-lg border text-xs font-extrabold ${chaosSimType === 'az_blackhole' ? 'bg-amber-600 text-white' : ''}`}
                      >
                        🔌 AZ Network Blackhole
                      </button>
                      <button
                        onClick={() => setChaosSimType('dns_split_brain')}
                        className={`p-2 rounded-lg border text-xs font-extrabold ${chaosSimType === 'dns_split_brain' ? 'bg-amber-600 text-white' : ''}`}
                      >
                        🌐 DNS Latency Spike
                      </button>
                    </div>

                    <button
                      onClick={runChaosSimulation}
                      disabled={chaosSimStatus === 'running'}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-lg transition-all shadow active:scale-95"
                    >
                      {chaosSimStatus === 'running' ? '⚡ Injecting Fault Scenario...' : '💥 Run Chaos Experiment'}
                    </button>

                    <div className="p-3 bg-slate-900 rounded-lg text-[10px] font-mono text-emerald-400 max-h-32 overflow-y-auto space-y-1">
                      {chaosConsoleLogs.length === 0 ? (
                        <div className="text-slate-500 italic">Terminal idle. Click &quot;Run Chaos Experiment&quot; to test runbook resiliency.</div>
                      ) : (
                        chaosConsoleLogs.map((log, i) => (
                          <div key={i} className="flex gap-2">
                            <span className="text-amber-400">{log.timestamp}</span>
                            <span className={log.type === 'error' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>{log.message}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 2.1: ROUTE 53 FAILOVER */}
              {selectedNote === 'failover_routing' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">2.1 Multi-Region &amp; Hybrid</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        2.1 Route 53 Active-Passive &amp; Active-Active DNS Failover Routing
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('multiregion')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Failover Simulator
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Route 53 continuously sends health check pings (HTTP/HTTPS/TCP) every 10 or 30 seconds to your primary region. If the primary region fails 3 consecutive health checks, Route 53 automatically updates DNS records to direct incoming users to the standby DR region!
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Airport Traffic Controller Re-Routing Flights
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      If Airport A gets hit by a severe blizzard (`Regional Outage`), the central air traffic controller (`Route 53`) redirects all incoming passenger planes to land safely at Airport B (`Standby Region`).
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="acad-table">
                      <thead>
                        <tr>
                          <th>Cloud Provider</th>
                          <th>DNS Failover Service</th>
                          <th>Health Check Frequency</th>
                          <th>Recommended Failover Record TTL</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>AWS</strong></td>
                          <td>Amazon Route 53 / Application Recovery Controller</td>
                          <td>10s Fast Probe / 30s Standard</td>
                          <td>10s to 60s (To prevent ISP caching stale IPs)</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Azure</strong></td>
                          <td>Azure Traffic Manager / Azure Front Door</td>
                          <td>10s to 30s Probes</td>
                          <td>30s TTL</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>GCP</strong></td>
                          <td>Google Cloud DNS Failover Routing Policies</td>
                          <td>5s to 30s Health Checks</td>
                          <td>30s TTL</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MODULE 2.2: AURORA GLOBAL DATABASES */}
              {selectedNote === 'aurora_global_db' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">2.2 Multi-Region &amp; Hybrid</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        2.2 Amazon Aurora Global Databases: Sub-Second Cross-Region Replication
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('multiregion')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Multi-Region Tab
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Standard database replication sends SQL logs over the network, which the replica must execute line-by-line. **Aurora Global Database** bypasses the database engine entirely: dedicated storage hardware mirrors raw physical NVMe storage blocks directly between regions with **less than 1 second replication lag**!
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Dictating a Book vs Instant Photo Photocopy
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      • <strong>Traditional Logical DB Replication</strong>: Reading a book out loud page-by-page over a telephone so someone in another city can write down every word (`Slow &amp; CPU Intensive`).
                      <br />• <strong>Aurora Physical Block Mirroring</strong>: Taking an instant high-speed photocopy of the page and transmitting the image via laser satellite (`Sub-second &amp; Zero DB Overhead`)!
                    </p>
                  </div>
                </div>
              )}

              {/* MODULE 2.3: HYBRID BACKUP */}
              {selectedNote === 'hybrid_backup' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">2.3 Multi-Region &amp; Hybrid</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        2.3 On-Premises Hybrid Backup &amp; AWS Storage Gateway
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('backup')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Backup Tab
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Connects physical datacenters (VMware ESXi, Hyper-V) to cloud backup vaults using **AWS Backup Gateway** or **Volume Gateway**. Local servers keep writing to local SAN/NAS storage while snapshots automatically stream to S3 and Glacier in the cloud!
                  </div>
                </div>
              )}

              {/* MODULE 3.1: DMS CDC CONTINUOUS SYNC */}
              {selectedNote === 'dms_replication' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">3.1 DB &amp; Backup Governance</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        3.1 AWS Database Migration Service (DMS) &amp; Change Data Capture (CDC)
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('dms')}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch DMS Simulator
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **AWS DMS** performs zero-downtime database migrations. **Full Load** copies existing tables, while **CDC (Change Data Capture)** reads native transaction log buffers (Oracle Redo Logs, MySQL Binlogs, Postgres WAL) in real time to keep cloud databases in sync while your business keeps taking live orders!
                  </div>

                  {/* Interactive Matrix & CDC Animation Control */}
                  <div className="p-4 rounded-xl border space-y-3" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold" style={{ color: 'var(--da-text-title)' }}>
                        🧪 Interactive DMS Migration Engine Selector
                      </h4>
                      <button
                        onClick={() => setIsCdcAnimating(!isCdcAnimating)}
                        className="px-2.5 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-[10px] font-black transition-all active:scale-95"
                      >
                        {isCdcAnimating ? '⏸️ Pause CDC Stream' : '▶️ Play CDC Stream'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-bold block mb-1">Source DB:</label>
                        <select
                          value={dmsMatrixSource}
                          onChange={(e) => setDmsMatrixSource(e.target.value)}
                          className="w-full p-2 border rounded-lg font-bold"
                          style={{ background: 'var(--da-card-bg)', borderColor: 'var(--da-card-border)' }}
                        >
                          <option value="oracle">Oracle Enterprise</option>
                          <option value="sqlserver">Microsoft SQL Server</option>
                          <option value="mysql">MySQL Engine</option>
                          <option value="postgres">PostgreSQL Engine</option>
                        </select>
                      </div>

                      <div>
                        <label className="font-bold block mb-1">Target DB:</label>
                        <select
                          value={dmsMatrixTarget}
                          onChange={(e) => setDmsMatrixTarget(e.target.value)}
                          className="w-full p-2 border rounded-lg font-bold"
                          style={{ background: 'var(--da-card-bg)', borderColor: 'var(--da-card-border)' }}
                        >
                          <option value="aurora">Amazon Aurora Cluster</option>
                          <option value="rds_pg">RDS PostgreSQL</option>
                          <option value="s3">Amazon S3 Lakehouse</option>
                          <option value="dynamodb">Amazon DynamoDB</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border text-xs font-semibold" style={{ background: 'var(--da-card-bg)', borderColor: 'var(--da-card-border)' }}>
                      {dmsMatrixSource === dmsMatrixTarget || (dmsMatrixSource === 'mysql' && dmsMatrixTarget === 'aurora') ? (
                        <span className="text-emerald-600 font-bold">✅ Homogeneous Path: Schema is 100% compatible. SCT not required!</span>
                      ) : (
                        <span className="text-indigo-600 font-bold">🔄 Heterogeneous Path: Different engines! Requires AWS Schema Conversion Tool (SCT) first to convert stored procedures &amp; triggers.</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* MODULE 3.2: AWS SCHEMA CONVERSION TOOL */}
              {selectedNote === 'aws_sct' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">3.2 DB &amp; Backup Governance</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        3.2 AWS Schema Conversion Tool (SCT) Code Translation
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('dms')}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch DMS Simulator
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **SCT** converts database schemas, tables, indexes, views, stored procedures, and triggers from one database dialect (e.g. Oracle PL/SQL or SQL Server T-SQL) into compatible target dialects (e.g. PostgreSQL PL/pgSQL or MySQL DDL).
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Language Translator vs Moving Truck
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      • <strong>AWS SCT (Language Translator)</strong>: Translates an instruction manual written in German into English so English readers can understand it (`Converts SQL code &amp; table definitions`).
                      <br />• <strong>AWS DMS (Moving Truck)</strong>: Loads all the heavy furniture out of the house into the truck and drives it across town to the new house (`Loads actual data rows`).
                    </p>
                  </div>
                </div>
              )}

              {/* MODULE 3.3: BACKUP VAULT LOCK */}
              {selectedNote === 'backup_vault_lock' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">3.3 DB &amp; Backup Governance</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        3.3 AWS Backup Vault Lock &amp; Immutable WORM Compliance
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('backup')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Backup Tab
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong>
                    <br />• <strong>Governance Mode</strong>: Prevents standard IAM users from deleting backups. Admins with root permissions can override if necessary.
                    <br />• <strong>Compliance Mode (Irreversible WORM)</strong>: Locks backups completely. **NO ONE—not even the AWS root account or AWS Support—can delete backup snapshots** until the retention period expires!
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Time-Locked Bank Deposit Safe
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      You drop cash into a steel time-locked vault configured to unlock on January 1st. Even if a thief holds a gun to the bank manager&apos;s head (`Stolen Root Credentials`), the mechanical timer will physically refuse to open until January 1st!
                    </p>
                  </div>
                </div>
              )}

              {/* MODULE 4.1: MGN & ADS */}
              {selectedNote === 'mgn_ads' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">4.1 Enterprise Migration</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        4.1 AWS Application Discovery Service (ADS) &amp; Application Migration Service (MGN)
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('playbook')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Playbook Tab
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong>
                    <br />• <strong>AWS ADS (Discovery Agent)</strong>: Audits your physical datacenter to map server dependencies, RAM/CPU utilization, and active network connections.
                    <br />• <strong>AWS MGN (Replication Agent)</strong>: Performs block-level lift-and-shift server replication into AWS staging subnets without taking servers offline. Cuts over in &lt; 5 mins!
                  </div>
                </div>
              )}

              {/* MODULE 4.2: LARGE SCALE DATA TRANSFER */}
              {selectedNote === 'large_data_transfer' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">4.2 Enterprise Migration</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        4.2 Large Scale Data Transfer (DataSync vs AWS Snowball Edge / Snowmobile)
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('playbook')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Playbook Tab
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong>
                    <br />• <strong>AWS DataSync</strong>: High-speed multi-threaded network transfer over Direct Connect or internet. Best for dataset sizes &lt; 10 TB.
                    <br />• <strong>AWS Snowcone (8 TB) / Snowball Edge (80 TB) / Snowmobile (100 PB)</strong>: Ruggedized physical hardware appliances shipped via courier when network bandwidth is too slow!
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Downloading vs Mailing a Hard Drive
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      &ldquo;Never underestimate the bandwidth of a station wagon full of tapes hurtling down the highway.&rdquo; If downloading 500 Terabytes over a slow 100 Mbps internet line takes 460 days, shipping a Snowball Edge appliance via FedEx takes 3 days!
                    </p>
                  </div>

                  {/* Interactive ETA & Feasibility Calculator */}
                  <div className="p-4 rounded-xl border space-y-3" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                    <h4 className="text-xs font-bold" style={{ color: 'var(--da-text-title)' }}>
                      🧮 Interactive Data Transfer ETA &amp; Feasibility Calculator
                    </h4>

                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between font-bold mb-1">
                          <span>Dataset Size:</span>
                          <span className="text-amber-600">{calcDataSizeTB} TB</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5000"
                          value={calcDataSizeTB}
                          onChange={(e) => setCalcDataSizeTB(Number(e.target.value))}
                          className="w-full accent-amber-500"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-bold mb-1">
                          <span>Network Bandwidth:</span>
                          <span className="text-amber-600">
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
                          className="w-full accent-amber-500"
                        />
                      </div>

                      <div className="p-3 rounded-lg border font-mono text-[11px] space-y-1" style={{ background: 'var(--da-card-bg)', borderColor: 'var(--da-card-border)' }}>
                        <div className="flex justify-between">
                          <span>Online DataSync Transfer Time:</span>
                          <span className="font-bold text-blue-600">
                            {(() => {
                              const days = (calcDataSizeTB * 8000000) / (calcBandwidthMbps * 0.8) / 86400;
                              if (days < 1) return `${(days * 24).toFixed(1)} hours`;
                              if (days > 365) return `${(days / 365).toFixed(1)} years`;
                              return `${days.toFixed(1)} days`;
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Physical Snowball Courier Transit:</span>
                          <span className="font-bold text-emerald-600">~5 to 7 days (Total transit + ingest)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="acad-table">
                      <thead>
                        <tr>
                          <th>Transfer Method</th>
                          <th>Capacity Unit</th>
                          <th>Best Use Case</th>
                          <th>Estimated Transfer Window</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong>AWS DataSync</strong></td>
                          <td>Continuous Stream</td>
                          <td>Active file sync over Direct Connect / Internet</td>
                          <td>Hours to Days (Bandwidth dependent)</td>
                        </tr>
                        <tr>
                          <td><strong>Snowcone</strong></td>
                          <td>8 TB to 14 TB</td>
                          <td>Edge computing &amp; small remote site backups</td>
                          <td>2 to 4 Days (Courier transit)</td>
                        </tr>
                        <tr>
                          <td><strong>Snowball Edge</strong></td>
                          <td>80 TB to 100 TB</td>
                          <td>Datacenter migrations &amp; petabyte archives</td>
                          <td>3 to 5 Days (Courier transit)</td>
                        </tr>
                        <tr>
                          <td><strong>Snowmobile</strong></td>
                          <td>Up to 100 PB</td>
                          <td>Exabyte-scale complete datacenter evacuations</td>
                          <td>Weeks (Semi-truck transit)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

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
      .acad-plain-english {
        background: rgba(2, 132, 199, 0.07);
        border-left: 4px solid #0ea5e9;
        border-radius: 12px;
        padding: 16px;
        margin: 16px 0;
        font-size: 12.5px;
        line-height: 1.65;
        color: var(--da-text-title);
        border-top: 1px solid var(--da-card-border);
        border-right: 1px solid var(--da-card-border);
        border-bottom: 1px solid var(--da-card-border);
      }
      .dark .acad-plain-english {
        background: rgba(56, 189, 248, 0.12);
        border-left-color: #38bdf8;
        color: #f1f5f9;
      }
      .acad-analogy-box {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%);
        border: 1.5px solid rgba(245, 158, 11, 0.35);
        border-radius: 12px;
        padding: 16px;
        margin: 16px 0;
        font-size: 12px;
        line-height: 1.65;
        color: var(--da-text-title);
      }
      .dark .acad-analogy-box {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%);
        border-color: rgba(245, 158, 11, 0.35);
        color: #f1f5f9;
      }
      .acad-advice-box {
        background: var(--da-card-bg);
        border: 1px solid var(--da-card-border);
        color: var(--da-text-muted);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
      }
      .dark .acad-advice-box {
        background: rgba(15, 23, 42, 0.6);
        border-color: rgba(51, 65, 85, 0.6);
        color: #cbd5e1;
      }
      .acad-gotcha-box {
        background: rgba(239, 68, 68, 0.06);
        border-left: 4px solid #ef4444;
        border-radius: 10px;
        padding: 14px 16px;
        margin: 16px 0;
        font-size: 11.5px;
        line-height: 1.55;
        color: var(--da-text-muted);
        border-top: 1px solid var(--da-card-border);
        border-right: 1px solid var(--da-card-border);
        border-bottom: 1px solid var(--da-card-border);
      }
      .dark .acad-gotcha-box {
        background: rgba(239, 68, 68, 0.12);
        color: #fca5a5;
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
