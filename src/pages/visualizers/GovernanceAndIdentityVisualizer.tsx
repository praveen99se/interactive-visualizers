import React, { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Copy,
  Check,
  Zap,
  Shield,
  Users,
  Key,
  Activity,
  Sliders,
  Play,
  RefreshCw,
  SlidersHorizontal,
  Building,
  Plus,
  Terminal,
  Network
} from 'lucide-react';
import GovernanceAndIdentityComparativeView from '../../components/visualizers/GovernanceAndIdentityComparativeView';
import UniqueGovernanceAndIdentityFeatures from '../../components/visualizers/UniqueGovernanceAndIdentityFeatures';

type TabType = 'notebook' | 'intro' | 'organizations' | 'iam' | 'identitycenter' | 'compliance' | 'unique';

interface AccountNode {
  id: string;
  name: string;
  ou: 'Sandbox' | 'Test' | 'Prod' | 'Management';
  email: string;
  status: 'active' | 'creating';
}

interface LogRow {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

interface GovernanceAndIdentityVisualizerProps {
  provider?: 'aws' | 'azure' | 'gcp' | 'comparative';
  setProvider?: (provider: 'aws' | 'azure' | 'gcp' | 'comparative') => void;
}

export default function GovernanceAndIdentityVisualizer({ provider = 'aws', setProvider }: GovernanceAndIdentityVisualizerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');

  // Visual Architect Notes & Theories Academy State
  const [selectedNote, setSelectedNote] = useState<string>('iam_roles_policies');
  const [expandedCategory, setExpandedCategory] = useState<string>('iam_fundamentals');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  const isComparative = provider === 'comparative';

  const t = (text: string) => {
    if (provider === 'azure') {
      return text
        .replace(/AWS IAM/gi, 'Microsoft Entra ID & Azure RBAC')
        .replace(/AWS Organizations/gi, 'Azure Management Groups')
        .replace(/Service Control Policies \(SCPs\)/gi, 'Azure Policy Guardrails')
        .replace(/IAM Role/gi, 'Azure Managed Identity / RBAC Role')
        .replace(/CloudWatch/g, 'Azure Monitor');
    }
    if (provider === 'gcp') {
      return text
        .replace(/AWS IAM/gi, 'Google Cloud IAM')
        .replace(/AWS Organizations/gi, 'GCP Resource Manager')
        .replace(/Service Control Policies \(SCPs\)/gi, 'GCP Organization Policies')
        .replace(/IAM Role/gi, 'GCP Service Account / Role')
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
        if (node.type === 'pre' || node.type === 'code' || (node.props && (node.props.className === 'gov-terminal' || node.props.className === 'gov-code-card'))) {
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
    setActiveTab(tab === 'roles' ? 'iam' : tab === 'scp' ? 'organizations' : tab === 'architect' ? 'intro' : tab);
  };

  // ==========================================
  // TAB 1 STATE: Topics & EventBridge Mode
  // ==========================================
  const [selectedTopic, setSelectedTopic] = useState<'organizations' | 'iam' | 'identitycenter' | 'ad' | 'controltower'>('organizations');
  const [eventBridgeMode, setEventBridgeMode] = useState<'resource_policy' | 'iam_role'>('resource_policy');

  // ==========================================
  // TAB 2 STATE: AWS Organizations & SCP Hierarchy (Image 3)
  // ==========================================
  const [selectedNodeId, setSelectedNodeId] = useState<string>('acct-a');
  const [attachedScps, setAttachedScps] = useState<string[]>(['DenyS3', 'DenyEC2', 'AllowEC2', 'DenyAthena']);
  const [simAccountAction, setSimAccountAction] = useState<'s3:CreateBucket' | 'ec2:RunInstances' | 'athena:StartQuery' | 'iam:CreateUser'>('s3:CreateBucket');
  const [scpSimState, setScpSimState] = useState<'idle' | 'running' | 'allowed' | 'blocked'>('idle');
  const [scpLogs, setScpLogs] = useState<LogRow[]>([]);
  const [newAccountName, setNewAccountName] = useState<string>('');
  const [newAccountOu, setNewAccountOu] = useState<'Sandbox' | 'Test' | 'Prod'>('Sandbox');

  const [accountsList, setAccountsList] = useState<AccountNode[]>([
    { id: '111111111111', name: 'Management Account', ou: 'Management', email: 'master@corporate.internal', status: 'active' },
    { id: '222222222222', name: 'Account A (Sandbox)', ou: 'Sandbox', email: 'acct-a@sandbox.internal', status: 'active' },
    { id: '333333333333', name: 'Account B (Sandbox)', ou: 'Sandbox', email: 'acct-b@sandbox.internal', status: 'active' },
    { id: '444444444444', name: 'Account C (Sandbox)', ou: 'Sandbox', email: 'acct-c@sandbox.internal', status: 'active' },
    { id: '555555555555', name: 'Account D (Test)', ou: 'Test', email: 'acct-d@test.internal', status: 'active' },
    { id: '666666666666', name: 'Account E (Prod)', ou: 'Prod', email: 'acct-e@prod.internal', status: 'active' },
    { id: '777777777777', name: 'Account F (Prod)', ou: 'Prod', email: 'acct-f@prod.internal', status: 'active' }
  ]);

  // ==========================================
  // TAB 3 STATE: IAM Policy Evaluation & Conditions (Images 1, 2, 5)
  // ==========================================
  const [clientIp, setClientIp] = useState<'corporate' | 'public'>('corporate');
  const [mfaStatus, setMfaStatus] = useState<boolean>(true);
  const [principalDept, setPrincipalDept] = useState<'Data' | 'HR'>('Data');
  const [resourceProject, setResourceProject] = useState<'DataAnalytics' | 'Marketing'>('DataAnalytics');
  const [requestedRegion, setRequestedRegion] = useState<'eu-central-1' | 'us-east-1'>('eu-central-1');
  const [targetAction, setTargetAction] = useState<'ec2:StopInstances' | 'ec2:StartInstances' | 'rds:CreateDB' | 's3:PutObject'>('ec2:StopInstances');
  
  const [iamSimState, setIamSimState] = useState<'idle' | 'running' | 'allowed' | 'blocked'>('idle');
  const [iamLogs, setIamLogs] = useState<LogRow[]>([]);
  const [iamEvalStep, setIamEvalStep] = useState<number>(0);

  // ==========================================
  // TAB 4 STATE: Identity Center & AD Directory Sync
  // ==========================================
  const [syncState, setSyncState] = useState<'idle' | 'running' | 'success'>('idle');
  const [syncLogs, setSyncLogs] = useState<LogRow[]>([]);
  const [mappedGroup, setMappedGroup] = useState<'admins' | 'analysts' | 'billing'>('admins');
  const [selectedDirectory, setSelectedDirectory] = useState<'managed_ad' | 'ad_connector' | 'simple_ad'>('managed_ad');

  // ==========================================
  // TAB 5 STATE: Control Tower Guardrails
  // ==========================================
  const [selectedGuardrail, setSelectedGuardrail] = useState<'deny_public_s3' | 'detect_unencrypted_ebs' | 'block_root_api'>('deny_public_s3');
  const [auditAction, setAuditAction] = useState<'deploy_public_s3' | 'deploy_unencrypted_ebs' | 'invoke_root_api'>('deploy_public_s3');
  const [complianceLogs, setComplianceLogs] = useState<LogRow[]>([]);
  const [complianceState, setComplianceState] = useState<'idle' | 'deploying' | 'evaluated' | 'remediated'>('idle');
  const [nonCompliantCount, setNonCompliantCount] = useState<number>(0);

  // ==========================================
  // TAB 2 SIMULATION LOGIC: SCP Sandbox (Image 3)
  // ==========================================
  const runScpSimulation = async () => {
    if (scpSimState === 'running') return;
    setScpSimState('running');
    setScpLogs([]);
    const timestamp = new Date().toLocaleTimeString();

    // Find current target account node
    const targetAcct = accountsList.find(a => 
      selectedNodeId === 'management' ? a.ou === 'Management' :
      selectedNodeId === 'acct-a' ? a.name.includes('Account A') :
      selectedNodeId === 'acct-b' ? a.name.includes('Account B') :
      selectedNodeId === 'acct-c' ? a.name.includes('Account C') :
      selectedNodeId === 'acct-d' ? a.name.includes('Account D') :
      selectedNodeId === 'acct-e' ? a.name.includes('Account E') : a.name.includes('Account F')
    );

    if (!targetAcct) return;

    setScpLogs(prev => [...prev, { timestamp, message: `[INGRESS] Invoking action: [${simAccountAction}] on target Account: [${targetAcct.name}] (ID: ${targetAcct.id})`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 600));

    // Management account bypass check
    if (targetAcct.ou === 'Management') {
      setScpLogs(prev => [
        ...prev,
        { timestamp, message: `💡 [BYPASS] Target is the Management Account. Service Control Policies (SCPs) do NOT apply to the Management Account!`, type: 'warn' },
        { timestamp, message: `[SUCCESS] Request successfully bypasses landing zone boundaries. Execution permitted.`, type: 'success' }
      ]);
      setScpSimState('allowed');
      return;
    }

    setScpLogs(prev => [...prev, { timestamp, message: `[GATEWAY] Intercepting request. Traversing Service Control Policy (SCP) hierarchy tree...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 800));

    // 1. Root OU SCP evaluation
    setScpLogs(prev => [...prev, { timestamp, message: `[EVALUATE] Checking Root OU boundaries (Default: FullAWSAccess + DenyAthena)...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 600));

    if (simAccountAction === 'athena:StartQuery' && attachedScps.includes('DenyAthena')) {
      setScpLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [POLICY BREACH] Blocked by Root SCP: "DenyAthena" explicitly forbids Athena execution at the Root Organization boundary!`, type: 'error' },
        { timestamp, message: `[HALTED] 403 AccessDenied - SCP block prevents execution of this API call!`, type: 'error' }
      ]);
      setScpSimState('blocked');
      return;
    }

    // 2. Sandbox OU evaluation (Inherited Deny S3)
    if (targetAcct.ou === 'Sandbox') {
      setScpLogs(prev => [...prev, { timestamp, message: `[EVALUATE] Evaluating Sandbox OU boundaries (Policy: FullAWSAccess + DenyS3)...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 600));

      if (simAccountAction.startsWith('s3:') && attachedScps.includes('DenyS3')) {
        setScpLogs(prev => [
          ...prev,
          { timestamp, message: `🚨 [POLICY BREACH] Inherited Block: Sandbox OU Service Control Policy explicitly denies S3 write actions!`, type: 'error' },
          { timestamp, message: `[HALTED] 403 AccessDenied - Parent OU SCP restricts S3 access for all nested accounts.`, type: 'error' }
        ]);
        setScpSimState('blocked');
        return;
      }

      // Check Account A direct SCP: Deny EC2
      if (selectedNodeId === 'acct-a') {
        setScpLogs(prev => [...prev, { timestamp, message: `[EVALUATE] Checking direct SCP attached to Account A (Policy: FullAWSAccess + DenyEC2)...`, type: 'info' }]);
        await new Promise(r => setTimeout(r, 600));

        if (simAccountAction.startsWith('ec2:') && attachedScps.includes('DenyEC2')) {
          setScpLogs(prev => [
            ...prev,
            { timestamp, message: `🚨 [POLICY BREACH] Direct Block: Account A SCP explicitly denies EC2 modifications (DenyEC2)!`, type: 'error' },
            { timestamp, message: `[HALTED] 403 AccessDenied - Direct account SCP blocks execution.`, type: 'error' }
          ]);
          setScpSimState('blocked');
          return;
        }
      }
    }

    // 3. Test OU evaluation (Allows ONLY EC2)
    if (targetAcct.ou === 'Test') {
      setScpLogs(prev => [...prev, { timestamp, message: `[EVALUATE] Evaluating Test OU boundaries (Policy: AllowEC2 only)...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 600));

      if (!simAccountAction.startsWith('ec2:') && attachedScps.includes('AllowEC2')) {
        setScpLogs(prev => [
          ...prev,
          { timestamp, message: `🚨 [IMPLICIT BLOCK] Blocked! Test OU utilizes whitelist filter allowing only "ec2:*". All other APIs are implicitly denied by SCP.`, type: 'error' },
          { timestamp, message: `[HALTED] 403 AccessDenied - Whitellist SCP restricts operations.`, type: 'error' }
        ]);
        setScpSimState('blocked');
        return;
      }
    }

    // 4. Prod OU evaluation (Full AWSAccess)
    if (targetAcct.ou === 'Prod') {
      setScpLogs(prev => [...prev, { timestamp, message: `[EVALUATE] Evaluating Prod OU boundaries (Policy: FullAWSAccess)...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 600));
    }

    // Passed all SCP boundaries
    setScpLogs(prev => [
      ...prev,
      { timestamp, message: `🟢 [SUCCESS] Request successfully passed all applicable Service Control Policy boundaries!`, type: 'success' },
      { timestamp, message: `[PASSED] Forwarded API call downstream to IAM Authorization Engine.`, type: 'success' }
    ]);
    setScpSimState('allowed');
  };

  const createAccountAction = async () => {
    if (!newAccountName) return;
    const timestamp = new Date().toLocaleTimeString();
    const id = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const newAcct: AccountNode = {
      id,
      name: `${newAccountName} (${newAccountOu})`,
      ou: newAccountOu,
      email: `${newAccountName.toLowerCase().replace(/\s+/g, '-')}@corporate.internal`,
      status: 'creating'
    };

    setAccountsList(prev => [...prev, newAcct]);
    setNewAccountName('');
    
    setScpLogs(prev => [...prev, { timestamp, message: `[ORGANIZATION] Triggering Account Factory to provision: [${newAcct.name}]`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 1200));

    setAccountsList(prev => prev.map(acct => acct.id === id ? { ...acct, status: 'active' } : acct));
    setScpLogs(prev => [
      ...prev,
      { timestamp, message: `[ORGANIZATION] Success! Account ${id} provisioned inside OU [${newAccountOu}].`, type: 'success' },
      { timestamp, message: `[LANDING ZONE] Auto-applied baseline Guardrail SCP filters to Account ${id}.`, type: 'success' }
    ]);
  };

  // ==========================================
  // TAB 3 SIMULATION LOGIC: IAM Policy Evaluation Engine (Images 1, 2, 5)
  // ==========================================
  const runIamSimulation = async () => {
    if (iamSimState === 'running') return;
    setIamSimState('running');
    setIamLogs([]);
    setIamEvalStep(0);
    const timestamp = new Date().toLocaleTimeString();

    // Step 0: Ingress
    setIamLogs(prev => [
      ...prev, 
      { timestamp, message: `[INGRESS] Access request initiated by IAM Principal (bob_dev) from Client IP: [${clientIp === 'corporate' ? '192.0.2.45 (Corporate)' : '98.22.11.99 (Public Internet)'}]`, type: 'info' },
      { timestamp, message: `[INGRESS] Target API: ${targetAction} | Region: ${requestedRegion} | MFA Status: [${mfaStatus ? 'MFA ACTIVE' : 'NO MFA'}],`, type: 'info' },
      { timestamp, message: `[INGRESS] Attribute Tags: Principal Department: "${principalDept}" | Resource Project: "${resourceProject}"`, type: 'info' }
    ]);
    await new Promise(r => setTimeout(r, 800));

    // Step 1: Explicit Deny (Including IP Restriction - Image 1)
    setIamEvalStep(1);
    setIamLogs(prev => [...prev, { timestamp, message: `[STEP 1/5] Evaluating policies for explicit DENY blocks (Evaluating IP Restriction bounds)...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 1000));

    if (clientIp === 'public') {
      setIamLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [EXPLICIT DENY] Triggered "DenyOutsideCorporateIP" policy statement!`, type: 'error' },
        { timestamp, message: `💡 [IP RESTRICTION] aws:SourceIp is not in company subnet [192.0.2.0/24, 203.0.11.0/24]. Access denied.`, type: 'error' },
        { timestamp, message: `[DECISION] Access Request: DENIED (IP Restriction block takes precedence).`, type: 'error' }
      ]);
      setIamSimState('blocked');
      setIamEvalStep(6);
      return;
    }

    // Step 1b: MFA Deny evaluation (Image 2)
    if (targetAction === 'ec2:StopInstances' && !mfaStatus) {
      setIamLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [EXPLICIT DENY] Triggered "ForceMFAtoModifyCompute" policy block!`, type: 'error' },
        { timestamp, message: `💡 [MFA BLOCK] aws:MultiFactorAuthPresent is false. Stop/Terminate EC2 instances is strictly blocked without MFA validation!`, type: 'error' },
        { timestamp, message: `[DECISION] Access Request: DENIED.`, type: 'error' }
      ]);
      setIamSimState('blocked');
      setIamEvalStep(6);
      return;
    }

    // Step 1c: Region restriction deny check (Image 5)
    if (targetAction === 'rds:CreateDB' && requestedRegion !== 'eu-central-1') {
      setIamLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [EXPLICIT DENY] Triggered "RegionLockoutConstraint" policy!`, type: 'error' },
        { timestamp, message: `💡 [REGION BLOCK] Target region "${requestedRegion}" is restricted. aws:RequestedRegion must equal "eu-central-1" for database operations!`, type: 'error' },
        { timestamp, message: `[DECISION] Access Request: DENIED.`, type: 'error' }
      ]);
      setIamSimState('blocked');
      setIamEvalStep(6);
      return;
    }

    setIamLogs(prev => [...prev, { timestamp, message: `🟢 No explicit DENY constraints triggered. Proceeding to landing zone boundary check.`, type: 'success' }]);
    await new Promise(r => setTimeout(r, 650));

    // Step 2: SCP Check
    setIamEvalStep(2);
    setIamLogs(prev => [...prev, { timestamp, message: `[STEP 2/5] Evaluating Organizational Service Control Policies (SCPs)...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 800));
    setIamLogs(prev => [...prev, { timestamp, message: `🟢 SCP permits operation. Proceeding to Principal permission boundaries.`, type: 'success' }]);
    await new Promise(r => setTimeout(r, 600));

    // Step 3: Permission Boundary Check
    setIamEvalStep(3);
    setIamLogs(prev => [...prev, { timestamp, message: `[STEP 3/5] Evaluating principal Permissions Boundary boundary filters...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 800));
    setIamLogs(prev => [...prev, { timestamp, message: `🟢 Action sits within permission boundary limits. Proceeding.`, type: 'success' }]);
    await new Promise(r => setTimeout(r, 600));

    // Step 4: Identity & Resource Checks (ABAC Attribute match - Image 5)
    setIamEvalStep(4);
    setIamLogs(prev => [...prev, { timestamp, message: `[STEP 4/5] Evaluating Identity-Based Policies & Resource-Based Policies (Evaluating ABAC Tags)...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 1000));

    if (targetAction === 'ec2:StartInstances') {
      if (principalDept === 'Data' && resourceProject === 'DataAnalytics') {
        setIamLogs(prev => [
          ...prev,
          { timestamp, message: `🟢 [ABAC MATCHED] PrincipalTag "Dept" (${principalDept}) matches ResourceTag "project" (${resourceProject})!`, type: 'success' },
          { timestamp, message: `[DECISION] Access Request: ALLOWED!`, type: 'success' }
        ]);
        setIamSimState('allowed');
        setIamEvalStep(6);
      } else {
        setIamEvalStep(5);
        setIamLogs(prev => [
          ...prev,
          { timestamp, message: `⚠️ [ABAC MISMATCH] Principal tag Dept="${principalDept}" does not match resource tag project="${resourceProject}".`, type: 'warn' },
          { timestamp, message: `[IMPLICIT DENY] Fallback to default explicit closed boundary (Implicit Deny).`, type: 'error' },
          { timestamp, message: `[DECISION] Access Request: DENIED.`, type: 'error' }
        ]);
        setIamSimState('blocked');
        setIamEvalStep(6);
      }
      return;
    }

    // Default Allow for standard actions
    if (targetAction === 's3:PutObject') {
      setIamLogs(prev => [
        ...prev,
        { timestamp, message: `🟢 [ALLOW MATCHED] Explicit Allow found in Identity inline developer permissions policy.`, type: 'success' },
        { timestamp, message: `[DECISION] Access Request: ALLOWED!`, type: 'success' }
      ]);
      setIamSimState('allowed');
      setIamEvalStep(6);
    } else {
      // ec2:StopInstances with MFA active
      setIamLogs(prev => [
        ...prev,
        { timestamp, message: `🟢 [ALLOW MATCHED] MFA validation verified. Identity-based policy allows ec2:StopInstances.`, type: 'success' },
        { timestamp, message: `[DECISION] Access Request: ALLOWED!`, type: 'success' }
      ]);
      setIamSimState('allowed');
      setIamEvalStep(6);
    }
  };

  const resetIamSim = () => {
    setIamSimState('idle');
    setIamLogs([]);
    setIamEvalStep(0);
  };

  // ==========================================
  // TAB 4 SIMULATION LOGIC: Identity Center Sync
  // ==========================================
  const runDirectorySync = async () => {
    if (syncState === 'running') return;
    setSyncState('running');
    setSyncLogs([]);
    const timestamp = new Date().toLocaleTimeString();

    setSyncLogs(prev => [...prev, { timestamp, message: `[IDENTITY SYNC] Initiating synchronization from Active Directory to IAM Identity Center...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 600));

    setSyncLogs(prev => [...prev, { timestamp, message: `[AD CONNECTOR] Mapping AD Security Groups to AWS Identity metadata templates`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 800));

    if (mappedGroup === 'admins') {
      setSyncLogs(prev => [
        ...prev,
        { timestamp, message: `[MAPPING] Synced AD Group "AWS-Domain-Admins" to IAM Permission Set [AdministratorAccess]`, type: 'info' },
        { timestamp, message: `[ROLE ENVELOPE] Generating cross-account STS AssumeRole credentials...`, type: 'info' },
        { timestamp, message: `[DEPLOY] Associated administrator trust roles to AWS target accounts: Account E & Account F (Prod)`, type: 'success' }
      ]);
    } else if (mappedGroup === 'analysts') {
      setSyncLogs(prev => [
        ...prev,
        { timestamp, message: `[MAPPING] Synced AD Group "AWS-Security-Analysts" to Permission Set [ReadOnlyAccess]`, type: 'info' },
        { timestamp, message: `[DEPLOY] Configured audit read-only IAM access profiles for Account D (Test) & Sandbox accounts...`, type: 'success' }
      ]);
    } else {
      // billing
      setSyncLogs(prev => [
        ...prev,
        { timestamp, message: `[MAPPING] Synced AD Group "AWS-Finance-Operators" to Permission Set [BillingReadOnlyAccess]`, type: 'info' },
        { timestamp, message: `[DEPLOY] Associated consolidated billing and cost analysis access roles to Root Master Account.`, type: 'success' }
      ]);
    }

    await new Promise(r => setTimeout(r, 800));
    setSyncLogs(prev => [...prev, { timestamp, message: `[COMPLETED] IAM Identity Center directories synchronized cleanly with AD. Enterprise SSO active.`, type: 'success' }]);
    setSyncState('success');
  };

  const resetSyncSim = () => {
    setSyncState('idle');
    setSyncLogs([]);
  };

  // ==========================================
  // TAB 5 SIMULATION LOGIC: Control Tower Sandbox
  // ==========================================
  const triggerAuditAction = async () => {
    if (complianceState !== 'idle') return;
    setComplianceState('deploying');
    setComplianceLogs([]);
    const timestamp = new Date().toLocaleTimeString();

    if (auditAction === 'deploy_public_s3') {
      setComplianceLogs(prev => [...prev, { timestamp, message: `[API DISPATCH] Admin alice_dev invokes PutBucketPolicy making S3 bucket public...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 600));

      setComplianceLogs(prev => [...prev, { timestamp, message: `[CONTROL TOWER] Checking preventive control filters...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 800));

      if (selectedGuardrail === 'deny_public_s3') {
        setComplianceLogs(prev => [
          ...prev,
          { timestamp, message: `[PREVENTED] Locked by SCP: Preventive guardrail "s3-bucket-public-read-prohibited" intercepts request!`, type: 'error' },
          { timestamp, message: `[HALTED] API execution terminated at landing zone boundary. Resource not deployed.`, type: 'error' }
        ]);
        setComplianceState('evaluated');
      } else {
        setComplianceLogs(prev => [
          ...prev,
          { timestamp, message: `[DEPLOYED] Success! S3 bucket s3://corporate-confidential-vault successfully opened to public.`, type: 'warn' },
          { timestamp, message: `⚠️ [DETECTIVE TRIGGER] Detective guardrail AWS Config rule "s3-public-prohibited" initiates baseline audit...`, type: 'warn' }
        ]);
        await new Promise(r => setTimeout(r, 1000));
        setNonCompliantCount(1);
        setComplianceLogs(prev => [
          ...prev,
          { timestamp, message: `[NON_COMPLIANT] 🚨 AWS CONFIG VIOLATION: corporate-confidential-vault flagged as NON_COMPLIANT!`, type: 'error' }
        ]);
        setComplianceState('evaluated');
      }
    } else if (auditAction === 'deploy_unencrypted_ebs') {
      setComplianceLogs(prev => [...prev, { timestamp, message: `[API DISPATCH] User Bob launches new 50GB EBS block storage...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 600));

      setComplianceLogs(prev => [
        ...prev,
        { timestamp, message: `[DEPLOYED] Vol-09a8bc8172 deployed successfully. Encryption: [DISABLED]`, type: 'warn' },
        { timestamp, message: `🔍 [DETECTIVE TRIGGER] Detective Guardrail evaluation: "ebs-encryption-by-default-enabled" check active...`, type: 'warn' }
      ]);
      await new Promise(r => setTimeout(r, 1000));

      if (selectedGuardrail === 'detect_unencrypted_ebs') {
        setNonCompliantCount(1);
        setComplianceLogs(prev => [
          ...prev,
          { timestamp, message: `[NON_COMPLIANT] 🚨 Guardrail Rule breached: Volume Vol-09a8bc8172 is non-compliant!`, type: 'error' },
          { timestamp, message: `[REMEDIATION] Control Tower launches SSM automated remediation runbook: "AWS-EncryptEBSVolume"`, type: 'info' }
        ]);
        await new Promise(r => setTimeout(r, 1200));
        setComplianceState('remediated');
        setNonCompliantCount(0);
        setComplianceLogs(prev => [
          ...prev,
          { timestamp, message: `[REMEDIATED] Success! Detached, re-encrypted, and re-attached volume cleanly. State: [COMPLIANT]`, type: 'success' },
          { timestamp, message: `[CONTROL TOWER] Configuration recorder synchronized. Landing Zone secure.`, type: 'success' }
        ]);
      } else {
        setNonCompliantCount(1);
        setComplianceLogs(prev => [
          ...prev,
          { timestamp, message: `[NON_COMPLIANT] 🚨 System remains in breach! Detective guardrail is unassigned. Continuous audit alert raised.`, type: 'error' }
        ]);
        setComplianceState('evaluated');
      }
    } else {
      // invoke_root_api
      setComplianceLogs(prev => [...prev, { timestamp, message: `[API DISPATCH] Rogue API call triggered utilizing Root account credentials...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 600));

      setComplianceLogs(prev => [...prev, { timestamp, message: `[CONTROL TOWER] Checking preventive control filters...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 800));

      if (selectedGuardrail === 'block_root_api') {
        setComplianceLogs(prev => [
          ...prev,
          { timestamp, message: `[PREVENTED] Locked by SCP: Preventive guardrail "block-root-credentials-api" drops raw execution!`, type: 'error' },
          { timestamp, message: `[HALTED] 403 AccessDenied - Root API operations are forbidden in this landing zone.`, type: 'error' }
        ]);
        setComplianceState('evaluated');
      } else {
        setComplianceLogs(prev => [
          ...prev,
          { timestamp, message: `[COMPLETED] WARNING: Root user successfully bypassed Landing Zone checks. Critical audit baseline drift recorded!`, type: 'error' }
        ]);
        setComplianceState('evaluated');
      }
    }
  };

  const resetComplianceSim = () => {
    setComplianceState('idle');
    setComplianceLogs([]);
    setNonCompliantCount(0);
  };

  return (
    <div className="da-container animate-fadeIn">
      {/* Dynamic isolated visualizer css definitions */}
      <style>{`
        .da-container {
          font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
          color: var(--da-text);
          background-color: var(--da-bg);
          padding: 20px;
          border-radius: 16px;
          transition: all 0.25s ease;

          /* Light Mode Colors */
          --da-bg: #f8fafc;
          --da-text: #1e293b;
          --da-text-title: #0f172a;
          --da-text-muted: #475569;
          --da-card-bg: rgba(255, 255, 255, 0.75);
          --da-card-border: rgba(226, 232, 240, 0.85);
          --da-card-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.08), 0 2px 8px -1px rgba(148, 163, 184, 0.04);
          
          --da-tab-bg: rgba(255, 255, 255, 0.85);
          --da-tab-border: rgba(226, 232, 240, 0.85);
          --da-tab-text: #475569;
          --da-tab-hover-bg: #f8fafc;
          --da-tab-hover-border: #cbd5e1;
          --da-tab-hover-text: #1e293b;
          
          --da-input-bg: #ffffff;
          --da-input-color: #0f172a;
          --da-input-border: rgba(226, 232, 240, 0.85);
          
          --da-btn-sec-bg: #ffffff;
          --da-btn-sec-color: #334155;
          --da-btn-sec-border: #cbd5e1;
          --da-btn-sec-hover-bg: #f1f5f9;
          
          --da-code-bg: #090d16;
          --da-code-border: #1e293b;
          --da-code-text: #94a3b8;
          
          --da-table-border: rgba(226, 232, 240, 0.85);
          --da-table-th-bg: #f8fafc;
          --da-table-th-text: #475569;
          --da-table-td-text: #334155;
          --da-table-hover-bg: #f8fafc;

          --da-main-content-bg: #ffffff;
          --da-main-content-border: #e2e8f0;

          /* SVG standard colors */
          --da-svg-bg: #ffffff;
          --da-svg-grid: radial-gradient(rgba(37, 99, 235, 0.03) 1.5px, transparent 1.5px);
          --da-svg-text-dark: #1e293b;
          --da-svg-text-light: #ffffff;
          
          --da-svg-indigo-bg: #eff6ff;
          --da-svg-indigo-border: #3b82f6;
          --da-svg-indigo-text: #1e3a8a;
          
          --da-svg-green-bg: #f0fdf4;
          --da-svg-green-border: #10b981;
          --da-svg-green-text: #065f46;
          
          --da-svg-red-bg: #fee2e2;
          --da-svg-red-border: #f43f5e;
          --da-svg-red-text: #991b1b;
          
          --da-svg-purple-bg: #faf5ff;
          --da-svg-purple-border: #a855f7;
          --da-svg-purple-text: #7e22ce;
          
          --da-svg-amber-bg: #fffbeb;
          --da-svg-amber-border: #d97706;
          --da-svg-amber-text: #78350f;

          --da-svg-node-fill: #ffffff;
          --da-svg-node-border: #cbd5e1;
        }

        .dark .da-container {
          background-color: #020617 !important;
          color: #cbd5e1 !important;

          /* Dark Mode Colors */
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
          
          --da-btn-sec-bg: rgba(15, 23, 42, 0.8);
          --da-btn-sec-color: #cbd5e1;
          --da-btn-sec-border: rgba(51, 65, 85, 0.6);
          --da-btn-sec-hover-bg: rgba(30, 41, 59, 0.8);
          
          --da-code-bg: #020617;
          --da-code-border: rgba(51, 65, 85, 0.6);
          --da-code-text: #38bdf8;
          
          --da-table-border: rgba(51, 65, 85, 0.6);
          --da-table-th-bg: rgba(15, 23, 42, 0.8);
          --da-table-th-text: #94a3b8;
          --da-table-td-text: #cbd5e1;
          --da-table-hover-bg: rgba(30, 41, 59, 0.4);

          --da-main-content-bg: rgba(15, 23, 42, 0.5);
          --da-main-content-border: rgba(51, 65, 85, 0.6);

          /* SVG standard colors */
          --da-svg-bg: #020617;
          --da-svg-grid: radial-gradient(rgba(51, 65, 85, 0.5) 1.2px, transparent 1.2px);
          --da-svg-text-dark: #cbd5e1;
          --da-svg-text-light: #ffffff;
          
          --da-svg-indigo-bg: rgba(59, 130, 246, 0.15);
          --da-svg-indigo-border: rgba(59, 130, 246, 0.5);
          --da-svg-indigo-text: #60a5fa;
          
          --da-svg-green-bg: rgba(16, 185, 129, 0.15);
          --da-svg-green-border: rgba(16, 185, 129, 0.4);
          --da-svg-green-text: #4ade80;
          
          --da-svg-red-bg: rgba(244, 63, 94, 0.15);
          --da-svg-red-border: rgba(244, 63, 94, 0.5);
          --da-svg-red-text: #f87171;
          
          --da-svg-purple-bg: rgba(168, 85, 247, 0.15);
          --da-svg-purple-border: rgba(168, 85, 247, 0.5);
          --da-svg-purple-text: #c084fc;
          
          --da-svg-amber-bg: rgba(245, 158, 11, 0.15);
          --da-svg-amber-border: rgba(245, 158, 11, 0.5);
          --da-svg-amber-text: #fbbf24;

          --da-svg-node-fill: rgba(15, 23, 42, 0.8);
          --da-svg-node-border: rgba(51, 65, 85, 0.8);
        }

        .acad-dir-container {
          background: var(--da-card-bg);
          border: 1px solid var(--da-card-border);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--da-card-shadow);
        }
        .acad-dir-header {
          padding: 10px 14px;
          background: var(--da-tab-bg);
          border-bottom: 1px solid var(--da-card-border);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--da-text-title);
        }
        .acad-dir-folder-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 700;
          border: none;
          background: var(--da-card-bg);
          color: var(--da-text);
          border-bottom: 1px solid var(--da-card-border);
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .acad-dir-folder-btn:hover {
          background: var(--da-tab-hover-bg);
          color: var(--da-text-title);
        }
        .acad-dir-item-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px 8px 24px;
          font-size: 11px;
          font-weight: 600;
          color: var(--da-text-muted);
          border: none;
          border-left: 3px solid transparent;
          background: var(--da-card-bg);
          transition: all 0.15s ease;
          text-align: left;
          cursor: pointer;
        }
        .acad-dir-item-btn:hover {
          background: var(--da-tab-hover-bg);
          color: var(--da-text-title);
          border-left-color: var(--da-card-border);
        }
        .acad-dir-item-btn.acad-active {
          background: rgba(37, 99, 235, 0.12);
          color: #2563eb;
          border-left-color: #2563eb;
          font-weight: 800;
        }
        .dark .acad-dir-item-btn.acad-active {
          background: rgba(96, 165, 250, 0.2);
          color: #60a5fa;
          border-left-color: #60a5fa;
        }
        .acad-detail-card {
          background: var(--da-card-bg);
          border: 1px solid var(--da-card-border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: var(--da-card-shadow);
        }
        .acad-hero-badge {
          background: rgba(37, 99, 235, 0.1);
          border: 1.5px solid rgba(37, 99, 235, 0.3);
          color: #1d4ed8;
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
          background: rgba(96, 165, 250, 0.18);
          border-color: rgba(96, 165, 250, 0.4);
          color: #93c5fd;
        }
        .acad-plain-english {
          background: rgba(37, 99, 235, 0.08);
          border-left: 4px solid #2563eb;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 16px;
          font-size: 12.5px;
          line-height: 1.6;
          color: var(--da-text);
          border-top: 1px solid var(--da-card-border);
          border-right: 1px solid var(--da-card-border);
          border-bottom: 1px solid var(--da-card-border);
        }
        .dark .acad-plain-english {
          background: rgba(37, 99, 235, 0.18);
          color: #f1f5f9;
        }
        .acad-analogy-box {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%);
          border: 1.5px solid rgba(245, 158, 11, 0.35);
          border-radius: 12px;
          padding: 16px;
          margin: 16px 0;
          font-size: 12px;
          line-height: 1.6;
          color: var(--da-text);
        }
        .dark .acad-analogy-box {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(217, 119, 6, 0.06) 100%);
          border-color: rgba(245, 158, 11, 0.4);
          color: #f1f5f9;
        }
        .acad-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--da-table-border);
        }
        .acad-table th {
          background: var(--da-table-th-bg);
          color: var(--da-table-th-text);
          font-weight: 800;
          padding: 10px 12px;
          border-bottom: 1.5px solid var(--da-table-border);
          text-align: left;
        }
        .acad-table td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--da-table-border);
          color: var(--da-table-td-text);
        }
        .acad-terminal {
          background: #090d16;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 12px;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          color: #cbd5e1;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
        }
        .acad-advice-box {
          background: var(--da-card-bg);
          border: 1px solid var(--da-card-border);
          color: var(--da-text-muted);
        }

        .da-card {
          background: var(--da-card-bg);
          border: 1.5px solid var(--da-card-border);
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: var(--da-card-shadow);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
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
          background-color: var(--da-svg-bg) !important;
          background-image: var(--da-svg-grid) !important;
          background-size: 16px 16px;
          border: 1.5px solid var(--da-card-border);
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
        
        .pulse-circle {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        /* Scoped styling overrides inside da-container */
        .da-container h1,
        .da-container h2,
        .da-container h3,
        .da-container h4,
        .da-container th {
          color: var(--da-text-title) !important;
        }
        
        .da-container p,
        .da-container td,
        .da-container li {
          color: var(--da-text-muted) !important;
        }

        .da-container .text-slate-900,
        .da-container .text-slate-800,
        .da-container .text-slate-700,
        .da-container .text-gray-900,
        .da-container .text-blue-950,
        .da-container .text-blue-900 {
          color: var(--da-text-title) !important;
        }
        
        .da-container .text-slate-650,
        .da-container .text-slate-600,
        .da-container .text-slate-500 {
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
        .da-container .border-gray-200 {
          border-color: var(--da-card-border) !important;
        }

        .dark .da-terminal,
        .dark .da-log {
          background: #020617 !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #38bdf8 !important;
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
          `}</style>

      {/* Header bar */}
      <Translate>
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 mb-6 text-left">
          <div className="flex items-center gap-3">
            <span className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
              <Shield className="w-6 h-6 stroke-[2]" />
            </span>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                AWS Governance, Identity &amp; Landing Zones
                <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                  PRO EDITION
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">Explore multi-account structures, hierarchical SCP evaluations, fine-grained IAM conditions, AD Single Sign-On syncing, and Control Tower landing zones.</p>
            </div>
          </div>
        </div>
      </Translate>

      {/* Tab navigation bar */}
      {!isComparative && (
        <Translate>
        <div className="da-tabs">
          <button className={`da-tb ${activeTab === 'notebook' ? 'da-on' : ''}`} onClick={() => setActiveTab('notebook')}>
            <BookOpen className="w-4 h-4 text-blue-500" /> 📖 1) Visual Notes &amp; Theories
          </button>
          <button className={`da-tb ${activeTab === 'intro' ? 'da-on' : ''}`} onClick={() => setActiveTab('intro')}>
            <Sliders className="w-4 h-4 text-emerald-500" /> 🎯 2) Governance Comparison &amp; Security
          </button>
          <button className={`da-tb ${activeTab === 'organizations' ? 'da-on' : ''}`} onClick={() => setActiveTab('organizations')}>
            <Building className="w-4 h-4" /> 🏢 3) SCP Multi-OU Hierarchy
          </button>
          <button className={`da-tb ${activeTab === 'iam' ? 'da-on' : ''}`} onClick={() => setActiveTab('iam')}>
            <Key className="w-4 h-4" /> 🔑 4) Fine-Grained IAM Resolution
          </button>
          <button className={`da-tb ${activeTab === 'identitycenter' ? 'da-on' : ''}`} onClick={() => setActiveTab('identitycenter')}>
            <Users className="w-4 h-4" /> 👥 5) SSO Active Directory Mapping
          </button>
          <button className={`da-tb ${activeTab === 'compliance' ? 'da-on' : ''}`} onClick={() => setActiveTab('compliance')}>
            <Activity className="w-4 h-4" /> 🛡️ 6) Guardrails Compliance Auditor
          </button>
          <button className={`da-tb ${activeTab === 'unique' ? 'da-on' : ''}`} onClick={() => setActiveTab('unique')}>
            ✨ Unique Features
          </button>
        </div>
      </Translate>
      )}

      {isComparative && (
        <GovernanceAndIdentityComparativeView onNavigateToDemo={handleNavigateToDemo} />
      )}

      {!isComparative && activeTab === 'unique' && (
        <UniqueGovernanceAndIdentityFeatures provider={provider} />
      )}

      {!isComparative && activeTab !== 'unique' && (
        <Translate>
          <>

      {/* ========================================================================= */}
      {/* TAB 1: THEORETICAL MATRIX COMPARISON & EVENTBRIDGE SECURITY               */}
      {/* ========================================================================= */}
            {activeTab === 'notebook' && (
        <div className="space-y-6 animate-fadeIn text-left" style={{ color: 'var(--da-text)' }}>
          
          {/* Header Hero Card */}
          <div className="da-card text-left" style={{ borderLeft: '4px solid #2563eb', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                  <BookOpen className="w-5 h-5 text-blue-600" /> AWS Governance, Identity &amp; Landing Zones Notes &amp; Mental Models
                </h2>
                <p className="text-xs mt-1.5 leading-relaxed font-sans font-semibold" style={{ color: 'var(--da-text-muted)' }}>
                  Simplified, beginner-friendly governance theories sorted progressively from IAM Users, Roles &amp; Policies to SCP Multi-OU Hierarchies, Identity Center SSO, SAML 2.0 Directory Federation, and Control Tower Landing Zones.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="acad-hero-badge">🎓 Beginner to Pro</span>
                <span className="acad-hero-badge" style={{ background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.35)', color: '#d97706' }}>💡 Everyday Mental Models</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Sidebar Category Explorer */}
            <div className="lg:col-span-3 space-y-4 text-left">
              <span className="text-[10px] font-black uppercase tracking-widest block pl-1 font-mono" style={{ color: 'var(--da-text-muted)' }}>Curriculum Directory:</span>
              
              <div className="acad-dir-container">
                <div className="acad-dir-header">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span>Governance Modules</span>
                </div>

                {/* LEVEL 1: IAM & AUTHENTICATION */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'iam_fundamentals' ? '' : 'iam_fundamentals')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-blue-500" />
                      🐣 Level 1 · IAM Fundamentals
                    </span>
                    {expandedCategory === 'iam_fundamentals' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'iam_fundamentals' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('iam_roles_policies')}
                        className={`acad-dir-item-btn ${selectedNote === 'iam_roles_policies' ? 'acad-active' : ''}`}
                      >
                        1.1 Users vs Roles vs Policies (Airport Badge)
                      </button>
                      <button 
                        onClick={() => setSelectedNote('iam_eval_logic')}
                        className={`acad-dir-item-btn ${selectedNote === 'iam_eval_logic' ? 'acad-active' : ''}`}
                      >
                        1.2 Policy Evaluation Logic (Explicit Deny)
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 2: ORGANIZATIONS & SCPS */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'orgs_scps' ? '' : 'orgs_scps')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-amber-500" />
                      ⚙️ Level 2 · Multi-Account &amp; SCPs
                    </span>
                    {expandedCategory === 'orgs_scps' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'orgs_scps' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('multi_account_ou')}
                        className={`acad-dir-item-btn ${selectedNote === 'multi_account_ou' ? 'acad-active' : ''}`}
                      >
                        2.1 Multi-Account Strategy &amp; OUs (HQ Franchises)
                      </button>
                      <button 
                        onClick={() => setSelectedNote('service_control_policies')}
                        className={`acad-dir-item-btn ${selectedNote === 'service_control_policies' ? 'acad-active' : ''}`}
                      >
                        2.2 Service Control Policies (Master Guardrails)
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 3: IDENTITY CENTER & FEDERATION */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'sso_federation' ? '' : 'sso_federation')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-500" />
                      🏛️ Level 3 · Identity Center &amp; SSO
                    </span>
                    {expandedCategory === 'sso_federation' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'sso_federation' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('identity_center_sso')}
                        className={`acad-dir-item-btn ${selectedNote === 'identity_center_sso' ? 'acad-active' : ''}`}
                      >
                        3.1 IAM Identity Center (Hotel Master Keycard)
                      </button>
                      <button 
                        onClick={() => setSelectedNote('active_directory_saml')}
                        className={`acad-dir-item-btn ${selectedNote === 'active_directory_saml' ? 'acad-active' : ''}`}
                      >
                        3.2 Active Directory &amp; SAML 2.0 (Passport Office)
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 4: LANDING ZONES & CONTROL TOWER */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'control_tower' ? '' : 'control_tower')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      🛡️ Level 4 · Control Tower &amp; Rules
                    </span>
                    {expandedCategory === 'control_tower' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'control_tower' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)' }}>
                      <button 
                        onClick={() => setSelectedNote('control_tower_landing_zones')}
                        className={`acad-dir-item-btn ${selectedNote === 'control_tower_landing_zones' ? 'acad-active' : ''}`}
                      >
                        4.1 AWS Control Tower (Turnkey Gated Community)
                      </button>
                      <button 
                        onClick={() => setSelectedNote('guardrails_types')}
                        className={`acad-dir-item-btn ${selectedNote === 'guardrails_types' ? 'acad-active' : ''}`}
                      >
                        4.2 Mandatory vs Proactive Guardrails
                      </button>
                    </div>
                  )}
                </div>

              </div>

              <div className="acad-advice-box rounded-2xl p-4 text-[11px] leading-relaxed font-semibold space-y-1">
                <span className="font-extrabold flex items-center gap-1.5 mb-1 text-[11.5px]" style={{ color: 'var(--da-text-title)' }}>
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Interactive Quick-Launch
                </span>
                Click any governance topic to test IAM policy evaluation rules, explore SCP guardrails, and copy security templates!
              </div>
            </div>

            {/* Right Active Note Workspace */}
            <div className="lg:col-span-9 space-y-6 text-left">

              {/* NOTE 1.1: IAM USERS VS ROLES VS POLICIES */}
              {selectedNote === 'iam_roles_policies' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🐣 Level 1 · IAM Fundamentals</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        1.1 IAM Users vs IAM Roles vs Policies
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('iam')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to IAM Resolution Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> AWS IAM controls access to cloud resources:
                    <br />• <strong>IAM User</strong>: A permanent identity assigned to a single person with long-term credentials (password / API keys).
                    <br />• <strong>IAM Role</strong>: A temporary identity assumed by applications, EC2 instances, or federated users using temporary credentials (`sts:AssumeRole`).
                    <br />• <strong>IAM Policy</strong>: A JSON document defining exactly what actions are **Allowed** or **Denied** (`Effect`, `Action`, `Resource`, `Condition`).
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Name Badge vs Security Uniform vs Rulebook
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      • <strong>IAM User (Personal ID Badge)</strong>: Your driver&apos;s license with your photo permanently printed on it.
                      <br />• <strong>IAM Role (Security Guard Uniform)</strong>: An employee badge hung on a hook. Anyone who puts on the security guard jacket (Assumes Role) gains access to the security control room for 1 shift!
                      <br />• <strong>IAM Policy (Building Rulebook)</strong>: A printed sheet stating &ldquo;Pass-holders may enter Floor 3, but cannot enter Vault 9&rdquo;.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="acad-table">
                      <thead>
                        <tr>
                          <th>IAM Primitive</th>
                          <th>Credential Lifespan</th>
                          <th>Best Suited For</th>
                          <th>Security Best Practice</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>IAM User</strong></td>
                          <td>Long-term (Static Access Keys)</td>
                          <td>Legacy applications requiring hardcoded keys</td>
                          <td>Avoid! Rotate keys every 90 days or use IAM Roles instead</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>IAM Role</strong></td>
                          <td>Temporary (15 mins to 12 hours via STS)</td>
                          <td>EC2 instances, Lambda functions, SSO users</td>
                          <td>Recommended! Uses automatic temporary token rotation</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>IAM Policy</strong></td>
                          <td>N/A (JSON Rule Definition)</td>
                          <td>Defining granular permission boundaries</td>
                          <td>Enforce Least Privilege (Never use `Action: "*"` in Prod)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Copyable IAM Role Trust Policy */}
                  <div className="acad-advice-box p-4 rounded-xl flex flex-col justify-between" style={{ background: 'var(--da-card-bg)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--da-text-muted)' }}>EC2 IAM Role Trust Policy Snippet</span>
                      <button 
                        onClick={() => {
                          const snippet = `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Effect": "Allow",\n      "Principal": { "Service": "ec2.amazonaws.com" },\n      "Action": "sts:AssumeRole"\n    }\n  ]\n}`;
                          navigator.clipboard.writeText(snippet);
                          setCopiedNoteId('trust-policy');
                          setTimeout(() => setCopiedNoteId(null), 2000);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-mono flex items-center gap-1 transition-all"
                      >
                        {copiedNoteId === 'trust-policy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <pre className="acad-terminal text-[9.5px] leading-relaxed overflow-x-auto h-24">
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              )}

              {/* NOTE 1.2: IAM EVALUATION LOGIC */}
              {selectedNote === 'iam_eval_logic' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🐣 Level 1 · IAM Fundamentals</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        1.2 IAM Policy Evaluation Engine: Explicit Deny Overrides All
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('iam')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to IAM Resolution Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> By default, all requests to AWS resources are **Implicitly Denied**. To access a resource, an **Explicit Allow** statement must be present. However, if a single policy contains an **Explicit Deny** statement (`Effect: "Deny"`), the request is **IMMEDIATELY REJECTED**, overriding all Allows!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Strict Nightclub Bouncer Rulebook
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      Imagine a nightclub bouncer checking tickets:
                      <br />1. If you have no ticket, you are turned away by default (Implicit Deny).
                      <br />2. If you have a VIP Pass (`Allow`), you are allowed inside.
                      <br />3. But if the club owner puts your photo on the &ldquo;Banned Guest List&rdquo; (`Explicit Deny`), you are turned away immediately—even if you hold 10 VIP Passes!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 2.1: MULTI-ACCOUNT STRATEGY & OUS */}
              {selectedNote === 'multi_account_ou' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">⚙️ Level 2 · Multi-Account &amp; SCPs</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        2.1 AWS Organizations: Multi-Account Strategy &amp; Organizational Units (OUs)
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('organizations')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to SCP Hierarchy Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Running an entire company inside a single AWS account creates a massive blast radius. **AWS Organizations** allows you to consolidate multiple AWS accounts into a tree structure of **Organizational Units (OUs)** (e.g. `Workloads/Prod`, `Workloads/Test`, `Sandbox`, `Security`), isolating environments cleanly!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Corporate Headquarters &amp; Department Floors
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      Instead of putting 500 employees into 1 giant room with no walls (Single AWS Account), corporate headquarters builds separate floors: Accounting Floor, R&amp;D Sandbox, Production Manufacturing. If a chemical spill occurs on the Sandbox Floor, it never contaminates the Accounting department!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 2.2: SERVICE CONTROL POLICIES (SCPS) */}
              {selectedNote === 'service_control_policies' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">⚙️ Level 2 · Multi-Account &amp; SCPs</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        2.2 Service Control Policies (SCPs): Organizational Guardrails
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('organizations')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to SCP Hierarchy Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **Service Control Policies (SCPs)** set the maximum permissions boundary for member accounts in an organization. SCPs do **NOT grant permissions** by themselves; they restrict what member account Root and IAM administrators are allowed to do (e.g., blocking unapproved AWS regions or denying root user actions).
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Corporate Building Master Guardrail Height
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      A store manager can write any employee rulebook they want (`IAM Policy`). However, corporate headquarters sets steel perimeter guardrails (`SCP`). No matter what the store manager writes, employees cannot open the store outside approved business hours!
                    </p>
                  </div>

                  {/* Copyable SCP Policy Snippet */}
                  <div className="acad-advice-box p-4 rounded-xl flex flex-col justify-between" style={{ background: 'var(--da-card-bg)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--da-text-muted)' }}>SCP JSON: Restrict Unapproved Regions</span>
                      <button 
                        onClick={() => {
                          const snippet = `{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Sid": "DenyUnapprovedRegions",\n      "Effect": "Deny",\n      "NotAction": [\n        "iam:*", "cloudfront:*", "route53:*", "support:*"\n      ],\n      "Resource": "*",\n      "Condition": {\n        "StringNotEquals": {\n          "aws:RequestedRegion": ["us-east-1", "eu-west-1"]\n        }\n      }\n    }\n  ]\n}`;
                          navigator.clipboard.writeText(snippet);
                          setCopiedNoteId('scp-policy');
                          setTimeout(() => setCopiedNoteId(null), 2000);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-mono flex items-center gap-1 transition-all"
                      >
                        {copiedNoteId === 'scp-policy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <pre className="acad-terminal text-[9.5px] leading-relaxed overflow-x-auto h-28">
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyUnapprovedRegions",
      "Effect": "Deny",
      "NotAction": ["iam:*", "cloudfront:*", "route53:*"],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": { "aws:RequestedRegion": ["us-east-1"] }
      }
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              )}

              {/* NOTE 3.1: IAM IDENTITY CENTER */}
              {selectedNote === 'identity_center_sso' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🏛️ Level 3 · Identity Center &amp; SSO</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        3.1 AWS IAM Identity Center (Successor to AWS Single Sign-On)
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('identitycenter')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to SSO &amp; Directory Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Instead of creating individual IAM Users in 50 separate AWS accounts, **IAM Identity Center** lets users log in once with Single Sign-On (SSO) and access all assigned accounts and roles from a single web portal!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Hotel Master Wristband
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      Instead of carrying 50 separate room keys in your pocket (50 IAM user passwords), hotel reception hands you 1 electronic wristband (IAM Identity Center SSO). You tap your wristband at the pool, gym, restaurant, and penthouse suite!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 3.2: ACTIVE DIRECTORY & SAML 2.0 */}
              {selectedNote === 'active_directory_saml' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🏛️ Level 3 · Identity Center &amp; SSO</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        3.2 Active Directory Federation &amp; SAML 2.0 Integration
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('identitycenter')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to SSO &amp; Directory Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Enterprise identity federation connects corporate directories (Microsoft Entra ID, Active Directory, Okta, Google Workspace) to AWS via **SAML 2.0**. Employees log into AWS using their corporate email and password—and when an employee leaves the company, revoking their corporate account instantly revokes all AWS access!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Corporate Passport Exchange Office
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      When visiting an international branch office (AWS), you don&apos;t apply for a local driver&apos;s license. You show your verified government passport (Active Directory SAML 2.0 assertion), and the branch office hands you a temp visitor badge!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 4.1: CONTROL TOWER */}
              {selectedNote === 'control_tower_landing_zones' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🛡️ Level 4 · Control Tower &amp; Rules</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        4.1 AWS Control Tower &amp; Automated Landing Zones
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('compliance')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Guardrails Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **AWS Control Tower** sets up an automated, secure multi-account environment called a **Landing Zone**. It provisions new AWS accounts in minutes via an Account Factory, pre-configured with AWS Organizations, IAM Identity Center, Config rules, and CloudTrail log archiving!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Pre-Fab Turnkey Gated Community Factory
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      Instead of building a house from scratch by laying bricks, digging plumbing, and wiring electricity (Manual AWS Setup), a pre-fab factory (AWS Control Tower) drops a fully finished modular home onto the lot in 15 minutes—complete with working smoke alarms, security locks, and power grid hookups!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 4.2: GUARDRAILS TYPES */}
              {selectedNote === 'guardrails_types' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🛡️ Level 4 · Control Tower &amp; Rules</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        4.2 Mandatory, Preventive &amp; Proactive Guardrails
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('compliance')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Guardrails Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Control Tower enforces 3 types of guardrails:
                    <br />• <strong>Preventive (SCPs)</strong>: Blocks unapproved actions before they happen (e.g., prevents disallowing CloudTrail).
                    <br />• <strong>Detecting (AWS Config)</strong>: Audit rules that flag non-compliant resources (e.g. unencrypted S3 buckets).
                    <br />• <strong>Proactive (CloudFormation Hooks)</strong>: Scans IaC templates during deployment, stopping bad code before resource creation!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Locked Emergency Brake vs Inspection Siren vs Architectural Blueprint Check
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      • <strong>Preventive (Locked Emergency Brake)</strong>: Stops a driver from shifting into reverse while cruising at 70 MPH.
                      <br />• <strong>Detecting (Oil Change Warning Light)</strong>: Sounds a chime when oil level drops below safety threshold.
                      <br />• <strong>Proactive (Architectural Blueprint Inspection)</strong>: Rejects a house construction plan before the first brick is laid if walls are missing fireproofing!
                    </p>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}


        {activeTab === 'intro' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left selector sidebar */}
            <div className="lg:col-span-4 da-card flex flex-col justify-between text-left">
              <div>
                <h3 className="da-card-title text-blue-700">
                  <SlidersHorizontal className="w-5 h-5" /> Comparative Matrix Toggles
                </h3>
                <p className="da-card-desc mb-5">
                  Understand the specific scopes, triggers, and targets of enterprise governance tiers before designing multi-account topologies.
                </p>

                <div className="space-y-2 text-xs">
                  <button
                    onClick={() => setSelectedTopic('organizations')}
                    className={`w-full p-3 text-left border rounded-xl transition-all ${
                      selectedTopic === 'organizations'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold'
                    }`}
                  >
                    🏢 AWS Organizations &amp; SCP Boundaries
                    <span className="block text-[9px] text-slate-400 font-medium mt-0.5">Consolidated billing, nesting limits, maximum permission filters</span>
                  </button>

                  <button
                    onClick={() => setSelectedTopic('iam')}
                    className={`w-full p-3 text-left border rounded-xl transition-all ${
                      selectedTopic === 'iam'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold'
                    }`}
                  >
                    🔑 Fine-Grained IAM Permission Policies
                    <span className="block text-[9px] text-slate-400 font-medium mt-0.5">Source IP filters, ABAC tagging rules, MFA enforcement policies</span>
                  </button>

                  <button
                    onClick={() => setSelectedTopic('identitycenter')}
                    className={`w-full p-3 text-left border rounded-xl transition-all ${
                      selectedTopic === 'identitycenter'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold'
                    }`}
                  >
                    👥 IAM Identity Center Portal (SSO)
                    <span className="block text-[9px] text-slate-400 font-medium mt-0.5">SSO access profiles, cross-account permission set syncing</span>
                  </button>

                  <button
                    onClick={() => setSelectedTopic('ad')}
                    className={`w-full p-3 text-left border rounded-xl transition-all ${
                      selectedTopic === 'ad'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold'
                    }`}
                  >
                    📂 Active Directory Service Relays
                    <span className="block text-[9px] text-slate-400 font-medium mt-0.5">Managed AD hosts, AD Connector proxies, Simple AD pools</span>
                  </button>

                  <button
                    onClick={() => setSelectedTopic('controltower')}
                    className={`w-full p-3 text-left border rounded-xl transition-all ${
                      selectedTopic === 'controltower'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold'
                    }`}
                  >
                    🛡️ AWS Control Tower &amp; Landing Zones
                    <span className="block text-[9px] text-slate-400 font-medium mt-0.5">Automated Account Factory pipelines, guardrails, continuous audtis</span>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-150 rounded-xl p-3 text-[11px] leading-relaxed text-blue-900 mt-6 font-medium">
                <span className="font-extrabold text-blue-950 block mb-1">Architect's Security Guideline:</span>
                "AWS Organizations sets multi-account boundaries. Control Tower automates landing zones. Identity Center syncs AD groups. IAM resolves fine-grained permissions inside accounts."
              </div>
            </div>

            {/* Right theoretical display panel + EventBridge Target Security */}
            <div className="lg:col-span-8 space-y-6 text-left">
              
              {/* Context deep-dive */}
              <div className="da-card space-y-3">
                <h3 className="da-card-title text-slate-800">
                  <BookOpen className="w-5 h-5 text-blue-500" /> Deep-Dive: Identity Management &amp; Landings
                </h3>

                {selectedTopic === 'organizations' && (
                  <div className="space-y-3 animate-fadeIn text-xs leading-relaxed text-slate-600">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <span className="font-extrabold text-blue-700 block mb-1.5 text-[12.5px]">🏢 AWS Organizations &amp; OU Account Hierarchies</span>
                      <p className="mb-2">
                        AWS Organizations enables consolidated multi-account partitioning governed by maximum permission limits:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Organizational Units (OUs):</strong> Logical nesting structures (up to 5 levels deep) to group child AWS accounts based on environments (Security, Test, Prod).</li>
                        <li><strong>Service Control Policies (SCPs):</strong> JSON rules that define the maximum permissions for accounts under an OU. **SCPs act as a filter and cannot grant access**; they only restrict.</li>
                        <li><strong>Consolidated Billing:</strong> Consolidated volume discounts and consolidated billing indexes across all organization nodes.</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 border border-blue-150 rounded-xl p-3 text-blue-900">
                      <span className="font-bold text-blue-950 block">🔑 Memory Hook:</span>
                      "An SCP is a maximum capacity filter. If an SCP explicitly DENIES s3:*, no developer, admin, or even root user inside the child account can touch S3."
                    </div>
                  </div>
                )}

                {selectedTopic === 'iam' && (
                  <div className="space-y-3 animate-fadeIn text-xs leading-relaxed text-slate-600">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <span className="font-extrabold text-blue-700 block mb-1.5 text-[12.5px]">🔑 Fine-Grained AWS IAM &amp; Conditions</span>
                      <p className="mb-2">
                        IAM evaluates fine-grained permissions inside an individual account using powerful condition keys:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>aws:SourceIp:</strong> Restricts API invocation to corporate subnets (e.g. `192.0.2.0/24`), blocking external requests instantly.</li>
                        <li><strong>aws:MultiFactorAuthPresent:</strong> Forces MFA verification (using `BoolIfExists: false` deny statements) before allowing critical compute or database updates.</li>
                        <li><strong>ABAC (Attribute-Based Access Control):</strong> Matches user and resource tags dynamically (e.g., allow modifications only if User Tag `Dept == Data` matches Resource Tag `project == DataAnalytics`).</li>
                        <li><strong>aws:RequestedRegion:</strong> Limits API execution to specific deployment regions (e.g., allow database provisioning only in `eu-central-1`).</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 border border-blue-150 rounded-xl p-3 text-blue-900">
                      <span className="font-bold text-blue-950 block">🔑 Memory Hook:</span>
                      "IAM Conditions add context-aware security. Always verify both user properties (MFA, IP) and attribute tags (ABAC) to deploy true zero-trust boundaries."
                    </div>
                  </div>
                )}

                {selectedTopic === 'identitycenter' && (
                  <div className="space-y-3 animate-fadeIn text-xs leading-relaxed text-slate-600">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <span className="font-extrabold text-blue-700 block mb-1.5 text-[12.5px]">👥 IAM Identity Center (Formerly AWS SSO)</span>
                      <p className="mb-2">
                        Centralizes user identity directory access and SSO access profiles across corporate AWS environments:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Permission Sets:</strong> Central IAM role templates (e.g., AdministratorAccess, ReadOnlyAccess) mapped to target accounts.</li>
                        <li><strong>Single Sign-On Portal:</strong> One unified entry console for developers to assume role profiles across multiple child accounts.</li>
                        <li><strong>SCIM Active Directory Syncing:</strong> Synchronizes directory groups to permission sets automatically without rebuilding IAM credentials.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {selectedTopic === 'ad' && (
                  <div className="space-y-3 animate-fadeIn text-xs leading-relaxed text-slate-600">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <span className="font-extrabold text-blue-700 block mb-1.5 text-[12.5px]">📂 AWS Directory Service Integration Styles</span>
                      <p className="mb-2">
                        Choose the appropriate integration connector based on on-premises requirements:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Managed Microsoft AD:</strong> Fully managed native Microsoft Active Directory running in the AWS cloud. Supports Kerberos and schema extensions.</li>
                        <li><strong>AD Connector:</strong> An active directory proxy redirecting authentication requests back to on-premises domain controllers. Bypasses cloud sync storage.</li>
                        <li><strong>Simple AD:</strong> Low-cost, Samba-compatible hosted directory pool fit for basic user catalogs and Linux hosts.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {selectedTopic === 'controltower' && (
                  <div className="space-y-3 animate-fadeIn text-xs leading-relaxed text-slate-600">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <span className="font-extrabold text-blue-700 block mb-1.5 text-[12.5px]">🛡️ AWS Control Tower &amp; Landing Zones</span>
                      <p className="mb-2">
                        Governs multi-account baselines continuously using pre-configured security guardrails:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Preventive Guardrails:</strong> Deploy SCPs to block unsafe operations at the API gateway level.</li>
                        <li><strong>Detective Guardrails:</strong> Deploy AWS Config Rules to audit drift, anomalies, and unencrypted resources after creation.</li>
                        <li><strong>Account Factory:</strong> Standardized account provisioning pipeline, pre-enrolled with default guardrails and network VPC limits.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* EventBridge target security visual (Image 4) */}
              <div className="da-card space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="da-card-title text-slate-800 mb-0">
                    <Network className="w-5 h-5 text-blue-500" /> EventBridge Target Invocation Security
                  </h3>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10.5px]">
                    <button
                      onClick={() => setEventBridgeMode('resource_policy')}
                      className={`px-3 py-1 rounded-md font-extrabold transition-all ${eventBridgeMode === 'resource_policy' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Mode A: Resource Policy
                    </button>
                    <button
                      onClick={() => setEventBridgeMode('iam_role')}
                      className={`px-3 py-1 rounded-md font-extrabold transition-all ${eventBridgeMode === 'iam_role' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Mode B: IAM Role
                    </button>
                  </div>
                </div>

                <p className="da-card-desc">
                  EventBridge rules need security permissions to trigger targets. In **Mode A**, target services utilize resource-based policies. In **Mode B**, EventBridge assumes a service execution role.
                </p>

                {/* Resource-based support checklist from Image 4 */}
                <div className="bg-slate-55 border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center da-svg-bg">
                  <div className="w-full md:w-1/2 space-y-2 text-xs">
                    <span className="font-extrabold text-slate-850 block mb-1">Supported Resource-Based Policies:</span>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[10px] text-slate-600">
                      <div>🟢 S3 Buckets</div>
                      <div>🟢 KMS Keys</div>
                      <div>🟢 SQS Queues</div>
                      <div>🟢 SNS Topics</div>
                      <div>🟢 ECR Registries</div>
                      <div>🟢 Lambda Functions</div>
                      <div>🟢 API Gateways</div>
                      <div>🟢 EventBridge Bus</div>
                      <div>🟢 Secrets Manager</div>
                      <div>🟢 OpenSearch / Glacier</div>
                    </div>
                  </div>

                  {/* SVG diagram for EventBridge Security Mode */}
                  <div className="w-full md:w-1/2 h-56 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden flex items-center justify-center p-2">
                    <svg className="w-full h-full" viewBox="0 0 500 220">
                      <defs>
                        <marker id="arrow-eb" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-svg-node-border)" />
                        </marker>
                        <marker id="arrow-eb-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-svg-green-border)" />
                        </marker>
                        <marker id="arrow-eb-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                          <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-svg-indigo-border)" />
                        </marker>
                      </defs>

                      {/* AWS Cloud Boundary */}
                      <rect x="10" y="25" width="480" height="185" rx="8" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.2" strokeDasharray="4,3" />
                      <text x="20" y="38" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="bold">AWS Cloud Boundary</text>

                      {/* Left: Event Source */}
                      <g transform="translate(25, 80)">
                        <rect x="0" y="0" width="75" height="50" rx="6" fill="var(--da-svg-bg)" stroke="var(--da-svg-node-border)" strokeWidth="1.2" />
                        <text x="37.5" y="16" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="black" textAnchor="middle">Event Source</text>
                        <text x="37.5" y="27" fill="var(--da-svg-text-muted)" fontSize="6.5" fontWeight="bold" textAnchor="middle">S3 API / EC2</text>
                        <rect x="10" y="32" width="55" height="12" rx="2" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="0.6" />
                        <text x="37.5" y="40" fill="var(--da-svg-indigo-text)" fontSize="5.5" fontWeight="black" textAnchor="middle">State Change</text>
                      </g>

                      {/* Source -> EventBridge Bus connection */}
                      <path d="M 100 105 H 155" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" className="da-flow-blue" markerEnd="url(#arrow-eb-blue)" />

                      {/* Center: EventBridge Rule & Bus */}
                      <g transform="translate(160, 75)">
                        <rect x="0" y="0" width="90" height="60" rx="8" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" />
                        <text x="45" y="18" fill="var(--da-svg-indigo-text)" fontSize="8" fontWeight="black" textAnchor="middle">Amazon EventBridge</text>
                        <text x="45" y="30" fill="var(--da-svg-indigo-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">Event Bus</text>
                        <rect x="10" y="38" width="70" height="15" rx="3" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-indigo-border)" strokeWidth="1" />
                        <text x="45" y="48" fill="var(--da-svg-indigo-text)" fontSize="6" fontWeight="extrabold" textAnchor="middle">Rules Evaluator</text>
                      </g>

                      {eventBridgeMode === 'resource_policy' ? (
                        <>
                          {/* Flow line directly to Lambda */}
                          <path d="M 250 105 H 375" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="2.5" className="da-flow-green" markerEnd="url(#arrow-eb-green)" />
                          <text x="312" y="96" fill="var(--da-svg-green-text)" fontSize="6.5" fontWeight="black" textAnchor="middle">Direct Invocation Path</text>

                          {/* Right: Lambda Target with Resource Policy Boundary */}
                          <g transform="translate(380, 60)">
                            {/* Subnet / Resource boundary */}
                            <rect x="-8" y="-12" width="105" height="110" rx="6" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1" strokeDasharray="3,2" />
                            <text x="45" y="-3" fill="var(--da-svg-green-text)" fontSize="6.5" fontWeight="extrabold" textAnchor="middle">RESOURCE ZONE</text>

                            {/* Resource-based Policy shield border */}
                            <rect x="0" y="10" width="90" height="75" rx="4" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                            <text x="45" y="24" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="black" textAnchor="middle">AWS Lambda</text>
                            <text x="45" y="34" fill="var(--da-svg-green-text)" fontSize="6" textAnchor="middle">Target Function</text>
                            
                            {/* Shield lock gate badge representing the resource policy */}
                            <rect x="10" y="44" width="70" height="32" rx="3" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="0.8" />
                            <text x="45" y="53" fill="var(--da-svg-green-text)" fontSize="5.5" fontWeight="black" textAnchor="middle">🔒 Resource Policy</text>
                            <text x="45" y="62" fill="var(--da-svg-green-text)" fontSize="5" textAnchor="middle">events.amazonaws.com</text>
                            <text x="45" y="70" fill="var(--da-svg-green-text)" fontSize="5.5" fontWeight="black" textAnchor="middle">ALLOW: lambda:Invoke</text>
                          </g>

                          {/* Info overlay inside SVG */}
                          <rect x="25" y="180" width="450" height="20" rx="4" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="0.6" />
                          <text x="250" y="192" fill="var(--da-svg-green-text)" fontSize="7" fontWeight="bold" textAnchor="middle">
                            🟢 Mode A: Lambda target allows EventBridge service principal in its own Resource-Based Policy. No IAM Role needed.
                          </text>
                        </>
                      ) : (
                        <>
                          {/* Flow lines passing through IAM role */}
                          <path d="M 250 105 L 300 105" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.8" className="da-flow-blue" markerEnd="url(#arrow-eb-blue)" />

                          {/* IAM Role node */}
                          <g transform="translate(305, 80)">
                            <rect x="0" y="0" width="60" height="48" rx="6" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1.2" />
                            <text x="30" y="15" fill="var(--da-svg-amber-text)" fontSize="7.5" fontWeight="black" textAnchor="middle">IAM Role</text>
                            <text x="30" y="25" fill="var(--da-svg-amber-text)" fontSize="6" fontWeight="bold" textAnchor="middle">Execution Role</text>
                            <rect x="6" y="30" width="48" height="12" rx="1.5" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-amber-border)" strokeWidth="0.6" />
                            <text x="30" y="38" fill="var(--da-svg-amber-text)" fontSize="5.5" fontWeight="black" textAnchor="middle">STS:Assume</text>
                          </g>

                          {/* Connect from IAM Role to Target */}
                          <path d="M 365 105 H 375" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.8" className="da-flow-blue" markerEnd="url(#arrow-eb-blue)" />

                          {/* Right: Kinesis / SQS Target (No resource policies) */}
                          <g transform="translate(380, 60)">
                            {/* Subnet / Resource boundary */}
                            <rect x="-8" y="-12" width="105" height="110" rx="6" fill="var(--da-svg-bg)" stroke="var(--da-svg-node-border)" strokeWidth="1" strokeDasharray="3,2" />
                            <text x="45" y="-3" fill="var(--da-svg-text-dark)" fontSize="6.5" fontWeight="extrabold" textAnchor="middle">RESOURCE ZONE</text>

                            {/* Target Box */}
                            <rect x="0" y="10" width="90" height="75" rx="4" fill="var(--da-svg-bg)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                            <text x="45" y="26" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="black" textAnchor="middle">Kinesis / SQS</text>
                            <text x="45" y="38" fill="var(--da-svg-text-muted)" fontSize="6" textAnchor="middle">Stream / Queue</text>
                            
                            {/* Red Lock Gate indicating No Resource Policies exist for target */}
                            <rect x="8" y="46" width="74" height="30" rx="3" fill="var(--da-svg-red-bg)" stroke="var(--da-svg-red-border)" strokeWidth="0.8" />
                            <text x="45" y="55" fill="var(--da-svg-red-text)" fontSize="5" fontWeight="black" textAnchor="middle">⚠️ Target Limit</text>
                            <text x="45" y="63" fill="var(--da-svg-red-text)" fontSize="5" textAnchor="middle">No Resource Policy</text>
                            <text x="45" y="71" fill="var(--da-svg-red-text)" fontSize="4.5" fontWeight="extrabold" textAnchor="middle">Requires Execution Role</text>
                          </g>

                          {/* Info overlay inside SVG */}
                          <rect x="25" y="180" width="450" height="20" rx="4" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="0.6" />
                          <text x="250" y="192" fill="var(--da-svg-amber-text)" fontSize="7" fontWeight="bold" textAnchor="middle">
                            💡 Mode B: Kinesis/SQS does not support Resource Policies. EventBridge must assume the IAM Execution Role to write data.
                          </text>
                        </>
                      )}
                    </svg>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AWS ORGANIZATIONS & SCP HIERARCHY TREE (Image 3)                   */}
      {/* ========================================================================= */}
      {activeTab === 'organizations' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Building className="w-5 h-5" /> AWS Organizations &amp; Hierarchical Service Control Policies (SCPs)
            </h2>
            <p className="da-card-desc">
              AWS Organizations establishes a boundary filter across accounts. This sandbox implements the exact multi-OU tree outlined in the handwritten notebook.
              Note that **SCPs do NOT apply to the Management Account** and that whitelisting OUs restrict all other API calls dynamically.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Account Factory & Interactive Simulator */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between text-left space-y-4">
              
              {/* Account Factory form */}
              <div className="border-b border-slate-100 pb-4">
                <h3 className="font-extrabold text-xs text-slate-800 flex items-center gap-1 mb-2">
                  <Plus className="w-4 h-4 text-blue-600" /> Account Factory (Interactive Provisioner)
                </h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Account Name (e.g. Account G)"
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className="w-full p-2 border border-slate-250 rounded-xl text-xs outline-none focus:border-blue-500 font-semibold"
                  />
                  
                  <div className="flex gap-2">
                    <select
                      value={newAccountOu}
                      onChange={(e) => setNewAccountOu(e.target.value as any)}
                      className="flex-1 p-2 border border-slate-250 rounded-xl text-xs outline-none focus:border-blue-500 font-semibold text-slate-700 bg-slate-50"
                    >
                      <option value="Sandbox">Sandbox OU</option>
                      <option value="Test">Test OU (Whitelist Filter)</option>
                      <option value="Prod">Prod OU (FullAWSAccess)</option>
                    </select>

                    <button
                      onClick={createAccountAction}
                      disabled={!newAccountName}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold transition-all shadow active:scale-95 animate-fadeIn"
                    >
                      Provision
                    </button>
                  </div>
                </div>
              </div>

              {/* SCP Policies Toggle Checklist */}
              <div className="border-b border-slate-100 pb-4">
                <span className="text-xs font-extrabold text-slate-850 block mb-2">Toggle SCP Hierarchy Baselines:</span>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-bold select-none">
                    <input
                      type="checkbox"
                      checked={attachedScps.includes('DenyS3')}
                      onChange={(e) => {
                        if (e.target.checked) setAttachedScps(prev => [...prev, 'DenyS3']);
                        else setAttachedScps(prev => prev.filter(scp => scp !== 'DenyS3'));
                        setScpSimState('idle');
                      }}
                      className="rounded border-slate-350 text-blue-600 accent-blue-600 w-4 h-4"
                    />
                    📁 DenyS3 (Attached to Sandbox OU)
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-bold select-none">
                    <input
                      type="checkbox"
                      checked={attachedScps.includes('DenyEC2')}
                      onChange={(e) => {
                        if (e.target.checked) setAttachedScps(prev => [...prev, 'DenyEC2']);
                        else setAttachedScps(prev => prev.filter(scp => scp !== 'DenyEC2'));
                        setScpSimState('idle');
                      }}
                      className="rounded border-slate-350 text-blue-600 accent-blue-600 w-4 h-4"
                    />
                    💻 DenyEC2 (Attached directly to Account A)
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-bold select-none">
                    <input
                      type="checkbox"
                      checked={attachedScps.includes('AllowEC2')}
                      onChange={(e) => {
                        if (e.target.checked) setAttachedScps(prev => [...prev, 'AllowEC2']);
                        else setAttachedScps(prev => prev.filter(scp => scp !== 'AllowEC2'));
                        setScpSimState('idle');
                      }}
                      className="rounded border-slate-350 text-blue-600 accent-blue-600 w-4 h-4"
                    />
                    🌐 AllowEC2 Whitelist ONLY (Attached to Test OU)
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-bold select-none">
                    <input
                      type="checkbox"
                      checked={attachedScps.includes('DenyAthena')}
                      onChange={(e) => {
                        if (e.target.checked) setAttachedScps(prev => [...prev, 'DenyAthena']);
                        else setAttachedScps(prev => prev.filter(scp => scp !== 'DenyAthena'));
                        setScpSimState('idle');
                      }}
                      className="rounded border-slate-350 text-blue-600 accent-blue-600 w-4 h-4"
                    />
                    📊 DenyAthena (Attached to Root OU)
                  </label>
                </div>
              </div>

              {/* API Invoker Simulator */}
              <div>
                <span className="text-xs font-extrabold text-slate-850 block mb-2">Simulate API Invocation across nodes:</span>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      value={selectedNodeId}
                      onChange={(e) => {
                        setSelectedNodeId(e.target.value);
                        setScpSimState('idle');
                      }}
                      className="flex-1 p-2 border border-slate-250 rounded-xl text-xs outline-none focus:border-blue-500 font-bold text-slate-700 bg-slate-50"
                    >
                      <option value="management">Management Account (Bypass SCPs)</option>
                      <option value="acct-a">Account A (Sandbox - Deny S3 &amp; EC2)</option>
                      <option value="acct-b">Account B (Sandbox - Deny S3)</option>
                      <option value="acct-c">Account C (Sandbox - Deny S3)</option>
                      <option value="acct-d">Account D (Test - Whitelist EC2)</option>
                      <option value="acct-e">Account E (Prod - Full Access)</option>
                      <option value="acct-f">Account F (Prod - Full Access)</option>
                    </select>

                    <select
                      value={simAccountAction}
                      onChange={(e) => {
                        setSimAccountAction(e.target.value as any);
                        setScpSimState('idle');
                      }}
                      className="flex-1 p-2 border border-slate-250 rounded-xl text-xs outline-none focus:border-blue-500 font-bold text-slate-700 bg-slate-50"
                    >
                      <option value="s3:CreateBucket">s3:CreateBucket (S3)</option>
                      <option value="ec2:RunInstances">ec2:RunInstances (EC2)</option>
                      <option value="athena:StartQuery">athena:StartQuery (Athena)</option>
                      <option value="iam:CreateUser">iam:CreateUser (IAM User)</option>
                    </select>
                  </div>

                  <button
                    onClick={runScpSimulation}
                    disabled={scpSimState === 'running'}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 shadow transition-all active:scale-98"
                  >
                    <Play className="w-4 h-4 fill-current" /> Execute Organization API Call
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Dynamic SVG OU Hierarchy Tree Map */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden da-svg-bg min-h-[420px]">
              
              {/* Telemetry Status overlays */}
              {scpSimState === 'running' && (
                <span className="absolute top-3 left-3 bg-blue-100 border border-blue-300 text-blue-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl animate-pulse select-none z-10">
                  🛡️ HIERARCHICAL SCP GATEWAY VALIDATION ACTIVE
                </span>
              )}
              {scpSimState === 'allowed' && (
                <span className="absolute top-3 left-3 bg-emerald-100 border border-emerald-300 text-emerald-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl select-none z-10 animate-bounce">
                  ✅ API INVOCATION ALLOWED BY SCP BOUNDARY
                </span>
              )}
              {scpSimState === 'blocked' && (
                <span className="absolute top-3 left-3 bg-rose-100 border border-rose-300 text-rose-700 font-extrabold text-[9px] px-2.5 py-1 rounded-xl select-none z-10 animate-pulse">
                  🚨 403 ACCESS DENIED - API HALTED BY Service Control Policy
                </span>
              )}

              {/* End-to-End Holistic diagram representing the exact SCP notebook tree structure */}
              <div className="w-full flex-grow relative overflow-x-auto">
                <svg className="w-full min-w-[580px] h-[350px]" viewBox="0 0 600 350">
                  <defs>
                    <marker id="arrow-org" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-svg-node-border)" />
                    </marker>
                    <marker id="arrow-blue-org" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-svg-indigo-border)" />
                    </marker>
                    <marker id="arrow-rose-org" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-svg-red-border)" />
                    </marker>
                  </defs>

                  {/* ==================== AWS ORGANIZATION BOUNDARY ==================== */}
                  <rect x="8" y="5" width="584" height="340" rx="8" fill="none" stroke="var(--da-svg-purple-border)" strokeWidth="1.5" strokeDasharray="5,4" />
                  <text x="18" y="16" fill="var(--da-svg-purple-text)" fontSize="8" fontWeight="black">🏢 AWS ORGANIZATION BOUNDARY</text>

                  {/* ==================== OU NESTED CONTAINERS ==================== */}
                  {/* Management OU Box */}
                  <rect x="115" y="24" width="130" height="65" rx="6" fill="var(--da-svg-purple-bg)" stroke="var(--da-svg-purple-border)" strokeWidth="1" strokeDasharray="3,2" />
                  <text x="122" y="34" fill="var(--da-svg-purple-text)" fontSize="6.5" fontWeight="bold">Management OU</text>

                  {/* Sandbox OU Box */}
                  <rect x="115" y="185" width="468" height="152" rx="8" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1.2" strokeDasharray="4,3" />
                  <text x="125" y="196" fill="var(--da-svg-amber-text)" fontSize="7.5" fontWeight="extrabold">Sandbox OU (Parent SCP: DenyS3 Applied)</text>

                  {/* Workload OU Box */}
                  <rect x="256" y="24" width="327" height="150" rx="8" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.2" strokeDasharray="4,3" />
                  <text x="266" y="35" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="extrabold">Workload OU (Default: FullAWSAccess)</text>

                  {/* Whitelist Test OU Box (inside Workload) */}
                  <rect x="428" y="44" width="145" height="122" rx="6" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1" strokeDasharray="3,2" />
                  <text x="435" y="54" fill="var(--da-svg-indigo-text)" fontSize="6.5" fontWeight="bold">Test OU (Whitelist Filter)</text>

                  {/* Prod OU Box (inside Workload) */}
                  <rect x="266" y="44" width="150" height="122" rx="6" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1" strokeDasharray="3,2" />
                  <text x="274" y="54" fill="var(--da-svg-green-text)" fontSize="6.5" fontWeight="bold">Prod OU (Full Access)</text>

                  {/* Connectors & Pipelines */}
                  {/* Root -> Management OU */}
                  <path d="M 85 160 Q 100 55 115 55" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                  
                  {/* Root -> Sandbox OU */}
                  <path d="M 85 170 Q 100 240 115 240" fill="none" 
                    className={scpSimState === 'running' && (selectedNodeId === 'acct-a' || selectedNodeId === 'acct-b' || selectedNodeId === 'acct-c') ? 'da-flow-blue' : ''} 
                    stroke={scpSimState === 'blocked' && (selectedNodeId === 'acct-a' || selectedNodeId === 'acct-b' || selectedNodeId === 'acct-c') && simAccountAction.startsWith('s3:') ? 'var(--da-svg-red-border)' : 'var(--da-svg-node-border)'} 
                    strokeWidth="1.5" markerEnd="url(#arrow-org)" />
                  
                  {/* Root -> Workload OU */}
                  <path d="M 85 160 Q 150 95 256 95" fill="none" 
                    className={scpSimState === 'running' && (selectedNodeId === 'acct-d' || selectedNodeId === 'acct-e' || selectedNodeId === 'acct-f') ? 'da-flow-blue' : ''} 
                    stroke="var(--da-svg-node-border)" strokeWidth="1.5" markerEnd="url(#arrow-org)" />

                  {/* Sandbox OU -> Sandbox OU Node */}
                  <path d="M 175 240 H 220" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />

                  {/* Sandbox OU Node -> Account A */}
                  <path d="M 295 240 Q 320 220 335 220" fill="none" 
                    className={scpSimState === 'running' && selectedNodeId === 'acct-a' ? 'da-flow-blue' : ''} 
                    stroke={scpSimState === 'blocked' && selectedNodeId === 'acct-a' && (simAccountAction.startsWith('s3:') || simAccountAction.startsWith('ec2:')) ? 'var(--da-svg-red-border)' : 'var(--da-svg-node-border)'} 
                    strokeWidth="1.5" markerEnd="url(#arrow-org)" />
                  
                  {/* Sandbox OU Node -> Account B */}
                  <path d="M 295 240 H 335" fill="none" 
                    className={scpSimState === 'running' && selectedNodeId === 'acct-b' ? 'da-flow-blue' : ''} 
                    stroke={scpSimState === 'blocked' && selectedNodeId === 'acct-b' && simAccountAction.startsWith('s3:') ? 'var(--da-svg-red-border)' : 'var(--da-svg-node-border)'} 
                    strokeWidth="1.5" markerEnd="url(#arrow-org)" />

                  {/* Sandbox OU Node -> Account C */}
                  <path d="M 295 240 Q 320 260 335 260" fill="none" 
                    className={scpSimState === 'running' && selectedNodeId === 'acct-c' ? 'da-flow-blue' : ''} 
                    stroke={scpSimState === 'blocked' && selectedNodeId === 'acct-c' && simAccountAction.startsWith('s3:') ? 'var(--da-svg-red-border)' : 'var(--da-svg-node-border)'} 
                    strokeWidth="1.5" markerEnd="url(#arrow-org)" />

                  {/* Workload OU -> Prod OU Node */}
                  <path d="M 320 95 H 335" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />

                  {/* Workload OU -> Test OU Node */}
                  <path d="M 320 95 Q 400 95 435 95" fill="none" 
                    className={scpSimState === 'running' && selectedNodeId === 'acct-d' ? 'da-flow-blue' : ''} 
                    stroke={scpSimState === 'blocked' && selectedNodeId === 'acct-d' && !simAccountAction.startsWith('ec2:') ? 'var(--da-svg-red-border)' : 'var(--da-svg-node-border)'} 
                    strokeWidth="1.5" markerEnd="url(#arrow-org)" />

                  {/* Test OU Node -> Account D */}
                  <path d="M 505 95 H 515" fill="none" 
                    className={scpSimState === 'running' && selectedNodeId === 'acct-d' ? 'da-flow-blue' : ''} 
                    stroke={scpSimState === 'blocked' && selectedNodeId === 'acct-d' && !simAccountAction.startsWith('ec2:') ? 'var(--da-svg-red-border)' : 'var(--da-svg-node-border)'} 
                    strokeWidth="1.5" markerEnd="url(#arrow-org)" />

                  {/* Prod OU Node -> Account E */}
                  <path d="M 390 85 Q 410 70 420 70" fill="none" 
                    className={scpSimState === 'running' && selectedNodeId === 'acct-e' ? 'da-flow-blue' : ''} 
                    stroke="var(--da-svg-node-border)" strokeWidth="1.5" markerEnd="url(#arrow-org)" />

                  {/* Prod OU Node -> Account F */}
                  <path d="M 390 85 Q 410 100 420 100" fill="none" 
                    className={scpSimState === 'running' && selectedNodeId === 'acct-f' ? 'da-flow-blue' : ''} 
                    stroke="var(--da-svg-node-border)" strokeWidth="1.5" markerEnd="url(#arrow-org)" />

                  {/* ==================== NODES LAYOUT ==================== */}
                  {/* Root Node */}
                  <g transform="translate(15, 140)" className="da-node-btn" onClick={() => setSelectedNodeId('root')}>
                    <rect x="0" y="0" width="75" height="38" rx="6" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                    <text x="37.5" y="16" fill="var(--da-svg-text-dark)" fontSize="8" fontWeight="black" textAnchor="middle">🏢 Root OU</text>
                    <text x="37.5" y="27" fill="var(--da-svg-green-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">FullAWSAccess</text>
                  </g>

                  {/* Management Account */}
                  <g transform="translate(125, 42)" className="da-node-btn" onClick={() => setSelectedNodeId('management')}>
                    <rect x="0" y="0" width="105" height="32" rx="4" 
                      fill={selectedNodeId === 'management' ? 'var(--da-svg-purple-bg)' : 'var(--da-svg-node-fill)'} 
                      stroke="var(--da-svg-purple-border)" strokeWidth="1.2" />
                    <text x="52.5" y="14" fill="var(--da-svg-purple-text)" fontSize="7" fontWeight="black" textAnchor="middle">🔑 Mgmt Account</text>
                    <text x="52.5" y="24" fill="var(--da-svg-purple-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">⛔ NO SCP FILTER</text>
                  </g>

                  {/* Sandbox OU Node */}
                  <g transform="translate(125, 222)" className="da-node-btn" onClick={() => setSelectedNodeId('sandbox-ou')}>
                    <rect x="0" y="0" width="75" height="36" rx="6" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" />
                    <text x="37.5" y="15" fill="var(--da-svg-amber-text)" fontSize="8" fontWeight="black" textAnchor="middle">📦 Sandbox OU</text>
                    <text x="37.5" y="26" fill="var(--da-svg-red-text)" fontSize="6" fontWeight="bold" textAnchor="middle">Deny S3</text>
                  </g>

                  {/* Test OU Node */}
                  <g transform="translate(435, 77)" className="da-node-btn" onClick={() => setSelectedNodeId('test-ou')}>
                    <rect x="0" y="0" width="70" height="36" rx="6" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" />
                    <text x="35" y="15" fill="var(--da-svg-indigo-text)" fontSize="8" fontWeight="black" textAnchor="middle">🧪 Test OU</text>
                    <text x="35" y="26" fill="var(--da-svg-indigo-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">Allow EC2 Only</text>
                  </g>

                  {/* Prod OU Node */}
                  <g transform="translate(275, 67)" className="da-node-btn" onClick={() => setSelectedNodeId('prod-ou')}>
                    <rect x="0" y="0" width="70" height="36" rx="6" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                    <text x="35" y="15" fill="var(--da-svg-green-text)" fontSize="8" fontWeight="black" textAnchor="middle">🚀 Prod OU</text>
                    <text x="35" y="26" fill="var(--da-svg-green-text)" fontSize="6" fontWeight="bold" textAnchor="middle">Full Access</text>
                  </g>

                  {/* Account A (Sandbox) */}
                  <g transform="translate(235, 202)" className="da-node-btn" onClick={() => setSelectedNodeId('acct-a')}>
                    <rect x="0" y="0" width="90" height="36" rx="4" 
                      fill={selectedNodeId === 'acct-a' ? 'var(--da-svg-indigo-bg)' : 'var(--da-svg-node-fill)'} 
                      stroke={selectedNodeId === 'acct-a' ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} 
                      strokeWidth={selectedNodeId === 'acct-a' ? '2' : '1'} />
                    <text x="45" y="13" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="black" textAnchor="middle">🖥️ Account A</text>
                    <text x="45" y="22" fill="var(--da-svg-red-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">Deny EC2 | Deny S3</text>
                    <text x="45" y="30" fill="var(--da-text-muted)" fontSize="5" textAnchor="middle">ID: 222222222222</text>
                  </g>

                  {/* Account B (Sandbox) */}
                  <g transform="translate(340, 202)" className="da-node-btn" onClick={() => setSelectedNodeId('acct-b')}>
                    <rect x="0" y="0" width="90" height="36" rx="4" 
                      fill={selectedNodeId === 'acct-b' ? 'var(--da-svg-indigo-bg)' : 'var(--da-svg-node-fill)'} 
                      stroke={selectedNodeId === 'acct-b' ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} 
                      strokeWidth={selectedNodeId === 'acct-b' ? '2' : '1'} />
                    <text x="45" y="13" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="black" textAnchor="middle">🖥️ Account B</text>
                    <text x="45" y="22" fill="var(--da-svg-red-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">Inherited Deny S3</text>
                    <text x="45" y="30" fill="var(--da-text-muted)" fontSize="5" textAnchor="middle">ID: 333333333333</text>
                  </g>

                  {/* Account C (Sandbox) */}
                  <g transform="translate(445, 202)" className="da-node-btn" onClick={() => setSelectedNodeId('acct-c')}>
                    <rect x="0" y="0" width="90" height="36" rx="4" 
                      fill={selectedNodeId === 'acct-c' ? 'var(--da-svg-indigo-bg)' : 'var(--da-svg-node-fill)'} 
                      stroke={selectedNodeId === 'acct-c' ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} 
                      strokeWidth={selectedNodeId === 'acct-c' ? '2' : '1'} />
                    <text x="45" y="13" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="black" textAnchor="middle">🖥️ Account C</text>
                    <text x="45" y="22" fill="var(--da-svg-red-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">Inherited Deny S3</text>
                    <text x="45" y="30" fill="var(--da-text-muted)" fontSize="5" textAnchor="middle">ID: 444444444444</text>
                  </g>

                  {/* Account D (Test) */}
                  <g transform="translate(445, 122)" className="da-node-btn" onClick={() => setSelectedNodeId('acct-d')}>
                    <rect x="0" y="0" width="90" height="36" rx="4" 
                      fill={selectedNodeId === 'acct-d' ? 'var(--da-svg-indigo-bg)' : 'var(--da-svg-node-fill)'} 
                      stroke={selectedNodeId === 'acct-d' ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} 
                      strokeWidth={selectedNodeId === 'acct-d' ? '2' : '1'} />
                    <text x="45" y="13" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="black" textAnchor="middle">🖥️ Account D</text>
                    <text x="45" y="22" fill="var(--da-svg-indigo-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">Whitelist: EC2 OK</text>
                    <text x="45" y="30" fill="var(--da-text-muted)" fontSize="5" textAnchor="middle">ID: 555555555555</text>
                  </g>

                  {/* Account E (Prod) */}
                  <g transform="translate(355, 62)" className="da-node-btn" onClick={() => setSelectedNodeId('acct-e')}>
                    <rect x="0" y="0" width="60" height="20" rx="3" 
                      fill={selectedNodeId === 'acct-e' ? 'var(--da-svg-indigo-bg)' : 'var(--da-svg-node-fill)'} 
                      stroke={selectedNodeId === 'acct-e' ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} 
                      strokeWidth={selectedNodeId === 'acct-e' ? '1.5' : '1'} />
                    <text x="30" y="12" fill="var(--da-svg-text-dark)" fontSize="6.5" fontWeight="black" textAnchor="middle">🖥️ Acct E (Prod)</text>
                  </g>

                  {/* Account F (Prod) */}
                  <g transform="translate(355, 92)" className="da-node-btn" onClick={() => setSelectedNodeId('acct-f')}>
                    <rect x="0" y="0" width="60" height="20" rx="3" 
                      fill={selectedNodeId === 'acct-f' ? 'var(--da-svg-indigo-bg)' : 'var(--da-svg-node-fill)'} 
                      stroke={selectedNodeId === 'acct-f' ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} 
                      strokeWidth={selectedNodeId === 'acct-f' ? '1.5' : '1'} />
                    <text x="30" y="12" fill="var(--da-svg-text-dark)" fontSize="6.5" fontWeight="black" textAnchor="middle">🖥️ Acct F (Prod)</text>
                  </g>
                </svg>
              </div>

              {/* Console log output feedback */}
              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[10px] leading-relaxed max-h-36 overflow-y-auto border border-slate-800 shadow-inner mt-4">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5 text-slate-400">
                  <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-blue-400" /> Organizational Audit Logs</span>
                  <span>r-ab12 :: Landing Zone 4.0</span>
                </div>
                {scpLogs.length === 0 ? (
                  <div className="text-slate-500 italic">Select an account node, configure baseline SCP bounds, and run the executor to inspect effective multi-account rights.</div>
                ) : (
                  scpLogs.map((log, idx) => (
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
      {/* TAB 3: FINE-GRAINED IAM PERMISSION RESOLUTION ENGINE                      */}
      {/* ========================================================================= */}
      {activeTab === 'iam' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Key className="w-5 h-5" /> IAM Fine-Grained Policy Evaluation &amp; Context Conditions
            </h2>
            <p className="da-card-desc">
              AWS IAM evaluates permissions inside an account sequentially. Incorporating **MFA enforcement (BoolIfExists)**, **Source IP Restrictions (NotIpAddress)**, **ABAC dynamic Tag matches**, and **RequestedRegion restrictions** straight from the notebook pages.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Condition Toggles Sidebar */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between text-left space-y-4">
              <div>
                <h3 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 mb-3 border-b border-slate-100 pb-2">
                  <Sliders className="w-4 h-4 text-blue-600" /> Context-Aware Condition Variables
                </h3>

                {/* 1. Client IP Address (Image 1) */}
                <div className="mb-3 space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">1. Client IP Address (aws:SourceIp):</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                    <button
                      onClick={() => { setClientIp('corporate'); resetIamSim(); }}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${clientIp === 'corporate' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Corporate Subnet
                    </button>
                    <button
                      onClick={() => { setClientIp('public'); resetIamSim(); }}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${clientIp === 'public' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Public Internet IP
                    </button>
                  </div>
                </div>

                {/* 2. MFA Session Status (Image 2) */}
                <div className="mb-3 space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">2. MFA Session Status:</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                    <button
                      onClick={() => { setMfaStatus(true); resetIamSim(); }}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${mfaStatus ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Active Session (MFA)
                    </button>
                    <button
                      onClick={() => { setMfaStatus(false); resetIamSim(); }}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${!mfaStatus ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Unverified Session
                    </button>
                  </div>
                </div>

                {/* 3. Attribute Tags mapping (ABAC - Image 5) */}
                <div className="mb-3 space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">3. ABAC Tags Mapping:</span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[9px] text-slate-400 font-medium block mb-0.5">aws:PrincipalTag/Dept</span>
                      <select
                        value={principalDept}
                        onChange={(e) => { setPrincipalDept(e.target.value as any); resetIamSim(); }}
                        className="w-full p-1.5 border border-slate-200 rounded-lg outline-none font-semibold text-slate-700 bg-slate-50"
                      >
                        <option value="Data">Data</option>
                        <option value="HR">HR</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 font-medium block mb-0.5">ec2:ResourceTag/project</span>
                      <select
                        value={resourceProject}
                        onChange={(e) => { setResourceProject(e.target.value as any); resetIamSim(); }}
                        className="w-full p-1.5 border border-slate-200 rounded-lg outline-none font-semibold text-slate-700 bg-slate-50"
                      >
                        <option value="DataAnalytics">DataAnalytics</option>
                        <option value="Marketing">Marketing</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 4. Requested Region restriction (Image 5) */}
                <div className="mb-3 space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">4. Target AWS Region (aws:RequestedRegion):</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                    <button
                      onClick={() => { setRequestedRegion('eu-central-1'); resetIamSim(); }}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${requestedRegion === 'eu-central-1' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      eu-central-1 (Restricted)
                    </button>
                    <button
                      onClick={() => { setRequestedRegion('us-east-1'); resetIamSim(); }}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${requestedRegion === 'us-east-1' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      us-east-1
                    </button>
                  </div>
                </div>

                {/* Action API trigger */}
                <div className="border-t border-slate-100 pt-3 space-y-1">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">5. Select API Action:</span>
                  <select
                    value={targetAction}
                    onChange={(e) => { setTargetAction(e.target.value as any); resetIamSim(); }}
                    className="w-full p-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 font-bold text-slate-700 bg-slate-50 mb-3"
                  >
                    <option value="ec2:StopInstances">ec2:StopInstances (Forces MFA check)</option>
                    <option value="ec2:StartInstances">ec2:StartInstances (Forces ABAC tags project/Dept check)</option>
                    <option value="rds:CreateDB">rds:CreateDB (Forces Region eu-central-1 check)</option>
                    <option value="s3:PutObject">s3:PutObject (Source IP restriction filter check)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={resetIamSim}
                  className="flex-1 py-2 border border-slate-250 hover:bg-slate-55 text-slate-650 rounded-xl text-xs font-extrabold active:scale-95 transition-all"
                >
                  Reset Engine
                </button>
                <button
                  onClick={runIamSimulation}
                  disabled={iamSimState === 'running'}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 active:scale-95 transition-all shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Traverse Tree
                </button>
              </div>

            </div>

            {/* Right Column: Interactive Evaluation Decision Tree Console */}
            <div className="lg:col-span-8 space-y-6 text-left">
              
              {/* SVG Tree mapping */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden da-svg-bg h-64">
                {iamSimState === 'allowed' && (
                  <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-[1px] flex items-center justify-center z-10 animate-fadeIn">
                    <div className="bg-white border-2 border-emerald-500 px-5 py-2.5 rounded-2xl shadow-xl text-center">
                      <span className="text-emerald-700 font-black text-xs block">🟢 STS API TRANSACTION GRANTED</span>
                      <span className="text-[10px] text-slate-650 font-bold">Principal authorized to execute {targetAction}!</span>
                    </div>
                  </div>
                )}
                {iamSimState === 'blocked' && (
                  <div className="absolute inset-0 bg-rose-500/5 backdrop-blur-[1px] flex items-center justify-center z-10 animate-fadeIn">
                    <div className="bg-white border-2 border-rose-500 px-5 py-2.5 rounded-2xl shadow-xl text-center">
                      <span className="text-rose-700 font-black text-xs block">❌ 403 API TRANSACTION HALTED</span>
                      <span className="text-[10px] text-slate-650 font-bold">Explicit deny or implicit attribute mismatch halted downstream execution.</span>
                    </div>
                  </div>
                )}

                <svg className="w-full h-full" viewBox="0 0 520 200">
                  <defs>
                    <marker id="arrow-iam" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-svg-node-border)" />
                    </marker>
                    <marker id="arrow-iam-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-svg-indigo-border)" />
                    </marker>
                  </defs>

                  {/* Left: Origin Client Network Box */}
                  <g transform="translate(10, 30)">
                    <rect x="0" y="0" width="95" height="135" rx="6" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.2" />
                    <text x="47.5" y="14" fill="var(--da-text-muted)" fontSize="7.5" fontWeight="black" textAnchor="middle">REQUEST ORIGIN</text>
                    
                    {/* IP status indicator inside source */}
                    <rect x="8" y="24" width="79" height="24" rx="3" fill={clientIp === 'corporate' ? 'var(--da-svg-green-bg)' : 'var(--da-svg-red-bg)'} stroke={clientIp === 'corporate' ? 'var(--da-svg-green-border)' : 'var(--da-svg-red-border)'} strokeWidth="0.8" />
                    <text x="47.5" y="34" fill="var(--da-svg-text-dark)" fontSize="6" fontWeight="bold" textAnchor="middle">IP Address</text>
                    <text x="47.5" y="42" fill={clientIp === 'corporate' ? 'var(--da-svg-green-text)' : 'var(--da-svg-red-text)'} fontSize="5.5" fontWeight="black" textAnchor="middle">
                      {clientIp === 'corporate' ? '🏢 Corporate IP' : '🌐 Public Internet'}
                    </text>

                    {/* MFA session status inside source */}
                    <rect x="8" y="54" width="79" height="24" rx="3" fill={mfaStatus ? 'var(--da-svg-green-bg)' : 'var(--da-svg-amber-bg)'} stroke={mfaStatus ? 'var(--da-svg-green-border)' : 'var(--da-svg-amber-border)'} strokeWidth="0.8" />
                    <text x="47.5" y="64" fill="var(--da-svg-text-dark)" fontSize="6" fontWeight="bold" textAnchor="middle">MFA Status</text>
                    <text x="47.5" y="72" fill={mfaStatus ? 'var(--da-svg-green-text)' : 'var(--da-svg-amber-text)'} fontSize="5.5" fontWeight="black" textAnchor="middle">
                      {mfaStatus ? '🛡️ MFA Verified' : '⚠️ No MFA'}
                    </text>

                    {/* ABAC dynamic principal tag key/value */}
                    <rect x="8" y="84" width="79" height="42" rx="3" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="0.8" />
                    <text x="47.5" y="93" fill="var(--da-svg-indigo-text)" fontSize="6" fontWeight="black" textAnchor="middle">PrincipalTag/Dept</text>
                    <text x="47.5" y="103" fill="var(--da-svg-indigo-text)" fontSize="7" fontWeight="extrabold" textAnchor="middle">"{principalDept}"</text>
                    <text x="47.5" y="112" fill="var(--da-text-muted)" fontSize="4.5" textAnchor="middle">Target Project:</text>
                    <text x="47.5" y="120" fill="var(--da-svg-indigo-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">"{resourceProject}"</text>
                  </g>

                  {/* Flow conduits connecting sequential gates */}
                  <path d="M 105 95 H 145" fill="none" stroke={iamEvalStep >= 1 ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} strokeWidth={iamEvalStep >= 1 ? '2.5' : '1.2'} className={iamEvalStep >= 1 && iamSimState === 'running' ? 'da-flow-blue' : ''} />
                  <path d="M 215 95 H 225" fill="none" stroke={iamEvalStep >= 2 ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} strokeWidth={iamEvalStep >= 2 ? '2.5' : '1.2'} className={iamEvalStep >= 2 && iamSimState === 'running' ? 'da-flow-blue' : ''} />
                  <path d="M 295 95 H 305" fill="none" stroke={iamEvalStep >= 3 ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} strokeWidth={iamEvalStep >= 3 ? '2.5' : '1.2'} className={iamEvalStep >= 3 && iamSimState === 'running' ? 'da-flow-blue' : ''} />
                  <path d="M 375 95 H 385" fill="none" stroke={iamEvalStep >= 4 ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} strokeWidth={iamEvalStep >= 4 ? '2.5' : '1.2'} className={iamEvalStep >= 4 && iamSimState === 'running' ? 'da-flow-blue' : ''} />
                  <path d="M 455 95 H 480" fill="none" stroke={iamEvalStep >= 5 ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} strokeWidth={iamEvalStep >= 5 ? '2.5' : '1.2'} className={iamEvalStep >= 5 && iamSimState === 'running' ? 'da-flow-blue' : ''} />

                  {/* Sequential Gate 1: Explicit Deny */}
                  <g transform="translate(145, 55)">
                    <rect x="0" y="0" width="70" height="75" rx="6" 
                      fill={iamEvalStep === 1 ? 'var(--da-svg-indigo-bg)' : 'var(--da-svg-node-fill)'} 
                      stroke={iamEvalStep === 1 ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} strokeWidth={iamEvalStep === 1 ? '2' : '1'} />
                    <text x="35" y="14" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="black" textAnchor="middle">Gate 1</text>
                    <text x="35" y="24" fill="var(--da-svg-indigo-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">Explicit Deny</text>
                    <text x="35" y="36" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">IP/MFA Session</text>
                    <rect x="8" y="44" width="54" height="24" rx="2" 
                      fill={clientIp === 'public' || (targetAction === 'ec2:StopInstances' && !mfaStatus) || (targetAction === 'rds:CreateDB' && requestedRegion !== 'eu-central-1') ? 'var(--da-svg-red-bg)' : 'var(--da-svg-green-bg)'} 
                      stroke={clientIp === 'public' || (targetAction === 'ec2:StopInstances' && !mfaStatus) || (targetAction === 'rds:CreateDB' && requestedRegion !== 'eu-central-1') ? 'var(--da-svg-red-border)' : 'var(--da-svg-green-border)'} 
                      strokeWidth="0.8" />
                    <text x="35" y="53" fill="var(--da-svg-text-dark)" fontSize="5" textAnchor="middle">Evaluation:</text>
                    <text x="35" y="62" fill={clientIp === 'public' || (targetAction === 'ec2:StopInstances' && !mfaStatus) || (targetAction === 'rds:CreateDB' && requestedRegion !== 'eu-central-1') ? 'var(--da-svg-red-text)' : 'var(--da-svg-green-text)'} fontSize="6" fontWeight="black" textAnchor="middle">
                      {clientIp === 'public' || (targetAction === 'ec2:StopInstances' && !mfaStatus) || (targetAction === 'rds:CreateDB' && requestedRegion !== 'eu-central-1') ? '⛔ DENY' : '🟢 PASS'}
                    </text>
                  </g>

                  {/* Sequential Gate 2: SCP Filter */}
                  <g transform="translate(225, 55)">
                    <rect x="0" y="0" width="70" height="75" rx="6" 
                      fill={iamEvalStep === 2 ? 'var(--da-svg-indigo-bg)' : 'var(--da-svg-node-fill)'} 
                      stroke={iamEvalStep === 2 ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} strokeWidth={iamEvalStep === 2 ? '2' : '1'} />
                    <text x="35" y="14" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="black" textAnchor="middle">Gate 2</text>
                    <text x="35" y="24" fill="var(--da-svg-indigo-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">SCP Filter</text>
                    <text x="35" y="36" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">Org Boundary</text>
                    <rect x="8" y="44" width="54" height="24" rx="2" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="0.8" />
                    <text x="35" y="53" fill="var(--da-svg-text-dark)" fontSize="5" textAnchor="middle">Evaluation:</text>
                    <text x="35" y="62" fill="var(--da-svg-green-text)" fontSize="6" fontWeight="black" textAnchor="middle">🟢 PASS</text>
                  </g>

                  {/* Sequential Gate 3: Permission Boundary */}
                  <g transform="translate(305, 55)">
                    <rect x="0" y="0" width="70" height="75" rx="6" 
                      fill={iamEvalStep === 3 ? 'var(--da-svg-indigo-bg)' : 'var(--da-svg-node-fill)'} 
                      stroke={iamEvalStep === 3 ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} strokeWidth={iamEvalStep === 3 ? '2' : '1'} />
                    <text x="35" y="14" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="black" textAnchor="middle">Gate 3</text>
                    <text x="35" y="24" fill="var(--da-svg-indigo-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">Perm Bounds</text>
                    <text x="35" y="36" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">Principal Cap</text>
                    <rect x="8" y="44" width="54" height="24" rx="2" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="0.8" />
                    <text x="35" y="53" fill="var(--da-svg-text-dark)" fontSize="5" textAnchor="middle">Evaluation:</text>
                    <text x="35" y="62" fill="var(--da-svg-green-text)" fontSize="6" fontWeight="black" textAnchor="middle">🟢 PASS</text>
                  </g>

                  {/* Sequential Gate 4: Identity & ABAC Tags Policies */}
                  <g transform="translate(385, 55)">
                    <rect x="0" y="0" width="70" height="75" rx="6" 
                      fill={iamEvalStep === 4 ? 'var(--da-svg-indigo-bg)' : 'var(--da-svg-node-fill)'} 
                      stroke={iamEvalStep === 4 ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} strokeWidth={iamEvalStep === 4 ? '2' : '1'} />
                    <text x="35" y="14" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="black" textAnchor="middle">Gate 4</text>
                    <text x="35" y="24" fill="var(--da-svg-indigo-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">Identity/ABAC</text>
                    <text x="35" y="36" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">Principal inline</text>
                    <rect x="8" y="44" width="54" height="24" rx="2" 
                      fill={targetAction === 'ec2:StartInstances' && principalDept !== 'Data' ? 'var(--da-svg-red-bg)' : 'var(--da-svg-green-bg)'} 
                      stroke={targetAction === 'ec2:StartInstances' && principalDept !== 'Data' ? 'var(--da-svg-red-border)' : 'var(--da-svg-green-border)'} 
                      strokeWidth="0.8" />
                    <text x="35" y="53" fill="var(--da-svg-text-dark)" fontSize="5" textAnchor="middle">Evaluation:</text>
                    <text x="35" y="62" fill={targetAction === 'ec2:StartInstances' && principalDept !== 'Data' ? 'var(--da-svg-red-text)' : 'var(--da-svg-green-text)'} fontSize="6" fontWeight="black" textAnchor="middle">
                      {targetAction === 'ec2:StartInstances' && principalDept !== 'Data' ? '⛔ DENY' : '🟢 ALLOW'}
                    </text>
                  </g>

                  {/* Sequential Gate 5: Implicit Deny Default */}
                  <g transform="translate(465, 55)">
                    <rect x="0" y="0" width="50" height="75" rx="6" 
                      fill={iamEvalStep === 5 ? 'var(--da-svg-indigo-bg)' : 'var(--da-svg-node-fill)'} 
                      stroke={iamEvalStep === 5 ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} strokeWidth={iamEvalStep === 5 ? '2' : '1'} />
                    <text x="25" y="14" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="black" textAnchor="middle">Gate 5</text>
                    <text x="25" y="24" fill="var(--da-svg-indigo-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">Fallback</text>
                    <text x="25" y="36" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">Closed bounds</text>
                    <rect x="6" y="44" width="38" height="24" rx="2" fill="var(--da-svg-red-bg)" stroke="var(--da-svg-red-border)" strokeWidth="0.8" />
                    <text x="25" y="53" fill="var(--da-svg-text-dark)" fontSize="5" textAnchor="middle">Default:</text>
                    <text x="25" y="62" fill="var(--da-svg-red-text)" fontSize="6" fontWeight="black" textAnchor="middle">⛔ DENY</text>
                  </g>
                </svg>
              </div>

              {/* Policy JSON code output side-by-side terminal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Condition Policy JSON View */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left shadow-lg overflow-x-auto font-mono text-[9px] text-slate-300 leading-normal max-h-56">
                  <div className="text-slate-500 font-extrabold pb-2 border-b border-slate-800 mb-2 flex justify-between items-center">
                    <span>📄 IAM_IP_RESTRICTION_POLICY.json</span>
                    <span className="text-[8px] bg-red-950/80 text-red-400 px-1.5 py-0.5 rounded border border-red-900">NOTIPADDRESS</span>
                  </div>
                  <pre>{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Deny",
      "Action": "*",
      "Resource": "*",
      "Condition": {
        "NotIpAddress": {
          "aws:SourceIp": [
            "192.0.2.0/24",
            "203.0.11.0/24"
          ]
        }
      }
    }
  ]
}`}</pre>
                </div>

                {/* ABAC project matching Tag JSON View */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-left shadow-lg overflow-x-auto font-mono text-[9px] text-slate-300 leading-normal max-h-56">
                  <div className="text-slate-500 font-extrabold pb-2 border-b border-slate-800 mb-2 flex justify-between items-center">
                    <span>📄 IAM_ABAC_FORCE_MFA.json</span>
                    <span className="text-[8px] bg-blue-950/80 text-blue-400 px-1.5 py-0.5 rounded border border-blue-900">MFA_TAG_MATCH</span>
                  </div>
                  <pre>{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:StartInstances",
        "ec2:StopInstances"
      ],
      "Resource": "arn:aws:ec2:us-east-1:*:instance/*",
      "Condition": {
        "StringEquals": {
          "ec2:ResourceTag/project": "DataAnalytics",
          "aws:PrincipalTag/Dept": "Data"
        }
      }
    },
    {
      "Effect": "Deny",
      "Action": ["ec2:StopInstances"],
      "Resource": "*",
      "Condition": {
        "BoolIfExists": {
          "aws:MultiFactorAuthPresent": "false"
        }
      }
    }
  ]
}`}</pre>
                </div>

              </div>

              {/* Sequential Evaluation Audit terminal console */}
              <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[10px] leading-relaxed max-h-36 overflow-y-auto border border-slate-900 shadow-inner">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5 text-slate-400">
                  <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4 text-emerald-400" /> IAM Evaluation Audit Log</span>
                  <span>Principal: bob_dev :: STS Token</span>
                </div>
                {iamLogs.length === 0 ? (
                  <div className="text-slate-500 italic">Select condition variables and click "Traverse Tree" to evaluate STS context token parameters sequentially.</div>
                ) : (
                  iamLogs.map((log, idx) => (
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
      {/* TAB 4: IDENTITY CENTER SSO DIRECTORY SYNC                                 */}
      {/* ========================================================================= */}
      {activeTab === 'identitycenter' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Users className="w-5 h-5" /> IAM Identity Center Portal &amp; On-Premise AD Group Syncing
            </h2>
            <p className="da-card-desc">
              Synchronize enterprise identities from **AWS Managed Microsoft AD**, **AD Connector proxies**, or **Simple AD** catalogs straight into central permission set profiles across target accounts (Account A-F).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sync Sidebar control options */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
              <div className="space-y-4">
                
                {/* Directory choice */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">1. Select Directory Service:</span>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="dir"
                        checked={selectedDirectory === 'managed_ad'}
                        onChange={() => { setSelectedDirectory('managed_ad'); resetSyncSim(); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      📂 AWS Managed Microsoft AD (Cloud hosted domain)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="dir"
                        checked={selectedDirectory === 'ad_connector'}
                        onChange={() => { setSelectedDirectory('ad_connector'); resetSyncSim(); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      📂 AD Connector Proxy (On-Premise relay redirects)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="dir"
                        checked={selectedDirectory === 'simple_ad'}
                        onChange={() => { setSelectedDirectory('simple_ad'); resetSyncSim(); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      📂 Simple AD Samba Pool (Basic catalog directory)
                    </label>
                  </div>
                </div>

                {/* Group Mapping */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">2. Map AD Security Group to Permission Set:</span>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="group"
                        checked={mappedGroup === 'admins'}
                        onChange={() => { setMappedGroup('admins'); resetSyncSim(); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      👥 AWS-Domain-Admins ➔ AdministratorAccess (Prod target accounts)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="group"
                        checked={mappedGroup === 'analysts'}
                        onChange={() => { setMappedGroup('analysts'); resetSyncSim(); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      👥 AWS-Security-Analysts ➔ ReadOnlyAccess (Audit &amp; Sandbox accounts)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="group"
                        checked={mappedGroup === 'billing'}
                        onChange={() => { setMappedGroup('billing'); resetSyncSim(); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      👥 AWS-Finance-Operators ➔ BillingReadOnlyAccess (Master Billing account)
                    </label>
                  </div>
                </div>

              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={resetSyncSim}
                  className="flex-1 py-2 border border-slate-250 hover:bg-slate-55 text-slate-650 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Reset
                </button>
                <button
                  onClick={runDirectorySync}
                  disabled={syncState === 'running'}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 active:scale-95 transition-all shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncState === 'running' ? 'animate-spin' : ''}`} /> Sync Directory
                </button>
              </div>

            </div>

            {/* Sync Visual Pipeline */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden da-svg-bg flex flex-col justify-between min-h-[380px]">
              
              {syncState === 'running' && (
                <span className="absolute top-3 left-3 bg-blue-100 border border-blue-300 text-blue-700 font-extrabold text-[9px] px-2 py-0.5 rounded animate-pulse select-none z-10">
                  🔄 SYNCHRONIZING SECURE LDAP TUNNEL
                </span>
              )}
              {syncState === 'success' && (
                <span className="absolute top-3 left-3 bg-emerald-100 border border-emerald-300 text-emerald-700 font-extrabold text-[9px] px-2 py-0.5 rounded select-none z-10 animate-bounce">
                  ✅ SYNCHRONIZED DIRECTORIES SUCCESSFULLY
                </span>
              )}

              <div className="w-full flex-grow flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 500 220">
                  <defs>
                    <marker id="arrow-sync" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-svg-node-border)" />
                    </marker>
                    <marker id="arrow-sync-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-svg-indigo-border)" />
                    </marker>
                    <marker id="arrow-sync-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-svg-green-border)" />
                    </marker>
                  </defs>

                  {/* ==================== ON-PREMISES BOUNDARY ==================== */}
                  <rect x="8" y="25" width="135" height="180" rx="8" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.2" strokeDasharray="4,3" />
                  <text x="16" y="36" fill="var(--da-text-muted)" fontSize="7.5" fontWeight="black">🏢 ON-PREM CORPORATE NET</text>

                  {/* Active Directory Domain Controller Node */}
                  <g transform="translate(18, 45)">
                    <rect x="0" y="0" width="115" height="38" rx="4" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.2" />
                    <text x="57.5" y="14" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Active Directory</text>
                    <text x="57.5" y="24" fill="var(--da-text-muted)" fontSize="6" textAnchor="middle">Windows Domain Controller</text>
                    <text x="57.5" y="32" fill="var(--da-svg-indigo-text)" fontSize="5" fontWeight="black" textAnchor="middle">LDAP Catalog Active</text>
                  </g>

                  {/* AD Security Groups List */}
                  <g transform="translate(18, 92)">
                    <rect x="0" y="0" width="115" height="102" rx="4" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1" />
                    <text x="57.5" y="10" fill="var(--da-text-muted)" fontSize="6.5" fontWeight="black" textAnchor="middle">AD Security Groups</text>
                    
                    {/* Admins group */}
                    <rect x="6" y="16" width="103" height="24" rx="2" fill={mappedGroup === 'admins' ? 'var(--da-svg-indigo-bg)' : 'var(--da-bg)'} stroke={mappedGroup === 'admins' ? 'var(--da-svg-indigo-border)' : 'var(--da-card-border)'} strokeWidth={mappedGroup === 'admins' ? '1.2' : '0.8'} />
                    <text x="12" y="26" fill="var(--da-svg-text-dark)" fontSize="6.5" fontWeight="bold">👥 AWS-Domain-Admins</text>
                    <text x="12" y="34" fill={mappedGroup === 'admins' ? 'var(--da-svg-indigo-text)' : 'var(--da-text-muted)'} fontSize="5.5" fontWeight="black">➔ AdminAccess</text>

                    {/* Analysts group */}
                    <rect x="6" y="44" width="103" height="24" rx="2" fill={mappedGroup === 'analysts' ? 'var(--da-svg-green-bg)' : 'var(--da-bg)'} stroke={mappedGroup === 'analysts' ? 'var(--da-svg-green-border)' : 'var(--da-card-border)'} strokeWidth={mappedGroup === 'analysts' ? '1.2' : '0.8'} />
                    <text x="12" y="54" fill="var(--da-svg-text-dark)" fontSize="6.5" fontWeight="bold">👥 AWS-Sec-Analysts</text>
                    <text x="12" y="62" fill={mappedGroup === 'analysts' ? 'var(--da-svg-green-text)' : 'var(--da-text-muted)'} fontSize="5.5" fontWeight="black">➔ ReadOnlyAccess</text>

                    {/* Billing group */}
                    <rect x="6" y="72" width="103" height="24" rx="2" fill={mappedGroup === 'billing' ? 'var(--da-svg-amber-bg)' : 'var(--da-bg)'} stroke={mappedGroup === 'billing' ? 'var(--da-svg-amber-border)' : 'var(--da-card-border)'} strokeWidth={mappedGroup === 'billing' ? '1.2' : '0.8'} />
                    <text x="12" y="82" fill="var(--da-svg-text-dark)" fontSize="6.5" fontWeight="bold">👥 AWS-Finance-Ops</text>
                    <text x="12" y="90" fill={mappedGroup === 'billing' ? 'var(--da-svg-amber-text)' : 'var(--da-text-muted)'} fontSize="5.5" fontWeight="black">➔ BillingReadOnly</text>
                  </g>

                  {/* Connectors between On-Prem and AWS */}
                  <path d="M 143 64 H 195" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" className={syncState === 'running' ? 'da-flow-blue' : ''} markerEnd="url(#arrow-sync-blue)" />
                  <text x="169" y="58" fill="var(--da-svg-indigo-text)" fontSize="6" fontWeight="bold" textAnchor="middle">LDAP Tunnel</text>

                  {/* ==================== AWS CLOUD BOUNDARY ==================== */}
                  <rect x="188" y="25" width="304" height="180" rx="8" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.2" strokeDasharray="4,3" />
                  <text x="198" y="36" fill="var(--da-svg-indigo-text)" fontSize="7.5" fontWeight="black">☁️ AWS CLOUD ENVIRONMENT</text>

                  {/* AWS Directory Relay */}
                  <g transform="translate(195, 45)">
                    <rect x="0" y="0" width="85" height="42" rx="4" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1.2" />
                    <text x="42.5" y="14" fill="var(--da-svg-amber-text)" fontSize="7.5" fontWeight="black" textAnchor="middle">
                      {selectedDirectory === 'managed_ad' ? 'Managed AD' : selectedDirectory === 'ad_connector' ? 'AD Connector' : 'Simple AD'}
                    </text>
                    <text x="42.5" y="24" fill="var(--da-svg-amber-text)" fontSize="6" textAnchor="middle">Directory Relay</text>
                    <text x="42.5" y="34" fill="var(--da-svg-amber-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">
                      {syncState === 'running' ? '🔄 Active LDAP' : 'Port 389 Bound'}
                    </text>
                  </g>

                  {/* SCIM Connector sync path */}
                  <path d="M 280 66 H 315" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1.5" className={syncState === 'running' ? 'da-flow-green' : ''} markerEnd="url(#arrow-sync-green)" />
                  <text x="298" y="58" fill="var(--da-svg-green-text)" fontSize="6" fontWeight="bold" textAnchor="middle">SCIM Sync</text>

                  {/* AWS IAM Identity Center */}
                  <g transform="translate(320, 45)">
                    <rect x="0" y="0" width="85" height="42" rx="4" fill="var(--da-svg-green-bg)" stroke="var(--da-svg-green-border)" strokeWidth="1.5" />
                    <text x="42.5" y="14" fill="var(--da-svg-green-text)" fontSize="7.5" fontWeight="black" textAnchor="middle">Identity Center</text>
                    <text x="42.5" y="24" fill="var(--da-svg-green-text)" fontSize="6" textAnchor="middle">SSO Portal</text>
                    <text x="42.5" y="34" fill="var(--da-svg-green-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">
                      {syncState === 'success' ? '🟢 Synchronized' : '🔄 Standby'}
                    </text>
                  </g>

                  {/* STS Federated Token Assume role path */}
                  <path d="M 362 87 Q 362 132 405 132" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1.5" className={syncState === 'success' ? 'da-flow-green' : ''} markerEnd="url(#arrow-sync-green)" />
                  <text x="345" y="115" fill="var(--da-svg-green-text)" fontSize="6" fontWeight="bold" textAnchor="middle">STS:Assume</text>

                  {/* Right Column inside AWS: TARGET ACCOUNTS ZONE */}
                  <g transform="translate(410, 95)">
                    <rect x="-5" y="-12" width="77" height="92" rx="6" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1" strokeDasharray="3,2" />
                    <text x="33.5" y="-4" fill="var(--da-text-muted)" fontSize="6.5" fontWeight="extrabold" textAnchor="middle">TARGET OUs</text>

                    {/* consolidated master account */}
                    <rect x="0" y="5" width="67" height="22" rx="2" fill={mappedGroup === 'billing' && syncState === 'success' ? 'var(--da-svg-amber-bg)' : 'var(--da-svg-node-fill)'} stroke={mappedGroup === 'billing' && syncState === 'success' ? 'var(--da-svg-amber-border)' : 'var(--da-svg-node-border)'} strokeWidth="0.8" />
                    <text x="33.5" y="14" fill="var(--da-svg-text-dark)" fontSize="6" fontWeight="black" textAnchor="middle">Master Billing</text>
                    <text x="33.5" y="20" fill="var(--da-text-muted)" fontSize="4.5" textAnchor="middle">Account A</text>

                    {/* dev sandbox accounts */}
                    <rect x="0" y="32" width="67" height="22" rx="2" fill={mappedGroup === 'analysts' && syncState === 'success' ? 'var(--da-svg-green-bg)' : 'var(--da-svg-node-fill)'} stroke={mappedGroup === 'analysts' && syncState === 'success' ? 'var(--da-svg-green-border)' : 'var(--da-svg-node-border)'} strokeWidth="0.8" />
                    <text x="33.5" y="41" fill="var(--da-svg-text-dark)" fontSize="6" fontWeight="black" textAnchor="middle">Dev Sandbox</text>
                    <text x="33.5" y="48" fill="var(--da-text-muted)" fontSize="4.5" textAnchor="middle">Account B / C</text>

                    {/* production accounts */}
                    <rect x="0" y="59" width="67" height="22" rx="2" fill={mappedGroup === 'admins' && syncState === 'success' ? 'var(--da-svg-indigo-bg)' : 'var(--da-svg-node-fill)'} stroke={mappedGroup === 'admins' && syncState === 'success' ? 'var(--da-svg-indigo-border)' : 'var(--da-svg-node-border)'} strokeWidth="0.8" />
                    <text x="33.5" y="68" fill="var(--da-svg-text-dark)" fontSize="6" fontWeight="black" textAnchor="middle">Production OU</text>
                    <text x="33.5" y="75" fill="var(--da-text-muted)" fontSize="4.5" textAnchor="middle">Account E / F</text>
                  </g>
                </svg>
              </div>

              {/* Logs terminal */}
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto border border-slate-800 shadow-inner mt-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800 mb-1 text-slate-400">
                  <span className="flex items-center gap-1"><Terminal className="w-3 h-3 text-blue-400" /> Enterprise SSO Sync Console</span>
                  <span>Directory: LDAP Bind</span>
                </div>
                {syncLogs.length === 0 ? (
                  <div className="text-slate-500 italic">Select group configurations and run LDAP Sync.</div>
                ) : (
                  syncLogs.map((log, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-slate-500 select-none">[{log.timestamp}]</span>
                      <span className={log.type === 'error' ? 'text-rose-400 font-bold' : log.type === 'success' ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
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
      {/* TAB 5: CONTROL TOWER COMPLIANCE AUDITOR                                    */}
      {/* ========================================================================= */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Activity className="w-5 h-5" /> AWS Control Tower Continuous Compliance &amp; Audit Logs
            </h2>
            <p className="da-card-desc">
              Simulate preventive guardrails blocking malicious APIs and detective guardrails auditing drift, initiating SSM Automation runbooks to encrypt resources dynamically.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Control Tower sidebar configuration */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between">
              <div className="space-y-4">
                
                {/* Guardrail Choice */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">1. Select Baseline Guardrail:</span>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="guardrail"
                        checked={selectedGuardrail === 'deny_public_s3'}
                        onChange={() => { setSelectedGuardrail('deny_public_s3'); resetComplianceSim(); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      🛑 s3-bucket-public-read-prohibited (Preventive SCP)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="guardrail"
                        checked={selectedGuardrail === 'detect_unencrypted_ebs'}
                        onChange={() => { setSelectedGuardrail('detect_unencrypted_ebs'); resetComplianceSim(); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      🔍 ebs-encryption-by-default (Detective Config)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="guardrail"
                        checked={selectedGuardrail === 'block_root_api'}
                        onChange={() => { setSelectedGuardrail('block_root_api'); resetComplianceSim(); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      🛑 block-root-credentials-api (Preventive SCP)
                    </label>
                  </div>
                </div>

                {/* Audit Action Trigger */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">2. Trigger Audit Action Scenario:</span>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="action"
                        checked={auditAction === 'deploy_public_s3'}
                        onChange={() => { setAuditAction('deploy_public_s3'); resetComplianceSim(); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      ⚙️ Deploy Public S3 Bucket Policy
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="action"
                        checked={auditAction === 'deploy_unencrypted_ebs'}
                        onChange={() => { setAuditAction('deploy_unencrypted_ebs'); resetComplianceSim(); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      ⚙️ Launch Unencrypted EBS Block Drive
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="action"
                        checked={auditAction === 'invoke_root_api'}
                        onChange={() => { setAuditAction('invoke_root_api'); resetComplianceSim(); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      ⚙️ Trigger Root API Modification Call
                    </label>
                  </div>
                </div>

              </div>

              <div className="flex gap-2 mt-6">
                <button
                  onClick={resetComplianceSim}
                  className="flex-1 py-2 border border-slate-250 hover:bg-slate-55 text-slate-650 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Reset
                </button>
                <button
                  onClick={triggerAuditAction}
                  disabled={complianceState === 'deploying'}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 active:scale-95 transition-all shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Trigger Audit
                </button>
              </div>

            </div>

            {/* Compliance SVG state indicators */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden da-svg-bg flex flex-col justify-between min-h-[380px]">
              
              <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-xl mb-4">
                <div className="text-left">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block">Landing Zone Security Status</span>
                  <span className={`text-lg font-black block mt-1 ${nonCompliantCount > 0 ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                    {nonCompliantCount > 0 ? '⚠️ DETECTED DRIFT BREACH' : '🟢 CONTINUOUSLY SECURE'}
                  </span>
                </div>
                <div className="text-right font-mono text-xs">
                  <div>Accounts: <span className="font-bold text-slate-700">12 / 12</span></div>
                  <div>Breached: <span className={`font-bold ${nonCompliantCount > 0 ? 'text-rose-500 font-extrabold' : 'text-slate-550'}`}>{nonCompliantCount}</span></div>
                </div>
              </div>

              <div className="w-full flex-grow flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 500 240">
                  <defs>
                    <marker id="arrow-ct" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-svg-node-border)" />
                    </marker>
                    <marker id="arrow-ct-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-svg-indigo-border)" />
                    </marker>
                    <marker id="arrow-ct-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-svg-green-border)" />
                    </marker>
                    <marker id="arrow-ct-rose" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-svg-red-border)" />
                    </marker>
                  </defs>

                  {/* ==================== LANDING ZONE CLOUD ==================== */}
                  <rect x="8" y="5" width="484" height="230" rx="8" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.2" strokeDasharray="5,4" />
                  <text x="18" y="16" fill="var(--da-svg-indigo-text)" fontSize="8" fontWeight="black">☁️ AWS CONTROL TOWER GOVERNED LANDING ZONE</text>

                  {/* Left: Dispatcher Node */}
                  <g transform="translate(15, 90)">
                    <rect x="0" y="0" width="75" height="55" rx="6" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.5" />
                    <text x="37.5" y="16" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="black" textAnchor="middle">Resource</text>
                    <text x="37.5" y="27" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="black" textAnchor="middle">Deployment</text>
                    <text x="37.5" y="38" fill="var(--da-text-muted)" fontSize="6" textAnchor="middle">API Dispatcher</text>
                    <rect x="10" y="43" width="55" height="6" rx="1.5" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="0.6" />
                  </g>

                  {/* -------------------- TRACK 1: PREVENTIVE SCP -------------------- */}
                  <path d="M 90 105 Q 110 50 145 50" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" className={complianceState === 'deploying' && (auditAction === 'deploy_public_s3' || auditAction === 'invoke_root_api') ? 'da-flow-blue' : ''} markerEnd="url(#arrow-ct)" />
                  <text x="110" y="70" fill="var(--da-text-muted)" fontSize="5.5" fontWeight="bold" textAnchor="middle">Preventive Check</text>

                  <g transform="translate(150, 20)">
                    <rect x="0" y="0" width="105" height="50" rx="6" 
                      fill={selectedGuardrail === 'deny_public_s3' || selectedGuardrail === 'block_root_api' ? 'var(--da-svg-red-bg)' : 'var(--da-svg-node-fill)'} 
                      stroke={selectedGuardrail === 'deny_public_s3' || selectedGuardrail === 'block_root_api' ? 'var(--da-svg-red-border)' : 'var(--da-svg-node-border)'} strokeWidth="1.2" />
                    <text x="52.5" y="13" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="black" textAnchor="middle">1. Preventive Control</text>
                    <text x="52.5" y="23" fill="var(--da-svg-indigo-text)" fontSize="6" fontWeight="bold" textAnchor="middle">Landing Zone SCP</text>
                    
                    {/* Evaluation status inside SCP gate */}
                    <rect x="8" y="28" width="89" height="16" rx="2" 
                      fill={complianceState === 'evaluated' && ((selectedGuardrail === 'deny_public_s3' && auditAction === 'deploy_public_s3') || (selectedGuardrail === 'block_root_api' && auditAction === 'invoke_root_api')) ? 'var(--da-svg-red-bg)' : 'var(--da-svg-green-bg)'} 
                      stroke={complianceState === 'evaluated' && ((selectedGuardrail === 'deny_public_s3' && auditAction === 'deploy_public_s3') || (selectedGuardrail === 'block_root_api' && auditAction === 'invoke_root_api')) ? 'var(--da-svg-red-border)' : 'var(--da-svg-green-border)'} strokeWidth="0.8" />
                    <text x="52.5" y="38" fill={complianceState === 'evaluated' && ((selectedGuardrail === 'deny_public_s3' && auditAction === 'deploy_public_s3') || (selectedGuardrail === 'block_root_api' && auditAction === 'invoke_root_api')) ? 'var(--da-svg-red-text)' : 'var(--da-svg-green-text)'} fontSize="6" fontWeight="black" textAnchor="middle">
                      {complianceState === 'evaluated' && ((selectedGuardrail === 'deny_public_s3' && auditAction === 'deploy_public_s3') || (selectedGuardrail === 'block_root_api' && auditAction === 'invoke_root_api')) ? '🛑 SCP BLOCKED' : '🟢 ALLOWED'}
                    </text>
                  </g>

                  {/* -------------------- TRACK 2: DETECTIVE CONFIG AUDITOR -------------------- */}
                  <path d="M 90 125 Q 110 160 145 160" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" className={complianceState === 'deploying' && auditAction === 'deploy_unencrypted_ebs' ? 'da-flow-blue' : ''} markerEnd="url(#arrow-ct)" />
                  <text x="110" y="152" fill="var(--da-text-muted)" fontSize="5.5" fontWeight="bold" textAnchor="middle">Detective Path</text>

                  {/* Deployed Resource Node */}
                  <g transform="translate(150, 135)">
                    <rect x="0" y="0" width="85" height="50" rx="4" fill="var(--da-svg-node-fill)" stroke="var(--da-svg-node-border)" strokeWidth="1.2" />
                    <text x="42.5" y="13" fill="var(--da-svg-text-dark)" fontSize="7" fontWeight="extrabold" textAnchor="middle">Deployed Drive</text>
                    <text x="42.5" y="23" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">EBS / S3 Bucket</text>
                    
                    {/* Status Badge */}
                    <rect x="6" y="28" width="73" height="16" rx="1.5" 
                      fill={nonCompliantCount > 0 ? 'var(--da-svg-red-bg)' : complianceState === 'remediated' ? 'var(--da-svg-green-bg)' : 'var(--da-bg)'} 
                      stroke={nonCompliantCount > 0 ? 'var(--da-svg-red-border)' : complianceState === 'remediated' ? 'var(--da-svg-green-border)' : 'var(--da-card-border)'} strokeWidth="0.8" />
                    <text x="42.5" y="38" fill={nonCompliantCount > 0 ? 'var(--da-svg-red-text)' : complianceState === 'remediated' ? 'var(--da-svg-green-text)' : 'var(--da-text-muted)'} fontSize="5.5" fontWeight="extrabold" textAnchor="middle">
                      {nonCompliantCount > 0 ? '⚠️ UNENCRYPTED' : complianceState === 'remediated' ? '🔒 SECURE' : 'STANDBY'}
                    </text>
                  </g>

                  {/* Flow from Deployed Resource to AWS Config Auditor */}
                  <path d="M 235 160 H 265" fill="none" stroke="var(--da-svg-node-border)" strokeWidth="1.5" className={complianceState === 'deploying' ? 'da-flow-blue' : ''} markerEnd="url(#arrow-ct)" />

                  {/* AWS Config Auditor Node */}
                  <g transform="translate(270, 135)">
                    <rect x="0" y="0" width="90" height="50" rx="6" 
                      fill={nonCompliantCount > 0 ? 'var(--da-svg-red-bg)' : 'var(--da-svg-node-fill)'} 
                      stroke={nonCompliantCount > 0 ? 'var(--da-svg-red-border)' : 'var(--da-svg-node-border)'} strokeWidth="1.5" />
                    <text x="45" y="13" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="black" textAnchor="middle">2. AWS Config</text>
                    <text x="45" y="23" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">Continuous Audit</text>
                    
                    {/* Evaluation status inside AWS Config */}
                    <rect x="6" y="28" width="78" height="16" rx="2" 
                      fill={nonCompliantCount > 0 ? 'var(--da-svg-red-bg)' : complianceState === 'remediated' ? 'var(--da-svg-green-bg)' : 'var(--da-bg)'} 
                      stroke={nonCompliantCount > 0 ? 'var(--da-svg-red-border)' : complianceState === 'remediated' ? 'var(--da-svg-green-border)' : 'var(--da-card-border)'} strokeWidth="0.8" />
                    <text x="45" y="38" fill={nonCompliantCount > 0 ? 'var(--da-svg-red-text)' : complianceState === 'remediated' ? 'var(--da-svg-green-text)' : 'var(--da-text-muted)'} fontSize="5.5" fontWeight="black" textAnchor="middle">
                      {nonCompliantCount > 0 ? '🚨 NON-COMPLIANT' : complianceState === 'remediated' ? '🟢 COMPLIANT' : 'NO CHANGE'}
                    </text>
                  </g>

                  {/* Flow from Config Auditor to Systems Manager Runbook */}
                  <path d="M 360 160 H 380" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1.5" className={complianceState === 'remediated' ? 'da-flow-green' : ''} markerEnd="url(#arrow-ct-green)" />

                  {/* Systems Manager (SSM) Auto Remediator Node */}
                  <g transform="translate(385, 135)">
                    <rect x="0" y="0" width="95" height="50" rx="6" 
                      fill={complianceState === 'remediated' ? 'var(--da-svg-green-bg)' : 'var(--da-svg-node-fill)'} 
                      stroke={complianceState === 'remediated' ? 'var(--da-svg-green-border)' : 'var(--da-svg-node-border)'} strokeWidth="1.5" />
                    <text x="47.5" y="13" fill="var(--da-svg-text-dark)" fontSize="7.5" fontWeight="black" textAnchor="middle">3. SSM Runbook</text>
                    <text x="47.5" y="23" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">Auto-Remediation</text>
                    
                    {/* Status check */}
                    <rect x="6" y="28" width="83" height="16" rx="2" 
                      fill={complianceState === 'remediated' ? 'var(--da-svg-green-bg)' : 'var(--da-bg)'} 
                      stroke={complianceState === 'remediated' ? 'var(--da-svg-green-border)' : 'var(--da-card-border)'} strokeWidth="0.8" />
                    <text x="47.5" y="38" fill={complianceState === 'remediated' ? 'var(--da-svg-green-text)' : 'var(--da-text-muted)'} fontSize="5" fontWeight="black" textAnchor="middle" className="font-mono">
                      {complianceState === 'remediated' ? '⚡ RUNBOOK COMPLETE' : 'STANDBY IDLE'}
                    </text>
                  </g>
                </svg>
              </div>

              {/* Logs Audit terminal console */}
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto border border-slate-800 shadow-inner mt-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800 mb-1 text-slate-400">
                  <span className="flex items-center gap-1"><Terminal className="w-3 h-3 text-blue-400" /> Control Tower Audit logs</span>
                  <span>System: Config recorder</span>
                </div>
                {complianceLogs.length === 0 ? (
                  <div className="text-slate-500 italic">Select baseline guardrails and trigger audit scenarios to verify remediation loops.</div>
                ) : (
                  complianceLogs.map((log, idx) => (
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
          </>
        </Translate>
      )}
    </div>
  );
}
