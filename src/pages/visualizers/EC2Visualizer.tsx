import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Copy,
  Zap,
  Sliders,
  Globe,
  Search,
  CheckCircle2,
  Cpu,
  Layers,
  Sparkles,
  X,
  LayoutGrid,
  Table as TableIcon,
  ShieldCheck,
  HardDrive,
  Terminal,
  DollarSign,
  Lightbulb,
  Server,
  Activity,
  Lock
} from 'lucide-react';
import EC2ComparativeView from '../../components/visualizers/EC2ComparativeView';
import UniqueComputeFeatures from '../../components/visualizers/UniqueComputeFeatures';

// Types & Configs for EC2 Visualizer
export interface SampleInstanceType {
  name: string;
  vcpu: number;
  ramGiB: number;
  storage: string;
  network: string;
  hourlyEst: string;
  useCase: string;
}

export interface InstanceFamily {
  id: string;
  name: string;
  category: 'general' | 'compute' | 'memory' | 'storage' | 'gpu';
  classCode: string;
  prefixList: string[];
  ratio: string;
  ratioScore: number;
  vcpuRange: string;
  ramRange: string;
  networkBandwidth: string;
  ebsBandwidth: string;
  storageType: string;
  storageBadge: string;
  hardwareTech: string;
  keyDifferentiator: string;
  useCase: string;
  idealFor: string[];
  tradeoffs: string[];
  icon: string;
  desc: string;
  themeColor: string;
  accentBg: string;
  cloudEquivalents: {
    aws: string;
    azure: string;
    gcp: string;
  };
  sampleInstances: SampleInstanceType[];
}

const INSTANCE_FAMILIES: Record<string, InstanceFamily> = {
  general: {
    id: 'general',
    name: 'General Purpose (t3, m6g, m7i)',
    category: 'general',
    classCode: 'T / M',
    prefixList: ['t3', 't4g', 'm6g', 'm6i', 'm7g', 'm7i', 'm7a'],
    ratio: '4:1 (Balanced)',
    ratioScore: 4,
    vcpuRange: '2 to 128 vCPUs',
    ramRange: '0.5 GiB to 512 GiB',
    networkBandwidth: 'Up to 25 Gbps (ENA)',
    ebsBandwidth: 'Up to 20 Gbps',
    storageType: 'EBS-Optimized (NVMe on "d" variants)',
    storageBadge: 'EBS / Local NVMe',
    hardwareTech: 'Graviton2/3/4, Intel Xeon 4th Gen, AMD EPYC 4th Gen',
    keyDifferentiator: 'Balanced CPU-to-Memory ratio (4 GiB per vCPU) + Burstable CPU Credit mechanism on T-series for cost efficiency.',
    useCase: 'Standard web servers, microservices backends, test/dev pipelines, caching fleets, enterprise apps.',
    idealFor: ['Web & App Servers', 'Microservices Fleets', 'Small-to-Medium Databases', 'Development & CI/CD Pipelines'],
    tradeoffs: ['Burstable T-series can throttle if CPU credits deplete under continuous load', 'Not cost-optimal for memory-only or GPU workloads'],
    icon: '💻',
    desc: 'Balanced resource allocation across compute, memory, and networking. Features burstable T-series (accumulates CPU credits when idle) and sustained M-series for steady enterprise production.',
    themeColor: '#0284c7',
    accentBg: 'rgba(2, 132, 199, 0.1)',
    cloudEquivalents: {
      aws: 't4g, t3, m6g, m7i, m7a',
      azure: 'B-series, Dsv5, Dasv5, Dpsv5',
      gcp: 'E2, N2, N2D, N4, Tau T2D'
    },
    sampleInstances: [
      { name: 't4g.nano', vcpu: 2, ramGiB: 0.5, storage: 'EBS-Only', network: 'Up to 5 Gbps', hourlyEst: '~$0.0042/hr', useCase: 'Low-traffic microservice / IoT telemetry' },
      { name: 't3.medium', vcpu: 2, ramGiB: 4.0, storage: 'EBS-Only', network: 'Up to 5 Gbps', hourlyEst: '~$0.0416/hr', useCase: 'Standard web frontend / dev environment' },
      { name: 'm7g.xlarge', vcpu: 4, ramGiB: 16.0, storage: 'EBS-Only', network: 'Up to 12.5 Gbps', hourlyEst: '~$0.1632/hr', useCase: 'Production microservice cluster / Graviton3' },
      { name: 'm7i.8xlarge', vcpu: 32, ramGiB: 128.0, storage: 'EBS-Only', network: 'Up to 25 Gbps', hourlyEst: '~$1.4208/hr', useCase: 'High-throughput enterprise backend API' }
    ]
  },
  compute: {
    id: 'compute',
    name: 'Compute Optimized (c6g, c7i, c8g)',
    category: 'compute',
    classCode: 'C',
    prefixList: ['c6g', 'c6i', 'c7g', 'c7i', 'c7a', 'c8g'],
    ratio: '2:1 (Compute-Dominant)',
    ratioScore: 2,
    vcpuRange: '2 to 192 vCPUs',
    ramRange: '4 GiB to 384 GiB',
    networkBandwidth: 'Up to 100 Gbps',
    ebsBandwidth: 'Up to 80 Gbps',
    storageType: 'EBS-Optimized (Local NVMe SSD on "d" variants)',
    storageBadge: 'EBS / Local NVMe',
    hardwareTech: 'AWS Graviton3/4, Intel Xeon Platinum (3.8 GHz Turbo), AMD EPYC 9004',
    keyDifferentiator: 'Highest raw clock speeds and lowest price-per-vCPU. 2 GiB memory per vCPU core avoids paying for unused RAM.',
    useCase: 'High-performance web apps, scientific compute, dedicated game servers, video rendering, machine learning inference.',
    idealFor: ['Batch Processing & Transcoding', 'Scientific Modeling & HPC', 'Multiplayer Dedicated Game Servers', 'High-Traffic Web Servers'],
    tradeoffs: ['Low RAM:vCPU ratio (2:1) can cause Out-Of-Memory errors if applications cache heavily in RAM'],
    icon: '⚡',
    desc: 'Engineered for compute-bound applications that demand raw thread execution speed. Delivers leading price-to-performance ratio without over-provisioning memory.',
    themeColor: '#ea580c',
    accentBg: 'rgba(234, 88, 12, 0.1)',
    cloudEquivalents: {
      aws: 'c6g, c7i, c8g, c7a',
      azure: 'Fsv2, FX-series',
      gcp: 'C2, C2D, C3, C3D'
    },
    sampleInstances: [
      { name: 'c7g.medium', vcpu: 1, ramGiB: 2.0, storage: 'EBS-Only', network: 'Up to 12.5 Gbps', hourlyEst: '~$0.0361/hr', useCase: 'Lightweight CPU worker / Queue consumer' },
      { name: 'c6i.xlarge', vcpu: 4, ramGiB: 8.0, storage: 'EBS-Only', network: 'Up to 12.5 Gbps', hourlyEst: '~$0.1700/hr', useCase: 'CI/CD Build & Test Runner Node' },
      { name: 'c7i.4xlarge', vcpu: 16, ramGiB: 32.0, storage: 'EBS-Only', network: 'Up to 12.5 Gbps', hourlyEst: '~$0.7104/hr', useCase: 'Video Transcoding & High-Load API gateway' },
      { name: 'c7a.16xlarge', vcpu: 64, ramGiB: 128.0, storage: 'EBS-Only', network: 'Up to 25 Gbps', hourlyEst: '~$3.3280/hr', useCase: 'HPC & Parallel Batch Simulation Grid' }
    ]
  },
  memory: {
    id: 'memory',
    name: 'Memory Optimized (r6g, r7i, x2gd, z1d)',
    category: 'memory',
    classCode: 'R / X / Z / U',
    prefixList: ['r6g', 'r7g', 'r7i', 'x2gd', 'x2idn', 'z1d', 'u-series'],
    ratio: '8:1 to 32:1 (Memory-Heavy)',
    ratioScore: 8,
    vcpuRange: '2 to 448 vCPUs',
    ramRange: '16 GiB to 24,576 GiB (24 TiB)',
    networkBandwidth: 'Up to 100 Gbps',
    ebsBandwidth: 'Up to 80 Gbps',
    storageType: 'EBS-Optimized + NVMe SSD options (up to 3.8 TB)',
    storageBadge: 'High-Speed NVMe / EBS',
    hardwareTech: 'Custom Intel Xeon / Graviton3 with massive multi-socket DDR5 NUMA architecture',
    keyDifferentiator: 'Huge memory footprint (8 to 32 GiB RAM per vCPU core, up to 24 TiB on bare-metal U-instances) for processing datasets in-RAM.',
    useCase: 'In-memory databases (Redis, Memcached), high-scale SAP HANA workloads, large database cluster primary instances, real-time analytics.',
    idealFor: ['In-Memory Caches (Redis/KeyDB)', 'Enterprise SAP HANA & Oracle DBs', 'Big Data In-Memory Spark/Presto', 'Real-time Geospatial Processing'],
    tradeoffs: ['Higher hourly cost due to large RAM hardware footprints', 'Underutilized if workload is CPU-bound'],
    icon: '🧠',
    desc: 'Tailored for memory-intensive enterprise workloads. Enables in-memory analytics and processing of giant memory datasets with zero disk I/O bottleneck.',
    themeColor: '#7c3aed',
    accentBg: 'rgba(124, 58, 237, 0.1)',
    cloudEquivalents: {
      aws: 'r6g, r7i, x2gd, z1d, u-series',
      azure: 'Esv5, Edsv5, Msv2, M-series',
      gcp: 'M2, M3, R2D, Memory-Optimized X4'
    },
    sampleInstances: [
      { name: 'r7g.large', vcpu: 2, ramGiB: 16.0, storage: 'EBS-Only', network: 'Up to 12.5 Gbps', hourlyEst: '~$0.1062/hr', useCase: 'High-Throughput Redis Cache Primary' },
      { name: 'r7i.4xlarge', vcpu: 16, ramGiB: 128.0, storage: 'EBS-Only', network: 'Up to 12.5 Gbps', hourlyEst: '~$1.0656/hr', useCase: 'Production PostgreSQL / MySQL Cluster Node' },
      { name: 'x2gd.8xlarge', vcpu: 32, ramGiB: 512.0, storage: '1x 1.9TB NVMe', network: 'Up to 25 Gbps', hourlyEst: '~$2.6880/hr', useCase: 'Real-Time In-Memory Apache Spark Fleet' },
      { name: 'u-6tb1.metal', vcpu: 448, ramGiB: 6144.0, storage: 'EBS-Optimized', network: '100 Gbps', hourlyEst: 'Bare Metal Quote', useCase: 'Mission-Critical Enterprise SAP HANA ERP' }
    ]
  },
  storage: {
    id: 'storage',
    name: 'Storage Optimized (i3en, i4g, d3, h1)',
    category: 'storage',
    classCode: 'I / D / H / Im',
    prefixList: ['i3en', 'i4g', 'i4i', 'd3', 'd3en', 'h1', 'im4gn'],
    ratio: '4:1 to 8:1 (Storage-Focused)',
    ratioScore: 6,
    vcpuRange: '4 to 128 vCPUs',
    ramRange: '32 GiB to 1,024 GiB',
    networkBandwidth: 'Up to 100 Gbps',
    ebsBandwidth: 'Up to 80 Gbps',
    storageType: 'Direct-Attached Local NVMe SSDs (Up to 30 TB raw)',
    storageBadge: '⚡ Local NVMe PCIe (Non-Volatile)',
    hardwareTech: 'Custom AWS Nitro SSDs with up to 3.4M Random Read IOPS',
    keyDifferentiator: 'Direct physical PCIe hardware bus connection to ultra-fast NVMe flash or massive magnetic HDDs with millions of low-latency IOPS.',
    useCase: 'NoSQL storage fleets (Cassandra, ScyllaDB, MongoDB), distributed Kafka message brokers, data warehouses, Elasticsearch/OpenSearch clusters.',
    idealFor: ['High-IOPS NoSQL (Cassandra/MongoDB)', 'Distributed Kafka / Kinesis Brokers', 'Search Index Clusters (Elasticsearch)', 'Massive MapReduce Data Warehousing'],
    tradeoffs: ['Instance Store data is EPHEMERAL: data is lost upon VM stop/terminate (requires replication software)'],
    icon: '💾',
    desc: 'Equipped with ultra-fast direct-attached local NVMe physical drives (Instance Store) delivering microsecond latencies and sequential throughput.',
    themeColor: '#059669',
    accentBg: 'rgba(5, 150, 105, 0.1)',
    cloudEquivalents: {
      aws: 'i3en, i4g, d3, h1, im4gn',
      azure: 'Lsv3, Lsv2, Storage-Optimized',
      gcp: 'Local SSD, Z3, N2-Local-SSD'
    },
    sampleInstances: [
      { name: 'im4gn.large', vcpu: 2, ramGiB: 8.0, storage: '1x 937 GB NVMe', network: 'Up to 25 Gbps', hourlyEst: '~$0.1147/hr', useCase: 'Distributed Log Collector & Ingest Node' },
      { name: 'i3en.2xlarge', vcpu: 8, ramGiB: 64.0, storage: '2x 2.5 TB NVMe', network: 'Up to 25 Gbps', hourlyEst: '~$0.9040/hr', useCase: 'High-Throughput Apache Kafka Message Broker' },
      { name: 'i4i.8xlarge', vcpu: 32, ramGiB: 256.0, storage: '4x 3.75 TB NVMe', network: 'Up to 37.5 Gbps', hourlyEst: '~$3.4240/hr', useCase: 'Cassandra / ScyllaDB Low-Latency Cluster' },
      { name: 'd3en.12xlarge', vcpu: 48, ramGiB: 192.0, storage: '24x 14 TB HDD (336 TB)', network: 'Up to 75 Gbps', hourlyEst: '~$4.9920/hr', useCase: 'Massive MapReduce / Data Lake Storage' }
    ]
  },
  gpu: {
    id: 'gpu',
    name: 'Accelerated Computing (g5, p4de, trn1)',
    category: 'gpu',
    classCode: 'G / P / Trn / Inf',
    prefixList: ['g5', 'g6', 'p4de', 'p5', 'trn1', 'inf2'],
    ratio: 'Specialized + High-Bandwidth VRAM',
    ratioScore: 16,
    vcpuRange: '4 to 192 vCPUs',
    ramRange: '16 GiB to 2,048 GiB + 640 GB HBM3',
    networkBandwidth: 'Up to 3,200 Gbps (EFAv2)',
    ebsBandwidth: 'Up to 80 Gbps',
    storageType: 'Local NVMe with GPUDirect Storage Support',
    storageBadge: 'GPUDirect NVMe + Ultra-EFA',
    hardwareTech: 'NVIDIA H100/A100/L4 GPUs, AWS Trainium & Inferentia2 Custom Silicon',
    keyDifferentiator: 'Specialized co-processor hardware execution (CUDA Tensor Cores / Trainium NeuronCores) + multi-terabit Elastic Fabric Adapter cluster networking.',
    useCase: 'Deep learning model training, AI LLM fine-tuning, hardware graphics rendering, computational fluid dynamics, autonomous vehicle simulation.',
    idealFor: ['LLM Pre-Training & Fine-Tuning', 'High-Throughput AI Inference', '3D Graphics & Unreal/Unity Cloud Rendering', 'Autonomous Driving Simulations'],
    tradeoffs: ['Highest cost category', 'Requires specialized CUDA/Neuron drivers and frameworks'],
    icon: '🎨',
    desc: 'Co-processor acceleration backed by specialized hardware (NVIDIA Tensor Core GPUs or custom AWS Trainium/Inferentia chips) connected via EFA clusters.',
    themeColor: '#e11d48',
    accentBg: 'rgba(225, 29, 72, 0.1)',
    cloudEquivalents: {
      aws: 'g5, p4de, trn1, p5, inf2',
      azure: 'NC-series, NDv4, NVv4, ND H100',
      gcp: 'A2, A3, G2, Cloud TPU v5e'
    },
    sampleInstances: [
      { name: 'g5.xlarge', vcpu: 4, ramGiB: 16.0, storage: 'EBS-Only', network: 'Up to 10 Gbps', hourlyEst: '~$1.0060/hr', useCase: 'NVIDIA A10G (24GB) AI Inference & 3D Render' },
      { name: 'g6.4xlarge', vcpu: 16, ramGiB: 64.0, storage: 'EBS-Only', network: 'Up to 25 Gbps', hourlyEst: '~$1.4390/hr', useCase: 'NVIDIA L4 (24GB) Real-time Speech & Vision AI' },
      { name: 'trn1.32xlarge', vcpu: 128, ramGiB: 512.0, storage: '4x 1.9TB NVMe', network: '800 Gbps EFA', hourlyEst: '~$21.50/hr', useCase: '16x AWS Trainium ASICs for Large Scale LLM Tuning' },
      { name: 'p5.48xlarge', vcpu: 192, ramGiB: 2048.0, storage: '8x 3.8TB NVMe', network: '3,200 Gbps EFAv2', hourlyEst: '~$98.32/hr', useCase: '8x NVIDIA H100 (640GB HBM3) Foundation AI Models' }
    ]
  }
};

const COMPUTE_BOOTSTRAPS: Record<'aws' | 'azure' | 'gcp', Record<'nginx' | 'docker' | 'appsec', string>> = {
  aws: {
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
  },
  azure: {
    nginx: `#!/bin/bash
# ----------------------------------------------------
# Bootstrapping Script: Install Nginx & Custom Homepage
# ----------------------------------------------------
echo "=== Step 1: Updating System Repositories ==="
apt-get update -y

echo "=== Step 2: Installing Nginx Server ==="
apt-get install nginx -y
systemctl start nginx
systemctl enable nginx

echo "=== Step 3: Fetching Metadata & Injecting Content ==="
VM_NAME=$(curl -s -H "Metadata: true" "http://169.254.169.254/metadata/instance/compute/name?api-version=2021-02-01&format=text")
LOCAL_IP=$(curl -s -H "Metadata: true" "http://169.254.169.254/metadata/instance/network/interface/0/ipv4/ipAddress/0/privateIpAddress?api-version=2021-02-01&format=text")

cat <<HTML > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
  <title>Azure VM Host Bootstrap</title>
  <style>body { font-family: sans-serif; text-align: center; padding: 50px; background: #f8fafc; }</style>
</head>
<body>
  <h1 style="color: #0078d4;">🚀 Azure VM Active Web server!</h1>
  <p><b>VM Name:</b> \${VM_NAME}</p>
  <p><b>Private IP:</b> \${LOCAL_IP}</p>
  <p>Status: Successfully bootstrapped via VM Custom Data!</p>
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
apt-get update -y
apt-get install docker.io -y
systemctl start docker
systemctl enable docker

echo "=== Step 2: Granting permissions to azureuser ==="
usermod -aG docker azureuser

echo "=== Step 3: Launching Node Application Container ==="
docker run -d -p 80:3000 --name node-web-service \\
  -e DB_HOST="database.internal.vpc" \\
  node:18-alpine -e "
    const http = require('http');
    http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Hello from Azure VM containerized inside Docker!\\\\n');
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
apt-get update -y
apt-get install -y fail2ban auditd clamav

echo "=== Step 2: Hardening File Permissions & SSHD ==="
chmod 700 /home/azureuser/.ssh
chmod 600 /home/azureuser/.ssh/authorized_keys
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/g' /etc/ssh/sshd_config
systemctl restart ssh

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
  },
  gcp: {
    nginx: `#!/bin/bash
# ----------------------------------------------------
# Bootstrapping Script: Install Nginx & Custom Homepage
# ----------------------------------------------------
echo "=== Step 1: Updating System Repositories ==="
apt-get update -y

echo "=== Step 2: Installing Nginx Server ==="
apt-get install nginx -y
systemctl start nginx
systemctl enable nginx

echo "=== Step 3: Fetching Metadata & Injecting Content ==="
VM_NAME=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/name)
LOCAL_IP=$(curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/ip)

cat <<HTML > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
  <title>GCP VM Host Bootstrap</title>
  <style>body { font-family: sans-serif; text-align: center; padding: 50px; background: #f8fafc; }</style>
</head>
<body>
  <h1 style="color: #0f9d58;">🚀 GCP VM Active Web server!</h1>
  <p><b>VM Name:</b> \${VM_NAME}</p>
  <p><b>Private IP:</b> \${LOCAL_IP}</p>
  <p>Status: Successfully bootstrapped via VM Startup Script!</p>
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
apt-get update -y
apt-get install docker.io -y
systemctl start docker
systemctl enable docker

echo "=== Step 2: Granting permissions to gcpuser ==="
usermod -aG docker gcpuser

echo "=== Step 3: Launching Node Application Container ==="
docker run -d -p 80:3000 --name node-web-service \\
  -e DB_HOST="database.internal.vpc" \\
  node:18-alpine -e "
    const http = require('http');
    http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Hello from GCP VM containerized inside Docker!\\\\n');
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
apt-get update -y
apt-get install -y fail2ban auditd clamav

echo "=== Step 2: Hardening File Permissions & SSHD ==="
chmod 700 /home/gcpuser/.ssh
chmod 600 /home/gcpuser/.ssh/authorized_keys
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/g' /etc/ssh/sshd_config
systemctl restart ssh

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
  }
};

interface EC2VisualizerProps {
  provider?: 'aws' | 'azure' | 'gcp' | 'comparative';
  setProvider?: (provider: 'aws' | 'azure' | 'gcp' | 'comparative') => void;
}

export default function EC2Visualizer({ provider = 'aws', setProvider }: EC2VisualizerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'purchasing' | 'storage' | 'lifecycle' | 'best' | 'notebook' | 'unique'>('notebook');

  const isAzure = provider === 'azure';
  const isGcp = provider === 'gcp';
  const isComparative = provider === 'comparative';

  const t = (text: string) => {
    if (provider === 'aws') return text;
    if (provider === 'gcp') {
      return text
        .replace(/EC2-([0-9A-Za-z]+)/g, 'VM-$1')
        .replace(/EC2 Replica ([0-9]+)/g, 'VM Replica $1')
        .replace(/Placement Groups/g, 'Resource Placement Policies')
        .replace(/Placement Group/g, 'Resource Placement Policy')
        .replace(/placement groups/g, 'resource placement policies')
        .replace(/placement group/g, 'resource placement policy')
        .replace(/AWS EC2/g, 'Google Cloud Compute Engine')
        .replace(/Amazon EC2/g, 'Google Cloud Compute Engine')
        .replace(/\bEC2\b/g, 'Compute Engine')
        .replace(/Elastic Compute Cloud/g, 'Compute Engine VM Instances')
        .replace(/\binstances\b/g, 'VM instances')
        .replace(/\binstance\b/g, 'VM instance')
        .replace(/\bInstances\b/g, 'VM Instances')
        .replace(/\bInstance\b/g, 'VM Instance')
        .replace(/User Data/g, 'Startup Script')
        .replace(/user data/g, 'startup script')
        .replace(/Security Group/g, 'VPC Firewall Rule')
        .replace(/Security Groups/g, 'VPC Firewall Rules')
        .replace(/security group/g, 'VPC firewall rule')
        .replace(/security groups/g, 'VPC firewall rules')
        .replace(/bastion proxy/g, 'IAP Bastion Host')
        .replace(/Bastion proxy/g, 'IAP Bastion Host')
        .replace(/Spot Instance/g, 'Preemptible VM')
        .replace(/Spot Instances/g, 'Preemptible VMs')
        .replace(/Spot Fleets/g, 'Managed Instance Groups (MIGs)')
        .replace(/Spot Fleet/g, 'Managed Instance Group (MIG)')
        .replace(/EBS/g, 'Persistent Disk')
        .replace(/Elastic Block Store/g, 'Persistent Disk (PD)')
        .replace(/EFS/g, 'Filestore')
        .replace(/Elastic File System/g, 'Google Cloud Filestore')
        .replace(/AMI/g, 'Public/Custom VM Image')
        .replace(/Amazon Machine Image/g, 'Compute Engine Machine Image')
        .replace(/Key Pair/g, 'SSH Key')
        .replace(/Key Pairs/g, 'SSH Keys')
        .replace(/Amazon Linux/g, 'Debian / Rocky Linux')
        .replace(/IAM Role/g, 'Service Account')
        .replace(/IAM Roles/g, 'Service Accounts')
        .replace(/EC2 Metadata Token/g, 'Metadata Server Token')
        .replace(/IMDSv2/g, 'Metadata Server')
        .replace(/IMDS/g, 'Metadata Server')
        .replace(/NACLs/g, 'Subnet Rules')
        .replace(/NACL/g, 'Subnet Rule')
        .replace(/AWS/g, 'Google Cloud')
        .replace(/aws/g, 'gcloud')
        .replace(/t3, m6g, m7i/g, 'e2, n2, n2d')
        .replace(/c6g, c7i, c8g/g, 'c2, c2d, c3')
        .replace(/r6g, r7i, x2gd, z1d/g, 'r2d, m3, r3')
        .replace(/i3en, i4g, d3, h1/g, 'n2-local-ssd, h3')
        .replace(/g5, p4de, trn1/g, 'a2, a3, g2')
        .replace(/169.254.169.254\/latest\/api\/token/g, 'metadata.google.internal')
        .replace(/X-aws-ec2-metadata-token-ttl-seconds/g, 'Metadata-Flavor: Google')
        .replace(/X-aws-ec2-metadata-token/g, 'Metadata-Flavor: Google')
        .replace(/http:\/\/169.254.169.254\/latest\/meta-data\/instance-id/g, 'http://metadata.google.internal/computeMetadata/v1/instance/id')
        .replace(/http:\/\/169.254.169.254\/latest\/meta-data\/local-ipv4/g, 'http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/ip')
        .replace(/bastion/g, 'iap-bastion')
        .replace(/Prefix Class: T \/ M\b/g, 'Prefix Class: E2 / N2')
        .replace(/Prefix Class: C\b/g, 'Prefix Class: C2 / C3')
        .replace(/Class Code: C\b/g, 'Class Code: C2 / C3')
        .replace(/Prefix Class: R \/ X \/ Z\b/g, 'Prefix Class: R2D / M3')
        .replace(/Prefix Class: I \/ D \/ H\b/g, 'Prefix Class: Local SSD')
        .replace(/Prefix Class: G \/ P \/ Trn \/ Inf\b/g, 'Prefix Class: A2 / G2')
        .replace(/Trainium/g, 'TPUs');
    }
    if (provider === 'azure') {
      return text
        .replace(/EC2-([0-9A-Za-z]+)/g, 'VM-$1')
        .replace(/EC2 Replica ([0-9]+)/g, 'VM Replica $1')
        .replace(/Placement Groups/g, 'Proximity Placement Groups')
        .replace(/Placement Group/g, 'Proximity Placement Group')
        .replace(/placement groups/g, 'proximity placement groups')
        .replace(/placement group/g, 'proximity placement group')
        .replace(/AWS EC2/g, 'Azure Virtual Machines')
        .replace(/Amazon EC2/g, 'Azure Virtual Machines')
        .replace(/\bEC2\b/g, 'Virtual Machines')
        .replace(/Elastic Compute Cloud/g, 'Azure Virtual Machines')
        .replace(/\binstances\b/g, 'VMs')
        .replace(/\binstance\b/g, 'VM')
        .replace(/\bInstances\b/g, 'VMs')
        .replace(/\bInstance\b/g, 'VM')
        .replace(/User Data/g, 'Custom Data')
        .replace(/user data/g, 'custom data')
        .replace(/Security Group/g, 'Network Security Group (NSG)')
        .replace(/Security Groups/g, 'Network Security Groups (NSGs)')
        .replace(/security group/g, 'network security group (NSG)')
        .replace(/security groups/g, 'network security groups (NSGs)')
        .replace(/bastion proxy/g, 'Azure Bastion Host')
        .replace(/Bastion proxy/g, 'Azure Bastion Host')
        .replace(/Spot Instance/g, 'Azure Spot VM')
        .replace(/Spot Instances/g, 'Azure Spot VMs')
        .replace(/Spot Fleets/g, 'Virtual Machine Scale Sets (VMSS)')
        .replace(/Spot Fleet/g, 'Virtual Machine Scale Set (VMSS)')
        .replace(/EBS/g, 'Managed Disk')
        .replace(/Elastic Block Store/g, 'Azure Managed Disk')
        .replace(/EFS/g, 'Azure Files')
        .replace(/Elastic File System/g, 'Azure Files Share')
        .replace(/AMI/g, 'Azure Marketplace Image')
        .replace(/Amazon Machine Image/g, 'Azure Marketplace Image')
        .replace(/Key Pair/g, 'SSH Key')
        .replace(/Key Pairs/g, 'SSH Keys')
        .replace(/Amazon Linux/g, 'Ubuntu / RHEL')
        .replace(/IAM Role/g, 'Managed Identity')
        .replace(/IAM Roles/g, 'Managed Identities')
        .replace(/EC2 Metadata Token/g, 'IMDS Header')
        .replace(/IMDSv2/g, 'Azure Instance Metadata Service (IMDS)')
        .replace(/IMDS/g, 'Azure IMDS')
        .replace(/NACLs/g, 'Subnet Rules')
        .replace(/NACL/g, 'Subnet Rule')
        .replace(/AWS/g, 'Azure')
        .replace(/aws/g, 'az')
        .replace(/t3, m6g, m7i/g, 'B, Dsv5, Dasv5')
        .replace(/c6g, c7i, c8g/g, 'Fsv2, FX')
        .replace(/r6g, r7i, x2gd, z1d/g, 'Esv5, Msv2')
        .replace(/i3en, i4g, d3, h1/g, 'Lsv3')
        .replace(/g5, p4de, trn1/g, 'NC, ND, NV')
        .replace(/169.254.169.254\/latest\/api\/token/g, '169.254.169.254/metadata/instance')
        .replace(/X-aws-ec2-metadata-token-ttl-seconds/g, 'Metadata: true')
        .replace(/X-aws-ec2-metadata-token/g, 'Metadata: true')
        .replace(/http:\/\/169.254.169.254\/latest\/meta-data\/instance-id/g, 'http://169.254.169.254/metadata/instance/compute/vmId?api-version=2021-02-01&format=text')
        .replace(/http:\/\/169.254.169.254\/latest\/meta-data\/local-ipv4/g, 'http://169.254.169.254/metadata/instance/network/interface/0/ipv4/ipAddress/0/privateIpAddress?api-version=2021-02-01&format=text')
        .replace(/bastion/g, 'azure-bastion')
        .replace(/Prefix Class: T \/ M\b/g, 'Prefix Class: B / D')
        .replace(/Prefix Class: C\b/g, 'Prefix Class: F')
        .replace(/Class Code: C\b/g, 'Class Code: F')
        .replace(/Prefix Class: R \/ X \/ Z\b/g, 'Prefix Class: E / M')
        .replace(/Prefix Class: I \/ D \/ H\b/g, 'Prefix Class: L')
        .replace(/Prefix Class: G \/ P \/ Trn \/ Inf\b/g, 'Prefix Class: NC / ND')
        .replace(/Trainium/g, 'NPUs');
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
        if (
          node.type === 'pre' ||
          node.type === 'code' ||
          node.type === 'svg' ||
          (node.props && (node.props.className === 'acad-terminal' || node.props.className === 'ec2-terminal' || node.props.className === 'ec2-svg-bg'))
        ) {
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

  const handleNavigateToDemo = (selectedProvider: 'aws' | 'azure' | 'gcp', targetTab: 'overview' | 'security' | 'purchasing' | 'storage' | 'lifecycle' | 'best' | 'notebook' | 'unique') => {
    if (setProvider) setProvider(selectedProvider);
    setActiveTab(targetTab);
  };

  // Visual Architect Academy Notebook states
  const [selectedNote, setSelectedNote] = useState<string>('ec2_what_is');
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

  // Tab 1: Overview States & Instance Families Directory States
  const [selectedFamily, setSelectedFamily] = useState<string>('general');
  const [familySearchQuery, setFamilySearchQuery] = useState<string>('');
  const [familyCategoryFilter, setFamilyCategoryFilter] = useState<'all' | 'general' | 'compute' | 'memory' | 'storage' | 'gpu'>('all');
  const [familyViewMode, setFamilyViewMode] = useState<'table' | 'cards'>('table');
  const [familyAdvisorWorkload, setFamilyAdvisorWorkload] = useState<string>('');
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
  const [efsThroughput] = useState<'bursting' | 'elastic' | 'provisioned'>('elastic');
  const [efsLifecycleDays] = useState<number>(30);
  const [efsSize, setEfsSize] = useState<number>(500);
  const [efsProvisionedMb] = useState<number>(50);
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
    
    const bootloaderMsg = provider === 'azure' ? 'Initializing Azure VM Bootloader...' : provider === 'gcp' ? 'Initializing Compute Engine Bootloader...' : 'Initializing EC2 Bootloader...';
    const metadataMsg = provider === 'azure' ? 'Requesting IMDS Header authentication...' : provider === 'gcp' ? 'Requesting Metadata-Flavor verification...' : 'Fetching IMDSv2 token...';
    setBootTerminalLogs([`[system] ${bootloaderMsg}`, `[system] ${metadataMsg}`]);
    
    const boots = COMPUTE_BOOTSTRAPS[provider === 'comparative' ? 'aws' : provider];
    const lines = boots[selectedBootstrap].split('\n');
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

  const handleConsoleHibernate = () => {
    if (vmState !== 'Running') return;
    setVmState('Stopping');
    setConsoleCpuGauge(0);
    setConsoleLogs(l => [...l, `[system] Initiating EC2 Hibernate... Freezing RAM memory state (hiberfile.sys) to root EBS volume...`]);

    setTimeout(() => {
      setVmState('Stopped');
      setConsoleLogs(l => [
        ...l,
        `[system] RAM memory state safely dumped to EBS. Instance state: STOPPED (Hibernated).`,
        `[system] Re-starting will restore RAM contents into memory instantly without cold boot!`,
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
    <div className="ec2-container" style={{ fontSize: '13.5px' }}>
      <style>{`
        .ec2-container {
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
          color: var(--color-text-primary, #1e293b);

          /* Theme Variables (Light mode default) */
          --ec-bg: rgba(255, 255, 255, 0.75);
          --ec-card-bg: rgba(255, 255, 255, 0.75);
          --ec-card-border: rgba(226, 232, 240, 0.8);
          --ec-card-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.03), 0 4px 6px -4px rgba(0, 0, 0, 0.03);
          
          --color-text-primary: #1e293b;
          --color-text-secondary: #475569;
          --color-text-tertiary: #64748b;
          --color-border-secondary: #cbd5e1;
          --color-border-tertiary: #e2e8f0;
          
          --ec-tab-bg: rgba(255, 255, 255, 0.6);
          --ec-tab-hover-bg: rgba(241, 245, 249, 0.8);
          
          --ec-btn-bg: rgba(255, 255, 255, 0.8);
          --ec-btn-hover-bg: #f8fafc;
          
          --ec-terminal-bg: #0a0d16;
          --ec-terminal-border: #1e293b;
          --ec-terminal-color: #38bdf8;
          
          --ec-svg-grid-line: #cbd5e1;
          --ec-svg-line-stroke: #cbd5e1;
          
          --ec-metric-card-bg: rgba(241, 245, 249, 0.3);
          --ec-metric-card-border: #cbd5e1;
          
          --color-red: #dc2626;
          --color-amber: #d97706;
          --color-green: #16a34a;
          --color-blue: #2563eb;
          --color-purple: #7c3aed;

          --ec-success-bg: #f0fdf4;
          --ec-success-border: #bbf7d0;
          --ec-success-text: #166534;
          --ec-success-text-bold: #14532d;
          --ec-error-bg: #fef2f2;
          --ec-error-border: #fecaca;
          --ec-error-text: #991b1b;
          --ec-error-text-bold: #7f1d1d;
        }

        .dark .ec2-container {
          background: #020617 !important;
          color: #f8fafc !important;

          --ec-bg: #020617;
          --ec-card-bg: rgba(15, 23, 42, 0.75);
          --ec-card-border: rgba(51, 65, 85, 0.6);
          --ec-card-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          
          --color-text-primary: #f8fafc;
          --color-text-secondary: #94a3b8;
          --color-text-tertiary: #64748b;
          --color-border-secondary: rgba(51, 65, 85, 0.6);
          --color-border-tertiary: rgba(51, 65, 85, 0.6);
          
          --ec-tab-bg: rgba(15, 23, 42, 0.6);
          --ec-tab-hover-bg: rgba(30, 41, 59, 0.8);
          
          --ec-btn-bg: rgba(15, 23, 42, 0.8);
          --ec-btn-hover-bg: rgba(30, 41, 59, 0.8);
          
          --ec-terminal-bg: #020617;
          --ec-terminal-border: rgba(51, 65, 85, 0.6);
          --ec-terminal-color: #38bdf8;
          
          --ec-svg-grid-line: rgba(51, 65, 85, 0.5);
          --ec-svg-line-stroke: rgba(100, 116, 139, 0.5);
          
          --ec-metric-card-bg: rgba(15, 23, 42, 0.6);
          --ec-metric-card-border: rgba(51, 65, 85, 0.6);
          
          --color-red: #f87171;
          --color-amber: #fbbf24;
          --color-green: #4ade80;
          --color-blue: #60a5fa;
          --color-purple: #a78bfa;

          --ec-success-bg: rgba(22, 163, 74, 0.1);
          --ec-success-border: rgba(74, 222, 128, 0.2);
          --ec-success-text: #86efac;
          --ec-success-text-bold: #4ade80;
          --ec-error-bg: rgba(239, 68, 68, 0.1);
          --ec-error-border: rgba(248, 113, 113, 0.2);
          --ec-error-text: #fca5a5;
          --ec-error-text-bold: #f87171;
        }

        /* CSS Variable System matching LoadBalancerVisualizer */
        .ec2-container {
          --color-background-primary: #ffffff;
          --color-background-secondary: #f8fafc;
          --color-background-tertiary: #f1f5f9;
          --color-border-tertiary: #cbd5e1;
          --color-border-secondary: #94a3b8;
          --color-text-primary: #0f172a;
          --color-text-secondary: #475569;
          --color-text-tertiary: #64748b;
        }

        .dark .ec2-container {
          --color-background-primary: #0f172a;
          --color-background-secondary: rgba(30, 41, 59, 0.6);
          --color-background-tertiary: rgba(51, 65, 85, 0.4);
          --color-border-tertiary: rgba(51, 65, 85, 0.6);
          --color-border-secondary: rgba(100, 116, 139, 0.6);
          --color-text-primary: #f8fafc;
          --color-text-secondary: #cbd5e1;
          --color-text-tertiary: #94a3b8;
        }

        .ec2-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; }
        .ec2-tb { padding: 8px 16px; border-radius: var(--border-radius-lg, 12px); border: 1.5px solid var(--color-border-secondary); font-size: 12px; cursor: pointer; background: var(--ec-tab-bg); color: var(--color-text-secondary); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); outline: none; font-weight: 500; font-family: 'Outfit', sans-serif; }
        .ec2-tb:hover:not([class*="ec2-on"]) { background: var(--ec-tab-hover-bg); color: var(--color-text-primary); transform: translateY(-1px); }
        
        .ec2-tb.ec2-on-notebook { background: linear-gradient(135deg, #d97706 0%, #f59e0b 100%) !important; color: #ffffff !important; border-color: #d97706 !important; box-shadow: 0 2px 4px rgba(217, 119, 6, 0.2); }
        .ec2-tb.ec2-on-overview { background: linear-gradient(135deg, #ea580c 0%, #f97316 100%) !important; color: #ffffff !important; border-color: #ea580c !important; box-shadow: 0 2px 4px rgba(234, 88, 12, 0.2); }
        .ec2-tb.ec2-on-security { background: linear-gradient(135deg, #0284c7 0%, #38bdf8 100%) !important; color: #ffffff !important; border-color: #0284c7 !important; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.2); }
        .ec2-tb.ec2-on-purchasing { background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important; color: #ffffff !important; border-color: #059669 !important; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2); }
        .ec2-tb.ec2-on-storage { background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%) !important; color: #ffffff !important; border-color: #7c3aed !important; box-shadow: 0 2px 4px rgba(124, 58, 237, 0.2); }
        .ec2-tb.ec2-on-lifecycle { background: linear-gradient(135deg, #059669 0%, #10b981 100%) !important; color: #ffffff !important; border-color: #059669 !important; box-shadow: 0 2px 4px rgba(5, 150, 105, 0.2); }
        .ec2-tb.ec2-on-best { background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%) !important; color: #ffffff !important; border-color: #0d9488 !important; box-shadow: 0 2px 4px rgba(13, 148, 136, 0.2); }
        .ec2-tb.ec2-on-unique { background: linear-gradient(135deg, #475569 0%, #64748b 100%) !important; color: #ffffff !important; border-color: #475569 !important; box-shadow: 0 2px 4px rgba(71, 85, 105, 0.2); }
        .ec2-tb.ec2-on { background: var(--color-blue) !important; color: #fff !important; border-color: var(--color-blue) !important; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(2, 132, 199, 0.2), 0 2px 4px -2px rgba(2, 132, 199, 0.2); }

        .dark .ec2-tb { background: rgba(15, 23, 42, 0.6); border-color: rgba(51, 65, 85, 0.6); color: #94a3b8; }
        .dark .ec2-tb:hover:not([class*="ec2-on"]) { background: rgba(30, 41, 59, 0.8); color: #f8fafc; }

        .ec2-card { border: 1.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg, 12px); padding: 18px 20px; background: var(--color-background-primary); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: var(--ec-card-shadow), inset 0 1px 0 0 rgba(255, 255, 255, 0.1); margin-bottom: 16px; font-size: 13px; line-height: 1.5; color: var(--color-text-primary); }
        .ec2-sec { font-size: 12.5px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .05em; margin: 20px 0 10px; }
        .ec2-sec:first-child { margin-top: 0; }
        .ec2-g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .ec2-g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .ec2-kv { display: flex; gap: 8px; font-size: 13px; margin: 6px 0; align-items: baseline; }
        .ec2-kk { min-width: 160px; color: var(--color-text-secondary); flex-shrink: 0; font-weight: 500; }
        .ec2-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
        
        .ec2-btn { font-size: 12.5px; padding: 6px 14px; border-radius: 8px; border: 1.5px solid var(--color-border-secondary); background: var(--ec-btn-bg); color: var(--color-text-primary); cursor: pointer; transition: all 0.2s; outline: none; font-weight: 500; }
        .ec2-btn:hover:not(:disabled):not(.ec2-on) { background: var(--ec-btn-hover-bg); border-color: var(--color-border-secondary); transform: translateY(-1px); }
        .ec2-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .ec2-btn.ec2-on { background: var(--color-blue) !important; color: #fff !important; border-color: var(--color-blue) !important; box-shadow: 0 2px 4px rgba(2, 132, 199, 0.15); }
        
        .ec2-terminal { background: var(--ec-terminal-bg); color: var(--ec-terminal-color); font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 11.5px; padding: 14px; border-radius: 10px; border: 1px solid var(--ec-terminal-border); box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.3); max-height: 220px; overflow-y: auto; white-space: pre-wrap; line-height: 1.5; }
        .ec2-svg-bg { background-color: var(--ec-bg); background-image: radial-gradient(var(--ec-svg-grid-line) 1.2px, transparent 1.2px); background-size: 16px 16px; border-radius: 8px; border: 1.5px solid var(--color-border-tertiary); box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02); }
        
        /* Unified Dropdown Selection Visual Cues */
        .ec2-card select {
          border: 1.5px solid var(--color-border-tertiary) !important;
          border-radius: 8px;
          padding: 6px 12px;
          background: var(--ec-bg);
          color: var(--color-text-primary);
          font-weight: 500;
          outline: none;
          transition: all 0.2s;
        }
        .ec2-card select:focus {
          border-color: var(--color-amber) !important;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15) !important;
        }
        .ec2-card select.ec2-highlight {
          border: 1.5px solid var(--color-amber) !important;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1) !important;
        }
        .ec2-card input[type="text"] {
          border: 1.5px solid var(--color-border-secondary);
          border-radius: 8px;
          padding: 6px 10px;
          background: var(--ec-bg);
          color: var(--color-text-primary);
          outline: none;
          transition: all 0.2s;
        }
        .ec2-card input[type="text"]:focus {
          border-color: var(--color-blue);
          box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
        }
        .ec2-card input[type="range"] {
          accent-color: var(--color-blue);
          background: var(--color-border-secondary);
          height: 6px;
          border-radius: 3px;
        }

        /* Premium Flowing Conduit animations */
        .ec2-flow-blue { stroke: var(--color-blue); stroke-dasharray: 8, 4; animation: ec2Flow 25s linear infinite; }
        .ec2-flow-orange { stroke: var(--color-amber); stroke-dasharray: 8, 4; animation: ec2Flow 20s linear infinite; }
        .ec2-flow-green { stroke: var(--color-green); stroke-dasharray: 8, 4; animation: ec2Flow 22s linear infinite; }
        .ec2-flow-purple { stroke: var(--color-purple); stroke-dasharray: 8, 4; animation: ec2Flow 24s linear infinite; }
        .ec2-flow-red { stroke: var(--color-red); stroke-dasharray: 8, 4; animation: ec2Flow 18s linear infinite; }

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
          border-color: var(--color-blue);
        }

        /* EC2 Instance Families Table & Specs Directory Styles */
        .ec2-fam-table-wrapper {
          width: 100%;
          overflow-x: auto;
          border-radius: 12px;
          border: 1.5px solid var(--color-border-tertiary);
          background: var(--color-background-primary);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.04), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
        }
        .ec2-fam-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          text-align: left;
          min-width: 960px;
        }
        .ec2-fam-table th {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
          font-weight: 800;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 12px 14px;
          border-bottom: 1.5px solid var(--color-border-tertiary);
          white-space: nowrap;
        }
        .ec2-fam-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--color-border-tertiary);
          color: var(--color-text-secondary);
          vertical-align: middle;
          transition: background 0.15s ease;
        }
        .ec2-fam-table tbody tr {
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .ec2-fam-table tbody tr:hover {
          background: var(--ec-tab-hover-bg) !important;
        }
        .ec2-fam-table tbody tr.ec2-fam-row-active {
          background: rgba(2, 132, 199, 0.08) !important;
        }
        .dark .ec2-fam-table tbody tr.ec2-fam-row-active {
          background: rgba(14, 165, 233, 0.16) !important;
        }
        .ec2-ratio-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 700;
          font-size: 11px;
        }
        .ec2-ratio-meter {
          height: 4px;
          border-radius: 2px;
          background: var(--color-border-tertiary);
          margin-top: 4px;
          overflow: hidden;
          width: 100%;
        }
        .ec2-ratio-meter-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }
        .ec2-filter-pill {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--color-border-tertiary);
          background: var(--color-background-primary);
          color: var(--color-text-secondary);
          transition: all 0.18s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .ec2-filter-pill:hover {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
          border-color: var(--color-border-secondary);
        }
        .ec2-filter-pill.active {
          background: var(--color-blue);
          color: #ffffff !important;
          border-color: var(--color-blue);
          box-shadow: 0 2px 4px rgba(2, 132, 199, 0.25);
        }
        .ec2-advisor-chip {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          border: 1px solid var(--color-border-tertiary);
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
          transition: all 0.18s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .ec2-advisor-chip:hover {
          border-color: var(--color-blue);
          transform: translateY(-1px);
        }
        .ec2-advisor-chip.selected {
          border-color: var(--color-blue);
          background: rgba(2, 132, 199, 0.12);
          color: var(--color-blue);
          font-weight: 700;
        }
        .ec2-tag-pill {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          background: var(--color-background-secondary);
          border: 0.5px solid var(--color-border-tertiary);
          color: var(--color-text-secondary);
          margin-right: 4px;
          margin-bottom: 3px;
        }

        /* Modern Architect Learning Center styles */
        .da-edu-card {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: var(--color-text-primary);
        }
        .da-edu-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 20px -8px rgba(79, 70, 229, 0.12);
          border-color: var(--color-purple);
        }
        
        /* Premium Academy Directory Styles */
        .acad-dir-container {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .acad-dir-header {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
          padding: 16px;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--color-border-tertiary);
        }
        .acad-dir-folder-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--color-background-primary);
          border: none;
          border-bottom: 1px solid var(--color-border-tertiary);
          font-size: 10px;
          font-weight: 850;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .acad-dir-folder-btn:hover {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
        }
        .acad-dir-item-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          font-size: 12px;
          font-weight: 600;
          color: var(--color-text-secondary);
          border: none;
          border-left: 3px solid transparent;
          background: var(--color-background-primary);
          transition: all 0.15s ease;
          text-align: left;
          cursor: pointer;
        }
        .acad-dir-item-btn:hover {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
          border-left-color: var(--color-border-tertiary);
        }
        .acad-dir-item-btn.acad-active {
          background: #eff6ff;
          color: #0284c7;
          border-left-color: #0ea5e9;
          font-weight: 800;
        }
        .dark .acad-dir-item-btn.acad-active {
          background: rgba(14, 165, 233, 0.15) !important;
          color: #38bdf8 !important;
          border-left-color: #38bdf8 !important;
        }
        .acad-detail-card {
          background: var(--color-background-primary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
          color: var(--color-text-primary);
        }
        .acad-hero-badge {
          background: #e0f2fe;
          border: 1.5px solid #bae6fd;
          color: #0369a1;
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
          background: rgba(3, 105, 161, 0.2) !important;
          border-color: rgba(3, 105, 161, 0.4) !important;
          color: #38bdf8 !important;
        }
        .acad-takeaway-box {
          background: linear-gradient(135deg, var(--color-background-primary) 0%, var(--color-background-secondary) 100%);
          border-left: 4px solid #0ea5e9;
          border-radius: 12px;
          padding: 18px;
          font-size: 12px;
          line-height: 1.6;
          color: var(--color-text-secondary);
          font-weight: 600;
          border-top: 1px solid var(--color-border-tertiary);
          border-right: 1px solid var(--color-border-tertiary);
          border-bottom: 1px solid var(--color-border-tertiary);
        }
        .acad-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--color-border-tertiary);
        }
        .acad-table th {
          background: var(--color-background-secondary);
          color: var(--color-text-primary);
          font-weight: 800;
          padding: 12px 14px;
          border-bottom: 1.5px solid var(--color-border-tertiary);
          text-align: left;
        }
        .acad-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--color-border-tertiary);
          color: var(--color-text-secondary);
        }
        .acad-table tr:last-child td {
          border-bottom: none;
        }
        .acad-sim-diagram {
          background: var(--color-background-primary);
          border: 1.5px solid var(--color-border-tertiary);
          border-radius: 16px;
          padding: 18px;
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02);
          position: relative;
        }
        .acad-terminal {
          background: var(--ec-terminal-bg);
          border: 1px solid var(--ec-terminal-border);
          border-radius: 12px;
          padding: 14px;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          color: var(--color-text-primary);
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
        }

        /* Humanized Beginner Callout Boxes */
        .acad-plain-english {
          background: rgba(2, 132, 199, 0.07);
          border-left: 4px solid var(--color-blue);
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 16px;
          font-size: 12.5px;
          line-height: 1.6;
          color: var(--color-text-primary);
          border-top: 1px solid var(--color-border-tertiary);
          border-right: 1px solid var(--color-border-tertiary);
          border-bottom: 1px solid var(--color-border-tertiary);
        }
        .dark .acad-plain-english {
          background: rgba(56, 189, 248, 0.12);
        }
        .acad-analogy-box {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%);
          border: 1.5px solid rgba(245, 158, 11, 0.35);
          border-radius: 12px;
          padding: 16px;
          margin: 16px 0;
          font-size: 12px;
          line-height: 1.6;
          color: var(--color-text-primary);
        }
        .dark .acad-analogy-box {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%);
          border-color: rgba(245, 158, 11, 0.3);
        }
        .acad-gotcha-box {
          background: rgba(239, 68, 68, 0.06);
          border-left: 4px solid var(--color-red);
          border-radius: 10px;
          padding: 14px 16px;
          margin: 16px 0;
          font-size: 11.5px;
          line-height: 1.55;
          color: var(--color-text-secondary);
          border-top: 1px solid var(--color-border-tertiary);
          border-right: 1px solid var(--color-border-tertiary);
          border-bottom: 1px solid var(--color-border-tertiary);
        }
        .dark .acad-gotcha-box {
          background: rgba(239, 68, 68, 0.12);
        }
        .acad-flow-step {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          background: var(--color-background-secondary);
          border-radius: 8px;
          border: 1px solid var(--color-border-tertiary);
          font-size: 11.5px;
          flex: 1 1 160px;
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

        .dark .ec2-card b,
        .dark .ec2-card strong,
        .dark .ec2-card h3,
        .dark .ec2-card h4 {
          color: #ffffff !important;
        }

        /* Node Status Overrides */
        .ec2-ok {
          border-color: var(--color-green) !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: var(--color-green) !important;
        }
        .ec2-warm {
          border-color: var(--color-amber) !important;
          background: rgba(245, 158, 11, 0.15) !important;
          color: var(--color-amber) !important;
        }
        .ec2-drain {
          border-color: var(--color-blue) !important;
          background: rgba(59, 130, 246, 0.15) !important;
          color: var(--color-blue) !important;
        }
        .ec2-down {
          border-color: var(--color-red) !important;
          background: rgba(239, 68, 68, 0.15) !important;
          color: var(--color-red) !important;
        }
      `}</style>
      <div style={{ padding: '14px 16px 4px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isComparative ? (
              <span>⚖️ Multi-Cloud Compute Comparison — AWS EC2 vs Azure VM vs GCP GCE</span>
            ) : isAzure ? (
              <span>💻 Azure Virtual Machines — VMs · Bootstrapping · NSGs · Spot VMs · Managed Disks</span>
            ) : isGcp ? (
              <span>💻 Google Cloud Compute Engine — VM Instances · Startup Scripts · Firewalls · Preemptible VMs · Persistent Disks</span>
            ) : (
              <span>💻 AWS EC2 — Elastic Compute Cloud · Instances · Security · Storage · Spot Fleets</span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {isComparative ? (
              <span>Side-by-side architectural mapping and simulation control comparison between AWS EC2, Azure VM, and GCP Compute Engine VM architectures.</span>
            ) : isAzure ? (
              <span>Secure, rescalable virtual servers in Azure — learn VM custom-data bootstrapping, Network Security Groups, Spot VMs, Managed Disks, and VM lifecycle states interactively.</span>
            ) : isGcp ? (
              <span>Secure, rescalable virtual servers in Google Cloud — learn startup script bootstrapping, VPC firewall rules, Preemptible VMs, Persistent Disks, and VM lifecycle states interactively.</span>
            ) : (
              <span>Secure, rescalable virtual servers in the cloud — learn bootstrapping, security groups, spot instances, EBS, EFS lifecycles, and direct state machine consoles interactively.</span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        {!isComparative && (
          <div className="ec2-tabs">
            <button className={`ec2-tb ${activeTab === 'notebook' ? 'ec2-on-notebook' : ''}`} onClick={() => setActiveTab('notebook')}>📓 1) Visual Notes &amp; Theories</button>
            <button className={`ec2-tb ${activeTab === 'overview' ? 'ec2-on-overview' : ''}`} onClick={() => setActiveTab('overview')}>💻 2) Core VM &amp; Bootstrapping</button>
            <button className={`ec2-tb ${activeTab === 'security' ? 'ec2-on-security' : ''}`} onClick={() => setActiveTab('security')}>🛡️ 3) Security Groups &amp; Network</button>
            <button className={`ec2-tb ${activeTab === 'purchasing' ? 'ec2-on-purchasing' : ''}`} onClick={() => setActiveTab('purchasing')}>💰 4) Spot &amp; Purchasing</button>
            <button className={`ec2-tb ${activeTab === 'storage' ? 'ec2-on-storage' : ''}`} onClick={() => setActiveTab('storage')}>💾 5) Storage: EBS vs EFS</button>
            <button className={`ec2-tb ${activeTab === 'best' ? 'ec2-on-best' : ''}`} onClick={() => setActiveTab('best')}>🏗️ 6) Architecture &amp; Audit</button>
            <button className={`ec2-tb ${activeTab === 'unique' ? 'ec2-on-unique' : ''}`} onClick={() => setActiveTab('unique')}>✨ Unique Features</button>
          </div>
        )}
      </div>

      {/* Content Panels */}
      <div style={{ padding: '0 16px' }}>
        {isComparative && (
          <EC2ComparativeView onNavigateToDemo={handleNavigateToDemo} />
        )}

        {!isComparative && activeTab === 'unique' && (
          <UniqueComputeFeatures provider={provider as 'aws' | 'azure' | 'gcp'} />
        )}

        {!isComparative && activeTab !== 'unique' && (
          <Translate>
            <>
        {activeTab === 'notebook' && (() => {
          const getProviderSnippets = (prov: 'aws' | 'azure' | 'gcp' | 'comparative') => {
            const p = prov === 'comparative' ? 'aws' : prov;
            const data = {
              aws: {
                imds: `# Request 60-second metadata token (IMDSv2)
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60")

# Read local instance IP using the token
curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4`,
                sg: `# Authorize SSH access (port 22) restricted to Bastion proxy IP
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
  --cidr 0.0.0.0/0`,
                spot: `# Request Spot Instance with max price limit set
aws ec2 request-spot-instances \\
  --spot-price-limit "0.05" \\
  --instance-count 3 \\
  --type "persistent" \\
  --launch-specification file://spot-spec.json`,
                mount: `# Format attached EBS block device volume (/dev/xvdf) as ext4
sudo mkfs -t ext4 /dev/xvdf

# Mount the volume to the local application directory
sudo mount /dev/xvdf /var/www/html`
              },
              azure: {
                imds: `# Query Azure Instance Metadata Service (IMDS) with required header
curl -s -H "Metadata: true" "http://169.254.169.254/metadata/instance?api-version=2021-02-01"

# Extract local private IP address using IMDS directly
curl -s -H "Metadata: true" "http://169.254.169.254/metadata/instance/network/interface/0/ipv4/ipAddress/0/privateIpAddress?api-version=2021-02-01&format=text"`,
                sg: `# Create Inbound NSG rule for SSH (Port 22) from a secure Bastion source
az network nsg rule create \\
  --resource-group myRG \\
  --nsg-name myNSG \\
  --name AllowSSH \\
  --priority 100 \\
  --source-address-prefixes 10.0.1.50/32 \\
  --destination-port-ranges 22 \\
  --access Allow \\
  --protocol Tcp

# Create Inbound NSG rule to allow HTTP (Port 80) globally
az network nsg rule create \\
  --resource-group myRG \\
  --nsg-name myNSG \\
  --name AllowHTTP \\
  --priority 110 \\
  --source-address-prefixes '*' \\
  --destination-port-ranges 80 \\
  --access Allow \\
  --protocol Tcp`,
                spot: `# Create Spot VM with eviction policy set to Deallocate
az vm create \\
  --resource-group myRG \\
  --name mySpotVM \\
  --image Ubuntu2204 \\
  --priority Spot \\
  --max-price 0.05 \\
  --eviction-policy Deallocate`,
                mount: `# Format Azure Managed Disk volume (/dev/sdc) as ext4
sudo mkfs -t ext4 /dev/sdc

# Mount the Managed Disk volume to the local folder
sudo mount /dev/sdc /var/www/html`
              },
              gcp: {
                imds: `# Query GCP Metadata Server using required metadata header
curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/

# Extract local private IP address directly from instance properties
curl -s -H "Metadata-Flavor: Google" http://metadata.google.internal/computeMetadata/v1/instance/network-interfaces/0/ip`,
                sg: `# Create VPC firewall rule allowing SSH from a secure bastion source tag
gcloud compute firewall-rules create allow-ssh-bastion \\
  --network=default \\
  --allow=tcp:22 \\
  --source-tags=bastion-host \\
  --target-tags=backend-servers

# Create VPC firewall rule allowing HTTP traffic globally to target tag
gcloud compute firewall-rules create allow-http-public \\
  --network=default \\
  --allow=tcp:80 \\
  --source-ranges=0.0.0.0/0 \\
  --target-tags=web-servers`,
                spot: `# Create Google Cloud Spot VM (replaces Preemptible VMs)
gcloud compute instances create my-spot-vm \\
  --zone=us-central1-a \\
  --machine-type=e2-medium \\
  --provisioning-model=SPOT \\
  --instance-termination-action=STOP`,
                mount: `# Format GCP Persistent Disk volume (/dev/sdb) as ext4
sudo mkfs -t ext4 /dev/sdb

# Mount the Persistent Disk volume to local directory
sudo mount /dev/sdb /var/www/html`
              }
            };
            return data[p];
          };

          const snippets = getProviderSnippets(provider);
          const imdsCodeSnippet = snippets.imds;
          const mountCodeSnippet = snippets.mount;
          const sgCodeSnippet = snippets.sg;
          const spotCodeSnippet = snippets.spot;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left', animation: 'fadeIn 0.3s ease-in-out' }}>
              
              {/* Header Hero Card */}
              <div className="card text-left" style={{ borderLeft: '4px solid var(--color-purple)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 font-display" style={{ color: 'var(--color-text-primary)' }}>
                      <BookOpen className="w-5 h-5" style={{ color: 'var(--color-purple)' }} /> EC2 Visual Architect Notes &amp; Mental Models
                    </h2>
                    <p className="text-xs mt-1.5 leading-relaxed font-sans font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                      Simplified, beginner-friendly cloud computing concepts sorted from absolute fundamentals to advanced production architectures with everyday real-world analogies.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span className="acad-hero-badge">🎓 Beginner to Pro</span>
                    <span className="acad-hero-badge" style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#b45309' }}>💡 Real-World Mental Models</span>
                  </div>
                </div>
              </div>

              {/* Grid Layout */}
              <div className="acad-grid-12">
                
                {/* Left Sidebar Menu */}
                <div className="acad-col-3">
                  <div className="acad-dir-container">
                    <div className="acad-dir-header">
                      <BookOpen style={{ width: '16px', height: '16px', color: 'var(--color-blue)' }} />
                      <span>Curriculum Modules</span>
                    </div>

                    {/* Level 1: EC2 Fundamentals */}
                    <div>
                      <button
                        className="acad-dir-folder-btn"
                        onClick={() => setExpandedCategory(expandedCategory === 'ec2_fundamentals' ? '' : 'ec2_fundamentals')}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Sliders style={{ width: '14px', height: '14px', color: 'var(--color-blue)' }} />
                          🐣 Level 1 · Fundamentals
                        </span>
                        {expandedCategory === 'ec2_fundamentals' ? <ChevronDown style={{ width: '14px', height: '14px' }} /> : <ChevronRight style={{ width: '14px', height: '14px' }} />}
                      </button>
                      {expandedCategory === 'ec2_fundamentals' && (
                        <div style={{ background: 'var(--color-background-secondary)', padding: '4px 0' }}>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'ec2_what_is' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('ec2_what_is')}
                          >
                            {t('1.1 What is EC2? (Rent-a-Laptop)')}
                          </button>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'ec2_bootstrap' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('ec2_bootstrap')}
                          >
                            {t('1.2 Setup Scripts & Digital ID (IMDS)')}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Level 2: Network & Access */}
                    <div>
                      <button
                        className="acad-dir-folder-btn"
                        onClick={() => setExpandedCategory(expandedCategory === 'security_access' ? '' : 'security_access')}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck style={{ width: '14px', height: '14px', color: 'var(--color-green)' }} />
                          🛡️ Level 2 · Network Security
                        </span>
                        {expandedCategory === 'security_access' ? <ChevronDown style={{ width: '14px', height: '14px' }} /> : <ChevronRight style={{ width: '14px', height: '14px' }} />}
                      </button>
                      {expandedCategory === 'security_access' && (
                        <div style={{ background: 'var(--color-background-secondary)', padding: '4px 0' }}>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'security_groups' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('security_groups')}
                          >
                            {t('2.1 Doorman vs Customs (Security Groups & NACLs)')}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Level 3: Purchasing Options */}
                    <div>
                      <button
                        className="acad-dir-folder-btn"
                        onClick={() => setExpandedCategory(expandedCategory === 'purchasing_options' ? '' : 'purchasing_options')}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <DollarSign style={{ width: '14px', height: '14px', color: 'var(--color-amber)' }} />
                          💰 Level 3 · Pricing &amp; Savings
                        </span>
                        {expandedCategory === 'purchasing_options' ? <ChevronDown style={{ width: '14px', height: '14px' }} /> : <ChevronRight style={{ width: '14px', height: '14px' }} />}
                      </button>
                      {expandedCategory === 'purchasing_options' && (
                        <div style={{ background: 'var(--color-background-secondary)', padding: '4px 0' }}>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'purchasing_models' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('purchasing_models')}
                          >
                            {t('3.1 EC2 Pricing Models (On-Demand vs Reserved vs Spot)')}
                          </button>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'burstable_performance' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('burstable_performance')}
                          >
                            {t('3.2 Burstable CPU Credit Bank')}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Level 4: Storage Types */}
                    <div>
                      <button
                        className="acad-dir-folder-btn"
                        onClick={() => setExpandedCategory(expandedCategory === 'storage_audit' ? '' : 'storage_audit')}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <HardDrive style={{ width: '14px', height: '14px', color: 'var(--color-purple)' }} />
                          💾 Level 4 · Storage Types
                        </span>
                        {expandedCategory === 'storage_audit' ? <ChevronDown style={{ width: '14px', height: '14px' }} /> : <ChevronRight style={{ width: '14px', height: '14px' }} />}
                      </button>
                      {expandedCategory === 'storage_audit' && (
                        <div style={{ background: 'var(--color-background-secondary)', padding: '4px 0' }}>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'storage_comparison' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('storage_comparison')}
                          >
                            {t('4.1 Storage Architecture (EBS vs EFS vs Instance Store)')}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Level 5: Architecture & HA */}
                    <div>
                      <button
                        className="acad-dir-folder-btn"
                        onClick={() => setExpandedCategory(expandedCategory === 'ha_architecture' ? '' : 'ha_architecture')}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Layers style={{ width: '14px', height: '14px', color: '#0ea5e9' }} />
                          🏗️ Level 5 · High Availability
                        </span>
                        {expandedCategory === 'ha_architecture' ? <ChevronDown style={{ width: '14px', height: '14px' }} /> : <ChevronRight style={{ width: '14px', height: '14px' }} />}
                      </button>
                      {expandedCategory === 'ha_architecture' && (
                        <div style={{ background: 'var(--color-background-secondary)', padding: '4px 0' }}>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'placement_groups' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('placement_groups')}
                          >
                            {t('5.1 Placement Groups Explained')}
                          </button>
                          <button
                            className={`acad-dir-item-btn ${selectedNote === 'best_practices' ? 'acad-active' : ''}`}
                            onClick={() => setSelectedNote('best_practices')}
                          >
                            {t('5.2 The 4 Golden Rules of Cloud HA')}
                          </button>
                        </div>
                      )}
                    </div>

                  </div>

                  <div style={{ background: 'var(--color-background-primary)', borderRadius: '16px', padding: '16px', color: 'var(--color-text-secondary)', fontSize: '11px', marginTop: '16px', border: '1px solid var(--color-border-tertiary)', lineHeight: '1.5' }}>
                    <span style={{ color: 'var(--color-text-primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '11.5px' }}>
                      <Lightbulb style={{ width: '14px', height: '14px', color: '#f59e0b' }} /> Interactive Visualizer Link
                    </span>
                    Each note includes direct quick-launch buttons to open the live interactive simulations for that specific topic!
                  </div>
                </div>

                {/* Right Content Panel */}
                <div className="acad-col-9">

                  {/* NOTE 1.1: What is EC2 */}
                  {selectedNote === 'ec2_what_is' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                          {t('1.1 What is Amazon EC2? (Elastic Compute Cloud)')}
                        </h3>
                        <span className="acad-hero-badge">🐣 Level 1 · Fundamentals</span>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> EC2 is simply <strong>renting a virtual computer in Amazon&apos;s data center</strong> instead of buying a heavy physical computer box. You pick how much CPU, memory, and disk space you need, and you only pay for the exact seconds it runs.
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Rent-a-Laptop Store
                        </div>
                        <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                          Imagine walking into an electronic rental store. Instead of paying $2,000 to buy a server, you tell the clerk: <em>&ldquo;I need a machine with 4 CPU cores and 16 GB RAM with Linux installed for the next 3 hours.&rdquo;</em> They hand you the computer. You run your web application, shut it down when done, and pay 15 cents. If tomorrow you get 10,000 customers, you can instantly rent 50 more identical laptops in 60 seconds. That is the &ldquo;Elastic&rdquo; in EC2!
                        </p>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '18px 0 10px' }}>The 3 Core Anatomy Layers of an EC2 Instance</h4>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        <div className="acad-flow-step">
                          <Server style={{ width: '20px', height: '20px', color: 'var(--color-blue)', flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: 'var(--color-text-primary)', display: 'block' }}>1. Physical Host &amp; Nitro</strong>
                            <span style={{ fontSize: '10.5px' }}>Giant server rack with hypervisor card that manages hardware resources safely.</span>
                          </div>
                        </div>
                        <div className="acad-flow-step">
                          <Cpu style={{ width: '20px', height: '20px', color: 'var(--color-purple)', flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: 'var(--color-text-primary)', display: 'block' }}>2. Virtual Machine (vCPU &amp; RAM)</strong>
                            <span style={{ fontSize: '10.5px' }}>Your dedicated slice of computing power isolated from other AWS customers.</span>
                          </div>
                        </div>
                        <div className="acad-flow-step">
                          <HardDrive style={{ width: '20px', height: '20px', color: 'var(--color-green)', flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: 'var(--color-text-primary)', display: 'block' }}>3. Operating System (Guest OS)</strong>
                            <span style={{ fontSize: '10.5px' }}>Amazon Linux, Ubuntu, Debian, Red Hat, or Windows Server.</span>
                          </div>
                        </div>
                      </div>

                      {/* Lifecycle Flow */}
                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '18px 0 10px' }}>The 5 Instance Lifecycle States</h4>
                      
                      {/* 💡 Humanized EC2 State Transition Breakdown */}
                      <div className="acad-analogy-box" style={{ margin: '12px 0 16px', fontSize: '11.5px', textAlign: 'left' }}>
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          💡 What Happens During Each EC2 State Transition?
                        </div>
                        <ul className="list-disc pl-4 space-y-1.5" style={{ lineHeight: '1.55' }}>
                          <li><strong>▶️ Start:</strong> Hypervisor assigns CPU/RAM capacity on a physical host and attaches root EBS disk. Instance receives a new public IP address.</li>
                          <li><strong>⏹️ Stop:</strong> Compute billing stops, RAM memory is wiped, but data on root EBS disk persists. Re-starting assigns a NEW public IP unless using an Elastic IP (EIP).</li>
                          <li><strong>❄️ Hibernate:</strong> RAM memory contents are frozen onto the root EBS volume before powering off. Re-starting resumes application state instantly!</li>
                          <li><strong>❌ Terminate:</strong> Hypervisor permanently destroys the virtual machine and deletes default root EBS volumes.</li>
                        </ul>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '10px 0 16px' }}>
                        <span className="ec2-badge" style={{ background: '#64748b', color: '#fff', fontSize: '10.5px' }}>⏹️ Pending (Starting up)</span>
                        <span style={{ color: 'var(--color-text-secondary)', alignSelf: 'center' }}>➔</span>
                        <span className="ec2-badge" style={{ background: 'var(--color-green)', color: '#fff', fontSize: '10.5px' }}>🟢 Running (Billed per second)</span>
                        <span style={{ color: 'var(--color-text-secondary)', alignSelf: 'center' }}>➔</span>
                        <span className="ec2-badge" style={{ background: 'var(--color-amber)', color: '#fff', fontSize: '10.5px' }}>⏸️ Stopped (No CPU cost!)</span>
                        <span style={{ color: 'var(--color-text-secondary)', alignSelf: 'center' }}>➔</span>
                        <span className="ec2-badge" style={{ background: 'var(--color-red)', color: '#fff', fontSize: '10.5px' }}>🗑️ Terminated (Deleted forever)</span>
                      </div>

                      {/* Gotcha Warning Box */}
                      <div className="acad-gotcha-box">
                        <strong>⚠️ Common Beginner Trap: &ldquo;Stopped&rdquo; vs &ldquo;Terminated&rdquo; Billing</strong>
                        <ul style={{ margin: '6px 0 0', paddingLeft: '16px' }}>
                          <li>When you <strong>Stop</strong> an EC2 instance, AWS stops charging for CPU and RAM. However, the attached <strong>EBS storage disk is still holding your files</strong>, so storage costs continue until you Terminate it!</li>
                          <li>When you <strong>Terminate</strong> an instance, the virtual computer is deleted and the root storage is released.</li>
                        </ul>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '22px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Ready to try building a virtual machine?</span>
                        <button
                          className="ec2-btn ec2-on"
                          onClick={() => setActiveTab('overview')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap style={{ width: '14px', height: '14px' }} />
                          Open Core &amp; Bootstrap Simulator Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 1.2: User Data & IMDSv2 */}
                  {selectedNote === 'ec2_bootstrap' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                          {t('1.2 Bootstrapping (User Data), AMIs & Digital ID (IMDSv2)')}
                        </h3>
                        <span className="acad-hero-badge">🐣 Level 1 · Fundamentals</span>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> When you spin up a brand-new cloud server, how do you install software, start Nginx, or download your website files without logging in manually? You use a <strong>User Data Startup Script</strong>.
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The New Phone Setup Wizard
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.8px', lineHeight: '1.6' }}>
                          <li><strong>User Data:</strong> Like the initial setup wizard on a new iPhone. It runs automatically <strong>exactly once on the first boot</strong> as the administrator (<code>root</code>) to install updates, configure settings, and launch apps.</li>
                          <li><strong>Golden AMI (Amazon Machine Image):</strong> Like saving a complete backup clone of your perfectly set-up laptop onto a USB flash drive. Whenever you need 20 more servers, you clone from this template in seconds with zero startup lag!</li>
                          <li><strong>IMDSv2 (169.254.169.254):</strong> Like a secure digital building ID badge. Your server asks AWS &ldquo;Who am I? What is my private IP and IAM role?&rdquo; using a tamper-proof session token that blocks malicious web attacks.</li>
                        </ul>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '18px 0 10px' }}>CLI Command Reference: Querying IMDSv2 Metadata</h4>
                      <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>fetch_metadata_imdsv2.sh</span>
                          <button
                            onClick={() => handleCopyCode(imdsCodeSnippet, 'imds_sh')}
                            style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}
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
                          Test Bootstrapping in Simulator Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 2.1: Stateful Security Groups vs Stateless NACLs */}
                  {selectedNote === 'security_groups' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                          {t('2.1 Security Groups vs Network ACLs (Firewalls Decoded)')}
                        </h3>
                        <span className="acad-hero-badge" style={{ background: '#dcfce7', borderColor: '#bbf7d0', color: '#15803d' }}>🛡️ Level 2 · Network Security</span>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> In AWS, firewalls decide who is allowed to talk to your computer (Inbound) and what your computer is allowed to send out (Outbound). AWS gives you two firewall guards: <strong>Security Groups (Instance level)</strong> and <strong>Network ACLs (Subnet level)</strong>.
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Hotel Doorman vs Airport Customs
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.8px', lineHeight: '1.6' }}>
                          <li><strong>Security Group (Stateful) = The Friendly Hotel Doorman:</strong> Has a guest list. If he checks your name and lets you enter through the front door (Inbound HTTP Port 80), he <em>automatically remembers your face</em> and lets you walk back out (Outbound) without asking for ID again! (Stateful means return traffic is auto-approved).</li>
                          <li><strong>Network ACL (Stateless) = Strict Airport Border Customs:</strong> There are two completely separate gates (Arrivals and Departures). Even if you were inspected when entering the country, you must show a separate approved exit passport when leaving (Stateless requires explicit Inbound AND Outbound rules!).</li>
                        </ul>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '18px 0 10px' }}>Side-by-Side Comparison Matrix</h4>
                      <div style={{ overflowX: 'auto', margin: '10px 0 18px' }}>
                        <table className="acad-table">
                          <thead>
                            <tr>
                              <th>Feature</th>
                              <th>Security Group (SG)</th>
                              <th>Network ACL (NACL)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><strong>Scope / Layer</strong></td>
                              <td>Virtual Network Interface (ENI) of each VM</td>
                              <td>VPC Subnet boundary</td>
                            </tr>
                            <tr>
                              <td><strong>State Behavior</strong></td>
                              <td><strong>Stateful</strong> (Return traffic auto-allowed)</td>
                              <td><strong>Stateless</strong> (Must open inbound &amp; outbound)</td>
                            </tr>
                            <tr>
                              <td><strong>Rule Types</strong></td>
                              <td><strong>Allow rules only</strong> (Drops everything else)</td>
                              <td>Supports both <strong>Allow AND Deny rules</strong></td>
                            </tr>
                            <tr>
                              <td><strong>Evaluation Order</strong></td>
                              <td>Evaluates all rules before deciding</td>
                              <td>Evaluates rules in numbered order (100, 200, *)</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '18px 0 10px' }}>Public vs Private IPs &amp; Bastion Host (Jump Box)</h4>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
                        <div className="acad-flow-step">
                          <Globe style={{ width: '20px', height: '20px', color: 'var(--color-blue)', flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: 'var(--color-text-primary)' }}>Public IP = Postal Street Address</strong>
                            <span style={{ fontSize: '10.5px' }}>Accessible to the entire internet for web visitors.</span>
                          </div>
                        </div>
                        <div className="acad-flow-step">
                          <Lock style={{ width: '20px', height: '20px', color: 'var(--color-green)', flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: 'var(--color-text-primary)' }}>Private IP = Internal Room Extension</strong>
                            <span style={{ fontSize: '10.5px' }}>Only reachable inside the private VPC network (safe for databases).</span>
                          </div>
                        </div>
                        <div className="acad-flow-step">
                          <ShieldCheck style={{ width: '20px', height: '20px', color: 'var(--color-purple)', flexShrink: 0 }} />
                          <div>
                            <strong style={{ color: 'var(--color-text-primary)' }}>Bastion Host = Security Gatehouse</strong>
                            <span style={{ fontSize: '10.5px' }}>Single hardened jump server allowing engineers to SSH securely into private DBs.</span>
                          </div>
                        </div>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '18px 0 10px' }}>CLI Command Reference: Authorizing Security Firewall Rules</h4>
                      <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>security_rules.sh</span>
                          <button
                            onClick={() => handleCopyCode(sgCodeSnippet, 'sg_sh')}
                            style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}
                          >
                            <Copy style={{ width: '12px', height: '12px' }} />
                            {copiedNoteId === 'sg_sh' ? 'Copied!' : 'Copy Script'}
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
                          Open Stateful Security Groups Simulator Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 3.1: Pricing Models */}
                  {selectedNote === 'purchasing_models' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                          {t('3.1 EC2 Pricing Models: How to Buy Compute Smartly')}
                        </h3>
                        <span className="acad-hero-badge" style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#b45309' }}>💰 Level 3 · Cost Optimization</span>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> Running servers in the cloud can be very expensive if you pay default prices. AWS gives you <strong>4 different purchasing options</strong> with massive discounts (up to 90%) if you plan ahead.
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Uber vs Apartment Lease vs Standby Flights
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.8px', lineHeight: '1.6' }}>
                          <li><strong>On-Demand = Calling an Uber:</strong> Zero commitment. You pay per second and can cancel whenever you want. Great for quick development or sudden unpredicted traffic spikes.</li>
                          <li><strong>Reserved Instances (RI) = Signing a 1-Year Apartment Lease:</strong> You commit to a specific room for 1 or 3 years. Because you guarantee long-term rent, AWS gives you up to a <strong>72% discount</strong>!</li>
                          <li><strong>Savings Plans = Coffee Spend Subscription ($/hour):</strong> You commit to spending e.g. $10/hour across any compute (EC2, Fargate, Lambda) for 1 or 3 years for up to <strong>72% savings</strong> with flexible instance switching.</li>
                          <li><strong>Spot Instances = Standby Airline Tickets at the Gate:</strong> AWS has unused computers sitting idle in data centers. They sell them at up to <strong>90% discount</strong>! The only catch: if a full-price customer books that seat, AWS gives you a <strong>2-minute warning</strong> and takes it back.</li>
                          <li><strong>Dedicated Hosts = Renting the Entire Private Villa:</strong> You get the entire physical server rack to yourself. Essential for compliance or strict corporate software licenses.</li>
                        </ul>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '18px 0 10px' }}>Purchasing Models Comparison Table</h4>
                      <div style={{ overflowX: 'auto', margin: '10px 0 18px' }}>
                        <table className="acad-table">
                          <thead>
                            <tr>
                              <th>Purchasing Model</th>
                              <th>Discount</th>
                              <th>Commitment</th>
                              <th>Best Used For</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><strong>On-Demand</strong></td>
                              <td>0% (Standard)</td>
                              <td>None (Per second)</td>
                              <td>New apps, unpredictable spikes, short tests</td>
                            </tr>
                            <tr>
                              <td><strong>Reserved Instances (RI)</strong></td>
                              <td>Up to 72%</td>
                              <td>1 or 3 Years (Fixed Type)</td>
                              <td>Steady 24/7 databases and core backend servers</td>
                            </tr>
                            <tr>
                              <td><strong>Compute Savings Plans</strong></td>
                              <td>Up to 72%</td>
                              <td>1 or 3 Years ($ / hour)</td>
                              <td>Modern cloud apps switching between EC2 &amp; containers</td>
                            </tr>
                            <tr>
                              <td><strong>Spot Instances</strong></td>
                              <td>Up to 90%</td>
                              <td>None (Can be reclaimed)</td>
                              <td>Batch data crunching, AI rendering, CI/CD pipelines</td>
                            </tr>
                            <tr>
                              <td><strong>Dedicated Host</strong></td>
                              <td>License savings</td>
                              <td>On-demand or 1/3 yr</td>
                              <td>Bring-Your-Own-License (BYOL), strict compliance</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="acad-gotcha-box">
                        <strong>⚠️ The 2-Minute Spot Reclaim Rule:</strong>
                        <p style={{ margin: '4px 0 0' }}>
                          Never run a non-replicated database on a Spot Instance! Always use <strong>Spot Fleets</strong> with stateless worker nodes so that if one instance is reclaimed, other spot instances in different pools automatically take over.
                        </p>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '18px 0 10px' }}>CLI Command Reference: Requesting Spot Instances</h4>
                      <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>spot_request.sh</span>
                          <button
                            onClick={() => handleCopyCode(spotCodeSnippet, 'spot_sh')}
                            style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}
                          >
                            <Copy style={{ width: '12px', height: '12px' }} />
                            {copiedNoteId === 'spot_sh' ? 'Copied!' : 'Copy Script'}
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
                          Open Spot Reclaim Simulator Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 3.2: Burstable CPU Credits */}
                  {selectedNote === 'burstable_performance' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                          3.2 Burstable Performance &amp; The CPU Credit Bank (T-Series)
                        </h3>
                        <span className="acad-hero-badge" style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#b45309' }}>💰 Level 3 · Instance Economics</span>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> Most small websites are quiet 90% of the day, with occasional bursts when someone clicks a button. <strong>T-series instances (t3, t4g)</strong> are super cheap servers designed for this exact pattern.
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Smartphone Battery Bank &amp; Coffee Punch Card
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.8px', lineHeight: '1.6' }}>
                          <li><strong>Charging Credits:</strong> When your website is idle (e.g. at 5% CPU while waiting for traffic), your server plugs into the charger and deposits <strong>CPU Credits</strong> into its bank account every hour.</li>
                          <li><strong>Spending Credits:</strong> When a rush of 500 visitors suddenly arrives, the server spends its accumulated credits to run at <strong>100% turbo CPU speed</strong> without any lag!</li>
                          <li><strong>Standard Mode vs Unlimited Mode:</strong>
                            <ul style={{ margin: '4px 0 0', paddingLeft: '16px' }}>
                              <li><em>Standard Mode:</em> If your credit bank drops to zero, the server is capped back down to its baseline speed (e.g. 20%). Great for dev servers.</li>
                              <li><em>Unlimited Mode:</em> The server continues running at 100% turbo speed without slowing down, and AWS simply bills a few extra cents on your monthly invoice. Recommended for production!</li>
                            </ul>
                          </li>
                        </ul>
                      </div>

                      {/* Interactive Widget: Credit Accumulator Simulator */}
                      <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', borderRadius: '16px', padding: '20px', margin: '20px 0' }}>
                        <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Activity style={{ width: '16px', height: '16px', color: 'var(--color-blue)' }} />
                          Interactive 24-Hour CPU Credit Simulation
                        </h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 200px' }}>
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px' }}>
                                Select Burstable Instance Size:
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
                              <label style={{ fontSize: '11px', fontWeight: 'bold', color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span>Simulated Average CPU load:</span>
                                <span style={{ color: 'var(--color-blue)', fontWeight: 800 }}>{nbCpuUtilization}%</span>
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
                            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>telemetry-credit-monitor.log</span>
                            {nbCreditLog.length === 0 ? (
                              <div style={{ fontSize: '11.5px', color: 'var(--color-text-tertiary)', fontStyle: 'italic', padding: '16px 0', textAlign: 'center' }}>
                                Click the button above to simulate how the credit bank charges and spends over 24 hours.
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '10.5px' }}>
                                {nbCreditLog.map((log, index) => (
                                  <div
                                    key={index}
                                    style={{
                                      color: index === 0 ? 'var(--color-green)' : log.includes('🚨') ? 'var(--color-red)' : log.includes('📈') ? 'var(--color-green)' : 'var(--color-text-secondary)',
                                      fontWeight: index === 0 ? 'bold' : 'normal',
                                      borderBottom: index === 0 ? '1px solid var(--ec-terminal-border)' : 'none',
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
                          Open Instance Lifecycle Simulator Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 4.1: EBS vs Instance Store vs EFS */}
                  {selectedNote === 'storage_comparison' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                          4.1 Storage Types Decoded: EBS vs Instance Store vs EFS
                        </h3>
                        <span className="acad-hero-badge" style={{ background: '#f3e8ff', borderColor: '#e9d5ff', color: '#7e22ce' }}>💾 Level 4 · Storage Systems</span>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> Where do your files and databases live when you run a cloud computer? AWS offers different storage types based on whether you need <strong>permanent files (EBS)</strong>, <strong>blazing temporary speed (Instance Store)</strong>, or a <strong>shared team drive (EFS)</strong>.
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: External Drive vs Whiteboard vs Google Drive
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.8px', lineHeight: '1.6' }}>
                          <li><strong>EBS (Elastic Block Store) = External USB SSD Hard Drive:</strong> Plugged into your server over a fast network cable. If your computer crashes or restarts, your files stay 100% safe. You can even unplug the drive and plug it into a different server!</li>
                          <li><strong>Instance Store (NVMe SSD) = A Whiteboard Scratchpad:</strong> Built physically right into the server motherboard. It is insanely fast (millions of read/write operations per second), but if you turn off or stop the computer, the whiteboard is <strong>completely wiped clean</strong>! (Ephemeral).</li>
                          <li><strong>EFS (Elastic File System) = Shared Google Drive / Dropbox:</strong> A shared network drive where 1,000+ EC2 servers can read and write the exact same files at the exact same second across multiple availability zones.</li>
                          <li><strong>Amazon S3 = Infinite Cloud Locker:</strong> An object store for pictures, videos, and backups accessible over simple web URLs.</li>
                        </ul>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '18px 0 10px' }}>Storage Category Comparison Table</h4>
                      <div style={{ overflowX: 'auto', margin: '10px 0 18px' }}>
                        <table className="acad-table">
                          <thead>
                            <tr>
                              <th>Feature</th>
                              <th>EBS (Elastic Block Store)</th>
                              <th>Instance Store (NVMe)</th>
                              <th>EFS (Elastic File System)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><strong>Analogy</strong></td>
                              <td>External USB Hard Drive</td>
                              <td>Whiteboard Scratchpad</td>
                              <td>Shared Team Google Drive</td>
                            </tr>
                            <tr>
                              <td><strong>Persistence</strong></td>
                              <td>✅ Persistent (Survives stops)</td>
                              <td>❌ Ephemeral (Wiped on stop)</td>
                              <td>✅ Persistent (Survives terminations)</td>
                            </tr>
                            <tr>
                              <td><strong>Speed / IOPS</strong></td>
                              <td>Fast (Up to 10,000 MB/s)</td>
                              <td>Ultra-fast (Microsecond latency)</td>
                              <td>Scales automatically with files</td>
                            </tr>
                            <tr>
                              <td><strong>Multi-VM Mount</strong></td>
                              <td>❌ 1 instance at a time (mostly)</td>
                              <td>❌ Locked to 1 physical host</td>
                              <td>✅ Thousands of VMs simultaneously</td>
                            </tr>
                            <tr>
                              <td><strong>Best Match</strong></td>
                              <td>Boot drives, MySQL, Postgres</td>
                              <td>Temporary caches, Kafka buffers</td>
                              <td>WordPress media, shared CMS files</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Gotcha Warning Box */}
                      <div className="acad-gotcha-box">
                        <strong>⚠️ The #1 Beginner Disaster: Storing Databases on Instance Store</strong>
                        <p style={{ margin: '4px 0 0' }}>
                          Never store your production database files on an Instance Store disk without continuous replication! When an instance is stopped, the underlying physical hardware is released and all data on the Instance Store is lost forever.
                        </p>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '18px 0 10px' }}>Bash Command: Formatting &amp; Mounting an Attached EBS Volume</h4>
                      <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', borderRadius: '12px', padding: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 'bold' }}>ebs_mount.sh</span>
                          <button
                            onClick={() => handleCopyCode(mountCodeSnippet, 'mount_sh')}
                            style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10.5px' }}
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
                          Open Storage: EBS vs EFS Simulator Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 5.1: Placement Groups */}
                  {selectedNote === 'placement_groups' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                          5.1 EC2 Placement Groups: Where Your Physical Servers Live
                        </h3>
                        <span className="acad-hero-badge" style={{ background: '#e0f2fe', borderColor: '#bae6fd', color: '#0369a1' }}>🏗️ Level 5 · High Availability</span>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> When you launch 10 servers in AWS, by default AWS scatters them randomly in the data center. A <strong>Placement Group</strong> lets you give AWS specific instructions on whether to pack them close together for ultra-fast speed or spread them apart for maximum disaster safety.
                      </div>

                      {/* Everyday Analogy Box */}
                      <div className="acad-analogy-box">
                        <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Seating Your Office Team
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11.8px', lineHeight: '1.6' }}>
                          <li><strong>1. Cluster Group = Putting everyone in the same small conference room:</strong> Everyone sits at the same table. Zero delay when whispering to each other! Delivers ultra-low latency and 100 Gbps network speeds. <em>(Best for AI Model Training, HPC, and big math clusters).</em></li>
                          <li><strong>2. Spread Group = Putting 3 teammates in 3 separate buildings with separate generators:</strong> If lightning strikes Building A, Buildings B and C are 100% fine! Max 7 servers per AZ. <em>(Best for Primary Database + Replicas that can never crash together).</em></li>
                          <li><strong>3. Partition Group = Splitting an army into separate barracks:</strong> Divides your servers into partitions (e.g. Partition 1, Partition 2). Partitions never share physical racks with each other. <em>(Best for Kafka brokers, Cassandra nodes, and Hadoop clusters).</em></li>
                        </ul>
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '18px 0 10px' }}>Placement Groups Quick Cheat-Sheet</h4>
                      <div style={{ overflowX: 'auto', margin: '10px 0 18px' }}>
                        <table className="acad-table">
                          <thead>
                            <tr>
                              <th>Placement Strategy</th>
                              <th>Physical Hardware Arrangement</th>
                              <th>Core Superpower</th>
                              <th>Target Workload</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><strong>Cluster</strong></td>
                              <td>Same physical rack inside 1 Availability Zone</td>
                              <td>⚡ 100 Gbps Low-Latency Network</td>
                              <td>AI/LLM training, HPC, video rendering</td>
                            </tr>
                            <tr>
                              <td><strong>Spread</strong></td>
                              <td>Strictly separate power racks (Max 7 / AZ)</td>
                              <td>🛡️ Maximum physical fault tolerance</td>
                              <td>Critical database primaries and replicas</td>
                            </tr>
                            <tr>
                              <td><strong>Partition</strong></td>
                              <td>Divided into isolated hardware partition groups</td>
                              <td>📊 Scalable partition isolation</td>
                              <td>Apache Kafka, Cassandra, HDFS pools</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                          className="ec2-btn ec2-on"
                          onClick={() => setActiveTab('best')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap style={{ width: '14px', height: '14px' }} />
                          View Placement Groups Diagram in Best Practices Tab
                        </button>
                      </div>
                    </div>
                  )}

                  {/* NOTE 5.2: Best Practices & The 4 Golden Rules */}
                  {selectedNote === 'best_practices' && (
                    <div className="acad-detail-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                          5.2 The 4 Golden Rules of Cloud Architecture &amp; HA
                        </h3>
                        <span className="acad-hero-badge" style={{ background: '#e0f2fe', borderColor: '#bae6fd', color: '#0369a1' }}>🏗️ Level 5 · High Availability</span>
                      </div>

                      {/* Plain English Box */}
                      <div className="acad-plain-english">
                        <strong>✨ In Plain English:</strong> In the cloud, assume hardware can fail at any time. Professional cloud engineers design systems so that even if an entire data center goes dark, users never notice a single second of downtime.
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', margin: '18px 0' }}>
                        <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <span style={{ color: 'var(--color-blue)' }}>🌐</span> Rule 1: Make Web Servers Stateless
                          </div>
                          <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.55' }}>
                            Never save user login sessions or uploaded files directly inside the EC2 hard drive! Offload sessions to <strong>ElastiCache (Redis)</strong> and files to <strong>S3</strong>. That way, any server can crash or scale down without kicking users off.
                          </p>
                        </div>

                        <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <span style={{ color: 'var(--color-green)' }}>🛡️</span> Rule 2: Multi-AZ + Load Balancer
                          </div>
                          <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.55' }}>
                            Never put all your servers in a single Availability Zone. Always place your instances across <strong>at least 2 different AZs</strong> behind an <strong>Application Load Balancer (ALB)</strong> to guarantee 99.99% uptime.
                          </p>
                        </div>

                        <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <span style={{ color: 'var(--color-amber)' }}>📈</span> Rule 3: Automate with Auto Scaling (ASG)
                          </div>
                          <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.55' }}>
                            Never manually click &ldquo;Launch Instance&rdquo; in production. Configure an <strong>Auto Scaling Group</strong> with a target CPU metric (e.g. 60%) to automatically add servers during traffic rushes and terminate them when quiet.
                          </p>
                        </div>

                        <div style={{ background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <span style={{ color: 'var(--color-purple)' }}>🔑</span> Rule 4: Use IAM Roles (No Hardcoded Keys!)
                          </div>
                          <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.55' }}>
                            Never save AWS access keys in config files inside your server! Attach an <strong>IAM Role</strong> directly to the EC2 instance so AWS automatically rotates temporary credentials securely via IMDSv2.
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                          className="ec2-btn ec2-on"
                          onClick={() => setActiveTab('best')}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap style={{ width: '14px', height: '14px' }} />
                          Open Architecture &amp; Audit Simulator Tab
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
                {/* OVERVIEW PANEL: MERGED VIRTUAL CONSOLE & BOOTSTRAPPING */}
        {activeTab === 'overview' && (
          <div>
            
            {/* 🎮 Interactive Simulation Guidance Banner for Merged Tab 2 */}
            <div className="p-4 rounded-xl border mb-5 shadow-sm space-y-3" style={{ background: 'var(--da-tab-bg, rgba(248, 250, 252, 0.9))', borderColor: 'var(--da-card-border, rgba(226, 232, 240, 0.8))' }}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--da-text-title, #0f172a)' }}>
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> 🎮 Core Virtual Machine Console &amp; Bootstrapping Lab Guide
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider" style={{ background: '#0284c715', color: '#0284c7', border: '1px solid #0284c740' }}>
                  Interactive Core Lab
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-lg border space-y-1" style={{ background: 'var(--da-card-bg, #ffffff)', borderColor: 'var(--da-card-border, rgba(226, 232, 240, 0.8))' }}>
                  <span className="font-bold flex items-center gap-1 text-slate-800" style={{ color: 'var(--da-text-title)' }}>
                    🎯 Why This Simulation Exists
                  </span>
                  <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.45' }}>
                    Models the complete virtual server lifecycle: from hypervisor state transitions (Start, Stop, Hibernate, Terminate) to automated first-boot scripts (User Data) and pre-baked Golden AMIs.
                  </p>
                </div>

                <div className="p-3 rounded-lg border space-y-1" style={{ background: 'var(--da-card-bg, #ffffff)', borderColor: 'var(--da-card-border, rgba(226, 232, 240, 0.8))' }}>
                  <span className="font-bold flex items-center gap-1 text-sky-600">
                    👉 When &amp; How to Click
                  </span>
                  <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.45' }}>
                    Step 1: Test hypervisor state actions (Start ▶️, Stop ⏹️, Hibernate ❄️). Step 2: Test User Data script templates. Step 3: Observe Golden AMI baking pipeline.
                  </p>
                </div>

                <div className="p-3 rounded-lg border space-y-1" style={{ background: 'var(--da-card-bg, #ffffff)', borderColor: 'var(--da-card-border, rgba(226, 232, 240, 0.8))' }}>
                  <span className="font-bold flex items-center gap-1 text-emerald-600">
                    🎓 Key Lessons &amp; What You Learned
                  </span>
                  <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.45' }}>
                    Stopping a VM pauses CPU billing &amp; clears RAM. User Data scripts run ONCE on first boot. Pre-baked Golden AMIs allow scaling 100 VMs in under 30 seconds!
                  </p>
                </div>
              </div>

              <div className="acad-plain-english" style={{ marginTop: '8px', marginBottom: '0' }}>
                <strong>✨ In Plain English:</strong> This lab lets you test the full life of a virtual computer: starting it, executing first-time setup scripts, baking a blueprint copy, and stopping or terminating it!
              </div>
            </div>
  
            {/* 1. INTERACTIVE VIRTUAL HYPERVISOR CONSOLE & INSTANCE STATE MACHINE */}
            <div className="ec2-sec">1. Interactive Virtual Hypervisor Console &amp; Instance State Machine</div>
            <div className="ec2-card" style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: '1.45' }}>
                Test instance behavior through standard hypervisor controls on the left. Watch live state transitions, storage attachments, CPU meter, and boot logs in the expanded console terminal on the right.
              </div>

              {/* SIDE-BY-SIDE PRO DASHBOARD: LEFT CONTROLS (5 COLS) + RIGHT TERMINAL CONSOLE (7 COLS) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch" style={{ marginBottom: '16px' }}>
                
                {/* LEFT SIDE: CONTROLS, UNIFORM ACTION BUTTONS & MOTHERBOARD VISUAL (5 COLS) */}
                <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                  
                  {/* CARD 1: HARDWARE & LAUNCH PARAMETERS */}
                  <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--color-border-tertiary)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sliders style={{ width: '14px', height: '14px', color: 'var(--color-blue)' }} />
                      <span>🛠️ EC2 Hardware Launch Parameters</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Instance Class</label>
                        <select value={consoleInstanceType} onChange={(e) => setConsoleInstanceType(e.target.value)} style={{ padding: '6px 8px', fontSize: '11px', width: '100%', borderRadius: '6px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-secondary)' }}>
                          <option value="t3.medium">t3.medium (General)</option>
                          <option value="c6g.large">c6g.large (Compute)</option>
                          <option value="r6g.xlarge">r6g.xlarge (Memory)</option>
                          <option value="i3.xlarge">i3.xlarge (Local Store NVMe)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Launch Model</label>
                        <select value={consolePurchaseModel} onChange={(e) => setConsolePurchaseModel(e.target.value as any)} style={{ padding: '6px 8px', fontSize: '11px', width: '100%', borderRadius: '6px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-secondary)' }}>
                          <option value="ondemand">On-Demand ($/hr)</option>
                          <option value="spot">Spot Capacity</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label style={{ fontSize: '10px', fontWeight: 600, display: 'block', marginBottom: '3px' }}>Storage Setup</label>
                        <select value={consoleStorageType} onChange={(e) => setConsoleStorageType(e.target.value as any)} style={{ padding: '6px 8px', fontSize: '11px', width: '100%', borderRadius: '6px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border-secondary)' }}>
                          <option value="ebs">EBS Only (/dev/xvda)</option>
                          <option value="ephemeral">Local Instance Store Only</option>
                          <option value="both">Both (EBS Root + NVMe local)</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', paddingTop: '14px' }}>
                        <label style={{ fontSize: '10px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontWeight: 600 }}>
                          <input type="checkbox" checked={deleteEbsOnTerm} onChange={(e) => setDeleteEbsOnTerm(e.target.checked)} />
                          Delete EBS on Term
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: UNIFORM & INFORMATIVE POWER STATE ACTION BUTTONS */}
                  <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--color-border-tertiary)' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap style={{ width: '14px', height: '14px', color: '#eab308' }} />
                      <span>🎮 Hypervisor Power State Actions</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {/* LAUNCH / START */}
                      <button
                        onClick={handleConsoleLaunch}
                        disabled={vmState !== 'Stopped' && vmState !== 'Terminated'}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1.5px solid #16a34a',
                          background: vmState === 'Stopped' || vmState === 'Terminated' ? 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)' : 'var(--color-background-primary)',
                          color: vmState === 'Stopped' || vmState === 'Terminated' ? '#ffffff' : 'var(--color-text-tertiary)',
                          cursor: vmState === 'Stopped' || vmState === 'Terminated' ? 'pointer' : 'not-allowed',
                          opacity: vmState === 'Stopped' || vmState === 'Terminated' ? 1 : 0.45,
                          textAlign: 'left',
                          transition: 'all 0.2s ease',
                          boxShadow: vmState === 'Stopped' || vmState === 'Terminated' ? '0 2px 6px rgba(22, 163, 74, 0.25)' : 'none'
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>🚀 Launch / Start</span>
                        </div>
                        <div style={{ fontSize: '9px', opacity: 0.9, marginTop: '2px' }}>Power On &amp; Attach Disk</div>
                      </button>

                      {/* TRIGGER USER DATA */}
                      <button
                        onClick={handleConsoleUserData}
                        disabled={vmState !== 'Running' || vmUserDataTested}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1.5px solid #0284c7',
                          background: vmState === 'Running' && !vmUserDataTested ? 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)' : 'var(--color-background-primary)',
                          color: vmState === 'Running' && !vmUserDataTested ? '#ffffff' : 'var(--color-text-tertiary)',
                          cursor: vmState === 'Running' && !vmUserDataTested ? 'pointer' : 'not-allowed',
                          opacity: vmState === 'Running' && !vmUserDataTested ? 1 : 0.45,
                          textAlign: 'left',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>📄 User Data</span>
                        </div>
                        <div style={{ fontSize: '9px', opacity: 0.9, marginTop: '2px' }}>Run Boot Shell Script</div>
                      </button>

                      {/* LOAD CPU */}
                      <button
                        onClick={handleConsoleLoad}
                        disabled={vmState !== 'Running' || isConsoleSimulatingCpu}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1.5px solid #d97706',
                          background: vmState === 'Running' && !isConsoleSimulatingCpu ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)' : 'var(--color-background-primary)',
                          color: vmState === 'Running' && !isConsoleSimulatingCpu ? '#ffffff' : 'var(--color-text-tertiary)',
                          cursor: vmState === 'Running' && !isConsoleSimulatingCpu ? 'pointer' : 'not-allowed',
                          opacity: vmState === 'Running' && !isConsoleSimulatingCpu ? 1 : 0.45,
                          textAlign: 'left',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>⚡ Load CPU</span>
                        </div>
                        <div style={{ fontSize: '9px', opacity: 0.9, marginTop: '2px' }}>Stress Test Cores</div>
                      </button>

                      {/* STOP INSTANCE */}
                      <button
                        onClick={handleConsoleStop}
                        disabled={vmState !== 'Running'}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1.5px solid #dc2626',
                          background: vmState === 'Running' ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' : 'var(--color-background-primary)',
                          color: vmState === 'Running' ? '#ffffff' : 'var(--color-text-tertiary)',
                          cursor: vmState === 'Running' ? 'pointer' : 'not-allowed',
                          opacity: vmState === 'Running' ? 1 : 0.45,
                          textAlign: 'left',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>🛑 Stop VM</span>
                        </div>
                        <div style={{ fontSize: '9px', opacity: 0.9, marginTop: '2px' }}>Wipe RAM, Keep EBS</div>
                      </button>

                      {/* HIBERNATE */}
                      <button
                        onClick={handleConsoleHibernate}
                        disabled={vmState !== 'Running'}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1.5px solid #7c3aed',
                          background: vmState === 'Running' ? 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)' : 'var(--color-background-primary)',
                          color: vmState === 'Running' ? '#ffffff' : 'var(--color-text-tertiary)',
                          cursor: vmState === 'Running' ? 'pointer' : 'not-allowed',
                          opacity: vmState === 'Running' ? 1 : 0.45,
                          textAlign: 'left',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>❄️ Hibernate</span>
                        </div>
                        <div style={{ fontSize: '9px', opacity: 0.9, marginTop: '2px' }}>Freeze RAM to EBS</div>
                      </button>

                      {/* TERMINATE */}
                      <button
                        onClick={handleConsoleTerminate}
                        disabled={vmState !== 'Running' && vmState !== 'Stopped'}
                        style={{
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1.5px solid #991b1b',
                          background: vmState === 'Running' || vmState === 'Stopped' ? 'linear-gradient(135deg, #991b1b 0%, #b91c1c 100%)' : 'var(--color-background-primary)',
                          color: vmState === 'Running' || vmState === 'Stopped' ? '#ffffff' : 'var(--color-text-tertiary)',
                          cursor: vmState === 'Running' || vmState === 'Stopped' ? 'pointer' : 'not-allowed',
                          opacity: vmState === 'Running' || vmState === 'Stopped' ? 1 : 0.45,
                          textAlign: 'left',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ fontWeight: 800, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>❌ Terminate</span>
                        </div>
                        <div style={{ fontSize: '9px', opacity: 0.9, marginTop: '2px' }}>Permanently Destroy</div>
                      </button>
                    </div>
                  </div>

                  {/* CARD 3: VIRTUAL MOTHERBOARD CHASSIS VISUAL */}
                  <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--color-border-tertiary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--color-text-primary)' }}>🖥️ Motherboard Hardware Chassis</span>
                      <span className="ec2-badge" style={{ 
                        background: vmState === 'Running' ? 'var(--color-green)' : vmState === 'Stopped' ? 'var(--color-red)' : vmState === 'Terminated' ? 'var(--color-text-tertiary)' : 'var(--color-amber)', 
                        color: '#fff',
                        fontWeight: 'bold',
                        fontSize: '9.5px'
                      }}>{vmState.toUpperCase()}</span>
                    </div>

                    {(() => {
                      const isEbsPresent = consoleStorageType === 'ebs' || consoleStorageType === 'both';
                      const isEbsRendered = isEbsPresent && !(vmState === 'Terminated' && deleteEbsOnTerm);
                      const isEbsDetached = vmState === 'Terminated' && !deleteEbsOnTerm;
                      const isNvmePresent = consoleStorageType === 'ephemeral' || consoleStorageType === 'both' || consoleInstanceType === 'i3.xlarge';
                      return (
                        <div style={{ margin: '4px 0', textAlign: 'center' }}>
                          <svg viewBox="0 0 320 170" width="100%" className="ec2-svg-bg" style={{ borderRadius: '8px', border: '1px solid var(--color-border-tertiary)' }}>
                            <defs>
                              <pattern id="motherboard-grid-c" width="10" height="10" patternUnits="userSpaceOnUse">
                                <circle cx="2" cy="2" r="0.6" fill="var(--color-border-secondary)" />
                              </pattern>
                              <linearGradient id="board-cpu-grad-c" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="var(--color-blue)" stopOpacity="0.8" />
                                <stop offset="100%" stopColor="var(--color-blue)" />
                              </linearGradient>
                              <filter id="motherboard-glow-c" x="-10%" y="-10%" width="120%" height="120%">
                                <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="var(--color-blue)" floodOpacity="0.4" />
                              </filter>
                            </defs>
                            <rect width="320" height="170" fill="var(--color-background-secondary)" />
                            <rect width="320" height="170" fill="url(#motherboard-grid-c)" opacity="0.6" />
                            
                            <path d="M 60,70 L 120,70" stroke={vmState === 'Running' ? 'var(--color-blue)' : 'var(--color-border-secondary)'} strokeWidth="1.5" fill="none" opacity="0.6" />
                            <path d="M 60,70 L 120,105" stroke={vmState === 'Running' ? 'var(--color-blue)' : 'var(--color-border-secondary)'} strokeWidth="1.5" fill="none" opacity="0.6" />
                            <path d="M 60,70 L 215,105" stroke={vmState === 'Running' ? 'var(--color-blue)' : 'var(--color-border-secondary)'} strokeWidth="1.5" fill="none" opacity="0.6" />

                            <g transform="translate(20, 40)" style={vmState === 'Running' ? { filter: 'url(#motherboard-glow-c)' } : {}}>
                              <rect x="0" y="0" width="60" height="60" rx="6" fill="var(--color-background-primary)" stroke="var(--color-border-secondary)" strokeWidth="1.5" />
                              <rect x="10" y="10" width="40" height="40" rx="4" fill="url(#board-cpu-grad-c)" opacity={vmState === 'Running' ? '0.3' : '0.05'} />
                              <text x="30" y="32" textAnchor="middle" fontSize="9" fill="var(--color-text-secondary)" fontWeight="bold">CPU</text>
                              <text x="30" y="42" textAnchor="middle" fontSize="6.5" fill="var(--color-text-tertiary)" fontWeight="bold">vCPU Cores</text>
                              
                              {vmState === 'Running' && (
                                <g>
                                  <circle cx="30" cy="30" r="22" fill="none" stroke={isConsoleSimulatingCpu ? 'var(--color-amber)' : 'var(--color-blue)'} strokeWidth="1.5">
                                    <animate attributeName="r" values="10;25" dur={isConsoleSimulatingCpu ? "0.4s" : "1.5s"} repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="1;0" dur={isConsoleSimulatingCpu ? "0.4s" : "1.5s"} repeatCount="indefinite" />
                                  </circle>
                                </g>
                              )}
                            </g>

                            <g transform="translate(120, 22)">
                              <rect x="0" y="0" width="80" height="34" rx="4" fill="var(--color-background-primary)" stroke="var(--color-border-secondary)" strokeWidth="1" />
                              <text x="40" y="10" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)" fontWeight="bold">RAM slots</text>
                              
                              <line x1="10" y1="16" x2="70" y2="16" stroke="var(--color-text-tertiary)" strokeWidth="2" />
                              <line x1="10" y1="22" x2="70" y2="22" stroke="var(--color-text-tertiary)" strokeWidth="2" />

                              <g transform="translate(15, 14)">
                                <circle cx="0" cy="0" r="1.5" fill={vmState === 'Running' ? 'var(--color-green)' : 'var(--color-text-tertiary)'} />
                                <circle cx="10" cy="0" r="1.5" fill={vmState === 'Running' && ['c6g.large', 'r6g.xlarge', 'i3.xlarge'].includes(consoleInstanceType) ? 'var(--color-green)' : 'var(--color-text-tertiary)'} />
                                <circle cx="20" cy="0" r="1.5" fill={vmState === 'Running' && ['r6g.xlarge', 'i3.xlarge'].includes(consoleInstanceType) ? 'var(--color-green)' : 'var(--color-text-tertiary)'} />
                                <circle cx="30" cy="0" r="1.5" fill={vmState === 'Running' && consoleInstanceType === 'r6g.xlarge' ? 'var(--color-green)' : 'var(--color-text-tertiary)'} />
                              </g>
                              <text x="40" y="30" textAnchor="middle" fontSize="6.5" fill="var(--color-blue)" fontWeight="bold">
                                {consoleInstanceType === 't3.medium' ? '4 GiB (Standard)' :
                                 consoleInstanceType === 'c6g.large' ? '8 GiB (Compute)' :
                                 consoleInstanceType === 'r6g.xlarge' ? '32 GiB (Memory!)' :
                                 '16 GiB (Storage Opt)'}
                              </text>
                            </g>

                            {isEbsRendered && (
                              <g transform={`translate(120, ${isEbsDetached ? '122' : '90'})`} style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.15))' }}>
                                <rect x="0" y="0" width="80" height="38" rx="4" 
                                  fill={isEbsDetached ? 'var(--color-background-secondary)' : 'var(--color-background-primary)'} 
                                  stroke={isEbsDetached ? 'var(--color-red)' : vmState === 'Running' ? 'var(--color-green)' : 'var(--color-border-secondary)'} 
                                  strokeWidth="1.2" 
                                />
                                <rect x="2" y="2" width="76" height="6" rx="1" fill={isEbsDetached ? 'var(--color-red)' : 'var(--color-blue)'} />
                                <text x="40" y="17" textAnchor="middle" fontSize="7" fill={isEbsDetached ? 'var(--color-red)' : 'var(--color-text-primary)'} fontWeight="extrabold">EBS Root</text>
                                <text x="40" y="25" textAnchor="middle" fontSize="6" fill={isEbsDetached ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)'} fontWeight="bold">/dev/xvda</text>
                                
                                <text x="40" y="33" textAnchor="middle" fontSize="6" fill={isEbsDetached ? 'var(--color-red)' : 'var(--color-green)'} fontWeight="extrabold">
                                  {isEbsDetached ? '⚠️ DETACHED' : vmState === 'Running' ? '● MOUNT ACTIVE' : '● STANDBY'}
                                </text>
                              </g>
                            )}
                            
                            {!isEbsRendered && isEbsPresent && (
                              <g transform="translate(120, 90)">
                                <rect x="0" y="0" width="80" height="38" rx="4" fill="none" stroke="var(--color-red)" strokeWidth="1" strokeDasharray="3,3" />
                                <text x="40" y="20" textAnchor="middle" fontSize="8" fill="var(--color-red)" fontWeight="bold">EBS DELETED</text>
                                <text x="40" y="30" textAnchor="middle" fontSize="6.5" fill="var(--color-text-tertiary)">(Terminated)</text>
                              </g>
                            )}

                            {isNvmePresent && (
                              <g transform="translate(215, 90)" style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.15))' }}>
                                <rect x="0" y="0" width="80" height="38" rx="4" 
                                  fill={['Stopped', 'Terminated'].includes(vmState) ? 'rgba(239, 68, 68, 0.05)' : 'var(--color-background-primary)'} 
                                  stroke={['Stopped', 'Terminated'].includes(vmState) ? 'var(--color-red)' : vmState === 'Running' ? 'var(--color-green)' : 'var(--color-border-secondary)'} 
                                  strokeWidth="1.2" 
                                />
                                <rect x="2" y="2" width="76" height="6" rx="1" fill={['Stopped', 'Terminated'].includes(vmState) ? 'var(--color-red)' : 'var(--color-purple)'} />
                                <text x="40" y="17" textAnchor="middle" fontSize="7" fill="var(--color-text-primary)" fontWeight="extrabold">NVMe SSD</text>
                                <text x="40" y="25" textAnchor="middle" fontSize="6" fill="var(--color-text-tertiary)" fontWeight="bold">/dev/nvme0n1</text>
                                
                                {['Stopped', 'Terminated'].includes(vmState) ? (
                                  <g>
                                    <rect x="5" y="28" width="70" height="7" rx="1.5" fill="var(--color-red)">
                                      <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" repeatCount="indefinite" />
                                    </rect>
                                    <text x="40" y="34" textAnchor="middle" fontSize="5.5" fill="#fff" fontWeight="extrabold">WIPED / LOSS</text>
                                  </g>
                                ) : (
                                  <text x="40" y="34" textAnchor="middle" fontSize="6" fill={vmState === 'Running' ? 'var(--color-green)' : 'var(--color-text-secondary)'} fontWeight="extrabold">
                                    {vmState === 'Running' ? '⚡ VOLATILE' : 'STANDBY'}
                                  </text>
                                )}
                              </g>
                            )}

                            {!isNvmePresent && (
                              <g transform="translate(215, 90)">
                                <rect x="0" y="0" width="80" height="38" rx="4" fill="none" stroke="var(--color-border-secondary)" strokeWidth="1" />
                                <text x="40" y="18" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)" fontWeight="bold">No Inst Store</text>
                                <text x="40" y="28" textAnchor="middle" fontSize="6.5" fill="var(--color-text-tertiary)">(EBS Only)</text>
                              </g>
                            )}
                          </svg>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* RIGHT SIDE: EXPANDED PROMINENT TERMINAL CONSOLE (7 COLS) */}
                <div className="lg:col-span-7 flex flex-col justify-between" style={{ background: 'var(--color-background-secondary)', padding: '16px', borderRadius: '12px', border: '1.5px solid var(--color-border-tertiary)' }}>
                  
                  {/* Console Header Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--color-border-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Terminal style={{ width: '18px', height: '18px', color: 'var(--color-green)' }} />
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                        Hypervisor Execution Console &amp; Boot Logs
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {/* CPU Gauge Pill */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-background-primary)', padding: '3px 10px', borderRadius: '999px', border: '1px solid var(--color-border-tertiary)', fontSize: '11px' }}>
                        <span style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>CPU:</span>
                        <b style={{ color: consoleCpuGauge > 50 ? 'var(--color-red)' : 'var(--color-green)' }}>{consoleCpuGauge}%</b>
                      </div>

                      {/* State Badge */}
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider" style={{
                        background: vmState === 'Running' ? '#22c55e20' : vmState === 'Stopped' ? '#ef444420' : '#f59e0b20',
                        color: vmState === 'Running' ? '#16a34a' : vmState === 'Stopped' ? '#dc2626' : '#d97706',
                        border: `1px solid ${vmState === 'Running' ? '#22c55e50' : vmState === 'Stopped' ? '#ef444450' : '#f59e0b50'}`
                      }}>
                        {vmState}
                      </span>
                    </div>
                  </div>

                  {/* EXPANDED TERMINAL WINDOW */}
                  <div ref={consoleTerminalRef} className="ec2-terminal" style={{ flex: 1, minHeight: '400px', maxHeight: '480px', background: '#0b132b', border: '1px solid #1e293b', borderRadius: '10px', padding: '14px', overflowY: 'auto' }}>
                    {consoleLogs.map((log, index) => (
                      <div key={index} style={{ 
                        color: log.includes('⚠️') ? '#f87171' : log.includes('[system]') ? '#4ade80' : log.includes('[user-data]') ? '#fbbf24' : '#38bdf8',
                        fontSize: '11px',
                        lineHeight: '1.6',
                        fontFamily: 'monospace'
                      }}>
                        <span style={{ color: '#64748b', marginRight: '8px', fontSize: '10px' }}>[{index + 1}]</span>
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 💡 Humanized Virtual Console State Machine Explanation */}
              <div className="acad-analogy-box" style={{ marginTop: '16px', fontSize: '11.5px', textAlign: 'left' }}>
                <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  💡 What Happens During Each EC2 State Transition?
                </div>
                <ul className="list-disc pl-4 space-y-1.5" style={{ lineHeight: '1.55' }}>
                  <li><strong>▶️ Start / Launch:</strong> Hypervisor assigns CPU/RAM capacity on a physical host and attaches root EBS disk. Instance receives a new public IP address.</li>
                  <li><strong>⏹️ Stop:</strong> Compute billing stops, RAM memory is wiped, but data on root EBS disk persists. Re-starting assigns a NEW public IP unless using an Elastic IP (EIP).</li>
                  <li><strong>❄️ Hibernate:</strong> RAM memory contents are frozen onto the root EBS volume before powering off. Re-starting resumes application state instantly!</li>
                  <li><strong>❌ Terminate:</strong> Hypervisor permanently destroys the virtual machine and deletes default root EBS volumes.</li>
                </ul>
              </div>
            </div>
<div className="ec2-sec">2. User Data Bootstrapping Shell &amp; Metadata (IMDSv2)</div>
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
                        <div key={index} style={{ color: log.startsWith('$') ? 'var(--color-amber)' : log.includes('===') ? 'var(--color-green)' : 'var(--ec-terminal-color)' }}>{log}</div>
                      ))
                    ) : (
                      <div style={{ color: 'var(--color-text-tertiary)' }}>Console idle. Click "Test Bootstrapping Script" to run bash execution pipeline.</div>
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
                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '10px', border: '1.5px solid var(--color-border-tertiary)', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>AMI Baking &amp; Auto-Scaling Launch Pipeline</div>
                  <svg viewBox="0 0 470 160" width="100%" className="ec2-svg-bg">
                    <defs>
                      <marker id="arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-text-tertiary)"/></marker>
                      <linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-blue)" />
                        <stop offset="100%" stopColor="#1d4ed8" />
                      </linearGradient>
                      <linearGradient id="pink-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-purple)" />
                        <stop offset="100%" stopColor="#be185d" />
                      </linearGradient>
                      <linearGradient id="orange-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-amber)" />
                        <stop offset="100%" stopColor="#d97706" />
                      </linearGradient>
                      <linearGradient id="green-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-green)" />
                        <stop offset="100%" stopColor="#047857" />
                      </linearGradient>
                      <filter id="ec2-shadow-net" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.06" />
                      </filter>
                    </defs>

                    {/* PREMIUM NESTED BOUNDARIES */}
                    {/* Host Configuration Zone */}
                    <rect x="5" y="10" width="105" height="140" rx="8" fill="rgba(37, 99, 235, 0.02)" stroke="var(--color-blue)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="57" y="20" textAnchor="middle" fontSize="6.5" fill="var(--color-blue)" fontWeight="bold">📦 HOST CONFIG</text>

                    {/* Baking & Blueprint Vault */}
                    <rect x="120" y="10" width="220" height="140" rx="8" fill="rgba(234, 88, 12, 0.02)" stroke="var(--color-amber)" strokeWidth="1.2" strokeDasharray="4,2" />
                    <text x="230" y="20" textAnchor="middle" fontSize="6.5" fill="var(--color-amber)" fontWeight="bold">💿 BAKING &amp; BLUEPRINT VAULT</text>

                    {/* Auto-scaling Zone */}
                    <rect x="350" y="10" width="115" height="140" rx="8" fill="rgba(16, 185, 129, 0.02)" stroke="var(--color-green)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="407" y="20" textAnchor="middle" fontSize="6.5" fill="var(--color-green)" fontWeight="bold">🚀 AUTO-SCALING ZONE</text>
                    
                    {/* Paths with animatemotion */}
                    <path id="path1" d="M 95, 75 L 135, 75" className={isBootstrapping ? "ec2-flow-orange" : "ec2-flow-blue"} strokeWidth="2" markerEnd="url(#arrow)" />
                    <path id="path2" d="M 215, 75 L 255, 75" className={isBootstrapping ? "ec2-flow-orange" : "ec2-flow-purple"} strokeWidth="2" markerEnd="url(#arrow)" />
                    <path id="path3" d="M 335, 75 L 365, 45" className={isBootstrapping ? "ec2-flow-orange" : "ec2-flow-green"} strokeWidth="2" markerEnd="url(#arrow)" />
                    <path id="path4" d="M 335, 75 L 365, 105" className={isBootstrapping ? "ec2-flow-orange" : "ec2-flow-green"} strokeWidth="2" markerEnd="url(#arrow)" />

                    {/* Active moving pulses */}
                    <circle r="4" fill={isBootstrapping ? "var(--color-amber)" : "var(--color-blue)"}>
                      <animateMotion dur={isBootstrapping ? "1s" : "3s"} repeatCount="indefinite" path="M 95, 75 L 135, 75" />
                    </circle>
                    <circle r="4" fill={isBootstrapping ? "var(--color-amber)" : "var(--color-purple)"}>
                      <animateMotion dur={isBootstrapping ? "1s" : "3s"} repeatCount="indefinite" path="M 215, 75 L 255, 75" />
                    </circle>
                    <circle r="4" fill={isBootstrapping ? "var(--color-amber)" : "var(--color-green)"}>
                      <animateMotion dur={isBootstrapping ? "1.2s" : "4s"} repeatCount="indefinite" path="M 335, 75 L 365, 45" />
                    </circle>
                    <circle r="4" fill={isBootstrapping ? "var(--color-amber)" : "var(--color-green)"}>
                      <animateMotion dur={isBootstrapping ? "1.2s" : "4s"} repeatCount="indefinite" path="M 335, 75 L 365, 105" />
                    </circle>

                    {/* Source EC2 3D Rack */}
                    <g transform="translate(15, 40)" filter="url(#ec2-shadow-net)">
                      <rect x="0" y="0" width="80" height="70" rx="6" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="1.5" />
                      <rect x="5" y="5" width="70" height="15" rx="3" fill="url(#blue-grad)" />
                      <text x="40" y="15" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">Source EC2</text>
                      
                      {/* Rack units */}
                      <rect x="5" y="25" width="70" height="8" rx="1.5" fill="var(--color-background-secondary)" stroke="var(--color-border-secondary)" strokeWidth="0.5" />
                      <circle cx="12" cy="29" r="1.5" fill="var(--color-green)" />
                      <rect x="20" y="28" width="45" height="2" rx="1" fill="var(--color-border-secondary)" />
                      
                      <rect x="5" y="37" width="70" height="8" rx="1.5" fill="var(--color-background-secondary)" stroke="var(--color-border-secondary)" strokeWidth="0.5" />
                      <circle cx="12" cy="41" r="1.5" fill="var(--color-green)" />
                      <rect x="20" y="40" width="45" height="2" rx="1" fill="var(--color-border-secondary)" />

                      <rect x="5" y="49" width="70" height="8" rx="1.5" fill="var(--color-background-secondary)" stroke="var(--color-border-secondary)" strokeWidth="0.5" />
                      <circle cx="12" cy="53" r="1.5" fill="var(--color-red)" />
                      <rect x="20" y="52" width="45" height="2" rx="1" fill="var(--color-border-secondary)" />
                      
                      <text x="40" y="66" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)" fontWeight="500">(Configured Host)</text>
                    </g>

                    {/* Snapshot Storage Cylinder */}
                    <g transform="translate(130, 40)" filter="url(#ec2-shadow-net)">
                      <rect x="0" y="0" width="80" height="70" rx="6" fill="var(--color-background-primary)" stroke="var(--color-purple)" strokeWidth="1.5" />
                      <rect x="5" y="5" width="70" height="15" rx="3" fill="url(#pink-grad)" />
                      <text x="40" y="15" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">Snapshot</text>
                      
                      {/* 3D database disk cylinder outline */}
                      <ellipse cx="40" cy="32" rx="20" ry="6" fill="var(--color-background-secondary)" stroke="var(--color-purple)" strokeWidth="1" />
                      <path d="M20,32 L20,44 A20,6 0 0,0 60,44 L60,32" fill="var(--color-background-secondary)" stroke="var(--color-purple)" strokeWidth="1" />
                      <path d="M20,44 L20,56 A20,6 0 0,0 60,56 L60,44" fill="var(--color-background-secondary)" stroke="var(--color-purple)" strokeWidth="1" />
                      
                      <text x="40" y="66" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)" fontWeight="500">(Root EBS Copy)</text>
                    </g>

                    {/* Golden AMI (Baked disc) */}
                    <g transform="translate(250, 40)" filter="url(#ec2-shadow-net)">
                      <rect x="0" y="0" width="80" height="70" rx="6" fill="var(--color-background-primary)" stroke="var(--color-amber)" strokeWidth="1.5" />
                      <rect x="5" y="5" width="70" height="15" rx="3" fill="url(#orange-grad)" />
                      <text x="40" y="15" textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">Golden AMI</text>
                      
                      {/* Compact Disc shape */}
                      <circle cx="40" cy="38" r="14" fill="var(--color-background-primary)" stroke="var(--color-amber)" strokeWidth="1.5" />
                      <circle cx="40" cy="38" r="4" fill="var(--color-background-secondary)" stroke="var(--color-amber)" strokeWidth="1" />
                      <path d="M 40,24 A 14,14 0 0, 1 54,38" stroke="var(--color-amber)" strokeWidth="1" strokeDasharray="2,2" fill="none" />
                      
                      <text x="40" y="66" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)" fontWeight="500">(Template Image)</text>
                    </g>

                    {/* Replicas (Green Racks) */}
                    {/* Replica 1 */}
                    <g transform="translate(370, 10)" filter="url(#ec2-shadow-net)">
                      <rect x="0" y="0" width="80" height="60" rx="6" fill="var(--color-background-primary)" stroke="var(--color-green)" strokeWidth="1.5" />
                      <rect x="5" y="5" width="70" height="12" rx="3" fill="url(#green-grad)" />
                      <text x="40" y="13" textAnchor="middle" fontSize="7.5" fill="#fff" fontWeight="bold">EC2 Replica 1</text>
                      
                      {/* mini rack lines */}
                      <rect x="10" y="24" width="60" height="4" rx="1" fill="var(--color-background-secondary)" stroke="var(--color-green)" strokeWidth="0.5" />
                      <rect x="10" y="32" width="60" height="4" rx="1" fill="var(--color-background-secondary)" stroke="var(--color-green)" strokeWidth="0.5" />
                      
                      <text x="40" y="48" textAnchor="middle" fontSize="7" fill="var(--color-green)" fontWeight="bold">Active</text>
                    </g>

                    {/* Replica 2 */}
                    <g transform="translate(370, 85)" filter="url(#ec2-shadow-net)">
                      <rect x="0" y="0" width="80" height="60" rx="6" fill="var(--color-background-primary)" stroke="var(--color-green)" strokeWidth="1.5" />
                      <rect x="5" y="5" width="70" height="12" rx="3" fill="url(#green-grad)" />
                      <text x="40" y="13" textAnchor="middle" fontSize="7.5" fill="#fff" fontWeight="bold">EC2 Replica 2</text>
                      
                      {/* mini rack lines */}
                      <rect x="10" y="24" width="60" height="4" rx="1" fill="var(--color-background-secondary)" stroke="var(--color-green)" strokeWidth="0.5" />
                      <rect x="10" y="32" width="60" height="4" rx="1" fill="var(--color-background-secondary)" stroke="var(--color-green)" strokeWidth="0.5" />
                      
                      <text x="40" y="48" textAnchor="middle" fontSize="7" fill="var(--color-green)" fontWeight="bold">Active</text>
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            {/* EC2 INSTANCE FAMILIES SPECS DIRECTORY (TABULAR COMPARISON & DIFFERENTIATION MATRIX) */}
            <div className="ec2-sec" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu style={{ width: '16px', height: '16px', color: 'var(--color-blue)' }} />
                <span>EC2 Instance Families Specs Directory &amp; Comparison Matrix</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  className={`ec2-filter-pill ${familyViewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setFamilyViewMode('table')}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  <TableIcon style={{ width: '12px', height: '12px' }} /> Table Matrix
                </button>
                <button
                  className={`ec2-filter-pill ${familyViewMode === 'cards' ? 'active' : ''}`}
                  onClick={() => setFamilyViewMode('cards')}
                  style={{ padding: '4px 10px', fontSize: '11px' }}
                >
                  <LayoutGrid style={{ width: '12px', height: '12px' }} /> Visual Cards
                </button>
              </div>
            </div>

            <div className="ec2-card" style={{ padding: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: '1.5' }}>
                Choosing an EC2 instance type determines the physical hardware allocated by the Nitro hypervisor. AWS classifies over 500+ instance configurations into <b>5 core hardware families</b>. Compare CPU-to-memory ratios, maximum throughput, storage architectures, and trade-offs side-by-side below:
              </div>

              {/* Instant Workload Matcher / Advisor */}
              <div style={{ background: 'var(--color-background-secondary)', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--color-border-tertiary)', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Sparkles style={{ width: '14px', height: '14px', color: 'var(--color-amber)' }} />
                  <span>🎯 Quick Workload Matcher (Click your scenario to highlight best family):</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {[
                    { id: 'general', label: '🌐 Web Apps & Microservices', match: 'General Purpose (T / M)' },
                    { id: 'compute', label: '⚡ Batch Processing & Video Encoding', match: 'Compute Optimized (C)' },
                    { id: 'memory', label: '🧠 In-Memory Redis / SAP HANA', match: 'Memory Optimized (R / X / Z)' },
                    { id: 'storage', label: '💾 Kafka Brokers & NoSQL (Cassandra)', match: 'Storage Optimized (I / D / H)' },
                    { id: 'gpu', label: '🎨 Generative AI, LLMs & 3D GPU', match: 'Accelerated Computing (G / P / Trn)' }
                  ].map(scenario => (
                    <button
                      key={scenario.id}
                      className={`ec2-advisor-chip ${selectedFamily === scenario.id ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedFamily(scenario.id);
                        setFamilyAdvisorWorkload(scenario.label);
                        setFamilyCategoryFilter('all');
                      }}
                    >
                      {scenario.label}
                    </button>
                  ))}
                </div>
                {familyAdvisorWorkload && (
                  <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px dashed var(--color-border-tertiary)', fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 style={{ width: '13px', height: '13px', color: 'var(--color-green)' }} />
                    <span>Active recommendation for <b>{familyAdvisorWorkload}</b>: Highlighting <b>{INSTANCE_FAMILIES[selectedFamily].name}</b> with hardware specifications below.</span>
                  </div>
                )}
              </div>

              {/* Search & Category Filter Toolbar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                {/* Category Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {[
                    { id: 'all', label: 'All Families (5)' },
                    { id: 'general', label: '💻 General (T/M)' },
                    { id: 'compute', label: '⚡ Compute (C)' },
                    { id: 'memory', label: '🧠 Memory (R/X)' },
                    { id: 'storage', label: '💾 Storage (I/D)' },
                    { id: 'gpu', label: '🎨 Accelerated (GPU/AI)' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      className={`ec2-filter-pill ${familyCategoryFilter === tab.id ? 'active' : ''}`}
                      onClick={() => setFamilyCategoryFilter(tab.id as any)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search Input */}
                <div style={{ position: 'relative', minWidth: '240px', flex: '1 1 240px', maxWidth: '360px' }}>
                  <Search style={{ width: '13px', height: '13px', position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)' }} />
                  <input
                    type="text"
                    placeholder="Search by prefix (t4g, c7i, r7g, i4i, p5) or use-case..."
                    value={familySearchQuery}
                    onChange={(e) => setFamilySearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 28px 6px 30px',
                      fontSize: '11.5px',
                      borderRadius: '8px',
                      border: '1px solid var(--color-border-secondary)',
                      background: 'var(--color-background-primary)',
                      color: 'var(--color-text-primary)'
                    }}
                  />
                  {familySearchQuery && (
                    <button
                      onClick={() => setFamilySearchQuery('')}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}
                    >
                      <X style={{ width: '12px', height: '12px' }} />
                    </button>
                  )}
                </div>
              </div>

              {/* TABLE VIEW */}
              {familyViewMode === 'table' && (
                <div className="ec2-fam-table-wrapper" style={{ marginBottom: '16px' }}>
                  <table className="ec2-fam-table">
                    <thead>
                      <tr>
                        <th style={{ width: '190px' }}>Instance Family &amp; Class</th>
                        <th style={{ width: '140px' }}>RAM : vCPU Ratio</th>
                        <th style={{ width: '140px' }}>vCPU &amp; RAM Specs</th>
                        <th style={{ width: '140px' }}>Storage Architecture</th>
                        <th style={{ width: '130px' }}>Max Network / EBS</th>
                        <th>Core Architectural Differentiator</th>
                        <th style={{ width: '170px' }}>Best Target Workloads</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(INSTANCE_FAMILIES)
                        .filter(famKey => {
                          const fam = INSTANCE_FAMILIES[famKey];
                          if (familyCategoryFilter !== 'all' && fam.category !== familyCategoryFilter) return false;
                          if (familySearchQuery.trim()) {
                            const query = familySearchQuery.toLowerCase();
                            const matchName = fam.name.toLowerCase().includes(query);
                            const matchClass = fam.classCode.toLowerCase().includes(query);
                            const matchPrefix = fam.prefixList.some(p => p.toLowerCase().includes(query));
                            const matchUseCase = fam.useCase.toLowerCase().includes(query);
                            const matchDiff = fam.keyDifferentiator.toLowerCase().includes(query);
                            const matchIdeal = fam.idealFor.some(item => item.toLowerCase().includes(query));
                            return matchName || matchClass || matchPrefix || matchUseCase || matchDiff || matchIdeal;
                          }
                          return true;
                        })
                        .map(famKey => {
                          const fam = INSTANCE_FAMILIES[famKey];
                          const isSelected = selectedFamily === famKey;
                          return (
                            <tr
                              key={famKey}
                              className={isSelected ? 'ec2-fam-row-active' : ''}
                              onClick={() => setSelectedFamily(famKey)}
                              style={{
                                borderLeft: isSelected ? `4px solid ${fam.themeColor}` : '4px solid transparent'
                              }}
                            >
                              {/* Column 1: Family & Class */}
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontSize: '20px' }}>{fam.icon}</span>
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {fam.name.split(' ')[0]}
                                      <span
                                        style={{
                                          fontSize: '9.5px',
                                          fontWeight: 800,
                                          padding: '1px 6px',
                                          borderRadius: '4px',
                                          background: fam.accentBg,
                                          color: fam.themeColor,
                                          border: `1px solid ${fam.themeColor}40`
                                        }}
                                      >
                                        {fam.classCode}
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                                      {fam.prefixList.slice(0, 4).join(', ')}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Column 2: Ratio */}
                              <td>
                                <div
                                  className="ec2-ratio-badge"
                                  style={{
                                    background: fam.accentBg,
                                    color: fam.themeColor,
                                    border: `1px solid ${fam.themeColor}30`
                                  }}
                                >
                                  {fam.ratio}
                                </div>
                                <div className="ec2-ratio-meter">
                                  <div
                                    className="ec2-ratio-meter-fill"
                                    style={{
                                      width: fam.id === 'compute' ? '25%' : fam.id === 'general' ? '50%' : fam.id === 'storage' ? '65%' : fam.id === 'memory' ? '90%' : '100%',
                                      background: fam.themeColor
                                    }}
                                  />
                                </div>
                              </td>

                              {/* Column 3: vCPU & RAM Specs */}
                              <td>
                                <div style={{ fontWeight: 600, fontSize: '11.5px', color: 'var(--color-text-primary)' }}>
                                  {fam.vcpuRange}
                                </div>
                                <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', marginTop: '1px' }}>
                                  {fam.ramRange}
                                </div>
                              </td>

                              {/* Column 4: Storage */}
                              <td>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                  {fam.storageBadge}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '1px' }}>
                                  {fam.storageType}
                                </div>
                              </td>

                              {/* Column 5: Network & EBS */}
                              <td>
                                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                  {fam.networkBandwidth}
                                </div>
                                <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginTop: '1px' }}>
                                  EBS: {fam.ebsBandwidth}
                                </div>
                              </td>

                              {/* Column 6: Differentiator */}
                              <td>
                                <div style={{ fontSize: '11px', lineHeight: '1.4', color: 'var(--color-text-secondary)' }}>
                                  {fam.keyDifferentiator}
                                </div>
                              </td>

                              {/* Column 7: Target Workloads */}
                              <td>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                                  {fam.idealFor.slice(0, 2).map((use, i) => (
                                    <span key={i} className="ec2-tag-pill">
                                      {use}
                                    </span>
                                  ))}
                                  {fam.idealFor.length > 2 && (
                                    <span className="ec2-tag-pill" style={{ opacity: 0.75 }}>
                                      +{fam.idealFor.length - 2} more
                                    </span>
                                  )}
                                </div>
                              </td>

                              
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* CARDS VIEW */}
              {familyViewMode === 'cards' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                  {Object.keys(INSTANCE_FAMILIES)
                    .filter(famKey => {
                      const fam = INSTANCE_FAMILIES[famKey];
                      if (familyCategoryFilter !== 'all' && fam.category !== familyCategoryFilter) return false;
                      if (familySearchQuery.trim()) {
                        const query = familySearchQuery.toLowerCase();
                        return fam.name.toLowerCase().includes(query) || fam.classCode.toLowerCase().includes(query) || fam.prefixList.some(p => p.includes(query)) || fam.useCase.toLowerCase().includes(query);
                      }
                      return true;
                    })
                    .map(famKey => {
                      const fam = INSTANCE_FAMILIES[famKey];
                      const isSelected = selectedFamily === famKey;
                      return (
                        <div
                          key={famKey}
                          onClick={() => setSelectedFamily(famKey)}
                          style={{
                            background: 'var(--color-background-primary)',
                            border: isSelected ? `2px solid ${fam.themeColor}` : '1.5px solid var(--color-border-tertiary)',
                            borderRadius: '12px',
                            padding: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? `0 8px 20px -4px ${fam.themeColor}30` : '0 2px 4px rgba(0,0,0,0.02)',
                            position: 'relative'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '24px' }}>{fam.icon}</span>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-text-primary)' }}>
                                  {fam.name.split(' ')[0]}
                                </div>
                                <div style={{ fontSize: '10.5px', color: 'var(--color-text-tertiary)' }}>
                                  Prefix Class: {fam.classCode}
                                </div>
                              </div>
                            </div>
                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '999px',
                                background: fam.accentBg,
                                color: fam.themeColor,
                                border: `1px solid ${fam.themeColor}40`
                              }}
                            >
                              {fam.ratio}
                            </span>
                          </div>

                          <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.4' }}>
                            {fam.keyDifferentiator}
                          </div>

                          <div style={{ background: 'var(--color-background-secondary)', padding: '10px', borderRadius: '8px', fontSize: '11px', marginBottom: '10px' }}>
                            <div className="ec2-kv" style={{ margin: '3px 0' }}>
                              <span className="ec2-kk" style={{ minWidth: '90px' }}>vCPU Range:</span>
                              <b>{fam.vcpuRange}</b>
                            </div>
                            <div className="ec2-kv" style={{ margin: '3px 0' }}>
                              <span className="ec2-kk" style={{ minWidth: '90px' }}>RAM Range:</span>
                              <b>{fam.ramRange}</b>
                            </div>
                            <div className="ec2-kv" style={{ margin: '3px 0' }}>
                              <span className="ec2-kk" style={{ minWidth: '90px' }}>Network:</span>
                              <b>{fam.networkBandwidth}</b>
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {fam.idealFor.slice(0, 3).map((use, i) => (
                              <span key={i} className="ec2-tag-pill">
                                {use}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECURITY & FIREWALL PANEL */}
        {activeTab === 'security' && (
          <div>
            <div className="ec2-sec">Stateful Security Group Firewall Rules Simulator</div>
            <div className="ec2-card" style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: '1.45' }}>
                Security Groups act as virtual, stateful firewalls on the network interface card (NIC) level of your EC2 host. Test inbound rules on the left and simulate real-time packet evaluation on the right.
              </div>

              {/* 12-COLUMN DASHBOARD GRID: LEFT RULES TABLE (5 COLS) + RIGHT PACKET SIMULATOR (7 COLS) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch" style={{ marginBottom: '16px' }}>
                
                {/* LEFT SIDE: ACTIVE INGRESS RULES TABLE & RULE ADDER (5 COLS) */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                  
                  {/* ACTIVE INBOUND RULES CARD */}
                  <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--color-border-tertiary)', flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <ShieldCheck style={{ width: '15px', height: '15px', color: '#0284c7' }} />
                      <span>🛠️ Active Ingress Rules Table</span>
                    </div>

                    <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
                      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-background-primary)', textAlign: 'left', borderBottom: '1.5px solid var(--color-border-secondary)' }}>
                            <th style={{ padding: '6px 8px' }}>Type</th>
                            <th style={{ padding: '6px 8px' }}>Port</th>
                            <th style={{ padding: '6px 8px' }}>Source CIDR</th>
                            <th style={{ padding: '6px 8px', textAlign: 'center' }}>Remove</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sgRules.map((rule) => (
                            <tr key={rule.id} style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                              <td style={{ padding: '6px 8px', fontWeight: 700 }}>
                                <span style={{
                                  fontSize: '9.5px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: rule.type === 'SSH' ? '#7c3aed15' : rule.type === 'HTTP' ? '#0284c715' : '#16a34a15',
                                  color: rule.type === 'SSH' ? '#7c3aed' : rule.type === 'HTTP' ? '#0284c7' : '#16a34a',
                                  border: `1px solid ${rule.type === 'SSH' ? '#7c3aed40' : rule.type === 'HTTP' ? '#0284c740' : '#16a34a40'}`
                                }}>
                                  {rule.type}
                                </span>
                              </td>
                              <td style={{ padding: '6px 8px', fontWeight: 600 }}>{rule.port}</td>
                              <td style={{ padding: '6px 8px', color: '#0284c7', fontFamily: 'monospace' }}>{rule.source}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                <button
                                  onClick={() => deleteSgRule(rule.id)}
                                  style={{ background: '#ef444415', border: '1px solid #ef444440', color: '#ef4444', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                                >
                                  ✕
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* ADD RULE FORM */}
                    <div style={{ background: 'var(--color-background-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border-secondary)' }}>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                        ➕ Add New Ingress Rule
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div>
                          <label style={{ fontSize: '9.5px', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Type</label>
                          <select value={newRuleType} onChange={(e) => {
                            setNewRuleType(e.target.value);
                            if (e.target.value === 'SSH') setNewRulePort('22');
                            else if (e.target.value === 'HTTP') setNewRulePort('80');
                            else if (e.target.value === 'HTTPS') setNewRulePort('443');
                            else if (e.target.value === 'PostgreSQL') setNewRulePort('5432');
                          }} style={{ padding: '4px 6px', fontSize: '10.5px', width: '100%', borderRadius: '4px', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)' }}>
                            <option value="Custom TCP">Custom TCP</option>
                            <option value="SSH">SSH (Port 22)</option>
                            <option value="HTTP">HTTP (Port 80)</option>
                            <option value="HTTPS">HTTPS (Port 443)</option>
                            <option value="PostgreSQL">PostgreSQL (5432)</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '9.5px', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Port</label>
                          <input type="text" value={newRulePort} onChange={(e) => setNewRulePort(e.target.value)} style={{ padding: '4px 6px', fontSize: '10.5px', width: '100%', border: '1px solid var(--color-border-tertiary)', borderRadius: '4px', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)' }} />
                        </div>

                        <div>
                          <label style={{ fontSize: '9.5px', fontWeight: 600, display: 'block', marginBottom: '2px' }}>Source CIDR</label>
                          <select value={newRuleSource} onChange={(e) => setNewRuleSource(e.target.value)} style={{ padding: '4px 6px', fontSize: '10.5px', width: '100%', borderRadius: '4px', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-primary)' }}>
                            <option value="0.0.0.0/0">0.0.0.0/0 (Global Public)</option>
                            <option value="10.0.1.50/32">10.0.1.50/32 (VPC Bastion)</option>
                            <option value="Corporate Intranet">192.168.0.0/16 (Corp VPN)</option>
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={addSgRule}
                        className="ec2-btn ec2-on"
                        style={{ width: '100%', padding: '6px', fontSize: '11px', fontWeight: 'bold' }}
                      >
                        + Add Ingress Rule
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE: PACKET TEST PLAYGROUND & SVG VISUALIZER (7 COLS) */}
                <div className="lg:col-span-7 flex flex-col justify-between" style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '10px', border: '1px solid var(--color-border-tertiary)' }}>
                  
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Globe style={{ width: '15px', height: '15px', color: '#10b981' }} />
                    <span>📡 Stateful Network Packet Transference Simulator</span>
                  </div>

                  {/* PRESET QUICK TEST BUTTONS */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    <button
                      onClick={() => testSecurityTraffic('internet')}
                      disabled={!!sendingPacket}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1.5px solid #0284c7',
                        background: 'var(--color-background-primary)',
                        color: 'var(--color-text-primary)',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: sendingPacket ? 'not-allowed' : 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      🌐 Web (Port 80)
                    </button>
                    
                    <button
                      onClick={() => testSecurityTraffic('bastion')}
                      disabled={!!sendingPacket}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1.5px solid #7c3aed',
                        background: 'var(--color-background-primary)',
                        color: 'var(--color-text-primary)',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: sendingPacket ? 'not-allowed' : 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      🔒 Bastion (Port 22)
                    </button>

                    <button
                      onClick={() => testSecurityTraffic('corp_app')}
                      disabled={!!sendingPacket}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1.5px solid #16a34a',
                        background: 'var(--color-background-primary)',
                        color: 'var(--color-text-primary)',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: sendingPacket ? 'not-allowed' : 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      🏢 Corp (Port 8080)
                    </button>

                    <button
                      onClick={() => testSecurityTraffic('hacker')}
                      disabled={!!sendingPacket}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1.5px solid #dc2626',
                        background: 'var(--color-background-primary)',
                        color: 'var(--color-text-primary)',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: sendingPacket ? 'not-allowed' : 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      🚨 Hacker (Port 22)
                    </button>
                  </div>

                  {/* SVG ANIMATED SANDBOX */}
                  <div style={{ flex: 1, border: '1.5px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', borderRadius: '10px', padding: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '210px' }}>
                    <svg viewBox="0 0 450 180" width="100%" className="ec2-svg-bg">
                      <defs>
                        <marker id="firewall-arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-text-tertiary)"/></marker>
                        <linearGradient id="shield-grad-blue" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="var(--color-blue)" />
                          <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                        <linearGradient id="shield-grad-green" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="var(--color-green)" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="shield-grad-red" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="var(--color-red)" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                        <filter id="ec2-shadow-net2" x="-10%" y="-10%" width="120%" height="120%">
                          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#0f172a" floodOpacity="0.06" />
                        </filter>
                      </defs>

                      <rect x="5" y="8" width="115" height="164" rx="8" fill="rgba(148, 163, 184, 0.02)" stroke="var(--color-text-tertiary)" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="62" y="18" textAnchor="middle" fontSize="6.5" fill="var(--color-text-secondary)" fontWeight="bold">🌐 PUBLIC INGRESS NETS</text>

                      <rect x="130" y="8" width="140" height="164" rx="8" fill="rgba(37, 99, 235, 0.02)" stroke="var(--color-blue)" strokeWidth="1.2" strokeDasharray="4,2" />
                      <text x="200" y="18" textAnchor="middle" fontSize="6.5" fill="var(--color-blue)" fontWeight="bold">🛡️ STATEFUL SG GATEWAY</text>

                      <rect x="280" y="8" width="165" height="164" rx="8" fill="rgba(16, 185, 129, 0.02)" stroke="var(--color-green)" strokeWidth="1.2" strokeDasharray="3,3" />
                      <text x="362" y="18" textAnchor="middle" fontSize="6.5" fill="var(--color-green)" fontWeight="bold">💻 SECURE COMPUTE SUBNET</text>

                      <path d="M 110, 30 L 200, 90" stroke={sendingPacket === 'internet' ? 'var(--color-amber)' : 'var(--ec-svg-line-stroke)'} strokeWidth="1.5" strokeDasharray={sendingPacket === 'internet' ? 'none' : '3,3'} />
                      <path d="M 110, 70 L 200, 90" stroke={sendingPacket === 'bastion' ? 'var(--color-amber)' : 'var(--ec-svg-line-stroke)'} strokeWidth="1.5" strokeDasharray={sendingPacket === 'bastion' ? 'none' : '3,3'} />
                      <path d="M 110, 110 L 200, 90" stroke={sendingPacket === 'corp_app' ? 'var(--color-amber)' : 'var(--ec-svg-line-stroke)'} strokeWidth="1.5" strokeDasharray={sendingPacket === 'corp_app' ? 'none' : '3,3'} />
                      <path d="M 110, 150 L 200, 90" stroke={sendingPacket === 'hacker' ? 'var(--color-amber)' : 'var(--ec-svg-line-stroke)'} strokeWidth="1.5" strokeDasharray={sendingPacket === 'hacker' ? 'none' : '3,3'} />

                      <path d="M 230, 90 L 290, 90" stroke={firewallTestResult?.status === 'ALLOW' ? 'var(--color-green)' : 'var(--ec-svg-line-stroke)'} strokeWidth="2" markerEnd="url(#firewall-arrow)" />

                      {sendingPacket === 'internet' && (
                        <circle r="5" fill="var(--color-amber)">
                          <animateMotion dur="0.8s" repeatCount="indefinite" path="M 110, 30 L 200, 90" />
                        </circle>
                      )}
                      {sendingPacket === 'bastion' && (
                        <circle r="5" fill="var(--color-amber)">
                          <animateMotion dur="0.8s" repeatCount="indefinite" path="M 110, 70 L 200, 90" />
                        </circle>
                      )}
                      {sendingPacket === 'corp_app' && (
                        <circle r="5" fill="var(--color-amber)">
                          <animateMotion dur="0.8s" repeatCount="indefinite" path="M 110, 110 L 200, 90" />
                        </circle>
                      )}
                      {sendingPacket === 'hacker' && (
                        <circle r="5" fill="var(--color-amber)">
                          <animateMotion dur="0.8s" repeatCount="indefinite" path="M 110, 150 L 200, 90" />
                        </circle>
                      )}

                      {firewallTestResult?.status === 'ALLOW' && (
                        <g>
                          <circle r="5" fill="var(--color-green)">
                            <animateMotion dur="0.6s" repeatCount="indefinite" path="M 230, 90 L 290, 90" />
                          </circle>
                          <path d="M 290, 95 L 230, 95" stroke="var(--color-green)" strokeWidth="1.5" strokeDasharray="3,2" />
                          <circle r="3" fill="var(--color-green)">
                            <animateMotion dur="0.6s" repeatCount="indefinite" path="M 290, 95 L 230, 95" />
                          </circle>
                        </g>
                      )}

                      {firewallTestResult?.status === 'DROP' && (
                        <g>
                          <circle cx="200" cy="90" r="8" fill="none" stroke="var(--color-red)" strokeWidth="2">
                            <animate attributeName="r" values="5;18" dur="0.6s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="1;0" dur="0.6s" repeatCount="indefinite" />
                          </circle>
                          <circle cx="200" cy="90" r="3.5" fill="var(--color-red)" />
                        </g>
                      )}

                      <g onClick={() => testSecurityTraffic('internet')} style={{ cursor: 'pointer' }} transform="translate(12, 23)" filter="url(#ec2-shadow-net2)">
                        <rect x="0" y="0" width="100" height="28" rx="6" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="1" />
                        <text x="50" y="17" textAnchor="middle" fontSize="7.5" fill="var(--color-text-primary)" fontWeight="bold">🌐 Public (Port 80)</text>
                      </g>

                      <g onClick={() => testSecurityTraffic('bastion')} style={{ cursor: 'pointer' }} transform="translate(12, 60)" filter="url(#ec2-shadow-net2)">
                        <rect x="0" y="0" width="100" height="28" rx="6" fill="var(--color-background-primary)" stroke="var(--color-purple)" strokeWidth="1" />
                        <text x="50" y="17" textAnchor="middle" fontSize="7.5" fill="var(--color-text-primary)" fontWeight="bold">🔒 Bastion (Port 22)</text>
                      </g>

                      <g onClick={() => testSecurityTraffic('corp_app')} style={{ cursor: 'pointer' }} transform="translate(12, 97)" filter="url(#ec2-shadow-net2)">
                        <rect x="0" y="0" width="100" height="28" rx="6" fill="var(--color-background-primary)" stroke="var(--color-green)" strokeWidth="1" />
                        <text x="50" y="17" textAnchor="middle" fontSize="7.5" fill="var(--color-text-primary)" fontWeight="bold">🏢 Corp App (Port 8080)</text>
                      </g>

                      <g onClick={() => testSecurityTraffic('hacker')} style={{ cursor: 'pointer' }} transform="translate(12, 134)" filter="url(#ec2-shadow-net2)">
                        <rect x="0" y="0" width="100" height="28" rx="6" fill="var(--color-background-primary)" stroke="var(--color-red)" strokeWidth="1" />
                        <text x="50" y="17" textAnchor="middle" fontSize="7.5" fill="var(--color-text-primary)" fontWeight="bold">🚨 Hacker (Port 22)</text>
                      </g>

                      <g transform="translate(145, 20)" filter="url(#ec2-shadow-net2)">
                        <rect x="0" y="0" width="40" height="140" rx="8" fill="var(--ec-terminal-bg)" stroke="var(--ec-terminal-border)" strokeWidth="1" />
                        <text x="20" y="18" textAnchor="middle" fontSize="6.5" fill="var(--color-text-tertiary)" fontWeight="bold">FIREWALL</text>
                        
                        <line x1="5" y1="28" x2="35" y2="28" stroke="var(--ec-terminal-border)" strokeWidth="1" />
                        <line x1="5" y1="48" x2="35" y2="48" stroke="var(--ec-terminal-border)" strokeWidth="1" />
                        <line x1="5" y1="68" x2="35" y2="68" stroke="var(--ec-terminal-border)" strokeWidth="1" />
                        <line x1="5" y1="88" x2="35" y2="88" stroke="var(--ec-terminal-border)" strokeWidth="1" />
                        <line x1="5" y1="108" x2="35" y2="108" stroke="var(--ec-terminal-border)" strokeWidth="1" />
                        <line x1="5" y1="128" x2="35" y2="128" stroke="var(--ec-terminal-border)" strokeWidth="1" />

                        <circle cx="20" cy="70" r="15" 
                          fill={
                            firewallTestResult?.status === 'ALLOW' ? 'url(#shield-grad-green)' :
                            firewallTestResult?.status === 'DROP' ? 'url(#shield-grad-red)' :
                            'url(#shield-grad-blue)'
                          }
                          stroke="var(--color-text-primary)" 
                          strokeWidth="1.5" 
                        />
                        <text x="20" y="73" textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">SG</text>
                      </g>

                      <g transform="translate(305, 45)" filter="url(#ec2-shadow-net2)">
                        <rect x="0" y="0" width="115" height="90" rx="8" fill="var(--color-background-primary)" 
                          stroke={firewallTestResult?.status === 'ALLOW' ? 'var(--color-green)' : 'var(--color-border-tertiary)'} 
                          strokeWidth={firewallTestResult?.status === 'ALLOW' ? '2.5' : '1.5'} 
                        />
                        
                        <rect x="5" y="5" width="105" height="18" rx="4" fill={firewallTestResult?.status === 'ALLOW' ? 'rgba(16, 185, 129, 0.15)' : 'var(--color-background-secondary)'} />
                        <text x="57.5" y="17" textAnchor="middle" fontSize="8.5" fill="var(--color-text-primary)" fontWeight="bold">EC2 Guest Host</text>

                        <circle cx="20" cy="40" r="4.5" 
                          fill={
                            firewallTestResult?.status === 'ALLOW' ? 'var(--color-green)' :
                            firewallTestResult?.status === 'DROP' ? 'var(--color-red)' :
                            'var(--color-text-tertiary)'
                          } 
                        />
                        <text x="32" y="43" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="bold">
                          {firewallTestResult ? `PORT: ${firewallTestResult.status}` : 'PORT IDLE'}
                        </text>

                        <rect x="15" y="55" width="85" height="4" rx="2" fill="var(--color-border-tertiary)" />
                        <rect x="15" y="65" width="65" height="4" rx="2" fill="var(--color-border-tertiary)" />
                        <rect x="15" y="75" width="75" height="4" rx="2" fill="var(--color-border-tertiary)" />
                      </g>
                    </svg>
                  </div>

                  {/* EVALUATION RESULT EXPLANATION */}
                  <div style={{ marginTop: '10px', textAlign: 'center', background: 'var(--color-background-primary)', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border-tertiary)' }}>
                    {sendingPacket ? (
                      <div style={{ fontSize: '11px', color: 'var(--color-amber)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-amber)', animation: 'ping 1s infinite' }} />
                        Evaluating packet headers against Ingress Security Group rules table...
                      </div>
                    ) : firewallTestResult ? (
                      <div>
                        <span className="ec2-badge" style={{ 
                          background: firewallTestResult.status === 'ALLOW' ? 'var(--color-green)' : 'var(--color-red)', 
                          color: '#fff', 
                          fontSize: '11px',
                          marginBottom: '6px',
                          fontWeight: 'bold'
                        }}>
                          {firewallTestResult.status === 'ALLOW' ? '✅ TRAFFIC ALLOWED (STATEFUL RETURN AUTO-APPROVED)' : '❌ TRAFFIC DROPPED (SILENT TIMEOUT)'}
                        </span>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-primary)', fontWeight: 500, lineHeight: '1.45', padding: '0 8px', marginTop: '4px' }}>
                          {firewallTestResult.msg}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11.5px', color: 'var(--color-text-tertiary)', fontWeight: 500 }}>
                        💡 <b>Test Traffic:</b> Click any preset button above or any node in the SVG diagram to run a simulated firewall inspection!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 💡 Humanized Bastion & Security Group Explanation */}
            <div className="acad-analogy-box" style={{ marginTop: '16px', marginBottom: '24px', fontSize: '11.5px', textAlign: 'left' }}>
              <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                💡 Security Group Legend: How Bastion Proxies &amp; Stateful Rules Protect Private VPC Networks
              </div>
              <ul className="list-disc pl-4 space-y-1.5" style={{ lineHeight: '1.55' }}>
                <li><strong>🚫 Public Internet Access Blocked:</strong> Direct SSH access (Port 22) from the public internet (<code>0.0.0.0/0</code>) to your private application servers is strictly blocked by Security Groups.</li>
                <li><strong>🛡️ Bastion Host Jump Server:</strong> Engineers connect to a single hardened Bastion Proxy inside a public subnet (or via SSM Session Manager).</li>
                <li><strong>🔒 Private Subnet Tunnel:</strong> The Bastion host safely proxies the SSH tunnel to internal private IP addresses (e.g. <code>10.0.1.50</code>) without exposing them to the internet!</li>
                <li><strong>🔄 Stateful Connection Tracking:</strong> Security Groups automatically approve returning outbound response traffic without needing explicit outbound firewall rules.</li>
              </ul>
            </div>

            <div className="ec2-sec">EC2 Instance Placement Groups Architectures</div>
            <div className="ec2-card">
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
                Placement Groups control the physical distribution logic of your EC2 instances within the AWS underlying physical hardware backplane.
              </div>

              <div className="ec2-g3">
                {/* Cluster PG */}
                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '10px', border: '1.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--color-amber)' }}>📍</span> Cluster Group
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '12px', flex: 1 }}>
                    Packs instances close together inside a **single Availability Zone** on the same physical server rack. Provides ultra-low latency and maximum inter-node throughput (up to 100 Gbps).
                  </div>

                  {/* SVG Cluster */}
                  <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <svg viewBox="0 0 200 120" width="100%" className="ec2-svg-bg">
                      <rect x="5" y="5" width="190" height="110" rx="6" fill="var(--color-amber)" fillOpacity="0.05" stroke="var(--color-amber)" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="100" y="15" textAnchor="middle" fontSize="6.5" fill="var(--color-amber)" fontWeight="bold">📍 HIGH-PERFORMANCE RACK ZONE</text>
                      
                      {/* Top Switch */}
                      <rect x="50" y="24" width="100" height="18" rx="4" fill="var(--color-background-primary)" stroke="var(--color-amber)" strokeWidth="1.2" style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.1))' }} />
                      <text x="100" y="35" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--color-amber)">⚡ 100Gbps Switch</text>
 
                       {/* Connections */}
                      <path id="cluster-p1" d="M 45, 75 L 70, 42" stroke="var(--ec-svg-line-stroke)" strokeWidth="1" />
                      <path id="cluster-p2" d="M 100, 75 L 100, 42" stroke="var(--ec-svg-line-stroke)" strokeWidth="1" />
                      <path id="cluster-p3" d="M 155, 75 L 130, 42" stroke="var(--ec-svg-line-stroke)" strokeWidth="1" />
 
                       {/* Packets */}
                      <circle r="2.5" fill="var(--color-amber)">
                        <animateMotion dur="1s" repeatCount="indefinite" path="M 45, 75 L 70, 42" />
                      </circle>
                      <circle r="2.5" fill="var(--color-amber)">
                        <animateMotion dur="1.2s" repeatCount="indefinite" path="M 100, 75 L 100, 42" />
                      </circle>
                      <circle r="2.5" fill="var(--color-amber)">
                        <animateMotion dur="1s" repeatCount="indefinite" path="M 155, 75 L 130, 42" />
                      </circle>

                      {/* Clustered nodes */}
                      <g transform="translate(20, 75)">
                        <rect x="0" y="0" width="45" height="30" rx="4" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="1" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }} />
                        <rect x="3" y="3" width="39" height="6" rx="1.5" fill="var(--color-blue)" />
                        <text x="22.5" y="20" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="var(--color-text-primary)">VM-A</text>
                      </g>
                      
                      <g transform="translate(77, 75)">
                        <rect x="0" y="0" width="45" height="30" rx="4" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="1" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }} />
                        <rect x="3" y="3" width="39" height="6" rx="1.5" fill="var(--color-blue)" />
                        <text x="22.5" y="20" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="var(--color-text-primary)">VM-B</text>
                      </g>
 
                      <g transform="translate(135, 75)">
                        <rect x="0" y="0" width="45" height="30" rx="4" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="1" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }} />
                        <rect x="3" y="3" width="39" height="6" rx="1.5" fill="var(--color-blue)" />
                        <text x="22.5" y="20" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="var(--color-text-primary)">VM-C</text>
                      </g>
                    </svg>
                  </div>
                  <span className="ec2-badge" style={{ background: 'var(--color-amber)', color: '#fff', fontSize: '9px', textAlign: 'center' }}>Best for: High Performance Compute (HPC)</span>
                </div>

                {/* Spread PG */}
                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '10px', border: '1.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--color-green)' }}>📍</span> Spread Group
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '12px', flex: 1 }}>
                    Maps each instance onto **strictly different physical hardware power racks**, separate switches, and isolated power sources. Maximum safety boundary: 7 instances per AZ.
                  </div>

                  {/* SVG Spread */}
                  <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <svg viewBox="0 0 200 120" width="100%" className="ec2-svg-bg">
                      {/* Rack 1 */}
                      <g transform="translate(10, 8)">
                        <rect x="0" y="0" width="50" height="104" rx="4" fill="var(--color-green)" fillOpacity="0.05" stroke="var(--color-green)" strokeWidth="1" strokeDasharray="2,2" />
                        <text x="25" y="10" textAnchor="middle" fontSize="6.5" fill="var(--color-green)" fontWeight="bold">RACK A DOMAIN</text>
                        
                        {/* 3D server */}
                        <g style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.1))' }}>
                          <rect x="5" y="16" width="40" height="22" rx="3" fill="var(--color-background-primary)" stroke="var(--color-green)" strokeWidth="1" />
                          <text x="25" y="30" textAnchor="middle" fontSize="8.5" fill="var(--color-green)" fontWeight="bold">VM-1</text>
                        </g>
                        
                        <text x="25" y="55" textAnchor="middle" fontSize="6" fill="var(--color-green)">🔋 Power-A</text>
                        <text x="25" y="70" textAnchor="middle" fontSize="6" fill="var(--color-green)">🔌 Net-A</text>
                        <circle cx="25" cy="85" r="4.5" fill="var(--color-green)" />
                        <circle cx="25" cy="85" r="2" fill="var(--color-background-primary)" />
                      </g>

                      {/* Rack 2 */}
                      <g transform="translate(75, 8)">
                        <rect x="0" y="0" width="50" height="104" rx="4" fill="var(--color-green)" fillOpacity="0.05" stroke="var(--color-green)" strokeWidth="1" strokeDasharray="2,2" />
                        <text x="25" y="10" textAnchor="middle" fontSize="6.5" fill="var(--color-green)" fontWeight="bold">RACK B DOMAIN</text>
                        
                        <g style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.1))' }}>
                          <rect x="5" y="16" width="40" height="22" rx="3" fill="var(--color-background-primary)" stroke="var(--color-green)" strokeWidth="1" />
                          <text x="25" y="30" textAnchor="middle" fontSize="8.5" fill="var(--color-green)" fontWeight="bold">VM-2</text>
                        </g>
                        
                        <text x="25" y="55" textAnchor="middle" fontSize="6" fill="var(--color-green)">🔋 Power-B</text>
                        <text x="25" y="70" textAnchor="middle" fontSize="6" fill="var(--color-green)">🔌 Net-B</text>
                        <circle cx="25" cy="85" r="4.5" fill="var(--color-green)" />
                        <circle cx="25" cy="85" r="2" fill="var(--color-background-primary)" />
                      </g>

                      {/* Rack 3 */}
                      <g transform="translate(140, 8)">
                        <rect x="0" y="0" width="50" height="104" rx="4" fill="var(--color-green)" fillOpacity="0.05" stroke="var(--color-green)" strokeWidth="1" strokeDasharray="2,2" />
                        <text x="25" y="10" textAnchor="middle" fontSize="6.5" fill="var(--color-green)" fontWeight="bold">RACK C DOMAIN</text>
                        
                        <g style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.1))' }}>
                          <rect x="5" y="16" width="40" height="22" rx="3" fill="var(--color-background-primary)" stroke="var(--color-green)" strokeWidth="1" />
                          <text x="25" y="30" textAnchor="middle" fontSize="8.5" fill="var(--color-green)" fontWeight="bold">VM-3</text>
                        </g>
                        
                        <text x="25" y="55" textAnchor="middle" fontSize="6" fill="var(--color-green)">🔋 Power-C</text>
                        <text x="25" y="70" textAnchor="middle" fontSize="6" fill="var(--color-green)">🔌 Net-C</text>
                        <circle cx="25" cy="85" r="4.5" fill="var(--color-green)" />
                        <circle cx="25" cy="85" r="2" fill="var(--color-background-primary)" />
                      </g>
                    </svg>
                  </div>
                  <span className="ec2-badge" style={{ background: 'var(--color-green)', color: '#fff', fontSize: '9px', textAlign: 'center' }}>Best for: Core Controllers, Core Database Nodes</span>
                </div>

                {/* Partition PG */}
                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '10px', border: '1.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '6px', color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: 'var(--color-blue)' }}>📍</span> Partition Group
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '12px', flex: 1 }}>
                    Divides placement into isolated partitions. Racks in one partition do not share hardware with racks in other partitions. Allows multiple nodes in a single partition.
                  </div>

                  {/* SVG Partition */}
                  <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                    <svg viewBox="0 0 200 120" width="100%" className="ec2-svg-bg">
                      {/* Partition 1 */}
                      <g transform="translate(6, 8)">
                        <rect x="0" y="0" width="90" height="104" rx="4" fill="var(--color-blue)" fillOpacity="0.05" stroke="var(--color-blue)" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="45" y="10" textAnchor="middle" fontSize="6" fill="var(--color-blue)" fontWeight="bold">🛡️ PARTITION 1</text>
                        
                        <g style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                          <rect x="5" y="16" width="36" height="20" rx="2" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="0.8" />
                          <text x="23" y="28" textAnchor="middle" fontSize="7" fill="var(--color-text-primary)" fontWeight="bold">VM-1</text>
                        </g>

                        <g style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                          <rect x="49" y="16" width="36" height="20" rx="2" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="0.8" />
                          <text x="67" y="28" textAnchor="middle" fontSize="7" fill="var(--color-text-primary)" fontWeight="bold">VM-2</text>
                        </g>

                        <g style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                          <rect x="27" y="44" width="36" height="20" rx="2" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="0.8" />
                          <text x="45" y="56" textAnchor="middle" fontSize="7" fill="var(--color-text-primary)" fontWeight="bold">VM-3</text>
                        </g>
                        
                        <path d="M 15, 85 L 75, 85" stroke="var(--ec-svg-line-stroke)" strokeWidth="1.5" strokeDasharray="3,3" />
                        <circle r="3" fill="var(--color-blue)">
                          <animateMotion dur="1.5s" repeatCount="indefinite" path="M 15, 85 L 75, 85" />
                        </circle>
                        <text x="45" y="98" textAnchor="middle" fontSize="5.5" fill="var(--color-text-tertiary)" fontWeight="bold">HDFS / Data Node Pool</text>
                      </g>

                      {/* Partition 2 */}
                      <g transform="translate(104, 8)">
                        <rect x="0" y="0" width="90" height="104" rx="4" fill="var(--color-blue)" fillOpacity="0.05" stroke="var(--color-blue)" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="45" y="10" textAnchor="middle" fontSize="6" fill="var(--color-blue)" fontWeight="bold">🛡️ PARTITION 2</text>
                        
                        <g style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                          <rect x="5" y="16" width="36" height="20" rx="2" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="0.8" />
                          <text x="23" y="28" textAnchor="middle" fontSize="7" fill="var(--color-text-primary)" fontWeight="bold">VM-4</text>
                        </g>

                        <g style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                          <rect x="49" y="16" width="36" height="20" rx="2" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="0.8" />
                          <text x="67" y="28" textAnchor="middle" fontSize="7" fill="var(--color-text-primary)" fontWeight="bold">VM-5</text>
                        </g>

                        <g style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                          <rect x="27" y="44" width="36" height="20" rx="2" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="0.8" />
                          <text x="45" y="56" textAnchor="middle" fontSize="7" fill="var(--color-text-primary)" fontWeight="bold">VM-6</text>
                        </g>
                        
                        <path d="M 15, 85 L 75, 85" stroke="var(--ec-svg-line-stroke)" strokeWidth="1.5" strokeDasharray="3,3" />
                        <circle r="3" fill="var(--color-blue)">
                          <animateMotion dur="1.5s" repeatCount="indefinite" path="M 15, 85 L 75, 85" />
                        </circle>
                        <text x="45" y="98" textAnchor="middle" fontSize="5.5" fill="var(--color-text-tertiary)" fontWeight="bold">Cassandra replicas</text>
                      </g>
                    </svg>
                  </div>
                  <span className="ec2-badge" style={{ background: 'var(--color-blue)', color: '#fff', fontSize: '9px', textAlign: 'center' }}>Best for: Kafka, HDFS, Cassandra, Hadoop</span>
                </div>
              </div>

              {/* 💡 Humanized Placement Groups Explanation Box */}
              <div className="acad-analogy-box" style={{ marginTop: '16px', fontSize: '11.5px', textAlign: 'left' }}>
                <div style={{ fontWeight: 800, color: '#14b8a6', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  💡 Placement Groups Legend: How Hardware Placement Policies Control Fault Isolation &amp; Latency
                </div>
                <ul className="list-disc pl-4 space-y-1.5" style={{ lineHeight: '1.55' }}>
                  <li><strong>📍 Cluster Placement Group:</strong> Packs instances close together on the same physical rack inside 1 AZ. Provides ultra-low 10Gbps latency. Perfect for High Performance Computing (HPC) &amp; AI model training.</li>
                  <li><strong>🛡️ Spread Placement Group:</strong> Strictly places each instance on separate hardware power racks (max 7 per AZ). Prevents simultaneous hardware crashes. Perfect for critical single points of failure.</li>
                  <li><strong>📦 Partition Placement Group:</strong> Divides instances into logical partitions across distinct racks. Partitions do not share hardware. Perfect for distributed big data pools (HDFS, Apache Kafka, Cassandra).</li>
                </ul>
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
                      <b style={{ color: 'var(--color-blue)' }}>${maxBid.toFixed(2)} / Hour</b>
                    </div>
                    <input 
                      type="range" min="0.05" max="0.35" step="0.01" value={maxBid} 
                      onChange={(e) => setMaxBid(Number(e.target.value))} 
                      style={{ width: '100%', accentColor: 'var(--color-blue)' }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '10px' }}>
                      <span>Current Spot Market Price:</span>
                      <b style={{ color: spotPrice > maxBid ? 'var(--color-red)' : 'var(--color-green)' }}>${spotPrice.toFixed(2)} / Hour</b>
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
                    <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '0.5px solid var(--color-red)', padding: '10px', borderRadius: '6px', marginBottom: '10px', textAlign: 'center', animation: 'pulse 2s infinite' }}>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--color-red)' }}>⏳ Reclaiming: {spotCountdown}s</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>AWS is terminating your Spot Instance due to target pricing thresholds!</div>
                    </div>
                  ) : (
                    <div style={{ background: 'rgba(22, 163, 74, 0.08)', border: '0.5px solid var(--color-green)', padding: '10px', borderRadius: '6px', marginBottom: '10px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-green)' }}>🟢 SPOT INSTANCES IN SERVICE</div>
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>Market price remains safely below your Maximum Bid price limit.</div>
                    </div>
                  )}

                  <div className="ec2-terminal" style={{ flex: 1, maxHeight: '140px', background: 'var(--ec-terminal-bg)' }}>
                    {spotLogs.map((log, index) => (
                      <div key={index} style={{ color: log.includes('⚠️') ? 'var(--color-amber)' : log.includes('✅') ? 'var(--color-green)' : log.includes('🔄') ? 'var(--color-blue)' : 'var(--color-text-tertiary)', fontSize: '10px' }}>
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
                    <td style={{ padding: '8px', color: 'var(--color-text-tertiary)' }}>Baseline Cost (0% off)</td>
                    <td style={{ padding: '8px' }}>None (Per-Second Billing)</td>
                    <td style={{ padding: '8px', color: 'var(--color-blue)' }}>Spiky, unpredictable server traffic and early stage apps</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Reserved Instances (RIs)</td>
                    <td style={{ padding: '8px', color: 'var(--color-green)' }}>Up to 72% discount</td>
                    <td style={{ padding: '8px' }}>1 or 3 years (Specific family/AZ)</td>
                    <td style={{ padding: '8px', color: 'var(--color-blue)' }}>Steady-state production database servers and enterprise networks</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Savings Plans</td>
                    <td style={{ padding: '8px', color: 'var(--color-green)' }}>Up to 72% discount</td>
                    <td style={{ padding: '8px' }}>1 or 3 years ($ spend commitment)</td>
                    <td style={{ padding: '8px', color: 'var(--color-blue)' }}>Diverse compute scaling across Fargate, Lambda, and EC2</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Spot Instances</td>
                    <td style={{ padding: '8px', color: 'var(--color-green)', fontWeight: 'bold' }}>Up to 90% discount</td>
                    <td style={{ padding: '8px' }}>None (Interruptible by AWS)</td>
                    <td style={{ padding: '8px', color: 'var(--color-blue)' }}>Container stateless fleets, stateless batch processing, CI/CD workers</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--color-border-tertiary)' }}>
                    <td style={{ padding: '8px', fontWeight: 'bold' }}>Dedicated Hosts</td>
                    <td style={{ padding: '8px', color: 'var(--color-red)' }}>Premium pricing</td>
                    <td style={{ padding: '8px' }}>Physical server dedicated to you</td>
                    <td style={{ padding: '8px', color: 'var(--color-blue)' }}>Strict hardware licensing (BYOL) and server compliance policies</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STORAGE PANEL */}
        {activeTab === 'storage' && (
          <div>
            <div className="ec2-sec">EC2 Instance Storage Architectures (Cumulative 3-Way Comparison: EBS vs Instance Store vs EFS)</div>
            <div className="ec2-card" style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
                Cloud storage is divided into three distinct architectural models: <strong>Network Block SAN (EBS)</strong>, <strong>Direct Physical NVMe (Instance Store)</strong>, and <strong>Multi-AZ Shared NAS (EFS)</strong>. Review the cumulative topology and side-by-side matrix below to understand key performance, persistence, and connectivity differences:
              </div>

              {/* CUMULATIVE 3-WAY ARCHITECTURAL TOPOLOGY SVG DIAGRAM */}
              <div style={{ background: 'var(--color-background-secondary)', padding: '16px', borderRadius: '12px', border: '1.5px solid var(--color-border-tertiary)', marginBottom: '20px' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HardDrive style={{ width: '16px', height: '16px', color: 'var(--color-blue)' }} />
                  <span>Cumulative Storage Topology &amp; Physical Attachment Paths</span>
                </div>

                <svg viewBox="0 0 850 260" width="100%" className="ec2-svg-bg" style={{ borderRadius: '10px', border: '1px solid var(--color-border-tertiary)' }}>
                  <defs>
                    <marker id="cum-arrow-blue" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-blue)"/></marker>
                    <marker id="cum-arrow-green" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-green)"/></marker>
                    <marker id="cum-arrow-purple" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-purple)"/></marker>
                  </defs>

                  {/* BACKGROUND BOUNDARY PANELS */}
                  {/* Panel 1: EBS */}
                  <rect x="15" y="15" width="260" height="230" rx="10" fill="var(--color-blue)" fillOpacity="0.04" stroke="var(--color-blue)" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="145" y="32" textAnchor="middle" fontSize="10" fill="var(--color-blue)" fontWeight="extrabold">💾 1. EBS (Network SAN Block)</text>

                  {/* Panel 2: Instance Store */}
                  <rect x="295" y="15" width="260" height="230" rx="10" fill="var(--color-red)" fillOpacity="0.04" stroke="var(--color-red)" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="425" y="32" textAnchor="middle" fontSize="10" fill="var(--color-red)" fontWeight="extrabold">⚡ 2. Instance Store (Physical NVMe)</text>

                  {/* Panel 3: EFS */}
                  <rect x="575" y="15" width="260" height="230" rx="10" fill="var(--color-green)" fillOpacity="0.04" stroke="var(--color-green)" strokeWidth="1.2" strokeDasharray="4,2" />
                  <text x="705" y="32" textAnchor="middle" fontSize="10" fill="var(--color-green)" fontWeight="extrabold">📁 3. EFS (Multi-AZ Shared NAS)</text>

                  {/* DETAILS INSIDE PANEL 1: EBS */}
                  <g transform="translate(30, 48)">
                    {/* EC2 Instance Node */}
                    <rect x="0" y="0" width="100" height="60" rx="6" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="1.5" />
                    <text x="50" y="24" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--color-text-primary)">EC2 Instance</text>
                    <text x="50" y="38" textAnchor="middle" fontSize="7" fill="var(--color-text-tertiary)">Compute Node (AZ-1)</text>

                    {/* Network Cable Path */}
                    <path d="M 50, 60 L 50, 110" stroke="var(--color-blue)" strokeWidth="2" strokeDasharray="3,3" markerEnd="url(#cum-arrow-blue)" />
                    <circle r="3" fill="var(--color-blue)">
                      <animateMotion dur="1.8s" repeatCount="indefinite" path="M 50, 60 L 50, 110" />
                    </circle>
                    <text x="58" y="88" fontSize="7" fill="var(--color-blue)" fontWeight="bold">SAN Network</text>

                    {/* EBS Disk Node */}
                    <g transform="translate(0, 110)">
                      <rect x="0" y="0" width="100" height="55" rx="6" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="1.5" />
                      <rect x="4" y="4" width="92" height="10" rx="2" fill="var(--color-blue)" />
                      <text x="50" y="12" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff">EBS Volume</text>
                      <text x="50" y="30" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--color-text-primary)">/dev/xvda (gp3)</text>
                      <text x="50" y="44" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--color-green)">✅ PERSISTENT (AZ-1)</text>
                    </g>
                  </g>
                  <text x="145" y="232" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="bold">Single-AZ SAN Network Volume</text>

                  {/* DETAILS INSIDE PANEL 2: INSTANCE STORE */}
                  <g transform="translate(310, 48)">
                    {/* Motherboard Chassis Box */}
                    <rect x="0" y="0" width="230" height="165" rx="8" fill="var(--color-background-primary)" stroke="var(--color-red)" strokeWidth="1.5" />
                    <text x="115" y="16" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="var(--color-red)">Physical Motherboard Chassis</text>

                    {/* CPU Box */}
                    <rect x="15" y="30" width="85" height="50" rx="4" fill="var(--color-background-secondary)" stroke="var(--color-border-secondary)" strokeWidth="1" />
                    <text x="57" y="55" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--color-text-primary)">vCPU &amp; RAM</text>

                    {/* Direct PCIe Bus Line */}
                    <path d="M 100, 55 L 130, 55" stroke="var(--color-red)" strokeWidth="3" />
                    <text x="115" y="48" textAnchor="middle" fontSize="7" fill="var(--color-red)" fontWeight="extrabold">PCIe Bus</text>

                    {/* NVMe SSD Box */}
                    <rect x="130" y="30" width="85" height="50" rx="4" fill="var(--color-background-secondary)" stroke="var(--color-red)" strokeWidth="1.5" />
                    <text x="172" y="52" textAnchor="middle" fontSize="8" fontWeight="extrabold" fill="var(--color-red)">NVMe SSD</text>
                    <text x="172" y="66" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--color-text-tertiary)">/dev/nvme0n1</text>

                    {/* Wiped Warning Box */}
                    <rect x="15" y="95" width="200" height="55" rx="6" fill="rgba(239, 68, 68, 0.08)" stroke="var(--color-red)" strokeWidth="1" />
                    <text x="115" y="114" textAnchor="middle" fontSize="8.5" fontWeight="extrabold" fill="var(--color-red)">⚠️ EPHEMERAL VOLATILE STORAGE</text>
                    <text x="115" y="128" textAnchor="middle" fontSize="7.5" fill="var(--color-text-primary)">Data is completely WIPED if EC2 instance</text>
                    <text x="115" y="140" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="bold">STOPS, TERMINATES, or suffers hardware failure!</text>
                  </g>
                  <text x="425" y="232" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="bold">Direct Motherboard PCIe Bus Attachment</text>

                  {/* DETAILS INSIDE PANEL 3: EFS */}
                  <g transform="translate(590, 48)">
                    {/* 3 Concurrent EC2 Instances */}
                    <g transform="translate(0, 0)">
                      <rect x="0" y="0" width="65" height="35" rx="4" fill="var(--color-background-primary)" stroke="var(--color-green)" strokeWidth="1" />
                      <text x="32" y="21" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--color-text-primary)">EC2 (AZ-A)</text>
                    </g>
                    <g transform="translate(82, 0)">
                      <rect x="0" y="0" width="65" height="35" rx="4" fill="var(--color-background-primary)" stroke="var(--color-green)" strokeWidth="1" />
                      <text x="32" y="21" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--color-text-primary)">EC2 (AZ-B)</text>
                    </g>
                    <g transform="translate(164, 0)">
                      <rect x="0" y="0" width="65" height="35" rx="4" fill="var(--color-background-primary)" stroke="var(--color-green)" strokeWidth="1" />
                      <text x="32" y="21" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--color-text-primary)">EC2 (AZ-C)</text>
                    </g>

                    {/* NFS Network Mount Arrows */}
                    <path d="M 32, 35 L 115, 110" stroke="var(--color-green)" strokeWidth="1.5" strokeDasharray="3,3" />
                    <path d="M 115, 35 L 115, 110" stroke="var(--color-green)" strokeWidth="1.5" strokeDasharray="3,3" />
                    <path d="M 196, 35 L 115, 110" stroke="var(--color-green)" strokeWidth="1.5" strokeDasharray="3,3" />

                    <circle r="2.5" fill="var(--color-green)">
                      <animateMotion dur="2s" repeatCount="indefinite" path="M 32, 35 L 115, 110" />
                    </circle>
                    <circle r="2.5" fill="var(--color-green)">
                      <animateMotion dur="2s" repeatCount="indefinite" path="M 115, 35 L 115, 110" />
                    </circle>
                    <circle r="2.5" fill="var(--color-green)">
                      <animateMotion dur="2s" repeatCount="indefinite" path="M 196, 35 L 115, 110" />
                    </circle>

                    {/* Shared EFS Cloud NAS Box */}
                    <g transform="translate(25, 110)">
                      <rect x="0" y="0" width="180" height="55" rx="6" fill="var(--color-background-primary)" stroke="var(--color-green)" strokeWidth="1.5" />
                      <rect x="4" y="4" width="172" height="10" rx="2" fill="var(--color-green)" />
                      <text x="90" y="12" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff">Shared EFS NFS Network File System</text>
                      <text x="90" y="30" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--color-text-primary)">📁 Multi-AZ Mount Target (/mnt/efs)</text>
                      <text x="90" y="44" textAnchor="middle" fontSize="7" fontWeight="bold" fill="var(--color-green)">✅ 100s of EC2s Read &amp; Write Concurrently</text>
                    </g>
                  </g>
                  <text x="705" y="232" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="bold">Multi-AZ NFS Shared Filesystem</text>
                </svg>
              </div>

              {/* SIDE-BY-SIDE CUMULATIVE COMPARISON MATRIX TABLE */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers style={{ width: '15px', height: '15px', color: 'var(--color-purple)' }} />
                  <span>Cumulative Side-by-Side Storage Comparison Matrix</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="acad-table" style={{ width: '100%', fontSize: '11.5px' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '160px' }}>Architectural Dimension</th>
                        <th style={{ width: '220px', background: 'rgba(2, 132, 199, 0.08)' }}>💾 EBS (Block SAN Storage)</th>
                        <th style={{ width: '220px', background: 'rgba(239, 68, 68, 0.08)' }}>⚡ Instance Store (Local NVMe)</th>
                        <th style={{ width: '220px', background: 'rgba(34, 197, 94, 0.08)' }}>📁 EFS (Shared NAS File System)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Storage Layer &amp; Protocol</strong></td>
                        <td>Virtual SAN Block Storage (NVMe-oF / iSCSI)</td>
                        <td>Physical Direct Bus NVMe PCIe / SSD</td>
                        <td>Shared Network File System (NFSv4.0 / NFSv4.1)</td>
                      </tr>
                      <tr>
                        <td><strong>Accessibility &amp; Scope</strong></td>
                        <td><strong>1 EC2 Instance in 1 AZ</strong> (or Multi-Attach in same AZ)</td>
                        <td><strong>1 Physical Host Machine Only</strong></td>
                        <td><strong>100s of EC2 Instances concurrently</strong> across Multi-AZs</td>
                      </tr>
                      <tr>
                        <td><strong>Data Persistence on Instance Stop</strong></td>
                        <td><strong style={{ color: 'var(--color-green)' }}>✅ PERSISTENT</strong> (Files remain safe when instance stops)</td>
                        <td><strong style={{ color: 'var(--color-red)' }}>⚠️ EPHEMERAL / WIPED</strong> (Data erased when instance stops!)</td>
                        <td><strong style={{ color: 'var(--color-green)' }}>✅ PERSISTENT</strong> (Independent of EC2 instance lifecycle)</td>
                      </tr>
                      <tr>
                        <td><strong>Speed &amp; Latency Profile</strong></td>
                        <td>Low Latency (1ms – 10ms network SAN)</td>
                        <td><strong style={{ color: 'var(--color-blue)' }}>⚡ Sub-Millisecond (&lt;100 µs PCIe speed)</strong></td>
                        <td>Scalable Latency (1ms – 5ms network NFS)</td>
                      </tr>
                      <tr>
                        <td><strong>Max Capacity &amp; Scaling</strong></td>
                        <td>Up to 64 TiB per EBS Volume (Expand online)</td>
                        <td>Fixed by host hardware (Up to 30 TB per VM)</td>
                        <td><strong style={{ color: 'var(--color-green)' }}>Elastic Auto-Scaling (Petabytes+)</strong></td>
                      </tr>
                      <tr>
                        <td><strong>Ideal Cloud Use Cases</strong></td>
                        <td>Relational Databases (PostgreSQL, MySQL), Root OS Boot Disks</td>
                        <td>Scratchpad Data, Temporary Caching, High-Speed Swap, HDFS</td>
                        <td>Web Content Management (WordPress, Drupal), Code Repos, Shared Media</td>
                      </tr>
                      <tr>
                        <td><strong>Multi-Cloud Equivalents</strong></td>
                        <td>
                          AWS: EBS (gp3, io2)<br />
                          Azure: Managed Disk (Premium SSD)<br />
                          GCP: Persistent Disk (PD)
                        </td>
                        <td>
                          AWS: Instance Store (NVMe)<br />
                          Azure: Local Temp NVMe Disk<br />
                          GCP: Local SSD
                        </td>
                        <td>
                          AWS: EFS<br />
                          Azure: Azure Files Share<br />
                          GCP: Google Cloud Filestore
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* PERFORMANCE & COST ESTIMATORS GRID */}
              <div className="ec2-g2" style={{ gap: '16px' }}>
                {/* Left Card: EBS Performance & Cost Estimator */}
                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '10px', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-primary)' }}>💾 EBS Volume Performance &amp; Pricing Estimator</div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <label style={{ fontSize: '11px', display: 'block', marginBottom: '2px' }}>EBS Volume Type</label>
                    <select value={ebsVolumeType} onChange={(e) => {
                      setEbsVolumeType(e.target.value as any);
                      if (e.target.value === 'gp3') setEbsIops(3000);
                      else if (e.target.value === 'io2') setEbsIops(16000);
                      else setEbsIops(0);
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
                      style={{ width: '100%', accentColor: 'var(--color-blue)' }}
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
                        style={{ width: '100%', accentColor: 'var(--color-blue)' }}
                      />
                    </div>
                  )}

                  <div style={{ borderTop: '1px solid var(--color-border-secondary)', paddingTop: '8px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span>Estimated Monthly EBS Cost:</span>
                    <b style={{ color: 'var(--color-blue)', fontSize: '12px' }}>${getEbsPricing()} / Month</b>
                  </div>
                </div>

                {/* Right Card: EFS Multi-AZ Lifecycle Tiering & Savings Estimator */}
                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '10px', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px', color: 'var(--color-text-primary)' }}>📁 EFS Multi-AZ Lifecycle Tiering &amp; Savings Estimator</div>
                  
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span>Shared NAS Volume Size:</span>
                      <b>{efsSize} GB</b>
                    </div>
                    <input 
                      type="range" min="10" max="5000" step="50" value={efsSize} 
                      onChange={(e) => setEfsSize(Number(e.target.value))} 
                      style={{ width: '100%', accentColor: 'var(--color-green)' }}
                    />
                  </div>

                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span>Inactive File Ratio (EFS Infrequent Access):</span>
                      <b>{efsInactiveRatio}%</b>
                    </div>
                    <input 
                      type="range" min="0" max="100" step="5" value={efsInactiveRatio} 
                      onChange={(e) => setEfsInactiveRatio(Number(e.target.value))} 
                      style={{ width: '100%', accentColor: 'var(--color-green)' }}
                    />
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border-secondary)', paddingTop: '8px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                    <span>Optimized EFS Tiered Cost:</span>
                    <b style={{ color: 'var(--color-green)', fontSize: '12px' }}>${getEfsPricing(true)} / Month (Save {efsInactiveRatio}%)</b>
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
                        <marker id="storage-arrow" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-text-tertiary)"/></marker>
                        <linearGradient id="efs-std-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--color-green)" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="var(--color-green)" />
                        </linearGradient>
                        <linearGradient id="efs-ia-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--color-blue)" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="var(--color-blue)" />
                        </linearGradient>
                        <linearGradient id="efs-arc-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="var(--color-purple)" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="var(--color-purple)" />
                        </linearGradient>
                      </defs>

                      {/* PREMIUM BOUNDARY TIERS */}
                      {/* Active Access Subnet */}
                      <rect x="3" y="10" width="88" height="78" rx="8" fill="var(--color-green)" fillOpacity="0.03" stroke="var(--color-green)" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="47" y="18" textAnchor="middle" fontSize="6.5" fill="var(--color-green)" fontWeight="bold">⚡ ACTIVE ZONE</text>

                      {/* Infrequent Access Subnet */}
                      <rect x="115" y="10" width="88" height="78" rx="8" fill="var(--color-blue)" fillOpacity="0.03" stroke="var(--color-blue)" strokeWidth="1.2" strokeDasharray="4,2" />
                      <text x="159" y="18" textAnchor="middle" fontSize="6.5" fill="var(--color-blue)" fontWeight="bold">💤 IA SUBNET</text>

                      {/* Archive Cold Vault */}
                      <rect x="227" y="10" width="90" height="78" rx="8" fill="var(--color-purple)" fillOpacity="0.03" stroke="var(--color-purple)" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="272" y="18" textAnchor="middle" fontSize="6.5" fill="var(--color-purple)" fontWeight="bold">❄️ DEEP VAULT</text>
                      
                      {/* Connections with animatemotion */}
                      <path d="M 90, 50 L 115, 50" className="ec2-flow-green" strokeWidth="2" strokeDasharray="3,2" markerEnd="url(#storage-arrow)" />
                      <path d="M 202, 50 L 227, 50" className="ec2-flow-blue" strokeWidth="2" strokeDasharray="3,2" markerEnd="url(#storage-arrow)" />

                      <circle r="3" fill="var(--color-green)">
                        <animateMotion dur="2.5s" repeatCount="indefinite" path="M 90, 50 L 115, 50" />
                      </circle>
                      <circle r="3" fill="var(--color-blue)">
                        <animateMotion dur="2.5s" repeatCount="indefinite" path="M 202, 50 L 227, 50" />
                      </circle>

                      {/* EFS Standard */}
                      <g transform="translate(6, 24)" style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.05))' }}>
                        <rect x="0" y="0" width="82" height="60" rx="6" fill="var(--color-background-primary)" stroke="var(--color-green)" strokeWidth="1.2" />
                        <rect x="4" y="4" width="74" height="12" rx="3" fill="url(#efs-std-grad)" />
                        <text x="41" y="12" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff">Standard</text>
                        <text x="41" y="30" textAnchor="middle" fontSize="6.5" fill="var(--color-text-secondary)" fontWeight="bold">(Frequent Access)</text>
                        <text x="41" y="42" textAnchor="middle" fontSize="7.5" fill="var(--color-text-primary)" fontWeight="extrabold">$0.30 / GB</text>
                        <text x="41" y="52" textAnchor="middle" fontSize="6" fill="var(--color-green)" fontWeight="bold">⚡ <tspan fontSize="5">GP Storage</tspan></text>
                      </g>

                      {/* EFS Infrequent Access */}
                      <g transform="translate(118, 24)" style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.05))' }}>
                        <rect x="0" y="0" width="82" height="60" rx="6" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="1.2" />
                        <rect x="4" y="4" width="74" height="12" rx="3" fill="url(#efs-ia-grad)" />
                        <text x="41" y="12" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff">EFS IA</text>
                        <text x="41" y="30" textAnchor="middle" fontSize="6.5" fill="var(--color-text-secondary)" fontWeight="bold">(Idle {efsLifecycleDays} Days)</text>
                        <text x="41" y="42" textAnchor="middle" fontSize="7.5" fill="var(--color-text-primary)" fontWeight="extrabold">$0.025 / GB</text>
                        <text x="41" y="52" textAnchor="middle" fontSize="6" fill="var(--color-blue)" fontWeight="bold">📉 Save 92%</text>
                      </g>

                      {/* EFS Archive */}
                      <g transform="translate(230, 24)" style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.05))' }}>
                        <rect x="0" y="0" width="84" height="60" rx="6" fill="var(--color-background-primary)" stroke="var(--color-purple)" strokeWidth="1.2" />
                        <rect x="4" y="4" width="76" height="12" rx="3" fill="url(#efs-arc-grad)" />
                        <text x="42" y="12" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#fff">EFS Archive</text>
                        <text x="42" y="30" textAnchor="middle" fontSize="6.5" fill="var(--color-text-secondary)" fontWeight="bold">(Idle 90+ Days)</text>
                        <text x="42" y="42" textAnchor="middle" fontSize="7.5" fill="var(--color-text-primary)" fontWeight="extrabold">$0.008 / GB</text>
                        <text x="42" y="52" textAnchor="middle" fontSize="6" fill="var(--color-purple)" fontWeight="bold">❄️ Save 97%</text>
                      </g>

                      <rect x="20" y="96" width="280" height="24" rx="6" fill="rgba(22, 163, 74, 0.08)" stroke="var(--color-green)" strokeWidth="0.8" />
                      <text x="160" y="111" textAnchor="middle" fontSize="8" fill="var(--color-green)" fontWeight="bold">💰 Tiered Storage Audit: Automatic lifecycle savings applied concurrently</text>
                    </svg>
                  </div>
                </div>

                {/* EBS Multi-Attach & Encryption */}
                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '10px', border: '1.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', marginBottom: '8px', color: 'var(--color-text-primary)' }}>💾 EBS Multi-Attach (io1/io2) &amp; KMS Encryption</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '10px', flex: 1 }}>
                    - <b>EBS Multi-Attach:</b> Enables mounting a single high-performance **Provisioned IOPS (io1 or io2)** volume concurrently to up to 16 Nitro-based EC2 instances within the *same* AZ. Requires a cluster-aware filesystem (e.g. GFS2) to prevent data corruption.
                    <br />- <b>Hypervisor-level Encryption:</b> EBS utilizes **AWS KMS Keys (AES-256)** to encrypt data in transit between compute hosts and storage fabrics, data at rest, and all snapshots automatically.
                  </div>
 
                  {/* SVG Multiattach & Encryption */}
                  <div style={{ padding: '4px', textAlign: 'center', marginBottom: '8px' }}>
                    <svg viewBox="0 0 320 120" width="100%" className="ec2-svg-bg">
                      <defs>
                        <linearGradient id="multi-ebs-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="var(--color-red)" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="var(--color-red)" />
                        </linearGradient>
                      </defs>

                      {/* PREMIUM BOUNDARY TIERS */}
                      {/* Nitro Host Subnet Zone */}
                      <rect x="3" y="5" width="140" height="110" rx="8" fill="var(--color-blue)" fillOpacity="0.03" stroke="var(--color-blue)" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="73" y="14" textAnchor="middle" fontSize="6.5" fill="var(--color-blue)" fontWeight="bold">💻 NITRO COMPUTE SUBNET</text>

                      {/* Secured EBS SAN Storage Zone */}
                      <rect x="150" y="5" width="166" height="110" rx="8" fill="var(--color-red)" fillOpacity="0.03" stroke="var(--color-red)" strokeWidth="1.2" strokeDasharray="4,2" />
                      <text x="233" y="14" textAnchor="middle" fontSize="6.5" fill="var(--color-red)" fontWeight="bold">🔒 SECURED EBS SAN FABRIC</text>

                      {/* Connections pointing to shared volume */}
                      <path d="M 70, 32 L 160, 60" className="ec2-flow-blue" strokeWidth="1.5" strokeDasharray="3,2" />
                      <path d="M 70, 70 L 160, 70" className="ec2-flow-blue" strokeWidth="1.5" strokeDasharray="3,2" />
                      <path d="M 70, 108 L 160, 80" className="ec2-flow-blue" strokeWidth="1.5" strokeDasharray="3,2" />

                      {/* Active animated pulses */}
                      <circle r="2.5" fill="var(--color-red)">
                        <animateMotion dur="1.5s" repeatCount="indefinite" path="M 70, 32 L 160, 60" />
                      </circle>
                      <circle r="2.5" fill="var(--color-red)">
                        <animateMotion dur="1.2s" repeatCount="indefinite" path="M 70, 70 L 160, 70" />
                      </circle>
                      <circle r="2.5" fill="var(--color-red)">
                        <animateMotion dur="1.7s" repeatCount="indefinite" path="M 70, 108 L 160, 80" />
                      </circle>

                      {/* EC2 instances (3D) */}
                      <g transform="translate(10, 20)" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                        <rect x="0" y="0" width="60" height="24" rx="4" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="1" />
                        <rect x="3" y="3" width="54" height="4" rx="1" fill="var(--color-blue)" />
                        <text x="30" y="17" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="var(--color-text-primary)">EC2 Host A</text>
                      </g>

                      <g transform="translate(10, 58)" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                        <rect x="0" y="0" width="60" height="24" rx="4" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="1" />
                        <rect x="3" y="3" width="54" height="4" rx="1" fill="var(--color-blue)" />
                        <text x="30" y="17" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="var(--color-text-primary)">EC2 Host B</text>
                      </g>

                      <g transform="translate(10, 96)" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                        <rect x="0" y="0" width="60" height="24" rx="4" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="1" />
                        <rect x="3" y="3" width="54" height="4" rx="1" fill="var(--color-blue)" />
                        <text x="30" y="17" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="var(--color-text-primary)">EC2 Host C</text>
                      </g>

                      {/* Shared KMS Encrypted EBS Cylinder */}
                      <g transform="translate(158, 20)" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))' }}>
                        <rect x="0" y="0" width="150" height="90" rx="6" fill="var(--color-background-primary)" stroke="var(--color-red)" strokeWidth="1.2" />
                        <rect x="4" y="4" width="142" height="15" rx="3" fill="url(#multi-ebs-grad)" />
                        <text x="75" y="14" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#fff">Shared EBS io1/io2</text>
                        
                        {/* Cylinder drawing */}
                        <ellipse cx="40" cy="46" rx="18" ry="5" fill="var(--color-red)" fillOpacity="0.05" stroke="var(--color-red)" strokeWidth="0.8" />
                        <path d="M22,46 L22,60 A18,5 0 0,0 58,60 L58,46" fill="var(--color-red)" fillOpacity="0.05" stroke="var(--color-red)" strokeWidth="0.8" />
                        
                        <text x="100" y="39" textAnchor="middle" fontSize="6.5" fill="var(--color-red)" fontWeight="bold">⛓️ Multi-AZ Attach</text>
                        <text x="100" y="52" textAnchor="middle" fontSize="6.5" fill="var(--color-green)" fontWeight="bold">🔑 KMS AES-256</text>
                        
                        <text x="75" y="80" textAnchor="middle" fontSize="6.5" fill="var(--color-text-secondary)" fontWeight="bold">Safe Persistent Network SAN Block</text>
                      </g>
                    </svg>
                  </div>
                </div>

                {/* 💡 Humanized Storage Explanation Box */}
                <div className="acad-analogy-box" style={{ marginTop: '16px', fontSize: '11.5px', textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    💡 Cumulative Storage Architecture Legend: How EBS, Ephemeral NVMe &amp; EFS Serve Different Use Cases
                  </div>
                  <ul className="list-disc pl-4 space-y-1.5" style={{ lineHeight: '1.55' }}>
                    <li><strong>💾 EBS Block Storage:</strong> Virtual hard drives network-attached to 1 EC2 instance in 1 AZ. Data persists even when EC2 stops. Perfect for Databases (PostgreSQL, MySQL).</li>
                    <li><strong>⚡ Instance Store NVMe:</strong> Physical SSD disks physically attached to the host motherboard. Blazing fast (100k+ IOPS) but <strong>EPHEMERAL</strong> — data is lost permanently when EC2 host stops! Perfect for temporary caches &amp; buffer pools.</li>
                    <li><strong>🌐 EFS Shared Network File System:</strong> Elastic, Multi-AZ NFS file system concurrently accessible by thousands of EC2 instances simultaneously. Ideal for CMS web farms (WordPress, Drupal) and shared enterprise file repositories.</li>
                  </ul>
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
                      <stop offset="0%" stopColor="var(--color-blue)" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="var(--color-blue)" />
                    </linearGradient>
                    <linearGradient id="ha-pink-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-purple)" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="var(--color-purple)" />
                    </linearGradient>
                    <linearGradient id="ha-green-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--color-green)" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="var(--color-green)" />
                    </linearGradient>
                  </defs>

                  {/* PREMIUM SUBNET GROUPS */}
                  {/* Public Internet Client zone */}
                  <rect x="5" y="8" width="110" height="164" rx="8" fill="var(--color-green)" fillOpacity="0.03" stroke="var(--color-green)" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="60" y="166" textAnchor="middle" fontSize="6.5" fill="var(--color-green)" fontWeight="bold">PUBLIC EDGE PLANE</text>

                  {/* Load Balancer zone */}
                  <rect x="150" y="8" width="120" height="164" rx="8" fill="var(--color-blue)" fillOpacity="0.03" stroke="var(--color-blue)" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="210" y="166" textAnchor="middle" fontSize="6.5" fill="var(--color-blue)" fontWeight="bold">BALANCE PLANE</text>

                  {/* VPC Private Subnet Bounding Region */}
                  <rect x="315" y="8" width="180" height="164" rx="8" fill="var(--color-purple)" fillOpacity="0.03" stroke="var(--color-purple)" strokeWidth="1" strokeDasharray="4,3" />
                  <text x="405" y="166" textAnchor="middle" fontSize="6.5" fill="var(--color-purple)" fontWeight="bold">🔒 VPC SECURED PRIVATE SUBNETS</text>

                  {/* Shared NAS storage zone */}
                  <rect x="535" y="8" width="140" height="164" rx="8" fill="var(--color-green)" fillOpacity="0.03" stroke="var(--color-green)" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="605" y="166" textAnchor="middle" fontSize="6.5" fill="var(--color-green)" fontWeight="bold">STORAGE SAN PLANE</text>

                  {/* Connecting paths */}
                  <path d="M 110, 90 L 160, 90" className="ec2-flow-green" strokeWidth="2" strokeDasharray="3,3" />
                  <path d="M 260, 75 L 330, 55" className="ec2-flow-blue" strokeWidth="2" />
                  <path d="M 260, 105 L 330, 125" className="ec2-flow-blue" strokeWidth="2" />
                  <path d="M 480, 50 L 550, 75" stroke="var(--color-blue)" strokeWidth="1.5" strokeDasharray="3,3" />
                  <path d="M 480, 130 L 550, 105" stroke="var(--color-blue)" strokeWidth="1.5" strokeDasharray="3,3" />

                  {/* Active moving pulses */}
                  <circle r="3.5" fill="var(--color-green)">
                    <animateMotion dur="2s" repeatCount="indefinite" path="M 110, 90 L 160, 90" />
                  </circle>
                  <circle r="3.5" fill="var(--color-blue)">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 260, 75 L 330, 55" />
                  </circle>
                  <circle r="3.5" fill="var(--color-blue)">
                    <animateMotion dur="2.5s" repeatCount="indefinite" path="M 260, 105 L 330, 125" />
                  </circle>
                  <circle r="3.5" fill="var(--color-blue)">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M 480, 50 L 550, 75" />
                  </circle>
                  <circle r="3.5" fill="var(--color-blue)">
                    <animateMotion dur="2.2s" repeatCount="indefinite" path="M 480, 130 L 550, 105" />
                  </circle>

                  {/* Public Internet */}
                  <g transform="translate(10, 48)" style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.05))' }}>
                    <rect x="0" y="0" width="100" height="70" rx="8" fill="var(--color-background-primary)" stroke="var(--color-green)" strokeWidth="1.5" />
                    <rect x="4" y="4" width="92" height="15" rx="3" fill="url(#ha-green-grad)" />
                    <text x="50" y="14" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">🌐 Internet</text>
                    <text x="50" y="42" textAnchor="middle" fontSize="9.5" fill="var(--color-text-primary)" fontWeight="bold">Public Clients</text>
                    <text x="50" y="55" textAnchor="middle" fontSize="7" fill="var(--color-text-tertiary)">(Secure HTTP Traffic)</text>
                  </g>
                  
                  {/* ALB */}
                  <g transform="translate(160, 28)" style={{ filter: 'drop-shadow(0 2px 2px rgba(29,78,216,0.1))' }}>
                    <rect x="0" y="0" width="100" height="110" rx="8" fill="var(--color-background-primary)" stroke="var(--color-blue)" strokeWidth="1.5" />
                    <rect x="4" y="4" width="92" height="15" rx="3" fill="url(#ha-blue-grad)" />
                    <text x="50" y="14" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">🍪 Application LB</text>
                    
                    {/* Cookies / listeners */}
                    <circle cx="25" cy="45" r="4.5" fill="var(--color-blue)" />
                    <text x="35" y="48" fontSize="7.5" fill="var(--color-text-primary)" fontWeight="bold">SSL listener</text>
                    <rect x="15" y="65" width="70" height="4" rx="2" fill="var(--color-border-secondary)" />
                    <rect x="15" y="75" width="50" height="4" rx="2" fill="var(--color-border-secondary)" />
                    <text x="50" y="98" textAnchor="middle" fontSize="8" fill="var(--color-blue)" fontWeight="bold">Target Groups</text>
                  </g>

                  {/* Private AZ-A */}
                  <g transform="translate(330, 15)" style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(219,39,119,0.05))' }}>
                    <rect x="0" y="0" width="150" height="70" rx="8" fill="var(--color-background-primary)" stroke="var(--color-purple)" strokeWidth="1.2" />
                    <rect x="4" y="4" width="142" height="15" rx="3" fill="url(#ha-pink-grad)" />
                    <text x="75" y="14" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#fff">🔒 AZ-a (sg-app-fleet)</text>
                    
                    <rect x="15" y="32" width="120" height="16" rx="4" fill="var(--color-background-secondary)" stroke="var(--color-purple)" strokeWidth="0.8" />
                    <text x="75" y="43" textAnchor="middle" fontSize="8" fill="var(--color-purple)" fontWeight="bold">EC2 Instance (10.0.1.x)</text>
                    <text x="75" y="62" textAnchor="middle" fontSize="6.5" fill="var(--color-text-secondary)" fontWeight="bold">Healthy in Private Subnet</text>
                  </g>

                  {/* Private AZ-B */}
                  <g transform="translate(330, 85)" style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(219,39,119,0.05))' }}>
                    <rect x="0" y="0" width="150" height="70" rx="8" fill="var(--color-background-primary)" stroke="var(--color-purple)" strokeWidth="1.2" />
                    <rect x="4" y="4" width="142" height="15" rx="3" fill="url(#ha-pink-grad)" />
                    <text x="75" y="14" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#fff">🔒 AZ-b (sg-app-fleet)</text>
                    
                    <rect x="15" y="32" width="120" height="16" rx="4" fill="var(--color-background-secondary)" stroke="var(--color-purple)" strokeWidth="0.8" />
                    <text x="75" y="43" textAnchor="middle" fontSize="8" fill="var(--color-purple)" fontWeight="bold">EC2 Instance (10.0.2.x)</text>
                    <text x="75" y="62" textAnchor="middle" fontSize="6.5" fill="var(--color-text-secondary)" fontWeight="bold">Healthy in Private Subnet</text>
                  </g>

                  {/* EFS Mount */}
                  <g transform="translate(545, 48)" style={{ filter: 'drop-shadow(0 2px 2px rgba(5,150,105,0.1))' }}>
                    <rect x="0" y="0" width="120" height="80" rx="8" fill="var(--color-background-primary)" stroke="var(--color-green)" strokeWidth="1.5" />
                    <rect x="4" y="4" width="112" height="15" rx="3" fill="url(#ha-green-grad)" />
                    <text x="60" y="14" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">📁 Shared NAS (EFS)</text>
                    
                    {/* Database disks drawing inside */}
                    <ellipse cx="60" cy="42" rx="16" ry="4" fill="var(--color-background-secondary)" stroke="var(--color-green)" strokeWidth="0.8" />
                    <path d="M44,42 L44,52 A16,4 0 0,0 76,52 L76,42" fill="var(--color-background-secondary)" stroke="var(--color-green)" strokeWidth="0.8" />
                    
                    <text x="60" y="70" textAnchor="middle" fontSize="7.5" fill="var(--color-green)" fontWeight="bold">Multi-AZ Mount Targets</text>
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
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Physical Hypervisor Host vs SAN Storage Architecture</div>
                  <svg viewBox="0 0 450 160" width="100%" className="ec2-svg-bg">
                    <defs>
                      <linearGradient id="host-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-purple)" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="var(--color-purple)" />
                      </linearGradient>
                      <linearGradient id="san-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--color-green)" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="var(--color-green)" />
                      </linearGradient>
                    </defs>

                    {/* PREMIUM SUBNET BOUNDARIES */}
                    {/* Motherboard Host Subnet */}
                    <rect x="5" y="5" width="230" height="150" rx="8" fill="var(--color-purple)" fillOpacity="0.03" stroke="var(--color-purple)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="120" y="150" textAnchor="middle" fontSize="6" fill="var(--color-purple)" fontWeight="bold">💻 HYPERVISOR BLADE ZONE</text>

                    {/* Storage SAN Subnet */}
                    <rect x="250" y="5" width="195" height="150" rx="8" fill="var(--color-green)" fillOpacity="0.03" stroke="var(--color-green)" strokeWidth="1.2" strokeDasharray="4,2" />
                    <text x="347" y="150" textAnchor="middle" fontSize="6.5" fill="var(--color-green)" fontWeight="bold">🔒 SECURED EBS STORAGE SAN</text>

                    {/* Connection paths inside motherboard & outwards */}
                    {/* Local NVMe PCIe path */}
                    <path id="pcie-path" d="M 70, 70 L 70, 100" stroke="var(--color-red)" strokeWidth="2.5" />
                    {/* VPC Network Outward path */}
                    <path id="vpc-path" d="M 150, 70 L 150, 115 L 280, 115" className="ec2-flow-blue" strokeWidth="2" strokeDasharray="3,2" />

                    {/* Active moving pulses */}
                    <circle r="3" fill="var(--color-red)">
                      <animateMotion dur="0.8s" repeatCount="indefinite" path="M 70, 70 L 70, 100" />
                    </circle>
                    <circle r="3" fill="var(--color-blue)">
                      <animateMotion dur="2.5s" repeatCount="indefinite" path="M 150, 70 L 150, 115 L 280, 115" />
                    </circle>

                    {/* Hypervisor Host Motherboard */}
                    <g transform="translate(15, 15)" style={{ filter: 'drop-shadow(0 1px 1.5px rgba(0,0,0,0.05))' }}>
                      <rect x="0" y="0" width="200" height="120" rx="8" fill="var(--color-background-primary)" stroke="var(--color-purple)" strokeWidth="1.5" />
                      <rect x="4" y="4" width="192" height="15" rx="3" fill="url(#host-grad)" />
                      <text x="100" y="14" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#fff">Physical Motherboard (Hypervisor Host)</text>
                    </g>

                    {/* CPU RAM Core */}
                    <g transform="translate(30, 45)" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                      <rect x="0" y="0" width="170" height="28" rx="4" fill="var(--color-background-secondary)" stroke="var(--color-blue)" strokeWidth="1.2" />
                      <text x="85" y="17" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="var(--color-blue)">Virtual Guest VM (vCPU &amp; RAM)</text>
                    </g>

                    <text x="76" y="90" fontSize="6.5" fill="var(--color-red)" fontWeight="extrabold">PCIe Bus</text>

                    {/* Local Instance Store SSD */}
                    <g transform="translate(35, 96)" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.05))' }}>
                      <rect x="0" y="0" width="80" height="32" rx="4" fill="var(--color-background-secondary)" stroke="var(--color-red)" strokeWidth="1.2" />
                      <text x="40" y="12" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="var(--color-red)">Instance Store</text>
                      <text x="40" y="24" textAnchor="middle" fontSize="6" fill="var(--color-red)" fontWeight="extrabold">💥 Ephemeral NVMe</text>
                    </g>

                    <text x="210" y="106" fontSize="7" fill="var(--color-blue)" fontWeight="extrabold">Dedicated SAN Fiber link</text>

                    {/* Remote EBS SAN Cluster */}
                    <g transform="translate(268, 15)" style={{ filter: 'drop-shadow(0 2px 2px rgba(5,150,105,0.1))' }}>
                      <rect x="0" y="0" width="160" height="120" rx="8" fill="var(--color-background-primary)" stroke="var(--color-green)" strokeWidth="1.5" />
                      <rect x="4" y="4" width="152" height="15" rx="3" fill="url(#san-grad)" />
                      <text x="80" y="14" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#fff">EBS Storage SAN Cluster</text>
                      
                      {/* EBS volume cylinders */}
                      <ellipse cx="80" cy="50" rx="30" ry="8" fill="var(--color-background-secondary)" stroke="var(--color-green)" strokeWidth="0.8" />
                      <path d="M50,50 L50,68 A30,8 0 0,0 110,68 L110,50" fill="var(--color-background-secondary)" stroke="var(--color-green)" strokeWidth="0.8" />

                      <text x="80" y="94" textAnchor="middle" fontSize="7.5" fill="var(--color-green)" fontWeight="bold">✅ Data Persists on VM Stop</text>
                      <text x="80" y="106" textAnchor="middle" fontSize="6.5" fill="var(--color-text-secondary)" fontWeight="bold">(Network Detached &amp; Detourable)</text>
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
                <div style={{ background: 'var(--ec-success-bg)', padding: '18px', borderRadius: '10px', border: '1px solid var(--ec-success-border)' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--ec-success-text-bold)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>✅</span> Mandatory Production Best Practices
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ borderBottom: '1px solid var(--ec-success-border)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: 'var(--ec-success-text-bold)' }}>🔑 IAM Role Authorization</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ec-success-text)', lineHeight: '1.45', marginTop: '2px' }}>
                        Attach IAM roles to instances via Instance Profiles. Never hardcode static Access Keys or Secrets within scripts or environment variables.
                      </div>
                    </div>
                    <div style={{ borderBottom: '1px solid var(--ec-success-border)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: 'var(--ec-success-text-bold)' }}>🛡️ Scoped Security Groups</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ec-success-text)', lineHeight: '1.45', marginTop: '2px' }}>
                        Always whitelist specific Security Group IDs or narrow, trusted CIDR blocks. Adhere strictly to the Principle of Least Privilege.
                      </div>
                    </div>
                    <div style={{ borderBottom: '1px solid var(--ec-success-border)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: 'var(--ec-success-text-bold)' }}>🚀 Elastic Multi-AZ Scaling</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ec-success-text)', lineHeight: '1.45', marginTop: '2px' }}>
                        Scale compute nodes horizontally across multiple Availability Zones inside private subnets, fronted by an Application Load Balancer.
                      </div>
                    </div>
                    <div style={{ borderBottom: '1px solid var(--ec-success-border)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: 'var(--ec-success-text-bold)' }}>🔒 IMDSv2 Token Protection</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ec-success-text)', lineHeight: '1.45', marginTop: '2px' }}>
                        Enforce session-oriented Instance Metadata Service v2 (IMDSv2) with hop limit 1 to fully mitigate SSRF credential extraction exploits.
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: 'var(--ec-success-text-bold)' }}>💾 Stateless Decoupled Storage</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ec-success-text)', lineHeight: '1.45', marginTop: '2px' }}>
                        Keep EC2 instances completely stateless. Store all persistent transactional data on decoupled network volumes (EBS, shared EFS, or S3).
                      </div>
                    </div>
                  </div>
                </div>

                {/* Common Mistakes */}
                <div style={{ background: 'var(--ec-error-bg)', padding: '18px', borderRadius: '10px', border: '1px solid var(--ec-error-border)' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'var(--ec-error-text-bold)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>❌</span> Critical Production Mistakes
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ borderBottom: '1px solid var(--ec-error-border)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: 'var(--ec-error-text-bold)' }}>🔓 Wildcard SSH Exposure</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ec-error-text)', lineHeight: '1.45', marginTop: '2px' }}>
                        Opening Port 22 inbound from wildcard <code style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1px 4px', borderRadius: '3px', color: 'var(--color-red)' }}>0.0.0.0/0</code>, exposing server consoles to relentless global brute-force attacks.
                      </div>
                    </div>
                    <div style={{ borderBottom: '1px solid var(--ec-error-border)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: 'var(--ec-error-text-bold)' }}>💥 Ephemeral Data Volatility</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ec-error-text)', lineHeight: '1.45', marginTop: '2px' }}>
                        Storing primary databases or critical logs on local physical Instance Stores. All data is completely formatted if the instance stops.
                      </div>
                    </div>
                    <div style={{ borderBottom: '1px solid var(--ec-error-border)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: 'var(--ec-error-text-bold)' }}>🔑 User Data Credential Leak</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ec-error-text)', lineHeight: '1.45', marginTop: '2px' }}>
                        Writing plain-text database passwords, API tokens, or SSH private keys inside bootstrapping scripts, which are globally readable via metadata.
                      </div>
                    </div>
                    <div style={{ borderBottom: '1px solid var(--ec-error-border)', paddingBottom: '8px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: 'var(--ec-error-text-bold)' }}>🗑️ Orphaned Volumes Accumulation</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ec-error-text)', lineHeight: '1.45', marginTop: '2px' }}>
                        Disabling "Delete on Termination" for root or short-term block volumes, causing orphaned, unattached EBS drives to quietly inflate cloud bills.
                      </div>
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '12.5px', color: 'var(--ec-error-text-bold)' }}>🪪 Vulnerable IMDSv1 Legacy</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--ec-error-text)', lineHeight: '1.45', marginTop: '2px' }}>
                        Allowing unauthenticated IMDSv1 queries, which lets attackers utilize Server-Side Request Forgery to harvest IAM instance profile credentials.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    </Translate>
  )}
</div>
</div>
);
}
