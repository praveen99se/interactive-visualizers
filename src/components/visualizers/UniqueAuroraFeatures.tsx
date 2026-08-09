import { useState } from 'react';
import { 
  Database, 
  Zap, 
  Globe, 
  Copy,
  Clock,
  HelpCircle
} from 'lucide-react';

interface UniqueAuroraFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueAuroraFeatures({ provider }: UniqueAuroraFeaturesProps) {
  // --- AWS STATES ---
  // Fast DB Cloning Simulator
  const [cloneStatus, setCloneStatus] = useState<'none' | 'cloning' | 'cloned'>('none');
  const [cloneLogs, setCloneLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  // Hyperscale Page Server Cache Simulator
  const [cacheHitRate, setCacheHitRate] = useState(94);
  const [azureLogs, setAzureLogs] = useState<string[]>([]);

  // --- GCP STATES ---
  // Cloud Spanner TrueTime API Atomic Clock Simulator
  const [trueTimeUncertaintyMs, setTrueTimeUncertaintyMs] = useState(2.4);
  const [spannerLogs, setSpannerLogs] = useState<string[]>([]);

  // AWS Fast Clone Trigger
  const triggerAwsFastClone = () => {
    if (cloneStatus !== 'none') return;
    setCloneStatus('cloning');
    setCloneLogs([
      '[Aurora Storage] Requesting Fast Clone of 10 TB Database "prod-db"...',
      '⚡ Copy-on-Write pointers created in 1.2 seconds! Zero data copying required.',
      '📦 Clone DB "staging-clone-db" is ready for read/write workloads.'
    ]);

    setTimeout(() => {
      setCloneStatus('cloned');
      setCloneLogs(prev => [
        '✅ Fast Clone Complete! Storage impact: 0 GB extra allocated until pages mutate.',
        ...prev
      ]);
    }, 1500);
  };

  const resetAwsClone = () => {
    setCloneStatus('none');
    setCloneLogs([]);
  };

  // Azure Page Server Cache Query
  const testAzurePageServerQuery = () => {
    const isHit = Math.random() < (cacheHitRate / 100);
    const latency = isHit ? '0.8 ms (Page Server SSD Cache Hit)' : '6.2 ms (Azure Remote Blob Storage Read)';
    setAzureLogs(prev => [
      `🔍 [Hyperscale Page Server 3] Query executed. Latency: ${latency}`,
      ...prev.slice(0, 4)
    ]);
  };

  // GCP TrueTime Test
  const testGcpTrueTimeSync = () => {
    const now = new Date().toISOString();
    setSpannerLogs(prev => [
      `⏱️ [TrueTime API] Transaction Timestamp: ${now} (Uncertainty ε = ±${trueTimeUncertaintyMs}ms).`,
      `🌐 Distributed Paxos commit consensus achieved globally without locks.`,
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced Cloud-Native Engine Feature Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Explore architectural innovations including Copy-on-Write fast database cloning, multi-tier page server caches, and atomic clock global consensus APIs.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS AURORA: FAST CLONING & GLOBAL DATABASE                                */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Copy className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Aurora Fast Database Cloning (Copy-on-Write)</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Aurora Fast Database Cloning creates an instant copy of a multi-terabyte database in seconds using Copy-on-Write pointers. Storage space is only consumed when data pages are modified in the clone.
              </p>

              {/* Status Visualizer */}
              <div className="anl-log" style={{ border: '1px solid var(--color-border-tertiary)', borderRadius: '10px', padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#38bdf8', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '6px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  <span>Aurora Distributed Storage Cluster</span>
                  <span style={{ color: cloneStatus === 'cloned' ? '#34d399' : '#f59e0b', fontWeight: 'bold' }}>
                    {cloneStatus === 'none' ? 'IDLE' : cloneStatus.toUpperCase()}
                  </span>
                </div>

                {/* Logs Terminal */}
                <div style={{ height: '90px', overflowY: 'auto', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8' }}>
                  {cloneLogs.length > 0 ? (
                    cloneLogs.map((log, idx) => <div key={idx}>{log}</div>)
                  ) : (
                    <div style={{ color: '#475569' }}>Click "Trigger Fast Copy-on-Write Clone"...</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {cloneStatus === 'none' ? (
                <button onClick={triggerAwsFastClone} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                  ⚡ Trigger Fast Copy-on-Write Clone (10 TB DB)
                </button>
              ) : (
                <button onClick={resetAwsClone} className="anl-btn" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                  🔄 Reset Clone Sandbox
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Aurora Global Database</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Aurora Global Database replicates storage updates at the physical storage layer across up to 5 secondary AWS regions with typical latency of less than 1 second.
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 Dedicated storage replication engine bypasses database engine processing, preventing CPU bottlenecks during cross-region sync.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE: HYPERSCALE PAGE SERVERS                                            */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure SQL Hyperscale Page Server Cache</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Hyperscale splits database storage into Page Servers. Each Page Server manages a 128 GB shard of database data with local SSD caching for sub-millisecond query responses.
              </p>

              {/* Progress */}
              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                  <span>Page Server SSD Hit Rate:</span>
                  <span style={{ color: '#0078D4' }}>{cacheHitRate}% Cache Hit Rate</span>
                </div>
                <input 
                  type="range" min="50" max="99" value={cacheHitRate} 
                  onChange={(e) => setCacheHitRate(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Terminal */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {azureLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAzurePageServerQuery} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                🔍 Execute Page Server Query
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Log Service Separation</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Transaction log records are stored in a dedicated Log Service. Compute nodes commit transactions to the Log Service ultra-fast without waiting for page server persistent storage writes.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Allows scaling compute vCores independently from storage capacity in seconds.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP: SPANNER TRUETIME API                                                 */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Cloud Spanner TrueTime API Atomic Clock</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Cloud Spanner uses Google's TrueTime API — backed by atomic clocks and GPS receivers in every data center — to deliver external consistency (serializability) across globally distributed nodes.
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                  <span>Atomic Clock Uncertainty (ε):</span>
                  <span style={{ color: '#0F9D58' }}>±{trueTimeUncertaintyMs} ms</span>
                </div>
                <input 
                  type="range" min="0.5" max="7.0" step="0.1" value={trueTimeUncertaintyMs} 
                  onChange={(e) => setTrueTimeUncertaintyMs(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {spannerLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testGcpTrueTimeSync} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                ⏱️ Commit TrueTime Global Transaction
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AlloyDB Columnar Acceleration</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                AlloyDB automatically identifies queries suited for analytical processing and converts operational row-store data into in-memory columnar representations using machine learning models.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Delivers up to 100x query acceleration for analytical scans over standard PostgreSQL.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
