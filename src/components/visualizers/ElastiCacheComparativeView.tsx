import React from 'react';
import { 
  Zap, 
  RefreshCw, 
  Globe, 
  Cpu, 
  Shield, 
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

interface ElastiCacheComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'arch' | 'redis' | 'memcached' | 'sim' | 'notebook') => void;
}

export default function ElastiCacheComparativeView({ onNavigateToDemo }: ElastiCacheComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Managed In-Memory Service',
      aws: 'Amazon ElastiCache (Redis / Valkey / Memcached)',
      azure: 'Azure Cache for Redis (Basic / Standard / Premium / Enterprise)',
      gcp: 'Google Cloud Memorystore (for Redis / Memcached)',
      icon: <Zap className="w-4 h-4 text-red-500" />
    },
    {
      concept: 'High Availability Multi-AZ',
      aws: 'ElastiCache Multi-AZ with Auto-Failover (Primary + Replicas)',
      azure: 'Zone-Redundant Redis Cluster (Primary + Secondary Replicas)',
      gcp: 'Memorystore High Availability (Standard Tier cross-zone failover)',
      icon: <RefreshCw className="w-4 h-4 text-red-500" />
    },
    {
      concept: 'Distributed Cluster Sharding',
      aws: 'Redis Cluster Mode Enabled (up to 500 shards)',
      azure: 'Azure Cache for Redis Cluster Sharding (up to 10 shards)',
      gcp: 'Memorystore Cluster for Redis (up to 250 shards)',
      icon: <Cpu className="w-4 h-4 text-red-500" />
    },
    {
      concept: 'Persistence & Snapshots',
      aws: 'RDB Snapshots to S3 + AOF (Append-Only File) logging',
      azure: 'RDB Snapshots to Azure Storage Account + AOF persistence',
      gcp: 'RDB Snapshots to Cloud Storage + AOF persistence',
      icon: <HardDrive className="w-4 h-4 text-red-500" />
    },
    {
      concept: 'Global Cross-Region Replication',
      aws: 'ElastiCache Global Datastore (sub-second cross-region sync)',
      azure: 'Active-Active / Active-Passive Geo-Replication',
      gcp: 'Memorystore Cross-Region Read Replicas',
      icon: <Globe className="w-4 h-4 text-red-500" />
    },
    {
      concept: 'Key Eviction Strategies',
      aws: 'LRU, LFU, Volatile-TTL, Allkeys-LRU eviction rules',
      azure: 'Maxmemory-policy (allkeys-lru, volatile-lru, etc.)',
      gcp: 'Maxmemory policies (allkeys-lru, volatile-lru, etc.)',
      icon: <Activity className="w-4 h-4 text-red-500" />
    },
    {
      concept: 'Network Security & Encryption',
      aws: 'VPC Security Groups, TLS in-transit & KMS at-rest encryption',
      azure: 'VNet Injection, Private Endpoints, TLS 1.2, Access Keys',
      gcp: 'VPC Peering, Private Service Access, TLS encryption, IAM',
      icon: <Shield className="w-4 h-4 text-red-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'redis' | 'memcached'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '⚡ Multi-Node In-Memory Caching',
      tab: 'redis',
      awsDesc: 'ElastiCache Redis supports replication groups across AZs with automatic failover. Auto-scaling expands shards dynamically to handle traffic bursts without downtime.',
      azureDesc: 'Azure Cache for Redis Enterprise uses Redis Enterprise modules (RediSearch, RedisJSON, RedisBloom) with zero-downtime scaling and active geo-replication.',
      gcpDesc: 'Memorystore for Redis provides fully managed in-memory caching with 100% Redis protocol compatibility, instance sizing up to 300 GB, and high-speed VPC peering.',
    },
    {
      title: '🧩 Memcached Multithreaded Engine',
      tab: 'memcached',
      awsDesc: 'ElastiCache Memcached provides a multithreaded, pure key-value caching layer across up to 20 nodes with Auto Discovery for simplified application configuration.',
      azureDesc: 'Azure doesn\'t offer a standalone Memcached service; developers use Azure Cache for Redis key-value structures or containerized Memcached on Container Apps.',
      gcpDesc: 'Memorystore for Memcached offers a fully managed, multithreaded Memcached cluster with Auto Discovery support for up to 5 TB in-memory capacity.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side In-Memory Cache Terminology & Service Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 Amazon ElastiCache</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure Cache for Redis</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP Memorystore</th>
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
