import React from 'react';
import { 
  Key, 
  Lock, 
  Shield, 
  RefreshCw, 
  Cpu,
  Globe
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface SecretsAndKMSEncryptionComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'kms' | 'secrets' | 'envelope' | 'policies' | 'architect') => void;
}

export default function SecretsAndKMSEncryptionComparativeView({ onNavigateToDemo }: SecretsAndKMSEncryptionComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Key Management Service (KMS)',
      aws: 'AWS KMS (Key Management Service)',
      azure: 'Azure Key Vault (Keys)',
      gcp: 'Google Cloud KMS (Key Management Service)',
      icon: <Key className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Secret & Password Store',
      aws: 'AWS Secrets Manager & SSM Parameter Store',
      azure: 'Azure Key Vault (Secrets)',
      gcp: 'Google Cloud Secret Manager',
      icon: <Lock className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Hardware Security Module (HSM)',
      aws: 'AWS CloudHSM / KMS Dedicated Custom Key Store',
      azure: 'Azure Key Vault Managed HSM (FIPS 140-2 Level 3)',
      gcp: 'Cloud KMS Cloud HSM (FIPS 140-2 Level 3)',
      icon: <Cpu className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Automatic Secret Rotation',
      aws: 'Secrets Manager Lambda Auto-Rotation (RDS / Custom)',
      azure: 'Azure Key Vault Automated Secret Rotation (Event Grid)',
      gcp: 'Cloud Secret Manager Automatic Rotation (Pub/Sub & Cloud Run)',
      icon: <RefreshCw className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Envelope Encryption Architecture',
      aws: 'KMS GenerateDataKey (KMS CMK encrypts Data Key DEK)',
      azure: 'Key Vault Key Encryption Key (KEK wraps Data Encryption Key)',
      gcp: 'Cloud KMS Envelope Encryption (KMS Key wraps DEK)',
      icon: <Shield className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Cross-Region Key Replication',
      aws: 'KMS Multi-Region Keys (Primary & Replica Keys in separate regions)',
      azure: 'Key Vault Auto-Replication & Geo-redundancy',
      gcp: 'Cloud KMS Dual-Region & Multi-Region Key Rings',
      icon: <Globe className="w-4 h-4 text-emerald-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'kms' | 'secrets'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '🔑 Envelope Encryption & Symmetric Key Operations',
      tab: 'kms',
      awsDesc: 'AWS KMS protects data using envelope encryption. KMS generates a Data Encryption Key (DEK) encrypted by a Customer Managed Key (CMK); the app uses the plaintext DEK locally to encrypt data.',
      azureDesc: 'Azure Key Vault uses Key Encryption Keys (KEK) to wrap and unwrap Data Encryption Keys. Master keys reside inside FIPS 140-2 validated hardware modules and never leave Key Vault boundary.',
      gcpDesc: 'Google Cloud KMS manages cryptographic keys in Key Rings. Google services (GCS, BigQuery, Compute Engine) use Envelope Encryption where Cloud KMS wraps local page keys automatically.',
    },
    {
      title: '🔐 Automated Secret Rotation & Password Security',
      tab: 'secrets',
      awsDesc: 'AWS Secrets Manager automatically rotates database credentials (RDS, Redshift) using Lambda functions on scheduled intervals, updating both the database password and Secrets Manager.',
      azureDesc: 'Azure Key Vault Secrets stores API keys, database connection strings, and certificates, integrating with Event Grid to trigger automated rotation functions upon secret expiration.',
      gcpDesc: 'Cloud Secret Manager provides versioned secret storage with automatic rotation schedules via Pub/Sub notifications, integrating natively with IAM and Cloud Run environment variables.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side Secrets & Key Management Terminology Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 AWS (KMS / Secrets Manager)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure (Key Vault)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP (Cloud KMS / Secret Manager)</th>
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
