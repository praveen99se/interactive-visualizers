import { useEffect, useRef, useState } from 'react';

type Inst = {
  id: number;
  status: 'warm' | 'ok' | 'drain' | 'terminated';
  warmTicks: number;
  healthy: boolean;
  draining: boolean;
  drainTicks: number;
  failed: boolean;
};

type SimState = {
  instances: Inst[];
  drainingEnabled: boolean;
  cooldown: number;
};

type Config = {
  rps: number;
  targetCpu: number;
  minCap: number;
  desCap: number;
  maxCap: number;
  capPer: number;
};

const makeInstance = (id: number): Inst => ({
  id,
  status: 'warm',
  warmTicks: 2,
  healthy: false,
  draining: false,
  drainTicks: 0,
  failed: false,
});

const initialSimState: SimState = {
  instances: [],
  drainingEnabled: true,
  cooldown: 0,
};

export default function ASGTab() {
  const [rps, setRps] = useState(300);
  const [targetCpu, setTargetCpu] = useState(50);
  const [minCap, setMinCap] = useState(2);
  const [desCap, setDesCap] = useState(3);
  const [maxCap, setMaxCap] = useState(12);
  const [capPer, setCapPer] = useState(200);

  const [instances, setInstances] = useState<Inst[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const simStateRef = useRef<SimState>(initialSimState);
  const configRef = useRef<Config>({ rps, targetCpu, minCap, desCap, maxCap, capPer });
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    configRef.current = { rps, targetCpu, minCap, desCap, maxCap, capPer };
  }, [rps, targetCpu, minCap, desCap, maxCap, capPer]);

  useEffect(() => {
    resetSim();
    return pause;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setLogs((prev) => [`${now()} — ${html}`, ...prev].slice(0, 200));
  };

  const ensureCapacity = (instances: Inst[], desired: number, drainingEnabled: boolean) => {
    const live = instances.filter((x) => x.status !== 'terminated');
    const out = [...instances];
    if (live.length < desired) {
      const add = desired - live.length;
      for (let k = 0; k < add; k++) {
        const id = out.length ? Math.max(...out.map((x) => x.id)) + 1 : 1;
        out.push(makeInstance(id));
        logLine(`<span class="badge binfo">Scale out</span> Launching instance i-${id} (warming up).`);
      }
    } else if (live.length > desired) {
      let remove = live.length - desired;
      const sorted = live.slice().sort((a, b) => a.id - b.id);
      for (const inst of sorted) {
        if (remove <= 0) break;
        if (inst.failed || inst.status === 'terminated') continue;
        const idx = out.findIndex((o) => o.id === inst.id);
        if (idx < 0) continue;
        if (drainingEnabled) {
          if (!out[idx].draining) {
            out[idx] = { ...out[idx], draining: true, drainTicks: 2, status: 'drain' };
            logLine(`<span class="badge bwarn">Scale in</span> i-${inst.id} set to <b>draining</b> (LB stops new requests, finishes in-flight).`);
            remove -= 1;
          }
        } else {
          out[idx] = { ...out[idx], status: 'terminated', healthy: false };
          logLine(`<span class="badge bbad">Scale in</span> i-${inst.id} terminated immediately (no drain).`);
          remove -= 1;
        }
      }
    }
    return out;
  };

  const applyWarmupAndDrain = (instances: Inst[]) => {
    return instances.map((inst) => {
      if (inst.status === 'warm') {
        const warmTicks = inst.warmTicks - 1;
        if (warmTicks <= 0) {
          logLine(`<span class="badge bok">Healthy</span> i-${inst.id} passed target group health check → now receives traffic.`);
          return { ...inst, status: 'ok', warmTicks: 0, healthy: true } as Inst;
        }
        return { ...inst, warmTicks } as Inst;
      }
      if (inst.status === 'drain') {
        const drainTicks = inst.drainTicks - 1;
        if (drainTicks <= 0) {
          logLine(`<span class="badge bwarn">Deregistered</span> i-${inst.id} drained → deregistered from target group → terminated.`);
          return { ...inst, status: 'terminated', healthy: false } as Inst;
        }
        return { ...inst, drainTicks } as Inst;
      }
      return inst;
    });
  };

  const distributeTraffic = (instances: Inst[], cfg: { rps: number; capPer: number }) => {
    const healthy = instances.filter((x) => x.status === 'ok' && x.healthy && !x.failed);
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
      logLine(`<span class="badge bbad">No targets</span> 0 healthy instances while RPS>0 → forcing desired=${desired}.`);
      simState.cooldown = 2;
      return desired;
    }

    if (metrics.avgCpu > cfg.targetCpu + 8 && desired < cfg.maxCap) {
      desired += 1;
      logLine(`<span class="badge binfo">Policy</span> Avg CPU ${Math.round(metrics.avgCpu)}% > target ${cfg.targetCpu}% → desired++ (${desired}).`);
      simState.cooldown = 2;
    } else if (metrics.avgCpu < cfg.targetCpu - 12 && desired > cfg.minCap) {
      desired -= 1;
      logLine(`<span class="badge bwarn">Policy</span> Avg CPU ${Math.round(metrics.avgCpu)}% < target ${cfg.targetCpu}% → desired-- (${desired}).`);
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
      logLine(`<span class="badge bbad">Replace</span> i-${failed.id} failed health check → ASG terminates & launches replacement.`);
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
    logLine(`<span class="badge binfo">Running</span> Simulation started.`);
    timerRef.current = window.setInterval(tick, 900);
  };

  const pause = () => {
    if (!timerRef.current) return;
    window.clearInterval(timerRef.current);
    timerRef.current = null;
    logLine(`<span class="badge bwarn">Paused</span> Simulation paused.`);
  };

  const stepOnce = () => {
    tick();
  };

  const resetSim = () => {
    pause();
    const initialInstances = Array.from({ length: desCap }, (_, index) => makeInstance(index + 1));
    simStateRef.current = { instances: initialInstances, drainingEnabled: true, cooldown: 0 };
    setInstances(initialInstances);
    setLogs(['Tip: raise RPS until avg CPU exceeds target to trigger scale-out.']);
  };

  const injectFailure = () => {
    const existing = simStateRef.current.instances.filter((x) => x.status === 'ok' && !x.failed);
    if (existing.length === 0) {
      logLine(`<span class="badge bbad">Failure</span> No healthy instances to fail.`);
      return;
    }
    const victim = existing[Math.floor(Math.random() * existing.length)];
    const nextInstances = simStateRef.current.instances.map((inst) =>
      inst.id === victim.id ? { ...inst, failed: true, healthy: false } : inst
    );
    simStateRef.current.instances = nextInstances;
    setInstances(nextInstances);
    logLine(`<span class="badge bbad">Failure</span> Injected failure into i-${victim.id} (ELB health check fails).`);
  };

  const toggleDrain = () => {
    simStateRef.current.drainingEnabled = !simStateRef.current.drainingEnabled;
    logLine(`<span class="badge binfo">Drain</span> Scale-in draining is now <b>${simStateRef.current.drainingEnabled ? 'ON' : 'OFF'}</b>.`);
  };

  const metrics = distributeTraffic(instances, { rps, capPer });

  return (
    <div>
      <style>{`
        .controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-bottom:10px}
        .ctrl{background:var(--color-background-secondary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md);padding:10px 12px}
        .ctrl label{display:block;font-size:12px;color:var(--color-text-secondary);margin-bottom:6px}
        .out{font-size:12px;color:var(--color-text-secondary);margin-top:6px}
        .mono{font-family:var(--font-mono)}
        .btnbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
        button{font-size:12px;padding:6px 10px;border-radius:8px;border:0.5px solid var(--color-border-tertiary);background:var(--color-background-primary);cursor:pointer}
        button.primary{background:var(--color-text-info);border-color:var(--color-text-info);color:#fff}
        .kpi{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:10px}
        .k{background:var(--color-background-secondary);border-radius:var(--border-radius-md);padding:10px}
        .k .t{font-size:11px;color:var(--color-text-tertiary);margin-bottom:2px}
        .k .v{font-size:18px;font-weight:500}
        .instances{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px;margin-top:10px}
        .inst{border-radius:10px;border:1.5px solid var(--color-border-tertiary);padding:8px 8px;text-align:center;background:var(--color-background-secondary)}
        .inst .name{font-size:11px;font-weight:500;margin-bottom:4px}
        .inst .meta{font-size:10px;color:var(--color-text-tertiary);line-height:1.4}
        .inst.ok{border-color:#16a34a;background:#dcfce7}
        .inst.warm{border-color:#b45309;background:#fef3c7}
        .inst.drain{border-color:#1d4ed8;background:#dbeafe}
        .inst.down{border-color:#dc2626;background:#fee2e2;opacity:.75}
        .card{background:var(--color-background-secondary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md);padding:10px 12px}
        .lbl{font-size:11px;color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
        .log{background:var(--color-background-secondary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md);padding:10px 12px;font-size:11px;color:var(--color-text-secondary);line-height:1.65;min-height:86px;margin-top:10px}
        .small{font-size:11px;color:var(--color-text-tertiary);line-height:1.6}
      `}</style>

      <div className="h">Live simulation (ASG + Load Balancer)</div>
      <div className="sub">This is a simplified model: each instance has a fixed “capacity” (RPS). LB distributes evenly across healthy instances. ASG uses a target-tracking-like rule: if average “CPU” stays above target → scale out; if below → scale in.</div>

      <div className="controls">
        <div className="ctrl">
          <label>Incoming traffic (RPS)</label>
          <input type="range" min={0} max={1800} value={rps} onChange={(e) => setRps(Number(e.target.value))} style={{ width: '100%' }} />
          <div className="out">RPS: <span className="mono">{rps}</span></div>
        </div>
        <div className="ctrl">
          <label>Target CPU (%)</label>
          <input type="range" min={20} max={80} value={targetCpu} onChange={(e) => setTargetCpu(Number(e.target.value))} style={{ width: '100%' }} />
          <div className="out">Target: <span className="mono">{targetCpu}</span>%</div>
        </div>

        <div className="ctrl">
          <label>ASG capacity (min / desired / max)</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="mono">min</span><input type="number" value={minCap} min={0} max={30} onChange={(e) => setMinCap(Number(e.target.value))} style={{ width: 64 }} />
            <span className="mono">desired</span><input type="number" value={desCap} min={0} max={30} onChange={(e) => setDesCap(Number(e.target.value))} style={{ width: 64 }} />
            <span className="mono">max</span><input type="number" value={maxCap} min={0} max={50} onChange={(e) => setMaxCap(Number(e.target.value))} style={{ width: 64 }} />
          </div>
          <div className="out small">Scale-out step = +1. Scale-in step = -1. Cooldown ≈ 2 ticks.</div>
        </div>

        <div className="ctrl">
          <label>Instance capacity (RPS per instance @ 100% CPU)</label>
          <input type="range" min={50} max={400} value={capPer} onChange={(e) => setCapPer(Number(e.target.value))} style={{ width: '100%' }} />
          <div className="out">Capacity per instance: <span className="mono">{capPer}</span> RPS</div>
        </div>
      </div>

      <div className="kpi">
        <div className="k"><div className="t">Healthy instances</div><div className="v">{metrics.n}</div></div>
        <div className="k"><div className="t">Avg CPU (simulated)</div><div className="v">{Math.round(metrics.avgCpu)}%</div></div>
        <div className="k"><div className="t">RPS / target</div><div className="v">{metrics.n ? Math.round(metrics.rpt) : '∞'}</div></div>
      </div>

      <div className="btnbar">
        <button type="button" className="primary" onClick={start}>▶ Start</button>
        <button type="button" onClick={pause}>⏸ Pause</button>
        <button type="button" onClick={stepOnce}>⏭ Step</button>
        <button type="button" onClick={resetSim}>🔄 Reset</button>
        <button type="button" onClick={injectFailure}>💥 Fail one instance</button>
        <button type="button" onClick={toggleDrain}>🧯 Toggle “scale-in drain”</button>
      </div>

      <div className="card">
        <div className="lbl">Current targets behind the Load Balancer</div>
        <div className="instances">
          {instances.filter((i) => i.status !== 'terminated').slice(0, 12).map((inst) => {
            const klass = inst.failed ? 'inst down' : inst.status === 'ok' ? 'inst ok' : inst.status === 'warm' ? 'inst warm' : inst.status === 'drain' ? 'inst drain' : 'inst';
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
            <div key={`empty-${idx}`} className="inst" style={{ opacity: 0.35 }}>
              <div className="name">—</div>
              <div className="meta">empty</div>
            </div>
          ))}
        </div>
      </div>

      <div className="log" aria-live="polite">
        {logs.map((entry, idx) => (
          <div key={idx} style={{ marginBottom: idx === logs.length - 1 ? 0 : 6 }} dangerouslySetInnerHTML={{ __html: entry }} />
        ))}
      </div>
    </div>
  );
}
