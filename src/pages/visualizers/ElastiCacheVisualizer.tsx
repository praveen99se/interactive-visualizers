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
    svgColor: 'var(--uc-red-color)', svgFill: 'var(--uc-red-fill)', svgStroke: 'var(--uc-red-stroke)'
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
    svgColor: 'var(--uc-blue-color)', svgFill: 'var(--uc-blue-fill)', svgStroke: 'var(--uc-blue-stroke)'
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
    svgColor: 'var(--uc-amber-color)', svgFill: 'var(--uc-amber-fill)', svgStroke: 'var(--uc-amber-stroke)'
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
    svgColor: 'var(--uc-green-color)', svgFill: 'var(--uc-green-fill)', svgStroke: 'var(--uc-green-stroke)'
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
    svgColor: 'var(--uc-purple-color)', svgFill: 'var(--uc-purple-fill)', svgStroke: 'var(--uc-purple-stroke)'
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
    svgColor: 'var(--uc-cyan-color)', svgFill: 'var(--uc-cyan-fill)', svgStroke: 'var(--uc-cyan-stroke)'
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
    <div className="ec-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        .ec-container {
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
          color: var(--color-text-primary, #1e293b);

          /* Theme Variables (Light mode default) */
          --ec-subnets-bg: rgba(255, 255, 255, 0.7);
          --ec-inner-card-bg: #f8fafc;
          --ec-inner-card-border: #e2e8f0;
          --ec-inner-card-text: #334155;
          --ec-row-hover-bg: #ffffff;
          --ec-row-hover-border: #cbd5e1;

          --color-text-primary: #1e293b;
          --color-text-secondary: #475569;
          --color-text-tertiary: #64748b;
          --color-border-secondary: #e2e8f0;
          --ec-svg-line-stroke: #cbd5e1;

          --color-red: #dc2626;
          --color-amber: #d97706;
          --color-green: #16a34a;
          --color-blue: #2563eb;
          --color-purple: #7c3aed;

          /* Gradient details for nodes */
          --primary-grad-start: #fff7ed;
          --primary-grad-stop: #ffedd5;
          --primary-grad-stroke: #f97316;
          --primary-grad-text: #7c2d12;
          
          --replica-grad-start: #f0fdf4;
          --replica-grad-stop: #dcfce7;
          --replica-grad-stroke: #10b981;
          --replica-grad-text: #065f46;
          
          --memcached-grad-start: #f0f9ff;
          --memcached-grad-stop: #e0f2fe;
          --memcached-grad-stroke: #0284c7;
          --memcached-grad-text: #075985;
          
          --client-grad-start: #eff6ff;
          --client-grad-stop: #dbeafe;
          --client-grad-stroke: #3b82f6;
          --client-grad-text: #1e40af;

          --amber-grad-start: #fef9c3;
          --amber-grad-stop: #fffbeb;
          --amber-grad-stroke: #eab308;
          --amber-grad-text: #713f12;

          --teal-grad-start: #f0fdfa;
          --teal-grad-stop: #ccfbf1;
          --teal-grad-stroke: #5eead4;
          --teal-grad-text: #0f766e;

          --purple-grad-start: #faf5ff;
          --purple-grad-stop: #f3e8ff;
          --purple-grad-stroke: #c4b5fd;
          --purple-grad-text: #5b21b6;

          /* Usecases */
          --uc-red-color: #dc2626;
          --uc-red-fill: #fef2f2;
          --uc-red-stroke: #fca5a5;

          --uc-blue-color: #1d4ed8;
          --uc-blue-fill: #dbeafe;
          --uc-blue-stroke: #93c5fd;

          --uc-amber-color: #854d0e;
          --uc-amber-fill: #fef9c3;
          --uc-amber-stroke: #fde047;

          --uc-green-color: #15803d;
          --uc-green-fill: #dcfce7;
          --uc-green-stroke: #86efac;

          --uc-purple-color: #7c3aed;
          --uc-purple-fill: #faf5ff;
          --uc-purple-stroke: #c4b5fd;

          --uc-cyan-color: #0369a1;
          --uc-cyan-fill: #e0f2fe;
          --uc-cyan-stroke: #7dd3fc;
        }

        .dark .ec-container {
          background: #020617 !important;
          color: #f8fafc !important;

          --ec-subnets-bg: rgba(15, 23, 42, 0.4);
          --ec-inner-card-bg: rgba(15, 23, 42, 0.6);
          --ec-inner-card-border: rgba(51, 65, 85, 0.6);
          --ec-inner-card-text: #cbd5e1;
          --ec-row-hover-bg: rgba(30, 41, 59, 0.8);
          --ec-row-hover-border: rgba(100, 116, 139, 0.8);

          --color-text-primary: #f8fafc;
          --color-text-secondary: #94a3b8;
          --color-text-tertiary: #64748b;
          --color-border-secondary: rgba(51, 65, 85, 0.6);
          --ec-svg-line-stroke: rgba(100, 116, 139, 0.5);

          --color-red: #f87171;
          --color-amber: #fbbf24;
          --color-green: #4ade80;
          --color-blue: #60a5fa;
          --color-purple: #a78bfa;

          /* Gradient details for nodes in dark mode */
          --primary-grad-start: #7c2d12;
          --primary-grad-stop: #431407;
          --primary-grad-stroke: #ea580c;
          --primary-grad-text: #ffedd5;
          
          --replica-grad-start: #064e3b;
          --replica-grad-stop: #022c22;
          --replica-grad-stroke: #059669;
          --replica-grad-text: #dcfce7;
          
          --memcached-grad-start: #075985;
          --memcached-grad-stop: #0c4a6e;
          --memcached-grad-stroke: #0284c7;
          --memcached-grad-text: #e0f2fe;
          
          --client-grad-start: #1e3a8a;
          --client-grad-stop: #172554;
          --client-grad-stroke: #2563eb;
          --client-grad-text: #eff6ff;

          --amber-grad-start: #78350f;
          --amber-grad-stop: #451a03;
          --amber-grad-stroke: #d97706;
          --amber-grad-text: #fef3c7;

          --teal-grad-start: #042f2e;
          --teal-grad-stop: #115e59;
          --teal-grad-stroke: #14b8a6;
          --teal-grad-text: #ccfbf1;

          --purple-grad-start: #3b0764;
          --purple-grad-stop: #2e1065;
          --purple-grad-stroke: #8b5cf6;
          --purple-grad-text: #f5f3ff;

          /* Usecases */
          --uc-red-color: #f87171;
          --uc-red-fill: #450a0a;
          --uc-red-stroke: #b91c1c;

          --uc-blue-color: #60a5fa;
          --uc-blue-fill: #172554;
          --uc-blue-stroke: #2563eb;

          --uc-amber-color: #fbbf24;
          --uc-amber-fill: #451a03;
          --uc-amber-stroke: #d97706;

          --uc-green-color: #4ade80;
          --uc-green-fill: #022c22;
          --uc-green-stroke: #059669;

          --uc-purple-color: #a78bfa;
          --uc-purple-fill: #3b0764;
          --uc-purple-stroke: #7c3aed;

          --uc-cyan-color: #38bdf8;
          --uc-cyan-fill: #083344;
          --uc-cyan-stroke: #0284c7;
        }

        .ec-nav{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px}
        .ec-pill{border:1px solid var(--ec-inner-card-border);border-radius:999px;padding:6px 12px;font-size:12px;color:var(--color-text-secondary);background:rgba(255,255,255,0.8);cursor:pointer;transition:all .15s;font-weight:500}
        .ec-pill.active{background:var(--color-red);border-color:var(--color-red);color:#fff;box-shadow:0 2px 4px rgba(220,38,38,0.2)}
        
        .ec-h {
          font-size: 24px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
          background: linear-gradient(135deg, #ea580c 0%, #d97706 50%, #dc2626 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
        }
        .ec-sub {
          font-size: 13.5px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin-bottom: 20px;
          max-width: 90%;
        }

        .ec-sec{font-size:11px;font-weight:700;color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:.05em;margin:16px 0 8px;border-bottom:1px solid var(--color-border-secondary);padding-bottom:4px}
        .ec-card{border:1px solid var(--ec-inner-card-border);border-radius:16px;padding:14px 16px;background:rgba(255,255,255,0.85);backdrop-filter:blur(8px);box-shadow:0 4px 6px -1px rgba(0,0,0,0.03),0 2px 4px -1px rgba(0,0,0,0.02);margin-bottom:12px;color:var(--color-text-primary)}
        
        .dark .ec-card {
          background: rgba(15, 23, 42, 0.75) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .ec-card b, .dark .ec-card strong {
          color: #ffffff !important;
        }

        .ec-kv{display:flex;gap:8px;font-size:12px;margin:6px 0;align-items:baseline}
        .ec-kk{min-width:145px;color:var(--color-text-secondary);font-weight:600;flex-shrink:0}
        .ec-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
        .ec-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
        .ec-met{background:var(--ec-inner-card-bg);border-radius:12px;padding:10px;text-align:center;border:1px solid var(--ec-inner-card-border);color:var(--color-text-primary)}
        
        ul.ec-ck li{font-size:12px;margin-bottom:6px;list-style:none;padding-left:18px;position:relative;color:var(--color-text-primary)}
        ul.ec-ck li::before{content:"✓";position:absolute;left:0;color:var(--color-green);font-weight:700}
        
        .ec-log{border:1px solid var(--ec-inner-card-border);border-radius:10px;padding:10px 12px;background:var(--ec-inner-card-bg);color:var(--color-text-primary);font-size:11px;font-family:var(--font-mono,monospace);min-height:60px;white-space:pre-wrap;line-height:1.5;box-shadow:inset 0 1px 2px rgba(0,0,0,0.03)}
        .dark .ec-log {
          background: #020617 !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #38bdf8 !important;
        }

        .ec-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 18px; border-bottom: 1.5px solid var(--color-border-secondary); padding-bottom: 12px; }
        .ec-tb { padding: 6px 14px; border-radius: 10px; border: 1px solid var(--ec-inner-card-border); font-size: 12px; cursor: pointer; background: rgba(255,255,255,0.8); color: var(--color-text-secondary); transition: all 0.15s ease-in-out; outline: none; font-weight: 500; }
        .ec-tb:hover { background: #f1f5f9; border-color: #94a3b8; color: #0f172a; }
        .ec-tb.on { background: var(--color-green); color: #fff; border-color: var(--color-green); box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2); }
        
        .dark .ec-tb {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #94a3b8 !important;
        }
        .dark .ec-tb:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #f8fafc !important;
        }
        .dark .ec-tb.on {
          background: var(--color-green) !important;
          border-color: var(--color-green) !important;
          color: #fff !important;
        }

        button.ec-btn{font-size:12px;padding:6px 14px;border-radius:8px;border:1px solid var(--ec-inner-card-border);background:#fff;color:var(--color-text-secondary);cursor:pointer;transition:all .15s;font-weight:500}
        button.ec-btn:hover{background:var(--ec-inner-card-bg);color:var(--color-text-primary);border-color:#94a3b8}
        button.ec-btn.primary{background:var(--color-red);border-color:var(--color-red);color:#fff;box-shadow:0 2px 4px rgba(220,38,38,0.15)}
        button.ec-btn.primary:hover{background:#b91c1c;border-color:#b91c1c;color:#fff}
        
        .dark button.ec-btn {
          background: rgba(15, 23, 42, 0.8) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark button.ec-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
        }
        .dark button.ec-btn.primary {
          background: var(--color-red) !important;
          border-color: var(--color-red) !important;
          color: #fff !important;
        }

        .ec-svg-bg {
          background-color: #f8fafc;
          background-image: radial-gradient(var(--ec-svg-line-stroke) 1.2px, transparent 1.2px);
          background-size: 14px 14px;
          border: 1px solid var(--ec-inner-card-border);
          border-radius: 12px;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.02);
        }
        .dark .ec-svg-bg {
          background-color: #020617 !important;
          background-image: radial-gradient(rgba(51, 65, 85, 0.5) 1.2px, transparent 1.2px) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
        }

        .ec-flow-blue {
          stroke: var(--color-blue);
          stroke-dasharray: 6,4;
          animation: ecFlowDash 1s linear infinite;
        }
        .ec-flow-green {
          stroke: var(--color-green);
          stroke-dasharray: 6,4;
          animation: ecFlowDash 0.8s linear infinite;
        }
        .ec-flow-orange {
          stroke: var(--color-amber);
          stroke-dasharray: 6,4;
          animation: ecFlowDash 1s linear infinite;
        }
        .ec-flow-purple {
          stroke: var(--color-purple);
          stroke-dasharray: 6,4;
          animation: ecFlowDash 1.2s linear infinite;
        }
        .ec-flow-red {
          stroke: var(--color-red);
          stroke-dasharray: 5,3;
          animation: ecFlowDash 0.5s linear infinite;
        }
        @keyframes ecFlowDash {
          to { stroke-dashoffset: -20; }
        }
        .ec-node-btn {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .ec-node-btn:hover {
          filter: drop-shadow(0 4px 12px rgba(59, 130, 246, 0.15));
        }
        .ec-pulse-active {
          animation: ecPulseGlow 1.5s infinite alternate;
        }
        @keyframes ecPulseGlow {
          from {
            filter: drop-shadow(0 0 2px rgba(234, 179, 8, 0.4));
          }
          to {
            filter: drop-shadow(0 0 12px rgba(234, 179, 8, 0.8));
          }
        }

        .ec-chk-item {
          border: 1px solid var(--ec-inner-card-border);
          border-radius: 10px;
          padding: 8px 10px;
          cursor: pointer;
          transition: all 0.15s ease-in-out;
        }
        .ec-chk-item.done {
          border-color: #86efac;
          background: rgba(22, 163, 74, 0.04);
          color: #166534;
        }
        .ec-chk-item.todo {
          border-color: #fca5a5;
          background: rgba(239, 68, 68, 0.04);
          color: #b91c1c;
        }
        .dark .ec-chk-item.done {
          border-color: rgba(16, 185, 129, 0.4);
          background: rgba(16, 185, 129, 0.1);
          color: #4ade80;
        }
        .dark .ec-chk-item.todo {
          border-color: rgba(239, 68, 68, 0.4);
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
        }

        .ec-main-panel {
          background: rgba(248, 250, 252, 0.6);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          padding: 24px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
        }
        .dark .ec-main-panel {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }

        .dark select,
        .dark input,
        .dark textarea {
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
          border-color: rgba(51, 65, 85, 0.8) !important;
        }
      `}</style>

      <div style={{ padding: '14px 16px 4px' }}>
        <h1 className="ec-h">⚡ AWS ElastiCache Visualizer</h1>
        <p className="ec-sub">Explore fully managed in-memory cache architectures, Redis vs Memcached parameters, and cache strategies.</p>
      </div>

      <div className="ec-tabs">
        <button className={`ec-tb ${activeSection === 'concept' ? 'on' : ''}`} onClick={() => setActiveSection('concept')}>💡 Concept &amp; Overview</button>
        <button className={`ec-tb ${activeSection === 'compare' ? 'on' : ''}`} onClick={() => setActiveSection('compare')}>⚖️ Redis vs Memcached</button>
        <button className={`ec-tb ${activeSection === 'arch' ? 'on' : ''}`} onClick={() => setActiveSection('arch')}>🏗️ Architecture</button>
        <button className={`ec-tb ${activeSection === 'usecases' ? 'on' : ''}`} onClick={() => setActiveSection('usecases')}>🎯 Use Cases</button>
        <button className={`ec-tb ${activeSection === 'security' ? 'on' : ''}`} onClick={() => setActiveSection('security')}>🔒 Security &amp; Auth</button>
        <button className={`ec-tb ${activeSection === 'sim' ? 'on' : ''}`} onClick={() => setActiveSection('sim')}>🎮 Cache Simulator</button>
      </div>

      <div className="ec-main-panel">
        {activeSection === 'concept' && (
          <div id="pnl-concept">
            <div className="ec-g2" style={{ marginBottom: '10px' }}>
              <div>
                <div className="ec-sec">What is ElastiCache?</div>
                <svg width="100%" viewBox="0 0 520 220" className="ec-svg-bg" style={{ display: 'block' }}>
                  <defs>
                    <marker id="ec-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-text-tertiary)" />
                    </marker>
                    <filter id="shadow-concept" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#94a3b8" floodOpacity="0.1" />
                    </filter>
                  </defs>

                  {/* ==================== PUBLIC WEB INGRESS ZONE ==================== */}
                  <rect x="10" y="24" width="105" height="175" rx="8" fill="none" stroke="var(--ec-svg-line-stroke)" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="16" y="36" fill="var(--color-text-tertiary)" fontSize="7" fontWeight="bold">Public Web Ingress Zone</text>

                  {/* Client Browser Node */}
                  <g filter="url(#shadow-concept)" transform="translate(18, 55)">
                    <rect width="88" height="125" rx="6" fill="var(--ec-inner-card-bg)" stroke="var(--ec-inner-card-border)" strokeWidth="1.2" />
                    <text x="44" y="16" textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--color-text-primary)">💻 Client Browser</text>
                    <circle cx="44" cy="48" r="16" fill="var(--client-grad-start)" stroke="var(--client-grad-stroke)" strokeWidth="1.2" />
                    <text x="44" y="52" textAnchor="middle" fontSize="11" fill="var(--client-grad-text)" fontWeight="bold">USER</text>
                    <rect x="8" y="76" width="72" height="40" rx="3" fill="var(--ec-inner-card-bg)" stroke="var(--ec-inner-card-border)" />
                    <text x="44" y="87" textAnchor="middle" fontSize="7.5" fill="var(--color-text-primary)" fontWeight="bold">GET /catalog</text>
                    <text x="44" y="98" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">HTTP/3 API</text>
                    <text x="44" y="108" textAnchor="middle" fontSize="7.5" fill="var(--color-green)" fontWeight="bold">Sub-ms Request</text>
                  </g>

                  {/* ==================== VPC APPLICATION SUBNET ==================== */}
                  <rect x="130" y="24" width="120" height="175" rx="8" fill="none" stroke="var(--primary-grad-stroke)" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="136" y="36" fill="var(--primary-grad-stroke)" fontSize="7" fontWeight="bold">Application Subnet</text>

                  {/* App Node */}
                  <g filter="url(#shadow-concept)" transform="translate(138, 55)">
                    <rect width="104" height="125" rx="6" fill="var(--primary-grad-start)" stroke="var(--primary-grad-stroke)" strokeWidth="1.5" />
                    <text x="52" y="16" textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--primary-grad-text)">🖥️ Application Server</text>
                    <rect x="8" y="26" width="88" height="24" rx="3" fill="var(--primary-grad-stop)" stroke="var(--primary-grad-stroke)" />
                    <text x="52" y="37" textAnchor="middle" fontSize="7.5" fill="var(--primary-grad-text)" fontWeight="bold">ECS / Lambda Tier</text>
                    <rect x="8" y="58" width="88" height="58" rx="3" fill="var(--ec-inner-card-bg)" stroke="var(--ec-inner-card-border)" />
                    <text x="52" y="69" textAnchor="middle" fontSize="7.5" fill="var(--primary-grad-stroke)" fontWeight="bold">Cache-Aside Engine</text>
                    <text x="52" y="82" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">1. Check Redis Cache</text>
                    <text x="52" y="94" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">2. Fallback RDS Query</text>
                    <text x="52" y="106" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">3. Set Cache on Miss</text>
                  </g>

                  {/* ==================== IN-MEMORY CACHING TIER ==================== */}
                  <rect x="265" y="24" width="115" height="175" rx="8" fill="none" stroke="var(--color-amber)" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="271" y="36" fill="var(--color-amber)" fontSize="7" fontWeight="bold">In-Memory Caching Tier</text>

                  {/* ElastiCache Redis Node */}
                  <g filter="url(#shadow-concept)" transform="translate(273, 55)">
                    <rect width="98" height="125" rx="6" fill="var(--amber-grad-start)" stroke="var(--amber-grad-stroke)" strokeWidth="1.5" />
                    <text x="49" y="16" textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--amber-grad-text)">⚡ ElastiCache Redis</text>
                    
                    <path d="M 19 32 L 19 50 A 30 7 0 0 0 79 50 L 79 32 Z" fill="var(--amber-grad-stop)" stroke="var(--amber-grad-stroke)" strokeWidth="1" />
                    <ellipse cx="49" cy="32" rx="30" ry="7" fill="var(--amber-grad-stop)" stroke="var(--amber-grad-stroke)" strokeWidth="1" />
                    <text x="49" y="44" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="var(--amber-grad-text)">RAM DATA STORE</text>

                    <rect x="8" y="65" width="82" height="50" rx="3" fill="var(--ec-inner-card-bg)" stroke="var(--ec-inner-card-border)" />
                    <text x="49" y="77" textAnchor="middle" fontSize="7.5" fill="var(--color-amber)" fontWeight="bold">In-Memory Index</text>
                    <text x="49" y="89" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">TTL Key Expiries</text>
                    <text x="49" y="100" textAnchor="middle" fontSize="7" fill="var(--color-green)" fontWeight="bold">Latency &lt;0.1ms ✅</text>
                  </g>

                  {/* ==================== AUTHORITATIVE DATABASE SUBNET ==================== */}
                  <rect x="395" y="24" width="115" height="175" rx="8" fill="none" stroke="var(--color-blue)" strokeWidth="1.5" strokeDasharray="6,4" />
                  <text x="401" y="36" fill="var(--color-blue)" fontSize="7" fontWeight="bold">Authoritative DB Subnet</text>

                  {/* RDS / Aurora Database Node */}
                  <g filter="url(#shadow-concept)" transform="translate(403, 55)">
                    <rect width="98" height="125" rx="6" fill="var(--client-grad-start)" stroke="var(--client-grad-stroke)" strokeWidth="1.5" />
                    <text x="49" y="16" textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--client-grad-text)">🗄️ RDS / Aurora DB</text>
                    
                    <path d="M 19 32 L 19 50 A 30 7 0 0 0 79 50 L 79 32 Z" fill="var(--client-grad-stop)" stroke="var(--client-grad-stroke)" strokeWidth="1" />
                    <ellipse cx="49" cy="32" rx="30" ry="7" fill="var(--client-grad-stop)" stroke="var(--client-grad-stroke)" strokeWidth="1" />
                    <text x="49" y="44" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="var(--client-grad-text)">SSD PERSISTENT</text>

                    <rect x="8" y="65" width="82" height="50" rx="3" fill="var(--ec-inner-card-bg)" stroke="var(--ec-inner-card-border)" />
                    <text x="49" y="77" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">Transactional DB</text>
                    <text x="49" y="89" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">SQL Relational</text>
                    <text x="49" y="100" textAnchor="middle" fontSize="7" fill="var(--color-red)" fontWeight="bold">Latency 5-50ms ❌</text>
                  </g>

                  {/* Conduit Routing Pipes */}
                  {/* Client to App */}
                  <path d="M 106 118 L 138 118" fill="none" stroke="var(--color-blue)" strokeWidth="1.5" markerEnd="url(#ec-arrow)" />

                  {/* App to Cache (Hit test) */}
                  <path d="M 242 98 L 273 98" fill="none" stroke="var(--color-amber)" strokeWidth="1.5" markerEnd="url(#ec-arrow)" />
                  <path d="M 273 138 L 242 138" fill="none" stroke="var(--color-green)" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#ec-arrow)" />

                  {/* App to DB (Miss query + set cache) */}
                  <path d="M 190 180 V 205 H 452 V 180" fill="none" stroke="var(--color-blue)" strokeWidth="1.2" strokeDasharray="4,2" />
                </svg>
              </div>
              <div>
                <div className="ec-sec">Core concept</div>
                <div className="ec-card" style={{ borderLeft: '3px solid var(--color-red)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: 'var(--color-red)' }}>🧠 What is it?</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>ElastiCache is a fully managed <b>in-memory data store</b> on AWS. It stores data in RAM instead of disk — making reads <b>10–100x faster</b> than a traditional database. Think of it as a super-fast scratchpad between your app and your DB.</div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid var(--color-amber)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: 'var(--color-amber)' }}>⚡ Why use it?</div>
                  <ul className="ec-ck">
                    <li>Reduce DB load by 90%+ on read-heavy apps</li>
                    <li>Sub-millisecond response times</li>
                    <li>Handle millions of requests/sec</li>
                    <li>Session storage (stateless apps)</li>
                    <li>Real-time leaderboards, pub/sub</li>
                  </ul>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid var(--color-blue)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: 'var(--color-blue)' }}>📦 Two engines</div>
                  <div className="ec-kv"><span className="ec-kk">Redis</span><b>Rich data types, persistence, cluster</b></div>
                  <div className="ec-kv"><span className="ec-kk">Memcached</span><b>Simple key-value, multi-thread, pure cache</b></div>
                  <div className="ec-kv"><span className="ec-kk">Valkey (new)</span><b>Open-source Redis fork (AWS default 2024+)</b></div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid var(--color-green)' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: 'var(--color-green)' }}>📊 Key metrics</div>
                  <div className="ec-g3">
                    <div className="ec-met"><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Latency</div><div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-red)' }}>&lt;1ms</div></div>
                    <div className="ec-met"><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Throughput</div><div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-blue)' }}>M req/s</div></div>
                    <div className="ec-met"><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>DB offload</div><div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--color-green)' }}>~90%</div></div>
                  </div>
                </div>
                <div className="ec-sec">Cache strategies</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <button className="ec-btn" onClick={() => setStrategy('lazy')} style={strategy === 'lazy' ? { background: 'var(--color-red)', color: '#fff', borderColor: 'var(--color-red)' } : undefined}>Lazy Loading</button>
                  <button className="ec-btn" onClick={() => setStrategy('write')} style={strategy === 'write' ? { background: 'var(--color-red)', color: '#fff', borderColor: 'var(--color-red)' } : undefined}>Write-Through</button>
                  <button className="ec-btn" onClick={() => setStrategy('ttl')} style={strategy === 'ttl' ? { background: 'var(--color-red)', color: '#fff', borderColor: 'var(--color-red)' } : undefined}>TTL Eviction</button>
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
              <div className="ec-card" style={{ border: '2px solid var(--color-red)' }}>
                <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '10px', color: 'var(--color-red)' }}>🔴 Redis (Recommended)</div>
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
              <div className="ec-card" style={{ border: '2px solid var(--color-blue)' }}>
                <div style={{ fontWeight: 500, fontSize: '14px', marginBottom: '10px', color: 'var(--color-blue)' }}>🔵 Memcached</div>
                <div className="ec-kv"><span className="ec-kk">Data types</span><b>String only (key-value)</b></div>
                <div className="ec-kv"><span className="ec-kk">Persistence</span><b style={{ color: 'var(--color-red)' }}>❌ Pure in-memory (data lost on restart)</b></div>
                <div className="ec-kv"><span className="ec-kk">Replication</span><b style={{ color: 'var(--color-red)' }}>❌ No replication</b></div>
                <div className="ec-kv"><span className="ec-kk">Cluster mode</span><b>✅ Horizontal sharding (client-side)</b></div>
                <div className="ec-kv"><span className="ec-kk">Pub/Sub</span><b style={{ color: 'var(--color-red)' }}>❌ Not supported</b></div>
                <div className="ec-kv"><span className="ec-kk">Lua scripting</span><b style={{ color: 'var(--color-red)' }}>❌ Not supported</b></div>
                <div className="ec-kv"><span className="ec-kk">Transactions</span><b style={{ color: 'var(--color-red)' }}>❌ Not supported</b></div>
                <div className="ec-kv"><span className="ec-kk">Sorted sets</span><b style={{ color: 'var(--color-red)' }}>❌ Not supported</b></div>
                <div className="ec-kv"><span className="ec-kk">Geo commands</span><b style={{ color: 'var(--color-red)' }}>❌ Not supported</b></div>
                <div className="ec-kv"><span className="ec-kk">Streams</span><b style={{ color: 'var(--color-red)' }}>❌ Not supported</b></div>
                <div className="ec-kv"><span className="ec-kk">Auth</span><b>SASL (basic)</b></div>
                <div className="ec-kv"><span className="ec-kk">Multi-AZ</span><b style={{ color: 'var(--color-red)' }}>❌ No failover</b></div>
                <div className="ec-kv"><span className="ec-kk">Backup</span><b style={{ color: 'var(--color-red)' }}>❌ No snapshots</b></div>
                <div className="ec-kv"><span className="ec-kk">Threading</span><b>✅ Multi-threaded (CPU efficient)</b></div>
                <div className="ec-kv"><span className="ec-kk">Best for</span><b>Simple object caching, HTML fragments, high-throughput read cache</b></div>
              </div>
            </div>
            <div className="ec-sec">When to choose which?</div>
            <div className="ec-g2">
              <div className="ec-card" style={{ borderLeft: '3px solid var(--color-red)' }}>
                <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: 'var(--color-red)' }}>Choose Redis when…</div>
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
              <div className="ec-card" style={{ borderLeft: '3px solid var(--color-blue)' }}>
                <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: 'var(--color-blue)' }}>Choose Memcached when…</div>
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
                <linearGradient id="primary-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--primary-grad-start)" />
                  <stop offset="100%" stopColor="var(--primary-grad-stop)" />
                </linearGradient>
                <linearGradient id="replica-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--replica-grad-start)" />
                  <stop offset="100%" stopColor="var(--replica-grad-stop)" />
                </linearGradient>
                <filter id="shadow-premium" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.06" />
                </filter>
                <marker id="ec-arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--primary-grad-stroke)" />
                </marker>
                <marker id="ec-arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--replica-grad-stroke)" />
                </marker>
                <marker id="ec-arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--color-purple)" />
                </marker>
              </defs>
              
              {/* Outer VPC frame */}
              <rect x="10" y="10" width="660" height="300" rx="16" fill="var(--ec-subnets-bg)" stroke="var(--ec-svg-line-stroke)" strokeWidth="1.5"/>
              <text x="340" y="30" textAnchor="middle" fontSize="12" fill="var(--color-text-primary)" fontWeight="700">VPC — ElastiCache Redis Cluster (Cluster Mode Enabled)</text>

              {/* AZ-1 Subnet */}
              <g transform="translate(20, 48)">
                <rect width="200" height="246" rx="12" fill="none" stroke="var(--ec-svg-line-stroke)" strokeWidth="1" strokeDasharray="6,4" />
                <rect x="5" y="5" width="190" height="22" rx="4" fill="var(--ec-inner-card-bg)" stroke="var(--ec-inner-card-border)" strokeWidth="1" />
                <text x="100" y="19" textAnchor="middle" fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">AZ-1 (us-east-1a)</text>
                
                <rect x="8" y="32" width="184" height="206" rx="8" fill="rgba(245, 158, 11, 0.01)" stroke="var(--primary-grad-stroke)" strokeWidth="1.2" strokeDasharray="4,2" />
                <text x="15" y="44" fontSize="7.5" fill="var(--primary-grad-stroke)" fontWeight="bold">Private Cache Subnet</text>

                {/* Node 1: Primary Node (Shard 1) */}
                <g transform="translate(18, 52)" filter="url(#shadow-premium)">
                  <rect width="164" height="52" rx="6" fill="url(#primary-grad)" stroke="var(--primary-grad-stroke)" strokeWidth="1.5" />
                  <text x="12" y="18" fontSize="10.5" fontWeight="800" fill="var(--primary-grad-text)">Primary Node</text>
                  <text x="12" y="30" fontSize="8" fill="var(--primary-grad-stroke)" fontWeight="bold">Shard 1 • Slots 0-5460</text>
                  <rect x="12" y="36" width="32" height="11" rx="2" fill="var(--primary-grad-stop)" stroke="var(--primary-grad-stroke)" strokeWidth="0.5" />
                  <text x="28" y="44" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--primary-grad-text)">ACTIVE</text>
                </g>

                {/* Node 2: Primary Node (Shard 2) */}
                <g transform="translate(18, 112)" filter="url(#shadow-premium)">
                  <rect width="164" height="52" rx="6" fill="url(#primary-grad)" stroke="var(--primary-grad-stroke)" strokeWidth="1.5" />
                  <text x="12" y="18" fontSize="10.5" fontWeight="800" fill="var(--primary-grad-text)">Primary Node</text>
                  <text x="12" y="30" fontSize="8" fill="var(--primary-grad-stroke)" fontWeight="bold">Shard 2 • Slots 5461-10922</text>
                  <rect x="12" y="36" width="32" height="11" rx="2" fill="var(--primary-grad-stop)" stroke="var(--primary-grad-stroke)" strokeWidth="0.5" />
                  <text x="28" y="44" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--primary-grad-text)">ACTIVE</text>
                </g>

                {/* Node 3: Replica (Shard 3) */}
                <g transform="translate(18, 172)" filter="url(#shadow-premium)">
                  <rect width="164" height="52" rx="6" fill="url(#replica-grad)" stroke="var(--replica-grad-stroke)" strokeWidth="1.2" />
                  <text x="12" y="18" fontSize="10.5" fontWeight="800" fill="var(--replica-grad-text)">Replica Node</text>
                  <text x="12" y="30" fontSize="8" fill="var(--replica-grad-stroke)" fontWeight="bold">Shard 3 Replica (from AZ-2)</text>
                  <rect x="12" y="36" width="44" height="11" rx="2" fill="var(--replica-grad-stop)" stroke="var(--replica-grad-stroke)" strokeWidth="0.5" />
                  <text x="34" y="44" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--replica-grad-text)">READONLY</text>
                </g>
              </g>

              {/* AZ-2 Subnet */}
              <g transform="translate(240, 48)">
                <rect width="200" height="246" rx="12" fill="none" stroke="var(--ec-svg-line-stroke)" strokeWidth="1" strokeDasharray="6,4" />
                <rect x="5" y="5" width="190" height="22" rx="4" fill="var(--ec-inner-card-bg)" stroke="var(--ec-inner-card-border)" strokeWidth="1" />
                <text x="100" y="19" textAnchor="middle" fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">AZ-2 (us-east-1b)</text>
                
                <rect x="8" y="32" width="184" height="206" rx="8" fill="rgba(245, 158, 11, 0.01)" stroke="var(--primary-grad-stroke)" strokeWidth="1.2" strokeDasharray="4,2" />
                <text x="15" y="44" fontSize="7.5" fill="var(--primary-grad-stroke)" fontWeight="bold">Private Cache Subnet</text>

                {/* Node 1: Replica Node (Shard 1) */}
                <g transform="translate(18, 52)" filter="url(#shadow-premium)">
                  <rect width="164" height="52" rx="6" fill="url(#replica-grad)" stroke="var(--replica-grad-stroke)" strokeWidth="1.2" />
                  <text x="12" y="18" fontSize="10.5" fontWeight="800" fill="var(--replica-grad-text)">Replica Node</text>
                  <text x="12" y="30" fontSize="8" fill="var(--replica-grad-stroke)" fontWeight="bold">Shard 1 Replica (from AZ-1)</text>
                  <rect x="12" y="36" width="44" height="11" rx="2" fill="var(--replica-grad-stop)" stroke="var(--replica-grad-stroke)" strokeWidth="0.5" />
                  <text x="34" y="44" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--replica-grad-text)">READONLY</text>
                </g>

                {/* Node 2: Primary Node (Shard 3) */}
                <g transform="translate(18, 112)" filter="url(#shadow-premium)">
                  <rect width="164" height="52" rx="6" fill="url(#primary-grad)" stroke="var(--primary-grad-stroke)" strokeWidth="1.5" />
                  <text x="12" y="18" fontSize="10.5" fontWeight="800" fill="var(--primary-grad-text)">Primary Node</text>
                  <text x="12" y="30" fontSize="8" fill="var(--primary-grad-stroke)" fontWeight="bold">Shard 3 • Slots 10923-16383</text>
                  <rect x="12" y="36" width="32" height="11" rx="2" fill="var(--primary-grad-stop)" stroke="var(--primary-grad-stroke)" strokeWidth="0.5" />
                  <text x="28" y="44" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--primary-grad-text)">ACTIVE</text>
                </g>

                {/* Node 3: Replica Node (Shard 2) */}
                <g transform="translate(18, 172)" filter="url(#shadow-premium)">
                  <rect width="164" height="52" rx="6" fill="url(#replica-grad)" stroke="var(--replica-grad-stroke)" strokeWidth="1.2" />
                  <text x="12" y="18" fontSize="10.5" fontWeight="800" fill="var(--replica-grad-text)">Replica Node</text>
                  <text x="12" y="30" fontSize="8" fill="var(--replica-grad-stroke)" fontWeight="bold">Shard 2 Replica (from AZ-1)</text>
                  <rect x="12" y="36" width="44" height="11" rx="2" fill="var(--replica-grad-stop)" stroke="var(--replica-grad-stroke)" strokeWidth="0.5" />
                  <text x="34" y="44" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--replica-grad-text)">READONLY</text>
                </g>
              </g>

              {/* AZ-3 Subnet */}
              <g transform="translate(460, 48)">
                <rect width="200" height="246" rx="12" fill="none" stroke="var(--ec-svg-line-stroke)" strokeWidth="1" strokeDasharray="6,4" />
                <rect x="5" y="5" width="190" height="22" rx="4" fill="var(--ec-inner-card-bg)" stroke="var(--ec-inner-card-border)" strokeWidth="1" />
                <text x="100" y="19" textAnchor="middle" fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">AZ-3 (us-east-1c)</text>
                
                <rect x="8" y="32" width="184" height="206" rx="8" fill="rgba(245, 158, 11, 0.01)" stroke="var(--primary-grad-stroke)" strokeWidth="1.2" strokeDasharray="4,2" />
                <text x="15" y="44" fontSize="7.5" fill="var(--primary-grad-stroke)" fontWeight="bold">Private Cache Subnet</text>

                {/* Node 1: Replica Node (Shard 2) */}
                <g transform="translate(18, 52)" filter="url(#shadow-premium)">
                  <rect width="164" height="52" rx="6" fill="url(#replica-grad)" stroke="var(--replica-grad-stroke)" strokeWidth="1.2" />
                  <text x="12" y="18" fontSize="10.5" fontWeight="800" fill="var(--replica-grad-text)">Replica Node</text>
                  <text x="12" y="30" fontSize="8" fill="var(--replica-grad-stroke)" fontWeight="bold">Shard 2 Replica (from AZ-1)</text>
                  <rect x="12" y="36" width="44" height="11" rx="2" fill="var(--replica-grad-stop)" stroke="var(--replica-grad-stroke)" strokeWidth="0.5" />
                  <text x="34" y="44" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--replica-grad-text)">READONLY</text>
                </g>

                {/* Node 2: Replica Node (Shard 3) */}
                <g transform="translate(18, 112)" filter="url(#shadow-premium)">
                  <rect width="164" height="52" rx="6" fill="url(#replica-grad)" stroke="var(--replica-grad-stroke)" strokeWidth="1.2" />
                  <text x="12" y="18" fontSize="10.5" fontWeight="800" fill="var(--replica-grad-text)">Replica Node</text>
                  <text x="12" y="30" fontSize="8" fill="var(--replica-grad-stroke)" fontWeight="bold">Shard 3 Replica (from AZ-2)</text>
                  <rect x="12" y="36" width="44" height="11" rx="2" fill="var(--replica-grad-stop)" stroke="var(--replica-grad-stroke)" strokeWidth="0.5" />
                  <text x="34" y="44" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--replica-grad-text)">READONLY</text>
                </g>

                {/* Node 3: Replica Node (Shard 1) */}
                <g transform="translate(18, 172)" filter="url(#shadow-premium)">
                  <rect width="164" height="52" rx="6" fill="url(#replica-grad)" stroke="var(--replica-grad-stroke)" strokeWidth="1.2" />
                  <text x="12" y="18" fontSize="10.5" fontWeight="800" fill="var(--replica-grad-text)">Replica Node</text>
                  <text x="12" y="30" fontSize="8" fill="var(--replica-grad-stroke)" fontWeight="bold">Shard 1 Replica (from AZ-1)</text>
                  <rect x="12" y="36" width="44" height="11" rx="2" fill="var(--replica-grad-stop)" stroke="var(--replica-grad-stroke)" strokeWidth="0.5" />
                  <text x="34" y="44" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--replica-grad-text)">READONLY</text>
                </g>
              </g>

              {/* Shard 1 Sync Conduit Channels */}
              <path d="M 202 126 L 258 126" fill="none" className="ec-flow-orange" strokeWidth="1.5" markerEnd="url(#ec-arrow-orange)" />
              <path d="M 202 126 C 230 126, 380 246, 478 246" fill="none" className="ec-flow-orange" strokeWidth="1.5" markerEnd="url(#ec-arrow-orange)" />

              {/* Shard 2 Sync Conduit Channels */}
              <path d="M 202 186 C 220 186, 230 246, 258 246" fill="none" className="ec-flow-purple" strokeWidth="1.5" markerEnd="url(#ec-arrow-purple)" />
              <path d="M 202 186 C 230 186, 380 126, 478 126" fill="none" className="ec-flow-purple" strokeWidth="1.5" markerEnd="url(#ec-arrow-purple)" />

              {/* Shard 3 Sync Conduit Channels */}
              <path d="M 258 186 C 240 186, 230 246, 202 246" fill="none" className="ec-flow-green" strokeWidth="1.5" markerEnd="url(#ec-arrow-green)" />
              <path d="M 422 186 L 478 186" fill="none" className="ec-flow-green" strokeWidth="1.5" markerEnd="url(#ec-arrow-green)" />
            </svg>

            <div className="ec-g2" style={{ marginBottom: '10px' }}>
              <div>
                <div className="ec-sec">Full Infrastructure Integration</div>
                <svg width="100%" viewBox="0 0 340 460" className="ec-svg-bg" style={{ display: 'block' }}>
                  <defs>
                    <marker id="ai-arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-blue)" />
                    </marker>
                    <marker id="ai-arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-amber)" />
                    </marker>
                    <marker id="ai-arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-green)" />
                    </marker>
                    <marker id="ai-arrow-purple" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-purple)" />
                    </marker>
                    <filter id="ai-shadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.05" />
                    </filter>
                  </defs>
                  
                  {/* ==================== 1. DMZ / PUBLIC EDGE NETWORK ==================== */}
                  <rect x="8" y="10" width="324" height="60" rx="8" fill="none" stroke="var(--ec-svg-line-stroke)" strokeWidth="1" strokeDasharray="4,2" />
                  <text x="14" y="21" fill="var(--color-text-tertiary)" fontSize="7" fontWeight="bold">Edge Network &amp; DNS Zone</text>
                  
                  {/* CloudFront Card */}
                  <g filter="url(#ai-shadow)" transform="translate(15, 26)">
                    <rect width="310" height="36" rx="6" fill="var(--purple-grad-start)" stroke="var(--purple-grad-stroke)" strokeWidth="1.2" />
                    <text x="155" y="22" textAnchor="middle" fontSize="11" fill="var(--purple-grad-text)" fontWeight="bold">🌐 Route 53 &amp; CloudFront CDN</text>
                  </g>
 
                  {/* ==================== 2. PUBLIC INGRESS SUBNET ==================== */}
                  <rect x="8" y="78" width="324" height="60" rx="8" fill="none" stroke="var(--primary-grad-stroke)" strokeWidth="1" strokeDasharray="4,2" />
                  <text x="14" y="89" fill="var(--primary-grad-stroke)" fontSize="7" fontWeight="bold">Public Ingress Subnet (ALB)</text>
                  
                  {/* ALB Card */}
                  <g filter="url(#ai-shadow)" transform="translate(15, 94)">
                    <rect width="310" height="36" rx="6" fill="var(--primary-grad-start)" stroke="var(--primary-grad-stroke)" strokeWidth="1.2" />
                    <text x="155" y="22" textAnchor="middle" fontSize="11" fill="var(--primary-grad-text)" fontWeight="bold">⚖️ Application Load Balancer (ALB)</text>
                  </g>
 
                  {/* ==================== 3. PRIVATE APPLICATION SUBNET ==================== */}
                  <rect x="8" y="146" width="324" height="64" rx="8" fill="none" stroke="var(--client-grad-stroke)" strokeWidth="1" strokeDasharray="4,2" />
                  <text x="14" y="157" fill="var(--client-grad-text)" fontSize="7" fontWeight="bold">Private Compute Subnet (ECS / Lambda)</text>
 
                  {/* Compute Nodes */}
                  <g filter="url(#ai-shadow)" transform="translate(15, 162)">
                    <rect width="144" height="40" rx="6" fill="var(--client-grad-start)" stroke="var(--client-grad-stroke)" strokeWidth="1.2" />
                    <text x="72" y="24" textAnchor="middle" fontSize="10.5" fill="var(--client-grad-text)" fontWeight="bold">🖥️ ECS App Servers</text>
                  </g>
                  <g filter="url(#ai-shadow)" transform="translate(181, 162)">
                    <rect width="144" height="40" rx="6" fill="var(--client-grad-start)" stroke="var(--client-grad-stroke)" strokeWidth="1.2" />
                    <text x="72" y="24" textAnchor="middle" fontSize="10.5" fill="var(--client-grad-text)" fontWeight="bold">⚙️ Lambda Functions</text>
                  </g>
 
                  {/* ==================== 4. PRIVATE CACHING SUBNET ==================== */}
                  <rect x="8" y="218" width="324" height="68" rx="8" fill="none" stroke="var(--color-amber)" strokeWidth="1" strokeDasharray="4,2" />
                  <text x="14" y="229" fill="var(--color-amber)" fontSize="7" fontWeight="bold">Private Caching Subnet (ElastiCache)</text>
 
                  {/* ElastiCache Card */}
                  <g filter="url(#ai-shadow)" transform="translate(80, 233)">
                    <rect width="180" height="46" rx="6" fill="var(--amber-grad-start)" stroke="var(--amber-grad-stroke)" strokeWidth="1.5" />
                    <text x="90" y="20" textAnchor="middle" fontSize="12" fill="var(--amber-grad-text)" fontWeight="bold">⚡ ElastiCache Redis Cluster</text>
                    <text x="90" y="34" textAnchor="middle" fontSize="9" fill="var(--color-amber)" fontWeight="bold">In-Memory Replication Group</text>
                  </g>
 
                  {/* ==================== 5. PRIVATE DATABASE SUBNET ==================== */}
                  <rect x="8" y="294" width="324" height="72" rx="8" fill="none" stroke="var(--color-green)" strokeWidth="1" strokeDasharray="4,2" />
                  <text x="14" y="305" fill="var(--color-green)" fontSize="7" fontWeight="bold">Private Datastore Subnet (RDS / Aurora)</text>
 
                  {/* Datastore Nodes */}
                  <g filter="url(#ai-shadow)" transform="translate(15, 310)">
                    <rect width="144" height="48" rx="6" fill="var(--replica-grad-start)" stroke="var(--replica-grad-stroke)" strokeWidth="1.2" />
                    <text x="72" y="22" textAnchor="middle" fontSize="11" fill="var(--replica-grad-text)" fontWeight="bold">🗄️ Aurora Postgres</text>
                    <text x="72" y="36" textAnchor="middle" fontSize="9" fill="var(--color-green)">Source of Truth</text>
                  </g>
                  <g filter="url(#ai-shadow)" transform="translate(181, 310)">
                    <rect width="144" height="48" rx="6" fill="var(--purple-grad-start)" stroke="var(--purple-grad-stroke)" strokeWidth="1.2" />
                    <text x="72" y="22" textAnchor="middle" fontSize="11" fill="var(--purple-grad-text)" fontWeight="bold">📦 S3 / DynamoDB</text>
                    <text x="72" y="36" textAnchor="middle" fontSize="9" fill="var(--color-purple)">Object / NoSQL</text>
                  </g>
 
                  {/* ==================== 6. MANAGEMENT & SECURITY PLANE ==================== */}
                  <rect x="8" y="374" width="324" height="62" rx="8" fill="none" stroke="var(--teal-grad-stroke)" strokeWidth="1" strokeDasharray="4,2" />
                  <text x="14" y="385" fill="var(--teal-grad-text)" fontSize="7" fontWeight="bold">AWS CloudWatch &amp; Telemetry Subsystem</text>
 
                  {/* Management Card */}
                  <g filter="url(#ai-shadow)" transform="translate(15, 390)">
                    <rect width="310" height="38" rx="6" fill="var(--teal-grad-start)" stroke="var(--teal-grad-stroke)" strokeWidth="1.2" />
                    <text x="155" y="23" textAnchor="middle" fontSize="11" fill="var(--teal-grad-text)" fontWeight="bold">📊 CloudWatch metrics, X-Ray telemetry &amp; logs</text>
                  </g>
 
                  {/* Conduit Routing Connections */}
                  {/* CDN to ALB */}
                  <path d="M 170 62 L 170 94" fill="none" className="ec-flow-purple" strokeWidth="2" markerEnd="url(#ai-arrow-purple)" />
 
                  {/* ALB to App (EC2 & Lambda) */}
                  <path d="M 120 130 C 100 130, 87 142, 87 162" fill="none" className="ec-flow-blue" strokeWidth="1.5" markerEnd="url(#ai-arrow-blue)" />
                  <path d="M 220 130 C 240 130, 253 142, 253 162" fill="none" className="ec-flow-blue" strokeWidth="1.5" markerEnd="url(#ai-arrow-blue)" />
 
                  {/* App to Cache (High-speed Query path) */}
                  <path d="M 87 202 C 87 218, 120 233, 140 233" fill="none" className="ec-flow-orange" strokeWidth="1.5" markerEnd="url(#ai-arrow-orange)" />
                  <path d="M 253 202 C 253 218, 220 233, 200 233" fill="none" className="ec-flow-orange" strokeWidth="1.5" markerEnd="url(#ai-arrow-orange)" />
 
                  {/* Cache DB Syncs (Cache Miss paths) */}
                  <path d="M 130 279 C 110 279, 87 290, 87 310" fill="none" className="ec-flow-purple" strokeWidth="1.2" strokeDasharray="3,2" markerEnd="url(#ai-arrow-purple)" />
                  <path d="M 210 279 C 230 279, 253 290, 253 310" fill="none" className="ec-flow-purple" strokeWidth="1.2" strokeDasharray="3,2" markerEnd="url(#ai-arrow-purple)" />
 
                  {/* Datastore Telemetry Outlets */}
                  <path d="M 87 358 L 87 390" fill="none" className="ec-flow-green" strokeWidth="1.2" markerEnd="url(#ai-arrow-green)" />
                  <path d="M 253 358 L 253 390" fill="none" className="ec-flow-green" strokeWidth="1.2" markerEnd="url(#ai-arrow-green)" />
                </svg>
              </div>
              <div>
                <div className="ec-sec">Redis Cluster vs Replication Group</div>
                <div className="ec-card" style={{ borderLeft: '3px solid var(--color-red)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: 'var(--color-red)' }}>Cluster Mode DISABLED (Replication Group)</div>
                  <div className="ec-kv"><span className="ec-kk">Shards</span><b>1 shard only</b></div>
                  <div className="ec-kv"><span className="ec-kk">Replicas</span><b>Up to 5 read replicas</b></div>
                  <div className="ec-kv"><span className="ec-kk">Failover</span><b>✅ Auto-failover to replica</b></div>
                  <div className="ec-kv"><span className="ec-kk">Scale</span><b>Vertical (change node type)</b></div>
                  <div className="ec-kv"><span className="ec-kk">Max data</span><b>Limited to 1 node memory</b></div>
                  <div className="ec-kv"><span className="ec-kk">Best for</span><b>Sessions, small-medium datasets</b></div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid var(--color-green)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: 'var(--color-green)' }}>Cluster Mode ENABLED</div>
                  <div className="ec-kv"><span className="ec-kk">Shards</span><b>Up to 500 shards</b></div>
                  <div className="ec-kv"><span className="ec-kk">Slots</span><b>16,384 hash slots distributed</b></div>
                  <div className="ec-kv"><span className="ec-kk">Replicas</span><b>0–5 per shard</b></div>
                  <div className="ec-kv"><span className="ec-kk">Scale</span><b>Horizontal (add shards online)</b></div>
                  <div className="ec-kv"><span className="ec-kk">Max data</span><b>Virtually unlimited</b></div>
                  <div className="ec-kv"><span className="ec-kk">Best for</span><b>Large datasets, high write throughput</b></div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid var(--color-blue)' }}>
                  <div style={{ fontWeight: 500, fontSize: '12px', marginBottom: '6px', color: 'var(--color-blue)' }}>Memcached Architecture</div>
                  <div className="ec-kv"><span className="ec-kk">Nodes</span><b>1–40 nodes per cluster</b></div>
                  <div className="ec-kv"><span className="ec-kk">Sharding</span><b>Client-side (consistent hashing)</b></div>
                  <div className="ec-kv"><span className="ec-kk">Replication</span><b style={{ color: 'var(--color-red)' }}>❌ None</b></div>
                  <div className="ec-kv"><span className="ec-kk">Failover</span><b style={{ color: 'var(--color-red)' }}>❌ Node loss = data loss</b></div>
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
                    background: activeUsecase === key ? 'var(--color-green)' : undefined,
                    color: activeUsecase === key ? '#fff' : undefined,
                    borderColor: activeUsecase === key ? 'var(--color-green)' : undefined,
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
                    <marker id="uc-arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-blue)" />
                    </marker>
                    <marker id="uc-arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-green)" />
                    </marker>
                    <marker id="uc-arrow-orange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-amber)" />
                    </marker>
                    <marker id="uc-arrow-red" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-red)" />
                    </marker>
                    <filter id="uc-shadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.05" />
                    </filter>
                  </defs>
                  
                  {/* ==================== 1. COMPUTE SUBNET TIER ==================== */}
                  <rect x="8" y="10" width="324" height="62" rx="8" fill="none" stroke="var(--ec-svg-line-stroke)" strokeWidth="1" strokeDasharray="4,2" />
                  <text x="14" y="21" fill="var(--color-text-tertiary)" fontSize="7" fontWeight="bold">VPC Private Application Subnet</text>
                  
                  {/* App Node */}
                  <g filter="url(#uc-shadow)" transform="translate(15, 26)">
                    <rect width="310" height="38" rx="6" fill="var(--client-grad-start)" stroke="var(--client-grad-stroke)" strokeWidth="1.5" />
                    <text x="155" y="23" textAnchor="middle" fontSize="11" fill="var(--client-grad-text)" fontWeight="bold">🖥️ Application Web Compute (ECS / Lambda)</text>
                  </g>
                  
                  {/* ==================== 2. CACHING SUBNET TIER ==================== */}
                  <rect x="8" y="84" width="324" height="66" rx="8" fill="none" stroke="var(--primary-grad-stroke)" strokeWidth="1" strokeDasharray="4,2" />
                  <text x="14" y="95" fill="var(--primary-grad-stroke)" fontSize="7" fontWeight="bold">VPC Private In-Memory Caching Subnet</text>
                  
                  {/* Cache Node - Styled dynamically by selected usecase colors */}
                  <g filter="url(#uc-shadow)" transform="translate(80, 100)">
                    <rect width="180" height="42" rx="6" fill={ucData[activeUsecase].svgFill} stroke={ucData[activeUsecase].svgColor} strokeWidth="1.5" style={{ transition: 'all 0.3s ease-in-out' }} />
                    <text x="90" y="25" textAnchor="middle" fontSize="12" fill={ucData[activeUsecase].svgColor} fontWeight="bold" style={{ transition: 'all 0.3s ease' }}>⚡ ElastiCache Redis</text>
                  </g>
                  
                  {/* ==================== 3. DATASTORE SUBNET TIER ==================== */}
                  <rect x="8" y="162" width="324" height="66" rx="8" fill="none" stroke="var(--color-blue)" strokeWidth="1" strokeDasharray="4,2" />
                  <text x="14" y="173" fill="var(--color-blue)" fontSize="7" fontWeight="bold">VPC Private Authoritative DB Subnet</text>
 
                  {/* Relational DB Node */}
                  <g filter="url(#uc-shadow)" transform="translate(80, 178)">
                    <rect width="180" height="42" rx="6" fill="var(--client-grad-start)" stroke="var(--client-grad-stroke)" strokeWidth="1.5" />
                    <text x="90" y="25" textAnchor="middle" fontSize="11" fill="var(--client-grad-text)" fontWeight="bold">🗄️ Relational DB (RDS / Aurora)</text>
                  </g>
                  
                  {/* Connections & Dynamic Flows */}
                  {/* App -> Cache (Check query) */}
                  <path d="M 162 64 L 162 100" fill="none" className="ec-flow-orange" strokeWidth="1.5" markerEnd="url(#uc-arrow-orange)" />
                  
                  {/* Cache -> App (Fast HIT - Return cache) */}
                  <path d="M 178 100 L 178 64" fill="none" className="ec-flow-green" strokeWidth="1.5" markerEnd="url(#uc-arrow-green)" />
                  
                  {/* Cache -> DB (MISS - Fetch source) */}
                  <path d="M 162 142 L 162 178" fill="none" className="ec-flow-red" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#uc-arrow-red)" />
                  
                  {/* DB -> App (Write-back / populate app data) */}
                  <path d="M 260 199 C 290 199, 290 45, 180 45" fill="none" className="ec-flow-blue" strokeWidth="1.2" strokeDasharray="4,2" markerEnd="url(#uc-arrow-blue)" />
                  
                  {/* HIT indicator badge */}
                  <g filter="url(#uc-shadow)" transform="translate(15, 246)">
                    <rect width="144" height="40" rx="8" fill="var(--replica-grad-start)" stroke="var(--replica-grad-stroke)" strokeWidth="1.5" />
                    <text x="72" y="24" textAnchor="middle" fontSize="11" fill="var(--color-green)" fontWeight="bold">✅ HIT → Latency &lt;1ms</text>
                  </g>
                  
                  {/* MISS indicator badge */}
                  <g filter="url(#uc-shadow)" transform="translate(181, 246)">
                    <rect width="144" height="40" rx="8" fill="var(--primary-grad-start)" stroke="var(--primary-grad-stroke)" strokeWidth="1.5" />
                    <text x="72" y="24" textAnchor="middle" fontSize="11" fill="var(--color-red)" fontWeight="bold">❌ MISS → DB query 25ms</text>
                  </g>
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
                    <marker id="sec-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--color-green)" />
                    </marker>
                    <filter id="sec-shadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.05" />
                    </filter>
                  </defs>
                  
                  {/* Outer boundary */}
                  <rect x="10" y="10" width="320" height="440" rx="16" fill="var(--ec-subnets-bg)" stroke="var(--ec-svg-line-stroke)" strokeWidth="1.5"/>
                  <text x="170" y="28" textAnchor="middle" fontSize="12" fill="var(--color-text-primary)" fontWeight="800">VPC Security Architecture</text>
 
                  {/* ==================== 1. INGRESS FIREWALL BOUNDARY (App & SGs) ==================== */}
                  <rect x="18" y="38" width="304" height="194" rx="8" fill="none" stroke="var(--primary-grad-stroke)" strokeWidth="1" strokeDasharray="4,2" />
                  <text x="24" y="48" fill="var(--primary-grad-stroke)" fontSize="7" fontWeight="bold">Ingress Access Firewall Domain</text>
 
                  {/* App Node */}
                  <g filter="url(#sec-shadow)" transform="translate(25, 54)">
                    <rect width="290" height="48" rx="6" fill="var(--primary-grad-start)" stroke="var(--primary-grad-stroke)" strokeWidth="1.5" />
                    <text x="145" y="20" textAnchor="middle" fontSize="12" fill="var(--primary-grad-text)" fontWeight="bold">🌐 App Server Subnet Group (ECS / EC2)</text>
                    <text x="145" y="36" textAnchor="middle" fontSize="9.5" fill="var(--primary-grad-stroke)">Inbound Client Requests Initiated</text>
                  </g>
 
                  {/* Security Groups */}
                  <g filter="url(#sec-shadow)" transform="translate(25, 120)">
                    <rect width="290" height="48" rx="6" fill="var(--primary-grad-start)" stroke="var(--primary-grad-stroke)" strokeWidth="1.5" />
                    <text x="145" y="20" textAnchor="middle" fontSize="12" fill="var(--primary-grad-text)" fontWeight="bold">🛡️ Security Groups (Stateful SG)</text>
                    <text x="145" y="36" textAnchor="middle" fontSize="9.5" fill="var(--primary-grad-stroke)">Inbound Port 6379 strictly limited to App SG</text>
                  </g>
 
                  {/* TLS Transit Encryption */}
                  <g filter="url(#sec-shadow)" transform="translate(25, 176)">
                    <rect width="290" height="48" rx="6" fill="var(--client-grad-start)" stroke="var(--client-grad-stroke)" strokeWidth="1.5" />
                    <text x="145" y="20" textAnchor="middle" fontSize="12" fill="var(--client-grad-text)" fontWeight="bold">🔒 TLS Transit Encryption (In-Transit)</text>
                    <text x="145" y="36" textAnchor="middle" fontSize="9.5" fill="var(--client-grad-stroke)">TLS 1.2+ Handshake • Secure Tunnel</text>
                  </g>
 
                  {/* ==================== 2. IDENTITY & CREDENTIAL BOUNDARY ==================== */}
                  <rect x="18" y="238" width="304" height="154" rx="8" fill="none" stroke="var(--purple-grad-stroke)" strokeWidth="1" strokeDasharray="4,2" />
                  <text x="24" y="248" fill="var(--purple-grad-text)" fontSize="7" fontWeight="bold">Cryptographic Identity &amp; Key Gateways</text>
 
                  {/* Authentication */}
                  <g filter="url(#sec-shadow)" transform="translate(25, 254)">
                    <rect width="290" height="74" rx="6" fill="var(--purple-grad-start)" stroke="var(--purple-grad-stroke)" strokeWidth="1.5" />
                    <text x="145" y="20" textAnchor="middle" fontSize="12" fill="var(--purple-grad-text)" fontWeight="bold">🔑 Authentication &amp; RBAC Access Control</text>
                    
                    <rect x="10" y="28" width="130" height="34" rx="4" fill="var(--ec-inner-card-bg)" stroke="var(--purple-grad-stroke)" strokeWidth="1" />
                    <text x="75" y="42" textAnchor="middle" fontSize="10.5" fill="var(--purple-grad-text)" fontWeight="bold">Redis AUTH Token</text>
                    <text x="75" y="53" textAnchor="middle" fontSize="8" fill="var(--purple-grad-stroke)">Cluster Password</text>
                    
                    <rect x="150" y="28" width="130" height="34" rx="4" fill="var(--ec-inner-card-bg)" stroke="var(--purple-grad-stroke)" strokeWidth="1" />
                    <text x="215" y="42" textAnchor="middle" fontSize="10.5" fill="var(--purple-grad-text)" fontWeight="bold">IAM Role Integration</text>
                    <text x="215" y="53" textAnchor="middle" fontSize="8" fill="var(--purple-grad-stroke)">Auto-rotating Token</text>
                  </g>
 
                  {/* Encryption at Rest */}
                  <g filter="url(#sec-shadow)" transform="translate(25, 336)">
                    <rect width="290" height="48" rx="6" fill="var(--purple-grad-start)" stroke="var(--purple-grad-stroke)" strokeWidth="1.5" />
                    <text x="145" y="20" textAnchor="middle" fontSize="12" fill="var(--purple-grad-text)" fontWeight="bold">🔐 Data Protection at Rest (KMS Keys)</text>
                    <text x="145" y="36" textAnchor="middle" fontSize="9.5" fill="var(--purple-grad-stroke)">Snapshots &amp; RDB/AOF encrypted via AWS CMK</text>
                  </g>
 
                  {/* ==================== 3. NETWORK ISOLATION SUBNETS ==================== */}
                  <g filter="url(#sec-shadow)" transform="translate(25, 400)">
                    <rect width="290" height="40" rx="6" fill="var(--teal-grad-start)" stroke="var(--teal-grad-stroke)" strokeWidth="1.5" />
                    <text x="145" y="24" textAnchor="middle" fontSize="11" fill="var(--teal-grad-text)" fontWeight="bold">🏝️ Isolated Subnets • No Public IP Address Allowed</text>
                  </g>
 
                  {/* Secure Active Emerald Conduits */}
                  <path d="M 170 102 L 170 120" fill="none" className="ec-flow-green" strokeWidth="1.5" markerEnd="url(#sec-arrow)" />
                  <path d="M 170 168 L 170 176" fill="none" className="ec-flow-green" strokeWidth="1.5" markerEnd="url(#sec-arrow)" />
                  <path d="M 170 224 L 170 254" fill="none" className="ec-flow-green" strokeWidth="1.5" markerEnd="url(#sec-arrow)" />
                  <path d="M 170 328 L 170 336" fill="none" className="ec-flow-green" strokeWidth="1.5" markerEnd="url(#sec-arrow)" />
                  <path d="M 170 384 L 170 400" fill="none" className="ec-flow-green" strokeWidth="1.5" markerEnd="url(#sec-arrow)" />
                </svg>
              </div>
              <div>
                <div className="ec-sec">Auth methods explained</div>
                <div className="ec-card" style={{ borderLeft: '3px solid var(--color-red)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--color-red)' }}>🔑 Redis AUTH (Classic)</div>
                  <div className="ec-kv"><span className="ec-kk">How</span><b>Single password token set on cluster</b></div>
                  <div className="ec-kv"><span className="ec-kk">Command</span><b style={{ fontFamily: 'monospace', fontSize: '11px' }}>AUTH &lt;password&gt;</b></div>
                  <div className="ec-kv"><span className="ec-kk">Engines</span><b>Redis 2.8+</b></div>
                  <div className="ec-kv"><span className="ec-kk">Rotate</span><b>Via Secrets Manager + app update</b></div>
                  <div className="ec-kv"><span className="ec-kk">Limitation</span><b>Single shared password</b></div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid var(--color-green)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--color-green)' }}>🔑 Redis RBAC (Redis 6+)</div>
                  <div className="ec-kv"><span className="ec-kk">How</span><b>Multiple users with ACL rules</b></div>
                  <div className="ec-kv"><span className="ec-kk">Permissions</span><b>Per-command, per-key-pattern</b></div>
                  <div className="ec-kv"><span className="ec-kk">Example</span><b>readonly user: GET only, no SET/DEL</b></div>
                  <div className="ec-kv"><span className="ec-kk">Best for</span><b>Multi-tenant, least-privilege access</b></div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid var(--color-purple)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--color-purple)' }}>🔑 IAM Auth (Redis 7+ / Valkey)</div>
                  <div className="ec-kv"><span className="ec-kk">How</span><b>IAM role → temp token → Redis AUTH</b></div>
                  <div className="ec-kv"><span className="ec-kk">No password</span><b>Token auto-rotates (15 min TTL)</b></div>
                  <div className="ec-kv"><span className="ec-kk">Best for</span><b>Lambda, ECS, EC2 (no stored creds)</b></div>
                </div>
                <div className="ec-card" style={{ borderLeft: '3px solid var(--teal-grad-text)', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--teal-grad-text)' }}>🔐 Encryption at Rest</div>
                  <div className="ec-kv"><span className="ec-kk">Covers</span><b>RDB snapshots, AOF logs, swap files</b></div>
                  <div className="ec-kv"><span className="ec-kk">Key</span><b>aws/elasticache or Customer KMS CMK</b></div>
                  <div className="ec-kv"><span className="ec-kk">Enable when?</span><b style={{ color: 'var(--color-red)' }}>At cluster creation only</b></div>
                  <div className="ec-kv"><span className="ec-kk">Memcached</span><b style={{ color: 'var(--color-red)' }}>❌ No encryption at rest</b></div>
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
                        borderColor: item.done ? 'var(--uc-green-stroke)' : 'var(--uc-red-stroke)',
                        background: item.done ? 'var(--uc-green-fill)' : 'var(--uc-red-fill)',
                        transition: 'all 0.15s ease-in-out'
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 600, color: item.done ? 'var(--uc-green-color)' : 'var(--uc-red-color)' }}>
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
                
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Cache Hit Rate (%)</div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={hitRate} 
                  style={{ width: '100%', accentColor: 'var(--color-green)', cursor: 'ew-resize' }} 
                  onChange={(e) => setHitRate(Number(e.target.value))} 
                />
                <div style={{ fontSize: '12px', marginTop: '4px', marginBottom: '12px' }}>Hit rate: <b>{hitRate}%</b></div>
                
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '8px 0 4px' }}>Requests per second</div>
                <input 
                  type="range" 
                  min="100" 
                  max="10000" 
                  step="100" 
                  value={rps} 
                  style={{ width: '100%', accentColor: 'var(--color-green)', cursor: 'ew-resize' }} 
                  onChange={(e) => setRps(Number(e.target.value))} 
                />
                <div style={{ fontSize: '12px', marginTop: '4px' }}>RPS: <b>{rps}</b></div>
                
                <div className="ec-g2" style={{ marginTop: '16px' }}>
                  <div className="ec-met"><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Cache hits/s</div><div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-green)' }}>{simulatedHits}</div></div>
                  <div className="ec-met"><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>DB queries/s</div><div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-red)' }}>{simulatedMisses}</div></div>
                  <div className="ec-met"><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Avg latency</div><div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary)' }}>{simulatedLatency}ms</div></div>
                  <div className="ec-met"><div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>DB saved %</div><div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-green)' }}>{hitRate}%</div></div>
                </div>
              </div>
              
              <div className="ec-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px' }}>📊 Request Flow Visualizer</div>
                
                <svg width="100%" viewBox="0 0 320 180" className="ec-svg-bg" style={{ display: 'block', borderRadius: '12px' }}>
                  <defs>
                    <filter id="sim-shadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#0f172a" floodOpacity="0.04" />
                    </filter>
                  </defs>

                  {/* ==================== VPC SUBNET BOUNDARIES ==================== */}
                  {/* Client Subnet Group */}
                  <rect x="6" y="58" width="76" height="64" rx="8" fill="none" stroke="var(--client-grad-stroke)" strokeWidth="1" strokeDasharray="3,2" />
                  <text x="44" y="53" textAnchor="middle" fontSize="6.5" fill="var(--client-grad-text)" fontWeight="bold">Private App Subnet</text>

                  {/* Cache Subnet Group */}
                  <rect x="185" y="10" width="100" height="72" rx="8" fill="none" stroke="var(--amber-grad-stroke)" strokeWidth="1" strokeDasharray="3,2" />
                  <text x="235" y="6" textAnchor="middle" fontSize="6.5" fill="var(--amber-grad-text)" fontWeight="bold">Private Cache Subnet</text>

                  {/* Datastore Subnet Group */}
                  <rect x="185" y="100" width="100" height="72" rx="8" fill="none" stroke="var(--client-grad-stroke)" strokeWidth="1" strokeDasharray="3,2" />
                  <text x="235" y="96" textAnchor="middle" fontSize="6.5" fill="var(--color-blue)" fontWeight="bold">Private DB Subnet</text>

                  {/* Static pipelines behind flows */}
                  <path d="M 75 90 Q 135 60 195 40" fill="none" stroke="var(--ec-svg-line-stroke)" strokeWidth="1.2" strokeDasharray="2,2" />
                  <path d="M 75 90 Q 135 115 195 130" fill="none" stroke="var(--ec-svg-line-stroke)" strokeWidth="1.2" strokeDasharray="2,2" />
                  <path d="M 235 65 L 235 110" fill="none" stroke="var(--ec-svg-line-stroke)" strokeWidth="1" strokeDasharray="2,2" />

                  {/* Cache HIT active conduit */}
                  {isRunning && hitRate > 0 && (
                    <path d="M 75 90 Q 135 60 195 40" fill="none" className="ec-flow-green" strokeWidth="2" />
                  )}

                  {/* Cache MISS active conduit */}
                  {isRunning && hitRate < 100 && (
                    <path d="M 75 90 Q 135 115 195 130" fill="none" className="ec-flow-red" strokeWidth="2" />
                  )}

                  {/* Cache DB writeback active conduit */}
                  {isRunning && hitRate < 100 && (
                    <path d="M 235 110 L 235 65" fill="none" className="ec-flow-blue" strokeWidth="1.5" />
                  )}

                  {/* Cache HIT particle motion */}
                  {isRunning && hitRate > 0 && (
                    <circle r="3.5" fill="var(--color-green)">
                      <animateMotion
                        dur={rps > 5000 ? "0.4s" : rps > 2000 ? "0.8s" : "1.4s"}
                        repeatCount="indefinite"
                        path="M 75 90 Q 135 60 195 40 Q 135 60 75 90"
                      />
                    </circle>
                  )}

                  {/* Cache MISS particle motion */}
                  {isRunning && hitRate < 100 && (
                    <circle r="3.5" fill="var(--color-red)">
                      <animateMotion
                        dur={rps > 5000 ? "0.6s" : rps > 2000 ? "1.2s" : "2.0s"}
                        repeatCount="indefinite"
                        path="M 75 90 Q 135 115 195 130"
                      />
                    </circle>
                  )}

                  {/* Client App */}
                  <g transform="translate(13, 65)" filter="url(#sim-shadow)">
                    <rect width="62" height="50" rx="6" fill="var(--client-grad-start)" stroke="var(--client-grad-stroke)" strokeWidth="1.5" />
                    <text x="31" y="24" fontSize="9.5" fontWeight="bold" fill="var(--client-grad-text)" textAnchor="middle">Client App</text>
                    <text x="31" y="38" fontSize="7.5" fill="var(--client-grad-stroke)" textAnchor="middle" fontFamily="monospace">ACTIVE</text>
                  </g>

                  {/* ElastiCache Redis Cylinder */}
                  <g transform="translate(195, 22)" filter="url(#sim-shadow)">
                    <path d="M 0 10 L 0 35 A 40 10 0 0 0 80 35 L 80 10 Z" fill="var(--amber-grad-start)" stroke="var(--amber-grad-stroke)" strokeWidth="1.5" />
                    <ellipse cx="40" cy="10" rx="40" ry="10" fill="var(--amber-grad-stop)" stroke="var(--amber-grad-stroke)" strokeWidth="1.5" />
                    <text x="40" y="28" fontSize="9.5" fontWeight="bold" fill="var(--amber-grad-text)" textAnchor="middle">⚡ Cache</text>
                    <text x="40" y="38" fontSize="7.5" fill="var(--amber-grad-stroke)" textAnchor="middle" fontFamily="monospace">RAM &lt;1ms</text>
                    {isRunning && (
                       <circle cx="72" cy="10" r="2.5" fill="var(--color-green)" className="led-blink" />
                    )}
                  </g>

                  {/* DB cylinder */}
                  <g transform="translate(195, 112)" filter="url(#sim-shadow)">
                    <path d="M 0 10 L 0 35 A 40 10 0 0 0 80 35 L 80 10 Z" fill="var(--client-grad-start)" stroke="var(--client-grad-stroke)" strokeWidth="1.5" />
                    <ellipse cx="40" cy="10" rx="40" ry="10" fill="var(--client-grad-stop)" stroke="var(--client-grad-stroke)" strokeWidth="1.5" />
                    <text x="40" y="28" fontSize="9.5" fontWeight="bold" fill="var(--client-grad-text)" textAnchor="middle">🗄️ DB</text>
                    <text x="40" y="38" fontSize="7.5" fill="var(--client-grad-stroke)" textAnchor="middle" fontFamily="monospace">Disk 20ms</text>
                    {isRunning && (
                       <circle cx="72" cy="10" r="2.5" fill="var(--color-blue)" />
                    )}
                  </g>
                </svg>

                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'var(--color-green)', borderRadius: '2px', marginRight: '4px' }}></span>Cache Hit (fast)
                  <span style={{ display: 'inline-block', width: '10px', height: '10px', background: 'var(--color-red)', borderRadius: '2px', marginRight: '4px', marginLeft: '12px' }}></span>DB Miss (slow)
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
