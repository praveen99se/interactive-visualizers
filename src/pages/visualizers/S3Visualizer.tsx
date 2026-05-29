import React, { useState, useEffect, useRef } from 'react';

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

export default function S3Visualizer() {
  const [activeTab, setActiveTab] = useState<'overview' | 'security' | 'encryption' | 'versioning' | 'storage' | 'networking' | 'transfer' | 'operations'>('overview');

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
  const [bucketPolicyText, setBucketPolicyText] = useState<string>(BUCKET_POLICIES.public);
  const [policyValidationError, setPolicyValidationError] = useState<string | null>(null);

  const [ingressTrafficSource, setIngressTrafficSource] = useState<'internet' | 'https_user' | 'http_user' | 'vpce_ip'>('internet');
  const [ingressPacketStatus, setIngressPacketStatus] = useState<'idle' | 'testing' | 'allowed' | 'blocked'>('idle');
  const [ingressExplanation, setIngressExplanation] = useState('');
  const [policyEvaluationLogs, setPolicyEvaluationLogs] = useState<string[]>([]);
  const [bpaAcls, setBpaAcls] = useState(false);
  const [bpaPolicies, setBpaPolicies] = useState(false);

  // Sync templates to policy text area
  useEffect(() => {
    setBucketPolicyText(BUCKET_POLICIES[selectedPolicyTemplate]);
    setPolicyValidationError(null);
  }, [selectedPolicyTemplate]);

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
    setLifecycleCurrentClass('Standard');
    setLifecycleCostSaved(0);
  };

  useEffect(() => {
    if (lifecycleRunState !== 'running') return;

    const interval = setInterval(() => {
      setLifecycleDaysPassed(days => {
        const nextDay = days + 5;

        // Storage Class transitions based on sliders
        let currentClass = 'Standard';
        if (nextDay >= lifecycleGlacier) {
          currentClass = 'Glacier Deep Archive';
        } else if (nextDay >= lifecycleIa) {
          currentClass = 'Standard-IA';
        }

        setLifecycleCurrentClass(currentClass);

        // Calculate Cost Savings
        const standardCost = lifecycleVolume * 0.023;
        let activeCost = standardCost;
        if (currentClass === 'Standard-IA') activeCost = lifecycleVolume * 0.0125;
        if (currentClass === 'Glacier Deep Archive') activeCost = lifecycleVolume * 0.00099;

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
  }, [lifecycleRunState, lifecycleIa, lifecycleGlacier, lifecycleExpiration, lifecycleVolume]);

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
    <div style={{ fontSize: '13.5px' }}>
      <style>{`
        .s3-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 16px; border-bottom: 1px solid var(--color-border-tertiary, #e2e8f0); padding-bottom: 10px; }
        .s3-tb { padding: 6px 14px; border-radius: var(--border-radius-lg, 12px); border: 0.5px solid var(--color-border-secondary, #cbd5e1); font-size: 12px; cursor: pointer; background: var(--color-background-secondary, #f8fafc); color: var(--color-text-secondary, #475569); transition: all 0.15s; outline: none; font-weight: 500; }
        .s3-tb:hover { background: var(--color-background-tertiary, #f1f5f9); }
        .s3-tb.s3-on { background: #16a34a; color: #fff; border-color: #16a34a; font-weight: 500; }
        .s3-card { border: 0.5px solid var(--color-border-tertiary); border-radius: var(--border-radius-lg); padding: 16px 20px; background: var(--color-background-primary); margin-bottom: 16px; font-size: 13px; line-height: 1.55; }
        .s3-sec { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .06em; margin: 24px 0 10px; }
        .s3-sec:first-child { margin-top: 0; }
        .s3-g2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .s3-g3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .s3-kv { display: flex; gap: 8px; font-size: 13px; margin: 6px 0; align-items: baseline; }
        .s3-kk { min-width: 160px; color: var(--color-text-secondary); flex-shrink: 0; }
        .s3-badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 500; }
        .s3-btn { font-size: 13px; padding: 5px 12px; border-radius: 6px; border: 0.5px solid var(--color-border-secondary); background: var(--color-background-primary); color: var(--color-text-primary); cursor: pointer; transition: all 0.15s; outline: none; }
        .s3-btn:hover { background: var(--color-background-secondary); }
        .s3-btn.s3-on { background: #0891b2; color: #fff; border-color: #0891b2; }
        .s3-terminal { background: #0f172a; color: #38bdf8; font-family: monospace; font-size: 12px; padding: 12px; border-radius: 8px; border: 0.5px solid #334155; max-height: 200px; overflow-y: auto; white-space: pre-wrap; line-height: 1.45; }
        
        /* Visually stunning Deep Dive layouts */
        .s3-grid-edu { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-bottom: 18px; }
        
        .s3-edu-card-new { 
          background: var(--color-background-primary); 
          border: 0.5px solid var(--color-border-secondary); 
          border-top: 4px solid var(--theme-color, #0891b2); 
          padding: 16px 18px; 
          border-radius: 8px; 
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .s3-edu-card-new:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04);
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
        [data-theme='dark'] .s3-pill-why { background: #1e3a8a; color: #93c5fd; border-color: #1e40af; }
        [data-theme='dark'] .s3-pill-how { background: #78350f; color: #fde68a; border-color: #92400e; }
        [data-theme='dark'] .s3-pill-benefits { background: #064e3b; color: #6ee7b7; border-color: #065f46; }
        
        .s3-hl-cyan { background: rgba(6, 182, 212, 0.15); color: #0891b2; padding: 1px 4px; border-radius: 4px; font-weight: 600; }
        .s3-hl-orange { background: rgba(245, 158, 11, 0.15); color: #d97706; padding: 1px 4px; border-radius: 4px; font-weight: 600; }
        .s3-hl-green { background: rgba(16, 185, 129, 0.15); color: #059669; padding: 1px 4px; border-radius: 4px; font-weight: 600; }
        .s3-hl-indigo { background: rgba(99, 102, 241, 0.15); color: #4f46e5; padding: 1px 4px; border-radius: 4px; font-weight: 600; }
        .s3-hl-purple { background: rgba(168, 85, 247, 0.15); color: #9333ea; padding: 1px 4px; border-radius: 4px; font-weight: 600; }
        .s3-hl-pink { background: rgba(236, 72, 153, 0.15); color: #db2777; padding: 1px 4px; border-radius: 4px; font-weight: 600; }
        
        .s3-desc-mute { color: var(--color-text-secondary); font-size: 11px; font-style: italic; opacity: 0.9; font-weight: normal; background: none; padding: 0; }
        
        [data-theme='dark'] .s3-hl-cyan { background: rgba(6, 182, 212, 0.25); color: #22d3ee; }
        [data-theme='dark'] .s3-hl-orange { background: rgba(245, 158, 11, 0.25); color: #fbbf24; }
        [data-theme='dark'] .s3-hl-green { background: rgba(16, 185, 129, 0.25); color: #34d399; }
        [data-theme='dark'] .s3-hl-indigo { background: rgba(99, 102, 241, 0.25); color: #818cf8; }
        [data-theme='dark'] .s3-hl-purple { background: rgba(168, 85, 247, 0.25); color: #c084fc; }
        [data-theme='dark'] .s3-hl-pink { background: rgba(236, 72, 153, 0.25); color: #f472b6; }

        /* Unified Dropdown Selection Visual Cues */
        .s3-card select {
          border: 2px solid #f59e0b !important;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.2) !important;
          outline: none;
          background: var(--color-background-primary);
          color: var(--color-text-primary);
        }

        .s3-card textarea {
          background: #0f172a;
          color: #e2e8f0;
          font-family: monospace;
          font-size: 11px;
          border: 1px solid var(--color-border-secondary);
          border-radius: 6px;
          padding: 10px;
          width: 100%;
          outline: none;
        }
        .s3-card textarea:focus {
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.2);
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
          from { box-shadow: 0 0 4px rgba(220, 38, 38, 0.2); background: #fef2f2; }
          to { box-shadow: 0 0 16px rgba(220, 38, 38, 0.55); background: #fee2e2; }
        }
      `}</style>

      {/* Header */}
      <div style={{ padding: '14px 16px 4px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🪣 AWS S3 — Simple Storage Service · Buckets · Versioning · Encryption · Lifecycles
          </div>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            Fully durable, infinitely scalable object storage models — configure bucket policies, track version stacks, simulate KMS envelope keys, lifecycle data transitions, and private Gateway Endpoints interactively.
          </div>
        </div>

        {/* Tab Selection */}
        <div className="s3-tabs">
          <button className={`s3-tb ${activeTab === 'overview' ? 's3-on' : ''}`} onClick={() => setActiveTab('overview')}>🪣 Namespace & CORS</button>
          <button className={`s3-tb ${activeTab === 'security' ? 's3-on' : ''}`} onClick={() => setActiveTab('security')}>🛡️ Policies & BPA</button>
          <button className={`s3-tb ${activeTab === 'encryption' ? 's3-on' : ''}`} onClick={() => setActiveTab('encryption')}>🔒 SSE & KMS keys</button>
          <button className={`s3-tb ${activeTab === 'versioning' ? 's3-on' : ''}`} onClick={() => setActiveTab('versioning')}>🔄 Versioning & WORM</button>
          <button className={`s3-tb ${activeTab === 'storage' ? 's3-on' : ''}`} onClick={() => setActiveTab('storage')}>📈 Classes & Lifecycle</button>
          <button className={`s3-tb ${activeTab === 'networking' ? 's3-on' : ''}`} onClick={() => setActiveTab('networking')}>🌐 Gateway Endpoints</button>
          <button className={`s3-tb ${activeTab === 'transfer' ? 's3-on' : ''}`} onClick={() => setActiveTab('transfer')}>⚡ Replication & Accel</button>
          <button className={`s3-tb ${activeTab === 'operations' ? 's3-on' : ''}`} onClick={() => setActiveTab('operations')}>⚙️ Batch & Lens</button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            {/* 📚 Visual Concept Deep-Dive Grid */}
            <div className="s3-sec">📚 Concept Deep-Dive: S3 Namespaces, Hosting &amp; CORS</div>
            <div className="s3-grid-edu" style={{ '--theme-color': '#0891b2' } as React.CSSProperties}>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Buckets, Objects &amp; Prefixes
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  A <span className="s3-hl-cyan">Bucket</span> <span className="s3-desc-mute">(a globally unique, flat storage container that acts as the root namespace for all your files)</span> is a globally unique storage container in the AWS cloud. An <span className="s3-hl-cyan">Object</span> <span className="s3-desc-mute">(the fundamental entity stored in S3, consisting of raw binary payload data, a unique developer-assigned key, and customizable metadata pairs)</span> is the fundamental entity stored in a bucket, consisting of file data and descriptive metadata. A <span className="s3-hl-cyan">Prefix</span> <span className="s3-desc-mute">(a string delimiter prefix, such as <code>images/</code>, used to group objects logically and partition high-throughput request rates)</span> is a string prefix (like <code>images/</code>) used to partition keys and simulate a directory structure.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #0891b2' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0891b2', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <span className="s3-hl-cyan">S3 Buckets</span> <span className="s3-desc-mute">(globally unique namespace root containers)</span> as globally unique root containers, and <span className="s3-hl-cyan">S3 Objects</span> <span className="s3-desc-mute">(immutable file payloads with structured metadata)</span> as the files and metadata stored inside them, organized using <span className="s3-hl-cyan">Prefixes</span> <span className="s3-desc-mute">(logical simulated folder paths)</span>. Which means <span className="s3-hl-cyan">S3 operates as a flat key-value store</span> rather than a traditional hierarchical operating system directory tree, allowing it to scale infinitely and support a baseline rate of 3,500 PUT and 5,500 GET requests per second per prefix.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Static Website Hosting
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <span className="s3-hl-cyan">Static Website Hosting</span> <span className="s3-desc-mute">(a serverless bucket setting that exposes high-performance HTTP/HTTPS web endpoints to serve public static website assets directly to browsers)</span> is an S3 feature that allows you to configure a bucket to host website assets (HTML, CSS, JS, images, client scripts) and serve them via an HTTP/HTTPS endpoint directly to users.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #0891b2' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0891b2', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <span className="s3-hl-cyan">S3 Static Website Hosting</span> <span className="s3-desc-mute">(direct serverless HTTP/HTTPS content gateways)</span> to configure a bucket to act as an <span className="s3-hl-cyan">HTTP gateway</span>, serving HTML, CSS, JavaScript, and client-side images directly. Which means you can serve fast, globally scalable frontend applications without the operational overhead, pricing, patching, or scaling stress of running virtual machines (like EC2 or Nginx/Apache servers).
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  CORS &amp; Requester Pays
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <span className="s3-hl-cyan">CORS (Cross-Origin Resource Sharing)</span> <span className="s3-desc-mute">(a browser security restriction policy that controls and authorizes cross-domain HTTP request fetching of storage assets)</span> is a browser security mechanism that allows web applications loaded in one domain to interact with resources in a different domain (S3). <span className="s3-hl-cyan">Requester Pays</span> <span className="s3-desc-mute">(a storage billing setting shifting data download data-egress fees from the bucket owner to the caller's AWS billing account)</span> is a bucket setting that shifts data download fees to the requesting user.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #0891b2' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0891b2', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <span className="s3-hl-cyan">CORS configurations</span> <span className="s3-desc-mute">(whitelisting browser HTTP request origins)</span> to whitelist origins and <span className="s3-hl-cyan">Requester Pays billing flags</span> <span className="s3-desc-mute">(shifting data download egress charges to downloaders)</span> for buckets. Which means you can securely authorize web applications running on other domains to fetch S3 data through standard browser preflight handshakes, and shift data egress bandwidth costs onto the downloader's AWS account rather than your own.
                  </div>
                </div>
              </div>

            </div>

            {/* 🎨 Architectural SVG */}
            <div className="s3-sec">S3 Flat Key Database Index Architecture</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Note how folders are only simulated logical prefixes in a flat metadata partition.
              </div>
              <svg viewBox="0 0 700 180" width="100%" style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                {/* Logical User Directory Structure */}
                <rect x="20" y="20" width="220" height="140" rx="6" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" strokeWidth="1" />
                <text x="35" y="38" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">📁 Logical Folder Tree (Mock View)</text>

                <text x="45" y="65" fontSize="10" fill="var(--color-text-secondary)">📁 assets/</text>
                <text x="65" y="85" fontSize="9.5" fill="var(--color-text-secondary)">📁 images/</text>
                <text x="85" y="105" fontSize="9" fill="#0891b2" fontWeight="bold">📄 logo.png</text>
                <text x="45" y="130" fontSize="10" fill="var(--color-text-secondary)">📁 logs/ ➔ 📄 app.log</text>

                <path d="M250,90 L320,90" stroke="#94a3b8" strokeWidth="2" />

                {/* S3 Flat Database Index Key-Value store */}
                <rect x="330" y="20" width="350" height="140" rx="6" fill="var(--color-background-primary)" stroke="#0891b2" strokeWidth="1.5" />
                <text x="345" y="38" fontSize="10.5" fontWeight="bold" fill="#0891b2">🛢️ Actual S3 Flat Key-Value Database Table</text>

                {/* Headers */}
                <rect x="340" y="52" width="330" height="20" fill="var(--color-background-tertiary)" />
                <text x="345" y="66" fontSize="9" fontWeight="bold" fill="var(--color-text-secondary)">Full Object Key String (Flat Prefix + Name)</text>
                <text x="590" y="66" fontSize="9" fontWeight="bold" fill="var(--color-text-secondary)">Physical Block</text>

                {/* Rows */}
                <text x="345" y="90" fontSize="8.5" fontFamily="monospace" fill="#0e7490">assets/images/logo.png</text>
                <text x="590" y="90" fontSize="8.5" fill="var(--color-text-secondary)">Block-A92k</text>

                <text x="345" y="112" fontSize="8.5" fontFamily="monospace" fill="#0e7490">logs/2026/05/sys.log</text>
                <text x="590" y="112" fontSize="8.5" fill="var(--color-text-secondary)">Block-B18a</text>

                <text x="345" y="134" fontSize="8.5" fontFamily="monospace" fill="#0e7490">index.html</text>
                <text x="590" y="134" fontSize="8.5" fill="var(--color-text-secondary)">Block-C42f</text>

                <line x1="340" y1="98" x2="670" y2="98" stroke="var(--color-border-secondary)" strokeWidth="0.5" />
                <line x1="340" y1="120" x2="670" y2="120" stroke="var(--color-border-secondary)" strokeWidth="0.5" />
              </svg>
            </div>

            {/* DNS Validator & URL Generator */}
            <div className="s3-sec">🔒 Interactive S3 Bucket Namespace &amp; DNS Compliances Playground</div>
            <div className="s3-g2" style={{ marginBottom: '24px' }}>
              
              {/* Part A: DNS Validator */}
              <div className="s3-card">
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🪣</span> S3 Bucket DNS Compliancy Validator
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '16px' }}>
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
                    <select className="s3-card select" style={{ width: '100%', padding: '6px', fontSize: '12px', border: '1px solid #cbd5e1' }} value={directoryAz} onChange={(e) => {
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
                    style={{ width: '100%', padding: '10px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', textTransform: 'lowercase', fontFamily: 'monospace', textAlign: 'left', cursor: 'text' }}
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
                          <span style={{ color: isLengthValid ? '#166534' : '#991b1b' }}>
                            Length is between 3 and {bucketType === 'general' ? 63 : 64} characters (Current: {bucketNameInput.length})
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{isCharsValid ? '🟢' : '❌'}</span>
                          <span style={{ color: isCharsValid ? '#166534' : '#991b1b' }}>
                            {bucketType === 'general'
                              ? 'Consists only of lowercase letters, numbers, periods (.), and hyphens (-)'
                              : 'Consists ONLY of lowercase letters, numbers, and hyphens (NO periods allowed!)'
                            }
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{isStartEndValid ? '🟢' : '❌'}</span>
                          <span style={{ color: isStartEndValid ? '#166534' : '#991b1b' }}>
                            Must start and end with a letter or number
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{isAdjacentValid ? '🟢' : '❌'}</span>
                          <span style={{ color: isAdjacentValid ? '#166534' : '#991b1b' }}>
                            {bucketType === 'general'
                              ? 'No adjacent special symbols `..` or `--` or `.-`'
                              : 'No adjacent special symbols `..` or `--` inside custom prefix'
                            }
                          </span>
                        </div>
                        {bucketType === 'general' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{isIpAddressValid ? '🟢' : '❌'}</span>
                            <span style={{ color: isIpAddressValid ? '#166534' : '#991b1b' }}>
                              Must not be formatted as an IPv4 address
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{isSuffixValid ? '🟢' : '❌'}</span>
                            <span style={{ color: isSuffixValid ? '#166534' : '#991b1b' }}>
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
                        background: isDnsCompliant ? '#ecfdf5' : '#fef2f2',
                        border: isDnsCompliant ? '1px solid #a7f3d0' : '1px solid #fca5a5',
                        color: isDnsCompliant ? '#065f46' : '#991b1b'
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
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🔗</span> S3 Endpoint &amp; Object Address URL Generator
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '16px' }}>
                    {bucketType === 'general' 
                      ? 'Since 2020, S3 deprecates Path-style access in favor of Virtual Hosted-style, allowing DNS subdomain load balancing.'
                      : 'Express One Zone Directory buckets do not support legacy Path-style or standard REST URLs. They use specialized low-latency endpoints.'
                    }
                  </div>

                  <div className="s3-g2" style={{ gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '10px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>AWS Region</label>
                      <select className="s3-card select" style={{ width: '100%', padding: '6px', border: '1px solid #cbd5e1', borderRadius: '6px' }} value={urlRegion} onChange={(e) => setUrlRegion(e.target.value)}>
                        <option value="us-east-1">us-east-1 (N. Virginia)</option>
                        <option value="eu-west-1">eu-west-1 (Ireland)</option>
                        <option value="ap-southeast-2">ap-southeast-2 (Sydney)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Object Key Path</label>
                      <input 
                        type="text" 
                        value={urlKey} 
                        onChange={(e) => setUrlKey(e.target.value)} 
                        style={{ padding: '6px', fontSize: '12px', width: '100%', border: '1px solid #cbd5e1', borderRadius: '6px' }} 
                      />
                    </div>
                  </div>

                  {/* Generated URLs display */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                    {bucketType === 'general' ? (
                      <>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#0369a1', textTransform: 'uppercase' }}>✅ Virtual Hosted-Style URL (Standard)</div>
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0f172a', wordBreak: 'break-all', marginTop: '3px' }}>
                            https://<span style={{ color: '#0891b2', fontWeight: 'bold' }}>{bucketNameInput}</span>.s3.<span style={{ color: '#0284c7', fontWeight: 'bold' }}>{urlRegion}</span>.amazonaws.com/<span style={{ color: '#4f46e5', fontWeight: 'bold' }}>{urlKey}</span>
                          </div>
                          <div style={{ fontSize: '9.5px', color: '#64748b', marginTop: '2px', fontStyle: 'italic' }}>
                            routes subdomain directly to specific S3 frontend DNS server pools for infinite horizontal scaling.
                          </div>
                        </div>
                        
                        <div style={{ borderTop: '0.5px solid #e2e8f0', paddingTop: '8px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#991b1b', textTransform: 'uppercase' }}>❌ Path-Style URL (Deprecated since 2020)</div>
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b', wordBreak: 'break-all', marginTop: '3px', textDecoration: 'line-through' }}>
                            https://s3.<span style={{ color: '#0284c7' }}>{urlRegion}</span>.amazonaws.com/<span style={{ color: '#0891b2' }}>{bucketNameInput}</span>/<span style={{ color: '#4f46e5' }}>{urlKey}</span>
                          </div>
                          <div style={{ fontSize: '9.5px', color: '#991b1b', marginTop: '2px', fontWeight: 600 }}>
                            forces all buckets to share a single DNS namespace, bottlenecking request thresholds!
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#15803d', textTransform: 'uppercase' }}>⚡ Directory Bucket High-Performance Endpoint URL</div>
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0f172a', wordBreak: 'break-all', marginTop: '3px' }}>
                            https://<span style={{ color: '#059669', fontWeight: 'bold' }}>{bucketNameInput}</span>.s3express-<span style={{ color: '#0f766e', fontWeight: 'bold' }}>{directoryAz}</span>.<span style={{ color: '#0284c7', fontWeight: 'bold' }}>{urlRegion}</span>.amazonaws.com/<span style={{ color: '#4f46e5', fontWeight: 'bold' }}>{urlKey}</span>
                          </div>
                          <div style={{ fontSize: '9.5px', color: '#059669', marginTop: '2px', fontWeight: 600 }}>
                            Direct connection into specialized low-latency hypervisor hardware for single-digit ms processing!
                          </div>
                        </div>

                        <div style={{ borderTop: '0.5px solid #e2e8f0', paddingTop: '8px' }}>
                          <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#991b1b', textTransform: 'uppercase' }}>❌ Standard REST or Path URLs</div>
                          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b', marginTop: '3px', textDecoration: 'line-through' }}>
                            https://s3.{urlRegion}.amazonaws.com/{bucketNameInput}
                          </div>
                          <div style={{ fontSize: '9.5px', color: '#991b1b', marginTop: '2px', fontStyle: 'italic' }}>
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
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                    Surviving Datacenter Disasters: Standard 3-AZ Synchronous Writes
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '16px', lineHeight: '1.4' }}>
                    S3 standard guarantees <b>99.999999999% (11 9s)</b> durability by synchronously copying object bytes across a minimum of three distinct physically isolated Availability Zones (AZs) before returning 200 OK.
                  </div>

                  <div className="s3-g2" style={{ gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '10px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Select Object Payload:</label>
                      <select value={replicatePayload} onChange={(e) => setReplicatePayload(e.target.value)} style={{ width: '100%', padding: '6px', fontSize: '12px' }}>
                        <option value="ledger.pdf">ledger.pdf (Corporate ledger - 12.4 MB)</option>
                        <option value="backup.tar">backup.tar (System snapshot - 45.1 MB)</option>
                      </select>
                    </div>
                  </div>

                  <button className="s3-btn s3-on" style={{ width: '100%', fontWeight: 'bold', background: '#0891b2', color: '#fff' }} onClick={handleReplicationSimulation} disabled={replicateIsRunning}>
                    {replicateIsRunning ? '⚡ Executing parallel AZ writes...' : '🚀 Ingest PUT Object Payload'}
                  </button>

                  <div style={{ marginTop: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Parallel Ingestion Audit logs:</div>
                    <div ref={replicateTerminalRef} className="s3-terminal" style={{ height: '110px' }}>
                      {replicateLogs.length === 0 ? (
                        <div style={{ color: '#64748b' }}>[idle] Awaiting upload replication trigger...</div>
                      ) : (
                        replicateLogs.map((log, idx) => (
                          <div key={idx} style={{
                            color: log.includes('❌') ? '#ef4444' : log.includes('✅') ? '#10b981' : log.includes('⚡') ? '#eab308' : '#0284c7',
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
                  <svg viewBox="0 0 350 250" width="100%" height="250" style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                    <defs>
                      <marker id="arr-repl-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                    </defs>

                    {/* S3 Ingest Gateway */}
                    <rect x="120" y="15" width="110" height="40" rx="6" fill="#eff6ff" stroke="#0891b2" strokeWidth="1.5" />
                    <text x="175" y="32" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#025a70">🪣 Ingest Gateway</text>
                    <text x="175" y="44" textAnchor="middle" fontSize="6.5" fill="#0891b2">Strong SSL Boundary</text>

                    {/* AZ Datacenters */}
                    {/* AZ-1 */}
                    <rect x="15" y="130" width="90" height="70" rx="6" fill="#ffffff" stroke={replicateStep >= 3 ? '#10b981' : '#cbd5e1'} strokeWidth={replicateStep >= 3 ? 2 : 1} />
                    <text x="60" y="148" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#334155">🏢 AZ-1</text>
                    <text x="60" y="162" textAnchor="middle" fontSize="8" fill="#64748b">{urlRegion}a</text>
                    <text x="60" y="185" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#10b981">
                      {replicateStep >= 3 ? '✔ COMMITTED' : replicateStep === 2 ? '⏳ WRITING...' : '💤 IDLE'}
                    </text>

                    {/* AZ-2 */}
                    <rect x="130" y="130" width="90" height="70" rx="6" fill="#ffffff" stroke={replicateStep >= 3 ? '#10b981' : '#cbd5e1'} strokeWidth={replicateStep >= 3 ? 2 : 1} />
                    <text x="175" y="148" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#334155">🏢 AZ-2</text>
                    <text x="175" y="162" textAnchor="middle" fontSize="8" fill="#64748b">{urlRegion}b</text>
                    <text x="175" y="185" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#10b981">
                      {replicateStep >= 3 ? '✔ COMMITTED' : replicateStep === 2 ? '⏳ WRITING...' : '💤 IDLE'}
                    </text>

                    {/* AZ-3 */}
                    <rect x="245" y="130" width="90" height="70" rx="6" fill="#ffffff" stroke={replicateStep >= 3 ? '#10b981' : '#cbd5e1'} strokeWidth={replicateStep >= 3 ? 2 : 1} />
                    <text x="290" y="148" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#334155">🏢 AZ-3</text>
                    <text x="290" y="162" textAnchor="middle" fontSize="8" fill="#64748b">{urlRegion}c</text>
                    <text x="290" y="185" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#10b981">
                      {replicateStep >= 3 ? '✔ COMMITTED' : replicateStep === 2 ? '⏳ WRITING...' : '💤 IDLE'}
                    </text>

                    {/* Propagation lines */}
                    <path d="M140,55 L75,130" fill="none" stroke={replicateStep >= 2 ? '#10b981' : '#cbd5e1'} strokeWidth={replicateStep >= 2 ? 1.8 : 1} markerEnd="url(#arr-repl-green)" />
                    <path d="M175,55 L175,130" fill="none" stroke={replicateStep >= 2 ? '#10b981' : '#cbd5e1'} strokeWidth={replicateStep >= 2 ? 1.8 : 1} markerEnd="url(#arr-repl-green)" />
                    <path d="M210,55 L275,130" fill="none" stroke={replicateStep >= 2 ? '#10b981' : '#cbd5e1'} strokeWidth={replicateStep >= 2 ? 1.8 : 1} markerEnd="url(#arr-repl-green)" />

                    <text x="175" y="225" textAnchor="middle" fontSize="8" fill={replicateStep === 4 ? '#166534' : '#475569'} fontWeight="bold">
                      {replicateStep === 4 ? '🎉 100% Replicated cross 3 datacenters (200 OK)' : 'Synchronous replication pipelines'}
                    </text>

                    {/* Animated particles */}
                    {replicateIsRunning && replicateStep === 2 && (
                      <>
                        <circle cx="155" cy="70" r="4" fill="#0891b2" className="s3-g-circle" />
                        <circle cx="175" cy="75" r="4" fill="#0891b2" className="s3-g-circle" />
                        <circle cx="195" cy="70" r="4" fill="#0891b2" className="s3-g-circle" />
                      </>
                    )}
                  </svg>
                </div>
              </div>
            </div>

            {/* Read-After-Write Consistency Simulator */}
            <div className="s3-sec">🔁 S3 Read-After-Write Strong Consistency vs. Eventual Consistency Model</div>
            <div className="s3-card">
              <div className="s3-g2">
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>
                    Atomic Read-After-Write guarantees vs. Legacy Eventual Mirror Delays
                  </div>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '16px', lineHeight: '1.4' }}>
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

                  <button className="s3-btn s3-on" style={{ width: '100%', fontWeight: 'bold', background: '#4f46e5', color: '#fff', borderColor: '#4f46e5' }} onClick={handleConsistencySimulation} disabled={consistencyIsRunning}>
                    {consistencyIsRunning ? '⚡ Executing concurrent reads/writes...' : '🚀 Trigger Update PUT & Immediate Read GET'}
                  </button>
                </div>

                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>Consistency Verification Trace:</div>
                    <div ref={consistencyTerminalRef} className="s3-terminal" style={{ height: '120px' }}>
                      {consistencyLogs.length === 0 ? (
                        <div style={{ color: '#64748b' }}>[idle] Awaiting concurrent transaction trigger...</div>
                      ) : (
                        consistencyLogs.map((log, idx) => (
                          <div key={idx} style={{
                            color: log.includes('❌') || log.includes('⚠️') ? '#ef4444' : log.includes('✅') ? '#10b981' : '#334155',
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
                      background: consistencyMode === 'strong' ? '#ecfdf5' : '#fef2f2',
                      border: consistencyMode === 'strong' ? '1px solid #a7f3d0' : '1px solid #fca5a5',
                      color: consistencyMode === 'strong' ? '#065f46' : '#991b1b',
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
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#0f172a', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔒</span> Preflight Parameters Configuration
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '16px' }}>
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

                <button className="s3-btn s3-on" style={{ width: '100%', fontWeight: 'bold', background: '#0891b2', color: '#fff' }} onClick={handleCorsPreflight} disabled={corsAnimationState === 'preflight'}>
                  {corsAnimationState === 'preflight' ? '⌛ Preflight OPTIONS Ping Flight...' : '⚡ Test OPTIONS CORS Preflight'}
                </button>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>CORS PREFLIGHT RESULTS CONSOLE:</div>
                  <div ref={corsTerminalRef} className="s3-terminal" style={{ height: '110px' }}>
                    {corsLogs.map((log, idx) => (
                      <div key={idx} style={{ color: log.type === 'success' ? '#16a34a' : log.type === 'error' ? '#dc2626' : '#0284c7', marginBottom: '2px' }}>
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
                    background: corsAnimationState === 'authorized' ? '#ecfdf5' : '#fef2f2',
                    border: corsAnimationState === 'authorized' ? '1px solid #a7f3d0' : '1px solid #fca5a5',
                    color: corsAnimationState === 'authorized' ? '#065f46' : '#991b1b',
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
              <svg viewBox="0 0 700 180" width="100%" style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                {/* Origin Site */}
                <rect x="20" y="30" width="130" height="120" rx="6" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" strokeWidth="1" />
                <text x="85" y="52" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">Client Browser</text>
                <text x="85" y="70" textAnchor="middle" fontSize="8" fill="#1d4ed8" fontWeight="bold">💻 domain-a.com</text>
                <text x="85" y="90" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">Loads JS fetching</text>
                <text x="85" y="102" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">assets from S3</text>
                <rect x="35" y="115" width="100" height="20" rx="3" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.8" />
                <text x="85" y="128" textAnchor="middle" fontSize="7.5" fill="#1e40af" fontWeight="bold">Host A (Frontend)</text>

                {/* Handshake: Request */}
                <path d="M150,55 L380,55" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                <text x="265" y="46" textAnchor="middle" fontSize="7.5" fill="#b91c1c" fontWeight="bold">1. OPTIONS Preflight Ping (Origin: domain-a.com)</text>

                {/* Handshake: Response */}
                <path d="M380,75 L150,75" stroke="#10b981" strokeWidth="1.5" />
                <text x="265" y="86" textAnchor="middle" fontSize="7.5" fill="#047857" fontWeight="bold">2. Allow-Origin: domain-a.com (200 OK)</text>

                {/* Handshake: Actual Fetch */}
                <path d="M150,115 L380,115" stroke="#10b981" strokeWidth="2" />
                <text x="265" y="110" textAnchor="middle" fontSize="7.5" fill="#047857" fontWeight="bold">3. Actual GET payload.json request (Allowed)</text>

                {/* S3 Destination */}
                <rect x="380" y="30" width="290" height="120" rx="6" fill="#f0fdf4" stroke="#10b981" strokeWidth="1.5" />
                <text x="525" y="52" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#047857">🪣 Target S3 Bucket: domain-b.s3.amazonaws.com</text>
                <text x="395" y="75" fontSize="8" fill="var(--color-text-secondary)" fontWeight="bold">CORS Rules Configured:</text>
                <rect x="395" y="85" width="260" height="50" rx="4" fill="var(--color-background-primary)" stroke="var(--color-border-secondary)" strokeWidth="0.8" />
                <text x="405" y="100" textAnchor="start" fontSize="8" fontFamily="monospace" fill="#0e7490">AllowedOrigin: "https://domain-a.com"</text>
                <text x="405" y="112" textAnchor="start" fontSize="8" fontFamily="monospace" fill="#0e7490">AllowedMethod: "GET", "PUT", "HEAD"</text>
                <text x="405" y="124" textAnchor="start" fontSize="8" fontFamily="monospace" fill="#0e7490">MaxAgeSeconds: 3000</text>
              </svg>
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY */}
        {activeTab === 'security' && (
          <div>
            {/* 📚 Visual Concept Deep-Dive Grid */}
            <div className="s3-sec">📚 Concept Deep-Dive: S3 Access Controls &amp; Firewalls</div>
            <div className="s3-grid-edu" style={{ '--theme-color': '#f59e0b' } as React.CSSProperties}>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  IAM Policies vs Resource Policies
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  An <span className="s3-hl-orange">IAM Policy</span> <span className="s3-desc-mute">(an identity-based JSON permission document attached to users, groups, or roles inside your corporate cloud perimeter)</span> is an identity-based JSON policy attached to users, groups, or roles inside your account. A <span className="s3-hl-orange">Resource Policy (S3 Bucket Policy)</span> <span className="s3-desc-mute">(a resource-attached JSON authorization document applied directly to a bucket to govern public or cross-account clients)</span> is attached directly to the bucket itself, governing cross-account or public rules.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #f59e0b' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f59e0b', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers resource-based <span className="s3-hl-orange">S3 Bucket Policies</span> <span className="s3-desc-mute">(resource-level authorization rules)</span> alongside identity-based <span className="s3-hl-orange">IAM Policies</span> <span className="s3-desc-mute">(client identity access policies)</span>. Which means you can control access from the perspective of both the storage resource itself (the bucket) and the client identity (the user/role), with S3 evaluating both sets of policies simultaneously to decide whether to authorize the request.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Policy Conditions (VPC &amp; IP Restricts)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <span className="s3-hl-orange">Policy Conditions</span> <span className="s3-desc-mute">(highly advanced contextual logic clauses matching variables like client source IP addresses, SSL enforcement flags, or specific VPC endpoints)</span> are optional clauses in S3 policies that match specific request context keys, such as source IP range (<code>SourceIp</code>) or the VPC Gateway Endpoint identifier (<code>sourceVpce</code>).
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #f59e0b' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f59e0b', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <span className="s3-hl-orange">S3 Policy Conditions</span> <span className="s3-desc-mute">(contextual authorization filters)</span> such as <span className="s3-hl-orange">aws:sourceVpce</span> <span className="s3-desc-mute">(VPC endpoint restriction gate)</span> and <span className="s3-hl-orange">aws:SourceIp</span> <span className="s3-desc-mute">(corporate IP subnet filter gate)</span>. Which means you can lock bucket access down to specific Virtual Private Cloud (VPC) Gateway Endpoints or corporate IP addresses, completely blocking requests that originate from the public internet even if they have valid IAM keys.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Block Public Access Override (BPA)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <span className="s3-hl-orange">Block Public Access (BPA)</span> <span className="s3-desc-mute">(an absolute centralized account or bucket firewall override setting that guarantees no public policies or wildcard rules take effect)</span> is a four-tiered master security firewall setting applied at the AWS account or S3 bucket level to block wildcard public access rules from ever taking effect.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #f59e0b' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f59e0b', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <span className="s3-hl-orange">S3 Block Public Access (BPA)</span> <span className="s3-desc-mute">(account-level absolute public override firewall switch)</span> as a centralized, account-level or bucket-level master override switch. Which means S3 places a fail-safe gate that overrides and completely drops public bucket policies and ACL permissions, ensuring human developer configuration errors can never accidentally expose your internal company data to the public internet.
                  </div>
                </div>
              </div>

            </div>

            {/* 🎨 Architectural SVG */}
            <div className="s3-sec">S3 Inbound Request Authorization Evaluation Pipeline</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                How S3 processes IAM policies, resource statements, and the Block Public Access override master gate.
              </div>
              <svg viewBox="0 0 700 180" width="100%" style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                {/* Client Packet */}
                <rect x="15" y="65" width="80" height="50" rx="4" fill="#0891b2" stroke="#0e7490" strokeWidth="1" />
                <text x="55" y="90" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#fff">Inbound Request</text>
                <text x="55" y="102" textAnchor="middle" fontSize="7.5" fill="#fff">GET/PUT s3://</text>

                <path d="M95,90 L140,90" stroke="#94a3b8" strokeWidth="1.5" />

                {/* Gate 1: BPA */}
                <rect x="140" y="45" width="100" height="90" rx="6" fill="#fef2f2" stroke="#991b1b" strokeWidth="1" />
                <text x="190" y="70" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#991b1b">Gate 1: BPA</text>
                <text x="190" y="85" textAnchor="middle" fontSize="8" fill="#7f1d1d">Block Public</text>
                <text x="190" y="98" textAnchor="middle" fontSize="8" fill="#7f1d1d">Access Settings</text>
                <text x="190" y="115" textAnchor="middle" fontSize="7" fill="#be123c" fontWeight="bold">Override Evaluated</text>

                <path d="M240,90 L285,90" stroke="#94a3b8" strokeWidth="1.5" />

                {/* Gate 2: Explicit Deny */}
                <rect x="285" y="45" width="110" height="90" rx="6" fill="#ffe4e6" stroke="#e11d48" strokeWidth="1" />
                <text x="340" y="70" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#e11d48">Gate 2: Explicit Deny</text>
                <text x="340" y="85" textAnchor="middle" fontSize="8" fill="#9f1239">Matches Deny</text>
                <text x="340" y="98" textAnchor="middle" fontSize="8" fill="#9f1239">Conditions?</text>
                <text x="340" y="115" textAnchor="middle" fontSize="7.5" fill="#be123c" fontWeight="bold">(HTTP, Non-VPCE)</text>

                <path d="M395,90 L440,90" stroke="#94a3b8" strokeWidth="1.5" />

                {/* Gate 3: Explicit Allow */}
                <rect x="440" y="45" width="110" height="90" rx="6" fill="#f0fdf4" stroke="#166534" strokeWidth="1" />
                <text x="495" y="70" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#166534">Gate 3: Allow checks</text>
                <text x="495" y="85" textAnchor="middle" fontSize="8" fill="#14532d">Matches Bucket</text>
                <text x="495" y="98" textAnchor="middle" fontSize="8" fill="#14532d">or IAM Allow?</text>
                <text x="495" y="115" textAnchor="middle" fontSize="7.5" fill="#15803d" fontWeight="bold">(Action matching)</text>

                <path d="M550,90 L600,90" stroke="#94a3b8" strokeWidth="1.5" />

                {/* Decision */}
                <circle cx="630" cy="90" r="25" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
                <text x="630" y="94" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#065f46">Result</text>
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
                    <select value={ingressTrafficSource} onChange={e => setIngressTrafficSource(e.target.value as any)} style={{ padding: '4px 8px', fontSize: '11.5px', width: '100%' }}>
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
                            color: log.includes('❌') ? '#ef4444' : log.includes('✅') ? '#10b981' : log.includes('⚠️') ? '#f59e0b' : '#38bdf8',
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
        )}

        {/* TAB 3: ENCRYPTION */}
        {activeTab === 'encryption' && (
          <div>
            {/* 📚 Visual Concept Deep-Dive Grid */}
            <div className="s3-sec">📚 Concept Deep-Dive: Server-Side &amp; Envelope Encryption</div>
            <div className="s3-grid-edu" style={{ '--theme-color': '#10b981' } as React.CSSProperties}>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Server-Side Encryption Models (SSE)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-green">Server-Side Encryption (SSE)</span></strong> <span className="s3-desc-mute">(the transparent background process where S3 hardware hypervisors encrypt data payloads at-rest as they are written to disk storage networks, and decrypt them on GET requests)</span> is the process where S3 automatically encrypts your object data at the hardware level as it writes it to disks in its data centers, and decrypts it when accessed.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #10b981' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers four models of <strong><span className="s3-hl-green">Server-Side Encryption</span></strong>: <span className="s3-hl-green">SSE-S3</span> <span className="s3-desc-mute">(AWS-managed standard AES-256 keys)</span>, <span className="s3-hl-green">SSE-KMS</span> <span className="s3-desc-mute">(KMS-managed Customer Master Keys with advanced key rotation schedules and full audit trails)</span>, <span className="s3-hl-green">SSE-C</span> <span className="s3-desc-mute">(keys managed entirely by the customer, only via CLI/API over HTTPS)</span>, and <strong><span className="s3-hl-green">DSSE-KMS</span></strong> <span className="s3-desc-mute">(Dual-layer Server-Side Encryption with two independent KMS keys for absolute compliance)</span>. Which means your objects are automatically encrypted before they are written to disk, complying with data-at-rest security rules.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  KMS Envelope Encryption &amp; API Quota Limits
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-green">Envelope Encryption</span></strong> <span className="s3-desc-mute">(a multi-key security practice that encrypts high-volume data payloads with a unique local data key, and then encrypts that data key under a secure master key managed inside a centralized key store)</span> is the practice of encrypting data with a Plaintext Data Key, and then encrypting that key under a highly secure, non-exportable Customer Master Key (CMK) managed inside KMS.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #10b981' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers **KMS Envelope Encryption** where every object upload/download makes direct KMS calls: <strong><span className="s3-hl-green">GenerateDataKey</span></strong> (for uploads) and <strong><span className="s3-hl-green">Decrypt</span></strong> (for downloads). Which means high-volume traffic is subject to regional KMS API limits <span className="s3-desc-mute">(e.g. 5,500 / 10,000 / 30,000 requests per second per region)</span>; exceeding these thresholds triggers a `KMS:ThrottlingException`. To mitigate this, you can request a **KMS Quota Increase** using the Service Quotas Console.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Bucket Keys &amp; Key Scrubbing
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-green">Key Scrubbing</span></strong> <span className="s3-desc-mute">(a hypervisor-level microsecond register zeroization that zeroizes and overwrites RAM containing symmetric keys the instant a block cipher finishes execution)</span> is a hypervisor security function. An **S3 Bucket Key** is a secure, bucket-level caching key that reduces KMS transit requests.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #10b981' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-green">S3 Bucket Keys</span></strong> <span className="s3-desc-mute">(bucket-level data key caching)</span> to cache keys at the S3 bucket layer. Which means instead of calling KMS on every single object operations, S3 caches a bucket-level key transiently in memory to derive folder keys locally, reducing outbound KMS API requests and transit cost by **up to 99%** while maintaining standard hypervisor **Memory Key Scrubbing** zeroization.
                  </div>
                </div>
              </div>

            </div>
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
                    <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', height: '2px', background: '#334155', zIndex: 1 }} />
                    <div style={{ position: 'absolute', top: '10px', left: '10px', width: `${((Math.max(1, encryptionStep) - 1) / 4) * 100}%`, height: '2px', background: '#10b981', zIndex: 1, transition: 'width 0.4s' }} />

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
                          background: encryptionStep >= step.s ? '#10b981' : '#1e293b',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10.5px',
                          fontWeight: 'bold',
                          border: '2px solid #334155',
                          transition: 'background 0.3s'
                        }}>
                          {step.s}
                        </div>
                        <span style={{ fontSize: '9px', marginTop: '2px', color: encryptionStep >= step.s ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>{step.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* Encryption hex output display */}
                  <div style={{ background: '#090d16', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b', marginBottom: '10px', fontSize: '11px', fontFamily: 'monospace' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#94a3b8' }}>Plaintext Key (hypervisor RAM):</span>
                      <span style={{ color: plaintextKeyHex ? '#f59e0b' : '#ef4444', fontWeight: 'bold' }}>
                        {plaintextKeyHex ? plaintextKeyHex.substring(0, 16) + '...' : '[SCRUBBED / ZEROIZED]'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Encrypted Key (sector metadata):</span>
                      <span style={{ color: encryptedKeyHex ? '#10b981' : '#64748b' }}>
                        {encryptedKeyHex ? encryptedKeyHex.substring(0, 16) + '...' : '[Awaiting encryption]'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Encryption execution Logs:</div>
                    <div ref={encryptionTerminalRef} className="s3-terminal" style={{ height: '110px' }}>
                      {encryptionLogs.length === 0 ? (
                        <div style={{ color: '#64748b' }}>[idle] Awaiting envelope write simulation...</div>
                      ) : (
                        encryptionLogs.map((log, idx) => (
                          <div key={idx} style={{
                            color: log.includes('❌') ? '#ef4444' : log.includes('✅') ? '#10b981' : log.includes('⚠️') ? '#f59e0b' : '#38bdf8',
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
                <svg viewBox="0 0 700 180" width="100%" style={{ background: '#f0fdf4', borderRadius: '6px', border: '0.5px solid #a7f3d0' }}>
                  <defs>
                    <marker id="arr-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#047857" /></marker>
                  </defs>
                  
                  {/* User Client */}
                  <rect x="25" y="45" width="120" height="90" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="85" y="65" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#334155">💻 Client (User)</text>
                  <rect x="35" y="80" width="100" height="40" rx="4" fill="#f8fafc" stroke="#e2e8f0" />
                  <text x="85" y="93" textAnchor="middle" fontSize="6.5" fill="#475569">HTTPS upload request</text>
                  <text x="85" y="103" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#047857">"x-amz-server-side-encryption":</text>
                  <text x="85" y="112" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#047857">"AES-256"</text>

                  {/* Flow Arrow */}
                  <path d="M145,90 L210,90" stroke="#047857" strokeWidth="1.5" markerEnd="url(#arr-green)" />
                  <text x="177" y="82" textAnchor="middle" fontSize="7" fill="#047857" fontWeight="bold">Upload ➔</text>

                  {/* S3 Service Node */}
                  <rect x="220" y="45" width="160" height="90" rx="6" fill="#ffffff" stroke="#10b981" strokeWidth="1.5" />
                  <text x="300" y="65" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#065f46">🪣 S3 Service Engine</text>
                  <text x="300" y="80" textAnchor="middle" fontSize="7.5" fill="#047857">Header Match: AES-256</text>
                  <rect x="235" y="92" width="130" height="30" rx="3" fill="#ecfdf5" stroke="#a7f3d0" />
                  <text x="300" y="102" textAnchor="middle" fontSize="7" fill="#065f46" fontWeight="bold">S3 Key (Owned by AWS)</text>
                  <text x="300" y="112" textAnchor="middle" fontSize="6.5" fill="#047857">AES-256 Symmetric Cipher</text>

                  {/* Flow Arrow */}
                  <path d="M380,90 L445,90" stroke="#047857" strokeWidth="1.5" markerEnd="url(#arr-green)" />
                  <text x="412" y="82" textAnchor="middle" fontSize="7" fill="#047857" fontWeight="bold">Encrypt ➔</text>

                  {/* S3 Storage Target */}
                  <rect x="455" y="45" width="220" height="90" rx="6" fill="#ffffff" stroke="#047857" strokeWidth="1.5" />
                  <text x="565" y="65" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#065f46">🗄️ Physical SSD Disk Sectors</text>
                  <rect x="470" y="80" width="190" height="42" rx="4" fill="#f0fdf4" stroke="#86efac" />
                  <text x="565" y="93" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#166534">🔒 Ciphertext Object Payload</text>
                  <text x="565" y="105" textAnchor="middle" fontSize="7" fill="#15803d">Stored securely in target prefix</text>
                  <text x="565" y="115" textAnchor="middle" fontSize="6.5" fill="#065f46" fontStyle="italic">Decryption requires matching IAM GET permission</text>
                </svg>
              )}

              {encryptionType === 'sse-kms' && (
                <svg viewBox="0 0 700 190" width="100%" style={{ background: '#f0f9ff', borderRadius: '6px', border: '0.5px solid #bae6fd' }}>
                  <defs>
                    <marker id="arr-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#0284c7" /></marker>
                    <marker id="arr-gold" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#d97706" /></marker>
                  </defs>

                  {/* User Client */}
                  <rect x="15" y="55" width="115" height="90" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="72" y="75" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">💻 Client (User)</text>
                  <rect x="25" y="90" width="95" height="40" rx="4" fill="#f8fafc" stroke="#e2e8f0" />
                  <text x="72" y="103" textAnchor="middle" fontSize="6" fill="#475569">HTTPS upload request</text>
                  <text x="72" y="113" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#0284c7">"x-amz-server-side-encryption":</text>
                  <text x="72" y="122" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#0284c7">"aws:kms"</text>

                  {/* Flow Arrow */}
                  <path d="M130,100 L185,100" stroke="#0284c7" strokeWidth="1.5" markerEnd="url(#arr-blue)" />
                  <text x="157" y="92" textAnchor="middle" fontSize="7" fill="#0284c7" fontWeight="bold">Upload ➔</text>

                  {/* S3 Service Engine */}
                  <rect x="185" y="55" width="145" height="90" rx="6" fill="#ffffff" stroke="#0ea5e9" strokeWidth="1.5" />
                  <text x="257" y="75" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#0369a1">🪣 S3 Service Engine</text>
                  <text x="257" y="90" textAnchor="middle" fontSize="7" fill="#0284c7">Requests Data Key</text>
                  <rect x="195" y="105" width="125" height="25" rx="3" fill="#f0f9ff" stroke="#bae6fd" />
                  <text x="257" y="115" textAnchor="middle" fontSize="6.5" fill="#0369a1" fontWeight="bold">GenerateDataKey Request</text>

                  {/* S3 to KMS loop */}
                  <path d="M257,55 L257,25 L405,25 L405,55" fill="none" stroke="#d97706" strokeWidth="1.2" strokeDasharray="3,2" markerEnd="url(#arr-gold)" />
                  <text x="331" y="18" textAnchor="middle" fontSize="6.5" fill="#b45309" fontWeight="bold">KMS API Call 🔄 (CloudTrail Audited)</text>

                  {/* AWS KMS Block */}
                  <rect x="350" y="55" width="110" height="90" rx="6" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5" />
                  <text x="405" y="75" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#b45309">🔑 AWS KMS</text>
                  <text x="405" y="90" textAnchor="middle" fontSize="7.5" fill="#b45309"><b>CMK Master Key</b></text>
                  <rect x="360" y="105" width="90" height="25" rx="3" fill="#fef3c7" stroke="#fde68a" />
                  <text x="405" y="115" textAnchor="middle" fontSize="6.5" fill="#78350f">Returns Plain+Cipher Key</text>

                  {/* Flow Arrow */}
                  <path d="M460,100 L515,100" stroke="#0284c7" strokeWidth="1.5" markerEnd="url(#arr-blue)" />
                  <text x="487" y="92" textAnchor="middle" fontSize="7" fill="#0284c7" fontWeight="bold">Encrypt ➔</text>

                  {/* Physical disks storage */}
                  <rect x="515" y="55" width="170" height="90" rx="6" fill="#ffffff" stroke="#166534" strokeWidth="1.5" />
                  <text x="600" y="75" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#15803d">🗄️ SSD Disk storage</text>
                  <rect x="525" y="90" width="150" height="42" rx="4" fill="#f0fdf4" stroke="#bbf7d0" />
                  <text x="600" y="103" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#166534">🔒 Ciphertext + Cipher Key</text>
                  <text x="600" y="113" textAnchor="middle" fontSize="6.5" fill="#14532d">Plaintext Data Key is Erased 🚫</text>
                  <text x="600" y="123" textAnchor="middle" fontSize="5.5" fill="#047857" fontStyle="italic">(RAM register completely scrubbed)</text>
                </svg>
              )}

              {encryptionType === 'sse-c' && (
                <svg viewBox="0 0 700 180" width="100%" style={{ background: '#faf5ff', borderRadius: '6px', border: '0.5px solid #d8b4fe' }}>
                  <defs>
                    <marker id="arr-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#6d28d9" /></marker>
                  </defs>

                  {/* User Client */}
                  <rect x="25" y="45" width="125" height="90" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="87" y="65" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#334155">💻 Client (User)</text>
                  <rect x="35" y="80" width="105" height="40" rx="4" fill="#faf5ff" stroke="#e9d5ff" />
                  <text x="87" y="93" textAnchor="middle" fontSize="7" fill="#6d28d9" fontWeight="bold">HTTPS Only (SSL/TLS)</text>
                  <text x="87" y="103" textAnchor="middle" fontSize="6" fill="#7c3aed">Header: base64 Customer Key</text>
                  <text x="87" y="112" textAnchor="middle" fontSize="6" fill="#7c3aed" fontStyle="italic">(Only configured via CLI/API)</text>

                  {/* Flow Arrow */}
                  <path d="M150,90 L215,90" stroke="#6d28d9" strokeWidth="1.5" markerEnd="url(#arr-purple)" />
                  <text x="182" y="82" textAnchor="middle" fontSize="7" fill="#6d28d9" fontWeight="bold">Key Header ➔</text>

                  {/* S3 Service Engine */}
                  <rect x="220" y="45" width="165" height="90" rx="6" fill="#ffffff" stroke="#a855f7" strokeWidth="1.5" />
                  <text x="302" y="65" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6b21a8">🪣 S3 Service Engine</text>
                  <text x="302" y="80" textAnchor="middle" fontSize="7.5" fill="#7c3aed">RAM Symmetric Encryption</text>
                  <rect x="230" y="92" width="145" height="30" rx="3" fill="#faf5ff" stroke="#ddd6fe" />
                  <text x="302" y="102" textAnchor="middle" fontSize="7" fill="#6d28d9" fontWeight="bold">🔑 Custom Key Used in RAM</text>
                  <text x="302" y="112" textAnchor="middle" fontSize="6.5" fill="#7c3aed" fontWeight="bold">Scrubbed immediately on write! ❌</text>

                  {/* Flow Arrow */}
                  <path d="M385,90 L450,90" stroke="#6d28d9" strokeWidth="1.5" markerEnd="url(#arr-purple)" />
                  <text x="417" y="82" textAnchor="middle" fontSize="7" fill="#6d28d9" fontWeight="bold">Encrypt ➔</text>

                  {/* S3 Storage Disk */}
                  <rect x="460" y="45" width="215" height="90" rx="6" fill="#ffffff" stroke="#6d28d9" strokeWidth="1.5" />
                  <text x="567" y="65" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#581c87">🗄️ SSD Disk storage</text>
                  <rect x="475" y="80" width="185" height="42" rx="4" fill="#faf5ff" stroke="#e9d5ff" />
                  <text x="567" y="93" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#6d28d9">🔒 Ciphertext Payload ONLY</text>
                  <text x="567" y="105" textAnchor="middle" fontSize="7" fill="#7c3aed">S3 does NOT store your key!</text>
                  <text x="567" y="115" textAnchor="middle" fontSize="6.5" fill="#581c87" fontStyle="italic">(Loss of key means data is lost forever)</text>
                </svg>
              )}

              {encryptionType === 'dsse-kms' && (
                <svg viewBox="0 0 700 190" width="100%" style={{ background: '#fffbeb', borderRadius: '6px', border: '0.5px solid #fed7aa' }}>
                  <defs>
                    <marker id="arr-orange-dsse" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ea580c" /></marker>
                    <marker id="arr-gold-dsse" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#d97706" /></marker>
                  </defs>

                  {/* User Client */}
                  <rect x="15" y="55" width="115" height="90" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                  <text x="72" y="75" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#334155">💻 Client (User)</text>
                  <rect x="25" y="90" width="95" height="40" rx="4" fill="#fffbeb" stroke="#ffedd5" />
                  <text x="72" y="103" textAnchor="middle" fontSize="6" fill="#475569">HTTPS upload request</text>
                  <text x="72" y="113" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#ea580c">"x-amz-server-side-encryption":</text>
                  <text x="72" y="122" textAnchor="middle" fontSize="6.5" fontWeight="bold" fill="#ea580c">"aws:kms:dsse"</text>

                  {/* Flow Arrow */}
                  <path d="M130,100 L185,100" stroke="#ea580c" strokeWidth="1.5" markerEnd="url(#arr-orange-dsse)" />
                  <text x="157" y="92" textAnchor="middle" fontSize="7" fill="#ea580c" fontWeight="bold">Upload ➔</text>

                  {/* S3 Service Engine */}
                  <rect x="185" y="55" width="145" height="90" rx="6" fill="#ffffff" stroke="#ea580c" strokeWidth="1.5" />
                  <text x="257" y="75" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#c2410c">🪣 S3 Service Engine</text>
                  <text x="257" y="90" textAnchor="middle" fontSize="7" fill="#ea580c">Requests 2 Master Keys</text>
                  <rect x="195" y="105" width="125" height="25" rx="3" fill="#fffbeb" stroke="#fed7aa" />
                  <text x="257" y="115" textAnchor="middle" fontSize="6.5" fill="#ea580c" fontWeight="bold">2x GenerateDataKey calls</text>

                  {/* S3 to KMS loop */}
                  <path d="M257,55 L257,25 L405,25 L405,55" fill="none" stroke="#d97706" strokeWidth="1.2" strokeDasharray="3,2" markerEnd="url(#arr-gold-dsse)" />
                  <text x="331" y="18" textAnchor="middle" fontSize="6.5" fill="#b45309" fontWeight="bold">Twin KMS Calls 🔄 (2x CMK Audited)</text>

                  {/* AWS KMS Block */}
                  <rect x="350" y="55" width="110" height="90" rx="6" fill="#fffbeb" stroke="#d97706" strokeWidth="1.5" />
                  <text x="405" y="75" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#b45309">🔑 AWS KMS CMKs</text>
                  <text x="405" y="92" textAnchor="middle" fontSize="7" fill="#b45309">Key A + Key B</text>
                  <rect x="360" y="105" width="90" height="25" rx="3" fill="#fef3c7" stroke="#fde68a" />
                  <text x="405" y="115" textAnchor="middle" fontSize="6" fill="#78350f">Returns 2x Plain+Cipher</text>

                  {/* Flow Arrow */}
                  <path d="M460,100 L515,100" stroke="#ea580c" strokeWidth="1.5" markerEnd="url(#arr-orange-dsse)" />
                  <text x="487" y="92" textAnchor="middle" fontSize="7" fill="#ea580c" fontWeight="bold">Double Enc ➔</text>

                  {/* Physical disks storage */}
                  <rect x="515" y="55" width="170" height="90" rx="6" fill="#ffffff" stroke="#ea580c" strokeWidth="1.5" />
                  <text x="600" y="72" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#ea580c">🗄️ SSD Dual-Cipher Disk</text>
                  <rect x="522" y="86" width="156" height="48" rx="4" fill="#fffbeb" stroke="#fed7aa" />
                  <text x="600" y="98" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#b45309">🔒 Layer 1 AES + Layer 2 AES</text>
                  <text x="600" y="108" textAnchor="middle" fontSize="6.5" fill="#7c2d12">Plaintext Keys A &amp; B Wiped 🚫</text>
                  <text x="600" y="118" textAnchor="middle" fontSize="5.5" fill="#b45309" fontStyle="italic">(Scrubbed transient hypervisor RAM)</text>
                </svg>
              )}
            </div>

            
          </div>
        )}

        {/* TAB 4: VERSIONING & WORM */}
        {activeTab === 'versioning' && (
          <div>
            {/* 📚 Visual Concept Deep-Dive Grid */}
            <div className="s3-sec">📚 Concept Deep-Dive: S3 Versioning stacks &amp; WORM Compliance</div>
            <div className="s3-grid-edu" style={{ '--theme-color': '#6366f1' } as React.CSSProperties}>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Object Versioning &amp; Delete Markers
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-indigo">Object Versioning</span></strong> <span className="s3-desc-mute">(a bucket-level configuration that preserves historical copies of files in a chronological stack under unique Version IDs)</span> is a bucket-level setting that maintains a running stack of historical files under unique Version IDs. A <strong><span className="s3-hl-indigo">Delete Marker</span></strong> <span className="s3-desc-mute">(a zero-byte logical placeholder placed at the top of a version stack to hide the object from standard logical namespace listings)</span> is a zero-byte placeholder placed at the top of the stack when an object is deleted, logically hiding the file.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #6366f1' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6366f1', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-indigo">S3 Object Versioning</span></strong> <span className="s3-desc-mute">(running stack version preservation)</span> to preserve, retrieve, and restore every iteration of an object stored in a bucket. Which means S3 maintains a stack of file historical copies under unique Version IDs; deleting an object merely places a logical '<span className="s3-hl-indigo">Delete Marker</span>' <span className="s3-desc-mute">(logical file listing hider)</span> at the top of the version stack to hide it, making it trivial to restore objects or recover from accidental deletions.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 MFA Delete Protection
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-indigo">MFA Delete</span></strong> <span className="s3-desc-mute">(an S3 security protocol that requires the supply of a physical hardware token TOTP code to complete permanently destructive API requests or change versioning settings)</span> is an S3 security control requiring the configuration of a physical hardware Multi-Factor Authentication (MFA) token to complete permanently destructive API requests.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #6366f1' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6366f1', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-indigo">S3 MFA Delete</span></strong> <span className="s3-desc-mute">(physical hardware MFA gate for destructive actions)</span> to require multi-factor authentication for critical version operations. Which means suspensions of bucket versioning or permanent purges of historical object versions from the stack must supply a live passcode from a physical MFA hardware token, preventing ransomware or compromised administrative credentials from destroying data.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Object Lock (WORM Compliancy)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-indigo">S3 Object Lock</span></strong> <span className="s3-desc-mute">(a WORM regulatory lock system guaranteeing file immutability by blocking deletes and edits)</span> is a WORM (Write Once Read Many) mechanism. It includes <strong><span className="s3-hl-indigo">Retention Periods</span></strong> <span className="s3-desc-mute">(which protect objects for a fixed period and can be extended)</span> and <strong><span className="s3-hl-indigo">Legal Holds</span></strong> <span className="s3-desc-mute">(which protect objects indefinitely and require the s3:PutObjectLegalHold IAM permission)</span>.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #6366f1' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6366f1', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-indigo">Retention Periods</span></strong> <span className="s3-desc-mute">(fixed WORM duration blocks)</span> to protect objects for a set duration, which can be extended. It also offers <strong><span className="s3-hl-indigo">Legal Holds</span></strong> <span className="s3-desc-mute">(indefinite compliance blocks)</span> which protect objects infinitely and independently from any retention period. Which means you can ensure total, tamper-proof file immutability, with legal holds overriding all deletion calls until explicitly removed by authorized admins carrying the <code>s3:PutObjectLegalHold</code> IAM permission.
                  </div>
                </div>
              </div>

            </div>

            {/* 🎨 Architectural SVG */}
            <div className="s3-sec">S3 Active version Stack &amp; Delete marker mechanics</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Understand how S3 stacks historical versions and inserts Delete Markers to hide objects logical listings.
              </div>
              <svg viewBox="0 0 700 180" width="100%" style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                {/* Stack 1: Standard Active */}
                <rect x="50" y="20" width="180" height="140" rx="6" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" strokeWidth="1" />
                <text x="140" y="38" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">Scenario A: Active version</text>

                <rect x="65" y="55" width="150" height="35" rx="3" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1" />
                <text x="140" y="72" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#0369a1">📄 Active Version: v3</text>
                <text x="140" y="84" textAnchor="middle" fontSize="7.5" fill="#0369a1">ID: A92kd81 - Current</text>

                <rect x="65" y="100" width="150" height="25" rx="3" fill="var(--color-background-secondary)" stroke="var(--color-border-tertiary)" strokeWidth="0.5" />
                <text x="140" y="116" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">📄 Old version: v2 (B19dfa)</text>

                {/* Stack 2: Standard Deleted */}
                <rect x="260" y="20" width="180" height="140" rx="6" fill="var(--color-background-primary)" stroke="#ef4444" strokeWidth="1" />
                <text x="350" y="38" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#991b1b">Scenario B: Logical Delete</text>

                <rect x="275" y="55" width="150" height="35" rx="3" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.5" />
                <text x="350" y="72" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#991b1b">🛑 DELETE MARKER</text>
                <text x="350" y="84" textAnchor="middle" fontSize="7.5" fill="#991b1b">Hides all below (Logical Empty)</text>

                <rect x="275" y="100" width="150" height="25" rx="3" fill="var(--color-background-secondary)" stroke="var(--color-border-tertiary)" strokeWidth="0.5" />
                <text x="350" y="116" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">📄 Old version: v3 (A92kd81)</text>

                {/* Stack 3: WORM lock */}
                <rect x="470" y="20" width="180" height="140" rx="6" fill="var(--color-background-primary)" stroke="#166534" strokeWidth="1.5" />
                <text x="560" y="38" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#166534">Scenario C: WORM locked</text>

                <rect x="485" y="55" width="150" height="45" rx="3" fill="#f0fdf4" stroke="#166534" strokeWidth="1.5" />
                <text x="560" y="72" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#15803d">🔒 COMPLIANCE LOCK</text>
                <text x="560" y="84" textAnchor="middle" fontSize="7.5" fill="#15803d">Retention days: Active</text>
                <text x="560" y="93" textAnchor="middle" fontSize="7" fill="#166534" fontWeight="bold">DELETIONS FULLY REJECTED</text>
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
                    <select value={wormIdentity} onChange={e => setWormIdentity(e.target.value as any)} style={{ padding: '4px 8px', fontSize: '11.5px', width: '100%' }}>
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
                    <div style={{ color: '#64748b' }}>[idle] Awaiting Write/Delete operations to analyze metadata lock blocks...</div>
                  ) : (
                    wormAuditLogs.map((log, idx) => (
                      <div key={idx} style={{
                        color: log.includes('❌') ? '#ef4444' : log.includes('✅') ? '#10b981' : log.includes('⚠️') ? '#f59e0b' : '#38bdf8',
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
        )}

        {/* TAB 5: STORAGE CLASSES & LIFECYCLE */}
        {activeTab === 'storage' && (
          <div>
            {/* 📚 Visual Concept Deep-Dive Grid */}
            <div className="s3-sec">📚 Concept Deep-Dive: S3 Tiering, Lifecycles &amp; Vaults</div>
            <div className="s3-grid-edu" style={{ '--theme-color': '#a855f7' } as React.CSSProperties}>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Storage Classes Specs
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  An <strong><span className="s3-hl-purple">S3 Storage Class</span></strong> <span className="s3-desc-mute">(a storage hardware tier configured for specific data access frequency patterns, durability SLAs, minimum file lifetimes, data retrieval fees, and physical media architectures)</span> is a storage tier configured for specific data access patterns, availability SLA targets, minimum storage durations, and pricing structures.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #a855f7' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a855f7', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers seven unique <strong><span className="s3-hl-purple">S3 Storage Classes</span></strong>: <span className="s3-hl-purple">Standard</span> <span className="s3-desc-mute">(active hot data accessed frequently)</span>, <span className="s3-hl-purple">Standard-IA</span> <span className="s3-desc-mute">(Infrequent Access with millisecond retrievals)</span>, <span className="s3-hl-purple">One Zone-IA</span> <span className="s3-desc-mute">(single Availability Zone storage for non-critical, recreatable datasets)</span>, <span className="s3-hl-purple">Intelligent-Tiering</span> <span className="s3-desc-mute">(automated machine-learning based transitions between hot and cold access tiers)</span>, <span className="s3-hl-purple">Glacier Instant Retrieval</span> <span className="s3-desc-mute">(archived data retrievable in milliseconds)</span>, <span className="s3-hl-purple">Glacier Flexible Retrieval</span> <span className="s3-desc-mute">(cold tape archives retrievable in 1 to 5 hours)</span>, and <span className="s3-hl-purple">Glacier Deep Archive</span> <span className="s3-desc-mute">(hyper-cheap taped archives retrievable in 12 hours)</span>. Which means you can optimize hosting costs by matching access patterns to hardware tiers, keeping active files on high-performance hot disks and shifting older, rarely-accessed datasets to archival tapes for up to a 90%+ cost reduction.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Automated Lifecycle Transitions
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  An <strong><span className="s3-hl-purple">S3 Lifecycle Policy</span></strong> <span className="s3-desc-mute">(a set of rule triggers that automates data tier migration ciphers or permanent deletion actions as objects age)</span> is a set of XML rules that automates storage tier migrations (<i>Transition Actions</i>) or object purges (<i>Expiration Actions</i>) based on the age of the file.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #a855f7' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a855f7', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-purple">S3 Lifecycle Policies</span></strong> containing <span className="s3-hl-purple">Transition Actions</span> <span className="s3-desc-mute">(automatic migrations to cheaper, colder storage classes)</span> and <span className="s3-hl-purple">Expiration Actions</span> <span className="s3-desc-mute">(automatic file deletions and purge cycles)</span>. Which means you can define XML rules that automatically shift objects to colder classes or permanently delete them after a certain number of days, automating cold-tier optimization without any manual scripts or operational overhead.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Glacier Vault Locks (WORM Vaults)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  A <strong><span className="s3-hl-purple">Glacier Vault Lock</span></strong> <span className="s3-desc-mute">(an immutable compliance policy applied directly to long-term archives that cannot be modified, overridden, or deleted by any system administrator or root user once committed)</span> is an immutable resource policy attached directly to a Glacier vault that enforces unalterable, regulatory compliance locks.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #a855f7' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a855f7', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-purple">S3 Glacier Vault Lock</span></strong> <span className="s3-desc-mute">(write-once immutable regulatory tape vault lock)</span> as an immutable, write-once policy attached directly to a Glacier vault. Which means once a vault lock policy is committed and locked, the policy becomes unchangeable and un-deletable, ensuring absolute legal compliance for long-term records preservation.
                  </div>
                </div>
              </div>

            </div>

            {/* 🎨 Architectural SVG */}
            <div className="s3-sec">S3 Automatic Lifecycle Class Transition Timeline</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Watch objects cool down over time, shifting from expensive hot Standard classes down into hyper-cheap deep archival tapes.
              </div>
              <svg viewBox="0 0 700 180" width="100%" style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                {/* Timeline axis */}
                <line x1="40" y1="90" x2="660" y2="90" stroke="#94a3b8" strokeWidth="2.5" />
                <polygon points="660,86 670,90 660,94" fill="#94a3b8" />

                {/* Stages */}
                <circle cx="80" cy="90" r="8" fill="#0891b2" />
                <text x="80" y="112" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--color-text-primary)">Day 0: Standard</text>
                <text x="80" y="125" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">$0.023 per GB</text>
                <rect x="55" y="40" width="50" height="20" rx="3" fill="#e0f7fa" stroke="#00acc1" strokeWidth="0.8" />
                <text x="80" y="52" textAnchor="middle" fontSize="7.5" fill="#006064" fontWeight="bold">🔥 Hot Data</text>

                {/* Transition 1 */}
                <circle cx="280" cy="90" r="8" fill="#f59e0b" />
                <text x="280" y="112" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--color-text-primary)">Day 90: Standard-IA</text>
                <text x="280" y="125" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">$0.0125 per GB</text>
                <rect x="255" y="40" width="50" height="20" rx="3" fill="#fff8e1" stroke="#ffb300" strokeWidth="0.8" />
                <text x="280" y="52" textAnchor="middle" fontSize="7.5" fill="#5d4037" fontWeight="bold">❄️ Infrequent</text>

                {/* Transition 2 */}
                <circle cx="480" cy="90" r="8" fill="#a855f7" />
                <text x="480" y="112" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--color-text-primary)">Day 180: Glacier Deep</text>
                <text x="480" y="125" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">$0.00099 per GB</text>
                <rect x="450" y="40" width="60" height="20" rx="3" fill="#f3e5f5" stroke="#8e24aa" strokeWidth="0.8" />
                <text x="480" y="52" textAnchor="middle" fontSize="7.5" fill="#4a148c" fontWeight="bold">🕳️ Archive</text>

                {/* Expiration */}
                <circle cx="620" cy="90" r="8" fill="#ef4444" />
                <text x="620" y="112" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#b91c1c">Day 365: Expired</text>
                <text x="620" y="125" textAnchor="middle" fontSize="8" fill="#b91c1c">Deleted (Free)</text>
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
        )}

        {/* TAB 6: NETWORKING */}
        {activeTab === 'networking' && (
          <div>
            {/* 📚 Visual Concept Deep-Dive Grid */}
            <div className="s3-sec">📚 Concept Deep-Dive: S3 Gateway VPC Endpoints &amp; Access Points</div>
            <div className="s3-grid-edu" style={{ '--theme-color': '#06b6d4' } as React.CSSProperties}>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Gateway VPC Endpoints
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  A <strong><span className="s3-hl-cyan">Gateway VPC Endpoint</span></strong> <span className="s3-desc-mute">(a secure, private routing gateway that connects Virtual Private Clouds directly to S3 over regional backplane routing tables without using public IP gateways)</span> is a highly available, logical routing destination established inside a Virtual Private Cloud subnet that connects resources directly to regional S3 services.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #06b6d4' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#06b6d4', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-cyan">Gateway VPC Endpoints</span></strong> <span className="s3-desc-mute">(direct routing connections to internal S3 backplanes)</span> for S3 as a highly available, routing-table destination inside your Virtual Private Cloud. Which means private virtual machines (like EC2) can establish secure connections directly to S3 endpoints over AWS's private high-speed network backplane, bypassing the public internet and avoiding expensive NAT Gateway transit charges.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Prefix Lists &amp; Route Table Priorities
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  A <strong><span className="s3-hl-cyan">S3 Prefix List</span></strong> <span className="s3-desc-mute">(a regional set of public AWS S3 IP address blocks managed automatically by AWS to simplify corporate firewall and route-table rules)</span> is a regional, AWS-managed set of public S3 IP address blocks (e.g. <code>pl-63a5400a</code>) used to simplify and prioritize routing rules inside VPC route tables.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #06b6d4' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#06b6d4', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers regional <strong><span className="s3-hl-cyan">S3 Prefix Lists</span></strong> <span className="s3-desc-mute">(AWS-managed IP routing filters)</span> (like <code>pl-63a5400a</code>) for network routing configuration. Which means your subnet route tables automatically prioritize S3-destined traffic through the private Gateway Endpoint interface over default internet gateway routes, ensuring seamless, secure private transit without modifying server OS code.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Access Points
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  An <strong><span className="s3-hl-cyan">S3 Access Point</span></strong> <span className="s3-desc-mute">(a dedicated named network gateway hostname with its own focused IAM resource policy scoped for individual directory paths)</span> is an additional, named network endpoint with hostnames scoped specifically for a single directory or bucket path, each enforcing its own customized access rules.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #06b6d4' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#06b6d4', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-cyan">S3 Access Points</span></strong> <span className="s3-desc-mute">(dedicated hostnames for isolated subpaths)</span> as dedicated, named network endpoints attached to S3 buckets. Which means you can partition shared enterprise buckets into isolated directory-level routes (e.g. <code>/accounting</code> vs <code>/marketing</code>), each with its own focused access control policy to prevent a single bucket policy from growing too complex or hitting size limits.
                  </div>
                </div>
              </div>

            </div>

            {/* 🎨 Architectural SVG */}
            <div className="s3-sec">VPC Gateway Endpoint Private network routing topology</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Contrast public internet routing (via Internet Gateway) against private, free routing via S3 Gateway VPC Endpoint.
              </div>
              <svg viewBox="0 0 700 180" width="100%" style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                {/* Private Subnet VM */}
                <rect x="25" y="45" width="130" height="90" rx="6" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" strokeWidth="1" />
                <text x="90" y="70" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-text-primary)">Private EC2 Instances</text>
                <text x="90" y="85" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">Subnet: 10.0.1.0/24</text>
                <text x="90" y="100" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">(No Public IPs)</text>

                {/* Route A: Public route */}
                <path d="M155,70 L250,70 L250,30 L380,30" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                <rect x="235" y="40" width="30" height="15" rx="3" fill="#fef2f2" stroke="#ef4444" strokeWidth="0.8" />
                <text x="250" y="50" textAnchor="middle" fontSize="6.5" fill="#ef4444" fontWeight="bold">NAT/IGW</text>
                <text x="310" y="24" fontSize="7.5" fill="#ef4444" fontWeight="bold">Egress Fees Apply (Public Web)</text>

                {/* Route B: Gateway vpce route */}
                <path d="M155,100 L380,100" fill="none" stroke="#10b981" strokeWidth="2.5" />
                <rect x="210" y="108" width="110" height="20" rx="3" fill="#ecfdf5" stroke="#10b981" strokeWidth="0.8" />
                <text x="265" y="121" textAnchor="middle" fontSize="7.5" fill="#065f46" fontWeight="bold">🔗 S3 VPC Endpoint Link</text>
                <text x="265" y="93" fontSize="8" fill="#065f46" fontWeight="bold">Private Internal Transit (100% Free)</text>

                {/* S3 Public Endpoint */}
                <rect x="380" y="15" width="120" height="35" rx="3" fill="var(--color-background-primary)" stroke="#ef4444" strokeWidth="1" />
                <text x="440" y="30" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#ef4444">s3.amazonaws.com</text>
                <text x="440" y="42" textAnchor="middle" fontSize="6.5" fill="var(--color-text-secondary)">(Public Edge Router)</text>

                {/* S3 gateway vpce endpoint target */}
                <rect x="380" y="80" width="130" height="50" rx="3" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                <text x="445" y="98" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#065f46">S3 Service backplane</text>
                <text x="445" y="112" textAnchor="middle" fontSize="7.5" fill="#065f46">Prefix: pl-63a5400a</text>
              </svg>
            </div>

            {/* 🎨 S3 Route Table Matching SVG Diagram */}
            <div className="s3-sec">VPC Gateway Endpoints Routing Mechanics &amp; Route Table Rules</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Inside the VPC router fabrics: S3 Prefix Lists override default routes, forwarding traffic privately via Gateway links.
              </div>
              <svg viewBox="0 0 700 180" width="100%" style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                {/* Private subnet route table */}
                <rect x="20" y="25" width="310" height="135" rx="6" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" strokeWidth="1" />
                <text x="35" y="42" fontSize="10" fontWeight="bold" fill="var(--color-text-primary)">📁 VPC Private Route Table Rules</text>

                {/* Headers */}
                <rect x="30" y="52" width="290" height="18" fill="var(--color-background-tertiary)" />
                <text x="35" y="65" fontSize="7.5" fontWeight="bold" fill="var(--color-text-secondary)">Destination IP Block (Prefix)</text>
                <text x="175" y="65" fontSize="7.5" fontWeight="bold" fill="var(--color-text-secondary)">Target Gateway / Interface</text>
                <text x="275" y="65" fontSize="7.5" fontWeight="bold" fill="var(--color-text-secondary)">Status</text>

                {/* Rows */}
                <text x="35" y="86" fontSize="8" fontFamily="monospace" fill="var(--color-text-primary)">10.0.0.0/16 (Local Subnet)</text>
                <text x="175" y="86" fontSize="8" fontFamily="monospace" fill="var(--color-text-secondary)">local</text>
                <text x="275" y="86" fontSize="8" fontWeight="bold" fill="#10b981">Active</text>
                <line x1="30" y1="92" x2="320" y2="92" stroke="var(--color-border-secondary)" strokeWidth="0.5" />

                {/* S3 gateway route rule */}
                <rect x="30" y="96" width="290" height="18" fill="rgba(16, 185, 129, 0.08)" />
                <text x="35" y="108" fontSize="8" fontFamily="monospace" fill="#047857" fontWeight="bold">pl-63a5400a (AWS S3 Virginia)</text>
                <text x="175" y="108" fontSize="8" fontFamily="monospace" fill="#047857" fontWeight="bold">vpce-0d8fa928bcde1a38</text>
                <text x="275" y="108" fontSize="8" fontWeight="bold" fill="#10b981">Active</text>
                <line x1="30" y1="116" x2="320" y2="116" stroke="var(--color-border-secondary)" strokeWidth="0.5" />

                {/* Public Egress Route */}
                <text x="35" y="130" fontSize="8" fontFamily="monospace" fill="#ef4444">0.0.0.0/0 (Global Public Egress)</text>
                <text x="175" y="130" fontSize="8" fontFamily="monospace" fill="#ef4444">nat-0d8fa2bcda1128</text>
                <text x="275" y="130" fontSize="8" fontWeight="bold" fill="#10b981">Active</text>

                {/* Packet Routing Visual */}
                <path d="M335,90 L400,90" stroke="#10b981" strokeWidth="2.5" />
                <text x="365" y="82" textAnchor="middle" fontSize="7" fill="#047857" fontWeight="bold">Private match</text>

                {/* Target Private AWS Endpoint */}
                <rect x="410" y="25" width="270" height="135" rx="6" fill="#f0fdf4" stroke="#10b981" strokeWidth="1.5" />
                <text x="545" y="45" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#047857">🔌 Gateway Endpoint Private Transit</text>
                <text x="425" y="70" fontSize="8.5" fill="var(--color-text-secondary)">
                  When EC2 makes requests to S3 Virginia, the OS router checks matching tables. S3 Prefix matching rules hijack default egress routing, shifting connections directly into VPCE Gateway fabrics.
                </text>
                <rect x="425" y="105" width="240" height="40" rx="4" fill="var(--color-background-primary)" stroke="#10b981" strokeWidth="0.8" />
                <text x="435" y="120" fontSize="8" fill="#047857" fontWeight="bold">✔ ZERO DATA TRANSFER COST OUT OF VPC</text>
                <text x="435" y="132" fontSize="8" fill="#047857" fontWeight="bold">✔ SECURE INTERNAL NETWORK LINK (No Public IPs)</text>
              </svg>
            </div>

            {/* 🎨 S3 Access Points Multi-Tenant Access Control SVG Diagram */}
            <div className="s3-sec">S3 Access Points — Dedicated Subpath Gateways &amp; Partitioned Bucket Security</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginBottom: '10px' }}>
                Access Points act as unique entry gates with their own scoped IAM resource policies. They eliminate complex monolithic bucket policies by isolating users to their respective subfolders.
              </div>
              <svg viewBox="0 0 740 310" width="100%" style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                <defs>
                  <marker id="ap-arr-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#8b5cf6" /></marker>
                  <marker id="ap-arr-teal" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#0d9488" /></marker>
                  <marker id="ap-arr-orange" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ea580c" /></marker>
                  <marker id="ap-arr-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#2563eb" /></marker>
                </defs>

                {/* Left Column: Department Users */}
                {/* Finance User */}
                <rect x="15" y="25" width="110" height="65" rx="6" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" />
                <text x="70" y="45" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">Finance Dept</text>
                <text x="70" y="60" textAnchor="middle" fontSize="8" fill="#8b5cf6" fontWeight="bold">👤 Finance User</text>
                <path d="M125,57 L175,57" fill="none" stroke="#8b5cf6" strokeWidth="1.5" markerEnd="url(#ap-arr-purple)" />

                {/* Sales User */}
                <rect x="15" y="115" width="110" height="65" rx="6" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" />
                <text x="70" y="135" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">Sales Dept</text>
                <text x="70" y="150" textAnchor="middle" fontSize="8" fill="#0d9488" fontWeight="bold">👤 Sales User</text>
                <path d="M125,147 L175,147" fill="none" stroke="#0d9488" strokeWidth="1.5" markerEnd="url(#ap-arr-teal)" />

                {/* Analytics Platform */}
                <rect x="15" y="205" width="110" height="65" rx="6" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" />
                <text x="70" y="225" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">Analytics Sys</text>
                <text x="70" y="240" textAnchor="middle" fontSize="8" fill="#ea580c" fontWeight="bold">🤖 Analytics App</text>
                <path d="M125,237 L175,237" fill="none" stroke="#ea580c" strokeWidth="1.5" markerEnd="url(#ap-arr-orange)" />

                {/* Middle Column: Scoped Access Points + Policies */}
                {/* Finance Access Point */}
                <rect x="175" y="20" width="165" height="75" rx="6" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="1.5" />
                <text x="257" y="36" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#6d28d9">🔑 Finance Access Point</text>
                <text x="187" y="52" fontSize="7.5" fill="#7c3aed" fontWeight="bold">✔ Scoped: /finance/* prefix</text>
                <text x="187" y="65" fontSize="7" fill="var(--color-text-secondary)">Policy: Grant R/W to Finance</text>
                <rect x="315" y="70" width="16" height="12" rx="2" fill="#8b5cf6" />
                <text x="323" y="79" textAnchor="middle" fontSize="7" fill="#fff" fontWeight="bold">✔</text>
                <path d="M340,57 L440,57 L440,90 L480,90" fill="none" stroke="#8b5cf6" strokeWidth="1.5" markerEnd="url(#ap-arr-purple)" />

                {/* Sales Access Point */}
                <rect x="175" y="110" width="165" height="75" rx="6" fill="#f0fdfa" stroke="#0d9488" strokeWidth="1.5" />
                <text x="257" y="126" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#0f766e">🔑 Sales Access Point</text>
                <text x="187" y="142" fontSize="7.5" fill="#0f766e" fontWeight="bold">✔ Scoped: /sales/* prefix</text>
                <text x="187" y="155" fontSize="7" fill="var(--color-text-secondary)">Policy: Grant R/W to Sales</text>
                <rect x="315" y="160" width="16" height="12" rx="2" fill="#0d9488" />
                <text x="323" y="169" textAnchor="middle" fontSize="7" fill="#fff" fontWeight="bold">✔</text>
                <path d="M340,147 L480,147" fill="none" stroke="#0d9488" strokeWidth="1.5" markerEnd="url(#ap-arr-teal)" />

                {/* Analytics Access Point */}
                <rect x="175" y="200" width="165" height="75" rx="6" fill="#fff7ed" stroke="#ea580c" strokeWidth="1.5" />
                <text x="257" y="216" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#c2410c">🔑 Analytics Access Point</text>
                <text x="187" y="232" fontSize="7.5" fill="#c2410c" fontWeight="bold">✔ Scoped: Entire Bucket</text>
                <text x="187" y="245" fontSize="7" fill="var(--color-text-secondary)">Policy: Grant Read to all prefixes</text>
                <rect x="315" y="250" width="16" height="12" rx="2" fill="#ea580c" />
                <text x="323" y="259" textAnchor="middle" fontSize="7" fill="#fff" fontWeight="bold">✔</text>
                <path d="M340,237 L440,237 L440,205 L480,205" fill="none" stroke="#ea580c" strokeWidth="1.5" markerEnd="url(#ap-arr-orange)" />

                {/* Right Column: Shared S3 Bucket */}
                <rect x="480" y="20" width="245" height="255" rx="8" fill="#eff6ff" stroke="#2563eb" strokeWidth="2" />
                <text x="602" y="38" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#1e40af">🪣 Shared S3 Bucket</text>

                {/* Red Monolithic Policy warning */}
                <rect x="620" y="48" width="95" height="35" rx="4" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.5" />
                <text x="667" y="60" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#991b1b">Bucket Policy</text>
                <text x="667" y="72" textAnchor="middle" fontSize="7" fill="#b91c1c" fontWeight="bold">❌ Simplified!</text>

                {/* Folders (Subpaths) */}
                {/* /finance */}
                <rect x="495" y="90" width="215" height="60" rx="4" fill="#ffffff" stroke="#c084fc" strokeWidth="1.5" />
                <text x="505" y="106" fontSize="9.5" fontWeight="bold" fill="#6b21a8">📂 /finance/ subpath</text>
                <text x="505" y="122" fontSize="7.5" fill="var(--color-text-secondary)">Holds cost reports, ledgers &amp; invoices</text>
                <text x="505" y="136" fontSize="7.5" fill="#6b21a8" fontWeight="bold">Authorized for: Finance User &amp; Analytics</text>

                {/* /sales */}
                <rect x="495" y="170" width="215" height="60" rx="4" fill="#ffffff" stroke="#2dd4bf" strokeWidth="1.5" />
                <text x="505" y="186" fontSize="9.5" fontWeight="bold" fill="#0f766e">📂 /sales/ subpath</text>
                <text x="505" y="202" fontSize="7.5" fill="var(--color-text-secondary)">Holds customer contracts &amp; pipelines</text>
                <text x="505" y="216" fontSize="7.5" fill="#0f766e" fontWeight="bold">Authorized for: Sales User &amp; Analytics</text>

                {/* Divider Line */}
                <line x1="480" y1="245" x2="725" y2="245" stroke="#bfdbfe" strokeWidth="1" />
                <text x="602" y="260" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#2563eb">✔ Access Management: Simplify security management for S3 Buckets</text>
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
                      <select className="s3-card select" style={{ width: '100%', padding: '6px', fontSize: '12px' }} value={apIdentity} onChange={(e) => setApIdentity(e.target.value as any)}>
                        <option value="finance_user">👤 Finance IAM User</option>
                        <option value="sales_user">👤 Sales IAM User</option>
                        <option value="auditor">🔎 Compliance Auditor</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>2. Connection Gateway</label>
                      <select className="s3-card select" style={{ width: '100%', padding: '6px', fontSize: '12px' }} value={apEndpoint} onChange={(e) => setApEndpoint(e.target.value as any)}>
                        <option value="bucket_root">🪣 Main Bucket Endpoint</option>
                        <option value="finance_ap">🔌 Finance Access Point</option>
                        <option value="sales_ap">🔌 Sales Access Point</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '10px', display: 'block', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>3. Target Folder Path</label>
                      <select className="s3-card select" style={{ width: '100%', padding: '6px', fontSize: '12px' }} value={apAction} onChange={(e) => setApAction(e.target.value as any)}>
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
                        <div style={{ color: '#64748b' }}>[idle] Awaiting request dispatch...</div>
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
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Live Routing Visualization:</div>
                  
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '120px', margin: '8px 0' }}>
                    {apAnimationState === 'idle' && (
                      <div style={{ textAlign: 'center', color: '#64748b' }}>
                        <div style={{ fontSize: '28px' }}>💤</div>
                        <div style={{ fontSize: '11px', marginTop: '6px' }}>Ready to analyze. Configure variables and dispatch a packet.</div>
                      </div>
                    )}
                    {apAnimationState === 'routing' && (
                      <div style={{ textAlign: 'center', color: '#8b5cf6', animation: 'draw 2s linear infinite' }}>
                        <div style={{ fontSize: '32px' }}>⚡📡</div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '6px' }}>EVALUATING ACCESS POINT POLICIES...</div>
                      </div>
                    )}
                    {apAnimationState === 'granted' && (
                      <div style={{ textAlign: 'center', color: '#166534', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '12px', borderRadius: '8px', width: '100%' }}>
                        <div style={{ fontSize: '28px' }}>✅🎉</div>
                        <div style={{ fontSize: '12.5px', fontWeight: 'bold', marginTop: '4px' }}>GET 200 AUTHORIZED!</div>
                        <div style={{ fontSize: '10.5px', color: '#15803d', marginTop: '4px', lineHeight: '1.3' }}>
                          Scoped Access Point policy verified the client credentials and matched the requested directory prefix `{apAction === 'read_finance' ? 'finance/' : 'sales/'}` perfectly.
                        </div>
                      </div>
                    )}
                    {apAnimationState === 'denied' && (
                      <div style={{ textAlign: 'center', color: '#991b1b', background: '#fef2f2', border: '1px solid #fca5a5', padding: '12px', borderRadius: '8px', width: '100%' }}>
                        <div style={{ fontSize: '28px' }}>❌🚫</div>
                        <div style={{ fontSize: '12.5px', fontWeight: 'bold', marginTop: '4px' }}>ACCESS DENIED (HTTP 403)</div>
                        <div style={{ fontSize: '10.5px', color: '#b91c1c', marginTop: '4px', lineHeight: '1.3' }}>
                          {apEndpoint === 'bucket_root' 
                            ? 'Root directory is blocked for standard team accounts under security baseline profiles.' 
                            : `Endpoint restriction mismatch: Scoped AP does not permit this identity or folder pathway.`}
                        </div>
                        <button className="s3-btn" style={{ fontSize: '9px', padding: '2px 8px', marginTop: '8px', borderColor: '#ef4444', color: '#ef4444' }} onClick={() => setApAnimationState('idle')}>
                          Reset Sandbox
                        </button>
                      </div>
                    )}
                  </div>

                  {apAnimationState === 'granted' && (
                    <button className="s3-btn" style={{ fontSize: '11px', width: '100%', fontWeight: 600 }} onClick={() => setApAnimationState('idle')}>
                      Clear &amp; Run Next Test
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: TRANSFER & REPLICATION */}
        {activeTab === 'transfer' && (
          <div>
            {/* 📚 Visual Concept Deep-Dive Grid */}
            <div className="s3-sec">📚 Concept Deep-Dive: Acceleration, Replication &amp; signed tokens</div>
            <div className="s3-grid-edu" style={{ '--theme-color': '#3b82f6' } as React.CSSProperties}>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Transfer Acceleration
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-cyan">Transfer Acceleration</span></strong> <span className="s3-desc-mute">(a performance optimization feature that routes geographic uploads through the closest Amazon CloudFront Edge location to travel over AWS\'s private high-speed fiber backbone)</span> is a geographic upload-optimization feature that routes your file uploads through the globally distributed Amazon CloudFront Edge network.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #3b82f6' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3b82f6', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-cyan">S3 Transfer Acceleration</span></strong> <span className="s3-desc-mute">(global CloudFront Edge ingestion routing)</span> utilizing the globally distributed Amazon CloudFront Edge Location network. Which means upload packets are ingested at the nearest geographic edge location and routed over AWS\'s private high-speed fiber backbone to the target bucket, reducing latency and boosting upload speeds by up to 300% for international clients.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Replication (SRR &amp; CRR)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-cyan">S3 Replication</span></strong> <span className="s3-desc-mute">(an asynchronous storage engine that automatically copies new object writes to separate buckets in the same region or different countries)</span> is a bucket-level feature that executes automated, asynchronous copy tasks of newly uploaded files to separate destination buckets in the same region (<i>Same-Region Replication / SRR</i> <span className="s3-desc-mute">(standby backup copies in the same region)</span>) or different regions (<i>Cross-Region Replication / CRR</i> <span className="s3-desc-mute">(standby backup copies across different geographic regions)</span>).
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #3b82f6' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3b82f6', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <span className="s3-hl-cyan">Same-Region Replication</span> <span className="s3-desc-mute">(SRR - standby copies in the same region)</span> and <span className="s3-hl-cyan">Cross-Region Replication</span> <span className="s3-desc-mute">(CRR - compliance/disaster recovery global standby copies)</span> as automated asynchronous copy engines. Which means S3 instantly replicates uploaded objects to separate destination buckets in either the same region (for standby disaster recovery) or a different country (to comply with data residency laws or minimize latency for remote users).
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Presigned URLs
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  A <strong><span className="s3-hl-cyan">Presigned URL</span></strong> <span className="s3-desc-mute">(a secure web link cryptographically signed with corporate credentials that authorizes clients to directly read or write objects for a temporary timeframe)</span> is a secure, temporary web link generated with embedded credentials that grants limited read or write access to specific S3 object paths for a designated timeframe.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #3b82f6' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3b82f6', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers temporal <strong><span className="s3-hl-cyan">S3 Presigned URLs</span></strong> <span className="s3-desc-mute">(cryptographically signed temporal credential links)</span> cryptographically signed by an application server's IAM credentials. Which means clients can directly upload to or download from designated bucket paths for a limited time without possessing AWS credentials, keeping the bucket secure and avoiding app server bandwidth bottlenecks.
                  </div>
                </div>
              </div>

            </div>

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
                        <div style={{ color: '#64748b' }}>[idle] Awaiting upload simulation dispatch...</div>
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
                    <svg viewBox="0 0 350 250" width="100%" height="250" style={{ background: '#fef2f2', borderRadius: '6px', border: '0.5px solid #fecaca' }}>
                      <defs>
                        <marker id="arr-accel-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#ef4444" /></marker>
                      </defs>

                      {/* Nodes */}
                      {/* USA Terminal */}
                      <rect x="15" y="25" width="90" height="50" rx="4" fill="var(--color-background-primary)" stroke="#fca5a5" strokeWidth="1" />
                      <text x="60" y="42" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--color-text-primary)">💻 Client (USA)</text>
                      <text x="60" y="54" textAnchor="middle" fontSize="7.5" fill="#ef4444" fontWeight="bold">Standard GET/PUT</text>

                      {/* ISP hop */}
                      <circle cx="60" cy="125" r="16" fill="#fff" stroke="#ef4444" strokeWidth="1" />
                      <text x="60" y="128" textAnchor="middle" fontSize="7.5" fill="#b91c1c" fontWeight="bold">Local ISP</text>

                      {/* BGP 1 hop */}
                      <circle cx="160" cy="90" r="16" fill="#fff" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,1" />
                      <text x="160" y="93" textAnchor="middle" fontSize="7" fill="#b91c1c" fontWeight="bold">AS-Peer A</text>

                      {/* BGP 2 hop */}
                      <circle cx="160" cy="170" r="16" fill="#fff" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,1" />
                      <text x="160" y="173" textAnchor="middle" fontSize="7" fill="#b91c1c" fontWeight="bold">AS-Peer B</text>

                      {/* Sydney S3 Bucket */}
                      <rect x="235" y="120" width="100" height="70" rx="4" fill="var(--color-background-primary)" stroke="#ef4444" strokeWidth="1.5" />
                      <text x="285" y="140" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--color-text-primary)">🪣 Target S3</text>
                      <text x="285" y="155" textAnchor="middle" fontSize="8" fill="#c53030" fontWeight="bold">🇦🇺 Australia</text>
                      <text x="285" y="168" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">Standard Route</text>

                      {/* Paths */}
                      <path d="M60,75 L60,109" fill="none" stroke="#fca5a5" strokeWidth="1" markerEnd="url(#arr-accel-red)" />
                      <path d="M76,120 L144,95" fill="none" stroke="#fca5a5" strokeWidth="1" markerEnd="url(#arr-accel-red)" />
                      <path d="M160,106 L160,154" fill="none" stroke="#fca5a5" strokeWidth="1" markerEnd="url(#arr-accel-red)" />
                      <path d="M176,170 L235,155" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#arr-accel-red)" />

                      <text x="175" y="225" textAnchor="middle" fontSize="8" fill="#b91c1c" fontWeight="bold">🐌 Multi-Hop Congested Public WWW (~820ms)</text>

                      {/* Glowing animated data packet */}
                      {transferIsRunning && (
                        <circle cx={
                          transferStep === 1 ? 60 :
                          transferStep === 2 ? 60 :
                          transferStep === 3 ? 160 :
                          285
                        } cy={
                          transferStep === 1 ? 50 :
                          transferStep === 2 ? 125 :
                          transferStep === 3 ? 170 :
                          155
                        } r="6" fill="#ef4444" className="s3-g-circle">
                          <animate attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite" />
                        </circle>
                      )}
                    </svg>
                  ) : (
                    <svg viewBox="0 0 350 250" width="100%" height="250" style={{ background: '#ecfdf5', borderRadius: '6px', border: '0.5px solid #a7f3d0' }}>
                      <defs>
                        <marker id="arr-accel-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#10b981" /></marker>
                      </defs>

                      {/* Nodes */}
                      {/* USA Terminal */}
                      <rect x="15" y="25" width="90" height="50" rx="4" fill="var(--color-background-primary)" stroke="#86efac" strokeWidth="1" />
                      <text x="60" y="42" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--color-text-primary)">💻 Client (USA)</text>
                      <text x="60" y="54" textAnchor="middle" fontSize="7.5" fill="#15803d" fontWeight="bold">Accelerated Host</text>

                      {/* USA POP Ingestion */}
                      <rect x="15" y="115" width="100" height="42" rx="4" fill="#ffffff" stroke="#10b981" strokeWidth="1.2" />
                      <text x="65" y="130" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#065f46">USA POP Edge</text>
                      <text x="65" y="142" textAnchor="middle" fontSize="7.5" fill="#047857" fontWeight="bold">CloudFront Node</text>

                      {/* Sydney S3 Bucket */}
                      <rect x="235" y="120" width="100" height="70" rx="4" fill="var(--color-background-primary)" stroke="#166534" strokeWidth="1.5" />
                      <text x="285" y="140" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--color-text-primary)">🪣 Target S3</text>
                      <text x="285" y="155" textAnchor="middle" fontSize="8" fill="#166534" fontWeight="bold">🇦🇺 Australia</text>
                      <text x="285" y="168" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">ap-southeast-2</text>

                      {/* Paths */}
                      <path d="M60,75 L60,115" fill="none" stroke="#10b981" strokeWidth="2" markerEnd="url(#arr-accel-green)" />
                      <path d="M115,136 L235,136" fill="none" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arr-accel-green)" />

                      <text x="175" y="120" textAnchor="middle" fontSize="7.5" fill="#047857" fontWeight="bold">⚡ Undersea Dark Fiber</text>
                      <text x="175" y="225" textAnchor="middle" fontSize="8" fill="#047857" fontWeight="bold">⚡ Dedicated AWS Backbone Transit (~190ms)</text>

                      {/* Glowing animated data packet */}
                      {transferIsRunning && (
                        <circle cx={
                          transferStep === 1 ? 60 :
                          transferStep === 2 ? 60 :
                          transferStep === 3 ? 175 :
                          285
                        } cy={
                          transferStep === 1 ? 50 :
                          transferStep === 2 ? 136 :
                          transferStep === 3 ? 136 :
                          155
                        } r="6" fill="#10b981" className="s3-g-circle">
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
              <svg viewBox="0 0 700 180" width="100%" style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                {/* Source Region */}
                <rect x="20" y="20" width="180" height="140" rx="6" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" strokeWidth="1" />
                <text x="110" y="42" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">🇺🇸 Source (Virginia)</text>

                <rect x="35" y="60" width="150" height="35" rx="3" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1" />
                <text x="110" y="77" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#1e40af">🪣 Source Bucket</text>
                <text x="110" y="89" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">Versioning: ENABLED</text>

                {/* IAM worker transit */}
                <path d="M200,77 L340,77" stroke="#3b82f6" strokeWidth="2" strokeDasharray="3,2" />
                <path d="M200,110 L500,110" stroke="#a855f7" strokeWidth="2.5" />

                {/* SRR Target */}
                <rect x="340" y="45" width="140" height="100" rx="6" fill="#f0fdf4" stroke="#10b981" strokeWidth="1" />
                <text x="410" y="65" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#047857">🇺🇸 Same-Region Target</text>
                <text x="410" y="78" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">Virginia Sub-Zone</text>
                <rect x="350" y="92" width="120" height="22" rx="3" fill="#e8f5e9" stroke="#2e7d32" strokeWidth="0.8" />
                <text x="410" y="106" textAnchor="middle" fontSize="8" fill="#1b5e20" fontWeight="bold">🪣 SRR Backup (DR)</text>

                {/* CRR Target */}
                <rect x="500" y="45" width="180" height="100" rx="6" fill="#faf5ff" stroke="#a855f7" strokeWidth="1.5" />
                <text x="590" y="65" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#6b21a8">🇪🇺 Cross-Region Target</text>
                <text x="590" y="78" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">Frankfurt Region (EU)</text>
                <rect x="510" y="92" width="160" height="22" rx="3" fill="#f3e5f5" stroke="#4a148c" strokeWidth="0.8" />
                <text x="590" y="106" textAnchor="middle" fontSize="8" fill="#4a148c" fontWeight="bold">🪣 CRR Sovereign Archive</text>
              </svg>
            </div>

            {/* 🎨 Presigned URL Handshake SVG Diagram */}
            <div className="s3-sec">S3 Temporal Presigned URL Authorization Handshake</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                How application servers generate secure signatures to authorize limited, direct client uploads without exposing credentials.
              </div>
              <svg viewBox="0 0 700 180" width="100%" style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                {/* Client browser */}
                <rect x="20" y="45" width="120" height="90" rx="6" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" strokeWidth="1" />
                <text x="80" y="75" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-text-primary)">Client Frontend</text>
                <text x="80" y="90" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">No AWS Credentials</text>

                {/* Step 1: Request URL */}
                <path d="M140,65 L360,65" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="250" y="58" textAnchor="middle" fontSize="7.5" fill="#1e40af" fontWeight="bold">1. Request Download Token</text>

                {/* Step 2: Receive Presigned URL */}
                <path d="M360,85 L140,85" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,2" />
                <text x="250" y="98" textAnchor="middle" fontSize="7.5" fill="#1e40af" fontWeight="bold">2. Returns URL with cryptographic signature</text>

                {/* Step 3: Fetch directly from S3 */}
                <path d="M80,135 L80,165 L550,165 L550,135" fill="none" stroke="#10b981" strokeWidth="2.5" />
                <text x="315" y="160" textAnchor="middle" fontSize="8" fill="#047857" fontWeight="bold">3. Direct GET request with URL query credentials (Bypasses Server!)</text>

                {/* App Server */}
                <rect x="360" y="30" width="140" height="80" rx="6" fill="#f0fdf4" stroke="#166534" strokeWidth="1" />
                <text x="430" y="52" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#166534">Application Server</text>
                <text x="430" y="68" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">Owns IAM permissions</text>
                <text x="430" y="82" textAnchor="middle" fontSize="7" fill="#1b5e20" fontWeight="bold">Generates signed URL</text>

                {/* S3 Storage Endpoint */}
                <rect x="520" y="45" width="160" height="90" rx="6" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.5" />
                <text x="600" y="75" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e40af">S3 Secure Storage</text>
                <text x="600" y="90" textAnchor="middle" fontSize="8" fill="#1e40af">Validates Signature</text>
                <text x="600" y="102" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">&amp; Expiration Timer</text>
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
                        <div style={{ color: '#64748b' }}>[idle] Awaiting upload initialization...</div>
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
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                      Parallel Chunk Ingestion Streams: {mpUploadId && `[Session ID: ${mpUploadId}]`}
                    </div>

                    {mpStep === 0 && (
                      <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
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
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
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
        )}

        {/* TAB 8: OPERATIONS */}
        {activeTab === 'operations' && (
          <div>
            {/* 📚 Visual Concept Deep-Dive Grid */}
            <div className="s3-sec">📚 Concept Deep-Dive: Event Notifications, Batch Jobs &amp; Lens Analytics</div>
            <div className="s3-grid-edu" style={{ '--theme-color': '#ec4899' } as React.CSSProperties}>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Decoupled Event Notifications
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  An <strong><span className="s3-hl-pink">S3 Event Notification</span></strong> <span className="s3-desc-mute">(an asynchronous bucket trigger that automatically publishes standard alert payloads to SNS, SQS, or Lambda when write or delete operations occur)</span> is an asynchronous event trigger configured on a bucket to automatically publish standard alert messages to SNS, SQS, or Lambda when write/delete operations occur.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #ec4899' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ec4899', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers asynchronous <strong><span className="s3-hl-pink">S3 Event Notifications</span></strong> <span className="s3-desc-mute">(serverless event publishers)</span> integrated with Amazon SNS, SQS, and AWS Lambda. Which means your systems can react instantly the millisecond a file is uploaded or deleted (e.g., resizing an image or updating a database), building responsive serverless workflows instead of wasting resource cycles polling folders.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Batch Operations
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-pink">S3 Batch Operations</span></strong> <span className="s3-desc-mute">(an enterprise-scale large volume execution engine that processes bulk tag updates, encryption overrides, or WORM locks across billions of files simultaneously using a CSV manifest or S3 inventory report)</span> is an enterprise-scale bulk object management service that automates administrative tasks across billions of objects in parallel using an input CSV/inventory catalog.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #ec4899' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ec4899', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-pink">S3 Batch Operations</span></strong> <span className="s3-desc-mute">(fully-managed bulk object processor)</span> as a fully managed large-scale bulk object management service. Which means you can execute administrative actions (like modifying tags, replacing object locks, or copying files) in parallel across billions of objects using a simple CSV manifest, eliminating the need to write, host, and debug custom migration scripts.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Storage Lens Analytics
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-pink">S3 Storage Lens Analytics</span></strong> <span className="s3-desc-mute">(an organization-wide daily metadata scanning and analytics dashboard that offers unified usage metrics, configuration visibility, security alerts, and cost recommendations)</span> is a centralized operational and analytical dashboard that scans organization-wide bucket metadata daily, providing unified metrics and recommendations.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #ec4899' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ec4899', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-pink">S3 Storage Lens Analytics</span></strong> <span className="s3-desc-mute">(centralized metadata scanning dashboard)</span> to view setups. Which means you can audit organization-wide object counts, identify inactive prefixes, detect public buckets, and view recommendations in a single visual interface to optimize costs.
                  </div>
                </div>
              </div>
            </div>
            {/* 📊 S3 Storage Lens HUD Panel */}
            <div className="s3-sec">📊 S3 Storage Lens Organization HUD</div>
            <div className="s3-card" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
              <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Interactive daily metadata diagnostics for S3 resource footprint (auto-synced with bucket setups):</span>
                <span className="s3-badge" style={{ background: '#e2e8f0', color: '#334155' }}>Diagnostic HUD</span>
              </div>
              <div className="s3-g3">
                {/* Metric 1: Total Volume */}
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}>📁 Storage Volume</div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a', fontFamily: 'monospace' }}>
                    {lifecycleVolume >= 1000 ? `${(lifecycleVolume / 1000).toFixed(2)} TB` : `${lifecycleVolume} GB`}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                    Objects: <b>{(batchTotalObjects * 3).toLocaleString()}</b> · Prefixes: <b>142</b>
                  </div>
                </div>

                {/* Metric 2: Public Exposure risk */}
                <div style={{
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  borderTop: !(bpaAcls && bpaPolicies) ? '4px solid #f59e0b' : '4px solid #10b981'
                }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}>🛡️ Public Risk Exposure</div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: !(bpaAcls && bpaPolicies) ? '#d97706' : '#16a34a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{!(bpaAcls && bpaPolicies) ? '⚠️ HIGH' : '🟢 SECURE'}</span>
                    <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#475569' }}>
                      ({!(bpaAcls && bpaPolicies) ? 'BPA disabled' : '100% Protected'})
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '4px', lineHeight: '1.2' }}>
                    {!(bpaAcls && bpaPolicies) 
                      ? 'Wildcard access policies or public ACL overrides are allowed!'
                      : 'BPA is fully active. All public policy doors locked.'}
                  </div>
                </div>

                {/* Metric 3: Encryption Coverage */}
                <div style={{
                  background: '#ffffff',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #cbd5e1',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  borderTop: encryptionType === 'sse-s3' || encryptionType === 'sse-kms' || encryptionType === 'dsse-kms' ? '4px solid #10b981' : '4px solid #f59e0b'
                }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}>🔒 Encryption Coverage</div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: encryptionType === 'sse-s3' || encryptionType === 'sse-kms' || encryptionType === 'dsse-kms' ? '#16a34a' : '#d97706', fontFamily: 'monospace' }}>
                    {encryptionType === 'sse-s3' || encryptionType === 'sse-kms' || encryptionType === 'dsse-kms' ? '100%' : '95%'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>
                    Method: <b>{encryptionType.toUpperCase()}</b> {encryptionType === 'sse-c' && '(Customer Keys)'}
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
                        <select value={simulatedObjectKey} onChange={e => { setSimulatedObjectKey(e.target.value); setEventStep(0); setEventLogs([]); }} style={{ width: '100%', padding: '4px 6px', fontSize: '11px' }}>
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
                        <div style={{ color: '#64748b' }}>[idle] Awaiting simulated write trigger...</div>
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
                      <svg viewBox="0 0 350 170" width="100%" height="170" style={{ background: '#fffbeb', borderRadius: '6px', border: '0.5px solid #fde68a' }}>
                        <defs>
                          <marker id="arr-notify-direct" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#b45309" /></marker>
                        </defs>

                        {/* S3 Bucket */}
                        <rect x="15" y="55" width="90" height="60" rx="4" fill="#f0fdf4" stroke="#166534" strokeWidth="1" />
                        <text x="60" y="75" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#166534">🪣 Source S3</text>
                        <text x="60" y="90" textAnchor="middle" fontSize="7.5" fill="#15803d">my-premium-bucket</text>
                        <rect x="23" y="98" width="74" height="12" rx="2" fill="#e8f5e9" stroke="#81c784" strokeWidth="0.5" />
                        <text x="60" y="106" textAnchor="middle" fontSize="6.5" fill="#1b5e20" fontWeight="bold">PutObject Event</text>

                        {/* Paths */}
                        <path d="M105,75 L160,35" fill="none" stroke="#b45309" strokeWidth="1" strokeDasharray="3,1" markerEnd="url(#arr-notify-direct)" />
                        <path d="M105,85 L160,85" fill="none" stroke="#b45309" strokeWidth="1" strokeDasharray="3,1" markerEnd="url(#arr-notify-direct)" />
                        <path d="M105,95 L160,135" fill="none" stroke="#b45309" strokeWidth="1" strokeDasharray="3,1" markerEnd="url(#arr-notify-direct)" />

                        {/* Targets */}
                        <rect x="170" y="15" width="160" height="30" rx="3" fill="#ffffff" stroke="#f97316" strokeWidth="1" />
                        <text x="250" y="33" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#ea580c">📥 Amazon SNS Topic</text>

                        <rect x="170" y="70" width="160" height="30" rx="3" fill="#ffffff" stroke="#2563eb" strokeWidth="1" />
                        <text x="250" y="88" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1d4ed8">📥 Amazon SQS Queue</text>

                        <rect x="170" y="125" width="160" height="30" rx="3" fill="#ffffff" stroke="#a855f7" strokeWidth="1" />
                        <text x="250" y="143" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#7c3aed">📥 AWS Lambda Function</text>

                        {/* Animated Glowing Packet */}
                        {eventIsRunning && (
                          <circle cx={
                            eventStep === 1 ? 60 :
                            eventStep === 2 ? 100 :
                            eventStep === 3 ? 160 :
                            250
                          } cy={
                            eventStep === 1 ? 85 :
                            eventStep === 2 ? 85 :
                            eventStep === 3 ? 85 :
                            88
                          } r="5" fill="#b45309" className="s3-g-circle">
                            <animate attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite" />
                          </circle>
                        )}
                      </svg>

                      {/* Code preview block */}
                      <div style={{ background: '#090d16', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b', fontSize: '10.5px' }}>
                        <div style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase', marginBottom: '4px' }}>📝 Target SQS Access Resource Policy Constraint:</div>
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
                      <svg viewBox="0 0 350 170" width="100%" height="170" style={{ background: '#faf5ff', borderRadius: '6px', border: '0.5px solid #d8b4fe' }}>
                        <defs>
                          <marker id="arr-notify-eb" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#7c3aed" /></marker>
                        </defs>

                        {/* S3 Bucket */}
                        <rect x="15" y="55" width="90" height="60" rx="4" fill="#fdf4ff" stroke="#a855f7" strokeWidth="1" />
                        <text x="60" y="75" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#701a75">🪣 Source S3</text>
                        <text x="60" y="90" textAnchor="middle" fontSize="7.5" fill="#a21caf">EventBridge Natively On</text>

                        {/* Path */}
                        <path d="M105,85 L155,85" stroke="#7c3aed" strokeWidth="1.5" markerEnd="url(#arr-notify-eb)" />

                        {/* EventBridge Router */}
                        <rect x="155" y="35" width="80" height="95" rx="4" fill="#ffffff" stroke="#7c3aed" strokeWidth="1.5" />
                        <text x="195" y="52" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#5b21b6">⚙️ EventBridge</text>
                        <rect x="162" y="65" width="66" height="52" rx="2" fill="#faf5ff" stroke="#ddd6fe" />
                        <text x="195" y="76" textAnchor="middle" fontSize="6.5" fill="#6d28d9" fontWeight="bold">JSON Rule Match</text>
                        <text x="195" y="86" textAnchor="middle" fontSize="5.5" fill="var(--color-text-secondary)">Prefix: uploads/</text>
                        <text x="195" y="96" textAnchor="middle" fontSize="5.5" fill="var(--color-text-secondary)">Size &gt; 5MB</text>
                        <text x="195" y="108" textAnchor="middle" fontSize="6" fontWeight="bold" color={simulatedObjectKey.startsWith('uploads/') && simulatedObjectSize > 5 ? '#10b981' : '#ef4444'}>
                          {simulatedObjectKey.startsWith('uploads/') && simulatedObjectSize > 5 ? '✔ Matched' : '❌ Ignored'}
                        </text>

                        {/* Target Egress */}
                        <path d="M235,85 L260,85" stroke="#7c3aed" strokeWidth="1.2" markerEnd="url(#arr-notify-eb)" />

                        {/* 18+ services */}
                        <rect x="260" y="45" width="80" height="75" rx="4" fill="#eff6ff" stroke="#2563eb" strokeWidth="1" />
                        <text x="300" y="65" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#1e40af">🎯 18+ Target</text>
                        <text x="300" y="78" textAnchor="middle" fontSize="7" fill="#1e40af">Step Functions</text>
                        <text x="300" y="90" textAnchor="middle" fontSize="7" fill="#1e40af">Kinesis Streams</text>
                        <text x="300" y="102" textAnchor="middle" fontSize="7" fill="#1e40af">ECS Clusters</text>

                        {/* Animated Glowing Packet */}
                        {eventIsRunning && (
                          <circle cx={
                            eventStep === 1 ? 60 :
                            eventStep === 2 ? 130 :
                            eventStep === 3 ? 195 :
                            300
                          } cy={
                            eventStep === 1 ? 85 :
                            eventStep === 2 ? 85 :
                            eventStep === 3 ? 85 :
                            85
                          } r="5" fill="#7c3aed" className="s3-g-circle">
                            <animate attributeName="opacity" values="1;0.4;1" dur="0.8s" repeatCount="indefinite" />
                          </circle>
                        )}
                      </svg>

                      {/* Code preview block */}
                      <div style={{ background: '#090d16', padding: '10px', borderRadius: '6px', border: '1px solid #1e293b', fontSize: '10.5px' }}>
                        <div style={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase', marginBottom: '4px' }}>📝 Advanced EventBridge Filter Pattern JSON Rule:</div>
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
                      <div style={{ width: '100%', height: '8px', background: '#334155', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${batchProgressPercentage}%`, height: '100%', background: '#ec4899', transition: 'width 0.4s' }} />
                      </div>
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: '4px' }}>Distributed batch trace logs:</div>
                    <div ref={batchTerminalRef} className="s3-terminal" style={{ height: '100px', borderColor: '#475569' }}>
                      {batchLogs.length === 0 ? (
                        <div style={{ color: '#64748b' }}>[idle] Awaiting bulk batch job submission...</div>
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
                  <svg viewBox="0 0 350 250" width="100%" height="250" style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                    <defs>
                      <marker id="arr-batch-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#2563eb" /></marker>
                      <marker id="arr-batch-green" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#166534" /></marker>
                    </defs>

                    {/* S3 Inventory */}
                    <rect x="15" y="25" width="85" height="50" rx="4" fill="#fdf2f8" stroke="#ec4899" strokeWidth="1" />
                    <text x="57" y="45" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#be185d">📋 S3 Inventory</text>
                    <text x="57" y="55" textAnchor="middle" fontSize="6.5" fill="#db2777">Daily Object Audit</text>

                    {/* Path 1 */}
                    <path d="M100,50 L140,50" stroke="#ec4899" strokeWidth="1.2" strokeDasharray="3,1" markerEnd="url(#arr-batch-blue)" />

                    {/* Athena */}
                    <rect x="140" y="25" width="85" height="50" rx="4" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.2" />
                    <text x="182" y="45" textAnchor="middle" fontSize="8.5" fontWeight="bold" fill="#1e40af">🔍 Athena SQL</text>
                    <text x="182" y="55" textAnchor="middle" fontSize="6.5" fill="#2563eb">Compiles CSV list</text>

                    {/* Path 2 */}
                    <path d="M225,50 L265,50" stroke="#2563eb" strokeWidth="1.2" strokeDasharray="3,1" markerEnd="url(#arr-batch-green)" />

                    {/* Batch Job */}
                    <rect x="265" y="25" width="70" height="50" rx="4" fill="#f0fdf4" stroke="#166534" strokeWidth="1.2" />
                    <text x="300" y="45" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#14532d">⚙️ Batch Job</text>
                    <text x="300" y="55" textAnchor="middle" fontSize="6" fill="#15803d">Saves manifest.csv</text>

                    {/* Distributed threads radiating out */}
                    <path d="M300,75 L300,120" stroke="#166534" strokeWidth="1.5" strokeDasharray="3,2" markerEnd="url(#arr-batch-green)" />
                    <path d="M265,65 L170,120" stroke="#166534" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#arr-batch-green)" />
                    <path d="M335,65 L335,120" stroke="#166534" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#arr-accel-red)" />

                    {/* Heavy process targets */}
                    <rect x="120" y="120" width="100" height="42" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="170" y="135" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#475569">📄 uploads/financials/*</text>
                    <text x="170" y="147" textAnchor="middle" fontSize="6.5" fill="#94a3b8">Overwrote encryption key</text>

                    <rect x="235" y="120" width="100" height="42" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                    <text x="285" y="135" textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#475569">📄 uploads/archives/*</text>
                    <text x="285" y="147" textAnchor="middle" fontSize="6.5" fill="#94a3b8">WORM Retention Set</text>

                    <rect x="175" y="175" width="120" height="30" rx="3" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" />
                    <text x="235" y="193" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#047857">SUCCESS! ✅ JOB COMPLETE</text>

                    {/* Animated Manifest Glowing Packet */}
                    {batchIsRunning && (
                      <circle cx={
                        batchStep === 1 ? 57 :
                        batchStep === 2 ? 182 :
                        batchStep === 3 ? 300 :
                        batchStep === 4 ? (batchProgressPercentage < 50 ? 170 : 285) :
                        235
                      } cy={
                        batchStep === 1 ? 50 :
                        batchStep === 2 ? 50 :
                        batchStep === 3 ? 50 :
                        batchStep === 4 ? 135 :
                        193
                      } r="6" fill="#ec4899" className="s3-g-circle">
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
        )}
      </div>
    </div>
  );
}
