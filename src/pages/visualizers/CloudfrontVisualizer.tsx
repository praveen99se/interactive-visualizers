import { useState } from 'react';

type TabType = 'overview' | 'origins' | 'aga' | 'security' | 'sim' | 'pricing';
type ClientRegion = 'us' | 'eu' | 'asia';
type OriginType = 's3' | 'alb_public' | 'alb_vpc';
type HttpMethod = 'GET_STATIC' | 'GET_DYNAMIC' | 'POST';
type PriceClass = '100' | '200' | 'all';

interface SimLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export default function CloudfrontVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  
  // Simulator State
  const [clientRegion, setClientRegion] = useState<ClientRegion>('us');
  const [originType, setOriginType] = useState<OriginType>('s3');
  const [httpMethod, setHttpMethod] = useState<HttpMethod>('GET_STATIC');
  const [geoRestricted, setGeoRestricted] = useState<boolean>(false);
  const [blockedRegion, setBlockedRegion] = useState<ClientRegion>('asia');
  const [useOriginShield, setUseOriginShield] = useState<boolean>(false);
  
  // Cache States (Warm or Empty) for different combinations
  const [edgeCacheState, setEdgeCacheState] = useState<Record<string, 'empty' | 'warm'>>({
    'us-static': 'warm',
    'eu-static': 'empty',
    'asia-static': 'empty',
    'us-dynamic': 'empty',
    'eu-dynamic': 'empty',
    'asia-dynamic': 'empty',
  });
  const [recCacheState, setRecCacheState] = useState<Record<string, 'empty' | 'warm'>>({
    'us-static': 'warm',
    'eu-static': 'warm',
    'asia-static': 'empty',
  });

  const [simLogs, setSimLogs] = useState<SimLog[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      type: 'info',
      message: 'Simulator initialized. Choose your request parameters and click "Simulate Request".',
    }
  ]);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simStep, setSimStep] = useState<number>(0);
  const [simResults, setSimResults] = useState<{
    status: number;
    cacheHeader: string;
    latency: number;
    pathTaken: string[];
  } | null>(null);

  // Invalidation State
  const [invalidationPath, setInvalidationPath] = useState<string>('/*');

  // Pricing State
  const [activePriceClass, setActivePriceClass] = useState<PriceClass>('200');

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setSimLogs((prev) => [
      { timestamp: new Date().toLocaleTimeString(), type, message },
      ...prev,
    ]);
  };

  // Run the Simulation
  const handleSimulate = () => {
    if (isSimulating) return;
    
    setIsSimulating(true);
    setSimStep(1);
    setSimResults(null);
    
    const cacheKey = `${clientRegion}-${httpMethod === 'GET_STATIC' ? 'static' : 'dynamic'}`;
    const isPost = httpMethod === 'POST';
    const isDynamicGet = httpMethod === 'GET_DYNAMIC';
    
    addLog(`Initiating HTTP request: ${httpMethod} ${httpMethod === 'GET_STATIC' ? '/index.html' : httpMethod === 'GET_DYNAMIC' ? '/api/users?id=12' : '/api/users'} from Client in ${clientRegion.toUpperCase()}`, 'info');

    // Step 1: DNS Resolution & Anycast Routing
    setTimeout(() => {
      setSimStep(2);
      addLog(`Anycast DNS routing resolved to closest Edge POP. Topology lookup maps user in ${clientRegion.toUpperCase()} to nearest Edge Server.`, 'info');
      
      // Step 2: Check Geo-Restriction
      setTimeout(() => {
        if (geoRestricted && clientRegion === blockedRegion) {
          setSimStep(5); // Blocked state
          setIsSimulating(false);
          setSimResults({
            status: 403,
            cacheHeader: 'Miss (Geo-Blocked)',
            latency: 15,
            pathTaken: ['client', 'dns', 'edge'],
          });
          addLog(`CRITICAL: Access Denied! Request from ${clientRegion.toUpperCase()} matched country block list. Connection dropped at Edge Location. Origin protected.`, 'error');
          return;
        }

        setSimStep(3); // Inside Edge POP

        // Step 3: Cache Verification
        setTimeout(() => {
          if (isPost) {
            // POST bypasses cache
            setSimStep(4); // Route to origin
            addLog(`HTTP POST request bypasses cache layer by design. Proxying request directly toward origin...`, 'warning');
            
            setTimeout(() => {
              setSimStep(7); // Completed
              setIsSimulating(false);
              const latency = originType === 's3' ? 140 : 160;
              setSimResults({
                status: 201,
                cacheHeader: 'Bypassed (POST)',
                latency,
                pathTaken: ['client', 'dns', 'edge', 'origin'],
              });
              addLog(`Request successfully completed. Database entry created. Response generated from ${originType === 's3' ? 'S3 Bucket' : 'Application Load Balancer'} in 100% bypass mode.`, 'success');
            }, 800);
            return;
          }

          if (isDynamicGet) {
            // Dynamic GET (by default dynamic queries bypass edge cache unless optimized)
            setSimStep(4);
            addLog(`HTTP GET dynamic request misses Edge Cache. Proxying request toward origin...`, 'info');
            
            setTimeout(() => {
              setSimStep(7);
              setIsSimulating(false);
              const latency = originType === 's3' ? 130 : 150;
              setSimResults({
                status: 200,
                cacheHeader: 'Miss (Dynamic Content)',
                latency,
                pathTaken: ['client', 'dns', 'edge', 'origin'],
              });
              addLog(`Response delivered successfully. Content generated in real-time from origin. Latency: ${latency}ms.`, 'success');
            }, 800);
            return;
          }

          // Static GET - Cache Logic
          const edgeHit = edgeCacheState[cacheKey] === 'warm';
          
          if (edgeHit) {
            setSimStep(7); // Jump straight to completed
            setIsSimulating(false);
            const latency = 12;
            setSimResults({
              status: 200,
              cacheHeader: 'Hit from cloudfront',
              latency,
              pathTaken: ['client', 'dns', 'edge'],
            });
            addLog(`EXPRESS HIT! Asset located in Edge Cache registers. Returning response instantly with zero origin load. Latency: ${latency}ms.`, 'success');
          } else {
            addLog(`Edge Cache MISS. Traversing backplane to check Regional Edge Cache (REC)...`, 'warning');
            setSimStep(3.5); // Regional Edge Cache Step

            setTimeout(() => {
              const recHit = recCacheState[cacheKey] === 'warm';
              
              if (recHit) {
                // Warm at REC, sync to Edge and return
                setSimStep(7);
                setIsSimulating(false);
                const latency = 45;
                setSimResults({
                  status: 200,
                  cacheHeader: 'Miss (REC Hit, Syncing Edge)',
                  latency,
                  pathTaken: ['client', 'dns', 'edge', 'rec'],
                });
                // Warm the edge cache for next time
                setEdgeCacheState(prev => ({ ...prev, [cacheKey]: 'warm' }));
                addLog(`Cache HIT at Regional Edge Cache! Syncing copy down to local Edge Location. Returning response. Latency: ${latency}ms.`, 'success');
              } else {
                addLog(`Regional Edge Cache MISS. Forwarding request to Origin...`, 'warning');
                if (useOriginShield) {
                  addLog(`Origin Shield is ENABLED: Request consolidated through a dedicated centralized cache to protect origin from concurrent stampedes.`, 'info');
                }
                setSimStep(4);

                setTimeout(() => {
                  setSimStep(7);
                  setIsSimulating(false);
                  const latency = originType === 's3' ? 180 : 210;
                  setSimResults({
                    status: 200,
                    cacheHeader: 'Miss from cloudfront',
                    latency,
                    pathTaken: ['client', 'dns', 'edge', 'rec', 'origin'],
                  });
                  // Warm both REC and Edge cache for next time
                  setEdgeCacheState(prev => ({ ...prev, [cacheKey]: 'warm' }));
                  setRecCacheState(prev => ({ ...prev, [cacheKey]: 'warm' }));
                  addLog(`Cache MISS at all cache levels. Fetched fresh asset from ${originType === 's3' ? 'S3 Bucket' : 'Application Load Balancer'} origin. Populated local Edge and REC stores. Latency: ${latency}ms.`, 'success');
                }, 800);
              }
            }, 600);
          }
        }, 600);
      }, 500);
    }, 500);
  };

  // Handle cache invalidation
  const handleInvalidate = () => {
    addLog(`Cache invalidation request submitted for path: ${invalidationPath}`, 'warning');
    // Clear all static cache states
    setEdgeCacheState(prev => ({
      ...prev,
      'us-static': 'empty',
      'eu-static': 'empty',
      'asia-static': 'empty',
    }));
    setRecCacheState(prev => ({
      ...prev,
      'us-static': 'empty',
      'eu-static': 'empty',
      'asia-static': 'empty',
    }));
    addLog(`Invalidation pipeline executed successfully. Cached assets matching "${invalidationPath}" purged globally across all 600+ edge locations.`, 'success');
  };

  return (
    <div>
      <style>{`
        /* Scoped CloudFront styling */
        .cf-container { font-family: var(--font-sans, system-ui, sans-serif); color: var(--color-text-primary, #0f172a); }
        .cf-h { font-size: 22px; font-weight: 700; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .cf-sub { font-size: 13px; color: var(--color-text-secondary, #475569); line-height: 1.5; margin-bottom: 14px; }
        .cf-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-tertiary, #e2e8f0); padding-bottom: 10px; }
        .cf-tb { padding: 6px 14px; border-radius: var(--border-radius-lg, 12px); border: 0.5px solid var(--color-border-secondary, #cbd5e1); font-size: 12px; cursor: pointer; background: var(--color-background-secondary, #f8fafc); color: var(--color-text-secondary, #475569); transition: all 0.15s; outline: none; }
        .cf-tb:hover { background: var(--color-background-tertiary, #f1f5f9); }
        .cf-tb.cf-on { background: #6366f1; color: #fff; border-color: #6366f1; font-weight: 500; }
        .cf-card { border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-lg, 12px); padding: 14px 16px; background: var(--color-background-primary, #ffffff); margin-bottom: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
        .cf-sec { font-size: 11px; font-weight: 600; color: var(--color-text-secondary, #475569); text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0 8px; }
        .cf-sec:first-child { margin-top: 0; }
        .cf-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .cf-grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .cf-row { display: flex; gap: 10px; align-items: flex-start; padding: 8px 10px; border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-md, 8px); background: var(--color-background-secondary, #f8fafc); margin-bottom: 6px; font-size: 12px; line-height: 1.45; }
        .cf-dot { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 10px; color: #fff; font-weight: 600; background: #6366f1; }
        .cf-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 600; }
        .cf-binfo { background: #e0e7ff; color: #4338ca; }
        .cf-bok { background: #dcfce7; color: #15803d; }
        .cf-bwarn { background: #fef3c7; color: #b45309; }
        .cf-bbad { background: #fee2e2; color: #b91c1c; }
        .cf-controls { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
        .cf-ctrl { background: var(--color-background-secondary, #f8fafc); border: 0.5px solid var(--color-border-tertiary, #e2e8f0); border-radius: var(--border-radius-md, 8px); padding: 12px; }
        .cf-ctrl label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-secondary, #475569); margin-bottom: 6px; }
        .cf-ctrl select, .cf-ctrl input[type="text"] { width: 100%; padding: 6px; font-size: 12px; border: 0.5px solid var(--color-border-secondary, #cbd5e1); border-radius: 4px; background: var(--color-background-primary, #ffffff); outline: none; }
        .cf-ctrl select:focus, .cf-ctrl input[type="text"]:focus { border-color: #6366f1; }
        .cf-mono { font-family: var(--font-mono, monospace); font-size: 11px; }
        .cf-btnbar { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .cf-btn { font-size: 12px; padding: 6px 12px; border-radius: 6px; border: 0.5px solid var(--color-border-secondary, #cbd5e1); background: var(--color-background-primary, #ffffff); color: var(--color-text-primary, #0f172a); cursor: pointer; transition: all 0.15s; outline: none; display: inline-flex; align-items: center; gap: 4px; }
        .cf-btn:hover { background: var(--color-background-secondary, #f8fafc); }
        .cf-btn.cf-primary { background: #6366f1; border-color: #6366f1; color: #fff; }
        .cf-btn.cf-primary:hover { background: #4f46e5; }
        .cf-btn.cf-danger { background: #ef4444; border-color: #ef4444; color: #fff; }
        .cf-btn.cf-danger:hover { background: #dc2626; }
        .cf-log { background: #1e293b; border-radius: var(--border-radius-md, 8px); padding: 12px; font-size: 11px; color: #cbd5e1; line-height: 1.6; min-height: 120px; max-height: 240px; overflow-y: auto; margin-top: 12px; font-family: var(--font-mono, monospace); }
        .cf-log-entry { margin-bottom: 6px; border-bottom: 0.5px dashed #334155; padding-bottom: 4px; }
        .cf-log-entry:last-child { border: none; }
        .cf-table { width: 100%; border-collapse: collapse; font-size: 12px; line-height: 1.4; }
        .cf-table th { background: var(--color-background-secondary, #f8fafc); border: 0.5px solid var(--color-border-tertiary, #e2e8f0); padding: 8px; text-align: left; font-weight: 600; }
        .cf-table td { border: 0.5px solid var(--color-border-tertiary, #e2e8f0); padding: 8px; }
        .cf-table tr:nth-child(even) { background: var(--color-background-secondary, #f8fafc); }
        
        /* High-contrast keyword highlighting matching S3 */
        .cf-hl-cyan { background-color: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        .cf-hl-indigo { background-color: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        .cf-hl-orange { background-color: #ffedd5; color: #c2410c; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        .cf-hl-green { background-color: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
        .cf-hl-purple { background-color: #f3e8ff; color: #6b21a8; padding: 2px 6px; border-radius: 4px; font-weight: 600; }

        /* Muted descriptions in parentheses outside highlights */
        .cf-desc-mute { color: var(--color-text-secondary); font-size: 11px; font-style: italic; opacity: 0.9; font-weight: normal; background: none; padding: 0; }
      `}</style>

      <div className="cf-container">
        {/* Title Header */}
        <div style={{ padding: '14px 16px 4px' }}>
          <div className="cf-h">⚡ Amazon CloudFront — Global Content Delivery Network (CDN)</div>
          <div className="cf-sub">
            Accelerate the distribution of static web pages, dynamic applications, streaming media, and secure APIs. Cache assets at globally distributed edge nodes to lower read latencies, reduce load and egress costs on origin servers, and block malicious traffic before it reaches your private cloud perimeter.
          </div>
        </div>

        <div className="cf-tabs">
          <button className={`cf-tb ${activeTab === 'overview' ? 'cf-on' : ''}`} onClick={() => setActiveTab('overview')}>🌐 1) Concept &amp; Delivery</button>
          <button className={`cf-tb ${activeTab === 'origins' ? 'cf-on' : ''}`} onClick={() => setActiveTab('origins')}>🔌 2) Origins &amp; Integrations</button>
          <button className={`cf-tb ${activeTab === 'aga' ? 'cf-on' : ''}`} onClick={() => setActiveTab('aga')}>🚀 3) Global Accelerator</button>
          <button className={`cf-tb ${activeTab === 'security' ? 'cf-on' : ''}`} onClick={() => setActiveTab('security')}>🛡️ 4) OAC, Geo &amp; Purges</button>
          <button className={`cf-tb ${activeTab === 'sim' ? 'cf-on' : ''}`} onClick={() => setActiveTab('sim')}>🎮 5) Live Global Request Simulator</button>
          <button className={`cf-tb ${activeTab === 'pricing' ? 'cf-on' : ''}`} onClick={() => setActiveTab('pricing')}>💰 6) Pricing &amp; Shield</button>
        </div>

        {/* Tab 1: Concept & Delivery */}
        {activeTab === 'overview' && (
          <div>
            <div className="cf-sec">Amazon CloudFront — Core Architecture &amp; Request Flow</div>
            <div className="cf-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                CloudFront deploys a massive proxy and caching network spanning hundreds of cities globally. Instead of client requests traveling across public ocean floor fibers to a central database or origin server, requests are automatically routed to the topologically nearest datacenter for immediate local evaluation.
              </div>

              {/* Core Concept splits with .cf-desc-mute */}
              <div className="cf-grid2" style={{ marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#4f46e5' }}>Key Edge Concepts</div>
                  
                  <div className="cf-row">
                    <div className="cf-dot">1</div>
                    <div>
                      AWS offers <span className="cf-hl-indigo">Edge Location</span> <span className="cf-desc-mute">(a geographically distributed datacenter running a Point of Presence POP housing high-speed physical caching proxy servers)</span> as the frontline client receiver. Which means client connections terminate millisecond distances away, accelerating TCP handshakes and TLS negotiations.
                    </div>
                  </div>

                  <div className="cf-row">
                    <div className="cf-dot">2</div>
                    <div>
                      AWS offers <span className="cf-hl-indigo">Regional Edge Cache (REC)</span> <span className="cf-desc-mute">(a larger, centralized mid-tier cache location situated between edge nodes and origins to swallow edge miss requests)</span> to buffer origin servers. Which means even if individual edge nodes expire assets, the REC holds copies, shielding the origin from costly database stampedes.
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#0369a1' }}>Key Delivery Concepts</div>

                  <div className="cf-row">
                    <div className="cf-dot">3</div>
                    <div>
                      AWS offers <span className="cf-hl-cyan">DNS Anycast Routing</span> <span className="cf-desc-mute">(an IP addressing methodology where multiple physical servers share a single IP and BGP routers naturally steer packets to the topologically closest node)</span> to handle incoming requests. Which means the browser gets the same CDN domain, but physically points to different server racks depending on geography.
                    </div>
                  </div>

                  <div className="cf-row">
                    <div className="cf-dot">4</div>
                    <div>
                      AWS offers <span className="cf-hl-cyan">Origin Server</span> <span className="cf-desc-mute">(the authoritative cloud storage bucket, load balancer, API gateway, or custom server that owns the master copy of your data)</span> as the source of truth. Which means CloudFront pulls raw assets from this backend whenever a global cache lookup results in a total cache miss.
                    </div>
                  </div>
                </div>
              </div>

              {/* High Level Architecture SVG */}
              <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff', marginBottom: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  CloudFront Global Request Processing Pipeline (High-Level Topology)
                </div>
                
                <svg width="100%" viewBox="0 0 760 220" style={{ background: '#faf5ff', borderRadius: '6px', border: '0.5px solid #d8b4fe' }}>
                  <defs>
                    <marker id="acn-cf" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#6366f1" /></marker>
                    <marker id="acn-green-cf" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#16a34a" /></marker>
                  </defs>

                  {/* Geographies */}
                  <rect x="10" y="30" width="160" height="170" rx="8" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="90" y="46" textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">🌍 Client Locations</text>
                  
                  {/* Clients */}
                  <rect x="25" y="65" width="130" height="30" rx="4" fill="#eff6ff" stroke="#93c5fd" />
                  <text x="90" y="83" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e3a8a">Client US (New York)</text>
                  
                  <rect x="25" y="110" width="130" height="30" rx="4" fill="#eff6ff" stroke="#93c5fd" />
                  <text x="90" y="128" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e3a8a">Client EU (Frankfurt)</text>

                  <rect x="25" y="155" width="130" height="30" rx="4" fill="#eff6ff" stroke="#93c5fd" />
                  <text x="90" y="173" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e3a8a">Client ASIA (Tokyo)</text>

                  {/* Edge locations */}
                  <rect x="210" y="30" width="160" height="170" rx="8" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="290" y="46" textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">⚡ Edge Locations (POPs)</text>
                  
                  <rect x="225" y="65" width="130" height="30" rx="4" fill="#f5f3ff" stroke="#c084fc" />
                  <text x="290" y="83" textAnchor="middle" fontSize="9" fontWeight="600" fill="#581c87">New York Edge</text>
                  
                  <rect x="225" y="110" width="130" height="30" rx="4" fill="#f5f3ff" stroke="#c084fc" />
                  <text x="290" y="128" textAnchor="middle" fontSize="9" fontWeight="600" fill="#581c87">Frankfurt Edge</text>

                  <rect x="225" y="155" width="130" height="30" rx="4" fill="#f5f3ff" stroke="#c084fc" />
                  <text x="290" y="173" textAnchor="middle" fontSize="9" fontWeight="600" fill="#581c87">Tokyo Edge</text>

                  {/* Regional Edge Caches */}
                  <rect x="410" y="30" width="150" height="170" rx="8" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="485" y="46" textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">🛡️ Regional Edge Cache</text>
                  
                  <rect x="425" y="75" width="120" height="40" rx="4" fill="#fdf2f8" stroke="#fbcfe8" />
                  <text x="485" y="93" textAnchor="middle" fontSize="9" fontWeight="600" fill="#9d174d">US East REC</text>
                  <text x="485" y="105" textAnchor="middle" fontSize="8" fill="#c91a68">(Primary Buffer)</text>

                  <rect x="425" y="135" width="120" height="40" rx="4" fill="#fdf2f8" stroke="#fbcfe8" />
                  <text x="485" y="153" textAnchor="middle" fontSize="9" fontWeight="600" fill="#9d174d">Europe REC</text>
                  <text x="485" y="165" textAnchor="middle" fontSize="8" fill="#c91a68">(Primary Buffer)</text>

                  {/* Origin */}
                  <rect x="600" y="30" width="140" height="170" rx="8" fill="#f8fafc" stroke="#94a3b8" />
                  <text x="670" y="46" textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">🗄️ Origins (US-East-1)</text>

                  <rect x="610" y="70" width="120" height="45" rx="6" fill="#ecfdf5" stroke="#a7f3d0" />
                  <text x="670" y="90" textAnchor="middle" fontSize="9" fontWeight="600" fill="#047857">🪣 Amazon S3</text>
                  <text x="670" y="105" textAnchor="middle" fontSize="8" fill="#065f46">OAC Secure Static</text>

                  <rect x="610" y="130" width="120" height="45" rx="6" fill="#eff6ff" stroke="#bfdbfe" />
                  <text x="670" y="150" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1d4ed8">⚙️ ALB / Custom EC2</text>
                  <text x="670" y="165" textAnchor="middle" fontSize="8" fill="#1e40af">Dynamic API / Apps</text>

                  {/* Connectors */}
                  {/* Clients to Edges via DNS Anycast */}
                  <path d="M 155 80 L 225 80" fill="none" stroke="#6366f1" strokeWidth="1.2" markerEnd="url(#acn-cf)" />
                  <path d="M 155 125 L 225 125" fill="none" stroke="#6366f1" strokeWidth="1.2" markerEnd="url(#acn-cf)" />
                  <path d="M 155 170 L 225 170" fill="none" stroke="#6366f1" strokeWidth="1.2" markerEnd="url(#acn-cf)" />
                  <text x="190" y="72" textAnchor="middle" fontSize="7" fill="#4f46e5" fontWeight="600">Anycast DNS</text>

                  {/* New York & Tokyo Edges to US REC */}
                  <path d="M 355 80 L 425 90" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#acn-cf)" />
                  <path d="M 355 170 L 425 105" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#acn-cf)" />
                  
                  {/* Frankfurt Edge to EU REC */}
                  <path d="M 355 125 L 425 150" fill="none" stroke="#6366f1" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#acn-cf)" />

                  {/* US REC to S3 and ALB */}
                  <path d="M 545 95 L 610 90" fill="none" stroke="#16a34a" strokeWidth="1.2" markerEnd="url(#acn-green-cf)" />
                  <path d="M 545 100 L 610 145" fill="none" stroke="#16a34a" strokeWidth="1.2" markerEnd="url(#acn-green-cf)" />

                  {/* EU REC to S3 and ALB */}
                  <path d="M 545 155 L 610 100" fill="none" stroke="#16a34a" strokeWidth="1.2" markerEnd="url(#acn-green-cf)" />
                  <path d="M 545 160 L 610 155" fill="none" stroke="#16a34a" strokeWidth="1.2" markerEnd="url(#acn-green-cf)" />
                  
                  <text x="578" y="112" textAnchor="middle" fontSize="7" fill="#15803d" fontWeight="600">Backbone fiber</text>
                </svg>
              </div>

              {/* Core Features list */}
              <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#4f46e5' }}>Operational Stages of a Request:</div>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '12px', lineHeight: '1.6' }}>
                  <li><strong>Client Handshake:</strong> Client browser sends a DNS request for <code>cdn.example.com</code>. DNS Anycast routes to the closest physical Edge POP. A secure TLS session terminates at the edge immediately.</li>
                  <li><strong>Edge Cache Lookup:</strong> The Edge Location checks its local RAM/SSD storage. If the asset matches the cache key (and TTL has not expired), it returns a <code>HIT</code> in microseconds.</li>
                  <li><strong>Regional Edge Cache Backup:</strong> On an edge miss, the request goes over the private network to a Regional Edge Cache. If found here, the REC streams the resource back, caching a copy at the local Edge.</li>
                  <li><strong>Origin Fetch (Source of Truth):</strong> If both miss, the REC consolidates the request and queries the target S3 or custom ALB server. The returning payload is written to the REC and Edge cache indexes on its way back to the client.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Origins & Integrations */}
        {activeTab === 'origins' && (
          <div>
            <div className="cf-sec">Origin Types, Custom VPC Connections, and S3 CRR Comparisons</div>
            <div className="cf-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                CloudFront integrates with S3 buckets for static contents, and with dynamic application backends (like ALB, EC2, or custom servers) inside or outside AWS networks. Understanding secure access structures is essential for shielding your backends.
              </div>

              <div className="cf-grid2" style={{ gap: '14px', marginBottom: '14px' }}>
                {/* Origins Breakdown */}
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#16a34a' }}>Origin Integrations &amp; Security</div>
                  
                  <div className="cf-row">
                    <div className="cf-dot">A</div>
                    <div>
                      AWS offers <span className="cf-hl-green">S3 Bucket Origin + OAC</span> <span className="cf-desc-mute">(Origin Access Control which signs request blocks with custom AWS SigV4 signatures)</span> to secure static assets. Which means the S3 bucket is completely private, rejecting all public internet traffic and only authorizing requests carrying a valid signature validated by the CloudFront service.
                    </div>
                  </div>

                  <div className="cf-row">
                    <div className="cf-dot">B</div>
                    <div>
                      AWS offers <span className="cf-hl-green">Dynamic ALB/EC2 Origins</span> <span className="cf-desc-mute">(attaching public Application Load Balancers or virtual compute instances as backend sources)</span> to accelerate APIs. Which means CloudFront operates as an SSL-terminating reverse proxy, maintaining keep-alive TCP connections over private backbones to boost processing speed.
                    </div>
                  </div>
                </div>

                {/* VPC Origin vs Public Network */}
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#c2410c' }}>VPC Private Origin vs Public Network Custom Origin</div>
                  <div style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    How does CloudFront fetch content from an ALB or EC2 database API instance? You have two architectural choices:
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                    <div style={{ background: '#ffffff', border: '0.5px solid #cbd5e1', borderRadius: '6px', padding: '8px' }}>
                      <strong style={{ color: '#2563eb' }}>Option 1: CloudFront VPC Origin (Private Network Integration)</strong>
                      <div style={{ marginTop: '4px', color: '#475569' }}>
                        Allows CloudFront to connect directly to private ALBs or EC2 instances inside your VPC subnets. Uses managed VPC endpoint interfaces under the hood. The ALB has no public IP address and cannot be accessed from the public internet.
                      </div>
                    </div>
                    <div style={{ background: '#ffffff', border: '0.5px solid #cbd5e1', borderRadius: '6px', padding: '8px' }}>
                      <strong style={{ color: '#d97706' }}>Option 2: Custom Origin via Public Network + Ingress Restricting</strong>
                      <div style={{ marginTop: '4px', color: '#475569' }}>
                        The ALB is placed in public subnets with a public DNS. To block public users from bypassing the CDN, you configure custom headers (e.g., <code>X-Origin-Verify: shared-secret</code>) inside CloudFront, and program the ALB to reject any traffic missing this header!
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side-by-side: CloudFront vs S3 Cross-Region Replication (CRR) */}
              <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginTop: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#4f46e5' }}>
                  Architectural Comparison: CloudFront Caching vs. S3 Cross-Region Replication (CRR)
                </div>
                
                <div style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                  Both services solve geographic latency, but their mechanisms, pricing models, and target use cases are completely opposite. Use this guide to choose:
                </div>

                <table className="cf-table">
                  <thead>
                    <tr>
                      <th>Factor</th>
                      <th>⚡ CloudFront Caching (Edge Delivery)</th>
                      <th>🪣 S3 Cross-Region Replication (CRR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Mechanism</strong></td>
                      <td>Pull-based caching on-demand. Content populated at edge nodes when first requested by global users.</td>
                      <td>Push-based replication. S3 automatically replicates upload payloads asynchronously from source to target buckets.</td>
                    </tr>
                    <tr>
                      <td><strong>Target Operations</strong></td>
                      <td>Highly optimized for high-volume <strong>READ</strong> traffic (caches HTML, assets, queries).</td>
                      <td>Optimized for <strong>Disaster Recovery, Compliance,</strong> and low-latency local <strong>WRITEs</strong>.</td>
                    </tr>
                    <tr>
                      <td><strong>Write Location</strong></td>
                      <td>All writes traverse directly back to the single primary origin (Write-through bypass).</td>
                      <td>Clients can write locally to the nearest regional bucket; data is replicated back.</td>
                    </tr>
                    <tr>
                      <td><strong>Cost Structure</strong></td>
                      <td>Cheaper egress bandwidth charges. You only pay for cache storage and network transfers.</td>
                      <td>Double storage charges (paying for complete duplicate objects in multiple countries) + CRR replication fees.</td>
                    </tr>
                    <tr>
                      <td><strong>Consistency</strong></td>
                      <td>Eventual consistency. Cache invalidation requests are required to purge stale items before TTL expires.</td>
                      <td>Asynchronous backup sync (replication lag is usually minutes or seconds depending on object size).</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* Tab 3: AWS Global Accelerator (AGA) */}
        {activeTab === 'aga' && (
          <div>
            <div className="cf-sec">AWS Global Accelerator — Static Anycast &amp; Network Backbone Optimization</div>
            <div className="cf-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                AWS Global Accelerator is a networking service that improves the availability and performance of your applications with local or global users. It operates at Layer 4 of the OSI model, directing dynamic TCP/UDP traffic over the highly optimized private AWS global network backbone.
              </div>

              {/* Concepts Deep-Dive matching .cf-hl-cyan & .cf-desc-mute */}
              <div className="cf-grid2" style={{ marginBottom: '16px' }}>
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#c2410c' }}>Core Architecture Concepts</div>

                  <div className="cf-row">
                    <div className="cf-dot">1</div>
                    <div>
                      AWS offers <span className="cf-hl-orange">Anycast Static IP Addresses</span> <span className="cf-desc-mute">(two globally unique static IPv4 addresses allocated to your accelerator that route traffic directly to the nearest AWS Edge location over BGP)</span> as a single entry point. Which means client applications connect directly to fixed IPs, eliminating DNS lookup overheads and DNS TTL caching issues.
                    </div>
                  </div>

                  <div className="cf-row">
                    <div className="cf-dot">2</div>
                    <div>
                      AWS offers <span className="cf-hl-orange">AWS Global Network Backbone</span> <span className="cf-desc-mute">(the private, high-speed, congestion-free global fiber optic transport network owned and managed exclusively by AWS)</span> to transport dynamic traffic. Which means packets are ingested at the nearest Edge location and travel over private transit routes, bypassing public internet congestion and reducing network jitter.
                    </div>
                  </div>
                </div>

                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#15803d' }}>Traffic Control &amp; HA Concepts</div>

                  <div className="cf-row">
                    <div className="cf-dot">3</div>
                    <div>
                      AWS offers <span className="cf-hl-green">Application Endpoint Groups</span> <span className="cf-desc-mute">(regional collections of Application Load Balancers, Network Load Balancers, or EC2 instances monitored by active health probes)</span> inside multiple AWS countries. Which means traffic is dynamically steered based on proximity, custom weight dials, and health scores.
                    </div>
                  </div>

                  <div className="cf-row">
                    <div className="cf-dot">4</div>
                    <div>
                      AWS offers <span className="cf-hl-green">Sub-10s Dynamic Failover</span> <span className="cf-desc-mute">(instant automatic traffic routing shifts that steer clients away from unhealthy AWS regional datacenters to standby healthy ones)</span> for disaster recovery. Which means client connections failover dynamically in seconds, completely avoiding the hours of delay associated with waiting for global client DNS caches to expire.
                    </div>
                  </div>
                </div>
              </div>

              {/* Global Accelerator Routing Pipeline SVG */}
              <div style={{ border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', background: '#ffffff', marginBottom: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  AWS Global Accelerator Architecture (Anycast Static IP Routing)
                </div>

                <svg width="100%" viewBox="0 0 760 220" style={{ background: '#fffbeb', borderRadius: '6px', border: '0.5px solid #fde68a' }}>
                  <defs>
                    <marker id="acn-aga" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#c2410c" /></marker>
                    <marker id="acn-backbone" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#4f46e5" /></marker>
                  </defs>

                  {/* Geographies / Clients */}
                  <rect x="10" y="30" width="160" height="170" rx="8" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="90" y="46" textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">🌍 Global Users</text>

                  <rect x="25" y="65" width="130" height="30" rx="4" fill="#eff6ff" stroke="#93c5fd" />
                  <text x="90" y="83" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e3a8a">US Client ➔ Anycast IP</text>

                  <rect x="25" y="110" width="130" height="30" rx="4" fill="#eff6ff" stroke="#93c5fd" />
                  <text x="90" y="128" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e3a8a">EU Client ➔ Anycast IP</text>

                  <rect x="25" y="155" width="130" height="30" rx="4" fill="#eff6ff" stroke="#93c5fd" />
                  <text x="90" y="173" textAnchor="middle" fontSize="9" fontWeight="600" fill="#1e3a8a">Asia Client ➔ Anycast IP</text>

                  {/* Anycast Static IPs Edge Ingestion */}
                  <rect x="200" y="30" width="160" height="170" rx="8" fill="#ffffff" stroke="#cbd5e1" />
                  <text x="280" y="46" textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">⚡ BGP Anycast POPs</text>

                  {/* Static IP Blocks */}
                  <rect x="215" y="60" width="130" height="50" rx="6" fill="#fff7ed" stroke="#ffedd5" />
                  <text x="280" y="78" textAnchor="middle" fontSize="9" fontWeight="700" fill="#c2410c">Static IP #1</text>
                  <text x="280" y="93" textAnchor="middle" fontSize="9" fontWeight="600" fill="#ea580c">1.2.3.4 (Anycast)</text>

                  <rect x="215" y="130" width="130" height="50" rx="6" fill="#fff7ed" stroke="#ffedd5" />
                  <text x="280" y="148" textAnchor="middle" fontSize="9" fontWeight="700" fill="#c2410c">Static IP #2</text>
                  <text x="280" y="163" textAnchor="middle" fontSize="9" fontWeight="600" fill="#ea580c">5.6.7.8 (Anycast)</text>

                  {/* Private AWS Backbone */}
                  <rect x="390" y="30" width="150" height="170" rx="8" fill="#f5f3ff" stroke="#ddd6fe" />
                  <text x="465" y="46" textAnchor="middle" fontSize="9" fontWeight="700" fill="#4f46e5">⚡ AWS Private Fiber</text>
                  <path d="M 465 65 L 465 185" fill="none" stroke="#818cf8" strokeWidth="4" />
                  <text x="475" y="125" textAnchor="start" fontSize="8" fill="#4f46e5" fontWeight="600">Congestion-Free Transit</text>

                  {/* Target Endpoint Groups */}
                  <rect x="570" y="30" width="180" height="170" rx="8" fill="#f8fafc" stroke="#94a3b8" />
                  <text x="660" y="46" textAnchor="middle" fontSize="10" fontWeight="600" fill="#475569">🗄️ Application Endpoints</text>

                  <rect x="585" y="60" width="150" height="50" rx="6" fill="#ecfdf5" stroke="#a7f3d0" />
                  <text x="660" y="80" textAnchor="middle" fontSize="9" fontWeight="700" fill="#047857">us-east-1 Endpoint</text>
                  <text x="660" y="95" textAnchor="middle" fontSize="8" fill="#059669">ALB (Healthy 🟢 Dial 100%)</text>

                  <rect x="585" y="130" width="150" height="50" rx="6" fill="#fef2f2" stroke="#fecaca" />
                  <text x="660" y="150" textAnchor="middle" fontSize="9" fontWeight="700" fill="#b91c1c">eu-central-1 Endpoint</text>
                  <text x="660" y="165" textAnchor="middle" fontSize="8" fill="#dc2626">ALB (Degraded ❌ Failover Active)</text>

                  {/* Connector lines */}
                  {/* Users to POPs */}
                  <path d="M 155 80 L 200 85" fill="none" stroke="#c2410c" strokeWidth="1.2" markerEnd="url(#acn-aga)" />
                  <path d="M 155 125 L 200 100" fill="none" stroke="#c2410c" strokeWidth="1.2" markerEnd="url(#acn-aga)" />
                  <path d="M 155 170 L 200 155" fill="none" stroke="#c2410c" strokeWidth="1.2" markerEnd="url(#acn-aga)" />

                  {/* POPs to Backbone */}
                  <path d="M 335 85 L 390 100" fill="none" stroke="#4f46e5" strokeWidth="1.5" markerEnd="url(#acn-backbone)" />
                  <path d="M 335 155 L 390 120" fill="none" stroke="#4f46e5" strokeWidth="1.5" markerEnd="url(#acn-backbone)" />

                  {/* Backbone to endpoints */}
                  {/* Normal flow to healthy US endpoint */}
                  <path d="M 540 100 L 585 85" fill="none" stroke="#16a34a" strokeWidth="1.5" markerEnd="url(#acn-backbone)" />
                  {/* Failed flow redirected away from unhealthy EU endpoint */}
                  <path d="M 540 140 L 585 95" fill="none" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3,2" markerEnd="url(#acn-backbone)" />
                  <text x="562" y="132" textAnchor="middle" fontSize="7" fill="#ef4444" fontWeight="700">Sub-10s Shift</text>

                </svg>
              </div>

              {/* AWS Global Accelerator vs. Amazon CloudFront Comparison */}
              <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginTop: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#4f46e5' }}>
                  Architectural Matrix: AWS Global Accelerator vs. Amazon CloudFront
                </div>

                <div style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                  While both services ingest traffic at the closest geographic edge location and route it over the private AWS backbone, their fundamental operations and goals are vastly different.
                </div>

                <table className="cf-table">
                  <thead>
                    <tr>
                      <th>Architectural Dimension</th>
                      <th>🚀 AWS Global Accelerator (AGA)</th>
                      <th>⚡ Amazon CloudFront (CDN)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>Primary Goal</strong></td>
                      <td>Optimize the <strong>network transit path</strong> for dynamic, stateful dynamic TCP/UDP applications.</td>
                      <td>Deliver and <strong>cache HTTP/HTTPS contents</strong> at edge locations to offload origin servers.</td>
                    </tr>
                    <tr>
                      <td><strong>Caching Layer</strong></td>
                      <td>❌ <strong>No Caching.</strong> Acts purely as a reverse network proxy, streaming packet flows instantly over the fiber backplane.</td>
                      <td>✅ <strong>High Performance Cache.</strong> Stores HTML, assets, queries, and media streams at 600+ POP locations.</td>
                    </tr>
                    <tr>
                      <td><strong>IP Configuration</strong></td>
                      <td>Provides <strong>2 Static Anycast IPs</strong> that act as fixed DNS records for your client devices.</td>
                      <td>Uses <strong>Dynamic IP Addresses</strong> (DNS queries return varying IP addresses of active edge locations).</td>
                    </tr>
                    <tr>
                      <td><strong>OSI Layer &amp; Protocols</strong></td>
                      <td>Operates at **Layer 4 (Transport)**. Supports all <strong>TCP and UDP</strong> traffic natively.</td>
                      <td>Operates at **Layer 7 (Application)**. Supports only <strong>HTTP, HTTPS, and WebSockets</strong>.</td>
                    </tr>
                    <tr>
                      <td><strong>Target Endpoints</strong></td>
                      <td>Supports AWS resources exclusively: ALB, NLB, EC2, and Elastic IPs.</td>
                      <td>Supports S3 buckets, ALB, EC2, API Gateway, and custom on-premise servers.</td>
                    </tr>
                    <tr>
                      <td><strong>Failover Mechanics</strong></td>
                      <td><strong>Sub-10s failover</strong>. Health checks automatically shift traffic to healthy regions without client DNS updates.</td>
                      <td>Bypasses origins on error using custom error pages, or triggers origin failover groups (takes minutes due to DNS TTL).</td>
                    </tr>
                    <tr>
                      <td><strong>Ideal Use Cases</strong></td>
                      <td>VoIP, online multiplayer gaming, IoT MQTT ingestion, financial transaction APIs, dynamic database connections.</td>
                      <td>Static frontends, web assets, video streaming, REST/GraphQL APIs, image hosting, and website delivery.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        )}

        {/* Tab 4: Security, Geo & Invalidations */}
        {activeTab === 'security' && (
          <div>
            <div className="cf-sec">Origin Access Control (OAC), Geo-Restrictions, and Cache Invalidations</div>
            <div className="cf-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                Secure content distribution relies on strict network boundaries and manual cache invalidation overrides. Here is how you protect your assets and maintain control over your global storage caches.
              </div>

              <div className="cf-grid3" style={{ marginBottom: '14px' }}>
                {/* OAC */}
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#16a34a' }}>Origin Access Control (OAC)</div>
                  <div style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--color-text-secondary)' }}>
                    OAC is the modern AWS security standard that replaces the legacy Origin Access Identity (OAI) system.
                  </div>
                  <ul style={{ paddingLeft: '14px', margin: '8px 0 0 0', fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                    <li>Supports **AWS Signature Version 4 (SigV4)** signing, allowing S3 to process authentication locks seamlessly.</li>
                    <li>Allows integration with buckets encrypted using custom **KMS CMKs (Customer Managed Keys)**.</li>
                    <li>Secures upload (PUT) and download (GET) pipelines, shielding static databases from web exposure.</li>
                  </ul>
                </div>

                {/* Geo Restriction */}
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#c2410c' }}>Geo-Restriction (Geoblocking)</div>
                  <div style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--color-text-secondary)' }}>
                    Apply geographic filters directly at global edge locations before requests consume any backend bandwidth.
                  </div>
                  <ul style={{ paddingLeft: '14px', margin: '8px 0 0 0', fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                    <li><strong>Allow List:</strong> Whitelist only specific countries allowed to load sensitive web portals.</li>
                    <li><strong>Block List:</strong> Blacklist countries based on licensing laws, export restrictions, or high-risk areas.</li>
                    <li>Edge returns a high-speed `403 Forbidden` response without ever calling your origin server.</li>
                  </ul>
                </div>

                {/* Cache Invalidations */}
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#6b21a8' }}>Cache Invalidation Pipelines</div>
                  <div style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--color-text-secondary)' }}>
                    What happens if a developer deploys an updated website, but the CDN continues serving cached old files?
                  </div>
                  <ul style={{ paddingLeft: '14px', margin: '8px 0 0 0', fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                    <li>Submit an <strong>Invalidation Request</strong> containing file paths (e.g. <code>/static/bundle.js</code>) or wildcards (<code>/*</code>).</li>
                    <li>This propagates a delete signal globally across all 600+ edge POPs in seconds.</li>
                    <li>The next user request is guaranteed a `cache miss`, forcing a fresh fetch from the origin.</li>
                  </ul>
                </div>
              </div>

              {/* Visualizing Invalidation and Geo block in Simulator Info */}
              <div style={{ background: '#eff6ff', border: '0.5px solid #bfdbfe', borderRadius: '8px', padding: '12px', fontSize: '12px', lineHeight: '1.5' }}>
                <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: '4px' }}>💡 Interactive Testing Tip:</div>
                You can test both **Geo-Restrictions** and **Cache Invalidations** in real-time inside the **Live Global Request Simulator** tab!
                Toggle country blockades to see requests instantly rejected at the edge, or trigger an invalidation path to wipe cache states and witness a live cache miss animation.
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Simulator */}
        {activeTab === 'sim' && (
          <div>
            <div className="cf-sec">Live Interactive Global Request Routing Simulator</div>
            
            {/* Quick Cache Control bar */}
            <div className="cf-card" style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', background: '#fdfaee', borderColor: '#fde68a' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '12px', color: '#854d0e' }}>⚡ CDN Cache State Controller:</span>
                <span style={{ fontSize: '11px', color: '#a16207', marginLeft: '6px' }}>
                  US Edge: <b>{edgeCacheState['us-static'] === 'warm' ? 'WARM 🟢' : 'EMPTY ⚪'}</b> | 
                  EU Edge: <b>{edgeCacheState['eu-static'] === 'warm' ? 'WARM 🟢' : 'EMPTY ⚪'}</b> | 
                  Asia Edge: <b>{edgeCacheState['asia-static'] === 'warm' ? 'WARM 🟢' : 'EMPTY ⚪'}</b>
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  value={invalidationPath} 
                  onChange={(e) => setInvalidationPath(e.target.value)} 
                  style={{ width: '120px', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', border: '0.5px solid #d97706' }} 
                  placeholder="/*"
                />
                <button className="cf-btn cf-primary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={handleInvalidate}>
                  🧹 Purge Cache (Invalidate)
                </button>
              </div>
            </div>

            <div className="cf-grid2">
              {/* Controls Column */}
              <div>
                <div className="cf-sec">Configure Request Path Parameters</div>
                <div className="cf-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  {/* Client location */}
                  <div className="cf-ctrl">
                    <label>1. Client Location (User Geography)</label>
                    <select value={clientRegion} onChange={(e) => setClientRegion(e.target.value as ClientRegion)}>
                      <option value="us">US East Client (New York, US)</option>
                      <option value="eu">Europe Client (Frankfurt, Germany)</option>
                      <option value="asia">Asia Client (Tokyo, Japan)</option>
                    </select>
                  </div>

                  {/* Target HTTP Method / Content Type */}
                  <div className="cf-ctrl">
                    <label>2. Request Type &amp; Method</label>
                    <select value={httpMethod} onChange={(e) => setHttpMethod(e.target.value as HttpMethod)}>
                      <option value="GET_STATIC">GET /index.html (Static Content - Cacheable)</option>
                      <option value="GET_DYNAMIC">GET /api/users?id=99 (Dynamic query - Cache bypass)</option>
                      <option value="POST">POST /api/feedback (Form write - Bypasses cache)</option>
                    </select>
                  </div>

                  {/* Origin Type */}
                  <div className="cf-ctrl">
                    <label>3. Origin Server Configuration</label>
                    <select value={originType} onChange={(e) => setOriginType(e.target.value as OriginType)}>
                      <option value="s3">Amazon S3 Bucket (Private static + OAC)</option>
                      <option value="alb_public">Custom Origin: Public Application Load Balancer</option>
                      <option value="alb_vpc">Custom Origin: Private ALB inside VPC boundaries</option>
                    </select>
                  </div>

                  {/* Geo restrictions */}
                  <div className="cf-ctrl">
                    <label>4. Geographic Restrictions (Edge Firewall)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                      <input 
                        type="checkbox" 
                        id="cf-geo-check" 
                        checked={geoRestricted} 
                        onChange={(e) => setGeoRestricted(e.target.checked)} 
                      />
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>Enable Geo-Restriction</span>
                    </div>
                    {geoRestricted && (
                      <div style={{ marginTop: '8px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Block all requests coming from:</span>
                        <select 
                          style={{ marginTop: '4px' }} 
                          value={blockedRegion} 
                          onChange={(e) => setBlockedRegion(e.target.value as ClientRegion)}
                        >
                          <option value="us">United States (US)</option>
                          <option value="eu">European Union (EU)</option>
                          <option value="asia">Japan / Asia (ASIA)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Origin Shield */}
                  <div className="cf-ctrl">
                    <label>5. Performance Optimizations</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                      <input 
                        type="checkbox" 
                        id="cf-shield-check" 
                        checked={useOriginShield} 
                        onChange={(e) => setUseOriginShield(e.target.checked)} 
                      />
                      <span style={{ fontSize: '11px', fontWeight: 600 }}>Enable Origin Shield (REC caching buffer)</span>
                    </div>
                  </div>

                  <div className="cf-btnbar">
                    <button 
                      className="cf-btn cf-primary" 
                      style={{ flex: 1, padding: '10px', fontWeight: 600 }}
                      onClick={handleSimulate}
                      disabled={isSimulating}
                    >
                      {isSimulating ? '⌛ Tracing Packet...' : '🚀 Execute Request Simulation'}
                    </button>
                    <button 
                      className="cf-btn" 
                      style={{ padding: '10px' }}
                      onClick={() => {
                        setEdgeCacheState({
                          'us-static': 'warm',
                          'eu-static': 'empty',
                          'asia-static': 'empty',
                          'us-dynamic': 'empty',
                          'eu-dynamic': 'empty',
                          'asia-dynamic': 'empty',
                        });
                        setRecCacheState({
                          'us-static': 'warm',
                          'eu-static': 'warm',
                          'asia-static': 'empty',
                        });
                        setSimLogs([{
                          timestamp: new Date().toLocaleTimeString(),
                          type: 'info',
                          message: 'Simulator state reset complete.'
                        }]);
                        setSimResults(null);
                        setSimStep(0);
                      }}
                    >
                      🔄 Reset
                    </button>
                  </div>

                </div>
              </div>

              {/* Simulation Visualiser and console */}
              <div>
                <div className="cf-sec">Live Request Trace SVG Pipeline</div>
                <div className="cf-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  
                  {/* Dynamic SVG tracing paths */}
                  <svg width="100%" height="200" viewBox="0 0 480 200" style={{ background: '#f8fafc', borderRadius: '8px', border: '0.5px solid #cbd5e1' }}>
                    {/* Node US Client */}
                    <circle cx="40" cy="40" r="14" fill={clientRegion === 'us' ? '#6366f1' : '#cbd5e1'} stroke={clientRegion === 'us' ? '#4f46e5' : '#94a3b8'} strokeWidth="1.5" />
                    <text x="40" y="40" textAnchor="middle" dominantBaseline="central" fontSize="8" fill={clientRegion === 'us' ? '#fff' : '#475569'} fontWeight="700">US</text>
                    <text x="40" y="60" textAnchor="middle" fontSize="8" fill="#475569">Client US</text>

                    {/* Node EU Client */}
                    <circle cx="40" cy="100" r="14" fill={clientRegion === 'eu' ? '#6366f1' : '#cbd5e1'} stroke={clientRegion === 'eu' ? '#4f46e5' : '#94a3b8'} strokeWidth="1.5" />
                    <text x="40" y="100" textAnchor="middle" dominantBaseline="central" fontSize="8" fill={clientRegion === 'eu' ? '#fff' : '#475569'} fontWeight="700">EU</text>
                    <text x="40" y="120" textAnchor="middle" fontSize="8" fill="#475569">Client EU</text>

                    {/* Node Asia Client */}
                    <circle cx="40" cy="160" r="14" fill={clientRegion === 'asia' ? '#6366f1' : '#cbd5e1'} stroke={clientRegion === 'asia' ? '#4f46e5' : '#94a3b8'} strokeWidth="1.5" />
                    <text x="40" y="160" textAnchor="middle" dominantBaseline="central" fontSize="8" fill={clientRegion === 'asia' ? '#fff' : '#475569'} fontWeight="700">AS</text>
                    <text x="40" y="180" textAnchor="middle" fontSize="8" fill="#475569">Client Asia</text>

                    {/* Anycast DNS Gateway */}
                    <rect x="120" y="75" width="45" height="50" rx="4" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
                    <text x="142" y="94" textAnchor="middle" fontSize="8" fontWeight="700" fill="#475569">Anycast</text>
                    <text x="142" y="108" textAnchor="middle" fontSize="8" fontWeight="700" fill="#475569">DNS</text>

                    {/* Edge Server Location */}
                    <rect x="210" y="70" width="55" height="60" rx="6" fill={simStep >= 3 ? '#e0e7ff' : '#ffffff'} stroke={simStep >= 3 ? '#6366f1' : '#cbd5e1'} strokeWidth="1.5" />
                    <text x="237" y="90" textAnchor="middle" fontSize="9" fontWeight="700" fill={simStep >= 3 ? '#4338ca' : '#475569'}>Edge PoP</text>
                    <text x="237" y="105" textAnchor="middle" fontSize="7" fill={simStep >= 3 ? '#4338ca' : '#64748b'}>
                      {simStep >= 7 && simResults?.cacheHeader.includes('Hit') ? '⭐ HIT' : simStep >= 3 ? 'Checking...' : 'Idle'}
                    </text>

                    {/* Regional Edge Cache (REC) */}
                    <rect x="300" y="70" width="55" height="60" rx="6" fill={simStep >= 3.5 ? '#fdf2f8' : '#ffffff'} stroke={simStep >= 3.5 ? '#db2777' : '#cbd5e1'} strokeWidth="1" strokeDasharray={useOriginShield ? '' : '3,3'} />
                    <text x="327" y="90" textAnchor="middle" fontSize="9" fontWeight="700" fill={simStep >= 3.5 ? '#be185d' : '#475569'}>REC Cache</text>
                    <text x="327" y="105" textAnchor="middle" fontSize="7" fill={simStep >= 3.5 ? '#be185d' : '#64748b'}>
                      {simStep >= 7 && simResults?.cacheHeader.includes('REC') ? '⭐ HIT' : simStep >= 3.5 ? 'Checking...' : 'Idle'}
                    </text>

                    {/* Origin server */}
                    <rect x="390" y="70" width="60" height="60" rx="6" fill={simStep >= 4 ? '#ecfdf5' : '#ffffff'} stroke={simStep >= 4 ? '#10b981' : '#cbd5e1'} strokeWidth="1.5" />
                    <text x="420" y="90" textAnchor="middle" fontSize="9" fontWeight="700" fill={simStep >= 4 ? '#047857' : '#475569'}>Origin</text>
                    <text x="420" y="105" textAnchor="middle" fontSize="7" fill={simStep >= 4 ? '#047857' : '#64748b'}>{originType === 's3' ? 'S3 Bucket' : 'App ALB'}</text>

                    {/* Connector Paths */}
                    {/* US to DNS */}
                    <path d="M 54 40 L 120 90" fill="none" stroke={clientRegion === 'us' && simStep >= 1 ? '#6366f1' : '#e2e8f0'} strokeWidth={clientRegion === 'us' ? '1.5' : '1'} />
                    {/* EU to DNS */}
                    <path d="M 54 100 L 120 100" fill="none" stroke={clientRegion === 'eu' && simStep >= 1 ? '#6366f1' : '#e2e8f0'} strokeWidth={clientRegion === 'eu' ? '1.5' : '1'} />
                    {/* ASIA to DNS */}
                    <path d="M 54 160 L 120 110" fill="none" stroke={clientRegion === 'asia' && simStep >= 1 ? '#6366f1' : '#e2e8f0'} strokeWidth={clientRegion === 'asia' ? '1.5' : '1'} />

                    {/* DNS to Edge */}
                    <path d="M 165 100 L 210 100" fill="none" stroke={simStep >= 2 ? (simStep === 5 ? '#ef4444' : '#6366f1') : '#e2e8f0'} strokeWidth="1.5" />

                    {/* Edge to REC */}
                    <path d="M 265 100 L 300 100" fill="none" stroke={simStep >= 3.5 ? '#db2777' : '#e2e8f0'} strokeWidth="1.5" />

                    {/* REC to Origin */}
                    <path d="M 355 100 L 390 100" fill="none" stroke={simStep >= 4 ? '#10b981' : '#e2e8f0'} strokeWidth="1.5" />

                    {/* Packet Animation Dot */}
                    {isSimulating && (
                      <circle r="4.5" fill="#f59e0b">
                        <animateMotion 
                          dur="1.8s" 
                          repeatCount="indefinite" 
                          path={
                            simStep === 1 ? (clientRegion === 'us' ? 'M 40 40 L 120 75' : clientRegion === 'eu' ? 'M 40 100 L 120 100' : 'M 40 160 L 120 125') :
                            simStep === 2 ? 'M 120 100 L 210 100' :
                            simStep === 3 ? 'M 210 100 L 237 100' :
                            simStep === 3.5 ? 'M 237 100 L 327 100' :
                            simStep === 4 ? 'M 327 100 L 420 100' : 'M 210 100 L 237 100'
                          } 
                        />
                      </circle>
                    )}
                  </svg>

                  {/* Latency meter indicator */}
                  {simResults && (
                    <div style={{ width: '100%', marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                        <span>Trace Latency Gauge:</span>
                        <span style={{ color: simResults.latency <= 15 ? '#16a34a' : simResults.latency <= 50 ? '#4f46e5' : '#c2410c' }}>
                          {simResults.latency} ms ({simResults.latency <= 15 ? 'Ultra Fast' : simResults.latency <= 50 ? 'Optimized' : 'Origin Transit'})
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${Math.min((simResults.latency / 250) * 100, 100)}%`, 
                            background: simResults.latency <= 15 ? '#16a34a' : simResults.latency <= 50 ? '#6366f1' : '#c2410c',
                            transition: 'width 0.4s ease-out'
                          }} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Simulator Results Box */}
                  {simResults && (
                    <div style={{ width: '100%', marginTop: '10px', border: '0.5px solid #cbd5e1', borderRadius: '6px', padding: '10px', background: '#f8fafc' }}>
                      <div style={{ fontWeight: 600, fontSize: '11px', color: '#4f46e5', textTransform: 'uppercase', marginBottom: '6px' }}>
                        CDN Header Analysis Console
                      </div>
                      <div className="cf-grid2" style={{ gap: '6px', fontFamily: 'monospace', fontSize: '10px' }}>
                        <div>HTTP Status: <b style={{ color: simResults.status >= 400 ? '#ef4444' : '#16a34a' }}>{simResults.status}</b></div>
                        <div>X-Cache: <b>{simResults.cacheHeader}</b></div>
                        <div>Server: <b>{originType === 's3' ? 'AmazonS3' : 'ALB/2.0'}</b></div>
                        <div>Protocol: <b>HTTP/2 + TLS 1.3</b></div>
                        <div style={{ gridColumn: 'span 2' }}>
                          Routing Path: {simResults.pathTaken.map((node, i) => (
                            <span key={i}>
                              <span className="cf-badge cf-binfo" style={{ fontSize: '8px', padding: '1px 5px' }}>{node.toUpperCase()}</span>
                              {i < simResults.pathTaken.length - 1 && ' ➔ '}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Logging terminal */}
            <div className="cf-sec">Live Pipeline Trace Logging System</div>
            <div className="cf-log">
              {simLogs.map((log, idx) => (
                <div key={idx} className="cf-log-entry">
                  <span style={{ color: '#94a3b8', marginRight: '6px' }}>[{log.timestamp}]</span>
                  <span style={{ 
                    color: log.type === 'success' ? '#4ade80' : 
                           log.type === 'warning' ? '#fbbf24' : 
                           log.type === 'error' ? '#f87171' : '#60a5fa',
                    fontWeight: log.type !== 'info' ? 700 : 'normal'
                  }}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* Tab 5: Pricing */}
        {activeTab === 'pricing' && (
          <div>
            <div className="cf-sec">Price Classes &amp; Advanced Cache Shield Caching</div>
            <div className="cf-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                CDN operational costs are proportional to the geographic locations that host your cache clusters. By adjusting price classes, you can optimize your AWS budget while maintaining fast responses for your primary user bases.
              </div>

              <div className="cf-grid2">
                {/* Price Class Selector */}
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#4f46e5' }}>CloudFront Price Classes Selector</div>
                  
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    <button 
                      className={`cf-tb ${activePriceClass === '100' ? 'cf-on' : ''}`} 
                      onClick={() => setActivePriceClass('100')}
                      style={{ flex: 1 }}
                    >
                      Price Class 100
                    </button>
                    <button 
                      className={`cf-tb ${activePriceClass === '200' ? 'cf-on' : ''}`} 
                      onClick={() => setActivePriceClass('200')}
                      style={{ flex: 1 }}
                    >
                      Price Class 200
                    </button>
                    <button 
                      className={`cf-tb ${activePriceClass === 'all' ? 'cf-on' : ''}`} 
                      onClick={() => setActivePriceClass('all')}
                      style={{ flex: 1 }}
                    >
                      Price Class All
                    </button>
                  </div>

                  {activePriceClass === '100' && (
                    <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                      <strong style={{ color: '#16a34a' }}>Price Class 100 (Lowest Cost):</strong>
                      <p style={{ margin: '4px 0', color: 'var(--color-text-secondary)' }}>
                        Utilizes only Edge POPs in <strong>North America and Europe</strong>. Users in Asia, South America, and Africa will experience higher latency because they route back to Western datacenters, but you are not billed for expensive regional POP bandwidth.
                      </p>
                      <div className="cf-mono" style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>
                        Ideal for: Startups, local businesses, or internal tooling with Western-centric user clusters.
                      </div>
                    </div>
                  )}

                  {activePriceClass === '200' && (
                    <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                      <strong style={{ color: '#4f46e5' }}>Price Class 200 (Standard Balancing):</strong>
                      <p style={{ margin: '4px 0', color: 'var(--color-text-secondary)' }}>
                        Utilizes Edge POPs in <strong>North America, Europe, East Asia, and South America</strong>. Leaves out only the most expensive remote locations (like parts of Africa and Oceania).
                      </p>
                      <div className="cf-mono" style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>
                        Ideal for: Global web applications, standard e-commerce stores, and high-growth SaaS backends.
                      </div>
                    </div>
                  )}

                  {activePriceClass === 'all' && (
                    <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                      <strong style={{ color: '#db2777' }}>Price Class All (Highest Performance):</strong>
                      <p style={{ margin: '4px 0', color: 'var(--color-text-secondary)' }}>
                        Activates **all global locations** including Oceania, Africa, South East Asia, and South America. Guarantees minimal latency globally, but billing rates reflect regional premium transit rates.
                      </p>
                      <div className="cf-mono" style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}>
                        Ideal for: High-traffic video platforms, real-time gaming APIs, and enterprise-grade corporate portals.
                      </div>
                    </div>
                  )}

                  {/* Active POP Map Visualisation */}
                  <div style={{ border: '0.5px solid #cbd5e1', borderRadius: '6px', background: '#ffffff', padding: '10px', marginTop: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>Active Edge Locations Visual Mapping:</span>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span className="cf-badge cf-bok" style={{ opacity: 1 }}>US East (Active)</span>
                      <span className="cf-badge cf-bok" style={{ opacity: 1 }}>EU West (Active)</span>
                      <span className="cf-badge" style={{ background: activePriceClass !== '100' ? '#dcfce7' : '#f1f5f9', color: activePriceClass !== '100' ? '#15803d' : '#94a3b8' }}>
                        East Asia ({activePriceClass !== '100' ? 'Active' : 'Disabled'})
                      </span>
                      <span className="cf-badge" style={{ background: activePriceClass !== '100' ? '#dcfce7' : '#f1f5f9', color: activePriceClass !== '100' ? '#15803d' : '#94a3b8' }}>
                        South America ({activePriceClass !== '100' ? 'Active' : 'Disabled'})
                      </span>
                      <span className="cf-badge" style={{ background: activePriceClass === 'all' ? '#dcfce7' : '#f1f5f9', color: activePriceClass === 'all' ? '#15803d' : '#94a3b8' }}>
                        Australia ({activePriceClass === 'all' ? 'Active' : 'Disabled'})
                      </span>
                      <span className="cf-badge" style={{ background: activePriceClass === 'all' ? '#dcfce7' : '#f1f5f9', color: activePriceClass === 'all' ? '#15803d' : '#94a3b8' }}>
                        South Africa ({activePriceClass === 'all' ? 'Active' : 'Disabled'})
                      </span>
                    </div>
                  </div>

                </div>

                {/* Caching Behaviors & Origin Shield */}
                <div style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: '#c2410c' }}>Cache Shielding (Origin Shield) &amp; TTL Parameters</div>
                  
                  <div className="cf-row">
                    <div className="cf-dot">1</div>
                    <div>
                      AWS offers <span className="cf-hl-orange">Origin Shield</span> <span className="cf-desc-mute">(an extra, centralized high-availability cache layer designated in a specific region to swallow joint edge cache misses)</span> as an origin protector. Which means instead of 200+ distinct edge locations querying S3 or ALB concurrently when a new bundle is published, only the single Origin Shield server queries the origin, sharing results back to all edges.
                    </div>
                  </div>

                  <div className="cf-row">
                    <div className="cf-dot">2</div>
                    <div>
                      AWS offers <span className="cf-hl-orange">Cache Behaviors</span> <span className="cf-desc-mute">(a set of pattern rules e.g., `/images/*` vs `/api/*` mapping query string forwarding, cookie forwarding, and custom headers)</span> to customize responses. Which means you can direct static content to cache for days, while dynamic database APIs are instructed to bypass CDN buffers entirely.
                    </div>
                  </div>

                  <div className="cf-row">
                    <div className="cf-dot">3</div>
                    <div>
                      AWS offers <span className="cf-hl-orange">Time-to-Live (TTL) Settings</span> <span className="cf-desc-mute">(Minimum TTL, Maximum TTL, and Default TTL fields controlling client cache shelf-life)</span> to manage caching lifetimes. Which means if your origin does not supply HTTP headers (like <code>Cache-Control</code> or <code>Expires</code>), CloudFront utilizes default timelines (like 86,400 seconds) to cache the resource.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
