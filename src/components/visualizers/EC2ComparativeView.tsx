import { 
  Zap, 
  Sliders, 
  Database, 
  Cpu, 
  HardDrive,
  Shield, 
  Info,
  Clock,
  CreditCard,
  Network
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface EC2ComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'overview' | 'security' | 'purchasing' | 'storage' | 'lifecycle' | 'best' | 'notebook' | 'unique') => void;
}

export default function EC2ComparativeView({ onNavigateToDemo }: EC2ComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Virtual Machine Service',
      aws: 'Amazon EC2 (Elastic Compute Cloud)',
      azure: 'Azure Virtual Machines',
      gcp: 'Google Cloud Compute Engine (GCE)',
      icon: <Cpu className="w-4 h-4 text-violet-500" />
    },
    {
      concept: 'Individual Instance',
      aws: 'EC2 Instance',
      azure: 'Virtual Machine (VM)',
      gcp: 'VM Instance',
      icon: <Cpu className="w-4 h-4 text-violet-500" />
    },
    {
      concept: 'Machine Template Image',
      aws: 'AMI (Amazon Machine Image)',
      azure: 'Azure Marketplace / Custom Image',
      gcp: 'Public / Custom Machine Image',
      icon: <Database className="w-4 h-4 text-violet-500" />
    },
    {
      concept: 'Sizing Suffixes',
      aws: 'Fixed Instance Types (e.g. t3.medium, c6g.xlarge)',
      azure: 'Fixed VM Sizes (e.g. Standard_D2s_v5)',
      gcp: 'Predefined Sizing & Custom Machine Shapes (vCPU/RAM)',
      icon: <Sliders className="w-4 h-4 text-violet-500" />
    },
    {
      concept: 'Bootstrapping Script',
      aws: 'User Data (Bash / Cloud-Init)',
      azure: 'Custom Data / Cloud-Init / Custom Script Extension',
      gcp: 'Startup Script (Metadata key: startup-script)',
      icon: <Zap className="w-4 h-4 text-violet-500" />
    },
    {
      concept: 'Firewall & Traffic Security',
      aws: 'Security Groups (Stateful, attached to ENIs)',
      azure: 'Network Security Groups (NSGs) (Stateful, attached to NIC/Subnet)',
      gcp: 'VPC Firewall Rules (Stateful, tag/Service Account based)',
      icon: <Shield className="w-4 h-4 text-violet-500" />
    },
    {
      concept: 'Ephemeral SSD (Direct-attached)',
      aws: 'Instance Store (Lost on stop/terminate)',
      azure: 'Temporary Disk (Lost on deallocate)',
      gcp: 'Local SSD (Lost on stop/terminate)',
      icon: <HardDrive className="w-4 h-4 text-violet-500" />
    },
    {
      concept: 'Network Block Storage',
      aws: 'EBS Volumes (gp3, io2 Block)',
      azure: 'Azure Managed Disks (Premium SSD v2, Standard Block)',
      gcp: 'Persistent Disks (pd-ssd, pd-balanced Block)',
      icon: <HardDrive className="w-4 h-4 text-violet-500" />
    },
    {
      concept: 'Shared Network File Storage',
      aws: 'Amazon EFS (NFSv4), Amazon FSx (SMB/Lustre)',
      azure: 'Azure Files (SMB/NFS), Azure NetApp Files',
      gcp: 'Google Cloud Filestore (NFSv3/v4)',
      icon: <HardDrive className="w-4 h-4 text-violet-500" />
    },
    {
      concept: 'Local Compute Scaling Group',
      aws: 'Auto Scaling Group (ASG)',
      azure: 'Virtual Machine Scale Set (VMSS)',
      gcp: 'Managed Instance Group (MIG)',
      icon: <Network className="w-4 h-4 text-violet-500" />
    },
    {
      concept: 'Low-cost Spare Capacity Compute',
      aws: 'Spot Instances (Interrupted with 2-min warning)',
      azure: 'Spot VMs (Interrupted with 30-sec warning or eviction)',
      gcp: 'Spot / Preemptible VMs (Max 24h for Preemptible, 30-sec warning)',
      icon: <CreditCard className="w-4 h-4 text-violet-500" />
    },
    {
      concept: 'Secure Metadata Endpoint',
      aws: 'IMDSv2 (Session-oriented token endpoint)',
      azure: 'Azure IMDS (Header-based metadata service)',
      gcp: 'GCP Metadata Server (Flavor-Header based)',
      icon: <Info className="w-4 h-4 text-violet-500" />
    },
    {
      concept: 'Maintenance Mode Migration',
      aws: 'Stop/Rebuild/Restart (Reboots physical host)',
      azure: 'Redeploy / Rebuild (Reboots physical host)',
      gcp: 'Live Migration (Moves running VM automatically with zero downtime)',
      icon: <Clock className="w-4 h-4 text-violet-500" />
    }
  ];

  const comparativeDetails = [
    {
      title: '💻 Machine Configurations & Custom Sizing',
      tab: 'overview' as const,
      awsDesc: 'AWS organizes instances into fixed families (T, M, C, R, I, G) and sizes (micro, large, xlarge). Burstable T-instances accumulate CPU credits to burst beyond baseline limits. Hardware options are tied to physical server profiles.',
      azureDesc: 'Azure groups VMs into specific series (A, B, D, E, F, L, M, N). B-series supports CPU credit bursting. Sizes are fixed, locking vCPU-to-memory ratios (e.g. 1 vCPU to 4GB RAM) for specific workload tiers.',
      gcpDesc: 'GCP offers standard machine types but uniquely supports Custom Machine Types. You can drag sliders to specify exact vCPU cores and RAM sizes (e.g. 6 vCPUs and 22 GB RAM) for N1/N2/E2 types to eliminate over-provisioning cost waste.',
    },
    {
      title: '🛡️ Virtual Network Firewalls & Routing',
      tab: 'security' as const,
      awsDesc: 'Security Groups are stateful host-level firewalls attached to Elastic Network Interfaces (ENIs). Rules can reference other Security Groups to configure microservices security without hardcoding IP subnets.',
      azureDesc: 'Network Security Groups (NSGs) contain prioritized security rules. NSGs are stateful and can be associated with individual VM Network Interfaces (NICs) or entire subnets. Application Security Groups (ASGs) group VMs logically.',
      gcpDesc: 'VPC Firewalls are stateful rules applied globally to the VPC network. Rules target instances using Network Tags or Service Accounts, allowing dynamic firewall grouping as VMs scale up or down.',
    },
    {
      title: '💰 Spot VMs & Eviction Mechanics',
      tab: 'purchasing' as const,
      awsDesc: 'Spot instances offer up to 90% discount. Prices change dynamically based on capacity. When AWS reclaims capacity, instances receive a 2-minute interruption warning via metadata endpoints before termination.',
      azureDesc: 'Spot VMs utilize unused Azure capacity with deep discounts. Reclaiming capacity triggers an eviction event (with a 30-second warning). Eviction rate maps show the likelihood of interruption per region/size.',
      gcpDesc: 'GCP Spot VMs (replacing Preemptible VMs) offer 60-91% discounts. When GCP needs the capacity, it sends an ACPI shutdown signal 30 seconds in advance. Preemptible VMs have a hard 24-hour runtime limit.',
    },
    {
      title: '💾 Block and Shared Network File Storage',
      tab: 'storage' as const,
      awsDesc: 'EBS provides network block storage (gp3, io2) with provisioned IOPS/throughput. Local direct SSD storage (Instance Store) is physical and fast but ephemeral. EFS offers fully managed NFS share mounts.',
      azureDesc: 'Managed Disks provide block storage. Ephemeral OS Disks store OS partitions directly in VM local cache/SSD for free and instant re-imaging. Azure Files offers standard SMB/NFS file shares.',
      gcpDesc: 'Persistent Disks (PD) provide durable block storage (replicated 3x). Local SSDs offer direct-attached physical NVMe performance. Filestore provides managed NFSv3/v4 storage mount instances.',
    },
    {
      title: '⚙️ Bootstrapping, SSH Keys & VM Metadata',
      tab: 'lifecycle' as const,
      awsDesc: 'AWS executes User Data scripts once during initial boot. SSH keys are injected during creation. Metadata is queried via IMDSv2 (session token-based http://169.254.169.254/latest/meta-data/).',
      azureDesc: 'Azure executes Custom Data scripts or Cloud-Init at boot. SSH keys are managed via OS profile properties. Metadata is accessed through IMDS requiring a special header: Metadata: true.',
      gcpDesc: 'GCP executes startup-script metadata properties. Public SSH keys are managed globally at the project or instance metadata level. Metadata server queries require Metadata-Flavor: Google header.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Table Comparison View */}
      <div className="ec2-card" style={{ padding: '20px', border: '1px solid var(--ec-card-border)', background: 'var(--ec-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side Terminology & Service Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 AWS EC2</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure VM</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP Compute Engine</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr 
                  key={idx} 
                  style={{ 
                    borderBottom: '1px solid var(--color-border-tertiary)', 
                    transition: 'background 0.2s' 
                  }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  <td style={{ padding: '10px 12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)' }}>
                    {row.icon}
                    {row.concept}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>{row.aws}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>{row.azure}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>{row.gcp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Concept Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {comparativeDetails.map((detail, idx) => (
          <div 
            key={idx} 
            className="ec2-card flex flex-col justify-between" 
            style={{ 
              padding: '16px', 
              border: '1px solid var(--ec-card-border)', 
              background: 'var(--ec-card-bg)',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                {detail.title}
              </div>
              <div className="space-y-3" style={{ fontSize: '11.5px', lineHeight: '1.45' }}>
                <div style={{ paddingLeft: '8px', borderLeft: '2.5px solid #FF9900' }}>
                  <strong style={{ color: '#FF9900' }}>AWS:</strong> <span style={{ color: 'var(--color-text-secondary)' }}>{detail.awsDesc}</span>
                </div>
                <div style={{ paddingLeft: '8px', borderLeft: '2.5px solid #0078D4' }}>
                  <strong style={{ color: '#0078D4' }}>Azure:</strong> <span style={{ color: 'var(--color-text-secondary)' }}>{detail.azureDesc}</span>
                </div>
                <div style={{ paddingLeft: '8px', borderLeft: '2.5px solid #0F9D58' }}>
                  <strong style={{ color: '#0F9D58' }}>GCP:</strong> <span style={{ color: 'var(--color-text-secondary)' }}>{detail.gcpDesc}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }} className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <button 
                onClick={() => onNavigateToDemo('aws', detail.tab)}
                className="ec2-btn text-[10px] py-1 px-2.5 flex items-center gap-1"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                🧡 Launch AWS Demo
              </button>
              <button 
                onClick={() => onNavigateToDemo('azure', detail.tab)}
                className="ec2-btn text-[10px] py-1 px-2.5 flex items-center gap-1"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                💙 Launch Azure Demo
              </button>
              <button 
                onClick={() => onNavigateToDemo('gcp', detail.tab)}
                className="ec2-btn text-[10px] py-1 px-2.5 flex items-center gap-1"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                💚 Launch GCP Demo
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
