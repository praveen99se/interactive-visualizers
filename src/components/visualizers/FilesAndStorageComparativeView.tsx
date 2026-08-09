import React from 'react';
import { 
  FolderTree, 
  HardDrive, 
  Cpu, 
  Shield, 
  Zap,
  RefreshCw
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface FilesAndStorageComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'efs' | 'fsx' | 'benchmark' | 'planner' | 'sim' | 'architect') => void;
}

export default function FilesAndStorageComparativeView({ onNavigateToDemo }: FilesAndStorageComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'POSIX Elastic File System',
      aws: 'Amazon EFS (Elastic File System - NFSv4)',
      azure: 'Azure Files NFS v4.1 / Azure NetApp Files',
      gcp: 'Google Cloud Filestore (Enterprise NFSv3/NFSv4.1)',
      icon: <FolderTree className="w-4 h-4 text-sky-500" />
    },
    {
      concept: 'Windows Native File Storage',
      aws: 'Amazon FSx for Windows File Server (SMB/CIFS)',
      azure: 'Azure Files SMB 3.0 / Active Directory Domain Join',
      gcp: 'Cloud Filestore with Managed Active Directory Integration',
      icon: <HardDrive className="w-4 h-4 text-sky-500" />
    },
    {
      concept: 'High Performance HPC / Lustre',
      aws: 'Amazon FSx for Lustre (Sub-ms latency parallel storage)',
      azure: 'Azure HPC Cache / Azure Managed Lustre',
      gcp: 'Google Cloud Parallelstore (Lustre-based HPC file system)',
      icon: <Cpu className="w-4 h-4 text-sky-500" />
    },
    {
      concept: 'Performance & IOPS Modes',
      aws: 'General Purpose vs Max I/O; Bursting vs Provisioned',
      azure: 'Transaction Optimized, Hot, Cool, Premium IOPS tiers',
      gcp: 'Basic, Regional, High-Scale, Enterprise IOPS tiers',
      icon: <Zap className="w-4 h-4 text-sky-500" />
    },
    {
      concept: 'Lifecycle & Auto-Tiering',
      aws: 'EFS Lifecycle Management (Auto-move to EFS IA / Archive)',
      azure: 'Azure Files Tiering (Cool to Archive policy rules)',
      gcp: 'Cloud Storage FUSE / Filestore tiering to GCS Buckets',
      icon: <RefreshCw className="w-4 h-4 text-sky-500" />
    },
    {
      concept: 'Container & K8s CSI Drivers',
      aws: 'Amazon EFS CSI Driver / FSx Lustre CSI Driver for EKS',
      azure: 'Azure Files Container Storage Interface (CSI) for AKS',
      gcp: 'Google Cloud Filestore CSI Driver for GKE',
      icon: <Shield className="w-4 h-4 text-sky-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'efs' | 'fsx'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '📁 Managed POSIX File Storage (NFS)',
      tab: 'efs',
      awsDesc: 'Amazon EFS grows and shrinks automatically without manual provisioning. It replicates data across multiple AZs in an AWS Region and supports concurrent connections from thousands of EC2 and Lambda instances.',
      azureDesc: 'Azure Files provides fully managed file shares accessible via SMB and NFS. Shares can be mounted simultaneously by cloud or on-premises deployments of Windows, Linux, and macOS.',
      gcpDesc: 'Google Cloud Filestore offers fully managed NFS storage for Compute Engine and GKE clusters, scaling up to hundreds of gigabytes per second throughput for enterprise workloads.',
    },
    {
      title: '⚡ Specialized High-Performance File Systems (Lustre / NetApp)',
      tab: 'fsx',
      awsDesc: 'FSx for Lustre is built for high-performance computing (HPC), AI/ML, and video processing, delivering hundreds of GB/s throughput and sub-millisecond latencies linked directly to S3 data lakes.',
      azureDesc: 'Azure NetApp Files delivers enterprise-grade, low-latency file storage powered by NetApp technology, supporting SAP HANA, high-performance databases, and HPC workloads.',
      gcpDesc: 'Google Parallelstore is a managed Lustre solution designed for ultra-demanding AI/ML training and HPC simulation workloads requiring millions of IOPS and low latencies.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side Managed File Systems Terminology Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 AWS (EFS / FSx)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure (Files / ANF)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP (Filestore / Parallelstore)</th>
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
