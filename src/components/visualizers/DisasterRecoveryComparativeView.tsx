import React from 'react';
import { 
  RefreshCw, 
  Clock, 
  ShieldCheck, 
  Globe, 
  HardDrive,
  Activity
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface DisasterRecoveryComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'rpo-rto' | 'strategies' | 'backup' | 'failover' | 'architect') => void;
}

export default function DisasterRecoveryComparativeView({ onNavigateToDemo }: DisasterRecoveryComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Continuous Block-Level DR Replication',
      aws: 'AWS Elastic Disaster Recovery (DRS / Inuse Agent)',
      azure: 'Azure Site Recovery (ASR - VM & Physical server replication)',
      gcp: 'Google Cloud Backup and DR Service / Actifio engine',
      icon: <RefreshCw className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Centralized Multi-Service Backup Vault',
      aws: 'AWS Backup (Cross-account & Cross-region Vault Lock)',
      azure: 'Azure Backup (Recovery Services Vault / Backup Vault)',
      gcp: 'Google Cloud Backup and DR Management Console',
      icon: <HardDrive className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Object Storage Geo-Replication',
      aws: 'S3 Cross-Region Replication (CRR) & RTC (15-min SLA)',
      azure: 'Geo-Redundant Storage (GRS) & Read-Access GRS (RA-GRS)',
      gcp: 'Cloud Storage Dual-Region & Multi-Region Turbo Replication (15-min)',
      icon: <Globe className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'RPO / RTO Target Capabilities',
      aws: 'RPO: Sub-second (DRS block level); RTO: < 5-15 mins',
      azure: 'RPO: Sub-minute (ASR Delta sync); RTO: < 15 mins',
      gcp: 'RPO: Sub-second (Snapshot sync); RTO: < 10 mins',
      icon: <Clock className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'DNS & Traffic Routing Failover',
      aws: 'Route 53 Application Recovery Controller (ARC) & Health Checks',
      azure: 'Azure Traffic Manager / Front Door Health Probes & Priority Routing',
      gcp: 'Google Cloud DNS Health Checks & Failover Routing Policies',
      icon: <Activity className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Ransomware Immutability & Vault Lock',
      aws: 'AWS Backup Vault Lock (Compliance mode - WORM immutability)',
      azure: 'Azure Backup Immutable Vault & Multi-User Authorization (MUA)',
      gcp: 'Cloud Storage Retention Policies & Bucket Lock (WORM)',
      icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'rpo-rto' | 'strategies'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '⏱️ RPO (Recovery Point Objective) & RTO (Recovery Time Objective)',
      tab: 'rpo-rto',
      awsDesc: 'RPO measures maximum tolerable data loss in time (e.g. 5 seconds). RTO measures maximum downtime before service recovery. AWS DRS maintains sub-second RPO with low-cost staging resources.',
      azureDesc: 'Azure Site Recovery provides continuous data protection with delta replication every 30 seconds, maintaining RPO < 1 minute and automated failover orchestration via Recovery Plans.',
      gcpDesc: 'GCP Backup and DR tracks block changes continuously, supporting 15-minute RPO for Google Cloud VMware Engine and Compute Engine instances with automated instant recovery.',
    },
    {
      title: '🏢 Disaster Recovery Strategies: Pilot Light vs. Warm Standby',
      tab: 'strategies',
      awsDesc: 'Pilot Light keeps core databases replicated and idle compute AMIs ready. Warm Standby keeps scaled-down live instances running 24/7 in a secondary region, scaling up instantly during regional outages.',
      azureDesc: 'Pilot Light pairs minimal SQL Managed Instances with pre-created ARM templates. Warm Standby keeps small VM scale sets running continuously in a paired Azure region.',
      gcpDesc: 'Pilot Light leverages Cloud Storage replication + pre-configured Instance Templates. Warm Standby runs minimal active Compute Engine instances in a secondary GCP region.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side Disaster Recovery & Business Continuity Terminology Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 AWS (DRS / Backup)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure (ASR / Azure Backup)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP (Backup &amp; DR / GCS Dual-Region)</th>
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
