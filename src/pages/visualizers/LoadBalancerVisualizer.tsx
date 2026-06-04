import { useEffect, useState } from 'react';
import {
  BookOpen,
  Shield,
  Activity,
  ChevronRight,
  ChevronDown,
  Info,
  Check,
  Copy,
  Network,
  Cpu
} from 'lucide-react';

type TabType = 'concept' | 'alb' | 'nlb' | 'simulation' | 'integrations' | 'notebook';
type DecisionKey = 'layer' | 'throughput' | 'staticIp' | 'inspection';

const tfRuleCode = `resource "aws_lb_listener_rule" "host_path_routing" {
  listener_arn = aws_lb_listener.front_end.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    host_header {
      values = ["api.example.com"]
    }
  }

  condition {
    path_pattern {
      values = ["/v1/*"]
    }
  }
}`;

export default function LoadBalancerVisualizer() {
  const [activeSection, setActiveSection] = useState<TabType>('notebook');
  const [selectedNote, setSelectedNote] = useState<string>('alb_headers_routing');
  const [expandedCategory, setExpandedCategory] = useState<string>('l7_routing');

  // Notebook interactive simulation states
  const [nbSrcIp, setNbSrcIp] = useState('192.168.1.105');
  const [nbSrcPort, setNbSrcPort] = useState(49822);
  const [nbDstPort, setNbDstPort] = useState(443);
  const [nbProtocol, setNbProtocol] = useState<'TCP' | 'UDP'>('TCP');
  const [nbDsrMode, setNbDsrMode] = useState<'dsr' | 'proxy'>('dsr');
  const [crossZoneActive, setCrossZoneActive] = useState<boolean>(true);
  const [genevePayloadType, setGenevePayloadType] = useState<'SAFE' | 'MALICIOUS'>('SAFE');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

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
  const [stickyMap, setStickyMap] = useState<Record<number, string>>({});

  // Periodic Simulation telemetry updates for Tab 4
  useEffect(() => {
    if (!isRunning || activeSection !== 'simulation') return;

    const interval = setInterval(() => {
      // Pick a random client index: 0, 1, or 2 (Client 1, Client 2, Client 3)
      const clientIdx = Math.floor(Math.random() * 3);
      const clientName = `Client ${clientIdx + 1}`;

      // Find healthy servers
      const healthyServers: string[] = [];
      for (let i = 0; i < serverCount; i++) {
        if (serverHealth[i]) {
          healthyServers.push(String.fromCharCode(65 + i));
        }
      }

      if (healthyServers.length === 0) {
        setActiveTrafficLogs((prev) => [
          `🚨 [CRITICAL] ${clientName} request dropped! All backend targets are UNHEALTHY ❌`,
          ...prev.slice(0, 49)
        ]);
        return;
      }

      let targetServer = '';
      let logPrefix = '';

      if (simMode === 'alb_sticky') {
        const existingSticky = stickyMap[clientIdx];
        if (existingSticky && healthyServers.includes(existingSticky)) {
          targetServer = existingSticky;
          logPrefix = `🍪 [ALB Sticky Session] Pinned cookie match (AWSALB=Server-${targetServer})`;
        } else {
          // Choose a server dynamically among healthy servers
          targetServer = healthyServers[Math.floor(Math.random() * healthyServers.length)];
          setStickyMap((prev) => ({ ...prev, [clientIdx]: targetServer }));
          logPrefix = existingSticky 
            ? `⚠️ [ALB Sticky Failover] Sticky Server ${existingSticky} is UNHEALTHY! Dynamic rerouting to Server ${targetServer} & cookie updated 🍪`
            : `🍪 [ALB Sticky Session] New request client session -> Routed to Server ${targetServer} & cookie injected`;
        }
      } else if (simMode === 'alb_no_sticky') {
        targetServer = healthyServers[Math.floor(Math.random() * healthyServers.length)];
        logPrefix = `🍔 [ALB L7 Routing] Round-robin dynamic forward`;
      } else {
        const defaultIndex = clientIdx % serverCount;
        const defaultLetter = String.fromCharCode(65 + defaultIndex);
        if (healthyServers.includes(defaultLetter)) {
          targetServer = defaultLetter;
          logPrefix = `⚡ [NLB L4 Hash] Deterministic 5-tuple socket hash matched Server ${targetServer}`;
        } else {
          targetServer = healthyServers[0];
          logPrefix = `⚠️ [NLB L4 Failover] Mapped Server ${defaultLetter} is UNHEALTHY! Instantly re-routed to healthy Server ${targetServer} via active failover`;
        }
      }

      setActiveTrafficLogs((prev) => [
        `${logPrefix} -> Forwarded to Server ${targetServer} ✅`,
        ...prev.slice(0, 49)
      ]);
    }, 2000);

    return () => clearInterval(interval);
  }, [isRunning, simMode, serverCount, serverHealth, activeSection, stickyMap]);



  // Compute recommended LB
  const getRecommendedLB = () => {
    if (decisions.inspection === 'yes') {
      return {
        type: 'GWLB',
        title: '🔒 AWS Gateway Load Balancer (GWLB)',
        desc: 'Since you require deep, inline third-party security packet inspection or firewall appliances, GWLB acts at Layer 3 to route raw IP packets transparently through a virtual appliance pool.',
        themeClass: 'text-purple',
        badge: 'Layer 3 (IP Packets)',
        borderColor: '#7c3aed',
        borderColorDark: '#a78bfa',
        bgColor: 'rgba(124, 58, 237, 0.05)',
        features: [
          { name: 'GENEVE Protocol Tunneling', value: true },
          { name: 'Transparent Packet Routing', value: true },
          { name: 'Layer 7 URL/Header Rules', value: false },
          { name: 'Static IP per Zonal Subnet', value: false },
        ]
      };
    } else if (decisions.layer === 'tcp' && decisions.throughput === 'extreme') {
      return {
        type: 'NLB',
        title: '⚡ AWS Network Load Balancer (NLB)',
        desc: 'Extreme throughput requirements combined with raw TCP/UDP networking make NLB the optimal choice. It operates at Layer 4, handling millions of requests per second with sub-millisecond latencies.',
        themeClass: 'text-blue',
        badge: 'Layer 4 (TCP/UDP)',
        borderColor: '#0284c7',
        borderColorDark: '#38bdf8',
        bgColor: 'rgba(2, 132, 199, 0.05)',
        features: [
          { name: 'Sub-millisecond Latency', value: true },
          { name: 'Static IPs / Elastic IP per AZ', value: true },
          { name: 'TCP/UDP/TLS Protocol Support', value: true },
          { name: 'Layer 7 Header Routing', value: false },
        ]
      };
    } else if (decisions.staticIp === 'yes') {
      return {
        type: 'NLB',
        title: '🔢 AWS Network Load Balancer (NLB)',
        desc: 'Since you require static elastic IP addresses per availability zone for white-listing, NLB is required because it binds a static elastic IP to each zonal subnet, unlike ALB which uses dynamic DNS names.',
        themeClass: 'text-blue',
        badge: 'Layer 4 (TCP/UDP)',
        borderColor: '#0284c7',
        borderColorDark: '#38bdf8',
        bgColor: 'rgba(2, 132, 199, 0.05)',
        features: [
          { name: 'Static IPs / Elastic IP per AZ', value: true },
          { name: 'Sub-millisecond Latency', value: true },
          { name: 'TCP/UDP/TLS Protocol Support', value: true },
          { name: 'Layer 7 Header Routing', value: false },
        ]
      };
    } else {
      return {
        type: 'ALB',
        title: '🍔 AWS Application Load Balancer (ALB)',
        desc: 'For standard HTTP/HTTPS application routing, ALB is the industry standard. It evaluates Layer 7 properties (Path rules, Host headers, and Cookie sessions) to intelligently load balance microservices and containerized backends.',
        themeClass: 'text-orange',
        badge: 'Layer 7 (HTTP/HTTPS)',
        borderColor: '#ea580c',
        borderColorDark: '#f97316',
        bgColor: 'rgba(234, 88, 12, 0.05)',
        features: [
          { name: 'Layer 7 Host/Path Smart Rules', value: true },
          { name: 'HTTP/HTTPS/gRPC Support', value: true },
          { name: 'Cookie-based Sticky Sessions', value: true },
          { name: 'Static IP Support', value: false },
        ]
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

  // Handle simulation toggle
  const toggleSimulation = () => {
    if (isRunning) {
      setIsRunning(false);
    } else {
      setIsRunning(true);
      setActiveTrafficLogs(['🏁 Simulation engine initialized. Dynamic traffic active.']);
    }
  };

  // Clean session cookies helper
  const cleanSimulatorCookies = () => {
    setStickyMap({});
    sessionStorage.removeItem('client_sticky_0');
    sessionStorage.removeItem('client_sticky_1');
    sessionStorage.removeItem('client_sticky_2');
    setActiveTrafficLogs((prev) => ['🧹 Session cookies cleared from client browsers! Dynamic allocation reset.', ...prev]);
  };

  return (
    <div className="anl-container">
      <style>{`
        /* Premium Glassmorphic Developer Workspace Theme */
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

        /* Theme Aware Colors */
        .text-orange { color: #c2410c !important; fill: #c2410c !important; }
        .text-blue { color: #0369a1 !important; fill: #0369a1 !important; }
        .text-purple { color: #7c3aed !important; fill: #7c3aed !important; }
        .text-green { color: #16a34a !important; fill: #16a34a !important; }
        .text-red { color: #ef4444 !important; fill: #ef4444 !important; }
        .text-slate { color: #64748b !important; fill: #64748b !important; }

        .dark .text-orange { color: #f97316 !important; fill: #f97316 !important; }
        .dark .text-blue { color: #38bdf8 !important; fill: #38bdf8 !important; }
        .dark .text-purple { color: #a78bfa !important; fill: #a78bfa !important; }
        .dark .text-green { color: #4ade80 !important; fill: #4ade80 !important; }
        .dark .text-red { color: #f87171 !important; fill: #f87171 !important; }
        .dark .text-slate { color: #94a3b8 !important; fill: #94a3b8 !important; }

        /* Card Colors */
        .anl-card-orange { border-left: 3px solid #c2410c !important; }
        .dark .anl-card-orange { border-left: 3px solid #f97316 !important; }
        .anl-card-blue { border-left: 3px solid #0369a1 !important; }
        .dark .anl-card-blue { border-left: 3px solid #38bdf8 !important; }
        .anl-card-purple { border-left: 3px solid #7c3aed !important; }
        .dark .anl-card-purple { border-left: 3px solid #a78bfa !important; }
        .anl-card-slate { border-left: 3px solid #64748b !important; }
        .dark .anl-card-slate { border-left: 3px solid #94a3b8 !important; }

        /* SVG Overrides */
        .anl-svg-rect {
          fill: #f8fafc;
          transition: all 0.3s ease;
        }
        .dark .anl-svg-rect {
          fill: rgba(15, 23, 42, 0.8) !important;
        }
        .anl-svg-rect-blue {
          fill: #f0f9ff;
          transition: all 0.3s ease;
        }
        .dark .anl-svg-rect-blue {
          fill: rgba(2, 132, 199, 0.1) !important;
        }
        .anl-svg-rect-purple {
          fill: #faf5ff;
          transition: all 0.3s ease;
        }
        .dark .anl-svg-rect-purple {
          fill: rgba(124, 58, 237, 0.1) !important;
        }
        .anl-svg-rect-red {
          fill: #fff5f5;
          transition: all 0.3s ease;
        }
        .dark .anl-svg-rect-red {
          fill: rgba(239, 68, 68, 0.1) !important;
        }
        .anl-svg-rect-orange {
          fill: #fff7ed;
          transition: all 0.3s ease;
        }
        .dark .anl-svg-rect-orange {
          fill: rgba(234, 88, 12, 0.1) !important;
        }
        .anl-svg-rect-grey {
          fill: #f1f5f9;
          transition: all 0.3s ease;
        }
        .dark .anl-svg-rect-grey {
          fill: rgba(148, 163, 184, 0.1) !important;
        }

        .anl-svg-text-primary {
          fill: #0f172a;
          transition: all 0.3s ease;
        }
        .dark .anl-svg-text-primary {
          fill: #ffffff !important;
        }
        .anl-svg-text-secondary {
          fill: #475569;
          transition: all 0.3s ease;
        }
        .dark .anl-svg-text-secondary {
          fill: #cbd5e1 !important;
        }

        /* Premium Subnet & VPC Boundary Borders */
        .anl-svg-subnet-rect {
          stroke: #64748b;
          stroke-width: 1px;
        }
        .dark .anl-svg-subnet-rect {
          stroke: #cbd5e1 !important;
          stroke-width: 1px;
        }
        .anl-svg-vpc-rect {
          stroke: #334155;
          stroke-width: 1.5px;
          stroke-dasharray: 4,3;
        }
        .dark .anl-svg-vpc-rect {
          stroke: #94a3b8 !important;
          stroke-width: 1.5px;
        }

        .anl-svg-alb-node {
          fill: #fff7ed;
          transition: all 0.3s ease;
        }
        .dark .anl-svg-alb-node {
          fill: rgba(234, 88, 12, 0.1) !important;
        }
        .anl-svg-text-alb-primary {
          fill: #7c2d12;
          transition: all 0.3s ease;
        }
        .dark .anl-svg-text-alb-primary {
          fill: #ffedd5 !important;
        }
        .anl-svg-text-alb-secondary {
          fill: #c2410c;
          transition: all 0.3s ease;
        }
        .dark .anl-svg-text-alb-secondary {
          fill: #f97316 !important;
        }

        .anl-svg-tg-rect {
          fill: #f8fafc;
          transition: all 0.3s ease;
        }
        .dark .anl-svg-tg-rect {
          fill: rgba(15, 23, 42, 0.8) !important;
        }

        .anl-svg-text-blue-primary {
          fill: #0369a1;
          transition: all 0.3s ease;
        }
        .dark .anl-svg-text-blue-primary {
          fill: #e0f2fe !important;
        }

        .anl-svg-inner-healthy {
          fill: #e6f4ea;
          transition: all 0.3s ease;
        }
        .dark .anl-svg-inner-healthy {
          fill: rgba(16, 185, 129, 0.2) !important;
        }
        .anl-svg-inner-unhealthy {
          fill: #fce8e6;
          transition: all 0.3s ease;
        }
        .dark .anl-svg-inner-unhealthy {
          fill: rgba(239, 68, 68, 0.2) !important;
        }

        /* Server Failures controls */
        .anl-server-health-btn {
          flex: 1;
          font-size: 11px;
          padding: 4px 6px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .anl-server-health-btn.healthy {
          background: #dcfce7;
          border: 0.5px solid #86efac;
          color: #166534;
        }
        .dark .anl-server-health-btn.healthy {
          background: rgba(16, 185, 129, 0.15) !important;
          border-color: rgba(16, 185, 129, 0.4) !important;
          color: #4ade80 !important;
        }
        .anl-server-health-btn.unhealthy {
          background: #fee2e2;
          border: 0.5px solid #fca5a5;
          color: #991b1b;
        }
        .dark .anl-server-health-btn.unhealthy {
          background: rgba(239, 68, 68, 0.15) !important;
          border-color: rgba(239, 68, 68, 0.4) !important;
          color: #f87171 !important;
        }

        /* Developer Notebook styling */
        .anl-notebook-title {
          color: var(--color-text-primary);
        }
        .anl-notebook-desc {
          color: var(--color-text-secondary);
        }
        .anl-notebook-label {
          color: var(--color-text-primary);
        }
        .anl-notebook-copy-btn {
          padding: 4px;
          border-radius: 4px;
          background: var(--color-background-tertiary);
          border: 1px solid var(--color-border-tertiary);
          color: var(--color-text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .anl-notebook-copy-btn:hover {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
        }
        .anl-notebook-inner-card {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        .anl-notebook-inner-card-title {
          font-size: 10px;
          font-weight: 800;
          color: var(--color-text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-family: var(--font-mono);
          display: block;
          margin-bottom: 12px;
        }
        .anl-notebook-inner-subcard {
          background: var(--color-background-tertiary);
          border: 1px solid var(--color-border-tertiary);
          font-family: var(--font-mono);
          font-size: 10.5px;
          margin-bottom: 8px;
        }
        .anl-notebook-inner-card-text {
          color: var(--color-text-primary);
          margin-top: 4px;
        }
        .anl-notebook-inner-card-subtext {
          font-size: 10px;
          color: var(--color-text-tertiary);
          font-style: italic;
          margin-top: 12px;
        }
        .anl-notebook-inner-subcard-orange {
          background: #fff7ed;
          border: 1px solid #ffedd5;
          font-family: var(--font-mono);
          font-size: 10.5px;
        }
        .dark .anl-notebook-inner-subcard-orange {
          background: rgba(234, 88, 12, 0.15) !important;
          border-color: rgba(234, 88, 12, 0.3) !important;
        }
        .anl-notebook-inner-subcard-green {
          background: #f0fdf4;
          border: 1px solid #dcfce7;
          font-family: var(--font-mono);
          font-size: 10.5px;
        }
        .dark .anl-notebook-inner-subcard-green {
          background: rgba(16, 185, 129, 0.15) !important;
          border-color: rgba(16, 185, 129, 0.3) !important;
        }
        .anl-notebook-inner-subcard-purple {
          background: #faf5ff;
          border: 1px solid #e9d5ff;
          font-family: var(--font-mono);
          font-size: 10.5px;
        }
        .dark .anl-notebook-inner-subcard-purple {
          background: rgba(124, 58, 237, 0.15) !important;
          border-color: rgba(124, 58, 237, 0.3) !important;
        }
        .anl-notebook-inner-subcard-purple-dark {
          background: #f3e8ff;
          border: 1px solid #d8b4fe;
          font-family: var(--font-mono);
          font-size: 10.5px;
        }
        .dark .anl-notebook-inner-subcard-purple-dark {
          background: rgba(124, 58, 237, 0.25) !important;
          border-color: rgba(124, 58, 237, 0.5) !important;
        }
        .anl-notebook-inner-subcard-red-warning {
          background: #fce8e6;
          border: 1px solid #fca5a5;
          font-family: var(--font-mono);
          font-size: 10.5px;
        }
        .dark .anl-notebook-inner-subcard-red-warning {
          background: rgba(239, 68, 68, 0.15) !important;
          border-color: rgba(239, 68, 68, 0.4) !important;
        }
        .anl-notebook-tab-toggle {
          display: flex;
          background: var(--color-background-tertiary);
          border: 1px solid var(--color-border-tertiary);
        }
        .anl-toggle-active-blue {
          background: #0284c7;
          color: #ffffff;
        }
        .anl-toggle-inactive {
          color: var(--color-text-secondary);
          background: transparent;
        }
        .anl-notebook-input {
          width: 100%;
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 4px;
          padding: 4px;
          color: var(--color-text-primary);
          outline: none;
        }
        .anl-notebook-code-cookie {
          color: #b45309;
          background: rgba(245, 158, 11, 0.05);
          padding: 2px 4px;
          border-radius: 4px;
          font-family: var(--font-mono);
          font-weight: bold;
        }
        .dark .anl-notebook-code-cookie {
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.15) !important;
        }
        .anl-geneve-btn-safe {
          background: #e6f4ea;
          border: 1px solid #86efac;
          color: #137333;
        }
        .dark .anl-geneve-btn-safe {
          background: rgba(16, 185, 129, 0.15) !important;
          border-color: rgba(16, 185, 129, 0.4) !important;
          color: #4ade80 !important;
        }
        .anl-geneve-btn-attack {
          background: #fce8e6;
          border: 1px solid #fca5a5;
          color: #c5221f;
        }
        .dark .anl-geneve-btn-attack {
          background: rgba(239, 68, 68, 0.15) !important;
          border-color: rgba(239, 68, 68, 0.4) !important;
          color: #f87171 !important;
        }
        .anl-crosszone-btn-active {
          background: #16a34a;
          color: #ffffff;
        }
        .dark .anl-crosszone-btn-active {
          background: rgba(16, 185, 129, 0.25) !important;
          color: #4ade80 !important;
        }
        .anl-crosszone-btn-inactive {
          background: var(--color-background-tertiary);
          color: var(--color-text-secondary);
        }
        .anl-notebook-inner-subcard-white {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
        }
        .anl-badge-healthy {
          background: #e6f4ea;
          color: #137333;
        }
        .dark .anl-badge-healthy {
          background: rgba(16, 185, 129, 0.15) !important;
          color: #4ade80 !important;
        }
        .anl-badge-warning {
          background: #fef7e0;
          color: #b06000;
        }
        .dark .anl-badge-warning {
          background: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
        }
        .anl-badge-danger {
          background: #fce8e6;
          color: #c5221f;
        }
        .dark .anl-badge-danger {
          background: rgba(239, 68, 68, 0.15) !important;
          color: #f87171 !important;
        }
        .anl-notebook-advice-box {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          color: var(--color-text-secondary);
        }
        .anl-notebook-advice-box .title {
          color: var(--color-text-primary);
          font-weight: 800;
          font-size: 11.5px;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }
        .acad-dir-subfolder {
          background: rgba(248, 250, 252, 0.5);
          border-bottom: 1px solid var(--color-border-tertiary);
        }
        .dark .acad-dir-subfolder {
          background: rgba(15, 23, 42, 0.4) !important;
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .acad-hero-badge {
          background: rgba(3, 105, 161, 0.2) !important;
          border-color: rgba(3, 105, 161, 0.4) !important;
          color: #38bdf8 !important;
        }

        .anl-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 16px;
          border-bottom: 1px dashed #cbd5e1;
          padding-bottom: 10px;
        }

        .anl-tb {
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          font-size: 11.5px;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          background: #ffffff;
          color: #475569;
          transition: all 0.15s ease;
          outline: none;
          font-weight: 500;
        }

        .anl-tb:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .anl-tb.anl-on {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          color: #ffffff;
          border-color: #059669;
          box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
        }

        .anl-tb.anl-on-notebook {
          background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%);
          color: #ffffff !important;
          border-color: #d97706 !important;
          box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2);
        }

        .anl-tb.anl-on-concept {
          background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
          color: #ffffff !important;
          border-color: #0d9488 !important;
          box-shadow: 0 2px 4px rgba(13, 148, 136, 0.2);
        }

        .anl-tb.anl-on-alb {
          background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
          color: #ffffff !important;
          border-color: #ea580c !important;
          box-shadow: 0 2px 4px rgba(234, 88, 12, 0.2);
        }

        .anl-tb.anl-on-nlb {
          background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
          color: #ffffff !important;
          border-color: #0284c7 !important;
          box-shadow: 0 2px 4px rgba(2, 132, 199, 0.2);
        }

        .anl-tb.anl-on-simulation {
          background: linear-gradient(135deg, #059669 0%, #10b981 100%);
          color: #ffffff !important;
          border-color: #059669 !important;
          box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2);
        }

        .anl-tb.anl-on-integrations {
          background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
          color: #ffffff !important;
          border-color: #7c3aed !important;
          box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);
        }

        .anl-tb.anl-on-config {
          background: linear-gradient(135deg, #475569 0%, #64748b 100%);
          color: #ffffff !important;
          border-color: #475569 !important;
          box-shadow: 0 2px 4px rgba(71, 85, 105, 0.2);
        }

        .anl-card {
          border: 1.5px solid #cbd5e1;
          border-radius: 12px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          margin-bottom: 12px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -2px rgba(0,0,0,0.02);
        }

        .anl-sec {
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: .05em;
          margin: 16px 0 8px;
          font-family: 'Outfit', sans-serif;
        }

        .anl-sec:first-child {
          margin-top: 0;
        }

        .anl-kv {
          display: flex;
          gap: 8px;
          font-size: 12px;
          margin: 6px 0;
          align-items: baseline;
        }

        .anl-kk {
          min-width: 160px;
          color: #475569;
          flex-shrink: 0;
          font-weight: 500;
        }

        .anl-g2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .anl-g3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .anl-met {
          background: #f8fafc;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          border: 1px solid #cbd5e1;
        }

        ul.anl-ck li {
          font-size: 12px;
          margin-bottom: 6px;
          list-style: none;
          padding-left: 18px;
          position: relative;
          color: #334155;
        }

        ul.anl-ck li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #059669;
          font-weight: 700;
        }

        .anl-log {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 10px 12px;
          background: #f8fafc;
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          white-space: pre-wrap;
          line-height: 1.5;
          color: #334155;
        }

        .anl-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 500;
        }

        .anl-btn {
          font-size: 12px;
          padding: 6px 14px;
          border-radius: 8px;
          border: 1.5px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s;
          outline: none;
          font-family: 'Outfit', sans-serif;
          font-weight: 500;
        }

        .anl-btn:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }

        .anl-btn.anl-on {
          background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
          color: #fff;
          border-color: #ea580c;
          box-shadow: 0 2px 4px rgba(234, 88, 12, 0.2);
        }

        .anl-btn.anl-on-alb {
          background: linear-gradient(135deg, #ea580c 0%, #f97316 100%);
          color: #fff !important;
          border-color: #ea580c !important;
          box-shadow: 0 2px 4px rgba(234, 88, 12, 0.2);
        }

        .anl-btn.anl-on-nlb {
          background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%);
          color: #fff !important;
          border-color: #0284c7 !important;
          box-shadow: 0 2px 4px rgba(2, 132, 199, 0.2);
        }

        .anl-btn.anl-on-gwlb {
          background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%);
          color: #fff !important;
          border-color: #7c3aed !important;
          box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2);
        }

        /* Integration Scenario Buttons Custom Coloring (Light Mode) */
        .anl-btn-scenario-alb:not(.anl-on-alb) {
          background: #fff7ed !important;
          color: #ea580c !important;
          border-color: #ffedd5 !important;
        }
        .anl-btn-scenario-alb:not(.anl-on-alb):hover {
          background: #ffedd5 !important;
          border-color: #fed7aa !important;
          color: #c2410c !important;
        }

        .anl-btn-scenario-nlb:not(.anl-on-nlb) {
          background: #f0f9ff !important;
          color: #0284c7 !important;
          border-color: #e0f2fe !important;
        }
        .anl-btn-scenario-nlb:not(.anl-on-nlb):hover {
          background: #e0f2fe !important;
          border-color: #bae6fd !important;
          color: #0369a1 !important;
        }

        .anl-btn-scenario-gwlb:not(.anl-on-gwlb) {
          background: #faf5ff !important;
          color: #7c3aed !important;
          border-color: #f3e8ff !important;
        }
        .anl-btn-scenario-gwlb:not(.anl-on-gwlb):hover {
          background: #f3e8ff !important;
          border-color: #e9d5ff !important;
          color: #6d28d9 !important;
        }
        
        /* Blueprint dot-grid backdrop style */
        .anl-svg-bg {
          background-color: #ffffff;
          background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
          background-size: 16px 16px;
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          display: block;
        }

        /* Interactive animations and flows */
        @keyframes activeNodePulse {
          0%, 100% { filter: drop-shadow(0 0 2px var(--pulse-color, #10b981)) brightness(1); opacity: 0.95; }
          50% { filter: drop-shadow(0 0 10px var(--pulse-color, #10b981)) brightness(1.15); opacity: 1; }
        }

        .active-glow-node rect, .active-glow-node circle, .active-glow-node path {
          animation: activeNodePulse 1.8s infinite ease-in-out;
        }

        .flow-active-line {
          stroke-dasharray: 8,4;
          animation: flowAnim 1.2s linear infinite;
        }

        @keyframes flowAnim {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes pulse-led {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 1; }
        }

        .led-blink {
          animation: pulse-led 1s infinite ease-in-out;
        }
        
        /* Rule card states */
        .rule-item {
          font-size: 11.5px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1.5px solid #cbd5e1;
          background: #f8fafc;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.25s ease;
          color: #334155;
        }

        .rule-item.checking {
          border-color: #ea580c;
          box-shadow: 0 0 8px rgba(234, 88, 12, 0.2);
          background: rgba(234, 88, 12, 0.03);
          font-weight: 500;
        }

        .rule-item.matched {
          border-color: #10b981;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.25);
          background: #ecfdf5;
          font-weight: bold;
          color: #064e3b;
        }

        .rule-item.mismatched {
          opacity: 0.45;
          background: #ffffff;
        }

        /* Premium Academy Directory Styles */
        .acad-dir-container {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .acad-dir-header {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
          padding: 16px;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--color-border-tertiary);
        }
        .acad-dir-folder-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--color-background-primary);
          border: none;
          border-bottom: 1px solid var(--color-border-tertiary);
          font-size: 10px;
          font-weight: 800;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .acad-dir-folder-btn:hover {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
        }
        .acad-dir-item-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
          border: none;
          border-left: 3px solid transparent;
          background: var(--color-background-primary);
          transition: all 0.15s ease;
          text-align: left;
          cursor: pointer;
        }
        .acad-dir-item-btn:hover {
          background: var(--color-background-secondary);
          color: var(--color-text-info);
          border-left-color: var(--color-border-tertiary);
        }
        .acad-dir-item-btn.acad-active {
          background: #eff6ff;
          color: #0284c7;
          border-left-color: #0ea5e9;
          font-weight: 800;
        }
        .acad-detail-card {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .acad-hero-badge {
          background: #e0f2fe;
          border: 1.5px solid #bae6fd;
          color: #0369a1;
          font-size: 9.5px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3.5px 10px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .acad-takeaway-box {
          background: linear-gradient(135deg, var(--color-background-primary) 0%, var(--color-background-secondary) 100%);
          border-left: 4px solid #0ea5e9;
          border-radius: 12px;
          padding: 18px;
          font-size: 12px;
          line-height: 1.6;
          color: var(--color-text-secondary);
          font-weight: 600;
          border-top: 1px solid var(--color-border-tertiary);
          border-right: 1px solid var(--color-border-tertiary);
          border-bottom: 1px solid var(--color-border-tertiary);
        }
        .acad-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--color-border-tertiary);
        }
        .acad-table th {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
          font-weight: 800;
          padding: 12px 14px;
          border-bottom: 1.5px solid var(--color-border-tertiary);
          text-align: left;
        }
        .acad-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--color-border-tertiary);
          color: var(--color-text-secondary);
        }
        .acad-table tr:last-child td {
          border-bottom: none;
        }
        .acad-sim-diagram {
          background: var(--color-background-secondary);
          border: 1.5px solid var(--color-border-tertiary);
          border-radius: 16px;
          padding: 18px;
          position: relative;
        }
        .acad-terminal {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 14px;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          color: #cbd5e1;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
        }

        /* Centralized Dark Mode Overrides for LoadBalancerVisualizer.tsx */
        .dark .anl-container {
          background: #020617 !important;
          color: #f8fafc !important;
        }
        .dark .anl-card,
        .dark [class*="anl-card"] {
          background: rgba(15, 23, 42, 0.75) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }
        .dark .anl-card b,
        .dark .anl-card strong,
        .dark .anl-card h3,
        .dark .anl-card h4 {
          color: #ffffff !important;
        }
        .dark .anl-tabs {
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .anl-tb {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #94a3b8 !important;
        }
        .dark .anl-tb:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #f8fafc !important;
        }
        .dark .anl-sec,
        .dark .anl-kk {
          color: #94a3b8 !important;
        }
        .dark .anl-log,
        .dark .anl-terminal {
          background: #020617 !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #38bdf8 !important;
        }
        .dark .anl-btn {
          background: rgba(15, 23, 42, 0.8) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .anl-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
        }
        .dark .anl-tb.anl-on-notebook {
          background: linear-gradient(135deg, #b45309 0%, #d97706 100%) !important;
          border-color: #b45309 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 6px rgba(180, 83, 9, 0.4) !important;
        }
        .dark .anl-tb.anl-on-concept {
          background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%) !important;
          border-color: #0f766e !important;
          color: #ffffff !important;
          box-shadow: 0 2px 6px rgba(15, 118, 110, 0.4) !important;
        }
        .dark .anl-tb.anl-on-alb {
          background: linear-gradient(135deg, #c2410c 0%, #ea580c 100%) !important;
          border-color: #c2410c !important;
          color: #ffffff !important;
          box-shadow: 0 2px 6px rgba(194, 65, 12, 0.4) !important;
        }
        .dark .anl-tb.anl-on-nlb {
          background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%) !important;
          border-color: #0369a1 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 6px rgba(3, 105, 161, 0.4) !important;
        }
        .dark .anl-tb.anl-on-simulation {
          background: linear-gradient(135deg, #047857 0%, #059669 100%) !important;
          border-color: #047857 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 6px rgba(4, 120, 87, 0.4) !important;
        }
        .dark .anl-tb.anl-on-integrations {
          background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%) !important;
          border-color: #6d28d9 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 6px rgba(109, 40, 217, 0.4) !important;
        }
        .dark .anl-tb.anl-on-config {
          background: linear-gradient(135deg, #334155 0%, #475569 100%) !important;
          border-color: #334155 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 6px rgba(51, 65, 85, 0.4) !important;
        }

        .dark .anl-btn.anl-on-alb {
          background: linear-gradient(135deg, #c2410c 0%, #ea580c 100%) !important;
          border-color: #c2410c !important;
          color: #ffffff !important;
          box-shadow: 0 2px 6px rgba(194, 65, 12, 0.4) !important;
        }
        .dark .anl-btn.anl-on-nlb {
          background: linear-gradient(135deg, #0369a1 0%, #0284c7 100%) !important;
          border-color: #0369a1 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 6px rgba(3, 105, 161, 0.4) !important;
        }
        .dark .anl-btn.anl-on-gwlb {
          background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%) !important;
          border-color: #6d28d9 !important;
          color: #ffffff !important;
          box-shadow: 0 2px 6px rgba(109, 40, 217, 0.4) !important;
        }

        /* Integration Scenario Buttons Custom Coloring (Dark Mode) */
        .dark .anl-btn-scenario-alb:not(.anl-on-alb) {
          background: rgba(234, 88, 12, 0.1) !important;
          color: #f97316 !important;
          border-color: rgba(234, 88, 12, 0.25) !important;
        }
        .dark .anl-btn-scenario-alb:not(.anl-on-alb):hover {
          background: rgba(234, 88, 12, 0.2) !important;
          border-color: rgba(234, 88, 12, 0.4) !important;
          color: #fdba74 !important;
        }

        .dark .anl-btn-scenario-nlb:not(.anl-on-nlb) {
          background: rgba(2, 132, 199, 0.1) !important;
          color: #38bdf8 !important;
          border-color: rgba(2, 132, 199, 0.25) !important;
        }
        .dark .anl-btn-scenario-nlb:not(.anl-on-nlb):hover {
          background: rgba(2, 132, 199, 0.2) !important;
          border-color: rgba(2, 132, 199, 0.4) !important;
          color: #7dd3fc !important;
        }

        .dark .anl-btn-scenario-gwlb:not(.anl-on-gwlb) {
          background: rgba(124, 58, 237, 0.1) !important;
          color: #a78bfa !important;
          border-color: rgba(124, 58, 237, 0.25) !important;
        }
        .dark .anl-btn-scenario-gwlb:not(.anl-on-gwlb):hover {
          background: rgba(124, 58, 237, 0.2) !important;
          border-color: rgba(124, 58, 237, 0.4) !important;
          color: #c084fc !important;
        }
        .dark .anl-met {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark ul.anl-ck li {
          color: #cbd5e1 !important;
        }
        .dark .anl-inst,
        .dark .anl-instance {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .anl-inst .meta,
        .dark .anl-instance .meta {
          color: #94a3b8 !important;
        }
        .dark .anl-svg-bg {
          background-color: #020617 !important;
          background-image: radial-gradient(rgba(51, 65, 85, 0.5) 1.2px, transparent 1.2px) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        
        /* Node Status Overrides */
        .dark .anl-ok {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: #4ade80 !important;
        }
        .dark .anl-warm {
          border-color: #f59e0b !important;
          background: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
        }
        .dark .anl-drain {
          border-color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }
        .dark .anl-down {
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
    
        .dark .rule-item {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .rule-item.checking {
          border-color: #f57c00 !important;
          background: rgba(245, 124, 0, 0.1) !important;
        }
        .dark .rule-item.matched {
          border-color: #388e3c !important;
          background: rgba(56, 142, 60, 0.15) !important;
          color: #81c784 !important;
        }
        .dark .rule-item.mismatched {
          opacity: 0.35 !important;
          background: transparent !important;
        }
        
        .dark .acad-dir-container {
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .acad-dir-header {
          background: rgba(15, 23, 42, 0.9) !important;
          color: #ffffff !important;
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .acad-dir-folder-btn {
          background: rgba(15, 23, 42, 0.7) !important;
          color: #94a3b8 !important;
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .acad-dir-folder-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
        }
        .dark .acad-dir-item-btn {
          background: rgba(15, 23, 42, 0.5) !important;
          color: #94a3b8 !important;
        }
        .dark .acad-dir-item-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #38bdf8 !important;
        }
        .dark .acad-dir-item-btn.acad-active {
          background: rgba(2, 132, 199, 0.2) !important;
          color: #38bdf8 !important;
          border-left-color: #0ea5e9 !important;
        }
        .dark .acad-table {
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .acad-table th {
          background: rgba(15, 23, 42, 0.9) !important;
          color: #ffffff !important;
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .acad-table td {
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .acad-sim-diagram {
          background: rgba(15, 23, 42, 0.7) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .acad-detail-card {
          background: rgba(15, 23, 42, 0.75) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .acad-takeaway-box {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }

        .anl-mnemonic-card {
          background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%) !important;
          border: 1px solid #fed7aa !important;
          border-left: 4px solid #ea580c !important;
          padding: 12px 14px;
          border-radius: 8px;
          margin-top: 12px;
        }
        .anl-mnemonic-card.anl-mnemonic-blue {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%) !important;
          border-color: #cbd5e1 !important;
          border-left-color: #0284c7 !important;
        }
        .anl-mnemonic-card.anl-mnemonic-purple {
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%) !important;
          border-color: #e9d5ff !important;
          border-left-color: #7c3aed !important;
        }
        .anl-mnemonic-card .title {
          color: #c2410c !important;
          font-weight: bold;
          font-size: 11px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .anl-mnemonic-card.anl-mnemonic-blue .title {
          color: #0369a1 !important;
        }
        .anl-mnemonic-card.anl-mnemonic-purple .title {
          color: #7e22ce !important;
        }
        .anl-mnemonic-card .subtitle {
          font-weight: bold;
          font-size: 13px;
          color: #7c2d12 !important;
          margin-bottom: 4px;
        }
        .anl-mnemonic-card.anl-mnemonic-blue .subtitle {
          color: #0c4a6e !important;
        }
        .anl-mnemonic-card.anl-mnemonic-purple .subtitle {
          color: #581c87 !important;
        }
        .anl-mnemonic-card .desc {
          font-size: 11px;
          color: #431407 !important;
          line-height: 1.4;
        }
        .anl-mnemonic-card.anl-mnemonic-blue .desc {
          color: #0c4a6e !important;
        }
        .anl-mnemonic-card.anl-mnemonic-purple .desc {
          color: #581c87 !important;
        }

        /* Dark Mode overrides */
        .dark .anl-mnemonic-card {
          background: linear-gradient(135deg, rgba(234, 88, 12, 0.1) 0%, rgba(249, 115, 22, 0.15) 100%) !important;
          border-color: rgba(234, 88, 12, 0.3) !important;
          border-left-color: #f97316 !important;
        }
        .dark .anl-mnemonic-card.anl-mnemonic-blue {
          background: linear-gradient(135deg, rgba(2, 132, 199, 0.1) 0%, rgba(56, 189, 248, 0.15) 100%) !important;
          border-color: rgba(2, 132, 199, 0.3) !important;
          border-left-color: #38bdf8 !important;
        }
        .dark .anl-mnemonic-card.anl-mnemonic-purple {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(167, 139, 250, 0.15) 100%) !important;
          border-color: rgba(124, 58, 237, 0.3) !important;
          border-left-color: #a78bfa !important;
        }
        .dark .anl-mnemonic-card .title {
          color: #f97316 !important;
        }
        .dark .anl-mnemonic-card.anl-mnemonic-blue .title {
          color: #38bdf8 !important;
        }
        .dark .anl-mnemonic-card.anl-mnemonic-purple .title {
          color: #a78bfa !important;
        }
        .dark .anl-mnemonic-card .subtitle {
          color: #ffedd5 !important;
        }
        .dark .anl-mnemonic-card.anl-mnemonic-blue .subtitle {
          color: #e0f2fe !important;
        }
        .dark .anl-mnemonic-card.anl-mnemonic-purple .subtitle {
          color: #faf5ff !important;
        }
        .dark .anl-mnemonic-card .desc {
          color: #fed7aa !important;
        }
        .dark .anl-mnemonic-card.anl-mnemonic-blue .desc {
          color: #7dd3fc !important;
        }
        .dark .anl-mnemonic-card.anl-mnemonic-purple .desc {
          color: #e9d5ff !important;
        }
      `}</style>
      {/* Header */}
      <div style={{ padding: '14px 16px 4px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚖️ AWS Elastic Load Balancer
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Intelligent request routing, static elastic IPs, high-throughput flow hashing, and secure traffic distribution systems.
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="anl-tabs">
          <button className={`anl-tb ${activeSection === 'notebook' ? 'anl-on-notebook' : ''}`} onClick={() => setActiveSection('notebook')}>📓 Visual Architect Notes</button>
          <button className={`anl-tb ${activeSection === 'concept' ? 'anl-on-concept' : ''}`} onClick={() => setActiveSection('concept')}>⚖️ Concepts &amp; Comparison</button>
          <button className={`anl-tb ${activeSection === 'alb' ? 'anl-on-alb' : ''}`} onClick={() => setActiveSection('alb')}>🍔 Application Load Balancer</button>
          <button className={`anl-tb ${activeSection === 'nlb' ? 'anl-on-nlb' : ''}`} onClick={() => setActiveSection('nlb')}>🔢 Network Load Balancer</button>
          <button className={`anl-tb ${activeSection === 'simulation' ? 'anl-on-simulation' : ''}`} onClick={() => setActiveSection('simulation')}>🎮 Live Traffic Simulator</button>
          <button className={`anl-tb ${activeSection === 'integrations' ? 'anl-on-integrations' : ''}`} onClick={() => setActiveSection('integrations')}>🏗️ Integrations &amp; Infra</button>
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
                <div className="anl-card anl-card-orange" style={{ marginBottom: '10px' }}>
                  <div className="card-title" style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>🍔 1. Application Load Balancer (ALB)</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    Operates at <b>Layer 7 (HTTP/HTTPS)</b>. Inspects header payloads, paths, cookies, and query parameters to execute content-based smart routing rules to target microservices.
                  </div>
                </div>

                <div className="anl-card anl-card-blue" style={{ marginBottom: '10px' }}>
                  <div className="card-title" style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>🔢 2. Network Load Balancer (NLB)</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    Operates at <b>Layer 4 (TCP/UDP/TLS)</b>. Designed for extreme throughput (millions of RPS) at ultra-low latency. Binds static Elastic IPs to subnets, allowing hard IP whitelisting.
                  </div>
                </div>
              </div>

              <div>
                <div className="anl-card anl-card-purple" style={{ marginBottom: '10px' }}>
                  <div className="card-title" style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>🔒 3. Gateway Load Balancer (GWLB)</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
                    Operates at <b>Layer 3 (IP Packets)</b>. Deploys, scales, and manages virtual security firewalls or deep packet inspection appliances seamlessly in line without network modification.
                  </div>
                </div>

                <div className="anl-card anl-card-slate" style={{ marginBottom: '10px' }}>
                  <div className="card-title" style={{ fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>🕰️ 4. Classic Load Balancer (CLB)</div>
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
                    <th style={{ padding: '8px 6px' }} className="text-orange">ALB (Layer 7)</th>
                    <th style={{ padding: '8px 6px' }} className="text-blue">NLB (Layer 4)</th>
                    <th style={{ padding: '8px 6px' }} className="text-purple">GWLB (Layer 3)</th>
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
                    <td style={{ padding: '8px 6px', fontWeight: 'bold' }} className="text-blue">Static per AZ / Elastic IP</td>
                    <td style={{ padding: '8px 6px' }}>Private Endpoint IPs</td>
                  </tr>
                  <tr style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px 6px', fontWeight: '500' }}>Latency profile</td>
                    <td style={{ padding: '8px 6px' }}>~10-20ms (request parsing)</td>
                    <td style={{ padding: '8px 6px', fontWeight: 'bold' }} className="text-green">&lt; 1ms (super-fast bypass)</td>
                    <td style={{ padding: '8px 6px' }}>~1-5ms</td>
                  </tr>
                  <tr style={{ borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px 6px', fontWeight: '500' }}>Sticky Sessions</td>
                    <td style={{ padding: '8px 6px' }} className="text-green">✅ Cookie-based (AWS or App)</td>
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
              <div className="anl-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px' }}>Configure Application Parameters</div>
                
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Network Traffic Layer / Protocol:</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className={`anl-btn ${decisions.layer === 'http' ? 'anl-on-alb' : ''}`} onClick={() => setDecisions((d) => ({ ...d, layer: 'http' }))}>HTTP/HTTPS (L7)</button>
                    <button className={`anl-btn ${decisions.layer === 'tcp' ? 'anl-on-nlb' : ''}`} onClick={() => setDecisions((d) => ({ ...d, layer: 'tcp' }))}>Raw TCP/UDP (L4)</button>
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Throughput requirements:</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className={`anl-btn ${decisions.throughput === 'moderate' ? 'anl-on-alb' : ''}`} onClick={() => setDecisions((d) => ({ ...d, throughput: 'moderate' }))}>Moderate (~10k RPS)</button>
                    <button className={`anl-btn ${decisions.throughput === 'extreme' ? 'anl-on-nlb' : ''}`} onClick={() => setDecisions((d) => ({ ...d, throughput: 'extreme' }))}>Extreme (Millions RPS)</button>
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Static IPs needed per Availability Zone?</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className={`anl-btn ${decisions.staticIp === 'no' ? 'anl-on-alb' : ''}`} onClick={() => setDecisions((d) => ({ ...d, staticIp: 'no' }))}>No (Use DNS name)</button>
                    <button className={`anl-btn ${decisions.staticIp === 'yes' ? 'anl-on-nlb' : ''}`} onClick={() => setDecisions((d) => ({ ...d, staticIp: 'yes' }))}>Yes (IP whitelisting)</button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Deep Third-Party Security Packet Inspection?</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className={`anl-btn ${decisions.inspection === 'no' ? 'anl-on-alb' : ''}`} onClick={() => setDecisions((d) => ({ ...d, inspection: 'no' }))}>No (Standard load balancing)</button>
                    <button className={`anl-btn ${decisions.inspection === 'yes' ? 'anl-on-gwlb' : ''}`} onClick={() => setDecisions((d) => ({ ...d, inspection: 'yes' }))}>Yes (GENEVE tunneling)</button>
                  </div>
                </div>
              </div>

              <div 
                className="anl-card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between', 
                  borderLeft: `4px solid ${recommendation.borderColor}`,
                  background: 'var(--color-background-secondary)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', color: recommendation.borderColor, background: recommendation.bgColor, padding: '2px 8px', borderRadius: '4px' }}>
                      {recommendation.badge}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Decision Guide Output</span>
                  </div>
                  
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
                    {recommendation.title}
                  </div>
                  
                  <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.4', marginBottom: '12px' }}>
                    {recommendation.desc}
                  </p>

                  {/* Capabilities Checklist */}
                  <div style={{ marginBottom: '12px', borderTop: '1px dashed var(--color-border-tertiary)', paddingTop: '10px' }}>
                    <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '6px' }}>Supported capabilities</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      {recommendation.features.map((feat, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: feat.value ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                          {feat.value ? (
                            <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓</span>
                          ) : (
                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>✗</span>
                          )}
                          <span>{feat.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* SVG Visual Pathway */}
                <div style={{ width: '100%' }}>
                  <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: '4px' }}>Interactive Flow Visualization</div>
                  <svg width="100%" height="80" viewBox="0 0 280 80" style={{ background: 'var(--color-background-primary)', borderRadius: '8px', border: '1px solid var(--color-border-tertiary)' }}>
                    {/* Client Node */}
                    <g transform="translate(10, 28)">
                      <rect width="45" height="24" rx="4" fill="var(--color-background-secondary)" stroke="var(--color-border-secondary)" strokeWidth="1" />
                      <text x="22.5" y="15" fill="var(--color-text-primary)" fontSize="8" textAnchor="middle" fontWeight="600">Client</text>
                    </g>

                    {/* Load Balancer Node */}
                    <g transform="translate(105, 28)">
                      <rect width="60" height="24" rx="4" fill={recommendation.bgColor} stroke={recommendation.borderColor} strokeWidth="1.5" />
                      <text x="30" y="15" fill="var(--color-text-primary)" fontSize="8.5" textAnchor="middle" fontWeight="bold">{recommendation.type}</text>
                    </g>

                    {/* Server Targets */}
                    <g transform="translate(210, 12)">
                      <rect width="60" height="20" rx="3" fill="var(--color-background-secondary)" stroke="var(--color-border-secondary)" strokeWidth="1" />
                      <text x="30" y="12" fill="var(--color-text-secondary)" fontSize="7.5" textAnchor="middle">Target A</text>
                    </g>
                    <g transform="translate(210, 48)">
                      <rect width="60" height="20" rx="3" fill="var(--color-background-secondary)" stroke="var(--color-border-secondary)" strokeWidth="1" />
                      <text x="30" y="12" fill="var(--color-text-secondary)" fontSize="7.5" textAnchor="middle">Target B</text>
                    </g>

                    {/* Inbound Flow line */}
                    <path d="M 55 40 L 105 40" fill="none" stroke="var(--color-border-secondary)" strokeWidth="1" strokeDasharray="3,2" />
                    
                    {/* Dynamic Flow Anim Circle */}
                    <circle cx="55" cy="40" r="2.5" fill={recommendation.borderColor}>
                      <animateMotion dur="2.2s" repeatCount="indefinite" path="M 0 0 L 50 0" />
                    </circle>

                    {/* Outbound/Appliance Flow */}
                    {recommendation.type === 'GWLB' ? (
                      <>
                        <path d="M 135 28 L 135 8 L 165 8 L 165 28" fill="none" stroke={recommendation.borderColor} strokeWidth="1.2" />
                        <text x="150" y="6" fill={recommendation.borderColor} fontSize="6" textAnchor="middle" fontWeight="bold">Security VM</text>
                        <path d="M 165 40 L 210 22" fill="none" stroke="var(--color-border-secondary)" strokeWidth="1" strokeDasharray="3,2" />
                        <circle cx="165" cy="40" r="2.5" fill={recommendation.borderColor}>
                          <animateMotion dur="2.2s" repeatCount="indefinite" path="M 0 0 L 45 -18" />
                        </circle>
                      </>
                    ) : (
                      <>
                        <path d="M 165 40 L 210 22" fill="none" stroke="var(--color-border-secondary)" strokeWidth="1" strokeDasharray="3,2" />
                        <path d="M 165 40 L 210 58" fill="none" stroke="var(--color-border-secondary)" strokeWidth="1" strokeDasharray="3,2" />
                        
                        <circle cx="165" cy="40" r="2.5" fill={recommendation.borderColor}>
                          <animateMotion dur="2s" repeatCount="indefinite" path="M 0 0 L 45 -18" />
                        </circle>
                        <circle cx="165" cy="40" r="2.5" fill={recommendation.borderColor}>
                          <animateMotion dur="2.5s" repeatCount="indefinite" path="M 0 0 L 45 18" />
                        </circle>
                      </>
                    )}

                    {/* Return Flow paths */}
                    {recommendation.type === 'NLB' && (
                      <>
                        <path d="M 210 22 C 160 5, 80 5, 32.5 28" fill="none" stroke="#0ea5e9" strokeWidth="1.2" strokeDasharray="3,1" />
                        <text x="120" y="9" fill="#0ea5e9" fontSize="6.5" textAnchor="middle" fontWeight="bold">Direct Return (DSR)</text>
                      </>
                    )}
                  </svg>
                </div>
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
              <div className="anl-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ alignSelf: 'flex-start', fontWeight: 'bold', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '10px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>L7 Host, Path &amp; Header Rule Evaluator</span>
                  {matchedRule && <span style={{ color: '#22c55e' }}>✅ Matched: {matchedRule}</span>}
                </div>
                
                <svg width="100%" viewBox="0 0 420 280" className="anl-svg-bg">
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
                    <rect x="10" y="115" width="65" height="46" rx="6" className="anl-svg-rect" stroke="#ea580c" strokeWidth={albIsAnimating ? 2 : 1}/>
                    <text x="42.5" y="133" textAnchor="middle" fontSize="10" className="anl-svg-text-primary" fontWeight="bold">💻 Browser</text>
                    <text x="42.5" y="146" textAnchor="middle" fontSize="7" className="anl-svg-text-secondary" fontFamily="monospace">{albMethod} Request</text>
                    
                    {/* Session Cookie Visual Indicator inside client */}
                    {matchedRule && matchedRule !== 'Rule 6 (Priority 60)' && (
                      <g transform="translate(48, 8)">
                        <circle cx="0" cy="0" r="5" className="anl-svg-cookie" fill="#fef3c7" stroke="#d97706" strokeWidth="0.5"/>
                        <text x="0" y="2.5" textAnchor="middle" fontSize="7" fill="#78350f" fontWeight="bold">🍪</text>
                      </g>
                    )}
                  </g>

                  {/* ALB L7 intake portal */}
                  <g opacity={1} className={albIsAnimating ? 'active-glow-node' : ''} style={{ '--pulse-color': '#ea580c' } as React.CSSProperties}>
                    <rect x="105" y="95" width="90" height="90" rx="8" className="anl-svg-alb-node" strokeWidth={albIsAnimating ? 2 : 1}/>
                    <text x="150" y="122" textAnchor="middle" fontSize="11" className="anl-svg-text-alb-primary" fontWeight="bold">ALB L7</text>
                    <text x="150" y="136" textAnchor="middle" fontSize="8" className="anl-svg-text-alb-secondary">Rules Engine</text>
                    <text x="150" y="150" textAnchor="middle" fontSize="7.5" className="anl-svg-text-alb-primary" fontFamily="monospace">Port 443 SSL</text>
                    
                    {/* Visual Check/Cross lights */}
                    {albCheckingRuleIndex !== -1 && (
                      <circle cx="150" cy="168" r="5" fill="#eab308" className="active-glow-node" style={{ '--pulse-color': '#eab308' } as React.CSSProperties}/>
                    )}
                    {matchedRule && albCheckingRuleIndex === -1 && (
                      <circle cx="150" cy="168" r="5" fill="#22c55e"/>
                    )}
                  </g>

                  {/* Ingress packet flow path */}
                  <line x1="75" y1="138" x2="105" y2="138" stroke={albIsAnimating ? '#ea580c' : '#cbd5e1'} strokeWidth={albIsAnimating ? 2.5 : 1} className={albIsAnimating ? 'flow-active-line' : ''} />

                  {/* 6 Target groups in visual racks */}
                  
                  {/* TG1: user-service-tg */}
                  <g opacity={matchedRule.includes('Rule 1') ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="250" y="10" width="160" height="36" rx="5" className="anl-svg-tg-rect" stroke={matchedRule.includes('Rule 1') ? '#22c55e' : 'var(--color-border-tertiary)'} strokeWidth={matchedRule.includes('Rule 1') ? 2 : 0.5}/>
                    <text x="258" y="24" fontSize="9" className={matchedRule.includes('Rule 1') ? 'text-green' : 'anl-svg-text-primary'} fontWeight="bold">user-service-tg</text>
                    <text x="258" y="38" fontSize="7" className="anl-svg-text-secondary">EC2 pool (Port 8080) · us-east-1a</text>
                  </g>
                  <path
                    d="M 195 120 L 225 120 L 225 28 L 250 28"
                    fill="none"
                    stroke={matchedRule.includes('Rule 1') ? '#ea580c' : '#cbd5e1'}
                    strokeWidth={matchedRule.includes('Rule 1') ? 2.5 : 1}
                    className={matchedRule.includes('Rule 1') && albIsAnimating ? 'flow-active-line' : ''}
                  />

                  {/* TG2: order-service-tg */}
                  <g opacity={matchedRule.includes('Rule 2') ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="250" y="52" width="160" height="36" rx="5" className="anl-svg-tg-rect" stroke={matchedRule.includes('Rule 2') ? '#22c55e' : 'var(--color-border-tertiary)'} strokeWidth={matchedRule.includes('Rule 2') ? 2 : 0.5}/>
                    <text x="258" y="66" fontSize="9" className={matchedRule.includes('Rule 2') ? 'text-green' : 'anl-svg-text-primary'} fontWeight="bold">order-service-tg</text>
                    <text x="258" y="80" fontSize="7" className="anl-svg-text-secondary">EC2 pool (Port 8081) · us-east-1b</text>
                  </g>
                  <path
                    d="M 195 128 L 230 128 L 230 70 L 250 70"
                    fill="none"
                    stroke={matchedRule.includes('Rule 2') ? '#ea580c' : '#cbd5e1'}
                    strokeWidth={matchedRule.includes('Rule 2') ? 2.5 : 1}
                    className={matchedRule.includes('Rule 2') && albIsAnimating ? 'flow-active-line' : ''}
                  />

                  {/* TG3: premium-only-tg */}
                  <g opacity={matchedRule.includes('Rule 3') ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="250" y="94" width="160" height="36" rx="5" className="anl-svg-tg-rect" stroke={matchedRule.includes('Rule 3') ? '#22c55e' : 'var(--color-border-tertiary)'} strokeWidth={matchedRule.includes('Rule 3') ? 2 : 0.5}/>
                    <text x="258" y="108" fontSize="9" className={matchedRule.includes('Rule 3') ? 'text-green' : 'anl-svg-text-primary'} fontWeight="bold">premium-only-tg 💎</text>
                    <text x="258" y="122" fontSize="7" className="anl-svg-text-secondary">Dedicated VPS (Port 8000) · us-east-1a</text>
                  </g>
                  <path
                    d="M 195 136 L 250 136"
                    fill="none"
                    stroke={matchedRule.includes('Rule 3') ? '#ea580c' : '#cbd5e1'}
                    strokeWidth={matchedRule.includes('Rule 3') ? 2.5 : 1}
                    className={matchedRule.includes('Rule 3') && albIsAnimating ? 'flow-active-line' : ''}
                  />

                  {/* TG4: special-tg */}
                  <g opacity={matchedRule.includes('Rule 4') ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="250" y="136" width="160" height="36" rx="5" className="anl-svg-tg-rect" stroke={matchedRule.includes('Rule 4') ? '#22c55e' : 'var(--color-border-tertiary)'} strokeWidth={matchedRule.includes('Rule 4') ? 2 : 0.5}/>
                    <text x="258" y="150" fontSize="9" className={matchedRule.includes('Rule 4') ? 'text-green' : 'anl-svg-text-primary'} fontWeight="bold">special-tg 🚨</text>
                    <text x="258" y="164" fontSize="7" className="anl-svg-text-secondary">Canary target pool (Port 9000)</text>
                  </g>
                  <path
                    d="M 195 144 L 230 144 L 230 154 L 250 154"
                    fill="none"
                    stroke={matchedRule.includes('Rule 4') ? '#ea580c' : '#cbd5e1'}
                    strokeWidth={matchedRule.includes('Rule 4') ? 2.5 : 1}
                    className={matchedRule.includes('Rule 4') && albIsAnimating ? 'flow-active-line' : ''}
                  />

                  {/* TG5: blog-wordpress-tg */}
                  <g opacity={matchedRule.includes('Rule 5') ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="250" y="178" width="160" height="36" rx="5" className="anl-svg-tg-rect" stroke={matchedRule.includes('Rule 5') ? '#22c55e' : 'var(--color-border-tertiary)'} strokeWidth={matchedRule.includes('Rule 5') ? 2 : 0.5}/>
                    <text x="258" y="192" fontSize="9" className={matchedRule.includes('Rule 5') ? 'text-green' : 'anl-svg-text-primary'} fontWeight="bold">blog-wordpress-tg</text>
                    <text x="258" y="206" fontSize="7" className="anl-svg-text-secondary">Wordpress Server (Port 80) · us-east-1c</text>
                  </g>
                  <path
                    d="M 195 152 L 225 152 L 225 196 L 250 196"
                    fill="none"
                    stroke={matchedRule.includes('Rule 5') ? '#ea580c' : '#cbd5e1'}
                    strokeWidth={matchedRule.includes('Rule 5') ? 2.5 : 1}
                    className={matchedRule.includes('Rule 5') && albIsAnimating ? 'flow-active-line' : ''}
                  />

                  {/* TG6: static-s3-tg */}
                  <g opacity={matchedRule.includes('Rule 6') || matchedRule === 'Default Ruleset' ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="250" y="220" width="160" height="36" rx="5" className="anl-svg-tg-rect" stroke={matchedRule.includes('Rule 6') || matchedRule === 'Default Ruleset' ? '#22c55e' : 'var(--color-border-tertiary)'} strokeWidth={matchedRule.includes('Rule 6') || matchedRule === 'Default Ruleset' ? 2 : 0.5}/>
                    <text x="258" y="234" fontSize="9" className={matchedRule.includes('Rule 6') || matchedRule === 'Default Ruleset' ? 'text-green' : 'anl-svg-text-primary'} fontWeight="bold">
                      {matchedRule === 'Default Ruleset' ? 'default-s3-website-tg' : 'static-s3-tg 🪣'}
                    </text>
                    <text x="258" y="248" fontSize="7" className="anl-svg-text-secondary">S3 Bucket Web Origin redirect</text>
                  </g>
                  <path
                    d="M 195 160 L 215 160 L 215 238 L 250 238"
                    fill="none"
                    stroke={matchedRule.includes('Rule 6') || matchedRule === 'Default Ruleset' ? '#ea580c' : '#cbd5e1'}
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
                    <button className="anl-btn anl-on-alb" style={{ flex: 1, fontWeight: 'bold' }} onClick={simulateALBRouting} disabled={albIsAnimating}>
                      {albIsAnimating ? 'Sequencing Rules... ⏳' : 'Dispatch HTTP L7 Request ▶'}
                    </button>
                    <button className="anl-btn" onClick={() => { setAlbLogs([]); setMatchedRule(''); setAlbCheckingRuleIndex(-1); }}>Reset Logs</button>
                  </div>
                </div>

                {/* ALB Premium Mnemonic Card */}
                <div className="anl-mnemonic-card">
                  <div className="title">
                    🧠 Systems Memory Mnemonic
                  </div>
                  <div className="subtitle">
                    ALB = "The Intelligent Postmaster"
                  </div>
                  <div className="desc">
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
              <div className="anl-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ alignSelf: 'flex-start', fontWeight: 'bold', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '10px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <span>L4 5-Tuple Flow Hashing Engine &amp; DSR path</span>
                  {activeNlbTarget && <span style={{ color: '#0284c7' }}>🎯 Selected: Target Server {activeNlbTarget}</span>}
                </div>
                
                <svg width="100%" viewBox="0 0 420 280" className="anl-svg-bg">
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
                    <rect x="10" y="115" width="75" height="50" rx="6" className="anl-svg-rect" stroke="#0284c7" strokeWidth={activeNlbTarget ? 2 : 1}/>
                    <text x="47.5" y="133" textAnchor="middle" fontSize="10" className="anl-svg-text-primary" fontWeight="bold">🏢 Client App</text>
                    <text x="47.5" y="145" textAnchor="middle" fontSize="7" className="text-blue">IP Preserved</text>
                    <text x="47.5" y="156" textAnchor="middle" fontSize="6.5" className="anl-svg-text-secondary" fontFamily="monospace">{currentNlbClient || `${nlbSrcIp}:${nlbSrcPort}`}</text>
                  </g>

                  {/* Connection from Client to NLB */}
                  <line x1="85" y1="140" x2="115" y2="140" stroke={activeNlbTarget ? '#0284c7' : '#cbd5e1'} strokeWidth={activeNlbTarget ? 2.5 : 1} className={activeNlbTarget ? 'flow-active-line' : ''} />

                  {/* NLB Hashing Engine Node */}
                  <g opacity={1} className={activeNlbTarget ? 'active-glow-node' : ''} style={{ '--pulse-color': '#0284c7' } as React.CSSProperties}>
                    <rect x="115" y="95" width="95" height="90" rx="8" className="anl-svg-rect-blue" stroke="#0284c7" strokeWidth={activeNlbTarget ? 2 : 1}/>
                    <text x="162.5" y="114" textAnchor="middle" fontSize="10" className="anl-svg-text-blue-primary" fontWeight="bold">NLB Engine</text>
                    <text x="162.5" y="127" textAnchor="middle" fontSize="8" className="anl-svg-text-secondary">Stateless Flow Hash</text>
                    
                    {/* Live Digital Hash Display */}
                    <rect x="125" y="138" width="75" height="20" rx="4" fill="rgba(2, 132, 199, 0.05)" stroke="#38bdf8" strokeWidth="0.5"/>
                    <text x="162.5" y="151" textAnchor="middle" fontSize="9" className="text-blue" fontWeight="bold" fontFamily="monospace">
                      {currentNlbHash || '0x0000'}
                    </text>
                    <text x="162.5" y="174" textAnchor="middle" fontSize="7.5" className="anl-svg-text-blue-primary" fontWeight="bold" fontFamily="monospace">ASIC-L4 Hashing</text>
                  </g>

                  {/* Target Servers */}
                  
                  {/* Target Server A */}
                  <g opacity={activeNlbTarget === 'A' ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="260" y="20" width="150" height="42" rx="6" className="anl-svg-rect" stroke={activeNlbTarget === 'A' ? '#22c55e' : 'var(--color-border-tertiary)'} strokeWidth={activeNlbTarget === 'A' ? 2 : 0.5}/>
                    <text x="270" y="37" fontSize="10" className={activeNlbTarget === 'A' ? 'text-green' : 'anl-svg-text-primary'} fontWeight="bold">Target Server A</text>
                    <text x="270" y="51" fontSize="7.5" className="anl-svg-text-secondary">AZ us-east-1a · IP preservation</text>
                  </g>
                  <path
                    d="M 210 130 L 235 130 L 235 41 L 260 41"
                    fill="none"
                    stroke={activeNlbTarget === 'A' ? '#0284c7' : '#cbd5e1'}
                    strokeWidth={activeNlbTarget === 'A' ? 2.5 : 1}
                    className={activeNlbTarget === 'A' ? 'flow-active-line' : ''}
                  />

                  {/* Target Server B */}
                  <g opacity={activeNlbTarget === 'B' ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="260" y="105" width="150" height="42" rx="6" className="anl-svg-rect" stroke={activeNlbTarget === 'B' ? '#22c55e' : 'var(--color-border-tertiary)'} strokeWidth={activeNlbTarget === 'B' ? 2 : 0.5}/>
                    <text x="270" y="122" fontSize="10" className={activeNlbTarget === 'B' ? 'text-green' : 'anl-svg-text-primary'} fontWeight="bold">Target Server B</text>
                    <text x="270" y="136" fontSize="7.5" className="anl-svg-text-secondary">AZ us-east-1b · IP preservation</text>
                  </g>
                  <path
                    d="M 210 140 L 260 140"
                    fill="none"
                    stroke={activeNlbTarget === 'B' ? '#0284c7' : '#cbd5e1'}
                    strokeWidth={activeNlbTarget === 'B' ? 2.5 : 1}
                    className={activeNlbTarget === 'B' ? 'flow-active-line' : ''}
                  />

                  {/* Target Server C */}
                  <g opacity={activeNlbTarget === 'C' ? 1.0 : 0.4} style={{ transition: 'opacity 0.3s ease' }}>
                    <rect x="260" y="190" width="150" height="42" rx="6" className="anl-svg-rect" stroke={activeNlbTarget === 'C' ? '#22c55e' : 'var(--color-border-tertiary)'} strokeWidth={activeNlbTarget === 'C' ? 2 : 0.5}/>
                    <text x="270" y="207" fontSize="10" className={activeNlbTarget === 'C' ? 'text-green' : 'anl-svg-text-primary'} fontWeight="bold">Target Server C</text>
                    <text x="270" y="221" fontSize="7.5" className="anl-svg-text-secondary">AZ us-east-1c · IP preservation</text>
                  </g>
                  <path
                    d="M 210 150 L 235 150 L 235 211 L 260 211"
                    fill="none"
                    stroke={activeNlbTarget === 'C' ? '#0284c7' : '#cbd5e1'}
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
                    <text x="180" y="74" textAnchor="middle" fontSize="7.5" fill="#0891b2" fontWeight="bold">↩️ Direct Server Return (NLB Bypassed outbound)</text>
                  )}
                  {activeNlbTarget && nlbReturnMode === 'proxy' && (
                    <text x="180" y="74" textAnchor="middle" fontSize="7.5" fill="#b91c1c" fontWeight="bold">⚠️ Proxy Loop Bottleneck (Outbound hits LB)</text>
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
                <div className="anl-mnemonic-card anl-mnemonic-blue">
                  <div className="title">
                    🧠 Systems Memory Mnemonic
                  </div>
                  <div className="subtitle">
                    NLB = "The Lightspeed Track Switcher"
                  </div>
                  <div className="desc">
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
        {activeSection === 'simulation' && (() => {
          const getServerY = (idx: number, count: number) => {
            if (count === 2) {
              return idx === 0 ? 85 : 175;
            }
            return idx === 0 ? 55 : idx === 1 ? 130 : 205;
          };

          const getResolvedServerIndex = (clientIdx: number): number => {
            const healthyIndices: number[] = [];
            for (let i = 0; i < serverCount; i++) {
              if (serverHealth[i]) healthyIndices.push(i);
            }
            if (healthyIndices.length === 0) return -1;

            if (simMode === 'alb_sticky') {
              const stickyLetter = stickyMap[clientIdx];
              if (stickyLetter) {
                const stickyIdx = stickyLetter.charCodeAt(0) - 65;
                if (healthyIndices.includes(stickyIdx)) return stickyIdx;
              }
              return healthyIndices[clientIdx % healthyIndices.length];
            } else if (simMode === 'alb_no_sticky') {
              return healthyIndices[clientIdx % healthyIndices.length];
            } else {
              const defaultIndex = clientIdx % serverCount;
              if (healthyIndices.includes(defaultIndex)) return defaultIndex;
              return healthyIndices[0];
            }
          };

          return (
            <div>
              <div className="anl-sec">Live Animated Traffic Simulator</div>
              <div className="anl-g2">
                <div className="anl-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ alignSelf: 'flex-start', fontWeight: 600, fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    Interactive Load Balancer Diagram
                  </div>
                  
                  <svg width="100%" viewBox="0 0 360 260" className="anl-svg-bg">
                    {/* Definitions */}
                    <defs>
                      <linearGradient id="g-orange-alb-sim" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ea580c" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                      <linearGradient id="g-blue-nlb-sim" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#0284c7" />
                        <stop offset="100%" stopColor="#38bdf8" />
                      </linearGradient>
                      <filter id="glow-orange-alb-sim" x="-15%" y="-15%" width="130%" height="130%">
                        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ea580c" floodOpacity="0.6" />
                      </filter>
                      <filter id="glow-blue-nlb-sim" x="-15%" y="-15%" width="130%" height="130%">
                        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.6" />
                      </filter>
                    </defs>

                    {/* SVG Conduit Paths (Ingress + Egress) */}
                    
                    {/* Ingress: Client 1 to LB */}
                    <path
                      d="M 90 55 L 115 55 L 115 130 L 140 130"
                      fill="none"
                      stroke={isRunning ? (simMode.startsWith('alb') ? '#ea580c' : '#0284c7') : '#cbd5e1'}
                      strokeWidth={isRunning ? 2.5 : 1}
                      className={isRunning ? 'flow-active-line' : ''}
                      opacity={isRunning ? 1 : 0.4}
                    />
                    
                    {/* Ingress: Client 2 to LB */}
                    <path
                      d="M 90 130 L 140 130"
                      fill="none"
                      stroke={isRunning ? (simMode.startsWith('alb') ? '#ea580c' : '#0284c7') : '#cbd5e1'}
                      strokeWidth={isRunning ? 2.5 : 1}
                      className={isRunning ? 'flow-active-line' : ''}
                      opacity={isRunning ? 1 : 0.4}
                    />
                    
                    {/* Ingress: Client 3 to LB */}
                    <path
                      d="M 90 205 L 115 205 L 115 130 L 140 130"
                      fill="none"
                      stroke={isRunning ? (simMode.startsWith('alb') ? '#ea580c' : '#0284c7') : '#cbd5e1'}
                      strokeWidth={isRunning ? 2.5 : 1}
                      className={isRunning ? 'flow-active-line' : ''}
                      opacity={isRunning ? 1 : 0.4}
                    />

                    {/* Egress Paths dynamically rendered based on serverCount and health */}
                    {Array.from({ length: serverCount }).map((_, idx) => {
                      const serverY = getServerY(idx, serverCount);
                      const isHealthy = serverHealth[idx];
                      const isPathActive = isRunning && isHealthy;
                      return (
                        <path
                          key={idx}
                          d={`M 220 130 L 245 130 L 245 ${serverY} L 270 ${serverY}`}
                          fill="none"
                          stroke={isPathActive ? (simMode.startsWith('alb') ? '#ea580c' : '#0284c7') : (isHealthy ? '#cbd5e1' : '#fca5a5')}
                          strokeWidth={isPathActive ? 2.5 : 1}
                          strokeDasharray={!isHealthy ? '4,4' : undefined}
                          className={isPathActive ? 'flow-active-line' : ''}
                          opacity={isPathActive ? 1 : 0.5}
                        />
                      );
                    })}

                    {/* Client Panels (C1, C2, C3) */}
                    {[0, 1, 2].map((idx) => {
                      const y = 35 + idx * 75;
                      const hasCookie = simMode === 'alb_sticky' && stickyMap[idx];
                      return (
                        <g key={idx}>
                          <rect x="20" y={y} width="70" height="40" rx="6" className="anl-svg-rect" stroke="var(--color-border-tertiary)" strokeWidth="1.5" />
                          <text x="55" y={y + 18} fontSize="9" fontWeight="bold" textAnchor="middle" className="anl-svg-text-primary">Client {idx + 1}</text>
                          <text x="55" y={y + 30} fontSize="7.5" className="anl-svg-text-secondary" textAnchor="middle" fontFamily="monospace">
                            {idx === 0 ? '198.51.10.4' : idx === 1 ? '198.51.10.8' : '198.51.10.9'}
                          </text>
                          {hasCookie && (
                            <g transform={`translate(74, ${y + 6})`}>
                              <circle cx="0" cy="0" r="6" fill="#fff" stroke="#f59e0b" strokeWidth="0.5"/>
                              <text x="0" y="2.5" fontSize="7.5" textAnchor="middle">🍪</text>
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Center Load Balancer Hub */}
                    <g transform="translate(140, 95)">
                      <rect
                        width="80"
                        height="70"
                        rx="12"
                        fill={simMode.startsWith('alb') ? 'url(#g-orange-alb-sim)' : 'url(#g-blue-nlb-sim)'}
                        filter={simMode.startsWith('alb') ? 'url(#glow-orange-alb-sim)' : 'url(#glow-blue-nlb-sim)'}
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                      <text x="40" y="32" fontSize="12" fontWeight="bold" fill="#fff" textAnchor="middle">
                        {simMode.startsWith('alb') ? 'ALB L7' : 'NLB L4'}
                      </text>
                      <text x="40" y="46" fontSize="7.5" fill="#fff" opacity="0.9" textAnchor="middle">
                        {simMode === 'alb_sticky' ? 'Sticky Hub' : simMode === 'alb_no_sticky' ? 'Round Robin' : '5-Tuple Hash'}
                      </text>
                    </g>

                    {/* Servers (A, B, C) */}
                    {Array.from({ length: serverCount }).map((_, idx) => {
                      const serverY = getServerY(idx, serverCount);
                      const isHealthy = serverHealth[idx];
                      const letter = String.fromCharCode(65 + idx);
                      return (
                        <g key={idx} transform={`translate(270, ${serverY - 20})`} opacity={isHealthy ? 1 : 0.6}>
                          {/* Flat-3D Server Chassis rect */}
                          <rect
                            width="70"
                            height="40"
                            rx="5"
                            className="anl-svg-rect"
                            stroke={isHealthy ? '#10b981' : '#ef4444'}
                            strokeWidth="1.5"
                          />
                          {/* Inner details */}
                          <rect x="5" y="5" width="60" height="8" rx="2" className={isHealthy ? 'anl-svg-inner-healthy' : 'anl-svg-inner-unhealthy'} />
                          <text x="35" y="11" fontSize="7.5" fontWeight="bold" textAnchor="middle" className={isHealthy ? 'text-green' : 'text-red'}>
                            Target {letter}
                          </text>

                          {/* IP Details */}
                          <text x="35" y="24" fontSize="7.5" className="anl-svg-text-secondary" textAnchor="middle" fontFamily="monospace">
                            10.0.1.{idx + 10}
                          </text>

                          {/* Led and warning graphics */}
                          {isHealthy ? (
                            <>
                              <circle cx="10" cy="32" r="3" fill="#10b981" className="led-blink" />
                              <circle cx="17" cy="32" r="1.5" fill="#10b981" opacity="0.7" />
                              <circle cx="22" cy="32" r="1.5" fill="#10b981" opacity="0.7" />
                              <text x="60" y="34" fontSize="7.5" textAnchor="end" className="text-green" fontWeight="bold">ONLINE</text>
                            </>
                          ) : (
                            <>
                              <circle cx="10" cy="32" r="3" fill="#ef4444" className="led-blink" />
                              <text x="60" y="34" fontSize="7.5" textAnchor="end" className="text-red" fontWeight="bold">CRASHED ×</text>
                            </>
                          )}
                        </g>
                      );
                    })}

                    {/* Declarative Animated Request Packets */}
                    {isRunning && [0, 1, 2].map((idx) => {
                      const destIdx = getResolvedServerIndex(idx);
                      if (destIdx === -1) return null; // Drop all packets if no healthy server

                      const clientY = 55 + idx * 75;
                      const serverY = getServerY(destIdx, serverCount);

                      // Complete path string from Client idx to LB, and from LB to server destIdx
                      const pathString = `M 90 ${clientY} L 115 ${clientY} L 115 130 L 180 130 L 245 130 L 245 ${serverY} L 270 ${serverY}`;

                      const hasCookie = simMode === 'alb_sticky';

                      return (
                        <g key={idx}>
                          {hasCookie ? (
                            <g>
                              <circle r="4" fill="#ea580c" filter="url(#glow-orange-alb-sim)" />
                              <text x="0" y="-8" fontSize="10" textAnchor="middle">🍪</text>
                              <animateMotion dur="2.5s" repeatCount="indefinite" path={pathString} />
                            </g>
                          ) : (
                            <circle
                              r={simMode === 'nlb_hash' ? 4.5 : 4}
                              fill={simMode === 'nlb_hash' ? '#38bdf8' : '#f97316'}
                              filter={simMode === 'nlb_hash' ? 'url(#glow-blue-nlb-sim)' : 'url(#glow-orange-alb-sim)'}
                            >
                              <animateMotion dur={simMode === 'nlb_hash' ? '1.6s' : '2.4s'} repeatCount="indefinite" path={pathString} />
                            </circle>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div>
                  <div className="anl-card">
                    <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '10px' }}>Simulation Controls</div>
                    
                    {/* Select Mode */}
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Load Balancer Routing Mode:</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <button
                          className={`anl-btn ${simMode === 'alb_sticky' ? 'anl-on-alb' : ''}`}
                          onClick={() => {
                            setSimMode('alb_sticky');
                            cleanSimulatorCookies();
                          }}
                          style={{ fontSize: '11px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}
                        >
                          🍪 ALB Cookie Session Stickiness (Enabled)
                        </button>
                        <button
                          className={`anl-btn ${simMode === 'alb_no_sticky' ? 'anl-on-alb' : ''}`}
                          onClick={() => {
                            setSimMode('alb_no_sticky');
                            cleanSimulatorCookies();
                          }}
                          style={{ fontSize: '11px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}
                        >
                          🍔 ALB Dynamic Balancing (No Cookie)
                        </button>
                        <button
                          className={`anl-btn ${simMode === 'nlb_hash' ? 'anl-on-nlb' : ''}`}
                          onClick={() => {
                            setSimMode('nlb_hash');
                            cleanSimulatorCookies();
                          }}
                          style={{ fontSize: '11px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 10px' }}
                        >
                          ⚡ NLB 5-Tuple Connection Flow Hashing
                        </button>
                      </div>
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
                            className={`anl-server-health-btn ${serverHealth[idx] ? 'healthy' : 'unhealthy'}`}
                          >
                            Server {String.fromCharCode(65 + idx)} {serverHealth[idx] ? '✅' : '❌'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Play & Reset Buttons */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className={`anl-btn ${simMode.startsWith('alb') ? 'anl-on-alb' : 'anl-on-nlb'}`}
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
                  {activeTrafficLogs.length === 0 ? 'Simulation idle. Click Send Traffic above to start interactive package dispatch stream.' : activeTrafficLogs.join('\n')}
                </div>
              </div>
            </div>
          );
        })()}

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
                  className={`anl-btn anl-btn-scenario-alb ${infraScenario === 'alb_ingress' ? 'anl-on-alb' : ''}`}
                  onClick={() => handleScenarioChange('alb_ingress')}
                  style={{ fontWeight: 'bold' }}
                >
                  🍔 Public ALB Ingress (L7)
                </button>
                <button
                  className={`anl-btn anl-btn-scenario-nlb ${infraScenario === 'nlb_throughput' ? 'anl-on-nlb' : ''}`}
                  onClick={() => handleScenarioChange('nlb_throughput')}
                  style={{ fontWeight: 'bold' }}
                >
                  🔢 NLB Throughput (L4)
                </button>
                <button
                  className={`anl-btn anl-btn-scenario-gwlb ${infraScenario === 'privatelink' ? 'anl-on-gwlb' : ''}`}
                  onClick={() => handleScenarioChange('privatelink')}
                  style={{ fontWeight: 'bold' }}
                >
                  🔌 VPC PrivateLink (PHZ)
                </button>
              </div>

              {/* Layout grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: '20px', alignItems: 'start' }}>
                
                {/* Left: Dynamic Widescreen SVG Map */}
                <div className="anl-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px' }}>
                  <div style={{ alignSelf: 'flex-start', display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 'bold', textTransform: 'uppercase', color: activeColor }}>
                      🔍 {currentScenarioTitle}
                    </span>
                    <span style={{ fontSize: '11px', color: activeColor, fontWeight: 'bold' }}>
                      Step {infraStep + 1} of {scSteps[infraScenario].length}
                    </span>
                  </div>

                  <svg width="100%" viewBox="0 0 660 320" className="anl-svg-bg">
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
                    <rect x="140" y="55" width="490" height="240" rx="12" fill="none" className="anl-svg-vpc-rect"/>
                    <text x="150" y="70" fontSize="8.5" className="anl-svg-text-primary" fontWeight="bold">VPC boundary (us-east-1)</text>

                    {/* Subnet Boundaries */}
                    <rect x="360" y="80" width="250" height="90" rx="8" fill="none" className="anl-svg-subnet-rect"/>
                    <text x="370" y="93" fontSize="8.5" className="anl-svg-text-primary" fontWeight="bold">🔒 Private Subnet AZ1</text>

                    <rect x="360" y="185" width="250" height="90" rx="8" fill="none" className="anl-svg-subnet-rect"/>
                    <text x="370" y="198" fontSize="8.5" className="anl-svg-text-primary" fontWeight="bold">🔒 Private Subnet AZ2</text>

                    {/* Nodes Rendering */}

                    {/* Node 1: Client Node */}
                    <g opacity="1.0" className={isNodeActive('client') || isNodeActive('phz') ? 'active-glow-node' : ''} style={{ '--pulse-color': activeColor } as React.CSSProperties}>
                      <rect x="15" y="125" width="85" height="50" rx="6" className="anl-svg-rect" stroke={isNodeActive('client') || isNodeActive('phz') ? activeColor : '#94a3b8'} strokeWidth={isNodeActive('client') || isNodeActive('phz') ? 2 : 1}/>
                      <text x="57.5" y="145" textAnchor="middle" fontSize="10.5" className="anl-svg-text-primary" fontWeight="bold">💻 Public Client</text>
                      <text x="57.5" y="160" textAnchor="middle" fontSize="8.5" className="text-blue" fontWeight="600">{infraScenario === 'privatelink' ? 'PHZ Query PHZ' : 'HTTPS browser'}</text>
                    </g>

                    {/* Node 2: Route 53 (L7 / L4 only) */}
                    {infraScenario !== 'privatelink' && (
                      <g opacity="1.0" className={isNodeActive('route53') ? 'active-glow-node' : ''} style={{ '--pulse-color': '#7c3aed' } as React.CSSProperties}>
                        <rect x="150" y="85" width="80" height="42" rx="6" className="anl-svg-rect-purple" stroke={isNodeActive('route53') ? '#7c3aed' : '#94a3b8'} strokeWidth={isNodeActive('route53') ? 2 : 1}/>
                        <text x="190" y="103" textAnchor="middle" fontSize="10.5" className="text-purple" fontWeight="bold">🚀 Route 53</text>
                        <text x="190" y="116" textAnchor="middle" fontSize="8.5" className="text-purple" fontWeight="600">Global DNS Resolver</text>
                      </g>
                    )}

                    {/* Node 3: AWS WAF (ALB only) */}
                    {infraScenario === 'alb_ingress' && (
                      <g opacity="1.0" className={isNodeActive('waf') ? 'active-glow-node' : ''} style={{ '--pulse-color': '#ea580c' } as React.CSSProperties}>
                        <rect x="150" y="145" width="80" height="42" rx="6" className="anl-svg-rect-red" stroke={isNodeActive('waf') ? '#ea580c' : '#94a3b8'} strokeWidth={isNodeActive('waf') ? 2 : 1}/>
                        <text x="190" y="163" textAnchor="middle" fontSize="10.5" className="text-red" fontWeight="bold">🛡️ AWS WAF</text>
                        <text x="190" y="176" textAnchor="middle" fontSize="8.5" className="text-red" fontWeight="600">Packet Inspection</text>
                      </g>
                    )}

                    {/* Node 4: CloudFront Edge (ALB only) */}
                    {infraScenario === 'alb_ingress' && (
                      <g opacity="1.0" className={isNodeActive('cloudfront') ? 'active-glow-node' : ''} style={{ '--pulse-color': '#ea580c' } as React.CSSProperties}>
                        <rect x="150" y="205" width="80" height="42" rx="6" className="anl-svg-rect-orange" stroke={isNodeActive('cloudfront') ? '#ea580c' : '#94a3b8'} strokeWidth={isNodeActive('cloudfront') ? 2 : 1}/>
                        <text x="190" y="223" textAnchor="middle" fontSize="10" className="text-orange" fontWeight="bold">☁️ CloudFront CDN</text>
                        <text x="190" y="236" textAnchor="middle" fontSize="8.5" className="text-orange" fontWeight="600">Edge Location Cache</text>
                      </g>
                    )}

                    {/* Node 5: Interface VPC Endpoint ENI (PrivateLink only) */}
                    {infraScenario === 'privatelink' && (
                      <g opacity="1.0" className={isNodeActive('eni') ? 'active-glow-node' : ''} style={{ '--pulse-color': '#7c3aed' } as React.CSSProperties}>
                        <rect x="150" y="145" width="80" height="42" rx="6" className="anl-svg-rect-purple" stroke={isNodeActive('eni') ? '#7c3aed' : '#94a3b8'} strokeWidth={isNodeActive('eni') ? 2 : 1}/>
                        <text x="190" y="163" textAnchor="middle" fontSize="10" className="text-purple" fontWeight="bold">🔌 Interface ENI</text>
                        <text x="190" y="176" textAnchor="middle" fontSize="8.5" className="text-purple" fontWeight="600">Consumer Gateway</text>
                      </g>
                    )}

                    {/* Node 6: AWS Private Backbone (PrivateLink only) */}
                    {infraScenario === 'privatelink' && (
                      <g opacity="1.0" className={isNodeActive('backbone') ? 'active-glow-node' : ''} style={{ '--pulse-color': '#7c3aed' } as React.CSSProperties}>
                        <rect x="255" y="145" width="80" height="42" rx="6" className="anl-svg-rect-purple" stroke={isNodeActive('backbone') ? '#7c3aed' : '#94a3b8'} strokeWidth={isNodeActive('backbone') ? 2 : 1}/>
                        <text x="295" y="163" textAnchor="middle" fontSize="10" className="text-purple" fontWeight="bold">🌐 AWS Backbone</text>
                        <text x="295" y="176" textAnchor="middle" fontSize="8.5" className="text-purple" fontWeight="600">Physical Fiber Tunnel</text>
                      </g>
                    )}

                    {/* Node 7: Load Balancer (ALB / NLB Node) */}
                    {infraScenario !== 'privatelink' && (
                      <g opacity="1.0" className={isNodeActive('alb') || isNodeActive('nlb') || isNodeActive('tcp') || isNodeActive('hash') ? 'active-glow-node' : ''} style={{ '--pulse-color': activeColor } as React.CSSProperties}>
                        <rect x="255" y="125" width="80" height="50" rx="8" className={isNodeActive('alb') || isNodeActive('nlb') || isNodeActive('tcp') || isNodeActive('hash') ? '' : 'anl-svg-rect-orange'} fill={isNodeActive('alb') || isNodeActive('nlb') || isNodeActive('tcp') || isNodeActive('hash') ? activeColor : undefined} stroke={isNodeActive('alb') || isNodeActive('nlb') || isNodeActive('tcp') || isNodeActive('hash') ? '#fff' : activeColor} strokeWidth="1.5"/>
                        <text x="295" y="146.5" textAnchor="middle" fontSize="11" className={isNodeActive('alb') || isNodeActive('nlb') || isNodeActive('tcp') || isNodeActive('hash') ? '' : 'anl-svg-text-primary'} fill={isNodeActive('alb') || isNodeActive('nlb') || isNodeActive('tcp') || isNodeActive('hash') ? '#fff' : undefined} fontWeight="bold">
                          {infraScenario === 'alb_ingress' ? '🍔 Public ALB' : '🔢 Public NLB'}
                        </text>
                        <text x="295" y="159.5" textAnchor="middle" fontSize="8.5" className={isNodeActive('alb') || isNodeActive('nlb') || isNodeActive('tcp') || isNodeActive('hash') ? '' : 'anl-svg-text-secondary'} fill={isNodeActive('alb') || isNodeActive('nlb') || isNodeActive('tcp') || isNodeActive('hash') ? '#fff' : undefined} fontWeight="550">
                          {infraScenario === 'alb_ingress' ? 'Layer 7 Smart' : 'Layer 4 Static'}
                        </text>
                      </g>
                    )}

                    {/* Provider NLB (PrivateLink only) */}
                    {infraScenario === 'privatelink' && (
                      <g opacity="1.0" className={isNodeActive('nlb') ? 'active-glow-node' : ''} style={{ '--pulse-color': '#7c3aed' } as React.CSSProperties}>
                        <rect x="360" y="140" width="80" height="42" rx="6" className="anl-svg-rect-blue" stroke={isNodeActive('nlb') ? '#7c3aed' : '#94a3b8'} strokeWidth={isNodeActive('nlb') ? 2 : 1}/>
                        <text x="400" y="158" textAnchor="middle" fontSize="10" className="text-blue" fontWeight="bold">🔌 Provider NLB</text>
                        <text x="400" y="171" textAnchor="middle" fontSize="8.5" className="text-blue" fontWeight="600">Endpoint Service</text>
                      </g>
                    )}

                    {/* Node 8: Private Compute AZ1 Racks */}
                    <g opacity="1.0" className={isNodeActive('servers') || isNodeActive('compute') ? 'active-glow-node' : ''} style={{ '--pulse-color': '#22c55e' } as React.CSSProperties}>
                      <rect x="460" y="95" width="130" height="36" rx="5" className="anl-svg-rect" stroke={isNodeActive('servers') || isNodeActive('compute') ? '#22c55e' : '#94a3b8'} strokeWidth={isNodeActive('servers') || isNodeActive('compute') ? 1.5 : 1}/>
                      <text x="468" y="110" fontSize="10" className="anl-svg-text-primary" fontWeight="bold">🖥️ Target Host AZ1</text>
                      <text x="468" y="123" fontSize="8" className="anl-svg-text-secondary" fontWeight="550">Port 80 · Healthy Target Pool</text>
                    </g>

                    {/* Node 9: Private Compute AZ2 Racks */}
                    <g opacity="1.0" className={isNodeActive('servers') || isNodeActive('compute') ? 'active-glow-node' : ''} style={{ '--pulse-color': '#22c55e' } as React.CSSProperties}>
                      <rect x="460" y="200" width="130" height="36" rx="5" className="anl-svg-rect" stroke={isNodeActive('servers') || isNodeActive('compute') ? '#22c55e' : '#94a3b8'} strokeWidth={isNodeActive('servers') || isNodeActive('compute') ? 1.5 : 1}/>
                      <text x="468" y="215" fontSize="10" className="anl-svg-text-primary" fontWeight="bold">🖥️ Target Host AZ2</text>
                      <text x="468" y="228" fontSize="8" className="anl-svg-text-secondary" fontWeight="550">Port 80 · Healthy Target Pool</text>
                    </g>

                    {/* Node 10: RDS Database Subnet */}
                    <g opacity="1.0">
                      <rect x="460" y="255" width="130" height="30" rx="4" className="anl-svg-rect-grey" stroke="#94a3b8" strokeWidth="1"/>
                      <text x="525" y="274" textAnchor="middle" fontSize="9.5" className="anl-svg-text-secondary" fontWeight="bold">🗄️ RDS Database (Multi-AZ)</text>
                    </g>

                    {/* Flow Arrow Lines & Dynamic Paths */}
                    
                    {/* Scenario 1: ALB Ingress Path */}
                    {infraScenario === 'alb_ingress' && (
                      <g>
                        <path d="M 100 150 L 150 106" fill="none" stroke={infraStep >= 1 ? '#ea580c' : 'var(--color-border-tertiary)'} strokeWidth={infraStep >= 1 ? 2.5 : 1} className={infraStep === 1 ? 'flow-active-line' : ''} />
                        <path d="M 190 127 L 190 145" fill="none" stroke={infraStep >= 2 ? '#ea580c' : 'var(--color-border-tertiary)'} strokeWidth={infraStep >= 2 ? 2.5 : 1} className={infraStep === 2 ? 'flow-active-line' : ''} />
                        <path d="M 190 187 L 190 205" fill="none" stroke={infraStep >= 3 ? '#ea580c' : 'var(--color-border-tertiary)'} strokeWidth={infraStep >= 3 ? 2.5 : 1} className={infraStep === 3 ? 'flow-active-line' : ''} />
                        <path d="M 230 226 L 295 226 L 295 175" fill="none" stroke={infraStep >= 4 ? '#ea580c' : 'var(--color-border-tertiary)'} strokeWidth={infraStep >= 4 ? 2.5 : 1} className={infraStep === 4 ? 'flow-active-line' : ''} />
                        <path d="M 335 140 L 460 113" fill="none" stroke={infraStep >= 5 ? '#ea580c' : 'var(--color-border-tertiary)'} strokeWidth={infraStep >= 5 ? 2.5 : 1} className={infraStep === 5 ? 'flow-active-line' : ''} />
                        <path d="M 335 160 L 460 218" fill="none" stroke={infraStep >= 5 ? '#ea580c' : 'var(--color-border-tertiary)'} strokeWidth={infraStep >= 5 ? 2.5 : 1} className={infraStep === 5 ? 'flow-active-line' : ''} />
                      </g>
                    )}

                    {/* Scenario 2: NLB Flow Hashing Path */}
                    {infraScenario === 'nlb_throughput' && (
                      <g>
                        <path d="M 100 150 L 255 150" fill="none" stroke={infraStep >= 1 ? '#0284c7' : 'var(--color-border-tertiary)'} strokeWidth={infraStep >= 1 ? 2.5 : 1} className={infraStep === 1 ? 'flow-active-line' : ''} />
                        <path d="M 335 140 L 460 113" fill="none" stroke={infraStep >= 3 ? '#0284c7' : 'var(--color-border-tertiary)'} strokeWidth={infraStep >= 3 ? 2.5 : 1} className={infraStep === 3 ? 'flow-active-line' : ''} />
                        <path d="M 335 160 L 460 218" fill="none" stroke={infraStep >= 3 ? '#0284c7' : 'var(--color-border-tertiary)'} strokeWidth={infraStep >= 3 ? 2.5 : 1} className={infraStep === 3 ? 'flow-active-line' : ''} />
                        
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
                        <path d="M 100 150 L 150 166" fill="none" stroke={infraStep >= 1 ? '#7c3aed' : 'var(--color-border-tertiary)'} strokeWidth={infraStep >= 1 ? 2.5 : 1} className={infraStep === 1 ? 'flow-active-line' : ''} />
                        <path d="M 230 166 L 255 166" fill="none" stroke={infraStep >= 2 ? '#7c3aed' : 'var(--color-border-tertiary)'} strokeWidth={infraStep >= 2 ? 2.5 : 1} className={infraStep === 2 ? 'flow-active-line' : ''} />
                        <path d="M 335 166 L 360 161" fill="none" stroke={infraStep >= 3 ? '#7c3aed' : 'var(--color-border-tertiary)'} strokeWidth={infraStep >= 3 ? 2.5 : 1} className={infraStep === 3 ? 'flow-active-line' : ''} />
                        <path d="M 440 150 L 460 113" fill="none" stroke={infraStep >= 4 ? '#7c3aed' : 'var(--color-border-tertiary)'} strokeWidth={infraStep >= 4 ? 2.5 : 1} className={infraStep === 4 ? 'flow-active-line' : ''} />
                        <path d="M 440 170 L 460 218" fill="none" stroke={infraStep >= 4 ? '#7c3aed' : 'var(--color-border-tertiary)'} strokeWidth={infraStep >= 4 ? 2.5 : 1} className={infraStep === 4 ? 'flow-active-line' : ''} />
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
                      className={`anl-btn ${infraTracing ? (infraScenario === 'alb_ingress' ? 'anl-on-alb' : infraScenario === 'nlb_throughput' ? 'anl-on-nlb' : 'anl-on-gwlb') : ''}`}
                      style={{
                        padding: '4px 12px',
                        fontSize: '11px',
                        fontWeight: 'bold'
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
                  {/* Golden memory hooks based on active scenario */}
                  {infraScenario === 'alb_ingress' && (
                    <div className="anl-mnemonic-card">
                      <div className="title">
                        🧠 Systems Memory Mnemonic
                      </div>
                      <div className="subtitle">
                        ALB = "The Smart Concierge at L7"
                      </div>
                      <div className="desc">
                        The Concierge is smart. She opens client packages (SSL Decryption), checks their query string badges (WAF inspection), verifies dynamic host paths (Host/Path listener rules), and directs guests to AZ private suites.
                      </div>
                    </div>
                  )}

                  {infraScenario === 'nlb_throughput' && (
                    <div className="anl-mnemonic-card anl-mnemonic-blue">
                      <div className="title">
                        🧠 Systems Memory Mnemonic
                      </div>
                      <div className="subtitle">
                        NLB = "The High-Speed Bullet Train at L4"
                      </div>
                      <div className="desc">
                        The Train does not open bags. It reads raw L4 socket tickets instantly in hardware, hashes them determinants, fires down dedicated AZ subnet tracks, and allows servers to write back directly (DSR) to client IPs.
                      </div>
                    </div>
                  )}

                  {infraScenario === 'privatelink' && (
                    <div className="anl-mnemonic-card anl-mnemonic-purple">
                      <div className="title">
                        🧠 Systems Memory Mnemonic
                      </div>
                      <div className="subtitle">
                        PrivateLink = "The Secure Underground Highway"
                      </div>
                      <div className="desc">
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



        {/* ========================================================================= */}
        {/* TAB 7: VISUAL ARCHITECT NOTES (DEVELOPER ACADEMY)                         */}
        {/* ========================================================================= */}
        {activeSection === 'notebook' && (
          <div className="space-y-6 animate-fadeIn text-left" style={{ color: 'var(--color-text-primary)' }}>
            
            <div className="card text-left">
              <h2 className="text-xl font-bold flex items-center gap-2 font-display anl-notebook-title">
                <BookOpen className="w-5 h-5 text-indigo-600" /> Elastic Load Balancing (ALB/NLB) Notes
              </h2>
              <p className="text-xs mt-1.5 leading-relaxed font-sans font-semibold anl-notebook-desc">
                Understand the architecture of Application and Network Load Balancers, covering routing algorithms, health checks, connection draining, SSL offloading, and cross-zone routing.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Sidebar Category Explorer */}
              <div className="lg:col-span-3 space-y-4 text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1 font-mono">VPC Directory Tree:</span>
                
                <div className="acad-dir-container">
                  <div className="acad-dir-header">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    <span>Module Explorer</span>
                  </div>

                  {/* CATEGORY 1: LAYER 7 APPLICATION BALANCING */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'l7_routing' ? '' : 'l7_routing')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-orange-500" />
                        1. L7 Application LB
                      </span>
                      {expandedCategory === 'l7_routing' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'l7_routing' && (
                      <div className="acad-dir-subfolder py-1">
                        <button 
                          onClick={() => setSelectedNote('alb_headers_routing')}
                          className={`acad-dir-item-btn ${selectedNote === 'alb_headers_routing' ? 'acad-active' : ''}`}
                        >
                          Host &amp; Path Routing
                        </button>
                        <button 
                          onClick={() => setSelectedNote('session_stickiness')}
                          className={`acad-dir-item-btn ${selectedNote === 'session_stickiness' ? 'acad-active' : ''}`}
                        >
                          ALB Session Cookies
                        </button>
                        <button 
                          onClick={() => setSelectedNote('ssl_offloading')}
                          className={`acad-dir-item-btn ${selectedNote === 'ssl_offloading' ? 'acad-active' : ''}`}
                        >
                          SSL Termination &amp; SNI
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CATEGORY 2: LAYER 4 NETWORK BALANCING */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'l4_routing' ? '' : 'l4_routing')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Network className="w-3.5 h-3.5 text-sky-500" />
                        2. L4 Network LB
                      </span>
                      {expandedCategory === 'l4_routing' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'l4_routing' && (
                      <div className="acad-dir-subfolder py-1">
                        <button 
                          onClick={() => setSelectedNote('nlb_flow_hashing')}
                          className={`acad-dir-item-btn ${selectedNote === 'nlb_flow_hashing' ? 'acad-active' : ''}`}
                        >
                          5-Tuple Hashing Math
                        </button>
                        <button 
                          onClick={() => setSelectedNote('static_ips_az')}
                          className={`acad-dir-item-btn ${selectedNote === 'static_ips_az' ? 'acad-active' : ''}`}
                        >
                          Subnet Static IPs
                        </button>
                        <button 
                          onClick={() => setSelectedNote('dsr_return')}
                          className={`acad-dir-item-btn ${selectedNote === 'dsr_return' ? 'acad-active' : ''}`}
                        >
                          Direct Server Return (DSR)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CATEGORY 3: LAYER 3 GATEWAY BALANCING */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'l3_routing' ? '' : 'l3_routing')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-violet-500" />
                        3. L3 Gateway LB
                      </span>
                      {expandedCategory === 'l3_routing' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'l3_routing' && (
                      <div className="acad-dir-subfolder py-1">
                        <button 
                          onClick={() => setSelectedNote('gwlb_firewalls')}
                          className={`acad-dir-item-btn ${selectedNote === 'gwlb_firewalls' ? 'acad-active' : ''}`}
                        >
                          Virtual Firewalls Inlining
                        </button>
                        <button 
                          onClick={() => setSelectedNote('geneve_encapsulation')}
                          className={`acad-dir-item-btn ${selectedNote === 'geneve_encapsulation' ? 'acad-active' : ''}`}
                        >
                          GENEVE UDP Tunneling
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CATEGORY 4: GLOBAL BALANCING & HIGH AVAILABILITY */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'ha_equalization' ? '' : 'ha_equalization')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-teal-500" />
                        4. HA &amp; Equalization
                      </span>
                      {expandedCategory === 'ha_equalization' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'ha_equalization' && (
                      <div className="bg-slate-50/50 py-1">
                        <button 
                          onClick={() => setSelectedNote('cross_zone_lb')}
                          className={`acad-dir-item-btn ${selectedNote === 'cross_zone_lb' ? 'acad-active' : ''}`}
                        >
                          Cross-Zone Load Equalizer
                        </button>
                        <button 
                          onClick={() => setSelectedNote('health_checks_drain')}
                          className={`acad-dir-item-btn ${selectedNote === 'health_checks_drain' ? 'acad-active' : ''}`}
                        >
                          Deregistration Delay
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="anl-notebook-advice-box p-4 rounded-2xl text-[11px] leading-relaxed font-semibold space-y-1">
                  <span className="title">
                    <Info className="w-3.5 h-3.5 text-indigo-500" /> Academy Advice
                  </span>
                  "Choose any load balancer topic in the directory above to reveal full visual descriptions, interactive tools, and production-grade configurations."
                </div>
              </div>

              {/* Right Active Note Workspace */}
              <div className="lg:col-span-9 space-y-6 text-left">

                {/* NOTE 1: HOST & PATH ROUTING */}
                {selectedNote === 'alb_headers_routing' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">L7 Smart Delivery</span>
                        <h3 className="text-xl font-black mt-2 font-display anl-notebook-title">ALB HTTP Host &amp; Path Rules</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('alb')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to ALB Simulator
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 1 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed anl-notebook-desc">
                      At Layer 7 (Application), an Application Load Balancer terminates the incoming SSL connection and inspects the HTTP request envelope. It evaluates Host headers, request paths, query strings, and custom header payloads sequentially according to listener rule priorities.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs">
                        <span className="font-extrabold block anl-notebook-label">HTTP Request Scanning Cycle:</span>
                        
                        <div className="space-y-2 font-mono text-[11px] anl-notebook-desc">
                          <div className="flex justify-between border-b var(--color-border-tertiary) pb-1.5">
                            <span>Step 1: Host Matching</span>
                            <span className="font-bold anl-notebook-label">Matches host (e.g. *.example.com)</span>
                          </div>
                          <div className="flex justify-between border-b var(--color-border-tertiary) pb-1.5">
                            <span>Step 2: Path Matching</span>
                            <span className="font-bold anl-notebook-label">Evaluates route path (e.g. /v1/*)</span>
                          </div>
                          <div className="flex justify-between border-b var(--color-border-tertiary) pb-1.5">
                            <span>Step 3: Query Strings</span>
                            <span className="font-bold anl-notebook-label">Checks URL parameters (tier=premium)</span>
                          </div>
                          <div className="flex justify-between pb-1.5">
                            <span>Step 4: Headers Check</span>
                            <span className="font-bold anl-notebook-label">Matches custom keys/values</span>
                          </div>
                        </div>

                        <div className="acad-takeaway-box">
                          <strong>💡 Professional Takeaway:</strong> ALB evaluations follow a strict priority ordering. If an incoming request matches a rule at priority 100, the ALB immediately routes the packet and stops scanning lower rules. Always place your narrowest, most specific rules (like canary release routes) at high priorities!
                        </div>
                      </div>

                      {/* Visual HCL Code block */}
                      <div className="flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">Terraform Listener Rule Snippet</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(tfRuleCode);
                              setCopiedNoteId('tf-rule');
                              setTimeout(() => setCopiedNoteId(null), 2000);
                            }}
                            className="anl-notebook-copy-btn"
                          >
                            {copiedNoteId === 'tf-rule' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <pre className="acad-terminal text-[10px] leading-relaxed overflow-x-auto h-60">
                          {tfRuleCode}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 2: ALB SESSION COOKIES */}
                {selectedNote === 'session_stickiness' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Session Persistence</span>
                        <h3 className="text-xl font-black mt-2 font-display anl-notebook-title">ALB Session Stickiness &amp; Cookies</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('alb')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to ALB Simulator
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 2 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed anl-notebook-desc">
                      By default, an Application Load Balancer distributes incoming HTTP requests across all target instances using a round-robin algorithm. If your application relies on local server-side memory sessions, you must enable **stickiness** to pin subsequent requests from the same user to the same target server.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs leading-relaxed anl-notebook-desc">
                        <h4 className="font-bold text-xs anl-notebook-label">Types of Session Stickiness:</h4>
                        
                        <ul className="list-disc pl-4 space-y-2">
                          <li>
                            <strong className="anl-notebook-label">Duration-Based Cookie:</strong> The ALB itself generates and encrypts a cookie named <code className="anl-notebook-code-cookie">AWSALB</code>. When the client returns this cookie in subsequent headers, the ALB routes the flow to the pinned server.
                          </li>
                          <li>
                            <strong className="anl-notebook-label">Application-Based Cookie:</strong> The backend application injects a custom session cookie, and the ALB wraps it in its own tracking cookie (<code className="anl-notebook-code-cookie">AWSALBAPP</code>) to maintain target affinity.
                          </li>
                        </ul>

                        <div className="acad-takeaway-box">
                          <strong>⚠️ Failover Catch:</strong> If the pinned server instance experiences a health check crash, the ALB instantly overrides session stickiness, routes the request to a surviving server, and updates the cookie values. Ensure your app can re-authenticate or uses external session stores (like Redis)!
                        </div>
                      </div>

                      <div className="anl-notebook-inner-card p-4 rounded-xl">
                        <span className="anl-notebook-inner-card-title">Interactive Cookie Header Simulation</span>
                        
                        <div className="space-y-3 font-mono text-[10.5px]">
                          <div className="anl-notebook-inner-subcard p-2.5 rounded-lg">
                            <span className="text-green font-bold">Response Header from ALB:</span>
                            <p className="anl-notebook-inner-card-text mt-1">HTTP/1.1 200 OK</p>
                            <p className="text-orange font-bold">Set-Cookie: AWSALB=e30ab8f51a44e9102; Max-Age=3600; Path=/</p>
                          </div>

                          <div className="anl-notebook-inner-subcard p-2.5 rounded-lg">
                            <span className="text-blue font-bold">Next Ingress Header from Client:</span>
                            <p className="anl-notebook-inner-card-text mt-1">GET /v1/users HTTP/1.1</p>
                            <p className="text-orange font-bold">Cookie: AWSALB=e30ab8f51a44e9102</p>
                          </div>
                        </div>

                        <div className="anl-notebook-inner-card-subtext">
                          * Note: Client returns the matching cookie automatically, pinning the state.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 3: SSL OFFLOADING & SNI */}
                {selectedNote === 'ssl_offloading' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">TLS Terminations</span>
                        <h3 className="text-xl font-black mt-2 font-display anl-notebook-title">SSL/TLS Offloading &amp; SNI</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('alb')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to ALB Simulator
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 3 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed anl-notebook-desc">
                      SSL/TLS offloading relieves your backend application servers of the CPU-intensive work of encrypting and decrypting data. The ALB handles the SSL handshake, decrypts requests using certificates mapped from AWS Certificate Manager (ACM), and forwards cleartext HTTP requests to target compute instances inside private subnets.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs text-slate-650">
                        <span className="font-extrabold text-slate-800 block">Server Name Indication (SNI):</span>
                        <p className="leading-relaxed">
                          SNI allows you to host multiple secure websites, each with its own SSL certificate, behind a single Application Load Balancer. When a client initiates a handshake, SNI passes the requested hostname, and the ALB dynamic mapper selects the matching ACM certificate.
                        </p>

                        <div className="acad-takeaway-box">
                          <strong>🔒 Security Best Practice:</strong> Secure the communication path inside your VPC by using security groups. Configure backend EC2 instances to only accept HTTP traffic coming directly from the ALB's security group, blocking all direct public access!
                        </div>
                      </div>

                      <div className="anl-notebook-inner-card p-4 rounded-xl flex flex-col justify-center text-center">
                        <span className="anl-notebook-inner-card-title">SSL Offloading Network Diagram</span>
                        
                        <div className="flex items-center justify-center gap-2 text-[10px] font-mono">
                          <div className="anl-notebook-inner-subcard p-2.5 rounded-lg">
                            <p className="font-bold anl-notebook-inner-card-text">💻 Client</p>
                            <span className="text-red font-bold">HTTPS (443)</span>
                          </div>
                          <span className="text-slate-400">&rarr;</span>
                          <div className="anl-notebook-inner-subcard-orange p-2.5 rounded-lg">
                            <p className="font-bold text-orange">⚖️ ALB</p>
                            <span className="text-orange font-semibold">Decrypts TLS</span>
                          </div>
                          <span className="text-slate-400">&rarr;</span>
                          <div className="anl-notebook-inner-subcard-green p-2.5 rounded-lg">
                            <p className="font-bold text-green">🖥️ EC2</p>
                            <span className="text-green font-semibold">HTTP (80)</span>
                          </div>
                        </div>

                        <p className="anl-notebook-inner-card-subtext mt-4 leading-normal max-w-xs mx-auto">
                          Decryption happens at the load balancer boundary. Computes scale easily without handling complex key handshakes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 4: NLB FLOW HASHING MATH */}
                {selectedNote === 'nlb_flow_hashing' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">L4 Flow Mechanics</span>
                        <h3 className="text-xl font-black mt-2 font-display anl-notebook-title">L4 5-Tuple Connection Hashing</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('nlb')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Network className="w-3.5 h-3.5" /> Go to NLB Simulator
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 4 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-650 leading-relaxed">
                      Network Load Balancers operate at Layer 4 (Transport), routing raw packets without decoding HTTP headers or cookies. To maintain connection persistence statelessly, the NLB's ASIC routing engine hashes the connection's **5-tuple key** to map flows deterministically to the same target server.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Interactive Hashing Math HUD */}
                      <div className="anl-notebook-inner-card p-5 space-y-4 rounded-xl">
                        <span className="anl-notebook-inner-card-title">Interactive FNV-1a Hashing Tool</span>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-slate-500 mb-1">Protocol</label>
                            <select 
                              value={nbProtocol} 
                              onChange={(e) => setNbProtocol(e.target.value as any)}
                              className="anl-notebook-input"
                            >
                              <option value="TCP">TCP</option>
                              <option value="UDP">UDP</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">Src IP</label>
                            <input 
                              type="text" 
                              value={nbSrcIp} 
                              onChange={(e) => setNbSrcIp(e.target.value)}
                              className="anl-notebook-input font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">Src Port</label>
                            <input 
                              type="number" 
                              value={nbSrcPort} 
                              onChange={(e) => setNbSrcPort(parseInt(e.target.value) || 1024)}
                              className="anl-notebook-input font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-500 mb-1">Dst Port</label>
                            <input 
                              type="number" 
                              value={nbDstPort} 
                              onChange={(e) => setNbDstPort(parseInt(e.target.value) || 443)}
                              className="anl-notebook-input font-mono"
                            />
                          </div>
                        </div>

                        {/* Hash Results HUD */}
                        <div className="anl-notebook-inner-subcard p-3 rounded-lg font-mono text-[10.5px] space-y-1.5 text-slate-600">
                          <p>Tuple: <span className="text-slate-850 font-bold">{`${nbProtocol}:${nbSrcIp}:${nbSrcPort}->203.0.113.88:${nbDstPort}`}</span></p>
                          <p>FNV-1a Hash: <span className="text-sky-600 font-bold">0x{calculateFnv1a(`${nbProtocol}:${nbSrcIp}:${nbSrcPort}->203.0.113.88:${nbDstPort}`)}</span></p>
                          <p>Modulo Index: <span className="text-emerald-600 font-bold font-semibold">
                            Index {parseInt(calculateFnv1a(`${nbProtocol}:${nbSrcIp}:${nbSrcPort}->203.0.113.88:${nbDstPort}`), 16) % 3}
                          </span></p>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs anl-notebook-desc">
                        <span className="font-extrabold block anl-notebook-label">The 5-Tuple Routing Parameters:</span>
                        
                        <ol className="list-decimal pl-4 space-y-1.5">
                          <li>Source IP address</li>
                          <li>Source port</li>
                          <li>Destination IP address</li>
                          <li>Destination port</li>
                          <li>IP Protocol (TCP/UDP)</li>
                        </ol>

                        <div className="acad-takeaway-box">
                          <strong>💡 Scaling Fact:</strong> Because NLB uses stateless mathematical hashing instead of saving active connection lookups in memory, it can support millions of requests per second with sub-millisecond latencies.
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* NOTE 5: SUBNET STATIC IPS */}
                {selectedNote === 'static_ips_az' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">IP Architecture</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Static Zonal IPs &amp; Whitelisting</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('nlb')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Network className="w-3.5 h-3.5" /> Go to NLB Simulator
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 5 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-650 leading-relaxed">
                      Unlike an Application Load Balancer, which scales out by dynamically updating DNS records to point to changing public IPs, a Network Load Balancer binds a single **static IP address** (either an Elastic IP or private IPv4 address) to each enabled subnet in each Availability Zone.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs text-slate-650">
                        <h4 className="font-bold text-slate-800 text-xs">Firewall Whitelisting Advantages:</h4>
                        <p className="leading-relaxed">
                          Many enterprise networks and third-party partner portals require restricting outbound traffic to a small, immutable list of static IP addresses. Running an NLB allows you to provide static IPs for your cloud ingress points, making it easy to configure strict firewall rules.
                        </p>

                        <div className="acad-takeaway-box">
                          <strong>💡 Zonal Redundancy:</strong> An NLB provisions one static IP address per enabled Availability Zone. If an AZ goes offline, the NLB's DNS record handles failover by directing traffic only to the static IPs of the surviving zones.
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-center text-center font-mono text-xs">
                        <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest block mb-4">Static IP Zonal Mapping</span>
                        
                        <div className="space-y-2.5 text-left max-w-xs mx-auto">
                          <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between">
                            <span className="text-orange-600 font-bold">us-east-1a Subnet</span>
                            <span className="text-slate-700">EIP: 3.208.53.11</span>
                          </div>
                          <div className="bg-white border border-slate-200 p-2.5 rounded-lg flex items-center justify-between">
                            <span className="text-sky-600 font-bold">us-east-1b Subnet</span>
                            <span className="text-slate-700">EIP: 54.88.192.42</span>
                          </div>
                        </div>

                        <p className="text-[10.5px] text-slate-500 mt-4 leading-normal">
                          Client devices can hard-code these two IP addresses in their firewalls, with zero risk of DNS rotation outages.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 6: DIRECT SERVER RETURN */}
                {selectedNote === 'dsr_return' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Network Performance</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Direct Server Return (DSR) Pathing</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('nlb')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Network className="w-3.5 h-3.5" /> Go to NLB Simulator
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 6 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed anl-notebook-desc">
                      In a standard load balancer configuration (Proxy Mode), the load balancer acts as a middleman: it receives requests from the client, forwards them to the server, and then receives response packets from the server to send back to the client. This means all response traffic is routed back through the load balancer, which can create a bandwidth bottleneck.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Interactive DSR comparison panel */}
                      <div className="anl-notebook-inner-card p-4 space-y-4 rounded-xl">
                        <div className="flex justify-between items-center">
                          <span className="anl-notebook-inner-card-title">Interactive DSR Router</span>
                          
                          <div className="anl-notebook-tab-toggle p-0.5 rounded">
                            <button 
                              onClick={() => setNbDsrMode('dsr')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${nbDsrMode === 'dsr' ? 'anl-toggle-active-blue' : 'anl-toggle-inactive'}`}
                            >
                              DSR
                            </button>
                            <button 
                              onClick={() => setNbDsrMode('proxy')}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${nbDsrMode === 'proxy' ? 'anl-toggle-active-blue' : 'anl-toggle-inactive'}`}
                            >
                              Proxy
                            </button>
                          </div>
                        </div>

                        {/* Interactive DSR SVG Diagram */}
                        <div className="anl-notebook-inner-subcard p-2 h-36">
                          <svg width="100%" height="100%" viewBox="0 0 280 140">
                            {/* Nodes */}
                            <g transform="translate(10, 45)">
                              <rect width="45" height="30" rx="4" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                              <text x="22.5" y="18.5" fill="#334155" fontSize="8" textAnchor="middle" fontWeight="bold">Client</text>
                            </g>
                            <g transform="translate(95, 45)">
                              <rect width="55" height="30" rx="4" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1" />
                              <text x="27.5" y="18.5" fill="#0369a1" fontSize="8" textAnchor="middle" fontWeight="bold">NLB L4</text>
                            </g>
                            <g transform="translate(195, 45)">
                              <rect width="55" height="30" rx="4" fill="#dcfce7" stroke="#10b981" strokeWidth="1" />
                              <text x="27.5" y="18.5" fill="#15803d" fontSize="8" textAnchor="middle" fontWeight="bold">Server</text>
                            </g>

                            {/* Inbound path */}
                            <path d="M 55 55 L 95 55" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,2" />
                            <path d="M 150 60 L 195 60" fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,2" />

                            {/* Outbound path */}
                            {nbDsrMode === 'dsr' ? (
                              <>
                                <path d="M 222.5 75 C 222.5 115, 32.5 115, 32.5 75" fill="none" stroke="#06b6d4" strokeWidth="2" strokeDasharray="4,2" />
                                <circle cx="222.5" cy="75" r="3.5" fill="#06b6d4">
                                  <animateMotion dur="2.2s" repeatCount="indefinite" path="M 222.5 75 C 222.5 115, 32.5 115, 32.5 75" />
                                </circle>
                                <text x="127.5" y="125" fill="#0891b2" fontSize="7.5" textAnchor="middle" fontWeight="bold">Direct Bypass Return</text>
                              </>
                            ) : (
                              <>
                                <path d="M 195 68 L 150 68" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                                <path d="M 95 63 L 55 63" fill="none" stroke="#ef4444" strokeWidth="1.5" />
                                <circle cx="195" cy="68" r="3.5" fill="#ef4444">
                                  <animateMotion dur="2.5s" repeatCount="indefinite" path="M 195 68 L 150 68 M 95 63 L 55 63" />
                                </circle>
                                <text x="127.5" y="92" fill="#ef4444" fontSize="7.5" textAnchor="middle">Proxy Loop (Slow)</text>
                              </>
                            )}
                          </svg>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs anl-notebook-desc">
                        <span className="font-extrabold block anl-notebook-label">DSR Technical Mechanics:</span>
                        <p className="leading-relaxed">
                          With **Direct Server Return (DSR)**, the load balancer receives the packet, routes it to the target server, and leaves the client source IP intact. When responding, the server sends response packets directly back to the client's public IP, bypassing the load balancer completely. This improves overall throughput, since response payloads are typically much larger than requests!
                        </p>

                        <div className="acad-takeaway-box">
                          <strong>💡 AWS Implementation:</strong> AWS handles DSR inside the Hyperplane routing layer. Since NLB does not edit the client's packet source fields, backend instances can reply directly to the client, providing high throughput for large downloads.
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* NOTE 7: VIRTUAL FIREWALLS INLINING */}
                {selectedNote === 'gwlb_firewalls' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Layer 3 Ingress</span>
                        <h3 className="text-xl font-black mt-2 font-display anl-notebook-title">GWLB Inline Firewall Topologies</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('integrations')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Cpu className="w-3.5 h-3.5" /> Go to Integrations
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 7 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-650 leading-relaxed">
                      Operating at Layer 3 (Network), the Gateway Load Balancer (GWLB) is designed to run inline security appliances, such as third-party virtual firewalls, intrusion detection and prevention systems (IDS/IPS), or deep packet inspectors.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs text-slate-650">
                        <h4 className="font-bold text-slate-800 text-xs">Transparent Inspection Routing:</h4>
                        <p className="leading-relaxed">
                          Unlike traditional load balancers, a GWLB does not terminate connection flows. Instead, it intercepts raw IP packets, encapsulates them in a GENEVE tunnel header, and routes them to a pool of security appliances. Once inspected and approved, the appliances return the packets to the GWLB, which forwards them transparently to the target application server.
                        </p>

                        <div className="acad-takeaway-box">
                          <strong>💡 Bump-in-the-Wire Pattern:</strong> This design lets you insert security inspection into your traffic path without changing subnet CIDRs, routing tables, or server network card configurations.
                        </div>
                      </div>

                      <div className="anl-notebook-inner-card p-4 rounded-xl flex flex-col justify-center text-center">
                        <span className="anl-notebook-inner-card-title">Transparent Inline Flow Path</span>
                        
                        <div className="flex flex-col items-center gap-1 text-[9.5px] font-mono text-slate-655">
                          <div className="anl-notebook-inner-subcard px-3 py-1.5 rounded-md text-center">
                            💡 Raw Packet Ingress
                          </div>
                          <span className="text-slate-400">&darr;</span>
                          <div className="anl-notebook-inner-subcard-purple px-3 py-1.5 rounded-md text-center text-purple font-semibold">
                            🔒 VPC GWLB Endpoint (GWLBe)
                          </div>
                          <span className="text-slate-400">&darr;</span>
                          <div className="anl-notebook-inner-subcard-purple-dark px-3 py-1.5 rounded-md text-center font-bold">
                            🛡️ GWLB + Firewall Pool (GENEVE UDP 6081)
                          </div>
                          <span className="text-slate-400">&darr;</span>
                          <div className="anl-notebook-inner-subcard px-3 py-1.5 rounded-md text-center">
                            🟢 Clean Target App Instance (Layer 3 raw delivery)
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 8: GENEVE UDP TUNNELING */}
                {selectedNote === 'geneve_encapsulation' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Tunneling Protocol</span>
                        <h3 className="text-xl font-black mt-2 font-display anl-notebook-title">GENEVE Tunneling Protocol</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('integrations')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Cpu className="w-3.5 h-3.5" /> Go to Integrations
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 8 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed anl-notebook-desc">
                      GENEVE (Generic Network Virtualization Encapsulation) is a tunneling protocol that encapsulates raw L3 IP packets into UDP frames (port 6081) to pass metadata alongside raw traffic. This allows the GWLB to pass critical routing context, such as VPC endpoint IDs, flow IDs, and security tags, directly to virtual firewalls.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Interactive Frame Inspector */}
                      <div className="anl-notebook-inner-card p-5 space-y-3 rounded-xl">
                        <div className="flex justify-between items-center mb-1">
                          <span className="anl-notebook-inner-card-title">GENEVE Frame Inspector</span>
                          
                          <button
                            onClick={() => setGenevePayloadType(genevePayloadType === 'SAFE' ? 'MALICIOUS' : 'SAFE')}
                            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-colors ${
                              genevePayloadType === 'SAFE' ? 'anl-geneve-btn-safe' : 'anl-geneve-btn-attack'
                            }`}
                          >
                            {genevePayloadType === 'SAFE' ? 'SAFE' : 'ATTACK DETECT'}
                          </button>
                        </div>

                        <div className="space-y-2 text-[10px] font-mono">
                          <div className="anl-notebook-inner-subcard p-2 rounded">
                            <span className="text-slate-400 text-[8.5px] block font-bold">1. OUTER IP HEADER (ENI to GWLB)</span>
                            <p className="anl-notebook-inner-card-text">Src: 10.0.1.25 (GWLBe) &rarr; Dst: 10.0.3.102 (GWLB)</p>
                            <p className="anl-notebook-inner-card-text">Proto: UDP (Dst Port: 6081)</p>
                          </div>

                          <div className="anl-notebook-inner-subcard-purple p-2 rounded">
                            <span className="text-violet-600 text-[8.5px] block font-bold">2. GENEVE METADATA HEADER</span>
                            <p className="anl-notebook-inner-card-text">VNI: 80020 | Connection Flow ID: 41828</p>
                            <p className="anl-notebook-inner-card-text">VPCE ID: vpce-0a1b2c3d4e5f6</p>
                          </div>

                          <div className={`p-2 rounded border ${genevePayloadType === 'SAFE' ? 'anl-notebook-inner-subcard' : 'anl-notebook-inner-subcard-red-warning'}`}>
                            <span className="text-slate-400 text-[8.5px] block font-bold">3. INNER CUSTOMER PACKET (Client to Server)</span>
                            <p className="anl-notebook-inner-card-text">Src: 198.51.100.4 (Client) &rarr; Dst: 10.0.8.10 (Server)</p>
                            <p className={genevePayloadType === 'SAFE' ? 'anl-notebook-inner-card-text' : 'text-red font-bold'}>
                              Payload: {genevePayloadType === 'SAFE' ? 'GET /index.html' : 'UNION SELECT null, username, password FROM users;'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs text-slate-650">
                        <span className="font-extrabold text-slate-800 block">Why GENEVE over VXLAN?</span>
                        <p className="leading-relaxed">
                          While protocols like VXLAN have static headers, GENEVE supports variable-length options headers. This allows AWS to embed custom metadata, helping security appliances identify which customer VPC or endpoint interface generated the request.
                        </p>

                        <div className="acad-takeaway-box">
                          <strong>💡 Appliance Support:</strong> To integrate with a GWLB, the security appliance must be configured to support GENEVE packet decapsulation and encapsulation, decapsulating packets for inspection and then repacking them with the same metadata options headers!
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* NOTE 9: CROSS-ZONE LOAD BALANCING */}
                {selectedNote === 'cross_zone_lb' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Traffic Equalization</span>
                        <h3 className="text-xl font-black mt-2 font-display anl-notebook-title">Cross-Zone Load Equalizer</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('simulation')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Traffic Simulator
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 9 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed anl-notebook-desc">
                      By default, an Elastic Load Balancer node distributes incoming requests only to targets in its own Availability Zone. If your target groups are distributed unevenly across zones, this default behavior can lead to unequal instance load. Enabling **Cross-Zone Load Balancing** resolves this by letting balancer nodes distribute traffic evenly across all registered targets in all enabled zones.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Interactive Cross-Zone Visual */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider font-mono">Interactive Equalizer</span>
                          
                          <button
                            onClick={() => setCrossZoneActive(!crossZoneActive)}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                              crossZoneActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-550'
                            }`}
                          >
                            Cross-Zone: {crossZoneActive ? 'ENABLED' : 'DISABLED'}
                          </button>
                        </div>

                        {/* Cross-Zone Load Visual Diagram */}
                        <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 h-40 flex flex-col justify-between text-[10px] font-mono">
                          
                          {/* Zone A */}
                          <div className="bg-white border border-slate-200 p-2 rounded flex justify-between items-center text-slate-800">
                            <div>
                              <span className="text-orange-600 font-bold block">Subnet AZ1 (2 Servers)</span>
                              <span className="text-[9px] text-slate-500">Gets 50% traffic (25% per instance)</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${crossZoneActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700 animate-pulse'}`}>
                              {crossZoneActive ? 'Balanced (100% Load)' : 'Divergent Load'}
                            </span>
                          </div>

                          {/* Zone B */}
                          <div className="bg-white border border-slate-200 p-2 rounded flex justify-between items-center text-slate-800">
                            <div>
                              <span className="text-sky-600 font-bold block">Subnet AZ2 (1 Server)</span>
                              <span className="text-[9px] text-slate-500">
                                {crossZoneActive ? 'Gets 33.3% traffic (33.3% load)' : 'Gets 50% traffic (50% load)'}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${crossZoneActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                              {crossZoneActive ? 'Balanced (100% Load)' : 'Overloaded (200% Load!)'}
                            </span>
                          </div>

                        </div>
                      </div>

                      <div className="space-y-4 text-xs anl-notebook-desc">
                        <span className="font-extrabold block anl-notebook-label">Cross-Zone Default Behaviors:</span>
                        
                        <ul className="list-disc pl-4 space-y-1.5">
                          <li>
                            <strong className="text-slate-800">Application Load Balancer:</strong> Cross-Zone Load Balancing is **always enabled** by default, ensuring even load distribution across zones.
                          </li>
                          <li>
                            <strong className="text-slate-800">Network Load Balancer:</strong> Cross-Zone Load Balancing is **disabled** by default. Enabling it incurs a small cross-zone data transfer charge.
                          </li>
                        </ul>

                        <div className="acad-takeaway-box">
                          <strong>💡 Best Practice:</strong> Always enable Cross-Zone Load Balancing for NLB if your target compute capacity is asymmetrical or if targets are not distributed evenly across subnets!
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* NOTE 10: DEREGISTRATION DELAY */}
                {selectedNote === 'health_checks_drain' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Compute Governance</span>
                        <h3 className="text-xl font-black mt-2 font-display anl-notebook-title">Deregistration Delay &amp; Draining</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveSection('simulation')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Activity className="w-3.5 h-3.5" /> Go to Traffic Simulator
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 10 of 10</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-650 leading-relaxed">
                      When a server instance is marked for deregistration (for example, during scale-in events, deployments, or manual decommissioning), the load balancer stops routing new requests to it. However, it keeps active connections open for a specified duration, known as the **Deregistration Delay (Connection Draining)**, to let ongoing requests complete gracefully.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs anl-notebook-desc">
                        <h4 className="font-bold text-xs anl-notebook-label">Configuration Options:</h4>
                        <p className="leading-relaxed">
                          Deregistration delay can be configured per target group between **0 and 3600 seconds** (default: 300 seconds). If your app serves long-lived connection flows (like file uploads or reports generation), set this delay to a larger value to prevent connections from dropping abruptly!
                        </p>

                        <div className="acad-takeaway-box">
                          <strong>💡 Health Probe Cycles:</strong> Target groups verify instance health using health checks. If an instance fails a health check for `unhealthy_threshold` consecutive times, it is marked unhealthy and removed from active routing, with no connection draining delay!
                        </div>
                      </div>

                      <div className="anl-notebook-inner-card p-5 rounded-xl flex flex-col justify-center text-center font-mono text-xs">
                        <span className="anl-notebook-inner-card-title">Deregistration State Transitions</span>
                        
                        <div className="space-y-2 text-[10.5px] text-left">
                          <div className="anl-notebook-inner-subcard-white p-2.5 rounded-lg flex items-center justify-between">
                            <span className="font-bold anl-notebook-label">1. Active Status</span>
                            <span className="text-green font-bold">Healthy &amp; Routing</span>
                          </div>
                          <div className="anl-notebook-inner-subcard-white p-2.5 rounded-lg flex items-center justify-between">
                            <span className="font-bold anl-notebook-label">2. Draining Status</span>
                            <span className="text-orange font-bold">Draining (Active Conns Only)</span>
                          </div>
                          <div className="anl-notebook-inner-subcard-white p-2.5 rounded-lg flex items-center justify-between">
                            <span className="font-bold anl-notebook-label">3. Deregistered Status</span>
                            <span className="text-slate font-bold">Deregistered (Safe to Terminate)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
}
