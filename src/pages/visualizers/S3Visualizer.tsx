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
  const [encryptionType, setEncryptionType] = useState<'sse-s3' | 'sse-kms' | 'sse-c'>('sse-s3');
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

  // Refs for console terminals
  const encryptionTerminalRef = useRef<HTMLDivElement>(null);
  const policyTerminalRef = useRef<HTMLDivElement>(null);
  const wormTerminalRef = useRef<HTMLDivElement>(null);

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
      } else {
        setEncryptionLogs(l => [
          ...l,
          `[s3-service] Intercepted WriteObject header. Initializing SSE-C direct customer cipher...`,
          `[s3-service] Handshaking with secure headers. Loaded client AES Base64 key: "${customSsecKey.substring(0, 16)}..."`
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
      } else {
        // SSE-C generates key derivations locally
        const localDerivationHex = 'SSEC-DERIVED-' + plainHex.substring(0, 16);
        setPlaintextKeyHex(customSsecKey.substring(0, 16).toUpperCase() + '...');
        setEncryptedKeyHex(localDerivationHex);
        setEncryptionLogs(l => [
          ...l,
          `[s3-service] Validated customer-provided raw key headers in hypervisor bus.`,
          `[s3-service] Derived active transient AES key: "${localDerivationHex}"`
        ]);
      }
    }, 2200);

    // Step 4: Encrypting in Memory & scrubbing plaintext key from RAM
    setTimeout(() => {
      setEncryptionStep(4);
      setEncryptionLogs(l => [
        ...l,
        `[hypervisor-memory] Initializing AES-256 symmetric block cipher...`,
        `[hypervisor-memory] Plaintext string payload successfully encrypted into ciphertext blocks.`,
        `[hypervisor-memory] ⚠️ RAM SHREDDING TRIGGERED: Scrubbing plaintext encryption keys from hypervisor RAM blocks for absolute host isolation.`
      ]);
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

  return (
    <div style={{ fontSize: '13.5px' }}>
      <style>{`
        .s3-tabs { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 14px; }
        .s3-tb { padding: 6px 14px; border-radius: 999px; border: 0.5px solid var(--color-border-secondary); font-size: 13.5px; cursor: pointer; background: var(--color-background-secondary); color: var(--color-text-secondary); transition: all .15s; outline: none; }
        .s3-tb:hover { background: var(--color-background-tertiary); }
        .s3-tb.s3-on { background: #0891b2; color: #fff; border-color: #0891b2; }
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
                  A <span className="s3-hl-cyan">Bucket (globally unique storage container)</span> is a globally unique storage container in the AWS cloud. An <span className="s3-hl-cyan">Object (file data and descriptive metadata)</span> is the fundamental entity stored in a bucket, consisting of file data and descriptive metadata. A <span className="s3-hl-cyan">Prefix (logical folder partition string)</span> is a string prefix (like <code>images/</code>) used to partition keys and simulate a directory structure.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #0891b2' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0891b2', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <span className="s3-hl-cyan">S3 Buckets (globally unique root containers)</span> as globally unique root containers, and <span className="s3-hl-cyan">S3 Objects (files and metadata keys)</span> as the files and metadata stored inside them, organized using <span className="s3-hl-cyan">Prefixes (logical simulated folders)</span>. Which means <span className="s3-hl-cyan">S3 operates as a flat key-value store</span> rather than a traditional hierarchical operating system directory tree, allowing it to scale infinitely and support a baseline rate of 3,500 PUT and 5,500 GET requests per second per prefix.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Static Website Hosting
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <span className="s3-hl-cyan">Static Website Hosting (serverless HTTP server for static assets)</span> is an S3 feature that allows you to configure a bucket to host website assets (HTML, CSS, JS, images, client scripts) and serve them via an HTTP/HTTPS endpoint directly to users.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #0891b2' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0891b2', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <span className="s3-hl-cyan">S3 Static Website Hosting (HTTP gateway for static assets)</span> to configure a bucket to act as an <span className="s3-hl-cyan">HTTP gateway</span>, serving HTML, CSS, JavaScript, and client-side images directly. Which means you can serve fast, globally scalable frontend applications without the operational overhead, pricing, patching, or scaling stress of running virtual machines (like EC2 or Nginx/Apache servers).
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  CORS &amp; Requester Pays
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <span className="s3-hl-cyan">CORS (Cross-Origin Resource Sharing)</span> is a browser security mechanism that allows web applications loaded in one domain to interact with resources in a different domain (S3). <span className="s3-hl-cyan">Requester Pays (requester-funded bandwidth charges)</span> is a bucket setting that shifts data download fees to the requesting user.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #0891b2' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#0891b2', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <span className="s3-hl-cyan">CORS configurations (whitelisted browser request origins)</span> to whitelist origins and <span className="s3-hl-cyan">Requester Pays billing flags (downloader pays egress fees)</span> for buckets. Which means you can securely authorize web applications running on other domains to fetch S3 data through standard browser preflight handshakes, and shift data egress bandwidth costs onto the downloader's AWS account rather than your own.
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

            {/* 🎨 S3 static web hosting & CORS Preflight SVG Diagram */}
            <div className="s3-sec">S3 Static Web Hosting &amp; Inbound CORS OPTIONS Preflight Handshake</div>
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
                  An <span className="s3-hl-orange">IAM Policy (identity-based JSON permission)</span> is an identity-based JSON policy attached to users, groups, or roles inside your account. A <span className="s3-hl-orange">Resource Policy (S3 Bucket Policy - resource-attached JSON rules)</span> is attached directly to the bucket itself, governing cross-account or public rules.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #f59e0b' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f59e0b', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers resource-based <span className="s3-hl-orange">S3 Bucket Policies (resource-level control)</span> alongside identity-based <span className="s3-hl-orange">IAM Policies (client-level control)</span>. Which means you can control access from the perspective of both the storage resource itself (the bucket) and the client identity (the user/role), with S3 evaluating both sets of policies simultaneously to decide whether to authorize the request.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Policy Conditions (VPC &amp; IP Restricts)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <span className="s3-hl-orange">Policy Conditions (contextual access restrictions)</span> are optional clauses in S3 policies that match specific request context keys, such as source IP range (<code>SourceIp</code>) or the VPC Gateway Endpoint identifier (<code>sourceVpce</code>).
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #f59e0b' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f59e0b', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <span className="s3-hl-orange">S3 Policy Conditions (context-based gates)</span> such as <span className="s3-hl-orange">aws:sourceVpce (VPC endpoint check)</span> and <span className="s3-hl-orange">aws:SourceIp (corporate IP whitelist)</span>. Which means you can lock bucket access down to specific Virtual Private Cloud (VPC) Gateway Endpoints or corporate IP addresses, completely blocking requests that originate from the public internet even if they have valid IAM keys.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Block Public Access Override (BPA)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <span className="s3-hl-orange">Block Public Access (BPA - account/bucket level fail-safe firewall)</span> is a four-tiered master security firewall setting applied at the AWS account or S3 bucket level to block wildcard public access rules from ever taking effect.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #f59e0b' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f59e0b', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <span className="s3-hl-orange">S3 Block Public Access (BPA - master override firewall switch)</span> as a centralized, account-level or bucket-level master override switch. Which means S3 places a fail-safe gate that overrides and completely drops public bucket policies and ACL permissions, ensuring human developer configuration errors can never accidentally expose your internal company data to the public internet.
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
                  <strong><span className="s3-hl-green">Server-Side Encryption (SSE - data encrypted at rest by AWS)</span></strong> is the process where S3 automatically encrypts your object data at the hardware level as it writes it to disks in its data centers, and decrypts it when accessed.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #10b981' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers three models of <strong><span className="s3-hl-green">Server-Side Encryption</span></strong>: <span className="s3-hl-green">SSE-S3 (S3-managed keys with automatic AES-256)</span>, <span className="s3-hl-green">SSE-KMS (KMS-managed Customer Master Keys with full audit trails)</span>, and <span className="s3-hl-green">SSE-C (keys managed entirely by the customer)</span>. Which means your objects are automatically encrypted with symmetric AES-256 blocks before they are written to the physical storage disks, ensuring compliance with data-at-rest regulatory security mandates.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  KMS Envelope Encryption &amp; Data Keys
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-green">Envelope Encryption (encrypting data keys with a master key)</span></strong> is the practice of encrypting data with a <span className="s3-hl-green">Plaintext Data Key (local AES-256 key)</span>, and then encrypting that data key under a highly secure, non-exportable <span className="s3-hl-green">Customer Master Key (CMK - KMS master key)</span> managed inside KMS.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #10b981' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-green">Envelope Encryption (dual-key security)</span></strong> by utilizing an AWS KMS <span className="s3-hl-green">Customer Master Key (CMK)</span> to generate unique data keys. Which means S3 requests a data key from KMS, uses the <span className="s3-hl-green">Plaintext Data Key</span> version to encrypt the large data file locally in memory, and stores the <span className="s3-hl-green">Encrypted Data Key</span> alongside the encrypted object on disk before discarding the plaintext key, protecting the master key from network exposure.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Transient Memory Key Scrubbing
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-green">Key Scrubbing (instant RAM register zeroization)</span></strong> is a hypervisor-level security function that instantly overwrites or zeroizes the active physical RAM registers holding the plaintext version of a symmetric cryptographic key.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #10b981' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#10b981', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers hypervisor-level <strong><span className="s3-hl-green">memory zeroization / scrubbing (hypervisor-level memory shredding)</span></strong> for transient encryption keys. Which means S3 shreds and wipes plaintext key vectors from its active hypervisor registers and memory blocks the microsecond a write block symmetric cipher completes, maintaining absolute security and isolation between multi-tenant virtual machines.
                  </div>
                </div>
              </div>

            </div>

            {/* 🎨 Architectural SVG */}
            <div className="s3-sec">SSE KMS Envelope Encryption write Pipeline</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Trace the data payload and key exchanges between S3 hypervisors, KMS servers, and physical block networks.
              </div>
              <svg viewBox="0 0 700 180" width="100%" style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                {/* Step 1: Plaintext payload */}
                <rect x="15" y="45" width="90" height="90" rx="6" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" strokeWidth="1" />
                <text x="60" y="70" textAnchor="middle" fontSize="10" fontWeight="bold" fill="var(--color-text-primary)">Step 1</text>
                <text x="60" y="90" textAnchor="middle" fontSize="9" fill="#10b981" fontWeight="bold">📄 Plaintext</text>
                <text x="60" y="105" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">Payload</text>

                <path d="M105,90 L150,90" stroke="#94a3b8" strokeWidth="1.5" />

                {/* Step 2: S3 Endpoint */}
                <rect x="150" y="45" width="140" height="90" rx="6" fill="var(--color-background-primary)" stroke="#10b981" strokeWidth="1.5" />
                <text x="220" y="65" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#10b981">Step 2: S3 Service</text>
                <text x="220" y="85" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">Requests Data Key</text>
                <text x="220" y="98" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">from KMS</text>

                {/* KMS Step */}
                <path d="M220,45 L220,15 M220,15 L430,15 L430,45" fill="none" stroke="#eab308" strokeWidth="1.5" strokeDasharray="3,2" />

                <rect x="380" y="45" width="100" height="90" rx="6" fill="#eff6ff" stroke="#1d4ed8" strokeWidth="1" />
                <text x="430" y="70" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#1e40af">Step 3: AWS KMS</text>
                <text x="430" y="90" textAnchor="middle" fontSize="8.5" fill="#1e40af" fontWeight="bold">🔑 Master CMK</text>
                <text x="430" y="105" textAnchor="middle" fontSize="7.5" fill="#1e40af">Generates Data Keys</text>

                <path d="M480,90 L525,90" stroke="#94a3b8" strokeWidth="1.5" />

                {/* Step 4: Storage cipher */}
                <rect x="525" y="45" width="160" height="90" rx="6" fill="#f0fdf4" stroke="#166534" strokeWidth="1.5" />
                <text x="605" y="65" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#166534">Step 4: SAN Disks</text>
                <text x="605" y="85" textAnchor="middle" fontSize="8.5" fill="#166534" fontWeight="bold">🔒 Ciphertext Payload</text>
                <text x="605" y="100" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">+ Encrypted Data Key</text>
                <text x="605" y="112" textAnchor="middle" fontSize="7" fill="#15803d" fontWeight="bold">(Plaintext Key Erased!)</text>
              </svg>
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
                  <strong><span className="s3-hl-indigo">Object Versioning (running stack of file history)</span></strong> is a bucket-level setting that maintains a running stack of historical files under unique Version IDs. A <strong><span className="s3-hl-indigo">Delete Marker (zero-byte placeholder)</span></strong> is a zero-byte placeholder placed at the top of the stack when an object is deleted, logically hiding the file.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #6366f1' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6366f1', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-indigo">S3 Object Versioning (historical file recovery)</span></strong> to preserve, retrieve, and restore every iteration of an object stored in a bucket. Which means S3 maintains a stack of file historical copies under unique Version IDs; deleting an object merely places a logical '<span className="s3-hl-indigo">Delete Marker (logical file hiding marker)</span>' at the top of the version stack to hide it, making it trivial to restore objects or recover from accidental deletions.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 MFA Delete Protection
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-indigo">MFA Delete (hardware token authorized destructive edits)</span></strong> is an S3 security control requiring the configuration of a physical hardware Multi-Factor Authentication (MFA) token to complete permanently destructive API requests.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #6366f1' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6366f1', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-indigo">S3 MFA Delete (multi-factor destructive action guard)</span></strong> to require multi-factor authentication for critical version operations. Which means suspensions of bucket versioning or permanent purges of historical object versions from the stack must supply a live passcode from a physical MFA hardware token, preventing ransomware or compromised administrative credentials from destroying data.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Object Lock (WORM Compliancy)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-indigo">S3 Object Lock (WORM - Write Once Read Many immutability)</span></strong> is a WORM (Write Once Read Many) mechanism enforcing immutability. It includes <span className="s3-hl-indigo">Compliance Mode</span> (locked for everyone), <span className="s3-hl-indigo">Governance Mode</span> (bypassed with admin keys), and <span className="s3-hl-indigo">Legal Holds</span> (manual locks).
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #6366f1' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6366f1', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-indigo">S3 Object Lock</span></strong> in <strong><span className="s3-hl-indigo">Compliance Mode (strict block for all users, root included)</span></strong>, <strong><span className="s3-hl-indigo">Governance Mode (bypassable with dedicated admin permissions)</span></strong>, and <strong><span className="s3-hl-indigo">Legal Holds (infinite retention lock manually toggled)</span></strong>. Which means you can enforce Write-Once-Read-Many (WORM) configurations, legally guaranteeing that compliance audit logs and historical ledger records can neither be edited nor deleted for a designated retention period.
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
                  An <strong><span className="s3-hl-purple">S3 Storage Class (performance &amp; cost hardware tier)</span></strong> is a storage tier configured for specific data access patterns, availability SLA targets, minimum storage durations, and pricing structures.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #a855f7' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a855f7', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers seven unique <strong><span className="s3-hl-purple">S3 Storage Classes</span></strong>: <span className="s3-hl-purple">Standard (active hot data)</span>, <span className="s3-hl-purple">Standard-IA (Infrequent Access with millisecond access)</span>, <span className="s3-hl-purple">One Zone-IA (cheap single AZ for recreatable data)</span>, <span className="s3-hl-purple">Intelligent-Tiering (automated access pattern shifts)</span>, <span className="s3-hl-purple">Glacier Instant Retrieval (archives accessed in milliseconds)</span>, <span className="s3-hl-purple">Glacier Flexible Retrieval (archives accessed in 1-5 hours)</span>, and <span className="s3-hl-purple">Glacier Deep Archive (hyper-cheap archives accessed in 12 hours)</span>. Which means you can optimize hosting costs by matching access patterns to hardware tiers, keeping active files on high-performance hot disks and shifting older, rarely-accessed datasets to archival tapes for up to a 90%+ cost reduction.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Automated Lifecycle Transitions
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  An <strong><span className="s3-hl-purple">S3 Lifecycle Policy (automated storage tier rules)</span></strong> is a set of XML rules that automates storage tier migrations (<i>Transition Actions</i>) or object purges (<i>Expiration Actions</i>) based on the age of the file.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #a855f7' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a855f7', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-purple">S3 Lifecycle Policies</span></strong> containing <span className="s3-hl-purple">Transition Actions (automatic migration to colder storage tiers)</span> and <span className="s3-hl-purple">Expiration Actions (automatic file deletion rules)</span>. Which means you can define XML rules that automatically shift objects to colder classes or permanently delete them after a certain number of days, automating cold-tier optimization without any manual scripts or operational overhead.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Glacier Vault Locks (WORM Vaults)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  A <strong><span className="s3-hl-purple">Glacier Vault Lock (immutable archive policy)</span></strong> is an immutable resource policy attached directly to a Glacier vault that enforces unalterable, regulatory compliance locks.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #a855f7' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#a855f7', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-purple">S3 Glacier Vault Lock (write-once immutable regulatory lock)</span></strong> as an immutable, write-once policy attached directly to a Glacier vault. Which means once a vault lock policy is committed and locked, the policy becomes unchangeable and un-deletable, ensuring absolute legal compliance for long-term records preservation.
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
                  A <strong><span className="s3-hl-cyan">Gateway VPC Endpoint (private route-table S3 route)</span></strong> is a highly available, logical routing destination established inside a Virtual Private Cloud subnet that connects resources directly to regional S3 services.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #06b6d4' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#06b6d4', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-cyan">Gateway VPC Endpoints (private routing connection interfaces)</span></strong> for S3 as a highly available, routing-table destination inside your Virtual Private Cloud. Which means private virtual machines (like EC2) can establish secure connections directly to S3 endpoints over AWS's private high-speed network backplane, bypassing the public internet and avoiding expensive NAT Gateway transit charges.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Prefix Lists &amp; Route Table Priorities
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  A <strong><span className="s3-hl-cyan">S3 Prefix List (regional S3 IP blocks set)</span></strong> is a regional, AWS-managed set of public S3 IP address blocks (e.g. <code>pl-63a5400a</code>) used to simplify and prioritize routing rules inside VPC route tables.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #06b6d4' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#06b6d4', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers regional <strong><span className="s3-hl-cyan">S3 Prefix Lists (AWS-managed IP routing filters)</span></strong> (like <code>pl-63a5400a</code>) for network routing configuration. Which means your subnet route tables automatically prioritize S3-destined traffic through the private Gateway Endpoint interface over default internet gateway routes, ensuring seamless, secure private transit without modifying server OS code.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Access Points
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  An <strong><span className="s3-hl-cyan">S3 Access Point (isolated directory routing endpoints)</span></strong> is an additional, named network endpoint with hostnames scoped specifically for a single directory or bucket path, each enforcing its own customized access rules.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #06b6d4' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#06b6d4', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-cyan">S3 Access Points (dedicated hostnames for isolated subpaths)</span></strong> as dedicated, named network endpoints attached to S3 buckets. Which means you can partition shared enterprise buckets into isolated directory-level routes (e.g. <code>/accounting</code> vs <code>/marketing</code>), each with its own focused access control policy to prevent a single bucket policy from growing too complex or hitting size limits.
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
                  <strong><span className="s3-hl-cyan">Transfer Acceleration (geo-optimized edge ingestion upload-booster)</span></strong> is a geographic upload-optimization feature that routes your file uploads through the globally distributed Amazon CloudFront Edge network.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #3b82f6' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3b82f6', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-cyan">S3 Transfer Acceleration (global CloudFront edge ingestion)</span></strong> utilizing the globally distributed Amazon CloudFront Edge Location network. Which means upload packets are ingested at the nearest geographic edge location and routed over AWS's private high-speed fiber backbone to the target bucket, reducing latency and boosting upload speeds by up to 300% for international clients.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Replication (SRR &amp; CRR)
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-cyan">S3 Replication (asynchronous copy engine)</span></strong> is a bucket-level feature that executes automated, asynchronous copy tasks of newly uploaded files to separate destination buckets in the same region (<i>Same-Region Replication / SRR</i>) or different regions (<i>Cross-Region Replication / CRR</i>).
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #3b82f6' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3b82f6', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <span className="s3-hl-cyan">Same-Region Replication (SRR - standby copies in the same region)</span> and <span className="s3-hl-cyan">Cross-Region Replication (CRR - geo-standby/residency compliance copies)</span> as automated asynchronous copy engines. Which means S3 instantly replicates uploaded objects to separate destination buckets in either the same region (for standby disaster recovery) or a different country (to comply with data residency laws or minimize latency for remote users).
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Presigned URLs
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  A <strong><span className="s3-hl-cyan">Presigned URL (temporary cryptographically-signed link)</span></strong> is a secure, temporary web link generated with embedded credentials that grants limited read or write access to specific S3 object paths for a designated timeframe.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #3b82f6' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#3b82f6', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers temporal <strong><span className="s3-hl-cyan">S3 Presigned URLs (temporal cryptographically-signed credentials)</span></strong> cryptographically signed by an application server's IAM credentials. Which means clients can directly upload to or download from designated bucket paths for a limited time without possessing AWS credentials, keeping the bucket secure and avoiding app server bandwidth bottlenecks.
                  </div>
                </div>
              </div>

            </div>

            {/* 🎨 Transfer Acceleration SVG Diagram */}
            <div className="s3-sec">Standard Routing vs. S3 Transfer Acceleration Route Map</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                Note how Transfer Acceleration redirects packets onto AWS's private high-speed global fiber lines at the closest Edge Location.
              </div>
              <svg viewBox="0 0 700 180" width="100%" style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                {/* Tokyo Upload Terminal */}
                <rect x="20" y="45" width="110" height="90" rx="6" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" strokeWidth="1" />
                <text x="75" y="70" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">Client in Tokyo</text>
                <text x="75" y="85" textAnchor="middle" fontSize="8" fill="var(--color-text-secondary)">Uploading file.mp4</text>
                <rect x="35" y="98" width="80" height="20" rx="3" fill="#eff6ff" stroke="#bfdbfe" strokeWidth="0.8" />
                <text x="75" y="111" textAnchor="middle" fontSize="8" fill="#1e40af" fontWeight="bold">💻 Tokyo Terminal</text>

                {/* Route A: Public congested internet */}
                <path d="M130,70 L280,30 L450,30 L550,45" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2" />
                <text x="310" y="24" fontSize="7.5" fill="#ef4444" fontWeight="bold">Congested Public Web: Tokyo ➔ Virginia (14+ slow network hops)</text>

                {/* Route B: S3 Transfer Acceleration */}
                <path d="M130,110 L220,110" fill="none" stroke="#10b981" strokeWidth="2.5" />
                <text x="175" y="102" textAnchor="middle" fontSize="7" fill="#047857" fontWeight="bold">Fast Edge Hop</text>

                {/* Tokyo CloudFront Edge Location */}
                <rect x="220" y="85" width="120" height="50" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                <text x="280" y="102" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#065f46">Tokyo Edge Location</text>
                <text x="280" y="115" textAnchor="middle" fontSize="7.5" fill="#047857">(S3 Acceleration Host)</text>

                {/* Secure AWS Backbone */}
                <path d="M340,110 L550,110" fill="none" stroke="#10b981" strokeWidth="2.5" />
                <text x="445" y="123" textAnchor="middle" fontSize="7.5" fill="#065f46" fontWeight="bold">⚡ AWS Private Fiber Backbone Transit (Ultra-Fast)</text>

                {/* S3 US-East-1 Bucket */}
                <rect x="550" y="45" width="130" height="90" rx="6" fill="#f0fdf4" stroke="#166534" strokeWidth="1.5" />
                <text x="615" y="70" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#166534">Target S3 Bucket</text>
                <text x="615" y="85" textAnchor="middle" fontSize="8.5" fill="#166534" fontWeight="bold">🇺🇸 Virginia Region</text>
                <text x="615" y="100" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">us-east-1 partition</text>
              </svg>
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
                  An <strong><span className="s3-hl-pink">S3 Event Notification (serverless real-time event alerts)</span></strong> is an asynchronous event trigger configured on a bucket to automatically publish standard alert messages to SNS, SQS, or Lambda when write/delete operations occur.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #ec4899' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ec4899', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers asynchronous <strong><span className="s3-hl-pink">S3 Event Notifications (serverless event publishers)</span></strong> integrated with Amazon SNS, SQS, and AWS Lambda. Which means your systems can react instantly the millisecond a file is uploaded or deleted (e.g., resizing an image or updating a database), building responsive serverless workflows instead of wasting resource cycles polling folders.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Batch Operations
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-pink">S3 Batch Operations (large-scale parallel bulk administrator)</span></strong> is an enterprise-scale bulk object management service that automates administrative tasks across billions of objects in parallel using an input CSV/inventory catalog.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #ec4899' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ec4899', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-pink">S3 Batch Operations (fully-managed bulk object processor)</span></strong> as a fully managed large-scale bulk object management service. Which means you can execute administrative actions (like modifying tags, replacing object locks, or copying files) in parallel across billions of objects using a simple CSV manifest, eliminating the need to write, host, and debug custom migration scripts.
                  </div>
                </div>
              </div>

              <div className="s3-edu-card-new">
                <span className="s3-pill-badge s3-pill-why">📖 Term Definitions</span>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  S3 Storage Lens Analytics
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '10px' }}>
                  <strong><span className="s3-hl-pink">S3 Storage Lens Analytics (centralized structural health analytics)</span></strong> is a centralized operational and analytical dashboard that scans organization-wide bucket metadata daily, providing unified metrics and recommendations.
                </div>
                <div style={{ padding: '10px', borderRadius: '6px', background: 'var(--color-background-secondary)', borderLeft: '3px solid #ec4899' }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ec4899', marginBottom: '4px' }}>
                    💡 AWS Offers &amp; What It Means
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: '1.45' }}>
                    AWS offers <strong><span className="s3-hl-pink">S3 Storage Lens (organization-wide multi-account storage metrics)</span></strong> as an organization-wide storage monitoring and optimization service. Which means you get centralized, multi-account dashboards that scan metadata globally, automatically identifying security vulnerabilities (like unencrypted buckets) and outlining actionable cost-saving opportunities (like orphaned delete markers).
                  </div>
                </div>
              </div>

            </div>

            {/* 🎨 Architectural SVG */}
            <div className="s3-sec">Decoupled Serverless S3 Event Notification Pipeline</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                How S3 directly triggers serverless compute actions when new files are written, bypassing active poll scripts.
              </div>
              <svg viewBox="0 0 700 180" width="100%" style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                {/* Client upload */}
                <rect x="25" y="45" width="120" height="90" rx="6" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" strokeWidth="1" />
                <text x="85" y="70" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="var(--color-text-primary)">Client Application</text>
                <text x="85" y="85" textAnchor="middle" fontSize="8" fill="#1d4ed8" fontWeight="bold">💻 PUT logo.png</text>
                <text x="85" y="100" textAnchor="middle" fontSize="7.5" fill="var(--color-text-secondary)">directly to bucket</text>

                <path d="M145,90 L200,90" stroke="#94a3b8" strokeWidth="1.5" />

                {/* S3 Bucket Trigger */}
                <rect x="200" y="45" width="130" height="90" rx="6" fill="#f0fdf4" stroke="#166534" strokeWidth="1.5" />
                <text x="265" y="70" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#166534">S3 Storage Bucket</text>
                <text x="265" y="85" textAnchor="middle" fontSize="8" fill="#15803d">Publishes event alert</text>
                <rect x="215" y="98" width="100" height="20" rx="3" fill="#e8f5e9" stroke="#81c784" strokeWidth="0.8" />
                <text x="265" y="111" textAnchor="middle" fontSize="8" fill="#1b5e20" fontWeight="bold">ObjectCreated:Put</text>

                <path d="M330,90 L380,90" stroke="#94a3b8" strokeWidth="1.5" />

                {/* Event Queue Topic */}
                <rect x="380" y="45" width="120" height="90" rx="6" fill="#fffbeb" stroke="#d97706" strokeWidth="1" />
                <text x="440" y="70" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#b45309">SQS Queue / SNS</text>
                <text x="440" y="85" textAnchor="middle" fontSize="8" fill="#d97706">Decouples alerts</text>
                <rect x="395" y="98" width="90" height="20" rx="3" fill="#fffde7" stroke="#fbc02d" strokeWidth="0.8" />
                <text x="440" y="111" textAnchor="middle" fontSize="7.5" fill="#f57f17" fontWeight="bold">📥 Buffer message</text>

                <path d="M500,90 L550,90" stroke="#94a3b8" strokeWidth="1.5" />

                {/* Serverless compute */}
                <rect x="550" y="45" width="130" height="90" rx="6" fill="#faf5ff" stroke="#a855f7" strokeWidth="1.5" />
                <text x="615" y="70" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#6b21a8">AWS Lambda</text>
                <text x="615" y="85" textAnchor="middle" fontSize="8" fill="#a855f7">Serverless script runs</text>
                <rect x="560" y="98" width="110" height="20" rx="3" fill="#f3e5f5" stroke="#ba68c8" strokeWidth="0.8" />
                <text x="615" y="111" textAnchor="middle" fontSize="7.5" fill="#4a148c" fontWeight="bold">⚡ Resize image now</text>
              </svg>
            </div>

            {/* 🎨 Storage Lens & Batch Jobs Pipeline SVG Diagram */}
            <div className="s3-sec">S3 Storage Lens Analytics and S3 Batch Jobs Pipeline</div>
            <div className="s3-card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '8px' }}>
                How Storage Lens monitors the organization, exports secure CSV manifests of insecure buckets, and feeds them into automated S3 Batch Jobs for bulk parallel remediation.
              </div>
              <svg viewBox="0 0 700 180" width="100%" style={{ background: 'var(--color-background-secondary)', borderRadius: '6px', border: '0.5px solid var(--color-border-secondary)' }}>
                {/* Storage Lens scanner */}
                <rect x="25" y="45" width="140" height="90" rx="6" fill="#fdf2f8" stroke="#ec4899" strokeWidth="1.5" />
                <text x="95" y="70" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#be185d">📊 Storage Lens</text>
                <text x="95" y="85" textAnchor="middle" fontSize="8" fill="#db2777">Audits 1000+ buckets</text>
                <text x="95" y="98" textAnchor="middle" fontSize="8" fill="#be185d" fontWeight="bold">Scans: Unencrypted</text>
                <rect x="35" y="108" width="120" height="18" rx="3" fill="#fbcfe8" stroke="#f472b6" strokeWidth="0.8" />
                <text x="95" y="120" textAnchor="middle" fontSize="7.5" fill="#9d174d" fontWeight="bold">Generates CSV Manifest</text>

                <path d="M165,90 L220,90" stroke="#ec4899" strokeWidth="1.5" />

                {/* CSV Manifest Output */}
                <rect x="220" y="65" width="100" height="50" rx="4" fill="var(--color-background-primary)" stroke="var(--color-border-tertiary)" strokeWidth="1" />
                <text x="270" y="85" textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--color-text-primary)">manifest.csv</text>
                <text x="270" y="98" textAnchor="middle" fontSize="7" fill="var(--color-text-secondary)">List of target files</text>

                <path d="M320,90 L380,90" stroke="#94a3b8" strokeWidth="1.5" />

                {/* S3 Batch Jobs */}
                <rect x="380" y="45" width="140" height="90" rx="6" fill="#f0fdf4" stroke="#166534" strokeWidth="1.5" />
                <text x="450" y="70" textAnchor="middle" fontSize="10.5" fontWeight="bold" fill="#15803d">⚙️ S3 Batch Jobs</text>
                <text x="450" y="85" textAnchor="middle" fontSize="8" fill="#1b5e20">Spawns parallel tasks</text>
                <text x="450" y="98" textAnchor="middle" fontSize="8" fill="#166534" fontWeight="bold">Bulk Remediations</text>
                <rect x="390" y="108" width="120" height="18" rx="3" fill="#bbf7d0" stroke="#86efac" strokeWidth="0.8" />
                <text x="450" y="120" textAnchor="middle" fontSize="7" fill="#14532d" fontWeight="bold">Applies Encryption tags</text>

                <path d="M520,90 L570,90" stroke="#94a3b8" strokeWidth="1.5" />

                {/* Restored Buckets */}
                <rect x="570" y="45" width="110" height="90" rx="6" fill="#eff6ff" stroke="#2563eb" strokeWidth="1" />
                <text x="625" y="75" textAnchor="middle" fontSize="9.5" fontWeight="bold" fill="#1e40af">Secure Buckets</text>
                <text x="625" y="90" textAnchor="middle" fontSize="8" fill="#1d4ed8">100% encrypted</text>
                <text x="625" y="105" textAnchor="middle" fontSize="7.5" fill="#166534" fontWeight="bold">Remediated! ✅</text>
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
