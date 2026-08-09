import { useState } from 'react';
import { 
  RefreshCw, 
  Clock, 
  ShieldCheck, 
  HelpCircle
} from 'lucide-react';

interface UniqueDisasterRecoveryFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueDisasterRecoveryFeatures({ provider }: UniqueDisasterRecoveryFeaturesProps) {
  // --- AWS STATES ---
  const [awsLogs, setAwsLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  const [azureLogs, setAzureLogs] = useState<string[]>([]);

  // --- GCP STATES ---
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // AWS Backup Vault Lock Test
  const testAwsVaultLock = () => {
    setAwsLogs(prev => [
      `🔒 [AWS Backup Vault Lock] Attempting to delete recovery point in Vault "prod-lock-vault".`,
      `🛡️ Vault Lock in COMPLIANCE mode evaluated retention period (365 days).`,
      `❌ Delete RecoveryPoint DENIED! WORM immutability enforced for AWS Root user and IAM Admins.`,
      ...prev.slice(0, 4)
    ]);
  };

  // Azure Site Recovery Test
  const testAzureSiteRecovery = () => {
    setAzureLogs(prev => [
      `💙 [Azure Site Recovery] Failover Plan "Region-EastUS-To-WestUS" initiated.`,
      `⚡ Continuous Delta Sync completed (RPO = 28 seconds). Provisioned VM instances in West US.`,
      `✅ Updated Azure Front Door traffic routing to West US endpoint in 4 minutes (RTO < 5m!).`,
      ...prev.slice(0, 4)
    ]);
  };

  // GCP Turbo Replication Test
  const testGcpTurboReplication = () => {
    setGcpLogs(prev => [
      `💚 [GCP Cloud Storage Turbo Replication] Bucket "dual-region-asia" configured across Tokyo & Osaka.`,
      `📊 Uploaded 500 GB database backup file to Tokyo region.`,
      `⚡ Turbo Replication guaranteed 100% object replication to Osaka in < 15 minutes with SLA backing!`,
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced Disaster Recovery Feature Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Test specialized business continuity capabilities including AWS Backup Vault Lock WORM compliance, Azure Site Recovery (ASR) continuous failover orchestration, and GCP Turbo Replication 15-minute SLA sync.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS BACKUP VAULT LOCK                                                     */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AWS Backup Vault Lock WORM Immutability Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                AWS Backup Vault Lock prevents any user, including AWS account root users, from deleting backups during the locked retention period. Provides SEC Rule 17a-4 compliance against ransomware.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {awsLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAwsVaultLock} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                🔒 Attempt Delete on Vault Locked Backup
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AWS Elastic Disaster Recovery (DRS)</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                AWS DRS continuously replicates block storage from source machines (on-prem or EC2) to a low-cost staging area in your target AWS region, spinning up target instances in minutes.
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 Minimizes DR costs by using small staging EC2 instances &amp; EBS volumes.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE SITE RECOVERY                                                      */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Site Recovery (ASR) Automated Failover Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Azure Site Recovery coordinates replication, failover, and recovery of Hyper-V, VMware, and Azure VMs between primary and secondary Azure paired regions.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {azureLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAzureSiteRecovery} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💙 Trigger ASR Cross-Region Failover Plan
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Backup Immutable Vaults</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Azure Recovery Services Vaults support immutability setting, blocking deletion or modification of recovery points by unauthorized actors or malicious scripts.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Zero trust protection with Multi-User Authorization for critical deletions.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP TURBO REPLICATION                                                    */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Cloud Storage Turbo Replication Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Turbo Replication guarantees 100% of newly written Google Cloud Storage objects are replicated to a secondary dual-region bucket within 15 minutes, backed by SLA.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {gcpLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testGcpTurboReplication} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💚 Test Dual-Region 15-Minute SLA Replication
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Backup and DR Management</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Unified backup console manages application-consistent backups for Cloud SQL, Compute Engine, and VMware Engine with centralized compliance reporting.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Application-consistent snapshots for enterprise SAP &amp; Oracle DBs.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
