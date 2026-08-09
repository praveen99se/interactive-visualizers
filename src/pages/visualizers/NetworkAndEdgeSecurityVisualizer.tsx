import React, { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Copy,
  Check,
  Zap,
  Shield,
  Key,
  Play,
  SlidersHorizontal,
  Terminal,
  Server,
  Activity,
  Layers,
  Search,
  Eye
} from 'lucide-react';
import NetworkAndEdgeSecurityComparativeView from '../../components/visualizers/NetworkAndEdgeSecurityComparativeView';
import UniqueNetworkAndEdgeSecurityFeatures from '../../components/visualizers/UniqueNetworkAndEdgeSecurityFeatures';

type TabType = 'notebook' | 'intro' | 'acm' | 'waf' | 'ddos' | 'scanners' | 'unique';

interface LogRow {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

interface NetworkAndEdgeSecurityVisualizerProps {
  provider?: 'aws' | 'azure' | 'gcp' | 'comparative';
  setProvider?: (provider: 'aws' | 'azure' | 'gcp' | 'comparative') => void;
}

export default function NetworkAndEdgeSecurityVisualizer({ provider = 'aws', setProvider }: NetworkAndEdgeSecurityVisualizerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');

  // Visual Architect Notes & Theories Academy State
  const [selectedNote, setSelectedNote] = useState<string>('waf_vs_netfw');
  const [expandedCategory, setExpandedCategory] = useState<string>('net_fundamentals');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  const isComparative = provider === 'comparative';

  const t = (text: string) => {
    if (provider === 'azure') {
      return text
        .replace(/AWS WAF/gi, 'Azure WAF (Application Gateway / Front Door)')
        .replace(/AWS Shield/gi, 'Azure DDoS Protection')
        .replace(/AWS Network Firewall/gi, 'Azure Firewall Premium')
        .replace(/WAF/g, 'Azure WAF')
        .replace(/CloudWatch/g, 'Azure Monitor');
    }
    if (provider === 'gcp') {
      return text
        .replace(/AWS WAF/gi, 'Google Cloud Armor')
        .replace(/AWS Shield/gi, 'Google Cloud Armor Enterprise')
        .replace(/AWS Network Firewall/gi, 'GCP Next-Gen Firewall (NGFW)')
        .replace(/WAF/g, 'Cloud Armor WAF')
        .replace(/CloudWatch/g, 'Cloud Monitoring');
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
        if (node.type === 'pre' || node.type === 'code' || (node.props && (node.props.className === 'waf-terminal' || node.props.className === 'waf-code-card'))) {
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
    setActiveTab(tab === 'firewall' ? 'waf' : tab === 'architect' ? 'notebook' : tab);
  };





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
      .acad-dir-container {
        background: var(--da-card-bg, var(--sl-card-bg, rgba(255, 255, 255, 0.9)));
        border: 1px solid var(--da-card-border, var(--sl-card-border, rgba(226, 232, 240, 0.8)));
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.05);
        backdrop-filter: blur(12px);
      }
      .dark .acad-dir-container {
        background: rgba(15, 23, 42, 0.6);
        border-color: rgba(51, 65, 85, 0.6);
      }
      .acad-dir-header {
        background: var(--da-tab-bg, rgba(248, 250, 252, 0.9));
        color: var(--da-text-title, #0f172a);
        border-bottom: 1.5px solid var(--da-card-border, rgba(226, 232, 240, 0.8));
        padding: 14px 16px;
        font-weight: 800;
        font-size: 11px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .dark .acad-dir-header {
        background: rgba(15, 23, 42, 0.9);
        color: #ffffff;
        border-bottom-color: rgba(51, 65, 85, 0.6);
      }
      .acad-dir-folder-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--da-card-border, rgba(226, 232, 240, 0.6));
        font-size: 10.5px;
        font-weight: 800;
        color: var(--da-text-muted, #64748b);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        transition: all 0.2s ease;
        cursor: pointer;
      }
      .dark .acad-dir-folder-btn {
        border-bottom-color: rgba(51, 65, 85, 0.6);
        color: #94a3b8;
      }
      .acad-dir-folder-btn:hover {
        background: rgba(241, 245, 249, 0.6);
      }
      .dark .acad-dir-folder-btn:hover {
        background: rgba(30, 41, 59, 0.6);
      }
      .acad-dir-item-btn {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 18px;
        font-size: 12px;
        font-weight: 600;
        color: var(--da-text-muted, #475569);
        border: none;
        border-left: 3px solid transparent;
        background: transparent;
        transition: all 0.15s ease;
        text-align: left;
        cursor: pointer;
      }
      .dark .acad-dir-item-btn {
        color: #94a3b8;
      }
      .acad-dir-item-btn:hover {
        background: rgba(241, 245, 249, 0.6);
        color: var(--da-text-title, #0f172a);
      }
      .dark .acad-dir-item-btn:hover {
        background: rgba(30, 41, 59, 0.6);
        color: #f1f5f9;
      }
      .acad-dir-item-btn.acad-active {
        background: rgba(2, 132, 199, 0.08);
        color: #0284c7;
        border-left-color: #0ea5e9;
        font-weight: 800;
      }
      .dark .acad-dir-item-btn.acad-active {
        background: rgba(56, 189, 248, 0.15);
        color: #38bdf8;
        border-left-color: #38bdf8;
      }
      .acad-detail-card {
        background: var(--da-card-bg, var(--sl-card-bg, rgba(255, 255, 255, 0.95)));
        border: 1px solid var(--da-card-border, var(--sl-card-border, rgba(226, 232, 240, 0.8)));
        border-radius: 16px;
        padding: 24px;
        box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.06);
        backdrop-filter: blur(16px);
      }
      .dark .acad-detail-card {
        background: rgba(15, 23, 42, 0.75);
        border-color: rgba(51, 65, 85, 0.6);
        color: #cbd5e1;
      }
      .acad-hero-badge {
        background: rgba(2, 132, 199, 0.08);
        border: 1.5px solid rgba(2, 132, 199, 0.3);
        color: #0284c7;
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
      .dark .acad-hero-badge {
        background: rgba(56, 189, 248, 0.15);
        border-color: rgba(56, 189, 248, 0.3);
        color: #38bdf8;
      }
      .acad-plain-english {
        background: rgba(2, 132, 199, 0.07);
        border-left: 4px solid #0ea5e9;
        border-radius: 12px;
        padding: 16px;
        margin: 16px 0;
        font-size: 12.5px;
        line-height: 1.65;
        color: var(--da-text-title, var(--sl-text-title, #0f172a));
        border-top: 1px solid var(--da-card-border, var(--sl-card-border, rgba(226, 232, 240, 0.8)));
        border-right: 1px solid var(--da-card-border, var(--sl-card-border, rgba(226, 232, 240, 0.8)));
        border-bottom: 1px solid var(--da-card-border, var(--sl-card-border, rgba(226, 232, 240, 0.8)));
      }
      .dark .acad-plain-english {
        background: rgba(56, 189, 248, 0.12);
        border-left-color: #38bdf8;
        color: #f1f5f9;
        border-top-color: rgba(51, 65, 85, 0.6);
        border-right-color: rgba(51, 65, 85, 0.6);
        border-bottom-color: rgba(51, 65, 85, 0.6);
      }
      .acad-analogy-box {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%);
        border: 1.5px solid rgba(245, 158, 11, 0.35);
        border-radius: 12px;
        padding: 16px;
        margin: 16px 0;
        font-size: 12px;
        line-height: 1.65;
        color: var(--da-text-title, var(--sl-text-title, #0f172a));
      }
      .dark .acad-analogy-box {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%);
        border-color: rgba(245, 158, 11, 0.35);
        color: #f1f5f9;
      }
      .acad-advice-box {
        background: var(--da-card-bg, var(--sl-card-bg, rgba(255, 255, 255, 0.8)));
        border: 1px solid var(--da-card-border, var(--sl-card-border, rgba(226, 232, 240, 0.8)));
        color: var(--da-text-muted, var(--sl-text-muted, #64748b));
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
      }
      .dark .acad-advice-box {
        background: rgba(15, 23, 42, 0.6);
        border-color: rgba(51, 65, 85, 0.6);
        color: #cbd5e1;
      }
      .acad-gotcha-box {
        background: rgba(239, 68, 68, 0.06);
        border-left: 4px solid #ef4444;
        border-radius: 10px;
        padding: 14px 16px;
        margin: 16px 0;
        font-size: 11.5px;
        line-height: 1.55;
        color: var(--da-text-muted, var(--sl-text-muted, #64748b));
        border-top: 1px solid var(--da-card-border, var(--sl-card-border, rgba(226, 232, 240, 0.8)));
        border-right: 1px solid var(--da-card-border, var(--sl-card-border, rgba(226, 232, 240, 0.8)));
        border-bottom: 1px solid var(--da-card-border, var(--sl-card-border, rgba(226, 232, 240, 0.8)));
      }
      .dark .acad-gotcha-box {
        background: rgba(239, 68, 68, 0.12);
        color: #fca5a5;
      }
      .acad-takeaway-box {
        background: var(--da-card-bg, var(--sl-card-bg, rgba(255, 255, 255, 0.9)));
        border-left: 4px solid #0ea5e9;
        border-radius: 12px;
        padding: 16px;
        font-size: 12px;
        line-height: 1.6;
        color: var(--da-text-muted, var(--sl-text-muted, #475569));
        font-weight: 600;
        border-top: 1px solid var(--da-card-border, var(--sl-card-border, rgba(226, 232, 240, 0.8)));
        border-right: 1px solid var(--da-card-border, var(--sl-card-border, rgba(226, 232, 240, 0.8)));
        border-bottom: 1px solid var(--da-card-border, var(--sl-card-border, rgba(226, 232, 240, 0.8)));
      }
      .dark .acad-takeaway-box {
        background: rgba(15, 23, 42, 0.6);
        border-left-color: #38bdf8;
        color: #cbd5e1;
        border-top-color: rgba(51, 65, 85, 0.6);
        border-right-color: rgba(51, 65, 85, 0.6);
        border-bottom-color: rgba(51, 65, 85, 0.6);
      }
      .acad-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid var(--da-table-border, var(--sl-table-border, rgba(226, 232, 240, 0.8)));
      }
      .acad-table th {
        background: var(--da-table-th-bg, var(--sl-table-th-bg, #f8fafc));
        color: var(--da-table-th-text, var(--sl-table-th-text, #475569));
        font-weight: 800;
        padding: 12px 14px;
        border-bottom: 1.5px solid var(--da-table-border, var(--sl-table-border, rgba(226, 232, 240, 0.8)));
        text-align: left;
      }
      .dark .acad-table th {
        background: rgba(15, 23, 42, 0.8);
        color: #94a3b8;
        border-bottom-color: rgba(51, 65, 85, 0.6);
      }
      .acad-table td {
        padding: 12px 14px;
        border-bottom: 1px solid var(--da-table-border, var(--sl-table-border, rgba(226, 232, 240, 0.8)));
        color: var(--da-table-td-text, var(--sl-table-td-text, #334155));
      }
      .dark .acad-table td {
        border-bottom-color: rgba(51, 65, 85, 0.6);
        color: #cbd5e1;
      }
      .acad-table tr:last-child td {
        border-bottom: none;
      }

          font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
          color: var(--da-text);
          background-color: var(--da-bg);
          padding: 20px;
          border-radius: 16px;
          transition: all 0.25s ease;

          --da-bg: #f8fafc;
          --da-text: #1e293b;
          --da-text-title: #0f172a;
          --da-text-muted: #475569;
          --da-card-bg: rgba(255, 255, 255, 0.75);
          --da-card-border: rgba(226, 232, 240, 0.85);
          --da-card-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.08), 0 2px 8px -1px rgba(148, 163, 184, 0.04);
          
          --da-tab-bg: rgba(255, 255, 255, 0.85);
          --da-tab-border: rgba(226, 232, 240, 0.85);
          --da-tab-text: #475569;
          --da-tab-hover-bg: #f8fafc;
          --da-tab-hover-border: #cbd5e1;
          --da-tab-hover-text: #1e293b;
          
          --da-input-bg: #ffffff;
          --da-input-color: #0f172a;
          --da-input-border: rgba(226, 232, 240, 0.85);
          
          --da-code-bg: #090d16;
          --da-code-border: #1e293b;
          --da-code-text: #94a3b8;
          
          --da-table-border: rgba(226, 232, 240, 0.85);
          --da-table-th-bg: #f8fafc;
          --da-table-th-text: #475569;
          --da-table-td-text: #334155;

          --da-svg-bg: #ffffff;
          --da-svg-grid: radial-gradient(rgba(37, 99, 235, 0.03) 1.5px, transparent 1.5px);
          
          --da-svg-indigo-bg: #eff6ff;
          --da-svg-indigo-border: #3b82f6;
          --da-svg-indigo-text: #1e3a8a;
          
          --da-svg-green-bg: #f0fdf4;
          --da-svg-green-border: #10b981;
          --da-svg-green-text: #065f46;
          
          --da-svg-red-bg: #fee2e2;
          --da-svg-red-border: #f43f5e;
          --da-svg-red-text: #991b1b;
          
          --da-svg-amber-bg: #fffbeb;
          --da-svg-amber-border: #d97706;
          --da-svg-amber-text: #78350f;

          --da-svg-purple-bg: #faf5ff;
          --da-svg-purple-border: #c084fc;
          --da-svg-purple-text: #6b21a8;
        }

        .dark .da-container {
          background-color: #020617 !important;
          color: #cbd5e1 !important;

          --da-bg: #020617;
          --da-text: #cbd5e1;
          --da-text-title: #ffffff;
          --da-text-muted: #94a3b8;
          --da-card-bg: rgba(15, 23, 42, 0.75);
          --da-card-border: rgba(51, 65, 85, 0.6);
          --da-card-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          
          --da-tab-bg: rgba(15, 23, 42, 0.6);
          --da-tab-border: rgba(51, 65, 85, 0.6);
          --da-tab-text: #94a3b8;
          --da-tab-hover-bg: rgba(30, 41, 59, 0.8);
          --da-tab-hover-border: rgba(51, 65, 85, 0.6);
          --da-tab-hover-text: #f8fafc;
          
          --da-input-bg: #0f172a;
          --da-input-color: #f1f5f9;
          --da-input-border: rgba(51, 65, 85, 0.8);
          
          --da-code-bg: #020617;
          --da-code-border: rgba(51, 65, 85, 0.6);
          --da-code-text: #38bdf8;
          
          --da-table-border: rgba(51, 65, 85, 0.6);
          --da-table-th-bg: rgba(15, 23, 42, 0.8);
          --da-table-th-text: #94a3b8;
          --da-table-td-text: #cbd5e1;

          --da-svg-bg: #020617;
          --da-svg-grid: radial-gradient(rgba(51, 65, 85, 0.5) 1.2px, transparent 1.2px);
          
          --da-svg-indigo-bg: rgba(59, 130, 246, 0.15);
          --da-svg-indigo-border: rgba(59, 130, 246, 0.5);
          --da-svg-indigo-text: #60a5fa;
          
          --da-svg-green-bg: rgba(16, 185, 129, 0.15);
          --da-svg-green-border: rgba(16, 185, 129, 0.4);
          --da-svg-green-text: #4ade80;
          
          --da-svg-red-bg: rgba(244, 63, 94, 0.15);
          --da-svg-red-border: rgba(244, 63, 94, 0.5);
          --da-svg-red-text: #f87171;
          
          --da-svg-amber-bg: rgba(245, 158, 11, 0.15);
          --da-svg-amber-border: rgba(245, 158, 11, 0.5);
          --da-svg-amber-text: #fbbf24;

          --da-svg-purple-bg: rgba(168, 85, 247, 0.15);
          --da-svg-purple-border: rgba(168, 85, 247, 0.4);
          --da-svg-purple-text: #c084fc;
        }

        .da-card {
          background: var(--da-card-bg);
          border: 1.5px solid var(--da-card-border);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: var(--da-card-shadow);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .da-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 10px 20px -4px rgba(59, 130, 246, 0.04);
        }
        .da-card-title {
          font-size: 17px;
          font-weight: 800;
          color: var(--da-text-title);
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .da-card-desc {
          font-size: 13px;
          color: var(--da-text-muted);
          line-height: 1.6;
        }
        .da-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          border-bottom: 1.5px solid var(--da-card-border);
          padding-bottom: 10px;
        }
        .da-tb {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 12px;
          border: 1.5px solid var(--da-tab-border);
          font-size: 12px;
          font-weight: 600;
          color: var(--da-tab-text);
          background: var(--da-tab-bg);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease-in-out;
          outline: none;
        }
        .da-tb:hover {
          background: var(--da-tab-hover-bg);
          border-color: var(--da-tab-hover-border);
          color: var(--da-tab-hover-text);
        }
        .da-tb.da-on {
          background: #2563eb;
          color: #ffffff;
          border-color: #2563eb;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
        }

        .da-svg-bg {
          background-color: var(--da-svg-bg) !important;
          background-image: var(--da-svg-grid) !important;
          background-size: 16px 16px;
          border: 1.5px solid var(--da-card-border);
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

        .da-edu-card {
          background: var(--da-card-bg);
          border: 1px solid var(--da-card-border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: var(--da-card-shadow);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .da-edu-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px -8px rgba(37, 99, 235, 0.12);
          border-color: #bfdbfe;
        }
        
        .acad-dir-container {
          background: var(--da-card-bg);
          border: 1px solid var(--da-card-border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: var(--da-card-shadow);
        }
        .acad-dir-header {
          background: var(--da-input-bg);
          color: var(--da-text-title);
          padding: 16px;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--da-card-border);
        }
        .acad-dir-folder-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--da-bg);
          border-bottom: 1px solid var(--da-card-border);
          font-size: 10px;
          font-weight: 850;
          color: var(--da-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
        }
        .acad-dir-folder-btn:hover {
          background: var(--da-tab-hover-bg);
          color: var(--da-text-title);
        }
        .acad-dir-item-btn {
          width: 105%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          font-size: 12px;
          font-weight: 600;
          color: var(--da-text-muted);
          border-left: 3px solid transparent;
          background: var(--da-card-bg);
          transition: all 0.15s ease;
          text-align: left;
        }
        .acad-dir-item-btn:hover {
          background: var(--da-tab-hover-bg);
          color: #2563eb;
          border-left-color: var(--da-card-border);
        }
        .acad-dir-item-btn.acad-active {
          background: var(--da-svg-indigo-bg);
          color: var(--da-svg-indigo-text);
          border-left-color: var(--da-svg-indigo-border);
          font-weight: 800;
        }
        .acad-detail-card {
          background: var(--da-card-bg);
          border: 1px solid var(--da-card-border);
          border-radius: 16px;
          padding: 28px;
          box-shadow: var(--da-card-shadow);
        }
        .acad-hero-badge {
          background: var(--da-svg-indigo-bg);
          border: 1.5px solid var(--da-svg-indigo-border);
          color: var(--da-svg-indigo-text);
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
          background: var(--da-bg);
          border-left: 4px solid var(--da-svg-indigo-border);
          border-radius: 12px;
          padding: 18px;
          font-size: 12px;
          line-height: 1.6;
          color: var(--da-text-muted);
          font-weight: 600;
        }
        .acad-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--da-table-border);
        }
        .acad-table th {
          background: var(--da-table-th-bg);
          color: var(--da-table-th-text);
          font-weight: 800;
          padding: 12px 14px;
          border-bottom: 1.5px solid var(--da-table-border);
          text-align: left;
        }
        .acad-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--da-table-border);
          color: var(--da-table-td-text);
        }
        .acad-table tr:last-child td {
          border-bottom: none;
        }
        .acad-sim-diagram {
          background: var(--da-card-bg);
          border: 1.5px solid var(--da-card-border);
          border-radius: 16px;
          padding: 18px;
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02);
          position: relative;
        }
        .acad-terminal {
          background: var(--da-code-bg);
          border: 1px solid var(--da-code-border);
          border-radius: 12px;
          padding: 14px;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          color: var(--da-code-text);
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
          position: relative;
        }
        .acad-copy-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(51, 65, 85, 0.8);
          border: 1px solid rgba(71, 85, 105, 0.8);
          border-radius: 6px;
          color: #e2e8f0;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 4px;
          backdrop-filter: blur(4px);
        }
        .acad-copy-btn:hover {
          background: #334155;
          color: #ffffff;
          border-color: #475569;
        }
        .acad-copy-btn.copied {
          background: #10b981;
          border-color: #10b981;
          color: #ffffff;
        }

        .da-container h1,
        .da-container h2,
        .da-container h3,
        .da-container h4,
        .da-container th,
        .da-container .text-slate-900,
        .da-container .text-slate-850,
        .da-container .text-slate-800,
        .da-container .text-gray-900 {
          color: var(--da-text-title) !important;
        }
        
        .da-container p,
        .da-container td,
        .da-container li,
        .da-container .text-slate-750,
        .da-container .text-slate-700,
        .da-container .text-slate-650,
        .da-container .text-slate-600,
        .da-container .text-slate-500,
        .da-container .text-gray-600,
        .da-container .text-gray-500 {
          color: var(--da-text-muted) !important;
        }

        .da-container .bg-white {
          background-color: var(--da-card-bg) !important;
        }
        
        .da-container .bg-slate-50,
        .da-container .bg-slate-100 {
          background-color: var(--da-bg) !important;
        }

        .da-container .hover\:bg-slate-50:hover,
        .da-container .hover\:bg-slate-100:hover,
        .da-container .hover\:bg-blue-50:hover {
          background-color: var(--da-tab-hover-bg) !important;
        }

        .da-container .border-slate-200,
        .da-container .border-slate-100,
        .da-container .border-slate-150,
        .da-container .border-slate-250,
        .da-container .border-gray-200 {
          border-color: var(--da-card-border) !important;
        }

        /* Scoped input/form components */
        .da-container select,
        .da-container input,
        .da-container textarea {
          background-color: var(--da-input-bg) !important;
          color: var(--da-input-color) !important;
          border: 1.5px solid var(--da-input-border) !important;
          border-radius: 8px;
          outline: none;
          transition: all 0.2s ease;
        }

        .da-container select option {
          background-color: var(--da-input-bg) !important;
          color: var(--da-input-color) !important;
        }

        .da-container select:focus,
        .da-container input:focus,
        .da-container textarea:focus {
          border-color: #2563eb !important;
        }

        /* Alert overrides in dark mode */
        .dark .da-container .bg-blue-50 {
          background-color: rgba(37, 99, 235, 0.15) !important;
          color: #a5b4fc !important;
        }
        
        .dark .da-container .bg-sky-50 {
          background-color: rgba(14, 165, 233, 0.15) !important;
          color: #7dd3fc !important;
        }
        
        .dark .da-container .bg-amber-50 {
          background-color: rgba(245, 158, 11, 0.15) !important;
          color: #fef08a !important;
        }

        .dark .da-container .bg-rose-50 {
          background-color: rgba(244, 63, 94, 0.15) !important;
          color: #fca5a5 !important;
        }
        
        .dark .da-container .bg-red-50 {
          background-color: rgba(239, 68, 68, 0.15) !important;
          color: #fca5a5 !important;
        }
        
        .dark .da-container .bg-green-50 {
          background-color: rgba(16, 185, 129, 0.15) !important;
          color: #86efac !important;
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
      {!isComparative && (
        <Translate>
        <div className="da-tabs">
          <button className={`da-tb ${activeTab === 'notebook' ? 'da-on' : ''}`} onClick={() => setActiveTab('notebook')}>
            <BookOpen className="w-4 h-4 text-indigo-500" /> 📖 1) Visual Notes &amp; Theories
          </button>
          <button className={`da-tb ${activeTab === 'intro' ? 'da-on' : ''}`} onClick={() => setActiveTab('intro')}>
            <SlidersHorizontal className="w-4 h-4 text-sky-500" /> 🎯 2) Edge Scopes Comparative Grid
          </button>
          <button className={`da-tb ${activeTab === 'acm' ? 'da-on' : ''}`} onClick={() => setActiveTab('acm')}>
            <Key className="w-4 h-4" /> 🔒 3) ACM Certificates &amp; HTTPS
          </button>
          <button className={`da-tb ${activeTab === 'waf' ? 'da-on' : ''}`} onClick={() => setActiveTab('waf')}>
            <Layers className="w-4 h-4" /> 🛡️ 4) AWS WAF Rules &amp; Gateways
          </button>
          <button className={`da-tb ${activeTab === 'ddos' ? 'da-on' : ''}`} onClick={() => setActiveTab('ddos')}>
            <Activity className="w-4 h-4" /> 🌊 5) DDoS Resilience &amp; Shield
          </button>
          <button className={`da-tb ${activeTab === 'scanners' ? 'da-on' : ''}`} onClick={() => setActiveTab('scanners')}>
            <Search className="w-4 h-4" /> 👁️ 6) Threat Intel &amp; Inspector Scans
          </button>
          <button className={`da-tb ${activeTab === 'unique' ? 'da-on' : ''}`} onClick={() => setActiveTab('unique')}>
            ✨ Unique Features
          </button>
        </div>
      </Translate>
      )}

      {isComparative && (
        <NetworkAndEdgeSecurityComparativeView onNavigateToDemo={handleNavigateToDemo} />
      )}

      {!isComparative && activeTab === 'unique' && (
        <UniqueNetworkAndEdgeSecurityFeatures provider={provider} />
      )}

      {!isComparative && activeTab !== 'unique' && (
        <Translate>
          <>

      {/* ========================================================================= */}
      {/* TAB 1: EDGE SCOPES MATRIX                                                 */}
      {/* ========================================================================= */}
            {activeTab === 'notebook' && (
        <div className="space-y-6 animate-fadeIn text-left" style={{ color: 'var(--da-text)' }}>
          
          {/* Header Hero Card */}
          <div className="da-card text-left" style={{ borderLeft: '4px solid #4f46e5', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                  <BookOpen className="w-5 h-5 text-indigo-600" /> AWS Network &amp; Edge Security Notes &amp; Mental Models
                </h2>
                <p className="text-xs mt-1.5 leading-relaxed font-sans font-semibold" style={{ color: 'var(--da-text-muted)' }}>
                  Simplified, beginner-friendly security theories sorted progressively from WAF vs Network Firewall vs Security Groups to SSL/TLS via ACM, Volumetric DDoS Protection (AWS Shield), Suricata Inspection, Firewall Manager, GuardDuty AI Threat Detection, and Amazon Inspector CVE Scans.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="acad-hero-badge">🎓 Beginner to Pro</span>
                <span className="acad-hero-badge" style={{ background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.35)', color: '#d97706' }}>💡 Everyday Mental Models</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Sidebar Category Explorer */}
            <div className="lg:col-span-3 space-y-4 text-left">
              <span className="text-[10px] font-black uppercase tracking-widest block pl-1 font-mono" style={{ color: 'var(--da-text-muted)' }}>Curriculum Directory:</span>
              
              <div className="acad-dir-container">
                <div className="acad-dir-header">
                  <Shield className="w-4 h-4 text-indigo-600" />
                  <span>Security Modules</span>
                </div>

                {/* LEVEL 1: PERIMETERS & CERTIFICATES */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'net_fundamentals' ? '' : 'net_fundamentals')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                      🐣 Level 1 · Perimeters &amp; SSL
                    </span>
                    {expandedCategory === 'net_fundamentals' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'net_fundamentals' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('waf_vs_netfw')}
                        className={`acad-dir-item-btn ${selectedNote === 'waf_vs_netfw' ? 'acad-active' : ''}`}
                      >
                        1.1 WAF vs NetFW vs SecGroups
                      </button>
                      <button 
                        onClick={() => setSelectedNote('acm_ssl_tls')}
                        className={`acad-dir-item-btn ${selectedNote === 'acm_ssl_tls' ? 'acad-active' : ''}`}
                      >
                        1.2 ACM Certificates &amp; HTTPS
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 2: L7 WAF & DDOS PROTECTION */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'l7_ddos' ? '' : 'l7_ddos')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-sky-500" />
                      ⚙️ Level 2 · WAF &amp; DDoS Shield
                    </span>
                    {expandedCategory === 'l7_ddos' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'l7_ddos' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('waf_webacl')}
                        className={`acad-dir-item-btn ${selectedNote === 'waf_webacl' ? 'acad-active' : ''}`}
                      >
                        2.1 WAF WebACL &amp; SQLi/XSS Rules
                      </button>
                      <button 
                        onClick={() => setSelectedNote('aws_shield')}
                        className={`acad-dir-item-btn ${selectedNote === 'aws_shield' ? 'acad-active' : ''}`}
                      >
                        2.2 AWS Shield Std vs Advanced
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 3: NETWORK FIREWALL & FIREWALL MANAGER */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'netfw_fms' ? '' : 'netfw_fms')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-purple-500" />
                      🏛️ Level 3 · VPC Firewall &amp; FMS
                    </span>
                    {expandedCategory === 'netfw_fms' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'netfw_fms' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('network_firewall')}
                        className={`acad-dir-item-btn ${selectedNote === 'network_firewall' ? 'acad-active' : ''}`}
                      >
                        3.1 Network Firewall &amp; Suricata
                      </button>
                      <button 
                        onClick={() => setSelectedNote('firewall_manager')}
                        className={`acad-dir-item-btn ${selectedNote === 'firewall_manager' ? 'acad-active' : ''}`}
                      >
                        3.2 AWS Firewall Manager (FMS)
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 4: THREAT INTEL & CVE SCANS */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'threat_cve' ? '' : 'threat_cve')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-emerald-500" />
                      🛡️ Level 4 · GuardDuty &amp; Inspector
                    </span>
                    {expandedCategory === 'threat_cve' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'threat_cve' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)' }}>
                      <button 
                        onClick={() => setSelectedNote('guardduty_ai')}
                        className={`acad-dir-item-btn ${selectedNote === 'guardduty_ai' ? 'acad-active' : ''}`}
                      >
                        4.1 GuardDuty AI Threat Detection
                      </button>
                      <button 
                        onClick={() => setSelectedNote('inspector_cve')}
                        className={`acad-dir-item-btn ${selectedNote === 'inspector_cve' ? 'acad-active' : ''}`}
                      >
                        4.2 Inspector Vulnerability Scans
                      </button>
                    </div>
                  )}
                </div>

              </div>

              <div className="acad-advice-box rounded-2xl p-4 text-[11px] leading-relaxed font-semibold space-y-1">
                <span className="font-extrabold flex items-center gap-1.5 mb-1 text-[11.5px]" style={{ color: 'var(--da-text-title)' }}>
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Interactive Quick-Launch
                </span>
                Click any security topic to explore real-world analogies, WAF WebACL rules, and copyable JSON firewall policies!
              </div>
            </div>

            {/* Right Active Note Workspace */}
            <div className="lg:col-span-9 space-y-6 text-left">

              {/* NOTE 1.1: WAF VS NETFW VS SECURITY GROUPS */}
              {selectedNote === 'waf_vs_netfw' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🐣 Level 1 · Perimeters &amp; SSL</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        1.1 AWS WAF vs AWS Network Firewall vs Security Groups
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('intro')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Edge Scopes Tab
                      </button>
                    </div>
                  </div>

                  {/* What & Why Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Shield className="w-3.5 h-3.5 text-indigo-500" /> What Is It &amp; Why Needed?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Cloud applications face threats at different network OSI layers: HTTP web exploits (Layer 7), unauthorized IP port scans (Layer 4), and malicious outbound data exfiltration. Different firewall layers are required to block malicious traffic before it reaches servers!
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Terminal className="w-3.5 h-3.5 text-emerald-500" /> What Problem Does It Solve?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Protects web applications against SQL injections, Cross-Site Scripting (XSS), bot scrapers, port scanning, and unauthorized SSH/RDP access attempts at the cloud edge and VPC perimeters!
                      </p>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong>
                    <br />• <strong>AWS WAF (Layer 7 Web Application Firewall)</strong>: Inspects HTTP/HTTPS requests (URLs, headers, cookies, query strings) attached to CloudFront, ALB, or API Gateway.
                    <br />• <strong>AWS Network Firewall (Layer 3/4/7 VPC Gateway)</strong>: Stateful &amp; stateless packet inspection at the VPC boundary (Suricata IDS/IPS engine).
                    <br />• <strong>Security Groups (Layer 4 Stateful Host Firewall)</strong>: Virtual firewalls attached directly to EC2 instances or ENIs controlling IP addresses and ports (e.g. Allow Port 443).
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Airport Security Check vs Highway Toll Gate vs Room Keycard
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      • <strong>AWS WAF (Airport TSA Luggage Scanner)</strong>: Opens every bag (HTTP payload) to make sure nobody is carrying liquid explosives or weapons (`SQL Injection / XSS`).
                      <br />• <strong>AWS Network Firewall (Border Control Toll Gate)</strong>: Inspects every car entering or leaving the state highway, checking license plates and cargo manifests.
                      <br />• <strong>Security Groups (Hotel Room Door Lock)</strong>: Only lets people holding keycard #402 (Authorized IP Address &amp; Port) open the specific room door!
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="acad-table">
                      <thead>
                        <tr>
                          <th>Firewall Primitive</th>
                          <th>OSI Layer</th>
                          <th>Attachment Target</th>
                          <th>Primary Specialty</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>AWS WAF</strong></td>
                          <td>Layer 7 (Application)</td>
                          <td>CloudFront, ALB, API Gateway, AppSync</td>
                          <td>SQLi, XSS, Rate-limiting, Bot Control</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Network Firewall</strong></td>
                          <td>Layer 3, 4 &amp; 7 (VPC Boundary)</td>
                          <td>VPC Subnet / Internet Gateway Route</td>
                          <td>Deep Packet Inspection, Domain Filtering</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Security Group</strong></td>
                          <td>Layer 4 (Transport)</td>
                          <td>EC2 ENI, RDS, Lambda VPC Interface</td>
                          <td>Stateful IP &amp; Port allow rules</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Real World Production Scenario */}
                  <div className="p-4 rounded-xl border font-sans text-xs space-y-1.5" style={{ background: 'var(--da-card-bg)', borderColor: 'var(--da-card-border)' }}>
                    <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-500 block">🚀 Real-World Production Defense Architecture:</span>
                    <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                      An e-commerce application uses <strong>AWS WAF</strong> attached to CloudFront to block SQL injection attempts on `/checkout`. Traffic passes into the VPC through <strong>AWS Network Firewall</strong> to block outbound connections to known malware C2 domains, while <strong>Security Groups</strong> restrict RDS database access exclusively to incoming connections from the App Server security group on port 5432!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 1.2: ACM & HTTPS REDIRECTS */}
              {selectedNote === 'acm_ssl_tls' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🐣 Level 1 · Perimeters &amp; SSL</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        1.2 AWS Certificate Manager (ACM) &amp; Automated SSL/TLS Renewal
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('acm')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to ACM Certificates Tab
                      </button>
                    </div>
                  </div>

                  {/* What & Why Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Shield className="w-3.5 h-3.5 text-indigo-500" /> What Is It &amp; Why Needed?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        HTTPS encrypts web traffic between browsers and servers. Managing SSL/TLS certificates manually involves paying third-party certificate authorities, uploading CRT/KEY files, and remembering to manually renew them before expiration warnings break production sites!
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Terminal className="w-3.5 h-3.5 text-emerald-500" /> What Problem Does It Solve?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        <strong>AWS Certificate Manager (ACM)</strong> provisions, manages, and **automatically renews public SSL/TLS certificates for FREE**! Certificates deploy directly to CloudFront distributions and Application Load Balancers with zero maintenance.
                      </p>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong>
                    <br />• <strong>DNS Validation</strong>: ACM adds a CNAME record to Route 53 to instantly verify domain ownership.
                    <br />• <strong>Automatic Zero-Downtime Renewal</strong>: ACM automatically renews certificates 60 days before expiration without developer intervention or site downtime!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Automated Passport Renewal Office
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      Instead of standing in a 4-hour line at the DMV every year to renew your physical ID card (`Manual Certificate Renewal`), a digital passport office (`ACM`) automatically prints and mails you a fresh valid ID card 2 months before your current card expires!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 2.1: WAF WEBACL & RULES */}
              {selectedNote === 'waf_webacl' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">⚙️ Level 2 · WAF &amp; DDoS Shield</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        2.1 AWS WAF WebACL, Managed Rules &amp; Rate Limiting
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('waf')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to WAF Rules Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> An **AWS WAF WebACL** contains prioritized inspection rules:
                    <br />• <strong>AWS Managed Rulesets</strong>: Pre-configured threat intelligence from AWS Security (Core Rule Set, SQLi Rule Set, Known Bad Inputs).
                    <br />• <strong>Rate-Based Rules</strong>: Tracks request counts per IP address over a 5-minute sliding window (e.g. block IP if requests &gt; 2,000 in 5 mins).
                    <br />• <strong>Custom Rules</strong>: Block specific country IP ranges (Geo-match) or custom HTTP headers (`X-Custom-Secret`).
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Nightclub Bouncer Checklist &amp; Speedometer
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      A nightclub bouncer stands at the door holding a checklist (`WebACL Rules`). Rule #1: Check photo ID for fake passports (`AWS Managed Rules`). Rule #2: If someone tries to run through the door 10 times in 10 seconds (`Rate-Based Rule`), lock them out for 15 minutes!
                    </p>
                  </div>

                  {/* Copyable WAF Rate Limit Rule Snippet */}
                  <div className="acad-advice-box p-4 rounded-xl flex flex-col justify-between" style={{ background: 'var(--da-card-bg)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--da-text-muted)' }}>WAF Rate-Limiting Rule JSON Snippet</span>
                      <button 
                        onClick={() => {
                          const snippet = `{\n  "Name": "RateLimit2000PerIP",\n  "Priority": 1,\n  "Statement": {\n    "RateBasedStatement": {\n      "Limit": 2000,\n      "AggregateKeyType": "IP"\n    }\n  },\n  "Action": { "Block": {} }\n}`;
                          navigator.clipboard.writeText(snippet);
                          setCopiedNoteId('waf-rate-rule');
                          setTimeout(() => setCopiedNoteId(null), 2000);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-mono flex items-center gap-1 transition-all"
                      >
                        {copiedNoteId === 'waf-rate-rule' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <pre className="acad-terminal text-[9.5px] leading-relaxed overflow-x-auto h-24">
{`{
  "Name": "RateLimit2000PerIP",
  "Priority": 1,
  "Statement": {
    "RateBasedStatement": {
      "Limit": 2000,
      "AggregateKeyType": "IP"
    }
  },
  "Action": { "Block": {} }
}`}
                    </pre>
                  </div>
                </div>
              )}

              {/* NOTE 2.2: AWS SHIELD */}
              {selectedNote === 'aws_shield' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">⚙️ Level 2 · WAF &amp; DDoS Shield</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        2.2 AWS Shield Standard vs AWS Shield Advanced (DDoS Protection)
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('ddos')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to DDoS Resilience Tab
                      </button>
                    </div>
                  </div>

                  {/* What & Why Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Shield className="w-3.5 h-3.5 text-indigo-500" /> What Is It &amp; Why Needed?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Distributed Denial of Service (DDoS) attacks flood servers with terabytes of junk traffic (SYN floods, UDP reflection attacks) to crash websites. **AWS Shield** mitigates volumetric network attacks at the global AWS edge.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Terminal className="w-3.5 h-3.5 text-emerald-500" /> What Problem Does It Solve?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Prevents application downtime during massive multithreaded attacks. **Shield Advanced** provides 24/7 access to the AWS Shield Response Team (SRT) and **DDoS Cost Protection** (reimbursing auto-scaling bills caused by attack spikes)!
                      </p>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong>
                    <br />• <strong>AWS Shield Standard (FREE)</strong>: Automatically active on all AWS services, protecting against common Layer 3/4 network floods (SYN/ACK floods).
                    <br />• <strong>AWS Shield Advanced ($3,000/mo)</strong>: Enterprise protection for CloudFront, Route 53, ALB, and Elastic IPs with 24/7 SRT incident response and bill refund insurance!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Standard Weatherproof Roof vs Flood Control Dam &amp; Fire Squad
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      • <strong>Shield Standard (Weatherproof Roof)</strong>: Built into every house by default to handle ordinary rainstorms (`Standard Network Noise`).
                      <br />• <strong>Shield Advanced (Flood Barrier &amp; 24/7 On-Call Fire Brigade)</strong>: When a massive 100-year hurricane hits (`1 Tbps Botnet Attack`), a dedicated SWAT team rushes in with heavy water pumps to protect your building while paying for any water damage repairs!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 3.1: NETWORK FIREWALL */}
              {selectedNote === 'network_firewall' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🏛️ Level 3 · VPC Firewall &amp; FMS</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        3.1 AWS Network Firewall &amp; Suricata IPS Rule Engine
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('waf')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to WAF Rules Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **AWS Network Firewall** is a managed stateful firewall deployed directly into dedicated firewall subnets inside a VPC. It supports **Suricata open-source IDS/IPS rules**, performing deep packet inspection to filter non-HTTP traffic, block malicious outbound outbound domain calls (TLDs), and prevent malware command-and-control exfiltration!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Interstate Highway Toll Booth &amp; Cargo X-Ray
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      A highway toll booth (`Network Firewall Subnet`) sits on the main highway leading into the city (`VPC`). Inspectors X-ray every semi-truck cargo container (`Deep Packet Inspection`). If a truck attempts to leave the city headed toward an illegal drop zone (`Malware Command Server`), the gate drops instantly!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 3.2: FIREWALL MANAGER */}
              {selectedNote === 'firewall_manager' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🏛️ Level 3 · VPC Firewall &amp; FMS</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        3.2 AWS Firewall Manager (FMS): Multi-Account Central Security Policy Sync
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('scanners')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Scanners Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Managing WAF rules, Security Groups, and Shield Advanced protection across 100+ AWS accounts manually leads to configuration drift. **AWS Firewall Manager (FMS)** automatically audits and enforces security rules across all accounts in AWS Organizations centrally!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Central Hotel Franchise Security Command Center
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      Corporate security headquarters (`Firewall Manager`) pushes a button, and the electronic door locks on 500 franchise hotel locations across the world immediately update their master access code simultaneously!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 4.1: GUARDDUTY AI */}
              {selectedNote === 'guardduty_ai' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🛡️ Level 4 · GuardDuty &amp; Inspector</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        4.1 Amazon GuardDuty: Intelligent Threat Detection &amp; Anomaly Analysis
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('scanners')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Threat Intelligence Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **Amazon GuardDuty** continuously analyzes AWS CloudTrail logs, VPC Flow Logs, DNS logs, and EKS audit logs using Machine Learning. It detects compromised IAM credentials, unusual EC2 crypto-mining spikes, and unauthorized database exfiltration without installing agents or impacting performance!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Smart Security AI CCTV Camera
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      An AI CCTV camera watches the bank lobby 24/7. It notices that employee Bob suddenly logged into the vault at 3:00 AM from a location in Russia (`Credential Compromise`) and immediately alerts security guards!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 4.2: AMAZON INSPECTOR */}
              {selectedNote === 'inspector_cve' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🛡️ Level 4 · GuardDuty &amp; Inspector</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        4.2 Amazon Inspector: Automated Vulnerability &amp; CVE Management
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('scanners')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Threat Intelligence Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **Amazon Inspector** automatically scans EC2 instances, ECR container images, and Lambda functions for software vulnerabilities (Common Vulnerabilities and Exposures - CVEs) and unintended network exposure. It assigns an **Inspector Risk Score** prioritized by exploitability!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Car Diagnostic Medical Checkup
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      A mechanic plugs a computer scanner into your car&apos;s OBD-II port (`Amazon Inspector`). It checks engine belts, brake pads, and tire pressure (`Software Packages &amp; OS`), handing you a report stating: &ldquo;Critical: Replace front brake pads before driving on highway (`CVE-2024-1234`)!&rdquo;
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}


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
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-text-muted)" />
                    </marker>
                  </defs>

                  {/* Flow links */}
                  {/* ACM -> EventBridge */}
                  <path d="M 60 40 Q 115 25 170 40" fill="none" stroke="var(--da-text-muted)" strokeWidth="1.5" className={acmEvalStep >= 2 ? 'da-flow-blue' : ''} markerEnd="url(#arrow-acm)" />
                  {/* Config -> EventBridge */}
                  <path d="M 60 110 Q 115 125 170 110" fill="none" stroke="var(--da-text-muted)" strokeWidth="1.5" className={acmEvalStep >= 1 ? 'da-flow-blue' : ''} markerEnd="url(#arrow-acm)" />
                  {/* EventBridge -> Lambda/SNS/SQS targets */}
                  <path d="M 230 75 L 265 75" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="2" className={acmEvalStep >= 3 && certType === 'import' ? 'da-flow-green' : ''} markerEnd="url(#arrow-acm)" />

                  {/* ACM Source Node */}
                  <g transform="translate(10, 20)">
                    <rect x="0" y="0" width="50" height="40" rx="6" fill="var(--da-code-bg)" stroke="var(--da-code-border)" strokeWidth="1.5" />
                    <text x="25" y="16" fill="var(--da-code-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">ACM</text>
                    <text x="25" y="27" fill="var(--da-code-text)" fontSize="5.5" textAnchor="middle">Certs Store</text>
                    <text x="25" y="35" fill="var(--da-svg-purple-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">SSL/TLS</text>
                  </g>

                  {/* AWS Config Compliance check */}
                  <g transform="translate(10, 95)">
                    <rect x="0" y="0" width="50" height="40" rx="6" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1.5" />
                    <text x="25" y="16" fill="var(--da-svg-purple-text)" fontSize="7" fontWeight="bold" textAnchor="middle">AWS Config</text>
                    <text x="25" y="27" fill="var(--da-svg-purple-text)" fontSize="5" textAnchor="middle">managed check</text>
                    <text x="25" y="35" fill="var(--da-svg-purple-text)" fontSize="5" fontWeight="bold" textAnchor="middle">acm-check</text>
                  </g>

                  {/* EventBridge Bus */}
                  <g transform="translate(170, 50)">
                    <rect x="0" y="0" width="60" height="50" rx="6" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" />
                    <text x="30" y="16" fill="var(--da-svg-amber-text)" fontSize="7" fontWeight="bold" textAnchor="middle">EventBridge</text>
                    <text x="30" y="27" fill="var(--da-svg-amber-text)" fontSize="6" textAnchor="middle">Bus route</text>
                    <text x="30" y="38" fill="var(--da-svg-amber-border)" fontSize="5.5" fontWeight="bold" textAnchor="middle">
                      {acmEvalStep >= 2 ? 'Events active' : 'Standby'}
                    </text>
                  </g>

                  {/* Target SNS Alerts */}
                  <g transform="translate(265, 55)">
                    <rect x="0" y="0" width="50" height="40" rx="6" 
                      fill={certType === 'import' && acmEvalStep === 3 ? 'var(--da-svg-red-bg)' : 'var(--da-svg-green-bg)'} 
                      stroke={certType === 'import' && acmEvalStep === 3 ? 'var(--da-svg-red-border)' : 'var(--da-svg-green-border)'} 
                      strokeWidth="1.5" />
                    <text x="25" y="16" fill="var(--da-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Targets</text>
                    <text x="25" y="25" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">Lambda/SNS</text>
                    <text x="25" y="34" fill={certType === 'import' && acmEvalStep === 3 ? 'var(--da-svg-red-text)' : 'var(--da-svg-green-text)'} fontSize="6" fontWeight="bold" textAnchor="middle">
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
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-text-muted)" />
                    </marker>
                  </defs>

                  {/* Operational Tier boundaries */}
                  <rect x="5" y="10" width="165" height="240" rx="8" fill="none" stroke="var(--da-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="15" y="24" fill="var(--da-text-muted)" fontSize="6.5" fontWeight="bold">AWS Edge Services</text>

                  <rect x="180" y="10" width="180" height="240" rx="8" fill="none" stroke="var(--da-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="190" y="24" fill="var(--da-text-muted)" fontSize="6.5" fontWeight="bold">AWS Regional public/private subnets</text>

                  <rect x="370" y="10" width="165" height="240" rx="8" fill="none" stroke="var(--da-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="380" y="24" fill="var(--da-text-muted)" fontSize="6.5" fontWeight="bold">Corporate Data Center</text>

                  {/* Flow conduits */}
                  {/* Edge -> Region */}
                  <path d="M 125 130 H 220" fill="none" 
                    className={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? 'da-flow-rose' : ddosTrafficState === 'attack' && ddosMitigation === 'shield_advanced' ? 'da-flow-green' : 'da-flow-blue'} 
                    stroke={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? 'var(--da-svg-red-border)' : 'var(--da-card-border)'} strokeWidth="2" />
                  
                  {/* Region -> Private ASG */}
                  <path d="M 270 130 H 300" fill="none" 
                    className={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? 'da-flow-rose' : 'da-flow-blue'} 
                    stroke="var(--da-card-border)" strokeWidth="1.5" />

                  {/* Private Transit Gateway -> Corporate datacenter */}
                  <path d="M 335 200 H 425" fill="none" stroke="var(--da-text-muted)" strokeWidth="1.5" strokeDasharray="4,4" />

                  {/* 1. AWS Edge Services nodes */}
                  {/* Route 53 */}
                  <g transform="translate(15, 45)">
                    <rect x="0" y="0" width="105" height="26" rx="4" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" />
                    <text x="52.5" y="15" fill="var(--da-svg-indigo-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Route 53 DNS</text>
                  </g>
                  {/* CloudFront Edge CDN */}
                  <g transform="translate(15, 85)">
                    <rect x="0" y="0" width="105" height="26" rx="4" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" />
                    <text x="52.5" y="15" fill="var(--da-svg-indigo-text)" fontSize="7" fontWeight="bold" textAnchor="middle">CloudFront CDN</text>
                  </g>
                  {/* Edge WAF */}
                  <g transform="translate(15, 125)">
                    <rect x="0" y="0" width="105" height="26" rx="4" 
                      fill={ddosMitigation === 'shield_advanced' ? 'var(--da-svg-green-bg)' : 'var(--da-bg)'} 
                      stroke={ddosMitigation === 'shield_advanced' ? 'var(--da-svg-green-border)' : 'var(--da-card-border)'} strokeWidth="1.5" />
                    <text x="52.5" y="15" fill="var(--da-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Edge WAF Rules</text>
                  </g>
                  {/* Global Accelerator */}
                  <g transform="translate(15, 165)">
                    <rect x="0" y="0" width="105" height="26" rx="4" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" />
                    <text x="52.5" y="15" fill="var(--da-svg-indigo-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Global Accelerator</text>
                  </g>

                  {/* 2. AWS Region public/private nodes */}
                  {/* Public ALB */}
                  <g transform="translate(195, 80)">
                    <rect x="0" y="0" width="70" height="35" rx="4" 
                      fill={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? 'var(--da-svg-red-bg)' : 'var(--da-bg)'} 
                      stroke={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? 'var(--da-svg-red-border)' : 'var(--da-card-border)'} strokeWidth="1.5" />
                    <text x="35" y="15" fill="var(--da-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Public ALB</text>
                    <text x="35" y="26" fill={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? 'var(--da-svg-red-text)' : 'var(--da-svg-green-text)'} fontSize="5.5" fontWeight="bold" textAnchor="middle">
                      {ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? '🔥 Saturated' : '🟢 Healthy'}
                    </text>
                  </g>

                  {/* Private ASG EC2 */}
                  <g transform="translate(285, 125)">
                    <rect x="0" y="0" width="70" height="50" rx="4" 
                      fill={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? 'var(--da-svg-red-bg)' : 'var(--da-bg)'} 
                      stroke={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? 'var(--da-svg-red-border)' : 'var(--da-card-border)'} strokeWidth="1.5" />
                    <text x="35" y="18" fill="var(--da-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Private ASG</text>
                    <text x="35" y="30" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">Compute Cluster</text>
                    <text x="35" y="41" fill={ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? 'var(--da-svg-red-text)' : 'var(--da-svg-green-text)'} fontSize="6" fontWeight="bold" textAnchor="middle">
                      {ddosTrafficState === 'attack' && ddosMitigation !== 'shield_advanced' ? '❌ 100% CPU' : '🟢 Healthy'}
                    </text>
                  </g>

                  {/* AWS Transit Gateway */}
                  <g transform="translate(285, 185)">
                    <rect x="0" y="0" width="70" height="28" rx="4" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1.2" />
                    <text x="35" y="16" fill="var(--da-svg-purple-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">Transit Gateway</text>
                  </g>

                  {/* 3. Corporate Data Center */}
                  {/* Corporate Data Center Host */}
                  <g transform="translate(385, 80)">
                    <rect x="0" y="0" width="130" height="35" rx="4" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1" />
                    <text x="65" y="16" fill="var(--da-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Corporate Data Center</text>
                    <text x="65" y="26" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">Customer Gateway</text>
                  </g>
                  {/* Transit endpoint DX/VPN */}
                  <g transform="translate(385, 185)">
                    <rect x="0" y="0" width="130" height="28" rx="4" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1" />
                    <text x="65" y="17" fill="var(--da-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Direct Connect (DX) / VPN</text>
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
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-text-muted)" />
                    </marker>
                  </defs>

                  {/* Flow pipeline */}
                  <path d="M 70 60 H 140" fill="none" stroke="var(--da-text-muted)" strokeWidth="1.5" className={scannerState === 'scanning' ? 'da-flow-blue' : ''} />
                  <path d="M 200 60 H 265" fill="none" stroke="var(--da-card-border)" strokeWidth="1.5" className={scannerState === 'alert' ? 'da-flow-rose' : ''} />

                  {/* Left: AWS Resources target */}
                  <g transform="translate(15, 35)">
                    <rect x="0" y="0" width="55" height="50" rx="6" fill="var(--da-code-bg)" stroke="var(--da-code-border)" strokeWidth="1.5" />
                    <text x="27.5" y="16" fill="var(--da-code-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Target</text>
                    <text x="27.5" y="27" fill="var(--da-code-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Resource</text>
                    <text x="27.5" y="38" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">EC2/S3/VPC</text>
                  </g>

                  {/* Center: Intelligent security scanner */}
                  <g transform="translate(140, 35)">
                    <rect x="0" y="0" width="60" height="50" rx="6" 
                      fill={scannerState === 'alert' ? 'var(--da-svg-red-bg)' : 'var(--da-bg)'} 
                      stroke={scannerState === 'alert' ? 'var(--da-svg-red-border)' : 'var(--da-card-border)'} 
                      strokeWidth="1.5" />
                    <text x="30" y="16" fill="var(--da-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Security</text>
                    <text x="30" y="25" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">Scanner</text>
                    <text x="30" y="36" fill={scannerState === 'alert' ? 'var(--da-svg-red-text)' : 'var(--da-svg-indigo-text)'} fontSize="6.5" fontWeight="extrabold" textAnchor="middle">
                      {scannerType === 'guardduty' ? 'GuardDuty' : scannerType === 'inspector' ? 'Inspector' : 'Macie'}
                    </text>
                  </g>

                  {/* Right: Security findings database */}
                  <g transform="translate(225, 35)">
                    <rect x="0" y="0" width="45" height="50" rx="6" 
                      fill={scannerState === 'alert' ? 'var(--da-svg-red-bg)' : 'var(--da-card-border)'} 
                      stroke={scannerState === 'alert' ? 'var(--da-svg-red-border)' : 'var(--da-card-border)'} 
                      strokeWidth="1.5" />
                    <text x="22.5" y="16" fill="var(--da-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">Alert</text>
                    <text x="22.5" y="27" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">Event</text>
                    <text x="22.5" y="38" fill="var(--da-text-muted)" fontSize="6" fontWeight="bold" textAnchor="middle">
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
          </>
        </Translate>
      )}

    </div>
  );
}
