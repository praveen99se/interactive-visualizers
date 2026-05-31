import { useState } from 'react';
import {
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
  BookOpen,
  Terminal,
  Network
} from 'lucide-react';

type TabType = 'intro' | 'organizations' | 'iam' | 'identitycenter' | 'compliance';

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

export default function GovernanceAndIdentityVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('intro');

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
        
        .pulse-circle {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
      `}</style>

      {/* Header bar */}
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

      {/* Tab navigation bar */}
      <div className="da-tabs">
        <button className={`da-tb ${activeTab === 'intro' ? 'da-on' : ''}`} onClick={() => setActiveTab('intro')}>
          <BookOpen className="w-4 h-4" /> 1. Governance Comparison &amp; EventBridge Security
        </button>
        <button className={`da-tb ${activeTab === 'organizations' ? 'da-on' : ''}`} onClick={() => setActiveTab('organizations')}>
          <Building className="w-4 h-4" /> 2. SCP Multi-OU Hierarchy
        </button>
        <button className={`da-tb ${activeTab === 'iam' ? 'da-on' : ''}`} onClick={() => setActiveTab('iam')}>
          <Key className="w-4 h-4" /> 3. Fine-Grained IAM Resolution
        </button>
        <button className={`da-tb ${activeTab === 'identitycenter' ? 'da-on' : ''}`} onClick={() => setActiveTab('identitycenter')}>
          <Users className="w-4 h-4" /> 4. SSO Active Directory Mapping
        </button>
        <button className={`da-tb ${activeTab === 'compliance' ? 'da-on' : ''}`} onClick={() => setActiveTab('compliance')}>
          <Activity className="w-4 h-4" /> 5. Guardrails Compliance Auditor
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: THEORETICAL MATRIX COMPARISON & EVENTBRIDGE SECURITY               */}
      {/* ========================================================================= */}
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
                  <div className="w-full md:w-1/2 h-36 bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden flex items-center justify-center p-2">
                    <svg className="w-full h-full" viewBox="0 0 240 120">
                      {/* Left: EventBridge Rule Node */}
                      <g transform="translate(10, 45)">
                        <rect x="0" y="0" width="60" height="30" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                        <text x="30" y="14" fill="#1e3a8a" fontSize="7.5" fontWeight="black" textAnchor="middle">EventBridge</text>
                        <text x="30" y="23" fill="#2563eb" fontSize="6.5" fontWeight="bold" textAnchor="middle">Rule</text>
                      </g>

                      {/* Right: Target Node */}
                      {eventBridgeMode === 'resource_policy' ? (
                        <>
                          {/* Flow line */}
                          <path d="M 70 60 L 160 60" fill="none" stroke="#10b981" strokeWidth="2" className="da-flow-green" />
                          <text x="115" y="52" fill="#047857" fontSize="6.5" fontWeight="bold" textAnchor="middle">Direct invoke</text>

                          {/* Lambda Target */}
                          <g transform="translate(165, 45)">
                            <rect x="0" y="0" width="65" height="30" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                            <text x="32.5" y="14" fill="#065f46" fontSize="7.5" fontWeight="black" textAnchor="middle">Lambda</text>
                            <text x="32.5" y="23" fill="#047857" fontSize="5.5" fontWeight="bold" textAnchor="middle">Resource Policy</text>
                          </g>

                          {/* Info overlay */}
                          <rect x="10" y="90" width="220" height="22" rx="4" fill="#f0fdf4" stroke="#d1fae5" strokeWidth="0.5" />
                          <text x="120" y="103" fill="#065f46" fontSize="6.5" fontWeight="semibold" textAnchor="middle">
                            💡 Target allows events.amazonaws.com in its Resource-Based Policy.
                          </text>
                        </>
                      ) : (
                        <>
                          {/* Flow lines passing through IAM role */}
                          <path d="M 70 60 L 105 60" fill="none" stroke="#2563eb" strokeWidth="1.5" className="da-flow-blue" />
                          <path d="M 135 60 L 160 60" fill="none" stroke="#2563eb" strokeWidth="1.5" className="da-flow-blue" />
                          
                          {/* IAM Role node */}
                          <g transform="translate(100, 48)">
                            <rect x="0" y="0" width="38" height="24" rx="4" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
                            <text x="19" y="11" fill="#78350f" fontSize="6" fontWeight="bold" textAnchor="middle">IAM</text>
                            <text x="19" y="18" fill="#b45309" fontSize="5.5" fontWeight="bold" textAnchor="middle">Role</text>
                          </g>

                          {/* Kinesis Target */}
                          <g transform="translate(165, 45)">
                            <rect x="0" y="0" width="65" height="30" rx="6" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
                            <text x="32.5" y="14" fill="#334155" fontSize="7.5" fontWeight="black" textAnchor="middle">Kinesis / SQS</text>
                            <text x="32.5" y="23" fill="#64748b" fontSize="5.5" fontWeight="bold" textAnchor="middle">Service role</text>
                          </g>

                          {/* Info overlay */}
                          <rect x="10" y="90" width="220" height="22" rx="4" fill="#fffdf5" stroke="#fef3c7" strokeWidth="0.5" />
                          <text x="120" y="103" fill="#78350f" fontSize="6.5" fontWeight="semibold" textAnchor="middle">
                            💡 EventBridge Rule assumes the Service Role to write data downstream.
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
                <svg className="w-full min-w-[580px] h-[340px]" viewBox="0 0 600 340">
                  <defs>
                    <marker id="arrow-org" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
                    </marker>
                    <marker id="arrow-blue-org" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#2563eb" />
                    </marker>
                    <marker id="arrow-rose-org" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#e11d48" />
                    </marker>
                  </defs>

                  {/* Connectors & Pipelines */}
                  {/* Root -> Management */}
                  <path d="M 85 90 H 125" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                  
                  {/* Root -> Sandbox OU */}
                  <path d="M 85 100 Q 140 180 180 180" fill="none" 
                    className={scpSimState === 'running' && (selectedNodeId === 'acct-a' || selectedNodeId === 'acct-b' || selectedNodeId === 'acct-c') ? 'da-flow-blue' : ''} 
                    stroke={scpSimState === 'blocked' && (selectedNodeId === 'acct-a' || selectedNodeId === 'acct-b' || selectedNodeId === 'acct-c') && simAccountAction.startsWith('s3:') ? '#f43f5e' : '#cbd5e1'} 
                    strokeWidth="1.5" markerEnd="url(#arrow-org)" />
                  
                  {/* Root -> Workload OU */}
                  <path d="M 85 100 Q 140 30 185 30" fill="none" 
                    className={scpSimState === 'running' && (selectedNodeId === 'acct-d' || selectedNodeId === 'acct-e' || selectedNodeId === 'acct-f') ? 'da-flow-blue' : ''} 
                    stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow-org)" />

                  {/* Sandbox OU -> Account A */}
                  <path d="M 255 180 H 335" fill="none" 
                    className={scpSimState === 'running' && selectedNodeId === 'acct-a' ? 'da-flow-blue' : ''} 
                    stroke={scpSimState === 'blocked' && selectedNodeId === 'acct-a' && (simAccountAction.startsWith('s3:') || simAccountAction.startsWith('ec2:')) ? '#f43f5e' : '#cbd5e1'} 
                    strokeWidth="1.5" markerEnd="url(#arrow-org)" />
                  
                  {/* Sandbox OU -> Account B */}
                  <path d="M 255 180 Q 300 230 335 230" fill="none" 
                    className={scpSimState === 'running' && selectedNodeId === 'acct-b' ? 'da-flow-blue' : ''} 
                    stroke={scpSimState === 'blocked' && selectedNodeId === 'acct-b' && simAccountAction.startsWith('s3:') ? '#f43f5e' : '#cbd5e1'} 
                    strokeWidth="1.5" markerEnd="url(#arrow-org)" />

                  {/* Sandbox OU -> Account C */}
                  <path d="M 255 180 Q 300 280 335 280" fill="none" 
                    className={scpSimState === 'running' && selectedNodeId === 'acct-c' ? 'da-flow-blue' : ''} 
                    stroke={scpSimState === 'blocked' && selectedNodeId === 'acct-c' && simAccountAction.startsWith('s3:') ? '#f43f5e' : '#cbd5e1'} 
                    strokeWidth="1.5" markerEnd="url(#arrow-org)" />

                  {/* Workload OU -> Test OU */}
                  <path d="M 255 30 Q 300 75 335 75" fill="none" 
                    className={scpSimState === 'running' && selectedNodeId === 'acct-d' ? 'da-flow-blue' : ''} 
                    stroke={scpSimState === 'blocked' && selectedNodeId === 'acct-d' && !simAccountAction.startsWith('ec2:') ? '#f43f5e' : '#cbd5e1'} 
                    strokeWidth="1.5" markerEnd="url(#arrow-org)" />

                  {/* Workload OU -> Prod OU */}
                  <path d="M 255 30 H 335" fill="none" 
                    className={scpSimState === 'running' && (selectedNodeId === 'acct-e' || selectedNodeId === 'acct-f') ? 'da-flow-blue' : ''} 
                    stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow-org)" />

                  {/* Test OU -> Account D */}
                  <path d="M 405 75 H 445" fill="none" 
                    className={scpSimState === 'running' && selectedNodeId === 'acct-d' ? 'da-flow-blue' : ''} 
                    stroke={scpSimState === 'blocked' && selectedNodeId === 'acct-d' && !simAccountAction.startsWith('ec2:') ? '#f43f5e' : '#cbd5e1'} 
                    strokeWidth="1.5" markerEnd="url(#arrow-org)" />

                  {/* Prod OU -> Account E */}
                  <path d="M 405 30 Q 430 15 445 15" fill="none" 
                    className={scpSimState === 'running' && selectedNodeId === 'acct-e' ? 'da-flow-blue' : ''} 
                    stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow-org)" />

                  {/* Prod OU -> Account F */}
                  <path d="M 405 30 Q 430 45 445 45" fill="none" 
                    className={scpSimState === 'running' && selectedNodeId === 'acct-f' ? 'da-flow-blue' : ''} 
                    stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#arrow-org)" />

                  {/* ==================== NODES LAYOUT ==================== */}
                  {/* Root Node */}
                  <g transform="translate(10, 75)" className="da-node-btn" onClick={() => setSelectedNodeId('root')}>
                    <rect x="0" y="0" width="75" height="36" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                    <text x="37.5" y="16" fill="#f8fafc" fontSize="8" fontWeight="black" textAnchor="middle">🏢 OU (root)</text>
                    <text x="37.5" y="27" fill="#10b981" fontSize="6.5" fontWeight="bold" textAnchor="middle">FullAWSAccess</text>
                  </g>

                  {/* Management Account */}
                  <g transform="translate(135, 78)" className="da-node-btn" onClick={() => setSelectedNodeId('management')}>
                    <rect x="0" y="0" width="105" height="30" rx="4" fill="#faf5ff" stroke="#a855f7" strokeWidth="1" />
                    <text x="52.5" y="13" fill="#6b21a8" fontSize="7" fontWeight="black" textAnchor="middle">Management Account</text>
                    <text x="52.5" y="22" fill="#a855f7" fontSize="5.5" fontWeight="bold" textAnchor="middle">⛔ NO SCP APPLIED</text>
                  </g>

                  {/* Sandbox OU */}
                  <g transform="translate(180, 162)" className="da-node-btn" onClick={() => setSelectedNodeId('sandbox-ou')}>
                    <rect x="0" y="0" width="75" height="36" rx="6" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.5" />
                    <text x="37.5" y="16" fill="#78350f" fontSize="8" fontWeight="black" textAnchor="middle">📦 OU (Sandbox)</text>
                    <text x="37.5" y="27" fill="#ef4444" fontSize="6" fontWeight="bold" textAnchor="middle">Deny S3</text>
                  </g>

                  {/* Workload OU */}
                  <g transform="translate(180, 12)" className="da-node-btn" onClick={() => setSelectedNodeId('workload-ou')}>
                    <rect x="0" y="0" width="75" height="36" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                    <text x="37.5" y="16" fill="#065f46" fontSize="8" fontWeight="black" textAnchor="middle">⚙️ OU (Workload)</text>
                    <text x="37.5" y="27" fill="#059669" fontSize="6" fontWeight="bold" textAnchor="middle">FullAWSAccess</text>
                  </g>

                  {/* Test OU */}
                  <g transform="translate(330, 57)" className="da-node-btn" onClick={() => setSelectedNodeId('test-ou')}>
                    <rect x="0" y="0" width="75" height="36" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                    <text x="37.5" y="16" fill="#1e3a8a" fontSize="8" fontWeight="black" textAnchor="middle">🧪 OU (Test)</text>
                    <text x="37.5" y="27" fill="#2563eb" fontSize="6" fontWeight="bold" textAnchor="middle">Allow EC2 only</text>
                  </g>

                  {/* Prod OU */}
                  <g transform="translate(330, 12)" className="da-node-btn" onClick={() => setSelectedNodeId('prod-ou')}>
                    <rect x="0" y="0" width="75" height="36" rx="6" fill="#f0fdf4" stroke="#16a34a" strokeWidth="1.5" />
                    <text x="37.5" y="16" fill="#14532d" fontSize="8" fontWeight="black" textAnchor="middle">🚀 OU (Prod)</text>
                    <text x="37.5" y="27" fill="#16a34a" fontSize="6" fontWeight="bold" textAnchor="middle">FullAWSAccess</text>
                  </g>

                  {/* Account A (Sandbox) */}
                  <g transform="translate(345, 162)" className="da-node-btn" onClick={() => setSelectedNodeId('acct-a')}>
                    <rect x="0" y="0" width="95" height="36" rx="4" 
                      fill={selectedNodeId === 'acct-a' ? '#eff6ff' : '#ffffff'} 
                      stroke={selectedNodeId === 'acct-a' ? '#2563eb' : '#94a3b8'} 
                      strokeWidth={selectedNodeId === 'acct-a' ? '2' : '1'} />
                    <text x="47.5" y="13" fill="#1e293b" fontSize="7.5" fontWeight="black" textAnchor="middle">🖥️ Account A</text>
                    <text x="47.5" y="22" fill="#ef4444" fontSize="5.5" fontWeight="bold" textAnchor="middle">Deny EC2 | Deny S3</text>
                    <text x="47.5" y="30" fill="#64748b" fontSize="5" textAnchor="middle">ID: 222222222222</text>
                  </g>

                  {/* Account B (Sandbox) */}
                  <g transform="translate(345, 212)" className="da-node-btn" onClick={() => setSelectedNodeId('acct-b')}>
                    <rect x="0" y="0" width="95" height="36" rx="4" 
                      fill={selectedNodeId === 'acct-b' ? '#eff6ff' : '#ffffff'} 
                      stroke={selectedNodeId === 'acct-b' ? '#2563eb' : '#94a3b8'} 
                      strokeWidth={selectedNodeId === 'acct-b' ? '2' : '1'} />
                    <text x="47.5" y="13" fill="#1e293b" fontSize="7.5" fontWeight="black" textAnchor="middle">🖥️ Account B</text>
                    <text x="47.5" y="22" fill="#dc2626" fontSize="5.5" fontWeight="bold" textAnchor="middle">Inherited Deny S3</text>
                    <text x="47.5" y="30" fill="#64748b" fontSize="5" textAnchor="middle">ID: 333333333333</text>
                  </g>

                  {/* Account C (Sandbox) */}
                  <g transform="translate(345, 262)" className="da-node-btn" onClick={() => setSelectedNodeId('acct-c')}>
                    <rect x="0" y="0" width="95" height="36" rx="4" 
                      fill={selectedNodeId === 'acct-c' ? '#eff6ff' : '#ffffff'} 
                      stroke={selectedNodeId === 'acct-c' ? '#2563eb' : '#94a3b8'} 
                      strokeWidth={selectedNodeId === 'acct-c' ? '2' : '1'} />
                    <text x="47.5" y="13" fill="#1e293b" fontSize="7.5" fontWeight="black" textAnchor="middle">🖥️ Account C</text>
                    <text x="47.5" y="22" fill="#dc2626" fontSize="5.5" fontWeight="bold" textAnchor="middle">Inherited Deny S3</text>
                    <text x="47.5" y="30" fill="#64748b" fontSize="5" textAnchor="middle">ID: 444444444444</text>
                  </g>

                  {/* Account D (Test) */}
                  <g transform="translate(455, 57)" className="da-node-btn" onClick={() => setSelectedNodeId('acct-d')}>
                    <rect x="0" y="0" width="95" height="36" rx="4" 
                      fill={selectedNodeId === 'acct-d' ? '#eff6ff' : '#ffffff'} 
                      stroke={selectedNodeId === 'acct-d' ? '#2563eb' : '#94a3b8'} 
                      strokeWidth={selectedNodeId === 'acct-d' ? '2' : '1'} />
                    <text x="47.5" y="13" fill="#1e293b" fontSize="7.5" fontWeight="black" textAnchor="middle">🖥️ Account D</text>
                    <text x="47.5" y="22" fill="#2563eb" fontSize="5.5" fontWeight="bold" textAnchor="middle">Whitelist ONLY EC2</text>
                    <text x="47.5" y="30" fill="#64748b" fontSize="5" textAnchor="middle">ID: 555555555555</text>
                  </g>

                  {/* Account E (Prod) */}
                  <g transform="translate(455, 2)" className="da-node-btn" onClick={() => setSelectedNodeId('acct-e')}>
                    <rect x="0" y="0" width="95" height="18" rx="3" 
                      fill={selectedNodeId === 'acct-e' ? '#eff6ff' : '#ffffff'} 
                      stroke={selectedNodeId === 'acct-e' ? '#2563eb' : '#94a3b8'} 
                      strokeWidth={selectedNodeId === 'acct-e' ? '1.5' : '1'} />
                    <text x="47.5" y="11" fill="#1e293b" fontSize="7" fontWeight="black" textAnchor="middle">🖥️ Account E (Prod)</text>
                  </g>

                  {/* Account F (Prod) */}
                  <g transform="translate(455, 32)" className="da-node-btn" onClick={() => setSelectedNodeId('acct-f')}>
                    <rect x="0" y="0" width="95" height="18" rx="3" 
                      fill={selectedNodeId === 'acct-f' ? '#eff6ff' : '#ffffff'} 
                      stroke={selectedNodeId === 'acct-f' ? '#2563eb' : '#94a3b8'} 
                      strokeWidth={selectedNodeId === 'acct-f' ? '1.5' : '1'} />
                    <text x="47.5" y="11" fill="#1e293b" fontSize="7" fontWeight="black" textAnchor="middle">🖥️ Account F (Prod)</text>
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
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden da-svg-bg h-48">
                {iamSimState === 'allowed' && (
                  <div className="absolute inset-0 bg-emerald-500/5 backdrop-blur-[1px] flex items-center justify-center z-10 animate-fadeIn">
                    <div className="bg-white border-2 border-emerald-500 px-4 py-2 rounded-2xl shadow-xl text-center">
                      <span className="text-emerald-700 font-black text-xs block">🟢 STS API TRANSACTION GRANTED</span>
                      <span className="text-[10px] text-slate-550 font-bold">Bob is authorized to execute {targetAction}!</span>
                    </div>
                  </div>
                )}
                {iamSimState === 'blocked' && (
                  <div className="absolute inset-0 bg-rose-500/5 backdrop-blur-[1px] flex items-center justify-center z-10 animate-fadeIn">
                    <div className="bg-white border-2 border-rose-500 px-4 py-2 rounded-2xl shadow-xl text-center">
                      <span className="text-rose-700 font-black text-xs block">❌ 403 API TRANSACTION HALTED</span>
                      <span className="text-[10px] text-slate-550 font-bold">Explicit deny or implicit mismatch halted transaction.</span>
                    </div>
                  </div>
                )}

                <svg className="w-full h-full" viewBox="0 0 450 160">
                  {/* Lines representing sequential flow */}
                  <line x1="45" y1="80" x2="115" y2="80" stroke={iamEvalStep >= 1 ? '#2563eb' : '#cbd5e1'} strokeWidth={iamEvalStep >= 1 ? '2.5' : '1.5'} />
                  <line x1="115" y1="80" x2="185" y2="80" stroke={iamEvalStep >= 2 ? '#2563eb' : '#cbd5e1'} strokeWidth={iamEvalStep >= 2 ? '2.5' : '1.5'} />
                  <line x1="185" y1="80" x2="255" y2="80" stroke={iamEvalStep >= 3 ? '#2563eb' : '#cbd5e1'} strokeWidth={iamEvalStep >= 3 ? '2.5' : '1.5'} />
                  <line x1="255" y1="80" x2="325" y2="80" stroke={iamEvalStep >= 4 ? '#2563eb' : '#cbd5e1'} strokeWidth={iamEvalStep >= 4 ? '2.5' : '1.5'} />
                  <line x1="325" y1="80" x2="395" y2="80" stroke={iamEvalStep >= 5 ? '#2563eb' : '#cbd5e1'} strokeWidth={iamEvalStep >= 5 ? '2.5' : '1.5'} />

                  {/* Flow pulses */}
                  {iamSimState === 'running' && (
                    <circle cx={45 + iamEvalStep * 70} cy="80" r="4.5" fill="#2563eb" className="animate-ping" />
                  )}

                  {/* Step 1: IP & Explicit Deny Node */}
                  <g transform="translate(10, 55)">
                    <rect x="0" y="0" width="70" height="50" rx="6" 
                      fill={iamEvalStep === 1 ? '#eff6ff' : '#ffffff'} 
                      stroke={iamEvalStep === 1 ? '#2563eb' : '#cbd5e1'} strokeWidth={iamEvalStep === 1 ? '2' : '1'} />
                    <text x="35" y="15" fill="#334155" fontSize="7.5" fontWeight="bold" textAnchor="middle">1. Explicit Deny</text>
                    <text x="35" y="27" fill="#64748b" fontSize="6.5" textAnchor="middle">IP/MFA Check</text>
                    <text x="35" y="38" fill={clientIp === 'public' || (targetAction === 'ec2:StopInstances' && !mfaStatus) ? '#ef4444' : '#10b981'} fontSize="6" fontWeight="extrabold" textAnchor="middle">
                      {clientIp === 'public' || (targetAction === 'ec2:StopInstances' && !mfaStatus) ? '🚨 Deny' : '🟢 Pass'}
                    </text>
                  </g>

                  {/* Step 2: Org SCP filter */}
                  <g transform="translate(90, 55)">
                    <rect x="0" y="0" width="70" height="50" rx="6" 
                      fill={iamEvalStep === 2 ? '#eff6ff' : '#ffffff'} 
                      stroke={iamEvalStep === 2 ? '#2563eb' : '#cbd5e1'} strokeWidth={iamEvalStep === 2 ? '2' : '1'} />
                    <text x="35" y="15" fill="#334155" fontSize="7.5" fontWeight="bold" textAnchor="middle">2. SCP Filter</text>
                    <text x="35" y="27" fill="#64748b" fontSize="6.5" textAnchor="middle">Org Boundary</text>
                    <text x="35" y="38" fill="#10b981" fontSize="6" fontWeight="extrabold" textAnchor="middle">🟢 Pass</text>
                  </g>

                  {/* Step 3: Permission Boundary */}
                  <g transform="translate(170, 55)">
                    <rect x="0" y="0" width="70" height="50" rx="6" 
                      fill={iamEvalStep === 3 ? '#eff6ff' : '#ffffff'} 
                      stroke={iamEvalStep === 3 ? '#2563eb' : '#cbd5e1'} strokeWidth={iamEvalStep === 3 ? '2' : '1'} />
                    <text x="35" y="15" fill="#334155" fontSize="7.5" fontWeight="bold" textAnchor="middle">3. Perm Boundary</text>
                    <text x="35" y="27" fill="#64748b" fontSize="6.5" textAnchor="middle">Principal Max</text>
                    <text x="35" y="38" fill="#10b981" fontSize="6" fontWeight="extrabold" textAnchor="middle">🟢 Pass</text>
                  </g>

                  {/* Step 4: Identity & Resource policies */}
                  <g transform="translate(250, 55)">
                    <rect x="0" y="0" width="70" height="50" rx="6" 
                      fill={iamEvalStep === 4 ? '#eff6ff' : '#ffffff'} 
                      stroke={iamEvalStep === 4 ? '#2563eb' : '#cbd5e1'} strokeWidth={iamEvalStep === 4 ? '2' : '1'} />
                    <text x="35" y="15" fill="#334155" fontSize="7.5" fontWeight="bold" textAnchor="middle">4. Identity Policy</text>
                    <text x="35" y="27" fill="#64748b" fontSize="6.5" textAnchor="middle">ABAC Tags</text>
                    <text x="35" y="38" fill={targetAction === 'ec2:StartInstances' && principalDept !== 'Data' ? '#ef4444' : '#10b981'} fontSize="6" fontWeight="extrabold" textAnchor="middle">
                      {targetAction === 'ec2:StartInstances' && principalDept !== 'Data' ? '🚨 Mismatch' : '🟢 Allow'}
                    </text>
                  </g>

                  {/* Step 5: Implicit Deny fallback */}
                  <g transform="translate(330, 55)">
                    <rect x="0" y="0" width="70" height="50" rx="6" 
                      fill={iamEvalStep === 5 ? '#eff6ff' : '#ffffff'} 
                      stroke={iamEvalStep === 5 ? '#2563eb' : '#cbd5e1'} strokeWidth={iamEvalStep === 5 ? '2' : '1'} />
                    <text x="35" y="15" fill="#334155" fontSize="7.5" fontWeight="bold" textAnchor="middle">5. Implicit Deny</text>
                    <text x="35" y="27" fill="#64748b" fontSize="6.5" textAnchor="middle">Fallback block</text>
                    <text x="35" y="38" fill="#ef4444" fontSize="6" fontWeight="extrabold" textAnchor="middle">⛔ Blocked</text>
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
                <svg className="w-full h-full" viewBox="0 0 280 180">
                  <defs>
                    <marker id="arrow-sync" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {/* Flow lines */}
                  <path d="M 70 80 L 140 80" fill="none" stroke="#2563eb" strokeWidth="2" className={syncState === 'running' ? 'da-flow-blue' : ''} />
                  <path d="M 210 80 L 265 80" fill="none" stroke="#10b981" strokeWidth="2" className={syncState === 'running' ? 'da-flow-green' : ''} />

                  {/* Left: Active Directory Domain Controller */}
                  <g transform="translate(10, 50)">
                    <rect x="0" y="0" width="60" height="50" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                    <text x="30" y="16" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">Active</text>
                    <text x="30" y="27" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">Directory</text>
                    <text x="30" y="38" fill="#94a3b8" fontSize="5.5" textAnchor="middle">Domain Controller</text>
                  </g>

                  {/* Center: AD Connector proxy or Managed AD Node */}
                  <g transform="translate(140, 50)">
                    <rect x="0" y="0" width="70" height="50" rx="6" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5" />
                    <text x="35" y="16" fill="#78350f" fontSize="7" fontWeight="bold" textAnchor="middle">
                      {selectedDirectory === 'managed_ad' ? 'Managed AD' : selectedDirectory === 'ad_connector' ? 'AD Connector' : 'Simple AD'}
                    </text>
                    <text x="35" y="27" fill="#b45309" fontSize="5.5" textAnchor="middle">Proxy Bind</text>
                    <text x="35" y="38" fill="#d97706" fontSize="5.5" fontWeight="bold" textAnchor="middle">
                      {syncState === 'running' ? 'Active Tunel' : 'LDAP Port 389'}
                    </text>
                  </g>

                  {/* Right: SSO Portal target accounts */}
                  <g transform="translate(210, 50)">
                    <rect x="0" y="0" width="60" height="50" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                    <text x="30" y="16" fill="#065f46" fontSize="7" fontWeight="bold" textAnchor="middle">SSO Portal</text>
                    <text x="30" y="27" fill="#047857" fontSize="5" textAnchor="middle">IAM Portal</text>
                    <text x="30" y="38" fill="#10b981" fontSize="5.5" fontWeight="bold" textAnchor="middle">
                      {syncState === 'success' ? 'Active Portal' : 'Standby Sync'}
                    </text>
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
                <svg className="w-full h-full" viewBox="0 0 280 120">
                  {/* Flow pipeline */}
                  <path d="M 70 60 H 140" fill="none" stroke="#64748b" strokeWidth="1.5" className={complianceState === 'deploying' ? 'da-flow-blue' : ''} />
                  <path d="M 210 60 H 265" fill="none" stroke="#64748b" strokeWidth="1.5" className={complianceState === 'remediated' ? 'da-flow-green' : ''} />

                  {/* Left: Dispatch resource */}
                  <g transform="translate(10, 35)">
                    <rect x="0" y="0" width="60" height="50" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                    <text x="30" y="16" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">Resource</text>
                    <text x="30" y="27" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">Deployment</text>
                    <text x="30" y="38" fill="#94a3b8" fontSize="5.5" textAnchor="middle">API Dispatch</text>
                  </g>

                  {/* Center: Control Tower config rule recorder */}
                  <g transform="translate(140, 35)">
                    <rect x="0" y="0" width="70" height="50" rx="6" 
                      fill={complianceState === 'idle' ? '#ffffff' : complianceState === 'remediated' ? '#ecfdf5' : nonCompliantCount > 0 ? '#fef2f2' : '#ecfdf5'} 
                      stroke={complianceState === 'idle' ? '#94a3b8' : complianceState === 'remediated' ? '#10b981' : nonCompliantCount > 0 ? '#ef4444' : '#10b981'} 
                      strokeWidth="1.5" />
                    <text x="35" y="15" fill="#334155" fontSize="7" fontWeight="bold" textAnchor="middle">AWS Config</text>
                    <text x="35" y="24" fill="#64748b" fontSize="5.5" textAnchor="middle">Audit Recorder</text>
                    <text x="30" y="34" fill={nonCompliantCount > 0 ? '#991b1b' : '#047857'} fontSize="6.5" fontWeight="extrabold" textAnchor="middle">
                      {complianceState === 'idle' ? 'STANDBY' : complianceState === 'remediated' ? 'REMEDIATED' : nonCompliantCount > 0 ? '❌ BREACHED' : '🟢 ALLOWED'}
                    </text>
                  </g>

                  {/* Right: SSM automated runbook baseline */}
                  <g transform="translate(220, 35)">
                    <rect x="0" y="0" width="50" height="50" rx="6" 
                      fill={complianceState === 'idle' ? '#e2e8f0' : complianceState === 'remediated' ? '#d1fae5' : nonCompliantCount > 0 ? '#fee2e2' : '#d1fae5'} 
                      stroke={complianceState === 'idle' ? '#cbd5e1' : complianceState === 'remediated' ? '#10b981' : nonCompliantCount > 0 ? '#ef4444' : '#10b981'} 
                      strokeWidth="1.5" />
                    <text x="25" y="16" fill="#334155" fontSize="6.5" fontWeight="bold" textAnchor="middle">SSM</text>
                    <text x="25" y="27" fill="#64748b" fontSize="5.5" textAnchor="middle">Runbook</text>
                    <text x="25" y="38" fill="#475569" fontSize="6" fontWeight="bold" textAnchor="middle">
                      {complianceState === 'idle' ? 'BASELINE' : complianceState === 'remediated' ? 'SECURED' : nonCompliantCount > 0 ? 'BREACHED' : 'COMPLIANT'}
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

    </div>
  );
}
