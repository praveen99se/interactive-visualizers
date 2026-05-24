import { useState, useEffect } from 'react';

type TabType = 'overview' | 'storage' | 'cluster' | 'multiaz' | 'global' | 'serverless' | 'endpoints' | 'failover' | 'integrations' | 'features' | 'vsrds';

const tabs: { id: TabType; label: string; emoji: string }[] = [
  { id: 'overview', label: 'Overview Dashboard', emoji: '📊' },
  { id: 'storage', label: 'Storage Engine', emoji: '💾' },
  { id: 'cluster', label: 'Cluster Architecture', emoji: '🏛️' },
  { id: 'multiaz', label: 'Multi-AZ', emoji: '🌐' },
  { id: 'global', label: 'Global DB', emoji: '🌎' },
  { id: 'serverless', label: 'Serverless v2', emoji: '⚡' },
  { id: 'endpoints', label: 'Endpoints', emoji: '🔌' },
  { id: 'failover', label: 'Failover Sim', emoji: '💥' },
  { id: 'integrations', label: 'Integrations', emoji: '🔄' },
  { id: 'features', label: 'Features & Security', emoji: '🔐' },
  { id: 'vsrds', label: 'Aurora vs RDS', emoji: '⚖️' },
];

const compareRows = [
  ['Storage', 'Shared, 6 copies, auto-scale 128TB', 'Per-instance EBS, manual scale'],
  ['Read Replicas', 'Up to 15, near-zero lag', 'Up to 5, async lag'],
  ['Failover time', '< 30 seconds', '30–60 seconds'],
  ['Replication', 'Shared storage (no copy)', 'Binlog / WAL streaming'],
  ['Serverless', 'v2 ✅ (seconds scale)', '❌'],
  ['Global DB', '✅ RPO < 1s, RTO < 1min', 'Cross-region replica only'],
  ['RDS Proxy', '✅', '✅'],
  ['Data API', '✅ (HTTP, no VPC)', '❌'],
  ['Zero-ETL → Redshift', '✅', '❌'],
  ['ML (SageMaker/Comprehend)', '✅', '❌'],
  ['Cost vs RDS', '~20–30% more expensive', 'Baseline'],
  ['SQL Server / Oracle', '❌', '✅'],
  ['Max storage', '128 TB (auto)', '64 TB (manual)'],
];

export default function AuroraVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Overview Tab states
  const [overviewCopies, setOverviewCopies] = useState<boolean[]>([true, true, true, true, true, true]);
  const [overviewUsed, setOverviewUsed] = useState<number>(35);
  const [overviewAllocated, setOverviewAllocated] = useState<number>(40);
  const [overviewExpandStatus, setOverviewExpandStatus] = useState<string>('✅ No expansion needed');
  const [overviewExpandColor, setOverviewExpandColor] = useState<string>('#15803d');

  // Features / Security Tab States
  const [activeFeatureTab, setActiveFeatureTab] = useState<'backup' | 'clone' | 'security' | 'ml'>('backup');
  const [pitrHours, setPitrHours] = useState<number>(6);
  const [btHours, setBtHours] = useState<number>(2);
  const [secChecks, setSecChecks] = useState([
    {label:'Encryption at rest (KMS)', done:true},
    {label:'TLS enforced (force_ssl=1)', done:true},
    {label:'Aurora in private subnet', done:true},
    {label:'Publicly accessible = OFF', done:false},
    {label:'Security Group: restrict port', done:true},
    {label:'IAM DB Auth enabled', done:false},
    {label:'Secrets Manager rotation', done:true},
    {label:'Deletion protection ON', done:false},
    {label:'CloudTrail logging', done:true},
    {label:'Enhanced Monitoring', done:false},
    {label:'Backup retention ≥ 7 days', done:true},
    {label:'VPC endpoints (no NAT)', done:false},
  ]);
  const [activeMlQuery, setActiveMlQuery] = useState<'sentiment' | 'fraud' | 'churn'>('sentiment');

  const pitrEst = Math.round(5 + pitrHours / 10);
  const btEst = Math.round(20 + btHours * 0.5);

  const toggleSecCheck = (index: number) => {
    setSecChecks(prev => {
      const next = [...prev];
      next[index] = { ...next[index], done: !next[index].done };
      return next;
    });
  };

  const cloneRows = [
    ['Speed','Seconds (no copy)','5–30 min (full copy)'],
    ['Storage cost','Only diverged pages','Full duplicate'],
    ['Source impact','None','None'],
    ['Cross-account','✅','✅'],
    ['Cross-region','❌','✅'],
    ['Use for','Dev/test/analytics','DR, long-term archive'],
  ];

  const mlQueries: Record<string, {sql: string, result: string}> = {
    sentiment: {
      sql: "SELECT id, review_text,\n  aws_comprehend_detect_sentiment(\n    review_text, 'en'\n  ) AS sentiment\nFROM product_reviews\nLIMIT 3;",
      result: "id=1 → POSITIVE (0.97)\nid=2 → NEGATIVE (0.88)\nid=3 → NEUTRAL  (0.72)"
    },
    fraud: {
      sql: "SELECT txn_id, amount,\n  aws_sagemaker_invoke_endpoint(\n    'fraud-model-endpoint',\n    'application/json',\n    amount, merchant_id, hour_of_day\n  ) AS fraud_score\nFROM transactions\nWHERE fraud_score > 0.8;",
      result: "txn_id=TXN-4821 → fraud_score=0.94 ⚠️\ntxn_id=TXN-9103 → fraud_score=0.87 ⚠️"
    },
    churn: {
      sql: "SELECT customer_id,\n  aws_sagemaker_invoke_endpoint(\n    'churn-model-endpoint',\n    'text/csv',\n    days_since_login, num_orders\n  ) AS churn_probability\nFROM customers\nORDER BY churn_probability DESC\nLIMIT 5;",
      result: "cust_id=C-1042 → churn=0.91 🔴\ncust_id=C-2871 → churn=0.83 🔴\ncust_id=C-0034 → churn=0.71 🟡"
    }
  };

  const failOneOverviewCopy = () => {
    const failedIdx = overviewCopies.findIndex(val => val === true);
    if (failedIdx === -1) return;
    const newCopies = [...overviewCopies];
    newCopies[failedIdx] = false;
    setOverviewCopies(newCopies);
  };

  const repairOverviewCopies = () => {
    let currentCopies = [...overviewCopies];
    const timer = setInterval(() => {
      const nextFailedIdx = currentCopies.findIndex(val => val === false);
      if (nextFailedIdx === -1) {
        clearInterval(timer);
        return;
      }
      currentCopies[nextFailedIdx] = true;
      setOverviewCopies([...currentCopies]);
    }, 350);
  };

  const resetOverviewCopies = () => {
    setOverviewCopies([true, true, true, true, true, true]);
  };

  const handleOverviewUsedChange = (val: number) => {
    setOverviewUsed(val);
    
    let newAlloc = overviewAllocated;
    let expanded = false;
    while (val > newAlloc && newAlloc < 131072) {
      newAlloc += 10;
      expanded = true;
    }
    
    if (expanded) {
      setOverviewAllocated(newAlloc);
      setOverviewExpandStatus('⚠️ Expanded automatically to fit');
      setOverviewExpandColor('#d97706');
      setTimeout(() => {
        setOverviewExpandStatus('✅ Expansion complete');
        setOverviewExpandColor('#15803d');
      }, 700);
    } else {
      setOverviewExpandStatus('✅ No expansion needed');
      setOverviewExpandColor('#15803d');
    }
  };

  // Serverless ACU simulation states
  const [connections, setConnections] = useState<number>(50);
  const [acu, setAcu] = useState<number>(2);
  const [ram, setRam] = useState<string>('4.0 GB');
  const [cost, setCost] = useState<string>('0.12');
  const [scaleStatus, setScaleStatus] = useState<string>('✅ Stable');
  const [scaleColor, setScaleColor] = useState<string>('#15803d');

  // Self-healing Storage mini-sim states
  const [copies, setCopies] = useState<boolean[]>([true, true, true, true, true, true]);
  const healthyCopiesCount = copies.filter(Boolean).length;
  const [storageLog, setStorageLog] = useState<string>('Storage layer healthy. Six replicas sync write records across three AZs.');

  // Failover simulation states
  const [simState, setSimState] = useState({ writerFailed: false, r2Failed: false, promoted: false });
  const [logLines, setLogLines] = useState<{ msg: string; type: 'ok' | 'warn' | 'err' | 'info' }[]>([
    { msg: '[00:00] All instances healthy. Cluster nominal.', type: 'ok' }
  ]);

  // Handle Serverless ACU scaling logic based on connections slider
  useEffect(() => {
    const val = connections;
    const computedAcu = Math.max(0.5, Math.min(256, Math.ceil(val / 25)));
    setAcu(computedAcu);
    setRam(`${(computedAcu * 2).toFixed(1)} GB`);
    setCost((computedAcu * 0.06).toFixed(2));
    
    if (val < 50) {
      setScaleStatus('✅ Stable');
      setScaleColor('#15803d');
    } else if (val < 200) {
      setScaleStatus('⬆️ Scaling up');
      setScaleColor('#d97706');
    } else {
      setScaleStatus('🔥 High load');
      setScaleColor('#dc2626');
    }
  }, [connections]);

  // Mini-simulation: Storage copies failure
  const failOneCopy = () => {
    const failedIdx = copies.findIndex(val => val === true);
    if (failedIdx === -1) {
      setStorageLog('All copies are already failed. Critical data loss simulated!');
      return;
    }
    const newCopies = [...copies];
    newCopies[failedIdx] = false;
    setCopies(newCopies);
    setStorageLog(`⚠️ Copy ${failedIdx + 1} experienced disk failure. Aurora continues serving reads & writes via quorum.`);
  };

  // Mini-simulation: Storage self-healing repair
  const selfHealStorage = () => {
    const repairIdx = copies.findIndex(val => val === false);
    if (repairIdx === -1) {
      setStorageLog('All storage copies are already 100% healthy.');
      return;
    }
    setStorageLog('🔄 Initiating Aurora background self-healing rebuild. Syncing data from healthy disks...');
    
    // Animate repair sequentially
    let currentCopies = [...copies];
    const timer = setInterval(() => {
      const nextFailedIdx = currentCopies.findIndex(val => val === false);
      if (nextFailedIdx === -1) {
        clearInterval(timer);
        setStorageLog('✅ Storage rebuilt completed. All 6 copies back to healthy state.');
        return;
      }
      currentCopies[nextFailedIdx] = true;
      setCopies([...currentCopies]);
    }, 400);
  };

  const resetStorageCopies = () => {
    setCopies([true, true, true, true, true, true]);
    setStorageLog('Storage layer reset. All six replicas sync write records across three AZs.');
  };

  // Event logger for failover sim
  const addLog = (msg: string, type: 'ok' | 'warn' | 'err' | 'info') => {
    setLogLines(prev => [{ msg, type }, ...prev].slice(0, 8));
  };

  // Playbook Simulation: Failover Primary Writer
  const triggerFailover = () => {
    if (simState.writerFailed) {
      addLog('[ERR] Writer already failed. Reset first.', 'err');
      return;
    }
    setSimState(prev => ({ ...prev, writerFailed: true }));
    addLog('[T+0s] 💥 AZ-1 failure detected. Writer unreachable.', 'err');
    
    setTimeout(() => {
      addLog('[T+5s] ⚠️ Health check failed. Initiating failover...', 'warn');
    }, 600);
    
    setTimeout(() => {
      addLog('[T+10s] 🔍 Selecting replica with highest priority...', 'info');
    }, 1200);
    
    setTimeout(() => {
      addLog('[T+15s] ✅ Replica 1 (AZ-2, Priority 1) promoted to Writer!', 'ok');
      setSimState(prev => ({ ...prev, promoted: true }));
    }, 1800);
    
    setTimeout(() => {
      addLog('[T+20s] 🔄 Cluster endpoint DNS updated → new writer.', 'ok');
    }, 2400);
    
    setTimeout(() => {
      addLog('[T+25s] ✅ Cluster healthy. RDS Proxy reconnected.', 'ok');
    }, 3000);
  };

  // Playbook Simulation: Fail Reader Replica 2
  const triggerReplicaFail = () => {
    if (simState.r2Failed) {
      addLog('[ERR] Replica 2 already failed. Reset first.', 'err');
      return;
    }
    setSimState(prev => ({ ...prev, r2Failed: true }));
    addLog('[T+0s] ⚠️ Replica 2 (AZ-3) health check failed.', 'warn');
    
    setTimeout(() => {
      addLog('[T+3s] 🔄 Reader endpoint removed Replica 2 from rotation.', 'info');
    }, 600);
    
    setTimeout(() => {
      addLog('[T+5s] ✅ Reader endpoint now routes to Replica 1 only.', 'ok');
    }, 1200);
    
    setTimeout(() => {
      addLog('[T+8s] 📊 CloudWatch alarm triggered: ReplicaCount < 2', 'warn');
    }, 1800);
  };

  const resetSim = () => {
    setSimState({ writerFailed: false, r2Failed: false, promoted: false });
    setLogLines([{ msg: '[00:00] All instances healthy. Cluster nominal.', type: 'ok' }]);
  };

  const sendTerraformPrompt = () => {
    alert("Copied Terraform script configuration query! Requesting code generation for a fully resilient multi-AZ Aurora Cluster with RDS Proxy, Secrets Manager, Auto-scaling replicas, and security groups.");
  };

  return (
    <div>
      <style>{`
        .b-purple { background: #ede9fe; color: #7c3aed; }
        .b-blue { background: #dbeafe; color: #1d4ed8; }
        .b-green { background: #dcfce7; color: #15803d; }
        .b-orange { background: #ffedd5; color: #c2410c; }
        .b-red { background: #fee2e2; color: #b91c1c; }
        .b-teal { background: #ccfbf1; color: #0f766e; }
        .sec { font-size: 11px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.06em; margin: 16px 0 8px; }
        .sec:first-child { margin-top: 0; }
        .kv { display: flex; gap: 8px; font-size: 12px; margin-bottom: 5px; align-items: flex-start; }
        .kk { color: var(--color-text-secondary); min-width: 140px; flex-shrink: 0; }
        .kv b { color: var(--color-text-primary); }
        .sim-node { border: 0.5px solid var(--color-border-tertiary); border-radius: 8px; padding: 10px; font-size: 12px; text-align: center; transition: all 0.2s ease; background: var(--color-background-primary); }
        .sim-node.healthy { border-color: #16a34a; background: #f0fdf4; }
        .sim-node.failed { border-color: #dc2626; background: #fef2f2; }
        .sim-node.promoted { border-color: #7c3aed; background: #faf5ff; }
        .log-line { font-size: 11px; padding: 4.5px 0; border-bottom: 0.5px solid var(--color-border-tertiary); color: var(--color-text-secondary); line-height: 1.4; }
        .log-line.ok { color: #15803d; }
        .log-line.warn { color: #d97706; }
        .log-line.err { color: #dc2626; }
        .log-line.info { color: #1d4ed8; }
        .checklist li { font-size: 12.5px; margin-bottom: 5px; list-style: none; padding-left: 20px; position: relative; color: var(--color-text-primary); }
        .checklist li::before { content: "✓"; position: absolute; left: 0; color: #15803d; font-weight: 700; }
        .warn-list li { font-size: 12.5px; margin-bottom: 5px; list-style: none; padding-left: 20px; position: relative; color: var(--color-text-primary); }
        .warn-list li::before { content: "⚠"; position: absolute; left: 0; color: #d97706; }
        svg text { font-family: var(--font-sans, sans-serif); }
      `}</style>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🌌 Amazon Aurora — Complete Architecture
        </h1>
        <p className="text-gray-600">
          Storage Engine · Cluster · Multi-AZ · Global DB · Serverless · Proxy · Failover Simulation · Integrations
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-bar mb-6">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`tab ${activeTab === t.id ? 'active' : ''}`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">

      {/* Tab 0: Overview Dashboard */}
      {activeTab === 'overview' && (
        <div>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-text-primary)' }}>Aurora HA + Read Scaling (Shared Storage, Self‑Healing, Auto‑Expanding)</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>One picture for intuition + two tiny simulations you can click</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '12px', alignItems: 'start' }}>
            <div className="card">
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                <span style={{ borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: 500, border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>HA: 6 copies across 3 AZs</span>
                <span style={{ borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: 500, border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>Quorum: write 4/6, read 3/6</span>
                <span style={{ borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: 500, border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>Read scaling: Reader endpoint → replicas</span>
                <span style={{ borderRadius: '999px', padding: '3px 9px', fontSize: '11px', fontWeight: 500, border: '0.5px solid var(--color-border-tertiary)', background: 'var(--color-background-secondary)' }}>Storage: auto‑grows (10 GB steps) up to 128 TB</span>
              </div>

              <svg width="100%" viewBox="0 0 680 440" style={{ display: 'block' }}>
                <defs>
                  <marker id="arrowP" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#6b7280"></path>
                  </marker>
                  <marker id="arrowB" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#2563eb"></path>
                  </marker>
                  <marker id="arrowG" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L8,3 z" fill="#16a34a"></path>
                  </marker>
                </defs>

                {/* Client */}
                <g className="c-blue">
                  <rect className="box" x="20" y="22" width="200" height="56" rx="10" strokeWidth="0.5" fill="#eff6ff" stroke="#bfdbfe"></rect>
                  <text className="th" x="120" y="44" textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#1d4ed8" fontWeight="500">Clients / App</text>
                  <text className="ts" x="120" y="62" textAnchor="middle" dominantBaseline="central" fontSize="11" fill="#1d4ed8">web, API, Lambda, services</text>
                </g>

                {/* Endpoints */}
                <g className="c-purple">
                  <rect className="box" x="250" y="16" width="410" height="70" rx="12" strokeWidth="0.5" fill="#faf5ff" stroke="#c4b5fd"></rect>
                  <text className="th" x="455" y="36" textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#7c3aed" fontWeight="500">Aurora Endpoints (DNS)</text>

                  <rect x="270" y="46" width="190" height="30" rx="8" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="0.5"></rect>
                  <text x="365" y="61" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#6d28d9" fontWeight="500">Writer (Cluster) endpoint</text>

                  <rect x="475" y="46" width="170" height="30" rx="8" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="0.5"></rect>
                  <text x="560" y="61" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#6d28d9" fontWeight="500">Reader endpoint</text>
                </g>

                {/* Compute layer */}
                <g className="c-teal">
                  <rect className="box" x="20" y="105" width="640" height="120" rx="14" strokeWidth="0.5" fill="#f0fdf4" stroke="#86efac"></rect>
                  <text className="th" x="340" y="126" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#0f766e" fontWeight="500">Compute layer (instances in multiple AZs)</text>

                  <rect x="45" y="145" width="190" height="62" rx="10" fill="#ccfbf1" stroke="#5eead4" strokeWidth="0.5"></rect>
                  <text x="140" y="168" textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#0f766e" fontWeight="500">✍️ Writer instance</text>
                  <text x="140" y="188" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#0f766e">reads + writes</text>

                  <rect x="255" y="145" width="170" height="62" rx="10" fill="#ccfbf1" stroke="#5eead4" strokeWidth="0.5"></rect>
                  <text x="340" y="168" textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#0f766e" fontWeight="500">📖 Replica A</text>
                  <text x="340" y="188" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#0f766e">reads only</text>

                  <rect x="445" y="145" width="170" height="62" rx="10" fill="#ccfbf1" stroke="#5eead4" strokeWidth="0.5"></rect>
                  <text x="530" y="168" textAnchor="middle" dominantBaseline="central" fontSize="13" fill="#0f766e" fontWeight="500">📖 Replica B</text>
                  <text x="530" y="188" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#0f766e">reads only</text>

                  <text x="340" y="214" textAnchor="middle" dominantBaseline="central" fontSize="11" fill="#0f766e">Read scaling = add replicas (up to 15) and send SELECTs to the Reader endpoint</text>
                </g>

                {/* Storage layer */}
                <g className="c-green">
                  <rect className="box" x="20" y="245" width="640" height="175" rx="14" strokeWidth="0.5" fill="#dcfce7" stroke="#86efac"></rect>
                  <text className="th" x="340" y="265" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#166534" fontWeight="500">Shared distributed storage (the HA “secret sauce”)</text>

                  {/* AZ containers */}
                  <rect x="45" y="285" width="170" height="118" rx="12" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"></rect>
                  <text x="130" y="304" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#166534" fontWeight="500">AZ-1</text>
                  <rect x="62" y="318" width="136" height="28" rx="8" fill="#bbf7d0" stroke="#86efac" strokeWidth="0.5"></rect>
                  <text x="130" y="332" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#166534">Copy 1</text>
                  <rect x="62" y="356" width="136" height="28" rx="8" fill="#bbf7d0" stroke="#86efac" strokeWidth="0.5"></rect>
                  <text x="130" y="370" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#166534">Copy 2</text>

                  <rect x="255" y="285" width="170" height="118" rx="12" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"></rect>
                  <text x="340" y="304" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#166534" fontWeight="500">AZ-2</text>
                  <rect x="272" y="318" width="136" height="28" rx="8" fill="#bbf7d0" stroke="#86efac" strokeWidth="0.5"></rect>
                  <text x="340" y="332" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#166534">Copy 3</text>
                  <rect x="272" y="356" width="136" height="28" rx="8" fill="#bbf7d0" stroke="#86efac" strokeWidth="0.5"></rect>
                  <text x="340" y="370" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#166534">Copy 4</text>

                  <rect x="445" y="285" width="170" height="118" rx="12" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"></rect>
                  <text x="530" y="304" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#166534" fontWeight="500">AZ-3</text>
                  <rect x="462" y="318" width="136" height="28" rx="8" fill="#bbf7d0" stroke="#86efac" strokeWidth="0.5"></rect>
                  <text x="530" y="332" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#166534">Copy 5</text>
                  <rect x="462" y="356" width="136" height="28" rx="8" fill="#bbf7d0" stroke="#86efac" strokeWidth="0.5"></rect>
                  <text x="530" y="370" textAnchor="middle" dominantBaseline="central" fontSize="12" fill="#166534">Copy 6</text>

                  <text x="340" y="410" textAnchor="middle" dominantBaseline="central" fontSize="11" fill="#166534">
                    Self‑healing: if a copy becomes unhealthy, Aurora rebuilds a new copy automatically to restore “6 copies”
                  </text>
                </g>

                {/* Arrows */}
                <path d="M 220 50 L 250 50" fill="none" stroke="#6b7280" strokeWidth="1" markerEnd="url(#arrowP)"></path>

                {/* Writes */}
                <path d="M 365 76 L 140 105" fill="none" stroke="#2563eb" strokeWidth="1.2" markerEnd="url(#arrowB)"></path>
                <text x="250" y="92" textAnchor="middle" fontSize="11" fill="#2563eb">writes</text>

                {/* Reads */}
                <path d="M 560 76 L 340 105" fill="none" stroke="#16a34a" strokeWidth="1.2" markerEnd="url(#arrowG)"></path>
                <path d="M 560 76 L 530 105" fill="none" stroke="#16a34a" strokeWidth="1.2" markerEnd="url(#arrowG)"></path>
                <text x="520" y="92" textAnchor="middle" fontSize="11" fill="#16a34a">reads</text>

                {/* Redo logs to shared storage */}
                <path d="M 140 207 L 140 245" fill="none" stroke="#6b7280" strokeWidth="1" markerEnd="url(#arrowP)" strokeDasharray="4,3"></path>
                <path d="M 340 207 L 340 245" fill="none" stroke="#6b7280" strokeWidth="1" markerEnd="url(#arrowP)" strokeDasharray="4,3"></path>
                <path d="M 530 207 L 530 245" fill="none" stroke="#6b7280" strokeWidth="1" markerEnd="url(#arrowP)" strokeDasharray="4,3"></path>
                <text x="610" y="232" textAnchor="middle" fontSize="11" fill="#6b7280">redo log</text>
              </svg>

              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                <b style={{ color: 'var(--color-text-primary)' }}>Mental model:</b> Instances are “compute”, storage is a separate multi‑AZ system. Replicas scale reads; storage replication gives HA.
              </div>
            </div>

            <div>
              <div className="card" style={{ marginBottom: '12px' }}>
                <div style={{ fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-primary)' }}>1) Self‑healing storage (mini sim)</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Click “Fail 1 copy” → quorum stays OK, then Aurora repairs back to 6 copies.</div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '6px', marginTop: '10px' }}>
                  {overviewCopies.map((ok, i) => (
                    <div key={i} style={{
                      textAlign: 'center',
                      padding: '8px 2px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 500,
                      border: `0.5px solid ${ok ? '#86efac' : '#fca5a5'}`,
                      background: ok ? '#f0fdf4' : '#fef2f2',
                      color: ok ? '#166534' : '#b91c1c'
                    }}>
                      {ok ? `C${i + 1}` : `C${i + 1} ✖`}
                    </div>
                  ))}
                </div>

                {(() => {
                  const healthy = overviewCopies.filter(Boolean).length;
                  const wOK = healthy >= 4;
                  const rOK = healthy >= 3;
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px', marginTop: '10px' }}>
                      <div style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', padding: '10px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Write quorum (needs 4/6)</div>
                        <div style={{ fontSize: '16px', fontWeight: 500, color: wOK ? '#15803d' : '#dc2626' }}>
                          {wOK ? '✅ OK' : '❌ AT RISK'} ({healthy}/6)
                        </div>
                      </div>
                      <div style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', padding: '10px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Read quorum (needs 3/6)</div>
                        <div style={{ fontSize: '16px', fontWeight: 500, color: rOK ? '#15803d' : '#dc2626' }}>
                          {rOK ? '✅ OK' : '❌ AT RISK'} ({healthy}/6)
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <button onClick={failOneOverviewCopy} style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', background: '#fee2e2', border: '0.5px solid #fca5a5', color: '#b91c1c' }}>Fail 1 copy</button>
                  <button onClick={repairOverviewCopies} style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', background: '#dcfce7', border: '0.5px solid #86efac', color: '#15803d' }}>Self‑heal (repair)</button>
                  <button onClick={resetOverviewCopies} style={{ padding: '5px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', color: 'var(--color-text-primary)' }}>Reset</button>
                </div>
              </div>

              <div className="card">
                <div style={{ fontWeight: 500, marginBottom: '6px', color: 'var(--color-text-primary)' }}>2) Auto‑expanding storage (mini sim)</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Aurora storage grows automatically as you store more data (in chunks). Slide “Used” to see it expand.</div>

                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px', marginBottom: '5px', alignItems: 'baseline' }}>
                    <span style={{ minWidth: '80px', color: 'var(--color-text-secondary)' }}>Used</span>
                    <b>{overviewUsed} GB</b>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="120"
                    value={overviewUsed}
                    onChange={(e) => handleOverviewUsedChange(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#7c3aed', cursor: 'pointer' }}
                  />
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px', margin: '5px 0', alignItems: 'baseline' }}>
                    <span style={{ minWidth: '80px', color: 'var(--color-text-secondary)' }}>Allocated</span>
                    <b>{overviewAllocated} GB</b>
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>(grows in 10 GB steps)</span>
                  </div>
                  <div style={{ height: '10px', borderRadius: '999px', border: '0.5px solid var(--color-border-tertiary)', overflow: 'hidden', background: 'var(--color-background-secondary)' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, Math.round((overviewUsed / overviewAllocated) * 100))}%`, background: '#0ea5e9', borderRadius: '999px' }}></div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', fontSize: '12px', marginTop: '5px', alignItems: 'baseline' }}>
                    <span style={{ minWidth: '80px', color: 'var(--color-text-secondary)' }}>Status</span>
                    <b style={{ color: overviewExpandColor }}>{overviewExpandStatus}</b>
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <button
                  onClick={() => alert("Copied prompt: 'Explain Aurora quorum (4/6 writes, 3/6 reads) and what failures it can tolerate, with examples ↗'")}
                  style={{ background: 'transparent', border: 'none', color: '#7c3aed', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
                >
                  Drill into quorum math ↗
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Storage Engine */}
      {activeTab === 'storage' && (
        <div>
          <div className="sec">How Aurora Storage Works — The Key Differentiator</div>
          <svg width="100%" viewBox="0 0 660 340" style={{ display: 'block', marginBottom: '12px' }}>
            <defs>
              <marker id="a1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                <path d="M0,0 L0,6 L7,3 z" fill="#7c3aed" />
              </marker>
            </defs>

            {/* Compute Layer */}
            <rect x="10" y="10" width="640" height="80" rx="10" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5" />
            <text x="330" y="28" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">COMPUTE LAYER (Instances)</text>
            
            <rect x="30" y="36" width="170" height="44" rx="7" fill="#ede9fe" stroke="#a78bfa" strokeWidth="0.5" />
            <text x="115" y="54" textAnchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">✍️ Writer Instance</text>
            <text x="115" y="70" textAnchor="middle" fontSize="11" fill="#6d28d9">Reads + Writes</text>
            
            <rect x="230" y="36" width="140" height="44" rx="7" fill="#ede9fe" stroke="#a78bfa" strokeWidth="0.5" />
            <text x="300" y="54" textAnchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">📖 Replica 1</text>
            <text x="300" y="70" textAnchor="middle" fontSize="11" fill="#6d28d9">Reads only</text>
            
            <rect x="390" y="36" width="140" height="44" rx="7" fill="#ede9fe" stroke="#a78bfa" strokeWidth="0.5" />
            <text x="460" y="54" textAnchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">📖 Replica 2</text>
            <text x="460" y="70" textAnchor="middle" fontSize="11" fill="#6d28d9">Reads only</text>

            <text x="330" y="108" textAnchor="middle" fontSize="11" fill="#7c3aed">Redo log only (no full page writes)</text>
            <line x1="115" y1="80" x2="115" y2="118" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#a1)" />
            <line x1="300" y1="80" x2="300" y2="118" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#a1)" />
            <line x1="460" y1="80" x2="460" y2="118" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#a1)" />

            {/* Storage Layer */}
            <rect x="10" y="118" width="640" height="200" rx="10" fill="#f0fdf4" stroke="#86efac" strokeWidth="0.5" />
            <text x="330" y="136" textAnchor="middle" fontSize="11" fill="#15803d" fontWeight="500">SHARED DISTRIBUTED STORAGE LAYER (Auto-scales to 128 TB)</text>

            {/* AZ-1 */}
            <rect x="25" y="145" width="90" height="160" rx="8" fill="#dcfce7" stroke="#4ade80" stroke-width="0.5" />
            <text x="70" y="163" textAnchor="middle" fontSize="11" fill="#15803d" fontWeight="500">AZ-1</text>
            <rect x="33" y="170" width="74" height="30" rx="5" fill="#bbf7d0" stroke="#4ade80" strokeWidth="0.5" />
            <text x="70" y="189" textAnchor="middle" fontSize="11" fill="#166534">Copy 1</text>
            <rect x="33" y="208" width="74" height="30" rx="5" fill="#bbf7d0" stroke="#4ade80" strokeWidth="0.5" />
            <text x="70" y="227" textAnchor="middle" fontSize="11" fill="#166534">Copy 2</text>
            <text x="70" y="295" textAnchor="middle" fontSize="10" fill="#166534">2 copies</text>

            {/* AZ-2 */}
            <rect x="135" y="145" width="90" height="160" rx="8" fill="#dcfce7" stroke="#4ade80" stroke-width="0.5" />
            <text x="180" y="163" textAnchor="middle" fontSize="11" fill="#15803d" fontWeight="500">AZ-2</text>
            <rect x="143" y="170" width="74" height="30" rx="5" fill="#bbf7d0" stroke="#4ade80" strokeWidth="0.5" />
            <text x="180" y="189" textAnchor="middle" fontSize="11" fill="#166534">Copy 3</text>
            <rect x="143" y="208" width="74" height="30" rx="5" fill="#bbf7d0" stroke="#4ade80" strokeWidth="0.5" />
            <text x="180" y="227" textAnchor="middle" fontSize="11" fill="#166534">Copy 4</text>
            <text x="180" y="295" textAnchor="middle" fontSize="10" fill="#166534">2 copies</text>

            {/* AZ-3 */}
            <rect x="245" y="145" width="90" height="160" rx="8" fill="#dcfce7" stroke="#4ade80" stroke-width="0.5" />
            <text x="290" y="163" textAnchor="middle" fontSize="11" fill="#15803d" fontWeight="500">AZ-3</text>
            <rect x="253" y="170" width="74" height="30" rx="5" fill="#bbf7d0" stroke="#4ade80" strokeWidth="0.5" />
            <text x="290" y="189" textAnchor="middle" fontSize="11" fill="#166534">Copy 5</text>
            <rect x="253" y="208" width="74" height="30" rx="5" fill="#bbf7d0" stroke="#4ade80" strokeWidth="0.5" />
            <text x="290" y="227" textAnchor="middle" fontSize="11" fill="#166534">Copy 6</text>
            <text x="290" y="295" textAnchor="middle" fontSize="10" fill="#166534">2 copies</text>

            {/* Quorum Rules Info */}
            <rect x="370" y="148" width="270" height="150" rx="8" fill="#f0fdf4" stroke="#86efac" strokeWidth="0.5" />
            <text x="505" y="166" textAnchor="middle" fontSize="11" fill="#15803d" fontWeight="500">Quorum Rules</text>
            <text x="385" y="185" fontSize="11" fill="#166534">Write quorum: 4 of 6 copies must ACK</text>
            <text x="385" y="202" fontSize="11" fill="#166534">Read quorum: 3 of 6 copies</text>
            <text x="385" y="219" fontSize="11" fill="#166534">Tolerates: 1 AZ failure + 1 node failure</text>
            <text x="385" y="236" fontSize="11" fill="#166534">No data loss on AZ failure</text>
            <text x="385" y="253" fontSize="11" fill="#166534">Storage auto-grows in 10 GB increments</text>
            <text x="385" y="270" fontSize="11" fill="#166534">Max: 128 TB per cluster</text>
            <text x="385" y="287" fontSize="11" fill="#166534">Replicas share same storage (no lag!)</text>
          </svg>

          <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '9px 12px', fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px' }}>
            💡 <b style={{ color: 'var(--color-text-primary)' }}>Key insight:</b> Aurora replicas have <b>near-zero replication lag</b> because they read from the same shared storage — no data copying between instances. Only redo logs are sent.
          </div>

          {/* Interactive self-healing storage simulation */}
          <div className="card" style={{ borderTop: '2px solid #16a34a' }}>
            <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '6px', color: 'var(--color-text-primary)' }}>
              🛠️ Self‑Healing Storage Simulator
            </div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
              Simulate physical drive failures and observe how Aurora maintains quorum read/write stability and automatically repairs itself back to 6 copies.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {copies.map((active, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: 'center',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    border: '0.5px solid var(--color-border-tertiary)',
                    background: active ? '#f0fdf4' : '#fef2f2',
                    color: active ? '#15803d' : '#b91c1c'
                  }}
                >
                  {active ? `Copy ${i + 1} ✅` : `Copy ${i + 1} ❌`}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
              <div style={{ background: 'var(--color-background-secondary)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)' }}>Write Quorum (Needs 4/6)</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: healthyCopiesCount >= 4 ? '#15803d' : '#dc2626', marginTop: '3px' }}>
                  {healthyCopiesCount >= 4 ? `✅ Active (${healthyCopiesCount}/6)` : `⚠️ Out of Quorum (${healthyCopiesCount}/6)`}
                </div>
              </div>
              <div style={{ background: 'var(--color-background-secondary)', padding: '8px', borderRadius: '6px', textAlign: 'center' }}>
                <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)' }}>Read Quorum (Needs 3/6)</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: healthyCopiesCount >= 3 ? '#15803d' : '#dc2626', marginTop: '3px' }}>
                  {healthyCopiesCount >= 3 ? `✅ Active (${healthyCopiesCount}/6)` : `⚠️ Out of Quorum (${healthyCopiesCount}/6)`}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono, monospace)', minHeight: '38px', marginBottom: '10px' }}>
              {storageLog}
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={failOneCopy}
                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', background: '#fee2e2', border: '0.5px solid #fca5a5', color: '#b91c1c' }}
              >
                💥 Fail 1 disk copy
              </button>
              <button
                onClick={selfHealStorage}
                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', background: '#dcfce7', border: '0.5px solid #86efac', color: '#15803d' }}
              >
                🔄 Self‑heal storage rebuild
              </button>
              <button
                onClick={resetStorageCopies}
                style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', color: 'var(--color-text-primary)' }}
              >
                🔄 Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cluster Architecture */}
      {activeTab === 'cluster' && (
        <div>
          <div className="sec">Complete Cluster Endpoint & Routing Map</div>
          <svg width="100%" viewBox="0 0 660 420" style={{ display: 'block', marginBottom: '12px' }}>
            <defs>
              <marker id="ca1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#7c3aed"/></marker>
              <marker id="ca2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#3b82f6"/></marker>
              <marker id="ca3" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#16a34a"/></marker>
            </defs>

            {/* Client Layer */}
            <rect x="10" y="10" width="640" height="60" rx="8" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.5"/>
            <text x="330" y="28" textAnchor="middle" fontSize="11" fill="#1d4ed8" fontWeight="500">CLIENT LAYER</text>
            <rect x="30" y="34" width="130" height="28" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
            <text x="95" y="52" textAnchor="middle" fontSize="11" fill="#1d4ed8">🌐 Web App / API</text>
            <rect x="180" y="34" width="130" height="28" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
            <text x="245" y="52" textAnchor="middle" fontSize="11" fill="#1d4ed8">⚡ Lambda</text>
            <rect x="330" y="34" width="130" height="28" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
            <text x="395" y="52" textAnchor="middle" fontSize="11" fill="#1d4ed8">📊 Analytics</text>
            <rect x="480" y="34" width="160" height="28" rx="6" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
            <text x="560" y="52" textAnchor="middle" fontSize="11" fill="#1d4ed8">🔄 RDS Proxy</text>

            {/* Endpoints */}
            <rect x="10" y="88" width="640" height="60" rx="8" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
            <text x="330" y="106" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">AURORA CLUSTER ENDPOINTS</text>
            <rect x="30" y="112" width="180" height="28" rx="6" fill="#ede9fe" stroke="#a78bfa" strokeWidth="0.5"/>
            <text x="120" y="130" textAnchor="middle" fontSize="11" fill="#7c3aed">✍️ Cluster (Writer) Endpoint</text>
            <rect x="230" y="112" width="180" height="28" rx="6" fill="#ede9fe" stroke="#a78bfa" strokeWidth="0.5"/>
            <text x="320" y="130" textAnchor="middle" fontSize="11" fill="#7c3aed">📖 Reader Endpoint (LB)</text>
            <rect x="430" y="112" width="200" height="28" rx="6" fill="#ede9fe" stroke="#a78bfa" strokeWidth="0.5"/>
            <text x="530" y="130" textAnchor="middle" fontSize="11" fill="#7c3aed">🎯 Custom Endpoints</text>

            {/* Instances */}
            <rect x="10" y="166" width="640" height="100" rx="8" fill="#f0fdf4" stroke="#86efac" strokeWidth="0.5"/>
            <text x="330" y="184" textAnchor="middle" fontSize="11" fill="#15803d" fontWeight="500">AURORA CLUSTER INSTANCES</text>
            <rect x="30" y="192" width="180" height="64" rx="7" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
            <text x="120" y="212" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="500">✍️ Writer (Primary)</text>
            <text x="120" y="228" textAnchor="middle" fontSize="11" fill="#166534">db.r6g.2xlarge</text>
            <text x="120" y="244" textAnchor="middle" fontSize="11" fill="#166534">Reads + Writes</text>
            
            <rect x="230" y="192" width="140" height="64" rx="7" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
            <text x="300" y="212" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="500">📖 Replica 1</text>
            <text x="300" y="228" textAnchor="middle" fontSize="11" fill="#166534">db.r6g.xlarge</text>
            <text x="300" y="244" textAnchor="middle" fontSize="11" fill="#166534">Reads only</text>
            
            <rect x="385" y="192" width="140" height="64" rx="7" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
            <text x="455" y="212" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="500">📖 Replica 2</text>
            <text x="455" y="228" textAnchor="middle" fontSize="11" fill="#166534">db.r6g.xlarge</text>
            <text x="455" y="244" textAnchor="middle" fontSize="11" fill="#166534">Reads only</text>
            
            <rect x="540" y="192" width="100" height="64" rx="7" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
            <text x="590" y="212" textAnchor="middle" fontSize="11" fill="#92400e" fontWeight="500">+ up to</text>
            <text x="590" y="228" textAnchor="middle" fontSize="12" fill="#92400e" fontWeight="500">15 total</text>
            <text x="590" y="244" textAnchor="middle" fontSize="11" fill="#92400e">replicas</text>

            {/* Storage */}
            <rect x="10" y="280" width="640" height="60" rx="8" fill="#f0fdf4" stroke="#86efac" strokeWidth="0.5"/>
            <text x="330" y="298" textAnchor="middle" fontSize="11" fill="#15803d" fontWeight="500">SHARED DISTRIBUTED STORAGE (6 copies across 3 AZs)</text>
            <rect x="30" y="306" width="180" height="26" rx="5" fill="#bbf7d0" stroke="#4ade80" strokeWidth="0.5"/>
            <text x="120" y="323" textAnchor="middle" fontSize="11" fill="#166534">AZ-1: Copy 1 + Copy 2</text>
            <rect x="240" y="306" width="180" height="26" rx="5" fill="#bbf7d0" stroke="#4ade80" strokeWidth="0.5"/>
            <text x="330" y="323" textAnchor="middle" fontSize="11" fill="#166534">AZ-2: Copy 3 + Copy 4</text>
            <rect x="450" y="306" width="180" height="26" rx="5" fill="#bbf7d0" stroke="#4ade80" strokeWidth="0.5"/>
            <text x="540" y="323" textAnchor="middle" fontSize="11" fill="#166534">AZ-3: Copy 5 + Copy 6</text>

            {/* Supporting Services */}
            <rect x="10" y="356" width="640" height="54" rx="8" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5"/>
            <text x="330" y="374" textAnchor="middle" fontSize="11" fill="#c2410c" fontWeight="500">SUPPORTING SERVICES</text>
            <rect x="30" y="382" width="120" height="22" rx="5" fill="#ffedd5" stroke="#fb923c" strokeWidth="0.5"/>
            <text x="90" y="397" textAnchor="middle" fontSize="11" fill="#c2410c">🔑 Secrets Mgr</text>
            <rect x="165" y="382" width="120" height="22" rx="5" fill="#ffedd5" stroke="#fb923c" stroke-width="0.5"/>
            <text x="225" y="397" textAnchor="middle" fontSize="11" fill="#c2410c">📊 CloudWatch</text>
            <rect x="300" y="382" width="120" height="22" rx="5" fill="#ffedd5" stroke="#fb923c" stroke-width="0.5"/>
            <text x="360" y="397" textAnchor="middle" fontSize="11" fill="#c2410c">🔒 KMS</text>
            <rect x="435" y="382" width="120" height="22" rx="5" fill="#ffedd5" stroke="#fb923c" stroke-width="0.5"/>
            <text x="495" y="397" textAnchor="middle" fontSize="11" fill="#c2410c">🛡️ IAM Auth</text>
            <rect x="570" y="382" width="80" height="22" rx="5" fill="#ffedd5" stroke="#fb923c" stroke-width="0.5"/>
            <text x="610" y="397" textAnchor="middle" fontSize="11" fill="#c2410c">📈 PI</text>

            {/* Connecting lines */}
            <line x1="95" y1="70" x2="95" y2="88" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#ca1)"/>
            <line x1="245" y1="70" x2="245" y2="88" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#ca1)"/>
            <line x1="395" y1="70" x2="320" y2="88" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#ca1)"/>
            <line x1="560" y1="62" x2="530" y2="88" stroke="#3b82f6" strokeWidth="1" markerEnd="url(#ca2)"/>
            <line x1="120" y1="140" x2="120" y2="166" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#ca1)"/>
            <line x1="320" y1="140" x2="300" y2="166" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#ca1)"/>
            <line x1="320" y1="140" x2="455" y2="166" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#ca1)"/>
            <line x1="120" y1="256" x2="120" y2="280" stroke="#16a34a" strokeWidth="1" markerEnd="url(#ca3)"/>
            <line x1="300" y1="256" x2="300" y2="280" stroke="#16a34a" strokeWidth="1" markerEnd="url(#ca3)"/>
            <line x1="455" y1="256" x2="455" y2="280" stroke="#16a34a" strokeWidth="1" markerEnd="url(#ca3)"/>
          </svg>
        </div>
      )}

      {/* Tab 3: Multi-AZ */}
      {activeTab === 'multiaz' && (
        <div>
          <div className="sec">Aurora Multi-AZ — How Instances Spread Across AZs</div>
          <svg width="100%" viewBox="0 0 660 280" style={{ display: 'block', marginBottom: '12px' }}>
            {/* AZ-1 */}
            <rect x="10" y="10" width="200" height="260" rx="10" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
            <text x="110" y="30" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">AZ-1 (us-east-1a)</text>
            <rect x="25" y="40" width="170" height="50" rx="7" fill="#ede9fe" stroke="#a78bfa" strokeWidth="1.5"/>
            <text x="110" y="60" textAnchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">✍️ Writer</text>
            <text x="110" y="76" textAnchor="middle" fontSize="11" fill="#6d28d9">PRIMARY</text>
            <rect x="25" y="100" width="170" height="40" rx="7" fill="#ede9fe" stroke="#a78bfa" strokeWidth="0.5"/>
            <text x="110" y="124" textAnchor="middle" fontSize="11" fill="#7c3aed">📖 Replica (optional)</text>
            <rect x="25" y="150" width="170" height="50" rx="7" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
            <text x="110" y="170" textAnchor="middle" fontSize="11" fill="#15803d" fontWeight="500">Storage: Copy 1</text>
            <text x="110" y="186" textAnchor="middle" fontSize="11" fill="#166534">+ Copy 2</text>
            <text x="110" y="255" textAnchor="middle" fontSize="10" fill="#7c3aed">Subnet: private-db-1a</text>

            {/* AZ-2 */}
            <rect x="230" y="10" width="200" height="260" rx="10" fill="#f0fdf4" stroke="#86efac" strokeWidth="0.5"/>
            <text x="330" y="30" textAnchor="middle" fontSize="11" fill="#15803d" fontWeight="500">AZ-2 (us-east-1b)</text>
            <rect x="245" y="40" width="170" height="50" rx="7" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
            <text x="330" y="60" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="500">📖 Replica 1</text>
            <text x="330" y="76" textAnchor="middle" fontSize="11" fill="#166534">Failover priority: 1</text>
            <rect x="245" y="100" width="170" height="40" rx="7" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
            <text x="330" y="124" textAnchor="middle" fontSize="11" fill="#15803d">📖 Replica 2 (optional)</text>
            <rect x="245" y="150" width="170" height="50" rx="7" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
            <text x="330" y="170" textAnchor="middle" fontSize="11" fill="#15803d" fontWeight="500">Storage: Copy 3</text>
            <text x="330" y="186" textAnchor="middle" fontSize="11" fill="#166534">+ Copy 4</text>
            <text x="330" y="255" textAnchor="middle" fontSize="10" fill="#15803d">Subnet: private-db-1b</text>

            {/* AZ-3 */}
            <rect x="450" y="10" width="200" height="260" rx="10" fill="#fffbeb" stroke="#fde68a" strokeWidth="0.5"/>
            <text x="550" y="30" textAnchor="middle" fontSize="11" fill="#92400e" fontWeight="500">AZ-3 (us-east-1c)</text>
            <rect x="465" y="40" width="170" height="50" rx="7" fill="#fef3c7" stroke="#fbbf24" strokeWidth="0.5"/>
            <text x="550" y="60" textAnchor="middle" fontSize="12" fill="#92400e" fontWeight="500">📖 Replica 3</text>
            <text x="550" y="76" textAnchor="middle" fontSize="11" fill="#78350f">Failover priority: 2</text>
            <rect x="465" y="100" width="170" height="40" rx="7" fill="#fef3c7" stroke="#fbbf24" strokeWidth="0.5"/>
            <text x="550" y="124" textAnchor="middle" fontSize="11" fill="#92400e">📖 Replica 4 (optional)</text>
            <rect x="465" y="150" width="170" height="50" rx="7" fill="#fef3c7" stroke="#fbbf24" strokeWidth="0.5"/>
            <text x="550" y="170" textAnchor="middle" fontSize="11" fill="#92400e" fontWeight="500">Storage: Copy 5</text>
            <text x="550" y="186" textAnchor="middle" fontSize="11" fill="#78350f">+ Copy 6</text>
            <text x="550" y="255" textAnchor="middle" fontSize="10" fill="#92400e">Subnet: private-db-1c</text>
          </svg>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
            <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '9px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 500, color: '#7c3aed' }}>&lt; 30s</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Failover time</div>
            </div>
            <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '9px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 500, color: '#15803d' }}>6</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Storage copies</div>
            </div>
            <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '9px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', fontWeight: 500, color: '#1d4ed8' }}>15</div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Max replicas</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Global DB */}
      {activeTab === 'global' && (
        <div>
          <div className="sec">Aurora Global Database — Cross-Region DR &amp; Low-Latency Reads</div>
          <svg width="100%" viewBox="0 0 660 300" style={{ display: 'block', marginBottom: '12px' }}>
            <defs>
              <marker id="ga1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#7c3aed"/></marker>
            </defs>

            {/* Primary Region */}
            <rect x="10" y="10" width="290" height="270" rx="12" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="1"/>
            <text x="155" y="30" textAnchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">🌎 PRIMARY REGION</text>
            <text x="155" y="46" textAnchor="middle" fontSize="11" fill="#6d28d9">us-east-1</text>
            
            <rect x="25" y="56" width="260" height="50" rx="7" fill="#ede9fe" stroke="#a78bfa" strokeWidth="0.5"/>
            <text x="155" y="76" textAnchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">✍️ Writer Cluster</text>
            <text x="155" y="92" textAnchor="middle" fontSize="11" fill="#6d28d9">All writes go here</text>
            
            <rect x="25" y="116" width="120" height="40" rx="6" fill="#ede9fe" stroke="#a78bfa" strokeWidth="0.5"/>
            <text x="85" y="140" textAnchor="middle" fontSize="11" fill="#7c3aed">📖 Replica 1</text>
            <rect x="155" y="116" width="130" height="40" rx="6" fill="#ede9fe" stroke="#a78bfa" strokeWidth="0.5"/>
            <text x="220" y="140" textAnchor="middle" fontSize="11" fill="#7c3aed">📖 Replica 2</text>
            
            <rect x="25" y="166" width="260" height="40" rx="6" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
            <text x="155" y="190" textAnchor="middle" fontSize="11" fill="#15803d" fontWeight="500">Shared Storage (6 copies, 3 AZs)</text>
            
            <rect x="25" y="216" width="260" height="50" rx="6" fill="#fef3c7" stroke="#fbbf24" strokeWidth="0.5"/>
            <text x="155" y="236" textAnchor="middle" fontSize="11" fill="#92400e" fontWeight="500">Global Replication Engine</text>
            <text x="155" y="252" textAnchor="middle" fontSize="11" fill="#78350f">Dedicated infra — not app network</text>
            <text x="155" y="268" textAnchor="middle" fontSize="11" fill="#78350f">~1s replication lag</text>

            {/* Secondary Region */}
            <rect x="360" y="10" width="290" height="270" rx="12" fill="#f0fdf4" stroke="#86efac" strokeWidth="1"/>
            <text x="505" y="30" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="500">🌏 SECONDARY REGION</text>
            <text x="505" y="46" textAnchor="middle" fontSize="11" fill="#166534">ap-southeast-1 (Singapore)</text>
            
            <rect x="375" y="56" width="260" height="50" rx="7" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
            <text x="505" y="76" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="500">📖 Read-Only Cluster</text>
            <text x="505" y="92" textAnchor="middle" fontSize="11" fill="#166534">Promoted to writer on DR</text>
            
            <rect x="375" y="116" width="120" height="40" rx="6" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
            <text x="435" y="140" textAnchor="middle" fontSize="11" fill="#15803d">📖 Replica 1</text>
            <rect x="505" y="116" width="130" height="40" rx="6" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
            <text x="570" y="140" textAnchor="middle" fontSize="11" fill="#15803d">📖 Replica 2</text>
            
            <rect x="375" y="166" width="260" height="40" rx="6" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
            <text x="505" y="190" textAnchor="middle" fontSize="11" fill="#15803d" fontWeight="500">Shared Storage (6 copies, 3 AZs)</text>
            
            <rect x="375" y="216" width="260" height="50" rx="6" fill="#fef3c7" stroke="#fbbf24" stroke-width="0.5"/>
            <text x="505" y="236" textAnchor="middle" fontSize="11" fill="#92400e" fontWeight="500">RPO: &lt; 1 second</text>
            <text x="505" y="252" textAnchor="middle" fontSize="11" fill="#78350f">RTO: &lt; 1 minute (managed failover)</text>
            <text x="505" y="268" textAnchor="middle" fontSize="11" fill="#78350f">Up to 5 secondary regions</text>

            {/* Replication flow line */}
            <path d="M 300 240 L 360 240" fill="none" stroke="#7c3aed" strokeWidth="2" markerEnd="url(#ga1)" strokeDasharray="5,3"/>
            <text x="330" y="232" textAnchor="middle" fontSize="10" fill="#7c3aed">~1s lag</text>
          </svg>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
            <div className="card">
              <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#7c3aed' }}>Use Cases</div>
              <ul className="checklist">
                <li>Disaster recovery (RPO &lt; 1s, RTO &lt; 1min)</li>
                <li>Low-latency reads for global users</li>
                <li>Compliance (data residency per region)</li>
                <li>Business continuity across regions</li>
              </ul>
            </div>
            <div className="card">
              <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#15803d' }}>Key Numbers</div>
              <div className="kv"><span className="kk">Max secondary regions</span><b>5</b></div>
              <div className="kv"><span className="kk">Replication lag</span><b>&lt; 1 second</b></div>
              <div className="kv"><span className="kk">RPO</span><b>&lt; 1 second</b></div>
              <div className="kv"><span className="kk">RTO (managed)</span><b>&lt; 1 minute</b></div>
              <div className="kv"><span className="kk">Engines</span><b>Aurora MySQL + Aurora PG</b></div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Serverless v2 */}
      {activeTab === 'serverless' && (
        <div>
          <div className="sec">Aurora Serverless v2 — Auto-Scaling Compute</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '12px' }}>
            <div className="card">
              <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '8px', color: '#7c3aed' }}>How It Works</div>
              <div className="kv"><span className="kk">Scaling unit</span><b>ACU (Aurora Capacity Unit)</b></div>
              <div className="kv"><span className="kk">1 ACU =</span><b>2 GB RAM + proportional CPU</b></div>
              <div className="kv"><span className="kk">Min ACU</span><b>0.5 ACU (near-zero cost at idle)</b></div>
              <div className="kv"><span className="kk">Max ACU</span><b>256 ACU per instance</b></div>
              <div className="kv"><span className="kk">Scale speed</span><b>Seconds (not minutes)</b></div>
              <div className="kv"><span className="kk">Scale trigger</span><b>CPU, connections, memory</b></div>
              <div className="kv"><span className="kk">Billing</span><b>Per ACU-hour (fine-grained)</b></div>
            </div>
            <div className="card">
              <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '8px', color: '#15803d' }}>v2 vs v1</div>
              <div className="kv"><span className="kk">Scale to zero</span><b>v1 only (v2 min 0.5 ACU)</b></div>
              <div className="kv"><span className="kk">Scale speed</span><b>v2: seconds | v1: minutes</b></div>
              <div className="kv"><span className="kk">Multi-AZ</span><b>v2: ✅ | v1: ❌</b></div>
              <div className="kv"><span className="kk">Read replicas</span><b>v2: ✅ | v1: ❌</b></div>
              <div className="kv"><span className="kk">RDS Proxy</span><b>v2: ✅ | v1: ❌</b></div>
              <div className="kv"><span className="kk">Global DB</span><b>v2: ✅ | v1: ❌</b></div>
              <div className="kv"><span className="kk">Recommendation</span><b style={{ color: '#7c3aed' }}>Always use v2</b></div>
            </div>
          </div>

          <div className="sec">ACU Scaling Simulation</div>
          <div className="card">
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>
                Simulate workload volume (connections): <b>{connections}</b>
              </label>
              <input
                type="range"
                min="0"
                max="500"
                value={connections}
                onChange={e => setConnections(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#7c3aed', cursor: 'pointer' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '8px' }}>
              <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '9px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 500, color: '#7c3aed' }}>{acu}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>ACUs</div>
              </div>
              <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '9px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 500, color: '#15803d' }}>{ram}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>RAM Size</div>
              </div>
              <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '9px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 500, color: '#1d4ed8' }}>${cost}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>$/hour</div>
              </div>
              <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '9px', textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: scaleColor, marginTop: '8px' }}>{scaleStatus}</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Scale status</div>
              </div>
            </div>

            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              💡 <b>Note:</b> Scaling occurs dynamically in response to active memory & CPU demands. RAM increments smoothly to avoid cold start latency.
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Endpoints */}
      {activeTab === 'endpoints' && (
        <div>
          <div className="sec">Aurora Endpoint Types</div>
          <div className="card" style={{ borderLeft: '4px solid #7c3aed', paddingLeft: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '16px' }}>✍️</span>
              <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>Cluster Endpoint (Writer)</span>
              <span className="badge b-purple">Always use for writes</span>
            </div>
            <div className="kv"><span className="kk">DNS format</span><b style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px' }}>cluster-id.cluster-xyz.region.rds.amazonaws.com</b></div>
            <div className="kv"><span className="kk">Routes to</span><b>Current primary writer instance</b></div>
            <div className="kv"><span className="kk">On failover</span><b>DNS updates automatically to new writer (&lt; 30s)</b></div>
            <div className="kv"><span className="kk">Use case</span><b>All INSERT/UPDATE/DELETE operations, transactional queries, DDL</b></div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #15803d', paddingLeft: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '16px' }}>📖</span>
              <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>Reader Endpoint</span>
              <span className="badge b-green">Load-balanced reads</span>
            </div>
            <div className="kv"><span className="kk">DNS format</span><b style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px' }}>cluster-id.cluster-ro-xyz.region.rds.amazonaws.com</b></div>
            <div className="kv"><span className="kk">Routes to</span><b>Round-robin across all available replicas</b></div>
            <div className="kv"><span className="kk">On replica failure</span><b>Automatically removed from endpoint DNS pool</b></div>
            <div className="kv"><span className="kk">Use case</span><b>Read-only SELECT traffic, reports, analytical queries</b></div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #1d4ed8', paddingLeft: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '16px' }}>🎯</span>
              <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>Custom Endpoints</span>
              <span className="badge b-blue">Subset routing</span>
            </div>
            <div className="kv"><span className="kk">Routes to</span><b>A specific subset of instances you define</b></div>
            <div className="kv"><span className="kk">Use case</span><b>Route high-intensity analytics to big instances, OLTP to smaller ones</b></div>
            <div className="kv"><span className="kk">Example</span><b>analytics.cluster-xyz → db.r6g.4xlarge replicas only</b></div>
          </div>

          <div className="card" style={{ borderLeft: '4px solid #d97706', paddingLeft: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '16px' }}>🔌</span>
              <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)' }}>Instance Endpoints</span>
              <span className="badge b-orange">Direct access</span>
            </div>
            <div className="kv"><span className="kk">Routes to</span><b>One specific designated instance (writer or replica)</b></div>
            <div className="kv"><span className="kk">Use case</span><b>Troubleshooting, specific instance diagnostics, performance testing</b></div>
            <div className="kv"><span className="kk">Warning</span><b style={{ color: '#dc2626' }}>Do not use in production application code — bypasses failover!</b></div>
          </div>
        </div>
      )}

      {/* Tab 7: Failover Sim */}
      {activeTab === 'failover' && (
        <div>
          <div className="sec">Aurora Failover Playbook Simulation</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginBottom: '14px' }}>
            {/* Writer */}
            <div className={`sim-node ${simState.writerFailed ? 'failed' : (simState.promoted ? 'failed' : 'healthy')}`}>
              <div style={{ fontSize: '18px' }}>✍️</div>
              <div style={{ fontWeight: 600, fontSize: '12px', margin: '2px 0' }}>Writer (Primary)</div>
              <div style={{ fontSize: '11px', color: simState.writerFailed ? '#dc2626' : '#15803d', fontWeight: 'bold' }}>
                {simState.writerFailed ? '● FAILED' : '● HEALTHY'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                AZ-1 · Priority: 0
              </div>
            </div>

            {/* Replica 1 */}
            <div className={`sim-node ${simState.promoted ? 'promoted' : 'healthy'}`}>
              <div style={{ fontSize: '18px' }}>{simState.promoted ? '✍️' : '📖'}</div>
              <div style={{ fontWeight: 600, fontSize: '12px', margin: '2px 0' }}>
                {simState.promoted ? 'NEW Writer' : 'Replica 1'}
              </div>
              <div style={{ fontSize: '11px', color: simState.promoted ? '#7c3aed' : '#15803d', fontWeight: 'bold' }}>
                {simState.promoted ? '● PROMOTED' : '● HEALTHY'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                AZ-2 · Priority: 1
              </div>
            </div>

            {/* Replica 2 */}
            <div className={`sim-node ${simState.r2Failed ? 'failed' : 'healthy'}`}>
              <div style={{ fontSize: '18px' }}>📖</div>
              <div style={{ fontWeight: 600, fontSize: '12px', margin: '2px 0' }}>Replica 2</div>
              <div style={{ fontSize: '11px', color: simState.r2Failed ? '#dc2626' : '#15803d', fontWeight: 'bold' }}>
                {simState.r2Failed ? '● FAILED' : '● HEALTHY'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                AZ-3 · Priority: 2
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={triggerFailover}
              style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', background: '#fee2e2', border: '0.5px solid #fca5a5', color: '#b91c1c' }}
            >
              💥 Fail Writer (AZ-1 down)
            </button>
            <button
              onClick={triggerReplicaFail}
              style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', background: '#fff7ed', border: '0.5px solid #fed7aa', color: '#c2410c' }}
            >
              ⚠️ Fail Replica 2
            </button>
            <button
              onClick={resetSim}
              style={{ padding: '6px 14px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-secondary)', color: 'var(--color-text-primary)' }}
            >
              🔄 Reset playbook
            </button>
          </div>

          <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', padding: '10px', minHeight: '140px', background: 'var(--color-background-secondary)', marginBottom: '10px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>EVENT PLAYBOOK LOG</div>
            <div>
              {logLines.map((log, index) => (
                <div key={index} className={`log-line ${log.type}`}>
                  {log.msg}
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'var(--color-background-secondary)', borderRadius: '8px', padding: '9px 12px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            <b style={{ color: 'var(--color-text-primary)' }}>Failover priority:</b> Aurora promotes the replica with the highest priority tier (lowest number). Replicas in the same tier are chosen by size (largest first). RDS Proxy reduces app-visible downtime to ~5s.
          </div>
        </div>
      )}

      {/* Tab 8: Integrations */}
      {activeTab === 'integrations' && (
        <div>
          <div className="sec">Aurora Integration Ecosystem</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '9px' }}>
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '7px', color: '#7c3aed' }}>🔄 RDS Proxy</div>
              <ul className="checklist">
                <li>Connection pooling for Lambda/ECS</li>
                <li>Faster failover (~5s vs 30s)</li>
                <li>IAM auth + Secrets Manager integration</li>
                <li>Supports Aurora MySQL + PostgreSQL</li>
              </ul>
            </div>
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '7px', color: '#1d4ed8' }}>🔑 Secrets Manager</div>
              <ul className="checklist">
                <li>Auto-rotates DB credentials</li>
                <li>Eliminates hardcoded credentials</li>
                <li>IAM policies control database access</li>
                <li>Fully integrated with RDS Proxy</li>
              </ul>
            </div>
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '7px', color: '#15803d' }}>📊 CloudWatch + PI</div>
              <ul className="checklist">
                <li>Performance Insights (1-year metrics)</li>
                <li>Enhanced Monitoring (1s logs)</li>
                <li>Alarms on connections &amp; storage</li>
                <li>Slow query engine metric streams</li>
              </ul>
            </div>
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '7px', color: '#c2410c' }}>⚡ Lambda Integration</div>
              <ul className="checklist">
                <li>Aurora invokes Lambda triggers via SQL</li>
                <li>Lambda reads Aurora via RDS Proxy</li>
                <li>Combines Serverless v2 for full elastic app</li>
                <li>No persistence connection overheads</li>
              </ul>
            </div>
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '7px', color: '#0f766e' }}>🌊 Aurora Data API</div>
              <ul className="checklist">
                <li>Secure HTTPS endpoint execution</li>
                <li>No persistent socket required</li>
                <li>Perfect for AWS Lambda (no VPC constraints)</li>
                <li>Runs SQL over standard HTTPS JSON calls</li>
              </ul>
            </div>
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '7px', color: '#92400e' }}>🤖 ML Integrations</div>
              <ul className="checklist">
                <li>SQL SageMaker model invocation</li>
                <li>SQL Comprehend text sentiment queries</li>
                <li>Zero-ETL in-database ML inference</li>
                <li>High speed analytical classification</li>
              </ul>
            </div>
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '7px', color: '#1d4ed8' }}>🔒 Security</div>
              <ul className="checklist">
                <li>KMS AES-256 storage encryption</li>
                <li>TLS transit transport encryption</li>
                <li>IAM DB User access token credentials</li>
                <li>VPC isolate + security groups</li>
              </ul>
            </div>
            <div className="card">
              <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '7px', color: '#7c3aed' }}>📦 Zero-ETL (Redshift)</div>
              <ul className="checklist">
                <li>Real-time transactional sync to DW</li>
                <li>No complex engineering ETL required</li>
                <li>Syncs both MySQL &amp; PostgreSQL schemas</li>
                <li>Automated pipeline management</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 9: Features & Security */}
      {activeTab === 'features' && (
        <div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '17px', fontWeight: 500, color: 'var(--color-text-primary)' }}>🔐 Aurora — Backup · Restore · Cloning · Security · ML</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Click a topic tab to explore each area with diagrams and simulations</div>
          </div>

          <div className="tab-bar">
            <button className={`tab ${activeFeatureTab === 'backup' ? 'active' : ''}`} onClick={() => setActiveFeatureTab('backup')}>💾 Backup & Restore</button>
            <button className={`tab ${activeFeatureTab === 'clone' ? 'active' : ''}`} onClick={() => setActiveFeatureTab('clone')}>🧬 DB Cloning</button>
            <button className={`tab ${activeFeatureTab === 'security' ? 'active' : ''}`} onClick={() => setActiveFeatureTab('security')}>🔒 Security</button>
            <button className={`tab ${activeFeatureTab === 'ml' ? 'active' : ''}`} onClick={() => setActiveFeatureTab('ml')}>🤖 Machine Learning</button>
          </div>

          {activeFeatureTab === 'backup' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <svg width="100%" viewBox="0 0 340 390" style={{ display: 'block' }}>
                    <defs>
                      <marker id="ab" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#7c3aed"/></marker>
                      <marker id="ag" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#15803d"/></marker>
                      <marker id="ao" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#c2410c"/></marker>
                    </defs>
                    <rect x="10" y="10" width="320" height="56" rx="10" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="170" y="32" textAnchor="middle" fontSize="13" fill="#6d28d9" fontWeight="500">Aurora Cluster</text>
                    <text x="170" y="52" textAnchor="middle" fontSize="11" fill="#7c3aed">Writer + Replicas + Shared Storage</text>

                    <rect x="10" y="90" width="320" height="56" rx="10" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                    <text x="170" y="112" textAnchor="middle" fontSize="13" fill="#1d4ed8" fontWeight="500">🔄 Automated Backups</text>
                    <text x="170" y="130" textAnchor="middle" fontSize="11" fill="#1d4ed8">Continuous to S3 · 1–35 day retention · Free storage</text>

                    <rect x="10" y="170" width="320" height="56" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="170" y="192" textAnchor="middle" fontSize="13" fill="#15803d" fontWeight="500">📸 Manual Snapshots</text>
                    <text x="170" y="210" textAnchor="middle" fontSize="11" fill="#166534">User-triggered · Kept until deleted · Cross-region copy</text>

                    <rect x="10" y="250" width="148" height="56" rx="10" fill="#ffedd5" stroke="#fed7aa" strokeWidth="0.5"/>
                    <text x="84" y="272" textAnchor="middle" fontSize="12" fill="#c2410c" fontWeight="500">⏱ PITR</text>
                    <text x="84" y="290" textAnchor="middle" fontSize="11" fill="#c2410c">Restore to any second</text>

                    <rect x="182" y="250" width="148" height="56" rx="10" fill="#fef3c7" stroke="#fde68a" strokeWidth="0.5"/>
                    <text x="256" y="272" textAnchor="middle" fontSize="12" fill="#92400e" fontWeight="500">⏪ Backtrack</text>
                    <text x="256" y="290" textAnchor="middle" fontSize="11" fill="#92400e">Rewind in-place (no restore)</text>

                    <rect x="10" y="330" width="320" height="50" rx="10" fill="#ccfbf1" stroke="#5eead4" strokeWidth="0.5"/>
                    <text x="170" y="352" textAnchor="middle" fontSize="12" fill="#0f766e" fontWeight="500">☁️ AWS Backup (centralised policy)</text>
                    <text x="170" y="370" textAnchor="middle" fontSize="11" fill="#0f766e">Cross-account · Cross-region · Vault lock</text>

                    <line x1="170" y1="66" x2="170" y2="90" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#ab)"/>
                    <line x1="170" y1="146" x2="170" y2="170" stroke="#15803d" strokeWidth="1" markerEnd="url(#ag)"/>
                    <line x1="120" y1="226" x2="84" y2="250" stroke="#c2410c" strokeWidth="1" markerEnd="url(#ao)"/>
                    <line x1="220" y1="226" x2="256" y2="250" stroke="#c2410c" strokeWidth="1" markerEnd="url(#ao)"/>
                    <line x1="170" y1="306" x2="170" y2="330" stroke="#0f766e" strokeWidth="1" markerEnd="url(#ag)"/>
                  </svg>
                </div>
                <div>
                  <div className="sec">Backup types at a glance</div>
                  <div className="card" style={{ borderLeft: '3px solid #1d4ed8', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#1d4ed8' }}>🔄 Automated Backups</div>
                    <div className="kv"><span className="kk">Trigger</span><b>Automatic, continuous</b></div>
                    <div className="kv"><span className="kk">Retention</span><b>1–35 days (default 1)</b></div>
                    <div className="kv"><span className="kk">Storage cost</span><b>Free up to cluster size</b></div>
                    <div className="kv"><span className="kk">Restore type</span><b>New cluster (not in-place)</b></div>
                    <div className="kv"><span className="kk">Can delete?</span><b style={{ color: '#dc2626' }}>No (managed by AWS)</b></div>
                  </div>
                  <div className="card" style={{ borderLeft: '3px solid #15803d', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#15803d' }}>📸 Manual Snapshots</div>
                    <div className="kv"><span className="kk">Trigger</span><b>User / scheduled</b></div>
                    <div className="kv"><span className="kk">Retention</span><b>Forever (until you delete)</b></div>
                    <div className="kv"><span className="kk">Cross-region</span><b>✅ Copy to any region</b></div>
                    <div className="kv"><span className="kk">Cross-account</span><b>✅ Share snapshot</b></div>
                    <div className="kv"><span className="kk">Restore type</span><b>New cluster</b></div>
                  </div>
                  <div className="card" style={{ borderLeft: '3px solid #c2410c', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#c2410c' }}>⏱ Point-in-Time Recovery (PITR)</div>
                    <div className="kv"><span className="kk">Granularity</span><b>Any second in retention window</b></div>
                    <div className="kv"><span className="kk">How</span><b>Automated backup + transaction logs</b></div>
                    <div className="kv"><span className="kk">Restore to</span><b>New cluster (5–10 min)</b></div>
                    <div className="kv"><span className="kk">Use case</span><b>Accidental DELETE / DROP TABLE</b></div>
                  </div>
                  <div className="card" style={{ borderLeft: '3px solid #d97706' }}>
                    <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#d97706' }}>⏪ Backtrack (Aurora MySQL only)</div>
                    <div className="kv"><span className="kk">How</span><b>Rewinds cluster in-place (no new cluster)</b></div>
                    <div className="kv"><span className="kk">Window</span><b>Up to 72 hours back</b></div>
                    <div className="kv"><span className="kk">Speed</span><b>Seconds to minutes</b></div>
                    <div className="kv"><span className="kk">Use case</span><b>Quick undo of bad migration/query</b></div>
                    <div className="kv"><span className="kk">Caveat</span><b style={{ color: '#dc2626' }}>Disrupts connections briefly</b></div>
                  </div>
                </div>
              </div>

              <div className="sec">PITR vs Backtrack — Interactive Comparison</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                <div className="card">
                  <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '8px' }}>⏱ PITR Restore Simulator</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Pick a restore point (hours ago):</div>
                  <input type="range" min="1" max="35" value={pitrHours} style={{ width: '100%' }} onChange={(e) => setPitrHours(Number(e.target.value))} />
                  <div style={{ fontSize: '12px', marginTop: '6px' }}>Restoring to: <b>{pitrHours} hours ago</b></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginTop: '8px' }}>
                    <div style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>New cluster?</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#1d4ed8' }}>✅ Yes</div>
                    </div>
                    <div style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Est. time</div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>~{pitrEst} min</div>
                    </div>
                    <div style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Data loss</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#15803d' }}>0 sec</div>
                    </div>
                  </div>
                </div>
                <div className="card">
                  <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '8px' }}>⏪ Backtrack Simulator</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Pick backtrack window (hours):</div>
                  <input type="range" min="1" max="72" value={btHours} style={{ width: '100%' }} onChange={(e) => setBtHours(Number(e.target.value))} />
                  <div style={{ fontSize: '12px', marginTop: '6px' }}>Rewinding: <b>{btHours} hours</b></div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', marginTop: '8px' }}>
                    <div style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>New cluster?</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#dc2626' }}>❌ No</div>
                    </div>
                    <div style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Est. time</div>
                      <div style={{ fontSize: '14px', fontWeight: 500 }}>~{btEst} sec</div>
                    </div>
                    <div style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Disruption</div>
                      <div style={{ fontSize: '14px', fontWeight: 500, color: '#d97706' }}>Brief</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFeatureTab === 'clone' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                <div>
                  <div className="sec">Copy-on-Write Cloning Architecture</div>
                  <svg width="100%" viewBox="0 0 340 360" style={{ display: 'block' }}>
                    <defs>
                      <marker id="ac" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#7c3aed"/></marker>
                      <marker id="acg" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#15803d"/></marker>
                    </defs>
                    <rect x="10" y="10" width="148" height="56" rx="10" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="84" y="32" textAnchor="middle" fontSize="12" fill="#6d28d9" fontWeight="500">🏭 Source Cluster</text>
                    <text x="84" y="50" textAnchor="middle" fontSize="11" fill="#7c3aed">Production DB</text>

                    <rect x="182" y="10" width="148" height="56" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="256" y="32" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="500">🧬 Clone Cluster</text>
                    <text x="256" y="50" textAnchor="middle" fontSize="11" fill="#166534">Dev / Test / Analytics</text>

                    <rect x="10" y="100" width="320" height="220" rx="12" fill="#f0fdf4" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="170" y="120" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="500">Shared Storage Volume (Copy-on-Write)</text>

                    <rect x="30" y="135" width="130" height="36" rx="8" fill="#bbf7d0" stroke="#4ade80" strokeWidth="0.5"/>
                    <text x="95" y="157" textAnchor="middle" fontSize="11" fill="#166534">Original pages (shared)</text>
                    <rect x="180" y="135" width="130" height="36" rx="8" fill="#bbf7d0" stroke="#4ade80" strokeWidth="0.5"/>
                    <text x="245" y="157" textAnchor="middle" fontSize="11" fill="#166534">Original pages (shared)</text>

                    <rect x="30" y="190" width="130" height="36" rx="8" fill="#bbf7d0" stroke="#4ade80" strokeWidth="0.5"/>
                    <text x="95" y="212" textAnchor="middle" fontSize="11" fill="#166534">Shared pages …</text>
                    <rect x="180" y="190" width="130" height="36" rx="8" fill="#fef3c7" stroke="#fbbf24" strokeWidth="0.5"/>
                    <text x="245" y="212" textAnchor="middle" fontSize="11" fill="#92400e">New pages (clone writes)</text>

                    <text x="170" y="255" textAnchor="middle" fontSize="11" fill="#15803d">At clone time: 0 data copied — both point to same pages</text>
                    <text x="170" y="272" textAnchor="middle" fontSize="11" fill="#15803d">On clone write: only changed pages are duplicated</text>
                    <text x="170" y="289" textAnchor="middle" fontSize="11" fill="#15803d">Source is never affected by clone writes</text>
                    <text x="170" y="306" textAnchor="middle" fontSize="11" fill="#92400e">Clone storage grows only as clone diverges</text>

                    <line x1="84" y1="66" x2="84" y2="100" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#ac)"/>
                    <line x1="256" y1="66" x2="256" y2="100" stroke="#15803d" strokeWidth="1" markerEnd="url(#acg)"/>
                  </svg>
                </div>
                <div>
                  <div className="sec">Why Cloning is Powerful</div>
                  <div className="card" style={{ marginBottom: '8px' }}>
                    <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#7c3aed' }}>⚡ Instant — No data copy</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Clone of a 100 TB database takes the same time as a 1 GB database — seconds, not hours. No snapshot needed.</div>
                  </div>
                  <div className="card" style={{ marginBottom: '8px' }}>
                    <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#15803d' }}>💰 Cost-efficient</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>You only pay for storage that diverges from the source. A clone used for read-only testing costs almost nothing.</div>
                  </div>
                  <div className="card" style={{ marginBottom: '8px' }}>
                    <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#1d4ed8' }}>🛡️ Source is isolated</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Writes to the clone never touch source pages. Production is completely safe.</div>
                  </div>
                  <div className="card" style={{ marginBottom: '8px' }}>
                    <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#c2410c' }}>Use cases</div>
                    <ul className="checklist">
                      <li>Dev / test with production data</li>
                      <li>Schema migration dry-run</li>
                      <li>Analytics on live snapshot</li>
                      <li>Disaster recovery testing</li>
                      <li>Blue/green deployments</li>
                    </ul>
                  </div>
                  <div className="sec">Clone vs Snapshot Restore</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: 'var(--color-background-secondary)' }}>
                          <th style={{ padding: '6px 8px', border: '0.5px solid var(--color-border-tertiary)', textAlign: 'left' }}>Feature</th>
                          <th style={{ padding: '6px 8px', border: '0.5px solid var(--color-border-tertiary)', color: '#7c3aed' }}>Clone</th>
                          <th style={{ padding: '6px 8px', border: '0.5px solid var(--color-border-tertiary)', color: '#1d4ed8' }}>Snapshot Restore</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cloneRows.map((r, i) => (
                          <tr key={i} style={{ background: i % 2 === 0 ? 'var(--color-background-secondary)' : 'transparent' }}>
                            <td style={{ padding: '5px 8px', border: '0.5px solid var(--color-border-tertiary)', fontWeight: 500 }}>{r[0]}</td>
                            <td style={{ padding: '5px 8px', border: '0.5px solid var(--color-border-tertiary)', color: '#7c3aed', textAlign: 'center' }}>{r[1]}</td>
                            <td style={{ padding: '5px 8px', border: '0.5px solid var(--color-border-tertiary)', color: '#1d4ed8', textAlign: 'center' }}>{r[2]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeFeatureTab === 'security' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <svg width="100%" viewBox="0 0 340 430" style={{ display: 'block' }}>
                    <defs>
                      <marker id="as" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#6b7280"/></marker>
                    </defs>
                    <rect x="10" y="10" width="320" height="410" rx="16" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5"/>
                    <text x="170" y="30" textAnchor="middle" fontSize="12" fill="#475569" fontWeight="500">VPC Security Boundary</text>

                    <rect x="25" y="42" width="290" height="60" rx="10" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.5"/>
                    <text x="170" y="62" textAnchor="middle" fontSize="12" fill="#1d4ed8" fontWeight="500">🌐 Internet / Client</text>
                    <text x="170" y="80" textAnchor="middle" fontSize="11" fill="#1d4ed8">App / Lambda / EC2 (in public subnet)</text>

                    <rect x="25" y="120" width="290" height="50" rx="10" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="170" y="140" textAnchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">🔒 TLS 1.2+ in transit</text>
                    <text x="170" y="158" textAnchor="middle" fontSize="11" fill="#6d28d9">All connections encrypted · rds-ca-2019 cert</text>

                    <rect x="25" y="188" width="290" height="50" rx="10" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5"/>
                    <text x="170" y="208" textAnchor="middle" fontSize="12" fill="#c2410c" fontWeight="500">🛡️ Security Groups</text>
                    <text x="170" y="226" textAnchor="middle" fontSize="11" fill="#c2410c">Port 3306/5432 · Allow only app SG</text>

                    <rect x="25" y="256" width="290" height="70" rx="10" fill="#f0fdf4" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="170" y="276" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="500">🔑 Authentication</text>
                    <rect x="40" y="286" width="120" height="28" rx="6" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
                    <text x="100" y="304" textAnchor="middle" fontSize="11" fill="#166534">IAM DB Auth</text>
                    <rect x="175" y="286" width="125" height="28" rx="6" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
                    <text x="237" y="304" textAnchor="middle" fontSize="11" fill="#166534">Secrets Manager</text>

                    <rect x="25" y="344" width="290" height="66" rx="10" fill="#ccfbf1" stroke="#5eead4" strokeWidth="0.5"/>
                    <text x="170" y="364" textAnchor="middle" fontSize="12" fill="#0f766e" fontWeight="500">🔐 Encryption at Rest (KMS)</text>
                    <text x="170" y="382" textAnchor="middle" fontSize="11" fill="#0f766e">Storage · Snapshots · Replicas · Logs</text>
                    <text x="170" y="400" textAnchor="middle" fontSize="11" fill="#0f766e">AWS-managed or Customer-managed CMK</text>

                    <line x1="170" y1="102" x2="170" y2="120" stroke="#6b7280" strokeWidth="1" markerEnd="url(#as)"/>
                    <line x1="170" y1="170" x2="170" y2="188" stroke="#6b7280" strokeWidth="1" markerEnd="url(#as)"/>
                    <line x1="170" y1="238" x2="170" y2="256" stroke="#6b7280" strokeWidth="1" markerEnd="url(#as)"/>
                    <line x1="170" y1="326" x2="170" y2="344" stroke="#6b7280" strokeWidth="1" markerEnd="url(#as)"/>
                  </svg>
                </div>
                <div>
                  <div className="sec">Security layers explained</div>
                  <div className="card" style={{ borderLeft: '3px solid #1d4ed8', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '5px', color: '#1d4ed8' }}>🔒 Encryption in Transit (TLS)</div>
                    <div className="kv"><span className="kk">Protocol</span><b>TLS 1.2 minimum</b></div>
                    <div className="kv"><span className="kk">Enforce</span><b>rds.force_ssl = 1 (param group)</b></div>
                    <div className="kv"><span className="kk">Certificate</span><b>rds-ca-2019 (auto-rotated)</b></div>
                  </div>
                  <div className="card" style={{ borderLeft: '3px solid #0f766e', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '5px', color: '#0f766e' }}>🔐 Encryption at Rest (KMS)</div>
                    <div className="kv"><span className="kk">Covers</span><b>Storage, snapshots, replicas, logs</b></div>
                    <div className="kv"><span className="kk">Key types</span><b>aws/rds (managed) or CMK</b></div>
                    <div className="kv"><span className="kk">Enable when?</span><b style={{ color: '#dc2626' }}>At cluster creation only</b></div>
                    <div className="kv"><span className="kk">Encrypted clone?</span><b>Inherits source key</b></div>
                  </div>
                  <div className="card" style={{ borderLeft: '3px solid #15803d', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '5px', color: '#15803d' }}>🔑 IAM Database Authentication</div>
                    <div className="kv"><span className="kk">How</span><b>IAM token (15-min TTL) instead of password</b></div>
                    <div className="kv"><span className="kk">Engines</span><b>Aurora MySQL + Aurora PostgreSQL</b></div>
                    <div className="kv"><span className="kk">Best for</span><b>Lambda, ECS, EC2 (no stored creds)</b></div>
                  </div>
                  <div className="card" style={{ borderLeft: '3px solid #c2410c', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '5px', color: '#c2410c' }}>🗝️ Secrets Manager</div>
                    <div className="kv"><span className="kk">Auto-rotate</span><b>Every N days (configurable)</b></div>
                    <div className="kv"><span className="kk">Zero downtime</span><b>Dual-password rotation</b></div>
                    <div className="kv"><span className="kk">Integrated with</span><b>RDS Proxy (no app restart)</b></div>
                  </div>
                  <div className="card" style={{ borderLeft: '3px solid #7c3aed' }}>
                    <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '5px', color: '#7c3aed' }}>🛡️ Network Security</div>
                    <div className="kv"><span className="kk">VPC</span><b>Aurora always in private subnet</b></div>
                    <div className="kv"><span className="kk">Security Groups</span><b>Allow only app-tier SG on DB port</b></div>
                    <div className="kv"><span className="kk">No public IP</span><b>Publicly accessible = OFF (default)</b></div>
                    <div className="kv"><span className="kk">VPC Endpoints</span><b>For Secrets Manager, KMS (no NAT)</b></div>
                  </div>
                </div>
              </div>

              <div className="sec">Security Checklist Simulator — click to toggle</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                {secChecks.map((item, idx) => (
                  <div key={idx} onClick={() => toggleSecCheck(idx)} style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', padding: '8px 10px', cursor: 'pointer', background: item.done ? '#f0fdf4' : '#fef2f2', borderColor: item.done ? '#86efac' : '#fca5a5' }}>
                    <div style={{ fontSize: '11px', fontWeight: 500, color: item.done ? '#166534' : '#b91c1c' }}>
                      {item.done ? '✅ ' : '❌ '} {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeFeatureTab === 'ml' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <svg width="100%" viewBox="0 0 340 400" style={{ display: 'block' }}>
                    <defs>
                      <marker id="aml" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#7c3aed"/></marker>
                      <marker id="amlg" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#15803d"/></marker>
                      <marker id="amlo" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#c2410c"/></marker>
                    </defs>
                    <rect x="10" y="10" width="320" height="56" rx="10" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="170" y="32" textAnchor="middle" fontSize="12" fill="#6d28d9" fontWeight="500">Aurora Cluster (SQL Engine)</text>
                    <text x="170" y="50" textAnchor="middle" fontSize="11" fill="#7c3aed">SELECT aws_sagemaker_invoke_endpoint(...)</text>

                    <rect x="10" y="100" width="320" height="50" rx="10" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                    <text x="170" y="120" textAnchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">Aurora ML Extension</text>
                    <text x="170" y="138" textAnchor="middle" fontSize="11" fill="#6d28d9">Built-in SQL functions → ML services</text>

                    <rect x="10" y="178" width="148" height="80" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="84" y="200" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="500">🧠 SageMaker</text>
                    <text x="84" y="218" textAnchor="middle" fontSize="11" fill="#166534">Custom ML models</text>
                    <text x="84" y="234" textAnchor="middle" fontSize="11" fill="#166534">Fraud detection</text>
                    <text x="84" y="250" textAnchor="middle" fontSize="11" fill="#166534">Churn prediction</text>

                    <rect x="182" y="178" width="148" height="80" rx="10" fill="#ffedd5" stroke="#fed7aa" strokeWidth="0.5"/>
                    <text x="256" y="200" textAnchor="middle" fontSize="12" fill="#c2410c" fontWeight="500">💬 Comprehend</text>
                    <text x="256" y="218" textAnchor="middle" fontSize="11" fill="#c2410c">Sentiment analysis</text>
                    <text x="256" y="234" textAnchor="middle" fontSize="11" fill="#c2410c">Entity detection</text>
                    <text x="256" y="250" textAnchor="middle" fontSize="11" fill="#c2410c">Language detection</text>

                    <rect x="10" y="290" width="320" height="50" rx="10" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                    <text x="170" y="310" textAnchor="middle" fontSize="12" fill="#1d4ed8" fontWeight="500">📊 Result returned as SQL column</text>
                    <text x="170" y="328" textAnchor="middle" fontSize="11" fill="#1d4ed8">SELECT id, review, sentiment FROM orders</text>

                    <rect x="10" y="358" width="320" height="34" rx="8" fill="#f0fdf4" stroke="#86efac" strokeWidth="0.5"/>
                    <text x="170" y="379" textAnchor="middle" fontSize="11" fill="#15803d">No ETL · No Python · Pure SQL · In-database inference</text>

                    <line x1="170" y1="66" x2="170" y2="100" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#aml)"/>
                    <line x1="120" y1="150" x2="84" y2="178" stroke="#15803d" strokeWidth="1" markerEnd="url(#amlg)"/>
                    <line x1="220" y1="150" x2="256" y2="178" stroke="#c2410c" strokeWidth="1" markerEnd="url(#amlo)"/>
                    <line x1="84" y1="258" x2="170" y2="290" stroke="#6b7280" strokeWidth="1" markerEnd="url(#aml)"/>
                    <line x1="256" y1="258" x2="170" y2="290" stroke="#6b7280" strokeWidth="1" markerEnd="url(#aml)"/>
                    <line x1="170" y1="340" x2="170" y2="358" stroke="#6b7280" strokeWidth="1" markerEnd="url(#aml)"/>
                  </svg>
                </div>
                <div>
                  <div className="sec">Aurora ML — SQL-native inference</div>
                  <div className="card" style={{ borderLeft: '3px solid #15803d', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#15803d' }}>🧠 SageMaker Integration</div>
                    <div className="kv"><span className="kk">Function</span><b style={{ fontFamily: 'monospace', fontSize: '11px' }}>aws_sagemaker_invoke_endpoint()</b></div>
                    <div className="kv"><span className="kk">Input</span><b>Any SQL column values</b></div>
                    <div className="kv"><span className="kk">Output</span><b>Model prediction as SQL value</b></div>
                    <div className="kv"><span className="kk">Auth</span><b>IAM role on Aurora cluster</b></div>
                    <div className="kv"><span className="kk">Use cases</span><b>Fraud score, churn, recommendations</b></div>
                  </div>
                  <div className="card" style={{ borderLeft: '3px solid #c2410c', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#c2410c' }}>💬 Comprehend Integration</div>
                    <div className="kv"><span className="kk">Sentiment fn</span><b style={{ fontFamily: 'monospace', fontSize: '11px' }}>aws_comprehend_detect_sentiment()</b></div>
                    <div className="kv"><span className="kk">Returns</span><b>POSITIVE / NEGATIVE / NEUTRAL / MIXED</b></div>
                    <div className="kv"><span className="kk">Language fn</span><b style={{ fontFamily: 'monospace', fontSize: '11px' }}>aws_comprehend_detect_dominant_language()</b></div>
                    <div className="kv"><span className="kk">Engines</span><b>Aurora MySQL + Aurora PostgreSQL</b></div>
                  </div>
                  <div className="card" style={{ borderLeft: '3px solid #7c3aed', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#7c3aed' }}>⚙️ Setup Requirements</div>
                    <ul className="checklist">
                      <li>Enable Aurora ML in cluster parameter group</li>
                      <li>Attach IAM role to Aurora cluster</li>
                      <li>Role needs sagemaker:InvokeEndpoint</li>
                      <li>Role needs comprehend:DetectSentiment</li>
                      <li>VPC endpoint for SageMaker (optional)</li>
                    </ul>
                  </div>
                  <div className="sec">Live SQL Example</div>
                  <div style={{ border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px', padding: '10px', background: 'var(--color-background-secondary)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Click a query to see result:</div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                      <button className="tab" onClick={() => setActiveMlQuery('sentiment')} style={{ fontSize: '11px', padding: '4px 10px', background: activeMlQuery === 'sentiment' ? '#7c3aed' : '', color: activeMlQuery === 'sentiment' ? '#fff' : '' }}>Sentiment</button>
                      <button className="tab" onClick={() => setActiveMlQuery('fraud')} style={{ fontSize: '11px', padding: '4px 10px', background: activeMlQuery === 'fraud' ? '#7c3aed' : '', color: activeMlQuery === 'fraud' ? '#fff' : '' }}>Fraud Score</button>
                      <button className="tab" onClick={() => setActiveMlQuery('churn')} style={{ fontSize: '11px', padding: '4px 10px', background: activeMlQuery === 'churn' ? '#7c3aed' : '', color: activeMlQuery === 'churn' ? '#fff' : '' }}>Churn Predict</button>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px', whiteSpace: 'pre-wrap' }}>
                      {mlQueries[activeMlQuery].sql}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>→ Result:</span><br/>
                      {mlQueries[activeMlQuery].result}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 10: Aurora vs RDS */}
      {activeTab === 'vsrds' && (
        <div>
          <div className="sec">Aurora vs Standard RDS — When to Choose What</div>
          <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', border: '0.5px solid var(--color-border-tertiary)' }}>
              <thead>
                <tr style={{ background: 'var(--color-background-secondary)' }}>
                  <th style={{ padding: '8px', textAlign: 'left', border: '0.5px solid var(--color-border-tertiary)', fontWeight: 600 }}>Feature</th>
                  <th style={{ padding: '8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)', color: '#7c3aed', fontWeight: 600 }}>Aurora</th>
                  <th style={{ padding: '8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)', color: '#1d4ed8', fontWeight: 600 }}>RDS MySQL/PG</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, idx) => (
                  <tr key={idx} style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--color-background-secondary)' }}>
                    <td style={{ padding: '7px 8px', border: '0.5px solid var(--color-border-tertiary)', fontWeight: 500, color: 'var(--color-text-primary)' }}>{row[0]}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)', color: '#7c3aed' }}>{row[1]}</td>
                    <td style={{ padding: '7px 8px', textAlign: 'center', border: '0.5px solid var(--color-border-tertiary)', color: '#1d4ed8' }}>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '10px' }}>
            <div className="card" style={{ borderTop: '3px solid #7c3aed' }}>
              <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '7px', color: '#7c3aed' }}>✅ Choose Aurora when…</div>
              <ul className="checklist">
                <li>High availability is critical (&lt; 30s failover)</li>
                <li>Need up to 15 read replicas for scale</li>
                <li>Using Lambda / serverless heavily</li>
                <li>Want Global DB for DR / global reads</li>
                <li>Need Aurora Serverless v2 auto-scaling</li>
                <li>Want Zero-ETL to Redshift</li>
                <li>In-database ML inference query models</li>
              </ul>
            </div>
            <div className="card" style={{ borderTop: '3px solid #1d4ed8' }}>
              <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '7px', color: '#1d4ed8' }}>✅ Choose RDS when…</div>
              <ul className="checklist">
                <li>Cost is primary concern (RDS ~20% cheaper)</li>
                <li>Need SQL Server or Oracle engines</li>
                <li>Need specific engine minor patch versions</li>
                <li>Simple workload, 1–2 replicas enough</li>
                <li>Regulatory constraints require core engines</li>
                <li>Existing setup has no migration budget</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      </div>

      {/* Footer / Terraform configuration trigger */}
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button
          onClick={sendTerraformPrompt}
          style={{
            padding: '8px 20px',
            borderRadius: '20px',
            border: '0.5px solid var(--color-border-secondary)',
            fontSize: '12px',
            cursor: 'pointer',
            background: 'var(--color-background-secondary)',
            color: 'var(--color-text-primary)',
            fontWeight: 500
          }}
        >
          Get Terraform for full Aurora setup ↗
        </button>
      </div>
    </div>
  );
}
