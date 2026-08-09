import { useState } from 'react';
import { 
  Key, 
  Lock, 
  Shield, 
  HelpCircle
} from 'lucide-react';

interface UniqueSecretsAndKMSEncryptionFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueSecretsAndKMSEncryptionFeatures({ provider }: UniqueSecretsAndKMSEncryptionFeaturesProps) {
  // --- AWS STATES ---
  const [awsLogs, setAwsLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  const [azureLogs, setAzureLogs] = useState<string[]>([]);

  // --- GCP STATES ---
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // AWS KMS Envelope Encryption Test
  const testAwsKmsEnvelope = () => {
    setAwsLogs(prev => [
      `🔑 [AWS KMS Envelope Encryption] Called kms:GenerateDataKey(KeyId="mrk-09941a").`,
      `📦 Returned Plaintext Data Key (DEK) & Encrypted Data Key (CiphertextBlob).`,
      `⚡ Encrypted 50 MB database payload locally using AES-256-GCM. Plaintext DEK discarded from RAM!`,
      ...prev.slice(0, 4)
    ]);
  };

  // Azure Key Vault Soft-Delete Test
  const testAzureSoftDelete = () => {
    setAzureLogs(prev => [
      `🛡️ [Azure Key Vault Purge Protection] Secret "DB-CONN-STRING" deleted by accident.`,
      `🔒 Soft-Delete retained secret in tombstone state for 90 days. Purge operation DENIED due to Purge Protection!`,
      `✅ Secret restored instantly with version history intact. Zero downtime or data loss!`,
      ...prev.slice(0, 4)
    ]);
  };

  // GCP CMEK Test
  const testGcpCmek = () => {
    setGcpLogs(prev => [
      `💚 [GCP Customer-Managed Encryption Keys (CMEK)] Attached Cloud KMS Key Ring "projects/my-org/locations/us-central1/keyRings/prod".`,
      `⚡ Cloud Storage Bucket "gcs-secure-data" encrypted using CMEK Key Version 3.`,
      `🔒 Key auto-rotated after 90 days. Old versions retained for decryption of historical objects!`,
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced Key Management &amp; Cryptography Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Explore specialized KMS capabilities including AWS KMS Envelope Encryption &amp; Multi-Region Keys, Azure Key Vault Soft-Delete &amp; Purge Protection, and GCP CMEK automatic key rotation.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS KMS ENVELOPE ENCRYPTION                                              */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AWS KMS Envelope Encryption &amp; DEK Generation Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Envelope Encryption uses a KMS Customer Managed Key (CMK) to encrypt a local Data Encryption Key (DEK). Only the encrypted DEK is stored alongside the encrypted payload.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {awsLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAwsKmsEnvelope} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                🔑 Generate DEK &amp; Encrypt Local Payload
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>KMS Multi-Region Primary/Replica Keys</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Multi-Region Keys share the same Key ID and key material across AWS regions (us-east-1, eu-west-1), allowing client apps to encrypt data in one region and decrypt in another without re-encrypting.
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 Seamless cross-region disaster recovery for encrypted S3 buckets &amp; DynamoDB Global Tables.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE KEY VAULT PURGE PROTECTION                                         */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Key Vault Soft-Delete &amp; Purge Protection Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Purge Protection prevents mandatory deletion of deleted vaults and secrets until the retention period (7-90 days) elapses, protecting against ransomware and malicious insider deletion.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {azureLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAzureSoftDelete} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💙 Test Key Vault Soft-Delete &amp; Instant Recovery
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Key Vault Managed HSM (FIPS 140-2 L3)</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Managed HSM delivers single-tenant hardware modules provisioned directly for high-security compliance workloads with dedicated crypto capacity.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 FIPS 140-2 Level 3 validated single-tenant cryptographic isolation.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP CMEK & AUTOMATIC ROTATION                                            */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP CMEK &amp; Automatic Key Rotation Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Customer-Managed Encryption Keys (CMEK) allow controlling encryption keys for Cloud Storage, BigQuery, and Compute Engine disks with configurable automatic rotation schedules (e.g. 90 days).
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {gcpLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testGcpCmek} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💚 Attach CMEK Key &amp; Rotate Encryption Version
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Cloud Secret Manager Versions</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Cloud Secret Manager stores secret payloads as immutable versions. Applications access specific versions (e.g. <code>version=latest</code>) with IAM permission checks.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Instant rollback to previous secret versions in case of secret rotation issues.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
