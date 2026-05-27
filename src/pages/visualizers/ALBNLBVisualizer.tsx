import { useEffect, useRef, useState, useCallback } from 'react';

type TabType = 'concept' | 'alb' | 'nlb' | 'simulation' | 'integrations' | 'config';
type DecisionKey = 'layer' | 'throughput' | 'staticIp' | 'inspection';

interface Particle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: string;
  clientId: number;
  targetId: number;
  state: 'to_lb' | 'to_server' | 'returning';
}

export default function ALBNLBVisualizer() {
  const [activeSection, setActiveSection] = useState<TabType>('concept');

  // Load Balancer Infra Scenario state (Integrations)
  const [infraScenario, setInfraScenario] = useState<'alb_ingress' | 'nlb_throughput' | 'privatelink'>('alb_ingress');
  const [infraStep, setInfraStep] = useState<number>(0);
  const [infraTracing, setInfraTracing] = useState<boolean>(false);

  // Premium Interactive ALB/NLB active states
  const [activeNlbTarget, setActiveNlbTarget] = useState<'A' | 'B' | 'C' | null>(null);
  const [currentNlbClient, setCurrentNlbClient] = useState<string>('');
  const [currentNlbHash, setCurrentNlbHash] = useState<string>('');
  const [albIsAnimating, setAlbIsAnimating] = useState<boolean>(false);

  // Playback Auto-Advance logic for Integrations tab
  useEffect(() => {
    if (!infraTracing) return;
    const maxSteps = infraScenario === 'alb_ingress' ? 6 : infraScenario === 'nlb_throughput' ? 5 : 6;
    const interval = setInterval(() => {
      setInfraStep((prev) => (prev + 1) % maxSteps);
    }, 3500);
    return () => clearInterval(interval);
  }, [infraTracing, infraScenario]);

  // Integration Scenario steps mapping
  const scSteps = {
    alb_ingress: [
      { label: '1. Client HTTPS Connection', desc: 'Secure browser connection resolves SSL/TLS cert at ALB boundary.', node: 'client' },
      { label: '2. Route 53 DNS Lookup', desc: 'Resolves canonical server address to CloudFront or ALB alias record.', node: 'route53' },
      { label: '3. AWS WAF Packet Inspection', desc: 'Web ACL guards the application gateway by checking query strings & headers.', node: 'waf' },
      { label: '4. CloudFront Edge Router', desc: 'Queries local edge CDN caches for dynamic/static resource path bypass.', node: 'cloudfront' },
      { label: '5. ALB L7 Host/Path Rules', desc: 'Terminates SSL, parses HTTP host header & path /api/*, routes to Checkout Target Group.', node: 'alb' },
      { label: '6. Private Compute AZ Targets', desc: 'Traffic safely reaches isolated servers in private subnet AZ1 and AZ2 with zero public IPs.', node: 'servers' }
    ],
    nlb_throughput: [
      { label: '1. Trusted Client Whitelisting', desc: 'Enterprise clients hit pre-assigned static Elastic IPs directly, bypassing dynamic DNS.', node: 'client' },
      { label: '2. Raw TCP Pass-Through', desc: 'NLB accepts packet stream at Layer 4 (Transport), skipping heavy HTTP header processing.', node: 'tcp' },
      { label: '3. 5-Tuple Connection Hashing', desc: 'Computes hash of protocol, source IP/port, & dest IP/port to pin client connection.', node: 'hash' },
      { label: '4. Microsecond Route Dispatch', desc: 'Fires network packets straight to AZ compute targets with sub-millisecond latency.', node: 'nlb' },
      { label: '5. Client IP Preservation (DSR)', desc: 'Backend instances receive flow with raw Client Source IP fully preserved, returning data directly.', node: 'servers' }
    ],
    privatelink: [
      { label: '1. Private Hosted Zone Resolution', desc: 'Consumer app queries internal Route 53 PHZ for api.service.internal.', node: 'phz' },
      { label: '2. Interface Endpoint Gateway (ENI)', desc: 'Resolves host query to local private endpoint IP inside consumer subnet.', node: 'eni' },
      { label: '3. AWS Private Backbone Tunnel', desc: 'Packets traverse isolated physical fiber infrastructure, bypassing public internet.', node: 'backbone' },
      { label: '4. Provider VPC NLB Intake', desc: 'Traffic securely hits Endpoint Service gateway backed by high-throughput NLB.', node: 'nlb' },
      { label: '5. Dedicated Multi-AZ Backends', desc: 'Provider NLB forwards request to isolated containerized ECS backend services.', node: 'servers' },
      { label: '6. Private Tunnel Secure Return', desc: 'Response travels back to consumer VPC via the secure, private tunnel interface.', node: 'client' }
    ]
  };

  const handleScenarioChange = (scenario: 'alb_ingress' | 'nlb_throughput' | 'privatelink') => {
    setInfraScenario(scenario);
    setInfraStep(0);
    setInfraTracing(false);
  };

  // Decision Guide States
  const [decisions, setDecisions] = useState<Record<DecisionKey, string>>({
    layer: 'http',
    throughput: 'moderate',
    staticIp: 'no',
    inspection: 'no'
  });

  // ALB Simulator States
  const [albHostInput, setAlbHostInput] = useState('app.example.com');
  const [albPathInput, setAlbPathInput] = useState('/api/v1/users');
  const [albLogs, setAlbLogs] = useState<string[]>([]);
  const [matchedRule, setMatchedRule] = useState<string>('');

  // NLB TCP Connection States
  const [nlbConnections, setNlbConnections] = useState<{ client: string; hash: string; server: string }[]>([]);
  const [nlbLogs, setNlbLogs] = useState<string[]>([]);

  // Enhanced ALB simulator states
  const [albMethod, setAlbMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [albQuery, setAlbQuery] = useState('tier=premium');
  const [albHeaderKey, setAlbHeaderKey] = useState('X-Custom-Header');
  const [albHeaderVal, setAlbHeaderVal] = useState('special');
  const [albCheckingRuleIndex, setAlbCheckingRuleIndex] = useState<number>(-1);

  // Enhanced NLB simulator states
  const [nlbSrcIp, setNlbSrcIp] = useState('198.51.100.4');
  const [nlbSrcPort, setNlbSrcPort] = useState(52184);
  const nlbDstIp = '203.0.113.12';
  const [nlbDstPort, setNlbDstPort] = useState(5000);
  const [nlbProtocol, setNlbProtocol] = useState<'TCP' | 'UDP'>('TCP');
  const [nlbReturnMode, setNlbReturnMode] = useState<'dsr' | 'proxy'>('dsr');

  // Simulation parameters
  const [simMode, setSimMode] = useState<'alb_sticky' | 'alb_no_sticky' | 'nlb_hash'>('alb_sticky');
  const [serverCount, setServerCount] = useState<number>(3);
  const [serverHealth, setServerHealth] = useState<boolean[]>([true, true, true]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTrafficLogs, setActiveTrafficLogs] = useState<string[]>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const particleIdRef = useRef(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const isRunningRef = useRef(isRunning);

  // Synchronize running state ref
  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // Compute recommended LB
  const getRecommendedLB = () => {
    if (decisions.inspection === 'yes') {
      return {
        title: '🔒 Recommended: AWS Gateway Load Balancer (GWLB)',
        desc: 'Since you require deep, inline third-party security packet inspection or firewall appliances, GWLB acts at Layer 3 to route raw IP packets transparently through a virtual appliance pool.',
        color: '#7c3aed'
      };
    } else if (decisions.layer === 'tcp' && decisions.throughput === 'extreme') {
      return {
        title: '⚡ Recommended: AWS Network Load Balancer (NLB)',
        desc: 'Extreme throughput requirements combined with raw TCP/UDP networking make NLB the optimal choice. It operates at Layer 4, handling millions of requests per second with sub-millisecond latencies.',
        color: '#0369a1'
      };
    } else if (decisions.staticIp === 'yes') {
      return {
        title: '🔢 Recommended: AWS Network Load Balancer (NLB)',
        desc: 'Since you require static elastic IP addresses per availability zone for white-listing, NLB is required because it binds a static elastic IP to each zonal subnet, unlike ALB which uses dynamic DNS names.',
        color: '#0369a1'
      };
    } else {
      return {
        title: '🍔 Recommended: AWS Application Load Balancer (ALB)',
        desc: 'For standard HTTP/HTTPS application routing, ALB is the industry standard. It evaluates Layer 7 properties (Path rules, Host headers, and Cookie sessions) to intelligently load balance microservices and containerized backends.',
        color: '#c2410c'
      };
    }
  };

  const recommendation = getRecommendedLB();

  // Simple FNV-1a hash implementation for NLB Flow Hashing
  const calculateFnv1a = (str: string) => {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      // FNV prime multiplication in standard 32-bit math
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16).toUpperCase();
  };

  // ALB Rule Match simulation
  const simulateALBRouting = () => {
    setAlbIsAnimating(true);
    setMatchedRule('');
    setAlbCheckingRuleIndex(0);
    setAlbLogs([
      `🔍 [ALB L7 Intake] Received HTTP ${albMethod} on port 443 (HTTPS)`,
      `🌐 Client Host Header: "${albHostInput}" | Path: "${albPathInput}"${albQuery ? ' | Query: ?' + albQuery : ''}`,
      `⚙️ Loaded Headers: ${albHeaderKey}="${albHeaderVal}"`,
      `🔄 Step 1: Initializing priority-ordered Listener Rules scanning...`
    ]);

    const host = albHostInput.trim().toLowerCase();
    const path = albPathInput.trim().toLowerCase();
    const query = albQuery.trim().toLowerCase();
    const headerKey = albHeaderKey.trim().toLowerCase();
    const headerVal = albHeaderVal.trim().toLowerCase();

    // Matching conditions
    const isRule1Matched = host.includes('api.') && path.startsWith('/api/v1/users');
    const isRule2Matched = host.includes('api.') && path.startsWith('/api/v1/orders');
    const isRule3Matched = query.includes('tier=premium');
    const isRule4Matched = headerKey === 'x-custom-header' && headerVal === 'special';
    const isRule5Matched = host.includes('blog.');
    const isRule6Matched = path.startsWith('/static/');

    const runStep = (idx: number) => {
      setAlbCheckingRuleIndex(idx);
      if (idx === 0) {
        setAlbLogs(l => [...l, `⚡ Evaluating Rule 1 (Priority 10): Host == "api.*" AND Path == "/api/v1/users*"`]);
        if (isRule1Matched) {
          setTimeout(() => {
            setMatchedRule('Rule 1 (Priority 10)');
            setAlbLogs(l => [
              ...l,
              `✅ MATCH FOUND (Rule 1)! Routing request to Target Group [user-service-tg]`,
              `➡️ Dynamic Target: Port 8080 compute server instance in AZ1`,
              `🍪 Injecting Session Cookie: [Set-Cookie: AWSALB=Server-AZ1-8080; Max-Age=86400]`
            ]);
            setAlbCheckingRuleIndex(-1);
            setAlbIsAnimating(false);
          }, 600);
        } else {
          setTimeout(() => {
            setAlbLogs(l => [...l, `❌ Mismatch. Checking Priority 20 rules...`]);
            runStep(1);
          }, 500);
        }
      } else if (idx === 1) {
        setAlbLogs(l => [...l, `⚡ Evaluating Rule 2 (Priority 20): Host == "api.*" AND Path == "/api/v1/orders*"`]);
        if (isRule2Matched) {
          setTimeout(() => {
            setMatchedRule('Rule 2 (Priority 20)');
            setAlbLogs(l => [
              ...l,
              `✅ MATCH FOUND (Rule 2)! Routing request to Target Group [order-service-tg]`,
              `➡️ Dynamic Target: Port 8081 compute server instance in AZ2`,
              `🍪 Injecting Session Cookie: [Set-Cookie: AWSALB=Server-AZ2-8081; Max-Age=86400]`
            ]);
            setAlbCheckingRuleIndex(-1);
            setAlbIsAnimating(false);
          }, 600);
        } else {
          setTimeout(() => {
            setAlbLogs(l => [...l, `❌ Mismatch. Checking Priority 30 rules...`]);
            runStep(2);
          }, 500);
        }
      } else if (idx === 2) {
        setAlbLogs(l => [...l, `⚡ Evaluating Rule 3 (Priority 30): QueryString includes "tier=premium"`]);
        if (isRule3Matched) {
          setTimeout(() => {
            setMatchedRule('Rule 3 (Priority 30)');
            setAlbLogs(l => [
              ...l,
              `✅ MATCH FOUND (Rule 3)! Routing request to Target Group [premium-only-tg]`,
              `➡️ Dynamic Target: High-performance checkout server in private subnet`,
              `🍪 Injecting Session Cookie: [Set-Cookie: AWSALB=Server-Premium-8000]`
            ]);
            setAlbCheckingRuleIndex(-1);
            setAlbIsAnimating(false);
          }, 600);
        } else {
          setTimeout(() => {
            setAlbLogs(l => [...l, `❌ Mismatch. Checking Priority 40 rules...`]);
            runStep(3);
          }, 500);
        }
      } else if (idx === 3) {
        setAlbLogs(l => [...l, `⚡ Evaluating Rule 4 (Priority 40): Custom HTTP Header "${albHeaderKey}" == "special"`]);
        if (isRule4Matched) {
          setTimeout(() => {
            setMatchedRule('Rule 4 (Priority 40)');
            setAlbLogs(l => [
              ...l,
              `✅ MATCH FOUND (Rule 4)! Routing request to Target Group [special-tg]`,
              `➡️ Dynamic Target: Dedicated canary release deployment pool`,
              `🍪 Injecting Session Cookie: [Set-Cookie: AWSALB=Server-Special-9000]`
            ]);
            setAlbCheckingRuleIndex(-1);
            setAlbIsAnimating(false);
          }, 600);
        } else {
          setTimeout(() => {
            setAlbLogs(l => [...l, `❌ Mismatch. Checking Priority 50 rules...`]);
            runStep(4);
          }, 500);
        }
      } else if (idx === 4) {
        setAlbLogs(l => [...l, `⚡ Evaluating Rule 5 (Priority 50): Host == "blog.*"`]);
        if (isRule5Matched) {
          setTimeout(() => {
            setMatchedRule('Rule 5 (Priority 50)');
            setAlbLogs(l => [
              ...l,
              `✅ MATCH FOUND (Rule 5)! Routing request to Target Group [blog-wordpress-tg]`,
              `➡️ Dynamic Target: Port 80 container task instance in AZ1`,
              `🍪 Injecting Session Cookie: [Set-Cookie: AWSALB=Server-Blog-80]`
            ]);
            setAlbCheckingRuleIndex(-1);
            setAlbIsAnimating(false);
          }, 600);
        } else {
          setTimeout(() => {
            setAlbLogs(l => [...l, `❌ Mismatch. Checking Priority 60 rules...`]);
            runStep(5);
          }, 500);
        }
      } else if (idx === 5) {
        setAlbLogs(l => [...l, `⚡ Evaluating Rule 6 (Priority 60): Path == "/static/*"`]);
        if (isRule6Matched) {
          setTimeout(() => {
            setMatchedRule('Rule 6 (Priority 60)');
            setAlbLogs(l => [
              ...l,
              `✅ MATCH FOUND (Rule 6)! Redirecting to S3 Bucket Target [static-s3-tg]`,
              `➡️ Dynamic Target: Direct secure connection to AWS S3 storage buckets`,
              `🎉 Header matches static prefix. SSL session stickiness bypassed.`
            ]);
            setAlbCheckingRuleIndex(-1);
            setAlbIsAnimating(false);
          }, 600);
        } else {
          setTimeout(() => {
            setAlbLogs(l => [...l, `❌ Mismatch. Cascading to Catch-All default listener...`]);
            runStep(6);
          }, 500);
        }
      } else {
        setTimeout(() => {
          setMatchedRule('Default Ruleset');
          setAlbLogs(l => [
            ...l,
            `✅ NO CUSTOM RULE MATCHED. Forwarding request to Default Target Group [default-s3-website-tg]`,
            `➡️ Target: Static website hosting servers`,
            `🎉 Request successfully matched default routing flow.`
          ]);
          setAlbCheckingRuleIndex(-1);
          setAlbIsAnimating(false);
        }, 600);
      }
    };

    setTimeout(() => runStep(0), 400);
  };

  // NLB Flow Hashing simulation
  const simulateNLBConnection = () => {
    // Generate randomized socket parameters on request
    const randomIp = `198.51.100.${Math.floor(Math.random() * 254) + 1}`;
    const randomPort = Math.floor(Math.random() * 16383) + 49152;
    setNlbSrcIp(randomIp);
    setNlbSrcPort(randomPort);

    const clientSocket = `${randomIp}:${randomPort}`;

    // Construct the 5-Tuple key: protocol, src IP, src Port, dest IP, dest Port
    const fiveTuple = `${nlbProtocol.toUpperCase()}:${randomIp}:${randomPort}->${nlbDstIp}:${nlbDstPort}`;
    
    // Compute deterministic FNV-1a Hash
    const hexHash = calculateFnv1a(fiveTuple);
    const hashInt = parseInt(hexHash.substring(0, 8), 16) || 0;
    const serverIndex = hashInt % serverCount;
    const serverLetter = String.fromCharCode(65 + serverIndex) as 'A' | 'B' | 'C';
    const serverName = `Target Server ${serverLetter}`;

    setCurrentNlbClient(clientSocket);
    setCurrentNlbHash(`0x${hexHash.substring(0, 6)}`);
    setActiveNlbTarget(serverLetter);

    const newConnection = { client: clientSocket, hash: `0x${hexHash.substring(0, 6)}`, server: serverName };

    setNlbConnections((prev) => [newConnection, ...prev.slice(0, 5)]);
    setNlbLogs((prev) => [
      `⚡ [L4 Connection Request] Received packet flow: ${fiveTuple}`,
      `⚙️ Hashing 5-Tuple Key... FNV-1a Resolved Hash: [0x${hexHash}]`,
      `🧮 Math: 0x${hexHash.substring(0, 8)} (${hashInt}) % ${serverCount} Target Pools = Server Index [${serverIndex}] (${serverLetter})`,
      `➡️ Dispatching raw packet stream strictly to [${serverName}]`,
      nlbReturnMode === 'dsr' 
        ? `↩️ Direct Server Return (DSR): Server will reply to Client ${clientSocket} DIRECTLY, bypassing the NLB to maximize throughput!`
        : `🔄 Proxy Mode: All outbound response traffic must return through NLB gateway.`,
      ...prev.slice(0, 8)
    ]);
  };

  // Canvas-based particles traffic loop
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;

    // Draw LB node
    const lbX = width / 2;
    const lbY = height / 2;

    ctx.fillStyle = simMode.startsWith('alb') ? '#c2410c' : '#0369a1';
    ctx.beginPath();
    ctx.arc(lbX, lbY, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px var(--font-sans, sans-serif)';
    ctx.textAlign = 'center';
    ctx.fillText(simMode.startsWith('alb') ? 'ALB' : 'NLB', lbX, lbY + 4);

    // Draw Client entry nodes
    const clientX = 40;
    const clientYSpacing = height / 4;
    const clientColors = ['#ec4899', '#3b82f6', '#10b981'];

    for (let i = 0; i < 3; i++) {
      const cy = clientYSpacing * (i + 1);
      ctx.fillStyle = clientColors[i];
      ctx.beginPath();
      ctx.arc(clientX, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px var(--font-sans, sans-serif)';
      ctx.fillText(`C${i + 1}`, clientX, cy + 3);

      // Connection line to LB
      ctx.strokeStyle = 'var(--color-border-secondary)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(clientX + 14, cy);
      ctx.lineTo(lbX - 22, lbY);
      ctx.stroke();
    }

    // Draw Target Server nodes
    const serverX = width - 60;
    const serverYSpacing = height / (serverCount + 1);
    const serverTargets: { id: number; x: number; y: number; healthy: boolean }[] = [];

    for (let i = 0; i < serverCount; i++) {
      const sy = serverYSpacing * (i + 1);
      const isHealthy = serverHealth[i];
      serverTargets.push({ id: i, x: serverX, y: sy, healthy: isHealthy });

      ctx.fillStyle = isHealthy ? '#22c55e' : '#ef4444';
      ctx.beginPath();
      ctx.arc(serverX, sy, 16, 0, Math.PI * 2);
      ctx.fill();

      // Border highlight
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px var(--font-sans, sans-serif)';
      ctx.fillText(String.fromCharCode(65 + i), serverX, sy + 3);

      // Health text
      ctx.fillStyle = isHealthy ? '#16a34a' : '#dc2626';
      ctx.font = '9px var(--font-sans, sans-serif)';
      ctx.fillText(isHealthy ? 'OK' : 'FAIL', serverX + 30, sy + 3);

      // Connection line from LB to Server
      ctx.strokeStyle = isHealthy ? 'var(--color-border-secondary)' : '#fca5a5';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(lbX + 22, lbY);
      ctx.lineTo(serverX - 16, sy);
      ctx.stroke();
    }

    // Spawn new particles periodically
    if (isRunningRef.current && Math.random() < 0.04) {
      const clientId = Math.floor(Math.random() * 3);
      const clientY = clientYSpacing * (clientId + 1);
      const clientColor = clientColors[clientId];

      // Determine routing decision
      let targetId = -1;

      // Filter healthy targets
      const healthyTargetIds = serverTargets.filter((t) => t.healthy).map((t) => t.id);

      if (healthyTargetIds.length > 0) {
        if (simMode === 'alb_sticky') {
          // Check if client has a persistent target already pinned
          const cookieKey = `client_sticky_${clientId}`;
          const existingSessionTarget = sessionStorage.getItem(cookieKey);

          if (existingSessionTarget && healthyTargetIds.includes(parseInt(existingSessionTarget))) {
            targetId = parseInt(existingSessionTarget);
          } else {
            // First time or failed target, pick a random healthy target and pin session cookie
            targetId = healthyTargetIds[Math.floor(Math.random() * healthyTargetIds.length)];
            sessionStorage.setItem(cookieKey, targetId.toString());
            setActiveTrafficLogs((prev) => [
              `🍪 Client C${clientId + 1} request - No session cookie found. Load balanced to Server ${String.fromCharCode(65 + targetId)}. Returning response with [Set-Cookie: AWSALB=Server${String.fromCharCode(65 + targetId)}]`,
              ...prev.slice(0, 8)
            ]);
          }
        } else if (simMode === 'alb_no_sticky') {
          // Standard round robin / random balancing
          targetId = healthyTargetIds[Math.floor(Math.random() * healthyTargetIds.length)];
          setActiveTrafficLogs((prev) => [
            `🔄 Client C${clientId + 1} request - Round-Robin dynamic balancing routed to Server ${String.fromCharCode(65 + targetId)}`,
            ...prev.slice(0, 8)
          ]);
        } else {
          // NLB Mode - Flow Hashing
          // Deterministic hash maps Client ID directly to a specific target
          const hashValue = (clientId + 7) % serverCount;
          if (healthyTargetIds.includes(hashValue)) {
            targetId = hashValue;
            setActiveTrafficLogs((prev) => [
              `⚡ Client C${clientId + 1} flow hash mapped to Server ${String.fromCharCode(65 + targetId)}. Persistent L4 session active.`,
              ...prev.slice(0, 8)
            ]);
          } else {
            // Failover to next healthy target
            targetId = healthyTargetIds[0];
            setActiveTrafficLogs((prev) => [
              `⚠️ Flow Target Server ${String.fromCharCode(65 + hashValue)} is offline. NLB flow failover redirected connection to Server ${String.fromCharCode(65 + targetId)}.`,
              ...prev.slice(0, 8)
            ]);
          }
        }
      }

      if (targetId !== -1) {
        const targetServer = serverTargets.find((t) => t.id === targetId);
        if (targetServer) {
          particlesRef.current.push({
            id: particleIdRef.current++,
            x: clientX,
            y: clientY,
            targetX: lbX,
            targetY: lbY,
            speed: 3,
            color: clientColor,
            clientId,
            targetId,
            state: 'to_lb'
          });
        }
      }
    }

    // Move and draw particles
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      // Move particle toward target
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < p.speed) {
        p.x = p.targetX;
        p.y = p.targetY;

        // Transition states
        if (p.state === 'to_lb') {
          p.state = 'to_server';
          const targetNode = serverTargets.find((t) => t.id === p.targetId);
          if (targetNode) {
            p.targetX = targetNode.x;
            p.targetY = targetNode.y;
          } else {
            particles.splice(i, 1);
            continue;
          }
        } else if (p.state === 'to_server') {
          p.state = 'returning';
          p.targetX = lbX;
          p.targetY = lbY;
        } else if (p.state === 'returning') {
          p.state = 'returning'; // keep tag but trace back to client
          p.targetX = clientX;
          p.targetY = clientYSpacing * (p.clientId + 1);

          if (Math.abs(p.x - p.targetX) < 5 && Math.abs(p.y - p.targetY) < 5) {
            // Reached client, delete particle
            particles.splice(i, 1);
            continue;
          }
        }
      } else {
        p.x += (dx / distance) * p.speed;
        p.y += (dy / distance) * p.speed;
      }

      // Draw particle
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Add a slight core pulse glow
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Loop animation
    if (isRunningRef.current) {
      animationFrameIdRef.current = requestAnimationFrame(drawCanvas);
    }
  }, [simMode, serverCount, serverHealth]);

  // Handle simulation toggle
  const toggleSimulation = () => {
    if (isRunning) {
      setIsRunning(false);
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    } else {
      setIsRunning(true);
      setActiveTrafficLogs(['🏁 Simulation engine initialized. Click "Send Traffic" and fail servers to watch routing paths...']);
    }
  };

  // Run draw loop on start
  useEffect(() => {
    if (activeSection === 'simulation') {
      const canvas = canvasRef.current;
      if (canvas) {
        // Run first clear and draw frame
        isRunningRef.current = isRunning;
        drawCanvas();
      }
    }

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [activeSection, isRunning, drawCanvas]);

  // Clean session cookies helper
  const cleanSimulatorCookies = () => {
    sessionStorage.removeItem('client_sticky_0');
    sessionStorage.removeItem('client_sticky_1');
    sessionStorage.removeItem('client_sticky_2');
    setActiveTrafficLogs((prev) => ['🧹 Session cookies cleared from client browsers! Dynamic allocation reset.', ...prev]);
  };

  return (
    <div>
      <style>{`
        .anl-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 14px; }
        .anl-tb { padding: 6px 14px; border-radius: 999px; border: 0.5px solid var(--color-border-secondary); font-size: 12px; cursor: pointer; background: var(--color-background-secondary); color: var(--color-text-secondary); transition: all .15s; outline: none; }
        .anl-tb:hover { background: var(--color-background-tertiary); }
        .anl-tb.anl-on { background: #c2410c; color: #fff; border-color: #c2410c; }
        .anl-tb.anl-on-nlb { background: #0369a1; color: #fff; border-color: #0369a1; }
        .anl-card { border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 14px 16px; background: var(--color-background-primary); margin-bottom: 12px; }
        .anl-sec { font-size: 11px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .05em; margin: 16px 0 8px; }
        .anl-sec:first-child { margin-top: 0; }
        .anl-kv { display: flex; gap: 8px; font-size: 12px; margin: 6px 0; align-items: baseline; }
        .anl-kk { min-width: 160px; color: var(--color-text-secondary); flex-shrink: 0; }
        .anl-g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .anl-g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .anl-met { background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 12px; text-align: center; }
        ul.anl-ck li { font-size: 12px; margin-bottom: 6px; list-style: none; padding-left: 18px; position: relative; }
        ul.anl-ck li::before { content: "✓"; position: absolute; left: 0; color: #c2410c; font-weight: 700; }
        .anl-log { border: 0.5px solid var(--color-border-tertiary); border-radius: 8px; padding: 10px 12px; background: var(--color-background-secondary); font-size: 11px; font-family: var(--font-mono, monospace); white-space: pre-wrap; line-height: 1.4; color: var(--color-text-primary); }
        .anl-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; }
        .anl-btn { font-size: 12px; padding: 5px 12px; border-radius: 6px; border: 0.5px solid var(--color-border-secondary); background: var(--color-background-primary); color: var(--color-text-primary); cursor: pointer; transition: all 0.15s; outline: none; }
        .anl-btn:hover { background: var(--color-background-secondary); }
        .anl-btn.anl-on { background: #c2410c; color: #fff; border-color: #c2410c; }
        .anl-btn.anl-on-nlb { background: #0369a1; color: #fff; border-color: #0369a1; }
        
        /* Interactive animations and flows */
        @keyframes activeNodePulse {
          0% { filter: drop-shadow(0 0 1px var(--pulse-color, #c2410c)) brightness(1); }
          50% { filter: drop-shadow(0 0 8px var(--pulse-color, #c2410c)) brightness(1.2); }
          100% { filter: drop-shadow(0 0 1px var(--pulse-color, #c2410c)) brightness(1); }
        }
        .active-glow-node rect, .active-glow-node circle {
          animation: activeNodePulse 1.8s infinite ease-in-out;
          stroke-width: 2.5px !important;
        }
        .flow-active-line {
          stroke-dasharray: 6,4;
          animation: flowAnim 1.2s linear infinite;
        }
        @keyframes flowAnim {
          from { stroke-dashoffset: 20; }
          to { stroke-dashoffset: 0; }
        }
        
        /* Rule card states */
        .rule-item {
          font-size: 11.5px;
          padding: 8px 10px;
          border-radius: 6px;
          border: 0.5px solid var(--color-border-tertiary);
          background: var(--color-background-secondary);
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.25s ease;
        }
        .rule-item.checking {
          border-color: #ea580c;
          box-shadow: 0 0 8px rgba(234, 88, 12, 0.25);
          background: rgba(234, 88, 12, 0.05);
        }
        .rule-item.matched {
          border-color: #22c55e;
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
          background: rgba(34, 197, 94, 0.08);
          font-weight: bold;
        }
        .rule-item.mismatched {
          opacity: 0.55;
          background: var(--color-background-primary);
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '14px 16px 4px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚖️ AWS Elastic Load Balancers — ALB stickiness vs NLB Flow Hashing
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Intelligent request routing, static elastic IPs, high-throughput flow hashing, and secure traffic distribution systems.
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="anl-tabs">
          <button className={`anl-tb ${activeSection === 'concept' ? 'anl-on' : ''}`} onClick={() => setActiveSection('concept')}>⚖️ Concepts &amp; Comparison</button>
          <button className={`anl-tb ${activeSection === 'alb' ? 'anl-on' : ''}`} onClick={() => setActiveSection('alb')}>🍔 Application Load Balancer</button>
          <button className={`anl-tb ${activeSection === 'nlb' ? 'anl-on' : ''}`} onClick={() => setActiveSection('nlb')}>🔢 Network Load Balancer</button>
          <button className={`anl-tb ${activeSection === 'simulation' ? 'anl-on' : ''}`} onClick={() => setActiveSection('simulation')}>🎮 Live Traffic Simulator</button>
          <button className={`anl-tb ${activeSection === 'integrations' ? 'anl-on' : ''}`} onClick={() => setActiveSection('integrations')}>🏗️ Integrations &amp; Infra</button>
          <button className={`anl-tb ${activeSection === 'config' ? 'anl-on' : ''}`} onClick={() => setActiveSection('config')}>⚙️ Config &amp; Terraform</button>
        </div>
      </div>

      {/* Content Panels */}
      <div style={{ padding: '0 16px' }}>

        {/* CONCEPTS PANEL */}
        {activeSection === 'concept' && (
          <div>
            <div className="anl-sec">Four Types of AWS Elastic Load Balancers</div>
            <div className="anl-g2" style={{ marginBottom: '12px' }}>
              <div>
                <div className="anl-card" style={{ borderLeft: '3px solid #c2410c', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#c2410c' }}>🍔 1. Application Load Balancer (ALB)</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    Operates at <b>Layer 7 (HTTP/HTTPS)</b>. Inspects header payloads, paths, cookies, and query parameters to execute content-based smart routing rules to target microservices.
                  </div>
                </div>

                <div className="anl-card" style={{ borderLeft: '3px solid #0369a1', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#0369a1' }}>🔢 2. Network Load Balancer (NLB)</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    Operates at <b>Layer 4 (TCP/UDP/TLS)</b>. Designed for extreme throughput (millions of RPS) at ultra-low latency. Binds static Elastic IPs to subnets, allowing hard IP whitelisting.
                  </div>
                </div>
              </div>

              <div>
                <div className="anl-card" style={{ borderLeft: '3px solid #7c3aed', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#7c3aed' }}>🔒 3. Gateway Load Balancer (GWLB)</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    Operates at <b>Layer 3 (IP Packets)</b>. Deploys, scales, and manages virtual security firewalls or deep packet inspection appliances seamlessly in line without network modification.
                  </div>
                </div>

                <div className="anl-card" style={{ borderLeft: '3px solid #64748b', marginBottom: '10px' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px', color: '#64748b' }}>🕰️ 4. Classic Load Balancer (CLB)</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    <b>Legacy product (Layer 4/7 basic bridges)</b>. Intended for old applications built within the EC2-Classic network. Avoid using for any modern cloud-native architectures.
                  </div>
                </div>
              </div>
            </div>

            <div className="anl-sec">Elastic Load Balancer Side-by-Side Comparison</div>
            <div className="anl-card" style={{ overflowX: 'auto', padding: '10px 14px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left', minWidth: '600px' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)' }}>
                    <th style={{ padding: '8px 6px' }}>Parameter Feature</th>
                    <th style={{ padding: '8px 6px', color: '#c2410c' }}>ALB (Layer 7)</th>
                    <th style={{ padding: '8px 6px', color: '#0369a1' }}>NLB (Layer 4)</th>
                    <th style={{ padding: '8px 6px', color: '#7c3aed' }}>GWLB (Layer 3)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px 6px', fontWeight: '500' }}>OSI Level</td>
                    <td style={{ padding: '8px 6px' }}>Layer 7 (Application)</td>
                    <td style={{ padding: '8px 6px' }}>Layer 4 (Transport)</td>
                    <td style={{ padding: '8px 6px' }}>Layer 3 (Network IP Packets)</td>
                  </tr>
                  <tr style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px 6px', fontWeight: '500' }}>Supported Protocols</td>
                    <td style={{ padding: '8px 6px' }}>HTTP, HTTPS, gRPC, HTTP/2</td>
                    <td style={{ padding: '8px 6px' }}>TCP, UDP, TLS</td>
                    <td style={{ padding: '8px 6px' }}>IP Packets (GENEVE tunneling)</td>
                  </tr>
                  <tr style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px 6px', fontWeight: '500' }}>Subnet IPs Allocation</td>
                    <td style={{ padding: '8px 6px' }}>Dynamic IPs (rescaling DNS)</td>
                    <td style={{ padding: '8px 6px', fontWeight: 'bold', color: '#0369a1' }}>Static per AZ / Elastic IP</td>
                    <td style={{ padding: '8px 6px' }}>Private Endpoint IPs</td>
                  </tr>
                  <tr style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px 6px', fontWeight: '500' }}>Latency profile</td>
                    <td style={{ padding: '8px 6px' }}>~10-20ms (request parsing)</td>
                    <td style={{ padding: '8px 6px', fontWeight: 'bold', color: '#16a34a' }}>&lt; 1ms (super-fast bypass)</td>
                    <td style={{ padding: '8px 6px' }}>~1-5ms</td>
                  </tr>
                  <tr style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px 6px', fontWeight: '500' }}>Sticky Sessions</td>
                    <td style={{ padding: '8px 6px', color: '#16a34a' }}>✅ Cookie-based (AWS or App)</td>
                    <td style={{ padding: '8px 6px' }}>❌ No (Flow Hashing pins connection)</td>
                    <td style={{ padding: '8px 6px' }}>❌ No</td>
                  </tr>
                  <tr style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px 6px', fontWeight: '500' }}>SSL/TLS Offloading</td>
                    <td style={{ padding: '8px 6px' }}>✅ Yes (ACM integration)</td>
                    <td style={{ padding: '8px 6px' }}>✅ Yes (TLS high-performance)</td>
                    <td style={{ padding: '8px 6px' }}>❌ Transparent (Forwarded)</td>
                  </tr>
                  <tr style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px 6px', fontWeight: '500' }}>Target Types</td>
                    <td style={{ padding: '8px 6px' }}>EC2, Containers, IP, Lambda</td>
                    <td style={{ padding: '8px 6px' }}>EC2, Containers, IP addresses</td>
                    <td style={{ padding: '8px 6px' }}>Firewall Virtual Appliances</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* DYNAMIC DECISION GUIDE */}
            <div className="anl-sec">Elastic Load Balancer Decision Guide</div>
            <div className="anl-g2">
              <div className="anl-card">
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px' }}>Configure Application Parameters</div>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Network Traffic Layer / Protocol:</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className={`anl-btn ${decisions.layer === 'http' ? 'anl-on' : ''}`} onClick={() => setDecisions((d) => ({ ...d, layer: 'http' }))}>HTTP/HTTPS (L7)</button>
                    <button className={`anl-btn ${decisions.layer === 'tcp' ? 'anl-on' : ''}`} onClick={() => setDecisions((d) => ({ ...d, layer: 'tcp' }))}>Raw TCP/UDP (L4)</button>
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Throughput requirements:</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className={`anl-btn ${decisions.throughput === 'moderate' ? 'anl-on' : ''}`} onClick={() => setDecisions((d) => ({ ...d, throughput: 'moderate' }))}>Moderate (~10k RPS)</button>
                    <button className={`anl-btn ${decisions.throughput === 'extreme' ? 'anl-on' : ''}`} onClick={() => setDecisions((d) => ({ ...d, throughput: 'extreme' }))}>Extreme (Millions RPS)</button>
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Static IPs needed per Availability Zone?</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className={`anl-btn ${decisions.staticIp === 'no' ? 'anl-on' : ''}`} onClick={() => setDecisions((d) => ({ ...d, staticIp: 'no' }))}>No (Use DNS name)</button>
                    <button className={`anl-btn ${decisions.staticIp === 'yes' ? 'anl-on' : ''}`} onClick={() => setDecisions((d) => ({ ...d, staticIp: 'yes' }))}>Yes (IP whitelisting)</button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Deep Third-Party Security Packet Inspection?</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className={`anl-btn ${decisions.inspection === 'no' ? 'anl-on' : ''}`} onClick={() => setDecisions((d) => ({ ...d, inspection: 'no' }))}>No (Standard load balancing)</button>
                    <button className={`anl-btn ${decisions.inspection === 'yes' ? 'anl-on' : ''}`} onClick={() => setDecisions((d) => ({ ...d, inspection: 'yes' }))}>Yes (GENEVE tunneling)</button>
                  </div>
                </div>
              </div>

              <div className="anl-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--color-background-secondary)' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: recommendation.color, marginBottom: '6px' }}>
                  {recommendation.title}
                </div>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                  {recommendation.desc}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ALB PANEL */}
        {activeSection === 'alb' && (
          <div>
            <div className="anl-sec">Application Load Balancer Layer 7 Smart Routing</div>
            <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '20px', alignItems: 'start' }}>
              
              {/* Left Column: Interactive Rules SVG and Dynamic Pathways */}
              <div className="anl-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#070a13', border: '0.5px solid var(--color-border-secondary)' }}>
                <div style={{ alignSelf: 'flex-start', fontWeight: 'bold', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '10px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>L7 Host, Path &amp; Header Rule Evaluator</span>
                  {matchedRule && <span style={{ color: '#22c55e' }}>✅ Matched: {matchedRule}</span>}
                </div>
                
                <svg width="100%" viewBox="0 0 420 280" style={{ display: 'block' }}>
                  <defs>
                    <linearGradient id="g-orange-alb" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ea580c" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                    <filter id="glow-orange-alb" x="-15%" y="-15%" width="130%" height="130%">
                      <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#f97316" floodOpacity="0.75" />
                    </filter>
                  </defs>

                  {/* Browser / Client Node */}
                  <g opacity={1} className={albIsAnimating ? 'active-glow-node' : ''} style={{ '--pulse-color': '#ea580c' } as React.CSSProperties}>
                    <rect x="10" y="115" width="65" height="46" rx="6" fill="#1e293b" stroke="#ea580c" strokeWidth={albIsAnimating ? 2 : 1}/>
                    <text x="42.5" y="133" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">💻 Browser</text>
                    <text x="42.5" y="146" textAnchor="middle" fontSize="7" fill="#94a3b8" fontFamily="monospace">{albMethod} Request</text>
                    
                    {/* Session Cookie Visual Indicator inside client */}
                    {matchedRule && matchedRule !== 'Rule 6 (Priority 60)' && (
                      <g transform="translate(48, 8)">
                        <circle cx="0" cy="0" r="5" fill="#fca5a5"/>
                        <text x="0" y="2.5" textAnchor="middle" fontSize="7" fill="#7c2d12" fontWeight="bold">🍪</text>
                      </g>
                    )}
                  </g>

                  {/* ALB L7 intake portal */}
                  <g opacity={1} className={albIsAnimating ? 'active-glow-node' : ''} style={{ '--pulse-color': '#ea580c' } as React.CSSProperties}>
                    <rect x="105" y="95" width="90" height="90" rx="8" fill="#1e1b4b" stroke="#ea580c" strokeWidth={albIsAnimating ? 2 : 1}/>
                    <text x="150" y="122" textAnchor="middle" fontSize="11" fill="#ffedd5" fontWeight="bold">ALB L7</text>
                    <text x="150" y="136" textAnchor="middle" fontSize="8" fill="#fca5a5">Rules Engine</text>
                    <text x="150" y="150" textAnchor="middle" fontSize="7.5" fill="#94a3b8" fontFamily="monospace">Port 443 SSL</text>
                    
                    {/* Visual Check/Cross lights */}
                    {albCheckingRuleIndex !== -1 && (
                      <circle cx="150" cy="168" r="5" fill="#eab308" className="active-glow-node" style={{ '--pulse-color': '#eab308' } as React.CSSProperties}/>
                    )}
                    {matchedRule && albCheckingRuleIndex === -1 && (
                      <circle cx="150" cy="168" r="5" fill="#22c55e"/>
                    )}
                  </g>

                  {/* Ingress packet flow path */}
                  <line x1="75" y1="138" x2="105" y2="138" stroke={albIsAnimating ? '#ea580c' : '#475569'} strokeWidth={albIsAnimating ? 2.5 : 1} className={albIsAnimating ? 'flow-active-line' : ''} />

                  {/* 6 Target groups in visual racks */}
                  
                  {/* TG1: user-service-tg */}
                  <g opacity={matchedRule.includes('Rule 1') ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="250" y="10" width="160" height="36" rx="5" fill="#0f172a" stroke={matchedRule.includes('Rule 1') ? '#22c55e' : '#475569'} strokeWidth={matchedRule.includes('Rule 1') ? 2 : 0.5}/>
                    <text x="258" y="24" fontSize="9" fill={matchedRule.includes('Rule 1') ? '#4ade80' : '#e2e8f0'} fontWeight="bold">user-service-tg</text>
                    <text x="258" y="38" fontSize="7" fill="#94a3b8">EC2 pool (Port 8080) · us-east-1a</text>
                  </g>
                  <path
                    d="M 195 120 L 225 120 L 225 28 L 250 28"
                    fill="none"
                    stroke={matchedRule.includes('Rule 1') ? '#ea580c' : '#475569'}
                    strokeWidth={matchedRule.includes('Rule 1') ? 2.5 : 1}
                    className={matchedRule.includes('Rule 1') && albIsAnimating ? 'flow-active-line' : ''}
                  />

                  {/* TG2: order-service-tg */}
                  <g opacity={matchedRule.includes('Rule 2') ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="250" y="52" width="160" height="36" rx="5" fill="#0f172a" stroke={matchedRule.includes('Rule 2') ? '#22c55e' : '#475569'} strokeWidth={matchedRule.includes('Rule 2') ? 2 : 0.5}/>
                    <text x="258" y="66" fontSize="9" fill={matchedRule.includes('Rule 2') ? '#4ade80' : '#e2e8f0'} fontWeight="bold">order-service-tg</text>
                    <text x="258" y="80" fontSize="7" fill="#94a3b8">EC2 pool (Port 8081) · us-east-1b</text>
                  </g>
                  <path
                    d="M 195 128 L 230 128 L 230 70 L 250 70"
                    fill="none"
                    stroke={matchedRule.includes('Rule 2') ? '#ea580c' : '#475569'}
                    strokeWidth={matchedRule.includes('Rule 2') ? 2.5 : 1}
                    className={matchedRule.includes('Rule 2') && albIsAnimating ? 'flow-active-line' : ''}
                  />

                  {/* TG3: premium-only-tg */}
                  <g opacity={matchedRule.includes('Rule 3') ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="250" y="94" width="160" height="36" rx="5" fill="#0f172a" stroke={matchedRule.includes('Rule 3') ? '#22c55e' : '#475569'} strokeWidth={matchedRule.includes('Rule 3') ? 2 : 0.5}/>
                    <text x="258" y="108" fontSize="9" fill={matchedRule.includes('Rule 3') ? '#4ade80' : '#e2e8f0'} fontWeight="bold">premium-only-tg 💎</text>
                    <text x="258" y="122" fontSize="7" fill="#94a3b8">Dedicated VPS (Port 8000) · us-east-1a</text>
                  </g>
                  <path
                    d="M 195 136 L 250 136"
                    fill="none"
                    stroke={matchedRule.includes('Rule 3') ? '#ea580c' : '#475569'}
                    strokeWidth={matchedRule.includes('Rule 3') ? 2.5 : 1}
                    className={matchedRule.includes('Rule 3') && albIsAnimating ? 'flow-active-line' : ''}
                  />

                  {/* TG4: special-tg */}
                  <g opacity={matchedRule.includes('Rule 4') ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="250" y="136" width="160" height="36" rx="5" fill="#0f172a" stroke={matchedRule.includes('Rule 4') ? '#22c55e' : '#475569'} strokeWidth={matchedRule.includes('Rule 4') ? 2 : 0.5}/>
                    <text x="258" y="150" fontSize="9" fill={matchedRule.includes('Rule 4') ? '#4ade80' : '#e2e8f0'} fontWeight="bold">special-tg 🚨</text>
                    <text x="258" y="164" fontSize="7" fill="#94a3b8">Canary target pool (Port 9000)</text>
                  </g>
                  <path
                    d="M 195 144 L 230 144 L 230 154 L 250 154"
                    fill="none"
                    stroke={matchedRule.includes('Rule 4') ? '#ea580c' : '#475569'}
                    strokeWidth={matchedRule.includes('Rule 4') ? 2.5 : 1}
                    className={matchedRule.includes('Rule 4') && albIsAnimating ? 'flow-active-line' : ''}
                  />

                  {/* TG5: blog-wordpress-tg */}
                  <g opacity={matchedRule.includes('Rule 5') ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="250" y="178" width="160" height="36" rx="5" fill="#0f172a" stroke={matchedRule.includes('Rule 5') ? '#22c55e' : '#475569'} strokeWidth={matchedRule.includes('Rule 5') ? 2 : 0.5}/>
                    <text x="258" y="192" fontSize="9" fill={matchedRule.includes('Rule 5') ? '#4ade80' : '#e2e8f0'} fontWeight="bold">blog-wordpress-tg</text>
                    <text x="258" y="206" fontSize="7" fill="#94a3b8">Wordpress Server (Port 80) · us-east-1c</text>
                  </g>
                  <path
                    d="M 195 152 L 225 152 L 225 196 L 250 196"
                    fill="none"
                    stroke={matchedRule.includes('Rule 5') ? '#ea580c' : '#475569'}
                    strokeWidth={matchedRule.includes('Rule 5') ? 2.5 : 1}
                    className={matchedRule.includes('Rule 5') && albIsAnimating ? 'flow-active-line' : ''}
                  />

                  {/* TG6: static-s3-tg */}
                  <g opacity={matchedRule.includes('Rule 6') || matchedRule === 'Default Ruleset' ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="250" y="220" width="160" height="36" rx="5" fill="#0f172a" stroke={matchedRule.includes('Rule 6') || matchedRule === 'Default Ruleset' ? '#22c55e' : '#475569'} strokeWidth={matchedRule.includes('Rule 6') || matchedRule === 'Default Ruleset' ? 2 : 0.5}/>
                    <text x="258" y="234" fontSize="9" fill={matchedRule.includes('Rule 6') || matchedRule === 'Default Ruleset' ? '#4ade80' : '#e2e8f0'} fontWeight="bold">
                      {matchedRule === 'Default Ruleset' ? 'default-s3-website-tg' : 'static-s3-tg 🪣'}
                    </text>
                    <text x="258" y="248" fontSize="7" fill="#94a3b8">S3 Bucket Web Origin redirect</text>
                  </g>
                  <path
                    d="M 195 160 L 215 160 L 215 238 L 250 238"
                    fill="none"
                    stroke={matchedRule.includes('Rule 6') || matchedRule === 'Default Ruleset' ? '#ea580c' : '#475569'}
                    strokeWidth={matchedRule.includes('Rule 6') || matchedRule === 'Default Ruleset' ? 2.5 : 1}
                    className={(matchedRule.includes('Rule 6') || matchedRule === 'Default Ruleset') && albIsAnimating ? 'flow-active-line' : ''}
                  />

                  {/* Animated motion packets along active path */}
                  {albIsAnimating && matchedRule.includes('Rule 1') && <circle r="4.5" fill="#ea580c" filter="url(#glow-orange-alb)"><animateMotion dur="1.8s" repeatCount="indefinite" path="M 75 138 L 105 138 M 195 120 L 225 120 L 225 28 L 250 28" /></circle>}
                  {albIsAnimating && matchedRule.includes('Rule 2') && <circle r="4.5" fill="#ea580c" filter="url(#glow-orange-alb)"><animateMotion dur="1.8s" repeatCount="indefinite" path="M 75 138 L 105 138 M 195 128 L 230 128 L 230 70 L 250 70" /></circle>}
                  {albIsAnimating && matchedRule.includes('Rule 3') && <circle r="4.5" fill="#ea580c" filter="url(#glow-orange-alb)"><animateMotion dur="1.8s" repeatCount="indefinite" path="M 75 138 L 105 138 M 195 136 L 250 136" /></circle>}
                  {albIsAnimating && matchedRule.includes('Rule 4') && <circle r="4.5" fill="#ea580c" filter="url(#glow-orange-alb)"><animateMotion dur="1.8s" repeatCount="indefinite" path="M 75 138 L 105 138 M 195 144 L 230 144 L 230 154 L 250 154" /></circle>}
                  {albIsAnimating && matchedRule.includes('Rule 5') && <circle r="4.5" fill="#ea580c" filter="url(#glow-orange-alb)"><animateMotion dur="1.8s" repeatCount="indefinite" path="M 75 138 L 105 138 M 195 152 L 225 152 L 225 196 L 250 196" /></circle>}
                  {albIsAnimating && matchedRule.includes('Rule 6') && <circle r="4.5" fill="#ea580c" filter="url(#glow-orange-alb)"><animateMotion dur="1.8s" repeatCount="indefinite" path="M 75 138 L 105 138 M 195 160 L 215 160 L 215 238 L 250 238" /></circle>}
                  {albIsAnimating && matchedRule === 'Default Ruleset' && <circle r="4.5" fill="#ea580c" filter="url(#glow-orange-alb)"><animateMotion dur="1.8s" repeatCount="indefinite" path="M 75 138 L 105 138 M 195 160 L 215 160 L 215 238 L 250 238" /></circle>}
                </svg>
              </div>

              {/* Right Column: Custom HTTP Builder & Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* 1. Raw HTTP Request code block */}
                <div className="anl-card" style={{ borderLeft: '3px solid #ea580c', padding: '10px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: '#ea580c', display: 'flex', justifyContent: 'space-between' }}>
                    <span>🌐 Constructed HTTP Request</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)' }}>L7 Envelope</span>
                  </div>
                  <pre className="anl-log" style={{ fontSize: '10px', minHeight: '80px', margin: 0, padding: '8px', overflowX: 'auto', background: 'var(--color-background-secondary)' }}>{`\
${albMethod} ${albPathInput}${albQuery ? '?' + albQuery : ''} HTTP/1.1
Host: ${albHostInput}
${albHeaderKey ? albHeaderKey + ': ' + albHeaderVal : ''}
User-Agent: Mozilla/5.0 (Macintosh; Intel OS X)
Accept: application/json
Connection: keep-alive`}</pre>
                </div>

                {/* 2. Rules Evaluation sequential checklists */}
                <div className="anl-card" style={{ border: '1.5px solid #ea580c' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>L7 Rules Engine Evaluator</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    ALB scans list rules from top-to-bottom sequentially based on priority ratings:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                    <div className={`rule-item ${albCheckingRuleIndex === 0 ? 'checking' : matchedRule.includes('Rule 1') ? 'matched' : albCheckingRuleIndex > 0 || matchedRule ? 'mismatched' : ''}`}>
                      <span><b>Prio 10:</b> Host == <code>api.*</code> &amp; Path == <code>/users*</code></span>
                      <span>{matchedRule.includes('Rule 1') ? '✅ MATCH' : albCheckingRuleIndex === 0 ? '⏳ SCAN' : '—'}</span>
                    </div>
                    <div className={`rule-item ${albCheckingRuleIndex === 1 ? 'checking' : matchedRule.includes('Rule 2') ? 'matched' : (albCheckingRuleIndex > 1 || matchedRule) ? 'mismatched' : ''}`}>
                      <span><b>Prio 20:</b> Host == <code>api.*</code> &amp; Path == <code>/orders*</code></span>
                      <span>{matchedRule.includes('Rule 2') ? '✅ MATCH' : albCheckingRuleIndex === 1 ? '⏳ SCAN' : '—'}</span>
                    </div>
                    <div className={`rule-item ${albCheckingRuleIndex === 2 ? 'checking' : matchedRule.includes('Rule 3') ? 'matched' : (albCheckingRuleIndex > 2 || matchedRule) ? 'mismatched' : ''}`}>
                      <span><b>Prio 30:</b> QueryString has <code>tier=premium</code></span>
                      <span>{matchedRule.includes('Rule 3') ? '✅ MATCH' : albCheckingRuleIndex === 2 ? '⏳ SCAN' : '—'}</span>
                    </div>
                    <div className={`rule-item ${albCheckingRuleIndex === 3 ? 'checking' : matchedRule.includes('Rule 4') ? 'matched' : (albCheckingRuleIndex > 3 || matchedRule) ? 'mismatched' : ''}`}>
                      <span><b>Prio 40:</b> Header <code>X-Custom-Header</code> == <code>special</code></span>
                      <span>{matchedRule.includes('Rule 4') ? '✅ MATCH' : albCheckingRuleIndex === 3 ? '⏳ SCAN' : '—'}</span>
                    </div>
                    <div className={`rule-item ${albCheckingRuleIndex === 4 ? 'checking' : matchedRule.includes('Rule 5') ? 'matched' : (albCheckingRuleIndex > 4 || matchedRule) ? 'mismatched' : ''}`}>
                      <span><b>Prio 50:</b> Host == <code>blog.*</code></span>
                      <span>{matchedRule.includes('Rule 5') ? '✅ MATCH' : albCheckingRuleIndex === 4 ? '⏳ SCAN' : '—'}</span>
                    </div>
                    <div className={`rule-item ${albCheckingRuleIndex === 5 ? 'checking' : matchedRule.includes('Rule 6') ? 'matched' : (albCheckingRuleIndex > 5 || matchedRule) ? 'mismatched' : ''}`}>
                      <span><b>Prio 60:</b> Path == <code>/static/*</code></span>
                      <span>{matchedRule.includes('Rule 6') ? '✅ MATCH' : albCheckingRuleIndex === 5 ? '⏳ SCAN' : '—'}</span>
                    </div>
                    <div className={`rule-item ${albCheckingRuleIndex === 6 ? 'checking' : matchedRule === 'Default Ruleset' ? 'matched' : matchedRule ? 'mismatched' : ''}`}>
                      <span><b>Default:</b> Forward static fallback redirect</span>
                      <span>{matchedRule === 'Default Ruleset' ? '✅ MATCH' : '—'}</span>
                    </div>
                  </div>

                  {/* HTTP Request Builder form controls */}
                  <div style={{ background: 'var(--color-background-secondary)', padding: '10px', borderRadius: '6px', marginBottom: '8px' }}>
                    <div style={{ fontWeight: 600, fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>HTTP Packet Constructor</div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                      <div>
                        <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>Method</label>
                        <select value={albMethod} onChange={(e) => setAlbMethod(e.target.value as any)} style={{ width: '100%', fontSize: '10.5px', padding: '4px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}>
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>Host Header</label>
                        <select value={albHostInput} onChange={(e) => setAlbHostInput(e.target.value)} style={{ width: '100%', fontSize: '10.5px', padding: '4px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}>
                          <option value="api.example.com">api.example.com</option>
                          <option value="blog.example.com">blog.example.com</option>
                          <option value="shop.example.com">shop.example.com</option>
                          <option value="default.example.com">default.example.com</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '6px' }}>
                      <div>
                        <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>URL Path</label>
                        <select value={albPathInput} onChange={(e) => setAlbPathInput(e.target.value)} style={{ width: '100%', fontSize: '10.5px', padding: '4px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}>
                          <option value="/api/v1/users">/api/v1/users</option>
                          <option value="/api/v1/orders">/api/v1/orders</option>
                          <option value="/static/logo.png">/static/logo.png</option>
                          <option value="/index.html">/index.html</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>Query String</label>
                        <select value={albQuery} onChange={(e) => setAlbQuery(e.target.value)} style={{ width: '100%', fontSize: '10.5px', padding: '4px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}>
                          <option value="tier=premium">tier=premium</option>
                          <option value="tier=standard">tier=standard</option>
                          <option value="">(None)</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div>
                        <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>Header Key</label>
                        <input type="text" value={albHeaderKey} onChange={(e) => setAlbHeaderKey(e.target.value)} style={{ width: '100%', fontSize: '10.5px', padding: '4px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}/>
                      </div>
                      <div>
                        <label style={{ fontSize: '9px', color: 'var(--color-text-secondary)' }}>Header Value</label>
                        <input type="text" value={albHeaderVal} onChange={(e) => setAlbHeaderVal(e.target.value)} style={{ width: '100%', fontSize: '10.5px', padding: '4px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}/>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="anl-btn anl-on" style={{ flex: 1, fontWeight: 'bold' }} onClick={simulateALBRouting} disabled={albIsAnimating}>
                      {albIsAnimating ? 'Sequencing Rules... ⏳' : 'Dispatch HTTP L7 Request ▶'}
                    </button>
                    <button className="anl-btn" onClick={() => { setAlbLogs([]); setMatchedRule(''); setAlbCheckingRuleIndex(-1); }}>Reset Logs</button>
                  </div>
                </div>

                {/* ALB Premium Mnemonic Card */}
                <div className="anl-card" style={{
                  border: '1.5px solid #fdba74',
                  background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                  padding: '12px 14px',
                  borderRadius: '8px'
                }}>
                  <div style={{ color: '#c2410c', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    🧠 Systems Memory Mnemonic
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#7c2d12', marginBottom: '4px' }}>
                    ALB = "The Intelligent Postmaster"
                  </div>
                  <div style={{ fontSize: '11px', color: '#431407', lineHeight: '1.4' }}>
                    Unlike raw routers, the Postmaster opens the HTTP envelope (SSL Decryption), reads the Host and Path letters (Host/Path listener rules), checks the return cookie (stickiness), and handles delivery to the exact AZ microservice targets.
                  </div>
                </div>

              </div>
            </div>

            {/* LIVE EVENT LOG */}
            <div className="anl-sec" style={{ marginTop: '16px' }}>ALB Rules Evaluation Stream Logs</div>
            <div className="anl-card" style={{ marginBottom: '14px' }}>
              <div className="anl-log" style={{ minHeight: '90px', maxHeight: '130px', overflowY: 'auto' }}>
                {albLogs.length === 0 ? '; Waiting for HTTP request dispatch above...\n; Construct request parameters and trigger the Dispatch to watch the rules engine scanning cascade live!' : albLogs.join('\n')}
              </div>
            </div>
          </div>
        )}

        {/* NLB PANEL */}
        {activeSection === 'nlb' && (
          <div>
            <div className="anl-sec">Network Load Balancer Layer 4 Flow Hashing</div>
            <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '20px', alignItems: 'start' }}>
              
              {/* Left Column: Widescreen Flow Hashing SVG */}
              <div className="anl-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#070a13', border: '0.5px solid var(--color-border-secondary)' }}>
                <div style={{ alignSelf: 'flex-start', fontWeight: 'bold', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '10px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>L4 5-Tuple Flow Hashing Engine &amp; DSR path</span>
                  {activeNlbTarget && <span style={{ color: '#38bdf8' }}>🎯 Selected: Target Server {activeNlbTarget}</span>}
                </div>
                
                <svg width="100%" viewBox="0 0 420 280" style={{ display: 'block' }}>
                  <defs>
                    <linearGradient id="g-blue-nlb" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0284c7" />
                      <stop offset="100%" stopColor="#38bdf8" />
                    </linearGradient>
                    <filter id="glow-blue-nlb" x="-15%" y="-15%" width="130%" height="130%">
                      <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#38bdf8" floodOpacity="0.75" />
                    </filter>
                  </defs>

                  {/* TCP Client App socket node */}
                  <g opacity={1} className={activeNlbTarget ? 'active-glow-node' : ''} style={{ '--pulse-color': '#0284c7' } as React.CSSProperties}>
                    <rect x="10" y="115" width="75" height="50" rx="6" fill="#1e293b" stroke="#0284c7" strokeWidth={activeNlbTarget ? 2 : 1}/>
                    <text x="47.5" y="133" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">🏢 Client App</text>
                    <text x="47.5" y="145" textAnchor="middle" fontSize="7" fill="#60a5fa">IP Preserved</text>
                    <text x="47.5" y="156" textAnchor="middle" fontSize="6.5" fill="#94a3b8" fontFamily="monospace">{currentNlbClient || `${nlbSrcIp}:${nlbSrcPort}`}</text>
                  </g>

                  {/* Connection from Client to NLB */}
                  <line x1="85" y1="140" x2="115" y2="140" stroke={activeNlbTarget ? '#0284c7' : '#475569'} strokeWidth={activeNlbTarget ? 2.5 : 1} className={activeNlbTarget ? 'flow-active-line' : ''} />

                  {/* NLB Hashing Engine Node */}
                  <g opacity={1} className={activeNlbTarget ? 'active-glow-node' : ''} style={{ '--pulse-color': '#0284c7' } as React.CSSProperties}>
                    <rect x="115" y="95" width="95" height="90" rx="8" fill="#0f172a" stroke="#0284c7" strokeWidth={activeNlbTarget ? 2 : 1}/>
                    <text x="162.5" y="114" textAnchor="middle" fontSize="10" fill="#bae6fd" fontWeight="bold">NLB Engine</text>
                    <text x="162.5" y="127" textAnchor="middle" fontSize="8" fill="#94a3b8">Stateless Flow Hash</text>
                    
                    {/* Live Digital Hash Display */}
                    <rect x="125" y="138" width="75" height="20" rx="4" fill="#0284c715" stroke="#38bdf8" strokeWidth="0.5"/>
                    <text x="162.5" y="151" textAnchor="middle" fontSize="9" fill="#38bdf8" fontWeight="bold" fontFamily="monospace">
                      {currentNlbHash || '0x0000'}
                    </text>
                    <text x="162.5" y="174" textAnchor="middle" fontSize="7.5" fill="#bae6fd" fontWeight="bold" fontFamily="monospace">ASIC-L4 Hashing</text>
                  </g>

                  {/* Target Servers */}
                  
                  {/* Target Server A */}
                  <g opacity={activeNlbTarget === 'A' ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="260" y="20" width="150" height="42" rx="6" fill="#0f172a" stroke={activeNlbTarget === 'A' ? '#22c55e' : '#475569'} strokeWidth={activeNlbTarget === 'A' ? 2 : 0.5}/>
                    <text x="270" y="37" fontSize="10" fill={activeNlbTarget === 'A' ? '#4ade80' : '#e2e8f0'} fontWeight="bold">Target Server A</text>
                    <text x="270" y="51" fontSize="7.5" fill="#94a3b8">AZ us-east-1a · IP preservation</text>
                  </g>
                  <path
                    d="M 210 130 L 235 130 L 235 41 L 260 41"
                    fill="none"
                    stroke={activeNlbTarget === 'A' ? '#0284c7' : '#475569'}
                    strokeWidth={activeNlbTarget === 'A' ? 2.5 : 1}
                    className={activeNlbTarget === 'A' ? 'flow-active-line' : ''}
                  />

                  {/* Target Server B */}
                  <g opacity={activeNlbTarget === 'B' ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="260" y="105" width="150" height="42" rx="6" fill="#0f172a" stroke={activeNlbTarget === 'B' ? '#22c55e' : '#475569'} strokeWidth={activeNlbTarget === 'B' ? 2 : 0.5}/>
                    <text x="270" y="122" fontSize="10" fill={activeNlbTarget === 'B' ? '#4ade80' : '#e2e8f0'} fontWeight="bold">Target Server B</text>
                    <text x="270" y="136" fontSize="7.5" fill="#94a3b8">AZ us-east-1b · IP preservation</text>
                  </g>
                  <path
                    d="M 210 140 L 260 140"
                    fill="none"
                    stroke={activeNlbTarget === 'B' ? '#0284c7' : '#475569'}
                    strokeWidth={activeNlbTarget === 'B' ? 2.5 : 1}
                    className={activeNlbTarget === 'B' ? 'flow-active-line' : ''}
                  />

                  {/* Target Server C */}
                  <g opacity={activeNlbTarget === 'C' ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="260" y="190" width="150" height="42" rx="6" fill="#0f172a" stroke={activeNlbTarget === 'C' ? '#22c55e' : '#475569'} strokeWidth={activeNlbTarget === 'C' ? 2 : 0.5}/>
                    <text x="270" y="207" fontSize="10" fill={activeNlbTarget === 'C' ? '#4ade80' : '#e2e8f0'} fontWeight="bold">Target Server C</text>
                    <text x="270" y="221" fontSize="7.5" fill="#94a3b8">AZ us-east-1c · IP preservation</text>
                  </g>
                  <path
                    d="M 210 150 L 235 150 L 235 211 L 260 211"
                    fill="none"
                    stroke={activeNlbTarget === 'C' ? '#0284c7' : '#475569'}
                    strokeWidth={activeNlbTarget === 'C' ? 2.5 : 1}
                    className={activeNlbTarget === 'C' ? 'flow-active-line' : ''}
                  />

                  {/* Direct Server Return (DSR) Path vs Proxy Path */}
                  {activeNlbTarget === 'A' && nlbReturnMode === 'dsr' && (
                    <path
                      d="M 335 62 L 335 80 L 47.5 80 L 47.5 115"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      className="flow-active-line"
                    />
                  )}
                  {activeNlbTarget === 'A' && nlbReturnMode === 'proxy' && (
                    <path
                      d="M 335 62 L 335 80 L 162.5 80 L 162.5 95 M 162.5 95 M 115 140 L 85 140"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      className="flow-active-line"
                    />
                  )}

                  {activeNlbTarget === 'B' && nlbReturnMode === 'dsr' && (
                    <path
                      d="M 335 147 L 335 165 L 335 175 L 47.5 175 L 47.5 165"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      className="flow-active-line"
                    />
                  )}
                  {activeNlbTarget === 'B' && nlbReturnMode === 'proxy' && (
                    <path
                      d="M 335 147 L 335 165 L 210 165 L 210 150 M 115 140 L 85 140"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      className="flow-active-line"
                    />
                  )}

                  {activeNlbTarget === 'C' && nlbReturnMode === 'dsr' && (
                    <path
                      d="M 335 232 L 335 255 L 47.5 255 L 47.5 165"
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      className="flow-active-line"
                    />
                  )}
                  {activeNlbTarget === 'C' && nlbReturnMode === 'proxy' && (
                    <path
                      d="M 335 232 L 335 255 L 162.5 255 L 162.5 185 M 115 140 L 85 140"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      className="flow-active-line"
                    />
                  )}

                  {activeNlbTarget && nlbReturnMode === 'dsr' && (
                    <text x="180" y="74" textAnchor="middle" fontSize="7.5" fill="#22d3ee" fontWeight="bold">↩️ Direct Server Return (NLB Bypassed outbound)</text>
                  )}
                  {activeNlbTarget && nlbReturnMode === 'proxy' && (
                    <text x="180" y="74" textAnchor="middle" fontSize="7.5" fill="#fca5a5" fontWeight="bold">⚠️ Proxy Loop Bottleneck (Outbound hits LB)</text>
                  )}

                  {/* Animated motion packets along active paths */}
                  {activeNlbTarget === 'A' && <circle r="4" fill="#38bdf8" filter="url(#glow-blue-nlb)"><animateMotion dur="1.8s" repeatCount="indefinite" path="M 85 140 L 115 140 M 210 130 L 235 130 L 235 41 L 260 41" /></circle>}
                  {activeNlbTarget === 'B' && <circle r="4" fill="#38bdf8" filter="url(#glow-blue-nlb)"><animateMotion dur="1.8s" repeatCount="indefinite" path="M 85 140 L 115 140 M 210 140 L 260 140" /></circle>}
                  {activeNlbTarget === 'C' && <circle r="4" fill="#38bdf8" filter="url(#glow-blue-nlb)"><animateMotion dur="1.8s" repeatCount="indefinite" path="M 85 140 L 115 140 M 210 150 L 235 150 L 235 211 L 260 211" /></circle>}
                </svg>
              </div>

              {/* Right Column: 5-Tuple packet constructor and Live Math FNV HUD */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* 1. Return Path Toggle (Interactive DSR) */}
                <div className="anl-card" style={{ borderLeft: '3px solid #0369a1', padding: '10px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: '#0284c7' }}>Outbound Response Pathing</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      className={`anl-btn ${nlbReturnMode === 'dsr' ? 'anl-on-nlb' : ''}`}
                      onClick={() => setNlbReturnMode('dsr')}
                      style={{ flex: 1, fontSize: '10.5px', padding: '5px 8px' }}
                    >
                      ↩️ DSR (Direct)
                    </button>
                    <button
                      className={`anl-btn ${nlbReturnMode === 'proxy' ? 'anl-on-nlb' : ''}`}
                      onClick={() => setNlbReturnMode('proxy')}
                      style={{ flex: 1, fontSize: '10.5px', padding: '5px 8px' }}
                    >
                      🔄 Proxy Return
                    </button>
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '6px', lineHeight: '1.3' }}>
                    {nlbReturnMode === 'dsr'
                      ? 'Client IP is fully preserved. The backend server responds directly to client browser bypassing the load balancer, saving massive network bandwidth.'
                      : 'All outbound traffic is proxied through the load balancer, which limits maximum outbound connection throughput and increases latency.'}
                  </div>
                </div>

                {/* 2. 5-Tuple Constructor Panel */}
                <div className="anl-card" style={{ border: '1.5px solid #0369a1' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>L4 5-Tuple Socket Constructor</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    Set custom TCP/UDP headers. NLB does not edit payloads; it hashes socket data to route traffic:
                  </div>

                  <div style={{ background: 'var(--color-background-secondary)', padding: '10px', borderRadius: '6px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>1. PROTOCOL</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button className={`anl-btn ${nlbProtocol === 'TCP' ? 'anl-on-nlb' : ''}`} style={{ fontSize: '9px', padding: '2px 6px' }} onClick={() => setNlbProtocol('TCP')}>TCP</button>
                        <button className={`anl-btn ${nlbProtocol === 'UDP' ? 'anl-on-nlb' : ''}`} style={{ fontSize: '9px', padding: '2px 6px' }} onClick={() => setNlbProtocol('UDP')}>UDP</button>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <div style={{ flex: 3 }}>
                        <label style={{ fontSize: '9px', display: 'block', color: 'var(--color-text-secondary)' }}>2. CLIENT IP (Src)</label>
                        <input type="text" value={nlbSrcIp} onChange={(e) => setNlbSrcIp(e.target.value)} style={{ width: '100%', fontSize: '10.5px', padding: '4px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}/>
                      </div>
                      <div style={{ flex: 2 }}>
                        <label style={{ fontSize: '9px', display: 'block', color: 'var(--color-text-secondary)' }}>3. PORT (Src)</label>
                        <input type="number" min="1024" max="65535" value={nlbSrcPort} onChange={(e) => setNlbSrcPort(parseInt(e.target.value) || 1024)} style={{ width: '100%', fontSize: '10.5px', padding: '4px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}/>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <div style={{ flex: 3 }}>
                        <label style={{ fontSize: '9px', display: 'block', color: 'var(--color-text-secondary)' }}>4. NLB VIP (Dst)</label>
                        <input type="text" value={nlbDstIp} disabled style={{ width: '100%', fontSize: '10.5px', padding: '4px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', opacity: 0.7 }}/>
                      </div>
                      <div style={{ flex: 2 }}>
                        <label style={{ fontSize: '9px', display: 'block', color: 'var(--color-text-secondary)' }}>5. PORT (Dst)</label>
                        <input type="number" value={nlbDstPort} onChange={(e) => setNlbDstPort(parseInt(e.target.value) || 80)} style={{ width: '100%', fontSize: '10.5px', padding: '4px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}/>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button className="anl-btn anl-on-nlb" style={{ flex: 1, fontWeight: 'bold' }} onClick={simulateNLBConnection}>
                      Send Packet Flow ▶
                    </button>
                    <button className="anl-btn" onClick={() => { setNlbConnections([]); setNlbLogs([]); setActiveNlbTarget(null); setCurrentNlbClient(''); setCurrentNlbHash(''); }}>Clear Logs</button>
                  </div>

                  {/* Math Equation HUD Block */}
                  <div style={{ background: 'var(--color-background-secondary)', padding: '8px 10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '9.5px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>🧮 Stateless Hashing Equation</div>
                    <pre className="anl-log" style={{ fontSize: '10px', margin: 0, padding: '6px', background: 'var(--color-background-primary)', color: '#38bdf8', overflowX: 'auto' }}>{`\
Hash = FNV1a(5-Tuple)
     = FNV1a("${nlbProtocol.toUpperCase()}:${nlbSrcIp}:${nlbSrcPort}->${nlbDstIp}:${nlbDstPort}")
     = ${currentNlbHash ? currentNlbHash + '...' : '0x000000'}
Target Server Index:
     = Hash % ${serverCount} Pools
     = ${activeNlbTarget ? 'Server ' + activeNlbTarget : '(Pending packet)'}`}</pre>
                  </div>
                </div>

                {/* NLB Premium Mnemonic Card */}
                <div className="anl-card" style={{
                  border: '1.5px solid #7dd3fc',
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  padding: '12px 14px',
                  borderRadius: '8px'
                }}>
                  <div style={{ color: '#0369a1', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    🧠 Systems Memory Mnemonic
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0c4a6e', marginBottom: '4px' }}>
                    NLB = "The Lightspeed Track Switcher"
                  </div>
                  <div style={{ fontSize: '11px', color: '#0c4a6e', lineHeight: '1.4' }}>
                    The Track Switcher does not open cargo or read envelopes. It simply hashes the standard 5-tuple connection data in hardware ASICs (Protocol, Source IP/Port, Dest IP/Port) and maps the connection deterministic to the track with microsecond latencies.
                  </div>
                </div>

              </div>
            </div>

            {/* LIVE EVENT LOG */}
            <div className="anl-sec" style={{ marginTop: '16px' }}>L4 Hash Stream Resolution Connections</div>
            <div className="anl-card" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px', maxHeight: '100px', overflowY: 'auto' }}>
                {nlbConnections.length > 0 ? (
                  nlbConnections.map((conn, idx) => (
                    <div key={idx} style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', background: 'var(--color-background-secondary)', padding: '5px 10px', borderRadius: '4px', border: '0.5px solid var(--color-border-tertiary)' }}>
                      <span>Client: <code>{conn.client}</code></span>
                      <span style={{ color: '#38bdf8', fontWeight: 600 }}>Hash: {conn.hash}</span>
                      <span style={{ color: '#22c55e', fontWeight: 'bold' }}>→ {conn.server}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', padding: '6px', textAlign: 'center' }}>No active connection streams. Set variables and click dispatch above.</div>
                )}
              </div>
              <div className="anl-log" style={{ minHeight: '80px', maxHeight: '100px', overflowY: 'auto', fontSize: '10px' }}>
                {nlbLogs.length === 0 ? '; Waiting for L4 connection stream packages...' : nlbLogs.join('\n')}
              </div>
            </div>
          </div>
        )}

        {/* SIMULATION PANEL */}
        {activeSection === 'simulation' && (
          <div>
            <div className="anl-sec">Live Animated Traffic Simulator</div>
            <div className="anl-g2">
              <div className="anl-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ alignSelf: 'flex-start', fontWeight: 600, fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                  Interactive Load Balancer Canvas
                </div>
                <canvas
                  ref={canvasRef}
                  width="360"
                  height="260"
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                    background: 'var(--color-background-secondary)',
                    border: '0.5px solid var(--color-border-secondary)'
                  }}
                ></canvas>
              </div>

              <div>
                <div className="anl-card">
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px' }}>Simulation Controls</div>
                  
                  {/* Select Mode */}
                  <div style={{ marginBottom: '10px' }}>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Load Balancer Routing Mode:</span>
                    <select
                      value={simMode}
                      onChange={(e) => {
                        setSimMode(e.target.value as any);
                        cleanSimulatorCookies();
                      }}
                      style={{ width: '100%', fontSize: '12px', padding: '5px 8px', border: '2px solid #f59e0b', boxShadow: '0 0 0 3px rgba(245,158,11,0.2)', borderRadius: '6px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', outline: 'none' }}
                    >
                      <option value="alb_sticky">ALB Cookie Session Stickiness (Enabled)</option>
                      <option value="alb_no_sticky">ALB Dynamic Balancing (No Cookie)</option>
                      <option value="nlb_hash">NLB 5-Tuple Connection Flow Hashing</option>
                    </select>
                  </div>

                  {/* Server Count Slider */}
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Backend Server Pool: <b>{serverCount} Targets</b></span>
                    <input
                      type="range"
                      min="2"
                      max="3"
                      value={serverCount}
                      onChange={(e) => {
                        setServerCount(parseInt(e.target.value));
                        cleanSimulatorCookies();
                      }}
                      style={{ width: '100%', accentColor: simMode.startsWith('alb') ? '#c2410c' : '#0369a1', cursor: 'ew-resize' }}
                    />
                  </div>

                  {/* Target Health Toggles */}
                  <div style={{ marginBottom: '12px' }}>
                    <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Simulate Server Failures:</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {Array.from({ length: serverCount }).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            const newHealth = [...serverHealth];
                            newHealth[idx] = !newHealth[idx];
                            setServerHealth(newHealth);
                            setActiveTrafficLogs((prev) => [
                              `⚠️ Server ${String.fromCharCode(65 + idx)} health status toggled to: ${newHealth[idx] ? 'HEALTHY ✅' : 'FAILED ❌'}`,
                              ...prev
                            ]);
                          }}
                          style={{
                            flex: 1,
                            fontSize: '11px',
                            padding: '4px 6px',
                            background: serverHealth[idx] ? '#dcfce7' : '#fee2e2',
                            border: serverHealth[idx] ? '0.5px solid #86efac' : '0.5px solid #fca5a5',
                            color: serverHealth[idx] ? '#166534' : '#991b1b',
                            borderRadius: '6px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Server {String.fromCharCode(65 + idx)} {serverHealth[idx] ? '✅' : '❌'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Play & Reset Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className={`anl-btn ${simMode.startsWith('alb') ? 'anl-on' : 'anl-on-nlb'}`}
                      onClick={toggleSimulation}
                      style={{ flex: 1, fontWeight: 'bold' }}
                    >
                      {isRunning ? 'Stop Traffic ⏹' : 'Send Traffic ▶'}
                    </button>
                    {simMode === 'alb_sticky' && (
                      <button className="anl-btn" onClick={cleanSimulatorCookies}>Clear Cookies 🧹</button>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* LIVE EVENT LOG */}
            <div className="anl-sec">Live Traffic Resolution Log</div>
            <div className="anl-card" style={{ marginBottom: '14px' }}>
              <div className="anl-log" style={{ minHeight: '120px', maxHeight: '160px', overflowY: 'auto' }}>
                {activeTrafficLogs.join('\n')}
              </div>
            </div>
          </div>
        )}

        {/* INTEGRATIONS PANEL */}
        {activeSection === 'integrations' && (() => {
          const isNodeActive = (node: string) => {
            const steps = scSteps[infraScenario];
            const currentStep = steps[infraStep];
            return currentStep && currentStep.node === node;
          };

          const activeColor = 
            infraScenario === 'alb_ingress' ? '#ea580c' :
            infraScenario === 'nlb_throughput' ? '#0284c7' : '#7c3aed';

          const currentScenarioTitle = 
            infraScenario === 'alb_ingress' ? '🍔 Public ALB Secure Ingress (L7)' :
            infraScenario === 'nlb_throughput' ? '🔢 NLB Flow Hashing (Static EIPs)' : '🔌 VPC PrivateLink Secure Tunnel (PHZ)';

          return (
            <div>
              <div className="anl-sec">Interactive AWS Infrastructure &amp; Integration Explorer</div>
              
              {/* Scenario Toggles */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
                <button
                  className="anl-btn"
                  onClick={() => handleScenarioChange('alb_ingress')}
                  style={{
                    fontWeight: 'bold',
                    backgroundColor: infraScenario === 'alb_ingress' ? 'rgba(234, 88, 12, 0.15)' : 'var(--color-background-secondary)',
                    color: infraScenario === 'alb_ingress' ? '#ea580c' : 'var(--color-text-primary)',
                    borderColor: infraScenario === 'alb_ingress' ? '#ea580c' : 'var(--color-border-secondary)'
                  }}
                >
                  🍔 Public ALB Ingress (L7)
                </button>
                <button
                  className="anl-btn"
                  onClick={() => handleScenarioChange('nlb_throughput')}
                  style={{
                    fontWeight: 'bold',
                    backgroundColor: infraScenario === 'nlb_throughput' ? 'rgba(2, 132, 199, 0.15)' : 'var(--color-background-secondary)',
                    color: infraScenario === 'nlb_throughput' ? '#0284c7' : 'var(--color-text-primary)',
                    borderColor: infraScenario === 'nlb_throughput' ? '#0284c7' : 'var(--color-border-secondary)'
                  }}
                >
                  🔢 NLB Throughput (L4)
                </button>
                <button
                  className="anl-btn"
                  onClick={() => handleScenarioChange('privatelink')}
                  style={{
                    fontWeight: 'bold',
                    backgroundColor: infraScenario === 'privatelink' ? 'rgba(124, 58, 237, 0.15)' : 'var(--color-background-secondary)',
                    color: infraScenario === 'privatelink' ? '#7c3aed' : 'var(--color-text-primary)',
                    borderColor: infraScenario === 'privatelink' ? '#7c3aed' : 'var(--color-border-secondary)'
                  }}
                >
                  🔌 VPC PrivateLink (PHZ)
                </button>
              </div>

              {/* Layout grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '20px', alignItems: 'start' }}>
                
                {/* Left: Dynamic Widescreen SVG Map */}
                <div className="anl-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#f7fcf6ff', border: '0.5px solid var(--color-border-secondary)', padding: '16px' }}>
                  <div style={{ alignSelf: 'flex-start', display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>
                      🔍 {currentScenarioTitle}
                    </span>
                    <span style={{ fontSize: '11px', color: activeColor, fontWeight: 'bold' }}>
                      Step {infraStep + 1} of {scSteps[infraScenario].length}
                    </span>
                  </div>

                  <svg width="100%" viewBox="0 0 660 320" style={{ display: 'block' }}>
                    <defs>
                      <linearGradient id="g-orange" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ea580c" /><stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                      <linearGradient id="g-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0284c7" /><stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                      <linearGradient id="g-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#a78bfa" />
                      </linearGradient>
                    </defs>

                    {/* Shared VPC Boundary Box */}
                    <rect x="140" y="55" width="490" height="240" rx="12" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3,3"/>
                    <text x="150" y="70" fontSize="8" fill="#64748b" fontWeight="bold">VPC boundary (us-east-1)</text>

                    {/* Subnet Boundaries */}
                    <rect x="360" y="80" width="250" height="90" rx="8" fill="none" stroke="#1e293b" strokeWidth="0.8"/>
                    <text x="370" y="93" fontSize="7.5" fill="#64748b">🔒 Private Subnet AZ1</text>

                    <rect x="360" y="185" width="250" height="90" rx="8" fill="none" stroke="#1e293b" strokeWidth="0.8"/>
                    <text x="370" y="198" fontSize="7.5" fill="#64748b">🔒 Private Subnet AZ2</text>

                    {/* Nodes Rendering */}

                    {/* Node 1: Client Node */}
                    <g opacity={isNodeActive('client') || isNodeActive('phz') ? 1.0 : 0.7} className={isNodeActive('client') || isNodeActive('phz') ? 'active-glow-node' : ''} style={{ '--pulse-color': activeColor } as React.CSSProperties}>
                      <rect x="15" y="125" width="85" height="50" rx="6" fill="#1e293b" stroke={isNodeActive('client') || isNodeActive('phz') ? activeColor : '#475569'} strokeWidth={isNodeActive('client') || isNodeActive('phz') ? 2 : 0.5}/>
                      <text x="57.5" y="145" textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">💻 Public Client</text>
                      <text x="57.5" y="160" textAnchor="middle" fontSize="7.5" fill="#bae6fd">{infraScenario === 'privatelink' ? 'PHZ Query PHZ' : 'HTTPS browser'}</text>
                    </g>

                    {/* Node 2: Route 53 (L7 / L4 only) */}
                    {infraScenario !== 'privatelink' && (
                      <g opacity={isNodeActive('route53') ? 1.0 : 0.7} className={isNodeActive('route53') ? 'active-glow-node' : ''} style={{ '--pulse-color': '#7c3aed' } as React.CSSProperties}>
                        <rect x="150" y="85" width="80" height="42" rx="6" fill="#1e293b" stroke={isNodeActive('route53') ? '#7c3aed' : '#475569'} strokeWidth={isNodeActive('route53') ? 2 : 0.5}/>
                        <text x="190" y="103" textAnchor="middle" fontSize="10" fill="#e9d5ff" fontWeight="bold">🚀 Route 53</text>
                        <text x="190" y="116" textAnchor="middle" fontSize="7" fill="#c084fc">Global DNS Resolver</text>
                      </g>
                    )}

                    {/* Node 3: AWS WAF (ALB only) */}
                    {infraScenario === 'alb_ingress' && (
                      <g opacity={isNodeActive('waf') ? 1.0 : 0.7} className={isNodeActive('waf') ? 'active-glow-node' : ''} style={{ '--pulse-color': '#ea580c' } as React.CSSProperties}>
                        <rect x="150" y="145" width="80" height="42" rx="6" fill="#1e293b" stroke={isNodeActive('waf') ? '#ea580c' : '#475569'} strokeWidth={isNodeActive('waf') ? 2 : 0.5}/>
                        <text x="190" y="163" textAnchor="middle" fontSize="10" fill="#ffe4e6" fontWeight="bold">🛡️ AWS WAF</text>
                        <text x="190" y="176" textAnchor="middle" fontSize="7.5" fill="#fca5a5">Packet Inspection</text>
                      </g>
                    )}

                    {/* Node 4: CloudFront Edge (ALB only) */}
                    {infraScenario === 'alb_ingress' && (
                      <g opacity={isNodeActive('cloudfront') ? 1.0 : 0.7} className={isNodeActive('cloudfront') ? 'active-glow-node' : ''} style={{ '--pulse-color': '#ea580c' } as React.CSSProperties}>
                        <rect x="150" y="205" width="80" height="42" rx="6" fill="#1e293b" stroke={isNodeActive('cloudfront') ? '#ea580c' : '#475569'} strokeWidth={isNodeActive('cloudfront') ? 2 : 0.5}/>
                        <text x="190" y="223" textAnchor="middle" fontSize="9.5" fill="#ffe4e6" fontWeight="bold">☁️ CloudFront CDN</text>
                        <text x="190" y="236" textAnchor="middle" fontSize="7.5" fill="#fca5a5">Edge Location Cache</text>
                      </g>
                    )}

                    {/* Node 5: Interface VPC Endpoint ENI (PrivateLink only) */}
                    {infraScenario === 'privatelink' && (
                      <g opacity={isNodeActive('eni') ? 1.0 : 0.7} className={isNodeActive('eni') ? 'active-glow-node' : ''} style={{ '--pulse-color': '#7c3aed' } as React.CSSProperties}>
                        <rect x="150" y="145" width="80" height="42" rx="6" fill="#1e293b" stroke={isNodeActive('eni') ? '#7c3aed' : '#475569'} strokeWidth={isNodeActive('eni') ? 2 : 0.5}/>
                        <text x="190" y="163" textAnchor="middle" fontSize="9.5" fill="#e9d5ff" fontWeight="bold">🔌 Interface ENI</text>
                        <text x="190" y="176" textAnchor="middle" fontSize="7.5" fill="#c084fc">Consumer Gateway</text>
                      </g>
                    )}

                    {/* Node 6: AWS Private Backbone (PrivateLink only) */}
                    {infraScenario === 'privatelink' && (
                      <g opacity={isNodeActive('backbone') ? 1.0 : 0.7} className={isNodeActive('backbone') ? 'active-glow-node' : ''} style={{ '--pulse-color': '#7c3aed' } as React.CSSProperties}>
                        <rect x="255" y="145" width="80" height="42" rx="6" fill="#1e293b" stroke={isNodeActive('backbone') ? '#7c3aed' : '#475569'} strokeWidth={isNodeActive('backbone') ? 2 : 0.5}/>
                        <text x="295" y="163" textAnchor="middle" fontSize="9.5" fill="#e9d5ff" fontWeight="bold">🌐 AWS Backbone</text>
                        <text x="295" y="176" textAnchor="middle" fontSize="7.5" fill="#c084fc">Physical Fiber Tunnel</text>
                      </g>
                    )}

                    {/* Node 7: Load Balancer (ALB / NLB Node) */}
                    {infraScenario !== 'privatelink' && (
                      <g opacity={isNodeActive('alb') || isNodeActive('nlb') || isNodeActive('tcp') || isNodeActive('hash') ? 1.0 : 0.7} className={isNodeActive('alb') || isNodeActive('nlb') || isNodeActive('tcp') || isNodeActive('hash') ? 'active-glow-node' : ''} style={{ '--pulse-color': activeColor } as React.CSSProperties}>
                        <rect x="255" y="125" width="80" height="50" rx="8" fill={isNodeActive('alb') || isNodeActive('nlb') || isNodeActive('tcp') || isNodeActive('hash') ? activeColor : '#1e1b4b'} stroke={isNodeActive('alb') || isNodeActive('nlb') || isNodeActive('tcp') || isNodeActive('hash') ? '#fff' : activeColor} strokeWidth="1"/>
                        <text x="295" y="146.5" textAnchor="middle" fontSize="10.5" fill="#fff" fontWeight="bold">
                          {infraScenario === 'alb_ingress' ? '🍔 Public ALB' : '🔢 Public NLB'}
                        </text>
                        <text x="295" y="159.5" textAnchor="middle" fontSize="7.5" fill="#f8fafc">
                          {infraScenario === 'alb_ingress' ? 'Layer 7 Smart' : 'Layer 4 Static'}
                        </text>
                      </g>
                    )}

                    {/* Provider NLB (PrivateLink only) */}
                    {infraScenario === 'privatelink' && (
                      <g opacity={isNodeActive('nlb') ? 1.0 : 0.7} className={isNodeActive('nlb') ? 'active-glow-node' : ''} style={{ '--pulse-color': '#7c3aed' } as React.CSSProperties}>
                        <rect x="360" y="140" width="80" height="42" rx="6" fill="#1e1b4b" stroke={isNodeActive('nlb') ? '#7c3aed' : '#475569'} strokeWidth={isNodeActive('nlb') ? 2 : 0.5}/>
                        <text x="400" y="158" textAnchor="middle" fontSize="9.5" fill="#e9d5ff" fontWeight="bold">🔌 Provider NLB</text>
                        <text x="400" y="171" textAnchor="middle" fontSize="7.5" fill="#c084fc">Endpoint Service</text>
                      </g>
                    )}

                    {/* Node 8: Private Compute AZ1 Racks */}
                    <g opacity={isNodeActive('servers') || isNodeActive('compute') ? 1.0 : 0.7} className={isNodeActive('servers') || isNodeActive('compute') ? 'active-glow-node' : ''} style={{ '--pulse-color': '#22c55e' } as React.CSSProperties}>
                      <rect x="460" y="95" width="130" height="36" rx="5" fill="#0f172a" stroke={isNodeActive('servers') || isNodeActive('compute') ? '#22c55e' : '#475569'} strokeWidth={isNodeActive('servers') || isNodeActive('compute') ? 1.5 : 0.5}/>
                      <text x="468" y="110" fontSize="9.5" fill="#e2e8f0" fontWeight="bold">🖥️ Target Host AZ1</text>
                      <text x="468" y="123" fontSize="7" fill="#64748b">Port 80 · Healthy Target Pool</text>
                    </g>

                    {/* Node 9: Private Compute AZ2 Racks */}
                    <g opacity={isNodeActive('servers') || isNodeActive('compute') ? 1.0 : 0.7} className={isNodeActive('servers') || isNodeActive('compute') ? 'active-glow-node' : ''} style={{ '--pulse-color': '#22c55e' } as React.CSSProperties}>
                      <rect x="460" y="200" width="130" height="36" rx="5" fill="#0f172a" stroke={isNodeActive('servers') || isNodeActive('compute') ? '#22c55e' : '#475569'} strokeWidth={isNodeActive('servers') || isNodeActive('compute') ? 1.5 : 0.5}/>
                      <text x="468" y="215" fontSize="9.5" fill="#e2e8f0" fontWeight="bold">🖥️ Target Host AZ2</text>
                      <text x="468" y="228" fontSize="7" fill="#64748b">Port 80 · Healthy Target Pool</text>
                    </g>

                    {/* Node 10: RDS Database Subnet */}
                    <g opacity={0.7}>
                      <rect x="460" y="255" width="130" height="30" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="0.5"/>
                      <text x="525" y="274" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">🗄️ RDS Database (Multi-AZ)</text>
                    </g>

                    {/* Flow Arrow Lines & Dynamic Paths */}
                    
                    {/* Scenario 1: ALB Ingress Path */}
                    {infraScenario === 'alb_ingress' && (
                      <g>
                        <path d="M 100 150 L 150 106" fill="none" stroke={infraStep >= 1 ? '#ea580c' : '#334155'} strokeWidth={infraStep >= 1 ? 2.5 : 1} className={infraStep === 1 ? 'flow-active-line' : ''} />
                        <path d="M 190 127 L 190 145" fill="none" stroke={infraStep >= 2 ? '#ea580c' : '#334155'} strokeWidth={infraStep >= 2 ? 2.5 : 1} className={infraStep === 2 ? 'flow-active-line' : ''} />
                        <path d="M 190 187 L 190 205" fill="none" stroke={infraStep >= 3 ? '#ea580c' : '#334155'} strokeWidth={infraStep >= 3 ? 2.5 : 1} className={infraStep === 3 ? 'flow-active-line' : ''} />
                        <path d="M 230 226 L 295 226 L 295 175" fill="none" stroke={infraStep >= 4 ? '#ea580c' : '#334155'} strokeWidth={infraStep >= 4 ? 2.5 : 1} className={infraStep === 4 ? 'flow-active-line' : ''} />
                        <path d="M 335 140 L 460 113" fill="none" stroke={infraStep >= 5 ? '#ea580c' : '#334155'} strokeWidth={infraStep >= 5 ? 2.5 : 1} className={infraStep === 5 ? 'flow-active-line' : ''} />
                        <path d="M 335 160 L 460 218" fill="none" stroke={infraStep >= 5 ? '#ea580c' : '#334155'} strokeWidth={infraStep >= 5 ? 2.5 : 1} className={infraStep === 5 ? 'flow-active-line' : ''} />
                      </g>
                    )}

                    {/* Scenario 2: NLB Flow Hashing Path */}
                    {infraScenario === 'nlb_throughput' && (
                      <g>
                        <path d="M 100 150 L 255 150" fill="none" stroke={infraStep >= 1 ? '#0284c7' : '#334155'} strokeWidth={infraStep >= 1 ? 2.5 : 1} className={infraStep === 1 ? 'flow-active-line' : ''} />
                        <path d="M 335 140 L 460 113" fill="none" stroke={infraStep >= 3 ? '#0284c7' : '#334155'} strokeWidth={infraStep >= 3 ? 2.5 : 1} className={infraStep === 3 ? 'flow-active-line' : ''} />
                        <path d="M 335 160 L 460 218" fill="none" stroke={infraStep >= 3 ? '#0284c7' : '#334155'} strokeWidth={infraStep >= 3 ? 2.5 : 1} className={infraStep === 3 ? 'flow-active-line' : ''} />
                        
                        {/* Direct Server Return Path (Dotted Cyan from servers back to client) */}
                        {infraStep >= 4 && (
                          <path d="M 460 113 L 100 135" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3,3" className="flow-active-line" />
                        )}
                        {infraStep >= 4 && (
                          <path d="M 460 218 L 100 165" fill="none" stroke="#22d3ee" strokeWidth="1.5" strokeDasharray="3,3" className="flow-active-line" />
                        )}
                      </g>
                    )}

                    {/* Scenario 3: VPC PrivateLink Path */}
                    {infraScenario === 'privatelink' && (
                      <g>
                        <path d="M 100 150 L 150 166" fill="none" stroke={infraStep >= 1 ? '#7c3aed' : '#334155'} strokeWidth={infraStep >= 1 ? 2.5 : 1} className={infraStep === 1 ? 'flow-active-line' : ''} />
                        <path d="M 230 166 L 255 166" fill="none" stroke={infraStep >= 2 ? '#7c3aed' : '#334155'} strokeWidth={infraStep >= 2 ? 2.5 : 1} className={infraStep === 2 ? 'flow-active-line' : ''} />
                        <path d="M 335 166 L 360 161" fill="none" stroke={infraStep >= 3 ? '#7c3aed' : '#334155'} strokeWidth={infraStep >= 3 ? 2.5 : 1} className={infraStep === 3 ? 'flow-active-line' : ''} />
                        <path d="M 440 150 L 460 113" fill="none" stroke={infraStep >= 4 ? '#7c3aed' : '#334155'} strokeWidth={infraStep >= 4 ? 2.5 : 1} className={infraStep === 4 ? 'flow-active-line' : ''} />
                        <path d="M 440 170 L 460 218" fill="none" stroke={infraStep >= 4 ? '#7c3aed' : '#334155'} strokeWidth={infraStep >= 4 ? 2.5 : 1} className={infraStep === 4 ? 'flow-active-line' : ''} />
                      </g>
                    )}

                    {/* Flowing animated circles / packet tracers */}
                    {infraStep === 1 && infraScenario === 'alb_ingress' && <circle r="4.5" fill="#ea580c"><animateMotion dur="2s" repeatCount="indefinite" path="M 100 150 L 150 106" /></circle>}
                    {infraStep === 2 && infraScenario === 'alb_ingress' && <circle r="4.5" fill="#ea580c"><animateMotion dur="2s" repeatCount="indefinite" path="M 190 127 L 190 145" /></circle>}
                    {infraStep === 3 && infraScenario === 'alb_ingress' && <circle r="4.5" fill="#ea580c"><animateMotion dur="2s" repeatCount="indefinite" path="M 190 187 L 190 205" /></circle>}
                    {infraStep === 4 && infraScenario === 'alb_ingress' && <circle r="4.5" fill="#ea580c"><animateMotion dur="2s" repeatCount="indefinite" path="M 230 226 L 295 226 L 295 175" /></circle>}
                    {infraStep === 5 && infraScenario === 'alb_ingress' && <circle r="4.5" fill="#ea580c"><animateMotion dur="2s" repeatCount="indefinite" path="M 335 140 L 460 113" /></circle>}

                    {infraStep === 1 && infraScenario === 'nlb_throughput' && <circle r="4.5" fill="#0284c7"><animateMotion dur="2s" repeatCount="indefinite" path="M 100 150 L 255 150" /></circle>}
                    {infraStep === 3 && infraScenario === 'nlb_throughput' && <circle r="4.5" fill="#0284c7"><animateMotion dur="2s" repeatCount="indefinite" path="M 335 140 L 460 113" /></circle>}
                    {infraStep === 4 && infraScenario === 'nlb_throughput' && <circle r="4.5" fill="#22d3ee"><animateMotion dur="2s" repeatCount="indefinite" path="M 460 113 L 100 135" /></circle>}

                    {infraStep === 1 && infraScenario === 'privatelink' && <circle r="4.5" fill="#7c3aed"><animateMotion dur="2s" repeatCount="indefinite" path="M 100 150 L 150 166" /></circle>}
                    {infraStep === 2 && infraScenario === 'privatelink' && <circle r="4.5" fill="#7c3aed"><animateMotion dur="2s" repeatCount="indefinite" path="M 230 166 L 255 166" /></circle>}
                    {infraStep === 3 && infraScenario === 'privatelink' && <circle r="4.5" fill="#7c3aed"><animateMotion dur="2s" repeatCount="indefinite" path="M 335 166 L 360 161" /></circle>}
                    {infraStep === 4 && infraScenario === 'privatelink' && <circle r="4.5" fill="#7c3aed"><animateMotion dur="2s" repeatCount="indefinite" path="M 440 150 L 460 113" /></circle>}
                  </svg>

                  {/* Stepper Playback controls block */}
                  <div style={{ display: 'flex', gap: '6px', width: '100%', marginTop: '12px', justifyContent: 'center', alignItems: 'center' }}>
                    <button
                      className="anl-btn"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={() => setInfraStep(p => Math.max(0, p - 1))}
                      disabled={infraStep === 0}
                    >
                      ◀ Prev
                    </button>
                    <button
                      className="anl-btn"
                      style={{
                        padding: '4px 12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        backgroundColor: infraTracing ? activeColor : 'var(--color-background-primary)',
                        color: infraTracing ? '#fff' : 'var(--color-text-primary)',
                        borderColor: infraTracing ? activeColor : 'var(--color-border-secondary)'
                      }}
                      onClick={() => setInfraTracing(!infraTracing)}
                    >
                      {infraTracing ? 'Pause ⏸' : 'Play Auto-Advance ⏯'}
                    </button>
                    <button
                      className="anl-btn"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={() => setInfraStep(p => (p + 1) % scSteps[infraScenario].length)}
                      disabled={infraStep === scSteps[infraScenario].length - 1}
                    >
                      Next ▶
                    </button>
                    <button
                      className="anl-btn"
                      style={{ padding: '4px 10px', fontSize: '11px' }}
                      onClick={() => { setInfraStep(0); setInfraTracing(false); }}
                    >
                      Reset 🔄
                    </button>
                  </div>
                </div>

                {/* Right Column: Step explanations & Golden Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Step Description panel */}
                  <div className="anl-card" style={{ borderLeft: `3px solid ${activeColor}`, padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, fontSize: '12px', color: activeColor, marginBottom: '6px' }}>
                      {scSteps[infraScenario][infraStep]?.label || 'Active Phase Step'}
                    </div>
                    <div style={{ fontSize: '11.5px', color: 'var(--color-text-primary)', lineHeight: '1.4' }}>
                      {scSteps[infraScenario][infraStep]?.desc || 'Active configuration phase.'}
                    </div>
                  </div>

                  {/* Golden memory hooks based on active scenario */}
                  {infraScenario === 'alb_ingress' && (
                    <div className="anl-card" style={{
                      border: '1.5px solid #fdba74',
                      background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                      padding: '12px 14px',
                      borderRadius: '8px'
                    }}>
                      <div style={{ color: '#c2410c', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>
                        🧠 Systems Memory Mnemonic
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#7c2d12', marginBottom: '4px' }}>
                        ALB = "The Smart Concierge at L7"
                      </div>
                      <div style={{ fontSize: '11px', color: '#431407', lineHeight: '1.4' }}>
                        The Concierge is smart. She opens client packages (SSL Decryption), checks their query string badges (WAF inspection), verifies dynamic host paths (Host/Path listener rules), and directs guests to AZ private suites.
                      </div>
                    </div>
                  )}

                  {infraScenario === 'nlb_throughput' && (
                    <div className="anl-card" style={{
                      border: '1.5px solid #7dd3fc',
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      padding: '12px 14px',
                      borderRadius: '8px'
                    }}>
                      <div style={{ color: '#0369a1', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>
                        🧠 Systems Memory Mnemonic
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#0c4a6e', marginBottom: '4px' }}>
                        NLB = "The High-Speed Bullet Train at L4"
                      </div>
                      <div style={{ fontSize: '11px', color: '#0c4a6e', lineHeight: '1.4' }}>
                        The Train does not open bags. It reads raw L4 socket tickets instantly in hardware, hashes them determinants, fires down dedicated AZ subnet tracks, and allows servers to write back directly (DSR) to client IPs.
                      </div>
                    </div>
                  )}

                  {infraScenario === 'privatelink' && (
                    <div className="anl-card" style={{
                      border: '1.5px solid #d8b4fe',
                      background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                      padding: '12px 14px',
                      borderRadius: '8px'
                    }}>
                      <div style={{ color: '#7e22ce', fontWeight: 'bold', fontSize: '11px', textTransform: 'uppercase', marginBottom: '6px' }}>
                        🧠 Systems Memory Mnemonic
                      </div>
                      <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#581c87', marginBottom: '4px' }}>
                        PrivateLink = "The Secure Underground Highway"
                      </div>
                      <div style={{ fontSize: '11px', color: '#581c87', lineHeight: '1.4' }}>
                        Bypasses all public roads (Public internet, internet gateways). Connects consumer vault directly to provider vault through a secure underground highway drilled straight through solid AWS physical fiber bedrock.
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Dynamic scroll tracing logging console */}
              <div className="anl-sec" style={{ marginTop: '16px' }}>Active Infrastructure Telemetry Tracelog</div>
              <div className="anl-card" style={{ marginBottom: '14px' }}>
                <pre className="anl-log" style={{ minHeight: '90px', maxHeight: '110px', overflowY: 'auto', fontSize: '10.5px' }}>
                  {`; [Integration Telemetry] Dynamic Tracer online. Scenario: ${infraScenario.toUpperCase()}\n`}
                  {scSteps[infraScenario].slice(0, infraStep + 1).map((step, idx) => (
                    `[Step ${idx + 1}] ${step.label} resolved successfully: ${step.desc}\n`
                  )).join('')}
                  {infraTracing && `[Auto-Playback] Sequencing next telemetry packet in 3.5s...\n`}
                </pre>
              </div>
            </div>
          );
        })()}

        {/* CONFIG PANEL */}
        {activeSection === 'config' && (
          <div>
            <div className="anl-sec">Provisioning Elastic Load Balancer Infrastructure</div>
            <div className="anl-card">
              <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Terraform (HCL) provisioner: Public Application Load Balancer</div>
              <pre className="anl-log" style={{ fontSize: '11px' }}>{`# 1. Create a Public Application Load Balancer
resource "aws_lb" "application_lb" {
  name               = "production-web-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_az1.id, aws_subnet.public_az2.id]

  enable_deletion_protection = false

  tags = {
    Environment = "production"
  }
}

# 2. Create target group with cookie-based session stickiness
resource "aws_lb_target_group" "web_tg" {
  name     = "web-servers-target-group"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400  # Pinned session active for 24 hours
    enabled         = true
  }

  health_check {
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 3
  }
}

# 3. Create HTTP Listener on ALB
resource "aws_lb_listener" "web_listener" {
  load_balancer_arn = aws_lb.application_lb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web_tg.arn
  }
}`}</pre>
            </div>

            <div className="anl-card">
              <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>Terraform (HCL) provisioner: High-Performance Network Load Balancer</div>
              <pre className="anl-log" style={{ fontSize: '11px' }}>{`# 1. Create static Network Load Balancer
resource "aws_lb" "network_lb" {
  name               = "production-throughput-nlb"
  internal           = false
  load_balancer_type = "network"
  subnets            = [aws_subnet.public_az1.id, aws_subnet.public_az2.id]

  # NLB does not require security groups directly (flows transparently through L4)
  # Dynamic IPs are disabled. Static public EIPs can be mapped explicitly per AZ.
}

# 2. Create TCP target group (L4 flow hashing)
resource "aws_lb_target_group" "tcp_tg" {
  name     = "high-throughput-tcp-tg"
  port     = 5000
  protocol = "TCP"
  vpc_id   = aws_vpc.main.id

  # Stickiness is not supported for raw TCP target groups
  # Connections map purely via Flow Hashing mechanisms

  health_check {
    port                = "5000"
    protocol            = "TCP"
    interval            = 10
    healthy_threshold   = 3
    unhealthy_threshold = 3
  }
}`}</pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
