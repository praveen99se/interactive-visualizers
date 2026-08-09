import { useState } from 'react';
import { 
  Database, 
  RefreshCw, 
  Activity, 
  HardDrive, 
  Clock,
  HelpCircle
} from 'lucide-react';

interface UniqueRDSFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueRDSFeatures({ provider }: UniqueRDSFeaturesProps) {
  // --- AWS STATES ---
  // RDS Multi-AZ Failover Simulator
  const [awsFailoverState, setAwsFailoverState] = useState<'normal' | 'failing' | 'failed_over'>('normal');
  const [awsFailoverLogs, setAwsFailoverLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  // Azure DB Auto-Grow Storage Simulator
  const [azureStorageGb, setAzureStorageGb] = useState(100);
  const [azureStorageUsed, setAzureStorageUsed] = useState(85);
  const [azureAutoGrowLogs, setAzureAutoGrowLogs] = useState<string[]>([]);

  // --- GCP STATES ---
  // Cloud SQL Maintenance Window Rescheduling
  const [gcpMaintenanceDay, setGcpMaintenanceDay] = useState('Sunday');
  const [gcpMaintenanceHour, setGcpMaintenanceHour] = useState('02:00 UTC');
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // AWS Multi-AZ Failover Trigger
  const triggerAwsFailover = () => {
    if (awsFailoverState !== 'normal') return;
    setAwsFailoverState('failing');
    setAwsFailoverLogs([
      '[RDS Monitor] Outage detected on Primary Instance (us-east-1a).',
      '⚡ Initiating synchronous failover to Standby Instance (us-east-1b)...',
      '🔄 Updating CNAME DNS record db.production.internal to IP 10.0.2.88...'
    ]);

    setTimeout(() => {
      setAwsFailoverState('failed_over');
      setAwsFailoverLogs(prev => [
        '✅ Failover Complete! New Primary running in us-east-1b.',
        '🛠️ Rebuilding previous primary node into new standby replica in us-east-1a...',
        ...prev
      ]);
    }, 2000);
  };

  const resetAwsFailover = () => {
    setAwsFailoverState('normal');
    setAwsFailoverLogs([]);
  };

  // Azure Storage Auto-Grow Simulation
  const simulateAzureStorageGrowth = () => {
    const nextUsed = azureStorageUsed + 10;
    if (nextUsed >= azureStorageGb * 0.95) {
      const nextTotal = Math.floor(azureStorageGb * 1.25);
      setAzureStorageGb(nextTotal);
      setAzureStorageUsed(nextUsed);
      setAzureAutoGrowLogs(prev => [
        `🚨 Storage usage hit 95% threshold (${nextUsed} GB). Triggered Auto-Grow!`,
        `📈 Expanded Azure Flexible Server OS Disk from ${azureStorageGb} GB ➔ ${nextTotal} GB seamlessly.`,
        ...prev.slice(0, 4)
      ]);
    } else {
      setAzureStorageUsed(nextUsed);
      setAzureAutoGrowLogs(prev => [
        `💾 Wrote 10 GB database logs. Used: ${nextUsed} GB / ${azureStorageGb} GB.`,
        ...prev.slice(0, 4)
      ]);
    }
  };

  // GCP Maintenance Update
  const updateGcpMaintenance = () => {
    setGcpLogs(prev => [
      `📅 Rescheduled Cloud SQL Maintenance Window to ${gcpMaintenanceDay} @ ${gcpMaintenanceHour}.`,
      `🔒 System maintenance will apply zero-downtime OS kernel patches during this slot.`,
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Unique Managed Relational Database Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Explore cloud-specific database mechanics including Multi-AZ DNS failovers, storage auto-grow expansion, and custom maintenance window controls.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS RDS: MULTI-AZ FAILOVER                                                */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AWS RDS Multi-AZ Automatic Failover Simulator</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                When an RDS Multi-AZ instance encounters a hardware failure or Availability Zone outage, RDS automatically flips the primary DNS record to the standby instance in under 60 seconds without application endpoint changes.
              </p>

              {/* Status Visualizer */}
              <div className="anl-log" style={{ border: '1px solid var(--color-border-tertiary)', borderRadius: '10px', padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#38bdf8', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '6px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  <span>RDS CNAME Endpoint: db.prod.internal</span>
                  <span style={{ color: awsFailoverState === 'normal' ? '#34d399' : '#ef4444', fontWeight: 'bold' }}>
                    {awsFailoverState.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center mb-3">
                  <div style={{ padding: '8px', borderRadius: '6px', border: awsFailoverState === 'normal' ? '1.5px solid #16a34a' : '1px solid #334155', background: 'rgba(2,6,23,0.5)' }}>
                    <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>PRIMARY (AZ-A)</div>
                    <div style={{ fontWeight: 'bold', color: awsFailoverState === 'normal' ? '#34d399' : '#f87171' }}>
                      {awsFailoverState === 'normal' ? '🟢 Active Primary' : '🔴 Offline / Rebuilding'}
                    </div>
                  </div>

                  <div style={{ padding: '8px', borderRadius: '6px', border: awsFailoverState === 'failed_over' ? '1.5px solid #16a34a' : '1px solid #334155', background: 'rgba(2,6,23,0.5)' }}>
                    <div style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>STANDBY (AZ-B)</div>
                    <div style={{ fontWeight: 'bold', color: awsFailoverState === 'failed_over' ? '#34d399' : '#fbbf24' }}>
                      {awsFailoverState === 'failed_over' ? '🟢 Promoted Primary' : '⏳ Sync Standby'}
                    </div>
                  </div>
                </div>

                {/* Logs Terminal */}
                <div style={{ height: '90px', overflowY: 'auto', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8' }}>
                  {awsFailoverLogs.length > 0 ? (
                    awsFailoverLogs.map((log, idx) => <div key={idx}>{log}</div>)
                  ) : (
                    <div style={{ color: '#475569' }}>Click "Simulate Primary DB Outage"...</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {awsFailoverState === 'normal' ? (
                <button onClick={triggerAwsFailover} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                  💥 Simulate Primary DB Outage
                </button>
              ) : (
                <button onClick={resetAwsFailover} className="anl-btn" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                  🔄 Reset Failover State
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>RDS Performance Insights</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                RDS Performance Insights monitors DB Load (Average Active Sessions). It breaks down CPU wait states, IO:XLogLock, and SQL text queries to pinpoint database bottlenecks instantly.
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 Allows database administrators to trace query execution plans without installing heavy third-party monitoring agents.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE DB: STORAGE AUTO-GROW                                              */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HardDrive className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Flexible Server Storage Auto-Grow</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Azure Database Flexible Server features Storage Auto-Grow. When remaining disk space drops below 10%, Azure automatically increases disk capacity to prevent database read-only locks.
              </p>

              {/* Progress */}
              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                  <span>Managed Disk Capacity:</span>
                  <span style={{ color: '#0078D4' }}>{azureStorageUsed} GB / {azureStorageGb} GB ({Math.round((azureStorageUsed / azureStorageGb) * 100)}% Used)</span>
                </div>

                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div 
                    style={{ 
                      height: '100%', 
                      background: (azureStorageUsed / azureStorageGb) > 0.9 ? '#ef4444' : '#0078D4', 
                      width: `${(azureStorageUsed / azureStorageGb) * 100}%`,
                      transition: 'all 0.3s'
                    }} 
                  />
                </div>
              </div>

              {/* Terminal */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {azureAutoGrowLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={simulateAzureStorageGrowth} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💾 Ingest 10 GB Data
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Flexible Server Architecture</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Flexible Server provides granular control over database tuning parameters (server parameters, custom Postgres extensions like `pgvector`), and supports stop/start functionality to minimize dev environment costs.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Allows stopping instances when idle to save compute costs while preserving underlying data disks.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP: CLOUD SQL MAINTENANCE & AUTOMATIC INCREASE                          */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Cloud SQL Maintenance Window Control</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Google Cloud SQL lets team lead architects configure explicit maintenance windows and defer maintenance updates up to 90 days to avoid disruption during peak sales events.
              </p>

              {/* Config */}
              <div className="grid grid-cols-2 gap-3 mb-3" style={{ fontSize: '11px' }}>
                <div>
                  <label className="block font-bold mb-1">Preferred Day:</label>
                  <select 
                    value={gcpMaintenanceDay} 
                    onChange={(e) => setGcpMaintenanceDay(e.target.value)}
                    className="w-full p-1.5 border rounded dark:bg-slate-100 dark:bg-slate-900"
                  >
                    <option value="Sunday">Sunday</option>
                    <option value="Saturday">Saturday</option>
                    <option value="Wednesday">Wednesday</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Preferred Time Window:</label>
                  <select 
                    value={gcpMaintenanceHour} 
                    onChange={(e) => setGcpMaintenanceHour(e.target.value)}
                    className="w-full p-1.5 border rounded dark:bg-slate-100 dark:bg-slate-900"
                  >
                    <option value="02:00 UTC">02:00 UTC (Off-peak)</option>
                    <option value="04:00 UTC">04:00 UTC (Off-peak)</option>
                    <option value="22:00 UTC">22:00 UTC (Evening)</option>
                  </select>
                </div>
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {gcpLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={updateGcpMaintenance} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                📅 Reschedule Maintenance Window
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AlloyDB for PostgreSQL</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                AlloyDB is GCP's fully managed, PostgreSQL-compatible database engine designed for enterprise workloads. It delivers up to 4x faster transaction speeds than standard PostgreSQL.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Integrates Google ML columnar indexing to accelerate analytical query processing on operational data.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
