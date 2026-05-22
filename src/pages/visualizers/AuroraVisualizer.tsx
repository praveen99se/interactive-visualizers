import { useEffect, useState } from 'react';

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
  const [tab, setTab] = useState<'storage'|'cluster'|'multiaz'|'global'|'serverless'|'endpoints'|'failover'|'integrations'|'vsrds'>('storage');

  // Serverless ACU sim
  const [connections, setConnections] = useState(50);
  const [acu, setAcu] = useState(2);
  const [ram, setRam] = useState('4 GB');
  const [cost, setCost] = useState('$0.12');

  // Storage copies sim
  const [copies, setCopies] = useState<boolean[]>([true, true, true, true, true, true]);
  const healthyCount = copies.filter(Boolean).length;

  // Auto-expand storage
  const [used, setUsed] = useState(35);
  const [allocated, setAllocated] = useState(40);

  // Failover sim logs and state
  const [simLog, setSimLog] = useState<string[]>([]);
  const [simState, setSimState] = useState({ writerFailed: false, r2Failed: false, promoted: false });

  useEffect(() => {
    updateACU(connections);
  }, [connections]);

  function pushLog(msg: string) {
    setSimLog((s) => [msg, ...s].slice(0, 12));
  }

  function updateACU(val: number) {
    setConnections(val);
    const acuVal = Math.max(0.5, Math.min(256, Math.ceil(val / 25)));
    setAcu(acuVal);
    setRam(`${(acuVal * 2).toFixed(1)} GB`);
    setCost(`$${(acuVal * 0.06).toFixed(2)}`);
  }

  function failOne() {
    const idx = copies.findIndex(x => x === true);
    if (idx === -1) return;
    const nc = [...copies];
    nc[idx] = false;
    setCopies(nc);
    pushLog(`[EVENT] Copy ${idx+1} failed`);
  }
  function repair() {
    // simulate rebuild
    let i = 0;
    const timer = setInterval(() => {
      const idx = copies.findIndex(x => x === false);
      if (idx === -1) { clearInterval(timer); return; }
      const nc = [...copies];
      nc[idx] = true;
      setCopies(nc);
      i++;
      if (i > 6) clearInterval(timer);
    }, 350);
  }
  function resetCopies() {
    setCopies([true, true, true, true, true, true]);
    pushLog('[EVENT] Copies reset');
  }

  function setUsedHandler(v: number) {
    setUsed(v);
    let alloc = allocated;
    let expanded = false;
    while (v > alloc && alloc < 131072) { alloc += 10; expanded = true; }
    setAllocated(alloc);
    if (expanded) {
      pushLog('[EVENT] Storage auto-expanded');
    }
  }

  function triggerFailover() {
    if (simState.writerFailed) { pushLog('[ERR] Writer already failed. Reset first.'); return; }
    setSimState(s => ({...s, writerFailed: true}));
    pushLog('[T+0s] 💥 AZ-1 failure detected. Writer unreachable.');
    setTimeout(()=> pushLog('[T+5s] ⚠️ Health check failed. Initiating failover...'), 600);
    setTimeout(()=> pushLog('[T+10s] 🔍 Selecting replica with highest priority...'), 1200);
    setTimeout(()=> { pushLog('[T+15s] ✅ Replica 1 (AZ-2) promoted to Writer!'); setSimState(s=>({...s, promoted:true})); }, 1800);
    setTimeout(()=> pushLog('[T+20s] 🔄 Cluster endpoint DNS updated → new writer.'), 2400);
    setTimeout(()=> pushLog('[T+25s] ✅ Cluster healthy. RDS Proxy reconnected.'), 3000);
  }
  function triggerReplicaFail() {
    if (simState.r2Failed) { pushLog('[ERR] Replica 2 already failed. Reset first.'); return; }
    setSimState(s=>({...s, r2Failed:true}));
    pushLog('[T+0s] ⚠️ Replica 2 (AZ-3) health check failed.');
    setTimeout(()=> pushLog('[T+3s] 🔄 Reader endpoint removed Replica 2 from rotation.'), 600);
    setTimeout(()=> pushLog('[T+5s] ✅ Reader endpoint now routes to Replica 1 only.'), 1200);
    setTimeout(()=> pushLog('[T+8s] 📊 CloudWatch alarm triggered: ReplicaCount < 2'), 1800);
  }

  useEffect(() => {
    // initial compare table log
    pushLog('[00:00] Aurora visualizer ready');
  }, []);

  return (
    <div>
      <style>{`
        .tab-bar{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}
        .tab-btn{padding:6px 12px;border-radius:20px;border:0.5px solid var(--color-border-tertiary);font-size:13px;cursor:pointer;background:var(--color-background-primary);color:var(--color-text-secondary)}
        .tab-btn.active{background:#7c3aed;color:#fff;border-color:#7c3aed}
        .panel{display:none}
        .panel.active{display:block}
        .card{border:0.5px solid var(--color-border-tertiary);border-radius:10px;padding:11px 13px;margin-bottom:9px;background:var(--color-background-primary)}
        .sec{font-size:11px;font-weight:500;color:var(--color-text-secondary);text-transform:uppercase;margin:12px 0 7px}
        .small{font-size:12px;color:var(--color-text-secondary)}
        .metric{background:var(--color-background-secondary);border-radius:8px;padding:10px}
        .kv{display:flex;gap:8px;font-size:12px;margin-bottom:4px;align-items:flex-start}
        .kk{color:var(--color-text-secondary);min-width:130px;flex-shrink:0}
        .sim-node{border:0.5px solid var(--color-border-tertiary);border-radius:8px;padding:8px 10px;font-size:12px;text-align:center}
        .sim-node.healthy{border-color:#16a34a;background:#f0fdf4}
        .sim-node.failed{border-color:#dc2626;background:#fef2f2}
        .sim-node.promoted{border-color:#7c3aed;background:#faf5ff}
        .log-line{font-size:11px;padding:3px 0;border-bottom:0.5px solid var(--color-border-tertiary);color:var(--color-text-secondary)}
        .log-line.ok{color:#15803d}
        .log-line.warn{color:#d97706}
        .log-line.err{color:#dc2626}
      `}</style>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🌌 Amazon Aurora Visualizer</h1>
        <p className="text-gray-600">Shared storage, quorum, global DB, serverless ACU sim, and failover playbook.</p>
      </div>

      <div className="tab-bar mb-4">
        <button className={`tab-btn ${tab==='storage'?'active':''}`} onClick={() => setTab('storage')}>Storage Engine</button>
        <button className={`tab-btn ${tab==='cluster'?'active':''}`} onClick={() => setTab('cluster')}>Cluster Architecture</button>
        <button className={`tab-btn ${tab==='multiaz'?'active':''}`} onClick={() => setTab('multiaz')}>Multi-AZ</button>
        <button className={`tab-btn ${tab==='global'?'active':''}`} onClick={() => setTab('global')}>Global DB</button>
        <button className={`tab-btn ${tab==='serverless'?'active':''}`} onClick={() => setTab('serverless')}>Serverless v2</button>
        <button className={`tab-btn ${tab==='endpoints'?'active':''}`} onClick={() => setTab('endpoints')}>Endpoints</button>
        <button className={`tab-btn ${tab==='failover'?'active':''}`} onClick={() => setTab('failover')}>Failover Sim</button>
        <button className={`tab-btn ${tab==='integrations'?'active':''}`} onClick={() => setTab('integrations')}>Integrations</button>
        <button className={`tab-btn ${tab==='vsrds'?'active':''}`} onClick={() => setTab('vsrds')}>Aurora vs RDS</button>
      </div>

      <div className={`panel ${tab==='storage'?'active':''}`}>
        <div className="sec">How Aurora Storage Works — The Key Differentiator</div>
        <div className="card">
          <div className="small">Shared distributed storage (6 copies across 3 AZs). Replicas read from same storage (near-zero lag).</div>
        </div>
      </div>

      <div className={`panel ${tab==='serverless'?'active':''}`}>
        <div className="sec">Aurora Serverless v2 — Auto-Scaling Compute</div>
        <div className="card">
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div>
              <label className="small">Simulate load (connections)</label>
              <input type="range" min={0} max={500} value={connections} onChange={(e)=> setConnections(Number(e.target.value))} style={{width:'100%'}} />
              <div className="kv"><div className="kk">Connections</div><b>{connections}</b></div>
            </div>
            <div>
              <div className="metric"><div className="small">Current ACUs</div><div style={{fontSize:22,fontWeight:500}}>{acu}</div></div>
              <div style={{height:8}} />
              <div className="metric"><div className="small">RAM</div><div style={{fontSize:16,fontWeight:500}}>{ram}</div></div>
              <div style={{height:8}} />
              <div className="metric"><div className="small">$/hour</div><div style={{fontSize:16,fontWeight:500}}>{cost}</div></div>
            </div>
          </div>
          <div className="small" style={{marginTop:8}}>Best for: Dev/test, variable workloads, Lambda-heavy apps.</div>
        </div>
      </div>

      <div className={`panel ${tab==='failover'?'active':''}`}>
        <div className="sec">Aurora Failover Simulation</div>
        <div className="card">
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:10}}>
            <div className={`sim-node ${simState.writerFailed? 'failed':'healthy'}`}>
              <div style={{fontSize:16}}>✍️</div>
              <div style={{fontWeight:500,fontSize:12}}>Writer</div>
              <div style={{fontSize:11,color: simState.writerFailed? '#dc2626':'#15803d'}}>{simState.writerFailed? '● FAILED':'● HEALTHY'}</div>
              <div style={{fontSize:10,color:'var(--color-text-secondary)'}}>AZ-1 · Priority: 0</div>
            </div>
            <div className={`sim-node ${simState.promoted? 'promoted' : 'healthy'}`}>
              <div style={{fontSize:16}}>📖</div>
              <div style={{fontWeight:500,fontSize:12}}>{simState.promoted? 'NEW Writer':'Replica 1'}</div>
              <div style={{fontSize:11,color: '#15803d'}}>{simState.promoted? '● PROMOTED':'● HEALTHY'}</div>
              <div style={{fontSize:10,color:'var(--color-text-secondary)'}}>AZ-2 · Priority: 1</div>
            </div>
            <div className={`sim-node ${simState.r2Failed? 'failed':'healthy'}`}>
              <div style={{fontSize:16}}>📖</div>
              <div style={{fontWeight:500,fontSize:12}}>Replica 2</div>
              <div style={{fontSize:11,color: simState.r2Failed? '#dc2626':'#15803d'}}>{simState.r2Failed? '● FAILED':'● HEALTHY'}</div>
              <div style={{fontSize:10,color:'var(--color-text-secondary)'}}>AZ-3 · Priority: 2</div>
            </div>
          </div>

          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            <button onClick={triggerFailover} style={{background:'#fee2e2',border:'0.5px solid #fca5a5',padding:'6px 14px',borderRadius:6}}>💥 Fail Writer (AZ-1 down)</button>
            <button onClick={()=> { setSimState({writerFailed:false,r2Failed:false,promoted:false}); setSimLog([]); pushLog('[EVENT] Reset simulation'); }} style={{padding:'6px 14px',borderRadius:6}}>🔄 Reset</button>
            <button onClick={triggerReplicaFail} style={{background:'#fff7ed',border:'0.5px solid #fed7aa',padding:'6px 14px',borderRadius:6}}>⚠️ Fail Replica 2</button>
          </div>

          <div style={{border:'0.5px solid var(--color-border-tertiary)',borderRadius:8,padding:10,minHeight:120,background:'var(--color-background-secondary)',marginTop:10}}>
            <div style={{fontSize:11,fontWeight:500,color:'var(--color-text-secondary)',marginBottom:6}}>EVENT LOG</div>
            <div>
              {simLog.map((l, i) => (
                <div key={i} className={`log-line ${l.includes('ERR')? 'err' : l.includes('warn')? 'warn' : l.includes('✅')? 'ok' : 'info'}`} dangerouslySetInnerHTML={{__html:l}} />
              ))}
            </div>
          </div>

          <div style={{marginTop:10,background:'var(--color-background-secondary)',borderRadius:8,padding:9,fontSize:12,color:'var(--color-text-secondary)'}}>
            <b style={{color:'var(--color-text-primary)'}}>Failover priority:</b> Aurora promotes replica with highest priority (lowest number). RDS Proxy reduces app-visible downtime to ~5s.
          </div>
        </div>
      </div>

      <div className={`panel ${tab==='integrations'?'active':''}`}>
        <div className="sec">Aurora Integration Ecosystem</div>
        <div className="card">
          <div className="small">RDS Proxy, Secrets Manager, CloudWatch/PI, Lambda, Data API, ML, Zero-ETL to Redshift.</div>
        </div>
      </div>

      <div className={`panel ${tab==='vsrds'?'active':''}`}>
        <div className="sec">Aurora vs Standard RDS — When to Choose What</div>
        <div className="card">
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
              <thead>
                <tr style={{background:'var(--color-background-secondary)'}}>
                  <th style={{padding:7,textAlign:'left',border:'0.5px solid var(--color-border-tertiary)'}}>Feature</th>
                  <th style={{padding:7,textAlign:'center',border:'0.5px solid var(--color-border-tertiary)',color:'#7c3aed'}}>Aurora</th>
                  <th style={{padding:7,textAlign:'center',border:'0.5px solid var(--color-border-tertiary)',color:'#1d4ed8'}}>RDS MySQL/PG</th>
                </tr>
              </thead>
              <tbody>
                {compareRows.map((r, i) => (
                  <tr key={i} style={{background: i%2===0? 'var(--color-background-secondary)': 'transparent'}}>
                    <td style={{padding:'6px 8px',border:'0.5px solid var(--color-border-tertiary)',fontWeight:500}}>{r[0]}</td>
                    <td style={{padding:'6px 8px',textAlign:'center',border:'0.5px solid var(--color-border-tertiary)',color:'#7c3aed'}} dangerouslySetInnerHTML={{__html:r[1]}} />
                    <td style={{padding:'6px 8px',textAlign:'center',border:'0.5px solid var(--color-border-tertiary)',color:'#1d4ed8'}} dangerouslySetInnerHTML={{__html:r[2]}} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div style={{marginTop:14,textAlign:'center'}}>
        <button onClick={()=> pushLog('[REQUEST] Generate Terraform for Aurora cluster')} style={{padding:'8px 20px',borderRadius:20,border:'0.5px solid var(--color-border-tertiary)',fontSize:13}}>Get Terraform for full Aurora setup ↗</button>
      </div>

      {/* Copies & storage mini-sims */}
      <div style={{marginTop:18,display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div className="card">
          <div style={{fontWeight:500,marginBottom:6,color:'var(--color-text-primary)'}}>1) Self‑healing storage (mini sim)</div>
          <div className="small">Click “Fail 1 copy” → quorum stays OK, then Aurora repairs back to 6 copies.</div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:6,marginTop:10}}>
            {copies.map((c, i) => (
              <div key={i} className="metric" style={{textAlign:'center',border:'0.5px solid var(--color-border-tertiary)',background: c? '#f0fdf4':'#fef2f2',color: c? '#166534':'#b91c1c'}}>{c? `C${i+1}` : `C${i+1} ✖`}</div>
            ))}
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:10}}>
            <div className="metric"><div className="small">Write quorum (needs 4/6)</div><div style={{fontSize:16,fontWeight:500,color: healthyCount>=4? '#15803d':'#dc2626'}}>{healthyCount>=4? `✅ OK (${healthyCount}/6)`:`❌ AT RISK (${healthyCount}/6)`}</div></div>
            <div className="metric"><div className="small">Read quorum (needs 3/6)</div><div style={{fontSize:16,fontWeight:500,color: healthyCount>=3? '#15803d':'#dc2626'}}>{healthyCount>=3? `✅ OK (${healthyCount}/6)`:`❌ AT RISK (${healthyCount}/6)`}</div></div>
          </div>

          <div style={{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}}>
            <button onClick={failOne}>Fail 1 copy</button>
            <button onClick={repair}>Self‑heal (repair)</button>
            <button onClick={resetCopies}>Reset</button>
          </div>
        </div>

        <div className="card">
          <div style={{fontWeight:500,marginBottom:6,color:'var(--color-text-primary)'}}>2) Auto‑expanding storage (mini sim)</div>
          <div className="small">Aurora storage grows automatically as you store more data (in chunks). Slide “Used” to see it expand.</div>

          <div style={{marginTop:10}}>
            <div className="kv"><div className="kk">Used</div><b>{used} GB</b></div>
            <input type="range" min={0} max={120} value={used} onChange={(e)=> setUsedHandler(Number(e.target.value))} style={{width:'100%'}} />
            <div className="kv"><div className="kk">Allocated</div><b>{allocated} GB</b> <span className="small">(grows in 10 GB steps)</span></div>
            <div style={{height:10,borderRadius:999,border:'0.5px solid var(--color-border-tertiary)',overflow:'hidden'}}>
              <div style={{height:'100%',width: `${Math.min(100, Math.round((used/allocated)*100))}%`,background:'var(--color-text-info)'}} />
            </div>
            <div className="kv"><div className="kk">Status</div><b style={{color: used>allocated? '#d97706':'#15803d'}}>{used>allocated? '⬆️ Expanded automatically to fit':'✅ No expansion needed'}</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}
