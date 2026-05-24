import { useEffect, useRef, useState, useCallback } from 'react';

type TabType = 'concept' | 'compare' | 'arch' | 'usecases' | 'security' | 'sim';

interface Particle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: string;
  type: 'hit' | 'miss';
  state: 'to_cache' | 'to_db' | 'back_to_client';
  label: string;
}

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
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const particleIdRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const isRunningRef = useRef(isRunning);

  // Synchronize ref for callback access
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

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
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }
  };

  const clearLog = () => {
    setSimLogs([]);
  };

  // Canvas loop logic
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Node locations
    const clientX = 40;
    const clientY = 90;
    const cacheX = 220;
    const cacheY = 45;
    const dbX = 220;
    const dbY = 135;

    // Draw static nodes
    // 1. Client Node
    ctx.fillStyle = '#eff6ff';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(10, 65, 60, 50, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1d4ed8';
    ctx.font = '10px var(--font-sans)';
    ctx.textAlign = 'center';
    ctx.fillText('Client', 40, 90);
    ctx.fillText('App', 40, 102);

    // 2. ElastiCache Redis Node
    ctx.fillStyle = '#fef9c3';
    ctx.strokeStyle = '#eab308';
    ctx.beginPath();
    ctx.roundRect(170, 20, 100, 50, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#854d0e';
    ctx.fillText('⚡ ElastiCache', 220, 45);
    ctx.font = '9px var(--font-sans)';
    ctx.fillText('RAM (<1ms)', 220, 57);

    // 3. Database Node
    ctx.fillStyle = '#dbeafe';
    ctx.strokeStyle = '#2563eb';
    ctx.font = '10px var(--font-sans)';
    ctx.beginPath();
    ctx.roundRect(170, 110, 100, 50, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1d4ed8';
    ctx.fillText('🗄️ Relational DB', 220, 135);
    ctx.font = '9px var(--font-sans)';
    ctx.fillText('Disk (15-40ms)', 220, 147);

    // Draw network conduits
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    ctx.beginPath();
    ctx.moveTo(clientX + 30, clientY);
    ctx.lineTo(cacheX - 50, cacheY + 10);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(clientX + 30, clientY);
    ctx.lineTo(dbX - 50, dbY - 10);
    ctx.stroke();

    ctx.setLineDash([]); // Reset line dash

    // Spawn new particles periodically if running
    if (isRunningRef.current && Math.random() < 0.15) {
      const id = particleIdRef.current++;
      const randKey = Math.floor(Math.random() * 900 + 100);
      const label = `GET user:${randKey}`;
      particlesRef.current.push({
        id,
        x: clientX + 30,
        y: clientY,
        targetX: cacheX - 50,
        targetY: cacheY + 10,
        speed: 2 + Math.random() * 2,
        color: '#64748b',
        type: 'hit',
        state: 'to_cache',
        label
      });
    }

    // Process particles
    const particles = particlesRef.current;
    particlesRef.current = particles.filter(p => {
      // Vector movement
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 4) {
        // Destination node reached, trigger transition
        if (p.state === 'to_cache') {
          // Check Hit/Miss
          const isHit = Math.random() * 100 < hitRate;
          if (isHit) {
            p.type = 'hit';
            p.color = '#22c55e'; // Green
            p.targetX = clientX + 30;
            p.targetY = clientY;
            p.state = 'back_to_client';
            logSimEvent(`${p.label} → Cache HIT (0.1ms) ✅`);
          } else {
            p.type = 'miss';
            p.color = '#ef4444'; // Red
            p.targetX = dbX - 50;
            p.targetY = dbY - 10;
            p.state = 'to_db';
            logSimEvent(`${p.label} → Cache MISS ❌ → Query DB (25ms)`);
          }
        } else if (p.state === 'to_db') {
          // Query DB completed, route back to client
          p.targetX = clientX + 30;
          p.targetY = clientY;
          p.state = 'back_to_client';
          logSimEvent(`${p.label} → Read DB → Write back to Cache 💾`);
        } else if (p.state === 'back_to_client') {
          // Returned to caller, delete particle
          return false;
        }
      } else {
        // Move towards target
        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;
      }

      // Draw particle
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw label tooltip above leading particle
      if (dist > 15) {
        ctx.fillStyle = 'var(--color-text-secondary)';
        ctx.font = '8px var(--font-mono)';
        ctx.fillText(p.label, p.x, p.y - 8);
      }

      return true;
    });

    if (isRunningRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(drawCanvas);
    }
  }, [hitRate]);

  // Control simulation canvas updates
  useEffect(() => {
    if (activeSection === 'sim') {
      if (isRunning) {
        drawCanvas();
      } else {
        // Force a static render
        setTimeout(() => {
          drawCanvas();
        }, 100);
      }
    }
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [activeSection, isRunning, drawCanvas]);

  return (
    <div>
      <style>{`
        .ec-nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
        .ec-pill{border:0.5px solid var(--color-border-tertiary);border-radius:999px;padding:6px 10px;font-size:12px;color:var(--color-text-secondary);background:var(--color-background-primary);cursor:pointer;transition:all .15s}
        .ec-pill.active{background:#dc2626;border-color:#dc2626;color:#fff}
        .ec-sec{font-size:11px;font-weight:600;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.05em;margin:12px 0 7px}
        .ec-card{border:0.5px solid var(--color-border-tertiary);border-radius:var(--border-radius-lg);padding:12px 14px;background:var(--color-background-primary);margin-bottom:10px}
        .ec-kv{display:flex;gap:8px;font-size:12px;margin:5px 0;align-items:baseline}
        .ec-kk{min-width:155px;color:var(--color-text-secondary);flex-shrink:0}
        .ec-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
        .ec-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
        .ec-met{background:var(--color-background-secondary);border-radius:var(--border-radius-md);padding:10px;text-align:center}
        ul.ec-ck li{font-size:12px;margin-bottom:4px;list-style:none;padding-left:16px;position:relative}
        ul.ec-ck li::before{content:"✓";position:absolute;left:0;color:#15803d;font-weight:700}
        .ec-log{border:0.5px solid var(--color-border-tertiary);border-radius:8px;padding:8px 10px;background:var(--color-background-secondary);font-size:11px;font-family:var(--font-mono,monospace);min-height:60px;white-space:pre-wrap}
        .ec-tabs{display:flex;gap:5px;flex-wrap:wrap;margin-bottom:14px}
        .ec-tb{padding:5px 13px;border-radius:999px;border:0.5px solid var(--color-border-secondary);font-size:12px;cursor:pointer;background:var(--color-background-secondary);color:var(--color-text-secondary);transition:all .15s}
        .ec-tb.on{background:#dc2626;color:#fff;border-color:#dc2626}
        button.ec-btn{font-size:12px;padding:6px 14px;border-radius:8px;border:0.5px solid var(--color-border-tertiary);background:var(--color-background-primary);cursor:pointer;transition:all .15s}
        button.ec-btn.primary{background:#dc2626;border-color:#dc2626;color:#fff}
      `}</style>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">⚡ AWS ElastiCache Visualizer</h1>
        <p className="text-gray-600">Explore fully managed in-memory cache architectures, Redis vs Memcached parameters, and cache strategies.</p>
      </div>

      <div className="ec-tabs">
        <button className={`ec-tb ${activeSection === 'concept' ? 'on' : ''}`} onClick={() => setActiveSection('concept')}>💡 Concept &amp; Overview</button>
        <button className={`ec-tb ${activeSection === 'compare' ? 'on' : ''}`} onClick={() => setActiveSection('compare')}>⚖️ Redis vs Memcached</button>
        <button className={`ec-tb ${activeSection === 'arch' ? 'on' : ''}`} onClick={() => setActiveSection('arch')}>🏗️ Architecture</button>
        <button className={`ec-tb ${activeSection === 'usecases' ? 'on' : ''}`} onClick={() => setActiveSection('usecases')}>🎯 Use Cases</button>
        <button className={`ec-tb ${activeSection === 'security' ? 'on' : ''}`} onClick={() => setActiveSection('security')}>🔒 Security &amp; Auth</button>
        <button className={`ec-tb ${activeSection === 'sim' ? 'on' : ''}`} onClick={() => setActiveSection('sim')}>🎮 Cache Simulator</button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeSection === 'concept' && (
          <div id="pnl-concept">
            <div className="ec-g2" style={{ marginBottom: '10px' }}>
              <div>
                <div className="ec-sec">What is ElastiCache?</div>
                <svg width="100%" viewBox="0 0 340 420" style={{ display: 'block' }}>
                  <defs>
                    <marker id="ec1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#dc2626"/></marker>
                    <marker id="ec2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#15803d"/></marker>
                    <marker id="ec3" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#6b7280"/></marker>
                  </defs>
                  <rect x="10" y="10" width="320" height="52" rx="10" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
                  <text x="170" y="30" textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="500">🌐 User Request (Axios / App)</text>
                  <text x="170" y="48" textAnchor="middle" fontSize="11" fill="#dc2626">GET /product/123 · GET /user/profile</text>

                  <rect x="10" y="88" width="320" height="52" rx="10" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5"/>
                  <text x="170" y="108" textAnchor="middle" fontSize="12" fill="#c2410c" fontWeight="500">🖥️ Application Server / Lambda</text>
                  <text x="170" y="126" textAnchor="middle" fontSize="11" fill="#c2410c">Checks cache first before hitting DB</text>

                  <rect x="10" y="166" width="148" height="72" rx="10" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
                  <text x="84" y="188" textAnchor="middle" fontSize="13" fill="#854d0e" fontWeight="500">⚡ ElastiCache</text>
                  <text x="84" y="206" textAnchor="middle" fontSize="11" fill="#854d0e">In-Memory Store</text>
                  <text x="84" y="222" textAnchor="middle" fontSize="11" fill="#854d0e">~0.1ms latency</text>

                  <rect x="182" y="166" width="148" height="72" rx="10" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                  <text x="256" y="188" textAnchor="middle" fontSize="13" fill="#1d4ed8" fontWeight="500">🗄️ RDS / Aurora</text>
                  <text x="256" y="206" textAnchor="middle" fontSize="11" fill="#1d4ed8">Persistent DB</text>
                  <text x="256" y="222" textAnchor="middle" fontSize="11" fill="#1d4ed8">~5–50ms latency</text>

                  <rect x="10" y="264" width="320" height="52" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                  <text x="170" y="284" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="500">✅ Cache HIT → Return instantly</text>
                  <text x="170" y="302" textAnchor="middle" fontSize="11" fill="#166534">No DB query · ~0.1ms · Saves cost + CPU</text>

                  <rect x="10" y="342" width="320" height="52" rx="10" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                  <text x="170" y="362" textAnchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">❌ Cache MISS → Query DB → Store in Cache</text>
                  <text x="170" y="380" textAnchor="middle" fontSize="11" fill="#7c3aed">DB hit once · Cache for next N requests</text>

                  <line x1="170" y1="62" x2="170" y2="88" stroke="#dc2626" strokeWidth="1" markerEnd="url(#ec1)"/>
                  <line x1="110" y1="140" x2="84" y2="166" stroke="#854d0e" strokeWidth="1" markerEnd="url(#ec1)"/>
                  <line x1="230" y1="140" x2="256" y2="166" stroke="#1d4ed8" strokeWidth="1" markerEnd="url(#ec3)"/>
                  <line x1="84" y1="238" x2="84" y2="264" stroke="#15803d" strokeWidth="1" markerEnd="url(#ec2)"/>
                  <line x1="256" y1="238" x2="256" y2="264" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#ec1)"/>
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
            <svg width="100%" viewBox="0 0 680 320" style={{ display: 'block', marginBottom: '12px' }}>
              <defs>
                <marker id="aa1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#dc2626"/></marker>
                <marker id="aa2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#15803d"/></marker>
                <marker id="aa3" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#6b7280"/></marker>
              </defs>
              <rect x="10" y="10" width="660" height="300" rx="16" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
              <text x="340" y="30" textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="500">VPC — ElastiCache Redis Cluster (Cluster Mode Enabled)</text>

              <rect x="25" y="44" width="190" height="250" rx="12" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5"/>
              <text x="120" y="64" textAnchor="middle" fontSize="11" fill="#c2410c" fontWeight="500">AZ-1 (us-east-1a)</text>
              <rect x="38" y="76" width="164" height="60" rx="8" fill="#fef3c7" stroke="#fde68a" strokeWidth="0.5"/>
              <text x="120" y="96" textAnchor="middle" fontSize="12" fill="#92400e" fontWeight="500">Primary Node</text>
              <text x="120" y="114" textAnchor="middle" fontSize="11" fill="#92400e">Shard 1 · Slots 0–5460</text>
              <rect x="38" y="152" width="164" height="60" rx="8" fill="#fef3c7" stroke="#fde68a" strokeWidth="0.5"/>
              <text x="120" y="172" textAnchor="middle" fontSize="12" fill="#92400e" fontWeight="500">Primary Node</text>
              <text x="120" y="190" textAnchor="middle" fontSize="11" fill="#92400e">Shard 2 · Slots 5461–10922</text>
              <rect x="38" y="228" width="164" height="52" rx="8" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
              <text x="120" y="248" textAnchor="middle" fontSize="11" fill="#166534">Replica (from AZ-2)</text>
              <text x="120" y="266" textAnchor="middle" fontSize="11" fill="#166534">Shard 3 replica</text>

              <rect x="245" y="44" width="190" height="250" rx="12" fill="#f0fdf4" stroke="#86efac" strokeWidth="0.5"/>
              <text x="340" y="64" textAnchor="middle" fontSize="11" fill="#15803d" fontWeight="500">AZ-2 (us-east-1b)</text>
              <rect x="258" y="76" width="164" height="60" rx="8" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
              <text x="340" y="96" textAnchor="middle" fontSize="12" fill="#166534" fontWeight="500">Replica Node</text>
              <text x="340" y="114" textAnchor="middle" fontSize="11" fill="#166534">Shard 1 replica</text>
              <rect x="258" y="152" width="164" height="60" rx="8" fill="#fef3c7" stroke="#fde68a" strokeWidth="0.5"/>
              <text x="340" y="172" textAnchor="middle" fontSize="12" fill="#92400e" fontWeight="500">Primary Node</text>
              <text x="340" y="190" textAnchor="middle" fontSize="11" fill="#92400e">Shard 3 · Slots 10923–16383</text>
              <rect x="258" y="228" width="164" height="52" rx="8" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
              <text x="340" y="248" textAnchor="middle" fontSize="11" fill="#166534">Replica (from AZ-1)</text>
              <text x="340" y="266" textAnchor="middle" fontSize="11" fill="#166534">Shard 2 replica</text>

              <rect x="465" y="44" width="190" height="250" rx="12" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
              <text x="560" y="64" textAnchor="middle" fontSize="11" fill="#7c3aed" fontWeight="500">AZ-3 (us-east-1c)</text>
              <rect x="478" y="76" width="164" height="60" rx="8" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="0.5"/>
              <text x="560" y="96" textAnchor="middle" fontSize="12" fill="#6d28d9" fontWeight="500">Replica Node</text>
              <text x="560" y="114" textAnchor="middle" fontSize="11" fill="#6d28d9">Shard 2 replica</text>
              <rect x="478" y="152" width="164" height="60" rx="8" fill="#ede9fe" stroke="#c4b5fd" strokeWidth="0.5"/>
              <text x="560" y="172" textAnchor="middle" fontSize="12" fill="#6d28d9" fontWeight="500">Replica Node</text>
              <text x="560" y="190" textAnchor="middle" fontSize="11" fill="#6d28d9">Shard 3 replica</text>
              <rect x="478" y="228" width="164" height="52" rx="8" fill="#fef3c7" stroke="#fde68a" strokeWidth="0.5"/>
              <text x="560" y="248" textAnchor="middle" fontSize="11" fill="#92400e">Primary Node</text>
              <text x="560" y="266" textAnchor="middle" fontSize="11" fill="#92400e">Shard 1 replica</text>

              <line x1="202" y1="106" x2="258" y2="106" stroke="#dc2626" strokeWidth="1" strokeDasharray="4,3" markerEnd="url(#aa1)"/>
              <line x1="202" y1="182" x2="258" y2="182" stroke="#dc2626" strokeWidth="1" strokeDasharray="4,3" markerEnd="url(#aa1)"/>
              <line x1="422" y1="106" x2="478" y2="106" stroke="#15803d" strokeWidth="1" strokeDasharray="4,3" markerEnd="url(#aa2)"/>
              <line x1="422" y1="182" x2="478" y2="182" stroke="#15803d" strokeWidth="1" strokeDasharray="4,3" markerEnd="url(#aa2)"/>
            </svg>

            <div className="ec-g2" style={{ marginBottom: '10px' }}>
              <div>
                <div className="ec-sec">Full Infrastructure Integration</div>
                <svg width="100%" viewBox="0 0 340 460" style={{ display: 'block' }}>
                  <defs>
                    <marker id="ai1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#dc2626"/></marker>
                    <marker id="ai2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#15803d"/></marker>
                    <marker id="ai3" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#0369a1"/></marker>
                  </defs>
                  <rect x="10" y="10" width="320" height="44" rx="10" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
                  <text x="170" y="36" textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="500">🌐 CloudFront CDN / Route 53</text>

                  <rect x="10" y="78" width="320" height="44" rx="10" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5"/>
                  <text x="170" y="104" textAnchor="middle" fontSize="12" fill="#c2410c" fontWeight="500">⚖️ ALB (Application Load Balancer)</text>

                  <rect x="10" y="146" width="148" height="44" rx="10" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                  <text x="84" y="172" textAnchor="middle" fontSize="11" fill="#1d4ed8" fontWeight="500">EC2 / ECS App</text>
                  <rect x="182" y="146" width="148" height="44" rx="10" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                  <text x="256" y="172" textAnchor="middle" fontSize="11" fill="#1d4ed8" fontWeight="500">Lambda Functions</text>

                  <rect x="80" y="218" width="180" height="52" rx="10" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5"/>
                  <text x="170" y="238" textAnchor="middle" fontSize="13" fill="#854d0e" fontWeight="500">⚡ ElastiCache</text>
                  <text x="170" y="256" textAnchor="middle" fontSize="11" fill="#854d0e">Redis / Memcached</text>

                  <rect x="10" y="298" width="148" height="52" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                  <text x="84" y="318" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="500">🗄️ RDS / Aurora</text>
                  <text x="84" y="336" textAnchor="middle" fontSize="11" fill="#166534">Primary DB</text>
                  <rect x="182" y="298" width="148" height="52" rx="10" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                  <text x="256" y="318" textAnchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">📦 S3 / DynamoDB</text>
                  <text x="256" y="336" textAnchor="middle" fontSize="11" fill="#7c3aed">Object / NoSQL</text>

                  <rect x="10" y="374" width="320" height="44" rx="10" fill="#ccfbf1" stroke="#5eead4" strokeWidth="0.5"/>
                  <text x="170" y="400" textAnchor="middle" fontSize="12" fill="#0f766e" fontWeight="500">📊 CloudWatch · X-Ray · SNS Alerts</text>

                  <line x1="170" y1="54" x2="170" y2="78" stroke="#dc2626" strokeWidth="1" markerEnd="url(#ai1)"/>
                  <line x1="120" y1="122" x2="84" y2="146" stroke="#c2410c" strokeWidth="1" markerEnd="url(#ai1)"/>
                  <line x1="220" y1="122" x2="256" y2="146" stroke="#c2410c" strokeWidth="1" markerEnd="url(#ai1)"/>
                  <line x1="84" y1="190" x2="130" y2="218" stroke="#854d0e" strokeWidth="1" markerEnd="url(#ai1)"/>
                  <line x1="256" y1="190" x2="210" y2="218" stroke="#854d0e" strokeWidth="1" markerEnd="url(#ai1)"/>
                  <line x1="130" y1="270" x2="84" y2="298" stroke="#15803d" strokeWidth="1" markerEnd="url(#ai2)"/>
                  <line x1="210" y1="270" x2="256" y2="298" stroke="#7c3aed" strokeWidth="1" markerEnd="url(#ai1)"/>
                  <line x1="84" y1="350" x2="84" y2="374" stroke="#0f766e" strokeWidth="1" markerEnd="url(#ai2)"/>
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
                    background: activeUsecase === key ? '#dc2626' : undefined,
                    color: activeUsecase === key ? '#fff' : undefined,
                    borderColor: activeUsecase === key ? '#dc2626' : undefined
                  }}
                >
                  {ucData[key].label}
                </button>
              ))}
            </div>
            <div className="ec-g2">
              <div>
                <svg width="100%" viewBox="0 0 340 300" style={{ display: 'block' }}>
                  <defs>
                    <marker id="ucarr" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto">
                      <path d="M0,0 L0,6 L7,3 z" fill={ucData[activeUsecase].svgColor} />
                    </marker>
                  </defs>
                  <rect x="10" y="10" width="320" height="52" rx="10" fill={ucData[activeUsecase].svgFill} stroke={ucData[activeUsecase].svgStroke} strokeWidth="0.5" />
                  <text x="170" y="30" textAnchor="middle" fontSize="12" fill={ucData[activeUsecase].svgColor} fontWeight="500">🌐 App / Lambda</text>
                  <text x="170" y="48" textAnchor="middle" fontSize="11" fill={ucData[activeUsecase].svgColor}>Client request</text>
                  
                  <rect x="80" y="90" width="180" height="52" rx="10" fill="#fef9c3" stroke="#fde047" strokeWidth="0.5" />
                  <text x="170" y="112" textAnchor="middle" fontSize="13" fill="#854d0e" fontWeight="500">⚡ ElastiCache Redis</text>
                  <text x="170" y="130" textAnchor="middle" fontSize="11" fill="#854d0e">{ucData[activeUsecase].title}</text>
                  
                  <rect x="80" y="170" width="180" height="52" rx="10" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5" />
                  <text x="170" y="192" textAnchor="middle" fontSize="12" fill="#1d4ed8" fontWeight="500">🗄️ RDS / DynamoDB</text>
                  <text x="170" y="210" textAnchor="middle" fontSize="11" fill="#1d4ed8">Source of truth (on miss)</text>
                  
                  <line x1="170" y1="62" x2="170" y2="90" stroke={ucData[activeUsecase].svgColor} strokeWidth="1" markerEnd="url(#ucarr)" />
                  <line x1="170" y1="142" x2="170" y2="170" stroke="#1d4ed8" strokeWidth="1" strokeDasharray="4,3" markerEnd="url(#ucarr)" />
                  
                  <rect x="10" y="248" width="148" height="40" rx="8" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5" />
                  <text x="84" y="272" textAnchor="middle" fontSize="11" fill="#166534">✅ HIT → &lt;1ms</text>
                  
                  <rect x="182" y="248" width="148" height="40" rx="8" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5" />
                  <text x="256" y="272" textAnchor="middle" fontSize="11" fill="#dc2626">❌ MISS → DB query</text>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '8px', color: 'var(--color-text-primary)' }}>{ucData[activeUsecase].title}</div>
                <div className="ec-card" style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{ucData[activeUsecase].desc}</div>
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
                <svg width="100%" viewBox="0 0 340 460" style={{ display: 'block' }}>
                  <defs>
                    <marker id="as1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#6b7280"/></marker>
                  </defs>
                  <rect x="10" y="10" width="320" height="440" rx="16" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5"/>
                  <text x="170" y="30" textAnchor="middle" fontSize="12" fill="#475569" fontWeight="500">VPC Security Boundary</text>

                  <rect x="25" y="44" width="290" height="48" rx="10" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
                  <text x="170" y="64" textAnchor="middle" fontSize="12" fill="#dc2626" fontWeight="500">🌐 App / Lambda / EC2</text>
                  <text x="170" y="80" textAnchor="middle" fontSize="11" fill="#dc2626">Client in same VPC (private subnet)</text>

                  <rect x="25" y="110" width="290" height="48" rx="10" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                  <text x="170" y="130" textAnchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">🔒 TLS in Transit</text>
                  <text x="170" y="146" textAnchor="middle" fontSize="11" fill="#6d28d9">Redis 6+ · TLS 1.2+ · in-transit encryption</text>

                  <rect x="25" y="176" width="290" height="48" rx="10" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5"/>
                  <text x="170" y="196" textAnchor="middle" fontSize="12" fill="#c2410c" fontWeight="500">🛡️ Security Groups</text>
                  <text x="170" y="212" textAnchor="middle" fontSize="11" fill="#c2410c">Port 6379 (Redis) / 11211 (Memcached) · App SG only</text>

                  <rect x="25" y="242" width="290" height="80" rx="10" fill="#f0fdf4" stroke="#86efac" strokeWidth="0.5"/>
                  <text x="170" y="262" textAnchor="middle" fontSize="12" fill="#15803d" fontWeight="500">🔑 Authentication</text>
                  <rect x="38" y="274" width="120" height="34" rx="6" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
                  <text x="98" y="289" textAnchor="middle" fontSize="11" fill="#166534">Redis AUTH</text>
                  <text x="98" y="303" textAnchor="middle" fontSize="11" fill="#166534">Token password</text>
                  <rect x="172" y="274" width="128" height="34" rx="6" fill="#dcfce7" stroke="#4ade80" strokeWidth="0.5"/>
                  <text x="236" y="289" textAnchor="middle" fontSize="11" fill="#166534">IAM Auth (Redis 7+)</text>
                  <text x="236" y="303" textAnchor="middle" fontSize="11" fill="#166534">Token-based</text>

                  <rect x="25" y="340" width="290" height="48" rx="10" fill="#ccfbf1" stroke="#5eead4" strokeWidth="0.5"/>
                  <text x="170" y="360" textAnchor="middle" fontSize="12" fill="#0f766e" fontWeight="500">🔐 Encryption at Rest (KMS)</text>
                  <text x="170" y="376" textAnchor="middle" fontSize="11" fill="#0f766e">Redis data on disk · Snapshots · aws/elasticache or CMK</text>

                  <rect x="25" y="406" width="290" height="36" rx="8" fill="#dbeafe" stroke="#93c5fd" strokeWidth="0.5"/>
                  <text x="170" y="428" textAnchor="middle" fontSize="11" fill="#1d4ed8">Subnet Groups · No public access · CloudTrail audit</text>

                  <line x1="170" y1="92" x2="170" y2="110" stroke="#6b7280" strokeWidth="1" markerEnd="url(#as1)"/>
                  <line x1="170" y1="158" x2="170" y2="176" stroke="#6b7280" strokeWidth="1" markerEnd="url(#as1)"/>
                  <line x1="170" y1="224" x2="170" y2="242" stroke="#6b7280" strokeWidth="1" markerEnd="url(#as1)"/>
                  <line x1="170" y1="322" x2="170" y2="340" stroke="#6b7280" strokeWidth="1" markerEnd="url(#as1)"/>
                  <line x1="170" y1="388" x2="170" y2="406" stroke="#6b7280" strokeWidth="1" markerEnd="url(#as1)"/>
                </svg>
              </div>
              <div>
                <div className="ec-sec">Auth methods explained</div>
                <div className="ec-card" style={{ borderLeft: '3px solid #dc2626', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#dc2626' }}>🔑 Redis AUTH (Classic)</div>
                  <div className="ec-kv"><span className="ec-kk">How</span><b>Single password token set on cluster</b></div>
                  <div className="ec-kv"><span className="ec-kk">Command</span><b style={{ fontFamily: 'monospace', fontSize: '11px' }}>AUTH &lt;password&gt;</b></div>
                  <div className="ec-kv"><span className="ec-kk">Engines</span><b>Redis 2.8+</b></div>
                  <div className="ec-kv"><span className="ec-kk">Rotate</span><b>Via Secrets Manager + app update</b></div>
                  <div className="ec-kv"><span className="ec-kk">Limitation</span><b>Single shared password</b></div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid #15803d', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#15803d' }}>🔑 Redis RBAC (Redis 6+)</div>
                  <div className="ec-kv"><span className="ec-kk">How</span><b>Multiple users with ACL rules</b></div>
                  <div className="ec-kv"><span className="ec-kk">Permissions</span><b>Per-command, per-key-pattern</b></div>
                  <div className="ec-kv"><span className="ec-kk">Example</span><b>readonly user: GET only, no SET/DEL</b></div>
                  <div className="ec-kv"><span className="ec-kk">Best for</span><b>Multi-tenant, least-privilege access</b></div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid #7c3aed', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#7c3aed' }}>🔑 IAM Auth (Redis 7+ / Valkey)</div>
                  <div className="ec-kv"><span className="ec-kk">How</span><b>IAM role → temp token → Redis AUTH</b></div>
                  <div className="ec-kv"><span className="ec-kk">No password</span><b>Token auto-rotates (15 min TTL)</b></div>
                  <div className="ec-kv"><span className="ec-kk">Best for</span><b>Lambda, ECS, EC2 (no stored creds)</b></div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid #0f766e', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: '#0f766e' }}>🔐 Encryption at Rest</div>
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
                        border: '0.5px solid var(--color-border-tertiary)',
                        borderRadius: 'var(--border-radius-md)',
                        padding: '8px 10px',
                        cursor: 'pointer',
                        borderColor: item.done ? '#86efac' : '#fca5a5',
                        background: item.done ? '#f0fdf4' : '#fef2f2'
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 500, color: item.done ? '#166534' : '#b91c1c' }}>
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
                <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '10px' }}>⚙️ Configure Cache</div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Cache Hit Rate (%)</div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={hitRate} 
                  style={{ width: '100%' }} 
                  onChange={(e) => setHitRate(Number(e.target.value))} 
                />
                <div style={{ fontSize: '12px', marginTop: '4px' }}>Hit rate: <b>{hitRate}%</b></div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '8px 0 4px' }}>Requests per second</div>
                <input 
                  type="range" 
                  min="100" 
                  max="10000" 
                  step="100" 
                  value={rps} 
                  style={{ width: '100%' }} 
                  onChange={(e) => setRps(Number(e.target.value))} 
                />
                <div style={{ fontSize: '12px', marginTop: '4px' }}>RPS: <b>{rps}</b></div>
                <div className="ec-g2" style={{ marginTop: '12px' }}>
                  <div className="ec-met"><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Cache hits/s</div><div style={{ fontSize: '16px', fontWeight: 500, color: '#15803d' }}>{simulatedHits}</div></div>
                  <div className="ec-met"><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>DB queries/s</div><div style={{ fontSize: '16px', fontWeight: 500, color: '#dc2626' }}>{simulatedMisses}</div></div>
                  <div className="ec-met"><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Avg latency</div><div style={{ fontSize: '16px', fontWeight: 500 }}>{simulatedLatency}ms</div></div>
                  <div className="ec-met"><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>DB saved %</div><div style={{ fontSize: '16px', fontWeight: 500, color: '#15803d' }}>{hitRate}%</div></div>
                </div>
              </div>
              <div className="ec-card">
                <div style={{ fontWeight: 500, fontSize: '13px', marginBottom: '10px' }}>📊 Request Flow Visualizer</div>
                <canvas 
                  ref={canvasRef} 
                  width={280} 
                  height={180} 
                  style={{ width: '100%', borderRadius: '8px', background: 'var(--color-background-secondary)' }}
                />
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
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
