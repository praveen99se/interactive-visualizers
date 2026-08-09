import React, { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Copy,
  Check,
  Folder,
  Sliders,
  Server,
  Zap,
  Globe
} from 'lucide-react';
import FilesAndStorageComparativeView from '../../components/visualizers/FilesAndStorageComparativeView';
import UniqueFilesAndStorageFeatures from '../../components/visualizers/UniqueFilesAndStorageFeatures';

type TabType = 'notebook' | 'overview' | 'windows' | 'lustre' | 'hybrid' | 'sim' | 'matrix' | 'unique';
type ScenarioType = 'lustre_ml' | 'windows_multiaz' | 'zfs_dev' | 'ontap_enterprise' | 'gateway_hybrid' | 'datasync_migration';

interface SimLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface FilesAndStorageVisualizerProps {
  provider?: 'aws' | 'azure' | 'gcp' | 'comparative';
  setProvider?: (provider: 'aws' | 'azure' | 'gcp' | 'comparative') => void;
}

export default function FilesAndStorageVisualizer({ provider = 'aws', setProvider }: FilesAndStorageVisualizerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');

  // Visual Architect Notes & Theories Academy State
  const [selectedNote, setSelectedNote] = useState<string>('fs_block_file_object');
  const [expandedCategory, setExpandedCategory] = useState<string>('fs_fundamentals');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Interactive Storage Pricing Calculator State
  const [nbStorageGb, setNbStorageGb] = useState<number>(5000);
  const [nbEfsIaPercent, setNbEfsIaPercent] = useState<number>(80);

  const isComparative = provider === 'comparative';
  const isAzure = provider === 'azure';
  const isGcp = provider === 'gcp';

  const t = (text: string) => {
    if (provider === 'azure') {
      return text
        .replace(/Amazon EFS/gi, 'Azure Files (NFS)')
        .replace(/Amazon FSx/gi, 'Azure NetApp Files / Azure Files')
        .replace(/FSx for Windows/gi, 'Azure Files SMB')
        .replace(/FSx for Lustre/gi, 'Azure Managed Lustre')
        .replace(/CloudWatch/g, 'Azure Monitor');
    }
    if (provider === 'gcp') {
      return text
        .replace(/Amazon EFS/gi, 'Google Cloud Filestore')
        .replace(/Amazon FSx/gi, 'Google Parallelstore / Filestore')
        .replace(/FSx for Windows/gi, 'Cloud Filestore Active Directory')
        .replace(/FSx for Lustre/gi, 'Google Parallelstore (Lustre)')
        .replace(/CloudWatch/g, 'Cloud Monitoring');
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
        if (node.type === 'pre' || node.type === 'code' || (node.props && (node.props.className === 'fs-terminal' || node.props.className === 'fs-terminal-box'))) {
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
    setActiveTab(tab === 'efs' ? 'overview' : tab === 'fsx' ? 'windows' : tab);
  };

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

  // Tab 1 Interactive Trace States
  const [tab1TraceActive, setTab1TraceActive] = useState<boolean>(false);
  const [tab1TraceStep, setTab1TraceStep] = useState<number>(0);

  const handleTab1Trace = () => {
    if (tab1TraceActive) return;
    setTab1TraceActive(true);
    setTab1TraceStep(1);
    addLog("Tab 1: Starting POSIX File System lookup trace for '/var/log/app.log'...", "info");
    
    setTimeout(() => {
      setTab1TraceStep(2);
      addLog("Tab 1: Metadata resolution. Scanning POSIX directory index... Inode #401039 found.", "info");
      
      setTimeout(() => {
        setTab1TraceStep(3);
        addLog("Tab 1: Resolving block pointers to physical NVMe sector addresses (Block 55, 56, 57).", "info");
        
        setTimeout(() => {
          setTab1TraceStep(4);
          addLog("Tab 1: Direct DMA read initiated. Transporting block data payloads back to Client Application.", "success");
          
          setTimeout(() => {
            setTab1TraceStep(0);
            setTab1TraceActive(false);
            addLog("Tab 1: POSIX block translation completed successfully. 450 KB loaded in 0.4ms.", "success");
          }, 800);
        }, 800);
      }, 800);
    }, 800);
  };

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

  // Decision Matrix table active filter
  const [tableFilter, setTableFilter] = useState<string>('all');

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
      if (advisorMigration === 'ultra_low') {
        result = 'Amazon S3 Express One Zone: High-performance, single-digit millisecond latency object storage designed for your most latency-sensitive applications and query engines.';
      } else if (advisorMigration === 'cost_eff') {
        result = 'Amazon S3 Glacier Flexible or Deep Archive: Secure, durable, and extremely low-cost offline vaulting for long-term compliance records with retrieval times ranging from minutes to 12 hours.';
      } else {
        result = 'Amazon S3 Standard: Highly durable (99.999999999% durability), infinite-scale cloud object store ideal for static assets, web logging streams, and dynamic data lakes.';
      }
    } else if (advisorDataType === 'block_db') {
      if (advisorAccess === 'hybrid') {
        result = 'AWS Storage Gateway (Volume Gateway): Local server appliance presenting cached or stored iSCSI block volumes to local VMs, asynchronously syncing snapshots to Amazon EBS in AWS.';
      } else if (advisorMigration === 'ultra_low') {
        result = 'Amazon EBS io2 Block Express / Instance Store: Sub-millisecond persistent EBS volumes for critical databases, or ephemeral Instance Stores connected directly to physical hypervisor NVMe registers.';
      } else if (advisorMigration === 'cost_eff') {
        result = 'Amazon EBS gp3 or st1/sc1: General purpose gp3 SSDs balance cost/performance, while Throughput Optimized (st1) or Cold (sc1) HDDs offer lowest block costs for heavy sequential storage workloads.';
      } else {
        result = 'Amazon EBS gp3: Industry-standard general purpose persistent block storage with independent IOPS and throughput tuning, perfect for system boots and standard databases.';
      }
    } else if (advisorDataType === 'win_file') {
      if (advisorAccess === 'hybrid') {
        result = 'Amazon FSx File Gateway: Deploys a low-latency on-premises virtual cache server, exposing Windows SMB network folders backed directly by your cloud-hosted FSx for Windows volumes.';
      } else if (advisorMigration === 'cost_eff') {
        result = 'Amazon FSx for Windows File Server (HDD Tier): Native Windows SMB file system utilizing deduplication and compressed HDD volumes to achieve highly cost-effective active directory file shares.';
      } else {
        result = 'Amazon FSx for Windows File Server (SSD Tier): Fully managed Windows filesystems backed by high-throughput SSD arrays, supporting active Microsoft DFS namespaces and sub-millisecond SMB routing.';
      }
    } else if (advisorDataType === 'linux_shared') {
      if (advisorMigration === 'ultra_low') {
        result = 'Amazon FSx for OpenZFS: Deliver extreme POSIX shared performance (sub-millisecond latencies, up to 1 million IOPS) using SSDs and high-speed RAM-level caching.';
      } else if (advisorMigration === 'cost_eff') {
        result = 'Amazon EFS (Elastic Tiering): Fully elastic POSIX NFS sharing utilizing EFS Infrequent Access (IA) and Archive lifecycle policies to automatically drop cold data cost by up to 92%.';
      } else {
        result = 'Amazon EFS (General Purpose): Standard serverless shared filesystem automatically scaling from gigabytes to petabytes, mounting simultaneously across thousands of Linux nodes.';
      }
    } else if (advisorDataType === 'linux_hpc') {
      if (advisorMigration === 'cost_eff') {
        result = 'Amazon FSx for Lustre (HDD Scratch): A parallel HPC filesystem built on high-throughput HDD scratch pools, integrated with S3 to quickly load and export parallel workloads at minimal cost.';
      } else {
        result = 'Amazon FSx for Lustre (Persistent SSD/NVMe): An extreme parallel POSIX filesystem designed to saturate thousands of high-speed GPU nodes with NVMe backends for machine learning and heavy rendering.';
      }
    } else if (advisorDataType === 'multi_proto') {
      if (advisorMigration === 'cost_eff') {
        result = 'Amazon FSx for NetApp ONTAP (Auto-Tiering Active): Enterprise-grade NFS/SMB/iSCSI volumes utilizing ONTAP FabricPool to dynamically sweep up to 90% of inactive cold blocks to low-cost capacity pools.';
      } else {
        result = 'Amazon FSx for NetApp ONTAP (SSD Multi-AZ): Enterprise-grade multi-protocol storage with SnapMirror failover replication, high-speed RAM/SSD writes, and NetApp FlexGroup scale-out capacity.';
      }
    } else if (advisorDataType === 'zfs_file') {
      result = 'Amazon FSx for OpenZFS: Premium Unix POSIX sharing built on the OpenZFS engine, offering sub-millisecond response speeds, dynamic data compression, and instant Copy-on-Write dataset clones.';
    } else if (advisorDataType === 'tape_backup') {
      result = 'AWS Storage Gateway (Tape Gateway): Virtual Tape Library (VTL) appliance that lets you seamlessly transition on-premises backup systems (like NetBackup) to secure tape vaults in S3 Glacier.';
    } else if (advisorDataType === 'database') {
      if (advisorMigration === 'ultra_low') {
        result = 'Amazon DynamoDB (with DAX): Serverless NoSQL key-value database delivering single-digit millisecond response times at massive scale, enhanced with an in-memory DAX accelerator cache.';
      } else if (advisorMigration === 'cost_eff') {
        result = 'Amazon RDS / Aurora Serverless v2: Relational database hosting (MySQL/PostgreSQL) that dynamically scales CPU and RAM capacities up or down in fractions of a second based on load, optimizing budget spent.';
      } else {
        result = 'Amazon Aurora Global Database: High-performance relational database with global clusters, leveraging storage-level replication to achieve sub-second cross-region read replicas.';
      }
    } else if (advisorDataType === 'migration_offline') {
      result = 'AWS Snowball Edge: Physical, ruggedized edge computing and data transfer appliances shipped straight to your facility, enabling secure physical ingest of petabytes of local datasets without internet dependency.';
    } else if (advisorDataType === 'migration_online') {
      result = 'AWS DataSync: Highly automated online data transfer service that accelerates syncing local NAS directories (NFS/SMB) to S3, EFS, or FSx over dedicated networks with integrity validation.';
    } else if (advisorDataType === 'legacy_transfer') {
      result = 'AWS Transfer Family: Managed secure file transfer gateway exposing standard SFTP, FTPS, and FTP endpoints directly integrated with behind-the-scenes Amazon S3 or Amazon EFS storage volumes.';
    }
    
    setAdvisorResult(result);
    addLog(`Advisor Engine Completed. Recommending: ${result.split(':')[0]}`, 'success');
  };

  return (
    <div>
      <style>{`
        /* Scoped Files & Shared Storage premium styling */
        .fs-container {
          font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
          color: var(--color-text-primary, #1e293b);

          /* Theme Variables (Light mode default) */
          --fs-bg: #ffffff;
          --fs-card-bg: rgba(255, 255, 255, 0.75);
          --fs-card-border: rgba(226, 232, 240, 0.8);
          --fs-card-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.08), 0 2px 8px -1px rgba(148, 163, 184, 0.04);
          
          --color-text-primary: #1e293b;
          --color-text-secondary: #475569;
          --color-text-tertiary: #64748b;
          
          --fs-border-primary: rgba(226, 232, 240, 0.8);
          --fs-border-secondary: #cbd5e1;
          --fs-border-tertiary: #e2e8f0;
          
          --color-background-primary: #ffffff;
          --color-background-secondary: #f8fafc;
          --color-background-tertiary: #f1f5f9;
          
          --fs-tab-bg: rgba(255, 255, 255, 0.85);
          --fs-tab-hover-bg: #f8fafc;
          --fs-tab-border: rgba(226, 232, 240, 0.85);
          
          --fs-btn-bg: #ffffff;
          --fs-btn-color: #1e293b;
          --fs-btn-hover-bg: #f8fafc;
          --fs-btn-border: rgba(226, 232, 240, 0.85);
          
          --fs-select-bg: #ffffff;
          --fs-select-color: #1e293b;
          --fs-select-border: #cbd5e1;
          
          --fs-terminal-bg: #0f172a;
          --fs-terminal-border: #1e293b;
          --fs-terminal-color: #cbd5e1;
          
          --fs-svg-grid-line: rgba(203, 213, 225, 0.45);
          --fs-svg-node-bg: #ffffff;
          --fs-svg-node-border: #cbd5e1;
          --fs-svg-node-stroke: #cbd5e1;
          
          --fs-svg-node-fill-client: #eff6ff;
          --fs-svg-node-stroke-client: #bfdbfe;
          --fs-svg-text-client: #1e40af;
          
          --fs-svg-node-fill-inode: #f5f3ff;
          --fs-svg-node-stroke-inode: #ddd6fe;
          --fs-svg-text-inode: #581c87;
          
          --fs-svg-node-fill-block: #fffbeb;
          --fs-svg-node-stroke-block: #fde68a;
          --fs-svg-text-block: #78350f;
          
          --fs-svg-node-fill-origin: #ecfdf5;
          --fs-svg-node-stroke-origin: #10b981;
          --fs-svg-text-origin: #047857;

          --fs-svg-node-fill-crashed: #fef2f2;
          --fs-svg-node-stroke-crashed: #ef4444;
          --fs-svg-text-crashed: #b91c1c;

          --fs-svg-node-fill-standby: #f8fafc;
          --fs-svg-node-stroke-standby: #64748b;
          --fs-svg-text-standby: #475569;
          
          --fs-alert-green-bg: #ecfdf5;
          --fs-alert-green-border: #a7f3d0;
          --fs-alert-green-text: #065f46;
          --fs-alert-green-subtext: #047857;
          
          --fs-alert-yellow-bg: #fffbeb;
          --fs-alert-yellow-border: #fef3c7;
          --fs-alert-yellow-text: #b45309;

          --fs-alert-red-bg: #fef2f2;
          --fs-alert-red-border: #fee2e2;
          --fs-alert-red-text: #b91c1c;

          --fs-hud-bg: #090d16;
          --fs-hud-border: #1e293b;
          --fs-hud-color: #38bdf8;
          --fs-hud-title: #64748b;
          --fs-hud-box-bg: rgba(15, 23, 42, 0.6);
          --fs-hud-box-border: rgba(56, 189, 248, 0.15);
        }
        .fs-h {
          font-size: 24px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
          color: var(--color-text-primary);
          background: linear-gradient(135deg, #10b981 0%, #3b82f6 50%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .fs-sub {
          font-size: 13.5px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin-bottom: 18px;
        }
        .fs-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          border-bottom: 1.5px solid var(--fs-border-primary);
          padding-bottom: 10px;
        }
        .fs-tb {
          padding: 8px 16px;
          border-radius: 10px;
          border: 1.5px solid var(--fs-tab-border);
          font-size: 12px;
          cursor: pointer;
          background: var(--fs-tab-bg);
          color: var(--color-text-secondary);
          transition: all 0.15s ease-in-out;
          outline: none;
          font-weight: 600;
        }
        .fs-tb:hover {
          background: var(--fs-tab-hover-bg);
          color: var(--color-text-primary);
          border-color: var(--fs-border-secondary);
        }
        .fs-tb.fs-on {
          background: #16a34a;
          color: #ffffff;
          border-color: #16a34a;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.12);
        }
        .fs-card {
          border: 1.5px solid var(--fs-card-border);
          border-radius: 16px;
          padding: 18px 20px;
          background: var(--fs-card-bg);
          backdrop-filter: blur(16px);
          margin-bottom: 18px;
          box-shadow: var(--fs-card-shadow);
        }

        /* Developer Academy Notes & Visual Mental Models Styling */
        .acad-dir-container {
          background: var(--color-background-primary);
          border: 1px solid var(--fs-border-primary);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .acad-dir-header {
          padding: 10px 14px;
          background: var(--color-background-secondary);
          border-bottom: 1px solid var(--fs-border-primary);
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
          border-bottom: 1px solid var(--fs-border-primary);
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
          border-left-color: var(--fs-border-primary);
        }
        .acad-dir-item-btn.acad-active {
          background: #ecfdf5;
          color: #059669;
          border-left-color: #10b981;
          font-weight: 800;
        }
        .dark .acad-dir-item-btn.acad-active {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border-left-color: #10b981;
        }
        .acad-detail-card {
          background: var(--color-background-primary);
          border: 1px solid var(--fs-border-primary);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .acad-hero-badge {
          background: #d1fae5;
          border: 1.5px solid #6ee7b7;
          color: #065f46;
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
          border-left: 4px solid #10b981;
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 11.5px;
          line-height: 1.6;
          color: var(--color-text-secondary);
          border-top: 1px solid var(--fs-border-primary);
          border-right: 1px solid var(--fs-border-primary);
          border-bottom: 1px solid var(--fs-border-primary);
        }
        .acad-plain-english {
          background: rgba(16, 185, 129, 0.07);
          border-left: 4px solid #10b981;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 16px;
          font-size: 12.5px;
          line-height: 1.6;
          color: var(--color-text-primary);
          border-top: 1px solid var(--fs-border-primary);
          border-right: 1px solid var(--fs-border-primary);
          border-bottom: 1px solid var(--fs-border-primary);
        }
        .dark .acad-plain-english {
          background: rgba(16, 185, 129, 0.15);
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
          border-top: 1px solid var(--fs-border-primary);
          border-right: 1px solid var(--fs-border-primary);
          border-bottom: 1px solid var(--fs-border-primary);
        }
        .dark .acad-gotcha-box {
          background: rgba(239, 68, 68, 0.12);
        }
        .acad-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--fs-border-primary);
        }
        .acad-table th {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
          font-weight: 800;
          padding: 10px 12px;
          border-bottom: 1.5px solid var(--fs-border-primary);
          text-align: left;
        }
        .acad-table td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--fs-border-primary);
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
          border: 1px solid var(--fs-border-primary);
          color: var(--color-text-secondary);
        }
        .fs-sec {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 20px 0 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .fs-sec:first-child {
          margin-top: 0;
        }
        .fs-grid2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .fs-grid3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }
        .fs-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 10px 12px;
          border: 1.5px solid var(--fs-border-primary);
          border-radius: 10px;
          background: var(--color-background-secondary);
          margin-bottom: 8px;
          font-size: 12px;
          line-height: 1.5;
        }
        .fs-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 10.5px;
          color: #ffffff;
          font-weight: 800;
          background: #10b981;
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        }
        .fs-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
        }
        
        /* High contrast keywords matching other visualizers */
        .fs-hl-purple { background-color: #f3e8ff; color: #6b21a8; padding: 2px 6px; border-radius: 6px; font-weight: 700; border: 0.5px solid #e9d5ff; }
        .fs-hl-emerald { background-color: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 6px; font-weight: 700; border: 0.5px solid #bbf7d0; }
        .fs-hl-blue { background-color: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 6px; font-weight: 700; border: 0.5px solid #bae6fd; }
        .fs-hl-orange { background-color: #ffedd5; color: #c2410c; padding: 2px 6px; border-radius: 6px; font-weight: 700; border: 0.5px solid #fed7aa; }

        /* Muted parenthetical descriptions outside the highlight */
        .fs-desc-mute { color: var(--color-text-tertiary); font-size: 11px; font-style: italic; opacity: 0.95; font-weight: normal; background: none; padding: 0; }

        /* Blueprint dot grid background grid */
        .fs-svg-bg {
          background-color: var(--color-background-secondary);
          background-image: radial-gradient(var(--fs-svg-grid-line) 1.5px, transparent 1.5px);
          background-size: 16px 16px;
        }

        /* Simulator controls and output */
        .fs-ctrl {
          background: var(--color-background-secondary);
          border: 1.5px solid var(--fs-border-primary);
          border-radius: 12px;
          padding: 14px;
        }
        .fs-ctrl label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-secondary);
          margin-bottom: 6px;
        }
        .fs-container select {
          width: 100%;
          padding: 8px 30px 8px 10px;
          font-size: 12px;
          border: 1.5px solid var(--fs-select-border) !important;
          border-radius: 8px;
          background-color: var(--fs-select-bg) !important;
          color: var(--fs-select-color) !important;
          outline: none;
          font-weight: 500;
          transition: all 0.15s;
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 8px center !important;
          background-size: 16px !important;
          cursor: pointer;
        }
        .fs-container select:focus {
          border-color: #10b981 !important;
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.15);
        }
        .fs-container select option {
          background-color: var(--fs-select-bg) !important;
          color: var(--fs-select-color) !important;
        }
        .fs-ctrl input[type="range"] {
          width: 100%;
          accent-color: #16a34a;
          cursor: pointer;
          margin: 6px 0;
        }
        .fs-btnbar {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 10px;
        }
        .fs-btn {
          font-size: 12.5px;
          padding: 8px 16px;
          border-radius: 10px;
          border: 1.5px solid var(--fs-btn-border);
          background: var(--fs-btn-bg);
          color: var(--fs-btn-color);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
          outline: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .fs-btn:hover {
          background: var(--fs-btn-hover-bg);
          border-color: var(--fs-border-secondary);
          transform: translateY(-1px);
        }
        .fs-btn.fs-primary {
          background: #16a34a;
          border-color: #16a34a;
          color: #ffffff;
        }
        .fs-btn.fs-primary:hover {
          background: #15803d;
          border-color: #15803d;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.15);
        }
        .fs-btn.fs-danger {
          background: #dc2626;
          border-color: #dc2626;
          color: #ffffff;
        }
        .fs-btn.fs-danger:hover {
          background: #b91c1c;
          border-color: #b91c1c;
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
        }
        .fs-btn.fs-warning {
          background: #ea580c;
          border-color: #ea580c;
          color: #ffffff;
        }
        .fs-btn.fs-warning:hover {
          background: #c2410c;
          border-color: #c2410c;
          box-shadow: 0 4px 12px rgba(234, 88, 12, 0.15);
        }
        .fs-log {
          background: var(--fs-terminal-bg);
          border-radius: 12px;
          padding: 14px;
          font-size: 11.5px;
          color: var(--fs-terminal-color);
          line-height: 1.6;
          min-height: 120px;
          max-height: 240px;
          overflow-y: auto;
          margin-top: 12px;
          font-family: var(--font-mono, monospace);
          border: 1.5px solid var(--fs-terminal-border);
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.3);
        }
        .fs-log-entry {
          margin-bottom: 6px;
          border-bottom: 1px dashed rgba(51, 65, 85, 0.5);
          padding-bottom: 6px;
        }
        .fs-log-entry:last-child {
          border: none;
        }
        
        .fs-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
          line-height: 1.5;
        }
        .fs-table th {
          background: var(--color-background-secondary);
          border: 1.5px solid var(--fs-card-border);
          padding: 10px 12px;
          text-align: left;
          font-weight: 700;
          color: var(--color-text-secondary);
        }
        .fs-table td {
          border: 1.5px solid var(--fs-card-border);
          padding: 10px 12px;
          color: var(--color-text-primary);
        }
        .fs-table tr:nth-child(even) {
          background: var(--color-background-primary);
        }

        /* Dynamic table row hovers and premium table badges */
        .fs-table tr:hover {
          background: rgba(59, 130, 246, 0.04) !important;
          transition: background 0.15s ease-in-out;
        }
        
        .fs-matrix-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
        }
        
        .fs-badge-object { background-color: #ffedd5; color: #c2410c; border: 1px solid #fed7aa; }
        .fs-badge-block { background-color: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
        .fs-badge-file { background-color: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }
        .fs-badge-multiproto { background-color: #e0e7ff; color: #3730a3; border: 1px solid #c7d2fe; }
        .fs-badge-hybrid { background-color: #ccfbf1; color: #0f766e; border: 1px solid #99f6e4; }
        .fs-badge-mig-online { background-color: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
        .fs-badge-mig-offline { background-color: #ffe4e6; color: #9f1239; border: 1px solid #fecdd3; }
        .fs-badge-db { background-color: #ecfeff; color: #155e75; border: 1px solid #c5f2f7; }
        
        .fs-badge-latency-ultra { background-color: #dcfce7; color: #166534; border: 1px solid #bbf7d0; box-shadow: 0 0 4px rgba(34, 197, 94, 0.15); }
        .fs-badge-latency-low { background-color: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
        .fs-badge-latency-mid { background-color: #f0f9ff; color: #0369a1; border: 1px solid #e0f2fe; }
        .fs-badge-latency-high { background-color: #fffbeb; color: #b45309; border: 1px solid #fef3c7; }
        .fs-badge-latency-slow { background-color: #fff1f2; color: #9f1239; border: 1px solid #ffe4e6; }
        
        /* Interactive advisor form element glows */
        .fs-advisor-box {
          border: 1.5px solid var(--fs-card-border);
          border-radius: 12px;
          padding: 14px;
          background: var(--fs-card-bg);
          transition: all 0.2s ease-in-out;
        }
        .fs-advisor-box:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.08);
          transform: translateY(-1px);
        }
        .fs-advisor-box.fs-active {
          border-color: #10b981;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.08);
        }

        /* Filter Tab Bar inside Decision Matrix */
        .fs-filter-bar {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }
        .fs-filter-btn {
          padding: 6px 12px;
          font-size: 11.5px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--fs-card-border);
          background: var(--fs-card-bg);
          color: var(--color-text-secondary);
          transition: all 0.15s ease-in-out;
        }
        .fs-filter-btn:hover {
          background: var(--color-background-tertiary);
          border-color: var(--fs-border-secondary);
          color: var(--color-text-primary);
        }
        .fs-filter-btn.fs-active {
          background: #3b82f6;
          color: #ffffff;
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.2);
        }

        /* HUD Terminal Cost Calculator */
        .fs-terminal-hud {
          background: var(--fs-hud-bg);
          border: 2px solid var(--fs-hud-border);
          border-radius: 12px;
          padding: 18px;
          color: var(--fs-hud-color);
          font-family: var(--font-mono), "Courier New", Courier, monospace;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5), inset 0 2px 10px rgba(56, 189, 248, 0.05);
          position: relative;
          overflow: hidden;
        }
        .fs-terminal-hud::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
          background-size: 100% 4px, 6px 100%;
          pointer-events: none;
        }
        .fs-terminal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1.5px solid var(--fs-hud-border);
          padding-bottom: 8px;
          margin-bottom: 12px;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--fs-hud-title);
        }
        .fs-terminal-led {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
          margin-right: 6px;
        }
        .fs-terminal-led.fs-led-amber {
          background: #f59e0b;
          box-shadow: 0 0 8px #f59e0b;
        }
        .fs-terminal-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }
        .fs-terminal-box {
          background: var(--fs-hud-box-bg);
          border: 1px solid var(--fs-hud-box-border);
          border-radius: 8px;
          padding: 10px;
          text-shadow: 0 0 2px rgba(56, 189, 248, 0.3);
        }
        .fs-terminal-box.fs-box-save {
          border-color: rgba(34, 197, 94, 0.2);
          color: #4ade80;
          text-shadow: 0 0 2px rgba(34, 197, 94, 0.3);
        }
        .fs-terminal-box.fs-box-alert {
          border-color: rgba(239, 68, 68, 0.25);
          color: #f87171;
          text-shadow: 0 0 2px rgba(239, 68, 68, 0.3);
        }
        .fs-terminal-title {
          font-size: 10px;
          text-transform: uppercase;
          color: var(--fs-hud-title);
          margin-bottom: 4px;
          font-weight: bold;
        }
        .fs-terminal-val {
          font-size: 16px;
          font-weight: 700;
        }
        
        /* Bar Graph visual for Ratio */
        .fs-ratio-bar-container {
          background: rgba(15, 23, 42, 0.9);
          border: 1px solid var(--fs-hud-border);
          height: 16px;
          border-radius: 4px;
          margin: 12px 0 6px 0;
          display: flex;
          overflow: hidden;
        }
        .fs-ratio-bar-ssd {
          height: 100%;
          background: linear-gradient(90deg, #0284c7 0%, #38bdf8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          color: #ffffff;
          font-weight: 800;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .fs-ratio-bar-hdd {
          height: 100%;
          background: linear-gradient(90deg, #d97706 0%, #fbbf24 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9px;
          color: #1e293b;
          font-weight: 800;
          text-shadow: 0 1px 1px rgba(255,255,255,0.3);
          transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Centralized Dark Mode Overrides for FilesAndStorageVisualizer.tsx */
        .dark .fs-container {
          background: #020617 !important;
          color: #f8fafc !important;

          --fs-bg: #020617;
          --fs-card-bg: rgba(15, 23, 42, 0.75);
          --fs-card-border: rgba(51, 65, 85, 0.6);
          --fs-card-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          
          --color-text-primary: #f8fafc;
          --color-text-secondary: #cbd5e1;
          --color-text-tertiary: #94a3b8;
          
          --fs-border-primary: rgba(51, 65, 85, 0.6);
          --fs-border-secondary: rgba(51, 65, 85, 0.6);
          --fs-border-tertiary: rgba(51, 65, 85, 0.6);
          
          --color-background-primary: #0f172a;
          --color-background-secondary: #0b0f19;
          --color-background-tertiary: #1e293b;
          
          --fs-tab-bg: rgba(15, 23, 42, 0.6);
          --fs-tab-hover-bg: rgba(30, 41, 59, 0.8);
          --fs-tab-border: rgba(51, 65, 85, 0.6);
          
          --fs-btn-bg: rgba(15, 23, 42, 0.8);
          --fs-btn-color: #cbd5e1;
          --fs-btn-hover-bg: rgba(30, 41, 59, 0.8);
          --fs-btn-border: rgba(51, 65, 85, 0.6);
          
          --fs-select-bg: #0f172a;
          --fs-select-color: #f1f5f9;
          --fs-select-border: rgba(51, 65, 85, 0.8);
          
          --fs-terminal-bg: #020617;
          --fs-terminal-border: rgba(51, 65, 85, 0.6);
          --fs-terminal-color: #38bdf8;
          
          --fs-svg-grid-line: rgba(51, 65, 85, 0.5);
          --fs-svg-node-bg: rgba(15, 23, 42, 0.8);
          --fs-svg-node-border: rgba(51, 65, 85, 0.6);
          --fs-svg-node-stroke: rgba(100, 116, 139, 0.5);
          
          --fs-svg-node-fill-client: rgba(37, 99, 235, 0.15);
          --fs-svg-node-stroke-client: rgba(96, 165, 250, 0.6);
          --fs-svg-text-client: #60a5fa;
          
          --fs-svg-node-fill-inode: rgba(139, 92, 246, 0.15);
          --fs-svg-node-stroke-inode: rgba(167, 139, 250, 0.6);
          --fs-svg-text-inode: #a78bfa;
          
          --fs-svg-node-fill-block: rgba(245, 158, 11, 0.15);
          --fs-svg-node-stroke-block: rgba(245, 158, 11, 0.5);
          --fs-svg-text-block: #fbbf24;
          
          --fs-svg-node-fill-origin: rgba(16, 185, 129, 0.15);
          --fs-svg-node-stroke-origin: rgba(52, 211, 153, 0.6);
          --fs-svg-text-origin: #34d399;

          --fs-svg-node-fill-crashed: rgba(239, 68, 68, 0.15);
          --fs-svg-node-stroke-crashed: rgba(239, 68, 68, 0.5);
          --fs-svg-text-crashed: #f87171;

          --fs-svg-node-fill-standby: rgba(71, 85, 105, 0.2);
          --fs-svg-node-stroke-standby: rgba(148, 163, 184, 0.5);
          --fs-svg-text-standby: #94a3b8;
          
          --fs-alert-green-bg: rgba(16, 185, 129, 0.1);
          --fs-alert-green-border: rgba(16, 185, 129, 0.3);
          --fs-alert-green-text: #34d399;
          --fs-alert-green-subtext: #a7f3d0;
          
          --fs-alert-yellow-bg: rgba(245, 158, 11, 0.1);
          --fs-alert-yellow-border: rgba(217, 119, 6, 0.3);
          --fs-alert-yellow-text: #fde68a;

          --fs-alert-red-bg: rgba(239, 68, 68, 0.1);
          --fs-alert-red-border: rgba(239, 68, 68, 0.3);
          --fs-alert-red-text: #f87171;

          --fs-hud-bg: #020617;
          --fs-hud-border: rgba(51, 65, 85, 0.6);
          --fs-hud-color: #38bdf8;
          --fs-hud-title: #94a3b8;
          --fs-hud-box-bg: rgba(15, 23, 42, 0.8);
          --fs-hud-box-border: rgba(56, 189, 248, 0.2);
        }
        .dark .fs-card b,
        .dark .fs-card strong,
        .dark .fs-card h3,
        .dark .fs-card h4 {
          color: #ffffff !important;
        }
        .dark .fs-inst,
        .dark .fs-instance {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .fs-inst .meta,
        .dark .fs-instance .meta {
          color: #94a3b8 !important;
        }
        
        /* Node Status Overrides */
        .dark .fs-ok {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: #4ade80 !important;
        }
        .dark .fs-warm {
          border-color: #f59e0b !important;
          background: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
        }
        .dark .fs-drain {
          border-color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }
        .dark .fs-down {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.15) !important;
          color: #f87171 !important;
        }
        .dark select,
        .dark input,
        .dark textarea {
          background-color: var(--fs-select-bg) !important;
          color: var(--fs-select-color) !important;
          border-color: var(--fs-select-border) !important;
        }
        .dark select option {
          background-color: var(--fs-select-bg) !important;
          color: var(--fs-select-color) !important;
        }
        .fs-container code {
          background: var(--color-background-tertiary) !important;
          color: var(--color-text-primary) !important;
        }
      `}</style>

      <div className="fs-container">
        {/* Title Header */}
        <div style={{ padding: '14px 16px 4px' }}>
          <div className="fs-h">
            {isComparative ? (
              <span>⚖️ Multi-Cloud File Storage Comparison — AWS EFS/FSx vs Azure Files/ANF vs GCP Filestore</span>
            ) : isAzure ? (
              <span>📂 Azure Files &amp; Azure NetApp Files</span>
            ) : isGcp ? (
              <span>📂 Google Cloud Filestore &amp; Parallelstore</span>
            ) : (
              <span>📂 Shared Filesystems &amp; Amazon FSx Visualizer</span>
            )}
          </div>
          <div className="fs-sub">
            {isComparative ? (
              <span>Side-by-side architectural comparison of managed NFS, SMB, and high-performance Lustre file storage across AWS, Azure, and GCP.</span>
            ) : isAzure ? (
              <span>Managed SMB and NFS file shares in Azure. Azure Files cloud tiering, Azure NetApp Files ultra IOPS, and Active Directory integration.</span>
            ) : isGcp ? (
              <span>Enterprise NFS file storage in Google Cloud. Cloud Filestore live volume scaling and Parallelstore Lustre HPC clusters for AI/ML.</span>
            ) : (
              <span>Learn basic directory protocols (NFS, SMB) and deep-dive into the four Amazon FSx managed engines. Mount high-performance compute caches with Lustre, integrate corporate directories with Windows File Server, scale enterprise volumes with NetApp ONTAP, and boot sub-millisecond storage with OpenZFS.</span>
            )}
          </div>
        </div>

        {!isComparative && (
          <div className="fs-tabs">
            <button className={`fs-tb ${activeTab === 'notebook' ? 'fs-on' : ''}`} onClick={() => setActiveTab('notebook')}>📖 1) Visual Notes &amp; Theories</button>
            <button className={`fs-tb ${activeTab === 'overview' ? 'fs-on' : ''}`} onClick={() => setActiveTab('overview')}>📂 2) File System Basics</button>
            <button className={`fs-tb ${activeTab === 'windows' ? 'fs-on' : ''}`} onClick={() => setActiveTab('windows')}>🗄️ 3) Windows &amp; NetApp ONTAP</button>
            <button className={`fs-tb ${activeTab === 'lustre' ? 'fs-on' : ''}`} onClick={() => setActiveTab('lustre')}>🚀 4) Lustre &amp; OpenZFS</button>
            <button className={`fs-tb ${activeTab === 'hybrid' ? 'fs-on' : ''}`} onClick={() => setActiveTab('hybrid')}>🔌 5) Hybrid &amp; Migration</button>
            <button className={`fs-tb ${activeTab === 'sim' ? 'fs-on' : ''}`} onClick={() => setActiveTab('sim')}>🎮 6) Live Storage Simulator</button>
            <button className={`fs-tb ${activeTab === 'matrix' ? 'fs-on' : ''}`} onClick={() => setActiveTab('matrix')}>📊 7) Decision Advisor &amp; Matrix</button>
            <button className={`fs-tb ${activeTab === 'unique' ? 'fs-on' : ''}`} onClick={() => setActiveTab('unique')}>✨ Unique Features</button>
          </div>
        )}

        {isComparative && (
          <FilesAndStorageComparativeView onNavigateToDemo={handleNavigateToDemo} />
        )}

        {!isComparative && activeTab === 'unique' && (
          <UniqueFilesAndStorageFeatures provider={provider} />
        )}

        {!isComparative && activeTab !== 'unique' && (
          <Translate>
            <>

        {activeTab === 'notebook' && (
            <div className="space-y-6 animate-fadeIn text-left" style={{ color: 'var(--color-text-primary)' }}>
              
              {/* Header Hero Card */}
              <div className="fs-card text-left" style={{ borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      <BookOpen style={{ width: '20px', height: '20px', color: '#10b981' }} /> AWS Files &amp; Storage (EFS &amp; FSx Family) Notes &amp; Mental Models
                    </h2>
                    <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px', lineHeight: '1.45', marginBottom: 0 }}>
                      Simplified, beginner-friendly cloud file storage theories sorted progressively from POSIX/NFS shared drives to enterprise Windows SMB, ultra-fast sub-millisecond AI Lustre scratch disks, multi-protocol NetApp ONTAP, and hybrid on-premises Storage Gateways.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className="acad-hero-badge" style={{ background: '#d1fae5', borderColor: '#6ee7b7', color: '#065f46' }}>🎓 Beginner to Pro</span>
                    <span className="acad-hero-badge" style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#b45309' }}>💡 Everyday Mental Models</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Sidebar Category Explorer */}
                <div className="lg:col-span-3 space-y-4 text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest block pl-1 font-mono" style={{ color: 'var(--color-text-tertiary)' }}>Curriculum Directory:</span>
                  
                  <div className="acad-dir-container">
                    <div className="acad-dir-header">
                      <Folder className="w-4 h-4 text-emerald-500" />
                      <span>File Storage Modules</span>
                    </div>

                    {/* LEVEL 1: FUNDAMENTALS & EFS */}
                    <div>
                      <button 
                        onClick={() => setExpandedCategory(expandedCategory === 'fs_fundamentals' ? '' : 'fs_fundamentals')}
                        className="acad-dir-folder-btn"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                          🐣 Level 1 · Fundamentals &amp; EFS
                        </span>
                        {expandedCategory === 'fs_fundamentals' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      {expandedCategory === 'fs_fundamentals' && (
                        <div className="py-1 font-semibold" style={{ background: 'var(--color-background-primary)', borderBottom: '1px solid var(--fs-border-primary)' }}>
                          <button 
                            onClick={() => setSelectedNote('fs_block_file_object')}
                            className={`acad-dir-item-btn ${selectedNote === 'fs_block_file_object' ? 'acad-active' : ''}`}
                          >
                            1.1 File vs Block vs Object Storage (Whiteboard vs SSD)
                          </button>
                          <button 
                            onClick={() => setSelectedNote('fs_efs_scaling')}
                            className={`acad-dir-item-btn ${selectedNote === 'fs_efs_scaling' ? 'acad-active' : ''}`}
                          >
                            1.2 Amazon EFS Elastic Scaling &amp; IA (Rubber Band)
                          </button>
                        </div>
                      )}
                    </div>

                    {/* LEVEL 2: WINDOWS & NETAPP ONTAP */}
                    <div>
                      <button 
                        onClick={() => setExpandedCategory(expandedCategory === 'fs_windows_ontap' ? '' : 'fs_windows_ontap')}
                        className="acad-dir-folder-btn"
                      >
                        <span className="flex items-center gap-1.5">
                          <Server className="w-3.5 h-3.5 text-blue-500" />
                          🗄️ Level 2 · Windows &amp; ONTAP
                        </span>
                        {expandedCategory === 'fs_windows_ontap' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      {expandedCategory === 'fs_windows_ontap' && (
                        <div className="py-1 font-semibold" style={{ background: 'var(--color-background-primary)', borderBottom: '1px solid var(--fs-border-primary)' }}>
                          <button 
                            onClick={() => setSelectedNote('fs_windows_smb')}
                            className={`acad-dir-item-btn ${selectedNote === 'fs_windows_smb' ? 'acad-active' : ''}`}
                          >
                            2.1 FSx for Windows File Server (Corporate Z-Drive)
                          </button>
                          <button 
                            onClick={() => setSelectedNote('fs_netapp_ontap')}
                            className={`acad-dir-item-btn ${selectedNote === 'fs_netapp_ontap' ? 'acad-active' : ''}`}
                          >
                            2.2 FSx for NetApp ONTAP (Universal Translator)
                          </button>
                        </div>
                      )}
                    </div>

                    {/* LEVEL 3: HPC, LUSTRE & OPENZFS */}
                    <div>
                      <button 
                        onClick={() => setExpandedCategory(expandedCategory === 'fs_hpc_lustre' ? '' : 'fs_hpc_lustre')}
                        className="acad-dir-folder-btn"
                      >
                        <span className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          🚀 Level 3 · Lustre &amp; OpenZFS
                        </span>
                        {expandedCategory === 'fs_hpc_lustre' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      {expandedCategory === 'fs_hpc_lustre' && (
                        <div className="py-1 font-semibold" style={{ background: 'var(--color-background-primary)', borderBottom: '1px solid var(--fs-border-primary)' }}>
                          <button 
                            onClick={() => setSelectedNote('fs_lustre_hpc')}
                            className={`acad-dir-item-btn ${selectedNote === 'fs_lustre_hpc' ? 'acad-active' : ''}`}
                          >
                            3.1 FSx for Lustre &amp; S3 AI Ingest (F1 Rocket Engine)
                          </button>
                          <button 
                            onClick={() => setSelectedNote('fs_openzfs_clones')}
                            className={`acad-dir-item-btn ${selectedNote === 'fs_openzfs_clones' ? 'acad-active' : ''}`}
                          >
                            3.2 FSx for OpenZFS &amp; Instant Cloning (Sandbox Clone)
                          </button>
                        </div>
                      )}
                    </div>

                    {/* LEVEL 4: HYBRID GATEWAYS & MIGRATION */}
                    <div>
                      <button 
                        onClick={() => setExpandedCategory(expandedCategory === 'fs_hybrid_migration' ? '' : 'fs_hybrid_migration')}
                        className="acad-dir-folder-btn"
                      >
                        <span className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-purple-500" />
                          🔌 Level 4 · Hybrid &amp; Migration
                        </span>
                        {expandedCategory === 'fs_hybrid_migration' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                      {expandedCategory === 'fs_hybrid_migration' && (
                        <div className="py-1 font-semibold" style={{ background: 'var(--color-background-primary)' }}>
                          <button 
                            onClick={() => setSelectedNote('fs_storage_gateway')}
                            className={`acad-dir-item-btn ${selectedNote === 'fs_storage_gateway' ? 'acad-active' : ''}`}
                          >
                            4.1 AWS Storage Gateway (Local Caching Bridge)
                          </button>
                          <button 
                            onClick={() => setSelectedNote('fs_datasync_snow')}
                            className={`acad-dir-item-btn ${selectedNote === 'fs_datasync_snow' ? 'acad-active' : ''}`}
                          >
                            4.2 AWS DataSync &amp; Snow Family (Armored Data Vaults)
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                  <div className="acad-advice-box rounded-2xl p-4 text-[11px] leading-relaxed font-semibold space-y-1">
                    <span className="font-extrabold flex items-center gap-1.5 mb-1 text-[11.5px]" style={{ color: 'var(--color-text-primary)' }}>
                      <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Interactive Quick-Launch
                    </span>
                    Click any cloud storage concept to explore real-world analogies, interactive pricing calculators, and direct simulator links!
                  </div>
                </div>

                {/* Right Active Note Workspace */}
                <div className="lg:col-span-9 space-y-6 text-left">

                  {/* NOTE 1.1: FILE VS BLOCK VS OBJECT */}
                  {selectedNote === 'fs_block_file_object' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🐣 Level 1 · Fundamentals</span>
                          <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                            1.1 File Storage (EFS) vs Block Storage (EBS) vs Object Storage (S3)
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveTab('overview')}
                            className="fs-btn fs-on"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Zap className="w-3.5 h-3.5" /> Go to File Basics Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> AWS offers 3 main storage paradigms:
                        <br />• <strong>Block Storage (EBS)</strong>: A dedicated virtual hard drive attached to exactly 1 EC2 instance for operating systems and databases.
                        <br />• <strong>File Storage (EFS / FSx)</strong>: A shared network folder mounted simultaneously by thousands of servers with folders and file hierarchies (POSIX/SMB/NFS).
                        <br />• <strong>Object Storage (S3)</strong>: A flat web-accessible bucket for unlimited files with unique URL keys and HTTP GET/PUT APIs.
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Personal Laptop SSD vs Family Whiteboard vs Public Library
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          • <strong>EBS (Personal Internal Laptop SSD)</strong>: Only you can plug into your laptop. Super fast, but cannot be physically attached to 50 computers at once.
                          <br />• <strong>EFS (Family Kitchen Whiteboard)</strong>: Mounted in the hallway where all 5 family members (EC2 / Lambda) can read, write, and erase grocery items simultaneously!
                          <br />• <strong>S3 (Public City Library)</strong>: You hand a ticket number at the checkout desk to receive a complete book. You cannot edit 1 sentence inside the book on the shelf; you must replace the whole book.
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="acad-table">
                          <thead>
                            <tr>
                              <th>Storage Type</th>
                              <th>AWS Service</th>
                              <th>Concurrent Clients</th>
                              <th>Access Method</th>
                              <th>Max Throughput</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>Block Storage</strong></td>
                              <td>Amazon EBS</td>
                              <td>1 EC2 Instance (Single-AZ)</td>
                              <td>OS Raw Block Device</td>
                              <td>Up to 4,000 MB/s (io2 Block Express)</td>
                            </tr>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>File Storage</strong></td>
                              <td>Amazon EFS / FSx</td>
                              <td>Thousands of EC2/Containers/Lambda</td>
                              <td>NFSv4 / SMB / POSIX File Tree</td>
                              <td>10+ GB/s (EFS) / Hundreds GB/s (Lustre)</td>
                            </tr>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>Object Storage</strong></td>
                              <td>Amazon S3</td>
                              <td>Millions of Global Web Clients</td>
                              <td>REST API (HTTPS GET/PUT)</td>
                              <td>Virtually Unlimited (Multi-GB/s)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* NOTE 1.2: AMAZON EFS SCALING & LIFECYCLE */}
                  {selectedNote === 'fs_efs_scaling' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🐣 Level 1 · Fundamentals</span>
                          <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                            1.2 Amazon EFS Elastic Scaling &amp; Automated Lifecycle (Save 92%)
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveTab('overview')}
                            className="fs-btn fs-on"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Zap className="w-3.5 h-3.5" /> Go to File Basics Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> **Amazon EFS** is a fully serverless, automatically elastic NFS file system. You never provision drive size or manage storage capacity—it automatically grows when you add files and shrinks when you delete files. **EFS Lifecycle Management** automatically moves files you haven&apos;t opened in 30 days to the **EFS Infrequent Access (IA)** tier—cutting your monthly storage bill by <strong>92%</strong>!
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Self-Expanding Elastic Accordion Folder
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          Instead of buying a bulky 500-page binder that sits 90% empty, you have a magic accordion folder that expands instantly when you drop 100 receipts into it, and contracts to paper-thin when you take them out. When receipts get older than 30 days, an invisible butler moves them to a cheap storage box in the basement ($0.025/GB) without changing the folder index!
                        </p>
                      </div>

                      {/* Interactive EFS Pricing Calculator */}
                      <div className="fs-card p-4 rounded-xl space-y-3" style={{ border: '1px solid var(--fs-border-primary)' }}>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider block" style={{ color: 'var(--color-text-tertiary)' }}>Interactive EFS Storage Cost &amp; Lifecycle Savings Calculator</span>
                        
                        <div className="space-y-2 text-xs">
                          <div>
                            <div className="flex justify-between font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                              <span>Total Shared Storage: {nbStorageGb.toLocaleString()} GB ({(nbStorageGb / 1000).toFixed(1)} TB)</span>
                            </div>
                            <input 
                              type="range" 
                              min="100" 
                              max="20000" 
                              step="100" 
                              value={nbStorageGb} 
                              onChange={(e) => setNbStorageGb(parseInt(e.target.value))}
                              className="accent-emerald-600 w-full"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                              <span>Infrequent Access (IA) Cold Tier Proportion: {nbEfsIaPercent}%</span>
                            </div>
                            <input 
                              type="range" 
                              min="0" 
                              max="95" 
                              step="5" 
                              value={nbEfsIaPercent} 
                              onChange={(e) => setNbEfsIaPercent(parseInt(e.target.value))}
                              className="accent-emerald-600 w-full"
                            />
                          </div>
                        </div>

                        {(() => {
                          const standardGb = nbStorageGb * ((100 - nbEfsIaPercent) / 100);
                          const iaGb = nbStorageGb * (nbEfsIaPercent / 100);
                          const allStandardCost = nbStorageGb * 0.30;
                          const blendedCost = (standardGb * 0.30) + (iaGb * 0.025);
                          const savingsPercent = ((allStandardCost - blendedCost) / allStandardCost) * 100;
                          return (
                            <div className="p-3 rounded-lg font-mono text-[10.5px] space-y-1.5" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--fs-border-primary)' }}>
                              <p>100% EFS Standard Cost: <span className="text-amber font-bold">${allStandardCost.toFixed(2)} / month</span> ($0.30/GB)</p>
                              <p>With EFS Lifecycle (Blended IA): <span className="text-emerald-500 font-bold">${blendedCost.toFixed(2)} / month</span></p>
                              <p>Monthly Dollar Savings: <span className="text-green font-bold">${(allStandardCost - blendedCost).toFixed(2)}/mo saved ({savingsPercent.toFixed(1)}% reduction!)</span></p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* NOTE 2.1: FSX FOR WINDOWS SMB */}
                  {selectedNote === 'fs_windows_smb' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🗄️ Level 2 · Windows &amp; ONTAP</span>
                          <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                            2.1 FSx for Windows File Server (Enterprise Active Directory &amp; SMB)
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveTab('windows')}
                            className="fs-btn fs-on"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Zap className="w-3.5 h-3.5" /> Go to Windows Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> Enterprise Windows applications require native Windows features like **SMB protocol (v2.0 to 3.1.1)**, Microsoft Active Directory integration, Windows NTFS permissions (ACLs), and **Shadow Copies** for self-service file restores. **Amazon FSx for Windows File Server** provides a fully managed native Windows Server file system with automatic Multi-AZ failover and data deduplication saving 50–60% storage space!
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Corporate Office Z: Drive with Employee ID Badges
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          When you open your work laptop at a Fortune 500 company and double-click <code>Z:\Shared\Finance\Q3_Report.xlsx</code>, your computer authenticates against Active Directory using your corporate ID. If an employee accidentally overwrites a spreadsheet, they right-click &rarr; &ldquo;Restore Previous Versions&rdquo; (Shadow Copies) to retrieve yesterday&apos;s copy in 5 seconds without calling IT support!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>Enterprise Features Included:</h4>
                          
                          <ul className="list-disc pl-4 space-y-2">
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Active Directory Integration:</strong> Join AWS Managed Microsoft AD or your existing on-premises Active Directory.</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Multi-AZ High Availability:</strong> Synchronous continuous replication to a standby file server in a 2nd Availability Zone with automatic sub-minute failover.</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Data Deduplication:</strong> Automatically finds and eliminates duplicate chunks across thousands of user home directories, cutting storage requirements in half.</li>
                          </ul>
                        </div>

                        <div className="fs-card p-4 rounded-xl flex flex-col justify-between">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--color-text-tertiary)' }}>Windows PowerShell Mount</span>
                            <button 
                              onClick={() => {
                                const snippet = `New-PSDrive -Name "Z" -PSProvider FileSystem -Root "\\\\fs-12345678.corp.example.com\\share" -Persist`;
                                navigator.clipboard.writeText(snippet);
                                setCopiedNoteId('win-mount');
                                setTimeout(() => setCopiedNoteId(null), 2000);
                              }}
                              className="fs-btn text-[10px] p-1 flex items-center gap-1"
                            >
                              {copiedNoteId === 'win-mount' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                          <pre className="acad-terminal text-[10px] leading-relaxed overflow-x-auto h-36">
{`# 1. Map Network Drive to FSx for Windows
New-PSDrive -Name "Z" \\
  -PSProvider FileSystem \\
  -Root "\\\\fs-1234.corp.local\\share" \\
  -Persist

# 2. Enable Data Deduplication
Enable-FSxDataDeduplication`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NOTE 2.2: FSX FOR NETAPP ONTAP */}
                  {selectedNote === 'fs_netapp_ontap' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🗄️ Level 2 · Windows &amp; ONTAP</span>
                          <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                            2.2 FSx for NetApp ONTAP (Multi-Protocol NFS + SMB + iSCSI)
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveTab('windows')}
                            className="fs-btn fs-on"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Zap className="w-3.5 h-3.5" /> Go to ONTAP Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> Thousands of enterprise datacenters run on NetApp ONTAP. **Amazon FSx for NetApp ONTAP** brings complete native ONTAP storage to AWS. It is a true **multi-protocol powerhouse**—allowing Linux (NFS), Windows (SMB), and Block storage (iSCSI) to access the exact same dataset concurrently, with automatic intelligent tiering to elastic NVMe and S3 storage!
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Universal Multi-Language Diplomatic Translator
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          Imagine a United Nations negotiation table where a French delegate speaks French (Linux NFS), an English delegate speaks English (Windows SMB), and an engineer transmits binary Morse code (iSCSI Block). NetApp ONTAP seamlessly translates between all 3 in real-time, letting everyone collaborate on the same master document without converting files!
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="acad-table">
                          <thead>
                            <tr>
                              <th>Feature</th>
                              <th>FSx for NetApp ONTAP</th>
                              <th>Standard EFS</th>
                              <th>FSx for Windows</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>Protocols Supported</strong></td>
                              <td>NFSv3, NFSv4, SMB 2/3, iSCSI Block, NVMe-oF</td>
                              <td>NFSv4.0 &amp; NFSv4.1 only</td>
                              <td>SMB 2.0 to 3.1.1 only</td>
                            </tr>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>Deduplication &amp; Compression</strong></td>
                              <td>✅ Yes (65%+ reduction across blocks)</td>
                              <td>❌ No</td>
                              <td>✅ Yes (NTFS Dedup)</td>
                            </tr>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>Replication Engine</strong></td>
                              <td>NetApp SnapMirror (Direct on-prem sync)</td>
                              <td>AWS Backup / EFS Replication</td>
                              <td>DFS Replication / AWS Backup</td>
                            </tr>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>Automatic Storage Tiering</strong></td>
                              <td>Primary SSD Tier &rarr; Elastic Capacity Pool (S3)</td>
                              <td>EFS Standard &rarr; EFS-IA</td>
                              <td>SSD &rarr; HDD Tiers</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* NOTE 3.1: FSX FOR LUSTRE */}
                  {selectedNote === 'fs_lustre_hpc' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🚀 Level 3 · Lustre &amp; OpenZFS</span>
                          <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                            3.1 FSx for Lustre &amp; Direct S3 AI/ML Ingest (Hundreds of GB/s)
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveTab('lustre')}
                            className="fs-btn fs-on"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Zap className="w-3.5 h-3.5" /> Go to Lustre Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> Training deep learning neural networks (LLMs, computer vision) and running scientific simulations require massive bandwidth (hundreds of Gigabytes per second with sub-millisecond latencies). **Amazon FSx for Lustre** is an ultra-high performance POSIX file system that links directly to your S3 bucket—**lazy-loading files on demand** so GPU clusters can train immediately without waiting hours for data to copy!
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Formula 1 High-Flow Fuel Pump Feeding 1,000 HP Racecars
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          Standard S3 is like a giant fuel storage lake (cheap, vast, 100 TBs). But 256 NVIDIA H100 GPUs are like a Formula 1 racing engine requiring 500 liters of fuel per second. FSx for Lustre is the <strong>high-pressure turbo pump</strong> that connects directly to the S3 lake, streaming gigabytes of training data into GPU memory at lightspeed!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>Lustre Deployment Options:</h4>
                          
                          <div className="p-3 rounded-lg space-y-1" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--fs-border-primary)' }}>
                            <strong className="text-amber font-bold block">1. Scratch File System (Temporary HPC):</strong>
                            <p>Designed for cost-optimized short-term processing (e.g. 4-hour batch ML training job). Data is not replicated across servers; after the job finishes, results sync to S3 and the cluster is deleted!</p>
                          </div>
                          <div className="p-3 rounded-lg space-y-1" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--fs-border-primary)' }}>
                            <strong className="text-emerald-600 font-bold block">2. Persistent File System (Long-Term):</strong>
                            <p>Data is automatically replicated within the Availability Zone for multi-month financial modeling and autonomous vehicle processing.</p>
                          </div>
                        </div>

                        <div className="fs-card p-4 rounded-xl flex flex-col justify-center text-center font-mono text-xs">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-tertiary)' }}>POSIX Lustre Mount Command</span>
                          
                          <pre className="acad-terminal text-[9.5px] leading-relaxed text-left overflow-x-auto">
{`# 1. Install Lustre client drivers
sudo amazon-linux-extras install -y lustre

# 2. Create mount directory
sudo mkdir -p /mnt/fsx_lustre

# 3. Mount filesystem linked to S3
sudo mount -t lustre -o noatime,flock \\
  fs-01234567.fsx.us-east-1.amazonaws.com@tcp:/fsx \\
  /mnt/fsx_lustre`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NOTE 3.2: FSX FOR OPENZFS */}
                  {selectedNote === 'fs_openzfs_clones' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🚀 Level 3 · Lustre &amp; OpenZFS</span>
                          <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                            3.2 FSx for OpenZFS &amp; Sub-Second Snapshot Cloning
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveTab('lustre')}
                            className="fs-btn fs-on"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Zap className="w-3.5 h-3.5" /> Go to OpenZFS Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> **Amazon FSx for OpenZFS** delivers up to <strong>1 million IOPS and sub-half-millisecond (0.5ms) latencies</strong> powered by NVMe SSDs. Its killer feature is **Instant Copy-on-Write Snapshot Cloning**—allowing software development teams to spawn 50 identical isolated test environments from a 10 TB production database in <strong>under 1 second with 0 extra storage cost</strong>!
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Git Branching for a 10 Terabyte Hard Drive
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          Instead of waiting 4 hours to copy a 10 TB production disk for 50 developers to test a new code patch, OpenZFS creates 50 instant &ldquo;Git-like branches&rdquo; of the entire 10 TB filesystem instantly. Developers can write, test, delete, and corrupt their sandbox clone without affecting the master production database!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>OpenZFS Superpowers:</h4>
                          
                          <ul className="list-disc pl-4 space-y-2">
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>1,000,000+ IOPS:</strong> Highest per-volume performance of any general NFS file system on AWS.</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Sub-Millisecond NVMe Cache:</strong> Reads hot application data directly from NVMe caching layers in under 0.5 ms.</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Zstandard (ZSTD) Compression:</strong> High-speed inline data compression reducing storage footprints by up to 50%.</li>
                          </ul>
                        </div>

                        <div className="fs-card p-4 rounded-xl flex flex-col justify-center text-center font-mono text-xs">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-tertiary)' }}>OpenZFS Performance Metrics</span>
                          
                          <div className="space-y-2 text-left text-[10px]">
                            <div className="p-2 rounded flex justify-between" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #86efac' }}>
                              <span className="font-bold text-green">Read Latency:</span>
                              <span className="text-green font-bold">&lt; 0.5 ms (Sub-half millisecond)</span>
                            </div>
                            <div className="p-2 rounded flex justify-between" style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid #7dd3fc' }}>
                              <span className="font-bold text-blue">Throughput:</span>
                              <span className="text-blue font-bold">Up to 21 GB/s</span>
                            </div>
                            <div className="p-2 rounded flex justify-between" style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid #c084fc' }}>
                              <span className="font-bold text-purple">Snapshot Speed:</span>
                              <span className="text-purple font-bold">&lt; 1 second for 10+ TB</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NOTE 4.1: AWS STORAGE GATEWAY */}
                  {selectedNote === 'fs_storage_gateway' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🔌 Level 4 · Hybrid &amp; Migration</span>
                          <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                            4.1 AWS Storage Gateway (Volume, File &amp; Tape Gateways)
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveTab('hybrid')}
                            className="fs-btn fs-on"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Zap className="w-3.5 h-3.5" /> Go to Hybrid Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> Many companies have on-premises datacenters and cannot move all servers to AWS overnight. **AWS Storage Gateway** is a hybrid appliance (deployed as a VMware/Hyper-V virtual machine or hardware server) that provides <strong>local low-latency caching in your office</strong> while automatically backing up all data seamlessly to Amazon S3!
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Local Office Refrigerator Connected to a Central Grocery Warehouse
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          Instead of your office employees driving 45 minutes to the central grocery warehouse (AWS S3) every time they want a sandwich, you have a <strong>smart office refrigerator (Storage Gateway)</strong> stocked with today&apos;s food. When workers put new leftovers in the fridge, it automatically syncs a copy to the cloud warehouse in the background!
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="acad-table">
                          <thead>
                            <tr>
                              <th>Gateway Type</th>
                              <th>Local Protocol</th>
                              <th>Cloud Backend</th>
                              <th>Best Use Case</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>Amazon S3 File Gateway</strong></td>
                              <td>NFS &amp; SMB</td>
                              <td>Amazon S3 Buckets</td>
                              <td>On-prem apps writing files directly into S3</td>
                            </tr>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>Amazon FSx File Gateway</strong></td>
                              <td>SMB</td>
                              <td>FSx for Windows File Server</td>
                              <td>Low-latency local Windows file shares</td>
                            </tr>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>Volume Gateway (Cached)</strong></td>
                              <td>iSCSI Block Storage</td>
                              <td>Amazon S3 + EBS Snapshots</td>
                              <td>Local on-prem hard drives backed by S3</td>
                            </tr>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>Tape Gateway (VTL)</strong></td>
                              <td>iSCSI VTL (Virtual Tape Library)</td>
                              <td>S3 Glacier &amp; Deep Archive</td>
                              <td>Replacing physical magnetic tape backup robots</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* NOTE 4.2: DATASYNC & SNOW FAMILY */}
                  {selectedNote === 'fs_datasync_snow' && (
                    <div className="acad-detail-card space-y-5 animate-fadeIn">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                        <div>
                          <span className="acad-hero-badge">🔌 Level 4 · Hybrid &amp; Migration</span>
                          <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                            4.2 AWS DataSync vs AWS Snow Family (Petabyte Offline Transport)
                          </h3>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setActiveTab('hybrid')}
                            className="fs-btn fs-on"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            <Zap className="w-3.5 h-3.5" /> Go to Migration Tab
                          </button>
                        </div>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> Moving massive data into AWS depends on network bandwidth. **AWS DataSync** is an automated high-speed transfer software that maximizes your internet/Direct Connect connection (up to 10x faster than rsync). But when moving **100 Terabytes to Exabytes**, internet transfers would take months—so you use the **AWS Snow Family** (rugged physical appliances shipped by courier)!
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Fiber-Optic High-Speed Highway vs Armored Suitcase on an Airplane
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          • <strong>AWS DataSync</strong>: A dedicated multi-lane high-speed fiber tunnel streaming water pipes continuously into AWS.
                          <br />• <strong>AWS Snowball Edge</strong>: An armored, weather-proof steel suitcase holding 80 TB delivered by FedEx. You plug it into your datacenter, load 80 TB in a few hours, and FedEx flies the suitcase straight into the AWS datacenter!
                          <br />• <strong>AWS Snowmobile</strong>: A 45-foot rugged semi-trailer truck driven to your datacenter that holds <strong>100 Petabytes</strong> of data!
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>When to Use Online vs Offline Migration:</h4>
                          
                          <ul className="list-disc pl-4 space-y-2">
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Data &lt; 10 TB (Fast Network):</strong> Use <strong>AWS DataSync</strong> over internet or Direct Connect.</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Data 10 TB to 10 Petabytes:</strong> Order <strong>AWS Snowball Edge</strong> (80 TB or 210 TB per device) via courier.</li>
                            <li><strong style={{ color: 'var(--color-text-primary)' }}>Data &gt; 10 Petabytes (Exabyte Scale):</strong> Request the <strong>AWS Snowmobile</strong> semi-truck.</li>
                          </ul>
                        </div>

                        <div className="fs-card p-4 rounded-xl flex flex-col justify-center text-center font-mono text-xs">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-tertiary)' }}>Snow Family Hardware Specs</span>
                          
                          <div className="space-y-2 text-left text-[10px]">
                            <div className="p-2 rounded" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #86efac' }}>
                              <p className="font-bold text-green">AWS Snowcone (Pocket Sized):</p>
                              <span>8 TB HDD / 14 TB SSD · Lightweight (4.5 lbs) · Battery powered</span>
                            </div>
                            <div className="p-2 rounded" style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid #7dd3fc' }}>
                              <p className="font-bold text-blue">AWS Snowball Edge (Armored Vault):</p>
                              <span>80 TB Storage Optimized / Compute with GPU for edge AI</span>
                            </div>
                            <div className="p-2 rounded" style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid #c084fc' }}>
                              <p className="font-bold text-purple">AWS Snowmobile (45-foot Semi Truck):</p>
                              <span>100 Petabytes per truck · Tamper-proof, climate-controlled</span>
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
                <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--fs-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--fs-svg-text-origin)' }}>Local File System Internals</div>
                  
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

                <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--fs-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--fs-svg-text-inode)' }}>Network Sharing Protocols</div>

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
              <div style={{ border: '1.5px solid var(--fs-card-border)', borderRadius: '16px', padding: '16px', background: 'var(--color-background-primary)', boxShadow: 'inset 0 0 12px rgba(0,0,0,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>⚙️</span> How POSIX Paths Map through Inode Indexes to Physical Block Storage
                  </div>
                  <button 
                    className={`fs-btn ${tab1TraceActive ? 'fs-warning' : 'fs-primary'}`} 
                    style={{ padding: '6px 12px', fontSize: '11.5px' }} 
                    onClick={handleTab1Trace}
                    disabled={tab1TraceActive}
                  >
                    {tab1TraceActive ? '⌛ Resolving Inodes...' : '🔍 Trace POSIX Lookup Path'}
                  </button>
                </div>

                <svg width="100%" viewBox="0 0 760 160" className="fs-svg-bg" style={{ borderRadius: '12px', border: '1.5px solid var(--fs-card-border)' }}>
                  <defs>
                    <marker id="acn-fs" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--fs-svg-text-origin)" /></marker>
                    <marker id="acn-purple-trace" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--fs-svg-text-inode)" /></marker>
                    <linearGradient id="grad-client" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-background-primary)" />
                      <stop offset="100%" stopColor="var(--color-background-secondary)" />
                    </linearGradient>
                    <linearGradient id="grad-inode" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-background-primary)" />
                      <stop offset="100%" stopColor="var(--fs-svg-node-stroke-inode)" />
                    </linearGradient>
                    <filter id="shadow-fs" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#94a3b8" floodOpacity="0.1" />
                    </filter>
                  </defs>

                  {/* Client OS Level */}
                  <g filter="url(#shadow-fs)">
                    <rect x="20" y="30" width="160" height="100" rx="8" fill="var(--fs-svg-node-bg)" stroke={tab1TraceStep === 1 || tab1TraceStep === 4 ? 'var(--fs-svg-text-client)' : 'var(--fs-svg-node-stroke)'} strokeWidth={tab1TraceStep === 1 || tab1TraceStep === 4 ? 2 : 1} />
                    <text x="100" y="46" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--color-text-secondary)">💻 Client App Level</text>
                    <rect x="35" y="65" width="130" height="25" rx="6" fill="var(--fs-svg-node-fill-client)" stroke="var(--fs-svg-node-stroke-client)" strokeWidth="1" />
                    <text x="100" y="81" textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--fs-svg-text-client)">Path: /var/log/app.log</text>
                    <text x="100" y="112" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="var(--color-text-tertiary)">File System Mount Point</text>
                  </g>

                  {/* Inode Resolution Index */}
                  <g filter="url(#shadow-fs)">
                    <rect x="250" y="30" width="220" height="100" rx="8" fill="var(--fs-svg-node-bg)" stroke={tab1TraceStep === 2 ? 'var(--fs-svg-text-inode)' : 'var(--fs-svg-node-stroke)'} strokeWidth={tab1TraceStep === 2 ? 2 : 1} />
                    <text x="360" y="46" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--color-text-secondary)">⚙️ Metadata / Inode Table</text>
                    
                    {/* Inode entry box */}
                    <rect x="265" y="60" width="190" height="55" rx="6" fill="var(--fs-svg-node-fill-inode)" stroke={tab1TraceStep === 2 ? 'var(--fs-svg-text-inode)' : 'var(--fs-svg-node-stroke-inode)'} strokeWidth={1} />
                    <text x="275" y="73" textAnchor="start" fontSize="8.5" fontWeight="800" fill="var(--fs-svg-text-inode)">Inode #401039 (File: app.log)</text>
                    <text x="275" y="86" textAnchor="start" fontSize="7.5" fontWeight="500" fill="var(--fs-svg-text-inode)">Size: 450 KB | Owner: root</text>
                    <text x="275" y="96" textAnchor="start" fontSize="7.5" fontWeight="500" fill="var(--fs-svg-text-inode)">Permissions: rw-r--r-- (POSIX)</text>
                    <text x="275" y="106" textAnchor="start" fontSize="7.5" fontWeight="600" fill="var(--fs-svg-text-inode)">Pointers: Block 55, Block 56, Block 57</text>
                  </g>

                  {/* Physical storage blocks */}
                  <g filter="url(#shadow-fs)">
                    <rect x="540" y="30" width="200" height="100" rx="8" fill="var(--fs-svg-node-bg)" stroke={tab1TraceStep === 3 ? 'var(--fs-svg-text-block)' : 'var(--fs-svg-node-stroke)'} strokeWidth={tab1TraceStep === 3 ? 2 : 1} />
                    <text x="640" y="46" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--color-text-secondary)">🗄️ Physical Block Storage</text>

                    {/* Block 55 */}
                    <g opacity={tab1TraceStep === 3 || tab1TraceStep === 4 ? 1 : 0.75}>
                      <rect x="555" y="60" width="50" height="25" rx="4" fill="var(--fs-svg-node-fill-block)" stroke={tab1TraceStep === 3 ? 'var(--fs-svg-text-block)' : 'var(--fs-svg-node-stroke-block)'} strokeWidth={1.5} />
                      <text x="580" y="73" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="800" fill="var(--fs-svg-text-block)">Block 55</text>
                    </g>

                    {/* Block 56 */}
                    <g opacity={tab1TraceStep === 3 || tab1TraceStep === 4 ? 1 : 0.75}>
                      <rect x="615" y="60" width="50" height="25" rx="4" fill="var(--fs-svg-node-fill-block)" stroke={tab1TraceStep === 3 ? 'var(--fs-svg-text-block)' : 'var(--fs-svg-node-stroke-block)'} strokeWidth={1.5} />
                      <text x="640" y="73" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="800" fill="var(--fs-svg-text-block)">Block 56</text>
                    </g>

                    {/* Block 57 */}
                    <g opacity={tab1TraceStep === 3 || tab1TraceStep === 4 ? 1 : 0.75}>
                      <rect x="675" y="60" width="50" height="25" rx="4" fill="var(--fs-svg-node-fill-block)" stroke={tab1TraceStep === 3 ? 'var(--fs-svg-text-block)' : 'var(--fs-svg-node-stroke-block)'} strokeWidth={1.5} />
                      <text x="700" y="73" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="800" fill="var(--fs-svg-text-block)">Block 57</text>
                    </g>

                    <text x="640" y="112" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="var(--color-text-tertiary)">NVMe SSD Hardware Sectors</text>
                  </g>

                  {/* Connectors */}
                  <path d="M 180 80 L 250 80" fill="none" stroke={tab1TraceStep >= 1 ? 'var(--fs-svg-text-client)' : 'var(--fs-svg-node-stroke)'} strokeWidth="1.5" markerEnd="url(#acn-fs)" />
                  <path d="M 470 80 L 540 80" fill="none" stroke={tab1TraceStep >= 3 ? 'var(--fs-svg-text-inode)' : 'var(--fs-svg-node-stroke)'} strokeWidth="1.5" markerEnd="url(#acn-purple-trace)" />
                  <text x="215" y="71" textAnchor="middle" fontSize="8" fill="var(--fs-svg-text-client)" fontWeight="700">Mount Lookup</text>
                  <text x="505" y="71" textAnchor="middle" fontSize="8" fill="var(--fs-svg-text-inode)" fontWeight="700">Fetch Blocks</text>

                  {/* Trace animation dot */}
                  {tab1TraceActive && (
                    <circle r="4" fill={tab1TraceStep === 1 ? 'var(--fs-svg-text-client)' : tab1TraceStep === 2 ? 'var(--fs-svg-text-inode)' : tab1TraceStep === 3 ? 'var(--fs-svg-text-block)' : 'var(--fs-svg-text-origin)'}>
                      <animateMotion 
                        dur="0.8s" 
                        repeatCount="indefinite"
                        path={
                          tab1TraceStep === 1 ? "M 180 80 L 250 80" :
                          tab1TraceStep === 2 ? "M 265 85 Q 360 110 455 85" :
                          tab1TraceStep === 3 ? "M 470 80 L 540 80" :
                          tab1TraceStep === 4 ? "M 540 95 L 180 95" : "M 180 80 L 250 80"
                        }
                      />
                    </circle>
                  )}
                </svg>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Windows & ONTAP */}
        {activeTab === 'windows' && (
          <div>
            <div className="fs-sec">Managed Windows Storage &amp; Enterprise NetApp ONTAP Volumes</div>
            <div className="fs-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                Amazon FSx delivers highly scalable, managed shared filesystems supporting popular legacy enterprise formats. You can mount Windows shares cleanly or leverage NetApp’s complex block/file capabilities inside AWS.
              </div>

              <div className="fs-grid2">
                {/* FSx for Windows */}
                <div style={{ background: 'var(--color-background-secondary)', border: '1.5px solid var(--fs-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--fs-svg-text-client)' }}>Amazon FSx for Windows File Server</div>
                  
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
                <div style={{ background: 'var(--color-background-secondary)', border: '1.5px solid var(--fs-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--fs-svg-text-inode)' }}>Amazon FSx for NetApp ONTAP</div>

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
              <div style={{ border: '1.5px solid var(--fs-card-border)', borderRadius: '16px', padding: '16px', background: 'var(--color-background-primary)', marginTop: '14px', boxShadow: 'inset 0 0 12px rgba(0,0,0,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🗄️</span> FSx for Windows File Server (Active/Passive Multi-AZ Synchronous Replication)
                  </div>
                  <button 
                    className={`fs-btn ${azFailed ? 'fs-warning' : 'fs-danger'}`} 
                    style={{ padding: '6px 12px', fontSize: '11.5px' }} 
                    onClick={handleTriggerFailover}
                  >
                    {azFailed ? '🔄 Recover Primary Node (AZ-a)' : '⚠️ Inject AZ-a Outage Failover'}
                  </button>
                </div>

                <svg width="100%" viewBox="0 0 760 180" className="fs-svg-bg" style={{ borderRadius: '12px', border: '1.5px solid var(--fs-card-border)' }}>
                  <defs>
                    <marker id="acn-blue-fs" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--fs-svg-text-client)" /></marker>
                    <marker id="acn-orange-fs2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--fs-svg-text-origin)" /></marker>
                    <marker id="acn-green-fs" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--fs-svg-node-stroke-origin)" /></marker>
                    <linearGradient id="grad-win-client" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--fs-alert-green-bg)" />
                      <stop offset="100%" stopColor="var(--fs-svg-node-fill-origin)" />
                    </linearGradient>
                    <linearGradient id="grad-active-node" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--fs-svg-node-fill-client)" />
                      <stop offset="100%" stopColor="var(--fs-svg-node-stroke-client)" />
                    </linearGradient>
                    <linearGradient id="grad-failed-node" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--fs-alert-red-bg)" />
                      <stop offset="100%" stopColor="var(--fs-svg-node-fill-crashed)" />
                    </linearGradient>
                    <filter id="shadow-fs-win" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="var(--fs-svg-node-stroke)" floodOpacity="0.1" />
                    </filter>
                  </defs>

                  {/* VPC boundary */}
                  <rect x="15" y="10" width="730" height="160" rx="8" fill="none" stroke="var(--fs-svg-node-stroke)" strokeDasharray="3,3" />
                  <text x="380" y="22" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--color-text-tertiary)">VPC (Virtual Private Cloud)</text>

                  {/* Subnet A */}
                  <rect x="25" y="35" width="220" height="120" rx="8" fill="none" stroke={azFailed ? 'var(--fs-svg-node-stroke-crashed)' : 'var(--fs-svg-node-stroke-client)'} strokeWidth={1.5} strokeDasharray={azFailed ? '4,4' : ''} />
                  <text x="135" y="48" textAnchor="middle" fontSize="9" fontWeight="700" fill={azFailed ? 'var(--fs-svg-text-crashed)' : 'var(--fs-svg-text-client)'}>
                    Availability Zone a (AZ-a) {azFailed && '⚠️ [OUTAGE]'}
                  </text>
                  
                  <g filter="url(#shadow-fs-win)">
                    <rect x="40" y="65" width="190" height="70" rx="6" fill={azFailed ? 'url(#grad-failed-node)' : 'url(#grad-active-node)'} stroke={azFailed ? 'var(--fs-svg-node-stroke-crashed)' : 'var(--fs-svg-node-stroke-client)'} strokeWidth={1.5} />
                    <text x="135" y="80" textAnchor="middle" fontSize="9.5" fontWeight="800" fill={azFailed ? 'var(--fs-svg-text-crashed)' : 'var(--fs-svg-text-client)'}>
                      {azFailed ? '❌ Node Offline' : '🖥️ Primary Active Node'}
                    </text>
                    <text x="135" y="94" textAnchor="middle" fontSize="7.5" fill={azFailed ? 'var(--fs-svg-text-crashed)' : 'var(--fs-svg-text-client)'} fontWeight="600">SSD Storage Share | Active DNS Target</text>
                    <text x="135" y="116" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={azFailed ? 'var(--fs-svg-text-crashed)' : 'var(--fs-svg-text-origin)'}>
                      STATUS: {azFailed ? 'CRASHED (FAILOVER ACTIVE)' : 'ONLINE & HEALTHY'}
                    </text>
                  </g>

                  {/* Subnet B */}
                  <rect x="515" y="35" width="220" height="120" rx="8" fill="none" stroke="var(--fs-svg-node-stroke-client)" strokeWidth={1.5} />
                  <text x="625" y="48" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--fs-svg-text-client)">Availability Zone b (AZ-b)</text>
                  
                  <g filter="url(#shadow-fs-win)">
                    <rect x="530" y="65" width="190" height="70" rx="6" fill={azFailed ? 'url(#grad-active-node)' : 'var(--color-background-primary)'} stroke={azFailed ? 'var(--fs-svg-node-stroke-origin)' : 'var(--fs-svg-node-stroke-standby)'} strokeWidth={1.5} />
                    <text x="625" y="80" textAnchor="middle" fontSize="9.5" fontWeight="800" fill={azFailed ? 'var(--fs-svg-text-origin)' : 'var(--fs-svg-text-standby)'}>
                      {azFailed ? '👑 Promoted Active Node' : '🛡️ Standby Passive Node'}
                    </text>
                    <text x="625" y="94" textAnchor="middle" fontSize="7.5" fill={azFailed ? 'var(--fs-svg-text-client)' : 'var(--fs-svg-text-standby)'} fontWeight="600">
                      {azFailed ? 'Active DNS Target | Mounted Share' : 'Standby disk volume | Standby DNS'}
                    </text>
                    <text x="625" y="116" textAnchor="middle" fontSize="8.5" fontWeight="700" fill={azFailed ? 'var(--fs-svg-text-origin)' : 'var(--fs-svg-text-standby)'}>
                      STATUS: {azFailed ? 'PROMOTED PRIMARY' : 'IDLE REPLICA (STANDBY)'}
                    </text>
                  </g>

                  {/* Client / VPC Router */}
                  <g filter="url(#shadow-fs-win)">
                    <rect x="300" y="65" width="160" height="70" rx="8" fill="url(#grad-win-client)" stroke="var(--fs-svg-node-stroke-origin)" strokeWidth="1.5" />
                    <text x="380" y="80" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="var(--fs-svg-text-origin)">🏢 Client Workspace</text>
                    <text x="380" y="94" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-origin)" fontWeight="600">Targeting: \\fsx-win-corp\share</text>
                    <text x="380" y="116" textAnchor="middle" fontSize="8.5" fontWeight="700" fill="var(--fs-svg-text-origin)">SMB v3 Connection</text>
                  </g>

                  {/* Connections */}
                  {/* Client -> Primary */}
                  {!azFailed ? (
                    <g>
                      <path d="M 300 90 L 235 90" fill="none" stroke="var(--fs-svg-text-client)" strokeWidth="2.5" markerEnd="url(#acn-blue-fs)" />
                      <circle r="4" fill="var(--fs-svg-text-client)">
                        <animateMotion dur="1s" repeatCount="indefinite" path="M 300 90 L 235 90" />
                      </circle>
                    </g>
                  ) : (
                    <g>
                      <path d="M 460 90 L 525 90" fill="none" stroke="var(--fs-svg-text-origin)" strokeWidth="2.5" markerEnd="url(#acn-orange-fs2)" />
                      <circle r="4" fill="var(--fs-svg-text-origin)">
                        <animateMotion dur="1s" repeatCount="indefinite" path="M 460 90 L 525 90" />
                      </circle>
                    </g>
                  )}

                  {/* Synchronous Replication line */}
                  {!azFailed ? (
                    <g>
                      <path d="M 135 135 L 135 160 L 625 160 L 625 135" fill="none" stroke="var(--fs-svg-node-stroke-origin)" strokeWidth="2" strokeDasharray="none" markerEnd="url(#acn-green-fs)" />
                      <circle r="4.5" fill="var(--fs-svg-node-stroke-origin)">
                        <animateMotion dur="1.8s" repeatCount="indefinite" path="M 135 135 L 135 160 L 625 160 L 625 135" />
                      </circle>
                      <text x="380" y="153" textAnchor="middle" fontSize="8" fill="var(--fs-svg-text-origin)" fontWeight="700">Continuous Block Synchronous Mirroring 🔄</text>
                    </g>
                  ) : (
                    <g>
                      <path d="M 135 135 L 135 160 L 625 160 L 625 135" fill="none" stroke="var(--fs-svg-node-stroke-crashed)" strokeWidth="2" strokeDasharray="3,3" />
                      <text x="380" y="153" textAnchor="middle" fontSize="8" fill="var(--fs-svg-text-crashed)" fontWeight="800">⚠️ REPLICATION SUSPENDED — PRIMARY DOWN</text>
                    </g>
                  )}
                </svg>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Lustre & OpenZFS */}
        {activeTab === 'lustre' && (
          <div>
            <div className="fs-sec">HPC Caching with Lustre &amp; Sub-millisecond OpenZFS Clones</div>
            <div className="fs-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                Lustre coordinates parallel processing across massive compute fleets (like SageMaker or GPU fleets) for high-performance computing (HPC) tasks. OpenZFS provides cloud-native ZFS environments delivering sub-millisecond latencies for active software development sandboxes.
              </div>

              <div className="fs-grid2">
                {/* FSx for Lustre */}
                <div style={{ background: 'var(--color-background-secondary)', border: '1.5px solid var(--fs-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--fs-svg-text-block)' }}>Amazon FSx for Lustre (HPC Engine)</div>
                  
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
                <div style={{ background: 'var(--color-background-secondary)', border: '1.5px solid var(--fs-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--fs-svg-text-origin)' }}>Amazon FSx for OpenZFS (Cloud ZFS)</div>

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
              <div style={{ border: '1.5px solid var(--fs-card-border)', borderRadius: '16px', padding: '16px', background: 'var(--color-background-primary)', marginTop: '14px', boxShadow: 'inset 0 0 12px rgba(0,0,0,0.01)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🚀</span> FSx for Lustre Parallel High-Performance Computing (HPC) &amp; S3 Lazy-Loading Pipeline
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className={`fs-btn ${lazyLoaded ? 'fs-warning' : 'fs-primary'}`} 
                      style={{ padding: '6px 12px', fontSize: '11.5px' }} 
                      onClick={() => {
                        setLazyLoaded(prev => !prev);
                        if (!lazyLoaded) {
                          addLog("Tab 3: Simulating Lustre local NVMe cache load. S3 dataset indexed.", "success");
                        } else {
                          addLog("Tab 3: Flushed Lustre local NVMe cache sectors. Next reads will lazy-load from S3.", "warning");
                        }
                      }}
                    >
                      {lazyLoaded ? '❄️ Flush local SSD Cache' : '🔥 Pre-warm local SSD Cache'}
                    </button>
                  </div>
                </div>

                <svg width="100%" viewBox="0 0 760 180" className="fs-svg-bg" style={{ borderRadius: '12px', border: '1.5px solid var(--fs-card-border)' }}>
                  <defs>
                    <marker id="acn-orange-fs3" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--fs-svg-text-block)" /></marker>
                    <marker id="acn-green-lustre2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--fs-svg-node-stroke-origin)" /></marker>
                    <linearGradient id="grad-s3" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--fs-alert-green-bg)" />
                      <stop offset="100%" stopColor="var(--fs-svg-node-fill-origin)" />
                    </linearGradient>
                    <linearGradient id="grad-lustre" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--fs-alert-yellow-bg)" />
                      <stop offset="100%" stopColor="var(--fs-svg-node-fill-block)" />
                    </linearGradient>
                    <linearGradient id="grad-gpu" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--fs-svg-node-fill-client)" />
                      <stop offset="100%" stopColor="var(--fs-svg-node-stroke-client)" />
                    </linearGradient>
                    <filter id="shadow-fs-lustre" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="var(--fs-svg-node-stroke)" floodOpacity="0.1" />
                    </filter>
                  </defs>

                  {/* S3 Bucket Data Repository */}
                  <g filter="url(#shadow-fs-lustre)">
                    <rect x="25" y="45" width="130" height="90" rx="8" fill="url(#grad-s3)" stroke="var(--fs-svg-node-stroke-origin)" strokeWidth="1.5" />
                    <ellipse cx="90" cy="53" rx="65" ry="8" fill="var(--fs-svg-node-stroke-origin)" opacity="0.3" />
                    <text x="90" y="72" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="var(--fs-svg-text-origin)">🪣 Amazon S3</text>
                    <text x="90" y="88" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-origin)" fontWeight="600">Master Dataset (10 TB)</text>
                    <text x="90" y="108" textAnchor="middle" fontSize="8" fill="var(--fs-svg-text-origin)" fontWeight="700">S3 Source Repository</text>
                  </g>

                  {/* FSx for Lustre Parallel Filesystem */}
                  <g filter="url(#shadow-fs-lustre)">
                    <rect x="250" y="35" width="260" height="110" rx="8" fill="url(#grad-lustre)" stroke="var(--fs-svg-node-stroke-block)" strokeWidth="1.5" />
                    <text x="380" y="50" textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--fs-svg-text-block)">🚀 Amazon FSx for Lustre Cluster</text>
                    
                    {/* Metadata Server */}
                    <rect x="265" y="65" width="100" height="60" rx="6" fill="var(--color-background-primary)" stroke="var(--fs-svg-node-stroke-block)" strokeWidth="1" />
                    <text x="315" y="80" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--fs-svg-text-block)">Metadata Server</text>
                    <text x="315" y="95" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-block)">Indices &amp; File Paths</text>
                    <text x="315" y="110" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="var(--fs-svg-text-origin)">INDEX SYNCD 🟢</text>

                    {/* Storage Targets */}
                    <rect x="390" y="65" width="100" height="60" rx="6" fill="var(--color-background-primary)" stroke="var(--fs-svg-node-stroke-block)" strokeWidth="1" />
                    <text x="440" y="80" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--fs-svg-text-block)">Storage Targets</text>
                    <text x="440" y="94" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-block)">Striped SSD Chassis</text>
                    <text x="440" y="112" textAnchor="middle" fontSize="8" fontWeight="800" fill={lazyLoaded ? 'var(--fs-svg-text-origin)' : 'var(--fs-svg-text-standby)'}>
                      {lazyLoaded ? '🔥 SSD CACHE WARM' : '❄️ SSD CACHE COLD'}
                    </text>
                  </g>

                  {/* GPU EC2 Instances parallel read */}
                  <g filter="url(#shadow-fs-lustre)">
                    <rect x="600" y="45" width="130" height="90" rx="8" fill="url(#grad-gpu)" stroke="var(--fs-svg-node-stroke-client)" strokeWidth="1.5" />
                    <text x="665" y="65" textAnchor="middle" fontSize="10" fontWeight="800" fill="var(--fs-svg-text-client)">🖥️ HPC GPU Fleet</text>
                    <text x="665" y="85" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-client)" fontWeight="600">PyTorch ML Cluster</text>
                    <text x="665" y="105" textAnchor="middle" fontSize="8" fill="var(--fs-svg-text-client)" fontWeight="700">Parallel Read/Writes</text>
                  </g>

                  {/* Connections */}
                  {/* S3 -> Lustre Lazy load on-demand */}
                  <path d="M 155 90 L 250 90" fill="none" stroke={lazyLoaded ? 'var(--fs-svg-node-stroke-standby)' : 'var(--fs-svg-node-stroke-origin)'} strokeWidth={lazyLoaded ? 1.5 : 2.5} strokeDasharray={lazyLoaded ? 'none' : '4,3'} markerEnd="url(#acn-green-lustre2)" />
                  <text x="202" y="73" textAnchor="middle" fontSize="8" fill={lazyLoaded ? 'var(--fs-svg-text-standby)' : 'var(--fs-svg-text-origin)'} fontWeight="700">
                    {lazyLoaded ? 'Sync Idle' : 'Lazy Load 🟢'}
                  </text>
                  <text x="202" y="83" textAnchor="middle" fontSize="6.5" fill={lazyLoaded ? 'var(--fs-svg-text-standby)' : 'var(--fs-svg-text-origin)'} fontWeight="600">
                    {lazyLoaded ? '(S3 Sourced)' : '(Direct Stream)'}
                  </text>

                  {/* Lustre -> GPU parallel */}
                  <path d="M 510 90 L 600 90" fill="none" stroke="var(--fs-svg-node-stroke-block)" strokeWidth={3} markerEnd="url(#acn-orange-fs3)" />
                  <text x="555" y="73" textAnchor="middle" fontSize="9.5" fill="var(--fs-svg-text-block)" fontWeight="800">
                    {lazyLoaded ? '50+ GB/s ⚡' : 'S3 Pulling...'}
                  </text>
                  <text x="555" y="83" textAnchor="middle" fontSize="6.5" fill="var(--fs-svg-text-block)" fontWeight="600">
                    {lazyLoaded ? 'Direct NVMe Read' : 'Caching blocks'}
                  </text>

                  {/* Anim Motion Paths */}
                  {!lazyLoaded ? (
                    <g>
                      {/* Packet from S3 to Lustre */}
                      <circle r="4.5" fill="var(--fs-svg-node-stroke-origin)">
                        <animateMotion dur="1.2s" repeatCount="indefinite" path="M 155 90 L 250 90" />
                      </circle>
                      {/* Sluggish packet from Lustre to GPU */}
                      <circle r="4.5" fill="var(--fs-svg-text-block)">
                        <animateMotion dur="2.2s" repeatCount="indefinite" path="M 510 90 L 600 90" />
                      </circle>
                    </g>
                  ) : (
                    <g>
                      {/* Blazing packet stream from Lustre to GPU */}
                      <circle r="5" fill="var(--fs-svg-text-crashed)">
                        <animateMotion dur="0.6s" repeatCount="indefinite" path="M 510 90 L 600 90" />
                      </circle>
                      <circle r="3.5" fill="var(--fs-svg-text-block)">
                        <animateMotion dur="0.6s" begin="0.2s" repeatCount="indefinite" path="M 510 90 L 600 90" />
                      </circle>
                    </g>
                  )}
                </svg>
              </div>

            </div>
          </div>
        )}


        {/* Tab 4: Hybrid Storage & Migration */}
        {activeTab === 'hybrid' && (
          <div>
            <div className="fs-sec">AWS Hybrid Storage Gateway, DataSync, and Secure Migration Pipelines</div>
            <div className="fs-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                AWS provides specialized services to bridge local datacenters with public cloud infrastructure. You can deploy local virtual gateway appliances to cache cloud storage on-premises, sync large directories over networks automatically, or expose secure SFTP entry points directly to cloud backends.
              </div>

              {/* AWS Storage Gateways deep dive splits */}
              <div className="fs-grid2" style={{ marginBottom: '14px' }}>
                <div style={{ background: 'var(--color-background-secondary)', border: '1.5px solid var(--fs-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--fs-svg-text-block)' }}>Managed AWS Storage Gateway Engines</div>

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
                <div style={{ background: 'var(--color-background-secondary)', border: '1.5px solid var(--fs-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--fs-svg-text-inode)' }}>Data Sync &amp; Migration Tunnels</div>

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
              <div style={{ border: '1.5px solid var(--fs-card-border)', borderRadius: '16px', padding: '16px', background: 'var(--color-background-primary)', marginBottom: '14px', boxShadow: 'inset 0 0 12px rgba(0,0,0,0.01)' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔌</span> AWS Storage Gateway Hybrid Network Topology (On-Premises to Cloud Integration)
                </div>

                <svg width="100%" viewBox="0 0 760 220" className="fs-svg-bg" style={{ borderRadius: '12px', border: '1.5px solid var(--fs-card-border)' }}>
                  <defs>
                    <marker id="acn-hybrid" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--fs-svg-text-block)" /></marker>
                    <marker id="acn-cloud-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--fs-svg-text-client)" /></marker>
                    <linearGradient id="grad-onprem" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-background-primary)" />
                      <stop offset="100%" stopColor="var(--color-background-secondary)" />
                    </linearGradient>
                    <linearGradient id="grad-aws" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-background-primary)" />
                      <stop offset="100%" stopColor="var(--fs-svg-node-fill-client)" />
                    </linearGradient>
                    <filter id="shadow-fs-hybrid" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="var(--fs-svg-node-stroke)" floodOpacity="0.1" />
                    </filter>
                  </defs>

                  {/* On-Premises Boundary */}
                  <rect x="15" y="30" width="230" height="170" rx="8" fill="none" stroke="var(--fs-svg-node-stroke)" strokeWidth="1.5" strokeDasharray="3,3" />
                  <text x="130" y="46" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--color-text-secondary)">🏢 Corporate Local Data Center</text>

                  {/* Local Server */}
                  <g filter="url(#shadow-fs-hybrid)">
                    <rect x="25" y="65" width="90" height="50" rx="6" fill="url(#grad-onprem)" stroke="var(--fs-svg-node-stroke)" strokeWidth="1" />
                    <text x="70" y="85" textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--color-text-primary)">Local Server</text>
                    <text x="70" y="98" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)" fontWeight="600">NFS / SMB / iSCSI</text>
                  </g>

                  {/* Gateway VM Appliance */}
                  <g filter="url(#shadow-fs-hybrid)">
                    <rect x="140" y="65" width="90" height="90" rx="6" fill="var(--fs-alert-yellow-bg)" stroke="var(--fs-svg-node-stroke-block)" strokeWidth="1.5" />
                    <text x="185" y="82" textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--fs-svg-text-block)">Storage Gateway</text>
                    <text x="185" y="94" textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--fs-svg-text-block)">VM Appliance</text>
                    <rect x="148" y="112" width="74" height="30" rx="4" fill="var(--fs-alert-yellow-bg)" stroke="var(--fs-svg-node-stroke-block)" strokeWidth="1" />
                    <text x="185" y="124" textAnchor="middle" fontSize="7" fontWeight="800" fill="var(--fs-svg-text-block)">💾 local SSD Cache</text>
                    <text x="185" y="134" textAnchor="middle" fontSize="6.5" fill="var(--fs-svg-text-block)" fontWeight="600">&lt; 1ms hot reads</text>
                  </g>

                  {/* Network Tunnel */}
                  <rect x="270" y="75" width="180" height="50" rx="8" fill="var(--color-background-secondary)" stroke="var(--fs-svg-node-stroke-client)" strokeWidth="1" />
                  <path d="M 270 100 L 450 100" stroke="var(--fs-svg-text-inode)" strokeWidth="3" fill="none" opacity="0.3" />
                  <text x="360" y="92" textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--fs-svg-text-client)">VPN / Direct Connect Tunnel</text>
                  <text x="360" y="106" textAnchor="middle" fontSize="7" fill="var(--fs-svg-text-client)" fontWeight="600">Secure HTTPS / TLS 1.3 Encryption</text>

                  {/* AWS Cloud Boundary */}
                  <rect x="475" y="30" width="265" height="170" rx="8" fill="none" stroke="var(--fs-svg-node-stroke-client)" strokeWidth="1.5" strokeDasharray="3,3" />
                  <text x="607" y="46" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--fs-svg-text-client)">☁️ AWS Cloud Infrastructure</text>

                  {/* Cloud Target S3 File */}
                  <g filter="url(#shadow-fs-hybrid)">
                    <rect x="490" y="60" width="110" height="40" rx="6" fill="url(#grad-aws)" stroke="var(--fs-svg-node-stroke-origin)" strokeWidth="1.2" />
                    <ellipse cx="545" cy="65" rx="55" ry="4" fill="var(--fs-svg-node-stroke-origin)" opacity="0.2" />
                    <text x="545" y="76" textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--fs-svg-text-origin)">🪣 Amazon S3</text>
                    <text x="545" y="88" textAnchor="middle" fontSize="6.5" fill="var(--fs-svg-text-origin)" fontWeight="600">Objects (File GW)</text>
                  </g>

                  {/* Cloud Target EBS Snap */}
                  <g filter="url(#shadow-fs-hybrid)">
                    <rect x="615" y="60" width="110" height="40" rx="6" fill="url(#grad-aws)" stroke="var(--fs-svg-node-stroke-client)" strokeWidth="1.2" />
                    <ellipse cx="670" cy="65" rx="55" ry="4" fill="var(--fs-svg-node-stroke-client)" opacity="0.2" />
                    <text x="670" y="76" textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--fs-svg-text-client)">💾 EBS Snapshots</text>
                    <text x="670" y="88" textAnchor="middle" fontSize="6.5" fill="var(--fs-svg-text-client)" fontWeight="600">Blocks (Volume GW)</text>
                  </g>

                  {/* Cloud Target Glacier Vault */}
                  <g filter="url(#shadow-fs-hybrid)">
                    <rect x="550" y="125" width="115" height="45" rx="6" fill="url(#grad-aws)" stroke="var(--fs-svg-node-stroke-inode)" strokeWidth="1.2" />
                    <ellipse cx="607" cy="130" rx="57.5" ry="4" fill="var(--fs-svg-node-stroke-inode)" opacity="0.2" />
                    <text x="607" y="142" textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--fs-svg-text-inode)">📼 S3 Glacier Vault</text>
                    <text x="607" y="154" textAnchor="middle" fontSize="6.5" fill="var(--fs-svg-text-inode)" fontWeight="600">Virtual Tapes (Tape GW)</text>
                  </g>

                  {/* Connectors */}
                  {/* Local App -> Gateway VM */}
                  <path d="M 115 90 L 140 90" fill="none" stroke="var(--fs-svg-node-stroke-block)" strokeWidth="1.5" markerEnd="url(#acn-hybrid)" />
                  {/* Gateway VM -> Tunnel */}
                  <path d="M 230 100 L 270 100" fill="none" stroke="var(--fs-svg-text-inode)" strokeWidth="2.5" markerEnd="url(#acn-cloud-blue)" />
                  {/* Tunnel -> Cloud targets */}
                  <path d="M 450 100 Q 470 80 490 80" fill="none" stroke="var(--fs-svg-text-client)" strokeWidth="1.5" markerEnd="url(#acn-cloud-blue)" />
                  <path d="M 450 100 Q 532.5 80 615 80" fill="none" stroke="var(--fs-svg-text-client)" strokeWidth="1.5" markerEnd="url(#acn-cloud-blue)" />
                  <path d="M 450 100 Q 500 142 550 142" fill="none" stroke="var(--fs-svg-text-client)" strokeWidth="1.5" markerEnd="url(#acn-cloud-blue)" />

                  {/* Dynamic background replication packet streams */}
                  <circle r="4" fill="var(--fs-svg-text-inode)">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 230 100 L 450 100" />
                  </circle>
                  <circle r="3.5" fill="var(--fs-svg-text-client)">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M 450 100 Q 470 80 490 80" />
                  </circle>
                  <circle r="3.5" fill="var(--fs-svg-text-client)">
                    <animateMotion dur="2s" begin="0.7s" repeatCount="indefinite" path="M 450 100 Q 532.5 80 615 80" />
                  </circle>
                  <circle r="3.5" fill="var(--fs-svg-text-inode)">
                    <animateMotion dur="2.2s" begin="1.4s" repeatCount="indefinite" path="M 450 100 Q 500 142 550 142" />
                  </circle>
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
            <div className="fs-card" style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', background: 'var(--fs-alert-green-bg)', borderColor: 'var(--fs-alert-green-border)' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--fs-alert-green-text)' }}>💡 Dynamic Workspace Interactive Controls:</span>
                <span style={{ fontSize: '11px', color: 'var(--fs-alert-green-subtext)', marginLeft: '6px' }}>
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
                      <div className="fs-mono" style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', marginTop: '4px' }}>
                        *Estimated copy duration: {(100000000 / (datasyncBandwidth * 3600)).toFixed(1)} Hours
                      </div>
                    </div>
                  )}

                  {/* Dynamic description of scenario */}
                  <div style={{ background: 'var(--color-background-secondary)', border: '1.5px solid var(--fs-border-primary)', borderRadius: '6px', padding: '10px', fontSize: '11px', lineHeight: '1.45' }}>
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
                  <svg width="100%" height="200" viewBox="0 0 480 200" className="fs-svg-bg" style={{ borderRadius: '12px', border: '1.5px solid var(--fs-card-border)', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.01))' }}>
                    <defs>
                      <marker id="acn-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--fs-svg-text-client)" /></marker>
                      <marker id="acn-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--fs-svg-text-origin)" /></marker>
                      <marker id="acn-orange" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--fs-svg-text-block)" /></marker>
                      <marker id="acn-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--fs-svg-text-inode)" /></marker>
                      <linearGradient id="grad-client-sim" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-background-primary)" />
                        <stop offset="100%" stopColor="var(--fs-svg-node-fill-client)" />
                      </linearGradient>
                      <linearGradient id="grad-primary-sim" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-background-primary)" />
                        <stop offset="100%" stopColor="var(--fs-svg-node-fill-origin)" />
                      </linearGradient>
                      <linearGradient id="grad-standby-sim" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-background-primary)" />
                        <stop offset="100%" stopColor="var(--fs-svg-node-fill-standby)" />
                      </linearGradient>
                      <linearGradient id="grad-failed-sim" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--fs-alert-red-bg)" />
                        <stop offset="100%" stopColor="var(--fs-svg-node-fill-crashed)" />
                      </linearGradient>
                      <filter id="shadow-sim" x="-15%" y="-15%" width="130%" height="130%">
                        <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="var(--fs-svg-node-stroke)" floodOpacity="0.12" />
                      </filter>
                    </defs>

                    {/* Scenario 1: Windows Multi-AZ Failover Layout */}
                    {activeScenario === 'windows_multiaz' && (
                      <g>
                        {/* Client Node */}
                        <g filter="url(#shadow-sim)">
                          <circle cx="50" cy="100" r="18" fill="url(#grad-client-sim)" stroke="var(--fs-svg-node-stroke-client)" strokeWidth="1.5" />
                          <text x="50" y="100" textAnchor="middle" dominantBaseline="central" fontSize="7.5" fontWeight="800" fill="var(--fs-svg-text-client)">SMB</text>
                          <text x="50" y="130" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="var(--color-text-secondary)">Workstation</text>
                        </g>

                        {/* Active Directory Hub */}
                        <g filter="url(#shadow-sim)">
                          <rect x="125" y="70" width="75" height="60" rx="6" fill="var(--color-background-primary)" stroke="var(--fs-svg-node-stroke)" strokeWidth="1" />
                          <text x="162" y="88" textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--color-text-secondary)">Managed AD</text>
                          <text x="162" y="100" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="var(--fs-svg-text-origin)">AUTH OK</text>
                          <text x="162" y="112" textAnchor="middle" fontSize="6.5" fill="var(--color-text-tertiary)">DFS Namesp</text>
                        </g>

                        {/* AZ-a Storage Node */}
                        <g filter="url(#shadow-sim)">
                          <rect x="250" y="30" width="105" height="55" rx="6" fill={azFailed ? 'url(#grad-failed-sim)' : 'url(#grad-primary-sim)'} stroke={azFailed ? 'var(--fs-svg-node-stroke-crashed)' : 'var(--fs-svg-node-stroke-origin)'} strokeWidth={azFailed ? 1.5 : 1} />
                          <ellipse cx="302" cy="35" rx="52.5" ry="3.5" fill={azFailed ? 'var(--fs-svg-node-stroke-crashed)' : 'var(--fs-svg-node-stroke-origin)'} opacity="0.2" />
                          <text x="302" y="52" textAnchor="middle" fontSize="8" fontWeight="800" fill={azFailed ? 'var(--fs-svg-text-crashed)' : 'var(--fs-svg-text-origin)'}>AZ-a Primary</text>
                          <text x="302" y="65" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={azFailed ? 'var(--fs-svg-text-crashed)' : 'var(--fs-svg-text-origin)'}>
                            {azFailed ? '❌ OFFLINE' : '🟢 ACTIVE'}
                          </text>
                        </g>

                        {/* AZ-b Standby Storage Node */}
                        <g filter="url(#shadow-sim)">
                          <rect x="250" y="115" width="105" height="55" rx="6" fill={azFailed ? 'url(#grad-primary-sim)' : 'url(#grad-standby-sim)'} stroke={azFailed ? 'var(--fs-svg-node-stroke-origin)' : 'var(--fs-svg-node-stroke-standby)'} strokeWidth={1.5} />
                          <ellipse cx="302" cy="120" rx="52.5" ry="3.5" fill={azFailed ? 'var(--fs-svg-node-stroke-origin)' : 'var(--fs-svg-node-stroke-standby)'} opacity="0.2" />
                          <text x="302" y="137" textAnchor="middle" fontSize="8" fontWeight="800" fill={azFailed ? 'var(--fs-svg-text-origin)' : 'var(--fs-svg-text-standby)'}>AZ-b Standby</text>
                          <text x="302" y="150" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={azFailed ? 'var(--fs-svg-text-origin)' : 'var(--fs-svg-text-standby)'}>
                            {azFailed ? '👑 PROMOTED' : '💤 STANDBY'}
                          </text>
                        </g>

                        {/* Sync replication link */}
                        <path d="M 355 57 Q 410 87 355 142" fill="none" stroke={azFailed ? 'var(--fs-svg-node-stroke-crashed)' : 'var(--fs-svg-node-stroke-origin)'} strokeWidth={2} strokeDasharray={azFailed ? '3,3' : 'none'} />
                        <text x="430" y="102" textAnchor="middle" fontSize="7" fontWeight="700" fill={azFailed ? 'var(--fs-svg-text-crashed)' : 'var(--fs-svg-text-origin)'}>
                          {azFailed ? 'SYNC BROKEN' : 'SYNC OK 🔄'}
                        </text>

                        {/* Connection channels */}
                        <path d="M 68 100 L 125 100" fill="none" stroke="var(--fs-svg-node-stroke-client)" strokeWidth="1.5" markerEnd="url(#acn-blue)" />
                        
                        {!azFailed ? (
                          <g>
                            <path d="M 200 90 L 250 65" fill="none" stroke="var(--fs-svg-node-stroke-client)" strokeWidth="1.5" markerEnd="url(#acn-blue)" />
                            {isSimulating && (
                              <circle r="4" fill="var(--fs-svg-text-client)">
                                <animateMotion dur="1.2s" repeatCount="indefinite" path={
                                  simStep === 1 ? "M 50 100 L 125 100" :
                                  simStep === 2 ? "M 125 100 Q 162 80 200 90 L 250 65" :
                                  simStep === 3 ? "M 250 65 L 290 65" :
                                  simStep === 4 ? "M 355 57 Q 410 87 355 142" : "M 50 100 L 125 100"
                                } />
                              </circle>
                            )}
                          </g>
                        ) : (
                          <g>
                            <path d="M 200 110 L 250 135" fill="none" stroke="var(--fs-svg-node-stroke-origin)" strokeWidth="1.5" markerEnd="url(#acn-orange)" />
                            {isSimulating && (
                              <circle r="4" fill="var(--fs-svg-text-origin)">
                                <animateMotion dur="1.2s" repeatCount="indefinite" path={
                                  simStep === 1 ? "M 50 100 L 125 100" :
                                  simStep === 2 ? "M 125 100 Q 162 120 200 110 L 250 135" :
                                  simStep === 3 ? "M 250 135 L 290 135" :
                                  simStep === 4 ? "M 250 135 L 310 135" : "M 50 100 L 125 100"
                                } />
                              </circle>
                            )}
                          </g>
                        )}
                      </g>
                    )}

                    {/* Scenario 2: FSx for Lustre ML Parallel Caching */}
                    {activeScenario === 'lustre_ml' && (
                      <g>
                        {/* GPU Compute Node */}
                        <g filter="url(#shadow-sim)">
                          <rect x="25" y="60" width="85" height="80" rx="6" fill="url(#grad-client-sim)" stroke="var(--fs-svg-node-stroke-client)" strokeWidth="1.5" />
                          <text x="67" y="80" textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--fs-svg-text-client)">🖥️ GPU FLEET</text>
                          <text x="67" y="95" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-client)" fontWeight="600">PyTorch ML</text>
                          <text x="67" y="112" textAnchor="middle" fontSize="8" fontWeight="700" fill={isSimulating ? 'var(--fs-svg-text-origin)' : 'var(--fs-svg-text-standby)'}>
                            {isSimulating ? 'TRAINING...' : 'STANDBY'}
                          </text>
                        </g>

                        {/* Lustre NVMe Targets */}
                        <g filter="url(#shadow-sim)">
                          <rect x="175" y="55" width="115" height="90" rx="6" fill="url(#grad-primary-sim)" stroke="var(--fs-svg-node-stroke-block)" strokeWidth="1.5" />
                          <ellipse cx="232.5" cy="60" rx="57.5" ry="4" fill="var(--fs-svg-node-stroke-block)" opacity="0.2" />
                          <text x="232.5" y="76" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--fs-svg-text-block)">Lustre NVMe</text>
                          <text x="232.5" y="90" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-block)" fontWeight="600">Parallel SSD Array</text>
                          <rect x="187" y="105" width="90" height="25" rx="4" fill="var(--fs-alert-yellow-bg)" stroke="var(--fs-svg-node-stroke-block)" strokeWidth="1" />
                          <text x="232" y="120" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="var(--fs-svg-text-block)">
                            {lazyLoaded ? '🔥 CACHE WARM' : '❄️ CACHE COLD'}
                          </text>
                        </g>

                        {/* S3 Storage Repository */}
                        <g filter="url(#shadow-sim)">
                          <rect x="350" y="65" width="105" height="70" rx="6" fill="var(--fs-alert-green-bg)" stroke="var(--fs-svg-node-stroke-origin)" strokeWidth="1.5" />
                          <ellipse cx="402.5" cy="70" rx="52.5" ry="3.5" fill="var(--fs-svg-node-stroke-origin)" opacity="0.2" />
                          <text x="402.5" y="88" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--fs-svg-text-origin)">🪣 Amazon S3</text>
                          <text x="402.5" y="102" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-origin)" fontWeight="600">Master Repository</text>
                          <text x="402.5" y="116" textAnchor="middle" fontSize="7" fill="var(--fs-svg-text-origin)" fontWeight="700">10 TB Bucket</text>
                        </g>

                        {/* Pipelines */}
                        <path d="M 175 100 L 110 100" fill="none" stroke="var(--fs-svg-node-stroke-block)" strokeWidth="2.5" markerEnd="url(#acn-orange)" />
                        <path d="M 350 100 L 290 100" fill="none" stroke={lazyLoaded ? 'var(--fs-svg-node-stroke-standby)' : 'var(--fs-svg-node-stroke-origin)'} strokeWidth={lazyLoaded ? 1 : 2} strokeDasharray={lazyLoaded ? 'none' : '3,2'} markerEnd="url(#acn-green)" />
                        <text x="320" y="88" textAnchor="middle" fontSize="7" fill="var(--fs-svg-text-origin)" fontWeight="800">
                          {lazyLoaded ? 'Sync Idle' : 'Lazy Load 🟢'}
                        </text>

                        {/* Traffic animation */}
                        {isSimulating && (
                          <g>
                            {!lazyLoaded ? (
                              <g>
                                {/* S3 to Lustre download */}
                                <circle r="4.5" fill="var(--fs-svg-node-stroke-origin)">
                                  <animateMotion dur="1s" repeatCount="indefinite" path="M 350 100 L 290 100" />
                                </circle>
                                {/* Sluggish Lustre to GPU */}
                                <circle r="4.5" fill="var(--fs-svg-text-block)">
                                  <animateMotion dur="1.8s" repeatCount="indefinite" path="M 175 100 L 110 100" />
                                </circle>
                              </g>
                            ) : (
                              <g>
                                {/* Blazing fast direct reads from NVMe cache */}
                                <circle r="5" fill="var(--fs-svg-text-crashed)">
                                  <animateMotion dur="0.5s" repeatCount="indefinite" path="M 175 100 L 110 100" />
                                </circle>
                                <circle r="3.5" fill="var(--fs-svg-text-block)">
                                  <animateMotion dur="0.5s" begin="0.15s" repeatCount="indefinite" path="M 175 100 L 110 100" />
                                </circle>
                              </g>
                            )}
                          </g>
                        )}
                      </g>
                    )}

                    {/* Scenario 3: FSx for OpenZFS Database Clones */}
                    {activeScenario === 'zfs_dev' && (
                      <g>
                        {/* Developer Client */}
                        <g filter="url(#shadow-sim)">
                          <circle cx="50" cy="100" r="18" fill="url(#grad-client-sim)" stroke="var(--fs-svg-node-stroke-client)" strokeWidth="1.5" />
                          <text x="50" y="100" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="800" fill="var(--fs-svg-text-client)">DEV</text>
                          <text x="50" y="130" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="var(--color-text-secondary)">Workspace</text>
                        </g>

                        {/* OpenZFS SSD Master Pool */}
                        <g filter="url(#shadow-sim)">
                          <rect x="150" y="55" width="110" height="90" rx="6" fill="url(#grad-primary-sim)" stroke="var(--fs-svg-node-stroke-origin)" strokeWidth="1.5" />
                          <ellipse cx="205" cy="60" rx="55" ry="4" fill="var(--fs-svg-node-stroke-origin)" opacity="0.2" />
                          <text x="205" y="76" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--fs-svg-text-origin)">ZFS Prod SSD</text>
                          <text x="205" y="90" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-origin)" fontWeight="600">80,000 IOPS</text>
                          <text x="205" y="115" textAnchor="middle" fontSize="7" fill="var(--color-text-tertiary)">LZ4 Compression</text>
                        </g>

                        {/* OpenZFS Copy-on-Write Dev Clone */}
                        {clonedZfs ? (
                          <g filter="url(#shadow-sim)">
                            <rect x="330" y="55" width="115" height="90" rx="6" fill="var(--fs-svg-node-fill-inode)" stroke="var(--fs-svg-node-stroke-inode)" strokeWidth="1.5" />
                            <ellipse cx="387.5" cy="60" rx="57.5" ry="4" fill="var(--fs-svg-node-stroke-inode)" opacity="0.2" />
                            <text x="387.5" y="76" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--fs-svg-text-inode)">ZFS Clone DB</text>
                            <text x="387.5" y="92" textAnchor="middle" fontSize="7" fill="var(--fs-svg-text-inode)" fontWeight="600">Spawn: 12ms ⚡</text>
                            <text x="387.5" y="108" textAnchor="middle" fontSize="6.5" fill="var(--fs-svg-text-inode)">Copy-on-Write</text>
                            <text x="387.5" y="122" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="var(--fs-svg-text-inode)">0-Cost Blocks</text>
                          </g>
                        ) : (
                          <g opacity="0.35">
                            <rect x="330" y="55" width="115" height="90" rx="6" fill="var(--color-background-secondary)" stroke="var(--fs-svg-node-stroke-standby)" strokeDasharray="3,3" />
                            <text x="387.5" y="100" textAnchor="middle" fontSize="8" fontWeight="600" fill="var(--color-text-tertiary)">No Clone Active</text>
                          </g>
                        )}

                        {/* Pipes */}
                        <path d="M 68 100 L 150 100" fill="none" stroke="var(--fs-svg-node-stroke-origin)" strokeWidth="1.5" markerEnd="url(#acn-green)" />
                        
                        {clonedZfs && (
                          <g>
                            <path d="M 260 100 L 330 100" fill="none" stroke="var(--fs-svg-node-stroke-inode)" strokeWidth="1.5" strokeDasharray="2,2" markerEnd="url(#acn-purple)" />
                            <text x="295" y="90" textAnchor="middle" fontSize="7" fill="var(--fs-svg-text-inode)" fontWeight="700">Metadata ptr</text>
                          </g>
                        )}

                        {/* Animation particle */}
                        {isSimulating && (
                          <g>
                            {clonedZfs ? (
                              <circle r="4" fill="var(--fs-svg-text-inode)">
                                <animateMotion dur="0.9s" repeatCount="indefinite" path="M 50 100 Q 100 130 150 100 Q 240 130 330 100 L 387 100" />
                              </circle>
                            ) : (
                              <circle r="4" fill="var(--fs-svg-text-origin)">
                                <animateMotion dur="0.9s" repeatCount="indefinite" path="M 50 100 L 150 100" />
                              </circle>
                            )}
                          </g>
                        )}
                      </g>
                    )}

                    {/* Scenario 4: FSx for NetApp ONTAP SAP Tiering */}
                    {activeScenario === 'ontap_enterprise' && (
                      <g>
                        {/* SAP Database App Server */}
                        <g filter="url(#shadow-sim)">
                          <rect x="20" y="65" width="85" height="70" rx="6" fill="url(#grad-client-sim)" stroke="var(--fs-svg-node-stroke-client)" strokeWidth="1.5" />
                          <text x="62.5" y="85" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--fs-svg-text-client)">SAP HANA</text>
                          <text x="62.5" y="98" textAnchor="middle" fontSize="7" fill="var(--fs-svg-text-client)" fontWeight="600">Linux DB Cluster</text>
                          <text x="62.5" y="112" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">iSCSI LUN</text>
                        </g>

                        {/* ONTAP Multi-Protocol SSD Primary */}
                        <g filter="url(#shadow-sim)">
                          <rect x="155" y="30" width="125" height="60" rx="6" fill="url(#grad-primary-sim)" stroke="var(--fs-svg-node-stroke-origin)" strokeWidth="1.5" />
                          <ellipse cx="217.5" cy="35" rx="62.5" ry="3.5" fill="var(--fs-svg-node-stroke-origin)" opacity="0.2" />
                          <text x="217.5" y="50" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--fs-svg-text-origin)">ONTAP SSD Volume</text>
                          <text x="217.5" y="62" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-origin)" fontWeight="600">Active Hot Blocks</text>
                          <text x="217.5" y="74" textAnchor="middle" fontSize="7" fill="var(--color-text-tertiary)">NFS &amp; SMB shared</text>
                        </g>

                        {/* ONTAP Cheap HDD Capacity Pool */}
                        <g filter="url(#shadow-sim)">
                          <rect x="155" y="110" width="125" height="60" rx="6" fill="var(--fs-alert-yellow-bg)" stroke="var(--fs-svg-node-stroke-block)" strokeWidth="1" />
                          <ellipse cx="217.5" cy="115" rx="62.5" ry="3.5" fill="var(--fs-svg-node-stroke-block)" opacity="0.2" />
                          <text x="217.5" y="130" textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--fs-svg-text-block)">Capacity HDD Pool</text>
                          <text x="217.5" y="142" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-block)" fontWeight="600">Cold blocks auto-tiered</text>
                          <text x="217.5" y="154" textAnchor="middle" fontSize="7" fill="var(--fs-svg-text-block)">90% Storage Savings</text>
                        </g>

                        {/* SnapMirror replication target */}
                        <g filter="url(#shadow-sim)">
                          <rect x="335" y="65" width="120" height="70" rx="6" fill="var(--fs-alert-yellow-bg)" stroke="var(--fs-svg-node-stroke-block)" strokeWidth="1" strokeDasharray="3,3" />
                          <ellipse cx="395" cy="70" rx="60" ry="3.5" fill="var(--fs-svg-node-stroke-block)" opacity="0.1" />
                          <text x="395" y="88" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--fs-svg-text-block)">SnapMirror DR</text>
                          <text x="395" y="102" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-block)" fontWeight="600">Secondary Region</text>
                          <text x="395" y="116" textAnchor="middle" fontSize="7" fill="var(--fs-svg-text-block)">Async replication</text>
                        </g>

                        {/* Connectors */}
                        <path d="M 105 100 L 155 70" fill="none" stroke="var(--fs-svg-node-stroke-client)" strokeWidth="1.5" markerEnd="url(#acn-blue)" />
                        <path d="M 217 90 L 217 110" fill="none" stroke="var(--fs-svg-node-stroke-block)" strokeWidth="1.5" markerEnd="url(#acn-orange)" />
                        <path d="M 280 60 Q 307.5 50 335 75" fill="none" stroke="var(--fs-svg-node-stroke-origin)" strokeWidth="1.5" markerEnd="url(#acn-green)" />

                        {/* Flow stream particles */}
                        {isSimulating && (
                          <g>
                            {/* SAP writes to SSD hot storage */}
                            <circle r="4" fill="var(--fs-svg-text-client)">
                              <animateMotion dur="1s" repeatCount="indefinite" path="M 105 100 L 155 70" />
                            </circle>
                            {/* Cold blocks shifting down to capacity pool */}
                            <circle r="4.5" fill="var(--fs-svg-text-block)">
                              <animateMotion dur="1.8s" repeatCount="indefinite" path="M 217 90 L 217 110" />
                            </circle>
                            {/* SnapMirror async replicator sync channel */}
                            <circle r="3.5" fill="var(--fs-svg-node-stroke-origin)">
                              <animateMotion dur="2.2s" begin="0.4s" repeatCount="indefinite" path="M 280 60 Q 307.5 50 335 75" />
                            </circle>
                          </g>
                        )}
                      </g>
                    )}

                    {/* Scenario 5: Hybrid S3 Storage Gateway */}
                    {activeScenario === 'gateway_hybrid' && (
                      <g>
                        {/* On-prem application host */}
                        <g filter="url(#shadow-sim)">
                          <circle cx="50" cy="100" r="18" fill="url(#grad-client-sim)" stroke="var(--fs-svg-node-stroke-client)" strokeWidth="1.5" />
                          <text x="50" y="100" textAnchor="middle" dominantBaseline="central" fontSize="8" fontWeight="800" fill="var(--fs-svg-text-client)">NFS</text>
                          <text x="50" y="130" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="var(--color-text-secondary)">On-Prem Host</text>
                        </g>

                        {/* Storage Gateway Cached VM appliance */}
                        <g filter="url(#shadow-sim)">
                          <rect x="135" y="55" width="100" height="90" rx="6" fill="var(--fs-alert-yellow-bg)" stroke="var(--fs-svg-node-stroke-block)" strokeWidth="1.5" />
                          <ellipse cx="185" cy="60" rx="50" ry="4" fill="var(--fs-svg-node-stroke-block)" opacity="0.2" />
                          <text x="185" y="76" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--fs-svg-text-block)">Storage Gateway</text>
                          <text x="185" y="88" textAnchor="middle" fontSize="7" fill="var(--fs-svg-text-block)" fontWeight="600">Local VM appliance</text>
                          <rect x="145" y="102" width="80" height="25" rx="4" fill="var(--fs-alert-yellow-bg)" stroke="var(--fs-svg-node-stroke-block)" strokeWidth="1" />
                          <text x="185" y="117" textAnchor="middle" fontSize="7.5" fontWeight="800" fill="var(--fs-svg-text-block)">💾 Hot SSD Cache</text>
                        </g>

                        {/* Secure VPN tunnel */}
                        <g filter="url(#shadow-sim)">
                          <rect x="260" y="80" width="80" height="40" rx="4" fill="var(--color-background-secondary)" stroke="var(--fs-svg-node-stroke-client)" strokeWidth="1" />
                          <text x="300" y="97" textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--fs-svg-text-client)">VPN Tunnel</text>
                          <text x="300" y="109" textAnchor="middle" fontSize="6.5" fill="var(--fs-svg-text-client)">TLS HTTPS sync</text>
                        </g>

                        {/* Amazon S3 target */}
                        <g filter="url(#shadow-sim)">
                          <rect x="365" y="65" width="95" height="70" rx="6" fill="var(--fs-alert-green-bg)" stroke="var(--fs-svg-node-stroke-origin)" strokeWidth="1.5" />
                          <ellipse cx="412.5" cy="70" rx="47.5" ry="3.5" fill="var(--fs-svg-node-stroke-origin)" opacity="0.2" />
                          <text x="412.5" y="88" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--fs-svg-text-origin)">🪣 Amazon S3</text>
                          <text x="412.5" y="102" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-origin)" fontWeight="600">Infinite S3 Bucket</text>
                          <text x="412.5" y="116" textAnchor="middle" fontSize="6.5" fill="var(--fs-svg-text-origin)" fontWeight="600">Cloud Target</text>
                        </g>

                        {/* Flow lines */}
                        <path d="M 68 100 L 135 100" fill="none" stroke="var(--fs-svg-node-stroke-block)" strokeWidth="1.5" markerEnd="url(#acn-orange)" />
                        <path d="M 235 100 L 260 100" fill="none" stroke="var(--fs-svg-node-stroke-inode)" strokeWidth="1.5" markerEnd="url(#acn-purple)" />
                        <path d="M 340 100 L 365 100" fill="none" stroke="var(--fs-svg-node-stroke-origin)" strokeWidth="1.5" markerEnd="url(#acn-green)" />

                        {/* Traffic animation particles */}
                        {isSimulating && (
                          <g>
                            {/* Server saves file instantly to SSD cache */}
                            <circle r="4" fill="var(--fs-svg-text-block)">
                              <animateMotion dur="0.8s" repeatCount="indefinite" path="M 50 100 L 135 100" />
                            </circle>
                            {/* Gateway background upload thread transfers over VPN */}
                            <circle r="4.5" fill="var(--fs-svg-text-inode)">
                              <animateMotion dur="2.2s" begin="0.2s" repeatCount="indefinite" path="M 135 100 Q 185 100 235 100 L 260 100 L 340 100 L 365 100 L 412 100" />
                            </circle>
                          </g>
                        )}
                      </g>
                    )}

                    {/* Scenario 6: Large Scale 100 TB AWS DataSync Migration */}
                    {activeScenario === 'datasync_migration' && (
                      <g>
                        {/* On-premises Corporate NAS Source */}
                        <g filter="url(#shadow-sim)">
                          <rect x="20" y="60" width="90" height="80" rx="6" fill="url(#grad-client-sim)" stroke="var(--fs-svg-node-stroke-inode)" strokeWidth="1.5" />
                          <ellipse cx="65" cy="65" rx="45" ry="4" fill="var(--fs-svg-node-stroke-inode)" opacity="0.2" />
                          <text x="65" y="82" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--fs-svg-text-inode)">On-Prem NAS</text>
                          <text x="65" y="96" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-inode)" fontWeight="600">Local Source Files</text>
                          <text x="65" y="112" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--fs-svg-text-inode)">100 TB Payload</text>
                        </g>

                        {/* AWS DataSync Transfer Agent */}
                        <g filter="url(#shadow-sim)">
                          <rect x="160" y="70" width="90" height="60" rx="6" fill="var(--color-background-primary)" stroke="var(--fs-svg-node-stroke)" strokeWidth="1" />
                          <text x="205" y="88" textAnchor="middle" fontSize="8" fontWeight="800" fill="var(--color-text-secondary)">DataSync Agent</text>
                          <text x="205" y="100" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-origin)" fontWeight="700">AGENT ACTIVE 🟢</text>
                          <text x="205" y="112" textAnchor="middle" fontSize="6.5" fill="var(--color-text-tertiary)">SHA-256 Check</text>
                        </g>

                        {/* Target Amazon S3 Bucket */}
                        <g filter="url(#shadow-sim)">
                          <rect x="325" y="30" width="125" height="55" rx="6" fill="url(#grad-primary-sim)" stroke="var(--fs-svg-node-stroke-origin)" strokeWidth="1.5" />
                          <ellipse cx="387.5" cy="35" rx="62.5" ry="3.5" fill="var(--fs-svg-node-stroke-origin)" opacity="0.2" />
                          <text x="387.5" y="52" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--fs-svg-text-origin)">🪣 Target Amazon S3</text>
                          <text x="387.5" y="65" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-origin)" fontWeight="600">Sync Target volume 1</text>
                        </g>

                        {/* Target Amazon EFS POSIX filesystem */}
                        <g filter="url(#shadow-sim)">
                          <rect x="325" y="115" width="125" height="55" rx="6" fill="url(#grad-primary-sim)" stroke="var(--fs-svg-node-stroke-origin)" strokeWidth="1.5" />
                          <ellipse cx="387.5" cy="120" rx="62.5" ry="3.5" fill="var(--fs-svg-node-stroke-origin)" opacity="0.2" />
                          <text x="387.5" y="137" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--fs-svg-text-origin)">📂 Target AWS EFS</text>
                          <text x="387.5" y="150" textAnchor="middle" fontSize="7.5" fill="var(--fs-svg-text-origin)" fontWeight="600">Sync Target volume 2</text>
                        </g>

                        {/* Channels */}
                        <path d="M 110 100 L 160 100" fill="none" stroke="var(--fs-svg-node-stroke-inode)" strokeWidth="1.5" markerEnd="url(#acn-purple)" />
                        <path d="M 250 90 L 325 60" fill="none" stroke="var(--fs-svg-node-stroke-origin)" strokeWidth="1.5" markerEnd="url(#acn-green)" />
                        <path d="M 250 110 L 325 140" fill="none" stroke="var(--fs-svg-node-stroke-origin)" strokeWidth="1.5" markerEnd="url(#acn-green)" />

                        {/* Animation particle flow responding dynamically to datasyncBandwidth */}
                        {isSimulating && (
                          <g>
                            {/* NAS to DataSync Agent */}
                            <circle r="4" fill="var(--fs-svg-text-inode)">
                              <animateMotion dur={Math.max(0.4, 4 - datasyncBandwidth / 2500) + 's'} repeatCount="indefinite" path="M 110 100 L 160 100" />
                            </circle>
                            {/* Agent to target S3 */}
                            <circle r="4" fill="var(--fs-svg-node-stroke-origin)">
                              <animateMotion dur={Math.max(0.4, 4 - datasyncBandwidth / 2500) + 's'} repeatCount="indefinite" path="M 250 90 L 325 60" />
                            </circle>
                            {/* Agent to target EFS */}
                            <circle r="4" fill="var(--fs-svg-node-stroke-origin)">
                              <animateMotion dur={Math.max(0.4, 4 - datasyncBandwidth / 2500) + 's'} begin="0.25s" repeatCount="indefinite" path="M 250 110 L 325 140" />
                            </circle>
                          </g>
                        )}
                      </g>
                    )}
                  </svg>

                  {/* KPI Meters */}
                  <div style={{ width: '100%', marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                      <span>Workload Operational KPIs:</span>
                    </div>
                    <div className="fs-grid3" style={{ gap: '6px' }}>
                      {/* Latency Gauge */}
                      <div style={{ background: 'var(--color-background-secondary)', border: '1.5px solid var(--fs-border-primary)', borderRadius: '4px', padding: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '7px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Latency</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: activeScenario === 'zfs_dev' || activeScenario === 'gateway_hybrid' ? 'var(--fs-svg-text-origin)' : 'var(--fs-svg-text-client)' }}>
                          {activeScenario === 'zfs_dev' ? '< 0.5 ms' : activeScenario === 'gateway_hybrid' ? '< 1 ms (cached)' : activeScenario === 'datasync_migration' ? '12 ms' : activeScenario === 'lustre_ml' ? '1 ms' : activeScenario === 'windows_multiaz' ? '1.5 ms' : '2.0 ms'}
                        </div>
                      </div>
                      {/* IOPS Gauge */}
                      <div style={{ background: 'var(--color-background-secondary)', border: '1.5px solid var(--fs-border-primary)', borderRadius: '4px', padding: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '7px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Read IOPS</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: activeScenario === 'lustre_ml' ? 'var(--fs-svg-text-block)' : 'var(--fs-svg-text-client)' }}>
                          {activeScenario === 'lustre_ml' ? '150,000' : activeScenario === 'zfs_dev' ? '80,000' : activeScenario === 'datasync_migration' ? '120,000' : activeScenario === 'ontap_enterprise' ? '60,000' : '20,000'}
                        </div>
                      </div>
                      {/* Throughput Gauge */}
                      <div style={{ background: 'var(--color-background-secondary)', border: '1.5px solid var(--fs-border-primary)', borderRadius: '4px', padding: '6px', textAlign: 'center' }}>
                        <div style={{ fontSize: '7px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Throughput</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: activeScenario === 'lustre_ml' ? 'var(--fs-svg-text-inode)' : 'var(--fs-svg-text-client)' }}>
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
                  <span style={{ color: 'var(--color-text-tertiary)', marginRight: '6px' }}>[{log.timestamp}]</span>
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
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                Unsure which AWS storage, database, or migration service is best suited for your workload? Complete this dynamic questionnaire, and our architectural engine will calculate the ideal storage path based on your protocol, residency, and latency requirements.
              </div>

              <div className="fs-grid3" style={{ gap: '14px', marginBottom: '16px' }}>
                {/* Selector 1: Data Type */}
                <div className={`fs-advisor-box ${advisorDataType ? 'fs-active' : ''}`}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                    💾 1. Data Type & Protocol
                  </label>
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
                <div className={`fs-advisor-box ${advisorAccess ? 'fs-active' : ''}`}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                    📍 2. Core Access Location
                  </label>
                  <select value={advisorAccess} onChange={(e) => { setAdvisorAccess(e.target.value); setAdvisorResult(null); }}>
                    <option value="cloud">Cloud-Native (100% Hosted inside AWS Networks)</option>
                    <option value="hybrid">Hybrid Cloud (Local corporate cache + backed by AWS)</option>
                  </select>
                </div>

                {/* Selector 3: Performance Priority */}
                <div className={`fs-advisor-box ${advisorMigration ? 'fs-active' : ''}`}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                    ⚡ 3. Performance Constraint
                  </label>
                  <select value={advisorMigration} onChange={(e) => { setAdvisorMigration(e.target.value); setAdvisorResult(null); }}>
                    <option value="ultra_low">Sub-millisecond latency (&lt; 1ms speed)</option>
                    <option value="high_tps">High Concurrency (Hundreds of parallel readers)</option>
                    <option value="cost_eff">Cost Efficiency (Deep cold archives / HDD tiering)</option>
                  </select>
                </div>
              </div>

              <div className="fs-btnbar" style={{ marginBottom: '16px' }}>
                <button className="fs-btn fs-primary" style={{ width: '100%', padding: '12px', fontWeight: 700, justifyContent: 'center', fontSize: '13px', borderRadius: '10px' }} onClick={handleRunAdvisor}>
                  🔍 Compute Storage Advisor Recommendation
                </button>
              </div>

              {/* Advisor Results Display */}
              {advisorResult && (
                <div style={{ background: 'var(--fs-alert-green-bg)', border: '1.5px solid var(--fs-alert-green-border)', borderRadius: '12px', padding: '16px', boxShadow: '0 4px 16px rgba(16, 185, 129, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>🎯</span>
                    <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--fs-alert-green-text)' }}>
                      AWS Storage Advisor Architect Recommendation:
                    </span>
                    <span className="fs-matrix-badge fs-badge-latency-ultra" style={{ marginLeft: 'auto' }}>MATCH FOUND</span>
                  </div>
                  <div style={{ fontSize: '13px', lineHeight: '1.6', color: 'var(--fs-alert-green-subtext)', marginBottom: '10px' }}>
                    <strong style={{ fontSize: '14px', color: 'var(--fs-alert-green-text)' }}>{advisorResult.split(':')[0]}:</strong> {advisorResult.substring(advisorResult.indexOf(':') + 1)}
                  </div>
                  
                  {/* Complementary architectures / tags */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', borderTop: '1px solid rgba(16, 185, 129, 0.25)', paddingTop: '10px', marginTop: '6px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--fs-alert-green-text)', fontWeight: 600 }}>💡 Best Integration Complement:</span>
                    {advisorDataType === 'object' && <span className="fs-matrix-badge fs-badge-object">Amazon CloudFront CDN</span>}
                    {advisorDataType === 'win_file' && <span className="fs-matrix-badge fs-badge-file">Active Directory Connector</span>}
                    {advisorDataType === 'linux_hpc' && <span className="fs-matrix-badge fs-badge-latency-ultra">Amazon EC2 GPU Clusters</span>}
                    {advisorDataType === 'multi_proto' && <span className="fs-matrix-badge fs-badge-multiproto">SAP HANA / Oracle DB</span>}
                    {advisorDataType === 'zfs_file' && <span className="fs-matrix-badge fs-badge-latency-ultra">DevOps Dataset Snapshots</span>}
                    {advisorDataType === 'linux_shared' && <span className="fs-matrix-badge fs-badge-file">AWS Lambda Serverless</span>}
                    <span className="fs-matrix-badge fs-badge-latency-low" style={{ background: 'rgba(16, 185, 129, 0.1)', border: 'none' }}>
                      Resilience: Tier-4 (High)
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="fs-sec">Master AWS Storage &amp; Database Decision Flow Matrix</div>
            <div className="fs-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px', color: 'var(--color-text-secondary)' }}>
                This unified matrix contrasts the performance, protocols, limits, and primary use cases across all **14 key storage, migration, and database families** to serve as a fast architectural reference.
              </div>

              {/* Table Interactive Filters */}
              <div className="fs-filter-bar">
                <button className={`fs-filter-btn ${tableFilter === 'all' ? 'fs-active' : ''}`} onClick={() => setTableFilter('all')}>📂 All Families (14)</button>
                <button className={`fs-filter-btn ${tableFilter === 'object' ? 'fs-active' : ''}`} onClick={() => setTableFilter('object')}>🪣 Object Storage</button>
                <button className={`fs-filter-btn ${tableFilter === 'block' ? 'fs-active' : ''}`} onClick={() => setTableFilter('block')}>💾 Block Storage</button>
                <button className={`fs-filter-btn ${tableFilter === 'file' ? 'fs-active' : ''}`} onClick={() => setTableFilter('file')}>📁 Shared File Systems</button>
                <button className={`fs-filter-btn ${tableFilter === 'hybrid' ? 'fs-active' : ''}`} onClick={() => setTableFilter('hybrid')}>🔌 Hybrid &amp; Transfer</button>
                <button className={`fs-filter-btn ${tableFilter === 'db' ? 'fs-active' : ''}`} onClick={() => setTableFilter('db')}>🛢️ Databases</button>
              </div>

              {/* Comprehensive Storage Decision Table */}
              <div style={{ overflowX: 'auto' }}>
                <table className="fs-table" style={{ minWidth: '850px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '180px' }}>Service Family</th>
                      <th style={{ width: '130px' }}>💾 Access Type</th>
                      <th style={{ width: '170px' }}>🔑 Primary Protocols</th>
                      <th style={{ width: '130px' }}>⚡ Latency Spec</th>
                      <th style={{ width: '190px' }}>📦 Concurrency Limits</th>
                      <th>🎯 Best Real-World Workload Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(tableFilter === 'all' || tableFilter === 'object') && (
                      <tr>
                        <td><strong>🪣 Amazon S3</strong></td>
                        <td><span className="fs-matrix-badge fs-badge-object">Object</span></td>
                        <td><code style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}>HTTPS REST API</code></td>
                        <td><span className="fs-matrix-badge fs-badge-latency-mid">10–12 ms</span></td>
                        <td>Infinite Scale (100+ PB)</td>
                        <td>Static website hosting, dynamic web logs, data lakes, backend assets</td>
                      </tr>
                    )}
                    {(tableFilter === 'all' || tableFilter === 'object') && (
                      <tr>
                        <td><strong>📼 S3 Glacier</strong></td>
                        <td><span className="fs-matrix-badge fs-badge-object" style={{ opacity: 0.85 }}>Object (Archive)</span></td>
                        <td><code style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}>HTTPS REST API</code></td>
                        <td><span className="fs-matrix-badge fs-badge-latency-slow">Minutes to 12 Hrs</span></td>
                        <td>Infinite Scale (Tape pool)</td>
                        <td>Regulatory cold database archives, compliance records, historical snaps</td>
                      </tr>
                    )}
                    {(tableFilter === 'all' || tableFilter === 'block') && (
                      <tr>
                        <td><strong>💾 Amazon EBS</strong></td>
                        <td><span className="fs-matrix-badge fs-badge-block">Block (Persistent)</span></td>
                        <td><code style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}>NVMe / PCIe Block API</code></td>
                        <td><span className="fs-matrix-badge fs-badge-latency-ultra">&lt; 1 ms</span></td>
                        <td>Single EC2 Node mount</td>
                        <td>EC2 system boot volumes, transactional relational databases (RDS/SQL)</td>
                      </tr>
                    )}
                    {(tableFilter === 'all' || tableFilter === 'block') && (
                      <tr>
                        <td><strong>⚡ Instance Store</strong></td>
                        <td><span className="fs-matrix-badge fs-badge-block" style={{ opacity: 0.85 }}>Block (Ephemeral)</span></td>
                        <td><code style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}>SATA / NVMe Bus</code></td>
                        <td><span className="fs-matrix-badge fs-badge-latency-ultra">Microseconds</span></td>
                        <td>Single Motherboard Hypervisor</td>
                        <td>Temporary swap spaces, high-speed RAM caching buffers, NoSQL scratch disks</td>
                      </tr>
                    )}
                    {(tableFilter === 'all' || tableFilter === 'file') && (
                      <tr>
                        <td><strong>📂 Amazon EFS</strong></td>
                        <td><span className="fs-matrix-badge fs-badge-file">Shared File</span></td>
                        <td><code style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}>NFS v4.0 / NFS v4.1</code></td>
                        <td><span className="fs-matrix-badge fs-badge-latency-low">1.5–3 ms</span></td>
                        <td>Thousands of concurrent Linux nodes</td>
                        <td>Shared developer home folders, serverless AWS Lambda backend volumes</td>
                      </tr>
                    )}
                    {(tableFilter === 'all' || tableFilter === 'file') && (
                      <tr>
                        <td><strong>🗄️ FSx for Windows</strong></td>
                        <td><span className="fs-matrix-badge fs-badge-file">Shared File (SMB)</span></td>
                        <td><code style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}>SMB v2.0 to v3.1.1</code></td>
                        <td><span className="fs-matrix-badge fs-badge-latency-low">1.5–3 ms</span></td>
                        <td>Multiple Active Directory users</td>
                        <td>Corporate user file shares, Microsoft active directory, Windows legacy apps</td>
                      </tr>
                    )}
                    {(tableFilter === 'all' || tableFilter === 'file') && (
                      <tr>
                        <td><strong>🚀 FSx for Lustre</strong></td>
                        <td><span className="fs-matrix-badge fs-badge-latency-ultra">Parallel File (HPC)</span></td>
                        <td><code style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}>Lustre Client Driver</code></td>
                        <td><span className="fs-matrix-badge fs-badge-latency-ultra">&lt; 1 ms NVMe</span></td>
                        <td>Tens of thousands of HPC GPU nodes</td>
                        <td>SageMaker AI training, high-performance rendering, heavy analytics</td>
                      </tr>
                    )}
                    {(tableFilter === 'all' || tableFilter === 'file') && (
                      <tr>
                        <td><strong>🌌 FSx for ONTAP</strong></td>
                        <td><span className="fs-matrix-badge fs-badge-multiproto">Multi-Protocol</span></td>
                        <td><code style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}>NFS, SMB, and iSCSI</code></td>
                        <td><span className="fs-matrix-badge fs-badge-latency-low">1.5–3.5 ms</span></td>
                        <td>Petabyte-scale FlexGroup volumes</td>
                        <td>Enterprise SAP HANA backends, SQL DB, local NetApp migration backups</td>
                      </tr>
                    )}
                    {(tableFilter === 'all' || tableFilter === 'file') && (
                      <tr>
                        <td><strong>⚡ FSx for OpenZFS</strong></td>
                        <td><span className="fs-matrix-badge fs-badge-file">Shared File (ZFS)</span></td>
                        <td><code style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}>NFS v3, NFS v4</code></td>
                        <td><span className="fs-matrix-badge fs-badge-latency-ultra">&lt; 0.5 ms SSD</span></td>
                        <td>Linux and Unix instances</td>
                        <td>Dynamic developer sandboxes (dataset clones), low-latency web caches</td>
                      </tr>
                    )}
                    {(tableFilter === 'all' || tableFilter === 'hybrid') && (
                      <tr>
                        <td><strong>🔌 AWS Storage Gateway</strong></td>
                        <td><span className="fs-matrix-badge fs-badge-hybrid">Hybrid Gateway</span></td>
                        <td><code style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}>NFS, SMB, iSCSI, VTL</code></td>
                        <td><span className="fs-matrix-badge fs-badge-latency-ultra">&lt; 1 ms Local Cache</span></td>
                        <td>Datacenter local network client nodes</td>
                        <td>Local branch caches, backup Volume/Tape snap mirroring, hybrid architectures</td>
                      </tr>
                    )}
                    {(tableFilter === 'all' || tableFilter === 'hybrid') && (
                      <tr>
                        <td><strong>🔌 AWS DataSync</strong></td>
                        <td><span className="fs-matrix-badge fs-badge-mig-online">Migration (Online)</span></td>
                        <td><code style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}>NFS, SMB, AWS API</code></td>
                        <td><span className="fs-matrix-badge fs-badge-latency-high">N/A (Online Sync)</span></td>
                        <td>Parallels multi-threaded threads</td>
                        <td>Scheduled migrations from local datacenters to cloud buckets</td>
                      </tr>
                    )}
                    {(tableFilter === 'all' || tableFilter === 'hybrid') && (
                      <tr>
                        <td><strong>💼 AWS Transfer Family</strong></td>
                        <td><span className="fs-matrix-badge fs-badge-mig-online" style={{ opacity: 0.8 }}>Secure Transfer</span></td>
                        <td><code style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}>SFTP, FTPS, FTP</code></td>
                        <td><span className="fs-matrix-badge fs-badge-latency-high">N/A (Transfer)</span></td>
                        <td>Automated external client uploads</td>
                        <td>Automated external client file delivery directly to S3 or EFS backends</td>
                      </tr>
                    )}
                    {(tableFilter === 'all' || tableFilter === 'hybrid') && (
                      <tr>
                        <td><strong>📦 AWS Snow Family</strong></td>
                        <td><span className="fs-matrix-badge fs-badge-mig-offline">Migration (Offline)</span></td>
                        <td><code style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}>Physical Rugged Ingest</code></td>
                        <td><span className="fs-matrix-badge fs-badge-latency-slow">Days to Ship</span></td>
                        <td>Offline Petabytes copy scales</td>
                        <td>Migrations from edge settings (ships, mines) lacking active internet lines</td>
                      </tr>
                    )}
                    {(tableFilter === 'all' || tableFilter === 'db') && (
                      <tr>
                        <td><strong>🛢️ AWS Databases</strong></td>
                        <td><span className="fs-matrix-badge fs-badge-db">Database SQL/NoSQL</span></td>
                        <td><code style={{ fontSize: '11px', padding: '2px 4px', borderRadius: '4px' }}>SQL, GraphQL, NoSQL</code></td>
                        <td><span className="fs-matrix-badge fs-badge-latency-ultra">Sub-10ms (DynamoDB &lt;10ms)</span></td>
                        <td>Fully managed scale clusters</td>
                        <td>Transactional databases (Aurora/RDS), high-scale serverless apps (DynamoDB)</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="fs-sec">Active Storage Tiering &amp; Deduplication Calculator</div>
            <div className="fs-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                Enterprise filesystems like **NetApp ONTAP** and **Windows HDD** allow you to automatically shift inactive blocks (cold data) to cheaper storage tiers. Adjust this calculator to estimate monthly billing savings!
              </div>

              <div className="fs-grid2" style={{ gap: '16px' }}>
                {/* Slider controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="fs-ctrl" style={{ background: 'var(--fs-tab-bg)', border: '1.5px solid var(--fs-border-primary)' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-primary)' }}>
                      <span>Total Dataset Volume:</span>
                      <strong style={{ color: 'var(--fs-svg-text-client)' }}>{(totalDataGb / 1000).toFixed(0)} TB ({(totalDataGb).toLocaleString()} GB)</strong>
                    </label>
                    <input 
                      type="range" 
                      min="1000" 
                      max="100000" 
                      step="1000" 
                      value={totalDataGb} 
                      onChange={(e) => setTotalDataGb(parseInt(e.target.value))} 
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                      <span>1 TB</span>
                      <span>50 TB</span>
                      <span>100 TB</span>
                    </div>
                  </div>
                  
                  <div className="fs-ctrl" style={{ background: 'var(--fs-tab-bg)', border: '1.5px solid var(--fs-border-primary)' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-primary)' }}>
                      <span>Cold Data Ratio (Capacity Pool):</span>
                      <strong style={{ color: 'var(--fs-svg-text-block)' }}>{coldPercent}% Cold Blocks</strong>
                    </label>
                    <input 
                      type="range" 
                      min="10" 
                      max="90" 
                      step="5" 
                      value={coldPercent} 
                      onChange={(e) => setColdPercent(parseInt(e.target.value))} 
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                      <span>10% (Hot Workload)</span>
                      <span>50% (Balanced)</span>
                      <span>90% (Deep Archive)</span>
                    </div>
                  </div>
                </div>

                {/* HUD Command Line Console Terminal */}
                <div className="fs-terminal-hud">
                  <div className="fs-terminal-header">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="fs-terminal-led"></span>
                      <span>ONTAP FabricPool Optimization Engine</span>
                    </div>
                    <span>v4.2.1-PROD</span>
                  </div>

                  {/* Segmented active ratio bar graph */}
                  <div className="fs-ratio-bar-container">
                    <div className="fs-ratio-bar-ssd" style={{ width: `${100 - coldPercent}%` }}>
                      {100 - coldPercent >= 15 && `SSD: ${100 - coldPercent}%`}
                    </div>
                    <div className="fs-ratio-bar-hdd" style={{ width: `${coldPercent}%` }}>
                      {coldPercent >= 15 && `Capacity: ${coldPercent}%`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'monospace', color: 'var(--color-text-tertiary)', marginBottom: '12px' }}>
                    <span>Active SSD Pool (${(totalDataGb * (1 - coldPercent / 100)).toFixed(0)} GB)</span>
                    <span>Cold Capacity Pool (${(totalDataGb * (coldPercent / 100)).toFixed(0)} GB)</span>
                  </div>

                  {/* Calculations breakdown metrics */}
                  <div className="fs-terminal-grid">
                    <div className="fs-terminal-box fs-box-alert">
                      <div className="fs-terminal-title">Raw SSD Single-Tier</div>
                      <div className="fs-terminal-val">${costMetrics.totalSsdCost}</div>
                    </div>
                    
                    <div className="fs-terminal-box" style={{ borderColor: 'var(--fs-hud-box-border)' }}>
                      <div className="fs-terminal-title">Active Tiered Cost</div>
                      <div className="fs-terminal-val">${costMetrics.totalTieredCost}</div>
                    </div>
                    
                    <div className="fs-terminal-box fs-box-save" style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderStyle: 'dashed' }}>
                      <div>
                        <div className="fs-terminal-title" style={{ color: '#4ade80' }}>Monthly Savings (70% deduplicated estimate)</div>
                        <div className="fs-terminal-val" style={{ fontSize: '20px' }}>${costMetrics.monthlySavings} / mo</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="fs-terminal-title" style={{ color: '#4ade80' }}>Annualized Savings</div>
                        <div style={{ fontWeight: 800, fontSize: '13px' }}>${costMetrics.yearlySavings} / yr</div>
                      </div>
                    </div>
                  </div>

                  {/* Terminal CLI lines */}
                  <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', borderTop: '1.5px solid var(--fs-border-primary)', paddingTop: '8px', lineHeight: '1.4' }}>
                    <div style={{ color: '#38bdf8' }}>$ aws fsx update-volume --volume-id vol-ontap-09e --ontap-configuration TieringPolicy=&#123;Name=AUTO,CoolingPeriod=30&#125;</div>
                    <div style={{ color: '#4ade80' }}>&gt; ONTAP CLI: Policy 'AUTO' applied successfully. FabricPool Sweep sweeping... [OK]</div>
                    <div style={{ color: '#eab308' }}>&gt; Compression: 2.4:1 ratio enabled. Deduplication savings active. [SAVINGS IN EFFECT]</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
            </>
          </Translate>
        )}

      </div>
    </div>
  );
}
