import { useState, useEffect } from 'react';
import { 
  Play, 
  Shield, 
  HardDrive, 
  Zap, 
  RefreshCw, 
  AlertTriangle, 
  Sliders,
  DollarSign
} from 'lucide-react';

interface UniqueComputeFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueComputeFeatures({ provider }: UniqueComputeFeaturesProps) {
  // --- AWS STATES ---
  // IMDS Simulator
  const [imdsVersion, setImdsVersion] = useState<'v1' | 'v2'>('v2');
  const [imdsRunning, setImdsRunning] = useState(false);
  const [imdsStep, setImdsStep] = useState(0);
  const [imdsLogs, setImdsLogs] = useState<string[]>([]);
  const [ssrfAttacked, setSsrfAttacked] = useState(false);

  // Burstable credits simulator
  const [awsInstanceSize, setAwsInstanceSize] = useState<'nano' | 'micro' | 'small'>('micro');
  const [awsCpuUtilization, setAwsCpuUtilization] = useState<number>(30);
  const [awsCredits, setAwsCredits] = useState<number>(144);
  const [awsCreditStateLog, setAwsCreditStateLog] = useState<string[]>([]);

  // --- AZURE STATES ---
  // Ephemeral OS Disk Rebuild
  const [diskType, setDiskType] = useState<'remote' | 'ephemeral'>('ephemeral');
  const [rebuildRunning, setRebuildRunning] = useState(false);
  const [rebuildProgress, setRebuildProgress] = useState(0);
  const [rebuildLogs, setRebuildLogs] = useState<string[]>([]);
  const [rebuildStats, setRebuildStats] = useState({ ops: 0, time: 0, cost: 'N/A' });

  // Spot Eviction lookup
  const [azureRegion, setAzureRegion] = useState('eastus');
  const [azureVmSize, setAzureVmSize] = useState('d2s');

  // --- GCP STATES ---
  // Live Migration Simulator
  const [migrationRunning, setMigrationRunning] = useState(false);
  const [migrationStep, setMigrationStep] = useState(0);
  const [migrationUptime, setMigrationUptime] = useState(12840);
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);

  // Custom Machine Sizer
  const [customVcpu, setCustomVcpu] = useState<number>(6);
  const [customRam, setCustomRam] = useState<number>(24);

  // --- EFFECTS ---
  // Uptime ticker for GCP Live Migration
  useEffect(() => {
    const interval = setInterval(() => {
      setMigrationUptime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Burstable credits calculation simulator loop
  const triggerAwsSimulationHour = () => {
    // T3 instances credits rules:
    // t3.nano: baseline 5%, earns 6 credits/hr, max 144
    // t3.micro: baseline 10%, earns 12 credits/hr, max 288
    // t3.small: baseline 20%, earns 24 credits/hr, max 576
    // 1 credit = 1 vCPU at 100% for 1 minute (so 60 vCPU-minutes/hr)
    let baseline = 10;
    let earnRate = 12;
    let maxCredits = 288;
    let vcpus = 2;

    if (awsInstanceSize === 'nano') {
      baseline = 5;
      earnRate = 6;
      maxCredits = 144;
      vcpus = 2;
    } else if (awsInstanceSize === 'small') {
      baseline = 20;
      earnRate = 24;
      maxCredits = 576;
      vcpus = 2;
    }

    // Credits consumed = vcpus * (CPU% - baseline%) * 0.6
    const netCreditChange = earnRate - (vcpus * (awsCpuUtilization - baseline) * 0.6);
    const newCredits = Math.max(0, Math.min(maxCredits, Math.round((awsCredits + netCreditChange) * 10) / 10));
    setAwsCredits(newCredits);

    const logMsg = `[Hour Update] CPU Utilization: ${awsCpuUtilization}%. Earned: +${earnRate} credits. Consumed: ${Math.max(0, Math.round((earnRate - netCreditChange) * 10) / 10)} credits. Net: ${netCreditChange >= 0 ? '+' : ''}${Math.round(netCreditChange * 10) / 10}. Credit Balance: ${newCredits}/${maxCredits}`;
    setAwsCreditStateLog(prev => [logMsg, ...prev.slice(0, 8)]);
  };

  // --- SIMULATION HANDLERS ---

  // AWS IMDS Security Simulator
  const startImdsSim = () => {
    if (imdsRunning) return;
    setImdsRunning(true);
    setImdsStep(1);
    setImdsLogs([]);
    setSsrfAttacked(false);

    const logs: string[] = [];

    if (imdsVersion === 'v1') {
      // Vulnerable IMDSv1
      logs.push('$ curl -s http://169.254.169.254/latest/meta-data/iam/security-credentials/admin-role');
      setImdsLogs([...logs]);

      setTimeout(() => {
        setImdsStep(2);
        logs.push('⚡ [SSRF Warning] Direct access to local link-local metadata address allowed.');
        logs.push('🔑 [Vulnerability Exploited] IAM Temporary Credentials Extracted:');
        logs.push(JSON.stringify({
          AccessKeyId: "ASIAXS7O1234SECRET",
          SecretAccessKey: "xyz987654321/ABCDEF/ghijklmnOPQR",
          Token: "IQoJb3JpZ2luX2VjEBs...",
          Expiration: new Date(Date.now() + 3600 * 1000).toISOString()
        }, null, 2));
        setImdsLogs([...logs]);
        setImdsStep(4);
        setSsrfAttacked(true);
        setImdsRunning(false);
      }, 1500);
    } else {
      // Secure IMDSv2
      logs.push('$ TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60")');
      setImdsLogs([...logs]);

      setTimeout(() => {
        setImdsStep(2);
        logs.push('✅ Session Token successfully generated by IMDSv2 daemon.');
        logs.push('$ curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/iam/security-credentials/admin-role');
        setImdsLogs([...logs]);
        setImdsStep(3);

        setTimeout(() => {
          setImdsStep(4);
          logs.push('✅ [Access Granted] Secure authenticated session established.');
          logs.push(JSON.stringify({
            AccessKeyId: "ASIAXS7O9999SECURE",
            SecretAccessKey: "abc123456789/GHIJKL/mnopqrstUVWX",
            Token: "IQoJb3JpZ2luX2VjEBs...",
            Expiration: new Date(Date.now() + 60 * 1000).toISOString()
          }, null, 2));
          setImdsLogs([...logs]);
          setImdsRunning(false);
        }, 1200);
      }, 1000);
    }
  };

  // Azure Ephemeral OS Disk Rebuild Simulator
  const startRebuildSim = () => {
    if (rebuildRunning) return;
    setRebuildRunning(true);
    setRebuildProgress(0);
    setRebuildLogs([]);
    setRebuildStats({ ops: 0, time: 0, cost: 'Calculating...' });

    const totalSteps = 10;
    let currentStep = 0;
    const tempLogs: string[] = [];

    if (diskType === 'remote') {
      // Flat remote disk re-imaging (slow, persistent)
      const interval = setInterval(() => {
        if (currentStep < totalSteps) {
          currentStep++;
          setRebuildProgress(Math.floor((currentStep / totalSteps) * 100));
          
          if (currentStep === 1) tempLogs.unshift('⏳ [Remote Disk] Sending VM.Reimage REST API command...');
          if (currentStep === 3) tempLogs.unshift('🛑 Stopping Virtual Machine Standard_D2s_v5...');
          if (currentStep === 5) tempLogs.unshift('💽 Detaching and deleting old OS Managed Disk volume...');
          if (currentStep === 7) tempLogs.unshift('📦 Creating new Managed Disk from marketplace image backup...');
          if (currentStep === 9) tempLogs.unshift('⚙️ Attaching managed disk to VM and starting host boot...');

          setRebuildLogs([...tempLogs]);
        } else {
          clearInterval(interval);
          tempLogs.unshift('✅ VM Rebuilt Successfully! OS re-imaged on Remote Disk.');
          setRebuildLogs([...tempLogs]);
          setRebuildRunning(false);
          setRebuildStats({
            ops: 5, // stop, delete disk, create disk, attach, start
            time: 3200, // ms representation
            cost: 'Standard Managed Disk Egress fees ($0.05/hr runtime + $2.40 monthly IOPS capacity)'
          });
        }
      }, 350);
    } else {
      // Ephemeral OS Disk (Instant, cache based)
      const interval = setInterval(() => {
        if (currentStep < totalSteps) {
          currentStep += 2;
          setRebuildProgress(Math.floor((currentStep / totalSteps) * 100));
          
          if (currentStep === 2) tempLogs.unshift('🚀 [Ephemeral OS Disk] VM.Reimage command invoked.');
          if (currentStep === 6) tempLogs.unshift('⚡ Resetting local cache space on physical NVMe storage blade...');
          if (currentStep === 10) tempLogs.unshift('🔥 Instant reboot sequence complete! VM online.');

          setRebuildLogs([...tempLogs]);
        } else {
          clearInterval(interval);
          setRebuildLogs([...tempLogs]);
          setRebuildRunning(false);
          setRebuildStats({
            ops: 1, // atomic reset
            time: 600, // ms representation
            cost: '$0.00 (Zero Storage Fees, uses internal node cache)'
          });
        }
      }, 150);
    }
  };

  // GCP Live Migration Simulator
  const startMigrationSim = () => {
    if (migrationRunning) return;
    setMigrationRunning(true);
    setMigrationStep(1);
    setMigrationLogs([]);

    const tempLogs = ['[Host Watcher] FAULT WARNING: Physical host node hypervisor error detected on zone us-central1-a (Node-9824).'];
    setMigrationLogs([...tempLogs]);

    setTimeout(() => {
      setMigrationStep(2);
      tempLogs.unshift('[Hypervisor] Preparing target hypervisor node in pool (Node-9882) to receive active state...');
      setMigrationLogs([...tempLogs]);

      setTimeout(() => {
        setMigrationStep(3);
        tempLogs.unshift('[WAN/Memory] Establishing direct memory mirroring copy via Google WAN fiber backbone (3.2 GB active RAM footprint)...');
        setMigrationLogs([...tempLogs]);

        setTimeout(() => {
          setMigrationStep(4);
          tempLogs.unshift('⚡ [Live Migrating] Seamlessly switching CPU execution context pointer from Node-9824 to Node-9882...');
          setMigrationLogs([...tempLogs]);

          setTimeout(() => {
            setMigrationStep(5);
            tempLogs.unshift('🎉 [Success] VM Live Migration Complete! Running state preserved. Node-9824 offline for maintenance. Host uptime counter untouched.');
            setMigrationLogs([...tempLogs]);
            setMigrationRunning(false);
          }, 1500);
        }, 1200);
      }, 1000);
    }, 800);
  };

  // Spot Eviction lookup database
  const getAzureSpotInfo = () => {
    const data: Record<string, Record<string, { price: string; discount: string; eviction: string; alert: string }>> = {
      eastus: {
        d2s: { price: '$0.024/hr', discount: '75%', eviction: '0-5% (Very Low)', alert: 'Perfect for dev/testing workloads' },
        e4s: { price: '$0.052/hr', discount: '82%', eviction: '5-10% (Low)', alert: 'Great for Kubernetes nodes' },
        f8s: { price: '$0.098/hr', discount: '72%', eviction: '15-20% (Medium)', alert: 'High compute reclaim demand' }
      },
      westeurope: {
        d2s: { price: '$0.027/hr', discount: '72%', eviction: '5-10% (Low)', alert: 'Low capacity alerts active' },
        e4s: { price: '$0.058/hr', discount: '80%', eviction: '0-5% (Very Low)', alert: 'Stable local spot pool capacity' },
        f8s: { price: '$0.112/hr', discount: '68%', eviction: '20%+ (High)', alert: 'Reclaimed frequently during peak hours' }
      },
      eastasia: {
        d2s: { price: '$0.029/hr', discount: '70%', eviction: '10-15% (Medium)', alert: 'Moderate workload pressure' },
        e4s: { price: '$0.062/hr', discount: '78%', eviction: '5-10% (Low)', alert: 'Standard SLA profile' },
        f8s: { price: '$0.124/hr', discount: '65%', eviction: '15-20% (Medium)', alert: 'Higher batch activity' }
      }
    };

    return data[azureRegion]?.[azureVmSize] || { price: 'N/A', discount: 'N/A', eviction: 'Unknown', alert: 'Select options' };
  };

  const spotInfo = getAzureSpotInfo();

  // Custom Machine sizer calculations
  const calculateGcpCustomSavings = () => {
    // GCP cost configuration:
    // Custom vCPU cost: $0.033 / core / hour
    // Custom RAM cost: $0.0044 / GB / hour
    // Total hourly = vcpu*0.033 + ram*0.0044
    const hourlyCustom = (customVcpu * 0.033) + (customRam * 0.0044);
    const monthlyCustom = hourlyCustom * 730;

    // Standard fixed alternatives on AWS/Azure:
    // If you need 6 vCPU & 24 GB RAM, AWS requires a c6g.2xlarge (8 vCPU, 32 GB RAM) -> ~$0.272/hour -> ~$198/month
    // Or m6g.2xlarge (8 vCPU, 32 GB RAM) -> ~$0.308/hour -> ~$225/month
    // We map a fixed equivalent that standardizes to the next power of 2:
    let fixedVcpu = 8;
    let fixedRam = 32;
    if (customVcpu <= 2 && customRam <= 8) {
      fixedVcpu = 2;
      fixedRam = 8;
    } else if (customVcpu <= 4 && customRam <= 16) {
      fixedVcpu = 4;
      fixedRam = 16;
    }

    const hourlyFixed = (fixedVcpu * 0.034) + (fixedRam * 0.0045) + 0.02; // AWS fixed overhead estimation
    const monthlyFixed = hourlyFixed * 730;
    const savings = Math.max(0, monthlyFixed - monthlyCustom);

    return {
      customCost: monthlyCustom.toFixed(2),
      fixedCost: monthlyFixed.toFixed(2),
      savings: savings.toFixed(2),
      percent: ((savings / monthlyFixed) * 100).toFixed(0),
      fixedType: `${fixedVcpu} vCPUs, ${fixedRam} GB RAM (e.g. m6g.2xlarge)`
    };
  };

  const customSavings = calculateGcpCustomSavings();

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Intro section */}
      <div className="anl-card" style={{ padding: '16px', border: '1px solid var(--ec-card-border)', background: 'var(--ec-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>
          ✨ Advanced Compute Offerings &amp; Interactive Sandboxes
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: '1.45' }}>
          Explore the proprietary architectural layers engineered by each cloud provider. Run the live interactive telemetry consoles below to understand these advanced virtual machine capabilities.
        </div>
      </div>

      {/* ========================================================================= */}
      {/* AWS EC2: IMDSv2 & BURSTABLE CREDITS                                       */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* IMDS Security Simulator */}
          <div className="lg:col-span-7 ec2-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', padding: '16px', background: 'var(--ec-card-bg)', borderLeft: '1px solid var(--ec-card-border)', borderRight: '1px solid var(--ec-card-border)', borderBottom: '1px solid var(--ec-card-border)' }}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-500" />
                  <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>IMDSv1 vs IMDSv2 Server-Side Attack Security Console</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => setImdsVersion('v1')}
                    className={`px-2 py-1 rounded text-[10.5px] font-bold ${imdsVersion === 'v1' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'}`}
                  >
                    Vulnerable (v1)
                  </button>
                  <button 
                    onClick={() => setImdsVersion('v2')}
                    className={`px-2 py-1 rounded text-[10.5px] font-bold ${imdsVersion === 'v2' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'}`}
                  >
                    Secure (v2)
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: '1.45' }}>
                IMDSv1 is vulnerable to Server-Side Request Forgery (SSRF) attacks because a simple HTTP GET request can fetch IAM security tokens. IMDSv2 enforces session-oriented security by requiring a PUT handshake to acquire a transient token first.
              </p>

              {/* Simulation Visual */}
              <div className="anl-log" style={{ border: '1px solid var(--color-border-tertiary)', borderRadius: '10px', padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#38bdf8', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '6px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  <span>IMDS Request Monitor</span>
                  <span className={imdsRunning ? 'animate-pulse text-amber-500' : 'text-slate-500'}>
                    {imdsRunning ? 'EXECUTING PIPELINE...' : 'IDLE'}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1 text-center items-center mb-3">
                  <div style={{ border: '1px solid var(--color-border-tertiary)', padding: '6px', borderRadius: '4px', background: imdsStep === 1 ? 'rgba(245,158,11,0.15)' : 'transparent', color: imdsStep === 1 ? '#f59e0b' : '#64748b' }}>
                    💻 Request
                  </div>
                  <div style={{ color: '#1e293b' }}>➔</div>
                  <div style={{ border: '1px solid var(--color-border-tertiary)', padding: '6px', borderRadius: '4px', background: imdsStep === 2 || imdsStep === 3 ? 'rgba(56,189,248,0.15)' : 'transparent', color: imdsStep === 2 || imdsStep === 3 ? '#38bdf8' : '#64748b' }}>
                    ⚙️ Token API
                  </div>
                  <div style={{ color: '#1e293b' }}>➔</div>
                  <div style={{ border: '1px solid var(--color-border-tertiary)', padding: '6px', borderRadius: '4px', background: imdsStep === 4 ? (ssrfAttacked ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)') : 'transparent', color: imdsStep === 4 ? (ssrfAttacked ? '#ef4444' : '#10b981') : '#64748b' }}>
                    🔑 Credentials
                  </div>
                </div>

                <div style={{ maxHeight: '160px', overflowY: 'auto', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)' }}>
                  {imdsLogs.length > 0 ? (
                    imdsLogs.map((log, idx) => (
                      <div key={idx} style={{ color: log.startsWith('$') ? '#f59e0b' : log.includes('SSRF') || log.includes('Exploited') ? '#f87171' : log.includes('Access Key') || log.includes('{') ? '#34d399' : '#94a3b8' }}>
                        {log}
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#475569' }}>Click "Trigger Metadata Request" to simulate...</div>
                  )}
                </div>
              </div>
            </div>

            {ssrfAttacked && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px', fontSize: '11px', color: '#991b1b', display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '14px' }}>
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" style={{ marginTop: '2px' }} />
                <div>
                  <strong>SSRF Security Breach Alert!</strong> Unauthorized requestors succeeded in retrieving root credentials without passing header token validation. Always require IMDSv2 in EC2 policies.
                </div>
              </div>
            )}

            <button 
              onClick={startImdsSim}
              disabled={imdsRunning}
              className="ec2-btn ec2-on"
              style={{ width: '100%', padding: '8px', fontSize: '11.5px' }}
            >
              <Play className="w-3.5 h-3.5" /> {imdsRunning ? 'Performing handshake evaluation...' : `Trigger Metadata Request (${imdsVersion === 'v1' ? 'Direct Endpoint' : 'Token Secure Handshake'})`}
            </button>
          </div>

          {/* Burstable Credits Simulator */}
          <div className="lg:col-span-5 ec2-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', padding: '16px', background: 'var(--ec-card-bg)', borderLeft: '1px solid var(--ec-card-border)', borderRight: '1px solid var(--ec-card-border)', borderBottom: '1px solid var(--ec-card-border)' }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sliders className="w-5 h-5 text-amber-500" />
                <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>Burstable T3 CPU Credit Balance Sandbox</div>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.45' }}>
                T3 burstable instances use a credit system. When CPU runs below baseline, credits accumulate. When load spikes above baseline, credits are consumed. Running out of credits results in hard CPU throttling to baseline levels.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Instance Size:</label>
                  <select 
                    value={awsInstanceSize} 
                    onChange={(e) => setAwsInstanceSize(e.target.value as any)}
                    style={{ width: '100%', padding: '5px', borderRadius: '4px', fontSize: '11.5px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--ec-card-border)' }}
                  >
                    <option value="nano">t3.nano (Baseline: 5%)</option>
                    <option value="micro">t3.micro (Baseline: 10%)</option>
                    <option value="small">t3.small (Baseline: 20%)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>CPU Load: {awsCpuUtilization}%</label>
                  <input 
                    type="range" 
                    min="2" 
                    max="100" 
                    value={awsCpuUtilization}
                    onChange={(e) => setAwsCpuUtilization(Number(e.target.value))}
                    style={{ width: '100%', marginTop: '8px' }}
                  />
                </div>
              </div>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 'bold' }}>Credit Balance:</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: awsCredits < 30 ? '#dc2626' : '#16a34a' }}>
                    {awsCredits} credits
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#cbd5e1', borderRadius: '4px', overflow: 'hidden', marginTop: '6px' }}>
                  <div style={{ 
                    height: '100%', 
                    background: awsCredits < 30 ? '#ef4444' : '#10b981', 
                    width: `${Math.min(100, (awsCredits / (awsInstanceSize === 'nano' ? 144 : awsInstanceSize === 'micro' ? 288 : 576)) * 100)}%`,
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>

              {/* Logs */}
              <div style={{ maxHeight: '95px', overflowY: 'auto', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--ec-card-border)', borderRadius: '6px', padding: '6px', fontSize: '10px', fontFamily: 'monospace', color: 'var(--color-text-secondary)' }}>
                {awsCreditStateLog.length > 0 ? (
                  awsCreditStateLog.map((log, index) => <div key={index} style={{ marginBottom: '2px' }}>{log}</div>)
                ) : (
                  <div style={{ color: '#94a3b8' }}>Adjust sliders and click "Simulate 1 Hour" below...</div>
                )}
              </div>
            </div>

            <button 
              onClick={triggerAwsSimulationHour}
              className="ec2-btn ec2-on"
              style={{ width: '100%', padding: '8px', fontSize: '11.5px', marginTop: '12px' }}
            >
              🔄 Simulate 1 Hour Workload
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE BLOBS: EPHEMERAL DISK & SPOT EVICTION                               */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Ephemeral OS Disk */}
          <div className="lg:col-span-7 ec2-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', padding: '16px', background: 'var(--ec-card-bg)', borderLeft: '1px solid var(--ec-card-border)', borderRight: '1px solid var(--ec-card-border)', borderBottom: '1px solid var(--ec-card-border)' }}>
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-blue-500" />
                  <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>Ephemeral OS Disk Re-imaging Sandbox</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => setDiskType('remote')}
                    className={`px-2 py-1 rounded text-[10.5px] font-bold ${diskType === 'remote' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'}`}
                  >
                    Remote Disk
                  </button>
                  <button 
                    onClick={() => setDiskType('ephemeral')}
                    className={`px-2 py-1 rounded text-[10.5px] font-bold ${diskType === 'ephemeral' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'}`}
                  >
                    Ephemeral OS Disk
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: '1.45' }}>
                Ephemeral OS Disks are created on the local VM storage (cache or SSD) rather than remote Azure Storage. This provides zero storage costs and sub-second VM re-imaging, making it perfect for stateless container hosts or scale-set fleets.
              </p>

              {/* Progress and simulation console */}
              <div className="anl-log" style={{ border: '1px solid var(--color-border-tertiary)', borderRadius: '10px', padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#38bdf8', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '6px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  <span>Azure VM Reimage Console</span>
                  <span style={{ fontWeight: 'bold', color: diskType === 'ephemeral' ? '#34d399' : '#60a5fa' }}>
                    {diskType === 'ephemeral' ? 'Local NVMe Cache Engine' : 'Managed Disk Remote Engine'}
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '10px', marginBottom: '4px' }}>
                    <span>VM Reimage Sequence:</span>
                    <span>{rebuildProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#0078D4', width: `${rebuildProgress}%`, transition: 'width 0.2s' }} />
                  </div>
                </div>

                {/* Reimage Stats */}
                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-100 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 text-center mb-3">
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '9px', display: 'block' }}>REBUILD TIME:</span>
                    <span style={{ color: '#fff', fontSize: '11.5px', fontWeight: 'bold' }}>{rebuildStats.time} ms</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', fontSize: '9px', display: 'block' }}>STORAGE BILLING:</span>
                    <span style={{ color: '#34d399', fontSize: '11.5px', fontWeight: 'bold' }}>{rebuildStats.cost}</span>
                  </div>
                </div>

                {/* Logs Terminal */}
                <div style={{ height: '100px', overflowY: 'auto', background: '#020617', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8' }}>
                  {rebuildLogs.length > 0 ? (
                    rebuildLogs.map((log, index) => <div key={index}>{log}</div>)
                  ) : (
                    <div style={{ color: '#475569' }}>Click "Trigger OS Re-image"...</div>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={startRebuildSim}
              disabled={rebuildRunning}
              className="ec2-btn ec2-on"
              style={{ width: '100%', padding: '8px', fontSize: '11.5px' }}
            >
              <Play className="w-3.5 h-3.5" /> {rebuildRunning ? 'Executing re-image routine...' : 'Trigger VM OS Re-image (Stateless Reset)'}
            </button>
          </div>

          {/* Spot Eviction Lookup */}
          <div className="lg:col-span-5 ec2-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', padding: '16px', background: 'var(--ec-card-bg)', borderLeft: '1px solid var(--ec-card-border)', borderRight: '1px solid var(--ec-card-border)', borderBottom: '1px solid var(--ec-card-border)' }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-blue-500" />
                <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>Spot VM Eviction Probability Dashboard</div>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginBottom: '12px', lineHeight: '1.45' }}>
                Azure Spot VMs allow you to buy compute capacity at massive discounts, but they can be evicted at any time when capacity is needed. Use this query dashboard to examine historical regional eviction rates.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Target Region:</label>
                  <select 
                    value={azureRegion} 
                    onChange={(e) => setAzureRegion(e.target.value)}
                    style={{ width: '100%', padding: '5px', borderRadius: '4px', fontSize: '11.5px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--ec-card-border)' }}
                  >
                    <option value="eastus">East US (Virginia)</option>
                    <option value="westeurope">West Europe (Amsterdam)</option>
                    <option value="eastasia">East Asia (Hong Kong)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>VM Size:</label>
                  <select 
                    value={azureVmSize} 
                    onChange={(e) => setAzureVmSize(e.target.value)}
                    style={{ width: '100%', padding: '5px', borderRadius: '4px', fontSize: '11.5px', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', border: '1px solid var(--ec-card-border)' }}
                  >
                    <option value="d2s">D2s_v5 (General Purpose)</option>
                    <option value="e4s">E4s_v5 (Memory Optimized)</option>
                    <option value="f8s">F8s_v2 (Compute Optimized)</option>
                  </select>
                </div>
              </div>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ec-card-border)', paddingBottom: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Spot Eviction Probability:</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: spotInfo.eviction.includes('High') ? '#dc2626' : spotInfo.eviction.includes('Medium') ? '#d97706' : '#16a34a' }}>
                    {spotInfo.eviction}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ec-card-border)', paddingBottom: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Spot Hourly Discount:</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#16a34a' }}>{spotInfo.discount} Off</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--ec-card-border)', paddingBottom: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Estimated Spot Price:</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{spotInfo.price}</span>
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginTop: '4px' }}>
                  ⚡ {spotInfo.alert}
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e', marginTop: '12px' }}>
              💡 Spot VM eviction warnings are sent via Azure scheduled events metadata service 30 seconds before the eviction occurs. Ensure VM workloads write state checkpoints frequently.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GOOGLE CLOUD STORAGE: LIVE MIGRATION & CUSTOM SIZING                      */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Live Migration Sandbox */}
          <div className="lg:col-span-7 ec2-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', padding: '16px', background: 'var(--ec-card-bg)', borderLeft: '1px solid var(--ec-card-border)', borderRight: '1px solid var(--ec-card-border)', borderBottom: '1px solid var(--ec-card-border)' }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-emerald-500" />
                <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>Compute Engine Live Migration Simulator</div>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: '1.45' }}>
                Google Cloud VM instances support Live Migration. During host physical maintenance, Google automatically migrates your running VM to a new physical host without shutting it down, maintaining full CPU and memory execution context.
              </p>

              {/* Live migration simulation display */}
              <div className="anl-log" style={{ border: '1px solid var(--color-border-tertiary)', borderRadius: '10px', padding: '12px', fontFamily: 'monospace', fontSize: '11px', color: '#38bdf8', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '6px', marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                  <span>GCP VM Hypervisor Telemetry</span>
                  <span className={migrationRunning ? 'animate-pulse text-emerald-500' : 'text-emerald-400'} style={{ fontWeight: 'bold' }}>
                    {migrationRunning ? 'MIGRATING LIVE STATE...' : 'HOST HEALTHY (LiveMigration Enabled)'}
                  </span>
                </div>

                <div className="flex items-center justify-around text-center py-2 bg-slate-50 dark:bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 mb-3" style={{ fontSize: '10.5px' }}>
                  <div style={{ padding: '4px', borderRadius: '4px', border: migrationStep === 1 || migrationStep === 2 ? '1px solid #dc2626' : '1px solid transparent' }}>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '9px' }}>SOURCE HYPERVISOR:</span>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>Node-9824 (Faulty)</span>
                  </div>
                  <div style={{ color: '#475569', fontWeight: 'bold' }}>=======➔</div>
                  <div style={{ padding: '4px', borderRadius: '4px', border: migrationStep >= 3 ? '1px solid #16a34a' : '1px solid transparent' }}>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '9px' }}>TARGET HYPERVISOR:</span>
                    <span style={{ color: '#fff', fontWeight: 'bold' }}>Node-9882 (Healthy)</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center bg-slate-50 dark:bg-slate-100 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-800 mb-3" style={{ fontSize: '11px' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '9px' }}>ACTIVE SESSION UPTIME:</span>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>{migrationUptime}s</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontSize: '9px' }}>MEMORY CONTEXT:</span>
                    <span style={{ color: '#34d399', fontWeight: 'bold' }}>100% PRESERVED</span>
                  </div>
                </div>

                {/* Logs Terminal */}
                <div style={{ height: '95px', overflowY: 'auto', background: '#020617', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8' }}>
                  {migrationLogs.length > 0 ? (
                    migrationLogs.map((log, index) => <div key={index}>{log}</div>)
                  ) : (
                    <div style={{ color: '#475569' }}>Click "Trigger Host Maintenance Fault"...</div>
                  )}
                </div>
              </div>
            </div>

            <button 
              onClick={startMigrationSim}
              disabled={migrationRunning}
              className="ec2-btn ec2-on"
              style={{ width: '100%', padding: '8px', fontSize: '11.5px' }}
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> {migrationRunning ? 'Live-copying active RAM registers...' : 'Trigger Host Maintenance Fault (Simulate Live Migration)'}
            </button>
          </div>

          {/* Custom Machine Sizer */}
          <div className="lg:col-span-5 ec2-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', padding: '16px', background: 'var(--ec-card-bg)', borderLeft: '1px solid var(--ec-card-border)', borderRight: '1px solid var(--ec-card-border)', borderBottom: '1px solid var(--ec-card-border)' }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sliders className="w-5 h-5 text-emerald-500" />
                <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--color-text-primary)' }}>Compute Engine Custom Machine Shape Sizer</div>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginBottom: '14px', lineHeight: '1.45' }}>
                Instead of forcing workloads into rigid pre-packaged instance sizes, GCP lets you define custom shapes. Adjust vCPUs and RAM to construct a custom-sized VM and compare monthly billing vs AWS/Azure fixed sizes.
              </p>

              {/* Sliders */}
              <div className="space-y-4 mb-4">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>Custom vCPU Cores:</span>
                    <span style={{ color: '#0F9D58' }}>{customVcpu} vCPUs</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="64" 
                    value={customVcpu}
                    onChange={(e) => setCustomVcpu(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '4px' }}>
                    <span>Custom Memory allocation:</span>
                    <span style={{ color: '#0F9D58' }}>{customRam} GB RAM</span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="256" 
                    value={customRam}
                    onChange={(e) => setCustomRam(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Comparison Sheet */}
              <div className="anl-log" style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border-tertiary)', fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-text-primary)' }}>
                <div style={{ borderBottom: '1px solid var(--color-border-tertiary)', paddingBottom: '4px', marginBottom: '6px', fontWeight: 'bold', color: 'var(--color-text-secondary)' }}>
                  MONTHLY COMPUTE BILLING COMPARISON
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>GCP Custom VM ({customVcpu}C/{customRam}G):</span>
                  <span style={{ color: '#34d399', fontWeight: 'bold' }}>${customSavings.customCost}/mo</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>AWS/Azure Fixed ({customSavings.fixedType}):</span>
                  <span style={{ color: '#f87171' }}>${customSavings.fixedCost}/mo</span>
                </div>
                <div style={{ borderTop: '1px dotted var(--color-border-tertiary)', marginTop: '6px', paddingTop: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span style={{ color: '#34d399' }}>Estimated Monthly Savings:</span>
                  <span style={{ color: '#34d399' }}>${customSavings.savings}/mo ({customSavings.percent}%)</span>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44', marginTop: '14px' }}>
              💡 Custom sizing prevents paying for unused memory/cores. For instance, if an app requires 6 vCPUs and 24GB RAM, standard cloud sizes force you to pay for 8 vCPUs and 32GB RAM (wasting 25% of resources).
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
