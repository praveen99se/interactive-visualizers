import { useState } from 'react';
import {
  Shield,
  Key,
  Play,
  SlidersHorizontal,
  BookOpen,
  Terminal,
  Server,
  Activity,
  Layers,
  Search,
  Eye
} from 'lucide-react';

type TabType = 'intro' | 'acm' | 'waf' | 'ddos' | 'scanners';

interface LogRow {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export default function NetworkAndEdgeSecurityVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('intro');

  // ==========================================
  // TAB 1 STATE: Topics & Compare Selection
  // ==========================================
  const [selectedTopic, setSelectedTopic] = useState<'waf' | 'shield' | 'guardduty' | 'inspector' | 'macie'>('waf');

  // ==========================================
  // TAB 2 STATE: ACM & Expiration Check (Image 1)
  // ==========================================
  const [certType, setCertType] = useState<'request' | 'import'>('request');
  const [redirectActive, setRedirectActive] = useState<boolean>(true);
  const [acmState, setAcmState] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [acmLogs, setAcmLogs] = useState<LogRow[]>([]);
  const [acmEvalStep, setAcmEvalStep] = useState<number>(0);

  // ==========================================
  // TAB 3 STATE: WAF WebACL Rules & API Gateway Endpoints
  // ==========================================
  const [apigwType, setApigwType] = useState<'edge' | 'regional' | 'private'>('edge');
  const [rateLimitEnabled, setRateLimitEnabled] = useState<boolean>(true);
  const [sqliBlockedEnabled, setSqliBlockedEnabled] = useState<boolean>(true);
  const [geoBlockEnabled, setGeoBlockEnabled] = useState<boolean>(false);
  const [wafState, setWafState] = useState<'idle' | 'running' | 'allowed' | 'blocked'>('idle');
  const [wafLogs, setWafLogs] = useState<LogRow[]>([]);
  const [wafSimAction, setWafSimAction] = useState<'clean' | 'ddos_flood' | 'sql_injection' | 'foreign_ip'>('clean');

  // ==========================================
  // TAB 4 STATE: AWS DDoS Resilience End-to-End (Image 2)
  // ==========================================
  const [ddosMitigation, setDdosMitigation] = useState<'none' | 'shield_standard' | 'shield_advanced'>('none');
  const [ddosTrafficState, setDdosTrafficState] = useState<'normal' | 'attack'>('normal');
  const [ddosSimLogs, setDdosSimLogs] = useState<LogRow[]>([]);
  const [ddosSimState, setDdosSimState] = useState<'idle' | 'running'>('idle');

  // ==========================================
  // TAB 5 STATE: Intelligent Scanners
  // ==========================================
  const [scannerType, setScannerType] = useState<'guardduty' | 'inspector' | 'macie'>('guardduty');
  const [scannerLogs, setScannerLogs] = useState<LogRow[]>([]);
  const [scannerState, setScannerState] = useState<'idle' | 'scanning' | 'alert' | 'secure'>('idle');

  // ==========================================
  // TAB 2 SIMULATOR: ACM Expiration check & HTTP-HTTPS redirects
  // ==========================================
  const runAcmExpirationCheck = async () => {
    if (acmState === 'running') return;
    setAcmState('running');
    setAcmLogs([]);
    setAcmEvalStep(0);
    const timestamp = new Date().toLocaleTimeString();

    setAcmLogs(prev => [...prev, { timestamp, message: `[AWS CONFIG] Triggering continuous compliance audit: acm-certificate-expiration-check managed rule...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 600));
    setAcmEvalStep(1);

    setAcmLogs(prev => [...prev, { timestamp, message: `[AWS CONFIG] Evaluating active ACM SSL/TLS certificates expiration dates...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 800));
    setAcmEvalStep(2);

    if (certType === 'import') {
      setAcmLogs(prev => [
        ...prev,
        { timestamp, message: `⚠️ [NON-COMPLIANT] 3rd-party imported certificate "app.corporate.internal" expires in 12 days!`, type: 'warn' },
        { timestamp, message: `💡 [INFO] Imported certificates do not support AWS automated renewals. Continuous tracking is required!`, type: 'warn' },
        { timestamp, message: `[EVENTBRIDGE] Dispatching non-compliance rule event to EventBridge bus...`, type: 'info' }
      ]);
      await new Promise(r => setTimeout(r, 800));
      setAcmEvalStep(3);

      setAcmLogs(prev => [
        ...prev,
        { timestamp, message: `🟢 [Target SNS] Notification dispatched: SSL Expiry Alert emailed to admin@corporate.internal`, type: 'success' },
        { timestamp, message: `🟢 [Target SQS] Queue "SSL-Remediation-Queue" logged message for ITSM ticket creation.`, type: 'success' },
        { timestamp, message: `[COMPLETED] Expiration check completed with active drift alarms raised.`, type: 'success' }
      ]);
      setAcmState('success');
    } else {
      setAcmLogs(prev => [
        ...prev,
        { timestamp, message: `🟢 [COMPLIANT] AWS requested certificate "*.corporate.internal" is active. DNS validation validated.`, type: 'success' },
        { timestamp, message: `💡 [AUTO RENEW] ACM manages automated renewals via CNAME records. No expiration drift alert raised.`, type: 'success' },
        { timestamp, message: `[COMPLETED] Certificate is compliant and fully secured.`, type: 'success' }
      ]);
      setAcmState('success');
      setAcmEvalStep(3);
    }
  };

  const runAcmRedirectSim = async () => {
    if (acmState === 'running') return;
    setAcmState('running');
    setAcmLogs([]);
    const timestamp = new Date().toLocaleTimeString();

    setAcmLogs(prev => [...prev, { timestamp, message: `[CLIENT] Requesting HTTP Resource: http://app.corporate.internal on port 80...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 600));

    if (redirectActive) {
      setAcmLogs(prev => [
        ...prev,
        { timestamp, message: `💡 [ALB REDIRECT] Application Load Balancer HTTP listener rule intercepts request.`, type: 'warn' },
        { timestamp, message: `↩️ [STATUS 301] Redirecting client permanently to HTTPS: https://app.corporate.internal:443`, type: 'info' }
      ]);
      await new Promise(r => setTimeout(r, 800));

      setAcmLogs(prev => [
        ...prev,
        { timestamp, message: `[CLIENT] Establising secure HTTPS connection on port 443...`, type: 'info' },
        { timestamp, message: `🔑 [ALB TLS TERMINATION] Complete TLS handshake with ALB using ACM wildcard certificate (*.corporate.internal).`, type: 'success' },
        { timestamp, message: `🟢 [BACKEND ROUTE] ALB decrypts and forwards secure HTTP payload down to ASG EC2 private subnet instances.`, type: 'success' }
      ]);
      setAcmState('success');
    } else {
      setAcmLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [SECURITY BREACH] ALB has HTTP Listener HTTP-to-HTTPS redirect disabled!`, type: 'error' },
        { timestamp, message: `💥 [UNENCRYPTED PASS] ALB forwards raw unencrypted HTTP traffic down to target ASG instances. Payload exposed to MITM snooping!`, type: 'error' }
      ]);
      setAcmState('failed');
    }
  };

  const resetAcmSim = () => {
    setAcmState('idle');
    setAcmLogs([]);
    setAcmEvalStep(0);
  };

  // ==========================================
  // TAB 3 SIMULATOR: WAF WebACL Rules & API Gateway
  // ==========================================
  const runWafSimulation = async () => {
    if (wafState === 'running') return;
    setWafState('running');
    setWafLogs([]);
    const timestamp = new Date().toLocaleTimeString();

    setWafLogs(prev => [
      ...prev,
      { timestamp, message: `[API GATEWAY] API Ingress hit: Type: [${apigwType.toUpperCase()}] Endpoint`, type: 'info' },
      { timestamp, message: `[WAF] Intercepting request. Active WebACL inspection pipeline triggered.`, type: 'info' }
    ]);
    await new Promise(r => setTimeout(r, 800));

    if (wafSimAction === 'clean') {
      setWafLogs(prev => [
        ...prev,
        { timestamp, message: `🟢 [PASS] Request passes rate-limiting thresholds (< 100 requests/5 min).`, type: 'success' },
        { timestamp, message: `🟢 [PASS] No malicious SQL string payloads detected in request URI/Body.`, type: 'success' },
        { timestamp, message: `[ALLOWED] Forwarded request cleanly to regional ALB backend target.`, type: 'success' }
      ]);
      setWafState('allowed');
    } else if (wafSimAction === 'sql_injection') {
      setWafLogs(prev => [...prev, { timestamp, message: `[WAF EVALUATE] Checking request body for SQL injection signatures...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 600));

      if (sqliBlockedEnabled) {
        setWafLogs(prev => [
          ...prev,
          { timestamp, message: `🚨 [BLOCKED] SQL Injection detected: URL parameter contains malicious string: "UNION SELECT * FROM user_keys"`, type: 'error' },
          { timestamp, message: `[HALTED] 403 Forbidden - WAF WebACL rule "BlockSQLi" blocked API transaction!`, type: 'error' }
        ]);
        setWafState('blocked');
      } else {
        setWafLogs(prev => [
          ...prev,
          { timestamp, message: `⚠️ [BYPASSED] SQL Injection payload allowed. Rule "BlockSQLi" is disabled!`, type: 'warn' },
          { timestamp, message: `💥 [EXPOSED] Malicious query forwarded to regional database. SQL Injection succeeded!`, type: 'error' }
        ]);
        setWafState('allowed');
      }
    } else if (wafSimAction === 'ddos_flood') {
      setWafLogs(prev => [...prev, { timestamp, message: `[WAF EVALUATE] Evaluating client transaction count over 5-minute window...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 600));

      if (rateLimitEnabled) {
        setWafLogs(prev => [
          ...prev,
          { timestamp, message: `🚨 [BLOCKED] Rate Limit exceeded! IP 198.51.100.44 sent 4,500 requests in 30 seconds.`, type: 'error' },
          { timestamp, message: `[HALTED] 429 Too Many Requests - WAF WebACL rate-limiting rule activated.`, type: 'error' }
        ]);
        setWafState('blocked');
      } else {
        setWafLogs(prev => [
          ...prev,
          { timestamp, message: `⚠️ [BYPASSED] Rate limiting is disabled! 4,550 requests forwarded to ALB.`, type: 'warn' },
          { timestamp, message: `💥 [SATURATED] Regional EC2 compute instances saturated! CPU spiked to 100%.`, type: 'error' }
        ]);
        setWafState('allowed');
      }
    } else {
      // foreign_ip
      setWafLogs(prev => [...prev, { timestamp, message: `[WAF EVALUATE] Inspecting request origin IP Geo-location dataset...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 600));

      if (geoBlockEnabled) {
        setWafLogs(prev => [
          ...prev,
          { timestamp, message: `🚨 [BLOCKED] Geo-restriction matched: Request origin IP originates from restricted geoboundary.`, type: 'error' },
          { timestamp, message: `[HALTED] 403 Forbidden - WebACL Geo-Blocking rule triggered.`, type: 'error' }
        ]);
        setWafState('blocked');
      } else {
        setWafLogs(prev => [
          ...prev,
          { timestamp, message: `🟢 [PASS] Geo-blocking rule disabled or not matched. Request allowed to traverse.`, type: 'success' },
          { timestamp, message: `[ALLOWED] API transaction completed successfully.`, type: 'success' }
        ]);
        setWafState('allowed');
      }
    }
  };

  const resetWafSim = () => {
    setWafState('idle');
    setWafLogs([]);
  };

  // ==========================================
  // TAB 4 SIMULATOR: AWS DDoS Resilience End-to-End (Image 2)
  // ==========================================
  const runDdosSimulation = async () => {
    if (ddosSimState === 'running') return;
    setDdosSimState('running');
    setDdosSimLogs([]);
    const timestamp = new Date().toLocaleTimeString();

    if (ddosTrafficState === 'normal') {
      setDdosSimLogs(prev => [
        ...prev,
        { timestamp, message: `[INGRESS] Dispatching clean, legitimate transaction flow from standard users...`, type: 'info' },
        { timestamp, message: `[ROUTE 53] DNS resolver translates queries to CDN endpoints successfully.`, type: 'info' },
        { timestamp, message: `[CLOUDFRONT] Cache hit! Assets served from Edge Cache distribution.`, type: 'success' },
        { timestamp, message: `[ALB BACKEND] Establishing secure connection. Target latency: <6ms. CPU load: 12%.`, type: 'success' }
      ]);
      setDdosSimState('idle');
      return;
    }

    // DDoS attack state
    setDdosSimLogs(prev => [
      ...prev,
      { timestamp, message: `🔥 [DDoS ATTACK STARTED] Botnet triggers massive SYN Flood and Layer 7 HTTP flood attack (1.2 Tbps)!`, type: 'error' },
      { timestamp, message: `[EDGE] Massive volumetric flood hits CloudFront Edge distributions and Route 53 Resolver servers...`, type: 'info' }
    ]);
    await new Promise(r => setTimeout(r, 1000));

    if (ddosMitigation === 'none') {
      setDdosSimLogs(prev => [
        ...prev,
        { timestamp, message: `💥 [OUTAGE] Volumetric flood successfully bypasses Edge protections!`, type: 'error' },
        { timestamp, message: `🚨 [ALB SATURATED] Application Load Balancer connection pool fully exhausted!`, type: 'error' },
        { timestamp, message: `🚨 [EC2 CRASH] Target ASG private subnet instances lock up. Latency: 4800ms. CPU: 100%.`, type: 'error' },
        { timestamp, message: `[HALTED] System offline. 504 Gateway Timeout returned to all users.`, type: 'error' }
      ]);
    } else if (ddosMitigation === 'shield_standard') {
      setDdosSimLogs(prev => [
        ...prev,
        { timestamp, message: `🛡️ [SHIELD STANDARD] Shield Standard mitigates basic Layer 3/4 SYN floods automatically at the Edge.`, type: 'warn' },
        { timestamp, message: `💥 [OUTAGE] Layer 7 HTTP flood bypasses Shield Standard (L7 requires Shield Advanced/WAF rate-limits)!`, type: 'error' },
        { timestamp, message: `🚨 [ALB SATURATED] Regional Load Balancer connection pools exhausted under L7 flood.`, type: 'error' },
        { timestamp, message: `[FAILED] Latency: 3200ms. High connection timeouts continue.`, type: 'error' }
      ]);
    } else {
      // shield_advanced
      setDdosSimLogs(prev => [
        ...prev,
        { timestamp, message: `🛡️ [SHIELD ADVANCED] Shield Advanced active. SRT (Shield Response Team) mitigations engaged!`, type: 'success' },
        { timestamp, message: `🟢 [EDGE BLOCK] WAF automatic rate-limiting and CloudFront edge filters absorb L7 volumetric HTTP floods.`, type: 'success' },
        { timestamp, message: `🟢 [GLOBAL ACCELERATOR] Global Accelerator routes legitimate user traffic through clean edge entry nodes.`, type: 'success' },
        { timestamp, message: `🟢 [SYSTEM SECURED] Malicious packets dropped at the Edge. Regional ALB and ASG EC2 private subnet nodes remain fully stable. Latency: <6ms. CPU load: 15%.`, type: 'success' }
      ]);
    }
    setDdosSimState('idle');
  };

  // ==========================================
  // TAB 5 SIMULATOR: Intelligent Scanners
  // ==========================================
  const runSecurityScanners = async () => {
    if (scannerState === 'scanning') return;
    setScannerState('scanning');
    setScannerLogs([]);
    const timestamp = new Date().toLocaleTimeString();

    if (scannerType === 'guardduty') {
      setScannerLogs(prev => [...prev, { timestamp, message: `[GUARDDUTY] Analyzing CloudTrail logs, VPC Flow Logs, and Route 53 DNS Queries...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 800));

      setScannerLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [THREAT DETECTED] CryptoMining:EC2/BitcoinTool.B!`, type: 'error' },
        { timestamp, message: `💡 [DETAIL] EC2 instance i-09876abc is initiating DNS queries to known crypto-mining pools.`, type: 'error' },
        { timestamp, message: `[REMEDIATION] Dispatching EventBridge alert. Launching automated AWS Lambda to isolate instance security groups.`, type: 'success' }
      ]);
      setScannerState('alert');
    } else if (scannerType === 'inspector') {
      setScannerLogs(prev => [...prev, { timestamp, message: `[INSPECTOR] Scanning EC2 private instances and ECR software registry images for vulnerabilities...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 800));

      setScannerLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [VULNERABILITY FOUND] CVE-2021-44228 (Log4j) Remote Code Execution detected!`, type: 'error' },
        { timestamp, message: `💡 [DETAIL] Path: /usr/share/app/log4j-core.jar in target instance. Package contains critical security drift.`, type: 'error' },
        { timestamp, message: `[COMPLETED] Systems Manager SSM alert dispatched to patch target node.`, type: 'success' }
      ]);
      setScannerState('alert');
    } else {
      // macie
      setScannerLogs(prev => [...prev, { timestamp, message: `[MACIE] Running S3 object parsing algorithms to detect sensitive PII data...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 800));

      setScannerLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [PII LEAK DETECTED] S3 Bucket s3://corporate-confidential contains unencrypted SSNs and credit cards!`, type: 'error' },
        { timestamp, message: `💡 [DETAIL] Bucket policy allows public reads. Macie flags 25 sensitive PII records exposed.`, type: 'error' },
        { timestamp, message: `[REMEDIATION] EventBridge triggers AWS Config rule to encrypt the bucket and block public access.`, type: 'success' }
      ]);
      setScannerState('alert');
    }
  };

  const resetScannerSim = () => {
    setScannerState('idle');
    setScannerLogs([]);
  };

  return (
    <div className="da-container animate-fadeIn">
      {/* Isolated visualizer styles */}
      <style>{`
        .da-container {
          font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
          color: #1e293b;
          background-color: #f8fafc;
          padding: 20px;
          border-radius: 16px;
        }
        .da-card {
          background: rgba(255, 255, 255, 0.95);
          border: 1.5px solid rgba(226, 232, 240, 0.9);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.05);
          transition: all 0.2s ease-in-out;
        }
        .da-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 10px 20px -4px rgba(59, 130, 246, 0.04);
        }
        .da-card-title {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .da-card-desc {
          font-size: 13px;
          color: #475569;
          line-height: 1.6;
        }
        .da-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          border-bottom: 1.5px solid rgba(226, 232, 240, 0.8);
          padding-bottom: 10px;
        }
        .da-tb {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 12px;
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          background: rgba(255, 255, 255, 0.85);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease-in-out;
          outline: none;
        }
        .da-tb:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #1e293b;
        }
        .da-tb.da-on {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
        }

        .da-svg-bg {
          background-color: #ffffff;
          background-image: radial-gradient(rgba(37, 99, 235, 0.03) 1.5px, transparent 1.5px);
          background-size: 16px 16px;
        }
        
        .da-flow-blue {
          stroke: #2563eb;
          stroke-dasharray: 6,4;
          animation: flowDash 1s linear infinite;
        }
        .da-flow-green {
          stroke: #10b981;
          stroke-dasharray: 6,4;
          animation: flowDash 0.8s linear infinite;
        }
        .da-flow-rose {
          stroke: #f43f5e;
          stroke-dasharray: 5,3;
          animation: flowDash 0.4s linear infinite;
        }
        @keyframes flowDash {
          to { stroke-dashoffset: -20; }
        }

        .da-node-btn {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .da-node-btn:hover {
          filter: drop-shadow(0 4px 12px rgba(37, 99, 235, 0.15));
        }
        
        .pulse-circle {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
      `}</style>

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 mb-6 text-left">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <Shield className="w-6 h-6 stroke-[2]" />
          </span>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              AWS Edge Security &amp; DDoS Resilience
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                PRO EDITION
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Explore AWS Certificate Manager (ACM) certs, WebACL WAF rules, Shield Advanced edge mitigations, and GuardDuty / Macie threat intelligence scanners.</p>
          </div>
        </div>
      </div>

      {/* Tab navigation bar */}
      <div className="da-tabs">
        <button className={`da-tb ${activeTab === 'intro' ? 'da-on' : ''}`} onClick={() => setActiveTab('intro')}>
          <BookOpen className="w-4 h-4" /> 1. Edge Scopes Comparative Grid
        </button>
        <button className={`da-tb ${activeTab === 'acm' ? 'da-on' : ''}`} onClick={() => setActiveTab('acm')}>
          <Key className="w-4 h-4" /> 2. ACM Certificates &amp; HTTPS redirects
        </button>
        <button className={`da-tb ${activeTab === 'waf' ? 'da-on' : ''}`} onClick={() => setActiveTab('waf')}>
          <Layers className="w-4 h-4" /> 3. AWS WAF Rules &amp; API Gateways
        </button>
        <button className={`da-tb ${activeTab === 'ddos' ? 'da-on' : ''}`} onClick={() => setActiveTab('ddos')}>
          <Activity className="w-4 h-4" /> 4. DDoS Resilience E2E Map
        </button>
        <button className={`da-tb ${activeTab === 'scanners' ? 'da-on' : ''}`} onClick={() => setActiveTab('scanners')}>
          <Search className="w-4 h-4" /> 5. Threat Intelligence &amp; CVE Scans
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EDGE SCOPES MATRIX                                                 */}
      {/* ========================================================================= */}
      {activeTab === 'intro' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Selector Sidebar */}
            <div className="lg:col-span-4 da-card text-left flex flex-col justify-between">
              <div>
                <h3 className="da-card-title text-blue-700">
                  <SlidersHorizontal className="w-5 h-5" /> Edge Security Scopes
                </h3>
                <p className="da-card-desc mb-5">
                  AWS network security spans layer-7 WebACLs, layer-3/4 volumetric shields, machine learning threat monitors, and configuration drift checkers.
                </p>

                <div className="space-y-2 text-xs">
                  <button
                    onClick={() => setSelectedTopic('waf')}
                    className={`w-full p-3 text-left border rounded-xl transition-all ${
                      selectedTopic === 'waf'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300'
                        : 'border-slate-200 hover:bg-slate-55 text-slate-700 font-semibold'
                    }`}
                  >
                    🛡️ AWS WAF (Web Application Firewall)
                    <span className="block text-[9px] text-slate-400 font-medium mt-0.5">Layer-7 inspection, SQL Injection blocks, IP rate limit filters</span>
                  </button>

                  <button
                    onClick={() => setSelectedTopic('shield')}
                    className={`w-full p-3 text-left border rounded-xl transition-all ${
                      selectedTopic === 'shield'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300'
                        : 'border-slate-200 hover:bg-slate-55 text-slate-700 font-semibold'
                    }`}
                  >
                    🛡️ AWS Shield (Standard &amp; Advanced)
                    <span className="block text-[9px] text-slate-400 font-medium mt-0.5">Volumetric Layer-3/4 DDoS protection, SRT support</span>
                  </button>

                  <button
                    onClick={() => setSelectedTopic('guardduty')}
                    className={`w-full p-3 text-left border rounded-xl transition-all ${
                      selectedTopic === 'guardduty'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300'
                        : 'border-slate-200 hover:bg-slate-55 text-slate-700 font-semibold'
                    }`}
                  >
                    🔍 Amazon GuardDuty
                    <span className="block text-[9px] text-slate-400 font-medium mt-0.5">VPC Flow / DNS Log machine learning threat intelligence</span>
                  </button>

                  <button
                    onClick={() => setSelectedTopic('inspector')}
                    className={`w-full p-3 text-left border rounded-xl transition-all ${
                      selectedTopic === 'inspector'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300'
                        : 'border-slate-200 hover:bg-slate-55 text-slate-700 font-semibold'
                    }`}
                  >
                    🧪 Amazon Inspector
                    <span className="block text-[9px] text-slate-400 font-medium mt-0.5">EC2 &amp; ECR package CVE vulnerability scanner</span>
                  </button>

                  <button
                    onClick={() => setSelectedTopic('macie')}
                    className={`w-full p-3 text-left border rounded-xl transition-all ${
                      selectedTopic === 'macie'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300'
                        : 'border-slate-200 hover:bg-slate-55 text-slate-700 font-semibold'
                    }`}
                  >
                    📂 Amazon Macie
                    <span className="block text-[9px] text-slate-400 font-medium mt-0.5">S3 automated confidential PII data discovery</span>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-150 rounded-xl p-3 text-[11px] leading-relaxed text-blue-900 mt-6 font-medium text-left">
                <span className="font-extrabold text-blue-950 block mb-1">Architect's Security Guideline:</span>
                "Secure Edge using WAF for Layer 7 and Shield for L3/L4. Monitor baseline threat anomalies via GuardDuty, scan infrastructure vulnerabilities with Inspector, and audit S3 PII leakage with Macie."
              </div>
            </div>

            {/* Right Display Details Panel */}
            <div className="lg:col-span-8 space-y-6 text-left">
              <div className="da-card space-y-4">
                <h3 className="da-card-title text-slate-800">
                  <BookOpen className="w-5 h-5 text-blue-500" /> Deep-Dive: Security Scopes
                </h3>

                {selectedTopic === 'waf' && (
                  <div className="space-y-4 animate-fadeIn text-xs leading-relaxed text-slate-600">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <span className="font-extrabold text-blue-700 block mb-1.5 text-[12.5px]">🛡️ AWS WAF (Web Application Firewall)</span>
                      <p className="mb-2">
                        AWS WAF protects web applications at the API layer against common web exploits and volumetric request floods:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Layer-7 Filtering:</strong> Inspects HTTP requests headers, body payloads, cookies, and URIs for malicious signatures.</li>
                        <li><strong>SQL Injection (SQLi) &amp; XSS blocks:</strong> Automatically filters strings attempting database overrides or cross-site script injections.</li>
                        <li><strong>IP Rate-limiting:</strong> Configures strict rule thresholds (e.g. drop IPs making &gt;100 queries/5 min) to block brute-force scanners or Layer 7 DDoS botnets.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {selectedTopic === 'shield' && (
                  <div className="space-y-4 animate-fadeIn text-xs leading-relaxed text-slate-600">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <span className="font-extrabold text-blue-700 block mb-1.5 text-[12.5px]">🛡️ AWS Shield: L3/L4 Volumetric Protection</span>
                      <p className="mb-2">
                        Protects AWS infrastructure against large-scale network-level volumetric DDoS floods:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Shield Standard:</strong> Free, active-by-default on all endpoints. Mitigates common Layer 3/4 volumetric SYN floods automatically.</li>
                        <li><strong>Shield Advanced:</strong> Comprehensive paid subscription. Adds 24/7 access to SRT (Shield Response Team), custom rate filters, real-time mitigation dashboards, and financial mitigation guarantees.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {selectedTopic === 'guardduty' && (
                  <div className="space-y-4 animate-fadeIn text-xs leading-relaxed text-slate-600">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <span className="font-extrabold text-blue-700 block mb-1.5 text-[12.5px]">🔍 Amazon GuardDuty: Machine Learning Threat Intel</span>
                      <p className="mb-2">
                        Intelligently monitors account security baselines without impacting infrastructure:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Zero Ingress Impact:</strong> Analyzes raw logs directly (CloudTrail API, VPC Flow, DNS Resolver queries) from the AWS hypervisor backing plane.</li>
                        <li><strong>Threat Detection:</strong> Uses threat feeds and machine learning anomaly detection to flag crypto-mining (BitcoinTool), IAM privilege escalation, or lateral compromises.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {selectedTopic === 'inspector' && (
                  <div className="space-y-4 animate-fadeIn text-xs leading-relaxed text-slate-600">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <span className="font-extrabold text-blue-700 block mb-1.5 text-[12.5px]">🧪 Amazon Inspector: CVE Package Vulnerability Scanner</span>
                      <p className="mb-2">
                        Automatically scans active compute workloads and container repositories for package security gaps:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Continuous Security Checks:</strong> Scans active EC2 packages and ECR registry images against active CVE vulnerability feeds.</li>
                        <li><strong>Network Reachability audits:</strong> Evaluates security groups and route tables to verify if ports (like SSH port 22) are exposed to the public internet.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {selectedTopic === 'macie' && (
                  <div className="space-y-4 animate-fadeIn text-xs leading-relaxed text-slate-600">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <span className="font-extrabold text-blue-700 block mb-1.5 text-[12.5px]">📂 Amazon Macie: S3 Confidential PII Scanner</span>
                      <p className="mb-2">
                        Utilizes custom pattern-matching and machine learning models to classify data inside S3 Buckets:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>PII Classification:</strong> Searches for Social Security Numbers (SSNs), Credit Card logs, names, and passport metadata inside S3.</li>
                        <li><strong>Access Alerts:</strong> Flags buckets that have been exposed to public reads or shared outside the Organization.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Scanners Matrix Table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-extrabold text-slate-800 block mb-3">Threat &amp; Security Scanners Comparison Matrix</span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold">
                        <th className="pb-2">Security Tool</th>
                        <th className="pb-2">Primary Scope</th>
                        <th className="pb-2">Operational Layer</th>
                        <th className="pb-2">Trigger Trigger</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      <tr>
                        <td className="py-2.5 text-blue-600 font-bold">AWS WAF</td>
                        <td className="py-2.5">Web Application Security</td>
                        <td className="py-2.5">Layer 7 (HTTP/HTTPS)</td>
                        <td className="py-2.5">Real-time inline API queries</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-blue-600 font-bold">Amazon GuardDuty</td>
                        <td className="py-2.5">Threat Intel Anomaly Detection</td>
                        <td className="py-2.5">Log parsing (VPC, DNS, CloudTrail)</td>
                        <td className="py-2.5">Continuous background machine learning</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-blue-600 font-bold">Amazon Inspector</td>
                        <td className="py-2.5">CVE Package vulnerability scans</td>
                        <td className="py-2.5">EC2 Host packages, ECR Registry</td>
                        <td className="py-2.5">Auto-checks on package changes/deploys</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-blue-600 font-bold">Amazon Macie</td>
                        <td className="py-2.5">Sensitive PII Data Classification</td>
                        <td className="py-2.5">S3 Object Level</td>
                        <td className="py-2.5">Scheduled target bucket audits</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ACM CERTIFICATES & HTTPS REDIRECTS (Image 1)                       */}
      {/* ========================================================================= */}
      {activeTab === 'acm' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Key className="w-5 h-5" /> AWS Certificate Manager (ACM) &amp; Expiration Check Audits
            </h2>
            <p className="da-card-desc">
              AWS requested certificates validate using CNAME records and renew automatically. Third-party imported certificates do not support auto-renewals, necessitating expiration drift rules using **AWS Config managed checks**.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Controls sidebar */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between space-y-4 font-semibold">
              <div className="space-y-4">
                
                {/* Cert Type */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">1. Certificate Sourcing Mode:</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                    <button
                      onClick={() => { setCertType('request'); resetAcmSim(); }}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${certType === 'request' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      KMS / ACM Requested (Auto-renew)
                    </button>
                    <button
                      onClick={() => { setCertType('import'); resetAcmSim(); }}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${certType === 'import' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      3rd-Party Imported (Manual track)
                    </button>
                  </div>
                </div>

                {/* Redirect Toggle */}
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">HTTP listeners HTTP-to-HTTPS redirect rule</span>
                  <input
                    type="checkbox"
                    checked={redirectActive}
                    onChange={(e) => { setRedirectActive(e.target.checked); resetAcmSim(); }}
                    className="accent-blue-600 cursor-pointer w-4 h-4"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] leading-relaxed text-slate-650 font-medium">
                  <span className="font-extrabold text-slate-800 block mb-1">Redirect &amp; TLS termination rules:</span>
                  "The client initiates requests on Port 80 (HTTP). The ALB HTTP listener redirects securely to Port 443 (HTTPS), terminates the secure TLS session at the ALB boundary using ACM, and forwards decrypted HTTP traffic to the private ASG compute subnet."
                </div>

              </div>

              <div className="flex gap-2">
                <button
                  onClick={runAcmRedirectSim}
                  disabled={acmState === 'running'}
                  className="flex-1 py-2 border border-slate-250 hover:bg-slate-55 text-slate-650 rounded-xl text-xs font-extrabold active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Server className="w-3.5 h-3.5" /> Test HTTP-HTTPS Redirect
                </button>
                <button
                  onClick={runAcmExpirationCheck}
                  disabled={acmState === 'running'}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Run Config Expiry Check
                </button>
              </div>

            </div>

            {/* Visualizer & Console Terminal */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden da-svg-bg flex flex-col justify-between min-h-[420px]">
              
              {acmState === 'running' && (
                <span className="absolute top-3 left-3 bg-blue-100 border border-blue-300 text-blue-700 font-extrabold text-[9px] px-2 py-0.5 rounded animate-pulse select-none z-10">
                  ⚡ CONFIG MANAGED EVALUATORS PARSING EXPIRY TIMESPANS...
                </span>
              )}
              {acmState === 'success' && certType === 'import' && (
                <span className="absolute top-3 left-3 bg-rose-100 border border-rose-300 text-rose-700 font-extrabold text-[9px] px-2 py-0.5 rounded select-none z-10 animate-bounce">
                  🚨 CERTIFICATE EXPIRING DRIFT ALERT DISPATCHED
                </span>
              )}
              {acmState === 'success' && certType === 'request' && (
                <span className="absolute top-3 left-3 bg-emerald-100 border border-emerald-300 text-emerald-700 font-extrabold text-[9px] px-2 py-0.5 rounded select-none z-10 animate-bounce">
                  🟢 ACM CERTIFICATE IS SECURE &amp; COMPLIANT
                </span>
              )}

              {/* Dynamic SVG illustrating Certificate Audit Flow (Image 1) */}
              <div className="w-full flex-grow flex items-center justify-center">
                <svg className="w-full h-full min-h-[160px]" viewBox="0 0 320 160">
                  <defs>
                    <marker id="arrow-acm" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {/* Flow links */}
                  {/* ACM -> EventBridge */}
                  <path d="M 60 40 Q 115 25 170 40" fill="none" stroke="#64748b" strokeWidth="1.5" className={acmEvalStep >= 2 ? 'da-flow-blue' : ''} markerEnd="url(#arrow-acm)" />
                  {/* Config -> EventBridge */}
                  <path d="M 60 110 Q 115 125 170 110" fill="none" stroke="#64748b" strokeWidth="1.5" className={acmEvalStep >= 1 ? 'da-flow-blue' : ''} markerEnd="url(#arrow-acm)" />
                  {/* EventBridge -> Lambda/SNS/SQS targets */}
                  <path d="M 230 75 L 265 75" fill="none" stroke="#10b981" strokeWidth="2" className={acmEvalStep >= 3 && certType === 'import' ? 'da-flow-green' : ''} markerEnd="url(#arrow-acm)" />

                  {/* ACM Source Node */}
                  <g transform="translate(10, 20)">
                    <rect x="0" y="0" width="50" height="40" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                    <text x="25" y="16" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">ACM</text>
                    <text x="25" y="27" fill="#cbd5e1" fontSize="5.5" textAnchor="middle">Certs Store</text>
                    <text x="25" y="35" fill="#a855f7" fontSize="5.5" fontWeight="bold" textAnchor="middle">SSL/TLS</text>
                  </g>

                  {/* AWS Config Compliance check */}
                  <g transform="translate(10, 95)">
                    <rect x="0" y="0" width="50" height="40" rx="6" fill="#faf5ff" stroke="#a855f7" strokeWidth="1.5" />
                    <text x="25" y="16" fill="#6b21a8" fontSize="7" fontWeight="bold" textAnchor="middle">AWS Config</text>
                    <text x="25" y="27" fill="#a855f7" fontSize="5" textAnchor="middle">managed check</text>
                    <text x="25" y="35" fill="#6b21a8" fontSize="5" fontWeight="bold" textAnchor="middle">acm-check</text>
                  </g>

                  {/* EventBridge Bus */}
                  <g transform="translate(170, 50)">
                    <rect x="0" y="0" width="60" height="50" rx="6" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5" />
                    <text x="30" y="16" fill="#78350f" fontSize="7" fontWeight="bold" textAnchor="middle">EventBridge</text>
                    <text x="30" y="27" fill="#b45309" fontSize="6" textAnchor="middle">Bus route</text>
                    <text x="30" y="38" fill="#d97706" fontSize="5.5" fontWeight="bold" textAnchor="middle">
                      {acmEvalStep >= 2 ? 'Events active' : 'Standby'}
                    </text>
                  </g>

                  {/* Target SNS Alerts */}
                  <g transform="translate(265, 55)">
                    <rect x="0" y="0" width="50" height="40" rx="6" 
                      fill={certType === 'import' && acmEvalStep === 3 ? '#fff1f2' : '#f0fdf4'} 
                      stroke={certType === 'import' && acmEvalStep === 3 ? '#f43f5e' : '#10b981'} 
                      strokeWidth="1.5" />
                    <text x="25" y="16" fill="#334155" fontSize="7" fontWeight="bold" textAnchor="middle">Targets</text>
                    <text x="25" y="25" fill="#64748b" fontSize="5.5" textAnchor="middle">Lambda/SNS</text>
                    <text x="25" y="34" fill={certType === 'import' && acmEvalStep === 3 ? '#e11d48' : '#16a34a'} fontSize="6" fontWeight="bold" textAnchor="middle">
                      {certType === 'import' && acmEvalStep === 3 ? '🚨 ALARM' : '🟢 Secure'}
                    </text>
                  </g>
                </svg>
              </div>

              {/* Logs output terminal */}
              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto border border-slate-800 shadow-inner mt-4">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5 text-slate-400">
                  <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-blue-400" /> ACM / Config Audit Terminal</span>
                  <span>System: TLS verification</span>
                </div>
                {acmLogs.length === 0 ? (
                  <div className="text-slate-500 italic">Select certificate mode parameters and run tests.</div>
                ) : (
                  acmLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                      <span className={log.type === 'error' ? 'text-rose-400 font-bold' : log.type === 'success' ? 'text-emerald-400 font-bold' : log.type === 'warn' ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: AWS WAF RULES & API GATEWAY ENDPOINTS                              */}
      {/* ========================================================================= */}
      {activeTab === 'waf' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Layers className="w-5 h-5" /> AWS WAF Rules &amp; API Gateway Endpoint Configurations
            </h2>
            <p className="da-card-desc">
              API Gateways support three endpoint styles: **Edge-Optimized** (routes through custom CloudFront edges), **Regional** (local regional endpoints), and **Private** (Interface VPC endpoints). AWS WAF attaches directly to secure incoming traffic.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Rules Selector sidebar */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between space-y-4 font-semibold">
              <div className="space-y-4">
                
                {/* API Gateway endpoint type */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">1. API Gateway Endpoint Type:</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                    <button
                      onClick={() => setApigwType('edge')}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${apigwType === 'edge' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Edge-Optimized (CloudFront)
                    </button>
                    <button
                      onClick={() => setApigwType('regional')}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${apigwType === 'regional' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Regional Endpoint
                    </button>
                    <button
                      onClick={() => setApigwType('private')}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${apigwType === 'private' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Private Endpoint
                    </button>
                  </div>
                </div>

                {/* WebACL Rules checklist */}
                <div>
                  <span className="text-xs font-extrabold text-slate-850 block mb-2">2. Enable WebACL inspection rules:</span>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rateLimitEnabled}
                        onChange={(e) => setRateLimitEnabled(e.target.checked)}
                        className="rounded border-slate-350 text-blue-600 accent-blue-600 w-4 h-4"
                      />
                      🚦 Rate Limiting filter rule (IP Block threshold)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={sqliBlockedEnabled}
                        onChange={(e) => setSqliBlockedEnabled(e.target.checked)}
                        className="rounded border-slate-350 text-blue-600 accent-blue-600 w-4 h-4"
                      />
                      🛡️ BlockSQLi Injection payload filter
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={geoBlockEnabled}
                        onChange={(e) => setGeoBlockEnabled(e.target.checked)}
                        className="rounded border-slate-350 text-blue-600 accent-blue-600 w-4 h-4"
                      />
                      🌐 Geographic Block Geo-Restriction filter
                    </label>
                  </div>
                </div>

                {/* Scenario Trigger */}
                <div>
                  <span className="text-xs font-extrabold text-slate-850 block mb-2">3. Trigger Inbound Request Scenario:</span>
                  <select
                    value={wafSimAction}
                    onChange={(e) => { setWafSimAction(e.target.value as any); resetWafSim(); }}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 font-bold text-slate-700 bg-slate-50"
                  >
                    <option value="clean">🟢 Standard User Query (Legitimate API payload)</option>
                    <option value="ddos_flood">🔥 Volumetric Brute Force Scans (Triggers rate limits)</option>
                    <option value="sql_injection">💉 URL parameter SQL query string injection (Triggers SQLi blocks)</option>
                    <option value="foreign_ip">🌏 Request originating from restricted foreign subnet (Triggers Geo block)</option>
                  </select>
                </div>

              </div>

              <div className="flex gap-2">
                <button
                  onClick={resetWafSim}
                  className="flex-1 py-2 border border-slate-250 hover:bg-slate-55 text-slate-650 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Reset ACL
                </button>
                <button
                  onClick={runWafSimulation}
                  disabled={wafState === 'running'}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Inspect API Request
                </button>
              </div>

            </div>

            {/* Visualizer & Logs Terminal */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden da-svg-bg flex flex-col justify-between min-h-[420px]">
              
              {wafState === 'running' && (
                <span className="absolute top-3 left-3 bg-blue-100 border border-blue-300 text-blue-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl animate-pulse select-none z-10">
                  ⚡ WAF WebACL INSPECTING HEADERS &amp; REQUEST PAYLOAD...
                </span>
              )}
              {wafState === 'allowed' && (
                <span className="absolute top-3 left-3 bg-emerald-100 border border-emerald-300 text-emerald-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl select-none z-10 animate-bounce">
                  ✅ WebACL APPROVED - FORWARDING TRANSACTION
                </span>
              )}
              {wafState === 'blocked' && (
                <span className="absolute top-3 left-3 bg-rose-100 border border-rose-300 text-rose-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl select-none z-10 animate-pulse">
                  🚨 403 FORBIDDEN - TRANSACTION BLOCKED AT WAF WebACL
                </span>
              )}

              {/* Endpoint differences code view */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left shadow-lg overflow-x-auto font-mono text-[9px] text-slate-300 leading-normal mb-4">
                <div className="text-slate-500 font-bold pb-2 border-b border-slate-800 mb-2 flex justify-between items-center">
                  <span>📄 API_GATEWAY_CERT_ASSOCIATION.json</span>
                  <span className="text-[8px] bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded border border-blue-900">ACM_BINDINGS</span>
                </div>
                {apigwType === 'edge' ? (
                  <pre>{`// Edge-Optimized endpoints use a CloudFront CDN internally under the hood.
// IMPORTANT: The SSL/TLS certificate MUST be requested or imported in ACM 
// in region us-east-1 (N. Virginia) only to enable edge replication.
{
  "EndpointType": "EDGE",
  "ACM_Certificate_ARN": "arn:aws:acm:us-east-1:123456789012:certificate/wildcard-cert",
  "EdgeDistribution": "CloudFront_Internal_Managed"
}`}</pre>
                ) : apigwType === 'regional' ? (
                  <pre>{`// Regional endpoints reside directly within your local AWS region boundary.
// The ACM certificate must be provisioned in the same local target region.
{
  "EndpointType": "REGIONAL",
  "ACM_Certificate_ARN": "arn:aws:acm:eu-west-1:123456789012:certificate/wildcard-cert",
  "Region": "eu-west-1"
}`}</pre>
                ) : (
                  <pre>{`// Private endpoints reside inside a Virtual Private Cloud (VPC).
// Access is restricted to VPC interfaces using Endpoint policies.
// ACM certs are associated with local Private DNS and VPC route targets.
{
  "EndpointType": "PRIVATE",
  "VPCEndpoint": "vpce-09a8b7c6d5e4f3g2",
  "PrivateDnsEnabled": true
}`}</pre>
                )}
              </div>

              {/* Logs terminal */}
              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5 text-slate-400">
                  <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-blue-400" /> WAF WebACL Ingress Console</span>
                  <span>ACL: regional-ingress-filters</span>
                </div>
                {wafLogs.length === 0 ? (
                  <div className="text-slate-500 italic">Configure inspection rules and execute request analysis.</div>
                ) : (
                  wafLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                      <span className={log.type === 'error' ? 'text-rose-400 font-bold' : log.type === 'success' ? 'text-emerald-400 font-bold' : log.type === 'warn' ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AWS BEST PRACTICES FOR DDOS RESILIENCE (Image 2)                    */}
      {/* ========================================================================= */}
      {activeTab === 'ddos' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Activity className="w-5 h-5" /> AWS Best Practices for DDoS Resilience (E2E Topology)
            </h2>
            <p className="da-card-desc">
              AWS Shield Standard mitigates Layer 3/4 volumetric floods at the door. **Shield Advanced + WAF rate-limiting WebACL rules** absorb sophisticated Layer 7 HTTP floods at the Edge, ensuring regional compute health.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* DDoS Sidebar controls */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between space-y-4 font-semibold">
              <div className="space-y-4">
                
                {/* Mitigation settings */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">1. Select DDoS Shield Mitigation Tier:</span>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="shield"
                        checked={ddosMitigation === 'none'}
                        onChange={() => setDdosMitigation('none')}
                        className="text-blue-600 accent-blue-600"
                      />
                      🛑 No Mitigation (Raw exposure)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="shield"
                        checked={ddosMitigation === 'shield_standard'}
                        onChange={() => setDdosMitigation('shield_standard')}
                        className="text-blue-600 accent-blue-600"
                      />
                      🟡 Shield Standard active (L3/L4 volumetric SYN blocks)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="shield"
                        checked={ddosMitigation === 'shield_advanced'}
                        onChange={() => setDdosMitigation('shield_advanced')}
                        className="text-blue-600 accent-blue-600"
                      />
                      🟢 Shield Advanced + WebACL (L7 filters SRT Team enabled)
                    </label>
                  </div>
                </div>

                {/* Traffic state */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">2. Inbound Traffic State:</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                    <button
                      onClick={() => setDdosTrafficState('normal')}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${ddosTrafficState === 'normal' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Legitimate user traffic
                    </button>
                    <button
                      onClick={() => setDdosTrafficState('attack')}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${ddosTrafficState === 'attack' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      DDoS volumetric L7 Flood
                    </button>
                  </div>
                </div>

              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setDdosSimLogs([]); setDdosSimState('idle'); }}
                  className="flex-1 py-2 border border-slate-250 hover:bg-slate-55 text-slate-650 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Reset
                </button>
                <button
                  onClick={runDdosSimulation}
                  disabled={ddosSimState === 'running'}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Trigger Scenario
                </button>
              </div>

            </div>

            {/* End-to-End Holistic SVG Topology Map (Image 2) */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden da-svg-bg flex flex-col justify-between min-h-[420px]">
              
              <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-xl mb-4">
                <div className="text-left font-semibold">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Edge Telemetry Auditor</span>
                  <span className={`text-base font-black block mt-1 ${ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? 'text-rose-600 animate-pulse font-extrabold' : 'text-emerald-600'}`}>
                    {ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? '⚠️ OUTAGE ALERT - SATURATED' : '🟢 STABLE &amp; RESPONSIVE'}
                  </span>
                </div>
                <div className="text-right font-mono text-[10.5px] font-bold">
                  <div>CPU Load: <span className={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? 'text-rose-500 font-extrabold' : 'text-slate-700'}>
                    {ddosTrafficState === 'normal' ? '12%' : ddosMitigation === 'shield_advanced' ? '15%' : '100%'}
                  </span></div>
                  <div>Latency: <span className={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? 'text-rose-500 font-extrabold' : 'text-slate-700'}>
                    {ddosTrafficState === 'normal' ? '<6ms' : ddosMitigation === 'shield_advanced' ? '<6ms' : '4800ms'}
                  </span></div>
                </div>
              </div>

              {/* SVG Holistic Topology Drawing from your drawing */}
              <div className="w-full flex-grow flex items-center justify-center overflow-x-auto relative">
                <svg className="w-full min-w-[540px] h-[260px]" viewBox="0 0 540 260">
                  <defs>
                    <marker id="arrow-ddos" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {/* Operational Tier boundaries */}
                  <rect x="5" y="10" width="165" height="240" rx="8" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="15" y="24" fill="#94a3b8" fontSize="6.5" fontWeight="bold">AWS Edge Services</text>

                  <rect x="180" y="10" width="180" height="240" rx="8" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="190" y="24" fill="#94a3b8" fontSize="6.5" fontWeight="bold">AWS Regional public/private subnets</text>

                  <rect x="370" y="10" width="165" height="240" rx="8" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="380" y="24" fill="#94a3b8" fontSize="6.5" fontWeight="bold">Corporate Data Center</text>

                  {/* Flow conduits */}
                  {/* Edge -> Region */}
                  <path d="M 125 130 H 220" fill="none" 
                    className={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? 'da-flow-rose' : ddosTrafficState === 'attack' && ddosMitigation === 'shield_advanced' ? 'da-flow-green' : 'da-flow-blue'} 
                    stroke={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? '#f43f5e' : '#cbd5e1'} strokeWidth="2" />
                  
                  {/* Region -> Private ASG */}
                  <path d="M 270 130 H 300" fill="none" 
                    className={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? 'da-flow-rose' : 'da-flow-blue'} 
                    stroke="#cbd5e1" strokeWidth="1.5" />

                  {/* Private Transit Gateway -> Corporate datacenter */}
                  <path d="M 335 200 H 425" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4,4" />

                  {/* 1. AWS Edge Services nodes */}
                  {/* Route 53 */}
                  <g transform="translate(15, 45)">
                    <rect x="0" y="0" width="105" height="26" rx="4" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="52.5" y="15" fill="#1e3a8a" fontSize="7" fontWeight="bold" textAnchor="middle">Route 53 DNS</text>
                  </g>
                  {/* CloudFront Edge CDN */}
                  <g transform="translate(15, 85)">
                    <rect x="0" y="0" width="105" height="26" rx="4" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="52.5" y="15" fill="#1e3a8a" fontSize="7" fontWeight="bold" textAnchor="middle">CloudFront CDN</text>
                  </g>
                  {/* Edge WAF */}
                  <g transform="translate(15, 125)">
                    <rect x="0" y="0" width="105" height="26" rx="4" 
                      fill={ddosMitigation === 'shield_advanced' ? '#ecfdf5' : '#ffffff'} 
                      stroke={ddosMitigation === 'shield_advanced' ? '#10b981' : '#cbd5e1'} strokeWidth="1.5" />
                    <text x="52.5" y="15" fill="#1e293b" fontSize="7" fontWeight="bold" textAnchor="middle">Edge WAF Rules</text>
                  </g>
                  {/* Global Accelerator */}
                  <g transform="translate(15, 165)">
                    <rect x="0" y="0" width="105" height="26" rx="4" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="52.5" y="15" fill="#1e3a8a" fontSize="7" fontWeight="bold" textAnchor="middle">Global Accelerator</text>
                  </g>

                  {/* 2. AWS Region public/private nodes */}
                  {/* Public ALB */}
                  <g transform="translate(195, 80)">
                    <rect x="0" y="0" width="70" height="35" rx="4" 
                      fill={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? '#fff1f2' : '#ffffff'} 
                      stroke={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? '#f43f5e' : '#cbd5e1'} strokeWidth="1.5" />
                    <text x="35" y="15" fill="#1e293b" fontSize="7" fontWeight="bold" textAnchor="middle">Public ALB</text>
                    <text x="35" y="26" fill="#ef4444" fontSize="5.5" fontWeight="bold" textAnchor="middle">
                      {ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? '🔥 Saturated' : '🟢 Healthy'}
                    </text>
                  </g>

                  {/* Private ASG EC2 */}
                  <g transform="translate(285, 125)">
                    <rect x="0" y="0" width="70" height="50" rx="4" 
                      fill={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? '#fff1f2' : '#ffffff'} 
                      stroke={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? '#f43f5e' : '#cbd5e1'} strokeWidth="1.5" />
                    <text x="35" y="18" fill="#1e293b" fontSize="7" fontWeight="bold" textAnchor="middle">Private ASG</text>
                    <text x="35" y="30" fill="#64748b" fontSize="5.5" textAnchor="middle">Compute Cluster</text>
                    <text x="35" y="41" fill={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? '#dc2626' : '#16a34a'} fontSize="6" fontWeight="bold" textAnchor="middle">
                      {ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? '❌ 100% CPU' : '🟢 Healthy'}
                    </text>
                  </g>

                  {/* AWS Transit Gateway */}
                  <g transform="translate(285, 185)">
                    <rect x="0" y="0" width="70" height="28" rx="4" fill="#faf5ff" stroke="#a855f7" strokeWidth="1.2" />
                    <text x="35" y="16" fill="#6b21a8" fontSize="6.5" fontWeight="bold" textAnchor="middle">Transit Gateway</text>
                  </g>

                  {/* 3. Corporate Data Center */}
                  {/* Corporate Data Center Host */}
                  <g transform="translate(385, 80)">
                    <rect x="0" y="0" width="130" height="35" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="65" y="16" fill="#334155" fontSize="7" fontWeight="bold" textAnchor="middle">Corporate Data Center</text>
                    <text x="65" y="26" fill="#64748b" fontSize="5.5" textAnchor="middle">Customer Gateway</text>
                  </g>
                  {/* Transit endpoint DX/VPN */}
                  <g transform="translate(385, 185)">
                    <rect x="0" y="0" width="130" height="28" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="65" y="17" fill="#334155" fontSize="7" fontWeight="bold" textAnchor="middle">Direct Connect (DX) / VPN</text>
                  </g>
                </svg>
              </div>

              {/* Logs terminal */}
              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5 text-slate-400">
                  <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4 text-rose-400" /> Edge Security DDoS Auditor</span>
                  <span>SRT Operations Center</span>
                </div>
                {ddosSimLogs.length === 0 ? (
                  <div className="text-slate-500 italic">Select traffic variables and mitigation levels, then run scenarios to evaluate edge defenses.</div>
                ) : (
                  ddosSimLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                      <span className={log.type === 'error' ? 'text-rose-400 font-bold' : log.type === 'success' ? 'text-emerald-400 font-bold' : log.type === 'warn' ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: INTELLIGENT SCANNERS                                               */}
      {/* ========================================================================= */}
      {activeTab === 'scanners' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Search className="w-5 h-5" /> Intelligent Threat Scanners (GuardDuty, Inspector, Macie)
            </h2>
            <p className="da-card-desc">
              AWS security scanners parse machine learning patterns asynchronously. **GuardDuty** monitors network logins and crypto threats; **Inspector** scans CVE packages; **Macie** parses S3 files to block PII leaks.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Scanners sidebar selector */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between space-y-4 font-semibold">
              <div className="space-y-4">
                
                {/* Scanner selection */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">1. Select Security Scanner:</span>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="scanner"
                        checked={scannerType === 'guardduty'}
                        onChange={() => { setScannerType('guardduty'); resetScannerSim(); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      🔍 Amazon GuardDuty (Network threat ML anomalies)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="scanner"
                        checked={scannerType === 'inspector'}
                        onChange={() => { setScannerType('inspector'); resetScannerSim(); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      🔍 Amazon Inspector (EC2 CVE packages dependencies check)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="scanner"
                        checked={scannerType === 'macie'}
                        onChange={() => { setScannerType('macie'); resetScannerSim(); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      🔍 Amazon Macie (S3 object PII leak check)
                    </label>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] leading-relaxed text-slate-650 font-medium">
                  <span className="font-extrabold text-slate-800 block mb-1">Scanning Baselines:</span>
                  "GuardDuty targets VPC flow and DNS logs from the hypervisor backing plane. Inspector queries regional compute registries. Macie classifies bucket objects using custom Regex patterns."
                </div>

              </div>

              <div className="flex gap-2">
                <button
                  onClick={resetScannerSim}
                  className="flex-1 py-2 border border-slate-250 hover:bg-slate-55 text-slate-650 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Reset
                </button>
                <button
                  onClick={runSecurityScanners}
                  disabled={scannerState === 'scanning'}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 active:scale-95 transition-all shadow"
                >
                  <Eye className="w-3.5 h-3.5" /> Start Scan Audits
                </button>
              </div>

            </div>

            {/* Visualizer & Logs Terminal */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden da-svg-bg flex flex-col justify-between min-h-[380px]">
              
              {scannerState === 'scanning' && (
                <span className="absolute top-3 left-3 bg-blue-100 border border-blue-300 text-blue-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl animate-pulse select-none z-10">
                  ⚡ DEEP ML ANOMALY ENGINE RUNNING CONTINUOUS AUDITS...
                </span>
              )}
              {scannerState === 'alert' && (
                <span className="absolute top-3 left-3 bg-rose-100 border border-rose-300 text-rose-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl select-none z-10 animate-pulse">
                  🚨 THREAT FOUND - MALICIOUS DRIFT DISPATCHED TO EVENTBRIDGE
                </span>
              )}

              {/* Scan graphic indicator */}
              <div className="w-full flex-grow flex items-center justify-center">
                <svg className="w-full h-full min-h-[160px]" viewBox="0 0 280 120">
                  <defs>
                    <marker id="arrow-scan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {/* Flow pipeline */}
                  <path d="M 70 60 H 140" fill="none" stroke="#64748b" strokeWidth="1.5" className={scannerState === 'scanning' ? 'da-flow-blue' : ''} />
                  <path d="M 200 60 H 265" fill="none" stroke="#cbd5e1" strokeWidth="1.5" className={scannerState === 'alert' ? 'da-flow-rose' : ''} />

                  {/* Left: AWS Resources target */}
                  <g transform="translate(15, 35)">
                    <rect x="0" y="0" width="55" height="50" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                    <text x="27.5" y="16" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">Target</text>
                    <text x="27.5" y="27" fill="#cbd5e1" fontSize="7" fontWeight="bold" textAnchor="middle">Resource</text>
                    <text x="27.5" y="38" fill="#94a3b8" fontSize="5.5" textAnchor="middle">EC2/S3/VPC</text>
                  </g>

                  {/* Center: Intelligent security scanner */}
                  <g transform="translate(140, 35)">
                    <rect x="0" y="0" width="60" height="50" rx="6" 
                      fill={scannerState === 'alert' ? '#fff1f2' : '#f8fafc'} 
                      stroke={scannerState === 'alert' ? '#f43f5e' : '#cbd5e1'} 
                      strokeWidth="1.5" />
                    <text x="30" y="16" fill="#334155" fontSize="7" fontWeight="bold" textAnchor="middle">Security</text>
                    <text x="30" y="25" fill="#64748b" fontSize="5.5" textAnchor="middle">Scanner</text>
                    <text x="30" y="36" fill={scannerState === 'alert' ? '#dc2626' : '#2563eb'} fontSize="6.5" fontWeight="extrabold" textAnchor="middle">
                      {scannerType === 'guardduty' ? 'GuardDuty' : scannerType === 'inspector' ? 'Inspector' : 'Macie'}
                    </text>
                  </g>

                  {/* Right: Security findings database */}
                  <g transform="translate(225, 35)">
                    <rect x="0" y="0" width="45" height="50" rx="6" 
                      fill={scannerState === 'alert' ? '#fee2e2' : '#e2e8f0'} 
                      stroke={scannerState === 'alert' ? '#ef4444' : '#cbd5e1'} 
                      strokeWidth="1.5" />
                    <text x="22.5" y="16" fill="#334155" fontSize="6.5" fontWeight="bold" textAnchor="middle">Alert</text>
                    <text x="22.5" y="27" fill="#64748b" fontSize="5.5" textAnchor="middle">Event</text>
                    <text x="22.5" y="38" fill="#475569" fontSize="6" fontWeight="bold" textAnchor="middle">
                      {scannerState === 'alert' ? 'DISPATCHED' : 'STANDBY'}
                    </text>
                  </g>
                </svg>
              </div>

              {/* Logs terminal */}
              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto border border-slate-800 shadow-inner mt-4">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5 text-slate-400">
                  <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4 text-emerald-400" /> Scanner Audit Terminal</span>
                  <span>System: ML findings</span>
                </div>
                {scannerLogs.length === 0 ? (
                  <div className="text-slate-500 italic">Select scanner mode and click "Start Scan Audits".</div>
                ) : (
                  scannerLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                      <span className={log.type === 'error' ? 'text-rose-400 font-bold' : log.type === 'success' ? 'text-emerald-400 font-bold' : log.type === 'warn' ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                        {log.message}
                      </span>
                    </div>
                  ))
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
