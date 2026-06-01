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
  Lock,
  Cpu,
  RefreshCw
} from 'lucide-react';

type TabType = 'cidr' | 'pipelines' | 'security' | 'endpoints' | 'hybrid' | 'notebook';

interface LogRow {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export default function NetworkingVPCVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('cidr');
  const [selectedNote, setSelectedNote] = useState<'bastion' | 'nat' | 'nacl' | 'cheat_sheet'>('bastion');

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
        <button className={`da-tb ${activeTab === 'notebook' ? 'da-on' : ''}`} onClick={() => setActiveTab('notebook')}>
          <BookOpen className="w-4 h-4" /> 6. Visual Architect Notes
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
              <div className="bg-blue-50 border border-blue-150 rounded-2xl p-4 mt-4 relative overflow-hidden">
                <span className="text-xs font-black text-blue-900 block mb-1">Visual Subnet Allocations Map</span>
                <div className="flex gap-1.5 h-6 rounded-lg overflow-hidden border border-blue-200 p-0.5 bg-white">
                  {/* Reserved Part */}
                  <div className="w-[18%] bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center rounded">
                    5 Reserved (18%)
                  </div>
                  {/* Usable Part */}
                  <div className="flex-grow bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center rounded animate-pulse">
                    {ipStats.usableIps} Usable Hosts (Remaining Space)
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 block mt-2 font-medium">
                  💡 Note: Creating an ALB or ECS Cluster requires ample usable IP addresses to assign Elastic Network Interfaces.
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
                <svg className="w-full min-w-[500px] h-[250px]" viewBox="0 0 500 250">
                  <defs>
                    <marker id="arrow-pipeline" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {/* Zones outlines */}
                  {/* Availability Zone 1 */}
                  <rect x="15" y="35" width="220" height="205" rx="10" fill="none" stroke={pipelineFlowType === 'az_failover' ? '#f43f5e' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray={pipelineFlowType === 'az_failover' ? '4,4' : 'none'} />
                  <text x="25" y="48" fill={pipelineFlowType === 'az_failover' ? '#e11d48' : '#94a3b8'} fontSize="8" fontWeight="bold">
                    Availability Zone 1 {pipelineFlowType === 'az_failover' && '⚠️ OUTAGE'}
                  </text>

                  {/* Availability Zone 2 */}
                  <rect x="255" y="35" width="220" height="205" rx="10" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                  <text x="265" y="48" fill="#94a3b8" fontSize="8" fontWeight="bold">Availability Zone 2</text>

                  {/* Internet Gateway Gateway ENI Node */}
                  <g transform="translate(210, 2)">
                    <rect x="0" y="0" width="80" height="24" rx="4" fill={igwAttached ? '#e0f2fe' : '#fee2e2'} stroke={igwAttached ? '#0284c7' : '#ef4444'} strokeWidth="1.5" />
                    <text x="40" y="15" fill={igwAttached ? '#0369a1' : '#991b1b'} fontSize="7.5" fontWeight="black" textAnchor="middle">
                      {igwAttached ? 'IGW Attached' : 'IGW Detached'}
                    </text>
                  </g>

                  {/* Conduit paths flows */}
                  {/* SSH Flow path: IGW -> Bastion (AZ-1) -> Private EC2 (AZ-1) */}
                  {pipelineFlowType === 'ssh_bastion' && pipelineSimState === 'success' && (
                    <g>
                      <path d="M 250 26 V 90 H 85 V 170" fill="none" className="da-flow-green" strokeWidth="2.5" markerEnd="url(#arrow-pipeline)" />
                    </g>
                  )}
                  {pipelineFlowType === 'ssh_bastion' && pipelineSimState === 'failed' && !igwAttached && (
                    <g>
                      <circle cx="250" cy="15" r="4" fill="#f43f5e" />
                      <line x1="250" y1="15" x2="250" y2="26" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3,3" />
                    </g>
                  )}

                  {/* EC2 Egress Flow path (AZ-1): Private EC2 -> NAT AZ-1 -> IGW */}
                  {pipelineFlowType === 'ec2_egress' && activeAz === 'az1' && pipelineSimState === 'success' && (
                    <g>
                      <path d="M 85 170 V 90 H 130 V 26" fill="none" className="da-flow-green" strokeWidth="2.5" markerEnd="url(#arrow-pipeline)" />
                    </g>
                  )}

                  {/* EC2 Egress Flow path (AZ-2): Private EC2 (AZ-2) -> NAT AZ-2 -> IGW */}
                  {pipelineFlowType === 'ec2_egress' && activeAz === 'az2' && pipelineSimState === 'success' && natHaMode === 'dual_ha' && (
                    <g>
                      <path d="M 325 170 V 90 H 370 V 26" fill="none" className="da-flow-green" strokeWidth="2.5" markerEnd="url(#arrow-pipeline)" />
                    </g>
                  )}

                  {/* AZ Failover path: Private EC2 (AZ-2) rerouting from AZ-1 single NAT down to AZ-2 if Multi-AZ */}
                  {pipelineFlowType === 'az_failover' && pipelineSimState === 'success' && (
                    <g>
                      <path d="M 325 170 V 90 H 370 V 26" fill="none" className="da-flow-green" strokeWidth="2.5" markerEnd="url(#arrow-pipeline)" />
                    </g>
                  )}

                  {/* AZ-1 Public Subnet Components */}
                  <g transform="translate(25, 60)">
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
                <svg className="w-full h-full min-h-[160px]" viewBox="0 0 340 160">
                  
                  {/* Flow pipeline */}
                  {/* Path: Inbound -> NACL -> SG -> EC2 -> Outbound return */}
                  <g fill="none" strokeWidth="1.5">
                    {/* Inbound path */}
                    <path d="M 10 75 H 90" stroke={animStep >= 1 ? '#2563eb' : '#cbd5e1'} className={animStep === 1 ? 'packet-pulse' : ''} strokeDasharray={animStep === 1 ? '6,4' : 'none'} />
                    {/* Subnet border path */}
                    <path d="M 130 75 H 200" stroke={animStep >= 2 ? '#2563eb' : '#cbd5e1'} />
                    {/* SG border path */}
                    <path d="M 230 75 H 275" stroke={animStep >= 3 ? '#2563eb' : '#cbd5e1'} />
                    {/* Return path (stateless return) */}
                    <path d="M 275 85 H 200 Q 165 110 130 85" stroke={animStep >= 4 ? (securitySimState === 'blocked_ephemeral' ? '#f43f5e' : '#10b981') : '#cbd5e1'} strokeWidth="1.5" />
                    <path d="M 90 85 H 10" stroke={securitySimState === 'passed' ? '#10b981' : '#cbd5e1'} />
                  </g>

                  {/* Packet visualizer indicator (dot) */}
                  {securitySimState === 'animating' && (
                    <g>
                      <circle r="4" fill="#2563eb" className="animate-ping">
                        {animStep === 1 && <animateMotion dur="0.8s" repeatCount="indefinite" path="M 10 75 H 90" />}
                        {animStep === 2 && <animateMotion dur="0.8s" repeatCount="indefinite" path="M 130 75 H 200" />}
                        {animStep === 3 && <animateMotion dur="0.8s" repeatCount="indefinite" path="M 230 75 H 275" />}
                        {animStep === 4 && <animateMotion dur="0.8s" repeatCount="indefinite" path="M 275 85 H 200 Q 165 110 130 85" />}
                      </circle>
                      <text x="170" y="20" fill="#2563eb" fontSize="8" fontWeight="bold" textAnchor="middle">
                        TCP Packet Port: {securityTestPort}
                      </text>
                    </g>
                  )}

                  {/* Subnet border firewall (Stateless NACL) */}
                  <g transform="translate(90, 45)">
                    <rect x="0" y="0" width="40" height="60" rx="5" 
                      fill={securitySimState === 'blocked_nacl' ? '#fee2e2' : '#eff6ff'} 
                      stroke={securitySimState === 'blocked_nacl' ? '#ef4444' : '#3b82f6'} strokeWidth="1.5" />
                    <text x="20" y="24" fill="#1e3a8a" fontSize="6.5" fontWeight="bold" textAnchor="middle">Stateless</text>
                    <text x="20" y="36" fill="#2563eb" fontSize="8.5" fontWeight="black" textAnchor="middle">NACL</text>
                    <text x="20" y="48" fill="#1e3a8a" fontSize="6" textAnchor="middle">Subnet</text>
                  </g>

                  {/* Security Group firewall (Stateful SG) */}
                  <g transform="translate(200, 45)">
                    <rect x="0" y="0" width="40" height="60" rx="5" 
                      fill={securitySimState === 'blocked_sg' ? '#fee2e2' : '#f0fdf4'} 
                      stroke={securitySimState === 'blocked_sg' ? '#ef4444' : '#10b981'} strokeWidth="1.5" />
                    <text x="20" y="24" fill="#065f46" fontSize="6.5" fontWeight="bold" textAnchor="middle">Stateful</text>
                    <text x="20" y="36" fill="#10b981" fontSize="9" fontWeight="black" textAnchor="middle">SG</text>
                    <text x="20" y="48" fill="#065f46" fontSize="6.5" textAnchor="middle">ENI</text>
                  </g>

                  {/* Private EC2 Instance target */}
                  <g transform="translate(275, 52)">
                    <rect x="0" y="0" width="55" height="46" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                    <text x="27.5" y="18" fill="#cbd5e1" fontSize="8" fontWeight="bold" textAnchor="middle">EC2</text>
                    <text x="27.5" y="32" fill="#94a3b8" fontSize="6" textAnchor="middle">Private Host</text>
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
              <div className="w-full flex-grow flex items-center justify-center mt-6">
                <svg className="w-full min-w-[480px] h-[200px]" viewBox="0 0 480 200">
                  <defs>
                    <marker id="arrow-vpn" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {/* Flow Conduits */}
                  {/* Tunnel A flow */}
                  <path d="M 125 75 Q 235 30 345 75" fill="none" 
                    className={vpnSimState === 'tunneling_a' ? 'da-flow-green' : ''} 
                    stroke={!tunnelAActive ? '#f43f5e' : '#cbd5e1'} strokeWidth="2.5" markerEnd="url(#arrow-vpn)" />

                  {/* Tunnel B flow */}
                  <path d="M 125 115 Q 235 160 345 115" fill="none" 
                    className={vpnSimState === 'tunneling_b' ? 'da-flow-green' : ''} 
                    stroke={!tunnelBActive ? '#f43f5e' : '#cbd5e1'} strokeWidth="2.5" markerEnd="url(#arrow-vpn)" />

                  {/* AWS VPC boundary node */}
                  <g transform="translate(15, 55)">
                    <rect x="0" y="0" width="110" height="80" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="55" y="22" fill="#1d4ed8" fontSize="8" fontWeight="black" textAnchor="middle">AWS VPC Subnet</text>
                    <text x="55" y="38" fill="#1d4ed8" fontSize="7" fontWeight="bold" textAnchor="middle">Virtual Gateway</text>
                    <text x="55" y="52" fill="#2563eb" fontSize="6.5" textAnchor="middle">IP: 10.0.0.0/16</text>
                    <text x="55" y="66" fill="#1e3a8a" fontSize="6.5" fontWeight="bold" textAnchor="middle">(VGW)</text>
                  </g>

                  {/* Corporate Data Center boundary node */}
                  <g transform="translate(345, 55)">
                    <rect x="0" y="0" width="110" height="80" rx="6" fill="#faf5ff" stroke="#a855f7" strokeWidth="1.5" />
                    <text x="55" y="22" fill="#6b21a8" fontSize="8" fontWeight="black" textAnchor="middle">On-Premises HQ</text>
                    <text x="55" y="38" fill="#6b21a8" fontSize="7" fontWeight="bold" textAnchor="middle">Customer Gateway</text>
                    <text x="55" y="52" fill="#7c3aed" fontSize="6.5" textAnchor="middle">IP: 192.168.10.0/24</text>
                    <text x="55" y="66" fill="#4c1d95" fontSize="6.5" fontWeight="bold" textAnchor="middle">(CGW)</text>
                  </g>

                  {/* Tunnel annotations */}
                  <text x="240" y="42" fill={tunnelAActive ? '#047857' : '#e11d48'} fontSize="7" fontWeight="black" textAnchor="middle">
                    IPsec Tunnel A {tunnelAActive ? '🟢 Up' : '🚨 Down'}
                  </text>
                  <text x="240" y="152" fill={tunnelBActive ? '#047857' : '#e11d48'} fontSize="7" fontWeight="black" textAnchor="middle">
                    IPsec Tunnel B {tunnelBActive ? '🟢 Up' : '🚨 Down'}
                  </text>
                </svg>
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
          
          {/* Dashboard Header Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg border border-blue-500/20">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_60%)]"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="bg-blue-500/30 border border-blue-400/20 text-blue-100 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full">
                  Advanced Study Sandbox
                </span>
                <h2 className="text-2xl font-black tracking-tight mt-1.5 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 stroke-[2]" /> Cloud Architect Interactive Learning Hub
                </h2>
                <p className="text-xs text-blue-100/90 mt-1 max-w-2xl leading-relaxed">
                  Interactive step-by-step simulations, comparative audits, and comprehensive cheat-sheets mapped directly from professional AWS networking architectural blueprints.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span className="text-xs font-bold text-emerald-300">Live Simulator Engine Ready</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left selector sidebar - Modern card buttons */}
            <div className="lg:col-span-3 space-y-3">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">Select Study Module:</span>
              
              <button
                onClick={() => setSelectedNote('bastion')}
                className={`w-full p-4 text-left rounded-xl transition-all duration-200 border flex flex-col justify-between min-h-[76px] ${
                  selectedNote === 'bastion'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-md shadow-blue-500/5 ring-1 ring-blue-400'
                    : 'bg-white border-slate-200 hover:border-slate-350 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="font-extrabold text-xs">1. Bastion SSH Hops</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-2 font-semibold">Single &amp; multi-target SSH tunnels</span>
              </button>

              <button
                onClick={() => setSelectedNote('nat')}
                className={`w-full p-4 text-left rounded-xl transition-all duration-200 border flex flex-col justify-between min-h-[76px] ${
                  selectedNote === 'nat'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-md shadow-blue-500/5 ring-1 ring-blue-400'
                    : 'bg-white border-slate-200 hover:border-slate-350 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600" />
                  <span className="font-extrabold text-xs">2. NAT GW vs NAT Instance</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-2 font-semibold">AWS Managed vs Outdated EC2 NAT</span>
              </button>

              <button
                onClick={() => setSelectedNote('nacl')}
                className={`w-full p-4 text-left rounded-xl transition-all duration-200 border flex flex-col justify-between min-h-[76px] ${
                  selectedNote === 'nacl'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-md shadow-blue-500/5 ring-1 ring-blue-400'
                    : 'bg-white border-slate-200 hover:border-slate-350 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span className="font-extrabold text-xs">3. Stateless Subnet NACL</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-2 font-semibold">Stateless filters vs stateful SG ENIs</span>
              </button>

              <button
                onClick={() => setSelectedNote('cheat_sheet')}
                className={`w-full p-4 text-left rounded-xl transition-all duration-200 border flex flex-col justify-between min-h-[76px] ${
                  selectedNote === 'cheat_sheet'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-md shadow-blue-500/5 ring-1 ring-blue-400'
                    : 'bg-white border-slate-200 hover:border-slate-350 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span className="font-extrabold text-xs">4. Hybrid Cheat-Sheet</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-2 font-semibold">VGW redundant VPNs &amp; Flow Logs</span>
              </button>

              <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 text-[11px] leading-relaxed text-slate-500 font-semibold space-y-1">
                <span className="text-slate-800 font-black block mb-0.5">💡 Expert Pro Tip:</span>
                "Always place a stateless NACL at the subnet border as a coarse ingress firewall, and a stateful SG directly on the instance ENI for fine-grained application-level control."
              </div>
            </div>

            {/* Right main body details grid */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* ========================================================================= */}
              {/* MODULE 1: BASTION HOST SH Hops                                            */}
              {/* ========================================================================= */}
              {selectedNote === 'bastion' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  
                  {/* Left Column: Theory & Cheat sheets */}
                  <div className="xl:col-span-6 space-y-4">
                    <div className="da-edu-card text-left">
                      <span className="da-badge-cyan">SECURITY INGRESS ARCHITECTURE</span>
                      <h3 className="text-lg font-black text-slate-900 mt-2 flex items-center gap-1.5">
                        Bastion Host Multi-Hop Tunneling
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        To manage assets located inside isolated private subnets, network architects place a hardened **Bastion Host** (jumpbox) inside a public subnet. Security rules are strictly layered to disallow unauthorized ingress scanning.
                      </p>

                      <div className="border-t border-slate-100 my-4 pt-4 space-y-3">
                        <span className="text-xs font-black text-slate-800 block">Security Group Configuration Best Practices:</span>
                        <table className="da-modern-table">
                          <thead>
                            <tr>
                              <th>Component ENI</th>
                              <th>Inbound Port / Protocol</th>
                              <th>Allowed Inbound Source</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="font-extrabold text-blue-600">Bastion Host SG</td>
                              <td className="font-mono text-slate-500">22 (TCP SSH)</td>
                              <td className="text-xs font-extrabold text-slate-800">Restricted Corp IP CIDR Only</td>
                            </tr>
                            <tr>
                              <td className="font-extrabold text-rose-600">Private EC2 SG</td>
                              <td className="font-mono text-slate-500">22 (TCP SSH)</td>
                              <td className="text-xs font-extrabold text-emerald-600">Bastion's Security Group ID</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-4 space-y-2">
                        <span className="text-xs font-black text-slate-800 block">Operational Protocols:</span>
                        <ul className="list-disc pl-4 text-[11px] text-slate-500 font-semibold space-y-1.5 leading-normal">
                          <li>Bastion hosts must never hold static private SSH credentials in their local disk volumes.</li>
                          <li>Swapping public keys dynamic caching using <strong className="text-blue-900">AWS Instance Connect</strong> or Session Manager is highly recommended.</li>
                          <li>Restricting ingress to specific Corporate gateway IP blocks completely blocks public port 22 scan sweeps.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Simulator Terminal */}
                  <div className="xl:col-span-6 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-5 shadow-sm min-h-[460px] relative overflow-hidden da-svg-bg">
                    
                    <div className="flex items-center justify-between pb-3 border-b border-slate-150 mb-3">
                      <div>
                        <span className="text-xs font-black text-slate-800 block">Interactive Jumpbox Simulation</span>
                        <span className="text-[10px] text-slate-400 block font-semibold">Select target topology to trigger session tracing</span>
                      </div>
                      
                      <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                        <button 
                          onClick={() => { setBastionTargetMode('single'); setBastionSimStep(0); }}
                          className={`px-2 py-1 rounded transition-all ${bastionTargetMode === 'single' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                        >
                          Single Target
                        </button>
                        <button
                          onClick={() => { setBastionTargetMode('multi'); setBastionSimStep(0); }}
                          className={`px-2 py-1 rounded transition-all ${bastionTargetMode === 'multi' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                        >
                          Multi-Target Hop
                        </button>
                      </div>
                    </div>

                    {/* Sim SVG */}
                    <div className="w-full flex-grow flex items-center justify-center py-2">
                      <svg className="w-full max-w-[340px] h-[190px]" viewBox="0 0 340 190">
                        {/* Client Node */}
                        <g transform="translate(10, 80)">
                          <rect x="0" y="0" width="40" height="28" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                          <text x="20" y="17" fill="#cbd5e1" fontSize="7" fontWeight="bold" textAnchor="middle">Dev Terminal</text>
                        </g>

                        {/* Public subnet boundaries */}
                        <rect x="75" y="20" width="90" height="150" rx="8" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="3,2" />
                        <text x="85" y="32" fill="#047857" fontSize="7" fontWeight="bold">Public Subnet</text>

                        {/* Private Subnet boundaries */}
                        <rect x="180" y="20" width="150" height="150" rx="8" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                        <text x="190" y="32" fill="#b91c1c" fontSize="7" fontWeight="bold">Private Subnet</text>

                        {/* Bastion Node */}
                        <g transform="translate(90, 75)" className={bastionSimStep === 3 || bastionSimStep === 4 ? 'da-sim-node-active' : ''}>
                          <rect x="0" y="0" width="60" height="36" rx="6" fill={bastionSimStep >= 3 ? '#ecfdf5' : '#ffffff'} stroke={bastionSimStep >= 3 ? '#10b981' : '#94a3b8'} strokeWidth="2" />
                          <text x="30" y="16" fill="#1e293b" fontSize="7.5" fontWeight="black" textAnchor="middle">Bastion Host</text>
                          <text x="30" y="27" fill={bastionSimStep >= 4 ? '#059669' : '#64748b'} fontSize="6.5" fontWeight="bold" textAnchor="middle">SG: Port 22</text>
                        </g>

                        {/* Target Node A */}
                        <g transform="translate(200, 75)" className={bastionSimStep === 6 ? 'da-sim-node-active' : ''}>
                          <rect x="0" y="0" width="55" height="36" rx="6" fill={bastionSimStep >= 6 ? '#fef2f2' : '#ffffff'} stroke={bastionSimStep >= 6 ? '#ef4444' : '#94a3b8'} strokeWidth="2" />
                          <text x="27.5" y="16" fill="#1e293b" fontSize="7.5" fontWeight="black" textAnchor="middle">Private EC2-A</text>
                          <text x="27.5" y="27" fill={bastionSimStep >= 6 ? '#b91c1c' : '#64748b'} fontSize="5.5" fontWeight="black" textAnchor="middle">SG: Bastion OK</text>
                        </g>

                        {/* Multi targets */}
                        {bastionTargetMode === 'multi' && (
                          <>
                            <g transform="translate(270, 45)" className={bastionSimStep === 6 ? 'da-sim-node-active' : ''}>
                              <rect x="0" y="0" width="55" height="36" rx="6" fill={bastionSimStep >= 6 ? '#fef2f2' : '#ffffff'} stroke={bastionSimStep >= 6 ? '#ef4444' : '#94a3b8'} strokeWidth="2" />
                              <text x="27.5" y="16" fill="#1e293b" fontSize="7" fontWeight="black" textAnchor="middle">Private EC2-B</text>
                              <text x="27.5" y="27" fill="#64748b" fontSize="5" fontWeight="bold" textAnchor="middle">SG: Bastion OK</text>
                            </g>
                            <g transform="translate(270, 110)" className={bastionSimStep === 6 ? 'da-sim-node-active' : ''}>
                              <rect x="0" y="0" width="55" height="36" rx="6" fill={bastionSimStep >= 6 ? '#fef2f2' : '#ffffff'} stroke={bastionSimStep >= 6 ? '#ef4444' : '#94a3b8'} strokeWidth="2" />
                              <text x="27.5" y="16" fill="#1e293b" fontSize="7" fontWeight="black" textAnchor="middle">Private EC2-C</text>
                              <text x="27.5" y="27" fill="#64748b" fontSize="5" fontWeight="bold" textAnchor="middle">SG: Bastion OK</text>
                            </g>
                          </>
                        )}

                        {/* Active packet flow overlays */}
                        {bastionSimStep === 1 && (
                          <line x1="50" y1="94" x2="85" y2="94" stroke="#3b82f6" strokeWidth="3" className="da-flow-fast" />
                        )}
                        {bastionSimStep === 2 && (
                          <line x1="50" y1="94" x2="85" y2="94" stroke="#10b981" strokeWidth="3" className="da-flow-fast" />
                        )}
                        {bastionSimStep === 3 && (
                          <circle cx="120" cy="93" r="5" fill="#10b981" className="animate-ping" />
                        )}
                        {bastionSimStep === 4 && (
                          <circle cx="120" cy="93" r="5" fill="#3b82f6" className="animate-pulse" />
                        )}
                        {bastionSimStep === 5 && (
                          <>
                            <path d="M 150 93 L 200 93" fill="none" stroke="#2563eb" strokeWidth="2.5" className="da-flow-fast" />
                            {bastionTargetMode === 'multi' && (
                              <>
                                <path d="M 150 93 Q 190 55 270 63" fill="none" stroke="#2563eb" strokeWidth="2.5" className="da-flow-fast" />
                                <path d="M 150 93 Q 190 135 270 128" fill="none" stroke="#2563eb" strokeWidth="2.5" className="da-flow-fast" />
                              </>
                            )}
                          </>
                        )}
                        {bastionSimStep === 6 && (
                          <g>
                            <circle cx="227" cy="93" r="4" fill="#ef4444" className="animate-ping" />
                            {bastionTargetMode === 'multi' && (
                              <>
                                <circle cx="297" cy="63" r="4" fill="#ef4444" className="animate-ping" />
                                <circle cx="297" cy="128" r="4" fill="#ef4444" className="animate-ping" />
                              </>
                            )}
                          </g>
                        )}
                      </svg>
                    </div>

                    {/* Sim controls and logs terminal */}
                    <div className="space-y-3">
                      <button
                        onClick={runBastionStepSim}
                        disabled={bastionSimStep > 0 && bastionSimStep < 6}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow"
                      >
                        {bastionSimStep > 0 && bastionSimStep < 6 ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Tracing SSH handshake steps...
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" /> Trigger Step-by-Step SSH Flow
                          </>
                        )}
                      </button>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[9px] text-slate-300 min-h-[90px] max-h-[90px] overflow-y-auto leading-normal shadow-inner">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-1 mb-1.5">
                          📟 SSH tunnel active telemetry
                        </span>
                        {bastionLogs.length === 0 ? (
                          <span className="text-slate-500 italic">Click the trigger button above to capture active route tracing...</span>
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
              )}

              {/* ========================================================================= */}
              {/* MODULE 2: NAT GATEWAY VS NAT INSTANCE                                    */}
              {/* ========================================================================= */}
              {selectedNote === 'nat' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  
                  {/* Left Column: Theory & Comparison */}
                  <div className="xl:col-span-6 space-y-4">
                    <div className="da-edu-card text-left">
                      <span className="da-badge-cyan">SECURE UNIDIRECTIONAL EGRESS</span>
                      <h3 className="text-lg font-black text-slate-900 mt-2">
                        NAT Gateway vs NAT Instances (Outdated)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        To fetch software patches securely from external repositories, private instances require NAT translators. AWS offers fully managed **NAT Gateways**, which replace the outdated **NAT Instances** which were deployed on standard EC2 instances.
                      </p>

                      <div className="border-t border-slate-100 my-4 pt-4">
                        <span className="text-xs font-black text-slate-800 block mb-3">Architectural Feature Comparison:</span>
                        <table className="da-modern-table">
                          <thead>
                            <tr>
                              <th>Feature metric</th>
                              <th>AWS NAT Gateway</th>
                              <th>NAT Instance (Outdated)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="font-extrabold">Resiliency / HA</td>
                              <td><span className="da-badge-emerald">Built-in (Multi-AZ Ready)</span></td>
                              <td><span className="da-badge-rose">Manual setup (Single EC2 bottleneck)</span></td>
                            </tr>
                            <tr>
                              <td className="font-extrabold">Security Groups</td>
                              <td><span className="da-badge-emerald">None to manage/required!</span></td>
                              <td><span className="da-badge-amber">Requires custom SG attachments</span></td>
                            </tr>
                            <tr>
                              <td className="font-extrabold">Src/Dest Check</td>
                              <td><span className="da-badge-emerald">Not required</span></td>
                              <td><span className="da-badge-amber">Must be disabled manually!</span></td>
                            </tr>
                            <tr>
                              <td className="font-extrabold">Performance scaling</td>
                              <td><span className="da-badge-emerald">Auto-scales up to 45 Gbps</span></td>
                              <td><span className="da-badge-rose">Limited by EC2 bandwidth limits</span></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] leading-relaxed text-slate-500 font-semibold mt-4">
                        <span className="text-xs font-black text-slate-800 block mb-1">Architectural Core takeaway:</span>
                        "NAT Gateways operate entirely as transparent network appliances—meaning they translate the source IPs cleanly at the routing layer. Consequently, <strong className="text-rose-700 font-extrabold">no security groups are required or attached to NAT Gateways</strong>. This completely simplifies subnet security auditing."
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Interactive Diagram */}
                  <div className="xl:col-span-6 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-5 shadow-sm min-h-[460px] relative overflow-hidden da-svg-bg">
                    
                    <div className="flex items-center justify-between pb-3 border-b border-slate-150 mb-3">
                      <div>
                        <span className="text-xs font-black text-slate-800 block">Outbound Egress Routing simulator</span>
                        <span className="text-[10px] text-slate-400 block font-semibold">Animate private updates exit path</span>
                      </div>
                      
                      <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
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
                          NAT Instance (EC2)
                        </button>
                      </div>
                    </div>

                    {/* SVG NAT */}
                    <div className="w-full flex-grow flex items-center justify-center py-2">
                      <svg className="w-full max-w-[340px] h-[190px]" viewBox="0 0 340 190">
                        {/* Private EC2 Node */}
                        <g transform="translate(15, 75)" className={natSimStep === 1 ? 'da-sim-node-active' : ''}>
                          <rect x="0" y="0" width="55" height="36" rx="4" fill={natSimStep >= 1 ? '#eff6ff' : '#ffffff'} stroke="#3b82f6" strokeWidth="1.5" />
                          <text x="27.5" y="16" fill="#1e293b" fontSize="7.5" fontWeight="bold" textAnchor="middle">Private EC2</text>
                          <text x="27.5" y="27" fill="#64748b" fontSize="6.5" textAnchor="middle">IP: 10.0.2.80</text>
                        </g>

                        {/* Managed NAT Gateway */}
                        {natEgressMode === 'gateway' ? (
                          <g transform="translate(135, 70)" className={natSimStep === 3 ? 'da-sim-node-active' : ''}>
                            <rect x="0" y="0" width="70" height="46" rx="6" fill={natSimStep >= 3 ? '#ecfdf5' : '#f8fafc'} stroke="#10b981" strokeWidth="2.5" />
                            <text x="35" y="16" fill="#047857" fontSize="8" fontWeight="black" textAnchor="middle">NAT Gateway</text>
                            <text x="35" y="27" fill="#065f46" fontSize="6" fontWeight="bold" textAnchor="middle">Managed Appliance</text>
                            <text x="35" y="38" fill="#4b5563" fontSize="6" fontStyle="italic" textAnchor="middle">No SG managed!</text>
                          </g>
                        ) : (
                          <g transform="translate(135, 70)" className={natSimStep === 3 ? 'da-sim-node-active' : ''}>
                            <rect x="0" y="0" width="70" height="46" rx="6" fill={natSimStep >= 3 ? '#fffbeb' : '#f8fafc'} stroke="#f59e0b" strokeWidth="2" />
                            <text x="35" y="16" fill="#b45309" fontSize="8" fontWeight="black" textAnchor="middle">NAT Instance</text>
                            <text x="35" y="27" fill="#d97706" fontSize="6.5" fontWeight="bold" textAnchor="middle">EC2 AMI Node</text>
                            <text x="35" y="38" fill="#7f1d1d" fontSize="6.5" fontWeight="black" textAnchor="middle">Disable Src/Dest!</text>
                          </g>
                        )}

                        {/* Internet Gateway */}
                        <g transform="translate(265, 75)" className={natSimStep === 4 ? 'da-sim-node-active' : ''}>
                          <rect x="0" y="0" width="60" height="36" rx="6" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.5" />
                          <text x="30" y="16" fill="#1e3a8a" fontSize="7.5" fontWeight="black" textAnchor="middle">IGW Router</text>
                          <text x="30" y="27" fill="#2563eb" fontSize="6.5" fontWeight="bold" textAnchor="middle">0.0.0.0/0 OK</text>
                        </g>

                        {/* Dynamic route flow path lines */}
                        {natSimStep === 1 && (
                          <line x1="70" y1="93" x2="135" y2="93" stroke="#2563eb" strokeWidth="3" className="da-flow-fast" />
                        )}
                        {natSimStep === 2 && (
                          <line x1="70" y1="93" x2="135" y2="93" stroke="#d97706" strokeWidth="3" className="da-flow-fast" />
                        )}
                        {natSimStep === 3 && (
                          <line x1="205" y1="93" x2="265" y2="93" stroke="#10b981" strokeWidth="3" className="da-flow-fast" />
                        )}
                        {natSimStep === 4 && (
                          <circle cx="295" cy="93" r="5" fill="#10b981" className="animate-ping" />
                        )}
                      </svg>
                    </div>

                    {/* Controller terminal logs */}
                    <div className="space-y-3">
                      <button
                        onClick={runNatStepSim}
                        disabled={natSimStep > 0 && natSimStep < 4}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow"
                      >
                        {natSimStep > 0 && natSimStep < 4 ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Querying route translators...
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" /> Trigger Egress software patch download
                          </>
                        )}
                      </button>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[9px] text-slate-300 min-h-[90px] max-h-[90px] overflow-y-auto leading-normal shadow-inner">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-1 mb-1.5">
                          📟 Egress route logs
                        </span>
                        {natLogs.length === 0 ? (
                          <span className="text-slate-500 italic">Click the trigger button to evaluate public update pathways...</span>
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
              )}

              {/* ========================================================================= */}
              {/* MODULE 3: STATELESS SUBNET NACL VS STATEFUL SECURITY GROUP                 */}
              {/* ========================================================================= */}
              {selectedNote === 'nacl' && (
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  
                  {/* Left Column: Theory & comparative table */}
                  <div className="xl:col-span-6 space-y-4">
                    <div className="da-edu-card text-left">
                      <span className="da-badge-cyan">LAYERED BOUNDARY SECURITY</span>
                      <h3 className="text-lg font-black text-slate-900 mt-2">
                        Stateless NACL vs Stateful Security Group
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        AWS provides security boundaries at two independent layers: stateless Network Access Control Lists (NACL) matching subnet entries sequentially, and stateful Security Groups attaching directly to Elastic Network Interfaces (ENIs).
                      </p>

                      <div className="border-t border-slate-100 my-4 pt-4">
                        <span className="text-xs font-black text-slate-800 block mb-3">Key Contrast Summary:</span>
                        <table className="da-modern-table">
                          <thead>
                            <tr>
                              <th>Audit metric</th>
                              <th>Subnet Network ACL (NACL)</th>
                              <th>Security Group (SG)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="font-extrabold">Boundary attachment</td>
                              <td className="text-blue-700 font-bold">Subnet Level</td>
                              <td className="text-emerald-700 font-bold">Instance ENI Level</td>
                            </tr>
                            <tr>
                              <td className="font-extrabold">State tracking</td>
                              <td><span className="da-badge-rose">Stateless (Must allow return path)</span></td>
                              <td><span className="da-badge-emerald">Stateful (Auto-approves returns)</span></td>
                            </tr>
                            <tr>
                              <td className="font-extrabold">Ruleset matching</td>
                              <td>Sequential rule indices (Rule 100, 200...)</td>
                              <td>Evaluates all rules collectively before permit</td>
                            </tr>
                            <tr>
                              <td className="font-extrabold">Explicit DENY</td>
                              <td><span className="da-badge-emerald">Supported</span></td>
                              <td><span className="da-badge-rose">No Deny rules (Allow only)</span></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mt-4 space-y-1.5 leading-normal">
                        <span className="text-xs font-black text-slate-800 block">The stateless return Ephemeral port trap:</span>
                        <p className="text-[11px] text-slate-500 font-semibold">
                          Because Security Groups track states, return outbound HTTP response flows are automatically permitted. However, **NACLs are stateless**. Even if ingress Port 80 is allowed, response packets flowing back to a client must be explicitly allowed outwards!
                        </p>
                        <p className="text-[11px] text-slate-500 font-semibold">
                          Since client ports are assigned dynamically, custom outbound NACL rules **MUST permit return traffic to the Ephemeral Port Range** (`1024-65535`). If blocked, transaction handshakes time out at the subnet boundary!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live step-by-step controller */}
                  <div className="xl:col-span-6 flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-5 shadow-sm min-h-[460px] relative overflow-hidden da-svg-bg">
                    
                    <div className="flex items-center justify-between pb-3 border-b border-slate-150 mb-3">
                      <div>
                        <span className="text-xs font-black text-slate-800 block">Stateful vs Stateless telemetry Sandbox</span>
                        <span className="text-[10px] text-slate-400 block font-semibold">Configure rules to watch return path drops</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold">Outbound Ephemeral:</span>
                        <button
                          onClick={() => { setNaclReturnAllowed(!naclReturnAllowed); setNaclSimStep(0); }}
                          className={`px-2 py-0.5 rounded text-[10px] font-black border transition-all ${
                            naclReturnAllowed ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'
                          }`}
                        >
                          {naclReturnAllowed ? 'ALLOWED' : 'BLOCKED'}
                        </button>
                      </div>
                    </div>

                    {/* SVG NACL */}
                    <div className="w-full flex-grow flex items-center justify-center py-2">
                      <svg className="w-full max-w-[340px] h-[190px]" viewBox="0 0 340 190">
                        {/* Subnet boundary Box representing stateless NACL */}
                        <rect x="75" y="15" width="250" height="160" rx="8" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="4,2" />
                        <text x="85" y="27" fill="#2563eb" fontSize="7" fontWeight="bold">Subnet Border (Stateless NACL)</text>

                        {/* Client Node */}
                        <g transform="translate(10, 75)" className={naclSimStep === 1 ? 'da-sim-node-active' : ''}>
                          <rect x="0" y="0" width="45" height="30" rx="4" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
                          <text x="22.5" y="14" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">External client</text>
                          <text x="22.5" y="24" fill="#94a3b8" fontSize="5.5" textAnchor="middle">Port: 52331</text>
                        </g>

                        {/* NACL Gate Node */}
                        <g transform="translate(90, 70)" className={naclSimStep === 2 || (naclSimStep === 5 && !naclReturnAllowed) ? 'da-sim-node-active' : ''}>
                          <rect x="0" y="0" width="55" height="40" rx="4" fill={naclSimStep >= 2 ? '#ecfdf5' : '#f8fafc'} stroke="#3b82f6" strokeWidth="2" />
                          <text x="27.5" y="15" fill="#1e3a8a" fontSize="8" fontWeight="black" textAnchor="middle">NACL In/Out</text>
                          <text x="27.5" y="25" fill="#475569" fontSize="6.5" textAnchor="middle">Rule 100</text>
                          <text x="27.5" y="34" fill="#b91c1c" fontSize="5.5" fontWeight="bold" textAnchor="middle">Stateless</text>
                        </g>

                        {/* EC2 Instance representing stateful SG */}
                        <g transform="translate(220, 70)" className={naclSimStep === 3 || naclSimStep === 4 ? 'da-sim-node-active' : ''}>
                          <rect x="0" y="0" width="70" height="40" rx="6" fill={naclSimStep >= 3 ? '#f0fdf4' : '#ffffff'} stroke="#10b981" strokeWidth="2" />
                          <text x="35" y="15" fill="#065f46" fontSize="8" fontWeight="black" textAnchor="middle">Security Group</text>
                          <text x="35" y="25" fill="#047857" fontSize="7" fontWeight="bold" textAnchor="middle">(Stateful SG)</text>
                          <text x="35" y="34" fill="#1e293b" fontSize="6" textAnchor="middle">EC2: Port 80</text>
                        </g>

                        {/* Active flow overlays */}
                        {naclSimStep === 1 && (
                          <path d="M 55 90 H 90" fill="none" stroke="#2563eb" strokeWidth="2.5" className="da-flow-fast" />
                        )}
                        {naclSimStep === 2 && (
                          <path d="M 145 90 H 220" fill="none" stroke="#2563eb" strokeWidth="2.5" className="da-flow-fast" />
                        )}
                        {naclSimStep === 3 && (
                          <circle cx="255" cy="90" r="5" fill="#10b981" className="animate-ping" />
                        )}
                        {naclSimStep === 4 && (
                          <path d="M 220 102 H 145" fill="none" stroke="#10b981" strokeWidth="2.5" className="da-flow-fast" />
                        )}
                        {naclSimStep === 5 && (
                          <>
                            {naclReturnAllowed ? (
                              <path d="M 90 102 H 55" fill="none" stroke="#10b981" strokeWidth="2.5" className="da-flow-fast" />
                            ) : (
                              <g>
                                <line x1="117" y1="85" x2="117" y2="110" stroke="#f43f5e" strokeWidth="3" />
                                <text x="117" y="125" fill="#e11d48" fontSize="8" fontWeight="black" textAnchor="middle" className="animate-bounce">Dropped Statelessly</text>
                              </g>
                            )}
                          </>
                        )}
                      </svg>
                    </div>

                    {/* Simulation Controller terminal */}
                    <div className="space-y-3">
                      <button
                        onClick={runNaclStepSim}
                        disabled={naclSimStep > 0 && naclSimStep < 5}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all shadow"
                      >
                        {naclSimStep > 0 && naclSimStep < 5 ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Tracing stateless packet return...
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" /> Trigger Stateless/Stateful packet trace
                          </>
                        )}
                      </button>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-[9px] text-slate-300 min-h-[90px] max-h-[90px] overflow-y-auto leading-normal shadow-inner">
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block border-b border-slate-800 pb-1 mb-1.5">
                          📟 Stateless firewall audits
                        </span>
                        {naclLogs.length === 0 ? (
                          <span className="text-slate-500 italic">Click the trigger button to evaluate ephemeral return path packet traces...</span>
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
              )}

              {/* ========================================================================= */}
              {/* MODULE 4: ARCHITECT STUDY REFERENCE CHEAT SHEET                            */}
              {/* ========================================================================= */}
              {selectedNote === 'cheat_sheet' && (
                <div className="space-y-6">
                  
                  {/* Hybrid Connectivity grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    <div className="da-edu-card text-left">
                      <span className="da-badge-cyan">REDUNDANT HYBRID PIPELINES</span>
                      <h4 className="text-sm font-black text-slate-900 mt-2">
                        Site-to-Site VPN REDUNDANCY CHEAT SHEET
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-normal">
                        To link corporate physical offices to AWS VPCs, standard practices require establishing dual IPsec tunnels terminated at a **Virtual Private Gateway (VGW)** and a customer-end **Customer Gateway (CGW)**.
                      </p>
                      
                      <div className="border-t border-slate-100 mt-4 pt-3.5 space-y-2 text-xs">
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                          <span className="font-extrabold text-slate-700">Tunnel Allocation</span>
                          <span className="text-slate-500 font-semibold">AWS provides 2 redundant active tunnels</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                          <span className="font-extrabold text-slate-700">Route Propagation</span>
                          <span className="text-slate-500 font-semibold">BGP dynamically advertises routes</span>
                        </div>
                        <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                          <span className="font-extrabold text-slate-700">Active-Passive prepending</span>
                          <span className="text-slate-500 font-semibold">AS_PATH prepending selects primary path</span>
                        </div>
                      </div>
                    </div>

                    <div className="da-edu-card text-left">
                      <span className="da-badge-rose">VPC TELEMETRY AUDITING</span>
                      <h4 className="text-sm font-black text-slate-900 mt-2">
                        VPC Flow Logs Log Format reference
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 leading-normal">
                        VPC Flow logs record all raw IP metadata flowing through Elastic Network Interfaces (ENIs). Let security engineers audit allowed and blocked requests.
                      </p>

                      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 font-mono text-[9px] text-slate-300 space-y-2 mt-4 shadow-inner">
                        <span className="text-[7.5px] font-black text-slate-500 block uppercase tracking-wider border-b border-slate-800 pb-1 mb-1.5">
                          Standard AWS flow log structure
                        </span>
                        <div className="text-slate-400">
                          <span className="text-blue-400">v5</span> <span className="text-emerald-400">eni-01a2b3c4</span> <span className="text-cyan-400">10.0.2.80</span> <span className="text-purple-400">198.51.100.44</span> <span className="text-amber-400">80 52331 6 15 960</span> <span className="text-emerald-400">ACCEPT</span> <span className="text-slate-400">OK</span>
                        </div>
                        <div className="border-t border-slate-800 pt-2 text-[8px] text-slate-500 font-semibold leading-relaxed space-y-1">
                          <div>• <span className="text-blue-400 font-bold">v5</span>: Flow log version index format</div>
                          <div>• <span className="text-cyan-400 font-bold">10.0.2.80</span>: Source Private IP address</div>
                          <div>• <span className="text-purple-400 font-bold">198.51.100.44</span>: Destination Public address</div>
                          <div>• <span className="text-amber-400 font-bold">80 52331 6</span>: Target port (80), Client port (52331), Protocol (6=TCP)</div>
                          <div>• <span className="text-emerald-400 font-bold">ACCEPT</span>: Security Group &amp; NACL evaluated and permitted request</div>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Complete study cheat-sheet reference tables */}
                  <div className="da-edu-card text-left">
                    <h3 className="text-sm font-black text-slate-900 mb-3">VPC Core Security Cheat-Sheet</h3>
                    <table className="da-modern-table">
                      <thead>
                        <tr>
                          <th>AWS VPC Concept</th>
                          <th>Primary Architectural Target</th>
                          <th>Core Implementation Trap / Constraint</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="font-extrabold text-blue-900">Bastion Jumpbox</td>
                          <td>Secures SSH ingress hops to isolated private subnets.</td>
                          <td>Must never hold static private keys. Restricted SGs strictly permit only corporate CIDRs.</td>
                        </tr>
                        <tr>
                          <td className="font-extrabold text-blue-900">NAT Gateway</td>
                          <td>Transparent egress routing with no security groups to manage.</td>
                          <td>Must reside in a Public Subnet with a route map pointing egress to the IGW.</td>
                        </tr>
                        <tr>
                          <td className="font-extrabold text-blue-900">NACL (Stateless)</td>
                          <td>Subnet border security coarse filtering. Supporting explicit denies.</td>
                          <td>Stateless nature **requires outbound Ephemeral port ranges** (`1024-65535`) allowed.</td>
                        </tr>
                        <tr>
                          <td className="font-extrabold text-blue-900">Security Group (Stateful)</td>
                          <td>Granular per-ENI security filters. State tracked automatically.</td>
                          <td>Does not support explicit DENY rules. All filters are ALLOW only.</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                </div>
              )}

            </div>
          </div>
        </div>
      )}


    </div>
  );
}
