import { useEffect, useState } from 'react';

type TabType = 'concept' | 'compare' | 'arch' | 'usecases' | 'security' | 'sim';

const ucData = {
  session: {
    label: '🔐 Session Store',
    title: '🔐 Session Storage',
    desc: 'Store user login sessions in Redis instead of the database. Each session is a key with a TTL. When a user logs in, the application generates a session token and stores it in Redis. On subsequent requests, the app validates the token in sub-milliseconds. On logout, the key is simply deleted.',
    code: `// Login: store session data in cache
await redis.setex(
  \`session:\${token}\`,
  3600,  // 1 hour TTL
  JSON.stringify({ userId, role, email })
);

// Request: validate session (sub-millisecond lookup)
const session = await redis.get(\`session:\${token}\`);
if (!session) return res.status(401).send("Expired");

// Logout: destroy session key
await redis.del(\`session:\${token}\`);`,
    cmds: 'SET session:abc {data} EX 3600\nGET session:abc\nDEL session:abc\nTTL session:abc  ← check remaining expiry',
    svgColor: '#dc2626', svgFill: '#fef2f2', svgStroke: '#fca5a5'
  },
  dbcache: {
    label: '🗄️ DB Query Cache',
    title: '🗄️ DB Query Cache',
    desc: 'Cache expensive database query results. The first request experiences a cache miss, queries the database, and stores the results in Redis. Subsequent requests fetch the parsed data directly from memory in <1ms, shielding the relational database from redundant operations.',
    code: `async function getProducts(category) {
  const key = \`products:\${category}\`;
  
  // 1. Check cache first
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached); // HIT ✅
  
  // 2. Cache MISS → query relational database
  const data = await db.query(
    "SELECT * FROM products WHERE category=?",
    [category]
  );
  
  // 3. Store in cache for 5 minutes (300 seconds)
  await redis.setex(key, 300, JSON.stringify(data));
  return data;
}`,
    cmds: 'SET products:electronics {data} EX 300\nGET products:electronics\nDEL products:electronics  ← on catalog update\nKEYS products:*  ← scan categorized caches',
    svgColor: '#1d4ed8', svgFill: '#dbeafe', svgStroke: '#93c5fd'
  },
  leaderboard: {
    label: '🏆 Leaderboard',
    title: '🏆 Real-time Leaderboard',
    desc: 'Redis Sorted Sets (ZSET) are specifically optimized for real-time leaderboards. Each member is stored with a score. Add/update operations, rank queries, and list extractions are performed in O(log N) complexity, handling millions of active players.',
    code: `// Add or update player score in leaderboard ZSET
await redis.zadd("leaderboard:global", score, userId);

// Extract top 10 players with scores
const top10 = await redis.zrevrange(
  "leaderboard:global", 0, 9, "WITHSCORES"
);

// Fetch a specific player rank (0-indexed)
const rank = await redis.zrevrank(
  "leaderboard:global", userId
);

// Increment user score dynamically
await redis.zincrby("leaderboard:global", 100, userId);`,
    cmds: 'ZADD leaderboard 9500 user:alice\nZREVRANGE leaderboard 0 9 WITHSCORES\nZREVRANK leaderboard user:alice\nZINCRBY leaderboard 100 user:alice',
    svgColor: '#854d0e', svgFill: '#fef9c3', svgStroke: '#fde047'
  },
  ratelimit: {
    label: '🚦 Rate Limiting',
    desc: 'Implement atomic sliding window rate limiting. Each client IP or API key maps to an atomic counter key with a specific TTL. If the incremented counter exceeds the limit, the request is rejected. Atomic operations prevent concurrent race conditions.',
    title: '🚦 Rate Limiting',
    code: `async function rateLimit(userId, limit=100) {
  const key = \`rate:\${userId}:\${Math.floor(Date.now()/60000)}\`;
  
  const count = await redis.incr(key);
  
  if (count === 1) {
    // New window - set 1-minute TTL
    await redis.expire(key, 60);
  }
  
  if (count > limit) {
    throw new Error(\`Rate limit exceeded: \${count}/\${limit}\`);
  }
  
  return { allowed: true, remaining: limit - count };
}`,
    cmds: 'INCR rate:user123:28500\nEXPIRE rate:user123:28500 60\nGET rate:user123:28500\n-- Atomic single-command strategy:\nSET rate:user123 0 EX 60 NX\nINCR rate:user123',
    svgColor: '#15803d', svgFill: '#dcfce7', svgStroke: '#86efac'
  },
  pubsub: {
    label: '📡 Pub/Sub',
    title: '📡 Pub/Sub Messaging',
    desc: 'Redis Pub/Sub enables sub-millisecond decoupled message broadcasting. Publishers send messages to named channels, and subscribed consumers receive them instantly. Perfect for real-time notification microservices, live dashboards, and chat engines.',
    code: `// Publisher service (e.g., Checkout Service)
const publisher = new Redis();
await publisher.publish(
  "orders:new",
  JSON.stringify({ orderId, userId, total })
);

// Subscriber service (e.g., Email Dispatcher)
const subscriber = new Redis();
await subscriber.subscribe("orders:new");

subscriber.on("message", (channel, message) => {
  const order = JSON.parse(message);
  sendNotificationEmail(order.userId);
  updateLiveFeed(order);
});`,
    cmds: 'PUBLISH orders:new {json}\nSUBSCRIBE orders:new\nPSUBSCRIBE orders:*  ← pattern glob subscribe\nUNSUBSCRIBE orders:new',
    svgColor: '#7c3aed', svgFill: '#faf5ff', svgStroke: '#c4b5fd'
  },
  queue: {
    label: '📋 Job Queue',
    title: '📋 Job Queue (FIFO)',
    desc: 'Redis Lists serve as efficient FIFO queues. Producers use LPUSH to enqueue new jobs. Consumers run blocking BRPOP to pop jobs from the list. Blocking pops eliminate polling overhead, keeping CPU usage minimal under empty queues.',
    code: `// Producer: add task to background worker queue
await redis.lpush(
  "queue:emails",
  JSON.stringify({ to, subject, body, jobId })
);

// Consumer: blocking pop worker loop
while (true) {
  // Block up to 30s waiting for a new item
  const [queue, job] = await redis.brpop(
    "queue:emails", 30
  );
  
  if (job) {
    const { to, subject, body } = JSON.parse(job);
    await sendTransactionalEmail(to, subject, body);
  }
}`,
    cmds: 'LPUSH queue:emails {job}\nBRPOP queue:emails 30  ← blocking wait\nLLEN queue:emails  ← check queue depth\nLRANGE queue:emails 0 -1  ← slice examine',
    svgColor: '#0369a1', svgFill: '#e0f2fe', svgStroke: '#7dd3fc'
  }
};

const strategies = {
  lazy: {
    text: 'LAZY LOADING (Cache-Aside) — Most common pattern\n\n1. App checks cache: GET user:123\n2. Cache HIT → return data immediately ✅\n3. Cache MISS → query DB\n4. Store result: SET user:123 {data} EX 300\n5. Return data to user\n\nPros: Only caches what is needed\nCons: First request always slow (cold start)\nTTL: Set expiry to avoid stale data'
  },
  write: {
    text: 'WRITE-THROUGH — Write to cache + DB together\n\n1. App writes data to DB\n2. Simultaneously writes to cache\n3. Cache always has fresh data\n4. Reads always hit cache ✅\n\nPros: No stale data, cache always warm\nCons: Write latency increases (2 writes)\nCons: Cache may hold data never read\nBest for: Write-heavy + read-heavy workloads'
  },
  ttl: {
    text: 'TTL EVICTION — Time-based cache expiry\n\nSET product:456 {data} EX 600  ← 10 min TTL\nSET session:abc {token} EX 3600 ← 1 hour TTL\nSET rate:user:789 1 EX 60       ← 1 min window\n\nEviction policies (when memory full):\n• allkeys-lru   → evict least recently used\n• volatile-lru  → evict LRU with TTL set\n• allkeys-lfu   → evict least frequently used\n• noeviction    → return error (sessions!)'
  }
};

export default function ElastiCacheVisualizer() {
  const [activeSection, setActiveSection] = useState<TabType>('concept');
  const [strategy, setStrategy] = useState<'lazy' | 'write' | 'ttl'>('lazy');
  const [activeUsecase, setActiveUsecase] = useState<keyof typeof ucData>('session');
  
  const [secChecks, setSecChecks] = useState([
    {label:'TLS in transit enabled',done:true},
    {label:'Redis AUTH token set',done:true},
    {label:'ElastiCache in private subnet',done:true},
    {label:'No public access',done:true},
    {label:'Security Group: port 6379 only',done:false},
    {label:'Encryption at rest (KMS)',done:false},
    {label:'RBAC users configured',done:false},
    {label:'CloudTrail logging',done:true},
    {label:'Backup/snapshot enabled',done:false},
    {label:'Multi-AZ failover ON',done:false},
  ]);

  // Cache simulator states
  const [hitRate, setHitRate] = useState(80);
  const [rps, setRps] = useState(1000);
  const [isRunning, setIsRunning] = useState(false);
  const [simLogs, setSimLogs] = useState<string[]>([]);
  
  const toggleSecCheck = (index: number) => {
    setSecChecks(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], done: !copy[index].done };
      return copy;
    });
  };

  const logSimEvent = (msg: string) => {
    setSimLogs(prev => {
      const time = new Date().toLocaleTimeString();
      return [`[${time}] ${msg}`, ...prev.slice(0, 15)];
    });
  };

  // Setup simulator statistics
  const simulatedHits = Math.round(rps * hitRate / 100);
  const simulatedMisses = rps - simulatedHits;
  const simulatedLatency = ((simulatedHits * 0.1 + simulatedMisses * 20) / rps).toFixed(1);

  const startSim = () => {
    if (isRunning) return;
    setIsRunning(true);
    logSimEvent('▶ Cache simulator started. Generating live request streams...');
  };

  const stopSim = () => {
    if (!isRunning) return;
    setIsRunning(false);
    logSimEvent('⏹ Cache simulator stopped.');
  };

  const clearLog = () => {
    setSimLogs([]);
  };

  // Interval loop for live log streaming when running
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        const randKey = Math.floor(Math.random() * 900 + 100);
        const label = `GET user:${randKey}`;
        const isHit = Math.random() * 100 < hitRate;
        if (isHit) {
          logSimEvent(`${label} → Cache HIT (0.1ms) ✅`);
        } else {
          logSimEvent(`${label} → Cache MISS ❌ → Query DB (25ms) → Write-back Cache 💾`);
        }
      }, Math.max(150, 2000 - Math.round(rps / 5.5))); // Speed scales with RPS
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, hitRate, rps]);

  return (
    <div>
      <style>{`
        .ec-nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
        .ec-pill{border:1px solid #cbd5e1;border-radius:999px;padding:6px 12px;font-size:12px;color:#475569;background:rgba(255,255,255,0.8);cursor:pointer;transition:all .15s;font-weight:500}
        .ec-pill.active{background:#dc2626;border-color:#dc2626;color:#fff;box-shadow:0 2px 4px rgba(220,38,38,0.2)}
        .ec-sec{font-size:11px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:.05em;margin:16px 0 8px;border-bottom:1px solid #e2e8f0;padding-bottom:4px}
        .ec-card{border:1px solid #e2e8f0;border-radius:16px;padding:14px 16px;background:rgba(255,255,255,0.85);backdrop-filter:blur(8px);box-shadow:0 4px 6px -1px rgba(0,0,0,0.03),0 2px 4px -1px rgba(0,0,0,0.02);margin-bottom:12px}
        .ec-kv{display:flex;gap:8px;font-size:12px;margin:6px 0;align-items:baseline}
        .ec-kk{min-width:145px;color:#475569;font-weight:600;flex-shrink:0}
        .ec-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .ec-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
        .ec-met{background:#f8fafc;border-radius:12px;padding:10px;text-align:center;border:1px solid #e2e8f0}
        ul.ec-ck li{font-size:12px;margin-bottom:6px;list-style:none;padding-left:18px;position:relative;color:#334155}
        ul.ec-ck li::before{content:"✓";position:absolute;left:0;color:#15803d;font-weight:700}
        .ec-log{border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;background:#f8fafc;color:#1e293b;font-size:11px;font-family:var(--font-mono,monospace);min-height:60px;white-space:pre-wrap;line-height:1.5;box-shadow:inset 0 1px 2px rgba(0,0,0,0.03)}
        .ec-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 18px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 12px; }
        .ec-tb { padding: 6px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 12px; cursor: pointer; background: rgba(255,255,255,0.8); color: #475569; transition: all 0.15s ease-in-out; outline: none; font-weight: 500; }
        .ec-tb:hover { background: #f1f5f9; border-color: #94a3b8; color: #0f172a; }
        .ec-tb.on { background: #16a34a; color: #fff; border-color: #16a34a; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2); }
        button.ec-btn{font-size:12px;padding:6px 14px;border-radius:8px;border:1px solid #cbd5e1;background:#fff;color:#475569;cursor:pointer;transition:all .15s;font-weight:500}
        button.ec-btn:hover{background:#f8fafc;color:#0f172a;border-color:#94a3b8}
        button.ec-btn.primary{background:#dc2626;border-color:#dc2626;color:#fff;box-shadow:0 2px 4px rgba(220,38,38,0.15)}
        button.ec-btn.primary:hover{background:#b91c1c;border-color:#b91c1c;color:#fff}
        .ec-svg-bg {
          background-color: #f8fafc;
          background-image: radial-gradient(#cbd5e1 1.2px, transparent 1.2px);
          background-size: 14px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
        }
      `}</style>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">⚡ AWS ElastiCache Visualizer</h1>
        <p className="text-slate-600">Explore fully managed in-memory cache architectures, Redis vs Memcached parameters, and cache strategies.</p>
      </div>

      <div className="ec-tabs">
        <button className={`ec-tb ${activeSection === 'concept' ? 'on' : ''}`} onClick={() => setActiveSection('concept')}>💡 Concept &amp; Overview</button>
        <button className={`ec-tb ${activeSection === 'compare' ? 'on' : ''}`} onClick={() => setActiveSection('compare')}>⚖️ Redis vs Memcached</button>
        <button className={`ec-tb ${activeSection === 'arch' ? 'on' : ''}`} onClick={() => setActiveSection('arch')}>🏗️ Architecture</button>
        <button className={`ec-tb ${activeSection === 'usecases' ? 'on' : ''}`} onClick={() => setActiveSection('usecases')}>🎯 Use Cases</button>
        <button className={`ec-tb ${activeSection === 'security' ? 'on' : ''}`} onClick={() => setActiveSection('security')}>🔒 Security &amp; Auth</button>
        <button className={`ec-tb ${activeSection === 'sim' ? 'on' : ''}`} onClick={() => setActiveSection('sim')}>🎮 Cache Simulator</button>
      </div>

      <div className="bg-slate-50/60 backdrop-blur-md rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        {activeSection === 'concept' && (
          <div id="pnl-concept">
            <div className="ec-g2" style={{ marginBottom: '10px' }}>
              <div>
                <div className="ec-sec">What is ElastiCache?</div>
                <svg width="100%" viewBox="0 0 340 420" className="ec-svg-bg" style={{ display: 'block' }}>
                  <defs>
                    <marker id="ec1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#b91c1c"/></marker>
                    <marker id="ec2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#047857"/></marker>
                    <marker id="ec3" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#475569"/></marker>
                  </defs>
                  
                  {/* Step 1: User Request */}
                  <rect x="15" y="15" width="310" height="52" rx="10" fill="rgba(239, 68, 68, 0.05)" stroke="#f87171" strokeWidth="1.5"/>
                  <text x="170" y="36" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="600">🌐 User Request (Axios / App)</text>
                  <text x="170" y="50" textAnchor="middle" fontSize="10.5" fill="#c2410c" fontFamily="monospace">GET /product/123 · GET /user/profile</text>
 
                  {/* Step 2: Application Server */}
                  <rect x="15" y="93" width="310" height="52" rx="10" fill="rgba(249, 115, 22, 0.05)" stroke="#fb923c" strokeWidth="1.5"/>
                  <text x="170" y="114" textAnchor="middle" fontSize="12" fill="#9a3412" fontWeight="600">🖥️ Application Server / Lambda</text>
                  <text x="170" y="128" textAnchor="middle" fontSize="10.5" fill="#7c2d12">Checks cache first before hitting DB</text>
 
                  {/* Step 3a: ElastiCache */}
                  <rect x="15" y="172" width="144" height="72" rx="10" fill="rgba(234, 179, 8, 0.05)" stroke="#facc15" strokeWidth="1.5"/>
                  <text x="87" y="196" textAnchor="middle" fontSize="13" fill="#854d0e" fontWeight="bold">⚡ ElastiCache</text>
                  <text x="87" y="214" textAnchor="middle" fontSize="10.5" fill="#713f12" fontWeight="500">In-Memory Store</text>
                  <text x="87" y="228" textAnchor="middle" fontSize="10" fill="#a16207" fontFamily="monospace">~0.1ms latency</text>
 
                  {/* Step 3b: Relational DB */}
                  <rect x="181" y="172" width="144" height="72" rx="10" fill="rgba(59, 130, 246, 0.05)" stroke="#60a5fa" strokeWidth="1.5"/>
                  <text x="253" y="196" textAnchor="middle" fontSize="13" fill="#1e40af" fontWeight="bold">🗄️ RDS / Aurora</text>
                  <text x="253" y="214" textAnchor="middle" fontSize="10.5" fill="#1e3a8a" fontWeight="500">Persistent DB</text>
                  <text x="253" y="228" textAnchor="middle" fontSize="10" fill="#2563eb" fontFamily="monospace">~5–50ms latency</text>
 
                  {/* Step 4a: Cache Hit Path */}
                  <rect x="15" y="270" width="310" height="52" rx="10" fill="rgba(16, 185, 129, 0.05)" stroke="#34d399" strokeWidth="1.5"/>
                  <text x="170" y="291" textAnchor="middle" fontSize="12" fill="#065f46" fontWeight="600">✅ Cache HIT → Return instantly</text>
                  <text x="170" y="305" textAnchor="middle" fontSize="10.5" fill="#047857">No DB query · ~0.1ms · Saves cost + CPU</text>
 
                  {/* Step 4b: Cache Miss Path */}
                  <rect x="15" y="348" width="310" height="52" rx="10" fill="rgba(124, 58, 237, 0.05)" stroke="#a78bfa" strokeWidth="1.5"/>
                  <text x="170" y="369" textAnchor="middle" fontSize="12" fill="#5b21b6" fontWeight="600">❌ Cache MISS → Query DB → Write Cache</text>
                  <text x="170" y="383" textAnchor="middle" fontSize="10.5" fill="#6d28d9">DB hit once · Cache for next N requests</text>
 
                  {/* Connectors */}
                  <line x1="170" y1="67" x2="170" y2="93" stroke="#b91c1c" strokeWidth="1.5" markerEnd="url(#ec1)"/>
                  <line x1="110" y1="145" x2="87" y2="172" stroke="#854d0e" strokeWidth="1.5" markerEnd="url(#ec1)"/>
                  <line x1="230" y1="145" x2="253" y2="172" stroke="#475569" strokeWidth="1.5" markerEnd="url(#ec3)"/>
                  <line x1="87" y1="244" x2="87" y2="270" stroke="#047857" strokeWidth="1.5" markerEnd="url(#ec2)"/>
                  <line x1="253" y1="244" x2="253" y2="348" stroke="#5b21b6" strokeWidth="1.5" markerEnd="url(#ec1)"/>
                </svg>
              </div>
              <div>
                <div className="ec-sec">Core concept</div>
                <div className="ec-card" style={{ borderLeft: '3px solid #dc2626', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#dc2626' }}>🧠 What is it?</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>ElastiCache is a fully managed <b>in-memory data store</b> on AWS. It stores data in RAM instead of disk — making reads <b>10–100x faster</b> than a traditional database. Think of it as a super-fast scratchpad between your app and your DB.</div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid #854d0e', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#854d0e' }}>⚡ Why use it?</div>
                  <ul className="ec-ck">
                    <li>Reduce DB load by 90%+ on read-heavy apps</li>
                    <li>Sub-millisecond response times</li>
                    <li>Handle millions of requests/sec</li>
                    <li>Session storage (stateless apps)</li>
                    <li>Real-time leaderboards, pub/sub</li>
                  </ul>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid #1d4ed8', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#1d4ed8' }}>📦 Two engines</div>
                  <div className="ec-kv"><span className="ec-kk">Redis</span><b>Rich data types, persistence, cluster</b></div>
                  <div className="ec-kv"><span className="ec-kk">Memcached</span><b>Simple key-value, multi-thread, pure cache</b></div>
                  <div className="ec-kv"><span className="ec-kk">Valkey (new)</span><b>Open-source Redis fork (AWS default 2024+)</b></div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid #15803d' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#15803d' }}>📊 Key metrics</div>
                  <div className="ec-g3">
                    <div className="ec-met"><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Latency</div><div style={{ fontSize: '16px', fontWeight: 500, color: '#dc2626' }}>&lt;1ms</div></div>
                    <div className="ec-met"><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Throughput</div><div style={{ fontSize: '16px', fontWeight: 500, color: '#1d4ed8' }}>M req/s</div></div>
                    <div className="ec-met"><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>DB offload</div><div style={{ fontSize: '16px', fontWeight: 500, color: '#15803d' }}>~90%</div></div>
                  </div>
                </div>
                <div className="ec-sec">Cache strategies</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <button className="ec-btn" onClick={() => setStrategy('lazy')} style={strategy === 'lazy' ? { background: '#dc2626', color: '#fff', borderColor: '#dc2626' } : undefined}>Lazy Loading</button>
                  <button className="ec-btn" onClick={() => setStrategy('write')} style={strategy === 'write' ? { background: '#dc2626', color: '#fff', borderColor: '#dc2626' } : undefined}>Write-Through</button>
                  <button className="ec-btn" onClick={() => setStrategy('ttl')} style={strategy === 'ttl' ? { background: '#dc2626', color: '#fff', borderColor: '#dc2626' } : undefined}>TTL Eviction</button>
                </div>
                <div className="ec-log" style={{ whiteSpace: 'pre-wrap' }}>
                  {strategies[strategy].text}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'compare' && (
          <div id="pnl-compare">
            <div className="ec-sec">Redis vs Memcached — Full Comparison</div>
            <div className="ec-g2" style={{ marginBottom: '12px' }}>
              <div className="ec-card" style={{ border: '2px solid #dc2626' }}>
                <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '10px', color: '#dc2626' }}>🔴 Redis (Recommended)</div>
                <div className="ec-kv"><span className="ec-kk">Data types</span><b>String, Hash, List, Set, ZSet, Stream, Geo, HLL</b></div>
                <div className="ec-kv"><span className="ec-kk">Persistence</span><b>✅ RDB snapshots + AOF logs</b></div>
                <div className="ec-kv"><span className="ec-kk">Replication</span><b>✅ Primary + Read Replicas</b></div>
                <div className="ec-kv"><span className="ec-kk">Cluster mode</span><b>✅ Sharding across nodes</b></div>
                <div className="ec-kv"><span className="ec-kk">Pub/Sub</span><b>✅ Built-in messaging</b></div>
                <div className="ec-kv"><span className="ec-kk">Lua scripting</span><b>✅ Atomic operations</b></div>
                <div className="ec-kv"><span className="ec-kk">Transactions</span><b>✅ MULTI/EXEC</b></div>
                <div className="ec-kv"><span className="ec-kk">Sorted sets</span><b>✅ Leaderboards, rankings</b></div>
                <div className="ec-kv"><span className="ec-kk">Geo commands</span><b>✅ GEODIST, GEORADIUS</b></div>
                <div className="ec-kv"><span className="ec-kk">Streams</span><b>✅ Event sourcing, queues</b></div>
                <div className="ec-kv"><span className="ec-kk">Auth</span><b>✅ Redis AUTH + IAM + TLS</b></div>
                <div className="ec-kv"><span className="ec-kk">Multi-AZ</span><b>✅ Automatic failover</b></div>
                <div className="ec-kv"><span className="ec-kk">Backup</span><b>✅ Snapshots to S3</b></div>
                <div className="ec-kv"><span className="ec-kk">Threading</span><b>Single-threaded (I/O fast)</b></div>
                <div className="ec-kv"><span className="ec-kk">Best for</span><b>Sessions, leaderboards, queues, pub/sub, ML feature store</b></div>
              </div>
              <div className="ec-card" style={{ border: '0.5px solid var(--color-border-tertiary)' }}>
                <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '10px', color: '#0369a1' }}>🔵 Memcached</div>
                <div className="ec-kv"><span className="ec-kk">Data types</span><b>String only (key-value)</b></div>
                <div className="ec-kv"><span className="ec-kk">Persistence</span><b style={{ color: '#dc2626' }}>❌ Pure in-memory (data lost on restart)</b></div>
                <div className="ec-kv"><span className="ec-kk">Replication</span><b style={{ color: '#dc2626' }}>❌ No replication</b></div>
                <div className="ec-kv"><span className="ec-kk">Cluster mode</span><b>✅ Horizontal sharding (client-side)</b></div>
                <div className="ec-kv"><span className="ec-kk">Pub/Sub</span><b style={{ color: '#dc2626' }}>❌ Not supported</b></div>
                <div className="ec-kv"><span className="ec-kk">Lua scripting</span><b style={{ color: '#dc2626' }}>❌ Not supported</b></div>
                <div className="ec-kv"><span className="ec-kk">Transactions</span><b style={{ color: '#dc2626' }}>❌ Not supported</b></div>
                <div className="ec-kv"><span className="ec-kk">Sorted sets</span><b style={{ color: '#dc2626' }}>❌ Not supported</b></div>
                <div className="ec-kv"><span className="ec-kk">Geo commands</span><b style={{ color: '#dc2626' }}>❌ Not supported</b></div>
                <div className="ec-kv"><span className="ec-kk">Streams</span><b style={{ color: '#dc2626' }}>❌ Not supported</b></div>
                <div className="ec-kv"><span className="ec-kk">Auth</span><b>SASL (basic)</b></div>
                <div className="ec-kv"><span className="ec-kk">Multi-AZ</span><b style={{ color: '#dc2626' }}>❌ No failover</b></div>
                <div className="ec-kv"><span className="ec-kk">Backup</span><b style={{ color: '#dc2626' }}>❌ No snapshots</b></div>
                <div className="ec-kv"><span className="ec-kk">Threading</span><b>✅ Multi-threaded (CPU efficient)</b></div>
                <div className="ec-kv"><span className="ec-kk">Best for</span><b>Simple object caching, HTML fragments, high-throughput read cache</b></div>
              </div>
            </div>
            <div className="ec-sec">When to choose which?</div>
            <div className="ec-g2">
              <div className="ec-card" style={{ borderLeft: '3px solid #dc2626' }}>
                <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#dc2626' }}>Choose Redis when…</div>
                <ul className="ec-ck">
                  <li>You need persistence (data survives restart)</li>
                  <li>Session storage (user login state)</li>
                  <li>Leaderboards / rankings (sorted sets)</li>
                  <li>Real-time pub/sub messaging</li>
                  <li>Job queues (Lists as FIFO queue)</li>
                  <li>Geospatial queries</li>
                  <li>Multi-AZ high availability needed</li>
                  <li>Complex data structures (hashes, sets)</li>
                </ul>
              </div>
              <div className="ec-card" style={{ borderLeft: '3px solid #0369a1' }}>
                <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#0369a1' }}>Choose Memcached when…</div>
                <ul className="ec-ck">
                  <li>Pure simple object caching only</li>
                  <li>You need multi-threaded performance</li>
                  <li>Large cache nodes (scale out simply)</li>
                  <li>No need for persistence or replication</li>
                  <li>Caching HTML fragments or DB query results</li>
                  <li>Simplest possible setup</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'arch' && (
          <div id="pnl-arch">
            <div className="ec-sec">Redis Cluster Architecture (Multi-AZ)</div>
            <svg width="100%" viewBox="0 0 680 320" className="ec-svg-bg" style={{ display: 'block', marginBottom: '12px' }}>
              <defs>
                <marker id="aa1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#b91c1c"/></marker>
                <marker id="aa2" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#047857"/></marker>
              </defs>
              
              {/* Outer VPC frame */}
              <rect x="10" y="10" width="660" height="300" rx="16" fill="rgba(255, 255, 255, 0.4)" stroke="#cbd5e1" strokeWidth="1.5"/>
              <text x="340" y="30" textAnchor="middle" fontSize="12" fill="#1e293b" fontWeight="700">VPC — ElastiCache Redis Cluster (Cluster Mode Enabled)</text>

              {/* AZ-1 Subnet */}
              <rect x="25" y="44" width="190" height="250" rx="12" fill="rgba(255, 255, 255, 0.7)" stroke="#cbd5e1" strokeWidth="1"/>
              <text x="120" y="64" textAnchor="middle" fontSize="11" fill="#475569" fontWeight="bold">AZ-1 (us-east-1a)</text>
              <rect x="38" y="76" width="164" height="60" rx="8" fill="rgba(245, 158, 11, 0.05)" stroke="#fb923c" strokeWidth="1.5"/>
              <text x="120" y="96" textAnchor="middle" fontSize="12" fill="#78350f" fontWeight="bold">Primary Node</text>
              <text x="120" y="114" textAnchor="middle" fontSize="10.5" fill="#9a3412" fontFamily="monospace">Shard 1 · Slots 0–5460</text>
              <rect x="38" y="152" width="164" height="60" rx="8" fill="rgba(245, 158, 11, 0.05)" stroke="#fb923c" strokeWidth="1.5"/>
              <text x="120" y="172" textAnchor="middle" fontSize="12" fill="#78350f" fontWeight="bold">Primary Node</text>
              <text x="120" y="190" textAnchor="middle" fontSize="10.5" fill="#9a3412" fontFamily="monospace">Shard 2 · Slots 5461–10922</text>
              <rect x="38" y="228" width="164" height="52" rx="8" fill="rgba(16, 185, 129, 0.05)" stroke="#34d399" strokeWidth="1"/>
              <text x="120" y="248" textAnchor="middle" fontSize="11" fill="#065f46" fontWeight="600">Replica (from AZ-2)</text>
              <text x="120" y="264" textAnchor="middle" fontSize="9.5" fill="#047857" fontFamily="monospace">Shard 3 replica</text>

              {/* AZ-2 Subnet */}
              <rect x="245" y="44" width="190" height="250" rx="12" fill="rgba(255, 255, 255, 0.7)" stroke="#cbd5e1" strokeWidth="1"/>
              <text x="340" y="64" textAnchor="middle" fontSize="11" fill="#475569" fontWeight="bold">AZ-2 (us-east-1b)</text>
              <rect x="258" y="76" width="164" height="60" rx="8" fill="rgba(16, 185, 129, 0.05)" stroke="#34d399" strokeWidth="1"/>
              <text x="340" y="96" textAnchor="middle" fontSize="12" fill="#065f46" fontWeight="bold">Replica Node</text>
              <text x="340" y="114" textAnchor="middle" fontSize="10.5" fill="#047857" fontFamily="monospace">Shard 1 replica</text>
              <rect x="258" y="152" width="164" height="60" rx="8" fill="rgba(245, 158, 11, 0.05)" stroke="#fb923c" strokeWidth="1.5"/>
              <text x="340" y="172" textAnchor="middle" fontSize="12" fill="#78350f" fontWeight="bold">Primary Node</text>
              <text x="340" y="190" textAnchor="middle" fontSize="10.5" fill="#9a3412" fontFamily="monospace">Shard 3 · Slots 10923–16383</text>
              <rect x="258" y="228" width="164" height="52" rx="8" fill="rgba(16, 185, 129, 0.05)" stroke="#34d399" strokeWidth="1"/>
              <text x="340" y="248" textAnchor="middle" fontSize="11" fill="#065f46" fontWeight="600">Replica (from AZ-1)</text>
              <text x="340" y="264" textAnchor="middle" fontSize="9.5" fill="#047857" fontFamily="monospace">Shard 2 replica</text>

              {/* AZ-3 Subnet */}
              <rect x="465" y="44" width="190" height="250" rx="12" fill="rgba(255, 255, 255, 0.7)" stroke="#cbd5e1" strokeWidth="1"/>
              <text x="560" y="64" textAnchor="middle" fontSize="11" fill="#475569" fontWeight="bold">AZ-3 (us-east-1c)</text>
              <rect x="478" y="76" width="164" height="60" rx="8" fill="rgba(139, 92, 246, 0.05)" stroke="#a78bfa" strokeWidth="1"/>
              <text x="560" y="96" textAnchor="middle" fontSize="12" fill="#5b21b6" fontWeight="bold">Replica Node</text>
              <text x="560" y="114" textAnchor="middle" fontSize="10.5" fill="#6d28d9" fontFamily="monospace">Shard 2 replica</text>
              <rect x="478" y="152" width="164" height="60" rx="8" fill="rgba(139, 92, 246, 0.05)" stroke="#a78bfa" strokeWidth="1"/>
              <text x="560" y="172" textAnchor="middle" fontSize="12" fill="#5b21b6" fontWeight="bold">Replica Node</text>
              <text x="560" y="190" textAnchor="middle" fontSize="10.5" fill="#6d28d9" fontFamily="monospace">Shard 3 replica</text>
              <rect x="478" y="228" width="164" height="52" rx="8" fill="rgba(245, 158, 11, 0.05)" stroke="#fb923c" strokeWidth="1.5"/>
              <text x="560" y="248" textAnchor="middle" fontSize="11" fill="#78350f" fontWeight="bold">Primary Node</text>
              <text x="560" y="264" textAnchor="middle" fontSize="9.5" fill="#9a3412" fontFamily="monospace">Shard 1 replica</text>

              {/* Replication links */}
              <line x1="202" y1="106" x2="258" y2="106" stroke="#b91c1c" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#aa1)"/>
              <line x1="202" y1="182" x2="258" y2="182" stroke="#b91c1c" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#aa1)"/>
              <line x1="422" y1="106" x2="478" y2="106" stroke="#047857" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#aa2)"/>
              <line x1="422" y1="182" x2="478" y2="182" stroke="#047857" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#aa2)"/>
            </svg>

            <div className="ec-g2" style={{ marginBottom: '10px' }}>
              <div>
                <div className="ec-sec">Full Infrastructure Integration</div>
                <svg width="100%" viewBox="0 0 340 460" className="ec-svg-bg" style={{ display: 'block' }}>
                  <defs>
                    <marker id="ai1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#475569"/></marker>
                  </defs>
                  
                  {/* CloudFront */}
                  <rect x="15" y="15" width="310" height="44" rx="10" fill="rgba(124, 58, 237, 0.05)" stroke="#c4b5fd" strokeWidth="1.5"/>
                  <text x="170" y="41" textAnchor="middle" fontSize="12" fill="#5b21b6" fontWeight="bold">🌐 CloudFront CDN / Route 53</text>

                  {/* ALB */}
                  <rect x="15" y="85" width="310" height="44" rx="10" fill="rgba(249, 115, 22, 0.05)" stroke="#fed7aa" strokeWidth="1.5"/>
                  <text x="170" y="111" textAnchor="middle" fontSize="12" fill="#9a3412" fontWeight="bold">⚖️ ALB (Application Load Balancer)</text>

                  {/* Compute */}
                  <rect x="15" y="155" width="144" height="44" rx="10" fill="rgba(59, 130, 246, 0.05)" stroke="#93c5fd" strokeWidth="1.5"/>
                  <text x="87" y="181" textAnchor="middle" fontSize="11" fill="#1e40af" fontWeight="bold">EC2 / ECS App</text>
                  <rect x="181" y="155" width="144" height="44" rx="10" fill="rgba(59, 130, 246, 0.05)" stroke="#93c5fd" strokeWidth="1.5"/>
                  <text x="253" y="181" textAnchor="middle" fontSize="11" fill="#1e40af" fontWeight="bold">Lambda Functions</text>

                  {/* ElastiCache */}
                  <rect x="80" y="225" width="180" height="52" rx="10" fill="rgba(234, 179, 8, 0.05)" stroke="#fde047" strokeWidth="1.5"/>
                  <text x="170" y="247" textAnchor="middle" fontSize="13" fill="#854d0e" fontWeight="bold">⚡ ElastiCache</text>
                  <text x="170" y="265" textAnchor="middle" fontSize="11" fill="#713f12" fontWeight="500">Redis / Memcached</text>

                  {/* RDS Primary */}
                  <rect x="15" y="305" width="144" height="52" rx="10" fill="rgba(16, 185, 129, 0.05)" stroke="#86efac" strokeWidth="1.5"/>
                  <text x="87" y="327" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="bold">🗄️ RDS / Aurora</text>
                  <text x="87" y="345" textAnchor="middle" fontSize="11" fill="#166534" fontWeight="500">Primary DB</text>
                  
                  {/* S3 Storage */}
                  <rect x="181" y="305" width="144" height="52" rx="10" fill="rgba(139, 92, 246, 0.05)" stroke="#c4b5fd" strokeWidth="1.5"/>
                  <text x="253" y="327" textAnchor="middle" fontSize="12" fill="#6d28d9" fontWeight="bold">📦 S3 / DynamoDB</text>
                  <text x="253" y="345" textAnchor="middle" fontSize="11" fill="#5b21b6" fontWeight="500">Object / NoSQL</text>

                  {/* CloudWatch Monitor */}
                  <rect x="15" y="385" width="310" height="44" rx="10" fill="rgba(20, 184, 166, 0.05)" stroke="#5eead4" strokeWidth="1.5"/>
                  <text x="170" y="411" textAnchor="middle" fontSize="12" fill="#0f766e" fontWeight="bold">📊 CloudWatch · X-Ray · SNS Alerts</text>

                  {/* Conduits */}
                  <line x1="170" y1="59" x2="170" y2="85" stroke="#475569" strokeWidth="1.5" markerEnd="url(#ai1)"/>
                  <line x1="120" y1="129" x2="87" y2="155" stroke="#475569" strokeWidth="1.5" markerEnd="url(#ai1)"/>
                  <line x1="220" y1="129" x2="253" y2="155" stroke="#475569" strokeWidth="1.5" markerEnd="url(#ai1)"/>
                  <line x1="87" y1="199" x2="130" y2="225" stroke="#475569" strokeWidth="1.5" markerEnd="url(#ai1)"/>
                  <line x1="253" y1="199" x2="210" y2="225" stroke="#475569" strokeWidth="1.5" markerEnd="url(#ai1)"/>
                  <line x1="130" y1="277" x2="87" y2="305" stroke="#475569" strokeWidth="1.5" markerEnd="url(#ai1)"/>
                  <line x1="210" y1="277" x2="253" y2="305" stroke="#475569" strokeWidth="1.5" markerEnd="url(#ai1)"/>
                  <line x1="87" y1="357" x2="87" y2="385" stroke="#475569" strokeWidth="1.5" markerEnd="url(#ai1)"/>
                </svg>
              </div>
              <div>
                <div className="ec-sec">Redis Cluster vs Replication Group</div>
                <div className="ec-card" style={{ borderLeft: '3px solid #dc2626', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#dc2626' }}>Cluster Mode DISABLED (Replication Group)</div>
                  <div className="ec-kv"><span className="ec-kk">Shards</span><b>1 shard only</b></div>
                  <div className="ec-kv"><span className="ec-kk">Replicas</span><b>Up to 5 read replicas</b></div>
                  <div className="ec-kv"><span className="ec-kk">Failover</span><b>✅ Auto-failover to replica</b></div>
                  <div className="ec-kv"><span className="ec-kk">Scale</span><b>Vertical (change node type)</b></div>
                  <div className="ec-kv"><span className="ec-kk">Max data</span><b>Limited to 1 node memory</b></div>
                  <div className="ec-kv"><span className="ec-kk">Best for</span><b>Sessions, small-medium datasets</b></div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid #15803d', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#15803d' }}>Cluster Mode ENABLED</div>
                  <div className="ec-kv"><span className="ec-kk">Shards</span><b>Up to 500 shards</b></div>
                  <div className="ec-kv"><span className="ec-kk">Slots</span><b>16,384 hash slots distributed</b></div>
                  <div className="ec-kv"><span className="ec-kk">Replicas</span><b>0–5 per shard</b></div>
                  <div className="ec-kv"><span className="ec-kk">Scale</span><b>Horizontal (add shards online)</b></div>
                  <div className="ec-kv"><span className="ec-kk">Max data</span><b>Virtually unlimited</b></div>
                  <div className="ec-kv"><span className="ec-kk">Best for</span><b>Large datasets, high write throughput</b></div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid #0369a1' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#0369a1' }}>Memcached Architecture</div>
                  <div className="ec-kv"><span className="ec-kk">Nodes</span><b>1–40 nodes per cluster</b></div>
                  <div className="ec-kv"><span className="ec-kk">Sharding</span><b>Client-side (consistent hashing)</b></div>
                  <div className="ec-kv"><span className="ec-kk">Replication</span><b style={{ color: '#dc2626' }}>❌ None</b></div>
                  <div className="ec-kv"><span className="ec-kk">Failover</span><b style={{ color: '#dc2626' }}>❌ Node loss = data loss</b></div>
                  <div className="ec-kv"><span className="ec-kk">Scale</span><b>Add/remove nodes (auto-discovery)</b></div>
                  <div className="ec-kv"><span className="ec-kk">Best for</span><b>Ephemeral cache, HTML fragments</b></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'usecases' && (
          <div id="pnl-usecases">
            <div className="ec-sec">Click a use case to see architecture + code pattern</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {(Object.keys(ucData) as Array<keyof typeof ucData>).map((key) => (
                <button 
                  key={key}
                  className="ec-btn"
                  onClick={() => setActiveUsecase(key)}
                  style={{
                    fontSize: '11px',
                    padding: '5px 12px',
                    background: activeUsecase === key ? '#16a34a' : undefined,
                    color: activeUsecase === key ? '#fff' : undefined,
                    borderColor: activeUsecase === key ? '#16a34a' : undefined,
                    boxShadow: activeUsecase === key ? '0 2px 4px rgba(22, 163, 74, 0.15)' : undefined
                  }}
                >
                  {ucData[key].label}
                </button>
              ))}
            </div>
            <div className="ec-g2">
              <div>
                <svg width="100%" viewBox="0 0 340 300" className="ec-svg-bg" style={{ display: 'block' }}>
                  <defs>
                    <marker id="ucarr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L6,3 z" fill="#475569" />
                    </marker>
                  </defs>
                  
                  {/* App / Lambda */}
                  <rect x="15" y="15" width="310" height="52" rx="10" fill="rgba(255, 255, 255, 0.75)" stroke="#cbd5e1" strokeWidth="1.5" />
                  <text x="170" y="36" textAnchor="middle" fontSize="12" fill="#1e293b" fontWeight="bold">🌐 App / Lambda</text>
                  <text x="170" y="50" textAnchor="middle" fontSize="10.5" fill="#475569">Client request</text>
                  
                  {/* ElastiCache Redis */}
                  <rect x="80" y="93" width="180" height="52" rx="10" fill="rgba(234, 179, 8, 0.05)" stroke="#facc15" strokeWidth="1.5" />
                  <text x="170" y="115" textAnchor="middle" fontSize="13" fill="#854d0e" fontWeight="bold">⚡ ElastiCache Redis</text>
                  <text x="170" y="131" textAnchor="middle" fontSize="10.5" fill="#713f12" fontWeight="500">{ucData[activeUsecase].title}</text>
                  
                  {/* DB Relational */}
                  <rect x="80" y="171" width="180" height="52" rx="10" fill="rgba(59, 130, 246, 0.05)" stroke="#60a5fa" strokeWidth="1.5" />
                  <text x="170" y="193" textAnchor="middle" fontSize="12" fill="#1e40af" fontWeight="bold">🗄️ RDS / DynamoDB</text>
                  <text x="170" y="209" textAnchor="middle" fontSize="10.5" fill="#2563eb" fontWeight="500">Source of truth (on miss)</text>
                  
                  {/* Connections */}
                  <line x1="170" y1="67" x2="170" y2="93" stroke="#475569" strokeWidth="1.5" markerEnd="url(#ucarr)" />
                  <line x1="170" y1="145" x2="170" y2="171" stroke="#475569" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#ucarr)" />
                  
                  {/* HIT */}
                  <rect x="15" y="248" width="144" height="40" rx="8" fill="rgba(16, 185, 129, 0.05)" stroke="#34d399" strokeWidth="1.5" />
                  <text x="87" y="273" textAnchor="middle" fontSize="11" fill="#065f46" fontWeight="bold">✅ HIT → &lt;1ms</text>
                  
                  {/* MISS */}
                  <rect x="181" y="248" width="144" height="40" rx="8" fill="rgba(239, 68, 68, 0.05)" stroke="#f87171" strokeWidth="1.5" />
                  <text x="253" y="273" textAnchor="middle" fontSize="11" fill="#991b1b" fontWeight="bold">❌ MISS → DB query</text>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '8px', color: 'var(--color-text-primary)' }}>{ucData[activeUsecase].title}</div>
                <div className="ec-card" style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>{ucData[activeUsecase].desc}</div>
                <div className="ec-sec">Code Pattern</div>
                <div className="ec-log" style={{ whiteSpace: 'pre-wrap' }}>{ucData[activeUsecase].code}</div>
                <div className="ec-sec">Key Redis Commands</div>
                <div className="ec-log" style={{ whiteSpace: 'pre-wrap' }}>{ucData[activeUsecase].cmds}</div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'security' && (
          <div id="pnl-security">
            <div className="ec-g2" style={{ marginBottom: '10px' }}>
              <div>
                <div className="ec-sec">ElastiCache Security Architecture</div>
                <svg width="100%" viewBox="0 0 340 460" className="ec-svg-bg" style={{ display: 'block' }}>
                  <defs>
                    <marker id="as1" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#475569"/></marker>
                  </defs>
                  
                  {/* Outer boundary */}
                  <rect x="10" y="10" width="320" height="440" rx="16" fill="rgba(255, 255, 255, 0.4)" stroke="#cbd5e1" strokeWidth="1.5"/>
                  <text x="170" y="30" textAnchor="middle" fontSize="12" fill="#1e293b" fontWeight="700">VPC Security Boundary</text>

                  {/* App Subnet */}
                  <rect x="25" y="44" width="290" height="48" rx="10" fill="rgba(239, 68, 68, 0.05)" stroke="#fca5a5" strokeWidth="1.5"/>
                  <text x="170" y="64" textAnchor="middle" fontSize="12" fill="#991b1b" fontWeight="bold">🌐 App / Lambda / EC2</text>
                  <text x="170" y="80" textAnchor="middle" fontSize="10.5" fill="#c2410c">Client in same VPC (private subnet)</text>

                  {/* TLS */}
                  <rect x="25" y="110" width="290" height="48" rx="10" fill="rgba(124, 58, 237, 0.05)" stroke="#c4b5fd" strokeWidth="1.5"/>
                  <text x="170" y="130" textAnchor="middle" fontSize="12" fill="#5b21b6" fontWeight="bold">🔒 TLS in Transit</text>
                  <text x="170" y="146" textAnchor="middle" fontSize="10.5" fill="#6d28d9">Redis 6+ · TLS 1.2+ · in-transit encryption</text>

                  {/* Security Groups */}
                  <rect x="25" y="176" width="290" height="48" rx="10" fill="rgba(249, 115, 22, 0.05)" stroke="#fed7aa" strokeWidth="1.5"/>
                  <text x="170" y="196" textAnchor="middle" fontSize="12" fill="#9a3412" fontWeight="bold">🛡️ Security Groups</text>
                  <text x="170" y="212" textAnchor="middle" fontSize="10.5" fill="#c2410c">Port 6379 (Redis) / 11211 (Memcached) · App SG only</text>

                  {/* Authentication */}
                  <rect x="25" y="242" width="290" height="80" rx="10" fill="rgba(16, 185, 129, 0.05)" stroke="#86efac" strokeWidth="1.5"/>
                  <text x="170" y="262" textAnchor="middle" fontSize="12" fill="#065f46" fontWeight="bold">🔑 Authentication</text>
                  <rect x="38" y="274" width="120" height="34" rx="6" fill="#ffffff" stroke="#a7f3d0" strokeWidth="1"/>
                  <text x="98" y="289" textAnchor="middle" fontSize="10.5" fill="#047857" fontWeight="600">Redis AUTH</text>
                  <text x="98" y="302" textAnchor="middle" fontSize="9.5" fill="#065f46">Token password</text>
                  <rect x="172" y="274" width="128" height="34" rx="6" fill="#ffffff" stroke="#a7f3d0" strokeWidth="1"/>
                  <text x="236" y="289" textAnchor="middle" fontSize="10.5" fill="#047857" fontWeight="600">IAM Auth (Redis 7+)</text>
                  <text x="236" y="302" textAnchor="middle" fontSize="9.5" fill="#065f46">Token-based</text>

                  {/* Encryption at Rest */}
                  <rect x="25" y="340" width="290" height="48" rx="10" fill="rgba(20, 184, 166, 0.05)" stroke="#5eead4" strokeWidth="1.5"/>
                  <text x="170" y="360" textAnchor="middle" fontSize="12" fill="#0f766e" fontWeight="bold">🔐 Encryption at Rest (KMS)</text>
                  <text x="170" y="376" textAnchor="middle" fontSize="10.5" fill="#0d9488">Redis data on disk · Snapshots · aws/elasticache or CMK</text>

                  {/* Private Subnets */}
                  <rect x="25" y="406" width="290" height="36" rx="8" fill="rgba(59, 130, 246, 0.05)" stroke="#93c5fd" strokeWidth="1.5"/>
                  <text x="170" y="428" textAnchor="middle" fontSize="11" fill="#1e40af" fontWeight="600">Subnet Groups · No public access · CloudTrail audit</text>

                  {/* Connectors */}
                  <line x1="170" y1="92" x2="170" y2="110" stroke="#475569" strokeWidth="1.5" markerEnd="url(#as1)"/>
                  <line x1="170" y1="158" x2="170" y2="176" stroke="#475569" strokeWidth="1.5" markerEnd="url(#as1)"/>
                  <line x1="170" y1="224" x2="170" y2="242" stroke="#475569" strokeWidth="1.5" markerEnd="url(#as1)"/>
                  <line x1="170" y1="322" x2="170" y2="340" stroke="#475569" strokeWidth="1.5" markerEnd="url(#as1)"/>
                  <line x1="170" y1="388" x2="170" y2="406" stroke="#475569" strokeWidth="1.5" markerEnd="url(#as1)"/>
                </svg>
              </div>
              <div>
                <div className="ec-sec">Auth methods explained</div>
                <div className="ec-card" style={{ borderLeft: '3px solid #dc2626', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: '#dc2626' }}>🔑 Redis AUTH (Classic)</div>
                  <div className="ec-kv"><span className="ec-kk">How</span><b>Single password token set on cluster</b></div>
                  <div className="ec-kv"><span className="ec-kk">Command</span><b style={{ fontFamily: 'monospace', fontSize: '11px' }}>AUTH &lt;password&gt;</b></div>
                  <div className="ec-kv"><span className="ec-kk">Engines</span><b>Redis 2.8+</b></div>
                  <div className="ec-kv"><span className="ec-kk">Rotate</span><b>Via Secrets Manager + app update</b></div>
                  <div className="ec-kv"><span className="ec-kk">Limitation</span><b>Single shared password</b></div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid #15803d', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: '#15803d' }}>🔑 Redis RBAC (Redis 6+)</div>
                  <div className="ec-kv"><span className="ec-kk">How</span><b>Multiple users with ACL rules</b></div>
                  <div className="ec-kv"><span className="ec-kk">Permissions</span><b>Per-command, per-key-pattern</b></div>
                  <div className="ec-kv"><span className="ec-kk">Example</span><b>readonly user: GET only, no SET/DEL</b></div>
                  <div className="ec-kv"><span className="ec-kk">Best for</span><b>Multi-tenant, least-privilege access</b></div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid #7c3aed', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: '#7c3aed' }}>🔑 IAM Auth (Redis 7+ / Valkey)</div>
                  <div className="ec-kv"><span className="ec-kk">How</span><b>IAM role → temp token → Redis AUTH</b></div>
                  <div className="ec-kv"><span className="ec-kk">No password</span><b>Token auto-rotates (15 min TTL)</b></div>
                  <div className="ec-kv"><span className="ec-kk">Best for</span><b>Lambda, ECS, EC2 (no stored creds)</b></div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid #0f766e', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: '#0f766e' }}>🔐 Encryption at Rest</div>
                  <div className="ec-kv"><span className="ec-kk">Covers</span><b>RDB snapshots, AOF logs, swap files</b></div>
                  <div className="ec-kv"><span className="ec-kk">Key</span><b>aws/elasticache or Customer KMS CMK</b></div>
                  <div className="ec-kv"><span className="ec-kk">Enable when?</span><b style={{ color: '#dc2626' }}>At cluster creation only</b></div>
                  <div className="ec-kv"><span className="ec-kk">Memcached</span><b style={{ color: '#dc2626' }}>❌ No encryption at rest</b></div>
                </div>
                <div className="ec-sec">Security checklist (click to toggle)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '6px' }}>
                  {secChecks.map((item, idx) => (
                    <div 
                      key={idx}
                      onClick={() => toggleSecCheck(idx)}
                      style={{
                        border: '1px solid',
                        borderRadius: '10px',
                        padding: '8px 10px',
                        cursor: 'pointer',
                        borderColor: item.done ? '#86efac' : '#fca5a5',
                        background: item.done ? 'rgba(22, 163, 74, 0.04)' : 'rgba(239, 68, 68, 0.04)',
                        transition: 'all 0.15s ease-in-out'
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 600, color: item.done ? '#166534' : '#b91c1c' }}>
                        {item.done ? '✅ ' : '❌ '}{item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'sim' && (
          <div id="pnl-sim">
            <div className="ec-sec">Cache Hit/Miss Simulator — see how caching reduces DB load</div>
            <div className="ec-g2" style={{ marginBottom: '12px' }}>
              <div className="ec-card">
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px' }}>⚙️ Configure Cache</div>
                
                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>Cache Hit Rate (%)</div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={hitRate} 
                  style={{ width: '100%', accentColor: '#16a34a', cursor: 'ew-resize' }} 
                  onChange={(e) => setHitRate(Number(e.target.value))} 
                />
                <div style={{ fontSize: '12px', marginTop: '4px', marginBottom: '12px' }}>Hit rate: <b>{hitRate}%</b></div>
                
                <div style={{ fontSize: '12px', color: '#475569', margin: '8px 0 4px' }}>Requests per second</div>
                <input 
                  type="range" 
                  min="100" 
                  max="10000" 
                  step="100" 
                  value={rps} 
                  style={{ width: '100%', accentColor: '#16a34a', cursor: 'ew-resize' }} 
                  onChange={(e) => setRps(Number(e.target.value))} 
                />
                <div style={{ fontSize: '12px', marginTop: '4px' }}>RPS: <b>{rps}</b></div>
                
                <div className="ec-g2" style={{ marginTop: '16px' }}>
                  <div className="ec-met"><div style={{ fontSize: '11px', color: '#475569' }}>Cache hits/s</div><div style={{ fontSize: '16px', fontWeight: 600, color: '#15803d' }}>{simulatedHits}</div></div>
                  <div className="ec-met"><div style={{ fontSize: '11px', color: '#475569' }}>DB queries/s</div><div style={{ fontSize: '16px', fontWeight: 600, color: '#dc2626' }}>{simulatedMisses}</div></div>
                  <div className="ec-met"><div style={{ fontSize: '11px', color: '#475569' }}>Avg latency</div><div style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b' }}>{simulatedLatency}ms</div></div>
                  <div className="ec-met"><div style={{ fontSize: '11px', color: '#475569' }}>DB saved %</div><div style={{ fontSize: '16px', fontWeight: 600, color: '#15803d' }}>{hitRate}%</div></div>
                </div>
              </div>
              
              <div className="ec-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px' }}>📊 Request Flow Visualizer</div>
                
                <svg width="100%" viewBox="0 0 320 180" className="ec-svg-bg" style={{ display: 'block', borderRadius: '12px' }}>
                  {/* Static pipelines */}
                  <path d="M 75 90 Q 135 60 195 40" fill="none" stroke={isRunning ? "#cbd5e1" : "#e2e8f0"} strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M 75 90 Q 135 115 195 130" fill="none" stroke={isRunning ? "#cbd5e1" : "#e2e8f0"} strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M 235 65 L 235 110" fill="none" stroke={isRunning ? "#cbd5e1" : "#e2e8f0"} strokeWidth="1.5" strokeDasharray="3,3" />

                  {/* Cache HIT particle motion */}
                  {isRunning && hitRate > 0 && (
                    <circle r="3.5" fill="#10b981">
                      <animateMotion
                        dur={rps > 5000 ? "0.4s" : rps > 2000 ? "0.8s" : "1.4s"}
                        repeatCount="indefinite"
                        path="M 75 90 Q 135 60 195 40 Q 135 60 75 90"
                      />
                    </circle>
                  )}

                  {/* Cache MISS particle motion */}
                  {isRunning && hitRate < 100 && (
                    <circle r="3.5" fill="#ef4444">
                      <animateMotion
                        dur={rps > 5000 ? "0.6s" : rps > 2000 ? "1.2s" : "2.0s"}
                        repeatCount="indefinite"
                        path="M 75 90 Q 135 60 195 40 L 235 65 L 235 110 Q 135 115 75 90"
                      />
                    </circle>
                  )}

                  {/* Client App */}
                  <g transform="translate(15, 65)">
                    <rect width="60" height="50" rx="8" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="30" y="24" fontSize="9" fontWeight="bold" fill="#1e40af" textAnchor="middle">Client App</text>
                    <text x="30" y="38" fontSize="7.5" fill="#2563eb" textAnchor="middle" fontFamily="monospace">Active</text>
                  </g>

                  {/* ElastiCache Redis Cylinder */}
                  <g transform="translate(195, 20)">
                    <path d="M 0 10 L 0 35 A 40 10 0 0 0 80 35 L 80 10 Z" fill="rgba(234, 179, 8, 0.05)" stroke="#fbbf24" strokeWidth="1.5" />
                    <ellipse cx="40" cy="10" rx="40" ry="10" fill="#fef9c3" stroke="#fbbf24" strokeWidth="1.5" />
                    <text x="40" y="28" fontSize="9" fontWeight="bold" fill="#78350f" textAnchor="middle">⚡ Cache</text>
                    <text x="40" y="38" fontSize="7.5" fill="#a16207" textAnchor="middle" fontFamily="monospace">RAM &lt;1ms</text>
                    {isRunning && (
                      <circle cx="72" cy="10" r="2" fill="#10b981" className="led-blink" />
                    )}
                  </g>

                  {/* DB cylinder */}
                  <g transform="translate(195, 110)">
                    <path d="M 0 10 L 0 35 A 40 10 0 0 0 80 35 L 80 10 Z" fill="rgba(59, 130, 246, 0.05)" stroke="#60a5fa" strokeWidth="1.5" />
                    <ellipse cx="40" cy="10" rx="40" ry="10" fill="#dbeafe" stroke="#60a5fa" strokeWidth="1.5" />
                    <text x="40" y="28" fontSize="9" fontWeight="bold" fill="#1e40af" textAnchor="middle">🗄️ DB</text>
                    <text x="40" y="38" fontSize="7.5" fill="#2563eb" textAnchor="middle" fontFamily="monospace">Disk 20ms</text>
                    {isRunning && (
                      <circle cx="72" cy="10" r="2" fill="#3b82f6" />
                    )}
                  </g>
                </svg>

                <div style={{ marginTop: '8px', fontSize: '11px', color: '#475569' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#22c55e', borderRadius: '2px', marginRight: '4px' }}></span>Cache Hit (fast)
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px', marginRight: '4px', marginLeft: '12px' }}></span>DB Miss (slow)
                </div>
              </div>
            </div>
            
            <div className="ec-sec">Live Cache Request Log</div>
            <div className="ec-log" style={{ minHeight: '120px', maxHeight: '160px', overflowY: 'auto' }}>
              {simLogs.length === 0 ? 'Simulation inactive. Press "Start Simulation" to stream logs...' : simLogs.join('\n')}
            </div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
              <button className="ec-btn primary" onClick={startSim}>▶ Start Simulation</button>
              <button className="ec-btn" onClick={stopSim}>⏹ Stop</button>
              <button className="ec-btn" onClick={clearLog}>🗑 Clear Log</button>
            </div>
          </div>
        )}

        <div style={{ marginTop: '14px', textAlign: 'center' }}>
          <button 
            className="ec-btn"
            onClick={() => logSimEvent('Request: Terraform code for ElastiCache Redis cluster with Multi-AZ, cluster mode enabled, TLS, Redis AUTH, KMS encryption, and integration with Lambda and RDS')}
            style={{ padding: '8px 20px', borderRadius: '999px', fontSize: '12px', cursor: 'pointer' }}
          >
            Get full Terraform for ElastiCache Redis + Security + Integration ↗
          </button>
        </div>
      </div>
    </div>
  );
}
