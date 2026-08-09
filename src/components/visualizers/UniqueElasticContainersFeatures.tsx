import { useState } from 'react';
import { 
  Box, 
  Cpu, 
  Layers, 
  Shield, 
  Zap,
  HelpCircle
} from 'lucide-react';

interface UniqueElasticContainersFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueElasticContainersFeatures({ provider }: UniqueElasticContainersFeaturesProps) {
  // --- AWS STATES ---
  const [pendingPods, setPendingPods] = useState(15);
  const [awsLogs, setAwsLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  const [kedaQueueCount, setKedaQueueCount] = useState(0);
  const [azureLogs, setAzureLogs] = useState<string[]>([]);

  // --- GCP STATES ---
  const [concurrencyLimit, setConcurrencyLimit] = useState(80);
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // AWS Karpenter Autoscaler
  const testAwsKarpenter = () => {
    setAwsLogs(prev => [
      `⚡ [EKS Karpenter] Intercepted ${pendingPods} unschedulable pods with resource requests 2 vCPU / 4 GB RAM.`,
      `📦 Evaluated 80+ EC2 instance types. Selected 2x c6g.2xlarge Graviton3 instances for optimal bin-packing cost.`,
      `🚀 Nodes launched & joined EKS cluster in 42 seconds! Zero Cluster Autoscaler node-group constraints.`,
      ...prev.slice(0, 4)
    ]);
  };

  // Azure KEDA Scale to Zero
  const testAzureKEDA = () => {
    if (kedaQueueCount === 0) {
      setAzureLogs(prev => [
        `💤 [Azure Container Apps] KEDA Queue Trigger detected 0 messages in Azure Service Bus.`,
        `📉 Scaled replica count down to EXACTLY 0. Zero vCPU/RAM billing active!`,
        ...prev.slice(0, 4)
      ]);
    } else {
      const replicas = Math.min(10, Math.ceil(kedaQueueCount / 50));
      setAzureLogs(prev => [
        `⚡ [Azure Container Apps] KEDA Queue Trigger detected ${kedaQueueCount} messages in queue.`,
        `📈 Instant cold start: Scaled container app replicas from 0 ➔ ${replicas} instances in 1.2s.`,
        ...prev.slice(0, 4)
      ]);
    }
  };

  // GCP Cloud Run Concurrency
  const testGcpCloudRun = () => {
    setGcpLogs(prev => [
      `🚀 [Google Cloud Run] Inbound burst of 500 HTTPS requests. Concurrency target set to ${concurrencyLimit} req/container.`,
      `📊 Scaled from 1 ➔ ${Math.ceil(500 / concurrencyLimit)} container instances on Google Anycast network.`,
      `💚 CPU allocated strictly during request processing. Sub-millisecond cold start latency.`,
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced Container Platform Feature Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Simulate container scaling engines including AWS EKS Karpenter Just-in-Time node provisioning, Azure Container Apps KEDA scale-to-zero, and GCP Cloud Run request concurrency autoscaling.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS EKS KARPENTER & FARGATE                                               */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>EKS Karpenter Just-in-Time Autoscaler Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Karpenter bypasses rigid Kubernetes Node Groups. It observes pending pod constraints (CPU, RAM, architecture, zone) and provisions optimal EC2 instances directly.
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                  <span>Pending Pod Surge:</span>
                  <span style={{ color: '#FF9900' }}>{pendingPods} Pending Pods</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={pendingPods} 
                  onChange={(e) => setPendingPods(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {awsLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAwsKarpenter} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                ⚡ Trigger Karpenter JIT Node Provisioning
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Fargate MicroVM Isolation</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Fargate tasks execute inside dedicated Firecracker microVMs. Tasks never share kernel space, memory, or CPU threads with other customer workloads on the underlying host.
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 Hypervisor-level security boundary for multi-tenant container workloads.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE: KEDA SCALE TO ZERO                                                */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Container Apps KEDA Scale-to-Zero Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                KEDA (Kubernetes Event-driven Autoscaling) monitors external metrics (like Service Bus queue depth or HTTP requests) and scales container app replicas down to 0 when idle.
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                  <span>Service Bus Queue Backlog:</span>
                  <span style={{ color: '#0078D4' }}>{kedaQueueCount} Messages</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="500" 
                  step="50"
                  value={kedaQueueCount} 
                  onChange={(e) => setKedaQueueCount(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {azureLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAzureKEDA} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💙 Evaluate KEDA Autoscaling Rule
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Dapr Microservice Integration</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Azure Container Apps includes native Dapr (Distributed Application Runtime) sidecars for pub/sub messaging, state management, and service-to-service mTLS invocation.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Built-in distributed tracing and mTLS encryption between container microservices.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP: CLOUD RUN CONCURRENCY                                               */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Box className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Cloud Run Request Concurrency Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Unlike traditional Functions that handle 1 request per instance, Cloud Run instances process up to 1,000 concurrent HTTP requests per instance, dramatically reducing cold starts and cost.
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                  <span>Max Concurrency Target:</span>
                  <span style={{ color: '#0F9D58' }}>{concurrencyLimit} Req / Container</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="250" 
                  step="10"
                  value={concurrencyLimit} 
                  onChange={(e) => setConcurrencyLimit(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {gcpLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testGcpCloudRun} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💚 Simulate 500 Concurrent HTTP Requests
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GKE Autopilot SLA Billing</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                GKE Autopilot bills strictly for CPU, Memory, and Ephemeral Storage requested by your running Pods, with Google managing control plane nodes, OS upgrades, and node autoscaling.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Zero unallocated node capacity charges for Kubernetes clusters.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
