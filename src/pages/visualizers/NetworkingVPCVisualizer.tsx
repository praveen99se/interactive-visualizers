import { useState, useEffect } from 'react';
import {
  Shield,
  Globe,
  Activity,
  Play,
  Terminal,
  Info,
  Layers,
  Wifi,
  AlertTriangle,
  BookOpen,
  Cpu,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Server,
  Network,
  DollarSign,
  Zap,
  Check,
  TrendingDown,
  ArrowRight
} from 'lucide-react';

type TabType = 'cidr' | 'pipelines' | 'security' | 'endpoints' | 'hybrid' | 'notebook' | 'pricing';

interface LogRow {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export default function NetworkingVPCVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');
  const [selectedNote, setSelectedNote] = useState<string>('public_private_ip');
  const [expandedCategory, setExpandedCategory] = useState<string>('core');

  // Interactive Learning center states
  const [bastionTargetMode, setBastionTargetMode] = useState<'single' | 'multi'>('single');
  const [bastionSimStep, setBastionSimStep] = useState<number>(0);
  const [bastionLogs, setBastionLogs] = useState<string[]>([]);
  
  const [natEgressMode, setNatEgressMode] = useState<'gateway' | 'instance'>('gateway');
  const [natSimStep, setNatSimStep] = useState<number>(0);
  const [natLogs, setNatLogs] = useState<string[]>([]);

  const [naclSimStep, setNaclSimStep] = useState<number>(0);
  const [naclReturnAllowed, setNaclReturnAllowed] = useState<boolean>(true);
  const [naclLogs, setNaclLogs] = useState<string[]>([]);

  // Category 5 Hybrid Interconnect Sim states
  const [tgwMeshMode, setTgwMeshMode] = useState<boolean>(true);
  const [cloudHubSimStep, setCloudHubSimStep] = useState<number>(0);
  const [mirrorEnabled, setMirrorEnabled] = useState<boolean>(false);
  const [dxLineActive, setDxLineActive] = useState<boolean>(true);

  // ==========================================
  // TAB 1 STATE: CIDR & SUBNET CALCULATOR
  // ==========================================
  const [vpcCidr, setVpcCidr] = useState<'10.0.0.0/16' | '172.16.0.0/12' | '192.168.0.0/16'>('10.0.0.0/16');
  const [subnetMaskSize, setSubnetMaskSize] = useState<number>(24);

  // ==========================================
  // TAB 2 STATE: INGRESS/EGRESS PIPELINES
  // ==========================================
  const [igwAttached, setIgwAttached] = useState<boolean>(true);
  const [natHaMode, setNatHaMode] = useState<'single' | 'dual_ha'>('single');
  const [bastionTunnel, setBastionTunnel] = useState<boolean>(false);
  const [pipelineLogs, setPipelineLogs] = useState<LogRow[]>([]);
  const [pipelineSimState, setPipelineSimState] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [pipelineFlowType, setPipelineFlowType] = useState<'none' | 'ssh_bastion' | 'ec2_egress' | 'az_failover'>('none');
  const [activeAz, setActiveAz] = useState<'az1' | 'az2'>('az1');

  // ==========================================
  // TAB 3 STATE: SG VS NACL & EPHEMERAL PORTS
  // ==========================================
  const [sgAllowHttp, setSgAllowHttp] = useState<boolean>(true);
  const [sgAllowSsh, setSgAllowSsh] = useState<boolean>(false);
  const [naclInboundHttp, setNaclInboundHttp] = useState<'allow' | 'deny'>('allow');
  const [naclOutboundEphemeral, setNaclOutboundEphemeral] = useState<'allow' | 'deny'>('allow');
  const [securityLogs, setSecurityLogs] = useState<LogRow[]>([]);
  const [securitySimState, setSecuritySimState] = useState<'idle' | 'animating' | 'passed' | 'blocked_nacl' | 'blocked_sg' | 'blocked_ephemeral'>('idle');
  const [securityTestPort, setSecurityTestPort] = useState<80 | 22>(80);
  const [animStep, setAnimStep] = useState<number>(0); // 0: Start, 1: NACL, 2: SG, 3: EC2 Host, 4: Return Outbound NACL

  // ==========================================
  // TAB 4 STATE: PEERING & ENDPOINTS
  // ==========================================
  const [peeringActive, setPeeringActive] = useState<boolean>(true);
  const [endpointType, setEndpointType] = useState<'none' | 'gateway' | 'interface'>('none');
  const [endpointLogs, setEndpointLogs] = useState<LogRow[]>([]);
  const [endpointSimState, setEndpointSimState] = useState<'idle' | 'running' | 'done'>('idle');
  const [peeringTestState, setPeeringTestState] = useState<'idle' | 'peered' | 'transitive_blocked'>('idle');

  // ==========================================
  // TAB 5 STATE: SITE-TO-SITE VPN & FLOW LOGS
  // ==========================================
  const [tunnelAActive, setTunnelAActive] = useState<boolean>(true);
  const [tunnelBActive, setTunnelBActive] = useState<boolean>(true);
  const [vpnSimState, setVpnSimState] = useState<'idle' | 'tunneling_a' | 'tunneling_b' | 'outage'>('idle');
  const [flowLogsEnabled, setFlowLogsEnabled] = useState<boolean>(false);
  const [vpnLogs, setVpnLogs] = useState<LogRow[]>([]);

  // ==========================================
  // TAB 7 STATE: COSTS, EGRESS, NAT vs ENDPOINT & FIREWALL
  // ==========================================
  const [costSource, setCostSource] = useState<'az1'>('az1');
  const [costDest, setCostDest] = useState<'az1_private' | 'az2_private' | 'az2_public' | 'region_diff' | 'internet'>('az2_private');
  const [costDataGb, setCostDataGb] = useState<number>(500);

  const [s3EgressRoute, setS3EgressRoute] = useState<'direct' | 'cloudfront' | 'accelerator' | 'crr'>('direct');
  const [s3DataGb, setS3DataGb] = useState<number>(1000);
  const [s3SimState, setS3SimState] = useState<'idle' | 'running' | 'done'>('idle');
  const [s3Logs, setS3Logs] = useState<LogRow[]>([]);

  const [natHours, setNatHours] = useState<number>(720);
  const [natDataGb, setNatDataGb] = useState<number>(2000);
  const [natChallengeSimState, setNatChallengeSimState] = useState<'idle' | 'running' | 'done'>('idle');
  const [natChallengeLogs, setNatChallengeLogs] = useState<LogRow[]>([]);

  const [firewallActive, setFirewallActive] = useState<boolean>(true);
  const [firewallRuleAction, setFirewallRuleAction] = useState<'allow' | 'drop' | 'alert'>('drop');
  const [firewallTrafficSource, setFirewallTrafficSource] = useState<'internet' | 'peering' | 'vpn' | 'directconnect'>('internet');
  const [firewallSimState, setFirewallSimState] = useState<'idle' | 'running' | 'done'>('idle');
  const [firewallLogs, setFirewallLogs] = useState<LogRow[]>([]);
  const [pricingSubTab, setPricingSubTab] = useState<'overview' | 'per_gb' | 's3_egress' | 'nat_vs_vpce' | 'firewall'>('overview');
  const [globalEgressVolume, setGlobalEgressVolume] = useState<number>(3000);
  const [overviewSimType, setOverviewSimType] = useState<'s3' | 'untrusted' | null>(null);
  const [overviewSimStep, setOverviewSimStep] = useState<number>(0);
  const [overviewSimStatus, setOverviewSimStatus] = useState<string>('idle');

  const startOverviewSimulation = (type: 's3' | 'untrusted') => {
    setOverviewSimType(type);
    setOverviewSimStep(1);
    setOverviewSimStatus('running');
    
    setTimeout(() => {
      setOverviewSimStep(2);
      setTimeout(() => {
        setOverviewSimStep(3);
        setTimeout(() => {
          setOverviewSimStep(4);
          setOverviewSimStatus('completed');
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const resetOverviewSimulation = () => {
    setOverviewSimType(null);
    setOverviewSimStep(0);
    setOverviewSimStatus('idle');
  };

  // ==========================================
  // TAB 1 LOGIC: CALCULATE IPS
  // ==========================================
  const calculateIps = () => {
    const totalIps = Math.pow(2, 32 - subnetMaskSize);
    const usableIps = subnetMaskSize <= 30 ? totalIps - 5 : 0; // 5 AWS Reserved
    let maskDotted = '';
    
    switch (subnetMaskSize) {
      case 24: maskDotted = '255.255.255.0'; break;
      case 25: maskDotted = '255.255.255.128'; break;
      case 26: maskDotted = '255.255.255.192'; break;
      case 27: maskDotted = '255.255.255.224'; break;
      case 28: maskDotted = '255.255.255.240'; break;
      default: maskDotted = '255.255.255.0';
    }

    const prefix = vpcCidr.split('.')[0] + '.' + vpcCidr.split('.')[1] + '.1';

    return {
      totalIps,
      usableIps,
      maskDotted,
      reserved: [
        { ip: `${prefix}.0`, type: 'Network Address', reason: 'Defines the base network boundary block.' },
        { ip: `${prefix}.1`, type: 'VPC Router Address', reason: 'Reserved by AWS for internal VPC subnet routing.' },
        { ip: `${prefix}.2`, type: 'Amazon Provided DNS', reason: 'Reserved for AWS Route 53 DNS resolver resolver engine mapping.' },
        { ip: `${prefix}.3`, type: 'Future Use / Reserved', reason: 'Allocated by AWS for future network expansion.' },
        { ip: `${prefix}.255`, type: 'Network Broadcast', reason: 'Network broadcast. Note: AWS does not support classical local broadcast.' }
      ]
    };
  };

  const ipStats = calculateIps();

  // ==========================================
  // TAB 2 SIMULATOR: HA PIPELINES
  // ==========================================
  const runPipelineSim = async (type: 'ssh_bastion' | 'ec2_egress' | 'az_failover') => {
    if (pipelineSimState === 'running') return;
    setPipelineSimState('running');
    setPipelineFlowType(type);
    setPipelineLogs([]);
    const timestamp = new Date().toLocaleTimeString();

    if (type === 'ssh_bastion') {
      setPipelineLogs(prev => [...prev, { timestamp, message: '🔑 [CLIENT] Initiating SSH request from developer terminal...', type: 'info' }]);
      await new Promise(r => setTimeout(r, 600));

      if (!igwAttached) {
        setPipelineLogs(prev => [
          ...prev,
          { timestamp, message: '🚨 [ROUTE FAILED] VPC Internet Gateway (IGW) is DETACHED! Ingress request dropped at VPC boundary.', type: 'error' },
          { timestamp, message: '💥 [ERROR] connection timed out. Host unreachable.', type: 'error' }
        ]);
        setPipelineSimState('failed');
        return;
      }

      setPipelineLogs(prev => [...prev, { timestamp, message: '🟢 [IGW APPROVED] Traffic traverses Internet Gateway down to Public Subnet.', type: 'success' }]);
      await new Promise(r => setTimeout(r, 700));

      if (!bastionTunnel) {
        setPipelineLogs(prev => [
          ...prev,
          { timestamp, message: '⚠️ [SSH BLOCKED] Bastion host is online, but Developer SSH key / tunnel is INACTIVE.', type: 'warn' },
          { timestamp, message: '🚨 [SECURITY DROP] Public ENI drops packet - Port 22 SSH handshake disallowed.', type: 'error' }
        ]);
        setPipelineSimState('failed');
        return;
      }

      setPipelineLogs(prev => [
        ...prev,
        { timestamp, message: '🔑 [BASTION AUTHENTICATED] SSH tunnel successfully established with Bastion (Public IP: 54.210.15.90).', type: 'success' },
        { timestamp, message: '↩️ [PORT FORWARDING] Bastion forwards SSH queries onto Private Instance target (Private IP: 10.0.1.15).', type: 'info' }
      ]);
      await new Promise(r => setTimeout(r, 800));

      setPipelineLogs(prev => [
        ...prev,
        { timestamp, message: '🟢 [PRIVATE ACCESS GRANTED] Multi-hop SSH terminal open! Developer successfully logged into Private AZ-1 EC2 cluster.', type: 'success' }
      ]);
      setPipelineSimState('success');

    } else if (type === 'ec2_egress') {
      setPipelineLogs(prev => [...prev, { timestamp, message: '📦 [EC2 INSTANCE] Private server requests software patch from external repository: apt-get update...', type: 'info' }]);
      await new Promise(r => setTimeout(r, 600));

      setPipelineLogs(prev => [...prev, { timestamp, message: '🔍 [ROUTING TABLE] Route entry 0.0.0.0/0 targets local NAT Gateway (nat-05a7bcde)...', type: 'info' }]);
      await new Promise(r => setTimeout(r, 600));

      if (activeAz === 'az2' && natHaMode === 'single') {
        setPipelineLogs(prev => [
          ...prev,
          { timestamp, message: '🚨 [ROUTING OUTAGE] Private AZ-2 instances lack local NAT. Single NAT Gateway is located in AZ-1 public subnet!', type: 'error' },
          { timestamp, message: '💥 [ERROR] Out-of-AZ network path unresolved. Egress request dropped.', type: 'error' }
        ]);
        setPipelineSimState('failed');
        return;
      }

      if (!igwAttached) {
        setPipelineLogs(prev => [
          ...prev,
          { timestamp, message: '🟢 [NAT TRANSLATED] NAT Gateway translates private IP (10.0.1.15) to Public EIP (52.8.91.4). Fowards to IGW...', type: 'success' },
          { timestamp, message: '🚨 [EGRESS DROPPED] Internet Gateway (IGW) is detached. Traffic cannot exit VPC to external subnets!', type: 'error' }
        ]);
        setPipelineSimState('failed');
        return;
      }

      setPipelineLogs(prev => [
        ...prev,
        { timestamp, message: '🟢 [NAT TRANSLATED] Source IP mapped to Public Elastic IP (52.8.91.4). Traffic forwarded to public Internet.', type: 'success' },
        { timestamp, message: '🟢 [EGRESS SUCCESS] Retrieved updates cleanly! NAT Gateway tracks connection state, allowing safe package responses back to Private EC2.', type: 'success' }
      ]);
      setPipelineSimState('success');

    } else {
      // az_failover
      setPipelineLogs(prev => [
        ...prev,
        { timestamp, message: '💥 [AZ-1 CRITICAL OUTAGE] Simulated physical zone fiber cut or primary power drop in Availability Zone 1!', type: 'warn' },
        { timestamp, message: '⚠️ AZ-1 primary NAT Gateway is completely OFFLINE.', type: 'warn' }
      ]);
      await new Promise(r => setTimeout(r, 800));

      if (natHaMode === 'single') {
        setPipelineLogs(prev => [
          ...prev,
          { timestamp, message: '🚨 [VPC CRIPPLED] Single NAT configuration detected. Since the single NAT Gateway resided in AZ-1, all private instances across the entire VPC (including AZ-2) lose internet egress capabilities!', type: 'error' },
          { timestamp, message: '💥 System status: DEGRADED. Failover unsuccessful.', type: 'error' }
        ]);
        setPipelineSimState('failed');
      } else {
        setPipelineLogs(prev => [
          ...prev,
          { timestamp, message: '🛡️ [HA FAILOVER TRIGGERED] Multi-AZ High Availability design active. Route tables automatically reference AZ-2 secondary NAT Gateway...', type: 'success' },
          { timestamp, message: '🟢 [COMPLIANT] AZ-2 Private Subnet instances dynamically fail over local routes, maintaining 100% active egress with zero packet loss.', type: 'success' },
          { timestamp, message: '🟢 System status: STABLE. High Availability architecture successfully absorbed critical zone drop.', type: 'success' }
        ]);
        setPipelineSimState('success');
      }
    }
  };

  // ==========================================
  // TAB 3 SIMULATOR: STATEFUL SG VS STATELESS NACL
  // ==========================================
  const runSecuritySim = async (port: 80 | 22) => {
    if (securitySimState === 'animating') return;
    setSecurityTestPort(port);
    setSecuritySimState('animating');
    setSecurityLogs([]);
    setAnimStep(0);
    const timestamp = new Date().toLocaleTimeString();

    // STEP 0: START
    setSecurityLogs(prev => [...prev, { timestamp, message: `🚀 [CLIENT] Dispatching TCP query to VPC endpoint on Port ${port}...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 600));

    // STEP 1: NACL INBOUND
    setAnimStep(1);
    setSecurityLogs(prev => [...prev, { timestamp, message: `🔒 [NACL INBOUND] Packet arrives at Subnet boundary. Evaluating rules sequentially starting at Rule 100...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 700));

    if (port === 80 && naclInboundHttp === 'deny') {
      setSecurityLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [NACL INBOUND BLOCKED] Rule 100 explicitly matched DENY for TCP Port 80 traffic! Packet dropped at subnet border.`, type: 'error' },
        { timestamp, message: `❌ [TRANSACTION BLOCKED] Stateless boundary refused inbound connection.`, type: 'error' }
      ]);
      setSecuritySimState('blocked_nacl');
      return;
    }

    if (port === 22) {
      setSecurityLogs(prev => [
        ...prev,
        { timestamp, message: `⚠️ [NACL INBOUND DROP] No explicit inbound allow rule for SSH Port 22 in NACL ruleset! Default Deny rule matched.`, type: 'error' },
        { timestamp, message: `❌ [TRANSACTION BLOCKED] Subnet border denied ingress.`, type: 'error' }
      ]);
      setSecuritySimState('blocked_nacl');
      return;
    }

    setSecurityLogs(prev => [...prev, { timestamp, message: `🟢 [NACL INBOUND ALLOWED] Rule 100 matched ALLOW. Traffic traverses subnet and targets EC2 Elastic Network Interface (ENI)...`, type: 'success' }]);
    await new Promise(r => setTimeout(r, 700));

    // STEP 2: SECURITY GROUP INBOUND
    setAnimStep(2);
    setSecurityLogs(prev => [...prev, { timestamp, message: `🛡️ [SG INBOUND] Packet reaches per-instance firewall. Checking allowed ingress filters...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 700));

    if ((port as number) === 80 && !sgAllowHttp) {
      setSecurityLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [SG INBOUND BLOCKED] Security Group rules do not contain an ALLOW rule for port 80. TCP connection dropped.`, type: 'error' },
        { timestamp, message: `❌ [TRANSACTION BLOCKED] Instance level ingress drop.`, type: 'error' }
      ]);
      setSecuritySimState('blocked_sg');
      return;
    }

    if ((port as number) === 22 && !sgAllowSsh) {
      setSecurityLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [SG INBOUND BLOCKED] Security Group SSH ingress rule is disabled. SSH connection request dropped.`, type: 'error' },
        { timestamp, message: `❌ [TRANSACTION BLOCKED] Instance level SSH dropped.`, type: 'error' }
      ]);
      setSecuritySimState('blocked_sg');
      return;
    }

    setSecurityLogs(prev => [...prev, { timestamp, message: `🟢 [SG INBOUND ALLOWED] Custom rule explicitly allows Port ${port}. Handing packet down to operating system...`, type: 'success' }]);
    await new Promise(r => setTimeout(r, 700));

    // STEP 3: EC2 HOST PROCESSING
    setAnimStep(3);
    setSecurityLogs(prev => [...prev, { timestamp, message: `💻 [EC2 INSTANCE] Request parsed by web daemon service on port ${port}. Packaging response data stream...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 700));

    setSecurityLogs(prev => [
      ...prev,
      { timestamp, message: `💡 [STATEFUL SG RULE] Security Group is STATEFUL! Outbound response is automatically permitted, completely bypassing any outbound Security Group rules.`, type: 'success' }
    ]);
    await new Promise(r => setTimeout(r, 700));

    // STEP 4: RETURN PATH (OUTBOUND NACL)
    setAnimStep(4);
    setSecurityLogs(prev => [
      ...prev,
      { timestamp, message: `🔒 [NACL OUTBOUND] Outbound response reaches Subnet border. Note: NACLs are stateless! Return traffic MUST be explicitly allowed.`, type: 'warn' },
      { timestamp, message: `💡 [EPHEMERAL RANGE] Client initiated requests assign return ports in the Ephemeral Port Range: 1024-65535.`, type: 'info' }
    ]);
    await new Promise(r => setTimeout(r, 800));

    if (naclOutboundEphemeral === 'deny') {
      setSecurityLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [NACL OUTBOUND BLOCKED] Outbound Rule 100 does not permit ephemeral return traffic! Packet dropped at subnet boundary.`, type: 'error' },
        { timestamp, message: `💥 [SECURITY FAIL] Request reached EC2 and was fully processed, but stateless return boundary blocked response back to client!`, type: 'error' }
      ]);
      setSecuritySimState('blocked_ephemeral');
      return;
    }

    setSecurityLogs(prev => [
      ...prev,
      { timestamp, message: `🟢 [NACL OUTBOUND ALLOWED] Outbound rule matched. Return packet dispatched through Ephemeral Range.`, type: 'success' },
      { timestamp, message: `🟢 [TRANSACTION COMPLETE] Success! Client successfully retrieved web payload on Port ${port}.`, type: 'success' }
    ]);
    setSecuritySimState('passed');
  };

  // ==========================================
  // TAB 4 STATE: PEERING & ENDPOINTS
  // ==========================================
  const runEndpointSim = async () => {
    if (endpointSimState === 'running') return;
    setEndpointSimState('running');
    setEndpointLogs([]);
    const timestamp = new Date().toLocaleTimeString();

    if (endpointType === 'none') {
      setEndpointLogs(prev => [
        ...prev,
        { timestamp, message: '🌐 [INTERNET PATHWAY] Request targeting S3 or KMS APIs is dispatched over public fibers...', type: 'info' },
        { timestamp, message: '📡 [OUTBOUND IGW] Packet routes through Internet Gateway -> Public internet DNS records resolve -> AWS public API boundary.', type: 'info' },
        { timestamp, message: '⚠️ [SECURITY RISK] Traffic leaves private network boundary, routing over public IP space (though SSL/TLS encrypted). Subject to data processing transit charges.', type: 'warn' },
        { timestamp, message: '🟢 S3 action completed via public route.', type: 'success' }
      ]);
      setEndpointSimState('done');
      return;
    }

    if (endpointType === 'gateway') {
      setEndpointLogs(prev => [
        ...prev,
        { timestamp, message: '🪣 [GATEWAY ENDPOINT] S3 transaction detected: Target is s3.amazonaws.com in region.', type: 'info' },
        { timestamp, message: '🔍 [ROUTE MATCHED] VPC Routing Table matched Prefix List "pl-63a54b12 (com.amazonaws.us-east-1.s3)"', type: 'info' },
        { timestamp, message: '🛡️ [AWS FIBER ROUTING] Routing table maps next-hop directly to Gateway Endpoint (vpce-05a8b7c6d5). Request completely bypasses the internet!', type: 'success' },
        { timestamp, message: '💡 [ARCHITECTURE BONUS] Gateway Endpoints are completely free and bypass NAT Data Processing fees!', type: 'success' },
        { timestamp, message: '🟢 [SUCCESS] Secure object written privately inside internal AWS network backplane.', type: 'success' }
      ]);
      setEndpointSimState('done');
      return;
    }

    // interface type
    setEndpointLogs(prev => [
      ...prev,
      { timestamp, message: '🔑 [INTERFACE ENDPOINT] KMS Decrypt/Encrypt action initiated inside private subnet.', type: 'info' },
      { timestamp, message: '📡 [DNS PRIVATE RESOLUTION] Private DNS intercepts com.amazonaws.us-east-1.kms. Resolves endpoint local VPC IP: 10.0.1.99.', type: 'info' },
      { timestamp, message: '🛡️ [PRIVATELINK ENI] Packet hits dedicated Elastic Network Interface (ENI) mounted within subnet host bounds.', type: 'success' },
      { timestamp, message: '🔒 [KMS PRIVATE CONNECT] Traffic flows securely via PrivateLink fibers to regional KMS pools without NAT exposure.', type: 'success' },
      { timestamp, message: '🟢 [SUCCESS] Payload decrypted wholly privately inside local subnet boundaries.', type: 'success' }
    ]);
    setEndpointSimState('done');
  };

  const testPeeringTransitive = () => {
    setPeeringTestState('idle');
    if (!peeringActive) {
      setPeeringTestState('idle');
      return;
    }
    // Simulate non-transitive block
    setPeeringTestState('transitive_blocked');
  };

  // ==========================================
  // TAB 5 STATE: SITE-TO-SITE VPN & FLOW LOGS
  // ==========================================
  const toggleFlowLogs = () => {
    setFlowLogsEnabled(!flowLogsEnabled);
    if (!flowLogsEnabled) {
      const timestamp = new Date().toLocaleTimeString();
      setVpnLogs(prev => [
        ...prev,
        { timestamp, message: '🟢 VPC Flow Logs tracking enabled on primary Subnet Elastic Network Interfaces.', type: 'success' },
        { timestamp, message: '📊 Capturing ENI packet metadata... writing logs streams to CloudWatch...', type: 'info' }
      ]);
    }
  };

  const triggerVpnTraffic = async () => {
    setVpnSimState('idle');
    const timestamp = new Date().toLocaleTimeString();

    if (!tunnelAActive && !tunnelBActive) {
      setVpnSimState('outage');
      setVpnLogs(prev => [
        ...prev,
        { timestamp, message: '🚨 [VPN OUTAGE] Both redundant IPsec tunnels are completely OFFLINE!', type: 'error' },
        { timestamp, message: '💥 [ERROR] Virtual Private Gateway (VGW) lost connectivity to corporate Customer Gateway (CGW). Out-of-premises routes fail.', type: 'error' }
      ]);
      return;
    }

    if (tunnelAActive) {
      setVpnSimState('tunneling_a');
      setVpnLogs(prev => [
        ...prev,
        { timestamp, message: '📡 [TRAFFIC TUNNEL A] Packet dispatched from EC2 local node (10.0.1.15) bound for Corporate Data Center IP (192.168.10.45)...', type: 'info' },
        { timestamp, message: '🔒 [IPsec TUNNEL A] VGW wraps packet in IPsec ESP shell and routes over primary tunnel interface.', type: 'success' }
      ]);
      await new Promise(r => setTimeout(r, 600));

      if (flowLogsEnabled) {
        setVpnLogs(prev => [
          ...prev,
          { timestamp, message: `📊 [FLOW LOG] eni-05a8b7c6 10.0.1.15 192.168.10.45 443 62145 6 12 768 ACCEPT OK`, type: 'info' }
        ]);
      }
      setVpnLogs(prev => [...prev, { timestamp, message: '🟢 [CGW DELIVERED] Corporate Customer Gateway successfully decrypted payload. SSH/HTTP transaction complete.', type: 'success' }]);
    } else {
      setVpnSimState('tunneling_b');
      setVpnLogs(prev => [
        ...prev,
        { timestamp, message: '⚠️ [ROUTING UPDATE] Primary Tunnel A is down! BGP path prepend updates route preference...', type: 'warn' },
        { timestamp, message: '📡 [TRAFFIC TUNNEL B] Traffic dynamically routes through backup secondary Tunnel B (IPsec Active).', type: 'info' }
      ]);
      await new Promise(r => setTimeout(r, 600));

      if (flowLogsEnabled) {
        setVpnLogs(prev => [
          ...prev,
          { timestamp, message: `📊 [FLOW LOG] eni-05a8b7c6 10.0.1.15 192.168.10.45 443 62145 6 12 768 ACCEPT OK`, type: 'info' }
        ]);
      }
      setVpnLogs(prev => [...prev, { timestamp, message: '🟢 [CGW DELIVERED] Backup Tunnel B successfully processed and delivered package to on-premises host.', type: 'success' }]);
    }
  };

  // Trigger test logs on flow logs active
  useEffect(() => {
    if (!flowLogsEnabled) return;
    const interval = setInterval(() => {
      const timestamp = new Date().toLocaleTimeString();
      const mockLogs = [
        { message: '📊 [FLOW LOG] eni-05a8b7c6 198.51.100.44 10.0.1.15 22 51433 6 20 1280 REJECT OK (Port 22 scanner blocked by security group rules)', type: 'warn' },
        { message: '📊 [FLOW LOG] eni-05a8b7c6 10.0.1.15 8.8.8.8 53 49152 17 1 64 ACCEPT OK (DNS Resolve query successful via Route 53)', type: 'info' },
        { message: '📊 [FLOW LOG] eni-05a8b7c6 10.0.1.99 10.0.1.15 443 50232 6 8 512 ACCEPT OK (PrivateLink local KMS API transaction call)', type: 'success' }
      ];
      const selected = mockLogs[Math.floor(Math.random() * mockLogs.length)];
      setVpnLogs(prev => [...prev, { timestamp, message: selected.message, type: selected.type as any }]);
    }, 4500);
    return () => clearInterval(interval);
  }, [flowLogsEnabled]);

  const runBastionStepSim = async () => {
    setBastionSimStep(0);
    setBastionLogs([]);
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    
    setBastionSimStep(1);
    setBastionLogs(prev => [...prev, '🔍 [SSH INITIATED] Dispatching connection request from Client Terminal to Public IP on Port 22...']);
    await sleep(700);

    setBastionSimStep(2);
    setBastionLogs(prev => [...prev, '🌐 [INTERNET GATEWAY] Traffic traverses AWS edge. Internet Gateway (IGW) permits inbound flow to public subnet.']);
    await sleep(700);

    setBastionSimStep(3);
    setBastionLogs(prev => [...prev, '🛡️ [BASTION SECURITY GROUP] Bastion ENI evaluates ingress rules. Security Group ALLOWS Port 22 from Restricted Corporate CIDR.']);
    await sleep(700);

    setBastionSimStep(4);
    setBastionLogs(prev => [...prev, '🔑 [BASTION SSH TUNNEL] Key handshake complete! Developer successfully authenticated on Bastion Host.']);
    await sleep(700);

    setBastionSimStep(5);
    setBastionLogs(prev => [...prev, `↩️ [MULTI-HOP TUNNEL] Bastion initiates private hop to Private Subnet EC2 ${bastionTargetMode === 'multi' ? 'instances (Target Group A/B/C)' : 'instance (Target A)'}.`]);
    await sleep(700);

    setBastionSimStep(6);
    setBastionLogs(prev => [...prev, `🟢 [SESSION SECURED] Target EC2 SG validates ingress source. Allowed! Secure shell established over private AWS backplane.`]);
  };

  const runNatStepSim = async () => {
    setNatSimStep(0);
    setNatLogs([]);
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    setNatSimStep(1);
    setNatLogs(prev => [...prev, '💻 [PRIVATE SERVER] EC2 instance triggers outbound egress request: yum update -y']);
    await sleep(750);

    setNatSimStep(2);
    setNatLogs(prev => [...prev, `🔍 [ROUTE RESOLUTION] Subnet Route Table maps route 0.0.0.0/0 directly to local ${natEgressMode === 'gateway' ? 'NAT Gateway (nat-0987654)' : 'outdated NAT Instance (i-0123456)'}.`]);
    await sleep(750);

    setNatSimStep(3);
    if (natEgressMode === 'gateway') {
      setNatLogs(prev => [...prev, '📡 [NAT GATEWAY PROCESSING] Automated routing appliance intercepts packet. Translates private IP (10.0.2.80) to Elastic Public IP (54.80.20.10) with ZERO Security Groups to manage!']);
    } else {
      setNatLogs(prev => [
        ...prev, 
        '⚠️ [NAT INSTANCE BOTTLENECK] Packet traverses standard EC2 instance running NAT AMI. WARNING: Must manually disable source/destination check! Subject to CPU/network bottlenecks under heavy load.'
      ]);
    }
    await sleep(750);

    setNatSimStep(4);
    setNatLogs(prev => [...prev, `🟢 [EGRESS SUCCESS] Egress traffic routed safely through Internet Gateway. Returns are tracked statefully back to the Private EC2.`]);
  };

  const runNaclStepSim = async () => {
    setNaclSimStep(0);
    setNaclLogs([]);
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    setNaclSimStep(1);
    setNaclLogs(prev => [...prev, '🚀 [CLIENT HTTP QUERY] External user requests webpage payload from EC2 over TCP Port 80.']);
    await sleep(750);

    setNaclSimStep(2);
    setNaclLogs(prev => [...prev, '🔒 [NACL INGRESS EVALUATION] Subnet border: Rule 100 explicitly permits Port 80 ingress. Traffic passes border.']);
    await sleep(750);

    setNaclSimStep(3);
    setNaclLogs(prev => [...prev, '🛡️ [SG INBOUND CHECK] EC2 Instance ENI: Security Group evaluates inbound rule and ALLOWS TCP Port 80. Handing payload to OS daemon.']);
    await sleep(750);

    setNaclSimStep(4);
    setNaclLogs(prev => [...prev, '💻 [STATEFUL SG RETURN BYPASS] Web daemon builds HTTP response. SG is STATEFUL: Outbound check is automatically bypassed! Packet traverses to subnet border.']);
    await sleep(750);

    setNaclSimStep(5);
    if (naclReturnAllowed) {
      setNaclLogs(prev => [
        ...prev, 
        '🔒 [NACL OUTBOUND PERMITTED] Subnet border: NACL is STATELESS! Outbound rule matches Ephemeral port range 1024-65535, ALLOWING return traffic back to client.',
        '🟢 [SUCCESS] HTTP page returned! Transaction completed successfully.'
      ]);
    } else {
      setNaclLogs(prev => [
        ...prev,
        '🚨 [NACL OUTBOUND BLOCKED] Subnet border: NACL is STATELESS! Return traffic targets client Ephemeral ports (e.g. 52331) which are BLOCKED in outbound NACL ruleset.',
        '💥 [TRANSACTION FAILURE] Packet dropped at stateless subnet border! Browser gets connection timeout.'
      ]);
    }
  };

  const runCloudHubStepSim = async () => {
    setCloudHubSimStep(0);
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    setCloudHubSimStep(1); // packet from Branch A to VGW Hub
    await sleep(800);
    setCloudHubSimStep(2); // VGW Hub routes packet to Branch B & Branch C spokes
    await sleep(800);
    setCloudHubSimStep(3); // complete
    await sleep(800);
    setCloudHubSimStep(0);
  };

  // ==========================================
  // TAB 7 ACTIONS: COSTS, EGRESS, NAT vs ENDPOINT & FIREWALL
  // ==========================================

  const runS3EgressSim = async () => {
    if (s3SimState === 'running') return;
    setS3SimState('running');
    setS3Logs([]);
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    const timestamp = new Date().toLocaleTimeString();

    setS3Logs(prev => [...prev, { timestamp, message: `🪣 [S3 INGRESS check] Testing Ingress flow of ${s3DataGb} GB...`, type: 'info' }]);
    await sleep(500);
    setS3Logs(prev => [...prev, { timestamp, message: `🟢 [FREE INGRESS] S3 Data Ingress (upload) is completely FREE ($0.00/GB)!`, type: 'success' }]);
    await sleep(500);

    setS3Logs(prev => [...prev, { timestamp, message: `📡 [EVALUATING ROUTE] Testing S3 Egress flow route: ${s3EgressRoute.toUpperCase()}...`, type: 'info' }]);
    await sleep(600);

    let rate = 0;
    let routeDesc = '';

    if (s3EgressRoute === 'direct') {
      rate = 0.09;
      routeDesc = 'S3 Direct Egress to Public Internet';
      setS3Logs(prev => [
        ...prev,
        { timestamp, message: `🚨 [HIGH EGRESS BILL] Traffic exits S3 directly through IGW to public client. Cost is $0.09 per GB.`, type: 'error' }
      ]);
    } else if (s3EgressRoute === 'cloudfront') {
      rate = 0.085;
      routeDesc = 'S3 to CloudFront (Free) -> CloudFront to Internet';
      setS3Logs(prev => [
        ...prev,
        { timestamp, message: `🟢 [OPTIMIZED] S3 to CloudFront transfer is $0.00/GB. CloudFront to Internet is only $0.085/GB.`, type: 'success' },
        { timestamp, message: `💡 [ARCHITECT SECRET] Using CloudFront caches files at Edge PoPs, lowering latency and providing request pricing that is up to 7x cheaper!`, type: 'success' }
      ]);
    } else if (s3EgressRoute === 'accelerator') {
      rate = 0.09 + 0.04; // standard egress + premium acceleration
      routeDesc = 'S3 Transfer Acceleration (Ingress/Egress Optimized)';
      setS3Logs(prev => [
        ...prev,
        { timestamp, message: `⚡ [PREMIUM ACCELERATION] Speed improved by 50% to 500% via regional Edge PoPs. Premium surcharge of +$0.04/GB applies on top of standard egress.`, type: 'warn' }
      ]);
    } else {
      rate = 0.02;
      routeDesc = 'S3 Cross-Region Replication (CRR) to secondary region';
      setS3Logs(prev => [
        ...prev,
        { timestamp, message: `🔄 [DISASTER RECOVERY] Replicating objects cross-region for multi-region resilience. Priced at $0.02 per GB.`, type: 'warn' }
      ]);
    }

    const totalCost = s3DataGb * rate;
    await sleep(600);

    setS3Logs(prev => [
      ...prev,
      { timestamp, message: `🟢 [COMPLETED] Route: ${routeDesc}. Total Egress cost: $${totalCost.toFixed(2)} USD for ${s3DataGb} GB.`, type: 'success' }
    ]);

    setS3SimState('done');
  };

  const runNatChallengeSim = async () => {
    if (natChallengeSimState === 'running') return;
    setNatChallengeSimState('running');
    setNatChallengeLogs([]);
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    const timestamp = new Date().toLocaleTimeString();

    setNatChallengeLogs(prev => [...prev, { timestamp, message: `🔍 [CALCULATING SCENARIO] Daily egress data volume to S3: ${natDataGb} GB. Running hours: ${natHours} hours/month.`, type: 'info' }]);
    await sleep(600);

    // NAT path
    const natHourlyCharge = natHours * 0.045; // $0.045/hour
    const natProcessingCharge = natDataGb * 0.045; // $0.045/GB data processed
    const totalNatCost = natHourlyCharge + natProcessingCharge;

    // VPC Endpoint path
    const vpceHourlyCharge = 0.00; // 100% free
    const vpceProcessingCharge = 0.00; // 100% free
    const totalVpceCost = 0.00;

    const netSavings = totalNatCost - totalVpceCost;

    setNatChallengeLogs(prev => [
      ...prev,
      { timestamp, message: `💻 [PATH 1: NAT GATEWAY] Hourly: $${natHourlyCharge.toFixed(2)} ($0.045/hr) | Processing: $${natProcessingCharge.toFixed(2)} ($0.045/GB) -> Total Monthly: $${totalNatCost.toFixed(2)} USD.`, type: 'error' },
      { timestamp, message: `🟢 [PATH 2: S3 GATEWAY ENDPOINT] Hourly: $${vpceHourlyCharge.toFixed(2)} (FREE) | Processing: $${vpceProcessingCharge.toFixed(2)} (FREE) -> Total Monthly: $${totalVpceCost.toFixed(2)} USD!`, type: 'success' }
    ]);
    await sleep(800);

    setNatChallengeLogs(prev => [
      ...prev,
      { timestamp, message: `🏆 [CHALLENGE WINNER] Gateway VPC Endpoint saves you $${netSavings.toFixed(2)} USD/month! 100% private route with zero internet exposure.`, type: 'success' },
      { timestamp, message: `💡 [ROUTE TABLE AUDIT] Routing rules modify local route tables (pl-id) to send S3 queries directly through vpce-id rather than nat-gw-id.`, type: 'info' }
    ]);

    setNatChallengeSimState('done');
  };

  const runFirewallSim = async () => {
    if (firewallSimState === 'running') return;
    setFirewallSimState('running');
    setFirewallLogs([]);
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
    const timestamp = new Date().toLocaleTimeString();

    setFirewallLogs(prev => [...prev, { timestamp, message: `🛡️ [FIREWALL ACTIVE] VPC wrapped inside AWS Network Firewall Shield boundary.`, type: 'success' }]);
    await sleep(500);

    setFirewallLogs(prev => [...prev, { timestamp, message: `📡 [INCOMING FLOW] Intercepting traffic from ${firewallTrafficSource.toUpperCase()} source...`, type: 'info' }]);
    await sleep(600);

    setFirewallLogs(prev => [
      ...prev,
      { timestamp, message: `🔍 [DEEP PACKET INSPECTION] Evaluating threat signatures L3 to L7. Running protocol validation filters...`, type: 'info' }
    ]);
    await sleep(800);

    if (firewallRuleAction === 'allow') {
      setFirewallLogs(prev => [
        ...prev,
        { timestamp, message: `🟢 [PASSED] Traffic matched explicit ALLOW rule. Header signature verified. Packet routed to target subnet.`, type: 'success' },
        { timestamp, message: `📊 [LOGGING SUCCESS] Sent flow record ACCEPT to destination S3/CloudWatch group logs.`, type: 'info' }
      ]);
    } else if (firewallRuleAction === 'drop') {
      setFirewallLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [BLOCKED & DROPPED] Network Firewall matched signature DROP rule! Blocked malicious protocol payload immediately at VPC boundary.`, type: 'error' },
        { timestamp, message: `📊 [LOGGING ALARM] Alert dispatched to SOC team. Event log stored securely in S3 audit vault.`, type: 'warn' }
      ]);
    } else {
      setFirewallLogs(prev => [
        ...prev,
        { timestamp, message: `⚠️ [ALERT TRIGGERED] Packet allowed through but flagged. Suspected TCP port scanning signature detected.`, type: 'warn' },
        { timestamp, message: `📊 [LOGGING INCIDENT] Captured threat PCAP metadata. Dispatched to Kinesis Firehose analytics stream.`, type: 'info' }
      ]);
    }

    setFirewallSimState('done');
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
        .da-flow-orange {
          stroke: #f59e0b;
          stroke-dasharray: 6,4;
          animation: flowDash 0.8s linear infinite;
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
        
        .packet-pulse {
          animation: runPacket 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        @keyframes runPacket {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -40; }
        }

        /* Modern Architect Learning Center styles */
        .da-edu-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .da-edu-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px -8px rgba(59, 130, 246, 0.12);
          border-color: #bfdbfe;
        }
        .da-glow-border-active {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.15) !important;
        }
        .da-modern-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12.5px;
          line-height: 1.5;
        }
        .da-modern-table th {
          background: #f8fafc;
          color: #475569;
          font-weight: 700;
          text-align: left;
          padding: 12px 16px;
          border-bottom: 1.5px solid #e2e8f0;
        }
        .da-modern-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
        }
        .da-modern-table tr:hover td {
          background: #f8fafc;
        }
        .da-badge-cyan {
          background: #ecfeff;
          border: 1px solid #c5f6fa;
          color: #0891b2;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .da-badge-emerald {
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          color: #059669;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .da-badge-rose {
          background: #fff5f5;
          border: 1px solid #fed7d7;
          color: #e53e3e;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .da-badge-amber {
          background: #fffbeb;
          border: 1px solid #fef3c7;
          color: #d97706;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .da-sim-node-active {
          animation: pulseGlow 1.5s infinite alternate;
        }
        @keyframes pulseGlow {
          from {
            filter: drop-shadow(0 0 2px rgba(59, 130, 246, 0.4));
          }
          to {
            filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.8));
          }
        }
        .da-flow-fast {
          stroke-dasharray: 6,4;
          animation: flowDash 0.5s linear infinite !important;
        }
        
        /* Premium Academy Directory Styles */
        .acad-dir-container {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .acad-dir-header {
          background: #0f172a;
          color: #f8fafc;
          padding: 16px;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .acad-dir-folder-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          font-size: 10px;
          font-weight: 850;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
        }
        .acad-dir-folder-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
        }
        .acad-dir-item-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          border-left: 3px solid transparent;
          background: #ffffff;
          transition: all 0.15s ease;
          text-align: left;
        }
        .acad-dir-item-btn:hover {
          background: #f8fafc;
          color: #2563eb;
          border-left-color: #cbd5e1;
        }
        .acad-dir-item-btn.acad-active {
          background: #eff6ff;
          color: #1d4ed8;
          border-left-color: #2563eb;
          font-weight: 800;
        }
        .acad-detail-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.06);
        }
        .acad-hero-badge {
          background: #ecfdf5;
          border: 1.5px solid #a7f3d0;
          color: #065f46;
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
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-left: 4px solid #2563eb;
          border-radius: 12px;
          padding: 18px;
          font-size: 12px;
          line-height: 1.6;
          color: #475569;
          font-weight: 600;
        }
        .acad-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .acad-table th {
          background: #f8fafc;
          color: #334155;
          font-weight: 800;
          padding: 12px 14px;
          border-bottom: 1.5px solid #e2e8f0;
          text-align: left;
        }
        .acad-table td {
          padding: 12px 14px;
          border-bottom: 1px solid #f1f5f9;
          color: #475569;
        }
        .acad-table tr:last-child td {
          border-bottom: none;
        }
        .acad-sim-diagram {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 16px;
          padding: 18px;
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02);
          position: relative;
        }
        .acad-terminal {
          background: #090d16;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 14px;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          color: #cbd5e1;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
        }
        .animate-dash {
          stroke-dasharray: 6, 6;
          animation: overviewDash 1s linear infinite;
        }
        @keyframes overviewDash {
          to { stroke-dashoffset: -20; }
        }
        .animate-fade-in {
          animation: overviewFadeIn 0.3s ease-out forwards;
        }
        @keyframes overviewFadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Centralized Dark Mode Overrides for NetworkingVPCVisualizer.tsx */
        .dark .da-container {
          background: #020617 !important;
          color: #f8fafc !important;
        }
        .dark .da-card,
        .dark [class*="da-card"] {
          background: rgba(15, 23, 42, 0.75) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }
        .dark .da-card b,
        .dark .da-card strong,
        .dark .da-card h3,
        .dark .da-card h4 {
          color: #ffffff !important;
        }
        .dark .da-tabs {
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .da-tb {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #94a3b8 !important;
        }
        .dark .da-tb:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #f8fafc !important;
        }
        .dark .da-sec,
        .dark .da-kk {
          color: #94a3b8 !important;
        }
        .dark .da-log,
        .dark .da-terminal {
          background: #020617 !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #38bdf8 !important;
        }
        .dark .da-btn {
          background: rgba(15, 23, 42, 0.8) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .da-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
        }
        .dark .da-met {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark ul.da-ck li {
          color: #cbd5e1 !important;
        }
        .dark .da-inst,
        .dark .da-instance {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .da-inst .meta,
        .dark .da-instance .meta {
          color: #94a3b8 !important;
        }
        .dark .da-svg-bg {
          background-color: #020617 !important;
          background-image: radial-gradient(rgba(51, 65, 85, 0.5) 1.2px, transparent 1.2px) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        
        /* Node Status Overrides */
        .dark .da-ok {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: #4ade80 !important;
        }
        .dark .da-warm {
          border-color: #f59e0b !important;
          background: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
        }
        .dark .da-drain {
          border-color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }
        .dark .da-down {
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
              `}</style>

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 mb-6 text-left">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <Globe className="w-6 h-6 stroke-[2]" />
          </span>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              AWS Networking &amp; VPC Sandbox
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                PRO EDITION
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Master VPC subnets calculators, Internet Gateways routing, stateful SGs vs stateless NACLs, VPC PrivateLink endpoints, and redundant IPSec VPN tunnels.</p>
          </div>
        </div>
      </div>

      {/* Tab navigation bar */}
      <div className="da-tabs">
        <button className={`da-tb ${activeTab === 'notebook' ? 'da-on' : ''}`} onClick={() => setActiveTab('notebook')}>
          <BookOpen className="w-4 h-4" /> 📓 Visual Architect Notes
        </button>
        <button className={`da-tb ${activeTab === 'cidr' ? 'da-on' : ''}`} onClick={() => setActiveTab('cidr')}>
          <Info className="w-4 h-4" /> 1. CIDR &amp; Subnet Calculator
        </button>
        <button className={`da-tb ${activeTab === 'pipelines' ? 'da-on' : ''}`} onClick={() => setActiveTab('pipelines')}>
          <Activity className="w-4 h-4" /> 2. Ingress &amp; HA Egress Pipelines
        </button>
        <button className={`da-tb ${activeTab === 'security' ? 'da-on' : ''}`} onClick={() => setActiveTab('security')}>
          <Shield className="w-4 h-4" /> 3. Stateful SG vs Stateless NACL
        </button>
        <button className={`da-tb ${activeTab === 'endpoints' ? 'da-on' : ''}`} onClick={() => setActiveTab('endpoints')}>
          <Layers className="w-4 h-4" /> 4. VPC Peering &amp; Endpoints
        </button>
        <button className={`da-tb ${activeTab === 'hybrid' ? 'da-on' : ''}`} onClick={() => setActiveTab('hybrid')}>
          <Wifi className="w-4 h-4" /> 5. Redundant VPN &amp; Flow Logs
        </button>
        <button className={`da-tb ${activeTab === 'pricing' ? 'da-on' : ''}`} onClick={() => setActiveTab('pricing')}>
          <DollarSign className="w-4 h-4" /> 6. Egress &amp; Firewall Optimizer
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CIDR & SUBNET CALCULATOR                                           */}
      {/* ========================================================================= */}
      {activeTab === 'cidr' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Info className="w-5 h-5" /> VPC IP Architecture &amp; Dotted Quad Subnetting
            </h2>
            <p className="da-card-desc">
              AWS Virtual Private Cloud (VPC) provides private logical network boundaries utilizing classless CIDR allocation blocks. Under standard IPv4 subnet calculations, AWS explicitly reserves <strong>5 IP Addresses</strong> in every subnet for infrastructure routing operations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Input Selection sidebar */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between space-y-4 font-semibold">
              <div className="space-y-4">
                
                {/* VPC base block */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">1. Base VPC IP CIDR Block:</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                    <button
                      onClick={() => setVpcCidr('10.0.0.0/16')}
                      className={`flex-1 py-1.5 rounded-md font-bold transition-all ${vpcCidr === '10.0.0.0/16' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      10.0.0.0/16
                    </button>
                    <button
                      onClick={() => setVpcCidr('172.16.0.0/12')}
                      className={`flex-1 py-1.5 rounded-md font-bold transition-all ${vpcCidr === '172.16.0.0/12' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      172.16.0.0/12
                    </button>
                    <button
                      onClick={() => setVpcCidr('192.168.0.0/16')}
                      className={`flex-1 py-1.5 rounded-md font-bold transition-all ${vpcCidr === '192.168.0.0/16' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      192.168.0.0/16
                    </button>
                  </div>
                </div>

                {/* Subnet Mask slider */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-extrabold text-slate-850">2. Target Subnet Size (Mask):</span>
                    <span className="bg-blue-100 text-blue-800 font-extrabold text-xs px-2 py-0.5 rounded">
                      /{subnetMaskSize}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="24"
                    max="28"
                    step="1"
                    value={subnetMaskSize}
                    onChange={(e) => setSubnetMaskSize(parseInt(e.target.value))}
                    className="w-full accent-da-blue cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 mt-1 font-bold">
                    <span>/24 (Large Subnet)</span>
                    <span>/26</span>
                    <span>/28 (Tiny Subnet)</span>
                  </div>
                </div>

                {/* Theoretical Details */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] leading-relaxed text-slate-650 font-medium">
                  <span className="font-extrabold text-slate-800 block mb-1">Subnet Sizing Guidelines:</span>
                  "AWS subnets must fall within boundary limits between <span className="font-bold">/16</span> (65,536 IPs) and <span className="font-bold">/28</span> (16 IPs). Larger subnets prevent IP exhaustion under auto-scaling clusters, whereas tiny blocks are ideal for isolated interface routes."
                </div>

              </div>

              {/* Dynamic calculations values */}
              <div className="border-t border-slate-100 pt-4 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Dotted Netmask:</span>
                  <span className="font-extrabold text-slate-800">{ipStats.maskDotted}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Total Allocated IPs:</span>
                  <span className="font-extrabold text-slate-800">{ipStats.totalIps}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 text-rose-600 font-bold">AWS Reserved IPs:</span>
                  <span className="font-extrabold text-rose-600">5 Addresses</span>
                </div>
                <div className="flex justify-between text-sm border-t border-dashed border-slate-100 pt-2 font-black">
                  <span className="text-blue-700">Usable Hosts Count:</span>
                  <span className="text-blue-800 font-extrabold">{ipStats.usableIps} IPs</span>
                </div>
              </div>

            </div>

            {/* Calculations display */}
            <div className="da-card lg:col-span-7 text-left space-y-4">
              <span className="da-card-title text-slate-850">
                <Layers className="w-5 h-5 text-blue-500" /> AWS 5 Reserved IPs Breakdown
              </span>
              <p className="da-card-desc">
                In classic networking, only 2 addresses are reserved (Network and Broadcast). AWS reserves an additional 3 addresses inside every subnet boundary for DNS and Gateway routing resolution.
              </p>

              <div className="space-y-2.5">
                {ipStats.reserved.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-slate-150 rounded-xl bg-slate-50 hover:bg-white hover:shadow-sm transition-all text-xs">
                    <div>
                      <span className="font-black text-rose-600 block sm:inline mr-2">{item.ip}</span>
                      <span className="bg-rose-50 border border-rose-200 text-rose-700 font-extrabold px-2 py-0.5 rounded text-[10px]">
                        {item.type}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px] mt-1 sm:mt-0 max-w-xs leading-normal font-semibold">
                      {item.reason}
                    </span>
                  </div>
                ))}
              </div>

               {/* Graphical host representation map */}
              <div className="bg-blue-50 border border-blue-150 rounded-2xl p-5 mt-4 relative overflow-hidden text-left">
                <span className="text-xs font-black text-blue-900 block mb-2">Visual Subnet Allocations &amp; IP boundary Map</span>
                
                <div className="w-full flex justify-center py-2 bg-white rounded-xl border border-blue-200">
                  <svg className="w-full max-w-[480px] h-[180px]" viewBox="0 0 480 180">
                    {/* Subnet Bounding Box */}
                    <rect x="15" y="10" width="450" height="160" rx="8" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="4,2" />
                    <text x="25" y="24" fill="#1e3a8a" fontSize="7.5" fontWeight="black">SUBNET BLOCK: {vpcCidr.split('/')[0].slice(0,-1)}1.0/{subnetMaskSize}</text>

                    {/* Left: 5 AWS Reserved IPs Section */}
                    <rect x="25" y="32" width="200" height="128" rx="6" fill="#fff5f5" stroke="#f43f5e" strokeWidth="1.2" strokeDasharray="2,2" />
                    <text x="32" y="44" fill="#b91c1c" fontSize="7" fontWeight="bold">AWS Reserved IPs (5 Locked)</text>

                    {/* Reserved IP nodes */}
                    <g transform="translate(32, 50)">
                      <rect x="0" y="0" width="85" height="18" rx="2" fill="#ffffff" stroke="#f43f5e" strokeWidth="0.8" />
                      <text x="5" y="11" fill="#dc2626" fontSize="6.5" fontWeight="bold">.0 (Network IP)</text>
                    </g>
                    <g transform="translate(122, 50)">
                      <rect x="0" y="0" width="95" height="18" rx="2" fill="#ffffff" stroke="#f43f5e" strokeWidth="0.8" />
                      <text x="5" y="11" fill="#dc2626" fontSize="6.5" fontWeight="bold">.1 (Router Gateway)</text>
                    </g>

                    <g transform="translate(32, 75)">
                      <rect x="0" y="0" width="85" height="18" rx="2" fill="#ffffff" stroke="#f43f5e" strokeWidth="0.8" />
                      <text x="5" y="11" fill="#dc2626" fontSize="6.5" fontWeight="bold">.2 (Route 53 DNS)</text>
                    </g>
                    <g transform="translate(122, 75)">
                      <rect x="0" y="0" width="95" height="18" rx="2" fill="#ffffff" stroke="#f43f5e" strokeWidth="0.8" />
                      <text x="5" y="11" fill="#dc2626" fontSize="6.5" fontWeight="bold">.3 (AWS Reserved)</text>
                    </g>

                    <g transform="translate(32, 100)">
                      <rect x="0" y="0" width="186" height="18" rx="2" fill="#ffffff" stroke="#f43f5e" strokeWidth="0.8" />
                      <text x="5" y="11" fill="#dc2626" fontSize="6.5" fontWeight="bold">.255 (Classic Broadcast Drop)</text>
                    </g>

                    <text x="32" y="145" fill="#e11d48" fontSize="6.5" fontWeight="bold">⚠️ Inactive: 100% Locked by VPC Router</text>


                    {/* Right: Usable IP Pool Section */}
                    <rect x="240" y="32" width="215" height="128" rx="6" fill="#f0fdf4" stroke="#10b981" strokeWidth="1.5" />
                    <text x="248" y="44" fill="#065f46" fontSize="7" fontWeight="bold">Usable IP Range ({ipStats.usableIps} Available)</text>

                    {/* Active IP Instance 1 */}
                    <g transform="translate(250, 52)">
                      <rect x="0" y="0" width="90" height="42" rx="4" fill="#ffffff" stroke="#10b981" strokeWidth="1.2" />
                      <text x="45" y="12" fill="#1e293b" fontSize="7" fontWeight="black" textAnchor="middle">Prod EC2 Instance</text>
                      <text x="45" y="24" fill="#047857" fontSize="6" fontWeight="bold" textAnchor="middle">IP: .4</text>
                      <rect x="15" y="28" width="60" height="10" rx="1.5" fill="#ecfdf5" stroke="#10b981" strokeWidth="0.6" />
                      <text x="45" y="35" fill="#047857" fontSize="5" fontWeight="extrabold" textAnchor="middle">SG: PORT 443 OK</text>
                    </g>

                    {/* Active IP Instance 2 */}
                    <g transform="translate(352, 52)">
                      <rect x="0" y="0" width="90" height="42" rx="4" fill="#ffffff" stroke="#10b981" strokeWidth="1.2" />
                      <text x="45" y="12" fill="#1e293b" fontSize="7" fontWeight="black" textAnchor="middle">Application ALB</text>
                      <text x="45" y="24" fill="#047857" fontSize="6" fontWeight="bold" textAnchor="middle">IP: .15</text>
                      <rect x="15" y="28" width="60" height="10" rx="1.5" fill="#ecfdf5" stroke="#10b981" strokeWidth="0.6" />
                      <text x="45" y="35" fill="#047857" fontSize="5" fontWeight="extrabold" textAnchor="middle">SG: PORT 80 OK</text>
                    </g>

                    {/* Usable range summary */}
                    <g transform="translate(250, 105)">
                      <rect x="0" y="0" width="192" height="45" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                      <text x="10" y="14" fill="#475569" fontSize="6.5" fontWeight="black">Allocated IP Block Range:</text>
                      <text x="10" y="26" fill="#2563eb" fontSize="7.5" fontWeight="extrabold">.4  to  .{Math.pow(2, 32 - subnetMaskSize) - 2}</text>
                      <text x="10" y="36" fill="#94a3b8" fontSize="5.5" fontWeight="bold">Dynamically allocated as servers request local leases.</text>
                    </g>
                  </svg>
                </div>

                <span className="text-[10px] text-slate-500 block mt-2 font-medium">
                  💡 Note: Creating an Application Load Balancer or ECS Fargate tasks requires ample usable IP addresses inside the private subnet boundary block to mount Elastic Network Interfaces cleanly.
                </span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INGRESS & HA EGRESS PIPELINES                                     */}
      {/* ========================================================================= */}
      {activeTab === 'pipelines' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Activity className="w-5 h-5" /> VPC Ingress &amp; High Availability Egress Pipelines
            </h2>
            <p className="da-card-desc">
              Bidirectional internet communication requires distinct route pathways. <strong>Internet Gateways (IGW)</strong> resolve public ingress/egress; <strong>NAT Gateways</strong> translate and enable outbound-only egress for private subnets; while <strong>Bastions</strong> host secure SSH hops.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Control Sidebar */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between space-y-4 font-semibold">
              <div className="space-y-4">
                
                {/* IGW Toggle */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="text-xs font-extrabold text-slate-700">VPC Internet Gateway (IGW)</span>
                  <button
                    onClick={() => setIgwAttached(!igwAttached)}
                    className={`px-3 py-1 text-[10px] font-extrabold rounded border transition-all ${igwAttached ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'}`}
                  >
                    {igwAttached ? 'CONNECTED (Attached)' : 'DISCONNECTED'}
                  </button>
                </div>

                {/* NAT HA Toggle */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">NAT Gateway Redundancy Mode:</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                    <button
                      onClick={() => setNatHaMode('single')}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${natHaMode === 'single' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Single NAT (AZ-1 only)
                    </button>
                    <button
                      onClick={() => setNatHaMode('dual_ha')}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${natHaMode === 'dual_ha' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      HA Dual-NAT (AZ-1 &amp; AZ-2)
                    </button>
                  </div>
                </div>

                {/* Bastion Host Active */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">Bastion Host (Public Subnet)</span>
                    <span className="text-[9px] text-slate-400 block font-semibold">Provides safe gateway SSH hop</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={bastionTunnel}
                    onChange={(e) => setBastionTunnel(e.target.checked)}
                    className="accent-blue-600 cursor-pointer w-4 h-4"
                  />
                </div>

                {/* Compute Active Subnet */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">Target EC2 Private Subnet:</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                    <button
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${activeAz === 'az1' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                      onClick={() => setActiveAz('az1')}
                    >
                      Private Subnet (AZ-1)
                    </button>
                    <button
                      onClick={() => setActiveAz('az2')}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${activeAz === 'az2' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Private Subnet (AZ-2)
                    </button>
                  </div>
                </div>

              </div>

              {/* Operations Triggers */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => runPipelineSim('ssh_bastion')}
                  disabled={pipelineSimState === 'running'}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Trigger SSH Public Ingress
                </button>
                <button
                  onClick={() => runPipelineSim('ec2_egress')}
                  disabled={pipelineSimState === 'running'}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Trigger EC2 Egress (Internet Out)
                </button>
                <button
                  onClick={() => runPipelineSim('az_failover')}
                  disabled={pipelineSimState === 'running'}
                  className="w-full py-2 border border-rose-300 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> Simulate AZ-1 Outage Failover
                </button>
              </div>

            </div>

            {/* Graphics Simulator Display */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden da-svg-bg flex flex-col justify-between min-h-[440px]">
              
              {pipelineSimState === 'running' && (
                <span className="absolute top-3 left-3 bg-blue-100 border border-blue-300 text-blue-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl animate-pulse select-none z-10">
                  ⚡ PROPAGATING NETWORK PACKET TRANSITS...
                </span>
              )}
              {pipelineSimState === 'success' && (
                <span className="absolute top-3 left-3 bg-emerald-100 border border-emerald-300 text-emerald-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl select-none z-10 animate-bounce">
                  🟢 NETWORK ROUTING COMPLETED SUCCESSFULLY
                </span>
              )}
              {pipelineSimState === 'failed' && (
                <span className="absolute top-3 left-3 bg-rose-100 border border-rose-300 text-rose-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl select-none z-10">
                  🚨 ROUTING OUTAGE - PACKET DROPPED
                </span>
              )}

              {/* Interactive SVG Routing Diagram */}
              <div className="w-full flex-grow flex items-center justify-center mt-6">
                <svg className="w-full min-w-[500px] h-[255px]" viewBox="0 0 500 255">
                  <defs>
                    <marker id="arrow-pipeline" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {/* ==================== VPC BOUNDARY ==================== */}
                  <rect x="6" y="24" width="488" height="225" rx="8" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="5,3" />
                  <text x="16" y="34" fill="#2563eb" fontSize="7.5" fontWeight="black">VPC BOUNDARY (10.0.0.0/16)</text>

                  {/* Zones outlines */}
                  {/* Availability Zone 1 */}
                  <rect x="12" y="40" width="232" height="202" rx="6" fill="none" stroke={pipelineFlowType === 'az_failover' ? '#f43f5e' : '#cbd5e1'} strokeWidth="1.2" strokeDasharray={pipelineFlowType === 'az_failover' ? '4,4' : 'none'} />
                  <text x="20" y="51" fill={pipelineFlowType === 'az_failover' ? '#e11d48' : '#64748b'} fontSize="7" fontWeight="bold">
                    Availability Zone 1 {pipelineFlowType === 'az_failover' && '⚠️ OUTAGE'}
                  </text>

                  {/* Availability Zone 2 */}
                  <rect x="256" y="40" width="232" height="202" rx="6" fill="none" stroke="#cbd5e1" strokeWidth="1.2" />
                  <text x="264" y="51" fill="#64748b" fontSize="7" fontWeight="bold">Availability Zone 2</text>

                  {/* Internet Gateway Gateway ENI Node */}
                  <g transform="translate(210, 1)">
                    <rect x="0" y="0" width="80" height="20" rx="4" fill={igwAttached ? '#e0f2fe' : '#fee2e2'} stroke={igwAttached ? '#0284c7' : '#ef4444'} strokeWidth="1.2" />
                    <text x="40" y="13" fill={igwAttached ? '#0369a1' : '#991b1b'} fontSize="7" fontWeight="black" textAnchor="middle">
                      {igwAttached ? 'IGW Attached' : 'IGW Detached'}
                    </text>
                  </g>

                  {/* Conduit paths flows */}
                  {/* SSH Flow path: IGW -> Bastion (AZ-1) -> Private EC2 (AZ-1) */}
                  {pipelineFlowType === 'ssh_bastion' && pipelineSimState === 'success' && (
                    <g>
                      <path d="M 250 22 V 90 H 85 V 170" fill="none" className="da-flow-green" strokeWidth="2.5" markerEnd="url(#arrow-pipeline)" />
                    </g>
                  )}
                  {pipelineFlowType === 'ssh_bastion' && pipelineSimState === 'failed' && !igwAttached && (
                    <g>
                      <circle cx="250" cy="11" r="3" fill="#f43f5e" />
                      <line x1="250" y1="11" x2="250" y2="22" stroke="#f43f5e" strokeWidth="1.8" strokeDasharray="2,2" />
                    </g>
                  )}

                  {/* EC2 Egress Flow path (AZ-1): Private EC2 -> NAT AZ-1 -> IGW */}
                  {pipelineFlowType === 'ec2_egress' && activeAz === 'az1' && pipelineSimState === 'success' && (
                    <g>
                      <path d="M 85 170 V 90 H 130 V 22" fill="none" className="da-flow-green" strokeWidth="2.5" markerEnd="url(#arrow-pipeline)" />
                    </g>
                  )}

                  {/* EC2 Egress Flow path (AZ-2): Private EC2 (AZ-2) -> NAT AZ-2 -> IGW */}
                  {pipelineFlowType === 'ec2_egress' && activeAz === 'az2' && pipelineSimState === 'success' && natHaMode === 'dual_ha' && (
                    <g>
                      <path d="M 325 170 V 90 H 370 V 22" fill="none" className="da-flow-green" strokeWidth="2.5" markerEnd="url(#arrow-pipeline)" />
                    </g>
                  )}

                  {/* AZ Failover path: Private EC2 (AZ-2) rerouting from AZ-1 single NAT down to AZ-2 if Multi-AZ */}
                  {pipelineFlowType === 'az_failover' && pipelineSimState === 'success' && (
                    <g>
                      <path d="M 325 170 V 90 H 370 V 22" fill="none" className="da-flow-green" strokeWidth="2.5" markerEnd="url(#arrow-pipeline)" />
                    </g>
                  )}

                  {/* AZ-1 Public Subnet Components */}
                  <g transform="translate(20, 60)">
                    <rect x="0" y="0" width="200" height="42" rx="6" fill="#f8fafc" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" />
                    <text x="10" y="12" fill="#2563eb" fontSize="6.5" fontWeight="bold">Public Subnet (AZ-1)</text>
                    
                    {/* Bastion Host */}
                    <g transform="translate(15, 16)">
                      <rect x="0" y="0" width="80" height="20" rx="3" fill={bastionTunnel ? '#ecfdf5' : '#ffffff'} stroke={bastionTunnel ? '#10b981' : '#cbd5e1'} strokeWidth="1" />
                      <text x="40" y="12" fill="#334155" fontSize="7" fontWeight="extrabold" textAnchor="middle">
                        Bastion Host {bastionTunnel ? '🔓' : '🔒'}
                      </text>
                    </g>

                    {/* NAT Gateway AZ-1 */}
                    <g transform="translate(105, 16)">
                      <rect x="0" y="0" width="80" height="20" rx="3" fill={pipelineFlowType === 'az_failover' ? '#fee2e2' : '#eff6ff'} stroke={pipelineFlowType === 'az_failover' ? '#ef4444' : '#2563eb'} strokeWidth="1" />
                      <text x="40" y="12" fill="#334155" fontSize="7" fontWeight="bold" textAnchor="middle">
                        NAT Gateway-1 {pipelineFlowType === 'az_failover' ? '❌' : '⚡'}
                      </text>
                    </g>
                  </g>

                  {/* AZ-2 Public Subnet Components */}
                  <g transform="translate(265, 60)">
                    <rect x="0" y="0" width="200" height="42" rx="6" fill="#f8fafc" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2,2" />
                    <text x="10" y="12" fill="#2563eb" fontSize="6.5" fontWeight="bold">Public Subnet (AZ-2)</text>
                    
                    {/* NAT Gateway AZ-2 */}
                    <g transform="translate(105, 16)">
                      <rect x="0" y="0" width="80" height="20" rx="3" fill={natHaMode === 'dual_ha' ? '#eff6ff' : '#f1f5f9'} stroke={natHaMode === 'dual_ha' ? '#2563eb' : '#cbd5e1'} strokeWidth="1" />
                      <text x="40" y="12" fill="#334155" fontSize="7" fontWeight="bold" textAnchor="middle">
                        {natHaMode === 'dual_ha' ? 'NAT Gateway-2 ⚡' : 'No NAT ⚪'}
                      </text>
                    </g>
                  </g>

                  {/* AZ-1 Private Subnet */}
                  <g transform="translate(25, 135)">
                    <rect x="0" y="0" width="200" height="90" rx="6" fill="#f8fafc" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
                    <text x="10" y="12" fill="#475569" fontSize="6.5" fontWeight="bold">Private Subnet (AZ-1)</text>

                    {/* Private EC2 */}
                    <g transform="translate(50, 25)">
                      <rect x="0" y="0" width="100" height="45" rx="4" fill={activeAz === 'az1' && pipelineSimState === 'success' ? '#ecfdf5' : '#ffffff'} stroke={activeAz === 'az1' && pipelineSimState === 'success' ? '#10b981' : '#cbd5e1'} strokeWidth="1.5" />
                      <text x="50" y="16" fill="#1e293b" fontSize="8" fontWeight="black" textAnchor="middle">EC2 Cluster-1</text>
                      <text x="50" y="27" fill="#64748b" fontSize="6.5" textAnchor="middle">IP: 10.0.1.15</text>
                      <text x="50" y="38" fill={pipelineFlowType === 'az_failover' ? '#dc2626' : '#16a34a'} fontSize="6" fontWeight="bold" textAnchor="middle">
                        {pipelineFlowType === 'az_failover' ? '❌ Out of AZ' : '🟢 Secure Node'}
                      </text>
                    </g>
                  </g>

                  {/* AZ-2 Private Subnet */}
                  <g transform="translate(265, 135)">
                    <rect x="0" y="0" width="200" height="90" rx="6" fill="#f8fafc" stroke="#64748b" strokeWidth="1" strokeDasharray="2,2" />
                    <text x="10" y="12" fill="#475569" fontSize="6.5" fontWeight="bold">Private Subnet (AZ-2)</text>

                    {/* Private EC2 AZ-2 */}
                    <g transform="translate(50, 25)">
                      <rect x="0" y="0" width="100" height="45" rx="4" fill={activeAz === 'az2' && pipelineSimState === 'success' ? '#ecfdf5' : '#ffffff'} stroke={activeAz === 'az2' && pipelineSimState === 'success' ? '#10b981' : '#cbd5e1'} strokeWidth="1.5" />
                      <text x="50" y="16" fill="#1e293b" fontSize="8" fontWeight="black" textAnchor="middle">EC2 Cluster-2</text>
                      <text x="50" y="27" fill="#64748b" fontSize="6.5" textAnchor="middle">IP: 10.0.2.88</text>
                      <text x="50" y="38" fill="#16a34a" fontSize="6" fontWeight="bold" textAnchor="middle">🟢 Secure Node</text>
                    </g>
                  </g>
                </svg>
              </div>

              {/* Console log output terminal */}
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto border border-slate-800 shadow-inner mt-4">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5 text-slate-400">
                  <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-blue-400" /> VPC Route Conduits Console</span>
                  <span>System: route-telemetry</span>
                </div>
                {pipelineLogs.length === 0 ? (
                  <div className="text-slate-500 italic text-center py-2">Select routing variables and click "Trigger" scenarios.</div>
                ) : (
                  pipelineLogs.map((log, idx) => (
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
      {/* TAB 3: STATEFUL SG VS STATELESS NACL                                      */}
      {/* ========================================================================= */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Shield className="w-5 h-5" /> Subnet Stateless NACLs vs Instance Stateful Security Groups
            </h2>
            <p className="da-card-desc">
              VPC firewalls operate in nested layers. <strong>Network Access Control Lists (NACLs)</strong> are stateless, checking ingress/egress sequentially at the subnet border. <strong>Security Groups (SGs)</strong> are stateful, automatically permitting inbound return traffic at the Elastic Network Interface (ENI).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Firewall Rules Sidebar */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between space-y-4 font-semibold">
              <div className="space-y-4">
                
                {/* Stateless NACL Rules */}
                <div className="space-y-2.5">
                  <span className="text-xs font-black text-blue-800 block border-b border-slate-100 pb-1">1. Subnet Network ACL (Stateless)</span>
                  
                  {/* NACL HTTP rule */}
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-250">
                    <div className="text-[11px]">
                      <span className="font-extrabold text-slate-800 block">Inbound Rule 100: TCP Port 80</span>
                      <span className="text-[9px] text-slate-400 block font-semibold">Web HTTP Traffic Inbound</span>
                    </div>
                    <select
                      value={naclInboundHttp}
                      onChange={(e) => setNaclInboundHttp(e.target.value as any)}
                      className="p-1 border border-slate-200 rounded text-[10.5px] font-bold text-slate-700 outline-none"
                    >
                      <option value="allow">ALLOW Ingress</option>
                      <option value="deny">DENY Ingress</option>
                    </select>
                  </div>

                  {/* NACL Outbound rule */}
                  <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-250">
                    <div className="text-[11px]">
                      <span className="font-extrabold text-slate-800 block">Outbound Rule 100: Ephemeral Range</span>
                      <span className="text-[9px] text-slate-400 block font-semibold">Allow return ports 1024-65535</span>
                    </div>
                    <select
                      value={naclOutboundEphemeral}
                      onChange={(e) => setNaclOutboundEphemeral(e.target.value as any)}
                      className="p-1 border border-slate-200 rounded text-[10.5px] font-bold text-slate-700 outline-none"
                    >
                      <option value="allow">ALLOW Egress</option>
                      <option value="deny">DENY Egress</option>
                    </select>
                  </div>
                </div>

                {/* Stateful Security Group Rules */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="text-xs font-black text-blue-800 block border-b border-slate-100 pb-1">2. Instance Security Group (Stateful)</span>
                  
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sgAllowHttp}
                      onChange={(e) => setSgAllowHttp(e.target.checked)}
                      className="accent-blue-600 w-4 h-4 rounded"
                    />
                    Allow HTTP Ingress (Port 80)
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sgAllowSsh}
                      onChange={(e) => setSgAllowSsh(e.target.checked)}
                      className="accent-blue-600 w-4 h-4 rounded"
                    />
                    Allow SSH Ingress (Port 22)
                  </label>
                </div>

              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 border-t border-slate-100 pt-4">
                <button
                  onClick={() => runSecuritySim(80)}
                  disabled={securitySimState === 'animating'}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 active:scale-95 transition-all shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Query Web (Port 80)
                </button>
                <button
                  onClick={() => runSecuritySim(22)}
                  disabled={securitySimState === 'animating'}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 active:scale-95 transition-all shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Query SSH (Port 22)
                </button>
              </div>

            </div>

            {/* Visualizer & Logs Terminal */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden da-svg-bg flex flex-col justify-between min-h-[440px]">
              
              {/* Telemetry Status Badges */}
              {securitySimState === 'animating' && (
                <span className="absolute top-3 left-3 bg-blue-100 border border-blue-300 text-blue-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl animate-pulse select-none z-10">
                  ⚡ PACKET TRAVERSING STATELESS &amp; STATEFUL BOUNDARIES...
                </span>
              )}
              {securitySimState === 'passed' && (
                <span className="absolute top-3 left-3 bg-emerald-100 border border-emerald-300 text-emerald-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl select-none z-10 animate-bounce">
                  ✅ 200 OK - FIREWALL TRAVERSAL COMPLETED
                </span>
              )}
              {securitySimState === 'blocked_nacl' && (
                <span className="absolute top-3 left-3 bg-rose-100 border border-rose-300 text-rose-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl select-none z-10">
                  🚨 BLOCKED AT STATELESS SUBNET NACL
                </span>
              )}
              {securitySimState === 'blocked_sg' && (
                <span className="absolute top-3 left-3 bg-rose-100 border border-rose-300 text-rose-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl select-none z-10">
                  🚨 BLOCKED AT STATEFUL SECURITY GROUP
                </span>
              )}
              {securitySimState === 'blocked_ephemeral' && (
                <span className="absolute top-3 left-3 bg-rose-100 border border-rose-300 text-rose-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl select-none z-10">
                  🚨 BLOCKED ON RETURN PATH (STATELESS EPHEMERAL NACL DROP)
                </span>
              )}

              {/* SVG Firewall Traversal Map */}
              <div className="w-full flex-grow flex items-center justify-center mt-8">
                <svg className="w-full max-w-[480px] h-[190px]" viewBox="0 0 480 190">
                  <defs>
                    <marker id="arrow-sec" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                    </marker>
                  </defs>

                  {/* ==================== VPC BOUNDARY ==================== */}
                  <rect x="15" y="10" width="450" height="170" rx="8" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="5,3" />
                  <text x="25" y="22" fill="#2563eb" fontSize="7.5" fontWeight="black">VPC BOUNDARY (10.0.0.0/16)</text>

                  {/* Private Subnet Boundary Box */}
                  <rect x="105" y="32" width="345" height="135" rx="6" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,2" />
                  <text x="115" y="44" fill="#1e3a8a" fontSize="7" fontWeight="bold">Private Subnet (10.0.1.0/24)</text>

                  {/* Inbound path lines */}
                  <g fill="none" strokeWidth="1.5">
                    {/* Public internet to subnet border */}
                    <path d="M 5 95 H 105" stroke={animStep >= 1 ? '#2563eb' : '#cbd5e1'} className={animStep === 1 ? 'packet-pulse' : ''} strokeDasharray={animStep === 1 ? '6,4' : 'none'} />
                    {/* Subnet border to SG border */}
                    <path d="M 145 95 H 250" stroke={animStep >= 2 ? '#2563eb' : '#cbd5e1'} />
                    {/* SG to EC2 Target */}
                    <path d="M 290 95 H 355" stroke={animStep >= 3 ? '#2563eb' : '#cbd5e1'} />
                    
                    {/* Return path (stateless return) */}
                    <path d="M 355 105 H 250 Q 197 135 145 105" stroke={animStep >= 4 ? (securitySimState === 'blocked_ephemeral' ? '#f43f5e' : '#10b981') : '#cbd5e1'} strokeWidth="1.8" />
                    <path d="M 105 105 H 5" stroke={securitySimState === 'passed' ? '#10b981' : '#cbd5e1'} />
                  </g>

                  {/* Packet visualizer indicator (dot) */}
                  {securitySimState === 'animating' && (
                    <g>
                      <circle r="4" fill="#2563eb" className="animate-ping">
                        {animStep === 1 && <animateMotion dur="0.8s" repeatCount="indefinite" path="M 5 95 H 105" />}
                        {animStep === 2 && <animateMotion dur="0.8s" repeatCount="indefinite" path="M 145 95 H 250" />}
                        {animStep === 3 && <animateMotion dur="0.8s" repeatCount="indefinite" path="M 290 95 H 355" />}
                        {animStep === 4 && <animateMotion dur="0.8s" repeatCount="indefinite" path="M 375 105 H 250 Q 197 135 145 105" />}
                      </circle>
                      <text x="240" y="24" fill="#2563eb" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">
                        TCP Packet Port: {securityTestPort}
                      </text>
                    </g>
                  )}

                  {/* Stateless Subnet Border NACL */}
                  <g transform="translate(90, 60)" className={securitySimState === 'blocked_nacl' || (animStep === 4 && securitySimState === 'blocked_ephemeral') ? 'da-sim-node-active' : ''}>
                    <rect x="0" y="0" width="36" height="70" rx="4" 
                      fill={securitySimState === 'blocked_nacl' ? '#fee2e2' : '#eff6ff'} 
                      stroke={securitySimState === 'blocked_nacl' ? '#ef4444' : '#3b82f6'} strokeWidth="1.8" />
                    <text x="18" y="20" fill="#1e3a8a" fontSize="6" fontWeight="bold" textAnchor="middle">Stateless</text>
                    <text x="18" y="36" fill="#2563eb" fontSize="9" fontWeight="black" textAnchor="middle">NACL</text>
                    <text x="18" y="52" fill="#1e3a8a" fontSize="5.5" fontWeight="bold" textAnchor="middle">Rule 100</text>
                  </g>

                  {/* Stateful Security Group (SG) directly enclosing the ENI inside Subnet */}
                  <g transform="translate(245, 60)" className={securitySimState === 'blocked_sg' ? 'da-sim-node-active' : ''}>
                    <rect x="0" y="0" width="45" height="70" rx="5" 
                      fill={securitySimState === 'blocked_sg' ? '#fee2e2' : '#f0fdf4'} 
                      stroke={securitySimState === 'blocked_sg' ? '#ef4444' : '#10b981'} strokeWidth="1.8" />
                    <text x="22.5" y="20" fill="#065f46" fontSize="6" fontWeight="bold" textAnchor="middle">Stateful</text>
                    <text x="22.5" y="36" fill="#10b981" fontSize="9" fontWeight="black" textAnchor="middle">SG</text>
                    <text x="22.5" y="52" fill="#065f46" fontSize="5.5" fontWeight="bold" textAnchor="middle">ENI Level</text>
                  </g>

                  {/* Private EC2 Instance inside SG */}
                  <g transform="translate(355, 70)">
                    <rect x="0" y="0" width="80" height="50" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                    <text x="40" y="20" fill="#cbd5e1" fontSize="8" fontWeight="black" textAnchor="middle">EC2 SERVER</text>
                    <text x="40" y="34" fill="#94a3b8" fontSize="6.5" textAnchor="middle">IP: 10.0.1.15</text>
                  </g>
                </svg>
              </div>

              {/* Logs output terminal */}
              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5 text-slate-400">
                  <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-blue-400" /> VPC Firewall Telemetry Ingress Console</span>
                  <span>ACL: subnet-boundary-filters</span>
                </div>
                {securityLogs.length === 0 ? (
                  <div className="text-slate-500 italic text-center py-2">Select packet parameters and click "Query" buttons to run tests.</div>
                ) : (
                  securityLogs.map((log, idx) => (
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
      {/* TAB 4: VPC PEERING & ENDPOINTS                                            */}
      {/* ========================================================================= */}
      {activeTab === 'endpoints' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Layers className="w-5 h-5" /> Private Interconnects: Peering &amp; VPC Endpoints
            </h2>
            <p className="da-card-desc">
              Secure systems shouldn't traverse the public internet. <strong>VPC Endpoints</strong> route traffic privately to S3/DynamoDB (Gateway) and other AWS services (Interface/PrivateLink), while <strong>VPC Peering</strong> securely links distinct networks directly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sidebar selection controls */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between space-y-4 font-semibold">
              <div className="space-y-4">
                
                {/* Endpoint selection */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">1. Amazon S3 / KMS Endpoint Type:</span>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="endpoint"
                        checked={endpointType === 'none'}
                        onChange={() => { setEndpointType('none'); setEndpointSimState('idle'); }}
                        className="text-blue-600 accent-blue-600 w-4 h-4"
                      />
                      🌐 None (Public internet route through IGW)
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="endpoint"
                        checked={endpointType === 'gateway'}
                        onChange={() => { setEndpointType('gateway'); setEndpointSimState('idle'); }}
                        className="text-blue-600 accent-blue-600 w-4 h-4"
                      />
                      🟢 S3 Gateway Endpoint (VPC Prefix List routing)
                    </label>
                    <label className="flex items-center gap-2 text-xs font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="endpoint"
                        checked={endpointType === 'interface'}
                        onChange={() => { setEndpointType('interface'); setEndpointSimState('idle'); }}
                        className="text-blue-600 accent-blue-600 w-4 h-4"
                      />
                      🟢 KMS Interface Endpoint (AWS PrivateLink ENI)
                    </label>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] leading-relaxed text-slate-650 font-medium">
                  <span className="font-extrabold text-slate-800 block mb-1">Architectural Trade-Off:</span>
                  "Gateway Endpoints modify VPC route tables for S3/DynamoDB and are cost-free. Interface Endpoints mount dedicated ENIs inside your subnet, leveraging PrivateLink with hourly resource billing, supporting KMS, Secrets Manager, and SSM."
                </div>

                {/* Peering active */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">VPC Peering (VPC-A &lt;-&gt; VPC-B)</span>
                    <span className="text-[9px] text-slate-400 block font-semibold">Direct private network link</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={peeringActive}
                    onChange={(e) => { setPeeringActive(e.target.checked); setPeeringTestState('idle'); }}
                    className="accent-blue-600 cursor-pointer w-4 h-4"
                  />
                </div>

              </div>

              {/* Action Buttons */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <button
                  onClick={runEndpointSim}
                  disabled={endpointSimState === 'running'}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 active:scale-95 transition-all shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Trigger API Endpoint Call
                </button>
                <button
                  onClick={testPeeringTransitive}
                  disabled={!peeringActive}
                  className="w-full py-2 border border-slate-350 hover:bg-slate-55 text-slate-700 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 active:scale-95 transition-all"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Test Transitive Peering (VPC-C)
                </button>
              </div>

            </div>

            {/* Graphics & Logs Terminal */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden da-svg-bg flex flex-col justify-between min-h-[440px]">
              
              {endpointSimState === 'running' && (
                <span className="absolute top-3 left-3 bg-blue-100 border border-blue-300 text-blue-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl animate-pulse select-none z-10">
                  ⚡ PRIVATE ENDPOINT ROUTING IN AWS BACKPLANE...
                </span>
              )}
              {peeringTestState === 'transitive_blocked' && (
                <span className="absolute top-3 left-3 bg-rose-100 border border-rose-300 text-rose-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl select-none z-10 animate-bounce">
                  🚨 TRANSITIVE ROUTING BLOCKED (VPC-A &lt;-X-&gt; VPC-C)
                </span>
              )}

              {/* SVG Topology Interconnections */}
              <div className="w-full flex-grow flex items-center justify-center mt-6">
                <svg className="w-full min-w-[380px] h-[220px]" viewBox="0 0 380 220">
                  <defs>
                    <marker id="arrow-endpoint" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {/* VPC boundaries */}
                  {/* VPC A */}
                  <rect x="10" y="30" width="130" height="170" rx="8" fill="none" stroke="#2563eb" strokeWidth="1.5" />
                  <text x="20" y="42" fill="#2563eb" fontSize="8" fontWeight="black">VPC-A (10.0.0.0/16)</text>
                  {/* VPC B */}
                  <rect x="235" y="30" width="130" height="75" rx="8" fill="none" stroke="#7c3aed" strokeWidth="1.5" />
                  <text x="245" y="42" fill="#7c3aed" fontSize="8" fontWeight="black">VPC-B (172.16.0.0/16)</text>
                  {/* VPC C */}
                  <rect x="235" y="125" width="130" height="75" rx="8" fill="none" stroke="#4b5563" strokeWidth="1.5" />
                  <text x="245" y="137" fill="#475569" fontSize="8" fontWeight="black">VPC-C (192.168.0.0/16)</text>

                  {/* Flow path overlays */}
                  {/* VPC Peering Flow path */}
                  {peeringActive && peeringTestState === 'idle' && (
                    <path d="M 140 85 H 235" fill="none" className="da-flow-blue" strokeWidth="2" markerEnd="url(#arrow-endpoint)" />
                  )}
                  {peeringTestState === 'transitive_blocked' && (
                    <g>
                      <path d="M 140 85 H 235" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="3,3" />
                      {/* Red cross on transition from B to C */}
                      <path d="M 235 85 L 200 135 L 235 155" fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="4,4" />
                      <line x1="210" y1="115" x2="225" y2="130" stroke="#f43f5e" strokeWidth="3" />
                      <line x1="225" y1="115" x2="210" y2="130" stroke="#f43f5e" strokeWidth="3" />
                    </g>
                  )}

                  {/* S3 Endpoint flow path */}
                  {endpointType === 'gateway' && endpointSimState === 'done' && (
                    <path d="M 80 115 H 190" fill="none" className="da-flow-green" strokeWidth="2" markerEnd="url(#arrow-endpoint)" />
                  )}

                  {/* KMS Interface flow path */}
                  {endpointType === 'interface' && endpointSimState === 'done' && (
                    <path d="M 80 155 H 190" fill="none" className="da-flow-green" strokeWidth="2" markerEnd="url(#arrow-endpoint)" />
                  )}

                  {/* S3 Gateway Node */}
                  <g transform="translate(190, 95)">
                    <rect x="0" y="0" width="36" height="36" rx="18" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="18" y="21" fill="#1d4ed8" fontSize="6.5" fontWeight="bold" textAnchor="middle">S3 Gateway</text>
                  </g>

                  {/* KMS Interface Node */}
                  <g transform="translate(190, 140)">
                    <rect x="0" y="0" width="36" height="36" rx="18" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="1.5" />
                    <text x="18" y="21" fill="#6d28d9" fontSize="6.5" fontWeight="bold" textAnchor="middle">KMS Interface</text>
                  </g>

                  {/* EC2 Instance VPC-A */}
                  <g transform="translate(25, 75)">
                    <rect x="0" y="0" width="55" height="28" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
                    <text x="27.5" y="17" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">EC2 Host A</text>
                  </g>

                  {/* Interface ENI VPC-A */}
                  <g transform="translate(25, 145)">
                    <rect x="0" y="0" width="55" height="20" rx="3" fill="#f0fdf4" stroke="#10b981" strokeWidth="1" />
                    <text x="27.5" y="12" fill="#047857" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                      {endpointType === 'interface' ? 'ENI Active' : 'No Endpoint'}
                    </text>
                  </g>

                  {/* EC2 Instance VPC-B */}
                  <g transform="translate(250, 55)">
                    <rect x="0" y="0" width="55" height="28" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="27.5" y="17" fill="#475569" fontSize="7.5" fontWeight="bold" textAnchor="middle">EC2 Host B</text>
                  </g>

                  {/* EC2 Instance VPC-C */}
                  <g transform="translate(250, 150)">
                    <rect x="0" y="0" width="55" height="28" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="27.5" y="17" fill="#475569" fontSize="7.5" fontWeight="bold" textAnchor="middle">EC2 Host C</text>
                  </g>
                </svg>
              </div>

              {/* Logs terminal */}
              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto border border-slate-800 shadow-inner">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5 text-slate-400">
                  <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4 text-emerald-400" /> VPC Endpoint Audit Terminal</span>
                  <span>System: privatelink-logs</span>
                </div>
                {endpointLogs.length === 0 ? (
                  <div className="text-slate-500 italic text-center py-2">Configure endpoint parameters and click "Trigger API Endpoint Call".</div>
                ) : (
                  endpointLogs.map((log, idx) => (
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
      {/* TAB 5: REDUNDANT VPN & FLOW LOGS                                          */}
      {/* ========================================================================= */}
      {activeTab === 'hybrid' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Wifi className="w-5 h-5" /> AWS Redundant Site-to-Site VPN &amp; VPC Flow Logs
            </h2>
            <p className="da-card-desc">
              Connecting AWS subnets to on-premises routers requires high-availability **IPsec VPN Tunnels** linked to a **Virtual Private Gateway (VGW)** and a **Customer Gateway (CGW)**. **VPC Flow Logs** evaluate security rule compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sidebar toggle controls */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between space-y-4 font-semibold">
              <div className="space-y-4">
                
                {/* Redundant IPsec Tunnels */}
                <div>
                  <span className="text-xs font-bold block mb-2">1. VPN Redundancy Tunnels Status:</span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-xs font-bold text-slate-700">IPsec Tunnel A Status</span>
                      <button
                        onClick={() => setTunnelAActive(!tunnelAActive)}
                        className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all ${tunnelAActive ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'}`}
                      >
                        {tunnelAActive ? 'ACTIVE / Up' : 'OFFLINE / Down'}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-xl">
                      <span className="text-xs font-bold text-slate-700">IPsec Tunnel B Status</span>
                      <button
                        onClick={() => setTunnelBActive(!tunnelBActive)}
                        className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all ${tunnelBActive ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'}`}
                      >
                        {tunnelBActive ? 'ACTIVE / Up' : 'OFFLINE / Down'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Flow Logs Toggle */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 block">VPC Flow Logs Telemetry</span>
                    <span className="text-[9px] text-slate-400 block font-semibold">Verify inbound/outbound transit SGs</span>
                  </div>
                  <button
                    onClick={toggleFlowLogs}
                    className={`px-3 py-1 text-[10px] font-extrabold rounded border transition-all ${flowLogsEnabled ? 'bg-emerald-500 border-emerald-600 text-white shadow' : 'bg-slate-200 border-slate-300 text-slate-650'}`}
                  >
                    {flowLogsEnabled ? 'CAPTURING ON' : 'DISABLED'}
                  </button>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] leading-relaxed text-slate-650 font-medium">
                  <span className="font-extrabold text-slate-800 block mb-1">VPN Best Practices:</span>
                  "AWS allocates two separate IPsec VPN tunnel endpoints inside distinct availability zones by default. BGP routing automatically translates and routes packets to Tunnel B if Tunnel A fails, preserving the hybrid pipeline link."
                </div>

              </div>

              {/* Action trigger */}
              <button
                onClick={triggerVpnTraffic}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 active:scale-95 transition-all shadow"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Dispatch Hybrid VPN Traffic
              </button>

            </div>

            {/* Redundancy Graphics Diagram & parsed logs */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden da-svg-bg flex flex-col justify-between min-h-[440px]">
              
              {vpnSimState === 'tunneling_a' && (
                <span className="absolute top-3 left-3 bg-emerald-100 border border-emerald-300 text-emerald-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl select-none z-10 animate-bounce">
                  🟢 ROUTING VIA PRIMARY TUNNEL A (IPsec Active)
                </span>
              )}
              {vpnSimState === 'tunneling_b' && (
                <span className="absolute top-3 left-3 bg-amber-100 border border-amber-300 text-amber-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl select-none z-10 animate-pulse">
                  ⚠️ TUNNEL A FAILED - COMPLIANT AUTO FAILOVER TO TUNNEL B ACTIVE
                </span>
              )}
              {vpnSimState === 'outage' && (
                <span className="absolute top-3 left-3 bg-rose-100 border border-rose-300 text-rose-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl select-none z-10 animate-shake">
                  🚨 VPN OUTAGE - HYBRID BRIDGE OFFLINE
                </span>
              )}

              {/* SVG redundant VPN tunnels */}
              <div className="w-full flex-grow flex flex-col items-center justify-center mt-6">
                <svg className="w-full max-w-[580px] h-[290px]" viewBox="0 0 580 290">
                  <defs>
                    <marker id="arrow-vpn" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
                    </marker>
                    <marker id="arrow-dual" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#64748b" />
                    </marker>
                  </defs>

                  {/* ==================== AWS SIDE (TOP) ==================== */}
                  {/* VPC Bounding Box */}
                  <rect x="20" y="10" width="540" height="98" rx="8" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,2" />
                  <text x="30" y="22" fill="#2563eb" fontSize="8" fontWeight="black">AWS VPC BOUNDARY</text>

                  {/* Private Subnet */}
                  <rect x="80" y="25" width="220" height="70" rx="6" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,2" />
                  <text x="88" y="34" fill="#1e3a8a" fontSize="7" fontWeight="bold">Private Subnet</text>

                  {/* Security Group (SG) */}
                  <rect x="135" y="42" width="105" height="46" rx="4" fill="none" stroke="#10b981" strokeWidth="1.5" />
                  <text x="141" y="52" fill="#047857" fontSize="6.5" fontWeight="bold">SG (Stateful)</text>

                  {/* Private Server Chip inside SG */}
                  <g transform="translate(172, 57)">
                    <rect x="0" y="0" width="30" height="24" rx="2" fill="#f0fdf4" stroke="#10b981" strokeWidth="1" />
                    <line x1="5" y1="6" x2="25" y2="6" stroke="#10b981" strokeWidth="1.5" />
                    <line x1="5" y1="12" x2="25" y2="12" stroke="#10b981" strokeWidth="1.5" />
                    <line x1="5" y1="18" x2="25" y2="18" stroke="#10b981" strokeWidth="1.5" />
                    <circle cx="25" cy="6" r="1" fill="#10b981" />
                    <circle cx="25" cy="12" r="1" fill="#10b981" />
                    <circle cx="25" cy="18" r="1" fill="#10b981" />
                  </g>

                  {/* Route Table (route propagation enabled) */}
                  <g transform="translate(320, 28)">
                    <rect x="0" y="0" width="125" height="44" rx="4" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.2" />
                    <rect x="6" y="6" width="12" height="10" rx="1" fill="#3b82f6" />
                    <line x1="10" y1="11" x2="24" y2="11" stroke="#3b82f6" strokeWidth="1" />
                    <text x="24" y="14" fill="#f8fafc" fontSize="6.5" fontWeight="black">Route Table</text>
                    <text x="24" y="24" fill="#38bdf8" fontSize="5.5" fontWeight="bold">Propagation: ENABLED</text>
                    <line x1="24" y1="32" x2="115" y2="32" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="2,2" />
                  </g>

                  {/* Virtual Private Gateway (VGW) at the bottom of the VPC box */}
                  <g transform="translate(290, 102)" className={vpnSimState !== 'idle' && vpnSimState !== 'outage' ? 'da-sim-node-active' : ''}>
                    <circle cx="0" cy="0" r="14" fill="#eff6ff" stroke="#2563eb" strokeWidth="2.5" />
                    {/* Lock vector */}
                    <rect x="-5" y="-2" width="10" height="8" rx="1" fill="#2563eb" />
                    <path d="M -3 -2 V -5 A 3 3 0 0 1 3 -5 V -2" fill="none" stroke="#2563eb" strokeWidth="1.2" />
                    <text x="0" y="19" fill="#1e3a8a" fontSize="6.5" fontWeight="black" textAnchor="middle">VGW Gateway</text>
                  </g>


                  {/* ==================== IPSec TUNNELS (MIDDLE) ==================== */}
                  {/* Left Tunnel to NAT Device */}
                  <line x1="276" y1="108" x2="165" y2="202" 
                    stroke={!tunnelAActive ? '#f43f5e' : vpnSimState === 'tunneling_a' ? '#10b981' : '#94a3b8'} 
                    strokeWidth={vpnSimState === 'tunneling_a' ? '3' : '1.8'} 
                    strokeDasharray={vpnSimState === 'tunneling_a' ? 'none' : '3,3'}
                    className={vpnSimState === 'tunneling_a' ? 'da-flow-green' : ''}
                  />
                  {/* Left Encrypted Lock badge */}
                  <g transform="translate(205, 145)">
                    <circle cx="0" cy="0" r="7" fill={!tunnelAActive ? '#fff1f2' : '#ecfdf5'} stroke={!tunnelAActive ? '#f43f5e' : '#10b981'} strokeWidth="1.2" />
                    <rect x="-3" y="-1.5" width="6" height="5" rx="0.5" fill={!tunnelAActive ? '#f43f5e' : '#10b981'} />
                    <path d="M -2 -1.5 V -3.5 A 2 2 0 0 1 2 -3.5 V -1.5" fill="none" stroke={!tunnelAActive ? '#f43f5e' : '#10b981'} strokeWidth="0.8" />
                    <text x="10" y="2" fill="#475569" fontSize="6" fontWeight="bold">IPSec A (encrypted)</text>
                  </g>

                  {/* Center "or" conditional */}
                  <circle cx="290" cy="148" r="9" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="290" y="150.5" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">or</text>

                  {/* Right Tunnel to CGW */}
                  <line x1="304" y1="108" x2="415" y2="202" 
                    stroke={!tunnelBActive ? '#f43f5e' : vpnSimState === 'tunneling_b' ? '#10b981' : '#94a3b8'} 
                    strokeWidth={vpnSimState === 'tunneling_b' ? '3' : '1.8'} 
                    strokeDasharray={vpnSimState === 'tunneling_b' ? 'none' : '3,3'}
                    className={vpnSimState === 'tunneling_b' ? 'da-flow-green' : ''}
                  />
                  {/* Right Encrypted Lock badge */}
                  <g transform="translate(345, 145)">
                    <circle cx="0" cy="0" r="7" fill={!tunnelBActive ? '#fff1f2' : '#ecfdf5'} stroke={!tunnelBActive ? '#f43f5e' : '#10b981'} strokeWidth="1.2" />
                    <rect x="-3" y="-1.5" width="6" height="5" rx="0.5" fill={!tunnelBActive ? '#f43f5e' : '#10b981'} />
                    <path d="M -2 -1.5 V -3.5 A 2 2 0 0 1 2 -3.5 V -1.5" fill="none" stroke={!tunnelBActive ? '#f43f5e' : '#10b981'} strokeWidth="0.8" />
                    <text x="10" y="2" fill="#475569" fontSize="6" fontWeight="bold">IPSec B (encrypted)</text>
                  </g>


                  {/* ==================== ON-PREMISES DC (BOTTOM) ==================== */}
                  {/* Corporate DC boundary box */}
                  <rect x="20" y="202" width="540" height="84" rx="8" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="4,2" />
                  <text x="30" y="213" fill="#a855f7" fontSize="8" fontWeight="black">CORPORATE DATA CENTER BOUNDARY</text>

                  {/* Left Egress Point: NAT Device (Public IP) */}
                  <g transform="translate(110, 218)">
                    <rect x="0" y="0" width="110" height="26" rx="4" fill="#faf5ff" stroke="#a855f7" strokeWidth="1.2" />
                    <text x="55" y="11" fill="#6b21a8" fontSize="6.5" fontWeight="black" textAnchor="middle">NAT Device</text>
                    <text x="55" y="20" fill="#7c3aed" fontSize="5.5" fontWeight="bold" textAnchor="middle">Public IP: 198.51.100.10</text>
                  </g>

                  {/* Right Egress Point: Customer Gateway (Public IP) */}
                  <g transform="translate(350, 218)">
                    <rect x="0" y="0" width="125" height="26" rx="4" fill="#faf5ff" stroke="#a855f7" strokeWidth="1.2" />
                    <text x="62.5" y="11" fill="#6b21a8" fontSize="6.5" fontWeight="black" textAnchor="middle">Customer Gateway (CGW)</text>
                    <text x="62.5" y="20" fill="#7c3aed" fontSize="5.5" fontWeight="bold" textAnchor="middle">Public IP: 198.51.100.22</text>
                  </g>

                  {/* CGW Private IP (Internal Customer Gateway) */}
                  <g transform="translate(70, 252)">
                    <rect x="0" y="0" width="180" height="22" rx="4" fill="#ffffff" stroke="#a855f7" strokeWidth="1.2" />
                    <circle cx="12" cy="11" r="5" fill="#faf5ff" stroke="#a855f7" strokeWidth="0.8" />
                    <path d="M 9 11 H 15 M 12 8 V 14" stroke="#6b21a8" strokeWidth="0.8" />
                    <text x="24" y="14" fill="#4c1d95" fontSize="6.5" fontWeight="black">Customer Gateway (Private IP)</text>
                  </g>

                  {/* Double-sided arrow between NAT Device and Private CGW */}
                  <path d="M 165 245 V 251" fill="none" stroke="#64748b" strokeWidth="1.2" markerStart="url(#arrow-dual)" markerEnd="url(#arrow-dual)" />

                  {/* Corporate Internal Server Node */}
                  <g transform="translate(290, 248)">
                    <rect x="0" y="0" width="80" height="26" rx="4" fill="#f8fafc" stroke="#64748b" strokeWidth="1.2" />
                    <text x="40" y="11" fill="#334155" fontSize="7" fontWeight="black" textAnchor="middle">Internal Server</text>
                    <text x="40" y="20" fill="#475569" fontSize="5.5" fontWeight="bold" textAnchor="middle">IP: 192.168.10.15</text>
                  </g>
                </svg>
                <span className="text-[9px] text-slate-400 font-bold mt-2 text-center max-w-lg">
                  💡 <i>NAT device allows many private on-premise internal servers to securely share one public EIP to route encrypted payload tunnels back to the VPC Virtual Gateway.</i>
                </span>
              </div>

              {/* Logs output terminal */}
              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto border border-slate-800 shadow-inner mt-4">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5 text-slate-400">
                  <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4 text-rose-400" /> VPC Flow Logs &amp; CGW Tunnel Terminal</span>
                  <span>System: flowlogs-capture</span>
                </div>
                {vpnLogs.length === 0 ? (
                  <div className="text-slate-500 italic text-center py-2">Select VPN parameters and click "Dispatch hybrid traffic". Turn Flow Logs ON to stream active logs.</div>
                ) : (
                  vpnLogs.map((log, idx) => (
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
      {/* TAB 6: ARCHITECT'S NOTEBOOK BLUEPRINTS                                    */}
      {/* ========================================================================= */}
      {activeTab === 'notebook' && (
        <div className="space-y-6 animate-fadeIn text-left">
          <div className="card text-left">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
              <BookOpen className="w-5 h-5 text-indigo-600" /> VPC Networking &amp; Routing Notes
            </h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-sans font-semibold">
              Master virtual private clouds (VPC) network planning, subnets routing tables, NAT gateways, VPC peering boundaries, Transit Gateway routing, and VPC endpoints.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Collapsible Categories Directory Sidebar */}
            <div className="lg:col-span-3 space-y-4 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">VPC Directory Tree:</span>
              
              <div className="acad-dir-container">
                <div className="acad-dir-header">
                  <Network className="w-4 h-4 text-indigo-400" />
                  <span>Module Explorer</span>
                </div>

                {/* CATEGORY 1: VPC CORE ARCHITECTURE */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'core' ? '' : 'core')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-500" />
                      1. VPC Core &amp; Subnets
                    </span>
                    {expandedCategory === 'core' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'core' && (
                    <div className="bg-slate-50/50 py-1 border-b border-slate-100">
                      <button 
                        onClick={() => setSelectedNote('public_private_ip')}
                        className={`acad-dir-item-btn ${selectedNote === 'public_private_ip' ? 'acad-active' : ''}`}
                      >
                        Public vs Private IP
                      </button>
                      <button 
                        onClick={() => setSelectedNote('default_vpc')}
                        className={`acad-dir-item-btn ${selectedNote === 'default_vpc' ? 'acad-active' : ''}`}
                      >
                        Default VPC Architecture
                      </button>
                      <button 
                        onClick={() => setSelectedNote('vpc_subnet')}
                        className={`acad-dir-item-btn ${selectedNote === 'vpc_subnet' ? 'acad-active' : ''}`}
                      >
                        VPC Subnet Details
                      </button>
                      <button 
                        onClick={() => setSelectedNote('internet_gateway')}
                        className={`acad-dir-item-btn ${selectedNote === 'internet_gateway' ? 'acad-active' : ''}`}
                      >
                        Internet Gateway (IGW)
                      </button>
                    </div>
                  )}
                </div>

                {/* CATEGORY 2: EGRESS & ACCESS PIPELINES */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'egress' ? '' : 'egress')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                      2. Egress &amp; Bastions
                    </span>
                    {expandedCategory === 'egress' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'egress' && (
                    <div className="bg-slate-50/50 py-1 border-b border-slate-100">
                      <button 
                        onClick={() => setSelectedNote('bastion_host')}
                        className={`acad-dir-item-btn ${selectedNote === 'bastion_host' ? 'acad-active' : ''}`}
                      >
                        Bastion SSH Tunnels
                      </button>
                      <button 
                        onClick={() => setSelectedNote('nat_instance')}
                        className={`acad-dir-item-btn ${selectedNote === 'nat_instance' ? 'acad-active' : ''}`}
                      >
                        NAT Instances (Outdated)
                      </button>
                      <button 
                        onClick={() => setSelectedNote('nat_gateway')}
                        className={`acad-dir-item-btn ${selectedNote === 'nat_gateway' ? 'acad-active' : ''}`}
                      >
                        AWS NAT Gateway
                      </button>
                    </div>
                  )}
                </div>

                {/* CATEGORY 3: PERIMETER SECURITY */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'security' ? '' : 'security')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-500" />
                      3. Subnet Security
                    </span>
                    {expandedCategory === 'security' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'security' && (
                    <div className="bg-slate-50/50 py-1 border-b border-slate-100">
                      <button 
                        onClick={() => setSelectedNote('network_acl')}
                        className={`acad-dir-item-btn ${selectedNote === 'network_acl' ? 'acad-active' : ''}`}
                      >
                        Network ACL (NACL)
                      </button>
                      <button 
                        onClick={() => setSelectedNote('default_nacl')}
                        className={`acad-dir-item-btn ${selectedNote === 'default_nacl' ? 'acad-active' : ''}`}
                      >
                        Default vs Custom NACL
                      </button>
                      <button 
                        onClick={() => setSelectedNote('ephemeral_ports')}
                        className={`acad-dir-item-btn ${selectedNote === 'ephemeral_ports' ? 'acad-active' : ''}`}
                      >
                        Ephemeral Ports Range
                      </button>
                    </div>
                  )}
                </div>

                {/* CATEGORY 4: INTRA-AWS PEERING */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'peering' ? '' : 'peering')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" />
                      4. Peering &amp; Endpoints
                    </span>
                    {expandedCategory === 'peering' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'peering' && (
                    <div className="bg-slate-50/50 py-1 border-b border-slate-100">
                      <button 
                        onClick={() => setSelectedNote('vpc_peering')}
                        className={`acad-dir-item-btn ${selectedNote === 'vpc_peering' ? 'acad-active' : ''}`}
                      >
                        VPC Peering Paths
                      </button>
                      <button 
                        onClick={() => setSelectedNote('vpc_endpoints')}
                        className={`acad-dir-item-btn ${selectedNote === 'vpc_endpoints' ? 'acad-active' : ''}`}
                      >
                        VPC Endpoints &amp; Link
                      </button>
                      <button 
                        onClick={() => setSelectedNote('traffic_mirroring')}
                        className={`acad-dir-item-btn ${selectedNote === 'traffic_mirroring' ? 'acad-active' : ''}`}
                      >
                        VPC Traffic Mirroring
                      </button>
                    </div>
                  )}
                </div>

                {/* CATEGORY 5: HYBRID NETWORKING */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'hybrid' ? '' : 'hybrid')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Wifi className="w-3.5 h-3.5 text-indigo-500" />
                      5. Hybrid &amp; Gateways
                    </span>
                    {expandedCategory === 'hybrid' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'hybrid' && (
                    <div className="bg-slate-50/50 py-1 border-b border-slate-100">
                      <button 
                        onClick={() => setSelectedNote('site_to_site_vpn')}
                        className={`acad-dir-item-btn ${selectedNote === 'site_to_site_vpn' ? 'acad-active' : ''}`}
                      >
                        Site-to-Site VPN
                      </button>
                      <button 
                        onClick={() => setSelectedNote('vpn_cloudhub')}
                        className={`acad-dir-item-btn ${selectedNote === 'vpn_cloudhub' ? 'acad-active' : ''}`}
                      >
                        AWS VPN CloudHub
                      </button>
                      <button 
                        onClick={() => setSelectedNote('direct_connect')}
                        className={`acad-dir-item-btn ${selectedNote === 'direct_connect' ? 'acad-active' : ''}`}
                      >
                        AWS Direct Connect
                      </button>
                      <button 
                        onClick={() => setSelectedNote('transit_gateway')}
                        className={`acad-dir-item-btn ${selectedNote === 'transit_gateway' ? 'acad-active' : ''}`}
                      >
                        AWS Transit Gateway
                      </button>
                    </div>
                  )}
                </div>

                {/* CATEGORY 6: TELEMETRY & LOGS */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'logging' ? '' : 'logging')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-indigo-500" />
                      6. Telemetry &amp; Logs
                    </span>
                    {expandedCategory === 'logging' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'logging' && (
                    <div className="bg-slate-50/50 py-1">
                      <button 
                        onClick={() => setSelectedNote('flow_logs')}
                        className={`acad-dir-item-btn ${selectedNote === 'flow_logs' ? 'acad-active' : ''}`}
                      >
                        VPC Flow Logs Ingestion
                      </button>
                      <button 
                        onClick={() => setSelectedNote('flow_logs_arch')}
                        className={`acad-dir-item-btn ${selectedNote === 'flow_logs_arch' ? 'acad-active' : ''}`}
                      >
                        Flow Logs Architecture
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-[11px] leading-relaxed text-slate-400 font-semibold space-y-1">
                <span className="text-white font-extrabold flex items-center gap-1.5 mb-1 text-[11.5px]">
                  <Info className="w-3.5 h-3.5 text-indigo-400" /> Academy Advice
                </span>
                "Choose any module from the tree above. Each view includes an architectural diagram, custom telemetry engine, and standard feature matrix."
              </div>
            </div>

            {/* Right: Active Academy Workspaces */}
            <div className="lg:col-span-9 space-y-6 text-left">

              {/* ========================================================================= */}
              {/* CONCEPT 1: PUBLIC VS PRIVATE IP                                           */}
              {/* ========================================================================= */}
              {selectedNote === 'public_private_ip' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">VPC Core IP Addressing</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">Public vs Private IP Routing</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('cidr')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Info className="w-3 h-3" /> Go to Subnet Calculator
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 1 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    IP Addressing is the absolute foundation of VPC systems. AWS implements standard IPv4 segmentation separating globally routable public destinations from RFC 1918 private networking blocks.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 block">Core Architecture Characteristics:</span>
                      <table className="acad-table">
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            <th>Public IPv4 Address</th>
                            <th>Private IPv4 Address</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="font-extrabold">Internet Routability</td>
                            <td className="text-emerald-700 font-bold">Directly over public web</td>
                            <td className="text-slate-500">Subnet local boundary only</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">RFC Range mapping</td>
                            <td>Dynamic AWS pools</td>
                            <td className="font-mono text-[11px] text-blue-700">10.0.0.0/8, 172.16.0.0/12</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">Billing &amp; Cost</td>
                            <td className="text-rose-600 font-extrabold">$0.005/hr (Since Feb 2024)</td>
                            <td className="text-emerald-600 font-extrabold">100% Free inside VPC</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="acad-takeaway-box">
                        <strong>💡 Professional Architect Takeaway:</strong><br />
                        As of February 1, 2024, AWS bills for all public IPv4 addresses (including active Elastic IPs) to encourage migration to IPv6. Always release idle public IPs to avoid unexpected recurring operational charges!
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Address Space Mapping Simulator</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Toggle between Public and Private network mapping paths</p>
                      </div>

                      <div className="flex justify-center my-4">
                        <svg className="w-full max-w-[280px] h-[120px]" viewBox="0 0 280 120">
                          {/* Internet edge */}
                          <rect x="10" y="35" width="50" height="50" rx="6" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
                          <Globe className="w-4 h-4 text-slate-500" x="27" y="44" />
                          <text x="35" y="78" fill="#475569" fontSize="6.5" fontWeight="bold" textAnchor="middle">Public Web</text>

                          {/* IGW Bridge */}
                          <line x1="60" y1="60" x2="110" y2="60" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />
                          <circle cx="110" cy="60" r="14" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2" />
                          <Network className="w-3.5 h-3.5 text-blue-600" x="103" y="53" />
                          <text x="110" y="86" fill="#1e3a8a" fontSize="6" fontWeight="extrabold" textAnchor="middle">1:1 NAT (IGW)</text>

                          {/* Private EC2 */}
                          <line x1="124" y1="60" x2="200" y2="60" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />
                          <rect x="200" y="30" width="70" height="60" rx="8" fill="#f0fdf4" stroke="#10b981" strokeWidth="2.5" />
                          <Server className="w-4 h-4 text-emerald-600" x="227" y="40" />
                          <text x="235" y="72" fill="#065f46" fontSize="7" fontWeight="bold" textAnchor="middle">EC2 Instance</text>
                          <text x="235" y="82" fill="#047857" fontSize="5.5" fontWeight="black" textAnchor="middle">10.0.1.15 (Private)</text>

                          {/* Route overlays */}
                          <line x1="60" y1="60" x2="200" y2="60" stroke="#10b981" strokeWidth="3" className="da-flow-fast" />
                        </svg>
                      </div>

                      <div className="p-3 bg-slate-900 rounded-xl font-mono text-[9px] text-slate-400">
                        <span className="text-emerald-400 block font-bold mb-1">&gt; IP Telemetry status:</span>
                        Host resolves incoming public lookup at Internet Gateway. Gateway translates header to local VPC Private subnet node (10.0.1.15) statefully.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 2: DEFAULT VPC                                                    */}
              {/* ========================================================================= */}
              {selectedNote === 'default_vpc' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">VPC Core IP Addressing</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">Default VPC Architecture</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('cidr')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Info className="w-3 h-3" /> Go to Subnet Calculator
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 2 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    A Default VPC is automatically created in every region for new AWS accounts. It ensures developers can deploy workloads (such as RDS or EC2 clusters) immediately without manual routing and subnet calculations.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 block">Structural Comparison Table:</span>
                      <table className="acad-table">
                        <thead>
                          <tr>
                            <th>Metric</th>
                            <th>Default VPC</th>
                            <th>Custom VPC</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="font-extrabold">IPv4 Range block</td>
                            <td className="font-mono">172.31.0.0/16</td>
                            <td>User Defined (e.g. 10.0.0.0/16)</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">Subnets creation</td>
                            <td className="text-emerald-700 font-bold">1 per AZ (with public routes)</td>
                            <td className="text-rose-700 font-bold">Zero created at start</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">IGW state</td>
                            <td>Pre-attached and active</td>
                            <td>Must create &amp; attach manually</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">DNS resolution</td>
                            <td>Hostnames enabled by default</td>
                            <td>Disabled by default (needs config)</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="acad-takeaway-box">
                        <strong>🛡️ Security Warning:</strong><br />
                        Because Default VPC subnets assign public IP addresses to EC2 instances by default, they pose a serious security risk for corporate enterprise platforms. Always provision custom VPCs to ensure isolated private network tiers!
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Default VPC Node Architecture Map</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Pre-provisioned network topologies in every AWS region</p>
                      </div>

                      <div className="border border-indigo-200/50 rounded-xl p-4 bg-indigo-50/20 space-y-3 mt-3">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-blue-100 border border-blue-200 text-blue-800 text-[9px] font-bold rounded">172.31.0.0/16</span>
                          <span className="text-[10px] text-slate-500 font-bold">Base CIDR Allocation</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-extrabold text-slate-700">
                          <div className="bg-white border border-slate-200 rounded p-2 shadow-sm">
                            <span className="text-blue-600 block mb-0.5">AZ-A Subnet</span>
                            172.31.0.0/20
                          </div>
                          <div className="bg-white border border-slate-200 rounded p-2 shadow-sm">
                            <span className="text-blue-600 block mb-0.5">AZ-B Subnet</span>
                            172.31.16.0/20
                          </div>
                          <div className="bg-white border border-slate-200 rounded p-2 shadow-sm">
                            <span className="text-blue-600 block mb-0.5">AZ-C Subnet</span>
                            172.31.32.0/20
                          </div>
                        </div>
                        <div className="p-3 bg-white border border-slate-200 rounded-xl text-[10px] text-slate-500 leading-normal">
                          🌳 <strong>Pre-attached Assets:</strong> Internet Gateway is attached to 172.31.0.0/16, with a default Route entry mapping 0.0.0.0/0 to the IGW router.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 3: VPC SUBNET & RESERVED IPS                                      */}
              {/* ========================================================================= */}
              {selectedNote === 'vpc_subnet' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">VPC Core IP Addressing</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">VPC Subnet IP Allocations &amp; AWS Reserved IPs</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('cidr')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Info className="w-3 h-3" /> Go to Subnet Calculator
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 3 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    A Subnet is a sub-division of a VPC's IP CIDR block locked to a single Availability Zone (AZ). AWS explicitly reserves **exactly five (5) IP addresses** in every subnet block for core platform services.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 text-left">
                      <span className="text-xs font-black text-slate-800 block">The 5 AWS Reserved IPs (Example Subnet: 10.0.1.0/24):</span>
                      
                      <div className="space-y-2 text-xs">
                        {ipStats.reserved.map((res, i) => (
                          <div key={i} className="flex flex-col md:flex-row justify-between gap-1 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all">
                            <div>
                              <span className="font-mono text-indigo-700 font-extrabold block text-xs">{res.ip}</span>
                              <span className="text-[10px] text-slate-500 font-bold">{res.type}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium md:max-w-xs md:text-right">{res.reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Subnet Capacity Interactive Evaluator</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Toggle prefix mask size to watch usable vs reserved IP allocations</p>
                      </div>

                      <div className="space-y-3 my-4">
                        <div className="flex gap-2">
                          {[24, 25, 26, 27, 28].map((mask) => (
                            <button
                              key={mask}
                              onClick={() => setSubnetMaskSize(mask)}
                              className={`flex-grow py-2 rounded-xl text-xs font-black transition-all ${
                                subnetMaskSize === mask
                                  ? 'bg-blue-600 text-white shadow-md'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                              }`}
                            >
                              /{mask}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="text-[10px] text-slate-400 block font-bold">Total IPs</span>
                            <strong className="text-lg font-black text-slate-800">{Math.pow(2, 32 - subnetMaskSize)}</strong>
                          </div>
                          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                            <span className="text-[10px] text-rose-400 block font-bold">AWS Reserved</span>
                            <strong className="text-lg font-black text-rose-800">5</strong>
                          </div>
                          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl animate-pulse">
                            <span className="text-[10px] text-emerald-400 block font-bold">Usable IPs</span>
                            <strong className="text-lg font-black text-emerald-800">{Math.pow(2, 32 - subnetMaskSize) - 5}</strong>
                          </div>
                        </div>
                      </div>

                      <div className="acad-takeaway-box">
                        <strong>💡 Expert Pro Tip:</strong><br />
                        AWS does not support classical local network broadcasts. The final IP in any subnet block (e.g. `.255` in a `/24` subnet) is reserved internally and cannot be assigned to hosts.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 4: INTERNET GATEWAY (IGW)                                         */}
              {/* ========================================================================= */}
              {selectedNote === 'internet_gateway' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">VPC Core IP Addressing</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">Internet Gateway (IGW)</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('pipelines')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Activity className="w-3 h-3" /> Go to Pipelines Simulator
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 4 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    An Internet Gateway (IGW) is a horizontally scaled, highly available, redundant VPC component that enables communication between public subnets in your VPC and the internet. It does not introduce availability bottlenecks or bandwidth limits.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 block">Critical Architectural Constraints:</span>
                      <ul className="list-disc pl-4 text-xs text-slate-500 space-y-2 leading-relaxed">
                        <li>A VPC can be attached to **exactly one (1) Internet Gateway** at any given time.</li>
                        <li>An IGW maps public Elastic IP addresses directly to instances using a **1:1 static Network Address Translation (NAT)** layer.</li>
                        <li>To allow external traffic, target subnets must have a route table entry pointing `0.0.0.0/0` directly to the attached `igw-xxxxxxxx` identifier.</li>
                      </ul>

                      <div className="acad-takeaway-box">
                        <strong>💡 Professional Audit Tip:</strong><br />
                        If instances inside a public subnet lack internet access, verify that: (1) public DNS hostnames are enabled, (2) the default route table directs 0.0.0.0/0 to the IGW, and (3) a public IP address is assigned to the instance ENI.
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">IGW Bidirectional Translation Diagram</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Packet routing through the Internet Gateway</p>
                      </div>

                      <div className="flex justify-center py-4 bg-slate-50/50 rounded-2xl border border-slate-100 my-3">
                        <svg className="w-full max-w-[280px] h-[90px]" viewBox="0 0 280 90">
                          {/* IGW Router */}
                          <rect x="110" y="20" width="60" height="50" rx="8" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2.5" />
                          <Network className="w-5 h-5 text-blue-600" x="128" y="28" />
                          <text x="140" y="60" fill="#1e3a8a" fontSize="7.5" fontWeight="black" textAnchor="middle">IGW Router</text>

                          {/* Flow lines */}
                          <path d="M 20 45 H 105" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="4,2" />
                          <path d="M 175 45 H 260" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4,2" />
                          
                          <text x="50" y="38" fill="#475569" fontSize="6.5" fontWeight="bold">Outbound Request</text>
                          <text x="215" y="38" fill="#047857" fontSize="6.5" fontWeight="bold">Stateful Translation</text>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 5: BASTION HOST                                                   */}
              {/* ========================================================================= */}
              {selectedNote === 'bastion_host' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Egress &amp; Ingress Access</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">Bastion Host Secure SSH Hops</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('pipelines')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Activity className="w-3 h-3" /> Go to Pipelines Simulator
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 5 of 19</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-6 space-y-4">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        To manage servers located inside isolated private subnets, security architects place a hardened **Bastion Host** inside a public subnet. Access rules are strictly limited to corporate IP CIDRs.
                      </p>

                      <table className="acad-table">
                        <thead>
                          <tr>
                            <th>Security Group ENI</th>
                            <th>Port / Protocol</th>
                            <th>Allowed Source</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="font-extrabold text-blue-600">Bastion SG</td>
                            <td className="font-mono text-slate-500">22 (TCP SSH)</td>
                            <td className="font-extrabold text-slate-800">Restricted Corp CIDR Only</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold text-emerald-600">Private EC2 SG</td>
                            <td className="font-mono text-slate-500">22 (TCP SSH)</td>
                            <td className="font-extrabold text-indigo-700">Bastion's Security Group ID</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="acad-takeaway-box">
                        <strong>🛡️ Bastion Security Best Practice:</strong><br />
                        Bastion hosts should never hold static private SSH credentials in local volumes. Swapping credentials dynamically using AWS Systems Manager Session Manager or EC2 Instance Connect blocks public scan sweeps.
                      </div>
                    </div>

                    <div className="md:col-span-6 flex flex-col justify-between bg-slate-50/50 border border-slate-200 rounded-2xl p-5 min-h-[380px] relative overflow-hidden">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-250 mb-3">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Multi-Hop SSH Tunnel Simulator</span>
                          <span className="text-[9px] text-slate-500 block">Select target mode and initiate tracing</span>
                        </div>
                        <div className="flex bg-slate-200 p-0.5 rounded-lg text-[9px] font-bold">
                          <button
                            onClick={() => { setBastionTargetMode('single'); setBastionSimStep(0); }}
                            className={`px-2 py-1 rounded transition-all ${bastionTargetMode === 'single' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                          >
                            Single
                          </button>
                          <button
                            onClick={() => { setBastionTargetMode('multi'); setBastionSimStep(0); }}
                            className={`px-2 py-1 rounded transition-all ${bastionTargetMode === 'multi' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                          >
                            Multi-Hop
                          </button>
                        </div>
                      </div>

                      {/* Simulator SVG */}
                      <div className="w-full flex-grow flex items-center justify-center py-2">
                        <svg className="w-full max-w-[280px] h-[140px]" viewBox="0 0 280 140">
                          {/* Client Node */}
                          <g transform="translate(10, 55)">
                            <rect x="0" y="0" width="30" height="24" rx="4" fill="#1e293b" />
                            <Terminal className="w-3 h-3 text-slate-300" x="9" y="5" />
                          </g>

                          {/* Public Subnet Box */}
                          <rect x="55" y="15" width="80" height="110" rx="8" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,2" />
                          <text x="60" y="25" fill="#047857" fontSize="5.5" fontWeight="bold">Public Subnet</text>

                          {/* Bastion Node */}
                          <g transform="translate(70, 50)" className={bastionSimStep === 3 || bastionSimStep === 4 ? 'da-sim-node-active' : ''}>
                            <rect x="0" y="0" width="50" height="30" rx="6" fill={bastionSimStep >= 3 ? '#ecfdf5' : '#ffffff'} stroke={bastionSimStep >= 3 ? '#10b981' : '#94a3b8'} strokeWidth="1.8" />
                            <text x="25" y="14" fill="#1e293b" fontSize="6.5" fontWeight="bold" textAnchor="middle">Bastion</text>
                            <text x="25" y="24" fill="#047857" fontSize="5" fontWeight="black" textAnchor="middle">Port 22</text>
                          </g>

                          {/* Private Subnet Box */}
                          <rect x="150" y="15" width="120" height="110" rx="8" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                          <text x="155" y="25" fill="#b91c1c" fontSize="5.5" fontWeight="bold">Private Subnet</text>

                          {/* Private EC2 */}
                          <g transform="translate(165, 50)" className={bastionSimStep === 6 ? 'da-sim-node-active' : ''}>
                            <rect x="0" y="0" width="45" height="30" rx="6" fill={bastionSimStep >= 6 ? '#fef2f2' : '#ffffff'} stroke={bastionSimStep >= 6 ? '#ef4444' : '#94a3b8'} strokeWidth="1.8" />
                            <text x="22.5" y="14" fill="#1e293b" fontSize="6.5" fontWeight="bold" textAnchor="middle">Private EC2</text>
                            <text x="22.5" y="24" fill="#b91c1c" fontSize="5.5" textAnchor="middle">SG: Allow Hop</text>
                          </g>

                          {/* Multi target node if applicable */}
                          {bastionTargetMode === 'multi' && (
                            <g transform="translate(220, 50)" className={bastionSimStep === 6 ? 'da-sim-node-active' : ''}>
                              <rect x="0" y="0" width="45" height="30" rx="6" fill={bastionSimStep >= 6 ? '#fef2f2' : '#ffffff'} stroke={bastionSimStep >= 6 ? '#ef4444' : '#94a3b8'} strokeWidth="1.8" />
                              <text x="22.5" y="14" fill="#1e293b" fontSize="6" fontWeight="bold" textAnchor="middle">Database</text>
                              <text x="22.5" y="24" fill="#b91c1c" fontSize="5" textAnchor="middle">Port 3306</text>
                            </g>
                          )}

                          {/* Sim Flow lines */}
                          {bastionSimStep === 1 && <line x1="40" y1="67" x2="68" y2="67" stroke="#3b82f6" strokeWidth="2.5" className="da-flow-fast" />}
                          {bastionSimStep === 2 && <line x1="40" y1="67" x2="68" y2="67" stroke="#10b981" strokeWidth="2.5" className="da-flow-fast" />}
                          {bastionSimStep === 5 && (
                            <>
                              <path d="M 120 67 H 165" fill="none" stroke="#3b82f6" strokeWidth="2.5" className="da-flow-fast" />
                              {bastionTargetMode === 'multi' && <path d="M 210 67 H 220" fill="none" stroke="#3b82f6" strokeWidth="2.5" className="da-flow-fast" />}
                            </>
                          )}
                        </svg>
                      </div>

                      {/* Terminal Logs */}
                      <div className="space-y-2 mt-2">
                        <button
                          onClick={runBastionStepSim}
                          disabled={bastionSimStep > 0 && bastionSimStep < 6}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-750 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
                        >
                          {bastionSimStep > 0 && bastionSimStep < 6 ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Launch SSH Multi-Hop Trace'}
                        </button>

                        <div className="acad-terminal text-[9px] min-h-[70px] max-h-[70px] overflow-y-auto leading-normal">
                          {bastionLogs.length === 0 ? (
                            <span className="text-slate-500 italic">Logs terminal ready. Initiate SSH trace...</span>
                          ) : (
                            bastionLogs.map((log, idx) => (
                              <div key={idx} className="flex gap-1.5">
                                <span className="text-blue-500 select-none">&gt;&gt;</span>
                                <span>{log}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 6: NAT INSTANCES (OUTDATED)                                       */}
              {/* ========================================================================= */}
              {selectedNote === 'nat_instance' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Egress &amp; Access Pipelines</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">NAT Instances (Outdated Legacy EC2)</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('pipelines')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Activity className="w-3 h-3" /> Go to Pipelines Simulator
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 6 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    NAT Instances are standard Amazon EC2 instances running custom NAT Linux AMIs. They represent a legacy self-managed routing option before managed NAT Gateways were introduced.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 block">Legacy Architectural Hurdles:</span>
                      <ul className="list-disc pl-4 text-xs text-slate-500 space-y-2 leading-relaxed">
                        <li><strong className="text-rose-700">Source/Destination Check Trap:</strong> By default, EC2 instances drop packets that are not destined for their own MAC/IP. To route outbound NAT flows, you must manually **disable the Source/Destination check** on the NAT EC2 ENI!</li>
                        <li><strong>Single Point of Failure:</strong> Unlike managed NAT Gateways, NAT Instances do not scale dynamically or recover from hardware host failures without complex custom script integrations.</li>
                        <li><strong>Custom Security Groups:</strong> They require active security group configurations to permit inbound subnets and outbound targets.</li>
                      </ul>

                      <div className="acad-takeaway-box">
                        <strong>💡 Professional Exam Gotcha:</strong><br />
                        If a legacy NAT Instance stops routing, always verify if the "Source/Destination Check" is disabled on the instance properties. If enabled, it will act as a black hole drop router!
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">NAT Instance Outbound Flow Diagram</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Visualizing self-managed EC2 translation layers</p>
                      </div>

                      <div className="flex justify-center my-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <svg className="w-full max-w-[280px] h-[100px]" viewBox="0 0 280 100">
                          {/* Private instance */}
                          <rect x="10" y="30" width="55" height="40" rx="6" fill="#f8fafc" stroke="#3b82f6" strokeWidth="1.5" />
                          <text x="37.5" y="55" fill="#1e293b" fontSize="6.5" fontWeight="bold" textAnchor="middle">Private EC2</text>

                          {/* NAT EC2 */}
                          <line x1="65" y1="50" x2="110" y2="50" stroke="#f59e0b" strokeWidth="2.5" className="da-flow-fast" />
                          <rect x="110" y="25" width="60" height="50" rx="8" fill="#fffbeb" stroke="#f59e0b" strokeWidth="2" />
                          <text x="140" y="48" fill="#b45309" fontSize="7" fontWeight="black" textAnchor="middle">NAT Instance</text>
                          <text x="140" y="60" fill="#7f1d1d" fontSize="5.5" fontWeight="black" textAnchor="middle">Disable Src/Dest!</text>

                          {/* IGW */}
                          <line x1="170" y1="50" x2="220" y2="50" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />
                          <rect x="220" y="30" width="50" height="40" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                          <text x="245" y="55" fill="#1e3a8a" fontSize="6.5" fontWeight="bold" textAnchor="middle">IGW Router</text>
                        </svg>
                      </div>

                      <div className="p-3 bg-rose-950/80 rounded-xl font-mono text-[9px] text-rose-300">
                        ⚠️ [NAT INSTANCE TELEMETRY] Throughput limited by EC2 instance CPU caps and manual configuration of NAT masquerade routes.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 7: AWS NAT GATEWAY                                                */}
              {/* ========================================================================= */}
              {selectedNote === 'nat_gateway' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Egress &amp; Access Pipelines</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">AWS Managed NAT Gateway</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('pipelines')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Activity className="w-3 h-3" /> Go to Pipelines Simulator
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 7 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    The AWS NAT Gateway is a fully managed, redundant egress routing appliance that translates private IPs to public Elastic IPs. It auto-scales dynamically up to 45 Gbps and handles stateful returns automatically.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 block">SaaS Managed Comparison Matrix:</span>
                      <table className="acad-table">
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            <th>AWS Managed NAT Gateway</th>
                            <th>Legacy NAT Instance EC2</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="font-extrabold">Auto-Scaling caps</td>
                            <td className="text-emerald-700 font-bold">Auto up to 45 Gbps</td>
                            <td>Limited by EC2 instance limits</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">Security Groups</td>
                            <td className="text-emerald-700 font-bold">None allowed or required!</td>
                            <td>Requires manual SG configuration</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">High Availability</td>
                            <td className="text-emerald-700 font-bold">Built-in (Multi-AZ AZ-local)</td>
                            <td>Manual script configuration needed</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">Source/Dest Check</td>
                            <td className="text-emerald-700 font-bold">Not applicable / automatic</td>
                            <td className="text-rose-700 font-bold">Must be disabled manually!</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="acad-takeaway-box">
                        <strong>💡 Highly Critical Egress Rule:</strong><br />
                        NAT Gateways reside entirely inside **Public Subnets** and are tied to a static public **Elastic IP Address**. Private subnet route tables map `0.0.0.0/0` outbound traffic to target the NAT Gateway, which statefully translates and routes requests to the Internet Gateway.
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-150 mb-3">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Outbound Egress Routing Simulator</span>
                          <span className="text-[9px] text-slate-500 block">Animate private server update exit pathing</span>
                        </div>
                        <div className="flex bg-slate-100 p-0.5 rounded-lg text-[9px] font-bold">
                          <button
                            onClick={() => { setNatEgressMode('gateway'); setNatSimStep(0); }}
                            className={`px-2.5 py-1 rounded transition-all ${natEgressMode === 'gateway' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                          >
                            NAT Gateway
                          </button>
                          <button
                            onClick={() => { setNatEgressMode('instance'); setNatSimStep(0); }}
                            className={`px-2.5 py-1 rounded transition-all ${natEgressMode === 'instance' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                          >
                            EC2 NAT
                          </button>
                        </div>
                      </div>

                      {/* SVG NAT */}
                      <div className="w-full flex-grow flex items-center justify-center py-2">
                        <svg className="w-full max-w-[280px] h-[120px]" viewBox="0 0 280 120">
                          {/* Private EC2 Node */}
                          <g transform="translate(10, 45)" className={natSimStep === 1 ? 'da-sim-node-active' : ''}>
                            <rect x="0" y="0" width="50" height="30" rx="4" fill={natSimStep >= 1 ? '#eff6ff' : '#ffffff'} stroke="#3b82f6" strokeWidth="1.5" />
                            <text x="25" y="14" fill="#1e293b" fontSize="6.5" fontWeight="bold" textAnchor="middle">Private EC2</text>
                            <text x="25" y="24" fill="#64748b" fontSize="5.5" textAnchor="middle">10.0.2.80</text>
                          </g>

                          {/* Managed NAT Gateway */}
                          {natEgressMode === 'gateway' ? (
                            <g transform="translate(100, 40)" className={natSimStep === 3 ? 'da-sim-node-active' : ''}>
                              <rect x="0" y="0" width="70" height="40" rx="6" fill={natSimStep >= 3 ? '#ecfdf5' : '#f8fafc'} stroke="#10b981" strokeWidth="2" />
                              <text x="35" y="16" fill="#047857" fontSize="7" fontWeight="black" textAnchor="middle">NAT Gateway</text>
                              <text x="35" y="26" fill="#065f46" fontSize="5" fontWeight="bold" textAnchor="middle">Managed Appliance</text>
                              <text x="35" y="34" fill="#4b5563" fontSize="5" fontStyle="italic" textAnchor="middle">EIP Attached</text>
                            </g>
                          ) : (
                            <g transform="translate(100, 40)" className={natSimStep === 3 ? 'da-sim-node-active' : ''}>
                              <rect x="0" y="0" width="70" height="40" rx="6" fill={natSimStep >= 3 ? '#fffbeb' : '#f8fafc'} stroke="#f59e0b" strokeWidth="1.8" />
                              <text x="35" y="16" fill="#b45309" fontSize="7.5" fontWeight="black" textAnchor="middle">NAT Instance</text>
                              <text x="35" y="26" fill="#d97706" fontSize="5.5" fontWeight="bold" textAnchor="middle">EC2 AMI Node</text>
                              <text x="35" y="34" fill="#7f1d1d" fontSize="5.5" fontWeight="black" textAnchor="middle">Disable Src/Dest!</text>
                            </g>
                          )}

                          {/* Internet Gateway */}
                          <g transform="translate(210, 45)" className={natSimStep === 4 ? 'da-sim-node-active' : ''}>
                            <rect x="0" y="0" width="60" height="30" rx="6" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.5" />
                            <text x="30" y="14" fill="#1e3a8a" fontSize="7" fontWeight="black" textAnchor="middle">IGW Router</text>
                            <text x="30" y="24" fill="#2563eb" fontSize="5.5" fontWeight="bold" textAnchor="middle">0.0.0.0/0 OK</text>
                          </g>

                          {/* Dynamic route flow path lines */}
                          {natSimStep === 1 && <line x1="60" y1="60" x2="100" y2="60" stroke="#2563eb" strokeWidth="2.5" className="da-flow-fast" />}
                          {natSimStep === 2 && <line x1="60" y1="60" x2="100" y2="60" stroke="#d97706" strokeWidth="2.5" className="da-flow-fast" />}
                          {natSimStep === 3 && <line x1="170" y1="60" x2="210" y2="60" stroke="#10b981" strokeWidth="2.5" className="da-flow-fast" />}
                        </svg>
                      </div>

                      {/* Controller Terminal Logs */}
                      <div className="space-y-2">
                        <button
                          onClick={runNatStepSim}
                          disabled={natSimStep > 0 && natSimStep < 4}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
                        >
                          {natSimStep > 0 && natSimStep < 4 ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Trigger Software Patch Update'}
                        </button>

                        <div className="acad-terminal text-[9px] min-h-[70px] max-h-[70px] overflow-y-auto leading-normal">
                          {natLogs.length === 0 ? (
                            <span className="text-slate-500 italic">Egress route logs ready. Click trigger button...</span>
                          ) : (
                            natLogs.map((log, idx) => (
                              <div key={idx} className="flex gap-1.5">
                                <span className="text-amber-500 select-none">&gt;&gt;</span>
                                <span>{log}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 8: NETWORK ACL (NACL)                                             */}
              {/* ========================================================================= */}
              {selectedNote === 'network_acl' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Perimeter &amp; Subnet Security</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">Network ACL (NACL - Stateless Perimeter Firewall)</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('security')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Shield className="w-3 h-3" /> Go to Security Rules
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 8 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    A Network Access Control List (NACL) acts as a stateless security boundary firewall at the VPC subnet boundary. It filters all inbound and outbound traffic based on strict sequential rule mappings.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 text-left">
                      <span className="text-xs font-black text-slate-800 block">Critical NACL Attributes:</span>
                      <ul className="list-disc pl-4 text-xs text-slate-500 space-y-2 leading-relaxed">
                        <li><strong>Stateless Behavior:</strong> NACLs do not keep track of TCP connection states. Inbound packets and outbound response packets must be explicitly allowed by separate rules!</li>
                        <li><strong>Sequential Rule Processing:</strong> Rules are matched sequentially starting at the lowest rule number. If a match is found (e.g. Rule 100), the packet is allowed or blocked immediately, and subsequent rules are ignored.</li>
                        <li><strong>Explicit Denies:</strong> Unlike Security Groups, NACLs allow you to define explicit **DENY** rules to block malicious scanner IP ranges at the subnet border.</li>
                      </ul>

                      <div className="acad-takeaway-box">
                        <strong>🔒 Stateful SG vs Stateless NACL:</strong><br />
                        Always place stateless NACLs at the subnet border as coarse egress/ingress blockers, and stateful Security Groups directly on instance ENIs for application-level ports mapping.
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-150 mb-3">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Stateless return Ephemeral port simulator</span>
                          <span className="text-[9px] text-slate-500 block">Toggle Ephemeral ports and watch traffic drop</span>
                        </div>
                        <button
                          onClick={() => { setNaclReturnAllowed(!naclReturnAllowed); setNaclSimStep(0); }}
                          className={`px-2 py-1 rounded text-[10px] font-black border transition-all ${
                            naclReturnAllowed ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'
                          }`}
                        >
                          Outbound Ephemeral: {naclReturnAllowed ? 'ALLOWED' : 'BLOCKED'}
                        </button>
                      </div>

                      {/* SVG NACL */}
                      <div className="w-full flex-grow flex items-center justify-center py-2">
                        <svg className="w-full max-w-[280px] h-[120px]" viewBox="0 0 280 120">
                          {/* Subnet border Box */}
                          <rect x="65" y="10" width="200" height="100" rx="8" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4,2" />
                          
                          {/* Client Node */}
                          <g transform="translate(10, 45)">
                            <rect x="0" y="0" width="35" height="24" rx="4" fill="#1e293b" />
                            <text x="17.5" y="15" fill="#cbd5e1" fontSize="5.5" fontWeight="bold" textAnchor="middle">Client Terminal</text>
                          </g>

                          {/* NACL Gate Node */}
                          <g transform="translate(75, 40)" className={naclSimStep === 2 || (naclSimStep === 5 && !naclReturnAllowed) ? 'da-sim-node-active' : ''}>
                            <rect x="0" y="0" width="50" height="35" rx="4" fill={naclSimStep >= 2 ? '#ecfdf5' : '#f8fafc'} stroke="#3b82f6" strokeWidth="1.8" />
                            <text x="25" y="14" fill="#1e3a8a" fontSize="6.5" fontWeight="black" textAnchor="middle">Stateless NACL</text>
                            <text x="25" y="24" fill="#b91c1c" fontSize="5.5" fontWeight="bold" textAnchor="middle">Rule 100</text>
                          </g>

                          {/* Security Group */}
                          <g transform="translate(180, 40)" className={naclSimStep === 3 || naclSimStep === 4 ? 'da-sim-node-active' : ''}>
                            <rect x="0" y="0" width="60" height="35" rx="6" fill={naclSimStep >= 3 ? '#f0fdf4' : '#ffffff'} stroke="#10b981" strokeWidth="1.8" />
                            <text x="30" y="14" fill="#065f46" fontSize="6.5" fontWeight="black" textAnchor="middle">Stateful SG</text>
                            <text x="30" y="24" fill="#1e293b" fontSize="5.5" textAnchor="middle">EC2 Port 80</text>
                          </g>

                          {/* Outbound path lines */}
                          {naclSimStep === 1 && <path d="M 45 57 H 75" fill="none" stroke="#2563eb" strokeWidth="2" className="da-flow-fast" />}
                          {naclSimStep === 2 && <path d="M 125 57 H 180" fill="none" stroke="#2563eb" strokeWidth="2" className="da-flow-fast" />}
                          {naclSimStep === 4 && <path d="M 180 65 H 125" fill="none" stroke="#10b981" strokeWidth="2" className="da-flow-fast" />}
                          {naclSimStep === 5 && (
                            <>
                              {naclReturnAllowed ? (
                                <path d="M 75 65 H 45" fill="none" stroke="#10b981" strokeWidth="2" className="da-flow-fast" />
                              ) : (
                                <g>
                                  <line x1="100" y1="52" x2="100" y2="70" stroke="#f43f5e" strokeWidth="3.5" />
                                  <text x="100" y="85" fill="#e11d48" fontSize="6.5" fontWeight="black" textAnchor="middle" className="animate-bounce">Dropped!</text>
                                </g>
                              )}
                            </>
                          )}
                        </svg>
                      </div>

                      {/* Controller buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={runNaclStepSim}
                          disabled={naclSimStep > 0 && naclSimStep < 5}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all animate-pulse"
                        >
                          {naclSimStep > 0 && naclSimStep < 5 ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Launch Stateless Packet Flow Check'}
                        </button>

                        <div className="acad-terminal text-[9px] min-h-[70px] max-h-[70px] overflow-y-auto leading-normal">
                          {naclLogs.length === 0 ? (
                            <span className="text-slate-500 italic">Stateless firewall telemetry log console ready...</span>
                          ) : (
                            naclLogs.map((log, idx) => (
                              <div key={idx} className="flex gap-1.5">
                                <span className="text-emerald-500 select-none">&gt;&gt;</span>
                                <span>{log}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 9: DEFAULT NACL                                                   */}
              {/* ========================================================================= */}
              {selectedNote === 'default_nacl' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Perimeter &amp; Subnet Security</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">Default Subnet NACL vs Custom Subnet NACL</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('security')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Shield className="w-3 h-3" /> Go to Security Rules
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 9 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Subnets are always associated with exactly one NACL. If you do not assign a custom ruleset, subnets attach to the VPC's Default NACL automatically.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 block">Critical Architectural Variations:</span>
                      <table className="acad-table">
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            <th>Default Subnet NACL</th>
                            <th>Custom Subnet NACL</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="font-extrabold">Inbound Rule 100</td>
                            <td className="text-emerald-700 font-bold">ALLOW ALL (0.0.0.0/0)</td>
                            <td className="text-rose-700 font-bold">DENY ALL (0.0.0.0/0)</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">Outbound Rule 100</td>
                            <td className="text-emerald-700 font-bold">ALLOW ALL (0.0.0.0/0)</td>
                            <td className="text-rose-700 font-bold">DENY ALL (0.0.0.0/0)</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">Implicit Star Rule (*)</td>
                            <td className="text-rose-600 font-extrabold">DENY ALL (Catch-All block)</td>
                            <td className="text-rose-600 font-extrabold">DENY ALL (Catch-All block)</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="acad-takeaway-box">
                        <strong>💡 Core Rule of Custom NACLs:</strong><br />
                        When you create a *Custom NACL*, it contains *only* the catch-all star `(*: DENY)` rule by default. Consequently, **all ingress and egress traffic is blocked** until you explicitly write allow rules.
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Default NACL Rules Configuration Map</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Understanding rule priorities and indices</p>
                      </div>

                      <div className="border border-indigo-200/50 bg-indigo-50/20 rounded-xl p-4 space-y-2.5 mt-3 text-xs">
                        <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                          <span className="font-extrabold text-blue-900">Rule 100:</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[9px]">ALLOW ALL</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200 opacity-60">
                          <span className="font-extrabold text-slate-700">Rule 200:</span>
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-black text-[9px]">DENY Scan block</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2 rounded border border-rose-300 bg-rose-50/20">
                          <span className="font-extrabold text-rose-800">Rule * :</span>
                          <span className="px-2 py-0.5 bg-rose-600 text-white rounded font-black text-[9px]">DENY CATCH-ALL</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          ⚠️ Rule 200 will never match because Rule 100 resolves everything first! Always write blocks at smaller rule indices than broad allows.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 10: EPHEMERAL PORTS RANGE                                         */}
              {/* ========================================================================= */}
              {selectedNote === 'ephemeral_ports' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Perimeter &amp; Subnet Security</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">Ephemeral Ports Range (Return Client Ports)</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('security')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Shield className="w-3 h-3" /> Go to Security Rules
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 10 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    An Ephemeral Port is a short-lived transport protocol port allocated automatically from a predefined range for the return path of outbound connections.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 block">The Stateless Ephemeral Port Trap:</span>
                      <ul className="list-disc pl-4 text-xs text-slate-500 space-y-2 leading-relaxed">
                        <li>Because Security Groups are **stateful**, return outbound response traffic is automatically allowed.</li>
                        <li>However, because Subnet Network ACLs are **stateless**, the outbound subnet ruleset **MUST explicitly allow traffic** returning to the client's ephemeral ports range!</li>
                        <li>If blocked, the client initiates the TCP handshake, the server responds, but the return packets are silently dropped at the stateless subnet boundary.</li>
                      </ul>

                      <table className="acad-table">
                        <thead>
                          <tr>
                            <th>Operating System</th>
                            <th>Ephemeral Port Range Allocation</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="font-extrabold">Linux kernel / AWS AL2023</td>
                            <td className="font-mono text-blue-700 text-xs">32768 - 60999</td>
                            <td>Modern default</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">Windows Server / Clients</td>
                            <td className="font-mono text-blue-700 text-xs">49152 - 65535</td>
                            <td>Microsoft dynamic allocation</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">IANA Standard range</td>
                            <td className="font-mono text-blue-700 text-xs">1024 - 65535</td>
                            <td>Broadest recommended NACL allow</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Stateless Return Flow Block Diagram</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Return pathway packet evaluation</p>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 font-mono text-[9.5px] text-slate-400 space-y-2 my-3">
                        <div className="text-slate-200">
                          <span className="text-rose-500 font-extrabold">&gt;&gt; PACKET CAPTURE OUTBOUND OUTAGE:</span>
                        </div>
                        <div>
                          SRCPrivate: <span className="text-cyan-400">10.0.1.15:80</span><br />
                          DSTPublic: <span className="text-purple-400">198.51.100.44:52331</span> (Client Ephemeral)<br />
                          EVALUATION: <span className="text-rose-500 font-bold">REJECT NACL_DROP</span><br />
                          REASON: Stateless subnet rules block outbound flow to client's temporary ephemeral port 52331.
                        </div>
                      </div>

                      <div className="acad-takeaway-box">
                        <strong>💡 Expert Architecture Best Practice:</strong><br />
                        Always configure your outbound Subnet NACLs to allow return TCP/UDP traffic to the full ephemeral port range **1024-65535** to accommodate both Linux and Windows API endpoints seamlessly.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 11: VPC PEERING                                                   */}
              {/* ========================================================================= */}
              {selectedNote === 'vpc_peering' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">VPC Peering &amp; Endpoints</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">VPC Peering Connections</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('endpoints')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Layers className="w-3 h-3" /> Go to Peering &amp; Endpoints
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 11 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    VPC Peering links two VPCs securely through private IPv4/IPv6 addresses, making them behave as if they reside inside the exact same physical computer backplane.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 block">Critical Architectural Constraints:</span>
                      <ul className="list-disc pl-4 text-xs text-slate-500 space-y-2 leading-relaxed">
                        <li><strong className="text-rose-700">No Overlapping CIDRs:</strong> You cannot peer VPCs that share identical or overlapping IP address blocks (e.g. attempting to peer two VPCs that both use `10.0.0.0/16`).</li>
                        <li><strong className="text-rose-700">Non-Transitive Routing:</strong> Peering connections are strictly point-to-point. If VPC-A is peered with VPC-B, and VPC-B is peered with VPC-C, VPC-A **cannot** route packets to VPC-C through VPC-B!</li>
                        <li><strong>Inter-Region Support:</strong> Peering operates across different AWS accounts and regions seamlessly. Data is encrypted natively over AWS's internal private fiber networks.</li>
                      </ul>

                      <div className="acad-takeaway-box">
                        <strong>💡 Enterprise Architectural Core tip:</strong><br />
                        As your cloud ecosystem scales, managing a mesh of point-to-point peering connections becomes extremely complex. If you have more than 10 VPCs, migrate to a centralized hub-and-spoke router using AWS Transit Gateway (TGW).
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Non-Transitive Routing Trap Simulation</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Attempting transit routing through a middle peer VPC hub</p>
                      </div>

                      <div className="flex justify-center my-4 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <svg className="w-full max-w-[280px] h-[100px]" viewBox="0 0 280 100">
                          {/* VPC-A */}
                          <rect x="10" y="30" width="45" height="40" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                          <text x="32.5" y="55" fill="#1e3a8a" fontSize="6.5" fontWeight="bold" textAnchor="middle">VPC A</text>

                          {/* VPC-B */}
                          <line x1="55" y1="50" x2="110" y2="50" stroke="#10b981" strokeWidth="2.5" className="da-flow-fast" />
                          <rect x="110" y="25" width="55" height="50" rx="8" fill="#f0fdf4" stroke="#10b981" strokeWidth="2" />
                          <text x="137.5" y="55" fill="#065f46" fontSize="6.5" fontWeight="black" textAnchor="middle">VPC B</text>

                          {/* VPC-C */}
                          <line x1="165" y1="50" x2="220" y2="50" stroke="#f43f5e" strokeWidth="2.5" />
                          <rect x="220" y="30" width="45" height="40" rx="6" fill="#fff5f5" stroke="#f43f5e" strokeWidth="1.5" />
                          <text x="242.5" y="55" fill="#e53e3e" fontSize="6.5" fontWeight="bold" textAnchor="middle">VPC C</text>

                          {/* Drop Icon */}
                          <line x1="190" y1="40" x2="197" y2="60" stroke="#ef4444" strokeWidth="3" />
                          <line x1="197" y1="40" x2="190" y2="60" stroke="#ef4444" strokeWidth="3" />
                        </svg>
                      </div>

                      <div className="p-3 bg-rose-950/80 rounded-xl font-mono text-[9px] text-rose-300">
                        🚨 [ROUTE DENIED] VPC A to VPC C packets dropped inside VPC B. Direct peer link or central Transit Gateway is required!
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 12: VPC ENDPOINTS                                                 */}
              {/* ========================================================================= */}
              {selectedNote === 'vpc_endpoints' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">VPC Peering &amp; Endpoints</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">VPC Gateway Endpoints vs PrivateLink Interface Endpoints</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('endpoints')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Layers className="w-3 h-3" /> Go to Peering &amp; Endpoints
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 12 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    VPC Endpoints allow private connections from your VPC to supported AWS services, bypassing the public internet without requiring an Internet Gateway or NAT Gateway.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 block">Endpoints Comparison Table:</span>
                      <table className="acad-table">
                        <thead>
                          <tr>
                            <th>Parameter</th>
                            <th>Gateway Endpoints</th>
                            <th>Interface Endpoints (PrivateLink)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="font-extrabold">Supported AWS services</td>
                            <td className="text-blue-700 font-bold">S3 &amp; DynamoDB ONLY</td>
                            <td>Dozens of services (KMS, EC2, CloudWatch, etc.)</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">Implementation Method</td>
                            <td>Route Table Target entry</td>
                            <td className="text-emerald-700 font-bold">Elastic Network Interface (ENI)</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">Hourly &amp; Data Cost</td>
                            <td className="text-emerald-700 font-bold">100% Free</td>
                            <td className="text-rose-700 font-bold">Paid hourly/gigabyte rate</td>
                          </tr>
                          <tr>
                            <td className="font-extrabold">Security Groups</td>
                            <td>Not supported</td>
                            <td className="text-emerald-700 font-bold">Supported (direct ENI attachments)</td>
                          </tr>
                        </tbody>
                      </table>

                      <div className="acad-takeaway-box">
                        <strong>💡 Professional Architect Pro Tip:</strong><br />
                        Always target Amazon S3 and DynamoDB using **Gateway Endpoints**—they are fully redundant, require zero ENI overhead, and are 100% free of charge!
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">PrivateLink Interface Architecture Map</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Private link queries routed directly to subnet local ENIs</p>
                      </div>

                      <div className="border border-emerald-250 bg-emerald-50/10 rounded-xl p-4 space-y-3 mt-3 text-xs">
                        <div className="flex justify-between items-center bg-white p-2 rounded border border-slate-200">
                          <span className="font-extrabold text-slate-700 flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-blue-600" /> Private Subnet EC2
                          </span>
                          <span className="text-slate-500 font-mono">10.0.2.80</span>
                        </div>
                        <div className="flex justify-between items-center bg-white p-2 rounded border border-emerald-300">
                          <span className="font-extrabold text-emerald-800 flex items-center gap-1.5 animate-pulse">
                            <Network className="w-3.5 h-3.5 text-emerald-500" /> PrivateLink local ENI
                          </span>
                          <span className="text-emerald-600 font-mono">10.0.2.144</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                          🌳 <strong>Secure API Traversal:</strong> Outgoing KMS API queries target the local subnet IP (10.0.2.144) instead of traversing public HTTP endpoints over public web gateways.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 13: VPC TRAFFIC MIRRORING                                         */}
              {/* ========================================================================= */}
              {selectedNote === 'traffic_mirroring' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">VPC Peering &amp; Endpoints</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">VPC Traffic Mirroring</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('endpoints')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Layers className="w-3 h-3" /> Go to Peering &amp; Endpoints
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 13 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    VPC Traffic Mirroring copies raw packet headers and payloads from an EC2 instance's Elastic Network Interface (ENI) and sends them to deep packet monitoring appliances for threat detection and compliance.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 block">Security Ingestion Attributes:</span>
                      <ul className="list-disc pl-4 text-xs text-slate-500 space-y-2 leading-relaxed">
                        <li><strong>Out-of-band Inspection:</strong> Mirrored packets do not impact the live latency, bandwidth, or performance of the primary production workload pipeline.</li>
                        <li><strong>VXLAN Encapsulation:</strong> Captured traffic is packaged inside standard **VXLAN headers (UDP Port 4789)**.</li>
                        <li><strong>IDS/IPS Routing:</strong> Mirrored packets route to Network Load Balancers or specific EC2 ENIs running packet sniffers (like Zeek, Suricata, or Wireshark).</li>
                      </ul>

                      <div className="acad-takeaway-box">
                        <strong>🛡️ Network Threat Hunting:</strong><br />
                        Traffic Mirroring is highly useful for corporate compliance audits and real-time malicious payload sweeps without deploying heavy operating system agent daemons inside application servers.
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-150 mb-3">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Traffic Mirrored Clone Simulator</span>
                          <span className="text-[9px] text-slate-500 block">Activate mirroring to copy ENI traffic</span>
                        </div>
                        <button
                          onClick={() => setMirrorEnabled(!mirrorEnabled)}
                          className={`px-3 py-1 rounded text-[10px] font-black border transition-all ${
                            mirrorEnabled ? 'bg-indigo-100 border-indigo-300 text-indigo-800' : 'bg-slate-100 border-slate-300 text-slate-800'
                          }`}
                        >
                          Mirror Stream: {mirrorEnabled ? 'ENABLED (VXLAN UDP 4789)' : 'DISABLED'}
                        </button>
                      </div>

                      {/* Mirror SVG */}
                      <div className="w-full flex-grow flex items-center justify-center py-2">
                        <svg className="w-full max-w-[280px] h-[110px]" viewBox="0 0 280 110">
                          {/* EC2 Target */}
                          <g transform="translate(10, 40)">
                            <rect x="0" y="0" width="55" height="30" rx="4" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.8" />
                            <text x="27.5" y="14" fill="#1e3a8a" fontSize="6.5" fontWeight="bold" textAnchor="middle">Prod EC2</text>
                            <text x="27.5" y="24" fill="#2563eb" fontSize="5.5" textAnchor="middle">ENI Target</text>
                          </g>

                          {/* Primary Egress Router */}
                          <g transform="translate(110, 10)">
                            <rect x="0" y="0" width="50" height="24" rx="4" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
                            <text x="25" y="14" fill="#475569" fontSize="6" fontWeight="bold" textAnchor="middle">Internet IGW</text>
                          </g>

                          {/* Mirrored packet collector */}
                          <g transform="translate(195, 65)" className={mirrorEnabled ? 'da-sim-node-active' : ''}>
                            <rect x="0" y="0" width="70" height="35" rx="6" fill={mirrorEnabled ? '#e0e7ff' : '#ffffff'} stroke={mirrorEnabled ? '#6366f1' : '#94a3b8'} strokeWidth="2" />
                            <text x="35" y="14" fill="#1e293b" fontSize="6" fontWeight="black" textAnchor="middle">IDS Collector</text>
                            <text x="35" y="24" fill="#4f46e5" fontSize="5" fontWeight="bold" textAnchor="middle">UDP Port 4789</text>
                          </g>

                          {/* Connection paths */}
                          <line x1="65" y1="55" x2="110" y2="22" stroke="#2563eb" strokeWidth="2" className="da-flow-fast" />
                          
                          {mirrorEnabled && (
                            <line x1="65" y1="55" x2="195" y2="82" stroke="#6366f1" strokeWidth="2.5" className="da-flow-fast" />
                          )}
                        </svg>
                      </div>

                      <div className="p-3 bg-slate-900 rounded-xl font-mono text-[9px] text-slate-400">
                        {mirrorEnabled ? (
                          <span className="text-indigo-400 font-bold block mb-1">Mirrored live clone packet active:</span>
                        ) : (
                          <span className="text-slate-500 italic block mb-1">Inactive:</span>
                        )}
                        Traffic clones are wrapped inside VXLAN protocols and streamed out-of-band to target security analyzers.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 14: AWS SITE-TO-SITE VPN                                          */}
              {/* ========================================================================= */}
              {selectedNote === 'site_to_site_vpn' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Hybrid Connectivity</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">AWS Site-to-Site IPSec VPN Redundancy</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('hybrid')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Wifi className="w-3 h-3" /> Go to VPN &amp; Flow Logs
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 14 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    AWS Site-to-Site VPN creates a secure, encrypted IPSec tunnel over the public internet connecting physical corporate data centers with AWS VPC Virtual Private Gateways.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 block">Redundancy Best Practices:</span>
                      <ul className="list-disc pl-4 text-xs text-slate-500 space-y-2 leading-relaxed">
                        <li><strong>Tunnel Allocation:</strong> Every Site-to-Site VPN connection provisions **exactly two (2) active-active tunnels** terminating on different AWS endpoints for absolute high availability.</li>
                        <li><strong>Route Propagation:</strong> Enable BGP dynamic routing so paths fail over automatically if Tunnel A drops.</li>
                        <li><strong>AS_PATH Prepending:</strong> To route primary traffic to Tunnel A, prepend your customer gateway autonomous system numbers on Tunnel B routes dynamically.</li>
                      </ul>

                      <div className="acad-takeaway-box">
                        <strong>💡 Virtual Private Gateway (VGW) limit:</strong><br />
                        A standard Virtual Private Gateway (VGW) can only attach to **exactly one (1) VPC** at a time. If you need to scale hybrid tunnels across multiple VPCs, attach to an **AWS Transit Gateway (TGW)** instead.
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-150 mb-3">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Active-Active Tunnel Resiliency Tester</span>
                          <span className="text-[9px] text-slate-500 block">Simulate link failure state mapping</span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setTunnelAActive(!tunnelAActive)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                              tunnelAActive ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'
                            }`}
                          >
                            Tunnel A: {tunnelAActive ? 'ACTIVE' : 'FAILED'}
                          </button>
                          <button
                            onClick={() => setTunnelBActive(!tunnelBActive)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                              tunnelBActive ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'
                            }`}
                          >
                            Tunnel B: {tunnelBActive ? 'ACTIVE' : 'FAILED'}
                          </button>
                        </div>
                      </div>

                      {/* VPN SVG */}
                      <div className="w-full flex-grow flex items-center justify-center py-2">
                        <svg className="w-full max-w-[280px] h-[120px]" viewBox="0 0 280 120">
                          {/* Corporate CGW */}
                          <g transform="translate(10, 45)">
                            <rect x="0" y="0" width="45" height="30" rx="4" fill="#1e293b" />
                            <text x="22.5" y="18" fill="#cbd5e1" fontSize="6.5" fontWeight="bold" textAnchor="middle">Corp CGW</text>
                          </g>

                          {/* Virtual Private Gateway */}
                          <g transform="translate(225, 45)">
                            <rect x="0" y="0" width="45" height="30" rx="4" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                            <text x="22.5" y="18" fill="#1e3a8a" fontSize="7.5" fontWeight="bold" textAnchor="middle">VPC VGW</text>
                          </g>

                          {/* Tunnel A */}
                          <path
                            d="M 55 52 Q 140 20 225 52"
                            fill="none"
                            stroke={tunnelAActive ? '#10b981' : '#ef4444'}
                            strokeWidth="2.5"
                            className={tunnelAActive ? 'da-flow-fast' : ''}
                          />
                          <text x="140" y="26" fill={tunnelAActive ? '#047857' : '#b91c1c'} fontSize="6" fontWeight="bold" textAnchor="middle">
                            IPSec Tunnel A
                          </text>

                          {/* Tunnel B */}
                          <path
                            d="M 55 68 Q 140 100 225 68"
                            fill="none"
                            stroke={tunnelBActive ? '#10b981' : '#ef4444'}
                            strokeWidth="2.5"
                            className={!tunnelAActive && tunnelBActive ? 'da-flow-fast' : ''}
                          />
                          <text x="140" y="104" fill={tunnelBActive ? '#047857' : '#b91c1c'} fontSize="6" fontWeight="bold" textAnchor="middle">
                            IPSec Tunnel B
                          </text>
                        </svg>
                      </div>

                      <div className="p-3 bg-slate-900 rounded-xl font-mono text-[9px] text-slate-400">
                        {tunnelAActive ? (
                          <span className="text-emerald-400 block font-bold mb-1">Tunnel A Primary Active Route:</span>
                        ) : tunnelBActive ? (
                          <span className="text-amber-400 block font-bold mb-1">Tunnel A down. BGP failover to Tunnel B active:</span>
                        ) : (
                          <span className="text-rose-500 block font-bold mb-1">OUTAGE: All VPN pathways disconnected:</span>
                        )}
                        Dynamically exchanges network paths over corporate premises and AWS gateways statefully.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 15: AWS VPN CLOUDHUB                                              */}
              {/* ========================================================================= */}
              {selectedNote === 'vpn_cloudhub' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Hybrid Connectivity</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">AWS VPN CloudHub (Spoke-to-Spoke Tunneling)</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('hybrid')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Wifi className="w-3 h-3" /> Go to VPN &amp; Flow Logs
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 15 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    AWS VPN CloudHub operates on a hub-and-spoke model, allowing multiple remote sites (such as regional warehouses, offices, and central headquarters) to route traffic securely to each other via a Virtual Private Gateway (VGW).
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 block">CloudHub Attributes &amp; Patterns:</span>
                      <ul className="list-disc pl-4 text-xs text-slate-500 space-y-2 leading-relaxed">
                        <li><strong>Low-Cost Spoke Interconnection:</strong> Connect branches together directly over IPSec without traversing costly dedicated lines back to a single central headquarters.</li>
                        <li><strong>BGP Autonomous Exchange:</strong> Remote routers run dynamic BGP peerings with the central AWS VGW to swap subnets dynamically.</li>
                        <li><strong>Overlapping CIDR Warning:</strong> Like peering, spokes must have unique, non-overlapping IP address segments.</li>
                      </ul>

                      <div className="acad-takeaway-box">
                        <strong>💡 Spoke-to-Spoke Routing Path:</strong><br />
                        Traffic flowing between spoke A and spoke B is mapped entirely inside the central AWS Virtual Private Gateway routing layers, meaning packets never traverse public IP spaces unencrypted.
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Spoke-to-Spoke Central VGW Router Simulator</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">Animate packet routing through CloudHub Spoke pathways</p>
                      </div>

                      {/* CloudHub SVG */}
                      <div className="w-full flex-grow flex items-center justify-center py-2">
                        <svg className="w-full max-w-[280px] h-[130px]" viewBox="0 0 280 130">
                          {/* Branch Spoke A */}
                          <g transform="translate(10, 20)">
                            <rect x="0" y="0" width="45" height="24" rx="4" fill="#1e293b" />
                            <text x="22.5" y="15" fill="#cbd5e1" fontSize="6.5" fontWeight="bold" textAnchor="middle">Spoke A</text>
                          </g>

                          {/* Branch Spoke B */}
                          <g transform="translate(10, 85)">
                            <rect x="0" y="0" width="45" height="24" rx="4" fill="#1e293b" />
                            <text x="22.5" y="15" fill="#cbd5e1" fontSize="6.5" fontWeight="bold" textAnchor="middle">Spoke B</text>
                          </g>

                          {/* Central VGW Hub */}
                          <g transform="translate(180, 50)" className={cloudHubSimStep > 0 ? 'da-sim-node-active' : ''}>
                            <rect x="0" y="0" width="65" height="35" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="2.5" />
                            <text x="32.5" y="16" fill="#1e3a8a" fontSize="7" fontWeight="black" textAnchor="middle">VGW Hub</text>
                            <text x="32.5" y="26" fill="#2563eb" fontSize="5" fontWeight="black" textAnchor="middle">AWS CloudHub</text>
                          </g>

                          {/* Tunnel paths */}
                          <line x1="55" y1="32" x2="180" y2="60" stroke="#cbd5e1" strokeWidth="2.2" strokeDasharray="3,3" />
                          <line x1="55" y1="97" x2="180" y2="75" stroke="#cbd5e1" strokeWidth="2.2" strokeDasharray="3,3" />

                          {/* Active trace overrides */}
                          {cloudHubSimStep === 1 && (
                            <path d="M 55 32 L 180 60" fill="none" stroke="#2563eb" strokeWidth="3.5" className="da-flow-fast" />
                          )}
                          {cloudHubSimStep === 2 && (
                            <path d="M 180 75 L 55 97" fill="none" stroke="#10b981" strokeWidth="3.5" className="da-flow-fast" />
                          )}
                        </svg>
                      </div>

                      <div className="space-y-2">
                        <button
                          onClick={runCloudHubStepSim}
                          disabled={cloudHubSimStep > 0}
                          className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition-all"
                        >
                          {cloudHubSimStep > 0 ? 'Routing Spoke Data...' : 'Route Spoke A to Spoke B Packet'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 16: AWS DIRECT CONNECT                                            */}
              {/* ========================================================================= */}
              {selectedNote === 'direct_connect' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Hybrid Connectivity</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">AWS Direct Connect (DX) Dedicated Resiliency</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('hybrid')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Wifi className="w-3 h-3" /> Go to VPN &amp; Flow Logs
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 16 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    AWS Direct Connect (DX) bypasses the public internet completely, providing a dedicated physical fiber-optic connection between corporate networks and AWS for consistent performance, ultra-low latency, and massive data volume pipelines.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4 text-left">
                      <span className="text-xs font-black text-slate-800 block">Critical DX Port Architectures:</span>
                      <ul className="list-disc pl-4 text-xs text-slate-500 space-y-2 leading-relaxed">
                        <li><strong>Physical Ports:</strong> AWS offers dedicated physical fiber ports with standard bandwidth capabilities of **1 Gbps, 10 Gbps, or 100 Gbps**.</li>
                        <li><strong>Consistent Latency:</strong> Because traffic completely bypasses public ISPs, network packet latencies remain highly consistent, avoiding typical VPN internet spikes.</li>
                        <li><strong>Resiliency Redundancy:</strong> AWS recommends establishing redundant links terminated at independent Direct Connect colocation facilities to block physical fiber outage events.</li>
                      </ul>

                      <div className="acad-takeaway-box">
                        <strong>💡 Hybrid Connectivity Comparison:</strong><br />
                        Standard Site-to-Site VPN is fast to set up but uses the public internet (higher latency fluctuations). Direct Connect is secure and consistent but takes weeks to establish physically and is much more expensive.
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-150 mb-3">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Dynamic DX Latency Live Analyzer</span>
                          <span className="text-[9px] text-slate-500 block">Compare latency stability against internet VPN routes</span>
                        </div>
                        <button
                          onClick={() => setDxLineActive(!dxLineActive)}
                          className={`px-3 py-1 rounded text-[10px] font-black border transition-all ${
                            dxLineActive ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-blue-100 border-blue-300 text-blue-800'
                          }`}
                        >
                          DX Fiber Link: {dxLineActive ? 'ACTIVE (Fiber)' : 'FAILED (VPN Backup)'}
                        </button>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[9px] text-slate-300 space-y-2 my-2">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-1">
                          📊 Connection Latency Graph Analysis
                        </span>
                        {dxLineActive ? (
                          <div className="space-y-1">
                            <div className="text-emerald-400 font-bold">14ms [================] STABLE DIRECT CONNECT (0% Jitter)</div>
                            <div className="text-slate-500">14ms [================] STABLE DIRECT CONNECT (0% Jitter)</div>
                            <div className="text-emerald-400 font-bold">14ms [================] STABLE DIRECT CONNECT (0% Jitter)</div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="text-amber-400 font-bold">85ms [====================================] FLUTTERING PUBLIC VPN</div>
                            <div className="text-rose-400 font-bold">110ms [==============================================] SPIKE INTERNET CONGESTION</div>
                            <div className="text-amber-400 font-bold">90ms [======================================] JITTER FLUTTER</div>
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-slate-900 rounded-xl font-mono text-[9px] text-slate-400">
                        ⚡ <strong>Egress Telemetry:</strong> Traffic routed over dedicated DX cross-connections bypasses public ISP routes completely, ensuring stable transit for massive SQL database sync runs.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 17: AWS TRANSIT GATEWAY                                           */}
              {/* ========================================================================= */}
              {selectedNote === 'transit_gateway' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Hybrid Connectivity</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">AWS Transit Gateway (Central Cloud Router)</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('hybrid')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Wifi className="w-3 h-3" /> Go to VPN &amp; Flow Logs
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 17 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    AWS Transit Gateway (TGW) acts as a centralized cloud router, connecting thousands of VPCs and corporate physical networks through a unified hub, replacing the complexity of mesh networks.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 block">Mesh vs Hub-and-Spoke Topology:</span>
                      <div className="grid grid-cols-2 gap-3 text-center text-[10px] font-extrabold">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-rose-700 block mb-1 text-[11px] font-black">N-Peering Mesh Chaos</span>
                          VPC A to VPC B peers scale quadratically:<br />
                          <strong className="text-rose-800 font-black block mt-2 text-xs">N * (N - 1) / 2 Links</strong>
                        </div>
                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                          <span className="text-emerald-700 block mb-1 text-[11px] font-black">Central Transit Hub</span>
                          Unified central TGW connection scaling cleanly:<br />
                          <strong className="text-emerald-800 font-black block mt-2 text-xs">N Linear Attachments</strong>
                        </div>
                      </div>

                      <div className="acad-takeaway-box">
                        <strong>💡 Transitive Route Support:</strong><br />
                        Unlike VPC Peering connections, **Transit Gateway supports transitive routing**. A spoke VPC-A can route traffic to VPC-B or back to corporate data centers directly through the TGW central hub.
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-150 mb-3">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Transit Routing Structure Mode</span>
                          <span className="text-[9px] text-slate-500 block">Compare transit router connectivity styles</span>
                        </div>
                        <div className="flex bg-slate-100 p-0.5 rounded-lg text-[9px] font-bold">
                          <button
                            onClick={() => setTgwMeshMode(true)}
                            className={`px-3 py-1 rounded transition-all ${tgwMeshMode ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                          >
                            TGW Hub Router
                          </button>
                          <button
                            onClick={() => setTgwMeshMode(false)}
                            className={`px-3 py-1 rounded transition-all ${!tgwMeshMode ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                          >
                            Mesh Peering Chaos
                          </button>
                        </div>
                      </div>

                      {/* TGW SVG */}
                      <div className="w-full flex-grow flex items-center justify-center py-2">
                        <svg className="w-full max-w-[280px] h-[120px]" viewBox="0 0 280 120">
                          {/* Spokes */}
                          <rect x="10" y="15" width="40" height="24" rx="4" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                          <text x="30" y="29" fill="#1e3a8a" fontSize="6" fontWeight="bold" textAnchor="middle">VPC A</text>

                          <rect x="10" y="80" width="40" height="24" rx="4" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                          <text x="30" y="94" fill="#1e3a8a" fontSize="6" fontWeight="bold" textAnchor="middle">VPC B</text>

                          <rect x="230" y="15" width="40" height="24" rx="4" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                          <text x="250" y="29" fill="#1e3a8a" fontSize="6" fontWeight="bold" textAnchor="middle">VPC C</text>

                          <rect x="230" y="80" width="40" height="24" rx="4" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                          <text x="250" y="94" fill="#1e3a8a" fontSize="6" fontWeight="bold" textAnchor="middle">VPN Spoke</text>

                          {tgwMeshMode ? (
                            <>
                              {/* Transit Hub */}
                              <circle cx="140" cy="60" r="18" fill="#eff6ff" stroke="#6366f1" strokeWidth="2.5" className="da-sim-node-active" />
                              <text x="140" y="63" fill="#4f46e5" fontSize="7.5" fontWeight="black" textAnchor="middle">TGW Hub</text>

                              {/* Connections */}
                              <line x1="50" y1="27" x2="122" y2="60" stroke="#6366f1" strokeWidth="1.5" className="da-flow-fast" />
                              <line x1="50" y1="92" x2="122" y2="60" stroke="#6366f1" strokeWidth="1.5" />
                              <line x1="230" y1="27" x2="158" y2="60" stroke="#6366f1" strokeWidth="1.5" />
                              <line x1="230" y1="92" x2="158" y2="60" stroke="#6366f1" strokeWidth="1.5" />
                            </>
                          ) : (
                            <>
                              {/* Peering Mesh chaos */}
                              <line x1="50" y1="27" x2="230" y2="27" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,2" />
                              <line x1="50" y1="92" x2="230" y2="92" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,2" />
                              <line x1="30" y1="39" x2="30" y2="80" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,2" />
                              <line x1="250" y1="39" x2="250" y2="80" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,2" />
                              <line x1="50" y1="27" x2="230" y2="92" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,2" />
                              <line x1="50" y1="92" x2="230" y2="27" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="2,2" />
                              <text x="140" y="63" fill="#e11d48" fontSize="8" fontWeight="black" textAnchor="middle">Complexity Chaos</text>
                            </>
                          )}
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 18: VPC FLOW LOGS                                                 */}
              {/* ========================================================================= */}
              {selectedNote === 'flow_logs' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Telemetry &amp; Logs</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">VPC Flow Logs Ingestion</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('hybrid')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Wifi className="w-3 h-3" /> Go to VPN &amp; Flow Logs
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 18 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    VPC Flow Logs capture raw IP address metadata flowing through subnets and network interfaces (ENIs), delivering valuable telemetry datasets straight to CloudWatch Logs or S3.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 block">Telemetry Log Field Map:</span>
                      
                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-[9px] text-slate-300 space-y-2 shadow-inner">
                        <div className="text-blue-400">
                          v5 eni-05a8b7c6 10.0.1.15 198.51.100.44 80 52331 6 15 960 ACCEPT OK
                        </div>
                        <div className="border-t border-slate-850 pt-2 text-[8px] text-slate-500 font-semibold leading-relaxed space-y-0.5">
                          <div>• <span className="text-blue-400 font-bold">v5:</span> Ingestion format layout version</div>
                          <div>• <span className="text-slate-300 font-bold">10.0.1.15:</span> Private IP address source</div>
                          <div>• <span className="text-slate-300 font-bold">198.51.100.44:</span> Target destination address</div>
                          <div>• <span className="text-blue-400 font-bold">80 52331:</span> Target port (80), Client port (52331)</div>
                          <div>• <span className="text-cyan-400 font-bold">6:</span> Transport protocol (6 = TCP, 17 = UDP)</div>
                          <div>• <span className="text-emerald-400 font-bold">ACCEPT:</span> Security boundary allow status</div>
                        </div>
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between min-h-[300px]">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-150 mb-3">
                        <div>
                          <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Live Subnet Telemetry Log Streamer</span>
                          <span className="text-[9px] text-slate-500 block">Observe simulated incoming packet flow audits</span>
                        </div>
                        <button
                          onClick={() => setFlowLogsEnabled(!flowLogsEnabled)}
                          className={`px-3 py-1 rounded text-[10px] font-black border transition-all ${
                            flowLogsEnabled ? 'bg-emerald-100 border-emerald-300 text-emerald-800 animate-pulse' : 'bg-slate-100 border-slate-300 text-slate-800'
                          }`}
                        >
                          Flow Telemetry: {flowLogsEnabled ? 'STREAMING ACTIVE' : 'PAUSED'}
                        </button>
                      </div>

                      <div className="acad-terminal text-[8.5px] min-h-[140px] max-h-[140px] overflow-y-auto leading-normal">
                        {vpnLogs.length === 0 ? (
                          <span className="text-slate-500 italic">Telemetry stream paused. Turn on streaming above to listen to eni-05a8b7c6 interfaces...</span>
                        ) : (
                          vpnLogs.map((log, idx) => (
                            <div key={idx} className="flex gap-2 border-b border-slate-900 pb-1">
                              <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                              <span className={log.type === 'error' ? 'text-rose-400 font-bold' : log.type === 'success' ? 'text-emerald-400 font-bold' : log.type === 'warn' ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                                {log.message}
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="acad-takeaway-box">
                        <strong>💡 Telemetry Takeaway:</strong><br />
                        Flow logs do not capture raw packet contents (payloads)—only packet metrics. This prevents exposure of sensitive business data during security transport audits.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 19: VPC FLOW LOG ARCHITECTURE                                     */}
              {/* ========================================================================= */}
              {selectedNote === 'flow_logs_arch' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Telemetry &amp; Logs</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2">VPC Flow Logs &amp; SIEM Pipelines Architecture</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('hybrid')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Wifi className="w-3 h-3" /> Go to VPN &amp; Flow Logs
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 19 of 19</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    VPC Flow Logs feed into larger cloud architectures for automated threat analysis, compliance dashboards, and visual metric monitoring.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <span className="text-xs font-black text-slate-800 block">End-to-End Log Analytics Pipeline:</span>
                      
                      <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-200">
                        <div className="relative">
                          <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></span>
                          <strong className="text-xs text-slate-800 block">Step 1: ENI Interface Telemetry capture</strong>
                          <p className="text-[11px] text-slate-500 leading-normal">VPC Flow log agent clones transport headers directly at the network card level.</p>
                        </div>
                        <div className="relative">
                          <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></span>
                          <strong className="text-xs text-slate-800 block">Step 2: Stream Ingestion</strong>
                          <p className="text-[11px] text-slate-500 leading-normal">Logs are published directly to Amazon S3 buckets or streamed live to CloudWatch Log groups.</p>
                        </div>
                        <div className="relative">
                          <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-blue-600 border-2 border-white"></span>
                          <strong className="text-xs text-slate-800 block">Step 3: SIEM &amp; Athena Queries</strong>
                          <p className="text-[11px] text-slate-500 leading-normal">Amazon Athena runs SQL queries against S3 log structures directly, while third-party SIEM platforms capture alerts for immediate network security assessments.</p>
                        </div>
                      </div>
                    </div>

                    <div className="acad-sim-diagram flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Visual Analytics Pipeline Flowchart</span>
                        <p className="text-[11px] text-slate-500 mt-0.5">End-to-end packet telemetry paths</p>
                      </div>

                      <div className="border border-indigo-250 bg-indigo-50/10 rounded-xl p-4 space-y-2 mt-3 text-center text-[10px] font-bold">
                        <div className="bg-white border border-slate-200 rounded p-1.5 shadow-sm text-blue-700">
                          1. EC2 Elastic Interface (ENI)
                        </div>
                        <div className="text-slate-400">⬇️ Flow Capture</div>
                        <div className="bg-white border border-slate-200 rounded p-1.5 shadow-sm text-indigo-700">
                          2. VPC Flow Logs Engine
                        </div>
                        <div className="text-slate-400">⬇️ Stream to</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white border border-slate-200 rounded p-1.5 shadow-sm">
                            S3 Storage
                          </div>
                          <div className="bg-white border border-slate-200 rounded p-1.5 shadow-sm">
                            CloudWatch
                          </div>
                        </div>
                        <div className="text-slate-400">⬇️ Audit via</div>
                        <div className="bg-slate-900 border border-slate-800 rounded p-1.5 text-white font-extrabold shadow">
                          SIEM / Amazon Athena Dashboard
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

      {/* ========================================================================= */}
      {/* TAB 7: EGRESS & FIREWALL OPTIMIZER                                         */}
      {/* ========================================================================= */}
      {activeTab === 'pricing' && (
        <div className="space-y-6 animate-fadeIn text-left">
          {/* Main header block */}
          <div className="da-card text-left">
            <h2 className="da-card-title text-emerald-700">
              <DollarSign className="w-5 h-5 text-emerald-500 animate-pulse" /> Egress &amp; Firewall Optimizer (AWS Cloud Architecture Cost &amp; Shield Dashboard)
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Explore interactively the real-world network routing cost optimizations, S3 data egress pathways, NAT Gateway pricing calculators, and stateful security boundary rules of AWS Network Firewall. Make data-driven architectural decisions that can save over 90% in egress bills.
            </p>
          </div>

          {/* Dynamic sub-tab buttons navigation */}
          <div className="da-tabs">
            <button 
              onClick={() => setPricingSubTab('overview')} 
              className={`da-tb ${pricingSubTab === 'overview' ? 'da-on' : ''}`}
            >
              <Layers className="w-4 h-4" /> Overview Dashboard
            </button>
            <button 
              onClick={() => setPricingSubTab('per_gb')} 
              className={`da-tb ${pricingSubTab === 'per_gb' ? 'da-on' : ''}`}
            >
              <DollarSign className="w-4 h-4" /> Network Cost Calculator (Per GB)
            </button>
            <button 
              onClick={() => setPricingSubTab('s3_egress')} 
              className={`da-tb ${pricingSubTab === 's3_egress' ? 'da-on' : ''}`}
            >
              <Zap className="w-4 h-4" /> S3 Egress Pathways
            </button>
            <button 
              onClick={() => setPricingSubTab('nat_vs_vpce')} 
              className={`da-tb ${pricingSubTab === 'nat_vs_vpce' ? 'da-on' : ''}`}
            >
              <Network className="w-4 h-4" /> NAT vs VPC Endpoints
            </button>
            <button 
              onClick={() => setPricingSubTab('firewall')} 
              className={`da-tb ${pricingSubTab === 'firewall' ? 'da-on' : ''}`}
            >
              <Shield className="w-4 h-4" /> Network Firewall Security
            </button>
          </div>

          {pricingSubTab === 'overview' && (
            <div className="space-y-6">
              {/* Introduction Card */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-6 text-left relative overflow-hidden">
                <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 rounded-xl">
                    <Zap className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      VPC Architecture Optimization: Standard vs High-Savings
                    </h3>
                    <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                      AWS default setups (using multi-AZ NAT Gateways, standard Internet Egress routes, and full-volume stateful deep packet inspection) are easy to set up but highly inefficient. Below, we compare this <strong>Standard Architecture</strong> against a production-grade <strong>High-Savings Architecture</strong> that leverages Gateway Endpoints, split-horizon routing, and stateless bypass rules to slash costs by over 80%.
                    </p>
                  </div>
                </div>
              </div>

              {/* Shared Sliders for Real-Time Cost Calculations */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left">
                <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" /> Interactive Traffic &amp; Duration Sliders
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Global Egress &amp; Processing Volume
                      </label>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded">
                        {globalEgressVolume.toLocaleString()} GB / month
                      </span>
                    </div>
                    <input
                      type="range"
                      min="500"
                      max="20000"
                      step="500"
                      value={globalEgressVolume}
                      onChange={(e) => setGlobalEgressVolume(Number(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>500 GB</span>
                      <span>10,000 GB</span>
                      <span>20,000 GB</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        NAT Gateway Multi-AZ Hours
                      </label>
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded">
                        {natHours} Hours / month
                      </span>
                    </div>
                    <input
                      type="range"
                      min="100"
                      max="720"
                      step="20"
                      value={natHours}
                      onChange={(e) => setNatHours(Number(e.target.value))}
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>100 Hrs</span>
                      <span>400 Hrs</span>
                      <span>720 Hrs (Full Month)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Side-by-side Cards & Live Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* Standard Architecture */}
                <div className="lg:col-span-5 bg-white border border-rose-100 hover:border-rose-300 rounded-2xl p-6 shadow-sm flex flex-col text-left transition-all duration-300 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-center mb-4">
                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold tracking-wider uppercase rounded-full border border-rose-200">
                      Standard Costly Setup
                    </span>
                    <span className="text-rose-500 font-semibold text-xs flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Highly Unoptimized
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mb-2">Multi-AZ Endpoint &amp; NAT Egress</h4>
                  <p className="text-slate-500 text-xs leading-relaxed mb-6">
                    Runs all traffic (including S3 backups, private data transfers, and benign local queries) through expensive multi-AZ NAT Gateways and stateful deep packet inspectors.
                  </p>

                  <div className="space-y-4 flex-grow">
                    <div className="p-3 bg-rose-50/50 border border-rose-100/50 rounded-xl space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 font-medium">S3 Egress + Processing:</span>
                        <span className="text-slate-800 font-bold font-mono">
                          ${(globalEgressVolume * 0.135).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ({globalEgressVolume} GB @ $0.09/GB egress + $0.045/GB NAT processing)
                      </div>
                    </div>

                    <div className="p-3 bg-rose-50/50 border border-rose-100/50 rounded-xl space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 font-medium">Multi-AZ NAT Hours (3 AZs):</span>
                        <span className="text-slate-800 font-bold font-mono">
                          ${(3 * natHours * 0.045).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        (3 NAT GWs * {natHours} hrs @ $0.045/hr)
                      </div>
                    </div>

                    <div className="p-3 bg-rose-50/50 border border-rose-100/50 rounded-xl space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 font-medium">Firewall Hours &amp; Processing:</span>
                        <span className="text-slate-800 font-bold font-mono">
                          ${((3 * 720 * 0.395) + (globalEgressVolume * 0.065)).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        (3 endpoints * 720 hrs @ $0.395/hr + {globalEgressVolume} GB @ $0.065/GB stateful inspect)
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-slate-600">Total Monthly Cost:</span>
                    <span className="text-xl font-bold text-rose-600 font-mono">
                      ${(
                        (globalEgressVolume * 0.135) + 
                        (3 * natHours * 0.045) + 
                        (3 * 720 * 0.395) + 
                        (globalEgressVolume * 0.065)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Savings and Cost Comparison Badge (Middle 2 cols on large screen) */}
                <div className="lg:col-span-2 flex flex-col justify-center items-center py-6 lg:py-0">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-full mb-3 flex items-center justify-center animate-bounce">
                    <TrendingDown className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider text-center">Net Savings</h3>
                  <div className="text-3xl font-extrabold text-emerald-600 font-mono tracking-tight mt-1">
                    {Math.max(0, Math.round((
                      (
                        (globalEgressVolume * 0.135) + 
                        (3 * natHours * 0.045) + 
                        (3 * 720 * 0.395) + 
                        (globalEgressVolume * 0.065)
                      ) - (
                        (0) + 
                        (3 * 720 * 0.014 + (globalEgressVolume * 0.1 * 0.01)) + 
                        (1 * 720 * 0.395) + 
                        (globalEgressVolume * 0.2 * 0.065)
                      )
                    ) / (
                      (globalEgressVolume * 0.135) + 
                      (3 * natHours * 0.045) + 
                      (3 * 720 * 0.395) + 
                      (globalEgressVolume * 0.065)
                    ) * 100))}%
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-2">
                    Architectural Bypass
                  </span>
                  <div className="w-full flex justify-center items-center my-4">
                    <div className="h-0.5 w-12 bg-slate-200 relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-emerald-500 text-white p-0.5 rounded-full text-[8px] font-bold">
                        <ArrowRight className="w-2.5 h-2.5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optimized Architecture */}
                <div className="lg:col-span-5 bg-gradient-to-br from-emerald-50/30 to-teal-50/10 border-2 border-emerald-500 hover:border-emerald-600 rounded-2xl p-6 shadow-md flex flex-col text-left transition-all duration-300 relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="flex justify-between items-center mb-4">
                    <span className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold tracking-wider uppercase rounded-full shadow-sm">
                      High-Savings Setup
                    </span>
                    <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1 animate-pulse">
                      <Check className="w-3.5 h-3.5" /> Production Optimized
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mb-2">Split-Horizon &amp; Gateway Endpoints</h4>
                  <p className="text-slate-500 text-xs leading-relaxed mb-6">
                    Directly routes S3 traffic through free Gateway Endpoints. Leverages fast-path stateless rules to bypass stateful deep packet inspection for trusted internal and AWS endpoints.
                  </p>

                  <div className="space-y-4 flex-grow">
                    <div className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 font-medium">S3 Gateway Endpoint:</span>
                        <span className="text-emerald-700 font-bold font-mono">
                          $0.00
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Bypasses NAT processing completely ($0/GB)
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 font-medium">VPC Endpoints (Internal):</span>
                        <span className="text-slate-800 font-bold font-mono">
                          ${(3 * 720 * 0.014 + (globalEgressVolume * 0.1 * 0.01)).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        (3 endpoints * 720 hrs @ $0.014/hr + 10% egress volume @ $0.01/GB processing)
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-50/50 border border-emerald-100/50 rounded-xl space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-600 font-medium">Optimized Firewall Coverage:</span>
                        <span className="text-slate-800 font-bold font-mono">
                          ${((1 * 720 * 0.395) + (globalEgressVolume * 0.2 * 0.065)).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        (1 firewall * 720 hrs @ $0.395/hr + 20% untrusted egress @ $0.065/GB stateful inspect)
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-slate-600">Total Monthly Cost:</span>
                    <span className="text-xl font-bold text-emerald-600 font-mono">
                      ${(
                        (0) + 
                        (3 * 720 * 0.014 + (globalEgressVolume * 0.1 * 0.01)) + 
                        (1 * 720 * 0.395) + 
                        (globalEgressVolume * 0.2 * 0.065)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Packet Flow Simulator Panel */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-left">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" /> Interactive Packet Flow Simulator: Bypass Logic
                    </h4>
                    <p className="text-slate-500 text-xs mt-1">
                      Simulate packet routing under the High-Savings architecture. Observe how stateless filters fast-path safe connections to eliminate stateful inspection fees.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startOverviewSimulation('s3')}
                      disabled={overviewSimStatus === 'running'}
                      className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 border border-emerald-200"
                    >
                      <Zap className="w-3.5 h-3.5" /> S3 Packet (Bypass)
                    </button>
                    <button
                      onClick={() => startOverviewSimulation('untrusted')}
                      disabled={overviewSimStatus === 'running'}
                      className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 border border-rose-200"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Untrusted Egress
                    </button>
                    <button
                      onClick={() => resetOverviewSimulation()}
                      className="px-3 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-lg text-xs font-bold transition-all"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center bg-slate-50 p-6 rounded-xl border border-slate-100">
                  {/* Visualizer canvas */}
                  <div className="lg:col-span-2 relative h-48 bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-inner flex items-center justify-around px-4">
                    
                    {/* Node 1: client */}
                    <div className={`flex flex-col items-center z-10 transition-all ${overviewSimStep >= 1 ? 'scale-105' : 'opacity-70'}`}>
                      <div className={`p-3 rounded-full border shadow-sm ${
                        overviewSimStep >= 1 ? 'bg-indigo-50 border-indigo-300 text-indigo-600 animate-pulse' : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        <Server className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 mt-2">App Server</span>
                    </div>

                    {/* Channel 1 */}
                    <div className="flex-grow h-0.5 bg-slate-200 relative max-w-[80px]">
                      {overviewSimType && overviewSimStep >= 1 && (
                        <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow ${
                          overviewSimType === 's3' ? 'bg-emerald-500' : 'bg-rose-500'
                        } ${overviewSimStep === 1 ? 'left-0 animate-ping' : 'left-full transition-all duration-1000'}`} />
                      )}
                    </div>

                    {/* Node 2: Stateless Engine */}
                    <div className={`flex flex-col items-center z-10 transition-all ${overviewSimStep >= 2 ? 'scale-105' : 'opacity-70'}`}>
                      <div className={`p-3 rounded-full border shadow-sm relative ${
                        overviewSimStep >= 2 
                          ? 'bg-amber-50 border-amber-300 text-amber-600 font-bold' 
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        <Cpu className="w-6 h-6" />
                        {overviewSimStep === 2 && (
                          <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[8px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider whitespace-nowrap animate-bounce">
                            Stateless Filter
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 mt-2">Stateless Filter</span>
                    </div>

                    {/* Channel 2 Split */}
                    <div className="relative w-16 h-24 flex items-center justify-center">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 64 96">
                        <path d="M0,48 C20,48 40,16 64,16" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3,3" />
                        <path d="M0,48 C20,48 40,80 64,80" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3,3" />
                        {overviewSimType === 's3' && overviewSimStep >= 2 && (
                          <path d="M0,48 C20,48 40,16 64,16" fill="none" stroke="#10b981" strokeWidth="3" className="animate-dash" strokeDasharray="6,6" />
                        )}
                        {overviewSimType === 'untrusted' && overviewSimStep >= 2 && (
                          <path d="M0,48 C20,48 40,80 64,80" fill="none" stroke="#f43f5e" strokeWidth="3" className="animate-dash" strokeDasharray="6,6" />
                        )}
                      </svg>
                      {/* Animated dot moving */}
                      {overviewSimType === 's3' && overviewSimStep === 2 && (
                        <div className="absolute w-3 h-3 bg-emerald-500 rounded-full shadow animate-pulse" style={{ left: '50%', top: '30%' }} />
                      )}
                      {overviewSimType === 'untrusted' && overviewSimStep === 2 && (
                        <div className="absolute w-3 h-3 bg-rose-500 rounded-full shadow animate-pulse" style={{ left: '50%', top: '70%' }} />
                      )}
                    </div>

                    {/* Top Node (Direct S3 / Bypass Endpoint) */}
                    <div className={`flex flex-col items-center z-10 transition-all ${
                      overviewSimType === 's3' && overviewSimStep >= 3 ? 'scale-105' : 'opacity-40'
                    }`}>
                      <div className={`p-3 rounded-full border shadow-sm ${
                        overviewSimType === 's3' && overviewSimStep >= 3 
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        <Network className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 mt-2">S3 Gateway Endpoint</span>
                    </div>

                    {/* Bottom Node (Stateful Inspection Engine) */}
                    <div className={`flex flex-col items-center z-10 transition-all ${
                      overviewSimType === 'untrusted' && overviewSimStep >= 3 ? 'scale-105' : 'opacity-40'
                    }`}>
                      <div className={`p-3 rounded-full border shadow-sm ${
                        overviewSimType === 'untrusted' && overviewSimStep >= 3 
                          ? 'bg-rose-50 border-rose-300 text-rose-600' 
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}>
                        <Shield className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 mt-2">Stateful Inspect ($0.065/GB)</span>
                    </div>

                  </div>

                  {/* Logs/Terminal section */}
                  <div className="h-48 bg-slate-900 rounded-xl p-4 font-mono text-xs text-left text-slate-300 flex flex-col justify-between shadow-inner">
                    <div className="space-y-2 overflow-y-auto max-h-[120px] pr-2">
                      <div className="text-emerald-500 font-bold border-b border-slate-800 pb-1 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5" /> SIMULATOR CONSOLE
                      </div>
                      {overviewSimStep === 0 && (
                        <div className="text-slate-500 italic">Select S3 Packet or Untrusted Egress to start simulated packet run...</div>
                      )}
                      {overviewSimStep >= 1 && (
                        <div className="text-indigo-400 animate-fade-in">
                          &gt; [App Server] Packet initialized from internal subnet (CIDR 10.0.1.45)
                        </div>
                      )}
                      {overviewSimStep >= 2 && (
                        <div className="text-amber-400 animate-fade-in">
                          &gt; [Stateless Filter] Evaluating header destination... 
                          {overviewSimType === 's3' 
                            ? ' Destination matches AWS S3 prefix list!' 
                            : ' Destination matches untrusted external CIDR!'}
                        </div>
                      )}
                      {overviewSimStep >= 3 && (
                        <div className={`${overviewSimType === 's3' ? 'text-emerald-400' : 'text-rose-400'} font-semibold animate-fade-in`}>
                          {overviewSimType === 's3' 
                            ? '> [Gateway Endpoint] Fast-pathed bypassing Stateful inspections. Processing cost: $0.00!' 
                            : '> [Stateful Engine] Forwarded to Stateful deep inspection endpoint. Processing fee charged ($0.065/GB).'}
                        </div>
                      )}
                      {overviewSimStep >= 4 && (
                        <div className="text-emerald-500 font-bold flex items-center gap-1.5 animate-fade-in border-t border-slate-800 pt-1 mt-1">
                          <Check className="w-3.5 h-3.5" /> ROUTING SUCCESSFUL
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 border-t border-slate-800 pt-2 flex justify-between items-center">
                      <span>Status: <strong className="text-indigo-400">{overviewSimStatus.toUpperCase()}</strong></span>
                      {overviewSimType && (
                        <span className="font-semibold text-slate-400">
                          Mode: {overviewSimType === 's3' ? 'AWS S3 (Free Bypass)' : 'Untrusted Egress (Inspect)'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 1: AWS Network Cost Calculator */}
          {pricingSubTab === 'per_gb' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sidebar Settings */}
              <div className="lg:col-span-4 space-y-6">
                <div className="da-card text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Traffic Configuration</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Traffic Source:</label>
                      <select 
                        value={costSource} 
                        onChange={(e) => setCostSource(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 font-medium"
                      >
                        <option value="az1">EC2 Instance Cluster (Availability Zone 1)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Destination Node / Pathway:</label>
                      <select 
                        value={costDest} 
                        onChange={(e) => setCostDest(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 font-medium"
                      >
                        <option value="az1_private">Same AZ (AZ-1) - Private IP ($0.00/GB)</option>
                        <option value="az2_private">Cross AZ (AZ-1 ➡️ AZ-2) - Private IP ($0.01/GB)</option>
                        <option value="az2_public">Cross AZ (AZ-1 ➡️ AZ-2) - Public IP ($0.02/GB)</option>
                        <option value="region_diff">Cross Region (us-east-1 ➡️ us-west-2) ($0.02/GB)</option>
                        <option value="internet">Public Internet Egress via IGW ($0.09/GB)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-600">Monthly Volume (GB):</label>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{costDataGb} GB</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="5000" 
                        step="10"
                        value={costDataGb} 
                        onChange={(e) => setCostDataGb(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 text-left">
                  <h4 className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
                    <Info className="w-4 h-4" /> Cost Matrix Rules Checklist
                  </h4>
                  <ul className="text-[11px] text-slate-600 mt-2 space-y-1.5 leading-relaxed">
                    <li>🟢 <strong>Same AZ, Private IP</strong>: Completely Free ($0.00/GB). Hypervisor bypass.</li>
                    <li>⚠️ <strong>Same AZ, Public/Elastic IP</strong>: $0.01 per GB ingress + $0.01 per GB egress ($0.02 total).</li>
                    <li>🚨 <strong>Inter-AZ (AZ-1 to AZ-2)</strong>: $0.01 per GB across logical AZ limits.</li>
                    <li>📡 <strong>Inter-Region Transit</strong>: $0.02 per GB over high-speed AWS Global Backbone.</li>
                    <li>🌐 <strong>Internet Egress</strong>: $0.09 per GB (standard first 10TB tier).</li>
                  </ul>
                </div>
              </div>

              {/* Simplified Compact Cost Chart & Recommendations */}
              <div className="lg:col-span-8 space-y-6">
                <div className="da-card p-6 text-left relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl text-white">
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">Live Cost engine</span>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-200 mb-2">Interactive Pathway Cost Comparison</h3>
                  <p className="text-xs text-slate-400 mb-6">
                    See how your monthly data volume of <span className="text-sky-400 font-bold">{costDataGb} GB</span> is billed across different network paths. Click on any route below to set it as your target destination path.
                  </p>
                  
                  {/* Dynamic cost bars list */}
                  <div className="space-y-4">
                    {[
                      {
                        key: 'az1_private',
                        name: 'Same AZ (AZ-1) - Private IP Route',
                        rate: 0.00,
                        desc: 'Intra-AZ traffic stays on the local hypervisor backplane. Highly optimized.',
                        color: 'from-emerald-500 to-teal-500',
                        badge: 'FREE',
                        textColor: 'text-emerald-400'
                      },
                      {
                        key: 'az2_private',
                        name: 'Cross AZ (AZ-1 ➡️ AZ-2) - Private IP Route',
                        rate: 0.01,
                        desc: 'Traverses logical availability zone boundaries. Standard replication path.',
                        color: 'from-amber-400 to-orange-500',
                        badge: '$0.01/GB',
                        textColor: 'text-amber-400'
                      },
                      {
                        key: 'az2_public',
                        name: 'Cross AZ (AZ-1 ➡️ AZ-2) - Public / Elastic IP',
                        rate: 0.02,
                        desc: 'EIP penalty. Loops traffic out to regional public routers, doubling cost.',
                        color: 'from-rose-400 to-pink-500',
                        badge: '$0.02/GB',
                        textColor: 'text-rose-400'
                      },
                      {
                        key: 'region_diff',
                        name: 'Cross Region (us-east-1 ➡️ us-west-2)',
                        rate: 0.02,
                        desc: 'Traverses the AWS high-speed global fiber backbone network.',
                        color: 'from-blue-500 to-indigo-500',
                        badge: '$0.02/GB',
                        textColor: 'text-blue-400'
                      },
                      {
                        key: 'internet',
                        name: 'Public Internet Egress via IGW',
                        rate: 0.09,
                        desc: 'Traffic exits the AWS network entirely to the public internet.',
                        color: 'from-rose-600 to-red-700',
                        badge: '$0.09/GB',
                        textColor: 'text-red-400'
                      }
                    ].map((route) => {
                      const total = costDataGb * route.rate;
                      const isSelected = costDest === route.key;
                      const percentage = route.rate === 0 ? 3 : (route.rate / 0.09) * 100;

                      return (
                        <div 
                          key={route.key}
                          onClick={() => setCostDest(route.key as any)}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-slate-800/80 border-emerald-500/60 shadow-lg shadow-emerald-950/20' 
                              : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-900/40 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${isSelected ? 'text-emerald-400' : 'text-slate-200'}`}>
                                  {route.name}
                                </span>
                                {isSelected && (
                                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.2 rounded font-black tracking-wider uppercase">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5 leading-tight">{route.desc}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-extrabold text-white block">
                                ${total.toFixed(2)} <span className="text-[9px] text-slate-500 font-normal">/mo</span>
                              </span>
                              <span className="text-[9px] text-slate-400">{route.badge}</span>
                            </div>
                          </div>

                          {/* Cost Bar */}
                          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full bg-gradient-to-r ${route.color} transition-all duration-500`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Compact Cost Takeaway Bullet Points */}
                <div className="da-card text-left bg-slate-900 border border-slate-800 text-slate-200 p-5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                    <Info className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">
                      Architect's Cost Optimization Rules
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <span className="text-emerald-400 font-bold">1.</span>
                        <p><strong>Keep traffic within the same AZ</strong>: If instances communicate over Private IPs in the same Availability Zone, transit is <strong>100% free</strong>.</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-emerald-400 font-bold">2.</span>
                        <p><strong>Avoid Elastic IPs for local traffic</strong>: Routing via Public/Elastic IPs loops traffic to public AWS edge routers, charging you <strong>$0.02/GB</strong> even in the same AZ!</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <span className="text-emerald-400 font-bold">3.</span>
                        <p><strong>Optimize cross-AZ routes</strong>: If you must cross AZs, stick to <strong>Private IPs</strong> to reduce fees to the minimum <strong>$0.01/GB</strong> standard transfer rate.</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-emerald-400 font-bold">4.</span>
                        <p><strong>Limit Internet Egress</strong>: Direct egress to the internet carries a premium rate of <strong>$0.09/GB</strong>. Use caching networks or VPC Endpoint routes where possible.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-tab 2: S3 Egress Optimizer */}
          {pricingSubTab === 's3_egress' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sidebar Configuration */}
              <div className="lg:col-span-4 space-y-6">
                <div className="da-card text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">S3 Data Transfer Route</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Egress Pathway Optimization:</label>
                      <div className="space-y-2">
                        <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-medium">
                          <input 
                            type="radio" 
                            name="s3Route" 
                            checked={s3EgressRoute === 'direct'} 
                            onChange={() => setS3EgressRoute('direct')} 
                            className="mt-0.5 accent-emerald-600"
                          />
                          <div>
                            <span className="font-bold text-slate-800 block">S3 Direct Internet ($0.09/GB)</span>
                            <span className="text-[10px] text-slate-500">Standard direct download to public clients. High pricing.</span>
                          </div>
                        </label>
                        <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-emerald-250 bg-emerald-50/20 hover:bg-emerald-50/30 cursor-pointer text-xs font-medium">
                          <input 
                            type="radio" 
                            name="s3Route" 
                            checked={s3EgressRoute === 'cloudfront'} 
                            onChange={() => setS3EgressRoute('cloudfront')} 
                            className="mt-0.5 accent-emerald-600"
                          />
                          <div>
                            <span className="font-bold text-emerald-800 block flex items-center gap-1">
                              CloudFront Caching ($0.085/GB) <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 rounded font-black">RECOMMENDED</span>
                            </span>
                            <span className="text-[10px] text-slate-500">S3 to CloudFront is FREE. Cache edge transfers to client with ~7x cost reductions at scale.</span>
                          </div>
                        </label>
                        <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-medium">
                          <input 
                            type="radio" 
                            name="s3Route" 
                            checked={s3EgressRoute === 'accelerator'} 
                            onChange={() => setS3EgressRoute('accelerator')} 
                            className="mt-0.5 accent-emerald-600"
                          />
                          <div>
                            <span className="font-bold text-slate-800 block">Transfer Accelerator ($0.13/GB)</span>
                            <span className="text-[10px] text-slate-500">Optimizes globally using AWS Edge locations. +$0.04/GB premium fee.</span>
                          </div>
                        </label>
                        <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs font-medium">
                          <input 
                            type="radio" 
                            name="s3Route" 
                            checked={s3EgressRoute === 'crr'} 
                            onChange={() => setS3EgressRoute('crr')} 
                            className="mt-0.5 accent-emerald-600"
                          />
                          <div>
                            <span className="font-bold text-slate-800 block">S3 Cross-Region Replication ($0.02/GB)</span>
                            <span className="text-[10px] text-slate-500">Auto-copy S3 objects cross-region for multi-site high availability.</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-600">Monthly Egress Volume:</label>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{s3DataGb} GB</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="10000" 
                        step="50"
                        value={s3DataGb} 
                        onChange={(e) => setS3DataGb(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>

                    <button
                      onClick={runS3EgressSim}
                      disabled={s3SimState === 'running'}
                      className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2"
                    >
                      <Activity className={`w-4 h-4 ${s3SimState === 'running' ? 'animate-spin' : ''}`} />
                      {s3SimState === 'running' ? 'Running Egress Trace...' : 'Simulate Egress & Validate'}
                    </button>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                  <h4 className="text-xs font-extrabold text-blue-800 flex items-center gap-1.5">
                    <Info className="w-4 h-4" /> Edge Acceleration Insights
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    By routing S3 asset downloads through **Amazon CloudFront**, S3 to CloudFront data transfer is billed at **$0.00/GB**. You only pay for CloudFront egress, which has lower regional tiers than S3, saving thousands of dollars monthly on high-traffic static websites, dynamic REST API assets, and media archives.
                  </p>
                </div>
              </div>

              {/* Results dashboard & Logs */}
              <div className="lg:col-span-8 space-y-6">
                <div className="da-card p-6 text-left relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl text-white">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6">S3 Egress Topology Route</h3>

                  <div className="h-44 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-center p-4 relative">
                    {/* Render custom S3 egress pipeline */}
                    <svg viewBox="0 0 700 200" className="w-full h-full font-semibold">
                      {/* Left: Amazon S3 Bucket */}
                      <g transform="translate(100, 100)">
                        <rect x="-35" y="-35" width="70" height="70" rx="10" fill="#2563eb" stroke="#3b82f6" strokeWidth="2" />
                        <text y="5" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">Amazon S3</text>
                      </g>

                      {/* Middle: Optional CloudFront Edge */}
                      {s3EgressRoute === 'cloudfront' ? (
                        <g transform="translate(350, 100)">
                          <polygon points="0,-40 40,0 0,40 -40,0" fill="#7c3aed" stroke="#8b5cf6" strokeWidth="2" className="animate-pulse" />
                          <text y="5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">CloudFront Edge</text>
                        </g>
                      ) : s3EgressRoute === 'accelerator' ? (
                        <g transform="translate(350, 100)">
                          <polygon points="0,-40 40,0 0,40 -40,0" fill="#e11d48" stroke="#f43f5e" strokeWidth="2" />
                          <text y="5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">Transfer Accel</text>
                        </g>
                      ) : (
                        <g transform="translate(350, 100)">
                          <circle r="10" fill="#475569" />
                          <text y="25" textAnchor="middle" fill="#94a3b8" fontSize="9" fontWeight="bold">Direct Transit</text>
                        </g>
                      )}

                      {/* Connectors */}
                      <path d="M 135 100 L 310 100" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" />
                      {s3SimState === 'running' && (
                        <path d="M 135 100 L 310 100" fill="none" stroke="#2563eb" strokeWidth="3" className="r53-flow-blue" />
                      )}

                      <path d="M 390 100 L 565 100" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" />
                      {s3SimState === 'running' && (
                        <path d="M 390 100 L 565 100" fill="none" stroke="#10b981" strokeWidth="3" className="r53-flow-orange" />
                      )}

                      {/* Right: Client / Destination */}
                      <g transform="translate(600, 100)">
                        <circle r="35" fill="#111827" stroke="#10b981" strokeWidth="2" />
                        <text y="5" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold">Public Client</text>
                      </g>
                    </svg>
                  </div>

                  {/* Calculations breakdown cards */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl text-center">
                      <span className="text-[10px] font-black text-slate-400 block uppercase">Route Chosen</span>
                      <span className="text-xs font-bold text-sky-400 mt-2.5 block uppercase tracking-wider">
                        {s3EgressRoute === 'direct' && 'Direct Egress'}
                        {s3EgressRoute === 'cloudfront' && 'CloudFront Caching'}
                        {s3EgressRoute === 'accelerator' && 'Edge Acceleration'}
                        {s3EgressRoute === 'crr' && 'Disaster Recovery'}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl text-center">
                      <span className="text-[10px] font-black text-slate-400 block uppercase">Egress Surcharge Rate</span>
                      <span className="text-xl font-bold text-amber-400 mt-1 block">
                        ${s3EgressRoute === 'direct' ? '0.090' : s3EgressRoute === 'cloudfront' ? '0.085' : s3EgressRoute === 'accelerator' ? '0.130' : '0.020'}/GB
                      </span>
                    </div>
                    <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl text-center">
                      <span className="text-[10px] font-black text-slate-400 block uppercase">Estimated Charge</span>
                      <span className="text-xl font-bold text-emerald-400 mt-1 block">
                        ${(s3DataGb * (s3EgressRoute === 'direct' ? 0.09 : s3EgressRoute === 'cloudfront' ? 0.085 : s3EgressRoute === 'accelerator' ? 0.13 : 0.02)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* S3 logs console */}
                <div className="da-card text-left bg-slate-900 border border-slate-800 text-slate-200 p-5 rounded-2xl">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" /> S3 Dynamic Routing Console Trace
                    </h3>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">STDOUT</span>
                  </div>

                  <div className="h-48 overflow-y-auto space-y-2 font-mono text-[11px] p-2 bg-slate-950/80 rounded-lg">
                    {s3Logs.length === 0 ? (
                      <div className="text-slate-500 italic text-center pt-16">
                        Console traces idle. Choose a routing strategy and click "Simulate Egress &amp; Validate" to watch pipeline logic live.
                      </div>
                    ) : (
                      s3Logs.map((log, idx) => (
                        <div key={idx} className="flex gap-2 leading-relaxed">
                          <span className="text-slate-500">[{log.timestamp}]</span>
                          <span className={
                            log.type === 'success' ? 'text-emerald-400 font-bold' :
                            log.type === 'error' ? 'text-rose-400 font-bold' :
                            log.type === 'warn' ? 'text-amber-400 font-bold' : 'text-sky-300'
                          }>
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

          {/* Sub-tab 3: NAT vs S3 Gateway Endpoint */}
          {pricingSubTab === 'nat_vs_vpce' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sidebar Configuration */}
              <div className="lg:col-span-4 space-y-6">
                <div className="da-card text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">S3 Data Transfer Context</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Running Hours per Month:</label>
                      <select 
                        value={natHours} 
                        onChange={(e) => setNatHours(Number(e.target.value))}
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 font-medium"
                      >
                        <option value="720">Full Month (720 Hours)</option>
                        <option value="360">Half Month (360 Hours)</option>
                        <option value="168">One Week (168 Hours)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-bold text-slate-600">S3 Egress volume (GB/month):</label>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{natDataGb} GB</span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="10000" 
                        step="100"
                        value={natDataGb} 
                        onChange={(e) => setNatDataGb(Number(e.target.value))}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                    </div>

                    <button
                      onClick={runNatChallengeSim}
                      disabled={natChallengeSimState === 'running'}
                      className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2"
                    >
                      <Activity className={`w-4 h-4 ${natChallengeSimState === 'running' ? 'animate-spin' : ''}`} />
                      {natChallengeSimState === 'running' ? 'Evaluating Route savings...' : 'Compare Paths & Compute Savings'}
                    </button>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-left">
                  <h4 className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
                    <Info className="w-4 h-4" /> Why are Gateway Endpoints Free?
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    S3 Gateway Endpoints operate by altering the subnet route table to direct S3 requests through a special prefix list pointing to the AWS private S3 interface. Because they require no running proxy hosts, AWS charges exactly **$0.00 for both hourly running costs and data processing**.
                  </p>
                </div>
              </div>

              {/* Visual Breakdown comparison */}
              <div className="lg:col-span-8 space-y-6">
                <div className="da-card p-6 text-left relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl text-white">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6">Interactive Architecture Cost Comparison</h3>

                  {/* Architecture comparison box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Path A: NAT Gateway */}
                    <div className="border border-rose-950 bg-rose-950/20 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-rose-900 text-rose-200 px-2 py-0.5 rounded font-black">PATH A: NAT GATEWAY</span>
                        <span className="text-xs font-bold text-rose-400">Expensive Path</span>
                      </div>

                      <div className="space-y-1 mt-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Hourly NAT Fee:</span>
                          <span className="font-bold text-white">${(natHours * 0.045).toFixed(2)} USD</span>
                        </div>
                        <div className="text-[10px] text-slate-500 leading-none">({natHours} hrs @ $0.045/hr)</div>

                        <div className="flex justify-between text-slate-400 mt-1">
                          <span>Data Processing Fee:</span>
                          <span className="font-bold text-white">${(natDataGb * 0.045).toFixed(2)} USD</span>
                        </div>
                        <div className="text-[10px] text-slate-500 leading-none">({natDataGb} GB processed @ $0.045/GB)</div>

                        <div className="border-t border-rose-900 mt-3 pt-2 flex justify-between text-sm font-extrabold">
                          <span className="text-slate-300">Total Month:</span>
                          <span className="text-rose-400">${(natHours * 0.045 + natDataGb * 0.045).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Path B: S3 Gateway Endpoint */}
                    <div className="border border-emerald-950 bg-emerald-950/20 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-emerald-900 text-emerald-200 px-2 py-0.5 rounded font-black">PATH B: S3 GATEWAY ENDPOINT</span>
                        <span className="text-xs font-bold text-emerald-400 font-extrabold flex items-center gap-1">🟢 100% FREE</span>
                      </div>

                      <div className="space-y-1 mt-2 text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Hourly VPCE Fee:</span>
                          <span className="font-bold text-emerald-400">$0.00 USD</span>
                        </div>
                        <div className="text-[10px] text-slate-500 leading-none">(No hourly charges)</div>

                        <div className="flex justify-between text-slate-400 mt-1">
                          <span>Data Processing Fee:</span>
                          <span className="font-bold text-emerald-400">$0.00 USD</span>
                        </div>
                        <div className="text-[10px] text-slate-500 leading-none">(No GB processing fees)</div>

                        <div className="border-t border-emerald-900 mt-3 pt-2 flex justify-between text-sm font-extrabold">
                          <span className="text-slate-300">Total Month:</span>
                          <span className="text-emerald-400">$0.00</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Savings summary */}
                  <div className="bg-emerald-950/40 border border-emerald-800 rounded-xl p-4 mt-6 text-center">
                    <span className="text-xs font-extrabold text-emerald-400 uppercase tracking-widest block">Potential Monthly Cost Savings</span>
                    <span className="text-3xl font-black text-emerald-300 block mt-1">
                      ${(natHours * 0.045 + natDataGb * 0.045).toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-slate-400 mt-1 block">Based on S3 routing modifications. 100% zero-cost networking.</span>
                  </div>
                </div>

                {/* NAT logs console */}
                <div className="da-card text-left bg-slate-900 border border-slate-800 text-slate-200 p-5 rounded-2xl">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" /> Route Table savings simulator trace
                    </h3>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">STDOUT</span>
                  </div>

                  <div className="h-48 overflow-y-auto space-y-2 font-mono text-[11px] p-2 bg-slate-950/80 rounded-lg">
                    {natChallengeLogs.length === 0 ? (
                      <div className="text-slate-500 italic text-center pt-16">
                        Savings calculations idle. Adjust configurations and click "Compare Paths &amp; Compute Savings" to initiate comparative cost telemetry.
                      </div>
                    ) : (
                      natChallengeLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-2 leading-relaxed">
                          <span className="text-slate-500">[{log.timestamp}]</span>
                          <span className={
                            log.type === 'success' ? 'text-emerald-400 font-bold' :
                            log.type === 'error' ? 'text-rose-400 font-bold' :
                            log.type === 'warn' ? 'text-amber-400 font-bold' : 'text-sky-300'
                          }>
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

          {/* Sub-tab 4: AWS Network Firewall Shield */}
          {pricingSubTab === 'firewall' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Sidebar Configuration */}
              <div className="lg:col-span-4 space-y-6">
                <div className="da-card text-left bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4">Firewall Configuration</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Network Firewall Shield status:</label>
                      <button 
                        onClick={() => setFirewallActive(!firewallActive)}
                        className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold text-center border transition ${
                          firewallActive 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100' 
                            : 'bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100'
                        }`}
                      >
                        {firewallActive ? '🟢 Network Firewall Active' : '🔴 Firewall Bypass (Risk Warning)'}
                      </button>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Matching Traffic Signature Rule Action:</label>
                      <select 
                        value={firewallRuleAction} 
                        onChange={(e) => setFirewallRuleAction(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 font-medium"
                      >
                        <option value="allow">ALLOW - Forward packet to destinations</option>
                        <option value="drop">DROP - Immediately block &amp; drop packet</option>
                        <option value="alert">ALERT - Log intrusion trigger, pass packet</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-600 block mb-1.5">Incoming Traffic Source Node:</label>
                      <select 
                        value={firewallTrafficSource} 
                        onChange={(e) => setFirewallTrafficSource(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 text-xs rounded-lg p-2 font-medium"
                      >
                        <option value="internet">Public Internet Ingress Node</option>
                        <option value="peering">VPC Peering Connection Node</option>
                        <option value="vpn">IPSec Transit VPN Tunnel Node</option>
                        <option value="directconnect">AWS Direct Connect Trunk Link</option>
                      </select>
                    </div>

                    <button
                      onClick={runFirewallSim}
                      disabled={firewallSimState === 'running'}
                      className="w-full py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow flex items-center justify-center gap-2"
                    >
                      <Shield className={`w-4 h-4 ${firewallSimState === 'running' ? 'animate-spin animate-pulse' : ''}`} />
                      {firewallSimState === 'running' ? 'Analyzing Protocol headers...' : 'Simulate Packet Ingress'}
                    </button>
                  </div>
                </div>

                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-left">
                  <h4 className="text-xs font-extrabold text-violet-800 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-violet-600" /> Stateful Deep L7 Inspection
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">
                    AWS Network Firewall sits in its own dedicated firewall subnets in each AZ. By updating local routing tables, all ingress traffic coming from the Internet Gateway (IGW) or Transit Gateway (TGW) must transit through the **Network Firewall Endpoint (VPCE)** before it reaches target subnets, ensuring complete protection.
                  </p>
                </div>
              </div>

              {/* Firewall Security Shield Visual Dashboard */}
              <div className="lg:col-span-8 space-y-6">
                <div className="da-card p-6 text-left relative overflow-hidden bg-slate-900 border border-slate-800 rounded-2xl text-white">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6">AWS Network Firewall Security Shield</h3>

                  <div className="h-44 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-center p-4 relative">
                    <svg viewBox="0 0 700 200" className="w-full h-full font-semibold">
                      {/* Left: Traffic Source */}
                      <g transform="translate(100, 100)">
                        <circle r="30" fill="#475569" stroke="#94a3b8" strokeWidth="2" />
                        <text y="5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">
                          {firewallTrafficSource.toUpperCase()}
                        </text>
                      </g>

                      {/* Path to Shield */}
                      <path d="M 130 100 L 310 100" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" />
                      {firewallSimState === 'running' && (
                        <path d="M 130 100 L 310 100" fill="none" stroke="#e11d48" strokeWidth="3" className="r53-flow-orange" />
                      )}

                      {/* Middle: Network Firewall Shield */}
                      <g transform="translate(350, 100)">
                        {firewallActive ? (
                          <>
                            <polygon points="0,-45 40,-15 40,30 0,55 -40,30 -40,-15" fill="#581c87" stroke="#a855f7" strokeWidth="3" className="animate-pulse" />
                            <text y="5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">AWS Firewall</text>
                          </>
                        ) : (
                          <>
                            <polygon points="0,-45 40,-15 40,30 0,55 -40,30 -40,-15" fill="#450a0a" stroke="#f43f5e" strokeWidth="1" />
                            <text y="5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">Bypassed (Risk)</text>
                          </>
                        )}
                      </g>

                      {/* Path to destination subnets */}
                      <path d="M 390 100 L 570 100" fill="none" stroke="#64748b" strokeWidth="2" strokeDasharray="5,5" />
                      {firewallSimState === 'running' && firewallActive && firewallRuleAction === 'allow' && (
                        <path d="M 390 100 L 570 100" fill="none" stroke="#10b981" strokeWidth="3" className="r53-flow-green" />
                      )}
                      {firewallSimState === 'running' && firewallActive && firewallRuleAction === 'alert' && (
                        <path d="M 390 100 L 570 100" fill="none" stroke="#f59e0b" strokeWidth="3" className="r53-flow-purple" />
                      )}

                      {/* Right: Protected subnet instances */}
                      <g transform="translate(600, 100)">
                        <rect x="-35" y="-35" width="70" height="70" rx="8" fill="#1e293b" stroke="#10b981" strokeWidth="2" />
                        <text y="5" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold">EC2 Instances</text>
                      </g>
                    </svg>
                  </div>

                  {/* Operational status indicators */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl text-center">
                      <span className="text-[10px] font-black text-slate-400 block uppercase">IPS Threat Engine</span>
                      <span className={`text-xs font-bold mt-2.5 block uppercase tracking-wider ${firewallActive ? 'text-emerald-400' : 'text-rose-500 font-extrabold'}`}>
                        {firewallActive ? '🛡️ Stateful Shield' : '⚠️ Disabled'}
                      </span>
                    </div>
                    <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl text-center">
                      <span className="text-[10px] font-black text-slate-400 block uppercase">Assigned Rule</span>
                      <span className="text-xs font-bold text-amber-400 mt-2.5 block uppercase tracking-wider">
                        {firewallRuleAction.toUpperCase()} Action
                      </span>
                    </div>
                    <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl text-center">
                      <span className="text-[10px] font-black text-slate-400 block uppercase">Packet Verdict</span>
                      <span className={`text-xs font-bold mt-2.5 block uppercase tracking-wider ${
                        !firewallActive ? 'text-rose-500' :
                        firewallRuleAction === 'allow' ? 'text-emerald-400' :
                        firewallRuleAction === 'drop' ? 'text-rose-400 font-black' : 'text-amber-400'
                      }`}>
                        {!firewallActive ? 'PASSED (UNCHECKED)' : firewallRuleAction === 'allow' ? 'ACCEPT (ROUTED)' : firewallRuleAction === 'drop' ? 'DROP (BLOCKED)' : 'ALERT (ROUTED)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Firewall logs console */}
                <div className="da-card text-left bg-slate-900 border border-slate-800 text-slate-200 p-5 rounded-2xl">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" /> Stateful Firewall Policy logs
                    </h3>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">FIREWALL_ALERT</span>
                  </div>

                  <div className="h-48 overflow-y-auto space-y-2 font-mono text-[11px] p-2 bg-slate-950/80 rounded-lg">
                    {firewallLogs.length === 0 ? (
                      <div className="text-slate-500 italic text-center pt-16">
                        Policy traces idle. Adjust source packet triggers and click "Simulate Packet Ingress" to test deep security filters.
                      </div>
                    ) : (
                      firewallLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-2 leading-relaxed">
                          <span className="text-slate-500">[{log.timestamp}]</span>
                          <span className={
                            log.type === 'success' ? 'text-emerald-400 font-bold' :
                            log.type === 'error' ? 'text-rose-400 font-bold' :
                            log.type === 'warn' ? 'text-amber-400 font-bold' : 'text-sky-300'
                          }>
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
      )}


    </div>
  );
}
