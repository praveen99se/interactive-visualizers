import React from 'react';
import { 
  Database, 
  RefreshCw, 
  Shield, 
  Activity, 
  HardDrive,
  Copy,
  Clock,
  Zap,
  Layers
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface RDSComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'overview' | 'multiaz' | 'replicas' | 'connect' | 'sim' | 'advanced' | 'unique') => void;
}

export default function RDSComparativeView({ onNavigateToDemo }: RDSComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Managed Relational DB Service',
      aws: 'Amazon RDS (PostgreSQL, MySQL, MariaDB, SQL Server, Oracle)',
      azure: 'Azure DB for PostgreSQL & MySQL (Flexible Server) / Azure SQL',
      gcp: 'Google Cloud SQL (PostgreSQL, MySQL, SQL Server) & AlloyDB',
      icon: <Database className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Cloud-Native Distributed Engine',
      aws: 'Amazon Aurora (Log-structured storage, auto-scaling up to 128 TiB)',
      azure: 'Azure SQL Hyperscale (Auto-scales to 100 TiB) / Cosmos DB Postgres (Citus)',
      gcp: 'Google AlloyDB for PostgreSQL (Columnar ML engine, 4x faster Postgres)',
      icon: <Zap className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'High Availability Multi-AZ Mechanics',
      aws: 'RDS Multi-AZ (Synchronous block-level mirror + Auto DNS swap < 60s)',
      azure: 'Flexible Server HA (Zone-redundant storage mirror + Auto CNAME failover)',
      gcp: 'Cloud SQL HA (Regional Persistent Disk synchronous failover via Load Balancer)',
      icon: <RefreshCw className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Read Replicas & Scale-Out',
      aws: 'RDS Read Replicas (Async WAL, up to 5 for RDS / 15 for Aurora)',
      azure: 'Flexible Server Read Replicas (Async, up to 10 in-region / cross-region)',
      gcp: 'Cloud SQL Read Replicas (Async WAL, up to 10 instances with read pools)',
      icon: <Copy className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Managed Connection Pooler / Proxy',
      aws: 'Amazon RDS Proxy (Serverless connection pooling for Lambda / microservices)',
      azure: 'Built-in PgBouncer (PostgreSQL Flexible Server) / Azure SQL Proxy',
      gcp: 'Cloud SQL Auth Proxy & Built-in PgBouncer sidecar pooler',
      icon: <Layers className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Storage Limits & Auto-Scaling',
      aws: 'RDS Storage Auto-Scaling (Dynamic EBS expansion up to 64 TiB)',
      azure: 'Storage Auto-Grow (Auto expands Managed Disks up to 16 TiB)',
      gcp: 'Automatic Storage Increase (Dynamically expands Persistent Disks, 64 TiB max)',
      icon: <HardDrive className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Point-in-Time Recovery (PITR)',
      aws: 'Automated Snapshots + Transaction Logs (PITR 1-35 days, 5-min granular)',
      azure: 'Automated Backups + WAL (PITR 1-35 days, 5-min granular)',
      gcp: 'Automated Backups + WAL (PITR 1-35 days, 1-sec granular)',
      icon: <Clock className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Database Telemetry & Insights',
      aws: 'Amazon RDS Performance Insights & Enhanced Monitoring (1-sec metrics)',
      azure: 'Azure DB Query Performance Insight & Azure Monitor Metrics',
      gcp: 'Cloud SQL Query Insights (Active sessions breakdown) & Database Center',
      icon: <Activity className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Encryption & Key Management',
      aws: 'KMS-managed Customer Master Keys (CMK) for storage & snapshot encryption',
      azure: 'Customer-Managed Keys (CMK) via Azure Key Vault',
      gcp: 'Customer-Managed Encryption Keys (CMEK) via Cloud KMS',
      icon: <Shield className="w-4 h-4 text-emerald-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'multiaz' | 'replicas' | 'connect' | 'unique'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '🔄 Multi-AZ High Availability & Failover',
      tab: 'multiaz',
      awsDesc: 'RDS Multi-AZ provisions a primary database and a synchronous standby replica in a separate Availability Zone. Storage is replicated block-level; automatic failover updates DNS records in under 60 seconds.',
      azureDesc: 'Azure Flexible Server HA uses Zone-Redundant architecture with active/standby nodes in separate AZs. Block-level synchronous storage replication ensures zero data loss (RPO = 0) upon failover.',
      gcpDesc: 'Cloud SQL HA pairs a primary instance with a standby instance in separate zones using Regional Persistent Disks. Synchronous disk replication guarantees immediate failover via internal traffic routing.',
    },
    {
      title: '📚 Read Replicas & Query Load Balancing',
      tab: 'replicas',
      awsDesc: 'Asynchronous read replicas process read-heavy queries. AWS allows promoting replicas to independent standalone DB instances and supports up to 15 replicas with Amazon Aurora.',
      azureDesc: 'Azure Flexible Server supports up to 10 asynchronous read replicas across regions. Replicas can be promoted to read-write standalone servers and integrated with Azure Traffic Manager.',
      gcpDesc: 'Cloud SQL supports up to 10 read replicas per instance with native database streaming. GCP provides built-in read pool endpoints to automatically balance SELECT queries across replicas.',
    },
    {
      title: '🔌 Connection Pooling & Database Proxy',
      tab: 'connect',
      awsDesc: 'RDS Proxy manages connection pools for serverless AWS Lambda functions and containerized applications, reducing DB memory consumption and preserving connections during failovers.',
      azureDesc: 'Azure Database for PostgreSQL Flexible Server includes built-in PgBouncer connection pooling enabled directly from the Azure Portal without deploying separate VM proxies.',
      gcpDesc: 'GCP Cloud SQL provides the Cloud SQL Auth Proxy for secure IAM-based TLS connections alongside built-in PgBouncer pooling for managing thousands of active concurrent application threads.',
    },
    {
      title: '🌌 Next-Gen Cloud-Native DB Engines',
      tab: 'unique',
      awsDesc: 'Amazon Aurora features a log-structured distributed storage engine replicated 6 ways across 3 AZs. Auto-scales storage up to 128 TiB and delivers up to 5x MySQL throughput.',
      azureDesc: 'Azure SQL Hyperscale separates compute and storage, scaling storage up to 100 TiB dynamically with near-instantaneous backups and read scale-out up to 100 secondary replicas.',
      gcpDesc: 'Google AlloyDB for PostgreSQL is GCP\'s cloud-native enterprise engine, offering 4x faster transaction processing than standard Postgres and 100x faster analytical query execution using ML columnar acceleration.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side Managed Relational Database Terminology &amp; Service Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '650px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 Amazon RDS &amp; Aurora</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure DB (Flexible Server &amp; SQL)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP Cloud SQL &amp; AlloyDB</th>
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
