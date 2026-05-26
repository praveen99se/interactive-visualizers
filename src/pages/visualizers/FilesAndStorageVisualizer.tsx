import { useState } from 'react';

type TabType = 'overview' | 'windows' | 'lustre' | 'hybrid' | 'sim' | 'matrix';
type ScenarioType = 'lustre_ml' | 'windows_multiaz' | 'zfs_dev' | 'ontap_enterprise' | 'gateway_hybrid' | 'datasync_migration';

interface SimLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export default function FilesAndStorageVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Simulator States
  const [activeScenario, setActiveScenario] = useState<ScenarioType>('windows_multiaz');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [azFailed, setAzFailed] = useState<boolean>(false);
  const [clonedZfs, setClonedZfs] = useState<boolean>(false);
  const [lazyLoaded, setLazyLoaded] = useState<boolean>(false);

  const [simLogs, setSimLogs] = useState<SimLog[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'Storage Simulator ready. Select a workload scenario and click "Simulate Workload Traffic".',
    }
  ]);

  // Tiering Calculator State
  const [totalDataGb, setTotalDataGb] = useState<number>(10000); // 10 TB
  const [coldPercent, setColdPercent] = useState<number>(70); // 70% cold

  // Interactive Storage Advisor Questionnaire State
  const [advisorDataType, setAdvisorDataType] = useState<string>('object');
  const [advisorAccess, setAdvisorAccess] = useState<string>('cloud');
  const [advisorMigration, setAdvisorMigration] = useState<string>('online_sync');
  const [advisorResult, setAdvisorResult] = useState<string | null>(null);

  // DataSync Simulation Bandwidth
  const [datasyncBandwidth, setDatasyncBandwidth] = useState<number>(1000); // 1 Gbps default

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setSimLogs((prev) => [
      { timestamp: new Date().toLocaleTimeString(), type, message },
      ...prev,
    ]);
  };

  const handleSimulateTraffic = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStep(1);

    if (activeScenario === 'windows_multiaz') {
      addLog(`Initiating SMB client connection from corporate workstation domain...`, 'info');
      setTimeout(() => {
        setSimStep(2);
        if (azFailed) {
          addLog(`SMB traffic detected. Route table DNS resolved to Subnet B Standby (promoted). Sync blocks active in AZ-b.`, 'success');
        } else {
          addLog(`Client successfully authenticated via Microsoft Active Directory. Mounted share: \\\\fsx-win-primary.corp\\share`, 'success');
        }
        setTimeout(() => {
          setSimStep(3);
          addLog(`Writing file chunk (100 MB). Primary storage cluster acknowledges block write.`, 'info');
          setTimeout(() => {
            setSimStep(4);
            setIsSimulating(false);
            if (!azFailed) {
              addLog(`Synchronous replication block write committed on standby storage node in AZ-b. Write execution completed successfully.`, 'success');
            } else {
              addLog(`Write committed on AZ-b single active volume. Write execution completed.`, 'success');
            }
          }, 600);
        }, 600);
      }, 600);
    } 
    else if (activeScenario === 'lustre_ml') {
      addLog(`ML Compute Fleet requesting input dataset (1 TB payload)...`, 'info');
      setTimeout(() => {
        setSimStep(2);
        if (lazyLoaded) {
          addLog(`Lustre file index metadata matching. Direct fetch from Lustre high-speed NVMe block arrays. Latency: < 1ms.`, 'success');
          setTimeout(() => {
            setSimStep(4);
            setIsSimulating(false);
            addLog(`HPC training checkpoints saved and exported. Parallel writes completed successfully at 50 GB/s.`, 'success');
          }, 800);
        } else {
          addLog(`Metadata HIT but data block MISS. Triggering Lustre lazy-loading stream from target Amazon S3 bucket...`, 'warning');
          setTimeout(() => {
            setSimStep(3);
            addLog(`S3 objects downloaded over internal backplane and cached onto local Lustre storage arrays.`, 'info');
            setTimeout(() => {
              setSimStep(4);
              setIsSimulating(false);
              setLazyLoaded(true);
              addLog(`Lazy-load caching completed. Compute nodes successfully read training dataset blocks. Parallel execution finished.`, 'success');
            }, 800);
          }, 800);
        }
      }, 600);
    }
    else if (activeScenario === 'zfs_dev') {
      addLog(`Developer mounting OpenZFS dataset...`, 'info');
      setTimeout(() => {
        setSimStep(2);
        if (clonedZfs) {
          addLog(`Mounted OpenZFS cloned dataset: /mnt/zfs-clone-dev. Serving sub-millisecond dynamic read/writes via Copy-on-Write metadata pointer locks.`, 'success');
        } else {
          addLog(`Mounted primary production OpenZFS volume: /mnt/zfs-prod. Direct read/write speeds operating at 80,000 IOPS.`, 'success');
        }
        setTimeout(() => {
          setIsSimulating(false);
          setSimStep(0);
          addLog(`Development workloads active. Serving files with dynamic compression.`, 'success');
        }, 800);
      }, 600);
    }
    else if (activeScenario === 'ontap_enterprise') {
      addLog(`Enterprise SAP Application initializing multi-protocol mounts...`, 'info');
      setTimeout(() => {
        setSimStep(2);
        addLog(`NFS v4.1 mounted on Linux database cluster, SMB share mounted on corporate analytics dashboard. FlexGroup capacity consolidated.`, 'success');
        setTimeout(() => {
          setSimStep(3);
          addLog(`NetApp SnapMirror background block replication running. Syncing changes to secondary disaster recovery cluster...`, 'warning');
          setTimeout(() => {
            setIsSimulating(false);
            setSimStep(0);
            addLog(`ONTAP auto-tiering system active: Shifting inactive database logs (cold blocks) down to capacity pool. Active RAM/NVMe blocks optimized.`, 'success');
          }, 800);
        }, 800);
      }, 600);
    }
    else if (activeScenario === 'gateway_hybrid') {
      addLog(`SMB Client initiating local file save to Storage Gateway local cached disk volume...`, 'info');
      setTimeout(() => {
        setSimStep(2);
        addLog(`File saved instantly onto local gateway cache server registers. Response returned to client. Latency: < 1ms!`, 'success');
        setTimeout(() => {
          setSimStep(3);
          addLog(`Storage Gateway background throttling upload thread triggered. Buffering data blocks...`, 'info');
          setTimeout(() => {
            setSimStep(4);
            setIsSimulating(false);
            addLog(`Background upload finished: 100% of block payloads transferred securely over SSL to S3 bucket. Local cache kept warm.`, 'success');
          }, 800);
        }, 600);
      }, 600);
    }
    else if (activeScenario === 'datasync_migration') {
      const timeHours = (100000000 / (datasyncBandwidth * 3600)).toFixed(1);
      addLog(`AWS DataSync Task initialized. Syncing 100 TB local NAS files to Amazon S3...`, 'info');
      addLog(`Active agent measuring network bandwidth limit: ${datasyncBandwidth} Mbps. Estimated completion: ${timeHours} hours.`, 'warning');
      setTimeout(() => {
        setSimStep(2);
        addLog(`Securing TLS connection tunnels. Scanning local metadata and comparing file indexes with S3...`, 'info');
        setTimeout(() => {
          setSimStep(3);
          addLog(`Transferring block payload streams in parallel. Speed: ${datasyncBandwidth} Mbps.`, 'info');
          setTimeout(() => {
            setSimStep(4);
            setIsSimulating(false);
            addLog(`SUCCESS: 100 TB data synchronization fully completed. Verified data integrity using 100% SHA-256 validation checks.`, 'success');
          }, 800);
        }, 800);
      }, 600);
    }
  };

  // Trigger Windows multi-AZ failover
  const handleTriggerFailover = () => {
    if (activeScenario !== 'windows_multiaz' || isSimulating) return;
    setAzFailed(prev => !prev);
    if (!azFailed) {
      addLog(`CRITICAL: Simulated datacenter crash inside Availability Zone a (AZ-a)! Primary storage node went OFFLINE.`, 'error');
      addLog(`Automatic failover triggered: Active DNS endpoint shifts automatically to point to passive standby node in AZ-b.`, 'warning');
      addLog(`Standby node promoted to PRIMARY. Client SMB mounts automatically reconnect inside 30s. Zero data loss.`, 'success');
    } else {
      addLog(`Datacenter recovered in AZ-a. Rebuilding cluster replication...`, 'warning');
      addLog(`Synchronous replication active. Standby node in AZ-a synced and operating in passive mode.`, 'success');
    }
  };

  // Trigger OpenZFS snapshot clone
  const handleTriggerZfsClone = () => {
    if (activeScenario !== 'zfs_dev' || isSimulating) return;
    setClonedZfs(true);
    addLog(`Submitting OpenZFS Snapshot request for dataset /mnt/zfs-prod`, 'info');
    addLog(`Creating instant Copy-on-Write Clone /mnt/zfs-clone-dev based on the snapshot index.`, 'warning');
    addLog(`SUCCESS: Clone created and mounted in 12 milliseconds! Only diverged data blocks will consume additional storage.`, 'success');
  };

  // Calculate tiering savings
  const calculateTiering = () => {
    const SSD_COST_PER_GB = 0.13; // $0.13/GB
    const HDD_COST_PER_GB = 0.013; // $0.013/GB (ONTAP capacity or HDD)
    
    const totalSsdCost = totalDataGb * SSD_COST_PER_GB;
    
    const ssdDataGb = totalDataGb * (1 - coldPercent / 100);
    const hddDataGb = totalDataGb * (coldPercent / 100);
    
    const tieredSsdCost = ssdDataGb * SSD_COST_PER_GB;
    const tieredHddCost = hddDataGb * HDD_COST_PER_GB;
    const totalTieredCost = tieredSsdCost + tieredHddCost;
    
    const monthlySavings = totalSsdCost - totalTieredCost;
    const yearlySavings = monthlySavings * 12;
    
    return {
      totalSsdCost: totalSsdCost.toFixed(2),
      totalTieredCost: totalTieredCost.toFixed(2),
      monthlySavings: monthlySavings.toFixed(2),
      yearlySavings: yearlySavings.toFixed(2),
    };
  };

  const costMetrics = calculateTiering();

  // Storage Advisor Questionnaire matching engine
  const handleRunAdvisor = () => {
    addLog(`Running Storage Workload Advisor Questionnaire Engine...`, 'info');
    
    let result = '';
    
    if (advisorDataType === 'object') {
      result = 'Amazon S3 & S3 Glacier: Best-suited for unstructured objects, static websites, dynamic datasets, backends, logs, and long-term regulatory cold storage tape archiving.';
    } else if (advisorDataType === 'block_db') {
      if (advisorAccess === 'hybrid') {
        result = 'AWS Storage Gateway (Volume Gateway): Cached or stored volumes bridging your on-premises servers via iSCSI block connections, replicating snapshots over dynamic TLS tunnels to EBS snapshots in the cloud.';
      } else {
        result = 'Amazon EBS & Instance Store: Dynamic EBS volumes represent high-performance persistent blocks designed for databases like RDS, while Instance Stores provide zero-cost high-speed temporary ephemeral blocks attached directly to EC2 hypervisor motherboards.';
      }
    } else if (advisorDataType === 'win_file') {
      if (advisorAccess === 'hybrid') {
        result = 'Amazon FSx File Gateway: Provides low-latency local SMB caching for your managed FSx for Windows File Server shares deployed in AWS.';
      } else {
        result = 'Amazon FSx for Windows File Server: Fully managed Windows storage running native SMB file systems, integrated seamlessly with Active Directory, DFS namespaces, and Multi-AZ replication groups.';
      }
    } else if (advisorDataType === 'linux_hpc') {
      result = 'Amazon FSx for Lustre: Designed to scale to millions of parallel IOPS and hundreds of GB/s throughput to feed high-performance GPU compute fleets. Features native automated lazy-loading and data exports with S3 buckets.';
    } else if (advisorDataType === 'multi_proto') {
      result = 'Amazon FSx for NetApp ONTAP: Enterprise-grade storage supporting multi-protocols (NFS, SMB, and block iSCSI concurrently). Features SnapMirror hybrid replication, FlexGroup scaling, and automated cold-tiering.';
    } else if (advisorDataType === 'zfs_file') {
      result = 'Amazon FSx for OpenZFS: Cloud-native Unix/Linux sharing delivering sub-millisecond latencies using SSD configurations and RAM caches, supporting instant snapshot histories and Copy-on-Write clones.';
    } else if (advisorDataType === 'linux_shared') {
      result = 'Amazon EFS (Elastic File System): Fully elastic POSIX filesystem mounting simultaneously to thousands of EC2 instances, automatically growing and shrinking from gigabytes to petabytes.';
    } else if (advisorDataType === 'tape_backup') {
      result = 'AWS Storage Gateway (Tape Gateway): Replaces physical Tape Libraries with a Virtual Tape Library (VTL) appliance, storing your local enterprise backups in secure, cost-effective S3 Glacier Vault tape archives.';
    } else if (advisorDataType === 'database') {
      result = 'AWS Databases (RDS, Aurora, DynamoDB): Structured relational databases (RDS, Aurora) for transactional tables with automated backups, or fully managed serverless NoSQL databases (DynamoDB) for scale-out applications.';
    } else if (advisorDataType === 'migration_offline') {
      result = 'AWS Snow Family (Snowcone / Snowball / Snowmobile): Ruggedized physical data migration appliances shipped directly to your local centers to ingest and transport petabytes or exabytes of offline data securely.';
    } else if (advisorDataType === 'migration_online') {
      result = 'AWS DataSync: High-speed, automated data sync agent that copies large datasets from local NAS or NFS/SMB volumes to S3, EFS, or FSx over dedicated network links with full verification checks.';
    } else if (advisorDataType === 'legacy_transfer') {
      result = 'AWS Transfer Family: Managed secure file transfers natively exposing standard SFTP, FTPS, and FTP endpoints directly linked to backend Amazon S3 or EFS volumes.';
    }
    
    setAdvisorResult(result);
    addLog(`Advisor Engine Completed. Recommending: ${result.split(':')[0]}`, 'success');
  };

  return (
    <div>
      <style>{`
        /* Scoped Files & Shared Storage styling */
        .fs-container { font-family: var(--font-sans, system-ui, sans-serif); color: var(--color-text-primary, #0f172a); }
        .fs-h { font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .fs-sub { font-size: 13px; color: var(--color-text-secondary, #475569); line-height: 1.5; margin-bottom: 14px; }
        .fs-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-tertiary, #e2e8f0); padding-bottom: 10px; }
        .fs-tb { padding: 6px 14px; border-radius: var(--border-radius-lg, 12px); border: 0.5px solid var(--color-border-secondary, #cbd5e1); font-size: 12px; cursor: pointer; background: var(--color-background-secondary, #f8fafc); color: var(--color-text-secondary, #475569); transition: all 0.15s; outline: none; }
        .fs-tb:hover { background: var(--color-background-tertiary, #f1f5f9); }
        .fs-tb.fs-on { background: #10b981; color: #fff; border-color: #10b981; font-weight: 500; }
        .fs-card { border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-lg, 12px); padding: 14px 16px; background: var(--color-background-primary, #ffffff); margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .fs-sec { font-size: 11px; font-weight: 600; color: var(--color-text-secondary, #475569); text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0 8px; }
        .fs-sec:first-child { margin-top: 0; }
        .fs-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .fs-grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .fs-row { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-md, 8px); background: var(--color-background-secondary, #f8fafc); margin-bottom: 6px; font-size: 12px; line-height: 1.45; }
        .fs-dot { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 10px; color: #fff; font-weight: 600; background: #10b981; }
        .fs-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }
        
        /* High contrast keywords matching other visualizers */
        .fs-hl-purple { background-color: #f3e8ff; color: #6b21a8; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        .fs-hl-emerald { background-color: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        .fs-hl-blue { background-color: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        .fs-hl-orange { background-color: #ffedd5; color: #c2410c; padding: 2px 6px; border-radius: 4px; font-weight: 600; }

        /* Muted parenthetical descriptions outside the highlight */
        .fs-desc-mute { color: var(--color-text-secondary); font-size: 11px; font-style: italic; opacity: 0.9; font-weight: normal; background: none; padding: 0; }

        /* Simulator controls and output */
        .fs-ctrl { background: var(--color-background-secondary, #f8fafc); border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-md, 8px); padding: 12px; }
        .fs-ctrl label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-secondary, #475569); margin-bottom: 6px; }
        .fs-ctrl select, .fs-ctrl input[type="range"] { width: 100%; padding: 6px; font-size: 12px; border: 0.5px solid var(--color-border-secondary, #cbd5e1); border-radius: 4px; background: var(--color-background-primary, #ffffff); outline: none; }
        .fs-ctrl select:focus { border-color: #10b981; }
        .fs-btnbar { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .fs-btn { font-size: 12px; padding: 6px 12px; border-radius: 6px; border: 0.5px solid var(--color-border-secondary, #cbd5e1); background: var(--color-background-primary, #ffffff); color: var(--color-text-primary, #0f172a); cursor: pointer; transition: all 0.15s; outline: none; display: inline-flex; align-items: center; gap: 4px; }
        .fs-btn:hover { background: var(--color-background-secondary, #f8fafc); }
        .fs-btn.fs-primary { background: #10b981; border-color: #10b981; color: #fff; }
        .fs-btn.fs-primary:hover { background: #059669; }
        .fs-btn.fs-danger { background: #ef4444; border-color: #ef4444; color: #fff; }
        .fs-btn.fs-danger:hover { background: #dc2626; }
        .fs-btn.fs-warning { background: #f59e0b; border-color: #f59e0b; color: #fff; }
        .fs-btn.fs-warning:hover { background: #d97706; }
        .fs-log { background: #0f172a; border-radius: var(--border-radius-md, 8px); padding: 12px; font-size: 11px; color: #cbd5e1; line-height: 1.6; min-height: 120px; max-height: 240px; overflow-y: auto; margin-top: 12px; font-family: var(--font-mono, monospace); }
        .fs-log-entry { margin-bottom: 6px; border-bottom: 0.5px dashed #334155; padding-bottom: 4px; }
        .fs-log-entry:last-child { border: none; }
        
        .fs-table { width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.4; }
        .fs-table th { background: var(--color-background-secondary, #f8fafc); border: 0.5px solid var(--color-border-tertiary, #e2e8f0); padding: 8px; text-align: left; font-weight: 600; }
        .fs-table td { border: 0.5px solid var(--color-border-tertiary, #e2e8f0); padding: 8px; }
        .fs-table tr:nth-child(even) { background: var(--color-background-secondary, #f8fafc); }
      `}</style>

      <div className="fs-container">
        {/* Title Header */}
        <div style={{ padding: '14px 16px 4px' }}>
          <div className="fs-h">📂 Shared Filesystems &amp; Amazon FSx Visualizer</div>
          <div className="fs-sub">
            Learn basic directory protocols (NFS, SMB) and deep-dive into the four Amazon FSx managed engines. Mount high-performance compute caches with Lustre, integrate corporate directories with Windows File Server, scale enterprise volumes with NetApp ONTAP, and boot sub-millisecond storage with OpenZFS.
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="fs-tabs">
          <button className={`fs-tb ${activeTab === 'overview' ? 'fs-on' : ''}`} onClick={() => setActiveTab('overview')}>📂 1) File System Basics</button>
          <button className={`fs-tb ${activeTab === 'windows' ? 'fs-on' : ''}`} onClick={() => setActiveTab('windows')}>🗄️ 2) Windows &amp; NetApp ONTAP</button>
          <button className={`fs-tb ${activeTab === 'lustre' ? 'fs-on' : ''}`} onClick={() => setActiveTab('lustre')}>🚀 3) Lustre &amp; OpenZFS</button>
          <button className={`fs-tb ${activeTab === 'hybrid' ? 'fs-on' : ''}`} onClick={() => setActiveTab('hybrid')}>🔌 4) Hybrid &amp; Migration</button>
          <button className={`fs-tb ${activeTab === 'sim' ? 'fs-on' : ''}`} onClick={() => setActiveTab('sim')}>🎮 5) Live Storage Simulator</button>
          <button className={`fs-tb ${activeTab === 'matrix' ? 'fs-on' : ''}`} onClick={() => setActiveTab('matrix')}>📊 6) Decision Advisor &amp; Matrix</button>
        </div>

        {/* Tab 1: File System Basics */}
        {activeTab === 'overview' && (
          <div>
            <div className="fs-sec">File System Fundamentals &amp; Sharing Protocols</div>
            <div className="fs-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                Before exploring managed cloud filesystems, it is essential to understand operating system shared storage mechanisms. Standard block devices (like EBS) can only mount onto one instance at a time, whereas network-based shared storage utilizes protocols to coordinate simultaneous client edits.
              </div>

              {/* Concepts Deep-Dive */}
              <div className="fs-grid2" style={{ marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#059669' }}>Local File System Internals</div>
                  
                  <div className="fs-row">
                    <div className="fs-dot">1</div>
                    <div>
                      AWS hosts <span className="fs-hl-emerald">POSIX Compliance</span> <span className="fs-desc-mute">(Portable Operating System Interface standards that govern Unix file interactions like read/write locks and owner permission checks)</span> within its Linux file storage systems. Which means dynamic server applications can execute standard Unix system calls without changing application source code.
                    </div>
                  </div>

                  <div className="fs-row">
                    <div className="fs-dot">2</div>
                    <div>
                      AWS manages <span className="fs-hl-emerald">Inodes</span> <span className="fs-desc-mute">(individual database metadata blocks that represent unique file records, indexing file sizes, permission structures, and pointing to actual disk sectors)</span> inside storage arrays. Which means directories are simply lists of file names mapped to inode pointers, keeping the logical namespace isolated from physical blocks.
                    </div>
                  </div>

                  <div className="fs-row">
                    <div className="fs-dot">3</div>
                    <div>
                      AWS coordinates <span className="fs-hl-emerald">File Locks</span> <span className="fs-desc-mute">(exclusive or shared operating system gates preventing simultaneous clients from making concurrent conflicting edits on the same byte range)</span> to maintain data integrity. Which means dynamic workloads can securely share datasets without corrupting file headers.
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#6b21a8' }}>Network Sharing Protocols</div>

                  <div className="fs-row">
                    <div className="fs-dot">4</div>
                    <div>
                      AWS provides <span className="fs-hl-purple">NFS Protocol</span> <span className="fs-desc-mute">(Network File System protocol that mounts remote directories from centralized storage servers onto Linux server clusters)</span> to support distributed computing. Which means hundreds of concurrent Linux instances can read and write to a shared home directory in parallel.
                    </div>
                  </div>

                  <div className="fs-row">
                    <div className="fs-dot">5</div>
                    <div>
                      AWS integrates <span className="fs-hl-purple">SMB Protocol</span> <span className="fs-desc-mute">(Server Message Block network sharing protocol utilized by Microsoft Windows computers to mount enterprise shared folders)</span> across active domains. Which means corporate Windows PCs and standard application servers can dynamically read, write, and secure shares using active user credentials.
                    </div>
                  </div>
                </div>
              </div>

              {/* Directory Node to Disk Sectors SVG */}
              <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff' }}>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  How POSIX Paths Map through Inode Indexes to Physical Block Storage
                </div>

                <svg width="100%" viewBox="0 0 760 160" style={{ background: '#ecfdf5', borderRadius: '6px', border: '0.5px solid #a7f3d0' }}>
                  <defs>
                    <marker id="acn-fs" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#047857" /></marker>
                  </defs>

                  {/* Client OS Level */}
                  <rect x="20" y="30" width="160" height="100" rx="6" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="100" y="46" textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">💻 Client App Level</text>
                  <rect x="35" y="65" width="130" height="25" rx="4" fill="#f0fdf4" stroke="#86efac" />
                  <text x="100" y="81" textAnchor="middle" fontSize="8" fontWeight="700" fill="#166534">Path: /var/log/app.log</text>
                  <text x="100" y="112" textAnchor="middle" fontSize="7" fill="#64748b">File System Mount Point</text>

                  {/* Inode Resolution Index */}
                  <rect x="250" y="30" width="220" height="100" rx="6" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="360" y="46" textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">⚙️ Metadata / Inode Table</text>
                  
                  {/* Inode entry box */}
                  <rect x="265" y="60" width="190" height="55" rx="4" fill="#f5f3ff" stroke="#ddd6fe" />
                  <text x="275" y="72" textAnchor="start" fontSize="8" fontWeight="700" fill="#581c87">Inode #401039 (File: app.log)</text>
                  <text x="275" y="84" textAnchor="start" fontSize="7" fill="#6d28d9">Size: 450 KB | Owner: root</text>
                  <text x="275" y="96" textAnchor="start" fontSize="7" fill="#6d28d9">Permissions: rw-r--r-- (POSIX)</text>
                  <text x="275" y="108" textAnchor="start" fontSize="7" fill="#6d28d9">Pointers: Block 55, Block 56, Block 57</text>

                  {/* Physical storage blocks */}
                  <rect x="540" y="30" width="200" height="100" rx="6" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="640" y="46" textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">🗄️ Physical Block Storage</text>

                  <rect x="555" y="60" width="50" height="25" rx="3" fill="#fef3c7" stroke="#fde68a" />
                  <text x="580" y="73" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="700" fill="#78350f">Block 55</text>

                  <rect x="615" y="60" width="50" height="25" rx="3" fill="#fef3c7" stroke="#fde68a" />
                  <text x="640" y="73" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="700" fill="#78350f">Block 56</text>

                  <rect x="675" y="60" width="50" height="25" rx="3" fill="#fef3c7" stroke="#fde68a" />
                  <text x="700" y="73" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="700" fill="#78350f">Block 57</text>

                  <text x="640" y="105" textAnchor="middle" fontSize="7" fill="#64748b">NVMe SSD Hardware Sectors</text>

                  {/* Connectors */}
                  <path d="M 180 77 L 250 77" fill="none" stroke="#047857" strokeWidth="1.5" markerEnd="url(#acn-fs)" />
                  <path d="M 470 77 L 540 77" fill="none" stroke="#047857" strokeWidth="1.5" markerEnd="url(#acn-fs)" />
                  <text x="215" y="68" textAnchor="middle" fontSize="7" fill="#047857" fontWeight="600">Mount Lookup</text>
                  <text x="505" y="68" textAnchor="middle" fontSize="7" fill="#047857" fontWeight="600">Fetch Blocks</text>
                </svg>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Windows & ONTAP */}
        {activeTab === 'windows' && (
          <div>
            <div className="fs-sec">Managed Windows Storage &amp; Enterprise NetApp ONTAP Volumes</div>
            <div className="cf-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                Amazon FSx delivers highly scalable, managed shared filesystems supporting popular legacy enterprise formats. You can mount Windows shares cleanly or leverage NetApp’s complex block/file capabilities inside AWS.
              </div>

              <div className="fs-grid2">
                {/* FSx for Windows */}
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#0284c7' }}>Amazon FSx for Windows File Server</div>
                  
                  <div className="fs-row">
                    <div className="fs-dot">A</div>
                    <div>
                      AWS provides <span className="fs-hl-blue">Active Directory Integration</span> <span className="fs-desc-mute">(managed integrations linking your shared drives with corporate Microsoft Active Directory or self-managed domains)</span> to control user privileges. Which means folders enforce standard Windows ACL file security policies automatically based on active corporate user groups.
                    </div>
                  </div>

                  <div className="fs-row">
                    <div className="fs-dot">B</div>
                    <div>
                      AWS manages <span className="fs-hl-blue">Multi-AZ Synchronous Replication</span> <span className="fs-desc-mute">(continuous block-level synchronous data mirroring between an active server and an alternative passive standby node in separate AZ subnets)</span> to shield applications from infrastructure crashes. Which means if an AZ outage occurs, traffic routes automatically to the standby node with zero data loss.
                    </div>
                  </div>

                  <div className="fs-row">
                    <div className="fs-dot">C</div>
                    <div>
                      AWS utilizes <span className="fs-hl-blue">Data Deduplication</span> <span className="fs-desc-mute">(an automated background compression filter that identifies and deletes redundant duplicate sectors to optimize storage blocks)</span> to lower bills. Which means you can save up to 50%+ on storage costs for corporate documents and user file folders.
                    </div>
                  </div>
                </div>

                {/* FSx for NetApp ONTAP */}
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#6b21a8' }}>Amazon FSx for NetApp ONTAP</div>

                  <div className="fs-row">
                    <div className="fs-dot">A</div>
                    <div>
                      AWS integrates <span className="fs-hl-purple">Multi-Protocol Volumes</span> <span className="fs-desc-mute">(unified enterprise storage hosting NFS, SMB, and high-performance block iSCSI pipelines simultaneously under the same storage system)</span> for complex software architectures. Which means Linux servers and Windows PCs can share data blocks concurrently.
                    </div>
                  </div>

                  <div className="fs-row">
                    <div className="fs-dot">B</div>
                    <div>
                      AWS implements <span className="fs-hl-purple">ONTAP Capacity Pool Tiering</span> <span className="fs-desc-mute">(automated tiering rules shifting raw block pools between active SSD levels and cheap, scale-out capacity pools based on file access patterns)</span> to optimize billing structures. Which means cold historical files are compressed and offloaded dynamically, saving up to 90% in costs.
                    </div>
                  </div>

                  <div className="fs-row">
                    <div className="fs-dot">C</div>
                    <div>
                      AWS configures <span className="fs-hl-purple">NetApp SnapMirror</span> <span className="fs-desc-mute">(managed block-level replication pipelines designed to sync backup snaps instantly across distinct AWS regions or local private datacenters)</span> to handle disaster recovery. Which means you can easily mirror and coordinate files across hybrid local/cloud setups.
                    </div>
                  </div>
                </div>
              </div>

              {/* Windows Multi-AZ SVG */}
              <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff', marginTop: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  FSx for Windows File Server (Active/Passive Multi-AZ Synchronous Replication)
                </div>

                <svg width="100%" viewBox="0 0 760 180" style={{ background: '#f0f9ff', borderRadius: '6px', border: '0.5px solid #bae6fd' }}>
                  <defs>
                    <marker id="acn-blue-fs" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#0284c7" /></marker>
                    <marker id="acn-green-fs" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                  </defs>

                  {/* VPC boundary */}
                  <rect x="15" y="10" width="730" height="160" rx="8" fill="none" stroke="#94a3b8" strokeDasharray="3,3" />
                  <text x="380" y="22" textAnchor="middle" fontSize="9" fontWeight="600" fill="#64748b">VPC (Virtual Private Cloud)</text>

                  {/* Subnet A */}
                  <rect x="25" y="35" width="220" height="120" rx="6" fill="#ffffff" stroke="#bae6fd" />
                  <text x="135" y="48" textAnchor="middle" fontSize="9" fontWeight="600" fill="#0369a1">Availability Zone a (AZ-a)</text>
                  <rect x="40" y="65" width="190" height="70" rx="4" fill="#eff6ff" stroke="#3b82f6" />
                  <text x="135" y="80" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1d4ed8">🖥️ Primary Active Node</text>
                  <text x="135" y="95" textAnchor="middle" fontSize="7" fill="#1e40af">SSD Storage Share | Active DNS Target</text>
                  <text x="135" y="115" textAnchor="middle" fontSize="8" fill="#1e40af"><b>STATUS: Normal</b></text>

                  {/* Subnet B */}
                  <rect x="515" y="35" width="220" height="120" rx="6" fill="#ffffff" stroke="#bae6fd" />
                  <text x="625" y="48" textAnchor="middle" fontSize="9" fontWeight="600" fill="#0369a1">Availability Zone b (AZ-b)</text>
                  <rect x="530" y="65" width="190" height="70" rx="4" fill="#f8fafc" stroke="#64748b" />
                  <text x="625" y="80" textAnchor="middle" fontSize="9" fontWeight="700" fill="#475569">🛡️ Standby Passive Node</text>
                  <text x="625" y="95" textAnchor="middle" fontSize="7" fill="#475569">Standby disk volume | DNS standby target</text>
                  <text x="625" y="115" textAnchor="middle" fontSize="8" fill="#475569"><b>STATUS: Idle Replica</b></text>

                  {/* Client / VPC Router */}
                  <rect x="300" y="65" width="160" height="70" rx="6" fill="#f0fdf4" stroke="#86efac" />
                  <text x="380" y="80" textAnchor="middle" fontSize="10" fontWeight="700" fill="#166534">🏢 Client Workspace</text>
                  <text x="380" y="95" textAnchor="middle" fontSize="7" fill="#15803d">Targeting: \\fsx-win-corp\share</text>
                  <text x="380" y="115" textAnchor="middle" fontSize="8" fill="#15803d">SMB v3 Connection</text>

                  {/* Connections */}
                  {/* Client -> Primary */}
                  <path d="M 300 90 L 235 90" fill="none" stroke="#0284c7" strokeWidth="1.5" markerEnd="url(#acn-blue-fs)" />
                  {/* Synchronous Replication line */}
                  <path d="M 135 135 L 135 160 L 625 160 L 625 135" fill="none" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#acn-green-fs)" />
                  <text x="380" y="155" textAnchor="middle" fontSize="8" fill="#15803d" fontWeight="600">Continuous Block Synchronous Mirroring 🔄</text>
                </svg>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Lustre & OpenZFS */}
        {activeTab === 'lustre' && (
          <div>
            <div className="fs-sec">HPC Caching with Lustre &amp; Sub-millisecond OpenZFS Clones</div>
            <div className="cf-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                Lustre coordinates parallel processing across massive compute fleets (like SageMaker or GPU fleets) for high-performance computing (HPC) tasks. OpenZFS provides cloud-native ZFS environments delivering sub-millisecond latencies for active software development sandboxes.
              </div>

              <div className="fs-grid2">
                {/* FSx for Lustre */}
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#c2410c' }}>Amazon FSx for Lustre (HPC Engine)</div>
                  
                  <div className="fs-row">
                    <div className="fs-dot">1</div>
                    <div>
                      AWS manages <span className="fs-hl-orange">HPC Parallel Storage</span> <span className="fs-desc-mute">(coordinated multi-server architectures dividing data blocks across multiple metadata and data servers to feed parallel compute clients)</span> to drive machine learning. Which means client GPU instances read in parallel, delivering millions of IOPS and hundreds of GB/s bandwidth.
                    </div>
                  </div>

                  <div className="fs-row">
                    <div className="fs-dot">2</div>
                    <div>
                      AWS implements <span className="fs-hl-orange">S3 Lazy-Loading</span> <span className="fs-desc-mute">(an automated repository link that instantly syncs S3 file lists as local metadata, downloading the actual raw file contents from S3 only when requested)</span> to accelerate initialization. Which means you can start complex models instantly without waiting hours to copy datasets.
                    </div>
                  </div>

                  <div className="fs-row">
                    <div className="fs-dot">3</div>
                    <div>
                      AWS provides <span className="fs-hl-orange">Lustre Scratch Deployment</span> <span className="fs-desc-mute">(high-speed ephemeral storage configurations (Scratch 1 / Scratch 2) without background cluster data replication)</span> for short-term tasks. Which means you get maximum performance at the lowest billing rate, ideal for temporary compute pipelines.
                    </div>
                  </div>
                </div>

                {/* FSx for OpenZFS */}
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#059669' }}>Amazon FSx for OpenZFS (Cloud ZFS)</div>

                  <div className="fs-row">
                    <div className="fs-dot">1</div>
                    <div>
                      AWS manages <span className="fs-hl-emerald">ZFS Copy-on-Write Clones</span> <span className="fs-desc-mute">(instant file system copies spawned in milliseconds based on ZFS snapshot indexes without duplicating block data)</span> for developer sandboxes. Which means you can create multiple test instances instantly without storage replication costs.
                    </div>
                  </div>

                  <div className="fs-row">
                    <div className="fs-dot">2</div>
                    <div>
                      AWS delivers <span className="fs-hl-emerald">Sub-millisecond Latencies</span> <span className="fs-desc-mute">(extreme low-latency configurations leveraging dynamic RAM caching and managed NVMe drives)</span> for database workloads. Which means read/write systems like SQL, PostgreSQL, or transactional backends experience speed performance similar to local SSD arrays.
                    </div>
                  </div>

                  <div className="fs-row">
                    <div className="fs-dot">3</div>
                    <div>
                      AWS configures <span className="fs-hl-emerald">Inline ZFS Compression</span> <span className="fs-desc-mute">(automated LZ4/ZSTD block-level compression executed inside hypervisor RAM on active writes)</span> to reduce physical disk usage. Which means database files use up to 40% less storage space with zero performance impacts.
                    </div>
                  </div>
                </div>
              </div>

              {/* FSx for Lustre Parallel S3 Sync SVG */}
              <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff', marginTop: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  FSx for Lustre High-Performance Computing (HPC) &amp; S3 Lazy-Loading Pipeline
                </div>

                <svg width="100%" viewBox="0 0 760 180" style={{ background: '#fff7ed', borderRadius: '6px', border: '0.5px solid #fed7aa' }}>
                  <defs>
                    <marker id="acn-orange-fs" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#c2410c" /></marker>
                    <marker id="acn-green-lustre" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                  </defs>

                  {/* S3 Bucket Data Repository */}
                  <rect x="25" y="45" width="130" height="90" rx="8" fill="#ecfdf5" stroke="#a7f3d0" />
                  <text x="90" y="65" textAnchor="middle" fontSize="10" fontWeight="700" fill="#047857">🪣 Amazon S3</text>
                  <text x="90" y="85" textAnchor="middle" fontSize="7" fill="#065f46">Master Dataset (10 TB)</text>
                  <text x="90" y="105" textAnchor="middle" fontSize="8" fill="#047857" fontWeight="600">S3 Source Repository</text>

                  {/* FSx for Lustre Parallel Filesystem */}
                  <rect x="250" y="35" width="260" height="110" rx="8" fill="#ffffff" stroke="#fed7aa" />
                  <text x="380" y="48" textAnchor="middle" fontSize="9" fontWeight="700" fill="#c2410c">🚀 Amazon FSx for Lustre Cluster</text>
                  
                  {/* Metadata and Storage targets */}
                  <rect x="265" y="65" width="100" height="60" rx="4" fill="#fff7ed" stroke="#fdba74" />
                  <text x="315" y="80" textAnchor="middle" fontSize="8" fontWeight="700" fill="#c2410c">Metadata Server</text>
                  <text x="315" y="95" textAnchor="middle" fontSize="6" fill="#ea580c">Indices &amp; File Paths</text>
                  <text x="315" y="110" textAnchor="middle" fontSize="6" fill="#ea580c">Index Sync: Active</text>

                  <rect x="390" y="65" width="100" height="60" rx="4" fill="#fff7ed" stroke="#fdba74" />
                  <text x="440" y="80" textAnchor="middle" fontSize="8" fontWeight="700" fill="#c2410c">Storage Targets</text>
                  <text x="440" y="95" textAnchor="middle" fontSize="6" fill="#ea580c">Parallel Data Striping</text>
                  <text x="440" y="110" textAnchor="middle" fontSize="7" fill="#ea580c"><b>NVMe Disk Arrays</b></text>

                  {/* GPU EC2 Instances parallel read */}
                  <rect x="600" y="45" width="130" height="90" rx="8" fill="#eff6ff" stroke="#bfdbfe" />
                  <text x="665" y="65" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1e40af">🖥️ HPC GPU Fleet</text>
                  <text x="665" y="85" textAnchor="middle" fontSize="7" fill="#2563eb">PyTorch / ML Training</text>
                  <text x="665" y="105" textAnchor="middle" fontSize="8" fill="#1e40af" fontWeight="600">Parallel Read/Writes</text>

                  {/* Connections */}
                  {/* S3 -> Lustre Lazy load on-demand */}
                  <path d="M 155 90 L 250 90" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#acn-green-lustre)" />
                  <text x="202" y="76" textAnchor="middle" fontSize="7" fill="#047857" fontWeight="600">Lazy Load 🟢</text>
                  <text x="202" y="84" textAnchor="middle" fontSize="6" fill="#047857">(Block stream)</text>

                  {/* Lustre -> GPU parallel */}
                  <path d="M 510 90 L 600 90" fill="none" stroke="#c2410c" strokeWidth="2" markerEnd="url(#acn-orange-fs)" />
                  <text x="555" y="78" textAnchor="middle" fontSize="8" fill="#c2410c" fontWeight="600">50+ GB/s ⚡</text>
                </svg>
              </div>

            </div>
          </div>
        )}


        {/* Tab 4: Hybrid Storage & Migration */}
        {activeTab === 'hybrid' && (
          <div>
            <div className="fs-sec">AWS Hybrid Storage Gateway, DataSync, and Secure Migration Pipelines</div>
            <div className="cf-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                AWS provides specialized services to bridge local datacenters with public cloud infrastructure. You can deploy local virtual gateway appliances to cache cloud storage on-premises, sync large directories over networks automatically, or expose secure SFTP entry points directly to cloud backends.
              </div>

              {/* AWS Storage Gateways deep dive splits */}
              <div className="fs-grid2" style={{ marginBottom: '14px' }}>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#c2410c' }}>Managed AWS Storage Gateway Engines</div>

                  <div className="fs-row">
                    <div className="fs-dot">1</div>
                    <div>
                      AWS provides <span className="fs-hl-orange">Amazon S3 File Gateway</span> <span className="fs-desc-mute">(a virtual software appliance bridging standard NFS/SMB file mounts directly to S3 objects, caching active hot files locally while offloading cold files to the cloud)</span> to secure hybrid storage. Which means local software can read and write files over local networks at SSD speeds while S3 serves as the low-cost infinite backend.
                    </div>
                  </div>

                  <div className="fs-row">
                    <div className="fs-dot">2</div>
                    <div>
                      AWS provides <span className="fs-hl-orange">Amazon FSx File Gateway</span> <span className="fs-desc-mute">(a Windows-optimized virtual gateway providing low-latency local SMB caching for managed FSx for Windows File Server shares)</span> to accelerate remote offices. Which means branch locations access centralized Active Directory drives instantly without saturating wan links.
                    </div>
                  </div>

                  <div className="fs-row">
                    <div className="fs-dot">3</div>
                    <div>
                      AWS manages <span className="fs-hl-orange">Volume Gateway</span> <span className="fs-desc-mute">(a block-based storage interface presenting virtual disk drives to local servers via iSCSI, mirror-syncing snapshots to cloud EBS volumes)</span> in two modes: <span className="fs-hl-orange">Cached Volumes</span> <span className="fs-desc-mute">(storing active hot blocks locally, letting S3 host primary data)</span> and <span className="fs-hl-orange">Stored Volumes</span> <span className="fs-desc-mute">(storing full datasets locally, mirroring asynchronous backup snapshots to AWS)</span>.
                    </div>
                  </div>

                  <div className="fs-row">
                    <div className="fs-dot">4</div>
                    <div>
                      AWS configures <span className="fs-hl-orange">Tape Gateway</span> <span className="fs-desc-mute">(a virtual tape library software VTL gateway that maps standard physical tape backup software slots directly to virtual cartridges backed by Glacier)</span> to replace physical tape vaults. Which means you preserve existing backup software configurations while shifting archive cassettes to cheap tape clouds.
                    </div>
                  </div>
                </div>

                {/* Data Migration & Transfer Family */}
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#4f46e5' }}>Data Sync &amp; Migration Tunnels</div>

                  <div className="fs-row">
                    <div className="fs-dot">A</div>
                    <div>
                      AWS provides <span className="fs-hl-purple">AWS DataSync</span> <span className="fs-desc-mute">(a highly optimized, automated data migration service that synchronizes massive datasets between local storage or object stores and S3/EFS/FSx over networks)</span> to automate cloud onboarding. Which means you can schedule secure, multithreaded network copies with automatic validation checks without writing scripts.
                    </div>
                  </div>

                  <div className="fs-row">
                    <div className="fs-dot">B</div>
                    <div>
                      AWS manages <span className="fs-hl-purple">AWS Transfer Family</span> <span className="fs-desc-mute">(a fully managed secure transfer server that natively exposes SFTP, FTPS, and FTP endpoints directly pointing to backend S3 or EFS volumes)</span> for business partner integrations. Which means you replace legacy legacy transfer servers while retaining standard file upload workflows for client computers.
                    </div>
                  </div>

                  <div className="fs-row">
                    <div className="fs-dot">C</div>
                    <div>
                      AWS ships <span className="fs-hl-purple">AWS Snow Family</span> <span className="fs-desc-mute">(rugged physical storage and edge computing hardware devices (Snowcone, Snowball, Snowmobile) shipped directly to offices to collect and import exabyte datasets offline)</span> to solve bandwidth bottlenecks. Which means you can securely import massive quantities of cold server logs or archives by shipping physical hardware boxes.
                    </div>
                  </div>
                </div>
              </div>

              {/* Hybrid Storage Gateway SVG Architecture */}
              <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff', marginBottom: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  AWS Storage Gateway Hybrid Network Topology (On-Premises to Cloud)
                </div>

                <svg width="100%" viewBox="0 0 760 220" style={{ background: '#f8fafc', borderRadius: '6px', border: '0.5px solid #cbd5e1' }}>
                  <defs>
                    <marker id="acn-hybrid" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#c2410c" /></marker>
                    <marker id="acn-cloud" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#0284c7" /></marker>
                  </defs>

                  {/* On-Premises Boundary */}
                  <rect x="15" y="30" width="230" height="170" rx="8" fill="#ffffff" stroke="#94a3b8" />
                  <text x="130" y="46" textAnchor="middle" fontSize="10" fontWeight="700" fill="#475569">🏢 Corporate Local Data Center</text>

                  {/* Local Server */}
                  <rect x="25" y="65" width="90" height="50" rx="4" fill="#f1f5f9" stroke="#cbd5e1" />
                  <text x="70" y="85" textAnchor="middle" fontSize="8" fontWeight="700" fill="#334155">Local Application</text>
                  <text x="70" y="98" textAnchor="middle" fontSize="7" fill="#64748b">NFS / SMB / iSCSI</text>

                  {/* Gateway VM Appliance */}
                  <rect x="140" y="65" width="90" height="90" rx="6" fill="#fff7ed" stroke="#fdba74" />
                  <text x="185" y="85" textAnchor="middle" fontSize="8" fontWeight="700" fill="#c2410c">Storage Gateway</text>
                  <text x="185" y="98" textAnchor="middle" fontSize="8" fontWeight="700" fill="#ea580c">VM Appliance</text>
                  <rect x="150" y="115" width="70" height="25" rx="3" fill="#ffedd5" stroke="#fed7aa" />
                  <text x="185" y="130" textAnchor="middle" fontSize="7" fontWeight="700" fill="#ea580c">💾 Hot SSD Cache</text>

                  {/* Network Tunnel */}
                  <rect x="270" y="75" width="180" height="50" rx="4" fill="#eff6ff" stroke="#bfdbfe" />
                  <text x="360" y="95" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1d4ed8">VPN / Direct Connect Tunnel</text>
                  <text x="360" y="110" textAnchor="middle" fontSize="7" fill="#2563eb">Secure HTTPS / TLS 1.3 Encryption</text>

                  {/* AWS Cloud Boundary */}
                  <rect x="475" y="30" width="265" height="170" rx="8" fill="#ffffff" stroke="#0284c7" />
                  <text x="607" y="46" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0284c7">☁️ AWS Cloud Infrastructure</text>

                  {/* Cloud Target S3 File */}
                  <rect x="490" y="60" width="110" height="40" rx="4" fill="#ecfdf5" stroke="#a7f3d0" />
                  <text x="545" y="78" textAnchor="middle" fontSize="8" fontWeight="700" fill="#047857">🪣 Amazon S3</text>
                  <text x="545" y="90" textAnchor="middle" fontSize="7" fill="#059669">Object Caches (File GW)</text>

                  {/* Cloud Target EBS Snap */}
                  <rect x="615" y="60" width="110" height="40" rx="4" fill="#f0f9ff" stroke="#bae6fd" />
                  <text x="670" y="78" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0369a1">💾 EBS Snapshots</text>
                  <text x="670" y="90" textAnchor="middle" fontSize="7" fill="#0284c7">Block Backups (Volume GW)</text>

                  {/* Cloud Target Glacier Vault */}
                  <rect x="550" y="125" width="115" height="45" rx="4" fill="#faf5ff" stroke="#e9d5ff" />
                  <text x="607" y="142" textAnchor="middle" fontSize="8" fontWeight="700" fill="#6b21a8">📼 S3 Glacier Vault</text>
                  <text x="607" y="155" textAnchor="middle" fontSize="7" fill="#7c3aed">Virtual Tape VTL (Tape GW)</text>

                  {/* Connectors */}
                  {/* Local App -> Gateway VM */}
                  <path d="M 115 90 L 140 90" fill="none" stroke="#c2410c" strokeWidth="1.5" markerEnd="url(#acn-hybrid)" />
                  {/* Gateway VM -> Tunnel */}
                  <path d="M 230 110 L 270 110" fill="none" stroke="#1d4ed8" strokeWidth="1.5" markerEnd="url(#acn-cloud)" />
                  {/* Tunnel -> Cloud targets */}
                  <path d="M 450 100 L 490 80" fill="none" stroke="#0284c7" strokeWidth="1.5" markerEnd="url(#acn-cloud)" />
                  <path d="M 450 100 L 615 80" fill="none" stroke="#0284c7" strokeWidth="1.5" markerEnd="url(#acn-cloud)" />
                  <path d="M 450 100 L 550 142" fill="none" stroke="#0284c7" strokeWidth="1.5" markerEnd="url(#acn-cloud)" />
                </svg>
              </div>

            </div>
          </div>
        )}

        {/* Tab 5: Simulator */}
        {activeTab === 'sim' && (
          <div>
            <div className="fs-sec">Live Interactive Storage Scenario &amp; Infrastructure Simulator</div>
            
            {/* Quick action bar */}
            <div className="cf-card" style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', background: '#ecfdf5', borderColor: '#a7f3d0' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '12px', color: '#065f46' }}>💡 Dynamic Workspace Interactive Controls:</span>
                <span style={{ fontSize: '11px', color: '#047857', marginLeft: '6px' }}>
                  {activeScenario === 'windows_multiaz' && `Active AZ: ${azFailed ? 'Availability Zone b (AZ-b standby promoted) 🔴' : 'Availability Zone a (AZ-a primary) 🟢'}`}
                  {activeScenario === 'lustre_ml' && `Lustre Cache: ${lazyLoaded ? 'Warm (Data residing in Lustre NVMe) 🔥' : 'Empty (Reads will lazy-load from S3) ❄️'}`}
                  {activeScenario === 'zfs_dev' && `ZFS State: ${clonedZfs ? 'Copy-on-Write Cloned dataset active 🚀' : 'Primary Production dataset active 📁'}`}
                  {activeScenario === 'ontap_enterprise' && `Replication: NetApp SnapMirror Block Sync running successfully 🔄`}
                  {activeScenario === 'gateway_hybrid' && `Gateway Cache State: Local cached disk holding 100% of hot blocks locally 💾`}
                  {activeScenario === 'datasync_migration' && `DataSync Task: Prepared to sync 100 TB local files over ${datasyncBandwidth} Mbps network link ⚡`}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {activeScenario === 'windows_multiaz' && (
                  <button className="fs-btn fs-danger" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleTriggerFailover}>
                    ⚠️ Trigger AZ Outage / Failover
                  </button>
                )}
                {activeScenario === 'zfs_dev' && (
                  <button className="fs-btn fs-primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleTriggerZfsClone}>
                    📂 Spawn Instant Snapshot Clone
                  </button>
                )}
                {activeScenario === 'lustre_ml' && lazyLoaded && (
                  <button className="fs-btn fs-warning" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => { setLazyLoaded(false); addLog('Wiped Lustre local NVMe cache targets. Next reads will fetch from S3 Sourced buckets.', 'warning'); }}>
                    ❄️ Flush Lustre Cache
                  </button>
                )}
              </div>
            </div>

            <div className="fs-grid2">
              {/* Controls Column */}
              <div>
                <div className="fs-sec">Select Storage Workload Scenario</div>
                <div className="fs-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* Scenario selection */}
                  <div className="fs-ctrl">
                    <label>1. Select Workload Pipeline Scenario</label>
                    <select 
                      value={activeScenario} 
                      onChange={(e) => { 
                        setActiveScenario(e.target.value as ScenarioType); 
                        setSimStep(0); 
                        setClonedZfs(false); 
                        setLazyLoaded(false); 
                        setAzFailed(false);
                        addLog(`Swapped scenario to: ${e.target.value.toUpperCase()}. Ready to trace.`, 'info');
                      }}
                    >
                      <option value="windows_multiaz">Corporate Active Directory File Share (Windows Multi-AZ)</option>
                      <option value="lustre_ml">HPC Machine Learning / Parallel Training (FSx for Lustre)</option>
                      <option value="zfs_dev">Ultra Low-Latency Database Sandbox (FSx for OpenZFS Clones)</option>
                      <option value="ontap_enterprise">Enterprise Multi-Protocol SAP Database (NetApp ONTAP)</option>
                      <option value="gateway_hybrid">Hybrid S3 Storage Gateway mount (Cached S3 shares)</option>
                      <option value="datasync_migration">Large-Scale 100 TB Active Data Migration (AWS DataSync)</option>
                    </select>
                  </div>

                  {/* Bandwidth slider if DataSync is active */}
                  {activeScenario === 'datasync_migration' && (
                    <div className="fs-ctrl">
                      <label>Adjust DataSync Bandwidth Limit: <strong>{datasyncBandwidth} Mbps</strong></label>
                      <input 
                        type="range" 
                        min="100" 
                        max="10000" 
                        step="100" 
                        value={datasyncBandwidth} 
                        onChange={(e) => setDatasyncBandwidth(parseInt(e.target.value))} 
                      />
                      <div className="fs-mono" style={{ fontSize: '9px', color: '#64748b', marginTop: '4px' }}>
                        *Estimated copy duration: {(100000000 / (datasyncBandwidth * 3600)).toFixed(1)} Hours
                      </div>
                    </div>
                  )}

                  {/* Dynamic description of scenario */}
                  <div style={{ background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '6px', padding: '10px', fontSize: '11px', lineHeight: '1.45' }}>
                    {activeScenario === 'windows_multiaz' && (
                      <div>
                        <strong>Infrastructure Details:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '14px' }}>
                          <li>Protocol: SMB v3 | AD integration activated.</li>
                          <li>Storage tier: HDD or SSD options (10 GB/s throughput max).</li>
                          <li>Failover capability: Fully automated active/passive synchronous replication.</li>
                        </ul>
                      </div>
                    )}
                    {activeScenario === 'lustre_ml' && (
                      <div>
                        <strong>Infrastructure Details:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '14px' }}>
                          <li>Protocol: High-Performance parallel Lustre client.</li>
                          <li>S3 Integration: Active S3 Repository link with lazy-loading streaming.</li>
                          <li>Speed characteristics: Striped disks yielding up to hundreds of GB/s bandwidth.</li>
                        </ul>
                      </div>
                    )}
                    {activeScenario === 'zfs_dev' && (
                      <div>
                        <strong>Infrastructure Details:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '14px' }}>
                          <li>Protocol: NFS v3 / NFS v4 / SMB | Managed OpenZFS engine.</li>
                          <li>Clone capability: Spawns dataset clones instantly via ZFS snapshot indices.</li>
                          <li>Speed: Sub-millisecond latency (typically &lt; 0.5ms) using RAM caching layers.</li>
                        </ul>
                      </div>
                    )}
                    {activeScenario === 'ontap_enterprise' && (
                      <div>
                        <strong>Infrastructure Details:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '14px' }}>
                          <li>Protocol: Multi-protocol (mounts NFS, SMB, and iSCSI blocks concurrently).</li>
                          <li>Storage optimization: Auto-tiering shifting blocks to capacity pools.</li>
                          <li>Data Protection: Continuous SnapMirror block synchronization.</li>
                        </ul>
                      </div>
                    )}
                    {activeScenario === 'gateway_hybrid' && (
                      <div>
                        <strong>Infrastructure Details:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '14px' }}>
                          <li>Protocol: NFS / SMB | Local Storage Gateway appliance VM.</li>
                          <li>Data Protection: Automatic background uploads to Amazon S3.</li>
                          <li>Caching efficiency: Hot files retained on local disk cache for &lt; 1ms reads.</li>
                        </ul>
                      </div>
                    )}
                    {activeScenario === 'datasync_migration' && (
                      <div>
                        <strong>Infrastructure Details:</strong>
                        <ul style={{ margin: '4px 0 0 0', paddingLeft: '14px' }}>
                          <li>Migration Target: local server network NAS to Amazon S3.</li>
                          <li>Data integrity: Auto-verification scans using SHA-256 checks.</li>
                          <li>Performance: High-speed multithreaded network transfer acceleration.</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="fs-btnbar">
                    <button 
                      className="fs-btn fs-primary" 
                      style={{ flex: 1, padding: '10px', fontWeight: 600 }}
                      onClick={handleSimulateTraffic}
                      disabled={isSimulating}
                    >
                      {isSimulating ? '⌛ Streaming Storage Blocks...' : '🚀 Simulate Workload Traffic'}
                    </button>
                  </div>

                </div>
              </div>

              {/* Simulation Visualiser Column */}
              <div>
                <div className="fs-sec">Active Infrastructure Pipeline SVG</div>
                <div className="fs-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  
                  {/* Dynamic SVG tracing paths */}
                  <svg width="100%" height="200" viewBox="0 0 480 200" style={{ background: '#f8fafc', borderRadius: '8px', border: '0.5px solid #cbd5e1' }}>
                    {/* Client / User Node */}
                    <circle cx="50" cy="100" r="18" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
                    <text x="50" y="100" textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#fff" fontWeight="700">
                      {activeScenario === 'windows_multiaz' ? 'SMB' : activeScenario === 'lustre_ml' ? 'GPU' : activeScenario === 'zfs_dev' ? 'DEV' : activeScenario === 'gateway_hybrid' ? 'NFS' : activeScenario === 'datasync_migration' ? 'NAS' : 'SAP'}
                    </text>
                    <text x="50" y="130" textAnchor="middle" fontSize="8" fill="#475569">
                      {activeScenario === 'gateway_hybrid' ? 'Local Server' : activeScenario === 'datasync_migration' ? 'Source Storage' : 'Client / Compute'}
                    </text>

                    {/* Intermediate Layer / Router / Active AD / Lustre MD */}
                    <rect x="140" y="70" width="80" height="60" rx="4" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
                    <text x="180" y="90" textAnchor="middle" fontSize="8" fontWeight="700" fill="#475569">
                      {activeScenario === 'windows_multiaz' ? 'Managed AD' : activeScenario === 'lustre_ml' ? 'Lustre MD' : activeScenario === 'zfs_dev' ? 'ZFS RAM Cache' : activeScenario === 'gateway_hybrid' ? 'Gateway Appliance' : activeScenario === 'datasync_migration' ? 'DataSync Agent' : 'ONTAP Flex'}
                    </text>
                    <text x="180" y="105" textAnchor="middle" fontSize="7" fill="#64748b">
                      {simStep >= 2 ? 'Active 🟢' : 'Idle'}
                    </text>

                    {/* Storage Primary Volume */}
                    <rect x="270" y="65" width="75" height="70" rx="6" fill={simStep >= 3 ? '#ecfdf5' : '#ffffff'} stroke={simStep >= 3 ? '#10b981' : '#cbd5e1'} strokeWidth="1.5" />
                    <text x="307" y="85" textAnchor="middle" fontSize="8" fontWeight="700" fill={simStep >= 3 ? '#047857' : '#475569'}>
                      {activeScenario === 'windows_multiaz' ? (azFailed ? 'AZ-b Primary' : 'AZ-a Primary') : activeScenario === 'lustre_ml' ? 'Lustre NVMe' : activeScenario === 'zfs_dev' ? 'OpenZFS SSD' : activeScenario === 'gateway_hybrid' ? 'Local Cache' : activeScenario === 'datasync_migration' ? 'Cloud Target' : 'ONTAP Volume'}
                    </text>
                    <text x="307" y="100" textAnchor="middle" fontSize="7" fill={simStep >= 3 ? '#047857' : '#64748b'}>
                      {simStep >= 3 ? 'Active I/O ⚡' : 'Mountable'}
                    </text>
                    <text x="307" y="115" textAnchor="middle" fontSize="7" fill="#64748b">
                      {activeScenario === 'zfs_dev' && clonedZfs ? 'Clone Dataset' : activeScenario === 'gateway_hybrid' ? 'SSD Disk' : activeScenario === 'datasync_migration' ? 'Amazon S3' : 'Primary Tier'}
                    </text>

                    {/* Storage Secondary Volume / Replication / S3 Target */}
                    <rect x="390" y="65" width="75" height="70" rx="6" fill={simStep >= 4 ? '#fffbeb' : '#ffffff'} stroke={simStep >= 4 ? '#d97706' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray={activeScenario === 'lustre_ml' || activeScenario === 'gateway_hybrid' ? '' : '3,3'} />
                    <text x="427" y="85" textAnchor="middle" fontSize="8" fontWeight="700" fill={simStep >= 4 ? '#b45309' : '#475569'}>
                      {activeScenario === 'windows_multiaz' ? 'AZ-b Standby' : activeScenario === 'lustre_ml' ? 'Amazon S3' : activeScenario === 'zfs_dev' ? 'Prod Source' : activeScenario === 'gateway_hybrid' ? 'Amazon S3' : activeScenario === 'datasync_migration' ? 'EFS Archive' : 'SnapMirror'}
                    </text>
                    <text x="427" y="100" textAnchor="middle" fontSize="7" fill={simStep >= 4 ? '#b45309' : '#64748b'}>
                      {activeScenario === 'lustre_ml' && lazyLoaded ? 'Sync Warm' : activeScenario === 'windows_multiaz' && azFailed ? 'Offline ❌' : 'Sync Active'}
                    </text>
                    <text x="427" y="115" textAnchor="middle" fontSize="7" fill="#64748b">
                      {activeScenario === 'lustre_ml' || activeScenario === 'gateway_hybrid' ? 'Data Repo' : 'Backup Replica'}
                    </text>

                    {/* Connector lines */}
                    {/* Client to Router */}
                    <path d="M 68 100 L 140 100" fill="none" stroke={simStep >= 1 ? '#3b82f6' : '#cbd5e1'} strokeWidth="1.5" />
                    {/* Router to Primary */}
                    <path d="M 220 100 L 270 100" fill="none" stroke={simStep >= 2 ? '#3b82f6' : '#cbd5e1'} strokeWidth="1.5" />
                    {/* Primary to Secondary */}
                    <path d="M 345 100 L 390 100" fill="none" stroke={simStep >= 3 ? '#10b981' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray={activeScenario === 'lustre_ml' || activeScenario === 'gateway_hybrid' ? '3,2' : ''} />

                    {/* Packet Animation Dot */}
                    {isSimulating && (
                      <circle r="4" fill="#f59e0b">
                        <animateMotion 
                          dur="1.5s" 
                          repeatCount="indefinite" 
                          path={
                            simStep === 1 ? 'M 50 100 L 140 100' :
                            simStep === 2 ? 'M 140 100 L 270 100' :
                            simStep === 3 ? 'M 270 100 L 307 100' :
                            simStep === 4 ? (activeScenario === 'lustre_ml' && !lazyLoaded ? 'M 427 100 L 307 100' : 'M 307 100 L 427 100') : 'M 50 100 L 140 100'
                          } 
                        />
                      </circle>
                    )}
                  </svg>

                  {/* KPI Meters */}
                  <div style={{ width: '100%', marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                      <span>Workload Operational KPIs:</span>
                    </div>
                    <div className="fs-grid3" style={{ gap: '6px' }}>
                      {/* Latency Gauge */}
                      <div style={{ background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '4px', padding: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '7px', color: '#64748b', textTransform: 'uppercase' }}>Latency</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: activeScenario === 'zfs_dev' || activeScenario === 'gateway_hybrid' ? '#059669' : '#1d4ed8' }}>
                          {activeScenario === 'zfs_dev' ? '< 0.5 ms' : activeScenario === 'gateway_hybrid' ? '< 1 ms (cached)' : activeScenario === 'datasync_migration' ? '12 ms' : activeScenario === 'lustre_ml' ? '1 ms' : activeScenario === 'windows_multiaz' ? '1.5 ms' : '2.0 ms'}
                        </div>
                      </div>
                      {/* IOPS Gauge */}
                      <div style={{ background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '4px', padding: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '7px', color: '#64748b', textTransform: 'uppercase' }}>Read IOPS</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: activeScenario === 'lustre_ml' ? '#d97706' : '#1d4ed8' }}>
                          {activeScenario === 'lustre_ml' ? '150,000' : activeScenario === 'zfs_dev' ? '80,000' : activeScenario === 'datasync_migration' ? '120,000' : activeScenario === 'ontap_enterprise' ? '60,000' : '20,000'}
                        </div>
                      </div>
                      {/* Throughput Gauge */}
                      <div style={{ background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '4px', padding: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '7px', color: '#64748b', textTransform: 'uppercase' }}>Throughput</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: activeScenario === 'lustre_ml' ? '#be185d' : '#1d4ed8' }}>
                          {activeScenario === 'lustre_ml' ? '50 GB/s' : activeScenario === 'zfs_dev' ? '3.5 GB/s' : activeScenario === 'datasync_migration' ? `${(datasyncBandwidth / 8).toFixed(1)} MB/s` : activeScenario === 'ontap_enterprise' ? '4.0 GB/s' : '0.5 GB/s'}
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Scrolling trace console */}
            <div className="fs-sec">Infrastructure Pipeline Scrolling Trace Logs</div>
            <div className="fs-log">
              {simLogs.map((log, idx) => (
                <div key={idx} className="fs-log-entry">
                  <span style={{ color: '#94a3b8', marginRight: '6px' }}>[{log.timestamp}]</span>
                  <span style={{ 
                    color: log.type === 'success' ? '#4ade80' : 
                           log.type === 'warning' ? '#fbbf24' : 
                           log.type === 'error' ? '#f87171' : '#60a5fa',
                    fontWeight: log.type !== 'info' ? 700 : 'normal'
                  }}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Tab 6: Master Decision Flow & Interactive Storage Advisor */}
        {activeTab === 'matrix' && (
          <div>
            <div className="fs-sec">Interactive Storage Workload Advisor Questionnaire</div>
            <div className="fs-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                Unsure which AWS storage, database, or migration service is best suited for your workload? Complete this dynamic questionnaire, and our architectural engine will calculate the ideal storage path based on your protocol, residency, and latency requirements.
              </div>

              <div className="fs-grid3" style={{ gap: '12px', marginBottom: '14px' }}>
                {/* Selector 1: Data Type */}
                <div className="fs-ctrl">
                  <label>1. Select Primary Data Type</label>
                  <select value={advisorDataType} onChange={(e) => { setAdvisorDataType(e.target.value); setAdvisorResult(null); }}>
                    <option value="object">Unstructured Web Objects / Static Files (S3 / Glacier)</option>
                    <option value="block_db">Stateful Database Blocks (EBS / Instance Store)</option>
                    <option value="win_file">Managed Windows SMB Files (FSx Windows)</option>
                    <option value="linux_shared">Shared POSIX Linux Files (EFS)</option>
                    <option value="linux_hpc">Parallel High-Performance Lustre Files (FSx Lustre)</option>
                    <option value="multi_proto">Enterprise Multi-Protocol NFS/SMB (FSx ONTAP)</option>
                    <option value="zfs_file">Sub-millisecond Low-Latency Unix Files (FSx OpenZFS)</option>
                    <option value="tape_backup">Virtual Legacy Tape Backups (Tape Gateway)</option>
                    <option value="database">Structured Transactional Tables / NoSQL (RDS / Aurora / DynamoDB)</option>
                    <option value="migration_online">High-Speed Online Sync Migration (DataSync)</option>
                    <option value="migration_offline">Offline Petabyte Physical Migration (Snowball)</option>
                    <option value="legacy_transfer">Standard SFTP/FTPS File Transfers (Transfer Family)</option>
                  </select>
                </div>

                {/* Selector 2: Access Location */}
                <div className="fs-ctrl">
                  <label>2. Core Access Location</label>
                  <select value={advisorAccess} onChange={(e) => { setAdvisorAccess(e.target.value); setAdvisorResult(null); }}>
                    <option value="cloud">Cloud-Native (100% Hosted inside AWS Networks)</option>
                    <option value="hybrid">Hybrid Cloud (Local corporate cache + backed by AWS)</option>
                  </select>
                </div>

                {/* Selector 3: Performance Priority */}
                <div className="fs-ctrl">
                  <label>3. Core Performance Constraint</label>
                  <select value={advisorMigration} onChange={(e) => { setAdvisorMigration(e.target.value); setAdvisorResult(null); }}>
                    <option value="ultra_low">Sub-millisecond latency (&lt; 1ms speed)</option>
                    <option value="high_tps">High Concurrency (Hundreds of parallel readers)</option>
                    <option value="cost_eff">Cost Efficiency (Deep cold archives / HDD tiering)</option>
                  </select>
                </div>
              </div>

              <div className="fs-btnbar" style={{ marginBottom: '14px' }}>
                <button className="fs-btn fs-primary" style={{ width: '100%', padding: '10px', fontWeight: 600, justifyContent: 'center' }} onClick={handleRunAdvisor}>
                  🔍 Compute Storage Advisor Recommendation
                </button>
              </div>

              {/* Advisor Results Display */}
              {advisorResult && (
                <div style={{ background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '18px' }}>🎯</span>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#065f46' }}>
                      AWS Storage Advisor Architect Recommendation:
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', lineHeight: '1.6', color: '#047857' }}>
                    <strong>{advisorResult.split(':')[0]}:</strong> {advisorResult.substring(advisorResult.indexOf(':') + 1)}
                  </div>
                </div>
              )}

            </div>

            <div className="fs-sec">Master AWS Storage &amp; Database Decision Flow Matrix</div>
            <div className="fs-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                This unified matrix contrasts the performance, protocols, limits, and primary use cases across all **14 key storage, migration, and database families** to serve as a fast architectural reference.
              </div>

              {/* Comprehensive Storage Decision Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="fs-table" style={{ minWidth: '850px' }}>
                  <thead>
                    <tr>
                      <th>Service Family</th>
                      <th>💾 Access Type</th>
                      <th>🔑 Primary Protocols</th>
                      <th>⚡ Latency Spec</th>
                      <th>📦 Concurrency Limits</th>
                      <th>🎯 Best Real-World Workload Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>🪣 Amazon S3</strong></td>
                      <td>Object</td>
                      <td>HTTPS REST API</td>
                      <td>10–12 ms</td>
                      <td>Infinite Scale (100+ Petabytes)</td>
                      <td>Static website hosting, dynamic web logs, data lakes, backend assets</td>
                    </tr>
                    <tr>
                      <td><strong>📼 S3 Glacier</strong></td>
                      <td>Object (Cold Archive)</td>
                      <td>HTTPS REST API</td>
                      <td>Minutes to 12 Hrs</td>
                      <td>Infinite Scale (Archived Tapes)</td>
                      <td>Regulatory cold database archives, compliance records, historical snaps</td>
                    </tr>
                    <tr>
                      <td><strong>💾 Amazon EBS</strong></td>
                      <td>Block (Persistent)</td>
                      <td>NVMe / PCIe Block API</td>
                      <td>&lt; 1 ms</td>
                      <td>Single EC2 Node (Multi-attach has limits)</td>
                      <td>EC2 system boot volumes, transactional relational databases (RDS/SQL)</td>
                    </tr>
                    <tr>
                      <td><strong>⚡ Instance Store</strong></td>
                      <td>Block (Ephemeral)</td>
                      <td>SATA / NVMe Physical bus</td>
                      <td>Microseconds (Physical NVMe)</td>
                      <td>Single host hypervisor motherboards</td>
                      <td>Temporary swap spaces, high-speed RAM caching buffers, NoSQL scratch disks</td>
                    </tr>
                    <tr>
                      <td><strong>📂 Amazon EFS</strong></td>
                      <td>Shared File (POSIX)</td>
                      <td>NFS v4.0 / NFS v4.1</td>
                      <td>1.5–3 ms</td>
                      <td>Thousands of concurrent Linux nodes</td>
                      <td>Shared developer home folders, serverless AWS Lambda backend volumes</td>
                    </tr>
                    <tr>
                      <td><strong>🗄️ FSx for Windows</strong></td>
                      <td>Shared File (SMB)</td>
                      <td>SMB v2.0 to SMB v3.1.1</td>
                      <td>1.5–3 ms</td>
                      <td>Multiple Windows client computers</td>
                      <td>Corporate user file shares, Microsoft active directory, Windows legacy apps</td>
                    </tr>
                    <tr>
                      <td><strong>🚀 FSx for Lustre</strong></td>
                      <td>Parallel File (HPC)</td>
                      <td>POSIX Lustre parallel client</td>
                      <td>&lt; 1 ms (NVMe speed)</td>
                      <td>Tens of thousands of HPC GPU nodes</td>
                      <td>SageMaker AI training, high-performance rendering, heavy analytics</td>
                    </tr>
                    <tr>
                      <td><strong>🌌 FSx for NetApp ONTAP</strong></td>
                      <td>Multi-protocol (File/Block)</td>
                      <td>NFS, SMB, and iSCSI blocks</td>
                      <td>1.5–3.5 ms</td>
                      <td>Petabyte-scale FlexGroup volumes</td>
                      <td>Enterprise SAP HANA backends, SQL DB, local NetApp migration backups</td>
                    </tr>
                    <tr>
                      <td><strong>⚡ FSx for OpenZFS</strong></td>
                      <td>Shared File (ZFS)</td>
                      <td>NFS v3, NFS v4</td>
                      <td>&lt; 0.5 ms</td>
                      <td>Linux/Unix nodes</td>
                      <td>Dynamic developer sandboxes (dataset clones), low-latency web caches</td>
                    </tr>
                    <tr>
                      <td><strong>🔌 AWS Storage Gateway</strong></td>
                      <td>Hybrid File/Block/Tape</td>
                      <td>NFS, SMB, iSCSI, VTL Slots</td>
                      <td>&lt; 1 ms (Local cache SSD)</td>
                      <td>Local datacenter network clients</td>
                      <td>Local branch caches, backup Volume/Tape snap mirroring, hybrid architectures</td>
                    </tr>
                    <tr>
                      <td><strong>⚡ AWS DataSync</strong></td>
                      <td>Data Migration (Online)</td>
                      <td>NFS, SMB, API integrations</td>
                      <td>N/A (Transfer only)</td>
                      <td>Accelerates large petabyte sync tasks</td>
                      <td>Scheduled migrations from local datacenters to cloud buckets</td>
                    </tr>
                    <tr>
                      <td><strong>💼 AWS Transfer Family</strong></td>
                      <td>Data Transfer (Secure)</td>
                      <td>SFTP, FTPS, FTP</td>
                      <td>N/A (Transfer only)</td>
                      <td>Exposes secure external client routes</td>
                      <td>Automated external client file delivery directly to S3 or EFS backends</td>
                    </tr>
                    <tr>
                      <td><strong>📦 AWS Snow Family</strong></td>
                      <td>Physical Migration (Offline)</td>
                      <td>Physical ruggedized transport</td>
                      <td>N/A (Days to ship)</td>
                      <td>Offline petabytes/exabytes copies</td>
                      <td>Migrations from edge settings (ships, mines) lacking active internet lines</td>
                    </tr>
                    <tr>
                      <td><strong>🛢️ AWS Databases</strong></td>
                      <td>Structured Relational/NoSQL</td>
                      <td>SQL, NoSQL API, DynamoDB</td>
                      <td>Sub-10ms (DynamoDB &lt;10ms)</td>
                      <td>Managed scaling clusters</td>
                      <td>Transactional databases (Aurora/RDS), high-scale serverless apps (DynamoDB)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>

            <div className="fs-sec">Active Storage Tiering &amp; Deduplication Calculator</div>
            <div className="fs-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '12px' }}>
                Enterprise filesystems like **NetApp ONTAP** and **Windows HDD** allow you to automatically shift inactive blocks (cold data) to cheaper storage tiers. Adjust this calculator to estimate monthly billing savings!
              </div>

              <div className="fs-grid2" style={{ gap: '14px' }}>
                {/* Slider controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="fs-ctrl">
                    <label>Total Dataset Volume: <strong>{(totalDataGb / 1000).toFixed(0)} TB</strong></label>
                    <input 
                      type="range" 
                      min="1000" 
                      max="100000" 
                      step="1000" 
                      value={totalDataGb} 
                      onChange={(e) => setTotalDataGb(parseInt(e.target.value))} 
                    />
                  </div>
                  <div className="fs-ctrl">
                    <label>Cold Data Ratio (Shifts to Capacity/HDD Tier): <strong>{coldPercent}%</strong></label>
                    <input 
                      type="range" 
                      min="10" 
                      max="90" 
                      step="5" 
                      value={coldPercent} 
                      onChange={(e) => setColdPercent(parseInt(e.target.value))} 
                    />
                  </div>
                </div>

                {/* Calculations breakdown */}
                <div style={{ background: '#ffffff', border: '0.5px solid #cbd5e1', borderRadius: '6px', padding: '10px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', color: '#10b981', marginBottom: '6px' }}>
                    Estimated AWS Monthly Billing Report
                  </div>
                  <div style={{ fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>Raw SSD Cost (Single Tier): <span style={{ color: '#ef4444' }}>${costMetrics.totalSsdCost} / mo</span></div>
                    <div>Active Tiered Cost (SSD+Capacity): <span style={{ color: '#10b981' }}>${costMetrics.totalTieredCost} / mo</span></div>
                    <hr style={{ border: 'none', borderTop: '0.5px solid #cbd5e1', margin: '4px 0' }} />
                    <div style={{ fontWeight: 700 }}>Monthly Budget Savings: <span style={{ color: '#10b981' }}>${costMetrics.monthlySavings} / mo</span></div>
                    <div style={{ fontWeight: 700 }}>Yearly Storage Savings: <span style={{ color: '#10b981' }}>${costMetrics.yearlySavings} / yr</span></div>
                  </div>
                  <div style={{ fontSize: '9px', color: '#64748b', marginTop: '8px', fontStyle: 'italic' }}>
                    *Calculations assume standard storage pricing: SSD $0.13/GB-mo and Capacity HDD/Pool $0.013/GB-mo. Deduplication efficiencies may yield higher savings.
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
