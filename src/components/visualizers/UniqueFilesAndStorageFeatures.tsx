import { useState } from 'react';
import { 
  FolderTree, 
  HardDrive, 
  Cpu, 
  Shield, 
  HelpCircle
} from 'lucide-react';

interface UniqueFilesAndStorageFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueFilesAndStorageFeatures({ provider }: UniqueFilesAndStorageFeaturesProps) {
  // --- AWS STATES ---
  const [efsClass, setEfsClass] = useState<'standard' | 'onezone'>('standard');
  const [awsLogs, setAwsLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  const [azureTier, setAzureTier] = useState<'standard' | 'premium' | 'ultra'>('premium');
  const [azureLogs, setAzureLogs] = useState<string[]>([]);

  // --- GCP STATES ---
  const [gcpFilestoreTier, setGcpFilestoreTier] = useState<'basic' | 'high_scale' | 'enterprise'>('enterprise');
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // AWS EFS Test
  const testAwsEfs = () => {
    if (efsClass === 'standard') {
      setAwsLogs(prev => [
        `📁 [EFS Standard] Multi-AZ NFSv4 mount targets provisioned across 3 AZs. 99.999999999% (11 9's) durability.`,
        `💡 Auto-lifecycle rule: Unaccessed files transition to EFS Infrequent Access (IA) after 30 days (47% cost savings).`,
        ...prev.slice(0, 4)
      ]);
    } else {
      setAwsLogs(prev => [
        `📁 [EFS One Zone] Single AZ NFSv4 mount target provisioned in us-east-1a. 47% cheaper base storage cost!`,
        `⚠️ High Availability across AZs disabled. Recommended for continuous integration or non-critical staging builds.`,
        ...prev.slice(0, 4)
      ]);
    }
  };

  // Azure ANF Test
  const testAzureNetApp = () => {
    setAzureLogs(prev => [
      `⚡ [Azure NetApp Files - ${azureTier.toUpperCase()} Tier] Storage pool configured.`,
      `📊 Provisioned Throughput: ${azureTier === 'ultra' ? '128 MB/s per TB' : azureTier === 'premium' ? '64 MB/s per TB' : '16 MB/s per TB'}.`,
      `🔒 Native Snapshot taken in < 1 second without impact to running SAP HANA workload.`,
      ...prev.slice(0, 4)
    ]);
  };

  // GCP Filestore Test
  const testGcpFilestore = () => {
    setGcpLogs(prev => [
      `💚 [Cloud Filestore - ${gcpFilestoreTier.toUpperCase()}] NFS share mounted to GKE cluster pods.`,
      `📊 Max Throughput: ${gcpFilestoreTier === 'enterprise' ? '12 GB/s' : '2.5 GB/s'}. Sub-millisecond latency.`,
      `⚡ Live capacity scale-up from 1 TB ➔ 10 TB executed without unmounting NFS volumes!`,
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced File System Feature Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Simulate enterprise file system capabilities including AWS EFS multi-AZ vs One-Zone lifecycle tiering, Azure NetApp Files performance pools, and GCP Cloud Filestore dynamic scaling.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS EFS / FSX                                                             */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FolderTree className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AWS EFS Multi-AZ vs One Zone Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Amazon EFS supports Standard (Multi-AZ) and One Zone storage classes, automatically shifting dormant files to EFS Infrequent Access (IA) or EFS Archive tiers based on lifecycle rules.
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <label className="block font-bold mb-1 text-[11px]">Select Storage Class Policy:</label>
                <select 
                  value={efsClass} 
                  onChange={(e) => setEfsClass(e.target.value as any)}
                  className="w-full p-1.5 border rounded dark:bg-slate-100 dark:bg-slate-900 text-[11px]"
                >
                  <option value="standard">EFS Standard (Multi-AZ Data Redundancy)</option>
                  <option value="onezone">EFS One Zone (Single-AZ 47% Lower Cost)</option>
                </select>
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {awsLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAwsEfs} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                📁 Provision &amp; Test EFS Share
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>FSx for Lustre + S3 Sync</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                FSx for Lustre transparently presents S3 objects as files in a high-performance Lustre file system, allowing HPC nodes to process S3 data at hundreds of GB/s.
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 Lazy-loads file metadata from S3 so compute clusters start instantly.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE: NETAPP FILES                                                       */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HardDrive className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure NetApp Files Performance Tier Simulator</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Azure NetApp Files (ANF) provides enterprise file storage with sub-millisecond latencies, supporting Standard, Premium, and Ultra service levels for database and SAP workloads.
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <label className="block font-bold mb-1 text-[11px]">Select NetApp Service Level:</label>
                <select 
                  value={azureTier} 
                  onChange={(e) => setAzureTier(e.target.value as any)}
                  className="w-full p-1.5 border rounded dark:bg-slate-100 dark:bg-slate-900 text-[11px]"
                >
                  <option value="standard">Standard Tier (16 MB/s per TB throughput)</option>
                  <option value="premium">Premium Tier (64 MB/s per TB throughput)</option>
                  <option value="ultra">Ultra Tier (128 MB/s per TB throughput)</option>
                </select>
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {azureLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAzureNetApp} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💙 Provision NetApp Volume
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure File Sync Cloud Tiering</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Azure File Sync transforms Windows Server instances into fast caches of Azure File shares, caching frequently accessed files locally while tiering cold files to Azure.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Centralizes file shares in the cloud while retaining local branch office performance.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP: FILESTORE & PARALLELSTORE                                           */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Cloud Filestore Live Scaling Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Google Cloud Filestore provides fully managed NFS file storage for Compute Engine and GKE, allowing live capacity and throughput scaling without unmounting NFS shares.
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <label className="block font-bold mb-1 text-[11px]">Select Filestore Tier:</label>
                <select 
                  value={gcpFilestoreTier} 
                  onChange={(e) => setGcpFilestoreTier(e.target.value as any)}
                  className="w-full p-1.5 border rounded dark:bg-slate-100 dark:bg-slate-900 text-[11px]"
                >
                  <option value="basic">Basic HDD/SSD Tier</option>
                  <option value="high_scale">High Scale SSD Tier (High IOPS)</option>
                  <option value="enterprise">Enterprise Tier (Regional Multi-AZ Redundancy)</option>
                </select>
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {gcpLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testGcpFilestore} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💚 Mount &amp; Scale Filestore Share
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Parallelstore (Lustre HPC)</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Google Parallelstore is a managed Lustre solution designed for ultra-demanding AI/ML training and HPC simulation workloads requiring millions of IOPS and low latencies.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Seamlessly integrates with Cloud Storage buckets for high-speed data hydration.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
