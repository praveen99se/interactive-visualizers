import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Copy,
  Network,
  Zap,
  Sliders,
  Globe
} from 'lucide-react';
import { cloudProviders } from '../../data/cloudStorageProviders';
import S3ComparativeView from '../../components/visualizers/S3ComparativeView';
import UniqueProviderFeatures from '../../components/visualizers/UniqueProviderFeatures';


// S3 Storage Classes Specs Data
const STORAGE_CLASSES = {
  standard: {
    name: 'S3 Standard',
    durability: '99.999999999% (eleven 9s)',
    availability: '99.99%',
    minDuration: 'None',
    minSize: 'None',
    retrievalFee: 'None',
    storageCost: 0.023, // per GB/month
    icon: '🚀',
    desc: 'General purpose storage of frequently accessed active data.'
  },
  ia: {
    name: 'S3 Standard-IA',
    durability: '99.999999999% (eleven 9s)',
    availability: '99.9%',
    minDuration: '30 Days',
    minSize: '128 KB',
    retrievalFee: '$0.01 per GB',
    storageCost: 0.0125,
    icon: '❄️',
    desc: 'Infrequently accessed data that needs millisecond active access.'
  },
  onezone: {
    name: 'S3 One Zone-IA',
    durability: '99.999999999% (eleven 9s) in 1 AZ',
    availability: '99.5%',
    minDuration: '30 Days',
    minSize: '128 KB',
    retrievalFee: '$0.01 per GB',
    storageCost: 0.01,
    icon: '⚡',
    desc: 'Infrequent, non-critical data. Wiped if the single AZ fails.'
  },
  intelligent: {
    name: 'S3 Intelligent-Tiering',
    durability: '99.999999999% (eleven 9s)',
    availability: '99.9%',
    minDuration: 'None',
    minSize: 'None',
    retrievalFee: 'None',
    storageCost: 0.023, // dynamically shifts down
    icon: '🧠',
    desc: 'Auto-shifts data between frequent and cool tiers based on access.'
  },
  glacier_ir: {
    name: 'S3 Glacier Instant Retrieval',
    durability: '99.999999999% (eleven 9s)',
    availability: '99.9%',
    minDuration: '90 Days',
    minSize: '128 KB',
    retrievalFee: '$0.03 per GB',
    storageCost: 0.004,
    icon: '🧊',
    desc: 'Archive data with instant millisecond retrieval times.'
  },
  glacier_fr: {
    name: 'S3 Glacier Flexible Retrieval',
    durability: '99.999999999% (eleven 9s)',
    availability: '99.99% (offline)',
    minDuration: '90 Days',
    minSize: 'None',
    retrievalFee: '$0.01 per GB',
    storageCost: 0.0036,
    icon: '📦',
    desc: 'Archival data. Retrievals take 1-5 minutes (Expedited) to 3-5 hours.'
  },
  glacier_deep: {
    name: 'S3 Glacier Deep Archive',
    durability: '99.999999999% (eleven 9s)',
    availability: '99.99% (offline)',
    minDuration: '180 Days',
    minSize: 'None',
    retrievalFee: '$0.007 per GB',
    storageCost: 0.00099,
    icon: '🕳️',
    desc: 'Long-term secure digital preservation. Retrievals take 12-48 hours.'
  }
};

// Bucket Policy templates
const BUCKET_POLICIES = {
  public: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::my-premium-bucket/*"
    }
  ]
}`,
  https: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EnforceSSLRequestsOnly",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::my-premium-bucket",
        "arn:aws:s3:::my-premium-bucket/*"
      ],
      "Condition": {
        "Bool": {
          "aws:SecureTransport": "false"
        }
      }
    }
  ]
}`,
  vpce: `{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RestrictAccessToSpecificVPCEndpoint",
      "Effect": "Deny",
      "Principal": "*",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::my-premium-bucket",
        "arn:aws:s3:::my-premium-bucket/*"
      ],
      "Condition": {
        "StringNotEquals": {
          "aws:sourceVpce": "vpce-0d8fa928bcde1a38"
        }
      }
    }
  ]
}`
};

interface S3VisualizerProps {
  provider: 'aws' | 'azure' | 'gcp' | 'comparative';
  setProvider: (provider: 'aws' | 'azure' | 'gcp' | 'comparative') => void;
}

export default function S3Visualizer({ provider, setProvider }: S3VisualizerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'encryption' | 'versioning' | 'storage' | 'networking' | 'transfer' | 'operations' | 'notebook' | 'unique'>('notebook');

  const isAzure = provider === 'azure';
  const isGcp = provider === 'gcp';
  const isComparative = provider === 'comparative';

  const t = (text: string) => {
    if (provider === 'aws') return text;
    if (provider === 'gcp') {
      return text
        .replace(/S3 Event Notifications/g, 'Eventarc / Pub/Sub')
        .replace(/S3 Event/g, 'Eventarc / Pub/Sub Notification')
        .replace(/s3-ingest/g, 'gcs-ingest')
        .replace(/s3-router/g, 'gcs-router')
        .replace(/s3-replicator/g, 'gcs-replicator')
        .replace(/s3-index/g, 'gcs-index')
        .replace(/S3 Bucket Keys/g, 'CMEK Encryption Keys')
        .replace(/S3 Bucket Key/g, 'CMEK Encryption Key')
        .replace(/S3 bucket/g, 'GCS bucket')
        .replace(/S3 Buckets/g, 'GCS buckets')
        .replace(/S3 objects/g, 'objects')
        .replace(/S3 object/g, 'object')
        .replace(/S3/g, 'Cloud Storage')
        .replace(/s3/g, 'storage')
        .replace(/Amazon Simple Storage Service/g, 'Google Cloud Storage')
        .replace(/Amazon S3/g, 'Google Cloud Storage')
        .replace(/Bucket Policy/g, 'Bucket IAM Policy')
        .replace(/Bucket Policies/g, 'Bucket IAM Policies')
        .replace(/bucket policy/g, 'bucket IAM policy')
        .replace(/bucket policies/g, 'bucket IAM policies')
        .replace(/Bucket/g, 'GCS Bucket')
        .replace(/bucket/g, 'bucket')
        .replace(/Buckets/g, 'GCS Buckets')
        .replace(/buckets/g, 'buckets')
        .replace(/Object Lock/g, 'Retention Policy & Holds')
        .replace(/Object/g, 'Object')
        .replace(/object/g, 'object')
        .replace(/Objects/g, 'Objects')
        .replace(/objects/g, 'objects')
        .replace(/IAM Policies/g, 'IAM Policies')
        .replace(/IAM Policy/g, 'IAM Policy')
        .replace(/IAM/g, 'IAM')
        .replace(/KMS/g, 'Cloud KMS')
        .replace(/kms/g, 'cloud-kms')
        .replace(/AWS Lambda/g, 'Cloud Functions')
        .replace(/Lambda/g, 'Cloud Functions')
        .replace(/lambda/g, 'cloud-functions')
        .replace(/Amazon SQS Queue/g, 'Pub/Sub Subscription')
        .replace(/SQS/g, 'Pub/Sub Subscription')
        .replace(/Amazon SNS Topic/g, 'Pub/Sub Topic')
        .replace(/SNS/g, 'Pub/Sub Topic')
        .replace(/AZ-1/g, 'Zone-1')
        .replace(/AZ-2/g, 'Zone-2')
        .replace(/AZ-3/g, 'Zone-3')
        .replace(/AZ/g, 'Zone')
        .replace(/az/g, 'zone')
        .replace(/aws s3api/g, 'gcloud storage')
        .replace(/aws s3/g, 'gcloud storage')
        .replace(/aws/g, 'gcloud')
        .replace(/AWS/g, 'Google Cloud')
        .replace(/arn:aws:s3:::/g, 'gs://')
        .replace(/arn:aws:kms:[a-z0-9-]+:\d+:key\/[a-f0-9-]+/g, 'projects/project-id/locations/us-east1/keyRings/my-ring/cryptoKeys/my-key')
        .replace(/arn:aws:s3/g, 'google-cloud-storage')
        .replace(/ARN/g, 'GCS Resource ID')
        .replace(/MFA Delete/g, 'Object Versioning Retention')
        .replace(/S3 Standard-IA/g, 'Nearline')
        .replace(/S3 Standard/g, 'Standard Storage')
        .replace(/Standard-IA/g, 'Nearline')
        .replace(/Glacier Instant Retrieval/g, 'Coldline')
        .replace(/Glacier Flexible Retrieval/g, 'Archive')
        .replace(/Glacier Deep Archive/g, 'Archive')
        .replace(/Glacier/g, 'Archive')
        .replace(/glacier/g, 'archive')
        .replace(/Same Region Replication/g, 'Regional Storage')
        .replace(/Cross Region Replication/g, 'Dual-Region Replication')
        .replace(/CRR/g, 'Dual-Region')
        .replace(/SRR/g, 'Single-Region')
        .replace(/SSE-S3/g, 'Google-Managed Encryption')
        .replace(/SSE-KMS/g, 'Customer-Managed Encryption Key (CMEK)')
        .replace(/SSE-C/g, 'Customer-Supplied Encryption Key')
        .replace(/DSSE-KMS/g, 'Dual-Layer KMS Encryption')
        .replace(/Transfer Acceleration/g, 'Google Edge Routing')
        .replace(/Multipart Upload/g, 'Resumable Upload')
        .replace(/multipart-client/g, 'resumable-client')
        .replace(/InitiateMultipartUpload/g, 'InsertObject (Init)')
        .replace(/CompleteMultipartUpload/g, 'InsertObject (Commit)')
        .replace(/UploadId/g, 'UploadId')
        .replace(/ETag/g, 'MD5/CRC32C Hash')
        .replace(/Batch Operations/g, 'Storage Transfer Jobs')
        .replace(/batch-client/g, 'transfer-client')
        .replace(/Storage Lens/g, 'Storage Insights & Metrics')
        .replace(/EventBridge/g, 'Eventarc / Pub/Sub');
    }
    if (provider === 'azure') {
      return text
        .replace(/S3 Event Notifications/g, 'Event Grid')
        .replace(/S3 Event/g, 'Event Grid')
        .replace(/s3-ingest/g, 'blob-ingest')
        .replace(/s3-router/g, 'blob-router')
        .replace(/s3-replicator/g, 'blob-replicator')
        .replace(/s3-index/g, 'blob-index')
        .replace(/S3 Bucket Keys/g, 'Storage Encryption Keys')
        .replace(/S3 Bucket Key/g, 'Storage Encryption Key')
        .replace(/S3 bucket/g, 'blob container')
        .replace(/S3 Buckets/g, 'Blob Containers')
        .replace(/S3 objects/g, 'blobs')
        .replace(/S3 object/g, 'blob')
        .replace(/S3/g, 'Blob Storage')
        .replace(/s3/g, 'blob')
        .replace(/Amazon Simple Storage Service/g, 'Azure Blob Storage')
        .replace(/Amazon S3/g, 'Azure Blob Storage')
        .replace(/Bucket Policy/g, 'Container SAS Policy')
        .replace(/Bucket Policies/g, 'Container SAS Policies')
        .replace(/bucket policy/g, 'container SAS policy')
        .replace(/bucket policies/g, 'container SAS policies')
        .replace(/Bucket/g, 'Blob Container')
        .replace(/bucket/g, 'blob container')
        .replace(/Buckets/g, 'Blob Containers')
        .replace(/buckets/g, 'blob containers')
        .replace(/Object Lock/g, 'Immutable Storage')
        .replace(/Object/g, 'Blob')
        .replace(/object/g, 'blob')
        .replace(/Objects/g, 'Blobs')
        .replace(/objects/g, 'blobs')
        .replace(/IAM Policies/g, 'Azure RBAC')
        .replace(/IAM Policy/g, 'Azure RBAC')
        .replace(/IAM/g, 'Azure RBAC')
        .replace(/iam-evaluator/g, 'rbac-evaluator')
        .replace(/iam-engine/g, 'rbac-engine')
        .replace(/KMS/g, 'Key Vault')
        .replace(/kms/g, 'keyvault')
        .replace(/AWS Lambda/g, 'Azure Functions')
        .replace(/Lambda/g, 'Azure Functions')
        .replace(/lambda/g, 'azure-functions')
        .replace(/Amazon SQS Queue/g, 'Service Bus Queue')
        .replace(/SQS/g, 'Service Bus Queue')
        .replace(/Amazon SNS Topic/g, 'Event Grid Topic')
        .replace(/SNS/g, 'Event Grid Topic')
        .replace(/AZ-1/g, 'Zone-1')
        .replace(/AZ-2/g, 'Zone-2')
        .replace(/AZ-3/g, 'Zone-3')
        .replace(/AZ/g, 'Zone')
        .replace(/az/g, 'zone')
        .replace(/aws s3api/g, 'az storage')
        .replace(/aws s3/g, 'az storage')
        .replace(/aws/g, 'az')
        .replace(/AWS/g, 'Azure')
        .replace(/arn:aws:s3:::/g, 'https://mypremiumstorage.blob.core.windows.net/')
        .replace(/arn:aws:kms:[a-z0-9-]+:\d+:key\/[a-f0-9-]+/g, 'https://mykeyvault.vault.azure.net/keys/my-key')
        .replace(/arn:aws:s3/g, 'azure-blob')
        .replace(/ARN/g, 'Blob URL / Resource ID')
        .replace(/MFA Delete/g, 'Soft Delete Protection')
        .replace(/S3 Standard-IA/g, 'Cool Tier')
        .replace(/S3 Standard/g, 'Hot Tier')
        .replace(/Standard-IA/g, 'Cool Tier')
        .replace(/Glacier Instant Retrieval/g, 'Cool Tier')
        .replace(/Glacier Flexible Retrieval/g, 'Archive Tier')
        .replace(/Glacier Deep Archive/g, 'Archive Tier')
        .replace(/Glacier/g, 'Archive Tier')
        .replace(/glacier/g, 'archive')
        .replace(/Same Region Replication/g, 'Locally Redundant Storage')
        .replace(/Cross Region Replication/g, 'Geo-Redundant Storage')
        .replace(/CRR/g, 'GRS')
        .replace(/SRR/g, 'LRS')
        .replace(/SSE-S3/g, 'Service-Managed Encryption')
        .replace(/SSE-KMS/g, 'Customer-Managed Key (Key Vault)')
        .replace(/SSE-C/g, 'Customer-Provided Key')
        .replace(/DSSE-KMS/g, 'Dual-Layer Encryption')
        .replace(/Transfer Acceleration/g, 'Front Door CDN')
        .replace(/Multipart Upload/g, 'Block Blob Upload')
        .replace(/multipart-client/g, 'blob-client')
        .replace(/InitiateMultipartUpload/g, 'PutBlockList (Init)')
        .replace(/CompleteMultipartUpload/g, 'PutBlockList (Commit)')
        .replace(/UploadId/g, 'BlockId')
        .replace(/ETag/g, 'MD5 Hash')
        .replace(/Batch Operations/g, 'Blob Storage Tasks')
        .replace(/batch-client/g, 'tasks-client')
        .replace(/Storage Lens/g, 'Blob Inventory & Metrics')
        .replace(/EventBridge/g, 'Event Grid');
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




  // Visual Architect Academy Notebook states
  const [selectedNote, setSelectedNote] = useState<string>('s3_namespace');
  const [expandedCategory, setExpandedCategory] = useState<string>('s3_fundamentals');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Interactive S3 Calculator states
  const [nbStorageGb, setNbStorageGb] = useState<number>(5000);
  const [nbGatewayEgressGb, setNbGatewayEgressGb] = useState<number>(2000);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedNoteId(id);
    setTimeout(() => {
      setCopiedNoteId(null);
    }, 2000);
  };

  const handleNavigateToDemo = (selectedProvider: 'aws' | 'azure' | 'gcp', targetTab: 'overview' | 'security' | 'encryption' | 'versioning' | 'storage' | 'networking' | 'transfer' | 'operations' | 'notebook') => {
    setProvider(selectedProvider);
    setActiveTab(targetTab);
  };

  // S3 Prefix Partitioning Calculator state variables
  const nbPrefixCount = 4;

  // TAB 1: BUCKET CONCEPTS STATE VARIABLES
  const [bucketType, setBucketType] = useState<'general' | 'directory'>('general');
  const [directoryAz, setDirectoryAz] = useState<'use1-az4' | 'use1-az6'>('use1-az4');
  const [bucketNameInput, setBucketNameInput] = useState<string>('my-premium-bucket');
  const [urlRegion, setUrlRegion] = useState<string>('us-east-1');
  const [urlKey, setUrlKey] = useState<string>('images/photo.jpg');
  
  const [corsOriginInput, setCorsOriginInput] = useState<string>('https://domain-a.com');
  const [corsMethodInput, setCorsMethodInput] = useState<string>('GET');
  const [corsLogs, setCorsLogs] = useState<Array<{ timestamp: string; type: 'info' | 'success' | 'warning' | 'error'; message: string }>>([
    { timestamp: new Date().toLocaleTimeString(), type: 'info', message: 'CORS preflight OPTIONS simulator ready.' }
  ]);
  const [corsAnimationState, setCorsAnimationState] = useState<'idle' | 'preflight' | 'authorized' | 'blocked'>('idle');

  const [replicateStep, setReplicateStep] = useState<number>(0);
  const [replicateIsRunning, setReplicateIsRunning] = useState<boolean>(false);
  const [replicateLogs, setReplicateLogs] = useState<string[]>([]);
  const [replicatePayload, setReplicatePayload] = useState<string>('ledger.pdf');

  const [consistencyMode, setConsistencyMode] = useState<'strong' | 'eventual'>('strong');
  const [consistencyReadStep, setConsistencyReadStep] = useState<number>(0);
  const [consistencyIsRunning, setConsistencyIsRunning] = useState<boolean>(false);
  const [consistencyLogs, setConsistencyLogs] = useState<string[]>([]);

  // TAB 6 & 7 ADVANCED CONCEPTS HOOKS
  const [apIdentity, setApIdentity] = useState<'finance_user' | 'sales_user' | 'auditor'>('finance_user');
  const [apEndpoint, setApEndpoint] = useState<'bucket_root' | 'finance_ap' | 'sales_ap'>('finance_ap');
  const [apAction, setApAction] = useState<'read_finance' | 'read_sales'>('read_finance');
  const [apResultLogs, setApResultLogs] = useState<string[]>([]);
  const [apAnimationState, setApAnimationState] = useState<'idle' | 'routing' | 'granted' | 'denied'>('idle');

  const [mpFileSize, setMpFileSize] = useState<number>(200);
  const [mpPartSize, setMpPartSize] = useState<number>(50);
  const [mpGlitch, setMpGlitch] = useState<boolean>(false);
  const [mpStep, setMpStep] = useState<number>(0);
  const [mpUploadId, setMpUploadId] = useState<string>('');
  const [mpIsRunning, setMpIsRunning] = useState<boolean>(false);
  const [mpLogs, setMpLogs] = useState<string[]>([]);
  const [mpParts, setMpParts] = useState<Array<{ id: number; status: 'idle' | 'uploading' | 'completed' | 'failed'; progress: number }>>([]);

  // TAB 2: SECURITY STATE & LIVE EDITOR
  const [selectedPolicyTemplate, setSelectedPolicyTemplate] = useState<'public' | 'https' | 'vpce'>('public');
  const [bucketPolicyText, setBucketPolicyText] = useState<string>(cloudProviders.aws.policyTemplates.public);
  const [policyValidationError, setPolicyValidationError] = useState<string | null>(null);

  const [ingressTrafficSource, setIngressTrafficSource] = useState<'internet' | 'https_user' | 'http_user' | 'vpce_ip'>('internet');
  const [ingressPacketStatus, setIngressPacketStatus] = useState<'idle' | 'testing' | 'allowed' | 'blocked'>('idle');
  const [ingressExplanation, setIngressExplanation] = useState('');
  const [policyEvaluationLogs, setPolicyEvaluationLogs] = useState<string[]>([]);
  const [bpaAcls, setBpaAcls] = useState(false);
  const [bpaPolicies, setBpaPolicies] = useState(false);

  // Sync templates to policy text area
  useEffect(() => {
    const activeProv = provider !== 'comparative' ? provider : 'aws';
    setBucketPolicyText(cloudProviders[activeProv].policyTemplates[selectedPolicyTemplate]);
    setPolicyValidationError(null);
  }, [selectedPolicyTemplate, provider]);

  // TAB 3: ENCRYPTION STATE & CUSTOM KEYS
  const [encryptionType, setEncryptionType] = useState<'sse-s3' | 'sse-kms' | 'sse-c' | 'dsse-kms'>('sse-s3');
  const [customKmsArn, setCustomKmsArn] = useState('arn:aws:kms:us-east-1:123456789012:key/3c5b9e0b-8d1a-4c2f-89bc-de1a38fa928b');
  const [customSsecKey, setCustomSsecKey] = useState('MzI4OWE5MmVkOGExYjQyZjg5YmM4ZGFmMTlhM2I4ZmE=');
  const [uploadContent, setUploadContent] = useState('My Highly Confidential Enterprise Ledger.csv');
  const [encryptionStep, setEncryptionStep] = useState(0);
  const [encryptionLogs, setEncryptionLogs] = useState<string[]>([]);

  const [plaintextKeyHex, setPlaintextKeyHex] = useState<string | null>(null);
  const [encryptedKeyHex, setEncryptedKeyHex] = useState<string | null>(null);

  // TAB 4: VERSIONING STATE, ROLES & TIME SIMULATION
  const [versionStack, setVersionStack] = useState<Array<{ id: string; version: number; time: string; size: string; active: boolean; isDeleteMarker?: boolean }>>([
    { id: 'L92K8A1B', version: 1, time: '2026-05-25 12:00:00', size: '2.4 MB', active: true }
  ]);
  const [mfaDelete, setMfaDelete] = useState(false);
  const [mfaPrompt, setMfaPrompt] = useState(false);
  const [mfaTokenInput, setMfaTokenInput] = useState('');
  const [objectLockMode, setObjectLockMode] = useState<'none' | 'governance' | 'compliance'>('none');
  const [objectLockRetentionDays, setObjectLockRetentionDays] = useState(5);
  const [legalHold, setLegalHold] = useState(false);
  const [objectLockedUntil, setObjectLockedUntil] = useState<string | null>(null);

  const [simulatedTimeOffsetDays, setSimulatedTimeOffsetDays] = useState(0);
  const [wormIdentity, setWormIdentity] = useState<'operator' | 'secops'>('operator');
  const [bypassGovernance, setBypassGovernance] = useState(false);
  const [wormAuditLogs, setWormAuditLogs] = useState<string[]>([]);

  // Calculate simulated locks based on date offset
  useEffect(() => {
    if (objectLockMode !== 'none') {
      const lockUntilDate = new Date();
      lockUntilDate.setDate(lockUntilDate.getDate() + objectLockRetentionDays - simulatedTimeOffsetDays);

      if (simulatedTimeOffsetDays >= objectLockRetentionDays) {
        setObjectLockedUntil('EXPIRED (Timer reached zero)');
      } else {
        setObjectLockedUntil(lockUntilDate.toISOString().replace('T', ' ').substring(0, 19));
      }
    } else {
      setObjectLockedUntil(null);
    }
  }, [objectLockMode, objectLockRetentionDays, simulatedTimeOffsetDays]);

  // TAB 5: LIFECYCLE & STORAGE STATE
  const [lifecycleIa, setLifecycleIa] = useState(90);
  const [lifecycleGlacier, setLifecycleGlacier] = useState(180);
  const [lifecycleExpiration, setLifecycleExpiration] = useState(365);
  const [lifecycleVolume, setLifecycleVolume] = useState(500); // GB
  const [lifecycleRunState, setLifecycleRunState] = useState<'idle' | 'running' | 'finished'>('idle');
  const [lifecycleDaysPassed, setLifecycleDaysPassed] = useState(0);
  const [lifecycleCurrentClass, setLifecycleCurrentClass] = useState('Standard');
  const [lifecycleCostSaved, setLifecycleCostSaved] = useState(0);

  // TAB 7 & 8: INTERACTIVE DIAGRAM MODES
  const [transferRouteMode, setTransferRouteMode] = useState<'standard' | 'accelerated'>('accelerated');
  const [eventRoutingMode, setEventRoutingMode] = useState<'direct' | 'eventbridge'>('eventbridge');

  // TAB 7: TRANSFER ACCELERATION SIMULATOR
  const [transferStep, setTransferStep] = useState(0);
  const [transferIsRunning, setTransferIsRunning] = useState(false);
  const [transferLogs, setTransferLogs] = useState<string[]>([]);
  const transferTerminalRef = useRef<HTMLDivElement>(null);

  // TAB 8: EVENT NOTIFICATIONS SIMULATOR
  const [eventStep, setEventStep] = useState(0);
  const [eventIsRunning, setEventIsRunning] = useState(false);
  const [eventLogs, setEventLogs] = useState<string[]>([]);
  const [simulatedObjectKey, setSimulatedObjectKey] = useState('uploads/image.png');
  const [simulatedObjectSize, setSimulatedObjectSize] = useState(12.5); // MB
  const eventTerminalRef = useRef<HTMLDivElement>(null);

  // TAB 8: BATCH OPERATIONS SIMULATOR
  const [batchStep, setBatchStep] = useState(0);
  const [batchIsRunning, setBatchIsRunning] = useState(false);
  const [batchLogs, setBatchLogs] = useState<string[]>([]);
  const [batchTotalObjects, setBatchTotalObjects] = useState(124500);
  const [batchProgressPercentage, setBatchProgressPercentage] = useState(0);
  const batchTerminalRef = useRef<HTMLDivElement>(null);

  // Refs for console terminals
  const encryptionTerminalRef = useRef<HTMLDivElement>(null);
  const policyTerminalRef = useRef<HTMLDivElement>(null);
  const wormTerminalRef = useRef<HTMLDivElement>(null);
  const replicateTerminalRef = useRef<HTMLDivElement>(null);
  const consistencyTerminalRef = useRef<HTMLDivElement>(null);
  const corsTerminalRef = useRef<HTMLDivElement>(null);
  const apTerminalRef = useRef<HTMLDivElement>(null);
  const mpTerminalRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminals
  useEffect(() => {
    if (encryptionTerminalRef.current) encryptionTerminalRef.current.scrollTop = encryptionTerminalRef.current.scrollHeight;
  }, [encryptionLogs]);

  useEffect(() => {
    if (policyTerminalRef.current) policyTerminalRef.current.scrollTop = policyTerminalRef.current.scrollHeight;
  }, [policyEvaluationLogs]);

  useEffect(() => {
    if (wormTerminalRef.current) wormTerminalRef.current.scrollTop = wormTerminalRef.current.scrollHeight;
  }, [wormAuditLogs]);

  useEffect(() => {
    if (transferTerminalRef.current) transferTerminalRef.current.scrollTop = transferTerminalRef.current.scrollHeight;
  }, [transferLogs]);

  useEffect(() => {
    if (eventTerminalRef.current) eventTerminalRef.current.scrollTop = eventTerminalRef.current.scrollHeight;
  }, [eventLogs]);

  useEffect(() => {
    if (batchTerminalRef.current) batchTerminalRef.current.scrollTop = batchTerminalRef.current.scrollHeight;
  }, [batchLogs]);

  useEffect(() => {
    if (replicateTerminalRef.current) replicateTerminalRef.current.scrollTop = replicateTerminalRef.current.scrollHeight;
  }, [replicateLogs]);

  useEffect(() => {
    if (consistencyTerminalRef.current) consistencyTerminalRef.current.scrollTop = consistencyTerminalRef.current.scrollHeight;
  }, [consistencyLogs]);

  useEffect(() => {
    if (corsTerminalRef.current) corsTerminalRef.current.scrollTop = corsTerminalRef.current.scrollHeight;
  }, [corsLogs]);

  useEffect(() => {
    if (apTerminalRef.current) apTerminalRef.current.scrollTop = apTerminalRef.current.scrollHeight;
  }, [apResultLogs]);

  useEffect(() => {
    if (mpTerminalRef.current) mpTerminalRef.current.scrollTop = mpTerminalRef.current.scrollHeight;
  }, [mpLogs]);

  // Tab 6: Interactive S3 Access Points Scoped Gateway Handler
  const handleAccessPointRoute = () => {
    if (apAnimationState !== 'idle') return;
    setApAnimationState('routing');
    setApResultLogs([
      `[access-point-gateway] Intercepting request: Caller=${apIdentity === 'finance_user' ? 'Finance Team IAM User' : apIdentity === 'sales_user' ? 'Sales Team IAM User' : 'External Regulatory Auditor'}` ,
      `[access-point-gateway] Connection entrypoint endpoint: ${apEndpoint === 'bucket_root' ? 'arn:aws:s3:::my-premium-bucket' : apEndpoint === 'finance_ap' ? 'arn:aws:s3:us-east-1:123456789012:accesspoint/finance-ap' : 'arn:aws:s3:us-east-1:123456789012:accesspoint/sales-ap'}`,
      `[access-point-gateway] Inbound Action: s3:GetObject, Target Resource Path: "${apAction === 'read_finance' ? 'finance/ledger.xlsx' : 'sales/contracts.pdf'}"`,
      `[access-point-gateway] Evaluating endpoint policy mapping rules...`
    ]);

    setTimeout(() => {
      if (apEndpoint === 'bucket_root') {
        setApAnimationState('denied');
        setApResultLogs(prev => [
          ...prev,
          `[iam-engine] ❌ ACCESS BLOCKED AT MAIN BUCKET GATE!`,
          `[iam-engine] Security best-practice enforcement: Direct bucket root entrypoints are disabled for standard users.`,
          `[iam-engine] Caller must route requests via their designated team-scoped Access Point.`,
          `❌ [verdict] Access Denied: Direct root channel requires s3:ListBucket & wildcard GET on bucket root. (HTTP 403)`
        ]);
      } else if (apEndpoint === 'finance_ap') {
        const pathMatch = apAction === 'read_finance';
        const identityMatch = apIdentity === 'finance_user' || apIdentity === 'auditor';

        if (identityMatch && pathMatch) {
          setApAnimationState('granted');
          setApResultLogs(prev => [
            ...prev,
            `[finance-ap-evaluator] ✅ Access Point endpoint matched context correctly.`,
            `[finance-ap-evaluator] Policy check: Identity is whitelisted in AP IAM resource policy.`,
            `[finance-ap-evaluator] Prefix constraint check: Target path "finance/*" matches AP path scope perfectly.`,
            `[finance-ap-evaluator] Forwarding request to S3 storage hypervisors...`,
            `✅ [verdict] Authorized: GET 200 OK. Scoped Access Point successfully completed direct folder handshake.`
          ]);
        } else {
          setApAnimationState('denied');
          setApResultLogs(prev => [
            ...prev,
            `[finance-ap-evaluator] ❌ PERMISSION OR PATH MISMATCH!`,
            !identityMatch 
              ? `[finance-ap-evaluator] Security mismatch: Caller identity is not whitelisted to access finance-ap.` 
              : `[finance-ap-evaluator] Target path mismatch: finance-ap is strictly locked to Prefix "finance/*". Path "${apAction === 'read_sales' ? 'sales/contracts.pdf' : ''}" is out of bounds!`,
            `❌ [verdict] Access Denied: Endpoint policy blocked cross-tenant request. (HTTP 403)`
          ]);
        }
      } else if (apEndpoint === 'sales_ap') {
        const pathMatch = apAction === 'read_sales';
        const identityMatch = apIdentity === 'sales_user' || apIdentity === 'auditor';

        if (identityMatch && pathMatch) {
          setApAnimationState('granted');
          setApResultLogs(prev => [
            ...prev,
            `[sales-ap-evaluator] ✅ Access Point endpoint matched context correctly.`,
            `[sales-ap-evaluator] Policy check: Identity is whitelisted in AP IAM resource policy.`,
            `[sales-ap-evaluator] Prefix constraint check: Target path "sales/*" matches AP path scope perfectly.`,
            `[sales-ap-evaluator] Forwarding request to S3 storage hypervisors...`,
            `✅ [verdict] Authorized: GET 200 OK. Scoped Access Point successfully completed direct folder handshake.`
          ]);
        } else {
          setApAnimationState('denied');
          setApResultLogs(prev => [
            ...prev,
            `[sales-ap-evaluator] ❌ PERMISSION OR PATH MISMATCH!`,
            !identityMatch 
              ? `[sales-ap-evaluator] Security mismatch: Caller identity is not whitelisted to access sales-ap.` 
              : `[sales-ap-evaluator] Target path mismatch: sales-ap is strictly locked to Prefix "sales/*". Path "${apAction === 'read_finance' ? 'finance/ledger.xlsx' : ''}" is out of bounds!`,
            `❌ [verdict] Access Denied: Endpoint policy blocked cross-tenant request. (HTTP 403)`
          ]);
        }
      }
    }, 1600);
  };

  // Tab 7: High-Throughput Multipart Upload Simulator Handlers
  const handleMultipartUpload = () => {
    if (mpIsRunning) return;
    setMpIsRunning(true);
    setMpStep(1);
    const newUploadId = Math.random().toString(36).substring(2, 10).toUpperCase();
    setMpUploadId(newUploadId);
    setMpLogs([
      `[multipart-client] Initializing S3 Multipart Upload sequence: file_size=${mpFileSize} MB...`,
      `[multipart-client] Slicing file payload into uniform parts: Part Size=${mpPartSize} MB.`,
      `[multipart-client] Dispatching InitiateMultipartUpload API request to S3 bucket...`
    ]);

    setTimeout(() => {
      setMpStep(2);
      setMpLogs(prev => [
        ...prev,
        `[s3-server] Handshake established. Created active upload session partition.`,
        `[s3-server] Assigned session ID: UploadId="${newUploadId}"`,
        `[multipart-client] Preparing concurrent thread pools to upload chunks in parallel...`
      ]);
    }, 1200);

    setTimeout(() => {
      setMpStep(3);
      const totalPartsCount = Math.ceil(mpFileSize / mpPartSize);
      const initialPartsList = Array.from({ length: totalPartsCount }, (_, i) => ({
        id: i + 1,
        status: 'uploading' as const,
        progress: 0
      }));
      setMpParts(initialPartsList);
      setMpLogs(prev => [
        ...prev,
        `[multipart-client] 🚀 Dispatching ${totalPartsCount} parallel threads to transmit chunk bytes...`,
        `[workers] Part 1 to Part ${totalPartsCount} upload streams initiated concurrently.`
      ]);

      let currentTick = 0;
      const progressInterval = setInterval(() => {
        currentTick += 1;
        setMpParts(prevParts => {
          let hasGlitchTriggered = false;
          const nextParts = prevParts.map(part => {
            if (part.status === 'completed' || part.status === 'failed') return part;

            if (mpGlitch && (part.id === 3 || part.id === 2) && currentTick === 5) {
              hasGlitchTriggered = true;
              return { ...part, status: 'failed' as const, progress: 45 };
            }

            const nextProgress = part.progress + Math.floor(Math.random() * 20 + 20);
            if (nextProgress >= 100) {
              return { ...part, status: 'completed' as const, progress: 100 };
            }
            return { ...part, progress: nextProgress };
          });

          if (hasGlitchTriggered) {
            clearInterval(progressInterval);
            setMpStep(4);
            setMpIsRunning(false);
            setMpLogs(l => [
              ...l,
              `[workers] ❌ THREAD FAULT DETECTED: Network jitter triggered packet drop on [Part 3]!`,
              `[workers] Part 3 upload stream aborted (HTTP 502 Gateway Timeout).`,
              `[multipart-client] Parallel ingest paused. Partial segments successfully stored in temporary S3 allocation.`,
              `💡 [tip] Don't panic! Click "Retry Failed Parts" to demonstrate S3's efficient single-chunk re-upload saving bandwidth.`
            ]);
          }

          return nextParts;
        });

        setMpParts(latestParts => {
          const allDone = latestParts.every(p => p.status === 'completed');
          if (allDone && latestParts.length > 0) {
            clearInterval(progressInterval);
            triggerMultipartCompletion(newUploadId, latestParts.length);
          }
          return latestParts;
        });
      }, 400);
    }, 2500);
  };

  const retryFailedMultipart = () => {
    if (mpIsRunning) return;
    setMpIsRunning(true);
    setMpStep(3);
    setMpLogs(prev => [
      ...prev,
      `[multipart-client] Resuming Upload Session: UploadId="${mpUploadId}"`,
      `[multipart-client] 🔄 Target re-upload triggered ONLY for failed or missing chunk streams...`,
      `[workers] Spawning recovery thread pool...`
    ]);

    setMpParts(prevParts => {
      return prevParts.map(part => {
        if (part.status === 'failed') {
          return { ...part, status: 'uploading' as const, progress: 0 };
        }
        return part;
      });
    });

    setTimeout(() => {
      const progressInterval = setInterval(() => {
        setMpParts(prevParts => {
          return prevParts.map(part => {
            if (part.status !== 'uploading') return part;

            const nextProgress = part.progress + Math.floor(Math.random() * 30 + 30);
            if (nextProgress >= 100) {
              return { ...part, status: 'completed' as const, progress: 100 };
            }
            return { ...part, progress: nextProgress };
          });
        });

        setMpParts(latestParts => {
          const allDone = latestParts.every(p => p.status === 'completed');
          if (allDone && latestParts.length > 0) {
            clearInterval(progressInterval);
            triggerMultipartCompletion(mpUploadId, latestParts.length);
          }
          return latestParts;
        });
      }, 400);
    }, 1200);
  };

  const triggerMultipartCompletion = (uploadId: string, count: number) => {
    setMpStep(5);
    setMpIsRunning(false);
    const mockETag = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    setMpLogs(prev => [
      ...prev,
      `[multipart-client] All ${count} chunk uploads completed successfully.`,
      `[multipart-client] Dispatching CompleteMultipartUpload API request to S3 (UploadId: "${uploadId}")...`,
      `[s3-server] Consolidated ${count} chunk segments. Reassembling physical blocks on storage partitions...`,
      `[s3-server] Parity validation successful. Computed global object ETag hash: "${mockETag}-${count}"`,
      `✅ [verdict] Multipart upload transaction SUCCESS! Object stored at rest. (HTTP 200)`
    ]);
  };

  // Tab 1: CORS Preflight Handler
  const handleCorsPreflight = () => {
    if (corsAnimationState !== 'idle') return;
    
    setCorsAnimationState('preflight');
    setCorsLogs([
      { timestamp: new Date().toLocaleTimeString(), type: 'info', message: `OPTIONS preflight request initiated: Origin=${corsOriginInput}, Method=${corsMethodInput}` },
      { timestamp: new Date().toLocaleTimeString(), type: 'info', message: `Checking S3 CORS whitelists for target bucket: ${bucketNameInput}.s3.amazonaws.com` }
    ]);

    setTimeout(() => {
      const originMatch = corsOriginInput === 'https://domain-a.com';
      const methodMatch = corsMethodInput === 'GET' || corsMethodInput === 'PUT' || corsMethodInput === 'HEAD';
      
      if (originMatch && methodMatch) {
        setCorsAnimationState('authorized');
        setCorsLogs(prev => [
          ...prev,
          { timestamp: new Date().toLocaleTimeString(), type: 'success', message: `OPTIONS SUCCESS: Origin '${corsOriginInput}' is whitelisted. Method '${corsMethodInput}' is whitelisted.` },
          { timestamp: new Date().toLocaleTimeString(), type: 'success', message: `Browser CORS preflight passed (200 OK). Initializing actual ${corsMethodInput} data transfer.` }
        ]);
      } else {
        setCorsAnimationState('blocked');
        setCorsLogs(prev => [
          ...prev,
          { 
            timestamp: new Date().toLocaleTimeString(), 
            type: 'error', 
            message: `CORS BLOCK: Origin '${corsOriginInput}' or Method '${corsMethodInput}' is NOT whitelisted.` 
          },
          { timestamp: new Date().toLocaleTimeString(), type: 'error', message: `OPTIONS Preflight Failed: Browser blocks actual ${corsMethodInput} cross-origin request (403 Forbidden).` }
        ]);
      }
    }, 1500);
  };

  // Tab 1: S3 AZ Active Replication Ingestion Simulator
  const handleReplicationSimulation = () => {
    if (replicateIsRunning) return;
    setReplicateIsRunning(true);
    setReplicateStep(1);
    setReplicateLogs([
      `[s3-ingest] PUT request received for object key: "${urlKey}"`,
      `[s3-ingest] Payload size validation: ${(replicatePayload === 'ledger.pdf' ? '12.4 MB' : '45.1 MB')} - OK`,
      `[s3-ingest] Allocating distributed block mapping table...`
    ]);

    setTimeout(() => {
      setReplicateStep(2);
      setReplicateLogs(prev => [
        ...prev,
        `[s3-router] Ingest Gateway splits object payload into immutable chunk parity blocks.`,
        `[s3-router] Resolving target datacenter routes within Region: ${urlRegion}...`,
        `[s3-router] Dispatching parallel write tasks to 3 isolated Availability Zones...`
      ]);
    }, 1200);

    setTimeout(() => {
      setReplicateStep(3);
      setReplicateLogs(prev => [
        ...prev,
        `[s3-replicator] ⚡ AZ-1 (datacenter: ${urlRegion}a) physical sector commit SUCCESS! [Bytes written]`,
        `[s3-replicator] ⚡ AZ-2 (datacenter: ${urlRegion}b) physical sector commit SUCCESS! [Bytes written]`,
        `[s3-replicator] ⚡ AZ-3 (datacenter: ${urlRegion}c) physical sector commit SUCCESS! [Bytes written]`,
        `[s3-replicator] Replicating parity data blocks for automatic disaster recovery isolation.`
      ]);
    }, 2500);

    setTimeout(() => {
      setReplicateStep(4);
      setReplicateLogs(prev => [
        ...prev,
        `[s3-replicator] Parallel datacenter commits confirmed. MD5 checksum validated successfully.`,
        `✅ [verdict] PUT 200 OK. Object successfully stored at rest with guaranteed 99.999999999% (11 9s) durability SLA.`
      ]);
      setReplicateIsRunning(false);
    }, 3800);
  };

  // Tab 1: S3 Strong vs Eventual Read Consistency Simulator
  const handleConsistencySimulation = () => {
    if (consistencyIsRunning) return;
    setConsistencyIsRunning(true);
    setConsistencyReadStep(1);
    setConsistencyLogs([
      `[writer] Triggering PUT request to update key "${urlKey}" to [Version 2.0]`,
      `[s3-index] Locking database catalog metadata row...`,
      `[s3-index] Committing atomic version mapping...`
    ]);

    setTimeout(() => {
      setConsistencyReadStep(2);
      setConsistencyLogs(prev => [
        ...prev,
        `[writer] PUT [Version 2.0] success returned: 200 OK.`,
        `[reader] Immediate GET request issued for key "${urlKey}" exactly 1ms later...`
      ]);
    }, 1200);

    setTimeout(() => {
      setConsistencyReadStep(3);
      if (consistencyMode === 'strong') {
        setConsistencyLogs(prev => [
          ...prev,
          `[s3-index] Guaranteed read safety constraint active: Read-After-Write Atomic Lock check.`,
          `[s3-index] Reading primary index block. Found atomic update commit.`,
          `✅ [reader] Success! GET returned [Version 2.0] immediately. Read-after-write consistency guaranteed. (HTTP 200)`
        ]);
      } else {
        setConsistencyLogs(prev => [
          ...prev,
          `[s3-index] Eventual consistency model active: Asynchronous mirroring propagation delay.`,
          `[s3-index] Mirror node ${urlRegion}a-mirror-3 has not resolved database updates yet.`,
          `⚠️ [reader] STALE READ! GET returned legacy [Version 1.0]. Propagation sync pending. (HTTP 200)`
        ]);
      }
      setConsistencyIsRunning(false);
    }, 2800);
  };

  // Tab 2: Policy Ingress Simulator with Live JSON Evaluation
  const testPolicyIngress = () => {
    setIngressPacketStatus('testing');
    setPolicyEvaluationLogs([
      `[iam-evaluator] 📡 Packet intercepted from source: ${ingressTrafficSource === 'internet'
        ? 'Public Internet (Unsecured HTTP)'
        : ingressTrafficSource === 'https_user'
          ? 'Secure Web Client (HTTPS/TLS)'
          : ingressTrafficSource === 'http_user'
            ? 'Web Client (HTTP - No Security)'
            : 'VPC Gateway Endpoint (vpce-0d8fa928bcde1a38)'
      }`,
      `[iam-evaluator] 🔍 Initiating structural JSON policy parse & compilation...`
    ]);
    setIngressExplanation('S3 Gatekeeper is compiling JSON structures and running threat checks...');

    setTimeout(() => {
      // 1. JSON parsing and structure validation
      let parsedPolicy: any = null;
      try {
        parsedPolicy = JSON.parse(bucketPolicyText);
        setPolicyValidationError(null);
      } catch (err: any) {
        setPolicyValidationError(err.message);
        setPolicyEvaluationLogs(l => [
          ...l,
          `[iam-evaluator] ❌ CRITICAL PARSE FAILURE!`,
          `[iam-evaluator] SyntaxError: ${err.message}`,
          `[iam-evaluator] Evaluation aborted. Policy syntax invalid!`,
          `❌ [verdict] Access Denied: S3 discarded corrupted policy block. (HTTP 403)`
        ]);
        setIngressPacketStatus('blocked');
        setIngressExplanation(`BLOCKED! Your bucket policy contains invalid JSON syntax: "${err.message}". S3 throws a 403 Forbidden on parsing failures.`);
        return;
      }

      setPolicyEvaluationLogs(l => [...l, `[iam-evaluator] ✅ JSON parsed successfully. Commencing policy condition checks...`]);

      setTimeout(() => {
        // Evaluate BPA Override gates
        setPolicyEvaluationLogs(l => [...l, `[gate-1-bpa] Checking S3 Block Public Access (BPA) master overrides...`]);

        setTimeout(() => {
          const statements = Array.isArray(parsedPolicy?.Statement)
            ? parsedPolicy.Statement
            : (parsedPolicy?.Statement ? [parsedPolicy.Statement] : []);

          // Check if there is any statement with Principal: * and Effect: Allow (Public Policy)
          const hasPublicAllow = statements.some((stmt: any) =>
            stmt?.Effect === 'Allow' &&
            (stmt?.Principal === '*' || (stmt?.Principal?.AWS === '*'))
          );

          if (hasPublicAllow && bpaPolicies) {
            setPolicyEvaluationLogs(l => [
              ...l,
              `[gate-1-bpa] ⚠️ BPA CRITICAL BLOCK: "BlockPublicPolicy" master override is enabled!`,
              `[gate-1-bpa] Wildcard policy Principal: "*" matches public block signatures.`,
              `❌ [verdict] Access Denied: Packet discarded by Block Public Access override. (HTTP 403)`
            ]);
            setIngressPacketStatus('blocked');
            setIngressExplanation('BLOCKED! S3 Block Public Access is active. The wildcard policy statement Principal: "*" has been overridden and discarded by Gate 1.');
            return;
          }

          setPolicyEvaluationLogs(l => [...l, `[gate-1-bpa] BPA master gate cleared. Moving to resource statement evaluation...`]);

          setTimeout(() => {
            // Check for Explicit Denies
            let explicitDenyTriggered = false;
            let denyReason = '';

            statements.forEach((stmt: any) => {
              if (stmt?.Effect === 'Deny') {
                // Check Enforce SSL
                if (stmt?.Condition?.Bool?.['aws:SecureTransport'] === 'false') {
                  if (ingressTrafficSource !== 'https_user') {
                    explicitDenyTriggered = true;
                    denyReason = `Explicit Deny Statement "${stmt?.Sid || 'SSLOnly'}" matched: "aws:SecureTransport": "false" is TRUE for this unsecured connection.`;
                  }
                }
                // Check VPC Endpoint restriction
                if (stmt?.Condition?.StringNotEquals?.['aws:sourceVpce'] === 'vpce-0d8fa928bcde1a38') {
                  if (ingressTrafficSource !== 'vpce_ip') {
                    explicitDenyTriggered = true;
                    denyReason = `Explicit Deny Statement "${stmt?.Sid || 'VpcOnly'}" matched: Connection source is not vpce-0d8fa928bcde1a38.`;
                  }
                }
              }
            });

            if (explicitDenyTriggered) {
              setPolicyEvaluationLogs(l => [
                ...l,
                `[gate-2-deny] ⚠️ EXPLICIT DENY TRIGGERED!`,
                `[gate-2-deny] ${denyReason}`,
                `❌ [verdict] Access Denied: Explicit Deny takes absolute precedence in S3 security loops. (HTTP 403)`
              ]);
              setIngressPacketStatus('blocked');
              setIngressExplanation(`BLOCKED! An explicit Deny statement matched your inbound source. Deny statements immediately overwrite all allows.`);
              return;
            }

            setPolicyEvaluationLogs(l => [...l, `[gate-2-deny] No matching Deny conditions found. Checking Allow policies...`]);

            setTimeout(() => {
              // Check for Allow Statements
              let isAllowed = false;
              let allowStatementSid = '';

              statements.forEach((stmt: any) => {
                if (stmt?.Effect === 'Allow') {
                  if (stmt?.Principal === '*' || stmt?.Principal?.AWS === '*') {
                    isAllowed = true;
                    allowStatementSid = stmt?.Sid || 'PublicRead';
                  } else if (ingressTrafficSource === 'vpce_ip' && stmt?.Resource) {
                    isAllowed = true;
                    allowStatementSid = stmt?.Sid || 'VpceAllow';
                  }
                }
              });

              // Also if the policy restricts to VPCE and we bypassed Deny, we still need standard allowance
              if (selectedPolicyTemplate === 'https' && ingressTrafficSource === 'https_user') {
                isAllowed = true;
                allowStatementSid = 'EnforceSSLRequestsOnly (Allow Bypassed Deny)';
              }

              if (isAllowed) {
                setPolicyEvaluationLogs(l => [
                  ...l,
                  `[gate-3-allow] Match found in Allow Statement: SID "${allowStatementSid}"`,
                  `[gate-3-allow] Inbound Action s3:GetObject matches resource ARN rules.`,
                  `✅ [verdict] Authorized: Connection successful! Access granted. (HTTP 200)`
                ]);
                setIngressPacketStatus('allowed');
                setIngressExplanation(`ALLOWED! Your request bypassed all deny gates and matched the active Allow statement policies.`);
              } else {
                setPolicyEvaluationLogs(l => [
                  ...l,
                  `[gate-3-allow] ❌ Access Denied: No matching Allow statement found.`,
                  `[gate-3-allow] S3 default is implicit deny for all resource actions.`,
                  `❌ [verdict] Access Denied: Missing explicit Allow policy in the evaluation table. (HTTP 403)`
                ]);
                setIngressPacketStatus('blocked');
                setIngressExplanation('BLOCKED! S3 has a default implicit deny policy. If no explicit Allow rules match the connection criteria, access is blocked.');
              }
            }, 600);
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  // Tab 3: SSE Envelope Simulator with custom key checks and RAM scrubbing animations
  const testEncryption = () => {
    setEncryptionStep(1);
    setPlaintextKeyHex(null);
    setEncryptedKeyHex(null);
    setEncryptionLogs([
      `[s3-client] Dispatching WriteObject request: file_name=payload.dat, bytes=${(uploadContent.length * 8).toString()} bits...`,
      `[s3-client] Payload Preview: "${uploadContent}"`
    ]);

    // Validation for SSE-C Client Base64 Key
    if (encryptionType === 'sse-c') {
      if (customSsecKey.length !== 44 || !customSsecKey.endsWith('=')) {
        setTimeout(() => {
          setEncryptionLogs(l => [
            ...l,
            `[s3-client] ❌ SECURE WRITE ERROR: Invalid customer SSE-C AES key provided!`,
            `[s3-client] Key validation failed. Raw key must be a valid 256-bit Base64 payload (44 characters, ending with =).`,
            `❌ [system] Write failed. Encrypt-at-rest aborted due to insecure custom parameters.`
          ]);
          setEncryptionStep(0);
        }, 800);
        return;
      }
    }

    // Step 2: KMS / S3 key routing checks
    setTimeout(() => {
      setEncryptionStep(2);
      if (encryptionType === 'sse-s3') {
        setEncryptionLogs(l => [
          ...l,
          `[s3-service] Intercepted WriteObject header. Initializing SSE-S3 standard envelope...`,
          `[s3-service] Routing request to standard master storage key.`
        ]);
      } else if (encryptionType === 'sse-kms') {
        setEncryptionLogs(l => [
          ...l,
          `[s3-service] Intercepted WriteObject header. Initializing SSE-KMS envelope...`,
          `[s3-service] Dispatching GenerateDataKey request to KMS. Target CMK: "${customKmsArn}"`
        ]);
      } else if (encryptionType === 'sse-c') {
        setEncryptionLogs(l => [
          ...l,
          `[s3-service] Intercepted WriteObject header. Initializing SSE-C direct customer cipher...`,
          `[s3-service] Handshaking with secure headers. Loaded client AES Base64 key: "${customSsecKey.substring(0, 16)}..."`
        ]);
      } else if (encryptionType === 'dsse-kms') {
        setEncryptionLogs(l => [
          ...l,
          `[s3-service] Intercepted WriteObject header. Initializing DSSE-KMS double envelope...`,
          `[s3-service] Dispatching 2x GenerateDataKey requests to KMS. CMK A: "${customKmsArn.substring(0, 42)}...", CMK B: "${customKmsArn.substring(0, 42)}...-9b8a"`
        ]);
      }
    }, 1000);

    // Step 3: Key Generation (Generating plaintext & ciphertext hex)
    setTimeout(() => {
      setEncryptionStep(3);

      const plainHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
      const encHex = Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();

      if (encryptionType === 'sse-s3') {
        setPlaintextKeyHex(plainHex);
        setEncryptedKeyHex(encHex);
        setEncryptionLogs(l => [
          ...l,
          `[s3-service] S3 auto-generates unique key vectors.`,
          `[s3-service] Generated Plaintext Data Key: "${plainHex}"`,
          `[s3-service] Generated Encrypted Data Key: "${encHex}"`
        ]);
      } else if (encryptionType === 'sse-kms') {
        setPlaintextKeyHex(plainHex);
        setEncryptedKeyHex(encHex);
        setEncryptionLogs(l => [
          ...l,
          `[kms-service] Authorizing kms:GenerateDataKey request under CMK...`,
          `[kms-service] Generated Plaintext Data Key: "${plainHex}"`,
          `[kms-service] Generated Ciphertext Data Key: "${encHex}"`,
          `[kms-service] Generating secure Audit Trail log in AWS CloudTrail.`
        ]);
      } else if (encryptionType === 'sse-c') {
        // SSE-C generates key derivations locally
        const localDerivationHex = 'SSEC-DERIVED-' + plainHex.substring(0, 16);
        setPlaintextKeyHex(customSsecKey.substring(0, 16).toUpperCase() + '...');
        setEncryptedKeyHex(localDerivationHex);
        setEncryptionLogs(l => [
          ...l,
          `[s3-service] Validated customer-provided raw key headers in hypervisor bus.`,
          `[s3-service] Derived active transient AES key: "${localDerivationHex}"`
        ]);
      } else if (encryptionType === 'dsse-kms') {
        const plainHexB = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
        const encHexB = Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();
        setPlaintextKeyHex(`Key A: ${plainHex.substring(0, 8)}... | Key B: ${plainHexB.substring(0, 8)}...`);
        setEncryptedKeyHex(`Cipher A: ${encHex.substring(0, 8)}... | Cipher B: ${encHexB.substring(0, 8)}...`);
        setEncryptionLogs(l => [
          ...l,
          `[kms-service] Authorizing double kms:GenerateDataKey requests...`,
          `[kms-service] Generated Data Key A: Plaintext="${plainHex.substring(0, 12)}...", Ciphertext="${encHex.substring(0, 12)}..."`,
          `[kms-service] Generated Data Key B: Plaintext="${plainHexB.substring(0, 12)}...", Ciphertext="${encHexB.substring(0, 12)}..."`,
          `[kms-service] Generated dual CloudTrail audit trails (kms:GenerateDataKey calls logged).`
        ]);
      }
    }, 2200);

    // Step 4: Encrypting in Memory & scrubbing plaintext key from RAM
    setTimeout(() => {
      setEncryptionStep(4);
      if (encryptionType === 'dsse-kms') {
        setEncryptionLogs(l => [
          ...l,
          `[hypervisor-memory] Initializing DSSE-KMS dual block cipher pipelines...`,
          `[hypervisor-memory] executing Layer 1 Encryption: cipher payload under Plaintext Data Key A (AES-256)...`,
          `[hypervisor-memory] executing Layer 2 Encryption: encrypt resulting block under Plaintext Data Key B (AES-256)...`,
          `[hypervisor-memory] Double-layer encryption complete! Immutable ciphertext structure established.`,
          `[hypervisor-memory] ⚠️ TWIN RAM WIPE ENGAGED: Scrubbing both Plaintext Keys A & B from hypervisor active memory buffers.`
        ]);
      } else {
        setEncryptionLogs(l => [
          ...l,
          `[hypervisor-memory] Initializing AES-256 symmetric block cipher...`,
          `[hypervisor-memory] Plaintext string payload successfully encrypted into ciphertext blocks.`,
          `[hypervisor-memory] ⚠️ RAM SHREDDING TRIGGERED: Scrubbing plaintext encryption keys from hypervisor RAM blocks for absolute host isolation.`
        ]);
      }
      // Shred Plaintext key from state!
      setPlaintextKeyHex(null);
    }, 3800);

    // Step 5: Disk storing
    setTimeout(() => {
      setEncryptionStep(5);

      const cipherTextMock = 'CIPHER-' + Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('').toUpperCase();

      if (encryptionType === 'sse-c') {
        setEncryptionLogs(l => [
          ...l,
          `[s3-storage] Writing encrypted blocks ("${cipherTextMock}") to physical disk arrays.`,
          `[s3-storage] S3 drops customer plaintext key from active processor registers entirely.`,
          `✅ [system] Write complete! Payload secure. S3 retains NO keys. You must provide the exact same key to read this file.`
        ]);
      } else if (encryptionType === 'dsse-kms') {
        setEncryptionLogs(l => [
          ...l,
          `[s3-storage] Writing dual-encrypted blocks ("DUAL-${cipherTextMock}") to physical disk storage racks.`,
          `[s3-storage] Appending both Ciphertext Data Key A and Ciphertext Data Key B metadata to S3 partition headers.`,
          `✅ [system] Write complete! Dual-layer envelope security successfully committed to disk at rest.`
        ]);
      } else {
        setEncryptionLogs(l => [
          ...l,
          `[s3-storage] Writing encrypted blocks ("${cipherTextMock}") to physical disk arrays.`,
          `[s3-storage] Appending Encrypted Data Key header metadata to storage sectors.`,
          `✅ [system] Write complete! Payload successfully encrypted and stored securely at rest.`
        ]);
      }
    }, 5000);
  };

  // Tab 4: Versioning Helpers
  const addVersion = () => {
    const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // Check lock state
    let targetLockUntil = null;
    if (objectLockMode !== 'none') {
      const lockUntilDate = new Date();
      lockUntilDate.setDate(lockUntilDate.getDate() + objectLockRetentionDays - simulatedTimeOffsetDays);
      targetLockUntil = lockUntilDate.toISOString().replace('T', ' ').substring(0, 19);
      setObjectLockedUntil(targetLockUntil);
    }

    setVersionStack(stack => {
      const deactivated = stack.map(v => ({ ...v, active: false }));
      return [
        {
          id: randomId,
          version: stack.length + 1,
          time: now,
          size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
          active: true
        },
        ...deactivated
      ];
    });

    setWormAuditLogs(l => [
      ...l,
      `[s3-audit] 📄 PutObject complete. Created new active version ID: "${randomId}".`,
      objectLockMode !== 'none' ? `[s3-audit] 🔒 Applied WORM lock: Mode=${objectLockMode.toUpperCase()}, Expires=${targetLockUntil}` : `[s3-audit] Standard un-locked version created.`
    ]);
  };

  // Upgraded Delete Object click with compliance auditor log traces
  const triggerDeleteObject = () => {
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setWormAuditLogs(l => [
      ...l,
      `[s3-gatekeeper] 🛡️ Intercepted DeleteObject request for bucket "my-premium-bucket/file.pdf"...`,
      `[s3-gatekeeper] Simulated caller profile: ${wormIdentity === 'secops' ? 'SecOps Administrator' : 'Standard Operator'}`,
      `[s3-gatekeeper] Initiating WORM compliance validations...`
    ]);

    // Check Legal Hold
    if (legalHold) {
      setTimeout(() => {
        setWormAuditLogs(l => [
          ...l,
          `[s3-gatekeeper] ❌ SECURITY LOCK BREACH DETECTED: Active Legal Hold is set!`,
          `[s3-gatekeeper] S3 rejects request. Legal Holds override all credentials, including AWS Root accounts.`,
          `❌ [verdict] Access Denied: Permanent lock active. (HTTP 403)`
        ]);
        alert('ACCESS DENIED: Active Legal Hold is set on this bucket. Objects are permanently read-only and cannot be deleted!');
      }, 500);
      return;
    }

    // Check Compliance Lock
    const isLockExpired = simulatedTimeOffsetDays >= objectLockRetentionDays;
    if (objectLockMode === 'compliance') {
      if (!isLockExpired) {
        setTimeout(() => {
          setWormAuditLogs(l => [
            ...l,
            `[s3-gatekeeper] ❌ COMPLIANCE WORM BREACH DETECTED: Active Compliance Lock scheduled until offset days expire!`,
            `[s3-gatekeeper] Compliance Lock rejects deletions for ALL operators (Root Account included).`,
            `❌ [verdict] Access Denied: WORM Retention timer is currently active. (HTTP 403)`
          ]);
          alert('ACCESS DENIED: Compliance Lock Active! Retention period has not expired. S3 completely rejects deletes for all principals, including root.');
        }, 500);
        return;
      } else {
        setWormAuditLogs(l => [...l, `[s3-gatekeeper] ✅ Compliance lock check: Timer expired! proceeding to next security gate...`]);
      }
    }

    // Check Governance Lock
    if (objectLockMode === 'governance') {
      if (!isLockExpired) {
        if (wormIdentity === 'secops' && bypassGovernance) {
          setWormAuditLogs(l => [
            ...l,
            `[s3-gatekeeper] ⚠️ Governance Lock active, but header "s3:BypassGovernanceRetention" is present!`,
            `[s3-gatekeeper] Caller identity possesses s3:BypassGovernanceRetention permissions in this context.`,
            `[s3-gatekeeper] ✅ Governance Lock successfully bypassed!`
          ]);
        } else {
          setTimeout(() => {
            setWormAuditLogs(l => [
              ...l,
              `[s3-gatekeeper] ❌ GOVERNANCE BLOCK: Deletion blocked for normal credentials.`,
              `[s3-gatekeeper] Standard operators require s3:BypassGovernanceRetention permissions to proceed.`,
              `❌ [verdict] Access Denied: Governance Lock active and bypass permissions missing. (HTTP 403)`
            ]);
            alert('Access Denied. Governance lock prevents delete. Set identity to SecOps and check "Bypass Retention" to proceed.');
          }, 500);
          return;
        }
      } else {
        setWormAuditLogs(l => [...l, `[s3-gatekeeper] ✅ Governance lock check: Timer expired! proceeding...`]);
      }
    }

    // Check MFA delete verification check
    if (mfaDelete) {
      setTimeout(() => {
        setWormAuditLogs(l => [
          ...l,
          `[s3-gatekeeper] 🔑 MFA delete condition required: Awaiting physical TOTP passcode entry...`
        ]);
        setMfaPrompt(true);
      }, 400);
      return;
    }

    // Execute standard logical delete
    setTimeout(() => {
      setVersionStack(stack => {
        const deactivated = stack.map(v => ({ ...v, active: false }));
        return [
          {
            id: 'DEL-MARKER',
            version: stack.length + 1,
            time: now,
            size: '-',
            active: true,
            isDeleteMarker: true
          },
          ...deactivated
        ];
      });
      setWormAuditLogs(l => [
        ...l,
        `[s3-gatekeeper] Deletion authorized. Creating logical Delete Marker in stack...`,
        `✅ [verdict] Object logically deleted. Delete Marker added at top of version stack.`
      ]);
    }, 600);
  };

  const submitMfaDelete = () => {
    if (mfaTokenInput === '654321') {
      setMfaPrompt(false);
      setMfaTokenInput('');

      // Permanently remove the top version
      setVersionStack(stack => {
        if (stack.length === 0) return stack;
        const newStack = stack.slice(1);
        if (newStack.length > 0) newStack[0].active = true;
        return newStack;
      });

      setWormAuditLogs(l => [
        ...l,
        `[s3-gatekeeper] ✅ MFA token verified successfully!`,
        `[s3-gatekeeper] Deleting historical version bytes permanently from hard disks.`,
        `✅ [verdict] Object version permanently destroyed. Bytes purged.`
      ]);
      alert('MFA Token Verified! Historical version permanently deleted.');
    } else {
      setWormAuditLogs(l => [
        ...l,
        `[s3-gatekeeper] ❌ MFA token token rejected (Invalid passcode: ${mfaTokenInput}).`,
        `❌ [verdict] Access Denied: MFA validation failed.`
      ]);
      alert('INVALID MFA CODE. Permanent delete aborted!');
    }
  };

  const restoreFromDeleteMarker = () => {
    setVersionStack(stack => {
      if (stack[0]?.isDeleteMarker) {
        const restored = stack.slice(1);
        if (restored.length > 0) restored[0].active = true;
        return restored;
      }
      return stack;
    });
    setWormAuditLogs(l => [
      ...l,
      `[s3-gatekeeper] Delete marker manually restored. Object restored to active listing.`
    ]);
  };

  // Tab 5 Lifecycle Clock Helpers
  const startLifecycleSimulation = () => {
    setLifecycleRunState('running');
    setLifecycleDaysPassed(0);
    const activeProv = provider !== 'comparative' ? provider : 'aws';
    setLifecycleCurrentClass(cloudProviders[activeProv].storageClasses.standard.name);
    setLifecycleCostSaved(0);
  };

  useEffect(() => {
    if (lifecycleRunState !== 'running') return;

    const activeProv = provider !== 'comparative' ? provider : 'aws';
    const classes = cloudProviders[activeProv].storageClasses;
    const classNameStandard = classes.standard.name;
    const classNameIa = classes.ia.name;
    const classNameGlacier = classes.glacier_deep.name;

    const costStandard = classes.standard.storageCost;
    const costIa = classes.ia.storageCost;
    const costGlacier = classes.glacier_deep.storageCost;

    const interval = setInterval(() => {
      setLifecycleDaysPassed(days => {
        const nextDay = days + 5;

        // Storage Class transitions based on sliders
        let currentClass = classNameStandard;
        if (nextDay >= lifecycleGlacier) {
          currentClass = classNameGlacier;
        } else if (nextDay >= lifecycleIa) {
          currentClass = classNameIa;
        }

        setLifecycleCurrentClass(currentClass);

        // Calculate Cost Savings
        const standardCost = lifecycleVolume * costStandard;
        let activeCost = standardCost;
        if (currentClass === classNameIa) activeCost = lifecycleVolume * costIa;
        if (currentClass === classNameGlacier) activeCost = lifecycleVolume * costGlacier;

        const accumulatedSavings = (standardCost - activeCost) * (nextDay / 30);
        setLifecycleCostSaved(parseFloat(accumulatedSavings.toFixed(2)));

        if (nextDay >= lifecycleExpiration) {
          setLifecycleRunState('finished');
          setLifecycleCurrentClass('Expired / Deleted');
          clearInterval(interval);
          return lifecycleExpiration;
        }

        return nextDay;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [lifecycleRunState, lifecycleIa, lifecycleGlacier, lifecycleExpiration, lifecycleVolume, provider]);

  // TAB 7: S3 Transfer Acceleration Simulation Handler
  const startTransferSimulation = () => {
    if (transferIsRunning) return;
    setTransferIsRunning(true);
    setTransferStep(1);
    setTransferLogs([
      `[client-init] Preparing data transmission payload: file_name=big_dataset.tar, size=1.2 GB...`,
      `[client-init] Resolving host routing paths...`
    ]);

    if (transferRouteMode === 'standard') {
      setTimeout(() => {
        setTransferStep(2);
        setTransferLogs(l => [
          ...l,
          `[route-hop] 🌐 Packet dispatched onto public BGP routing tables.`,
          `[route-hop] Hop 1: Local ISP (AS7922 Comcast Chicago) ➔ Latency: 12ms`,
          `[route-hop] Hop 2: Regional Transit Exchange (Equinix Ashburn) ➔ Latency: 32ms`
        ]);
      }, 1000);

      setTimeout(() => {
        setTransferStep(3);
        setTransferLogs(l => [
          ...l,
          `[trans-pacific] 🌊 Packet traversing public trans-pacific undersea cables.`,
          `[trans-pacific] Hop 5: public transit backbone router (San Jose AS2914 NTT) ➔ Latency: 120ms`,
          `[trans-pacific] Hop 8: public sea-cable carrier (AS4608 Honolulu) ➔ Latency: 340ms`,
          `[trans-pacific] Hop 12: Pacific crossing node (AS4826 Sydney) ➔ Latency: 740ms (High jitter/packet drop rate: 1.8%)`
        ]);
      }, 2500);

      setTimeout(() => {
        setTransferStep(4);
        setTransferLogs(l => [
          ...l,
          `[destination] Reached S3 Sydney public endpoint: s3.ap-southeast-2.amazonaws.com`,
          `[destination] S3 assembly of multi-part chunks complete. Integrity MD5 validated.`,
          `❌ [summary] Upload completed in 8.2 seconds. Average Latency: 820ms. Ingestion Speed: ~146 MB/s (highly throttled by public hop congestion)`
        ]);
        setTransferIsRunning(false);
      }, 4000);

    } else {
      setTimeout(() => {
        setTransferStep(2);
        setTransferLogs(l => [
          ...l,
          `[edge-ingest] 🚀 Packet redirected to local CloudFront Edge location POP: s3-accelerate.amazonaws.com`,
          `[edge-ingest] Ingested at nearest USA edge node (Chicago CloudFront POP) ➔ Latency: 4.2ms`,
          `[edge-ingest] TCP handshake terminated locally at Edge. Multipart chunk slicing initiated immediately.`
        ]);
      }, 1000);

      setTimeout(() => {
        setTransferStep(3);
        setTransferLogs(l => [
          ...l,
          `[aws-backbone] ⚡ Chunks shifted onto private AWS dark-fiber optic global backbone.`,
          `[aws-backbone] USA Backbone ➔ Seattle Fiber Node ➔ Undersea Private Trans-pacific High-speed Optic Channels ➔ Sydney AWS Exchange Node.`,
          `[aws-backbone] Congestion-free routing, zero public internet peerings, active packet deduplication ➔ Latency: 182ms (Stable, 0% Packet Loss)`
        ]);
      }, 2500);

      setTimeout(() => {
        setTransferStep(4);
        setTransferLogs(l => [
          ...l,
          `[destination] Direct arrival at internal target bucket: my-accelerated-bucket.s3.ap-southeast-2.amazonaws.com`,
          `[destination] Multi-part chunk commits to Sydney NVMe array partition complete.`,
          `✅ [summary] Upload completed in 1.9 seconds! Average Latency: 190ms. Ingestion Speed: ~631 MB/s. SPEEDUP FACTOR: 326% FAST! ⚡`
        ]);
        setTransferIsRunning(false);
      }, 4000);
    }
  };

  // TAB 8: S3 Event Notifications Simulation Handler
  const startEventSimulation = () => {
    if (eventIsRunning) return;
    setEventIsRunning(true);
    setEventStep(1);
    setEventLogs([
      `[s3-bucket] PutObject trigger intercepted: key="${simulatedObjectKey}", size=${simulatedObjectSize} MB...`,
      `[s3-bucket] Generating standard JSON event notification payload: "s3:ObjectCreated:Put"...`
    ]);

    if (eventRoutingMode === 'direct') {
      setTimeout(() => {
        setEventStep(2);
        setEventLogs(l => [
          ...l,
          `[permissions-gate] 🔒 Initiating direct target permission handshake...`,
          `[permissions-gate] Evaluating target Access Policy for IAM authorization.`,
          `[permissions-gate] Target resource ARN: "arn:aws:sqs:us-east-1:123456789012:my-event-queue"`,
          `[permissions-gate] Verification rule check: Does SQS Resource Access Policy grant "sqs:SendMessage" to "s3.amazonaws.com" source?`
        ]);
      }, 1000);

      setTimeout(() => {
        setEventStep(3);
        setEventLogs(l => [
          ...l,
          `[permissions-gate] ✅ IAM resource validation successful! Source bucket matches policy resource ARN constraint.`,
          `[filter-match] Applying direct S3 bucket filters: suffix matches ".png" or ".pdf"...`,
          `[filter-match] Object Key "${simulatedObjectKey}" matches configured suffix criteria. Filter passed.`
        ]);
      }, 2200);

      setTimeout(() => {
        setEventStep(4);
        setEventLogs(l => [
          ...l,
          `[delivery] Direct S3 event notification published successfully.`,
          `[delivery] Payload size: 1.2 KB. Dispatch time: 14ms.`,
          `✅ [verdict] Event committed to target SQS queue: HTTP 200 OK.`
        ]);
        setEventIsRunning(false);
      }, 3500);

    } else {
      setTimeout(() => {
        setEventStep(2);
        setEventLogs(l => [
          ...l,
          `[eventbridge-route] ⚙️ native EventBridge integration active. S3 publishes payload instantly to default Event Bus.`,
          `[eventbridge-route] Handshake complete: zero direct IAM target policies required.`,
          `[eventbridge-route] Event ingested into AWS EventBridge Router: eventID="e8f9a2b1-38fa-4c2a"`,
          `[eventbridge-route] Compiling advanced Event Pattern filter JSON rules...`
        ]);
      }, 1000);

      setTimeout(() => {
        const prefixMatch = simulatedObjectKey.startsWith('uploads/') ? 'MATCHED' : 'FAILED';
        const sizeMatch = simulatedObjectSize > 5 ? 'MATCHED (Size > 5MB)' : 'FAILED (Size <= 5MB)';
        setEventStep(3);
        setEventLogs(l => [
          ...l,
          `[filter-match] Running Advanced JSON Rule evaluation:`,
          `[filter-match] Rule 1: Prefix "uploads/" matches "${simulatedObjectKey}" ➔ ${prefixMatch}`,
          `[filter-match] Rule 2: Object size > 5,242,880 bytes matches ${simulatedObjectSize} MB ➔ ${sizeMatch}`,
          prefixMatch === 'MATCHED' && sizeMatch === 'MATCHED (Size > 5MB)'
            ? `[filter-match] ✅ ADVANCED MATCH SUCCESSFUL! Rule target routing triggers committed.`
            : `[filter-match] ❌ Advanced match rule failed conditions. Default routing fallback activated.`
        ]);
      }, 2200);

      setTimeout(() => {
        const prefixMatch = simulatedObjectKey.startsWith('uploads/');
        const sizeMatch = simulatedObjectSize > 5;
        if (prefixMatch && sizeMatch) {
          setEventLogs(l => [
            ...l,
            `[delivery] EventBridge router successfully dispatched trigger to:`,
            `[delivery] ➔ Target 1: AWS Step Functions state machine (Resize Workflow)`,
            `[delivery] ➔ Target 2: Amazon Kinesis stream (Analytics ingest)`,
            `[delivery] ➔ Target 3: Amazon ECS container task (Deep processing)`,
            `✅ [verdict] Multi-target fanout routing successfully coordinated over 18+ services!`
          ]);
        } else {
          setEventLogs(l => [
            ...l,
            `[delivery] Default fallback target triggered: logged event to CloudWatch Logs.`,
            `✅ [verdict] Fallback matching committed.`
          ]);
        }
        setEventIsRunning(false);
      }, 3500);
    }
  };

  // TAB 8: S3 Batch Operations Simulation Handler
  const startBatchSimulation = () => {
    if (batchIsRunning) return;
    setBatchIsRunning(true);
    setBatchStep(1);
    setBatchProgressPercentage(0);
    setBatchLogs([
      `[batch-init] Initiating bulk administrative job for ${batchTotalObjects.toLocaleString()} objects...`,
      `[batch-init] Phase 1: Requesting S3 Inventory Daily Report...`
    ]);

    setTimeout(() => {
      setBatchStep(2);
      setBatchLogs(l => [
        ...l,
        `[s3-inventory] ✅ S3 Inventory Daily Report catalog generated: size=12.8 MB (Gzipped CSV).`,
        `[athena-query] Amazon Athena serverless engine parsing S3 Inventory dataset...`,
        `[athena-query] SQL Executing: SELECT key, versionId FROM s3_inventory WHERE size_bytes > 50000000 AND key LIKE 'uploads/%'`,
        `[athena-query] SQL query completed in 1.2s. Scanned 12.8 MB daily records.`,
        `[athena-query] Exporting manifest CSV catalog containing matching rows...`
      ]);
    }, 1200);

    setTimeout(() => {
      setBatchStep(3);
      setBatchLogs(l => [
        ...l,
        `[batch-operator] ✅ Manifest CSV compiled successfully: manifest.csv (18,450 objects matched).`,
        `[batch-operator] Submitting Manifest and target operation to S3 Batch Operations controller.`,
        `[batch-operator] Selected Operation: Overwrite SSE headers (AES-256 to SSE-KMS with key rotation).`,
        `[batch-operator] S3 Batch controller spawning parallel cluster executor threads...`
      ]);
    }, 2500);

    setTimeout(() => {
      setBatchStep(4);
      let pct = 0;
      const interval = setInterval(() => {
        pct += 20;
        setBatchProgressPercentage(pct);
        const processed = Math.min(18450, Math.floor((pct / 100) * 18450));
        
        setBatchLogs(l => [
          ...l,
          `[workers] Distributed task progress: ${pct}% complete. Processed: ${processed.toLocaleString()} / 18,450. Speed: 3,250 objs/sec.`,
          pct === 20 ? `[workers] Thread-01 processing partition: uploads/financials/ (success: 3,690)` :
          pct === 40 ? `[workers] Thread-02 processing partition: uploads/archives/ (success: 7,380)` :
          pct === 60 ? `[workers] Thread-03 processing partition: uploads/assets/ (success: 11,070)` :
          pct === 80 ? `[workers] Thread-04 processing partition: uploads/images/ (success: 14,760, retrying 4 fails...)` :
          `[workers] Distributed batch merge complete. Thread pools shut down. All operations validated.`
        ]);

        if (pct >= 100) {
          clearInterval(interval);
          setBatchStep(5);
          setBatchLogs(l => [
            ...l,
            `[completion] Generating S3 Batch Job Execution Completion Report...`,
            `[completion] Report written to s3://my-audit-bucket/batch-reports/job-c8f9.csv`,
            `✅ [summary] Batch Job succeeded! Processed: 18,450 objects. Success Rate: 100% (18,446 succeeded, 4 retries resolved). Total duration: 3.4 seconds.`
          ]);
          setBatchIsRunning(false);
        }
      }, 600);
    }, 3800);
  };

  return (
    <div className={`s3-container s3-theme-${provider}`} style={{ fontSize: '13.5px' }}>
      <style>{`
        .s3-container {
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
          color: var(--color-text-primary, #1e293b);

          /* Theme Variables (Light mode default) */
          --s3-bg: rgba(255, 255, 255, 0.75);
          --s3-card-bg: rgba(255, 255, 255, 0.75);
          --s3-card-border: rgba(226, 232, 240, 0.8);
          --s3-card-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.03), 0 4px 6px -4px rgba(0, 0, 0, 0.03);
          
          --color-text-primary: #1e293b;
          --color-text-secondary: #475569;
          --color-text-tertiary: #64748b;
          --color-border-secondary: #cbd5e1;
          --color-border-tertiary: #e2e8f0;
          --color-background-primary: #ffffff;
          --color-background-secondary: #f8fafc;
          --color-background-tertiary: #f1f5f9;
          
          --s3-tab-bg: rgba(255, 255, 255, 0.6);
          --s3-tab-hover-bg: rgba(241, 245, 249, 0.8);
          
          --s3-btn-bg: rgba(255, 255, 255, 0.8);
          --s3-btn-hover-bg: #f8fafc;
          
          --s3-terminal-bg: #0a0d16;
          --s3-terminal-border: #1e293b;
          --s3-terminal-color: #34d399;
          
          --s3-svg-grid-line: #e2e8f0;
          --s3-svg-line-stroke: #cbd5e1;
          
          --s3-metric-card-bg: rgba(241, 245, 249, 0.3);
          --s3-metric-card-border: #cbd5e1;
          
          --color-red: #dc2626;
          --color-amber: #d97706;
          --color-green: #16a34a;
          --color-blue: #2563eb;
          --color-purple: #7c3aed;

          --s3-success-bg: #f0fdf4;
          --s3-success-border: #bbf7d0;
          --s3-success-text: #166534;
          --s3-success-text-bold: #14532d;
          --s3-error-bg: #fef2f2;
          --s3-error-border: #fecaca;
          --s3-error-text: #991b1b;
          --s3-error-text-bold: #7f1d1d;

          --s3-btn-active-bg: linear-gradient(135deg, #10b981 0%, #059669 100%);
          --s3-btn-active-border: #059669;

          /* Gradient stops - Light Mode */
          --s3-grad-client-start: #ffffff;
          --s3-grad-client-end: #f0f9ff;
          --s3-grad-engine-start: #ecfdf5;
          --s3-grad-engine-end: #d1fae5;
          --s3-grad-disk-start: #f8fafc;
          --s3-grad-disk-end: #f1f5f9;
          --s3-grad-kms-start: #f0fdfa;
          --s3-grad-kms-end: #e0f2fe;
          --s3-grad-hsm-start: #fffbeb;
          --s3-grad-hsm-end: #fef3c7;
          --s3-grad-purple-start: #ffffff;
          --s3-grad-purple-end: #faf5ff;
          --s3-grad-ssec-engine-start: #faf5ff;
          --s3-grad-ssec-engine-end: #f3e8ff;
          --s3-grad-dsse-engine-start: #fff7ed;
          --s3-grad-dsse-engine-end: #fed7aa;
          --s3-grad-orange-start: #fff7ed;
          --s3-grad-orange-end: #ffedd5;
        }

        .dark .s3-container {
          background: #020617 !important;
          color: #f8fafc !important;

          --s3-bg: #020617;
          --s3-card-bg: rgba(15, 23, 42, 0.75);
          --s3-card-border: rgba(51, 65, 85, 0.6);
          --s3-card-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          
          --color-text-primary: #f8fafc;
          --color-text-secondary: #94a3b8;
          --color-text-tertiary: #64748b;
          --color-border-secondary: rgba(51, 65, 85, 0.6);
          --color-border-tertiary: rgba(51, 65, 85, 0.6);
          --color-background-primary: #0f172a;
          --color-background-secondary: #0b0f19;
          --color-background-tertiary: #1e293b;
          
          --s3-tab-bg: rgba(15, 23, 42, 0.6);
          --s3-tab-hover-bg: rgba(30, 41, 59, 0.8);
          
          --s3-btn-bg: rgba(15, 23, 42, 0.8);
          --s3-btn-hover-bg: rgba(30, 41, 59, 0.8);
          
          --s3-terminal-bg: #020617;
          --s3-terminal-border: rgba(51, 65, 85, 0.6);
          --s3-terminal-color: #38bdf8;
          
          --s3-svg-grid-line: rgba(51, 65, 85, 0.5);
          --s3-svg-line-stroke: rgba(100, 116, 139, 0.5);
          
          --s3-metric-card-bg: rgba(15, 23, 42, 0.6);
          --s3-metric-card-border: rgba(51, 65, 85, 0.6);
          
          --color-red: #f87171;
          --color-amber: #fbbf24;
          --color-green: #4ade80;
          --color-blue: #60a5fa;
          --color-purple: #a78bfa;

          --s3-success-bg: rgba(22, 163, 74, 0.1);
          --s3-success-border: rgba(74, 222, 128, 0.2);
          --s3-success-text: #86efac;
          --s3-success-text-bold: #4ade80;
          --s3-error-bg: rgba(239, 68, 68, 0.1);
          --s3-error-border: rgba(248, 113, 113, 0.2);
          --s3-error-text: #fca5a5;
          --s3-error-text-bold: #f87171;

          --s3-btn-active-bg: linear-gradient(135deg, #059669 0%, #047857 100%);
          --s3-btn-active-border: #047857;

          /* Gradient stops - Dark Mode */
          --s3-grad-client-start: rgba(15, 23, 42, 0.85);
          --s3-grad-client-end: rgba(37, 99, 235, 0.15);
          --s3-grad-engine-start: rgba(15, 23, 42, 0.85);
          --s3-grad-engine-end: rgba(22, 163, 74, 0.15);
          --s3-grad-disk-start: rgba(15, 23, 42, 0.85);
          --s3-grad-disk-end: rgba(71, 85, 105, 0.15);
          --s3-grad-kms-start: rgba(15, 23, 42, 0.85);
          --s3-grad-kms-end: rgba(14, 165, 233, 0.15);
          --s3-grad-hsm-start: rgba(15, 23, 42, 0.85);
          --s3-grad-hsm-end: rgba(217, 119, 6, 0.15);
          --s3-grad-purple-start: rgba(15, 23, 42, 0.85);
          --s3-grad-purple-end: rgba(124, 58, 237, 0.15);
          --s3-grad-ssec-engine-start: rgba(15, 23, 42, 0.85);
          --s3-grad-ssec-engine-end: rgba(168, 85, 247, 0.15);
          --s3-grad-dsse-engine-start: rgba(15, 23, 42, 0.85);
          --s3-grad-dsse-engine-end: rgba(234, 88, 12, 0.15);
          --s3-grad-orange-start: rgba(15, 23, 42, 0.85);
          --s3-grad-orange-end: rgba(249, 115, 22, 0.15);
        }

        /* Glowing Pipeline Animations */
        @keyframes s3Flow {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        .s3-flow-blue { stroke: var(--color-blue); stroke-dasharray: 6,4; animation: s3Flow 1.2s linear infinite; stroke-width: 2.5px; filter: drop-shadow(0 0 3px rgba(59, 130, 246, 0.4)); }
        .s3-flow-orange { stroke: var(--color-amber); stroke-dasharray: 6,4; animation: s3Flow 1.2s linear infinite; stroke-width: 2.5px; filter: drop-shadow(0 0 3px rgba(249, 115, 22, 0.4)); }
        .s3-flow-green { stroke: var(--color-green); stroke-dasharray: 6,4; animation: s3Flow 1.2s linear infinite; stroke-width: 2.5px; filter: drop-shadow(0 0 3px rgba(34, 197, 94, 0.4)); }
        .s3-flow-purple { stroke: var(--color-purple); stroke-dasharray: 6,4; animation: s3Flow 1.2s linear infinite; stroke-width: 2.5px; filter: drop-shadow(0 0 3px rgba(168, 85, 247, 0.4)); }
        .s3-flow-red { stroke: var(--color-red); stroke-dasharray: 6,4; animation: s3Flow 1.2s linear infinite; stroke-width: 2.5px; filter: drop-shadow(0 0 3px rgba(239, 68, 68, 0.4)); }
        .s3-pulse-active { animation: s3Pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes s3Pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.98); }
        }
        .s3-node-btn { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .s3-node-btn:hover { filter: brightness(0.96) drop-shadow(0 4px 12px rgba(148, 163, 184, 0.15)); }

        .s3-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-tertiary); padding-bottom: 10px; }
        .s3-tb { padding: 8px 16px; border-radius: var(--border-radius-lg, 12px); border: 1.5px solid var(--color-border-secondary); font-size: 12px; cursor: pointer; background: var(--s3-tab-bg); color: var(--color-text-secondary); transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); outline: none; font-weight: 500; }
        .s3-tb:hover { background: var(--s3-tab-hover-bg); color: var(--color-text-primary); transform: translateY(-1px); }
        
        .s3-tb.s3-on { background: var(--s3-btn-active-bg); color: #fff; border-color: var(--s3-btn-active-border); font-weight: 600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); }
        .s3-tb.s3-on-notebook { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); border-color: #0284c7; }
        .s3-tb.s3-on-overview { background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-color: #059669; }
        .s3-tb.s3-on-security { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-color: #d97706; }
        .s3-tb.s3-on-encryption { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); border-color: #7c3aed; }
        .s3-tb.s3-on-versioning { background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); border-color: #db2777; }
        .s3-tb.s3-on-storage { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-color: #2563eb; }
        .s3-tb.s3-on-networking { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); border-color: #0891b2; }
        .s3-tb.s3-on-transfer { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); border-color: #ea580c; }
        .s3-tb.s3-on-operations { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); border-color: #4f46e5; }
        .s3-tb.s3-on-unique { background: linear-gradient(135deg, #10b981 0%, #047857 100%); border-color: #047857; }

        
        .s3-card { border: 1.5px solid var(--s3-card-border); border-radius: var(--border-radius-lg, 12px); padding: 18px 20px; background: var(--s3-card-bg); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); box-shadow: var(--s3-card-shadow), inset 0 1px 0 0 rgba(255, 255, 255, 0.1); margin-bottom: 16px; font-size: 13px; line-height: 1.55; color: var(--color-text-primary); }
        .s3-sec { font-size: 12.5px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .05em; margin: 20px 0 10px; }
        .s3-sec:first-child { margin-top: 0; }
        .s3-g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .s3-g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .s3-kv { display: flex; gap: 8px; font-size: 13px; margin: 6px 0; align-items: baseline; }
        .s3-kk { min-width: 160px; color: var(--color-text-secondary); flex-shrink: 0; font-weight: 500; }
        .s3-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
        
        .s3-btn { font-size: 12.5px; padding: 6px 14px; border-radius: 8px; border: 1.5px solid var(--color-border-secondary); background: var(--s3-btn-bg); color: var(--color-text-primary); cursor: pointer; transition: all 0.2s; outline: none; font-weight: 500; }
        .s3-btn:hover:not(:disabled) { background: var(--s3-btn-hover-bg); border-color: var(--color-border-secondary); transform: translateY(-1px); }
        .s3-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .s3-btn.s3-on { background: var(--s3-btn-active-bg); color: #fff; border-color: var(--s3-btn-active-border); box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
        
        .s3-terminal { background: var(--s3-terminal-bg); color: var(--s3-terminal-color); font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 11.5px; padding: 14px; border-radius: 10px; border: 1px solid var(--s3-terminal-border); box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.3); max-height: 200px; overflow-y: auto; white-space: pre-wrap; line-height: 1.5; }
        .s3-svg-bg { background-color: var(--s3-bg); background-image: radial-gradient(var(--s3-svg-grid-line) 1.2px, transparent 1.2px); background-size: 16px 16px; border-radius: 8px; border: 1.5px solid var(--s3-card-border); box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05); }
        
        .s3-edu-card-new { 
          background: var(--s3-card-bg); 
          border: 1.5px solid var(--s3-card-border); 
          border-top: 4px solid var(--theme-color, var(--color-green)); 
          padding: 16px 18px; 
          border-radius: 8px; 
          box-shadow: var(--s3-card-shadow);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .s3-edu-card-new:hover {
          transform: translateY(-2px);
          box-shadow: var(--s3-card-shadow);
        }
        
        .s3-pill-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 10px;
        }
        .s3-pill-why { background: #eff6ff; color: #1e40af; border: 0.5px solid #bfdbfe; }
        .s3-pill-how { background: #fffbeb; color: #92400e; border: 0.5px solid #fef3c7; }
        .s3-pill-benefits { background: #ecfdf5; color: #065f46; border: 0.5px solid #a7f3d0; }
        .dark .s3-pill-why { background: #1e3a8a; color: #93c5fd; border-color: #1e40af; }
        .dark .s3-pill-how { background: #78350f; color: #fde68a; border-color: #92400e; }
        .dark .s3-pill-benefits { background: #064e3b; color: #6ee7b7; border-color: #065f46; }
        
        .s3-hl-cyan { background: rgba(6, 182, 212, 0.15); color: #0891b2; padding: 1px 4px; border-radius: 4px; font-weight: 600; }
        .s3-hl-orange { background: rgba(245, 158, 11, 0.15); color: #d97706; padding: 1px 4px; border-radius: 4px; font-weight: 600; }
        .s3-hl-green { background: rgba(16, 185, 129, 0.15); color: #059669; padding: 1px 4px; border-radius: 4px; font-weight: 600; }
        .s3-hl-indigo { background: rgba(99, 102, 241, 0.15); color: #4f46e5; padding: 1px 4px; border-radius: 4px; font-weight: 600; }
        .s3-hl-purple { background: rgba(168, 85, 247, 0.15); color: #9333ea; padding: 1px 4px; border-radius: 4px; font-weight: 600; }
        .s3-hl-pink { background: rgba(236, 72, 153, 0.15); color: #db2777; padding: 1px 4px; border-radius: 4px; font-weight: 600; }
        
        .s3-desc-mute { color: var(--color-text-secondary); font-size: 11.5px; font-style: italic; opacity: 0.95; font-weight: normal; background: none; padding: 0; }
        
        .dark .s3-hl-cyan { background: rgba(6, 182, 212, 0.25); color: #22d3ee; }
        .dark .s3-hl-orange { background: rgba(245, 158, 11, 0.25); color: #fbbf24; }
        .dark .s3-hl-green { background: rgba(16, 185, 129, 0.25); color: #34d399; }
        .dark .s3-hl-indigo { background: rgba(99, 102, 241, 0.25); color: #818cf8; }
        .dark .s3-hl-purple { background: rgba(168, 85, 247, 0.25); color: #c084fc; }
        .dark .s3-hl-pink { background: rgba(236, 72, 153, 0.25); color: #f472b6; }

 
        /* Unified Dropdown Selection Visual Cues */
        .s3-container select {
          border: 1.5px solid var(--color-border-secondary) !important;
          border-radius: 8px;
          padding: 6px 12px;
          background: var(--s3-card-bg) !important;
          color: var(--color-text-primary) !important;
          font-weight: 500;
          outline: none;
          transition: all 0.2s;
          appearance: none;
          -webkit-appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") !important;
          background-repeat: no-repeat !important;
          background-position: right 8px center !important;
          background-size: 14px !important;
          padding-right: 30px !important;
        }
        .s3-container select:focus {
          border-color: var(--color-green) !important;
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15) !important;
        }
        .dark .s3-container select option {
          background-color: var(--color-background-primary);
          color: var(--color-text-primary);
        }
        .s3-container select.s3-highlight {
          border: 1.5px solid var(--color-amber) !important;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1) !important;
        }
        .s3-container select option {
          background: #ffffff !important;
          color: #1e293b !important;
        }
        .dark .s3-container select option {
          background: #0f172a !important;
          color: #f8fafc !important;
        }
        .s3-container input[type="text"] {
          border: 1.5px solid var(--color-border-secondary);
          border-radius: 8px;
          padding: 6px 10px;
          background: var(--s3-bg);
          color: var(--color-text-primary);
          outline: none;
          transition: all 0.2s;
        }
        .s3-container input[type="text"]:focus {
          border-color: var(--color-green);
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
        }
        .s3-container input[type="range"] {
          accent-color: var(--color-green);
          background: var(--color-border-secondary);
          height: 6px;
          border-radius: 3px;
        }
 
        .s3-container textarea {
          background: var(--s3-terminal-bg) !important;
          color: var(--s3-terminal-color) !important;
          font-family: 'JetBrains Mono', monospace !important;
          font-size: 11.5px !important;
          border: 1.5px solid var(--color-border-secondary) !important;
          border-radius: 8px !important;
          padding: 10px !important;
          width: 100% !important;
          outline: none !important;
          transition: all 0.2s !important;
        }
        .s3-container textarea:focus {
          border-color: var(--color-green);
          box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.15);
        }
 
        .s3-g-circle {
          stroke-dasharray: 251.2;
          stroke-dashoffset: 251.2;
          animation: draw 2s linear forwards infinite;
        }
 
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes pulse-red {
          from { box-shadow: 0 0 4px rgba(220, 38, 38, 0.2); background: var(--s3-error-bg); }
          to { box-shadow: 0 0 16px rgba(220, 38, 38, 0.55); background: var(--s3-error-bg); }
        }
 
        /* Premium Academy Directory Styles */
        .acad-dir-container {
          background: var(--s3-card-bg);
          border: 1px solid var(--s3-card-border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }
        .acad-dir-header {
          background: var(--color-background-tertiary);
          border-bottom: 1px solid var(--color-border-tertiary);
          color: var(--color-text-primary);
          padding: 14px 16px;
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
          background: var(--s3-metric-card-bg);
          border-bottom: 1px solid var(--s3-card-border);
          font-size: 10px;
          font-weight: 850;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          transition: all 0.2s ease;
          border-top: none;
          border-left: none;
          border-right: none;
          cursor: pointer;
        }
        .acad-dir-folder-btn:hover {
          background: var(--s3-tab-hover-bg);
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
          border-top: none;
          border-right: none;
          border-bottom: none;
          border-left: 3px solid transparent;
          background: var(--s3-card-bg);
          transition: all 0.15s ease;
          text-align: left;
          cursor: pointer;
        }
        .acad-dir-item-btn:hover {
          background: var(--s3-tab-hover-bg);
          color: var(--color-green);
          border-left-color: var(--color-border-secondary);
        }
        .acad-dir-item-btn.acad-active {
          background: var(--s3-success-bg);
          color: var(--s3-success-text-bold);
          border-left-color: var(--color-green);
          font-weight: 800;
        }
        .acad-detail-card {
          background: var(--s3-card-bg);
          border: 1px solid var(--s3-card-border);
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.06);
        }
        .acad-hero-badge {
          background: var(--s3-success-bg);
          border: 1.5px solid var(--s3-success-border);
          color: var(--s3-success-text-bold);
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
          background: var(--s3-metric-card-bg);
          border-left: 4px solid var(--color-green);
          border-radius: 12px;
          padding: 18px;
          font-size: 12px;
          line-height: 1.6;
          color: var(--color-text-secondary);
          font-weight: 600;
        }
        .acad-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--s3-card-border);
        }
        .acad-table th {
          background: var(--s3-metric-card-bg);
          color: var(--color-text-primary);
          font-weight: 800;
          padding: 12px 14px;
          border-bottom: 1.5px solid var(--s3-card-border);
          text-align: left;
        }
        .acad-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--s3-card-border);
          color: var(--color-text-secondary);
        }
        .acad-table tr:last-child td {
          border-bottom: none;
        }
        .acad-sim-diagram {
          background: var(--s3-card-bg);
          border: 1.5px solid var(--s3-card-border);
          border-radius: 16px;
          padding: 18px;
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.02);
          position: relative;
        }
        .acad-terminal {
          background: var(--s3-terminal-bg);
          border: 1px solid var(--s3-terminal-border);
          border-radius: 12px;
          padding: 14px;
          font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', Courier, monospace;
          color: var(--color-text-primary);
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
        }

        .acad-plain-english {
          background: rgba(16, 185, 129, 0.07);
          border-left: 4px solid #10b981;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 16px;
          font-size: 12.5px;
          line-height: 1.6;
          color: var(--color-text-primary);
          border-top: 1px solid var(--s3-card-border);
          border-right: 1px solid var(--s3-card-border);
          border-bottom: 1px solid var(--s3-card-border);
        }
        .dark .acad-plain-english {
          background: rgba(16, 185, 129, 0.15);
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
          border-left: 4px solid #ef4444;
          border-radius: 10px;
          padding: 14px 16px;
          margin: 16px 0;
          font-size: 11.5px;
          line-height: 1.55;
          color: var(--color-text-secondary);
          border-top: 1px solid var(--s3-card-border);
          border-right: 1px solid var(--s3-card-border);
          border-bottom: 1px solid var(--s3-card-border);
        }
        .dark .acad-gotcha-box {
          background: rgba(239, 68, 68, 0.12);
        }
        .s3-theme-azure {
          --theme-color: #0078D4;
          --s3-btn-active-bg: linear-gradient(135deg, #0078D4 0%, #005A9E 100%);
          --s3-btn-active-border: #005A9E;
          --s3-grad-orange-start: #eff6ff;
          --s3-grad-orange-end: #dbeafe;
          --color-amber: #0078D4;
        }
        .dark .s3-theme-azure {
          --s3-grad-orange-start: rgba(15, 23, 42, 0.85);
          --s3-grad-orange-end: rgba(0, 120, 212, 0.15);
          --color-amber: #60a5fa;
        }
        .s3-theme-gcp {
          --theme-color: #0F9D58;
          --s3-btn-active-bg: linear-gradient(135deg, #0F9D58 0%, #0B7A44 100%);
          --s3-btn-active-border: #0B7A44;
          --s3-grad-orange-start: #f0fdf4;
          --s3-grad-orange-end: #dcfce7;
          --color-amber: #0F9D58;
        }
        .dark .s3-theme-gcp {
          --s3-grad-orange-start: rgba(15, 23, 42, 0.85);
          --s3-grad-orange-end: rgba(15, 157, 88, 0.15);
          --color-amber: #4ade80;
        }
        .s3-theme-comparative {
          --theme-color: #7c3aed;
          --s3-btn-active-bg: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          --s3-btn-active-border: #6d28d9;
          --s3-grad-orange-start: #faf5ff;
          --s3-grad-orange-end: #f3e8ff;
          --color-amber: #7c3aed;
        }
        .dark .s3-theme-comparative {
          --s3-grad-orange-start: rgba(15, 23, 42, 0.85);
          --s3-grad-orange-end: rgba(124, 58, 237, 0.15);
          --color-amber: #a78bfa;
        }
        }
              `}</style>

      {/* Header */}
      <div style={{ padding: '14px 16px 4px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isComparative ? (
              <span>⚖️ Multi-Cloud Storage Comparison — AWS S3 vs Azure Blob vs GCS</span>
            ) : isAzure ? (
              <span>🛢️ Azure Blob Storage — Containers · Blobs · Versioning · Encryption · Lifecycles</span>
            ) : isGcp ? (
              <span>🗄️ Google Cloud Storage — Buckets · Objects · Versioning · Uniform Access · CMEK Keys</span>
            ) : (
              <span>🪣 AWS S3 — Simple Storage Service · Buckets · Versioning · Encryption · Lifecycles</span>
            )}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            {isComparative ? (
              <span>Side-by-side architectural mapping and simulation control comparison between AWS S3, Azure Blob, and Google Cloud Storage architectures.</span>
            ) : isAzure ? (
              <span>Fully durable, infinitely scalable blob storage models — configure container firewalls, track blob versions, simulate Key Vault encryption scopes, lifecycle tier transitions, and private network endpoints interactively.</span>
            ) : isGcp ? (
              <span>Fully durable, infinitely scalable GCS object storage models — configure uniform access bindings, track object generations, simulate CMEK envelope encryption, lifecycle transitions, and Private Google Access routing trace.</span>
            ) : (
              <span>Fully durable, infinitely scalable object storage models — configure bucket policies, track version stacks, simulate KMS envelope keys, lifecycle data transitions, and private Gateway Endpoints interactively.</span>
            )}
          </div>
        </div>

        {/* Tab Selection */}
        {!isComparative && (
          <div className="s3-tabs">
            <button className={`s3-tb ${activeTab === 'notebook' ? 's3-on s3-on-notebook' : ''}`} onClick={() => setActiveTab('notebook')}>📖 1. Visual Notes &amp; Theories</button>
            <button className={`s3-tb ${activeTab === 'overview' ? 's3-on s3-on-overview' : ''}`} onClick={() => setActiveTab('overview')}>🪣 2. Namespace &amp; CORS</button>
            <button className={`s3-tb ${activeTab === 'security' ? 's3-on s3-on-security' : ''}`} onClick={() => setActiveTab('security')}>🛡️ 3. Policies &amp; BPA</button>
            <button className={`s3-tb ${activeTab === 'encryption' ? 's3-on s3-on-encryption' : ''}`} onClick={() => setActiveTab('encryption')}>🔒 4. SSE &amp; KMS Keys</button>
            <button className={`s3-tb ${activeTab === 'versioning' ? 's3-on s3-on-versioning' : ''}`} onClick={() => setActiveTab('versioning')}>🔄 5. Versioning &amp; WORM</button>
            <button className={`s3-tb ${activeTab === 'storage' ? 's3-on s3-on-storage' : ''}`} onClick={() => setActiveTab('storage')}>📈 6. Classes &amp; Lifecycle</button>
            <button className={`s3-tb ${activeTab === 'networking' ? 's3-on s3-on-networking' : ''}`} onClick={() => setActiveTab('networking')}>🌐 7. Gateway Endpoints</button>
            <button className={`s3-tb ${activeTab === 'transfer' ? 's3-on s3-on-transfer' : ''}`} onClick={() => setActiveTab('transfer')}>⚡ 8. Replication &amp; Accel</button>
            <button className={`s3-tb ${activeTab === 'operations' ? 's3-on s3-on-operations' : ''}`} onClick={() => setActiveTab('operations')}>⚙️ 9. Batch &amp; Lens</button>
            <button className={`s3-tb ${activeTab === 'unique' ? 's3-on s3-on-unique' : ''}`} onClick={() => setActiveTab('unique')}>✨ Unique Features</button>
          </div>
        )}

        {isComparative && (
          <S3ComparativeView onNavigateToDemo={handleNavigateToDemo} />
        )}

                {/* VISUAL ARCHITECT NOTES (NOTEBOOK WORKWHEETS) */}
        {!isComparative && activeTab === 'notebook' && (
          <div className="space-y-6 animate-fadeIn text-left" style={{ marginTop: '16px', color: 'var(--color-text-primary)' }}>
            
            {/* Header Hero Card */}
            <div className="s3-card" style={{ marginBottom: '14px', borderLeft: '4px solid #10b981' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                    <BookOpen style={{ width: '20px', height: '20px', color: '#10b981' }} /> Amazon S3 Cloud Storage Notes &amp; Mental Models
                  </h2>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '6px', lineHeight: '1.45', marginBottom: 0 }}>
                    Simplified, beginner-friendly cloud object storage theories sorted progressively from flat key-value namespaces to tiered storage classes, Block Public Access, WORM Object Lock, Gateway VPC Endpoints, and Global Multi-Region Access Points.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className="acad-hero-badge" style={{ background: '#d1fae5', borderColor: '#6ee7b7', color: '#065f46' }}>🎓 Beginner to Pro</span>
                  <span className="acad-hero-badge" style={{ background: '#fef3c7', borderColor: '#fde68a', color: '#b45309' }}>💡 Everyday Mental Models</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Sidebar Category Explorer */}
              <div className="lg:col-span-3 space-y-4 text-left">
                <span className="text-[10px] font-black uppercase tracking-widest block pl-1 font-mono" style={{ color: 'var(--color-text-tertiary)' }}>Curriculum Directory:</span>
                
                <div className="acad-dir-container">
                  <div className="acad-dir-header">
                    <BookOpen className="w-4 h-4 text-emerald-500" />
                    <span>S3 Storage Modules</span>
                  </div>

                  {/* LEVEL 1: FUNDAMENTALS & STORAGE CLASSES */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 's3_fundamentals' ? '' : 's3_fundamentals')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                        🐣 Level 1 · Fundamentals &amp; Classes
                      </span>
                      {expandedCategory === 's3_fundamentals' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 's3_fundamentals' && (
                      <div className="py-1 font-semibold" style={{ background: 'var(--color-background-primary)', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                        <button 
                          onClick={() => setSelectedNote('s3_namespace')}
                          className={`acad-dir-item-btn ${selectedNote === 's3_namespace' ? 'acad-active' : ''}`}
                        >
                          1.1 Object Storage &amp; Namespaces (Coat Check)
                        </button>
                        <button 
                          onClick={() => setSelectedNote('s3_storage')}
                          className={`acad-dir-item-btn ${selectedNote === 's3_storage' ? 'acad-active' : ''}`}
                        >
                          1.2 Storage Classes &amp; Lifecycles (Kitchen to Vault)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* LEVEL 2: SECURITY & ENCRYPTION */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 's3_security_enc' ? '' : 's3_security_enc')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-500" />
                        🛡️ Level 2 · Security &amp; KMS
                      </span>
                      {expandedCategory === 's3_security_enc' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 's3_security_enc' && (
                      <div className="py-1 font-semibold" style={{ background: 'var(--color-background-primary)', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                        <button 
                          onClick={() => setSelectedNote('s3_security')}
                          className={`acad-dir-item-btn ${selectedNote === 's3_security' ? 'acad-active' : ''}`}
                        >
                          2.1 Policies, BPA &amp; Pre-Signed URLs (Deadbolt)
                        </button>
                        <button 
                          onClick={() => setSelectedNote('s3_encryption')}
                          className={`acad-dir-item-btn ${selectedNote === 's3_encryption' ? 'acad-active' : ''}`}
                        >
                          2.2 Encryption &amp; S3 Bucket Keys (Biometric Safe)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* LEVEL 3: VERSIONING & REPLICATION */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 's3_resilience' ? '' : 's3_resilience')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-blue-500" />
                        🔄 Level 3 · Versioning &amp; DR
                      </span>
                      {expandedCategory === 's3_resilience' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 's3_resilience' && (
                      <div className="py-1 font-semibold" style={{ background: 'var(--color-background-primary)', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                        <button 
                          onClick={() => setSelectedNote('s3_versioning')}
                          className={`acad-dir-item-btn ${selectedNote === 's3_versioning' ? 'acad-active' : ''}`}
                        >
                          3.1 Versioning &amp; Object Lock (Time Machine)
                        </button>
                        <button 
                          onClick={() => setSelectedNote('s3_replication')}
                          className={`acad-dir-item-btn ${selectedNote === 's3_replication' ? 'acad-active' : ''}`}
                        >
                          3.2 Cross-Region Replication (Mirror Office)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* LEVEL 4: NETWORKING & OPERATIONS */}
                  <div>
                    <button 
                      onClick={() => setExpandedCategory(expandedCategory === 's3_advanced' ? '' : 's3_advanced')}
                      className="acad-dir-folder-btn"
                    >
                      <span className="flex items-center gap-1.5">
                        <Network className="w-3.5 h-3.5 text-purple-500" />
                        🌐 Level 4 · Networking &amp; Lens
                      </span>
                      {expandedCategory === 's3_advanced' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    {expandedCategory === 's3_advanced' && (
                      <div className="py-1 font-semibold" style={{ background: 'var(--color-background-primary)' }}>
                        <button 
                          onClick={() => setSelectedNote('s3_networking')}
                          className={`acad-dir-item-btn ${selectedNote === 's3_networking' ? 'acad-active' : ''}`}
                        >
                          4.1 Gateway VPC Endpoints &amp; MRAP (Subway Tunnel)
                        </button>
                        <button 
                          onClick={() => setSelectedNote('s3_operations')}
                          className={`acad-dir-item-btn ${selectedNote === 's3_operations' ? 'acad-active' : ''}`}
                        >
                          4.2 Acceleration, Batch &amp; Lens (Jetway &amp; Drones)
                        </button>
                      </div>
                    )}
                  </div>

                </div>

                <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: '16px', padding: '16px', color: 'var(--color-text-secondary)', fontSize: '11px', lineHeight: '1.6', fontWeight: 600 }}>
                  <span style={{ color: 'var(--color-text-primary)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '11.5px' }}>
                    <Lightbulb style={{ width: '14px', height: '14px', color: '#10b981' }} /> Interactive Quick-Launch
                  </span>
                  Click any storage concept to explore real-world analogies, interactive cost calculators, and instant simulator links!
                </div>
              </div>

              {/* Right Active Note Workspace */}
              <div className="lg:col-span-9 space-y-6 text-left">

                {/* NOTE 1.1: OBJECT STORAGE & NAMESPACES */}
                {selectedNote === 's3_namespace' && (
                  <div className="acad-detail-card space-y-5 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">🐣 Level 1 · Fundamentals</span>
                        <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                          1.1 What is Object Storage &amp; Global Namespaces?
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('overview')}
                          className="s3-btn s3-on"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap className="w-3.5 h-3.5" /> Go to Namespace Tab
                        </button>
                      </div>
                    </div>

                    {/* Plain English Box */}
                    <div className="acad-plain-english">
                      <strong>✨ In Plain English:</strong> Traditional computer hard drives (EBS / Block Storage) organize files in complex tree folders like <code>/Users/praveen/2026/file.pdf</code>. <strong>Amazon S3 is an Object Store</strong>—it stores files as flat key-value pairs (Object Data + Key Name + Metadata) in massive &ldquo;Buckets&rdquo; with unlimited scale. Every S3 bucket name is <strong>globally unique</strong> across all AWS accounts worldwide.
                    </div>

                    {/* Everyday Analogy Box */}
                    <div className="acad-analogy-box">
                      <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Coat Check Cloakroom vs A 100-Drawer Filing Cabinet
                      </div>
                      <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                        • <strong>Block Storage (Filing Cabinet)</strong>: You must remember the exact cabinet room, row, drawer number, and folder label to find a document.
                        <br />• <strong>S3 Object Storage (Coat Check)</strong>: You hand your winter coat (File Data) to the attendant, receive a unique claim ticket string (<code>key="receipts/101.pdf"</code>), and whenever you present the ticket, the attendant hands you your exact coat in seconds without searching folders!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>Key Architecture Pillars of S3:</h4>
                        
                        <ul className="list-disc pl-4 space-y-2">
                          <li><strong style={{ color: 'var(--color-text-primary)' }}>11 Nines of Durability (99.999999999%):</strong> Data is automatically replicated across at least 3 geographically separated Availability Zones. If you store 10,000,000 files, you would lose 1 file every 10,000 years on average!</li>
                          <li><strong style={{ color: 'var(--color-text-primary)' }}>Strong Read-After-Write Consistency:</strong> Immediately after a successful PUT or DELETE, any subsequent GET query returns the updated object instantly without lag.</li>
                          <li><strong style={{ color: 'var(--color-text-primary)' }}>Max Object Size:</strong> Single objects can range from 0 bytes up to <strong>5 Terabytes (5 TB)</strong>. Any upload larger than 100 MB should use Multi-part Upload!</li>
                        </ul>
                      </div>

                      <div className="s3-card p-4 rounded-xl flex flex-col justify-center text-center font-mono text-xs">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-tertiary)' }}>Global URI Addressing Anatomy</span>
                        
                        <div className="space-y-2 text-left text-[10.5px]">
                          <div className="p-2.5 rounded-lg" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                            <p className="font-bold text-emerald-600">Virtual-Hosted Style (Standard):</p>
                            <code>https://<strong>bucket-name</strong>.s3.<strong>us-east-1</strong>.amazonaws.com/<strong>images/photo.jpg</strong></code>
                          </div>
                          <div className="p-2.5 rounded-lg" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                            <p className="font-bold text-blue">S3 Protocol URI:</p>
                            <code>s3://<strong>bucket-name</strong>/<strong>images/photo.jpg</strong></code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 1.2: STORAGE CLASSES & LIFECYCLES */}
                {selectedNote === 's3_storage' && (
                  <div className="acad-detail-card space-y-5 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">🐣 Level 1 · Fundamentals</span>
                        <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                          1.2 S3 Storage Classes &amp; Automated Lifecycle Rules
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('storage')}
                          className="s3-btn s3-on"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap className="w-3.5 h-3.5" /> Go to Storage Classes Tab
                        </button>
                      </div>
                    </div>

                    {/* Plain English Box */}
                    <div className="acad-plain-english">
                      <strong>✨ In Plain English:</strong> Storing data in high-performance storage costs $0.023/GB. But 90% of files are rarely opened after 30 days. S3 tiered storage classes and <strong>Lifecycle Rules</strong> automatically transition aging objects to colder, cheaper tiers—saving up to <strong>95% on cloud storage bills</strong>!
                    </div>

                    {/* Everyday Analogy Box */}
                    <div className="acad-analogy-box">
                      <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Kitchen Counter, Basement Boxes &amp; Mountain Vault
                      </div>
                      <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                        • <strong>S3 Standard (Kitchen Counter)</strong>: Snacks and coffee you use multiple times every day ($0.023/GB).
                        <br />• <strong>S3 Standard-IA (Basement Boxes)</strong>: Winter jackets and holiday lights you open once a year with millisecond access ($0.0125/GB).
                        <br />• <strong>S3 Intelligent-Tiering (Smart Robot Butler)</strong>: Automatically moves items to the basement when you stop touching them, and brings them back when you ask with <strong>zero penalty fees</strong>!
                        <br />• <strong>S3 Glacier Deep Archive (Deep Mountain Bunker)</strong>: Old tax returns and childhood baby film you preserve for 20 years for $0.00099/GB (&lt;$1/TB/month)!
                      </p>
                    </div>

                    {/* Interactive Storage Cost Calculator HUD */}
                    <div className="s3-card p-4 rounded-xl space-y-3" style={{ border: '1px solid var(--color-border-tertiary)' }}>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider block" style={{ color: 'var(--color-text-tertiary)' }}>Interactive S3 Storage Cost &amp; Savings Calculator</span>
                      
                      <div className="space-y-2 text-xs">
                        <div>
                          <div className="flex justify-between font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            <span>Data Volume: {nbStorageGb.toLocaleString()} GB ({(nbStorageGb / 1000).toFixed(1)} TB)</span>
                          </div>
                          <input 
                            type="range" 
                            min="100" 
                            max="50000" 
                            step="100" 
                            value={nbStorageGb} 
                            onChange={(e) => setNbStorageGb(parseInt(e.target.value))}
                            className="accent-emerald-600 w-full"
                          />
                        </div>
                      </div>

                      {(() => {
                        const standardCost = nbStorageGb * 0.023;
                        const iaCost = nbStorageGb * 0.0125;
                        const glacierCost = nbStorageGb * 0.0036;
                        const deepCost = nbStorageGb * 0.00099;
                        const deepSavings = ((standardCost - deepCost) / standardCost) * 100;
                        return (
                          <div className="p-3 rounded-lg font-mono text-[10.5px] space-y-1.5" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                            <p>S3 Standard Cost: <span className="text-amber font-bold">${standardCost.toFixed(2)}/mo</span></p>
                            <p>S3 Standard-IA Cost: <span className="text-blue font-bold">${iaCost.toFixed(2)}/mo</span> (45% Savings)</p>
                            <p>S3 Glacier Flexible: <span className="text-purple font-bold">${glacierCost.toFixed(2)}/mo</span> (84% Savings)</p>
                            <p>S3 Glacier Deep Archive: <span className="text-green font-bold">${deepCost.toFixed(2)}/mo</span> (<strong className="text-emerald-500">{deepSavings.toFixed(1)}% Saved!</strong>)</p>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="acad-table">
                        <thead>
                          <tr>
                            <th>Storage Class</th>
                            <th>Cost / GB / mo</th>
                            <th>Min Duration</th>
                            <th>Retrieval Time</th>
                            <th>Best Use Case</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td><strong style={{ color: 'var(--color-text-primary)' }}>S3 Standard</strong></td>
                            <td>$0.023</td>
                            <td>None</td>
                            <td>Milliseconds</td>
                            <td>Active web assets, hot big data</td>
                          </tr>
                          <tr>
                            <td><strong style={{ color: 'var(--color-text-primary)' }}>S3 Intelligent-Tiering</strong></td>
                            <td>$0.023 &rarr; $0.0125</td>
                            <td>None</td>
                            <td>Milliseconds</td>
                            <td>Unknown or changing access patterns</td>
                          </tr>
                          <tr>
                            <td><strong style={{ color: 'var(--color-text-primary)' }}>S3 Standard-IA</strong></td>
                            <td>$0.0125</td>
                            <td>30 Days</td>
                            <td>Milliseconds</td>
                            <td>Monthly backups, disaster recovery</td>
                          </tr>
                          <tr>
                            <td><strong style={{ color: 'var(--color-text-primary)' }}>S3 Glacier Instant</strong></td>
                            <td>$0.004</td>
                            <td>90 Days</td>
                            <td>Milliseconds</td>
                            <td>Medical records, news photo archives</td>
                          </tr>
                          <tr>
                            <td><strong style={{ color: 'var(--color-text-primary)' }}>S3 Glacier Deep Archive</strong></td>
                            <td>$0.00099</td>
                            <td>180 Days</td>
                            <td>12–48 Hours</td>
                            <td>7–10 year regulatory compliance vaults</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* NOTE 2.1: POLICIES & BLOCK PUBLIC ACCESS */}
                {selectedNote === 's3_security' && (
                  <div className="acad-detail-card space-y-5 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">🛡️ Level 2 · Security &amp; KMS</span>
                        <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                          2.1 S3 Bucket Policies, Block Public Access &amp; Pre-Signed URLs
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('security')}
                          className="s3-btn s3-on"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap className="w-3.5 h-3.5" /> Go to Security Tab
                        </button>
                      </div>
                    </div>

                    {/* Plain English Box */}
                    <div className="acad-plain-english">
                      <strong>✨ In Plain English:</strong> By default, all newly created S3 buckets are completely private. **S3 Block Public Access (BPA)** is an account-level and bucket-level central &ldquo;Deadbolt Lock&rdquo; that overrides all policies to block accidental data exposure. **Pre-Signed URLs** let you give temporary, time-expiring download or upload links (e.g. valid for 15 minutes) to users without creating AWS accounts for them!
                    </div>

                    {/* Everyday Analogy Box */}
                    <div className="acad-analogy-box">
                      <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Bank Vault Deadbolt Lock &amp; The 15-Minute Guest Pass
                      </div>
                      <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                        • <strong>Block Public Access (BPA)</strong>: Like welding the exterior bank vault doors shut—even if a new teller accidentally writes a permission slip saying &ldquo;Anyone can enter&rdquo;, the master deadbolt physically overrides it!
                        <br />• <strong>Pre-Signed URL (Expiring Guest Pass)</strong>: When a customer orders concert tickets, you hand them a digital QR code that opens the gate for exactly 15 minutes. After 15 minutes, the QR code self-destructs without giving the customer master keys to the stadium!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>The 4 S3 Block Public Access Flags:</h4>
                        
                        <ul className="list-disc pl-4 space-y-2">
                          <li><strong style={{ color: 'var(--color-text-primary)' }}>BlockPublicAcls:</strong> Rejects new public ACLs uploaded with objects.</li>
                          <li><strong style={{ color: 'var(--color-text-primary)' }}>IgnorePublicAcls:</strong> Ignores all existing public ACLs across the bucket.</li>
                          <li><strong style={{ color: 'var(--color-text-primary)' }}>BlockPublicPolicy:</strong> Rejects new bucket policies that grant open public access.</li>
                          <li><strong style={{ color: 'var(--color-text-primary)' }}>RestrictPublicBuckets:</strong> Restricts access to public and cross-account buckets to authorized AWS services.</li>
                        </ul>
                      </div>

                      <div className="s3-card p-4 rounded-xl flex flex-col justify-center text-center font-mono text-xs">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-tertiary)' }}>Enforcing HTTPS Only (TLS 1.2+)</span>
                        
                        <pre className="acad-terminal text-[9.5px] leading-relaxed text-left overflow-x-auto">
{`{
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:*",
  "Resource": "arn:aws:s3:::my-bucket/*",
  "Condition": {
    "Bool": { "aws:SecureTransport": "false" }
  }
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 2.2: S3 ENCRYPTION */}
                {selectedNote === 's3_encryption' && (
                  <div className="acad-detail-card space-y-5 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">🛡️ Level 2 · Security &amp; KMS</span>
                        <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                          2.2 S3 Encryption at Rest &amp; S3 Bucket Keys (99% KMS Cost Savings)
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('encryption')}
                          className="s3-btn s3-on"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap className="w-3.5 h-3.5" /> Go to Encryption Tab
                        </button>
                      </div>
                    </div>

                    {/* Plain English Box */}
                    <div className="acad-plain-english">
                      <strong>✨ In Plain English:</strong> All S3 buckets are encrypted at rest by default using AES-256 (**SSE-S3**). When regulatory compliance requires audit logs and custom customer-managed keys (**SSE-KMS**), enabling **S3 Bucket Keys** creates a temporary bucket-level key inside S3—reducing expensive AWS KMS API calls and billing by up to **99%**!
                    </div>

                    {/* Everyday Analogy Box */}
                    <div className="acad-analogy-box">
                      <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Hotel Built-in Safe vs Custom Biometric Safe with Token Caching
                      </div>
                      <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                        • <strong>SSE-S3 (Hotel Safe)</strong>: The hotel provides a standard digital safe in every room for free.
                        <br />• <strong>SSE-KMS (Custom Biometric Safe with Guard Log)</strong>: Every time you open the safe, the hotel guard charges you $0.01 and writes your name in an audit book (CloudTrail).
                        <br />• <strong>S3 Bucket Key (Day Pass Token)</strong>: You show your ID to the guard once at the start of the day and receive a temporary wristband so you can open the safe 10,000 times without paying the guard 10,000 times!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>The 4 S3 Encryption Options:</h4>
                        
                        <ul className="list-disc pl-4 space-y-2">
                          <li><strong style={{ color: 'var(--color-text-primary)' }}>SSE-S3 (Default):</strong> Keys managed by S3 with zero extra cost. Uses AES-256.</li>
                          <li><strong style={{ color: 'var(--color-text-primary)' }}>SSE-KMS (aws/s3 or CMK):</strong> User-managed keys with IAM permission controls, automatic key rotation, and CloudTrail audit logging.</li>
                          <li><strong style={{ color: 'var(--color-text-primary)' }}>SSE-C (Customer Provided):</strong> You manage and supply raw encryption keys with every HTTP header request.</li>
                          <li><strong style={{ color: 'var(--color-text-primary)' }}>Client-Side Encryption:</strong> Encrypts bytes locally on your client machine before transmitting over the wire to AWS.</li>
                        </ul>
                      </div>

                      <div className="s3-card p-4 rounded-xl flex flex-col justify-center text-center font-mono text-xs">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-tertiary)' }}>S3 Bucket Key KMS Offload</span>
                        
                        <div className="space-y-2 text-left text-[10px]">
                          <div className="p-2 rounded flex justify-between items-center" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid #fca5a5' }}>
                            <span>Without Bucket Key (1M requests):</span>
                            <span className="text-red font-bold">1,000,000 KMS API Calls</span>
                          </div>
                          <div className="p-2 rounded flex justify-between items-center" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #86efac' }}>
                            <span className="text-green font-bold">With S3 Bucket Key Active:</span>
                            <span className="text-green font-bold">~100 KMS Calls (99.9% Offload)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 3.1: VERSIONING & OBJECT LOCK */}
                {selectedNote === 's3_versioning' && (
                  <div className="acad-detail-card space-y-5 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">🔄 Level 3 · Versioning &amp; DR</span>
                        <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                          3.1 S3 Versioning, Delete Markers &amp; Object Lock (WORM)
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('versioning')}
                          className="s3-btn s3-on"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap className="w-3.5 h-3.5" /> Go to Versioning Tab
                        </button>
                      </div>
                    </div>

                    {/* Plain English Box */}
                    <div className="acad-plain-english">
                      <strong>✨ In Plain English:</strong> Enabling **S3 Versioning** ensures you never lose data from accidental overwrites or deletes. When you delete an object, S3 creates a lightweight **Delete Marker** on top of the stack instead of wiping your file. **S3 Object Lock (WORM - Write Once, Read Many)** prevents even AWS Root Administrators from deleting or altering files during strict regulatory compliance retention periods (e.g. SEC Rule 17a-4).
                    </div>

                    {/* Everyday Analogy Box */}
                    <div className="acad-analogy-box">
                      <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Digital Time Machine &amp; The Titanium Evidence Vault
                      </div>
                      <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                        • <strong>Delete Marker</strong>: Instead of shredding a contract, an archivist places a &ldquo;Temporarily Withdrawn&rdquo; sticky note on top of the document. If you remove the sticky note, the original contract is right there intact!
                        <br />• <strong>Object Lock (Compliance Mode)</strong>: Dropping legal courtroom evidence into a titanium vault with a physical mechanical timer that cannot be opened by anyone—not even the bank president—until January 1st, 2035!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>Object Lock Modes Comparison:</h4>
                        
                        <table className="acad-table">
                          <thead>
                            <tr>
                              <th>Mode</th>
                              <th>Admin Override?</th>
                              <th>Best For</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>Governance Mode</strong></td>
                              <td>✅ Yes (with special IAM permission)</td>
                              <td>Accidental deletion protection</td>
                            </tr>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>Compliance Mode</strong></td>
                              <td>❌ No (Strictly impossible even for Root)</td>
                              <td>FINRA, SEC, legal compliance</td>
                            </tr>
                            <tr>
                              <td><strong style={{ color: 'var(--color-text-primary)' }}>Legal Hold</strong></td>
                              <td>✅ Yes (On/Off toggle with no expiration)</td>
                              <td>Active litigation investigation</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="acad-gotcha-box">
                        <strong>⚠️ Versioning Storage Billing Gotcha:</strong>
                        <p style={{ margin: '4px 0 0' }}>
                          When Versioning is enabled, overwriting a 10 GB file 5 times stores 50 GB of data in S3! Always attach an S3 Lifecycle Rule to automatically expire &ldquo;Noncurrent Versions&rdquo; after 30 or 60 days to avoid surprise storage bills!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 3.2: CROSS-REGION REPLICATION */}
                {selectedNote === 's3_replication' && (
                  <div className="acad-detail-card space-y-5 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">🔄 Level 3 · Versioning &amp; DR</span>
                        <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                          3.2 Cross-Region Replication (CRR) &amp; Same-Region Replication (SRR)
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('transfer')}
                          className="s3-btn s3-on"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap className="w-3.5 h-3.5" /> Go to Replication Tab
                        </button>
                      </div>
                    </div>

                    {/* Plain English Box */}
                    <div className="acad-plain-english">
                      <strong>✨ In Plain English:</strong> **Cross-Region Replication (CRR)** automatically copies new objects asynchronously across different AWS regions (e.g. <code>us-east-1</code> &rarr; <code>eu-west-1</code>) for multi-region disaster recovery and lower-latency global reads. S3 Replication Time Control (RTC) provides a 15-minute SLA on replication completion.
                    </div>

                    {/* Everyday Analogy Box */}
                    <div className="acad-analogy-box">
                      <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Carbon-Copy Mirror Office Across the Ocean
                      </div>
                      <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                        Every time you sign a contract at the New York headquarters (Primary Bucket), a high-speed secure courier automatically delivers an identical carbon copy to the London office vault (Destination Bucket in Europe) within minutes so European teams can read it locally without international delays!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>Replication Requirements Checklist:</h4>
                        
                        <ul className="list-disc pl-4 space-y-2">
                          <li><strong style={{ color: 'var(--color-text-primary)' }}>Versioning Must Be Enabled:</strong> Both source and destination buckets must have Versioning enabled.</li>
                          <li><strong style={{ color: 'var(--color-text-primary)' }}>IAM Service Role:</strong> S3 needs an IAM role with permission to read source objects and replicate PUT into the destination bucket.</li>
                          <li><strong style={{ color: 'var(--color-text-primary)' }}>Existing Objects:</strong> By default, CRR only replicates new objects uploaded after the rule is created. Use <strong>S3 Batch Replication</strong> to sync existing older files!</li>
                        </ul>
                      </div>

                      <div className="s3-card p-4 rounded-xl flex flex-col justify-center text-center font-mono text-xs">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider block mb-3" style={{ color: 'var(--color-text-tertiary)' }}>Replication Architecture Types</span>
                        
                        <div className="space-y-2 text-left text-[10px]">
                          <div className="p-2 rounded" style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid #7dd3fc' }}>
                            <p className="font-bold text-blue">CRR (Cross-Region):</p>
                            <span>us-east-1 (Primary) &rarr; eu-west-1 (Disaster Recovery / GDPR Compliance)</span>
                          </div>
                          <div className="p-2 rounded" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #86efac' }}>
                            <p className="font-bold text-green">SRR (Same-Region):</p>
                            <span>Log aggregation from Prod Account &rarr; Central Security Audit Bucket</span>
                          </div>
                          <div className="p-2 rounded" style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid #c084fc' }}>
                            <p className="font-bold text-purple">Bi-Directional CRR:</p>
                            <span>Active-Active two-way sync between US and Asia buckets</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NOTE 4.1: GATEWAY VPC ENDPOINTS & MRAP */}
                {selectedNote === 's3_networking' && (
                  <div className="acad-detail-card space-y-5 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">🌐 Level 4 · Networking &amp; Lens</span>
                        <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                          4.1 Gateway VPC Endpoints &amp; Multi-Region Access Points (MRAP)
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('networking')}
                          className="s3-btn s3-on"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap className="w-3.5 h-3.5" /> Go to Gateway Endpoints Tab
                        </button>
                      </div>
                    </div>

                    {/* Plain English Box */}
                    <div className="acad-plain-english">
                      <strong>✨ In Plain English:</strong> When EC2 instances upload to S3, data normally travels through public NAT Gateways—costing $0.045/GB in egress fees! An **S3 Gateway VPC Endpoint** is a completely <strong>FREE</strong> private tunnel inside your VPC route table that routes traffic directly into S3 across AWS private fiber. **Multi-Region Access Points (MRAP)** provide a single global DNS endpoint that automatically routes clients to the closest S3 bucket worldwide with 60% faster speeds!
                    </div>

                    {/* Everyday Analogy Box */}
                    <div className="acad-analogy-box">
                      <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Free Private Underground Tunnel vs Paying Highway Tollbooths
                      </div>
                      <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                        • <strong>NAT Gateway Egress</strong>: Driving your delivery truck onto the public highway and paying a toll fee ($0.045/GB) at every single tollbooth.
                        <br />• <strong>Gateway VPC Endpoint</strong>: Building a free private underground subway tunnel directly connecting your office to the storage warehouse—100% private, faster, and zero tollbooth fees!
                      </p>
                    </div>

                    {/* Interactive NAT Gateway Savings HUD */}
                    <div className="s3-card p-4 rounded-xl space-y-3" style={{ border: '1px solid var(--color-border-tertiary)' }}>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider block" style={{ color: 'var(--color-text-tertiary)' }}>Interactive Gateway VPC Endpoint Savings Calculator</span>
                      
                      <div className="space-y-2 text-xs">
                        <div>
                          <div className="flex justify-between font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            <span>Monthly EC2-to-S3 Data Egress: {nbGatewayEgressGb.toLocaleString()} GB ({(nbGatewayEgressGb / 1000).toFixed(1)} TB)</span>
                          </div>
                          <input 
                            type="range" 
                            min="500" 
                            max="50000" 
                            step="500" 
                            value={nbGatewayEgressGb} 
                            onChange={(e) => setNbGatewayEgressGb(parseInt(e.target.value))}
                            className="accent-emerald-600 w-full"
                          />
                        </div>
                      </div>

                      {(() => {
                        const natFee = nbGatewayEgressGb * 0.045;
                        return (
                          <div className="p-3 rounded-lg font-mono text-[10.5px] space-y-1.5" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                            <p>NAT Gateway Processing Fee: <span className="text-red font-bold">${natFee.toFixed(2)} / month</span></p>
                            <p>S3 Gateway VPC Endpoint Cost: <span className="text-green font-bold">$0.00 (100% Free)</span></p>
                            <p>Monthly Savings with Gateway Endpoint: <span className="text-emerald-500 font-bold">${natFee.toFixed(2)} / month saved!</span></p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* NOTE 4.2: ACCELERATION, BATCH & LENS */}
                {selectedNote === 's3_operations' && (
                  <div className="acad-detail-card space-y-5 animate-fadeIn">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                      <div>
                        <span className="acad-hero-badge">🌐 Level 4 · Networking &amp; Lens</span>
                        <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '8px' }}>
                          4.2 S3 Transfer Acceleration, Batch Operations &amp; Storage Lens
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setActiveTab('operations')}
                          className="s3-btn s3-on"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Zap className="w-3.5 h-3.5" /> Go to Operations Tab
                        </button>
                      </div>
                    </div>

                    {/* Plain English Box */}
                    <div className="acad-plain-english">
                      <strong>✨ In Plain English:</strong> **S3 Transfer Acceleration** speeds up global uploads by routing data through the closest AWS CloudFront Edge location over optimized private fiber (up to 500% faster). **S3 Batch Operations** executes massive bulk changes (e.g. encrypting or copying 10 billion files) with 1 click. **S3 Storage Lens** provides 360-degree cost optimization analytics across your entire AWS Organization.
                    </div>

                    {/* Everyday Analogy Box */}
                    <div className="acad-analogy-box">
                      <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Airport VIP Fast Track &amp; The Organization-Wide Audit Drone
                      </div>
                      <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                        • <strong>Transfer Acceleration</strong>: Checking your heavy luggage at the local downtown airline counter (Edge Location) so you can ride the private express train to the main airport at 300 mph without city traffic jams!
                        <br />• <strong>S3 Storage Lens</strong>: A fleet of smart audit drones scanning 50 warehouses in 10 seconds, generating a heat map showing which storage rooms have unused old furniture costing you money!
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        <h4 className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>Top 3 S3 Operational Power Tools:</h4>
                        
                        <div className="p-3 rounded-lg space-y-1" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                          <strong className="text-amber font-bold block">1. S3 Event Notifications:</strong>
                          <p>Automatically triggers AWS Lambda, SNS, or SQS queues whenever an object is uploaded (<code>s3:ObjectCreated:*</code>) to process image thumbnails or indexing in real-time!</p>
                        </div>
                        <div className="p-3 rounded-lg space-y-1" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                          <strong className="text-emerald-600 font-bold block">2. S3 Batch Operations:</strong>
                          <p>Perform bulk copy, replace tags, add Object Lock, or invoke Lambda across millions of objects using an S3 Inventory manifest CSV.</p>
                        </div>
                        <div className="p-3 rounded-lg space-y-1" style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)' }}>
                          <strong className="text-blue font-bold block">3. S3 Storage Lens:</strong>
                          <p>Organization-wide dashboard analyzing cost metrics, noncurrent version bloat, and unencrypted bucket audit flags.</p>
                        </div>
                      </div>

                      <div className="s3-card p-4 rounded-xl flex flex-col justify-between">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--color-text-tertiary)' }}>S3 CLI Quick Snippet</span>
                          <button 
                            onClick={() => handleCopyCode(`aws s3 cp file.mp4 s3://my-bucket/video/ --endpoint-url https://s3-accelerate.amazonaws.com\n\naws s3api put-bucket-notification-configuration --bucket my-bucket --notification-configuration file://notification.json`, 's3-ops-code')}
                            className="s3-btn text-[10px] p-1 flex items-center gap-1"
                          >
                            {copiedNoteId === 's3-ops-code' ? 'Copied!' : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <pre className="acad-terminal text-[10px] leading-relaxed overflow-x-auto h-48">
{`# 1. Upload via S3 Transfer Acceleration
aws s3 cp large-video.mp4 s3://my-bucket/ \
  --endpoint-url https://s3-accelerate.amazonaws.com

# 2. Sync folders in parallel
aws s3 sync ./dist s3://my-static-site/ --delete

# 3. Create S3 Batch Operation Job
aws s3control create-job \
  --account-id 123456789012 \
  --operation '{"S3PutObjectTagging": {"TagSet": [{"Key": "Audited", "Value": "True"}]}}' \
  --manifest '{"Spec": {"Format": "S3InventoryReport_CSV"}}'`}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}


        {/* TAB 1: OVERVIEW */}
        {!isComparative && activeTab === 'overview' && (
          <Translate>
          <div>


            {/* 🎨 Architectural SVG */}
            <div className="s3-sec">S3 Flat Key Database Index Architecture</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Note how folders are only simulated logical prefixes in a flat metadata partition.
              </div>
              <svg viewBox="0 0 700 180" width="100%" className="s3-svg-bg">
                <defs>
                  <filter id="s3-shadow-key" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--s3-terminal-bg)" floodOpacity="0.08" />
                  </filter>
                  <linearGradient id="folder-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-bg)" />
                    <stop offset="100%" stopColor="var(--s3-tab-hover-bg)" />
                  </linearGradient>
                  <linearGradient id="s3-table-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-success-bg)" />
                    <stop offset="100%" stopColor="var(--s3-success-bg)" />
                  </linearGradient>
                  
                  <marker id="arr-repl-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="var(--color-green)" />
                  </marker>
                </defs>

                {/* PREMIUM NESTED BOUNDARIES */}
                {/* Left logical client boundary */}
                <rect x="10" y="10" width="245" height="160" rx="8" fill="var(--s3-metric-card-bg)" fillOpacity="0.4" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                <text x="18" y="22" fontSize="7" fill="var(--color-text-secondary)" fontWeight="bold" letterSpacing="0.05em">CLIENT-SIDE LOGICAL VIEW</text>

                {/* Right S3 engine boundary */}
                <rect x="310" y="10" width="380" height="160" rx="12" fill="var(--s3-success-bg)" fillOpacity="0.3" stroke="var(--color-green)" strokeWidth="1.5" strokeDasharray="6,4" />
                <text x="320" y="22" fontSize="7" fill="var(--s3-success-text-bold)" fontWeight="bold" letterSpacing="0.05em">☁️ PHYSICAL S3 STORAGE ENGINE</text>

                {/* Logical User Directory Structure (Left Card) */}
                <rect x="25" y="32" width="215" height="126" rx="8" fill="url(#folder-grad)" stroke="var(--s3-card-border)" strokeWidth="1.5" filter="url(#s3-shadow-key)" />
                <text x="38" y="48" fontSize="11" fontWeight="bold" fill="var(--color-text-primary)">📁 Logical Folder Tree (Mock)</text>

                <text x="48" y="72" fontSize="10.5" fontWeight="500" fill="var(--color-text-secondary)">📁 assets/</text>
                <text x="68" y="90" fontSize="10" fontWeight="500" fill="var(--color-text-secondary)">📁 images/</text>
                <text x="88" y="108" fontSize="10" fill="var(--color-green)" fontWeight="bold">📄 logo.png</text>
                <text x="48" y="132" fontSize="10.5" fontWeight="500" fill="var(--color-text-secondary)">📁 logs/ ➔ 📄 app.log</text>

                {/* Flow Arrow */}
                <path d="M 260 90 L 305 90" fill="none" className="s3-flow-green" markerEnd="url(#arr-repl-green)" />

                {/* S3 Flat Database Index Key-Value store (Right Card) */}
                <rect x="320" y="32" width="360" height="126" rx="8" fill="url(#s3-table-grad)" stroke="var(--color-green)" strokeWidth="1.5" filter="url(#s3-shadow-key)" />
                <text x="335" y="48" fontSize="11" fontWeight="bold" fill="var(--s3-success-text-bold)">🛢️ Actual S3 Flat Key-Value Database Table</text>

                {/* Headers */}
                <rect x="330" y="58" width="340" height="22" fill="var(--s3-success-border)" rx="4" />
                <text x="335" y="72" fontSize="9.5" fontWeight="bold" fill="var(--s3-success-text-bold)">Full Object Key String (Flat Prefix + Name)</text>
                <text x="585" y="72" fontSize="9.5" fontWeight="bold" fill="var(--s3-success-text-bold)">Physical Sector</text>

                {/* Rows */}
                <text x="335" y="96" fontSize="9" fontFamily="monospace" fontWeight="500" fill="var(--s3-success-text)">assets/images/logo.png</text>
                <text x="585" y="96" fontSize="9" fill="var(--color-text-secondary)" fontWeight="500">Block-A92k-NVMe</text>

                <text x="335" y="116" fontSize="9" fontFamily="monospace" fontWeight="500" fill="var(--s3-success-text)">logs/2026/05/sys.log</text>
                <text x="585" y="116" fontSize="9" fill="var(--color-text-secondary)" fontWeight="500">Block-B18a-NVMe</text>

                <text x="335" y="136" fontSize="9" fontFamily="monospace" fontWeight="500" fill="var(--s3-success-text)">index.html</text>
                <text x="585" y="136" fontSize="9" fill="var(--color-text-secondary)" fontWeight="500">Block-C42f-NVMe</text>

                <line x1="330" y1="103" x2="670" y2="103" stroke="var(--s3-card-border)" strokeWidth="0.75" />
                <line x1="330" y1="123" x2="670" y2="123" stroke="var(--s3-card-border)" strokeWidth="0.75" />
              </svg>
            </div>

            {/* DNS Validator & URL Generator */}
            <div className="s3-sec">🔒 Interactive S3 Bucket Namespace &amp; DNS Compliances Playground</div>
            <div className="s3-g2" style={{ marginBottom: '24px' }}>
              
              {/* Part A: DNS Validator */}
              <div className="s3-card">
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🪣</span> S3 Bucket DNS Compliancy Validator
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                  Bucket names must be globally unique across all AWS accounts and regions, conforming to strict DNS rules.
                </div>

                {/* S3 Architecture class toggle */}
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: 600, display: 'block', marginBottom: '4px', color: 'var(--color-text-secondary)' }}>S3 Bucket Architecture Class:</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className={`s3-btn ${bucketType === 'general' ? 's3-on' : ''}`} style={{ flex: 1, padding: '4px 8px', fontSize: '11px' }} onClick={() => { setBucketType('general'); setBucketNameInput('my-premium-bucket'); }}>
                      🌐 General Purpose
                    </button>
                    <button className={`s3-btn ${bucketType === 'directory' ? 's3-on' : ''}`} style={{ flex: 1, padding: '4px 8px', fontSize: '11px' }} onClick={() => { setBucketType('directory'); setBucketNameInput('my-fast-bucket--use1-az4--x-s3'); }}>
                      ⚡ Express One Zone
                    </button>
                  </div>
                </div>

                {bucketType === 'directory' && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ fontSize: '10.5px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Availability Zone Target Placement:</label>
                    <select className="s3-card select" style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid var(--color-border-secondary)' }} value={directoryAz} onChange={(e) => {
                      const az = e.target.value as any;
                      setDirectoryAz(az);
                      setBucketNameInput(`my-fast-bucket--${az}--x-s3`);
                    }}>
                      <option value="use1-az4">use1-az4 (us-east-1a / Rack AZ 4)</option>
                      <option value="use1-az6">use1-az6 (us-east-1b / Rack AZ 6)</option>
                    </select>
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label className="s3-sec" style={{ margin: '0 0 6px 0', fontSize: '10.5px' }}>Bucket Name Input</label>
                  <input
                    type="text"
                    className="s3-btn"
                    style={{ width: '100%', padding: '10px', border: '1.5px solid var(--color-border-secondary)', background: 'var(--s3-bg)', color: 'var(--color-text-primary)', textTransform: 'lowercase', fontFamily: 'monospace', textAlign: 'left', cursor: 'text' }}
                    value={bucketNameInput}
                    onChange={(e) => setBucketNameInput(e.target.value.toLowerCase())}
                    placeholder={bucketType === 'general' ? "e.g. my-cool-bucket" : "e.g. my-fast-bucket--use1-az4--x-s3"}
                  />
                </div>

                {/* Validation checklist calculations */}
                {(() => {
                  const isLengthValid = bucketType === 'general'
                    ? (bucketNameInput.length >= 3 && bucketNameInput.length <= 63)
                    : (bucketNameInput.length >= 3 && bucketNameInput.length <= 64);

                  const isCharsValid = bucketType === 'general'
                    ? /^[a-z0-9.-]+$/.test(bucketNameInput)
                    : /^[a-z0-9-]+$/.test(bucketNameInput); // no periods allowed in directory buckets!

                  const isStartEndValid = /^[a-z0-9]/.test(bucketNameInput) && /[a-z0-9]$/.test(bucketNameInput);

                  const isAdjacentValid = bucketType === 'general'
                    ? (!bucketNameInput.includes('..') && !bucketNameInput.includes('--') && !bucketNameInput.includes('.-') && !bucketNameInput.includes('-.'))
                    : (!bucketNameInput.split('--')[0]?.includes('..') && !bucketNameInput.split('--')[0]?.includes('--'));

                  const isIpAddressValid = !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(bucketNameInput);

                  const isSuffixValid = bucketType === 'general'
                    ? true
                    : bucketNameInput.endsWith(`--${directoryAz}--x-s3`);

                  const isDnsCompliant = isLengthValid && isCharsValid && isStartEndValid && isAdjacentValid && isIpAddressValid && isSuffixValid;

                  return (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11.5px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{isLengthValid ? '🟢' : '❌'}</span>
                          <span style={{ color: isLengthValid ? 'var(--s3-success-text)' : 'var(--s3-error-text)' }}>
                            Length is between 3 and {bucketType === 'general' ? 63 : 64} characters (Current: {bucketNameInput.length})
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{isCharsValid ? '🟢' : '❌'}</span>
                          <span style={{ color: isCharsValid ? 'var(--s3-success-text)' : 'var(--s3-error-text)' }}>
                            {bucketType === 'general'
                              ? 'Consists only of lowercase letters, numbers, periods (.), and hyphens (-)'
                              : 'Consists ONLY of lowercase letters, numbers, and hyphens (NO periods allowed!)'
                            }
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{isStartEndValid ? '🟢' : '❌'}</span>
                          <span style={{ color: isStartEndValid ? 'var(--s3-success-text)' : 'var(--s3-error-text)' }}>
                            Must start and end with a letter or number
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{isAdjacentValid ? '🟢' : '❌'}</span>
                          <span style={{ color: isAdjacentValid ? 'var(--s3-success-text)' : 'var(--s3-error-text)' }}>
                            {bucketType === 'general'
                              ? 'No adjacent special symbols `..` or `--` or `.-`'
                              : 'No adjacent special symbols `..` or `--` inside custom prefix'
                            }
                          </span>
                        </div>
                        {bucketType === 'general' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{isIpAddressValid ? '🟢' : '❌'}</span>
                            <span style={{ color: isIpAddressValid ? 'var(--s3-success-text)' : 'var(--s3-error-text)' }}>
                              Must not be formatted as an IPv4 address
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{isSuffixValid ? '🟢' : '❌'}</span>
                            <span style={{ color: isSuffixValid ? 'var(--s3-success-text)' : 'var(--s3-error-text)' }}>
                              Enforces Directory Bucket suffix: `--${directoryAz}--x-s3`
                            </span>
                          </div>
                        )}
                      </div>

                      <div style={{
                        marginTop: '16px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '12px',
                        background: isDnsCompliant ? 'var(--s3-success-bg)' : 'var(--s3-error-bg)',
                        border: isDnsCompliant ? '1.5px solid var(--s3-success-border)' : '1.5px solid var(--s3-error-border)',
                        color: isDnsCompliant ? 'var(--s3-success-text-bold)' : 'var(--s3-error-text)'
                      }}>
                        {isDnsCompliant 
                          ? `✅ DNS NAMESPACE COMPLIANT (${bucketType === 'general' ? 'GENERAL PURPOSE' : 'DIRECTORY BUCKET'})` 
                          : '❌ DNS NAMESPACE NON-COMPLIANT'}
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Part B: URL Generator */}
              <div className="s3-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🔗</span> S3 Endpoint &amp; Object Address URL Generator
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                    {bucketType === 'general' 
                      ? 'Since 2020, S3 deprecates Path-style access in favor of Virtual Hosted-style, allowing DNS subdomain load balancing.'
                      : 'Express One Zone Directory buckets do not support legacy Path-style or standard REST URLs. They use specialized low-latency endpoints.'
                    }
                  </div>

                  <div className="s3-g2" style={{ gap: '10px', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>AWS Region</label>
                      <select className="s3-btn select" style={{ width: '100%', padding: '6px', border: '1px solid var(--color-border-secondary)', borderRadius: '6px', background: 'var(--s3-bg)' }} value={urlRegion} onChange={(e) => setUrlRegion(e.target.value)}>
                        <option value="us-east-1">us-east-1 (N. Virginia)</option>
                        <option value="eu-west-1">eu-west-1 (Ireland)</option>
                        <option value="ap-southeast-2">ap-southeast-2 (Sydney)</option>
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Object Key Path</label>
                      <input 
                        type="text" 
                        value={urlKey} 
                        onChange={(e) => setUrlKey(e.target.value)} 
                        className="s3-btn"
                        style={{ padding: '6px', fontSize: '12px', width: '100%', border: '1px solid var(--color-border-secondary)', borderRadius: '6px', background: 'var(--s3-bg)', color: 'var(--color-text-primary)' }} 
                      />
                    </div>
                  </div>

                  {/* Generated URLs display */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--s3-metric-card-bg)', padding: '12px', borderRadius: '10px', border: '1.5px solid var(--s3-card-border)' }}>
                    {bucketType === 'general' ? (
                      <>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-blue)', textTransform: 'uppercase' }}>✅ Virtual Hosted-Style URL (Standard)</div>
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-primary)', wordBreak: 'break-all', marginTop: '3px' }}>
                            https://<span style={{ color: 'var(--color-blue)', fontWeight: 'bold' }}>{bucketNameInput}</span>.s3.<span style={{ color: 'var(--color-blue)', fontWeight: 'bold' }}>{urlRegion}</span>.amazonaws.com/<span style={{ color: 'var(--color-purple)', fontWeight: 'bold' }}>{urlKey}</span>
                          </div>
                          <div style={{ fontSize: '9.5px', color: 'var(--color-text-secondary)', marginTop: '2px', fontStyle: 'italic' }}>
                            routes subdomain directly to specific S3 frontend DNS server pools for infinite horizontal scaling.
                          </div>
                        </div>
                        
                        <div style={{ borderTop: '1.5px solid var(--s3-card-border)', paddingTop: '8px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-red)', textTransform: 'uppercase' }}>❌ Path-Style URL (Deprecated since 2020)</div>
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-secondary)', wordBreak: 'break-all', marginTop: '3px', textDecoration: 'line-through' }}>
                            https://s3.<span style={{ color: 'var(--color-blue)' }}>{urlRegion}</span>.amazonaws.com/<span style={{ color: 'var(--color-blue)' }}>{bucketNameInput}</span>/<span style={{ color: 'var(--color-purple)' }}>{urlKey}</span>
                          </div>
                          <div style={{ fontSize: '9.5px', color: 'var(--color-red)', marginTop: '2px', fontWeight: 600 }}>
                            forces all buckets to share a single DNS namespace, bottlenecking request thresholds!
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-green)', textTransform: 'uppercase' }}>⚡ Directory Bucket High-Performance Endpoint URL</div>
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-primary)', wordBreak: 'break-all', marginTop: '3px' }}>
                            https://<span style={{ color: 'var(--color-green)', fontWeight: 'bold' }}>{bucketNameInput}</span>.s3express-<span style={{ color: 'var(--color-green)', fontWeight: 'bold' }}>{directoryAz}</span>.<span style={{ color: 'var(--color-blue)', fontWeight: 'bold' }}>{urlRegion}</span>.amazonaws.com/<span style={{ color: 'var(--color-purple)', fontWeight: 'bold' }}>{urlKey}</span>
                          </div>
                          <div style={{ fontSize: '9.5px', color: 'var(--color-green)', marginTop: '2px', fontWeight: 600 }}>
                            Direct connection into specialized low-latency hypervisor hardware for single-digit ms processing!
                          </div>
                        </div>

                        <div style={{ borderTop: '1.5px solid var(--s3-card-border)', paddingTop: '8px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-red)', textTransform: 'uppercase' }}>❌ Standard REST or Path URLs</div>
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--color-text-secondary)', marginTop: '3px', textDecoration: 'line-through' }}>
                            https://s3.{urlRegion}.amazonaws.com/{bucketNameInput}
                          </div>
                          <div style={{ fontSize: '9.5px', color: 'var(--color-red)', marginTop: '2px', fontStyle: 'italic' }}>
                            Completely rejected. S3 Directory Buckets reside inside a single AZ and require specialized Zonal routing endpoints.
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* S3 Durability AZ replication sandbox */}
            <div className="s3-sec">⚡ PUT Request Ingestion &amp; 3-AZ Parallel Replication Simulator</div>
            <div className="s3-card">
              <div className="s3-g2">
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                    Surviving Datacenter Disasters: Standard 3-AZ Synchronous Writes
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                    S3 standard guarantees <b>99.999999999% (11 9s)</b> durability by synchronously copying object bytes across a minimum of three distinct physically isolated Availability Zones (AZs) before returning 200 OK.
                  </div>

                  <div className="s3-g2" style={{ gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '10px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Select Object Payload:</label>
                      <select className="s3-card select" value={replicatePayload} onChange={(e) => setReplicatePayload(e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px' }}>
                        <option value="ledger.pdf">ledger.pdf (Corporate ledger - 12.4 MB)</option>
                        <option value="backup.tar">backup.tar (System snapshot - 45.1 MB)</option>
                      </select>
                    </div>
                  </div>

                  <button className="s3-btn s3-on" style={{ width: '100%', fontWeight: 'bold', background: 'var(--color-blue)', color: '#fff', borderColor: 'var(--color-blue)' }} onClick={handleReplicationSimulation} disabled={replicateIsRunning}>
                    {replicateIsRunning ? '⚡ Executing parallel AZ writes...' : '🚀 Ingest PUT Object Payload'}
                  </button>

                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Parallel Ingestion Audit logs:</div>
                    <div ref={replicateTerminalRef} className="s3-terminal" style={{ height: '110px' }}>
                      {replicateLogs.length === 0 ? (
                        <div style={{ color: 'var(--color-text-tertiary)' }}>[idle] Awaiting upload replication trigger...</div>
                      ) : (
                        replicateLogs.map((log, idx) => (
                          <div key={idx} style={{
                            color: log.includes('❌') ? 'var(--color-red)' : log.includes('✅') ? 'var(--color-green)' : log.includes('⚡') ? 'var(--color-amber)' : 'var(--color-blue)',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            marginBottom: '2px'
                          }}>
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* AZ replication topology SVG */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <svg viewBox="0 0 500 240" width="100%" height="240" className="s3-svg-bg">
                    <defs>
                      <marker id="arr-repl-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-green)" /></marker>
                    </defs>

                    {/* Client Browser */}
                    <rect x="20" y="85" width="100" height="70" rx="8" fill="var(--s3-card-bg)" stroke="var(--s3-card-border)" strokeWidth="1.5" />
                    <text x="70" y="105" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-text-primary)">💻 Client Browser</text>
                    <text x="70" y="122" textAnchor="middle" fontSize="8.5" fontWeight="600" fill="var(--color-blue)">PUT Request</text>
                    <text x="70" y="140" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)" fontFamily="monospace">{replicatePayload}</text>

                    {/* Ingest Gateway */}
                    <rect x="165" y="85" width="100" height="70" rx="8" fill="var(--s3-card-bg)" stroke="var(--color-blue)" strokeWidth="1.5" />
                    <text x="215" y="105" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-blue)">🪣 Ingest Gateway</text>
                    <text x="215" y="122" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="600">SSL Handshake</text>
                    <text x="215" y="138" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">Parity Engine</text>

                    {/* AZ-1 (Top Right) */}
                    <rect x="360" y="20" width="120" height="50" rx="6" fill="var(--s3-card-bg)" stroke={replicateStep >= 3 ? 'var(--color-green)' : 'var(--s3-card-border)'} strokeWidth={replicateStep >= 3 ? 2 : 1.5} />
                    <text x="420" y="38" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-text-primary)">🏢 AZ-1 ({urlRegion}a)</text>
                    <text x="420" y="55" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--color-green)">
                      {replicateStep >= 3 ? '✔ COMMITTED' : replicateStep === 2 ? '⏳ WRITING...' : '💤 IDLE'}
                    </text>

                    {/* AZ-2 (Middle Right) */}
                    <rect x="360" y="95" width="120" height="50" rx="6" fill="var(--s3-card-bg)" stroke={replicateStep >= 3 ? 'var(--color-green)' : 'var(--s3-card-border)'} strokeWidth={replicateStep >= 3 ? 2 : 1.5} />
                    <text x="420" y="113" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-text-primary)">🏢 AZ-2 ({urlRegion}b)</text>
                    <text x="420" y="130" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--color-green)">
                      {replicateStep >= 3 ? '✔ COMMITTED' : replicateStep === 2 ? '⏳ WRITING...' : '💤 IDLE'}
                    </text>

                    {/* AZ-3 (Bottom Right) */}
                    <rect x="360" y="170" width="120" height="50" rx="6" fill="var(--s3-card-bg)" stroke={replicateStep >= 3 ? 'var(--color-green)' : 'var(--s3-card-border)'} strokeWidth={replicateStep >= 3 ? 2 : 1.5} />
                    <text x="420" y="188" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-text-primary)">🏢 AZ-3 ({urlRegion}c)</text>
                    <text x="420" y="205" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--color-green)">
                      {replicateStep >= 3 ? '✔ COMMITTED' : replicateStep === 2 ? '⏳ WRITING...' : '💤 IDLE'}
                    </text>

                    {/* Propagation lines */}
                    <path d="M 120 120 L 165 120" stroke={replicateStep >= 1 ? 'var(--color-blue)' : 'var(--s3-card-border)'} strokeWidth="2.5" strokeDasharray={replicateStep === 1 ? "4,4" : "none"} />
                    
                    <path d="M 265 110 L 360 45" fill="none" stroke={replicateStep >= 2 ? 'var(--color-green)' : 'var(--s3-card-border)'} strokeWidth="2" strokeDasharray={replicateStep === 2 ? "4,4" : "none"} />
                    <path d="M 265 120 L 360 120" fill="none" stroke={replicateStep >= 2 ? 'var(--color-green)' : 'var(--s3-card-border)'} strokeWidth="2" strokeDasharray={replicateStep === 2 ? "4,4" : "none"} />
                    <path d="M 265 130 L 360 195" fill="none" stroke={replicateStep >= 2 ? 'var(--color-green)' : 'var(--s3-card-border)'} strokeWidth="2" strokeDasharray={replicateStep === 2 ? "4,4" : "none"} />

                    {/* Animated packets */}
                    {replicateIsRunning && replicateStep === 1 && (
                      <circle r="5" fill="var(--color-blue)">
                        <animateMotion dur="0.6s" repeatCount="indefinite" path="M 120 120 L 165 120" />
                      </circle>
                    )}
                    {replicateIsRunning && replicateStep === 2 && (
                      <>
                        <circle r="4.5" fill="var(--color-green)">
                          <animateMotion dur="0.8s" repeatCount="indefinite" path="M 265 110 L 360 45" />
                        </circle>
                        <circle r="4.5" fill="var(--color-green)">
                          <animateMotion dur="0.8s" repeatCount="indefinite" path="M 265 120 L 360 120" />
                        </circle>
                        <circle r="4.5" fill="var(--color-green)">
                          <animateMotion dur="0.8s" repeatCount="indefinite" path="M 265 130 L 360 195" />
                        </circle>
                      </>
                    )}

                    <text x="250" y="230" textAnchor="middle" fontSize="9.5" fill={replicateStep === 4 ? 'var(--s3-success-text-bold)' : 'var(--color-text-secondary)'} fontWeight="bold">
                      {replicateStep === 4 ? '🎉 100% Replicated cross 3 Availability Zones (PUT 200 OK)' : 'Synchronous parallel write replication pipelines'}
                    </text>
                  </svg>
                </div>
              </div>
            </div>

            {/* Read-After-Write Consistency Simulator */}
            <div className="s3-sec">🔁 S3 Read-After-Write Strong Consistency vs. Eventual Consistency Model</div>
            <div className="s3-card">
              <div className="s3-g2">
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                    Atomic Read-After-Write guarantees vs. Legacy Eventual Mirror Delays
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px', lineHeight: '1.4' }}>
                    S3 now guarantees <b>Strong read-after-write consistency</b> for PUTs and DELETEs of objects in all regions. Toggling eventual consistency illustrates legacy mirror propagation lags.
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Catalog Consistency Model:</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className={`s3-btn ${consistencyMode === 'strong' ? 's3-on' : ''}`} style={{ flex: 1 }} onClick={() => { setConsistencyMode('strong'); setConsistencyLogs([]); setConsistencyReadStep(0); }}>
                        🟢 Strong Read-After-Write (Current)
                      </button>
                      <button className={`s3-btn ${consistencyMode === 'eventual' ? 's3-on' : ''}`} style={{ flex: 1 }} onClick={() => { setConsistencyMode('eventual'); setConsistencyLogs([]); setConsistencyReadStep(0); }}>
                        ⚠️ Eventual Consistency (Legacy Pre-2020)
                      </button>
                    </div>
                  </div>

                  <button className="s3-btn s3-on" style={{ width: '100%', fontWeight: 'bold', background: 'var(--color-purple)', color: '#fff', borderColor: 'var(--color-purple)' }} onClick={handleConsistencySimulation} disabled={consistencyIsRunning}>
                    {consistencyIsRunning ? '⚡ Executing concurrent reads/writes...' : '🚀 Trigger Update PUT & Immediate Read GET'}
                  </button>
                </div>

                <div style={{ background: 'var(--s3-metric-card-bg)', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--s3-card-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Consistency Verification Trace:</div>
                    <div ref={consistencyTerminalRef} className="s3-terminal" style={{ height: '120px' }}>
                      {consistencyLogs.length === 0 ? (
                        <div style={{ color: 'var(--color-text-tertiary)' }}>[idle] Awaiting concurrent transaction trigger...</div>
                      ) : (
                        consistencyLogs.map((log, idx) => (
                          <div key={idx} style={{
                            color: log.includes('❌') || log.includes('⚠️') ? 'var(--color-red)' : log.includes('✅') ? 'var(--color-green)' : 'var(--color-text-secondary)',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            marginBottom: '2px'
                          }}>
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {consistencyReadStep === 3 && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '11.5px',
                      fontWeight: 'bold',
                      background: consistencyMode === 'strong' ? 'var(--s3-success-bg)' : 'var(--s3-error-bg)',
                      border: consistencyMode === 'strong' ? '1.5px solid var(--s3-success-border)' : '1.5px solid var(--s3-error-border)',
                      color: consistencyMode === 'strong' ? 'var(--s3-success-text-bold)' : 'var(--s3-error-text)',
                      textAlign: 'center'
                    }}>
                      {consistencyMode === 'strong' 
                        ? '✅ Atomic transaction succeeded. Reader gets updated Version 2.0.' 
                        : '❌ Eventual Sync Delay matched! Reader gets stale legacy Version 1.0.'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Interactive CORS OPTIONS Preflight Handshake Playground */}
            <div className="s3-sec">🌐 CORS OPTIONS Preflight Handshake Sandbox</div>
            <div className="s3-g2" style={{ marginBottom: '24px' }}>
              <div className="s3-card">
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔒</span> Preflight Parameters Configuration
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                  Configure incoming HTTP request headers to simulate S3 CORS whitelist evaluation.
                </div>

                <div className="s3-g2" style={{ gap: '10px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '10px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Origin Domain</label>
                    <select className="s3-card select" style={{ width: '100%', padding: '6px' }} value={corsOriginInput} onChange={(e) => setCorsOriginInput(e.target.value)}>
                      <option value="https://domain-a.com">https://domain-a.com (Whitelisted)</option>
                      <option value="https://hacker-site.org">https://hacker-site.org (Unlisted)</option>
                      <option value="https://my-app.net">https://my-app.net (Unlisted)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Request Method</label>
                    <select className="s3-card select" style={{ width: '100%', padding: '6px' }} value={corsMethodInput} onChange={(e) => setCorsMethodInput(e.target.value)}>
                      <option value="GET">GET Method (Whitelisted)</option>
                      <option value="PUT">PUT Method (Whitelisted)</option>
                      <option value="DELETE">DELETE Method (Blocked)</option>
                    </select>
                  </div>
                </div>

                <button className="s3-btn s3-on" style={{ width: '100%', fontWeight: 'bold', background: 'var(--color-blue)', color: '#fff', borderColor: 'var(--color-blue)' }} onClick={handleCorsPreflight} disabled={corsAnimationState === 'preflight'}>
                  {corsAnimationState === 'preflight' ? '⌛ Preflight OPTIONS Ping Flight...' : '⚡ Test OPTIONS CORS Preflight'}
                </button>
              </div>

              <div style={{ background: 'var(--s3-metric-card-bg)', border: '1.5px solid var(--s3-card-border)', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>CORS PREFLIGHT RESULTS CONSOLE:</div>
                  <div ref={corsTerminalRef} className="s3-terminal" style={{ height: '110px' }}>
                    {corsLogs.map((log, idx) => (
                      <div key={idx} style={{ color: log.type === 'success' ? 'var(--color-green)' : log.type === 'error' ? 'var(--color-red)' : 'var(--color-blue)', marginBottom: '2px' }}>
                        [{log.timestamp}] {log.message}
                      </div>
                    ))}
                  </div>
                </div>

                {corsAnimationState !== 'idle' && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 'bold',
                    background: corsAnimationState === 'authorized' ? 'var(--s3-success-bg)' : 'var(--s3-error-bg)',
                    border: corsAnimationState === 'authorized' ? '1.5px solid var(--s3-success-border)' : '1.5px solid var(--s3-error-border)',
                    color: corsAnimationState === 'authorized' ? 'var(--s3-success-text-bold)' : 'var(--s3-error-text)',
                    textAlign: 'center'
                  }}>
                    {corsAnimationState === 'preflight' ? '⌛ Dispatching Preflight Ping...' : corsAnimationState === 'authorized' ? '✅ CORS Handshake Accepted! Data flow whitelisted.' : '❌ CORS Handshake Rejected! Browser blocks transfer.'}
                  </div>
                )}
              </div>
            </div>

            {/* 🎨 S3 static web hosting & CORS Preflight SVG Diagram */}
            <div className="s3-sec">S3 Static Web Hosting &amp; Inbound CORS OPTIONS Preflight Handshake Reference</div>
            <div className="s3-card" style={{ textAnchor: 'middle', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                How browsers issue CORS preflight check requests (HTTP OPTIONS) to secure resources across domains.
              </div>
              <svg viewBox="0 0 700 180" width="100%" className="s3-svg-bg">
                <defs>
                  <filter id="s3-shadow-cors" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--s3-terminal-bg)" floodOpacity="0.08" />
                  </filter>
                  <linearGradient id="cors-client-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-bg)" />
                    <stop offset="100%" stopColor="var(--s3-tab-hover-bg)" />
                  </linearGradient>
                  <linearGradient id="cors-gate-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-bg)" />
                    <stop offset="100%" stopColor="var(--s3-tab-hover-bg)" />
                  </linearGradient>
                  <linearGradient id="cors-bucket-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-success-bg)" />
                    <stop offset="100%" stopColor="var(--s3-success-bg)" />
                  </linearGradient>
                  <marker id="arr-repl-teal" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-blue)" /></marker>
                </defs>

                {/* PREMIUM NESTED BOUNDARIES */}
                {/* Public Client Network */}
                <rect x="10" y="10" width="190" height="160" rx="8" fill="var(--s3-metric-card-bg)" fillOpacity="0.4" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                <text x="105" y="22" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)" fontWeight="bold" letterSpacing="0.05em">PUBLIC WEB CLIENT DOMAIN</text>

                {/* AWS S3 Cloud Boundary */}
                <rect x="250" y="10" width="440" height="160" rx="12" fill="var(--s3-success-bg)" fillOpacity="0.25" stroke="var(--color-blue)" strokeWidth="1.5" strokeDasharray="6,4" />
                <text x="470" y="22" textAnchor="middle" fontSize="7" fill="var(--color-blue)" fontWeight="bold" letterSpacing="0.05em">☁️ AWS GLOBAL EDGE (S3 CORS FILTER ENGINE)</text>

                {/* Client Browser */}
                <rect x="25" y="32" width="160" height="126" rx="8" fill="url(#cors-client-grad)" stroke="var(--s3-card-border)" strokeWidth="1.5" filter="url(#s3-shadow-cors)" />
                <text x="105" y="48" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">💻 Client Browser</text>
                <text x="105" y="65" textAnchor="middle" fontSize="9" fill="var(--color-blue)" fontWeight="bold">Origin: {corsOriginInput}</text>
                <text x="105" y="81" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">Sending {corsMethodInput} request</text>
                
                <rect x="35" y="98" width="140" height="46" rx="4" fill="var(--s3-metric-card-bg)" stroke="var(--s3-card-border)" strokeWidth="1" />
                <text x="105" y="110" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">JS Execution Thread</text>
                <text x="105" y="122" textAnchor="middle" fontSize="7" fill="var(--color-blue)" fontFamily="monospace">fetch("https://bucket.s3...")</text>
                <text x="105" y="134" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">HTTP Method: {corsMethodInput}</text>

                {/* Handshake flow lines */}
                {/* Line 1: OPTIONS request */}
                <path id="cors-p1" d="M 185 62 L 270 62" fill="none" 
                  stroke={corsAnimationState === 'preflight' ? 'var(--color-amber)' : corsAnimationState === 'authorized' ? 'var(--color-green)' : corsAnimationState === 'blocked' ? 'var(--color-red)' : 'var(--s3-card-border)'} 
                  strokeWidth="2" 
                  className={corsAnimationState === 'preflight' ? 's3-flow-orange' : corsAnimationState === 'authorized' ? 's3-flow-green' : corsAnimationState === 'blocked' ? 's3-flow-red' : undefined} 
                  strokeDasharray="4,4" />
                <text x="228" y="55" textAnchor="middle" fontSize="8" fontWeight="bold" fill={corsAnimationState === 'preflight' ? 'var(--color-amber)' : corsAnimationState === 'authorized' ? 'var(--color-green)' : corsAnimationState === 'blocked' ? 'var(--color-red)' : 'var(--color-text-secondary)'}>OPTIONS Ping</text>

                {/* Line 2: OPTIONS Response */}
                <path id="cors-p2" d="M 270 88 L 185 88" fill="none" 
                  stroke={corsAnimationState === 'authorized' ? 'var(--color-green)' : corsAnimationState === 'blocked' ? 'var(--color-red)' : 'var(--s3-card-border)'} 
                  strokeWidth="2" 
                  className={corsAnimationState === 'authorized' ? 's3-flow-green' : corsAnimationState === 'blocked' ? 's3-flow-red' : undefined} 
                  strokeDasharray="4,4" />
                <text x="228" y="101" textAnchor="middle" fontSize="8" fontWeight="bold" fill={corsAnimationState === 'authorized' ? 'var(--color-green)' : corsAnimationState === 'blocked' ? 'var(--color-red)' : 'var(--color-text-secondary)'}>Response</text>

                {/* Center CORS Gateway Validator */}
                <rect x="270" y="32" width="160" height="126" rx="8" fill="url(#cors-gate-grad)" stroke="var(--color-blue)" strokeWidth="1.5" filter="url(#s3-shadow-cors)" />
                <text x="350" y="48" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-blue)">🛡️ CORS Firewall Gate</text>
                
                {/* Gate State indicators */}
                {corsAnimationState === 'idle' && (
                  <>
                    <circle cx="350" cy="85" r="16" fill="var(--s3-metric-card-bg)" stroke="var(--s3-card-border)" strokeWidth="1" />
                    <text x="350" y="89" textAnchor="middle" fontSize="10" fill="var(--color-text-secondary)" fontWeight="bold">⏳</text>
                    <text x="350" y="122" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">Awaiting preflight trigger</text>
                  </>
                )}
                {corsAnimationState === 'preflight' && (
                  <>
                    <circle cx="350" cy="85" r="16" fill="var(--s3-error-bg)" stroke="var(--color-amber)" strokeWidth="1.5" />
                    <text x="350" y="89" textAnchor="middle" fontSize="10" fill="var(--color-amber)" fontWeight="bold">⚙️</text>
                    <text x="350" y="122" textAnchor="middle" fontSize="8.5" fill="var(--color-amber)" fontWeight="bold" className="s3-pulse-active">Evaluating CORS...</text>
                  </>
                )}
                {corsAnimationState === 'authorized' && (
                  <>
                    <circle cx="350" cy="85" r="16" fill="var(--s3-success-bg)" stroke="var(--color-green)" strokeWidth="2" />
                    <text x="350" y="89" textAnchor="middle" fontSize="10" fill="var(--s3-success-text-bold)" fontWeight="bold">✔</text>
                    <text x="350" y="122" textAnchor="middle" fontSize="8.5" fill="var(--s3-success-text-bold)" fontWeight="bold">ORIGIN ALLOWED</text>
                  </>
                )}
                {corsAnimationState === 'blocked' && (
                  <>
                    <circle cx="350" cy="85" r="16" fill="var(--s3-error-bg)" stroke="var(--color-red)" strokeWidth="2" />
                    <text x="350" y="89" textAnchor="middle" fontSize="10" fill="var(--color-red)" fontWeight="bold">✘</text>
                    <text x="350" y="122" textAnchor="middle" fontSize="8.5" fill="var(--color-red)" fontWeight="bold">ORIGIN BLOCKED</text>
                  </>
                )}

                {/* Gateway ➔ S3 Data Path */}
                <path d="M 430 90 L 500 90" fill="none" 
                  stroke={corsAnimationState === 'authorized' ? 'var(--color-green)' : 'var(--s3-card-border)'} 
                  strokeWidth="2.5" 
                  className={corsAnimationState === 'authorized' ? 's3-flow-green' : undefined} />
                <text x="465" y="81" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)" fontWeight="bold">Data Tunnel</text>

                {/* Target S3 Bucket */}
                <rect x="500" y="32" width="175" height="126" rx="8" fill="url(#cors-bucket-grad)" stroke="var(--color-green)" strokeWidth="1.5" filter="url(#s3-shadow-cors)" />
                <text x="587" y="48" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--s3-success-text-bold)">🪣 Target S3 Bucket</text>
                <text x="587" y="62" textAnchor="middle" fontSize="8" fill="var(--s3-success-text-bold)" fontFamily="monospace" fontWeight="bold">{bucketNameInput}</text>
                
                <rect x="508" y="74" width="159" height="74" rx="4" fill="var(--s3-card-bg)" stroke="var(--s3-success-border)" strokeWidth="1" />
                <text x="513" y="85" textAnchor="start" fontSize="7.5" fontWeight="bold" fill="var(--color-text-secondary)">Configured CORS Rules:</text>
                <text x="513" y="97" textAnchor="start" fontSize="7" fontFamily="monospace" fill="var(--color-blue)">AllowedOrigin: "https://domain-a.com"</text>
                <text x="513" y="108" textAnchor="start" fontSize="7" fontFamily="monospace" fill="var(--color-blue)">AllowedMethod: "GET", "PUT", "HEAD"</text>
                <text x="513" y="119" textAnchor="start" fontSize="7" fontFamily="monospace" fill="var(--color-blue)">ExposeHeaders: "ETag"</text>
                <text x="513" y="130" textAnchor="start" fontSize="7" fontFamily="monospace" fill="var(--color-blue)">MaxAgeSeconds: 3000</text>

                {/* Animated preflight packets */}
                {corsAnimationState === 'preflight' && (
                  <circle r="4.5" fill="var(--color-amber)">
                    <animateMotion dur="0.8s" repeatCount="indefinite" path="M 185 62 L 270 62" />
                  </circle>
                )}
                {corsAnimationState === 'authorized' && (
                  <>
                    <circle r="4" fill="var(--color-green)">
                      <animateMotion dur="0.8s" repeatCount="indefinite" path="M 270 88 L 185 88" />
                    </circle>
                    <circle r="5" fill="var(--color-green)">
                      <animateMotion dur="0.6s" repeatCount="indefinite" path="M 430 90 L 500 90" />
                    </circle>
                  </>
                )}
                {corsAnimationState === 'blocked' && (
                  <circle r="4.5" fill="var(--color-red)">
                    <animateMotion dur="0.4s" repeatCount="3" path="M 185 62 L 270 62" />
                  </circle>
                )}
              </svg>
            </div>
          </div>
        
          </Translate>)}

        {/* TAB 2: POLICIES & BPA */}
        {!isComparative && activeTab === 'security' && (
          <Translate>
          <div>
            <div className="s3-sec">🛡️ S3 Inbound Request Authorization Pipeline</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                How AWS S3 processes IAM policies, Bucket policies, and Block Public Access (BPA) overrides in series to authorize requests.
              </div>
              <svg viewBox="0 0 700 180" width="100%" className="s3-svg-bg">
                <defs>
                  <filter id="s3-shadow-sec" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--s3-terminal-bg)" floodOpacity="0.08" />
                  </filter>
                  <linearGradient id="gate-bpa-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-error-bg)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--s3-error-border)" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="gate-deny-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-card-bg)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--s3-metric-card-bg)" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="gate-allow-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-success-bg)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--s3-success-border)" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="ingress-node-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-card-bg)" />
                    <stop offset="100%" stopColor="var(--s3-bg)" />
                  </linearGradient>
                </defs>

                {/* PREMIUM NESTED BOUNDARIES */}
                {/* Public Ingress Network */}
                <rect x="8" y="10" width="122" height="160" rx="8" fill="var(--s3-metric-card-bg)" fillOpacity="0.45" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                <text x="69" y="22" textAnchor="middle" fontSize="7" fill="var(--color-text-tertiary)" fontWeight="bold" letterSpacing="0.05em">INGRESS TRAFFIC</text>

                {/* AWS S3 Policy Engine Layer */}
                <rect x="140" y="10" width="470" height="160" rx="12" fill="var(--s3-success-bg)" fillOpacity="0.25" stroke="var(--color-blue)" strokeWidth="1.5" strokeDasharray="6,4" />
                <text x="375" y="22" textAnchor="middle" fontSize="7" fill="var(--color-blue)" fontWeight="bold" letterSpacing="0.05em">☁️ AWS S3 POLICY &amp; SECURITY EVALUATION ENGINE</text>

                {/* Result Boundary */}
                <rect x="620" y="10" width="72" height="160" rx="8" fill="var(--s3-metric-card-bg)" fillOpacity="0.45" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                <text x="656" y="22" textAnchor="middle" fontSize="7" fill="var(--color-text-tertiary)" fontWeight="bold" letterSpacing="0.05em">RESULT</text>

                {/* Client Ingress Request Node */}
                <rect x="15" y="38" width="105" height="114" rx="8" fill="url(#ingress-node-grad)" stroke="var(--s3-card-border)" strokeWidth="1.5" filter="url(#s3-shadow-sec)" />
                <text x="67" y="58" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">💻 Inbound Req</text>
                <text x="67" y="78" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)" fontWeight="600" fontFamily="monospace">GET/PUT Object</text>
                
                <rect x="22" y="90" width="91" height="48" rx="4" fill="var(--s3-metric-card-bg)" stroke="var(--s3-card-border)" strokeWidth="1" />
                <text x="67" y="102" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">Source Channel:</text>
                <text x="67" y="114" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold" fontFamily="monospace">
                  {ingressTrafficSource === 'internet' ? 'Internet-HTTP' :
                   ingressTrafficSource === 'https_user' ? 'HTTPS-Client' :
                   ingressTrafficSource === 'http_user' ? 'HTTP-Client' : 'AWS-VPC-VPCE'}
                </text>
                <text x="67" y="126" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">Template: {selectedPolicyTemplate}</text>

                {/* Path Segment 1 */}
                <path d="M 120 90 L 150 90" fill="none" stroke="var(--color-blue)" strokeWidth="2.5" className="s3-flow-blue" />

                {/* Gate 1: BPA Override Shield */}
                <rect x="150" y="38" width="110" height="114" rx="8" 
                  fill={selectedPolicyTemplate === 'public' && bpaPolicies ? 'var(--s3-error-bg)' : 'url(#gate-bpa-grad)'} 
                  stroke={selectedPolicyTemplate === 'public' && bpaPolicies ? 'var(--color-red)' : 'var(--color-amber)'} 
                  strokeWidth="1.5" filter="url(#s3-shadow-sec)" />
                <text x="205" y="58" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">Gate 1: BPA</text>
                <text x="205" y="76" textAnchor="middle" fontSize="8.5" fill="var(--color-text-secondary)">Block Public</text>
                <text x="205" y="89" textAnchor="middle" fontSize="8.5" fill="var(--color-text-secondary)">Access Override</text>
                
                <rect x="158" y="102" width="94" height="38" rx="4" fill="var(--s3-card-bg)" fillOpacity="0.8" stroke={selectedPolicyTemplate === 'public' && bpaPolicies ? 'var(--s3-error-border)' : 'var(--color-amber)'} strokeWidth="1" />
                <text x="205" y="114" textAnchor="middle" fontSize="8" fontWeight="bold" 
                  fill={selectedPolicyTemplate === 'public' && bpaPolicies ? 'var(--color-red)' : 'var(--color-green)'}>
                  {selectedPolicyTemplate === 'public' && bpaPolicies ? '❌ BLOCKED' : '🟢 PASSED'}
                </text>
                <text x="205" y="126" textAnchor="middle" fontSize="7.5" fill="var(--color-text-tertiary)">
                  {bpaPolicies ? 'BPA: Enabled' : 'BPA: Disabled'}
                </text>

                {/* Path Segment 2 */}
                {(() => {
                  const isBpaBlocked = selectedPolicyTemplate === 'public' && bpaPolicies;
                  return (
                    <path d="M 260 90 L 310 90" fill="none" 
                      stroke={isBpaBlocked ? 'var(--s3-card-border)' : 'var(--color-blue)'} 
                      strokeWidth="2.5" 
                      className={isBpaBlocked ? undefined : 's3-flow-blue'} />
                  );
                })()}

                {/* Gate 2: Explicit Deny Logic */}
                {(() => {
                  const isSSLDeny = selectedPolicyTemplate === 'https' && ingressTrafficSource !== 'https_user';
                  const isVPCEDeny = selectedPolicyTemplate === 'vpce' && ingressTrafficSource !== 'vpce_ip';
                  const isBpaBlocked = selectedPolicyTemplate === 'public' && bpaPolicies;
                  const isDenyActive = !isBpaBlocked && (isSSLDeny || isVPCEDeny);
                  return (
                    <>
                      <rect x="310" y="38" width="120" height="114" rx="8" 
                        fill={isBpaBlocked ? 'var(--s3-metric-card-bg)' : isDenyActive ? 'var(--s3-error-bg)' : 'url(#gate-deny-grad)'} 
                        stroke={isBpaBlocked ? 'var(--s3-card-border)' : isDenyActive ? 'var(--color-red)' : 'var(--color-purple)'} 
                        strokeWidth="1.5" filter="url(#s3-shadow-sec)" />
                      <text x="370" y="58" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">Gate 2: Denies</text>
                      <text x="370" y="76" textAnchor="middle" fontSize="8.5" fill="var(--color-text-secondary)">Conditionals</text>
                      <text x="370" y="89" textAnchor="middle" fontSize="8.5" fill="var(--color-text-secondary)">&amp; Explicit Deny</text>
                      
                      <rect x="318" y="102" width="104" height="38" rx="4" fill="var(--s3-card-bg)" fillOpacity="0.8" stroke={isDenyActive ? 'var(--s3-error-border)' : 'var(--color-purple)'} strokeWidth="1" />
                      <text x="370" y="114" textAnchor="middle" fontSize="8" fontWeight="bold" 
                        fill={isBpaBlocked ? 'var(--color-text-tertiary)' : isDenyActive ? 'var(--color-red)' : 'var(--color-green)'}>
                        {isBpaBlocked ? '💤 BYPASSED' : isDenyActive ? '❌ DENIED' : '🟢 PASSED'}
                      </text>
                      <text x="370" y="126" textAnchor="middle" fontSize="7" fill="var(--color-text-tertiary)">
                        {isDenyActive ? 'Deny Triggered' : 'No Deny Match'}
                      </text>
                    </>
                  );
                })()}

                {/* Path Segment 3 */}
                {(() => {
                  const isBpaBlocked = selectedPolicyTemplate === 'public' && bpaPolicies;
                  const isSSLDeny = selectedPolicyTemplate === 'https' && ingressTrafficSource !== 'https_user';
                  const isVPCEDeny = selectedPolicyTemplate === 'vpce' && ingressTrafficSource !== 'vpce_ip';
                  const isDenyBlocked = isSSLDeny || isVPCEDeny;
                  const isBlocked = isBpaBlocked || isDenyBlocked;
                  return (
                    <path d="M 430 90 L 480 90" fill="none" 
                      stroke={isBlocked ? 'var(--s3-card-border)' : 'var(--color-blue)'} 
                      strokeWidth="2.5" 
                      className={isBlocked ? undefined : 's3-flow-blue'} />
                  );
                })()}

                {/* Gate 3: Explicit Allow checks */}
                {(() => {
                  const isBpaBlocked = selectedPolicyTemplate === 'public' && bpaPolicies;
                  const isSSLDeny = selectedPolicyTemplate === 'https' && ingressTrafficSource !== 'https_user';
                  const isVPCEDeny = selectedPolicyTemplate === 'vpce' && ingressTrafficSource !== 'vpce_ip';
                  const isDenyBlocked = isSSLDeny || isVPCEDeny;
                  
                  const isAllowed = !isBpaBlocked && !isDenyBlocked && (
                    (selectedPolicyTemplate === 'public') ||
                    (selectedPolicyTemplate === 'https' && ingressTrafficSource === 'https_user') ||
                    (selectedPolicyTemplate === 'vpce' && ingressTrafficSource === 'vpce_ip')
                  );
                  const isBlocked = isBpaBlocked || isDenyBlocked;
                  return (
                    <>
                      <rect x="480" y="38" width="120" height="114" rx="8" 
                        fill={isBlocked ? 'var(--s3-metric-card-bg)' : isAllowed ? 'url(#gate-allow-grad)' : 'var(--s3-error-bg)'} 
                        stroke={isBlocked ? 'var(--s3-card-border)' : isAllowed ? 'var(--color-green)' : 'var(--color-red)'} 
                        strokeWidth="1.5" filter="url(#s3-shadow-sec)" />
                      <text x="540" y="58" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">Gate 3: Allows</text>
                      <text x="540" y="76" textAnchor="middle" fontSize="8.5" fill="var(--color-text-secondary)">Resource Policy</text>
                      <text x="540" y="89" textAnchor="middle" fontSize="8.5" fill="var(--color-text-secondary)">Allow Whitelists</text>
                      
                      <rect x="488" y="102" width="104" height="38" rx="4" fill="var(--s3-card-bg)" fillOpacity="0.8" stroke={isBlocked ? 'var(--s3-card-border)' : isAllowed ? 'var(--s3-success-border)' : 'var(--s3-error-border)'} strokeWidth="1" />
                      <text x="540" y="114" textAnchor="middle" fontSize="8" fontWeight="bold" 
                        fill={isBlocked ? 'var(--color-text-tertiary)' : isAllowed ? 'var(--color-green)' : 'var(--color-red)'}>
                        {isBlocked ? '💤 BYPASSED' : isAllowed ? '🟢 ALLOWED' : '❌ NO MATCH'}
                      </text>
                      <text x="540" y="126" textAnchor="middle" fontSize="7" fill="var(--color-text-tertiary)">
                        {isAllowed ? 'Allow Matched' : 'Implicit Deny'}
                      </text>
                    </>
                  );
                })()}

                {/* Path Segment 4 */}
                {(() => {
                  const isBpaBlocked = selectedPolicyTemplate === 'public' && bpaPolicies;
                  const isSSLDeny = selectedPolicyTemplate === 'https' && ingressTrafficSource !== 'https_user';
                  const isVPCEDeny = selectedPolicyTemplate === 'vpce' && ingressTrafficSource !== 'vpce_ip';
                  const isDenyBlocked = isSSLDeny || isVPCEDeny;
                  
                  const isAllowed = !isBpaBlocked && !isDenyBlocked && (
                    (selectedPolicyTemplate === 'public') ||
                    (selectedPolicyTemplate === 'https' && ingressTrafficSource === 'https_user') ||
                    (selectedPolicyTemplate === 'vpce' && ingressTrafficSource === 'vpce_ip')
                  );
                  return (
                    <path d="M 600 90 L 630 90" fill="none" 
                      stroke={ingressPacketStatus === 'idle' ? 'var(--s3-card-border)' : isAllowed ? 'var(--color-green)' : 'var(--color-red)'} 
                      strokeWidth="2.5" 
                      className={ingressPacketStatus === 'idle' ? undefined : isAllowed ? 's3-flow-green' : 's3-flow-red'} />
                  );
                })()}

                {/* Decision Result Node */}
                {(() => {
                  const isBpaBlocked = selectedPolicyTemplate === 'public' && bpaPolicies;
                  const isSSLDeny = selectedPolicyTemplate === 'https' && ingressTrafficSource !== 'https_user';
                  const isVPCEDeny = selectedPolicyTemplate === 'vpce' && ingressTrafficSource !== 'vpce_ip';
                  const isDenyBlocked = isSSLDeny || isVPCEDeny;
                  
                  const isAllowed = !isBpaBlocked && !isDenyBlocked && (
                    (selectedPolicyTemplate === 'public') ||
                    (selectedPolicyTemplate === 'https' && ingressTrafficSource === 'https_user') ||
                    (selectedPolicyTemplate === 'vpce' && ingressTrafficSource === 'vpce_ip')
                  );
                  return (
                    <>
                      <circle cx="652" cy="90" r="22" 
                        fill={ingressPacketStatus === 'idle' ? 'var(--s3-metric-card-bg)' : isAllowed ? 'var(--s3-success-bg)' : 'var(--s3-error-bg)'} 
                        stroke={ingressPacketStatus === 'idle' ? 'var(--s3-card-border)' : isAllowed ? 'var(--color-green)' : 'var(--color-red)'} 
                        strokeWidth="2" filter="url(#s3-shadow-sec)" />
                      <text x="652" y="94" textAnchor="middle" fontSize="10.5" fontWeight="bold" 
                        fill={ingressPacketStatus === 'idle' ? 'var(--color-text-secondary)' : isAllowed ? 'var(--s3-success-text-bold)' : 'var(--s3-error-text-bold)'}>
                        {ingressPacketStatus === 'idle' ? '⏳' : isAllowed ? '✔ OK' : '✘ Deny'}
                      </text>
                    </>
                  );
                })()}

                {/* Ingress Packet Animating Motion */}
                {ingressPacketStatus === 'testing' && (() => {
                  const isBpaBlocked = selectedPolicyTemplate === 'public' && bpaPolicies;
                  const isSSLDeny = selectedPolicyTemplate === 'https' && ingressTrafficSource !== 'https_user';
                  const isVPCEDeny = selectedPolicyTemplate === 'vpce' && ingressTrafficSource !== 'vpce_ip';
                  const isDenyBlocked = isSSLDeny || isVPCEDeny;
                  
                  const isAllowed = !isBpaBlocked && !isDenyBlocked && (
                    (selectedPolicyTemplate === 'public') ||
                    (selectedPolicyTemplate === 'https' && ingressTrafficSource === 'https_user') ||
                    (selectedPolicyTemplate === 'vpce' && ingressTrafficSource === 'vpce_ip')
                  );

                  let motionPath = "M 60 90 L 652 90";
                  if (isBpaBlocked) motionPath = "M 60 90 L 205 90";
                  else if (isDenyBlocked) motionPath = "M 60 90 L 370 90";
                  else if (!isAllowed) motionPath = "M 60 90 L 540 90";

                  return (
                    <circle r="6" fill={isAllowed ? 'var(--color-green)' : 'var(--color-red)'}>
                      <animateMotion dur="1s" repeatCount="1" fill="freeze" path={motionPath} />
                    </circle>
                  );
                })()}
              </svg>
            </div>

            {/* 🎮 Interactive Playground */}
            <div className="s3-sec">🛡️ Bucket Policy &amp; Public override playground</div>
            <div className="s3-card">
              <div className="s3-g2">
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 600 }}>📝 JSON Policy Editor:</span>
                    <button
                      onClick={() => setBucketPolicyText(BUCKET_POLICIES[selectedPolicyTemplate])}
                      className="s3-btn"
                      style={{ fontSize: '11px', padding: '2px 8px' }}
                    >
                      🔄 Reset to Template
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                    <button className={`s3-btn ${selectedPolicyTemplate === 'public' ? 's3-on' : ''}`} onClick={() => setSelectedPolicyTemplate('public')}>🌍 Public Read</button>
                    <button className={`s3-btn ${selectedPolicyTemplate === 'https' ? 's3-on' : ''}`} onClick={() => setSelectedPolicyTemplate('https')}>🔒 Enforce SSL</button>
                    <button className={`s3-btn ${selectedPolicyTemplate === 'vpce' ? 's3-on' : ''}`} onClick={() => setSelectedPolicyTemplate('vpce')}>🔌 Restrict VPC Endpoint</button>
                  </div>
                  <textarea
                    value={bucketPolicyText}
                    onChange={e => setBucketPolicyText(e.target.value)}
                    rows={12}
                    style={{
                      background: 'var(--s3-terminal-bg)',
                      color: 'var(--s3-terminal-color)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '11.5px',
                      border: '1.5px solid var(--color-border-secondary)',
                      borderRadius: '8px',
                      padding: '10px',
                      width: '100%',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {policyValidationError && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: '4px', color: '#b91c1c', fontSize: '11px', fontFamily: 'monospace', marginTop: '6px' }}>
                      ⚠️ Syntax Error: {policyValidationError}
                    </div>
                  )}
                </div>

                <div style={{ background: 'var(--color-background-secondary)', padding: '12px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, marginBottom: '8px' }}>📡 Policy Ingress Traffic Simulator</div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Select Inbound Connection Source:</label>
                    <select className="s3-card select" value={ingressTrafficSource} onChange={e => setIngressTrafficSource(e.target.value as any)} style={{ padding: '4px 8px', fontSize: '11.5px', width: '100%' }}>
                      <option value="internet">Global Internet User (HTTP, Unsecured)</option>
                      <option value="https_user">Secure HTTPS User (Global SSL Web Traffic)</option>
                      <option value="http_user">Standard HTTP User (No Secure TLS Transport)</option>
                      <option value="vpce_ip">VPC Endpoint Client (IP Routing via vpce-xxx)</option>
                    </select>
                  </div>

                  <button onClick={testPolicyIngress} className="s3-btn s3-on" style={{ width: '100%', marginBottom: '10px', fontWeight: 'bold' }}>
                    Dispatch Test Packet to Bucket
                  </button>

                  <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)' }}>
                    <div style={{ fontWeight: 600, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      Status:
                      {ingressPacketStatus === 'idle' && <span style={{ color: '#64748b' }}>💤 Idle</span>}
                      {ingressPacketStatus === 'testing' && <span style={{ color: '#eab308' }}>⚡ Evaluating policy conditions...</span>}
                      {ingressPacketStatus === 'allowed' && <span style={{ color: '#10b981' }}>✅ ALLOWED (HTTP 200)</span>}
                      {ingressPacketStatus === 'blocked' && <span style={{ color: '#ef4444' }}>❌ BLOCKED (HTTP 403 Access Denied)</span>}
                    </div>
                    {ingressExplanation && (
                      <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                        {ingressExplanation}
                      </div>
                    )}
                    {ingressPacketStatus === 'blocked' && bpaPolicies && selectedPolicyTemplate === 'public' && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: '#fef2f2',
                        border: '1.5px dashed #dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        animation: 'pulse-red 1.5s infinite alternate'
                      }}>
                        <div style={{ fontSize: '28px' }}>🛡️💥</div>
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#991b1b', fontSize: '11.5px' }}>BPA FIREWALL SHIELD ENGAGED</div>
                          <div style={{ color: '#7f1d1d', fontSize: '10px', lineHeight: '1.3' }}>
                            S3 Block Public Access actively overrode the `Principal: "*"` Allow rule. Public packet discarded at Gate 1.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Policy Ingress Trace Logs:</div>
                    <div ref={policyTerminalRef} className="s3-terminal" style={{ height: '110px' }}>
                      {policyEvaluationLogs.length === 0 ? (
                        <div style={{ color: '#64748b' }}>[idle] Awaiting inbound test packet dispatch...</div>
                      ) : (
                        policyEvaluationLogs.map((log, idx) => (
                          <div key={idx} style={{
                            color: log.includes('❌') ? 'var(--color-red)' : log.includes('✅') ? 'var(--color-green)' : log.includes('⚠️') ? 'var(--color-amber)' : 'var(--s3-terminal-color)',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            marginBottom: '2px'
                          }}>
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="s3-card">
              <div className="s3-g2">
                <div style={{ background: 'var(--color-background-secondary)', padding: '12px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input type="checkbox" checked={bpaAcls} onChange={e => setBpaAcls(e.target.checked)} id="bpaAcls" />
                    <label htmlFor="bpaAcls" style={{ fontWeight: 600, fontSize: '11.5px', cursor: 'pointer' }}>Block Public ACLs (Anywhere / New)</label>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)' }}>
                    Blocks objects written with public ACL headers (e.g. `x-amz-acl: public-read`) and retroactively disables existing public ACL targets.
                  </div>
                </div>

                <div style={{ background: 'var(--color-background-secondary)', padding: '12px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <input type="checkbox" checked={bpaPolicies} onChange={e => setBpaPolicies(e.target.checked)} id="bpaPolicies" />
                    <label htmlFor="bpaPolicies" style={{ fontWeight: 600, fontSize: '11.5px', cursor: 'pointer' }}>Block Public Bucket Policies Override</label>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)' }}>
                    Blocks resource-based bucket policies that specify public wildcards (e.g. `Principal: "*"`) from ever launching public reads.
                  </div>
                </div>
              </div>
            </div>
          </div>
        
          </Translate>)}

        {/* TAB 3: ENCRYPTION */}
        {!isComparative && activeTab === 'encryption' && (
          <Translate>
          <div>

            {/* 🎮 Interactive Playground */}
            <div className="s3-sec">🔒 SSE Envelope write execution simulator</div>
            <div className="s3-card">
              <div className="s3-g2">
                <div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', cursor: 'pointer' }}>
                      <input type="radio" name="enc" checked={encryptionType === 'sse-s3'} onChange={() => setEncryptionType('sse-s3')} />
                      <div><b>SSE-S3:</b> AES-256 S3-Managed Master Key (Simple, automatic)</div>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', cursor: 'pointer' }}>
                      <input type="radio" name="enc" checked={encryptionType === 'sse-kms'} onChange={() => setEncryptionType('sse-kms')} />
                      <div><b>SSE-KMS:</b> AWS KMS Managed Key (Configurable rotation &amp; audits)</div>
                    </label>
                    {encryptionType === 'sse-kms' && (
                      <div style={{ marginLeft: '20px', marginBottom: '4px' }}>
                        <label style={{ fontSize: '10px', display: 'block', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>KMS CMK ARN:</label>
                        <input
                          type="text"
                          value={customKmsArn}
                          onChange={e => setCustomKmsArn(e.target.value)}
                          style={{ width: '100%', padding: '4px 6px', fontSize: '10.5px', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px' }}
                        />
                      </div>
                    )}

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', cursor: 'pointer' }}>
                      <input type="radio" name="enc" checked={encryptionType === 'sse-c'} onChange={() => setEncryptionType('sse-c')} />
                      <div><b>SSE-C:</b> Customer Managed AES-256 keys (No keys stored in AWS)</div>
                    </label>
                    {encryptionType === 'sse-c' && (
                      <div style={{ marginLeft: '20px', marginBottom: '4px' }}>
                        <label style={{ fontSize: '10px', display: 'block', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Customer 256-bit AES Key (Base64 - 44 Chars):</label>
                        <input
                          type="text"
                          value={customSsecKey}
                          onChange={e => setCustomSsecKey(e.target.value)}
                          style={{ width: '100%', padding: '4px 6px', fontSize: '10.5px', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px' }}
                        />
                      </div>
                    )}

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', cursor: 'pointer' }}>
                      <input type="radio" name="enc" checked={encryptionType === 'dsse-kms'} onChange={() => setEncryptionType('dsse-kms')} />
                      <div><b>DSSE-KMS:</b> Dual-Layer AWS KMS Key (Double ciphers, FIPS 140-3 WORM)</div>
                    </label>
                    {encryptionType === 'dsse-kms' && (
                      <div style={{ marginLeft: '20px', marginBottom: '4px' }}>
                        <label style={{ fontSize: '10px', display: 'block', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>KMS CMK A &amp; B ARNs (Dual-Keys):</label>
                        <input
                          type="text"
                          value={customKmsArn + ', ' + customKmsArn.replace('key/', 'key/9b8a')}
                          disabled
                          style={{ width: '100%', padding: '4px 6px', fontSize: '10.5px', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: '4px', opacity: 0.8 }}
                        />
                      </div>
                    )}
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', display: 'block', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Write Object Payload String:</label>
                    <input
                      type="text"
                      value={uploadContent}
                      onChange={e => setUploadContent(e.target.value)}
                      style={{ width: '100%', padding: '6px', fontSize: '11.5px', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: '6px' }}
                    />
                  </div>

                  <button onClick={testEncryption} className="s3-btn s3-on" style={{ width: '100%', fontWeight: 'bold' }}>
                    Execute SSE Envelope Write
                  </button>
                </div>

                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, marginBottom: '10px' }}>⚡ SSE Horizontal Progress Pipeline</div>

                  {/* Horizontal progress steps */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', height: '2px', background: 'var(--s3-terminal-border)', zIndex: 1 }} />
                    <div style={{ position: 'absolute', top: '10px', left: '10px', width: `${((Math.max(1, encryptionStep) - 1) / 4) * 100}%`, height: '2px', background: 'var(--color-green)', zIndex: 1, transition: 'width 0.4s' }} />

                    {[
                      { s: 1, text: 'Client' },
                      { s: 2, text: 'Hypervisor' },
                      { s: 3, text: 'KMS Key' },
                      { s: 4, text: 'RAM Shred' },
                      { s: 5, text: 'Disk Disk' }
                    ].map(step => (
                      <div key={step.s} style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          background: encryptionStep >= step.s ? 'var(--color-green)' : 'var(--s3-terminal-border)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10.5px',
                          fontWeight: 'bold',
                          border: '2px solid var(--s3-terminal-border)',
                          transition: 'background 0.3s'
                        }}>
                          {step.s}
                        </div>
                        <span style={{ fontSize: '9px', marginTop: '2px', color: encryptionStep >= step.s ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>{step.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Encryption hex output display */}
                  <div style={{ background: 'var(--s3-terminal-bg)', padding: '10px', borderRadius: '6px', border: '1px solid var(--s3-terminal-border)', marginBottom: '10px', fontSize: '11px', fontFamily: 'monospace' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Plaintext Key (hypervisor RAM):</span>
                      <span style={{ color: plaintextKeyHex ? 'var(--color-amber)' : 'var(--color-red)', fontWeight: 'bold' }}>
                        {plaintextKeyHex ? plaintextKeyHex.substring(0, 16) + '...' : '[SCRUBBED / ZEROIZED]'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Encrypted Key (sector metadata):</span>
                      <span style={{ color: encryptedKeyHex ? 'var(--color-green)' : 'var(--color-text-tertiary)' }}>
                        {encryptedKeyHex ? encryptedKeyHex.substring(0, 16) + '...' : '[Awaiting encryption]'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Encryption execution Logs:</div>
                    <div ref={encryptionTerminalRef} className="s3-terminal" style={{ height: '110px' }}>
                      {encryptionLogs.length === 0 ? (
                        <div style={{ color: 'var(--color-text-tertiary)' }}>[idle] Awaiting envelope write simulation...</div>
                      ) : (
                        encryptionLogs.map((log, idx) => (
                          <div key={idx} style={{
                            color: log.includes('❌') ? 'var(--color-red)' : log.includes('✅') ? 'var(--color-green)' : log.includes('⚠️') ? 'var(--color-amber)' : 'var(--s3-terminal-color)',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            marginBottom: '2px'
                          }}>
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* 🎨 Dynamic Architectural SVG based on selection */}
            <div className="s3-sec">
              {encryptionType === 'sse-s3' && '🔒 SSE-S3: S3-Managed Server-Side Encryption'}
              {encryptionType === 'sse-kms' && '🔐 SSE-KMS: AWS KMS Key Server-Side Envelope Ingestion'}
              {encryptionType === 'sse-c' && '💼 SSE-C: Customer-Provided Key Server-Side Encryption'}
              {encryptionType === 'dsse-kms' && '🛡️ DSSE-KMS: Dual-Layer KMS Server-Side Envelope Encryption'}
            </div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                {encryptionType === 'sse-s3' && 'Default encryption method. S3 automatically encrypts object blocks in transit using standard AES-256, managed entirely by AWS.'}
                {encryptionType === 'sse-kms' && 'Enables key rotation schedules and audit controls. AWS KMS generates plaintext data keys to encrypt blocks in RAM, then shreds the plaintext key, preserving only the encrypted key.'}
                {encryptionType === 'sse-c' && 'You provide the key in the HTTP header over HTTPS. S3 performs symmetric ciphers in RAM and erases the key. S3 never stores your key.'}
                {encryptionType === 'dsse-kms' && 'Double-layer envelope protection. S3 requests two distinct master keys from KMS, executing two independent layers of AES-256 symmetric ciphers on object payloads for extreme compliance (FIPS 140-3).'}
              </div>

              {encryptionType === 'sse-s3' && (
                <svg viewBox="0 0 700 180" width="100%" className="s3-svg-bg">
                  <defs>
                    <filter id="s3-shadow-sse3" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--color-blue)" floodOpacity="0.08" />
                    </filter>
                    <linearGradient id="client-sse3-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--s3-grad-client-start)" />
                      <stop offset="100%" stopColor="var(--s3-grad-client-end)" />
                    </linearGradient>
                    <linearGradient id="engine-sse3-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--s3-grad-engine-start)" />
                      <stop offset="100%" stopColor="var(--s3-grad-engine-end)" />
                    </linearGradient>
                    <linearGradient id="disk-sse3-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--s3-grad-disk-start)" />
                      <stop offset="100%" stopColor="var(--s3-grad-disk-end)" />
                    </linearGradient>
                  </defs>

                  {/* PREMIUM NESTED BOUNDARIES */}
                  {/* Public Client Network */}
                  <rect x="8" y="10" width="162" height="160" rx="8" fill="var(--s3-metric-card-bg)" fillOpacity="0.45" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="89" y="22" textAnchor="middle" fontSize="7" fill="var(--color-text-tertiary)" fontWeight="bold" letterSpacing="0.05em">PUBLIC CLIENT NETWORK SUBNET</text>

                  {/* AWS Cloud Core */}
                  <rect x="180" y="10" width="512" height="160" rx="12" fill="rgba(240, 253, 250, 0.25)" stroke="var(--color-blue)" strokeWidth="1.5" strokeDasharray="6,4" />
                  <text x="436" y="22" textAnchor="middle" fontSize="7" fill="var(--color-blue)" fontWeight="bold" letterSpacing="0.05em">☁️ AWS SECURE REGIONAL INFRASTRUCTURE (SSE-S3 ENGINE)</text>

                  {/* User Client */}
                  <rect x="20" y="38" width="138" height="114" rx="8" fill="url(#client-sse3-grad)" stroke="var(--s3-card-border)" strokeWidth="1.5" filter="url(#s3-shadow-sse3)" />
                  <text x="89" y="58" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">💻 Client Browser</text>
                  
                  <rect x="28" y="74" width="122" height="64" rx="4" fill="var(--s3-card-bg)" stroke="var(--s3-card-border)" strokeWidth="1" />
                  <text x="89" y="88" textAnchor="middle" fontSize="8" fill="var(--color-blue)" fontWeight="bold">Ingress Write Command</text>
                  <text x="89" y="103" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontFamily="monospace">x-amz-server-side-</text>
                  <text x="89" y="117" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontFamily="monospace">encryption: AES-256</text>

                  {/* Flow Arrow */}
                  <path d="M 158 90 L 210 90" fill="none" 
                    stroke={encryptionStep === 1 ? '#3b82f6' : '#cbd5e1'} 
                    strokeWidth="2.5" 
                    className={encryptionStep === 1 ? 's3-flow-blue' : undefined} />
                  <text x="184" y="81" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="bold">Upload</text>

                  {/* S3 Service Node */}
                  <rect x="210" y="38" width="230" height="114" rx="8" fill="url(#engine-sse3-grad)" stroke="var(--color-green)" strokeWidth="1.5" filter="url(#s3-shadow-sse3)" />
                  <text x="325" y="58" textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--color-green)">🪣 S3 Service Engine</text>
                  <text x="325" y="74" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)" fontWeight="600">AWS-Managed Symmetric Cipher</text>
                  
                  <rect x="220" y="86" width="210" height="52" rx="4" fill="var(--s3-card-bg)" fillOpacity="0.8" stroke="var(--s3-success-border)" strokeWidth="1" />
                  <text x="325" y="99" textAnchor="middle" fontSize="8.5" fill="var(--s3-success-text-bold)" fontWeight="bold">S3 Master Key (AES-256 Block)</text>
                  <text x="325" y="112" textAnchor="middle" fontSize="8" fill="var(--color-green)">Plaintext Key Scrubbed from RAM</text>
                  <text x="325" y="125" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="bold" fontStyle="italic">🔒 Zero-Footprint Buffer</text>

                  {/* Flow Arrow */}
                  <path d="M 440 90 L 490 90" fill="none" 
                    stroke={encryptionStep >= 2 && encryptionStep <= 4 ? '#22c55e' : '#cbd5e1'} 
                    strokeWidth="2.5" 
                    className={encryptionStep >= 2 && encryptionStep <= 4 ? 's3-flow-green' : undefined} />
                  <text x="465" y="81" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="bold">Commit</text>

                  {/* S3 Storage Target */}
                  <rect x="490" y="38" width="190" height="114" rx="8" fill="url(#disk-sse3-grad)" stroke="var(--color-blue)" strokeWidth="1.5" filter="url(#s3-shadow-sse3)" />
                  <text x="585" y="58" textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--color-text-primary)">🗄️ SSD Target Sector</text>
                  
                  <rect x="498" y="72" width="174" height="66" rx="4" fill="var(--s3-card-bg)" fillOpacity="0.8" stroke="var(--s3-card-border)" strokeWidth="1" />
                  <text x="585" y="86" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="var(--color-text-primary)">🔒 Encrypted Payload Block</text>
                  <text x="585" y="101" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">At-Rest Storage (AES-GCM)</text>
                  <text x="585" y="116" textAnchor="middle" fontSize="7" fill="var(--color-green)" fontWeight="bold">Auto-Decryption on Authenticated GET</text>

                  {/* Active Animation Stream */}
                  {encryptionStep === 1 && (
                    <circle r="4.5" fill="var(--color-blue)">
                      <animateMotion dur="0.6s" repeatCount="indefinite" path="M 158 90 L 210 90" />
                    </circle>
                  )}
                  {encryptionStep >= 2 && encryptionStep <= 4 && (
                    <circle r="4.5" fill="var(--color-green)">
                      <animateMotion dur="0.6s" repeatCount="indefinite" path="M 440 90 L 490 90" />
                    </circle>
                  )}
                </svg>
              )}

              {encryptionType === 'sse-kms' && (
                <svg viewBox="0 0 700 190" width="100%" className="s3-svg-bg">
                  <defs>
                    <filter id="s3-shadow-ssekms" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--color-blue)" floodOpacity="0.08" />
                    </filter>
                    <linearGradient id="client-kms-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--s3-grad-client-start)" />
                      <stop offset="100%" stopColor="var(--s3-grad-client-end)" />
                    </linearGradient>
                    <linearGradient id="engine-kms-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--s3-grad-kms-start)" />
                      <stop offset="100%" stopColor="var(--s3-grad-kms-end)" />
                    </linearGradient>
                    <linearGradient id="hsm-kms-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--s3-grad-hsm-start)" />
                      <stop offset="100%" stopColor="var(--s3-grad-hsm-end)" />
                    </linearGradient>
                    <linearGradient id="disk-kms-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--s3-card-border)" />
                      <stop offset="100%" stopColor="var(--s3-grad-engine-end)" />
                    </linearGradient>
                  </defs>

                  {/* PREMIUM NESTED BOUNDARIES */}
                  {/* Public Client Network */}
                  <rect x="8" y="10" width="142" height="170" rx="8" fill="var(--s3-metric-card-bg)" fillOpacity="0.45" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="79" y="22" textAnchor="middle" fontSize="7" fill="var(--color-text-tertiary)" fontWeight="bold" letterSpacing="0.05em">PUBLIC CLIENT NETWORK</text>

                  {/* AWS Cloud Core */}
                  <rect x="156" y="10" width="536" height="170" rx="12" fill="rgba(240, 253, 250, 0.25)" stroke="var(--color-blue)" strokeWidth="1.5" strokeDasharray="6,4" />
                  <text x="424" y="22" textAnchor="middle" fontSize="7" fill="var(--color-blue)" fontWeight="bold" letterSpacing="0.05em">☁️ AWS CLOUD INFRASTRUCTURE (SSE-KMS ENVELOPE INGESTION)</text>

                  {/* User Client */}
                  <rect x="16" y="38" width="126" height="128" rx="8" fill="url(#client-kms-grad)" stroke="var(--s3-card-border)" strokeWidth="1.5" filter="url(#s3-shadow-ssekms)" />
                  <text x="79" y="58" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">💻 Client Browser</text>
                  
                  <rect x="23" y="74" width="112" height="78" rx="4" fill="var(--s3-card-bg)" stroke="var(--s3-card-border)" strokeWidth="1" />
                  <text x="79" y="86" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">Ingress Write Request</text>
                  <text x="79" y="99" textAnchor="middle" fontSize="7" fill="var(--color-blue)" fontFamily="monospace">x-amz-server-side-</text>
                  <text x="79" y="111" textAnchor="middle" fontSize="7" fill="var(--color-blue)" fontFamily="monospace">encryption: aws:kms</text>
                  <text x="79" y="125" textAnchor="middle" fontSize="7" fill="var(--color-blue)" fontWeight="bold">Auditable Key Call</text>
                  <text x="79" y="137" textAnchor="middle" fontSize="6.5" fill="var(--color-text-secondary)">Max Security Enforced</text>

                  {/* Flow Arrow */}
                  <path d="M 142 105 L 180 105" fill="none" 
                    stroke={encryptionStep === 1 ? '#3b82f6' : '#cbd5e1'} 
                    strokeWidth="2.5" 
                    className={encryptionStep === 1 ? 's3-flow-blue' : undefined} />
                  <text x="161" y="96" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="bold">Upload</text>

                  {/* S3 Service Engine */}
                  <rect x="180" y="38" width="170" height="128" rx="8" fill="url(#engine-kms-grad)" stroke="var(--color-blue)" strokeWidth="1.5" filter="url(#s3-shadow-ssekms)" />
                  <text x="265" y="58" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-blue)">🪣 S3 Service Engine</text>
                  <text x="265" y="72" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)" fontWeight="600">Requests Envelope Keys</text>
                  
                  <rect x="188" y="86" width="154" height="66" rx="4" fill="var(--s3-card-bg)" fillOpacity="0.8" stroke="var(--s3-card-border)" strokeWidth="1" />
                  <text x="265" y="97" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">GenerateDataKey Async</text>
                  <text x="265" y="110" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">RAM Plaintext Key Ingest</text>
                  <text x="265" y="124" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="bold">
                    {encryptionStep >= 4 ? '🚫 SCRUBBED &amp; ZEROIZED' : '⏳ CACHED IN MEMORY'}
                  </text>
                  <text x="265" y="138" textAnchor="middle" fontSize="7" fill="var(--color-text-tertiary)" fontStyle="italic">RAM erased on disk commit</text>

                  {/* S3 to KMS loop */}
                  <path d="M 265 38 L 265 18 L 440 18 L 440 38" fill="none" 
                    stroke={encryptionStep === 3 ? '#ea580c' : '#cbd5e1'} 
                    strokeWidth="1.5" 
                    className={encryptionStep === 3 ? 's3-flow-orange' : undefined}
                    strokeDasharray="3,3" />
                  <text x="352" y="13" textAnchor="middle" fontSize="7.5" fill="var(--color-amber)" fontWeight="bold">KMS API Call 🔄 (CloudTrail Audited)</text>

                  {/* AWS KMS Block */}
                  <rect x="365" y="38" width="150" height="128" rx="8" fill="url(#hsm-kms-grad)" stroke="var(--color-amber)" strokeWidth="1.5" filter="url(#s3-shadow-ssekms)" />
                  <text x="440" y="58" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-amber)">🔑 AWS KMS CMK</text>
                  <text x="440" y="72" textAnchor="middle" fontSize="8" fill="var(--color-amber)" fontWeight="bold">Hardware Security Module</text>
                  
                  <rect x="373" y="86" width="134" height="66" rx="4" fill="var(--s3-card-bg)" fillOpacity="0.8" stroke="var(--s3-card-border)" strokeWidth="1" />
                  <text x="440" y="98" textAnchor="middle" fontSize="8" fill="var(--color-amber)" fontWeight="bold">FIPS 140-3 HSM Boundary</text>
                  <text x="440" y="111" textAnchor="middle" fontSize="7.5" fill="var(--color-amber)">Generates Plaintext +</text>
                  <text x="440" y="124" textAnchor="middle" fontSize="7.5" fill="var(--color-amber)">Encrypted Data Key pair</text>
                  <text x="440" y="137" textAnchor="middle" fontSize="7" fill="var(--color-green)" fontWeight="bold">Symmetric AES-256 Key</text>

                  {/* Flow Arrow */}
                  <path d="M 515 105 L 530 105" fill="none" 
                    stroke={encryptionStep === 5 ? '#22c55e' : '#cbd5e1'} 
                    strokeWidth="2.5" 
                    className={encryptionStep === 5 ? 's3-flow-green' : undefined} />
                  <text x="522" y="96" textAnchor="middle" fontSize="7.5" fill="var(--s3-success-bg)" fontWeight="bold">Write</text>

                  {/* Physical disks storage */}
                  <rect x="530" y="38" width="156" height="128" rx="8" fill="url(#disk-kms-grad)" stroke="var(--color-green)" strokeWidth="1.5" filter="url(#s3-shadow-ssekms)" />
                  <text x="608" y="58" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-green)">🗄️ SSD Target Disk</text>
                  
                  <rect x="538" y="74" width="140" height="78" rx="4" fill="var(--s3-card-bg)" fillOpacity="0.8" stroke="var(--s3-success-border)" strokeWidth="1" />
                  <text x="608" y="87" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--s3-success-text-bold)">🔒 Double Envelope Sectors</text>
                  <text x="608" y="100" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">1. Ciphertext Payload</text>
                  <text x="608" y="113" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">2. Encrypted Data Key</text>
                  <text x="608" y="126" textAnchor="middle" fontSize="7" fill="var(--color-red)" fontWeight="bold">Plaintext RAM scrubbing: OK</text>
                  <text x="608" y="138" textAnchor="middle" fontSize="7" fill="var(--color-green)" fontStyle="italic">Decryption requires KMS API</text>

                  {/* Active Animation Stream */}
                  {encryptionStep === 1 && (
                    <circle r="4.5" fill="var(--color-blue)">
                      <animateMotion dur="0.6s" repeatCount="indefinite" path="M 142 105 L 180 105" />
                    </circle>
                  )}
                  {encryptionStep === 3 && (
                    <circle r="4" fill="var(--color-amber)">
                      <animateMotion dur="0.8s" repeatCount="indefinite" path="M 265 38 L 265 18 L 440 18 L 440 38" />
                    </circle>
                  )}
                  {encryptionStep === 5 && (
                    <circle r="4.5" fill="var(--color-green)">
                      <animateMotion dur="0.6s" repeatCount="indefinite" path="M 515 105 L 530 105" />
                    </circle>
                  )}
                </svg>
              )}

              {encryptionType === 'sse-c' && (
                <svg viewBox="0 0 700 180" width="100%" className="s3-svg-bg">
                  <defs>
                    <filter id="s3-shadow-ssec" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--color-blue)" floodOpacity="0.08" />
                    </filter>
                    <linearGradient id="client-ssec-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--s3-grad-client-start)" />
                      <stop offset="100%" stopColor="var(--s3-grad-purple-start)" />
                    </linearGradient>
                    <linearGradient id="engine-ssec-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--s3-grad-purple-start)" />
                      <stop offset="100%" stopColor="var(--s3-grad-ssec-engine-end)" />
                    </linearGradient>
                    <linearGradient id="disk-ssec-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--s3-grad-disk-start)" />
                      <stop offset="100%" stopColor="var(--s3-grad-disk-end)" />
                    </linearGradient>
                  </defs>

                  {/* PREMIUM NESTED BOUNDARIES */}
                  {/* Public Client Network */}
                  <rect x="8" y="10" width="168" height="160" rx="8" fill="var(--s3-metric-card-bg)" fillOpacity="0.45" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="92" y="22" textAnchor="middle" fontSize="7" fill="var(--color-text-tertiary)" fontWeight="bold" letterSpacing="0.05em">PUBLIC CUSTOMER INTERNAL SUBNET</text>

                  {/* AWS Cloud Core */}
                  <rect x="186" y="10" width="506" height="160" rx="12" fill="rgba(240, 253, 250, 0.25)" stroke="var(--color-blue)" strokeWidth="1.5" strokeDasharray="6,4" />
                  <text x="439" y="22" textAnchor="middle" fontSize="7" fill="var(--color-blue)" fontWeight="bold" letterSpacing="0.05em">☁️ AWS INFRASTRUCTURE DECOUPLING (SSE-C CUSTOMER KEY ENGINE)</text>

                  {/* User Client */}
                  <rect x="20" y="38" width="144" height="114" rx="8" fill="url(#client-ssec-grad)" stroke="var(--s3-card-border)" strokeWidth="1.5" filter="url(#s3-shadow-ssec)" />
                  <text x="92" y="58" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">💻 Client Browser</text>
                  
                  <rect x="28" y="74" width="128" height="64" rx="4" fill="var(--s3-card-bg)" stroke="var(--s3-card-border)" strokeWidth="1" />
                  <text x="92" y="88" textAnchor="middle" fontSize="8" fill="var(--color-purple)" fontWeight="bold">Own AES-256 Symmetric Key</text>
                  <text x="92" y="103" textAnchor="middle" fontSize="7" fill="var(--color-purple)" fontFamily="monospace">x-amz-server-side-</text>
                  <text x="92" y="117" textAnchor="middle" fontSize="7" fill="var(--color-purple)" fontFamily="monospace">encryption-customer-key</text>

                  {/* Flow Arrow */}
                  <path d="M 164 90 L 210 90" fill="none" 
                    stroke={encryptionStep === 1 ? '#8b5cf6' : '#cbd5e1'} 
                    strokeWidth="2.5" 
                    className={encryptionStep === 1 ? 's3-flow-purple' : undefined} />
                  <text x="187" y="81" textAnchor="middle" fontSize="7.5" fill="var(--s3-success-bg)" fontWeight="bold">HTTPS Push</text>

                  {/* S3 Service Engine */}
                  <rect x="210" y="38" width="240" height="114" rx="8" fill="url(#engine-ssec-grad)" stroke="var(--color-purple)" strokeWidth="1.5" filter="url(#s3-shadow-ssec)" />
                  <text x="330" y="58" textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--color-blue)">🪣 S3 Service Engine</text>
                  <text x="330" y="74" textAnchor="middle" fontSize="8" fill="var(--color-purple)" fontWeight="600">Volatile Memory Decryption Buffer</text>
                  
                  <rect x="220" y="86" width="220" height="52" rx="4" fill="var(--s3-card-bg)" fillOpacity="0.8" stroke="var(--s3-card-border)" strokeWidth="1" />
                  <text x="330" y="99" textAnchor="middle" fontSize="8" fill="var(--color-purple)" fontWeight="bold">Customer-Provided Key Cached in RAM</text>
                  <text x="330" y="112" textAnchor="middle" fontSize="8.5" fill="var(--color-red)" fontWeight="bold">
                    {encryptionStep >= 4 ? '💥 VOLATILE BLOCK ZEROIZED' : '⏳ CACHED FOR ENVELOPE WRITE'}
                  </text>
                  <text x="330" y="125" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)" fontStyle="italic">AWS never persists SSE-C keys to disk storage</text>

                  {/* Flow Arrow */}
                  <path d="M 450 90 L 490 90" fill="none" 
                    stroke={encryptionStep >= 2 && encryptionStep <= 4 ? '#a855f7' : '#cbd5e1'} 
                    strokeWidth="2.5" 
                    className={encryptionStep >= 2 && encryptionStep <= 4 ? 's3-flow-purple' : undefined} />
                  <text x="470" y="81" textAnchor="middle" fontSize="7.5" fill="var(--s3-success-bg)" fontWeight="bold">Encrypt</text>

                  {/* S3 Storage Disk */}
                  <rect x="490" y="38" width="190" height="114" rx="8" fill="url(#disk-ssec-grad)" stroke="var(--color-blue)" strokeWidth="1.5" filter="url(#s3-shadow-ssec)" />
                  <text x="585" y="58" textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--color-purple)">🗄️ SSD Target Disk</text>
                  
                  <rect x="498" y="72" width="174" height="66" rx="4" fill="var(--s3-card-bg)" fillOpacity="0.8" stroke="var(--s3-card-border)" strokeWidth="1" />
                  <text x="585" y="86" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="var(--color-purple)">🔒 Raw Ciphertext Payload</text>
                  <text x="585" y="101" textAnchor="middle" fontSize="7.5" fill="var(--color-purple)">Stored without symmetric key context</text>
                  <text x="585" y="116" textAnchor="middle" fontSize="7" fill="var(--color-red)" fontWeight="bold">(Loss of Customer key = data lost forever)</text>

                  {/* Active Animation Stream */}
                  {encryptionStep === 1 && (
                    <circle r="4.5" fill="var(--color-purple)">
                      <animateMotion dur="0.6s" repeatCount="indefinite" path="M 164 90 L 210 90" />
                    </circle>
                  )}
                  {encryptionStep >= 2 && encryptionStep <= 4 && (
                    <circle r="4.5" fill="var(--color-purple)">
                      <animateMotion dur="0.6s" repeatCount="indefinite" path="M 450 90 L 490 90" />
                    </circle>
                  )}
                </svg>
              )}

              {encryptionType === 'dsse-kms' && (
                <svg viewBox="0 0 700 190" width="100%" className="s3-svg-bg">
                  <defs>
                    <filter id="s3-shadow-dssekms" x="-10%" y="-10%" width="120%" height="120%">
                      <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--color-blue)" floodOpacity="0.08" />
                    </filter>
                    <linearGradient id="client-dsse-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--s3-grad-client-start)" />
                      <stop offset="100%" stopColor="var(--s3-grad-hsm-start)" />
                    </linearGradient>
                    <linearGradient id="engine-dsse-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--s3-grad-orange-start)" />
                      <stop offset="100%" stopColor="var(--s3-grad-dsse-engine-end)" />
                    </linearGradient>
                    <linearGradient id="hsm-dsse-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--s3-grad-hsm-start)" />
                      <stop offset="100%" stopColor="var(--s3-grad-hsm-end)" />
                    </linearGradient>
                    <linearGradient id="disk-dsse-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--s3-grad-orange-start)" />
                      <stop offset="100%" stopColor="var(--s3-grad-orange-end)" />
                    </linearGradient>
                  </defs>

                  {/* PREMIUM NESTED BOUNDARIES */}
                  {/* Public Client Network */}
                  <rect x="8" y="10" width="142" height="170" rx="8" fill="var(--s3-metric-card-bg)" fillOpacity="0.45" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                  <text x="79" y="22" textAnchor="middle" fontSize="7" fill="var(--color-amber)" fontWeight="bold" letterSpacing="0.05em">PUBLIC CLIENT NETWORK</text>

                  {/* AWS Cloud Core */}
                  <rect x="156" y="10" width="536" height="170" rx="12" fill="rgba(240, 253, 250, 0.25)" stroke="var(--color-red)" strokeWidth="1.5" strokeDasharray="6,4" />
                  <text x="424" y="22" textAnchor="middle" fontSize="7" fill="var(--color-amber)" fontWeight="bold" letterSpacing="0.05em">☁️ AWS COMPLIANCE CORE (DSSE-KMS DOUBLE ENVELOPE PIPELINE)</text>

                  {/* User Client */}
                  <rect x="16" y="38" width="126" height="128" rx="8" fill="url(#client-dsse-grad)" stroke="var(--s3-card-border)" strokeWidth="1.5" filter="url(#s3-shadow-dssekms)" />
                  <text x="79" y="58" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">💻 Client Browser</text>
                  
                  <rect x="23" y="74" width="112" height="78" rx="4" fill="var(--s3-card-bg)" stroke="var(--s3-card-border)" strokeWidth="1" />
                  <text x="79" y="86" textAnchor="middle" fontSize="7.5" fill="var(--color-amber)" fontWeight="bold">Double Envelope Ingress</text>
                  <text x="79" y="99" textAnchor="middle" fontSize="7" fill="var(--color-amber)" fontFamily="monospace">x-amz-server-side-</text>
                  <text x="79" y="111" textAnchor="middle" fontSize="7" fill="var(--color-amber)" fontFamily="monospace">encryption: aws:kms:dsse</text>
                  <text x="79" y="125" textAnchor="middle" fontSize="7" fill="var(--color-red)" fontWeight="bold">FIPS 140-3 Compliant</text>
                  <text x="79" y="137" textAnchor="middle" fontSize="6.5" fill="var(--color-red)">Double Cipher active</text>

                  {/* Flow Arrow */}
                  <path d="M 142 105 L 180 105" fill="none" 
                    stroke={encryptionStep === 1 ? '#ea580c' : '#cbd5e1'} 
                    strokeWidth="2.5" 
                    className={encryptionStep === 1 ? 's3-flow-orange' : undefined} />
                  <text x="161" y="96" textAnchor="middle" fontSize="7.5" fill="var(--s3-success-bg)" fontWeight="bold">Upload</text>

                  {/* S3 Service Engine */}
                  <rect x="180" y="38" width="170" height="128" rx="8" fill="url(#engine-dsse-grad)" stroke="var(--color-red)" strokeWidth="1.5" filter="url(#s3-shadow-dssekms)" />
                  <text x="265" y="58" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-amber)">🪣 S3 Service Engine</text>
                  <text x="265" y="72" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="600">Requests 2 Distinct CMKs</text>
                  
                  <rect x="188" y="86" width="154" height="66" rx="4" fill="var(--s3-card-bg)" fillOpacity="0.8" stroke="var(--s3-card-border)" strokeWidth="1" />
                  <text x="265" y="97" textAnchor="middle" fontSize="7.5" fill="var(--color-amber)" fontWeight="bold">GenerateDataKey x2</text>
                  <text x="265" y="110" textAnchor="middle" fontSize="7.5" fill="var(--color-amber)" fontWeight="bold">Double Plaintext RAM</text>
                  <text x="265" y="124" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="bold">
                    {encryptionStep >= 4 ? '🚫 DUAL SCRUBBED' : '⏳ CACHED IN MEMORY'}
                  </text>
                  <text x="265" y="138" textAnchor="middle" fontSize="6.5" fill="var(--color-red)" fontStyle="italic">RAM block doubly-zeroized</text>

                  {/* S3 to KMS loop */}
                  <path d="M 265 38 L 265 18 L 440 18 L 440 38" fill="none" 
                    stroke={encryptionStep === 3 ? '#ea580c' : '#cbd5e1'} 
                    strokeWidth="1.5" 
                    className={encryptionStep === 3 ? 's3-flow-orange' : undefined}
                    strokeDasharray="3,3" />
                  <text x="352" y="13" textAnchor="middle" fontSize="7.5" fill="var(--color-amber)" fontWeight="bold">Twin KMS Calls 🔄 (Double HSM Audit)</text>

                  {/* AWS KMS Block */}
                  <rect x="365" y="38" width="150" height="128" rx="8" fill="url(#hsm-dsse-grad)" stroke="var(--color-amber)" strokeWidth="1.5" filter="url(#s3-shadow-dssekms)" />
                  <text x="440" y="58" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-amber)">🔑 AWS KMS CMKs</text>
                  <text x="440" y="72" textAnchor="middle" fontSize="8" fill="var(--color-amber)" fontWeight="bold">Hardware Security Modules</text>
                  
                  <rect x="373" y="86" width="134" height="66" rx="4" fill="var(--s3-card-bg)" fillOpacity="0.8" stroke="var(--s3-card-border)" strokeWidth="1" />
                  <text x="440" y="98" textAnchor="middle" fontSize="8" fill="var(--color-amber)" fontWeight="bold">Dual FIPS 140-3 HSMs</text>
                  <text x="440" y="111" textAnchor="middle" fontSize="7.5" fill="var(--color-amber)">Generates 2 Plaintext +</text>
                  <text x="440" y="124" textAnchor="middle" fontSize="7.5" fill="var(--color-amber)">2 Encrypted key wrappers</text>
                  <text x="440" y="137" textAnchor="middle" fontSize="7" fill="var(--color-amber)" fontWeight="bold">Double Symmetric AES-256</text>

                  {/* Flow Arrow */}
                  <path d="M 515 105 L 530 105" fill="none" 
                    stroke={encryptionStep === 5 ? '#ea580c' : '#cbd5e1'} 
                    strokeWidth="2.5" 
                    className={encryptionStep === 5 ? 's3-flow-orange' : undefined} />
                  <text x="522" y="96" textAnchor="middle" fontSize="7.5" fill="var(--s3-success-bg)" fontWeight="bold">Write</text>

                  {/* Physical disks storage */}
                  <rect x="530" y="38" width="156" height="128" rx="8" fill="url(#disk-dsse-grad)" stroke="var(--color-red)" strokeWidth="1.5" filter="url(#s3-shadow-dssekms)" />
                  <text x="608" y="58" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-red)">🗄️ SSD Target Disk</text>
                  
                  <rect x="538" y="74" width="140" height="78" rx="4" fill="var(--s3-card-bg)" fillOpacity="0.8" stroke="var(--s3-card-border)" strokeWidth="1" />
                  <text x="608" y="87" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--color-amber)">🔒 Double AES-GCM Cipher</text>
                  <text x="608" y="100" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">1. Layer 1 Ciphertext + Key</text>
                  <text x="608" y="113" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">2. Layer 2 Ciphertext + Key</text>
                  <text x="608" y="126" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="bold">FIPS RAM scrubbing: OK</text>
                  <text x="608" y="138" textAnchor="middle" fontSize="7" fill="var(--color-red)" fontStyle="italic">Decryption requires twin KMS calls</text>

                  {/* Active Animation Stream */}
                  {encryptionStep === 1 && (
                    <circle r="4.5" fill="var(--color-amber)">
                      <animateMotion dur="0.6s" repeatCount="indefinite" path="M 142 105 L 180 105" />
                    </circle>
                  )}
                  {encryptionStep === 3 && (
                    <circle r="4" fill="var(--color-amber)">
                      <animateMotion dur="0.8s" repeatCount="indefinite" path="M 265 38 L 265 18 L 440 18 L 440 38" />
                    </circle>
                  )}
                  {encryptionStep === 5 && (
                    <circle r="4.5" fill="var(--color-amber)">
                      <animateMotion dur="0.6s" repeatCount="indefinite" path="M 515 105 L 530 105" />
                    </circle>
                  )}
                </svg>
              )}
            </div>

            
          </div>
        
          </Translate>)}

        {/* TAB 4: VERSIONING & WORM */}
        {!isComparative && activeTab === 'versioning' && (
          <Translate>
          <div>


            {/* 🎨 Architectural SVG */}
            <div className="s3-sec">S3 Active version Stack &amp; Delete marker mechanics</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Understand how S3 stacks historical versions and inserts Delete Markers to hide objects logical listings.
              </div>
              <svg viewBox="0 0 700 180" width="100%" className="s3-svg-bg">
                <defs>
                  <filter id="s3-shadow-vstack" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--color-blue)" floodOpacity="0.08" />
                  </filter>
                  <linearGradient id="namespace-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-grad-client-start)" />
                    <stop offset="100%" stopColor="var(--s3-grad-disk-start)" />
                  </linearGradient>
                  <linearGradient id="hdd-stack-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-card-border)" />
                    <stop offset="100%" stopColor="var(--s3-card-border)" />
                  </linearGradient>
                </defs>

                {/* PREMIUM NESTED BOUNDARIES */}
                {/* Logical Namespace Plane */}
                <rect x="8" y="10" width="224" height="160" rx="8" fill="var(--s3-metric-card-bg)" fillOpacity="0.45" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                <text x="120" y="22" textAnchor="middle" fontSize="7" fill="var(--color-text-tertiary)" fontWeight="bold" letterSpacing="0.05em">LOGICAL BUCKET NAMESPACE PLANE</text>

                {/* AWS Physical At-Rest Plane */}
                <rect x="242" y="10" width="450" height="160" rx="12" fill="rgba(240, 253, 250, 0.25)" stroke="var(--color-blue)" strokeWidth="1.5" strokeDasharray="6,4" />
                <text x="467" y="22" textAnchor="middle" fontSize="7" fill="var(--color-blue)" fontWeight="bold" letterSpacing="0.05em">☁️ AWS SECURE STORAGE PLANE &amp; WORM GUARD</text>

                {/* 1. S3 Logical API Namespace (Left Card) */}
                <rect x="20" y="38" width="200" height="122" rx="8" fill="url(#namespace-grad)" stroke="var(--s3-card-border)" strokeWidth="1.5" filter="url(#s3-shadow-vstack)" />
                <text x="120" y="55" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">🔍 S3 API Logical Listing</text>
                
                {(() => {
                  const top = versionStack[0];
                  if (!top) {
                    return (
                      <>
                        <circle cx="120" cy="98" r="18" fill="var(--s3-metric-card-bg)" stroke="var(--s3-card-border)" strokeWidth="1" />
                        <text x="120" y="102" textAnchor="middle" fontSize="11" fill="var(--color-blue)">Empty</text>
                      </>
                    );
                  }
                  if (top.isDeleteMarker) {
                    return (
                      <>
                        <rect x="30" y="68" width="180" height="82" rx="6" fill="var(--s3-error-bg)" stroke="var(--color-red)" strokeWidth="1.5" />
                        <text x="120" y="86" textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--color-red)">🛑 HTTP 404 NOT FOUND</text>
                        <text x="120" y="104" textAnchor="middle" fontSize="8" fill="var(--color-red)">Active Delete Marker Overlays Stack</text>
                        <text x="120" y="122" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="bold" fontStyle="italic">Physical bytes preserved below!</text>
                        <text x="120" y="136" textAnchor="middle" fontSize="6.5" fill="var(--color-red)">Listing: file.pdf is Hidden</text>
                      </>
                    );
                  }
                  return (
                    <>
                      <rect x="30" y="68" width="180" height="82" rx="6" fill="var(--s3-success-bg)" stroke="var(--color-blue)" strokeWidth="1.5" />
                      <text x="120" y="86" textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--color-blue)">📄 file.pdf (Active Listing)</text>
                      <text x="120" y="104" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">Current Version ID: {top.id}</text>
                      <text x="120" y="122" textAnchor="middle" fontSize="8.5" fill="var(--color-blue)" fontWeight="bold">HTTP 200 OK — Ready</text>
                      <text x="120" y="136" textAnchor="middle" fontSize="6.5" fill="var(--color-blue)">Standard API calls fetch this block</text>
                    </>
                  );
                })()}

                {/* Flow Arrow */}
                <path d="M 220 98 L 250 98" fill="none" stroke="var(--color-blue)" strokeWidth="2.5" className="s3-flow-blue" />

                {/* 2. Version Storage Stack (Center Card) */}
                <rect x="250" y="38" width="260" height="122" rx="8" fill="url(#hdd-stack-grad)" stroke="var(--color-blue)" strokeWidth="1.5" filter="url(#s3-shadow-vstack)" />
                <text x="380" y="55" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-blue)">🗄️ Physical S3 Version Stack</text>

                {(() => {
                  return (
                    <g transform="translate(260, 64)">
                      {versionStack.slice(0, 3).map((item, idx) => {
                        const yPos = idx * 24;
                        const fill = item.isDeleteMarker ? '#fef2f2' : idx === 0 ? '#ecfdf5' : '#f8fafc';
                        const stroke = item.isDeleteMarker ? '#ef4444' : idx === 0 ? '#10b981' : '#94a3b8';
                        const textColor = item.isDeleteMarker ? '#b91c1c' : idx === 0 ? '#047857' : '#475569';
                        return (
                          <g key={idx} transform={`translate(0, ${yPos})`}>
                            <rect x="0" y="2" width="240" height="20" rx="4" fill={fill} stroke={stroke} strokeWidth={idx === 0 ? 1.8 : 1} />
                            <text x="8" y="15" fontSize="8.5" fontWeight="bold" fill={textColor}>
                              {item.isDeleteMarker ? '🛑 DELETE MARKER' : `📄 file.pdf (v${versionStack.length - idx})`}
                            </text>
                            <text x="232" y="14" textAnchor="end" fontSize="7" fontFamily="monospace" fill={textColor}>ID: {item.id}</text>
                          </g>
                        );
                      })}
                      {versionStack.length > 3 && (
                        <text x="120" y="86" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)" fontStyle="italic">
                          ... and {versionStack.length - 3} older version segment(s) in lower disk sectors
                        </text>
                      )}
                    </g>
                  );
                })()}

                {/* Flow Arrow */}
                {(() => {
                  const isLocked = legalHold || (objectLockMode !== 'none' && simulatedTimeOffsetDays < objectLockRetentionDays);
                  return (
                    <path d="M 510 98 L 530 98" fill="none" 
                      stroke={isLocked ? '#ef4444' : '#cbd5e1'} 
                      strokeWidth="2.5" 
                      className={isLocked ? 's3-flow-red' : undefined} />
                  );
                })()}

                {/* 3. S3 WORM Compliance Lock (Right Card) */}
                {(() => {
                  const isLocked = legalHold || (objectLockMode !== 'none' && simulatedTimeOffsetDays < objectLockRetentionDays);
                  const isExpired = objectLockMode !== 'none' && simulatedTimeOffsetDays >= objectLockRetentionDays;
                  const border = isLocked ? '#ef4444' : '#cbd5e1';
                  const bg = isLocked ? '#fff5f5' : '#f8fafc';
                  return (
                    <g transform="translate(530, 38)">
                      <rect x="0" y="0" width="152" height="122" rx="8" fill={bg} stroke={border} strokeWidth="1.5" filter="url(#s3-shadow-vstack)" />
                      <text x="76" y="15" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-text-primary)">🛡️ WORM Gate</text>

                      {isLocked ? (
                        <>
                          <rect x="8" y="24" width="136" height="90" rx="6" fill="var(--s3-card-bg)" fillOpacity="0.8" stroke="var(--color-red)" strokeWidth="1" />
                          <text x="76" y="42" textAnchor="middle" fontSize="18">🔒</text>
                          <text x="76" y="62" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="var(--color-red)">WORM ACTIVE</text>
                          <text x="76" y="78" textAnchor="middle" fontSize="7.5" fill="var(--color-red)">
                            {legalHold ? '⚖️ Legal Hold: ON' : `⏱️ Lock: ${objectLockRetentionDays - simulatedTimeOffsetDays} Days left`}
                          </text>
                          <text x="76" y="93" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="bold">DELETIONS BLOCKED</text>
                          <text x="76" y="105" textAnchor="middle" fontSize="6.5" fill="var(--color-red)" fontStyle="italic">SEC Rule 17a-4 Compliant</text>
                        </>
                      ) : isExpired ? (
                        <>
                          <rect x="8" y="24" width="136" height="90" rx="6" fill="var(--s3-card-border)" stroke="var(--color-blue)" strokeWidth="1" />
                          <text x="76" y="42" textAnchor="middle" fontSize="18">🔓</text>
                          <text x="76" y="62" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="var(--color-blue)">LOCK EXPIRED</text>
                          <text x="76" y="78" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">Timer hit zero ({simulatedTimeOffsetDays} days)</text>
                          <text x="76" y="93" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">Bypasses Allowed</text>
                          <text x="76" y="105" textAnchor="middle" fontSize="6.5" fill="var(--color-text-secondary)" fontStyle="italic">Governed by IAM Roles</text>
                        </>
                      ) : (
                        <>
                          <rect x="8" y="24" width="136" height="90" rx="6" fill="var(--s3-metric-card-bg)" stroke="var(--s3-card-border)" strokeWidth="1" />
                          <text x="76" y="42" textAnchor="middle" fontSize="18">🔓</text>
                          <text x="76" y="62" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="var(--color-text-secondary)">NO WORM RETENTION</text>
                          <text x="76" y="78" textAnchor="middle" fontSize="7.5" fill="var(--color-text-tertiary)">No active policy locks</text>
                          <text x="76" y="93" textAnchor="middle" fontSize="7.5" fill="var(--color-green)" fontWeight="bold">Deletes Authorized</text>
                          <text x="76" y="105" textAnchor="middle" fontSize="6.5" fill="var(--color-text-tertiary)" fontStyle="italic">Standard stack checks</text>
                        </>
                      )}
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* 🎮 Interactive Playground */}
            <div className="s3-sec">🔄 Versioning, MFA &amp; Lock Sandboxes</div>
            <div className="s3-card">
              <div className="s3-g2">
                <div style={{ background: 'var(--color-background-secondary)', padding: '16px', borderRadius: '8px', border: '0.5px solid var(--color-border-secondary)' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📁</span> S3 Object Version Controller
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                    <button onClick={addVersion} className="s3-btn s3-on" style={{ flex: 1, fontWeight: 'bold' }}>Upload Version of file.pdf</button>
                    <button onClick={triggerDeleteObject} className="s3-btn" style={{ flex: 1, borderColor: '#ef4444', color: '#ef4444', fontWeight: 'bold' }}>Delete Active Object</button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-background-primary)', padding: '10px', borderRadius: '6px', border: '0.5px solid var(--color-border-tertiary)', marginBottom: '10px' }}>
                    <input type="checkbox" checked={mfaDelete} onChange={e => setMfaDelete(e.target.checked)} id="mfa" style={{ accentColor: '#0891b2' }} />
                    <label htmlFor="mfa" style={{ fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      🔐 Enforce MFA Delete (Hardware Token Required)
                    </label>
                  </div>

                  {mfaPrompt && (
                    <div style={{ background: '#fef2f2', border: '1.5px solid #fca5a5', padding: '12px', borderRadius: '8px', marginBottom: '10px' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '11.5px', color: '#991b1b', marginBottom: '4px' }}>🔑 Multi-Factor Authentication Code Needed</div>
                      <div style={{ fontSize: '10.5px', color: '#7f1d1d', marginBottom: '8px' }}>
                        To permanently destroy this version bytes, enter the valid MFA Token (<b>654321</b>):
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          type="text"
                          placeholder="Passcode"
                          value={mfaTokenInput}
                          onChange={e => setMfaTokenInput(e.target.value)}
                          style={{ padding: '4px 8px', fontSize: '11.5px', border: '0.5px solid #fca5a5', borderRadius: '4px', flex: 1, background: 'var(--color-background-primary)', color: 'var(--color-text-primary)' }}
                        />
                        <button onClick={submitMfaDelete} className="s3-btn s3-on">Submit MFA</button>
                        <button onClick={() => setMfaPrompt(false)} className="s3-btn">Cancel</button>
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', background: 'var(--color-background-primary)', padding: '10px', borderRadius: '6px', border: '0.5px solid var(--color-border-tertiary)' }}>
                    <b>💡 Learning Guide:</b> Click <b>Upload Version</b> multiple times to stack versions. Click <b>Delete Active Object</b> to see how S3 pushes a <i>Delete Marker</i> on top to logically hide the object. Check <b>Enforce MFA Delete</b> and delete to prompt multi-factor security overlays!
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '6px' }}>Active S3 Object Version Stack Listing:</div>
                  <div style={{ maxHeight: '215px', overflowY: 'auto', border: '0.5px solid var(--color-border-secondary)', borderRadius: '8px', background: 'var(--color-background-secondary)' }}>
                    {versionStack.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>Empty bucket version stack.</div>
                    ) : (
                      versionStack.map((item, idx) => (
                        <div key={idx} style={{
                          padding: '10px 12px',
                          borderBottom: '0.5px solid var(--color-border-secondary)',
                          background: item.active ? 'var(--color-background-primary)' : 'transparent',
                          borderLeft: item.active ? '4px solid #0891b2' : 'none'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 'bold', fontSize: '11.5px', color: item.isDeleteMarker ? '#ef4444' : 'var(--color-text-primary)' }}>
                              {item.isDeleteMarker ? '🛑 Delete Marker' : '📄 file.pdf'}
                              {item.active && <span style={{ fontSize: '9px', background: '#0f766e', color: '#fff', padding: '1px 5px', borderRadius: '4px', marginLeft: '6px' }}>Active</span>}
                            </span>
                            <span style={{ fontFamily: 'monospace', fontSize: '10px', color: 'var(--color-text-secondary)' }}>ID: {item.id}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                            <span>Uploaded: {item.time}</span>
                            <span>Size: {item.size}</span>
                          </div>
                          {item.isDeleteMarker && (
                            <button onClick={restoreFromDeleteMarker} className="s3-btn" style={{ fontSize: '9.5px', padding: '2px 6px', marginTop: '6px' }}>
                              ⏪ Undo Delete (Remove Marker)
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 🛡️ WORM LOCK PLAYGROUND */}
            <div className="s3-sec">🛡️ WORM Lock Configuration Sandbox</div>
            <div className="s3-card">
              <div className="s3-g2">
                <div style={{ background: 'var(--color-background-secondary)', padding: '16px', borderRadius: '8px', border: '0.5px solid var(--color-border-secondary)' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🛡️</span> Object WORM Settings
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Object Lock Retention Mode:</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className={`s3-btn ${objectLockMode === 'none' ? 's3-on' : ''}`} onClick={() => { setObjectLockMode('none'); setWormAuditLogs(l => [...l, '[settings] Disabled S3 Object Lock retention.']); }}>None</button>
                      <button className={`s3-btn ${objectLockMode === 'governance' ? 's3-on' : ''}`} onClick={() => { setObjectLockMode('governance'); setWormAuditLogs(l => [...l, '[settings] Enabled S3 Object Lock: GOVERNANCE mode.']); }}>Governance</button>
                      <button className={`s3-btn ${objectLockMode === 'compliance' ? 's3-on' : ''}`} onClick={() => { setObjectLockMode('compliance'); setWormAuditLogs(l => [...l, '[settings] Enabled S3 Object Lock: COMPLIANCE mode. (Roots locked!)']); }}>Compliance</button>
                    </div>
                  </div>

                  {objectLockMode !== 'none' && (
                    <div style={{ marginBottom: '10px', background: 'var(--color-background-primary)', padding: '10px', borderRadius: '6px', border: '0.5px solid var(--color-border-tertiary)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                        <span>Retention Period:</span>
                        <b>{objectLockRetentionDays} Days</b>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="30"
                        value={objectLockRetentionDays}
                        onChange={e => setObjectLockRetentionDays(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '10px', borderTop: '0.5px solid var(--color-border-secondary)', paddingTop: '6px' }}>
                        <span>Simulate Days Passed (Fast-Forward):</span>
                        <b>{simulatedTimeOffsetDays} Days</b>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="35"
                        value={simulatedTimeOffsetDays}
                        onChange={e => setSimulatedTimeOffsetDays(parseInt(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-background-primary)', padding: '10px', borderRadius: '6px', border: '0.5px solid var(--color-border-tertiary)', marginBottom: '10px' }}>
                    <input type="checkbox" checked={legalHold} onChange={e => { setLegalHold(e.target.checked); setWormAuditLogs(l => [...l, `[settings] Legal Hold status updated: ${e.target.checked ? 'ACTIVE' : 'INACTIVE'}`]); }} id="legalHold" style={{ accentColor: '#0891b2' }} />
                    <label htmlFor="legalHold" style={{ fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      ⚖️ Enable S3 Legal Hold (Permanent Block)
                    </label>
                  </div>
                </div>

                <div style={{ background: 'var(--color-background-secondary)', padding: '16px', borderRadius: '8px', border: '0.5px solid var(--color-border-secondary)' }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>👤</span> Caller Identity &amp; Auth Bypass
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '11px', display: 'block', marginBottom: '4px', fontWeight: 600 }}>Active Security Profile:</label>
                    <select className="s3-card select" value={wormIdentity} onChange={e => setWormIdentity(e.target.value as any)} style={{ padding: '4px 8px', fontSize: '11.5px', width: '100%' }}>
                      <option value="operator">Standard System Operator (Developer Access)</option>
                      <option value="secops">SecOps Compliance Auditor (Admin Bypass Role)</option>
                    </select>
                  </div>

                  {objectLockMode === 'governance' && wormIdentity === 'secops' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-background-primary)', padding: '10px', borderRadius: '6px', border: '0.5px solid var(--color-border-tertiary)', marginBottom: '10px' }}>
                      <input type="checkbox" checked={bypassGovernance} onChange={e => setBypassGovernance(e.target.checked)} id="bypass" style={{ accentColor: '#0891b2' }} />
                      <label htmlFor="bypass" style={{ fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⚠️ Inject s3:BypassGovernanceRetention Header
                      </label>
                    </div>
                  )}

                  <div style={{ background: 'var(--color-background-primary)', padding: '10px', borderRadius: '6px', border: '0.5px solid var(--color-border-tertiary)', marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>WORM Status Summary:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>WORM Mode:</span>
                        <span style={{ fontWeight: 'bold', color: objectLockMode === 'compliance' ? '#ef4444' : objectLockMode === 'governance' ? '#f59e0b' : 'var(--color-text-secondary)' }}>{objectLockMode.toUpperCase()}</span>
                      </div>
                      {objectLockedUntil && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Locks Until:</span>
                          <span style={{ fontFamily: 'monospace' }}>{objectLockedUntil}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Legal Hold:</span>
                        <span style={{ fontWeight: 'bold', color: legalHold ? '#ef4444' : 'var(--color-text-secondary)' }}>{legalHold ? 'ACTIVE' : 'INACTIVE'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>🛡️ WORM Integrity Status Audit logs:</div>
                <div ref={wormTerminalRef} className="s3-terminal" style={{ height: '110px' }}>
                  {wormAuditLogs.length === 0 ? (
                    <div style={{ color: 'var(--color-text-tertiary)' }}>[idle] Awaiting Write/Delete operations to analyze metadata lock blocks...</div>
                  ) : (
                    wormAuditLogs.map((log, idx) => (
                      <div key={idx} style={{
                        color: log.includes('❌') ? 'var(--color-red)' : log.includes('✅') ? 'var(--color-green)' : log.includes('⚠️') ? 'var(--color-amber)' : 'var(--s3-terminal-color)',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        marginBottom: '2px'
                      }}>
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        
          </Translate>)}

        {/* TAB 5: STORAGE CLASSES & LIFECYCLE */}
        {!isComparative && activeTab === 'storage' && (
          <Translate>
          <div>


            {/* 🎨 Architectural SVG */}
            <div className="s3-sec">S3 Automatic Lifecycle Class Transition Timeline</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Watch objects cool down over time, shifting from expensive hot Standard classes down into hyper-cheap deep archival tapes.
              </div>
              <svg viewBox="0 0 700 180" width="100%" className="s3-svg-bg">
                {/* Math variables for dynamic positioning */}
                {(() => {
                  const startX = 60;
                  const endX = 640;
                  const width = endX - startX;
                  
                  // Compute scales
                  const iaX = startX + (lifecycleIa / lifecycleExpiration) * width;
                  const glacierX = startX + (lifecycleGlacier / lifecycleExpiration) * width;
                  const currentX = startX + (Math.min(lifecycleDaysPassed, lifecycleExpiration) / lifecycleExpiration) * width;
                  
                  return (
                    <>
                      <defs>
                        <filter id="s3-shadow-lifec" x="-10%" y="-10%" width="120%" height="120%">
                          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--color-blue)" floodOpacity="0.08" />
                        </filter>
                      </defs>

                      {/* PREMIUM NESTED BOUNDARIES */}
                      {/* Hot Tier SSD systems */}
                      <rect x="8" y="10" width="310" height="160" rx="8" fill="var(--s3-success-bg)" fillOpacity="0.45" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="163" y="22" textAnchor="middle" fontSize="7" fill="var(--color-green)" fontWeight="bold" letterSpacing="0.05em">🔥 ACTIVE HOT DISK SYSTEM PLANE (S3 SSDs)</text>

                      {/* Cold Archive Tape vault systems */}
                      <rect x="328" y="10" width="364" height="160" rx="12" fill="rgba(240, 253, 250, 0.25)" stroke="var(--color-blue)" strokeWidth="1.5" strokeDasharray="6,4" />
                      <text x="510" y="22" textAnchor="middle" fontSize="7" fill="var(--color-blue)" fontWeight="bold" letterSpacing="0.05em">📼 COLD TAPE ARCHIVAL VAULT SYSTEMS (GLACIER TAPE PLANE)</text>

                      {/* Timeline axis line */}
                      <line x1={startX} y1="90" x2={endX} y2="90" stroke="var(--s3-card-border)" strokeWidth="3" />
                      <polygon points={`${endX},85 ${endX+10},90 ${endX},95`} fill="var(--s3-success-bg)" />

                      {/* Day 0: Standard */}
                      <circle cx={startX} cy="90" r="8" fill="var(--color-green)" filter="url(#s3-shadow-lifec)" />
                      <text x={startX} y="112" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-text-primary)">Day 0: Standard</text>
                      <text x={startX} y="125" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)" fontWeight="600">$0.023 / GB</text>
                      <rect x={startX - 30} y="40" width="60" height="20" rx="3" fill="var(--s3-card-bg)" fillOpacity="0.9" stroke="var(--color-green)" strokeWidth="1" filter="url(#s3-shadow-lifec)" />
                      <text x={startX} y="52" textAnchor="middle" fontSize="7.5" fill="var(--color-green)" fontWeight="bold">🔥 Hot Data</text>

                      {/* Day IA: Standard-IA */}
                      <circle cx={iaX} cy="90" r="8" fill="var(--color-amber)" filter="url(#s3-shadow-lifec)" />
                      <text x={iaX} y="112" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-text-primary)">Day {lifecycleIa}: IA</text>
                      <text x={iaX} y="125" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)" fontWeight="600">$0.0125 / GB</text>
                      <rect x={iaX - 30} y="40" width="60" height="20" rx="3" fill="var(--s3-card-bg)" fillOpacity="0.9" stroke="var(--color-amber)" strokeWidth="1" filter="url(#s3-shadow-lifec)" />
                      <text x={iaX} y="52" textAnchor="middle" fontSize="7.5" fill="var(--color-amber)" fontWeight="bold">❄️ Infrequent</text>

                      {/* Day Glacier: Glacier Deep */}
                      <circle cx={glacierX} cy="90" r="8" fill="var(--color-purple)" filter="url(#s3-shadow-lifec)" />
                      <text x={glacierX} y="112" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-text-primary)">Day {lifecycleGlacier}: Glacier</text>
                      <text x={glacierX} y="125" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)" fontWeight="600">$0.00099 / GB</text>
                      <rect x={glacierX - 30} y="40" width="60" height="20" rx="3" fill="var(--s3-card-bg)" fillOpacity="0.9" stroke="var(--color-purple)" strokeWidth="1" filter="url(#s3-shadow-lifec)" />
                      <text x={glacierX} y="52" textAnchor="middle" fontSize="7.5" fill="var(--color-purple)" fontWeight="bold">🕳️ Tape Vault</text>

                      {/* Day Expiration: Expired */}
                      <circle cx={endX} cy="90" r="8" fill="var(--color-red)" filter="url(#s3-shadow-lifec)" />
                      <text x={endX} y="112" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-red)">Day {lifecycleExpiration}: Expired</text>
                      <text x={endX} y="125" textAnchor="middle" fontSize="8" fill="var(--color-red)" fontWeight="600">Purged / Free</text>
                      <rect x={endX - 30} y="40" width="60" height="20" rx="3" fill="var(--s3-card-bg)" fillOpacity="0.9" stroke="var(--color-red)" strokeWidth="1" filter="url(#s3-shadow-lifec)" />
                      <text x={endX} y="52" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="bold">❌ Expired</text>

                      {/* Dynamic Progress Indicator (Connected to elapsed clock!) */}
                      {lifecycleDaysPassed > 0 && (
                        <g>
                          <line x1={currentX} y1="30" x2={currentX} y2="135" stroke="var(--color-blue)" strokeWidth="2" strokeDasharray="3,3" />
                          <circle cx={currentX} cy="90" r="12" fill="var(--s3-success-bg)" stroke="var(--color-blue)" strokeWidth="2" filter="url(#s3-shadow-lifec)" />
                          <circle cx={currentX} cy="90" r="5" fill="var(--color-blue)" />
                          
                          <rect x={currentX - 45} y="142" width="90" height="26" rx="4" fill="var(--color-blue)" filter="url(#s3-shadow-lifec)" />
                          <text x={currentX} y="153" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="var(--s3-card-bg)">Elapsed: {lifecycleDaysPassed} Days</text>
                          <text x={currentX} y="163" textAnchor="middle" fontSize="7" fill="var(--s3-success-bg)" fontFamily="monospace">Active Class</text>
                        </g>
                      )}
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* 🎮 Interactive Playground */}
            <div className="s3-sec">📈 S3 Classes &amp; Lifecycle transition calendar simulator</div>
            <div className="s3-card">
              <div className="s3-g2">
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '10px' }}>🔧 Adjust Transition Threshold Sliders (Days):</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span>Transition to Standard-IA:</span>
                        <b>{lifecycleIa} Days</b>
                      </div>
                      <input type="range" min="30" max="120" step="5" value={lifecycleIa} onChange={e => setLifecycleIa(parseInt(e.target.value))} style={{ width: '100%' }} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span>Transition to Glacier Deep Archive:</span>
                        <b>{lifecycleGlacier} Days</b>
                      </div>
                      <input type="range" min="90" max="270" step="5" value={lifecycleGlacier} onChange={e => setLifecycleGlacier(parseInt(e.target.value))} style={{ width: '100%' }} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span>Permanent Expiration (Delete):</span>
                        <b>{lifecycleExpiration} Days</b>
                      </div>
                      <input type="range" min="180" max="730" step="5" value={lifecycleExpiration} onChange={e => setLifecycleExpiration(parseInt(e.target.value))} style={{ width: '100%' }} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                        <span>Simulated Data Volume:</span>
                        <b>{lifecycleVolume} GB</b>
                      </div>
                      <input type="range" min="10" max="10000" step="50" value={lifecycleVolume} onChange={e => setLifecycleVolume(parseInt(e.target.value))} style={{ width: '100%' }} />
                    </div>
                  </div>
                  <button onClick={startLifecycleSimulation} className="s3-btn s3-on" style={{ width: '100%', marginTop: '14px', fontWeight: 'bold' }}>
                    {lifecycleRunState === 'running' ? 'Simulation Running...' : 'Launch Year Lifecycle Simulation'}
                  </button>
                </div>

                <div style={{ background: 'var(--color-background-secondary)', padding: '14px', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>⏰ Clock Time Simulator:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Days Elapsed:</span>
                        <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#0891b2' }}>{lifecycleDaysPassed} Days</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Current Class:</span>
                        <span style={{ fontWeight: 'bold', fontSize: '12.5px', color: '#a855f7' }}>{lifecycleCurrentClass}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '0.5px solid var(--color-border-secondary)', paddingTop: '6px', marginTop: '6px' }}>
                        <span>Standard Hosting Cost (static):</span>
                        <span style={{ fontFamily: 'monospace' }}>${(lifecycleVolume * 0.023 * (lifecycleDaysPassed / 30)).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Actual Lifecycle Cost (active):</span>
                        <span style={{ fontFamily: 'monospace' }}>${((lifecycleVolume * 0.023 * (Math.min(lifecycleDaysPassed, lifecycleIa) / 30)) +
                          (lifecycleVolume * 0.0125 * (Math.max(0, Math.min(lifecycleDaysPassed, lifecycleGlacier) - lifecycleIa) / 30)) +
                          (lifecycleVolume * 0.00099 * (Math.max(0, Math.min(lifecycleDaysPassed, lifecycleExpiration) - lifecycleGlacier) / 30))).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '10px', borderRadius: '6px', color: '#15803d', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>Total Money Saved by Lifecycles:</span>
                    <span style={{ fontSize: '16px', fontWeight: 'bold', fontFamily: 'monospace' }}>${lifecycleCostSaved.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Matrix details */}
            <div className="s3-sec">Storage Classes Specs Comparison Chart</div>
            <div style={{ overflowX: 'auto', border: '0.5px solid var(--color-border-secondary)', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', background: 'var(--color-background-primary)' }}>
                <thead>
                  <tr style={{ background: 'var(--color-background-secondary)', borderBottom: '1px solid var(--color-border-secondary)' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Storage Class</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Durability</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Availability</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Min Stay</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Min Size</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Retrieval Fee</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Cost / GB</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(STORAGE_CLASSES).map(([key, c]) => (
                    <tr key={key} style={{ borderBottom: '0.5px solid var(--color-border-secondary)' }}>
                      <td style={{ padding: '10px', fontWeight: 'bold' }}>{c.icon} {c.name}</td>
                      <td style={{ padding: '10px' }}>{c.durability}</td>
                      <td style={{ padding: '10px' }}>{c.availability}</td>
                      <td style={{ padding: '10px' }}>{c.minDuration}</td>
                      <td style={{ padding: '10px' }}>{c.minSize}</td>
                      <td style={{ padding: '10px' }}>{c.retrievalFee}</td>
                      <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#16a34a', fontFamily: 'monospace' }}>${c.storageCost}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        
          </Translate>)}

        {/* TAB 6: NETWORKING */}
        {!isComparative && activeTab === 'networking' && (
          <Translate>
          <div>


            {/* 🎨 Architectural SVG */}
            <div className="s3-sec">VPC Gateway Endpoint Private network routing topology</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Contrast public internet routing (via Internet Gateway) against private, free routing via S3 Gateway VPC Endpoint.
              </div>
              <svg viewBox="0 0 720 190" width="100%" className="s3-svg-bg" style={{ borderRadius: '8px', border: '1px solid var(--color-border-secondary)' }}>
                <defs>
                  <filter id="s3-shadow-net1" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--color-blue)" floodOpacity="0.08" />
                  </filter>
                  <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-grad-client-start)" />
                    <stop offset="100%" stopColor="var(--s3-grad-client-end)" />
                  </linearGradient>
                  <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-card-border)" />
                    <stop offset="100%" stopColor="var(--s3-grad-engine-end)" />
                  </linearGradient>
                  <linearGradient id="roseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-card-border)" />
                    <stop offset="100%" stopColor="var(--color-text-secondary)" />
                  </linearGradient>
                </defs>

                {/* PREMIUM NESTED BOUNDARIES */}
                {/* Private Subnet boundary */}
                <rect x="8" y="10" width="214" height="170" rx="8" fill="var(--s3-metric-card-bg)" fillOpacity="0.45" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                <text x="115" y="22" textAnchor="middle" fontSize="7" fill="var(--color-text-tertiary)" fontWeight="bold" letterSpacing="0.05em">🔒 VPC CORPORATE PRIVATE SUBNET BOUNDARY</text>

                {/* AWS Regional Backplane */}
                <rect x="230" y="10" width="482" height="170" rx="12" fill="rgba(240, 253, 250, 0.25)" stroke="var(--color-blue)" strokeWidth="1.5" strokeDasharray="6,4" />
                <text x="471" y="22" textAnchor="middle" fontSize="7" fill="var(--color-blue)" fontWeight="bold" letterSpacing="0.05em">☁️ AWS SECURE HIGH-SPEED REGIONAL BACKPLANE</text>

                {/* Private Subnet VM */}
                <rect x="18" y="32" width="194" height="138" rx="8" fill="url(#blueGradient)" stroke="var(--color-blue)" strokeWidth="1.5" filter="url(#s3-shadow-net1)" />
                <text x="115" y="47" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-blue)">💻 Private EC2 Instance</text>
                <text x="115" y="60" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">No Public IP Allocated</text>
                <text x="115" y="72" textAnchor="middle" fontSize="7" fontFamily="monospace" fill="var(--color-text-tertiary)">Subnet IP: 10.0.1.42</text>
                
                {/* Embedded Mini Subnet Table */}
                <rect x="24" y="80" width="182" height="82" rx="4" fill="var(--s3-card-bg)" fillOpacity="0.9" stroke="var(--s3-card-border)" strokeWidth="0.8" />
                <text x="30" y="93" fontSize="7" fontWeight="bold" fill="var(--color-text-primary)">Route Target Prefix</text>
                <text x="126" y="93" fontSize="7" fontWeight="bold" fill="var(--color-text-primary)">Gateway Interface</text>
                <line x1="24" y1="98" x2="206" y2="98" stroke="var(--s3-card-border)" strokeWidth="0.5" />
                <text x="30" y="112" fontSize="7" fill="var(--color-green)" fontWeight="bold" fontFamily="monospace">pl-63a5400a (S3)</text>
                <text x="126" y="112" fontSize="7" fill="var(--color-green)" fontWeight="bold" fontFamily="monospace">vpce-0d8fa (Free)</text>
                <line x1="24" y1="120" x2="206" y2="120" stroke="var(--s3-card-border)" strokeWidth="0.5" />
                <text x="30" y="134" fontSize="7" fill="var(--color-red)" fontFamily="monospace">0.0.0.0/0 (Egress)</text>
                <text x="126" y="134" fontSize="7" fill="var(--color-red)" fontFamily="monospace">nat-072a1cf ($)</text>
                <line x1="24" y1="142" x2="206" y2="142" stroke="var(--s3-card-border)" strokeWidth="0.5" />
                <text x="30" y="155" fontSize="6.5" fill="var(--color-text-tertiary)" fontStyle="italic">Prefix match routes to VPCE</text>

                {/* Route A: Public route via NAT */}
                <path d="M 212 65 L 300 65 L 300 48 L 475 48" fill="none" 
                  stroke="var(--color-red)" 
                  strokeWidth="2" 
                  strokeDasharray="3,3" 
                  className="s3-flow-red" />
                <rect x="270" y="56" width="60" height="18" rx="3" fill="var(--s3-error-bg)" stroke="var(--s3-error-border)" strokeWidth="1" filter="url(#s3-shadow-net1)" />
                <text x="300" y="68" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="bold">NAT / IGW</text>
                <text x="300" y="48" textAnchor="middle" fontSize="7" fill="var(--color-red)" fontWeight="bold">💰 Egress Charges ($)</text>

                {/* Route B: Gateway VPCE route */}
                <path d="M 212 125 L 475 125" fill="none" 
                  stroke="var(--color-green)" 
                  strokeWidth="2.5" 
                  className="s3-flow-green" />
                <rect x="245" y="134" width="180" height="24" rx="4" fill="url(#emeraldGradient)" stroke="var(--color-green)" strokeWidth="1" filter="url(#s3-shadow-net1)" />
                <text x="335" y="149" textAnchor="middle" fontSize="8" fill="var(--color-green)" fontWeight="bold">🔗 Private Gateway Endpoint Link</text>
                <text x="335" y="116" textAnchor="middle" fontSize="8" fill="var(--color-green)" fontWeight="bold">🔒 Direct Regional Backbone (Free)</text>

                {/* S3 Public Endpoint */}
                <rect x="475" y="28" width="220" height="42" rx="6" fill="url(#roseGradient)" stroke="var(--color-red)" strokeWidth="1.5" filter="url(#s3-shadow-net1)" />
                <text x="585" y="45" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-red)">🌐 Public Host Endpoint</text>
                <text x="585" y="58" textAnchor="middle" fontSize="8" fontFamily="monospace" fill="var(--color-red)">s3.amazonaws.com</text>

                {/* S3 gateway vpce endpoint target */}
                <rect x="475" y="85" width="220" height="88" rx="6" fill="url(#emeraldGradient)" stroke="var(--color-green)" strokeWidth="1.5" filter="url(#s3-shadow-net1)" />
                <text x="585" y="104" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-green)">🪣 AWS S3 Service Backplane</text>
                <text x="585" y="122" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)" fontWeight="bold" fontFamily="monospace">Prefix List: pl-63a5400a</text>
                <text x="585" y="138" textAnchor="middle" fontSize="8" fill="var(--color-green)" fontWeight="bold" fontFamily="monospace">vpce-0d8fa928bcde1a38</text>
                <text x="585" y="154" textAnchor="middle" fontSize="7" fill="var(--color-green)" fontStyle="italic">Direct Local VPC Gateway Interface</text>

                {/* Streaming packets */}
                <circle r="4.5" fill="var(--color-red)">
                  <animateMotion path="M 212 65 L 300 65 L 300 48 L 475 48" dur="2.2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
                </circle>
                <circle r="5" fill="var(--color-green)">
                  <animateMotion path="M 212 125 L 475 125" dur="1.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" />
                </circle>
              </svg>
            </div>

            {/* 🎨 S3 Route Table Matching SVG Diagram */}
            <div className="s3-sec">VPC Gateway Endpoints Routing Mechanics &amp; Route Table Rules</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Inside the VPC router fabrics: S3 Prefix Lists override default routes, forwarding traffic privately via Gateway links.
              </div>
              <svg viewBox="0 0 720 180" width="100%" className="s3-svg-bg" style={{ borderRadius: '8px', border: '1px solid var(--color-border-secondary)' }}>
                <defs>
                  <filter id="s3-shadow-net2" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--color-blue)" floodOpacity="0.08" />
                  </filter>
                </defs>

                {/* PREMIUM NESTED BOUNDARIES */}
                {/* Router table subnet */}
                <rect x="8" y="10" width="354" height="160" rx="8" fill="var(--s3-metric-card-bg)" fillOpacity="0.45" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                <text x="185" y="22" textAnchor="middle" fontSize="7" fill="var(--color-text-tertiary)" fontWeight="bold" letterSpacing="0.05em">🔒 VPC ROUTE TABLE RULE DETERMINATION LAYER</text>

                {/* Private AWS Endpoint */}
                <rect x="372" y="10" width="340" height="160" rx="12" fill="rgba(240, 253, 250, 0.25)" stroke="var(--color-blue)" strokeWidth="1.5" strokeDasharray="6,4" />
                <text x="542" y="22" textAnchor="middle" fontSize="7" fill="var(--color-blue)" fontWeight="bold" letterSpacing="0.05em">☁️ AWS PRIVATE VPCE REGIONAL TRANSIT SUBNET</text>

                {/* Private subnet route table */}
                <rect x="18" y="35" width="334" height="122" rx="6" fill="var(--s3-card-bg)" stroke="var(--color-border-tertiary)" strokeWidth="1" filter="url(#s3-shadow-net2)" />
                <text x="30" y="50" fontSize="9.5" fontWeight="bold" fill="var(--color-text-primary)">📁 Subnet VPC Route Table Rules</text>

                {/* Headers */}
                <rect x="26" y="58" width="318" height="18" fill="var(--color-background-tertiary)" rx="2" />
                <text x="32" y="70" fontSize="7.5" fontWeight="bold" fill="var(--color-text-secondary)">Destination IP Prefix</text>
                <text x="175" y="70" fontSize="7.5" fontWeight="bold" fill="var(--color-text-secondary)">Target VPCE / GW</text>
                <text x="285" y="70" fontSize="7.5" fontWeight="bold" fill="var(--color-text-secondary)">Status</text>

                {/* Rows */}
                <text x="32" y="90" fontSize="8" fontFamily="monospace" fill="var(--color-text-primary)">10.0.0.0/16 (VPC)</text>
                <text x="175" y="90" fontSize="8" fontFamily="monospace" fill="var(--color-text-secondary)">local</text>
                <text x="285" y="90" fontSize="8" fontWeight="bold" fill="var(--color-green)">Active</text>
                <line x1="26" y1="96" x2="344" y2="96" stroke="var(--color-border-secondary)" strokeWidth="0.5" />

                {/* S3 gateway route rule */}
                <rect x="26" y="100" width="318" height="18" fill="rgba(16, 185, 129, 0.08)" rx="2" />
                <text x="32" y="112" fontSize="8" fontFamily="monospace" fill="var(--color-green)" fontWeight="bold">pl-63a5400a (S3)</text>
                <text x="175" y="112" fontSize="8" fontFamily="monospace" fill="var(--color-green)" fontWeight="bold">vpce-0d8fa928</text>
                <text x="285" y="112" fontSize="8" fontWeight="bold" fill="var(--color-green)">Active</text>
                <line x1="26" y1="122" x2="344" y2="122" stroke="var(--color-border-secondary)" strokeWidth="0.5" />

                {/* Public Egress Route */}
                <text x="32" y="136" fontSize="8" fontFamily="monospace" fill="var(--color-red)">0.0.0.0/0 (Global)</text>
                <text x="175" y="136" fontSize="8" fontFamily="monospace" fill="var(--color-red)">nat-0d8fa2bc</text>
                <text x="285" y="136" fontSize="8" fontWeight="bold" fill="var(--color-green)">Active</text>

                {/* Packet Routing Visual */}
                <path d="M 352 111 L 385 111" stroke="var(--color-green)" strokeWidth="2.5" fill="none" className="s3-flow-green" />
                <text x="368" y="102" textAnchor="middle" fontSize="7" fill="var(--color-green)" fontWeight="bold">Match</text>

                {/* Target Private AWS Endpoint */}
                <rect x="386" y="35" width="314" height="122" rx="6" fill="var(--s3-success-bg)" stroke="var(--color-green)" strokeWidth="1.5" filter="url(#s3-shadow-net2)" />
                <text x="543" y="52" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-green)">🔌 Gateway Private Transit</text>
                <text x="398" y="68" fontSize="7.5" fill="var(--color-text-secondary)">
                  <tspan x="398" dy="0">Prefix rules intercept default 0.0.0.0/0 internet routes,</tspan>
                  <tspan x="398" dy="12">privately encapsulating packets inside secure regional</tspan>
                  <tspan x="398" dy="12">trunk connections.</tspan>
                </text>
                <rect x="398" y="106" width="290" height="42" rx="4" fill="var(--s3-card-bg)" fillOpacity="0.85" stroke="var(--s3-success-border)" strokeWidth="0.8" />
                <text x="406" y="120" fontSize="7.5" fill="var(--color-green)" fontWeight="bold">✔ ZERO TRANSIT CHARGES — FREE VPC EGRESS</text>
                <text x="406" y="136" fontSize="7.5" fill="var(--color-green)" fontWeight="bold">✔ ENCRYPTED INTERNAL Regional AWS Link</text>
              </svg>
            </div>

            {/* 🎨 S3 Access Points Multi-Tenant Access Control SVG Diagram */}
            <div className="s3-sec">S3 Access Points — Dedicated Subpath Gateways &amp; Partitioned Bucket Security</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                Access Points act as unique entry gates with their own scoped IAM resource policies. They eliminate complex monolithic bucket policies by isolating users to their respective subfolders.
              </div>
              <svg viewBox="0 0 740 310" width="100%" className="s3-svg-bg" style={{ borderRadius: '8px', border: '1px solid var(--color-border-secondary)' }}>
                <defs>
                  <filter id="s3-shadow-net3" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--color-blue)" floodOpacity="0.08" />
                  </filter>
                  <marker id="ap-arr-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-purple)" /></marker>
                  <marker id="ap-arr-teal" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-blue)" /></marker>
                  <marker id="ap-arr-orange" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-amber)" /></marker>
                  <marker id="ap-arr-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-blue)" /></marker>
                </defs>

                {/* PREMIUM NESTED BOUNDARIES */}
                {/* IAM Identities Subnet */}
                <rect x="8" y="10" width="144" height="290" rx="8" fill="var(--s3-metric-card-bg)" fillOpacity="0.45" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                <text x="80" y="22" textAnchor="middle" fontSize="6.5" fill="var(--color-text-tertiary)" fontWeight="bold" letterSpacing="0.05em">👤 DELEGATED IAM CALLER SUBNET</text>

                {/* Scoped Gateway Access Points Subnet */}
                <rect x="168" y="10" width="204" height="290" rx="12" fill="rgba(240, 253, 250, 0.25)" stroke="var(--color-blue)" strokeWidth="1.5" strokeDasharray="6,4" />
                <text x="270" y="22" textAnchor="middle" fontSize="6.5" fill="var(--color-blue)" fontWeight="bold" letterSpacing="0.05em">🔌 POLICY INGRESS GATEWAYS</text>

                {/* S3 Storage Engine Plane */}
                <rect x="388" y="10" width="344" height="290" rx="8" fill="var(--s3-success-bg)" fillOpacity="0.3" stroke="var(--color-green)" strokeWidth="1.5" strokeDasharray="3,3" />
                <text x="560" y="22" textAnchor="middle" fontSize="6.5" fill="var(--color-green)" fontWeight="bold" letterSpacing="0.05em">🪣 AWS S3 STORAGE ENGINE SUBPATH PLANE</text>

                {/* Left Column: Department Users */}
                {/* Finance User */}
                <rect x="15" y="32" width="130" height="60" rx="6" fill="var(--s3-card-bg)" stroke="var(--color-text-secondary)" strokeWidth="1.2" filter="url(#s3-shadow-net3)" />
                <text x="80" y="49" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">Finance Dept</text>
                <text x="80" y="65" textAnchor="middle" fontSize="9.5" fill="var(--color-purple)" fontWeight="bold">👤 Finance User</text>
                <path d="M 145 62 L 180 62" fill="none" stroke="var(--color-purple)" strokeWidth="1.5" markerEnd="url(#ap-arr-purple)" />

                {/* Sales User */}
                <rect x="15" y="122" width="130" height="60" rx="6" fill="var(--s3-card-bg)" stroke="var(--s3-card-border)" strokeWidth="1.2" filter="url(#s3-shadow-net3)" />
                <text x="80" y="139" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">Sales Dept</text>
                <text x="80" y="155" textAnchor="middle" fontSize="9.5" fill="var(--color-blue)" fontWeight="bold">👤 Sales User</text>
                <path d="M 145 152 L 180 152" fill="none" stroke="var(--color-blue)" strokeWidth="1.5" markerEnd="url(#ap-arr-teal)" />

                {/* Analytics Platform */}
                <rect x="15" y="212" width="130" height="60" rx="6" fill="var(--s3-card-bg)" stroke="var(--color-text-secondary)" strokeWidth="1.2" filter="url(#s3-shadow-net3)" />
                <text x="80" y="229" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">Analytics Sys</text>
                <text x="80" y="245" textAnchor="middle" fontSize="9.5" fill="var(--color-amber)" fontWeight="bold">🤖 Analytics App</text>
                <path d="M 145 242 L 180 242" fill="none" stroke="var(--color-red)" strokeWidth="1.5" markerEnd="url(#ap-arr-orange)" />

                {/* Middle Column: Scoped Access Points + Policies */}
                {/* Finance Access Point */}
                <rect x="180" y="32" width="180" height="68" rx="6" fill="var(--s3-card-bg)" stroke="var(--color-purple)" strokeWidth="1.5" filter="url(#s3-shadow-net3)" />
                <text x="270" y="47" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-purple)">🔑 Finance Access Point</text>
                <text x="188" y="65" fontSize="8" fill="var(--color-purple)" fontWeight="bold">✔ Scoped: /finance/* prefix</text>
                <text x="188" y="77" fontSize="7.5" fill="var(--color-text-secondary)">Policy: Grant R/W to Finance</text>
                <rect x="338" y="70" width="16" height="12" rx="2" fill="var(--color-purple)" />
                <text x="346" y="79" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold">✔</text>
                <path d="M 360 62 L 450 62 L 450 90 L 498 90" fill="none" stroke="var(--color-purple)" strokeWidth="1.5" markerEnd="url(#ap-arr-purple)" />

                {/* Sales Access Point */}
                <rect x="180" y="122" width="180" height="68" rx="6" fill="var(--s3-card-border)" stroke="var(--color-blue)" strokeWidth="1.5" filter="url(#s3-shadow-net3)" />
                <text x="270" y="137" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-blue)">🔑 Sales Access Point</text>
                <text x="188" y="155" fontSize="8" fill="var(--color-blue)" fontWeight="bold">✔ Scoped: /sales/* prefix</text>
                <text x="188" y="167" fontSize="7.5" fill="var(--color-text-secondary)">Policy: Grant R/W to Sales</text>
                <rect x="338" y="160" width="16" height="12" rx="2" fill="var(--color-blue)" />
                <text x="346" y="169" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold">✔</text>
                <path d="M 360 152 L 498 152" fill="none" stroke="var(--color-blue)" strokeWidth="1.5" markerEnd="url(#ap-arr-teal)" />

                {/* Analytics Access Point */}
                <rect x="180" y="212" width="180" height="68" rx="6" fill="var(--s3-card-bg)" stroke="var(--color-red)" strokeWidth="1.5" filter="url(#s3-shadow-net3)" />
                <text x="270" y="227" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-red)">🔑 Analytics Access Point</text>
                <text x="188" y="245" fontSize="8" fill="var(--color-red)" fontWeight="bold">✔ Scoped: Entire Bucket</text>
                <text x="188" y="257" fontSize="7.5" fill="var(--color-text-secondary)">Policy: Grant Read to all prefixes</text>
                <rect x="338" y="250" width="16" height="12" rx="2" fill="var(--color-amber)" />
                <text x="346" y="259" textAnchor="middle" fontSize="7.5" fill="#ffffff" fontWeight="bold">✔</text>
                <path d="M 360 242 L 450 242 L 450 215 L 498 215" fill="none" stroke="var(--color-red)" strokeWidth="1.5" markerEnd="url(#ap-arr-orange)" />

                {/* Right Column: Shared S3 Bucket */}
                <rect x="398" y="32" width="324" height="258" rx="8" fill="var(--s3-metric-card-bg)" stroke="var(--color-blue)" strokeWidth="2" filter="url(#s3-shadow-net3)" />
                <text x="560" y="50" textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--color-blue)">🪣 Shared Monolithic S3 Bucket</text>

                {/* Red Monolithic Policy warning */}
                <rect x="612" y="58" width="95" height="32" rx="4" fill="var(--s3-error-bg)" stroke="var(--color-red)" strokeWidth="1.2" />
                <text x="660" y="70" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--color-red)">Bucket Policy</text>
                <text x="660" y="82" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="bold">❌ Simplified!</text>

                {/* Folders (Subpaths) */}
                {/* /finance */}
                <rect x="408" y="98" width="304" height="56" rx="4" fill="var(--s3-card-bg)" stroke="var(--s3-card-border)" strokeWidth="1.5" filter="url(#s3-shadow-net3)" />
                <text x="418" y="114" fontSize="10" fontWeight="bold" fill="var(--color-blue)">📂 /finance/ subpath</text>
                <text x="418" y="128" fontSize="8" fill="var(--color-text-secondary)">Holds cost reports, ledgers &amp; invoices</text>
                <text x="418" y="142" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">Authorized for: Finance User &amp; Analytics</text>

                {/* /sales */}
                <rect x="408" y="168" width="304" height="56" rx="4" fill="var(--s3-card-bg)" stroke="var(--color-green)" strokeWidth="1.5" filter="url(#s3-shadow-net3)" />
                <text x="418" y="184" fontSize="10" fontWeight="bold" fill="var(--color-blue)">📂 /sales/ subpath</text>
                <text x="418" y="198" fontSize="8" fill="var(--color-text-secondary)">Holds customer contracts &amp; pipelines</text>
                <text x="418" y="212" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">Authorized for: Sales User &amp; Analytics</text>

                {/* Divider Line */}
                <line x1="398" y1="245" x2="722" y2="245" stroke="var(--s3-card-border)" strokeWidth="1" />
                <text x="560" y="262" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="var(--color-blue)">✔ Access Management: Simplify security control</text>
              </svg>
            </div>

            {/* 🛡️ Interactive Access Point Scoped Gateway Sandbox */}
            <div className="s3-sec">🛡️ Interactive Multi-Tenant Access Points Routing Gateway Sandbox</div>
            <div className="s3-card">
              <div className="s3-g2">
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                    Multi-Tenant Traffic Control Sandbox
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '16px', lineHeight: '1.4' }}>
                    Access Points prevent administrative bottlenecks by delegating bucket directory permissions to specific endpoints. Test different identities and routing paths.
                  </div>

                  <div className="s3-g3" style={{ gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '10px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>1. Inbound Identity</label>
                      <select className="s3-card select" style={{ width: '100%', padding: '6px', fontSize: '12px' }} value={apIdentity} onChange={(e) => { setApIdentity(e.target.value as any); setApAnimationState('idle'); }}>
                        <option value="finance_user">👤 Finance IAM User</option>
                        <option value="sales_user">👤 Sales IAM User</option>
                        <option value="auditor">🔎 Compliance Auditor</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>2. Connection Gateway</label>
                      <select className="s3-card select" style={{ width: '100%', padding: '6px', fontSize: '12px' }} value={apEndpoint} onChange={(e) => { setApEndpoint(e.target.value as any); setApAnimationState('idle'); }}>
                        <option value="bucket_root">🪣 Main Bucket Endpoint</option>
                        <option value="finance_ap">🔌 Finance Access Point</option>
                        <option value="sales_ap">🔌 Sales Access Point</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>3. Target Folder Path</label>
                      <select className="s3-card select" style={{ width: '100%', padding: '6px', fontSize: '12px' }} value={apAction} onChange={(e) => { setApAction(e.target.value as any); setApAnimationState('idle'); }}>
                        <option value="read_finance">📁 Read /finance/ledger.xlsx</option>
                        <option value="read_sales">📁 Read /sales/contracts.pdf</option>
                      </select>
                    </div>
                  </div>

                  <button className="s3-btn s3-on" style={{ width: '100%', fontWeight: 'bold', background: '#8b5cf6', color: '#fff', borderColor: '#8b5cf6' }} onClick={handleAccessPointRoute} disabled={apAnimationState === 'routing'}>
                    {apAnimationState === 'routing' ? '⚡ Routing packet through Access Point policy...' : '🚀 Dispatch Request Packet'}
                  </button>

                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Access Point evaluation logs:</div>
                    <div ref={apTerminalRef} className="s3-terminal" style={{ height: '110px', color: '#a78bfa', borderColor: '#7c3aed' }}>
                      {apResultLogs.length === 0 ? (
                        <div style={{ color: 'var(--color-text-tertiary)' }}>[idle] Awaiting request dispatch...</div>
                      ) : (
                        apResultLogs.map((log, idx) => (
                          <div key={idx} style={{
                            color: log.includes('❌') ? '#ef4444' : log.includes('✅') ? '#10b981' : log.includes('gateway') ? '#8b5cf6' : '#a78bfa',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            marginBottom: '2px'
                          }}>
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Overlay and Diagram Visual */}
                <div style={{ background: 'var(--s3-metric-card-bg)', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--s3-metric-card-border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>Live Routing Visualization:</div>
                  
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    {/* Beautiful reactive sandbox SVG */}
                    <svg viewBox="0 0 350 220" width="100%" height="220" style={{ background: 'var(--s3-bg)', borderRadius: '8px', border: '1.5px solid var(--s3-card-border)', overflow: 'visible' }}>
                      <defs>
                        <marker id="sandbox-arr" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto"><path d="M0,0 L0,4 L4,2 z" fill="var(--s3-success-bg)" /></marker>
                        <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
                        <filter id="glow-teal" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
                        <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
                        <filter id="s3-shadow-net4" x="-10%" y="-10%" width="120%" height="120%">
                          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="var(--color-blue)" floodOpacity="0.06" />
                        </filter>
                      </defs>

                      {/* PREMIUM NESTED BOUNDARIES */}
                      {/* Inbound caller boundary */}
                      <rect x="2" y="10" width="66" height="200" rx="6" fill="var(--s3-metric-card-bg)" fillOpacity="0.45" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="35" y="18" textAnchor="middle" fontSize="5.5" fill="var(--color-text-tertiary)" fontWeight="bold">👤 INBOUND</text>

                      {/* Gateway AP boundary */}
                      <rect x="135" y="10" width="70" height="200" rx="8" fill="rgba(240, 253, 250, 0.25)" stroke="var(--color-blue)" strokeWidth="1" strokeDasharray="5,3" />
                      <text x="170" y="18" textAnchor="middle" fontSize="5.5" fill="var(--color-blue)" fontWeight="bold">🔌 GATEWAY</text>

                      {/* S3 subpath storage boundary */}
                      <rect x="270" y="10" width="78" height="200" rx="6" fill="var(--s3-success-bg)" fillOpacity="0.3" stroke="var(--color-green)" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="309" y="18" textAnchor="middle" fontSize="5.5" fill="var(--color-green)" fontWeight="bold">🪣 STORAGE</text>

                      {/* Dynamic Connection Path */}
                      {(() => {
                        const callerY = apIdentity === 'finance_user' ? 45 : apIdentity === 'sales_user' ? 110 : 175;
                        const gatewayY = apEndpoint === 'bucket_root' ? 45 : apEndpoint === 'finance_ap' ? 110 : 175;
                        const targetY = apAction === 'read_finance' ? 75 : 145;
                        const apPathD = `M 65 ${callerY} L 170 ${gatewayY} L 275 ${targetY}`;
                        const packetColor = apIdentity === 'finance_user' ? '#8b5cf6' : apIdentity === 'sales_user' ? '#0d9488' : '#ea580c';
                        
                        return (
                          <>
                            {/* Standard connector pathway */}
                            <path d={apPathD} fill="none" stroke="var(--s3-card-border)" strokeWidth="1.5" strokeDasharray="3,3" />

                            {/* Active packet flow under evaluation */}
                            {apAnimationState === 'routing' && (
                              <circle r="6" fill={packetColor} style={{ filter: `drop-shadow(0 0 4px ${packetColor})` }}>
                                <animateMotion dur="1.4s" repeatCount="indefinite" path={apPathD} />
                                <animate attributeName="opacity" values="1;0.4;1" dur="0.7s" repeatCount="indefinite" />
                              </circle>
                            )}

                            {/* Granted packet at target */}
                            {apAnimationState === 'granted' && (
                              <circle cx="280" cy={targetY} r="7" fill="var(--color-green)" style={{ filter: 'drop-shadow(0 0 6px #10b981)' }}>
                                <animate attributeName="r" values="7;10;7" dur="1.5s" repeatCount="indefinite" />
                              </circle>
                            )}

                            {/* Denied packet hitting barrier */}
                            {apAnimationState === 'denied' && (
                              <>
                                {/* Blocked red packet particle blast */}
                                <circle cx="170" cy={gatewayY} r="7" fill="var(--color-red)" style={{ filter: 'drop-shadow(0 0 6px #ef4444)' }} />
                                <line x1="170" y1={gatewayY} x2="160" y2={gatewayY - 12} stroke="var(--color-red)" strokeWidth="1.5" opacity="0.8" />
                                <line x1="170" y1={gatewayY} x2="180" y2={gatewayY + 12} stroke="var(--color-red)" strokeWidth="1.5" opacity="0.8" />
                                <line x1="170" y1={gatewayY} x2="155" y2={gatewayY + 8} stroke="var(--color-red)" strokeWidth="1.5" opacity="0.8" />
                                <line x1="170" y1={gatewayY} x2="185" y2={gatewayY - 8} stroke="var(--color-red)" strokeWidth="1.5" opacity="0.8" />
                                <circle cx="160" cy={gatewayY - 12} r="2" fill="var(--color-red)" />
                                <circle cx="180" cy={gatewayY + 12} r="2" fill="var(--color-red)" />
                                <circle cx="155" cy={gatewayY + 8} r="2" fill="var(--color-red)" />
                                <circle cx="185" cy={gatewayY - 8} r="2" fill="var(--color-red)" />
                              </>
                            )}
                          </>
                        );
                      })()}

                      {/* Identities (Column 1) */}
                      {/* Finance User */}
                      <rect x="5" y="24" width="60" height="42" rx="4" 
                        fill={apIdentity === 'finance_user' ? 'rgba(139, 92, 246, 0.15)' : 'var(--s3-card-bg)'} 
                        stroke={apIdentity === 'finance_user' ? 'var(--color-purple)' : 'var(--s3-card-border)'} 
                        strokeWidth={apIdentity === 'finance_user' ? '2' : '1'} 
                        filter="url(#s3-shadow-net4)" />
                      <text x="35" y="40" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill={apIdentity === 'finance_user' ? 'var(--color-purple)' : 'var(--color-text-secondary)'}>👤 Finance</text>
                      <text x="35" y="52" textAnchor="middle" fontSize="6.5" fill="var(--color-purple)" fontWeight="bold">IAM User</text>

                      {/* Sales User */}
                      <rect x="5" y="89" width="60" height="42" rx="4" 
                        fill={apIdentity === 'sales_user' ? 'rgba(13, 148, 136, 0.15)' : 'var(--s3-card-bg)'} 
                        stroke={apIdentity === 'sales_user' ? '#0d9488' : 'var(--s3-card-border)'} 
                        strokeWidth={apIdentity === 'sales_user' ? '2' : '1'} 
                        filter="url(#s3-shadow-net4)" />
                      <text x="35" y="105" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill={apIdentity === 'sales_user' ? '#0f766e' : 'var(--color-text-secondary)'}>👤 Sales</text>
                      <text x="35" y="117" textAnchor="middle" fontSize="6.5" fill="var(--color-blue)" fontWeight="bold">IAM User</text>

                      {/* Auditor */}
                      <rect x="5" y="154" width="60" height="42" rx="4" 
                        fill={apIdentity === 'auditor' ? 'rgba(234, 88, 12, 0.15)' : 'var(--s3-card-bg)'} 
                        stroke={apIdentity === 'auditor' ? 'var(--color-amber)' : 'var(--s3-card-border)'} 
                        strokeWidth={apIdentity === 'auditor' ? '2' : '1'} 
                        filter="url(#s3-shadow-net4)" />
                      <text x="35" y="170" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill={apIdentity === 'auditor' ? 'var(--color-amber)' : 'var(--color-text-secondary)'}>🔎 Auditor</text>
                      <text x="35" y="182" textAnchor="middle" fontSize="6.5" fill="var(--color-amber)" fontWeight="bold">Compliance</text>


                      {/* Gateways (Column 2) */}
                      {/* Main Bucket Endpoint */}
                      <rect x="140" y="24" width="60" height="42" rx="4" 
                        fill={apEndpoint === 'bucket_root' ? 'rgba(239, 68, 68, 0.15)' : 'var(--s3-card-bg)'} 
                        stroke={apEndpoint === 'bucket_root' ? 'var(--color-red)' : 'var(--s3-card-border)'} 
                        strokeWidth={apEndpoint === 'bucket_root' ? '2' : '1'}
                        filter="url(#s3-shadow-net4)" />
                      <text x="170" y="40" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill={apEndpoint === 'bucket_root' ? 'var(--color-red)' : 'var(--color-text-secondary)'}>🪣 Root</text>
                      <text x="170" y="52" textAnchor="middle" fontSize="6" fill="var(--color-red)" fontWeight="bold">Direct Gate</text>

                      {/* Finance AP */}
                      <rect x="140" y="89" width="60" height="42" rx="4" 
                        fill={apEndpoint === 'finance_ap' ? 'rgba(139, 92, 246, 0.15)' : 'var(--s3-card-bg)'} 
                        stroke={apEndpoint === 'finance_ap' ? 'var(--color-purple)' : 'var(--s3-card-border)'} 
                        strokeWidth={apEndpoint === 'finance_ap' ? '2' : '1'}
                        filter="url(#s3-shadow-net4)" />
                      <text x="170" y="105" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill={apEndpoint === 'finance_ap' ? 'var(--color-purple)' : 'var(--color-text-secondary)'}>🔌 Finance</text>
                      <text x="170" y="117" textAnchor="middle" fontSize="6.5" fill="var(--color-purple)" fontWeight="bold">Access Pt</text>

                      {/* Sales AP */}
                      <rect x="140" y="154" width="60" height="42" rx="4" 
                        fill={apEndpoint === 'sales_ap' ? 'rgba(13, 148, 136, 0.15)' : 'var(--s3-card-bg)'} 
                        stroke={apEndpoint === 'sales_ap' ? '#0d9488' : 'var(--s3-card-border)'} 
                        strokeWidth={apEndpoint === 'sales_ap' ? '2' : '1'}
                        filter="url(#s3-shadow-net4)" />
                      <text x="170" y="170" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill={apEndpoint === 'sales_ap' ? '#0f766e' : 'var(--color-text-secondary)'}>🔌 Sales</text>
                      <text x="170" y="182" textAnchor="middle" fontSize="6.5" fill="var(--color-blue)" fontWeight="bold">Access Pt</text>


                      {/* Target Folder Subpaths (Column 3) */}
                      {/* /finance/ */}
                      <rect x="274" y="45" width="70" height="54" rx="4" fill="var(--s3-card-bg)" stroke="var(--s3-card-border)" strokeWidth="1" filter="url(#s3-shadow-net4)" />
                      <text x="309" y="61" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="var(--color-blue)">📂 /finance/</text>
                      <text x="309" y="73" textAnchor="middle" fontSize="6.5" fill="var(--color-purple)">Ledgers &amp; Bills</text>
                      <rect x="281" y="80" width="56" height="12" rx="2" fill="var(--color-text-secondary)" />
                      <text x="309" y="88.5" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="var(--color-blue)">Scoped Path</text>

                      {/* /sales/ */}
                      <rect x="274" y="120" width="70" height="54" rx="4" fill="var(--s3-card-bg)" stroke="var(--color-green)" strokeWidth="1" filter="url(#s3-shadow-net4)" />
                      <text x="309" y="136" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="var(--color-blue)">📂 /sales/</text>
                      <text x="309" y="148" textAnchor="middle" fontSize="6.5" fill="var(--color-blue)">Contracts &amp; Leads</text>
                      <rect x="281" y="155" width="56" height="12" rx="2" fill="var(--s3-success-bg)" />
                      <text x="309" y="163.5" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="var(--color-blue)">Scoped Path</text>

                      {/* Active security verdicts displayed on sandbox SVG */}
                      {apAnimationState === 'granted' && (
                        <g transform="translate(170, 110)">
                          <circle r="22" fill="var(--s3-success-bg)" stroke="var(--color-green)" strokeWidth="2" style={{ filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.3))' }} />
                          <text x="0" y="5" textAnchor="middle" fontSize="14" fontWeight="bold" fill="var(--color-green)">✔</text>
                        </g>
                      )}
                      {apAnimationState === 'denied' && (
                        <g transform="translate(170, 110)">
                          <circle r="22" fill="var(--s3-error-bg)" stroke="var(--color-red)" strokeWidth="2" style={{ filter: 'drop-shadow(0 2px 4px rgba(239,68,68,0.3))' }} />
                          <text x="0" y="5" textAnchor="middle" fontSize="14" fontWeight="bold" fill="var(--color-red)">✖</text>
                        </g>
                      )}
                    </svg>

                    {/* Verdict overlay text */}
                    {apAnimationState === 'granted' && (
                      <div style={{ marginTop: '8px', color: 'var(--s3-success-text)', background: 'var(--s3-success-bg)', border: '1px solid var(--s3-success-border)', padding: '8px', borderRadius: '6px', width: '100%', fontSize: '11px', textAlign: 'center', fontWeight: 'bold' }}>
                        🎉 GET 200 AUTHORIZED! ACCESS AP HANDSHAKE SUCCESS!
                      </div>
                    )}
                    {apAnimationState === 'denied' && (
                      <div style={{ marginTop: '8px', color: 'var(--s3-error-text)', background: 'var(--s3-error-bg)', border: '1px solid var(--s3-error-border)', padding: '8px', borderRadius: '6px', width: '100%', fontSize: '11px', textAlign: 'center', fontWeight: 'bold' }}>
                        ❌ ACCESS DENIED (HTTP 403) — CHECK PERMISSIONS/GATEWAY!
                      </div>
                    )}
                    {apAnimationState === 'idle' && (
                      <div style={{ marginTop: '8px', color: 'var(--color-text-tertiary)', background: 'var(--s3-metric-card-bg)', border: '1px solid var(--s3-card-border)', padding: '8px', borderRadius: '6px', width: '100%', fontSize: '11px', textAlign: 'center' }}>
                        💤 Sandbox Ready: Click <b>Dispatch Request Packet</b> to simulate route validation.
                      </div>
                    )}
                  </div>

                  {apAnimationState !== 'idle' && (
                    <button className="s3-btn" style={{ fontSize: '11px', width: '100%', fontWeight: 600, marginTop: '8px' }} onClick={() => setApAnimationState('idle')}>
                      Reset &amp; Run Next Test
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        
          </Translate>)}

        {/* TAB 7: TRANSFER & REPLICATION */}
        {!isComparative && activeTab === 'transfer' && (
          <Translate>
          <div>


            {/* 🎨 Transfer Acceleration SVG Diagram */}
            <div className="s3-sec">Standard Routing vs. S3 Transfer Acceleration Route Map</div>
            <div className="s3-card">
              <div className="s3-g2">
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, marginBottom: '8px' }}>⚡ Trans-Pacific Speed Simulator</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                    Trigger a live trans-pacific network routing trace from the **USA terminal** to the **Australia ap-southeast-2 bucket** to compare latency and packet delivery channels.
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                    <label style={{ fontSize: '11px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Configure Ingestion Route Channel:</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className={`s3-btn ${transferRouteMode === 'standard' ? 's3-on' : ''}`} style={{ flex: 1, fontWeight: 'bold' }} onClick={() => { setTransferRouteMode('standard'); setTransferStep(0); setTransferLogs([]); }}>⚠️ Public Route</button>
                      <button className={`s3-btn ${transferRouteMode === 'accelerated' ? 's3-on' : ''}`} style={{ flex: 1, fontWeight: 'bold' }} onClick={() => { setTransferRouteMode('accelerated'); setTransferStep(0); setTransferLogs([]); }}>⚡ Accelerated Route</button>
                    </div>
                  </div>

                  <button onClick={startTransferSimulation} disabled={transferIsRunning} className="s3-btn s3-on" style={{ width: '100%', fontWeight: 'bold', marginBottom: '12px' }}>
                    {transferIsRunning ? '⚡ Packet in Transit...' : '🚀 Dispatch Test Payload Upload'}
                  </button>

                  {/* Performance Indicators Grid */}
                  <div className="s3-g2" style={{ gap: '10px', marginBottom: '12px' }}>
                    <div style={{ background: 'var(--color-background-secondary)', padding: '10px', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Est. Latency</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: transferRouteMode === 'accelerated' ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>
                        {transferRouteMode === 'accelerated' ? '190 ms' : '820 ms'}
                      </div>
                      <div style={{ fontSize: '8px', color: 'var(--color-text-secondary)' }}>Trans-Pacific Avg</div>
                    </div>

                    <div style={{ background: 'var(--color-background-secondary)', padding: '10px', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)', textAlign: 'center' }}>
                      <div style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Throughput</div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: transferRouteMode === 'accelerated' ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>
                        {transferRouteMode === 'accelerated' ? '631 MB/s' : '146 MB/s'}
                      </div>
                      <div style={{ fontSize: '8px', color: 'var(--color-text-secondary)' }}>326% Speedup Factor!</div>
                    </div>
                  </div>

                  {/* Terminal log panel */}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Network route tracer logs:</div>
                    <div ref={transferTerminalRef} className="s3-terminal" style={{ height: '110px' }}>
                      {transferLogs.length === 0 ? (
                        <div style={{ color: 'var(--color-text-tertiary)' }}>[idle] Awaiting upload simulation dispatch...</div>
                      ) : (
                        transferLogs.map((log, idx) => (
                          <div key={idx} style={{
                            color: log.includes('❌') ? '#ef4444' : log.includes('✅') ? '#10b981' : log.includes('⚡') ? '#10b981' : '#38bdf8',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            marginBottom: '2px'
                          }}>
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* SVG Route Visualization with animated packet */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  {transferRouteMode === 'standard' ? (
                    <svg viewBox="0 0 350 250" width="100%" height="250" className="s3-svg-bg" style={{ borderRadius: '8px', border: '1.5px solid var(--s3-error-border)', background: 'var(--s3-error-bg)' }}>
                      <defs>
                        <marker id="arr-accel-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-red)" /></marker>
                        <filter id="s3-shadow-net5" x="-10%" y="-10%" width="120%" height="120%">
                          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--color-red)" floodOpacity="0.06" />
                        </filter>
                      </defs>

                      {/* PREMIUM NESTED BOUNDARIES */}
                      {/* Client Boundary */}
                      <rect x="5" y="10" width="120" height="195" rx="6" fill="var(--s3-metric-card-bg)" fillOpacity="0.4" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="65" y="20" textAnchor="middle" fontSize="6.5" fill="var(--color-text-tertiary)" fontWeight="bold">💻 USA LOCAL CLIENT</text>

                      {/* Internet Plane */}
                      <rect x="131" y="10" width="88" height="195" rx="8" fill="rgba(254, 242, 242, 0.3)" stroke="var(--s3-error-border)" strokeWidth="1.2" strokeDasharray="4,2" />
                      <text x="175" y="20" textAnchor="middle" fontSize="6" fill="var(--color-red)" fontWeight="bold">🌍 PUBLIC INTERNET</text>

                      {/* Target Region */}
                      <rect x="225" y="10" width="120" height="195" rx="6" fill="var(--s3-metric-card-bg)" fillOpacity="0.4" stroke="var(--color-red)" strokeWidth="1.2" strokeDasharray="3,3" />
                      <text x="285" y="20" textAnchor="middle" fontSize="6.5" fill="var(--color-red)" fontWeight="bold">🇦🇺 SYDNEY TARGET</text>

                      {/* Nodes */}
                      {/* USA Terminal */}
                      <rect x="15" y="30" width="100" height="42" rx="6" fill="var(--s3-card-bg)" stroke="var(--s3-error-border)" strokeWidth="1.5" filter="url(#s3-shadow-net5)" />
                      <text x="65" y="44" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-text-primary)">Client (USA)</text>
                      <text x="65" y="56" textAnchor="middle" fontSize="8" fill="var(--color-red)" fontWeight="bold">Standard WWW</text>

                      {/* ISP hop */}
                      <circle cx="65" cy="125" r="18" fill="var(--s3-card-bg)" stroke="var(--s3-error-border)" strokeWidth="1.5" filter="url(#s3-shadow-net5)" />
                      <text x="65" y="128" textAnchor="middle" fontSize="8" fill="var(--color-red)" fontWeight="bold">Local ISP</text>

                      {/* BGP 1 hop */}
                      <circle cx="175" cy="80" r="18" fill="var(--s3-card-bg)" stroke="var(--s3-error-border)" strokeWidth="1.5" strokeDasharray="3,1" filter="url(#s3-shadow-net5)" />
                      <text x="175" y="83" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="bold">AS-Peer A</text>

                      {/* BGP 2 hop */}
                      <circle cx="175" cy="150" r="18" fill="var(--s3-card-bg)" stroke="var(--s3-error-border)" strokeWidth="1.5" strokeDasharray="3,1" filter="url(#s3-shadow-net5)" />
                      <text x="175" y="153" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="bold">AS-Peer B</text>

                      {/* Sydney S3 Bucket */}
                      <rect x="235" y="110" width="100" height="70" rx="6" fill="var(--s3-card-bg)" stroke="var(--s3-error-border)" strokeWidth="2" filter="url(#s3-shadow-net5)" />
                      <text x="285" y="130" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-text-primary)">🪣 Target S3</text>
                      <text x="285" y="145" textAnchor="middle" fontSize="8.5" fill="var(--color-red)" fontWeight="bold">🇦🇺 Australia</text>
                      <text x="285" y="158" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">Public Link</text>

                      {/* Paths */}
                      <path d="M 65 72 L 65 107" fill="none" stroke="var(--s3-error-border)" strokeWidth="1.5" markerEnd="url(#arr-accel-red)" />
                      <path d="M 83 125 L 157 88" fill="none" stroke="var(--s3-error-border)" strokeWidth="1.5" markerEnd="url(#arr-accel-red)" />
                      <path d="M 175 98 L 175 132" fill="none" stroke="var(--s3-error-border)" strokeWidth="1.5" markerEnd="url(#arr-accel-red)" />
                      <path d="M 193 150 L 235 140" fill="none" stroke="var(--color-red)" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#arr-accel-red)" />

                      <text x="175" y="225" textAnchor="middle" fontSize="9.5" fill="var(--color-red)" fontWeight="bold">🐌 Multi-Hop Congested Public WWW (~820ms)</text>

                      {/* Glowing animated data packet */}
                      {transferIsRunning && (
                        <circle cx={
                          transferStep === 1 ? 65 :
                          transferStep === 2 ? 65 :
                          transferStep === 3 ? 175 :
                          285
                        } cy={
                          transferStep === 1 ? 50 :
                          transferStep === 2 ? 125 :
                          transferStep === 3 ? 150 :
                          140
                        } r="7" fill="var(--color-red)" style={{ filter: 'drop-shadow(0 0 5px #ef4444)' }}>
                          <animate attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite" />
                        </circle>
                      )}
                    </svg>
                  ) : (
                    <svg viewBox="0 0 350 250" width="100%" height="250" className="s3-svg-bg" style={{ borderRadius: '8px', border: '1.5px solid var(--s3-success-border)', background: 'var(--s3-success-bg)' }}>
                      <defs>
                        <marker id="arr-accel-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-green)" /></marker>
                        <filter id="s3-shadow-net6" x="-10%" y="-10%" width="120%" height="120%">
                          <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--color-blue)" floodOpacity="0.06" />
                        </filter>
                      </defs>

                      {/* PREMIUM NESTED BOUNDARIES */}
                      {/* Client Boundary */}
                      <rect x="5" y="10" width="120" height="195" rx="6" fill="var(--s3-metric-card-bg)" fillOpacity="0.4" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                      <text x="65" y="20" textAnchor="middle" fontSize="6.5" fill="var(--color-text-tertiary)" fontWeight="bold">💻 USA CLIENT OFFICE</text>

                      {/* POP Ingress edge boundary */}
                      <rect x="131" y="10" width="88" height="195" rx="8" fill="rgba(240, 253, 250, 0.25)" stroke="var(--color-blue)" strokeWidth="1.2" strokeDasharray="5,3" />
                      <text x="175" y="20" textAnchor="middle" fontSize="5.5" fill="var(--color-blue)" fontWeight="bold">🔌 INGEST EDGE POP</text>

                      {/* AWS Private Global network boundary */}
                      <rect x="225" y="10" width="120" height="195" rx="6" fill="rgba(240, 253, 250, 0.2)" stroke="var(--color-green)" strokeWidth="1.2" strokeDasharray="3,3" />
                      <text x="285" y="20" textAnchor="middle" fontSize="6.5" fill="var(--color-green)" fontWeight="bold">☁️ AWS BACKBONE SUBNET</text>

                      {/* USA Terminal */}
                      <rect x="15" y="30" width="100" height="42" rx="6" fill="var(--s3-card-bg)" stroke="var(--color-green)" strokeWidth="1.5" filter="url(#s3-shadow-net6)" />
                      <text x="65" y="44" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-text-primary)">Client (USA)</text>
                      <text x="65" y="56" textAnchor="middle" fontSize="8" fill="var(--color-green)" fontWeight="bold">Accelerated Endpoint</text>

                      {/* USA POP Ingestion */}
                      <rect x="15" y="115" width="100" height="42" rx="6" fill="var(--s3-card-bg)" stroke="var(--color-green)" strokeWidth="1.5" filter="url(#s3-shadow-net6)" />
                      <text x="65" y="130" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--s3-success-text-bold)">USA POP Edge</text>
                      <text x="65" y="143" textAnchor="middle" fontSize="8" fill="var(--color-green)" fontWeight="bold">CloudFront Node</text>

                      {/* Sydney S3 Bucket */}
                      <rect x="235" y="110" width="100" height="70" rx="6" fill="var(--s3-card-bg)" stroke="var(--color-green)" strokeWidth="2" filter="url(#s3-shadow-net6)" />
                      <text x="285" y="130" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-text-primary)">🪣 Target S3</text>
                      <text x="285" y="145" textAnchor="middle" fontSize="8.5" fill="var(--color-green)" fontWeight="bold">🇦🇺 Australia</text>
                      <text x="285" y="158" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">ap-southeast-2</text>

                      {/* Paths */}
                      <path d="M 65 72 L 65 115" fill="none" stroke="var(--color-green)" strokeWidth="2" markerEnd="url(#arr-accel-green)" />
                      <path d="M 115 136 L 235 136" fill="none" stroke="var(--color-green)" strokeWidth="2.5" markerEnd="url(#arr-accel-green)" />

                      <text x="175" y="126" textAnchor="middle" fontSize="8.5" fill="var(--color-green)" fontWeight="bold">⚡ Undersea Fiber</text>
                      <text x="175" y="225" textAnchor="middle" fontSize="9.5" fill="var(--color-green)" fontWeight="bold">⚡ Direct AWS Private Global Backbone Transit (~190ms)</text>

                      {/* Glowing animated data packet */}
                      {transferIsRunning && (
                        <circle cx={
                          transferStep === 1 ? 65 :
                          transferStep === 2 ? 65 :
                          transferStep === 3 ? 175 :
                          285
                        } cy={
                          transferStep === 1 ? 50 :
                          transferStep === 2 ? 136 :
                          transferStep === 3 ? 136 :
                          130
                        } r="7" fill="var(--color-green)" style={{ filter: 'drop-shadow(0 0 5px #10b981)' }}>
                          <animate attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite" />
                        </circle>
                      )}
                    </svg>
                  )}
                </div>
              </div>

              {/* Inbound acceleration note points from notes */}
              <div style={{ marginTop: '12px', background: 'var(--color-background-secondary)', padding: '10px', borderRadius: '6px', display: 'flex', justifyContent: 'space-around', fontSize: '11px', flexWrap: 'wrap', gap: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
                <div>🚀 <b>Mainly from Outside:</b> Best for external clients uploading into remote regional buckets.</div>
                <div>📦 <b>Multipart Upload Compatible:</b> Accelerates segmented large block transfers concurrently.</div>
                <div>🐘 <b>Helpful for Big Data:</b> Optimizes heavy data ingestion pipelines across geographical boundaries.</div>
                <div>🔒 <b>AWS Private Backbone:</b> Uses dedicated high-speed fiber channels for guaranteed secure packets delivery.</div>
              </div>
            </div>

            {/* 🎨 CRR/SRR Replication SVG Diagram */}
            <div className="s3-sec">S3 Same-Region (SRR) &amp; Cross-Region (CRR) Async Replication Architecture</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Replication is asynchronous. Inbound objects trigger background IAM workers to copy files securely across AZs or geographical borders.
              </div>
              <svg viewBox="0 0 700 180" width="100%" className="s3-svg-bg" style={{ borderRadius: '8px', border: '1px solid var(--color-border-secondary)' }}>
                <defs>
                  <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-card-border)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--s3-card-border)" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-grad-purple-start)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--s3-grad-ssec-engine-end)" stopOpacity="0.8" />
                  </linearGradient>
                  <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--s3-card-border)" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="var(--color-text-secondary)" stopOpacity="0.8" />
                  </linearGradient>
                  <marker id="rep-arr-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-green)" /></marker>
                  <marker id="rep-arr-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-purple)" /></marker>
                  <filter id="s3-shadow-net7" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--color-blue)" floodOpacity="0.06" />
                  </filter>
                </defs>

                {/* PREMIUM NESTED BOUNDARIES */}
                {/* Replication Zone Boundary */}
                <rect x="10" y="10" width="210" height="160" rx="6" fill="var(--s3-metric-card-bg)" fillOpacity="0.2" stroke="var(--color-blue)" strokeWidth="1" strokeDasharray="5,3" />
                <text x="115" y="18" textAnchor="middle" fontSize="6" fill="var(--color-blue)" fontWeight="bold">SOURCE STORAGE DOMAIN</text>

                {/* Target Zones Boundaries */}
                <rect x="340" y="10" width="350" height="160" rx="8" fill="rgba(240, 253, 250, 0.15)" stroke="var(--color-green)" strokeWidth="1" strokeDasharray="5,3" />
                <text x="515" y="18" textAnchor="middle" fontSize="6" fill="var(--color-blue)" fontWeight="bold">REPLICATION STORAGE SUBNETS</text>

                {/* Source Region */}
                <rect x="20" y="26" width="190" height="132" rx="8" fill="url(#primaryGradient)" stroke="var(--color-blue)" strokeWidth="1.2" filter="url(#s3-shadow-net7)" />
                <text x="115" y="44" textAnchor="middle" fontSize="11" fontWeight="bold" fill="var(--color-blue)">🇺🇸 Source Region (Virginia)</text>

                <rect x="35" y="62" width="160" height="42" rx="4" fill="var(--s3-card-bg)" stroke="var(--color-blue)" strokeWidth="1.2" filter="url(#s3-shadow-net7)" />
                <text x="115" y="78" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-blue)">🪣 Production Bucket</text>
                <text x="115" y="92" textAnchor="middle" fontSize="8" fill="var(--color-green)" fontWeight="bold">🔄 Versioning: ENABLED</text>

                {/* SRR Target */}
                <rect x="350" y="45" width="150" height="100" rx="8" fill="url(#greenGradient)" stroke="var(--color-green)" strokeWidth="1.2" filter="url(#s3-shadow-net7)" />
                <text x="425" y="65" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-green)">🇺🇸 Same-Region Target</text>
                <text x="425" y="78" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">Virginia Sub-Zone (US)</text>
                <rect x="360" y="92" width="130" height="26" rx="3" fill="var(--s3-card-bg)" stroke="var(--color-green)" strokeWidth="1" filter="url(#s3-shadow-net7)" />
                <text x="425" y="108" textAnchor="middle" fontSize="8.5" fill="var(--color-green)" fontWeight="bold">🪣 SRR DR Replica Bucket</text>

                {/* CRR Target */}
                <rect x="525" y="45" width="155" height="100" rx="8" fill="url(#purpleGradient)" stroke="var(--color-purple)" strokeWidth="1.5" filter="url(#s3-shadow-net7)" />
                <text x="602" y="65" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-purple)">🇪🇺 Cross-Region Target</text>
                <text x="602" y="78" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">Frankfurt Region (EU)</text>
                <rect x="535" y="92" width="135" height="26" rx="3" fill="var(--s3-card-bg)" stroke="var(--color-purple)" strokeWidth="1" filter="url(#s3-shadow-net7)" />
                <text x="602" y="108" textAnchor="middle" fontSize="8.5" fill="var(--color-purple)" fontWeight="bold">🪣 CRR Sovereign Archive</text>

                {/* Background continuous packet streams representing active loops */}
                {/* Path to SRR */}
                <path d="M 195 81 Q 275 60 350 81" fill="none" stroke="var(--color-green)" strokeWidth="1.5" strokeDasharray="4,4" />
                <circle r="4.5" fill="var(--color-green)" style={{ filter: 'drop-shadow(0 0 3px #10b981)' }}>
                  <animateMotion path="M 195 81 Q 275 60 350 81" dur="2s" repeatCount="indefinite" />
                </circle>

                {/* Path to CRR */}
                <path d="M 195 95 Q 360 140 525 95" fill="none" stroke="var(--color-purple)" strokeWidth="1.8" strokeDasharray="4,4" />
                <circle r="4.5" fill="var(--color-purple)" style={{ filter: 'drop-shadow(0 0 3px #8b5cf6)' }}>
                  <animateMotion path="M 195 95 Q 360 140 525 95" dur="2.8s" repeatCount="indefinite" />
                </circle>

                <text x="360" y="165" textAnchor="middle" fontSize="9" fill="var(--color-text-secondary)" fontWeight="bold">✔ Asynchronous Background Copy Loops (Zero Performance Drag on Main Write)</text>
              </svg>
            </div>

            {/* 🎨 Presigned URL Handshake SVG Diagram */}
            <div className="s3-sec">S3 Temporal Presigned URL Authorization Handshake</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                How application servers generate secure signatures to authorize limited, direct client uploads without exposing credentials.
              </div>
              <svg viewBox="0 0 700 180" width="100%" className="s3-svg-bg" style={{ borderRadius: '8px', border: '1px solid var(--color-border-secondary)' }}>
                <defs>
                  <marker id="pre-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-blue)" /></marker>
                  <marker id="pre-arr-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-green)" /></marker>
                  <filter id="s3-shadow-net8" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--color-blue)" floodOpacity="0.06" />
                  </filter>
                </defs>

                {/* PREMIUM NESTED BOUNDARIES */}
                {/* Client Subnet */}
                <rect x="10" y="10" width="150" height="135" rx="6" fill="var(--s3-metric-card-bg)" fillOpacity="0.4" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                <text x="85" y="20" textAnchor="middle" fontSize="6.5" fill="var(--color-text-tertiary)" fontWeight="bold">💻 CLIENT SUBNET</text>

                {/* App Server Subnet */}
                <rect x="340" y="10" width="180" height="110" rx="8" fill="rgba(240, 253, 250, 0.15)" stroke="var(--color-green)" strokeWidth="1.2" strokeDasharray="4,2" />
                <text x="430" y="20" textAnchor="middle" fontSize="6.5" fill="var(--color-green)" fontWeight="bold">🛡️ APPLICATION PLANE</text>

                {/* Target S3 Subnet */}
                <rect x="530" y="10" width="160" height="135" rx="6" fill="rgba(239, 246, 255, 0.4)" stroke="var(--color-blue)" strokeWidth="1.2" strokeDasharray="3,3" />
                <text x="610" y="20" textAnchor="middle" fontSize="6.5" fill="var(--color-blue)" fontWeight="bold">☁️ SECURE STORAGE</text>

                {/* Client browser */}
                <rect x="20" y="35" width="130" height="90" rx="8" fill="rgba(255,255,255,0.85)" stroke="var(--s3-card-border)" strokeWidth="1.5" filter="url(#s3-shadow-net8)" />
                <text x="85" y="65" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">Client Browser</text>
                <text x="85" y="83" textAnchor="middle" fontSize="8" fill="var(--color-red)" fontWeight="bold">❌ No AWS Credentials</text>
                <text x="85" y="100" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">Direct Upload/Download</text>

                {/* Step 1: Request URL */}
                <path d="M 150 55 L 340 55" stroke="var(--color-blue)" strokeWidth="1.8" markerEnd="url(#pre-arr)" />
                <text x="245" y="46" textAnchor="middle" fontSize="8.5" fill="var(--color-blue)" fontWeight="bold">1. Request Signed Link</text>
                <circle r="4" fill="var(--color-blue)">
                  <animateMotion path="M 150 55 L 340 55" dur="1.8s" repeatCount="indefinite" />
                </circle>

                {/* Step 2: Receive Presigned URL */}
                <path d="M 340 75 L 150 75" stroke="var(--color-blue)" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#pre-arr)" />
                <text x="245" y="88" textAnchor="middle" fontSize="8.5" fill="var(--color-blue)" fontWeight="bold">2. Returns URL (HMAC token)</text>
                <circle r="4" fill="var(--color-blue)">
                  <animateMotion path="M 340 75 L 150 75" dur="1.8s" repeatCount="indefinite" />
                </circle>

                {/* Step 3: Fetch directly from S3 */}
                <path d="M 85 125 L 85 155 L 610 155 L 610 125" fill="none" stroke="var(--color-green)" strokeWidth="2.5" markerEnd="url(#pre-arr-green)" />
                <text x="340" y="150" textAnchor="middle" fontSize="9" fill="var(--color-green)" fontWeight="bold">3. Direct Secure HTTPS GET / PUT payload (Bypasses App Server Bandwidth completely!)</text>
                <circle r="5" fill="var(--color-green)" style={{ filter: 'drop-shadow(0 0 3px #10b981)' }}>
                  <animateMotion path="M 85 125 L 85 155 L 610 155 L 610 125" dur="2.4s" repeatCount="indefinite" />
                </circle>

                {/* App Server */}
                <rect x="360" y="30" width="140" height="80" rx="8" fill="var(--s3-success-bg)" stroke="var(--color-green)" strokeWidth="1.5" filter="url(#s3-shadow-net8)" />
                <text x="430" y="52" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-green)">Application Server</text>
                <text x="430" y="70" textAnchor="middle" fontSize="8.5" fill="var(--color-text-secondary)">Possesses IAM Credentials</text>
                <text x="430" y="85" textAnchor="middle" fontSize="8" fill="var(--color-green)" fontWeight="bold">Generates signed temporal link</text>

                {/* S3 Storage Endpoint */}
                <rect x="545" y="35" width="135" height="90" rx="8" fill="var(--s3-success-bg)" stroke="var(--color-blue)" strokeWidth="1.5" filter="url(#s3-shadow-net8)" />
                <text x="612" y="62" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-blue)">S3 Secure Storage</text>
                <text x="612" y="80" textAnchor="middle" fontSize="8.5" fill="var(--color-green)" fontWeight="bold">Validates Signature</text>
                <text x="612" y="94" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">&amp; Expiration Timer Checks</text>
              </svg>
            </div>

            {/* ⚡ Interactive Multipart Upload Parallel Ingestion Sandbox */}
            <div className="s3-sec">⚡ Interactive High-Throughput Multipart Upload Sandbox</div>
            <div className="s3-card">
              <div className="s3-g2">
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                    S3 Concurrent Chunk Slicer &amp; Parallel Uploader
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px', lineHeight: '1.4' }}>
                    S3 mandates Multipart Uploads for large objects (up to 5 TB). Slices files into chunks, uploads them in parallel, and reassembles them at rest. If a chunk fails, only that single part is re-sent.
                  </div>

                  <div className="s3-g2" style={{ gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '10px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Object Payload Size</label>
                      <select className="s3-card select" style={{ width: '100%', padding: '6px', fontSize: '12px' }} value={mpFileSize} onChange={(e) => { setMpFileSize(parseInt(e.target.value)); setMpStep(0); setMpLogs([]); setMpParts([]); }}>
                        <option value="200">200 MB Dataset (Standard)</option>
                        <option value="500">500 MB Archive (Large)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Slicing Part Size</label>
                      <select className="s3-card select" style={{ width: '100%', padding: '6px', fontSize: '12px' }} value={mpPartSize} onChange={(e) => { setMpPartSize(parseInt(e.target.value)); setMpStep(0); setMpLogs([]); setMpParts([]); }}>
                        <option value="50">50 MB Parts (More Chunks)</option>
                        <option value="100">100 MB Parts (Fewer Chunks)</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-background-secondary)', padding: '10px', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)', marginBottom: '12px' }}>
                    <input type="checkbox" checked={mpGlitch} onChange={(e) => setMpGlitch(e.target.checked)} id="mpGlitch" style={{ accentColor: '#0891b2' }} />
                    <label htmlFor="mpGlitch" style={{ fontSize: '11.5px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      💥 Simulate Network Glitch (drop Part 3 thread mid-upload)
                    </label>
                  </div>

                  {mpStep === 4 ? (
                    <button className="s3-btn s3-on" style={{ width: '100%', fontWeight: 'bold', background: '#dc2626', color: '#fff', borderColor: '#dc2626' }} onClick={retryFailedMultipart} disabled={mpIsRunning}>
                      🔄 Retry Failed Parts (Resends Part 3 Only!)
                    </button>
                  ) : (
                    <button className="s3-btn s3-on" style={{ width: '100%', fontWeight: 'bold', background: '#0891b2', color: '#fff', borderColor: '#0891b2' }} onClick={handleMultipartUpload} disabled={mpIsRunning}>
                      {mpIsRunning ? '⚡ Transmitting parallel segments...' : '🚀 Initiate Multipart Upload'}
                    </button>
                  )}

                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Multipart API transaction logs:</div>
                    <div ref={mpTerminalRef} className="s3-terminal" style={{ height: '110px', color: '#38bdf8', borderColor: '#0891b2' }}>
                      {mpLogs.length === 0 ? (
                        <div style={{ color: 'var(--color-text-tertiary)' }}>[idle] Awaiting upload initialization...</div>
                      ) : (
                        mpLogs.map((log, idx) => (
                          <div key={idx} style={{
                            color: log.includes('❌') ? '#ef4444' : log.includes('✅') ? '#10b981' : log.includes('workers') ? '#38bdf8' : '#0284c7',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            marginBottom: '2px'
                          }}>
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Parallel Upload Progress Channels Grid */}
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '320px' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                      Parallel Chunk Ingestion Streams: {mpUploadId && `[Session ID: ${mpUploadId}]`}
                    </div>

                    {mpStep === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-tertiary)' }}>
                        <div style={{ fontSize: '32px' }}>💤</div>
                        <div style={{ fontSize: '11.5px', marginTop: '6px' }}>Simulation idle. Trigger multipart to see concurrent threads.</div>
                      </div>
                    )}

                    {mpStep === 1 && (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#0891b2' }}>
                        <div style={{ fontSize: '32px', animation: 'draw 2s linear infinite' }}>⚙️</div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '6px' }}>INITIATING MULTIPART SESSION...</div>
                      </div>
                    )}

                    {mpStep >= 2 && mpParts.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                        {mpParts.map((part) => (
                          <div key={part.id} style={{ background: 'var(--color-background-primary)', padding: '8px 10px', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '10.5px' }}>
                              <span style={{ fontWeight: 'bold' }}>📁 Part #{part.id} ({mpPartSize} MB)</span>
                              <span style={{
                                fontWeight: 'bold',
                                color: part.status === 'completed' ? '#166534' : part.status === 'failed' ? '#991b1b' : '#0369a1',
                                background: part.status === 'completed' ? '#ecfdf5' : part.status === 'failed' ? '#fef2f2' : '#eff6ff',
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '9px'
                              }}>
                                {part.status.toUpperCase()} ({part.progress}%)
                              </span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                              <div style={{
                                width: `${part.progress}%`,
                                height: '100%',
                                background: part.status === 'completed' ? '#10b981' : part.status === 'failed' ? '#ef4444' : '#0891b2',
                                transition: 'width 0.2s'
                              }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Reassembly Dynamic Graphic */}
                  {mpStep >= 2 && (
                    <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '10px', marginTop: '10px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--color-text-secondary)', marginBottom: '4px', textTransform: 'uppercase' }}>🧩 Reassembly Engine at rest:</div>
                      <svg viewBox="0 0 100 24" width="100%" height="24" style={{ background: '#ffffff', borderRadius: '4px', border: '0.5px solid #cbd5e1' }}>
                        <rect x="2" y="2" width="96" height="20" rx="3" fill="var(--s3-metric-card-bg)" stroke="var(--s3-card-border)" strokeWidth="0.5" />
                        {mpParts.map((part, idx) => {
                          const w = 96 / mpParts.length;
                          const x = 2 + idx * w;
                          let fill = '#cbd5e1';
                          if (part.status === 'completed') fill = '#10b981';
                          else if (part.status === 'failed') fill = '#ef4444';
                          else if (part.status === 'uploading') fill = '#0891b2';
                          return (
                            <rect key={part.id} x={x + 0.5} y="3" width={w - 1} height="18" rx="1.5" fill={fill} opacity={part.status === 'uploading' ? 0.6 : 1} stroke={part.status === 'uploading' ? '#0284c7' : 'none'} strokeWidth="0.5">
                              {part.status === 'uploading' && <animate attributeName="opacity" values="0.4;1;0.4" dur="0.8s" repeatCount="indefinite" />}
                            </rect>
                          );
                        })}
                      </svg>
                    </div>
                  )}

                  {mpStep === 5 && (
                    <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold' }}>
                      🎉 MULTIPART WRITE VERIFIED! (Consolidated &amp; stored safely)
                    </div>
                  )}

                  {mpStep === 4 && (
                    <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', textAlign: 'center', fontSize: '11.5px', fontWeight: 'bold' }}>
                      ⚠️ PARTIAL ERROR: Thread 3 packet dropped mid-air. Click retry!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        
          </Translate>)}

        {/* TAB 8: OPERATIONS */}
        {!isComparative && activeTab === 'operations' && (
          <Translate>
          <div>

            {/* 📊 S3 Storage Lens HUD Panel */}
            <div className="s3-sec">📊 S3 Storage Lens Organization HUD</div>
            <div className="s3-card" style={{ background: 'var(--s3-metric-card-bg)', border: '1.5px solid var(--s3-card-border)' }}>
              <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Interactive daily metadata diagnostics for S3 resource footprint (auto-synced with bucket setups):</span>
                <span className="s3-badge" style={{ background: 'var(--s3-tab-hover-bg)', color: 'var(--color-text-secondary)' }}>Diagnostic HUD</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Metric 1: Total Volume */}
                <div style={{ background: 'var(--s3-card-bg)', padding: '16px', borderRadius: '12px', border: '1.5px solid var(--s3-card-border)', boxShadow: 'var(--s3-card-shadow)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', fontWeight: 'bold', marginBottom: '4px' }}>📁 Storage Footprint</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: 'var(--color-text-primary)', fontFamily: 'monospace' }}>
                      {lifecycleVolume >= 1000 ? `${(lifecycleVolume / 1000).toFixed(2)} TB` : `${lifecycleVolume} GB`}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                    Objects: <b>{(batchTotalObjects * 3).toLocaleString()}</b> · Prefixes: <b>{nbPrefixCount}</b>
                  </div>
                </div>

                {/* Metric 2: Public Exposure risk */}
                <div style={{
                  background: 'var(--s3-card-bg)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--s3-card-border)',
                  boxShadow: 'var(--s3-card-shadow)',
                  borderTop: !(bpaAcls && bpaPolicies) ? '4px solid var(--color-amber)' : '4px solid var(--color-green)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', fontWeight: 'bold', marginBottom: '4px' }}>🛡️ Public Exposure Risk</div>
                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: !(bpaAcls && bpaPolicies) ? 'var(--color-amber)' : 'var(--color-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{!(bpaAcls && bpaPolicies) ? '⚠️ HIGH' : '🟢 SECURE'}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: '1.3' }}>
                    {!(bpaAcls && bpaPolicies) 
                      ? 'Wildcard access policies or public ACL overrides are allowed!'
                      : 'Block Public Access (BPA) is fully active.'}
                  </div>
                </div>

                {/* Metric 3: Encryption Coverage */}
                <div style={{
                  background: 'var(--s3-card-bg)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--s3-card-border)',
                  boxShadow: 'var(--s3-card-shadow)',
                  borderTop: encryptionType === 'sse-s3' || encryptionType === 'sse-kms' || encryptionType === 'dsse-kms' ? '4px solid var(--color-green)' : '4px solid var(--color-amber)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', fontWeight: 'bold', marginBottom: '4px' }}>🔒 Protection &amp; WORM</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: encryptionType === 'sse-s3' || encryptionType === 'sse-kms' || encryptionType === 'dsse-kms' ? 'var(--color-green)' : 'var(--color-amber)', fontFamily: 'monospace' }}>
                      {encryptionType === 'sse-s3' || encryptionType === 'sse-kms' || encryptionType === 'dsse-kms' ? '100%' : '95%'}
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: '1.3' }}>
                    SSE: <b>{encryptionType.toUpperCase()}</b> · Lock: <b>{objectLockMode.toUpperCase()}</b>
                  </div>
                </div>

                {/* Metric 4: Latency & Ingestion Route */}
                <div style={{
                  background: 'var(--s3-card-bg)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1.5px solid var(--s3-card-border)',
                  boxShadow: 'var(--s3-card-shadow)',
                  borderTop: transferRouteMode === 'accelerated' ? '4px solid var(--color-green)' : '4px solid var(--color-amber)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', fontWeight: 'bold', marginBottom: '4px' }}>⚡ Ingestion Routing</div>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: transferRouteMode === 'accelerated' ? 'var(--color-green)' : 'var(--color-amber)', fontFamily: 'monospace' }}>
                      {transferRouteMode === 'accelerated' ? '190 ms' : '820 ms'}
                    </div>
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: '1.3' }}>
                    Type: <b>{transferRouteMode === 'accelerated' ? 'Edge POP Ingest' : 'Public WAN Route'}</b>
                  </div>
                </div>
              </div>
            </div>

            {/* 🎨 Decoupled S3 Event Notification Pipeline SVG */}
            <div className="s3-sec">Decoupled Serverless S3 Event Notification Pipeline (Direct vs. EventBridge)</div>
            <div className="s3-card">
              <div className="s3-g2">
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>📡 Event Notification Trigger Simulator</div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                    Configure target routing criteria, trigger a simulated `PutObject` write, and trace the serverless event payload routing behavior in real-time.
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ fontSize: '11px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Event Notification Channel:</label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className={`s3-btn ${eventRoutingMode === 'direct' ? 's3-on' : ''}`} style={{ flex: 1, fontSize: '10.5px' }} onClick={() => { setEventRoutingMode('direct'); setEventStep(0); setEventLogs([]); }}>📥 Direct S3 Targets</button>
                      <button className={`s3-btn ${eventRoutingMode === 'eventbridge' ? 's3-on' : ''}`} style={{ flex: 1, fontSize: '10.5px' }} onClick={() => { setEventRoutingMode('eventbridge'); setEventStep(0); setEventLogs([]); }}>⚙️ EventBridge Router</button>
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-background-secondary)', padding: '10px', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)', marginBottom: '10px' }}>
                    <div className="s3-g2" style={{ gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <label style={{ fontSize: '10.5px', display: 'block', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Simulated Object Key:</label>
                        <select className="s3-card select" value={simulatedObjectKey} onChange={e => { setSimulatedObjectKey(e.target.value); setEventStep(0); setEventLogs([]); }} style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }}>
                          <option value="uploads/avatar.png">uploads/avatar.png (Matched)</option>
                          <option value="uploads/financials.pdf">uploads/financials.pdf (Matched)</option>
                          <option value="corporate/system.log">corporate/system.log (Fails Prefix)</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '10.5px', display: 'block', color: 'var(--color-text-secondary)', marginBottom: '2px' }}>Object Size: <b>{simulatedObjectSize} MB</b></label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="0.5"
                          value={simulatedObjectSize}
                          onChange={e => { setSimulatedObjectSize(parseFloat(e.target.value)); setEventStep(0); setEventLogs([]); }}
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>

                  <button onClick={startEventSimulation} disabled={eventIsRunning} className="s3-btn s3-on" style={{ width: '100%', fontWeight: 'bold', marginBottom: '12px' }}>
                    {eventIsRunning ? '⚡ Distributing event payload...' : '📡 Trigger Simulated Write (s3:PutObject)'}
                  </button>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Serverless routing execution logs:</div>
                    <div ref={eventTerminalRef} className="s3-terminal" style={{ height: '100px' }}>
                      {eventLogs.length === 0 ? (
                        <div style={{ color: 'var(--color-text-tertiary)' }}>[idle] Awaiting simulated write trigger...</div>
                      ) : (
                        eventLogs.map((log, idx) => (
                          <div key={idx} style={{
                            color: log.includes('❌') ? '#ef4444' : log.includes('✅') ? '#10b981' : log.includes('⚙️') ? '#a855f7' : '#38bdf8',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            marginBottom: '2px'
                          }}>
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  {eventRoutingMode === 'direct' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <svg viewBox="0 0 350 170" width="100%" height="170" className="s3-svg-bg" style={{ borderRadius: '8px', border: '1.5px solid var(--s3-card-border)', background: 'linear-gradient(135deg, var(--s3-grad-orange-start) 0%, var(--s3-grad-orange-end) 100%)' }}>
                        <defs>
                          <marker id="arr-notify-direct" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-amber)" /></marker>
                          <linearGradient id="snsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--s3-grad-orange-start)" />
                            <stop offset="100%" stopColor="var(--s3-grad-orange-end)" />
                          </linearGradient>
                          <linearGradient id="sqsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--s3-card-border)" />
                            <stop offset="100%" stopColor="var(--s3-card-border)" />
                          </linearGradient>
                          <linearGradient id="lambdaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--s3-grad-purple-start)" />
                            <stop offset="100%" stopColor="var(--s3-grad-ssec-engine-end)" />
                          </linearGradient>
                          <filter id="s3-shadow-net9" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--color-red)" floodOpacity="0.06" />
                          </filter>
                        </defs>

                        {/* PREMIUM NESTED BOUNDARIES */}
                        {/* Storage Source Boundary */}
                        <rect x="5" y="10" width="115" height="150" rx="6" fill="var(--s3-metric-card-bg)" fillOpacity="0.4" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="62" y="20" textAnchor="middle" fontSize="6" fill="var(--color-text-tertiary)" fontWeight="bold">SOURCE STORAGE</text>

                        {/* Secure Target Subnet */}
                        <rect x="155" y="10" width="190" height="150" rx="8" fill="rgba(251, 191, 36, 0.05)" stroke="var(--color-red)" strokeWidth="1.2" strokeDasharray="4,2" />
                        <text x="250" y="20" textAnchor="middle" fontSize="6" fill="var(--color-amber)" fontWeight="bold">🔔 TARGET INGEST PLANE</text>

                        {/* S3 Bucket */}
                        <rect x="15" y="50" width="95" height="70" rx="6" fill="var(--s3-card-bg)" stroke="var(--color-green)" strokeWidth="1.5" filter="url(#s3-shadow-net9)" />
                        <text x="62" y="70" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--s3-success-text-bold)">🪣 Source S3</text>
                        <text x="62" y="85" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">my-premium-bucket</text>
                        <rect x="22" y="94" width="80" height="15" rx="3" fill="var(--s3-success-bg)" stroke="var(--color-green)" strokeWidth="0.8" />
                        <text x="62" y="104" textAnchor="middle" fontSize="7" fill="var(--color-green)" fontWeight="bold">PutObject Event</text>

                        {/* Paths */}
                        <path d="M 110 75 Q 140 45 170 30" fill="none" stroke="var(--color-red)" strokeWidth="1.5" strokeDasharray="3,1" markerEnd="url(#arr-notify-direct)" />
                        <path d="M 110 85 L 170 85" fill="none" stroke="var(--color-red)" strokeWidth="1.5" strokeDasharray="3,1" markerEnd="url(#arr-notify-direct)" />
                        <path d="M 110 95 Q 140 125 170 140" fill="none" stroke="var(--color-red)" strokeWidth="1.5" strokeDasharray="3,1" markerEnd="url(#arr-notify-direct)" />

                        {/* Targets */}
                        <rect x="170" y="25" width="165" height="30" rx="4" fill="url(#snsGrad)" stroke="var(--color-red)" strokeWidth="1.2" filter="url(#s3-shadow-net9)" />
                        <text x="252" y="43" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-red)">📥 Amazon SNS Topic</text>

                        <rect x="170" y="70" width="165" height="30" rx="4" fill="url(#sqsGrad)" stroke="var(--color-blue)" strokeWidth="1.2" filter="url(#s3-shadow-net9)" />
                        <text x="252" y="88" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-blue)">📥 Amazon SQS Queue</text>

                        <rect x="170" y="125" width="165" height="30" rx="4" fill="url(#lambdaGrad)" stroke="var(--color-purple)" strokeWidth="1.2" filter="url(#s3-shadow-net9)" />
                        <text x="252" y="143" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-purple)">📥 AWS Lambda Function</text>

                        {/* Animated Glowing Packet */}
                        {eventIsRunning && (
                          <circle cx={
                            eventStep === 1 ? 62 :
                            eventStep === 2 ? 100 :
                            eventStep === 3 ? 165 :
                            252
                          } cy={
                            eventStep === 1 ? 85 :
                            eventStep === 2 ? 85 :
                            eventStep === 3 ? 85 :
                            88
                          } r="6" fill="var(--color-amber)" style={{ filter: 'drop-shadow(0 0 4px #b45309)' }}>
                            <animate attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite" />
                          </circle>
                        )}
                      </svg>

                      {/* Code preview block */}
                      <div style={{ background: 'var(--s3-terminal-bg)', padding: '10px', borderRadius: '6px', border: '1px solid var(--s3-terminal-border)', fontSize: '10.5px' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase', marginBottom: '4px' }}>📝 Target SQS Access Resource Policy Constraint:</div>
                        <pre style={{ margin: 0, fontFamily: 'monospace', color: '#38bdf8', whiteSpace: 'pre-wrap', lineHeight: '1.2' }}>
{`{
  "Effect": "Allow",
  "Principal": { "Service": "s3.amazonaws.com" },
  "Action": "sqs:SendMessage",
  "Resource": "arn:aws:sqs:us-east-1:123456789012:my-queue",
  "Condition": {
    "ArnEquals": { "aws:SourceArn": "arn:aws:s3:::my-premium-bucket" }
  }
}`}
                        </pre>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <svg viewBox="0 0 350 170" width="100%" height="170" className="s3-svg-bg" style={{ borderRadius: '8px', border: '1.5px solid var(--s3-card-border)', background: 'linear-gradient(135deg, var(--s3-grad-purple-start) 0%, var(--s3-grad-purple-end) 100%)' }}>
                        <defs>
                          <marker id="arr-notify-eb" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-purple)" /></marker>
                          <linearGradient id="ebGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="var(--s3-grad-purple-start)" />
                            <stop offset="100%" stopColor="var(--s3-grad-ssec-engine-end)" />
                          </linearGradient>
                          <filter id="s3-shadow-net10" x="-10%" y="-10%" width="120%" height="120%">
                            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--color-blue)" floodOpacity="0.06" />
                          </filter>
                        </defs>

                        {/* PREMIUM NESTED BOUNDARIES */}
                        {/* Source Storage */}
                        <rect x="5" y="10" width="115" height="150" rx="6" fill="var(--s3-metric-card-bg)" fillOpacity="0.4" stroke="var(--s3-card-border)" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="62" y="20" textAnchor="middle" fontSize="6" fill="var(--color-text-tertiary)" fontWeight="bold">SOURCE STORAGE</text>

                        {/* EventBridge Router */}
                        <rect x="127" y="10" width="124" height="150" rx="8" fill="rgba(245, 243, 255, 0.15)" stroke="var(--color-purple)" strokeWidth="1.2" strokeDasharray="4,2" />
                        <text x="189" y="20" textAnchor="middle" fontSize="6" fill="var(--color-purple)" fontWeight="bold">⚙️ EVENTS DESCRIPTOR</text>

                        {/* Target Services */}
                        <rect x="258" y="10" width="87" height="150" rx="6" fill="rgba(239, 246, 255, 0.4)" stroke="var(--color-blue)" strokeWidth="1" strokeDasharray="3,3" />
                        <text x="301" y="20" textAnchor="middle" fontSize="6" fill="var(--color-blue)" fontWeight="bold">🎯 TARGET ZONE</text>

                        {/* S3 Bucket */}
                        <rect x="15" y="50" width="95" height="70" rx="6" fill="var(--s3-card-bg)" stroke="var(--color-purple)" strokeWidth="1.5" filter="url(#s3-shadow-net10)" />
                        <text x="62" y="72" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-purple)">🪣 Source S3</text>
                        <text x="62" y="87" textAnchor="middle" fontSize="7.5" fill="var(--color-purple)" fontWeight="bold">EventBridge On</text>
                        <rect x="22" y="95" width="80" height="15" rx="3" fill="var(--s3-card-bg)" stroke="var(--s3-card-border)" strokeWidth="0.8" />
                        <text x="62" y="105" textAnchor="middle" fontSize="7" fill="var(--color-purple)" fontWeight="bold">JSON Publisher</text>

                        {/* Path */}
                        <path d="M 110 85 L 140 85" fill="none" stroke="var(--color-purple)" strokeWidth="1.8" markerEnd="url(#arr-notify-eb)" />

                        {/* EventBridge Router Box */}
                        <rect x="145" y="30" width="90" height="110" rx="6" fill="url(#ebGrad)" stroke="var(--color-purple)" strokeWidth="1.5" filter="url(#s3-shadow-net10)" />
                        <text x="190" y="44" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-blue)">⚙️ EventBridge</text>
                        <rect x="152" y="54" width="76" height="73" rx="3" fill="var(--s3-card-bg)" stroke="var(--s3-card-border)" strokeWidth="0.8" />
                        <text x="190" y="66" textAnchor="middle" fontSize="7" fill="var(--color-purple)" fontWeight="bold">Filter Pattern</text>
                        <text x="190" y="78" textAnchor="middle" fontSize="6.5" fill="var(--color-text-secondary)">Prefix: uploads/</text>
                        <text x="190" y="89" textAnchor="middle" fontSize="6.5" fill="var(--color-text-secondary)">Size &gt; 5 MB</text>
                        
                        <rect x="157" y="99" width="66" height="18" rx="2" fill={simulatedObjectKey.startsWith('uploads/') && simulatedObjectSize > 5 ? 'var(--s3-success-bg)' : 'var(--s3-error-bg)'} stroke={simulatedObjectKey.startsWith('uploads/') && simulatedObjectSize > 5 ? 'var(--s3-success-border)' : 'var(--s3-error-border)'} strokeWidth="1" />
                        <text x="190" y="111" textAnchor="middle" fontSize="7" fontWeight="bold" fill={simulatedObjectKey.startsWith('uploads/') && simulatedObjectSize > 5 ? 'var(--s3-success-text-bold)' : 'var(--s3-error-text-bold)'}>
                          {simulatedObjectKey.startsWith('uploads/') && simulatedObjectSize > 5 ? '✔ Matched' : '❌ Ignored'}
                        </text>

                        {/* Target Egress */}
                        <path d="M 235 85 L 265 85" fill="none" stroke="var(--color-purple)" strokeWidth="1.5" markerEnd="url(#arr-notify-eb)" />

                        {/* 18+ services */}
                        <rect x="265" y="35" width="75" height="95" rx="6" fill="var(--s3-card-bg)" stroke="var(--color-blue)" strokeWidth="1.2" filter="url(#s3-shadow-net10)" />
                        <text x="302" y="50" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="var(--color-blue)">🎯 18+ Targets</text>
                        <text x="302" y="68" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">Step Fns</text>
                        <text x="302" y="84" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">Kinesis</text>
                        <text x="302" y="100" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">ECS Tasks</text>

                        {/* Animated Glowing Packet */}
                        {eventIsRunning && (
                          <circle cx={
                            eventStep === 1 ? 62 :
                            eventStep === 2 ? 120 :
                            eventStep === 3 ? 190 :
                            302
                          } cy={
                            eventStep === 1 ? 85 :
                            eventStep === 2 ? 85 :
                            eventStep === 3 ? 85 :
                            85
                          } r="6" fill="var(--color-purple)" style={{ filter: 'drop-shadow(0 0 4px #7c3aed)' }}>
                            <animate attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite" />
                          </circle>
                        )}
                      </svg>

                      {/* Code preview block */}
                      <div style={{ background: 'var(--s3-terminal-bg)', padding: '10px', borderRadius: '6px', border: '1px solid var(--s3-terminal-border)', fontSize: '10.5px' }}>
                        <div style={{ color: 'var(--color-text-secondary)', fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase', marginBottom: '4px' }}>📝 Advanced EventBridge Filter Pattern JSON Rule:</div>
                        <pre style={{ margin: 0, fontFamily: 'monospace', color: '#a855f7', whiteSpace: 'pre-wrap', lineHeight: '1.2' }}>
{`{
  "source": ["aws.s3"],
  "detail-type": ["Object Created"],
  "detail": {
    "bucket": { "name": ["my-premium-bucket"] },
    "object": {
      "key": [{ "prefix": "uploads/" }],
      "size": [{ "numeric": [">", 5242880] }]
    }
  }
}`}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 🎨 S3 Batch Operations SVG Diagram */}
            <div className="s3-sec">S3 Batch Operations and SQL Athena Manifest Pipeline</div>
            <div className="s3-card">
              <div className="s3-g2">
                <div>
                  <div style={{ fontSize: '12.5px', fontWeight: 600, marginBottom: '8px' }}>⚙️ Enterprise Bulk Operations Simulator</div>
                  <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginBottom: '12px' }}>
                    Simulate how S3 Inventory, Athena SQL filters, and S3 Batch Operations coordinate to run heavy updates across millions of files in parallel.
                  </div>

                  <div style={{ background: 'var(--color-background-secondary)', padding: '12px', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                      <span>S3 Inventory Target Catalog Size:</span>
                      <b>{batchTotalObjects.toLocaleString()} Objects</b>
                    </div>
                    <input
                      type="range"
                      min="50000"
                      max="500000"
                      step="25000"
                      value={batchTotalObjects}
                      onChange={e => { setBatchTotalObjects(parseInt(e.target.value)); setBatchStep(0); setBatchLogs([]); setBatchProgressPercentage(0); }}
                      style={{ width: '100%', accentColor: '#ec4899' }}
                    />
                  </div>

                  <button onClick={startBatchSimulation} disabled={batchIsRunning} className="s3-btn s3-on" style={{ width: '100%', fontWeight: 'bold', marginBottom: '12px', borderColor: '#ec4899', background: '#ec4899' }}>
                    {batchIsRunning ? '⚙️ Processing Batch workers...' : '🚀 Dispatch Bulk Batch Job'}
                  </button>

                  {/* Batch Progress Bar Indicator */}
                  {batchStep >= 3 && (
                    <div style={{ background: 'var(--color-background-secondary)', padding: '10px', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', marginBottom: '4px', fontWeight: 600 }}>
                        <span>Bulk Operations Status: {
                          batchStep === 3 ? 'Spinning up Thread pools...' :
                          batchStep === 4 ? 'Distributing tasks...' :
                          'Completed Successfully!'
                        }</span>
                        <span>{batchProgressPercentage}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'var(--s3-terminal-border)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${batchProgressPercentage}%`, height: '100%', background: '#ec4899', transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Distributed batch trace logs:</div>
                    <div ref={batchTerminalRef} className="s3-terminal" style={{ height: '100px', borderColor: '#475569' }}>
                      {batchLogs.length === 0 ? (
                        <div style={{ color: 'var(--color-text-tertiary)' }}>[idle] Awaiting bulk batch job submission...</div>
                      ) : (
                        batchLogs.map((log, idx) => (
                          <div key={idx} style={{
                            color: log.includes('❌') ? '#ef4444' : log.includes('✅') ? '#ec4899' : log.includes('SUCCESS') ? '#10b981' : '#38bdf8',
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            marginBottom: '2px'
                          }}>
                            {log}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* S3 Batch Pipeline SVG with animated packet */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                  <svg viewBox="0 0 350 250" width="100%" height="250" className="s3-svg-bg" style={{ borderRadius: '8px', border: '1px solid var(--color-border-secondary)' }}>
                    <defs>
                      <marker id="arr-batch-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-blue)" /></marker>
                      <marker id="arr-batch-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--s3-success-text-bold)" /></marker>
                      <marker id="arr-batch-pink" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="var(--color-red)" /></marker>
                      <linearGradient id="invGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--s3-card-border)" />
                        <stop offset="100%" stopColor="var(--color-purple)" />
                      </linearGradient>
                      <linearGradient id="athGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--s3-card-border)" />
                        <stop offset="100%" stopColor="var(--s3-card-border)" />
                      </linearGradient>
                      <linearGradient id="batGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="var(--s3-card-border)" />
                        <stop offset="100%" stopColor="var(--s3-success-border)" />
                      </linearGradient>
                      <filter id="s3-shadow-net11" x="-10%" y="-10%" width="120%" height="120%">
                        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="var(--color-blue)" floodOpacity="0.06" />
                      </filter>
                    </defs>

                    {/* PREMIUM NESTED BOUNDARIES */}
                    {/* Strategy Ingestion Plane */}
                    <rect x="5" y="10" width="340" height="90" rx="8" fill="rgba(244, 63, 94, 0.03)" stroke="var(--color-red)" strokeWidth="1" strokeDasharray="3,3" />
                    <text x="175" y="20" textAnchor="middle" fontSize="6.5" fill="var(--color-red)" fontWeight="bold">📋 BATCH STRATEGY PLANE</text>

                    {/* Target execution subnet */}
                    <rect x="5" y="108" width="340" height="135" rx="8" fill="rgba(16, 185, 129, 0.03)" stroke="var(--color-green)" strokeWidth="1.2" strokeDasharray="4,2" />
                    <text x="175" y="117" textAnchor="middle" fontSize="6.5" fill="var(--color-green)" fontWeight="bold">⚙️ DISTRIBUTED WORKERS GRID</text>

                    {/* S3 Inventory */}
                    <rect x="15" y="32" width="85" height="50" rx="6" fill="url(#invGrad)" stroke="var(--color-red)" strokeWidth="1.5" filter="url(#s3-shadow-net11)" />
                    <text x="57" y="51" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-red)">📋 S3 Inventory</text>
                    <text x="57" y="63" textAnchor="middle" fontSize="7.5" fill="var(--color-red)" fontWeight="bold">Metadata Audit</text>

                    {/* Path 1 */}
                    <path d="M100,57 L140,57" stroke="var(--color-red)" strokeWidth="1.5" strokeDasharray="3,1" markerEnd="url(#arr-batch-blue)" />

                    {/* Athena */}
                    <rect x="140" y="32" width="85" height="50" rx="6" fill="url(#athGrad)" stroke="var(--color-blue)" strokeWidth="1.5" filter="url(#s3-shadow-net11)" />
                    <text x="182" y="51" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-blue)">🔍 Athena SQL</text>
                    <text x="182" y="63" textAnchor="middle" fontSize="7.5" fill="var(--color-blue)" fontWeight="bold">Generates Manifest</text>

                    {/* Path 2 */}
                    <path d="M225,57 L265,57" stroke="var(--color-blue)" strokeWidth="1.5" strokeDasharray="3,1" markerEnd="url(#arr-batch-green)" />

                    {/* Batch Job */}
                    <rect x="265" y="32" width="70" height="50" rx="6" fill="url(#batGrad)" stroke="var(--color-green)" strokeWidth="1.5" filter="url(#s3-shadow-net11)" />
                    <text x="300" y="51" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="var(--color-green)">⚙️ Batch Job</text>
                    <text x="300" y="63" textAnchor="middle" fontSize="7" fill="var(--color-green)" fontWeight="bold">Runs Manifest</text>

                    {/* Distributed threads radiating out */}
                    <path d="M300,82 L300,122" stroke="var(--color-green)" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#arr-batch-green)" />
                    <path d="M265,72 L170,122" stroke="var(--color-green)" strokeWidth="1.2" strokeDasharray="3,2" markerEnd="url(#arr-batch-green)" />
                    <path d="M335,72 L335,122" stroke="var(--color-green)" strokeWidth="1.2" strokeDasharray="3,2" markerEnd="url(#arr-batch-green)" />

                    {/* Heavy process targets */}
                    <rect x="115" y="127" width="105" height="42" rx="4" fill="var(--s3-card-bg)" stroke="var(--s3-card-border)" strokeWidth="1" filter="url(#s3-shadow-net11)" />
                    <text x="167" y="141" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--color-text-primary)">📄 /financials/*</text>
                    <text x="167" y="153" textAnchor="middle" fontSize="7" fill="var(--color-green)" fontWeight="bold">Key Overwrites</text>

                    <rect x="230" y="127" width="105" height="42" rx="4" fill="var(--s3-card-bg)" stroke="var(--s3-card-border)" strokeWidth="1" filter="url(#s3-shadow-net11)" />
                    <text x="282" y="141" textAnchor="middle" fontSize="8" fontWeight="bold" fill="var(--color-text-primary)">📄 /archives/*</text>
                    <text x="282" y="153" textAnchor="middle" fontSize="7" fill="var(--color-purple)" fontWeight="bold">Object Locks Set</text>

                    <rect x="175" y="195" width="120" height="26" rx="4" fill="var(--s3-success-bg)" stroke="var(--color-green)" strokeWidth="1" filter="url(#s3-shadow-net11)" />
                    <text x="235" y="211" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="var(--color-green)">SUCCESS! ✅ COMPLETED</text>

                    {/* Animated Manifest Glowing Packet */}
                    {batchIsRunning && (
                      <circle cx={
                        batchStep === 1 ? 57 :
                        batchStep === 2 ? 182 :
                        batchStep === 3 ? 300 :
                        batchStep === 4 ? (batchProgressPercentage < 50 ? 170 : 282) :
                        235
                      } cy={
                        batchStep === 1 ? 57 :
                        batchStep === 2 ? 57 :
                        batchStep === 3 ? 57 :
                        batchStep === 4 ? 141 :
                        208
                      } r="7" fill="var(--color-red)" style={{ filter: 'drop-shadow(0 0 5px #ec4899)' }}>
                        <animate attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite" />
                      </circle>
                    )}
                  </svg>

                  {/* Detail label */}
                  <div style={{ marginTop: '8px', fontSize: '10.5px', color: 'var(--color-text-secondary)', textAlign: 'center', lineHeight: '1.4' }}>
                    S3 Inventory compiles a daily listing ➔ Athena SQL executes precise filters to generate a target manifest CSV ➔ S3 Batch distributed worker threads fetch manifest rows and execute updates concurrently.
                  </div>
                </div>
              </div>
            </div>
          </div>
        
          </Translate>)}

        {!isComparative && activeTab === 'unique' && (
          <UniqueProviderFeatures provider={provider as 'aws' | 'azure' | 'gcp'} />
        )}
      </div>
    </div>
  );
}
