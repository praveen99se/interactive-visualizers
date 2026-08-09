import React from 'react';
import { 
  Network, 
  Share2, 
  Shield, 
  Workflow, 
  Radio,
  Globe
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface NetworkingVPCComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'vpc-basics' | 'tgw' | 'peering' | 'privatelink' | 'architect') => void;
}

export default function NetworkingVPCComparativeView({ onNavigateToDemo }: NetworkingVPCComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Virtual Network Boundary',
      aws: 'AWS VPC (Virtual Private Cloud - Regional)',
      azure: 'Azure VNet (Virtual Network - Regional)',
      gcp: 'Google Cloud VPC (Global VPC across all regions!)',
      icon: <Network className="w-4 h-4 text-sky-500" />
    },
    {
      concept: 'Hub-and-Spoke Interconnect Engine',
      aws: 'AWS Transit Gateway (TGW - Central regional router)',
      azure: 'Azure Virtual WAN (vWAN Hubs) / Route Server',
      gcp: 'Google Cloud Router & Network Connectivity Center (NCC)',
      icon: <Share2 className="w-4 h-4 text-sky-500" />
    },
    {
      concept: 'Network-to-Network Peering',
      aws: 'VPC Peering (Non-transitive, no overlapping CIDRs)',
      azure: 'VNet Peering (Global & Regional non-transitive peering)',
      gcp: 'VPC Network Peering (Global non-transitive peering)',
      icon: <Workflow className="w-4 h-4 text-sky-500" />
    },
    {
      concept: 'Private Endpoint Service Publishing',
      aws: 'AWS PrivateLink (VPC Endpoint Services / Interface Endpoints)',
      azure: 'Azure Private Link (Private Endpoints & Private Link Service)',
      gcp: 'Google Cloud Private Service Connect (PSC Endpoints)',
      icon: <Shield className="w-4 h-4 text-sky-500" />
    },
    {
      concept: 'Dedicated On-Premises Connection',
      aws: 'AWS Direct Connect (DX 1Gbps / 10Gbps / 100Gbps Dedicated)',
      azure: 'Azure ExpressRoute (Direct Private Circuit)',
      gcp: 'Google Cloud Interconnect (Dedicated & Partner Interconnect)',
      icon: <Radio className="w-4 h-4 text-sky-500" />
    },
    {
      concept: 'Outbound Internet Gateway Translation',
      aws: 'AWS NAT Gateway (Multi-AZ Managed NAT)',
      azure: 'Azure NAT Gateway (Subnet-level Managed NAT)',
      gcp: 'Google Cloud NAT (Regional Serverless NAT)',
      icon: <Globe className="w-4 h-4 text-sky-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'tgw' | 'privatelink'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '🌐 Central Hub-and-Spoke Transit Routing Architecture',
      tab: 'tgw',
      awsDesc: 'AWS Transit Gateway (TGW) connects thousands of VPCs and on-premises networks via a central regional hub, replacing complex mesh VPC peering with single attachment routes.',
      azureDesc: 'Azure Virtual WAN unifies networking, security, and routing functions into a managed hub-and-spoke architecture, routing traffic dynamically across global Azure regions.',
      gcpDesc: 'Google Cloud VPC is globally scoped by default! A single GCP VPC spans all Google regions worldwide, eliminating cross-region peering overhead entirely.',
    },
    {
      title: '🔒 Private Service Endpoint Publishing & Security',
      tab: 'privatelink',
      awsDesc: 'AWS PrivateLink creates ENI endpoints inside consumer VPCs to connect securely to provider services via AWS NLB without routing over the public internet.',
      azureDesc: 'Azure Private Link brings Azure PaaS services (SQL, Storage, Key Vault) inside customer VNets via private IP endpoints, blocking all public internet exposure.',
      gcpDesc: 'Google Cloud Private Service Connect allows consumers to access internal microservices across different GCP projects and organizations using internal IP forwarding rules.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side VPC & Core Networking Terminology Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 AWS (VPC / Transit Gateway)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure (VNet / Virtual WAN)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP (Global VPC / Cloud Router)</th>
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
