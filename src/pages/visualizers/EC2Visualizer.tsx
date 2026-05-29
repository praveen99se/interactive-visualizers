import { useState, useEffect, useRef } from 'react';

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
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'purchasing' | 'storage' | 'lifecycle' | 'best'>('overview');

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
        .ec2-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-tertiary, #e2e8f0); padding-bottom: 10px; }
        .ec2-tb { padding: 6px 14px; border-radius: var(--border-radius-lg, 12px); border: 0.5px solid var(--color-border-secondary, #cbd5e1); font-size: 12px; cursor: pointer; background: var(--color-background-secondary, #f8fafc); color: var(--color-text-secondary, #475569); transition: all 0.15s; outline: none; font-weight: 500; }
        .ec2-tb:hover { background: var(--color-background-tertiary, #f1f5f9); }
        .ec2-tb.ec2-on { background: #16a34a; color: #fff; border-color: #16a34a; font-weight: 500; }
        .ec2-card { border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 14px 16px; background: var(--color-background-primary); margin-bottom: 12px; font-size: 13px; line-height: 1.5; }
        .ec2-sec { font-size: 12.5px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .05em; margin: 16px 0 8px; }
        .ec2-sec:first-child { margin-top: 0; }
        .ec2-g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .ec2-g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
        .ec2-kv { display: flex; gap: 8px; font-size: 13px; margin: 6px 0; align-items: baseline; }
        .ec2-kk { min-width: 160px; color: var(--color-text-secondary); flex-shrink: 0; }
        .ec2-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 500; }
        .ec2-btn { font-size: 13px; padding: 5px 12px; border-radius: 6px; border: 0.5px solid var(--color-border-secondary); background: var(--color-background-primary); color: var(--color-text-primary); cursor: pointer; transition: all 0.15s; outline: none; }
        .ec2-btn:hover { background: var(--color-background-secondary); }
        .ec2-btn.ec2-on { background: #0284c7; color: #fff; border-color: #0284c7; }
        .ec2-terminal { background: #0f172a; color: #38bdf8; font-family: monospace; font-size: 12px; padding: 12px; border-radius: 8px; border: 0.5px solid #334155; max-height: 200px; overflow-y: auto; white-space: pre-wrap; line-height: 1.45; }
        
        /* Unified Dropdown Selection Visual Cues */
        .ec2-card select {
          border: 2px solid #f59e0b !important;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.2) !important;
          outline: none;
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
                <div style={{ background: 'var(--color-background-secondary)', padding: '12px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>AMI Baking &amp; Auto-Scaling Launch Pipeline</div>
                  <svg viewBox="0 0 450 150" width="100%" style={{ background: 'var(--color-background-primary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                    <defs>
                      <marker id="arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#94a3b8"/></marker>
                    </defs>
                    {/* Source VM */}
                    <rect x="10" y="45" width="80" height="60" rx="4" fill="#eff6ff" stroke="#1e40af" strokeWidth="1" />
                    <text x="50" y="75" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1e40af">Source EC2</text>
                    <text x="50" y="90" textAnchor="middle" fontSize="7" fill="#64748b">(Configured Host)</text>

                    <path d="M90,75 L125,75" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />

                    {/* Snapshot */}
                    <rect x="125" y="45" width="80" height="60" rx="4" fill="#fdf2f8" stroke="#9d174d" strokeWidth="1" />
                    <text x="165" y="75" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#9d174d">Snapshot</text>
                    <text x="165" y="90" textAnchor="middle" fontSize="7" fill="#64748b">(Root EBS copy)</text>

                    <path d="M205,75 L240,75" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />

                    {/* Golden AMI */}
                    <rect x="240" y="45" width="80" height="60" rx="4" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
                    <text x="280" y="70" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#d97706">Golden AMI</text>
                    <text x="280" y="82" textAnchor="middle" fontSize="7" fill="#64748b">(Baked Image)</text>
                    <text x="280" y="94" textAnchor="middle" fontSize="6" fill="#10b981" fontWeight="bold">Ready for Launch</text>

                    <path d="M320,75 L355,55" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />
                    <path d="M320,75 L355,95" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrow)" />

                    {/* Scaling Replicas */}
                    <rect x="355" y="20" width="80" height="40" rx="3" fill="#f0fdf4" stroke="#166534" strokeWidth="0.8" />
                    <text x="395" y="40" textAnchor="middle" fontSize="8" fill="#166534">EC2 Replica 1</text>
                    <rect x="355" y="80" width="80" height="40" rx="3" fill="#f0fdf4" stroke="#166534" strokeWidth="0.8" />
                    <text x="395" y="100" textAnchor="middle" fontSize="8" fill="#166534">EC2 Replica 2</text>
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
                  <div style={{ flex: 1, border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '120px' }}>
                    {sendingPacket ? (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ animation: 'bounce 1s infinite', fontSize: '24px' }}>✉️</div>
                        <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '6px', fontWeight: 600 }}>Analyzing Ingress Security Headers...</div>
                      </div>
                    ) : firewallTestResult ? (
                      <div style={{ width: '100%', textAlign: 'center' }}>
                        <span className="ec2-badge" style={{ 
                          background: firewallTestResult.status === 'ALLOW' ? '#10b981' : '#ef4444', 
                          color: '#fff', 
                          fontSize: '11px',
                          marginBottom: '8px',
                          fontWeight: 'bold'
                        }}>
                          {firewallTestResult.status}
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-primary)', lineHeight: '1.45', padding: '0 8px' }}>
                          {firewallTestResult.msg}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#64748b', textAlign: 'center' }}>
                        No packet transmission active. Click one of the source nodes above to fire a TCP test packet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="ec2-sec">EC2 Instance Placement Groups Architectures</div>
            <div className="ec2-card">
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
                Placement Groups control the physical distribution logic of your EC2 instances within the AWS underlying physical hardware backplane.
              </div>

              <div className="ec2-g3">
                {/* Cluster PG */}
                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>📍</span> Cluster Placement Group
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '10px', flex: 1 }}>
                    Packs instances close together inside a **single Availability Zone** on the same physical server rack. Provides ultra-low latency and maximum inter-node throughput (up to 100 Gbps).
                  </div>

                  {/* SVG Cluster */}
                  <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: '6px', padding: '6px', textAlign: 'center', marginBottom: '10px' }}>
                    <svg viewBox="0 0 200 110" width="100%">
                      <rect x="10" y="5" width="180" height="100" rx="4" fill="none" stroke="#f59e0b" strokeWidth="1" strokeDasharray="2,2" />
                      <text x="100" y="18" textAnchor="middle" fontSize="7" fill="#f59e0b" fontWeight="600">Single AZ Rack Boundary</text>
                      
                      {/* Top Switch */}
                      <rect x="50" y="26" width="100" height="20" rx="3" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
                      <text x="100" y="38" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#d97706">⚡ 100Gbps Local Switch</text>

                      {/* Clustered EC2 nodes */}
                      <rect x="25" y="66" width="40" height="24" rx="2" fill="#eff6ff" stroke="#1e40af" strokeWidth="0.8" />
                      <text x="45" y="80" textAnchor="middle" fontSize="7" fill="#1e40af">EC2-A</text>
                      
                      <rect x="80" y="66" width="40" height="24" rx="2" fill="#eff6ff" stroke="#1e40af" strokeWidth="0.8" />
                      <text x="100" y="80" textAnchor="middle" fontSize="7" fill="#1e40af">EC2-B</text>

                      <rect x="135" y="66" width="40" height="24" rx="2" fill="#eff6ff" stroke="#1e40af" strokeWidth="0.8" />
                      <text x="155" y="80" textAnchor="middle" fontSize="7" fill="#1e40af">EC2-C</text>

                      {/* Connections */}
                      <path d="M45,66 L70,46" stroke="#94a3b8" strokeWidth="1" />
                      <path d="M100,66 L100,46" stroke="#94a3b8" strokeWidth="1" />
                      <path d="M155,66 L130,46" stroke="#94a3b8" strokeWidth="1" />
                    </svg>
                  </div>
                  <span className="ec2-badge" style={{ background: '#f59e0b', color: '#fff', fontSize: '9px', textAlign: 'center' }}>Best for: High Performance Compute (HPC)</span>
                </div>

                {/* Spread PG */}
                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>📍</span> Spread Placement Group
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '10px', flex: 1 }}>
                    Maps each instance onto **strictly different physical hardware power racks**, separate switches, and isolated power sources. Maximum safety boundary: 7 instances per AZ.
                  </div>

                  {/* SVG Spread */}
                  <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: '6px', padding: '6px', textAlign: 'center', marginBottom: '10px' }}>
                    <svg viewBox="0 0 200 110" width="100%">
                      {/* Rack 1 */}
                      <rect x="15" y="10" width="45" height="90" rx="3" fill="none" stroke="#10b981" strokeWidth="1" />
                      <text x="37" y="22" textAnchor="middle" fontSize="6" fill="#10b981" fontWeight="bold">Rack A</text>
                      <rect x="22" y="32" width="30" height="18" rx="2" fill="#eff6ff" stroke="#1e40af" strokeWidth="0.8" />
                      <text x="37" y="43" textAnchor="middle" fontSize="7" fill="#1e40af">EC2-1</text>
                      <text x="37" y="68" textAnchor="middle" fontSize="6" fill="#047857">🔋 Power-A</text>
                      <text x="37" y="82" textAnchor="middle" fontSize="6" fill="#047857">🔌 Net-A</text>

                      {/* Rack 2 */}
                      <rect x="77" y="10" width="45" height="90" rx="3" fill="none" stroke="#10b981" strokeWidth="1" />
                      <text x="99" y="22" textAnchor="middle" fontSize="6" fill="#10b981" fontWeight="bold">Rack B</text>
                      <rect x="84" y="32" width="30" height="18" rx="2" fill="#eff6ff" stroke="#1e40af" strokeWidth="0.8" />
                      <text x="99" y="43" textAnchor="middle" fontSize="7" fill="#1e40af">EC2-2</text>
                      <text x="99" y="68" textAnchor="middle" fontSize="6" fill="#047857">🔋 Power-B</text>
                      <text x="99" y="82" textAnchor="middle" fontSize="6" fill="#047857">🔌 Net-B</text>

                      {/* Rack 3 */}
                      <rect x="140" y="10" width="45" height="90" rx="3" fill="none" stroke="#10b981" strokeWidth="1" />
                      <text x="162" y="22" textAnchor="middle" fontSize="6" fill="#10b981" fontWeight="bold">Rack C</text>
                      <rect x="147" y="32" width="30" height="18" rx="2" fill="#eff6ff" stroke="#1e40af" strokeWidth="0.8" />
                      <text x="162" y="43" textAnchor="middle" fontSize="7" fill="#1e40af">EC2-3</text>
                      <text x="162" y="68" textAnchor="middle" fontSize="6" fill="#047857">🔋 Power-C</text>
                      <text x="162" y="82" textAnchor="middle" fontSize="6" fill="#047857">🔌 Net-C</text>
                    </svg>
                  </div>
                  <span className="ec2-badge" style={{ background: '#10b981', color: '#fff', fontSize: '9px', textAlign: 'center' }}>Best for: Domain Controllers, Core Apps</span>
                </div>

                {/* Partition PG */}
                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '6px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>📍</span> Partition Placement Group
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '10px', flex: 1 }}>
                    Divides placement into isolated partitions. Racks in one partition do not share hardware with racks in other partitions. Allows multiple nodes in a single partition.
                  </div>

                  {/* SVG Partition */}
                  <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: '6px', padding: '6px', textAlign: 'center', marginBottom: '10px' }}>
                    <svg viewBox="0 0 200 110" width="100%">
                      {/* Partition 1 */}
                      <rect x="10" y="10" width="85" height="90" rx="3" fill="none" stroke="#0284c7" strokeWidth="1" />
                      <text x="52" y="22" textAnchor="middle" fontSize="7" fill="#0284c7" fontWeight="bold">Partition 1 (Rack A)</text>
                      <rect x="18" y="34" width="30" height="18" rx="2" fill="#eff6ff" stroke="#1e40af" strokeWidth="0.8" />
                      <text x="33" y="45" textAnchor="middle" fontSize="6" fill="#1e40af">EC2-A1</text>
                      <rect x="58" y="34" width="30" height="18" rx="2" fill="#eff6ff" stroke="#1e40af" strokeWidth="0.8" />
                      <text x="73" y="45" textAnchor="middle" fontSize="6" fill="#1e40af">EC2-A2</text>
                      <rect x="38" y="62" width="30" height="18" rx="2" fill="#eff6ff" stroke="#1e40af" strokeWidth="0.8" />
                      <text x="53" y="73" textAnchor="middle" fontSize="6" fill="#1e40af">EC2-A3</text>

                      {/* Partition 2 */}
                      <rect x="105" y="10" width="85" height="90" rx="3" fill="none" stroke="#0284c7" strokeWidth="1" strokeDasharray="2,2" />
                      <text x="147" y="22" textAnchor="middle" fontSize="7" fill="#0284c7" fontWeight="bold">Partition 2 (Rack B)</text>
                      <rect x="113" y="34" width="30" height="18" rx="2" fill="#eff6ff" stroke="#1e40af" strokeWidth="0.8" />
                      <text x="128" y="45" textAnchor="middle" fontSize="6" fill="#1e40af">EC2-B1</text>
                      <rect x="153" y="34" width="30" height="18" rx="2" fill="#eff6ff" stroke="#1e40af" strokeWidth="0.8" />
                      <text x="168" y="45" textAnchor="middle" fontSize="6" fill="#1e40af">EC2-B2</text>
                      <rect x="133" y="62" width="30" height="18" rx="2" fill="#eff6ff" stroke="#1e40af" strokeWidth="0.8" />
                      <text x="148" y="73" textAnchor="middle" fontSize="6" fill="#1e40af">EC2-B3</text>
                    </svg>
                  </div>
                  <span className="ec2-badge" style={{ background: '#0284c7', color: '#fff', fontSize: '9px', textAlign: 'center' }}>Best for: Kafka, HDFS, Cassandra</span>
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
                  <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: '6px', padding: '10px', textAlign: 'center', marginBottom: '8px' }}>
                    <svg viewBox="0 0 320 120" width="100%">
                      <defs>
                        <marker id="storage-arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#94a3b8"/></marker>
                      </defs>
                      
                      {/* EFS Standard */}
                      <rect x="5" y="25" width="80" height="50" rx="3" fill="#ecfdf5" stroke="#059669" strokeWidth="1" />
                      <text x="45" y="42" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#059669">EFS Standard</text>
                      <text x="45" y="55" textAnchor="middle" fontSize="6.5" fill="#64748b">(Frequent Access)</text>
                      <text x="45" y="68" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#111827">$0.30 / GB</text>

                      <path d="M85,50 L115,50" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3,2" markerEnd="url(#storage-arrow)" />

                      {/* EFS Infrequent Access */}
                      <rect x="115" y="25" width="85" height="50" rx="3" fill="#eff6ff" stroke="#2563eb" strokeWidth="1" />
                      <text x="157.5" y="42" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#2563eb">EFS IA</text>
                      <text x="157.5" y="55" textAnchor="middle" fontSize="6.5" fill="#64748b">(Idle {efsLifecycleDays} Days)</text>
                      <text x="157.5" y="68" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#111827">$0.025 / GB</text>

                      <path d="M200,50 L230,50" stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="3,2" markerEnd="url(#storage-arrow)" />

                      {/* EFS Archive */}
                      <rect x="230" y="25" width="85" height="50" rx="3" fill="#f5f3ff" stroke="#7c3aed" strokeWidth="1" />
                      <text x="272.5" y="42" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#7c3aed">EFS Archive</text>
                      <text x="272.5" y="55" textAnchor="middle" fontSize="6.5" fill="#64748b">(Idle 90+ Days)</text>
                      <text x="272.5" y="68" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#111827">$0.008 / GB</text>

                      <text x="160" y="95" textAnchor="middle" fontSize="7.5" fill="#059669" fontWeight="600">Savings: ~92% Cost Reduction on Cold Tiers</text>
                    </svg>
                  </div>
                </div>

                {/* EBS Multi-Attach & Encryption */}
                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-primary)' }}>💾 EBS Multi-Attach (io1/io2) &amp; KMS Encryption</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '10px', flex: 1 }}>
                    - <b>EBS Multi-Attach:</b> Enables mounting a single high-performance **Provisioned IOPS (io1 or io2)** volume concurrently to up to 16 Nitro-based EC2 instances within the *same* AZ. Requires a cluster-aware filesystem (e.g. GFS2) to prevent data corruption.
                    <br />- <b>Hypervisor-level Encryption:</b> EBS utilizes **AWS KMS Keys (AES-256)** to encrypt data in transit between compute hosts and storage fabrics, data at rest, and all snapshots automatically.
                  </div>

                  {/* SVG Multiattach & Encryption */}
                  <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: '6px', padding: '10px', textAlign: 'center', marginBottom: '8px' }}>
                    <svg viewBox="0 0 320 120" width="100%">
                      {/* EC2 instances */}
                      <rect x="10" y="10" width="60" height="24" rx="2" fill="#eff6ff" stroke="#1e40af" strokeWidth="0.8" />
                      <text x="40" y="24" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#1e40af">EC2 Host A</text>

                      <rect x="10" y="48" width="60" height="24" rx="2" fill="#eff6ff" stroke="#1e40af" strokeWidth="0.8" />
                      <text x="40" y="62" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#1e40af">EC2 Host B</text>

                      <rect x="10" y="86" width="60" height="24" rx="2" fill="#eff6ff" stroke="#1e40af" strokeWidth="0.8" />
                      <text x="40" y="100" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#1e40af">EC2 Host C</text>

                      {/* Arrows pointing to shared volume */}
                      <path d="M70,22 L160,50" stroke="#0284c7" strokeWidth="1" strokeDasharray="2,1" />
                      <path d="M70,60 L160,60" stroke="#0284c7" strokeWidth="1" strokeDasharray="2,1" />
                      <path d="M70,98 L160,70" stroke="#0284c7" strokeWidth="1" strokeDasharray="2,1" />

                      {/* Shared KMS Encrypted EBS */}
                      <rect x="160" y="30" width="150" height="60" rx="4" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.2" />
                      <text x="235" y="46" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ef4444">Shared EBS io1/io2 Volume</text>
                      <text x="235" y="58" textAnchor="middle" fontSize="6.5" fill="#ef4444" fontWeight="600">⛓️ Multi-Attach Enabled (Same AZ)</text>
                      <text x="235" y="72" textAnchor="middle" fontSize="6.5" fill="#b91c1c" fontWeight="bold">🔒 Encrypted: KMS AES-256</text>
                      <text x="235" y="82" textAnchor="middle" fontSize="6" fill="#64748b">(In-Transit &amp; At-Rest)</text>
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
                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>🖥️ Virtual Hypervisor Status:</span>
                    <span className="ec2-badge" style={{ 
                      background: vmState === 'Running' ? '#10b981' : vmState === 'Stopped' ? '#ef4444' : vmState === 'Terminated' ? '#64748b' : '#eab308', 
                      color: '#fff',
                      fontWeight: 'bold',
                      fontSize: '10px'
                    }}>{vmState.toUpperCase()}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', marginBottom: '8px', background: 'var(--color-background-primary)', padding: '6px', borderRadius: '4px' }}>
                    <span>Compute CPU Meter:</span>
                    <b style={{ color: consoleCpuGauge > 50 ? '#ef4444' : '#10b981' }}>{consoleCpuGauge}%</b>
                  </div>

                  <div ref={consoleTerminalRef} className="ec2-terminal" style={{ flex: 1, minHeight: '130px', background: '#090e1a' }}>
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
              <div style={{ background: 'var(--color-background-secondary)', padding: '12px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)', textAlign: 'center', marginBottom: '14px' }}>
                <svg viewBox="0 0 680 180" width="100%" style={{ background: 'var(--color-background-primary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                  {/* Public Internet */}
                  <rect x="10" y="60" width="100" height="60" rx="6" fill="#f0fdf4" stroke="#166534" strokeWidth="1" />
                  <text x="60" y="95" textAnchor="middle" fontSize="11" fontWeight="600" fill="#166534">🌐 Internet</text>
                  
                  <path d="M110,90 L160,90" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3,3" />
                  
                  {/* ALB */}
                  <rect x="160" y="40" width="100" height="100" rx="6" fill="#eff6ff" stroke="#1e40af" strokeWidth="1" />
                  <text x="210" y="85" textAnchor="middle" fontSize="11" fontWeight="600" fill="#1e40af">🍪 ALB</text>
                  <text x="210" y="105" textAnchor="middle" fontSize="9" fill="#1e40af">(Port 80/443)</text>

                  <path d="M260,75 L330,55" stroke="#94a3b8" strokeWidth="1.5" />
                  <path d="M260,105 L330,125" stroke="#94a3b8" strokeWidth="1.5" />

                  {/* Private AZ-A */}
                  <rect x="330" y="15" width="150" height="70" rx="6" fill="#fdf2f8" stroke="#9d174d" strokeWidth="1" />
                  <text x="405" y="40" textAnchor="middle" fontSize="10" fontWeight="600" fill="#9d174d">🔒 AZ-a (EC2 sg-app)</text>
                  <text x="405" y="60" textAnchor="middle" fontSize="9" fill="#9d174d">Private IP: 10.0.1.x</text>

                  {/* Private AZ-B */}
                  <rect x="330" y="95" width="150" height="70" rx="6" fill="#fdf2f8" stroke="#9d174d" strokeWidth="1" />
                  <text x="405" y="120" textAnchor="middle" fontSize="10" fontWeight="600" fill="#9d174d">🔒 AZ-b (EC2 sg-app)</text>
                  <text x="405" y="140" textAnchor="middle" fontSize="9" fill="#9d174d">Private IP: 10.0.2.x</text>

                  <path d="M480,50 L550,75" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M480,130 L550,105" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3,3" />

                  {/* EFS Mount */}
                  <rect x="550" y="55" width="110" height="70" rx="6" fill="#ecfdf5" stroke="#065f46" strokeWidth="1" />
                  <text x="605" y="85" textAnchor="middle" fontSize="11" fontWeight="600" fill="#065f46">📁 Shared EFS</text>
                  <text x="605" y="105" textAnchor="middle" fontSize="9" fill="#065f46">Multi-AZ NAS Mount</text>
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
                <div style={{ background: 'var(--color-background-secondary)', padding: '12px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Physical Hypervisor Host vs SAN Storage Architecture</div>
                  <svg viewBox="0 0 450 160" width="100%" style={{ background: 'var(--color-background-primary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                    {/* Hypervisor Host Motherboard */}
                    <rect x="10" y="10" width="200" height="140" rx="6" fill="#fdf2f8" stroke="#9d174d" strokeWidth="1" />
                    <text x="110" y="24" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#9d174d">Physical Host Motherboard (Hypervisor)</text>

                    {/* CPU RAM Core */}
                    <rect x="25" y="40" width="170" height="30" rx="3" fill="#eff6ff" stroke="#1e40af" strokeWidth="1" />
                    <text x="110" y="58" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#1e40af">Virtual EC2 Guest VM (CPU &amp; RAM)</text>

                    {/* Local NVMe Bus Connection */}
                    <path d="M70,70 L70,100" stroke="#f43f5e" strokeWidth="2.5" />
                    <text x="76" y="88" fontSize="6.5" fill="#f43f5e" fontWeight="bold">Direct PCIe bus</text>

                    {/* Local Instance Store SSD */}
                    <rect x="30" y="100" width="80" height="35" rx="3" fill="#ffe4e6" stroke="#f43f5e" strokeWidth="1.2" />
                    <text x="70" y="116" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#be123c">Instance Store</text>
                    <text x="70" y="128" textAnchor="middle" fontSize="6.5" fill="#be123c">💥 Ephemeral SSD</text>

                    {/* Network link outwards */}
                    <path d="M150,70 L150,110 L280,110" fill="none" stroke="#2563eb" strokeWidth="2" strokeDasharray="3,2" />
                    <text x="210" y="104" fontSize="7" fill="#2563eb" fontWeight="bold">VPC Network Fabric</text>

                    {/* Remote EBS SAN Cluster */}
                    <rect x="280" y="25" width="160" height="110" rx="6" fill="#f0fdf4" stroke="#166534" strokeWidth="1.2" />
                    <text x="360" y="42" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#166534">EBS Dedicated Storage Cluster (SAN)</text>

                    <rect x="295" y="60" width="130" height="30" rx="3" fill="#ecfdf5" stroke="#059669" strokeWidth="0.8" />
                    <text x="360" y="78" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#059669">EBS Volume Container</text>
                    
                    <text x="360" y="112" textAnchor="middle" fontSize="7" fill="#15803d">✅ Data Persists on Stop/Terminate</text>
                    <text x="360" y="124" textAnchor="middle" fontSize="6.5" fill="#64748b">(Network Detach &amp; Re-attachable)</text>
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
