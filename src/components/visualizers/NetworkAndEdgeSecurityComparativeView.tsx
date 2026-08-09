import React from 'react';
import { 
  ShieldAlert, 
  Shield, 
  Flame, 
  Activity, 
  Lock,
  Globe
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface NetworkAndEdgeSecurityComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'waf' | 'ddos' | 'firewall' | 'architect') => void;
}

export default function NetworkAndEdgeSecurityComparativeView({ onNavigateToDemo }: NetworkAndEdgeSecurityComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Web Application Firewall (WAF)',
      aws: 'AWS WAF (Web ACLs, Managed Rule Groups, Rate Limiting)',
      azure: 'Azure WAF (Application Gateway & Front Door policy engine)',
      gcp: 'Google Cloud Armor (WAF Managed Rules, Threat Intelligence)',
      icon: <ShieldAlert className="w-4 h-4 text-red-500" />
    },
    {
      concept: 'DDoS Protection Service',
      aws: 'AWS Shield Standard (Automatic) & Shield Advanced (24/7 DRT)',
      azure: 'Azure DDoS Network Protection & IP Protection',
      gcp: 'Google Cloud Armor Enterprise & Adaptive Protection (ML)',
      icon: <Shield className="w-4 h-4 text-red-500" />
    },
    {
      concept: 'Managed Stateful Network Firewall',
      aws: 'AWS Network Firewall (Suricata IPS/IDS inspection)',
      azure: 'Azure Firewall (Standard & Premium IDPS / TLS Inspection)',
      gcp: 'Google Cloud Next-Generation Firewall (NGFW Enterprise)',
      icon: <Flame className="w-4 h-4 text-red-500" />
    },
    {
      concept: 'Centralized Firewall Policy Manager',
      aws: 'AWS Firewall Manager (Global Organization-wide Security Policies)',
      azure: 'Azure Firewall Manager (VNet & Secure Virtual Hub policies)',
      gcp: 'GCP Firewall Policies (Hierarchical, Network & Region policies)',
      icon: <Lock className="w-4 h-4 text-red-500" />
    },
    {
      concept: 'Rate Limiting & Bot Control',
      aws: 'AWS WAF Bot Control & IP Rate-Based Rules',
      azure: 'Azure WAF Custom Rate Limiting Rules & Bot Protection',
      gcp: 'Cloud Armor Rate Limiting & reCAPTCHA Enterprise Integration',
      icon: <Activity className="w-4 h-4 text-red-500" />
    },
    {
      concept: 'Geo-Blocking & Threat Intel Filters',
      aws: 'AWS WAF Geo Match Conditions & IP Reputation Lists',
      azure: 'Azure WAF Geo-filtering & Microsoft Threat Intelligence',
      gcp: 'Cloud Armor Geo-location & Named IP Lists (Google Threat Intel)',
      icon: <Globe className="w-4 h-4 text-red-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'waf' | 'ddos'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '🛡️ Web Application Filtering & OWASP Top 10 Mitigation',
      tab: 'waf',
      awsDesc: 'AWS WAF inspects HTTP/S requests at CloudFront, ALB, or API Gateway. Evaluates SQLi, XSS, and custom rate limits (e.g., max 100 req / 5 min per IP) in under 1 ms.',
      azureDesc: 'Azure WAF integrates natively into Azure Application Gateway and Front Door edge routing. Uses OWASP Core Rule Sets (CRS 3.2) with custom regex and geo-exclusion rules.',
      gcpDesc: 'Google Cloud Armor protects Cloud Load Balancing endpoints globally, leveraging Google Threat Intelligence and pre-configured OWASP rules to block web exploits.',
    },
    {
      title: '⚡ Distributed Denial of Service (DDoS) Mitigation',
      tab: 'ddos',
      awsDesc: 'AWS Shield Standard protects all AWS customers against Layer 3/4 SYN floods automatically. Shield Advanced adds L7 attack mitigation and 24/7 access to the AWS DDoS Response Team (DRT).',
      azureDesc: 'Azure DDoS Network Protection provides adaptive tuning based on application traffic baselines, absorbing volumetric attacks before affecting VM resources or VNets.',
      gcpDesc: 'Cloud Armor Adaptive Protection uses Machine Learning models to analyze baseline traffic patterns, automatically generating custom WAF rules to drop L7 DDoS attacks.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side Network & Edge Security Terminology Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 AWS (WAF / Shield / Net Firewall)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure (WAF / Firewall)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP (Cloud Armor / NGFW)</th>
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
