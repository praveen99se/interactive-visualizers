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
            <div className="asg-sec">Multi-AZ Subnet Fleet Architecture</div>
            <div className="asg-card">
              <svg width="100%" viewBox="0 0 680 340" style={{ display: 'block', margin: '0 auto' }}>
                <defs>
                  <marker id="arrow" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#16a34a"/></marker>
                </defs>
                
                <rect x="10" y="10" width="660" height="320" rx="16" fill="var(--color-background-secondary)" stroke="var(--color-border-secondary)" strokeWidth="0.5"/>
                <text x="340" y="28" text-anchor="middle" fontSize="12" fill="var(--color-text-primary)" fontWeight="500">Multi-Availability Zone Fleet Architecture with ALB</text>

                {/* Users */}
                <rect x="25" y="110" width="100" height="44" rx="10" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
                <text x="75" y="130" text-anchor="middle" fontSize="11" fill="#dc2626" fontWeight="500">🌐 Users</text>
                <text x="75" y="146" text-anchor="middle" fontSize="9" fill="#dc2626">Public clients</text>

                {/* ALB */}
                <rect x="160" y="100" width="130" height="64" rx="12" fill="#eff6ff" stroke="#2563eb" strokeWidth="0.5"/>
                <text x="225" y="124" text-anchor="middle" fontSize="12" fill="#1d4ed8" fontWeight="bold">ALB Load Balancer</text>
                <text x="225" y="142" text-anchor="middle" fontSize="9" fill="#1d4ed8">Health-based Routing</text>

                {/* ASG Boundary */}
                <rect x="330" y="50" width="310" height="260" rx="16" fill="var(--color-background-primary)" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="5,3"/>
                <text x="485" y="70" text-anchor="middle" fontSize="11" fill="#166534" fontWeight="bold">Auto Scaling Group (VPC Private Subnets)</text>
                <text x="485" y="85" text-anchor="middle" fontSize="9" fill="#166534">Spanning us-east-1a, 1b, and 1c subnets</text>

                {/* Zones EC2s */}
                <rect x="350" y="105" width="270" height="40" rx="6" fill="#dcfce7" stroke="#16a34a" strokeWidth="0.5"/>
                <text x="485" y="128" text-anchor="middle" fontSize="10" fill="#15803d" fontWeight="bold">EC2 Target A — us-east-1a Subnet</text>

                <rect x="350" y="155" width="270" height="40" rx="6" fill="#dcfce7" stroke="#16a34a" strokeWidth="0.5"/>
                <text x="485" y="178" text-anchor="middle" fontSize="10" fill="#15803d" fontWeight="bold">EC2 Target B — us-east-1b Subnet</text>

                <rect x="350" y="205" width="270" height="40" rx="6" fill="#dcfce7" stroke="#16a34a" strokeWidth="0.5"/>
                <text x="485" y="228" text-anchor="middle" fontSize="10" fill="#15803d" fontWeight="bold">EC2 Target C — us-east-1c Subnet</text>

                {/* Cloudwatch */}
                <rect x="160" y="220" width="130" height="52" rx="10" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5"/>
                <text x="225" y="240" text-anchor="middle" fontSize="11" fill="#c2410c" fontWeight="bold">CloudWatch Alarm</text>
                <text x="225" y="258" text-anchor="middle" fontSize="9" fill="#c2410c">Monitors average CPU</text>

                {/* Paths */}
                <line x1="125" y1="132" x2="156" y2="132" stroke="#6b7280" strokeWidth="1" markerEnd="url(#arrow)"/>
                <line x1="290" y1="132" x2="326" y2="132" stroke="#16a34a" strokeWidth="1.5" markerEnd="url(#arrow)"/>
                
                <path d="M485 248 L485 285 L320 285 M320 285 L225 285 L225 276" fill="none" stroke="#c2410c" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#arrow)"/>
                <path d="M160 246 L140 246 L140 280 L326 280" fill="none" stroke="#16a34a" strokeWidth="1" markerEnd="url(#arrow)"/>

                <text x="340" y="318" text-anchor="middle" fontSize="9" fill="var(--color-text-secondary)">Solid Lines = Traffic / Provisioning | Dashed Lines = CloudWatch CPU Load metrics feed</text>
              </svg>
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
            <div className="asg-sec">Instance Lifecycle Hooks</div>
            <div className="asg-card">
              <svg width="100%" viewBox="0 0 680 240" style={{ display: 'block', margin: '0 auto' }}>
                <defs>
                  <marker id="m3" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#16a34a"/></marker>
                </defs>
                <rect x="10" y="60" width="100" height="48" rx="8" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5"/>
                <text x="60" y="84" textAnchor="middle" fontSize="10" fill="#c2410c" fontWeight="bold">Pending:Launch</text>
                <text x="60" y="96" text-anchor="middle" fontSize="8" fill="#7c2d12">Warming up...</text>

                <rect x="145" y="60" width="120" height="48" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="1"/>
                <text x="205" y="84" text-anchor="middle" fontSize="10" fill="#7c3aed" fontWeight="bold">Pending:Wait</text>
                <text x="205" y="96" text-anchor="middle" fontSize="8" fill="#6d28d9">(Lifecycle Hook)</text>

                <rect x="295" y="60" width="100" height="48" rx="8" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                <text x="345" y="84" text-anchor="middle" fontSize="10" fill="#15803d" fontWeight="bold">InService</text>
                <text x="345" y="96" text-anchor="middle" fontSize="8" fill="#166534">Receives Traffic</text>

                <rect x="425" y="60" width="100" height="48" rx="8" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                <text x="475" y="84" text-anchor="middle" fontSize="10" fill="#1d4ed8" fontWeight="bold">Terminating:Wait</text>
                <text x="475" y="96" text-anchor="middle" fontSize="8" fill="#1e40af">Connection Draining</text>

                <rect x="555" y="60" width="100" height="48" rx="8" fill="#fee2e2" stroke="#fca5a5" strokeWidth="0.5"/>
                <text x="605" y="84" text-anchor="middle" fontSize="10" fill="#b91c1c" fontWeight="bold">Terminated</text>
                <text x="605" y="96" text-anchor="middle" fontSize="8" fill="#991b1b">Fully Offlined</text>

                {/* Connecting lines */}
                <line x1="110" y1="84" x2="141" y2="84" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#m3)"/>
                <line x1="265" y1="84" x2="291" y2="84" stroke="#16a34a" strokeWidth="1.5" markerEnd="url(#m3)"/>
                <line x1="395" y1="84" x2="421" y2="84" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#m3)"/>
                <line x1="525" y1="84" x2="551" y2="84" stroke="#6b7280" strokeWidth="1.5" markerEnd="url(#m3)"/>

                {/* Subtext info */}
                <rect x="110" y="130" width="460" height="80" rx="8" fill="var(--color-background-secondary)" stroke="var(--color-border-secondary)" strokeWidth="0.5"/>
                <text x="340" y="152" textAnchor="middle" fontSize="11" fill="var(--color-text-primary)" fontWeight="bold">What are Lifecycle Hooks used for?</text>
                <text x="340" y="174" textAnchor="middle" fontSize="9" fill="var(--color-text-secondary)">Pending:Wait — Run custom bootstrap scripts, bake container configurations, or pre-warm caches</text>
                <text x="340" y="194" textAnchor="middle" fontSize="9" fill="var(--color-text-secondary)">Terminating:Wait — Complete active web requests, drain connection state pools, or back up logs</text>
              </svg>
            </div>

            <div className="asg-g2">
              <div>
                <div className="asg-sec">EC2 status vs ELB Health checks</div>
                <div className="asg-card" style={{ borderLeft: '3px solid #16a34a', minHeight: '160px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#16a34a', marginBottom: '8px' }}>Target Group Health Checking</div>
                  <ul className="asg-ck">
                    <li><b>Hardware checks:</b> EC2 basic status check identifies absolute hardware hypervisor deaths.</li>
                    <li><b>Application checks:</b> ELB probes actual port/paths (e.g., `/health`) to verify if the app is frozen or dead.</li>
                    <li><b>Eviction rule:</b> Set ASG checks to include **ELB target checks** so crashed app instances are automatically recycled.</li>
                  </ul>
                </div>
              </div>

              <div>
                <div className="asg-sec">Termination Policies</div>
                <div className="asg-card" style={{ borderLeft: '3px solid #dc2626', minHeight: '160px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', color: '#dc2626', marginBottom: '8px' }}>Which target gets killed first on scale-in?</div>
                  <ul className="asg-ck">
                    <li><b>Oldest Configuration first:</b> Terminates instances launched with the oldest Launch Template version.</li>
                    <li><b>Oldest Instance next:</b> Kills the oldest active server next if configurations are identical.</li>
                    <li><b>Zonal Balance:</b> Selects the Availability Zone with the largest count of nodes to keep subnets balanced.</li>
                  </ul>
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
