import { useEffect, useRef, useState } from 'react';

const sections = [
  { id: 'rds_overview', label: '1) Concept' },
  { id: 'rds_connect', label: '2) Connectivity' },
  { id: 'rds_multi', label: '3) Multi-AZ' },
  { id: 'rds_rr', label: '4) Read Replicas' },
  { id: 'rds_sim', label: '5) Live Simulation' },
  { id: 'rds_best', label: '6) Best-practice' },
];

type Metrics = {
  writes: number;
  reads: number;
  readTarget: string;
  writerTps: number;
  replicaEach: number | null;
  failState: string;
  stale: string;
};

export default function RDSVisualizer() {
  const [activeSection, setActiveSection] = useState('rds_overview');
  const [mode, setMode] = useState<'single' | 'multi' | 'multi_rr'>('multi');
  const [readRoute, setReadRoute] = useState<'writer' | 'replicas' | 'smart'>('replicas');
  const [tps, setTps] = useState(120);
  const [lag, setLag] = useState(3);
  const [azFailed, setAzFailed] = useState(false);
  const [logHtml, setLogHtml] = useState('Click "Simulate WRITE/READ" to see which endpoint is used, then toggle AZ failure to see failover behavior.');
  const [bestTab, setBestTab] = useState<'arch'|'sg'|'proxy'|'multiaz'|'replicas'|'engines'|'checklist'>('arch');
  const [metrics, setMetrics] = useState<Metrics>({
    writes: 90,
    reads: 30,
    readTarget: 'replicas',
    writerTps: 90,
    replicaEach: 15,
    failState: 'OK',
    stale: 'Low',
  });

  const svgRef = useRef<SVGSVGElement | null>(null);
  const lastWriteAtRef = useRef<number>(0);

  const splitTraffic = (t: number) => {
    const writes = Math.round(t * 0.25);
    const reads = t - writes;
    return { writes, reads };
  };

  const staleRisk = (m: string, readRoute: string, lag: number): string => {
    if (readRoute === 'writer') return 'Low';
    if (m !== 'multi_rr') return 'Low';
    if (lag >= 12) return 'High';
    if (lag >= 5) return 'Med';
    return 'Low';
  };

  const effectiveReadTarget = (m: string, readRoute: string): string => {
    if (readRoute === 'writer') return 'writer';
    if (readRoute === 'replicas') return m === 'multi_rr' ? 'replicas' : 'writer';
    const within = Date.now() - lastWriteAtRef.current < 10000;
    if (within) return 'writer';
    return m === 'multi_rr' ? 'replicas' : 'writer';
  };

  const writerStateLabel = (m: string): string => {
    if (!azFailed) return 'Writer (AZ-a)';
    if (m === 'single') return 'Writer (AZ-a down)';
    return 'Writer (failed over to AZ-b)';
  };

  const badge = (cls: string, txt: string) => `<span class="badge ${cls}">${txt}</span>`;
  const log = (msg: string) => {
    setLogHtml((prev) => `<b>${new Date().toLocaleTimeString()}</b> — ${msg}<br><span style="color:var(--color-text-tertiary)">${prev}</span>`);
  };

  const renderSvg = (m: Metrics) => {
    const svg = svgRef.current;
    if (!svg) return;
    const NS = 'http://www.w3.org/2000/svg';
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const defs = document.createElementNS(NS, 'defs');
    const marker = document.createElementNS(NS, 'marker');
    marker.setAttribute('id', 'arr');
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '7');
    marker.setAttribute('markerHeight', '7');
    marker.setAttribute('orient', 'auto-start-reverse');
    const ap = document.createElementNS(NS, 'path');
    ap.setAttribute('d', 'M 0 0 L 10 5 L 0 10 z');
    ap.setAttribute('fill', 'var(--color-text-tertiary)');
    marker.appendChild(ap);
    defs.appendChild(marker);
    svg.appendChild(defs);

    const helpers = {
      rect: (x: number, y: number, w: number, h: number, fill: string, stroke: string) => {
        const r = document.createElementNS(NS, 'rect');
        r.setAttribute('x', String(x));
        r.setAttribute('y', String(y));
        r.setAttribute('width', String(w));
        r.setAttribute('height', String(h));
        r.setAttribute('rx', '12');
        r.setAttribute('fill', fill);
        r.setAttribute('stroke', stroke);
        r.setAttribute('stroke-width', '0.7');
        svg.appendChild(r);
      },
      text: (x: number, y: number, str: string, sz = 12, weight = 500, fill = 'var(--color-text-primary)') => {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', String(x));
        t.setAttribute('y', String(y));
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'central');
        t.setAttribute('font-size', String(sz));
        t.setAttribute('font-weight', String(weight));
        t.setAttribute('fill', fill);
        t.textContent = str;
        svg.appendChild(t);
      },
      path: (d: string) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', 'var(--color-text-tertiary)');
        p.setAttribute('stroke-width', '1.2');
        p.setAttribute('marker-end', 'url(#arr)');
        svg.appendChild(p);
      },
    };

    helpers.rect(24, 92, 160, 70, '#eff6ff', '#2563eb');
    helpers.text(104, 116, 'App', 12, 500, '#1d4ed8');
    helpers.text(104, 140, 'writes+reads', 10, 500, '#1d4ed8');

    const writerFill = (azFailed && mode === 'single') ? '#fee2e2' : '#dcfce7';
    const writerStroke = (azFailed && mode === 'single') ? '#dc2626' : '#16a34a';
    helpers.rect(260, 62, 190, 70, writerFill, writerStroke);
    helpers.text(355, 86, writerStateLabel(mode), 11, 600, (azFailed && mode === 'single') ? '#b91c1c' : '#15803d');
    helpers.text(355, 110, 'Writer endpoint', 10, 500, (azFailed && mode === 'single') ? '#b91c1c' : '#15803d');
    helpers.text(355, 130, `TPS: ${m.writerTps}`, 10, 500, (azFailed && mode === 'single') ? '#b91c1c' : '#15803d');

    if (mode !== 'single') {
      helpers.rect(260, 150, 190, 56, '#fef3c7', '#b45309');
      helpers.text(355, 174, 'Standby (AZ-b)', 11, 600, '#92400e');
      helpers.text(355, 194, 'HA only (not read)', 10, 500, '#92400e');
    }

    if (mode === 'multi_rr') {
      helpers.rect(492, 48, 164, 64, '#ede9fe', '#6d28d9');
      helpers.text(574, 74, 'Read replica #1', 11, 600, '#6d28d9');
      helpers.text(574, 96, `lag ~ ${lag}s`, 10, 500, '#6d28d9');
      helpers.rect(492, 128, 164, 64, '#ede9fe', '#6d28d9');
      helpers.text(574, 154, 'Read replica #2', 11, 600, '#6d28d9');
      helpers.text(574, 176, `lag ~ ${lag}s`, 10, 500, '#6d28d9');
    }

    helpers.path('M 184 118 L 260 98');
    helpers.text(222, 90, `writes: ${m.writes}`, 10, 500, 'var(--color-text-tertiary)');

    if (m.readTarget === 'writer') {
      helpers.path('M 184 138 L 260 118');
      helpers.text(224, 150, `reads: ${m.reads}`, 10, 500, 'var(--color-text-tertiary)');
    } else {
      helpers.path('M 184 138 L 492 80');
      helpers.path('M 184 138 L 492 160');
      helpers.text(334, 156, 'reads split', 10, 500, 'var(--color-text-tertiary)');
    }

    if (azFailed && mode === 'single') {
      helpers.text(355, 22, 'AZ-a failure: no standby → outage/degraded until recovery', 11, 600, '#b91c1c');
    } else if (azFailed && mode !== 'single') {
      helpers.text(355, 22, 'AZ-a failure: automatic failover to AZ-b (endpoint stays same)', 11, 600, '#1d4ed8');
    } else {
      helpers.text(355, 22, 'Normal: app connects via endpoints + security groups in VPC', 11, 600, 'var(--color-text-secondary)');
    }
  };

  useEffect(() => {
    const { writes, reads } = splitTraffic(tps);
    const readTarget = effectiveReadTarget(mode, readRoute);
    let writerTps = writes;
    let replicaEach: number | null = null;
    if (readTarget === 'writer') writerTps += reads;
    else {
      const rrCount = 2;
      replicaEach = Math.round(reads / rrCount);
    }
    const m: Metrics = {
      writes,
      reads,
      readTarget,
      writerTps,
      replicaEach,
      failState: !azFailed ? 'OK' : (mode === 'single' ? 'DEGRADED' : 'FAILOVER'),
      stale: staleRisk(mode, readRoute, lag),
    };
    setMetrics(m);
    renderSvg(m);
  }, [mode, readRoute, tps, lag, azFailed]);

  const sendWrite = () => {
    lastWriteAtRef.current = Date.now();
    if (azFailed && mode === 'single') {
      log(`${badge('bbad', 'WRITE failed')} Writer AZ down and no Multi-AZ standby.`);
    } else {
      log(`${badge('bok', 'WRITE ok')} Sent to <b>writer endpoint</b>. (Reads immediately after might need writer for consistency.)`);
    }
  };

  const sendRead = () => {
    const target = effectiveReadTarget(mode, readRoute);
    if (azFailed && mode === 'single') {
      log(`${badge('bbad', 'READ failed')} Writer AZ down and no Multi-AZ standby.`);
    } else if (target === 'writer') {
      log(`${badge('binfo', 'READ')} Routed to <b>writer</b> (stronger consistency).`);
    } else {
      const risk = staleRisk(mode, readRoute, lag);
      const cls = risk === 'High' ? 'bwarn' : 'binfo';
      log(`${badge(cls, 'READ')} Routed to <b>read replicas</b>. Lag ~${lag}s → stale-read risk: <b>${risk}</b>.`);
    }
  };

  const toggleAzFail = () => {
    setAzFailed((s) => !s);
    if (!azFailed) {
      if (mode === 'single') log(`${badge('bbad', 'AZ failure')} Single-AZ: writer is down (no standby).`);
      else log(`${badge('bwarn', 'AZ failure')} Multi-AZ: failover happens; app reconnects to same endpoint.`);
    } else {
      log(`${badge('bok', 'Recovered')} AZ restored; writer normal.`);
    }
  };

  const resetSim = () => {
    setAzFailed(false);
    lastWriteAtRef.current = 0;
    setLogHtml('Click "Simulate WRITE/READ" to see which endpoint is used, then toggle AZ failure to see failover behavior.');
  };

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div>
      <style>{`
        .nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
        .pill{border:0.5px solid var(--color-border-tertiary);border-radius:999px;padding:6px 10px;font-size:12px;color:var(--color-text-secondary);background:var(--color-background-primary);cursor:pointer}
        .pill.active{background:var(--color-text-info);border-color:var(--color-text-info);color:#fff}
        .sec{border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);padding:12px 14px;background:var(--color-background-primary);margin-bottom:12px}
        .h{font-weight:500;font-size:14px;margin-bottom:6px}
        .sub{font-size:12px;color:var(--color-text-secondary);line-height:1.6;margin-bottom:10px}
        .grid2{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px}
        .card{background:var(--color-background-secondary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md);padding:10px 12px}
        .lbl{font-size:11px;color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}
        .row{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md);background:var(--color-background-primary);margin-bottom:6px;font-size:13px;color:var(--color-text-secondary);line-height:1.5}
        .dot{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:10px;color:#fff;font-weight:500;background:var(--color-text-info)}
        .badge{font-size:11px;font-weight:500;border-radius:999px;padding:2px 8px;display:inline-block}
        .binfo{background:#dbeafe;color:#1d4ed8}
        .bok{background:#dcfce7;color:#15803d}
        .bwarn{background:#fef3c7;color:#b45309}
        .bbad{background:#fee2e2;color:#b91c1c}
        .kpi{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-bottom:10px}
        .k{background:var(--color-background-secondary);border-radius:var(--border-radius-md);padding:10px}
        .k .t{font-size:11px;color:var(--color-text-tertiary);margin-bottom:2px}
        .k .v{font-size:18px;font-weight:500}
        .controls{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-bottom:10px}
        .ctrl{background:var(--color-background-secondary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md);padding:10px 12px}
        .ctrl label{display:block;font-size:12px;color:var(--color-text-secondary);margin-bottom:6px}
        .ctrl select,.ctrl input{width:100%;padding:4px;font-size:12px;border:0.5px solid var(--color-border-tertiary);border-radius:4px;background:var(--color-background-primary)}
        .ctrl .out{font-size:12px;color:var(--color-text-secondary);margin-top:6px}
        .mono{font-family:var(--font-mono)}
        .btnbar{display:flex;gap:8px;flex-wrap:wrap;margin-top:6px}
        button{font-size:12px;padding:6px 10px;border-radius:8px;border:0.5px solid var(--color-border-tertiary);background:var(--color-background-primary);cursor:pointer}
        button.primary{background:var(--color-text-info);border-color:var(--color-text-info);color:#fff}
        .log{background:var(--color-background-secondary);border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-md);padding:10px 12px;font-size:11px;color:var(--color-text-secondary);line-height:1.65;min-height:88px;margin-top:10px}
        .small{font-size:11px;color:var(--color-text-tertiary);line-height:1.6;margin-top:8px}
        svg text{font-family:var(--font-sans)}
      `}</style>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🛢️ AWS RDS Visualizer</h1>
        <p className="text-gray-600">Diagrams and a simple live model for RDS connectivity, Multi-AZ, and read replicas.</p>
      </div>

      <div className="nav mb-6">
        {sections.map((s) => (
          <button key={s.id} onClick={() => scrollTo(s.id)} className={`pill ${activeSection === s.id ? 'active' : ''}`}>
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeSection === 'rds_overview' && (
          <div className="sec" id="rds_overview">
            <div className="h">Amazon RDS — "managed database server" inside your VPC</div>
            <div className="sub">RDS runs your database engine (MySQL/PostgreSQL/etc.) for you: backups, patching, monitoring, storage, and (optionally) high availability. You connect to it over the network (TCP port like <span className="mono">5432</span> / <span className="mono">3306</span>) from apps in the same VPC (or via VPN/Direct Connect).</div>
            <div className="grid2">
              <div className="card">
                <div className="lbl">Core pieces</div>
                <div className="row"><div className="dot">A</div><div><b>DB instance</b> (writer): the primary read/write database</div></div>
                <div className="row"><div className="dot">B</div><div><b>DB subnet group</b>: which subnets/AZs RDS can use</div></div>
                <div className="row"><div className="dot">C</div><div><b>Security group</b>: who can connect to the DB port</div></div>
                <div className="row"><div className="dot">D</div><div><b>Endpoints</b>: DNS name you connect to</div></div>
              </div>
              <div className="card">
                <div className="lbl">Common options</div>
                <div className="row"><div className="dot">1</div><div><b>Multi-AZ</b>: standby in another AZ for failover (standby is not used for reads)</div></div>
                <div className="row"><div className="dot">2</div><div><b>Read replicas</b>: separate replicas for read scaling (async replication → possible lag)</div></div>
                <div className="row"><div className="dot">3</div><div><b>RDS Proxy</b>: connection pooling + faster failover for apps with many connections</div></div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'rds_connect' && (
          <div className="sec" id="rds_connect">
            <div className="h">Connectivity architecture (who talks to RDS and how)</div>
            <div className="sub">RDS is usually in private subnets. Apps connect inside the VPC using security groups. No public access for most production setups.</div>
            <svg width="100%" viewBox="0 0 680 360" role="img" aria-label="RDS connectivity diagram">
              <defs>
                <marker id="arrow2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-text-tertiary)" />
                </marker>
              </defs>
              <rect x="16" y="20" width="648" height="320" rx="18" fill="var(--color-background-secondary)" stroke="var(--color-border-tertiary)" strokeWidth="0.5" />
              <text x="32" y="44" fontSize="13" fontWeight="500" fill="var(--color-text-primary)">VPC</text>
              <rect x="32" y="64" width="300" height="260" rx="14" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" strokeWidth="0.5" />
              <text x="48" y="86" fontSize="12" fontWeight="500" fill="var(--color-text-primary)">App tier (private subnets)</text>
              <rect x="58" y="108" width="248" height="56" rx="12" fill="#eff6ff" stroke="#2563eb" strokeWidth="0.7" />
              <text x="182" y="130" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="500" fill="#1d4ed8">EC2 / ECS / Lambda</text>
              <text x="182" y="150" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="#1d4ed8">uses DB credentials</text>
              <rect x="58" y="180" width="248" height="56" rx="12" fill="#ede9fe" stroke="#6d28d9" strokeWidth="0.7" />
              <text x="182" y="202" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="500" fill="#6d28d9">RDS Proxy (optional)</text>
              <text x="182" y="222" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="#6d28d9">pooling + faster failover</text>
              <rect x="370" y="64" width="278" height="260" rx="14" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" strokeWidth="0.5" />
              <text x="386" y="86" fontSize="12" fontWeight="500" fill="var(--color-text-primary)">DB tier (private subnets)</text>
              <rect x="398" y="112" width="222" height="56" rx="12" fill="#dcfce7" stroke="#16a34a" strokeWidth="0.7" />
              <text x="509" y="134" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="500" fill="#15803d">RDS Writer</text>
              <text x="509" y="154" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="#15803d">endpoint: db.cluster / db.instance</text>
              <rect x="398" y="196" width="222" height="56" rx="12" fill="#fef3c7" stroke="#b45309" strokeWidth="0.7" />
              <text x="509" y="218" textAnchor="middle" dominantBaseline="central" fontSize="12" fontWeight="500" fill="#92400e">Security Group</text>
              <text x="509" y="238" textAnchor="middle" dominantBaseline="central" fontSize="10" fill="#92400e">allow port 5432/3306 from app SG</text>
              <path d="M 306 136 L 398 140" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.2" markerEnd="url(#arrow2)" />
              <path d="M 182 164 L 182 180" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.0" markerEnd="url(#arrow2)" />
              <path d="M 306 208 L 398 140" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.0" markerEnd="url(#arrow2)" />
              <text x="338" y="134" fontSize="10" fill="var(--color-text-tertiary)">TCP connect</text>
              <text x="270" y="224" fontSize="10" fill="var(--color-text-tertiary)">pool</text>
            </svg>
            <div className="small">
              <span className="badge binfo">Rule of thumb</span>
              Put RDS in <b>private subnets</b>, set <b>Publicly accessible = false</b>, and allow inbound only from the <b>app security group</b>.
            </div>
          </div>
        )}

        {activeSection === 'rds_multi' && (
          <div className="sec" id="rds_multi">
            <div className="h">Multi-AZ RDS (high availability)</div>
            <div className="sub">Multi-AZ keeps a <b>standby</b> in another AZ. On failure, RDS performs <b>automatic failover</b> and your app keeps using the <b>same writer endpoint</b>. (The standby is for HA, not for read scaling.)</div>
            <div className="grid2">
              <div className="card">
                <div className="lbl">What you get</div>
                <div className="row"><div className="dot">+</div><div><b>Automatic failover</b> for AZ/instance issues</div></div>
                <div className="row"><div className="dot">+</div><div><b>Synchronous replication</b> to standby (higher durability)</div></div>
                <div className="row"><div className="dot">+</div><div><b>Single writer endpoint</b> (app doesn't change DNS)</div></div>
              </div>
              <div className="card">
                <div className="lbl">Trade-offs</div>
                <div className="row"><div className="dot">!</div><div>Costs more (you pay for standby)</div></div>
                <div className="row"><div className="dot">!</div><div>Standby is typically <b>not readable</b></div></div>
                <div className="row"><div className="dot">!</div><div>Failover still causes a brief reconnect window</div></div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'rds_rr' && (
          <div className="sec" id="rds_rr">
            <div className="h">Read replicas (read scaling + offload)</div>
            <div className="sub">Read replicas are separate DB instances with their <b>own endpoints</b>. Replication is usually <b>asynchronous</b> → reads can be stale by some lag. Apps commonly route <b>writes to writer</b> and <b>reads to replicas</b> (for endpoints, or via a custom read-balancing layer).</div>
            <div className="grid2">
              <div className="card">
                <div className="lbl">Good for</div>
                <div className="row"><div className="dot">R</div><div>High read traffic (dashboards, feeds, analytics-lite)</div></div>
                <div className="row"><div className="dot">R</div><div>Running reports without slowing the writer</div></div>
              </div>
              <div className="card">
                <div className="lbl">Gotchas</div>
                <div className="row"><div className="dot">L</div><div><b>Lag</b>: replicas can be seconds/minutes behind</div></div>
                <div className="row"><div className="dot">C</div><div><b>Consistency</b>: "read-your-writes" might break unless you read from writer after writes</div></div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'rds_sim' && (
          <div className="sec" id="rds_sim">
            <div className="h">Live simulation (writes vs reads, Multi-AZ failover, replica lag)</div>
            <div className="sub">Model: app sends writes to the writer endpoint. Reads go to replicas only if you enable them; otherwise reads hit the writer. Toggle an AZ failure to see Multi-AZ failover. Increase lag to see "stale reads" risk.</div>

            <div className="controls">
              <div className="ctrl">
                <label>Deployment mode</label>
                <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
                  <option value="single">Single-AZ (writer only)</option>
                  <option value="multi">Multi-AZ (writer + standby)</option>
                  <option value="multi_rr">Multi-AZ + 2 read replicas</option>
                </select>
                <div className="out small">Multi-AZ standby is HA, not a read target.</div>
              </div>

              <div className="ctrl">
                <label>Read routing</label>
                <select value={readRoute} onChange={(e) => setReadRoute(e.target.value as any)}>
                  <option value="writer">Reads → writer</option>
                  <option value="replicas">Reads → replicas (if present)</option>
                  <option value="smart">Smart: after write read-from-writer (10s)</option>
                </select>
                <div className="out small">"Smart" simulates read-your-writes handling.</div>
              </div>

              <div className="ctrl">
                <label>Traffic mix</label>
                <input type="range" min="0" max="400" value={tps} onChange={(e) => setTps(Number(e.target.value))} style={{ width: '100%' }} />
                <div className="out">Total TPS: <span className="mono">{tps}</span></div>
                <div className="out small">Writes = 25% (fixed), Reads = 75% (fixed)</div>
              </div>

              <div className="ctrl">
                <label>Replica lag (seconds)</label>
                <input type="range" min="0" max="30" value={lag} onChange={(e) => setLag(Number(e.target.value))} style={{ width: '100%' }} />
                <div className="out">Lag: <span className="mono">{lag}</span>s</div>
              </div>
            </div>

            <div className="kpi">
              <div className="k"><div className="t">Writer TPS</div><div className="v">{metrics.writerTps}</div></div>
              <div className="k"><div className="t">Replica TPS (each)</div><div className="v">{metrics.replicaEach ?? '—'}</div></div>
              <div className="k"><div className="t">Failover state</div><div className="v">{metrics.failState}</div></div>
              <div className="k"><div className="t">Stale-read risk</div><div className="v">{metrics.stale}</div></div>
            </div>

            <div className="btnbar">
              <button className="primary" onClick={sendWrite}>+ Simulate WRITE</button>
              <button onClick={sendRead}>+ Simulate READ</button>
              <button onClick={toggleAzFail}>⚡ Toggle AZ failure</button>
              <button onClick={resetSim}>🔄 Reset</button>
              <button onClick={() => log('Best-practice template: private subnets + RDS Proxy + Multi-AZ + read replicas')}>Best-practice template ↗</button>
            </div>

            <div className="card" style={{ marginTop: 10 }}>
              <div className="lbl">Routing diagram (live)</div>
              <svg ref={svgRef} width="100%" viewBox="0 0 680 260" role="img" aria-label="RDS simulation diagram" />
              <div className="small">
                <span className="badge binfo">Tip</span>
                If lag is high and you route reads to replicas, a read right after a write can return old data unless you force reads to writer for a short window.
              </div>
            </div>

            <div className="log" dangerouslySetInnerHTML={{ __html: logHtml }} />
          </div>
        )}

        {activeSection === 'rds_best' && (
          <div className="sec" id="rds_best">
            <style>{`
              * { box-sizing: border-box; margin: 0; padding: 0; }
              .tab-bar { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
              .tab-btn { padding: 6px 14px; border-radius: 20px; border: 0.5px solid var(--color-border-tertiary); font-size: 13px; cursor: pointer; background: var(--color-background-primary); color: var(--color-text-secondary); transition: all 0.15s; }
              .tab-btn.active { background: var(--color-text-info); color: #fff; border-color: var(--color-text-info); }
              .panel { display: none; }
              .panel.active { display: block; }
              .badge { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
              .badge-blue { background: #dbeafe; color: #1d4ed8; }
              .badge-green { background: #dcfce7; color: #15803d; }
              .badge-orange { background: #ffedd5; color: #c2410c; }
              .badge-purple { background: #ede9fe; color: #7c3aed; }
              .badge-red { background: #fee2e2; color: #b91c1c; }
              .sg-row { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 6px; border: 0.5px solid var(--color-border-tertiary); margin-bottom: 6px; font-size: 13px; }
              .sg-icon { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
              .engine-card { border: 0.5px solid var(--color-border-tertiary); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; }
              .engine-title { font-size: 14px; font-weight: 500; margin-bottom: 6px; }
              .kv { display: flex; gap: 8px; font-size: 12px; margin-bottom: 3px; }
              .kv-key { color: var(--color-text-secondary); min-width: 110px; }
              .kv-val { color: var(--color-text-primary); font-weight: 500; }
              .flow-step { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }
              .step-num { width: 24px; height: 24px; border-radius: 50%; background: var(--color-text-info); color: #fff; font-size: 12px; font-weight: 500; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
              .step-body { font-size: 13px; color: var(--color-text-primary); }
              .step-body b { color: var(--color-text-info); }
              .step-sub { font-size: 12px; color: var(--color-text-secondary); margin-top: 2px; }
              .checklist li { font-size: 13px; color: var(--color-text-primary); margin-bottom: 5px; list-style: none; padding-left: 20px; position: relative; }
              .checklist li::before { content: "✓"; position: absolute; left: 0; color: #15803d; font-weight: 700; }
              .warn-list li { font-size: 13px; color: var(--color-text-primary); margin-bottom: 5px; list-style: none; padding-left: 20px; position: relative; }
              .warn-list li::before { content: "⚠"; position: absolute; left: 0; }
              .section-title { font-size: 13px; font-weight: 500; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; margin-top: 14px; }
              .section-title:first-child { margin-top: 0; }
            `}</style>

            <div style={{ padding: 16 }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>🏗️ Best-Practice RDS Architecture</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Private subnets · Security Groups · RDS Proxy · Multi-AZ · Read Replicas · All Engines</div>
              </div>

              <div className="tab-bar">
                <button className={`tab-btn ${bestTab === 'arch' ? 'active' : ''}`} onClick={() => setBestTab('arch')}>Architecture</button>
                <button className={`tab-btn ${bestTab === 'sg' ? 'active' : ''}`} onClick={() => setBestTab('sg')}>Security Groups</button>
                <button className={`tab-btn ${bestTab === 'proxy' ? 'active' : ''}`} onClick={() => setBestTab('proxy')}>RDS Proxy</button>
                <button className={`tab-btn ${bestTab === 'multiaz' ? 'active' : ''}`} onClick={() => setBestTab('multiaz')}>Multi-AZ</button>
                <button className={`tab-btn ${bestTab === 'replicas' ? 'active' : ''}`} onClick={() => setBestTab('replicas')}>Read Replicas</button>
                <button className={`tab-btn ${bestTab === 'engines' ? 'active' : ''}`} onClick={() => setBestTab('engines')}>Engines</button>
                <button className={`tab-btn ${bestTab === 'checklist' ? 'active' : ''}`} onClick={() => setBestTab('checklist')}>Checklist</button>
              </div>

              <div id="tab-arch" className={`panel ${bestTab === 'arch' ? 'active' : ''}`}>
                <svg width="100%" viewBox="0 0 660 520" style={{ display: 'block' }}>
                  <defs>
                    <marker id="arr" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L8,3 z" fill="#6b7280" />
                    </marker>
                    <marker id="arr-blue" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L8,3 z" fill="#3b82f6" />
                    </marker>
                    <marker id="arr-green" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L8,3 z" fill="#16a34a" />
                    </marker>
                    <marker id="arr-orange" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L8,3 z" fill="#ea580c" />
                    </marker>
                  </defs>

                  <rect x="10" y="10" width="640" height="500" rx="16" fill="none" stroke="#d1d5db" strokeWidth="0.5"/>
                  <text x="330" y="30" textAnchor="middle" fontSize="12" fill="#6b7280" fontWeight={500}>VPC (3 AZs)</text>

                  <rect x="20" y="38" width="620" height="60" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.5"/>
                  <text x="330" y="55" textAnchor="middle" fontSize="11" fill="#1d4ed8" fontWeight={500}>PUBLIC SUBNETS</text>
                  <rect x="100" y="60" width="120" height="28" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                  <text x="160" y="78" textAnchor="middle" fontSize="12" fill="#1d4ed8" fontWeight={500}>🌐 ALB</text>
                  <rect x="260" y="60" width="140" height="28" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                  <text x="330" y="78" textAnchor="middle" fontSize="12" fill="#1d4ed8" fontWeight={500}>🔒 WAF (optional)</text>
                  <rect x="440" y="60" width="140" height="28" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                  <text x="510" y="78" textAnchor="middle" fontSize="12" fill="#1d4ed8" fontWeight={500}>🌍 NAT Gateway</text>

                  <rect x="20" y="112" width="620" height="80" rx="8" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="0.5"/>
                  <text x="330" y="130" textAnchor="middle" fontSize="11" fill="#15803d" fontWeight={500}>PRIVATE APP SUBNETS</text>
                  <rect x="60" y="138" width="160" height="44" rx="6" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                  <text x="140" y="156" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight={500}>⚙️ App Tier</text>
                  <text x="140" y="172" textAnchor="middle" fontSize="11" fill="#166534">ECS / EC2 / Lambda</text>
                  <rect x="260" y="138" width="160" height="44" rx="6" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                  <text x="340" y="156" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight={500}>🔄 RDS Proxy</text>
                  <text x="340" y="172" textAnchor="middle" fontSize="11" fill="#166534">Connection Pooling</text>
                  <rect x="460" y="138" width="160" height="44" rx="6" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                  <text x="540" y="156" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight={500}>🔑 Secrets Manager</text>
                  <text x="540" y="172" textAnchor="middle" fontSize="11" fill="#166534">DB Credentials</text>

                  <rect x="20" y="206" width="620" height="290" rx="8" fill="#fefce8" stroke="#fde68a" strokeWidth="0.5"/>
                  <text x="330" y="224" textAnchor="middle" fontSize="11" fill="#92400e" fontWeight={500}>PRIVATE DB SUBNETS</text>

                  <rect x="30" y="232" width="190" height="250" rx="8" fill="#fffbeb" stroke="#fcd34d" strokeWidth="0.5"/>
                  <text x="125" y="250" textAnchor="middle" fontSize="11" fill="#92400e" fontWeight={500}>AZ-1</text>
                  <rect x="42" y="258" width="166" height="50" rx="6" fill="#fef3c7" stroke="#fbbf24" strokeWidth="0.5"/>
                  <text x="125" y="278" textAnchor="middle" fontSize="12" fill="#92400e" fontWeight={500}>✍️ RDS Writer</text>
                  <text x="125" y="294" textAnchor="middle" fontSize="11" fill="#78350f">(Primary)</text>
                  <rect x="42" y="318" width="166" height="50" rx="6" fill="#fef3c7" stroke="#fbbf24" strokeWidth="0.5"/>
                  <text x="125" y="338" textAnchor="middle" fontSize="12" fill="#92400e" fontWeight={500}>📖 Read Replica 1</text>
                  <text x="125" y="354" textAnchor="middle" fontSize="11" fill="#78350f">Async replication</text>
                  <rect x="42" y="378" width="166" height="40" rx="6" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
                  <text x="125" y="402" textAnchor="middle" fontSize="11" fill="#78350f">sg-db · port 5432/3306</text>

                  <rect x="235" y="232" width="190" height="250" rx="8" fill="#fffbeb" stroke="#fcd34d" strokeWidth="0.5"/>
                  <text x="330" y="250" textAnchor="middle" fontSize="11" fill="#92400e" fontWeight={500}>AZ-2</text>
                  <rect x="247" y="258" width="166" height="50" rx="6" fill="#fef3c7" stroke="#fbbf24" strokeWidth="0.5"/>
                  <text x="330" y="278" textAnchor="middle" fontSize="12" fill="#92400e" fontWeight={500}>🛡️ Multi-AZ Standby</text>
                  <text x="330" y="294" textAnchor="middle" fontSize="11" fill="#78350f">Sync replication (HA)</text>
                  <rect x="247" y="318" width="166" height="50" rx="6" fill="#fef3c7" stroke="#fbbf24" strokeWidth="0.5"/>
                  <text x="330" y="338" textAnchor="middle" fontSize="12" fill="#92400e" fontWeight={500}>📖 Read Replica 2</text>
                  <text x="330" y="354" textAnchor="middle" fontSize="11" fill="#78350f">Async replication</text>
                  <rect x="247" y="378" width="166" height="40" rx="6" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
                  <text x="330" y="402" textAnchor="middle" fontSize="11" fill="#78350f">Failover target</text>

                  <rect x="440" y="232" width="190" height="250" rx="8" fill="#fffbeb" stroke="#fcd34d" strokeWidth="0.5"/>
                  <text x="535" y="250" textAnchor="middle" fontSize="11" fill="#92400e" fontWeight={500}>AZ-3 (optional)</text>
                  <rect x="452" y="258" width="166" height="50" rx="6" fill="#fef3c7" stroke="#fbbf24" strokeWidth="0.5"/>
                  <text x="535" y="278" textAnchor="middle" fontSize="12" fill="#92400e" fontWeight={500}>📖 Read Replica 3</text>
                  <text x="535" y="294" textAnchor="middle" fontSize="11" fill="#78350f">Cross-AZ reads</text>
                  <rect x="452" y="318" width="166" height="50" rx="6" fill="#fef3c7" stroke="#fbbf24" strokeWidth="0.5"/>
                  <text x="535" y="338" textAnchor="middle" fontSize="12" fill="#92400e" fontWeight={500}>🌍 Cross-Region</text>
                  <text x="535" y="354" textAnchor="middle" fontSize="11" fill="#78350f">Replica (DR)</text>
                  <rect x="452" y="378" width="166" height="40" rx="6" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
                  <text x="535" y="402" textAnchor="middle" fontSize="11" fill="#78350f">Aurora Global / RDS</text>

                  <text x="125" y="498" textAnchor="middle" fontSize="11" fill="#92400e">CloudWatch · Performance Insights · Enhanced Monitoring</text>
                  <text x="450" y="498" textAnchor="middle" fontSize="11" fill="#92400e">KMS Encryption · Automated Backups · Maintenance Window</text>

                  <line x1="160" y1="88" x2="160" y2="138" stroke="#3b82f6" strokeWidth={1.2} markerEnd="url(#arr-blue)" strokeDasharray="4,2"/>
                  <line x1="220" y1="160" x2="260" y2="160" stroke="#3b82f6" strokeWidth={1.2} markerEnd="url(#arr-blue)"/>
                  <line x1="340" y1="182" x2="125" y2="258" stroke="#ea580c" strokeWidth={1.2} markerEnd="url(#arr-orange)"/>
                  <line x1="340" y1="182" x2="330" y2="258" stroke="#ea580c" strokeWidth={1.2} markerEnd="url(#arr-orange)"/>
                  <line x1="125" y1="308" x2="125" y2="318" stroke="#16a34a" strokeWidth={1} markerEnd="url(#arr-green)" strokeDasharray="3,2"/>
                  <line x1="330" y1="308" x2="330" y2="318" stroke="#16a34a" strokeWidth={1} markerEnd="url(#arr-green)" strokeDasharray="3,2"/>
                  <line x1="125" y1="308" x2="330" y2="258" stroke="#6b7280" strokeWidth={0.8} strokeDasharray="4,3" markerEnd="url(#arr)"/>
                </svg>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>🔵 HTTPS traffic &nbsp; 🟠 DB connections via Proxy &nbsp; 🟢 Replication &nbsp; ⚫ Failover</span>
                </div>
              </div>

              <div id="tab-sg" className={`panel ${bestTab === 'sg' ? 'active' : ''}`}>
                <div className="section-title">Security Group Chain (Least Privilege)</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>Use SG-to-SG rules — never CIDRs for internal traffic</div>

                <div className="sg-row" style={{ background: '#eff6ff' }}>
                  <div className="sg-icon" style={{ background: '#dbeafe' }}>🌐</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>sg-alb <span className="badge badge-blue">ALB</span></div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Inbound: 443/80 from 0.0.0.0/0 &nbsp;|&nbsp; Outbound: app-port → sg-app</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: 18, color: '#6b7280', margin: '2px 0' }}>↓</div>
                <div className="sg-row" style={{ background: '#f0fdf4' }}>
                  <div className="sg-icon" style={{ background: '#dcfce7' }}>⚙️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>sg-app <span className="badge badge-green">App Tier</span></div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Inbound: app-port from sg-alb &nbsp;|&nbsp; Outbound: DB-port → sg-proxy</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: 18, color: '#6b7280', margin: '2px 0' }}>↓</div>
                <div className="sg-row" style={{ background: '#faf5ff' }}>
                  <div className="sg-icon" style={{ background: '#ede9fe' }}>🔄</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>sg-proxy <span className="badge badge-purple">RDS Proxy</span></div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Inbound: DB-port from sg-app &nbsp;|&nbsp; Outbound: DB-port → sg-db</div>
                  </div>
                </div>
                <div style={{ textAlign: 'center', fontSize: 18, color: '#6b7280', margin: '2px 0' }}>↓</div>
                <div className="sg-row" style={{ background: '#fefce8' }}>
                  <div className="sg-icon" style={{ background: '#fef3c7' }}>🗄️</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, fontSize: 13 }}>sg-db <span className="badge badge-orange">RDS</span></div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 2 }}>Inbound: DB-port from sg-proxy only &nbsp;|&nbsp; Optional: bastion sg for admin</div>
                  </div>
                </div>

                <div className="section-title" style={{ marginTop: 16 }}>Port Reference by Engine</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
                  <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 8, padding: 10, fontSize: 12 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>🐘 PostgreSQL</div>
                    <div style={{ color: 'var(--color-text-secondary)' }}>Port: <b style={{ color: 'var(--color-text-primary)' }}>5432</b></div>
                    <div style={{ color: 'var(--color-text-secondary)' }}>Aurora PG: same</div>
                  </div>
                  <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 8, padding: 10, fontSize: 12 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>🐬 MySQL / MariaDB</div>
                    <div style={{ color: 'var(--color-text-secondary)' }}>Port: <b style={{ color: 'var(--color-text-primary)' }}>3306</b></div>
                    <div style={{ color: 'var(--color-text-secondary)' }}>Aurora MySQL: same</div>
                  </div>
                  <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 8, padding: 10, fontSize: 12 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>🪟 SQL Server</div>
                    <div style={{ color: 'var(--color-text-secondary)' }}>Port: <b style={{ color: 'var(--color-text-primary)' }}>1433</b></div>
                    <div style={{ color: 'var(--color-text-secondary)' }}>Oracle: 1521</div>
                  </div>
                </div>
              </div>

              <div id="tab-proxy" className={`panel ${bestTab === 'proxy' ? 'active' : ''}`}>
                <div className="section-title">What RDS Proxy Does</div>
                <div className="flow-step"><div className="step-num">1</div><div className="step-body"><b>App connects to Proxy endpoint</b> (not directly to RDS)<div className="step-sub">Proxy endpoint is stable — survives failover without DNS TTL issues</div></div></div>
                <div className="flow-step"><div className="step-num">2</div><div className="step-body"><b>Proxy pools connections</b> to RDS writer<div className="step-sub">1000s of app connections → small pool of real DB connections (e.g. 10–50)</div></div></div>
                <div className="flow-step"><div className="step-num">3</div><div className="step-body"><b>Credentials from Secrets Manager</b> via IAM<div className="step-sub">No hardcoded passwords. Proxy rotates credentials automatically.</div></div></div>
                <div className="flow-step"><div className="step-num">4</div><div className="step-body"><b>On failover</b>: Proxy detects new writer in ~10s<div className="step-sub">App sees a brief pause, not a connection error. Much faster than raw RDS failover (~30–60s)</div></div></div>

                <div className="section-title">When to Use RDS Proxy</div>
                <ul className="checklist" style={{ marginBottom: 10 }}>
                  <li>Lambda functions (each invocation opens a new connection)</li>
                  <li>ECS/Fargate with many tasks autoscaling</li>
                  <li>Any app with connection storms or max_connections issues</li>
                  <li>You want faster Multi-AZ failover recovery</li>
                </ul>

                <div className="section-title">Engine Support</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 8 }}>
                  <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 8, padding: 10, fontSize: 12 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>✅ Supported</div>
                    <div style={{ color: 'var(--color-text-secondary)' }}>MySQL 5.6, 5.7, 8.0<br/>PostgreSQL 10.x+<br/>Aurora MySQL<br/>Aurora PostgreSQL<br/>MariaDB 10.x</div>
                  </div>
                  <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 8, padding: 10, fontSize: 12 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>❌ Not Supported</div>
                    <div style={{ color: 'var(--color-text-secondary)' }}>SQL Server<br/>Oracle<br/>RDS Custom<br/>Aurora Serverless v1</div>
                  </div>
                </div>
              </div>

              <div id="tab-multiaz" className={`panel ${bestTab === 'multiaz' ? 'active' : ''}`}>
                <div className="section-title">Multi-AZ: High Availability, Not Read Scaling</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12, marginBottom: 14 }}>
                  <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8, color: 'var(--color-text-info)' }}>RDS Multi-AZ (Standard)</div>
                    <div className="flow-step"><div className="step-num" style={{ background: '#3b82f6' }}>1</div><div className="step-body" style={{ fontSize: 12 }}><b>Synchronous replication</b> to standby<div className="step-sub">Every write is committed to both AZs before ACK</div></div></div>
                    <div className="flow-step"><div className="step-num" style={{ background: '#3b82f6' }}>2</div><div className="step-body" style={{ fontSize: 12 }}><b>Standby is NOT readable</b><div className="step-sub">It's purely for failover. Use read replicas for reads.</div></div></div>
                    <div className="flow-step"><div className="step-num" style={{ background: '#3b82f6' }}>3</div><div className="step-body" style={{ fontSize: 12 }}><b>Failover in ~30–60s</b><div className="step-sub">DNS flips to standby. RDS Proxy reduces app impact.</div></div></div>
                  </div>
                  <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 10, padding: 12 }}>
                    <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 8, color: '#7c3aed' }}>Aurora Multi-AZ</div>
                    <div className="flow-step"><div className="step-num" style={{ background: '#7c3aed' }}>1</div><div className="step-body" style={{ fontSize: 12 }}><b>Shared storage across 6 copies</b><div className="step-sub">3 AZs × 2 copies. Quorum writes (4/6).</div></div></div>
                    <div className="flow-step"><div className="step-num" style={{ background: '#7c3aed' }}>2</div><div className="step-body" style={{ fontSize: 12 }}><b>Aurora Replicas ARE readable</b><div className="step-sub">Up to 15 read replicas, all share same storage</div></div></div>
                    <div className="flow-step"><div className="step-num" style={{ background: '#7c3aed' }}>3</div><div className="step-body" style={{ fontSize: 12 }}><b>Failover in ~10–30s</b><div className="step-sub">Replica promoted instantly (no data copy needed)</div></div></div>
                  </div>
                </div>
                <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: 10, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  💡 <b style={{ color: 'var(--color-text-primary)' }}>Recommendation:</b> Use Aurora if you need both HA + read scaling in one product. Use RDS Multi-AZ + separate read replicas for MySQL/PostgreSQL if you need engine-specific features or cost control.
                </div>
              </div>

              <div id="tab-replicas" className={`panel ${bestTab === 'replicas' ? 'active' : ''}`}>
                <div className="section-title">Read Replica Routing Strategy</div>
                <div className="flow-step"><div className="step-num">W</div><div className="step-body"><b>Writes → Writer endpoint always</b><div className="step-sub">Never send writes to a replica. It will error or silently fail.</div></div></div>
                <div className="flow-step"><div className="step-num">R</div><div className="step-body"><b>Reads → Replica endpoint(s)</b><div className="step-sub">Use for reports, dashboards, analytics, search queries</div></div></div>
                <div className="flow-step"><div className="step-num">!</div><div className="step-body"><b>Read-your-writes problem</b><div className="step-sub">After a write, route reads to writer for ~1–2s, or use session pinning in RDS Proxy</div></div></div>

                <div className="section-title">Replica Types by Engine</div>
                <div className="engine-card">
                  <div className="engine-title">🐘 PostgreSQL / 🐬 MySQL / MariaDB</div>
                  <div className="kv"><span className="kv-key">Replication type</span><span className="kv-val">Async (binlog / WAL streaming)</span></div>
                  <div className="kv"><span className="kv-key">Max replicas</span><span className="kv-val">5 per source (can chain)</span></div>
                  <div className="kv"><span className="kv-key">Cross-region</span><span className="kv-val">✅ Yes (for DR)</span></div>
                  <div className="kv"><span className="kv-key">Promote to writer</span><span className="kv-val">Manual (breaks replication)</span></div>
                  <div className="kv"><span className="kv-key">Lag monitoring</span><span className="kv-val">ReplicaLag CloudWatch metric</span></div>
                </div>
                <div className="engine-card">
                  <div className="engine-title">🌌 Aurora MySQL / Aurora PostgreSQL</div>
                  <div className="kv"><span className="kv-key">Replication type</span><span className="kv-val">Shared storage (no lag for reads)</span></div>
                  <div className="kv"><span className="kv-key">Max replicas</span><span className="kv-val">15 Aurora Replicas</span></div>
                  <div className="kv"><span className="kv-key">Cross-region</span><span className="kv-val">✅ Aurora Global Database</span></div>
                  <div className="kv"><span className="kv-key">Promote to writer</span><span className="kv-val">Automatic on failover (&lt;30s)</span></div>
                  <div className="kv"><span className="kv-key">Reader endpoint</span><span className="kv-val">Single DNS load-balances across all replicas</span></div>
                </div>
                <div className="engine-card">
                  <div className="engine-title">🪟 SQL Server / 🔶 Oracle</div>
                  <div className="kv"><span className="kv-key">Read replicas</span><span className="kv-val">❌ Not supported on RDS</span></div>
                  <div className="kv"><span className="kv-key">HA option</span><span className="kv-val">Multi-AZ only (standby, not readable)</span></div>
                  <div className="kv"><span className="kv-key">Read scaling</span><span className="kv-val">Use ElastiCache or app-level caching</span></div>
                </div>
              </div>

              <div id="tab-engines" className={`panel ${bestTab === 'engines' ? 'active' : ''}`}>
                <div className="section-title">Engine Comparison at a Glance</div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--color-background-secondary)' }}>
                        <th style={{ padding: 8, textAlign: 'left', border: '0.5px solid var(--color-border-tertiary)' }}>Feature</th>
                        <th style={{ padding: 8, textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>Aurora MySQL</th>
                        <th style={{ padding: 8, textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>Aurora PG</th>
                        <th style={{ padding: 8, textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>RDS MySQL</th>
                        <th style={{ padding: 8, textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>RDS PG</th>
                        <th style={{ padding: 8, textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>SQL Server</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ padding: '7px 8px', border: '0.5px solid var(--color-border-tertiary)' }}>RDS Proxy</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>✅</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>✅</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>✅</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>✅</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>❌</td></tr>
                      <tr style={{ background: 'var(--color-background-secondary)' }}><td style={{ padding: '7px 8px', border: '0.5px solid var(--color-border-tertiary)' }}>Read Replicas</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>15</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>15</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>5</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>5</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>❌</td></tr>
                      <tr><td style={{ padding: '7px 8px', border: '0.5px solid var(--color-border-tertiary)' }}>Multi-AZ Failover</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>{'<30s'}</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>{'<30s'}</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>30–60s</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>30–60s</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>30–60s</td></tr>
                      <tr style={{ background: 'var(--color-background-secondary)' }}><td style={{ padding: '7px 8px', border: '0.5px solid var(--color-border-tertiary)' }}>Global DB (DR)</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>✅</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>✅</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>Cross-region replica</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>Cross-region replica</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>❌</td></tr>
                      <tr><td style={{ padding: '7px 8px', border: '0.5px solid var(--color-border-tertiary)' }}>Serverless option</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>v2 ✅</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>v2 ✅</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>❌</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>❌</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>❌</td></tr>
                      <tr style={{ background: 'var(--color-background-secondary)' }}><td style={{ padding: '7px 8px', border: '0.5px solid var(--color-border-tertiary)' }}>Storage autoscale</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>Auto (128TB)</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>Auto (128TB)</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>Manual/auto</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>Manual/auto</td><td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)' }}>Manual/auto</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div id="tab-checklist" className={`panel ${bestTab === 'checklist' ? 'active' : ''}`}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 12 }}>
                  <div>
                    <div className="section-title">✅ Must-Have</div>
                    <ul className="checklist">
                      <li>RDS in private subnets (no public access)</li>
                      <li>Multi-AZ enabled</li>
                      <li>RDS Proxy (if Lambda/ECS)</li>
                      <li>Secrets Manager for credentials</li>
                      <li>KMS encryption at rest</li>
                      <li>TLS/SSL in transit enforced</li>
                      <li>Automated backups (7–35 days)</li>
                      <li>SG-to-SG rules (no CIDRs)</li>
                      <li>CloudWatch alarms on CPU, storage, connections</li>
                      <li>Performance Insights enabled</li>
                    </ul>
                  </div>
                  <div>
                    <div className="section-title">⚠️ Common Mistakes</div>
                    <ul className="warn-list">
                      <li>Sending writes to read replica</li>
                      <li>Connecting app directly to RDS (skip Proxy)</li>
                      <li>Hardcoded DB passwords in env vars</li>
                      <li>publicly_accessible = true on RDS</li>
                      <li>No ReplicaLag alarm on replicas</li>
                      <li>Assuming standby is readable (it's not)</li>
                      <li>Not testing failover before production</li>
                      <li>Skipping maintenance windows</li>
                      <li>No slow query logging</li>
                      <li>Single AZ for cost savings in prod</li>
                    </ul>
                  </div>
                </div>
                <div style={{ marginTop: 14, background: 'var(--color-background-secondary)', borderRadius: 8, padding: 10, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  💡 <b style={{ color: 'var(--color-text-primary)' }}>Pro tip:</b> Run <code>aws rds failover-db-cluster</code> in staging to test your app's failover resilience before going to production.
                </div>
              </div>

              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <button onClick={() => log('Request: Terraform code for RDS architecture')} style={{ padding: '8px 20px', borderRadius: 20, border: '0.5px solid var(--color-border-tertiary)', fontSize: 13, cursor: 'pointer', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}>Get Terraform code for this architecture ↗</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
