import React from 'react';
import { 
  Globe, 
  Zap, 
  Shield, 
  Cpu, 
  Activity,
  HardDrive
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface CloudfrontComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'concept' | 'edge' | 'security' | 'sim' | 'notebook') => void;
}

export default function CloudfrontComparativeView({ onNavigateToDemo }: CloudfrontComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Content Delivery Network (CDN)',
      aws: 'Amazon CloudFront (600+ Edge PoPs worldwide)',
      azure: 'Azure Front Door / Azure CDN (Global Edge Network)',
      gcp: 'Google Cloud CDN / Media CDN (Google Global Edge Infrastructure)',
      icon: <Globe className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Edge Serverless Compute',
      aws: 'CloudFront Functions (sub-ms JS) & Lambda@Edge (Node/Python)',
      azure: 'Azure Front Door Rules Engine & Azure Functions at Edge',
      gcp: 'Edge Code Execution / Cloud Functions backend routing',
      icon: <Zap className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Origin Storage Authentication',
      aws: 'Origin Access Control (OAC) for S3 buckets',
      azure: 'Azure Private Link / Managed Identity for Blob Storage',
      gcp: 'Signed URLs / Signed Cookies / Service Account IAM for Cloud Storage',
      icon: <Shield className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Payload & Cache Controls',
      aws: 'Cache Policies, Origin Request Policies, Cache Keys',
      azure: 'Front Door Caching Rules, Query String Caching',
      gcp: 'Cloud CDN Cache Modes (FORCE_CACHE_ALL, USE_ORIGIN_HEADERS)',
      icon: <HardDrive className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Edge Security & WAF Integration',
      aws: 'AWS WAF attached directly to CloudFront distribution',
      azure: 'Azure Web Application Firewall (WAF) integrated on Front Door',
      gcp: 'Google Cloud Armor Edge Security Policies',
      icon: <Activity className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Field-Level Encryption',
      aws: 'CloudFront Field-Level Encryption (RSA pubkey encryption at Edge)',
      azure: 'Application Gateway / Front Door End-to-End TLS encryption',
      gcp: 'Cloud Armor / HTTPS Load Balancer End-to-End TLS encryption',
      icon: <Cpu className="w-4 h-4 text-purple-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'edge' | 'security'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '⚡ Edge Serverless & Request Manipulation',
      tab: 'edge',
      awsDesc: 'CloudFront Functions execute lightweight JavaScript code in sub-milliseconds at 600+ edge locations for header manipulation, URL redirects, and cache key normalization. Lambda@Edge runs full Node.js/Python for heavy logic.',
      azureDesc: 'Azure Front Door Rules Engine allows customizing HTTP request processing at the edge, rewriting URLs, modifying headers, and controlling cache behaviors dynamically.',
      gcpDesc: 'Google Cloud CDN leverages Google Anycast infrastructure to terminate TLS connections at the edge nearest the client, routing cache misses across Google internal backbone network.',
    },
    {
      title: '🔒 Secure Origin Access & Field Encryption',
      tab: 'security',
      awsDesc: 'CloudFront Origin Access Control (OAC) secures S3 origins using SigV4 authentication so bucket contents are never publicly accessible. Field-Level Encryption encrypts sensitive form POST fields at the edge.',
      azureDesc: 'Azure Front Door uses Azure Private Link to connect directly to storage accounts and web apps inside Private VNets without exposing origins to public internet IPs.',
      gcpDesc: 'Google Cloud CDN protects storage buckets via Signed URLs and Signed Cookies, preventing unauthorized content hotlinking while validating request signatures at edge PoPs.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side CDN & Edge Acceleration Terminology Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 Amazon CloudFront</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure Front Door / CDN</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP Cloud CDN / Media CDN</th>
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
