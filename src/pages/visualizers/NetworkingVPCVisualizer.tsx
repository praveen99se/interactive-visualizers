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
  BookOpen
} from 'lucide-react';

type TabType = 'cidr' | 'pipelines' | 'security' | 'endpoints' | 'hybrid' | 'notebook';

interface LogRow {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export default function NetworkingVPCVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('cidr');
  const [selectedNote, setSelectedNote] = useState<'bastion' | 'nat' | 'nacl'>('bastion');

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

        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Comic+Neue:wght@400;700&display=swap');
        
        .da-notebook-paper {
          background-color: #faf9f6;
          background-image: 
            linear-gradient(rgba(59, 130, 246, 0.04) 1.5px, transparent 1.5px),
            linear-gradient(90deg, rgba(59, 130, 246, 0.04) 1.5px, transparent 1.5px);
          background-size: 20px 20px;
          border: 2px solid #e2e8f0;
          box-shadow: inset 0 0 40px rgba(0, 0, 0, 0.02), 0 4px 15px rgba(0, 0, 0, 0.04);
          position: relative;
          border-radius: 12px;
        }
        .da-notebook-redline {
          position: absolute;
          left: 45px;
          top: 0;
          bottom: 0;
          width: 2px;
          background-color: rgba(239, 68, 68, 0.2);
        }
        .da-handwritten {
          font-family: 'Caveat', 'Comic Neue', cursive, sans-serif;
          letter-spacing: 0.5px;
        }
        .da-handwritten-title {
          font-family: 'Caveat', cursive, sans-serif;
          font-size: 24px;
          font-weight: 700;
          color: #1e3a8a;
          text-decoration: underline;
          text-underline-offset: 4px;
        }
        .da-sketch-element {
          stroke-linecap: round;
          stroke-linejoin: round;
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
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <BookOpen className="w-5 h-5" /> Visual Architect Notebook: VPC Core Blueprint Sketches
            </h2>
            <p className="da-card-desc">
              Review Amazon Web Services (AWS) networking structures with direct transcriptions and hand-drawn style blueprints mapped from operational engineering notes.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Note Selector Sidebar */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between space-y-4 font-semibold">
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2">Notebook Blueprint Select:</span>
                
                <button
                  onClick={() => setSelectedNote('bastion')}
                  className={`w-full p-3 text-left border rounded-xl transition-all ${
                    selectedNote === 'bastion' ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold'
                  }`}
                >
                  📝 Notes Page 1: Bastion Hosts
                  <span className="block text-[9.5px] text-slate-400 font-medium mt-0.5">Secure SSH hops and restricted Security Groups</span>
                </button>

                <button
                  onClick={() => setSelectedNote('nat')}
                  className={`w-full p-3 text-left border rounded-xl transition-all ${
                    selectedNote === 'nat' ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold'
                  }`}
                >
                  📝 Notes Page 2: NAT Gateways
                  <span className="block text-[9.5px] text-slate-400 font-medium mt-0.5">Unidirectional egress and route table translations</span>
                </button>

                <button
                  onClick={() => setSelectedNote('nacl')}
                  className={`w-full p-3 text-left border rounded-xl transition-all ${
                    selectedNote === 'nacl' ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300' : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold'
                  }`}
                >
                  📝 Notes Page 3: Subnet NACLs
                  <span className="block text-[9.5px] text-slate-400 font-medium mt-0.5">Stateless subnet boundaries vs stateful SGs</span>
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-150 rounded-xl p-3 text-[11px] leading-relaxed text-blue-900 mt-4 font-medium text-left">
                <span className="font-extrabold text-blue-950 block mb-1">Architectural Core Note:</span>
                "Always map out security boundaries using nested firewalls—Stateless NACLs at the Subnet border, and Stateful Security Groups at the ENI instance boundary."
              </div>
            </div>

            {/* Hand-drawn Blueprint Page */}
            <div className="lg:col-span-8 da-notebook-paper p-6 relative min-h-[460px] flex flex-col justify-between text-left">
              <div className="da-notebook-redline"></div>
              
              <div className="pl-10 space-y-4">
                
                <h3 className="da-handwritten-title text-2xl font-black mb-3">
                  {selectedNote === 'bastion' && 'Topic: Bastion Host Architecture & Security Hops'}
                  {selectedNote === 'nat' && 'Topic: NAT Gateway Routing & Security Exclusivity'}
                  {selectedNote === 'nacl' && 'Topic: Network ACL (NACL) Subnet Boundaries'}
                </h3>

                {/* Hand-drawn SVG rendering */}
                <div className="w-full flex justify-center py-2 bg-white/40 border border-slate-100 rounded-xl p-2 shadow-inner">
                  {selectedNote === 'bastion' && (
                    <svg className="w-full max-w-[460px] h-[210px]" viewBox="0 0 460 210">
                      {/* VPC border */}
                      <rect x="25" y="35" width="410" height="160" rx="6" fill="none" stroke="#1e3a8a" strokeWidth="2" className="da-sketch-element" />
                      <text x="40" y="48" fill="#1e3a8a" fontSize="8.5" fontWeight="bold" className="da-handwritten">VPC Boundary</text>

                      {/* Public Subnet box */}
                      <rect x="220" y="60" width="200" height="120" rx="6" fill="none" stroke="#10b981" strokeWidth="1.5" className="da-sketch-element" strokeDasharray="4,2" />
                      <text x="230" y="72" fill="#10b981" fontSize="8" fontWeight="bold" className="da-handwritten">Public Subnet</text>

                      {/* Private Subnet box */}
                      <rect x="35" y="60" width="170" height="120" rx="6" fill="none" stroke="#dc2626" strokeWidth="1.5" className="da-sketch-element" strokeDasharray="4,2" />
                      <text x="45" y="72" fill="#dc2626" fontSize="8" fontWeight="bold" className="da-handwritten">Private Subnet</text>

                      {/* Internet Gateway */}
                      <g transform="translate(200, 10)">
                        <rect x="0" y="0" width="60" height="18" rx="3" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
                        <text x="30" y="12" fill="#0369a1" fontSize="7" fontWeight="bold" textAnchor="middle" className="da-handwritten">Internet Gateway</text>
                      </g>

                      {/* Route Table */}
                      <g transform="translate(195, 110)">
                        <rect x="0" y="0" width="45" height="22" rx="3" fill="#f8fafc" stroke="#64748b" strokeWidth="1" />
                        <text x="22.5" y="14" fill="#475569" fontSize="6.5" fontWeight="bold" textAnchor="middle" className="da-handwritten">Route Table</text>
                      </g>

                      {/* Bastion Host ENI/SG in Public Subnet */}
                      <g transform="translate(250, 100)">
                        <rect x="0" y="0" width="80" height="40" rx="4" fill="#f0fdf4" stroke="#10b981" strokeWidth="1.5" className="da-sketch-element" />
                        <text x="40" y="16" fill="#1e293b" fontSize="8" fontWeight="black" textAnchor="middle" className="da-handwritten">Bastion Host</text>
                        <text x="40" y="28" fill="#047857" fontSize="7" fontWeight="bold" textAnchor="middle" className="da-handwritten">SG: Inbound 22</text>
                      </g>

                      {/* Private EC2 SG in Private Subnet */}
                      <g transform="translate(50, 100)">
                        <rect x="0" y="0" width="80" height="40" rx="4" fill="#fef2f2" stroke="#dc2626" strokeWidth="1.5" className="da-sketch-element" />
                        <text x="40" y="16" fill="#1e293b" fontSize="8" fontWeight="black" textAnchor="middle" className="da-handwritten">Private EC2</text>
                        <text x="40" y="28" fill="#b91c1c" fontSize="7" fontWeight="bold" textAnchor="middle" className="da-handwritten">SG: Allow Bastion</text>
                      </g>

                      {/* SSH Handshake Arrow paths */}
                      <path d="M 230 28 L 290 100" fill="none" stroke="#2563eb" strokeWidth="1.5" markerEnd="url(#arrow-endpoint)" strokeDasharray="3,3" />
                      <text x="268" y="60" fill="#2563eb" fontSize="7" fontWeight="bold" className="da-handwritten">SSH (Port 22)</text>

                      <path d="M 250 120 H 130" fill="none" stroke="#10b981" strokeWidth="1.8" markerEnd="url(#arrow-endpoint)" />
                      <text x="190" y="115" fill="#047857" fontSize="7.5" fontWeight="bold" textAnchor="middle" className="da-handwritten">Hop (Private SSH)</text>
                    </svg>
                  )}

                  {selectedNote === 'nat' && (
                    <svg className="w-full max-w-[460px] h-[210px]" viewBox="0 0 460 210">
                      {/* VPC border */}
                      <rect x="25" y="35" width="410" height="160" rx="6" fill="none" stroke="#1e3a8a" strokeWidth="2" className="da-sketch-element" />
                      <text x="40" y="48" fill="#1e3a8a" fontSize="8.5" fontWeight="bold" className="da-handwritten">VPC</text>

                      {/* Public Subnet */}
                      <rect x="225" y="60" width="195" height="120" rx="6" fill="none" stroke="#10b981" strokeWidth="1.5" className="da-sketch-element" strokeDasharray="4,2" />
                      <text x="235" y="72" fill="#10b981" fontSize="8" fontWeight="bold" className="da-handwritten">Public Subnet</text>

                      {/* Private Subnet */}
                      <rect x="40" y="60" width="165" height="120" rx="6" fill="none" stroke="#dc2626" strokeWidth="1.5" className="da-sketch-element" strokeDasharray="4,2" />
                      <text x="50" y="72" fill="#dc2626" fontSize="8" fontWeight="bold" className="da-handwritten">Private Subnet</text>

                      {/* Internet Gateway */}
                      <g transform="translate(200, 10)">
                        <rect x="0" y="0" width="60" height="18" rx="3" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" />
                        <text x="30" y="12" fill="#0369a1" fontSize="7" fontWeight="bold" textAnchor="middle" className="da-handwritten">Internet Gateway</text>
                      </g>

                      {/* Route Table in Private Subnet */}
                      <g transform="translate(50, 140)">
                        <rect x="0" y="0" width="45" height="22" rx="3" fill="#f8fafc" stroke="#64748b" strokeWidth="1" />
                        <text x="22.5" y="14" fill="#475569" fontSize="6.5" fontWeight="bold" textAnchor="middle" className="da-handwritten">Route Table</text>
                      </g>

                      {/* NAT Gateway in Public Subnet */}
                      <g transform="translate(250, 100)">
                        <rect x="0" y="0" width="80" height="40" rx="4" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.5" className="da-sketch-element" />
                        <text x="40" y="16" fill="#1e293b" fontSize="8" fontWeight="black" textAnchor="middle" className="da-handwritten">NAT Gateway</text>
                        <text x="40" y="28" fill="#1e3a8a" fontSize="6" fontWeight="bold" textAnchor="middle" className="da-handwritten">No Inbound SG needed!</text>
                      </g>

                      {/* Private EC2 with SG in Private Subnet */}
                      <g transform="translate(100, 100)">
                        <rect x="0" y="0" width="80" height="40" rx="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" className="da-sketch-element" />
                        <text x="40" y="16" fill="#1e293b" fontSize="8" fontWeight="black" textAnchor="middle" className="da-handwritten">Private EC2</text>
                        <text x="40" y="28" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle" className="da-handwritten">SG Active</text>
                      </g>

                      {/* Egress flow arrows */}
                      <path d="M 140 100 L 180 52" fill="none" stroke="#2563eb" strokeWidth="1.5" markerEnd="url(#arrow-endpoint)" strokeDasharray="3,3" />
                      <path d="M 180 52 H 250" fill="none" stroke="#2563eb" strokeWidth="1.5" />
                      <path d="M 290 100 Q 230 40 230 28" fill="none" stroke="#2563eb" strokeWidth="1.5" markerEnd="url(#arrow-endpoint)" />
                      
                      <text x="340" y="150" fill="#b91c1c" fontSize="8.5" fontWeight="black" className="da-handwritten">"No Security Group to manage/required"</text>
                    </svg>
                  )}

                  {selectedNote === 'nacl' && (
                    <svg className="w-full max-w-[460px] h-[210px]" viewBox="0 0 460 210">
                      {/* Subnet border representing stateless NACL */}
                      <rect x="40" y="30" width="380" height="150" rx="8" fill="none" stroke="#2563eb" strokeWidth="2" className="da-sketch-element" strokeDasharray="4,4" />
                      <text x="50" y="42" fill="#2563eb" fontSize="8.5" fontWeight="bold" className="da-handwritten">Subnet Boundary</text>

                      {/* Subnet boundary firewall (NACL) */}
                      <g transform="translate(60, 55)">
                        <rect x="0" y="0" width="80" height="90" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.8" className="da-sketch-element" />
                        <text x="40" y="20" fill="#1e3a8a" fontSize="8.5" fontWeight="black" textAnchor="middle" className="da-handwritten">Network ACL</text>
                        <text x="40" y="36" fill="#2563eb" fontSize="9.5" fontWeight="black" textAnchor="middle" className="da-handwritten">(NACL)</text>
                        <text x="40" y="60" fill="#b91c1c" fontSize="7.5" fontWeight="bold" textAnchor="middle" className="da-handwritten">● Stateless</text>
                        <text x="40" y="75" fill="#475569" fontSize="6.5" textAnchor="middle" className="da-handwritten">Traffic guard</text>
                      </g>

                      {/* Instance ENI boundary representing stateful SG */}
                      <g transform="translate(260, 55)">
                        <rect x="0" y="0" width="80" height="90" rx="6" fill="#f0fdf4" stroke="#10b981" strokeWidth="1.8" className="da-sketch-element" />
                        <text x="40" y="20" fill="#065f46" fontSize="8" fontWeight="black" textAnchor="middle" className="da-handwritten">Security Group</text>
                        <text x="40" y="36" fill="#10b981" fontSize="9.5" fontWeight="black" textAnchor="middle" className="da-handwritten">(SG)</text>
                        <text x="40" y="60" fill="#047857" fontSize="7.5" fontWeight="bold" textAnchor="middle" className="da-handwritten">● Stateful</text>
                        <text x="40" y="75" fill="#475569" fontSize="6.5" textAnchor="middle" className="da-handwritten">Inbound approves out</text>
                      </g>

                      {/* Routing flow lines */}
                      <path d="M 10 100 H 60" fill="none" stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arrow-endpoint)" />
                      <path d="M 140 100 H 260" fill="none" stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arrow-endpoint)" />
                      <path d="M 260 120 H 140" fill="none" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrow-endpoint)" />
                      <text x="200" y="132" fill="#047857" fontSize="7.5" fontWeight="bold" textAnchor="middle" className="da-handwritten">Stateful Outbound</text>
                      <path d="M 60 120 H 10" fill="none" stroke="#3b82f6" strokeWidth="1.5" markerEnd="url(#arrow-endpoint)" />
                    </svg>
                  )}
                </div>

                {/* Hand-written styled explanation bullet points */}
                <div className="bg-[#fffdf6] border border-amber-100 rounded-xl p-4 shadow-sm space-y-2.5 da-handwritten text-sm text-slate-800 leading-relaxed font-bold">
                  {selectedNote === 'bastion' && (
                    <>
                      <div className="flex items-start gap-2.5">
                        <span className="text-blue-600 select-none">✏️</span>
                        <span>We can use a <strong className="text-blue-900 font-extrabold text-[14.5px]">Bastion Host</strong> to SSH securely into our private EC2 instances.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="text-blue-600 select-none">✏️</span>
                        <span>The Bastion host is located in the <strong className="text-emerald-700">Public Subnet</strong> which is then connected to all other private subnets inside the VPC.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="text-blue-600 select-none">✏️</span>
                        <span>The Bastion host's Security Group <strong className="text-blue-900">must allow inbound Port 22 SSH</strong> from the public internet, restricted strictly to corporate CIDR ranges to prevent unauthorized public scanning.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="text-blue-600 select-none">✏️</span>
                        <span>The Security Group of the target Private EC2 instances <strong className="text-rose-700">must exclusively allow SSH inbound traffic</strong> from the Security Group ID of the Bastion Host itself, or the Bastion's private IP.</span>
                      </div>
                    </>
                  )}

                  {selectedNote === 'nat' && (
                    <>
                      <div className="flex items-start gap-2.5">
                        <span className="text-blue-600 select-none">✏️</span>
                        <span>A <strong className="text-blue-900 font-extrabold text-[14.5px]">NAT Gateway</strong> provides unidirectional internet egress for instances located in private subnets, letting them retrieve software updates safely.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="text-blue-600 select-none">✏️</span>
                        <span>Unlike standard EC2 hosts, <strong className="text-rose-700 font-black text-[14px]">No Security Group is managed or required</strong> for the AWS NAT Gateway resource. It acts as an automated network routing appliance.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="text-blue-600 select-none">✏️</span>
                        <span>The NAT Gateway operates entirely at the routing layer—mapping private instance IPs to its dedicated Elastic IP (EIP) and routing egress out through the Internet Gateway (IGW).</span>
                      </div>
                    </>
                  )}

                  {selectedNote === 'nacl' && (
                    <>
                      <div className="flex items-start gap-2.5">
                        <span className="text-blue-600 select-none">✏️</span>
                        <span>A <strong className="text-blue-900 font-extrabold text-[14.5px]">Network Access Control List (NACL)</strong> acts as a stateless traffic guard at the subnet boundary level.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="text-blue-600 select-none">✏️</span>
                        <span>Because <strong className="text-blue-800">Security Groups are stateful</strong>, if inbound ingress is allowed, return outbound egress responses are <strong className="text-emerald-700 font-extrabold">automatically allowed by default</strong>.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="text-blue-600 select-none">✏️</span>
                        <span>Because <strong className="text-rose-700">NACLs are stateless</strong>, both inbound traffic rules and outbound response traffic rules must be explicitly configured and matched.</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <span className="text-blue-600 select-none">✏️</span>
                        <span>To allow client responses, custom stateless NACLs must permit outbound traffic through the **Ephemeral Port Range** (`1024-65535`).</span>
                      </div>
                    </>
                  )}
                </div>

              </div>

              {/* Hand-sketched notebook footer */}
              <div className="pl-10 text-[10px] text-slate-400 font-mono flex justify-between border-t border-dashed border-slate-200 pt-4 mt-6 select-none">
                <span>Subject: AWS Networking VPC notes</span>
                <span>Page: {selectedNote === 'bastion' ? '01' : selectedNote === 'nat' ? '02' : '03'}</span>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
