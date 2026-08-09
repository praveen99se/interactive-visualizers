import { 
  Zap, 
  Globe, 
  Sliders, 
  Activity, 
  Cpu, 
  HardDrive,
  Shield, 
  Clock,
  Heart,
  Network
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface ASGComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'concept' | 'arch' | 'policies' | 'health' | 'sim' | 'notebook') => void;
}

export default function ASGComparativeView({ onNavigateToDemo }: ASGComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Scaling Service Name',
      aws: 'Auto Scaling Groups (ASG)',
      azure: 'Virtual Machine Scale Sets (VMSS)',
      gcp: 'Managed Instance Groups (MIGs)',
      icon: <Network className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Sizing Blueprint',
      aws: 'Launch Template (vCPU, RAM, AMI, User Data)',
      azure: 'Scale Set VM Model / Custom Image',
      gcp: 'Instance Template (vCPU, RAM, Image, Startup Script)',
      icon: <Cpu className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Dynamic Scaling Policy',
      aws: 'Target Tracking / Step / Simple Scaling Rules',
      azure: 'Autoscale metric rules (average CPU, bandwidth, etc.)',
      gcp: 'Autoscaler (Target CPU, HTTP load, Pub/Sub depth)',
      icon: <Sliders className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Scale-down Cooldown',
      aws: 'Default Cooldown / Scaling-specific cooldowns',
      azure: 'Cooldown Period (Autoscale rule scale-in lock)',
      gcp: 'Autoscaling Cool-down Period (Warm-up wait)',
      icon: <Clock className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Graceful Connection Drain',
      aws: 'Connection Draining (ELB) / Deregistration Delay',
      azure: 'Connection Draining (Load Balancer / Application Gateway)',
      gcp: 'Connection Draining (Backend Services)',
      icon: <Zap className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Health Check Probes',
      aws: 'EC2 instance state / ELB Application Health checks',
      azure: 'Application Health Extension / Load Balancer probes',
      gcp: 'GCP HTTP(S) Health Checks / TCP health probes',
      icon: <Heart className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Auto Instance Repair',
      aws: 'Automatic Instance Replacement (re-create failed host)',
      azure: 'VMSS Automatic Repairs (re-create unhealthy VM disk/host)',
      gcp: 'MIG Autohealing (recreate failed VM after health probe fail)',
      icon: <Activity className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Lifecycle Interceptions',
      aws: 'ASG Lifecycle Hooks (Pending:Wait, Terminating:Wait)',
      azure: 'Custom Script Extension / Application Health Extensions',
      gcp: 'Instance Lifecycle Metadata / MIG Lifecycle Hooks',
      icon: <Shield className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Pre-warmed Spare Capacity',
      aws: 'ASG Warm Pools (Stopped/Running standby pools)',
      azure: 'Scale Set Standby VM Pool (Pre-provisioned VMs)',
      gcp: 'GCP Idle VM Pools / Managed Instance Group standby scale',
      icon: <HardDrive className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Multi-Zone Scaling',
      aws: 'ASG balances instances evenly across subnets/AZs',
      azure: 'VMSS Zone-Redundant (Spread VMs across Zones)',
      gcp: 'Regional MIGs (Auto-rebalance VMs across Zones)',
      icon: <Globe className="w-4 h-4 text-purple-500" />
    }
  ];

  const comparativeDetails = [
    {
      title: '📈 Fleet Scaling and Capacity Targets',
      tab: 'concept' as const,
      awsDesc: 'ASGs use Min, Max, and Desired capacity boundaries. Target Tracking automatically adjusts Desired capacity using CloudWatch metrics (like average CPU utilization) to keep load stable.',
      azureDesc: 'VMSS dynamically changes capacity using autoscale rules. A VMSS can define minimum, maximum, and default instances, scaling out or in incrementally based on metric thresholds.',
      gcpDesc: 'MIGs run autoscaling based on Target Utilization (e.g. keep VM CPU load at 60%). The GCP autoscaler adds or removes VM nodes automatically, rebalancing machines across selected zones.',
    },
    {
      title: '🏗️ Network Load Balancer Integrations',
      tab: 'arch' as const,
      awsDesc: 'Instances are registered in target groups attached to an Application Load Balancer (ALB). Route tables and public DNS map to the ALB endpoint which distributes traffic to the ASG instances.',
      azureDesc: 'Scale Sets integrate natively with Azure Load Balancers or Application Gateways. Traffic is routed to the Backend Pool, and instances are allocated internal IPs from the VNet subnet.',
      gcpDesc: 'MIGs attach to HTTP(S) or Network Load Balancers. An Instance Group Manager connects the VMs to Backend Services which handles traffic distribution and global regional routing.',
    },
    {
      title: '🛡️ Scaling Cooldowns and Load Stabilization',
      tab: 'policies' as const,
      awsDesc: 'Scaling cooldowns prevent the group from launching or terminating additional instances before previous scaling actions take effect, avoiding hyperactive capacity oscillations.',
      azureDesc: 'Autoscale rules define cooldown metrics in minutes. When a scaling event triggers, the cooldown period locks subsequent scaling rules to allow VM operating systems to boot and join traffic.',
      gcpDesc: 'GCP uses an Autoscaling Cool-down Period (warm-up time) to specify how long it takes for a VM instance to boot and initialize. The autoscaler ignores VM resource load during this warm-up interval.',
    },
    {
      title: '❤️ Health Checks, Autohealing & Repairs',
      tab: 'health' as const,
      awsDesc: 'ASGs monitor EC2 host status and load balancer health. If an instance fails target group health checks, the ASG terminates and replaces it to restore desired capacity.',
      azureDesc: 'VMSS Automatic Repairs monitor VM health using load balancer probes or Application Health extensions. Unhealthy VMs are automatically redeployed or re-imaged.',
      gcpDesc: 'GCP MIG Autohealing maps HTTP(S) health checks directly to the VMs. If a VM fails the check, GCP automatically recreates the VM in-place from the Instance Template.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side Fleet Terminology & Service Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 AWS ASG</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure VMSS</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP MIG</th>
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
            className="asg-card flex flex-col justify-between" 
            style={{ 
              padding: '16px', 
              border: '1px solid var(--asg-card-border)', 
              background: 'var(--asg-card-bg)',
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
                className="asg-btn text-[10px] py-1 px-2.5 flex items-center gap-1"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                🧡 Launch AWS Demo
              </button>
              <button 
                onClick={() => onNavigateToDemo('azure', detail.tab)}
                className="asg-btn text-[10px] py-1 px-2.5 flex items-center gap-1"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                💙 Launch Azure Demo
              </button>
              <button 
                onClick={() => onNavigateToDemo('gcp', detail.tab)}
                className="asg-btn text-[10px] py-1 px-2.5 flex items-center gap-1"
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
