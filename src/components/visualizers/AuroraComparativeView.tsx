import React from 'react';
import { 
  Database, 
  RefreshCw, 
  Globe, 
  Zap, 
  HardDrive,
  Copy,
  Cpu
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface AuroraComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'arch' | 'serverless' | 'global' | 'sim' | 'notebook') => void;
}

export default function AuroraComparativeView({ onNavigateToDemo }: AuroraComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Cloud-Native Engine Name',
      aws: 'Amazon Aurora (PostgreSQL / MySQL compatible)',
      azure: 'Azure SQL Database Hyperscale / Cosmos DB for PostgreSQL',
      gcp: 'Google Cloud Spanner / AlloyDB for PostgreSQL',
      icon: <Database className="w-4 h-4 text-indigo-500" />
    },
    {
      concept: 'Storage Architecture',
      aws: 'Distributed log-structured storage auto-scaling up to 128 TiB',
      azure: 'Hyperscale multi-tiered storage architecture up to 100 TB',
      gcp: 'Colossus distributed file system & Spanner split-storage',
      icon: <HardDrive className="w-4 h-4 text-indigo-500" />
    },
    {
      concept: 'Quorum & Data Replication',
      aws: '6-way storage replication across 3 Availability Zones (4 of 6 write quorum)',
      azure: 'Page servers with primary/secondary storage replicas',
      gcp: 'Paxos consensus algorithm (TrueTime API atomic clocks)',
      icon: <RefreshCw className="w-4 h-4 text-indigo-500" />
    },
    {
      concept: 'Serverless Auto-Scaling',
      aws: 'Aurora Serverless v2 (Instant scaling in fractions of ACUs)',
      azure: 'Azure SQL Database Serverless (Auto-scaling vCores & pause)',
      gcp: 'AlloyDB / Cloud Spanner Autoscaling (Dynamic node allocation)',
      icon: <Zap className="w-4 h-4 text-indigo-500" />
    },
    {
      concept: 'Global Database Replication',
      aws: 'Aurora Global Database (sub-second latency cross-region replication)',
      azure: 'Auto-failover Groups / Cosmos DB Multi-Region Write',
      gcp: 'Cloud Spanner Multi-Region Instance Configuration',
      icon: <Globe className="w-4 h-4 text-indigo-500" />
    },
    {
      concept: 'Read Replica Lag & Pool',
      aws: 'Up to 15 Aurora Replicas sharing storage (lag < 10ms)',
      azure: 'Up to 3 named replicas sharing Hyperscale page servers',
      gcp: 'Read-only replicas & read pools sharing distributed disk',
      icon: <Copy className="w-4 h-4 text-indigo-500" />
    },
    {
      concept: 'Instant Cloning (Copy-on-Write)',
      aws: 'Aurora Fast Database Cloning (instant Zero-Copy clone)',
      azure: 'Point-In-Time Restore to new database instance',
      gcp: 'AlloyDB / Spanner On-Demand Instant Database Copy',
      icon: <Cpu className="w-4 h-4 text-indigo-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'arch' | 'serverless'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '🌌 Shared Storage Engine & Quorum',
      tab: 'arch',
      awsDesc: 'Aurora decouples compute from storage. Data is divided into 10 GB protection groups, written 6 ways across 3 AZs. Writes succeed as soon as 4 of 6 storage nodes acknowledge.',
      azureDesc: 'Hyperscale uses a multi-tier architecture: Compute Nodes ➔ Log Service ➔ Page Servers ➔ Azure Storage. Reads hit local Page Server caches for high IOPS.',
      gcpDesc: 'Cloud Spanner relies on TrueTime API (atomic clocks + GPS receivers) to grant globally consistent serializable transactions across worldwide regions without lock contention.',
    },
    {
      title: '⚡ Serverless Auto-Scaling Compute',
      tab: 'serverless',
      awsDesc: 'Aurora Serverless v2 scales compute capacity in fine-grained Aurora Capacity Units (ACUs) instantly without dropping active database connections or warming caches.',
      azureDesc: 'Azure SQL Serverless automatically scales vCores based on workload demand and automatically pauses the database during inactive periods to save cost.',
      gcpDesc: 'Cloud Spanner and AlloyDB support automatic node scaling, adding processing units dynamically based on CPU and storage utilization metrics.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side Cloud-Native Database Terminology & Service Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 Amazon Aurora</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure SQL Hyperscale</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP Cloud Spanner / AlloyDB</th>
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
