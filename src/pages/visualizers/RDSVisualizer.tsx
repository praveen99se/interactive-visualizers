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

  // Premium Interactive Connectivity Ingress states
  const [ingressSource, setIngressSource] = useState<'internet' | 'app' | 'bastion'>('app');

  // Premium Interactive Multi-AZ failover stepper states
  const [failoverStep, setFailoverStep] = useState<number>(0);
  const [failoverLogs, setFailoverLogs] = useState<string[]>([
    '💡 Click "Trigger Failover State Transition ⏭" to simulate an Availability Zone disaster recovery failover.'
  ]);

  // Premium Interactive Replica lag slider state
  const [replicaWalLag, setReplicaWalLag] = useState<number>(3);

  // Premium Interactive ML sql sandbox state
  const [mlLogs, setMlLogs] = useState<string[]>([]);
  const [mlOutput, setMlOutput] = useState<any[]>([]);
  const [mlIsLoading, setMlIsLoading] = useState<boolean>(false);

  // New sandbox states for PITR slider & Database Cloning CoW allocations
  const [pitrTargetTime, setPitrTargetTime] = useState<number>(720); // 720 minutes = 12:00 PM
  const [cloneDivergedBlocks, setCloneDivergedBlocks] = useState<number>(0);
  const [cloneLogs, setCloneLogs] = useState<string[]>([
    '💡 Click "Simulate Write on Cloned DB" to trigger copy-on-write storage allocations.'
  ]);

  const logFailover = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setFailoverLogs((prev) => [`${time} — ${msg}`, ...prev].slice(0, 40));
  };

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

  const handleCloneWrite = () => {
    setCloneDivergedBlocks((prev) => prev + 1);
    const newIdx = cloneDivergedBlocks + 1;
    const time = new Date().toLocaleTimeString();
    setCloneLogs((prev) => [
      `${time} — [CLONE WRITE #${newIdx}] Client intercepts table insert. Copy-on-Write allocates a new block segment. Shared physical storage remains read-only and safe!`,
      ...prev
    ].slice(0, 20));
  };

  const runMlInference = () => {
    setMlIsLoading(true);
    setMlLogs([`[INIT] Spawning asynchronous query worker...`]);
    setMlOutput([]);
    
    setTimeout(() => {
      setMlLogs(prev => [...prev, `[INFO] Establishing TCP session with PostgreSQL SageMaker API...`]);
    }, 300);

    setTimeout(() => {
      setMlLogs(prev => [...prev, `[INFO] Invoking SageMaker model server endpoint: 'aws-sagemaker-model-${activeMlQuery}'...`]);
    }, 600);

    setTimeout(() => {
      setMlLogs(prev => [...prev, `[SUCCESS] SageMaker returned payload in 28ms. Replaying table grid...`]);
      setMlIsLoading(false);
      if (activeMlQuery === 'sentiment') {
        setMlOutput([
          { review: "Highly recommend! Fast performance.", sentiment: "POSITIVE", confidence: "99.8%" },
          { review: "The database connection kept timeout error...", sentiment: "NEGATIVE", confidence: "96.5%" },
          { review: "Standard engine setup, works ok", sentiment: "NEUTRAL", confidence: "78.2%" }
        ]);
      } else if (activeMlQuery === 'fraud') {
        setMlOutput([
          { txn: "TxN-09241 ($4,500 from Moscow IP)", risk: "HIGH RISK (98.2%)", action: "🚫 Blocked" },
          { txn: "TxN-09242 ($15.20 local grocery)", risk: "LOW RISK (0.4%)", action: "✅ Allowed" },
          { txn: "TxN-09243 ($320 online shopping)", risk: "MEDIUM RISK (42.1%)", action: "✅ Allowed" }
        ]);
      } else {
        setMlOutput([
          { user: "User-8823 (Active, 10 queries/day)", score: "Low Churn Risk (1.2%)", status: "Healthy" },
          { user: "User-8824 (Inactive 30 days, plan canceled)", score: "High Churn Risk (94.8%)", status: "📩 Target Promo" },
          { user: "User-8825 (Queries dropped 50%)", score: "Medium Churn Risk (58.4%)", status: "📩 Target Promo" }
        ]);
      }
    }, 1000);
  };


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


  const badge = (cls: string, txt: string) => `<span class="rds-badge ${cls}">${txt}</span>`;
  const log = (msg: string) => {
    setLogHtml((prev) => `<b>${new Date().toLocaleTimeString()}</b> — ${msg}<br><span style="color:var(--color-text-tertiary)">${prev}</span>`);
  };

  const renderSvg = (m: Metrics) => {
    const svg = svgRef.current;
    if (!svg) return;
    const NS = 'http://www.w3.org/2000/svg';
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    // Dynamic linear gradients for cards (Soft Pastels)
    const defs = document.createElementNS(NS, 'defs');
    
    const addGradient = (id: string, color1: string, color2: string) => {
      const grad = document.createElementNS(NS, 'linearGradient');
      grad.setAttribute('id', id);
      grad.setAttribute('x1', '0%');
      grad.setAttribute('y1', '0%');
      grad.setAttribute('x2', '100%');
      grad.setAttribute('y2', '100%');
      const stop1 = document.createElementNS(NS, 'stop');
      stop1.setAttribute('offset', '0%');
      stop1.setAttribute('stop-color', color1);
      const stop2 = document.createElementNS(NS, 'stop');
      stop2.setAttribute('offset', '100%');
      stop2.setAttribute('stop-color', color2);
      grad.appendChild(stop1);
      grad.appendChild(stop2);
      defs.appendChild(grad);
    };

    // Add glowing marker arrows
    const addMarker = (id: string, color: string) => {
      const marker = document.createElementNS(NS, 'marker');
      marker.setAttribute('id', id);
      marker.setAttribute('viewBox', '0 0 10 10');
      marker.setAttribute('refX', '8');
      marker.setAttribute('refY', '5');
      marker.setAttribute('markerWidth', '6');
      marker.setAttribute('markerHeight', '6');
      marker.setAttribute('orient', 'auto-start-reverse');
      const ap = document.createElementNS(NS, 'path');
      ap.setAttribute('d', 'M 0 1 L 9 5 L 0 9 z');
      ap.setAttribute('fill', color);
      marker.appendChild(ap);
      defs.appendChild(marker);
    };

    addGradient('grad-light-bg', '#ffffff', '#f8fafc');
    addGradient('grad-app', '#f0f2fe', '#e0e7ff');
    addGradient('grad-writer-ok', '#ecfdf5', '#d1fae5');
    addGradient('grad-writer-fail', '#fff1f2', '#ffe4e6');
    addGradient('grad-standby-ok', '#fffbeb', '#fef3c7');
    addGradient('grad-replica', '#f5f3ff', '#ede9fe');

    addMarker('arr-write', '#0284c7');
    addMarker('arr-read', '#7c3aed');
    addMarker('arr-sync', '#10b981');
    addMarker('arr-async', '#8b5cf6');
    addMarker('arr-fail', '#ef4444');

    svg.appendChild(defs);

    const helpers = {
      // Draw background panel
      bg: () => {
        const bgRect = document.createElementNS(NS, 'rect');
        bgRect.setAttribute('x', '0');
        bgRect.setAttribute('y', '0');
        bgRect.setAttribute('width', '680');
        bgRect.setAttribute('height', '260');
        bgRect.setAttribute('fill', 'url(#grad-light-bg)');
        bgRect.setAttribute('rx', '6');
        svg.appendChild(bgRect);

        // Subtly render grid lines for high-tech aesthetic
        for (let i = 40; i < 680; i += 40) {
          const l = document.createElementNS(NS, 'line');
          l.setAttribute('x1', String(i));
          l.setAttribute('y1', '0');
          l.setAttribute('x2', String(i));
          l.setAttribute('y2', '260');
          l.setAttribute('stroke', '#cbd5e1');
          l.setAttribute('stroke-width', '0.5');
          l.setAttribute('opacity', '0.4');
          svg.appendChild(l);
        }
        for (let j = 40; j < 260; j += 40) {
          const l = document.createElementNS(NS, 'line');
          l.setAttribute('x1', '0');
          l.setAttribute('y1', String(j));
          l.setAttribute('x2', '680');
          l.setAttribute('y2', String(j));
          l.setAttribute('stroke', '#cbd5e1');
          l.setAttribute('stroke-width', '0.5');
          l.setAttribute('opacity', '0.4');
          svg.appendChild(l);
        }
      },
      rect: (x: number, y: number, w: number, h: number, fill: string, stroke: string, dash = '', cls = '', style = '') => {
        const r = document.createElementNS(NS, 'rect');
        r.setAttribute('x', String(x));
        r.setAttribute('y', String(y));
        r.setAttribute('width', String(w));
        r.setAttribute('height', String(h));
        r.setAttribute('rx', '8');
        r.setAttribute('fill', fill);
        r.setAttribute('stroke', stroke);
        r.setAttribute('stroke-width', '1.5');
        if (dash) r.setAttribute('stroke-dasharray', dash);
        if (cls) r.setAttribute('class', cls);
        if (style) r.setAttribute('style', style);
        svg.appendChild(r);
      },
      text: (x: number, y: number, str: string, sz = 11, weight = 500, fill = '#475569', anchor = 'middle') => {
        const t = document.createElementNS(NS, 'text');
        t.setAttribute('x', String(x));
        t.setAttribute('y', String(y));
        t.setAttribute('text-anchor', anchor);
        t.setAttribute('dominant-baseline', 'central');
        t.setAttribute('font-size', String(sz));
        t.setAttribute('font-weight', String(weight));
        t.setAttribute('fill', fill);
        t.setAttribute('font-family', "'Outfit', 'Inter', system-ui, sans-serif");
        t.textContent = str;
        svg.appendChild(t);
      },
      path: (d: string, dash = '', color = '#64748b', cls = '', marker = 'arr-write') => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', d);
        p.setAttribute('fill', 'none');
        p.setAttribute('stroke', color);
        p.setAttribute('stroke-width', '2');
        if (dash) p.setAttribute('stroke-dasharray', dash);
        if (cls) p.setAttribute('class', cls);
        if (marker) p.setAttribute('marker-end', `url(#${marker})`);
        svg.appendChild(p);
      }
    };

    // Render beautiful base background grid
    helpers.bg();

    // Availability Zone Boundaries
    // AZ-a
    helpers.rect(215, 30, 220, 205, '#f8fafc', '#cbd5e1', '4,3');
    helpers.text(325, 42, 'Availability Zone: us-east-1a (Primary Zone)', 9, 600, '#64748b');

    // AZ-b / AZ-c zone label indicator
    helpers.rect(445, 30, 215, 205, '#f8fafc', '#cbd5e1', '4,3');
    helpers.text(552, 42, mode === 'multi_rr' ? 'AZ-b & AZ-c (Secondary Zones)' : 'Availability Zone: us-east-1b (HA Standby)', 9, 600, '#64748b');

    // App Tier Server Card (Glowing Neon Blue/Indigo)
    helpers.rect(20, 75, 160, 110, 'url(#grad-app)', '#3b82f6', '', 'active-glow-node', '--pulse-color: rgba(59, 130, 246, 0.2)');
    helpers.text(100, 95, '💻 sg-app Client Tier', 11, 700, '#1e3a8a');
    helpers.text(100, 115, 'Compute Drivers EC2/Lambda', 9.5, 500, '#1d4ed8');
    helpers.text(100, 135, `Incoming Load: ${tps} TPS`, 10, 600, '#2563eb');
    helpers.text(100, 155, `Writes: ${m.writes} | Reads: ${m.reads}`, 9, 500, '#475569');

    // Writer Node Configuration
    const writerIsActive = !azFailed;
    const writerIsSingleDown = azFailed && mode === 'single';
    const writerIsMultiFailed = azFailed && mode !== 'single';

    let wFill = 'url(#grad-writer-ok)';
    let wStroke = '#10b981';
    let wText = '#064e3b';
    let wSubText = 'Writing Transaction Log (WAL)';
    let wPulse = '--pulse-color: rgba(16, 185, 129, 0.3)';
    let wCls = 'active-glow-node';

    if (writerIsSingleDown) {
      wFill = 'url(#grad-writer-fail)';
      wStroke = '#ef4444';
      wText = '#9f1239';
      wSubText = '❌ DATABASE INSTANCE DOWN';
      wPulse = '--pulse-color: rgba(239, 68, 68, 0.3)';
      wCls = '';
    } else if (writerIsMultiFailed) {
      wFill = 'url(#grad-writer-fail)';
      wStroke = '#ef4444';
      wText = '#9f1239';
      wSubText = '❌ Evicted Writer (Failed Over)';
      wPulse = '--pulse-color: rgba(239, 68, 68, 0.15)';
      wCls = '';
    }

    // Draw Primary Writer Card in AZ-a
    helpers.rect(230, 60, 190, 75, wFill, wStroke, '', wCls, wPulse);
    helpers.text(325, 78, writerIsActive ? '🐘 Primary DB Writer' : '🐘 DB Writer (AZ-a)', 11, 700, wText);
    helpers.text(325, 96, wSubText, 9, 500, wText === '#9f1239' ? '#9f1239' : '#047857');
    helpers.text(325, 114, writerIsActive ? `Active load: ${m.writerTps} TPS` : '0 TPS — Offline', 9.5, 600, wText);

    // Multi-AZ Standby Instance Card
    if (mode !== 'single') {
      const standbyIsActive = azFailed; // Standby is promoted to writer
      
      let sFill = 'url(#grad-standby-ok)';
      let sStroke = '#fbbf24';
      let sText = '#78350f';
      let sSubText = '🛡️ Hot Standby (Passive Replica)';
      let sPulse = '--pulse-color: rgba(251, 191, 36, 0.2)';
      let sCls = '';

      if (standbyIsActive) {
        sFill = 'url(#grad-writer-ok)';
        sStroke = '#10b981';
        sText = '#064e3b';
        sSubText = '⚡ PROMOTED WRITER (Active)';
        sPulse = '--pulse-color: rgba(16, 185, 129, 0.3)';
        sCls = 'active-glow-node';
      }

      helpers.rect(230, 150, 190, 70, sFill, sStroke, '', sCls, sPulse);
      helpers.text(325, 168, standbyIsActive ? '🛡️ Standby promoted to Writer' : '🛡️ HA Standby DB (AZ-b)', 11, 700, sText);
      helpers.text(325, 186, sSubText, 9, 500, standbyIsActive ? '#047857' : '#b45309');
      helpers.text(325, 202, standbyIsActive ? `Active load: ${m.writerTps} TPS` : 'Mirroring Block storage commits', 9, 500, sText);

      // Draw sync replication line between Writer and Standby
      if (writerIsActive) {
        // Normal state
        helpers.path('M 325 135 L 325 150', '', '#10b981', 'flow-active-line', 'arr-sync');
        helpers.text(355, 142.5, 'SYNC 🔄', 8, 700, '#047857');
      } else {
        // AZ crashed, replication path is broken
        helpers.path('M 325 135 L 325 150', '3,3', '#ef4444', '', 'arr-fail');
        helpers.text(355, 142.5, 'BROKEN ❌', 8, 700, '#9f1239');
      }
    }

    // Read Replica Cards in AZ-b / AZ-c
    if (mode === 'multi_rr') {
      // Replica #1
      helpers.rect(480, 55, 160, 72, 'url(#grad-replica)', '#8b5cf6', '', 'active-glow-node', '--pulse-color: rgba(139, 92, 246, 0.25)');
      helpers.text(560, 73, '📖 Read Replica #1', 11, 700, '#4c1d95');
      helpers.text(560, 91, `Replica lag: ~${lag}s`, 9, 500, lag >= 12 ? '#ef4444' : lag >= 5 ? '#d97706' : '#5b21b6');
      helpers.text(560, 107, m.readTarget === 'replicas' ? `Reads: ${m.replicaEach} TPS` : '0 TPS (Routing bypass)', 9.5, 600, '#6d28d9');

      // Replica #2
      helpers.rect(480, 145, 160, 72, 'url(#grad-replica)', '#8b5cf6', '', 'active-glow-node', '--pulse-color: rgba(139, 92, 246, 0.25)');
      helpers.text(560, 163, '📖 Read Replica #2', 11, 700, '#4c1d95');
      helpers.text(560, 181, `Replica lag: ~${lag}s`, 9, 500, lag >= 12 ? '#ef4444' : lag >= 5 ? '#d97706' : '#5b21b6');
      helpers.text(560, 197, m.readTarget === 'replicas' ? `Reads: ${m.replicaEach} TPS` : '0 TPS (Routing bypass)', 9.5, 600, '#6d28d9');

      // Async replication streaming connectors from writer source to replicas
      if (writerIsActive) {
        helpers.path('M 420 90 L 480 80', '4,2', '#8b5cf6', 'flow-active-line', 'arr-async');
        helpers.path('M 420 110 L 480 160', '4,2', '#8b5cf6', 'flow-active-line', 'arr-async');
        helpers.text(450, 72, 'Async 🟢', 7.5, 600, '#6d28d9');
      } else {
        // Redirection of replica pipelines from Standby in AZ-b
        helpers.path('M 420 175 L 480 100', '4,2', '#8b5cf6', 'flow-active-line', 'arr-async');
        helpers.path('M 420 195 L 480 180', '4,2', '#8b5cf6', 'flow-active-line', 'arr-async');
        helpers.text(450, 205, 'Async 🟢', 7.5, 600, '#6d28d9');
      }
    }

    // Traffic Ingress Routes from Client App Card
    if (writerIsSingleDown) {
      // Direct Single AZ Outage: Ingress blocked
      helpers.path('M 180 120 L 230 105', '4,4', '#ef4444', '', 'arr-fail');
      helpers.text(205, 98, '❌ BLOCKED', 8.5, 700, '#ef4444');
      
      // Stop sign indicator
      const g = document.createElementNS(NS, 'g');
      const stopCircle = document.createElementNS(NS, 'circle');
      stopCircle.setAttribute('cx', '205');
      stopCircle.setAttribute('cy', '112');
      stopCircle.setAttribute('r', '8');
      stopCircle.setAttribute('fill', '#ef4444');
      g.appendChild(stopCircle);
      helpers.text(205, 112, 'X', 8, 800, '#fff');
      svg.appendChild(g);
    } else {
      // Ingress pathing active
      const activeWriterY = (azFailed && mode !== 'single') ? 175 : 97; // Routes to AZ-b promoted writer on failover!
      
      // 1. Write Endpoint Pathway (Cyan/Blue)
      helpers.path(`M 180 110 C 200 110, 210 ${activeWriterY - 10}, 230 ${activeWriterY - 10}`, '', '#0284c7', 'flow-active-line', 'arr-write');
      helpers.text(205, activeWriterY - 18, `Writes: ${m.writes} TPS`, 8, 700, '#0369a1');

      // 2. Read Endpoint Pathway (Strong consistency = Writer; Eventual = Replicas)
      if (m.readTarget === 'writer') {
        helpers.path(`M 180 140 C 200 140, 210 ${activeWriterY + 10}, 230 ${activeWriterY + 10}`, '', '#0284c7', 'flow-active-line', 'arr-write');
        helpers.text(205, activeWriterY + 20, `Reads: ${m.reads} TPS`, 8, 700, '#0369a1');
      } else if (mode === 'multi_rr') {
        // Eventual Consistency: Reads funneled to replicas (Purple)
        helpers.path('M 180 140 C 200 140, 380 90, 480 90', '', '#8b5cf6', 'flow-active-line', 'arr-read');
        helpers.path('M 180 145 C 200 145, 380 180, 480 180', '', '#8b5cf6', 'flow-active-line', 'arr-read');
        helpers.text(205, 155, `Reads: ${m.reads} TPS (Split)`, 8, 700, '#6d28d9');
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
          border: 1px solid var(--color-border-tertiary, #cbd5e1);
          background: var(--color-background-primary, #ffffff);
          color: var(--color-text-secondary, #475569);
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        .arch-scenario-btn:hover {
          background: var(--color-background-secondary, #f8fafc);
          color: var(--color-text-primary, #0f172a);
        }
        .arch-scenario-btn.active {
          background: #eff6ff;
          color: #2563eb;
          border-color: #2563eb;
        }
        .asg-btn {
          font-size: 12px;
          padding: 5px 12px;
          border-radius: 6px;
          border: 0.5px solid var(--color-border-tertiary, #cbd5e1);
          background: var(--color-background-primary, #ffffff);
          color: var(--color-text-primary, #0f172a);
          cursor: pointer;
          transition: all 0.15s;
          outline: none;
        }
        .asg-btn:hover {
          background: var(--color-background-secondary, #f8fafc);
        }
        .asg-btn.asg-on {
          background: #16a34a;
          color: #fff;
          border-color: #16a34a;
        }
        .asg-log {
          border: 0.5px solid var(--color-border-tertiary, #cbd5e1);
          border-radius: 8px;
          padding: 10px 12px;
          background: var(--color-background-secondary, #f8fafc);
          font-size: 11px;
          font-family: var(--font-mono, monospace);
          white-space: pre-wrap;
          line-height: 1.5;
          color: var(--color-text-primary, #0f172a);
        }
        .asg-card {
          border: 0.5px solid var(--color-border-tertiary, #cbd5e1);
          border-radius: var(--border-radius-lg, 12px);
          padding: 14px 16px;
          background: var(--color-background-primary, #ffffff);
          margin-bottom: 12px;
        }
        .rds-gcard {
          border-radius: var(--border-radius-lg, 12px);
          padding: 14px 16px;
          background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
          border: 1.5px solid #fdba74;
          box-shadow: 0 4px 20px rgba(253, 186, 116, 0.1);
        }
        .rds-gcard-title {
          font-weight: bold;
          font-size: 13px;
          color: #c2410c;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
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
              <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#f8fafc', marginBottom: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px', color: '#475569' }}>
                  📐 Engine-Aware VPC Subnet Group Zonal Topology
                </div>

                <svg width="100%" viewBox="0 0 680 160" style={{ background: '#ffffff', borderRadius: '6px', border: '0.5px solid #cbd5e1' }}>
                  <defs>
                    <marker id="arr-sync" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                    <marker id="arr-async" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6" /></marker>
                    <marker id="arr-aurora" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#38bdf8" /></marker>
                  </defs>

                  {/* AZ boundaries */}
                  
                  {/* us-east-1a */}
                  <rect x="15" y="15" width="200" height="130" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="115" y="28" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#475569" fontFamily="monospace">us-east-1a Subnet</text>
                  
                  {/* us-east-1b */}
                  <rect x="240" y="15" width="200" height="130" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="340" y="28" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#475569" fontFamily="monospace">us-east-1b Subnet</text>

                  {/* us-east-1c */}
                  <rect x="465" y="15" width="200" height="130" rx="8" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="565" y="28" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#475569" fontFamily="monospace">us-east-1c Subnet</text>

                  {/* Dynamic Nodes Renders */}
                  {selectedEngine === 'aurora' ? (
                    <>
                      {/* Aurora: Cloud-Native Shared Storage 6-way replicated */}
                      
                      {/* Primary Writer in AZ-a */}
                      <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                        <rect x="30" y="38" width="170" height="42" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                        <text x="115" y="58" textAnchor="middle" fontSize="10.5" fill="#064e3b" fontWeight="bold">🐘 Primary Writer</text>
                        <text x="115" y="72" textAnchor="middle" fontSize="8" fill="#16a34a" fontFamily="monospace">Active Instance (AZ-a)</text>
                      </g>

                      {/* Aurora Reader in AZ-b */}
                      <g className="active-glow-node" style={{ '--pulse-color': '#8b5cf6' } as React.CSSProperties}>
                        <rect x="255" y="38" width="170" height="42" rx="6" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="1" />
                        <text x="340" y="58" textAnchor="middle" fontSize="10.5" fill="#4c1d95" fontWeight="bold">📖 Aurora Reader</text>
                        <text x="340" y="72" textAnchor="middle" fontSize="8" fill="#7c3aed" fontFamily="monospace">Near-Zero Lag (AZ-b)</text>
                      </g>

                      {/* Shared Storage Pooling representing Aurora Storage Pool across all AZs */}
                      <rect x="30" y="92" width="620" height="45" rx="8" fill="#ecfbfb" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,2" />
                      <text x="340" y="105" textAnchor="middle" fontSize="9.5" fill="#0284c7" fontWeight="bold">🌌 Cloud-Native Shared Storage Pool (Replicated 6-Ways)</text>
                      
                      {/* Storage Nodes in each AZ */}
                      <rect x="50" y="112" width="60" height="18" rx="3" fill="#ffffff" stroke="#0284c7" strokeWidth="0.5"/>
                      <text x="80" y="122" textAnchor="middle" fontSize="7.5" fill="#0284c7" fontFamily="monospace">Disk A1 / A2</text>

                      <rect x="275" y="112" width="60" height="18" rx="3" fill="#ffffff" stroke="#0284c7" strokeWidth="0.5"/>
                      <text x="305" y="122" textAnchor="middle" fontSize="7.5" fill="#0284c7" fontFamily="monospace">Disk B1 / B2</text>

                      <rect x="500" y="112" width="60" height="18" rx="3" fill="#ffffff" stroke="#0284c7" strokeWidth="0.5"/>
                      <text x="530" y="122" textAnchor="middle" fontSize="7.5" fill="#0284c7" fontFamily="monospace">Disk C1 / C2</text>

                      {/* Continuous replication trace paths */}
                      <path d="M 115 80 L 115 92" stroke="#0284c7" strokeWidth="1.5" className="flow-active-line" markerEnd="url(#arr-aurora)"/>
                      <path d="M 340 80 L 340 92" stroke="#0284c7" strokeWidth="1" strokeDasharray="2,2"/>
                    </>
                  ) : (selectedEngine === 'oracle' || selectedEngine === 'mssql') ? (
                    <>
                      {/* Proprietary Engines: Multi-AZ standby copy, no replicas supported */}
                      
                      {/* Primary Writer in AZ-a */}
                      <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                        <rect x="25" y="42" width="180" height="65" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                        <text x="115" y="65" textAnchor="middle" fontSize="10.5" fill="#064e3b" fontWeight="bold">🐘 Primary Writer</text>
                        <text x="115" y="80" textAnchor="middle" fontSize="8" fill="#16a34a">In-Service (Active)</text>
                        <text x="115" y="93" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="monospace">Endpoint A: active.writer</text>
                      </g>

                      {/* Standby Copy in AZ-b */}
                      <g className="active-glow-node" style={{ '--pulse-color': '#f59e0b' } as React.CSSProperties}>
                        <rect x="250" y="42" width="180" height="65" rx="6" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
                        <text x="340" y="65" textAnchor="middle" fontSize="10.5" fill="#78350f" fontWeight="bold">🛡️ Standby Replica</text>
                        <text x="340" y="80" textAnchor="middle" fontSize="8" fill="#b45309">Synchronous Hot Standby</text>
                        <text x="340" y="93" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="monospace">No Active Reads Allowed</text>
                      </g>

                      {/* Standby Replication line */}
                      <line x1="205" y1="74" x2="250" y2="74" stroke="#10b981" strokeWidth="2" className="flow-active-line" markerEnd="url(#arr-sync)" />
                      <text x="227.5" y="64" textAnchor="middle" fontSize="7.5" fill="#15803d" fontWeight="bold" fontFamily="monospace">Sync 🔄</text>

                      {/* Replicas Blocked / Not Supported in AZ-c */}
                      <g opacity="0.6">
                        <rect x="475" y="42" width="180" height="65" rx="6" fill="#fef2f2" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="565" y="65" textAnchor="middle" fontSize="10.5" fill="#ef4444" fontWeight="bold" style={{ textDecoration: 'line-through' }}>📖 Read Replica</text>
                        <text x="565" y="80" textAnchor="middle" fontSize="8.5" fill="#ef4444" fontWeight="bold">❌ NOT SUPPORTED</text>
                        <text x="565" y="93" textAnchor="middle" fontSize="7" fill="#b91c1c" fontFamily="monospace">Standard RDS engine restriction</text>
                        <path d="M 470 37 L 660 112 M 660 37 L 470 112" stroke="#ef4444" strokeWidth="1.5" opacity="0.5" />
                      </g>
                    </>
                  ) : (
                    <>
                      {/* Standard Engines: Postgres / MySQL / MariaDB standard multi-az and replicas */}
                      
                      {/* Primary Writer in AZ-a */}
                      <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                        <rect x="25" y="42" width="180" height="65" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                        <text x="115" y="65" textAnchor="middle" fontSize="10.5" fill="#064e3b" fontWeight="bold">🐘 Primary Writer</text>
                        <text x="115" y="80" textAnchor="middle" fontSize="8" fill="#16a34a">In-Service (Active)</text>
                        <text x="115" y="93" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="monospace">Endpoint A: active.writer</text>
                      </g>

                      {/* Standby Copy in AZ-b */}
                      <g className="active-glow-node" style={{ '--pulse-color': '#f59e0b' } as React.CSSProperties}>
                        <rect x="250" y="42" width="180" height="65" rx="6" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
                        <text x="340" y="65" textAnchor="middle" fontSize="10.5" fill="#78350f" fontWeight="bold">🛡️ Standby Replica</text>
                        <text x="340" y="80" textAnchor="middle" fontSize="8" fill="#b45309">Synchronous Hot Standby</text>
                        <text x="340" y="93" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="monospace">Passive (No Client Access)</text>
                      </g>

                      {/* Read Replica in AZ-c */}
                      <g className="active-glow-node" style={{ '--pulse-color': '#8b5cf6' } as React.CSSProperties}>
                        <rect x="475" y="42" width="180" height="65" rx="6" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="1" />
                        <text x="565" y="65" textAnchor="middle" fontSize="10.5" fill="#4c1d95" fontWeight="bold">📖 Read Replica</text>
                        <text x="565" y="80" textAnchor="middle" fontSize="8.5" fill="#7c3aed">Asynchronous WAL Streaming</text>
                        <text x="565" y="93" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="monospace">Endpoint C: read.replica</text>
                      </g>

                      {/* Standby Replication line */}
                      <line x1="205" y1="74" x2="250" y2="74" stroke="#10b981" strokeWidth="2" className="flow-active-line" markerEnd="url(#arr-sync)" />
                      <text x="227.5" y="64" textAnchor="middle" fontSize="7.5" fill="#15803d" fontWeight="bold" fontFamily="monospace">Sync 🔄</text>

                      {/* Replica replication line */}
                      <path d="M 205 74 Q 330 135 475 74" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,2" className="flow-active-line" markerEnd="url(#arr-async)" />
                      <text x="340" y="132" textAnchor="middle" fontSize="8.5" fill="#7c3aed" fontWeight="bold" fontFamily="monospace">Async WAL ➡️</text>
                    </>
                  )}
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
            <div className="rds-sec">Interactive Network Topology &amp; Security Group Ingress Sandbox</div>
            
            {/* Ingress Selector buttons */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
              <button 
                className={`arch-scenario-btn ${ingressSource === 'app' ? 'active' : ''}`}
                onClick={() => setIngressSource('app')}
              >
                🟢 Route 1: Standard Application Traffic (Allowed)
              </button>
              <button 
                className={`arch-scenario-btn ${ingressSource === 'bastion' ? 'active' : ''}`}
                onClick={() => setIngressSource('bastion')}
                style={{ borderColor: '#8b5cf6', color: ingressSource === 'bastion' ? '#8b5cf6' : '' }}
              >
                🟤 Route 2: Administrative SSH Bastion Tunnel (Allowed)
              </button>
              <button 
                className={`arch-scenario-btn ${ingressSource === 'internet' ? 'active' : ''}`}
                onClick={() => setIngressSource('internet')}
                style={{ borderColor: '#ef4444', color: ingressSource === 'internet' ? '#ef4444' : '' }}
              >
                🔴 Route 3: Public Internet Connection (Blocked!)
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '16px', alignItems: 'start' }}>
              
              {/* Left Column: State-Responsive SVG Map */}
              <div className="rds-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', padding: '16px' }}>
                <div style={{ alignSelf: 'flex-start', display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#475569' }}>
                    🔍 {ingressSource === 'app' ? 'App-to-DB Connection Flow' : ingressSource === 'bastion' ? 'Bastion SSH SQL Tunnel Ingress' : 'Unauthenticated Public Attack Route'}
                  </span>
                  <span style={{ fontSize: '11px', color: ingressSource === 'internet' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                    ● {ingressSource === 'internet' ? 'ACCESS BLOCKED' : 'SECURE INBOUND ACTIVE'}
                  </span>
                </div>

                <svg width="100%" viewBox="0 0 680 240" style={{ background: '#ffffff', borderRadius: '6px', border: '0.5px solid #cbd5e1' }}>
                  <defs>
                    <marker id="acn-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" /></marker>
                    <marker id="acn-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                    <marker id="acn-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6" /></marker>
                    <marker id="acn-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444" /></marker>
                  </defs>

                  {/* Public Internet Border Left */}
                  <line x1="10" y1="5" x2="10" y2="235" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3"/>
                  <text x="18" y="16" fontSize="8" fill="#475569" fontFamily="monospace">PUBLIC INTERNET BOUNDARY</text>

                  {/* VPC boundary */}
                  <rect x="55" y="15" width="615" height="210" rx="12" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
                  <text x="362.5" y="27" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#475569" fontFamily="monospace">VPC (10.0.0.0/16)</text>

                  {/* Public Subnets Area */}
                  <rect x="65" y="42" width="165" height="172" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="147.5" y="54" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#475569" fontFamily="monospace">Public Subnets (0.0.0.0/0)</text>
                  
                  {/* ALB Block */}
                  <g opacity={ingressSource === 'app' ? 1 : 0.65}>
                    <rect x="80" y="68" width="135" height="42" rx="6" fill={ingressSource === 'app' ? '#eff6ff' : '#ffffff'} stroke={ingressSource === 'app' ? '#3b82f6' : '#cbd5e1'} strokeWidth={1} />
                    <text x="147.5" y="85" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a">🌐 sg-alb (ALB)</text>
                    <text x="147.5" y="98" textAnchor="middle" fontSize="7.5" fill="#2563eb" fontFamily="monospace">Allow: Port 443</text>
                  </g>

                  {/* Bastion Host */}
                  <g opacity={ingressSource === 'bastion' ? 1 : 0.65}>
                    <rect x="80" y="132" width="135" height="42" rx="6" fill={ingressSource === 'bastion' ? '#fffbeb' : '#ffffff'} stroke={ingressSource === 'bastion' ? '#f59e0b' : '#cbd5e1'} strokeWidth={1} />
                    <text x="147.5" y="149" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a">🔒 sg-bastion (Jump)</text>
                    <text x="147.5" y="162" textAnchor="middle" fontSize="7.5" fill="#b45309" fontFamily="monospace">Allow: Port 22 SSH</text>
                  </g>

                  {/* Private App Subnets Area */}
                  <rect x="250" y="42" width="170" height="172" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="335" y="54" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#475569" fontFamily="monospace">Private App Subnets</text>
                  
                  {/* EC2 Instance Block */}
                  <g opacity={ingressSource === 'app' ? 1 : 0.65}>
                    <rect x="265" y="90" width="140" height="52" rx="6" fill={ingressSource === 'app' ? '#ecfdf5' : '#ffffff'} stroke={ingressSource === 'app' ? '#10b981' : '#cbd5e1'} strokeWidth={1} />
                    <text x="335" y="112" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#0f172a">⚙️ sg-app (App Server)</text>
                    <text x="335" y="127" textAnchor="middle" fontSize="7.5" fill="#16a34a" fontFamily="monospace">Allow: from sg-alb</text>
                  </g>

                  {/* Private DB Subnets Area */}
                  <rect x="440" y="42" width="220" height="172" rx="8" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="550" y="54" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#475569" fontFamily="monospace">Private DB Subnets (Isolated)</text>
                  
                  {/* RDS Writer Block */}
                  <g opacity={ingressSource !== 'internet' ? 1 : 0.4} className={ingressSource !== 'internet' ? 'active-glow-node' : ''} style={{ '--pulse-color': '#8b5cf6' } as React.CSSProperties}>
                    <rect x="460" y="90" width="180" height="60" rx="6" fill={ingressSource === 'internet' ? '#fef2f2' : '#f5f3ff'} stroke={ingressSource === 'internet' ? '#ef4444' : '#8b5cf6'} strokeWidth={1.5} />
                    <text x="550" y="115" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#0f172a">🗄️ sg-db (Amazon RDS)</text>
                    <text x="550" y="132" textAnchor="middle" fontSize="8" fill="#7c3aed" fontFamily="monospace">
                      {ingressSource === 'app' ? 'Inbound allowed from sg-app' : ingressSource === 'bastion' ? 'Inbound allowed from sg-bastion' : '❌ Public Ingress BLOCKED'}
                    </text>
                  </g>

                  {/* Connection tracer paths */}

                  {/* App route: ALB -> App -> DB */}
                  {ingressSource === 'app' && (
                    <>
                      {/* Public to ALB */}
                      <line x1="5" y1="90" x2="80" y2="90" stroke="#3b82f6" strokeWidth="2.5" className="flow-active-line" markerEnd="url(#acn-blue)"/>
                      
                      {/* ALB to App */}
                      <path d="M 215 90 L 265 110" fill="none" stroke="#3b82f6" strokeWidth="2" className="flow-active-line" markerEnd="url(#acn-blue)"/>
                      <text x="240" y="93" fontSize="7.5" fill="#60a5fa" fontWeight="bold">HTTP 8080</text>

                      {/* App to DB */}
                      <path d="M 405 120 L 460 120" fill="none" stroke="#10b981" strokeWidth="2.5" className="flow-active-line" markerEnd="url(#acn-green)" />
                      <text x="432.5" y="112" fontSize="7.5" fill="#34d399" fontWeight="bold">SQL Port 5432</text>
                    </>
                  )}

                  {/* Bastion route: Bastion -> DB */}
                  {ingressSource === 'bastion' && (
                    <>
                      {/* Public to Bastion */}
                      <line x1="5" y1="154" x2="80" y2="154" stroke="#f59e0b" strokeWidth="2" className="flow-active-line" markerEnd="url(#acn-purple)"/>
                      <text x="42.5" y="145" fontSize="7.5" fill="#f59e0b" fontWeight="bold">SSH Tunneled</text>

                      {/* Bastion to DB */}
                      <path d="M 215 154 L 460 120" fill="none" stroke="#8b5cf6" strokeWidth="2" className="flow-active-line" markerEnd="url(#acn-purple)" />
                      <text x="330" y="148" fontSize="8" fill="#a78bfa" fontWeight="bold">SQL Localhost Forwarding</text>
                    </>
                  )}

                  {/* Internet Blocked route */}
                  {ingressSource === 'internet' && (
                    <>
                      {/* Public attempt directly to DB */}
                      <path d="M 5 120 L 440 120" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="5,3" className="flow-active-line" markerEnd="url(#acn-red)"/>
                      <text x="220" y="112" fontSize="9.5" fill="#ef4444" fontWeight="bold">💥 Public TCP Query (Direct Attack)</text>

                      {/* Blocked Stop Sign at Private DB subnet border */}
                      <g transform="translate(440, 120)">
                        <circle cx="0" cy="0" r="14" fill="#ef4444" style={{ filter: 'url(#glow-red)' } as React.CSSProperties}/>
                        <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontSize="7.5" fill="#fff" fontWeight="bold">STOP</text>
                      </g>
                    </>
                  )}
                </svg>
              </div>

              {/* Right Column: Explanations HUD */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Telemetry/Rules Details */}
                <div className="asg-card" style={{ borderLeft: '3px solid #3b82f6', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    🔒 Ingress Policy Status
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>
                    {ingressSource === 'app' && '🟢 Compliant Access Path'}
                    {ingressSource === 'bastion' && '🟣 Secure Administrative Tunnel'}
                    {ingressSource === 'internet' && '🔴 Boundary Threat Thwarted'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Internet Gateway Route:</span>
                      <span style={{ fontWeight: 'bold', color: '#ef4444' }}>BLOCKED</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Security Group Chain:</span>
                      <span style={{ fontWeight: 'bold', color: '#34d399' }}>ENFORCED</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', paddingBottom: '4px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Public IP Address:</span>
                      <span style={{ fontWeight: 'bold', color: '#ef4444' }}>NONE (Internal Only)</span>
                    </div>
                  </div>
                </div>

                {/* Path explanation card */}
                <div className="asg-card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff', marginBottom: '6px' }}>
                    ⚙️ Network Engineering Explanation
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    {ingressSource === 'app' && (
                      <span>
                        **Production Best Practice:** The client app in the private subnet is the ONLY node whitelisted to query the database. The database Security Group (`sg-db`) whitelists ingress only from the `sg-app` security group ID rather than static IP CIDRs.
                      </span>
                    )}
                    {ingressSource === 'bastion' && (
                      <span>
                        **Secure Admin Operations:** When DBAs need to run migrations or manual queries, they establish a secure SSH local port forwarding tunnel through a bastion jump box (`sg-bastion`) located in the public subnet. The SQL traffic is fully encrypted inside the SSH wrapper and whitelisted by `sg-db`.
                      </span>
                    )}
                    {ingressSource === 'internet' && (
                      <span>
                        **Absolute Isolation:** Because the database has `PubliclyAccessible = False` and resides in subnets lacking routes pointing to an Internet Gateway (IGW), direct connections from the internet cannot be established. Bot attacks are physically stopped at the subnet network card level.
                      </span>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Standard Best Practices detail card underneath */}
            <div className="rds-grid2" style={{ gap: '12px', marginTop: '14px' }}>
              <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#1e3a8a' }}>Standard Connectivity Best Practices</div>
                <ul className="rds-ck">
                  <li><b>Publicly Accessible = False:</b> Disables generation of internet-routable IP addresses. Even if VPC gateways are present, DNS resolves strictly to internal private IPs.</li>
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
        )}

        {/* Tab 3: High Availability Multi-AZ */}
        {activeSection === 'multiaz' && (
          <div>
            <div className="rds-sec">Interactive Multi-AZ Disaster Recovery Failover Sandbox</div>
            
            {/* Stepper controls */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button 
                className="asg-btn asg-on" 
                onClick={() => {
                  const next = (failoverStep + 1) % 6;
                  setFailoverStep(next);
                  if (next === 0) {
                    setFailoverLogs(['💡 Sandbox reset. Database cluster in normal, synchronized Multi-AZ operational state.']);
                  } else if (next === 1) {
                    logFailover('💥 [0s] DISASTER EVENT: Hypervisor hardware failure in us-east-1a! Primary DB is unreachable.');
                  } else if (next === 2) {
                    logFailover('⚙️ [10s] EVICTION: RDS cluster manager fencing off primary node in us-east-1a to prevent split-brain writes.');
                  } else if (next === 3) {
                    logFailover('🌐 [20s] DNS PROPAGATION: Dynamic DNS starting CNAME record shift from us-east-1a (10.0.1.18) to us-east-1b (10.0.2.99).');
                  } else if (next === 4) {
                    logFailover('⚡ [30s] PROMOTION: Standby node in us-east-1b mounting block volumes and mounting transaction logs recovery journals.');
                  } else if (next === 5) {
                    logFailover('🟢 [45s] IN-SERVICE: Recovery complete! us-east-1b promoted to Writer. Client App connections restored successfully.');
                  }
                }}
                style={{ fontSize: '11.5px', padding: '7px' }}
              >
                {failoverStep === 5 ? '🔄 Reset Simulator' : '⏭ Trigger Failover State Transition'}
              </button>
              <button 
                className="asg-btn"
                onClick={() => {
                  setFailoverStep(0);
                  setFailoverLogs(['💡 Sandbox reset. Database cluster in normal, synchronized Multi-AZ operational state.']);
                }}
                style={{ fontSize: '11.5px', padding: '7px' }}
              >
                🔄 Reset
              </button>

              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginLeft: '10px' }}>
                Active Phase: <b style={{ color: '#fff' }}>{failoverStep} of 5</b> — {
                  failoverStep === 0 ? 'Normal Active Cluster' :
                  failoverStep === 1 ? 'Primary Node Crash' :
                  failoverStep === 2 ? 'Active Writer Eviction' :
                  failoverStep === 3 ? 'DNS CNAME Propagation' :
                  failoverStep === 4 ? 'Standby Crash Recovery' : 'Failover In-Service'
                }
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '16px', alignItems: 'start' }}>
              
              {/* Left Column: State-Responsive Widescreen SVG & Monospace Event logs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* SVG Map */}
                <div className="rds-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', padding: '16px' }}>
                  <svg width="100%" viewBox="0 0 680 180" style={{ background: '#ffffff', borderRadius: '6px', border: '0.5px solid #cbd5e1' }}>
                    <defs>
                      <marker id="arr-ha-g" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                      <marker id="arr-ha-r" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444" /></marker>
                      <marker id="arr-ha-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" /></marker>
                    </defs>

                    {/* us-east-1a Subnet Zone */}
                    <rect x="15" y="15" width="290" height="150" rx="8" fill="#f1f5f9" stroke={failoverStep >= 1 && failoverStep <= 3 ? '#ef4444' : '#cbd5e1'} strokeWidth="1" />
                    <text x="160" y="28" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569" fontFamily="monospace">us-east-1a (Primary Zone)</text>

                    {/* Primary DB Node in AZ-a */}
                    {failoverStep === 0 ? (
                       <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                         <rect x="35" y="45" width="250" height="100" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                         <text x="160" y="70" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#064e3b">✍️ Primary Writer DB</text>
                         <text x="160" y="92" textAnchor="middle" fontSize="8.5" fill="#16a34a" fontFamily="monospace">FQDN IP: 10.0.1.18</text>
                         <text x="160" y="112" textAnchor="middle" fontSize="8" fill="#475569">Status: Serving client connections</text>
                       </g>
                    ) : failoverStep === 1 ? (
                       <g className="active-glow-node" style={{ '--pulse-color': '#ef4444' } as React.CSSProperties}>
                         <rect x="35" y="45" width="250" height="100" rx="6" fill="#fef2f2" stroke="#ef4444" strokeWidth="2" />
                         <text x="160" y="70" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#ef4444">💥 Crashed Writer DB</text>
                         <text x="160" y="92" textAnchor="middle" fontSize="8.5" fill="#b91c1c" fontWeight="bold" fontFamily="monospace">Hypervisor Hardware Failure</text>
                         <text x="160" y="112" textAnchor="middle" fontSize="8" fill="#ef4444">Status: UNREACHABLE (0s)</text>
                       </g>
                    ) : (
                       <g opacity="0.4">
                         <rect x="35" y="45" width="250" height="100" rx="6" fill="#fef2f2" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
                         <text x="160" y="70" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#ef4444" style={{ textDecoration: 'line-through' }}>✍️ Primary Writer DB</text>
                         <text x="160" y="92" textAnchor="middle" fontSize="8.5" fill="#ef4444" fontFamily="monospace">Evicted &amp; Isolated</text>
                         <text x="160" y="112" textAnchor="middle" fontSize="8" fill="#ef4444">Status: Offlined by cluster API</text>
                        <path d="M 30 40 L 290 150 M 290 40 L 30 150" stroke="#ef4444" strokeWidth="1.5" opacity="0.4" />
                      </g>
                    )}

                    {/* us-east-1b Subnet Zone */}
                    <rect x="375" y="15" width="290" height="150" rx="8" fill="#f1f5f9" stroke={failoverStep === 5 ? '#10b981' : '#cbd5e1'} strokeWidth="1" />
                    <text x="520" y="28" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#475569" fontFamily="monospace">us-east-1b (Standby Zone)</text>

                    {/* Standby DB Node in AZ-b */}
                    {failoverStep <= 3 ? (
                       <g>
                         <rect x="395" y="45" width="250" height="100" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                         <text x="520" y="70" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#475569">🛡️ Standby DB Copy</text>
                         <text x="520" y="92" textAnchor="middle" fontSize="8.5" fill="#64748b" fontFamily="monospace">FQDN IP: 10.0.2.99</text>
                         <text x="520" y="112" textAnchor="middle" fontSize="8" fill="#64748b">Passive Hot Standby (No traffic allowed)</text>
                       </g>
                    ) : failoverStep === 4 ? (
                       <g className="active-glow-node" style={{ '--pulse-color': '#f59e0b' } as React.CSSProperties}>
                         <rect x="395" y="45" width="250" height="100" rx="6" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5" />
                         <text x="520" y="70" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#78350f">⚡ Standby Promotion</text>
                         <text x="520" y="92" textAnchor="middle" fontSize="8.5" fill="#b45309" fontFamily="monospace">Replaying Write Logs Journals...</text>
                         <text x="520" y="112" textAnchor="middle" fontSize="8.5" fill="#d97706" fontWeight="bold">Status: Crash Recovery process active</text>
                       </g>
                    ) : (
                       <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                         <rect x="395" y="45" width="250" height="100" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
                         <text x="520" y="70" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#064e3b">✍️ Promoted Primary Writer</text>
                         <text x="520" y="92" textAnchor="middle" fontSize="8.5" fill="#16a34a" fontFamily="monospace">FQDN IP: 10.0.2.99</text>
                         <text x="520" y="112" textAnchor="middle" fontSize="8.5" fill="#10b981" fontWeight="bold">Status: ACTIVE WRITER (Failover Done)</text>
                       </g>
                    )}

                    {/* Sync Block Replication line */}
                    {failoverStep === 0 ? (
                      <>
                        <path d="M 305 95 L 375 95" fill="none" stroke="#10b981" strokeWidth="2.5" className="flow-active-line" markerEnd="url(#arr-ha-g)" />
                        <text x="340" y="84" textAnchor="middle" fontSize="7.5" fill="#15803d" fontWeight="bold" fontFamily="monospace">SYNC 🔄</text>
                        <text x="340" y="112" textAnchor="middle" fontSize="7" fill="#475569">Block Copy</text>
                      </>
                    ) : (
                      <>
                        <path d="M 305 95 L 375 95" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
                        <text x="340" y="84" textAnchor="middle" fontSize="7.5" fill="#ef4444" fontWeight="bold" fontFamily="monospace">BLOCKED</text>
                        <text x="340" y="112" textAnchor="middle" fontSize="7" fill="#ef4444">No sync</text>
                      </>
                    )}
                  </svg>
                </div>

                {/* Log Event Terminal */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                    📟 disaster recovery (DR) Event logs
                  </div>
                  <div className="asg-log" style={{ minHeight: '100px', maxHeight: '140px', overflowY: 'auto' }}>
                    {failoverLogs.map((entry, idx) => (
                      <div key={idx} style={{ marginBottom: idx === failoverLogs.length - 1 ? 0 : 5 }}>
                        {entry}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Explanations & Telemetry HUD */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Active Phase details */}
                <div className="asg-card" style={{ borderLeft: '3px solid #f59e0b', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                    ⚙️ Failover Active Phase
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px' }}>
                    {failoverStep === 0 && '🟢 Cluster Healthy'}
                    {failoverStep === 1 && '🚨 Hardware Outage'}
                    {failoverStep === 2 && '🚧 Fencing Old Writer'}
                    {failoverStep === 3 && '🌐 DNS Record Shifting'}
                    {failoverStep === 4 && '⚡ Mounting Recovery Logs'}
                    {failoverStep === 5 && '🏆 Promotion Complete'}
                  </div>

                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    {failoverStep === 0 && 'Normal operating conditions. Writes are mirrored synchronously to us-east-1b before client receives success commits.'}
                    {failoverStep === 1 && 'Physical hypervisor crash in us-east-1a. Database process is completely dead. Client requests start hanging or timing out.'}
                    {failoverStep === 2 && 'RDS API isolates us-east-1a networking layer. This prevents split-brain (two nodes claiming writes simultaneously) upon reboot.'}
                    {failoverStep === 3 && 'DNS Canonical Name (CNAME) starts updating records from old writer IP (10.0.1.18) to standby IP (10.0.2.99).'}
                    {failoverStep === 4 && 'standby server in us-east-1b starts replaying transaction block logs to align disk state before mounting database engine.'}
                    {failoverStep === 5 && 'Failover complete in 45s! us-east-1b is now the primary active writer. Client traffic successfully redirects without manual code updates.'}
                  </div>
                </div>

                {/* Timeline Stats */}
                <div className="asg-card" style={{ padding: '12px 14px', fontSize: '12px' }}>
                  <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>⏱️ Failover Timeline KPI</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Outage detected:</span>
                    <span style={{ fontWeight: 'bold', color: '#ef4444' }}>~5s</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>DNS shifts complete:</span>
                    <span style={{ fontWeight: 'bold', color: '#fff' }}>~25s</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Standard failover:</span>
                    <span style={{ fontWeight: 'bold', color: '#38bdf8' }}>30–60s</span>
                  </div>
                </div>

              </div>

            </div>

            {/* Standard comparison gotchas cards from original file */}
            <div className="rds-grid2" style={{ gap: '12px', marginTop: '14px' }}>
              <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#16a34a' }}>What You Get (Benefits)</div>
                <ul className="rds-ck">
                  <li><b>High Availability &amp; DR:</b> Mitigates hardware errors, hypervisor crashes, network path outages, and total datacenter failures.</li>
                  <li><b>Zero App Code Changes:</b> RDS handles physical IP modifications on the DNS mapping. The connection endpoint FQDN remains identical.</li>
                  <li><b>Zero Data Loss:</b> Synchronous commits guarantee Standby has exact identical transaction pages before returning.</li>
                  <li><b>Backups offloaded:</b> Automated daily snapshots are conducted directly from the Standby, avoiding I/O suspension on Primary.</li>
                </ul>
              </div>
              <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#dc2626' }}>Important Trade-offs</div>
                <ul className="rds-wn">
                  <li><b>Standby is NOT readable:</b> You pay for double compute and storage, but Standby serves zero application queries.</li>
                  <li><b>Slight Write Latency:</b> Because blocks must commit on alternate hardware/network AZs before returning, writes are marginally slower than Single-AZ.</li>
                  <li><b>Failover Timeline (30–60s):</b> Standard failover takes time (Detect &rarr; Evict primary &rarr; Propagate DNS CNAME change &rarr; Standby starts recovery &rarr; In-service).</li>
                </ul>
              </div>
            </div>

          </div>
        )}

        {/* Tab 4: Read Replicas & Scaling */}
        {activeSection === 'replicas' && (
          <div>
            <div className="rds-sec">Interactive WAL Replication Lag &amp; Stale-Read Sandbox</div>
            
            {/* Interactive WAL lag controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '16px', marginBottom: '14px', alignItems: 'center' }}>
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', border: '0.5px solid var(--color-border-secondary)' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>
                  ⏳ Simulate WAL Replication Lag Delay: <b style={{ color: replicaWalLag >= 15 ? '#ef4444' : replicaWalLag >= 5 ? '#f59e0b' : '#10b981' }}>{replicaWalLag} seconds</b>
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="30" 
                  value={replicaWalLag} 
                  onChange={(e) => setReplicaWalLag(Number(e.target.value))}
                  style={{ width: '100%', accentColor: '#7c3aed', cursor: 'ew-resize' }}
                />
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
                  CloudWatch metric: `ReplicaLag` (WAL streaming replication backpressure)
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  className="asg-btn asg-on" 
                  onClick={() => {
                    const timeNow = new Date();
                    const staleTime = new Date(timeNow.getTime() - replicaWalLag * 1000);
                    if (replicaWalLag <= 2) {
                      log(`🟢 [Replica Query] Retrieved active record state: '${timeNow.toLocaleTimeString()}' (Up-to-date / strong consistency).`);
                    } else {
                      log(`🚨 [stale read event] Retrieved active record state: '${staleTime.toLocaleTimeString()}' (STALE DATA served from Replica). Lag: ${replicaWalLag}s.`);
                    }
                  }}
                  style={{ backgroundColor: '#7c3aed', borderColor: '#7c3aed', fontSize: '11.5px', padding: '7px' }}
                >
                  📖 Query Read Replica
                </button>
                <button 
                  className="asg-btn" 
                  onClick={() => setReplicaWalLag(0)}
                  style={{ fontSize: '11.5px', padding: '7px' }}
                >
                  ⚡ Sync Replica (0s lag)
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '16px', alignItems: 'start' }}>
              
              {/* Left Column: State-Responsive SVG Map */}
              <div className="rds-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', padding: '16px' }}>
                <div style={{ alignSelf: 'flex-start', display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#475569' }}>
                    🔍 Asynchronous replication streaming map
                  </span>
                  <span style={{ fontSize: '11px', color: replicaWalLag >= 15 ? '#ef4444' : replicaWalLag >= 5 ? '#f59e0b' : '#10b981', fontWeight: 'bold' }}>
                    ● {replicaWalLag === 0 ? 'REAL-TIME SYNC' : replicaWalLag >= 15 ? 'CRITICAL LAG' : 'WAL STREAMING'}
                  </span>
                </div>

                <svg width="100%" viewBox="0 0 680 180" style={{ background: '#ffffff', borderRadius: '6px', border: '0.5px solid #cbd5e1' }}>
                  <defs>
                    <marker id="arr-rep-g" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                    <marker id="arr-rep-y" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" /></marker>
                    <marker id="arr-rep-r" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444" /></marker>
                  </defs>

                  {/* Primary DB in AZ-a */}
                  <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                    <rect x="25" y="45" width="200" height="90" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                    <text x="125" y="70" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#064e3b">✍️ Primary Writer DB</text>
                    <text x="125" y="90" textAnchor="middle" fontSize="8.5" fill="#475569" fontFamily="monospace">Endpoint: db.writer.cluster</text>
                    <text x="125" y="110" textAnchor="middle" fontSize="8" fill="#16a34a">Handles 100% of Write Queries</text>
                  </g>

                  {/* Read Replica 1 in AZ-c */}
                  <g className="active-glow-node" style={{ '--pulse-color': '#7c3aed' } as React.CSSProperties}>
                    <rect x="440" y="20" width="215" height="60" rx="6" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="1" />
                    <text x="547.5" y="42" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#4c1d95">📖 Read Replica 1</text>
                    <text x="547.5" y="60" textAnchor="middle" fontSize="7.5" fill="#7c3aed" fontFamily="monospace">replica-1.domain.amazonaws.com</text>
                  </g>

                  {/* Read Replica 2 in AZ-b */}
                  <g className="active-glow-node" style={{ '--pulse-color': '#7c3aed' } as React.CSSProperties}>
                    <rect x="440" y="100" width="215" height="60" rx="6" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="1" />
                    <text x="547.5" y="122" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#4c1d95">📖 Read Replica 2</text>
                    <text x="547.5" y="140" textAnchor="middle" fontSize="7.5" fill="#7c3aed" fontFamily="monospace">replica-2.domain.amazonaws.com</text>
                  </g>

                  {/* Replication stream connector paths */}
                  
                  {/* Primary -> Replica 1 */}
                  <path 
                    d="M 225 75 Q 330 35 440 45" 
                    fill="none" 
                    stroke={replicaWalLag >= 15 ? '#ef4444' : replicaWalLag >= 5 ? '#f59e0b' : '#10b981'} 
                    strokeWidth="1.5" 
                    className="flow-active-line"
                    markerEnd={replicaWalLag >= 15 ? 'url(#arr-rep-r)' : replicaWalLag >= 5 ? 'url(#arr-rep-y)' : 'url(#arr-rep-g)'}
                  />

                  {/* Primary -> Replica 2 */}
                  <path 
                    d="M 225 105 Q 330 145 440 135" 
                    fill="none" 
                    stroke={replicaWalLag >= 15 ? '#ef4444' : replicaWalLag >= 5 ? '#f59e0b' : '#10b981'} 
                    strokeWidth="1.5" 
                    className="flow-active-line"
                    markerEnd={replicaWalLag >= 15 ? 'url(#arr-rep-r)' : replicaWalLag >= 5 ? 'url(#arr-rep-y)' : 'url(#arr-rep-g)'}
                  />

                  <text x="330" y="65" textAnchor="middle" fontSize="9" fontWeight="bold" fill={replicaWalLag >= 15 ? '#b91c1c' : '#2563eb'} fontFamily="monospace">
                    {replicaWalLag === 0 ? 'SYNCHRONIZED' : `ASYNCHRONOUS WAL LAG: ${replicaWalLag}s`}
                  </text>
                  <text x="330" y="120" textAnchor="middle" fontSize="7.5" fill="#475569">Binary replication stream</text>
                </svg>
              </div>

              {/* Right Column: Eventual Consistency HUD */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Eventual consistency warning card */}
                {replicaWalLag > 2 ? (
                  <div className="asg-card" style={{ borderLeft: '3px solid #f59e0b', backgroundColor: 'rgba(245,158,11,0.03)', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>
                      ⚠️ Eventual Consistency Risk
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                      Primary writer updated rows at `T-0`. Replicas are still catching up with WAL log offsets.
                      <br /><br />
                      Reading from replicas now will serve **stale data** that is {replicaWalLag} seconds behind real-time.
                    </div>
                  </div>
                ) : (
                  <div className="asg-card" style={{ borderLeft: '3px solid #10b981', padding: '12px 14px' }}>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
                      🟢 Strong Read Consistency
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                      Minimal WAL lag delay of {replicaWalLag}s.
                      <br /><br />
                      Replicas are fully caught up. Reads served are near-100% strongly consistent with zero risk of stale data.
                    </div>
                  </div>
                )}

                {/* Stale read logic details */}
                <div className="asg-card" style={{ padding: '12px 14px', fontSize: '11px', lineHeight: '1.4', color: 'var(--color-text-secondary)', background: '#f8fafc' }}>
                  <div style={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}>🛡️ Mitigating Replica Lag</div>
                  To prevent serving stale data to a user who just wrote something:
                  <ul style={{ paddingLeft: '14px', margin: '4px 0 0 0' }}>
                    <li><b>Read-Your-Own-Writes:</b> Force queries to go to the **Primary Writer** for 10-15s immediately following a transaction write.</li>
                    <li><b>ElastiCache:</b> Cache updates synchronously in Redis for instant read-backs.</li>
                  </ul>
                </div>

              </div>

            </div>

            {/* Standard lists from original file */}
            <div className="rds-grid2" style={{ gap: '12px', marginTop: '14px' }}>
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

            {/* Sub-tab grids */}
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
            <div className="rds-sec">Advanced Enterprise Features: Backup Sandbox, CoW Cloning, Compliance HUD, ML SQL &amp; RDS Proxy</div>
            <div className="rds-card" style={{ background: '#ffffff', border: '1.5px solid #cbd5e1' }}>
              
              {/* Feature sub-tabs */}
              <div className="rds-subtabs" style={{ borderBottomColor: '#cbd5e1' }}>
                <button className={`rds-subtb ${activeFeatureTab === 'backup' ? 'rds-on' : ''}`} onClick={() => setActiveFeatureTab('backup')}>💾 6.1) Backup PITR Sandbox</button>
                <button className={`rds-subtb ${activeFeatureTab === 'clone' ? 'rds-on' : ''}`} onClick={() => setActiveFeatureTab('clone')}>🧬 6.2) DB Cloning Sandbox</button>
                <button className={`rds-subtb ${activeFeatureTab === 'security' ? 'rds-on' : ''}`} onClick={() => setActiveFeatureTab('security')}>🔒 6.3) Security HUD Grade</button>
                <button className={`rds-subtb ${activeFeatureTab === 'ml' ? 'rds-on' : ''}`} onClick={() => setActiveFeatureTab('ml')}>🤖 6.4) ML SQL Sandbox</button>
                <button className={`rds-subtb ${activeFeatureTab === 'proxy' ? 'rds-on' : ''}`} onClick={() => setActiveFeatureTab('proxy')}>🔀 6.5) RDS Proxy Pooling</button>
              </div>

              {/* Sub-tab 6.1: Backup & Restore */}
              {activeFeatureTab === 'backup' && (() => {
                const formatPitrTime = (m: number) => {
                  const hh = String(Math.floor(m / 60)).padStart(2, '0');
                  const mm = String(m % 60).padStart(2, '0');
                  return `${hh}:${mm}:00 UTC`;
                };

                const pitrTimeFormatted = formatPitrTime(pitrTargetTime);
                const isLateTime = pitrTargetTime > 720;
                
                return (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#b45309' }}>💾 Point-in-Time Recovery (PITR) Daily Snapshots &amp; WAL Timeline Simulator</div>
                    <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px', lineHeight: '1.45' }}>
                      RDS combines **Daily automated incremental backups** with **5-minute transaction Write-Ahead Log (WAL) streams** uploaded to Amazon S3. Restore your cluster down to any exact millisecond commit within the retention window.
                    </div>
                    
                    <div className="rds-grid2" style={{ gap: '14px', marginBottom: '14px' }}>
                      <div className="rds-ctrl" style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1' }}>
                        <label style={{ color: '#475569' }}>1. Set Backup Retention Window (Days)</label>
                        <input type="range" min="1" max="35" value={pitrDays} onChange={(e) => setPitrDays(Number(e.target.value))} />
                        <div className="out" style={{ color: '#b45309' }}>Retention Period: <b>{pitrDays} days</b> (Range: 1–35 days)</div>
                      </div>

                      <div className="rds-ctrl" style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1' }}>
                        <label style={{ color: '#475569' }}>2. Drag Target Recovery Point (Timeline Time)</label>
                        <input type="range" min="0" max="1439" value={pitrTargetTime} onChange={(e) => setPitrTargetTime(Number(e.target.value))} />
                        <div className="out" style={{ color: '#0284c7' }}>Point-In-Time: <b>{pitrTimeFormatted}</b></div>
                      </div>
                    </div>

                    {/* Timeline Interactive Vector */}
                    <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#f8fafc', marginBottom: '14px' }}>
                      <div style={{ fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', marginBottom: '8px', color: '#475569' }}>
                        📊 RDS Point-In-Time Recovery Timeline (Active Restore Frame)
                      </div>
                      
                      <svg width="100%" height="90" viewBox="0 0 640 90" style={{ background: '#ffffff', borderRadius: '6px', border: '0.5px solid #cbd5e1' }}>
                        {/* Timeline Base Bar */}
                        <rect x="30" y="45" width="580" height="8" rx="4" fill="#cbd5e1" />
                        <rect x="30" y="45" width="580" height="8" rx="4" fill="#10b981" opacity="0.3" />
                        
                        {/* Daily snapshot nodes */}
                        <circle cx="50" cy="49" r="6" fill="#10b981" />
                        <text x="50" y="32" textAnchor="middle" fontSize="8" fill="#047857" fontWeight="bold">Snapshot 00:00</text>
                        
                        <circle cx="240" cy="49" r="6" fill="#10b981" />
                        <text x="240" y="32" textAnchor="middle" fontSize="8" fill="#047857" fontWeight="bold">Snapshot 08:00</text>

                        <circle cx="430" cy="49" r="6" fill="#10b981" />
                        <text x="430" y="32" textAnchor="middle" fontSize="8" fill="#047857" fontWeight="bold">Snapshot 16:00</text>
                        
                        {/* Selected recovery point indicator */}
                        {(() => {
                          const px = 30 + (pitrTargetTime / 1439) * 580;
                          return (
                            <g>
                              <line x1={px} y1="12" x2={px} y2="78" stroke="#0284c7" strokeWidth="2" strokeDasharray="2,2" />
                              <polygon points={`${px},40 ${px - 5},30 ${px + 5},30`} fill="#0284c7" />
                              <circle cx={px} cy="49" r="8" fill="#0284c7" className="active-glow-node" style={{ '--pulse-color': 'rgba(2, 132, 199, 0.4)' } as React.CSSProperties} />
                              <text x={px} y="74" textAnchor="middle" fontSize="9" fill="#0284c7" fontWeight="bold">Target Point: {pitrTimeFormatted}</text>
                            </g>
                          );
                        })()}
                        
                        {/* S3 WAL Segments continuous label */}
                        <text x="590" y="18" textAnchor="end" fontSize="8" fill="#475569" fontFamily="monospace">Continuous WAL Streams ➡️ Amazon S3</text>
                      </svg>
                    </div>

                    <div className="rds-grid2" style={{ gap: '14px', marginBottom: '14px' }}>
                      {/* Restoration Log Monospace Terminal */}
                      <div style={{ background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ fontWeight: 600, fontSize: '11px', color: '#0284c7', marginBottom: '8px', fontFamily: 'monospace' }}>
                          ⚡ Monospace Recovery Journal Logs
                        </div>
                        <div className="rds-mono" style={{ fontSize: '10.5px', color: '#334155', lineHeight: '1.5', minHeight: '120px' }}>
                          <span style={{ color: '#475569' }}>[1/4]</span> Probing S3 catalog for base daily snapshot...<br/>
                          <span style={{ color: '#16a34a' }}>[SUCCESS]</span> Found snapshot <span style={{ color: '#15803d', fontWeight: 'bold' }}>`rds-backup-snap-daily-t00`</span><br/>
                          <span style={{ color: '#475569' }}>[2/4]</span> Deploying new database compute node in isolated VPC subnet...<br/>
                          <span style={{ color: '#475569' }}>[3/4]</span> Replaying S3 Write-Ahead Log (WAL) segments...<br/>
                          <span style={{ color: '#2563eb' }}>[INFO]</span> Streamed {isLateTime ? '1,592' : '482'} WAL logs from snapshot to target restore frame {pitrTimeFormatted}<br/>
                          <span style={{ color: '#d97706' }}>[SUCCESS]</span> DB cluster fully recovered to T-minus {pitrTimeFormatted}. Status: <span style={{ color: '#16a34a', fontWeight: 'bold' }}>ACTIVE</span>
                        </div>
                      </div>

                      {/* Technical specifications */}
                      <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#15803d', marginBottom: '6px' }}>Recovery Action Metrics</div>
                        <div className="rds-mono" style={{ fontSize: '11px', marginBottom: '6px', color: '#1e293b' }}>
                          <span style={{ color: '#475569' }}>Backup Window Active:</span> <b>{pitrDays} Days</b>
                        </div>
                        <div className="rds-mono" style={{ fontSize: '11px', marginBottom: '6px', color: '#1e293b' }}>
                          <span style={{ color: '#475569' }}>Recovery Target Point:</span> <b style={{ color: '#0284c7' }}>{pitrTimeFormatted}</b>
                        </div>
                        <div className="rds-mono" style={{ fontSize: '11px', marginBottom: '6px', color: '#1e293b' }}>
                          <span style={{ color: '#475569' }}>Est. Restoration time:</span> <b style={{ color: '#d97706' }}>{isLateTime ? '18.4 seconds' : '7.2 seconds'}</b>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '8px', lineHeight: '1.4' }}>
                          💡 <b>System Note:</b> Point-in-time recovery builds a completely *new* database instance. The source production database suffers **zero downtime** and **zero system latency** during restore workflows.
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Sub-tab 6.2: DB Cloning */}
              {activeFeatureTab === 'clone' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#7c3aed' }}>🧬 Amazon Aurora Copy-on-Write Instant Database Cloning</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px', lineHeight: '1.45' }}>
                    Unlike standard snapshot restores that physically duplicate raw database sectors (taking hours), **Aurora Database Cloning** uses a **Copy-on-Write metadata pointer mapping**. Create instant clones for staging/analytics that cost nothing and share storage pages until records actually diverge!
                  </div>

                  <div className="rds-grid2" style={{ gap: '14px', alignItems: 'stretch' }}>
                    {/* Cloning SVG Sandbox */}
                    <div style={{ border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px', color: '#475569' }}>
                          📐 Copy-on-Write Database Metadata Storage Mapping
                        </div>
                        
                        <svg width="100%" height="150" viewBox="0 0 310 150" style={{ background: '#ffffff', borderRadius: '6px', border: '0.5px solid #cbd5e1' }}>
                          {/* Production Node */}
                          <rect x="15" y="15" width="100" height="36" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
                          <text x="65" y="33" textAnchor="middle" fontSize="9" fill="#064e3b" fontWeight="bold">Production DB</text>

                          {/* Cloned Node */}
                          <rect x="195" y="15" width="100" height="36" rx="4" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="1" />
                          <text x="245" y="33" textAnchor="middle" fontSize="9" fill="#4c1d95" fontWeight="bold">Staging Clone DB</text>

                          {/* Base Storage Pool */}
                          <rect x="15" y="90" width="280" height="45" rx="5" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1" />
                          <text x="155" y="102" textAnchor="middle" fontSize="8.5" fill="#475569" fontWeight="bold">Shared Quorum Physical Volume (500 GiB)</text>

                          {/* Shared Storage Blocks */}
                          <rect x="25" y="112" width="30" height="16" rx="2" fill="#e2e8f0" stroke="#10b981" strokeWidth="0.5" />
                          <text x="40" y="120" textAnchor="middle" fontSize="8" fill="#047857">Blk A</text>

                          <rect x="65" y="112" width="30" height="16" rx="2" fill="#e2e8f0" stroke="#10b981" strokeWidth="0.5" />
                          <text x="80" y="120" textAnchor="middle" fontSize="8" fill="#047857">Blk B</text>

                          <rect x="105" y="112" width="30" height="16" rx="2" fill="#e2e8f0" stroke="#10b981" strokeWidth="0.5" />
                          <text x="120" y="120" textAnchor="middle" fontSize="8" fill="#047857">Blk C</text>

                          {/* Pointers lines */}
                          <path d="M 65 52 L 65 90" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" />
                          <path d="M 245 52 L 245 90" fill="none" stroke="#7c3aed" strokeWidth="1" strokeDasharray="3,3" />

                          {/* Diverged Blocks inside the storage or above */}
                          {cloneDivergedBlocks > 0 ? (
                            <>
                              <rect x="200" y="112" width="80" height="16" rx="2" fill="#fee2e2" stroke="#ef4444" strokeWidth="0.5" className="active-glow-node" style={{ '--pulse-color': 'rgba(239, 68, 68, 0.4)' } as React.CSSProperties} />
                              <text x="240" y="120" textAnchor="middle" fontSize="7.5" fill="#991b1b" fontWeight="bold">Diverged ({cloneDivergedBlocks} Blk)</text>
                              <path d="M 245 52 L 240 110" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                            </>
                          ) : (
                            <text x="210" y="122" textAnchor="middle" fontSize="8" fill="#64748b">Zero Diverge</text>
                          )}
                        </svg>
                      </div>

                      <div style={{ marginTop: '10px' }}>
                        <button className="rds-btn rds-primary" onClick={handleCloneWrite} style={{ background: '#7c3aed', borderColor: '#7c3aed', width: '100%', justifyContent: 'center' }}>
                          ✍️ Simulate WRITE on Clone DB (Trigger Storage Divergence)
                        </button>
                      </div>
                    </div>

                    {/* Clone activity terminal console */}
                    <div style={{ background: '#f1f5f9', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '11px', color: '#7c3aed', marginBottom: '8px', fontFamily: 'monospace' }}>
                        📟 Copy-On-Write Storage Allocation Real-time Streams
                      </div>
                      
                      <div className="rds-mono" style={{ fontSize: '10.5px', color: '#334155', height: '140px', overflowY: 'auto', lineHeight: '1.6' }}>
                        {cloneLogs.map((lg, idx) => (
                          <div key={idx} dangerouslySetInnerHTML={{ __html: lg }} />
                        ))}
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: '10px', marginTop: '10px', fontSize: '11px', color: '#1e293b' }}>
                        <div>Production Size: <b style={{ color: '#10b981' }}>500 GiB</b></div>
                        <div>Clone Diverged Cost: <b style={{ color: cloneDivergedBlocks > 0 ? '#ef4444' : '#475569' }}>{cloneDivergedBlocks * 4} GiB</b></div>
                        <div>Storage Saved: <b style={{ color: '#16a34a' }}>{cloneDivergedBlocks > 0 ? `${(1 - (cloneDivergedBlocks * 4 / 500)) * 100}%` : '100%'}</b></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 6.3: Security Checklist */}
              {activeFeatureTab === 'security' && (() => {
                const passed = secItems.filter(i => i.done).length;
                const total = secItems.length;
                const pct = Math.round((passed / total) * 100);

                let grade = 'F';
                let gColor = '#ef4444';
                let gDesc = 'Critical Insecure';
                if (pct >= 90) { grade = 'A+'; gColor = '#10b981'; gDesc = 'Highly Hardened (Production Ready)'; }
                else if (pct >= 80) { grade = 'A'; gColor = '#10b981'; gDesc = 'Excellent Security Grade'; }
                else if (pct >= 70) { grade = 'B'; gColor = '#3b82f6'; gDesc = 'Secure Configuration'; }
                else if (pct >= 50) { grade = 'C'; gColor = '#fbbf24'; gDesc = 'Basic Security (Needs Hardening)'; }
                else if (pct >= 30) { grade = 'D'; gColor = '#f97316'; gDesc = 'Vulnerable Configuration'; }

                // Stroke dash circumference calculations
                const radius = 36;
                const circumference = 2 * Math.PI * radius; // ~226.19
                const strokeDashoffset = circumference - (pct / 100) * circumference;

                return (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#15803d' }}>🔒 Production Grade Database Security Compliance Hardening Auditor</div>
                    <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px', lineHeight: '1.45' }}>
                      Security Group inbound filters, SSL enforcement, Database encryption at rest, and deletion locks are crucial for databases. Complete target checks below to audit compliance score.
                    </div>

                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', background: '#f8fafc', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                      {/* Security Circular Progress Circle Ring */}
                      <div style={{ position: 'relative', width: '90px', height: '90px', flexShrink: 0 }}>
                        <svg width="90" height="90" viewBox="0 0 90 90">
                          {/* Base circle background track */}
                          <circle cx="45" cy="45" r={radius} fill="none" stroke="#cbd5e1" strokeWidth="6" />
                          {/* Progress circle track */}
                          <circle
                            cx="45"
                            cy="45"
                            r={radius}
                            fill="none"
                            stroke={gColor}
                            strokeWidth="6"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            transform="rotate(-90 45 45)"
                            style={{ transition: 'stroke-dashoffset 0.35s' }}
                          />
                        </svg>
                        {/* Text center displays */}
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                          <span style={{ fontSize: '18px', fontWeight: 'bold', color: gColor }}>{grade}</span>
                          <span style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{pct}%</span>
                        </div>
                      </div>

                      {/* Score metrics */}
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff' }}>Compliance Grade: <span style={{ color: gColor }}>{grade} — {gDesc}</span></div>
                        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px', lineHeight: '1.4' }}>
                          Your database currently satisfies <b>{passed} out of {total}</b> verified hardening guidelines. AWS Well-Architected Framework requires an A/A+ grade configuration before exposing active tables to any external compute sources.
                        </div>
                      </div>
                    </div>

                    {/* Hardening Checklist Grid */}
                    <div className="rds-grid2" style={{ gap: '8px', marginBottom: '12px' }}>
                      {secItems.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => toggleSecItem(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '10px',
                            border: '1px solid #1e293b',
                            borderRadius: '8px',
                            background: item.done ? '#064e3b' : '#1e1b4b',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ fontSize: '14px' }}>{item.done ? '✅' : '⬜'}</div>
                          <div style={{ fontSize: '11.5px', fontWeight: 600, color: item.done ? '#34d399' : '#c084fc' }}>
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Sub-tab 6.4: ML Integration */}
              {activeFeatureTab === 'ml' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#6d28d9' }}>🤖 High-Throughput SQL Machine Learning Inference Sandbox (pgml)</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px', lineHeight: '1.45' }}>
                    AWS RDS PostgreSQL and Aurora support continuous machine learning inferences directly inside relational SQL queries! Call SageMaker endpoints synchronously, train linear models inside PostgreSQL schemas, or delegate classification via Lambda pipelines.
                  </div>

                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    <button
                      className={`rds-subtb ${activeMlQuery === 'sentiment' ? 'rds-on-purple' : ''}`}
                      onClick={() => { setActiveMlQuery('sentiment'); setMlOutput([]); setMlLogs([]); }}
                    >
                      🗣️ Sentiment Analyzer (SageMaker Endpoint)
                    </button>
                    <button
                      className={`rds-subtb ${activeMlQuery === 'fraud' ? 'rds-on-purple' : ''}`}
                      onClick={() => { setActiveMlQuery('fraud'); setMlOutput([]); setMlLogs([]); }}
                    >
                      💳 Transaction Fraud Evaluator (In-Database pgml)
                    </button>
                    <button
                      className={`rds-subtb ${activeMlQuery === 'churn' ? 'rds-on-purple' : ''}`}
                      onClick={() => { setActiveMlQuery('churn'); setMlOutput([]); setMlLogs([]); }}
                    >
                      📈 Churn Prediction Models (SageMaker Bridge)
                    </button>
                  </div>

                  <div className="rds-grid2" style={{ gap: '12px', marginBottom: '12px' }}>
                    <div>
                      <div className="rds-sec" style={{ color: '#6d28d9' }}>Active SQL Inference Query Block</div>
                      <div className="rds-code-container" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                        <div className="rds-code" style={{ color: '#4c1d95' }}>
                          {activeMlQuery === 'sentiment' && mlFlows.lambda.sql}
                          {activeMlQuery === 'fraud' && mlFlows.app.sql}
                          {activeMlQuery === 'churn' && mlFlows.pgml.sql}
                        </div>
                      </div>
                      <button className="rds-btn" onClick={runMlInference} style={{ marginTop: '10px', background: '#7c3aed', color: '#fff', borderColor: '#7c3aed', width: '100%', justifyContent: 'center' }}>
                        ⚡ Run ML Inference Query inside DB
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Active Monospace Terminal Logs */}
                      <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '10.5px', color: '#475569', marginBottom: '6px', fontFamily: 'monospace' }}>
                          📟 Query ML Inference Terminal Streams
                        </div>
                        <div className="rds-mono" style={{ fontSize: '10px', color: '#334155', minHeight: '80px', lineHeight: '1.5' }}>
                          {mlIsLoading ? (
                            <div style={{ color: '#b45309', animation: 'activeNodePulse 1s infinite', '--pulse-color': 'rgba(180, 83, 9, 0.4)' } as React.CSSProperties}>
                              Connecting to AWS SageMaker Inference Cluster... 🚀
                            </div>
                          ) : mlLogs.length === 0 ? (
                            <span style={{ color: '#64748b' }}>Click "Run ML Inference Query inside DB" to view inference executions.</span>
                          ) : null}
                          {mlLogs.map((log, idx) => (
                            <div key={idx}>{log}</div>
                          ))}
                        </div>
                      </div>

                      {/* SQL Output Table Response */}
                      {mlOutput.length > 0 && (
                        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ fontWeight: 600, fontSize: '11px', color: '#047857', marginBottom: '6px', fontFamily: 'monospace' }}>
                            📊 SQL GRID RESULT SET (SageMaker Returns)
                          </div>
                          <table className="rds-table" style={{ fontSize: '10px' }}>
                            <thead>
                              <tr style={{ background: '#f1f5f9' }}>
                                {activeMlQuery === 'sentiment' && (
                                  <>
                                    <th style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Customer Feedback Comment</th>
                                    <th style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Sentiment</th>
                                    <th style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Confidence</th>
                                  </>
                                )}
                                {activeMlQuery === 'fraud' && (
                                  <>
                                    <th style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Inbound Transaction ID</th>
                                    <th style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>ML Score</th>
                                    <th style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Action Result</th>
                                  </>
                                )}
                                {activeMlQuery === 'churn' && (
                                  <>
                                    <th style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Target Customer Account</th>
                                    <th style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Churn Propensity</th>
                                    <th style={{ color: '#475569', borderBottom: '1px solid #e2e8f0' }}>Engagement Status</th>
                                  </>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {mlOutput.map((row, idx) => (
                                <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                  {activeMlQuery === 'sentiment' && (
                                    <>
                                      <td style={{ border: '1px solid #e2e8f0', color: '#334155' }}>{row.review}</td>
                                      <td style={{ border: '1px solid #e2e8f0', color: row.sentiment === 'NEGATIVE' ? '#b91c1c' : '#15803d', fontWeight: 'bold' }}>{row.sentiment}</td>
                                      <td style={{ border: '1px solid #e2e8f0', color: '#1d4ed8' }}>{row.confidence}</td>
                                    </>
                                  )}
                                  {activeMlQuery === 'fraud' && (
                                    <>
                                      <td style={{ border: '1px solid #e2e8f0', color: '#334155' }}>{row.txn}</td>
                                      <td style={{ border: '1px solid #e2e8f0', color: row.risk.includes('HIGH') ? '#b91c1c' : '#15803d', fontWeight: 'bold' }}>{row.risk}</td>
                                      <td style={{ border: '1px solid #e2e8f0', color: '#1d4ed8' }}>{row.action}</td>
                                    </>
                                  )}
                                  {activeMlQuery === 'churn' && (
                                    <>
                                      <td style={{ border: '1px solid #e2e8f0', color: '#334155' }}>{row.user}</td>
                                      <td style={{ border: '1px solid #e2e8f0', color: row.score.includes('High') ? '#b91c1c' : '#15803d', fontWeight: 'bold' }}>{row.score}</td>
                                      <td style={{ border: '1px solid #e2e8f0', color: '#6d28d9' }}>{row.status}</td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 6.5: RDS Proxy Pool Simulator */}
              {activeFeatureTab === 'proxy' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#0284c7' }}>🔀 RDS Proxy Serverless Connection Multiplexing Pool Simulator</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px', lineHeight: '1.45' }}>
                    Standard serverless architectures (like AWS Lambda concurrent runs) create thousands of instantaneous TCP sockets. RDS Proxy acts as a high-performance proxy pool, scaling connections down to small persistent pipes to avoid database out-of-memory errors.
                  </div>

                  <div className="rds-ctrl" style={{ marginBottom: '14px', background: '#f8fafc', border: '1.5px solid #cbd5e1' }}>
                    <label style={{ color: '#475569' }}>Set Active App / Lambda Ingress Connection Surge (TCP Clients)</label>
                    <input type="range" min="10" max="1000" value={proxyConcurrency} onChange={(e) => setProxyConcurrency(Number(e.target.value))} />
                    <div className="out" style={{ color: '#0284c7' }}>Incoming Surge Load: <b>{proxyConcurrency} Active TCP Clients</b></div>
                  </div>

                  <div className="rds-grid3" style={{ marginBottom: '14px' }}>
                    <div className="rds-k" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <div className="t" style={{ color: '#ef4444' }}>Incoming Surge</div>
                      <div className="v" style={{ color: '#b91c1c' }}>{proxyConcurrency} Sockets</div>
                    </div>
                    <div className="rds-k" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <div className="t" style={{ color: '#10b981' }}>Pooled DB Backends</div>
                      <div className="v" style={{ color: '#15803d' }}>
                        {Math.max(10, Math.min(60, Math.round(proxyConcurrency * 0.05 + 8)))} Pipes
                      </div>
                    </div>
                    <div className="rds-k" style={{ background: '#ffffff', border: '1px solid #e2e8f0' }}>
                      <div className="t" style={{ color: '#0284c7' }}>CPU Context Savings</div>
                      <div className="v" style={{ color: '#1d4ed8' }}>
                        {Math.round((1 - (Math.max(10, Math.min(60, Math.round(proxyConcurrency * 0.05 + 8))) / proxyConcurrency)) * 100)}%
                      </div>
                    </div>
                  </div>

                  {/* Interactive pooling diagram vector */}
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#f8fafc', marginBottom: '14px' }}>
                    <div style={{ fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', marginBottom: '6px', color: '#64748b' }}>
                      🔀 Real-Time Connection Pooling Multiplexing Path
                    </div>
                    
                    <svg width="100%" height="100" viewBox="0 0 640 100" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                      {/* Client Side Nodes */}
                      <rect x="20" y="10" width="100" height="80" rx="4" fill="#eff6ff" stroke="#3b82f6" strokeWidth="0.5" />
                      <text x="70" y="32" textAnchor="middle" fontSize="9" fill="#1d4ed8" fontWeight="bold">Lambda Surge</text>
                      <text x="70" y="52" textAnchor="middle" fontSize="11" fill="#1e40af" fontWeight="bold">{proxyConcurrency}</text>
                      <text x="70" y="70" textAnchor="middle" fontSize="8" fill="#64748b">TCP Sockets</text>

                      {/* Proxy Node */}
                      <rect x="250" y="15" width="140" height="70" rx="6" fill="#ecfdfb" stroke="#0284c7" strokeWidth="1.5" className="active-glow-node" style={{ '--pulse-color': 'rgba(2, 132, 199, 0.4)' } as React.CSSProperties} />
                      <text x="320" y="38" textAnchor="middle" fontSize="10.5" fill="#0f172a" fontWeight="bold">🔄 RDS Proxy Pool</text>
                      <text x="320" y="58" textAnchor="middle" fontSize="8.5" fill="#0369a1" fontWeight="bold">Multiplexing Active</text>
                      <text x="320" y="72" textAnchor="middle" fontSize="8" fill="#475569" fontFamily="monospace">Queue Draining</text>

                      {/* Database Node */}
                      <rect x="520" y="10" width="100" height="80" rx="4" fill="#ecfdf5" stroke="#059669" strokeWidth="0.5" />
                      <text x="570" y="32" textAnchor="middle" fontSize="9" fill="#047857" fontWeight="bold">PostgreSQL DB</text>
                      <text x="570" y="52" textAnchor="middle" fontSize="11" fill="#065f46" fontWeight="bold">{Math.max(10, Math.min(60, Math.round(proxyConcurrency * 0.05 + 8)))}</text>
                      <text x="570" y="70" textAnchor="middle" fontSize="8" fill="#64748b">Stable Sockets</text>

                      {/* Streaming Connection paths */}
                      {/* Flow Surge -> Proxy */}
                      <path d="M 120 30 L 250 45" fill="none" stroke="#ef4444" strokeWidth="1.5" className="flow-active-line" style={{ strokeDasharray: '4, 2', animationDuration: proxyConcurrency > 600 ? '0.2s' : '0.5s' } as React.CSSProperties} />
                      <path d="M 120 50 L 250 50" fill="none" stroke="#ef4444" strokeWidth="1.5" className="flow-active-line" style={{ strokeDasharray: '4, 2', animationDuration: proxyConcurrency > 600 ? '0.1s' : '0.4s' } as React.CSSProperties} />
                      <path d="M 120 70 L 250 55" fill="none" stroke="#ef4444" strokeWidth="1.5" className="flow-active-line" style={{ strokeDasharray: '4, 2', animationDuration: proxyConcurrency > 600 ? '0.2s' : '0.5s' } as React.CSSProperties} />

                      {/* Flow Proxy -> DB (Slow, stable green flow) */}
                      <path d="M 390 50 L 520 50" fill="none" stroke="#10b981" strokeWidth="3" className="flow-active-line" style={{ strokeDasharray: '8, 4', animationDuration: '2s' } as React.CSSProperties} />
                    </svg>
                  </div>

                  <div style={{ background: '#ecfdf5', border: '1.5px solid #10b981', borderRadius: '8px', padding: '12px', fontSize: '12px', color: '#064e3b', lineHeight: '1.5' }}>
                    🚀 <b>Proxy Connection Pooling Advantage:</b> Without RDS Proxy, launching {proxyConcurrency} lambdas opens {proxyConcurrency} direct TCP connections, exhausting base database backend thread limits (`max_connections` exhaust) and triggering SQL execution faults. With RDS Proxy, all connections are pooled down to a highly optimized socket pool of just <b>{Math.max(10, Math.min(60, Math.round(proxyConcurrency * 0.05 + 8)))}</b>!
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
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2563eb' }}>Production Grade AWS RDS Topology Map</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '10px' }}>
                    Multi-AZ Standby combined with scale-out Read Replicas and RDS Proxy in a private VPC layout.
                  </div>

                  <svg width="100%" viewBox="0 0 660 480" style={{ display: 'block', background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' }}>
                    <defs>
                      <linearGradient id="g-dark" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f8fafc" />
                        <stop offset="100%" stopColor="#f1f5f9" />
                      </linearGradient>
                      <linearGradient id="g-public" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#eff6ff" />
                        <stop offset="100%" stopColor="#dbeafe" />
                      </linearGradient>
                      <linearGradient id="g-app" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ecfdf5" />
                        <stop offset="100%" stopColor="#d1fae5" />
                      </linearGradient>
                      <linearGradient id="g-replica" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f5f3ff" />
                        <stop offset="100%" stopColor="#e0e7ff" />
                      </linearGradient>
                      
                      <marker id="arr-g" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                      <marker id="arr-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" /></marker>
                      <marker id="arr-p" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6" /></marker>
                    </defs>

                    {/* Base grid background */}
                    <rect x="0" y="0" width="660" height="480" fill="url(#g-dark)" />
                    
                    <text x="330" y="24" textAnchor="middle" fontSize="11" fill="#64748b" fontWeight="600" fontFamily="sans-serif">VPC (Spanning 3 Availability Zones)</text>

                    {/* PUBLIC SUBNETS */}
                    <rect x="20" y="38" width="620" height="60" rx="6" fill="#f1f5f9" stroke="#1d4ed8" strokeWidth="1" opacity="0.8"/>
                    <text x="330" y="52" textAnchor="middle" fontSize="9" fill="#1d4ed8" fontWeight="bold" fontFamily="monospace">PUBLIC INGRESS SUBNETS</text>
                    
                    <rect x="50" y="60" width="160" height="28" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5"/>
                    <text x="130" y="77" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="600" fontFamily="sans-serif">🌐 Internet ALB</text>
                    
                    <rect x="250" y="60" width="160" height="28" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5"/>
                    <text x="330" y="77" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="600" fontFamily="sans-serif">🔒 WAF Firewall</text>
                    
                    <rect x="450" y="60" width="160" height="28" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5"/>
                    <text x="530" y="77" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="600" fontFamily="sans-serif">🌍 NAT Gateway</text>

                    {/* PRIVATE APP SUBNETS */}
                    <rect x="20" y="112" width="620" height="75" rx="6" fill="#f1f5f9" stroke="#065f46" strokeWidth="1" opacity="0.8"/>
                    <text x="330" y="125" textAnchor="middle" fontSize="9" fill="#059669" fontWeight="bold" fontFamily="monospace">PRIVATE APPLICATION SUBNETS</text>
                    
                    <rect x="50" y="135" width="160" height="40" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5"/>
                    <text x="130" y="152" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="600" fontFamily="sans-serif">⚙️ App EC2 / ECS</text>
                    <text x="130" y="165" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">runs database driver</text>
                    
                    <rect x="250" y="135" width="160" height="40" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5"/>
                    <text x="330" y="152" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="600" fontFamily="sans-serif">🔄 RDS Proxy Endpoint</text>
                    <text x="330" y="165" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">Survives Failovers Instantly</text>

                    <rect x="450" y="135" width="160" height="40" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5"/>
                    <text x="530" y="152" textAnchor="middle" fontSize="10" fill="#334155" fontWeight="600" fontFamily="sans-serif">🔑 Secrets Manager</text>
                    <text x="530" y="165" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">IAM password rotations</text>

                    {/* PRIVATE DB SUBNETS */}
                    <rect x="20" y="200" width="620" height="260" rx="6" fill="#f1f5f9" stroke="#b45309" strokeWidth="1" opacity="0.8"/>
                    <text x="330" y="215" textAnchor="middle" fontSize="9" fill="#b45309" fontWeight="bold" fontFamily="monospace">ISOLATED PRIVATE DB SUBNETS</text>

                    {/* AZ-a */}
                    <rect x="35" y="225" width="180" height="220" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5"/>
                    <text x="125" y="240" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#b45309" fontFamily="monospace">Subnet AZ-a</text>
                    
                    <rect x="45" y="250" width="160" height="50" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" className="active-glow-node" style={{ '--pulse-color': 'rgba(16, 185, 129, 0.4)' } as React.CSSProperties} />
                    <text x="125" y="272" textAnchor="middle" fontSize="10.5" fill="#065f46" fontWeight="bold" fontFamily="sans-serif">✍️ Primary Writer</text>
                    <text x="125" y="288" textAnchor="middle" fontSize="8" fill="#047857" fontFamily="monospace">sg-db | Active Primary</text>

                    <rect x="45" y="315" width="160" height="50" rx="4" fill="url(#g-replica)" stroke="#8b5cf6" strokeWidth="1" className="active-glow-node" style={{ '--pulse-color': 'rgba(139, 92, 246, 0.3)' } as React.CSSProperties} />
                    <text x="125" y="337" textAnchor="middle" fontSize="10.5" fill="#4c1d95" fontWeight="bold" fontFamily="sans-serif">📖 Read Replica 1</text>
                    <text x="125" y="352" textAnchor="middle" fontSize="8" fill="#6d28d9" fontFamily="monospace">Asynchronous Copy</text>

                    {/* AZ-b */}
                    <rect x="240" y="225" width="180" height="220" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5"/>
                    <text x="330" y="240" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#b45309" fontFamily="monospace">Subnet AZ-b</text>
                    
                    <rect x="250" y="250" width="160" height="50" rx="4" fill="#fffbeb" stroke="#fbbf24" strokeWidth="1" />
                    <text x="330" y="272" textAnchor="middle" fontSize="10.5" fill="#92400e" fontWeight="bold" fontFamily="sans-serif">🛡️ Standby Replica</text>
                    <text x="330" y="288" textAnchor="middle" fontSize="8" fill="#b45309" fontFamily="monospace">Synchronous HA Standby</text>

                    <rect x="250" y="315" width="160" height="50" rx="4" fill="url(#g-replica)" stroke="#8b5cf6" strokeWidth="1" className="active-glow-node" style={{ '--pulse-color': 'rgba(139, 92, 246, 0.3)' } as React.CSSProperties} />
                    <text x="330" y="337" textAnchor="middle" fontSize="10.5" fill="#4c1d95" fontWeight="bold" fontFamily="sans-serif">📖 Read Replica 2</text>
                    <text x="330" y="352" textAnchor="middle" fontSize="8" fill="#6d28d9" fontFamily="monospace">Asynchronous Copy</text>

                    {/* AZ-c */}
                    <rect x="445" y="225" width="180" height="220" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5"/>
                    <text x="535" y="240" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#b45309" fontFamily="monospace">Subnet AZ-c</text>
                    
                    <rect x="455" y="250" width="160" height="50" rx="4" fill="url(#g-replica)" stroke="#8b5cf6" strokeWidth="1" className="active-glow-node" style={{ '--pulse-color': 'rgba(139, 92, 246, 0.3)' } as React.CSSProperties} />
                    <text x="535" y="272" textAnchor="middle" fontSize="10.5" fill="#4c1d95" fontWeight="bold" fontFamily="sans-serif">📖 Read Replica 3</text>
                    <text x="535" y="288" textAnchor="middle" fontSize="8" fill="#6d28d9" fontFamily="monospace">Asynchronous Copy</text>

                    {/* Replication paths connectors */}
                    {/* Primary -> Standby Sync */}
                    <line x1="205" y1="275" x2="250" y2="275" stroke="#10b981" strokeWidth="2" strokeDasharray="3,1" className="flow-active-line" markerEnd="url(#arr-g)" />
                    <text x="227" y="268" textAnchor="middle" fontSize="7" fill="#059669" fontWeight="bold" fontFamily="monospace">Sync 🔄</text>

                    {/* Primary -> RR1 Async */}
                    <line x1="125" y1="300" x2="125" y2="315" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,2" className="flow-active-line" markerEnd="url(#arr-p)" />
                    
                    {/* Primary -> RR2 Async */}
                    <path d="M 205 290 Q 235 305 250 325" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,2" className="flow-active-line" markerEnd="url(#arr-p)" />
                    
                    {/* Primary -> RR3 Async */}
                    <path d="M 205 295 Q 330 330 455 290" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,2" className="flow-active-line" markerEnd="url(#arr-p)" />
                  </svg>
                </div>
              )}

              {/* Sub-tab bestTab: sg */}
              {bestTab === 'sg' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2563eb' }}>🔒 Least-Privilege VPC Security Group Rules Chain</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
                    Production best practices dictate mapping security group reference IDs rather than static CIDR subnets.
                  </div>

                  <div className="rds-row" style={{ background: '#eff6ff', borderColor: '#3b82f6', color: '#1d4ed8' }}>
                    <div style={{ fontWeight: 600, minWidth: '90px' }}>🌐 sg-alb</div>
                    <div style={{ fontSize: '11px', color: '#334155' }}>
                      <b>Inbound:</b> HTTPS/443 and HTTP/80 from `0.0.0.0/0` (public access bounds)<br/>
                      <b>Outbound:</b> Target Application ports (e.g. 8080) pointing strictly to target app destination `sg-app`.
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#475569', margin: '2px 0' }}>↓</div>
                  
                  <div className="rds-row" style={{ background: '#ecfdf5', borderColor: '#10b981', color: '#047857' }}>
                    <div style={{ fontWeight: 600, minWidth: '90px' }}>⚙️ sg-app</div>
                    <div style={{ fontSize: '11px', color: '#334155' }}>
                      <b>Inbound:</b> Inbound compute ports restricted to traffic initiating from `sg-alb` reference.<br/>
                      <b>Outbound:</b> Database Port (5432 / 3306) pointing strictly to target backend destination `sg-proxy` or `sg-db`.
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#475569', margin: '2px 0' }}>↓</div>

                  <div className="rds-row" style={{ background: '#f5f3ff', borderColor: '#7c3aed', color: '#6d28d9' }}>
                    <div style={{ fontWeight: 600, minWidth: '90px' }}>🔄 sg-proxy</div>
                    <div style={{ fontSize: '11px', color: '#334155' }}>
                      <b>Inbound:</b> Database Port (5432 / 3306) restricted strictly to transactions coming from application `sg-app`.<br/>
                      <b>Outbound:</b> Database Port pointing to target database engines `sg-db`.
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', fontSize: '12px', color: '#475569', margin: '2px 0' }}>↓</div>

                  <div className="rds-row" style={{ background: '#fffbeb', borderColor: '#d97706', color: '#b45309' }}>
                    <div style={{ fontWeight: 600, minWidth: '90px' }}>🗄️ sg-db</div>
                    <div style={{ fontSize: '11px', color: '#334155' }}>
                      <b>Inbound:</b> Port 5432 / 3306 restricted strictly to traffic initiating from `sg-proxy` (or `sg-app` if no proxy). Allow port 22 tunnel from `sg-bastion` if manual administrative queries are needed.
                    </div>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '14px', marginBottom: '6px', color: '#d97706' }}>Database Engine Standard Port Directory</div>
                  <div className="rds-grid3">
                    <div style={{ border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: '#047857' }}>🐘 PostgreSQL</div>
                      <div style={{ fontSize: '11px', marginTop: '4px', color: '#334155' }}>Standard Port: <b>5432</b></div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Aurora PG: <b>5432</b></div>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: '#1d4ed8' }}>🐬 MySQL / MariaDB</div>
                      <div style={{ fontSize: '11px', marginTop: '4px', color: '#334155' }}>Standard Port: <b>3306</b></div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Aurora MySQL: <b>3306</b></div>
                    </div>
                    <div style={{ border: '1px solid #e2e8f0', background: '#f8fafc', borderRadius: '8px', padding: '10px' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: '#ea580c' }}>🪟 SQL Server / Oracle</div>
                      <div style={{ fontSize: '11px', marginTop: '4px', color: '#334155' }}>SQL Server Port: <b>1433</b></div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Oracle Port: <b>1521</b></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab bestTab: proxy */}
              {bestTab === 'proxy' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2563eb' }}>RDS Proxy Architecture Advantages</div>
                  
                  <div className="rds-row" style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#334155' }}>
                    <div className="rds-dot" style={{ background: '#3b82f6' }}>1</div>
                    <div style={{ fontSize: '11.5px', color: '#334155' }}><b>Survive DNS TTL Caching:</b> Applications cache standard SQL DNS lookups. On raw database failover, apps continue attempting to write to the old IP address during standard DNS TTL windows. RDS Proxy endpoint is static and processes target IP Shifts internally in ~10 seconds.</div>
                  </div>
                  
                  <div className="rds-row" style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#334155' }}>
                    <div className="rds-dot" style={{ background: '#3b82f6' }}>2</div>
                    <div style={{ fontSize: '11.5px', color: '#334155' }}><b>Mitigate Thread Context Switches:</b> High transaction concurrency spikes launch thousands of system database processes. The database spends more CPU scheduling threads than executing SQL logic. RDS Proxy intercepts this, queuing transactions down to small, highly optimized connection pools.</div>
                  </div>
                  
                  <div className="rds-row" style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#334155' }}>
                    <div className="rds-dot" style={{ background: '#3b82f6' }}>3</div>
                    <div style={{ fontSize: '11.5px', color: '#334155' }}><b>IAM Auth &amp; Secrets Management:</b> Proxy utilizes AWS IAM to authorize app identities. Password storage and physical credentials rotation schedules are managed automatically inside Secrets Manager.</div>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '13px', marginTop: '14px', marginBottom: '6px', color: '#d97706' }}>Engine Integration Support Directory</div>
                  <div className="rds-grid2" style={{ gap: '10px' }}>
                    <div style={{ border: '1px solid #10b981', borderRadius: '8px', padding: '10px', background: '#ecfdf5' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: '#047857', marginBottom: '4px' }}>✅ Fully Supported Engines</div>
                      <div style={{ fontSize: '11px', color: '#064e3b', lineHeight: '1.4' }}>
                        PostgreSQL (10.x and above)<br/>
                        MySQL (5.6, 5.7, 8.0)<br/>
                        MariaDB (10.x and above)<br/>
                        Amazon Aurora clusters (PostgreSQL and MySQL compatible)
                      </div>
                    </div>
                    <div style={{ border: '1px solid #ef4444', borderRadius: '8px', padding: '10px', background: '#fef2f2' }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', color: '#b91c1c', marginBottom: '4px' }}>❌ Unsupported Database Engines</div>
                      <div style={{ fontSize: '11px', color: '#991b1b', lineHeight: '1.4' }}>
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
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2563eb' }}>RDS Multi-AZ vs Amazon Aurora Multi-AZ Shared Storage</div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '12px' }}>
                    Understanding the core differences between standard block-level volume mirroring in standard RDS vs cluster quorum writes in Aurora.
                  </div>

                  <div className="rds-grid2" style={{ gap: '12px' }}>
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#b45309', marginBottom: '6px' }}>Standard RDS Multi-AZ</div>
                      <ul className="rds-ck" style={{ fontSize: '11.5px', color: '#334155' }}>
                        <li><b>Synchronous volume write mirroring:</b> Transactions commit to both the active primary instance and the secondary disk arrays in AZ-b.</li>
                        <li><b>Standby is idle:</b> The standby instance operates passive compute. You cannot route read queries here.</li>
                        <li><b>Failover speed (30–60s):</b> Standard failover requires shifting the CNAME entry in DNS records and completing transactional crash recovery.</li>
                      </ul>
                    </div>
                    <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', background: '#f8fafc' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#6d28d9', marginBottom: '6px' }}>Amazon Aurora Shared Storage HA</div>
                      <ul className="rds-ck" style={{ fontSize: '11.5px', color: '#334155' }}>
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
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#2563eb' }}>Read Replica Ingress Strategies</div>
                  
                  <div className="rds-row" style={{ background: '#ecfdf5', borderColor: '#10b981' }}>
                    <div style={{ fontWeight: 600, minWidth: '50px', color: '#047857' }}>WRITE</div>
                    <div style={{ color: '#064e3b', fontSize: '11.5px' }}>Always connect to the **Primary Writer Endpoint**. Sending transactional write logs to replicas will fail immediately or raise access exceptions.</div>
                  </div>
                  
                  <div className="rds-row" style={{ background: '#f5f3ff', borderColor: '#7c3aed' }}>
                    <div style={{ fontWeight: 600, minWidth: '50px', color: '#6d28d9' }}>READ</div>
                    <div style={{ color: '#4c1d95', fontSize: '11.5px' }}>Route heavy queries to individual **Replica endpoints**. Maintain a load balancer configuration or use application layers to balance query counts across replicas.</div>
                  </div>
                  
                  <div className="rds-row" style={{ background: '#fef2f2', borderColor: '#ef4444' }}>
                    <div style={{ fontWeight: 600, minWidth: '50px', color: '#b91c1c' }}>STALE</div>
                    <div style={{ color: '#991b1b', fontSize: '11.5px' }}><b>Read-Your-Writes Mitigation:</b> When users insert a row and refresh, route their subsequent read queries strictly to the Primary Writer for a brief window (~1–2 seconds) to allow asynchronous replica log synchronization.</div>
                  </div>
                </div>
              )}

              {/* Sub-tab bestTab: engines */}
              {bestTab === 'engines' && (
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: '#b45309' }}>Feature Support Directory Across Relational Engines</div>
                  <table className="rds-table" style={{ border: '1px solid #e2e8f0', background: '#ffffff' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ color: '#475569', border: '1px solid #e2e8f0' }}>Capability</th>
                        <th style={{ color: '#475569', border: '1px solid #e2e8f0' }}>Aurora PostgreSQL</th>
                        <th style={{ color: '#475569', border: '1px solid #e2e8f0' }}>Aurora MySQL</th>
                        <th style={{ color: '#475569', border: '1px solid #e2e8f0' }}>RDS PostgreSQL</th>
                        <th style={{ color: '#475569', border: '1px solid #e2e8f0' }}>RDS MySQL</th>
                        <th style={{ color: '#475569', border: '1px solid #e2e8f0' }}>SQL Server</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ background: '#ffffff' }}>
                        <td style={{ border: '1px solid #e2e8f0', color: '#0f172a' }}><b>RDS Proxy</b></td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#15803d' }}>✅ Yes</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#15803d' }}>✅ Yes</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#15803d' }}>✅ Yes</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#15803d' }}>✅ Yes</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#b91c1c' }}>❌ No</td>
                      </tr>
                      <tr style={{ background: '#f8fafc' }}>
                        <td style={{ border: '1px solid #e2e8f0', color: '#0f172a' }}><b>Max Replicas</b></td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#15803d', fontWeight: 600 }}>15 Replicas</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#15803d', fontWeight: 600 }}>15 Replicas</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#475569' }}>5 Replicas</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#475569' }}>5 Replicas</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#b91c1c' }}>❌ None</td>
                      </tr>
                      <tr style={{ background: '#ffffff' }}>
                        <td style={{ border: '1px solid #e2e8f0', color: '#0f172a' }}><b>Failover Recovery</b></td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#15803d', fontWeight: 600 }}>&lt; 30 seconds</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#15803d', fontWeight: 600 }}>&lt; 30 seconds</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#475569' }}>30–60 seconds</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#475569' }}>30–60 seconds</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#475569' }}>30–60 seconds</td>
                      </tr>
                      <tr style={{ background: '#f8fafc' }}>
                        <td style={{ border: '1px solid #e2e8f0', color: '#0f172a' }}><b>Storage Auto-scale</b></td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#15803d', fontWeight: 600 }}>Auto (128 TiB)</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#15803d', fontWeight: 600 }}>Auto (128 TiB)</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#475569' }}>Manual / Scheduled</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#475569' }}>Manual / Scheduled</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#475569' }}>Manual / Scheduled</td>
                      </tr>
                      <tr style={{ background: '#ffffff' }}>
                        <td style={{ border: '1px solid #e2e8f0', color: '#0f172a' }}><b>Global DR Databases</b></td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#15803d' }}>✅ Yes</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#15803d' }}>✅ Yes</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#475569' }}>Cross-Region Replica</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#475569' }}>Cross-Region Replica</td>
                        <td style={{ border: '1px solid #e2e8f0', color: '#b91c1c' }}>❌ No</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sub-tab bestTab: checklist */}
              {bestTab === 'checklist' && (
                <div>
                  <div className="rds-grid2" style={{ gap: '14px' }}>
                    <div style={{ background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#047857', marginBottom: '8px' }}>Must-Have Controls (In Production)</div>
                      <ul className="rds-ck">
                        <li style={{ color: '#064e3b', fontSize: '11.5px' }}>RDS instances configured in Isolated Private Subnets with no default internet route</li>
                        <li style={{ color: '#064e3b', fontSize: '11.5px' }}>Multi-AZ deployments enabled to support fast automatic high-availability failovers</li>
                        <li style={{ color: '#064e3b', fontSize: '11.5px' }}>Automated backups scheduled with minimum retention of 7 days</li>
                        <li style={{ color: '#064e3b', fontSize: '11.5px' }}>RDS Proxy deployed in serverless compute setups (such as AWS Lambda)</li>
                        <li style={{ color: '#064e3b', fontSize: '11.5px' }}>Security group rules configured with explicit SG-ID mappings instead of CIDRs</li>
                        <li style={{ color: '#064e3b', fontSize: '11.5px' }}>KMS Customer Managed Keys (CMK) configured for robust storage volume encryption</li>
                        <li style={{ color: '#064e3b', fontSize: '11.5px' }}>Inbound SSL/TLS queries enforced (`force_ssl=1` in DB parameter group)</li>
                      </ul>
                    </div>
                    <div style={{ background: '#fef2f2', border: '1px solid #ef4444', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#b91c1c', marginBottom: '8px' }}>Common Anti-patterns &amp; Mistakes</div>
                      <ul className="rds-wn">
                        <li style={{ color: '#991b1b', fontSize: '11.5px' }}>Attempting to execute write operations (INSERT/UPDATE) pointing to replica endpoints</li>
                        <li style={{ color: '#991b1b', fontSize: '11.5px' }}>Placing the database in public VPC subnets with `PubliclyAccessible = true`</li>
                        <li style={{ color: '#991b1b', fontSize: '11.5px' }}>Hardcoding database credentials inside application container environment configurations</li>
                        <li style={{ color: '#991b1b', fontSize: '11.5px' }}>Bypassing connection limits without utilizing poolers like RDS Proxy or PgBouncer</li>
                        <li style={{ color: '#991b1b', fontSize: '11.5px' }}>Omitting alerts on critical CloudWatch limits (`FreeableMemory` and `DiskQueueDepth`)</li>
                        <li style={{ color: '#991b1b', fontSize: '11.5px' }}>Assuming the Multi-AZ Standby instance can be read from (it operates passive block mirrors only)</li>
                      </ul>
                    </div>
                  </div>
                  <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '12px', marginTop: '14px', fontSize: '11.5px', color: '#475569' }}>
                    💡 <b>Pro Tip:</b> Use the AWS CLI to test active failover resilience by running: <code style={{ color: '#0284c7' }}>aws rds failover-db-cluster --db-cluster-identifier your-cluster-id</code> in your development/staging environments before committing code to production.
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
