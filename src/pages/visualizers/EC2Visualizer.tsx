import { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Info,
  Copy,
  Network,
  Zap,
  Sliders,
  Globe
} from 'lucide-react';

// Types & Configs for EC2 Visualizer
interface InstanceFamily {
  name: string;
  classCode: string;
  vcpuRange: string;
  ramRange: string;
  networkBandwidth: string;
  ebsBandwidth: string;
  useCase: string;
  icon: string;
  desc: string;
}

const INSTANCE_FAMILIES: Record<string, InstanceFamily> = {
  general: {
    name: 'General Purpose (t3, m6g, m7i)',
    classCode: 'T / M',
    vcpuRange: '2 to 128 vCPUs',
    ramRange: '0.5 GiB to 512 GiB',
    networkBandwidth: 'Up to 25 Gbps',
    ebsBandwidth: 'Up to 20 Gbps',
    useCase: 'Standard web servers, microservices backends, test/dev pipelines, caching fleets.',
    icon: '💻',
    desc: 'Balanced resource allocation. Standard baseline compute with capacity to burst (t-series burstable credits) or sustained performance (m-series).',
  },
  compute: {
    name: 'Compute Optimized (c6g, c7i, c8g)',
    classCode: 'C',
    vcpuRange: '2 to 192 vCPUs',
    ramRange: '4 GiB to 384 GiB',
    networkBandwidth: 'Up to 100 Gbps',
    ebsBandwidth: 'Up to 80 Gbps',
    useCase: 'High-performance web apps, scientific modeling, game servers, video rendering, machine learning inference.',
    icon: '⚡',
    desc: 'High ratio of vCPUs to memory. Tailored for compute-heavy workloads running dedicated raw thread processing.',
  },
  memory: {
    name: 'Memory Optimized (r6g, r7i, x2gd, z1d)',
    classCode: 'R / X / Z',
    vcpuRange: '2 to 256 vCPUs',
    ramRange: '16 GiB to 4,096 GiB',
    networkBandwidth: 'Up to 100 Gbps',
    ebsBandwidth: 'Up to 80 Gbps',
    useCase: 'In-memory databases (Redis, Memcached), high-scale SAP workloads, large database cluster primary instances.',
    icon: '🧠',
    desc: 'Designed for processing enormous datasets in-memory. Exceptional RAM allocations per vCPU core.',
  },
  storage: {
    name: 'Storage Optimized (i3en, i4g, d3, h1)',
    classCode: 'I / D / H',
    vcpuRange: '4 to 128 vCPUs',
    ramRange: '32 GiB to 1,024 GiB',
    networkBandwidth: 'Up to 100 Gbps',
    ebsBandwidth: 'Up to 80 Gbps',
    useCase: 'NoSQL storage fleets (Cassandra, MongoDB), distributed databases, Kafka clusters, big data parallel processing.',
    icon: '💾',
    desc: 'Equipped with ultra-fast direct-attached local NVMe physical drives (Instance Store) or massive magnetic disk capacities.',
  },
  gpu: {
    name: 'Accelerated Computing (g5, p4de, trn1)',
    classCode: 'G / P / Trn / Inf',
    vcpuRange: '4 to 96 vCPUs',
    ramRange: '16 GiB to 768 GiB (plus VRAM)',
    networkBandwidth: 'Up to 800 Gbps',
    ebsBandwidth: 'Up to 40 Gbps',
    useCase: 'Deep learning model training, AI LLM tuning (trn1), hardware graphics compilation, heavy parallel math, crypto workflows.',
    icon: '🎨',
    desc: 'Co-processor acceleration backed by specialized hardware (NVIDIA Tensor Core GPUs or custom AWS Trainium chips).',
  }
};

const BASH_BOOTSTRAPS = {
  nginx: `#!/bin/bash
# ----------------------------------------------------
# Bootstrapping Script: Install Nginx & Custom Homepage
# ----------------------------------------------------
echo "=== Step 1: Updating System Repositories ==="
yum update -y

echo "=== Step 2: Installing Nginx Server ==="
amazon-linux-extras install nginx1 -y
systemctl start nginx
systemctl enable nginx

echo "=== Step 3: Fetching Metadata & Injecting Content ==="
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60")
INSTANCE_ID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)
LOCAL_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4)

cat <<HTML > /usr/share/nginx/html/index.html
<!DOCTYPE html>
<html>
<head>
  <title>EC2 Web Host Bootstrap</title>
  <style>body { font-family: sans-serif; text-align: center; padding: 50px; background: #f8fafc; }</style>
</head>
<body>
  <h1 style="color: #0284c7;">🚀 EC2 Active Web server!</h1>
  <p><b>Instance ID:</b> \${INSTANCE_ID}</p>
  <p><b>Private IP:</b> \${LOCAL_IP}</p>
  <p>Status: Successfully bootstrapped via EC2 User Data!</p>
</body>
</html>
HTML

echo "=== Step 4: Restoring Nginx Service ==="
systemctl restart nginx
echo "=== Bootstrapping Complete: Web Server Online ==="`,

  docker: `#!/bin/bash
# ----------------------------------------------------
# Bootstrapping Script: Install Docker & Run Node App
# ----------------------------------------------------
echo "=== Step 1: Preparing Docker Engine Packages ==="
yum update -y
amazon-linux-extras install docker -y
systemctl start docker
systemctl enable docker

echo "=== Step 2: Granting permissions to ec2-user ==="
usermod -aG docker ec2-user

echo "=== Step 3: Launching Node Application Container ==="
docker run -d -p 80:3000 --name node-web-service \\
  -e DB_HOST="database.internal.vpc" \\
  node:18-alpine -e "
    const http = require('http');
    http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Hello from EC2 containerized inside Docker!\\\\n');
    }).listen(3000);
  "

echo "=== Step 4: Verifying Service Ports ==="
docker ps
echo "=== Bootstrapping Complete: Docker Container Operational ==="`,

  appsec: `#!/bin/bash
# ----------------------------------------------------
# Bootstrapping Script: Security Hardening & Agent Setup
# ----------------------------------------------------
echo "=== Step 1: Installing Security Audit Utilities ==="
yum update -y
yum install -y fail2ban auditing clamav

echo "=== Step 2: Hardening File Permissions & SSHD ==="
chmod 700 /home/ec2-user/.ssh
chmod 600 /home/ec2-user/.ssh/authorized_keys
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/g' /etc/ssh/sshd_config
systemctl restart sshd

echo "=== Step 3: Launching System Monitor Agent ==="
cat << 'EOF' > /usr/local/bin/sys-mon.sh
#!/bin/bash
while true; do
  CPU=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
  echo "📊 System Monitor: CPU Load is at \${CPU}%"
  sleep 60
done
EOF
chmod +x /usr/local/bin/sys-mon.sh
nohup /usr/local/bin/sys-mon.sh > /var/log/sys-mon.log 2>&1 &

echo "=== Bootstrapping Complete: Host Hardened ==="`
};

export default function EC2Visualizer() {
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'purchasing' | 'storage' | 'lifecycle' | 'best' | 'notebook'>('notebook');

  // Visual Architect Academy Notebook states
  const [selectedNote, setSelectedNote] = useState<string>('ec2_bootstrap');
  const [expandedCategory, setExpandedCategory] = useState<string>('ec2_fundamentals');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Interactive CPU Credit states
  const [nbInstanceSize, setNbInstanceSize] = useState<'nano' | 'micro' | 'small'>('micro');
  const [nbCpuUtilization, setNbCpuUtilization] = useState<number>(35);
  const [nbCreditLog, setNbCreditLog] = useState<string[]>([]);

  const runCpuCreditCycleSim = () => {
    const logs: string[] = [];
    let baseline = 10;
    let rate = 12; // credits earned per hour
    let maxCredits = 288;
    if (nbInstanceSize === 'nano') {
      baseline = 5;
      rate = 6;
      maxCredits = 144;
    } else if (nbInstanceSize === 'small') {
      baseline = 20;
      rate = 24;
      maxCredits = 576;
    }

    let currentCredits = Math.floor(maxCredits * 0.4); // Start at 40% full
    logs.push(`📊 Starting 24-hour simulation for t3.${nbInstanceSize} (Baseline CPU: ${baseline}%, Earn Rate: ${rate} credits/hr, Max Bucket: ${maxCredits})`);
    logs.push(`🔌 Initial credit balance: ${currentCredits} credits (40% capacity).`);

    // Simulate 24 hours
    for (let hour = 1; hour <= 24; hour++) {
      // Add random fluctuations to simulated CPU around the chosen target
      const fluctuation = (Math.random() - 0.5) * 15;
      const hourCpu = Math.max(1, Math.min(100, Math.round(nbCpuUtilization + fluctuation)));
      
      const earned = rate;
      const burned = Number((1.2 * hourCpu).toFixed(1));
      const net = Number((earned - burned).toFixed(1));
      
      currentCredits = Math.max(0, Math.min(maxCredits, Number((currentCredits + net).toFixed(1))));
      
      let statusIcon = net >= 0 ? '📈' : '📉';
      logs.push(`Hour ${hour}: CPU Avg: ${hourCpu}% | ${statusIcon} Earned: ${earned} | Spent: ${burned} | Net: ${net >= 0 ? '+' : ''}${net} | Balance: ${currentCredits}`);
      
      if (currentCredits <= 0) {
        logs.push(`🚨 CRITICAL: Credit balance exhausted at Hour ${hour}! CPU is now forced-throttled to baseline ${baseline}%.`);
      }
    }
    
    setNbCreditLog(logs);
  };

  const handleCopyCode = (codeText: string, noteId: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedNoteId(noteId);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  // Tab 1: Overview States
  const [selectedFamily, setSelectedFamily] = useState<string>('general');
  const [selectedBootstrap, setSelectedBootstrap] = useState<'nginx' | 'docker' | 'appsec'>('nginx');
  const [bootTerminalLogs, setBootTerminalLogs] = useState<string[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState<boolean>(false);
  const bootTerminalRef = useRef<HTMLDivElement>(null);

  // Tab 2: Security States
  const [sgRules, setSgRules] = useState([
    { id: 1, type: 'SSH', port: 22, source: '10.0.1.50/32 (Bastion)' },
    { id: 2, type: 'HTTP', port: 80, source: '0.0.0.0/0 (Any)' },
    { id: 3, type: 'HTTPS', port: 443, source: '0.0.0.0/0 (Any)' },
  ]);
  const [newRulePort, setNewRulePort] = useState<string>('8080');
  const [newRuleSource, setNewRuleSource] = useState<string>('0.0.0.0/0');
  const [newRuleType, setNewRuleType] = useState<string>('Custom TCP');
  const [firewallTestResult, setFirewallTestResult] = useState<{ status: 'ALLOW' | 'DROP'; msg: string } | null>(null);
  const [sendingPacket, setSendingPacket] = useState<string | null>(null);

  // Tab 3: Spot States
  const [maxBid, setMaxBid] = useState<number>(0.22);
  const [spotPrice, setSpotPrice] = useState<number>(0.15);
  const [allocationStrategy, setAllocationStrategy] = useState<'lowestPrice' | 'capacityOptimized' | 'diversified'>('capacityOptimized');
  const [spotCountdown, setSpotCountdown] = useState<number | null>(null);
  const [spotLogs, setSpotLogs] = useState<string[]>([
    'Spot Fleet registered. Desired capacity: 3 instances.',
    'System status checks OK. Active Spot instances running smoothly.',
  ]);

  // Tab 4: Storage States
  const [ebsVolumeType, setEbsVolumeType] = useState<'gp3' | 'io2' | 'st1' | 'sc1'>('gp3');
  const [ebsSize, setEbsSize] = useState<number>(100);
  const [ebsIops, setEbsIops] = useState<number>(3000);
  const [efsThroughput, setEfsThroughput] = useState<'bursting' | 'elastic' | 'provisioned'>('elastic');
  const [efsPerfMode, setEfsPerfMode] = useState<'general' | 'max_io'>('general');
  const [efsLifecycleDays, setEfsLifecycleDays] = useState<number>(30);
  const [efsSize, setEfsSize] = useState<number>(500);
  const [efsProvisionedMb, setEfsProvisionedMb] = useState<number>(50);
  const [efsInactiveRatio, setEfsInactiveRatio] = useState<number>(70);

  // Tab 5: Virtual Console States
  const [consoleInstanceType, setConsoleInstanceType] = useState<string>('t3.medium');
  const [consoleStorageType, setConsoleStorageType] = useState<'ebs' | 'ephemeral' | 'both'>('both');
  const [deleteEbsOnTerm, setDeleteEbsOnTerm] = useState<boolean>(true);
  const [consolePurchaseModel, setConsolePurchaseModel] = useState<'ondemand' | 'spot'>('ondemand');
  const [vmState, setVmState] = useState<'Stopped' | 'Pending' | 'Running' | 'Stopping' | 'Terminated'>('Stopped');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    'Console Initialized. Instance state: Stopped. Ready to launch.',
  ]);
  const [isConsoleSimulatingCpu, setIsConsoleSimulatingCpu] = useState<boolean>(false);
  const [consoleCpuGauge, setConsoleCpuGauge] = useState<number>(3);
  const [vmUserDataTested, setVmUserDataTested] = useState<boolean>(false);
  const consoleTerminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminals
  useEffect(() => {
    if (bootTerminalRef.current) {
      bootTerminalRef.current.scrollTop = bootTerminalRef.current.scrollHeight;
    }
  }, [bootTerminalLogs]);

  useEffect(() => {
    if (consoleTerminalRef.current) {
      consoleTerminalRef.current.scrollTop = consoleTerminalRef.current.scrollHeight;
    }
  }, [consoleLogs]);

  // Spot Fleet Price Engine
  useEffect(() => {
    const timer = setInterval(() => {
      // Fluctuate spot price slightly
      setSpotPrice(prev => {
        const delta = (Math.random() - 0.5) * 0.04;
        const newPrice = Math.max(0.05, Math.min(0.40, Number((prev + delta).toFixed(2))));
        
        // Spot evaluation
        if (newPrice > maxBid && spotCountdown === null) {
          // Trigger reclaim warning!
          setSpotCountdown(120);
          setSpotLogs(l => [
            ...l,
            `⚠️ WARNING: Spot Market Price ($${newPrice}) exceeded Max Bid ($${maxBid}).`,
            `⚠️ AWS issued 2-minute interruption notice. Preparing instance termination.`,
          ]);
        } else if (newPrice <= maxBid && spotCountdown !== null) {
          // Recovered? Spot fleet can keep if price drops back down before countdown ends
          setSpotCountdown(null);
          setSpotLogs(l => [
            ...l,
            `✅ Spot Market Price ($${newPrice}) recovered below Max Bid ($${maxBid}). Interruption cancelled.`,
          ]);
        }
        return newPrice;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [maxBid, spotCountdown]);

  // Countdown timer
  useEffect(() => {
    if (spotCountdown === null) return;
    if (spotCountdown <= 0) {
      setSpotCountdown(null);
      const replacementText = allocationStrategy === 'lowestPrice' 
        ? 'Spun up replacement t3.medium in pool us-east-1b ($0.12/hr).' 
        : allocationStrategy === 'capacityOptimized'
        ? 'Allocated replacement c6g.large from optimized capacity pool in us-east-1c.'
        : 'Spun up replacements across pools us-east-1a and us-east-1b to maintain diversity.';
      
      setSpotLogs(l => [
        ...l,
        `❌ Spot Instance terminated by AWS due to capacity reclaim.`,
        `🔄 Spot Fleet Triggered: Allocation strategy [${allocationStrategy.toUpperCase()}] running.`,
        `🚀 ${replacementText}`,
      ]);
      return;
    }

    const countdownSec = setTimeout(() => {
      setSpotCountdown(prev => (prev ? prev - 10 : null)); // Decrement in 10s steps for visibility
    }, 1000);

    return () => clearTimeout(countdownSec);
  }, [spotCountdown, allocationStrategy]);

  // Bootstrapping Script Simulation Exec
  const executeBootstrapTest = () => {
    if (isBootstrapping) return;
    setIsBootstrapping(true);
    setBootTerminalLogs(['[system] Initializing EC2 Bootloader...', '[system] Fetching metadata token...']);
    
    const lines = BASH_BOOTSTRAPS[selectedBootstrap].split('\n');
    let idx = 0;
    
    const nextLine = () => {
      if (idx >= lines.length) {
        setIsBootstrapping(false);
        setBootTerminalLogs(prev => [...prev, '[system] Bootstrapping Complete. Application ports responsive on Port 80!']);
        return;
      }
      
      // Filter out comments or print them differently
      const currentText = lines[idx];
      if (currentText.trim().length > 0) {
        setBootTerminalLogs(prev => [...prev, `$ ${currentText}`]);
      }
      idx++;
      setTimeout(nextLine, Math.random() * 250 + 100);
    };

    setTimeout(nextLine, 1000);
  };

  // Add rule in Security Group
  const addSgRule = () => {
    const portNum = parseInt(newRulePort);
    if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
      alert('Port must be a valid integer between 1 and 65535');
      return;
    }
    const id = sgRules.length + 1;
    setSgRules(prev => [...prev, { id, type: newRuleType, port: portNum, source: newRuleSource }]);
    setNewRulePort('');
  };

  // Delete rule in SG
  const deleteSgRule = (id: number) => {
    setSgRules(prev => prev.filter(r => r.id !== id));
  };

  // Traffic Handshake Simulator
  const testSecurityTraffic = (sourceNode: string) => {
    if (sendingPacket) return;
    setSendingPacket(sourceNode);
    setFirewallTestResult(null);

    // Compute expected allowance based on SG state
    setTimeout(() => {
      let allowed = false;
      let msg = '';
      
      if (sourceNode === 'internet') {
        // Wants ports 80/443
        const hasWebRule = sgRules.some(r => (r.port === 80 || r.port === 443) && r.source.includes('0.0.0.0/0'));
        if (hasWebRule) {
          allowed = true;
          msg = 'SUCCESS: Port open to 0.0.0.0/0. Web server response code 200 OK.';
        } else {
          allowed = false;
          msg = 'TIMEOUT: Inbound Security Group drops the packet. Browser gets connection refused.';
        }
      } else if (sourceNode === 'bastion') {
        // Wants Port 22
        const hasSshRule = sgRules.some(r => r.port === 22 && (r.source.includes('10.0.1.50') || r.source.includes('0.0.0.0/0')));
        if (hasSshRule) {
          allowed = true;
          msg = 'SUCCESS: Authorized Bastion IP verified on port 22. SSH terminal shell established.';
        } else {
          allowed = false;
          msg = 'BLOCKED: Port 22 denied from Bastion Host security policies.';
        }
      } else if (sourceNode === 'corp_app') {
        // Wants Port 8080 or custom port
        const hasCustomRule = sgRules.some(r => r.port === 8080 && (r.source.includes('0.0.0.0/0') || r.source.includes('Corporate') || r.source.includes('10.0.1')));
        if (hasCustomRule) {
          allowed = true;
          msg = 'SUCCESS: Corporate application proxy connected successfully on port 8080.';
        } else {
          allowed = false;
          msg = 'BLOCKED: Private intranet TCP connection blocked. No rule matches corporate subnets.';
        }
      } else if (sourceNode === 'hacker') {
        // Wants Port 22 or internal custom ports
        const hasHackerSsh = sgRules.some(r => r.port === 22 && r.source.includes('0.0.0.0/0'));
        if (hasHackerSsh) {
          allowed = true;
          msg = '⚠️ BREACH: SSH port 22 is open globally (0.0.0.0/0). Brute-force credentials attempts active!';
        } else {
          allowed = false;
          msg = 'SECURE: Port 22 closed to anonymous public sources. Brute-force packet dropped by stateful rules.';
        }
      }

      setFirewallTestResult({ status: allowed ? 'ALLOW' : 'DROP', msg });
      setSendingPacket(null);
    }, 2000);
  };

  // Virtual EC2 Console Handlers
  const handleConsoleLaunch = () => {
    if (vmState !== 'Stopped' && vmState !== 'Terminated') return;
    setVmState('Pending');
    setConsoleLogs(l => [...l, `[system] launching instance (${consoleInstanceType}) via AMI image-ami-amazon-linux2...`]);
    
    setTimeout(() => {
      setVmState('Running');
      setConsoleLogs(l => [
        ...l,
        `[system] Instance state transitioned: RUNNING.`,
        `[system] Public IPv4 Assigned: 54.210.12.87, Private IPv4: 172.31.42.10`,
        `[system] Network initialized. Checking attached storage volumes...`,
        consoleStorageType === 'ebs' 
          ? `[storage] EBS Volume mounted on /dev/xvda (Persistent. DeleteOnTermination: ${deleteEbsOnTerm.toString()})`
          : consoleStorageType === 'ephemeral'
          ? `[storage] Ephemeral Instance Store SSD mounted on /dev/nvme0n1 (Direct high-speed local store)`
          : `[storage] Dual mount: EBS (/dev/xvda) + NVMe Instance Store (/dev/nvme0n1)`,
        consolePurchaseModel === 'spot' ? `[billing] Spot instance active ($0.04/hr). Target max price bounds validated.` : `[billing] Standard On-Demand instance active ($0.12/hr).`,
      ]);
      setConsoleCpuGauge(2);
    }, 2000);
  };

  const handleConsoleUserData = () => {
    if (vmState !== 'Running') return;
    setVmUserDataTested(true);
    setConsoleLogs(l => [...l, `[console] Triggering User Data script execution...`]);
    let idx = 0;
    const miniLogs = [
      'yum update -y complete',
      'systemctl start nginx',
      'EC2 Metadatas injected: Web server responding locally on port 80.'
    ];
    
    const printLine = () => {
      if (idx >= miniLogs.length) {
        setConsoleLogs(l => [...l, `[app] Bootstrapped homepage rendered perfectly. Application online.`]);
        return;
      }
      setConsoleLogs(l => [...l, `[user-data] ${miniLogs[idx]}`]);
      idx++;
      setTimeout(printLine, 600);
    };
    setTimeout(printLine, 500);
  };

  const handleConsoleLoad = () => {
    if (vmState !== 'Running') return;
    setIsConsoleSimulatingCpu(true);
    setConsoleLogs(l => [...l, `[traffic] Spiking CPU compute threads (1000 simulated parallel requests)...`]);
    setConsoleCpuGauge(89);

    setTimeout(() => {
      setIsConsoleSimulatingCpu(false);
      setConsoleCpuGauge(14);
      setConsoleLogs(l => [...l, `[traffic] High concurrency load settled. CPU usage returned to baseline.`]);
    }, 3000);
  };

  const handleConsoleStop = () => {
    if (vmState !== 'Running') return;
    setVmState('Stopping');
    setConsoleCpuGauge(0);
    setConsoleLogs(l => [...l, `[system] Initiating shutdown call. Sending SIGTERM to processes...`]);

    setTimeout(() => {
      setVmState('Stopped');
      setConsoleLogs(l => [
        ...l,
        `[system] Instance state transitioned: STOPPED. Billing paused.`,
        consoleStorageType === 'ephemeral' || consoleStorageType === 'both'
          ? `⚠️ DATA LOSS WARNING: Ephemeral Instance Store NVMe (/dev/nvme0n1) was fully wiped/formatted by AWS hypervisor on stop!`
          : `[storage] EBS Volume data safely preserved. Root disks intact.`,
      ]);
    }, 2000);
  };

  const handleConsoleTerminate = () => {
    if (vmState !== 'Running' && vmState !== 'Stopped') return;
    setVmState('Stopping');
    setConsoleCpuGauge(0);
    setConsoleLogs(l => [...l, `[system] Initiating termination pipeline. De-allocating hypervisor resources...`]);

    setTimeout(() => {
      setVmState('Terminated');
      setConsoleLogs(l => [
        ...l,
        `[system] Instance state transitioned: TERMINATED.`,
        deleteEbsOnTerm 
          ? `[storage] EBS Volume (/dev/xvda) completely deleted as per 'Delete on Termination = true' flag.`
          : `[storage] EBS Volume (/dev/xvda) retained! Detached and preserved in AWS console for snapshotting.`,
        consoleStorageType === 'ephemeral' || consoleStorageType === 'both'
          ? `[storage] NVMe physical hardware wiped and released back to standard AWS pool.`
          : '',
        `[system] Virtual host destroyed. VM de-allocated. Ready to launch again.`,
      ]);
      setVmUserDataTested(false);
    }, 2000);
  };

  // Helper cost math
  const getEbsPricing = () => {
    let rate = 0;
    if (ebsVolumeType === 'gp3') rate = ebsSize * 0.08 + (ebsIops > 3000 ? (ebsIops - 3000) * 0.005 : 0);
    else if (ebsVolumeType === 'io2') rate = ebsSize * 0.125 + ebsIops * 0.065;
    else if (ebsVolumeType === 'st1') rate = ebsSize * 0.045;
    else if (ebsVolumeType === 'sc1') rate = ebsSize * 0.015;
    return rate.toFixed(2);
  };

  const getEfsPricing = (useLifecycle: boolean) => {
    const activeSize = useLifecycle ? efsSize * (100 - efsInactiveRatio) / 100 : efsSize;
    const inactiveSize = useLifecycle ? efsSize * efsInactiveRatio / 100 : 0;
    
    const storageCost = (activeSize * 0.30) + (inactiveSize * 0.025);
    const throughputCost = efsThroughput === 'provisioned' ? efsProvisionedMb * 6.00 : 0;
    
    return (storageCost + throughputCost).toFixed(2);
  };

  return (
    <div style={{ fontSize: '13.5px' }}>
      <style>{`
        .ec2-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-tertiary, #e2e8f0); padding-bottom: 10px; }
        .ec2-tb { padding: 8px 16px; border-radius: var(--border-radius-lg, 12px); border: 1.5px solid var(--color-border-secondary, #cbd5e1); font-size: 12px; cursor: pointer; background: rgba(255, 255, 255, 0.6); color: var(--color-text-secondary, #475569); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); outline: none; font-weight: 500; }
        .ec2-tb:hover { background: rgba(241, 245, 249, 0.8); color: var(--color-text-primary, #1e293b); transform: translateY(-1px); }
        .ec2-tb.ec2-on { background: #0284c7; color: #fff; border-color: #0284c7; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.2), 0 2px 4px -2px rgba(2, 132, 199, 0.2); }
        .ec2-card { border: 1.5px solid rgba(226, 232, 240, 0.8); border-radius: var(--border-radius-lg, 12px); padding: 18px 20px; background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.03), 0 4px 6px -4px rgba(0, 0, 0, 0.03), inset 0 1px 0 0 rgba(255, 255, 255, 0.6); margin-bottom: 16px; font-size: 13px; line-height: 1.5; color: #1e293b; }
        .ec2-sec { font-size: 12.5px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: .05em; margin: 20px 0 10px; }
        .ec2-sec:first-child { margin-top: 0; }
        .ec2-g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .ec2-g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .ec2-kv { display: flex; gap: 8px; font-size: 13px; margin: 6px 0; align-items: baseline; }
        .ec2-kk { min-width: 160px; color: #475569; flex-shrink: 0; font-weight: 500; }
        .ec2-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
        .ec2-btn { font-size: 12.5px; padding: 6px 14px; border-radius: 8px; border: 1.5px solid var(--color-border-secondary, #cbd5e1); background: rgba(255, 255, 255, 0.8); color: #1e293b; cursor: pointer; transition: all 0.2s; outline: none; font-weight: 500; }
        .ec2-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-1px); }
        .ec2-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .ec2-btn.ec2-on { background: #0284c7; color: #fff; border-color: #0284c7; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.15); }
        .ec2-terminal { background: #0a0d16; color: #38bdf8; font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 11.5px; padding: 14px; border-radius: 10px; border: 1px solid #1e293b; box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.3); max-height: 220px; overflow-y: auto; white-space: pre-wrap; line-height: 1.5; }
        .ec2-svg-bg { background-color: #fafbfd; background-image: radial-gradient(#e2e8f0 1.2px, transparent 1.2px); background-size: 16px 16px; border-radius: 8px; border: 1.5px solid rgba(226, 232, 240, 0.8); box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02); }
        
        /* Unified Dropdown Selection Visual Cues */
        .ec2-card select {
          border: 1.5px solid #e2e8f0 !important;
          border-radius: 8px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.85);
          color: #1e293b;
          font-weight: 500;
          outline: none;
          transition: all 0.2s;
        }
        .ec2-card select:focus {
          border-color: #f59e0b !important;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15) !important;
        }
        .ec2-card select.ec2-highlight {
          border: 1.5px solid #f59e0b !important;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1) !important;
        }
        .ec2-card input[type="text"] {
          border: 1.5px solid #cbd5e1;
          border-radius: 8px;
          padding: 6px 10px;
          background: rgba(255, 255, 255, 0.85);
          color: #1e293b;
          outline: none;
          transition: all 0.2s;
        }
        .ec2-card input[type="text"]:focus {
          border-color: #0284c7;
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
        }
        .ec2-card input[type="range"] {
          accent-color: #0284c7;
          background: #cbd5e1;
          height: 6px;
          border-radius: 3px;
        }

        /* Premium Flowing Conduit animations */
        .ec2-flow-blue { stroke: #3b82f6; stroke-dasharray: 8, 4; animation: ec2Flow 25s linear infinite; }
        .ec2-flow-orange { stroke: #ea580c; stroke-dasharray: 8, 4; animation: ec2Flow 20s linear infinite; }
        .ec2-flow-green { stroke: #10b981; stroke-dasharray: 8, 4; animation: ec2Flow 22s linear infinite; }
        .ec2-flow-purple { stroke: #8b5cf6; stroke-dasharray: 8, 4; animation: ec2Flow 24s linear infinite; }
        .ec2-flow-red { stroke: #ef4444; stroke-dasharray: 8, 4; animation: ec2Flow 18s linear infinite; }

        @keyframes ec2Flow {
          from { stroke-dashoffset: 360; }
          to { stroke-dashoffset: 0; }
        }

        .ec2-pulse-active {
          animation: ec2Pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes ec2Pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .4; }
        }
        
        .ec2-card-interactive {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .ec2-card-interactive:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px -8px rgba(0, 0, 0, 0.08);
          border-color: #0284c7;
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
          box-shadow: 0 12px 20px -8px rgba(79, 70, 229, 0.12);
          border-color: #c7d2fe;
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
          border: none;
          border-bottom: 1px solid #e2e8f0;
          font-size: 10px;
          font-weight: 850;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
          cursor: pointer;
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
          border: none;
          border-left: 3px solid transparent;
          background: #ffffff;
          transition: all 0.15s ease;
          text-align: left;
          cursor: pointer;
        }
        .acad-dir-item-btn:hover {
          background: #f8fafc;
          color: #4f46e5;
          border-left-color: #cbd5e1;
        }
        .acad-dir-item-btn.acad-active {
          background: #eef2ff;
          color: #4338ca;
          border-left-color: #4f46e5;
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
          border-left: 4px solid #4f46e5;
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

        /* Academy Grid Layouts */
        .acad-grid-12 {
          display: grid;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          gap: 24px;
        }
        .acad-col-3 {
          grid-column: span 3 / span 3;
        }
        .acad-col-9 {
          grid-column: span 9 / span 9;
        }
        @media (max-width: 1024px) {
          .acad-grid-12 {
            display: flex;
            flex-direction: column;
          }
          .acad-col-3, .acad-col-9 {
            width: 100%;
          }
        }

        /* Centralized Dark Mode Overrides for EC2Visualizer.tsx */
        .dark .ec2-container {
          background: #020617 !important;
          color: #f8fafc !important;
        }
        .dark .ec2-card,
        .dark [class*="ec2-card"] {
          background: rgba(15, 23, 42, 0.75) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }
        .dark .ec2-card b,
        .dark .ec2-card strong,
        .dark .ec2-card h3,
        .dark .ec2-card h4 {
          color: #ffffff !important;
        }
        .dark .ec2-tabs {
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .ec2-tb {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #94a3b8 !important;
        }
        .dark .ec2-tb:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #f8fafc !important;
        }
        .dark .ec2-sec,
        .dark .ec2-kk {
          color: #94a3b8 !important;
        }
        .dark .ec2-log,
        .dark .ec2-terminal {
          background: #020617 !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #38bdf8 !important;
        }
        .dark .ec2-btn {
          background: rgba(15, 23, 42, 0.8) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .ec2-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
        }
        .dark .ec2-met {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark ul.ec2-ck li {
          color: #cbd5e1 !important;
        }
        .dark .ec2-inst,
        .dark .ec2-instance {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .ec2-inst .meta,
        .dark .ec2-instance .meta {
          color: #94a3b8 !important;
        }
        .dark .ec2-svg-bg {
          background-color: #020617 !important;
          background-image: radial-gradient(rgba(51, 65, 85, 0.5) 1.2px, transparent 1.2px) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        
        /* Node Status Overrides */
        .dark .ec2-ok {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: #4ade80 !important;
        }
        .dark .ec2-warm {
          border-color: #f59e0b !important;
          background: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
        }
        .dark .ec2-drain {
          border-color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }
        .dark .ec2-down {
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

      {/* Header */}
      <div style={{ padding: '14px 16px 4px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💻 AWS EC2 — Elastic Compute Cloud · Instances · Security · Storage · Spot Fleets
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Secure, rescalable virtual servers in the cloud — learn bootstrapping, security groups, spot instances, EBS, EFS lifecycles, and direct state machine consoles interactively.
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="ec2-tabs">
          <button className={`ec2-tb ${activeTab === 'notebook' ? 'ec2-on' : ''}`} onClick={() => setActiveTab('notebook')}>📓 Visual Architect Notes</button>
          <button className={`ec2-tb ${activeTab === 'overview' ? 'ec2-on' : ''}`} onClick={() => setActiveTab('overview')}>💻 Core &amp; Bootstrap</button>
          <button className={`ec2-tb ${activeTab === 'security' ? 'ec2-on' : ''}`} onClick={() => setActiveTab('security')}>🛡️ Security Groups &amp; Network</button>
          <button className={`ec2-tb ${activeTab === 'purchasing' ? 'ec2-on' : ''}`} onClick={() => setActiveTab('purchasing')}>💰 Spot &amp; Purchasing</button>
          <button className={`ec2-tb ${activeTab === 'storage' ? 'ec2-on' : ''}`} onClick={() => setActiveTab('storage')}>💾 Storage: EBS vs EFS</button>
          <button className={`ec2-tb ${activeTab === 'lifecycle' ? 'ec2-on' : ''}`} onClick={() => setActiveTab('lifecycle')}>🎮 Virtual Console</button>
          <button className={`ec2-tb ${activeTab === 'best' ? 'ec2-on' : ''}`} onClick={() => setActiveTab('best')}>🏗️ Architecture &amp; Audit</button>
        </div>
      </div>

      {/* Content Panels */}
      <div style={{ padding: '0 16px' }}>

        {/* VISUAL ARCHITECT ACADEMY NOTEBOOK PANEL */}
        {activeTab === 'notebook' && (() => {
          const imdsCodeSnippet = `# Request 60-second metadata token (IMDSv2)
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60")

# Read local instance IP using the token
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4`;

          const sgCodeSnippet = `# Authorize SSH access (port 22) restricted to Bastion proxy IP
aws ec2 authorize-security-group-ingress \\
  --group-id sg-0851f98d301c \\
  --protocol tcp \\
  --port 22 \\
  --cidr 10.0.1.50/32

# Authorize Inbound HTTP (port 80) to all public traffic
aws ec2 authorize-security-group-ingress \\
  --group-id sg-0851f98d301c \\
  --protocol tcp \\
  --port 80 \\
  --cidr 0.0.0.0/0`;

          const spotCodeSnippet = `# Request Spot Fleet using lowest-price allocation strategy
aws ec2 request-spot-instances \\
  --spot-price-limit "0.05" \\
  --instance-count 3 \\
  --type "persistent" \\
  --launch-specification file://spot-spec.json`;

          const mountCodeSnippet = `# Format attached EBS block device volume (/dev/xvdf) as ext4
sudo mkfs -t ext4 /dev/xvdf

# Mount the volume to the local application directory
sudo mount /dev/xvdf /var/www/html`;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left', animation: 'fadeIn 0.3s ease-in-out' }}>
              
              <div className="card text-left">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
                  <BookOpen className="w-5 h-5 text-indigo-600" /> EC2 Compute &amp; Storage Notes
                </h2>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-sans font-semibold">
                  This guide outlines EC2 instance types, purchasing strategies (On-Demand, Spot, Reserved), EBS block storage mapping, stateful security groups, and burstable CPU credit behaviors.
                </p>
              </div>

              {/* Grid Layout */}
              <div className="acad-grid-12">
                
                {/* Left Sidebar Menu */}
                <div className="acad-col-3">
                  <div className="acad-dir-container">
                    <div className="acad-dir-header">
                      <BookOpen style={{ width: '16px', height: '16px', color: '#bae6fd' }} />
                      <span>Module Index</span>
                    </div>

                    {/* Category 1: EC2 Fundamentals */}
                    <div>
                      <button
                        className="acad-dir-folder-btn"
                        onClick={() => setExpandedCategory(expandedCategory === 'ec2_fundamentals' ? '' : 'ec2_fundamentals')}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sliders style={{ width: '14px', height: '14px', color: '#0284c7' }} />
                          1. EC2 Fundamentals
                        </span>
                        {expandedCategory === 'ec2_fundamentals' ? <ChevronDown style={{ width: '14px', height: '14px' }} /> : <ChevronRight style={{ width: '14px', height: '14px' }} />}
                      </button>
                      {expandedCategory === 'ec2_fundamentals' && (
                        <div style={{ background: '#f8fafc', padding: '4px 0' }}>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'ec2_bootstrap' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('ec2_bootstrap')}
                          >
                            User Data &amp; IMDSv2
                          </button>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'security_groups' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('security_groups')}
                          >
                            Stateful Security Groups
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Category 2: Purchasing Options */}
                    <div>
                      <button
                        className="acad-dir-folder-btn"
                        onClick={() => setExpandedCategory(expandedCategory === 'purchasing_options' ? '' : 'purchasing_options')}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Globe style={{ width: '14px', height: '14px', color: '#0284c7' }} />
                          2. Purchasing Options
                        </span>
                        {expandedCategory === 'purchasing_options' ? <ChevronDown style={{ width: '14px', height: '14px' }} /> : <ChevronRight style={{ width: '14px', height: '14px' }} />}
                      </button>
                      {expandedCategory === 'purchasing_options' && (
                        <div style={{ background: '#f8fafc', padding: '4px 0' }}>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'purchasing_models' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('purchasing_models')}
                          >
                            Pricing &amp; Spot Fleets
                          </button>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'burstable_performance' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('burstable_performance')}
                          >
                            Burstable CPU Credits
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Category 3: Storage & Auditing */}
                    <div>
                      <button
                        className="acad-dir-folder-btn"
                        onClick={() => setExpandedCategory(expandedCategory === 'storage_audit' ? '' : 'storage_audit')}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Network style={{ width: '14px', height: '14px', color: '#0284c7' }} />
                          3. Storage &amp; Auditing
                        </span>
                        {expandedCategory === 'storage_audit' ? <ChevronDown style={{ width: '14px', height: '14px' }} /> : <ChevronRight style={{ width: '14px', height: '14px' }} />}
                      </button>
                      {expandedCategory === 'storage_audit' && (
                        <div style={{ background: '#f8fafc', padding: '4px 0' }}>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'storage_comparison' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('storage_comparison')}
                          >
                            EBS vs Instance Store vs EFS
                          </button>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'best_practices' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('best_practices')}
                          >
                            HA Architecture &amp; Audit
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                  <div style={{ background: '#0a0d16', borderRadius: '16px', padding: '16px', color: '#94a3b8', fontSize: '11px', marginTop: '16px', border: '1px solid #1e293b', lineHeight: '1.5' }}>
                    <span style={{ color: '#ffffff', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '11.5px' }}>
                      <Info style={{ width: '14px', height: '14px', color: '#38bdf8' }} /> Academy Guidance
                    </span>
                    You can switch directly to target interactive simulations inside standard visualizer tabs using the action buttons in each note.
                  </div>
                </div>

                {/* Right Content Panel */}
                <div className="acad-col-9">

                  {/* NOTE 1: User Data & IMDSv2 */}
                  {selectedNote === 'ec2_bootstrap' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>EC2 Bootstrapping &amp; Instance Metadata</h3>
                        <span className="acad-hero-badge">Core Compute</span>
                      </div>
                      
                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                        Instance initialization relies on User Data scripts and configuration blueprints. Understanding the sequence of system execution and retrieval of dynamic runtime values secures virtual hosts.
                      </p>

                      <div className="acad-takeaway-box" style={{ margin: '18px 0' }}>
                        <strong>💡 Key Takeaways:</strong>
                        <ul style={{ margin: '6px 0 0', paddingLeft: '16px', listStyleType: 'square' }}>
                          <li><strong>User Data:</strong> Shell scripts executed **exactly once** during the very first boot of the instance as the <code>root</code> user. Used to install patches, start servers, and mount drives.</li>
                          <li><strong>Golden Image:</strong> Pre-configuring system packages and baking them into a custom **Amazon Machine Image (AMI)** avoids bootstrapping startup delays during scaling events.</li>
                          <li><strong>IMDSv2 Endpoint:</strong> Non-routable local IP <code>169.254.169.254</code> serving metadata. Enforces a session-based token (PUT request) to block SSRF proxy attacks.</li>
                        </ul>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>CLI Command Reference: Requesting IMDSv2 Token</h4>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>imds_fetch.sh</span>
                          <button
                            onClick={() => handleCopyCode(imdsCodeSnippet, 'imds_sh')}
                            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}
                          >
                            <Copy style={{ width: '12px', height: '12px' }} />
                            {copiedNoteId === 'imds_sh' ? 'Copied!' : 'Copy Script'}
                          </button>
                        </div>
                        <div className="acad-terminal">
                          <pre style={{ margin: 0, fontSize: '10.5px', color: '#cbd5e1', overflowX: 'auto' }}>
                            <code>{imdsCodeSnippet}</code>
                          </pre>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                          className="ec2-btn ec2-on"
                          onClick={() => setActiveTab('overview')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap style={{ width: '14px', height: '14px' }} />
                          Core &amp; Bootstrap Simulator Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 2: Stateful Security Groups */}
                  {selectedNote === 'security_groups' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Stateful Security Groups vs Stateless NACLs</h3>
                        <span className="acad-hero-badge">Network Security</span>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                        Security Groups acts as virtual firewalls directly on the EC2 Elastic Network Interface (ENI) layer, monitoring state connections to simplify security rules.
                      </p>

                      <div className="acad-takeaway-box" style={{ margin: '18px 0' }}>
                        <strong>🛡️ Stateful vs Stateless Mechanics:</strong>
                        <ul style={{ margin: '6px 0 0', paddingLeft: '16px', listStyleType: 'circle' }}>
                          <li><strong>Stateful (Security Groups):</strong> If you authorize an inbound rule (e.g. port 80), return traffic is **automatically allowed** outbound. It evaluates *allow* rules only (default drops everything else).</li>
                          <li><strong>Stateless (Network ACLs):</strong> Evaluates traffic entering and leaving VPC subnets. You must explicitly configure both inbound and outbound rules, including ephemeral port ranges (e.g., 1024-65535). Supports both *allow* and *deny* rules.</li>
                        </ul>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>AWS CLI: Authorizing Security Group Inbound Rules</h4>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>security_rules.sh</span>
                          <button
                            onClick={() => handleCopyCode(sgCodeSnippet, 'sg_sh')}
                            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}
                          >
                            <Copy style={{ width: '12px', height: '12px' }} />
                            {copiedNoteId === 'sg_sh' ? 'Copied!' : 'Copy Commands'}
                          </button>
                        </div>
                        <div className="acad-terminal">
                          <pre style={{ margin: 0, fontSize: '10.5px', color: '#cbd5e1', overflowX: 'auto' }}>
                            <code>{sgCodeSnippet}</code>
                          </pre>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                          className="ec2-btn ec2-on"
                          onClick={() => setActiveTab('security')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap style={{ width: '14px', height: '14px' }} />
                          Security Groups Simulator Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 3: Pricing & Spot Fleets */}
                  {selectedNote === 'purchasing_models' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>EC2 Purchasing Models &amp; Spot Fleets</h3>
                        <span className="acad-hero-badge">Cost Optimization</span>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                        AWS offers diverse billing options tailored for specific workload lifecycle requirements. Aligning compute demands to the correct purchasing strategy optimizes costs.
                      </p>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>Billing Framework Comparison</h4>
                      <div style={{ overflowX: 'auto', margin: '12px 0 20px' }}>
                        <table className="acad-table">
                          <thead>
                            <tr>
                              <th>Purchase Model</th>
                              <th>Discount Rate</th>
                              <th>Commitment Requirement</th>
                              <th>Best Match Workload</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><strong>On-Demand</strong></td>
                              <td>0% (Standard)</td>
                              <td>None (Billed per second)</td>
                              <td>Unpredictable spikes, short-term devs</td>
                            </tr>
                            <tr>
                              <td><strong>Reserved Instances (RI)</strong></td>
                              <td>Up to 72%</td>
                              <td>1 or 3 years (Specific instances)</td>
                              <td>Steady-state, constant database hosts</td>
                            </tr>
                            <tr>
                              <td><strong>Savings Plans</strong></td>
                              <td>Up to 72%</td>
                              <td>1 or 3 years ($ / hour spend)</td>
                              <td>Dynamic microservices, Lambda + Fargate fleets</td>
                            </tr>
                            <tr>
                              <td><strong>Spot Instances</strong></td>
                              <td>Up to 90%</td>
                              <td>None (Subject to termination)</td>
                              <td>Batch processing, stateless web tiers, CI/CD</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="acad-takeaway-box" style={{ margin: '18px 0' }}>
                        <strong>⚠️ Spot Reclaim Warning:</strong> AWS can reclaim Spot capacity at any time when On-Demand demand rises. Route 53 or the Auto-Scaling Group receives a **2-minute warning notification** before shutdown. Spot Fleets manage allocations across instance pools to automatically replace reclaimed instances.
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>AWS CLI: Requesting Spot Instances</h4>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>spot_request.sh</span>
                          <button
                            onClick={() => handleCopyCode(spotCodeSnippet, 'spot_sh')}
                            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}
                          >
                            <Copy style={{ width: '12px', height: '12px' }} />
                            {copiedNoteId === 'spot_sh' ? 'Copied!' : 'Copy Command'}
                          </button>
                        </div>
                        <div className="acad-terminal">
                          <pre style={{ margin: 0, fontSize: '10.5px', color: '#cbd5e1', overflowX: 'auto' }}>
                            <code>{spotCodeSnippet}</code>
                          </pre>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                          className="ec2-btn ec2-on"
                          onClick={() => setActiveTab('purchasing')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap style={{ width: '14px', height: '14px' }} />
                          Spot &amp; Purchasing Simulator Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 4: Burstable CPU Credits */}
                  {selectedNote === 'burstable_performance' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Burstable CPU Credits &amp; Performance Limits</h3>
                        <span className="acad-hero-badge">Instance Specs</span>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                        T-series burstable performance instances (t3, t3a, t4g) provide a baseline CPU capacity with the ability to burst above it. They accumulate "CPU credits" when running below baseline and burn them during CPU spikes.
                      </p>

                      <div className="acad-takeaway-box" style={{ margin: '18px 0' }}>
                        <strong>⚡ Standard vs Unlimited Mode:</strong>
                        <ul style={{ margin: '6px 0 0', paddingLeft: '16px', listStyleType: 'square' }}>
                          <li><strong>Standard Mode:</strong> If you burn through all accumulated credits, AWS throttles the instance CPU directly down to the baseline limit. Excellent for development environments.</li>
                          <li><strong>Unlimited Mode:</strong> Allows the instance to burst indefinitely above baseline. If the credit bucket exhausts, AWS charges extra billing rates per vCPU-hour. Highly recommended for production workloads.</li>
                        </ul>
                      </div>

                      {/* Interactive Widget: Credit Accumulator Simulator */}
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', margin: '20px 0' }}>
                        <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 12px' }}>
                          📈 Burstable CPU Credit Simulator
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 200px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>
                                Select Burstable Instance Type:
                              </label>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                {(['nano', 'micro', 'small'] as const).map((size) => (
                                  <button
                                    key={size}
                                    onClick={() => setNbInstanceSize(size)}
                                    className={`ec2-btn ${nbInstanceSize === size ? 'ec2-on' : ''}`}
                                    style={{ padding: '6px 12px', fontSize: '11px', textTransform: 'capitalize' }}
                                  >
                                    t3.{size}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div style={{ flex: '1 1 200px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span>Simulated Average CPU load:</span>
                                <span style={{ color: '#0284c7' }}>{nbCpuUtilization}%</span>
                              </label>
                              <input
                                type="range"
                                min="1"
                                max="100"
                                value={nbCpuUtilization}
                                onChange={(e) => setNbCpuUtilization(parseInt(e.target.value))}
                                style={{ width: '100%' }}
                              />
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                              onClick={runCpuCreditCycleSim}
                              className="ec2-btn ec2-on"
                              style={{ padding: '8px 18px', fontSize: '11.5px' }}
                            >
                              ⚡ Run 24-Hour Credit Simulation
                            </button>
                          </div>

                          <div className="acad-terminal" style={{ maxHeight: '150px' }}>
                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>burstable-performance-telemetry logs</span>
                            {nbCreditLog.length === 0 ? (
                              <div style={{ fontSize: '11.5px', color: '#64748b', fontStyle: 'italic', padding: '16px 0', textAlign: 'center' }}>
                                Click the button above to simulate how the credit bucket behaves over a 24-hour cycle.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '10.5px' }}>
                                {nbCreditLog.map((log, index) => (
                                  <div
                                    key={index}
                                    style={{
                                      color: index === 0 ? '#34d399' : log.includes('🚨') ? '#f87171' : log.includes('📈') ? '#10b981' : '#cbd5e1',
                                      fontWeight: index === 0 ? 'bold' : 'normal',
                                      borderBottom: index === 0 ? '1px solid #1e293b' : 'none',
                                      paddingBottom: index === 0 ? '6px' : '0',
                                      marginBottom: index === 0 ? '6px' : '0'
                                    }}
                                  >
                                    {log}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                          className="ec2-btn ec2-on"
                          onClick={() => setActiveTab('lifecycle')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap style={{ width: '14px', height: '14px' }} />
                          Virtual Console Simulator Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 5: EBS vs Instance Store vs EFS */}
                  {selectedNote === 'storage_comparison' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>EBS vs Instance Store vs EFS</h3>
                        <span className="acad-hero-badge">Instance Storage</span>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                        AWS hosts support multiple persistent and ephemeral disk mounts, matching IOPS and file system capabilities to access requirements.
                      </p>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>Storage Category comparison</h4>
                      <div style={{ overflowX: 'auto', margin: '12px 0 20px' }}>
                        <table className="acad-table">
                          <thead>
                            <tr>
                              <th>Feature / Metric</th>
                              <th>EBS (Elastic Block Store)</th>
                              <th>Instance Store (SSD)</th>
                              <th>EFS (Elastic File System)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><strong>Type</strong></td>
                              <td>Network Block device (SAN)</td>
                              <td>Direct physical SSD attach</td>
                              <td>Network File System (NFS)</td>
                            </tr>
                              <tr>
                              <td><strong>Persistence</strong></td>
                              <td>✅ Persistent (Survives VM stops/terminations)</td>
                              <td>❌ Ephemeral (Data wiped on instance stop)</td>
                              <td>✅ Persistent (Survives VM terminations)</td>
                            </tr>
                            <tr>
                              <td><strong>Throughput</strong></td>
                              <td>Up to 10,000 MB/s (io2 Block Express)</td>
                              <td>Ultra-high low-latency local IOPS</td>
                              <td>Elastic scaling up to GBs/second</td>
                            </tr>
                            <tr>
                              <td><strong>Shared Access</strong></td>
                              <td>❌ Single VM mount (except EBS Multi-Attach)</td>
                              <td>❌ Restricted to a single physical VM host</td>
                              <td>✅ Multi-mount (thousands of EC2s concurrently)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="acad-takeaway-box" style={{ margin: '18px 0' }}>
                        <strong>⚠️ Stop / Termination Data Loss warning:</strong>
                        <ul style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
                          <li><strong>Instance Store:</strong> Stopping an instance releases the underlying hypervisor hardware, formatting local SSD drives. Data is **permanently lost** on instance stops!</li>
                          <li><strong>Delete On Termination:</strong> EBS volumes default to `DeleteOnTermination = true` for root disks. Always flag critical volumes to `false` to prevent accidental deletion during VM teardown.</li>
                        </ul>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>Bash Command: Formatting and Mounting attached EBS volume</h4>
                      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>ebs_mount.sh</span>
                          <button
                            onClick={() => handleCopyCode(mountCodeSnippet, 'mount_sh')}
                            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}
                          >
                            <Copy style={{ width: '12px', height: '12px' }} />
                            {copiedNoteId === 'mount_sh' ? 'Copied!' : 'Copy Script'}
                          </button>
                        </div>
                        <div className="acad-terminal">
                          <pre style={{ margin: 0, fontSize: '10.5px', color: '#cbd5e1', overflowX: 'auto' }}>
                            <code>{mountCodeSnippet}</code>
                          </pre>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                          className="ec2-btn ec2-on"
                          onClick={() => setActiveTab('storage')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap style={{ width: '14px', height: '14px' }} />
                          Storage: EBS vs EFS Simulator Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 6: HA Architecture & Audit */}
                  {selectedNote === 'best_practices' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>High Availability &amp; Well-Architected Auditing</h3>
                        <span className="acad-hero-badge">Pro Architect</span>
                      </div>

                      <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
                        Designing fault-tolerant, resilient compute configurations requires leveraging specific instance grouping frameworks and well-architected operational policies.
                      </p>

                      <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '20px 0 10px' }}>EC2 Placement Groups</h4>
                      <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '12.5px', color: 'var(--color-text-secondary)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <li><strong>Cluster Placement Groups:</strong> Packs instances close together inside a single Availability Zone. Delivers ultra-low latency and 10 Gbps network bandwidth. Ideal for high-performance computing (HPC).</li>
                        <li><strong>Spread Placement Groups:</strong> Places instances across distinct physical hardware racks (maximum 7 per AZ). Minimizes simultaneous hardware failure risks. Ideal for critical database replicas.</li>
                        <li><strong>Partition Placement Groups:</strong> Divides instances across logical partitions. No two partitions share hardware racks. Ideal for distributed platforms (Hadoop, Cassandra, Kafka).</li>
                      </ul>

                      <div className="acad-takeaway-box" style={{ margin: '18px 0' }}>
                        <strong>🧠 Well-Architected Compute Checklist:</strong>
                        <ul style={{ margin: '6px 0 0', paddingLeft: '16px', listStyleType: 'square' }}>
                          <li><strong>Stateless Web Servers:</strong> Offload all local session storage to DynamoDB or ElastiCache to enable seamless Auto Scaling.</li>
                          <li><strong>Golden Image Pipelines:</strong> Regularly audit base AMIs for security patches and automate baking using EC2 Image Builder.</li>
                          <li><strong>Multi-AZ Deployment:</strong> Always distribute instance fleets across multiple availability zones under a Load Balancer to guarantee 99.99% system availability.</li>
                        </ul>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                          className="ec2-btn ec2-on"
                          onClick={() => setActiveTab('best')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap style={{ width: '14px', height: '14px' }} />
                          Architecture &amp; Audit Simulator Tab
                        </button>
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          );
        })()}

        {/* OVERVIEW PANEL */}
        {activeTab === 'overview' && (
          <div>
            <div className="ec2-sec">EC2 Instance Core Architecture &amp; User Data Bootstrapping</div>
            <div className="ec2-card">
              <div className="ec2-g2">
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>🚀 Bootstrapping User Data Shell</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px', lineHeight: '1.4' }}>
                    User Data consists of system bash commands executed **exactly once** as the `root` user during the very first boot of your EC2 instance. Ideal for package installations, directory security settings, configurations, and application deployment.
                  </div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Select Boot Template Script</label>
                    <select 
                      value={selectedBootstrap} 
                      onChange={(e) => setSelectedBootstrap(e.target.value as any)} 
                      style={{ padding: '6px 10px', fontSize: '12px', width: '100%', borderRadius: '6px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}
                    >
                      <option value="nginx">Install Nginx &amp; Render Instance Metadata HTML</option>
                      <option value="docker">Install Docker Engine &amp; Launch Node app Container</option>
                      <option value="appsec">Hardening SSHD config, file security permissions &amp; Cron Monitoring</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button onClick={executeBootstrapTest} disabled={isBootstrapping} className="ec2-btn ec2-on" style={{ flex: 1, padding: '8px' }}>
                      {isBootstrapping ? '⏳ Executing Shell commands...' : '🚀 Test Bootstrapping Script'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Interactive Bash logs Console Terminal Output</div>
                  <div ref={bootTerminalRef} className="ec2-terminal" style={{ flex: 1, maxHeight: '250px' }}>
                    {bootTerminalLogs.length > 0 ? (
                      bootTerminalLogs.map((log, index) => (
                        <div key={index} style={{ color: log.startsWith('$') ? '#f59e0b' : log.includes('===') ? '#10b981' : '#38bdf8' }}>{log}</div>
                      ))
                    ) : (
                      <div style={{ color: '#64748b' }}>Console idle. Click "Test Bootstrapping Script" to run bash execution pipeline.</div>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', background: 'var(--color-background-secondary)', padding: '12px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>💡 Instance Metadata Service (IMDS) Key Takeaway:</div>
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                  Notice the `curl` calls inside the Nginx script directed to the endpoint `http://169.254.169.254/latest/meta-data/`. This is a non-routable link local address accessible only from within the running instance. **IMDSv2** (illustrated above) enforces a session-oriented token requirement via a `PUT` request header to defend against Server-Side Request Forgery (SSRF) vulnerabilities.
                </div>
              </div>
            </div>

            <div className="ec2-sec">Amazon Machine Image (AMI) Lifecycle &amp; Golden Images</div>
            <div className="ec2-card">
              <div className="ec2-g2">
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>💿 AMI: The Blueprint of Your EC2 VM</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '10px', lineHeight: '1.45' }}>
                    An **Amazon Machine Image (AMI)** is a pre-packaged boot template containing the Operating System (Linux/Windows), custom system packages, specific software components, and default **Block Device Mappings** (volume specifications).
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.45' }}>
                    💡 <b>Golden Image Best Practice:</b> Instead of running long User Data bootstrapping scripts on *every* single EC2 boot (which delays horizontal scaling and exposes scripts to repository timeouts), companies configure a baseline server, install all agents/dependencies, and "bake" a custom **Golden AMI**. Launching identical replicas from this pre-baked image then takes under 30 seconds!
                  </div>
                </div>

                {/* SVG Baking Flow */}
                <div style={{ background: 'rgba(255, 255, 255, 0.4)', padding: '14px', borderRadius: '10px', border: '1.5px solid rgba(226, 232, 240, 0.8)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>AMI Baking &amp; Auto-Scaling Launch Pipeline</div>
                  <svg viewBox="0 0 470 160" width="100%" className="ec2-svg-bg">
                    <defs>
                      <marker id="arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#64748b"/></marker>
                      <linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                      <linearGradient id="pink-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ec4899" />
                        <stop offset="100%" stopColor="#be185d" />
                      </linearGradient>
                      <linearGradient id="orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                      <linearGradient id="green-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#047857" />
                      </linearGradient>
                      <filter id="ec2-shadow-net" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.06" />
                      </filter>
                    </defs>

                    {/* PREMIUM NESTED BOUNDARIES */}
                    {/* Host Configuration Zone */}
                    <rect x="5" y="10" width="105" height="140" rx="8" fill="rgba(37, 99, 235, 0.02)" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="57" y="20" textAnchor="middle" fontSize="6.5" fill="#2563eb" fontWeight="bold">📦 HOST CONFIG</text>

                    {/* Baking & Blueprint Vault */}
                    <rect x="120" y="10" width="220" height="140" rx="8" fill="rgba(234, 88, 12, 0.02)" stroke="#ea580c" strokeWidth="1.2" strokeDasharray="4,2" />
                    <text x="230" y="20" textAnchor="middle" fontSize="6.5" fill="#ea580c" fontWeight="bold">💿 BAKING &amp; BLUEPRINT VAULT</text>

                    {/* Auto-scaling Zone */}
                    <rect x="350" y="10" width="115" height="140" rx="8" fill="rgba(16, 185, 129, 0.02)" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="407" y="20" textAnchor="middle" fontSize="6.5" fill="#047857" fontWeight="bold">🚀 AUTO-SCALING ZONE</text>
                    
                    {/* Paths with animatemotion */}
                    <path id="path1" d="M 95, 75 L 135, 75" className={isBootstrapping ? "ec2-flow-orange" : "ec2-flow-blue"} strokeWidth="2" markerEnd="url(#arrow)" />
                    <path id="path2" d="M 215, 75 L 255, 75" className={isBootstrapping ? "ec2-flow-orange" : "ec2-flow-purple"} strokeWidth="2" markerEnd="url(#arrow)" />
                    <path id="path3" d="M 335, 75 L 365, 45" className={isBootstrapping ? "ec2-flow-orange" : "ec2-flow-green"} strokeWidth="2" markerEnd="url(#arrow)" />
                    <path id="path4" d="M 335, 75 L 365, 105" className={isBootstrapping ? "ec2-flow-orange" : "ec2-flow-green"} strokeWidth="2" markerEnd="url(#arrow)" />

                    {/* Active moving pulses */}
                    <circle r="4" fill={isBootstrapping ? "#f59e0b" : "#3b82f6"}>
                      <animateMotion dur={isBootstrapping ? "1s" : "3s"} repeatCount="indefinite" path="M 95, 75 L 135, 75" />
                    </circle>
                    <circle r="4" fill={isBootstrapping ? "#f59e0b" : "#ec4899"}>
                      <animateMotion dur={isBootstrapping ? "1s" : "3s"} repeatCount="indefinite" path="M 215, 75 L 255, 75" />
                    </circle>
                    <circle r="4" fill={isBootstrapping ? "#f59e0b" : "#10b981"}>
                      <animateMotion dur={isBootstrapping ? "1.2s" : "4s"} repeatCount="indefinite" path="M 335, 75 L 365, 45" />
                    </circle>
                    <circle r="4" fill={isBootstrapping ? "#f59e0b" : "#10b981"}>
                      <animateMotion dur={isBootstrapping ? "1.2s" : "4s"} repeatCount="indefinite" path="M 335, 75 L 365, 105" />
                    </circle>

                    {/* Source EC2 3D Rack */}
                    <g transform="translate(15, 40)" filter="url(#ec2-shadow-net)">
                      <rect x="0" y="0" width="80" height="70" rx="6" fill="#ffffff" stroke="#2563eb" strokeWidth="1.5" />
                      <rect x="5" y="5" width="70" height="15" rx="3" fill="url(#blue-grad)" />
                      <text x="40" y="15" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">Source EC2</text>
                      
                      {/* Rack units */}
                      <rect x="5" y="25" width="70" height="8" rx="1.5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.5" />
                      <circle cx="12" cy="29" r="1.5" fill="#22c55e" />
                      <rect x="20" y="28" width="45" height="2" rx="1" fill="#cbd5e1" />
                      
                      <rect x="5" y="37" width="70" height="8" rx="1.5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.5" />
                      <circle cx="12" cy="41" r="1.5" fill="#22c55e" />
                      <rect x="20" y="40" width="45" height="2" rx="1" fill="#cbd5e1" />

                      <rect x="5" y="49" width="70" height="8" rx="1.5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.5" />
                      <circle cx="12" cy="53" r="1.5" fill="#ef4444" />
                      <rect x="20" y="52" width="45" height="2" rx="1" fill="#cbd5e1" />
                      
                      <text x="40" y="66" textAnchor="middle" fontSize="7" fill="#475569" fontWeight="500">(Configured Host)</text>
                    </g>

                    {/* Snapshot Storage Cylinder */}
                    <g transform="translate(130, 40)" filter="url(#ec2-shadow-net)">
                      <rect x="0" y="0" width="80" height="70" rx="6" fill="#ffffff" stroke="#db2777" strokeWidth="1.5" />
                      <rect x="5" y="5" width="70" height="15" rx="3" fill="url(#pink-grad)" />
                      <text x="40" y="15" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">Snapshot</text>
                      
                      {/* 3D database disk cylinder outline */}
                      <ellipse cx="40" cy="32" rx="20" ry="6" fill="#fdf2f8" stroke="#db2777" strokeWidth="1" />
                      <path d="M20,32 L20,44 A20,6 0 0,0 60,44 L60,32" fill="#fdf2f8" stroke="#db2777" strokeWidth="1" />
                      <path d="M20,44 L20,56 A20,6 0 0,0 60,56 L60,44" fill="#fdf2f8" stroke="#db2777" strokeWidth="1" />
                      
                      <text x="40" y="66" textAnchor="middle" fontSize="7" fill="#475569" fontWeight="500">(Root EBS Copy)</text>
                    </g>

                    {/* Golden AMI (Baked disc) */}
                    <g transform="translate(250, 40)" filter="url(#ec2-shadow-net)">
                      <rect x="0" y="0" width="80" height="70" rx="6" fill="#ffffff" stroke="#ea580c" strokeWidth="1.5" />
                      <rect x="5" y="5" width="70" height="15" rx="3" fill="url(#orange-grad)" />
                      <text x="40" y="15" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">Golden AMI</text>
                      
                      {/* Compact Disc shape */}
                      <circle cx="40" cy="38" r="14" fill="#fff" stroke="#ea580c" strokeWidth="1.5" />
                      <circle cx="40" cy="38" r="4" fill="#fafbfd" stroke="#ea580c" strokeWidth="1" />
                      <path d="M 40,24 A 14,14 0 0, 1 54,38" stroke="#ea580c" strokeWidth="1" strokeDasharray="2,2" fill="none" />
                      
                      <text x="40" y="66" textAnchor="middle" fontSize="7" fill="#475569" fontWeight="500">(Template Image)</text>
                    </g>

                    {/* Replicas (Green Racks) */}
                    {/* Replica 1 */}
                    <g transform="translate(370, 10)" filter="url(#ec2-shadow-net)">
                      <rect x="0" y="0" width="80" height="60" rx="6" fill="#ffffff" stroke="#059669" strokeWidth="1.5" />
                      <rect x="5" y="5" width="70" height="12" rx="3" fill="url(#green-grad)" />
                      <text x="40" y="13" textAnchor="middle" fontSize="7.5" fill="#fff" fontWeight="bold">EC2 Replica 1</text>
                      
                      {/* mini rack lines */}
                      <rect x="10" y="24" width="60" height="4" rx="1" fill="#ecfdf5" stroke="#059669" strokeWidth="0.5" />
                      <rect x="10" y="32" width="60" height="4" rx="1" fill="#ecfdf5" stroke="#059669" strokeWidth="0.5" />
                      
                      <text x="40" y="48" textAnchor="middle" fontSize="7" fill="#047857" fontWeight="bold">Active</text>
                    </g>

                    {/* Replica 2 */}
                    <g transform="translate(370, 85)" filter="url(#ec2-shadow-net)">
                      <rect x="0" y="0" width="80" height="60" rx="6" fill="#ffffff" stroke="#059669" strokeWidth="1.5" />
                      <rect x="5" y="5" width="70" height="12" rx="3" fill="url(#green-grad)" />
                      <text x="40" y="13" textAnchor="middle" fontSize="7.5" fill="#fff" fontWeight="bold">EC2 Replica 2</text>
                      
                      {/* mini rack lines */}
                      <rect x="10" y="24" width="60" height="4" rx="1" fill="#ecfdf5" stroke="#059669" strokeWidth="0.5" />
                      <rect x="10" y="32" width="60" height="4" rx="1" fill="#ecfdf5" stroke="#059669" strokeWidth="0.5" />
                      
                      <text x="40" y="48" textAnchor="middle" fontSize="7" fill="#047857" fontWeight="bold">Active</text>
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            <div className="ec2-sec">EC2 Instance Families Specs Directory</div>
            <div className="ec2-card">
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                Choosing an instance type corresponds directly to the hardware profiles assigned to the hypervisor host. AWS classifies these configurations by family focus. Select a class below:
              </div>

              <div className="ec2-g3" style={{ marginBottom: '14px' }}>
                {Object.keys(INSTANCE_FAMILIES).map((famKey) => (
                  <button 
                    key={famKey} 
                    className={`ec2-btn ${selectedFamily === famKey ? 'ec2-on' : ''}`}
                    onClick={() => setSelectedFamily(famKey)}
                    style={{ padding: '8px', textAlign: 'center', fontSize: '11px' }}
                  >
                    <span style={{ fontSize: '18px', display: 'block', marginBottom: '4px' }}>{INSTANCE_FAMILIES[famKey].icon}</span>
                    {INSTANCE_FAMILIES[famKey].name.split(' ')[0]} Family
                  </button>
                ))}
              </div>

              {selectedFamily && (
                <div style={{ background: 'var(--color-background-secondary)', padding: '16px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border-secondary)', paddingBottom: '8px', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-primary)' }}>
                      <span>{INSTANCE_FAMILIES[selectedFamily].icon}</span>
                      {INSTANCE_FAMILIES[selectedFamily].name}
                    </div>
                    <div className="ec2-badge" style={{ background: '#0284c7', color: '#fff', fontSize: '10px' }}>
                      Prefix Class: {INSTANCE_FAMILIES[selectedFamily].classCode}
                    </div>
                  </div>

                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                    {INSTANCE_FAMILIES[selectedFamily].desc}
                  </div>

                  <div className="ec2-g2">
                    <div>
                      <div className="ec2-kv"><span className="ec2-kk">vCPU Allocation:</span><b>{INSTANCE_FAMILIES[selectedFamily].vcpuRange}</b></div>
                      <div className="ec2-kv"><span className="ec2-kk">System Memory (RAM):</span><b>{INSTANCE_FAMILIES[selectedFamily].ramRange}</b></div>
                      <div className="ec2-kv"><span className="ec2-kk">EBS Volume Speed:</span><b>{INSTANCE_FAMILIES[selectedFamily].ebsBandwidth}</b></div>
                    </div>
                    <div>
                      <div className="ec2-kv"><span className="ec2-kk">Network Performance:</span><b>{INSTANCE_FAMILIES[selectedFamily].networkBandwidth}</b></div>
                      <div className="ec2-kv"><span className="ec2-kk">Production Scenarios:</span><b style={{ color: '#0284c7' }}>{INSTANCE_FAMILIES[selectedFamily].useCase}</b></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECURITY & FIREWALL PANEL */}
        {activeTab === 'security' && (
          <div>
            <div className="ec2-sec">Stateful Security Group Firewall Rules Simulator</div>
            <div className="ec2-card">
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                Security Groups act as virtual, stateful firewalls on the network interface card (NIC) level of your EC2 host. If no inbound traffic rule matches, the packets are **dropped silently** (timeout). Stateful logic means that allowing inbound traffic automatically permits outbound return connections.
              </div>

              <div className="ec2-g2">
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-primary)' }}>🛠️ Inbound Security Group Rules (Active Ingress Rules)</div>
                  <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', marginBottom: '12px' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-background-secondary)', textAlign: 'left', borderBottom: '1px solid var(--color-border-secondary)' }}>
                        <th style={{ padding: '6px' }}>Rule Type</th>
                        <th style={{ padding: '6px' }}>Port</th>
                        <th style={{ padding: '6px' }}>Source CIDR / Reference</th>
                        <th style={{ padding: '6px', textAlign: 'center' }}>Remove</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sgRules.map((rule) => (
                        <tr key={rule.id} style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                          <td style={{ padding: '6px', fontWeight: 600 }}>{rule.type}</td>
                          <td style={{ padding: '6px' }}>{rule.port}</td>
                          <td style={{ padding: '6px', color: '#0284c7' }}>{rule.source}</td>
                          <td style={{ padding: '6px', textAlign: 'center' }}>
                            <button onClick={() => deleteSgRule(rule.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Add rule UI */}
                  <div style={{ display: 'flex', gap: '6px', background: 'var(--color-background-secondary)', padding: '10px', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '9px', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Type</label>
                      <select value={newRuleType} onChange={(e) => {
                        setNewRuleType(e.target.value);
                        if (e.target.value === 'SSH') setNewRulePort('22');
                        else if (e.target.value === 'HTTP') setNewRulePort('80');
                        else if (e.target.value === 'HTTPS') setNewRulePort('443');
                        else if (e.target.value === 'PostgreSQL') setNewRulePort('5432');
                      }} style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                        <option value="Custom TCP">Custom TCP</option>
                        <option value="SSH">SSH (Port 22)</option>
                        <option value="HTTP">HTTP (Port 80)</option>
                        <option value="HTTPS">HTTPS (Port 443)</option>
                        <option value="PostgreSQL">PostgreSQL (Port 5432)</option>
                      </select>
                    </div>

                    <div style={{ width: '60px' }}>
                      <label style={{ fontSize: '9px', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Port</label>
                      <input type="text" value={newRulePort} onChange={(e) => setNewRulePort(e.target.value)} style={{ padding: '4px', fontSize: '11px', width: '100%', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }} />
                    </div>

                    <div style={{ flex: 1.5 }}>
                      <label style={{ fontSize: '9px', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Source IP subnet</label>
                      <select value={newRuleSource} onChange={(e) => setNewRuleSource(e.target.value)} style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                        <option value="0.0.0.0/0">0.0.0.0/0 (Global Public)</option>
                        <option value="10.0.1.50/32">10.0.1.50/32 (VPC Bastion)</option>
                        <option value="Corporate Intranet">192.168.0.0/16 (Corp VPN)</option>
                      </select>
                    </div>

                    <button onClick={addSgRule} className="ec2-btn ec2-on" style={{ alignSelf: 'flex-end', padding: '6px 10px' }}>+</button>
                  </div>
                </div>

                {/* Packet Simulator Panel */}
                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>📡 Network Packet Transference Ingress Playground</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                    Click a source Node to compile a TCP handshake request to the EC2 Host (listening on ports 22, 80, or 8080).
                  </div>

                  <div className="ec2-g2" style={{ gap: '8px', marginBottom: '12px' }}>
                    <button onClick={() => testSecurityTraffic('internet')} disabled={!!sendingPacket} className="ec2-btn" style={{ padding: '10px', textAlign: 'left' }}>
                      🌐 Public Client (HTTP/80)
                    </button>
                    <button onClick={() => testSecurityTraffic('bastion')} disabled={!!sendingPacket} className="ec2-btn" style={{ padding: '10px', textAlign: 'left' }}>
                      🔒 Bastion Host (SSH/22)
                    </button>
                    <button onClick={() => testSecurityTraffic('corp_app')} disabled={!!sendingPacket} className="ec2-btn" style={{ padding: '10px', textAlign: 'left' }}>
                      🏢 Corp Server (Custom/8080)
                    </button>
                    <button onClick={() => testSecurityTraffic('hacker')} disabled={!!sendingPacket} className="ec2-btn" style={{ padding: '10px', textAlign: 'left' }}>
                      🚨 Anonymous Hacker (SSH/22)
                    </button>
                  </div>

                  {/* Visual packet trace */}
                  <div style={{ flex: 1, border: '1.5px solid rgba(226, 232, 240, 0.8)', background: 'rgba(255, 255, 255, 0.4)', borderRadius: '10px', padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '220px' }}>
                    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                      
                      {/* Interactive SVG Sandbox */}
                      <svg viewBox="0 0 450 180" width="100%" className="ec2-svg-bg">
                        <defs>
                          <marker id="firewall-arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#94a3b8"/></marker>
                          <linearGradient id="shield-grad-blue" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#60a5fa" />
                            <stop offset="100%" stopColor="#2563eb" />
                          </linearGradient>
                          <linearGradient id="shield-grad-green" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#34d399" />
                            <stop offset="100%" stopColor="#059669" />
                          </linearGradient>
                          <linearGradient id="shield-grad-red" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f87171" />
                            <stop offset="100%" stopColor="#dc2626" />
                          </linearGradient>
                          <filter id="ec2-shadow-net2" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.06" />
                          </filter>
                        </defs>

                        {/* PREMIUM NESTED BOUNDARIES */}
                        {/* Public Ingress Boundary */}
                        <rect x="5" y="8" width="115" height="164" rx="8" fill="rgba(71, 85, 105, 0.02)" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="62" y="18" textAnchor="middle" fontSize="6.5" fill="#475569" fontWeight="bold">🌐 PUBLIC INGRESS NETS</text>

                        {/* SG Gateway Shield Boundary */}
                        <rect x="130" y="8" width="140" height="164" rx="8" fill="rgba(37, 99, 235, 0.02)" stroke="#2563eb" strokeWidth="1.2" strokeDasharray="4,2" />
                        <text x="200" y="18" textAnchor="middle" fontSize="6.5" fill="#1e40af" fontWeight="bold">🛡️ STATEFUL SG GATEWAY</text>

                        {/* Secure Compute Subnet */}
                        <rect x="280" y="8" width="165" height="164" rx="8" fill="rgba(16, 185, 129, 0.02)" stroke="#10b981" strokeWidth="1.2" strokeDasharray="3,3" />
                        <text x="362" y="18" textAnchor="middle" fontSize="6.5" fill="#047857" fontWeight="bold">💻 SECURE COMPUTE SUBNET</text>

                        {/* Connection Paths from Left Nodes to Firewall Center (200, 90) */}
                        <path d="M 110, 30 L 200, 90" stroke={sendingPacket === 'internet' ? '#ea580c' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray={sendingPacket === 'internet' ? 'none' : '3,3'} />
                        <path d="M 110, 70 L 200, 90" stroke={sendingPacket === 'bastion' ? '#ea580c' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray={sendingPacket === 'bastion' ? 'none' : '3,3'} />
                        <path d="M 110, 110 L 200, 90" stroke={sendingPacket === 'corp_app' ? '#ea580c' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray={sendingPacket === 'corp_app' ? 'none' : '3,3'} />
                        <path d="M 110, 150 L 200, 90" stroke={sendingPacket === 'hacker' ? '#ea580c' : '#cbd5e1'} strokeWidth="1.5" strokeDasharray={sendingPacket === 'hacker' ? 'none' : '3,3'} />

                        {/* Connection Path from Firewall to EC2 (230, 90) to (315, 90) */}
                        <path d="M 230, 90 L 290, 90" stroke={firewallTestResult?.status === 'ALLOW' ? '#10b981' : '#cbd5e1'} strokeWidth="2" markerEnd="url(#firewall-arrow)" />

                        {/* Animated Packets */}
                        {sendingPacket === 'internet' && (
                          <circle r="5" fill="#f59e0b">
                            <animateMotion dur="0.8s" repeatCount="indefinite" path="M 110, 30 L 200, 90" />
                          </circle>
                        )}
                        {sendingPacket === 'bastion' && (
                          <circle r="5" fill="#f59e0b">
                            <animateMotion dur="0.8s" repeatCount="indefinite" path="M 110, 70 L 200, 90" />
                          </circle>
                        )}
                        {sendingPacket === 'corp_app' && (
                          <circle r="5" fill="#f59e0b">
                            <animateMotion dur="0.8s" repeatCount="indefinite" path="M 110, 110 L 200, 90" />
                          </circle>
                        )}
                        {sendingPacket === 'hacker' && (
                          <circle r="5" fill="#f59e0b">
                            <animateMotion dur="0.8s" repeatCount="indefinite" path="M 110, 150 L 200, 90" />
                          </circle>
                        )}

                        {/* Green Allowed Flow through the Gate */}
                        {firewallTestResult?.status === 'ALLOW' && (
                          <circle r="5" fill="#10b981">
                            <animateMotion dur="0.6s" repeatCount="indefinite" path="M 230, 90 L 290, 90" />
                          </circle>
                        )}

                        {/* Red Packet Drop / Collision at Firewall */}
                        {firewallTestResult?.status === 'DROP' && (
                          <g>
                            <circle cx="200" cy="90" r="8" fill="none" stroke="#ef4444" strokeWidth="2">
                              <animate attributeName="r" values="5;18" dur="0.6s" repeatCount="indefinite" />
                              <animate attributeName="opacity" values="1;0" dur="0.6s" repeatCount="indefinite" />
                            </circle>
                            <circle cx="200" cy="90" r="3.5" fill="#ef4444" />
                          </g>
                        )}

                        {/* Left Clients / Nodes */}
                        {/* 1. Public Client */}
                        <g onClick={() => testSecurityTraffic('internet')} style={{ cursor: 'pointer' }} transform="translate(12, 23)" filter="url(#ec2-shadow-net2)">
                          <rect x="0" y="0" width="100" height="28" rx="6" fill="#ffffff" stroke="#0284c7" strokeWidth="1" />
                          <text x="50" y="17" textAnchor="middle" fontSize="7.5" fill="#1e293b" fontWeight="bold">🌐 Public (Port 80)</text>
                        </g>

                        {/* 2. Bastion */}
                        <g onClick={() => testSecurityTraffic('bastion')} style={{ cursor: 'pointer' }} transform="translate(12, 60)" filter="url(#ec2-shadow-net2)">
                          <rect x="0" y="0" width="100" height="28" rx="6" fill="#ffffff" stroke="#6366f1" strokeWidth="1" />
                          <text x="50" y="17" textAnchor="middle" fontSize="7.5" fill="#1e293b" fontWeight="bold">🔒 Bastion (Port 22)</text>
                        </g>

                        {/* 3. Corporate Intranet */}
                        <g onClick={() => testSecurityTraffic('corp_app')} style={{ cursor: 'pointer' }} transform="translate(12, 97)" filter="url(#ec2-shadow-net2)">
                          <rect x="0" y="0" width="100" height="28" rx="6" fill="#ffffff" stroke="#0d9488" strokeWidth="1" />
                          <text x="50" y="17" textAnchor="middle" fontSize="7.5" fill="#1e293b" fontWeight="bold">🏢 Corp App (Port 8080)</text>
                        </g>

                        {/* 4. Anonymous Hacker */}
                        <g onClick={() => testSecurityTraffic('hacker')} style={{ cursor: 'pointer' }} transform="translate(12, 134)" filter="url(#ec2-shadow-net2)">
                          <rect x="0" y="0" width="100" height="28" rx="6" fill="#ffffff" stroke="#ef4444" strokeWidth="1" />
                          <text x="50" y="17" textAnchor="middle" fontSize="7.5" fill="#1e293b" fontWeight="bold">🚨 Hacker (Port 22)</text>
                        </g>

                        {/* Firewall Stateful Shield Gate */}
                        <g transform="translate(145, 20)" filter="url(#ec2-shadow-net2)">
                          <rect x="0" y="0" width="40" height="140" rx="8" fill="#334155" stroke="#475569" strokeWidth="1" />
                          <text x="20" y="18" textAnchor="middle" fontSize="6.5" fill="#94a3b8" fontWeight="bold">FIREWALL</text>
                          
                          {/* Stateful brick segments */}
                          <line x1="5" y1="28" x2="35" y2="28" stroke="#475569" strokeWidth="1" />
                          <line x1="5" y1="48" x2="35" y2="48" stroke="#475569" strokeWidth="1" />
                          <line x1="5" y1="68" x2="35" y2="68" stroke="#475569" strokeWidth="1" />
                          <line x1="5" y1="88" x2="35" y2="88" stroke="#475569" strokeWidth="1" />
                          <line x1="5" y1="108" x2="35" y2="108" stroke="#475569" strokeWidth="1" />
                          <line x1="5" y1="128" x2="35" y2="128" stroke="#475569" strokeWidth="1" />

                          {/* Glowing central SG Shield */}
                          <circle cx="20" cy="70" r="15" 
                            fill={
                              firewallTestResult?.status === 'ALLOW' ? 'url(#shield-grad-green)' :
                              firewallTestResult?.status === 'DROP' ? 'url(#shield-grad-red)' :
                              'url(#shield-grad-blue)'
                            }
                            stroke="#fff" 
                            strokeWidth="1.5" 
                          />
                          <text x="20" y="73" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">SG</text>
                        </g>

                        {/* Destination EC2 Host on Right */}
                        <g transform="translate(305, 45)" filter="url(#ec2-shadow-net2)">
                          <rect x="0" y="0" width="115" height="90" rx="8" fill="#ffffff" 
                            stroke={firewallTestResult?.status === 'ALLOW' ? '#10b981' : '#475569'} 
                            strokeWidth={firewallTestResult?.status === 'ALLOW' ? '2.5' : '1.5'} 
                          />
                          
                          {/* Server header */}
                          <rect x="5" y="5" width="105" height="18" rx="4" fill={firewallTestResult?.status === 'ALLOW' ? '#ecfdf5' : '#f1f5f9'} />
                          <text x="57.5" y="17" textAnchor="middle" fontSize="8.5" fill="#1e293b" fontWeight="bold">EC2 Guest Host</text>

                          {/* Interactive status bulb */}
                          <circle cx="20" cy="40" r="4.5" 
                            fill={
                              firewallTestResult?.status === 'ALLOW' ? '#10b981' :
                              firewallTestResult?.status === 'DROP' ? '#ef4444' :
                              '#64748b'
                            } 
                          />
                          <text x="32" y="43" fontSize="7.5" fill="#475569" fontWeight="bold">
                            {firewallTestResult ? `PORT: ${firewallTestResult.status}` : 'PORT IDLE'}
                          </text>

                          {/* Details mock */}
                          <rect x="15" y="55" width="85" height="4" rx="2" fill="#e2e8f0" />
                          <rect x="15" y="65" width="65" height="4" rx="2" fill="#e2e8f0" />
                          <rect x="15" y="75" width="75" height="4" rx="2" fill="#e2e8f0" />
                        </g>

                      </svg>

                      {/* Stateful text explanation below SVG */}
                      <div style={{ textAlign: 'center', background: 'rgba(255, 255, 255, 0.9)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                        {sendingPacket ? (
                          <div style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b', animation: 'ping 1s infinite' }} />
                            Evaluating packet headers against Ingress Security Group rules table...
                          </div>
                        ) : firewallTestResult ? (
                          <div>
                            <span className="ec2-badge" style={{ 
                              background: firewallTestResult.status === 'ALLOW' ? '#10b981' : '#ef4444', 
                              color: '#fff', 
                              fontSize: '11px',
                              marginBottom: '6px',
                              fontWeight: 'bold'
                            }}>
                              {firewallTestResult.status}
                            </span>
                            <div style={{ fontSize: '11px', color: '#1e293b', fontWeight: 500, lineHeight: '1.45', padding: '0 8px' }}>
                              {firewallTestResult.msg}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 500 }}>
                            💡 <b>Test network:</b> Click any left client node directly in the SVG sandbox to fire a simulated TCP connection!
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ec2-sec">EC2 Instance Placement Groups Architectures</div>
            <div className="ec2-card">
              <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px', lineHeight: '1.4' }}>
                Placement Groups control the physical distribution logic of your EC2 instances within the AWS underlying physical hardware backplane.
              </div>

              <div className="ec2-g3">
                {/* Cluster PG */}
                <div style={{ background: 'rgba(255,255,255,0.4)', padding: '14px', borderRadius: '10px', border: '1.5px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#ea580c' }}>📍</span> Cluster Group
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.45', marginBottom: '12px', flex: 1 }}>
                    Packs instances close together inside a **single Availability Zone** on the same physical server rack. Provides ultra-low latency and maximum inter-node throughput (up to 100 Gbps).
                  </div>

                  {/* SVG Cluster */}
                  <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <svg viewBox="0 0 200 120" width="100%" className="ec2-svg-bg">
                      <rect x="5" y="5" width="190" height="110" rx="6" fill="rgba(234, 88, 12, 0.02)" stroke="#ea580c" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="100" y="15" textAnchor="middle" fontSize="6.5" fill="#ea580c" fontWeight="bold">📍 HIGH-PERFORMANCE RACK ZONE</text>
                      
                      {/* Top Switch */}
                      <rect x="50" y="24" width="100" height="18" rx="4" fill="#ffffff" stroke="#ea580c" strokeWidth="1.2" style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(234,88,12,0.15))' }} />
                      <text x="100" y="35" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#ea580c">⚡ 100Gbps Switch</text>
 
                       {/* Connections */}
                      <path id="cluster-p1" d="M 45, 75 L 70, 42" stroke="#cbd5e1" strokeWidth="1" />
                      <path id="cluster-p2" d="M 100, 75 L 100, 42" stroke="#cbd5e1" strokeWidth="1" />
                      <path id="cluster-p3" d="M 155, 75 L 130, 42" stroke="#cbd5e1" strokeWidth="1" />
 
                       {/* Packets */}
                      <circle r="2.5" fill="#ea580c">
                        <animateMotion dur="1s" repeatCount="indefinite" path="M 45, 75 L 70, 42" />
                      </circle>
                      <circle r="2.5" fill="#ea580c">
                        <animateMotion dur="1.2s" repeatCount="indefinite" path="M 100, 75 L 100, 42" />
                      </circle>
                      <circle r="2.5" fill="#ea580c">
                        <animateMotion dur="1s" repeatCount="indefinite" path="M 155, 75 L 130, 42" />
                      </circle>
 
                       {/* Clustered EC2 nodes */}
                      <g transform="translate(20, 75)">
                        <rect x="0" y="0" width="45" height="30" rx="4" fill="#ffffff" stroke="#2563eb" strokeWidth="1" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }} />
                        <rect x="3" y="3" width="39" height="6" rx="1.5" fill="#3b82f6" />
                        <text x="22.5" y="20" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#1e293b">EC2-A</text>
                      </g>
                      
                      <g transform="translate(77, 75)">
                        <rect x="0" y="0" width="45" height="30" rx="4" fill="#ffffff" stroke="#2563eb" strokeWidth="1" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }} />
                        <rect x="3" y="3" width="39" height="6" rx="1.5" fill="#3b82f6" />
                        <text x="22.5" y="20" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#1e293b">EC2-B</text>
                      </g>
 
                       <g transform="translate(135, 75)">
                        <rect x="0" y="0" width="45" height="30" rx="4" fill="#ffffff" stroke="#2563eb" strokeWidth="1" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }} />
                        <rect x="3" y="3" width="39" height="6" rx="1.5" fill="#3b82f6" />
                        <text x="22.5" y="20" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#1e293b">EC2-C</text>
                      </g>
                    </svg>
                  </div>
                  <span className="ec2-badge" style={{ background: '#ea580c', color: '#fff', fontSize: '9px', textAlign: 'center' }}>Best for: High Performance Compute (HPC)</span>
                </div>

                {/* Spread PG */}
                <div style={{ background: 'rgba(255,255,255,0.4)', padding: '14px', borderRadius: '10px', border: '1.5px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#10b981' }}>📍</span> Spread Group
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.45', marginBottom: '12px', flex: 1 }}>
                    Maps each instance onto **strictly different physical hardware power racks**, separate switches, and isolated power sources. Maximum safety boundary: 7 instances per AZ.
                  </div>

                  {/* SVG Spread */}
                  <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <svg viewBox="0 0 200 120" width="100%" className="ec2-svg-bg">
                      {/* Rack 1 */}
                      <g transform="translate(10, 8)">
                        <rect x="0" y="0" width="50" height="104" rx="4" fill="rgba(16, 185, 129, 0.02)" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                        <text x="25" y="10" textAnchor="middle" fontSize="6.5" fill="#047857" fontWeight="bold">RACK A DOMAIN</text>
                        
                        {/* 3D server */}
                        <g style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(16,185,129,0.1))' }}>
                          <rect x="5" y="16" width="40" height="22" rx="3" fill="#ffffff" stroke="#10b981" strokeWidth="1" />
                          <text x="25" y="30" textAnchor="middle" fontSize="8.5" fill="#047857" fontWeight="bold">EC2-1</text>
                        </g>
                        
                        <text x="25" y="55" textAnchor="middle" fontSize="6" fill="#047857">🔋 Power-A</text>
                        <text x="25" y="70" textAnchor="middle" fontSize="6" fill="#047857">🔌 Net-A</text>
                        <circle cx="25" cy="85" r="4.5" fill="#10b981" />
                        <circle cx="25" cy="85" r="2" fill="#fff" />
                      </g>

                      {/* Rack 2 */}
                      <g transform="translate(75, 8)">
                        <rect x="0" y="0" width="50" height="104" rx="4" fill="rgba(16, 185, 129, 0.02)" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                        <text x="25" y="10" textAnchor="middle" fontSize="6.5" fill="#047857" fontWeight="bold">RACK B DOMAIN</text>
                        
                        <g style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(16,185,129,0.1))' }}>
                          <rect x="5" y="16" width="40" height="22" rx="3" fill="#ffffff" stroke="#10b981" strokeWidth="1" />
                          <text x="25" y="30" textAnchor="middle" fontSize="8.5" fill="#047857" fontWeight="bold">EC2-2</text>
                        </g>
                        
                        <text x="25" y="55" textAnchor="middle" fontSize="6" fill="#047857">🔋 Power-B</text>
                        <text x="25" y="70" textAnchor="middle" fontSize="6" fill="#047857">🔌 Net-B</text>
                        <circle cx="25" cy="85" r="4.5" fill="#10b981" />
                        <circle cx="25" cy="85" r="2" fill="#fff" />
                      </g>

                      {/* Rack 3 */}
                      <g transform="translate(140, 8)">
                        <rect x="0" y="0" width="50" height="104" rx="4" fill="rgba(16, 185, 129, 0.02)" stroke="#10b981" strokeWidth="1" strokeDasharray="2,2" />
                        <text x="25" y="10" textAnchor="middle" fontSize="6.5" fill="#047857" fontWeight="bold">RACK C DOMAIN</text>
                        
                        <g style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(16,185,129,0.1))' }}>
                          <rect x="5" y="16" width="40" height="22" rx="3" fill="#ffffff" stroke="#10b981" strokeWidth="1" />
                          <text x="25" y="30" textAnchor="middle" fontSize="8.5" fill="#047857" fontWeight="bold">EC2-3</text>
                        </g>
                        
                        <text x="25" y="55" textAnchor="middle" fontSize="6" fill="#047857">🔋 Power-C</text>
                        <text x="25" y="70" textAnchor="middle" fontSize="6" fill="#047857">🔌 Net-C</text>
                        <circle cx="25" cy="85" r="4.5" fill="#10b981" />
                        <circle cx="25" cy="85" r="2" fill="#fff" />
                      </g>
                    </svg>
                  </div>
                  <span className="ec2-badge" style={{ background: '#10b981', color: '#fff', fontSize: '9px', textAlign: 'center' }}>Best for: Core Controllers, Core Database Nodes</span>
                </div>

                {/* Partition PG */}
                <div style={{ background: 'rgba(255,255,255,0.4)', padding: '14px', borderRadius: '10px', border: '1.5px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#0284c7' }}>📍</span> Partition Group
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.45', marginBottom: '12px', flex: 1 }}>
                    Divides placement into isolated partitions. Racks in one partition do not share hardware with racks in other partitions. Allows multiple nodes in a single partition.
                  </div>

                  {/* SVG Partition */}
                  <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <svg viewBox="0 0 200 120" width="100%" className="ec2-svg-bg">
                      {/* Partition 1 */}
                      <g transform="translate(6, 8)">
                        <rect x="0" y="0" width="90" height="104" rx="4" fill="rgba(2, 132, 199, 0.02)" stroke="#0284c7" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="45" y="10" textAnchor="middle" fontSize="6" fill="#0284c7" fontWeight="bold">🛡️ COMPUTE PARTITION 1</text>
                        
                        <g style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                          <rect x="5" y="16" width="36" height="20" rx="2" fill="#ffffff" stroke="#3b82f6" strokeWidth="0.8" />
                          <text x="23" y="28" textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="bold">EC2-1</text>
                        </g>

                        <g style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                          <rect x="49" y="16" width="36" height="20" rx="2" fill="#ffffff" stroke="#3b82f6" strokeWidth="0.8" />
                          <text x="67" y="28" textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="bold">EC2-2</text>
                        </g>

                        <g style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                          <rect x="27" y="44" width="36" height="20" rx="2" fill="#ffffff" stroke="#3b82f6" strokeWidth="0.8" />
                          <text x="45" y="56" textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="bold">EC2-3</text>
                        </g>
                        
                        <path d="M 15, 85 L 75, 85" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />
                        <circle r="3" fill="#0284c7">
                          <animateMotion dur="1.5s" repeatCount="indefinite" path="M 15, 85 L 75, 85" />
                        </circle>
                        <text x="45" y="98" textAnchor="middle" fontSize="5.5" fill="#64748b" fontWeight="bold">HDFS / Data Node Pool</text>
                      </g>

                      {/* Partition 2 */}
                      <g transform="translate(104, 8)">
                        <rect x="0" y="0" width="90" height="104" rx="4" fill="rgba(2, 132, 199, 0.02)" stroke="#0284c7" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="45" y="10" textAnchor="middle" fontSize="6" fill="#0284c7" fontWeight="bold">🛡️ COMPUTE PARTITION 2</text>
                        
                        <g style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                          <rect x="5" y="16" width="36" height="20" rx="2" fill="#ffffff" stroke="#3b82f6" strokeWidth="0.8" />
                          <text x="23" y="28" textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="bold">EC2-4</text>
                        </g>

                        <g style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                          <rect x="49" y="16" width="36" height="20" rx="2" fill="#ffffff" stroke="#3b82f6" strokeWidth="0.8" />
                          <text x="67" y="28" textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="bold">EC2-5</text>
                        </g>

                        <g style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                          <rect x="27" y="44" width="36" height="20" rx="2" fill="#ffffff" stroke="#3b82f6" strokeWidth="0.8" />
                          <text x="45" y="56" textAnchor="middle" fontSize="7" fill="#1d4ed8" fontWeight="bold">EC2-6</text>
                        </g>
                        
                        <path d="M 15, 85 L 75, 85" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />
                        <circle r="3" fill="#0284c7">
                          <animateMotion dur="1.5s" repeatCount="indefinite" path="M 15, 85 L 75, 85" />
                        </circle>
                        <text x="45" y="98" textAnchor="middle" fontSize="5.5" fill="#64748b" fontWeight="bold">Cassandra replicas</text>
                      </g>
                    </svg>
                  </div>
                  <span className="ec2-badge" style={{ background: '#0284c7', color: '#fff', fontSize: '9px', textAlign: 'center' }}>Best for: Kafka, HDFS, Cassandra, Hadoop</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SPOT & PURCHASING PANEL */}
        {activeTab === 'purchasing' && (
          <div>
            <div className="ec2-sec">EC2 Spot Instances &amp; Spot Fleets Reclaim Simulator</div>
            <div className="ec2-card">
              <div className="ec2-g2">
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-primary)' }}>💸 Interactive Spot Capacity Bid Settings</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                    Spot instances grant access to spare AWS compute nodes at discounts up to **90%**. However, when AWS needs capacity back, they issue an automated **2-minute shutdown notice**. Adjust your maximum hourly bid limits below:
                  </div>

                  <div style={{ marginBottom: '14px', background: 'var(--color-background-secondary)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px' }}>
                      <span>Your Maximum Bid Price:</span>
                      <b style={{ color: '#0284c7' }}>${maxBid.toFixed(2)} / Hour</b>
                    </div>
                    <input 
                      type="range" min="0.05" max="0.35" step="0.01" value={maxBid} 
                      onChange={(e) => setMaxBid(Number(e.target.value))} 
                      style={{ width: '100%', accentColor: '#0284c7' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '10px' }}>
                      <span>Current Spot Market Price:</span>
                      <b style={{ color: spotPrice > maxBid ? '#ef4444' : '#10b981' }}>${spotPrice.toFixed(2)} / Hour</b>
                    </div>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Spot Fleet Allocation Strategy</label>
                    <select 
                      value={allocationStrategy} 
                      onChange={(e) => setAllocationStrategy(e.target.value as any)} 
                      style={{ padding: '6px 10px', fontSize: '12px', width: '100%', borderRadius: '6px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}
                    >
                      <option value="lowestPrice">lowestPrice (Picks pools purely on minimum cost)</option>
                      <option value="capacityOptimized">capacityOptimized (Launches from deepest pools to reduce reclaims)</option>
                      <option value="diversified">diversified (Distributes evenly across available subnets/pools)</option>
                    </select>
                  </div>
                </div>

                {/* Live logs and countdown clock */}
                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--color-text-primary)' }}>🔄 Spot Fleet Active Operations Event Log</div>
                  
                  {spotCountdown !== null ? (
                    <div style={{ background: '#fef2f2', border: '0.5px solid #fecaca', padding: '10px', borderRadius: '6px', marginBottom: '10px', textAlign: 'center', animation: 'pulse 2s infinite' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>⏳ Reclaiming: {spotCountdown}s</div>
                      <div style={{ fontSize: '10px', color: '#991b1b', marginTop: '2px' }}>AWS is terminating your Spot Instance due to target pricing thresholds!</div>
                    </div>
                  ) : (
                    <div style={{ background: '#f0fdf4', border: '0.5px solid #bbf7d0', padding: '10px', borderRadius: '6px', marginBottom: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534' }}>🟢 SPOT INSTANCES IN SERVICE</div>
                      <div style={{ fontSize: '10px', color: '#166534', marginTop: '2px' }}>Market price remains safely below your Maximum Bid price limit.</div>
                    </div>
                  )}

                  <div className="ec2-terminal" style={{ flex: 1, maxHeight: '140px', background: '#090d16' }}>
                    {spotLogs.map((log, index) => (
                      <div key={index} style={{ color: log.includes('⚠️') ? '#f59e0b' : log.includes('✅') ? '#10b981' : log.includes('🔄') ? '#38bdf8' : '#94a3b8', fontSize: '10px' }}>
                        [{new Date().toLocaleTimeString()}] {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="ec2-sec">AWS EC2 Purchase Models Comparison Matrix</div>
            <div className="ec2-card">
              <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--color-background-secondary)', textAlign: 'left', borderBottom: '1px solid var(--color-border-secondary)' }}>
                    <th style={{ padding: '8px' }}>Purchase Model</th>
                    <th style={{ padding: '8px' }}>Discount Range</th>
                    <th style={{ padding: '8px' }}>Commitment Bounds</th>
                    <th style={{ padding: '8px' }}>Key Product Match</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>On-Demand</td>
                    <td style={{ padding: '8px', color: '#94a3b8' }}>Baseline Cost (0% off)</td>
                    <td style={{ padding: '8px' }}>None (Per-Second Billing)</td>
                    <td style={{ padding: '8px', color: '#0284c7' }}>Spiky, unpredictable server traffic and early stage apps</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Reserved Instances (RIs)</td>
                    <td style={{ padding: '8px', color: '#10b981' }}>Up to 72% discount</td>
                    <td style={{ padding: '8px' }}>1 or 3 years (Specific family/AZ)</td>
                    <td style={{ padding: '8px', color: '#0284c7' }}>Steady-state production database servers and enterprise networks</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Savings Plans</td>
                    <td style={{ padding: '8px', color: '#10b981' }}>Up to 72% discount</td>
                    <td style={{ padding: '8px' }}>1 or 3 years ($ spend commitment)</td>
                    <td style={{ padding: '8px', color: '#0284c7' }}>Diverse compute scaling across Fargate, Lambda, and EC2</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Spot Instances</td>
                    <td style={{ padding: '8px', color: '#10b981', fontWeight: 'bold' }}>Up to 90% discount</td>
                    <td style={{ padding: '8px' }}>None (Interruptible by AWS)</td>
                    <td style={{ padding: '8px', color: '#0284c7' }}>Container stateless fleets, stateless batch processing, CI/CD workers</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Dedicated Hosts</td>
                    <td style={{ padding: '8px', color: '#ef4444' }}>Premium pricing</td>
                    <td style={{ padding: '8px' }}>Physical server dedicated to you</td>
                    <td style={{ padding: '8px', color: '#0284c7' }}>Strict hardware licensing (BYOL) and server compliance policies</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STORAGE PANEL */}
        {activeTab === 'storage' && (
          <div>
            <div className="ec2-sec">EC2 Instance Storage Architectures (EBS vs EFS vs Instance Store)</div>
            <div className="ec2-card">
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
                EC2 hosts integrate block and file storage via network connections or direct bus attachments. Understanding these properties prevents data loss.
              </div>

              <div className="ec2-g3" style={{ marginBottom: '14px' }}>
                <div style={{ background: 'var(--color-background-secondary)', padding: '12px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--color-text-primary)' }}>💾 EBS (Block Storage)</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '6px' }}>
                    Network attached virtual drive. Replication is constrained inside **one AZ**. The volume lifecycle is independent of the instance state (survives stopping).
                  </div>
                  <span className="ec2-badge" style={{ background: '#0284c7', color: '#fff', fontSize: '9px' }}>Type: SAN Block</span>
                </div>

                <div style={{ background: 'var(--color-background-secondary)', padding: '12px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--color-text-primary)' }}>⚡ Instance Store (Local)</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '6px' }}>
                    Direct physical NVMe/SSD buses on the host machine. **Ephemeral** storage. **If instance STOPS or TERMINATES, data is completely wiped!**
                  </div>
                  <span className="ec2-badge" style={{ background: '#ef4444', color: '#fff', fontSize: '9px' }}>Type: Ephemeral Direct</span>
                </div>

                <div style={{ background: 'var(--color-background-secondary)', padding: '12px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--color-text-primary)' }}>📁 EFS (Shared File Storage)</div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '6px' }}>
                    Managed network filesystem (NFS). Multi-AZ accessible. Scales storage and throughput dynamically. Hundreds of EC2s can mount it concurrently.
                  </div>
                  <span className="ec2-badge" style={{ background: '#10b981', color: '#fff', fontSize: '9px' }}>Type: Shared NAS</span>
                </div>
              </div>

              {/* EBS Volume Calculator */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 4, minWidth: '320px', background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-primary)' }}>🧮 Interactive EBS Performance Calculator</div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>EBS Volume Type</label>
                    <select value={ebsVolumeType} onChange={(e) => {
                      setEbsVolumeType(e.target.value as any);
                      if (e.target.value === 'gp3') setEbsIops(3000);
                      else if (e.target.value === 'io2') setEbsIops(16000);
                      else setEbsIops(0); // HDDs do not support custom provisioned IOPS
                    }} style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                      <option value="gp3">gp3 (General Purpose SSD - cost optimized)</option>
                      <option value="io2">io2 Block Express (Provisioned IOPS SSD - mission critical)</option>
                      <option value="st1">st1 (Throughput Optimized HDD - big data/logs)</option>
                      <option value="sc1">sc1 (Cold HDD - archival backups)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span>Volume Size:</span>
                      <b>{ebsSize} GB</b>
                    </div>
                    <input 
                      type="range" min="10" max="2000" value={ebsSize} 
                      onChange={(e) => setEbsSize(Number(e.target.value))} 
                      style={{ width: '100%', accentColor: '#0284c7' }}
                    />
                  </div>

                  {['gp3', 'io2'].includes(ebsVolumeType) && (
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span>Provisioned IOPS:</span>
                        <b>{ebsIops} IOPS</b>
                      </div>
                      <input 
                        type="range" min={ebsVolumeType === 'gp3' ? 3000 : 1000} max={ebsVolumeType === 'gp3' ? 16000 : 64000} step="500" value={ebsIops} 
                        onChange={(e) => setEbsIops(Number(e.target.value))} 
                        style={{ width: '100%', accentColor: '#0284c7' }}
                      />
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--color-border-secondary)', paddingTop: '8px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span>Estimated Monthly Cost:</span>
                    <b style={{ color: '#0284c7', fontSize: '12px' }}>${getEbsPricing()} / Month</b>
                  </div>
                </div>

                {/* EFS settings */}
                <div style={{ flex: 6, minWidth: '320px', background: 'var(--color-background-secondary)', padding: '16px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '10px', color: 'var(--color-text-primary)' }}>📁 EFS Performance, Throughput &amp; Cost Simulator</div>
                  
                  <div className="ec2-g2" style={{ gap: '16px' }}>
                    {/* Left Column: Sliders & Selects */}
                    <div>
                      <div className="ec2-kv">
                        <span className="ec2-kk" style={{ fontSize: '11px' }}>Throughput Mode:</span>
                        <select value={efsThroughput} onChange={(e) => setEfsThroughput(e.target.value as any)} style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                          <option value="bursting">Bursting Mode (Scales with size + credit accumulation)</option>
                          <option value="elastic">Elastic (Auto scales dynamically to spikes)</option>
                          <option value="provisioned">Provisioned (Dedicated speed set by user)</option>
                        </select>
                      </div>

                      {efsThroughput === 'provisioned' && (
                        <div style={{ marginBottom: '8px', background: 'var(--color-background-primary)', padding: '8px', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                            <span>Provisioned Throughput speed:</span>
                            <b>{efsProvisionedMb} MB/s</b>
                          </div>
                          <input 
                            type="range" min="1" max="256" value={efsProvisionedMb} 
                            onChange={(e) => setEfsProvisionedMb(Number(e.target.value))} 
                            style={{ width: '100%', accentColor: '#0284c7' }}
                          />
                        </div>
                      )}

                      <div className="ec2-kv">
                        <span className="ec2-kk" style={{ fontSize: '11px' }}>Performance Mode:</span>
                        <select value={efsPerfMode} onChange={(e) => setEfsPerfMode(e.target.value as any)} style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                          <option value="general">General Purpose (Lowest latency, standard systems)</option>
                          <option value="max_io">Max I/O (Slightly higher latency, massive scale)</option>
                        </select>
                      </div>

                      <div className="ec2-kv">
                        <span className="ec2-kk" style={{ fontSize: '11px' }}>Lifecycle transition policy:</span>
                        <select value={efsLifecycleDays} onChange={(e) => setEfsLifecycleDays(Number(e.target.value))} style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                          <option value={7}>Move to IA after 7 days idle</option>
                          <option value={30}>Move to IA after 30 days idle</option>
                          <option value={90}>Move to IA after 90 days idle</option>
                        </select>
                      </div>

                      <div style={{ marginTop: '10px', padding: '8px', background: 'var(--color-background-primary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                          <span>Shared NAS Volume Size:</span>
                          <b>{efsSize} GB</b>
                        </div>
                        <input 
                          type="range" min="10" max="5000" step="50" value={efsSize} 
                          onChange={(e) => setEfsSize(Number(e.target.value))} 
                          style={{ width: '100%', accentColor: '#0284c7' }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '8px' }}>
                          <span>Inactive File Ratio (IA tier):</span>
                          <b>{efsInactiveRatio}%</b>
                        </div>
                        <input 
                          type="range" min="0" max="100" step="5" value={efsInactiveRatio} 
                          onChange={(e) => setEfsInactiveRatio(Number(e.target.value))} 
                          style={{ width: '100%', accentColor: '#0284c7' }}
                        />
                      </div>
                    </div>

                    {/* Right Column: Dynamic Performance and Savings Calculations */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ background: 'var(--color-background-primary)', padding: '10px', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)', marginBottom: '8px' }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>⚡ Performance &amp; Latency Profile</div>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0284c7' }}>
                          {efsPerfMode === 'general' ? '🟢 GP Mode: Low Latency Focus' : '🔵 Max I/O: Infinite Scale Focus'}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px', lineHeight: '1.3' }}>
                          {efsPerfMode === 'general' 
                            ? 'Optimal for single-threaded or low-scale apps (max 35,000 read IOPS). Provides sub-millisecond local caching speeds.' 
                            : 'Supports thousands of client hosts concurrently. Designed for massive parallel processing, parallel analytics, and high scale data pools.'}
                        </div>
                      </div>

                      <div style={{ background: 'var(--color-background-primary)', padding: '10px', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                        <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: '6px' }}>💰 Interactive Financial Savings Audit</div>
                        
                        <div style={{ fontSize: '10.5px', margin: '4px 0', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Baseline Cost (100% Standard):</span>
                          <b>${getEfsPricing(false)} / mo</b>
                        </div>
                        
                        <div style={{ fontSize: '10.5px', margin: '4px 0', display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: 'bold' }}>
                          <span>Tiered Cost (Lifecycle Active):</span>
                          <span>${getEfsPricing(true)} / mo</span>
                        </div>

                        <div style={{ borderTop: '1px solid var(--color-border-secondary)', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: 'bold' }}>Monthly Net Savings:</span>
                          <span className="ec2-badge" style={{ background: '#22c55e', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>
                            ${(Number(getEfsPricing(false)) - Number(getEfsPricing(true))).toFixed(2)} / mo (Save {efsInactiveRatio}%)
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '9.5px', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: '1.35' }}>
                        ℹ️ <b>Throughput pricing:</b> Bursting is bundled. Provisioned charges fixed $6.00 per MB/s. Elastic handles spiky requests automatically ($0.03/GB read). Lifecycle transition is calculated on Standard ($0.30/GB) vs IA ($0.025/GB) tier storage splits.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="ec2-sec">Advanced Storage Features: EBS Multi-Attach &amp; EFS Lifecycle Tiering</div>
            <div className="ec2-card">
              <div className="ec2-g2">
                {/* EFS Storage Classes & Transitions */}
                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-primary)' }}>📁 EFS Storage Classes &amp; Lifecycle Transitions</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '10px', flex: 1 }}>
                    Amazon EFS supports multiple storage classes optimized for different usage patterns. With **EFS Lifecycle Management** and **Intelligent-Tiering**, files are seamlessly transitioned down to colder storage classes after staying idle, dramatically decreasing overall NAS costs.
                  </div>

                  {/* SVG Lifecycle Transitions */}
                  <div style={{ padding: '4px', textAlign: 'center', marginBottom: '8px' }}>
                    <svg viewBox="0 0 320 130" width="100%" className="ec2-svg-bg">
                      <defs>
                        <marker id="storage-arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#94a3b8"/></marker>
                        <linearGradient id="efs-std-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="efs-ia-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#3b82f6" />
                          <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                        <linearGradient id="efs-arc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#6d28d9" />
                        </linearGradient>
                      </defs>

                      {/* PREMIUM BOUNDARY TIERS */}
                      {/* Active Access Subnet */}
                      <rect x="3" y="10" width="88" height="78" rx="8" fill="rgba(16, 185, 129, 0.02)" stroke="#10b981" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="47" y="18" textAnchor="middle" fontSize="6.5" fill="#047857" fontWeight="bold">⚡ ACTIVE ZONE</text>

                      {/* Infrequent Access Subnet */}
                      <rect x="115" y="10" width="88" height="78" rx="8" fill="rgba(59, 130, 246, 0.02)" stroke="#3b82f6" strokeWidth="1.2" strokeDasharray="4,2" />
                      <text x="159" y="18" textAnchor="middle" fontSize="6.5" fill="#1d4ed8" fontWeight="bold">💤 IA SUBNET</text>

                      {/* Archive Cold Vault */}
                      <rect x="227" y="10" width="90" height="78" rx="8" fill="rgba(139, 92, 246, 0.02)" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="272" y="18" textAnchor="middle" fontSize="6.5" fill="#6d28d9" fontWeight="bold">❄️ DEEP VAULT</text>
                      
                      {/* Connections with animatemotion */}
                      <path d="M 90, 50 L 115, 50" className="ec2-flow-green" strokeWidth="2" strokeDasharray="3,2" markerEnd="url(#storage-arrow)" />
                      <path d="M 202, 50 L 227, 50" className="ec2-flow-blue" strokeWidth="2" strokeDasharray="3,2" markerEnd="url(#storage-arrow)" />

                      <circle r="3" fill="#10b981">
                        <animateMotion dur="2.5s" repeatCount="indefinite" path="M 90, 50 L 115, 50" />
                      </circle>
                      <circle r="3" fill="#3b82f6">
                        <animateMotion dur="2.5s" repeatCount="indefinite" path="M 202, 50 L 227, 50" />
                      </circle>

                      {/* EFS Standard */}
                      <g transform="translate(6, 24)" style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.05))' }}>
                        <rect x="0" y="0" width="82" height="60" rx="6" fill="#ffffff" stroke="#059669" strokeWidth="1.2" />
                        <rect x="4" y="4" width="74" height="12" rx="3" fill="url(#efs-std-grad)" />
                        <text x="41" y="12" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff">Standard</text>
                        <text x="41" y="30" textAnchor="middle" fontSize="6.5" fill="#475569" fontWeight="bold">(Frequent Access)</text>
                        <text x="41" y="42" textAnchor="middle" fontSize="7.5" fill="#1e293b" fontWeight="extrabold">$0.30 / GB</text>
                        <text x="41" y="52" textAnchor="middle" fontSize="6" fill="#10b981" fontWeight="bold">⚡ <tspan fontSize="5">GP Storage</tspan></text>
                      </g>

                      {/* EFS Infrequent Access */}
                      <g transform="translate(118, 24)" style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.05))' }}>
                        <rect x="0" y="0" width="82" height="60" rx="6" fill="#ffffff" stroke="#1d4ed8" strokeWidth="1.2" />
                        <rect x="4" y="4" width="74" height="12" rx="3" fill="url(#efs-ia-grad)" />
                        <text x="41" y="12" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff">EFS IA</text>
                        <text x="41" y="30" textAnchor="middle" fontSize="6.5" fill="#475569" fontWeight="bold">(Idle {efsLifecycleDays} Days)</text>
                        <text x="41" y="42" textAnchor="middle" fontSize="7.5" fill="#1e293b" fontWeight="extrabold">$0.025 / GB</text>
                        <text x="41" y="52" textAnchor="middle" fontSize="6" fill="#3b82f6" fontWeight="bold">📉 Save 92%</text>
                      </g>

                      {/* EFS Archive */}
                      <g transform="translate(230, 24)" style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.05))' }}>
                        <rect x="0" y="0" width="84" height="60" rx="6" fill="#ffffff" stroke="#6d28d9" strokeWidth="1.2" />
                        <rect x="4" y="4" width="76" height="12" rx="3" fill="url(#efs-arc-grad)" />
                        <text x="42" y="12" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff">EFS Archive</text>
                        <text x="42" y="30" textAnchor="middle" fontSize="6.5" fill="#475569" fontWeight="bold">(Idle 90+ Days)</text>
                        <text x="42" y="42" textAnchor="middle" fontSize="7.5" fill="#1e293b" fontWeight="extrabold">$0.008 / GB</text>
                        <text x="42" y="52" textAnchor="middle" fontSize="6" fill="#8b5cf6" fontWeight="bold">❄️ Save 97%</text>
                      </g>

                      <rect x="20" y="96" width="280" height="24" rx="6" fill="rgba(240, 253, 244, 0.8)" stroke="#bbf7d0" strokeWidth="0.8" />
                      <text x="160" y="111" textAnchor="middle" fontSize="8" fill="#15803d" fontWeight="bold">💰 Tiered Storage Audit: Automatic lifecycle savings applied concurrently</text>
                    </svg>
                  </div>
                </div>

                {/* EBS Multi-Attach & Encryption */}
                <div style={{ background: 'rgba(255,255,255,0.4)', padding: '14px', borderRadius: '10px', border: '1.5px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: '#1e293b' }}>💾 EBS Multi-Attach (io1/io2) &amp; KMS Encryption</div>
                  <div style={{ fontSize: '10.5px', color: '#475569', lineHeight: '1.45', marginBottom: '10px', flex: 1 }}>
                    - <b>EBS Multi-Attach:</b> Enables mounting a single high-performance **Provisioned IOPS (io1 or io2)** volume concurrently to up to 16 Nitro-based EC2 instances within the *same* AZ. Requires a cluster-aware filesystem (e.g. GFS2) to prevent data corruption.
                    <br />- <b>Hypervisor-level Encryption:</b> EBS utilizes **AWS KMS Keys (AES-256)** to encrypt data in transit between compute hosts and storage fabrics, data at rest, and all snapshots automatically.
                  </div>
 
                  {/* SVG Multiattach & Encryption */}
                  <div style={{ padding: '4px', textAlign: 'center', marginBottom: '8px' }}>
                    <svg viewBox="0 0 320 120" width="100%" className="ec2-svg-bg">
                      <defs>
                        <linearGradient id="multi-ebs-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#f87171" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                      </defs>

                      {/* PREMIUM BOUNDARY TIERS */}
                      {/* Nitro Host Subnet Zone */}
                      <rect x="3" y="5" width="140" height="110" rx="8" fill="rgba(37, 99, 235, 0.02)" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="73" y="14" textAnchor="middle" fontSize="6.5" fill="#2563eb" fontWeight="bold">💻 NITRO COMPUTE SUBNET</text>

                      {/* Secured EBS SAN Storage Zone */}
                      <rect x="150" y="5" width="166" height="110" rx="8" fill="rgba(239, 68, 68, 0.02)" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="4,2" />
                      <text x="233" y="14" textAnchor="middle" fontSize="6.5" fill="#dc2626" fontWeight="bold">🔒 SECURED EBS SAN FABRIC</text>

                      {/* Connections pointing to shared volume */}
                      <path d="M 70, 32 L 160, 60" className="ec2-flow-blue" strokeWidth="1.5" strokeDasharray="3,2" />
                      <path d="M 70, 70 L 160, 70" className="ec2-flow-blue" strokeWidth="1.5" strokeDasharray="3,2" />
                      <path d="M 70, 108 L 160, 80" className="ec2-flow-blue" strokeWidth="1.5" strokeDasharray="3,2" />

                      {/* Active animated pulses */}
                      <circle r="2.5" fill="#ef4444">
                        <animateMotion dur="1.5s" repeatCount="indefinite" path="M 70, 32 L 160, 60" />
                      </circle>
                      <circle r="2.5" fill="#ef4444">
                        <animateMotion dur="1.2s" repeatCount="indefinite" path="M 70, 70 L 160, 70" />
                      </circle>
                      <circle r="2.5" fill="#ef4444">
                        <animateMotion dur="1.7s" repeatCount="indefinite" path="M 70, 108 L 160, 80" />
                      </circle>

                      {/* EC2 instances (3D) */}
                      <g transform="translate(10, 20)" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                        <rect x="0" y="0" width="60" height="24" rx="4" fill="#ffffff" stroke="#1e40af" strokeWidth="1" />
                        <rect x="3" y="3" width="54" height="4" rx="1" fill="#3b82f6" />
                        <text x="30" y="17" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#1e293b">EC2 Host A</text>
                      </g>

                      <g transform="translate(10, 58)" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                        <rect x="0" y="0" width="60" height="24" rx="4" fill="#ffffff" stroke="#1e40af" strokeWidth="1" />
                        <rect x="3" y="3" width="54" height="4" rx="1" fill="#3b82f6" />
                        <text x="30" y="17" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#1e293b">EC2 Host B</text>
                      </g>

                      <g transform="translate(10, 96)" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                        <rect x="0" y="0" width="60" height="24" rx="4" fill="#ffffff" stroke="#1e40af" strokeWidth="1" />
                        <rect x="3" y="3" width="54" height="4" rx="1" fill="#3b82f6" />
                        <text x="30" y="17" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#1e293b">EC2 Host C</text>
                      </g>

                      {/* Shared KMS Encrypted EBS Cylinder */}
                      <g transform="translate(158, 20)" style={{ filter: 'drop-shadow(0 2px 3px rgba(220,38,38,0.1))' }}>
                        <rect x="0" y="0" width="150" height="90" rx="6" fill="#ffffff" stroke="#dc2626" strokeWidth="1.2" />
                        <rect x="4" y="4" width="142" height="15" rx="3" fill="url(#multi-ebs-grad)" />
                        <text x="75" y="14" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#fff">Shared EBS io1/io2</text>
                        
                        {/* Cylinder drawing */}
                        <ellipse cx="40" cy="46" rx="18" ry="5" fill="#fef2f2" stroke="#ef4444" strokeWidth="0.8" />
                        <path d="M22,46 L22,60 A18,5 0 0,0 58,60 L58,46" fill="#fef2f2" stroke="#ef4444" strokeWidth="0.8" />
                        
                        <text x="100" y="39" textAnchor="middle" fontSize="6.5" fill="#be123c" fontWeight="bold">⛓️ Multi-AZ Attach</text>
                        <text x="100" y="52" textAnchor="middle" fontSize="6.5" fill="#047857" fontWeight="bold">🔑 KMS AES-256</text>
                        
                        <text x="75" y="80" textAnchor="middle" fontSize="6.5" fill="#475569" fontWeight="bold">Safe Persistent Network SAN Block</text>
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIRTUAL LIFECYCLE CONSOLE */}
        {activeTab === 'lifecycle' && (
          <div>
            <div className="ec2-sec">Interactive EC2 Virtual Hypervisor Console</div>
            <div className="ec2-card">
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                Test instance behavior through standard hypervisor actions. Watch how stop vs termination affects local storage vs EBS, and how spot interruptions manifest.
              </div>

              <div className="ec2-g2">
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-primary)' }}>🛠️ EC2 Hardware Launch Parameters</div>
                  
                  <div className="ec2-g2" style={{ gap: '8px', marginBottom: '8px' }}>
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Instance Class</label>
                      <select value={consoleInstanceType} onChange={(e) => setConsoleInstanceType(e.target.value)} style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                        <option value="t3.medium">t3.medium (General)</option>
                        <option value="c6g.large">c6g.large (Compute)</option>
                        <option value="r6g.xlarge">r6g.xlarge (Memory)</option>
                        <option value="i3.xlarge">i3.xlarge (Local Store NVMe)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '10px', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Launch Model</label>
                      <select value={consolePurchaseModel} onChange={(e) => setConsolePurchaseModel(e.target.value as any)} style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                        <option value="ondemand">On-Demand ($/hr)</option>
                        <option value="spot">Spot Capacity</option>
                      </select>
                    </div>
                  </div>

                  <div className="ec2-g2" style={{ gap: '8px', marginBottom: '10px' }}>
                    <div>
                      <label style={{ fontSize: '10px', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Storage Setup</label>
                      <select value={consoleStorageType} onChange={(e) => setConsoleStorageType(e.target.value as any)} style={{ padding: '4px', fontSize: '11px', width: '100%' }}>
                        <option value="ebs">EBS Only (/dev/xvda)</option>
                        <option value="ephemeral">Local Instance Store Only</option>
                        <option value="both">Both (EBS Root + NVMe local)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <label style={{ fontSize: '10px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={deleteEbsOnTerm} onChange={(e) => setDeleteEbsOnTerm(e.target.checked)} />
                        Delete EBS on Termination
                      </label>
                    </div>
                  </div>

                  {/* Operational controls based on state */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px', borderTop: '1px solid var(--color-border-secondary)', paddingTop: '12px' }}>
                    <button 
                      onClick={handleConsoleLaunch} 
                      disabled={vmState !== 'Stopped' && vmState !== 'Terminated'} 
                      className="ec2-btn ec2-on"
                      style={{ padding: '6px 12px' }}
                    >
                      🚀 Launch Instance
                    </button>
                    <button 
                      onClick={handleConsoleUserData} 
                      disabled={vmState !== 'Running' || vmUserDataTested} 
                      className="ec2-btn"
                      style={{ padding: '6px 12px' }}
                    >
                      📄 Trigger User Data
                    </button>
                    <button 
                      onClick={handleConsoleLoad} 
                      disabled={vmState !== 'Running' || isConsoleSimulatingCpu} 
                      className="ec2-btn"
                      style={{ padding: '6px 12px' }}
                    >
                      {isConsoleSimulatingCpu ? '⏳ Loading VM...' : '⚡ Load VM'}
                    </button>
                    <button 
                      onClick={handleConsoleStop} 
                      disabled={vmState !== 'Running'} 
                      className="ec2-btn"
                      style={{ padding: '6px 12px', background: '#eab308', color: '#fff', border: 'none' }}
                    >
                      🛑 Stop Instance
                    </button>
                    <button 
                      onClick={handleConsoleTerminate} 
                      disabled={vmState !== 'Running' && vmState !== 'Stopped'} 
                      className="ec2-btn"
                      style={{ padding: '6px 12px', background: '#ef4444', color: '#fff', border: 'none' }}
                    >
                      ❌ Terminate
                    </button>
                  </div>
                </div>

                {/* Hypervisor status screen */}
                <div style={{ background: 'rgba(255, 255, 255, 0.4)', padding: '14px', borderRadius: '10px', border: '1.5px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569' }}>🖥️ Virtual Motherboard Chassis:</span>
                    <span className="ec2-badge" style={{ 
                      background: vmState === 'Running' ? '#10b981' : vmState === 'Stopped' ? '#ef4444' : vmState === 'Terminated' ? '#64748b' : '#eab308', 
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '10px'
                    }}>{vmState.toUpperCase()}</span>
                  </div>

                  {(() => {
                    const isEbsPresent = consoleStorageType === 'ebs' || consoleStorageType === 'both';
                    const isEbsRendered = isEbsPresent && !(vmState === 'Terminated' && deleteEbsOnTerm);
                    const isEbsDetached = vmState === 'Terminated' && !deleteEbsOnTerm;
                    const isNvmePresent = consoleStorageType === 'ephemeral' || consoleStorageType === 'both' || consoleInstanceType === 'i3.xlarge';
                    return (
                      <div style={{ margin: '6px 0', textAlign: 'center' }}>
                        <svg viewBox="0 0 320 170" width="100%" style={{ background: '#070a13', borderRadius: '10px', border: '1.5px solid #1e293b' }}>
                          {/* Grid background on board */}
                          <defs>
                            <pattern id="motherboard-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                              <circle cx="2" cy="2" r="0.6" fill="#1e293b" />
                            </pattern>
                            <linearGradient id="board-cpu-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#1e3a8a" />
                            </linearGradient>
                            <filter id="motherboard-glow" x="-10%" y="-10%" width="120%" height="120%">
                              <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#3b82f6" floodOpacity="0.4" />
                            </filter>
                          </defs>
                          <rect width="320" height="170" fill="#070a13" />
                          <rect width="320" height="170" fill="url(#motherboard-grid)" />
                          
                          {/* Circuits / Buses */}
                          <path d="M 60,70 L 120,70" stroke={vmState === 'Running' ? '#3b82f6' : '#1e293b'} strokeWidth="1.5" fill="none" opacity="0.6" />
                          <path d="M 60,70 L 120,105" stroke={vmState === 'Running' ? '#3b82f6' : '#1e293b'} strokeWidth="1.5" fill="none" opacity="0.6" />
                          <path d="M 60,70 L 215,105" stroke={vmState === 'Running' ? '#3b82f6' : '#1e293b'} strokeWidth="1.5" fill="none" opacity="0.6" />
 
                           {/* CPU Socket */}
                          <g transform="translate(20, 40)" style={vmState === 'Running' ? { filter: 'url(#motherboard-glow)' } : {}}>
                            <rect x="0" y="0" width="60" height="60" rx="6" fill="#111827" stroke="#1f2937" strokeWidth="1.5" />
                            <rect x="10" y="10" width="40" height="40" rx="4" fill="url(#board-cpu-grad)" opacity={vmState === 'Running' ? '0.3' : '0.05'} />
                            <text x="30" y="32" textAnchor="middle" fontSize="9" fill="#94a3b8" fontWeight="bold">CPU</text>
                            <text x="30" y="42" textAnchor="middle" fontSize="6.5" fill="#64748b" fontWeight="bold">vCPU Cores</text>
                            
                            {/* Pulse paths if running */}
                            {vmState === 'Running' && (
                              <g>
                                <circle cx="30" cy="30" r="22" fill="none" stroke={isConsoleSimulatingCpu ? '#ea580c' : '#3b82f6'} strokeWidth="1.5">
                                  <animate attributeName="r" values="10;25" dur={isConsoleSimulatingCpu ? "0.4s" : "1.5s"} repeatCount="indefinite" />
                                  <animate attributeName="opacity" values="1;0" dur={isConsoleSimulatingCpu ? "0.4s" : "1.5s"} repeatCount="indefinite" />
                                </circle>
                              </g>
                            )}
                          </g>
 
                           {/* RAM DIMMs */}
                          <g transform="translate(120, 22)">
                            <rect x="0" y="0" width="80" height="34" rx="4" fill="#111827" stroke="#1f2937" strokeWidth="1" />
                            <text x="40" y="10" textAnchor="middle" fontSize="7" fill="#94a3b8" fontWeight="bold">RAM slots</text>
                            
                            {/* DIMM sticks */}
                            <line x1="10" y1="16" x2="70" y2="16" stroke="#4b5563" strokeWidth="2" />
                            <line x1="10" y1="22" x2="70" y2="22" stroke="#4b5563" strokeWidth="2" />
 
                             {/* RAM LEDs based on instance class */}
                            <g transform="translate(15, 14)">
                              <circle cx="0" cy="0" r="1.5" fill={vmState === 'Running' ? '#10b981' : '#4b5563'} />
                              <circle cx="10" cy="0" r="1.5" fill={vmState === 'Running' && ['c6g.large', 'r6g.xlarge', 'i3.xlarge'].includes(consoleInstanceType) ? '#10b981' : '#4b5563'} />
                              <circle cx="20" cy="0" r="1.5" fill={vmState === 'Running' && ['r6g.xlarge', 'i3.xlarge'].includes(consoleInstanceType) ? '#10b981' : '#4b5563'} />
                              <circle cx="30" cy="0" r="1.5" fill={vmState === 'Running' && consoleInstanceType === 'r6g.xlarge' ? '#10b981' : '#4b5563'} />
                            </g>
                            <text x="40" y="30" textAnchor="middle" fontSize="6.5" fill="#3b82f6" fontWeight="bold">
                              {consoleInstanceType === 't3.medium' ? '4 GiB (Standard)' :
                               consoleInstanceType === 'c6g.large' ? '8 GiB (Compute)' :
                               consoleInstanceType === 'r6g.xlarge' ? '32 GiB (Memory!)' :
                               '16 GiB (Storage Opt)'}
                            </text>
                          </g>
 
                           {/* Storage Mount Area */}
                          {/* 1. EBS Volume */}
                          {isEbsRendered && (
                            <g transform={`translate(120, ${isEbsDetached ? '122' : '90'})`} style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.15))' }}>
                              <rect x="0" y="0" width="80" height="38" rx="4" 
                                fill={isEbsDetached ? '#111827' : '#ffffff'} 
                                stroke={isEbsDetached ? '#ef4444' : vmState === 'Running' ? '#10b981' : '#cbd5e1'} 
                                strokeWidth="1.2" 
                              />
                              <rect x="2" y="2" width="76" height="6" rx="1" fill={isEbsDetached ? '#ef4444' : '#0284c7'} />
                              <text x="40" y="17" textAnchor="middle" fontSize="7" fill={isEbsDetached ? '#ef4444' : '#1e293b'} fontWeight="extrabold">EBS Root</text>
                              <text x="40" y="25" textAnchor="middle" fontSize="6" fill={isEbsDetached ? '#94a3b8' : '#475569'} fontWeight="bold">/dev/xvda</text>
                              
                              <text x="40" y="33" textAnchor="middle" fontSize="6" fill={isEbsDetached ? '#ef4444' : '#059669'} fontWeight="extrabold">
                                {isEbsDetached ? '⚠️ DETACHED' : vmState === 'Running' ? '● MOUNT ACTIVE' : '● STANDBY'}
                              </text>
                            </g>
                          )}
                          
                          {/* EBS deleted representation placeholder */}
                          {!isEbsRendered && isEbsPresent && (
                            <g transform="translate(120, 90)">
                              <rect x="0" y="0" width="80" height="38" rx="4" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,3" />
                              <text x="40" y="20" textAnchor="middle" fontSize="8" fill="#ef4444" fontWeight="bold">EBS DELETED</text>
                              <text x="40" y="30" textAnchor="middle" fontSize="6.5" fill="#64748b">(Terminated)</text>
                            </g>
                          )}
 
                           {/* 2. NVMe Ephemeral SSD */}
                          {isNvmePresent && (
                            <g transform="translate(215, 90)" style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.15))' }}>
                              <rect x="0" y="0" width="80" height="38" rx="4" 
                                fill={['Stopped', 'Terminated'].includes(vmState) ? '#1f1315' : '#ffffff'} 
                                stroke={['Stopped', 'Terminated'].includes(vmState) ? '#ef4444' : vmState === 'Running' ? '#10b981' : '#cbd5e1'} 
                                strokeWidth="1.2" 
                              />
                              <rect x="2" y="2" width="76" height="6" rx="1" fill={['Stopped', 'Terminated'].includes(vmState) ? '#ef4444' : '#8b5cf6'} />
                              <text x="40" y="17" textAnchor="middle" fontSize="7" fill={['Stopped', 'Terminated'].includes(vmState) ? '#fca5a5' : '#1e293b'} fontWeight="extrabold">NVMe SSD</text>
                              <text x="40" y="25" textAnchor="middle" fontSize="6" fill="#64748b" fontWeight="bold">/dev/nvme0n1</text>
                              
                              {['Stopped', 'Terminated'].includes(vmState) ? (
                                <g>
                                  {/* flashing alert */}
                                  <rect x="5" y="28" width="70" height="7" rx="1.5" fill="#ef4444">
                                    <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" repeatCount="indefinite" />
                                  </rect>
                                  <text x="40" y="34" textAnchor="middle" fontSize="5.5" fill="#fff" fontWeight="extrabold">WIPED / LOSS</text>
                                </g>
                              ) : (
                                <text x="40" y="34" textAnchor="middle" fontSize="6" fill={vmState === 'Running' ? '#059669' : '#475569'} fontWeight="extrabold">
                                  {vmState === 'Running' ? '⚡ VOLATILE' : 'STANDBY'}
                                </text>
                              )}
                            </g>
                          )}
 
                           {/* If NVMe is not present */}
                          {!isNvmePresent && (
                            <g transform="translate(215, 90)">
                              <rect x="0" y="0" width="80" height="38" rx="4" fill="none" stroke="#1f2937" strokeWidth="1" />
                              <text x="40" y="18" textAnchor="middle" fontSize="7" fill="#475569" fontWeight="bold">No Inst Store</text>
                              <text x="40" y="28" textAnchor="middle" fontSize="6.5" fill="#64748b">(EBS Only)</text>
                            </g>
                          )}
                        </svg>
                      </div>
                    );
                  })()}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '8px', background: 'rgba(255, 255, 255, 0.8)', padding: '6px', borderRadius: '4px', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
                    <span>Compute CPU Meter:</span>
                    <b style={{ color: consoleCpuGauge > 50 ? '#ef4444' : '#10b981' }}>{consoleCpuGauge}%</b>
                  </div>

                  <div ref={consoleTerminalRef} className="ec2-terminal" style={{ flex: 1, minHeight: '140px', background: '#0a0d16' }}>
                    {consoleLogs.map((log, index) => (
                      <div key={index} style={{ 
                        color: log.includes('⚠️') ? '#ef4444' : log.includes('[system]') ? '#10b981' : log.includes('[user-data]') ? '#f59e0b' : '#38bdf8',
                        fontSize: '10px'
                      }}>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* BEST PRACTICES & TROUBLESHOOTING */}
        {activeTab === 'best' && (
          <div>
            <div className="ec2-sec">High Availability Tier-3 Architecture Model</div>
            <div className="ec2-card">
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                Production-grade AWS computing models isolate virtual compute instances inside isolated private subnets. Multi-AZ Auto Scaling groups scale workloads across Availability Zones.
              </div>

              {/* SVG HA Flow */}
              <div style={{ padding: '4px', textAlign: 'center', marginBottom: '14px' }}>
                <svg viewBox="0 0 680 180" width="100%" className="ec2-svg-bg">
                  <defs>
                    <linearGradient id="ha-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                    <linearGradient id="ha-pink-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#ec4899" />
                      <stop offset="100%" stopColor="#be185d" />
                    </linearGradient>
                    <linearGradient id="ha-green-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>

                  {/* PREMIUM SUBNET GROUPS */}
                  {/* Public Internet Client zone */}
                  <rect x="5" y="8" width="110" height="164" rx="8" fill="rgba(16, 185, 129, 0.01)" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="60" y="166" textAnchor="middle" fontSize="6.5" fill="#047857" fontWeight="bold">PUBLIC EDGE PLANE</text>

                  {/* Load Balancer zone */}
                  <rect x="150" y="8" width="120" height="164" rx="8" fill="rgba(59, 130, 246, 0.01)" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="210" y="166" textAnchor="middle" fontSize="6.5" fill="#1d4ed8" fontWeight="bold">BALANCE PLANE</text>

                  {/* VPC Private Subnet Bounding Region */}
                  <rect x="315" y="8" width="180" height="164" rx="8" fill="rgba(219, 39, 119, 0.02)" stroke="#db2777" strokeWidth="1" strokeDasharray="4,3" />
                  <text x="405" y="166" textAnchor="middle" fontSize="6.5" fill="#db2777" fontWeight="bold">🔒 VPC SECURED PRIVATE SUBNETS</text>

                  {/* Shared NAS storage zone */}
                  <rect x="535" y="8" width="140" height="164" rx="8" fill="rgba(5, 150, 105, 0.01)" stroke="rgba(5, 150, 105, 0.2)" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="605" y="166" textAnchor="middle" fontSize="6.5" fill="#059669" fontWeight="bold">STORAGE SAN PLANE</text>

                  {/* Connecting paths */}
                  <path d="M 110, 90 L 160, 90" className="ec2-flow-green" strokeWidth="2" strokeDasharray="3,3" />
                  <path d="M 260, 75 L 330, 55" className="ec2-flow-blue" strokeWidth="2" />
                  <path d="M 260, 105 L 330, 125" className="ec2-flow-blue" strokeWidth="2" />
                  <path d="M 480, 50 L 550, 75" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M 480, 130 L 550, 105" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,3" />

                  {/* Active moving pulses */}
                  <circle r="3.5" fill="#047857">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M 110, 90 L 160, 90" />
                  </circle>
                  <circle r="3.5" fill="#1d4ed8">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 260, 75 L 330, 55" />
                  </circle>
                  <circle r="3.5" fill="#1d4ed8">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 260, 105 L 330, 125" />
                  </circle>
                  <circle r="3.5" fill="#0284c7">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M 480, 50 L 550, 75" />
                  </circle>
                  <circle r="3.5" fill="#0284c7">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M 480, 130 L 550, 105" />
                  </circle>

                  {/* Public Internet */}
                  <g transform="translate(10, 48)" style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.05))' }}>
                    <rect x="0" y="0" width="100" height="70" rx="8" fill="#ffffff" stroke="#047857" strokeWidth="1.5" />
                    <rect x="4" y="4" width="92" height="15" rx="3" fill="url(#ha-green-grad)" />
                    <text x="50" y="14" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">🌐 Internet</text>
                    <text x="50" y="42" textAnchor="middle" fontSize="9.5" fill="#1e293b" fontWeight="bold">Public Clients</text>
                    <text x="50" y="55" textAnchor="middle" fontSize="7" fill="#64748b">(Secure HTTP Traffic)</text>
                  </g>
                  
                  {/* ALB */}
                  <g transform="translate(160, 28)" style={{ filter: 'drop-shadow(0 2px 2px rgba(29,78,216,0.1))' }}>
                    <rect x="0" y="0" width="100" height="110" rx="8" fill="#ffffff" stroke="#1d4ed8" strokeWidth="1.5" />
                    <rect x="4" y="4" width="92" height="15" rx="3" fill="url(#ha-blue-grad)" />
                    <text x="50" y="14" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">🍪 Application LB</text>
                    
                    {/* Cookies / listeners */}
                    <circle cx="25" cy="45" r="4.5" fill="#3b82f6" />
                    <text x="35" y="48" fontSize="7.5" fill="#1e293b" fontWeight="bold">SSL listener</text>
                    <rect x="15" y="65" width="70" height="4" rx="2" fill="#cbd5e1" />
                    <rect x="15" y="75" width="50" height="4" rx="2" fill="#cbd5e1" />
                    <text x="50" y="98" textAnchor="middle" fontSize="8" fill="#1d4ed8" fontWeight="bold">Target Groups</text>
                  </g>

                  {/* Private AZ-A */}
                  <g transform="translate(330, 15)" style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(219,39,119,0.05))' }}>
                    <rect x="0" y="0" width="150" height="70" rx="8" fill="#ffffff" stroke="#db2777" strokeWidth="1.2" />
                    <rect x="4" y="4" width="142" height="15" rx="3" fill="url(#ha-pink-grad)" />
                    <text x="75" y="14" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#fff">🔒 AZ-a (sg-app-fleet)</text>
                    
                    <rect x="15" y="32" width="120" height="16" rx="4" fill="#fdf2f8" stroke="#db2777" strokeWidth="0.8" />
                    <text x="75" y="43" textAnchor="middle" fontSize="8" fill="#9d174d" fontWeight="bold">EC2 Instance (10.0.1.x)</text>
                    <text x="75" y="62" textAnchor="middle" fontSize="6.5" fill="#475569" fontWeight="bold">Healthy in Private Subnet</text>
                  </g>

                  {/* Private AZ-B */}
                  <g transform="translate(330, 85)" style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(219,39,119,0.05))' }}>
                    <rect x="0" y="0" width="150" height="70" rx="8" fill="#ffffff" stroke="#db2777" strokeWidth="1.2" />
                    <rect x="4" y="4" width="142" height="15" rx="3" fill="url(#ha-pink-grad)" />
                    <text x="75" y="14" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#fff">🔒 AZ-b (sg-app-fleet)</text>
                    
                    <rect x="15" y="32" width="120" height="16" rx="4" fill="#fdf2f8" stroke="#db2777" strokeWidth="0.8" />
                    <text x="75" y="43" textAnchor="middle" fontSize="8" fill="#9d174d" fontWeight="bold">EC2 Instance (10.0.2.x)</text>
                    <text x="75" y="62" textAnchor="middle" fontSize="6.5" fill="#475569" fontWeight="bold">Healthy in Private Subnet</text>
                  </g>

                  {/* EFS Mount */}
                  <g transform="translate(545, 48)" style={{ filter: 'drop-shadow(0 2px 2px rgba(5,150,105,0.1))' }}>
                    <rect x="0" y="0" width="120" height="80" rx="8" fill="#ffffff" stroke="#059669" strokeWidth="1.5" />
                    <rect x="4" y="4" width="112" height="15" rx="3" fill="url(#ha-green-grad)" />
                    <text x="60" y="14" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">📁 Shared NAS (EFS)</text>
                    
                    {/* Database disks drawing inside */}
                    <ellipse cx="60" cy="42" rx="16" ry="4" fill="#ecfdf5" stroke="#059669" strokeWidth="0.8" />
                    <path d="M44,42 L44,52 A16,4 0 0,0 76,52 L76,42" fill="#ecfdf5" stroke="#059669" strokeWidth="0.8" />
                    
                    <text x="60" y="70" textAnchor="middle" fontSize="7.5" fill="#047857" fontWeight="bold">Multi-AZ Mount Targets</text>
                  </g>
                </svg>
              </div>
            </div>

            <div className="ec2-sec">EBS vs Instance Store: Core Physical Hardware Architecture</div>
            <div className="ec2-card">
              <div className="ec2-g2">
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>🔌 Physical Bus Connection(Instance Store) vs Network Fabric(EBS)</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '10px', lineHeight: '1.45' }}>
                    - <b>Instance Store (Ephemeral NVMe/SSD):</b> Physical SSD drives inserted directly into the physical host motherboard slots hosting your VM. There is no network overhead, resulting in massive, low-latency IOPS. However, if the hardware fails or the VM stops, hypervisors re-allocate the virtual host to another physical blade server in the pool, and the physical local bus is cleared and formatted, resulting in total data loss.
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.45' }}>
                    - <b>EBS Volume (SAN Block Storage):</b> An independent storage cluster connected to the hypervisor host via a dedicated network link (EBS-Optimized). Since the storage lifecycle is independent of the hypervisor host motherboard, stopping/starting your instance simply detaches the virtual link from one host and attaches it to another with zero data loss.
                  </div>
                </div>

                {/* SVG Comparative Hardware */}
                <div style={{ padding: '4px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>Physical Hypervisor Host vs SAN Storage Architecture</div>
                  <svg viewBox="0 0 450 160" width="100%" className="ec2-svg-bg">
                    <defs>
                      <linearGradient id="host-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f472b6" />
                        <stop offset="100%" stopColor="#db2777" />
                      </linearGradient>
                      <linearGradient id="san-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>

                    {/* PREMIUM SUBNET BOUNDARIES */}
                    {/* Motherboard Host Subnet */}
                    <rect x="5" y="5" width="230" height="150" rx="8" fill="rgba(219, 39, 119, 0.01)" stroke="#db2777" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="120" y="150" textAnchor="middle" fontSize="6" fill="#db2777" fontWeight="bold">💻 HYPERVISOR BLADE ZONE</text>

                    {/* Storage SAN Subnet */}
                    <rect x="250" y="5" width="195" height="150" rx="8" fill="rgba(5, 150, 105, 0.01)" stroke="#059669" strokeWidth="1.2" strokeDasharray="4,2" />
                    <text x="347" y="150" textAnchor="middle" fontSize="6.5" fill="#059669" fontWeight="bold">🔒 SECURED EBS STORAGE SAN</text>

                    {/* Connection paths inside motherboard & outwards */}
                    {/* Local NVMe PCIe path */}
                    <path id="pcie-path" d="M 70, 70 L 70, 100" stroke="#ef4444" strokeWidth="2.5" />
                    {/* VPC Network Outward path */}
                    <path id="vpc-path" d="M 150, 70 L 150, 115 L 280, 115" className="ec2-flow-blue" strokeWidth="2" strokeDasharray="3,2" />

                    {/* Active moving pulses */}
                    <circle r="3" fill="#f43f5e">
                      <animateMotion dur="0.8s" repeatCount="indefinite" path="M 70, 70 L 70, 100" />
                    </circle>
                    <circle r="3" fill="#3b82f6">
                      <animateMotion dur="2.5s" repeatCount="indefinite" path="M 150, 70 L 150, 115 L 280, 115" />
                    </circle>

                    {/* Hypervisor Host Motherboard */}
                    <g transform="translate(15, 15)" style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.05))' }}>
                      <rect x="0" y="0" width="200" height="120" rx="8" fill="#ffffff" stroke="#db2777" strokeWidth="1.5" />
                      <rect x="4" y="4" width="192" height="15" rx="3" fill="url(#host-grad)" />
                      <text x="100" y="14" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#fff">Physical Motherboard (Hypervisor Host)</text>
                    </g>

                    {/* CPU RAM Core */}
                    <g transform="translate(30, 45)" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                      <rect x="0" y="0" width="170" height="28" rx="4" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.2" />
                      <text x="85" y="17" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#1d4ed8">Virtual Guest VM (vCPU &amp; RAM)</text>
                    </g>

                    <text x="76" y="90" fontSize="6.5" fill="#ef4444" fontWeight="extrabold">PCIe Bus</text>

                    {/* Local Instance Store SSD */}
                    <g transform="translate(35, 96)" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                      <rect x="0" y="0" width="80" height="32" rx="4" fill="#fff1f2" stroke="#f43f5e" strokeWidth="1.2" />
                      <text x="40" y="12" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#be123c">Instance Store</text>
                      <text x="40" y="24" textAnchor="middle" fontSize="6" fill="#be123c" fontWeight="extrabold">💥 Ephemeral NVMe</text>
                    </g>

                    <text x="210" y="106" fontSize="7" fill="#2563eb" fontWeight="extrabold">Dedicated SAN Fiber link</text>

                    {/* Remote EBS SAN Cluster */}
                    <g transform="translate(268, 15)" style={{ filter: 'drop-shadow(0 2px 2px rgba(5,150,105,0.1))' }}>
                      <rect x="0" y="0" width="160" height="120" rx="8" fill="#ffffff" stroke="#059669" strokeWidth="1.5" />
                      <rect x="4" y="4" width="152" height="15" rx="3" fill="url(#san-grad)" />
                      <text x="80" y="14" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#fff">EBS Storage SAN Cluster</text>
                      
                      {/* EBS volume cylinders */}
                      <ellipse cx="80" cy="50" rx="30" ry="8" fill="#ecfdf5" stroke="#059669" strokeWidth="0.8" />
                      <path d="M50,50 L50,68 A30,8 0 0,0 110,68 L110,50" fill="#ecfdf5" stroke="#059669" strokeWidth="0.8" />

                      <text x="80" y="94" textAnchor="middle" fontSize="7.5" fill="#047857" fontWeight="bold">✅ Data Persists on VM Stop</text>
                      <text x="80" y="106" textAnchor="middle" fontSize="6.5" fill="#475569" fontWeight="bold">(Network Detached &amp; Detourable)</text>
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            <div className="ec2-sec">EC2 Production Best Practices vs Mistakes</div>
            <div className="ec2-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                Ensure your virtual servers adhere to the AWS Well-Architected Framework. Avoid standard pitfalls by implementing strict access controls, modern metadata protocols, and stateless compute configurations.
              </div>
              <div className="ec2-g2">
                {/* Best Practices */}
                <div style={{ background: '#f0fdf4', padding: '18px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#166534', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✅</span> Mandatory Production Best Practices
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ borderBottom: '1px solid rgba(22, 101, 52, 0.1)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: '#14532d' }}>🔑 IAM Role Authorization</div>
                      <div style={{ fontSize: '11.5px', color: '#166534', lineHeight: '1.45', marginTop: '2px' }}>
                        Attach IAM roles to instances via Instance Profiles. Never hardcode static Access Keys or Secrets within scripts or environment variables.
                      </div>
                    </div>
                    <div style={{ borderBottom: '1px solid rgba(22, 101, 52, 0.1)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: '#14532d' }}>🛡️ Scoped Security Groups</div>
                      <div style={{ fontSize: '11.5px', color: '#166534', lineHeight: '1.45', marginTop: '2px' }}>
                        Always whitelist specific Security Group IDs or narrow, trusted CIDR blocks. Adhere strictly to the Principle of Least Privilege.
                      </div>
                    </div>
                    <div style={{ borderBottom: '1px solid rgba(22, 101, 52, 0.1)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: '#14532d' }}>🚀 Elastic Multi-AZ Scaling</div>
                      <div style={{ fontSize: '11.5px', color: '#166534', lineHeight: '1.45', marginTop: '2px' }}>
                        Scale compute nodes horizontally across multiple Availability Zones inside private subnets, fronted by an Application Load Balancer.
                      </div>
                    </div>
                    <div style={{ borderBottom: '1px solid rgba(22, 101, 52, 0.1)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: '#14532d' }}>🔒 IMDSv2 Token Protection</div>
                      <div style={{ fontSize: '11.5px', color: '#166534', lineHeight: '1.45', marginTop: '2px' }}>
                        Enforce session-oriented Instance Metadata Service v2 (IMDSv2) with hop limit 1 to fully mitigate SSRF credential extraction exploits.
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: '#14532d' }}>💾 Stateless Decoupled Storage</div>
                      <div style={{ fontSize: '11.5px', color: '#166534', lineHeight: '1.45', marginTop: '2px' }}>
                        Keep EC2 instances completely stateless. Store all persistent transactional data on decoupled network volumes (EBS, shared EFS, or S3).
                      </div>
                    </div>
                  </div>
                </div>

                {/* Common Mistakes */}
                <div style={{ background: '#fef2f2', padding: '18px', borderRadius: '10px', border: '1px solid #fecaca' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#991b1b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>❌</span> Critical Production Mistakes
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ borderBottom: '1px solid rgba(153, 27, 27, 0.1)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: '#7f1d1d' }}>🔓 Wildcard SSH Exposure</div>
                      <div style={{ fontSize: '11.5px', color: '#991b1b', lineHeight: '1.45', marginTop: '2px' }}>
                        Opening Port 22 inbound from wildcard <code style={{ background: 'rgba(153, 27, 27, 0.05)', padding: '1px 4px', borderRadius: '3px' }}>0.0.0.0/0</code>, exposing server consoles to relentless global brute-force attacks.
                      </div>
                    </div>
                    <div style={{ borderBottom: '1px solid rgba(153, 27, 27, 0.1)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: '#7f1d1d' }}>💥 Ephemeral Data Volatility</div>
                      <div style={{ fontSize: '11.5px', color: '#991b1b', lineHeight: '1.45', marginTop: '2px' }}>
                        Storing primary databases or critical logs on local physical Instance Stores. All data is completely formatted if the instance stops.
                      </div>
                    </div>
                    <div style={{ borderBottom: '1px solid rgba(153, 27, 27, 0.1)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: '#7f1d1d' }}>🔑 User Data Credential Leak</div>
                      <div style={{ fontSize: '11.5px', color: '#991b1b', lineHeight: '1.45', marginTop: '2px' }}>
                        Writing plain-text database passwords, API tokens, or SSH private keys inside bootstrapping scripts, which are globally readable via metadata.
                      </div>
                    </div>
                    <div style={{ borderBottom: '1px solid rgba(153, 27, 27, 0.1)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: '#7f1d1d' }}>🗑️ Orphaned Volumes Accumulation</div>
                      <div style={{ fontSize: '11.5px', color: '#991b1b', lineHeight: '1.45', marginTop: '2px' }}>
                        Disabling "Delete on Termination" for root or short-term block volumes, causing orphaned, unattached EBS drives to quietly inflate cloud bills.
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: '#7f1d1d' }}>🪪 Vulnerable IMDSv1 Legacy</div>
                      <div style={{ fontSize: '11.5px', color: '#991b1b', lineHeight: '1.45', marginTop: '2px' }}>
                        Allowing unauthenticated IMDSv1 queries, which lets attackers utilize Server-Side Request Forgery to harvest IAM instance profile credentials.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
