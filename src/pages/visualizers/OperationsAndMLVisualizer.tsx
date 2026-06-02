import { useState, useEffect } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Check,
  Copy,
  Terminal,
  Play,
  RotateCcw,
  RefreshCw,
  Server,
  Code,
  AlertTriangle,
  PlayCircle,
  Mail,
  Bot,
  DollarSign
} from 'lucide-react';

type TabType = 'notebook' | 'cfn_ssm' | 'fleet' | 'hybrid_batch' | 'ml_analytics' | 'finops';

interface EC2Instance {
  id: string;
  name: string;
  os: 'Amazon Linux 2023' | 'Ubuntu 22.04' | 'Windows Server 2022';
  ssmAgent: 'Online' | 'Offline';
  patchCompliance: 'Compliant' | 'Missing Patches' | 'Pending Scan';
  lastPatched: string;
}

interface BatchJob {
  id: string;
  name: string;
  env: 'AWS Outposts (On-Prem)' | 'Spot Instance Fleet' | 'On-Demand Compute';
  status: 'SUBMITTED' | 'RUNNABLE' | 'STARTING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  duration: number;
}

// AWS CLI commands snippets
const cfnDeployCli = `aws cloudformation create-stack \\
  --stack-name production-vpc-web \\
  --template-body file://vpc-web-cluster.json \\
  --parameters ParameterKey=KeyPairName,ParameterValue=prod-key ParameterKey=InstanceType,ParameterValue=t3.medium \\
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \\
  --enable-termination-protection`;

const ssmStartSessionCli = `aws ssm start-session \\
  --target i-0a1b2c3d4e5f6g7h8 \\
  --document-name AWS-StartSSHSession \\
  --parameters portNumber=22`;

const sesVerifyDomainCli = `aws ses verify-domain-identity \\
  --domain example.com`;

const sagemakerInferenceCli = `aws sagemaker-runtime invoke-endpoint \\
  --endpoint-name churn-prediction-xgboost \\
  --body file://customer-data.csv \\
  --content-type text/csv \\
  --accept application/json \\
  response.json`;

const costExplorerQueryCli = `aws ce get-cost-and-usage \\
  --time-period Start=2026-05-01,End=2026-05-31 \\
  --granularity MONTHLY \\
  --metrics UnblendedCost \\
  --group-by Type=DIMENSION,Key=SERVICE`;

export default function OperationsAndMLVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');

  // Notebook states
  const [selectedNote, setSelectedNote] = useState<string>('cloudformation');
  const [expandedCategory, setExpandedCategory] = useState<string>('iac_automation');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedNoteId(id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  // ==========================================
  // TAB 1: IaC & Automation Simulator (CloudFormation & SSM Automation)
  // ==========================================
  const [cfnTemplate, setCfnTemplate] = useState<'web' | 'database' | 'nested'>('web');
  const [cfnState, setCfnState] = useState<'idle' | 'deploying' | 'complete' | 'rolling_back' | 'rolled_back'>('idle');
  const [rollbackOnError, setRollbackOnError] = useState<boolean>(false);
  const [cfnLogs, setCfnLogs] = useState<string[]>([]);
  const [drifted, setDrifted] = useState<boolean>(false);
  const [driftDetected, setDriftDetected] = useState<boolean>(false);
  const [ssmRemediating, setSsmRemediating] = useState<boolean>(false);

  // ==========================================
  // TAB 2: SSM Fleet & Operations Simulator
  // ==========================================
  const [fleet, setFleet] = useState<EC2Instance[]>([
    { id: 'i-0a1b2c3d', name: 'web-prod-01', os: 'Amazon Linux 2023', ssmAgent: 'Online', patchCompliance: 'Missing Patches', lastPatched: '2026-05-15' },
    { id: 'i-0f9e8d7c', name: 'web-prod-02', os: 'Amazon Linux 2023', ssmAgent: 'Online', patchCompliance: 'Compliant', lastPatched: '2026-05-28' },
    { id: 'i-0123abcd', name: 'db-replica-01', os: 'Ubuntu 22.04', ssmAgent: 'Online', patchCompliance: 'Missing Patches', lastPatched: '2026-05-10' },
    { id: 'i-0zyxw987', name: 'legacy-app-01', os: 'Windows Server 2022', ssmAgent: 'Offline', patchCompliance: 'Pending Scan', lastPatched: 'Never' }
  ]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>('i-0a1b2c3d');
  const [ssmTerminalOpen, setSsmTerminalOpen] = useState<boolean>(false);
  const [ssmTerminalLogs, setSsmTerminalLogs] = useState<string[]>([]);
  const [ssmInput, setSsmInput] = useState<string>('');
  const [patchLogs, setPatchLogs] = useState<string[]>([]);
  const [patchState, setPatchState] = useState<'idle' | 'scanning' | 'installing' | 'complete'>('idle');
  const [maintWindowActive, setMaintWindowActive] = useState<boolean>(false);

  // ==========================================
  // TAB 3: App Channels & Hybrid Simulator (Outposts, Batch, SES)
  // ==========================================
  const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
  const [batchJobName, setBatchJobName] = useState<string>('Image-Resize-Job');
  const [batchEnv, setBatchEnv] = useState<'AWS Outposts (On-Prem)' | 'Spot Instance Fleet' | 'On-Demand Compute'>('AWS Outposts (On-Prem)');
  const [sesLogs, setSesLogs] = useState<string[]>([]);
  const [suppressedEmails, setSuppressedEmails] = useState<string[]>(['banned-user@spambot.org']);
  const [emailInput, setEmailInput] = useState<string>('customer-test@example.com');

  // ==========================================
  // TAB 4: ML & AI API Simulator
  // ==========================================
  const [mlModel, setMlModel] = useState<'churn' | 'resnet' | 'fraud'>('churn');
  const [deployType, setDeployType] = useState<'standard' | 'shadow'>('standard');
  const [inferenceLogs, setInferenceLogs] = useState<string[]>([]);
  const [mlIsLoading, setMlIsLoading] = useState<boolean>(false);
  const [rekImage, setRekImage] = useState<'server' | 'desk' | 'drone'>('server');
  const [parsedLabels, setParsedLabels] = useState<{ label: string, conf: number }[]>([]);
  const [textractText, setTextractText] = useState<{ key: string, value: string }[]>([]);
  const [pollyText, setPollyText] = useState<string>('Welcome to the AWS Visual Architect workbench.');
  const [lexSlots, setLexSlots] = useState<{ slot: string, val: string }[]>([]);

  // ==========================================
  // TAB 5: Cost & FinOps Simulator
  // ==========================================
  const [costGroup, setCostGroup] = useState<'service' | 'account' | 'tag'>('service');
  const [anomalySpike, setAnomalySpike] = useState<'none' | 'lambda' | 'ebs'>('none');
  const [savingsPlanBaseline, setSavingsPlanBaseline] = useState<number>(10);
  const [advisorState, setAdvisorState] = useState<'idle' | 'scanning' | 'complete'>('idle');
  const [advisorResults, setAdvisorResults] = useState<{ category: string, title: string, status: 'ok' | 'warn' | 'error', savings?: string }[]>([]);

  // Helper now
  const timestamp = () => new Date().toLocaleTimeString();

  // CloudFormation Deploy Loop
  const handleCfnDeploy = async () => {
    if (cfnState === 'deploying' || cfnState === 'rolling_back') return;
    setCfnState('deploying');
    setDriftDetected(false);
    setDrifted(false);
    setCfnLogs([`[${timestamp()}] [INFO] Starting stack creation deployment for production-${cfnTemplate}...`]);

    await new Promise(r => setTimeout(r, 800));
    setCfnLogs(prev => [...prev, `[${timestamp()}] [IaC] Validating CloudFormation parameters, stacks templates and IAM permissions...`]);
    await new Promise(r => setTimeout(r, 600));

    if (cfnTemplate === 'nested') {
      setCfnLogs(prev => [...prev, `[${timestamp()}] [NestedStack] Creating parent stack production-nested-root...`]);
      await new Promise(r => setTimeout(r, 500));
      setCfnLogs(prev => [...prev, `[${timestamp()}] [NestedStack] Deploying child stack nested-network-vpc... [CREATE_IN_PROGRESS]`]);
      await new Promise(r => setTimeout(r, 600));
    }

    setCfnLogs(prev => [...prev, `[${timestamp()}] [Resource] Creating AWS::EC2::VPC vpc-0a1b2c3d... [CREATE_IN_PROGRESS]`]);
    await new Promise(r => setTimeout(r, 700));
    setCfnLogs(prev => [...prev, `[${timestamp()}] [Resource] AWS::EC2::Subnet subnet-public-1a... [CREATE_COMPLETE]`]);

    if (rollbackOnError) {
      await new Promise(r => setTimeout(r, 600));
      setCfnLogs(prev => [...prev, `[${timestamp()}] [ERROR] AWS::ElasticLoadBalancingV2::LoadBalancer app-alb failed: Subnets not found in target AZ. Insufficient allocation.`]);
      await new Promise(r => setTimeout(r, 600));
      setCfnState('rolling_back');
      setCfnLogs(prev => [...prev, `[${timestamp()}] [ROLLBACK] Initiating stack rollback sequence. Evicting active stack resources...`]);
      await new Promise(r => setTimeout(r, 800));
      setCfnLogs(prev => [...prev, `[${timestamp()}] [ROLLBACK] Deleting AWS::EC2::Subnet subnet-public-1a... [DELETE_COMPLETE]`]);
      await new Promise(r => setTimeout(r, 600));
      setCfnLogs(prev => [...prev, `[${timestamp()}] [ROLLBACK] Deleting AWS::EC2::VPC vpc-0a1b2c3d... [DELETE_COMPLETE]`]);
      await new Promise(r => setTimeout(r, 500));
      setCfnLogs(prev => [...prev, `[${timestamp()}] [ROLLBACK] Stack rollback completed. Stack state: ROLLBACK_COMPLETE`]);
      setCfnState('rolled_back');
      return;
    }

    await new Promise(r => setTimeout(r, 800));
    setCfnLogs(prev => [...prev, `[${timestamp()}] [Resource] AWS::EC2::SecurityGroup web-app-sg... [CREATE_COMPLETE]`]);
    await new Promise(r => setTimeout(r, 500));
    setCfnLogs(prev => [...prev, `[${timestamp()}] [Resource] AWS::AutoScaling::AutoScalingGroup app-asg... [CREATE_IN_PROGRESS]`]);
    await new Promise(r => setTimeout(r, 600));
    setCfnLogs(prev => [...prev, `[${timestamp()}] [INFO] Stack creation completed successfully. Stack state: CREATE_COMPLETE`]);
    setCfnState('complete');
  };

  // CloudFormation Drift Detection
  const handleCfnModifyOutofBand = () => {
    setDrifted(true);
    setDriftDetected(false);
    setCfnLogs(prev => [
      ...prev,
      `[${timestamp()}] [out-of-band] Out-of-band modification detected: Security Group web-app-sg rule updated manually. Port 22 SSH set to 0.0.0.0/0 (Drifted from code).`
    ]);
  };

  const handleCfnDetectDrift = async () => {
    if (cfnState !== 'complete') return;
    setCfnLogs(prev => [...prev, `[${timestamp()}] [DRIFT] Initiating Drift Detection scanner across all stack resources...`]);
    await new Promise(r => setTimeout(r, 800));

    if (drifted) {
      setCfnLogs(prev => [
        ...prev,
        `[${timestamp()}] [DRIFT] DRIFTED STATE DETECTED!`,
        `[${timestamp()}] [DRIFT] Resource: AWS::EC2::SecurityGroup (web-app-sg)`,
        `[${timestamp()}] [DRIFT] Expected: {"{"}"FromPort": 22, "CidrIp": "10.0.0.0/8"{"}"}`,
        `[${timestamp()}] [DRIFT] Actual: {"{"}"FromPort": 22, "CidrIp": "0.0.0.0/0"{"}"}`
      ]);
      setDriftDetected(true);
    } else {
      setCfnLogs(prev => [...prev, `[${timestamp()}] [DRIFT] Scan complete. Stack in-sync. Drift status: IN_SYNC`]);
      setDriftDetected(false);
    }
  };

  const handleSsmRemediation = async () => {
    if (!driftDetected) return;
    setSsmRemediating(true);
    setCfnLogs(prev => [...prev, `[${timestamp()}] [SSM-Automation] Executing remediation runbook AWS-RemediateSecurityGroupDrift...`]);
    await new Promise(r => setTimeout(r, 1000));
    setCfnLogs(prev => [
      ...prev,
      `[${timestamp()}] [SSM-Automation] Runbook step 1: Revoking manual authorization rule for 0.0.0.0/0... [SUCCESS]`,
      `[${timestamp()}] [SSM-Automation] Runbook step 2: Restoring ingress baseline to 10.0.0.0/8... [SUCCESS]`
    ]);
    await new Promise(r => setTimeout(r, 500));
    setDrifted(false);
    setDriftDetected(false);
    setSsmRemediating(false);
    setCfnLogs(prev => [...prev, `[${timestamp()}] [INFO] Stack state restored. Drift status: IN_SYNC`]);
  };

  // SSM Session Manager Terminal Shell Simulation
  const handleOpenSession = (instId: string) => {
    const inst = fleet.find(x => x.id === instId);
    if (!inst || inst.ssmAgent === 'Offline') return;
    setSelectedInstanceId(instId);
    setSsmTerminalOpen(true);
    setSsmTerminalLogs([
      `Starting session on target ${instId} (${inst.name})`,
      `🔐 Session logs will be streamed securely to s3://ssm-session-audit-logs/`,
      `SSM Agent connection verified. Transport layer encrypted via KMS key-9b8a7c6.`,
      `ssm-user@${inst.name}:~$ `
    ]);
  };

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ssmInput.trim()) return;

    const cmd = ssmInput.trim();
    const inst = fleet.find(x => x.id === selectedInstanceId);
    const instName = inst ? inst.name : 'instance';
    let output = '';

    if (cmd === 'whoami') {
      output = 'ssm-user';
    } else if (cmd === 'aws --version') {
      output = 'aws-cli/2.15.0 Python/3.11.6 Linux/6.1.0-aws';
    } else if (cmd === 'curl http://169.254.169.254/latest/meta-data/') {
      output = 'HTTP/1.1 401 Unauthorized\nIMDSv2 token required. Access denied. Please retrieve token via PUT first.';
    } else if (cmd.includes('metadata-token')) {
      output = 'Token successfully retrieved: [AWS-METADATA-SESSION-TOKEN-ABC984]';
    } else if (cmd === 'cat /etc/os-release') {
      output = `NAME="${inst?.os.split(' ')[0]}"\nVERSION="${inst?.os.split(' ')[1] || '2023'}"\nID="aws-linux-or-ubuntu"`;
    } else if (cmd === 'clear') {
      setSsmTerminalLogs([`ssm-user@${instName}:~$ `]);
      setSsmInput('');
      return;
    } else {
      output = `bash: ${cmd}: command not found. Available commands: whoami, aws --version, curl http://169.254.169.254/latest/meta-data/, cat /etc/os-release, clear`;
    }

    setSsmTerminalLogs(prev => [
      ...prev.slice(0, prev.length - 1),
      `ssm-user@${instName}:~$ ${cmd}`,
      output,
      `ssm-user@${instName}:~$ `
    ]);
    setSsmInput('');
  };

  // SSM Patch Manager Simulation
  const handlePatchScan = async () => {
    if (patchState !== 'idle') return;
    setPatchState('scanning');
    setPatchLogs([`[${timestamp()}] [PatchManager] Pinging target instances via SSM RunCommand...`]);

    await new Promise(r => setTimeout(r, 650));
    setPatchLogs(prev => [...prev, `[${timestamp()}] [PatchManager] Checking against baseline AWS-DefaultPatchBaseline...`]);

    await new Promise(r => setTimeout(r, 800));
    setFleet(prev => prev.map(inst => {
      if (inst.ssmAgent === 'Offline') return inst;
      return { ...inst, patchCompliance: inst.id === 'i-0f9e8d7c' ? 'Compliant' : 'Missing Patches' };
    }));
    setPatchLogs(prev => [
      ...prev,
      `[${timestamp()}] [ScanResult] i-0a1b2c3d: 3 critical security updates missing.`,
      `[${timestamp()}] [ScanResult] i-0123abcd: 5 security updates missing.`,
      `[${timestamp()}] [ScanResult] i-0f9e8d7c: Compliant.`,
      `[${timestamp()}] [ScanResult] i-0zyxw987: [FAILED] SSM Agent Offline.`,
      `[${timestamp()}] [PatchManager] Scan run completed successfully.`
    ]);
    setPatchState('idle');
  };

  const handlePatchInstall = async () => {
    if (patchState !== 'idle') return;
    setPatchState('installing');
    setPatchLogs([`[${timestamp()}] [PatchManager] Executing patch installation command AWS-RunPatchBaseline...`]);

    await new Promise(r => setTimeout(r, 800));
    setPatchLogs(prev => [...prev, `[${timestamp()}] [PatchManager] Downloading updates on i-0a1b2c3d and i-0123abcd...`]);

    await new Promise(r => setTimeout(r, 800));
    setPatchLogs(prev => [...prev, `[${timestamp()}] [PatchManager] Applying security patches. Performing rolling restart of services...`]);

    await new Promise(r => setTimeout(r, 1000));
    setFleet(prev => prev.map(inst => {
      if (inst.ssmAgent === 'Offline') return inst;
      return { ...inst, patchCompliance: 'Compliant', lastPatched: 'Today' };
    }));

    setPatchLogs(prev => [
      ...prev,
      `[${timestamp()}] [InstallResult] i-0a1b2c3d: Patches applied. State: Compliant.`,
      `[${timestamp()}] [InstallResult] i-0123abcd: Patches applied. State: Compliant.`,
      `[${timestamp()}] [PatchManager] Installation complete. Fleet compliant.`
    ]);
    setPatchState('complete');
  };

  const handleTriggerMaintWindow = async () => {
    setMaintWindowActive(true);
    setPatchLogs(prev => [
      ...prev,
      `[${timestamp()}] [MaintenanceWindow] MW window-0a1b2c triggered. Executing tasks...`,
      `[${timestamp()}] [MaintenanceWindow] Executing task RunCommand on target group TG-Production-Web...`
    ]);
    await new Promise(r => setTimeout(r, 800));
    setMaintWindowActive(false);
    setPatchLogs(prev => [...prev, `[${timestamp()}] [MaintenanceWindow] All tasks completed. Window closed.`]);
  };

  // AWS Batch Job Queue Simulation
  const handleAddBatchJob = async () => {
    const newJob: BatchJob = {
      id: 'job-' + Math.random().toString(16).substring(2, 8).toUpperCase(),
      name: batchJobName,
      env: batchEnv,
      status: 'SUBMITTED',
      duration: 0
    };
    setBatchJobs(prev => [newJob, ...prev]);

    // Async state transitions
    await new Promise(r => setTimeout(r, 800));
    updateJobStatus(newJob.id, 'RUNNABLE');
    await new Promise(r => setTimeout(r, 600));
    updateJobStatus(newJob.id, 'STARTING');
    await new Promise(r => setTimeout(r, 800));
    updateJobStatus(newJob.id, 'RUNNING');
    
    // Run time simulation
    const runTimer = setInterval(() => {
      setBatchJobs(prev => prev.map(job => {
        if (job.id === newJob.id && job.status === 'RUNNING') {
          return { ...job, duration: job.duration + 1 };
        }
        return job;
      }));
    }, 1000);

    await new Promise(r => setTimeout(r, 4000));
    clearInterval(runTimer);
    updateJobStatus(newJob.id, 'SUCCEEDED');
  };

  const updateJobStatus = (id: string, status: any) => {
    setBatchJobs(prev => prev.map(job => {
      if (job.id === id) {
        return { ...job, status };
      }
      return job;
    }));
  };

  // SES & Pinpoint Campaign Email Simulation
  const handleSendSesEmail = async () => {
    setSesLogs(prev => [...prev, `[${timestamp()}] [Pinpoint] Fetching recipient segment "Targeted-Audience"...`]);
    await new Promise(r => setTimeout(r, 400));
    setSesLogs(prev => [...prev, `[${timestamp()}] [SES-SMTP] Connecting to email endpoint. Sending message envelope...`]);
    await new Promise(r => setTimeout(r, 600));

    if (suppressedEmails.includes(emailInput)) {
      setSesLogs(prev => [
        ...prev,
        `[${timestamp()}] [SES-FEEDBACK-LOOP] 🚨 hard bounce exception! Recipient ${emailInput} resides in suppression list.`,
        `[${timestamp()}] [Pinpoint] Suppressing recipient ${emailInput} to protect domain sender reputation score.`
      ]);
    } else {
      setSesLogs(prev => [
        ...prev,
        `[${timestamp()}] [SES-SUCCESS] Message accepted by MTA server. Envelope ID: ses-9a8b7c6d-5f4e.`,
        `[${timestamp()}] [Pinpoint] Campaign metrics updated: Delivery 100% | Open 100%`
      ]);
    }
  };

  const handleInjectHardBounce = () => {
    if (!suppressedEmails.includes(emailInput)) {
      setSuppressedEmails(prev => [...prev, emailInput]);
      setSesLogs(prev => [...prev, `[${timestamp()}] [BOUNCE-INJECTION] Injected Hard Bounce rule for ${emailInput}.`]);
    }
  };

  // ML Models & SageMaker Endpoint Simulator
  const handleSendInference = async () => {
    if (mlIsLoading) return;
    setMlIsLoading(true);
    setInferenceLogs([`[${timestamp()}] [SageMaker] Packaging CSV payload fields to JSON body payload...`]);

    await new Promise(r => setTimeout(r, 600));
    if (deployType === 'shadow') {
      setInferenceLogs(prev => [
        ...prev,
        `[${timestamp()}] [ShadowDeploy] Splitting traffic: 90% Production, 10% Shadow container.`,
        `[${timestamp()}] [ShadowDeploy] Production payload processed. Latency: 12.2ms.`,
        `[${timestamp()}] [ShadowDeploy] Shadow payload processed. Latency: 10.8ms.`
      ]);
    } else {
      setInferenceLogs(prev => [...prev, `[${timestamp()}] [SageMaker] Routing request payload to primary container...`]);
    }

    await new Promise(r => setTimeout(r, 800));
    let payloadOut = '';
    if (mlModel === 'churn') {
      payloadOut = '{"{"}"prediction": "CHURN_RISK", "probability": 0.89, "status": "FLAGGED"{"}"}';
    } else if (mlModel === 'resnet') {
      payloadOut = '{"{"}"prediction": "SERVER_ROOM", "labels": ["rack", "cables"], "confidence": 0.99{"}"}';
    } else {
      payloadOut = '{"{"}"prediction": "FRAUD_DETECTED", "risk_score": 0.94, "action": "BLOCK"{"}"}';
    }

    setInferenceLogs(prev => [
      ...prev,
      `[${timestamp()}] [Endpoint] SageMaker response (HTTP 200):`,
      payloadOut
    ]);
    setMlIsLoading(false);
  };

  // Rekognition Labels simulation
  useEffect(() => {
    if (rekImage === 'server') {
      setParsedLabels([
        { label: 'Server Rack', conf: 99.8 },
        { label: 'Network Switch', conf: 96.5 },
        { label: 'Cabling', conf: 92.1 }
      ]);
    } else if (rekImage === 'desk') {
      setParsedLabels([
        { label: 'Workspace', conf: 98.4 },
        { label: 'Computer Monitor', conf: 97.2 },
        { label: 'Desk Lamp', conf: 84.5 }
      ]);
    } else {
      setParsedLabels([
        { label: 'Security Gateway', conf: 99.1 },
        { label: 'Face Detection', conf: 94.6 },
        { label: 'Thermal Sensor', conf: 88.2 }
      ]);
    }
  }, [rekImage]);

  // Textract form fields simulation
  useEffect(() => {
    setTextractText([
      { key: 'Invoice Identifier', value: 'INV-98420-A' },
      { key: 'Vendor Merchant', value: 'AWS Operations LLC' },
      { key: 'Total Amount USD', value: '$1,480.00' },
      { key: 'Tax Calculation (5%)', value: '$74.00' }
    ]);
  }, []);

  // Polly Speech slot matching simulation
  const handleSynthesizePolly = () => {
    setLexSlots([
      { slot: 'DestinationCity', val: 'Seattle' },
      { slot: 'PickupDate', val: 'Tomorrow' },
      { slot: 'CarClassType', val: 'SUV' }
    ]);
  };

  // FinOps & Cost Explorer Simulator
  const handleSimulateAnomaly = (type: 'lambda' | 'ebs') => {
    setAnomalySpike(type);
  };

  const handleRunAdvisorScan = async () => {
    if (advisorState === 'scanning') return;
    setAdvisorState('scanning');
    setAdvisorResults([]);
    await new Promise(r => setTimeout(r, 800));

    setAdvisorResults([
      { category: 'Cost Optimization', title: 'Idle Application Load Balancers detected', status: 'error', savings: '$180/month' },
      { category: 'Cost Optimization', title: 'Unattached Amazon EBS Volumes leaking resources', status: 'warn', savings: '$45/month' },
      { category: 'Security', title: 'MFA not enabled on AWS Root Account credentials', status: 'error' },
      { category: 'Fault Tolerance', title: 'Multi-AZ RDS databases configured correctly', status: 'ok' },
      { category: 'Performance', title: 'Compute Instance Type is overprovisioned (i-0a1b2c3d)', status: 'warn', savings: '$32/month' }
    ]);
    setAdvisorState('complete');
  };

  const calculateSavings = () => {
    const hourlyCost = 28.5;
    const discount = costGroup === 'tag' ? 0.35 : 0.60;
    const unblendedCost = hourlyCost * 730;
    const blendedCost = hourlyCost * 730 * (1 - (savingsPlanBaseline / 100) * discount);
    return {
      unblended: unblendedCost.toFixed(2),
      blended: blendedCost.toFixed(2),
      savings: (unblendedCost - blendedCost).toFixed(2)
    };
  };

  const savings = calculateSavings();

  return (
    <div className="ops-container" style={{ color: 'var(--color-text-primary)' }}>
      <style>{`
        .ops-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 18px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 12px; }
        .ops-tb { padding: 6px 14px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 12px; cursor: pointer; background: rgba(255, 255, 255, 0.8); color: #475569; transition: all 0.15s ease-in-out; outline: none; font-weight: 500; }
        .ops-tb:hover { background: #f1f5f9; border-color: #94a3b8; color: #0f172a; }
        .ops-tb.ops-on { background: #16a34a; color: #fff; border-color: #16a34a; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2); }
        .ops-card { border: 1px solid rgba(226, 232, 240, 0.8); border-radius: 16px; padding: 14px 16px; background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(10px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03), 0 2px 4px -1px rgba(0,0,0,0.02); margin-bottom: 14px; }
        .ops-sec { font-size: 11px; font-weight: 750; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
        .ops-sec:first-child { margin-top: 0; }
        .ops-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .ops-grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        
        .ops-btn { font-size: 11.5px; padding: 6px 14px; border-radius: 8px; border: 1px solid #cbd5e1; background: #ffffff; color: #475569; cursor: pointer; transition: all 0.15s; outline: none; display: inline-flex; align-items: center; gap: 4px; font-weight: 600; }
        .ops-btn:hover { background: #f8fafc; color: #0f172a; border-color: #94a3b8; }
        .ops-btn.ops-primary { background: #16a34a; border-color: #16a34a; color: #fff; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.15); }
        .ops-btn.ops-primary:hover { background: #15803d; border-color: #15803d; }
        .ops-btn.ops-danger { background: #dc2626; border-color: #dc2626; color: #fff; }
        .ops-btn.ops-danger:hover { background: #b91c1c; border-color: #b91c1c; }
        .ops-btn:disabled { background: #f1f5f9; border-color: #e2e8f0; color: #cbd5e1; cursor: not-allowed; }
        
        .ops-log-terminal { background: #0f172a; border-radius: 12px; padding: 14px; font-family: monospace; color: #38bdf8; font-size: 11px; line-height: 1.5; overflow-y: auto; max-height: 220px; box-shadow: inset 0 2px 8px rgba(0,0,0,0.8); text-align: left; }
        .ops-log-terminal p { margin: 2px 0; }
        .ops-log-row-success { color: #34d399; }
        .ops-log-row-warn { color: #f59e0b; }
        .ops-log-row-error { color: #f87171; }
        .ops-log-row-info { color: #38bdf8; }

        .ops-shell { background: #000; border-radius: 10px; padding: 14px; font-family: monospace; color: #10b981; font-size: 11px; min-height: 180px; display: flex; flex-direction: column; justify-content: flex-end; text-align: left; }
        .ops-shell-line { white-space: pre-wrap; margin-bottom: 2px; }
        .ops-shell-input { background: transparent; border: none; outline: none; color: #10b981; font-family: monospace; flex-grow: 1; font-size: 11px; }

        .ops-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
        .ops-table th { background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 8px; text-align: left; font-weight: 750; color: #475569; }
        .ops-table td { border: 1.5px solid #cbd5e1; padding: 8px; color: #1e293b; }
        .ops-table tr:nth-child(even) { background: rgba(248, 250, 252, 0.5); }

        .ops-status-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 750; text-transform: uppercase; }
        .ops-sb-ok { background: #dcfce7; color: #15803d; }
        .ops-sb-warn { background: #fef3c7; color: #b45309; }
        .ops-sb-error { background: #fee2e2; color: #b91c1c; }

        /* Mappings styles */
        .acad-dir-container { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 16px; overflow: hidden; }
        .acad-dir-header { background: #f8fafc; color: #1e293b; padding: 12px 16px; font-weight: 800; font-size: 11px; border-bottom: 1px solid #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 8px; }
        .acad-dir-folder-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: #ffffff; border: none; border-bottom: 1px solid #cbd5e1; font-size: 10.5px; font-weight: 800; color: #475569; text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
        .acad-dir-folder-btn:hover { background: #f1f5f9; }
        .acad-dir-item-btn { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 18px; font-size: 11.5px; font-weight: 600; color: #64748b; border: none; border-left: 3px solid transparent; background: #ffffff; transition: all 0.15s; text-align: left; cursor: pointer; }
        .acad-dir-item-btn:hover { background: #f8fafc; color: #0284c7; }
        .acad-dir-item-btn.acad-active { background: #eff6ff; color: #0284c7; border-left-color: #0ea5e9; font-weight: 800; }
        .acad-detail-card { background: #ffffff; border: 1px solid #cbd5e1; border-radius: 16px; padding: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.03); }
        .acad-hero-badge { background: #e0f2fe; border: 1px solid #bae6fd; color: #0369a1; font-size: 9.5px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; padding: 3px 8px; border-radius: 8px; display: inline-flex; align-items: center; }
        .acad-takeaway-box { background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-left: 4px solid #0ea5e9; border-radius: 12px; padding: 16px; font-size: 11.5px; line-height: 1.6; color: #475569; font-weight: 600; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
        .acad-terminal { background: #0f172a; border-radius: 12px; padding: 12px; font-family: monospace; color: #cbd5e1; font-size: 10px; overflow-x: auto; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); }
      `}</style>

      {/* Header Banner */}
      <div style={{ padding: '14px 16px 4px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚙️ AWS Operations, Management &amp; Machine Learning Workbench
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Interactive sandboxes for CloudFormation rollbacks, Systems Manager automation runbooks, Cost Explorer budgets, SES campaigns, and SageMaker model endpoints.
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="ops-tabs">
          <button className={`ops-tb ${activeTab === 'notebook' ? 'ops-on' : ''}`} onClick={() => setActiveTab('notebook')}>📓 Visual Architect Notes</button>
          <button className={`ops-tb ${activeTab === 'cfn_ssm' ? 'ops-on' : ''}`} onClick={() => setActiveTab('cfn_ssm')}>🏗️ IaC &amp; Runbooks</button>
          <button className={`ops-tb ${activeTab === 'fleet' ? 'ops-on' : ''}`} onClick={() => setActiveTab('fleet')}>💻 SSM Fleet Manager</button>
          <button className={`ops-tb ${activeTab === 'hybrid_batch' ? 'ops-on' : ''}`} onClick={() => setActiveTab('hybrid_batch')}>🌎 Batch &amp; App Channels</button>
          <button className={`ops-tb ${activeTab === 'ml_analytics' ? 'ops-on' : ''}`} onClick={() => setActiveTab('ml_analytics')}>🤖 SageMaker &amp; AI APIs</button>
          <button className={`ops-tb ${activeTab === 'finops' ? 'ops-on' : ''}`} onClick={() => setActiveTab('finops')}>📊 Cost &amp; Trusted Advisor</button>
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        {/* ========================================================================= */}
        {/* TAB 1: VISUAL ARCHITECT NOTES (DEVELOPER ACADEMY)                         */}
        {/* ========================================================================= */}
        {activeTab === 'notebook' && (
          <div className="space-y-6 text-left">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
              <div className="relative z-10">
                <span className="bg-white/20 border border-white/20 text-white font-extrabold text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-mono">
                  Developer Operations Academy
                </span>
                <h2 className="text-2xl font-black tracking-tight mt-2 flex items-center gap-2">
                  <BookOpen className="w-6 h-6 stroke-[2] text-white" /> Operations &amp; Artificial Intelligence Workbench
                </h2>
                <p className="text-xs text-white/90 mt-1 max-w-3xl leading-relaxed">
                  A high-fidelity workspace covering CloudFormation StackSets lifecycle, systems automation runbooks, secure SSH-less session controls, SMTP delivery telemetry, SageMaker shadow endpoints, and cost allocation tags.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Directory Sidebar */}
              <div className="lg:col-span-3 space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1 font-mono">Operations Directory:</span>
                
                <div className="acad-dir-container">
                  <div className="acad-dir-header">
                    <BookOpen className="w-4 h-4 text-emerald-600" />
                    <span>Module Explorer</span>
                  </div>

                  {/* CATEGORY 1: AUTOMATION & IAC */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'iac_automation' ? '' : 'iac_automation')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Code className="w-3.5 h-3.5 text-emerald-500" />
                        1. IaC &amp; Runbooks
                      </span>
                      {expandedCategory === 'iac_automation' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'iac_automation' && (
                      <div className="bg-slate-50/50 py-1 border-b border-slate-100">
                        <button 
                          onClick={() => setSelectedNote('cloudformation')}
                          className={`acad-dir-item-btn ${selectedNote === 'cloudformation' ? 'acad-active' : ''}`}
                        >
                          CloudFormation Rollbacks
                        </button>
                        <button 
                          onClick={() => setSelectedNote('ssm_automation')}
                          className={`acad-dir-item-btn ${selectedNote === 'ssm_automation' ? 'acad-active' : ''}`}
                        >
                          SSM Automation Books
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CATEGORY 2: FLEET OPERATIONS */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'fleet_mgmt' ? '' : 'fleet_mgmt')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Server className="w-3.5 h-3.5 text-blue-500" />
                        2. Fleet &amp; Compliance
                      </span>
                      {expandedCategory === 'fleet_mgmt' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'fleet_mgmt' && (
                      <div className="bg-slate-50/50 py-1 border-b border-slate-100">
                        <button 
                          onClick={() => setSelectedNote('session_manager')}
                          className={`acad-dir-item-btn ${selectedNote === 'session_manager' ? 'acad-active' : ''}`}
                        >
                          SSM Session Manager
                        </button>
                        <button 
                          onClick={() => setSelectedNote('patch_manager')}
                          className={`acad-dir-item-btn ${selectedNote === 'patch_manager' ? 'acad-active' : ''}`}
                        >
                          SSM Patch &amp; MW
                        </button>
                        <button 
                          onClick={() => setSelectedNote('scheduler_advisor')}
                          className={`acad-dir-item-btn ${selectedNote === 'scheduler_advisor' ? 'acad-active' : ''}`}
                        >
                          Trusted Advisor checks
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CATEGORY 3: APP DELIVERY & HYBRID */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'hybrid_delivery' ? '' : 'hybrid_delivery')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-amber-500" />
                        3. Delivery &amp; Hybrid
                      </span>
                      {expandedCategory === 'hybrid_delivery' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'hybrid_delivery' && (
                      <div className="bg-slate-50/50 py-1 border-b border-slate-100">
                        <button 
                          onClick={() => setSelectedNote('ses_pinpoint')}
                          className={`acad-dir-item-btn ${selectedNote === 'ses_pinpoint' ? 'acad-active' : ''}`}
                        >
                          SES &amp; Pinpoint Loops
                        </button>
                        <button 
                          onClick={() => setSelectedNote('outposts_batch')}
                          className={`acad-dir-item-btn ${selectedNote === 'outposts_batch' ? 'acad-active' : ''}`}
                        >
                          Batch &amp; Outposts queues
                        </button>
                        <button 
                          onClick={() => setSelectedNote('appflow_amplify')}
                          className={`acad-dir-item-btn ${selectedNote === 'appflow_amplify' ? 'acad-active' : ''}`}
                        >
                          AppFlow &amp; Amplify
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CATEGORY 4: ML & ANALYTICS */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'ml_analytics_worksheets' ? '' : 'ml_analytics_worksheets')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Bot className="w-3.5 h-3.5 text-purple-500" />
                        4. AWS ML Services
                      </span>
                      {expandedCategory === 'ml_analytics_worksheets' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'ml_analytics_worksheets' && (
                      <div className="bg-slate-50/50 py-1 border-b border-slate-100">
                        <button 
                          onClick={() => setSelectedNote('sagemaker_workspace')}
                          className={`acad-dir-item-btn ${selectedNote === 'sagemaker_workspace' ? 'acad-active' : ''}`}
                        >
                          SageMaker Endpoints
                        </button>
                        <button 
                          onClick={() => setSelectedNote('vision_text_ocr')}
                          className={`acad-dir-item-btn ${selectedNote === 'vision_text_ocr' ? 'acad-active' : ''}`}
                        >
                          Rekognition &amp; Textract
                        </button>
                        <button 
                          onClick={() => setSelectedNote('lex_polly_translate')}
                          className={`acad-dir-item-btn ${selectedNote === 'lex_polly_translate' ? 'acad-active' : ''}`}
                        >
                          Polly, Lex &amp; Translate
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CATEGORY 5: COST MANAGEMENT */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 'finops_mgmt' ? '' : 'finops_mgmt')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-indigo-500" />
                        5. FinOps &amp; Budgets
                      </span>
                      {expandedCategory === 'finops_mgmt' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 'finops_mgmt' && (
                      <div className="bg-slate-50/50 py-1">
                        <button 
                          onClick={() => setSelectedNote('cost_explorer')}
                          className={`acad-dir-item-btn ${selectedNote === 'cost_explorer' ? 'acad-active' : ''}`}
                        >
                          Cost Explorer tag rules
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Workspace */}
              <div className="lg:col-span-9 space-y-6">

                {/* CLOUDFORMATION WORKSHEET */}
                {selectedNote === 'cloudformation' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Infrastructure as Code</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">CloudFormation Deployment &amp; Drift Loops</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('cfn_ssm')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5" /> Go to IaC Simulator
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 1 of 5</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      AWS CloudFormation translates declarative template files (JSON or YAML) into live cloud resources. When updates fail, CloudFormation executes an automatic rollback sequence to return the environment to a known safe state.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs">
                        <span className="font-extrabold text-slate-800 block">Critical IaC Life Cycles:</span>
                        <ul className="list-disc pl-4 space-y-1.5 text-slate-600">
                          <li><strong>Nested Stacks:</strong> Allow breaking complex configs into modular child files (e.g. database child stack, network child stack) imported under a parent coordinator.</li>
                          <li><strong>StackSets:</strong> Enable provisioning the same template simultaneously across multiple AWS Accounts and Regions with centralized deployment limits.</li>
                          <li><strong>Drift Detection:</strong> Identifies resources altered manually outside of CloudFormation commands. Helps enforce compliance and prevent code-to-infrastructure drifts.</li>
                        </ul>
                      </div>

                      <div className="flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">Deploy Stack CLI Snippet</span>
                          <button 
                            onClick={() => handleCopyCode(cfnDeployCli, 'cfn-cli')}
                            className="p-1 rounded bg-slate-105 border border-slate-200 hover:bg-slate-200 text-slate-650"
                          >
                            {copiedNoteId === 'cfn-cli' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <pre className="acad-terminal text-[9.5px] leading-relaxed overflow-x-auto h-40">
                          {cfnDeployCli}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* SSM AUTOMATION WORKSHEET */}
                {selectedNote === 'ssm_automation' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Runbooks &amp; Orchestration</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Systems Manager Automation</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('cfn_ssm')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5" /> Go to IaC Simulator
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 2 of 5</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      SSM Automation coordinates administrative tasks (like server diagnostics, volume expansion, or custom OS updates) using JSON/YAML execution documents. Runbooks execute tasks step-by-step with safety thresholds and approval requirements.
                    </p>

                    <div className="acad-takeaway-box">
                      <strong>💡 Event-Driven Remediation:</strong> You can configure AWS Config or Amazon EventBridge to trigger SSM Automation runbooks automatically when security rules fail (for example, to automatically close open SSH security ports).
                    </div>
                  </div>
                )}

                {/* SSM SESSION MANAGER WORKSHEET */}
                {selectedNote === 'session_manager' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">SSH-less Access Control</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">SSM Session Manager Audit Logs</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('fleet')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5" /> Go to SSM Fleet
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 3 of 5</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      SSM Session Manager provides secure, auditable, and credentials-less access to EC2 instances without opening inbound port 22 or managing bastion hosts. All shell commands are logged to Amazon S3 or CloudWatch logs.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs text-slate-600">
                        <span className="font-extrabold text-slate-800 block">Security Features:</span>
                        <ul className="list-disc pl-4 space-y-1.5">
                          <li><strong>Port Forwarding:</strong> Port forwarding lets you tunnel database ports (e.g. MySQL port 3306) securely from a private VPC back to your local client device.</li>
                          <li><strong>KMS Encryption:</strong> Encrypts session payloads locally before they are transmitted, preventing network interception.</li>
                          <li><strong>IAM Policy Enforcement:</strong> Control which users can start sessions on which EC2 tags with strict IAM policies.</li>
                        </ul>
                      </div>

                      <div className="flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">SSM Start-Session CLI Command</span>
                          <button 
                            onClick={() => handleCopyCode(ssmStartSessionCli, 'ssm-cli')}
                            className="p-1 rounded bg-slate-105 border border-slate-200 hover:bg-slate-200 text-slate-650"
                          >
                            {copiedNoteId === 'ssm-cli' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <pre className="acad-terminal text-[9.5px] leading-relaxed overflow-x-auto h-40">
                          {ssmStartSessionCli}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* SSM PATCH & MW WORKSHEET */}
                {selectedNote === 'patch_manager' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Fleet Compliance</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">SSM Patch Manager &amp; Maintenance Windows</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('fleet')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5" /> Go to SSM Fleet
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 4 of 5</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      SSM Patch Manager automates the process of scanning and installing security patches on your OS fleet. It evaluates target nodes against custom **Patch Baselines** containing rules for auto-approving patches within specific days of release.
                    </p>

                    <div className="acad-takeaway-box">
                      <strong>⚠️ Maintenance Windows:</strong> To prevent performance degradation during patch installations, associate Patch Manager execution scripts with SSM Maintenance Windows. This schedules patching tasks only within designated hours (e.g. Sundays between 02:00 and 04:00).
                    </div>
                  </div>
                )}

                {/* TRUSTED ADVISOR WORKSHEET */}
                {selectedNote === 'scheduler_advisor' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Resource Optimization</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">AWS Trusted Advisor &amp; Instance Scheduler</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('finops')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5" /> Go to FinOps
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 5 of 5</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      AWS Trusted Advisor evaluates your entire account infrastructure against AWS best practices across five categories: Cost Optimization, Security, Fault Tolerance, Performance, and Service Limits.
                    </p>

                    <div className="acad-takeaway-box">
                      <strong>💡 AWS Instance Scheduler:</strong> A script-driven solution that automates starting and stopping EC2/RDS instances based on custom business schedules (for example, shutting down development instances at 18:00 on weekdays and starting them at 08:00, saving up to 70% of compute costs).
                    </div>
                  </div>
                )}

                {/* SES & PINPOINT WORKSHEET */}
                {selectedNote === 'ses_pinpoint' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Email &amp; Messaging</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Amazon SES &amp; Pinpoint Feedback Loops</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('hybrid_batch')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5" /> Go to App Channels
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 1 of 5</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Amazon SES provides highly scalable SMTP email delivery. Amazon Pinpoint coordinates targeting campaigns, dividing users into segments, and tracking engagement metrics (like open rates).
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs text-slate-600">
                        <span className="font-extrabold text-slate-800 block">Deliverability Architecture:</span>
                        <ul className="list-disc pl-4 space-y-1.5">
                          <li><strong>Domain Verification:</strong> Set up SPF, DKIM, and DMARC DNS records to verify sender identity and prevent spoofing.</li>
                          <li><strong>Feedback Loop:</strong> Triggers notifications to SQS queues / SNS topics when an email bounces or a recipient files a spam complaint.</li>
                          <li><strong>Suppression Lists:</strong> Automatically blocks sending emails to addresses that recently bounced, protecting your sender score.</li>
                        </ul>
                      </div>

                      <div className="flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">Verify Domain SES CLI Command</span>
                          <button 
                            onClick={() => handleCopyCode(sesVerifyDomainCli, 'ses-cli')}
                            className="p-1 rounded bg-slate-105 border border-slate-200 hover:bg-slate-200 text-slate-650"
                          >
                            {copiedNoteId === 'ses-cli' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <pre className="acad-terminal text-[9.5px] leading-relaxed overflow-x-auto h-40">
                          {sesVerifyDomainCli}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* BATCH & OUTPOSTS WORKSHEET */}
                {selectedNote === 'outposts_batch' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Hybrid &amp; Batch Computing</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">AWS Batch &amp; AWS Outposts Orchestration</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('hybrid_batch')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5" /> Go to App Channels
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 2 of 5</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      AWS Batch plans and executes batch container workloads across Spot or On-Demand EC2 clusters. AWS Outposts extends native AWS services directly to your on-premises data centers for low-latency, hybrid execution requirements.
                    </p>

                    <div className="acad-takeaway-box font-sans">
                      <strong>💡 Local Gateway Routing:</strong> AWS Outposts uses a Local Gateway (LGW) routing table to bridge on-premises local area networks with your virtual VPC networks in the cloud.
                    </div>
                  </div>
                )}

                {/* APPFLOW & AMPLIFY WORKSHEET */}
                {selectedNote === 'appflow_amplify' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">App Integrations</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Amazon AppFlow &amp; AWS Amplify Pipelines</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('hybrid_batch')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5" /> Go to App Channels
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 3 of 5</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Amazon AppFlow securely connects SaaS applications (like Salesforce or Slack) to AWS storage or database resources without writing custom code. AWS Amplify accelerates building web and mobile apps by automating serverless database and auth integrations with a built-in CI/CD hosting pipeline.
                    </p>
                  </div>
                )}

                {/* SAGEMAKER WORKSHEET */}
                {selectedNote === 'sagemaker_workspace' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Machine Learning</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Amazon SageMaker Model Endpoints</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('ml_analytics')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5" /> Go to ML Sandbox
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 1 of 5</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Amazon SageMaker manages model training pipelines, hosting endpoints, and shadow deployments. Shadow deployments split live traffic (e.g. 90/10) to audit new models without affecting production responses.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs text-slate-600">
                        <span className="font-extrabold text-slate-800 block">ML Endpoint Management:</span>
                        <ul className="list-disc pl-4 space-y-1.5">
                          <li><strong>Shadow Deployments:</strong> Test models with live traffic in parallel with your current model without affecting client responses.</li>
                          <li><strong>Model Registry:</strong> Version control models and automate review and approval gates.</li>
                        </ul>
                      </div>

                      <div className="flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">Invoke SageMaker Endpoint CLI</span>
                          <button 
                            onClick={() => handleCopyCode(sagemakerInferenceCli, 'sm-cli')}
                            className="p-1 rounded bg-slate-105 border border-slate-200 hover:bg-slate-200 text-slate-650"
                          >
                            {copiedNoteId === 'sm-cli' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <pre className="acad-terminal text-[9.5px] leading-relaxed overflow-x-auto h-40">
                          {sagemakerInferenceCli}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* REKOGNITION & TEXTRACT WORKSHEET */}
                {selectedNote === 'vision_text_ocr' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">AI Vision &amp; OCR</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Rekognition &amp; Textract Form Extraction</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('ml_analytics')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5" /> Go to ML Sandbox
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 2 of 5</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Amazon Rekognition provides out-of-the-box computer vision models for identifying objects, text, and facial features in images. Amazon Textract uses OCR models to extract text from tabular documents and forms.
                    </p>

                    <div className="acad-takeaway-box">
                      <strong>💡 Document Extraction:</strong> Textract uses layout mapping models to maintain key-value context. This lets you extract structured data from forms (like invoice fields) without needing manual coordinate mapping templates.
                    </div>
                  </div>
                )}

                {/* POLLY, LEX & TRANSLATE WORKSHEET */}
                {selectedNote === 'lex_polly_translate' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">Conversational AI</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Amazon Polly, Lex Intent Slots &amp; Translate</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('ml_analytics')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5" /> Go to ML Sandbox
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 3 of 5</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Amazon Polly converts text into lifelike synthetic speech. Amazon Lex provides conversational bot intent and slots processing, and Amazon Translate handles translation across multiple languages.
                    </p>
                  </div>
                )}

                {/* COST EXPLORER WORKSHEET */}
                {selectedNote === 'cost_explorer' && (
                  <div className="acad-detail-card space-y-6 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">FinOps &amp; Budgets</span>
                        <h3 className="text-xl font-black text-slate-900 mt-2 font-display">AWS Cost Explorer Allocation Tags</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('finops')}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5" /> Go to FinOps
                        </button>
                        <span className="text-xs font-bold text-slate-400 font-mono">Concept 4 of 5</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      AWS Cost Explorer provides dashboards and APIs to analyze historical spending and forecast future costs. Using Cost Allocation Tags lets you group and filter unblended costs by project or environment (e.g. `Env: Production`).
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs text-slate-600">
                        <span className="font-extrabold text-slate-800 block">Cost Control Features:</span>
                        <ul className="list-disc pl-4 space-y-1.5">
                          <li><strong>Anomaly Detection:</strong> Uses ML models to monitor cost trends and alert you to unexpected cost anomalies (like recursive Lambda execution loops).</li>
                          <li><strong>Savings Plans:</strong> Calculate commit-based discounts (e.g. EC2/Compute Savings Plans) based on historical compute usage profiles.</li>
                        </ul>
                      </div>

                      <div className="flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">Cost Query CE Command</span>
                          <button 
                            onClick={() => handleCopyCode(costExplorerQueryCli, 'ce-cli')}
                            className="p-1 rounded bg-slate-105 border border-slate-200 hover:bg-slate-200 text-slate-650"
                          >
                            {copiedNoteId === 'ce-cli' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <pre className="acad-terminal text-[9.5px] leading-relaxed overflow-x-auto h-40">
                          {costExplorerQueryCli}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: IAC & AUTOMATION SIMULATOR                                         */}
        {/* ========================================================================= */}
        {activeTab === 'cfn_ssm' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
            <div className="lg:col-span-4 space-y-4">
              <div className="ops-card">
                <span className="ops-sec">1. Stack parameters</span>
                <div className="space-y-3 text-xs mb-4">
                  <div>
                    <label className="block text-slate-550 mb-1 font-bold">Select Stack Template</label>
                    <select 
                      value={cfnTemplate}
                      onChange={(e) => setCfnTemplate(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-slate-800 outline-none"
                    >
                      <option value="web">Web Application Stack (ALB + EC2)</option>
                      <option value="database">Database Stack (Primary + Replica)</option>
                      <option value="nested">Nested Stack (Parent Coordinator)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <input 
                      type="checkbox" 
                      id="rollback-chk"
                      checked={rollbackOnError}
                      onChange={(e) => setRollbackOnError(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <label htmlFor="rollback-chk" className="cursor-pointer font-semibold text-slate-700">Trigger Rollback Failure</label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={handleCfnDeploy}
                    disabled={cfnState === 'deploying'}
                    className="ops-btn ops-primary"
                  >
                    <PlayCircle className="w-4 h-4" /> Deploy Stack
                  </button>
                  <button 
                    onClick={() => { setCfnState('idle'); setCfnLogs([]); setDrifted(false); setDriftDetected(false); }}
                    className="ops-btn"
                  >
                    <RotateCcw className="w-4 h-4" /> Reset
                  </button>
                </div>
              </div>

              <div className="ops-card">
                <span className="ops-sec">2. Drift Detection HUD</span>
                <p className="text-xs text-slate-500 leading-normal mb-3">
                  Simulate manual infrastructure edits and execute drift scans to evaluate config consistency.
                </p>
                <div className="space-y-2.5">
                  <button 
                    onClick={handleCfnModifyOutofBand}
                    disabled={cfnState !== 'complete'}
                    className="ops-btn w-full justify-center"
                  >
                    Modify port 22 out-of-band
                  </button>
                  <button 
                    onClick={handleCfnDetectDrift}
                    disabled={cfnState !== 'complete'}
                    className="ops-btn w-full justify-center"
                  >
                    Detect Stack Drift
                  </button>
                  <button 
                    onClick={handleSsmRemediation}
                    disabled={!driftDetected || ssmRemediating}
                    className="ops-btn w-full justify-center ops-primary"
                  >
                    {ssmRemediating ? 'Remediating...' : 'Run Automated Remediation'}
                  </button>
                </div>
              </div>
            </div>

            {/* Visual Log Output */}
            <div className="lg:col-span-8 space-y-4">
              <div className="ops-card">
                <span className="ops-sec">CloudFormation Event logs</span>
                <div className="ops-log-terminal h-64">
                  {cfnLogs.map((log, idx) => {
                    let styleClass = 'ops-log-row-info';
                    if (log.includes('[ERROR]') || log.includes('[ROLLBACK]') || log.includes('DRIFTED')) styleClass = 'ops-log-row-error';
                    if (log.includes('[SUCCESS]') || log.includes('[COMPLETED]') || log.includes('IN_SYNC')) styleClass = 'ops-log-row-success';
                    if (log.includes('[out-of-band]')) styleClass = 'ops-log-row-warn';
                    return <p key={idx} className={styleClass}>{log}</p>;
                  })}
                  {cfnLogs.length === 0 && <p className="text-slate-400 italic">No events. Click "Deploy Stack" to begin...</p>}
                </div>
              </div>

              {/* Dynamic SVG status indicator */}
              <div className="ops-card flex flex-col items-center">
                <span className="ops-sec align-self-start">IaC Infrastructure Topology Diagram</span>
                <svg width="400" height="120" className="mt-2">
                  <g transform="translate(10, 30)">
                    {/* VPC Block */}
                    <rect width="380" height="80" rx="8" fill="none" stroke={driftDetected ? "#ef4444" : "#cbd5e1"} strokeWidth="2" strokeDasharray={driftDetected ? "5,3" : "none"} />
                    <text x="12" y="16" fontSize="9" fontWeight="bold" fill="#64748b" fontFamily="monospace">VPC (10.0.0.0/16)</text>
                    
                    {/* Subnet resource */}
                    <g transform="translate(30, 25)">
                      <rect width="100" height="40" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                      <text x="50" y="24" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1e3a8a">Public Subnet</text>
                    </g>

                    {/* Security Group resource */}
                    <g transform="translate(160, 25)">
                      <rect width="100" height="40" rx="6" fill={driftDetected ? "#fef2f2" : "#f0fdf4"} stroke={driftDetected ? "#ef4444" : "#10b981"} strokeWidth="1.5" />
                      <text x="50" y="20" textAnchor="middle" fontSize="9" fontWeight="bold" fill={driftDetected ? "#991b1b" : "#064e3b"}>Security Group</text>
                      <text x="50" y="32" textAnchor="middle" fontSize="7.5" fill={driftDetected ? "#ef4444" : "#059669"} fontWeight="bold" fontFamily="monospace">
                        {driftDetected ? '⚠️ DRIFTED' : 'In-Sync'}
                      </text>
                    </g>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SSM FLEET & COMPLIANCE                                             */}
        {/* ========================================================================= */}
        {activeTab === 'fleet' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
            <div className="lg:col-span-5 space-y-4">
              <div className="ops-card">
                <span className="ops-sec">1. SSM Fleet Inventory</span>
                <div className="overflow-x-auto">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>OS Type</th>
                        <th>SSM Status</th>
                        <th>Patch Compliance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fleet.map((inst) => (
                        <tr 
                          key={inst.id}
                          onClick={() => inst.ssmAgent === 'Online' && setSelectedInstanceId(inst.id)}
                          className={`cursor-pointer transition-colors ${selectedInstanceId === inst.id ? 'bg-sky-50' : 'hover:bg-slate-50'}`}
                        >
                          <td className="font-bold">{inst.id}</td>
                          <td>{inst.os}</td>
                          <td>
                            <span className={`ops-status-badge ${inst.ssmAgent === 'Online' ? 'ops-sb-ok' : 'ops-sb-error'}`}>
                              {inst.ssmAgent}
                            </span>
                          </td>
                          <td>
                            <span className={`ops-status-badge ${inst.patchCompliance === 'Compliant' ? 'ops-sb-ok' : inst.patchCompliance === 'Missing Patches' ? 'ops-sb-error' : 'ops-sb-warn'}`}>
                              {inst.patchCompliance}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex gap-2.5 mt-4">
                  <button 
                    onClick={() => handleOpenSession(selectedInstanceId)}
                    disabled={fleet.find(x => x.id === selectedInstanceId)?.ssmAgent === 'Offline'}
                    className="ops-btn ops-primary"
                  >
                    <Terminal className="w-4 h-4" /> Connect Session
                  </button>
                  <button onClick={handlePatchScan} className="ops-btn">Scan Fleet</button>
                  <button onClick={handlePatchInstall} className="ops-btn">Install Patches</button>
                </div>
              </div>

              {/* Maintenance window control */}
              <div className="ops-card">
                <span className="ops-sec">2. Scheduled Maintenance Window</span>
                <p className="text-xs text-slate-550 leading-normal mb-3">
                  Execute SSM RunCommand patch operations within a defined cron schedule.
                </p>
                <div className="flex gap-3 items-center">
                  <button 
                    onClick={handleTriggerMaintWindow}
                    disabled={maintWindowActive}
                    className="ops-btn"
                  >
                    Trigger window-0a1b2c
                  </button>
                  {maintWindowActive && (
                    <span className="text-xs text-emerald-600 font-bold animate-pulse flex items-center gap-1">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Window Active...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Session Terminal and Command logs */}
            <div className="lg:col-span-7 space-y-4">
              {ssmTerminalOpen && (
                <div className="ops-card">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                      SSM Shell: {selectedInstanceId}
                    </span>
                    <button 
                      onClick={() => setSsmTerminalOpen(false)}
                      className="text-[10px] font-bold text-rose-600 hover:underline"
                    >
                      Close Session
                    </button>
                  </div>
                  
                  <div className="ops-shell">
                    <div className="h-44 overflow-y-auto mb-2 font-mono text-[10.5px]">
                      {ssmTerminalLogs.map((log, idx) => (
                        <div key={idx} className="ops-shell-line">{log}</div>
                      ))}
                    </div>
                    
                    <form onSubmit={handleTerminalSubmit} className="flex items-center border-t border-slate-800 pt-2">
                      <span className="text-emerald-500 font-mono mr-1.5">$</span>
                      <input 
                        type="text"
                        value={ssmInput}
                        onChange={(e) => setSsmInput(e.target.value)}
                        placeholder="Type whoami, aws --version, curl http://169.254.169.254/latest/meta-data/, or clear"
                        className="ops-shell-input"
                        autoFocus
                      />
                    </form>
                  </div>
                </div>
              )}

              <div className="ops-card">
                <span className="ops-sec">SSM RunCommand Patch Execution Logs</span>
                <div className="ops-log-terminal h-44">
                  {patchLogs.map((log, idx) => {
                    let styleClass = 'ops-log-row-info';
                    if (log.includes('[FAILED]')) styleClass = 'ops-log-row-error';
                    if (log.includes('[SUCCESS]') || log.includes('[InstallResult]')) styleClass = 'ops-log-row-success';
                    return <p key={idx} className={styleClass}>{log}</p>;
                  })}
                  {patchLogs.length === 0 && <p className="text-slate-400 italic">No patches executed yet. Click "Scan Fleet" or "Install Patches" above...</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: APP CHANNELS & HYBRID SIMULATOR                                    */}
        {/* ========================================================================= */}
        {activeTab === 'hybrid_batch' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
            <div className="lg:col-span-4 space-y-4">
              <div className="ops-card">
                <span className="ops-sec">1. AWS Batch Job Dispatcher</span>
                <div className="space-y-3 text-xs mb-4">
                  <div>
                    <label className="block text-slate-500 mb-1">Job Definition Name</label>
                    <input 
                      type="text" 
                      value={batchJobName}
                      onChange={(e) => setBatchJobName(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 mb-1">Compute Environment Target</label>
                    <select 
                      value={batchEnv}
                      onChange={(e) => setBatchEnv(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-slate-800 outline-none"
                    >
                      <option value="AWS Outposts (On-Prem)">AWS Outposts (On-Premises Low Latency)</option>
                      <option value="Spot Instance Fleet">Spot Instance Fleet (Cloud Cost Saving)</option>
                      <option value="On-Demand Compute">On-Demand Compute (Reliable High-Perf)</option>
                    </select>
                  </div>
                </div>

                <button onClick={handleAddBatchJob} className="ops-btn ops-primary w-full justify-center">
                  Submit Batch Job
                </button>
              </div>

              {/* SES & Pinpoint campaigns builder */}
              <div className="ops-card">
                <span className="ops-sec">2. Email Delivery campaign</span>
                <div className="space-y-3 text-xs mb-4">
                  <div>
                    <label className="block text-slate-500 mb-1">Recipient email address</label>
                    <input 
                      type="email" 
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 font-mono text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={handleSendSesEmail} className="ops-btn ops-primary">Send Email</button>
                  <button onClick={handleInjectHardBounce} className="ops-btn ops-danger">Inject Hard Bounce</button>
                </div>
              </div>
            </div>

            {/* Batch Jobs Monitor and SES Logs */}
            <div className="lg:col-span-8 space-y-4">
              <div className="ops-card">
                <span className="ops-sec">Batch Jobs Queue monitor</span>
                <div className="overflow-x-auto">
                  <table className="ops-table">
                    <thead>
                      <tr>
                        <th>Job ID</th>
                        <th>Job Name</th>
                        <th>Compute Env</th>
                        <th>Status</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {batchJobs.map((job) => (
                        <tr key={job.id}>
                          <td className="font-mono font-bold">{job.id}</td>
                          <td>{job.name}</td>
                          <td>{job.env}</td>
                          <td>
                            <span className={`ops-status-badge ${
                              job.status === 'SUCCEEDED' ? 'ops-sb-ok' : job.status === 'FAILED' ? 'ops-sb-error' : 'ops-sb-warn'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="font-mono">{job.duration}s</td>
                        </tr>
                      ))}
                      {batchJobs.length === 0 && (
                        <tr>
                          <td colSpan={5} className="text-center text-slate-400 italic py-4">No active batch jobs submitted.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="ops-card">
                <span className="ops-sec">SES &amp; Pinpoint Feedback loop logs</span>
                <div className="ops-log-terminal h-44">
                  {sesLogs.map((log, idx) => {
                    let styleClass = 'ops-log-row-info';
                    if (log.includes('hard bounce') || log.includes('Suppressed')) styleClass = 'ops-log-row-error';
                    if (log.includes('[SES-SUCCESS]')) styleClass = 'ops-log-row-success';
                    return <p key={idx} className={styleClass}>{log}</p>;
                  })}
                  {sesLogs.length === 0 && <p className="text-slate-400 italic">No email events logged. Send an email campaign above...</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: ML & AI API SIMULATOR                                              */}
        {/* ========================================================================= */}
        {activeTab === 'ml_analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
            <div className="lg:col-span-4 space-y-4">
              <div className="ops-card">
                <span className="ops-sec">1. SageMaker Model configuration</span>
                <div className="space-y-3 text-xs mb-4">
                  <div>
                    <label className="block text-slate-505 mb-1 font-bold">Select Active Model</label>
                    <select 
                      value={mlModel}
                      onChange={(e) => setMlModel(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-slate-800 outline-none font-semibold"
                    >
                      <option value="churn">Customer Churn (XGBoost)</option>
                      <option value="resnet">Image Label Classifier (ResNet-50)</option>
                      <option value="fraud">Financial Fraud regression</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-505 mb-1 font-bold">Endpoint Strategy</label>
                    <select 
                      value={deployType}
                      onChange={(e) => setDeployType(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-slate-800 outline-none font-semibold"
                    >
                      <option value="standard">Standard Production Endpoint</option>
                      <option value="shadow">Shadow Deployment (90/10 split audit)</option>
                    </select>
                  </div>
                </div>

                <button 
                  onClick={handleSendInference}
                  disabled={mlIsLoading}
                  className="ops-btn ops-primary w-full justify-center"
                >
                  {mlIsLoading ? 'Invoking Model...' : 'Send Inference Payload'}
                </button>
              </div>

              {/* Vision and Speech settings */}
              <div className="ops-card">
                <span className="ops-sec">2. Computer Vision &amp; OCR</span>
                <div className="space-y-3 text-xs mb-3">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold">Select Rekognition Image</label>
                    <select 
                      value={rekImage}
                      onChange={(e) => setRekImage(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-slate-800 outline-none"
                    >
                      <option value="server">Mock Image: Data Center server rack</option>
                      <option value="desk">Mock Image: Office Workspace desk</option>
                      <option value="drone">Mock Image: Drones security portal</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="ops-card">
                <span className="ops-sec">3. Polly &amp; Lex Speech Bot</span>
                <div className="space-y-3 text-xs mb-3">
                  <div>
                    <label className="block text-slate-500 mb-1">Synthesize Message</label>
                    <input 
                      type="text" 
                      value={pollyText}
                      onChange={(e) => setPollyText(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-slate-800"
                    />
                  </div>
                  <button onClick={handleSynthesizePolly} className="ops-btn ops-primary w-full justify-center">
                    Trigger Lex Intent Slots
                  </button>
                </div>
              </div>
            </div>

            {/* Inference and OCR output widgets */}
            <div className="lg:col-span-8 space-y-4">
              <div className="ops-card">
                <span className="ops-sec">SageMaker Endpoint execution logs</span>
                <div className="ops-log-terminal h-44">
                  {inferenceLogs.map((log, idx) => {
                    let styleClass = 'ops-log-row-info';
                    if (log.includes('prediction') || log.includes('shadow payload')) styleClass = 'ops-log-row-success';
                    if (log.includes('[ShadowDeploy]')) styleClass = 'ops-log-row-warn';
                    return <p key={idx} className={styleClass}>{log}</p>;
                  })}
                  {inferenceLogs.length === 0 && <p className="text-slate-400 italic">No inference requests processed yet. Click "Send Inference Payload"...</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="ops-card">
                  <span className="ops-sec">Rekognition Image Labels confidence</span>
                  <div className="space-y-2 mt-2">
                    {parsedLabels.map((lbl, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-100 pb-1.5">
                        <span className="font-semibold text-slate-700">{lbl.label}</span>
                        <span className="font-mono bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded font-bold">{lbl.conf.toFixed(1)}% Match</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="ops-card">
                  <span className="ops-sec">Textract Key-Value parsed data grid</span>
                  <div className="space-y-2 mt-2">
                    {textractText.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-100 pb-1.5">
                        <span className="font-semibold text-slate-500">{item.key}</span>
                        <span className="font-mono text-slate-800 font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {lexSlots.length > 0 && (
                <div className="ops-card">
                  <span className="ops-sec">Lex Bot Intent Slots values</span>
                  <div className="grid grid-cols-3 gap-3 mt-2 text-xs">
                    {lexSlots.map((s, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-2.5">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">{s.slot}</span>
                        <span className="font-mono font-bold text-slate-850">{s.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: COST & FINOPS SIMULATOR                                            */}
        {/* ========================================================================= */}
        {activeTab === 'finops' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
            <div className="lg:col-span-4 space-y-4">
              <div className="ops-card">
                <span className="ops-sec">1. Cost allocation grouping</span>
                <div className="space-y-3 text-xs mb-4">
                  <div>
                    <label className="block text-slate-500 mb-1 font-bold font-semibold">Group Cost Explorer data by</label>
                    <select 
                      value={costGroup}
                      onChange={(e) => setCostGroup(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded p-1.5 text-slate-800 outline-none"
                    >
                      <option value="service">AWS Service (EC2, S3, RDS)</option>
                      <option value="account">Linked AWS Member Account</option>
                      <option value="tag">Allocation Cost tag (Env: Production)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => handleSimulateAnomaly('lambda')} 
                    className="ops-btn ops-danger w-full justify-center"
                  >
                    Spike Lambda loops anomaly
                  </button>
                  <button 
                    onClick={() => handleSimulateAnomaly('ebs')} 
                    className="ops-btn ops-danger w-full justify-center"
                  >
                    Spike unattached EBS volume leak
                  </button>
                </div>
              </div>

              {/* Savings plans calculator */}
              <div className="ops-card">
                <span className="ops-sec">2. Savings Plans commit calculator</span>
                <div className="space-y-3 text-xs mb-4">
                  <div>
                    <label className="block text-slate-500 mb-1">Hourly baseline commit ($/hour): {savingsPlanBaseline}</label>
                    <input 
                      type="range" 
                      min="5" 
                      max="100"
                      value={savingsPlanBaseline}
                      onChange={(e) => setSavingsPlanBaseline(parseInt(e.target.value))}
                      className="w-full accent-indigo-600 cursor-ew-resize"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono space-y-1 text-slate-600">
                  <p>Standard unblended cost: <span className="font-bold text-slate-800">${savings.unblended}</span></p>
                  <p>Savings plans cost: <span className="font-bold text-indigo-700">${savings.blended}</span></p>
                  <p className="border-t border-slate-200 pt-1.5 text-emerald-600 font-bold">Estimated savings: ${savings.savings}/month</p>
                </div>
              </div>
            </div>

            {/* Cost Graph and Trusted Advisor check results */}
            <div className="lg:col-span-8 space-y-4">
              <div className="ops-card">
                <span className="ops-sec">Monthly Cost Explorer analytics ($ USD)</span>
                <div className="mt-4 flex flex-col items-center">
                  <svg width="100%" height="160" className="bg-slate-50 border border-slate-200 rounded-xl">
                    <line x1="50" y1="120" x2="450" y2="120" stroke="#cbd5e1" strokeWidth="1" />
                    
                    {/* Normal base costs bar chart */}
                    <rect x="80" y="80" width="30" height="40" fill="#3b82f6" rx="2" />
                    <text x="95" y="132" textAnchor="middle" fontSize="8.5" fill="#64748b" fontFamily="monospace">March</text>
                    <text x="95" y="72" textAnchor="middle" fontSize="8.5" fill="#475569" fontWeight="bold" fontFamily="monospace">$420</text>

                    <rect x="180" y="70" width="30" height="50" fill="#3b82f6" rx="2" />
                    <text x="195" y="132" textAnchor="middle" fontSize="8.5" fill="#64748b" fontFamily="monospace">April</text>
                    <text x="195" y="62" textAnchor="middle" fontSize="8.5" fill="#475569" fontWeight="bold" fontFamily="monospace">$500</text>

                    {/* Cost anomaly spike bar chart */}
                    <rect 
                      x="280" 
                      y={anomalySpike === 'lambda' ? "20" : anomalySpike === 'ebs' ? "50" : "65"} 
                      width="30" 
                      height={anomalySpike === 'lambda' ? "100" : anomalySpike === 'ebs' ? "70" : "55"} 
                      fill={anomalySpike !== 'none' ? "#ef4444" : "#3b82f6"} 
                      rx="2" 
                    />
                    <text x="295" y="132" textAnchor="middle" fontSize="8.5" fill="#64748b" fontFamily="monospace">May (Current)</text>
                    <text x="295" y={anomalySpike === 'lambda' ? "12" : anomalySpike === 'ebs' ? "42" : "57"} textAnchor="middle" fontSize="8.5" fill={anomalySpike !== 'none' ? "#b91c1c" : "#475569"} fontWeight="bold" fontFamily="monospace">
                      {anomalySpike === 'lambda' ? '$1,850' : anomalySpike === 'ebs' ? '$850' : '$550'}
                    </text>
                  </svg>
                  
                  {anomalySpike !== 'none' && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl p-3.5 mt-3 flex items-center gap-2.5 w-full">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <div>
                        <span className="font-extrabold text-[12px] block">Cost Anomaly Warning Alert triggered!</span>
                        <span className="opacity-90 leading-relaxed text-[11px] block mt-0.5">
                          {anomalySpike === 'lambda' 
                            ? 'Warning: Unexpected daily spike of 320% in AWS Lambda execution costs. Possible recursive trigger looping detected.'
                            : 'Warning: Gradual unallocated cost drift detected in unattached Elastic Block Store volumes (EBS leaks).'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Trusted Advisor Scans */}
              <div className="ops-card">
                <div className="flex justify-between items-center mb-3">
                  <span className="ops-sec m-0">3. AWS Trusted Advisor dashboard recommendations</span>
                  <button 
                    onClick={handleRunAdvisorScan}
                    disabled={advisorState === 'scanning'}
                    className="ops-btn ops-primary"
                  >
                    {advisorState === 'scanning' ? 'Scanning account...' : 'Scan account'}
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {advisorResults.map((res, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-450 block font-bold uppercase">{res.category}</span>
                        <span className="font-semibold text-slate-800">{res.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {res.savings && <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150">Save {res.savings}</span>}
                        <span className={`ops-status-badge ${res.status === 'ok' ? 'ops-sb-ok' : res.status === 'warn' ? 'ops-sb-warn' : 'ops-sb-error'}`}>
                          {res.status === 'ok' ? 'nominal' : res.status === 'warn' ? 'warning' : 'action required'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {advisorResults.length === 0 && (
                    <p className="text-slate-400 italic text-center py-4">Click "Scan account" to trigger Advisor best-practice reviews.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
