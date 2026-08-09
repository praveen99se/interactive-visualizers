import React, { useState } from 'react';
import CloudfrontComparativeView from '../../components/visualizers/CloudfrontComparativeView';
import UniqueCloudfrontFeatures from '../../components/visualizers/UniqueCloudfrontFeatures';

type TabType = 'overview' | 'origins' | 'aga' | 'security' | 'sim' | 'pricing' | 'unique';
type ClientRegion = 'us' | 'eu' | 'asia';
type OriginType = 's3' | 'alb_public' | 'alb_vpc';
type HttpMethod = 'GET_STATIC' | 'GET_DYNAMIC' | 'POST';
type PriceClass = '100' | '200' | 'all';

interface SimLog {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface CloudfrontVisualizerProps {
  provider?: 'aws' | 'azure' | 'gcp' | 'comparative';
  setProvider?: (provider: 'aws' | 'azure' | 'gcp' | 'comparative') => void;
}

export default function CloudfrontVisualizer({ provider = 'aws', setProvider }: CloudfrontVisualizerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const isComparative = provider === 'comparative';
  const isAzure = provider === 'azure';
  const isGcp = provider === 'gcp';

  const t = (text: string) => {
    if (provider === 'azure') {
      return text
        .replace(/Amazon CloudFront/gi, 'Azure Front Door / Azure CDN')
        .replace(/CloudFront/g, 'Azure Front Door')
        .replace(/Edge Location/gi, 'Azure Edge PoP')
        .replace(/Edge Locations/gi, 'Azure Edge PoPs')
        .replace(/Origin Access Control \(OAC\)/gi, 'Azure Private Link Origin')
        .replace(/AWS Global Accelerator/gi, 'Azure Front Door Anycast Architecture')
        .replace(/Global Accelerator/gi, 'Azure Front Door Anycast Router')
        .replace(/AWS WAF/gi, 'Azure Web Application Firewall (WAF)')
        .replace(/Origin Shield/gi, 'Azure Front Door Regional Cache')
        .replace(/CloudWatch/g, 'Azure Monitor')
        .replace(/S3 Bucket/gi, 'Azure Blob Storage')
        .replace(/CloudFront Functions/gi, 'Azure Front Door Rules Engine');
    }
    if (provider === 'gcp') {
      return text
        .replace(/Amazon CloudFront/gi, 'Google Cloud CDN')
        .replace(/CloudFront/g, 'Cloud CDN')
        .replace(/Edge Location/gi, 'Google Edge PoP')
        .replace(/Edge Locations/gi, 'Google Edge PoPs')
        .replace(/Origin Access Control \(OAC\)/gi, 'Signed URLs & Cloud IAM')
        .replace(/AWS Global Accelerator/gi, 'Google Cloud Global Anycast IP & Premium Tier')
        .replace(/Global Accelerator/gi, 'GCP Global Anycast Network')
        .replace(/AWS WAF/gi, 'Google Cloud Armor Security Policies')
        .replace(/Origin Shield/gi, 'GCP Media CDN Origin Shield')
        .replace(/CloudWatch/g, 'Cloud Monitoring')
        .replace(/S3 Bucket/gi, 'Google Cloud Storage Bucket')
        .replace(/CloudFront Functions/gi, 'Cloud CDN Edge Logic');
    }
    return text;
  };

  const Translate = ({ children }: { children: React.ReactNode }): React.ReactElement => {
    if (provider === 'aws') {
      return <>{children}</>;
    }

    const translateNode = (node: React.ReactNode): React.ReactNode => {
      if (typeof node === 'string') {
        return t(node);
      }
      if (typeof node === 'number') {
        return node;
      }
      if (React.isValidElement(node)) {
        if (node.type === 'pre' || node.type === 'code' || (node.props && (node.props.className === 'cf-terminal' || node.props.className === 'cf-log'))) {
          return node;
        }
        if (node.props && node.props.children) {
          if (typeof node.props.children === 'function') {
            return node;
          }
          const translatedChildren = React.Children.map(node.props.children, translateNode);
          return React.cloneElement(node, { ...node.props, children: translatedChildren });
        }
        return node;
      }
      if (Array.isArray(node)) {
        return node.map((child, index) => <React.Fragment key={index}>{translateNode(child)}</React.Fragment>);
      }
      return node;
    };

    return <>{translateNode(children)}</>;
  };

  const handleNavigateToDemo = (prov: 'aws' | 'azure' | 'gcp', tab: any) => {
    if (setProvider) {
      setProvider(prov);
    }
    setActiveTab(tab);
  };
  
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
        /* Scoped CloudFront Styling & Glassmorphic Tokens */
        .cf-container {
          font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
          color: var(--color-text-primary, #1e293b);

          /* Theme Variables (Light mode default) */
          --cf-bg: #ffffff;
          --cf-card-bg: rgba(255, 255, 255, 0.8);
          --cf-card-border: rgba(226, 232, 240, 0.85);
          --cf-card-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.08);
          
          --color-text-primary: #1e293b;
          --color-text-secondary: #475569;
          --color-text-tertiary: #64748b;
          
          --cf-border-primary: rgba(226, 232, 240, 0.8);
          --cf-border-secondary: #cbd5e1;
          --cf-border-tertiary: #e2e8f0;
          
          --color-background-primary: #ffffff;
          --color-background-secondary: #f8fafc;
          --color-background-tertiary: #f1f5f9;
          
          --cf-tab-bg: rgba(248, 250, 252, 0.7);
          --cf-tab-hover-bg: rgba(241, 245, 249, 0.9);
          --cf-tab-border: rgba(226, 232, 240, 0.8);
          
          --cf-btn-bg: #ffffff;
          --cf-btn-color: #475569;
          --cf-btn-hover-bg: rgba(248, 250, 252, 0.9);
          
          --cf-select-bg: #ffffff;
          --cf-select-color: #1e293b;
          --cf-select-border: rgba(226, 232, 240, 0.9);
          
          --cf-terminal-bg: #0f172a;
          --cf-terminal-border: #1e293b;
          --cf-terminal-color: #cbd5e1;
          
          --cf-svg-grid-line: rgba(203, 213, 225, 0.45);
          --cf-svg-node-bg: #ffffff;
          --cf-svg-node-border: #e2e8f0;
          --cf-svg-node-stroke: #cbd5e1;
          
          --cf-svg-node-fill-client: #eff6ff;
          --cf-svg-node-stroke-client: #bfdbfe;
          --cf-svg-text-client: #1e40af;
          
          --cf-svg-node-fill-edge: #f5f3ff;
          --cf-svg-node-stroke-edge: #ddd6fe;
          --cf-svg-text-edge: #581c87;
          
          --cf-svg-node-fill-rec: #fdf2f8;
          --cf-svg-node-stroke-rec: #fbcfe8;
          --cf-svg-text-rec: #9d174d;
          
          --cf-svg-node-fill-origin: #ecfdf5;
          --cf-svg-node-stroke-origin: #10b981;
          --cf-svg-text-origin: #047857;
          
          --cf-svg-node-fill-alb: #eff6ff;
          --cf-svg-node-stroke-alb: #3b82f6;
          --cf-svg-text-alb: #1e3a8a;
          
          --cf-alert-blue-bg: #eff6ff;
          --cf-alert-blue-border: #bfdbfe;
          --cf-alert-blue-text: #1e40af;
          --cf-alert-yellow-bg: #fdfaee;
          --cf-alert-yellow-border: #fde68a;
          --cf-alert-yellow-text: #854d0e;

          --cf-svg-text-orange: #ea580c;
          --cf-svg-node-fill-orange: #fff7ed;
          --cf-svg-node-stroke-orange: #ffedd5;
          --cf-svg-node-text-orange: #c2410c;
          
          --cf-alert-red-bg: #fee2e2;
          --cf-alert-red-border: #fca5a5;
          --cf-alert-red-text: #b91c1c;

          --cf-svg-map-fill: rgba(99, 102, 241, 0.08);
          --cf-svg-map-stroke: #c7d2fe;
        }
        .cf-h {
          font-size: 24px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 6px;
          color: var(--color-text-primary);
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .cf-sub {
          font-size: 13.5px;
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin-bottom: 18px;
        }
        .cf-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          border-bottom: 1.5px solid var(--cf-border-primary);
          padding-bottom: 12px;
        }
        .cf-tb {
          padding: 8px 16px;
          border-radius: 12px;
          border: 1px solid var(--cf-tab-border);
          font-size: 12.5px;
          cursor: pointer;
          background: var(--cf-tab-bg);
          color: var(--color-text-secondary);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          font-weight: 600;
          backdrop-filter: blur(8px);
        }
        .cf-tb:hover {
          background: var(--cf-tab-hover-bg);
          color: var(--color-text-primary);
          transform: translateY(-1px);
        }
        .cf-tb.cf-on {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #ffffff;
          border-color: #4f46e5;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
        }
        .cf-card {
          border: 1.5px solid var(--cf-card-border);
          border-radius: 16px;
          padding: 18px 20px;
          background: var(--cf-card-bg);
          margin-bottom: 18px;
          box-shadow: var(--cf-card-shadow);
          backdrop-filter: blur(12px);
          transition: border-color 0.2s;
        }
        .cf-card:hover {
          border-color: rgba(99, 102, 241, 0.35);
        }
        .cf-sec {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.07em;
          margin: 20px 0 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .cf-sec:first-child { margin-top: 0; }
        .cf-grid2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .cf-grid3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        .cf-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 10px 12px;
          border: 1px solid var(--cf-border-primary);
          border-radius: 10px;
          background: var(--color-background-secondary);
          margin-bottom: 8px;
          font-size: 12.5px;
          line-height: 1.5;
          transition: background 0.2s;
        }
        .cf-row:hover {
          background: var(--cf-tab-hover-bg);
        }
        .cf-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 11px;
          color: #ffffff;
          font-weight: 700;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
        }
        .cf-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .cf-binfo { background: #e0e7ff; color: #4338ca; border: 0.5px solid #c7d2fe; }
        .cf-bok { background: #dcfce7; color: #15803d; border: 0.5px solid #bbf7d0; }
        .cf-bwarn { background: #fef3c7; color: #b45309; border: 0.5px solid #fde68a; }
        .cf-bbad { background: #fee2e2; color: #b91c1c; border: 0.5px solid #fecaca; }
        .cf-controls {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }
        .cf-ctrl {
          background: var(--color-background-secondary);
          border: 1.5px solid var(--cf-border-primary);
          border-radius: 12px;
          padding: 14px;
          transition: border-color 0.2s;
        }
        .cf-ctrl:hover {
          border-color: rgba(99, 102, 241, 0.3);
        }
        .cf-ctrl label {
          display: block;
          font-size: 12.5px;
          font-weight: 700;
          color: var(--color-text-secondary);
          margin-bottom: 8px;
        }
        .cf-ctrl select, .cf-ctrl input[type="text"] {
          width: 100%;
          padding: 8px;
          font-size: 12px;
          border: 1.5px solid var(--cf-select-border);
          border-radius: 8px;
          background: var(--cf-select-bg);
          outline: none;
          color: var(--cf-select-color);
          font-weight: 500;
          transition: all 0.15s;
        }
        .cf-mono {
          font-family: var(--font-mono, ui-monospace, monospace);
          font-size: 11.5px;
        }
        .cf-btnbar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 14px;
        }
        .cf-btn {
          font-size: 12px;
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 10px;
          border: 1.5px solid var(--cf-border-secondary);
          background: var(--cf-btn-bg);
          color: var(--cf-btn-color);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          outline: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transform: translateY(0);
        }
        .cf-btn:hover {
          background: var(--cf-btn-hover-bg);
          color: var(--color-text-primary);
          border-color: rgba(99, 102, 241, 0.25);
          transform: translateY(-1px);
        }
        .cf-btn.cf-primary {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          border: none;
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(99, 102, 241, 0.2);
        }
        .cf-btn.cf-primary:hover {
          background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
        }
        .cf-btn.cf-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          border: none;
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(239, 68, 68, 0.2);
        }
        .cf-btn.cf-danger:hover {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
        }
        .cf-log {
          background: var(--cf-terminal-bg);
          border: 1.5px solid var(--cf-terminal-border);
          border-radius: 12px;
          padding: 14px 16px;
          font-size: 11.5px;
          color: var(--cf-terminal-color);
          line-height: 1.7;
          min-height: 120px;
          max-height: 240px;
          overflow-y: auto;
          margin-top: 14px;
          font-family: var(--font-mono, ui-monospace, monospace);
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.4);
        }
        .cf-log-entry {
          margin-bottom: 6px;
          border-bottom: 1px dashed rgba(51, 65, 85, 0.5);
          padding-bottom: 4px;
        }
        .cf-log-entry:last-child { border: none; }
        .cf-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          line-height: 1.5;
        }
        .cf-table th {
          background: var(--color-background-secondary);
          border: 1.5px solid var(--cf-border-primary);
          padding: 10px 12px;
          text-align: left;
          font-weight: 700;
          color: var(--color-text-secondary);
        }
        .cf-table td {
          border: 1.5px solid var(--cf-border-primary);
          padding: 10px 12px;
          color: var(--color-text-primary);
        }
        .cf-table tr:nth-child(even) { background: var(--color-background-primary); }
        
        /* High-Contrast Highlights for light-mode text readability */
        .cf-hl-cyan { background-color: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 6px; font-weight: 700; border: 0.5px solid #bae6fd; }
        .cf-hl-indigo { background-color: #e0e7ff; color: #4338ca; padding: 2px 6px; border-radius: 6px; font-weight: 700; border: 0.5px solid #c7d2fe; }
        .cf-hl-orange { background-color: #ffedd5; color: #c2410c; padding: 2px 6px; border-radius: 6px; font-weight: 700; border: 0.5px solid #fed7aa; }
        .cf-hl-green { background-color: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 6px; font-weight: 700; border: 0.5px solid #bbf7d0; }
        .cf-hl-purple { background-color: #f3e8ff; color: #6b21a8; padding: 2px 6px; border-radius: 6px; font-weight: 700; border: 0.5px solid #e9d5ff; }

        /* Blueprint dot grid background grid */
        .cf-svg-bg {
          background-color: var(--color-background-secondary);
          background-image: radial-gradient(var(--cf-svg-grid-line) 1.5px, transparent 1.5px);
          background-size: 16px 16px;
        }

        .cf-desc-mute { color: var(--color-text-tertiary); font-size: 11px; font-style: italic; opacity: 0.95; font-weight: normal; background: none; padding: 0; }

        /* Centralized Dark Mode Overrides for CloudfrontVisualizer.tsx */
        .dark .cf-container {
          background: #020617 !important;
          color: #f8fafc !important;

          --cf-bg: #020617;
          --cf-card-bg: rgba(15, 23, 42, 0.75);
          --cf-card-border: rgba(51, 65, 85, 0.6);
          --cf-card-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          
          --color-text-primary: #f8fafc;
          --color-text-secondary: #cbd5e1;
          --color-text-tertiary: #94a3b8;
          
          --cf-border-primary: rgba(51, 65, 85, 0.6);
          --cf-border-secondary: rgba(51, 65, 85, 0.6);
          --cf-border-tertiary: rgba(51, 65, 85, 0.6);
          
          --color-background-primary: #0f172a;
          --color-background-secondary: #0b0f19;
          --color-background-tertiary: #1e293b;
          
          --cf-tab-bg: rgba(15, 23, 42, 0.6);
          --cf-tab-hover-bg: rgba(30, 41, 59, 0.8);
          --cf-tab-border: rgba(51, 65, 85, 0.6);
          
          --cf-btn-bg: rgba(15, 23, 42, 0.8);
          --cf-btn-color: #cbd5e1;
          --cf-btn-hover-bg: rgba(30, 41, 59, 0.8);
          
          --cf-select-bg: #0f172a;
          --cf-select-color: #f1f5f9;
          --cf-select-border: rgba(51, 65, 85, 0.8);
          
          --cf-terminal-bg: #020617;
          --cf-terminal-border: rgba(51, 65, 85, 0.6);
          --cf-terminal-color: #38bdf8;
          
          --cf-svg-grid-line: rgba(51, 65, 85, 0.5);
          --cf-svg-node-bg: rgba(15, 23, 42, 0.8);
          --cf-svg-node-border: rgba(51, 65, 85, 0.6);
          --cf-svg-node-stroke: rgba(100, 116, 139, 0.5);
          
          --cf-svg-node-fill-client: rgba(37, 99, 235, 0.15);
          --cf-svg-node-stroke-client: rgba(96, 165, 250, 0.6);
          --cf-svg-text-client: #60a5fa;
          
          --cf-svg-node-fill-edge: rgba(139, 92, 246, 0.15);
          --cf-svg-node-stroke-edge: rgba(167, 139, 250, 0.6);
          --cf-svg-text-edge: #a78bfa;
          
          --cf-svg-node-fill-rec: rgba(236, 72, 153, 0.15);
          --cf-svg-node-stroke-rec: rgba(244, 114, 182, 0.6);
          --cf-svg-text-rec: #f472b6;
          
          --cf-svg-node-fill-origin: rgba(16, 185, 129, 0.15);
          --cf-svg-node-stroke-origin: rgba(52, 211, 153, 0.6);
          --cf-svg-text-origin: #34d399;
          
          --cf-svg-node-fill-alb: rgba(59, 130, 246, 0.15);
          --cf-svg-node-stroke-alb: rgba(96, 165, 250, 0.6);
          --cf-svg-text-alb: #60a5fa;
          
          --cf-alert-blue-bg: rgba(37, 99, 235, 0.1);
          --cf-alert-blue-border: rgba(59, 130, 246, 0.4);
          --cf-alert-blue-text: #93c5fd;
          --cf-alert-yellow-bg: rgba(245, 158, 11, 0.1);
          --cf-alert-yellow-border: rgba(217, 119, 6, 0.4);
          --cf-alert-yellow-text: #fde68a;

          --cf-svg-text-orange: #ff9d43;
          --cf-svg-node-fill-orange: rgba(245, 158, 11, 0.15);
          --cf-svg-node-stroke-orange: rgba(245, 158, 11, 0.5);
          --cf-svg-node-text-orange: #fbbf24;
          
          --cf-alert-red-bg: rgba(239, 68, 68, 0.15);
          --cf-alert-red-border: rgba(239, 68, 68, 0.4);
          --cf-alert-red-text: #f87171;

          --cf-svg-map-fill: rgba(99, 102, 241, 0.15);
          --cf-svg-map-stroke: rgba(199, 210, 254, 0.35);
        }
        .dark .cf-card b,
        .dark .cf-card strong,
        .dark .cf-card h3,
        .dark .cf-card h4 {
          color: #ffffff !important;
        }
        .dark .cf-hl-cyan { background-color: rgba(6, 182, 212, 0.25); color: #22d3ee; border-color: rgba(6, 182, 212, 0.4); }
        .dark .cf-hl-indigo { background-color: rgba(99, 102, 241, 0.25); color: #818cf8; border-color: rgba(99, 102, 241, 0.4); }
        .dark .cf-hl-orange { background-color: rgba(245, 158, 11, 0.25); color: #fbbf24; border-color: rgba(245, 158, 11, 0.4); }
        .dark .cf-hl-green { background-color: rgba(16, 185, 129, 0.25); color: #34d399; border-color: rgba(16, 185, 129, 0.4); }
        .dark .cf-hl-purple { background-color: rgba(168, 85, 247, 0.25); color: #c084fc; border-color: rgba(168, 85, 247, 0.4); }
        
        /* Node Status Overrides */
        .dark .cf-ok {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: #4ade80 !important;
        }
        .dark .cf-warm {
          border-color: #f59e0b !important;
          background: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
        }
        .dark .cf-drain {
          border-color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }
        .dark .cf-down {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.15) !important;
          color: #f87171 !important;
        }
        
        /* General form overrides */
        .cf-container select,
        .cf-container input,
        .cf-container textarea {
          background-color: var(--cf-select-bg) !important;
          color: var(--cf-select-color) !important;
          border-color: var(--cf-select-border) !important;
        }
        .cf-container select option {
          background-color: var(--cf-select-bg) !important;
          color: var(--cf-select-color) !important;
      `}</style>

      <div className="cf-container">
        {/* Title Header */}
        <div style={{ padding: '14px 16px 4px' }}>
          <div className="cf-h">
            {isComparative ? (
              <span>⚖️ Multi-Cloud CDN Comparison — AWS CloudFront vs Azure Front Door vs GCP Cloud CDN</span>
            ) : isAzure ? (
              <span>⚡ Azure Front Door &amp; Azure Content Delivery Network</span>
            ) : isGcp ? (
              <span>⚡ Google Cloud CDN &amp; Media CDN Global Infrastructure</span>
            ) : (
              <span>⚡ Amazon CloudFront — Global Content Delivery Network (CDN)</span>
            )}
          </div>
          <div className="cf-sub">
            {isComparative ? (
              <span>Side-by-side architectural comparison of global edge content delivery networks across AWS, Azure, and GCP.</span>
            ) : isAzure ? (
              <span>Accelerate applications at Azure edge PoPs. Rules engine header rewrites, Private Link storage origins, and WAF protection.</span>
            ) : isGcp ? (
              <span>Global Anycast CDN infrastructure. Signed URLs/Cookies authorization, Media CDN video streaming, and Cloud Armor edge security.</span>
            ) : (
              <span>Accelerate the distribution of static web pages, dynamic applications, streaming media, and secure APIs. Cache assets at globally distributed edge nodes to lower read latencies, reduce load and egress costs on origin servers, and block malicious traffic before it reaches your private cloud perimeter.</span>
            )}
          </div>
        </div>

        {!isComparative && (
          <div className="cf-tabs">
            <button className={`cf-tb ${activeTab === 'overview' ? 'cf-on' : ''}`} onClick={() => setActiveTab('overview')}>🌐 1) Concept &amp; Delivery</button>
            <button className={`cf-tb ${activeTab === 'origins' ? 'cf-on' : ''}`} onClick={() => setActiveTab('origins')}>🔌 2) Origins &amp; Integrations</button>
            <button className={`cf-tb ${activeTab === 'aga' ? 'cf-on' : ''}`} onClick={() => setActiveTab('aga')}>🚀 3) Global Accelerator</button>
            <button className={`cf-tb ${activeTab === 'security' ? 'cf-on' : ''}`} onClick={() => setActiveTab('security')}>🛡️ 4) OAC, Geo &amp; Purges</button>
            <button className={`cf-tb ${activeTab === 'sim' ? 'cf-on' : ''}`} onClick={() => setActiveTab('sim')}>🎮 5) Live Global Request Simulator</button>
            <button className={`cf-tb ${activeTab === 'pricing' ? 'cf-on' : ''}`} onClick={() => setActiveTab('pricing')}>💰 6) Pricing &amp; Shield</button>
            <button className={`cf-tb ${activeTab === 'unique' ? 'cf-on' : ''}`} onClick={() => setActiveTab('unique')}>✨ Unique Features</button>
          </div>
        )}

        {isComparative && (
          <CloudfrontComparativeView onNavigateToDemo={handleNavigateToDemo} />
        )}

        {!isComparative && activeTab === 'unique' && (
          <UniqueCloudfrontFeatures provider={provider as 'aws' | 'azure' | 'gcp'} />
        )}

        {!isComparative && activeTab !== 'unique' && (
          <Translate>
            <>

        {/* Tab 1: Concept & Delivery */}
        {activeTab === 'overview' && (
          <div>
            <div className="cf-sec">
              {isAzure ? 'Azure Front Door / Azure CDN — Core Architecture & Request Flow' : isGcp ? 'Google Cloud CDN / Media CDN — Core Architecture & Request Flow' : 'Amazon CloudFront — Core Architecture & Request Flow'}
            </div>
            <div className="cf-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                {isAzure 
                  ? 'Azure Front Door deploys a global Anycast network spanning 190+ Edge PoP locations. Incoming HTTP/HTTPS client requests are terminated at the nearest Azure PoP, terminating TLS in milliseconds before proxying traffic over the private Microsoft global fiber backbone.'
                  : isGcp 
                  ? 'Google Cloud CDN leverages Google global Anycast infrastructure across 100+ locations worldwide. Client requests route to the nearest Google edge PoP over BGP Anycast, serving cached static assets or streaming video chunks via Media CDN.'
                  : 'CloudFront deploys a massive proxy and caching network spanning hundreds of cities globally. Instead of client requests traveling across public ocean floor fibers to a central database or origin server, requests are automatically routed to the topologically nearest datacenter for immediate local evaluation.'}
              </div>

              {/* Core Concept splits with .cf-desc-mute */}
              <div className="cf-grid2" style={{ marginBottom: '16px' }}>
                <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--cf-alert-blue-text)' }}>Key Edge Concepts</div>
                  
                  <div className="cf-row">
                    <div className="cf-dot">1</div>
                    <div>
                      {isAzure ? 'Azure offers ' : isGcp ? 'Google Cloud offers ' : 'AWS offers '}
                      <span className="cf-hl-indigo">{isAzure ? 'Azure Edge PoP' : isGcp ? 'Google Anycast Edge PoP' : 'Edge Location'}</span>{' '}
                      <span className="cf-desc-mute">({isAzure ? 'a globally distributed Azure datacenter running high-speed caching proxy servers' : isGcp ? 'a Google edge location running BGP Anycast and Media CDN cache nodes' : 'a geographically distributed datacenter running a Point of Presence POP housing high-speed physical caching proxy servers'})</span> as the frontline client receiver. Which means client connections terminate millisecond distances away, accelerating TCP handshakes and TLS negotiations.
                    </div>
                  </div>

                  <div className="cf-row">
                    <div className="cf-dot">2</div>
                    <div>
                      {isAzure ? 'Azure offers ' : isGcp ? 'Google Cloud offers ' : 'AWS offers '}
                      <span className="cf-hl-indigo">{isAzure ? 'Azure Regional Cache Node' : isGcp ? 'Google Regional Cache (GGC)' : 'Regional Edge Cache (REC)'}</span>{' '}
                      <span className="cf-desc-mute">({isAzure ? 'a mid-tier cache location buffering Azure Storage and App Services' : isGcp ? 'a centralized regional cache tier shielding Cloud Storage and GKE backends' : 'a larger, centralized mid-tier cache location situated between edge nodes and origins to swallow edge miss requests'})</span> to buffer origin servers. Which means even if individual edge nodes expire assets, the regional cache holds copies, shielding origin servers from costly database stampedes.
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--cf-svg-text-alb)' }}>Key Delivery Concepts</div>

                  <div className="cf-row">
                    <div className="cf-dot">3</div>
                    <div>
                      {isAzure ? 'Azure offers ' : isGcp ? 'Google Cloud offers ' : 'AWS offers '}
                      <span className="cf-hl-cyan">{isAzure ? 'Anycast VIP Ingress' : isGcp ? 'BGP Anycast Ingress' : 'DNS Anycast Routing'}</span>{' '}
                      <span className="cf-desc-mute">({isAzure ? 'a split-TCP architecture directing traffic over the Microsoft global network' : isGcp ? 'a single global IP address BGP Anycast routing over Google private fiber' : 'an IP addressing methodology where multiple physical servers share a single IP and BGP routers naturally steer packets to the topologically closest node'})</span> to handle incoming requests. Which means client browsers point directly to optimal network entry points depending on geography.
                    </div>
                  </div>

                  <div className="cf-row">
                    <div className="cf-dot">4</div>
                    <div>
                      {isAzure ? 'Azure offers ' : isGcp ? 'Google Cloud offers ' : 'AWS offers '}
                      <span className="cf-hl-cyan">{isAzure ? 'Private Link / Storage Origin' : isGcp ? 'Cloud Storage / GKE Origin' : 'Origin Server'}</span>{' '}
                      <span className="cf-desc-mute">({isAzure ? 'Azure Blob Storage or App Service connected via Private Link without public IPs' : isGcp ? 'Google Cloud Storage buckets or HTTPS Load Balancer with Signed URL validation' : 'the authoritative cloud storage bucket, load balancer, API gateway, or custom server that owns the master copy of your data'})</span> as the source of truth. Which means the CDN pulls raw assets from this backend whenever a global cache lookup results in a total cache miss.
                    </div>
                  </div>
                </div>
              </div>

              {/* High Level Architecture SVG */}
              <div style={{ border: '1.5px solid var(--cf-card-border)', borderRadius: '16px', padding: '16px', background: 'var(--color-background-primary)', marginBottom: '18px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🌐</span> Global Request Processing Pipeline (High-Fidelity 3D Grid Blueprint)
                </div>
                
                <svg width="100%" viewBox="0 0 760 220" className="cf-svg-bg" style={{ borderRadius: '12px', border: '1.5px solid var(--cf-card-border)' }}>
                  <defs>
                    <linearGradient id="grad-cf-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#2563eb" />
                    </linearGradient>
                    <linearGradient id="grad-cf-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                    <linearGradient id="grad-cf-pink" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="100%" stopColor="#db2777" />
                    </linearGradient>
                    <linearGradient id="grad-cf-green" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#94a3b8" floodOpacity="0.15" />
                    </filter>
                  </defs>

                  {/* Column 1: Client Locations Grid */}
                  <rect x="15" y="25" width="150" height="175" rx="10" fill="var(--cf-card-bg)" stroke="var(--cf-card-border)" strokeWidth="1" filter="url(#shadow)" />
                  <text x="90" y="42" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--color-text-secondary)">🌍 Client Locations</text>
                  
                  {/* US Client Card */}
                  <g filter="url(#shadow)">
                    <rect x="25" y="58" width="130" height="32" rx="6" fill="var(--cf-svg-node-fill-client)" stroke="var(--cf-svg-node-stroke-client)" strokeWidth="1" />
                    <text x="90" y="77" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--cf-svg-text-client)">Client US (New York)</text>
                  </g>
                  
                  {/* EU Client Card */}
                  <g filter="url(#shadow)">
                    <rect x="25" y="102" width="130" height="32" rx="6" fill="var(--cf-svg-node-fill-client)" stroke="var(--cf-svg-node-stroke-client)" strokeWidth="1" />
                    <text x="90" y="121" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--cf-svg-text-client)">Client EU (Frankfurt)</text>
                  </g>

                  {/* ASIA Client Card */}
                  <g filter="url(#shadow)">
                    <rect x="25" y="146" width="130" height="32" rx="6" fill="var(--cf-svg-node-fill-client)" stroke="var(--cf-svg-node-stroke-client)" strokeWidth="1" />
                    <text x="90" y="165" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--cf-svg-text-client)">Client ASIA (Tokyo)</text>
                  </g>

                  {/* ==================== GLOBAL EDGE POP BOUNDARY ==================== */}
                  <rect x="190" y="24" width="170" height="185" rx="8" fill="none" stroke="#8b5cf6" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="198" y="36" fill="var(--cf-svg-text-edge)" fontSize="7.5" fontWeight="extrabold">{isAzure ? "Azure Edge PoP Boundary" : isGcp ? "Google Anycast PoP Boundary" : "Global Edge POP Boundary"}</text>

                  {/* Column 2: Edge Locations */}
                  {/* New York Edge PoP */}
                  <g filter="url(#shadow)">
                    <rect x="205" y="58" width="140" height="32" rx="6" fill="var(--cf-svg-node-fill-edge)" stroke="var(--cf-svg-node-stroke-edge)" strokeWidth="1" />
                    <circle cx="218" cy="74" r="3" fill="#10b981" />
                    <text x="280" y="77" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--cf-svg-text-edge)">{isAzure ? "New York PoP (East US)" : isGcp ? "New York Anycast PoP" : "New York Edge (POP)"}</text>
                  </g>
                  
                  {/* Frankfurt Edge PoP */}
                  <g filter="url(#shadow)">
                    <rect x="205" y="102" width="140" height="32" rx="6" fill="var(--cf-svg-node-fill-edge)" stroke="var(--cf-svg-node-stroke-edge)" strokeWidth="1" />
                    <circle cx="218" cy="118" r="3" fill="#10b981" />
                    <text x="280" y="121" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--cf-svg-text-edge)">{isAzure ? "Frankfurt PoP (EU West)" : isGcp ? "Frankfurt Anycast PoP" : "Frankfurt Edge (POP)"}</text>
                  </g>

                  {/* Tokyo Edge PoP */}
                  <g filter="url(#shadow)">
                    <rect x="205" y="146" width="140" height="32" rx="6" fill="var(--cf-svg-node-fill-edge)" stroke="var(--cf-svg-node-stroke-edge)" strokeWidth="1" />
                    <circle cx="218" cy="162" r="3" fill="#10b981" />
                    <text x="280" y="165" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--cf-svg-text-edge)">{isAzure ? "Tokyo PoP (East Asia)" : isGcp ? "Tokyo Anycast PoP" : "Tokyo Edge (POP)"}</text>
                  </g>

                  {/* ==================== REGIONAL CACHING CLOUD BOUNDARY ==================== */}
                  <rect x="375" y="24" width="180" height="185" rx="8" fill="none" stroke="#ec4899" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="383" y="36" fill="var(--cf-svg-text-rec)" fontSize="7.5" fontWeight="extrabold">Regional Caching Boundary</text>

                  {/* Column 3: Regional Edge Cache (REC) */}
                  {/* US East REC */}
                  <g filter="url(#shadow)">
                    <rect x="395" y="58" width="140" height="50" rx="6" fill="var(--cf-svg-node-fill-rec)" stroke="var(--cf-svg-node-stroke-rec)" strokeWidth="1.5" />
                    <text x="465" y="78" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--cf-svg-text-rec)">{isAzure ? "East US Cache" : isGcp ? "us-central1 Cache" : "US-East REC"}</text>
                    <text x="465" y="94" textAnchor="middle" fontSize="8" fill="var(--cf-svg-text-rec)" fontWeight="600">(Primary Buffer)</text>
                  </g>

                  {/* Europe REC */}
                  <g filter="url(#shadow)">
                    <rect x="395" y="128" width="140" height="50" rx="6" fill="var(--cf-svg-node-fill-rec)" stroke="var(--cf-svg-node-stroke-rec)" strokeWidth="1.5" />
                    <text x="465" y="148" textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--cf-svg-text-rec)">{isAzure ? "West Europe Cache" : isGcp ? "europe-west1 Cache" : "Europe REC"}</text>
                    <text x="465" y="164" textAnchor="middle" fontSize="8" fill="var(--cf-svg-text-rec)" fontWeight="600">(Primary Buffer)</text>
                  </g>

                  {/* ==================== SECURE PRIVATE DATA VPC BOUNDARY ==================== */}
                  <rect x="570" y="24" width="180" height="185" rx="8" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="6,4" />
                  <text x="578" y="36" fill="var(--cf-svg-node-stroke-alb)" fontSize="7.5" fontWeight="extrabold">{isAzure ? "Secure Azure VNet Boundary" : isGcp ? "Secure GCP VPC Boundary" : "Secure Private Data VPC Boundary"}</text>

                  {/* Column 4: Origin Servers */}
                  {/* S3 Storage Cylinder */}
                  <g filter="url(#shadow)">
                    <path d="M 595 72 A 50 12 0 0 0 695 72 L 695 90 A 50 12 0 0 1 595 90 Z" fill="var(--cf-svg-node-fill-origin)" stroke="var(--cf-svg-node-stroke-origin)" strokeWidth="1.5" />
                    <ellipse cx="645" cy="72" rx="50" ry="12" fill="var(--cf-svg-node-fill-origin)" stroke="var(--cf-svg-node-stroke-origin)" strokeWidth="1.5" />
                    <text x="645" y="86" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--cf-svg-text-origin)">{isAzure ? "📦 blob-storage-account" : isGcp ? "🪣 gcs-storage-bucket" : "🪣 private-s3-bucket"}</text>
                  </g>

                  {/* ALB Compute Tower */}
                  <g filter="url(#shadow)">
                    <rect x="595" y="128" width="130" height="42" rx="6" fill="var(--cf-svg-node-fill-alb)" stroke="var(--cf-svg-node-stroke-alb)" strokeWidth="1.5" />
                    <text x="660" y="146" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="var(--cf-svg-text-alb)">{isAzure ? "⚙️ app-service-api" : isGcp ? "⚙️ gke-https-lb" : "⚙️ alb-dynamic-api"}</text>
                    <text x="660" y="158" textAnchor="middle" fontSize="8" fill="var(--cf-svg-text-alb)" fontWeight="600">{isAzure ? "VNet Private Link" : isGcp ? "PSA Subnet Gateway" : "VPC API Gateway"}</text>
                  </g>

                  {/* Routing Conduits & Waveguide Paths */}
                  {/* US Client to NY Edge */}
                  <path d="M 155 74 L 205 74" fill="none" stroke="var(--cf-svg-node-stroke)" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 155 74 L 205 74" id="path-us-pop" fill="none" stroke="url(#grad-cf-blue)" strokeWidth="1.5" strokeLinecap="round" />

                  {/* EU Client to Frankfurt Edge */}
                  <path d="M 155 118 L 205 118" fill="none" stroke="var(--cf-svg-node-stroke)" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 155 118 L 205 118" id="path-eu-pop" fill="none" stroke="url(#grad-cf-blue)" strokeWidth="1.5" strokeLinecap="round" />

                  {/* Asia Client to Tokyo Edge */}
                  <path d="M 155 162 L 205 162" fill="none" stroke="var(--cf-svg-node-stroke)" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 155 162 L 205 162" id="path-asia-pop" fill="none" stroke="url(#grad-cf-blue)" strokeWidth="1.5" strokeLinecap="round" />

                  {/* POPs to RECs */}
                  {/* NY Edge PoP to US East REC */}
                  <path d="M 345 74 L 395 83" fill="none" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.5" strokeDasharray="3,3" />
                  {/* Tokyo Edge PoP to US East REC */}
                  <path d="M 345 162 L 395 100" fill="none" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.5" strokeDasharray="3,3" />
                  {/* Frankfurt Edge PoP to Europe REC */}
                  <path d="M 345 121 L 395 153" fill="none" stroke="rgba(99, 102, 241, 0.25)" strokeWidth="1.5" strokeDasharray="3,3" />

                  {/* RECs to Origins */}
                  {/* US REC to S3 and ALB */}
                  <path d="M 535 83 L 595 83" fill="none" stroke="var(--cf-svg-node-stroke-origin)" strokeWidth="2" strokeLinecap="round" />
                  <path d="M 535 90 L 595 140" fill="none" stroke="var(--cf-svg-node-stroke-alb)" strokeWidth="1.5" strokeLinecap="round" />

                  {/* Europe REC to S3 and ALB */}
                  <path d="M 535 145 L 595 89" fill="none" stroke="var(--cf-svg-node-stroke-origin)" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 535 153 L 595 153" fill="none" stroke="var(--cf-svg-node-stroke-alb)" strokeWidth="2" strokeLinecap="round" />

                  {/* Dynamic Packet Pulses */}
                  <circle r="4" fill="#a855f7">
                    <animateMotion dur="2.5s" repeatCount="indefinite">
                      <mpath href="#path-us-pop" />
                    </animateMotion>
                  </circle>
                  <circle r="4" fill="#3b82f6">
                    <animateMotion dur="3s" repeatCount="indefinite">
                      <mpath href="#path-eu-pop" />
                    </animateMotion>
                  </circle>
                  <circle r="4" fill="#ec4899">
                    <animateMotion dur="2.2s" repeatCount="indefinite">
                      <mpath href="#path-asia-pop" />
                    </animateMotion>
                  </circle>
                </svg>
              </div>

              {/* Core Features list */}
              <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: 'var(--cf-alert-blue-text)' }}>Operational Stages of a Request:</div>
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
            <div className="cf-sec">{isAzure ? "Origin Types, Azure Private Link Connections, and Storage Redundancy" : isGcp ? "Origin Types, VPC Peering / PSA Connections, and Cloud Storage Redundancy" : "Origin Types, Custom VPC Connections, and S3 CRR Comparisons"}</div>
            <div className="cf-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                {isAzure ? "Azure Front Door integrates with Blob Storage accounts for static assets, and with dynamic backends (App Service, Azure VMs, or API Management) inside or outside Azure VNets via Private Link." : isGcp ? "Google Cloud CDN integrates with Cloud Storage (GCS) buckets for static contents, and with dynamic backends (Cloud Run, GKE, or Compute Engine) via HTTPS Load Balancers & Private Service Access." : "CloudFront integrates with S3 buckets for static contents, and with dynamic application backends (like ALB, EC2, or custom servers) inside or outside AWS networks. Understanding secure access structures is essential for shielding your backends."}
              </div>

              <div className="cf-grid2" style={{ gap: '14px', marginBottom: '14px' }}>
                {/* Origins Breakdown */}
                <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--cf-svg-text-origin)' }}>Origin Integrations &amp; Security</div>
                  
                  <div className="cf-row">
                    <div className="cf-dot">A</div>
                    <div>
                      {isAzure ? 'Azure offers ' : isGcp ? 'Google Cloud offers ' : 'AWS offers '}
                      <span className="cf-hl-green">{isAzure ? 'Azure Blob Storage + Private Link' : isGcp ? 'Cloud Storage + Signed URLs / IAM' : 'S3 Bucket Origin + OAC'}</span>{' '}
                      <span className="cf-desc-mute">({isAzure ? 'Managed Identities & Private Endpoints securing storage accounts' : isGcp ? 'HMAC Signed URLs & Service Account IAM securing Cloud Storage buckets' : 'Origin Access Control which signs request blocks with custom AWS SigV4 signatures'})</span> to secure static assets. Which means storage is completely private, rejecting all unauthorized internet traffic.
                    </div>
                  </div>

                  <div className="cf-row">
                    <div className="cf-dot">B</div>
                    <div>
                      {isAzure ? 'Azure offers ' : isGcp ? 'Google Cloud offers ' : 'AWS offers '}
                      <span className="cf-hl-green">{isAzure ? 'App Service / VM Origins' : isGcp ? 'Cloud Run / GKE Load Balancer Origins' : 'Dynamic ALB/EC2 Origins'}</span>{' '}
                      <span className="cf-desc-mute">({isAzure ? 'Front Door Private Link connections into internal App Services and Load Balancers' : isGcp ? 'Serverless Network Endpoint Groups (NEGs) into Cloud Run and GKE clusters' : 'attaching public Application Load Balancers or virtual compute instances as backend sources'})</span> to accelerate APIs. Which means the CDN operates as an SSL-terminating reverse proxy over private backbones.
                    </div>
                  </div>
                </div>

                {/* VPC Origin vs Public Network */}
                <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--cf-alert-yellow-text)' }}>VPC Private Origin vs Public Network Custom Origin</div>
                  <div style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    How does CloudFront fetch content from an ALB or EC2 database API instance? You have two architectural choices:
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--cf-border-secondary)', borderRadius: '6px', padding: '8px' }}>
                      <strong style={{ color: 'var(--cf-svg-text-alb)' }}>{isAzure ? "Option 1: Azure Front Door Private Link Origin" : isGcp ? "Option 1: Internal HTTPS Load Balancer via Private Service Access (PSA)" : "Option 1: CloudFront VPC Origin (Private Network Integration)"}</strong>
                      <div style={{ marginTop: '4px', color: 'var(--color-text-secondary)' }}>
                        Allows CloudFront to connect directly to private ALBs or EC2 instances inside your VPC subnets. Uses managed VPC endpoint interfaces under the hood. The ALB has no public IP address and cannot be accessed from the public internet.
                      </div>
                    </div>
                    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--cf-border-secondary)', borderRadius: '6px', padding: '8px' }}>
                      <strong style={{ color: 'var(--cf-alert-yellow-text)' }}>{isAzure ? "Option 2: Custom Origin via Public Network + X-Azure-FDID Header" : isGcp ? "Option 2: Custom Origin via Public Network + X-Goog-CDN-Header" : "Option 2: Custom Origin via Public Network + Ingress Restricting"}</strong>
                      <div style={{ marginTop: '4px', color: 'var(--color-text-secondary)' }}>
                        The ALB is placed in public subnets with a public DNS. To block public users from bypassing the CDN, you configure custom headers (e.g., <code>X-Origin-Verify: shared-secret</code>) inside CloudFront, and program the ALB to reject any traffic missing this header!
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              </div>

              {/* 🎨 New Origins Security SVG Diagram */}
              <div className="cf-sec">🛡️ VPC Private Origins, S3 OAC Request Signing &amp; Custom Header Verification Pipelines</div>
              <div className="cf-card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginBottom: '14px', textAlign: 'left', lineHeight: '1.5' }}>
                  CloudFront provides multiple mechanisms to lock down backend ingress. Trace the three standard security architectures below:
                </div>
                <svg viewBox="0 0 740 320" width="100%" className="cf-svg-bg" style={{ borderRadius: '12px', border: '1.5px solid var(--cf-card-border)', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.01))' }}>
                  <defs>
                    <linearGradient id="grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                    <linearGradient id="grad-green" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                    <linearGradient id="grad-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#6d28d9" />
                    </linearGradient>
                    <linearGradient id="grad-rose" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="100%" stopColor="#db2777" />
                    </linearGradient>
                    <filter id="shadow-sec" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#94a3b8" floodOpacity="0.1" />
                    </filter>
                  </defs>

                  {/* ==================== PUBLIC INGRESS BOUNDARY ==================== */}
                  <rect x="10" y="100" width="125" height="120" rx="8" fill="none" stroke="var(--cf-border-secondary)" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="18" y="112" fill="var(--color-text-secondary)" fontSize="7" fontWeight="bold">Public Ingress Boundary</text>

                  {/* Public Client Ingress Card */}
                  <g filter="url(#shadow-sec)">
                    <rect x="15" y="122" width="115" height="90" rx="8" fill="var(--cf-svg-node-bg)" stroke="var(--cf-svg-node-border)" strokeWidth="1" />
                    <text x="72" y="145" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-text-primary)">Global Users</text>
                    <text x="72" y="163" textAnchor="middle" fontSize="8.5" fill="var(--cf-svg-text-alb)" fontWeight="700">💻 Web Requests</text>
                    <text x="72" y="179" textAnchor="middle" fontSize="7.5" fill="var(--color-text-tertiary)">HTTPS / HTTP/3</text>
                    <rect x="25" y="188" width="94" height="15" rx="3" fill="var(--cf-svg-node-fill-origin)" />
                    <text x="72" y="198" textAnchor="middle" fontSize="7" fill="var(--cf-svg-text-origin)" fontWeight="700">CDN ACCELERATED</text>
                  </g>

                  {/* ==================== CLOUDFRONT EDGE SECURITY GATEWAY ==================== */}
                  <rect x="170" y="70" width="165" height="180" rx="8" fill="none" stroke="var(--cf-svg-text-edge)" strokeWidth="1.5" strokeDasharray="4,2" />
                  <text x="178" y="82" fill="var(--cf-svg-text-edge)" fontSize="7.5" fontWeight="extrabold">CloudFront Edge Security Gateway</text>

                  {/* CloudFront Edge Controller Card */}
                  <g filter="url(#shadow-sec)">
                    <rect x="180" y="92" width="145" height="150" rx="8" fill="var(--cf-svg-node-fill-edge)" stroke="var(--cf-svg-text-edge)" strokeWidth="2" />
                    <text x="252" y="112" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--cf-svg-text-edge)">⚡ CloudFront Edge</text>
                    
                    <g filter="url(#shadow-sec)">
                      <rect x="190" y="129" width="125" height="28" rx="4" fill="var(--color-background-primary)" stroke="var(--cf-border-secondary)" />
                      <text x="252" y="140" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--cf-svg-text-edge)">SigV4 OAC Signer</text>
                      <text x="252" y="151" textAnchor="middle" fontSize="6.5" fill="var(--cf-svg-text-edge)" fontWeight="600">(For S3 Bucket Origin)</text>
                    </g>

                    <g filter="url(#shadow-sec)">
                      <rect x="190" y="165" width="125" height="28" rx="4" fill="var(--color-background-primary)" stroke="var(--cf-border-secondary)" />
                      <text x="252" y="176" textAnchor="middle" fontSize="8" fontWeight="700" fill="var(--cf-svg-text-alb)">VPC Endpoint Link</text>
                      <text x="252" y="187" textAnchor="middle" fontSize="6.5" fill="var(--cf-svg-text-alb)" fontWeight="600">(For Private ALB Subnet)</text>
                    </g>

                    <g filter="url(#shadow-sec)">
                      <rect x="190" y="201" width="125" height="28" rx="4" fill="var(--color-background-primary)" stroke="var(--cf-border-secondary)" />
                      <text x="252" y="212" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="var(--cf-svg-text-rec)">X-Origin-Verify Header</text>
                      <text x="252" y="223" textAnchor="middle" fontSize="6.5" fill="var(--cf-svg-text-rec)" fontWeight="600">(Shared Token Injection)</text>
                    </g>
                  </g>

                  {/* Connectors from Client */}
                  <path d="M 130 167 L 180 167" stroke="var(--cf-svg-text-alb)" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="155" cy="167" r="3" fill="var(--cf-svg-text-alb)" />

                  {/* ==================== S3 SECURE STORAGE BOUNDARY ==================== */}
                  <rect x="390" y="10" width="330" height="80" rx="6" fill="none" stroke="var(--cf-svg-node-stroke-origin)" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="398" y="22" fill="var(--cf-svg-text-origin)" fontSize="7" fontWeight="bold">S3 Secure Storage Boundary</text>

                  {/* Integration A: S3 Private Origin + OAC */}
                  <path d="M 325 132 L 400 70" fill="none" stroke="var(--cf-svg-node-stroke-origin)" strokeWidth="1.5" />
                  <text x="365" y="93" textAnchor="middle" fontSize="7.5" fill="var(--cf-svg-text-origin)" fontWeight="700">SigV4 Signed</text>

                  <g filter="url(#shadow-sec)">
                    <rect x="400" y="26" width="310" height="58" rx="6" fill="var(--cf-svg-node-fill-origin)" stroke="var(--cf-svg-node-stroke-origin)" strokeWidth="1.5" />
                    <text x="415" y="40" textAnchor="start" fontSize="9" fontWeight="800" fill="var(--cf-svg-text-origin)">🪣 Option A: S3 Bucket Origin with OAC</text>
                    <text x="415" y="52" textAnchor="start" fontSize="7.5" fill="var(--cf-svg-text-origin)">Reject WWW bypass attempts (403) ❌ | Accepts verified OAC SigV4</text>
                  </g>

                  {/* ==================== PRIVATE VPC SUBNET GROUP ==================== */}
                  <rect x="390" y="98" width="330" height="92" rx="6" fill="none" stroke="var(--cf-svg-text-alb)" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="398" y="110" fill="var(--cf-svg-text-alb)" fontSize="7" fontWeight="bold">Private VPC Subnet Group</text>

                  {/* Integration B: CloudFront VPC Private Origin */}
                  <path d="M 325 167 L 400 160" fill="none" stroke="var(--cf-svg-text-alb)" strokeWidth="1.5" />
                  <text x="365" y="158" textAnchor="middle" fontSize="7.5" fill="var(--cf-svg-text-alb)" fontWeight="700">Private Link</text>

                  <g filter="url(#shadow-sec)">
                    <rect x="400" y="114" width="310" height="70" rx="6" fill="var(--cf-svg-node-fill-alb)" stroke="var(--cf-svg-node-stroke-alb)" strokeWidth="1.5" />
                    <text x="415" y="130" textAnchor="start" fontSize="9" fontWeight="800" fill="var(--cf-svg-text-alb)">🛡️ Option B: VPC Private Origin (Subnet Integration)</text>
                    <text x="415" y="142" textAnchor="start" fontSize="7.5" fill="var(--cf-svg-text-alb)">Private VPC endpoints inside private backend subnets. No public IPs.</text>
                    <text x="415" y="156" textAnchor="start" fontSize="8" fontWeight="700" fill="var(--cf-svg-text-alb)">✔ 100% private transit over dedicated internal VPC routes 🔒</text>
                  </g>

                  {/* ==================== DMZ / PUBLIC SUBNET GROUP ==================== */}
                  <rect x="390" y="196" width="330" height="114" rx="6" fill="none" stroke="#f43f5e" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="398" y="208" fill="#f43f5e" fontSize="7" fontWeight="bold">DMZ / Public Subnet Group</text>

                  {/* Integration C: Public Custom Origin + Ingress Header Restriction */}
                  <path d="M 325 202 L 400 245" fill="none" stroke="var(--cf-svg-text-edge)" strokeWidth="1.5" />
                  <text x="365" y="233" textAnchor="middle" fontSize="7.5" fill="var(--cf-svg-text-edge)" fontWeight="700">Secret Token</text>

                  <g filter="url(#shadow-sec)">
                    <rect x="400" y="212" width="310" height="92" rx="6" fill="rgba(244, 63, 94, 0.1)" stroke="#f43f5e" strokeWidth="1.5" />
                    <text x="415" y="228" textAnchor="start" fontSize="9" fontWeight="800" fill="#f43f5e">⚡ Option C: Custom Origin with Ingress Headers</text>
                    <text x="415" y="240" textAnchor="start" fontSize="7.5" fill="#f43f5e">ALB is in public subnet. Direct attackers bypassed CDN? ALB blocks them!</text>
                    <text x="415" y="254" textAnchor="start" fontSize="8" fontWeight="700" fill="#f43f5e">⚠ ALB validates "X-Origin-Verify: shared-secret-key" header</text>
                    <text x="415" y="268" textAnchor="start" fontSize="7.5" fill="#f43f5e">If header matches: Accept ✅ | Otherwise reject instantly (HTTP 403) ❌</text>
                  </g>
                </svg>
              </div>

              {/* Side-by-side: CloudFront vs S3 Cross-Region Replication (CRR) */}
              <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px', marginTop: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: 'var(--cf-alert-blue-text)' }}>
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
                  CloudFront uses a lookup key (the <strong>Cache Key</strong>) to identify cached resources. By default, it consists of only the URL path. If you forward query strings, cookies, or headers, they are added to the key. This sandbox illustrates the trade-off between configuration flexibility and caching performance.
                </div>

                <div className="cf-grid2" style={{ gap: '16px' }}>
                  {/* Control Panel */}
                  <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '10px', color: '#6366f1' }}>Forwarding Configuration Policies</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div className="cf-ctrl" style={{ padding: '8px', background: 'var(--color-background-primary)' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Query Strings Forwarding</label>
                        <select value={cfQsForwarding} onChange={(e) => setCfQsForwarding(e.target.value as any)} style={{ fontSize: '11px', padding: '4px' }}>
                          <option value="none">None (Ignore all query parameters)</option>
                          <option value="whitelist">Whitelist (Forward only ?v=... version tag)</option>
                          <option value="all">Forward All Query Strings (Uniqueness-heavy)</option>
                        </select>
                      </div>

                      <div className="cf-ctrl" style={{ padding: '8px', background: 'var(--color-background-primary)' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Request Headers Forwarding</label>
                        <select value={cfHeaderForwarding} onChange={(e) => setCfHeaderForwarding(e.target.value as any)} style={{ fontSize: '11px', padding: '4px' }}>
                          <option value="none">None (Static assets only)</option>
                          <option value="whitelist">Whitelist (Forward only Accept-Language)</option>
                          <option value="all">Forward All Headers (⚠️ User-Agent included)</option>
                        </select>
                      </div>

                      <div className="cf-ctrl" style={{ padding: '8px', background: 'var(--color-background-primary)' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Cookies Forwarding</label>
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
                    <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px', flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--color-text-primary)' }}>Live Compiled Cache Key:</div>
                      <div style={{ background: 'var(--cf-terminal-bg)', border: '1px solid var(--cf-terminal-border)', borderRadius: '6px', padding: '8px', fontFamily: 'monospace', fontSize: '10.5px', color: 'var(--cf-terminal-color)', wordBreak: 'break-all', lineHeight: '1.4' }}>
                        {getCompiledCacheKey()}
                      </div>
                      
                      <div style={{ marginTop: '10px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Sequential Test Requests (Varying Client Devices):</div>
                        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--cf-border-tertiary)', borderRadius: '6px', padding: '8px', minHeight: '80px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {cfCacheHistory.length === 0 ? (
                            <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>Click "Evaluate Cache Key Caching" to run device lookup sequence...</span>
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
                      <div style={{ background: cfChrRate === 0 ? 'var(--cf-alert-yellow-bg)' : 'var(--cf-alert-blue-bg)', border: `1px solid ${cfChrRate === 0 ? 'var(--cf-alert-yellow-border)' : 'var(--cf-alert-blue-border)'}`, borderRadius: '8px', padding: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ fontSize: '20px' }}>{cfChrRate === 0 ? '❌' : '🟢'}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '11.5px', fontWeight: 700, color: cfChrRate === 0 ? 'var(--cf-alert-yellow-text)' : 'var(--cf-alert-blue-text)' }}>
                            Calculated Cache Hit Ratio (CHR): {cfChrRate}%
                          </div>
                          <div style={{ fontSize: '10.5px', color: cfChrRate === 0 ? 'var(--cf-alert-yellow-text)' : 'var(--cf-alert-blue-text)', marginTop: '2px', lineHeight: '1.3' }}>
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
                  <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--cf-alert-red-text)' }}>HA Origin Group Configuration</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px', marginBottom: '12px' }}>
                      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--cf-border-tertiary)', borderRadius: '6px', padding: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Primary Origin: <strong>S3 Bucket (Virginia)</strong></span>
                        <span className="cf-badge cf-bok">Primary</span>
                      </div>
                      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--cf-border-tertiary)', borderRadius: '6px', padding: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Backup Origin: <strong>S3 Bucket (Dublin)</strong></span>
                        <span className="cf-badge cf-binfo">Secondary</span>
                      </div>
                      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--cf-border-tertiary)', borderRadius: '6px', padding: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Failover Trigger Codes:</span>
                        <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'var(--cf-alert-red-text)' }}>500, 502, 503, 504</span>
                      </div>
                    </div>

                    <div className="cf-ctrl" style={{ padding: '8px', background: 'var(--color-background-primary)', marginBottom: '10px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Primary Origin Health Status</label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          className={`cf-tb ${cfPrimaryOriginStatus === 'healthy' ? 'cf-on' : ''}`}
                          onClick={() => setCfPrimaryOriginStatus('healthy')}
                          style={{ flex: 1, padding: '4px', fontSize: '11px', background: cfPrimaryOriginStatus === 'healthy' ? 'var(--cf-svg-node-stroke-origin)' : '', borderColor: cfPrimaryOriginStatus === 'healthy' ? 'var(--cf-svg-node-stroke-origin)' : '' }}
                        >
                          🟢 Healthy
                        </button>
                        <button 
                          className={`cf-tb ${cfPrimaryOriginStatus === 'outage' ? 'cf-on' : ''}`}
                          onClick={() => setCfPrimaryOriginStatus('outage')}
                          style={{ flex: 1, padding: '4px', fontSize: '11px', background: cfPrimaryOriginStatus === 'outage' ? 'var(--cf-alert-red-text)' : '', borderColor: cfPrimaryOriginStatus === 'outage' ? 'var(--cf-alert-red-text)' : '' }}
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
                    <div style={{ border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '10px', background: 'var(--color-background-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', alignSelf: 'flex-start', marginBottom: '6px' }}>Failover Route Topology:</span>
                      
                      <svg width="100%" height="110" viewBox="0 0 320 110" className="cf-svg-bg" style={{ borderRadius: '8px', border: '1.5px solid var(--cf-card-border)' }}>
                        <defs>
                          <linearGradient id="grad-active-pri" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                          <linearGradient id="grad-active-sec" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#60a5fa" />
                            <stop offset="100%" stopColor="#2563eb" />
                          </linearGradient>
                          <filter id="shadow-fail" x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#475569" floodOpacity="0.1" />
                          </filter>
                        </defs>

                        {/* Client Node */}
                        <g filter="url(#shadow-fail)">
                          <rect x="10" y="38" width="30" height="34" rx="4" fill="var(--cf-card-bg)" stroke="var(--cf-card-border)" />
                          <rect x="14" y="42" width="22" height="16" rx="2" fill="var(--cf-svg-node-fill-client)" stroke="var(--cf-svg-node-stroke-client)" />
                          <line x1="20" y1="62" x2="30" y2="62" stroke="var(--cf-svg-node-stroke)" strokeWidth="1.5" />
                          <line x1="25" y1="62" x2="25" y2="68" stroke="var(--cf-svg-node-stroke)" strokeWidth="2" />
                          <text x="25" y="82" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="var(--color-text-secondary)">Client</text>
                        </g>

                        {/* Edge Location */}
                        <g filter="url(#shadow-fail)">
                          <rect x="80" y="32" width="42" height="42" rx="6" fill="var(--cf-svg-node-fill-edge)" stroke="var(--cf-svg-text-edge)" strokeWidth="1.5" />
                          <text x="101" y="47" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="var(--cf-svg-text-edge)">CF Edge</text>
                          <circle cx="91" cy="62" r="2.5" fill="#10b981" />
                          <circle cx="101" cy="62" r="2.5" fill="#10b981" />
                          <circle cx="111" cy="62" r="2.5" fill="#10b981" />
                        </g>

                        {/* Primary S3 (Virginia) Cylinder */}
                        <g filter="url(#shadow-fail)">
                          <path d="M 180 20 A 27.5 7 0 0 0 235 20 L 235 32 A 27.5 7 0 0 1 180 32 Z" 
                            fill={cfPrimaryOriginStatus === 'healthy' ? 'var(--cf-svg-node-fill-origin)' : 'var(--cf-alert-yellow-bg)'} 
                            stroke={cfFailoverStep >= 3 ? '#ef4444' : cfActiveOrigin === 'primary' ? 'var(--cf-svg-node-stroke-origin)' : 'var(--cf-svg-node-stroke)'} 
                            strokeWidth={cfActiveOrigin === 'primary' || cfFailoverStep >= 3 ? 1.5 : 1} 
                          />
                          <ellipse cx="207.5" cy="20" rx="27.5" ry="7" 
                            fill={cfPrimaryOriginStatus === 'healthy' ? 'var(--cf-svg-node-fill-origin)' : 'var(--cf-alert-yellow-bg)'} 
                            stroke={cfFailoverStep >= 3 ? '#ef4444' : cfActiveOrigin === 'primary' ? 'var(--cf-svg-node-stroke-origin)' : 'var(--cf-svg-node-stroke)'} 
                            strokeWidth={cfActiveOrigin === 'primary' || cfFailoverStep >= 3 ? 1.5 : 1} 
                          />
                          <text x="207.5" y="31" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="var(--color-text-secondary)">S3 Primary</text>
                          <text x="207.5" y="41" textAnchor="middle" fontSize="5.5" fontWeight="700" fill={cfFailoverStep >= 3 ? '#ef4444' : 'var(--cf-svg-text-origin)'}>
                            {cfPrimaryOriginStatus === 'healthy' ? '🟢 Virginia' : '🔴 OUTAGE 502'}
                          </text>
                        </g>

                        {/* Secondary S3 (Dublin) Cylinder */}
                        <g filter="url(#shadow-fail)">
                          <path d="M 180 72 A 27.5 7 0 0 0 235 72 L 235 84 A 27.5 7 0 0 1 180 84 Z" 
                            fill={cfActiveOrigin === 'secondary' ? 'var(--cf-svg-node-fill-client)' : 'var(--color-background-primary)'} 
                            stroke={cfActiveOrigin === 'secondary' ? 'var(--cf-svg-node-stroke-alb)' : 'var(--cf-svg-node-stroke)'} 
                            strokeWidth={cfActiveOrigin === 'secondary' ? 1.5 : 1} 
                          />
                          <ellipse cx="207.5" cy="72" rx="27.5" ry="7" 
                            fill={cfActiveOrigin === 'secondary' ? 'var(--cf-svg-node-fill-client)' : 'var(--color-background-primary)'} 
                            stroke={cfActiveOrigin === 'secondary' ? 'var(--cf-svg-node-stroke-alb)' : 'var(--cf-svg-node-stroke)'} 
                            strokeWidth={cfActiveOrigin === 'secondary' ? 1.5 : 1} 
                          />
                          <text x="207.5" y="83" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="var(--color-text-secondary)">S3 Backup</text>
                          <text x="207.5" y="93" textAnchor="middle" fontSize="5.5" fontWeight="700" fill={cfActiveOrigin === 'secondary' ? 'var(--cf-svg-text-alb)' : 'var(--color-text-tertiary)'}>🔵 Dublin (REC)</text>
                        </g>

                        {/* Routing Lines */}
                        {/* Client to Edge */}
                        <path d="M 40 55 L 80 55" id="f-path-cli-edge" fill="none" stroke="var(--cf-svg-node-stroke)" strokeWidth="1.5" />
                        
                        {/* Edge to Primary S3 */}
                        <path d="M 122 50 L 180 26" id="f-path-edge-pri" fill="none" stroke={cfFailoverStep === 3 ? '#fca5a5' : 'var(--cf-svg-node-stroke)'} strokeWidth="1.5" />
                        
                        {/* Edge to Secondary S3 */}
                        <path d="M 122 60 L 180 78" id="f-path-edge-sec" fill="none" stroke="var(--cf-svg-node-stroke)" strokeWidth="1.5" />

                        {/* Packet Animation Dots */}
                        {cfFailoverIsSimulating && (
                          <circle r="3.5" fill="#f59e0b">
                            <animateMotion 
                              dur="1.2s" 
                              repeatCount="indefinite" 
                              path={
                                cfFailoverStep === 1 ? "M 40 55 L 80 55" :
                                cfFailoverStep === 2 ? "M 122 50 L 180 26" :
                                cfFailoverStep === 3 ? "M 122 50 L 180 26" :
                                cfFailoverStep === 5 ? "M 122 60 L 180 78" : "M 40 55 L 80 55"
                              }
                            />
                          </circle>
                        )}

                        {/* Failover Shield status logo */}
                        {cfFailoverStep === 4 && (
                          <g>
                            <circle cx="150" cy="55" r="9" fill="var(--cf-alert-red-bg)" stroke="var(--cf-alert-red-text)" strokeWidth="1.5" />
                            <text x="150" y="55" textAnchor="middle" dominantBaseline="central" fontSize="8" fill="var(--cf-alert-red-text)" fontWeight="bold">⚠️</text>
                            <animate attributeName="opacity" values="0.2;1;0.2" dur="0.8s" repeatCount="indefinite" />
                          </g>
                        )}
                      </svg>
                    </div>

                    {/* Terminal Failover Logs */}
                    <div style={{ background: 'var(--cf-terminal-bg)', border: '1px solid var(--cf-terminal-border)', borderRadius: '6px', padding: '8px', minHeight: '90px', maxHeight: '120px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '9.5px', color: 'var(--cf-terminal-color)', lineHeight: '1.45' }}>
                      {cfFailoverLogs.map((logLine, logIdx) => (
                        <div key={logIdx} style={{ marginBottom: '3px' }}>
                          <span style={{ color: logLine.includes('✅') ? '#4ade80' : logLine.includes('⚠️') ? '#f87171' : logLine.includes('🔄') ? '#fbbf24' : '#cbd5e1' }}>
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
            <div className="cf-sec">{isAzure ? "Azure Front Door Anycast Acceleration & ExpressRoute Backbone" : isGcp ? "Google Anycast Global Load Balancing & Private Fiber Backbone" : "AWS Global Accelerator — Static Anycast & Network Backbone Optimization"}</div>
            <div className="cf-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                AWS Global Accelerator is a networking service that improves the availability and performance of your applications with local or global users. It operates at Layer 4 of the OSI model, directing dynamic TCP/UDP traffic over the highly optimized private AWS global network backbone.
              </div>

              {/* Concepts Deep-Dive matching .cf-hl-cyan & .cf-desc-mute */}
              <div className="cf-grid2" style={{ marginBottom: '16px' }}>
                <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--cf-svg-text-orange)' }}>Core Architecture Concepts</div>

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

                <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--cf-svg-text-origin)' }}>Traffic Control &amp; HA Concepts</div>

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
              <div style={{ border: '1.5px solid var(--cf-card-border)', borderRadius: '16px', padding: '16px', background: 'var(--color-background-primary)', marginBottom: '18px' }}>
                <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🚀</span> AWS Global Accelerator Architecture (L4 Anycast Static IP Routing)
                </div>

                <svg width="100%" viewBox="0 0 760 220" className="cf-svg-bg" style={{ borderRadius: '12px', border: '1.5px solid var(--cf-card-border)' }}>
                  <defs>
                    <linearGradient id="grad-aga-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fb923c" />
                      <stop offset="100%" stopColor="#ea580c" />
                    </linearGradient>
                    <linearGradient id="grad-aga-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#c084fc" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <linearGradient id="grad-aga-green" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="grad-aga-red" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f87171" />
                      <stop offset="100%" stopColor="#dc2626" />
                    </linearGradient>
                    <filter id="shadow-aga" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#475569" floodOpacity="0.1" />
                    </filter>
                  </defs>

                  {/* Column 1: Global Users */}
                  <rect x="15" y="25" width="150" height="175" rx="10" fill="var(--cf-card-bg)" stroke="var(--cf-card-border)" strokeWidth="1" filter="url(#shadow-aga)" />
                  <text x="90" y="42" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="var(--color-text-secondary)">🌍 Global Users</text>

                  <rect x="25" y="58" width="130" height="32" rx="6" fill="var(--cf-svg-node-fill-client)" stroke="var(--cf-svg-node-stroke-client)" strokeWidth="1" />
                  <text x="90" y="77" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--cf-svg-text-client)">US Client ➔ Anycast</text>

                  <rect x="25" y="102" width="130" height="32" rx="6" fill="var(--cf-svg-node-fill-client)" stroke="var(--cf-svg-node-stroke-client)" strokeWidth="1" />
                  <text x="90" y="121" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--cf-svg-text-client)">EU Client ➔ Anycast</text>

                  <rect x="25" y="146" width="130" height="32" rx="6" fill="var(--cf-svg-node-fill-client)" stroke="var(--cf-svg-node-stroke-client)" strokeWidth="1" />
                  <text x="90" y="165" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--cf-svg-text-client)">Asia Client ➔ Anycast</text>

                  {/* ==================== BGP ANYCAST POP BOUNDARY ==================== */}
                  <rect x="190" y="24" width="170" height="185" rx="8" fill="none" stroke="var(--cf-svg-text-orange)" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="198" y="36" fill="var(--cf-svg-text-orange)" fontSize="7.5" fontWeight="extrabold">BGP Anycast POP Boundary</text>

                  {/* Column 2: BGP Anycast POPs Ingestion */}
                  {/* Static IP Blocks */}
                  <g filter="url(#shadow-aga)">
                    <rect x="205" y="58" width="140" height="50" rx="6" fill="var(--cf-svg-node-fill-orange)" stroke="var(--cf-svg-node-stroke-orange)" strokeWidth="1" />
                    <text x="275" y="76" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="var(--cf-svg-node-text-orange)">Static IP #1</text>
                    <text x="275" y="92" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--cf-svg-text-orange)">1.2.3.4 (Anycast)</text>
                  </g>

                  <g filter="url(#shadow-aga)">
                    <rect x="205" y="128" width="140" height="50" rx="6" fill="var(--cf-svg-node-fill-orange)" stroke="var(--cf-svg-node-stroke-orange)" strokeWidth="1" />
                    <text x="275" y="146" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="var(--cf-svg-node-text-orange)">Static IP #2</text>
                    <text x="275" y="162" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--cf-svg-text-orange)">5.6.7.8 (Anycast)</text>
                  </g>

                  {/* ==================== AWS GLOBAL BACKBONE SHIELD ==================== */}
                  <rect x="375" y="24" width="170" height="185" rx="8" fill="none" stroke="var(--cf-svg-text-edge)" strokeWidth="1.5" strokeDasharray="4,2" />
                  <text x="383" y="36" fill="var(--cf-svg-text-edge)" fontSize="7.5" fontWeight="extrabold">AWS Global Network Backbone Shield</text>

                  {/* Column 3: Private AWS Backbone */}
                  {/* Thick glowing private fiber bus */}
                  <path d="M 460 55 L 460 180" id="aga-backbone" fill="none" stroke="url(#grad-aga-purple)" strokeWidth="6" strokeLinecap="round" />
                  <text x="470" y="118" textAnchor="start" fontSize="8.5" fill="var(--cf-svg-text-edge)" fontWeight="700">Congestion-Free</text>
                  <text x="470" y="130" textAnchor="start" fontSize="7.5" fill="var(--cf-svg-text-edge)" fontWeight="600">Transit Backbone</text>

                  {/* ==================== US EAST REGION BOUNDARY ==================== */}
                  <rect x="565" y="24" width="180" height="90" rx="6" fill="none" stroke="var(--cf-svg-text-origin)" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="573" y="36" fill="var(--cf-svg-text-origin)" fontSize="7" fontWeight="bold">US-East Region (us-east-1)</text>

                  {/* US East Endpoint Group */}
                  <g filter="url(#shadow-aga)">
                    <rect x="575" y="48" width="160" height="50" rx="6" fill="var(--cf-svg-node-fill-origin)" stroke="var(--cf-svg-node-stroke-origin)" strokeWidth="1.5" />
                    <text x="655" y="68" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="var(--cf-svg-text-origin)">us-east-1 Endpoint</text>
                    <rect x="585" y="76" width="140" height="15" rx="3" fill="var(--cf-svg-node-fill-origin)" stroke="var(--cf-svg-node-stroke-origin)" strokeWidth="0.5" />
                    <text x="655" y="86" textAnchor="middle" fontSize="7" fill="var(--cf-svg-text-origin)" fontWeight="700">ALB ACTIVE 🟢 DIAL 100%</text>
                  </g>

                  {/* ==================== EU CENTRAL REGION BOUNDARY ==================== */}
                  <rect x="565" y="118" width="180" height="90" rx="6" fill="none" stroke="var(--cf-alert-red-text)" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="573" y="130" fill="var(--cf-alert-red-text)" fontSize="7" fontWeight="bold">EU-Central Region (eu-central-1)</text>

                  {/* EU Central Endpoint Group (Unhealthy - Redirected) */}
                  <g filter="url(#shadow-aga)">
                    <rect x="575" y="142" width="160" height="50" rx="6" fill="var(--cf-alert-red-bg)" stroke="var(--cf-alert-red-border)" strokeWidth="1.5" />
                    <text x="655" y="162" textAnchor="middle" fontSize="9.5" fontWeight="800" fill="var(--cf-alert-red-text)">eu-central-1 Endpoint</text>
                    <rect x="585" y="170" width="140" height="15" rx="3" fill="var(--cf-alert-red-bg)" stroke="var(--cf-alert-red-border)" strokeWidth="0.5" />
                    <text x="655" y="180" textAnchor="middle" fontSize="7" fill="var(--cf-alert-red-text)" fontWeight="700">DEGRADED ❌ FAILOVER ACTIVE</text>
                  </g>

                  {/* Connectors */}
                  {/* Global Users to Ingestion POPs */}
                  <path d="M 155 74 L 205 74" fill="none" stroke="url(#grad-aga-orange)" strokeWidth="1.5" />
                  <path d="M 155 118 L 205 90" fill="none" stroke="url(#grad-aga-orange)" strokeWidth="1.2" />
                  <path d="M 155 162 L 205 148" fill="none" stroke="url(#grad-aga-orange)" strokeWidth="1.2" />

                  {/* Ingestion POPs to AWS Private Backbone */}
                  <path d="M 345 83 L 390 100" fill="none" stroke="var(--cf-svg-text-edge)" strokeWidth="1.5" />
                  <path d="M 345 153 L 390 120" fill="none" stroke="var(--cf-svg-text-edge)" strokeWidth="1.5" />

                  {/* Backbone to Endpoints */}
                  {/* Normal routing from backbone to healthy US ALB */}
                  <path d="M 530 90 L 575 73" fill="none" stroke="var(--cf-svg-node-stroke-origin)" strokeWidth="2" />
                  
                  {/* Rerouted path away from failed EU Central ALB to US ALB */}
                  <path d="M 530 140 L 575 82" id="path-failover-aga" fill="none" stroke="var(--cf-alert-red-text)" strokeWidth="1.5" strokeDasharray="3,3" />
                  <text x="552.5" y="112" textAnchor="middle" fontSize="7" fill="var(--cf-alert-red-text)" fontWeight="800">Sub-10s Dynamic Shift</text>

                  {/* Dynamic packets streaming along the backbone */}
                  <circle r="3.5" fill="#f59e0b">
                    <animateMotion dur="2s" repeatCount="indefinite">
                      <mpath href="#aga-backbone" />
                    </animateMotion>
                  </circle>
                  <circle r="3.5" fill="#a855f7">
                    <animateMotion dur="1.8s" repeatCount="indefinite">
                      <mpath href="#path-failover-aga" />
                    </animateMotion>
                  </circle>
                </svg>
              </div>

              {/* AWS Global Accelerator vs. Amazon CloudFront Comparison */}
              <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px', marginTop: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: 'var(--cf-svg-text-edge)' }}>
                  Architectural Matrix: AWS Global Accelerator vs. Amazon CloudFront
                </div>

                <div style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                  While both services ingest traffic at the closest geographic edge location and route it over the private AWS backbone, their fundamental operations and goals are vastly different.
                </div>

                <table className="cf-table">
                  <thead>
                    <tr>
                      <th>Architectural Dimension</th>
                      <th>🚀 {isAzure ? 'Azure Front Door Anycast' : isGcp ? 'Google Anycast GLB' : 'AWS Global Accelerator (AGA)'}</th>
                      <th>⚡ {isAzure ? 'Azure CDN' : isGcp ? 'Google Cloud CDN' : 'Amazon CloudFront (CDN)'}</th>
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
            <div className="cf-sec">{isAzure ? "Azure Private Link & Entra ID, WAF Geo-Restrictions, and Cache Purges" : isGcp ? "Signed URLs / Signed Cookies, Cloud Armor Geo-Blocking, and Cache Purges" : "Origin Access Control (OAC), Geo-Restrictions, and Cache Invalidations"}</div>
            <div className="cf-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                Secure content distribution relies on strict network boundaries and manual cache invalidation overrides. Here is how you protect your assets and maintain control over your global storage caches.
              </div>

              <div className="cf-grid3" style={{ marginBottom: '14px' }}>
                {/* OAC / Security Origin */}
                <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--cf-svg-text-origin)' }}>
                    {isAzure ? "Azure Private Link & Entra ID" : isGcp ? "Signed URLs & Signed Cookies" : "Origin Access Control (OAC)"}
                  </div>
                  <div style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--color-text-secondary)' }}>
                    {isAzure 
                      ? "Azure Front Door connects directly to Blob Storage and App Services over Private Endpoints with Managed Identities." 
                      : isGcp 
                      ? "Cloud CDN validates HMAC-SHA1 cryptographic signatures at edge PoPs before delivering media files." 
                      : "OAC is the modern AWS security standard that signs requests with SigV4 before querying private S3 buckets."}
                  </div>
                  <ul style={{ paddingLeft: '14px', margin: '8px 0 0 0', fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                    <li>{isAzure ? "Supports Microsoft Entra ID authentication locks." : isGcp ? "Supports Service Account IAM and HMAC keys." : "Supports AWS Signature Version 4 (SigV4) signing."}</li>
                    <li>{isAzure ? "Integrates with Key Vault CMK encryption." : isGcp ? "Integrates with Cloud KMS CMEK encryption." : "Integrates with KMS CMKs (Customer Managed Keys)."}</li>
                    <li>Secures upload (PUT) and download (GET) pipelines, shielding static databases from web exposure.</li>
                  </ul>
                </div>

                {/* Geo Restriction */}
                <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--cf-svg-text-orange)' }}>
                    {isAzure ? "Front Door WAF Geo-Filtering" : isGcp ? "Cloud Armor Geo-Blocking" : "Geo-Restriction (Geoblocking)"}
                  </div>
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
                <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--cf-svg-text-edge)' }}>
                    {isAzure ? "Front Door Cache Purge" : isGcp ? "Cloud CDN Cache Invalidations" : "Cache Invalidation Pipelines"}
                  </div>
                  <div style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--color-text-secondary)' }}>
                    What happens if a developer deploys an updated website, but the CDN continues serving cached old files?
                  </div>
                  <ul style={{ paddingLeft: '14px', margin: '8px 0 0 0', fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.5' }}>
                    <li>Submit a <strong>Purge / Invalidation Request</strong> containing file paths (e.g. <code>/static/bundle.js</code>) or wildcards (<code>/*</code>).</li>
                    <li>This propagates a delete signal globally across all global edge PoPs in seconds.</li>
                    <li>The next user request is guaranteed a `cache miss`, forcing a fresh fetch from the origin.</li>
                  </ul>
                </div>
              </div>

              {/* Visualizing Invalidation and Geo block in Simulator Info */}
              <div style={{ background: 'var(--cf-alert-blue-bg)', border: '1.5px solid var(--cf-alert-blue-border)', borderRadius: '8px', padding: '12px', fontSize: '12px', lineHeight: '1.5' }}>
                <div style={{ fontWeight: 600, color: 'var(--cf-alert-blue-text)', marginBottom: '4px' }}>💡 Interactive Testing Tip:</div>
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
                  <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--cf-svg-text-edge)' }}>Select Script Template Policy:</div>
                    
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
                    <div style={{ marginTop: '12px', borderTop: '0.5px solid var(--cf-border-primary)', paddingTop: '8px', fontSize: '11px', lineHeight: '1.45', color: 'var(--color-text-secondary)' }}>
                      <div><strong>Engine:</strong> <span style={{ color: 'var(--cf-svg-text-client)', fontWeight: 600 }}>{scriptTemplates[cfSelectedTemplate].type}</span></div>
                      <div><strong>Stage:</strong> <span style={{ color: 'var(--cf-svg-text-edge)', fontWeight: 600 }}>{scriptTemplates[cfSelectedTemplate].stage}</span></div>
                      <div><strong>Performance:</strong> <span style={{ color: 'var(--cf-svg-text-origin)', fontWeight: 600 }}>{scriptTemplates[cfSelectedTemplate].latency}</span></div>
                      <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', fontSize: '10px' }}>
                        {scriptTemplates[cfSelectedTemplate].description}
                      </p>
                    </div>
                  </div>

                  {/* Editor Mockup */}
                  <div style={{ background: 'var(--cf-terminal-bg)', border: '1.5px solid var(--cf-terminal-border)', borderRadius: '8px', padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1.5px solid var(--cf-terminal-border)', paddingBottom: '6px' }}>
                      <span style={{ fontSize: '10.5px', fontFamily: 'monospace', color: 'var(--color-text-tertiary)' }}>📄 handler.js (Read-only Editor)</span>
                      <span className="cf-badge cf-binfo" style={{ padding: '2px 6px', fontSize: '8px' }}>{scriptTemplates[cfSelectedTemplate].language}</span>
                    </div>
                    <pre style={{ margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: '10.5px', color: 'var(--cf-terminal-color)', flex: 1, whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                      {scriptTemplates[cfSelectedTemplate].code}
                    </pre>
                  </div>
                </div>

                {/* Right Column: Execution Terminal and Latency Indicator */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>Edge Execution Console</div>
                    
                    <button 
                      className="cf-btn cf-primary" 
                      onClick={handleEdgeScriptExecution}
                      disabled={cfEdgeTesting}
                      style={{ width: '100%', padding: '8px', fontWeight: 600, marginBottom: '10px' }}
                    >
                      {cfEdgeTesting ? '⚡ Executing script globally...' : '⚡ Execute Script at Edge'}
                    </button>

                    {/* Micro-animations and phase indicator */}
                    <div style={{ background: 'var(--color-background-primary)', border: '1.5px solid var(--cf-card-border)', borderRadius: '12px', padding: '12px', fontSize: '11px', marginBottom: '10px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>⚡ Edge Interception Stage Mapping:</div>
                      
                      {/* Brand New Interception Events SVG */}
                      <svg width="100%" height="60" viewBox="0 0 320 60" className="cf-svg-bg" style={{ borderRadius: '8px', border: '1.5px solid var(--cf-card-border)', marginBottom: '10px' }}>
                        {/* ==================== EDGE COMPUTING EXECUTION BOUNDARY ==================== */}
                        <rect x="5" y="5" width="310" height="50" rx="4" fill="none" stroke="var(--cf-svg-text-edge)" strokeWidth="1" strokeDasharray="3,2" />
                        <text x="12" y="14" fill="var(--cf-svg-text-edge)" fontSize="5" fontWeight="bold">Edge Computing Execution Boundary</text>

                        {/* Flow Conduit */}
                        <line x1="20" y1="34" x2="300" y2="34" stroke="var(--cf-svg-node-stroke)" strokeWidth="2.5" />
                        <line x1="20" y1="34" x2="300" y2="34" stroke="var(--cf-svg-text-edge)" strokeWidth="1.5" strokeDasharray="3,3" />

                        {/* Viewer Request Node (Stage 1) */}
                        <circle cx="40" cy="34" r="7" 
                          fill={cfSelectedTemplate === 'rewrite' ? 'var(--cf-svg-text-edge)' : 'var(--color-background-primary)'} 
                          stroke={cfSelectedTemplate === 'rewrite' ? 'var(--cf-svg-text-edge)' : 'var(--cf-svg-node-stroke)'} 
                          strokeWidth="2" 
                        />
                        {cfSelectedTemplate === 'rewrite' && (
                          <circle cx="40" cy="34" r="11" fill="none" stroke="var(--cf-svg-text-edge)" strokeWidth="1.5">
                            <animate attributeName="r" values="7;14;7" dur="1.5s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <text x="40" y="24" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={cfSelectedTemplate === 'rewrite' ? 'var(--cf-svg-text-edge)' : 'var(--color-text-tertiary)'}>Viewer Req</text>

                        {/* Origin Request Node (Stage 2) */}
                        <circle cx="120" cy="34" r="7" 
                          fill={cfSelectedTemplate === 'ab' ? 'var(--cf-svg-text-alb)' : 'var(--color-background-primary)'} 
                          stroke={cfSelectedTemplate === 'ab' ? 'var(--cf-svg-text-alb)' : 'var(--cf-svg-node-stroke)'} 
                          strokeWidth="2" 
                        />
                        {cfSelectedTemplate === 'ab' && (
                          <circle cx="120" cy="34" r="11" fill="none" stroke="var(--cf-svg-text-alb)" strokeWidth="1.5">
                            <animate attributeName="r" values="7;14;7" dur="1.5s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <text x="120" y="24" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={cfSelectedTemplate === 'ab' ? 'var(--cf-svg-text-alb)' : 'var(--color-text-tertiary)'}>Origin Req</text>

                        {/* Origin Response Node (Stage 3) */}
                        <circle cx="200" cy="34" r="7" fill="var(--color-background-primary)" stroke="var(--cf-svg-node-stroke)" strokeWidth="2" />
                        <text x="200" y="24" textAnchor="middle" fontSize="6.5" fontWeight="700" fill="var(--color-text-tertiary)">Origin Resp</text>

                        {/* Viewer Response Node (Stage 4) */}
                        <circle cx="280" cy="34" r="7" 
                          fill={cfSelectedTemplate === 'hsts' ? 'var(--cf-svg-text-origin)' : 'var(--color-background-primary)'} 
                          stroke={cfSelectedTemplate === 'hsts' ? 'var(--cf-svg-text-origin)' : 'var(--cf-svg-node-stroke)'} 
                          strokeWidth="2" 
                        />
                        {cfSelectedTemplate === 'hsts' && (
                          <circle cx="280" cy="34" r="11" fill="none" stroke="var(--cf-svg-text-origin)" strokeWidth="1.5">
                            <animate attributeName="r" values="7;14;7" dur="1.5s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0;1" dur="1.5s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <text x="280" y="24" textAnchor="middle" fontSize="6.5" fontWeight="700" fill={cfSelectedTemplate === 'hsts' ? 'var(--cf-svg-text-origin)' : 'var(--color-text-tertiary)'}>Viewer Resp</text>
                      </svg>

                      <div style={{ fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Pipeline Progress Stages:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ color: cfEdgeStep >= 1 ? 'var(--cf-svg-text-origin)' : 'var(--color-text-tertiary)', fontWeight: cfEdgeStep === 1 ? 'bold' : 'normal' }}>
                          {cfEdgeStep >= 1 ? '🟢' : '⚪'} Stage 1: Request Interception ({scriptTemplates[cfSelectedTemplate].stage})
                        </div>
                        <div style={{ color: cfEdgeStep >= 2 ? 'var(--cf-svg-text-origin)' : 'var(--color-text-tertiary)', fontWeight: cfEdgeStep === 2 ? 'bold' : 'normal' }}>
                          {cfEdgeStep >= 2 ? '🟢' : '⚪'} Stage 2: Sandbox Isolate compilation
                        </div>
                        <div style={{ color: cfEdgeStep >= 3 ? 'var(--cf-svg-text-origin)' : 'var(--color-text-tertiary)', fontWeight: cfEdgeStep === 3 ? 'bold' : 'normal' }}>
                          {cfEdgeStep >= 3 ? '🟢' : '⚪'} Stage 3: Request/Response Header Mutation
                        </div>
                        <div style={{ color: cfEdgeStep >= 4 ? 'var(--cf-svg-text-origin)' : 'var(--color-text-tertiary)', fontWeight: cfEdgeStep === 4 ? 'bold' : 'normal' }}>
                          {cfEdgeStep >= 4 ? '🟢' : '⚪'} Stage 4: Execution successfully finished!
                        </div>
                      </div>
                    </div>

                    {/* Latency Gauges */}
                    {cfEdgeLatency !== null && (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                          <span>Dynamic Latency Overhead:</span>
                          <span style={{ color: cfEdgeLatency === 1 ? 'var(--cf-svg-text-origin)' : 'var(--cf-alert-red-text)' }}>
                            {cfEdgeLatency} ms ({cfEdgeLatency === 1 ? 'Ultra optimized V8 isolate' : 'Node Lambda container'})
                          </span>
                        </div>
                        
                        {/* Visual progress bar */}
                        <div style={{ width: '100%', height: '8px', background: 'var(--cf-border-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div 
                            style={{ 
                              height: '100%', 
                              width: cfEdgeLatency === 1 ? '4%' : '90%', 
                              background: cfEdgeLatency === 1 ? 'var(--cf-svg-text-origin)' : 'var(--cf-alert-red-text)',
                              transition: 'width 0.4s ease-out'
                            }} 
                          />
                        </div>
                        
                        <div style={{ fontSize: '9.5px', color: 'var(--color-text-tertiary)', marginTop: '4px', fontStyle: 'italic' }}>
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
                    <div style={{ background: 'var(--cf-terminal-bg)', borderRadius: '6px', padding: '8px', height: '80px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '9.5px', color: 'var(--cf-terminal-color)', lineHeight: '1.4' }}>
                      {cfEdgeLogs.map((logLine, logIdx) => (
                        <div key={logIdx} style={{ marginBottom: '3px', color: logLine.includes('✅') ? 'var(--cf-svg-text-origin)' : 'var(--cf-terminal-color)' }}>
                          {logLine}
                        </div>
                      ))}
                    </div>

                    {/* Header Diff side-by-side */}
                    {cfEdgeStep >= 3 && (
                      <div className="cf-grid2" style={{ gap: '8px', flex: 1 }}>
                        <div style={{ background: 'var(--color-background-secondary)', border: '1.5px solid var(--cf-border-primary)', borderRadius: '6px', padding: '6px', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--cf-alert-red-text)', marginBottom: '4px' }}>Inbound Header:</span>
                          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '9px', color: 'var(--color-text-secondary)', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                            {scriptTemplates[cfSelectedTemplate].inputHeaders}
                          </pre>
                        </div>
                        <div style={{ background: 'var(--cf-svg-node-fill-origin)', border: '1.5px solid var(--cf-svg-node-stroke-origin)', borderRadius: '6px', padding: '6px', display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--cf-svg-text-origin)', marginBottom: '4px' }}>Modified Header (At Edge):</span>
                          <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: '9px', color: 'var(--cf-svg-text-origin)', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
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
            <div className="cf-card" style={{ display: 'flex', gap: '15px', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', background: 'var(--cf-alert-yellow-bg)', borderColor: 'var(--cf-alert-yellow-border)' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--cf-alert-yellow-text)' }}>⚡ CDN Cache State Controller:</span>
                <span style={{ fontSize: '11px', color: 'var(--cf-alert-yellow-text)', marginLeft: '6px' }}>
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
                  style={{ width: '120px', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', border: '1.5px solid var(--cf-alert-yellow-border)' }} 
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
                  <svg width="100%" height="200" viewBox="0 0 480 200" className="cf-svg-bg" style={{ borderRadius: '12px', border: '1.5px solid var(--cf-card-border)' }}>
                    <defs>
                      <linearGradient id="grad-edge-3d" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                      <linearGradient id="grad-rec-3d" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#be185d" />
                      </linearGradient>
                      <filter id="shadow-sim" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#475569" floodOpacity="0.1" />
                      </filter>
                    </defs>

                    {/* ==================== PUBLIC INGRESS REGIONS BOUNDARY ==================== */}
                    <rect x="8" y="12" width="64" height="176" rx="8" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.2" strokeDasharray="4,2" />
                    <text x="14" y="22" fill="var(--color-text-tertiary)" fontSize="5" fontWeight="bold">Ingress Regions</text>

                    {/* Node US Client Card */}
                    <g filter="url(#shadow-sim)">
                      <rect x="15" y="26" width="50" height="34" rx="4" fill={clientRegion === 'us' ? 'var(--cf-svg-node-fill-client)' : 'var(--color-background-primary)'} stroke={clientRegion === 'us' ? 'var(--cf-svg-node-stroke-client)' : 'var(--cf-svg-node-stroke)'} strokeWidth={clientRegion === 'us' ? 1.5 : 1} />
                      <text x="40" y="42" textAnchor="middle" fontSize="8" fontWeight="800" fill={clientRegion === 'us' ? 'var(--cf-svg-text-client)' : 'var(--color-text-secondary)'}>US East</text>
                      <text x="40" y="51" textAnchor="middle" fontSize="6" fill="var(--color-text-tertiary)">New York</text>
                    </g>

                    {/* Node EU Client Card */}
                    <g filter="url(#shadow-sim)">
                      <rect x="15" y="82" width="50" height="34" rx="4" fill={clientRegion === 'eu' ? 'var(--cf-svg-node-fill-client)' : 'var(--color-background-primary)'} stroke={clientRegion === 'eu' ? 'var(--cf-svg-node-stroke-client)' : 'var(--cf-svg-node-stroke)'} strokeWidth={clientRegion === 'eu' ? 1.5 : 1} />
                      <text x="40" y="98" textAnchor="middle" fontSize="8" fontWeight="800" fill={clientRegion === 'eu' ? 'var(--cf-svg-text-client)' : 'var(--color-text-secondary)'}>EU West</text>
                      <text x="40" y="107" textAnchor="middle" fontSize="6" fill="var(--color-text-tertiary)">Frankfurt</text>
                    </g>

                    {/* Node Asia Client Card */}
                    <g filter="url(#shadow-sim)">
                      <rect x="15" y="138" width="50" height="34" rx="4" fill={clientRegion === 'asia' ? 'var(--cf-svg-node-fill-client)' : 'var(--color-background-primary)'} stroke={clientRegion === 'asia' ? 'var(--cf-svg-node-stroke-client)' : 'var(--cf-svg-node-stroke)'} strokeWidth={clientRegion === 'asia' ? 1.5 : 1} />
                      <text x="40" y="154" textAnchor="middle" fontSize="8" fontWeight="800" fill={clientRegion === 'asia' ? 'var(--cf-svg-text-client)' : 'var(--color-text-secondary)'}>AP East</text>
                      <text x="40" y="163" textAnchor="middle" fontSize="6" fill="var(--color-text-tertiary)">Tokyo</text>
                    </g>

                    {/* Anycast DNS Gateway */}
                    <g filter="url(#shadow-sim)">
                      <rect x="105" y="77" width="45" height="46" rx="6" fill="var(--color-background-primary)" stroke="var(--cf-svg-node-stroke)" strokeWidth="1" />
                      <text x="127.5" y="94" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--color-text-secondary)">Anycast</text>
                      <text x="127.5" y="107" textAnchor="middle" fontSize="8.5" fontWeight="800" fill="var(--color-text-secondary)">DNS</text>
                      <circle cx="127.5" cy="115" r="2.5" fill="var(--cf-svg-text-client)" />
                    </g>

                    {/* ==================== CLOUDFRONT EDGE POP CACHING BOUNDARY ==================== */}
                    <rect x="180" y="32" width="80" height="136" rx="8" fill="none" stroke="var(--cf-svg-text-edge)" strokeWidth="1.5" strokeDasharray="4,2" />
                    <text x="188" y="44" fill="var(--cf-svg-text-edge)" fontSize="5.5" fontWeight="extrabold">CloudFront Edge POP</text>

                    {/* Edge Server Location */}
                    <g filter="url(#shadow-sim)">
                      <rect x="190" y="70" width="60" height="60" rx="8" fill={simStep >= 3 ? 'var(--cf-svg-node-fill-edge)' : 'var(--color-background-primary)'} stroke={simStep === 5 ? 'var(--cf-alert-red-text)' : simStep >= 3 ? 'var(--cf-svg-text-edge)' : 'var(--cf-svg-node-stroke)'} strokeWidth={simStep === 5 || simStep >= 3 ? 2 : 1} />
                      <text x="220" y="87" textAnchor="middle" fontSize="9.5" fontWeight="800" fill={simStep >= 3 ? 'var(--cf-svg-text-edge)' : 'var(--color-text-secondary)'}>Edge PoP</text>
                      
                      <g transform="translate(198, 97)">
                        <rect x="0" y="0" width="44" height="24" rx="2" fill="var(--color-background-primary)" stroke="var(--cf-svg-node-stroke-edge)" strokeWidth="0.5" />
                        {simStep === 5 ? (
                          <text x="22" y="15" textAnchor="middle" fontSize="8" fill="var(--cf-alert-red-text)" fontWeight="800">BLOCKED</text>
                        ) : simStep >= 7 && simResults?.cacheHeader.includes('Hit') ? (
                          <text x="22" y="15" textAnchor="middle" fontSize="8.5" fill="var(--cf-svg-text-origin)" fontWeight="800">⭐ HIT</text>
                        ) : simStep >= 3 ? (
                          <g>
                            <circle cx="12" cy="12" r="2.5" fill="var(--cf-svg-text-origin)"><animate attributeName="opacity" values="0.2;1;0.2" dur="0.6s" repeatCount="indefinite" /></circle>
                            <circle cx="22" cy="12" r="2.5" fill="var(--cf-svg-text-origin)"><animate attributeName="opacity" values="1;0.2;1" dur="0.6s" repeatCount="indefinite" /></circle>
                            <circle cx="32" cy="12" r="2.5" fill="var(--cf-svg-text-origin)"><animate attributeName="opacity" values="0.2;1;0.2" dur="0.6s" repeatCount="indefinite" /></circle>
                          </g>
                        ) : (
                          <text x="22" y="15" textAnchor="middle" fontSize="7.5" fill="var(--color-text-tertiary)">Idle</text>
                        )}
                      </g>
                    </g>

                    {/* ==================== REGIONAL CACHE SHIELD BOUNDARY ==================== */}
                    <rect x="280" y="32" width="80" height="136" rx="8" fill="none" stroke="var(--cf-svg-text-rec)" strokeWidth="1.5" strokeDasharray="4,2" />
                    <text x="288" y="44" fill="var(--cf-svg-text-rec)" fontSize="5.5" fontWeight="extrabold">Regional Cache Shield</text>

                    {/* Regional Edge Cache (REC) */}
                    <g filter="url(#shadow-sim)">
                      <rect x="290" y="70" width="60" height="60" rx="8" fill={simStep >= 3.5 ? 'var(--cf-svg-node-fill-rec)' : 'var(--color-background-primary)'} stroke={simStep >= 3.5 ? 'var(--cf-svg-text-rec)' : 'var(--cf-svg-node-stroke)'} strokeWidth={simStep >= 3.5 ? 1.5 : 1} strokeDasharray={useOriginShield ? '' : '3,3'} />
                      <text x="320" y="87" textAnchor="middle" fontSize="9.5" fontWeight="800" fill={simStep >= 3.5 ? 'var(--cf-svg-text-rec)' : 'var(--color-text-secondary)'}>REC Buffer</text>
                      
                      <g transform="translate(298, 97)">
                        <rect x="0" y="0" width="44" height="24" rx="2" fill="var(--color-background-primary)" stroke="var(--cf-svg-node-stroke-rec)" strokeWidth="0.5" />
                        {simStep >= 7 && simResults?.cacheHeader.includes('REC Hit') ? (
                          <text x="22" y="15" textAnchor="middle" fontSize="8.5" fill="var(--cf-svg-text-rec)" fontWeight="800">⭐ REC HIT</text>
                        ) : simStep >= 3.5 ? (
                          <g>
                            <line x1="8" y1="12" x2="36" y2="12" stroke="var(--cf-svg-text-rec)" strokeWidth="1.5" strokeDasharray="3,2" />
                            <animate attributeName="opacity" values="0.4;1;0.4" dur="1s" repeatCount="indefinite" />
                          </g>
                        ) : (
                          <text x="22" y="15" textAnchor="middle" fontSize="7.5" fill="var(--color-text-tertiary)">Idle</text>
                        )}
                      </g>
                    </g>

                    {/* ==================== SECURE ORIGIN GROUP BOUNDARY ==================== */}
                    <rect x="375" y="32" width="95" height="136" rx="8" fill="none" stroke="var(--cf-svg-text-alb)" strokeWidth="1.5" strokeDasharray="6,4" />
                    <text x="383" y="44" fill="var(--cf-svg-text-alb)" fontSize="5.5" fontWeight="extrabold">Secure Origin Group</text>

                    {/* Origin Server Cylinder */}
                    <g filter="url(#shadow-sim)">
                      <path d="M 385 82 A 27.5 7 0 0 0 440 82 L 440 120 A 27.5 7 0 0 1 385 120 Z" 
                        fill={simStep >= 4 ? 'var(--cf-svg-node-fill-origin)' : 'var(--color-background-primary)'} 
                        stroke={simStep >= 4 ? 'var(--cf-svg-node-stroke-origin)' : 'var(--cf-svg-node-stroke)'} 
                        strokeWidth={simStep >= 4 ? 2 : 1} 
                      />
                      <ellipse cx="412.5" cy="82" rx="27.5" ry="7" 
                        fill={simStep >= 4 ? 'var(--cf-svg-node-fill-origin)' : 'var(--color-background-primary)'} 
                        stroke={simStep >= 4 ? 'var(--cf-svg-node-stroke-origin)' : 'var(--cf-svg-node-stroke)'} 
                        strokeWidth={simStep >= 4 ? 2 : 1} 
                      />
                      <text x="412.5" y="99" textAnchor="middle" fontSize="9.5" fontWeight="800" fill={simStep >= 4 ? 'var(--cf-svg-text-origin)' : 'var(--color-text-secondary)'}>Origin</text>
                      <text x="412.5" y="112" textAnchor="middle" fontSize="7.5" fontWeight="700" fill={simStep >= 4 ? 'var(--cf-svg-text-origin)' : 'var(--color-text-tertiary)'}>
                        {originType === 's3' ? '🪣 private-s3' : '⚙️ app-alb'}
                      </text>
                    </g>

                    {/* Conduit Trace Lines */}
                    {/* US Client to DNS */}
                    <path d={clientRegion === 'us' ? "M 65 42 L 105 100" : "M 65 42 L 105 100"} fill="none" stroke={clientRegion === 'us' && simStep >= 1 ? 'var(--cf-svg-text-alb)' : 'var(--cf-border-primary)'} strokeWidth={clientRegion === 'us' && simStep >= 1 ? 2.5 : 1.5} />
                    
                    {/* EU Client to DNS */}
                    <path d="M 65 100 L 105 100" fill="none" stroke={clientRegion === 'eu' && simStep >= 1 ? 'var(--cf-svg-text-alb)' : 'var(--cf-border-primary)'} strokeWidth={clientRegion === 'eu' && simStep >= 1 ? 2.5 : 1.5} />
                    
                    {/* ASIA Client to DNS */}
                    <path d={clientRegion === 'asia' ? "M 65 156 L 105 100" : "M 65 156 L 105 100"} fill="none" stroke={clientRegion === 'asia' && simStep >= 1 ? 'var(--cf-svg-text-alb)' : 'var(--cf-border-primary)'} strokeWidth={clientRegion === 'asia' && simStep >= 1 ? 2.5 : 1.5} />

                    {/* DNS to Edge */}
                    <path d="M 150 100 L 190 100" fill="none" stroke={simStep >= 2 ? (simStep === 5 ? 'var(--cf-alert-red-text)' : 'var(--cf-svg-text-edge)') : 'var(--cf-border-primary)'} strokeWidth={2.5} />

                    {/* Edge to REC */}
                    <path d="M 250 100 L 290 100" fill="none" stroke={simStep >= 3.5 ? 'var(--cf-svg-text-rec)' : 'var(--cf-border-primary)'} strokeWidth={2} strokeDasharray={useOriginShield ? '' : '3,3'} />

                    {/* REC to Origin */}
                    <path d="M 350 100 L 385 100" fill="none" stroke={simStep >= 4 ? 'var(--cf-svg-node-stroke-origin)' : 'var(--cf-border-primary)'} strokeWidth={2.5} />

                    {/* Stateful Packet Animations */}
                    {isSimulating && (
                      <circle r="4.5" fill="#f59e0b">
                        <animateMotion 
                          dur="1.4s" 
                          repeatCount="indefinite" 
                          path={
                            simStep === 1 ? (clientRegion === 'us' ? 'M 65 42 L 105 100' : clientRegion === 'eu' ? 'M 65 100 L 105 100' : 'M 65 156 L 105 100') :
                            simStep === 2 ? 'M 150 100 L 190 100' :
                            simStep === 3 ? 'M 190 100 L 250 100' :
                            simStep === 3.5 ? 'M 250 100 L 290 100' :
                            simStep === 4 ? 'M 290 100 L 385 100' : 'M 190 100 L 250 100'
                          } 
                        />
                      </circle>
                    )}

                    {/* Geo-Blocked Firewall Shield Burst */}
                    {simStep === 5 && (
                      <g transform="translate(170, 70)">
                        <polygon points="0,0 20,-10 40,0 30,30 20,40 10,30" fill="var(--cf-alert-red-bg)" stroke="var(--cf-alert-red-text)" strokeWidth="2">
                          <animate attributeName="opacity" values="0.3;1;0.3" dur="0.8s" repeatCount="indefinite" />
                        </polygon>
                        <text x="20" y="22" textAnchor="middle" fontSize="10" fill="var(--cf-alert-red-text)" fontWeight="bold">🛡️</text>
                      </g>
                    )}
                  </svg>

                  {/* Latency meter indicator */}
                  {simResults && (
                    <div style={{ width: '100%', marginTop: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}>
                        <span>Trace Latency Gauge:</span>
                        <span style={{ color: simResults.latency <= 15 ? 'var(--cf-svg-text-origin)' : simResults.latency <= 50 ? 'var(--cf-svg-text-edge)' : 'var(--cf-svg-text-orange)' }}>
                          {simResults.latency} ms ({simResults.latency <= 15 ? 'Ultra Fast' : simResults.latency <= 50 ? 'Optimized' : 'Origin Transit'})
                        </span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'var(--cf-border-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            height: '100%', 
                            width: `${Math.min((simResults.latency / 250) * 100, 100)}%`, 
                            background: simResults.latency <= 15 ? 'var(--cf-svg-text-origin)' : simResults.latency <= 50 ? 'var(--cf-svg-text-edge)' : 'var(--cf-svg-text-orange)',
                            transition: 'width 0.4s ease-out'
                          }} 
                        />
                      </div>
                    </div>
                  )}

                  {/* Simulator Results Box */}
                  {simResults && (
                    <div style={{ width: '100%', marginTop: '10px', border: '0.5px solid var(--cf-border-secondary)', borderRadius: '6px', padding: '10px', background: 'var(--color-background-secondary)' }}>
                      <div style={{ fontWeight: 600, fontSize: '11px', color: 'var(--cf-svg-text-edge)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        CDN Header Analysis Console
                      </div>
                      <div className="cf-grid2" style={{ gap: '6px', fontFamily: 'monospace', fontSize: '10px' }}>
                        <div>HTTP Status: <b style={{ color: simResults.status >= 400 ? 'var(--cf-alert-red-text)' : 'var(--cf-svg-text-origin)' }}>{simResults.status}</b></div>
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
                  <span style={{ color: 'var(--color-text-tertiary)', marginRight: '6px' }}>[{log.timestamp}]</span>
                  <span style={{ 
                    color: log.type === 'success' ? 'var(--cf-svg-text-origin)' : 
                           log.type === 'warning' ? 'var(--cf-svg-text-orange)' : 
                           log.type === 'error' ? 'var(--cf-alert-red-text)' : 'var(--cf-terminal-color)',
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
            <div className="cf-sec">{isAzure ? "Front Door Tiers (Standard vs Premium) & Edge Caching" : isGcp ? "Cloud CDN & Media CDN Pricing Tiers & Edge Caching" : "Price Classes & Advanced Cache Shield Caching"}</div>
            <div className="cf-card">
              <div style={{ fontSize: '13px', lineHeight: '1.6', marginBottom: '14px' }}>
                CDN operational costs are proportional to the geographic locations that host your cache clusters. By adjusting price classes, you can optimize your AWS budget while maintaining fast responses for your primary user bases.
              </div>

              <div className="cf-grid2">
                {/* Price Class Selector */}
                <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: 'var(--cf-svg-text-edge)' }}>CloudFront Price Classes Selector</div>
                  
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
                      <strong style={{ color: 'var(--cf-svg-text-origin)' }}>Price Class 100 (Lowest Cost):</strong>
                      <p style={{ margin: '4px 0', color: 'var(--color-text-secondary)' }}>
                        Utilizes only Edge POPs in <strong>North America and Europe</strong>. Users in Asia, South America, and Africa will experience higher latency because they route back to Western datacenters, but you are not billed for expensive regional POP bandwidth.
                      </p>
                      <div className="cf-mono" style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '6px' }}>
                        Ideal for: Startups, local businesses, or internal tooling with Western-centric user clusters.
                      </div>
                    </div>
                  )}

                  {activePriceClass === '200' && (
                    <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                      <strong style={{ color: 'var(--cf-svg-text-edge)' }}>Price Class 200 (Standard Balancing):</strong>
                      <p style={{ margin: '4px 0', color: 'var(--color-text-secondary)' }}>
                        Utilizes Edge POPs in <strong>North America, Europe, East Asia, and South America</strong>. Leaves out only the most expensive remote locations (like parts of Africa and Oceania).
                      </p>
                      <div className="cf-mono" style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '6px' }}>
                        Ideal for: Global web applications, standard e-commerce stores, and high-growth SaaS backends.
                      </div>
                    </div>
                  )}

                  {activePriceClass === 'all' && (
                    <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                      <strong style={{ color: 'var(--cf-svg-text-rec)' }}>Price Class All (Highest Performance):</strong>
                      <p style={{ margin: '4px 0', color: 'var(--color-text-secondary)' }}>
                        Activates **all global locations** including Oceania, Africa, South East Asia, and South America. Guarantees minimal latency globally, but billing rates reflect regional premium transit rates.
                      </p>
                      <div className="cf-mono" style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '6px' }}>
                        Ideal for: High-traffic video platforms, real-time gaming APIs, and enterprise-grade corporate portals.
                      </div>
                    </div>
                  )}

                  {/* Active POP Map Visualisation */}
                  <div style={{ border: '1.5px solid var(--cf-card-border)', borderRadius: '12px', background: 'var(--color-background-primary)', padding: '14px', marginTop: '16px' }}>
                    <div style={{ fontWeight: 700, fontSize: '12.5px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>🌐 Active Edge Locations Visual Mapping:</div>
                    
                    <svg width="100%" height="150" viewBox="0 0 340 150" className="cf-svg-bg" style={{ borderRadius: '8px', border: '1.5px solid var(--cf-card-border)', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.01))' }}>
                      {/* Continental Outline Shapes (Premium Gradient Styling) */}
                      <g fill="var(--cf-svg-map-fill)" stroke="var(--cf-svg-map-stroke)" strokeWidth="1">
                        {/* North America */}
                        <path d="M 20,25 C 40,20 70,15 80,35 C 65,40 55,55 35,60 Z" />
                        {/* South America */}
                        <path d="M 70,75 Q 85,95 75,125 Q 65,100 60,80 Z" />
                        {/* Europe */}
                        <path d="M 120,25 Q 140,20 160,30 Q 150,40 130,40 Z" />
                        {/* Africa */}
                        <path d="M 130,60 Q 165,60 175,85 Q 155,120 140,95 Z" />
                        {/* Asia */}
                        <path d="M 190,35 C 220,25 260,35 270,60 C 230,70 200,85 190,60 Z" />
                        {/* Australia */}
                        <path d="M 260,105 Q 285,100 290,120 Q 270,125 255,115 Z" />
                      </g>

                      {/* Active POP Nodes */}
                      {/* US East (Always Active) */}
                      <g>
                        <circle cx="55" cy="38" r="4" fill="var(--cf-svg-node-stroke-origin)" />
                        <circle cx="55" cy="38" r="8" fill="none" stroke="var(--cf-svg-node-stroke-origin)" strokeWidth="1.5">
                          <animate attributeName="r" values="4;10;4" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <text x="55" y="28" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="var(--cf-svg-text-origin)">US East</text>
                      </g>

                      {/* EU West (Always Active) */}
                      <g>
                        <circle cx="140" cy="30" r="4" fill="var(--cf-svg-node-stroke-origin)" />
                        <circle cx="140" cy="30" r="8" fill="none" stroke="var(--cf-svg-node-stroke-origin)" strokeWidth="1.5">
                          <animate attributeName="r" values="4;10;4" dur="2.2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="1;0;1" dur="2.2s" repeatCount="indefinite" />
                        </circle>
                        <text x="140" y="20" textAnchor="middle" fontSize="6.5" fontWeight="800" fill="var(--cf-svg-text-origin)">EU West</text>
                      </g>

                      {/* East Asia (Active on 200 and all) */}
                      <g opacity={activePriceClass !== '100' ? 1 : 0.35}>
                        <circle cx="245" cy="50" r="4" fill={activePriceClass !== '100' ? 'var(--cf-svg-node-stroke-origin)' : 'var(--color-text-tertiary)'} />
                        {activePriceClass !== '100' && (
                          <circle cx="245" cy="50" r="8" fill="none" stroke="var(--cf-svg-node-stroke-origin)" strokeWidth="1.5">
                            <animate attributeName="r" values="4;10;4" dur="1.9s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0;1" dur="1.9s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <text x="245" y="42" textAnchor="middle" fontSize="6.5" fontWeight="800" fill={activePriceClass !== '100' ? 'var(--cf-svg-text-origin)' : 'var(--color-text-secondary)'}>East Asia</text>
                      </g>

                      {/* South America (Active on 200 and all) */}
                      <g opacity={activePriceClass !== '100' ? 1 : 0.35}>
                        <circle cx="72" cy="92" r="4" fill={activePriceClass !== '100' ? 'var(--cf-svg-node-stroke-origin)' : 'var(--color-text-tertiary)'} />
                        {activePriceClass !== '100' && (
                          <circle cx="72" cy="92" r="8" fill="none" stroke="var(--cf-svg-node-stroke-origin)" strokeWidth="1.5">
                            <animate attributeName="r" values="4;10;4" dur="2.1s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0;1" dur="2.1s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <text x="72" y="84" textAnchor="middle" fontSize="6.5" fontWeight="800" fill={activePriceClass !== '100' ? 'var(--cf-svg-text-origin)' : 'var(--color-text-secondary)'}>S. America</text>
                      </g>

                      {/* South Africa (Active on all only) */}
                      <g opacity={activePriceClass === 'all' ? 1 : 0.35}>
                        <circle cx="158" cy="94" r="4" fill={activePriceClass === 'all' ? 'var(--cf-svg-node-stroke-origin)' : 'var(--color-text-tertiary)'} />
                        {activePriceClass === 'all' && (
                          <circle cx="158" cy="94" r="8" fill="none" stroke="var(--cf-svg-node-stroke-origin)" strokeWidth="1.5">
                            <animate attributeName="r" values="4;10;4" dur="1.8s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0;1" dur="1.8s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <text x="158" y="104" textAnchor="middle" fontSize="6.5" fontWeight="800" fill={activePriceClass === 'all' ? 'var(--cf-svg-text-origin)' : 'var(--color-text-secondary)'}>S. Africa</text>
                      </g>

                      {/* Australia (Active on all only) */}
                      <g opacity={activePriceClass === 'all' ? 1 : 0.35}>
                        <circle cx="272" cy="112" r="4" fill={activePriceClass === 'all' ? 'var(--cf-svg-node-stroke-origin)' : 'var(--color-text-tertiary)'} />
                        {activePriceClass === 'all' && (
                          <circle cx="272" cy="112" r="8" fill="none" stroke="var(--cf-svg-node-stroke-origin)" strokeWidth="1.5">
                            <animate attributeName="r" values="4;10;4" dur="2.3s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0;1" dur="2.3s" repeatCount="indefinite" />
                          </circle>
                        )}
                        <text x="272" y="122" textAnchor="middle" fontSize="6.5" fontWeight="800" fill={activePriceClass === 'all' ? 'var(--cf-svg-text-origin)' : 'var(--color-text-secondary)'}>Australia</text>
                      </g>
                    </svg>
                  </div>

                </div>

                {/* Caching Behaviors & Origin Shield */}
                <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--cf-border-primary)', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px', color: 'var(--cf-svg-text-orange)' }}>Cache Shielding (Origin Shield) &amp; TTL Parameters</div>
                  
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
            </>
          </Translate>
        )}

      </div>
    </div>
  );
}
