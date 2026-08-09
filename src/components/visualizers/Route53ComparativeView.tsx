import React from 'react';
import { 
  Globe, 
  Activity, 
  Sliders, 
  Shield, 
  Network,
  RefreshCw
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface Route53ComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'concept' | 'routing' | 'health' | 'simulator' | 'architect') => void;
}

export default function Route53ComparativeView({ onNavigateToDemo }: Route53ComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'DNS Management Service',
      aws: 'Amazon Route 53 (Public & Private Hosted Zones)',
      azure: 'Azure DNS (Public & Private DNS Zones)',
      gcp: 'Google Cloud DNS (Public & Private Managed Zones)',
      icon: <Globe className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Traffic Routing Policies',
      aws: 'Simple, Weighted, Latency, Geolocation, Geoproximity, Failover',
      azure: 'Traffic Manager Profiles (Performance, Weighted, Priority, Geographic)',
      gcp: 'Cloud DNS Routing Policies (Weighted RR, Geolocation RR, Failover RR)',
      icon: <Sliders className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'DNS Health Checks & Failover',
      aws: 'Route 53 Health Checks (HTTP/HTTPS/TCP string match + Failover Routing)',
      azure: 'Traffic Manager Endpoint Monitoring & Failover',
      gcp: 'Cloud DNS Health-Checked IP targets (via Cloud Load Balancing)',
      icon: <Activity className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Hybrid Cloud & On-Prem Resolver',
      aws: 'Route 53 Resolver (Inbound / Outbound Endpoints + Rules)',
      azure: 'Azure Private Resolver (Inbound & Outbound Endpoints)',
      gcp: 'Cloud DNS Inbound / Outbound Server Policies & Forwarding Zones',
      icon: <Network className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Domain Name Registration',
      aws: 'Route 53 Domain Name Registrar (.com, .net, etc.)',
      azure: 'App Service Domain Registration (via GoDaddy integration)',
      gcp: 'Google Domains / Cloud Domains (integrated domain purchasing)',
      icon: <RefreshCw className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'DNSSEC & DDoS Protection',
      aws: 'Route 53 DNSSEC signing + AWS Shield Standard / Advanced',
      azure: 'Azure DNSSEC signing + Azure DDoS Protection',
      gcp: 'Cloud DNS DNSSEC (automatic KSK & ZSK signing) + Cloud Armor',
      icon: <Shield className="w-4 h-4 text-emerald-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'routing' | 'health'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '🌐 Intelligent Traffic Routing Policies',
      tab: 'routing',
      awsDesc: 'Route 53 evaluates Latency-based routing to return the DNS record with lowest round-trip latency to the client. Geolocation routes based on geographic location of DNS resolvers.',
      azureDesc: 'Azure Traffic Manager operates at the DNS level to route incoming requests to endpoints based on Performance, Priority, or Geographic routing methods across global regions.',
      gcpDesc: 'Google Cloud DNS Routing Policies allow configuring Weighted round-robin and Geolocation routing directly inside DNS resource record sets without external traffic managers.',
    },
    {
      title: '🛡️ DNS Health Checking & Automated Failover',
      tab: 'health',
      awsDesc: 'Route 53 monitors web app health via HTTP/HTTPS/TCP health checks. When a primary endpoint fails, Route 53 instantly removes its IP from DNS responses and routes to standby DR IPs.',
      azureDesc: 'Traffic Manager sends probe requests to endpoints. If an endpoint fails consecutive probes, Traffic Manager marks it unhealthy and routes DNS traffic to secondary endpoints.',
      gcpDesc: 'Cloud DNS integrates with Cloud Load Balancing health probes to ensure DNS records only return IP addresses of active, healthy backend service instances.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side DNS & Traffic Management Mappings
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 Amazon Route 53</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure DNS / Traffic Manager</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP Cloud DNS</th>
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
