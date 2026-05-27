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

  // --- UPGRADED CLOUDFRONT STATES ---
  // Cache Key & Forwarding Optimizer State
  const [cfQsForwarding, setCfQsForwarding] = useState<'none' | 'whitelist' | 'all'>('none');
  const [cfHeaderForwarding, setCfHeaderForwarding] = useState<'none' | 'whitelist' | 'all'>('none');
  const [cfCookieForwarding, setCfCookieForwarding] = useState<'none' | 'all'>('none');
  const [cfChrRate, setCfChrRate] = useState<number | null>(null);
  const [cfChrTesting, setCfChrTesting] = useState<boolean>(false);
  const [cfCacheHistory, setCfCacheHistory] = useState<string[]>([]);

  // Origin Group Failover State
  const [cfPrimaryOriginStatus, setCfPrimaryOriginStatus] = useState<'healthy' | 'outage'>('healthy');
  const [cfActiveOrigin, setCfActiveOrigin] = useState<'primary' | 'secondary' | null>(null);
  const [cfFailoverLogs, setCfFailoverLogs] = useState<string[]>([
    'Origin Group sandbox ready. Select Primary Status and click "Simulate Request".'
  ]);
  const [cfFailoverStep, setCfFailoverStep] = useState<number>(0);
  const [cfFailoverIsSimulating, setCfFailoverIsSimulating] = useState<boolean>(false);

  // Edge Computing States
  const [cfSelectedTemplate, setCfSelectedTemplate] = useState<'hsts' | 'rewrite' | 'ab'>('hsts');
  const [cfEdgeTesting, setCfEdgeTesting] = useState<boolean>(false);
  const [cfEdgeLogs, setCfEdgeLogs] = useState<string[]>([
    'Edge scripting environment initialized. Select a template and click "Execute Script at Edge".'
  ]);
  const [cfEdgeStep, setCfEdgeStep] = useState<number>(0);
  const [cfEdgeLatency, setCfEdgeLatency] = useState<number | null>(null);

  // Helper dictionary of templates
  const scriptTemplates = {
    hsts: {
      name: 'Add HSTS Security Headers',
      type: 'CloudFront Functions',
      stage: 'Viewer Response',
      language: 'JavaScript',
      latency: 'Sub-1ms execution (highly optimized V8 isolate)',
      description: 'Forces clients to communicate exclusively via secure HTTPS by appending Strict-Transport-Security headers.',
      code: `function handler(event) {
  var response = event.response;
  var headers = response.headers;

  // Set HSTS security header for a duration of 1 year
  headers['strict-transport-security'] = { 
    value: 'max-age=31536000; includeSubDomains; preload' 
  };
  
  // Set anti-clickjacking headers
  headers['x-frame-options'] = { value: 'DENY' };
  headers['x-content-type-options'] = { value: 'nosniff' };

  return response;
}`,
      inputHeaders: `{
  "Host": "cdn.example.com",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "Accept": "text/html,application/xhtml+xml"
}`,
      outputHeaders: `{
  "Host": "cdn.example.com",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
  "Accept": "text/html,application/xhtml+xml",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff"
}`
    },
    rewrite: {
      name: 'URL Rewrite for Clean Paths',
      type: 'CloudFront Functions',
      stage: 'Viewer Request',
      language: 'JavaScript',
      latency: 'Sub-1ms execution (highly optimized V8 isolate)',
      description: 'Rewrites user-friendly clean URLs (e.g. /profile) to internal S3 file structures (e.g. /profile/index.html).',
      code: `function handler(event) {
  var request = event.request;
  var uri = request.uri;

  // If URI does not contain a file extension, append /index.html
  if (!uri.includes('.')) {
    if (uri.endsWith('/')) {
      request.uri = uri + 'index.html';
    } else {
      request.uri = uri + '/index.html';
    }
  }

  return request;
}`,
      inputHeaders: `{
  "Host": "cdn.example.com",
  "URI": "/docs/getting-started",
  "User-Agent": "Mozilla/5.0 Chrome/120.0.0"
}`,
      outputHeaders: `{
  "Host": "cdn.example.com",
  "URI": "/docs/getting-started/index.html",
  "User-Agent": "Mozilla/5.0 Chrome/120.0.0",
  "X-Original-URI": "/docs/getting-started"
}`
    },
    ab: {
      name: 'A/B Testing Origin Routing',
      type: 'Lambda@Edge',
      stage: 'Origin Request',
      language: 'Node.js (Lambda)',
      latency: '30ms execution (includes dynamic cold-start overhead)',
      description: 'Inspects a user cookie to dynamically route them to S3 Bucket A (Control) or S3 Bucket B (Variant) to perform secure A/B testing at the edge.',
      code: `exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  let bucketName = 'my-control-bucket-us-east-1'; // Bucket A
  
  if (headers.cookie) {
    for (let i = 0; i < headers.cookie.length; i++) {
      if (headers.cookie[i].value.includes('experiment_group=variant_b')) {
        bucketName = 'my-variant-bucket-us-east-1'; // Bucket B
        break;
      }
    }
  }

  // Rewrite origin host header dynamically to point to variant S3 bucket
  request.origin.s3.domainName = \`\${bucketName}.s3.amazonaws.com\`;
  request.headers['host'] = [{ key: 'host', value: \`\${bucketName}.s3.amazonaws.com\` }];

  return request;
};`,
      inputHeaders: `{
  "Host": "cdn.example.com",
  "Cookie": "session_id=abc123xyz; experiment_group=variant_b",
  "Origin-Domain": "my-control-bucket-us-east-1.s3.amazonaws.com"
}`,
      outputHeaders: `{
  "Host": "my-variant-bucket-us-east-1.s3.amazonaws.com",
  "Cookie": "session_id=abc123xyz; experiment_group=variant_b",
  "Origin-Domain": "my-variant-bucket-us-east-1.s3.amazonaws.com",
  "X-Routed-By": "LambdaAtEdge-ABTesting"
}`
    }
  };

  const getCompiledCacheKey = () => {
    let query = 'None';
    if (cfQsForwarding === 'whitelist') query = 'v=2.1';
    else if (cfQsForwarding === 'all') query = 'v=2.1&session_id=9a8b7c';

    let header = 'None';
    if (cfHeaderForwarding === 'whitelist') header = 'Accept-Language=en';
    else if (cfHeaderForwarding === 'all') header = 'User-Agent=Mozilla/5.0_Accept-Language=en_Cookie=xyz';

    let cookie = 'None';
    if (cfCookieForwarding === 'all') cookie = 'session_id=8f2a1d';

    return `Domain: cdn.app | Path: /static/style.css | Query: [${query}] | Header: [${header}] | Cookie: [${cookie}]`;
  };

  const handleChrEvaluation = () => {
    if (cfChrTesting) return;
    setCfChrTesting(true);
    setCfChrRate(null);
    setCfCacheHistory([]);

    const currentHistory: string[] = [];
    
    // Simulate Request 1
    setTimeout(() => {
      currentHistory.push('Request 1 (Chrome Desktop): MISS ⚪ (First cold cache lookup)');
      setCfCacheHistory([...currentHistory]);
      
      // Simulate Request 2
      setTimeout(() => {
        let isHit = true;
        let reason = '';
        if (cfHeaderForwarding === 'all') {
          isHit = false;
          reason = 'Firefox User-Agent difference created a unique Cache Key';
        } else if (cfCookieForwarding === 'all') {
          isHit = false;
          reason = 'Firefox session Cookie difference created a unique Cache Key';
        }

        if (isHit) {
          currentHistory.push('Request 2 (Firefox Mobile): HIT 🟢 (Cached asset retrieved in 1ms)');
        } else {
          currentHistory.push(`Request 2 (Firefox Mobile): MISS ⚪ (${reason})`);
        }
        setCfCacheHistory([...currentHistory]);

        // Simulate Request 3
        setTimeout(() => {
          let isHit3 = true;
          let reason3 = '';
          if (cfHeaderForwarding === 'all') {
            isHit3 = false;
            reason3 = 'Safari Tablet User-Agent difference created a unique Cache Key';
          } else if (cfCookieForwarding === 'all') {
            isHit3 = false;
            reason3 = 'Safari session Cookie difference created a unique Cache Key';
          }

          if (isHit3) {
            currentHistory.push('Request 3 (Safari Tablet): HIT 🟢 (Cached asset retrieved in 1ms)');
          } else {
            currentHistory.push(`Request 3 (Safari Tablet): MISS ⚪ (${reason3})`);
          }
          setCfCacheHistory([...currentHistory]);
          
          // Calculate overall hit rate
          let hits = 0;
          if (cfHeaderForwarding !== 'all' && cfCookieForwarding !== 'all') {
            hits = 2; // Req 2 and Req 3 hit
          }
          const finalChr = Math.round((hits / 3) * 100);
          setCfChrRate(finalChr);
          setCfChrTesting(false);
        }, 600);
      }, 600);
    }, 400);
  };

  const handleOriginFailover = () => {
    if (cfFailoverIsSimulating) return;
    setCfFailoverIsSimulating(true);
    setCfFailoverStep(1);
    setCfActiveOrigin(null);
    setCfFailoverLogs([
      `[${new Date().toLocaleTimeString()}] 🚀 Ingress Client request received. Resolving DNS Anycast to Edge location...`
    ]);

    const log = (msg: string) => {
      setCfFailoverLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    setTimeout(() => {
      setCfFailoverStep(2);
      log('Steering request from Edge POP to Primary Origin S3 (us-east-1)...');

      setTimeout(() => {
        if (cfPrimaryOriginStatus === 'healthy') {
          setCfFailoverStep(6);
          setCfActiveOrigin('primary');
          setCfFailoverIsSimulating(false);
          log('✅ SUCCESS: Primary S3 Bucket responded with HTTP 200 OK. Returning response to client.');
        } else {
          setCfFailoverStep(3);
          log('⚠️ CRITICAL: Primary S3 Bucket returned HTTP 502 Bad Gateway (Outage detected!).');

          setTimeout(() => {
            setCfFailoverStep(4);
            log('🔄 INTERCEPTED: CloudFront Origin Group catches 502. Activating active-passive failover policy...');

            setTimeout(() => {
              setCfFailoverStep(5);
              log('Steering backup request to Secondary Origin S3 (eu-west-1)...');

              setTimeout(() => {
                setCfFailoverStep(6);
                setCfActiveOrigin('secondary');
                setCfFailoverIsSimulating(false);
                log('✅ FAILOVER SUCCESS: Secondary S3 Bucket responded with HTTP 200 OK. Client served silently! 🛡️');
              }, 1000);
            }, 800);
          }, 800);
        }
      }, 1000);
    }, 800);
  };

  const handleEdgeScriptExecution = () => {
    if (cfEdgeTesting) return;
    setCfEdgeTesting(true);
    setCfEdgeStep(1);
    setCfEdgeLatency(null);
    const template = scriptTemplates[cfSelectedTemplate];
    
    setCfEdgeLogs([
      `[${new Date().toLocaleTimeString()}] 🚀 Initiating request matching caching behavior rules.`,
      `[${new Date().toLocaleTimeString()}] Intercepting at stage: [${template.stage}] using ${template.type}.`
    ]);

    const log = (msg: string) => {
      setCfEdgeLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    setTimeout(() => {
      setCfEdgeStep(2);
      log(`Booting script environment isolate (${template.language})...`);
      log(`Executing handler code block at Edge location...`);

      setTimeout(() => {
        setCfEdgeStep(3);
        if (cfSelectedTemplate === 'hsts') {
          log('Appended Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options headers to response.');
        } else if (cfSelectedTemplate === 'rewrite') {
          log(`Rewrote request URI path from /docs/getting-started to /docs/getting-started/index.html.`);
        } else if (cfSelectedTemplate === 'ab') {
          log('Inspected cookie header: "experiment_group=variant_b". Steering origin hostname to Variant S3 Bucket.');
        }

        setTimeout(() => {
          setCfEdgeStep(4);
          const latency = cfSelectedTemplate === 'ab' ? 30 : 1;
          setCfEdgeLatency(latency);
          setCfEdgeTesting(false);
          log(`✅ Execution complete. Edge Latency overhead: ${latency}ms. Served response to client.`);
        }, 800);
      }, 900);
    }, 700);
  };

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

              </div>

              {/* 🎨 New Origins Security SVG Diagram */}
              <div className="cf-sec">VPC Private Origins, S3 OAC request signing &amp; Custom Header Verification Pipelines</div>
              <div className="cf-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                  CloudFront provides multiple ways to lock down backend ingress. Trace the three standard security architectures below:
                </div>
                <svg viewBox="0 0 740 320" width="100%" style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                  <defs>
                    <marker id="arr-cf-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#3b82f6" /></marker>
                    <marker id="arr-cf-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                    <marker id="arr-cf-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6" /></marker>
                    <marker id="arr-cf-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444" /></marker>
                  </defs>

                  {/* Public Client Ingress */}
                  <rect x="15" y="115" width="115" height="90" rx="6" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" strokeWidth="1" />
                  <text x="72" y="140" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">Global Users</text>
                  <text x="72" y="155" textAnchor="middle" fontSize="8" fill="#3b82f6" fontWeight="bold">💻 Web Requests</text>
                  <text x="72" y="170" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">HTTPS / HTTP/3</text>
                  <text x="72" y="185" textAnchor="middle" fontSize="6.5" fill="#10b981" fontWeight="bold">Accelerated CDN Route</text>

                  {/* CloudFront Edge Controller */}
                  <rect x="180" y="85" width="145" height="150" rx="6" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="2" />
                  <text x="252" y="105" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#6d28d9">⚡ CloudFront Edge</text>
                  <rect x="190" y="125" width="125" height="30" rx="3" fill="#ffffff" stroke="#ddd6fe" />
                  <text x="252" y="136" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#6d28d9">SigV4 OAC Signer</text>
                  <text x="252" y="147" textAnchor="middle" fontSize="6" fill="#7c3aed">(For S3 Bucket Origin)</text>

                  <rect x="190" y="165" width="125" height="30" rx="3" fill="#ffffff" stroke="#ddd6fe" />
                  <text x="252" y="176" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#0284c7">VPC Endpoint Link</text>
                  <text x="252" y="187" textAnchor="middle" fontSize="6" fill="#0369a1">(For Private ALB Subnet)</text>

                  <rect x="190" y="202" width="125" height="25" rx="3" fill="#ffffff" stroke="#ddd6fe" />
                  <text x="252" y="212" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#be185d">Inject: X-Origin-Verify</text>

                  {/* Connectors from Client */}
                  <path d="M130,160 L175,160" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arr-cf-blue)" />

                  {/* Integration A: S3 Private Origin + OAC */}
                  <path d="M325,120 L400,60" fill="none" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arr-cf-green)" />
                  <text x="365" y="80" textAnchor="middle" fontSize="7.5" fill="#047857" fontWeight="bold">SigV4 Signed</text>

                  <rect x="400" y="15" width="310" height="70" rx="4" fill="#f0fdf4" stroke="#10b981" strokeWidth="1.5" />
                  <text x="415" y="32" textAnchor="start" fontSize="9" fontWeight="bold" fill="#065f46">🪣 Option A: S3 Bucket Origin with OAC</text>
                  <text x="415" y="44" textAnchor="start" fontSize="7" fill="#047857">S3 Bucket is 100% PRIVATE. Public WWW bypass attempts are rejected (HTTP 403) ❌</text>
                  <text x="415" y="56" textAnchor="start" fontSize="7.5" fontWeight="bold" fill="#15803d">✔ S3 accepts signed request payload carrying verified CloudFront OAC credentials</text>

                  {/* Integration B: CloudFront VPC Private Origin */}
                  <path d="M325,160 L400,160" fill="none" stroke="#0ea5e9" strokeWidth="1.5" markerEnd="url(#arr-cf-blue)" />
                  <text x="365" y="152" textAnchor="middle" fontSize="7.5" fill="#0369a1" fontWeight="bold">Private Link</text>

                  <rect x="400" y="100" width="310" height="85" rx="4" fill="#f0f9ff" stroke="#0ea5e9" strokeWidth="1.5" />
                  <text x="415" y="118" textAnchor="start" fontSize="9" fontWeight="bold" fill="#0369a1">🛡️ Option B: VPC Private Origin (Subnet Integration)</text>
                  <text x="415" y="130" textAnchor="start" fontSize="7" fill="#0284c7">CloudFront establishes private VPC endpoints inside your private backend subnets.</text>
                  <text x="415" y="142" textAnchor="start" fontSize="7" fill="#0284c7">ALBs and EC2 nodes have NO public IPs and cannot be probed from public WWW.</text>
                  <text x="415" y="156" textAnchor="start" fontSize="7.5" fontWeight="bold" fill="#0284c7">✔ 100% private transit over dedicated internal network routes 🔒</text>

                  {/* Integration C: Public Custom Origin + Ingress Header Restriction */}
                  <path d="M325,200 L400,250" fill="none" stroke="#8b5cf6" strokeWidth="1.5" markerEnd="url(#arr-cf-purple)" />
                  <text x="365" y="235" textAnchor="middle" fontSize="7.5" fill="#6d28d9" fontWeight="bold">Secret Token</text>

                  <rect x="400" y="200" width="310" height="105" rx="4" fill="#fff1f2" stroke="#ec4899" strokeWidth="1.5" />
                  <text x="415" y="218" textAnchor="start" fontSize="9" fontWeight="bold" fill="#9f1239">⚡ Option C: Custom Origin with Ingress Headers</text>
                  <text x="415" y="230" textAnchor="start" fontSize="7" fill="#be185d">ALB is in a public subnet. Public hackers try to bypass CloudFront to attack ALB directly 👿</text>
                  <text x="415" y="244" textAnchor="start" fontSize="7.5" fontWeight="bold" fill="#9f1239">⚠ ALB validates request for headers: "X-Origin-Verify: shared-secret-key"</text>
                  <text x="415" y="258" textAnchor="start" fontSize="7" fill="#be185d">If header matches: Accept write traffic ✅</text>
                  <text x="415" y="270" textAnchor="start" fontSize="7" fill="#b91c1c">If header is missing/mismatched: REJECT request instantly with HTTP 403 Access Denied ❌</text>
                </svg>
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
              {/* --- ADVANCED CACHE KEY OPTIMIZER PLAYGROUND --- */}
              <div className="cf-sec">🔌 Interactive Cache Key &amp; Forwarding Optimizer Sandbox</div>
              <div className="cf-card">
                <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                  CloudFront uses a lookup key (the <strong>Cache Key</strong>) to identify cached resources. By default, it consists of only the URL path. If you forward query strings, cookies, or headers, they are added to the key. This sandbox illustrates the direct trade-off between configuration flexibility and caching performance.
                </div>

                <div className="cf-grid2" style={{ gap: '16px' }}>
                  {/* Control Panel */}
                  <div style={{ background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '10px', color: '#6366f1' }}>Forwarding Configuration Policies</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div className="cf-ctrl" style={{ padding: '8px', background: '#fff' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Query Strings Forwarding</label>
                        <select value={cfQsForwarding} onChange={(e) => setCfQsForwarding(e.target.value as any)} style={{ fontSize: '11px', padding: '4px' }}>
                          <option value="none">None (Ignore all query parameters)</option>
                          <option value="whitelist">Whitelist (Forward only ?v=... version tag)</option>
                          <option value="all">Forward All Query Strings (Uniqueness-heavy)</option>
                        </select>
                      </div>

                      <div className="cf-ctrl" style={{ padding: '8px', background: '#fff' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Request Headers Forwarding</label>
                        <select value={cfHeaderForwarding} onChange={(e) => setCfHeaderForwarding(e.target.value as any)} style={{ fontSize: '11px', padding: '4px' }}>
                          <option value="none">None (Static assets only)</option>
                          <option value="whitelist">Whitelist (Forward only Accept-Language)</option>
                          <option value="all">Forward All Headers (⚠️ User-Agent included)</option>
                        </select>
                      </div>

                      <div className="cf-ctrl" style={{ padding: '8px', background: '#fff' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Cookies Forwarding</label>
                        <select value={cfCookieForwarding} onChange={(e) => setCfCookieForwarding(e.target.value as any)} style={{ fontSize: '11px', padding: '4px' }}>
                          <option value="none">None (Ignore tracking/session cookies)</option>
                          <option value="all">Forward All Cookies (⚠️ Unique sessions)</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      className="cf-btn cf-primary" 
                      onClick={handleChrEvaluation} 
                      disabled={cfChrTesting}
                      style={{ width: '100%', marginTop: '12px', padding: '8px', fontWeight: 600 }}
                    >
                      {cfChrTesting ? '⌛ Evaluating Caching Hit Ratio...' : '⚡ Evaluate Cache Key Caching'}
                    </button>
                  </div>

                  {/* Inspector Panel */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '12px', flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: '#334155' }}>Live Compiled Cache Key:</div>
                      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', padding: '8px', fontFamily: 'monospace', fontSize: '10.5px', color: '#38bdf8', wordBreak: 'break-all', lineHeight: '1.4' }}>
                        {getCompiledCacheKey()}
                      </div>
                      
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Sequential Test Requests (Varying Client Devices):</div>
                        <div style={{ background: '#ffffff', border: '0.5px solid #e2e8f0', borderRadius: '6px', padding: '8px', minHeight: '80px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {cfCacheHistory.length === 0 ? (
                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Click "Evaluate Cache Key Caching" to run device lookup sequence...</span>
                          ) : (
                            cfCacheHistory.map((item, index) => (
                              <div key={index} style={{ fontFamily: 'monospace', fontSize: '10px', color: item.includes('HIT') ? '#16a34a' : '#c2410c' }}>
                                {item}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>

                    {cfChrRate !== null && (
                      <div style={{ background: cfChrRate === 0 ? '#fef2f2' : '#f0fdf4', border: `1px solid ${cfChrRate === 0 ? '#fca5a5' : '#86efac'}`, borderRadius: '8px', padding: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ fontSize: '20px' }}>{cfChrRate === 0 ? '❌' : '🟢'}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: cfChrRate === 0 ? '#991b1b' : '#166534' }}>
                            Calculated Cache Hit Ratio (CHR): {cfChrRate}%
                          </div>
                          <div style={{ fontSize: '10.5px', color: cfChrRate === 0 ? '#b91c1c' : '#15803d', marginTop: '2px', lineHeight: '1.3' }}>
                            {cfChrRate === 0 ? (
                              <strong>⚠️ CACHE EFFICIENCY DESTROYED!</strong>
                            ) : (
                              <strong>🚀 HIGHLY OPTIMIZED CACHING!</strong>
                            )}
                            {' '}
                            {cfHeaderForwarding === 'all' && 'Forwarding all headers (including varying User-Agents) forces a costly Origin Fetch on every browser request.'}
                            {cfCookieForwarding === 'all' && 'Forwarding all cookies renders the Cache Key completely unique to individual client sessions.'}
                            {cfHeaderForwarding !== 'all' && cfCookieForwarding !== 'all' && 'By omitting unique headers and cookies from the Cache Key, CloudFront can deliver cached content in under 1ms to subsequent global visitors!'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* --- ADVANCED ORIGIN GROUPS FAILOVER SANDBOX --- */}
              <div className="cf-sec">🛡️ Active-Passive Origin Group Failover Topology Sandbox</div>
              <div className="cf-card">
                <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                  An <strong>Origin Group</strong> establishes high-availability failover configurations by coupling a Primary origin with a Secondary backup. When CloudFront receives error codes (e.g. 502 Bad Gateway) from the Primary origin, it transparently reroutes traffic to the backup region in seconds.
                </div>

                <div className="cf-grid2" style={{ gap: '16px' }}>
                  {/* Left Controls column */}
                  <div style={{ background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#b91c1c' }}>HA Origin Group Configuration</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', marginBottom: '12px' }}>
                      <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: '6px', padding: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Primary Origin: <strong>S3 Bucket (Virginia)</strong></span>
                        <span className="cf-badge cf-bok">Primary</span>
                      </div>
                      <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: '6px', padding: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Backup Origin: <strong>S3 Bucket (Dublin)</strong></span>
                        <span className="cf-badge cf-binfo">Secondary</span>
                      </div>
                      <div style={{ background: '#fff', border: '0.5px solid #e2e8f0', borderRadius: '6px', padding: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Failover Trigger Codes:</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#b91c1c' }}>500, 502, 503, 504</span>
                      </div>
                    </div>

                    <div className="cf-ctrl" style={{ padding: '8px', background: '#fff', marginBottom: '10px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Primary Origin Health Status</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          className={`cf-tb ${cfPrimaryOriginStatus === 'healthy' ? 'cf-on' : ''}`}
                          onClick={() => setCfPrimaryOriginStatus('healthy')}
                          style={{ flex: 1, padding: '4px', fontSize: '11px', background: cfPrimaryOriginStatus === 'healthy' ? '#16a34a' : '', borderColor: cfPrimaryOriginStatus === 'healthy' ? '#16a34a' : '' }}
                        >
                          🟢 Healthy
                        </button>
                        <button 
                          className={`cf-tb ${cfPrimaryOriginStatus === 'outage' ? 'cf-on' : ''}`}
                          onClick={() => setCfPrimaryOriginStatus('outage')}
                          style={{ flex: 1, padding: '4px', fontSize: '11px', background: cfPrimaryOriginStatus === 'outage' ? '#ef4444' : '', borderColor: cfPrimaryOriginStatus === 'outage' ? '#ef4444' : '' }}
                        >
                          🔴 Outage (502 Error)
                        </button>
                      </div>
                    </div>

                    <button 
                      className="cf-btn cf-primary" 
                      onClick={handleOriginFailover}
                      disabled={cfFailoverIsSimulating}
                      style={{ width: '100%', padding: '8px', fontWeight: 600 }}
                    >
                      {cfFailoverIsSimulating ? '⌛ Tracing failover pathway...' : '🚀 Simulate Request'}
                    </button>
                  </div>

                  {/* Right SVG and log output column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '10px', background: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569', alignSelf: 'flex-start', marginBottom: '6px' }}>Failover Route Topology:</span>
                      
                      <svg width="100%" height="110" viewBox="0 0 320 110" style={{ background: '#f8fafc', borderRadius: '6px', border: '0.5px solid #e2e8f0' }}>
                        {/* Client Node */}
                        <circle cx="25" cy="55" r="10" fill="#6366f1" />
                        <text x="25" y="55" textAnchor="middle" dominantBaseline="central" fontSize="7" fill="#fff" fontWeight="bold">Cli</text>
                        <text x="25" y="72" textAnchor="middle" fontSize="6.5" fill="#475569" fontWeight="600">Client</text>

                        {/* Edge Node */}
                        <rect x="80" y="35" width="40" height="40" rx="3" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="1" />
                        <text x="100" y="50" textAnchor="middle" fontSize="7" fill="#6d28d9" fontWeight="bold">CloudFront</text>
                        <text x="100" y="62" textAnchor="middle" fontSize="6" fill="#7c3aed">Edge</text>

                        {/* Primary S3 (Virginia) */}
                        <rect x="180" y="10" width="55" height="35" rx="3" fill={cfActiveOrigin === 'primary' ? '#ecfdf5' : '#ffffff'} stroke={cfFailoverStep >= 3 ? '#ef4444' : cfActiveOrigin === 'primary' ? '#10b981' : '#cbd5e1'} strokeWidth={cfActiveOrigin === 'primary' || cfFailoverStep >= 3 ? 1.5 : 1} />
                        <text x="207.5" y="22" textAnchor="middle" fontSize="7" fill="#334155" fontWeight="bold">S3 Primary</text>
                        <text x="207.5" y="32" textAnchor="middle" fontSize="6" fill={cfFailoverStep >= 3 ? '#ef4444' : '#64748b'}>
                          {cfPrimaryOriginStatus === 'healthy' ? '🟢 us-east-1' : '🔴 502 Bad'}
                        </text>

                        {/* Secondary S3 (Dublin) */}
                        <rect x="180" y="65" width="55" height="35" rx="3" fill={cfActiveOrigin === 'secondary' ? '#eff6ff' : '#ffffff'} stroke={cfActiveOrigin === 'secondary' ? '#3b82f6' : '#cbd5e1'} strokeWidth={cfActiveOrigin === 'secondary' ? 1.5 : 1} />
                        <text x="207.5" y="77" textAnchor="middle" fontSize="7" fill="#334155" fontWeight="bold">S3 Backup</text>
                        <text x="207.5" y="87" textAnchor="middle" fontSize="6" fill={cfActiveOrigin === 'secondary' ? '#3b82f6' : '#64748b'}>🔵 eu-west-1</text>

                        {/* Arrows */}
                        {/* Client to Edge */}
                        <path d="M 35 55 L 80 55" stroke={cfFailoverStep >= 1 ? '#6366f1' : '#cbd5e1'} strokeWidth="1" strokeDasharray={cfFailoverIsSimulating && cfFailoverStep === 1 ? '3,3' : ''} />
                        
                        {/* Edge to Primary */}
                        <path d="M 120 50 L 180 27" fill="none" stroke={cfFailoverStep === 3 ? '#ef4444' : cfFailoverStep >= 2 ? '#6366f1' : '#cbd5e1'} strokeWidth="1" />
                        
                        {/* Edge to Backup */}
                        <path d="M 120 60 L 180 82" fill="none" stroke={cfFailoverStep >= 5 ? '#3b82f6' : '#cbd5e1'} strokeWidth="1" strokeDasharray={cfFailoverStep === 5 ? '3,3' : ''} />

                        {/* Failover Shield status logo */}
                        {cfFailoverStep === 4 && (
                          <g>
                            <circle cx="150" cy="55" r="9" fill="#fee2e2" stroke="#ef4444" strokeWidth="1" />
                            <text x="150" y="55" textAnchor="middle" dominantBaseline="central" fontSize="7.5" fill="#b91c1c" fontWeight="bold">⚠️</text>
                          </g>
                        )}
                      </svg>
                    </div>

                    {/* Terminal Failover Logs */}
                    <div style={{ background: '#1e293b', borderRadius: '6px', padding: '8px', minHeight: '90px', maxHeight: '120px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '9.5px', color: '#cbd5e1', lineHeight: '1.45' }}>
                      {cfFailoverLogs.map((logLine, logIdx) => (
                        <div key={logIdx} style={{ marginBottom: '3px' }}>
                          <span style={{ color: logLine.includes('✅') ? '#4ade80' : logLine.includes('⚠️') ? '#f87171' : logLine.includes('🔄') ? '#fbbf24' : '#94a3b8' }}>
                            {logLine}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
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

            {/* --- ADVANCED EDGE COMPUTING PLAYROOM --- */}
            <div className="cf-sec">⚡ Interactive Edge Computing Scripting Playroom</div>
            <div className="cf-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                Execute high-speed compute logic globally at AWS Edge datacenters. Choose between lightweight **CloudFront Functions** (sub-millisecond HTTP header rewrites running in secure V8 sandboxes) and full **Lambda@Edge** servers (supporting NodeJS/Python runtimes and database connectivity).
              </div>

              <div className="cf-grid2" style={{ gap: '16px' }}>
                {/* Left Column: Selector & Editor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#6366f1' }}>Select Script Template Policy:</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <button 
                        className={`cf-tb ${cfSelectedTemplate === 'hsts' ? 'cf-on' : ''}`}
                        onClick={() => { setCfSelectedTemplate('hsts'); setCfEdgeStep(0); setCfEdgeLatency(null); }}
                        style={{ textAlign: 'left', display: 'block', width: '100%', padding: '8px', fontSize: '11.5px' }}
                      >
                        🛡️ Add HSTS Headers (CloudFront Functions)
                      </button>
                      <button 
                        className={`cf-tb ${cfSelectedTemplate === 'rewrite' ? 'cf-on' : ''}`}
                        onClick={() => { setCfSelectedTemplate('rewrite'); setCfEdgeStep(0); setCfEdgeLatency(null); }}
                        style={{ textAlign: 'left', display: 'block', width: '100%', padding: '8px', fontSize: '11.5px' }}
                      >
                        🔗 URL Rewrite Clean Paths (CloudFront Functions)
                      </button>
                      <button 
                        className={`cf-tb ${cfSelectedTemplate === 'ab' ? 'cf-on' : ''}`}
                        onClick={() => { setCfSelectedTemplate('ab'); setCfEdgeStep(0); setCfEdgeLatency(null); }}
                        style={{ textAlign: 'left', display: 'block', width: '100%', padding: '8px', fontSize: '11.5px' }}
                      >
                        ⚖ A/B Test Origin Routing (Lambda@Edge)
                      </button>
                    </div>

                    {/* Educational specifications box */}
                    <div style={{ marginTop: '12px', borderTop: '0.5px solid #cbd5e1', paddingTop: '8px', fontSize: '11px', lineHeight: '1.45', color: '#475569' }}>
                      <div><strong>Engine:</strong> <span style={{ color: '#0284c7', fontWeight: 600 }}>{scriptTemplates[cfSelectedTemplate].type}</span></div>
                      <div><strong>Stage:</strong> <span style={{ color: '#6d28d9', fontWeight: 600 }}>{scriptTemplates[cfSelectedTemplate].stage}</span></div>
                      <div><strong>Performance:</strong> <span style={{ color: '#16a34a', fontWeight: 600 }}>{scriptTemplates[cfSelectedTemplate].latency}</span></div>
                      <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', fontSize: '10px' }}>
                        {scriptTemplates[cfSelectedTemplate].description}
                      </p>
                    </div>
                  </div>

                  {/* Editor Mockup */}
                  <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid #1e293b', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '10.5px', fontFamily: 'monospace', color: '#94a3b8' }}>📄 handler.js (Read-only Editor)</span>
                      <span className="cf-badge cf-binfo" style={{ padding: '2px 6px', fontSize: '8px' }}>{scriptTemplates[cfSelectedTemplate].language}</span>
                    </div>
                    <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: '10.5px', color: '#38bdf8', flex: 1, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                      {scriptTemplates[cfSelectedTemplate].code}
                    </pre>
                  </div>
                </div>

                {/* Right Column: Execution Terminal and Latency Indicator */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#f8fafc', border: '0.5px solid #cbd5e1', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#334155' }}>Edge Execution Console</div>
                    
                    <button 
                      className="cf-btn cf-primary" 
                      onClick={handleEdgeScriptExecution}
                      disabled={cfEdgeTesting}
                      style={{ width: '100%', padding: '8px', fontWeight: 600, marginBottom: '10px' }}
                    >
                      {cfEdgeTesting ? '⚡ Executing script globally...' : '⚡ Execute Script at Edge'}
                    </button>

                    {/* Micro-animations and phase indicator */}
                    <div style={{ background: '#ffffff', border: '0.5px solid #cbd5e1', borderRadius: '6px', padding: '8px', fontSize: '10.5px' }}>
                      <div style={{ fontWeight: 700, color: '#475569', marginBottom: '6px' }}>Pipeline Progress Stages:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ color: cfEdgeStep >= 1 ? '#16a34a' : '#94a3b8', fontWeight: cfEdgeStep === 1 ? 'bold' : 'normal' }}>
                          {cfEdgeStep >= 1 ? '🟢' : '⚪'} Stage 1: Request Interception ({scriptTemplates[cfSelectedTemplate].stage})
                        </div>
                        <div style={{ color: cfEdgeStep >= 2 ? '#16a34a' : '#94a3b8', fontWeight: cfEdgeStep === 2 ? 'bold' : 'normal' }}>
                          {cfEdgeStep >= 2 ? '🟢' : '⚪'} Stage 2: Sandbox Isolate compilation
                        </div>
                        <div style={{ color: cfEdgeStep >= 3 ? '#16a34a' : '#94a3b8', fontWeight: cfEdgeStep === 3 ? 'bold' : 'normal' }}>
                          {cfEdgeStep >= 3 ? '🟢' : '⚪'} Stage 3: Request/Response Header Mutation
                        </div>
                        <div style={{ color: cfEdgeStep >= 4 ? '#16a34a' : '#94a3b8', fontWeight: cfEdgeStep === 4 ? 'bold' : 'normal' }}>
                          {cfEdgeStep >= 4 ? '🟢' : '⚪'} Stage 4: Execution successfully finished!
                        </div>
                      </div>
                    </div>

                    {/* Latency Gauges */}
                    {cfEdgeLatency !== null && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                          <span>Dynamic Latency Overhead:</span>
                          <span style={{ color: cfEdgeLatency === 1 ? '#16a34a' : '#be185d' }}>
                            {cfEdgeLatency} ms ({cfEdgeLatency === 1 ? 'Ultra optimized V8 isolate' : 'Node Lambda container'})
                          </span>
                        </div>
                        
                        {/* Visual progress bar */}
                        <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              width: cfEdgeLatency === 1 ? '4%' : '90%', 
                              background: cfEdgeLatency === 1 ? '#16a34a' : '#db2777',
                              transition: 'width 0.4s ease-out'
                            }} 
                          />
                        </div>
                        
                        <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>
                          {cfEdgeLatency === 1 
                            ? 'CloudFront Functions execute in lightweight threads. Zero cold-start latency.'
                            : 'Lambda@Edge invokes a full Node.js server container. Supports extensive computational power at a slight startup cost.'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Console Logs & Modified Headers Terminals */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Logs console */}
                    <div style={{ background: '#1e293b', borderRadius: '6px', padding: '8px', height: '80px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '9.5px', color: '#cbd5e1', lineHeight: '1.4' }}>
                      {cfEdgeLogs.map((logLine, logIdx) => (
                        <div key={logIdx} style={{ marginBottom: '3px', color: logLine.includes('✅') ? '#4ade80' : '#cbd5e1' }}>
                          {logLine}
                        </div>
                      ))}
                    </div>

                    {/* Header Diff side-by-side */}
                    {cfEdgeStep >= 3 && (
                      <div className="cf-grid2" style={{ gap: '8px', flex: 1 }}>
                        <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '6px', padding: '6px', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#b91c1c', marginBottom: '4px' }}>Inbound Header:</span>
                          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '9px', color: '#475569', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                            {scriptTemplates[cfSelectedTemplate].inputHeaders}
                          </pre>
                        </div>
                        <div style={{ background: '#f0fdf4', border: '1.5px solid #86efac', borderRadius: '6px', padding: '6px', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: '#166534', marginBottom: '4px' }}>Modified Header (At Edge):</span>
                          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '9px', color: '#15803d', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                            {scriptTemplates[cfSelectedTemplate].outputHeaders}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
