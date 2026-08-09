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
  Key,
  Play,
  RefreshCw,
  SlidersHorizontal,
  Terminal,
  Network,
  Server,
  Lock,
  Unlock,
  AlertTriangle
} from 'lucide-react';
import SecretsAndKMSEncryptionComparativeView from '../../components/visualizers/SecretsAndKMSEncryptionComparativeView';
import UniqueSecretsAndKMSEncryptionFeatures from '../../components/visualizers/UniqueSecretsAndKMSEncryptionFeatures';

type TabType = 'notebook' | 'intro' | 'kms' | 'envelope' | 'multiregion' | 'crossaccount' | 'unique';

interface LogRow {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

interface SecretsAndKMSEncryptionVisualizerProps {
  provider?: 'aws' | 'azure' | 'gcp' | 'comparative';
  setProvider?: (provider: 'aws' | 'azure' | 'gcp' | 'comparative') => void;
}

export default function SecretsAndKMSEncryptionVisualizer({ provider = 'aws', setProvider }: SecretsAndKMSEncryptionVisualizerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');

  // Visual Architect Notes & Theories Academy State
  const [selectedNote, setSelectedNote] = useState<string>('kms_vs_secrets');
  const [expandedCategory, setExpandedCategory] = useState<string>('kms_fundamentals');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  const isComparative = provider === 'comparative';

  const t = (text: string) => {
    if (provider === 'azure') {
      return text
        .replace(/AWS KMS/gi, 'Azure Key Vault (Keys)')
        .replace(/AWS Secrets Manager/gi, 'Azure Key Vault (Secrets)')
        .replace(/SSM Parameter Store/gi, 'Azure App Configuration')
        .replace(/KMS Key/gi, 'Key Vault Key')
        .replace(/CloudWatch/g, 'Azure Monitor');
    }
    if (provider === 'gcp') {
      return text
        .replace(/AWS KMS/gi, 'Google Cloud KMS')
        .replace(/AWS Secrets Manager/gi, 'Google Cloud Secret Manager')
        .replace(/SSM Parameter Store/gi, 'GCP Secret Manager / Config Sync')
        .replace(/KMS Key/gi, 'Cloud KMS Key Ring')
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
        if (node.type === 'pre' || node.type === 'code' || (node.props && (node.props.className === 'kms-terminal' || node.props.className === 'kms-code-card'))) {
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
    setActiveTab(tab === 'secrets' ? 'intro' : tab === 'architect' ? 'notebook' : tab);
  };



  // ==========================================
  // TAB 1 STATE: Topics & Compare Selection
  // ==========================================
  const [selectedTopic, setSelectedTopic] = useState<'kms' | 'ssm' | 'secretsmanager'>('kms');

  // ==========================================
  // TAB 2 STATE: KMS Key Management & Policies
  // ==========================================
  const [keyType, setKeyType] = useState<'symmetric' | 'asymmetric' | 'hmac'>('symmetric');
  const [keyOrigin, setKeyOrigin] = useState<'aws' | 'customer' | 'external'>('customer');
  const [policySetup, setPolicySetup] = useState<'delegated' | 'restricted' | 'lockout'>('delegated');
  const [rotationActive, setRotationActive] = useState<boolean>(true);
  const [kmsState, setKmsState] = useState<'idle' | 'rotating' | 'success' | 'failed'>('idle');
  const [kmsLogs, setKmsLogs] = useState<LogRow[]>([]);

  // ==========================================
  // TAB 3 STATE: Envelope Encryption Client-Side
  // ==========================================
  const [plainPayload, setPlainPayload] = useState<string>('Confidential payload data - Top Secret Corporate Logs');
  const [plaintextDataKey, setPlaintextDataKey] = useState<string>('');
  const [encryptedDataKey, setEncryptedDataKey] = useState<string>('');
  const [cipherPayload, setCipherPayload] = useState<string>('');
  const [decryptedPayload, setDecryptedPayload] = useState<string>('');
  const [envelopeState, setEnvelopeState] = useState<'idle' | 'generating' | 'encrypted' | 'decrypting' | 'decrypted'>('idle');
  const [envelopeLogs, setEnvelopeLogs] = useState<LogRow[]>([]);

  // ==========================================
  // TAB 4 STATE: Multi-Region & Global Replication Scenarios
  // ==========================================
  const [globalScenario, setGlobalScenario] = useState<'dynamodb' | 'aurora' | 's3' | 'snapshot'>('dynamodb');
  const [mrkPrimaryActive, setMrkPrimaryActive] = useState<boolean>(true);
  const [replicationLogs, setReplicationLogs] = useState<LogRow[]>([]);
  const [replicationState, setReplicationState] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');

  // ==========================================
  // TAB 5 STATE: Cross-Account & Shared AMIs (KMS)
  // ==========================================
  const [crossAccountPolicy, setCrossAccountPolicy] = useState<'denied' | 'allowed'>('denied');
  const [bootState, setBootState] = useState<'idle' | 'booting' | 'success' | 'failed'>('idle');
  const [bootLogs, setBootLogs] = useState<LogRow[]>([]);

  // ==========================================
  // TAB 2 SIMULATOR: KMS Key Rotation & Policy Sandboxes
  // ==========================================
  const triggerRotation = async () => {
    if (kmsState === 'rotating') return;
    setKmsState('rotating');
    setKmsLogs([]);
    const timestamp = new Date().toLocaleTimeString();

    setKmsLogs(prev => [...prev, { timestamp, message: `[KMS] Initiating key rotation sequence for Customer Managed Key (CMK) key-9b8a7c6...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 600));

    if (keyOrigin === 'aws') {
      setKmsLogs(prev => [
        ...prev,
        { timestamp, message: `💡 [INFO] AWS Managed Key detected. Rotation occurs automatically every 3 years (1095 days). Material is rotated, older backing layers preserved.`, type: 'warn' },
        { timestamp, message: `[COMPLETED] AWS Managed Key rotation validated cleanly.`, type: 'success' }
      ]);
      setKmsState('success');
      return;
    }

    if (keyOrigin === 'external') {
      setKmsLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [BYOK EXCEPTION] External Imported Key Material cannot be automatically rotated by KMS. BYOK keys require manual rotation (material imported under a new key ID).`, type: 'error' },
        { timestamp, message: `[FAILED] Key rotation sequence terminated.`, type: 'error' }
      ]);
      setKmsState('failed');
      return;
    }

    // Customer Managed Key
    setKmsLogs(prev => [...prev, { timestamp, message: `[CMK] Checking Customer Managed Key automatic 1-year rotation flag state...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 800));

    if (rotationActive) {
      setKmsLogs(prev => [
        ...prev,
        { timestamp, message: `🟢 [AUTOMATIC ACTIVE] Automatically generating a new active cryptographic backing key layer...`, type: 'info' },
        { timestamp, message: `[CMK] Syncing Key Material: Encrypted data remains decryptable utilizing historic backing materials. New writes will adopt new layer.`, type: 'success' },
        { timestamp, message: `[COMPLETED] Rotation success. Backing version 2 spawned seamlessly.`, type: 'success' }
      ]);
      setKmsState('success');
    } else {
      setKmsLogs(prev => [
        ...prev,
        { timestamp, message: `⚠️ [MANUAL MODE] Automatic rotation is disabled. CMK will preserve original material indefinitely.`, type: 'warn' },
        { timestamp, message: `💡 [MANUAL STEPS] Manual rotation requires launching a new CMK ID and remapping the Key Alias (e.g. alias/app-key ➔ key-v2-id).`, type: 'info' },
        { timestamp, message: `[SUCCESS] Manual audit completed.`, type: 'success' }
      ]);
      setKmsState('success');
    }
  };

  const evaluateKmsPolicy = () => {
    setKmsLogs([]);
    const timestamp = new Date().toLocaleTimeString();
    
    if (policySetup === 'delegated') {
      setKmsLogs(prev => [
        ...prev,
        { timestamp, message: `🟢 [DELEGATED KEY POLICY] Statement "Enable IAM User Permissions" is active.`, type: 'info' },
        { timestamp, message: `💡 [EVALUATION] Administrative access is delegated to the Account Root ("Principal": {"AWS": "arn:aws:iam::123456789012:root"}).`, type: 'info' },
        { timestamp, message: `[PASSED] IAM Policies (AdministratorAccess, custom KMS policies) can grant access to users inside the account successfully.`, type: 'success' }
      ]);
    } else if (policySetup === 'restricted') {
      setKmsLogs(prev => [
        ...prev,
        { timestamp, message: `⚠️ [RESTRICTED KEY POLICY] Default IAM delegation is active, but a strict condition statement limits usage to specified roles.`, type: 'warn' },
        { timestamp, message: `💡 [EVALUATION] Key policy restricts "kms:Decrypt" only to Principal "Role: app-ecs-task-role". All other internal account users are blocked.`, type: 'info' },
        { timestamp, message: `[SUCCESS] Policy boundary verified.`, type: 'success' }
      ]);
    } else {
      setKmsLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [CRITICAL ALERT] Key lockout state simulated! The IAM delegation statement ("Principal": {"AWS": "arn:aws:iam::123456789012:root"}) was DELETED.`, type: 'error' },
        { timestamp, message: `💥 [LOCKED OUT] Key becomes completely UNMANAGEABLE. IAM users inside this account (including the Account Administrator/Root) cannot edit this policy or decrypt resources!`, type: 'error' },
        { timestamp, message: `💡 [REMEDIATION] Remediation requires contacting AWS Support to submit a key policy override request, as root keys cannot edit direct KMS key policy locks.`, type: 'error' }
      ]);
    }
  };

  // ==========================================
  // TAB 3 SIMULATOR: Envelope Client-Side Encryption
  // ==========================================
  const executeEnvelopeEncryption = async () => {
    if (envelopeState === 'generating') return;
    setEnvelopeState('generating');
    setEnvelopeLogs([]);
    const timestamp = new Date().toLocaleTimeString();

    setEnvelopeLogs(prev => [...prev, { timestamp, message: `[CLIENT] Requesting GenerateDataKey API call from KMS CMK key-9b8a7c6...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 600));

    // Spawn keys
    const rawPlaintextKey = Math.random().toString(16).substring(2, 10).toUpperCase() + '-' + Math.random().toString(16).substring(2, 10).toUpperCase();
    const rawCipherKey = 'CIPHER-' + Math.random().toString(16).substring(2, 12).toUpperCase() + '-' + Math.random().toString(16).substring(2, 12).toUpperCase();

    setPlaintextDataKey(rawPlaintextKey);
    setEncryptedDataKey(rawCipherKey);

    setEnvelopeLogs(prev => [
      ...prev,
      { timestamp, message: `🟢 [KMS API SUCCESS] KMS returned PlaintextDataKey and EncryptedDataKey (wrapped by CMK).`, type: 'success' },
      { timestamp, message: `🔑 [PLAINTEXT KEY DATA]: ${rawPlaintextKey}`, type: 'success' },
      { timestamp, message: `🔒 [ENCRYPTED KEY DATA]: ${rawCipherKey}`, type: 'success' }
    ]);
    await new Promise(r => setTimeout(r, 800));

    setEnvelopeLogs(prev => [...prev, { timestamp, message: `[CLIENT] Encrypting plaintext payload locally using PlaintextDataKey...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 600));

    // Mock cipher payload
    const mockCipher = Buffer.from(plainPayload).toString('base64').substring(0, 48) + '...==';
    setCipherPayload(mockCipher);

    setEnvelopeLogs(prev => [
      ...prev,
      { timestamp, message: `🔒 [LOCAL ENCRYPTION COMPLETE] Ciphertext Payload generated securely locally.`, type: 'success' },
      { timestamp, message: `💥 [SECURITY PURGE] Destroying PlaintextDataKey from client memory space! (Zero-trust secure state)`, type: 'warn' }
    ]);
    
    setPlaintextDataKey(''); // Securely wiped
    setEnvelopeState('encrypted');
  };

  const executeEnvelopeDecryption = async () => {
    if (envelopeState === 'decrypting') return;
    setEnvelopeState('decrypting');
    const timestamp = new Date().toLocaleTimeString();

    setEnvelopeLogs(prev => [
      ...prev,
      { timestamp, message: `[CLIENT] Initiating local decryption. Client memory has: [Cipher Payload] + [Encrypted Data Key].`, type: 'info' },
      { timestamp, message: `[CLIENT] Sending Encrypted Data Key to KMS Decrypt API...`, type: 'info' }
    ]);
    await new Promise(r => setTimeout(r, 1000));

    // Regain key
    const rawPlaintextKey = 'RECOVERED-' + Math.random().toString(16).substring(2, 10).toUpperCase();
    setPlaintextDataKey(rawPlaintextKey);

    setEnvelopeLogs(prev => [
      ...prev,
      { timestamp, message: `🟢 [KMS API SUCCESS] KMS Decrypted key package using CMK, returning Plaintext Data Key.`, type: 'success' },
      { timestamp, message: `🔑 [RECOVERED PLAINTEXT KEY]: ${rawPlaintextKey}`, type: 'success' }
    ]);
    await new Promise(r => setTimeout(r, 800));

    setEnvelopeLogs(prev => [...prev, { timestamp, message: `[CLIENT] Decrypting Base64 cipher local payload using recovered key...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 600));

    setDecryptedPayload(plainPayload);
    setEnvelopeLogs(prev => [
      ...prev,
      { timestamp, message: `🟢 [DECRYPTION COMPLETE] Plaintext Payload fully recovered inside local environment!`, type: 'success' },
      { timestamp, message: `📄 [DECRYPTED PAYLOAD]: "${plainPayload}"`, type: 'success' }
    ]);
    setEnvelopeState('decrypted');
  };

  const resetEnvelopeSim = () => {
    setPlaintextDataKey('');
    setEncryptedDataKey('');
    setCipherPayload('');
    setDecryptedPayload('');
    setEnvelopeState('idle');
    setEnvelopeLogs([]);
  };

  // ==========================================
  // TAB 4 SIMULATOR: Global Replication (DynamoDB, Aurora, S3)
  // ==========================================
  const triggerGlobalReplication = async () => {
    if (replicationState === 'running') return;
    setReplicationState('running');
    setReplicationLogs([]);
    const timestamp = new Date().toLocaleTimeString();

    if (globalScenario === 'dynamodb') {
      setReplicationLogs(prev => [...prev, { timestamp, message: `[DYNAMODB] Invoking DynamoDB PutItem in Region: us-east-1...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 600));

      setReplicationLogs(prev => [...prev, { timestamp, message: `[KMS] Calling us-east-1 Local primary KMS Key to encrypt table partition...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 800));

      setReplicationLogs(prev => [...prev, { timestamp, message: `[REPLICATION] DynamoDB Global Tables replicates record to Region: eu-west-1 (Active-Active)...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 800));

      if (mrkPrimaryActive) {
        setReplicationLogs(prev => [
          ...prev,
          { timestamp, message: `🟢 [SUCCESS] eu-west-1 decrypts and re-encrypts the replica table local partition using Local Multi-Region Replica Key (mrk-9b8a7c6...).`, type: 'success' },
          { timestamp, message: `💡 [PERFORMANCE] Bypassed cross-region KMS network hops! Decryption occurs locally within eu-west-1 network latency boundaries.`, type: 'success' }
        ]);
        setReplicationState('success');
      } else {
        setReplicationLogs(prev => [
          ...prev,
          { timestamp, message: `🚨 [REPLICATION ERROR] Replica Multi-Region Key in eu-west-1 has been disabled or is missing!`, type: 'error' },
          { timestamp, message: `💥 [FAILED] DynamoDB Global Table replication stalled in eu-west-1 due to KMS key decryption failure.`, type: 'error' }
        ]);
        setReplicationState('failed');
      }
    } else if (globalScenario === 'aurora') {
      setReplicationLogs(prev => [...prev, { timestamp, message: `[AURORA] Launching Aurora Global Database replication sequence...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 600));

      setReplicationLogs(prev => [
        ...prev,
        { timestamp, message: `[STORAGE] Replicating encrypted storage volumes from us-east-1 (Primary cluster encrypted with key-us) to eu-west-1 (Secondary cluster)...`, type: 'info' },
        { timestamp, message: `💡 [INFO] Aurora Global Database uses region-specific KMS keys. Data is decrypted at primary boundary, replicated via AWS network, and re-encrypted in target region using eu-west-1 regional KMS key.`, type: 'info' },
        ...accountsList().map(() => ({
          timestamp,
          message: `[STORAGE] Write synchronization successfully completed. Target Aurora node encrypted with regional KMS key-eu.`,
          type: 'success' as const
        }))
      ]);
      setReplicationState('success');
    } else if (globalScenario === 's3') {
      setReplicationLogs(prev => [...prev, { timestamp, message: `[S3 CRR] Writing object to source S3 Bucket (us-east-1)...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 600));

      setReplicationLogs(prev => [
        ...prev,
        { timestamp, message: `💡 [S3 BUCKET KEY] S3 Bucket Key is ACTIVE. Reduces KMS API cost overheads by up to 99% by utilizing S3 bucket-level encryption keys instead of repeating KMS API data key generations!`, type: 'warn' },
        { timestamp, message: `[S3 CRR] Replicating encrypted object to destination S3 bucket (eu-west-1)...`, type: 'info' }
      ]);
      await new Promise(r => setTimeout(r, 800));

      setReplicationLogs(prev => [
        ...prev,
        { timestamp, message: `🟢 [RE-ENCRYPT SUCCESS] CRR re-encrypts replicated object at destination bucket using eu-west-1 destination KMS key.`, type: 'success' },
        { timestamp, message: `[COMPLETED] Object synchronized securely across regions. S3 Bucket Key active.`, type: 'success' }
      ]);
      setReplicationState('success');
    } else {
      // snapshot
      setReplicationLogs(prev => [...prev, { timestamp, message: `[EBS SNAPSHOT] Copying EBS Snapshot encrypted with regional key-us to eu-west-1...`, type: 'info' }]);
      await new Promise(r => setTimeout(r, 800));

      setReplicationLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [IMPLICIT DENY] Cannot directly copy an encrypted snapshot using local keys, as eu-west-1 cannot access us-east-1 local KMS keys.`, type: 'error' },
        { timestamp, message: `💡 [DECRYPTION PROCESS] Snapshot is decrypted inside source region, transferred securely, and re-encrypted in eu-west-1 using destination KMS key.`, type: 'warn' },
        { timestamp, message: `🟢 [SUCCESS] Snapshot replication completed. Encrypted with target region's customer managed key.`, type: 'success' }
      ]);
      setReplicationState('success');
    }
  };

  const accountsList = () => {
    return [
      { id: '1', name: 'Aurora Replica node 1' },
      { id: '2', name: 'Aurora Replica node 2' }
    ];
  };

  // ==========================================
  // TAB 5 SIMULATOR: Cross-Account Shared AMIs & KMS
  // ==========================================
  const triggerBootInstance = async () => {
    if (bootState === 'booting') return;
    setBootState('booting');
    setBootLogs([]);
    const timestamp = new Date().toLocaleTimeString();

    setBootLogs(prev => [...prev, { timestamp, message: `[ACCOUNT B] Requesting EC2:RunInstances utilizing Shared AMI (AMI-09876abc...) owned by Account A...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 600));

    setBootLogs(prev => [...prev, { timestamp, message: `[EC2 BOOT] Shared AMI EBS root volume is encrypted with Account A custom KMS key-9b8a7c6...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 800));

    setBootLogs(prev => [...prev, { timestamp, message: `[EC2 BOOT] EC2 service role in Account B attempts to decrypt EBS snapshots using Account A's KMS key...`, type: 'info' }]);
    await new Promise(r => setTimeout(r, 800));

    if (crossAccountPolicy === 'allowed') {
      setBootLogs(prev => [
        ...prev,
        { timestamp, message: `🟢 [KEY POLICY MATCH] KMS Key Policy in Account A permits access to Account B! ("Principal": "arn:aws:iam::AccountB:root")`, type: 'success' },
        { timestamp, message: `🔑 [KMS GRANT CREATED] Account B successfully created a KMS Grant for the EC2 service role to decrypt volume blocks.`, type: 'success' },
        { timestamp, message: `🟢 [BOOT SUCCESS] Volume decrypted. EC2 instance booted cleanly in Account B. State: [RUNNING]`, type: 'success' }
      ]);
      setBootState('success');
    } else {
      setBootLogs(prev => [
        ...prev,
        { timestamp, message: `🚨 [KMS DECRYPT FAILURE] Blocked by KMS Key Policy in Account A! Account B is not listed in the key policy principals.`, type: 'error' },
        { timestamp, message: `💥 [BOOT FAILED] 403 AccessDenied - EC2 service role cannot decrypt EBS volume. Instance transition state: [SHUTTING_DOWN]`, type: 'error' },
        { timestamp, message: `💡 [REMEDIATION] Source Account A must update the Custom KMS Key Policy to explicitly allow kms:Decrypt and kms:CreateGrant to Account B.`, type: 'error' }
      ]);
      setBootState('failed');
    }
  };

  const resetBootSim = () => {
    setBootState('idle');
    setBootLogs([]);
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
          
          --da-code-bg: #090d16;
          --da-code-border: #1e293b;
          --da-code-text: #94a3b8;
          
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
          
          --da-svg-red-bg: #fee2e2;
          --da-svg-red-border: #f43f5e;
          --da-svg-red-text: #991b1b;
          
          --da-svg-amber-bg: #fffbeb;
          --da-svg-amber-border: #d97706;
          --da-svg-amber-text: #78350f;
          
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
          box-shadow: 0 12px 20px -8px rgba(37, 99, 235, 0.12);
          border-color: #bfdbfe;
        }
        
        .acad-dir-container {
          background: var(--da-card-bg);
          border: 1px solid var(--da-card-border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: var(--da-card-shadow);
        }
        .acad-dir-header {
          background: var(--da-input-bg);
          color: var(--da-text-title);
          padding: 16px;
          font-weight: 800;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid var(--da-card-border);
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
          color: var(--da-text-title);
        }
        .acad-dir-item-btn {
          width: 105%;
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
          color: #2563eb;
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
          background: var(--da-svg-indigo-bg);
          border: 1.5px solid var(--da-svg-indigo-border);
          color: var(--da-svg-indigo-text);
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
          border: 1px solid var(--da-table-border);
        }
        .acad-table th {
          background: var(--da-table-th-bg);
          color: var(--da-table-th-text);
          font-weight: 800;
          padding: 12px 14px;
          border-bottom: 1.5px solid var(--da-table-border);
          text-align: left;
        }
        .acad-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--da-table-border);
          color: var(--da-table-td-text);
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
          position: relative;
        }
        .acad-copy-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(51, 65, 85, 0.8);
          border: 1px solid rgba(71, 85, 105, 0.8);
          border-radius: 6px;
          color: #e2e8f0;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 4px;
          backdrop-filter: blur(4px);
        }
        .acad-copy-btn:hover {
          background: #334155;
          color: #ffffff;
          border-color: #475569;
        }
        .acad-copy-btn.copied {
          background: #10b981;
          border-color: #10b981;
          color: #ffffff;
        }

        .da-container h1,
        .da-container h2,
        .da-container h3,
        .da-container h4,
        .da-container th,
        .da-container .text-slate-900,
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
      `}</style>

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 mb-6 text-left">
        <div className="flex items-center gap-3">
          <span className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <Key className="w-6 h-6 stroke-[2]" />
          </span>
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              AWS Secrets &amp; KMS Cryptographic Encryption
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                PRO WORKBENCH
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">Master AWS KMS keys, key policies, SSM Parameter Store standard/advanced secure parameters, envelope client-side encryption, and global multi-region replications.</p>
          </div>
        </div>
      </div>

      {/* Tab navigation bar */}
      {!isComparative && (
        <Translate>
        <div className="da-tabs">
          <button className={`da-tb ${activeTab === 'notebook' ? 'da-on' : ''}`} onClick={() => setActiveTab('notebook')}>
            <BookOpen className="w-4 h-4 text-indigo-500" /> 📖 1) Visual Notes &amp; Theories
          </button>
          <button className={`da-tb ${activeTab === 'intro' ? 'da-on' : ''}`} onClick={() => setActiveTab('intro')}>
            <SlidersHorizontal className="w-4 h-4 text-sky-500" /> 🎯 2) KMS vs SSM vs Secrets Manager
          </button>
          <button className={`da-tb ${activeTab === 'kms' ? 'da-on' : ''}`} onClick={() => setActiveTab('kms')}>
            <Shield className="w-4 h-4" /> 🔑 3) Key Architecture &amp; Rotations
          </button>
          <button className={`da-tb ${activeTab === 'envelope' ? 'da-on' : ''}`} onClick={() => setActiveTab('envelope')}>
            <Terminal className="w-4 h-4" /> ✉️ 4) Envelope Encryption Simulator
          </button>
          <button className={`da-tb ${activeTab === 'multiregion' ? 'da-on' : ''}`} onClick={() => setActiveTab('multiregion')}>
            <Network className="w-4 h-4" /> 🌐 5) Global Multi-Region Replication
          </button>
          <button className={`da-tb ${activeTab === 'crossaccount' ? 'da-on' : ''}`} onClick={() => setActiveTab('crossaccount')}>
            <Server className="w-4 h-4" /> 🤝 6) Shared AMIs &amp; Key Policies
          </button>
          <button className={`da-tb ${activeTab === 'unique' ? 'da-on' : ''}`} onClick={() => setActiveTab('unique')}>
            ✨ Unique Features
          </button>
        </div>
      </Translate>
      )}

      {isComparative && (
        <SecretsAndKMSEncryptionComparativeView onNavigateToDemo={handleNavigateToDemo} />
      )}

      {!isComparative && activeTab === 'unique' && (
        <UniqueSecretsAndKMSEncryptionFeatures provider={provider} />
      )}

      {!isComparative && activeTab !== 'unique' && (
        <Translate>
          <>

      {/* ========================================================================= */}
      {/* TAB 1: INTRO MATRIX & SCHEMES                                             */}
      {/* ========================================================================= */}
            {activeTab === 'notebook' && (
        <div className="space-y-6 animate-fadeIn text-left" style={{ color: 'var(--da-text)' }}>
          
          {/* Header Hero Card */}
          <div className="da-card text-left" style={{ borderLeft: '4px solid #6366f1', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                  <BookOpen className="w-5 h-5 text-indigo-500" /> AWS Secrets &amp; KMS Cryptographic Notes &amp; Mental Models
                </h2>
                <p className="text-xs mt-1.5 leading-relaxed font-sans font-semibold" style={{ color: 'var(--da-text-muted)' }}>
                  Simplified, beginner-friendly cryptography theories sorted progressively from KMS vs Secrets Manager to Envelope Encryption, Key Policies, Automatic Rotations, Cross-Account Sharing, Multi-Region Replicas, and CloudHSM.
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
                  <Key className="w-4 h-4 text-indigo-500" />
                  <span>Cryptography Modules</span>
                </div>

                {/* LEVEL 1: ENCRYPTION & SECRETS FUNDAMENTALS */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'kms_fundamentals' ? '' : 'kms_fundamentals')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-500" />
                      🐣 Level 1 · Fundamentals
                    </span>
                    {expandedCategory === 'kms_fundamentals' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'kms_fundamentals' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('kms_vs_secrets')}
                        className={`acad-dir-item-btn ${selectedNote === 'kms_vs_secrets' ? 'acad-active' : ''}`}
                      >
                        1.1 KMS vs Secrets Mgr vs SSM
                      </button>
                      <button 
                        onClick={() => setSelectedNote('kms_envelope')}
                        className={`acad-dir-item-btn ${selectedNote === 'kms_envelope' ? 'acad-active' : ''}`}
                      >
                        1.2 Symmetric vs Asymmetric Keys
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 2: ENVELOPE ENCRYPTION & ROTATION */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'kms_envelope_rotation' ? '' : 'kms_envelope_rotation')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-sky-500" />
                      ⚙️ Level 2 · Envelope &amp; Rotation
                    </span>
                    {expandedCategory === 'kms_envelope_rotation' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'kms_envelope_rotation' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('envelope_encryption')}
                        className={`acad-dir-item-btn ${selectedNote === 'envelope_encryption' ? 'acad-active' : ''}`}
                      >
                        2.1 Envelope Encryption &amp; DEKs
                      </button>
                      <button 
                        onClick={() => setSelectedNote('key_rotation')}
                        className={`acad-dir-item-btn ${selectedNote === 'key_rotation' ? 'acad-active' : ''}`}
                      >
                        2.2 Automated Secret &amp; Key Rotation
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 3: ACCESS POLICIES & CROSS-ACCOUNT */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'kms_policies_sharing' ? '' : 'kms_policies_sharing')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-purple-500" />
                      🏛️ Level 3 · Policies &amp; Sharing
                    </span>
                    {expandedCategory === 'kms_policies_sharing' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'kms_policies_sharing' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)', borderBottom: '1px solid var(--da-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('key_policies')}
                        className={`acad-dir-item-btn ${selectedNote === 'key_policies' ? 'acad-active' : ''}`}
                      >
                        3.1 Key Policies vs IAM Policies
                      </button>
                      <button 
                        onClick={() => setSelectedNote('cross_account_kms')}
                        className={`acad-dir-item-btn ${selectedNote === 'cross_account_kms' ? 'acad-active' : ''}`}
                      >
                        3.2 Cross-Account Key Sharing &amp; AMIs
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 4: RESILIENCY & HARDWARE HSM */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'kms_resiliency_hsm' ? '' : 'kms_resiliency_hsm')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5 text-emerald-500" />
                      🛡️ Level 4 · Replicas &amp; CloudHSM
                    </span>
                    {expandedCategory === 'kms_resiliency_hsm' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'kms_resiliency_hsm' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--da-card-bg)' }}>
                      <button 
                        onClick={() => setSelectedNote('global_mrk')}
                        className={`acad-dir-item-btn ${selectedNote === 'global_mrk' ? 'acad-active' : ''}`}
                      >
                        4.1 Multi-Region Replica Keys (MRKs)
                      </button>
                      <button 
                        onClick={() => setSelectedNote('cloudhsm')}
                        className={`acad-dir-item-btn ${selectedNote === 'cloudhsm' ? 'acad-active' : ''}`}
                      >
                        4.2 AWS CloudHSM Hardware Security
                      </button>
                    </div>
                  )}
                </div>

              </div>

              <div className="acad-advice-box rounded-2xl p-4 text-[11px] leading-relaxed font-semibold space-y-1">
                <span className="font-extrabold flex items-center gap-1.5 mb-1 text-[11.5px]" style={{ color: 'var(--da-text-title)' }}>
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Interactive Quick-Launch
                </span>
                Click any cryptography topic to explore real-world analogies, envelope encryption flowcharts, and copyable Key Policies!
              </div>
            </div>

            {/* Right Active Note Workspace */}
            <div className="lg:col-span-9 space-y-6 text-left">

              {/* NOTE 1.1: KMS VS SECRETS MANAGER VS SSM */}
              {selectedNote === 'kms_vs_secrets' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🐣 Level 1 · Fundamentals</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        1.1 AWS KMS vs AWS Secrets Manager vs SSM Parameter Store
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('intro')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Comparison Tab
                      </button>
                    </div>
                  </div>

                  {/* What & Why Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Shield className="w-3.5 h-3.5 text-indigo-500" /> What Is It &amp; Why Needed?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Modern applications require database credentials, API tokens, and encryption keys. Storing passwords in plain text in code or GitHub repositories leads to catastrophic security breaches! AWS security services provide encrypted, audited storage for sensitive credentials.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Lock className="w-3.5 h-3.5 text-emerald-500" /> What Problem Does It Solve?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Eliminates hardcoded passwords in application code, satisfies PCI-DSS &amp; HIPAA compliance audits, automates zero-downtime database password rotations, and encrypts disk volumes (EBS, S3, RDS) transparently!
                      </p>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong>
                    <br />• <strong>AWS KMS (Key Management Service)</strong>: The master key maker that locks and unlocks data using hardware security modules (HSMs).
                    <br />• <strong>SSM Parameter Store</strong>: A lightweight, free key-value store for app configuration settings (e.g. `/app/db_url`).
                    <br />• <strong>AWS Secrets Manager</strong>: A specialized vault built for database passwords &amp; OAuth tokens with **automatic Lambda rotation** and cross-account sharing!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Lock Manufacturer vs Label Maker vs Hotel Password Vault
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      • <strong>AWS KMS (Lock Manufacturer)</strong>: Forges heavy brass padlocks and master keys. It does not store your luggage; it creates the locks that secure your suitcases.
                      <br />• <strong>SSM Parameter Store (Kitchen Label Maker)</strong>: Prints simple sticky labels (&ldquo;Sugar&rdquo;, &ldquo;Salt&rdquo;, &ldquo;DB Host URL&rdquo;). Free and organized!
                      <br />• <strong>Secrets Manager (Automated Hotel Safe)</strong>: A locked safe inside your room that automatically changes its 4-digit PIN combination every 30 days without you lifting a finger!
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="acad-table">
                      <thead>
                        <tr>
                          <th>Feature</th>
                          <th>AWS KMS</th>
                          <th>SSM Parameter Store</th>
                          <th>AWS Secrets Manager</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Primary Purpose</strong></td>
                          <td>Cryptographic key generation &amp; envelope encryption</td>
                          <td>Configuration parameters &amp; simple strings</td>
                          <td>Database passwords, OAuth tokens &amp; API keys</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Cost</strong></td>
                          <td>$1.00 / KMS Key / month</td>
                          <td>Standard parameters: FREE (Up to 10k)</td>
                          <td>$0.40 / Secret / month</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--da-text-title)' }}>Auto-Rotation</strong></td>
                          <td>Key material rotated annually (AWS KMS)</td>
                          <td>Manual updates or custom scripts</td>
                          <td>Native automatic rotation via built-in Lambda</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Real World Production Scenario */}
                  <div className="p-4 rounded-xl border font-sans text-xs space-y-1.5" style={{ background: 'var(--da-card-bg)', borderColor: 'var(--da-card-border)' }}>
                    <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-500 block">🚀 Real-World Production Architecture Scenario:</span>
                    <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                      A microservice running on AWS Fargate needs to connect to an RDS PostgreSQL database. Instead of storing the database password in a Git repo, the Fargate task fetches the secret ARN from <strong>AWS Secrets Manager</strong> at runtime. Secrets Manager decrypts the secret using a custom <strong>AWS KMS Key</strong>, returning temporary DB credentials while automatically rotating the password every 30 days in RDS!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 1.2: SYMMETRIC VS ASYMMETRIC KEYS */}
              {selectedNote === 'kms_envelope' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🐣 Level 1 · Fundamentals</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        1.2 Symmetric Encryption vs Asymmetric KMS Keys
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('kms')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Key Architecture Tab
                      </button>
                    </div>
                  </div>

                  {/* What & Why Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Shield className="w-3.5 h-3.5 text-indigo-500" /> What Is It &amp; Why Needed?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Encryption algorithms use keys to lock data. <strong>Symmetric keys</strong> use the exact same key to encrypt and decrypt. <strong>Asymmetric keys</strong> use a public key pair (Public Key encrypts, Private Key decrypts) for external partners who shouldn&apos;t hold private keys!
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Lock className="w-3.5 h-3.5 text-emerald-500" /> What Problem Does It Solve?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Symmetric keys power fast bulk disk encryption (EBS, S3, RDS). Asymmetric keys allow external clients or vendor partners to encrypt sensitive data or verify RSA digital signatures without giving them access to AWS KMS private decryption keys!
                      </p>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong>
                    <br />• <strong>Symmetric KMS Key (AES-256)</strong>: Single key used for both encryption and decryption. Fast, highly performant, used by 99% of AWS services.
                    <br />• <strong>Asymmetric KMS Key (RSA / ECC)</strong>: Public Key encrypts / verifies signatures; Private Key decrypts / signs. The Private Key **NEVER leaves the KMS Hardware Security Module (HSM)**!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Physical House Key vs Lockbox Drop Slot
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      • <strong>Symmetric Key (Physical House Key)</strong>: You use the same metal key to lock your front door when leaving and unlock it when returning home.
                      <br />• <strong>Asymmetric Key (Post Office Mail Slot)</strong>: Anyone on the street can drop a letter into the public mail slot (`Public Key`). But only the mail carrier holding the private brass key (`Private Key`) can open the box and read the mail!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 2.1: ENVELOPE ENCRYPTION */}
              {selectedNote === 'envelope_encryption' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">⚙️ Level 2 · Envelope &amp; Rotation</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        2.1 Envelope Encryption &amp; Data Encryption Keys (DEKs)
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('envelope')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Simulator Tab
                      </button>
                    </div>
                  </div>

                  {/* What & Why Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Shield className="w-3.5 h-3.5 text-indigo-500" /> What Is It &amp; Why Needed?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        AWS KMS has a maximum payload limit of 4 KB per direct API call. Sending a 10 GB video file or a 100 GB database dump directly to KMS over the network to encrypt is impossible! **Envelope Encryption** solves this by encrypting data locally with a fast Data Encryption Key (DEK).
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border space-y-1.5" style={{ background: 'var(--da-tab-bg)', borderColor: 'var(--da-card-border)' }}>
                      <h4 className="font-bold flex items-center gap-1.5" style={{ color: 'var(--da-text-title)' }}>
                        <Lock className="w-3.5 h-3.5 text-emerald-500" /> What Problem Does It Solve?
                      </h4>
                      <p style={{ color: 'var(--da-text-muted)', lineHeight: '1.5' }}>
                        Allows high-speed local encryption of gigabyte-sized files without network latency, while protecting the local Data Key by encrypting it under the master AWS KMS Root Key (KMS CMK)!
                      </p>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Envelope Encryption works in 3 quick steps:
                    <br />1. **Generate Data Key**: Call `kms:GenerateDataKey` to get a plaintext Data Key (`DEK`) and an encrypted Data Key.
                    <br />2. **Encrypt Payload**: Use the plaintext DEK locally to encrypt large files (S3 objects, EBS volumes) in sub-milliseconds.
                    <br />3. **Store Encrypted DEK**: Store the encrypted DEK alongside the encrypted file in S3, and wipe the plaintext DEK from RAM memory!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Lockbox Inside a Bank Vault
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      You lock your heavy diamond collection inside a small portable steel box (`Data Key`). Then, instead of carrying the steel key in your pocket where you might lose it, you put the small steel key inside a massive 10-ton bank vault (`AWS KMS Master Key`). To open your diamonds, the bank vault unlocks your small key, and your small key unlocks the diamonds!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 2.2: KEY ROTATION */}
              {selectedNote === 'key_rotation' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">⚙️ Level 2 · Envelope &amp; Rotation</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        2.2 Automated Secret &amp; KMS Key Rotation
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('kms')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Key Architecture Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Keeping the same encryption key or database password for years increases security risk if keys leak. AWS provides 2 automatic rotation mechanisms:
                    <br />• <strong>AWS KMS Key Rotation (Automatic)</strong>: KMS automatically generates new cryptographic key material every year (or 90 days for customer keys) without changing the Key ARN or re-encrypting existing data!
                    <br />• <strong>AWS Secrets Manager Rotation</strong>: Uses an AWS Lambda function to update the database password in RDS and update the secret in Secrets Manager simultaneously without application downtime.
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Monthly Hotel Passcard Reset
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      At midnight on the 1st of every month, hotel reception automatically updates room electronic locks with a fresh security code (`Secret Rotation`). Existing guests don&apos;t get locked out because the hotel app automatically receives the new keycode in the background!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 3.1: KEY POLICIES */}
              {selectedNote === 'key_policies' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🏛️ Level 3 · Policies &amp; Sharing</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        3.1 KMS Key Policies vs IAM Policies
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('crossaccount')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Shared Keys Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> You cannot access a KMS Key using IAM policies alone! **Every KMS Key MUST have a Key Policy** attached directly to the key. The Key Policy is the primary access control mechanism—if the Key Policy does not grant access to the root account or IAM role, even `AdministratorAccess` IAM users are locked out!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Heavy Vault Door Locks vs Employee Security Badge
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      Your company security badge (`IAM Policy`) might state &ldquo;Allowed to open all doors in building&rdquo;. But the bank vault door itself has a combination lock (`Key Policy`). If the vault door combination lock does not explicitly list your badge ID, the vault door remains locked!
                    </p>
                  </div>

                  {/* Copyable KMS Key Policy Snippet */}
                  <div className="acad-advice-box p-4 rounded-xl flex flex-col justify-between" style={{ background: 'var(--da-card-bg)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--da-text-muted)' }}>KMS Key Policy JSON (Root Enablement)</span>
                      <button 
                        onClick={() => {
                          const snippet = `{\n  "Version": "2012-10-17",\n  "Id": "key-policy-1",\n  "Statement": [\n    {\n      "Sid": "Enable IAM User Permissions",\n      "Effect": "Allow",\n      "Principal": { "AWS": "arn:aws:iam::111122223333:root" },\n      "Action": "kms:*",\n      "Resource": "*"\n    }\n  ]\n}`;
                          navigator.clipboard.writeText(snippet);
                          setCopiedNoteId('kms-key-policy');
                          setTimeout(() => setCopiedNoteId(null), 2000);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-mono flex items-center gap-1 transition-all"
                      >
                        {copiedNoteId === 'kms-key-policy' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <pre className="acad-terminal text-[9.5px] leading-relaxed overflow-x-auto h-24">
{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": { "AWS": "arn:aws:iam::111122223333:root" },
      "Action": "kms:*",
      "Resource": "*"
    }
  ]
}`}
                    </pre>
                  </div>
                </div>
              )}

              {/* NOTE 3.2: CROSS ACCOUNT KMS */}
              {selectedNote === 'cross_account_kms' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🏛️ Level 3 · Policies &amp; Sharing</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        3.2 Cross-Account Key Sharing &amp; Encrypted Shared AMIs
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('crossaccount')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Shared Keys Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> You cannot share AWS Managed Keys (e.g. `aws/s3`, `aws/ebs`) across different AWS accounts! To share encrypted S3 objects, EBS snapshots, or custom AMIs with another AWS account:
                    <br />1. Use a **Customer Managed Key (CMK)** instead of AWS Managed Key.
                    <br />2. Add the target account ID to the KMS **Key Policy** (`Principal: &#123; AWS: "arn:aws:iam::TARGET-ACCOUNT:root" &#125;`).
                    <br />3. Add `kms:Decrypt` and `kms:CreateGrant` permissions to the target account&apos;s IAM role!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Corporate Escrow Authorization
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      Company A wants to send a locked briefcase to Company B. Company A cannot use its internal master key (`AWS Managed Key`). Instead, Company A buys a custom dual-lock box (`Customer Managed Key`) and registers Company B&apos;s representative on the authorized opener list (`KMS Key Grant`).
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 4.1: MULTI-REGION REPLICA KEYS */}
              {selectedNote === 'global_mrk' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🛡️ Level 4 · Replicas &amp; CloudHSM</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        4.1 Multi-Region KMS Replica Keys (MRKs) &amp; Disaster Recovery
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('multiregion')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Multi-Region Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Standard KMS keys are strictly single-region. **Multi-Region Keys (MRKs)** share the exact same key ID and key material across multiple AWS regions (e.g. `us-east-1` Primary and `eu-west-1` Replica). Data encrypted in New York can be decrypted in London **without making cross-region network calls to KMS**!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Identical Master Keys in London &amp; New York Vaults
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      A global bank creates 2 identical master brass keys. Key #1 stays in the New York vault; Key #2 stays in the London vault. When an encrypted document is flown from New York to London, London officers unlock the document locally in 1 second using Key #2 without calling New York!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 4.2: CLOUDHSM */}
              {selectedNote === 'cloudhsm' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--da-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🛡️ Level 4 · Replicas &amp; CloudHSM</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--da-text-title)' }}>
                        4.2 AWS CloudHSM: Dedicated Single-Tenant Hardware Security Modules
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('kms')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Key Architecture Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> While AWS KMS is a multi-tenant managed service, **AWS CloudHSM** gives you dedicated, single-tenant FIPS 140-2 Level 3 hardware security appliances inside your VPC. You hold complete administrative control of the HSM device—AWS engineers have zero access to your cryptographic keys!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Shared Safety Deposit Box vs Private Dedicated Steel Vault
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      • <strong>AWS KMS (Shared Bank Safety Deposit Vault)</strong>: Highly secure bank vault where AWS manages the hardware infrastructure for thousands of customers.
                      <br />• <strong>AWS CloudHSM (Private Dedicated Steel Armored Car Vault)</strong>: You rent the entire armored car. Only your company officers hold the combination codes; the bank staff doesn&apos;t even have master keys!
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
            
            {/* Left sidebar */}
            <div className="lg:col-span-4 da-card text-left flex flex-col justify-between">
              <div>
                <h3 className="da-card-title text-blue-700">
                  <SlidersHorizontal className="w-5 h-5" /> Comparative Matrix
                </h3>
                <p className="da-card-desc mb-5">
                  AWS provides distinct services for configuration, dynamic secrets, and low-level cryptographic key material operations.
                </p>

                <div className="space-y-2 text-xs">
                  <button
                    onClick={() => setSelectedTopic('kms')}
                    className={`w-full p-3 text-left border rounded-xl transition-all ${
                      selectedTopic === 'kms'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300'
                        : 'border-slate-200 hover:bg-slate-55 text-slate-700 font-semibold'
                    }`}
                  >
                    🔑 AWS Key Management Service (KMS)
                    <span className="block text-[9px] text-slate-400 font-medium mt-0.5">Symmetric/Asymmetric keys, automatic rotations, imported BYOK keys</span>
                  </button>

                  <button
                    onClick={() => setSelectedTopic('ssm')}
                    className={`w-full p-3 text-left border rounded-xl transition-all ${
                      selectedTopic === 'ssm'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300'
                        : 'border-slate-200 hover:bg-slate-55 text-slate-700 font-semibold'
                    }`}
                  >
                    ⚙️ SSM Parameter Store
                    <span className="block text-[9px] text-slate-400 font-medium mt-0.5">Standard vs Advanced, SecureString KMS parameters, config trees</span>
                  </button>

                  <button
                    onClick={() => setSelectedTopic('secretsmanager')}
                    className={`w-full p-3 text-left border rounded-xl transition-all ${
                      selectedTopic === 'secretsmanager'
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300'
                        : 'border-slate-200 hover:bg-slate-55 text-slate-700 font-semibold'
                    }`}
                  >
                    🔒 AWS Secrets Manager
                    <span className="block text-[9px] text-slate-400 font-medium mt-0.5">RDS dynamic rotations, multi-region replication, cross-account shares</span>
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-150 rounded-xl p-3.5 text-[11px] leading-relaxed text-blue-900 mt-6 font-medium">
                <span className="font-extrabold text-blue-950 block mb-1">Architect's Security Guideline:</span>
                "SSM Parameter Store is ideal for configurations and cost-free secret parameters. Secrets Manager excels at RDS automated secret rotation. KMS handles standard data block encryption keys."
              </div>
            </div>

            {/* Right details content */}
            <div className="lg:col-span-8 space-y-6 text-left">
              <div className="da-card space-y-4">
                <h3 className="da-card-title text-slate-800">
                  <BookOpen className="w-5 h-5 text-blue-500" /> System Deep-Dive: Secrets &amp; Keys
                </h3>

                {selectedTopic === 'kms' && (
                  <div className="space-y-4 animate-fadeIn text-xs leading-relaxed text-slate-600">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <span className="font-extrabold text-blue-700 block mb-1.5 text-[12.5px]">🔑 AWS Key Management Service (KMS)</span>
                      <p className="mb-2">
                        KMS makes it easy to create and manage cryptographic keys and control their use across a wide range of AWS services and in your applications:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Envelope Encryption:</strong> Encrypts payload local datasets using a plaintext data key, then wraps the data key inside the KMS customer managed root key (CMK).</li>
                        <li><strong>Hardware Security Modules (HSMs):</strong> Backed by FIPS 140-2 Level 3 validated hardware modules. Root keys never leave KMS HSM borders.</li>
                        <li><strong>Alias Maps:</strong> Friendly aliases (e.g. `alias/app-db-key`) that decouple direct Key IDs from developer deployment pipelines.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {selectedTopic === 'ssm' && (
                  <div className="space-y-4 animate-fadeIn text-xs leading-relaxed text-slate-600">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <span className="font-extrabold text-blue-700 block mb-1.5 text-[12.5px]">⚙️ Systems Manager Parameter Store</span>
                      <p className="mb-2">
                        Provides centralized storage to manage configuration data, whether plain text data (like database URLs) or secrets (like passwords):
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Parameter Tiers:</strong> Standard (up to 10k parameters, 4KB limit, free) vs Advanced (up to 100k parameters, 8KB limit, charges apply).</li>
                        <li><strong>SecureString Parameter:</strong> Sensitive parameter values encrypted automatically using a specified KMS key. Decrypted automatically during API invocation.</li>
                        <li><strong>Hierarchical Trees:</strong> Organizes values under folders (e.g., `/dev/database/url` vs `/prod/database/url`) for granular IAM boundary access.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {selectedTopic === 'secretsmanager' && (
                  <div className="space-y-4 animate-fadeIn text-xs leading-relaxed text-slate-600">
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <span className="font-extrabold text-blue-700 block mb-1.5 text-[12.5px]">🔒 AWS Secrets Manager</span>
                      <p className="mb-2">
                        Helps you protect secrets needed to access your applications, services, and IT resources. Easily rotate database passwords dynamically:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Automated Lambda Rotations:</strong> Integrates with RDS, Redshift, and DocumentDB to rotate credentials on a schedule using a managed Lambda runner.</li>
                        <li><strong>Cross-Account secrets sharing:</strong> Permits secure access to secrets across distinct accounts using direct resource-based policies.</li>
                        <li><strong>Multi-Region Secrets:</strong> Replicates active secrets to alternate regions for dynamic disaster recovery and global table workloads.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Secrets Matrix Table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <span className="text-xs font-extrabold text-slate-800 block mb-3">Service Capabilities Comparison Grid</span>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-bold">
                        <th className="pb-2">Feature Dimension</th>
                        <th className="pb-2">AWS KMS</th>
                        <th className="pb-2">SSM Parameter Store</th>
                        <th className="pb-2">AWS Secrets Manager</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                      <tr>
                        <td className="py-2.5 text-blue-600 font-bold">Primary Target</td>
                        <td className="py-2.5">Cryptographic Key Material</td>
                        <td className="py-2.5">Configuration &amp; Secure String parameters</td>
                        <td className="py-2.5">API Secrets, DB Credentials</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-blue-600 font-bold">Dynamic Rotation</td>
                        <td className="py-2.5">Auto 1-year (CMK) / 3-year (AWS)</td>
                        <td className="py-2.5">Manual changes only</td>
                        <td className="py-2.5">Automatic schedule (Lambda-driven)</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-blue-600 font-bold">Cross-Region Replication</td>
                        <td className="py-2.5">Multi-Region keys (Identical ID)</td>
                        <td className="py-2.5">Manual recreation</td>
                        <td className="py-2.5">Built-in automated replication</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 text-blue-600 font-bold">Direct RDS Integration</td>
                        <td className="py-2.5">Storage level only</td>
                        <td className="py-2.5">None</td>
                        <td className="py-2.5">Yes (updates active RDS database credentials)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KMS KEY ARCHITECTURE & POLICY LOCKOUT                             */}
      {/* ========================================================================= */}
      {activeTab === 'kms' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Shield className="w-5 h-5" /> AWS KMS Key Management, Policies &amp; Rotations
            </h2>
            <p className="da-card-desc">
              Customer Managed Keys (CMKs) support granular key policies. If the policy removes the standard IAM delegation statement, the key becomes completely unmanageable.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sidebar Controls */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                
                {/* Key Type selection */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">1. Select Key Type:</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                    <button
                      onClick={() => setKeyType('symmetric')}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${keyType === 'symmetric' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Symmetric (AES-256)
                    </button>
                    <button
                      onClick={() => setKeyType('asymmetric')}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${keyType === 'asymmetric' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Asymmetric (RSA/ECC)
                    </button>
                    <button
                      onClick={() => setKeyType('hmac')}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${keyType === 'hmac' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      HMAC Sign
                    </button>
                  </div>
                </div>

                {/* Key Origin */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">2. Select Key Origin:</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs">
                    <button
                      onClick={() => setKeyOrigin('aws')}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${keyOrigin === 'aws' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      AWS Managed
                    </button>
                    <button
                      onClick={() => setKeyOrigin('customer')}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${keyOrigin === 'customer' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Customer Managed
                    </button>
                    <button
                      onClick={() => setKeyOrigin('external')}
                      className={`flex-1 py-1 rounded-md font-bold transition-all ${keyOrigin === 'external' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                    >
                      Imported (BYOK)
                    </button>
                  </div>
                </div>

                {/* Key Policy sandbox state */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">3. Key Policy Configuration:</span>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="policy"
                        checked={policySetup === 'delegated'}
                        onChange={() => setPolicySetup('delegated')}
                        className="text-blue-600 accent-blue-600"
                      />
                      🟢 Delegated (Allows IAM user policies delegation)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="policy"
                        checked={policySetup === 'restricted'}
                        onChange={() => setPolicySetup('restricted')}
                        className="text-blue-600 accent-blue-600"
                      />
                      🟡 Restricted (Only App task role permitted to Decrypt)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-semibold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="policy"
                        checked={policySetup === 'lockout'}
                        onChange={() => setPolicySetup('lockout')}
                        className="text-blue-600 accent-blue-600"
                      />
                      🔴 lockout State (IAM root delegation deleted - UNMANAGEABLE)
                    </label>
                  </div>
                </div>

                {/* Automatic Rotation flag */}
                {keyOrigin === 'customer' && (
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700">Enable Automatic 1-Year Rotation</span>
                    <input
                      type="checkbox"
                      checked={rotationActive}
                      onChange={(e) => setRotationActive(e.target.checked)}
                      className="accent-blue-600 cursor-pointer w-4 h-4"
                    />
                  </div>
                )}

              </div>

              <div className="flex gap-2">
                <button
                  onClick={evaluateKmsPolicy}
                  className="flex-1 py-2 border border-slate-250 hover:bg-slate-55 text-slate-650 rounded-xl text-xs font-extrabold active:scale-95 transition-all"
                >
                  Verify Key Policy
                </button>
                <button
                  onClick={triggerRotation}
                  disabled={kmsState === 'rotating'}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${kmsState === 'rotating' ? 'animate-spin' : ''}`} /> Rotate Key Material
                </button>
              </div>

            </div>

            {/* Visualizer & Logs Terminal */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden da-svg-bg flex flex-col justify-between min-h-[420px]">
              
              {/* Alert notifications */}
              {policySetup === 'lockout' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 flex gap-2.5 text-left items-start animate-pulse">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <span className="font-extrabold text-red-950 block">🔑 CRITICAL LOCKOUT DETECTED</span>
                    <span className="text-red-900 leading-normal">
                      The delegation statement allowing the AWS account root permissions has been deleted. IAM policies are now ignored. **The key material is frozen and policy cannot be recovered inside this account.**
                    </span>
                  </div>
                </div>
              )}

              {/* Graphic illustration */}
              <div className="w-full flex-grow flex items-center justify-center">
                <svg className="w-full h-full min-h-[140px]" viewBox="0 0 280 120">
                  {/* Key policy check flow */}
                  <path d="M 50 60 H 130" fill="none" stroke="var(--da-text-muted)" strokeWidth="1.5" className={kmsState === 'rotating' ? 'da-flow-blue' : ''} />
                  <path d="M 190 60 H 260" fill="none" stroke="var(--da-text-muted)" strokeWidth="1.5" className={kmsState === 'rotating' ? 'da-flow-green' : ''} />

                  {/* KMS CMK Ring Node */}
                  <g transform="translate(10, 35)">
                    <rect x="0" y="0" width="55" height="50" rx="6" fill="var(--da-code-bg)" stroke="var(--da-code-border)" strokeWidth="1.5" />
                    <text x="27.5" y="16" fill="var(--da-code-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">KMS</text>
                    <text x="27.5" y="27" fill="var(--da-code-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">HSM Ring</text>
                    <text x="27.5" y="38" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">FIPS 140-2</text>
                  </g>

                  {/* Backing Key Material block */}
                  <g transform="translate(130, 35)">
                    <rect x="0" y="0" width="60" height="50" rx="6" 
                      fill={policySetup === 'lockout' ? 'var(--da-svg-red-bg)' : 'var(--da-svg-green-bg)'} 
                      stroke={policySetup === 'lockout' ? 'var(--da-svg-red-border)' : 'var(--da-svg-green-border)'} 
                      strokeWidth="1.5" />
                    <text x="30" y="16" fill="var(--da-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Backing Key</text>
                    <text x="30" y="27" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">
                      {keyOrigin === 'aws' ? 'Managed' : keyOrigin === 'customer' ? 'CMK Material' : 'Imported BYOK'}
                    </text>
                    <text x="30" y="38" fill={policySetup === 'lockout' ? 'var(--da-svg-red-text)' : 'var(--da-svg-green-text)'} fontSize="6.5" fontWeight="extrabold" textAnchor="middle">
                      {policySetup === 'lockout' ? '🔒 LOCKED' : '🟢 ACTIVE'}
                    </text>
                  </g>

                  {/* Data files target block */}
                  <g transform="translate(210, 35)">
                    <rect x="0" y="0" width="60" height="50" rx="6" fill="var(--da-bg)" stroke="var(--da-card-border)" strokeWidth="1" />
                    <text x="30" y="16" fill="var(--da-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Payload</text>
                    <text x="30" y="27" fill="var(--da-text-muted)" fontSize="5" textAnchor="middle">Target Storage</text>
                    <text x="30" y="38" fill="var(--da-svg-indigo-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                      {keyType === 'symmetric' ? 'AES-GCM' : keyType === 'asymmetric' ? 'RSA/ECC' : 'HMAC'}
                    </text>
                  </g>
                </svg>
              </div>

              {/* Logs terminal */}
              <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto border border-slate-800 shadow-inner mt-4">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5 text-slate-400">
                  <span className="flex items-center gap-1"><Terminal className="w-3.5 h-3.5 text-blue-400" /> KMS Telemetry Console</span>
                  <span>Region: global :: HSM Bound</span>
                </div>
                {kmsLogs.length === 0 ? (
                  <div className="text-slate-500 italic">Select key metrics, configure policy restrictions, and execute simulations.</div>
                ) : (
                  kmsLogs.map((log, idx) => (
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
      {/* TAB 3: ENVELOPE ENCRYPTION CLIENT-SIDE                                    */}
      {/* ========================================================================= */}
      {activeTab === 'envelope' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Key className="w-5 h-5" /> Envelope Encryption &amp; Client-Side Cryptographic Simulator
            </h2>
            <p className="da-card-desc">
              Envelope encryption protects your local datasets by wrapping plaintext keys inside a KMS Master Key (CMK). To maintain zero-trust, the client destroys the Plaintext Data Key from local memory instantly after payload encryption.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Input payload form sidebar */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-extrabold text-slate-800 block mb-2">1. Input Plaintext Payload Data:</span>
                <textarea
                  value={plainPayload}
                  onChange={(e) => {
                    setPlainPayload(e.target.value);
                    resetEnvelopeSim();
                  }}
                  className="w-full h-24 p-3 border border-slate-250 rounded-xl text-xs outline-none focus:border-blue-500 font-semibold text-slate-700 bg-slate-50 leading-relaxed mb-4 resize-none"
                  placeholder="Type sensitive parameters or database strings here..."
                />

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] leading-relaxed text-slate-650 font-medium">
                  <span className="font-extrabold text-slate-800 block mb-1">Envelope Cryptography Mnemonic:</span>
                  "GenerateDataKey returns the plaintext key to encrypt local data, and the encrypted key to store alongside it. The Plaintext key is purged instantly!"
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={resetEnvelopeSim}
                  className="flex-1 py-2 border border-slate-250 hover:bg-slate-55 text-slate-650 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Reset
                </button>
                <button
                  onClick={executeEnvelopeEncryption}
                  disabled={envelopeState === 'generating' || !plainPayload}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 active:scale-95 transition-all shadow animate-fadeIn"
                >
                  <Lock className="w-3.5 h-3.5" /> Envelope Encrypt
                </button>
              </div>

            </div>

            {/* Interactive Flow visualizer */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden da-svg-bg flex flex-col justify-between min-h-[420px]">
              
              {envelopeState === 'generating' && (
                <span className="absolute top-3 left-3 bg-blue-100 border border-blue-300 text-blue-700 font-extrabold text-[9px] px-2 py-0.5 rounded animate-pulse select-none z-10">
                  🔑 GENERATING PLAINTEXT AND CIPHER DATA KEYS FROM KMS...
                </span>
              )}
              {envelopeState === 'encrypted' && (
                <span className="absolute top-3 left-3 bg-rose-100 border border-rose-300 text-rose-700 font-extrabold text-[9px] px-2 py-0.5 rounded select-none z-10 animate-pulse">
                  🔒 PAYLOAD ENCRYPTED locally - PLAINTEXT KEY PURGED
                </span>
              )}
              {envelopeState === 'decrypted' && (
                <span className="absolute top-3 left-3 bg-emerald-100 border border-emerald-300 text-emerald-700 font-extrabold text-[9px] px-2 py-0.5 rounded select-none z-10 animate-bounce">
                  🔓 PAYLOAD RECOVERED SUCCESSFULLY VIA KMS DECRYPT
                </span>
              )}

              <div className="w-full flex-grow flex items-center justify-center">
                <svg className="w-full h-full min-h-[160px]" viewBox="0 0 320 160">
                  <defs>
                    <marker id="arrow-sync" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-text-muted)" />
                    </marker>
                  </defs>

                  {/* Flow lines */}
                  {/* Client -> KMS */}
                  <path d="M 60 40 Q 115 15 170 30" fill="none" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" className={envelopeState === 'generating' ? 'da-flow-blue' : ''} markerEnd="url(#arrow-sync)" />
                  {/* KMS -> Client */}
                  <path d="M 170 50 Q 115 65 60 80" fill="none" stroke="var(--da-svg-green-border)" strokeWidth="1.5" className={envelopeState === 'generating' ? 'da-flow-green' : ''} markerEnd="url(#arrow-sync)" />

                  {/* Client Local Node */}
                  <g transform="translate(10, 45)">
                    <rect x="0" y="0" width="55" height="50" rx="6" fill="var(--da-code-bg)" stroke="var(--da-code-border)" strokeWidth="1.5" />
                    <text x="27.5" y="16" fill="var(--da-code-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Client App</text>
                    <text x="27.5" y="27" fill="var(--da-code-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Environment</text>
                    <text x="27.5" y="38" fill="var(--da-svg-indigo-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">Local RAM</text>
                  </g>

                  {/* KMS HSM Core */}
                  <g transform="translate(170, 15)">
                    <rect x="0" y="0" width="70" height="40" rx="6" fill="var(--da-svg-amber-bg)" stroke="var(--da-svg-amber-border)" strokeWidth="1.5" />
                    <text x="35" y="14" fill="var(--da-svg-amber-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">KMS Service</text>
                    <text x="35" y="23" fill="var(--da-svg-amber-text)" fontSize="5.5" textAnchor="middle">HSM Core</text>
                    <text x="35" y="31" fill="var(--da-svg-amber-border)" fontSize="5.5" fontWeight="bold" textAnchor="middle">alias/master-key</text>
                  </g>

                  {/* Encryption workflow outputs */}
                  {encryptedDataKey && (
                    <g transform="translate(130, 95)" className="animate-fadeIn">
                      <rect x="0" y="0" width="125" height="35" rx="4" fill="var(--da-svg-red-bg)" stroke="var(--da-svg-red-border)" strokeWidth="1" />
                      <text x="62.5" y="12" fill="var(--da-svg-red-text)" fontSize="6" fontWeight="bold" textAnchor="middle">📄 METADATA PACKAGE STORE</text>
                      <text x="6" y="20" fill="var(--da-svg-red-text)" fontSize="5" className="font-mono">Cipher Key: {encryptedDataKey}</text>
                      <text x="6" y="28" fill="var(--da-text-muted)" fontSize="4.5">Stores locally alongside Base64 encrypted cipher</text>
                    </g>
                  )}
                </svg>
              </div>

              {/* Decryption trigger button */}
              {envelopeState === 'encrypted' && (
                <div className="p-3 bg-rose-50 border border-rose-250 rounded-xl mb-4 flex justify-between items-center animate-fadeIn text-left">
                  <div className="flex gap-2 items-center">
                    <Unlock className="w-5 h-5 text-rose-600 flex-shrink-0" />
                    <div>
                      <span className="font-extrabold text-[11.5px] text-rose-950 block">Ready to Decrypt Data?</span>
                      <span className="text-[10px] text-rose-900 leading-normal">
                        Decryption requires passing the Encrypted Data Key back to KMS. The KMS HSM Decrypt API will recover the Plaintext key.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={executeEnvelopeDecryption}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold transition-all active:scale-95 shadow"
                  >
                    Decrypt Payload
                  </button>
                </div>
              )}

              {/* Client RAM Cryptographic Cache Dump */}
              {(cipherPayload || decryptedPayload) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-left text-[11px] leading-relaxed">
                  <span className="font-extrabold text-slate-800 block mb-2">💾 Client RAM Cryptographic Cache Dump:</span>
                  <div className="space-y-1.5 font-mono text-[10px]">
                    {cipherPayload && (
                      <div>
                        <span className="text-slate-500 font-bold">🔒 Ciphertext Payload:</span>{" "}
                        <span className="text-rose-600 bg-rose-50 px-1 py-0.5 rounded border border-rose-100 font-semibold break-all">{cipherPayload}</span>
                      </div>
                    )}
                    {plaintextDataKey && (
                      <div>
                        <span className="text-slate-500 font-bold">🔑 Recovered Plaintext Data Key:</span>{" "}
                        <span className="text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-100 font-bold">{plaintextDataKey}</span>
                      </div>
                    )}
                    {decryptedPayload && (
                      <div>
                        <span className="text-slate-500 font-bold">📄 Recovered Decrypted Payload:</span>{" "}
                        <span className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded border border-slate-200 font-semibold">{decryptedPayload}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Logs output console */}
              <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto border border-slate-900 shadow-inner">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5 text-slate-400">
                  <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4 text-emerald-400" /> Client-Side Encryption Console</span>
                  <span>KMS Envelope Engine</span>
                </div>
                {envelopeLogs.length === 0 ? (
                  <div className="text-slate-500 italic">Type plaintext data, run Envelope Encrypt to check GenerateDataKey APIs.</div>
                ) : (
                  envelopeLogs.map((log, idx) => (
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
      {/* TAB 4: MULTI-REGION & GLOBAL REPLICATION (DynamoDB, Aurora, S3)           */}
      {/* ========================================================================= */}
      {activeTab === 'multiregion' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Network className="w-5 h-5" /> Multi-Region KMS Keys &amp; Global Database replication (DynamoDB, Aurora, S3)
            </h2>
            <p className="da-card-desc">
              DynamoDB Global Tables and S3 replication encrypted with **KMS Multi-Region keys (identical key IDs)** execute decryptions locally inside secondary regions, avoiding slow cross-region WAN networks!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Replication selector sidebar */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                
                {/* Scenario select */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">1. Select Global Replication Scenario:</span>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="scenario"
                        checked={globalScenario === 'dynamodb'}
                        onChange={() => { setGlobalScenario('dynamodb'); setReplicationState('idle'); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      🌐 DynamoDB Global Tables (Decrypt via local MRK replicas)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="scenario"
                        checked={globalScenario === 'aurora'}
                        onChange={() => { setGlobalScenario('aurora'); setReplicationState('idle'); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      🌌 Aurora Global Database (Region-specific KMS keys)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="scenario"
                        checked={globalScenario === 's3'}
                        onChange={() => { setGlobalScenario('s3'); setReplicationState('idle'); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      🪣 S3 Bucket Keys &amp; CRR Cross-Region Replication
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="scenario"
                        checked={globalScenario === 'snapshot'}
                        onChange={() => { setGlobalScenario('snapshot'); setReplicationState('idle'); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      💾 Copying Snapshot Cross-Region (Re-encrypt loop)
                    </label>
                  </div>
                </div>

                {/* DynamoDB Toggle options */}
                {globalScenario === 'dynamodb' && (
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-700">Replica MRK Key Status in eu-west-1</span>
                    <input
                      type="checkbox"
                      checked={mrkPrimaryActive}
                      onChange={(e) => setMrkPrimaryActive(e.target.checked)}
                      className="accent-blue-600 cursor-pointer w-4 h-4"
                    />
                  </div>
                )}

              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setReplicationState('idle')}
                  className="flex-1 py-2 border border-slate-250 hover:bg-slate-55 text-slate-650 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Reset
                </button>
                <button
                  onClick={triggerGlobalReplication}
                  disabled={replicationState === 'running'}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 active:scale-95 transition-all shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Trigger Replication
                </button>
              </div>

            </div>

            {/* SVG Visual Schema */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden da-svg-bg flex flex-col justify-between min-h-[420px]">
              
              {replicationState === 'running' && (
                <span className="absolute top-3 left-3 bg-blue-100 border border-blue-300 text-blue-700 font-extrabold text-[9px] px-2 py-0.5 rounded animate-pulse select-none z-10">
                  🔄 REPLICATING ENCRYPTED SYSTEM PARTITION ASYNCHRONOUSLY
                </span>
              )}
              {replicationState === 'success' && (
                <span className="absolute top-3 left-3 bg-emerald-100 border border-emerald-300 text-emerald-700 font-extrabold text-[9px] px-2 py-0.5 rounded select-none z-10 animate-bounce">
                  ✅ GLOBAL REPLICATION &amp; DECRYPTION SUCCESSFUL
                </span>
              )}

              {/* Diagrams */}
              <div className="w-full flex-grow flex items-center justify-center overflow-x-auto">
                <svg className="w-full min-w-[320px] h-[180px]" viewBox="0 0 320 180">
                  <defs>
                    <marker id="arrow-rep" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--da-text-muted)" />
                    </marker>
                  </defs>

                  {/* Flow pipeline */}
                  {/* us-east-1 -> eu-west-1 */}
                  <path d="M 100 90 H 220" fill="none" stroke="var(--da-text-muted)" strokeWidth="2" className={replicationState === 'running' ? 'da-flow-blue' : ''} />

                  {/* Regional Boundary Split */}
                  <line x1="160" y1="10" x2="160" y2="170" stroke="var(--da-card-border)" strokeDasharray="3,3" />
                  <text x="140" y="20" fill="var(--da-text-muted)" fontSize="7" fontWeight="bold" textAnchor="end">Region: us-east-1</text>
                  <text x="180" y="20" fill="var(--da-text-muted)" fontSize="7" fontWeight="bold" textAnchor="start">Region: eu-west-1</text>

                  {/* Primary Node (us-east-1) */}
                  <g transform="translate(15, 60)">
                    <rect x="0" y="0" width="80" height="50" rx="6" fill="var(--da-code-bg)" stroke="var(--da-code-border)" strokeWidth="1.5" />
                    <text x="40" y="16" fill="var(--da-code-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Primary DB</text>
                    <text x="40" y="27" fill="var(--da-svg-purple-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                      {globalScenario === 'dynamodb' ? 'mrk-9b8a7c6...' : 'key-us-regional'}
                    </text>
                    <text x="40" y="38" fill="var(--da-svg-green-text)" fontSize="6" fontWeight="bold" textAnchor="middle">🟢 Encrypted</text>
                  </g>

                  {/* Replica Node (eu-west-1) */}
                  <g transform="translate(225, 60)">
                    <rect x="0" y="0" width="80" height="50" rx="6" 
                      fill={replicationState === 'failed' ? 'var(--da-svg-red-bg)' : 'var(--da-svg-green-bg)'} 
                      stroke={replicationState === 'failed' ? 'var(--da-svg-red-border)' : 'var(--da-svg-green-border)'} 
                      strokeWidth="1.5" />
                    <text x="40" y="16" fill="var(--da-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Replica DB</text>
                    <text x="40" y="27" fill="var(--da-svg-purple-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                      {globalScenario === 'dynamodb' ? 'mrk-9b8a7c6...' : 'key-eu-regional'}
                    </text>
                    <text x="40" y="38" fill={replicationState === 'failed' ? 'var(--da-svg-red-text)' : 'var(--da-svg-green-text)'} fontSize="6" fontWeight="bold" textAnchor="middle">
                      {replicationState === 'failed' ? '❌ Key Denied' : '🟢 Decrypted Local'}
                    </text>
                  </g>
                </svg>
              </div>

              {/* Logs terminal */}
              <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto border border-slate-800 shadow-inner mt-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800 mb-1 text-slate-400">
                  <span className="flex items-center gap-1"><Terminal className="w-3 h-3 text-blue-400" /> Replication Console</span>
                  <span>AWS Network WAN Pipeline</span>
                </div>
                {replicationLogs.length === 0 ? (
                  <div className="text-slate-500 italic">Select a replication scenario and click "Trigger Replication" to verify multi-region KMS key decryptions.</div>
                ) : (
                  replicationLogs.map((log, idx) => (
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
      {/* TAB 5: CROSS-ACCOUNT SHARING & SHARED AMIS (KMS)                          */}
      {/* ========================================================================= */}
      {activeTab === 'crossaccount' && (
        <div className="space-y-6">
          <div className="da-card text-left">
            <h2 className="da-card-title text-blue-700">
              <Server className="w-5 h-5" /> Cross-Account Custom KMS Sharing &amp; Shared AMI boots
            </h2>
            <p className="da-card-desc">
              Sharing AMIs encrypted with a Custom KMS Key requires **updating the key policy in Source Account A** to grant permissions to the Target Account B. Default AWS-managed keys cannot be shared cross-account.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Sidebar Controls */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm text-left flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                
                {/* KMS Key Policy cross account toggle */}
                <div>
                  <span className="text-xs font-extrabold text-slate-800 block mb-2">1. Custom Key Policy in Account A:</span>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="policycross"
                        checked={crossAccountPolicy === 'denied'}
                        onChange={() => { setCrossAccountPolicy('denied'); setBootState('idle'); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      🛑 Denied Policy (Default - Account B has no access)
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-bold cursor-pointer select-none">
                      <input
                        type="radio"
                        name="policycross"
                        checked={crossAccountPolicy === 'allowed'}
                        onChange={() => { setCrossAccountPolicy('allowed'); setBootState('idle'); }}
                        className="text-blue-600 accent-blue-600"
                      />
                      🟢 Allowed Policy (Grants kms:Decrypt/CreateGrant to Account B)
                    </label>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] leading-relaxed text-slate-650 font-medium">
                  <span className="font-extrabold text-slate-800 block mb-1">AMI Sharing Rule:</span>
                  "AWS Managed keys (e.g. `aws/ebs`) are locked to your account. To share an encrypted AMI/snapshot cross-account, you must use a **Custom Managed Key** and open the key policy gate."
                </div>

              </div>

              <div className="flex gap-2">
                <button
                  onClick={resetBootSim}
                  className="flex-1 py-2 border border-slate-250 hover:bg-slate-55 text-slate-650 rounded-xl text-xs font-bold transition-all active:scale-95"
                >
                  Reset
                </button>
                <button
                  onClick={triggerBootInstance}
                  disabled={bootState === 'booting'}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-1 active:scale-95 transition-all shadow"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Launch Shared AMI
                </button>
              </div>

            </div>

            {/* Visualizer & Logs Terminal */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden da-svg-bg flex flex-col justify-between min-h-[420px]">
              
              {bootState === 'booting' && (
                <span className="absolute top-3 left-3 bg-blue-100 border border-blue-300 text-blue-700 font-extrabold text-[9px] px-2 py-0.5 rounded animate-pulse select-none z-10">
                  ⚡ ACCOUNT B REQUESTING ENCRYPTED VOLUME DECRYPTION...
                </span>
              )}
              {bootState === 'success' && (
                <span className="absolute top-3 left-3 bg-emerald-100 border border-emerald-300 text-emerald-700 font-extrabold text-[9px] px-2 py-0.5 rounded select-none z-10 animate-bounce">
                  ✅ EC2 INSTANCE BOOTED CLEANLY IN ACCOUNT B (RUNNING)
                </span>
              )}
              {bootState === 'failed' && (
                <span className="absolute top-3 left-3 bg-rose-100 border border-rose-300 text-rose-700 font-extrabold text-[9px] px-2 py-0.5 rounded select-none z-10 animate-pulse">
                  ❌ BOOT TERMINATED - 403 ACCESSDENIED KMS DECRYPT FAILURE
                </span>
              )}

              {/* Graphic Flowchart */}
              <div className="w-full flex-grow flex items-center justify-center overflow-x-auto">
                <svg className="w-full min-w-[340px] h-[180px]" viewBox="0 0 340 180">
                  {/* Account borders */}
                  <rect x="5" y="10" width="155" height="160" rx="8" fill="none" stroke="var(--da-card-border)" strokeWidth="1.5" strokeDasharray="4,4" />
                  <text x="15" y="22" fill="var(--da-text-muted)" fontSize="6.5" fontWeight="bold">Source: Account A</text>

                  <rect x="175" y="10" width="160" height="160" rx="8" fill="none" stroke="var(--da-card-border)" strokeWidth="1.5" strokeDasharray="4,4" />
                  <text x="185" y="22" fill="var(--da-text-muted)" fontSize="6.5" fontWeight="bold">Target: Account B</text>

                  {/* Flow pipeline */}
                  <path d="M 65 90 H 220" fill="none" stroke="var(--da-text-muted)" strokeWidth="2" className={bootState === 'booting' ? 'da-flow-blue' : ''} />

                  {/* Account A KMS CMK Key */}
                  <g transform="translate(15, 65)">
                    <rect x="0" y="0" width="55" height="40" rx="4" fill="var(--da-svg-indigo-bg)" stroke="var(--da-svg-indigo-border)" strokeWidth="1.5" />
                    <text x="27.5" y="14" fill="var(--da-svg-indigo-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Account A</text>
                    <text x="27.5" y="23" fill="var(--da-svg-indigo-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">Custom Key</text>
                    <text x="27.5" y="32" fill="var(--da-svg-indigo-text)" fontSize="5.5" textAnchor="middle">
                      {crossAccountPolicy === 'allowed' ? '🔓 Shared Policy' : '🔒 Denied'}
                    </text>
                  </g>

                  {/* Account A shared AMI */}
                  <g transform="translate(95, 65)">
                    <rect x="0" y="0" width="50" height="40" rx="4" fill="var(--da-card-bg)" stroke="var(--da-card-border)" strokeWidth="1" />
                    <text x="25" y="14" fill="var(--da-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Shared AMI</text>
                    <text x="25" y="23" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">EBS Snap</text>
                    <text x="25" y="32" fill="var(--da-text-muted)" fontSize="5" textAnchor="middle">AMI-09876</text>
                  </g>

                  {/* Account B Target Instance */}
                  <g transform="translate(225, 65)">
                    <rect x="0" y="0" width="95" height="40" rx="4" 
                      fill={bootState === 'failed' ? 'var(--da-svg-red-bg)' : bootState === 'success' ? 'var(--da-svg-green-bg)' : 'var(--da-bg)'} 
                      stroke={bootState === 'failed' ? 'var(--da-svg-red-border)' : bootState === 'success' ? 'var(--da-svg-green-border)' : 'var(--da-card-border)'} 
                      strokeWidth="1.5" />
                    <text x="47.5" y="14" fill="var(--da-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Launched EC2</text>
                    <text x="47.5" y="23" fill="var(--da-text-muted)" fontSize="5.5" textAnchor="middle">From Shared AMI</text>
                    <text x="47.5" y="32" fill={bootState === 'failed' ? 'var(--da-svg-red-text)' : bootState === 'success' ? 'var(--da-svg-green-text)' : 'var(--da-svg-indigo-text)'} fontSize="6" fontWeight="bold" textAnchor="middle">
                      {bootState === 'idle' ? 'STANDBY' : bootState === 'booting' ? 'LAUNCHING...' : bootState === 'failed' ? '❌ CRASHED' : '🟢 RUNNING'}
                    </text>
                  </g>
                </svg>
              </div>

              {/* Key policy code snippet View */}
              {crossAccountPolicy === 'allowed' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-left font-mono text-[9px] text-slate-350 leading-relaxed overflow-x-auto max-h-48 mb-4">
                  <div className="text-slate-500 font-bold pb-2 border-b border-slate-800 mb-2 flex justify-between items-center">
                    <span>📄 ACC_A_SHARED_KEY_POLICY.json</span>
                    <span className="text-[8px] bg-green-950 text-green-400 px-1.5 py-0.5 rounded border border-green-900">CROSS_ACCOUNT_ALLOW</span>
                  </div>
                  <pre>{`{
  "Sid": "Allow direct use of the key from Account B",
  "Effect": "Allow",
  "Principal": {
    "AWS": "arn:aws:iam::AccountB-ID:root"
  },
  "Action": [
    "kms:Decrypt",
    "kms:DescribeKey",
    "kms:CreateGrant"
  ],
  "Resource": "*"
}`}</pre>
                </div>
              )}

              {/* Logs output terminal */}
              <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-[9px] leading-relaxed max-h-36 overflow-y-auto border border-slate-900 shadow-inner">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-1.5 text-slate-400">
                  <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4 text-amber-400" /> EC2 Hypervisor Boot Console</span>
                  <span>Target: Account B :: Xen/KVM hyper</span>
                </div>
                {bootLogs.length === 0 ? (
                  <div className="text-slate-500 italic">Toggle the Custom Key Policy access in Account A and run the launcher to boot the instance in Account B.</div>
                ) : (
                  bootLogs.map((log, idx) => (
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
