import React from 'react';
import { 
  Zap, 
  Globe, 
  Sliders, 
  Cpu, 
  Shield, 
  Network,
  Activity
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface LoadBalancerComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'concept' | 'alb' | 'nlb' | 'simulation' | 'integrations' | 'notebook') => void;
}

export default function LoadBalancerComparativeView({ onNavigateToDemo }: LoadBalancerComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'L7 HTTP/HTTPS Load Balancer',
      aws: 'Application Load Balancer (ALB)',
      azure: 'Azure Application Gateway',
      gcp: 'Global / Regional External HTTP(S) Load Balancer',
      icon: <Globe className="w-4 h-4 text-sky-500" />
    },
    {
      concept: 'L4 TCP/UDP High Throughput LB',
      aws: 'Network Load Balancer (NLB)',
      azure: 'Azure Load Balancer (Standard / Basic SKU)',
      gcp: 'External / Internal TCP/UDP Network Load Balancer',
      icon: <Zap className="w-4 h-4 text-sky-500" />
    },
    {
      concept: 'L3/L4 Gateway Inline Inspection',
      aws: 'Gateway Load Balancer (GWLB)',
      azure: 'Gateway Load Balancer (Azure GWLB)',
      gcp: 'Internal Passthrough Network LB (Packet Mirroring)',
      icon: <Network className="w-4 h-4 text-sky-500" />
    },
    {
      concept: 'Routing Rules & Path-based',
      aws: 'Listener Rules (Path, Host-header, HTTP Method, Query string)',
      azure: 'Routing Rules (URL Path Maps, Multi-site Listener)',
      gcp: 'URL Maps (Host & Path matchers, Header-based routing)',
      icon: <Sliders className="w-4 h-4 text-sky-500" />
    },
    {
      concept: 'Backend Destination Groups',
      aws: 'Target Groups (EC2, IP, Lambda, ALB)',
      azure: 'Backend Pools (VMs, VMSS, IP addresses, App Service)',
      gcp: 'Backend Services / Network Endpoint Groups (NEGs)',
      icon: <Cpu className="w-4 h-4 text-sky-500" />
    },
    {
      concept: 'Static Public IP Allocation',
      aws: 'Static Elastic IP per AZ (NLB) / Anycast EIP (Global Accelerator + ALB)',
      azure: 'Static Public IP address (Standard Load Balancer)',
      gcp: 'Global External Anycast IP address (single IP worldwide)',
      icon: <Activity className="w-4 h-4 text-sky-500" />
    },
    {
      concept: 'WAF & Security Integration',
      aws: 'AWS WAF attached directly to ALB',
      azure: 'Azure Web Application Firewall (WAF) on App Gateway',
      gcp: 'Google Cloud Armor security policies on HTTP(S) LB',
      icon: <Shield className="w-4 h-4 text-sky-500" />
    }
  ];

  const comparativeDetails = [
    {
      title: '🌐 Layer 7 Application Load Balancing',
      tab: 'alb' as const,
      awsDesc: 'AWS ALB inspects HTTP/HTTPS traffic at Layer 7. It supports path routing (/v1/*), host routing (api.domain.com), gRPC, HTTP/2, WebSocket, and native AWS WAF association.',
      azureDesc: 'Azure Application Gateway is a dedicated L7 load balancer offering SSL offloading, URL path-based routing, cookie-based session affinity, and integrated WAF (OWASP rules).',
      gcpDesc: 'GCP External HTTP(S) Load Balancer operates at Layer 7 globally using Google Anycast IPs. URL Maps route requests to Backend Services or Serverless NEGs with Cloud CDN and Cloud Armor.',
    },
    {
      title: '⚡ Layer 4 Ultra-Low Latency Network Balancing',
      tab: 'nlb' as const,
      awsDesc: 'AWS NLB operates at Layer 4 (TCP, UDP, TLS). It handles tens of millions of requests/sec at ultra-low sub-millisecond latencies and provides static EIPs per Availability Zone.',
      azureDesc: 'Azure Load Balancer is a ultra-low latency L4 passthrough balancer operating on 5-tuple hash (Source IP, Source Port, Dest IP, Dest Port, Protocol) for TCP/UDP traffic.',
      gcpDesc: 'GCP Network Load Balancer is a regional, non-proxied L4 passthrough load balancer that distributes TCP/UDP traffic directly to VM backends without proxy overhead.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side Load Balancing Terminology & Service Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 AWS ELB</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure LB / AppGW</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP Cloud Load Balancing</th>
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
