import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Check,
  Zap,
  Shield,
  Globe,
  Activity,
  Play,
  Terminal,
  Info,
  Layers,
  Wifi,
  AlertTriangle,
  Cpu,
  Server,
  Network,
  DollarSign,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import NetworkingVPCComparativeView from '../../components/visualizers/NetworkingVPCComparativeView';
import UniqueNetworkingVPCFeatures from '../../components/visualizers/UniqueNetworkingVPCFeatures';

type TabType = 'notebook' | 'cidr' | 'pipelines' | 'security' | 'endpoints' | 'hybrid' | 'pricing' | 'unique';

interface LogRow {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

interface NetworkingVPCVisualizerProps {
  provider?: 'aws' | 'azure' | 'gcp' | 'comparative';
  setProvider?: (provider: 'aws' | 'azure' | 'gcp' | 'comparative') => void;
}

export default function NetworkingVPCVisualizer({ provider = 'aws', setProvider }: NetworkingVPCVisualizerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');

  const isComparative = provider === 'comparative';

  const t = (text: string) => {
    if (provider === 'azure') {
      return text
        .replace(/AWS VPC/gi, 'Azure VNet')
        .replace(/VPC/g, 'VNet')
        .replace(/Internet Gateway/g, 'Azure Internet Egress')
        .replace(/NAT Gateway/g, 'Azure NAT Gateway')
        .replace(/Transit Gateway/g, 'Azure Virtual WAN Hub')
        .replace(/CloudWatch/g, 'Azure Monitor');
    }
    if (provider === 'gcp') {
      return text
        .replace(/AWS VPC/gi, 'Google Cloud Global VPC')
        .replace(/VPC/g, 'Cloud VPC')
        .replace(/Internet Gateway/g, 'GCP Cloud IGW')
        .replace(/NAT Gateway/g, 'Google Cloud NAT')
        .replace(/Transit Gateway/g, 'GCP Cloud Router & NCC')
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
        if (node.type === 'pre' || node.type === 'code' || (node.props && (node.props.className === 'vpc-terminal' || node.props.className === 'vpc-code-card'))) {
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
    setActiveTab(tab === 'vpc-basics' ? 'cidr' : tab === 'tgw' ? 'pipelines' : tab === 'architect' ? 'notebook' : tab);
  };
  const [selectedNote, setSelectedNote] = useState<string>('public_private_ip');
  const [expandedCategory, setExpandedCategory] = useState<string>('core');



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
          --da-card-bg: rgba(255, 255, 255, 0.95);
          --da-card-border: rgba(226, 232, 240, 0.9);
          --da-card-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.05);
          
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
          --da-code-text: #cbd5e1;
          
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
          
          --da-svg-red-bg: #fff5f5;
          --da-svg-red-border: #f43f5e;
          --da-svg-red-text: #b91c1c;
          
          --da-svg-amber-bg: #fffbeb;
          --da-svg-amber-border: #fef3c7;
          --da-svg-amber-text: #b45309;

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
          transition: all 0.2s ease-in-out;
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
          background-color: var(--da-svg-bg);
          background-image: var(--da-svg-grid);
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

        /* Interactive Cost Table styles */
        .da-cost-row {
          background-color: var(--da-bg);
          border: 1.5px solid var(--da-card-border);
          transition: all 0.2s ease;
        }
        .da-cost-row:hover {
          background-color: var(--da-tab-hover-bg);
        }
        .da-cost-row.da-selected {
          background-color: var(--da-svg-green-bg) !important;
          border-color: var(--da-svg-green-border) !important;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.08);
        }
        .da-cost-row .da-route-name {
          color: var(--da-text-title);
        }
        .da-cost-row.da-selected .da-route-name {
          color: var(--da-svg-green-text) !important;
        }
        .da-cost-row .da-route-desc {
          color: var(--da-text-muted);
        }
        .da-cost-row .da-route-total {
          color: var(--da-text-title);
        }
        .da-cost-row .da-route-rate {
          color: var(--da-text-muted);
        }
        .da-cost-bar-bg {
          background-color: var(--da-bg);
          border: 1px solid var(--da-card-border);
        }

        /* Modern Architect Learning Center styles */
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
          background: var(--da-table-th-bg);
          color: var(--da-table-th-text);
          font-weight: 700;
          text-align: left;
          padding: 12px 16px;
          border-bottom: 1.5px solid var(--da-table-border);
        }
        .da-modern-table td {
          padding: 12px 16px;
          border-bottom: 1px solid var(--da-table-border);
          color: var(--da-table-td-text);
        }
        .da-modern-table tr:hover td {
          background: var(--da-bg);
        }
        .da-badge-cyan {
          background: var(--da-svg-indigo-bg);
          border: 1px solid var(--da-svg-indigo-border);
          color: var(--da-svg-indigo-text);
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .da-badge-emerald {
          background: var(--da-svg-green-bg);
          border: 1px solid var(--da-svg-green-border);
          color: var(--da-svg-green-text);
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .da-badge-rose {
          background: var(--da-svg-red-bg);
          border: 1px solid var(--da-svg-red-border);
          color: var(--da-svg-red-text);
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .da-badge-amber {
          background: var(--da-svg-amber-bg);
          border: 1px solid var(--da-svg-amber-border);
          color: var(--da-svg-amber-text);
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
          background: var(--da-card-bg);
          border: 1px solid var(--da-card-border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: var(--da-card-shadow);
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
          color: var(--da-tab-hover-text);
        }
        .acad-dir-item-btn {
          width: 100%;
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
          color: var(--da-svg-indigo-border);
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
          background: var(--da-svg-green-bg);
          border: 1.5px solid var(--da-svg-green-border);
          color: var(--da-svg-green-text);
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
          border: 1px solid var(--da-card-border);
        }
        .acad-table th {
          background: var(--da-table-th-bg);
          color: var(--da-text-title);
          font-weight: 800;
          padding: 12px 14px;
          border-bottom: 1.5px solid var(--da-card-border);
          text-align: left;
        }
        .acad-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--da-card-border);
          color: var(--da-text-muted);
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

        .dark .acad-dir-header {
          background: rgba(15, 23, 42, 0.9) !important;
          color: #ffffff !important;
        }

        /* Scoped overrides to map tailwind utility classes to theme variables */
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

        .dark .da-container .da-sec,
        .dark .da-container .da-kk {
          color: var(--da-text-muted) !important;
        }
        .dark .da-container .da-log {
          background: var(--da-code-bg) !important;
          border-color: var(--da-code-border) !important;
          color: var(--da-code-text) !important;
        }
        .dark .da-container .da-btn {
          background: var(--da-tab-bg) !important;
          border-color: var(--da-tab-border) !important;
          color: var(--da-tab-text) !important;
        }
        .dark .da-container .da-btn:hover {
          background: var(--da-tab-hover-bg) !important;
          color: var(--da-tab-hover-text) !important;
        }
        .dark .da-container .da-met {
          background: var(--da-tab-bg) !important;
          border-color: var(--da-tab-border) !important;
          color: var(--da-tab-text) !important;
        }
        .dark .da-container ul.da-ck li {
          color: var(--da-text-muted) !important;
        }
        .dark .da-container .da-inst,
        .dark .da-container .da-instance {
          background: var(--da-tab-bg) !important;
          border-color: var(--da-tab-border) !important;
          color: var(--da-tab-text) !important;
        }
        .dark .da-container .da-inst .meta,
        .dark .da-container .da-instance .meta {
          color: var(--da-text-muted) !important;
        }

        /* Node Status Overrides */
        .dark .da-container .da-ok {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: #4ade80 !important;
        }
        .dark .da-container .da-warm {
          border-color: #f59e0b !important;
          background: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
        }
        .dark .da-container .da-drain {
          border-color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }
        .dark .da-container .da-down {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.15) !important;
          color: #f87171 !important;
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

        .dark .da-container .bg-indigo-50 {
          background-color: rgba(99, 102, 241, 0.15) !important;
          color: #a5b4fc !important;
        }
        .dark .da-container .border-indigo-300 {
          border-color: rgba(99, 102, 241, 0.4) !important;
        }
        .dark .da-container .bg-emerald-50 {
          background-color: rgba(16, 185, 129, 0.15) !important;
          color: #6ee7b7 !important;
        }
        .dark .da-container .border-emerald-300 {
          border-color: rgba(16, 185, 129, 0.4) !important;
        }
        .dark .da-container .border-amber-300 {
          border-color: rgba(245, 158, 11, 0.4) !important;
        }
        .dark .da-container .border-rose-300 {
          border-color: rgba(244, 63, 94, 0.4) !important;
        }
        .dark .da-container .bg-emerald-100 {
          background-color: rgba(16, 185, 129, 0.2) !important;
          color: #34d399 !important;
          border-color: rgba(16, 185, 129, 0.4) !important;
        }
        .dark .da-container .bg-rose-100 {
          background-color: rgba(244, 63, 94, 0.2) !important;
          color: #f87171 !important;
          border-color: rgba(244, 63, 94, 0.4) !important;
        }

        /* Scoped text overrides for dynamic theme colors */
        .dark .da-container .text-blue-800 { color: #93c5fd !important; }
        .dark .da-container .text-blue-700 { color: #60a5fa !important; }
        .dark .da-container .text-blue-900 { color: #bfdbfe !important; }
        
        .dark .da-container .text-green-800 { color: #86efac !important; }
        .dark .da-container .text-green-700 { color: #4ade80 !important; }
        .dark .da-container .text-green-900 { color: #bbf7d0 !important; }
        
        .dark .da-container .text-emerald-800 { color: #6ee7b7 !important; }
        .dark .da-container .text-emerald-750 { color: #34d399 !important; }
        .dark .da-container .text-emerald-700 { color: #34d399 !important; }
        
        .dark .da-container .text-amber-850 { color: #fde047 !important; }
        .dark .da-container .text-amber-800 { color: #fde047 !important; }
        .dark .da-container .text-amber-700 { color: #fbbf24 !important; }
        
        .dark .da-container .text-rose-800 { color: #fda4af !important; }
        .dark .da-container .text-rose-700 { color: #fca5a5 !important; }
        .dark .da-container .text-rose-600 { color: #fecdd3 !important; }

        /* Costly vs Savings Card Enhancements */
        .da-card-costly {
          background-color: rgba(254, 242, 242, 0.4);
          border: 1.5px solid rgba(254, 205, 211, 0.7);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px -2px rgba(244, 63, 94, 0.04);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .da-card-costly:hover {
          border-color: #fda4af;
          box-shadow: 0 12px 30px -4px rgba(244, 63, 94, 0.12);
          transform: translateY(-2px);
        }
        
        .da-card-savings {
          background: linear-gradient(135deg, rgba(240, 253, 244, 0.7) 0%, rgba(240, 253, 244, 0.2) 100%);
          border: 2.5px solid #10b981;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 8px 30px -2px rgba(16, 185, 129, 0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }
        .da-card-savings:hover {
          border-color: #059669;
          box-shadow: 0 16px 36px -4px rgba(16, 185, 129, 0.2);
          transform: translateY(-2px);
        }

        .da-cost-box-costly {
          background-color: rgba(254, 242, 242, 0.7);
          border: 1px solid rgba(254, 205, 211, 0.8);
          border-radius: 12px;
          padding: 12px;
          transition: all 0.2s ease;
        }
        
        .da-cost-box-savings {
          background-color: rgba(240, 253, 244, 0.7);
          border: 1px solid rgba(167, 243, 208, 0.8);
          border-radius: 12px;
          padding: 12px;
          transition: all 0.2s ease;
        }

        .dark .da-card-costly {
          background-color: rgba(244, 63, 94, 0.04) !important;
          border-color: rgba(244, 63, 94, 0.35) !important;
          box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.4) !important;
        }
        .dark .da-card-costly:hover {
          border-color: rgba(244, 63, 94, 0.6) !important;
          box-shadow: 0 12px 30px -4px rgba(244, 63, 94, 0.2) !important;
        }

        .dark .da-card-savings {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(20, 184, 166, 0.02) 100%) !important;
          border-color: rgba(16, 185, 129, 0.7) !important;
          box-shadow: 0 8px 30px -2px rgba(16, 185, 129, 0.1) !important;
        }
        .dark .da-card-savings:hover {
          border-color: rgba(16, 185, 129, 0.95) !important;
          box-shadow: 0 16px 36px -4px rgba(16, 185, 129, 0.3) !important;
        }

        .dark .da-cost-box-costly {
          background-color: rgba(244, 63, 94, 0.08) !important;
          border-color: rgba(244, 63, 94, 0.25) !important;
        }

        .dark .da-cost-box-savings {
          background-color: rgba(16, 185, 129, 0.08) !important;
          border-color: rgba(16, 185, 129, 0.25) !important;
        }

        .dark .da-container .text-rose-500 { color: #fb7185 !important; }
        .dark .da-container .text-emerald-500 { color: #34d399 !important; }
        .dark .da-container .text-emerald-600 { color: #34d399 !important; }
        .dark .da-container .border-emerald-200 { border-color: rgba(16, 185, 129, 0.3) !important; }
        .dark .da-container .text-slate-400 { color: var(--da-text-muted) !important; }
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
      {!isComparative && (
        <Translate>
        <div className="da-tabs">
          <button className={`da-tb ${activeTab === 'notebook' ? 'da-on' : ''}`} onClick={() => setActiveTab('notebook')}>
            <BookOpen className="w-4 h-4 text-blue-500" /> 📖 1) Visual Notes &amp; Theories
          </button>
          <button className={`da-tb ${activeTab === 'cidr' ? 'da-on' : ''}`} onClick={() => setActiveTab('cidr')}>
            <Info className="w-4 h-4 text-sky-500" /> 🔢 2) CIDR &amp; Subnet Calculator
          </button>
          <button className={`da-tb ${activeTab === 'pipelines' ? 'da-on' : ''}`} onClick={() => setActiveTab('pipelines')}>
            <Activity className="w-4 h-4" /> 🔀 3) Ingress &amp; HA Egress Pipelines
          </button>
          <button className={`da-tb ${activeTab === 'security' ? 'da-on' : ''}`} onClick={() => setActiveTab('security')}>
            <Shield className="w-4 h-4" /> 🛡️ 4) Stateful SG vs Stateless NACL
          </button>
          <button className={`da-tb ${activeTab === 'endpoints' ? 'da-on' : ''}`} onClick={() => setActiveTab('endpoints')}>
            <Layers className="w-4 h-4" /> 🌐 5) VPC Peering &amp; Endpoints
          </button>
          <button className={`da-tb ${activeTab === 'hybrid' ? 'da-on' : ''}`} onClick={() => setActiveTab('hybrid')}>
            <Wifi className="w-4 h-4" /> 🔌 6) Redundant VPN &amp; Flow Logs
          </button>
          <button className={`da-tb ${activeTab === 'pricing' ? 'da-on' : ''}`} onClick={() => setActiveTab('pricing')}>
            <DollarSign className="w-4 h-4" /> 💰 7) Egress &amp; Firewall Optimizer
          </button>
          <button className={`da-tb ${activeTab === 'unique' ? 'da-on' : ''}`} onClick={() => setActiveTab('unique')}>
            ✨ Unique Features
          </button>
        </div>
      </Translate>
      )}

      {isComparative && (
        <NetworkingVPCComparativeView onNavigateToDemo={handleNavigateToDemo} />
      )}

      {!isComparative && activeTab === 'unique' && (
        <UniqueNetworkingVPCFeatures provider={provider} />
      )}

      {!isComparative && activeTab !== 'unique' && (
        <Translate>
          <>

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
                    <rect x="15" y="10" width="450" height="160" rx="8" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="2" strokeDasharray="4,2" />
                    <text x="25" y="24" fill="var(--da-svg-indigo-text)" fontSize="7.5" fontWeight="black">SUBNET BLOCK: {vpcCidr.split('/')[0].slice(0,-1)}1.0/{subnetMaskSize}</text>

                    {/* Left: 5 AWS Reserved IPs Section */}
                    <rect x="25" y="32" width="200" height="128" rx="6" fill="var(--da-svg-red-bg)" stroke="var(--da-svg-red-border)" strokeWidth="1.2" strokeDasharray="2,2" />
                    <text x="32" y="44" fill="var(--da-svg-red-text)" fontSize="7" fontWeight="bold">AWS Reserved IPs (5 Locked)</text>

                    {/* Reserved IP nodes */}
                    <g transform="translate(32, 50)">
                      <rect x="0" y="0" width="85" height="18" rx="2" fill="var(--da-card-bg)" stroke="var(--da-svg-red-border)" strokeWidth="0.8" />
                      <text x="5" y="11" fill="var(--da-svg-red-text)" fontSize="6.5" fontWeight="bold">.0 (Network IP)</text>
                    </g>
                    <g transform="translate(122, 50)">
                      <rect x="0" y="0" width="95" height="18" rx="2" fill="var(--da-card-bg)" stroke="var(--da-svg-red-border)" strokeWidth="0.8" />
                      <text x="5" y="11" fill="var(--da-svg-red-text)" fontSize="6.5" fontWeight="bold">.1 (Router Gateway)</text>
                    </g>

                    <g transform="translate(32, 75)">
                      <rect x="0" y="0" width="85" height="18" rx="2" fill="var(--da-card-bg)" stroke="var(--da-svg-red-border)" strokeWidth="0.8" />
                      <text x="5" y="11" fill="var(--da-svg-red-text)" fontSize="6.5" fontWeight="bold">.2 (Route 53 DNS)</text>
                    </g>
                    <g transform="translate(122, 75)">
                      <rect x="0" y="0" width="95" height="18" rx="2" fill="var(--da-card-bg)" stroke="var(--da-svg-red-border)" strokeWidth="0.8" />
                      <text x="5" y="11" fill="var(--da-svg-red-text)" fontSize="6.5" fontWeight="bold">.3 (AWS Reserved)</text>
                    </g>

                    <g transform="translate(32, 100)">
                      <rect x="0" y="0" width="186" height="18" rx="2" fill="var(--da-card-bg)" stroke="var(--da-svg-red-border)" strokeWidth="0.8" />
                      <text x="5" y="11" fill="var(--da-svg-red-text)" fontSize="6.5" fontWeight="bold">.255 (Classic Broadcast Drop)</text>
                    </g>

                    <text x="32" y="145" fill="var(--da-svg-red-text)" fontSize="6.5" fontWeight="bold">⚠️ Inactive: 100% Locked by VPC Router</text>


                    {/* Right: Usable IP Pool Section */}
                    <rect x="240" y="32" width="215" height="128" rx="6" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                    <text x="248" y="44" fill="var(--da-svg-green-text)" fontSize="7" fontWeight="bold">Usable IP Range ({ipStats.usableIps} Available)</text>

                    {/* Active IP Instance 1 */}
                    <g transform="translate(250, 52)">
                      <rect x="0" y="0" width="90" height="42" rx="4" fill="var(--da-card-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.2" />
                      <text x="45" y="12" fill="var(--da-text-title)" fontSize="7" fontWeight="black" textAnchor="middle">Prod EC2 Instance</text>
                      <text x="45" y="24" fill="var(--da-svg-green-text)" fontSize="6" fontWeight="bold" textAnchor="middle">IP: .4</text>
                      <rect x="15" y="28" width="60" height="10" rx="1.5" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="0.6" />
                      <text x="45" y="35" fill="var(--da-svg-green-text)" fontSize="5" fontWeight="extrabold" textAnchor="middle">SG: PORT 443 OK</text>
                    </g>

                    {/* Active IP Instance 2 */}
                    <g transform="translate(352, 52)">
                      <rect x="0" y="0" width="90" height="42" rx="4" fill="var(--da-card-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.2" />
                      <text x="45" y="12" fill="var(--da-text-title)" fontSize="7" fontWeight="black" textAnchor="middle">Application ALB</text>
                      <text x="45" y="24" fill="var(--da-svg-green-text)" fontSize="6" fontWeight="bold" textAnchor="middle">IP: .15</text>
                      <rect x="15" y="28" width="60" height="10" rx="1.5" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="0.6" />
                      <text x="45" y="35" fill="var(--da-svg-green-text)" fontSize="5" fontWeight="extrabold" textAnchor="middle">SG: PORT 80 OK</text>
                    </g>

                    {/* Usable range summary */}
                    <g transform="translate(250, 105)">
                      <rect x="0" y="0" width="192" height="45" rx="4" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1" />
                      <text x="10" y="14" fill="var(--da-text-title)" fontSize="6.5" fontWeight="black">Allocated IP Block Range:</text>
                      <text x="10" y="26" fill="var(--da-svg-indigo-border)" fontSize="7.5" fontWeight="extrabold">.4  to  .{Math.pow(2, 32 - subnetMaskSize) - 2}</text>
                      <text x="10" y="36" fill="var(--da-text-muted)" fontSize="5.5" fontWeight="bold">Dynamically allocated as servers request local leases.</text>
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
                  <rect x="6" y="24" width="488" height="225" rx="8" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="2" strokeDasharray="5,3" />
                  <text x="16" y="34" fill="var(--da-svg-indigo-text)" fontSize="7.5" fontWeight="black">VPC BOUNDARY (10.0.0.0/16)</text>
 
                   {/* Zones outlines */}
                   {/* Availability Zone 1 */}
                  <rect x="12" y="40" width="232" height="202" rx="6" fill="none" stroke={pipelineFlowType === 'az_failover' ? 'var(--da-svg-red-border)' : 'var(--da-card-border)'} strokeWidth="1.2" strokeDasharray={pipelineFlowType === 'az_failover' ? '4,4' : 'none'} />
                  <text x="20" y="51" fill={pipelineFlowType === 'az_failover' ? 'var(--da-svg-red-text)' : 'var(--da-text-muted)'} fontSize="7" fontWeight="bold">
                     Availability Zone 1 {pipelineFlowType === 'az_failover' && '⚠️ OUTAGE'}
                   </text>
 
                   {/* Availability Zone 2 */}
                  <rect x="256" y="40" width="232" height="202" rx="6" fill="none" stroke="var(--da-card-border)" strokeWidth="1.2" />
                  <text x="264" y="51" fill="var(--da-text-muted)" fontSize="7" fontWeight="bold">Availability Zone 2</text>
 
                   {/* Internet Gateway Gateway ENI Node */}
                   <g transform="translate(210, 1)">
                    <rect x="0" y="0" width="80" height="20" rx="4" fill={igwAttached ? 'var(--da-svg-indigo-bg)' : 'var(--da-svg-red-bg)'} stroke={igwAttached ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-red-border)'} strokeWidth="1.2" />
                    <text x="40" y="13" fill={igwAttached ? 'var(--da-svg-indigo-text)' : 'var(--da-svg-red-text)'} fontSize="7" fontWeight="black" textAnchor="middle">
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
                       <circle cx="250" cy="11" r="3" fill="var(--da-svg-red-border)" />
                       <line x1="250" y1="11" x2="250" y2="22" stroke="var(--da-svg-red-border)" strokeWidth="1.8" strokeDasharray="2,2" />
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
                    <rect x="0" y="0" width="200" height="42" rx="6" fill="var(--da-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1" strokeDasharray="2,2" />
                    <text x="10" y="12" fill="var(--da-svg-indigo-text)" fontSize="6.5" fontWeight="bold">Public Subnet (AZ-1)</text>
                     
                     {/* Bastion Host */}
                     <g transform="translate(15, 16)">
                      <rect x="0" y="0" width="80" height="20" rx="3" fill={bastionTunnel ? 'var(--da-svg-green-bg)' : 'var(--da-card-bg)'} stroke={bastionTunnel ? 'var(--da-svg-green-border)' : 'var(--da-card-border)'} strokeWidth="1" />
                      <text x="40" y="12" fill="var(--da-text-title)" fontSize="7" fontWeight="extrabold" textAnchor="middle">
                         Bastion Host {bastionTunnel ? '🔓' : '🔒'}
                       </text>
                     </g>
 
                     {/* NAT Gateway AZ-1 */}
                     <g transform="translate(105, 16)">
                      <rect x="0" y="0" width="80" height="20" rx="3" fill={pipelineFlowType === 'az_failover' ? 'var(--da-svg-red-bg)' : 'var(--da-svg-indigo-bg)'} stroke={pipelineFlowType === 'az_failover' ? 'var(--da-svg-red-border)' : 'var(--da-svg-indigo-border)'} strokeWidth="1" />
                      <text x="40" y="12" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">
                         NAT Gateway-1 {pipelineFlowType === 'az_failover' ? '❌' : '⚡'}
                       </text>
                     </g>
                   </g>
 
                   {/* AZ-2 Public Subnet Components */}
                   <g transform="translate(265, 60)">
                    <rect x="0" y="0" width="200" height="42" rx="6" fill="var(--da-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1" strokeDasharray="2,2" />
                    <text x="10" y="12" fill="var(--da-svg-indigo-text)" fontSize="6.5" fontWeight="bold">Public Subnet (AZ-2)</text>
                     
                     {/* NAT Gateway AZ-2 */}
                     <g transform="translate(105, 16)">
                      <rect x="0" y="0" width="80" height="20" rx="3" fill={natHaMode === 'dual_ha' ? 'var(--da-svg-indigo-bg)' : 'var(--da-bg)'} stroke={natHaMode === 'dual_ha' ? 'var(--da-svg-indigo-border)' : 'var(--da-card-border)'} strokeWidth="1" />
                      <text x="40" y="12" fill="var(--da-text-title)" fontSize="7" fontWeight="bold" textAnchor="middle">
                         {natHaMode === 'dual_ha' ? 'NAT Gateway-2 ⚡' : 'No NAT ⚪'}
                       </text>
                     </g>
                   </g>
 
                   {/* AZ-1 Private Subnet */}
                   <g transform="translate(25, 135)">
                    <rect x="0" y="0" width="200" height="90" rx="6" fill="var(--da-bg)" stroke="var(--da-text-muted)" strokeWidth="1" strokeDasharray="2,2" />
                    <text x="10" y="12" fill="var(--da-text-muted)" fontSize="6.5" fontWeight="bold">Private Subnet (AZ-1)</text>
 
                     {/* Private EC2 */}
                     <g transform="translate(50, 25)">
                      <rect x="0" y="0" width="100" height="45" rx="4" fill={activeAz === 'az1' && pipelineSimState === 'success' ? 'var(--da-svg-green-bg)' : 'var(--da-card-bg)'} stroke={activeAz === 'az1' && pipelineSimState === 'success' ? 'var(--da-svg-green-border)' : 'var(--da-card-border)'} strokeWidth="1.5" />
                      <text x="50" y="16" fill="var(--da-text-title)" fontSize="8" fontWeight="black" textAnchor="middle">EC2 Cluster-1</text>
                      <text x="50" y="27" fill="var(--da-text-muted)" fontSize="6.5" textAnchor="middle">IP: 10.0.1.15</text>
                      <text x="50" y="38" fill={pipelineFlowType === 'az_failover' ? 'var(--da-svg-red-text)' : 'var(--da-svg-green-text)'} fontSize="6" fontWeight="bold" textAnchor="middle">
                         {pipelineFlowType === 'az_failover' ? '❌ Out of AZ' : '🟢 Secure Node'}
                       </text>
                     </g>
                   </g>
 
                   {/* AZ-2 Private Subnet */}
                   <g transform="translate(265, 135)">
                    <rect x="0" y="0" width="200" height="90" rx="6" fill="var(--da-bg)" stroke="var(--da-text-muted)" strokeWidth="1" strokeDasharray="2,2" />
                    <text x="10" y="12" fill="var(--da-text-muted)" fontSize="6.5" fontWeight="bold">Private Subnet (AZ-2)</text>
 
                     {/* Private EC2 AZ-2 */}
                     <g transform="translate(50, 25)">
                      <rect x="0" y="0" width="100" height="45" rx="4" fill={activeAz === 'az2' && pipelineSimState === 'success' ? 'var(--da-svg-green-bg)' : 'var(--da-card-bg)'} stroke={activeAz === 'az2' && pipelineSimState === 'success' ? 'var(--da-svg-green-border)' : 'var(--da-card-border)'} strokeWidth="1.5" />
                      <text x="50" y="16" fill="var(--da-text-title)" fontSize="8" fontWeight="black" textAnchor="middle">EC2 Cluster-2</text>
                      <text x="50" y="27" fill="var(--da-text-muted)" fontSize="6.5" textAnchor="middle">IP: 10.0.2.88</text>
                      <text x="50" y="38" fill="var(--da-svg-green-text)" fontSize="6" fontWeight="bold" textAnchor="middle">🟢 Secure Node</text>
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
                  <rect x="15" y="10" width="450" height="170" rx="8" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="2" strokeDasharray="5,3" />
                  <text x="25" y="22" fill="var(--da-svg-indigo-text)" fontSize="7.5" fontWeight="black">VPC BOUNDARY (10.0.0.0/16)</text>
 
                   {/* Private Subnet Boundary Box */}
                  <rect x="105" y="32" width="345" height="135" rx="6" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" strokeDasharray="3,2" />
                  <text x="115" y="44" fill="var(--da-svg-indigo-text)" fontSize="7" fontWeight="bold">Private Subnet (10.0.1.0/24)</text>
 
                   {/* Inbound path lines */}
                   <g fill="none" strokeWidth="1.5">
                     {/* Public internet to subnet border */}
                    <path d="M 5 95 H 105" stroke={animStep >= 1 ? 'var(--da-svg-indigo-border)' : 'var(--da-card-border)'} className={animStep === 1 ? 'packet-pulse' : ''} strokeDasharray={animStep === 1 ? '6,4' : 'none'} />
                     {/* Subnet border to SG border */}
                    <path d="M 145 95 H 250" stroke={animStep >= 2 ? 'var(--da-svg-indigo-border)' : 'var(--da-card-border)'} />
                     {/* SG to EC2 Target */}
                    <path d="M 290 95 H 355" stroke={animStep >= 3 ? 'var(--da-svg-indigo-border)' : 'var(--da-card-border)'} />
                     
                     {/* Return path (stateless return) */}
                    <path d="M 355 105 H 250 Q 197 135 145 105" stroke={animStep >= 4 ? (securitySimState === 'blocked_ephemeral' ? 'var(--da-svg-red-border)' : 'var(--da-svg-green-border)') : 'var(--da-card-border)'} strokeWidth="1.8" />
                    <path d="M 105 105 H 5" stroke={securitySimState === 'passed' ? 'var(--da-svg-green-border)' : 'var(--da-card-border)'} />
                   </g>
 
                   {/* Packet visualizer indicator (dot) */}
                   {securitySimState === 'animating' && (
                     <g>
                      <circle r="4" fill="var(--da-svg-indigo-border)" className="animate-ping">
                         {animStep === 1 && <animateMotion dur="0.8s" repeatCount="indefinite" path="M 5 95 H 105" />}
                         {animStep === 2 && <animateMotion dur="0.8s" repeatCount="indefinite" path="M 145 95 H 250" />}
                         {animStep === 3 && <animateMotion dur="0.8s" repeatCount="indefinite" path="M 290 95 H 355" />}
                         {animStep === 4 && <animateMotion dur="0.8s" repeatCount="indefinite" path="M 375 105 H 250 Q 197 135 145 105" />}
                       </circle>
                      <text x="240" y="24" fill="var(--da-svg-indigo-text)" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">
                         TCP Packet Port: {securityTestPort}
                       </text>
                     </g>
                   )}
 
                   {/* Stateless Subnet Border NACL */}
                   <g transform="translate(90, 60)" className={securitySimState === 'blocked_nacl' || (animStep === 4 && securitySimState === 'blocked_ephemeral') ? 'da-sim-node-active' : ''}>
                     <rect x="0" y="0" width="36" height="70" rx="4" 
                      fill={securitySimState === 'blocked_nacl' ? 'var(--da-svg-red-bg)' : 'var(--da-svg-indigo-bg)'} 
                      stroke={securitySimState === 'blocked_nacl' ? 'var(--da-svg-red-border)' : 'var(--da-svg-indigo-border)'} strokeWidth="1.8" />
                    <text x="18" y="20" fill="var(--da-svg-indigo-text)" fontSize="6" fontWeight="bold" textAnchor="middle">Stateless</text>
                    <text x="18" y="36" fill="var(--da-svg-indigo-text)" fontSize="9" fontWeight="black" textAnchor="middle">NACL</text>
                    <text x="18" y="52" fill="var(--da-svg-indigo-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">Rule 100</text>
                   </g>
 
                   {/* Stateful Security Group (SG) directly enclosing the ENI inside Subnet */}
                   <g transform="translate(245, 60)" className={securitySimState === 'blocked_sg' ? 'da-sim-node-active' : ''}>
                     <rect x="0" y="0" width="45" height="70" rx="5" 
                      fill={securitySimState === 'blocked_sg' ? 'var(--da-svg-red-bg)' : 'var(--da-svg-green-bg)'} 
                      stroke={securitySimState === 'blocked_sg' ? 'var(--da-svg-red-border)' : 'var(--da-svg-green-border)'} strokeWidth="1.8" />
                    <text x="22.5" y="20" fill="var(--da-svg-green-text)" fontSize="6" fontWeight="bold" textAnchor="middle">Stateful</text>
                    <text x="22.5" y="36" fill="var(--da-svg-green-text)" fontSize="9" fontWeight="black" textAnchor="middle">SG</text>
                    <text x="22.5" y="52" fill="var(--da-svg-green-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">ENI Level</text>
                   </g>
 
                   {/* Private EC2 Instance inside SG */}
                   <g transform="translate(355, 70)">
                    <rect x="0" y="0" width="80" height="50" rx="4" fill="var(--da-code-bg)" stroke="var(--da-code-border)" strokeWidth="1.5" />
                    <text x="40" y="20" fill="var(--da-code-text)" fontSize="8" fontWeight="black" textAnchor="middle">EC2 SERVER</text>
                    <text x="40" y="34" fill="var(--da-text-muted)" fontSize="6.5" textAnchor="middle">IP: 10.0.1.15</text>
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
                  <rect x="10" y="30" width="130" height="170" rx="8" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" />
                  <text x="20" y="42" fill="var(--da-svg-indigo-text)" fontSize="8" fontWeight="black">VPC-A (10.0.0.0/16)</text>
                  {/* VPC B */}
                  <rect x="235" y="30" width="130" height="75" rx="8" fill="none" stroke="var(--da-svg-purple-border)" strokeWidth="1.5" />
                  <text x="245" y="42" fill="var(--da-svg-purple-text)" fontSize="8" fontWeight="black">VPC-B (172.16.0.0/16)</text>
                  {/* VPC C */}
                  <rect x="235" y="125" width="130" height="75" rx="8" fill="none" stroke="var(--da-text-muted)" strokeWidth="1.5" />
                  <text x="245" y="137" fill="var(--da-text-muted)" fontSize="8" fontWeight="black">VPC-C (192.168.0.0/16)</text>
 
                   {/* Flow path overlays */}
                   {/* VPC Peering Flow path */}
                   {peeringActive && peeringTestState === 'idle' && (
                     <path d="M 140 85 H 235" fill="none" className="da-flow-blue" strokeWidth="2" markerEnd="url(#arrow-endpoint)" />
                   )}
                   {peeringTestState === 'transitive_blocked' && (
                     <g>
                       <path d="M 140 85 H 235" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="2" strokeDasharray="3,3" />
                       {/* Red cross on transition from B to C */}
                       <path d="M 235 85 L 200 135 L 235 155" fill="none" stroke="var(--da-svg-red-border)" strokeWidth="2" strokeDasharray="4,4" />
                       <line x1="210" y1="115" x2="225" y2="130" stroke="var(--da-svg-red-border)" strokeWidth="3" />
                       <line x1="225" y1="115" x2="210" y2="130" stroke="var(--da-svg-red-border)" strokeWidth="3" />
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
                    <rect x="0" y="0" width="36" height="36" rx="18" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" />
                    <text x="18" y="21" fill="var(--da-svg-indigo-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">S3 Gateway</text>
                   </g>
 
                   {/* KMS Interface Node */}
                   <g transform="translate(190, 140)">
                    <rect x="0" y="0" width="36" height="36" rx="18" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1.5" />
                    <text x="18" y="21" fill="var(--da-svg-purple-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">KMS Interface</text>
                   </g>
 
                   {/* EC2 Instance VPC-A */}
                   <g transform="translate(25, 75)">
                    <rect x="0" y="0" width="55" height="28" rx="4" fill="var(--da-code-bg)" stroke="var(--da-code-border)" strokeWidth="1" />
                    <text x="27.5" y="17" fill="var(--da-code-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">EC2 Host A</text>
                   </g>
 
                   {/* Interface ENI VPC-A */}
                   <g transform="translate(25, 145)">
                    <rect x="0" y="0" width="55" height="20" rx="3" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1" />
                    <text x="27.5" y="12" fill="var(--da-svg-green-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                       {endpointType === 'interface' ? 'ENI Active' : 'No Endpoint'}
                     </text>
                   </g>
 
                   {/* EC2 Instance VPC-B */}
                   <g transform="translate(250, 55)">
                    <rect x="0" y="0" width="55" height="28" rx="4" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1" />
                    <text x="27.5" y="17" fill="var(--da-text-muted)" fontSize="7.5" fontWeight="bold" textAnchor="middle">EC2 Host B</text>
                   </g>
 
                   {/* EC2 Instance VPC-C */}
                   <g transform="translate(250, 150)">
                    <rect x="0" y="0" width="55" height="28" rx="4" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1" />
                    <text x="27.5" y="17" fill="var(--da-text-muted)" fontSize="7.5" fontWeight="bold" textAnchor="middle">EC2 Host C</text>
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
                  {/* ==================== AWS SIDE (TOP) ==================== */}
                  {/* VPC Bounding Box */}
                  <rect x="20" y="10" width="540" height="98" rx="8" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="2" strokeDasharray="4,2" />
                  <text x="30" y="22" fill="var(--da-svg-indigo-text)" fontSize="8" fontWeight="black">AWS VPC BOUNDARY</text>
 
                   {/* Private Subnet */}
                  <rect x="80" y="25" width="220" height="70" rx="6" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" strokeDasharray="3,2" />
                  <text x="88" y="34" fill="var(--da-svg-indigo-text)" fontSize="7" fontWeight="bold">Private Subnet</text>
 
                   {/* Security Group (SG) */}
                  <rect x="135" y="42" width="105" height="46" rx="4" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                  <text x="141" y="52" fill="var(--da-svg-green-text)" fontSize="6.5" fontWeight="bold">SG (Stateful)</text>
 
                   {/* Private Server Chip inside SG */}
                   <g transform="translate(172, 57)">
                    <rect x="0" y="0" width="30" height="24" rx="2" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1" />
                    <line x1="5" y1="6" x2="25" y2="6" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                    <line x1="5" y1="12" x2="25" y2="12" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                    <line x1="5" y1="18" x2="25" y2="18" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                    <circle cx="25" cy="6" r="1" fill="var(--da-svg-green-border)" />
                    <circle cx="25" cy="12" r="1" fill="var(--da-svg-green-border)" />
                    <circle cx="25" cy="18" r="1" fill="var(--da-svg-green-border)" />
                   </g>
 
                   {/* Route Table (route propagation enabled) */}
                   <g transform="translate(320, 28)">
                    <rect x="0" y="0" width="125" height="44" rx="4" fill="var(--da-code-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.2" />
                    <rect x="6" y="6" width="12" height="10" rx="1" fill="var(--da-svg-indigo-border)" />
                    <line x1="10" y1="11" x2="24" y2="11" stroke="var(--da-svg-indigo-border)" strokeWidth="1" />
                    <text x="24" y="14" fill="var(--da-text-title)" fontSize="6.5" fontWeight="black">Route Table</text>
                    <text x="24" y="24" fill="var(--da-code-text)" fontSize="5.5" fontWeight="bold">Propagation: ENABLED</text>
                    <line x1="24" y1="32" x2="115" y2="32" stroke="var(--da-code-text)" strokeWidth="1.2" strokeDasharray="2,2" />
                   </g>
 
                   {/* Virtual Private Gateway (VGW) at the bottom of the VPC box */}
                   <g transform="translate(290, 102)" className={vpnSimState !== 'idle' && vpnSimState !== 'outage' ? 'da-sim-node-active' : ''}>
                    <circle cx="0" cy="0" r="14" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="2.5" />
                     {/* Lock vector */}
                    <rect x="-5" y="-2" width="10" height="8" rx="1" fill="var(--da-svg-indigo-border)" />
                    <path d="M -3 -2 V -5 A 3 3 0 0 1 3 -5 V -2" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.2" />
                    <text x="0" y="19" fill="var(--da-svg-indigo-text)" fontSize="6.5" fontWeight="black" textAnchor="middle">VGW Gateway</text>
                   </g>
 
 
                   {/* ==================== IPSec TUNNELS (MIDDLE) ==================== */}
                   {/* Left Tunnel to NAT Device */}
                   <line x1="276" y1="108" x2="165" y2="202" 
                    stroke={!tunnelAActive ? 'var(--da-svg-red-border)' : vpnSimState === 'tunneling_a' ? 'var(--da-svg-green-border)' : 'var(--da-text-muted)'} 
                     strokeWidth={vpnSimState === 'tunneling_a' ? '3' : '1.8'} 
                     strokeDasharray={vpnSimState === 'tunneling_a' ? 'none' : '3,3'}
                     className={vpnSimState === 'tunneling_a' ? 'da-flow-green' : ''}
                   />
                   {/* Left Encrypted Lock badge */}
                   <g transform="translate(205, 145)">
                    <circle cx="0" cy="0" r="7" fill={!tunnelAActive ? 'var(--da-svg-red-bg)' : 'var(--da-svg-green-bg)'} stroke={!tunnelAActive ? 'var(--da-svg-red-border)' : 'var(--da-svg-green-border)'} strokeWidth="1.2" />
                    <rect x="-3" y="-1.5" width="6" height="5" rx="0.5" fill={!tunnelAActive ? 'var(--da-svg-red-border)' : 'var(--da-svg-green-border)'} />
                    <path d="M -2 -1.5 V -3.5 A 2 2 0 0 1 2 -3.5 V -1.5" fill="none" stroke={!tunnelAActive ? 'var(--da-svg-red-border)' : 'var(--da-svg-green-border)'} strokeWidth="0.8" />
                    <text x="10" y="2" fill="var(--da-text-muted)" fontSize="6" fontWeight="bold">IPSec A (encrypted)</text>
                   </g>
 
                   {/* Center "or" conditional */}
                  <circle cx="290" cy="148" r="9" fill="var(--da-bg)" stroke="var(--da-card-border)" strokeWidth="1" />
                  <text x="290" y="150.5" fill="var(--da-text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">or</text>
 
                   {/* Right Tunnel to CGW */}
                   <line x1="304" y1="108" x2="415" y2="202" 
                    stroke={!tunnelBActive ? 'var(--da-svg-red-border)' : vpnSimState === 'tunneling_b' ? 'var(--da-svg-green-border)' : 'var(--da-text-muted)'} 
                     strokeWidth={vpnSimState === 'tunneling_b' ? '3' : '1.8'} 
                     strokeDasharray={vpnSimState === 'tunneling_b' ? 'none' : '3,3'}
                     className={vpnSimState === 'tunneling_b' ? 'da-flow-green' : ''}
                   />
                   {/* Right Encrypted Lock badge */}
                   <g transform="translate(345, 145)">
                    <circle cx="0" cy="0" r="7" fill={!tunnelBActive ? 'var(--da-svg-red-bg)' : 'var(--da-svg-green-bg)'} stroke={!tunnelBActive ? 'var(--da-svg-red-border)' : 'var(--da-svg-green-border)'} strokeWidth="1.2" />
                    <rect x="-3" y="-1.5" width="6" height="5" rx="0.5" fill={!tunnelBActive ? 'var(--da-svg-red-border)' : 'var(--da-svg-green-border)'} />
                    <path d="M -2 -1.5 V -3.5 A 2 2 0 0 1 2 -3.5 V -1.5" fill="none" stroke={!tunnelBActive ? 'var(--da-svg-red-border)' : 'var(--da-svg-green-border)'} strokeWidth="0.8" />
                    <text x="10" y="2" fill="var(--da-text-muted)" fontSize="6" fontWeight="bold">IPSec B (encrypted)</text>
                   </g>
 
 
                   {/* ==================== ON-PREMISES DC (BOTTOM) ==================== */}
                   {/* Corporate DC boundary box */}
                  <rect x="20" y="202" width="540" height="84" rx="8" fill="none" stroke="var(--da-svg-purple-border)" strokeWidth="2" strokeDasharray="4,2" />
                  <text x="30" y="213" fill="var(--da-svg-purple-text)" fontSize="8" fontWeight="black">CORPORATE DATA CENTER BOUNDARY</text>
 
                   {/* Left Egress Point: NAT Device (Public IP) */}
                   <g transform="translate(110, 218)">
                    <rect x="0" y="0" width="110" height="26" rx="4" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1.2" />
                    <text x="55" y="11" fill="var(--da-svg-purple-text)" fontSize="6.5" fontWeight="black" textAnchor="middle">NAT Device</text>
                    <text x="55" y="20" fill="var(--da-svg-purple-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">Public IP: 198.51.100.10</text>
                   </g>
 
                   {/* Right Egress Point: Customer Gateway (Public IP) */}
                   <g transform="translate(350, 218)">
                    <rect x="0" y="0" width="125" height="26" rx="4" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1.2" />
                    <text x="62.5" y="11" fill="var(--da-svg-purple-text)" fontSize="6.5" fontWeight="black" textAnchor="middle">Customer Gateway (CGW)</text>
                    <text x="62.5" y="20" fill="var(--da-svg-purple-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">Public IP: 198.51.100.22</text>
                   </g>
 
                   {/* CGW Private IP (Internal Customer Gateway) */}
                   <g transform="translate(70, 252)">
                    <rect x="0" y="0" width="180" height="22" rx="4" fill="var(--da-card-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1.2" />
                    <circle cx="12" cy="11" r="5" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="0.8" />
                    <path d="M 9 11 H 15 M 12 8 V 14" stroke="var(--da-svg-purple-text)" strokeWidth="0.8" />
                    <text x="24" y="14" fill="var(--da-svg-purple-text)" fontSize="6.5" fontWeight="black">Customer Gateway (Private IP)</text>
                   </g>
 
                   {/* Double-sided arrow between NAT Device and Private CGW */}
                   <path d="M 165 245 V 251" fill="none" stroke="#64748b" strokeWidth="1.2" markerStart="url(#arrow-dual)" markerEnd="url(#arrow-dual)" />
 
                   {/* Corporate Internal Server Node */}
                   <g transform="translate(290, 248)">
                    <rect x="0" y="0" width="80" height="26" rx="4" fill="var(--da-bg)" stroke="var(--da-text-muted)" strokeWidth="1.2" />
                    <text x="40" y="11" fill="var(--da-text-title)" fontSize="7" fontWeight="black" textAnchor="middle">Internal Server</text>
                    <text x="40" y="20" fill="var(--da-text-muted)" fontSize="5.5" fontWeight="bold" textAnchor="middle">IP: 192.168.10.15</text>
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
        <div className="space-y-6 animate-fadeIn text-left" style={{ color: 'var(--da-text)' }}>
          
          {/* Header Hero Card */}
          <div className="da-card text-left" style={{ borderLeft: '4px solid #2563eb', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                  <BookOpen className="w-5 h-5 text-blue-600" /> AWS, Azure &amp; GCP Virtual Private Network Notes &amp; Mental Models
                </h2>
                <p className="text-xs mt-1.5 leading-relaxed font-sans font-semibold" style={{ color: 'var(--da-text-muted)' }}>
                  Complete 19-topic interactive cloud networking curriculum sorted progressively across 6 core categories. Master VPC Subnets, Internet Gateways, NAT, Bastion Tunnels, NACLs, Ephemeral Ports, VPC Peering, Transit Gateway, PrivateLink Endpoints, VPN, DirectConnect, Traffic Mirroring, and Flow Logs.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="acad-hero-badge">🎓 19 Complete Modules</span>
                <span className="acad-hero-badge" style={{ background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.35)', color: '#d97706' }}>💡 Everyday Mental Models</span>
                <span className="acad-hero-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)', color: '#10b981' }}>🌐 AWS / Azure / GCP</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Sidebar Category Explorer (All 19 Topics) */}
            <div className="lg:col-span-3 space-y-4 text-left">
              <span className="text-[10px] font-black uppercase tracking-widest block pl-1 font-mono" style={{ color: 'var(--da-text-muted)' }}>Curriculum Directory (19 Modules):</span>
              
              <div className="acad-dir-container">
                <div className="acad-dir-header">
                  <Network className="w-4 h-4 text-blue-600" />
                  <span>Networking Explorer</span>
                </div>

                {/* CATEGORY 1: VPC CORE ARCHITECTURE */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'core' ? '' : 'core')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      1. VPC Core &amp; Subnets
                    </span>
                    {expandedCategory === 'core' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'core' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('public_private_ip')}
                        className={`acad-dir-item-btn ${selectedNote === 'public_private_ip' ? 'acad-active' : ''}`}
                      >
                        1.1 Public vs Private IP
                      </button>
                      <button 
                        onClick={() => setSelectedNote('default_vpc')}
                        className={`acad-dir-item-btn ${selectedNote === 'default_vpc' ? 'acad-active' : ''}`}
                      >
                        1.2 Default VPC Architecture
                      </button>
                      <button 
                        onClick={() => setSelectedNote('vpc_subnet')}
                        className={`acad-dir-item-btn ${selectedNote === 'vpc_subnet' ? 'acad-active' : ''}`}
                      >
                        1.3 Subnets &amp; Reserved IPs
                      </button>
                      <button 
                        onClick={() => setSelectedNote('internet_gateway')}
                        className={`acad-dir-item-btn ${selectedNote === 'internet_gateway' ? 'acad-active' : ''}`}
                      >
                        1.4 Internet Gateway (IGW)
                      </button>
                    </div>
                  )}
                </div>

                {/* CATEGORY 2: EGRESS & BASTION ACCESS */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'egress' ? '' : 'egress')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-sky-500" />
                      2. Egress &amp; Bastions
                    </span>
                    {expandedCategory === 'egress' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'egress' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('bastion_host')}
                        className={`acad-dir-item-btn ${selectedNote === 'bastion_host' ? 'acad-active' : ''}`}
                      >
                        2.1 Bastion SSH Jump Host
                      </button>
                      <button 
                        onClick={() => setSelectedNote('nat_instance')}
                        className={`acad-dir-item-btn ${selectedNote === 'nat_instance' ? 'acad-active' : ''}`}
                      >
                        2.2 Legacy NAT Instances
                      </button>
                      <button 
                        onClick={() => setSelectedNote('nat_gateway')}
                        className={`acad-dir-item-btn ${selectedNote === 'nat_gateway' ? 'acad-active' : ''}`}
                      >
                        2.3 AWS Managed NAT Gateway
                      </button>
                    </div>
                  )}
                </div>

                {/* CATEGORY 3: SUBNET SECURITY */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'security' ? '' : 'security')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      3. Subnet Firewall Security
                    </span>
                    {expandedCategory === 'security' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'security' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('network_acl')}
                        className={`acad-dir-item-btn ${selectedNote === 'network_acl' ? 'acad-active' : ''}`}
                      >
                        3.1 Network ACL vs Security Group
                      </button>
                      <button 
                        onClick={() => setSelectedNote('default_nacl')}
                        className={`acad-dir-item-btn ${selectedNote === 'default_nacl' ? 'acad-active' : ''}`}
                      >
                        3.2 Default vs Custom NACLs
                      </button>
                      <button 
                        onClick={() => setSelectedNote('ephemeral_ports')}
                        className={`acad-dir-item-btn ${selectedNote === 'ephemeral_ports' ? 'acad-active' : ''}`}
                      >
                        3.3 Ephemeral Ports Range
                      </button>
                    </div>
                  )}
                </div>

                {/* CATEGORY 4: PEERING & ENDPOINTS */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'peering' ? '' : 'peering')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-purple-500" />
                      4. Peering &amp; Endpoints
                    </span>
                    {expandedCategory === 'peering' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'peering' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('vpc_peering')}
                        className={`acad-dir-item-btn ${selectedNote === 'vpc_peering' ? 'acad-active' : ''}`}
                      >
                        4.1 VPC Peering Topology
                      </button>
                      <button 
                        onClick={() => setSelectedNote('vpc_endpoints')}
                        className={`acad-dir-item-btn ${selectedNote === 'vpc_endpoints' ? 'acad-active' : ''}`}
                      >
                        4.2 VPC Endpoints &amp; PrivateLink
                      </button>
                      <button 
                        onClick={() => setSelectedNote('traffic_mirroring')}
                        className={`acad-dir-item-btn ${selectedNote === 'traffic_mirroring' ? 'acad-active' : ''}`}
                      >
                        4.3 VPC Traffic Mirroring
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
                      <Wifi className="w-3.5 h-3.5 text-amber-500" />
                      5. Hybrid &amp; Gateways
                    </span>
                    {expandedCategory === 'hybrid' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'hybrid' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('site_to_site_vpn')}
                        className={`acad-dir-item-btn ${selectedNote === 'site_to_site_vpn' ? 'acad-active' : ''}`}
                      >
                        5.1 Site-to-Site IPSec VPN
                      </button>
                      <button 
                        onClick={() => setSelectedNote('vpn_cloudhub')}
                        className={`acad-dir-item-btn ${selectedNote === 'vpn_cloudhub' ? 'acad-active' : ''}`}
                      >
                        5.2 AWS VPN CloudHub
                      </button>
                      <button 
                        onClick={() => setSelectedNote('direct_connect')}
                        className={`acad-dir-item-btn ${selectedNote === 'direct_connect' ? 'acad-active' : ''}`}
                      >
                        5.3 AWS Direct Connect (DX)
                      </button>
                      <button 
                        onClick={() => setSelectedNote('transit_gateway')}
                        className={`acad-dir-item-btn ${selectedNote === 'transit_gateway' ? 'acad-active' : ''}`}
                      >
                        5.4 AWS Transit Gateway (TGW)
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
                      <Terminal className="w-3.5 h-3.5 text-rose-500" />
                      6. Telemetry &amp; Flow Logs
                    </span>
                    {expandedCategory === 'logging' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'logging' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)' }}>
                      <button 
                        onClick={() => setSelectedNote('flow_logs')}
                        className={`acad-dir-item-btn ${selectedNote === 'flow_logs' ? 'acad-active' : ''}`}
                      >
                        6.1 VPC Flow Logs Ingestion
                      </button>
                      <button 
                        onClick={() => setSelectedNote('flow_logs_arch')}
                        className={`acad-dir-item-btn ${selectedNote === 'flow_logs_arch' ? 'acad-active' : ''}`}
                      >
                        6.2 Flow Logs Architecture &amp; SIEM
                      </button>
                    </div>
                  )}
                </div>

              </div>

              <div className="acad-advice-box rounded-2xl p-4 text-[11px] leading-relaxed font-semibold space-y-1">
                <span className="font-extrabold flex items-center gap-1.5 mb-1 text-[11.5px]" style={{ color: 'var(--da-text-title)' }}>
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Interactive Quick-Launch
                </span>
                Click any of the 19 networking topics to explore multi-cloud AWS, Azure &amp; GCP comparison tables, real-world analogies, and route table configs!
              </div>
            </div>

            {/* Right Active Note Workspace */}
            <div className="lg:col-span-9 space-y-6 text-left">

              {/* TOPIC 1.1: PUBLIC VS PRIVATE IP */}
              {selectedNote === 'public_private_ip' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">1.1 Core VPC &amp; Subnets</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        1.1 Public vs Private Subnets &amp; RFC 1918 IP Addressing
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('cidr')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Subnet Calculator
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Globe className="w-3.5 h-3.5 text-blue-500" /> What Is It &amp; Why Needed?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        A Virtual Private Cloud (VPC) provides an isolated private network in the cloud. Subnets partition the VPC into smaller IP ranges. **Public Subnets** route directly to the Internet; **Private Subnets** isolate sensitive databases from public exposure.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Terminal className="w-3.5 h-3.5 text-emerald-500" /> What Problem Does It Solve?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Prevents hackers on the internet from directly scanning or connecting to backend databases or internal application microservices while maintaining public accessibility for frontend load balancers.
                      </p>
                    </div>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong>
                    <br />• <strong>Public Subnet</strong>: Has a route table entry pointing to an Internet Gateway (`0.0.0.0/0 &rarr; igw-xxx`). Resources get public IPs.
                    <br />• <strong>Private Subnet</strong>: No direct route to the Internet Gateway. Backend databases sit here safely with private RFC 1918 IPs (`10.0.x.x`, `172.16.x.x`, or `192.168.x.x`).
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Apartment Storefront Lobby vs Private Vault Basement
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      • <strong>Public Subnet (Storefront Lobby)</strong>: Open to anyone walking off the street (`Public Internet`). Has glass doors and customer reception counters.
                      <br />• <strong>Private Subnet (Underground Bank Vault)</strong>: Hidden behind 3 locked security doors in the basement. Only employees with internal badges can enter!
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="acad-table">
                      <thead>
                        <tr>
                          <th>Cloud Provider</th>
                          <th>VPC / Network Name</th>
                          <th>Scope Boundary</th>
                          <th>Subnet Scope</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>AWS</strong></td>
                          <td>Amazon VPC</td>
                          <td>Regional (e.g. `us-east-1`)</td>
                          <td>AZ-Specific (Subnet belongs to 1 Availability Zone)</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Azure</strong></td>
                          <td>Azure Virtual Network (VNet)</td>
                          <td>Regional (e.g. `East US`)</td>
                          <td>Region-Wide (Subnet spans across all AZs in region)</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>GCP</strong></td>
                          <td>Google Cloud VPC</td>
                          <td>GLOBAL (Spans all regions globally)</td>
                          <td>Regional (Subnet spans all zones inside a region)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TOPIC 1.2: DEFAULT VPC */}
              {selectedNote === 'default_vpc' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">1.2 Core VPC &amp; Subnets</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        1.2 Default VPC vs Custom Production VPC Architecture
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('cidr')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Subnet Calculator
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Globe className="w-3.5 h-3.5 text-blue-500" /> What Is It &amp; Why Needed?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Every AWS account includes a pre-configured **Default VPC** (`172.31.0.0/16`) in every region with public subnets in each AZ. For production workloads, security mandates building a **Custom VPC** with isolated private subnets and explicit CIDR planning.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Terminal className="w-3.5 h-3.5 text-emerald-500" /> What Problem Does It Solve?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Prevents accidentally launching sensitive databases with public IPv4 addresses in Default VPC public subnets, ensuring strict compliance and zero unauthorized internet exposure.
                      </p>
                    </div>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Default VPC is like a sample furnished apartment provided by the landlord — great for testing, but unsafe for enterprise security! Production apps require a custom floor plan (Custom VPC) with private subnets, NAT Gateways, and strict Security Groups.
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Public Hotel Room vs Custom Guarded Corporate HQ
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      • <strong>Default VPC</strong>: Standard hotel room. The master key opens the front door right off the main hallway corridor (`Public Internet`).
                      <br />• <strong>Custom VPC</strong>: A custom corporate headquarters building with biometric access control, private elevator shafts, and underground parking garages.
                    </p>
                  </div>
                </div>
              )}

              {/* TOPIC 1.3: VPC SUBNET & RESERVED IPS */}
              {selectedNote === 'vpc_subnet' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">1.3 Core VPC &amp; Subnets</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        1.3 Subnet CIDR Sizing &amp; Reserved IP Offsets (AWS vs Azure vs GCP)
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('cidr')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Subnet Calculator
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> When you create a `/24` subnet (256 total IP addresses), you do **NOT** get 256 usable IPs for your virtual machines! Cloud providers automatically reserve a fixed set of IP addresses in every subnet for network routing, DNS resolution, and broadcast operations.
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Reserved Office Suite Room Numbers
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      An office floor has 256 room slots (#100 to #355). Room #100 is reserved for the building main entrance, Room #101 is reserved for the elevator shaft, Room #102 is reserved for the electrical closet, and Room #355 is reserved for emergency exits. That leaves 251 usable office suites for tenants!
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="acad-table">
                      <thead>
                        <tr>
                          <th>Cloud Provider</th>
                          <th>Reserved IPs / Subnet</th>
                          <th>Reserved IP Offsets &amp; Functions</th>
                          <th>Usable IPs in /24 (256 total)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>AWS</strong></td>
                          <td>5 IPs</td>
                          <td>`.0` (Network), `.1` (VPC Router), `.2` (DNS), `.3` (Future), `.255` (Broadcast)</td>
                          <td>251 IPs</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Azure</strong></td>
                          <td>5 IPs</td>
                          <td>`.0` (Network), `.1` (Default Gateway), `.2` &amp; `.3` (Azure DNS), `.255` (Broadcast)</td>
                          <td>251 IPs</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>GCP</strong></td>
                          <td>2 IPs</td>
                          <td>`.0` (Network address) &amp; `.1` (Subnet Default Gateway)</td>
                          <td>254 IPs</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TOPIC 1.4: INTERNET GATEWAY (IGW) */}
              {selectedNote === 'internet_gateway' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">1.4 Core VPC &amp; Subnets</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        1.4 Internet Gateway (IGW): High-Availability Two-Way VPC Edge Router
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('pipelines')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Pipelines Simulator
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Globe className="w-3.5 h-3.5 text-blue-500" /> What Is It &amp; Why Needed?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        An **Internet Gateway (IGW)** is a horizontally scaled, redundant, software-defined component attached to a VPC. It provides Network Address Translation (NAT) for instances with public IPv4 addresses and routes internet traffic into public subnets.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Terminal className="w-3.5 h-3.5 text-emerald-500" /> What Problem Does It Solve?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Serves as the gateway for public traffic coming into Application Load Balancers (ALBs) or Web Servers while imposing **zero bandwidth bottlenecks or availability single points of failure**.
                      </p>
                    </div>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> IGW is the main front door of your cloud VPC network. Exactly 1 IGW can be attached per VPC. It does not cost anything per hour, and it handles unlimited traffic automatically!
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Airport Main Passenger Terminal Gate
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      The main terminal gate at an international airport. Incoming international flights land and unload passengers, while departing flights board passengers and take off into global airspace.
                    </p>
                  </div>
                </div>
              )}

              {/* TOPIC 2.1: BASTION HOST */}
              {selectedNote === 'bastion_host' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">2.1 Egress &amp; Bastions</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        2.1 Bastion SSH Jump Server Architecture &amp; SSH Tunnelling
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('pipelines')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Pipelines Simulator
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Globe className="w-3.5 h-3.5 text-blue-500" /> What Is It &amp; Why Needed?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        A **Bastion Host (Jump Box)** is a hardened EC2 instance residing in a public subnet. Developers SSH into the Bastion Host first, and then jump internally to private subnet servers (or use SSH port forwarding).
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Terminal className="w-3.5 h-3.5 text-emerald-500" /> What Problem Does It Solve?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Allows administrative SSH/RDP access to private backend servers without exposing port 22 or port 3389 of internal databases directly to the public internet.
                      </p>
                    </div>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Bastion host acts as a single secure entry checkpoint. Instead of giving every server a public keyhole, you lock all private servers completely and only allow SSH key authentication through 1 hardened security guard server!
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Security Guard Checkpoint Booth at Building Gate
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      Visitors show their ID badge to the security guard in the guard booth (`Bastion Host`). Once verified, the guard buzzes them through the internal courtyard door to visit the private offices inside.
                    </p>
                  </div>
                </div>
              )}

              {/* TOPIC 2.2: NAT INSTANCE (LEGACY) */}
              {selectedNote === 'nat_instance' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">2.2 Egress &amp; Bastions</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        2.2 Legacy NAT Instances vs Modern Managed NAT Gateways
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('pipelines')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Pipelines Simulator
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> In the early days of AWS, engineers launched a self-managed EC2 Linux instance running iptables NAT scripts. NAT Instances required manually disabling **Source/Destination Check** on the ENI, managing OS security patches, and handling failover scripts. Today, **AWS NAT Gateway** replaces NAT Instances with 100% managed auto-scaling bandwidth (up to 100 Gbps)!
                  </div>

                  <div className="overflow-x-auto">
                    <table className="acad-table">
                      <thead>
                        <tr>
                          <th>Feature Comparison</th>
                          <th>Legacy EC2 NAT Instance</th>
                          <th>AWS Managed NAT Gateway</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Maintenance</strong></td>
                          <td>High (Manual OS patching, iptables tuning)</td>
                          <td>Zero (Fully managed by AWS)</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Bandwidth Scaling</strong></td>
                          <td>Limited to EC2 instance type (e.g. t3.micro)</td>
                          <td>Auto-scales dynamically up to 100 Gbps</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Security Groups</strong></td>
                          <td>Requires associated Security Group</td>
                          <td>No Security Groups to manage</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>High Availability</strong></td>
                          <td>Single EC2 point of failure (Needs script failover)</td>
                          <td>Redundant inside Availability Zone</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TOPIC 2.3: NAT GATEWAY */}
              {selectedNote === 'nat_gateway' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">2.3 Egress &amp; Bastions</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        2.3 AWS Managed NAT Gateway High-Availability &amp; Outbound Egress Routing
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('pipelines')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Pipelines Simulator
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Globe className="w-3.5 h-3.5 text-blue-500" /> What Is It &amp; Why Needed?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Private subnet servers (databases, payment processors) need software security patches from the internet, but **must never accept inbound connections from hackers**. A **NAT Gateway** translates private IPs into a single public Elastic IP for outbound requests.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Terminal className="w-3.5 h-3.5 text-emerald-500" /> What Problem Does It Solve?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Enables secure **one-way outbound internet connectivity** (software updates, API calls) while blocking 100% of unsolicited inbound internet traffic from reaching private backend servers.
                      </p>
                    </div>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> A NAT Gateway resides in a public subnet and connects to private subnets via Route Tables (`0.0.0.0/0 &rarr; nat-xxxx`). For multi-AZ resilience, deploy **1 NAT Gateway per Availability Zone** so an AZ outage won&apos;t drop internet egress for other zones!
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: One-Way Security Exit Turnstile
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      You push open the metal arm of a turnstile to step outside to grab a package from a delivery truck, but people on the sidewalk cannot push the turnstile backward to walk into your building!
                    </p>
                  </div>
                </div>
              )}

              {/* TOPIC 3.1: NETWORK ACL VS SECURITY GROUP */}
              {selectedNote === 'network_acl' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">3.1 Subnet Firewall Security</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        3.1 Network ACL (NACL) vs Security Group (SG): Stateful vs Stateless
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('security')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Security Simulator
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong>
                    <br />• <strong>Security Group (STATEFUL)</strong>: Operates at the **Instance / ENI level**. Evaluates ALLOW rules only. If inbound traffic is allowed on port 80, the return outbound traffic is AUTOMATICALLY allowed regardless of outbound rules!
                    <br />• <strong>Network ACL (STATELESS)</strong>: Operates at the **Subnet Boundary level**. Evaluates ALLOW and DENY rules in numbered order (100, 200, 300). Return traffic MUST be explicitly allowed in outbound rules!
                  </div>

                  <div className="overflow-x-auto">
                    <table className="acad-table">
                      <thead>
                        <tr>
                          <th>Security Boundary Property</th>
                          <th>Security Group (SG)</th>
                          <th>Network Access Control List (NACL)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Enforcement Layer</strong></td>
                          <td>Instance / Network Interface (ENI) Level</td>
                          <td>Subnet Boundary Level</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Statefulness</strong></td>
                          <td><strong>Stateful</strong> (Return traffic auto-tracked)</td>
                          <td><strong>Stateless</strong> (Inbound &amp; Outbound evaluated independently)</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Rules Supported</strong></td>
                          <td>ALLOW Rules Only (Implicit DENY ALL at end)</td>
                          <td>ALLOW and DENY Rules (Processed in numerical rule order)</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Evaluation Order</strong></td>
                          <td>All rules evaluated simultaneously</td>
                          <td>Evaluated in order starting from lowest rule number (e.g. 100)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TOPIC 3.2: DEFAULT NACL */}
              {selectedNote === 'default_nacl' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">3.2 Subnet Firewall Security</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        3.2 Default NACL vs Custom NACL Rule Processing
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('security')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Security Simulator
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong>
                    <br />• <strong>Default NACL</strong>: Associated with subnets automatically upon VPC creation. Allows 100% of inbound and outbound IPv4/IPv6 traffic (Rule 100 ALLOW ALL, Rule * DENY ALL).
                    <br />• <strong>Custom NACL</strong>: Starts completely BLOCKED by default (Rule * DENY ALL for inbound &amp; outbound). You must explicitly add numbered ALLOW rules (e.g. Rule 100 ALLOW TCP 80, Rule 110 ALLOW TCP 443).
                  </div>
                </div>
              )}

              {/* TOPIC 3.3: EPHEMERAL PORTS */}
              {selectedNote === 'ephemeral_ports' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">3.3 Subnet Firewall Security</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        3.3 Ephemeral Ports Range (1024–65535) &amp; Outbound Return Path Drops
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('security')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Security Simulator
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> When a client browser requests a website on TCP Port 80, the OS opens a short-lived temporary port on the client device (an **Ephemeral Port** between 1024 and 65535, e.g. Port 52144). Because NACLs are **stateless**, your outbound NACL rule must explicitly allow TCP traffic on ephemeral ports (`1024-65535`), or the server&apos;s HTTP response will be dropped at the subnet border!
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Return Mail SASE (Self-Addressed Stamped Envelope)
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      You send a letter to a company asking for a catalog. In the envelope, you enclose a temporary self-addressed envelope (`Ephemeral Port`). If the mailroom drops return mail addressed to temporary envelopes, you never get your catalog back!
                    </p>
                  </div>
                </div>
              )}

              {/* TOPIC 4.1: VPC PEERING */}
              {selectedNote === 'vpc_peering' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">4.1 Peering &amp; Endpoints</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        4.1 VPC Peering &amp; Non-Transitive Routing Limitations
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('endpoints')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Peering Simulator
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Globe className="w-3.5 h-3.5 text-blue-500" /> What Is It &amp; Why Needed?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        **VPC Peering** links 2 VPCs privately over AWS backplane fibers. Traffic between peered VPCs is encrypted and never traverses the public internet. CIDR blocks MUST NOT overlap.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Terminal className="w-3.5 h-3.5 text-emerald-500" /> What Problem Does It Solve?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Enables high-speed, low-latency private connectivity between microservices in different AWS accounts or regions without NAT Gateway egress overhead.
                      </p>
                    </div>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> VPC Peering is **NON-TRANSITIVE**. If VPC A is peered with VPC B, and VPC B is peered with VPC C, VPC A CANNOT communicate with VPC C through VPC B! To connect 50+ VPCs transitively, use **AWS Transit Gateway**.
                  </div>
                </div>
              )}

              {/* TOPIC 4.2: VPC ENDPOINTS & PRIVATELINK */}
              {selectedNote === 'vpc_endpoints' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">4.2 Peering &amp; Endpoints</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        4.2 VPC Endpoints: Gateway Endpoints (S3/DynamoDB) vs Interface Endpoints (PrivateLink)
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('endpoints')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Endpoints Simulator
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong>
                    <br />• <strong>Gateway Endpoint (FREE)</strong>: Targets **S3 &amp; DynamoDB ONLY**. Added as a route in your Route Table (`pl-xxxx &rarr; vpce-gateway`). Zero hourly cost!
                    <br />• <strong>Interface Endpoint / PrivateLink ($0.01/hr + Data)</strong>: Creates a private Elastic Network Interface (ENI) with a private IP inside your subnet for 100+ AWS services (SQS, SNS, Secrets Manager, Kinesis)!
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Public Street Taxi vs Underground Private Conveyor Tunnel
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      Instead of walking outside onto the public city street to visit the bank next door (`Public Internet NAT Gateway`), your building digs an underground private basement tunnel (`VPC Endpoint`). You step directly into the bank vault without ever stepping outside into public weather!
                    </p>
                  </div>
                </div>
              )}

              {/* TOPIC 4.3: TRAFFIC MIRRORING */}
              {selectedNote === 'traffic_mirroring' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">4.3 Peering &amp; Endpoints</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        4.3 VPC Traffic Mirroring: Out-of-Band IDS Packet Inspection
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('endpoints')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Endpoints Simulator
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Globe className="w-3.5 h-3.5 text-blue-500" /> What Is It &amp; Why Needed?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        **VPC Traffic Mirroring** copies raw network payload bytes (Layer 2 - Layer 7) from EC2 ENIs and streams them out-of-band to a Network Load Balancer (NLB) or security appliance running Suricata/Zeek Intrusion Detection (IDS).
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Terminal className="w-3.5 h-3.5 text-emerald-500" /> What Problem Does It Solve?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Detects deep malware exfiltration, zero-day payloads, and suspicious protocol anomalies without introducing latency or installing agents inside application EC2 instances.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TOPIC 5.1: SITE-TO-SITE VPN */}
              {selectedNote === 'site_to_site_vpn' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">5.1 Hybrid &amp; Gateways</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        5.1 Site-to-Site IPSec VPN: VGW, Customer Gateway &amp; Redundant Tunnels
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('hybrid')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Hybrid Simulator
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Connects an on-premises physical router (**Customer Gateway / CGW**) to an **AWS Virtual Private Gateway (VGW)** or Transit Gateway over 2 redundant IPSec encrypted tunnels. Fast setup in 30 minutes over public internet!
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Public Highway Armored Van Escort
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      An encrypted armored van driving cash payloads over public highways. It is secure, but subject to internet traffic jams during peak rush hours.
                    </p>
                  </div>
                </div>
              )}

              {/* TOPIC 5.2: AWS VPN CLOUDHUB */}
              {selectedNote === 'vpn_cloudhub' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">5.2 Hybrid &amp; Gateways</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        5.2 AWS VPN CloudHub: Multi-Site Branch Office Interconnect
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('hybrid')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Hybrid Simulator
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **AWS VPN CloudHub** enables multiple remote branch office locations (e.g. New York office, London office, Tokyo office) to communicate securely with each other AND with AWS VPCs through a single Virtual Private Gateway (VGW) using BGP dynamic routing!
                  </div>
                </div>
              )}

              {/* TOPIC 5.3: DIRECT CONNECT */}
              {selectedNote === 'direct_connect' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">5.3 Hybrid &amp; Gateways</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        5.3 AWS Direct Connect (DX): Dedicated Enterprise Fiber Optic Links
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('hybrid')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Hybrid Simulator
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Dedicated physical fiber optic cross-connect (1 Gbps, 10 Gbps, or 100 Gbps) plugging directly from your datacenter router into an AWS Direct Connect Location. Bypasses the public internet entirely for sub-millisecond, consistent latency!
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Private Dedicated High-Speed Bullet Train Track
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      Your company lays a private high-speed bullet train track straight from your warehouse to AWS. Zero traffic jams ever, guaranteed fixed arrival times!
                    </p>
                  </div>
                </div>
              )}

              {/* TOPIC 5.4: TRANSIT GATEWAY */}
              {selectedNote === 'transit_gateway' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">5.4 Hybrid &amp; Gateways</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        5.4 AWS Transit Gateway (TGW): Central Hub-and-Spoke Router Topology
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('hybrid')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Hybrid Simulator
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> A regional cloud router that interconnects thousands of AWS VPCs, AWS Site-to-Site VPNs, and Direct Connect links through a single hub. Supports **Transitive Routing** and custom TGW Route Tables!
                  </div>
                </div>
              )}

              {/* TOPIC 6.1: VPC FLOW LOGS */}
              {selectedNote === 'flow_logs' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">6.1 Telemetry &amp; Flow Logs</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        6.1 VPC Flow Logs Ingestion &amp; ENI Traffic Telemetry Fields
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('hybrid')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Flow Logs Simulator
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **VPC Flow Logs** captures IP traffic flow data entering and leaving network interfaces (ENIs) in your VPC. Logs record source/destination IPs, ports, protocol numbers, packet counts, byte counts, and action statuses (**ACCEPT** or **REJECT**).
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Automated Traffic Security Camera at Highway Tolls
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      An automated speed camera records every car passing the toll gate: Timestamp, License Plate (`Source IP`), Destination (`Dest IP`), Speed (`Byte Count`), and Action: Passed Gate (`ACCEPT`) or Turned Away (`REJECT`).
                    </p>
                  </div>
                </div>
              )}

              {/* TOPIC 6.2: FLOW LOGS ARCHITECTURE */}
              {selectedNote === 'flow_logs_arch' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">6.2 Telemetry &amp; Flow Logs</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        6.2 Flow Logs Architecture, S3 Ingestion &amp; Amazon Athena Analytics
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('hybrid')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5" /> Launch Flow Logs Simulator
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Flow logs can be delivered to **S3 buckets** (long-term audit retention), **CloudWatch Logs** (real-time metric alarms), or **Kinesis Data Firehose** (SIEM streaming to Splunk/Datadog). Query S3 flow logs instantly using SQL queries in **Amazon Athena**!
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}


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
                <div className="lg:col-span-5 da-card-costly flex flex-col text-left transition-all duration-300 relative group overflow-hidden">
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
                    <div className="da-cost-box-costly space-y-2">
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

                    <div className="da-cost-box-costly space-y-2">
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

                    <div className="da-cost-box-costly space-y-2">
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
                <div className="lg:col-span-5 da-card-savings flex flex-col text-left transition-all duration-300 relative group overflow-hidden">
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
                    <div className="da-cost-box-savings space-y-2">
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

                    <div className="da-cost-box-savings space-y-2">
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

                    <div className="da-cost-box-savings space-y-2">
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
                <div className="da-card p-6 text-left relative overflow-hidden">
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">Live Cost engine</span>
                  </div>

                  <h3 className="text-sm font-extrabold mb-2">Interactive Pathway Cost Comparison</h3>
                  <p className="text-xs mb-6">
                    See how your monthly data volume of <span className="text-sky-600 dark:text-sky-400 font-bold">{costDataGb} GB</span> is billed across different network paths. Click on any route below to set it as your target destination path.
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
                          className={`p-3.5 rounded-xl transition-all cursor-pointer da-cost-row ${
                            isSelected ? 'da-selected' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="da-route-name text-xs font-bold">
                                  {route.name}
                                </span>
                                {isSelected && (
                                  <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 text-[9px] px-1.5 py-0.2 rounded font-black tracking-wider uppercase da-badge-emerald">
                                    Selected
                                  </span>
                                )}
                              </div>
                              <span className="da-route-desc text-[10px] block mt-0.5 leading-tight">{route.desc}</span>
                            </div>
                            <div className="text-right">
                              <span className="da-route-total text-xs font-extrabold block">
                                ${total.toFixed(2)} <span className="text-[9px] font-normal da-route-rate">/mo</span>
                              </span>
                              <span className="da-route-rate text-[9px]">{route.badge}</span>
                            </div>
                          </div>

                          {/* Cost Bar */}
                          <div className="w-full h-2 da-cost-bar-bg rounded-full overflow-hidden">
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
                <div className="da-card text-left p-5">
                  <div className="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
                    <Info className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider">
                      Architect's Cost Optimization Rules
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">1.</span>
                        <p><strong>Keep traffic within the same AZ</strong>: If instances communicate over Private IPs in the same Availability Zone, transit is <strong>100% free</strong>.</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">2.</span>
                        <p><strong>Avoid Elastic IPs for local traffic</strong>: Routing via Public/Elastic IPs loops traffic to public AWS edge routers, charging you <strong>$0.02/GB</strong> even in the same AZ!</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">3.</span>
                        <p><strong>Optimize cross-AZ routes</strong>: If you must cross AZs, stick to <strong>Private IPs</strong> to reduce fees to the minimum <strong>$0.01/GB</strong> standard transfer rate.</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">4.</span>
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
                <div className="da-card p-6 text-left relative overflow-hidden">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6">S3 Egress Topology Route</h3>

                  <div className="h-44 da-svg-bg rounded-xl flex items-center justify-center p-4 relative border border-slate-200/60">
                    {/* Render custom S3 egress pipeline */}
                    <svg viewBox="0 0 700 200" className="w-full h-full font-semibold">
                      {/* Left: Amazon S3 Bucket */}
                      <g transform="translate(100, 100)">
                        <rect x="-35" y="-35" width="70" height="70" rx="10" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="2" />
                        <text y="5" textAnchor="middle" fill="var(--da-svg-indigo-text)" fontSize="10" fontWeight="bold">Amazon S3</text>
                      </g>

                      {/* Middle: Optional CloudFront Edge */}
                      {s3EgressRoute === 'cloudfront' ? (
                        <g transform="translate(350, 100)">
                          <polygon points="0,-40 40,0 0,40 -40,0" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="2" className="animate-pulse" />
                          <text y="5" textAnchor="middle" fill="var(--da-svg-purple-text)" fontSize="9" fontWeight="bold">CloudFront Edge</text>
                        </g>
                      ) : s3EgressRoute === 'accelerator' ? (
                        <g transform="translate(350, 100)">
                          <polygon points="0,-40 40,0 0,40 -40,0" fill="var(--da-svg-red-bg)" stroke="var(--da-svg-red-border)" strokeWidth="2" />
                          <text y="5" textAnchor="middle" fill="var(--da-svg-red-text)" fontSize="9" fontWeight="bold">Transfer Accel</text>
                        </g>
                      ) : (
                        <g transform="translate(350, 100)">
                          <circle r="10" fill="var(--da-bg)" stroke="var(--da-text-muted)" strokeWidth="1" />
                          <text x="0" y="25" textAnchor="middle" fill="var(--da-text-muted)" fontSize="9" fontWeight="bold">Direct Transit</text>
                        </g>
                      )}

                      {/* Connectors */}
                      <path d="M 135 100 L 310 100" fill="none" stroke="var(--da-text-muted)" strokeWidth="2" strokeDasharray="5,5" />
                      {s3SimState === 'running' && (
                        <path d="M 135 100 L 310 100" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="3" className="r53-flow-blue" />
                      )}

                      <path d="M 390 100 L 565 100" fill="none" stroke="var(--da-text-muted)" strokeWidth="2" strokeDasharray="5,5" />
                      {s3SimState === 'running' && (
                        <path d="M 390 100 L 565 100" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="3" className="r53-flow-orange" />
                      )}

                      {/* Right: Client / Destination */}
                      <g transform="translate(600, 100)">
                        <circle r="35" fill="var(--da-bg)" stroke="var(--da-svg-green-border)" strokeWidth="2" />
                        <text y="5" textAnchor="middle" fill="var(--da-svg-green-text)" fontSize="10" fontWeight="bold">Public Client</text>
                      </g>
                    </svg>
                  </div>

                  {/* Calculations breakdown cards */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center">
                      <span className="text-[10px] font-black text-slate-500 block uppercase">Route Chosen</span>
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mt-2.5 block uppercase tracking-wider">
                        {s3EgressRoute === 'direct' && 'Direct Egress'}
                        {s3EgressRoute === 'cloudfront' && 'CloudFront Caching'}
                        {s3EgressRoute === 'accelerator' && 'Edge Acceleration'}
                        {s3EgressRoute === 'crr' && 'Disaster Recovery'}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center">
                      <span className="text-[10px] font-black text-slate-500 block uppercase">Egress Surcharge Rate</span>
                      <span className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-1 block">
                        ${s3EgressRoute === 'direct' ? '0.090' : s3EgressRoute === 'cloudfront' ? '0.085' : s3EgressRoute === 'accelerator' ? '0.130' : '0.020'}/GB
                      </span>
                    </div>
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center">
                      <span className="text-[10px] font-black text-slate-500 block uppercase">Estimated Charge</span>
                      <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                        ${(s3DataGb * (s3EgressRoute === 'direct' ? 0.09 : s3EgressRoute === 'cloudfront' ? 0.085 : s3EgressRoute === 'accelerator' ? 0.13 : 0.02)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* S3 logs console */}
                <div className="da-card text-left p-5">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" /> S3 Dynamic Routing Console Trace
                    </h3>
                    <span className="text-[9px] bg-slate-250 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">STDOUT</span>
                  </div>

                  <div className="h-48 overflow-y-auto space-y-2 font-mono text-[11px] p-4 acad-terminal rounded-lg">
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
                <div className="da-card p-6 text-left relative overflow-hidden">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6">Interactive Architecture Cost Comparison</h3>

                  {/* Architecture comparison box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Path A: NAT Gateway */}
                    <div className="border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded font-black">PATH A: NAT GATEWAY</span>
                        <span className="text-xs font-bold text-rose-600 dark:text-rose-400">Expensive Path</span>
                      </div>

                      <div className="space-y-1 mt-2 text-xs text-slate-700">
                        <div className="flex justify-between">
                          <span>Hourly NAT Fee:</span>
                          <span className="font-bold">${(natHours * 0.045).toFixed(2)} USD</span>
                        </div>
                        <div className="text-[10px] text-slate-500 leading-none">({natHours} hrs @ $0.045/hr)</div>

                        <div className="flex justify-between mt-1">
                          <span>Data Processing Fee:</span>
                          <span className="font-bold">${(natDataGb * 0.045).toFixed(2)} USD</span>
                        </div>
                        <div className="text-[10px] text-slate-500 leading-none">({natDataGb} GB processed @ $0.045/GB)</div>

                        <div className="border-t border-rose-200 dark:border-rose-900 mt-3 pt-2 flex justify-between text-sm font-extrabold">
                          <span>Total Month:</span>
                          <span className="text-rose-600 dark:text-rose-400">${(natHours * 0.045 + natDataGb * 0.045).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Path B: S3 Gateway Endpoint */}
                    <div className="border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-0.5 rounded font-black">PATH B: S3 GATEWAY ENDPOINT</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">🟢 100% FREE</span>
                      </div>

                      <div className="space-y-1 mt-2 text-xs text-slate-700">
                        <div className="flex justify-between">
                          <span>Hourly VPCE Fee:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">$0.00 USD</span>
                        </div>
                        <div className="text-[10px] text-slate-500 leading-none">(No hourly charges)</div>

                        <div className="flex justify-between mt-1">
                          <span>Data Processing Fee:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">$0.00 USD</span>
                        </div>
                        <div className="text-[10px] text-slate-500 leading-none">(No GB processing fees)</div>

                        <div className="border-t border-emerald-200 dark:border-emerald-900 mt-3 pt-2 flex justify-between text-sm font-extrabold">
                          <span>Total Month:</span>
                          <span className="text-emerald-600 dark:text-emerald-400">$0.00</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Savings summary */}
                  <div className="bg-emerald-100/40 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-xl p-4 mt-6 text-center">
                    <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">Potential Monthly Cost Savings</span>
                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-300 block mt-1">
                      ${(natHours * 0.045 + natDataGb * 0.045).toFixed(2)} USD
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 block">Based on S3 routing modifications. 100% zero-cost networking.</span>
                  </div>
                </div>

                {/* NAT logs console */}
                <div className="da-card text-left p-5">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" /> Route Table savings simulator trace
                    </h3>
                    <span className="text-[9px] bg-slate-250 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">STDOUT</span>
                  </div>

                  <div className="h-48 overflow-y-auto space-y-2 font-mono text-[11px] p-4 acad-terminal rounded-lg">
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
                <div className="da-card p-6 text-left relative overflow-hidden">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-6">AWS Network Firewall Security Shield</h3>

                  <div className="h-44 da-svg-bg rounded-xl flex items-center justify-center p-4 relative border border-slate-200/60">
                    <svg viewBox="0 0 700 200" className="w-full h-full font-semibold">
                      {/* Left: Traffic Source */}
                      <g transform="translate(100, 100)">
                        <circle r="30" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="2" />
                        <text y="5" textAnchor="middle" fill="var(--da-svg-indigo-text)" fontSize="9" fontWeight="bold">
                          {firewallTrafficSource.toUpperCase()}
                        </text>
                      </g>

                      {/* Path to Shield */}
                      <path d="M 130 100 L 310 100" fill="none" stroke="var(--da-text-muted)" strokeWidth="2" strokeDasharray="5,5" />
                      {firewallSimState === 'running' && (
                        <path d="M 130 100 L 310 100" fill="none" stroke="var(--da-svg-red-border)" strokeWidth="3" className="r53-flow-orange" />
                      )}

                      {/* Middle: Network Firewall Shield */}
                      <g transform="translate(350, 100)">
                        {firewallActive ? (
                          <>
                            <polygon points="0,-45 40,-15 40,30 0,55 -40,30 -40,-15" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="3" className="animate-pulse" />
                            <text y="5" textAnchor="middle" fill="var(--da-svg-purple-text)" fontSize="9" fontWeight="bold">AWS Firewall</text>
                          </>
                        ) : (
                          <>
                            <polygon points="0,-45 40,-15 40,30 0,55 -40,30 -40,-15" fill="var(--da-svg-red-bg)" stroke="var(--da-svg-red-border)" strokeWidth="1" />
                            <text y="5" textAnchor="middle" fill="var(--da-svg-red-text)" fontSize="9" fontWeight="bold">Bypassed (Risk)</text>
                          </>
                        )}
                      </g>

                      {/* Path to destination subnets */}
                      <path d="M 390 100 L 570 100" fill="none" stroke="var(--da-text-muted)" strokeWidth="2" strokeDasharray="5,5" />
                      {firewallSimState === 'running' && firewallActive && firewallRuleAction === 'allow' && (
                        <path d="M 390 100 L 570 100" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="3" className="r53-flow-green" />
                      )}
                      {firewallSimState === 'running' && firewallActive && firewallRuleAction === 'alert' && (
                        <path d="M 390 100 L 570 100" fill="none" stroke="var(--da-svg-purple-border)" strokeWidth="3" className="r53-flow-purple" />
                      )}

                      {/* Right: Protected subnet instances */}
                      <g transform="translate(600, 100)">
                        <rect x="-35" y="-35" width="70" height="70" rx="8" fill="var(--da-bg)" stroke="var(--da-svg-green-border)" strokeWidth="2" />
                        <text y="5" textAnchor="middle" fill="var(--da-svg-green-text)" fontSize="9" fontWeight="bold">EC2 Instances</text>
                      </g>
                    </svg>
                  </div>

                  {/* Operational status indicators */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center">
                      <span className="text-[10px] font-black text-slate-500 block uppercase">IPS Threat Engine</span>
                      <span className={`text-xs font-bold mt-2.5 block uppercase tracking-wider ${firewallActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400 font-extrabold'}`}>
                        {firewallActive ? '🛡️ Stateful Shield' : '⚠️ Disabled'}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center">
                      <span className="text-[10px] font-black text-slate-500 block uppercase">Assigned Rule</span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-2.5 block uppercase tracking-wider">
                        {firewallRuleAction.toUpperCase()} Action
                      </span>
                    </div>
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl text-center">
                      <span className="text-[10px] font-black text-slate-500 block uppercase">Packet Verdict</span>
                      <span className={`text-xs font-bold mt-2.5 block uppercase tracking-wider ${
                        !firewallActive ? 'text-rose-600 dark:text-rose-400' :
                        firewallRuleAction === 'allow' ? 'text-emerald-600 dark:text-emerald-400' :
                        firewallRuleAction === 'drop' ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-amber-600 dark:text-amber-400'
                      }`}>
                        {!firewallActive ? 'PASSED (UNCHECKED)' : firewallRuleAction === 'allow' ? 'ACCEPT (ROUTED)' : firewallRuleAction === 'drop' ? 'DROP (BLOCKED)' : 'ALERT (ROUTED)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Firewall logs console */}
                <div className="da-card text-left p-5">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-200 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-500" /> Stateful Firewall Policy logs
                    </h3>
                    <span className="text-[9px] bg-slate-250 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded font-mono">FIREWALL_ALERT</span>
                  </div>

                  <div className="h-48 overflow-y-auto space-y-2 font-mono text-[11px] p-4 acad-terminal rounded-lg">
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
          </>
        </Translate>
      )}

    </div>
  );
}
