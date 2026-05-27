import { useEffect, useRef, useState } from 'react';

type TabType = 'concept' | 'arch' | 'policies' | 'health' | 'sim';

interface Inst {
  id: number;
  status: 'warm' | 'ok' | 'drain' | 'terminated';
  warmTicks: number;
  healthy: boolean;
  draining: boolean;
  drainTicks: number;
  failed: boolean;
}

interface SimState {
  instances: Inst[];
  drainingEnabled: boolean;
  cooldown: number;
}

interface Config {
  rps: number;
  targetCpu: number;
  minCap: number;
  desCap: number;
  maxCap: number;
  capPer: number;
}

const makeInstance = (id: number): Inst => ({
  id,
  status: 'warm',
  warmTicks: 2,
  healthy: false,
  draining: false,
  drainTicks: 0,
  failed: false,
});

export default function ASGVisualizer() {
  const [activeSection, setActiveSection] = useState<TabType>('concept');

  // Simulation parameters
  const [rps, setRps] = useState(300);
  const [targetCpu, setTargetCpu] = useState(50);
  const [minCap, setMinCap] = useState(2);
  const [desCap, setDesCap] = useState(3);
  const [maxCap, setMaxCap] = useState(12);
  const [capPer, setCapPer] = useState(200);

  const [instances, setInstances] = useState<Inst[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [drainingEnabled, setDrainingEnabled] = useState(true);

  // Premium Interactive ASG VPC Architecture states
  const [archScenario, setArchScenario] = useState<'normal' | 'outage' | 'surge'>('normal');

  // Premium Interactive ASG Health & Lifecycles states
  const [lifecycleStage, setLifecycleStage] = useState<'pending_launch' | 'pending_wait' | 'inservice' | 'terminating_wait' | 'terminated'>('pending_launch');
  const [lifecycleLogs, setLifecycleLogs] = useState<string[]>([
    '💡 Sandbox initialized. Click "Trigger Next Transition ⏭" to provision a new EC2 instance.'
  ]);
  const [sandboxFailed, setSandboxFailed] = useState<boolean>(false);
  const [launchHookApproved, setLaunchHookApproved] = useState<boolean>(false);
  const [terminateHookApproved, setTerminateHookApproved] = useState<boolean>(false);

  const logLifecycle = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLifecycleLogs((prev) => [`${time} — ${msg}`, ...prev].slice(0, 50));
  };

  const simStateRef = useRef<SimState>({ instances: [], drainingEnabled: true, cooldown: 0 });
  const configRef = useRef<Config>({ rps, targetCpu, minCap, desCap, maxCap, capPer });
  const timerRef = useRef<number | null>(null);

  // Synchronize config ref
  useEffect(() => {
    configRef.current = { rps, targetCpu, minCap, desCap, maxCap, capPer };
  }, [rps, targetCpu, minCap, desCap, maxCap, capPer]);

  // Synchronize draining ref
  useEffect(() => {
    simStateRef.current.drainingEnabled = drainingEnabled;
  }, [drainingEnabled]);

  // Set initial simulation targets on load
  useEffect(() => {
    resetSim();
    return pause;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync min/max capacity boundaries
  useEffect(() => {
    if (minCap > maxCap) {
      setMaxCap(minCap);
    }
    if (desCap < minCap) {
      setDesCap(minCap);
    } else if (desCap > maxCap) {
      setDesCap(maxCap);
    }
  }, [minCap, maxCap, desCap]);

  const now = () => new Date().toLocaleTimeString();

  const logLine = (html: string) => {
    setLogs((prev) => [`${now()} — ${html}`, ...prev].slice(0, 150));
  };

  const ensureCapacity = (currentInstances: Inst[], desired: number, drainOn: boolean) => {
    const live = currentInstances.filter((x) => x.status !== 'terminated');
    const out = [...currentInstances];

    if (live.length < desired) {
      const add = desired - live.length;
      for (let k = 0; k < add; k++) {
        const id = out.length ? Math.max(...out.map((x) => x.id)) + 1 : 1;
        out.push(makeInstance(id));
        logLine(`<span class="asg-badge asg-binfo">Scale out</span> Launching instance <b>i-${id}</b> (warming up lifecycle).`);
      }
    } else if (live.length > desired) {
      let remove = live.length - desired;
      const sorted = live.slice().sort((a, b) => a.id - b.id);
      for (const inst of sorted) {
        if (remove <= 0) break;
        if (inst.failed || inst.status === 'terminated') continue;
        const idx = out.findIndex((o) => o.id === inst.id);
        if (idx < 0) continue;

        if (drainOn) {
          if (!out[idx].draining) {
            out[idx] = { ...out[idx], draining: true, drainTicks: 2, status: 'drain' };
            logLine(`<span class="asg-badge asg-bwarn">Scale in</span> <b>i-${inst.id}</b> set to <b>draining</b> (LB finishes active requests).`);
            remove -= 1;
          }
        } else {
          out[idx] = { ...out[idx], status: 'terminated', healthy: false };
          logLine(`<span class="asg-badge asg-bbad">Scale in</span> <b>i-${inst.id}</b> terminated immediately (no drain delay).`);
          remove -= 1;
        }
      }
    }
    return out;
  };

  const applyWarmupAndDrain = (currentInstances: Inst[]) => {
    return currentInstances.map((inst) => {
      if (inst.status === 'warm') {
        const warmTicks = inst.warmTicks - 1;
        if (warmTicks <= 0) {
          logLine(`<span class="asg-badge asg-bok">Healthy</span> <b>i-${inst.id}</b> passed target health checks → in-service receiving traffic.`);
          return { ...inst, status: 'ok', warmTicks: 0, healthy: true } as Inst;
        }
        return { ...inst, warmTicks } as Inst;
      }
      if (inst.status === 'drain') {
        const drainTicks = inst.drainTicks - 1;
        if (drainTicks <= 0) {
          logLine(`<span class="asg-badge asg-bwarn">Terminated</span> <b>i-${inst.id}</b> fully drained → removed from target group → terminated.`);
          return { ...inst, status: 'terminated', healthy: false } as Inst;
        }
        return { ...inst, drainTicks } as Inst;
      }
      return inst;
    });
  };

  const distributeTraffic = (currentInstances: Inst[], cfg: { rps: number; capPer: number }) => {
    const healthy = currentInstances.filter((x) => x.status === 'ok' && x.healthy && !x.failed);
    const n = healthy.length;
    const rpt = n ? cfg.rps / n : 0;
    const cpuPer = n ? Math.min(100, (rpt / cfg.capPer) * 100) : cfg.rps > 0 ? 100 : 0;
    return { n, rpt, avgCpu: cpuPer };
  };

  const scalingDecision = (cfg: Config, metrics: { n: number; avgCpu: number }) => {
    const simState = simStateRef.current;
    if (simState.cooldown > 0) {
      simState.cooldown -= 1;
      return cfg.desCap;
    }

    let desired = cfg.desCap;
    if (metrics.n === 0 && cfg.rps > 0) {
      desired = Math.max(cfg.minCap, Math.min(cfg.maxCap, 1));
      logLine(`<span class="asg-badge asg-bbad">No targets</span> 0 healthy servers while traffic active → forcing desired=${desired}.`);
      simState.cooldown = 2;
      return desired;
    }

    if (metrics.avgCpu > cfg.targetCpu + 8 && desired < cfg.maxCap) {
      desired += 1;
      logLine(`<span class="asg-badge asg-binfo">Alarm High</span> Avg CPU ${Math.round(metrics.avgCpu)}% &gt; target ${cfg.targetCpu}% → scaling out desired=${desired}.`);
      simState.cooldown = 2;
    } else if (metrics.avgCpu < cfg.targetCpu - 12 && desired > cfg.minCap) {
      desired -= 1;
      logLine(`<span class="asg-badge asg-bwarn">Alarm Low</span> Avg CPU ${Math.round(metrics.avgCpu)}% &lt; target ${cfg.targetCpu}% → scaling in desired=${desired}.`);
      simState.cooldown = 2;
    }
    return desired;
  };

  const tick = () => {
    const cfg = configRef.current;
    let nextInstances = ensureCapacity(simStateRef.current.instances, cfg.desCap, simStateRef.current.drainingEnabled);
    nextInstances = applyWarmupAndDrain(nextInstances);

    const failed = nextInstances.find((x) => x.failed && x.status !== 'terminated');
    if (failed) {
      nextInstances = nextInstances.map((inst) => (inst.id === failed.id ? { ...inst, status: 'terminated', healthy: false } : inst));
      logLine(`<span class="asg-badge asg-bbad">Replace Node</span> <b>i-${failed.id}</b> failed health check → ASG evicts node &amp; provisions new target.`);
      nextInstances = ensureCapacity(nextInstances, cfg.desCap, simStateRef.current.drainingEnabled);
    }

    const metrics = distributeTraffic(nextInstances, cfg);
    const newDesired = scalingDecision(cfg, metrics);
    if (newDesired !== cfg.desCap) {
      setDesCap(newDesired);
    }
    nextInstances = ensureCapacity(nextInstances, newDesired, simStateRef.current.drainingEnabled);

    simStateRef.current.instances = nextInstances;
    setInstances(nextInstances);
  };

  const start = () => {
    if (timerRef.current) return;
    setIsRunning(true);
    logLine(`<span class="asg-badge asg-binfo">Simulation RUNNING</span> Automatic traffic loop started.`);
    timerRef.current = window.setInterval(tick, 900);
  };

  const pause = () => {
    if (!timerRef.current) return;
    window.clearInterval(timerRef.current);
    timerRef.current = null;
    setIsRunning(false);
    logLine(`<span class="asg-badge asg-bwarn">Simulation PAUSED</span> Simulation paused.`);
  };

  const stepOnce = () => {
    tick();
  };

  const resetSim = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRunning(false);
    const initialInstances = Array.from({ length: desCap }, (_, index) => makeInstance(index + 1));
    simStateRef.current = { instances: initialInstances, drainingEnabled: drainingEnabled, cooldown: 0 };
    setInstances(initialInstances);
    setLogs(['Tip: Increase Incoming Traffic (RPS) until avg CPU exceeds target to trigger automatic Scale Out!']);
  };

  const injectFailure = () => {
    const existing = simStateRef.current.instances.filter((x) => x.status === 'ok' && !x.failed);
    if (existing.length === 0) {
      logLine(`<span class="asg-badge asg-bbad">Failure</span> No healthy targets available to fail.`);
      return;
    }
    const victim = existing[Math.floor(Math.random() * existing.length)];
    const nextInstances = simStateRef.current.instances.map((inst) =>
      inst.id === victim.id ? { ...inst, failed: true, healthy: false } : inst
    );
    simStateRef.current.instances = nextInstances;
    setInstances(nextInstances);
    logLine(`<span class="asg-badge asg-bbad">Failure Injected</span> <b>i-${victim.id}</b> failed ELB target checks!`);
  };

  const toggleDrain = () => {
    setDrainingEnabled(!drainingEnabled);
    logLine(`<span class="asg-badge asg-binfo">Draining Toggle</span> Scale-in connection draining is now <b>${!drainingEnabled ? 'ON' : 'OFF'}</b>.`);
  };

  const metrics = distributeTraffic(instances, { rps, capPer });

  return (
    <div>
      <style>{`
        .asg-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 14px; }
        .asg-tb { padding: 6px 14px; border-radius: 999px; border: 0.5px solid var(--color-border-secondary); font-size: 12px; cursor: pointer; background: var(--color-background-secondary); color: var(--color-text-secondary); transition: all .15s; outline: none; }
        .asg-tb:hover { background: var(--color-background-tertiary); }
        .asg-tb.asg-on { background: #16a34a; color: #fff; border-color: #16a34a; }
        .asg-card { border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 14px 16px; background: var(--color-background-primary); margin-bottom: 12px; }
        .asg-sec { font-size: 11px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .05em; margin: 16px 0 8px; }
        .asg-sec:first-child { margin-top: 0; }
        .asg-kv { display: flex; gap: 8px; font-size: 12px; margin: 6px 0; align-items: baseline; }
        .asg-kk { min-width: 160px; color: var(--color-text-secondary); flex-shrink: 0; }
        .asg-g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .asg-g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .asg-met { background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 12px; text-align: center; }
        ul.asg-ck li { font-size: 12px; margin-bottom: 6px; list-style: none; padding-left: 18px; position: relative; }
        ul.asg-ck li::before { content: "✓"; position: absolute; left: 0; color: #16a34a; font-weight: 700; }
        .asg-log { border: 0.5px solid var(--color-border-tertiary); border-radius: 8px; padding: 10px 12px; background: var(--color-background-secondary); font-size: 11px; font-family: var(--font-mono, monospace); white-space: pre-wrap; line-height: 1.5; color: var(--color-text-primary); }
        .asg-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; }
        .asg-binfo { background: #dbeafe; color: #1d4ed8; }
        .asg-bok { background: #dcfce7; color: #15803d; }
        .asg-bwarn { background: #fef3c7; color: #b45309; }
        .asg-bbad { background: #fee2e2; color: #b91c1c; }
        .asg-btn { font-size: 12px; padding: 5px 12px; border-radius: 6px; border: 0.5px solid var(--color-border-secondary); background: var(--color-background-primary); color: var(--color-text-primary); cursor: pointer; transition: all 0.15s; outline: none; }
        .asg-btn:hover { background: var(--color-background-secondary); }
        .asg-btn.asg-on { background: #16a34a; color: #fff; border-color: #16a34a; }
        .asg-instances { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; margin-top: 10px; }
        .asg-inst { border-radius: 10px; border: 1.5px solid var(--color-border-tertiary); padding: 8px 8px; text-align: center; background: var(--color-background-secondary); transition: all 0.15s; }
        .asg-inst .name { font-size: 11px; font-weight: bold; margin-bottom: 4px; }
        .asg-inst .meta { font-size: 10px; color: var(--color-text-tertiary); line-height: 1.4; }
        .asg-inst.asg-ok { border-color: #16a34a; background: #dcfce7; color: #15803d; }
        .asg-inst.asg-warm { border-color: #b45309; background: #fef3c7; color: #b45309; }
        .asg-inst.asg-drain { border-color: #1d4ed8; background: #dbeafe; color: #1d4ed8; }
        .asg-inst.asg-down { border-color: #dc2626; background: #fee2e2; color: #b91c1c; opacity: 0.85; }

        @keyframes activeNodePulse {
          0% { filter: drop-shadow(0 0 2px var(--pulse-color)); }
          50% { filter: drop-shadow(0 0 10px var(--pulse-color)); }
          100% { filter: drop-shadow(0 0 2px var(--pulse-color)); }
        }
        .active-glow-node {
          animation: activeNodePulse 2s infinite;
        }
        @keyframes flowAnim {
          to { stroke-dashoffset: -20; }
        }
        .flow-active-line {
          stroke-dasharray: 6, 4;
          animation: flowAnim 1s linear infinite;
        }
        .arch-scenario-btn {
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid var(--color-border-secondary);
          background: var(--color-background-secondary);
          color: var(--color-text-secondary);
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .arch-scenario-btn:hover {
          background: var(--color-background-tertiary);
          color: var(--color-text-primary);
        }
        .arch-scenario-btn.active {
          background: rgba(22, 163, 74, 0.15);
          color: #16a34a;
          border-color: #16a34a;
        }
        .mnemonic-gcard {
          border-radius: var(--border-radius-lg);
          padding: 14px 16px;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border: 1.5px solid #d97706;
          box-shadow: 0 4px 20px rgba(217, 119, 6, 0.1);
        }
        .mnemonic-gcard-title {
          font-weight: bold;
          font-size: 13px;
          color: #fbbf24;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '14px 16px 4px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📈 AWS Auto Scaling Groups (ASG) — Zonal Scaling · Launch Templates · Self Healing
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Ensure high availability by maintaining fleet sizes, recovering failed instances, and dynamically adapting to workload changes.
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="asg-tabs">
          <button className={`asg-tb ${activeSection === 'concept' ? 'asg-on' : ''}`} onClick={() => setActiveSection('concept')}>⚖️ Concept &amp; Capacity</button>
          <button className={`asg-tb ${activeSection === 'arch' ? 'asg-on' : ''}`} onClick={() => setActiveSection('arch')}>🏗️ VPC Architecture</button>
          <button className={`asg-tb ${activeSection === 'policies' ? 'asg-on' : ''}`} onClick={() => setActiveSection('policies')}>📈 Scaling Policies</button>
          <button className={`asg-tb ${activeSection === 'health' ? 'asg-on' : ''}`} onClick={() => setActiveSection('health')}>❤️ Health &amp; Lifecycles</button>
          <button className={`asg-tb ${activeSection === 'sim' ? 'asg-on' : ''}`} onClick={() => setActiveSection('sim')}>🎮 Live Scaling Simulator</button>
        </div>
      </div>

      {/* Content Panels */}
      <div style={{ padding: '0 16px' }}>

        {/* CONCEPT & CAPACITY PANEL */}
        {activeSection === 'concept' && (
          <div>
            <div className="asg-sec">Auto Scaling Group Fleet Capacities</div>
            <div className="asg-g2" style={{ marginBottom: '12px' }}>
              <div className="asg-card" style={{ borderLeft: '3px solid #16a34a' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#16a34a' }}>📏 Key Capacity Boundaries</div>
                <div className="asg-kv"><span className="asg-kk">Minimum Capacity</span><b>Lowest server count (ASG will never shrink below this)</b></div>
                <div className="asg-kv"><span className="asg-kk">Desired Capacity</span><b>Current target size (ASG scales up/down to match this)</b></div>
                <div className="asg-kv"><span className="asg-kk">Maximum Capacity</span><b>Hard upper limit ceiling (Prevents run-away bill costs)</b></div>
                <div className="asg-kv"><span className="asg-kk">Launch Template</span><b>Fleet blueprints (AMI, Instance type, keys, user data scripts)</b></div>
              </div>

              <div className="asg-card" style={{ borderLeft: '3px solid #0369a1' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#0369a1' }}>Launch Templates vs Launch Configurations</div>
                <div className="asg-kv"><span className="asg-kk">Launch Configuration</span><b>Legacy blueprint system (Immutable; must recreate to change)</b></div>
                <div className="asg-kv"><span className="asg-kk">Launch Template</span><b style={{ color: '#16a34a' }}>Modern standard. Supports versions, parameter inheritance</b></div>
                <div className="asg-kv"><span className="asg-kk">Container Integration</span><b>Templates support dynamic ECS node mappings</b></div>
                <div className="asg-kv"><span className="asg-kk">Spot &amp; On-Demand</span><b>Templates support mixing purchase options in one ASG</b></div>
              </div>
            </div>

            <div className="asg-sec">ASG Auto-Recovery Playbook</div>
            <div className="asg-g2">
              <div>
                <div className="asg-card" style={{ borderLeft: '3px solid #c2410c' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: '#c2410c' }}>Self-Healing Detection Loop</div>
                  <div className="asg-kv"><span className="asg-kk" style={{ minWidth: '100px' }}>1. Diagnostic</span><b>Instance status checks fail or target group health fails</b></div>
                  <div className="asg-kv"><span className="asg-kk" style={{ minWidth: '100px' }}>2. Eviction</span><b>ASG marks node unhealthy, stopping listener routing flows</b></div>
                  <div className="asg-kv"><span className="asg-kk" style={{ minWidth: '100px' }}>3. Replacement</span><b>Terminates failed EC2, and launches brand new clone</b></div>
                  <div className="asg-kv"><span className="asg-kk" style={{ minWidth: '100px' }}>4. Cooldown</span><b>Wait ticks allow the new server to boot and register safely</b></div>
                </div>
              </div>

              <div>
                <div className="asg-card" style={{ borderLeft: '3px solid #7c3aed', minHeight: '130px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#7c3aed', marginBottom: '8px' }}>Key Benefits of ASG Fleet Management</div>
                  <ul className="asg-ck">
                    <li><b>High Availability:</b> Fleet automatically shifts nodes across AZ zones on data-center down.</li>
                    <li><b>Self-Healing Auto Recovery:</b> Unhealthy boxes are automatically replaced without operator work.</li>
                    <li><b>Optimized Costs:</b> Fleet shrinks automatically on weekends, paying only for compute needed.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MULTI-AZ ARCHITECTURE PANEL */}
        {activeSection === 'arch' && (
          <div>
            <div className="asg-sec">Interactive Multi-AZ Zonal Rebalancing & Scaling Simulator</div>
            
            {/* Scenario Navigation bar */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <button 
                className={`arch-scenario-btn ${archScenario === 'normal' ? 'active' : ''}`}
                onClick={() => setArchScenario('normal')}
              >
                🟢 Scenario 1: Normal Balanced Load
              </button>
              <button 
                className={`arch-scenario-btn ${archScenario === 'outage' ? 'active' : ''}`}
                onClick={() => setArchScenario('outage')}
              >
                🔴 Scenario 2: Zonal Outage & Rebalancing
              </button>
              <button 
                className={`arch-scenario-btn ${archScenario === 'surge' ? 'active' : ''}`}
                onClick={() => setArchScenario('surge')}
              >
                ⚡ Scenario 3: Scale-Out Peak Surge
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '16px', alignItems: 'start' }}>
              
              {/* Left: Dynamic Widescreen SVG Map */}
              <div className="asg-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#070a13', border: '0.5px solid var(--color-border-secondary)', padding: '16px' }}>
                <div style={{ alignSelf: 'flex-start', display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                    🔍 {archScenario === 'normal' ? 'Normal Fleet Mode' : archScenario === 'outage' ? 'AZ Disaster Recovery Mode' : 'High Performance Scale-Out Mode'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 'bold' }}>
                    ● LIVE SIMULATOR
                  </span>
                </div>

                <svg width="100%" viewBox="0 0 680 340" style={{ display: 'block', margin: '0 auto' }}>
                  <defs>
                    <marker id="arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L7,3 z" fill={archScenario === 'surge' ? '#f97316' : '#10b981'}/>
                    </marker>
                    <linearGradient id="g-green" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="g-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ea580c" /><stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                    <linearGradient id="g-red" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                    <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#10b981" floodOpacity="0.6"/>
                    </filter>
                    <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#f97316" floodOpacity="0.6"/>
                    </filter>
                    <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#dc2626" floodOpacity="0.6"/>
                    </filter>
                  </defs>
                  
                  {/* Outer VPC Boundary */}
                  <rect x="5" y="5" width="670" height="330" rx="16" fill="#0b0f19" stroke="#1e293b" strokeWidth="1"/>
                  <text x="25" y="24" fontSize="10" fill="#64748b" fontWeight="bold" fontFamily="monospace">VPC (10.0.0.0/16)</text>

                  {/* Users Node */}
                  <g className="active-glow-node" style={{ '--pulse-color': '#3b82f6' } as React.CSSProperties}>
                    <rect x="20" y="110" width="85" height="50" rx="8" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5"/>
                    <text x="62.5" y="132" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="bold">🌐 Public Users</text>
                    <text x="62.5" y="146" textAnchor="middle" fontSize="8.5" fill="#60a5fa" fontFamily="monospace">
                      {archScenario === 'surge' ? '1800 RPS (Peak)' : '400 RPS (Normal)'}
                    </text>
                  </g>

                  {/* ALB Node */}
                  <g opacity={1} className={archScenario !== 'outage' ? 'active-glow-node' : ''} style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                    <rect x="145" y="95" width="110" height="70" rx="10" fill="#0f172a" stroke="#10b981" strokeWidth={1.5} />
                    <text x="200" y="120" textAnchor="middle" fontSize="12" fill="#34d399" fontWeight="bold">ALB Load Balancer</text>
                    <text x="200" y="136" textAnchor="middle" fontSize="8" fill="#94a3b8">L7 Rules Router</text>
                    <text x="200" y="152" textAnchor="middle" fontSize="7.5" fill="#10b981" fontWeight="bold" fontFamily="monospace">
                      {archScenario === 'outage' ? 'Zonal Failover ON' : 'Subnet Load Balanced'}
                    </text>
                  </g>

                  {/* CloudWatch CPU Alarm Node */}
                  <g opacity={1} className={archScenario === 'surge' ? 'active-glow-node' : ''} style={{ '--pulse-color': '#ef4444' } as React.CSSProperties}>
                    <rect x="145" y="210" width="110" height="60" rx="10" fill="#0f172a" stroke={archScenario === 'surge' ? '#ef4444' : '#475569'} strokeWidth={1.5}/>
                    <text x="200" y="232" textAnchor="middle" fontSize="11" fill={archScenario === 'surge' ? '#fca5a5' : '#94a3b8'} fontWeight="bold">CloudWatch Alarm</text>
                    <text x="200" y="247" textAnchor="middle" fontSize="8.5" fill={archScenario === 'surge' ? '#ef4444' : '#64748b'} fontWeight="bold" fontFamily="monospace">
                      {archScenario === 'surge' ? '⚠️ CPU ALARM (>75%)' : '🟢 CPU OK (<50%)'}
                    </text>
                  </g>

                  {/* ASG Boundary */}
                  <rect 
                    x="295" y="30" width="365" height="290" rx="12" 
                    fill="#090d16" stroke="#10b981" strokeWidth="1.5" 
                    strokeDasharray="6,4" 
                    style={archScenario === 'surge' ? { filter: 'url(#glow-green)' } : {}}
                  />
                  <text x="477.5" y="46" textAnchor="middle" fontSize="11" fill="#34d399" fontWeight="bold">Auto Scaling Group (ASG Private Subnets)</text>

                  {/* Subnets Racks */}

                  {/* us-east-1a subnet */}
                  <g opacity={1}>
                    <rect x="310" y="55" width="335" height="75" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                    <text x="320" y="70" fontSize="8" fill="#64748b" fontWeight="bold" fontFamily="monospace">Subnet A: us-east-1a</text>
                    
                    {/* Instance i-101 */}
                    <g>
                      <rect x="350" y="76" width="90" height="42" rx="4" fill="#1e293b" stroke="#10b981" strokeWidth="1" />
                      <text x="395" y="93" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">🖥️ i-101</text>
                      <text x="395" y="107" textAnchor="middle" fontSize="8.5" fill="#34d399" fontFamily="monospace">In-Service (OK)</text>
                    </g>
                    
                    {/* Instance i-104 (Outage Replacement) or i-105 (Surge Instance) */}
                    {(archScenario === 'outage' || archScenario === 'surge') && (
                      <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                        <rect x="460" y="76" width="105" height="42" rx="4" fill="#1e293b" stroke="#10b981" strokeWidth="1" />
                        <text x="512.5" y="93" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">
                          {archScenario === 'outage' ? '🖥️ i-104 (New)' : '🖥️ i-105'}
                        </text>
                        <text x="512.5" y="107" textAnchor="middle" fontSize="8.5" fill="#f59e0b" fontWeight="bold" fontFamily="monospace">
                          {archScenario === 'outage' ? '🛡️ Zonal Rebalance' : '📈 Scale Out'}
                        </text>
                      </g>
                    )}
                  </g>

                  {/* us-east-1b subnet */}
                  <g opacity={1}>
                    <rect x="310" y="135" width="335" height="75" rx="6" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
                    <text x="320" y="150" fontSize="8" fill="#64748b" fontWeight="bold" fontFamily="monospace">Subnet B: us-east-1b</text>
                    
                    {/* Instance i-102 */}
                    <g>
                      <rect x="350" y="156" width="90" height="42" rx="4" fill="#1e293b" stroke="#10b981" strokeWidth="1" />
                      <text x="395" y="173" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">🖥️ i-102</text>
                      <text x="395" y="187" textAnchor="middle" fontSize="8.5" fill="#34d399" fontFamily="monospace">In-Service (OK)</text>
                    </g>

                    {/* Instance i-106 (Surge Only) */}
                    {archScenario === 'surge' && (
                      <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                        <rect x="460" y="156" width="105" height="42" rx="4" fill="#1e293b" stroke="#10b981" strokeWidth="1" />
                        <text x="512.5" y="173" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">🖥️ i-106</text>
                        <text x="512.5" y="187" textAnchor="middle" fontSize="8.5" fill="#f59e0b" fontWeight="bold" fontFamily="monospace">📈 Scale Out</text>
                      </g>
                    )}
                  </g>

                  {/* us-east-1c subnet */}
                  <g opacity={archScenario === 'outage' ? 0.7 : 1}>
                    <rect 
                      x="310" y="215" width="335" height="75" rx="6" 
                      fill={archScenario === 'outage' ? 'rgba(239, 68, 68, 0.05)' : '#0f172a'} 
                      stroke={archScenario === 'outage' ? '#ef4444' : '#1e293b'} 
                      strokeWidth={1} 
                      strokeDasharray={archScenario === 'outage' ? '4,4' : 'none'}
                    />
                    <text x="320" y="230" fontSize="8" fill={archScenario === 'outage' ? '#ef4444' : '#64748b'} fontWeight="bold" fontFamily="monospace">
                      {archScenario === 'outage' ? 'Subnet C: us-east-1c [🔥 OUTAGE]' : 'Subnet C: us-east-1c'}
                    </text>
                    
                    {/* Instance i-103 */}
                    {archScenario !== 'outage' ? (
                      <g>
                        <rect x="350" y="236" width="90" height="42" rx="4" fill="#1e293b" stroke="#10b981" strokeWidth="1" />
                        <text x="395" y="253" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">🖥️ i-103</text>
                        <text x="395" y="267" textAnchor="middle" fontSize="8.5" fill="#34d399" fontFamily="monospace">In-Service (OK)</text>
                      </g>
                    ) : (
                      <g>
                        {/* Outage representation */}
                        <rect x="350" y="236" width="90" height="42" rx="4" fill="#1a1118" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,2" />
                        <text x="395" y="253" textAnchor="middle" fontSize="10" fill="#ef4444" fontWeight="bold" style={{ textDecoration: 'line-through' }}>🖥️ i-103</text>
                        <text x="395" y="267" textAnchor="middle" fontSize="8" fill="#ef4444" fontWeight="bold" fontFamily="monospace">⚠️ UNREACHABLE</text>
                        <path d="M345 231 L445 283 M445 231 L345 283" stroke="#ef4444" strokeWidth="1.5" opacity="0.6"/>
                      </g>
                    )}

                    {/* Instance i-107 (Surge Only) */}
                    {archScenario === 'surge' && (
                      <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                        <rect x="460" y="236" width="105" height="42" rx="4" fill="#1e293b" stroke="#10b981" strokeWidth="1" />
                        <text x="512.5" y="253" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">🖥️ i-107</text>
                        <text x="512.5" y="282" textAnchor="middle" fontSize="8.5" fill="#f59e0b" fontWeight="bold" fontFamily="monospace">📈 Scale Out</text>
                      </g>
                    )}
                  </g>

                  {/* Flow Vector Tracer lines */}

                  {/* Users to ALB */}
                  <line 
                    x1="105" y1="135" x2="145" y2="135" 
                    stroke={archScenario === 'surge' ? '#f97316' : '#10b981'} 
                    strokeWidth={archScenario === 'surge' ? 3.5 : 2} 
                    className="flow-active-line" 
                  />

                  {/* ALB to Subnet A */}
                  <path 
                    d="M 255 130 Q 285 92 310 92" 
                    fill="none" 
                    stroke={archScenario === 'surge' ? '#f97316' : '#10b981'} 
                    strokeWidth={archScenario === 'surge' ? 2.5 : 1.5} 
                    className="flow-active-line" 
                  />

                  {/* ALB to Subnet B */}
                  <line 
                    x1="255" y1="130" x2="310" y2="172" 
                    stroke={archScenario === 'surge' ? '#f97316' : '#10b981'} 
                    strokeWidth={archScenario === 'surge' ? 2.5 : 1.5} 
                    className="flow-active-line" 
                  />

                  {/* ALB to Subnet C */}
                  <path 
                    d="M 255 130 Q 285 252 310 252" 
                    fill="none" 
                    stroke={archScenario === 'outage' ? '#ef4444' : archScenario === 'surge' ? '#f97316' : '#10b981'} 
                    strokeWidth={1.5} 
                    strokeDasharray={archScenario === 'outage' ? '3,3' : 'none'}
                    className={archScenario !== 'outage' ? 'flow-active-line' : ''} 
                  />

                  {/* CloudWatch telemetry lines (dashed CPU loads) */}
                  
                  {/* From Subnets back to CloudWatch */}
                  <path 
                    d="M 525 120 L 525 310 L 200 310 L 200 270" 
                    fill="none" 
                    stroke="#475569" 
                    strokeWidth="1" 
                    strokeDasharray="4,3" 
                    markerEnd="url(#arrow)"
                  />
                  <path 
                    d="M 200 210 L 200 165" 
                    fill="none" 
                    stroke={archScenario === 'surge' ? '#ef4444' : '#475569'} 
                    strokeWidth="1" 
                    strokeDasharray="4,3" 
                    markerEnd="url(#arrow)"
                  />
                </svg>
              </div>

              {/* Right: Dynamic Telemetry Cards & Explanations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Status Telemetry Card */}
                <div className="asg-card" style={{ borderLeft: '3px solid #10b981', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    📊 Simulation Telemetry
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
                    {archScenario === 'normal' && '🟢 Balanced Fleet Operation'}
                    {archScenario === 'outage' && '⚠️ Zonal Outage & Self-Healing'}
                    {archScenario === 'surge' && '⚡ High-Load Horizontal Scaling'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Active Subnets:</span>
                      <span style={{ fontWeight: 'bold', color: archScenario === 'outage' ? '#f87171' : '#34d399' }}>
                        {archScenario === 'outage' ? '2 / 3 Zones' : '3 / 3 Zones'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Total Instances:</span>
                      <span style={{ fontWeight: 'bold', color: '#fff' }}>
                        {archScenario === 'surge' ? '6 EC2 instances' : '3 EC2 instances'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Average CPU Load:</span>
                      <span style={{ fontWeight: 'bold', color: archScenario === 'surge' ? '#ef4444' : '#34d399' }}>
                        {archScenario === 'normal' && '38% (Healthy)'}
                        {archScenario === 'outage' && '57% (Healthy)'}
                        {archScenario === 'surge' && '88% (ALARM TRIGGERS)'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>ALB Target Group:</span>
                      <span style={{ fontWeight: 'bold', color: '#60a5fa' }}>
                        {archScenario === 'outage' ? 'us-east-1c evicted' : 'Active (All zones)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Scenario Description Card */}
                <div className="asg-card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>
                    ⚙️ Architectural Explanation
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    {archScenario === 'normal' && (
                      <span>
                        Under normal workloads, client traffic hits the **ALB**, which acts as the Layer 7 traffic controller. It delegates HTTP requests evenly across the three subnets. The ASG maintains exactly 1 instance per zone, providing **high availability** and zone independence.
                      </span>
                    )}
                    {archScenario === 'outage' && (
                      <span>
                        **Disaster recovery in action!** Subnet `us-east-1c` suffers an outage. The ALB immediately fails target group health checks for `i-103`, evicting it from the listener paths.
                        <br /><br />
                        Simultaneously, the ASG detects that the fleet size has dropped below the desired capacity of 3. It provisions a replacement instance `i-104` in the healthy zone `us-east-1a`, maintaining high availability despite zone loss!
                      </span>
                    )}
                    {archScenario === 'surge' && (
                      <span>
                        **Horizontal Scale-Out!** Heavy traffic (1800 RPS) causes average CPU to spike to **88%**. The CloudWatch metric exceeds the 75% target threshold, causing the **CloudWatch CPU Alarm** to trigger.
                        <br /><br />
                        The ASG responds to the alarm by increasing the **Desired Capacity** from 3 to 6. It launches 3 new servers (`i-105`, `i-106`, `i-107`) dynamically, spreading them evenly across all zones.
                      </span>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* SCALING POLICIES PANEL */}
        {activeSection === 'policies' && (
          <div>
            <div className="asg-sec">Fleet Auto-Scaling Policies</div>
            <div className="asg-g2" style={{ marginBottom: '10px' }}>
              <div className="asg-card">
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#16a34a' }}>1. Target Tracking (Recommended)</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
                  Keep average CPU load or RequestCountPerTarget strictly around a set target value (e.g., "Keep avg CPU at 50%"). ASG automatically scales size.
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Best for: standard predictable web traffic.</div>
              </div>

              <div className="asg-card">
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#0369a1' }}>2. Step Scaling (Threshold Blocks)</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
                  Scale out or in based on explicit threshold steps (e.g., "If CPU &gt; 70% add 2 nodes, if CPU &gt; 85% add 4 nodes").
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Best for: sharp, spiky, sudden traffic surges.</div>
              </div>
            </div>

            <div className="asg-g2" style={{ marginBottom: '12px' }}>
              <div className="asg-card">
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#7c3aed' }}>3. Scheduled Scaling</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
                  Add capacity based on known schedules (e.g., "Every weekday morning at 8:30 AM scale out to 10 instances").
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Best for: highly predictable business office hours.</div>
              </div>

              <div className="asg-card">
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#c2410c' }}>4. Predictive Scaling</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '8px' }}>
                  Uses machine learning algorithms to scan historical traffic patterns and proactively scale out *before* spikes hit.
                </div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>Best for: applications with regular cyclical usage.</div>
              </div>
            </div>

            <div className="asg-sec">Provisioning Scaling Policies (Terraform HCL)</div>
            <div className="asg-card">
              <div style={{ fontWeight: 600, fontSize: '12px', color: '#16a34a', marginBottom: '6px' }}>Target Tracking Scaling Policy: Target Average CPU = 50%</div>
              <pre className="asg-log" style={{ fontSize: '11px' }}>{`resource "aws_autoscaling_policy" "cpu_target_tracking" {
  name                   = "cpu-50-percent-target-tracking"
  autoscaling_group_name = aws_autoscaling_group.production_asg.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 50.0  # Keep average fleet CPU utilization at 50%
  }
}`}</pre>
            </div>
          </div>
        )}

        {/* HEALTH & LIFECYCLE PANEL */}
        {activeSection === 'health' && (
          <div>
            <div className="asg-sec">Interactive EC2 Instance Lifecycle Hook Sandbox</div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '16px', alignItems: 'start' }}>
              
              {/* Left Column: Widescreen SVG Diagram & Monospace Event Logs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Widescreen Interactive Lifecycle SVG */}
                <div className="asg-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#070a13', border: '0.5px solid var(--color-border-secondary)', padding: '16px' }}>
                  <div style={{ alignSelf: 'flex-start', display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                      📍 State-Responsive Lifecycle Transitions Map
                    </span>
                    <span style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 'bold' }}>
                      ● ACTIVE NODE
                    </span>
                  </div>

                  <svg width="100%" viewBox="0 0 680 160" style={{ display: 'block', margin: '0 auto' }}>
                    <defs>
                      <marker id="m-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#475569"/>
                      </marker>
                      <marker id="m-arrow-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L0,6 L6,3 z" fill="#10b981"/>
                      </marker>
                    </defs>

                    {/* Step 1: Pending:Launch */}
                    <g opacity={lifecycleStage === 'pending_launch' ? 1 : 0.65} className={lifecycleStage === 'pending_launch' ? 'active-glow-node' : ''} style={{ '--pulse-color': '#f97316' } as React.CSSProperties}>
                      <rect x="15" y="45" width="105" height="52" rx="8" fill="#0f172a" stroke={lifecycleStage === 'pending_launch' ? '#f97316' : '#334155'} strokeWidth={lifecycleStage === 'pending_launch' ? 2 : 1}/>
                      <text x="67.5" y="69" textAnchor="middle" fontSize="10.5" fill="#fff" fontWeight="bold">Pending:Launch</text>
                      <text x="67.5" y="83" textAnchor="middle" fontSize="8" fill="#94a3b8">EC2 Provisioning...</text>
                    </g>

                    {/* Connecting 1 -> 2 */}
                    <line 
                      x1="120" y1="71" x2="147" y2="71" 
                      stroke={lifecycleStage === 'pending_wait' ? '#10b981' : '#334155'} 
                      strokeWidth={lifecycleStage === 'pending_wait' ? 2 : 1} 
                      className={lifecycleStage === 'pending_wait' ? 'flow-active-line' : ''}
                      markerEnd={lifecycleStage === 'pending_wait' ? 'url(#m-arrow-active)' : 'url(#m-arrow)'}
                    />

                    {/* Step 2: Pending:Wait (Hook) */}
                    <g opacity={lifecycleStage === 'pending_wait' ? 1 : 0.65} className={lifecycleStage === 'pending_wait' ? 'active-glow-node' : ''} style={{ '--pulse-color': '#7c3aed' } as React.CSSProperties}>
                      <rect x="150" y="45" width="115" height="52" rx="8" fill="#0f172a" stroke={lifecycleStage === 'pending_wait' ? '#7c3aed' : '#334155'} strokeWidth={lifecycleStage === 'pending_wait' ? 2 : 1}/>
                      <text x="207.5" y="69" textAnchor="middle" fontSize="10.5" fill="#c4b5fd" fontWeight="bold">Pending:Wait</text>
                      <text x="207.5" y="83" textAnchor="middle" fontSize="8.5" fill={launchHookApproved ? '#34d399' : '#a78bfa'} fontWeight="bold">
                        {launchHookApproved ? '✓ Hook Approved' : '⏳ Launch Hook Active'}
                      </text>
                    </g>

                    {/* Connecting 2 -> 3 */}
                    <line 
                      x1="265" y1="71" x2="292" y2="71" 
                      stroke={lifecycleStage === 'inservice' ? '#10b981' : '#334155'} 
                      strokeWidth={lifecycleStage === 'inservice' ? 2 : 1} 
                      className={lifecycleStage === 'inservice' ? 'flow-active-line' : ''}
                      markerEnd={lifecycleStage === 'inservice' ? 'url(#m-arrow-active)' : 'url(#m-arrow)'}
                    />

                    {/* Step 3: InService */}
                    <g 
                      opacity={lifecycleStage === 'inservice' ? 1 : 0.65} 
                      className={lifecycleStage === 'inservice' ? 'active-glow-node' : ''} 
                      style={{ '--pulse-color': sandboxFailed ? '#ef4444' : '#10b981' } as React.CSSProperties}
                    >
                      <rect 
                        x="295" y="45" width="110" height="52" rx="8" 
                        fill="#0f172a" 
                        stroke={lifecycleStage === 'inservice' ? (sandboxFailed ? '#ef4444' : '#10b981') : '#334155'} 
                        strokeWidth={lifecycleStage === 'inservice' ? 2 : 1}
                      />
                      <text x="350" y="69" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="bold">🖥️ InService</text>
                      <text x="350" y="83" textAnchor="middle" fontSize="8.5" fill={sandboxFailed ? '#f87171' : '#34d399'} fontWeight="bold">
                        {sandboxFailed ? '💥 App Crashed!' : '🟢 Serving Traffic'}
                      </text>
                    </g>

                    {/* Connecting 3 -> 4 */}
                    <line 
                      x1="405" y1="71" x2="432" y2="71" 
                      stroke={lifecycleStage === 'terminating_wait' ? '#ef4444' : '#334155'} 
                      strokeWidth={lifecycleStage === 'terminating_wait' ? 2 : 1} 
                      className={lifecycleStage === 'terminating_wait' ? 'flow-active-line' : ''}
                      markerEnd={lifecycleStage === 'terminating_wait' ? 'url(#m-arrow-active)' : 'url(#m-arrow)'}
                    />

                    {/* Step 4: Terminating:Wait (Hook) */}
                    <g opacity={lifecycleStage === 'terminating_wait' ? 1 : 0.65} className={lifecycleStage === 'terminating_wait' ? 'active-glow-node' : ''} style={{ '--pulse-color': '#0284c7' } as React.CSSProperties}>
                      <rect x="435" y="45" width="125" height="52" rx="8" fill="#0f172a" stroke={lifecycleStage === 'terminating_wait' ? '#0284c7' : '#334155'} strokeWidth={lifecycleStage === 'terminating_wait' ? 2 : 1}/>
                      <text x="497.5" y="69" textAnchor="middle" fontSize="10.5" fill="#bae6fd" fontWeight="bold">Terminating:Wait</text>
                      <text x="497.5" y="83" textAnchor="middle" fontSize="8.5" fill={terminateHookApproved ? '#34d399' : '#38bdf8'} fontWeight="bold">
                        {terminateHookApproved ? '✓ Drained (Ready)' : '⏳ Draining active'}
                      </text>
                    </g>

                    {/* Connecting 4 -> 5 */}
                    <line 
                      x1="560" y1="71" x2="587" y2="71" 
                      stroke={lifecycleStage === 'terminated' ? '#ef4444' : '#334155'} 
                      strokeWidth={lifecycleStage === 'terminated' ? 2 : 1} 
                      className={lifecycleStage === 'terminated' ? 'flow-active-line' : ''}
                      markerEnd={lifecycleStage === 'terminated' ? 'url(#m-arrow-active)' : 'url(#m-arrow)'}
                    />

                    {/* Step 5: Terminated */}
                    <g opacity={lifecycleStage === 'terminated' ? 1 : 0.65} className={lifecycleStage === 'terminated' ? 'active-glow-node' : ''} style={{ '--pulse-color': '#ef4444' } as React.CSSProperties}>
                      <rect x="590" y="45" width="80" height="52" rx="8" fill="#0f172a" stroke={lifecycleStage === 'terminated' ? '#ef4444' : '#334155'} strokeWidth={lifecycleStage === 'terminated' ? 2 : 1}/>
                      <text x="630" y="70" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="bold">Terminated</text>
                      <text x="630" y="83" textAnchor="middle" fontSize="8" fill="#f87171">Offlined</text>
                    </g>

                    {/* Back loop arrow from 3 to 4 */}
                    {sandboxFailed && (
                      <path 
                        d="M 350 97 Q 425 135 497.5 97" 
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="1.5" 
                        strokeDasharray="4,2" 
                        markerEnd="url(#m-arrow-active)"
                        className="flow-active-line"
                      />
                    )}
                  </svg>
                </div>

                {/* Sandbox terminal log */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                    📟 Lifecycle Sandbox Event Terminal
                  </div>
                  <div className="asg-log" style={{ minHeight: '120px', maxHeight: '180px', overflowY: 'auto' }}>
                    {lifecycleLogs.map((entry, idx) => (
                      <div key={idx} style={{ marginBottom: idx === lifecycleLogs.length - 1 ? 0 : 5 }}>
                        {entry}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Actions Control panel & explanations */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Actions HUD */}
                <div className="asg-card" style={{ borderLeft: '3px solid #7c3aed', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    ⚡ Sandbox Controller
                  </div>
                  
                  {/* Current State Details Badge */}
                  <div style={{ padding: '8px 10px', borderRadius: '6px', background: '#0f172a', border: '1px solid #1e293b', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px', color: '#64748b', display: 'block' }}>Current Stage:</span>
                    <span style={{ 
                      fontWeight: 'bold', 
                      fontSize: '12px',
                      color: 
                        lifecycleStage === 'pending_launch' ? '#f97316' : 
                        lifecycleStage === 'pending_wait' ? '#c4b5fd' : 
                        lifecycleStage === 'inservice' ? (sandboxFailed ? '#ef4444' : '#34d399') : 
                        lifecycleStage === 'terminating_wait' ? '#bae6fd' : '#fca5a5'
                    }}>
                      {lifecycleStage === 'pending_launch' && '🟠 Pending:Launch'}
                      {lifecycleStage === 'pending_wait' && '🟣 Pending:Wait (Hook)'}
                      {lifecycleStage === 'inservice' && (sandboxFailed ? '🔴 Unhealthy Service' : '🟢 InService (ALB Routing)')}
                      {lifecycleStage === 'terminating_wait' && '🔵 Terminating:Wait (Hook)'}
                      {lifecycleStage === 'terminated' && '⚫ Terminated'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button 
                      className="asg-btn asg-on" 
                      onClick={() => {
                        if (lifecycleStage === 'pending_launch') {
                          setLifecycleStage('pending_wait');
                          setLaunchHookApproved(false);
                          logLifecycle('🚀 Hardware provisioned! i-09941a entered [Pending:Wait] state. Lifecycle Hook triggered.');
                        } else if (lifecycleStage === 'pending_wait') {
                          if (!launchHookApproved) {
                            logLifecycle('❌ TRANSITION BLOCKED: Instance is suspended at launch boundary. Trigger lifecycle approval to proceed.');
                            return;
                          }
                          setLifecycleStage('inservice');
                          setSandboxFailed(false);
                          logLifecycle('🟢 Launch lifecycle hook complete! Target registered with ALB. Instance is now [InService] and receiving production requests.');
                        } else if (lifecycleStage === 'inservice') {
                          setLifecycleStage('terminating_wait');
                          setTerminateHookApproved(false);
                          logLifecycle('⚠️ Connection draining triggered! Instance i-09941a entered scale-in phase [Terminating:Wait].');
                        } else if (lifecycleStage === 'terminating_wait') {
                          if (!terminateHookApproved) {
                            logLifecycle('❌ TRANSITION BLOCKED: Teardown hook active. Trigger connection drain approval to proceed.');
                            return;
                          }
                          setLifecycleStage('terminated');
                          logLifecycle('💀 Terminate hook complete! i-09941a offlined, EBS volumes detached, ENI released. Instance is [Terminated].');
                        } else if (lifecycleStage === 'terminated') {
                          setLifecycleStage('pending_launch');
                          setLaunchHookApproved(false);
                          setTerminateHookApproved(false);
                          setSandboxFailed(false);
                          logLifecycle('🔄 Sandbox reset. Launching new target provision workflow.');
                        }
                      }}
                      style={{ fontSize: '11.5px', padding: '7px' }}
                    >
                      {lifecycleStage === 'terminated' ? '🔄 Reset Sandbox' : '⏭ Trigger Next Transition'}
                    </button>

                    {/* Launch Lifecycle hook Approval */}
                    {lifecycleStage === 'pending_wait' && (
                      <button 
                        className="asg-btn" 
                        onClick={() => {
                          setLaunchHookApproved(true);
                          logLifecycle('✅ [Lambda callback] Launch Lifecycle Hook APPROVED! Signal sent: CONTINUE. Fleet manager registering target with ALB.');
                        }}
                        style={{ borderColor: '#22c55e', color: '#22c55e', fontSize: '11.5px', padding: '7px' }}
                        disabled={launchHookApproved}
                      >
                        {launchHookApproved ? '✓ Launch Hook Approved' : '🟢 Approve Launch Hook'}
                      </button>
                    )}

                    {/* Terminate Lifecycle hook Approval */}
                    {lifecycleStage === 'terminating_wait' && (
                      <button 
                        className="asg-btn" 
                        onClick={() => {
                          setTerminateHookApproved(true);
                          logLifecycle('✅ [Lambda callback] Connection Draining COMPLETE! Log backups sent. Signal sent: CONTINUE.');
                        }}
                        style={{ borderColor: '#38bdf8', color: '#38bdf8', fontSize: '11.5px', padding: '7px' }}
                        disabled={terminateHookApproved}
                      >
                        {terminateHookApproved ? '✓ Draining Hook Approved' : '🔵 Complete Connection Drain'}
                      </button>
                    )}

                    {/* Failure Injection */}
                    {lifecycleStage === 'inservice' && !sandboxFailed && (
                      <button 
                        className="asg-btn" 
                        onClick={() => {
                          setSandboxFailed(true);
                          logLifecycle('💥 CRITICAL APP CRASH: i-09941a suffered a core process failure. ALB health check returned HTTP 502 Bad Gateway.');
                          setTimeout(() => {
                            setLifecycleStage('terminating_wait');
                            setTerminateHookApproved(false);
                            logLifecycle('🚨 ASG Self-Healing Active: Evicting crashed node. Transitioning state to [Terminating:Wait] for connection draining.');
                          }, 2000);
                        }}
                        style={{ borderColor: '#ef4444', color: '#ef4444', fontSize: '11.5px', padding: '7px' }}
                      >
                        💥 Inject App Crash (Self-Heal)
                      </button>
                    )}
                  </div>
                </div>

                {/* Explanation Card */}
                <div className="asg-card" style={{ padding: '12px 14px', fontSize: '11px', lineHeight: '1.4', color: 'var(--color-text-secondary)' }}>
                  <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>🛡️ Stage Description</div>
                  {lifecycleStage === 'pending_launch' && 'Instance provisioning starts. AWS reads the Launch Template DNA and starts allocating hardware resources.'}
                  {lifecycleStage === 'pending_wait' && 'The boot process is paused. Custom EventBridge configurations/Lambda functions run heavy boots, caching data before letting client traffic hit the server.'}
                  {lifecycleStage === 'inservice' && 'Target registered and healthy behind the ALB. Production HTTP requests flow happily. Click the app crash button to watch the ASG self-heal!'}
                  {lifecycleStage === 'terminating_wait' && 'Instance scale-in has begun. Connection draining allows existing requests to complete peacefully, while backup scripts upload local logs.'}
                  {lifecycleStage === 'terminated' && 'Instance destroyed. All allocated ENIs and EBS volumes are released and de-allocated, completely stopping billing charges.'}
                </div>

              </div>

            </div>

            {/* Mnemonic Memory Cards */}
            <div className="asg-sec" style={{ marginTop: '16px', marginBottom: '8px' }}>🧠 Premium Systems Mnemonics</div>
            <div className="asg-g3">
              
              <div className="mnemonic-gcard">
                <div className="mnemonic-gcard-title">📝 Launch Template = "The DNA Blueprint"</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  An immutable, version-controlled layout containing everything an EC2 instance needs to exist (AMI ID, instance type, security group rules, and userData startup scripts). Just like cell DNA, it cannot be modified post-launch; you must iterate a new template version to evolve!
                </div>
              </div>

              <div className="mnemonic-gcard">
                <div className="mnemonic-gcard-title">🛡️ Lifecycle Hook = "The Border Customs checkpoint"</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  Suspends the instance at entering (`Pending:Wait`) or leaving (`Terminating:Wait`) state boundaries. Traffic registration is blocked until external integrations complete boot configuration, data prep, or logs backup, then send a `CONTINUE` signal.
                </div>
              </div>

              <div className="mnemonic-gcard">
                <div className="mnemonic-gcard-title">🧯 Connection Draining = "The Last Call at the Table"</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  When scaling in, new client reservations are immediately blocked at the door, but currently seated active connections are granted a grace period (drain timeout) to finish chewing and digest their requests safely before the server is shut down!
                </div>
              </div>

            </div>
          </div>
        )}

        {/* LIVE SIMULATION PLAYGROUND */}
        {activeSection === 'sim' && (
          <div>
            <div className="asg-sec">Live Simulation (ASG + Load Balancer Auto Scaling)</div>
            <div className="asg-card">
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
                This simulator demonstrates target tracking scaling in real-time. Drag traffic (RPS) up to overload servers and trigger scale-outs, or fail nodes to watch ASG self-heal!
              </div>

              {/* Range inputs */}
              <div className="asg-g2" style={{ marginBottom: '12px' }}>
                <div style={{ background: 'var(--color-background-secondary)', padding: '10px 12px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Incoming Traffic: <b>{rps} RPS</b></label>
                  <input
                    type="range"
                    min="0"
                    max="1800"
                    value={rps}
                    onChange={(e) => setRps(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#16a34a', cursor: 'ew-resize' }}
                  />
                </div>

                <div style={{ background: 'var(--color-background-secondary)', padding: '10px 12px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Target CPU Limit: <b>{targetCpu}%</b></label>
                  <input
                    type="range"
                    min="20"
                    max="80"
                    value={targetCpu}
                    onChange={(e) => setTargetCpu(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#16a34a', cursor: 'ew-resize' }}
                  />
                </div>
              </div>

              <div className="asg-g2" style={{ marginBottom: '14px' }}>
                <div style={{ background: 'var(--color-background-secondary)', padding: '10px 12px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>ASG Boundaries (Min / Desired / Max Capacity):</label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Min:</span>
                    <input
                      type="number"
                      value={minCap}
                      min="0"
                      max="30"
                      onChange={(e) => setMinCap(parseInt(e.target.value))}
                      style={{ width: '56px', fontSize: '11px', padding: '4px 6px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}
                    />
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Desired:</span>
                    <input
                      type="number"
                      value={desCap}
                      min="0"
                      max="30"
                      onChange={(e) => setDesCap(parseInt(e.target.value))}
                      style={{ width: '56px', fontSize: '11px', padding: '4px 6px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}
                    />
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)' }}>Max:</span>
                    <input
                      type="number"
                      value={maxCap}
                      min="0"
                      max="50"
                      onChange={(e) => setMaxCap(parseInt(e.target.value))}
                      style={{ width: '56px', fontSize: '11px', padding: '4px 6px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ background: 'var(--color-background-secondary)', padding: '10px 12px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Instance Max Capacity: <b>{capPer} RPS</b></label>
                  <input
                    type="range"
                    min="50"
                    max="400"
                    value={capPer}
                    onChange={(e) => setCapPer(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#16a34a', cursor: 'ew-resize' }}
                  />
                </div>
              </div>

              {/* KPIs */}
              <div className="asg-g3" style={{ marginBottom: '14px' }}>
                <div className="asg-met">
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Healthy instances</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#16a34a' }}>{metrics.n}</div>
                </div>
                <div className="asg-met">
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Avg CPU Utilization</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: metrics.avgCpu > targetCpu + 8 ? '#c2410c' : '#15803d' }}>{Math.round(metrics.avgCpu)}%</div>
                </div>
                <div className="asg-met">
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>RPS per target</div>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#0369a1' }}>{metrics.n ? Math.round(metrics.rpt) : '∞'}</div>
                </div>
              </div>

              {/* Play buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px', borderBottom: '0.5px solid var(--color-border-secondary)', paddingBottom: '12px' }}>
                <button className="asg-btn asg-on" onClick={isRunning ? pause : start}>{isRunning ? 'Pause ⏸' : 'Start ▶'}</button>
                <button className="asg-btn" onClick={stepOnce}>Step ⏭</button>
                <button className="asg-btn" onClick={resetSim}>Reset 🔄</button>
                <button className="asg-btn" onClick={injectFailure}>Fail one node 💥</button>
                <button className="asg-btn" onClick={toggleDrain}>Draining: {drainingEnabled ? 'ON 🧯' : 'OFF 🚫'}</button>
              </div>

              {/* Instances display */}
              <div style={{ margin: '12px 0 6px', fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Active Compute Fleet instances behind Load Balancer:</div>
              <div className="asg-instances" style={{ marginBottom: '14px' }}>
                {instances.filter((i) => i.status !== 'terminated').slice(0, 12).map((inst) => {
                  const klass = inst.failed ? 'asg-inst asg-down' : inst.status === 'ok' ? 'asg-inst asg-ok' : inst.status === 'warm' ? 'asg-inst asg-warm' : inst.status === 'drain' ? 'asg-inst asg-drain' : 'asg-inst';
                  const meta = inst.status === 'warm'
                    ? `booting (${inst.warmTicks}t)`
                    : inst.status === 'drain'
                      ? `draining (${inst.drainTicks}t)`
                      : inst.failed
                        ? 'failed'
                        : inst.healthy
                          ? 'healthy'
                          : 'not-ready';
                  return (
                    <div key={inst.id} className={klass}>
                      <div className="name">i-{inst.id}</div>
                      <div className="meta">{inst.status}<br />{meta}</div>
                    </div>
                  );
                })}
                {Array.from({ length: Math.max(0, 12 - instances.filter((i) => i.status !== 'terminated').length) }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="asg-inst" style={{ opacity: 0.35 }}>
                    <div className="name">—</div>
                    <div className="meta">empty</div>
                  </div>
                ))}
              </div>

              {/* Logs */}
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>ASG Activity Event log:</div>
              <div className="asg-log" style={{ minHeight: '120px', maxHeight: '180px', overflowY: 'auto' }}>
                {logs.map((entry, idx) => (
                  <div key={idx} style={{ marginBottom: idx === logs.length - 1 ? 0 : 5 }} dangerouslySetInnerHTML={{ __html: entry }} />
                ))}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
