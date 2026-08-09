import React, { useState, useEffect } from 'react';
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
import OperationsAndMLComparativeView from '../../components/visualizers/OperationsAndMLComparativeView';
import UniqueOperationsAndMLFeatures from '../../components/visualizers/UniqueOperationsAndMLFeatures';

type TabType = 'notebook' | 'cfn_ssm' | 'fleet' | 'hybrid_batch' | 'ml_analytics' | 'finops' | 'unique';

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

interface OperationsAndMLVisualizerProps {
  provider?: 'aws' | 'azure' | 'gcp' | 'comparative';
  setProvider?: (provider: 'aws' | 'azure' | 'gcp' | 'comparative') => void;
}

export default function OperationsAndMLVisualizer({ provider = 'aws', setProvider }: OperationsAndMLVisualizerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');

  const isComparative = provider === 'comparative';

  const t = (text: string) => {
    if (provider === 'azure') {
      return text
        .replace(/Amazon Bedrock/gi, 'Azure OpenAI Service')
        .replace(/Amazon SageMaker/gi, 'Azure Machine Learning Studio')
        .replace(/SageMaker/g, 'Azure ML')
        .replace(/AWS Systems Manager/gi, 'Azure Automation & Arc')
        .replace(/SSM/g, 'Azure Arc')
        .replace(/CloudWatch/g, 'Azure Monitor');
    }
    if (provider === 'gcp') {
      return text
        .replace(/Amazon Bedrock/gi, 'Google Vertex AI Model Garden (Gemini)')
        .replace(/Amazon SageMaker/gi, 'Google Vertex AI')
        .replace(/SageMaker/g, 'Vertex AI')
        .replace(/AWS Systems Manager/gi, 'Google OS Config & Agent')
        .replace(/SSM/g, 'OS Config')
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
        if (node.type === 'pre' || node.type === 'code' || (node.props && (node.props.className === 'ops-terminal' || node.props.className === 'ops-code-card'))) {
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
    setActiveTab(tab === 'sysmgr' ? 'fleet' : tab === 'cicd' ? 'cfn_ssm' : tab === 'architect' ? 'notebook' : tab);
  };

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
        .ops-container {
          font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
          color: var(--ops-text);
          background-color: var(--ops-bg);
          padding: 20px;
          border-radius: 16px;
          transition: all 0.25s ease;

          --ops-bg: #f8fafc;
          --ops-text: #1e293b;
          --ops-text-title: #0f172a;
          --ops-text-muted: #475569;
          
          --ops-card-bg: rgba(255, 255, 255, 0.95);
          --ops-card-border: rgba(226, 232, 240, 0.9);
          --ops-card-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.05);
          
          --ops-tab-bg: rgba(255, 255, 255, 0.85);
          --ops-tab-border: rgba(226, 232, 240, 0.85);
          --ops-tab-text: #475569;
          --ops-tab-hover-bg: #f1f5f9;
          --ops-tab-hover-border: #cbd5e1;
          --ops-tab-hover-text: #0f172a;
          
          --ops-btn-bg: #ffffff;
          --ops-btn-border: #cbd5e1;
          --ops-btn-text: #475569;
          --ops-btn-hover-bg: #f8fafc;
          --ops-btn-hover-border: #94a3b8;
          --ops-btn-hover-text: #0f172a;

          --ops-input-bg: #ffffff;
          --ops-input-color: #1e293b;
          --ops-input-border: #cbd5e1;
          
          --ops-terminal-bg: #0f172a;
          --ops-terminal-text: #38bdf8;
          --ops-terminal-shadow: inset 0 2px 8px rgba(0,0,0,0.8);

          --ops-shell-bg: #000000;
          --ops-shell-text: #10b981;
          
          --ops-table-border: #cbd5e1;
          --ops-table-th-bg: #f8fafc;
          --ops-table-th-text: #475569;
          --ops-table-td-text: #1e293b;
          --ops-table-even-row-bg: rgba(248, 250, 252, 0.5);

          --ops-badge-ok-bg: #dcfce7;
          --ops-badge-ok-text: #15803d;
          --ops-badge-warn-bg: #fef3c7;
          --ops-badge-warn-text: #b45309;
          --ops-badge-error-bg: #fee2e2;
          --ops-badge-error-text: #b91c1c;

          /* Academy mappings styling tokens */
          --acad-dir-bg: #ffffff;
          --acad-dir-border: #cbd5e1;
          --acad-dir-header-bg: #f8fafc;
          --acad-dir-header-text: #1e293b;
          --acad-dir-folder-btn-bg: #ffffff;
          --acad-dir-folder-btn-text: #475569;
          --acad-dir-folder-hover-bg: #f1f5f9;
          --acad-dir-item-btn-bg: #ffffff;
          --acad-dir-item-text: #64748b;
          --acad-dir-item-hover-bg: #f8fafc;
          --acad-dir-item-hover-text: #0284c7;
          --acad-dir-item-active-bg: #eff6ff;
          --acad-dir-item-active-text: #0284c7;
          --acad-dir-item-active-border: #0ea5e9;

          --acad-detail-bg: #ffffff;
          --acad-detail-border: #cbd5e1;
          --acad-detail-text: #334155;
          
          --acad-hero-badge-bg: #e0f2fe;
          --acad-hero-badge-border: #bae6fd;
          --acad-hero-badge-text: #0369a1;

          --acad-takeaway-border: #0ea5e9;
          --acad-takeaway-bg: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          --acad-takeaway-text: #475569;
          
          --acad-terminal-bg: #0f172a;
          --acad-terminal-text: #cbd5e1;

          --ops-svg-stroke: #cbd5e1;
          --ops-svg-text: #64748b;

          --ops-svg-blue-bg: #eff6ff;
          --ops-svg-blue-border: #3b82f6;
          --ops-svg-blue-text: #1e3a8a;

          --ops-svg-green-bg: #f0fdf4;
          --ops-svg-green-border: #10b981;
          --ops-svg-green-text: #064e3b;

          --ops-svg-red-bg: #fef2f2;
          --ops-svg-red-border: #ef4444;
          --ops-svg-red-text: #991b1b;
        }

        /* Centralized Dark Mode Overrides */
        .dark .ops-container {
          --ops-bg: #020617;
          --ops-text: #cbd5e1;
          --ops-text-title: #ffffff;
          --ops-text-muted: #94a3b8;
          
          --ops-card-bg: rgba(15, 23, 42, 0.75);
          --ops-card-border: rgba(51, 65, 85, 0.6);
          --ops-card-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          
          --ops-tab-bg: rgba(15, 23, 42, 0.6);
          --ops-tab-border: rgba(51, 65, 85, 0.6);
          --ops-tab-text: #94a3b8;
          --ops-tab-hover-bg: rgba(30, 41, 59, 0.8);
          --ops-tab-hover-border: rgba(51, 65, 85, 0.8);
          --ops-tab-hover-text: #f8fafc;
          
          --ops-btn-bg: rgba(15, 23, 42, 0.8);
          --ops-btn-border: rgba(51, 65, 85, 0.6);
          --ops-btn-text: #cbd5e1;
          --ops-btn-hover-bg: rgba(30, 41, 59, 0.8);
          --ops-btn-hover-border: rgba(51, 65, 85, 0.8);
          --ops-btn-hover-text: #ffffff;

          --ops-input-bg: #0f172a;
          --ops-input-color: #f1f5f9;
          --ops-input-border: rgba(51, 65, 85, 0.8);
          
          --ops-terminal-bg: #020617;
          --ops-terminal-text: #38bdf8;
          --ops-terminal-shadow: inset 0 2px 8px rgba(0,0,0,0.9);

          --ops-shell-bg: #020617;
          --ops-shell-text: #10b981;
          
          --ops-table-border: rgba(51, 65, 85, 0.6);
          --ops-table-th-bg: rgba(15, 23, 42, 0.9);
          --ops-table-th-text: #ffffff;
          --ops-table-td-text: #cbd5e1;
          --ops-table-even-row-bg: rgba(15, 23, 42, 0.4);

          --ops-badge-ok-bg: rgba(16, 185, 129, 0.15);
          --ops-badge-ok-text: #4ade80;
          --ops-badge-warn-bg: rgba(245, 158, 11, 0.15);
          --ops-badge-warn-text: #fbbf24;
          --ops-badge-error-bg: rgba(239, 68, 68, 0.15);
          --ops-badge-error-text: #f87171;

          /* Academy mappings styling tokens */
          --acad-dir-bg: rgba(15, 23, 42, 0.5);
          --acad-dir-border: rgba(51, 65, 85, 0.6);
          --acad-dir-header-bg: rgba(15, 23, 42, 0.9);
          --acad-dir-header-text: #ffffff;
          --acad-dir-folder-btn-bg: rgba(15, 23, 42, 0.7);
          --acad-dir-folder-btn-text: #94a3b8;
          --acad-dir-folder-hover-bg: rgba(30, 41, 59, 0.8);
          --acad-dir-item-btn-bg: rgba(15, 23, 42, 0.5);
          --acad-dir-item-text: #94a3b8;
          --acad-dir-item-hover-bg: rgba(30, 41, 59, 0.8);
          --acad-dir-item-hover-text: #38bdf8;
          --acad-dir-item-active-bg: rgba(2, 132, 199, 0.2);
          --acad-dir-item-active-text: #38bdf8;
          --acad-dir-item-active-border: #0ea5e9;

          --acad-detail-bg: rgba(15, 23, 42, 0.75);
          --acad-detail-border: rgba(51, 65, 85, 0.6);
          --acad-detail-text: #cbd5e1;
          
          --acad-hero-badge-bg: rgba(2, 132, 199, 0.15);
          --acad-hero-badge-border: rgba(2, 132, 199, 0.3);
          --acad-hero-badge-text: #38bdf8;

          --acad-takeaway-border: rgba(51, 65, 85, 0.6);
          --acad-takeaway-bg: rgba(15, 23, 42, 0.6);
          --acad-takeaway-text: #cbd5e1;
          
          --acad-terminal-bg: #020617;
          --acad-terminal-text: #cbd5e1;

          --ops-svg-stroke: rgba(51, 65, 85, 0.6);
          --ops-svg-text: #94a3b8;

          --ops-svg-blue-bg: rgba(59, 130, 246, 0.15);
          --ops-svg-blue-border: #3b82f6;
          --ops-svg-blue-text: #60a5fa;

          --ops-svg-green-bg: rgba(16, 185, 129, 0.15);
          --ops-svg-green-border: #10b981;
          --ops-svg-green-text: #4ade80;

          --ops-svg-red-bg: rgba(239, 68, 68, 0.15);
          --ops-svg-red-border: #ef4444;
          --ops-svg-red-text: #f87171;
        }

        /* Mapping Tailwind slate utility overrides inside .ops-container */
        .ops-container .text-slate-900,
        .ops-container .text-slate-800,
        .ops-container .text-slate-850,
        .ops-container .text-slate-505 {
          color: var(--ops-text-title) !important;
        }
        .ops-container .text-slate-700,
        .ops-container .text-slate-650 {
          color: var(--ops-text) !important;
        }
        .ops-container .text-slate-600,
        .ops-container .text-slate-550,
        .ops-container .text-slate-500,
        .ops-container .text-slate-450,
        .ops-container .text-slate-400 {
          color: var(--ops-text-muted) !important;
        }

        .ops-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 18px; border-bottom: 1.5px solid var(--ops-tab-border); padding-bottom: 12px; }
        .ops-tb { padding: 6px 14px; border-radius: 10px; border: 1px solid var(--ops-tab-border); font-size: 12px; cursor: pointer; background: var(--ops-tab-bg); color: var(--ops-tab-text); transition: all 0.15s ease-in-out; outline: none; font-weight: 500; }
        .ops-tb:hover { background: var(--ops-tab-hover-bg); border-color: var(--ops-tab-hover-border); color: var(--ops-tab-hover-text); }
        .ops-tb.ops-on { background: #16a34a; color: #fff; border-color: #16a34a; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2); }
        .ops-card { border: 1px solid var(--ops-card-border); border-radius: 16px; padding: 14px 16px; background: var(--ops-card-bg); backdrop-filter: blur(10px); box-shadow: var(--ops-card-shadow); margin-bottom: 14px; color: var(--ops-text); }
        .ops-sec { font-size: 11px; font-weight: 750; color: var(--ops-text-title); text-transform: uppercase; letter-spacing: 0.05em; margin: 16px 0 8px; border-bottom: 1px solid var(--ops-card-border); padding-bottom: 4px; }
        .ops-sec:first-child { margin-top: 0; }
        .ops-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .ops-grid3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        
        .ops-btn { font-size: 11.5px; padding: 6px 14px; border-radius: 8px; border: 1px solid var(--ops-btn-border); background: var(--ops-btn-bg); color: var(--ops-btn-text); cursor: pointer; transition: all 0.15s; outline: none; display: inline-flex; align-items: center; gap: 4px; font-weight: 600; }
        .ops-btn:hover { background: var(--ops-btn-hover-bg); color: var(--ops-btn-hover-text); border-color: var(--ops-btn-hover-border); }
        .ops-btn.ops-primary { background: #16a34a; border-color: #16a34a; color: #fff; box-shadow: 0 2px 4px rgba(22, 163, 74, 0.15); }
        .ops-btn.ops-primary:hover { background: #15803d; border-color: #15803d; }
        .ops-btn.ops-danger { background: #dc2626; border-color: #dc2626; color: #fff; }
        .ops-btn.ops-danger:hover { background: #b91c1c; border-color: #b91c1c; }
        .ops-btn:disabled { background: var(--ops-tab-hover-bg); border-color: var(--ops-tab-border); color: var(--ops-text-muted); opacity: 0.5; cursor: not-allowed; }
        
        .ops-log-terminal { background: var(--ops-terminal-bg); border-radius: 12px; padding: 14px; font-family: monospace; color: var(--ops-terminal-text); font-size: 11px; line-height: 1.5; overflow-y: auto; max-height: 220px; box-shadow: var(--ops-terminal-shadow); text-align: left; }
        .ops-log-terminal p { margin: 2px 0; }
        .ops-log-row-success { color: #34d399; }
        .ops-log-row-warn { color: #f59e0b; }
        .ops-log-row-error { color: #f87171; }
        .ops-log-row-info { color: #38bdf8; }

        .ops-shell { background: var(--ops-shell-bg); border-radius: 10px; padding: 14px; font-family: monospace; color: var(--ops-shell-text); font-size: 11px; min-height: 180px; display: flex; flex-direction: column; justify-content: flex-end; text-align: left; }
        .ops-shell-line { white-space: pre-wrap; margin-bottom: 2px; }
        .ops-shell-input { background: transparent; border: none; outline: none; color: var(--ops-shell-text); font-family: monospace; flex-grow: 1; font-size: 11px; }

        .ops-table { width: 100%; border-collapse: collapse; font-size: 11.5px; }
        .ops-table th { background: var(--ops-table-th-bg); border: 1.5px solid var(--ops-table-border); padding: 8px; text-align: left; font-weight: 750; color: var(--ops-table-th-text); }
        .ops-table td { border: 1.5px solid var(--ops-table-border); padding: 8px; color: var(--ops-table-td-text); }
        .ops-table tr:nth-child(even) { background: var(--ops-table-even-row-bg); }

        .ops-status-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; font-weight: 750; text-transform: uppercase; }
        .ops-sb-ok { background: var(--ops-badge-ok-bg); color: var(--ops-badge-ok-text); }
        .ops-sb-warn { background: var(--ops-badge-warn-bg); color: var(--ops-badge-warn-text); }
        .ops-sb-error { background: var(--ops-badge-error-bg); color: var(--ops-badge-error-text); }

        .ops-row-selected { background: rgba(14, 165, 233, 0.15) !important; }
        .ops-row-hover:hover { background: var(--ops-table-even-row-bg) !important; }

        /* General form controls inside container */
        .ops-container select,
        .ops-container input:not([type="checkbox"]),
        .ops-container textarea {
          background-color: var(--ops-input-bg) !important;
          color: var(--ops-input-color) !important;
          border-color: var(--ops-input-border) !important;
        }

        /* Mappings styles */
        .acad-dir-container { background: var(--acad-dir-bg); border: 1px solid var(--acad-dir-border); border-radius: 16px; overflow: hidden; }
        .acad-dir-header { background: var(--acad-dir-header-bg); color: var(--acad-dir-header-text); padding: 12px 16px; font-weight: 800; font-size: 11px; border-bottom: 1px solid var(--acad-dir-border); text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 8px; }
        .acad-dir-folder-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: 10px 16px; background: var(--acad-dir-folder-btn-bg); border: none; border-bottom: 1px solid var(--acad-dir-border); font-size: 10.5px; font-weight: 800; color: var(--acad-dir-folder-btn-text); text-transform: uppercase; cursor: pointer; transition: all 0.2s; }
        .acad-dir-folder-btn:hover { background: var(--acad-dir-folder-hover-bg); }
        .acad-dir-subfolder { background-color: var(--ops-table-even-row-bg) !important; border-bottom-color: var(--acad-dir-border) !important; }
        .acad-dir-item-btn { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 18px; font-size: 11.5px; font-weight: 600; color: var(--acad-dir-item-text); border: none; border-left: 3px solid transparent; background: var(--acad-dir-item-btn-bg); transition: all 0.15s; text-align: left; cursor: pointer; }
        .acad-dir-item-btn:hover { background: var(--acad-dir-item-hover-bg); color: var(--acad-dir-item-hover-text); }
        .acad-dir-item-btn.acad-active { background: var(--acad-dir-item-active-bg); color: var(--acad-dir-item-active-text); border-left-color: var(--acad-dir-item-active-border); font-weight: 800; }
        .acad-detail-card { background: var(--acad-detail-bg); border: 1px solid var(--acad-detail-border); border-radius: 16px; padding: 24px; box-shadow: var(--ops-card-shadow); }
        .acad-plain-english {
        background: rgba(2, 132, 199, 0.07);
        border-left: 4px solid #0ea5e9;
        border-radius: 12px;
        padding: 16px;
        margin: 16px 0;
        font-size: 12.5px;
        line-height: 1.65;
        color: var(--da-text-title);
        border-top: 1px solid var(--da-card-border);
        border-right: 1px solid var(--da-card-border);
        border-bottom: 1px solid var(--da-card-border);
      }
      .dark .acad-plain-english {
        background: rgba(56, 189, 248, 0.12);
        border-left-color: #38bdf8;
        color: #f1f5f9;
      }
      .acad-analogy-box {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%);
        border: 1.5px solid rgba(245, 158, 11, 0.35);
        border-radius: 12px;
        padding: 16px;
        margin: 16px 0;
        font-size: 12px;
        line-height: 1.65;
        color: var(--da-text-title);
      }
      .dark .acad-analogy-box {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(217, 119, 6, 0.05) 100%);
        border-color: rgba(245, 158, 11, 0.35);
        color: #f1f5f9;
      }
      .acad-hero-badge { background: var(--acad-hero-badge-bg); border: 1px solid var(--acad-hero-badge-border); color: var(--acad-hero-badge-text); font-size: 9.5px; font-weight: 900; letter-spacing: 0.05em; text-transform: uppercase; padding: 3px 8px; border-radius: 8px; display: inline-flex; align-items: center; }
        .acad-takeaway-box { background: var(--acad-takeaway-bg); border-left: 4px solid var(--acad-takeaway-border); border-radius: 12px; padding: 16px; font-size: 11.5px; line-height: 1.6; color: var(--acad-takeaway-text); font-weight: 600; border-top: 1px solid var(--ops-card-border); border-right: 1px solid var(--ops-card-border); border-bottom: 1px solid var(--ops-card-border); }
        .acad-terminal { background: var(--acad-terminal-bg); border-radius: 12px; padding: 12px; font-family: monospace; color: var(--acad-terminal-text); font-size: 10px; overflow-x: auto; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); }
        
        .acad-copy-btn {
          padding: 4px;
          border-radius: 4px;
          background: var(--ops-btn-bg);
          border: 1px solid var(--ops-btn-border);
          color: var(--ops-btn-text);
          transition: all 0.15s;
          cursor: pointer;
        }
        .acad-copy-btn:hover {
          background: var(--ops-btn-hover-bg);
          border-color: var(--ops-btn-hover-border);
          color: var(--ops-btn-hover-text);
        }

        .ops-badge-match {
          background: #eff6ff;
          color: #0369a1;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          font-family: monospace;
        }
        .dark .ops-badge-match {
          background: rgba(2, 132, 199, 0.2);
          color: #38bdf8;
        }

        .ops-slot-card {
          background: var(--ops-table-th-bg);
          border: 1px solid var(--ops-table-border);
          border-radius: 8px;
          padding: 10px;
        }

        .ops-savings-card {
          background: var(--ops-table-th-bg);
          border: 1px solid var(--ops-table-border);
          border-radius: 8px;
          padding: 12px;
          color: var(--ops-text-muted);
        }

        .ops-alert-danger {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #991b1b;
        }
        .dark .ops-alert-danger {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }

        .ops-savings-badge {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 700;
        }
        .dark .ops-savings-badge {
          background: rgba(22, 163, 74, 0.15);
          color: #4ade80;
          border-color: rgba(22, 163, 74, 0.3);
        }

        .ops-advisor-row {
          background: var(--ops-table-th-bg);
          border: 1px solid var(--ops-table-border);
        }

        .ops-chart-svg {
          background-color: var(--ops-table-even-row-bg);
          border: 1px solid var(--ops-table-border);
        }
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
        {!isComparative && (
          <Translate>
            <div className="ops-tabs">
              <button className={`ops-tb ${activeTab === 'notebook' ? 'ops-on' : ''}`} onClick={() => setActiveTab('notebook')}>
                <BookOpen className="w-4 h-4 text-amber-500" /> 📖 1) Visual Notes &amp; Theories
              </button>
              <button className={`ops-tb ${activeTab === 'cfn_ssm' ? 'ops-on' : ''}`} onClick={() => setActiveTab('cfn_ssm')}>
                <Code className="w-4 h-4 text-sky-500" /> 🏗️ 2) IaC &amp; Runbooks
              </button>
              <button className={`ops-tb ${activeTab === 'fleet' ? 'ops-on' : ''}`} onClick={() => setActiveTab('fleet')}>
                <Server className="w-4 h-4 text-blue-500" /> 💻 3) SSM Fleet Manager
              </button>
              <button className={`ops-tb ${activeTab === 'hybrid_batch' ? 'ops-on' : ''}`} onClick={() => setActiveTab('hybrid_batch')}>
                <Mail className="w-4 h-4 text-emerald-500" /> 🌎 4) Batch &amp; App Channels
              </button>
              <button className={`ops-tb ${activeTab === 'ml_analytics' ? 'ops-on' : ''}`} onClick={() => setActiveTab('ml_analytics')}>
                <Bot className="w-4 h-4 text-purple-500" /> 🤖 5) SageMaker &amp; AI APIs
              </button>
              <button className={`ops-tb ${activeTab === 'finops' ? 'ops-on' : ''}`} onClick={() => setActiveTab('finops')}>
                <DollarSign className="w-4 h-4 text-indigo-500" /> 📊 6) Cost &amp; Trusted Advisor
              </button>
              <button className={`ops-tb ${activeTab === 'unique' ? 'ops-on' : ''}`} onClick={() => setActiveTab('unique')}>
                ✨ Unique Features
              </button>
            </div>
          </Translate>
        )}
      </div>

      <div style={{ padding: '0 16px' }}>
        {isComparative && (
          <OperationsAndMLComparativeView onNavigateToDemo={handleNavigateToDemo} />
        )}

        {!isComparative && activeTab === 'unique' && (
          <UniqueOperationsAndMLFeatures provider={provider} />
        )}

        {!isComparative && activeTab !== 'unique' && (
          <Translate>
            <>
        {/* ========================================================================= */}
        {/* TAB 1: VISUAL ARCHITECT NOTES (DEVELOPER ACADEMY)                         */}
        {/* ========================================================================= */}
        {activeTab === 'notebook' && (
        <div className="space-y-6 animate-fadeIn text-left" style={{ color: 'var(--da-text)' }}>
          
          {/* Header Hero Card */}
          <div className="da-card text-left" style={{ borderLeft: '4px solid #6366f1', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                  <BookOpen className="w-5 h-5 text-indigo-500" /> AWS, Azure &amp; GCP Operations, DevOps, ML &amp; FinOps Academy
                </h2>
                <p className="text-xs mt-1.5 leading-relaxed font-sans font-semibold" style={{ color: 'var(--da-text-muted)' }}>
                  Complete 11-topic interactive operations and artificial intelligence curriculum sorted across 5 core levels. Master CloudFormation IaC, SSM Automation Runbooks, SSH-less Session Manager, Patch Manager, Trusted Advisor, SES Deliverability, AWS Batch &amp; Outposts, SageMaker Endpoints, Rekognition, Textract, Lex, Polly, and FinOps Cost Explorer allocation rules.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="acad-hero-badge">🎓 11 Complete Modules</span>
                <span className="acad-hero-badge" style={{ background: 'rgba(99, 102, 241, 0.12)', borderColor: 'rgba(99, 102, 241, 0.35)', color: '#6366f1' }}>💡 Everyday Mental Models</span>
                <span className="acad-hero-badge" style={{ background: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)', color: '#10b981' }}>🌐 AWS / Azure / GCP</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Sidebar Category Explorer */}
            <div className="lg:col-span-3 space-y-4 text-left">
              <span className="text-[10px] font-black uppercase tracking-widest block pl-1 font-mono" style={{ color: 'var(--da-text-muted)' }}>Curriculum Directory (11 Modules):</span>
              
              <div className="acad-dir-container">
                <div className="acad-dir-header">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span>Ops &amp; ML Explorer</span>
                </div>

                {/* LEVEL 1: AUTOMATION & IAC */}
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
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('cloudformation')}
                        className={`acad-dir-item-btn ${selectedNote === 'cloudformation' ? 'acad-active' : ''}`}
                      >
                        1.1 CloudFormation IaC &amp; Drift
                      </button>
                      <button 
                        onClick={() => setSelectedNote('ssm_automation')}
                        className={`acad-dir-item-btn ${selectedNote === 'ssm_automation' ? 'acad-active' : ''}`}
                      >
                        1.2 SSM Automation Runbooks
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 2: FLEET & COMPLIANCE */}
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
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('session_manager')}
                        className={`acad-dir-item-btn ${selectedNote === 'session_manager' ? 'acad-active' : ''}`}
                      >
                        2.1 SSM Session Manager
                      </button>
                      <button 
                        onClick={() => setSelectedNote('patch_manager')}
                        className={`acad-dir-item-btn ${selectedNote === 'patch_manager' ? 'acad-active' : ''}`}
                      >
                        2.2 SSM Patch Manager &amp; MW
                      </button>
                      <button 
                        onClick={() => setSelectedNote('scheduler_advisor')}
                        className={`acad-dir-item-btn ${selectedNote === 'scheduler_advisor' ? 'acad-active' : ''}`}
                      >
                        2.3 Trusted Advisor &amp; Scheduler
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 3: APP DELIVERY & HYBRID */}
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
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('ses_pinpoint')}
                        className={`acad-dir-item-btn ${selectedNote === 'ses_pinpoint' ? 'acad-active' : ''}`}
                      >
                        3.1 SES &amp; Pinpoint Deliverability
                      </button>
                      <button 
                        onClick={() => setSelectedNote('outposts_batch')}
                        className={`acad-dir-item-btn ${selectedNote === 'outposts_batch' ? 'acad-active' : ''}`}
                      >
                        3.2 AWS Batch &amp; Outposts
                      </button>
                      <button 
                        onClick={() => setSelectedNote('appflow_amplify')}
                        className={`acad-dir-item-btn ${selectedNote === 'appflow_amplify' ? 'acad-active' : ''}`}
                      >
                        3.3 AppFlow SaaS &amp; Amplify
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 4: ML & MANAGED AI */}
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
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('sagemaker_workspace')}
                        className={`acad-dir-item-btn ${selectedNote === 'sagemaker_workspace' ? 'acad-active' : ''}`}
                      >
                        4.1 SageMaker Endpoints
                      </button>
                      <button 
                        onClick={() => setSelectedNote('vision_text_ocr')}
                        className={`acad-dir-item-btn ${selectedNote === 'vision_text_ocr' ? 'acad-active' : ''}`}
                      >
                        4.2 Rekognition &amp; Textract OCR
                      </button>
                      <button 
                        onClick={() => setSelectedNote('lex_polly_translate')}
                        className={`acad-dir-item-btn ${selectedNote === 'lex_polly_translate' ? 'acad-active' : ''}`}
                      >
                        4.3 Polly, Lex &amp; Translate
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 5: COST MANAGEMENT */}
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
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)' }}>
                      <button 
                        onClick={() => setSelectedNote('cost_explorer')}
                        className={`acad-dir-item-btn ${selectedNote === 'cost_explorer' ? 'acad-active' : ''}`}
                      >
                        5.1 Cost Explorer &amp; Anomalies
                      </button>
                    </div>
                  )}
                </div>

              </div>

              <div className="acad-advice-box rounded-2xl p-4 text-[11px] leading-relaxed font-semibold space-y-1">
                <span className="font-extrabold flex items-center gap-1.5 mb-1 text-[11.5px]" style={{ color: 'var(--da-text-title)' }}>
                  💡 Interactive Operations Quick-Launch
                </span>
                Click any module to explore beginner-friendly breakdowns, real-world analogies, multi-cloud AWS vs Azure vs GCP tables, and copyable CLI snippets!
              </div>
            </div>

            {/* Right Active Note Workspace */}
            <div className="lg:col-span-9 space-y-6 text-left">

              {/* MODULE 1.1: CLOUDFORMATION IAC */}
              {selectedNote === 'cloudformation' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">1.1 IaC &amp; Runbooks</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        1.1 CloudFormation Stacks, Nested Stacks &amp; Drift Detection
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('cfn_ssm')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" /> Launch IaC Simulator
                    </button>
                  </div>

                  {/* What & Why Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Code className="w-3.5 h-3.5 text-blue-500" /> What Is It &amp; Why Needed?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        **AWS CloudFormation** translates declarative template files (JSON/YAML) into live cloud resources. It manages resource dependency order and automatically executes an **atomic rollback sequence** if deployment encounters errors.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Server className="w-3.5 h-3.5 text-emerald-500" /> What Problem Does It Solve?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Eliminates manual console click-ops errors. **Drift Detection** identifies out-of-band manual changes made to infrastructure, preventing security risks and configuration divergence.
                      </p>
                    </div>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Writing a master blueprint for your cloud infrastructure instead of building each server manually. If building a room fails, CloudFormation automatically dismantles the incomplete room so you aren&apos;t left with half-built broken servers!
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      💡 The Everyday Real-World Analogy: Architectural Blueprint for a Modular Prefab Home
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      Instead of building a house by hand without instructions, you submit a digital blueprint (`YAML Template`). The factory constructs the foundation, plumbing, and roof in perfect order. If the plumbing check fails, the factory resets the assembly line (`Rollback`)!
                    </p>
                  </div>

                  {/* Copyable CLI Snippet */}
                  <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold" style={{ color: 'var(--da-text-title)' }}>⌨️ CLI: Deploy CloudFormation Stack</span>
                      <button 
                        onClick={() => handleCopyCode(cfnDeployCli, 'cfn-cli')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-mono flex items-center gap-1 transition-all"
                      >
                        {copiedNoteId === 'cfn-cli' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedNoteId === 'cfn-cli' ? 'Copied!' : 'Copy Code'}
                      </button>
                    </div>
                    <pre className="acad-terminal text-[10px] leading-relaxed overflow-x-auto p-3 rounded-lg">
                      {cfnDeployCli}
                    </pre>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="acad-table">
                      <thead>
                        <tr>
                          <th>Cloud Provider</th>
                          <th>Native IaC Engine</th>
                          <th>Multi-Account Orchestrator</th>
                          <th>Drift Scan Capability</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>AWS</strong></td>
                          <td>AWS CloudFormation (YAML/JSON) / AWS CDK</td>
                          <td>CloudFormation StackSets</td>
                          <td>Native DetectStackDrift API</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Azure</strong></td>
                          <td>Azure Resource Manager (ARM) / Bicep</td>
                          <td>Azure Management Groups &amp; Blueprints</td>
                          <td>What-If Analysis &amp; Resource Policy Engine</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>GCP</strong></td>
                          <td>Google Cloud Deployment Manager / Terraform</td>
                          <td>Google Cloud Resource Manager</td>
                          <td>Terraform Plan Drift Detection</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MODULE 1.2: SSM AUTOMATION */}
              {selectedNote === 'ssm_automation' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">1.2 IaC &amp; Runbooks</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        1.2 AWS Systems Manager (SSM) Automation &amp; Event-Driven Remediation
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('cfn_ssm')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" /> Launch Runbooks
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> An automated digital checklist for IT operators. When a cloud alert triggers (for example, disk space full or open security port), an SSM Automation Runbook automatically fires to fix the problem without waking up an engineer at 3:00 AM!
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      💡 The Everyday Real-World Analogy: Airplane Cockpit Automated Pre-Flight Checklist
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      Instead of relying on a pilot to memorize 100 complex emergency steps, the onboard computer runs an automated diagnostic sequence and fixes pressure drops automatically!
                    </p>
                  </div>

                  <div className="acad-takeaway-box">
                    <strong>⚡ EventBridge Auto-Remediation:</strong> Pair Amazon EventBridge or AWS Config with Systems Manager Automation to automatically run remediation runbooks when compliance rules are violated.
                  </div>
                </div>
              )}

              {/* MODULE 2.1: SESSION MANAGER */}
              {selectedNote === 'session_manager' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">2.1 Fleet &amp; Compliance</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        2.1 SSM Session Manager: SSH-less Access &amp; Keystroke Audit Logging
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('fleet')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" /> Launch SSM Fleet
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Logging into remote servers through a secure cloud tunnel without needing SSH keys or opening port 22 on firewalls. Every single command typed by an engineer is recorded to S3 and CloudWatch for security compliance!
                  </div>

                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      💡 The Everyday Real-World Analogy: Remote Desktop Access with Security Camera Video Recording
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      You don&apos;t hand over a physical key to your house (`No SSH key management`). Instead, you grant a temporary remote video session (`SSM Agent`) where every key turn and open door is logged on security cameras (`S3 Audit Logs`).
                    </p>
                  </div>

                  {/* Copyable CLI Snippet */}
                  <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold" style={{ color: 'var(--da-text-title)' }}>⌨️ CLI: Start SSM Session Manager</span>
                      <button 
                        onClick={() => handleCopyCode(ssmStartSessionCli, 'ssm-cli')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-mono flex items-center gap-1 transition-all"
                      >
                        {copiedNoteId === 'ssm-cli' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedNoteId === 'ssm-cli' ? 'Copied!' : 'Copy Code'}
                      </button>
                    </div>
                    <pre className="acad-terminal text-[10px] leading-relaxed overflow-x-auto p-3 rounded-lg">
                      {ssmStartSessionCli}
                    </pre>
                  </div>
                </div>
              )}

              {/* MODULE 2.2: PATCH MANAGER */}
              {selectedNote === 'patch_manager' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">2.2 Fleet &amp; Compliance</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        2.2 SSM Patch Manager &amp; Maintenance Windows
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('fleet')}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" /> Launch SSM Fleet
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Automatically installing OS security patches across hundreds of EC2 instances during off-peak hours (Maintenance Windows) so vulnerabilities are fixed while zero customers are using the application.
                  </div>
                </div>
              )}

              {/* MODULE 2.3: TRUSTED ADVISOR */}
              {selectedNote === 'scheduler_advisor' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">2.3 Fleet &amp; Compliance</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        2.3 AWS Trusted Advisor &amp; Instance Scheduler
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('finops')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" /> Launch FinOps
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Having an expert cloud auditor inspect your account 24/7. It alerts you when databases are left unencrypted, security groups have open ports, or dev servers are left running over the weekend wasting money!
                  </div>
                </div>
              )}

              {/* MODULE 3.1: SES & PINPOINT */}
              {selectedNote === 'ses_pinpoint' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">3.1 Delivery &amp; Hybrid</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        3.1 Amazon SES &amp; Pinpoint Deliverability Feedback Loops
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('hybrid_batch')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" /> Launch App Channels
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> High-volume transactional email engine (Amazon SES) paired with customer engagement tracking (Pinpoint). Uses SPF, DKIM, and DMARC authentication to guarantee password reset emails land in the inbox instead of spam!
                  </div>

                  {/* Copyable CLI Snippet */}
                  <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold" style={{ color: 'var(--da-text-title)' }}>⌨️ CLI: Verify Domain Identity SES</span>
                      <button 
                        onClick={() => handleCopyCode(sesVerifyDomainCli, 'ses-cli')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-mono flex items-center gap-1 transition-all"
                      >
                        {copiedNoteId === 'ses-cli' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedNoteId === 'ses-cli' ? 'Copied!' : 'Copy Code'}
                      </button>
                    </div>
                    <pre className="acad-terminal text-[10px] leading-relaxed overflow-x-auto p-3 rounded-lg">
                      {sesVerifyDomainCli}
                    </pre>
                  </div>
                </div>
              )}

              {/* MODULE 3.2: BATCH & OUTPOSTS */}
              {selectedNote === 'outposts_batch' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">3.2 Delivery &amp; Hybrid</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        3.2 AWS Batch &amp; AWS Outposts On-Premises Orchestration
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('hybrid_batch')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" /> Launch App Channels
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **AWS Batch** automatically provisions temporary compute fleets to run heavy batch jobs (video encoding, AI data prep). **AWS Outposts** delivers physical AWS server hardware directly to your local datacenter for ultra-low latency!
                  </div>
                </div>
              )}

              {/* MODULE 3.3: APPFLOW & AMPLIFY */}
              {selectedNote === 'appflow_amplify' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">3.3 Delivery &amp; Hybrid</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        3.3 Amazon AppFlow SaaS Integrations &amp; AWS Amplify CI/CD
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('hybrid_batch')}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" /> Launch App Channels
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **AppFlow** is an automated conveyor belt moving SaaS data (Salesforce, Slack) securely into AWS S3 without custom code. **Amplify** gives web and mobile developers instant backend databases, auth, and automated Git deployment hosting!
                  </div>
                </div>
              )}

              {/* MODULE 4.1: SAGEMAKER */}
              {selectedNote === 'sagemaker_workspace' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">4.1 AWS ML Services</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        4.1 Amazon SageMaker Model Endpoints &amp; Shadow Deployments
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('ml_analytics')}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" /> Launch ML Sandbox
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> An end-to-end factory for AI models. It trains machine learning models, hosts them on auto-scaling endpoints, and uses **Shadow Deployments** to test new model versions on live traffic invisibly without impacting users!
                  </div>

                  {/* Copyable CLI Snippet */}
                  <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold" style={{ color: 'var(--da-text-title)' }}>⌨️ CLI: Invoke SageMaker Endpoint</span>
                      <button 
                        onClick={() => handleCopyCode(sagemakerInferenceCli, 'sm-cli')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-mono flex items-center gap-1 transition-all"
                      >
                        {copiedNoteId === 'sm-cli' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedNoteId === 'sm-cli' ? 'Copied!' : 'Copy Code'}
                      </button>
                    </div>
                    <pre className="acad-terminal text-[10px] leading-relaxed overflow-x-auto p-3 rounded-lg">
                      {sagemakerInferenceCli}
                    </pre>
                  </div>
                </div>
              )}

              {/* MODULE 4.2: REKOGNITION & TEXTRACT */}
              {selectedNote === 'vision_text_ocr' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">4.2 AWS ML Services</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        4.2 Amazon Rekognition Vision &amp; Textract Form Extraction OCR
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('ml_analytics')}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" /> Launch ML Sandbox
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Ready-to-use AI models: **Rekognition** gives your software computer vision to detect objects and faces in photos. **Textract** reads scanned PDF receipts and invoices, extracting form fields directly into database tables!
                  </div>
                </div>
              )}

              {/* MODULE 4.3: POLLY, LEX & TRANSLATE */}
              {selectedNote === 'lex_polly_translate' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">4.3 AWS ML Services</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        4.3 Amazon Polly Speech, Lex Intent Slots &amp; Translate
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('ml_analytics')}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" /> Launch ML Sandbox
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **Polly** converts text to lifelike human speech. **Lex** provides intelligent chatbot intent &amp; slots parsing (powering Alexa-like bots). **Translate** converts text across 75+ languages automatically!
                  </div>
                </div>
              )}

              {/* MODULE 5.1: COST EXPLORER */}
              {selectedNote === 'cost_explorer' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">5.1 FinOps &amp; Budgets</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        5.1 AWS Cost Explorer, Cost Allocation Tags &amp; Anomaly Detection
                      </h3>
                    </div>
                    <button 
                      onClick={() => setActiveTab('finops')}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                    >
                      <Play className="w-3.5 h-3.5" /> Launch FinOps
                    </button>
                  </div>

                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> An itemized bank statement for your cloud bill. Using **Cost Allocation Tags** (e.g. `Project: Alpha`), you filter costs by team. **Cost Anomaly Detection** sends instant SMS alerts if a rogue script causes a cost spike!
                  </div>

                  {/* Copyable CLI Snippet */}
                  <div className="p-4 rounded-xl border space-y-2" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold" style={{ color: 'var(--da-text-title)' }}>⌨️ CLI: Query AWS Cost Explorer</span>
                      <button 
                        onClick={() => handleCopyCode(costExplorerQueryCli, 'ce-cli')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-mono flex items-center gap-1 transition-all"
                      >
                        {copiedNoteId === 'ce-cli' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedNoteId === 'ce-cli' ? 'Copied!' : 'Copy Code'}
                      </button>
                    </div>
                    <pre className="acad-terminal text-[10px] leading-relaxed overflow-x-auto p-3 rounded-lg">
                      {costExplorerQueryCli}
                    </pre>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="acad-table">
                      <thead>
                        <tr>
                          <th>Cloud Provider</th>
                          <th>Cost Analytics Dashboard</th>
                          <th>Resource Tagging Engine</th>
                          <th>Anomaly Alert Mechanism</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>AWS</strong></td>
                          <td>AWS Cost Explorer / AWS CUR</td>
                          <td>AWS Cost Allocation Tags</td>
                          <td>AWS Cost Anomaly Detection (ML)</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Azure</strong></td>
                          <td>Azure Cost Management &amp; Billing</td>
                          <td>Azure Resource Tags &amp; Management Groups</td>
                          <td>Azure Anomaly Alerts &amp; Budget Alarms</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>GCP</strong></td>
                          <td>Google Cloud Billing Reports &amp; BigQuery Export</td>
                          <td>GCP Resource Labels</td>
                          <td>GCP Budget &amp; Anomaly Detection Alerts</td>
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
                    <rect width="380" height="80" rx="8" fill="none" stroke={driftDetected ? "var(--ops-svg-red-border)" : "var(--ops-svg-stroke)"} strokeWidth="2" strokeDasharray={driftDetected ? "5,3" : "none"} />
                    <text x="12" y="16" fontSize="9" fontWeight="bold" fill="var(--ops-svg-text)" fontFamily="monospace">VPC (10.0.0.0/16)</text>
                    
                    {/* Subnet resource */}
                    <g transform="translate(30, 25)">
                      <rect width="100" height="40" rx="6" fill="var(--ops-svg-blue-bg)" stroke="var(--ops-svg-blue-border)" strokeWidth="1.5" />
                      <text x="50" y="24" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--ops-svg-blue-text)">Public Subnet</text>
                    </g>
 
                    {/* Security Group resource */}
                    <g transform="translate(160, 25)">
                      <rect width="100" height="40" rx="6" fill={driftDetected ? "var(--ops-svg-red-bg)" : "var(--ops-svg-green-bg)"} stroke={driftDetected ? "var(--ops-svg-red-border)" : "var(--ops-svg-green-border)"} strokeWidth="1.5" />
                      <text x="50" y="20" textAnchor="middle" fontSize="9" fontWeight="bold" fill={driftDetected ? "var(--ops-svg-red-text)" : "var(--ops-svg-green-text)"}>Security Group</text>
                      <text x="50" y="32" textAnchor="middle" fontSize="7.5" fill={driftDetected ? "var(--ops-svg-red-border)" : "var(--ops-svg-green-border)"} fontWeight="bold" fontFamily="monospace">
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
                          className={`cursor-pointer transition-colors ${selectedInstanceId === inst.id ? 'ops-row-selected' : 'ops-row-hover'}`}
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
                        <span className="ops-badge-match">{lbl.conf.toFixed(1)}% Match</span>
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
                      <div key={idx} className="ops-slot-card">
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

                <div className="ops-savings-card text-xs font-mono space-y-1">
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
                  <svg width="100%" height="160" className="ops-chart-svg rounded-xl">
                    <line x1="50" y1="120" x2="450" y2="120" stroke="var(--ops-svg-stroke)" strokeWidth="1" />
                    
                    {/* Normal base costs bar chart */}
                    <rect x="80" y="80" width="30" height="40" fill="#3b82f6" rx="2" />
                    <text x="95" y="132" textAnchor="middle" fontSize="8.5" fill="var(--ops-svg-text)" fontFamily="monospace">March</text>
                    <text x="95" y="72" textAnchor="middle" fontSize="8.5" fill="var(--ops-text)" fontWeight="bold" fontFamily="monospace">$420</text>
 
                    <rect x="180" y="70" width="30" height="50" fill="#3b82f6" rx="2" />
                    <text x="195" y="132" textAnchor="middle" fontSize="8.5" fill="var(--ops-svg-text)" fontFamily="monospace">April</text>
                    <text x="195" y="62" textAnchor="middle" fontSize="8.5" fill="var(--ops-text)" fontWeight="bold" fontFamily="monospace">$500</text>
 
                    {/* Cost anomaly spike bar chart */}
                    <rect 
                      x="280" 
                      y={anomalySpike === 'lambda' ? "20" : anomalySpike === 'ebs' ? "50" : "65"} 
                      width="30" 
                      height={anomalySpike === 'lambda' ? "100" : anomalySpike === 'ebs' ? "70" : "55"} 
                      fill={anomalySpike !== 'none' ? "#ef4444" : "#3b82f6"} 
                      rx="2" 
                    />
                    <text x="295" y="132" textAnchor="middle" fontSize="8.5" fill="var(--ops-svg-text)" fontFamily="monospace">May (Current)</text>
                    <text x="295" y={anomalySpike === 'lambda' ? "12" : anomalySpike === 'ebs' ? "42" : "57"} textAnchor="middle" fontSize="8.5" fill={anomalySpike !== 'none' ? "var(--ops-svg-red-border)" : "var(--ops-text)"} fontWeight="bold" fontFamily="monospace">
                      {anomalySpike === 'lambda' ? '$1,850' : anomalySpike === 'ebs' ? '$850' : '$550'}
                    </text>
                  </svg>
                  
                  {anomalySpike !== 'none' && (
                    <div className="ops-alert-danger text-xs rounded-xl p-3.5 mt-3 flex items-center gap-2.5 w-full">
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
                    <div key={idx} className="ops-advisor-row flex justify-between items-center text-xs p-2.5 rounded-xl">
                      <div>
                        <span className="text-[10px] text-slate-450 block font-bold uppercase">{res.category}</span>
                        <span className="font-semibold text-slate-800">{res.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {res.savings && <span className="ops-savings-badge">Save {res.savings}</span>}
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
            </>
          </Translate>
        )}
      </div>
    </div>
  );
}
