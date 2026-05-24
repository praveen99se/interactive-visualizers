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

  // ALB Rule Match simulation
  const simulateALBRouting = () => {
    const host = albHostInput.trim().toLowerCase() || 'example.com';
    const path = albPathInput.trim() || '/';
    setAlbLogs([]);
    setMatchedRule('');

    const steps = [
      `🔍 Request Received: HTTP GET on port 443`,
      `🌐 Client Host Header: "${host}" | Request Path: "${path}"`,
      `🔄 Step 1: Evaluating ALB Listener Host Rules...`
    ];

    let finalRule = 'Default Root Rule';
    let targetGroup = 'default-s3-website-tg';

    if (host.includes('api.')) {
      steps.push(`✅ Host rule matched: "api.*"`);
      steps.push(`🔄 Step 2: Evaluating Path-based routing rules...`);
      if (path.startsWith('/api/v1/users')) {
        steps.push(`✅ Path rule matched: "/api/v1/users*"`);
        finalRule = 'Rule 1: Host api.* + Path /api/v1/users';
        targetGroup = 'user-service-tg (Port: 8080)';
      } else if (path.startsWith('/api/v1/orders')) {
        steps.push(`✅ Path rule matched: "/api/v1/orders*"`);
        finalRule = 'Rule 2: Host api.* + Path /api/v1/orders';
        targetGroup = 'order-service-tg (Port: 8081)';
      } else {
        steps.push(`❌ Path mismatch. Falling back to default host target...`);
        finalRule = 'Rule 3: Host api.* (Catch-all)';
        targetGroup = 'core-api-tg (Port: 8000)';
      }
    } else if (host.includes('blog.')) {
      steps.push(`✅ Host rule matched: "blog.*"`);
      finalRule = 'Rule 4: Host blog.*';
      targetGroup = 'blog-wordpress-tg (Port: 80)';
    } else {
      steps.push(`❌ No custom Host match. Evaluating Path-based rules...`);
      if (path.startsWith('/static/')) {
        steps.push(`✅ Path rule matched: "/static/*"`);
        finalRule = 'Rule 5: Path /static/*';
        targetGroup = 's3-assets-tg (S3 Bucket redirection)';
      } else {
        steps.push(`❌ No path rule match. Defaulting routing flow...`);
        finalRule = 'Default Ruleset (Catch-all)';
        targetGroup = 'default-s3-website-tg';
      }
    }

    steps.push(`➡️ Routing Action: Forwarding request to Target Group [${targetGroup}]`);
    steps.push(`✅ Connection successful. Routed via ALB [${finalRule}].`);

    setMatchedRule(finalRule);
    setAlbLogs(steps);
  };

  // NLB Flow Hashing simulation
  const simulateNLBConnection = () => {
    const clients = [
      '198.51.100.4:52184',
      '203.0.113.88:49210',
      '198.51.100.4:53120',
      '10.200.55.12:60431',
      '192.168.1.105:50442'
    ];
    const client = clients[Math.floor(Math.random() * clients.length)];
    const serverIndex = (client.charCodeAt(client.length - 1) + client.charCodeAt(client.length - 2)) % serverCount;
    const serverName = `Target Server ${String.fromCharCode(65 + serverIndex)}`;

    // Simple pseudo-hash
    const hash = '0x' + Array.from(client).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 65536, 17).toString(16).toUpperCase();

    const newConnection = { client, hash, server: serverName };

    setNlbConnections((prev) => [newConnection, ...prev.slice(0, 5)]);
    setNlbLogs((prev) => [
      `⚡ [L4 TCP] Syn received from Client ${client}`,
      `⚙️ Hashing 5-tuple payload... Flow Hash resolved to [${hash}]`,
      `➡️ Forwarding connection flow strictly to backend server [${serverName}]`,
      ...prev.slice(0, 10)
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
            <div className="anl-g2">
              <div className="anl-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ alignSelf: 'flex-start', fontWeight: 600, fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>ALB Listener Rules &amp; Target Forwarding</div>
                <svg width="100%" viewBox="0 0 340 240" style={{ display: 'block' }}>
                  <defs>
                    <marker id="m1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#c2410c"/></marker>
                  </defs>
                  
                  {/* Client */}
                  <circle cx="40" cy="110" r="16" fill="#fef2f2" stroke="#fca5a5"/>
                  <text x="40" y="114" textAnchor="middle" fontSize="12">💻</text>
                  <text x="40" y="138" textAnchor="middle" fontSize="9" fill="var(--color-text-secondary)">Client Request</text>

                  {/* ALB Listener */}
                  <rect x="100" y="70" width="80" height="80" rx="8" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5"/>
                  <text x="140" y="94" textAnchor="middle" fontSize="11" fill="#c2410c" fontWeight="bold">ALB Listener</text>
                  <text x="140" y="110" text-anchor="middle" fontSize="9" fill="#c2410c">Host / Path Rules</text>
                  <text x="140" y="126" text-anchor="middle" fontSize="8" fill="#7c2d12">Port: HTTPS 443</text>

                  {/* Target Groups */}
                  <rect x="230" y="20" width="90" height="40" rx="6" fill={matchedRule.includes('api') && matchedRule.includes('users') ? '#dcfce7' : '#f8fafc'} stroke={matchedRule.includes('api') && matchedRule.includes('users') ? '#22c55e' : '#cbd5e1'} strokeWidth={matchedRule.includes('api') && matchedRule.includes('users') ? '2' : '0.5'}/>
                  <text x="275" y="44" textAnchor="middle" fontSize="9" fill="#1e293b" fontWeight="500">user-service-tg</text>

                  <rect x="230" y="80" width="90" height="40" rx="6" fill={matchedRule.includes('api') && matchedRule.includes('orders') ? '#dcfce7' : '#f8fafc'} stroke={matchedRule.includes('api') && matchedRule.includes('orders') ? '#22c55e' : '#cbd5e1'} strokeWidth={matchedRule.includes('api') && matchedRule.includes('orders') ? '2' : '0.5'}/>
                  <text x="275" y="104" textAnchor="middle" fontSize="9" fill="#1e293b" fontWeight="500">order-service-tg</text>

                  <rect x="230" y="140" width="90" height="40" rx="6" fill={matchedRule.includes('blog') ? '#dcfce7' : '#f8fafc'} stroke={matchedRule.includes('blog') ? '#22c55e' : '#cbd5e1'} strokeWidth={matchedRule.includes('blog') ? '2' : '0.5'}/>
                  <text x="275" y="164" textAnchor="middle" fontSize="9" fill="#1e293b" fontWeight="500">blog-wordpress-tg</text>

                  <rect x="230" y="195" width="90" height="36" rx="6" fill={matchedRule.includes('Default') || matchedRule.includes('static') ? '#dcfce7' : '#f8fafc'} stroke={matchedRule.includes('Default') || matchedRule.includes('static') ? '#22c55e' : '#cbd5e1'} strokeWidth={matchedRule.includes('Default') || matchedRule.includes('static') ? '2' : '0.5'}/>
                  <text x="275" y="217" text-anchor="middle" fontSize="9" fill="#1e293b" fontWeight="500">static-s3-tg</text>

                  {/* Connectors */}
                  <line x1="56" y1="110" x2="96" y2="110" stroke="#c2410c" strokeWidth="1.5" markerEnd="url(#m1)"/>
                  
                  <path d="M180 100 L205 100 L205 40 L226 40" fill="none" stroke={matchedRule.includes('api') && matchedRule.includes('users') ? '#22c55e' : '#6b7280'} strokeWidth={matchedRule.includes('api') && matchedRule.includes('users') ? '2' : '1'} markerEnd="url(#m1)"/>
                  <path d="M180 110 L226 110" fill="none" stroke={matchedRule.includes('api') && matchedRule.includes('orders') ? '#22c55e' : '#6b7280'} strokeWidth={matchedRule.includes('api') && matchedRule.includes('orders') ? '2' : '1'} markerEnd="url(#m1)"/>
                  <path d="M180 120 L205 120 L205 160 L226 160" fill="none" stroke={matchedRule.includes('blog') ? '#22c55e' : '#6b7280'} strokeWidth={matchedRule.includes('blog') ? '2' : '1'} markerEnd="url(#m1)"/>
                  <path d="M180 130 L195 130 L195 213 L226 213" fill="none" stroke={matchedRule.includes('Default') || matchedRule.includes('static') ? '#22c55e' : '#6b7280'} strokeWidth={matchedRule.includes('Default') || matchedRule.includes('static') ? '2' : '1'} markerEnd="url(#m1)"/>
                </svg>
              </div>

              <div>
                <div className="anl-card" style={{ borderLeft: '3px solid #c2410c', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: '#c2410c' }}>How Application Routing Works</div>
                  <div className="anl-kv"><span className="anl-kk" style={{ minWidth: '100px' }}>1. Host-based</span><b>Routes on host (api.example.com vs blog.example.com)</b></div>
                  <div className="anl-kv"><span className="anl-kk" style={{ minWidth: '100px' }}>2. Path-based</span><b>Routes on path prefix (/api/v1/users* vs /static/*)</b></div>
                  <div className="anl-kv"><span className="anl-kk" style={{ minWidth: '100px' }}>3. Headers/Queries</span><b>Routes on custom HTTP headers, methods, or query values</b></div>
                  <div className="anl-kv"><span className="anl-kk" style={{ minWidth: '100px' }}>4. Session Cookie</span><b>Injects "AWSALB" cookie to stick client to same target</b></div>
                </div>

                <div className="anl-card" style={{ border: '2px solid #c2410c' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>ALB Rules Routing Playground</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                    Type custom domain and path request parameters to test which rule maps to which target group:
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', minWidth: '60px', color: 'var(--color-text-secondary)' }}>Host Header:</span>
                      <input
                        type="text"
                        value={albHostInput}
                        onChange={(e) => setAlbHostInput(e.target.value)}
                        placeholder="api.example.com"
                        style={{ flex: 1, fontSize: '11px', padding: '5px 8px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', minWidth: '60px', color: 'var(--color-text-secondary)' }}>GET Path:</span>
                      <input
                        type="text"
                        value={albPathInput}
                        onChange={(e) => setAlbPathInput(e.target.value)}
                        placeholder="/api/v1/users"
                        style={{ flex: 1, fontSize: '11px', padding: '5px 8px', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', outline: 'none' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <button className="anl-btn anl-on" onClick={simulateALBRouting}>Match Rule ▶</button>
                    {matchedRule && (
                      <span className="anl-badge" style={{ background: '#dcfce7', color: '#166534', fontWeight: 600 }}>Matched: {matchedRule}</span>
                    )}
                  </div>

                  <div className="anl-log" style={{ minHeight: '90px', maxHeight: '130px', overflowY: 'auto' }}>
                    {albLogs.length === 0 ? '; Waiting for request trigger...\n; Try hosts: "api.example.com" (with path /api/v1/users or /api/v1/orders) or "blog.example.com"' : albLogs.join('\n')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NLB PANEL */}
        {activeSection === 'nlb' && (
          <div>
            <div className="anl-sec">Network Load Balancer Layer 4 Flow Hashing</div>
            <div className="anl-g2">
              <div className="anl-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ alignSelf: 'flex-start', fontWeight: 600, fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>5-Tuple Flow Hashing to Targets</div>
                <svg width="100%" viewBox="0 0 340 240" style={{ display: 'block' }}>
                  <defs>
                    <marker id="m2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#0369a1"/></marker>
                  </defs>

                  <rect x="10" y="80" width="70" height="70" rx="8" fill="#f0fdfa" stroke="#5eead4" strokeWidth="0.5"/>
                  <text x="45" y="104" text-anchor="middle" fontSize="10" fill="#0f766e" fontWeight="bold">TCP Connection</text>
                  <text x="45" y="118" text-anchor="middle" fontSize="8" fill="#0f766e">IP &amp; Port payload</text>
                  <text x="45" y="130" text-anchor="middle" fontSize="8" fill="#115e59">5-Tuple values</text>

                  <rect x="105" y="70" width="90" height="90" rx="8" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="0.5"/>
                  <text x="150" y="96" text-anchor="middle" fontSize="12" fill="#0369a1" fontWeight="bold">NLB Engine</text>
                  <text x="150" y="116" text-anchor="middle" fontSize="9" fill="#0284c7">Deterministic Hash</text>
                  <text x="150" y="132" text-anchor="middle" fontSize="8" fill="#0284c7">Flow mapping bypass</text>
                  <text x="150" y="146" text-anchor="middle" fontSize="7" fill="#0369a1">Sub-ms delay</text>

                  <rect x="225" y="25" width="100" height="40" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5"/>
                  <text x="275" y="44" text-anchor="middle" fontSize="9" fill="#1e293b" fontWeight="500">Target Server A</text>
                  <text x="275" y="56" text-anchor="middle" fontSize="7" fill="#64748b">Subnet: AZ us-east-1a</text>

                  <rect x="225" y="100" width="100" height="40" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5"/>
                  <text x="275" y="119" text-anchor="middle" fontSize="9" fill="#1e293b" fontWeight="500">Target Server B</text>
                  <text x="275" y="131" text-anchor="middle" fontSize="7" fill="#64748b">Subnet: AZ us-east-1b</text>

                  <rect x="225" y="175" width="100" height="40" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5"/>
                  <text x="275" y="194" text-anchor="middle" fontSize="9" fill="#1e293b" fontWeight="500">Target Server C</text>
                  <text x="275" y="206" text-anchor="middle" fontSize="7" fill="#64748b">Subnet: AZ us-east-1c</text>

                  <line x1="80" y1="115" x2="101" y2="115" stroke="#0369a1" strokeWidth="1.5" markerEnd="url(#m2)"/>
                  <path d="M195 105 L218 105 L218 45 L222 45" fill="none" stroke="#6b7280" strokeWidth="1" markerEnd="url(#m2)"/>
                  <path d="M195 115 L222 115" fill="none" stroke="#6b7280" strokeWidth="1" markerEnd="url(#m2)"/>
                  <path d="M195 125 L218 125 L218 195 L222 195" fill="none" stroke="#6b7280" strokeWidth="1" markerEnd="url(#m2)"/>
                </svg>
              </div>

              <div>
                <div className="anl-card" style={{ borderLeft: '3px solid #0369a1', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: '#0369a1' }}>Key Features of Layer 4 NLB</div>
                  <div className="anl-kv"><span className="anl-kk" style={{ minWidth: '100px' }}>1. Flow Hashing</span><b>Determined by Src IP/Port + Dst IP/Port + Protocol</b></div>
                  <div className="anl-kv"><span className="anl-kk" style={{ minWidth: '100px' }}>2. Static IPs</span><b>Binds a static Elastic IP to each AZ subnet</b></div>
                  <div className="anl-kv"><span className="anl-kk" style={{ minWidth: '100px' }}>3. Zero HTTP editing</span><b>Bypasses HTTP header parsing, forwarding TCP packets raw</b></div>
                  <div className="anl-kv"><span className="anl-kk" style={{ minWidth: '100px' }}>4. High Performance</span><b>Handles burst rates of millions of RPS with &lt;1ms latency</b></div>
                </div>

                <div className="anl-card" style={{ border: '2px solid #0369a1' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>NLB Flow Hashing Simulator</div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                    Click below to generate random TCP requests. NLB hashes the client's socket information and routes connection consistently to target servers:
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <button className="anl-btn anl-on-nlb" onClick={simulateNLBConnection}>Send TCP request ▶</button>
                    <button className="anl-btn" onClick={() => { setNlbConnections([]); setNlbLogs([]); }}>Clear Log</button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                    {nlbConnections.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
                        {nlbConnections.map((conn, idx) => (
                          <div key={idx} style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', background: 'var(--color-background-secondary)', padding: '4px 8px', borderRadius: '4px', border: '0.5px solid var(--color-border-tertiary)' }}>
                            <span>Client: <code>{conn.client}</code></span>
                            <span style={{ color: '#0369a1', fontWeight: 600 }}>Hash: {conn.hash}</span>
                            <span style={{ color: '#15803d', fontWeight: 'bold' }}>→ {conn.server}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', padding: '6px', textAlign: 'center' }}>No active connections. Click send request above.</div>
                    )}
                  </div>

                  <div className="anl-log" style={{ minHeight: '80px', maxHeight: '100px', overflowY: 'auto', fontSize: '10px' }}>
                    {nlbLogs.length === 0 ? '; Waiting for L4 TCP flows...' : nlbLogs.join('\n')}
                  </div>
                </div>
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
        {activeSection === 'integrations' && (
          <div>
            <div className="anl-sec">Full Production AWS Infrastructure Integration Map</div>
            <div className="anl-card">
              <svg width="100%" viewBox="0 0 680 380" style={{ display: 'block', margin: '0 auto' }}>
                <defs>
                  <marker id="ar1" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#c2410c"/></marker>
                  <marker id="ar2" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#15803d"/></marker>
                  <marker id="ar3" markerWidth="7" markerHeight="7" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#0369a1"/></marker>
                </defs>
                <rect x="10" y="10" width="660" height="360" rx="16" fill="var(--color-background-secondary)" stroke="var(--color-border-secondary)" strokeWidth="0.5"/>
                <text x="340" y="30" text-anchor="middle" fontSize="12" fill="var(--color-text-primary)" fontWeight="500">Multi-Tier High Availability Load Balancer Infrastructure</text>

                <rect x="25" y="44" width="100" height="44" rx="10" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
                <text x="75" y="64" text-anchor="middle" fontSize="11" fill="#dc2626" fontWeight="500">🌐 Users</text>
                <text x="75" y="80" text-anchor="middle" fontSize="10" fill="#dc2626">Public web clients</text>

                <rect x="180" y="44" width="120" height="44" rx="10" fill="#faf5ff" stroke="#c4b5fd" strokeWidth="0.5"/>
                <text x="240" y="64" text-anchor="middle" fontSize="12" fill="#7c3aed" fontWeight="500">🚀 Route 53</text>
                <text x="240" y="80" text-anchor="middle" fontSize="10" fill="#7c3aed">Zonal host check DNS</text>

                <rect x="360" y="44" width="120" height="44" rx="10" fill="#ccfbf1" stroke="#5eead4" strokeWidth="0.5"/>
                <text x="420" y="64" text-anchor="middle" fontSize="11" fill="#0f766e" fontWeight="500">🛡️ AWS WAF</text>
                <text x="420" y="80" text-anchor="middle" fontSize="10" fill="#0f766e">SQL Injection Block</text>

                <rect x="520" y="44" width="120" height="44" rx="10" fill="#fff7ed" stroke="#fed7aa" strokeWidth="0.5"/>
                <text x="580" y="64" text-anchor="middle" fontSize="11" fill="#c2410c" fontWeight="500">☁️ CloudFront</text>
                <text x="580" y="80" text-anchor="middle" fontSize="10" fill="#c2410c">Static Asset CDN</text>

                {/* ALB Public Zone */}
                <rect x="180" y="140" width="300" height="60" rx="12" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1"/>
                <text x="330" y="158" text-anchor="middle" fontSize="11" fill="#c2410c" fontWeight="bold">🌐 Public Tier — Application Load Balancer</text>
                <text x="330" y="174" text-anchor="middle" fontSize="9" fill="#7c2d12">Port: 443 HTTPS SSL termination · Dynamic DNS</text>

                {/* Private Subnets - Target EC2 Instance pools */}
                <rect x="40" y="240" width="260" height="70" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                <text x="170" y="258" text-anchor="middle" fontSize="11" fill="#15803d" fontWeight="bold">🔒 Private Web subnet AZ1</text>
                <text x="170" y="278" text-anchor="middle" fontSize="10" fill="#166534">EC2 Node A (Target Group 1)</text>
                <text x="170" y="294" text-anchor="middle" fontSize="9" fill="#166534">Port: 80 (routed from ALB)</text>

                <rect x="360" y="240" width="260" height="70" rx="10" fill="#dcfce7" stroke="#86efac" strokeWidth="0.5"/>
                <text x="490" y="258" text-anchor="middle" fontSize="11" fill="#15803d" fontWeight="bold">🔒 Private Web subnet AZ2</text>
                <text x="490" y="278" text-anchor="middle" fontSize="10" fill="#166534">EC2 Node B (Target Group 1)</text>
                <text x="490" y="294" text-anchor="middle" fontSize="9" fill="#166534">Port: 80 (routed from ALB)</text>

                {/* DB backend */}
                <rect x="270" y="330" width="140" height="34" rx="6" fill="#fef2f2" stroke="#fca5a5" strokeWidth="0.5"/>
                <text x="340" y="352" text-anchor="middle" fontSize="10" fill="#dc2626" fontWeight="bold">🗄️ RDS Database Subnet</text>

                {/* Connections */}
                <line x1="125" y1="66" x2="175" y2="66" stroke="#6b7280" strokeWidth="1" strokeDasharray="3,2"/>
                <line x1="300" y1="66" x2="355" y2="66" stroke="#6b7280" strokeWidth="1" strokeDasharray="3,2"/>
                <line x1="480" y1="66" x2="515" y2="66" stroke="#6b7280" strokeWidth="1" strokeDasharray="3,2"/>
                
                <path d="M580 88 L580 115 L330 115 L330 135" fill="none" stroke="#c2410c" strokeWidth="1.5" markerEnd="url(#ar1)"/>
                
                <path d="M280 200 L280 215 L170 215 L170 235" fill="none" stroke="#15803d" strokeWidth="1.5" markerEnd="url(#ar2)"/>
                <path d="M380 200 L380 215 L490 215 L490 235" fill="none" stroke="#15803d" strokeWidth="1.5" markerEnd="url(#ar2)"/>
                
                <line x1="170" y1="310" x2="330" y2="330" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,2"/>
                <line x1="490" y1="310" x2="350" y2="330" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,2"/>
              </svg>
            </div>

            <div className="anl-g2">
              <div>
                <div className="anl-sec">Secure Network Architecture Benefits</div>
                <div className="anl-card" style={{ borderLeft: '3px solid #15803d', minHeight: '190px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#15803d' }}>Why keep Web Servers in Private Subnets?</div>
                  <ul className="anl-ck">
                    <li><b>Zero Direct Exposure:</b> Private servers do not assign public IPs. They cannot be targeted directly by bad actors on the internet.</li>
                    <li><b>Single Gate Entry:</b> Standard public clients route solely via public ALBs, which filters threats via integrated AWS WAF Web ACL firewalls.</li>
                    <li><b>Automatic Certificate Management:</b> ALB terminates SSL/TLS certificates at the load-balancer tier, eliminating SSL compute overhead on web instances.</li>
                    <li><b>Independent Scaling:</b> Auto Scaling Groups scale server counts dynamically based on ALB metric triggers without disrupting DNS names.</li>
                  </ul>
                </div>
              </div>

              <div>
                <div className="anl-sec">Zonal and Link integrations</div>
                <div className="anl-card" style={{ borderLeft: '3px solid #0369a1', minHeight: '190px' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#0369a1' }}>Container &amp; Interface Privatelink Routing</div>
                  <ul className="anl-ck">
                    <li><b>ECS/EKS Dynamic Mapping:</b> ALB integrates natively with AWS ECS container pools, tracking target IP addresses dynamically as docker nodes scale.</li>
                    <li><b>AWS Lambda Target:</b> ALBs can route incoming HTTP requests directly to trigger serverless AWS Lambda operations.</li>
                    <li><b>PrivateLink Gateway Endpoint:</b> NLB serves as the core layer of VPC Endpoint Services, securely exposing backend services across VPC interfaces without Internet Gateways.</li>
                    <li><b>Route 53 Health Integration:</b> Route 53 queries ALB health check status automatically to fail over DNS flows globally.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

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
