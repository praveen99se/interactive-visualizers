import { useState } from 'react';
import { 
  Shield, 
  Activity, 
  RefreshCw, 
  TrendingUp,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface UniqueScalingFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueScalingFeatures({ provider }: UniqueScalingFeaturesProps) {
  // --- AWS STATES ---
  // Lifecycle Hook
  const [lifecycleState, setLifecycleState] = useState<'idle' | 'terminating_wait' | 'completing' | 'terminated'>('idle');
  const [lifecycleLogs, setLifecycleLogs] = useState<string[]>([]);
  
  // Warm Pool
  const [warmPoolInstances, setWarmPoolInstances] = useState<Array<{ id: string; state: 'Stopped' | 'Running' | 'Pending' }>>([
    { id: 'i-warm-01', state: 'Stopped' },
    { id: 'i-warm-02', state: 'Stopped' },
    { id: 'i-warm-03', state: 'Stopped' }
  ]);
  const [scalingActive, setScalingActive] = useState(false);
  const [scalingMode, setScalingMode] = useState<'cold' | 'warm'>('cold');
  const [scalingProgress, setScalingProgress] = useState(0);
  const [scalingLogs, setScalingLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  // Automatic Repair
  const [repairState, setRepairState] = useState<'healthy' | 'crashing' | 'unhealthy' | 'rebuilding' | 'recovered'>('healthy');
  const [repairLogs, setRepairLogs] = useState<string[]>([]);
  const [repairProgress, setRepairProgress] = useState(0);

  // --- GCP STATES ---
  // MIG Autohealing
  const [autohealState, setAutohealState] = useState<'healthy' | 'failing' | 'unhealthy' | 'recreating' | 'recovered'>('healthy');
  const [autohealLogs, setAutohealLogs] = useState<string[]>([]);
  const [healthzLogs, setHealthzLogs] = useState<string[]>([]);

  // Predictive Autoscaling Mock Data
  const predictiveData = [
    { time: '08:00', traffic: 120, standardInstances: 2, predictiveInstances: 2 },
    { time: '09:00', traffic: 350, standardInstances: 2, predictiveInstances: 4 }, // Predictive scales early
    { time: '10:00', traffic: 720, standardInstances: 4, predictiveInstances: 6 }, // Surge starts
    { time: '11:00', traffic: 800, standardInstances: 6, predictiveInstances: 6 }, // Peak load
    { time: '12:00', traffic: 500, standardInstances: 6, predictiveInstances: 5 },
    { time: '13:00', traffic: 220, standardInstances: 4, predictiveInstances: 3 },
    { time: '14:00', traffic: 180, standardInstances: 2, predictiveInstances: 2 }
  ];

  // --- AWS SIMULATORS ---
  const triggerLifecycleScaleIn = () => {
    if (lifecycleState !== 'idle') return;
    setLifecycleState('terminating_wait');
    const logs = [
      '[ASG Engine] Scale-in event triggered: removing 1 instance due to low demand.',
      '🛑 Marking instance i-08a329dcbef812a as Terminating...',
      '⏳ [Lifecycle Hook] Hook "ASG-Term-Backup-Hook" active. Pausing termination.',
      '🔍 Status changed: Terminating:Wait',
      '🤖 [Automation] Launching backup snapshot Lambda function...',
      '📦 Lambda: Copying server local application state to S3 Backup Bucket...',
      '💾 Backup completed: s3://my-asg-backup-bucket/i-08a329dcbef812a/state_db.json (Size: 2.4 MB)'
    ];
    setLifecycleLogs(logs);
  };

  const completeLifecycleAction = () => {
    if (lifecycleState !== 'terminating_wait') return;
    setLifecycleState('completing');
    const logs = [...lifecycleLogs, '🚀 User clicked "Complete Lifecycle Action" (CONTINUE).', '🤖 Sending complete-lifecycle-action API response...'];
    setLifecycleLogs(logs);

    setTimeout(() => {
      setLifecycleState('terminated');
      setLifecycleLogs(prev => [...prev, '🗑️ Terminating Wait released.', '🧹 Deleting EC2 Host volume and releasing IP address.', '✅ Instance i-08a329dcbef812a terminated successfully.']);
    }, 1500);
  };

  const resetLifecycleSim = () => {
    setLifecycleState('idle');
    setLifecycleLogs([]);
  };

  const runWarmPoolScaleOut = () => {
    if (scalingActive) return;
    setScalingActive(true);
    setScalingProgress(0);
    setScalingLogs([]);

    const duration = scalingMode === 'cold' ? 3000 : 1000;
    const steps = 10;
    let step = 0;
    const tempLogs: string[] = [];

    if (scalingMode === 'cold') {
      tempLogs.push('[ASG Engine] Scaling event: launching 1 new instance (Cold Boot).');
      tempLogs.push('💿 Provisioning new EC2 Host from Golden AMI...');
    } else {
      tempLogs.push('[ASG Engine] Scaling event: launching 1 new instance (Warm Pool Standby).');
      tempLogs.push('⚡ Retrieving pre-installed instance i-warm-01 from Stopped Warm Pool...');
    }
    setScalingLogs([...tempLogs]);

    const interval = setInterval(() => {
      if (step < steps) {
        step++;
        setScalingProgress(Math.floor((step / steps) * 100));

        if (scalingMode === 'cold') {
          if (step === 3) tempLogs.unshift('⏳ Host VM boot sequences running... (takes 2 minutes)');
          if (step === 6) tempLogs.unshift('📦 Installing packages & Running User Data boot script...');
          if (step === 9) tempLogs.unshift('🚦 Joining target group & performing ALB health check...');
        } else {
          if (step === 4) tempLogs.unshift('⚡ Warming up memory: Changing state from Stopped to Running...');
          if (step === 8) tempLogs.unshift('🚦 Dynamic target group join. Instant ALB check...');
        }
        setScalingLogs([...tempLogs]);
      } else {
        clearInterval(interval);
        setScalingActive(false);
        tempLogs.unshift(`✅ Scaling Complete! Instance is online. Boot Time: ${scalingMode === 'cold' ? '120 seconds' : '15 seconds'}.`);
        setScalingLogs([...tempLogs]);

        if (scalingMode === 'warm') {
          // Temporarily shift Warm Pool instances
          setWarmPoolInstances(prev => prev.map((inst, i) => i === 0 ? { ...inst, state: 'Running' } : inst));
        }
      }
    }, duration / steps);
  };

  const resetWarmPoolSim = () => {
    setScalingProgress(0);
    setScalingLogs([]);
    setWarmPoolInstances([
      { id: 'i-warm-01', state: 'Stopped' },
      { id: 'i-warm-02', state: 'Stopped' },
      { id: 'i-warm-03', state: 'Stopped' }
    ]);
  };

  // --- AZURE SIMULATORS ---
  const triggerAzureRepairs = () => {
    if (repairState !== 'healthy') return;
    setRepairState('crashing');
    setRepairLogs(['[VMSS Monitor] Initiating Application Crash Simulation...', '💥 Application Process exited on VMSS_Instance_0.']);
    
    setTimeout(() => {
      setRepairState('unhealthy');
      setRepairLogs(prev => [
        '[App Health Probe] Probe Failed: Port 80 connection refused on VMSS_Instance_0 (HTTP 503).',
        '[VMSS Engine] VMSS_Instance_0 marked Unhealthy for 10 minutes (Automatic Repair Cooldown).',
        '🛠️ [Automatic Repairs] Unhealthy threshold crossed. Repair Event Triggered!',
        ...prev
      ]);

      setTimeout(() => {
        setRepairState('rebuilding');
        setRepairProgress(0);
        const tempLogs = [...repairLogs];

        const steps = 10;
        let step = 0;
        const interval = setInterval(() => {
          if (step < steps) {
            step++;
            setRepairProgress(Math.floor((step / steps) * 100));
            if (step === 2) tempLogs.unshift('⏳ Rebuilding VMSS_Instance_0 OS Disk volume...');
            if (step === 6) tempLogs.unshift('⚙️ Restarting instance VMSS_Instance_0 in zone 1...');
            if (step === 9) tempLogs.unshift('🚦 Health check probe returned OK.');
            setRepairLogs([...tempLogs]);
          } else {
            clearInterval(interval);
            setRepairState('recovered');
            tempLogs.unshift('✅ VMSS_Instance_0 Auto-Repaired Successfully! Host healthy.');
            setRepairLogs([...tempLogs]);
          }
        }, 200);
      }, 1500);
    }, 1200);
  };

  const resetAzureRepairs = () => {
    setRepairState('healthy');
    setRepairLogs([]);
    setRepairProgress(0);
  };

  // --- GCP SIMULATORS ---
  const triggerGcpAutoheal = () => {
    if (autohealState !== 'healthy') return;
    setAutohealState('failing');
    setHealthzLogs(['[HTTP Probe] GET /healthz ➔ 500 Server Error (Failed: 1/3)']);
    setAutohealLogs(['[Autohealer] Target group probe failing on instance gce-node-12a.']);

    setTimeout(() => {
      setHealthzLogs(prev => ['[HTTP Probe] GET /healthz ➔ 500 Server Error (Failed: 2/3)', ...prev]);

      setTimeout(() => {
        setHealthzLogs(prev => ['[HTTP Probe] GET /healthz ➔ 500 Server Error (Failed: 3/3)', ...prev]);
        setAutohealState('unhealthy');
        setAutohealLogs(prev => [
          '🛑 Health Check Threshold reached. Instance gce-node-12a marked Unhealthy.',
          '🛠️ Autohealing triggered recreation sequence for gce-node-12a...',
          ...prev
        ]);

        setTimeout(() => {
          setAutohealState('recreating');
          const tempLogs = [...autohealLogs];
          tempLogs.unshift('[MIG Manager] Deleting failed instance gce-node-12a...');
          tempLogs.unshift('[MIG Manager] Recreating instance gce-node-12a from Instance Template...');
          setAutohealLogs([...tempLogs]);

          setTimeout(() => {
            setAutohealState('recovered');
            setHealthzLogs(['[HTTP Probe] GET /healthz ➔ 200 OK (Healthy)']);
            tempLogs.unshift('✅ Autohealing complete! gce-node-12a recreated and back online.');
            setAutohealLogs([...tempLogs]);
          }, 1500);
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const resetGcpAutoheal = () => {
    setAutohealState('healthy');
    setAutohealLogs([]);
    setHealthzLogs([]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced Fleet Autoscaling Simulators</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>
          Cloud providers engineer specific reliability models to manage virtual fleets. Run the simulations below to understand lifecycle hooks, self-healing automatic repairs, and predictive autoscaling behaviors.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* AWS ASG: LIFECYCLE HOOKS & WARM POOLS                                     */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* AWS Lifecycle Hooks */}
          <div className="lg:col-span-7 asg-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AWS ASG Terminating Lifecycle Hook Simulator</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                ASG Lifecycle Hooks pause instance transitions (launching or terminating) to allow custom scripts or server actions to run. If an instance scale-in triggers, it goes into <code>Terminating:Wait</code>, enabling data backup scripts to run before VM deletion.
              </p>

              {/* Simulation Visual */}
              <div className="anl-log" style={{ border: '1px solid var(--color-border-tertiary)', borderRadius: '10px', padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#38bdf8', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '6px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  <span>Lifecycle Hooks Monitor</span>
                  <span className={lifecycleState === 'terminating_wait' ? 'animate-pulse text-amber-500' : 'text-slate-500'}>
                    {lifecycleState.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1 text-center items-center mb-3">
                  <div style={{ border: '1px solid var(--color-border-tertiary)', padding: '6px', borderRadius: '4px', background: lifecycleState === 'idle' ? 'rgba(37,99,235,0.15)' : 'transparent', color: lifecycleState === 'idle' ? '#2563eb' : '#64748b' }}>
                    🟢 InService
                  </div>
                  <div style={{ color: '#1e293b' }}>➔</div>
                  <div style={{ border: '1px solid var(--color-border-tertiary)', padding: '6px', borderRadius: '4px', background: lifecycleState === 'terminating_wait' ? 'rgba(245,158,11,0.15)' : 'transparent', color: lifecycleState === 'terminating_wait' ? '#f59e0b' : '#64748b' }}>
                    ⏳ Term:Wait
                  </div>
                  <div style={{ border: '1px solid var(--color-border-tertiary)', padding: '6px', borderRadius: '4px', background: lifecycleState === 'terminated' ? 'rgba(239,68,68,0.15)' : 'transparent', color: lifecycleState === 'terminated' ? '#ef4444' : '#64748b' }}>
                    🗑️ Terminated
                  </div>
                </div>

                {/* Logs Terminal */}
                <div style={{ height: '110px', overflowY: 'auto', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8' }}>
                  {lifecycleLogs.length > 0 ? (
                    lifecycleLogs.map((log, idx) => (
                      <div key={idx} style={{ color: log.startsWith('[ASG') ? '#f59e0b' : log.includes('Backup') || log.includes('Lambda') ? '#34d399' : '#94a3b8' }}>
                        {log}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#475569' }}>Console idle. Click "Trigger Scale-In Event"...</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              {lifecycleState === 'idle' && (
                <button onClick={triggerLifecycleScaleIn} className="asg-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                  🛑 Trigger Scale-In Event
                </button>
              )}
              {lifecycleState === 'terminating_wait' && (
                <button onClick={completeLifecycleAction} className="asg-btn anl-on-alb" style={{ flex: 1, padding: '8px', background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)', border: 'none', color: '#fff', fontWeight: 'bold' }}>
                  ✅ Complete Lifecycle Action (CONTINUE)
                </button>
              )}
              {lifecycleState !== 'idle' && lifecycleState !== 'terminating_wait' && (
                <button onClick={resetLifecycleSim} className="anl-btn" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                  🔄 Reset Lifecycle Simulator
                </button>
              )}
            </div>
          </div>

          {/* AWS Warm Pools */}
          <div className="lg:col-span-5 asg-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sliders className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AWS ASG Warm Pools Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Warm Pools provision a pool of stopped standby EC2 instances. Instead of running full AMI boot and User Data scripts during scaling events (cold boot), Warm Pools resume stopped instances, dropping startup times.
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                  <span>Scaling Strategy:</span>
                  <span style={{ color: '#FF9900' }}>{scalingMode === 'cold' ? '❄️ Cold Boot' : '🔥 Warm Pool Standby'}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setScalingMode('cold')}
                    disabled={scalingActive}
                    className={`flex-1 py-1 rounded text-[10px] font-bold ${scalingMode === 'cold' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-100 dark:bg-slate-900 border'}`}
                  >
                    Cold Boot
                  </button>
                  <button 
                    onClick={() => setScalingMode('warm')}
                    disabled={scalingActive}
                    className={`flex-1 py-1 rounded text-[10px] font-bold ${scalingMode === 'warm' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 dark:bg-slate-100 dark:bg-slate-900 border'}`}
                  >
                    Warm Pools
                  </button>
                </div>
              </div>

              {/* Pool display */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px' }}>
                {warmPoolInstances.map((inst) => (
                  <div key={inst.id} style={{ flex: 1, padding: '8px', border: '1.5px dashed var(--color-border-secondary)', borderRadius: '8px', textAlign: 'center', background: 'var(--color-background-secondary)' }}>
                    <div style={{ fontSize: '18px' }}>💻</div>
                    <div style={{ fontSize: '9px', fontWeight: 'bold' }}>{inst.id}</div>
                    <div style={{ fontSize: '8px', color: inst.state === 'Stopped' ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>{inst.state}</div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              {scalingActive && (
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '10px', marginBottom: '2px' }}>
                    <span>Scaling Out:</span>
                    <span>{scalingProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#FF9900', width: `${scalingProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Logs */}
              <div style={{ height: '70px', overflowY: 'auto', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--asg-card-border)', borderRadius: '6px', padding: '6px', fontSize: '9.5px', fontFamily: 'monospace' }}>
                {scalingLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={runWarmPoolScaleOut} disabled={scalingActive} className="asg-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                🚀 Trigger Scale-Out (+1 Node)
              </button>
              <button onClick={resetWarmPoolSim} disabled={scalingActive} className="anl-btn" style={{ padding: '8px', fontWeight: 'bold' }}>
                🔄 Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE VMSS: AUTOMATIC REPAIRS                                             */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 asg-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure VMSS Automatic Repairs Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Azure Virtual Machine Scale Sets support Automatic Repairs. By specifying an Application Health Extension probe, the VMSS orchestrates self-healing: if an instance fails the health checks for a prolonged period, Azure automatically recreates the OS Managed Disk and redeploys the VM.
              </p>

              {/* Simulation Visual */}
              <div className="anl-log" style={{ border: '1px solid var(--color-border-tertiary)', borderRadius: '10px', padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#38bdf8', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '6px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  <span>Azure VMSS Repair Monitor</span>
                  <span style={{ fontWeight: 'bold', color: repairState === 'healthy' || repairState === 'recovered' ? '#34d399' : '#ef4444' }}>
                    {repairState.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center justify-around bg-slate-50 dark:bg-slate-100 dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 mb-3" style={{ fontSize: '11px' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '9px' }}>VMSS NODE STATUS:</span>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>VMSS_Instance_0</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '9px' }}>HEALTH PROBE:</span>
                    <span style={{ 
                      color: repairState === 'healthy' || repairState === 'recovered' ? '#34d399' : '#ef4444', 
                      fontWeight: 'bold' 
                    }}>
                      {repairState === 'healthy' || repairState === 'recovered' ? 'HTTP 200 OK' : 'CRASHED (No Response)'}
                    </span>
                  </div>
                </div>

                {repairState === 'rebuilding' && (
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '9px', marginBottom: '2px' }}>
                      <span>Rebuilding OS Disk:</span>
                      <span>{repairProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#0078D4', width: `${repairProgress}%` }} />
                    </div>
                  </div>
                )}

                {/* Logs Terminal */}
                <div style={{ height: '100px', overflowY: 'auto', background: '#020617', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8' }}>
                  {repairLogs.length > 0 ? (
                    repairLogs.map((log, index) => <div key={index}>{log}</div>)
                  ) : (
                    <div style={{ color: '#475569' }}>Click "Simulate VMSS Instance Crash"...</div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {repairState === 'healthy' ? (
                <button onClick={triggerAzureRepairs} className="asg-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                  💥 Simulate VMSS Instance Crash
                </button>
              ) : (
                <button onClick={resetAzureRepairs} className="anl-btn" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                  🔄 Reset Repairs Sandbox
                </button>
              )}
            </div>
          </div>
          <div className="lg:col-span-5 asg-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Auto-Healing Mechanic</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Azure Automatic Repairs uses the VMSS model specifications to rebuild disks in-place. Because it doesn't just reboot the VM but actually replaces the underlying system volume, it cleanly corrects corrupted OS states or configuration drifts automatically.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Automatic Repairs can be configured with a grace period (cooldown) from 10 to 90 minutes. This avoids infinite rebuild loops if an application startup routine is slow.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP: AUTOHEALING & PREDICTIVE AUTOSCALING                                 */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* GCP Autohealing */}
          <div className="lg:col-span-7 asg-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <RefreshCw className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Google Cloud MIG Autohealing Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Managed Instance Groups (MIGs) utilize health checks to trigger **Autohealing**. If an HTTP health check fails for the configured threshold (e.g. 3 times), the group manager destroys and recreates the instance, ensuring stateless apps recover autonomously.
              </p>

              {/* Interface */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
                <div className="md:col-span-4 anl-log" style={{ border: '1px solid var(--color-border-tertiary)', padding: '10px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '10.5px', color: '#10b981' }}>
                  <div style={{ borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '4px', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Health Checks</div>
                  <div style={{ maxHeight: '100px', overflowY: 'auto' }}>
                    {healthzLogs.length > 0 ? (
                      healthzLogs.map((log, idx) => <div key={idx} style={{ color: log.includes('OK') ? '#34d399' : '#f87171' }}>{log}</div>)
                    ) : (
                      <div style={{ color: '#475569' }}>Probes running...</div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-8 anl-log" style={{ border: '1px solid var(--color-border-tertiary)', padding: '10px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '10.5px', color: '#38bdf8' }}>
                  <div style={{ borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '4px', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Autohealer Logs</div>
                  <div style={{ height: '100px', overflowY: 'auto', color: 'var(--color-text-primary)' }}>
                    {autohealLogs.length > 0 ? (
                      autohealLogs.map((log, idx) => <div key={idx}>{log}</div>)
                    ) : (
                      <div style={{ color: '#475569' }}>Monitoring pool status...</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {autohealState === 'healthy' ? (
                <button onClick={triggerGcpAutoheal} className="asg-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                  ⚡ Trigger HTTP 500 Failure on gce-node-12a
                </button>
              ) : (
                <button onClick={resetGcpAutoheal} className="anl-btn" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                  🔄 Reset Autohealer
                </button>
              )}
            </div>
          </div>

          {/* GCP Predictive Autoscaling */}
          <div className="lg:col-span-5 asg-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Predictive Autoscaling Timeline</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "12px", lineHeight: "1.45" }}>
                Google Cloud Autoscaler supports **Predictive Autoscaling**. By analyzing the last 14 days of historical CPU/load data, it forecasts traffic surges and pre-allocates VM capacity *before* load strikes, eliminating startup delays.
              </p>

              {/* Chart */}
              <div style={{ height: '150px', width: '100%', fontSize: '9px', background: '#0a0d16', borderRadius: '8px', padding: '6px', border: '1px solid var(--color-border-tertiary)' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={predictiveData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip contentStyle={{ background: '#020617', border: '1px solid var(--color-border-tertiary)', fontSize: '9px' }} />
                    <Legend wrapperStyle={{ fontSize: '9px' }} />
                    <Area type="monotone" dataKey="standardInstances" name="Reactive Scaling" stroke="#FF9900" fill="rgba(255,153,0,0.05)" />
                    <Area type="monotone" dataKey="predictiveInstances" name="Predictive (GCP)" stroke="#0F9D58" fill="rgba(15,157,88,0.1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44', marginTop: '12px' }}>
              💡 Notice how at 09:00 (before the 10:00 rush), Predictive Autoscaling has already pre-launched 4 instances, whereas reactive autoscaling lags behind and waits for actual load to spike.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
