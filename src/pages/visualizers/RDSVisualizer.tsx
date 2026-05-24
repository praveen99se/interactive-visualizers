import { useEffect, useRef, useState } from 'react';

type TabType = 'overview' | 'connect' | 'multiaz' | 'replicas' | 'sim' | 'advanced' | 'best';
type EngineType = 'postgres' | 'mysql' | 'maria' | 'oracle' | 'mssql' | 'aurora';
type FeatureTab = 'backup' | 'clone' | 'security' | 'ml' | 'proxy';

type Metrics = {
  writes: number;
  reads: number;
  readTarget: string;
  writerTps: number;
  replicaEach: number | null;
  failState: string;
  stale: string;
};

// Original Engine Comparison Data
const engineDetails: Record<EngineType, { title: string; desc: string; specs: { k: string; v: string }[]; cases: string[] }> = {
  postgres: {
    title: '🐘 PostgreSQL Engine',
    desc: 'An advanced, enterprise-grade open-source relational database. Highly popular for complex queries, JSON-based document storage, and spatial indexing.',
    specs: [
      { k: 'Default Port', v: '5432' },
      { k: 'Max Storage', v: '64 TiB' },
      { k: 'High Availability', v: 'Multi-AZ Standby' },
      { k: 'Read Replicas', v: 'Up to 5 active replicas' }
    ],
    cases: ['Complex analytics and reporting systems', 'JSON document hybrid relational structures', 'GIS and spatial mapping applications']
  },
  mysql: {
    title: '🐬 MySQL Engine',
    desc: 'The world\'s most popular open-source relational database. Renowned for its speed, reliability, simplicity, and massive developer ecosystem.',
    specs: [
      { k: 'Default Port', v: '3306' },
      { k: 'Max Storage', v: '64 TiB' },
      { k: 'High Availability', v: 'Multi-AZ Standby' },
      { k: 'Read Replicas', v: 'Up to 5 active replicas' }
    ],
    cases: ['High-traffic web logs and CMS sites', 'LAMP-stack web applications', 'Standard transactional catalog stores']
  },
  maria: {
    title: '🦭 MariaDB Engine',
    desc: 'An community-developed, commercially supported fork of MySQL. Designed as a drop-in replacement with additional storage engines and security features.',
    specs: [
      { k: 'Default Port', v: '3306' },
      { k: 'Max Storage', v: '64 TiB' },
      { k: 'High Availability', v: 'Multi-AZ Standby' },
      { k: 'Read Replicas', v: 'Up to 5 active replicas' }
    ],
    cases: ['Standard web applications', 'Enterprise MySQL migrations', 'High-concurrency e-commerce backends']
  },
  oracle: {
    title: '🔶 Oracle Database',
    desc: 'A premium, highly secure proprietary relational database engine. Packed with advanced enterprise features, heavy-duty processing, and licensing flexibility.',
    specs: [
      { k: 'Default Port', v: '1521' },
      { k: 'Max Storage', v: '64 TiB' },
      { k: 'High Availability', v: 'Multi-AZ Standby' },
      { k: 'Read Replicas', v: '❌ Not supported on standard RDS' }
    ],
    cases: ['Corporate ERP systems and core banking', 'Legacy migration pipelines', 'Highly demanding enterprise transactional storage']
  },
  mssql: {
    title: '🪟 Microsoft SQL Server',
    desc: 'Microsoft\'s proprietary enterprise relational database. Extensively integrated with Windows ecosystem, active directories, and corporate tooling.',
    specs: [
      { k: 'Default Port', v: '1433' },
      { k: 'Max Storage', v: '64 TiB' },
      { k: 'High Availability', v: 'Multi-AZ Standby (AlwaysOn)' },
      { k: 'Read Replicas', v: '❌ Not supported on standard RDS' }
    ],
    cases: ['Windows-backed web and desktop apps', 'Enterprise .NET backends', 'Active Directory integrated storage environments']
  },
  aurora: {
    title: '🌌 Amazon Aurora (Cloud-Native) ⭐',
    desc: 'AWS\'s premium, cloud-native relational database. Built on a shared, log-structured distributed storage system that heals and auto-scales natively up to 128 TiB.',
    specs: [
      { k: 'Compatibility', v: 'PostgreSQL or MySQL compliant' },
      { k: 'Max Storage', v: '128 TiB (auto-scales)' },
      { k: 'High Availability', v: 'Storage replication 6-ways across 3 AZs' },
      { k: 'Read Replicas', v: 'Up to 15 active replicas with near-zero lag' }
    ],
    cases: ['Enterprise SaaS platforms with extreme write/read workloads', 'Highly auto-scaling microservices', 'Mission-critical database setups with ultra-fast failover']
  }
};

export default function RDSVisualizer() {
  const [activeSection, setActiveSection] = useState<TabType>('overview');
  const [selectedEngine, setSelectedEngine] = useState<EngineType>('postgres');

  // Simulator State
  const [mode, setMode] = useState<'single' | 'multi' | 'multi_rr'>('multi');
  const [readRoute, setReadRoute] = useState<'writer' | 'replicas' | 'smart'>('replicas');
  const [tps, setTps] = useState(120);
  const [lag, setLag] = useState(3);
  const [azFailed, setAzFailed] = useState(false);
  const [logHtml, setLogHtml] = useState('Click "Simulate WRITE/READ" to see which endpoint is used, then toggle AZ failure to see failover behavior.');

  // Best practice Tab & Sub-tabs State
  const [bestTab, setBestTab] = useState<'arch' | 'sg' | 'proxy' | 'multiaz' | 'replicas' | 'engines' | 'checklist'>('arch');

  // Advanced Features Sub-tabs State
  const [activeFeatureTab, setActiveFeatureTab] = useState<FeatureTab>('backup');
  const [pitrDays, setPitrDays] = useState<number>(3);
  const [proxyConcurrency, setProxyConcurrency] = useState<number>(200);
  const [activeMlQuery, setActiveMlQuery] = useState<'sentiment' | 'fraud' | 'churn'>('sentiment');

  const [secItems, setSecItems] = useState([
    { label: 'Encryption at rest (KMS Key)', done: true },
    { label: 'TLS enforced (force_ssl=1 in parameter group)', done: true },
    { label: 'RDS placed in Private Subnets (No route to IGW)', done: true },
    { label: 'Publicly Accessible flag set to FALSE', done: false },
    { label: 'Security Group restricts inbound strictly to App SG', done: true },
    { label: 'IAM Database Authentication enabled', done: false },
    { label: 'Secrets Manager configured with automated credential rotation', done: true },
    { label: 'Database Deletion Protection turned ON', done: false },
    { label: 'AWS CloudTrail logging enabled for all database API calls', done: true },
    { label: 'Enhanced Monitoring and Performance Insights enabled', done: false }
  ]);

  const toggleSecItem = (index: number) => {
    setSecItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], done: !copy[index].done };
      return copy;
    });
  };

  const cloneRows = [
    ['Speed', 'Minutes–hours (full data duplicate copy)', 'Seconds (copy-on-write pointers mapping)'],
    ['Storage cost', 'Full replica duplicate cost (double payment)', 'Only pays for diverged pages/changed records'],
    ['Source impact', 'Slightly impacts active performance on full snapshot', 'Zero active impact (instant metadata pointers lock)'],
    ['Cross-account', '✅ Allowed via snapshot sharing', '✅ Supported within same organization boundaries'],
    ['Cross-region', '✅ Yes (via snapshot copying)', '❌ Same region boundaries only'],
    ['Best use cases', 'Disaster recovery, long-term airgapped audit archives', 'Instant ephemeral dev testing, analytics reports, seed testing']
  ];

  const mlFlows = {
    lambda: {
      sql: `-- RDS does NOT have native ML SQL functions\n-- Use Lambda bridge pattern:\n\n1. EventBridge rule or App triggers Lambda\n2. Lambda: SELECT data FROM rds_table\n3. Lambda: calls SageMaker.invoke_endpoint()\n4. Lambda: UPDATE rds_table SET score = result\n5. Done — ML result stored back in RDS`,
      note: '→ Best for: batch scoring, async ML cron jobs, offloaded processing'
    },
    app: {
      sql: `-- App-layer inference pattern:\n\n1. User HTTP request hits your App API\n2. App queries features/data from RDS\n3. App calls SageMaker/Comprehend API\n4. App evaluates prediction results\n5. App returns ML result to user\n6. Optionally: cache prediction back to RDS\n\n-- Real-time, synchronous execution`,
      note: '→ Best for: real-time predictions at request time, low-latency API routes'
    },
    pgml: {
      sql: `-- PostgreSQL pgml extension (RDS PG 15+ & Aurora PG):\n\nSELECT pgml.predict(\n  project_name => 'fraud_model',\n  features => ARRAY[amount, merchant_id]\n) AS fraud_score\nFROM transactions;\n\n-- Train directly in your database using SQL:\nSELECT pgml.train(\n  'churn_model', \n  'classification',\n  'SELECT * FROM training_data',\n  'label'\n);`,
      note: '→ Best for: in-database ML, high-throughput feature queries without external calls'
    }
  };

  // Metrics calculation
  const [metrics, setMetrics] = useState<Metrics>({
    writes: 90,
    reads: 30,
    readTarget: 'replicas',
    writerTps: 90,
    replicaEach: 15,
    failState: 'OK',
    stale: 'Low'
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

  const badge = (cls: string, txt: string) => `<span class="rds-badge ${cls}">${txt}</span>`;
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
    ap.setAttribute('fill', 'var(--color-text-tertiary, #64748b)');
    marker.appendChild(ap);
    defs.appendChild(marker);
    svg.appendChild(defs);

    const helpers = {
      rect: (x: number, y: number, w: number, h: number, fill: string, stroke: string, dash = '') => {
        const r = document.createElementNS(NS, 'rect');
        r.setAttribute('x', String(x));
        r.setAttribute('y', String(y));
        r.setAttribute('width', String(w));
        r.setAttribute('height', String(h));
        r.setAttribute('rx', '10');
        r.setAttribute('fill', fill);
        r.setAttribute('stroke', stroke);
        r.setAttribute('stroke-width', '1');
        if (dash) r.setAttribute('stroke-dasharray', dash);
        svg.appendChild(r);
      },
      text: (x: number, y: number, str: string, sz = 11, weight = 500, fill = 'var(--color-text-primary, #0f172a)') => {
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
      path: (d: string, dash = '', color = 'var(--color-text-tertiary, #64748b)') => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', color);
        p.setAttribute('stroke-width', '1.5');
        if (dash) p.setAttribute('stroke-dasharray', dash);
        p.setAttribute('marker-end', 'url(#arr)');
        svg.appendChild(p);
      }
    };

    // VPC Boundary Box
    helpers.rect(210, 35, 450, 190, 'var(--color-background-secondary, #f8fafc)', 'var(--color-border-tertiary, #e2e8f0)', '4,4');
    helpers.text(435, 48, 'VPC (Private Subnets Isolation Boundary)', 10, 600, 'var(--color-text-secondary, #475569)');

    // App Tier Server Box
    helpers.rect(20, 80, 150, 90, '#eff6ff', '#2563eb');
    helpers.text(95, 105, '💻 Client App Tier', 12, 600, '#1d4ed8');
    helpers.text(95, 125, 'EC2 / ECS / Lambda', 10, 500, '#1d4ed8');
    helpers.text(95, 145, `Total TPS: ${tps}`, 10, 500, '#1d4ed8');

    // Writer Instance Box
    const writerFill = (azFailed && mode === 'single') ? '#fee2e2' : '#dcfce7';
    const writerStroke = (azFailed && mode === 'single') ? '#dc2626' : '#16a34a';
    const writerText = (azFailed && mode === 'single') ? '#b91c1c' : '#15803d';

    helpers.rect(230, 70, 190, 65, writerFill, writerStroke);
    helpers.text(325, 90, writerStateLabel(mode), 11, 600, writerText);
    helpers.text(325, 110, `Writes: ${m.writes} TPS | Total: ${m.writerTps} TPS`, 10, 500, writerText);

    // Multi-AZ Standby Instance Box
    if (mode !== 'single') {
      const standbyFill = azFailed ? '#dcfce7' : '#fffbeb';
      const standbyStroke = azFailed ? '#16a34a' : '#d97706';
      const standbyText = azFailed ? '#15803d' : '#b45309';
      const standbyName = azFailed ? 'Standby (PROMOTED to Writer)' : '🛡️ Standby (AZ-b)';

      helpers.rect(230, 148, 190, 60, standbyFill, standbyStroke);
      helpers.text(325, 168, standbyName, 11, 600, standbyText);
      helpers.text(325, 188, azFailed ? 'Active Write Endpoint (DNS shift)' : 'HA Only (Synchronous Copy, No Reads)', 9, 500, standbyText);

      // Replication Line Writer -> Standby
      if (azFailed) {
        // AZ crashed, show broken line
        helpers.path('M 325 135 L 325 148', '3,3', '#ef4444');
      } else {
        // Normal Sync replication line
        helpers.path('M 325 135 L 325 148', '', '#16a34a');
        helpers.text(370, 141, 'Sync 🔄', 9, 600, '#15803d');
      }
    }

    // Read Replica Boxes
    if (mode === 'multi_rr') {
      helpers.rect(480, 55, 160, 65, '#faf5ff', '#7c3aed');
      helpers.text(560, 75, '📖 Read Replica #1', 11, 600, '#7c3aed');
      helpers.text(560, 95, `lag ~ ${lag}s | TPS: ${m.replicaEach}`, 9, 500, '#7c3aed');

      helpers.rect(480, 138, 160, 65, '#faf5ff', '#7c3aed');
      helpers.text(560, 158, '📖 Read Replica #2', 11, 600, '#7c3aed');
      helpers.text(560, 178, `lag ~ ${lag}s | TPS: ${m.replicaEach}`, 9, 500, '#7c3aed');

      // Async replication lines from Writer to Replicas
      if (!azFailed) {
        helpers.path('M 420 90 L 480 85', '3,2', '#7c3aed');
        helpers.path('M 420 110 L 480 155', '3,2', '#7c3aed');
        helpers.text(450, 78, 'Async 🟢', 8, 600, '#6d28d9');
      } else {
        // Failed over to standby, replication streams from Standby in AZ-b to replicas
        helpers.path('M 420 178 L 480 90', '3,2', '#7c3aed');
        helpers.path('M 420 188 L 480 175', '3,2', '#7c3aed');
        helpers.text(450, 202, 'Async 🟢', 8, 600, '#6d28d9');
      }
    }

    // Client App Inbound Traffic Routes
    if (azFailed && mode === 'single') {
      // Outage: traffic fail
      helpers.path('M 170 125 L 230 100', '4,4', '#ef4444');
      helpers.text(200, 100, '❌ Fail', 10, 600, '#ef4444');
    } else {
      // Normal write traffic
      const writeTargetY = (azFailed && mode !== 'single') ? 165 : 100;
      helpers.path(`M 170 115 L 230 ${writeTargetY}`, '', '#2563eb');
      helpers.text(195, 95, `Writes: ${m.writes} TPS`, 9, 600, '#1d4ed8');

      // Read traffic paths
      if (m.readTarget === 'writer') {
        helpers.path(`M 170 135 L 230 ${writeTargetY}`, '', '#2563eb');
        helpers.text(195, 148, `Reads: ${m.reads} TPS`, 9, 600, '#1d4ed8');
      } else if (mode === 'multi_rr') {
        helpers.path('M 170 135 L 480 85', '', '#7c3aed');
        helpers.path('M 170 145 L 480 165', '', '#7c3aed');
        helpers.text(205, 160, `Reads: ${m.reads} TPS (Split)`, 9, 600, '#6d28d9');
      }
    }
  };

  useEffect(() => {
    const { writes, reads } = splitTraffic(tps);
    const readTarget = effectiveReadTarget(mode, readRoute);
    let writerTps = writes;
    let replicaEach: number | null = null;
    if (readTarget === 'writer') {
      writerTps += reads;
    } else {
      const rrCount = 2;
      replicaEach = Math.round(reads / rrCount);
    }

    const m: Metrics = {
      writes,
      reads,
      readTarget,
      writerTps,
      replicaEach,
      failState: !azFailed ? 'OK' : (mode === 'single' ? 'OUTAGE / DEGRADED' : 'FAILOVER (Standby Active)'),
      stale: staleRisk(mode, readRoute, lag)
    };
    setMetrics(m);
    renderSvg(m);
  }, [mode, readRoute, tps, lag, azFailed]);

  const sendWrite = () => {
    lastWriteAtRef.current = Date.now();
    if (azFailed && mode === 'single') {
      log(`${badge('rds-bbad', 'WRITE failed')} Database Instance is down in AZ-a. Single-AZ configuration has no recovery standby.`);
    } else if (azFailed) {
      log(`${badge('rds-bwarn', 'WRITE ok')} Route successfully redirected to Standby in AZ-b. App endpoint stays the same.`);
    } else {
      log(`${badge('rds-bok', 'WRITE ok')} Transaction successfully committed to <b>Primary DB Instance</b> writer endpoint.`);
    }
  };

  const sendRead = () => {
    const target = effectiveReadTarget(mode, readRoute);
    if (azFailed && mode === 'single') {
      log(`${badge('rds-bbad', 'READ failed')} Database Instance is down. App cannot retrieve data.`);
    } else if (target === 'writer') {
      log(`${badge('rds-binfo', 'READ ok')} Strongly Consistent read successfully fetched directly from the **Primary Writer**.`);
    } else {
      const risk = staleRisk(mode, readRoute, lag);
      const cls = risk === 'High' ? 'rds-bbad' : risk === 'Med' ? 'rds-bwarn' : 'rds-binfo';
      log(`${badge(cls, 'READ')} Asynchronous read served from **Read Replicas**. lag: ~${lag}s. Stale-read risk evaluation: <b>${risk}</b>.`);
    }
  };

  const toggleAzFail = () => {
    setAzFailed((s) => !s);
    if (!azFailed) {
      if (mode === 'single') {
        log(`${badge('rds-bbad', 'CRITICAL OUTAGE')} AZ-a suffered a physical datacenter power event. Writer DB is DOWN.`);
      } else {
        log(`${badge('rds-bwarn', 'AZ failover triggered')} AZ-a offline. Standby promotion triggered. DNS shifts records automatically. App reconnects in ~30s.`);
      }
    } else {
      log(`${badge('rds-bok', 'Restored')} AZ-a power restored. Subnets and nodes are in normal cluster synchronization state.`);
    }
  };

  const resetSim = () => {
    setAzFailed(false);
    lastWriteAtRef.current = 0;
    setLogHtml('Click "Simulate WRITE/READ" to see which endpoint is used, then toggle AZ failure to see failover behavior.');
  };

  return (
    <div>
      <style>{`
        /* Encapsulated styling under .rds- */
        .rds-container { font-family: var(--font-sans, system-ui, sans-serif); color: var(--color-text-primary, #0f172a); }
        .rds-h { font-size: 22px; font-weight: 700; display: flex; alignItems: center; gap: 8px; margin-bottom: 4px; }
        .rds-sub { font-size: 13px; color: var(--color-text-secondary, #475569); line-height: 1.5; margin-bottom: 14px; }
        .rds-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-tertiary, #e2e8f0); padding-bottom: 10px; }
        .rds-tb { padding: 6px 14px; border-radius: var(--border-radius-lg, 12px); border: 0.5px solid var(--color-border-secondary, #cbd5e1); font-size: 12px; cursor: pointer; background: var(--color-background-secondary, #f8fafc); color: var(--color-text-secondary, #475569); transition: all 0.15s; outline: none; }
        .rds-tb:hover { background: var(--color-background-tertiary, #f1f5f9); }
        .rds-tb.rds-on { background: #16a34a; color: #fff; border-color: #16a34a; font-weight: 500; }
        .rds-card { border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-lg, 12px); padding: 14px 16px; background: var(--color-background-primary, #ffffff); margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .rds-sec { font-size: 11px; font-weight: 600; color: var(--color-text-secondary, #475569); text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0 8px; }
        .rds-sec:first-child { margin-top: 0; }
        .rds-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .rds-grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .rds-row { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-md, 8px); background: var(--color-background-secondary, #f8fafc); margin-bottom: 6px; font-size: 12px; line-height: 1.45; }
        .rds-dot { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 10px; color: #fff; font-weight: 600; background: #16a34a; }
        .rds-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }
        .rds-binfo { background: #dbeafe; color: #1d4ed8; }
        .rds-bok { background: #dcfce7; color: #15803d; }
        .rds-bwarn { background: #fef3c7; color: #b45309; }
        .rds-bbad { background: #fee2e2; color: #b91c1c; }
        .rds-bpurple { background: #ede9fe; color: #7c3aed; }
        .rds-kpi { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; margin-bottom: 12px; }
        .rds-k { background: var(--color-background-secondary, #f8fafc); border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-md, 8px); padding: 10px; text-align: center; }
        .rds-k .t { font-size: 10px; color: var(--color-text-tertiary, #64748b); margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
        .rds-k .v { font-size: 16px; font-weight: 700; color: var(--color-text-primary, #0f172a); }
        .rds-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
        .rds-ctrl { background: var(--color-background-secondary, #f8fafc); border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-md, 8px); padding: 12px; }
        .rds-ctrl label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-secondary, #475569); margin-bottom: 6px; }
        .rds-ctrl select { width: 100%; padding: 6px; font-size: 12px; border: 2px solid #f59e0b; box-shadow: 0 0 0 3px rgba(245,158,11,0.2); border-radius: 4px; background: var(--color-background-primary, #ffffff); outline: none; }
        .rds-ctrl input[type="range"] { width: 100%; padding: 6px; font-size: 12px; border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: 4px; background: var(--color-background-primary, #ffffff); }
        .rds-ctrl .out { font-size: 11px; color: var(--color-text-secondary, #475569); margin-top: 6px; font-family: var(--font-mono, monospace); }
        .rds-mono { font-family: var(--font-mono, monospace); font-size: 11px; }
        .rds-btnbar { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .rds-btn { font-size: 12px; padding: 6px 12px; border-radius: 6px; border: 0.5px solid var(--color-border-secondary, #cbd5e1); background: var(--color-background-primary, #ffffff); color: var(--color-text-primary, #0f172a); cursor: pointer; transition: all 0.15s; outline: none; display: inline-flex; align-items: center; gap: 4px; }
        .rds-btn:hover { background: var(--color-background-secondary, #f8fafc); }
        .rds-btn.rds-primary { background: #16a34a; border-color: #16a34a; color: #fff; }
        .rds-btn.rds-primary:hover { background: #15803d; }
        .rds-log { background: var(--color-background-secondary, #f8fafc); border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-md, 8px); padding: 12px; font-size: 11px; color: var(--color-text-secondary, #475569); line-height: 1.6; min-height: 90px; max-height: 180px; overflow-y: auto; margin-top: 12px; }
        ul.rds-ck, ul.rds-wn { padding-left: 0; margin-bottom: 0; }
        ul.rds-ck li, ul.rds-wn li { font-size: 12px; margin-bottom: 6px; list-style: none; padding-left: 18px; position: relative; line-height: 1.4; }
        ul.rds-ck li::before { content: "✓"; position: absolute; left: 0; color: #15803d; font-weight: 700; }
        ul.rds-wn li::before { content: "⚠️"; position: absolute; left: 0; font-size: 10px; }
        .rds-table { width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.4; }
        .rds-table th { background: var(--color-background-secondary, #f8fafc); border: 0.5px solid var(--color-border-tertiary, #e2e8f0); padding: 8px; text-align: left; font-weight: 600; }
        .rds-table td { border: 0.5px solid var(--color-border-tertiary, #e2e8f0); padding: 8px; }
        .rds-table tr:nth-child(even) { background: var(--color-background-secondary, #f8fafc); }
        .rds-code-container { border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: 8px; background: var(--color-background-secondary, #f8fafc); padding: 12px; margin-top: 10px; }
        .rds-code { font-family: var(--font-mono, monospace); font-size: 11px; white-space: pre-wrap; line-height: 1.45; color: var(--color-text-primary, #0f172a); }
        
        /* Subtabs styling */
        .rds-subtabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; border-bottom: 1px dashed var(--color-border-tertiary, #e2e8f0); padding-bottom: 8px; }
        .rds-subtb { padding: 4px 10px; border-radius: 6px; border: 0.5px solid var(--color-border-secondary, #cbd5e1); font-size: 11px; cursor: pointer; background: var(--color-background-primary, #ffffff); color: var(--color-text-secondary, #475569); transition: all 0.15s; outline: none; }
        .rds-subtb:hover { background: var(--color-background-secondary, #f8fafc); }
        .rds-subtb.rds-on { background: #2563eb; color: #fff; border-color: #2563eb; font-weight: 500; }
        .rds-subtb.rds-on-purple { background: #7c3aed; color: #fff; border-color: #7c3aed; font-weight: 500; }
      `}</style>

      <div className="rds-container">
        {/* Flagship Header */}
        <div style={{ padding: '14px 16px 4px' }}>
          <div className="rds-h">🛢️ Amazon RDS — Relational Database Service Visualizer</div>
          <div className="rds-sub">
            Managed database server engine inside your VPC boundaries. Easily scale compute, handle synchronous Multi-AZ failovers, configure read replicas, pool database connections with RDS Proxy, and leverage built-in machine learning models.
          </div>
        </div>

        {/* Main Navigation Tabs */}
        <div className="rds-tabs">
          <button className={`rds-tb ${activeSection === 'overview' ? 'rds-on' : ''}`} onClick={() => setActiveSection('overview')}>⚖️ 1) Concept &amp; Engines</button>
          <button className={`rds-tb ${activeSection === 'connect' ? 'rds-on' : ''}`} onClick={() => setActiveSection('connect')}>🔌 2) Connectivity &amp; SGs</button>
          <button className={`rds-tb ${activeSection === 'multiaz' ? 'rds-on' : ''}`} onClick={() => setActiveSection('multiaz')}>🛡️ 3) High Availability HA</button>
          <button className={`rds-tb ${activeSection === 'replicas' ? 'rds-on' : ''}`} onClick={() => setActiveSection('replicas')}>📖 4) Read Scaling</button>
          <button className={`rds-tb ${activeSection === 'sim' ? 'rds-on' : ''}`} onClick={() => setActiveSection('sim')}>🎮 5) Live Simulation</button>
          <button className={`rds-tb ${activeSection === 'advanced' ? 'rds-on' : ''}`} onClick={() => setActiveSection('advanced')}>🚀 6) Advanced Features</button>
          <button className={`rds-tb ${activeSection === 'best' ? 'rds-on' : ''}`} onClick={() => setActiveSection('best')}>🏗️ 7) Best-Practice Guides</button>
        </div>

        {/* Tab 1: Concept & Engines */}
        {activeSection === 'overview' && (
          <div>
            <div className="rds-sec">Amazon RDS — Managed DB Instances inside VPC</div>
            <div className="rds-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                RDS manages the patching, automated backups, software licensing, scaling, and operational overhead of relational engines. Your applications connect directly to standard SQL protocols via managed DNS endpoints.
              </div>
              <div className="rds-grid2" style={{ marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#16a34a' }}>Core Architectural Components</div>
                  <div className="rds-row"><div className="rds-dot">A</div><div><b>DB Instance (Writer):</b> The primary read/write database server instance containing target compute (vCPU) and storage (EBS gp3/io2).</div></div>
                  <div className="rds-row"><div className="rds-dot">B</div><div><b>DB Subnet Group:</b> List of subnets spanning at least two Availability Zones (AZs) in your VPC where RDS can launch resources.</div></div>
                  <div className="rds-row"><div className="rds-dot">C</div><div><b>Security Groups:</b> Network firewall rules limiting inbound access to target DB engines (5432 / 3306) at the elastic network interface.</div></div>
                  <div className="rds-row"><div className="rds-dot">D</div><div><b>DNS Endpoint:</b> Fully Qualified Domain Name (FQDN) mapped to the primary server IP (survives instance recreation).</div></div>
                </div>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#1d4ed8' }}>Common Topologies &amp; Features</div>
                  <div className="rds-row"><div className="rds-dot">1</div><div><b>Multi-AZ Standby:</b> Replicated standby database in an alternate AZ. Receives synchronous transaction updates for immediate DR failover.</div></div>
                  <div className="rds-row"><div className="rds-dot">2</div><div><b>Read Replicas:</b> Scaling nodes receiving asynchronous log streaming. Offload select queries from the primary server.</div></div>
                  <div className="rds-row"><div className="rds-dot">3</div><div><b>RDS Proxy:</b> Highly available connection pooling engine. Mitigates connection bottlenecks and reduces failover interruption time.</div></div>
                </div>
              </div>

              {/* Subnet Groups Zonal SVG */}
              <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff', marginBottom: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>VPC DB Subnet Group Zonal Mapping</div>
                <svg width="100%" viewBox="0 0 680 140" style={{ background: '#faf5ff', borderRadius: '6px', border: '0.5px solid #d8b4fe' }}>
                  {/* AZ boundaries */}
                  <rect x="15" y="15" width="200" height="110" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="115" y="32" textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">Availability Zone a</text>
                  <rect x="25" y="45" width="180" height="70" rx="6" fill="#eff6ff" stroke="#93c5fd" strokeWidth="0.5" />
                  <text x="115" y="60" textAnchor="middle" fontSize="9" fill="#1e3a8a">Subnet A (10.0.1.0/24)</text>
                  <circle cx="115" cy="85" r="10" fill="#16a34a" />
                  <text x="115" y="85" textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#fff" fontWeight="700">W</text>
                  <text x="115" y="105" textAnchor="middle" fontSize="8" fill="#15803d">RDS Instance (Primary)</text>

                  <rect x="240" y="15" width="200" height="110" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="340" y="32" textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">Availability Zone b</text>
                  <rect x="250" y="45" width="180" height="70" rx="6" fill="#eff6ff" stroke="#93c5fd" strokeWidth="0.5" />
                  <text x="340" y="60" textAnchor="middle" fontSize="9" fill="#1e3a8a">Subnet B (10.0.2.0/24)</text>
                  <circle cx="340" cy="85" r="10" fill="#d97706" />
                  <text x="340" y="85" textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#fff" fontWeight="700">S</text>
                  <text x="340" y="105" textAnchor="middle" fontSize="8" fill="#b45309">Standby (Sync Copy)</text>

                  <rect x="465" y="15" width="200" height="110" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="565" y="32" textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">Availability Zone c</text>
                  <rect x="475" y="45" width="180" height="70" rx="6" fill="#eff6ff" stroke="#93c5fd" strokeWidth="0.5" />
                  <text x="565" y="60" textAnchor="middle" fontSize="9" fill="#1e3a8a">Subnet C (10.0.3.0/24)</text>
                  <circle cx="565" cy="85" r="10" fill="#7c3aed" />
                  <text x="565" y="85" textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#fff" fontWeight="700">R</text>
                  <text x="565" y="105" textAnchor="middle" fontSize="8" fill="#6d28d9">Read Replica (Async)</text>
                </svg>
              </div>

              {/* Engine Selector details */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Supported Relational Database Engines</div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {(Object.keys(engineDetails) as EngineType[]).map((eng) => (
                    <button
                      key={eng}
                      onClick={() => setSelectedEngine(eng)}
                      className={`rds-subtb ${selectedEngine === eng ? 'rds-on' : ''}`}
                    >
                      {engineDetails[eng].title.split(' ')[0]} {engineDetails[eng].title.substring(2)}
                    </button>
                  ))}
                </div>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px', color: '#16a34a' }}>
                    {engineDetails[selectedEngine].title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px', lineHeight: '1.45' }}>
                    {engineDetails[selectedEngine].desc}
                  </div>
                  <div className="rds-grid2" style={{ gap: '10px' }}>
                    <div>
                      <div className="rds-sec">Engine Specifications</div>
                      {engineDetails[selectedEngine].specs.map((sp, i) => (
                        <div className="rds-mono" style={{ fontSize: '11px', marginBottom: '4px' }} key={i}>
                          <span style={{ color: '#64748b' }}>{sp.k}:</span> <b>{sp.v}</b>
                        </div>
                      ))}
                    </div>
                    <div>
                      <div className="rds-sec">Ideal workloads</div>
                      <ul className="rds-ck">
                        {engineDetails[selectedEngine].cases.map((cs, i) => (
                          <li key={i}>{cs}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Connectivity & SGs */}
        {activeSection === 'connect' && (
          <div>
            <div className="rds-sec">VPC Network Topology &amp; Security Group Isolation Chain</div>
            <div className="rds-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '12px' }}>
                Relational databases must be isolated inside **private subnets** with **no direct Internet route**. Traffic ingress is restricted via Security Groups, enforcing least-privilege access at the network adapter interface.
              </div>

              {/* VPC Security Group Chain SVG */}
              <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff', marginBottom: '14px' }}>
                <svg width="100%" viewBox="0 0 680 230" style={{ background: '#f8fafc', borderRadius: '6px', border: '0.5px solid #cbd5e1' }}>
                  <defs>
                    <marker id="acn" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#64748b" /></marker>
                    <marker id="acn-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#2563eb" /></marker>
                    <marker id="acn-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#16a34a" /></marker>
                  </defs>
                  
                  {/* VPC boundaries */}
                  <rect x="15" y="10" width="650" height="210" rx="10" fill="none" stroke="#94a3b8" strokeWidth="0.8" />
                  <text x="340" y="24" textAnchor="middle" fontSize="11" fontWeight="600" fill="#64748b">VPC (Virtual Private Cloud)</text>

                  {/* Public Subnets Area */}
                  <rect x="25" y="38" width="180" height="170" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.5" />
                  <text x="115" y="52" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e3a8a">Public Subnets (0.0.0.0/0)</text>
                  
                  {/* ALB Block */}
                  <rect x="40" y="65" width="150" height="50" rx="6" fill="#ffffff" stroke="#2563eb" strokeWidth="1" />
                  <text x="115" y="85" textAnchor="middle" fontSize="10" fontWeight="600" fill="#1e40af">🌐 Load Balancer</text>
                  <text x="115" y="100" textAnchor="middle" fontSize="9" fill="#2563eb">sg-alb (Port 443)</text>

                  {/* Bastion Host */}
                  <rect x="40" y="130" width="150" height="50" rx="6" fill="#ffffff" stroke="#475569" strokeWidth="1" />
                  <text x="115" y="150" textAnchor="middle" fontSize="10" fontWeight="600" fill="#334155">🔒 Bastion Host</text>
                  <text x="115" y="165" textAnchor="middle" fontSize="9" fill="#475569">sg-bastion (SSH 22)</text>

                  {/* Private App Subnets Area */}
                  <rect x="245" y="38" width="180" height="170" rx="8" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="0.5" />
                  <text x="335" y="52" textAnchor="middle" fontSize="9" fontWeight="600" fill="#166534">Private App Subnets</text>
                  
                  {/* EC2 Instance Block */}
                  <rect x="260" y="90" width="150" height="60" rx="6" fill="#ffffff" stroke="#16a34a" strokeWidth="1" />
                  <text x="335" y="115" textAnchor="middle" fontSize="10" fontWeight="600" fill="#14532d">⚙️ Application Tier</text>
                  <text x="335" y="130" textAnchor="middle" fontSize="9" fill="#16a34a">sg-app (allow from sg-alb)</text>

                  {/* Private DB Subnets Area */}
                  <rect x="465" y="38" width="180" height="170" rx="8" fill="#faf5ff" stroke="#e9d5ff" strokeWidth="0.5" />
                  <text x="555" y="52" textAnchor="middle" fontSize="9" fontWeight="600" fill="#581c87">Private DB Subnets</text>
                  
                  {/* RDS Writer Block */}
                  <rect x="480" y="90" width="150" height="60" rx="6" fill="#ffffff" stroke="#7c3aed" strokeWidth="1" />
                  <text x="555" y="115" textAnchor="middle" fontSize="10" fontWeight="600" fill="#4c1d95">🗄️ Amazon RDS DB</text>
                  <text x="555" y="130" textAnchor="middle" fontSize="9" fill="#7c3aed">sg-db (allow 5432/3306)</text>

                  {/* Arrow connectors */}
                  {/* ALB -> App */}
                  <path d="M 190 90 L 260 110" fill="none" stroke="#2563eb" strokeWidth="1.2" markerEnd="url(#acn-blue)" />
                  <text x="225" y="94" fontSize="8" fill="#1d4ed8" fontWeight="600">HTTP/8080</text>
                  
                  {/* App -> DB */}
                  <path d="M 410 120 L 480 120" fill="none" stroke="#16a34a" strokeWidth="1.2" markerEnd="url(#acn-green)" />
                  <text x="445" y="114" fontSize="8" fill="#15803d" fontWeight="600">SQL/5432</text>

                  {/* Bastion -> DB */}
                  <path d="M 190 155 L 480 135" fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" markerEnd="url(#acn)" />
                  <text x="250" y="162" fontSize="8" fill="#475569">Admin SSH Tunneled SQL</text>
                </svg>
              </div>

              {/* Connectivity details */}
              <div className="rds-grid2" style={{ gap: '12px' }}>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#1e3a8a' }}>Standard Connectivity Best Practices</div>
                  <ul className="rds-ck">
                    <li><b>Publicly Accessible = False:</b> Disables generation of internet-routable IP addresses. Even if VPC gateways are present, DNS will resolve strictly to internal IPs.</li>
                    <li><b>Private VPC Subnets:</b> Always associate RDS Subnet Groups with subnets that lack a route pointing to the Internet Gateway (IGW) route table.</li>
                    <li><b>Port Enforcements:</b> Configure custom default listening ports (e.g. 5439 for PostgreSQL instead of 5432) to avoid passive bot scanner detection in degraded states.</li>
                  </ul>
                </div>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#166534' }}>IAM Database Authentication</div>
                  <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5', marginBottom: '6px' }}>
                    Instead of standard static database usernames and passwords, applications request short-lived IAM credentials (token validity limit is 15 minutes) using IAM signature V4.
                  </div>
                  <ul className="rds-ck">
                    <li>No long-term passwords stored on instance or configuration files</li>
                    <li>Fine-grained IAM policy bindings restrict access by role/identity</li>
                    <li>Mandates SSL/TLS connections for all authenticating users</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: High Availability Multi-AZ */}
        {activeSection === 'multiaz' && (
          <div>
            <div className="rds-sec">AWS RDS Multi-AZ Deployment Model</div>
            <div className="rds-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                RDS Multi-AZ places a **Primary active instance** in one AZ and a **Passive standby instance** in a second AZ. Transactions are committed **synchronously** to both disks before the engine returns an acknowledgment.
              </div>

              {/* HA Multi-AZ Flow SVG */}
              <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff', marginBottom: '14px' }}>
                <svg width="100%" viewBox="0 0 680 180" style={{ background: '#fffbeb', borderRadius: '6px', border: '0.5px solid #fde68a' }}>
                  <defs>
                    <marker id="amz" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#b45309" /></marker>
                    <marker id="amz-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#2563eb" /></marker>
                    <marker id="amz-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#16a34a" /></marker>
                  </defs>

                  {/* AZ boxes */}
                  <rect x="20" y="15" width="290" height="150" rx="8" fill="#ffffff" stroke="#fcd34d" strokeWidth="0.8" />
                  <text x="165" y="32" textAnchor="middle" fontSize="11" fontWeight="600" fill="#b45309">Availability Zone A (Active)</text>

                  {/* Primary DB */}
                  <rect x="40" y="45" width="250" height="100" rx="6" fill="#dcfce7" stroke="#16a34a" strokeWidth="1" />
                  <text x="165" y="70" textAnchor="middle" fontSize="12" fontWeight="600" fill="#14532d">✍️ Primary DB Instance</text>
                  <text x="165" y="90" textAnchor="middle" fontSize="9" fill="#166534">Endpoint: primary.cluster.rds.amazonaws.com</text>
                  <text x="165" y="110" textAnchor="middle" fontSize="9" fill="#166534">Status: Active &amp; Serving Client Connections</text>

                  <rect x="370" y="15" width="290" height="150" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="0.8" />
                  <text x="515" y="32" textAnchor="middle" fontSize="11" fontWeight="600" fill="#475569">Availability Zone B (Standby)</text>

                  {/* Standby DB */}
                  <rect x="390" y="45" width="250" height="100" rx="6" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
                  <text x="515" y="70" textAnchor="middle" fontSize="12" fontWeight="600" fill="#7c2d12">🛡️ Standby DB Instance</text>
                  <text x="515" y="90" textAnchor="middle" fontSize="9" fill="#9a3412">Shares same Endpoint (CNAME pointer)</text>
                  <text x="515" y="110" textAnchor="middle" fontSize="9" fill="#9a3412">Status: Passive standby. No active reads allowed.</text>

                  {/* Sync replication line */}
                  <path d="M 290 95 L 390 95" fill="none" stroke="#16a34a" strokeWidth="2.5" markerEnd="url(#amz-green)" />
                  <text x="340" y="85" textAnchor="middle" fontSize="9" fontWeight="600" fill="#15803d">SYNCHRONOUS</text>
                  <text x="340" y="115" textAnchor="middle" fontSize="9" fill="#15803d">Block Replication</text>
                </svg>
              </div>

              {/* What You Get & Gotchas from original file */}
              <div className="rds-grid2" style={{ gap: '12px' }}>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#16a34a' }}>What You Get (Benefits)</div>
                  <ul className="rds-ck">
                    <li><b>High Availability &amp; DR:</b> Mitigates hardware errors, hypervisor crashes, network path outages, and total datacenter failures.</li>
                    <li><b>Zero App Code Changes:</b> RDS handles physical IP modifications on the DNS mapping. The connection endpoint FQDN remains identical.</li>
                    <li><b>Zero Data Loss:</b> Synchronous commits guarantee that Standby has exact identical transaction pages before the client is acknowledged.</li>
                    <li><b>Backups offloaded:</b> Automated daily snapshots are conducted directly from the Standby, avoiding I/O suspension on Primary.</li>
                  </ul>
                </div>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#dc2626' }}>Important Trade-offs</div>
                  <ul className="rds-wn">
                    <li><b>Standby is NOT readable:</b> You pay for double the compute and double the storage, but Standby serves zero application reads.</li>
                    <li><b>Slight Write Latency:</b> Because blocks must commit on alternate hardware and network AZ channels before returning, writes are marginally slower than Single-AZ.</li>
                    <li><b>Failover Timeline (30–60s):</b> Standard failover takes time (Detect &rarr; Evict primary &rarr; Propagate DNS CNAME change &rarr; Standby starts recovery &rarr; In-service).</li>
                  </ul>
                </div>
              </div>

              {/* Failover timeline playbooks */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>5-Step Failover Transition Timeline</div>
                <div className="rds-grid2" style={{ gap: '8px' }}>
                  <div className="rds-row">
                    <div className="rds-dot">1</div>
                    <div><b>Detection:</b> Health monitor probes detect unresponsive writer in AZ-a (heartbeat loss or infrastructure events).</div>
                  </div>
                  <div className="rds-row">
                    <div className="rds-dot">2</div>
                    <div><b>Eviction:</b> RDS API blocks active virtual network cards on AZ-a instance, isolating the damaged writer.</div>
                  </div>
                  <div className="rds-row">
                    <div className="rds-dot">3</div>
                    <div><b>DNS Shifting:</b> RDS adjusts the canonical name (CNAME) mapping of the endpoint from the old physical IP to AZ-b.</div>
                  </div>
                  <div className="rds-row">
                    <div className="rds-dot">4</div>
                    <div><b>Promotion:</b> Standby database in AZ-b starts database crash recovery processes, replaying transaction log entries.</div>
                  </div>
                  <div className="rds-row" style={{ gridColumn: 'span 2' }}>
                    <div className="rds-dot">5</div>
                    <div><b>Active Status:</b> Promoted instance completes recovery, mounts the database engine, and begins accepting application traffic. Standard failover time is 30–60 seconds (reduced to &lt; 15 seconds if utilizing RDS Proxy connection handlers).</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 4: Read Replicas & Scaling */}
        {activeSection === 'replicas' && (
          <div>
            <div className="rds-sec">AWS RDS Read Replicas Scaling Model</div>
            <div className="rds-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                Read Replicas scale query performance by offloading read traffic from the Primary database. Replication uses **asynchronous log streaming** (WAL streaming or binary logs), resulting in potential replica lag.
              </div>

              {/* Read Scaling SVG */}
              <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff', marginBottom: '14px' }}>
                <svg width="100%" viewBox="0 0 680 180" style={{ background: '#ede9fe', borderRadius: '6px', border: '0.5px solid #ddd6fe' }}>
                  <defs>
                    <marker id="arr-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#7c3aed" /></marker>
                    <marker id="arr-blue2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#2563eb" /></marker>
                  </defs>

                  {/* Primary DB */}
                  <rect x="30" y="45" width="200" height="90" rx="6" fill="#dcfce7" stroke="#16a34a" strokeWidth="1" />
                  <text x="130" y="70" textAnchor="middle" fontSize="12" fontWeight="600" fill="#14532d">✍️ Primary Writer</text>
                  <text x="130" y="90" textAnchor="middle" fontSize="9" fill="#166534">Endpoint: db.writer.cluster</text>
                  <text x="130" y="110" textAnchor="middle" fontSize="9" fill="#166534">Handles 100% of Write Queries</text>

                  {/* Replica 1 */}
                  <rect x="420" y="20" width="220" height="60" rx="6" fill="#faf5ff" stroke="#7c3aed" strokeWidth="1" />
                  <text x="530" y="42" textAnchor="middle" fontSize="11" fontWeight="600" fill="#581c87">📖 Read Replica 1</text>
                  <text x="530" y="60" textAnchor="middle" fontSize="9" fill="#6d28d9">Endpoint: replica-1.domain.amazonaws.com</text>

                  {/* Replica 2 */}
                  <rect x="420" y="100" width="220" height="60" rx="6" fill="#faf5ff" stroke="#7c3aed" strokeWidth="1" />
                  <text x="530" y="122" textAnchor="middle" fontSize="11" fontWeight="600" fill="#581c87">📖 Read Replica 2</text>
                  <text x="530" y="140" textAnchor="middle" fontSize="9" fill="#6d28d9">Endpoint: replica-2.domain.amazonaws.com</text>

                  {/* Async replication lines */}
                  <path d="M 230 75 L 420 45" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4,2" markerEnd="url(#arr-purple)" />
                  <path d="M 230 105 L 420 135" fill="none" stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="4,2" markerEnd="url(#arr-purple)" />
                  <text x="310" y="70" textAnchor="middle" fontSize="9" fontWeight="600" fill="#6d28d9">ASYNCHRONOUS</text>
                  <text x="310" y="115" textAnchor="middle" fontSize="9" fill="#6d28d9">WAL / binlog stream</text>
                </svg>
              </div>

              {/* What It's Good For & Gotchas from original file */}
              <div className="rds-grid2" style={{ gap: '12px' }}>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#1d4ed8' }}>Ideal Scaling Workloads</div>
                  <ul className="rds-ck">
                    <li><b>Read Scaling:</b> Distribute heavy query traffic (reporting dashboards, read-only feeds, search routes) across up to 5 individual replicas.</li>
                    <li><b>Offload Analytics:</b> Run complex SQL analytics queries without locking rows or utilizing compute resources on your Primary transaction DB.</li>
                    <li><b>Cross-Region DR:</b> Build replicas in different geographical regions to achieve local low-latency reads for global users and warm backup disaster recovery.</li>
                  </ul>
                </div>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#dc2626' }}>Gotchas &amp; Replica Lag</div>
                  <ul className="rds-wn">
                    <li><b>Asynchronous Lag:</b> Replicas are usually split seconds or even minutes behind the primary. Monitor the `ReplicaLag` CloudWatch metric.</li>
                    <li><b>Stale Reads:</b> Reading a row immediately after updating it on the writer may return the old data if the client gets routed to a lagging replica.</li>
                    <li><b>Promotion Overhead:</b> Replicas can be promoted to a primary standalone database, but this is a manual lifecycle event that severs replication pipelines.</li>
                  </ul>
                </div>
              </div>

              {/* Replica Types by Engine */}
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Replica Parameters by Database Engine</div>
                <div className="rds-grid3">
                  <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '10px', background: '#f8fafc' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px', color: '#16a34a' }}>PostgreSQL / MySQL</div>
                    <div className="rds-mono" style={{ fontSize: '11px', marginBottom: '3px' }}><span style={{ color: '#64748b' }}>Limit:</span> 5 active replicas</div>
                    <div className="rds-mono" style={{ fontSize: '11px', marginBottom: '3px' }}><span style={{ color: '#64748b' }}>Replication:</span> WAL / binlog streams</div>
                    <div className="rds-mono" style={{ fontSize: '11px' }}><span style={{ color: '#64748b' }}>Cross-Region:</span> ✅ Fully Supported</div>
                  </div>
                  <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '10px', background: '#f8fafc' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px', color: '#7c3aed' }}>Amazon Aurora</div>
                    <div className="rds-mono" style={{ fontSize: '11px', marginBottom: '3px' }}><span style={{ color: '#64748b' }}>Limit:</span> 15 cluster replicas</div>
                    <div className="rds-mono" style={{ fontSize: '11px', marginBottom: '3px' }}><span style={{ color: '#64748b' }}>Replication:</span> Shared storage (no lag)</div>
                    <div className="rds-mono" style={{ fontSize: '11px' }}><span style={{ color: '#64748b' }}>Promotion:</span> Automatic (&lt; 30s failover)</div>
                  </div>
                  <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '10px', background: '#f8fafc' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '4px', color: '#dc2626' }}>SQL Server / Oracle</div>
                    <div className="rds-mono" style={{ fontSize: '11px', marginBottom: '3px' }}><span style={{ color: '#64748b' }}>Limit:</span> ❌ Not supported on standard RDS</div>
                    <div className="rds-mono" style={{ fontSize: '11px', marginBottom: '3px' }}><span style={{ color: '#64748b' }}>HA Type:</span> Multi-AZ only (standby)</div>
                    <div className="rds-mono" style={{ fontSize: '11px' }}><span style={{ color: '#64748b' }}>Scale alternative:</span> ElastiCache / Redis caching</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 5: Live Simulation */}
        {activeSection === 'sim' && (
          <div>
            <div className="rds-sec">Interactive Traffic Routing, Replication Lag &amp; Failover Simulation</div>
            <div className="rds-card">
              <div className="rds-controls">
                <div className="rds-ctrl">
                  <label>Deployment Mode</label>
                  <select value={mode} onChange={(e) => setMode(e.target.value as any)}>
                    <option value="single">Single-AZ (Writer instance only)</option>
                    <option value="multi">Multi-AZ HA (Writer + Synchronous Standby)</option>
                    <option value="multi_rr">Multi-AZ + 2 Read Replicas (HA &amp; Read Scaled)</option>
                  </select>
                  <div className="out">Mode: <b>{mode === 'single' ? 'Single-AZ' : mode === 'multi' ? 'Multi-AZ' : 'Multi-AZ + 2 Replicas'}</b></div>
                </div>

                <div className="rds-ctrl">
                  <label>Read Routing Configuration</label>
                  <select value={readRoute} onChange={(e) => setReadRoute(e.target.value as any)}>
                    <option value="writer">Reads &rarr; Writer endpoint directly (Strong Consistency)</option>
                    <option value="replicas">Reads &rarr; Replicas (if present, else Writer)</option>
                    <option value="smart">Smart Routing: force Writer within 10s of writes, else Replicas</option>
                  </select>
                  <div className="out">Strategy: <b>{readRoute.toUpperCase()}</b></div>
                </div>

                <div className="rds-ctrl">
                  <label>Client Traffic Volume (TPS Load)</label>
                  <input type="range" min="10" max="400" value={tps} onChange={(e) => setTps(Number(e.target.value))} />
                  <div className="out">Total Load: <b>{tps} TPS</b> (Writes: 25% | Reads: 75%)</div>
                </div>

                <div className="rds-ctrl">
                  <label>Replica Lag Delay (seconds)</label>
                  <input type="range" min="0" max="30" value={lag} onChange={(e) => setLag(Number(e.target.value))} disabled={mode !== 'multi_rr'} />
                  <div className="out">Active Delay: <b>{lag} seconds</b></div>
                </div>
              </div>

              {/* KPI metrics block */}
              <div className="rds-kpi">
                <div className="rds-k"><div className="rds-k-t">Writer TPS Load</div><div className="rds-v">{metrics.writerTps}</div></div>
                <div className="rds-k"><div className="rds-k-t">Replica TPS (each)</div><div className="rds-v">{metrics.replicaEach !== null ? metrics.replicaEach : '—'}</div></div>
                <div className="rds-k"><div className="rds-k-t">Failover Cluster State</div><div className="rds-v" style={{ color: azFailed ? (mode === 'single' ? '#dc2626' : '#ea580c') : '#16a34a' }}>{metrics.failState}</div></div>
                <div className="rds-k"><div className="rds-k-t">Stale Read Risk</div><div className="rds-v" style={{ color: metrics.stale === 'High' ? '#dc2626' : metrics.stale === 'Med' ? '#d97706' : '#16a34a' }}>{metrics.stale}</div></div>
              </div>

              {/* Action button bar */}
              <div className="rds-btnbar">
                <button className="rds-btn rds-primary" onClick={sendWrite}>✍️ Simulate WRITE</button>
                <button className="rds-btn" onClick={sendRead}>📖 Simulate READ</button>
                <button className="rds-btn" onClick={toggleAzFail} style={{ border: '0.5px solid #ef4444', color: '#dc2626' }}>⚡ Toggle AZ Failure</button>
                <button className="rds-btn" onClick={resetSim}>🔄 Reset Sim</button>
              </div>
              {/* Live diagram & Active Log side-by-side */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'stretch', marginTop: '14px' }}>
                <div style={{ flex: 7, border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>Live Active Traffic Ingress Diagram</div>
                    <svg ref={svgRef} width="100%" viewBox="0 0 680 260" style={{ background: 'var(--color-background-primary, #ffffff)', border: '0.5px solid #e2e8f0', borderRadius: '6px' }} />
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', lineHeight: '1.45' }}>
                    💡 <b>Tip:</b> Toggling AZ failure with Multi-AZ enabled demonstrates automatic node shift: traffic is seamlessly routed to AZ-b, and replica connections are maintained without downtime. In Single-AZ, writes fail immediately.
                  </div>
                </div>

                <div style={{ flex: 3, position: 'relative' }}>
                  <div className="rds-log" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, marginTop: 0, minHeight: 'unset', maxHeight: 'none', overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: logHtml }} />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 6: Advanced Features */}
        {activeSection === 'advanced' && (
          <div>
            <div className="rds-sec">Advanced Enterprise Features: Backup Slider, Cloning, SGs, ML &amp; RDS Proxy</div>
            <div className="rds-card">
              
              {/* Feature sub-tabs */}
              <div className="rds-subtabs">
                <button className={`rds-subtb ${activeFeatureTab === 'backup' ? 'rds-on' : ''}`} onClick={() => setActiveFeatureTab('backup')}>💾 6.1) Backup &amp; Restore</button>
                <button className={`rds-subtb ${activeFeatureTab === 'clone' ? 'rds-on' : ''}`} onClick={() => setActiveFeatureTab('clone')}>🧬 6.2) DB Cloning</button>
                <button className={`rds-subtb ${activeFeatureTab === 'security' ? 'rds-on' : ''}`} onClick={() => setActiveFeatureTab('security')}>🔒 6.3) Security Checklist</button>
                <button className={`rds-subtb ${activeFeatureTab === 'ml' ? 'rds-on' : ''}`} onClick={() => setActiveFeatureTab('ml')}>🤖 6.4) ML Integration</button>
                <button className={`rds-subtb ${activeFeatureTab === 'proxy' ? 'rds-on' : ''}`} onClick={() => setActiveFeatureTab('proxy')}>🔀 6.5) RDS Proxy Calculator</button>
              </div>

              {/* Sub-tab 6.1: Backup & Restore */}
              {activeFeatureTab === 'backup' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Point-in-Time Recovery (PITR) Daily Snapshots Simulator</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px', lineHeight: '1.45' }}>
                    RDS automated backups take daily full snapshots of storage volumes, combined with continuous upload of transaction logs (WAL/binlog segments) to Amazon S3 every 5 minutes.
                  </div>
                  
                  <div className="rds-ctrl" style={{ marginBottom: '12px' }}>
                    <label>Set Backup Retention Window (Days)</label>
                    <input type="range" min="1" max="35" value={pitrDays} onChange={(e) => setPitrDays(Number(e.target.value))} />
                    <div className="out">Retention Period: <b>{pitrDays} days</b> (Range: 1–35 days)</div>
                  </div>

                  <div className="rds-grid2" style={{ gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: '#16a34a' }}>Restore Granularity</div>
                      <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                        With {pitrDays} days retention, you can spin up a new database instance at <b>any exact second</b> during the past {pitrDays} days, down to the last transaction commit.
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
                        * RDS streams the nearest daily snapshot, then plays forward the continuous transaction logs up to your requested millisecond timeline.
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: '#1d4ed8' }}>Storage Considerations</div>
                      <ul className="rds-ck" style={{ fontSize: '11px' }}>
                        <li>Daily Snapshots: Incremental storage saving (only changed database blocks).</li>
                        <li>S3 Upload: Continual streaming of transaction logs has minimal network hit.</li>
                        <li>Retaining backups: Backups within window have free storage up to 100% of DB size.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Comparison table */}
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px' }}>Automated Daily Backups vs Manual Snapshots</div>
                  <table className="rds-table">
                    <thead>
                      <tr>
                        <th>Parameter</th>
                        <th>Automated Backups</th>
                        <th>Manual DB Snapshots</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><b>Trigger</b></td>
                        <td>Automatic (configured daily maintenance window)</td>
                        <td>User triggered (via console, SDK, or CLI)</td>
                      </tr>
                      <tr>
                        <td><b>Retention limit</b></td>
                        <td>1 to 35 days (deleted automatically outside window)</td>
                        <td>Infinite (exists until explicitly deleted by user)</td>
                      </tr>
                      <tr>
                        <td><b>Deletion on DB termination</b></td>
                        <td>Permanently deleted (option to retain snapshot)</td>
                        <td>Retained in account (must delete manually)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub-tab 6.2: DB Cloning */}
              {activeFeatureTab === 'clone' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Aurora Database Cloning vs Standard RDS Restore Methods</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px', lineHeight: '1.45' }}>
                    Unlike standard restore operations which physically write duplicate database pages (taking hours), **Aurora Database Cloning** uses **Copy-on-Write metadata pointers**, duplicating database structures instantly.
                  </div>

                  <table className="rds-table" style={{ marginBottom: '12px' }}>
                    <thead>
                      <tr>
                        <th>Metric</th>
                        <th>Standard RDS Snapshot Restore</th>
                        <th>Aurora Copy-on-Write Database Clone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cloneRows.map((row, idx) => (
                        <tr key={idx}>
                          <td><b>{row[0]}</b></td>
                          <td>{row[1]}</td>
                          <td style={{ color: '#16a34a', fontWeight: '500' }}>{row[2]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div style={{ background: '#eff6ff', border: '0.5px solid #bfdbfe', borderRadius: '8px', padding: '10px', fontSize: '11px', color: '#1e40af' }}>
                    💡 <b>Deep Dive:</b> Under copy-on-write, when a transaction modifies a table in the cloned database, the shared storage system allocates a new block, writes the updated record, and redirects the clone's pointer there. The original production database remains completely untouched and incurs zero storage size increases.
                  </div>
                </div>
              )}

              {/* Sub-tab 6.3: Security Checklist */}
              {activeFeatureTab === 'security' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Interactive Database Hardening Checklist</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px', lineHeight: '1.45' }}>
                    Deploying databases in production requires strict adherence to security best practices. Toggle items below to evaluate database compliance status.
                  </div>

                  <div className="rds-grid2" style={{ gap: '10px', marginBottom: '12px' }}>
                    {secItems.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleSecItem(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px',
                          border: '0.5px solid #cbd5e1',
                          borderRadius: '8px',
                          background: item.done ? '#f0fdf4' : '#fffbeb',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ fontSize: '16px' }}>{item.done ? '✅' : '⬜'}</div>
                        <div style={{ fontSize: '12px', fontWeight: 500, color: item.done ? '#166534' : '#9a3412' }}>
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '12px', fontSize: '12px' }}>
                    <div>Total Evaluated Rules: <b>{secItems.length}</b></div>
                    <div style={{ color: '#16a34a' }}>Passed: <b>{secItems.filter(i => i.done).length}</b></div>
                    <div style={{ color: '#b45309' }}>Remaining: <b>{secItems.filter(i => !i.done).length}</b></div>
                  </div>
                </div>
              )}

              {/* Sub-tab 6.4: ML Integration */}
              {activeFeatureTab === 'ml' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Machine Learning &amp; AI Query Patterns in RDS</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px', lineHeight: '1.45' }}>
                    Integrate your database with AI endpoints. Leverage App-layer inferences, invoke AWS SageMaker via AWS Lambda bridges, or utilize high-throughput Postgres `pgml` extensions directly inside SQL queries.
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <button
                      className={`rds-subtb ${activeMlQuery === 'sentiment' ? 'rds-on-purple' : ''}`}
                      onClick={() => setActiveMlQuery('sentiment')}
                    >
                      🗣️ Sentiment Analyzer (SageMaker/Lambda)
                    </button>
                    <button
                      className={`rds-subtb ${activeMlQuery === 'fraud' ? 'rds-on-purple' : ''}`}
                      onClick={() => setActiveMlQuery('fraud')}
                    >
                      💳 Fraud Inbound Evaluator
                    </button>
                    <button
                      className={`rds-subtb ${activeMlQuery === 'churn' ? 'rds-on-purple' : ''}`}
                      onClick={() => setActiveMlQuery('churn')}
                    >
                      📈 Churn Prediction Models
                    </button>
                  </div>

                  <div className="rds-grid2" style={{ gap: '12px' }}>
                    <div>
                      <div className="rds-sec">Database ML Integration SQL Pattern</div>
                      <div className="rds-code-container">
                        <div className="rds-code">
                          {activeMlQuery === 'sentiment' && mlFlows.lambda.sql}
                          {activeMlQuery === 'fraud' && mlFlows.app.sql}
                          {activeMlQuery === 'churn' && mlFlows.pgml.sql}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '14px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#7c3aed', marginBottom: '6px' }}>Pattern Architectural Benefits</div>
                      <ul className="rds-ck" style={{ fontSize: '11px' }}>
                        <li><b>Data Gravity:</b> Evaluating predictions directly in DB SQL queries reduces round-trip application latencies.</li>
                        <li><b>Scalable Inferences:</b> AWS Lambda bridge isolates intensive scoring workloads from base database CPU allocations.</li>
                        <li><b>SQL Simplification:</b> Analysts query machine learning parameters using simple standard `SELECT` blocks.</li>
                      </ul>
                      <div style={{ fontSize: '11px', fontWeight: 600, marginTop: '8px', color: '#334155' }}>
                        {activeMlQuery === 'sentiment' && mlFlows.lambda.note}
                        {activeMlQuery === 'fraud' && mlFlows.app.note}
                        {activeMlQuery === 'churn' && mlFlows.pgml.note}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 6.5: RDS Proxy Calculator */}
              {activeFeatureTab === 'proxy' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Interactive Connection Pooling &amp; Concurrency Calculator</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px', lineHeight: '1.45' }}>
                    RDS Proxy pools and shares database connections. Lambda concurrency spikes or application connection surges are throttled, preventing database server out-of-memory crashes.
                  </div>

                  <div className="rds-ctrl" style={{ marginBottom: '14px' }}>
                    <label>Active App / Lambda Ingress Connections Surge</label>
                    <input type="range" min="10" max="1000" value={proxyConcurrency} onChange={(e) => setProxyConcurrency(Number(e.target.value))} />
                    <div className="out">Incoming Surge: <b>{proxyConcurrency} Active Connections</b></div>
                  </div>

                  <div className="rds-grid3" style={{ marginBottom: '12px' }}>
                    <div className="rds-k">
                      <div className="rds-k-t">Surge Load</div>
                      <div className="rds-v" style={{ color: '#ef4444' }}>{proxyConcurrency} Clients</div>
                    </div>
                    <div className="rds-k">
                      <div className="rds-k-t">Pooled DB Connections</div>
                      <div className="rds-v" style={{ color: '#16a34a' }}>
                        {Math.max(10, Math.min(60, Math.round(proxyConcurrency * 0.05 + 8)))} Connections
                      </div>
                    </div>
                    <div className="rds-k">
                      <div className="rds-k-t">DB CPU Savings Ratio</div>
                      <div className="rds-v" style={{ color: '#2563eb' }}>
                        {Math.round((1 - (Math.max(10, Math.min(60, Math.round(proxyConcurrency * 0.05 + 8))) / proxyConcurrency)) * 100)}%
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0', borderRadius: '8px', padding: '12px', fontSize: '12px', lineHeight: '1.5' }}>
                    🚀 <b>Proxy Connection Pooling Advantage:</b> Without RDS Proxy, launching {proxyConcurrency} lambda functions concurrently opens {proxyConcurrency} direct TCP connections, exhausting database thread limits (`max_connections`) and triggering "Too many connections" SQL faults. With the Proxy active, it maps the surge down to a stable socket pool of just <b>{Math.max(10, Math.min(60, Math.round(proxyConcurrency * 0.05 + 8)))}</b> active DB backends!
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Tab 7: Best-Practice Guides */}
        {activeSection === 'best' && (
          <div>
            <div className="rds-sec">Best-Practice RDS Architecture, SGs, Proxy &amp; Checklist Guides</div>
            <div className="rds-card">
              
              {/* Guides Sub-tabs */}
              <div className="rds-subtabs">
                <button className={`rds-subtb ${bestTab === 'arch' ? 'rds-on' : ''}`} onClick={() => setBestTab('arch')}>🏗️ Architecture Map</button>
                <button className={`rds-subtb ${bestTab === 'sg' ? 'rds-on' : ''}`} onClick={() => setBestTab('sg')}>🔒 Security Group Chain</button>
                <button className={`rds-subtb ${bestTab === 'proxy' ? 'rds-on' : ''}`} onClick={() => setBestTab('proxy')}>🔄 RDS Proxy Guides</button>
                <button className={`rds-subtb ${bestTab === 'multiaz' ? 'rds-on' : ''}`} onClick={() => setBestTab('multiaz')}>🛡️ Multi-AZ Comparison</button>
                <button className={`rds-subtb ${bestTab === 'replicas' ? 'rds-on' : ''}`} onClick={() => setBestTab('replicas')}>📖 Replica Strategies</button>
                <button className={`rds-subtb ${bestTab === 'engines' ? 'rds-on' : ''}`} onClick={() => setBestTab('engines')}>⚖️ Engines Grid</button>
                <button className={`rds-subtb ${bestTab === 'checklist' ? 'rds-on' : ''}`} onClick={() => setBestTab('checklist')}>✅ Audit Checklist</button>
              </div>

              {/* Sub-tab bestTab: arch */}
              {bestTab === 'arch' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Production Grade AWS RDS Topology</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '10px' }}>
                    Multi-AZ Standby combined with scale-out Read Replicas and RDS Proxy in a private VPC layout.
                  </div>

                  <svg width="100%" viewBox="0 0 660 480" style={{ display: 'block', background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '8px' }}>
                    <defs>
                      <marker id="arr-g" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#16a34a" /></marker>
                      <marker id="arr-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#2563eb" /></marker>
                      <marker id="arr-p" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#7c3aed" /></marker>
                    </defs>

                    <text x="330" y="24" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600">VPC (Spanning 3 Availability Zones)</text>

                    {/* PUBLIC SUBNETS */}
                    <rect x="20" y="38" width="620" height="60" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.5"/>
                    <text x="330" y="52" textAnchor="middle" fontSize="9" fill="#1d4ed8" fontWeight="600">PUBLIC SUBNETS</text>
                    <rect x="50" y="60" width="160" height="28" rx="4" fill="#ffffff" stroke="#93c5fd" strokeWidth="0.5"/>
                    <text x="130" y="77" textAnchor="middle" fontSize="10" fill="#1d4ed8" fontWeight="600">🌐 Internet ALB</text>
                    <rect x="250" y="60" width="160" height="28" rx="4" fill="#ffffff" stroke="#93c5fd" strokeWidth="0.5"/>
                    <text x="330" y="77" textAnchor="middle" fontSize="10" fill="#1d4ed8" fontWeight="600">🔒 WAF Firewall</text>
                    <rect x="450" y="60" width="160" height="28" rx="4" fill="#ffffff" stroke="#93c5fd" strokeWidth="0.5"/>
                    <text x="530" y="77" textAnchor="middle" fontSize="10" fill="#1d4ed8" fontWeight="600">🌍 NAT Gateway</text>

                    {/* PRIVATE APP SUBNETS */}
                    <rect x="20" y="112" width="620" height="75" rx="6" fill="#f0fdf4" stroke="#bbf7d0" strokeWidth="0.5"/>
                    <text x="330" y="125" textAnchor="middle" fontSize="9" fill="#15803d" fontWeight="600">PRIVATE APPLICATION TIER</text>
                    <rect x="50" y="135" width="160" height="40" rx="4" fill="#ffffff" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="130" y="152" textAnchor="middle" fontSize="10" fill="#15803d" fontWeight="600">⚙️ App EC2 / ECS</text>
                    <text x="130" y="165" textAnchor="middle" fontSize="8" fill="#166534">runs database driver</text>
                    
                    <rect x="250" y="135" width="160" height="40" rx="4" fill="#ffffff" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="330" y="152" textAnchor="middle" fontSize="10" fill="#15803d" fontWeight="600">🔄 RDS Proxy Endpoint</text>
                    <text x="330" y="165" textAnchor="middle" fontSize="8" fill="#166534">Survives Failovers Instantly</text>

                    <rect x="450" y="135" width="160" height="40" rx="4" fill="#ffffff" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="530" y="152" textAnchor="middle" fontSize="10" fill="#15803d" fontWeight="600">🔑 Secrets Manager</text>
                    <text x="530" y="165" textAnchor="middle" fontSize="8" fill="#166534">IAM password rotations</text>

                    {/* PRIVATE DB SUBNETS */}
                    <rect x="20" y="200" width="620" height="260" rx="6" fill="#fffbeb" stroke="#fcd34d" strokeWidth="0.5"/>
                    <text x="330" y="215" textAnchor="middle" fontSize="9" fill="#b45309" fontWeight="600">PRIVATE DB SUBNETS (ISOLATED)</text>

                    {/* AZ-1 */}
                    <rect x="35" y="225" width="180" height="220" rx="6" fill="#ffffff" stroke="#fbbf24" strokeWidth="0.5"/>
                    <text x="125" y="240" textAnchor="middle" fontSize="9" fontWeight="600" fill="#78350f">Subnet AZ-a</text>
                    <rect x="45" y="250" width="160" height="50" rx="4" fill="#dcfce7" stroke="#16a34a" strokeWidth="0.5"/>
                    <text x="125" y="272" textAnchor="middle" fontSize="10" fill="#14532d" fontWeight="600">✍️ Primary Writer</text>
                    <text x="125" y="288" textAnchor="middle" fontSize="8" fill="#14532d">sg-db | Active Primary</text>

                    <rect x="45" y="315" width="160" height="50" rx="4" fill="#faf5ff" stroke="#7c3aed" strokeWidth="0.5"/>
                    <text x="125" y="337" textAnchor="middle" fontSize="10" fill="#581c87" fontWeight="600">📖 Read Replica 1</text>
                    <text x="125" y="352" textAnchor="middle" fontSize="8" fill="#581c87">Asynchronous Copy</text>

                    {/* AZ-2 */}
                    <rect x="240" y="225" width="180" height="220" rx="6" fill="#ffffff" stroke="#fbbf24" strokeWidth="0.5"/>
                    <text x="330" y="240" textAnchor="middle" fontSize="9" fontWeight="600" fill="#78350f">Subnet AZ-b</text>
                    <rect x="250" y="250" width="160" height="50" rx="4" fill="#fffbeb" stroke="#d97706" strokeWidth="0.5"/>
                    <text x="330" y="272" textAnchor="middle" fontSize="10" fill="#7c2d12" fontWeight="600">🛡️ Standby Replica</text>
                    <text x="330" y="288" textAnchor="middle" fontSize="8" fill="#7c2d12">Synchronous HA Standby</text>

                    <rect x="250" y="315" width="160" height="50" rx="4" fill="#faf5ff" stroke="#7c3aed" strokeWidth="0.5"/>
                    <text x="330" y="337" textAnchor="middle" fontSize="10" fill="#581c87" fontWeight="600">📖 Read Replica 2</text>
                    <text x="330" y="352" textAnchor="middle" fontSize="8" fill="#581c87">Asynchronous Copy</text>

                    {/* AZ-3 */}
                    <rect x="445" y="225" width="180" height="220" rx="6" fill="#ffffff" stroke="#fbbf24" strokeWidth="0.5"/>
                    <text x="535" y="240" textAnchor="middle" fontSize="9" fontWeight="600" fill="#78350f">Subnet AZ-c</text>
                    <rect x="455" y="250" width="160" height="50" rx="4" fill="#faf5ff" stroke="#7c3aed" strokeWidth="0.5"/>
                    <text x="535" y="272" textAnchor="middle" fontSize="10" fill="#581c87" fontWeight="600">📖 Read Replica 3</text>
                    <text x="535" y="288" textAnchor="middle" fontSize="8" fill="#581c87">Asynchronous Copy</text>

                    {/* Replication paths connectors */}
                    {/* Primary -> Standby Sync */}
                    <line x1="205" y1="275" x2="250" y2="275" stroke="#16a34a" strokeWidth="2" strokeDasharray="3,1" markerEnd="url(#arr-g)" />
                    <text x="227" y="268" textAnchor="middle" fontSize="7" fill="#15803d" fontWeight="600">Sync 🔄</text>

                    {/* Primary -> RR1 Async */}
                    <line x1="125" y1="300" x2="125" y2="315" stroke="#7c3aed" strokeWidth="1" strokeDasharray="2,2" markerEnd="url(#arr-p)" />
                    {/* Primary -> RR2 Async */}
                    <path d="M 205 290 Q 235 305 250 325" fill="none" stroke="#7c3aed" strokeWidth="1" strokeDasharray="2,2" markerEnd="url(#arr-p)" />
                    {/* Primary -> RR3 Async */}
                    <path d="M 205 295 Q 330 330 455 290" fill="none" stroke="#7c3aed" strokeWidth="1" strokeDasharray="2,2" markerEnd="url(#arr-p)" />
                  </svg>
                </div>
              )}

              {/* Sub-tab bestTab: sg */}
              {bestTab === 'sg' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Least-Privilege Security Group rules chain</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
                    Production best practices dictate mapping security group reference IDs rather than static CIDR subnets.
                  </div>

                  <div className="rds-row" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
                    <div style={{ fontWeight: 600, minWidth: '90px' }}>🌐 sg-alb</div>
                    <div style={{ fontSize: '11px' }}>
                      <b>Inbound:</b> HTTPS/443 and HTTP/80 from `0.0.0.0/0` (public access bounds)<br/>
                      <b>Outbound:</b> Target Application ports (e.g. 8080) pointing strictly to target app destination `sg-app`.
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', margin: '2px 0' }}>↓</div>
                  <div className="rds-row" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <div style={{ fontWeight: 600, minWidth: '90px' }}>⚙️ sg-app</div>
                    <div style={{ fontSize: '11px' }}>
                      <b>Inbound:</b> Inbound compute ports restricted to traffic initiating from `sg-alb` reference.<br/>
                      <b>Outbound:</b> Database Port (5432 / 3306) pointing strictly to target backend destination `sg-proxy` or `sg-db`.
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', margin: '2px 0' }}>↓</div>
                  <div className="rds-row" style={{ background: '#ede9fe', borderColor: '#d8b4fe' }}>
                    <div style={{ fontWeight: 600, minWidth: '90px' }}>🔄 sg-proxy</div>
                    <div style={{ fontSize: '11px' }}>
                      <b>Inbound:</b> Database Port (5432 / 3306) restricted strictly to transactions coming from application `sg-app`.<br/>
                      <b>Outbound:</b> Database Port pointing to target database engines `sg-db`.
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8', margin: '2px 0' }}>↓</div>
                  <div className="rds-row" style={{ background: '#fffbeb', borderColor: '#fde68a' }}>
                    <div style={{ fontWeight: 600, minWidth: '90px' }}>🗄️ sg-db</div>
                    <div style={{ fontSize: '11px' }}>
                      <b>Inbound:</b> Port 5432 / 3306 restricted strictly to traffic initiating from `sg-proxy` (or `sg-app` if no proxy). Allow port 22 tunnel from `sg-bastion` if manual administrative queries are needed.
                    </div>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '14px', marginBottom: '6px' }}>Database Engine Standard Port Directory</div>
                  <div className="rds-grid3">
                    <div style={{ border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: '#16a34a' }}>🐘 PostgreSQL</div>
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>Standard Port: <b>5432</b></div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Aurora PG: <b>5432</b></div>
                    </div>
                    <div style={{ border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: '#2563eb' }}>🐬 MySQL / MariaDB</div>
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>Standard Port: <b>3306</b></div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Aurora MySQL: <b>3306</b></div>
                    </div>
                    <div style={{ border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: '#ea580c' }}>🪟 SQL Server / Oracle</div>
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>SQL Server Port: <b>1433</b></div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Oracle Port: <b>1521</b></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab bestTab: proxy */}
              {bestTab === 'proxy' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>RDS Proxy Architecture Advantages</div>
                  <div className="rds-row">
                    <div className="rds-dot">1</div>
                    <div><b>Survive DNS TTL Caching:</b> Applications cache standard SQL DNS lookups. On raw database failover, apps continue attempting to write to the old IP address during standard DNS TTL windows. RDS Proxy endpoint is static and processes target IP Shifts internally in ~10 seconds.</div>
                  </div>
                  <div className="rds-row">
                    <div className="rds-dot">2</div>
                    <div><b>Mitigate Thread Context Switches:</b> High transaction concurrency spikes launch thousands of system database processes. The database spend more CPU scheduling threads than executing SQL logic. RDS Proxy intercepts this, queuing transactions down to small, highly optimized connection pools.</div>
                  </div>
                  <div className="rds-row">
                    <div className="rds-dot">3</div>
                    <div><b>IAM Auth &amp; Secrets Management:</b> Proxy utilizes AWS IAM to authorize app identities. Password storage and physical credentials rotation schedules are managed automatically inside Secrets Manager.</div>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '14px', marginBottom: '6px' }}>Engine Integration Support Directory</div>
                  <div className="rds-grid2" style={{ gap: '10px' }}>
                    <div style={{ border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '10px', background: '#f0fdf4' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: '#166534', marginBottom: '4px' }}>✅ Fully Supported Engines</div>
                      <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.4' }}>
                        PostgreSQL (10.x and above)<br/>
                        MySQL (5.6, 5.7, 8.0)<br/>
                        MariaDB (10.x and above)<br/>
                        Amazon Aurora clusters (PostgreSQL and MySQL compatible)
                      </div>
                    </div>
                    <div style={{ border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '10px', background: '#fee2e2' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: '#991b1b', marginBottom: '4px' }}>❌ Unsupported Database Engines</div>
                      <div style={{ fontSize: '11px', color: '#334155', lineHeight: '1.4' }}>
                        Microsoft SQL Server<br/>
                        Oracle Database engines<br/>
                        RDS Custom deployment parameters<br/>
                        Legacy Aurora Serverless v1 databases
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab bestTab: multiaz */}
              {bestTab === 'multiaz' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>RDS Multi-AZ vs Amazon Aurora Multi-AZ Shared Storage</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
                    Understanding the core differences between standard block-level volume mirroring in standard RDS vs cluster quorum writes in Aurora.
                  </div>

                  <div className="rds-grid2" style={{ gap: '12px' }}>
                    <div style={{ border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#d97706', marginBottom: '6px' }}>Standard RDS Multi-AZ</div>
                      <ul className="rds-ck" style={{ fontSize: '11px' }}>
                        <li><b>Synchronous volume write mirroring:</b> Transactions commit to both the active primary instance and the secondary disk arrays in AZ-b.</li>
                        <li><b>Standby is idle:</b> The standby instance operates passive compute. You cannot route read queries here.</li>
                        <li><b>Failover speed (30–60s):</b> Standard failover requires shifting the CNAME entry in DNS records and completing transactional crash recovery.</li>
                      </ul>
                    </div>
                    <div style={{ border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#7c3aed', marginBottom: '6px' }}>Amazon Aurora Shared Storage HA</div>
                      <ul className="rds-ck" style={{ fontSize: '11px' }}>
                        <li><b>Quorum storage:</b> Data is replicated in 6 physical copies spanning 3 separate AZs. Every write only requires 4 out of 6 nodes to acknowledge.</li>
                        <li><b>Replicas ARE readable:</b> Compute instances in AZ-b/AZ-c access the same shared storage. Replicas serve real read queries with near-zero lag.</li>
                        <li><b>Ultra-fast failovers (10–30s):</b> Promotion is instant since storage volumes do not need to resynchronize or recover pages.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab bestTab: replicas */}
              {bestTab === 'replicas' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Read Replica Ingress Strategies</div>
                  <div className="rds-row">
                    <div style={{ fontWeight: 600, minWidth: '30px' }}>WRITE</div>
                    <div>Always connect to the **Primary Writer Endpoint**. Sending transactional write logs to replicas will fail immediately or raise access exceptions.</div>
                  </div>
                  <div className="rds-row">
                    <div style={{ fontWeight: 600, minWidth: '30px' }}>READ</div>
                    <div>Route heavy queries to individual **Replica endpoints**. Maintain a load balancer configuration or use application layers to balance query counts across replicas.</div>
                  </div>
                  <div className="rds-row" style={{ borderColor: '#ef4444' }}>
                    <div style={{ fontWeight: 600, minWidth: '30px', color: '#dc2626' }}>STALE</div>
                    <div><b>Read-Your-Writes Mitigation:</b> When users insert a row and refresh, route their subsequent read queries strictly to the Primary Writer for a brief window (~1–2 seconds) to allow asynchronous replica log synchronization.</div>
                  </div>
                </div>
              )}

              {/* Sub-tab bestTab: engines */}
              {bestTab === 'engines' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Feature Support Directory Across Relational Engines</div>
                  <table className="rds-table">
                    <thead>
                      <tr>
                        <th>Capability</th>
                        <th>Aurora PostgreSQL</th>
                        <th>Aurora MySQL</th>
                        <th>RDS PostgreSQL</th>
                        <th>RDS MySQL</th>
                        <th>SQL Server</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><b>RDS Proxy</b></td>
                        <td>✅ Yes</td>
                        <td>✅ Yes</td>
                        <td>✅ Yes</td>
                        <td>✅ Yes</td>
                        <td>❌ No</td>
                      </tr>
                      <tr>
                        <td><b>Max Replicas</b></td>
                        <td style={{ color: '#16a34a', fontWeight: 600 }}>15 Replicas</td>
                        <td style={{ color: '#16a34a', fontWeight: 600 }}>15 Replicas</td>
                        <td>5 Replicas</td>
                        <td>5 Replicas</td>
                        <td>❌ None</td>
                      </tr>
                      <tr>
                        <td><b>Failover Recovery</b></td>
                        <td style={{ color: '#16a34a', fontWeight: 600 }}>&lt; 30 seconds</td>
                        <td style={{ color: '#16a34a', fontWeight: 600 }}>&lt; 30 seconds</td>
                        <td>30–60 seconds</td>
                        <td>30–60 seconds</td>
                        <td>30–60 seconds</td>
                      </tr>
                      <tr>
                        <td><b>Storage Auto-scale</b></td>
                        <td style={{ color: '#16a34a', fontWeight: 600 }}>Auto (128 TiB)</td>
                        <td style={{ color: '#16a34a', fontWeight: 600 }}>Auto (128 TiB)</td>
                        <td>Manual / Scheduled</td>
                        <td>Manual / Scheduled</td>
                        <td>Manual / Scheduled</td>
                      </tr>
                      <tr>
                        <td><b>Global DR Databases</b></td>
                        <td>✅ Yes</td>
                        <td>✅ Yes</td>
                        <td>Cross-Region Replica</td>
                        <td>Cross-Region Replica</td>
                        <td>❌ No</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub-tab bestTab: checklist */}
              {bestTab === 'checklist' && (
                <div>
                  <div className="rds-grid2" style={{ gap: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#16a34a', marginBottom: '8px' }}>Must-Have Controls (In Production)</div>
                      <ul className="rds-ck">
                        <li>RDS instances configured in Isolated Private Subnets with no default internet route</li>
                        <li>Multi-AZ deployments enabled to support fast automatic high-availability failovers</li>
                        <li>Automated backups scheduled with minimum retention of 7 days</li>
                        <li>RDS Proxy deployed in serverless compute setups (such as AWS Lambda)</li>
                        <li>Security group rules configured with explicit SG-ID mappings instead of CIDRs</li>
                        <li>KMS Customer Managed Keys (CMK) configured for robust storage volume encryption</li>
                        <li>Inbound SSL/TLS queries enforced (`force_ssl=1` in DB parameter group)</li>
                      </ul>
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#dc2626', marginBottom: '8px' }}>Common Anti-patterns &amp; Mistakes</div>
                      <ul className="rds-wn">
                        <li>Attempting to execute write operations (INSERT/UPDATE) pointing to replica endpoints</li>
                        <li>Placing the database in public VPC subnets with `PubliclyAccessible = true`</li>
                        <li>Hardcoding database credentials inside application container environment configurations</li>
                        <li>Bypassing connection limits without utilizing poolers like RDS Proxy or PgBouncer</li>
                        <li>Omitting alerts on critical CloudWatch limits (`FreeableMemory` and `DiskQueueDepth`)</li>
                        <li>Assuming the Multi-AZ Standby instance can be read from (it operates passive block mirrors only)</li>
                      </ul>
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '12px', marginTop: '14px', fontSize: '11px' }}>
                    💡 <b>Pro Tip:</b> Use the AWS CLI to test active failover resilience by running: <code>aws rds failover-db-cluster --db-cluster-identifier your-cluster-id</code> in your development/staging environments before committing code to production.
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
