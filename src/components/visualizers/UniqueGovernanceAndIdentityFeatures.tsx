import { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  FolderTree, 
  Lock, 
  HelpCircle
} from 'lucide-react';

interface UniqueGovernanceAndIdentityFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueGovernanceAndIdentityFeatures({ provider }: UniqueGovernanceAndIdentityFeaturesProps) {
  // --- AWS STATES ---
  const [awsLogs, setAwsLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  const [azureLogs, setAzureLogs] = useState<string[]>([]);

  // --- GCP STATES ---
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // AWS Roles Anywhere Test
  const testAwsRolesAnywhere = () => {
    setAwsLogs(prev => [
      `🔑 [AWS IAM Roles Anywhere] Inbound X.509 Certificate presented from on-premises server "dc-web-01".`,
      `🛡️ Validated trust anchor. Executed STS:CreateSession to issue temporary AccessKey & SecretKey.`,
      `⚡ On-premises workload authenticated without storing long-lived IAM access keys!`,
      ...prev.slice(0, 4)
    ]);
  };

  // Azure Policy Deny Test
  const testAzurePolicyDeny = () => {
    setAzureLogs(prev => [
      `🛡️ [Azure Policy Enforcement] Attempting to deploy Public IP address in Subscription "Sub-Production".`,
      `🚨 Policy Rule "Deny-Public-IPs" evaluated state = NON-COMPLIANT.`,
      `❌ Deployment blocked at ARM Resource Provider before resource creation! Zero security vulnerability.`,
      ...prev.slice(0, 4)
    ]);
  };

  // GCP Workload Identity Test
  const testGcpWorkloadIdentity = () => {
    setGcpLogs(prev => [
      `💚 [GCP Workload Identity Federation] GitHub Actions workflow presented OIDC ID Token.`,
      `⚡ Exchanged OIDC token for short-lived GCP Service Account Token via STS.`,
      `✅ Authorized deployment to GKE cluster without storing service account JSON keys in GitHub secrets!`,
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced Identity &amp; Governance Feature Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Explore specialized identity guardrails including AWS IAM Roles Anywhere X.509 PKI authentication, Azure Policy deployment enforcement, and GCP Workload Identity OIDC federation.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS IAM ROLES ANYWHERE                                                    */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AWS IAM Roles Anywhere X.509 PKI Exchange Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                IAM Roles Anywhere extends AWS IAM roles to workloads running outside AWS (on-prem servers, hybrid containers). It uses X.509 certificates issued by your Certificate Authority to trade for temporary STS credentials.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {awsLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAwsRolesAnywhere} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                🔑 Exchange X.509 Certificate for IAM Role
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Organizations SCP Explicit Deny</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                If an SCP contains an explicit <code>Deny</code> statement (e.g. <code>ec2:StopInstances</code>), no IAM user or root user inside that member account can override it, regardless of administrator privileges.
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 Explicit Deny always overrides any explicit Allow in IAM evaluation logic.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE POLICY ENFORCEMENT                                                 */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FolderTree className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Policy Deny Effect Deployment Guardrail</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Azure Policy definitions evaluate Resource Manager templates prior to execution. If a template property violates policy rules, the ARM deployment is denied immediately.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {azureLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAzurePolicyDeny} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💙 Test Azure Policy Deployment Enforcement
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Entra ID Conditional Access</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Entra ID Conditional Access evaluates user signals (location, device compliance, risk level) to enforce MFA or block access dynamically before issuing tokens.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Zero Trust identity boundary enforced across all SaaS and cloud apps.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP WORKLOAD IDENTITY FEDERATION                                          */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Workload Identity Federation OIDC Token Exchange</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Workload Identity Federation allows external workloads (GitHub Actions, GitLab, AWS, Azure) to authenticate to GCP via OpenID Connect without exporting service account JSON keys.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {gcpLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testGcpWorkloadIdentity} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💚 Exchange OIDC Token for Service Account
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Organization Policies</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                GCP Organization Constraints allow super-admins to enforce global rules (e.g. <code>constraints/compute.vmExternalIpAccess</code>) across all projects in the org node.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Centralized compliance enforcement for multi-project enterprises.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
