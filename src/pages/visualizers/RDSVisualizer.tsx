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
    setLogHtml('Click "Simulate WRITE/READ" to see which endpoint is used, then toggle AZ failover.');
  };

  return (
    <div className="rds-container">
      <style>{`
        /* Premium Encapsulated Developer Workspace Theme */
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .rds-container {
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
          color: #1e293b;
          background: radial-gradient(circle at 10% 20%, rgba(240, 253, 244, 0.15) 0%, rgba(255, 255, 255, 1) 90%);
        }
        
        .rds-h {
          font-size: 24px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
          background: linear-gradient(135deg, #064e3b 0%, #047857 50%, #1d4ed8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
        }

        .rds-sub {
          font-size: 13.5px;
          color: #475569;
          line-height: 1.6;
          margin-bottom: 20px;
          max-width: 90%;
        }

        .rds-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 10px;
        }

        .rds-tb {
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          background: #ffffff;
          color: #475569;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .rds-tb:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
          transform: translateY(-1px);
        }

        .rds-tb.rds-on {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          border-color: #059669;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
        }

        .rds-card {
          border: 1px solid rgba(16, 185, 129, 0.12);
          border-radius: 20px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          margin-bottom: 20px;
          box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.03), 0 1px 3px rgba(16, 185, 129, 0.02);
          transition: all 0.25s ease;
        }
        
        .rds-card:hover {
          box-shadow: 0 12px 35px -5px rgba(0, 0, 0, 0.05), 0 2px 6px rgba(16, 185, 129, 0.03);
          border-color: rgba(16, 185, 129, 0.2);
        }

        .rds-sec {
          font-size: 11.5px;
          font-weight: 700;
          color: #047857;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin: 20px 0 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .rds-sec:first-child {
          margin-top: 0;
        }

        .rds-grid2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .rds-grid3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .rds-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 10px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
          margin-bottom: 8px;
          font-size: 12.5px;
          line-height: 1.5;
          transition: all 0.15s ease;
        }

        .rds-row:hover {
          background: #ffffff;
          border-color: #cbd5e1;
          transform: translateX(2px);
        }

        .rds-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 11px;
          color: #fff;
          font-weight: 700;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
        }

        .rds-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rds-binfo { background: #eff6ff; color: #1e40af; border: 1px solid #dbeafe; }
        .rds-bok { background: #f0fdf4; color: #166534; border: 1px solid #dcfce7; }
        .rds-bwarn { background: #fffbeb; color: #9a3412; border: 1px solid #fef3c7; }
        .rds-bbad { background: #fef2f2; color: #991b1b; border: 1px solid #fee2e2; }
        .rds-bpurple { background: #faf5ff; color: #6b21a8; border: 1px solid #f3e8ff; }

        .rds-kpi {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }

        .rds-k {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 12px;
          text-align: center;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.01);
        }
        
        .rds-k:hover {
          border-color: #cbd5e1;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }

        .rds-k .t {
          font-size: 10.5px;
          color: #64748b;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          font-weight: 600;
        }

        .rds-k .v {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
        }

        .rds-controls {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .rds-ctrl {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 14px;
        }

        .rds-ctrl label {
          display: block;
          font-size: 12.5px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 8px;
        }

        .rds-ctrl select {
          width: 100%;
          padding: 8px 12px;
          font-size: 12px;
          font-family: inherit;
          font-weight: 500;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          background: #ffffff;
          outline: none;
          color: #1e293b;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
          transition: all 0.15s ease;
        }

        .rds-ctrl select:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
        }

        .rds-ctrl input[type="range"] {
          width: 100%;
          height: 6px;
          border-radius: 999px;
          background: #e2e8f0;
          outline: none;
          cursor: pointer;
          accent-color: #10b981;
        }

        .rds-ctrl .out {
          font-size: 11px;
          color: #475569;
          margin-top: 8px;
          font-family: 'JetBrains Mono', monospace;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 6px;
          display: inline-block;
        }

        .rds-mono {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
        }

        .rds-btnbar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 14px;
        }

        .rds-btn {
          font-size: 12px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.02);
        }

        .rds-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
          transform: translateY(-1px);
        }

        .rds-btn.rds-primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-color: #059669;
          color: #ffffff;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .rds-btn.rds-primary:hover {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          box-shadow: 0 4px 14px rgba(5, 150, 105, 0.25);
        }

        .rds-log {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 16px;
          font-size: 11.5px;
          color: #e2e8f0;
          font-family: 'JetBrains Mono', monospace;
          line-height: 1.7;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.2);
        }

        ul.rds-ck, ul.rds-wn {
          padding-left: 0;
          margin-bottom: 0;
        }

        ul.rds-ck li, ul.rds-wn li {
          font-size: 12.5px;
          margin-bottom: 8px;
          list-style: none;
          padding-left: 22px;
          position: relative;
          line-height: 1.5;
          color: #334155;
        }

        ul.rds-ck li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: 800;
          font-size: 14px;
        }

        ul.rds-wn li::before {
          content: "⚠️";
          position: absolute;
          left: 0;
          font-size: 11px;
          top: 1px;
        }

        .rds-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          line-height: 1.5;
        }

        .rds-table th {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 10px 12px;
          text-align: left;
          font-weight: 700;
          color: #475569;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .rds-table td {
          border: 1px solid #e2e8f0;
          padding: 10px 12px;
          color: #334155;
        }

        .rds-table tr:nth-child(even) {
          background: rgba(248, 250, 252, 0.5);
        }

        .rds-code-container {
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          background: #f8fafc;
          padding: 16px;
          margin-top: 12px;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.01);
        }

        .rds-code {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11.5px;
          white-space: pre-wrap;
          line-height: 1.6;
          color: #334155;
        }
        
        /* Subtabs styling */
        .rds-subtabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          border-bottom: 1px dashed #e2e8f0;
          padding-bottom: 10px;
        }

        .rds-subtb {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          font-size: 11.5px;
          font-weight: 500;
          cursor: pointer;
          background: #ffffff;
          color: #475569;
          transition: all 0.15s ease;
          outline: none;
        }

        .rds-subtb:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .rds-subtb.rds-on {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(37, 99, 235, 0.15);
        }

        .rds-subtb.rds-on-purple {
          background: #7c3aed;
          color: #ffffff;
          border-color: #7c3aed;
          font-weight: 600;
          box-shadow: 0 2px 6px rgba(124, 58, 237, 0.15);
        }

        @keyframes activeNodePulse {
          0%, 100% { filter: drop-shadow(0 0 3px var(--pulse-color)); opacity: 0.95; }
          50% { filter: drop-shadow(0 0 12px var(--pulse-color)); opacity: 1; }
        }
        
        .active-glow-node {
          animation: activeNodePulse 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }

        @keyframes flowAnim {
          to { stroke-dashoffset: -20; }
        }

        .flow-active-line {
          stroke-dasharray: 6, 4;
          animation: flowAnim 0.8s linear infinite;
        }

        .arch-scenario-btn {
          font-size: 12px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .arch-scenario-btn:hover {
          background: #f8fafc;
          color: #0f172a;
          transform: translateY(-1px);
        }

        .arch-scenario-btn.active {
          background: #f0fdf4;
          color: #047857;
          border-color: #059669;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.12);
        }

        .asg-btn {
          font-size: 12px;
          font-weight: 600;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
          outline: none;
        }

        .asg-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .asg-btn.asg-on {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: #ffffff;
          border-color: #059669;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
        }

        .asg-log {
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 12px 14px;
          background: #0f172a;
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          white-space: pre-wrap;
          line-height: 1.6;
          color: #e2e8f0;
          box-shadow: inset 0 2px 6px rgba(0,0,0,0.15);
        }

        .asg-card {
          border: 1px solid #cbd5e1;
          border-radius: 16px;
          padding: 16px;
          background: #ffffff;
          margin-bottom: 12px;
        }

        .rds-gcard {
          border-radius: 16px;
          padding: 16px;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 1px solid #86efac;
          box-shadow: 0 4px 20px rgba(22, 163, 74, 0.05);
        }

        .rds-gcard-title {
          font-weight: 700;
          font-size: 13.5px;
          color: #166534;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* 3D database cylinder styles */
        .cylinder-lid {
          stroke-width: 1px;
        }
        .cylinder-body {
          stroke-width: 1px;
        }

        /* Centralized Dark Mode Overrides for RDSVisualizer.tsx */
        .dark .rds-container {
          background: #020617 !important;
          color: #f8fafc !important;
        }
        .dark .rds-card,
        .dark [class*="rds-card"] {
          background: rgba(15, 23, 42, 0.75) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }
        .dark .rds-card b,
        .dark .rds-card strong,
        .dark .rds-card h3,
        .dark .rds-card h4 {
          color: #ffffff !important;
        }
        .dark .rds-tabs {
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .rds-tb {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #94a3b8 !important;
        }
        .dark .rds-tb:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #f8fafc !important;
        }
        .dark .rds-sec,
        .dark .rds-kk {
          color: #94a3b8 !important;
        }
        .dark .rds-log,
        .dark .rds-terminal {
          background: #020617 !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #38bdf8 !important;
        }
        .dark .rds-btn {
          background: rgba(15, 23, 42, 0.8) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .rds-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
        }
        .dark .rds-met {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark ul.rds-ck li {
          color: #cbd5e1 !important;
        }
        .dark .rds-inst,
        .dark .rds-instance {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .rds-inst .meta,
        .dark .rds-instance .meta {
          color: #94a3b8 !important;
        }
        .dark .rds-svg-bg {
          background-color: #020617 !important;
          background-image: radial-gradient(rgba(51, 65, 85, 0.5) 1.2px, transparent 1.2px) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        
        /* Node Status Overrides */
        .dark .rds-ok {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: #4ade80 !important;
        }
        .dark .rds-warm {
          border-color: #f59e0b !important;
          background: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
        }
        .dark .rds-drain {
          border-color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }
        .dark .rds-down {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.15) !important;
          color: #f87171 !important;
        }
        
        /* General form overrides */
        .dark select,
        .dark input,
        .dark textarea {
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
          border-color: rgba(51, 65, 85, 0.8) !important;
        }
        .dark select option {
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
        }
          `}</style>

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

                <svg width="100%" viewBox="0 0 680 160" style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  <defs>
                    {/* Metallic side-reflections */}
                    <linearGradient id="m-ok" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a7f3d0" />
                      <stop offset="35%" stopColor="#6ee7b7" />
                      <stop offset="70%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="m-warn" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fde047" />
                      <stop offset="35%" stopColor="#facc15" />
                      <stop offset="70%" stopColor="#eab308" />
                      <stop offset="100%" stopColor="#ca8a04" />
                    </linearGradient>
                    <linearGradient id="m-rep" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ddd6fe" />
                      <stop offset="35%" stopColor="#c084fc" />
                      <stop offset="70%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>

                    {/* Lids */}
                    <linearGradient id="l-ok" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d1fae5" />
                      <stop offset="100%" stopColor="#6ee7b7" />
                    </linearGradient>
                    <linearGradient id="l-warn" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fef9c3" />
                      <stop offset="100%" stopColor="#facc15" />
                    </linearGradient>
                    <linearGradient id="l-rep" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f3e8ff" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>

                    <marker id="arr-sync" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                    <marker id="arr-async" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6" /></marker>
                    <marker id="arr-aurora" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#0284c7" /></marker>
                  </defs>

                  {/* AZ boundaries */}
                  {/* us-east-1a */}
                  <rect x="15" y="15" width="200" height="130" rx="10" fill="rgba(255,255,255,0.7)" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="115" y="28" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748b" fontFamily="monospace">us-east-1a Subnet</text>
                  
                  {/* us-east-1b */}
                  <rect x="240" y="15" width="200" height="130" rx="10" fill="rgba(255,255,255,0.7)" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="340" y="28" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748b" fontFamily="monospace">us-east-1b Subnet</text>

                  {/* us-east-1c */}
                  <rect x="465" y="15" width="200" height="130" rx="10" fill="rgba(255,255,255,0.7)" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="565" y="28" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#64748b" fontFamily="monospace">us-east-1c Subnet</text>

                  {/* Dynamic Nodes Renders */}
                  {selectedEngine === 'aurora' ? (
                    <>
                      {/* Aurora: Cloud-Native Shared Storage 6-way replicated */}
                      {/* Primary Writer in AZ-a */}
                      <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                        {/* Cylinder */}
                        <path d="M 70 48 L 70 76 A 45 7 0 0 0 160 76 L 160 48 A 45 7 0 0 1 70 48 Z" fill="url(#m-ok)" stroke="#10b981" strokeWidth="1" />
                        <ellipse cx="115" cy="48" rx="45" ry="7" fill="url(#l-ok)" stroke="#10b981" strokeWidth="1" />
                        <text x="115" y="66" textAnchor="middle" fontSize="9.5" fill="#064e3b" fontWeight="bold">🐘 Primary Writer</text>
                        <text x="115" y="86" textAnchor="middle" fontSize="7" fill="#047857" fontFamily="monospace">Active (AZ-a)</text>
                      </g>

                      {/* Aurora Reader in AZ-b */}
                      <g className="active-glow-node" style={{ '--pulse-color': '#8b5cf6' } as React.CSSProperties}>
                        {/* Cylinder */}
                        <path d="M 295 48 L 295 76 A 45 7 0 0 0 385 76 L 385 48 A 45 7 0 0 1 295 48 Z" fill="url(#m-rep)" stroke="#8b5cf6" strokeWidth="1" />
                        <ellipse cx="340" cy="48" rx="45" ry="7" fill="url(#l-rep)" stroke="#8b5cf6" strokeWidth="1" />
                        <text x="340" y="66" textAnchor="middle" fontSize="9.5" fill="#4c1d95" fontWeight="bold">📖 Aurora Reader</text>
                        <text x="340" y="86" textAnchor="middle" fontSize="7" fill="#6d28d9" fontFamily="monospace">Lag &lt; 20ms (AZ-b)</text>
                      </g>

                      {/* Shared Storage Pooling representing Aurora Storage Pool across all AZs */}
                      <rect x="30" y="96" width="620" height="42" rx="8" fill="#ecfbfb" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,2" />
                      <text x="340" y="107" textAnchor="middle" fontSize="9" fill="#0284c7" fontWeight="bold">🌌 Cloud-Native Shared Storage Pool (Replicated 6-Ways)</text>
                      
                      {/* Storage Nodes in each AZ */}
                      <rect x="50" y="114" width="60" height="18" rx="3" fill="#ffffff" stroke="#0284c7" strokeWidth="0.5"/>
                      <text x="80" y="124" textAnchor="middle" fontSize="7.5" fill="#0284c7" fontFamily="monospace">Disk A1 / A2</text>

                      <rect x="275" y="114" width="60" height="18" rx="3" fill="#ffffff" stroke="#0284c7" strokeWidth="0.5"/>
                      <text x="305" y="124" textAnchor="middle" fontSize="7.5" fill="#0284c7" fontFamily="monospace">Disk B1 / B2</text>

                      <rect x="500" y="114" width="60" height="18" rx="3" fill="#ffffff" stroke="#0284c7" strokeWidth="0.5"/>
                      <text x="530" y="124" textAnchor="middle" fontSize="7.5" fill="#0284c7" fontFamily="monospace">Disk C1 / C2</text>

                      {/* Continuous replication trace paths */}
                      <path d="M 115 84 L 115 96" stroke="#0284c7" strokeWidth="1.5" className="flow-active-line" markerEnd="url(#arr-aurora)"/>
                      <path d="M 340 84 L 340 96" stroke="#0284c7" strokeWidth="1" strokeDasharray="2,2"/>
                    </>
                  ) : (selectedEngine === 'oracle' || selectedEngine === 'mssql') ? (
                    <>
                      {/* Proprietary Engines: Multi-AZ standby copy, no replicas supported */}
                      {/* Primary Writer in AZ-a */}
                      <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                        {/* Cylinder */}
                        <path d="M 65 52 L 65 92 A 50 10 0 0 0 165 92 L 165 52 A 50 10 0 0 1 65 52 Z" fill="url(#m-ok)" stroke="#10b981" strokeWidth="1.5" />
                        <ellipse cx="115" cy="52" rx="50" ry="10" fill="url(#l-ok)" stroke="#10b981" strokeWidth="1.5" />
                        <text x="115" y="72" textAnchor="middle" fontSize="10" fill="#064e3b" fontWeight="bold">🐘 Primary Writer</text>
                        <text x="115" y="86" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="monospace">In-Service (Active)</text>
                      </g>

                      {/* Standby Copy in AZ-b */}
                      <g className="active-glow-node" style={{ '--pulse-color': '#f59e0b' } as React.CSSProperties}>
                        {/* Cylinder */}
                        <path d="M 290 52 L 290 92 A 50 10 0 0 0 390 92 L 390 52 A 50 10 0 0 1 290 52 Z" fill="url(#m-warn)" stroke="#d97706" strokeWidth="1" />
                        <ellipse cx="340" cy="52" rx="50" ry="10" fill="url(#l-warn)" stroke="#d97706" strokeWidth="1" />
                        <text x="340" y="72" textAnchor="middle" fontSize="10" fill="#78350f" fontWeight="bold">🛡️ Standby Replica</text>
                        <text x="340" y="86" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="monospace">Passive (No Reads)</text>
                      </g>

                      {/* Standby Replication line */}
                      <line x1="165" y1="72" x2="290" y2="72" stroke="#10b981" strokeWidth="2" className="flow-active-line" markerEnd="url(#arr-sync)" />
                      <text x="227.5" y="62" textAnchor="middle" fontSize="7.5" fill="#15803d" fontWeight="bold" fontFamily="monospace">Sync 🔄</text>

                      {/* Replicas Blocked / Not Supported in AZ-c */}
                      <g opacity="0.65">
                        <rect x="475" y="42" width="180" height="65" rx="6" fill="#fef2f2" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="565" y="65" textAnchor="middle" fontSize="10.5" fill="#ef4444" fontWeight="bold" style={{ textDecoration: 'line-through' }}>📖 Read Replica</text>
                        <text x="565" y="80" textAnchor="middle" fontSize="8.5" fill="#ef4444" fontWeight="bold">❌ NOT SUPPORTED</text>
                        <text x="565" y="93" textAnchor="middle" fontSize="7" fill="#b91c1c" fontFamily="monospace">Engine Restriction</text>
                        <path d="M 470 37 L 660 112 M 660 37 L 470 112" stroke="#ef4444" strokeWidth="1.5" opacity="0.4" />
                      </g>
                    </>
                  ) : (
                    <>
                      {/* Standard Engines: Postgres / MySQL / MariaDB standard multi-az and replicas */}
                      {/* Primary Writer in AZ-a */}
                      <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties}>
                        {/* Cylinder */}
                        <path d="M 65 52 L 65 92 A 50 10 0 0 0 165 92 L 165 52 A 50 10 0 0 1 65 52 Z" fill="url(#m-ok)" stroke="#10b981" strokeWidth="1.5" />
                        <ellipse cx="115" cy="52" rx="50" ry="10" fill="url(#l-ok)" stroke="#10b981" strokeWidth="1.5" />
                        <text x="115" y="72" textAnchor="middle" fontSize="10" fill="#064e3b" fontWeight="bold">🐘 Primary Writer</text>
                        <text x="115" y="86" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="monospace">In-Service (Active)</text>
                      </g>

                      {/* Standby Copy in AZ-b */}
                      <g className="active-glow-node" style={{ '--pulse-color': '#f59e0b' } as React.CSSProperties}>
                        {/* Cylinder */}
                        <path d="M 290 52 L 290 92 A 50 10 0 0 0 390 92 L 390 52 A 50 10 0 0 1 290 52 Z" fill="url(#m-warn)" stroke="#d97706" strokeWidth="1" />
                        <ellipse cx="340" cy="52" rx="50" ry="10" fill="url(#l-warn)" stroke="#d97706" strokeWidth="1" />
                        <text x="340" y="72" textAnchor="middle" fontSize="10" fill="#78350f" fontWeight="bold">🛡️ Standby Replica</text>
                        <text x="340" y="86" textAnchor="middle" fontSize="7" fill="#475569" fontFamily="monospace">Passive (Standby)</text>
                      </g>

                      {/* Read Replica in AZ-c */}
                      <g className="active-glow-node" style={{ '--pulse-color': '#8b5cf6' } as React.CSSProperties}>
                        {/* Cylinder */}
                        <path d="M 515 52 L 515 92 A 50 10 0 0 0 615 92 L 615 52 A 50 10 0 0 1 515 52 Z" fill="url(#m-rep)" stroke="#8b5cf6" strokeWidth="1" />
                        <ellipse cx="565" cy="52" rx="50" ry="10" fill="url(#l-rep)" stroke="#8b5cf6" strokeWidth="1" />
                        <text x="565" y="72" textAnchor="middle" fontSize="10.5" fill="#4c1d95" fontWeight="bold">📖 Read Replica</text>
                        <text x="565" y="86" textAnchor="middle" fontSize="7" fill="#6d28d9" fontFamily="monospace">Asynchronous WAL</text>
                      </g>

                      {/* Standby Replication line */}
                      <line x1="165" y1="72" x2="290" y2="72" stroke="#10b981" strokeWidth="2" className="flow-active-line" markerEnd="url(#arr-sync)" />
                      <text x="227.5" y="62" textAnchor="middle" fontSize="7.5" fill="#15803d" fontWeight="bold" fontFamily="monospace">Sync 🔄</text>

                      {/* Replica replication line */}
                      <path d="M 165 72 Q 340 135 515 72" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,2" className="flow-active-line" markerEnd="url(#arr-async)" />
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

                <svg width="100%" viewBox="0 0 680 240" style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  <defs>
                    <linearGradient id="c-app" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#eff6ff" />
                      <stop offset="100%" stopColor="#dbeafe" />
                    </linearGradient>
                    <linearGradient id="c-db-ok" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ddd6fe" />
                      <stop offset="35%" stopColor="#c084fc" />
                      <stop offset="70%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                    <linearGradient id="c-db-fail" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#fecaca" />
                      <stop offset="35%" stopColor="#f87171" />
                      <stop offset="70%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#b91c1c" />
                    </linearGradient>

                    <linearGradient id="l-db-ok" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f3e8ff" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                    <linearGradient id="l-db-fail" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fee2e2" />
                      <stop offset="100%" stopColor="#f87171" />
                    </linearGradient>

                    <marker id="acn-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" /></marker>
                    <marker id="acn-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                    <marker id="acn-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6" /></marker>
                    <marker id="acn-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444" /></marker>
                  </defs>

                  {/* Public Internet Border Left */}
                  <line x1="10" y1="5" x2="10" y2="235" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3"/>
                  <text x="18" y="16" fontSize="8" fill="#64748b" fontFamily="monospace">PUBLIC INTERNET BOUNDARY</text>

                  {/* VPC boundary */}
                  <rect x="55" y="15" width="615" height="210" rx="12" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
                  <text x="362.5" y="27" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#475569" fontFamily="monospace">VPC (10.0.0.0/16)</text>

                  {/* Public Subnets Area */}
                  <rect x="65" y="42" width="165" height="172" rx="8" fill="rgba(255,255,255,0.7)" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="147.5" y="54" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#64748b" fontFamily="monospace">Public Subnets (0.0.0.0/0)</text>
                  
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
                  <rect x="250" y="42" width="170" height="172" rx="8" fill="rgba(255,255,255,0.7)" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="335" y="54" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#64748b" fontFamily="monospace">Private App Subnets</text>
                  
                  {/* EC2 Instance Block */}
                  <g opacity={ingressSource === 'app' ? 1 : 0.65}>
                    <rect x="265" y="90" width="140" height="52" rx="6" fill={ingressSource === 'app' ? '#ecfdf5' : '#ffffff'} stroke={ingressSource === 'app' ? '#10b981' : '#cbd5e1'} strokeWidth={1} />
                    <text x="335" y="112" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#0f172a">⚙️ sg-app (App Server)</text>
                    <text x="335" y="127" textAnchor="middle" fontSize="7.5" fill="#16a34a" fontFamily="monospace">Allow: from sg-alb</text>
                  </g>

                  {/* Private DB Subnets Area */}
                  <rect x="440" y="42" width="220" height="172" rx="8" fill="rgba(255,255,255,0.7)" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="550" y="54" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#64748b" fontFamily="monospace">Private DB Subnets</text>
                  
                  {/* RDS 3D Cylinder Block */}
                  <g opacity={ingressSource !== 'internet' ? 1 : 0.4} className={ingressSource !== 'internet' ? 'active-glow-node' : ''} style={{ '--pulse-color': '#7c3aed' } as React.CSSProperties}>
                    <path d="M 475 110 L 475 140 A 55 12 0 0 0 585 140 L 585 110 A 55 12 0 0 1 475 110 Z" fill={ingressSource === 'internet' ? 'url(#c-db-fail)' : 'url(#c-db-ok)'} stroke={ingressSource === 'internet' ? '#ef4444' : '#8b5cf6'} strokeWidth="1.5" />
                    <ellipse cx="530" cy="110" rx="55" ry="12" fill={ingressSource === 'internet' ? 'url(#l-db-fail)' : 'url(#l-db-ok)'} stroke={ingressSource === 'internet' ? '#ef4444' : '#8b5cf6'} strokeWidth="1.5" />
                    
                    <text x="530" y="90" textAnchor="middle" fontSize="11.5" fontWeight="bold" fill="#0f172a">🗄️ sg-db (Amazon RDS)</text>
                    <text x="530" y="128" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill={ingressSource === 'internet' ? '#991b1b' : '#5b21b6'}>
                      {ingressSource === 'app' ? 'allowed from sg-app' : ingressSource === 'bastion' ? 'allowed from sg-bastion' : '❌ Public Ingress BLOCKED'}
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
                      <text x="240" y="93" fontSize="7.5" fill="#2563eb" fontWeight="bold">HTTP 8080</text>

                      {/* App to DB */}
                      <path d="M 405 120 L 470 120" fill="none" stroke="#10b981" strokeWidth="2.5" className="flow-active-line" markerEnd="url(#acn-green)" />
                      <text x="435" y="112" fontSize="7.5" fill="#16a34a" fontWeight="bold">SQL Port 5432</text>
                    </>
                  )}

                  {/* Bastion route: Bastion -> DB */}
                  {ingressSource === 'bastion' && (
                    <>
                      {/* Public to Bastion */}
                      <line x1="5" y1="154" x2="80" y2="154" stroke="#f59e0b" strokeWidth="2" className="flow-active-line" markerEnd="url(#acn-purple)"/>
                      <text x="42.5" y="145" fontSize="7.5" fill="#b45309" fontWeight="bold">SSH Tunneled</text>

                      {/* Bastion to DB */}
                      <path d="M 215 154 L 470 125" fill="none" stroke="#8b5cf6" strokeWidth="2" className="flow-active-line" markerEnd="url(#acn-purple)" />
                      <text x="330" y="148" fontSize="8" fill="#7c3aed" fontWeight="bold">SQL Forwarding</text>
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
                        <circle cx="0" cy="0" r="14" fill="#ef4444" />
                        <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fontSize="8" fill="#fff" fontWeight="bold">STOP</text>
                      </g>
                    </>
                  )}
                </svg>
              </div>

              {/* Right Column: Explanations HUD */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* Telemetry/Rules Details */}
                <div className="asg-card" style={{ borderLeft: '3px solid #2563eb', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', color: '#64748b', marginBottom: '4px' }}>
                    🔒 Ingress Policy Status
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                    {ingressSource === 'app' && '🟢 Compliant Access Path'}
                    {ingressSource === 'bastion' && '🟣 Secure Admin Tunnel'}
                    {ingressSource === 'internet' && '🔴 Boundary Threat Blocked'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                      <span style={{ color: '#475569' }}>Internet IGW Route:</span>
                      <span style={{ fontWeight: 'bold', color: '#ef4444' }}>BLOCKED</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                      <span style={{ color: '#475569' }}>Security Group Chain:</span>
                      <span style={{ fontWeight: 'bold', color: '#16a34a' }}>ENFORCED</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}>
                      <span style={{ color: '#475569' }}>Public IP Address:</span>
                      <span style={{ fontWeight: 'bold', color: '#ef4444' }}>NONE</span>
                    </div>
                  </div>
                </div>

                {/* Path explanation card */}
                <div className="asg-card" style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a', marginBottom: '6px' }}>
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

              <span style={{ fontSize: '12px', color: '#475569', marginLeft: '10px' }}>
                Active Phase: <b style={{ color: '#0f172a' }}>{failoverStep} of 5</b> — {
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
                  <svg width="100%" viewBox="0 0 680 180" style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                    <defs>
                      {/* Gradients */}
                      <linearGradient id="ha-ok" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a7f3d0" />
                        <stop offset="35%" stopColor="#6ee7b7" />
                        <stop offset="70%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                      <linearGradient id="ha-fail" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fecaca" />
                        <stop offset="35%" stopColor="#f87171" />
                        <stop offset="70%" stopColor="#ef4444" />
                        <stop offset="100%" stopColor="#b91c1c" />
                      </linearGradient>
                      <linearGradient id="ha-warn" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#fde047" />
                        <stop offset="35%" stopColor="#facc15" />
                        <stop offset="70%" stopColor="#eab308" />
                        <stop offset="100%" stopColor="#ca8a04" />
                      </linearGradient>

                      <linearGradient id="hl-ok" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#d1fae5" />
                        <stop offset="100%" stopColor="#6ee7b7" />
                      </linearGradient>
                      <linearGradient id="hl-fail" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fee2e2" />
                        <stop offset="100%" stopColor="#f87171" />
                      </linearGradient>
                      <linearGradient id="hl-warn" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fef9c3" />
                        <stop offset="100%" stopColor="#facc15" />
                      </linearGradient>

                      <marker id="arr-ha-g" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                      <marker id="arr-ha-r" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444" /></marker>
                      <marker id="arr-ha-b" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" /></marker>
                    </defs>

                    {/* us-east-1a Subnet Zone */}
                    <rect x="15" y="15" width="290" height="150" rx="10" fill="rgba(255,255,255,0.7)" stroke={failoverStep >= 1 && failoverStep <= 3 ? '#ef4444' : '#cbd5e1'} strokeWidth="1" strokeDasharray="3,3" />
                    <text x="160" y="28" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b" fontFamily="monospace">us-east-1a (Primary Zone)</text>

                    {/* Primary DB Node in AZ-a */}
                    {failoverStep === 0 ? (
                       <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties} transform="translate(45, 45)">
                         <path d="M 15 35 L 15 75 A 45 10 0 0 0 105 75 L 105 35 A 45 10 0 0 1 15 35 Z" fill="url(#ha-ok)" stroke="#10b981" strokeWidth="1.5" />
                         <ellipse cx="60" cy="35" rx="45" ry="10" fill="url(#hl-ok)" stroke="#10b981" strokeWidth="1.5" />
                         <text x="60" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#064e3b">✍️ Writer DB</text>
                         <text x="60" y="55" textAnchor="middle" fontSize="8" fill="#047857" fontFamily="monospace">10.0.1.18 (Healthy)</text>
                       </g>
                    ) : failoverStep === 1 ? (
                       <g className="active-glow-node" style={{ '--pulse-color': '#ef4444' } as React.CSSProperties} transform="translate(45, 45)">
                         <path d="M 15 35 L 15 75 A 45 10 0 0 0 105 75 L 105 35 A 45 10 0 0 1 15 35 Z" fill="url(#ha-fail)" stroke="#ef4444" strokeWidth="2" />
                         <ellipse cx="60" cy="35" rx="45" ry="10" fill="url(#hl-fail)" stroke="#ef4444" strokeWidth="2" />
                         <text x="60" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#9f1239">💥 Crashed DB</text>
                         <text x="60" y="55" textAnchor="middle" fontSize="8" fill="#ef4444" fontFamily="monospace">Hardware Fault</text>
                       </g>
                    ) : (
                       <g opacity="0.4" transform="translate(45, 45)">
                         <path d="M 15 35 L 15 75 A 45 10 0 0 0 105 75 L 105 35 A 45 10 0 0 1 15 35 Z" fill="url(#ha-fail)" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
                         <ellipse cx="60" cy="35" rx="45" ry="10" fill="url(#hl-fail)" stroke="#ef4444" strokeWidth="1.5" />
                         <text x="60" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#ef4444" style={{ textDecoration: 'line-through' }}>✍️ Writer DB</text>
                         <text x="60" y="55" textAnchor="middle" fontSize="8" fill="#ef4444" fontFamily="monospace">Evicted Cluster</text>
                        <path d="M 10 15 L 110 80 M 110 15 L 10 80" stroke="#ef4444" strokeWidth="1.5" opacity="0.4" />
                       </g>
                    )}

                    {/* us-east-1b Subnet Zone */}
                    <rect x="375" y="15" width="290" height="150" rx="10" fill="rgba(255,255,255,0.7)" stroke={failoverStep === 5 ? '#10b981' : '#cbd5e1'} strokeWidth="1" strokeDasharray="3,3" />
                    <text x="520" y="28" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#64748b" fontFamily="monospace">us-east-1b (Standby Zone)</text>

                    {/* Standby DB Node in AZ-b */}
                    {failoverStep <= 3 ? (
                       <g transform="translate(405, 45)">
                         <path d="M 15 35 L 15 75 A 45 10 0 0 0 105 75 L 105 35 A 45 10 0 0 1 15 35 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                         <ellipse cx="60" cy="35" rx="45" ry="10" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                         <text x="60" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#475569">🛡️ Standby DB</text>
                         <text x="60" y="55" textAnchor="middle" fontSize="8" fill="#64748b" fontFamily="monospace">10.0.2.99 (Passive)</text>
                       </g>
                    ) : failoverStep === 4 ? (
                       <g className="active-glow-node" style={{ '--pulse-color': '#f59e0b' } as React.CSSProperties} transform="translate(405, 45)">
                         <path d="M 15 35 L 15 75 A 45 10 0 0 0 105 75 L 105 35 A 45 10 0 0 1 15 35 Z" fill="url(#ha-warn)" stroke="#d97706" strokeWidth="1.5" />
                         <ellipse cx="60" cy="35" rx="45" ry="10" fill="url(#hl-warn)" stroke="#d97706" strokeWidth="1.5" />
                         <text x="60" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#78350f">⚡ Recovering DB</text>
                         <text x="60" y="55" textAnchor="middle" fontSize="8" fill="#b45309" fontFamily="monospace">Replaying Journals</text>
                       </g>
                    ) : (
                       <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties} transform="translate(405, 45)">
                         <path d="M 15 35 L 15 75 A 45 10 0 0 0 105 75 L 105 35 A 45 10 0 0 1 15 35 Z" fill="url(#ha-ok)" stroke="#10b981" strokeWidth="2" />
                         <ellipse cx="60" cy="35" rx="45" ry="10" fill="url(#hl-ok)" stroke="#10b981" strokeWidth="2" />
                         <text x="60" y="20" textAnchor="middle" fontSize="11.5" fontWeight="bold" fill="#064e3b">✍️ Promoted DB</text>
                         <text x="60" y="55" textAnchor="middle" fontSize="8" fill="#16a34a" fontFamily="monospace">10.0.2.99 (Writer)</text>
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

                <svg width="100%" viewBox="0 0 680 180" style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  <defs>
                    <linearGradient id="r-ok" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#a7f3d0" />
                      <stop offset="35%" stopColor="#6ee7b7" />
                      <stop offset="70%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="r-rep" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ddd6fe" />
                      <stop offset="35%" stopColor="#c084fc" />
                      <stop offset="70%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>

                    <linearGradient id="rl-ok" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d1fae5" />
                      <stop offset="100%" stopColor="#6ee7b7" />
                    </linearGradient>
                    <linearGradient id="rl-rep" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f3e8ff" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>

                    <marker id="arr-rep-g" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                    <marker id="arr-rep-y" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#f59e0b" /></marker>
                    <marker id="arr-rep-r" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444" /></marker>
                  </defs>

                  {/* Primary DB in AZ-a */}
                  <g className="active-glow-node" style={{ '--pulse-color': '#10b981' } as React.CSSProperties} transform="translate(45, 45)">
                    {/* Cylinder */}
                    <path d="M 15 35 L 15 75 A 45 10 0 0 0 105 75 L 105 35 A 45 10 0 0 1 15 35 Z" fill="url(#r-ok)" stroke="#10b981" strokeWidth="1.5" />
                    <ellipse cx="60" cy="35" rx="45" ry="10" fill="url(#rl-ok)" stroke="#10b981" strokeWidth="1.5" />
                    <text x="60" y="20" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#064e3b">✍️ Primary Writer</text>
                    <text x="60" y="55" textAnchor="middle" fontSize="8.5" fill="#475569" fontFamily="monospace">db.writer.cluster</text>
                  </g>

                  {/* Read Replica 1 in AZ-c */}
                  <g className="active-glow-node" style={{ '--pulse-color': '#7c3aed' } as React.CSSProperties} transform="translate(470, 20)">
                    <path d="M 12 24 L 12 52 A 36 8 0 0 0 84 52 L 84 24 A 36 8 0 0 1 12 24 Z" fill="url(#r-rep)" stroke="#7c3aed" strokeWidth="1" />
                    <ellipse cx="48" cy="24" rx="36" ry="8" fill="url(#rl-rep)" stroke="#7c3aed" strokeWidth="1" />
                    <text x="48" y="12" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#4c1d95">📖 Replica 1</text>
                    <text x="48" y="42" textAnchor="middle" fontSize="7.5" fill="#7c3aed" fontFamily="monospace">replica-1.domain</text>
                  </g>

                  {/* Read Replica 2 in AZ-b */}
                  <g className="active-glow-node" style={{ '--pulse-color': '#7c3aed' } as React.CSSProperties} transform="translate(470, 100)">
                    <path d="M 12 24 L 12 52 A 36 8 0 0 0 84 52 L 84 24 A 36 8 0 0 1 12 24 Z" fill="url(#r-rep)" stroke="#7c3aed" strokeWidth="1" />
                    <ellipse cx="48" cy="24" rx="36" ry="8" fill="url(#rl-rep)" stroke="#7c3aed" strokeWidth="1" />
                    <text x="48" y="12" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#4c1d95">📖 Replica 2</text>
                    <text x="48" y="42" textAnchor="middle" fontSize="7.5" fill="#7c3aed" fontFamily="monospace">replica-2.domain</text>
                  </g>

                  {/* Replication stream connector paths */}
                  {/* Primary -> Replica 1 */}
                  <path 
                    d="M 210 75 Q 330 35 470 45" 
                    fill="none" 
                    stroke={replicaWalLag >= 15 ? '#ef4444' : replicaWalLag >= 5 ? '#f59e0b' : '#10b981'} 
                    strokeWidth="1.5" 
                    className="flow-active-line"
                    markerEnd={replicaWalLag >= 15 ? 'url(#arr-rep-r)' : replicaWalLag >= 5 ? 'url(#arr-rep-y)' : 'url(#arr-rep-g)'}
                  />

                  {/* Primary -> Replica 2 */}
                  <path 
                    d="M 210 105 Q 330 145 470 125" 
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
                <div className="rds-k">
                  <div className="t">Writer TPS Load</div>
                  <div className="rds-v">{metrics.writerTps} TPS</div>
                </div>
                <div className="rds-k">
                  <div className="t">Replica TPS (each)</div>
                  <div className="rds-v">{metrics.replicaEach !== null ? `${metrics.replicaEach} TPS` : '—'}</div>
                </div>
                <div className="rds-k">
                  <div className="t">Failover Cluster State</div>
                  <div className="rds-v" style={{ color: azFailed ? (mode === 'single' ? '#dc2626' : '#ea580c') : '#16a34a' }}>{metrics.failState}</div>
                </div>
                <div className="rds-k">
                  <div className="t">Stale Read Risk</div>
                  <div className="rds-v" style={{ color: metrics.stale === 'High' ? '#dc2626' : metrics.stale === 'Med' ? '#d97706' : '#16a34a' }}>{metrics.stale}</div>
                </div>
              </div>

              {/* Action button bar */}
              <div className="rds-btnbar">
                <button className="rds-btn rds-primary" onClick={sendWrite}>✍️ Simulate WRITE</button>
                <button className="rds-btn" onClick={sendRead}>📖 Simulate READ</button>
                <button className="rds-btn" onClick={toggleAzFail} style={{ border: '1px solid #fca5a5', color: '#dc2626', background: '#fef2f2' }}>⚡ Toggle AZ Failure</button>
                <button className="rds-btn" onClick={resetSim}>🔄 Reset Sim</button>
              </div>

              {/* Live diagram & Active Log side-by-side */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch', marginTop: '16px' }}>
                <div style={{ flex: 7, border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '20px', padding: '16px', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 20px -2px rgba(0,0,0,0.02)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '10px', color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'activeNodePulse 1.5s infinite', '--pulse-color': 'rgba(16, 185, 129, 0.5)' } as React.CSSProperties}></span>
                      Live Active Traffic Ingress Diagram
                    </div>
                    
                    <svg width="100%" viewBox="0 0 680 260" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
                      <defs>
                        {/* 3D Cylinder Metallic Body Gradients */}
                        <linearGradient id="metal-writer-ok" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#a7f3d0" />
                          <stop offset="35%" stopColor="#6ee7b7" />
                          <stop offset="70%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="metal-writer-fail" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#fecaca" />
                          <stop offset="35%" stopColor="#f87171" />
                          <stop offset="70%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#b91c1c" />
                        </linearGradient>
                        <linearGradient id="metal-standby-ok" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#fde047" />
                          <stop offset="35%" stopColor="#facc15" />
                          <stop offset="70%" stopColor="#eab308" />
                          <stop offset="100%" stopColor="#ca8a04" />
                        </linearGradient>
                        <linearGradient id="metal-replica" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#ddd6fe" />
                          <stop offset="35%" stopColor="#c084fc" />
                          <stop offset="70%" stopColor="#a78bfa" />
                          <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                        <linearGradient id="metal-app" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#dbeafe" />
                          <stop offset="35%" stopColor="#93c5fd" />
                          <stop offset="70%" stopColor="#60a5fa" />
                          <stop offset="100%" stopColor="#2563eb" />
                        </linearGradient>

                        {/* Top Lids Gradient fills */}
                        <linearGradient id="lid-writer-ok" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#d1fae5" />
                          <stop offset="100%" stopColor="#6ee7b7" />
                        </linearGradient>
                        <linearGradient id="lid-writer-fail" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fee2e2" />
                          <stop offset="100%" stopColor="#f87171" />
                        </linearGradient>
                        <linearGradient id="lid-standby-ok" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#fef9c3" />
                          <stop offset="100%" stopColor="#facc15" />
                        </linearGradient>
                        <linearGradient id="lid-replica" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#f3e8ff" />
                          <stop offset="100%" stopColor="#a78bfa" />
                        </linearGradient>
                        <linearGradient id="lid-app" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#eff6ff" />
                          <stop offset="100%" stopColor="#60a5fa" />
                        </linearGradient>

                        {/* Route connection arrows */}
                        <marker id="arr-write" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 1 L 9 5 L 0 9 z" fill="#0284c7" />
                        </marker>
                        <marker id="arr-read" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 1 L 9 5 L 0 9 z" fill="#7c3aed" />
                        </marker>
                        <marker id="arr-sync" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 1 L 9 5 L 0 9 z" fill="#10b981" />
                        </marker>
                        <marker id="arr-async" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 1 L 9 5 L 0 9 z" fill="#8b5cf6" />
                        </marker>
                        <marker id="arr-fail" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 1 L 9 5 L 0 9 z" fill="#ef4444" />
                        </marker>
                      </defs>

                      {/* Blueprint Grid Lines Backdrop */}
                      <rect x="0" y="0" width="680" height="260" fill="#f8fafc" rx="6" />
                      <g stroke="#e2e8f0" strokeWidth="0.5" opacity="0.6">
                        {Array.from({ length: 17 }).map((_, i) => (
                          <line key={`x-${i}`} x1={i * 40} y1="0" x2={i * 40} y2="260" />
                        ))}
                        {Array.from({ length: 7 }).map((_, i) => (
                          <line key={`y-${i}`} x1="0" y1={i * 40} x2="680" y2={i * 40} />
                        ))}
                      </g>

                      {/* Availability Zones Boundaries */}
                      {/* AZ-A (Primary Subnet) */}
                      <rect x="215" y="30" width="220" height="205" rx="12" fill="rgba(255,255,255,0.7)" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4,4" />
                      <text x="325" y="44" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#64748b" letterSpacing="0.02em" fontFamily="inherit">us-east-1a Subnet (Primary Zone)</text>

                      {/* AZ-B/C (Secondary Subnets) */}
                      <rect x="445" y="30" width="220" height="205" rx="12" fill="rgba(255,255,255,0.7)" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="4,4" />
                      <text x="555" y="44" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#64748b" letterSpacing="0.02em" fontFamily="inherit">
                        {mode === 'multi_rr' ? 'us-east-1b & us-east-1c Zones' : 'us-east-1b Subnet (Standby Zone)'}
                      </text>

                      {/* APP TIER: Detailed high-fidelity Server Stack */}
                      <g transform="translate(20, 75)">
                        {/* Server container frame */}
                        <rect x="0" y="0" width="165" height="110" rx="16" fill="url(#metal-app)" stroke="#2563eb" strokeWidth="1.5" className="active-glow-node" style={{ '--pulse-color': 'rgba(37, 99, 235, 0.25)' } as React.CSSProperties} />
                        <rect x="5" y="5" width="155" height="100" rx="11" fill="#1e293b" />
                        
                        {/* Server Blades/Drawers */}
                        {/* Drawer 1 */}
                        <rect x="12" y="16" width="141" height="20" rx="4" fill="#0f172a" stroke="#334155" />
                        <circle cx="22" cy="26" r="3" fill="#10b981" />
                        <circle cx="30" cy="26" r="1.5" fill="#3b82f6" style={{ animation: 'activeNodePulse 1s infinite', '--pulse-color': '#3b82f6' } as React.CSSProperties} />
                        <rect x="45" y="24" width="70" height="4" rx="2" fill="#1e293b" />
                        <rect x="45" y="24" width="45" height="4" rx="2" fill="#10b981" />
                        
                        {/* Drawer 2 */}
                        <rect x="12" y="42" width="141" height="20" rx="4" fill="#0f172a" stroke="#334155" />
                        <circle cx="22" cy="52" r="3" fill="#10b981" />
                        <circle cx="30" cy="52" r="1.5" fill="#3b82f6" style={{ animation: 'activeNodePulse 1.2s infinite', '--pulse-color': '#3b82f6' } as React.CSSProperties} />
                        <rect x="45" y="50" width="70" height="4" rx="2" fill="#1e293b" />
                        <rect x="45" y="50" width="60" height="4" rx="2" fill="#0284c7" />

                        {/* Server Rack Labels */}
                        <text x="82.5" y="78" textAnchor="middle" fontSize="10" fill="#e2e8f0" fontWeight="bold" fontFamily="inherit">💻 sg-app compute-tier</text>
                        <text x="82.5" y="92" textAnchor="middle" fontSize="8" fill="#94a3b8" fontFamily="monospace">Load: {tps} TPS (25% W | 75% R)</text>
                      </g>

                      {/* State computation variables */}
                      {(() => {
                        const writerIsActive = !azFailed;
                        const writerIsSingleDown = azFailed && mode === 'single';
                        const writerIsMultiFailed = azFailed && mode !== 'single';

                        // 1. Primary DB Instance (AZ-a)
                        let wBodyFill = 'url(#metal-writer-ok)';
                        let wLidFill = 'url(#lid-writer-ok)';
                        let wStroke = '#10b981';
                        let wText = '#064e3b';
                        let wStatus = 'WRITER: WAL committing';
                        let wGlow = 'active-glow-node';
                        let wPulse = 'rgba(16, 185, 129, 0.35)';

                        if (writerIsSingleDown) {
                          wBodyFill = 'url(#metal-writer-fail)';
                          wLidFill = 'url(#lid-writer-fail)';
                          wStroke = '#ef4444';
                          wText = '#9f1239';
                          wStatus = '🚨 OFFLINE (NO HA)';
                          wGlow = '';
                          wPulse = '';
                        } else if (writerIsMultiFailed) {
                          wBodyFill = 'url(#metal-writer-fail)';
                          wLidFill = 'url(#lid-writer-fail)';
                          wStroke = '#ef4444';
                          wText = '#9f1239';
                          wStatus = '❌ EVICTED (Zone Crash)';
                          wGlow = '';
                          wPulse = '';
                        }

                        // 2. Standby HA Instance (AZ-b) Promotion
                        const standbyActive = mode !== 'single';
                        const standbyIsPromoted = azFailed && standbyActive;

                        let sBodyFill = 'url(#metal-standby-ok)';
                        let sLidFill = 'url(#lid-standby-ok)';
                        let sStroke = '#fbbf24';
                        let sText = '#78350f';
                        let sStatus = '🛡️ PASSIVE HOT STANDBY';
                        let sGlow = '';
                        let sPulse = 'rgba(251, 191, 36, 0.15)';

                        if (standbyIsPromoted) {
                          sBodyFill = 'url(#metal-writer-ok)';
                          sLidFill = 'url(#lid-writer-ok)';
                          sStroke = '#10b981';
                          sText = '#064e3b';
                          sStatus = '✍️ PROMOTED ACTIVE WRITER';
                          sGlow = 'active-glow-node';
                          sPulse = 'rgba(16, 185, 129, 0.4)';
                        }

                        // Active writer y coordinate for dynamic routing
                        const activeWriterY = standbyIsPromoted ? 180 : 90;

                        return (
                          <>
                            {/* CONNECTIONS PIPELINES (STATE RESPONSIVE ROUTES) */}
                            {writerIsSingleDown ? (
                              <>
                                {/* Blocked line */}
                                <path d="M 185 130 C 210 130, 220 95, 235 90" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="4,4" />
                                <text x="215" y="112" fontSize="8" fontWeight="bold" fill="#ef4444" textAnchor="middle">❌ OFFLINE</text>
                                <circle cx="205" cy="130" r="10" fill="#ef4444" />
                                <text x="205" y="130" dominantBaseline="central" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#ffffff">X</text>
                              </>
                            ) : (
                              <>
                                {/* 1. Active WRITE Endpoint Route (Blue conduit) */}
                                <path d={`M 185 120 C 210 120, 220 ${activeWriterY - 10}, 245 ${activeWriterY - 10}`} fill="none" stroke="#0284c7" strokeWidth="2.5" className="flow-active-line" markerEnd="url(#arr-write)" />
                                <text x="215" y={activeWriterY - 15} fontSize="8.5" fontWeight="bold" fill="#0369a1" textAnchor="middle">Writes: {metrics.writes} TPS</text>

                                {/* 2. Active READ Endpoint Route */}
                                {metrics.readTarget === 'writer' ? (
                                  <>
                                    <path d={`M 185 140 C 210 140, 220 ${activeWriterY + 10}, 245 ${activeWriterY + 10}`} fill="none" stroke="#0284c7" strokeWidth="2.5" className="flow-active-line" markerEnd="url(#arr-write)" />
                                    <text x="215" y={activeWriterY + 22} fontSize="8.5" fontWeight="bold" fill="#0369a1" textAnchor="middle">Reads: {metrics.reads} TPS</text>
                                  </>
                                ) : (
                                  mode === 'multi_rr' && (
                                    <>
                                      {/* Eventual Consistency reads route to replicas (Purple) */}
                                      <path d="M 185 140 C 220 140, 360 85, 480 85" fill="none" stroke="#8b5cf6" strokeWidth="2" className="flow-active-line" markerEnd="url(#arr-read)" />
                                      <path d="M 185 145 C 220 145, 360 165, 480 165" fill="none" stroke="#8b5cf6" strokeWidth="2" className="flow-active-line" markerEnd="url(#arr-read)" />
                                      <text x="235" y="160" fontSize="8.5" fontWeight="bold" fill="#6d28d9" textAnchor="middle">Reads (Split): {metrics.reads} TPS</text>
                                    </>
                                  )
                                )}
                              </>
                            )}

                            {/* ----------------- PRIMARY WRITER DATABASE (AZ-A) ----------------- */}
                            <g transform="translate(250, 52)" className={wGlow} style={{ '--pulse-color': wGlow ? wPulse : '' } as React.CSSProperties}>
                              {/* 3D Cylinder Shape */}
                              {/* Metallic Body */}
                              <path d="M 15 40 L 15 80 A 45 12 0 0 0 105 80 L 105 40 A 45 12 0 0 1 15 40 Z" fill={wBodyFill} stroke={wStroke} strokeWidth="1.5" />
                              {/* Glowing Top Lid Ellipse */}
                              <ellipse cx="60" cy="40" rx="45" ry="12" fill={wLidFill} stroke={wStroke} strokeWidth="1.5" />
                              {/* Server Rack Lining cues inside database */}
                              <line x1="28" y1="56" x2="92" y2="56" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                              <line x1="28" y1="68" x2="92" y2="68" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                              
                              {/* Text descriptions inside/above cylinder */}
                              <text x="60" y="24" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={wText}>🐘 Primary DB Writer</text>
                              <text x="60" y="65" textAnchor="middle" fontSize="8" fontWeight="bold" fill={wText === '#064e3b' ? '#047857' : '#9f1239'} opacity="0.95">{wStatus}</text>
                              <text x="60" y="98" textAnchor="middle" fontSize="9" fontWeight="800" fill={wText}>{writerIsActive ? `Load: ${metrics.writerTps} TPS` : '0 TPS — Unreachable'}</text>
                            </g>

                            {/* ----------------- HIGH AVAILABILITY STANDBY (AZ-B) ----------------- */}
                            {standbyActive && (
                              <g transform="translate(250, 142)" className={sGlow} style={{ '--pulse-color': sGlow ? sPulse : '' } as React.CSSProperties}>
                                {/* 3D Cylinder Shape */}
                                <path d="M 15 40 L 15 80 A 45 12 0 0 0 105 80 L 105 40 A 45 12 0 0 1 15 40 Z" fill={sBodyFill} stroke={sStroke} strokeWidth="1.5" />
                                <ellipse cx="60" cy="40" rx="45" ry="12" fill={sLidFill} stroke={sStroke} strokeWidth="1.5" />
                                <line x1="28" y1="56" x2="92" y2="56" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                                <line x1="28" y1="68" x2="92" y2="68" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />

                                <text x="60" y="24" textAnchor="middle" fontSize="10.5" fontWeight="800" fill={sText}>{standbyIsPromoted ? '🛡️ Promoted DB Writer' : '🛡️ HA Standby DB'}</text>
                                <text x="60" y="65" textAnchor="middle" fontSize="8" fontWeight="bold" fill={standbyIsPromoted ? '#047857' : '#b45309'} opacity="0.95">{sStatus}</text>
                                <text x="60" y="98" textAnchor="middle" fontSize="9" fontWeight="800" fill={sText}>{standbyIsPromoted ? `Load: ${metrics.writerTps} TPS` : 'State: Mirrored Commit (0 lag)'}</text>
                              </g>
                            )}

                            {/* 1. Synchronous Replication link (Green Sync conduit) */}
                            {standbyActive && (
                              writerIsActive ? (
                                <>
                                  <path d="M 310 135 L 310 180" fill="none" stroke="#10b981" strokeWidth="2.5" className="flow-active-line" markerEnd="url(#arr-sync)" />
                                  <text x="345" y="158" fontSize="8" fontWeight="bold" fill="#047857" textAnchor="middle">SYNC COMMITS 🔄</text>
                                </>
                              ) : (
                                <>
                                  <path d="M 310 135 L 310 180" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,3" />
                                  <text x="345" y="158" fontSize="8" fontWeight="bold" fill="#b91c1c" textAnchor="middle">LINK BROKEN ❌</text>
                                </>
                              )
                            )}

                            {/* ----------------- READ REPLICAS (AZ-B / AZ-C) ----------------- */}
                            {mode === 'multi_rr' && (
                              <>
                                {/* Replica #1 */}
                                <g transform="translate(485, 48)" className="active-glow-node" style={{ '--pulse-color': 'rgba(139, 92, 246, 0.25)' } as React.CSSProperties}>
                                  <path d="M 12 32 L 12 64 A 36 10 0 0 0 84 64 L 84 32 A 36 10 0 0 1 12 32 Z" fill="url(#metal-replica)" stroke="#8b5cf6" strokeWidth="1" />
                                  <ellipse cx="48" cy="32" rx="36" ry="10" fill="url(#lid-replica)" stroke="#8b5cf6" strokeWidth="1" />
                                  <line x1="22" y1="45" x2="74" y2="45" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                                  
                                  <text x="48" y="18" textAnchor="middle" fontSize="10" fontWeight="800" fill="#4c1d95">📖 Read Replica 1</text>
                                  <text x="48" y="52" textAnchor="middle" fontSize="7.5" fill="#5b21b6" fontFamily="monospace">Lag: {lag}s | {metrics.replicaEach} TPS</text>
                                </g>

                                {/* Replica #2 */}
                                <g transform="translate(485, 138)" className="active-glow-node" style={{ '--pulse-color': 'rgba(139, 92, 246, 0.25)' } as React.CSSProperties}>
                                  <path d="M 12 32 L 12 64 A 36 10 0 0 0 84 64 L 84 32 A 36 10 0 0 1 12 32 Z" fill="url(#metal-replica)" stroke="#8b5cf6" strokeWidth="1" />
                                  <ellipse cx="48" cy="32" rx="36" ry="10" fill="url(#lid-replica)" stroke="#8b5cf6" strokeWidth="1" />
                                  <line x1="22" y1="45" x2="74" y2="45" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />

                                  <text x="48" y="18" textAnchor="middle" fontSize="10" fontWeight="800" fill="#4c1d95">📖 Read Replica 2</text>
                                  <text x="48" y="52" textAnchor="middle" fontSize="7.5" fill="#5b21b6" fontFamily="monospace">Lag: {lag}s | {metrics.replicaEach} TPS</text>
                                </g>

                                {/* Async streaming lines from writer to replicas */}
                                {writerIsActive ? (
                                  <>
                                    <path d="M 370 90 C 400 90, 420 70, 480 70" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="5,2" className="flow-active-line" markerEnd="url(#arr-async)" />
                                    <path d="M 370 100 C 400 100, 420 150, 480 150" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="5,2" className="flow-active-line" markerEnd="url(#arr-async)" />
                                    <text x="420" y="62" fontSize="7.5" fontWeight="bold" fill="#6d28d9" textAnchor="middle">Async WAL ➡️</text>
                                  </>
                                ) : (
                                  <>
                                    {/* Standby Promoted DB routes WAL replication stream to replicas */}
                                    <path d="M 370 180 C 400 180, 420 100, 480 80" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="5,2" className="flow-active-line" markerEnd="url(#arr-async)" />
                                    <path d="M 370 190 C 400 190, 420 170, 480 160" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="5,2" className="flow-active-line" markerEnd="url(#arr-async)" />
                                    <text x="415" y="195" fontSize="7.5" fontWeight="bold" fill="#6d28d9" textAnchor="middle">Async WAL ➡️</text>
                                  </>
                                )}
                              </>
                            )}
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px', lineHeight: '1.5' }}>
                    💡 <b>Tip:</b> Toggling AZ failure with Multi-AZ enabled demonstrates automatic node shift: traffic is seamlessly routed to the us-east-1b promoted standby writer, and replica connections are maintained without downtime. In Single-AZ, writes fail immediately.
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
                          <path d="M 25 12 L 25 32 A 40 8 0 0 0 105 32 L 105 12 A 40 8 0 0 1 25 12 Z" fill="#ecfdf5" stroke="#059669" strokeWidth="1" />
                          <ellipse cx="65" cy="12" rx="40" ry="8" fill="#a7f3d0" stroke="#059669" strokeWidth="1" />
                          <text x="65" y="26" textAnchor="middle" fontSize="8" fill="#064e3b" fontWeight="bold">Production DB</text>

                          {/* Cloned Node */}
                          <path d="M 205 12 L 205 32 A 40 8 0 0 0 285 32 L 285 12 A 40 8 0 0 1 205 12 Z" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="1" />
                          <ellipse cx="245" cy="12" rx="40" ry="8" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="1" />
                          <text x="245" y="26" textAnchor="middle" fontSize="8" fill="#4c1d95" fontWeight="bold">Staging Clone DB</text>

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
                          <path d="M 65 32 L 65 90" fill="none" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" />
                          <path d="M 245 32 L 245 90" fill="none" stroke="#7c3aed" strokeWidth="1" strokeDasharray="3,3" />

                          {/* Diverged Blocks inside the storage or above */}
                          {cloneDivergedBlocks > 0 ? (
                            <>
                              <rect x="200" y="112" width="80" height="16" rx="2" fill="#fee2e2" stroke="#ef4444" strokeWidth="0.5" className="active-glow-node" style={{ '--pulse-color': 'rgba(239, 68, 68, 0.4)' } as React.CSSProperties} />
                              <text x="240" y="120" textAnchor="middle" fontSize="7.5" fill="#991b1b" fontWeight="bold">Diverged ({cloneDivergedBlocks} Blk)</text>
                              <path d="M 245 32 L 240 110" fill="none" stroke="#ef4444" strokeWidth="1.5" />
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
                        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b' }}>Compliance Grade: <span style={{ color: gColor }}>{grade} — {gDesc}</span></div>
                        <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '4px', lineHeight: '1.4' }}>
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
                            border: item.done ? '1.5px solid #10b981' : '1.5px solid #cbd5e1',
                            borderRadius: '8px',
                            background: item.done ? '#ecfdf5' : '#f8fafc',
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ fontSize: '14px' }}>{item.done ? '✅' : '⬜'}</div>
                          <div style={{ fontSize: '11.5px', fontWeight: 600, color: item.done ? '#064e3b' : '#334155' }}>
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
                      <rect x="20" y="15" width="100" height="70" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
                      <line x1="20" y1="36" x2="120" y2="36" stroke="rgba(59,130,246,0.1)" strokeWidth="1" />
                      <line x1="20" y1="56" x2="120" y2="56" stroke="rgba(59,130,246,0.1)" strokeWidth="1" />
                      <text x="70" y="32" textAnchor="middle" fontSize="9" fill="#1d4ed8" fontWeight="bold">⚡ Lambda Surge</text>
                      <text x="70" y="50" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="bold">{proxyConcurrency}</text>
                      <text x="70" y="66" textAnchor="middle" fontSize="8" fill="#3b82f6" fontWeight="600">TCP Sockets</text>

                      {/* Proxy Node */}
                      <rect x="250" y="15" width="140" height="70" rx="6" fill="#f0fdfa" stroke="#0284c7" strokeWidth="1.5" className="active-glow-node" style={{ '--pulse-color': 'rgba(2, 132, 199, 0.4)' } as React.CSSProperties} />
                      <circle cx="265" cy="28" r="2.5" fill="#10b981" />
                      <circle cx="273" cy="28" r="2.5" fill="#10b981" />
                      <circle cx="281" cy="28" r="2.5" fill="#3b82f6" />
                      <circle cx="289" cy="28" r="2.5" fill="#e2e8f0" />
                      <text x="320" y="38" textAnchor="middle" fontSize="10.5" fill="#0f172a" fontWeight="bold">🔄 RDS Proxy Pool</text>
                      <text x="320" y="58" textAnchor="middle" fontSize="8.5" fill="#0369a1" fontWeight="bold">Multiplexing Active</text>
                      <text x="320" y="72" textAnchor="middle" fontSize="8" fill="#475569" fontFamily="monospace">Queue Draining</text>

                      {/* Database Node */}
                      <path d="M 532 25 L 532 65 A 38 7 0 0 0 608 65 L 608 25 A 38 7 0 0 1 532 25 Z" fill="#ecfdf5" stroke="#059669" strokeWidth="1" />
                      <ellipse cx="570" cy="25" rx="38" ry="7" fill="#a7f3d0" stroke="#059669" strokeWidth="1" />
                      <line x1="542" y1="38" x2="598" y2="38" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                      <line x1="542" y1="48" x2="598" y2="48" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                      <text x="570" y="16" textAnchor="middle" fontSize="9" fill="#047857" fontWeight="bold">🐘 PostgreSQL DB</text>
                      <text x="570" y="58" textAnchor="middle" fontSize="11" fill="#065f46" fontWeight="bold">{Math.max(10, Math.min(60, Math.round(proxyConcurrency * 0.05 + 8)))}</text>
                      <text x="570" y="74" textAnchor="middle" fontSize="7.5" fill="#047857">Stable Sockets</text>

                      {/* Streaming Connection paths */}
                      {/* Flow Surge -> Proxy */}
                      <path d="M 120 30 L 250 45" fill="none" stroke="#ef4444" strokeWidth="1.5" className="flow-active-line" style={{ strokeDasharray: '4, 2', animationDuration: proxyConcurrency > 600 ? '0.2s' : '0.5s' } as React.CSSProperties} />
                      <path d="M 120 50 L 250 50" fill="none" stroke="#ef4444" strokeWidth="1.5" className="flow-active-line" style={{ strokeDasharray: '4, 2', animationDuration: proxyConcurrency > 600 ? '0.1s' : '0.4s' } as React.CSSProperties} />
                      <path d="M 120 70 L 250 55" fill="none" stroke="#ef4444" strokeWidth="1.5" className="flow-active-line" style={{ strokeDasharray: '4, 2', animationDuration: proxyConcurrency > 600 ? '0.2s' : '0.5s' } as React.CSSProperties} />

                      {/* Flow Proxy -> DB (Slow, stable green flow) */}
                      <path d="M 390 50 L 532 50" fill="none" stroke="#10b981" strokeWidth="3" className="flow-active-line" style={{ strokeDasharray: '8, 4', animationDuration: '2s' } as React.CSSProperties} />
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
                    
                    {/* 3D Cylinder Shape - Primary Writer */}
                    <g className="active-glow-node" style={{ '--pulse-color': 'rgba(16, 185, 129, 0.4)' } as React.CSSProperties}>
                      <path d="M 87 262 L 87 287 A 38 7 0 0 0 163 287 L 163 262 A 38 7 0 0 1 87 262 Z" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                      <ellipse cx="125" cy="262" rx="38" ry="7" fill="#a7f3d0" stroke="#10b981" strokeWidth="1.5" />
                      <line x1="97" y1="274" x2="153" y2="274" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                      <text x="125" y="248" textAnchor="middle" fontSize="9.5" fill="#065f46" fontWeight="bold" fontFamily="sans-serif">✍️ Primary Writer</text>
                      <text x="125" y="280" textAnchor="middle" fontSize="7.5" fill="#047857" fontWeight="bold" fontFamily="monospace">sg-db | Active</text>
                    </g>

                    {/* 3D Cylinder Shape - Read Replica 1 */}
                    <g className="active-glow-node" style={{ '--pulse-color': 'rgba(139, 92, 246, 0.3)' } as React.CSSProperties}>
                      <path d="M 87 337 L 87 362 A 38 7 0 0 0 163 362 L 163 337 A 38 7 0 0 1 87 337 Z" fill="url(#g-replica)" stroke="#8b5cf6" strokeWidth="1" />
                      <ellipse cx="125" cy="337" rx="38" ry="7" fill="#ddd6fe" stroke="#8b5cf6" strokeWidth="1" />
                      <text x="125" y="325" textAnchor="middle" fontSize="9.5" fill="#4c1d95" fontWeight="bold" fontFamily="sans-serif">📖 Read Replica 1</text>
                      <text x="125" y="352" textAnchor="middle" fontSize="7.5" fill="#6d28d9" fontWeight="bold" fontFamily="monospace">Asynchronous Copy</text>
                    </g>

                    {/* AZ-b */}
                    <rect x="240" y="225" width="180" height="220" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5"/>
                    <text x="330" y="240" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#b45309" fontFamily="monospace">Subnet AZ-b</text>
                    
                    {/* 3D Cylinder Shape - Standby Replica */}
                    <g>
                      <path d="M 292 262 L 292 287 A 38 7 0 0 0 368 287 L 368 262 A 38 7 0 0 1 292 262 Z" fill="#fffbeb" stroke="#fbbf24" strokeWidth="1" />
                      <ellipse cx="330" cy="262" rx="38" ry="7" fill="#fef3c7" stroke="#fbbf24" strokeWidth="1" />
                      <text x="330" y="248" textAnchor="middle" fontSize="9.5" fill="#92400e" fontWeight="bold" fontFamily="sans-serif">🛡️ Standby Replica</text>
                      <text x="330" y="280" textAnchor="middle" fontSize="7.5" fill="#b45309" fontWeight="bold" fontFamily="monospace">Sync HA Mirror</text>
                    </g>

                    {/* 3D Cylinder Shape - Read Replica 2 */}
                    <g className="active-glow-node" style={{ '--pulse-color': 'rgba(139, 92, 246, 0.3)' } as React.CSSProperties}>
                      <path d="M 292 337 L 292 362 A 38 7 0 0 0 368 362 L 368 337 A 38 7 0 0 1 292 337 Z" fill="url(#g-replica)" stroke="#8b5cf6" strokeWidth="1" />
                      <ellipse cx="330" cy="337" rx="38" ry="7" fill="#ddd6fe" stroke="#8b5cf6" strokeWidth="1" />
                      <text x="330" y="325" textAnchor="middle" fontSize="9.5" fill="#4c1d95" fontWeight="bold" fontFamily="sans-serif">📖 Read Replica 2</text>
                      <text x="330" y="352" textAnchor="middle" fontSize="7.5" fill="#6d28d9" fontWeight="bold" fontFamily="monospace">Asynchronous Copy</text>
                    </g>

                    {/* AZ-c */}
                    <rect x="445" y="225" width="180" height="220" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5"/>
                    <text x="535" y="240" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#b45309" fontFamily="monospace">Subnet AZ-c</text>
                    
                    {/* 3D Cylinder Shape - Read Replica 3 */}
                    <g className="active-glow-node" style={{ '--pulse-color': 'rgba(139, 92, 246, 0.3)' } as React.CSSProperties}>
                      <path d="M 497 262 L 497 287 A 38 7 0 0 0 573 287 L 573 262 A 38 7 0 0 1 497 262 Z" fill="url(#g-replica)" stroke="#8b5cf6" strokeWidth="1" />
                      <ellipse cx="535" cy="262" rx="38" ry="7" fill="#ddd6fe" stroke="#8b5cf6" strokeWidth="1" />
                      <text x="535" y="248" textAnchor="middle" fontSize="9.5" fill="#4c1d95" fontWeight="bold" fontFamily="sans-serif">📖 Read Replica 3</text>
                      <text x="535" y="280" textAnchor="middle" fontSize="7.5" fill="#6d28d9" fontWeight="bold" fontFamily="monospace">Asynchronous Copy</text>
                    </g>

                    {/* Replication paths connectors */}
                    {/* Primary -> Standby Sync */}
                    <line x1="163" y1="274" x2="292" y2="274" stroke="#10b981" strokeWidth="2" strokeDasharray="3,1" className="flow-active-line" markerEnd="url(#arr-g)" />
                    <text x="227.5" y="268" textAnchor="middle" fontSize="7" fill="#059669" fontWeight="bold" fontFamily="monospace">Sync 🔄</text>

                    {/* Primary -> RR1 Async */}
                    <line x1="125" y1="287" x2="125" y2="337" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,2" className="flow-active-line" markerEnd="url(#arr-p)" />
                    
                    {/* Primary -> RR2 Async */}
                    <path d="M 163 280 Q 220 295 292 330" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,2" className="flow-active-line" markerEnd="url(#arr-p)" />
                    
                    {/* Primary -> RR3 Async */}
                    <path d="M 163 275 Q 330 310 497 262" fill="none" stroke="#8b5cf6" strokeWidth="1.5" strokeDasharray="4,2" className="flow-active-line" markerEnd="url(#arr-p)" />
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
  );
}
