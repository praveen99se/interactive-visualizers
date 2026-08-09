import { useState } from 'react';
import { 
  Zap, 
  RefreshCw, 
  Activity, 
  Globe, 
  HelpCircle,
  Shield
} from 'lucide-react';

interface UniqueElastiCacheFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueElastiCacheFeatures({ provider }: UniqueElastiCacheFeaturesProps) {
  // --- AWS STATES ---
  // ElastiCache Valkey & Serverless Auto-Scaler
  const [awsEcuLoad, setAwsEcuLoad] = useState(15);
  const [awsLogs, setAwsLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  // Azure Active-Active Geo-Replication Simulator
  const [azureGeoLogs, setAzureGeoLogs] = useState<string[]>([]);
  const [vectorQueryText, setVectorQueryText] = useState('semantic search query');

  // --- GCP STATES ---
  // Memorystore Cluster Shard Expansion
  const [gcpShards, setGcpShards] = useState(3);
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // AWS Serverless ECU Scaling Simulation
  const simulateAwsServerlessScale = () => {
    const nextEcu = awsEcuLoad + 25;
    setAwsEcuLoad(nextEcu);
    setAwsLogs(prev => [
      `⚡ [ElastiCache Serverless] Traffic surge detected. Auto-scaled compute to ${nextEcu} ECUs.`,
      `📦 Valkey Engine: Processing 150,000 IOPS @ sub-millisecond latency.`,
      ...prev.slice(0, 4)
    ]);
  };

  // Azure Vector Search Simulation
  const testAzureRediSearch = () => {
    setAzureGeoLogs(prev => [
      `🔍 [RediSearch Vector Index] Querying embedding for "${vectorQueryText}"...`,
      `⚡ Matched 3 nearest neighbor vectors in 1.4 ms (Cosine similarity score: 0.94).`,
      ...prev.slice(0, 4)
    ]);
  };

  // GCP Shard Scale Simulation
  const scaleGcpShards = () => {
    const nextCount = gcpShards + 1;
    setGcpShards(nextCount);
    setGcpLogs(prev => [
      `📈 [Memorystore Cluster] Resharding cluster: expanded from ${gcpShards} ➔ ${nextCount} shards.`,
      `🌐 Rebalanced key slots across ${nextCount} master nodes with zero downtime.`,
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced In-Memory Cache Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Test cloud-native in-memory cache features including ElastiCache Serverless ECU scaling, Azure RediSearch vector indexes, and Memorystore zero-downtime resharding.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS ELASTICACHE: SERVERLESS & VALKEY                                      */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>ElastiCache Serverless & Valkey Auto-Scaler</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                ElastiCache Serverless automatically manages capacity in ElastiCache Processing Units (ECUs). It scales memory and compute independently without requiring cluster management.
              </p>

              {/* Status */}
              <div className="anl-log" style={{ border: '1px solid var(--color-border-tertiary)', borderRadius: '10px', padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#38bdf8', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '6px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  <span>ElastiCache Processing Units: {awsEcuLoad} ECUs</span>
                  <span style={{ color: '#34d399', fontWeight: 'bold' }}>VALKEY ONLINE</span>
                </div>

                <div style={{ height: '90px', overflowY: 'auto', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8' }}>
                  {awsLogs.length > 0 ? (
                    awsLogs.map((log, idx) => <div key={idx}>{log}</div>)
                  ) : (
                    <div style={{ color: '#475569' }}>Click "Simulate Cache Workload Spike"...</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={simulateAwsServerlessScale} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                ⚡ Simulate Cache Workload Spike (+25 ECUs)
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Global Datastore</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                ElastiCache Global Datastore replicates Redis write operations from a primary region to up to two secondary read-only regions with sub-second latency.
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 Allows applications in global regions to read cached data locally for fast page rendering.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE: REDIS ENTERPRISE VECTOR SEARCH                                    */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Cache for Redis Enterprise Vector Search</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Azure Cache for Redis Enterprise supports RediSearch and RedisJSON modules, enabling real-time vector similarity search for AI LLM retrieval-augmented generation (RAG).
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <label className="block font-bold mb-1 text-[11px]">Vector Search Prompt:</label>
                <input 
                  type="text" 
                  value={vectorQueryText} 
                  onChange={(e) => setVectorQueryText(e.target.value)}
                  className="w-full p-1.5 border rounded dark:bg-slate-100 dark:bg-slate-900 text-[11px]"
                />
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {azureGeoLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAzureRediSearch} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                🔍 Run Vector Similarity Search
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Active-Active Geo-Replication</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Azure Redis Enterprise features Active-Active Geo-Replication using Conflict-Free Replicated Data Types (CRDTs), enabling simultaneous write operations in multiple Azure regions.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Automatically resolves concurrent write conflicts without dropping cache mutations.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP: MEMORYSTORE CLUSTER RESHARDING                                       */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Memorystore for Redis Cluster Resharding</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                GCP Memorystore Cluster scales up to 250 shards (terabytes of memory). You can dynamically add or remove shards online while the cluster continues servicing live traffic.
              </p>

              {/* Status */}
              <div className="anl-log" style={{ border: '1px solid var(--color-border-tertiary)', borderRadius: '10px', padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#38bdf8', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '6px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  <span>Active Cluster Shards: {gcpShards} Shards</span>
                  <span style={{ color: '#34d399', fontWeight: 'bold' }}>16,384 KEYSLOTS ONLINE</span>
                </div>

                <div style={{ height: '90px', overflowY: 'auto', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8' }}>
                  {gcpLogs.map((log, index) => <div key={index}>{log}</div>)}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={scaleGcpShards} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                📈 Add Master Shard Online (+1 Shard)
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Private Service Access</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Memorystore instances are provisioned within a Google-managed VPC and connected to your tenant project via Private Service Access (VPC Peering), keeping cache traffic isolated from the internet.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Protects memory caches against unauthorized external network scans.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
