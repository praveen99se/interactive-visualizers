import { useState } from 'react';
import { 
  Zap, 
  Clock, 
  Cpu, 
  Activity, 
  HelpCircle
} from 'lucide-react';

interface UniqueServerlessFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueServerlessFeatures({ provider }: UniqueServerlessFeaturesProps) {
  // --- AWS STATES ---
  const [awsLogs, setAwsLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  const [azureLogs, setAzureLogs] = useState<string[]>([]);

  // --- GCP STATES ---
  const [gcpMinInstances, setGcpMinInstances] = useState(2);
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // AWS SnapStart Test
  const testAwsSnapStart = () => {
    setAwsLogs(prev => [
      `⚡ [AWS Lambda SnapStart] Cold Start Invocation request received.`,
      `📦 Restored Firecracker MicroVM snapshot state from S3 cache in 118 ms (vs 4,200 ms standard Java init!).`,
      `🚀 Initialized DB connection pool & Spring Boot context loaded instantly. Execution complete.`,
      ...prev.slice(0, 4)
    ]);
  };

  // Azure Flex Consumption Test
  const testAzureFlexConsumption = () => {
    setAzureLogs(prev => [
      `💙 [Azure Functions Flex Consumption] Event Hubs partition trigger received 1,200 events.`,
      `⚡ Dynamically allocated 12 function instances with memory-based concurrency billing.`,
      `✅ Executed output binding to Cosmos DB. Scaling down to zero idle memory.`,
      ...prev.slice(0, 4)
    ]);
  };

  // GCP Min Instances Test
  const testGcpMinInstances = () => {
    setGcpLogs(prev => [
      `💚 [GCP Cloud Functions 2nd Gen] Min Instances set to ${gcpMinInstances}.`,
      `🔒 ${gcpMinInstances} initialized container runtimes kept warm continuously at edge location.`,
      `⚡ 0 ms cold start latency observed on first 50 incoming requests!`,
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced Serverless Compute Feature Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Explore specialized serverless mechanisms including AWS Lambda SnapStart MicroVM snapshot restoration, Azure Functions Flex Consumption execution, and GCP Cloud Functions 2nd Gen Min Instances.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS LAMBDA SNAPSTART                                                     */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AWS Lambda SnapStart MicroVM Restoration Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                SnapStart takes a snapshot of the Firecracker MicroVM memory state after initialization (Java/Python). On cold start, it restores memory directly instead of running initialization code.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {awsLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAwsSnapStart} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                ⚡ Test SnapStart Cold Start Restoration
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Lambda Response Streaming</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Lambda Response Streaming sends payload chunks back to clients as they are generated (e.g. LLM token streaming or large file downloads), reducing time-to-first-byte (TTFB).
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 Streams up to 20 MB response payloads directly without buffering.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE FUNCTIONS FLEX CONSUMPTION                                         */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Functions Flex Consumption Plan</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Flex Consumption combines serverless auto-scaling with VNet integration and per-function instance memory sizing (512 MB to 4,096 MB) for high-concurrency workloads.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {azureLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAzureFlexConsumption} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💙 Test Flex Consumption Event Trigger
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Declarative Input/Output Bindings</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Azure Functions uses declarative triggers and bindings in code attributes to connect directly to Cosmos DB, Blob Storage, and Event Hubs without SDK boilerplate code.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Eliminates database client instantiation &amp; connection pool management.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP CLOUD FUNCTIONS 2ND GEN MIN INSTANCES                                */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Cloud Functions 2nd Gen Min Instances Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Cloud Functions 2nd Gen is built on Google Cloud Run and Knative, supporting Min Instances to guarantee pre-warmed execution environments for instant response times.
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                  <span>Warm Min Instances Setting:</span>
                  <span style={{ color: '#0F9D58' }}>{gcpMinInstances} Pre-warmed Instances</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="10" 
                  value={gcpMinInstances} 
                  onChange={(e) => setGcpMinInstances(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {gcpLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testGcpMinInstances} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💚 Test 2nd Gen Min Instances Warm Response
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Eventarc Event Subscriptions</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Cloud Functions 2nd Gen seamlessly hooks into Eventarc to trigger functions from 130+ Google Cloud event sources using CloudEvents standard format.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Real-time event routing for Cloud Storage file uploads and Cloud Audit Logs.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
