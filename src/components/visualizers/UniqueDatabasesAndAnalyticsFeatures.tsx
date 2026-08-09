import { useState } from 'react';
import { 
  Database, 
  BarChart3, 
  HelpCircle
} from 'lucide-react';

interface UniqueDatabasesAndAnalyticsFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueDatabasesAndAnalyticsFeatures({ provider }: UniqueDatabasesAndAnalyticsFeaturesProps) {
  // --- AWS STATES ---
  const [awsLogs, setAwsLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  const [cosmosConsistency, setCosmosConsistency] = useState<'strong' | 'bounded' | 'session' | 'prefix' | 'eventual'>('session');
  const [azureLogs, setAzureLogs] = useState<string[]>([]);

  // --- GCP STATES ---
  const [bqSlots, setBqSlots] = useState(500);
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // AWS DAX Test
  const testAwsDax = () => {
    setAwsLogs(prev => [
      `⚡ [DynamoDB Accelerator (DAX)] Cache HIT for PartitionKey="USER#9941". Response latency: 0.18 ms!`,
      `📊 Bypassed DynamoDB read capacity units (RCU). Zero RCU cost incurred!`,
      ...prev.slice(0, 4)
    ]);
  };

  // Azure Cosmos DB Consistency Test
  const testCosmosConsistency = () => {
    const descMap = {
      strong: '🔒 Strong: Linearizable reads guarantee clients always read latest committed write (higher latency).',
      bounded: '⏱️ Bounded Staleness: Reads lag behind writes by at most K versions or T time interval.',
      session: '🎯 Session (Default): Guarantees read-your-own-writes consistency within current user session context.',
      prefix: '📝 Consistent Prefix: Reads never see out-of-order writes, but data may lag behind writer.',
      eventual: '⚡ Eventual: Weakest consistency; lowest latency & highest availability across global regions.'
    };
    setAzureLogs(prev => [
      `💙 [Azure Cosmos DB Consistency Level: ${cosmosConsistency.toUpperCase()}]`,
      descMap[cosmosConsistency],
      `📊 Evaluated global write replication across 5 Azure regions.`,
      ...prev.slice(0, 4)
    ]);
  };

  // GCP BigQuery Slots Test
  const testGcpBigQuery = () => {
    setGcpLogs(prev => [
      `💚 [Google BigQuery] SQL Query executed over 2.4 Terabytes of log data.`,
      `📊 Allocated ${bqSlots} serverless processing slots dynamically in 0.2s.`,
      `⚡ Query completed in 1.4 seconds (2.4 TB scanned). In-Memory BI Engine cache utilized!`,
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced Database &amp; Analytics Feature Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Test specialized database capabilities including AWS DAX microsecond in-memory caching, Azure Cosmos DB 5 consistency spectrum choices, and GCP BigQuery serverless slot scaling.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS DYNAMODB DAX                                                          */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AWS DynamoDB Accelerator (DAX) Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                DAX is a fully managed, highly available in-memory cache for DynamoDB that delivers up to 10x performance improvement—from milliseconds to microseconds—even at millions of requests per second.
              </p>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {awsLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAwsDax} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                ⚡ Test DAX Microsecond Cache Hit
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Redshift Serverless RPU Scaling</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Amazon Redshift Serverless automatically provisions and scales compute capacity (RPUs) based on query complexity and workload volume, pausing compute during idle times.
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 Zero cluster management or manual cluster resizing required.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE COSMOS DB CONSISTENCY                                              */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Cosmos DB 5 Consistency Levels Spectrum</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Cosmos DB provides five well-defined consistency levels allowing developers to make explicit trade-offs between consistency, availability, and latency for global databases.
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <label className="block font-bold mb-1 text-[11px]">Select Consistency Model:</label>
                <select 
                  value={cosmosConsistency} 
                  onChange={(e) => setCosmosConsistency(e.target.value as any)}
                  className="w-full p-1.5 border rounded dark:bg-slate-100 dark:bg-slate-900 text-[11px]"
                >
                  <option value="strong">Strong (Linearizable)</option>
                  <option value="bounded">Bounded Staleness</option>
                  <option value="session">Session (Default)</option>
                  <option value="prefix">Consistent Prefix</option>
                  <option value="eventual">Eventual</option>
                </select>
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {azureLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testCosmosConsistency} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💙 Test Consistency Level Behavior
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Synapse Serverless SQL Pools</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Azure Synapse Serverless SQL pools allow querying Parquet, CSV, and JSON files inside Azure Data Lake Storage directly using standard T-SQL without setting up clusters.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Pay only for data scanned by your T-SQL queries.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP BIGQUERY SLOTS                                                       */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP BigQuery Serverless Slot Autoscaling Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Google BigQuery separates compute from storage. Compute slots (virtual CPUs used to execute SQL queries) scale up to thousands instantly based on query complexity.
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                  <span>Max Processing Slots:</span>
                  <span style={{ color: '#0F9D58' }}>{bqSlots} Serverless Slots</span>
                </div>
                <input 
                  type="range" 
                  min="100" 
                  max="2000" 
                  step="100"
                  value={bqSlots} 
                  onChange={(e) => setBqSlots(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {gcpLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testGcpBigQuery} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💚 Execute 2.4 TB BigQuery SQL Query
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Database className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Bigtable App Profiles</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Cloud Bigtable App Profiles route different client application workloads (e.g. real-time web serving vs batch analytics jobs) to specific clusters or replication routing rules.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Isolates analytical queries from impacting real-time user serving workloads.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
