import React from 'react';
import { 
  ShieldCheck, 
  Users, 
  FolderTree, 
  Lock, 
  Key,
  Globe
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface GovernanceAndIdentityComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'iam' | 'roles' | 'orgs' | 'scp' | 'audit' | 'sim' | 'architect') => void;
}

export default function GovernanceAndIdentityComparativeView({ onNavigateToDemo }: GovernanceAndIdentityComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Identity & Directory Service',
      aws: 'AWS IAM & AWS IAM Identity Center (SSO)',
      azure: 'Microsoft Entra ID (formerly Azure Active Directory)',
      gcp: 'Google Cloud Identity / Workspace Identity',
      icon: <Users className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Resource Hierarchy & Boundaries',
      aws: 'AWS Organizations (Management Account ➔ OUs ➔ Accounts)',
      azure: 'Azure Management Groups ➔ Subscriptions ➔ Resource Groups',
      gcp: 'Google Cloud Resource Manager (Organization ➔ Folders ➔ Projects)',
      icon: <FolderTree className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Service & Application Identity',
      aws: 'AWS IAM Roles & Temporary Credentials (STS AssumeRole)',
      azure: 'Azure Managed Identities (System-assigned & User-assigned)',
      gcp: 'GCP Service Accounts & Service Account Key/Token Delegation',
      icon: <Key className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Guardrails & Policy Enforcement',
      aws: 'Service Control Policies (SCPs) & Permission Boundaries',
      azure: 'Azure Policy Definitions & Blueprints / Policy Assignments',
      gcp: 'GCP Organization Policies (Boolean & List Constraints)',
      icon: <ShieldCheck className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Access Control Model',
      aws: 'Attribute-Based (ABAC) & Role-Based (RBAC) IAM JSON Policies',
      azure: 'Azure RBAC (Built-in & Custom Roles assigned at scope)',
      gcp: 'GCP IAM Roles (Predefined & Custom Roles assigned to Members)',
      icon: <Lock className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Cross-Cloud Workload Federation',
      aws: 'IAM Roles Anywhere (X.509 PKI) & OpenID Connect (OIDC)',
      azure: 'Entra Workload ID & Federated Identity Credentials',
      gcp: 'Workload Identity Federation (OIDC & SAML 2.0)',
      icon: <Globe className="w-4 h-4 text-purple-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'roles' | 'scp'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '🔐 Temporary Credentials & Workload Identity',
      tab: 'roles',
      awsDesc: 'AWS STS generates short-lived credentials for IAM Roles via AssumeRole. EC2, ECS, and Lambda assume roles dynamically without embedding long-lived access keys.',
      azureDesc: 'Azure Managed Identities automatically handle credential generation and rotation for Azure resources calling Key Vault, Storage, or SQL without storing passwords in code.',
      gcpDesc: 'GCP Service Accounts act as identity principals for Compute Engine and Cloud Run. Workload Identity allows Kubernetes pods to impersonate service accounts securely.',
    },
    {
      title: '🛡️ Organizational Guardrails & Policy Enforcement',
      tab: 'scp',
      awsDesc: 'Service Control Policies (SCPs) specify the maximum allowed permissions for member accounts inside AWS Organizations. SCPs act as guardrail filters over IAM policies.',
      azureDesc: 'Azure Policy evaluates resource configurations against compliance rules (e.g. enforcing allowed locations or blocking public IPs), denying non-compliant deployments automatically.',
      gcpDesc: 'GCP Organization Policies enforce centralized constraints across all folders and projects in a Google Cloud Organization (e.g. disabling external IP addresses).',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side Governance & Identity Terminology Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 AWS (IAM / Organizations)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure (Entra ID / Policy)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP (Cloud IAM / Resource Mgr)</th>
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
