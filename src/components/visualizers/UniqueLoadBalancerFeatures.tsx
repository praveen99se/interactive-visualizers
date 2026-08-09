import { useState } from 'react';
import { 
  Shield, 
  Globe, 
  Activity, 
  Sliders,
  HelpCircle,
  Lock
} from 'lucide-react';

interface UniqueLoadBalancerFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueLoadBalancerFeatures({ provider }: UniqueLoadBalancerFeaturesProps) {
  // --- AWS STATES ---
  // Weighted Target Group Canary Simulator
  const [weightA, setWeightA] = useState(80);
  const [weightB, setWeightB] = useState(20);
  const [trafficRequests, setTrafficRequests] = useState<{ id: number; target: 'tg-v1' | 'tg-v2' }[]>([]);
  
  // --- AZURE STATES ---
  // Cookie Session Affinity Simulator
  const [affinityEnabled, setAffinityEnabled] = useState(true);
  const [cookieClientLogs, setCookieClientLogs] = useState<string[]>([]);
  const [activeNode, setActiveNode] = useState<'Node-01' | 'Node-02'>('Node-01');

  // --- GCP STATES ---
  // Global Anycast IP Routing & Cloud Armor Simulator
  const [regionRequest, setRegionRequest] = useState<'us-east' | 'eu-west' | 'asia-east'>('us-east');
  const [ipRoutingLogs, setIpRoutingLogs] = useState<string[]>([]);
  const [armorRule, setArmorRule] = useState<'ALLOW' | 'DENY_403'>('ALLOW');

  // AWS Canary Request Dispatcher
  const dispatchAwsCanaryTraffic = () => {
    const total = weightA + weightB;
    const rand = Math.random() * total;
    const target = rand < weightA ? 'tg-v1' : 'tg-v2';
    setTrafficRequests(prev => [{ id: Date.now(), target }, ...prev.slice(0, 7)]);
  };

  // Azure Cookie Affinity Test
  const testAzureCookieAffinity = () => {
    if (affinityEnabled) {
      setCookieClientLogs(prev => [
        `[AppGateway] Cookie ARRAffinity=9a8b7c present. Pinning request to ${activeNode}.`,
        ...prev.slice(0, 5)
      ]);
    } else {
      const nextNode = Math.random() > 0.5 ? 'Node-01' : 'Node-02';
      setActiveNode(nextNode);
      setCookieClientLogs(prev => [
        `[AppGateway] Cookie disabled. Round-robin routed request to ${nextNode}.`,
        ...prev.slice(0, 5)
      ]);
    }
  };

  // GCP Global Anycast Traffic Test
  const testGcpAnycastRouting = () => {
    if (armorRule === 'DENY_403') {
      setIpRoutingLogs(prev => [
        `🛑 [Cloud Armor] Blocked request from ${regionRequest} (HTTP 403 Forbidden - Security Policy Match).`,
        ...prev.slice(0, 5)
      ]);
      return;
    }

    const pops = {
      'us-east': 'PoP Ashburn, VA (3ms) ➔ Backend ig-us-east1',
      'eu-west': 'PoP Frankfurt, DE (5ms) ➔ Backend ig-europe-west1',
      'asia-east': 'PoP Tokyo, JP (4ms) ➔ Backend ig-asia-east1'
    };

    setIpRoutingLogs(prev => [
      `🌐 [Global Anycast IP 34.102.136.10] Ingress via ${pops[regionRequest]}`,
      ...prev.slice(0, 5)
    ]);
  };

  return (
    <div className="space-y-4 animate-fadeIn text-left mt-2">
      {/* Overview Section & Card - Matches Integrations/Infra Tab Theme */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '6px', color: 'var(--color-text-primary)' }} className="flex items-center gap-2 font-display">
          <span>✨ Advanced Load Balancer Feature Sandboxes</span>
        </div>
        <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }} className="font-sans">
          Explore provider-specific routing capabilities including weighted target group canaries, cookie session stickiness, and global Anycast IP security policy enforcement.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* AWS ELB: WEIGHTED TARGET GROUPS                                           */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div>
          <div className="anl-sec">AWS Elastic Load Balancing — Weighted Target Group Canary &amp; OIDC Auth</div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #ea580c', marginBottom: 0 }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '8px' }} className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-orange-600" />
                  AWS ALB Weighted Target Group Canary Sandbox
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                  AWS ALB supports weighted routing across target groups. You can direct a specified percentage of incoming production traffic to a new version (Canary deployment) without needing external service meshes.
                </p>

                {/* Controls */}
                <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                  <div className="space-y-3" style={{ fontSize: '11px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                        <span>Target Group v1 (Production):</span>
                        <span style={{ color: '#0284c7', fontFamily: 'monospace' }}>{weightA}% Weight</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={weightA} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setWeightA(val);
                          setWeightB(100 - val);
                        }}
                        style={{ width: '100%', accentColor: '#0284c7' }}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
                        <span>Target Group v2 (Canary Release):</span>
                        <span style={{ color: '#ea580c', fontFamily: 'monospace' }}>{weightB}% Weight</span>
                      </div>
                      <input 
                        type="range" min="0" max="100" value={weightB} 
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setWeightB(val);
                          setWeightA(100 - val);
                        }}
                        style={{ width: '100%', accentColor: '#ea580c' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Traffic Stream Terminal Log */}
                <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                  {trafficRequests.length > 0 ? (
                    trafficRequests.map((req) => (
                      <div key={req.id} style={{ color: req.target === 'tg-v1' ? '#0284c7' : '#ea580c', fontWeight: 500 }}>
                        🚀 HTTP GET /api ➔ Routed to <strong>{req.target === 'tg-v1' ? 'tg-v1 (v1.4.0 Prod)' : 'tg-v2 (v1.5.0 Canary)'}</strong>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--color-text-tertiary)' }}>Click "Send Test HTTP Request"...</div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <button 
                  onClick={dispatchAwsCanaryTraffic} 
                  className="anl-btn anl-on-alb"
                  style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}
                >
                  🚀 Send Test HTTP Request
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #ea580c', marginBottom: 0 }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '8px' }} className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-orange-600" />
                  AWS ALB OIDC Auth Offloading
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                  ALB can authenticate users via OpenID Connect (OIDC) compatible identity providers (Cognito, Auth0, Okta) directly at the load balancer level before forwarding traffic to target instances.
                </p>
              </div>
              <div style={{ background: 'rgba(234,88,12,0.06)', border: '1px solid rgba(234,88,12,0.2)', borderRadius: '8px', padding: '10px', fontSize: '11px', color: 'var(--color-text-primary)' }}>
                💡 Application code receives verified user claims via <code style={{ background: 'rgba(234,88,12,0.15)', padding: '2px 4px', borderRadius: '4px', color: '#c2410c', fontFamily: 'monospace', fontWeight: 'bold' }}>x-amzn-oidc-data</code> JWT header, removing the need to implement OAuth SDKs in backend microservices.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE: COOKIE SESSION AFFINITY                                            */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div>
          <div className="anl-sec">Azure Application Gateway — Cookie Session Affinity &amp; URL Path Maps</div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0284c7', marginBottom: 0 }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '8px' }} className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-600" />
                  Azure App Gateway Cookie Affinity Sandbox
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                  Azure Application Gateway uses a gateway-managed cookie (<code style={{ background: 'rgba(2,132,199,0.1)', padding: '2px 4px', borderRadius: '4px', color: '#0284c7', fontFamily: 'monospace', fontWeight: 'bold' }}>ARRAffinity</code>) to maintain session stickiness for un-decoupled stateful web applications.
                </p>

                <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: 'var(--color-text-primary)' }}>
                    <span>Cookie Affinity Setting:</span>
                    <span style={{ color: affinityEnabled ? '#16a34a' : '#dc2626', fontFamily: 'monospace' }}>
                      {affinityEnabled ? 'ENABLED (ARRAffinity Cookie)' : 'DISABLED (Round Robin)'}
                    </span>
                  </div>
                  <button 
                    onClick={() => setAffinityEnabled(!affinityEnabled)}
                    className={`anl-btn ${affinityEnabled ? 'anl-on-nlb' : ''}`}
                    style={{ width: '100%', fontWeight: 'bold', padding: '6px' }}
                  >
                    Toggle Cookie Affinity ({affinityEnabled ? 'ON' : 'OFF'})
                  </button>
                </div>

                {/* Logs */}
                <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                  {cookieClientLogs.length > 0 ? (
                    cookieClientLogs.map((log, index) => <div key={index}>{log}</div>)
                  ) : (
                    <div style={{ color: 'var(--color-text-tertiary)' }}>Click "Send Client Session Request"...</div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <button 
                  onClick={testAzureCookieAffinity} 
                  className="anl-btn anl-on-nlb"
                  style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}
                >
                  🌐 Send Client Session Request
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0284c7', marginBottom: 0 }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '8px' }} className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-sky-600" />
                  URL Path Maps
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                  Azure Application Gateway uses URL Path Maps to inspect incoming URI request paths (e.g., <code style={{ background: 'rgba(2,132,199,0.1)', padding: '2px 4px', borderRadius: '4px', color: '#0284c7', fontFamily: 'monospace' }}>/images/*</code> or <code style={{ background: 'rgba(2,132,199,0.1)', padding: '2px 4px', borderRadius: '4px', color: '#0284c7', fontFamily: 'monospace' }}>/video/*</code>) and route requests to dedicated backend pool VMs.
                </p>
              </div>
              <div style={{ background: 'rgba(2,132,199,0.06)', border: '1px solid rgba(2,132,199,0.2)', borderRadius: '8px', padding: '10px', fontSize: '11px', color: 'var(--color-text-primary)' }}>
                💡 Combines SSL Termination, WAF protection, and Path Map routing into a single managed Azure Gateway instance.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP: GLOBAL ANYCAST & CLOUD ARMOR                                         */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div>
          <div className="anl-sec">Google Cloud HTTP(S) Load Balancing — Global Anycast IP &amp; Cloud Armor</div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #10b981', marginBottom: 0 }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '8px' }} className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  GCP Global Anycast IP &amp; Cloud Armor Sandbox
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                  Google Cloud HTTP(S) Load Balancers use a single global Anycast IPv4 address. Traffic enters Google's private fiber network at the nearest Point of Presence (PoP) worldwide, protected by Cloud Armor.
                </p>

                {/* Selector */}
                <div className="grid grid-cols-2 gap-3 mb-3" style={{ fontSize: '11px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', color: 'var(--color-text-primary)' }}>Simulate Client Region:</label>
                    <select 
                      value={regionRequest} 
                      onChange={(e) => setRegionRequest(e.target.value as any)}
                      className="anl-notebook-input"
                      style={{ padding: '6px', fontSize: '11px', fontWeight: 600 }}
                    >
                      <option value="us-east">US East (Ashburn)</option>
                      <option value="eu-west">Europe West (Frankfurt)</option>
                      <option value="asia-east">Asia East (Tokyo)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '4px', color: 'var(--color-text-primary)' }}>Cloud Armor Policy:</label>
                    <select 
                      value={armorRule} 
                      onChange={(e) => setArmorRule(e.target.value as any)}
                      className="anl-notebook-input"
                      style={{ padding: '6px', fontSize: '11px', fontWeight: 600 }}
                    >
                      <option value="ALLOW">ALLOW (Default Pass)</option>
                      <option value="DENY_403">DENY 403 (Security Rule Block)</option>
                    </select>
                  </div>
                </div>

                {/* Logs */}
                <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                  {ipRoutingLogs.length > 0 ? (
                    ipRoutingLogs.map((log, index) => <div key={index}>{log}</div>)
                  ) : (
                    <div style={{ color: 'var(--color-text-tertiary)' }}>Click "Test Global Anycast Ingress"...</div>
                  )}
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <button 
                  onClick={testGcpAnycastRouting} 
                  className="anl-btn anl-on-simulation"
                  style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}
                >
                  ⚡ Test Global Anycast Ingress
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #10b981', marginBottom: 0 }}>
              <div>
                <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '8px' }} className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" />
                  Single Global Anycast IP
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                  Unlike AWS where ALB IPs change per AZ, GCP assigns 1 static Anycast IP for the entire world. Requests are automatically routed to the closest healthy regional backend instance group.
                </p>
              </div>
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px', padding: '10px', fontSize: '11px', color: 'var(--color-text-primary)' }}>
                💡 If the primary region (e.g. US East) overflows or fails, Anycast instantly re-routes requests to another region without DNS propagation delays.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
