import { useState } from 'react';
import {
  Shield,
  Key,
  Play,
  RefreshCw,
  SlidersHorizontal,
  BookOpen,
  Terminal,
  Network,
  Server,
  Lock,
  Unlock,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  Copy,
  Check
} from 'lucide-react';

type TabType = 'notebook' | 'intro' | 'kms' | 'envelope' | 'multiregion' | 'crossaccount';

interface LogRow {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export default function SecretsAndKMSEncryptionVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');

  // Visual Architect Academy Notebook states
  const [selectedNote, setSelectedNote] = useState<string>('kms_envelope');
  const [expandedCategory, setExpandedCategory] = useState<string>('keys_cryptography');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedNoteId(id);
    setTimeout(() => {
      setCopiedNoteId(null);
    }, 2000);
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
      {/* Isolated visualizer styles */}
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

        /* Modern Learning Center styles */
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
          box-shadow: 0 12px 20px -8px rgba(37, 99, 235, 0.12);
          border-color: #bfdbfe;
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
          border-bottom: 1px solid #e2e8f0;
          font-size: 10px;
          font-weight: 850;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
        }
        .acad-dir-folder-btn:hover {
          background: #f1f5f9;
          color: #1e293b;
        }
        .acad-dir-item-btn {
          width: 105%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 18px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          border-left: 3px solid transparent;
          background: #ffffff;
          transition: all 0.15s ease;
          text-align: left;
        }
        .acad-dir-item-btn:hover {
          background: #f8fafc;
          color: #2563eb;
          border-left-color: #cbd5e1;
        }
        .acad-dir-item-btn.acad-active {
          background: #eff6ff;
          color: #1e40af;
          border-left-color: #2563eb;
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
          background: #eff6ff;
          border: 1.5px solid #bfdbfe;
          color: #1e40af;
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
          border-left: 4px solid #2563eb;
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

        /* Centralized Dark Mode Overrides for SecretsAndKMSEncryptionVisualizer.tsx */
        .dark .da-container {
          background: #020617 !important;
          color: #f8fafc !important;
        }
        .dark .da-card,
        .dark [class*="da-card"] {
          background: rgba(15, 23, 42, 0.75) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }
        .dark .da-card b,
        .dark .da-card strong,
        .dark .da-card h3,
        .dark .da-card h4 {
          color: #ffffff !important;
        }
        .dark .da-tabs {
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .da-tb {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #94a3b8 !important;
        }
        .dark .da-tb:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #f8fafc !important;
        }
        .dark .da-sec,
        .dark .da-kk {
          color: #94a3b8 !important;
        }
        .dark .da-log,
        .dark .da-terminal {
          background: #020617 !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #38bdf8 !important;
        }
        .dark .da-btn {
          background: rgba(15, 23, 42, 0.8) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .da-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
        }
        .dark .da-met {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark ul.da-ck li {
          color: #cbd5e1 !important;
        }
        .dark .da-inst,
        .dark .da-instance {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .da-inst .meta,
        .dark .da-instance .meta {
          color: #94a3b8 !important;
        }
        .dark .da-svg-bg {
          background-color: #020617 !important;
          background-image: radial-gradient(rgba(51, 65, 85, 0.5) 1.2px, transparent 1.2px) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        
        /* Node Status Overrides */
        .dark .da-ok {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: #4ade80 !important;
        }
        .dark .da-warm {
          border-color: #f59e0b !important;
          background: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
        }
        .dark .da-drain {
          border-color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }
        .dark .da-down {
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
      <div className="da-tabs">
        <button className={`da-tb ${activeTab === 'notebook' ? 'da-on' : ''}`} onClick={() => setActiveTab('notebook')}>
          <BookOpen className="w-4 h-4" /> 📓 Visual Architect Notes
        </button>
        <button className={`da-tb ${activeTab === 'intro' ? 'da-on' : ''}`} onClick={() => setActiveTab('intro')}>
          <BookOpen className="w-4 h-4" /> 1. KMS vs SSM vs Secrets Manager
        </button>
        <button className={`da-tb ${activeTab === 'kms' ? 'da-on' : ''}`} onClick={() => setActiveTab('kms')}>
          <Shield className="w-4 h-4" /> 2. Key Architecture &amp; Rotations
        </button>
        <button className={`da-tb ${activeTab === 'envelope' ? 'da-on' : ''}`} onClick={() => setActiveTab('envelope')}>
          <Terminal className="w-4 h-4" /> 3. Envelope Encryption Simulator
        </button>
        <button className={`da-tb ${activeTab === 'multiregion' ? 'da-on' : ''}`} onClick={() => setActiveTab('multiregion')}>
          <Network className="w-4 h-4" /> 4. Global Multi-Region Replication
        </button>
        <button className={`da-tb ${activeTab === 'crossaccount' ? 'da-on' : ''}`} onClick={() => setActiveTab('crossaccount')}>
          <Server className="w-4 h-4" /> 5. Shared AMIs &amp; Key Policies
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: INTRO MATRIX & SCHEMES                                             */}
      {/* ========================================================================= */}
      {activeTab === 'notebook' && (
        <div className="space-y-6 animate-fadeIn text-left">
          
          <div className="card text-left">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
              <Key className="w-5 h-5 text-indigo-600" /> AWS Secrets &amp; KMS Cryptographic Notes
            </h2>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-sans font-semibold">
              Learn how to manage data security using Key Management Service (KMS) envelope encryption, IAM key policies, parameter storage secrets, and cross-account key sharing.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Sidebar Category Explorer */}
            <div className="lg:col-span-3 space-y-4 text-left">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">VPC Directory Tree:</span>
              
              <div className="acad-dir-container">
                <div className="acad-dir-header">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Module Explorer</span>
                </div>

                {/* CATEGORY 1: KEYS & CRYPTOGRAPHY */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'keys_cryptography' ? '' : 'keys_cryptography')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-blue-500" />
                      1. Keys &amp; Cryptography
                    </span>
                    {expandedCategory === 'keys_cryptography' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'keys_cryptography' && (
                    <div className="bg-slate-50/50 py-1 border-b border-slate-100">
                      <button 
                        onClick={() => setSelectedNote('kms_envelope')}
                        className={`acad-dir-item-btn ${selectedNote === 'kms_envelope' ? 'acad-active' : ''}`}
                      >
                        Symmetric vs Asymmetric
                      </button>
                      <button 
                        onClick={() => setSelectedNote('envelope_encryption')}
                        className={`acad-dir-item-btn ${selectedNote === 'envelope_encryption' ? 'acad-active' : ''}`}
                      >
                        Envelope Encryption
                      </button>
                    </div>
                  )}
                </div>

                {/* CATEGORY 2: KEY POLICIES & COMPLIANCE */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'policies_compliance' ? '' : 'policies_compliance')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-500" />
                      2. Key Policies &amp; Config
                    </span>
                    {expandedCategory === 'policies_compliance' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'policies_compliance' && (
                    <div className="bg-slate-50/50 py-1 border-b border-slate-100">
                      <button 
                        onClick={() => setSelectedNote('key_policies')}
                        className={`acad-dir-item-btn ${selectedNote === 'key_policies' ? 'acad-active' : ''}`}
                      >
                        KMS Policies &amp; Lockout
                      </button>
                      <button 
                        onClick={() => setSelectedNote('parameter_secrets')}
                        className={`acad-dir-item-btn ${selectedNote === 'parameter_secrets' ? 'acad-active' : ''}`}
                      >
                        SSM vs Secrets Manager
                      </button>
                    </div>
                  )}
                </div>

                {/* CATEGORY 3: ENTERPRISE GLOBAL DATA */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'global_data' ? '' : 'global_data')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5 text-blue-500" />
                      3. Enterprise Global Data
                    </span>
                    {expandedCategory === 'global_data' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'global_data' && (
                    <div className="bg-slate-50/50 py-1 border-b border-slate-100">
                      <button 
                        onClick={() => setSelectedNote('global_mrk')}
                        className={`acad-dir-item-btn ${selectedNote === 'global_mrk' ? 'acad-active' : ''}`}
                      >
                        Multi-Region Replica Keys
                      </button>
                      <button 
                        onClick={() => setSelectedNote('cross_account_kms')}
                        className={`acad-dir-item-btn ${selectedNote === 'cross_account_kms' ? 'acad-active' : ''}`}
                      >
                        Cross-Account Key Shares
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Right Note Detail Container */}
            <div className="lg:col-span-9 space-y-6 text-left">
              
              {/* ========================================================================= */}
              {/* CONCEPT 1: KMS SYMMETRIC VS ASYMMETRIC KEYS                               */}
              {/* ========================================================================= */}
              {selectedNote === 'kms_envelope' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Key Taxonomy &amp; Hardware Security Modules</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Symmetric, Asymmetric &amp; HMAC KMS Keys</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('kms')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Shield className="w-3.5 h-3.5" /> Go to Key Simulator
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 1 of 6</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    AWS KMS keys reside inside hardware security modules (HSMs) validated under **FIPS 140-2 Level 3**. KMS supports symmetric keys, asymmetric key pairs, and HMAC signing keys, each optimized for distinct enterprise compliance environments.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    <div className="md:col-span-6 space-y-3.5 text-xs text-slate-700 leading-relaxed">
                      <div>
                        <strong className="text-slate-900 block font-bold">1. Symmetric Encryption Keys (AES-256)</strong>
                        A single 256-bit key wraps and unwraps data. Plaintext data is sent to KMS, and ciphertext is returned (or vice-versa). Symmetric keys support **envelope encryption** (data keys generation) and are adopted natively by S3, EBS, and RDS encryption mechanisms. Key material never leaves the KMS HSM boundary.
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-bold">2. Asymmetric Cryptography (RSA &amp; ECC)</strong>
                        Consists of a mathematically linked public and private key pair. You can download the public key to encrypt data or verify signatures client-side. The private key remains securely sealed inside KMS HSMs to execute decrypt and sign operations.
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-bold">3. Practical Real-Life Use Cases</strong>
                        - **Symmetric Keys:** Native AWS storage volume encryption, S3 server-side encryption (SSE-KMS), and parameter store secrets.
                        - **Asymmetric Keys:** Generating digital signatures for external transaction API handshakes, code signing binaries, and secure payload exchanges with external contractors.
                      </div>
                    </div>

                    <div className="md:col-span-6 flex flex-col justify-between space-y-4 relative">
                      <div className="acad-terminal">
                        <button 
                          onClick={() => handleCopyCode(`aws kms create-key \\\n  --description "App Symmetric CMK" \\\n  --key-usage ENCRYPT_DECRYPT \\\n  --customer-master-key-spec SYMMETRIC_DEFAULT`, 'cli_kms_spec')}
                          className={`acad-copy-btn ${copiedNoteId === 'cli_kms_spec' ? 'copied' : ''}`}
                        >
                          {copiedNoteId === 'cli_kms_spec' ? <Check size={10} /> : <Copy size={10} />}
                          {copiedNoteId === 'cli_kms_spec' ? 'Copied' : 'Copy Command'}
                        </button>
                        <span className="text-[10px] font-black text-indigo-400 block uppercase tracking-wider mb-2">Create Symmetric Key (AWS CLI)</span>
                        <pre className="text-[9.5px] leading-relaxed text-slate-300 font-mono overflow-x-auto">
{`aws kms create-key \\
  --description "App Symmetric CMK" \\
  --key-usage ENCRYPT_DECRYPT \\
  --customer-master-key-spec SYMMETRIC_DEFAULT`}
                        </pre>
                      </div>

                      <div className="acad-takeaway-box text-xs">
                        <strong>🛡️ Key Management Tip:</strong> AWS Managed Keys rotate automatically every 3 years. Customer Managed Keys can be configured to rotate automatically every year, preserving older material automatically to decrypt legacy ciphertext blocks.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 2: ENVELOPE ENCRYPTION ARCHITECTURE                               */}
              {/* ========================================================================= */}
              {selectedNote === 'envelope_encryption' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Envelope Encryption Conduit</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Client-Side Envelope Encryption Mechanics</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('envelope')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Terminal className="w-3.5 h-3.5" /> Go to Envelope Simulator
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 2 of 6</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Envelope encryption is the practice of encrypting plaintext data locally with a **Data Key**, and then encrypting the data key itself under a KMS root **Customer Master Key (CMK)**. It is a critical best practice for processing large files or high-throughput network data without exceeding KMS API limit thresholds.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    <div className="md:col-span-6 space-y-3.5 text-xs text-slate-700 leading-relaxed">
                      <div>
                        <strong className="text-slate-900 block font-bold">1. Inbound Key Generation Sequence</strong>
                        The application invokes the `GenerateDataKey` API pointing to the KMS CMK. KMS returns two keys:
                        - **Plaintext Data Key:** Used by the application locally to encrypt the payload.
                        - **Encrypted Data Key (Ciphertext):** A wrapped copy of the key.
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-bold">2. Local Encryption &amp; Memory Purging</strong>
                        The client application encrypts the raw data block using the plaintext data key. Immediately after encryption completes, the plaintext data key **must be purged from client memory** to establish a zero-trust state. The application stores the encrypted data along with the encrypted data key.
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-bold">3. Practical Real-Life Use Cases</strong>
                        - **EBS Volume Encryption:** EC2 host boot volumes use envelope encryption. The EC2 host caches the decrypted data key inside protected hypervisor memory, decrypting blocks on the fly without making repeated KMS network calls.
                        - **High-throughput application data:** Encrypting user profile logs, custom video uploads, or customer files stored inside S3 buckets locally.
                      </div>
                    </div>

                    <div className="md:col-span-6 flex flex-col justify-between space-y-4 relative">
                      <div className="acad-terminal">
                        <button 
                          onClick={() => handleCopyCode(`aws kms generate-data-key \\\n  --key-id alias/app-key \\\n  --key-spec AES_256`, 'cli_env_key')}
                          className={`acad-copy-btn ${copiedNoteId === 'cli_env_key' ? 'copied' : ''}`}
                        >
                          {copiedNoteId === 'cli_env_key' ? <Check size={10} /> : <Copy size={10} />}
                          {copiedNoteId === 'cli_env_key' ? 'Copied' : 'Copy Command'}
                        </button>
                        <span className="text-[10px] font-black text-indigo-400 block uppercase tracking-wider mb-2">Request Data Key (AWS CLI)</span>
                        <pre className="text-[9.5px] leading-relaxed text-slate-300 font-mono overflow-x-auto">
{`aws kms generate-data-key \\
  --key-id alias/app-key \\
  --key-spec AES_256`}
                        </pre>
                      </div>

                      <div className="acad-takeaway-box text-xs">
                        <strong>🛡️ Decryption Pipeline:</strong> To decrypt, the client sends the encrypted data key to KMS. KMS decrypts the key using the root CMK and returns the plaintext key. The client decrypts the payload locally and purges the plaintext key.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 3: KMS KEY POLICIES & LOCKOUT                                     */}
              {/* ========================================================================= */}
              {selectedNote === 'key_policies' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Resource Access &amp; Compliance Locks</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2 font-display">KMS Key Policies &amp; Critical Key Lockouts</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('kms')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Shield className="w-3.5 h-3.5" /> Go to Policies Simulator
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 3 of 6</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    KMS keys are governed strictly by resource-based **Key Policies**. Standard IAM policies inside an AWS account have zero effect on KMS keys unless the Key Policy explicitly delegates authority back to the account.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    <div className="md:col-span-6 space-y-3.5 text-xs text-slate-700 leading-relaxed">
                      <div>
                        <strong className="text-slate-900 block font-bold">1. Default Account Root Delegation</strong>
                        KMS policies default to including a statement that grants the root account user permissions:
                        `"Principal": {"{"}"AWS": "arn:aws:iam::123456789012:root"{"}"}`.
                        This statement enables IAM policies within the account to control key permissions. If this statement is deleted, IAM permissions are ignored, locking access strictly to principals defined inside the Key Policy itself.
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-bold">2. Lockout State Mitigation</strong>
                        If a key policy is updated to delete administrative permissions and the IAM root delegation statement, the key enters a **critical lockout state**. No user, including the root account admin, can edit the key policy or decrypt data. Overriding a lockout state requires submitting an AWS support request.
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-bold">3. Practical Real-Life Use Cases</strong>
                        - **Compliance Lockdowns:** Hardening critical payment transaction databases (PCI-DSS compliance) by writing policies that deny key decryption privileges to administrative accounts, leaving them accessible only to automated transactional microservices.
                        - **Audit drift controls:** Preventing configuration changes by removing direct admin permissions.
                      </div>
                    </div>

                    <div className="md:col-span-6 flex flex-col justify-between space-y-4 relative">
                      <div className="acad-terminal">
                        <button 
                          onClick={() => handleCopyCode(`{\n  "Sid": "Enable IAM User Permissions",\n  "Effect": "Allow",\n  "Principal": { "AWS": "arn:aws:iam::123456789012:root" },\n  "Action": "kms:*",\n  "Resource": "*"\n}`, 'json_kms_policy')}
                          className={`acad-copy-btn ${copiedNoteId === 'json_kms_policy' ? 'copied' : ''}`}
                        >
                          {copiedNoteId === 'json_kms_policy' ? <Check size={10} /> : <Copy size={10} />}
                          {copiedNoteId === 'json_kms_policy' ? 'Copied' : 'Copy JSON'}
                        </button>
                        <span className="text-[10px] font-black text-indigo-400 block uppercase tracking-wider mb-2">Delegated Key Policy Statement (JSON)</span>
                        <pre className="text-[9.5px] leading-relaxed text-slate-300 font-mono overflow-x-auto">
{`{
  "Sid": "Enable IAM User Permissions",
  "Effect": "Allow",
  "Principal": { 
    "AWS": "arn:aws:iam::123456789012:root" 
  },
  "Action": "kms:*",
  "Resource": "*"
}`}
                        </pre>
                      </div>

                      <div className="acad-takeaway-box text-xs">
                        <strong>🛡️ Audit Rule:</strong> Regularly audit Key Policies to verify that the Root delegation statement is present, preventing administrative lockouts on business-critical KMS keys.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 4: PARAMETER STORE VS SECRETS MANAGER                            */}
              {/* ========================================================================= */}
              {selectedNote === 'parameter_secrets' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Configuration vs. Secrets Management</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2 font-display">SSM Parameter Store vs. AWS Secrets Manager</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('intro')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <BookOpen className="w-3.5 h-3.5" /> Go to Comparative Matrix
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 4 of 6</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    AWS provides two main services to store configurations and passwords. Choosing between them depends on cost models, rotation requirements, and database integrations.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    <div className="md:col-span-6 space-y-3.5 text-xs text-slate-700 leading-relaxed">
                      <div>
                        <strong className="text-slate-900 block font-bold">1. SSM Parameter Store (Centralized Configuration)</strong>
                        Designed for standard app configurations and simple secrets. Standard parameters are free (limit of 10,000 keys per region). SecureString parameters leverage KMS symmetric keys to encrypt data blocks in transit and at rest. Config values are organized hierarchically (e.g. `/prod/rds/endpoint`).
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-bold">2. AWS Secrets Manager (Dynamic Credentials)</strong>
                        A paid secrets database offering advanced features:
                        - **Lambda Rotation:** Out-of-the-box integration to dynamically rotate database passwords on RDS without application downtime.
                        - **Cross-Account Sharing:** Allows other accounts to read secrets directly via resource policies.
                        - **Global Replication:** Replicates secrets automatically across regions.
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-bold">3. Practical Real-Life Use Cases</strong>
                        - **SSM Parameter Store:** Injecting environment flags, endpoint paths, or standard API keys that do not rotate frequently.
                        - **Secrets Manager:** Storing and rotating RDS MySQL/PostgreSQL root credentials, OAuth API tokens, or multi-region application connection strings.
                      </div>
                    </div>

                    <div className="md:col-span-6 flex flex-col justify-between space-y-4 relative">
                      <div className="acad-terminal">
                        <button 
                          onClick={() => handleCopyCode(`aws secretsmanager create-secret \\\n  --name /prod/db/secret \\\n  --secret-string '{"username":"admin","password":"DBPassword123"}'`, 'cli_secrets_mgr')}
                          className={`acad-copy-btn ${copiedNoteId === 'cli_secrets_mgr' ? 'copied' : ''}`}
                        >
                          {copiedNoteId === 'cli_secrets_mgr' ? <Check size={10} /> : <Copy size={10} />}
                          {copiedNoteId === 'cli_secrets_mgr' ? 'Copied' : 'Copy Command'}
                        </button>
                        <span className="text-[10px] font-black text-indigo-400 block uppercase tracking-wider mb-2">Create Secret (AWS CLI)</span>
                        <pre className="text-[9.5px] leading-relaxed text-slate-300 font-mono overflow-x-auto">
{`aws secretsmanager create-secret \\
  --name /prod/db/secret \\
  --secret-string '{"username":"admin","password":"DBPassword123"}'`}
                        </pre>
                      </div>

                      <div className="acad-takeaway-box text-xs">
                        <strong>🛡️ Cost Optimization Tip:</strong> Parameter Store standard parameters are free, whereas Secrets Manager charges per secret and per 10,000 API calls. Use Parameter Store for standard app configs and Secrets Manager for sensitive credentials that require automated rotation.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 5: MULTI-REGION KEYS & GLOBAL REPLICATION                          */}
              {/* ========================================================================= */}
              {selectedNote === 'global_mrk' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Multi-Region Disaster Recovery</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Multi-Region Replica Keys &amp; Storage Optimization</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('multiregion')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Network className="w-3.5 h-3.5" /> Go to Global Replication
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 5 of 6</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Standard KMS keys are regional resource blocks; you cannot decrypt a ciphertext generated in `us-east-1` using a standard key in `eu-west-1`. To support globally distributed data layers, AWS provides **Multi-Region Keys (MRKs)**.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    <div className="md:col-span-6 space-y-3.5 text-xs text-slate-700 leading-relaxed">
                      <div>
                        <strong className="text-slate-900 block font-bold">1. Multi-Region Keys (MRKs)</strong>
                        MRKs are replica keys provisioned in different regions that share the identical Key ID, key material, and key rotation state. They allow applications to encrypt data in one region and decrypt it in another region locally without making cross-region KMS network calls.
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-bold">2. S3 Bucket Keys &amp; Cost Reduction</strong>
                        By default, SSE-KMS generates a new data key for every object write, leading to massive KMS API request charges at scale. **S3 Bucket Keys** cache a bucket-level data key for brief windows, reducing KMS API calls by up to 99%.
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-bold">3. Practical Real-Life Use Cases</strong>
                        - **DynamoDB Global Tables:** Multi-Region replica keys encrypt and decrypt replicated database partitions locally, minimizing regional network latency.
                        - **Aurora Global Database:** Replicating encrypted storage volumes between regions. Aurora decrypts storage pages at the primary cluster boundary and re-encrypts them using the local regional KMS key at the replica target boundary.
                      </div>
                    </div>

                    <div className="md:col-span-6 flex flex-col justify-between space-y-4 relative">
                      <div className="acad-terminal">
                        <button 
                          onClick={() => handleCopyCode(`aws kms replicate-key \\\n  --key-id arn:aws:kms:us-east-1:123456789012:key/mrk-9b8a7c6 \\\n  --replica-region eu-west-1`, 'cli_mrk_replicate')}
                          className={`acad-copy-btn ${copiedNoteId === 'cli_mrk_replicate' ? 'copied' : ''}`}
                        >
                          {copiedNoteId === 'cli_mrk_replicate' ? <Check size={10} /> : <Copy size={10} />}
                          {copiedNoteId === 'cli_mrk_replicate' ? 'Copied' : 'Copy Command'}
                        </button>
                        <span className="text-[10px] font-black text-indigo-400 block uppercase tracking-wider mb-2">Replicate Multi-Region Key (AWS CLI)</span>
                        <pre className="text-[9.5px] leading-relaxed text-slate-300 font-mono overflow-x-auto">
{`aws kms replicate-key \\
  --key-id arn:aws:kms:us-east-1:123456789012:key/mrk-9b8a7c6 \\
  --replica-region eu-west-1`}
                        </pre>
                      </div>

                      <div className="acad-takeaway-box text-xs">
                        <strong>🛡️ S3 Bucket Key Setup:</strong> Always enable S3 Bucket Keys when encrypting high-throughput S3 buckets with KMS to drastically lower KMS API costs.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* CONCEPT 6: CROSS-ACCOUNT KEY SHARING                                      */}
              {/* ========================================================================= */}
              {selectedNote === 'cross_account_kms' && (
                <div className="acad-detail-card space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="acad-hero-badge">Cross-Account Trust Boundaries</span>
                      <h3 className="text-xl font-black text-slate-900 mt-2 font-display">Cross-Account Sharing &amp; KMS Grants for AMIs/Snapshots</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('crossaccount')}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <Server className="w-3.5 h-3.5" /> Go to Shared AMIs
                      </button>
                      <span className="text-xs font-bold text-slate-400">Concept 6 of 6</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Sharing encrypted resources (EBS snapshots, AMIs, or S3 objects) across AWS accounts requires configuring permissions in the KMS key policy, IAM policies, and creating a **KMS Grant**.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    <div className="md:col-span-6 space-y-3.5 text-xs text-slate-700 leading-relaxed">
                      <div>
                        <strong className="text-slate-900 block font-bold">1. Key Policy Grant statement</strong>
                        The resource owner (Account A) must update the custom KMS Key Policy to trust the receiver (Account B). You cannot share resources encrypted with default AWS Managed Keys (`aws/ebs` or `aws/s3`) across accounts. You must use a **Customer Managed Key** for cross-account sharing.
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-bold">2. KMS Grants (`CreateGrant`)</strong>
                        A **KMS Grant** is a policy mechanism that allows principal roles inside Account B to perform cryptographic operations (like `Decrypt`). The EC2 service role in Account B creates a grant to decrypt Account A's shared EBS snapshot when booting an EC2 instance.
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-bold">3. Practical Real-Life Use Cases</strong>
                        - **Golden AMIs Distribution:** A central security account builds and encrypts "Golden AMIs" using a customer managed key, sharing them with application accounts that run EC2 auto-scaling groups.
                        - **Cross-account database copies:** Copying encrypted database snapshots from production to staging/testing environments.
                      </div>
                    </div>

                    <div className="md:col-span-6 flex flex-col justify-between space-y-4 relative">
                      <div className="acad-terminal">
                        <button 
                          onClick={() => handleCopyCode(`aws kms create-grant \\\n  --key-id arn:aws:kms:us-east-1:AccountA:key/key-9b8a7c6 \\\n  --grantee-principal arn:aws:iam::AccountB:root \\\n  --operations Decrypt CreateGrant`, 'cli_kms_grant')}
                          className={`acad-copy-btn ${copiedNoteId === 'cli_kms_grant' ? 'copied' : ''}`}
                        >
                          {copiedNoteId === 'cli_kms_grant' ? <Check size={10} /> : <Copy size={10} />}
                          {copiedNoteId === 'cli_kms_grant' ? 'Copied' : 'Copy Command'}
                        </button>
                        <span className="text-[10px] font-black text-indigo-400 block uppercase tracking-wider mb-2">Create KMS Grant (AWS CLI)</span>
                        <pre className="text-[9.5px] leading-relaxed text-slate-300 font-mono overflow-x-auto">
{`aws kms create-grant \\
  --key-id arn:aws:kms:us-east-1:AccountA:key/key-9b8a7c6 \\
  --grantee-principal arn:aws:iam::AccountB:root \\
  --operations Decrypt CreateGrant`}
                        </pre>
                      </div>

                      <div className="acad-takeaway-box text-xs">
                        <strong>🛡️ Sharing Prerequisite:</strong> The target account B must also have an IAM policy granting the local role permissions to use the key (`kms:Decrypt` and `kms:CreateGrant`) alongside the cross-account trust setup in the key policy.
                      </div>
                    </div>
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
                  <path d="M 50 60 H 130" fill="none" stroke="#64748b" strokeWidth="1.5" className={kmsState === 'rotating' ? 'da-flow-blue' : ''} />
                  <path d="M 190 60 H 260" fill="none" stroke="#64748b" strokeWidth="1.5" className={kmsState === 'rotating' ? 'da-flow-green' : ''} />

                  {/* KMS CMK Ring Node */}
                  <g transform="translate(10, 35)">
                    <rect x="0" y="0" width="55" height="50" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                    <text x="27.5" y="16" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">KMS</text>
                    <text x="27.5" y="27" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">HSM Ring</text>
                    <text x="27.5" y="38" fill="#94a3b8" fontSize="5.5" textAnchor="middle">FIPS 140-2</text>
                  </g>

                  {/* Backing Key Material block */}
                  <g transform="translate(130, 35)">
                    <rect x="0" y="0" width="60" height="50" rx="6" 
                      fill={policySetup === 'lockout' ? '#fef2f2' : '#f0fdf4'} 
                      stroke={policySetup === 'lockout' ? '#ef4444' : '#10b981'} 
                      strokeWidth="1.5" />
                    <text x="30" y="16" fill="#334155" fontSize="7" fontWeight="bold" textAnchor="middle">Backing Key</text>
                    <text x="30" y="27" fill="#64748b" fontSize="5.5" textAnchor="middle">
                      {keyOrigin === 'aws' ? 'Managed' : keyOrigin === 'customer' ? 'CMK Material' : 'Imported BYOK'}
                    </text>
                    <text x="30" y="38" fill={policySetup === 'lockout' ? '#dc2626' : '#16a34a'} fontSize="6.5" fontWeight="extrabold" textAnchor="middle">
                      {policySetup === 'lockout' ? '🔒 LOCKED' : '🟢 ACTIVE'}
                    </text>
                  </g>

                  {/* Data files target block */}
                  <g transform="translate(210, 35)">
                    <rect x="0" y="0" width="60" height="50" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="30" y="16" fill="#334155" fontSize="7" fontWeight="bold" textAnchor="middle">Payload</text>
                    <text x="30" y="27" fill="#64748b" fontSize="5" textAnchor="middle">Target Storage</text>
                    <text x="30" y="38" fill="#2563eb" fontSize="6.5" fontWeight="bold" textAnchor="middle">
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
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {/* Flow lines */}
                  {/* Client -> KMS */}
                  <path d="M 60 40 Q 115 15 170 30" fill="none" stroke="#2563eb" strokeWidth="1.5" className={envelopeState === 'generating' ? 'da-flow-blue' : ''} markerEnd="url(#arrow-sync)" />
                  {/* KMS -> Client */}
                  <path d="M 170 50 Q 115 65 60 80" fill="none" stroke="#10b981" strokeWidth="1.5" className={envelopeState === 'generating' ? 'da-flow-green' : ''} markerEnd="url(#arrow-sync)" />

                  {/* Client Local Node */}
                  <g transform="translate(10, 45)">
                    <rect x="0" y="0" width="55" height="50" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                    <text x="27.5" y="16" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">Client App</text>
                    <text x="27.5" y="27" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">Environment</text>
                    <text x="27.5" y="38" fill="#2563eb" fontSize="5.5" fontWeight="bold" textAnchor="middle">Local RAM</text>
                  </g>

                  {/* KMS HSM Core */}
                  <g transform="translate(170, 15)">
                    <rect x="0" y="0" width="70" height="40" rx="6" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5" />
                    <text x="35" y="14" fill="#78350f" fontSize="7.5" fontWeight="bold" textAnchor="middle">KMS Service</text>
                    <text x="35" y="23" fill="#b45309" fontSize="5.5" textAnchor="middle">HSM Core</text>
                    <text x="35" y="31" fill="#d97706" fontSize="5.5" fontWeight="bold" textAnchor="middle">alias/master-key</text>
                  </g>

                  {/* Encryption workflow outputs */}
                  {encryptedDataKey && (
                    <g transform="translate(130, 95)" className="animate-fadeIn">
                      <rect x="0" y="0" width="125" height="35" rx="4" fill="#fff5f5" stroke="#f87171" strokeWidth="1" />
                      <text x="62.5" y="12" fill="#991b1b" fontSize="6" fontWeight="bold" textAnchor="middle">📄 METADATA PACKAGE STORE</text>
                      <text x="6" y="20" fill="#7f1d1d" fontSize="5" className="font-mono">Cipher Key: {encryptedDataKey}</text>
                      <text x="6" y="28" fill="#475569" fontSize="4.5">Stores locally alongside Base64 encrypted cipher</text>
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
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {/* Flow pipeline */}
                  {/* us-east-1 -> eu-west-1 */}
                  <path d="M 100 90 H 220" fill="none" stroke="#64748b" strokeWidth="2" className={replicationState === 'running' ? 'da-flow-blue' : ''} />

                  {/* Regional Boundary Split */}
                  <line x1="160" y1="10" x2="160" y2="170" stroke="#cbd5e1" strokeDasharray="3,3" />
                  <text x="140" y="20" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="end">Region: us-east-1</text>
                  <text x="180" y="20" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="start">Region: eu-west-1</text>

                  {/* Primary Node (us-east-1) */}
                  <g transform="translate(15, 60)">
                    <rect x="0" y="0" width="80" height="50" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
                    <text x="40" y="16" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle">Primary DB</text>
                    <text x="40" y="27" fill="#a855f7" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                      {globalScenario === 'dynamodb' ? 'mrk-9b8a7c6...' : 'key-us-regional'}
                    </text>
                    <text x="40" y="38" fill="#10b981" fontSize="6" fontWeight="bold" textAnchor="middle">🟢 Encrypted</text>
                  </g>

                  {/* Replica Node (eu-west-1) */}
                  <g transform="translate(225, 60)">
                    <rect x="0" y="0" width="80" height="50" rx="6" 
                      fill={replicationState === 'failed' ? '#fff1f2' : '#f0fdf4'} 
                      stroke={replicationState === 'failed' ? '#f43f5e' : '#10b981'} 
                      strokeWidth="1.5" />
                    <text x="40" y="16" fill="#334155" fontSize="7.5" fontWeight="bold" textAnchor="middle">Replica DB</text>
                    <text x="40" y="27" fill="#a855f7" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                      {globalScenario === 'dynamodb' ? 'mrk-9b8a7c6...' : 'key-eu-regional'}
                    </text>
                    <text x="40" y="38" fill={replicationState === 'failed' ? '#e11d48' : '#16a34a'} fontSize="6" fontWeight="bold" textAnchor="middle">
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
                  <rect x="5" y="10" width="155" height="160" rx="8" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4,4" />
                  <text x="15" y="22" fill="#94a3b8" fontSize="6.5" fontWeight="bold">Source: Account A</text>

                  <rect x="175" y="10" width="160" height="160" rx="8" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4,4" />
                  <text x="185" y="22" fill="#94a3b8" fontSize="6.5" fontWeight="bold">Target: Account B</text>

                  {/* Flow pipeline */}
                  <path d="M 65 90 H 220" fill="none" stroke="#64748b" strokeWidth="2" className={bootState === 'booting' ? 'da-flow-blue' : ''} />

                  {/* Account A KMS CMK Key */}
                  <g transform="translate(15, 65)">
                    <rect x="0" y="0" width="55" height="40" rx="4" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.5" />
                    <text x="27.5" y="14" fill="#1e3a8a" fontSize="7" fontWeight="bold" textAnchor="middle">Account A</text>
                    <text x="27.5" y="23" fill="#2563eb" fontSize="6.5" fontWeight="bold" textAnchor="middle">Custom Key</text>
                    <text x="27.5" y="32" fill="#1d4ed8" fontSize="5.5" textAnchor="middle">
                      {crossAccountPolicy === 'allowed' ? '🔓 Shared Policy' : '🔒 Denied'}
                    </text>
                  </g>

                  {/* Account A shared AMI */}
                  <g transform="translate(95, 65)">
                    <rect x="0" y="0" width="50" height="40" rx="4" fill="#ffffff" stroke="#64748b" strokeWidth="1" />
                    <text x="25" y="14" fill="#334155" fontSize="7.5" fontWeight="bold" textAnchor="middle">Shared AMI</text>
                    <text x="25" y="23" fill="#475569" fontSize="5.5" textAnchor="middle">EBS Snap</text>
                    <text x="25" y="32" fill="#94a3b8" fontSize="5" textAnchor="middle">AMI-09876</text>
                  </g>

                  {/* Account B Target Instance */}
                  <g transform="translate(225, 65)">
                    <rect x="0" y="0" width="95" height="40" rx="4" 
                      fill={bootState === 'failed' ? '#fff1f2' : bootState === 'success' ? '#f0fdf4' : '#ffffff'} 
                      stroke={bootState === 'failed' ? '#f43f5e' : bootState === 'success' ? '#10b981' : '#94a3b8'} 
                      strokeWidth="1.5" />
                    <text x="47.5" y="14" fill="#1e293b" fontSize="7.5" fontWeight="bold" textAnchor="middle">Launched EC2</text>
                    <text x="47.5" y="23" fill="#64748b" fontSize="5.5" textAnchor="middle">From Shared AMI</text>
                    <text x="47.5" y="32" fill={bootState === 'failed' ? '#dc2626' : bootState === 'success' ? '#16a34a' : '#2563eb'} fontSize="6" fontWeight="bold" textAnchor="middle">
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

    </div>
  );
}
