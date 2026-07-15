export interface StorageClassDetail {
  name: string;
  durability: string;
  availability: string;
  minDuration: string;
  minSize: string;
  retrievalFee: string;
  storageCost: number; // per GB/month
  icon: string;
  desc: string;
}

export interface TermDefinition {
  title: string;
  pillText: string;
  pillType: 'why' | 'how' | 'benefits';
  hlClass: string;
  body: string;
}

export interface NotebookNote {
  id: string;
  category: string;
  title: string;
  heroBadge: string;
  desc: string;
  takeaway: string;
  cliTitle: string;
  cliCommands: string;
  cliCopyId: string;
  termDefinitions: TermDefinition[];
}

export interface CloudStorageProvider {
  id: 'aws' | 'azure' | 'gcp';
  name: string;
  serviceName: string;
  containerName: string;
  objectName: string;
  accessControlName: string;
  durabilityInfo: string;
  eventsLabel: string;
  lambdaLabel: string;
  kmsLabel: string;
  theme: {
    primaryColor: string;
    gradientStart: string;
    gradientEnd: string;
    darkGradientStart: string;
    darkGradientEnd: string;
    flowColorClass: string;
    glowFilter: string;
    badgeColorClass: string;
    btnActiveBg: string;
    btnActiveBorder: string;
  };
  storageClasses: Record<string, StorageClassDetail>;
  policyTemplates: Record<'public' | 'https' | 'vpce', string>;
  notebookNotes: Record<string, NotebookNote>;
}

export const cloudProviders: Record<'aws' | 'azure' | 'gcp', CloudStorageProvider> = {
  aws: {
    id: 'aws',
    name: 'AWS S3',
    serviceName: 'S3',
    containerName: 'Bucket',
    objectName: 'Object',
    accessControlName: 'IAM Policies',
    durabilityInfo: '99.999999999% (11 9s) durability SLA',
    eventsLabel: 'S3 Event Notifications',
    lambdaLabel: 'Lambda',
    kmsLabel: 'KMS Encryption',
    theme: {
      primaryColor: '#FF9900',
      gradientStart: '#fff7ed',
      gradientEnd: '#ffedd5',
      darkGradientStart: 'rgba(15, 23, 42, 0.85)',
      darkGradientEnd: 'rgba(249, 115, 22, 0.15)',
      flowColorClass: 's3-flow-orange',
      glowFilter: 'glow-orange',
      badgeColorClass: 's3-pill-why',
      btnActiveBg: 'linear-gradient(135deg, #FF9900 0%, #E07B00 100%)',
      btnActiveBorder: '#E07B00'
    },
    storageClasses: {
      standard: {
        name: 'S3 Standard',
        durability: '99.999999999% (eleven 9s)',
        availability: '99.99%',
        minDuration: 'None',
        minSize: 'None',
        retrievalFee: 'None',
        storageCost: 0.023,
        icon: '🚀',
        desc: 'General purpose storage for active, frequently accessed data. Highly resilient, replicated across >=3 physically isolated Availability Zones (AZs) in a region. Replicates data synchronously. Supports high-throughput & low-latency workloads.'
      },
      ia: {
        name: 'S3 Standard-IA',
        durability: '99.999999999% (eleven 9s)',
        availability: '99.9%',
        minDuration: '30 Days (prorated)',
        minSize: '128 KB (minimum billing size)',
        retrievalFee: '$0.01 per GB retrieved',
        storageCost: 0.0125,
        icon: '❄️',
        desc: 'Infrequently accessed data that needs millisecond active access. Optimized for long-lived, less active data. Replicated across >=3 AZs. Minimum object size for billing is 128 KB, and minimum storage duration is 30 days.'
      },
      onezone: {
        name: 'S3 One Zone-IA',
        durability: '99.999999999% (eleven 9s) in 1 AZ',
        availability: '99.5%',
        minDuration: '30 Days (prorated)',
        minSize: '128 KB (minimum billing size)',
        retrievalFee: '$0.01 per GB retrieved',
        storageCost: 0.01,
        icon: '⚡',
        desc: 'Infrequent, non-critical recreatable data (e.g. secondary backups, transcoded media). Stored in a single AZ, reducing cost by 20% compared to Standard-IA. Data is lost if the single hosting AZ is destroyed.'
      },
      intelligent: {
        name: 'S3 Intelligent-Tiering',
        durability: '99.999999999% (eleven 9s)',
        availability: '99.9%',
        minDuration: 'None',
        minSize: 'None (no min size for billing, but objects <128KB stay in Frequent Access)',
        retrievalFee: 'None',
        storageCost: 0.023,
        icon: '🧠',
        desc: 'Automatically shifts data between Frequent, Infrequent, Archive Instant Access, Archive, and Deep Archive tiers based on access patterns. Charges a flat $0.0025 per 1,000 objects (>=128KB) monitoring/automation fee monthly. No retrieval fees.'
      },
      glacier_ir: {
        name: 'S3 Glacier Instant Retrieval',
        durability: '99.999999999% (eleven 9s)',
        availability: '99.9%',
        minDuration: '90 Days (prorated)',
        minSize: '128 KB (minimum billing size)',
        retrievalFee: '$0.03 per GB retrieved',
        storageCost: 0.004,
        icon: '🧊',
        desc: 'Archive data that is accessed rarely (e.g. quarterly) but requires immediate, millisecond-level access when requested. Replicated across >=3 AZs. Highly cost-effective for cold data with instant retrieval needs.'
      },
      glacier_fr: {
        name: 'S3 Glacier Flexible Retrieval',
        durability: '99.999999999% (eleven 9s)',
        availability: '99.99% (offline)',
        minDuration: '90 Days (prorated)',
        minSize: 'None',
        retrievalFee: '$0.01 per GB retrieved (standard)',
        storageCost: 0.0036,
        icon: '📦',
        desc: 'Archival data. Retrievals are offline and require rehydration: Expedited (1-5 minutes, higher cost), Standard (3-5 hours), or Free Bulk (5-12 hours). Replicated across >=3 AZs. Perfect for tape replacement.'
      },
      glacier_deep: {
        name: 'S3 Glacier Deep Archive',
        durability: '99.999999999% (eleven 9s)',
        availability: '99.99% (offline)',
        minDuration: '180 Days (prorated)',
        minSize: 'None',
        retrievalFee: '$0.007 per GB retrieved (standard)',
        storageCost: 0.00099,
        icon: '🕳️',
        desc: "AWS's lowest-cost storage class. Long-term secure digital preservation (e.g., 7-10 year compliance records). Retrievals are offline: Standard rehydration takes 12 hours, while Bulk takes up to 48 hours."
      }
    },
    policyTemplates: {
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
    },
    notebookNotes: {
      s3_namespace: {
        id: 's3_namespace',
        category: 's3_fundamentals',
        title: 'Bucket Namespaces, Static Hosting & CORS',
        heroBadge: 'S3 Namespaces & CORS',
        desc: 'Amazon S3 is a flat key-value store rather than a traditional hierarchical operating system directory tree. Folders are only simulated using key prefix paths. S3 supports a baseline rate of 3,500 PUT/LIST and 5,500 GET/HEAD requests per second per prefix. Scale S3 performance by partitioning keys with distinct prefixes.',
        takeaway: '💡 S3 is a flat key-value store. Folders are simulated through logical prefixes, allowing S3 to scale infinitely. Design key prefixes strategically to maximize request throughput.',
        cliTitle: 'CLI COMMANDS — CREATE BUCKET & CORS',
        cliCommands: `# Create an S3 Bucket in a specific region\naws s3api create-bucket --bucket my-premium-bucket --region us-east-1\n\n# Configure CORS (Cross-Origin Resource Sharing)\naws s3api put-bucket-cors --bucket my-premium-bucket --cors-configuration '{\n  "CORSRules": [\n    {\n      "AllowedOrigins": ["https://domain-a.com"],\n      "AllowedMethods": ["GET"],\n      "AllowedHeaders": ["*"],\n      "MaxAgeSeconds": 3000\n    }\n  ]\n}'`,
        cliCopyId: 's3_namespace_cli',
        termDefinitions: [
          {
            title: 'S3 Buckets, Objects & Prefixes',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'A Bucket is a globally unique storage namespace. An Object is the stored entity consisting of data (the payload) and metadata (key-value properties). A Prefix is a logical string delimiter (e.g. logs/) used to partition keys and scale high-throughput request rates.'
          },
          {
            title: 'Static Website Hosting',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'Static Website Hosting configures an S3 bucket to serve static assets (HTML, CSS, JS) directly via a regional HTTP endpoint. This eliminates server management and scales automatically to massive traffic.'
          },
          {
            title: 'CORS & Requester Pays',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'CORS (Cross-Origin Resource Sharing) is a browser security mechanism that allows web apps loaded in other domains to read S3 object data. Requester Pays shifts all data egress transfer fees to the requesting AWS account.'
          }
        ]
      },
      s3_security: {
        id: 's3_security',
        category: 's3_fundamentals',
        title: 'Identity Policies, Resource Policies & BPA',
        heroBadge: 'S3 Access Controls',
        desc: 'S3 access control evaluates organization-level Service Control Policies (SCPs), resource-level Bucket Policies, identity-level IAM Policies, and Block Public Access (BPA) master overrides. S3 processes all active configurations simultaneously, prioritizing explicit denials. S3 Block Public Access serves as a centralized account/bucket firewall to block anonymous access.',
        takeaway: '💡 S3 authorization defaults to deny. Any explicit deny overrides all allows. Block Public Access (BPA) functions as a central master switch to reject all public access permissions immediately, regardless of bucket policies.',
        cliTitle: 'CLI COMMANDS — BUCKET POLICY & BPA',
        cliCommands: `# Apply a resource-based Bucket Policy\naws s3api put-bucket-policy --bucket my-premium-bucket --policy '{\n  "Version": "2012-10-17",\n  "Statement": [\n    {\n      "Sid": "RestrictAccessToSpecificVPCEndpoint",\n      "Effect": "Deny",\n      "Principal": "*",\n      "Action": "s3:*",\n      "Resource": [\n        "arn:aws:s3:::my-premium-bucket",\n        "arn:aws:s3:::my-premium-bucket/*"\n      ],\n      "Condition": {\n        "StringNotEquals": {\n          "aws:sourceVpce": "vpce-0d8fa928bcde1a38"\n        }\n      }\n    }\n  ]\n}'\n\n# Configure Block Public Access (BPA) overrides\naws s3api put-public-access-block --bucket my-premium-bucket --public-access-block-configuration '{\n  "BlockPublicAcls": true,\n  "IgnorePublicAcls": true,\n  "BlockPublicPolicy": true,\n  "RestrictPublicBuckets": true\n}'`,
        cliCopyId: 's3_security_cli',
        termDefinitions: [
          {
            title: 'IAM Policies vs Resource Policies',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-orange',
            body: 'An IAM Policy is attached to identities (users/groups/roles) within an account. A Resource Policy (Bucket Policy) is attached directly to the S3 bucket itself, enabling cross-account access delegation or specific IP/endpoint restrictions.'
          },
          {
            title: 'S3 Policy Conditions',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-orange',
            body: 'Policy Conditions define optional logical parameters (like aws:sourceVpce or aws:SourceIp) that restrict API calls to specific source virtual network endpoints, corporate IP subnets, or secure TLS configurations.'
          },
          {
            title: 'Block Public Access Override (BPA)',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-orange',
            body: 'Block Public Access (BPA) is a bucket and account-level safety firewall. It prevents anyone from granting public access via ACLs or bucket policies, overriding existing permissive rules to prevent data leaks.'
          }
        ]
      },
      s3_encryption: {
        id: 's3_encryption',
        category: 's3_fundamentals',
        title: 'SSE Models, KMS API Quotas & S3 Bucket Keys',
        heroBadge: 'S3 Encryption',
        desc: 'S3 manages data encryption at rest transparently at the physical storage layer. While SSE-S3 uses AWS-managed keys at zero cost, SSE-KMS uses customer-managed keys (CMK) which support granular key policies and automatic rotation. In high-throughput workloads, KMS API call quotas can throttle requests; use S3 Bucket Keys to cache KMS cryptographic keys and reduce costs by up to 99%.',
        takeaway: '💡 Enable S3 Bucket Keys when using SSE-KMS in high-frequency read/write environments to prevent KMS:ThrottlingException errors and reduce KMS key-wrapping billing expenses by up to 99%.',
        cliTitle: 'CLI COMMANDS — SSE-KMS & S3 BUCKET KEY',
        cliCommands: `# Configure default encryption with SSE-KMS and S3 Bucket Keys\naws s3api put-bucket-encryption --bucket my-premium-bucket --server-side-encryption-configuration '{\n  "Rules": [\n    {\n      "ApplyServerSideEncryptionByDefault": {\n        "SSEAlgorithm": "aws:kms",\n        "KMSMasterKeyId": "arn:aws:kms:us-east-1:123456789012:key/your-custom-key-id"\n      },\n      "BucketKeyEnabled": true\n    }\n  ]\n}'\n\n# Upload an object explicitly specifying SSE-KMS\naws s3 cp document.pdf s3://my-premium-bucket/secure-docs/ --sse aws:kms --sse-kms-key-id arn:aws:kms:us-east-1:123456789012:key/your-custom-key-id`,
        cliCopyId: 's3_encryption_cli',
        termDefinitions: [
          {
            title: 'Server-Side Encryption Models (SSE)',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-green',
            body: 'SSE options include SSE-S3 (AWS-managed keys, AES-256), SSE-KMS (KMS-managed CMKs, allows audit trails and key rotation), SSE-C (customer-provided raw keys, customer manages key lifecycle), and DSSE-KMS (dual-layer independent KMS keys).'
          },
          {
            title: 'KMS Envelope Encryption & API Quotas',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-green',
            body: 'Envelope Encryption encrypts data with a local Data Encryption Key (DEK), which is itself encrypted using a Key Encryption Key (KEK) in KMS. High transit triggers KMS API limits, potentially throttling requests.'
          },
          {
            title: 'S3 Bucket Keys & Cache',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-green',
            body: 'S3 Bucket Keys create a temporary cache of the KMS-derived key at the S3 bucket layer. Rather than calling KMS API for every single object read/write, S3 uses the cached key, drastically reducing KMS transactional costs.'
          }
        ]
      },
      s3_versioning: {
        id: 's3_versioning',
        category: 's3_data_management',
        title: 'Version Stacks, Delete Markers & WORM Object Lock',
        heroBadge: 'S3 Versioning',
        desc: 'S3 Object Versioning protects against accidental file deletion or replacement by preserving historical versions in a chronological stack. Direct deletes insert a zero-byte Delete Marker as the current version. Enforce absolute file immutability using S3 Object Lock in WORM compliance mode to prevent deletion of objects even by root users.',
        takeaway: '💡 Enabling versioning creates a stack of versions. Standard deletion only overlays a Delete Marker. To permanently delete, you must specify the exact Version ID. MFA Delete blocks suspension of versioning or permanent deletes without an MFA token.',
        cliTitle: 'CLI COMMANDS — VERSIONING & RESTORES',
        cliCommands: `# Enable versioning on a bucket\naws s3api put-bucket-versioning --bucket my-premium-bucket --versioning-configuration Status=Enabled\n\n# List versions for an object prefix\naws s3api list-object-versions --bucket my-premium-bucket --prefix document.pdf\n\n# Permanently delete standard version by passing version ID\naws s3api delete-object --bucket my-premium-bucket --key document.pdf --version-id qwer1234asdf5678`,
        cliCopyId: 's3_versioning_cli',
        termDefinitions: [
          {
            title: 'S3 Object Versioning & Delete Markers',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'Versioning logs every object state. Standard deletion inserts a Delete Marker. When a client requests the object, S3 returns 404. Deleting the Delete Marker restores the object immediately.'
          },
          {
            title: 'S3 MFA Delete Protection',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'MFA Delete is an extra security layer. It requires a physical hardware MFA token code to disable bucket versioning or permanently delete an object version, preventing malicious administrative purges.'
          },
          {
            title: 'Object Lock & WORM Compliance',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'Object Lock enforces Write Once Read Many (WORM). In Governance mode, authorized accounts can bypass locks. In Compliance mode, the lock is absolute: nobody (including the root account) can delete/overwrite files.'
          }
        ]
      },
      s3_storage: {
        id: 's3_storage',
        category: 's3_data_management',
        title: 'Storage Classes, Lifecycles & Prefix Calculator',
        heroBadge: 'S3 Classes & Lifecycles',
        desc: 'Manage storage costs by matching access patterns with S3 storage classes. Standard is optimized for active files, Standard-IA/One Zone-IA for infrequent access, and Glacier for archival. Lifecycle policies automate transitions or expiration actions based on age, prefix, and noncurrent version counts.',
        takeaway: '💡 Automate tiering with S3 Lifecycle Policies. Configure rules to transition active data to cheaper tiers (like IA or Glacier) after 30/90 days and set incomplete multipart uploads to auto-abort to save storage costs.',
        cliTitle: 'CLI COMMANDS — LIFECYCLE MANAGEMENT',
        cliCommands: `# Configure bucket lifecycle rules for transitioning files\naws s3api put-bucket-lifecycle-configuration --bucket my-premium-bucket --lifecycle-configuration '{\n  "Rules": [\n    {\n      "ID": "MoveToGlacierAndExpire",\n      "Status": "Enabled",\n      "Filter": { "Prefix": "archives/" },\n      "Transitions": [\n        { "Days": 90, "StorageClass": "GLACIER" }\n      ],\n      "Expiration": { "Days": 365 },\n      "AbortIncompleteMultipartUpload": { "DaysAfterInitiation": 7 }\n    }\n  ]\n}'`,
        cliCopyId: 's3_storage_cli',
        termDefinitions: [
          {
            title: 'S3 Storage Classes Specs',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'Storage classes optimize budgets: Standard (hot), IA (infrequent, 30-day min), One Zone-IA (1 AZ, 20% cheaper), Intelligent-Tiering (automatic tiering), Glacier Instant Retrieval (rare access, ms access), Glacier Flexible (1-5 min to 12 hr), and Glacier Deep (12-48 hr).'
          },
          {
            title: 'Automated Lifecycle Policies',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'Lifecycle Policies contain Transition rules (moving objects to colder classes) and Expiration rules (deleting files permanently or removing noncurrent versions), reducing manual cleanup.'
          },
          {
            title: 'Incomplete Multipart Upload Abort',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'Failed or interrupted multipart uploads leave orphaned object parts in the bucket, costing storage fees silently. Set an automated lifecycle rule to abort incomplete uploads after 7 days.'
          }
        ]
      },
      s3_networking: {
        id: 's3_networking',
        category: 's3_advanced',
        title: 'Gateway VPC Endpoints & Direct Routing',
        heroBadge: 'S3 Gateway Endpoints',
        desc: 'Establish secure private connections from your VPC to AWS S3. Gateway VPC Endpoints modify subnet Route Tables to route traffic to S3 using private AWS fiber at zero cost. Interface VPC Endpoints (PrivateLink) assign a private IP to S3 inside the subnet (ideal for on-premise connection via Direct Connect) but charge hourly and per-GB rates.',
        takeaway: '💡 Use Gateway VPC Endpoints to connect internal subnets to S3 privately. Gateway Endpoints are free, highly available, and do not route traffic over public network routes or NAT Gateways.',
        cliTitle: 'CLI COMMANDS — CREATE ENDPOINT & ACCESS',
        cliCommands: `# Create an S3 Gateway VPC Endpoint in a target route table\naws ec2 create-vpc-endpoint --vpc-id vpc-1234567890abcdef0 --service-name com.amazonaws.us-east-1.s3 --route-table-ids rtb-1122334455\n\n# Configure Endpoint Policy to restrict access to a specific bucket\n# (Apply VPC Endpoint Policy JSON via AWS Console or CLI)` ,
        cliCopyId: 's3_networking_cli',
        termDefinitions: [
          {
            title: 'Gateway VPC Endpoints',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'Gateway Endpoints are virtual routing targets added to subnet Route Tables. They route regional S3 traffic directly to AWS service endpoints over private fiber, bypassing NAT Gateways and egress costs.'
          },
          {
            title: 'Interface VPC Endpoints (PrivateLink)',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'Interface Endpoints place an Elastic Network Interface (ENI) with a private IP from your subnet inside the VPC. This enables routing to S3 from on-premise networks via VPN or AWS Direct Connect.'
          },
          {
            title: 'Endpoint Resource Policies',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'VPC Endpoint Policies are IAM policies attached to the endpoint itself. They govern what buckets and actions identities can perform when routing through the endpoint, preventing data exfiltration.'
          }
        ]
      },
      s3_transfer: {
        id: 's3_transfer',
        category: 's3_advanced',
        title: 'Transfer Acceleration, SRR & CRR Replication',
        heroBadge: 'S3 Ingest & Replication',
        desc: 'Optimize global file ingest using S3 Transfer Acceleration, which routes uploads through CloudFront edge servers to AWS private WAN. Replicate data automatically across Regions (CRR) for disaster recovery or within the Same Region (SRR) for isolation using versioning-based asynchronous copying.',
        takeaway: '💡 Transfer Acceleration leverages CloudFront edges to bypass internet routing bottlenecks. Cross-Region Replication (CRR) replicates files to secondary geographic zones to meet compliance and disaster recovery goals.',
        cliTitle: 'CLI COMMANDS — ENABLE REPLICATION & ACCEL',
        cliCommands: `# Enable S3 Transfer Acceleration on a bucket\naws s3api put-bucket-transfer-acceleration --bucket my-premium-bucket --status Enabled\n\n# Verify transfer acceleration status\naws s3api get-bucket-transfer-acceleration --bucket my-premium-bucket`,
        cliCopyId: 's3_transfer_cli',
        termDefinitions: [
          {
            title: 'S3 Transfer Acceleration',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'Routes client upload traffic through the closest Amazon CloudFront Edge Location. The data then travels over AWS\'s private, high-speed backbone network, accelerating long-distance uploads.'
          },
          {
            title: 'Cross-Region Replication (CRR)',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'Asynchronously copies objects across separate AWS geographic regions. Useful for meeting strict disaster recovery standards. Requires versioning enabled on both source and target buckets.'
          },
          {
            title: 'Same-Region Replication (SRR)',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'Asynchronously copies objects to another bucket within the same AWS region. Ideal for copying logs to a central bucket or separating production data into dev/test sandboxes.'
          }
        ]
      },
      s3_operations: {
        id: 's3_operations',
        category: 's3_advanced',
        title: 'Event Notifications, Batch & Storage Lens',
        heroBadge: 'S3 Batch & Automation',
        desc: 'Automate reaction workflows by triggering S3 Event Notifications to Lambda, SQS, or SNS when objects are created or deleted. For managing billions of objects, orchestrate mass administrative actions (like bulk copying, tagging, or locking) using S3 Batch Operations. Monitor organization-wide storage efficiency, activity, and security using Storage Lens.',
        takeaway: '💡 S3 Event Notifications handle real-time individual object events, whereas S3 Batch Operations execute structural edits or migrations on billions of objects asynchronously in parallel.',
        cliTitle: 'CLI COMMANDS — CONFIGURE EVENTS & BATCH',
        cliCommands: `# Configure S3 Event Notification to trigger a Lambda function\naws s3api put-bucket-notification-configuration --bucket my-premium-bucket --notification-configuration file://notify-config.json\n\n# Create a Batch Operations job using CSV manifest\naws s3control create-job --account-id 123456789012 --operation '{"LambdaInvoke": {"FunctionArn": "arn:aws:lambda:us-east-1:123456789012:function:process"}}' --manifest '{"Spec": {"Format": "S3BatchOperations_CSV_20180820"}, "Location": {"ObjectArn": "arn:aws:s3:::manifest-bucket/manifest.csv", "ETag": "abc"}}' --report '{"Bucket": "arn:aws:s3:::report-bucket", "Prefix": "reports", "Format": "Report_CSV_20180820", "Enabled": true}' --role-arn arn:aws:iam::123456789012:role/BatchRole`,
        cliCopyId: 's3_operations_cli',
        termDefinitions: [
          {
            title: 'S3 Event Notifications & EventBridge',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'Event Notifications send payload metadata to message queues, notification topics, or serverless functions when files change. EventBridge integration allows advanced schema matching and cross-account triggers.'
          },
          {
            title: 'S3 Batch Operations',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'Batch Operations coordinates massive admin executions (copying objects, running Lambda logic, applying locks) over billions of storage files. Jobs are defined using CSV or inventory list manifests.'
          },
          {
            title: 'S3 Storage Lens',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'A centralized cloud storage analytics service providing dashboard metrics, cost optimization recommendations, and security best-practice checks across all buckets within an AWS organization.'
          }
        ]
      }
    }
  },
  azure: {
    id: 'azure',
    name: 'Azure Blob Storage',
    serviceName: 'Blob Storage',
    containerName: 'Blob Container',
    objectName: 'Blob',
    accessControlName: 'RBAC & SAS',
    durabilityInfo: '99.999999999% (11 9s) LRS / 16 9s GRS durability',
    eventsLabel: 'Event Grid',
    lambdaLabel: 'Azure Functions',
    kmsLabel: 'Key Vault Encryption',
    theme: {
      primaryColor: '#0078D4',
      gradientStart: '#eff6ff',
      gradientEnd: '#dbeafe',
      darkGradientStart: 'rgba(15, 23, 42, 0.85)',
      darkGradientEnd: 'rgba(0, 120, 212, 0.15)',
      flowColorClass: 's3-flow-blue',
      glowFilter: 'glow-blue',
      badgeColorClass: 's3-pill-why',
      btnActiveBg: 'linear-gradient(135deg, #0078D4 0%, #005A9E 100%)',
      btnActiveBorder: '#005A9E'
    },
    storageClasses: {
      standard: {
        name: 'Hot Tier',
        durability: '99.999999999% (eleven 9s) LRS / up to 16 9s GRS',
        availability: '99.9% (LRS) / 99.99% (RA-GRS)',
        minDuration: 'None',
        minSize: 'None',
        retrievalFee: 'None',
        storageCost: 0.018,
        icon: '🚀',
        desc: 'Optimized for active, frequently read and written data (e.g. databases, active web assets). Offers the lowest access/transaction fees and the highest storage cost. Can be replicated locally (LRS), zonally (ZRS), or geo-redundantly (GRS).'
      },
      ia: {
        name: 'Cool Tier',
        durability: '99.999999999% (eleven 9s) LRS / up to 16 9s GRS',
        availability: '99.0% (LRS) / 99.9% (RA-GRS)',
        minDuration: '30 Days (prorated)',
        minSize: 'None (no minimum file size constraint)',
        retrievalFee: '$0.01 per GB retrieved',
        storageCost: 0.01,
        icon: '❄️',
        desc: 'Optimized for storing infrequently accessed data for at least 30 days (e.g., short-term backups, media assets). Cheaper storage than Hot tier, but has retrieval fees. Offers millisecond access times.'
      },
      onezone: {
        name: 'Cold Tier',
        durability: '99.999999999% (eleven 9s) LRS / up to 16 9s GRS',
        availability: '98.0% (LRS) / 99.0% (RA-GRS)',
        minDuration: '90 Days (prorated)',
        minSize: 'None (no minimum file size constraint)',
        retrievalFee: '$0.03 per GB retrieved',
        storageCost: 0.0036,
        icon: '⚡',
        desc: "Azure's storage tier for very infrequently accessed data (minimum 90 days), such as long-term backups. Cheaper storage rate than Cool tier but has higher retrieval fees. Retains millisecond active access."
      },
      intelligent: {
        name: 'Access Tiering',
        durability: '99.999999999% (eleven 9s) LRS',
        availability: '99.9%',
        minDuration: 'None',
        minSize: 'None',
        retrievalFee: 'None (transaction cost applies)',
        storageCost: 0.018,
        icon: '🧠',
        desc: 'Automates cost optimization by using Azure Blob Lifecycle Management rules to transition blobs between Hot, Cool, Cold, and Archive tiers based on last modified times, creation times, or last access times (if enabled).'
      },
      glacier_ir: {
        name: 'Cool Tier',
        durability: '99.999999999% (eleven 9s) LRS',
        availability: '99.0%',
        minDuration: '30/90 Days',
        minSize: 'None',
        retrievalFee: '$0.01 - $0.03 per GB',
        storageCost: 0.01,
        icon: '🧊',
        desc: "Cool tier storage configuration utilized for instant retrieval access. Serves as Azure's direct equivalent to S3 Glacier Instant Retrieval, providing millisecond retrieval speed without offline delay."
      },
      glacier_fr: {
        name: 'Archive Tier',
        durability: '99.999999999% (eleven 9s) LRS / up to 16 9s GRS',
        availability: 'Offline (requires rehydration)',
        minDuration: '180 Days (prorated)',
        minSize: 'None',
        retrievalFee: '$0.02 per GB retrieved',
        storageCost: 0.00099,
        icon: '📦',
        desc: 'Ultra-low-cost offline archival storage for data that can tolerate retrieval times. To read a blob, it must be rehydrated to Hot/Cool. Standard priority rehydration takes between 1 and 15 hours.'
      },
      glacier_deep: {
        name: 'Archive Tier',
        durability: '99.999999999% (eleven 9s) LRS / up to 16 9s GRS',
        availability: 'Offline (requires rehydration)',
        minDuration: '180 Days (prorated)',
        minSize: 'None',
        retrievalFee: '$0.02 per GB retrieved',
        storageCost: 0.00099,
        icon: '🕳️',
        desc: 'Offline preservation. High priority rehydration retrieves data under 1 hour for block blobs (up to 256MB). Highly suitable for emergency archival restores.'
      }
    },
    policyTemplates: {
      public: `{
  "properties": {
    "publicAccess": "Blob"
  }
}`,
      https: `{
  "properties": {
    "supportsHttpsTrafficOnly": true
  }
}`,
      vpce: `{
  "properties": {
    "networkAcls": {
      "defaultAction": "Deny",
      "virtualNetworkRules": [
        {
          "id": "/subscriptions/sub-id/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/mypremiumstorage"
        }
      ]
    }
  }
}`
    },
    notebookNotes: {
      s3_namespace: {
        id: 's3_namespace',
        category: 's3_fundamentals',
        title: 'Storage Account Namespaces & Container CORS',
        heroBadge: 'Blob Namespaces & CORS',
        desc: "Azure Blob Storage organizes files within a storage account containing Blob Containers. The endpoint leverages standard DNS hostnames (https://<account>.blob.core.windows.net/<container>). Storage Accounts support huge scalability, with ingress limits up to 20 Gbps (expandable) and dynamic flat partition keys that support high transaction volumes.",
        takeaway: '💡 Azure Blob Storage utilizes storage account namespaces to scope containers. Blobs are flat files indexed via virtual prefix paths, with accounts scaling request rates dynamically.',
        cliTitle: 'AZURE CLI COMMANDS — CREATE CONTAINER & CORS',
        cliCommands: `# Create an Azure Storage Account and Blob Container\naz storage container create --name my-premium-container --account-name mypremiumstorage --auth-mode login\n\n# Configure CORS (Cross-Origin Resource Sharing) for Blobs\naz storage cors add --methods GET --origins "https://domain-a.com" --services b --account-name mypremiumstorage --max-age 3000`,
        cliCopyId: 'azure_namespace_cli',
        termDefinitions: [
          {
            title: 'Storage Account, Containers & Blobs',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'A Storage Account is a globally unique DNS namespace. A Blob Container groups a set of blobs, similar to a bucket. A Blob is the file stored (Block Blob for files, Page Blob for VHD disk files, Append Blob for logs).'
          },
          {
            title: 'Access Tiers & Static Web Hosting',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'Static Website Hosting allows serving static assets from a special container named $web. Access Tiers (Hot, Cool, Cold, Archive) allow you to optimize storage costs.'
          },
          {
            title: 'CORS & SAS Signature Delegation',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'CORS allows cross-origin resource access. Shared Access Signatures (SAS) delegate granular, temporary access rights to client requests without exposing primary storage access keys.'
          }
        ]
      },
      s3_security: {
        id: 's3_security',
        category: 's3_fundamentals',
        title: 'Azure RBAC, SAS Policies & Storage Firewalls',
        heroBadge: 'Blob Access Controls',
        desc: 'Azure secures storage containers using Microsoft Entra ID Role-Based Access Control (RBAC), Shared Access Signatures (SAS), and Storage Network Firewalls. Access is evaluated to enforce security limits at the subnet level. SAS tokens can be restricted by IP and protocol, and generated via Stored Access Policies for easy revocation.',
        takeaway: '💡 Entra ID RBAC is preferred for administrative security. Use Shared Access Signatures (SAS) generated under Stored Access Policies to delegate client-level read/write permissions securely and revoke them instantly.',
        cliTitle: 'AZURE CLI COMMANDS — RBAC & FIREWALLS',
        cliCommands: `# Assign Storage Blob Data Reader RBAC role to a user\naz role assignment create --role "Storage Blob Data Reader" --assignee "user@domain.com" --scope "/subscriptions/sub-id/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/mypremiumstorage"\n\n# Configure Storage Account Firewall to deny public traffic except VNet source\naz storage account update --name mypremiumstorage --bypass AzureServices --default-action Deny\naz storage account network-rule add --account-name mypremiumstorage --vnet-name my-vnet --subnet my-subnet`,
        cliCopyId: 'azure_security_cli',
        termDefinitions: [
          {
            title: 'Azure RBAC vs SAS Tokens',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-orange',
            body: 'Azure RBAC uses Microsoft Entra ID (Azure AD) to authorize calls. SAS Tokens are signed URLs providing temporary restricted access permissions based on storage account keys.'
          },
          {
            title: 'Storage Account Network Rules',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-orange',
            body: 'Network Rules define whitelist storage firewalls, allowing access only from specified virtual networks, subnets, or public IP ranges.'
          },
          {
            title: 'Public Access Override',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-orange',
            body: 'Allow Public Access configuration setting can be set to false at the Storage Account level to block anonymous container-level reads globally.'
          }
        ]
      },
      s3_encryption: {
        id: 's3_encryption',
        category: 's3_fundamentals',
        title: 'Service Encryption, Key Vault & Encryption Scopes',
        heroBadge: 'Blob Encryption',
        desc: 'Azure automatically encrypts data at rest using Storage Service Encryption (SSE) with Microsoft-Managed Keys or Customer-Managed Keys (stored in Azure Key Vault). Encryption Scopes allow you to encrypt blobs in different containers or files within the same storage account using separate keys, facilitating multi-tenant isolation.',
        takeaway: '💡 Enable Customer-Managed Keys via Key Vault to gain full control over key rotation, revocation, and envelope cryptographic operations. Use Encryption Scopes for multi-tenant key isolation.',
        cliTitle: 'AZURE CLI COMMANDS — KEY VAULT ENCRYPTION',
        cliCommands: `# Update Storage Account to use Customer-Managed Key from Key Vault\naz storage account update --name mypremiumstorage --resource-group rg --encryption-key-name "my-key" --encryption-key-vault "https://mykeyvault.vault.azure.net/" --encryption-key-source Microsoft.Keyvault`,
        cliCopyId: 'azure_encryption_cli',
        termDefinitions: [
          {
            title: 'Storage Service Encryption (SSE)',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-green',
            body: 'Storage Service Encryption protects data at rest at the physical layer using 256-bit AES encryption. It is enabled by default for all storage accounts.'
          },
          {
            title: 'Azure Key Vault & Managed Identities',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-green',
            body: 'Key Vault secures cryptographic keys. Storage Accounts use a User-Assigned or System-Assigned Managed Identity to authenticate and fetch key metadata from Key Vault.'
          },
          {
            title: 'Encryption Scopes',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-green',
            body: 'Encryption Scopes allow you to encrypt blobs in different containers within the same storage account using separate keys, facilitating multi-tenant isolation.'
          }
        ]
      },
      s3_versioning: {
        id: 's3_versioning',
        category: 's3_data_management',
        title: 'Blob Versioning, Soft Delete & Immutable WORM Storage',
        heroBadge: 'Blob Versioning',
        desc: 'Azure Blob Versioning preserves historical files in a stack. Soft Delete acts as a recycle bin to recover deleted files, and Immutable Storage (WORM) enforces regulatory compliance. Immutability policies can be configured at the container level or at the version level (version-level immutability).',
        takeaway: '💡 Soft Delete acts as a safety recycle bin. Access policy-based locks and WORM configurations block container deletion or blob modification for compliance.',
        cliTitle: 'AZURE CLI COMMANDS — VERSIONING & IMMUTABILITY',
        cliCommands: `# Enable versioning and soft delete on a storage account\naz storage account blob-service-properties update --account-name mypremiumstorage --enable-versioning true --enable-delete-retention true --delete-retention-days 7\n\n# Configure a legal hold immutability policy on a container\naz storage container immutability-policy create --account-name mypremiumstorage --container-name my-container --period 180 --allow-protected-append-writes true`,
        cliCopyId: 'azure_versioning_cli',
        termDefinitions: [
          {
            title: 'Blob Versioning & Soft Delete',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'Blob Versioning automatically stores previous states of blobs. Soft Delete retains deleted blobs or blob versions for a configured period, allowing recovery.'
          },
          {
            title: 'Container Immutability Policies',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'Immutability Policies enforce WORM (Write Once Read Many). Time-based retention policies block edits or deletions of blobs for a specified interval.'
          },
          {
            title: 'Legal Holds',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'Legal Holds store blobs immutably until the hold is explicitly cleared. Ideal for ongoing litigation or compliance audits.'
          }
        ]
      },
      s3_storage: {
        id: 's3_storage',
        category: 's3_data_management',
        title: 'Access Tiers, Lifecycle Policies & Tiering Calculator',
        heroBadge: 'Blob Access Tiers',
        desc: 'Azure offers access tiers (Hot, Cool, Cold, Archive) optimized for usage patterns. Lifecycle management rules automatically migrate blobs between tiers. Blobs stored in the Archive tier are offline; reading them requires rehydration to Hot or Cool, which can be done via Standard priority (1-15 hours) or High priority (<1 hour).',
        takeaway: '💡 Set lifecycle rules to automatically downgrade blobs from Hot to Cool or Archive tiers after a duration of inactivity, achieving significant storage savings.',
        cliTitle: 'AZURE CLI COMMANDS — LIFECYCLE TIERING',
        cliCommands: `# Apply a lifecycle management policy to migrate blobs to cool/archive\naz storage account management-policy create --account-name mypremiumstorage --resource-group rg --policy '{\n  "rules": [\n    {\n      "name": "tier-to-cool-and-archive",\n      "enabled": true,\n      "type": "Lifecycle",\n      "definition": {\n        "actions": {\n          "baseBlob": {\n            "tierToCool": { "daysAfterModificationGreaterThan": 30 },\n            "tierToArchive": { "daysAfterModificationGreaterThan": 90 },\n            "delete": { "daysAfterModificationGreaterThan": 365 }\n          }\n        },\n        "filters": { "blobTypes": [ "blockBlob" ] }\n      }\n    }\n  ]\n}'`,
        cliCopyId: 'azure_storage_cli',
        termDefinitions: [
          {
            title: 'Azure Access Tiers',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'Azure Access Tiers include Hot (active access), Cool (infrequent access), Cold (longer retention infrequent), and Archive (offline archival storage).'
          },
          {
            title: 'Azure Lifecycle Management',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'Lifecycle Management policies automate actions such as tiering down blobs or deleting old backups based on last modified dates or last access times.'
          },
          {
            title: 'Blob Rehydration',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'To access a blob in Archive tier, it must be rehydrated to Hot or Cool. Rehydration supports Standard priority (15 hours) or High priority (<1 hour).'
          }
        ]
      },
      s3_networking: {
        id: 's3_networking',
        category: 's3_advanced',
        title: 'Private Endpoints & Service Endpoints Routing',
        heroBadge: 'Blob Private Networking',
        desc: 'Restrict blob network access to specific Azure Virtual Networks (VNets). Use Private Endpoints to assign a private IP address inside your subnet to the storage account via Private Link, routing all traffic securely over virtual network routes and avoiding public internet endpoints.',
        takeaway: '💡 Azure Private Endpoints assign a local IP to the storage account, routing traffic over the Azure private network rather than the public internet.',
        cliTitle: 'AZURE CLI COMMANDS — PRIVATE ENDPOINTS',
        cliCommands: `# Create a Private Endpoint for blob storage connection\naz network private-endpoint create --name myStorageEndpoint --resource-group rg --vnet-name my-vnet --subnet my-subnet --private-connection-resource-id "/subscriptions/sub-id/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/mypremiumstorage" --group-ids blob --connection-name myStorageConnection`,
        cliCopyId: 'azure_networking_cli',
        termDefinitions: [
          {
            title: 'Private Endpoints (PrivateLink)',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'Private Endpoints expose the storage service as a private IP address inside the VNet subnet, routing all traffic securely via private fiber paths.'
          },
          {
            title: 'VNet Service Endpoints',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'Service Endpoints optimize routing by extending the virtual network private identity to the storage service over public endpoints, whitelisting subnet routing.'
          },
          {
            title: 'Storage Firewall Rules',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'Storage Firewalls block all incoming traffic by default, whitelisting specific VNet subnet IDs or corporate public IP subnets.'
          }
        ]
      },
      s3_transfer: {
        id: 's3_transfer',
        category: 's3_advanced',
        title: 'Front Door Ingest, LRS/ZRS & Geo Replication',
        heroBadge: 'Blob Ingest & Replication',
        desc: 'Optimize global ingestion using Azure Front Door Edge routing, and replicate data across regions automatically using Geo-Redundant Storage (GRS). Object replication policies can also copy blobs asynchronously across containers in different storage accounts or regions.',
        takeaway: '💡 Locally Redundant Storage (LRS) copies data in one datacenter, Zone-Redundant (ZRS) across three zones, and Geo-Redundant (GRS) asynchronously to a secondary region.',
        cliTitle: 'AZURE CLI COMMANDS — CONFIGURE REPLICATION',
        cliCommands: `# Change Storage Account redundancy level to Geo-Redundant (GRS)\naz storage account update --name mypremiumstorage --resource-group rg --sku Standard_GRS\n\n# Configure Object Replication rules between containers\naz storage account or-policy create --account-name mypremiumstorage --resource-group rg --policy-file @or-policy.json`,
        cliCopyId: 'azure_transfer_cli',
        termDefinitions: [
          {
            title: 'LRS vs ZRS vs GRS Replication',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'Azure redundancy levels include LRS (3 copies in 1 DC), ZRS (3 copies across 3 AZs), GRS (replicated to secondary region), and RA-GRS (read access to secondary).'
          },
          {
            title: 'Blob Object Replication',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'Object Replication copies block blobs asynchronously between a source container and a destination container (can be in separate regions or accounts).'
          },
          {
            title: 'Azure Front Door CDN Acceleration',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'Azure Front Door routes traffic to the nearest Microsoft POP (Point of Presence), using Microsoft\'s global private WAN backbone to accelerate storage uploads.'
          }
        ]
      },
      s3_operations: {
        id: 's3_operations',
        category: 's3_advanced',
        title: 'Event Grid, Blob Storage Tasks & Inventory Reports',
        heroBadge: 'Blob Automation & Tasks',
        desc: 'Automate blob reactions using Azure Event Grid subscriptions targeting Azure Functions or queues. Execute bulk operations like tiering or tagging across billions of blobs using Azure Storage Tasks. Track storage inventory using Blob Inventory reports generated daily/weekly.',
        takeaway: '💡 Event Grid pushes notification messages to Azure Functions or queues, while Storage Tasks process bulk actions (like tiering/tagging) over millions of blobs.',
        cliTitle: 'AZURE CLI COMMANDS — CONFIGURE EVENTS & INVENTORY',
        cliCommands: `# Create an Event Grid subscription targeting an Azure Function\naz eventgrid event-subscription create --name blobEvents --source-resource-id "/subscriptions/sub-id/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/mypremiumstorage" --endpoint "https://myfunctionapp.azurewebsites.net/api/BlobTrigger"\n\n# Create a Blob Inventory report configuration\naz storage account keys list --account-name mypremiumstorage --resource-group rg`,
        cliCopyId: 'azure_operations_cli',
        termDefinitions: [
          {
            title: 'Azure Event Grid Integration',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'Event Grid publishes blob lifecycle events (created, deleted) to Event Hubs, Queue Storage, or Webhooks, triggering serverless automation flows.'
          },
          {
            title: 'Azure Storage Tasks (Blob Batch)',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'Storage Tasks is a serverless job system allowing you to run mass actions (like modifying access tiers or metadata) over billions of storage files.'
          },
          {
            title: 'Blob Inventory Reports',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'Blob Inventory generates weekly/daily CSV or Parity reports of all blobs and container metadata, facilitating auditing and billing evaluations.'
          }
        ]
      }
    }
  },
  gcp: {
    id: 'gcp',
    name: 'Google Cloud Storage',
    serviceName: 'Cloud Storage',
    containerName: 'GCS Bucket',
    objectName: 'Object',
    accessControlName: 'Uniform Bucket-Level Access',
    durabilityInfo: '99.999999999% (11 9s) annual durability SLA',
    eventsLabel: 'Eventarc / Pub/Sub',
    lambdaLabel: 'Cloud Functions',
    kmsLabel: 'Cloud KMS Encryption',
    theme: {
      primaryColor: '#0F9D58',
      gradientStart: '#f0fdf4',
      gradientEnd: '#dcfce7',
      darkGradientStart: 'rgba(15, 23, 42, 0.85)',
      darkGradientEnd: 'rgba(15, 157, 88, 0.15)',
      flowColorClass: 's3-flow-green',
      glowFilter: 'glow-green',
      badgeColorClass: 's3-pill-why',
      btnActiveBg: 'linear-gradient(135deg, #0F9D58 0%, #0B7A44 100%)',
      btnActiveBorder: '#0B7A44'
    },
    storageClasses: {
      standard: {
        name: 'Standard Storage',
        durability: '99.999999999% (eleven 9s)',
        availability: '99.99% (Multi-Region) / 99.9% (Regional)',
        minDuration: 'None',
        minSize: 'None (no minimum file size constraint)',
        retrievalFee: 'None',
        storageCost: 0.020,
        icon: '🚀',
        desc: 'General purpose storage for active, high-frequency access data. Replicated across regions (Multi-Region), dual regions, or single regions. Replicates data synchronously. Ideal for serverless apps and live serving.'
      },
      ia: {
        name: 'Nearline',
        durability: '99.999999999% (eleven 9s)',
        availability: '99.9% (Multi-Region) / 99.0% (Regional)',
        minDuration: '30 Days (prorated)',
        minSize: 'None (no minimum file size constraint)',
        retrievalFee: '$0.01 per GB retrieved',
        storageCost: 0.010,
        icon: '❄️',
        desc: 'Optimized for infrequently accessed data with a minimum storage duration of 30 days (e.g. monthly reports, backup cycles). Offers millisecond-level access times without any retrieval delay.'
      },
      onezone: {
        name: 'Coldline',
        durability: '99.999999999% (eleven 9s)',
        availability: '99.9% (Multi-Region) / 99.0% (Regional)',
        minDuration: '90 Days (prorated)',
        minSize: 'None (no minimum file size constraint)',
        retrievalFee: '$0.02 per GB retrieved',
        storageCost: 0.007,
        icon: '⚡',
        desc: 'Cold storage optimized for data accessed at most once a quarter (minimum 90 days). Offers very low storage costs but higher retrieval charges. Retains millisecond active access speed.'
      },
      intelligent: {
        name: 'Autoclass',
        durability: '99.999999999% (eleven 9s)',
        availability: '99.9%',
        minDuration: 'None',
        minSize: 'None (no minimum file size constraint)',
        retrievalFee: 'None',
        storageCost: 0.020,
        icon: '🧠',
        desc: 'Automatically transitions objects between Standard, Nearline, Coldline, and Archive classes based on access history. Charges a low flat monitoring fee of $0.0025 per 100,000 objects/month. No retrieval fees or transition fees are charged.'
      },
      glacier_ir: {
        name: 'Coldline',
        durability: '99.999999999% (eleven 9s)',
        availability: '99.9%',
        minDuration: '90 Days (prorated)',
        minSize: 'None',
        retrievalFee: '$0.02 per GB retrieved',
        storageCost: 0.007,
        icon: '🧊',
        desc: "Coldline storage tier configuration. Serves as GCS's direct equivalent to S3 Glacier Instant Retrieval, providing millisecond retrieval speed without offline tape latency."
      },
      glacier_fr: {
        name: 'Archive',
        durability: '99.999999999% (eleven 9s)',
        availability: '99.9% (Multi-Region) / 99.0% (Regional)',
        minDuration: '365 Days (prorated)',
        minSize: 'None',
        retrievalFee: '$0.05 per GB retrieved',
        storageCost: 0.0012,
        icon: '📦',
        desc: 'Crucially, GCS Archive is a fully online storage tier offering millisecond access times. This stands in stark contrast to AWS S3 Glacier and Azure Archive, which rely on tape architectures requiring hours of offline rehydration delays.'
      },
      glacier_deep: {
        name: 'Archive',
        durability: '99.999999999% (eleven 9s)',
        availability: '99.9%',
        minDuration: '365 Days (prorated)',
        minSize: 'None',
        retrievalFee: '$0.05 per GB retrieved',
        storageCost: 0.0012,
        icon: '🕳️',
        desc: 'Lowest-cost GCS class for data with >= 365-day retention requirements. Unlike AWS Glacier Deep Archive (which takes 12-48 hours), GCS Archive objects are readable in milliseconds.'
      }
    },
    policyTemplates: {
      public: `[
  {
    "role": "roles/storage.objectViewer",
    "members": ["allUsers"]
  }
]`,
      https: `{
  "options": {
    "cors": [{"origin": ["*"], "responseHeader": ["Content-Type"], "method": ["GET"], "maxAgeSeconds": 3600}]
  }
}`,
      vpce: `{
  "policy": {
    "rules": [
      {
        "resources": ["projects/123456789/locations/global/buckets/my-gcs-bucket"],
        "vpcServiceControls": "accessPolicies/default/servicePerimeters/restrictPerimeter"
      }
    ]
  }
}`
    },
    notebookNotes: {
      s3_namespace: {
        id: 's3_namespace',
        category: 's3_fundamentals',
        title: 'Bucket Namespaces, Static Web & CORS',
        heroBadge: 'GCS Namespaces & CORS',
        desc: "Google Cloud Storage organizes data inside globally unique buckets. Like S3, GCS is a flat key-value store where directories are only simulated using slash delimiter prefix paths. GCS scales request throughput dynamically, increasing performance as requests to a prefix increase without requiring prefix-partitioning planning.",
        takeaway: "💡 GCS is a flat key-value store. Directories are simulated via prefixes, with request throughput scaling dynamically based on Google's global web infrastructure.",
        cliTitle: 'GCLOUD STORAGE COMMANDS — CREATE BUCKET & CORS',
        cliCommands: `# Create a GCS bucket in a specific region\ngcloud storage buckets create gs://my-premium-bucket --location=us-east1\n\n# Configure CORS (Cross-Origin Resource Sharing) for GCS\ngcloud storage buckets update gs://my-premium-bucket --cors-file=cors-config.json`,
        cliCopyId: 'gcp_namespace_cli',
        termDefinitions: [
          {
            title: 'GCS Buckets, Objects & Prefixes',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'A GCS Bucket is a globally unique storage namespace. An Object is the stored file consisting of payload data and metadata. Prefixes are simulated directories (like logs/) used to logically index keys.'
          },
          {
            title: 'Static Website Hosting',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'Static Website Hosting maps GCS buckets to custom DNS domains (using CNAME records) to serve static HTML/CSS/JS assets directly to web clients at scale.'
          },
          {
            title: 'CORS & Requester Pays',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'CORS allows browser cross-origin requests. Requester Pays bucket configuration shifts GCS data download egress charges to the API caller instead of the bucket owner.'
          }
        ]
      },
      s3_security: {
        id: 's3_security',
        category: 's3_fundamentals',
        title: 'IAM Permissions, Uniform Access & Signed URLs',
        heroBadge: 'GCS Access Controls',
        desc: "Google Cloud secures storage resources via project/bucket-level IAM policies and fine-grained ACLs. Enforcing Uniform Bucket-Level Access disables ACLs globally on the bucket, ensuring that only bucket-wide IAM permissions apply. To secure network boundaries, VPC Service Controls establish a perimeter block around GCS buckets.",
        takeaway: "💡 Enable Uniform Bucket-Level Access on GCS buckets to simplify security auditing and enforce bucket-wide IAM controls. Restrict network data exfiltration using VPC Service Controls.",
        cliTitle: 'GCLOUD STORAGE COMMANDS — IAM ROLES & UNIFORM ACCESS',
        cliCommands: `# Enable Uniform Bucket-Level Access on a bucket\ngcloud storage buckets update gs://my-premium-bucket --uniform-bucket-level-access\n\n# Grant storage object viewer IAM permission to a user\ngcloud storage buckets add-iam-policy-binding gs://my-premium-bucket --member="user:user@domain.com" --role="roles/storage.objectViewer"`,
        cliCopyId: 'gcp_security_cli',
        termDefinitions: [
          {
            title: 'Uniform Bucket-Level Access',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-orange',
            body: 'Enabling Uniform Bucket-Level Access disables legacy object ACLs, forcing GCS to evaluate IAM policies at the bucket level for all operations. This streamlines access auditing.'
          },
          {
            title: 'IAM Bindings vs ACLs',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-orange',
            body: 'IAM bindings map members (identities) to roles. Object Access Control Lists (ACLs) are fine-grained rules attached directly to individual objects to define permissions.'
          },
          {
            title: 'VPC Service Controls',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-orange',
            body: 'A security boundary service that prevents data exfiltration by blocking GCS bucket access from outside authorized project perimeters, even if IAM permissions allow it.'
          }
        ]
      },
      s3_encryption: {
        id: 's3_encryption',
        category: 's3_fundamentals',
        title: 'Default Keys, KMS CMEK & Envelope Encryption',
        heroBadge: 'GCS Encryption',
        desc: "GCS encrypts all data at rest automatically before writing to disk. Options include Google-Managed Keys, Customer-Managed Encryption Keys (CMEK) via Cloud KMS, or Customer-Supplied Encryption Keys (CSEK). GCS leverages envelope encryption: data is encrypted with local Data Encryption Keys (DEKs) which are wrapped under Key Encryption Keys (KEKs) in Cloud KMS.",
        takeaway: "💡 Google-managed encryption is enabled by default. Use Customer-Managed Encryption Keys (CMEK) in Cloud KMS to retain absolute control over key rotation, policies, and KMS envelope crypto operations.",
        cliTitle: 'GCLOUD STORAGE COMMANDS — KMS CMEK ENCRYPTION',
        cliCommands: `# Assign default KMS Customer-Managed Encryption Key (CMEK) to a bucket\ngcloud storage buckets update gs://my-premium-bucket --default-encryption-key=projects/project-id/locations/us-east1/keyRings/my-ring/cryptoKeys/my-key\n\n# Upload an object using the default bucket CMEK\ngcloud storage cp document.pdf gs://my-premium-bucket/secure-docs/`,
        cliCopyId: 'gcp_encryption_cli',
        termDefinitions: [
          {
            title: 'Google-Managed vs CMEK Keys',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-green',
            body: 'Google-managed encryption uses keys managed entirely by Google. CMEK allows you to use your own keys in Google Cloud KMS (Key Management Service) to encrypt bucket data.'
          },
          {
            title: 'Cloud KMS Envelope Encryption',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-green',
            body: 'Encrypts raw files with a local Data Encryption Key (DEK). GCS then wraps (encrypts) the DEK using your Key Encryption Key (KEK) managed inside Cloud KMS, protecting data with dual cryptographic layers.'
          },
          {
            title: 'Customer-Supplied Keys (CSEK)',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-green',
            body: 'An encryption option where you provide raw AES-256 keys directly inside GCS API call headers. Google uses the key in-memory to perform encryption/decryption but never stores the key on disk.'
          }
        ]
      },
      s3_versioning: {
        id: 's3_versioning',
        category: 's3_data_management',
        title: 'GCS Object Versioning, Retention Policies & Holds',
        heroBadge: 'GCS Versioning',
        desc: "Object Versioning protects GCS files from accidental deletion or modification. When enabled, historical versions are indexed using Generation Numbers. To enforce Write Once Read Many (WORM) models, apply a locked Retention Policy to the bucket or apply temporary/legal holds to individual objects.",
        takeaway: "💡 Versioning tracks file history using generation IDs. Standard deletes archive objects as noncurrent. Lock bucket Retention Policies to enforce permanent, un-bypassable WORM compliance.",
        cliTitle: 'GCLOUD STORAGE COMMANDS — VERSIONING & RETENTION',
        cliCommands: `# Enable versioning on a GCS bucket\ngcloud storage buckets update gs://my-premium-bucket --versioning\n\n# Configure a 30-day bucket retention policy (WORM)\ngcloud storage buckets update gs://my-premium-bucket --retention-period=30d`,
        cliCopyId: 'gcp_versioning_cli',
        termDefinitions: [
          {
            title: 'Object Versioning & Generation Numbers',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'Versioning distinguishes object iterations via generation numbers. A separate metageneration number tracks edits to metadata. Deleting a live object archives it as a historical version.'
          },
          {
            title: 'Bucket Retention Policies (WORM)',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'Bucket Retention Policies prevent object deletion or modification for a configured period. Once locked, the policy cannot be reduced in duration or removed, enforcing absolute compliance.'
          },
          {
            title: 'Temporary & Legal Holds',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'Object holds are status flags that block object deletion or modification. Temporary Holds can be cleared by administrators, while Legal Holds remain active during ongoing audits.'
          }
        ]
      },
      s3_storage: {
        id: 's3_storage',
        category: 's3_data_management',
        title: 'Standard, Nearline, Coldline & Archive Class Lifecycle',
        heroBadge: 'GCS Classes & Lifecycles',
        desc: "GCS offers Standard, Nearline, Coldline, and Archive classes. To automate cost-optimization, configure Lifecycle Management policies or enable Autoclass to transition objects between classes based on access. Uniquely, GCS Archive class remains fully online with millisecond retrieval speed, avoiding tape-rehydration latency.",
        takeaway: "💡 GCS Archive storage remains online with millisecond access, unlike AWS and Azure offline classes. Use Autoclass to automate transitions based on access patterns and avoid transition fees.",
        cliTitle: 'GCLOUD STORAGE COMMANDS — LIFECYCLE MANAGEMENT',
        cliCommands: `# Apply a lifecycle configuration file to a bucket\ngcloud storage buckets update gs://my-premium-bucket --lifecycle-file=lifecycle-config.json\n\n# Enable Autoclass on a GCS bucket\ngcloud storage buckets update gs://my-premium-bucket --autoclass`,
        cliCopyId: 'gcp_storage_cli',
        termDefinitions: [
          {
            title: 'GCS Storage Classes',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'Standard Storage, Nearline (accessed < once/month, 30-day min), Coldline (accessed < once/quarter, 90-day min), and Archive (accessed < once/year, 365-day min). All classes deliver millisecond latency.'
          },
          {
            title: 'Autoclass Auto-Management',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'Autoclass dynamically transitions objects to cooler classes as they age. If accessed, they move back to Standard. Charges a tiny monitoring fee ($0.0025 per 100,000 objects/month) with no retrieval or transition fees.'
          },
          {
            title: 'Online Archival Latency',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'Unlike AWS Glacier and Azure Archive, which store cold data on physical tapes requiring hours of rehydration, GCS Archive data is kept online, delivering millisecond retrieval times.'
          }
        ]
      },
      s3_networking: {
        id: 's3_networking',
        category: 's3_advanced',
        title: 'Private Google Access & VPC Service Controls',
        heroBadge: 'GCS Private Networking',
        desc: "Connect to GCS privately from inside Google Cloud VPCs. Private Google Access allows Compute Engine VMs without public IPs to connect to GCS endpoints over private routing. Private Service Connect (PSC) allows exposing GCS as a private internal IP address directly inside your VPC subnets.",
        takeaway: "💡 Private Google Access lets internal VMs without external IPs access GCS. Use Private Service Connect to expose GCS as a local private IP inside your VPC subnet for maximum network security.",
        cliTitle: 'GCLOUD STORAGE COMMANDS — PRIVATE GOOGLE ACCESS',
        cliCommands: `# Configure a VPC subnet to enable Private Google Access\ngcloud compute networks subnets update my-subnet --region=us-east1 --enable-private-ip-google-access`,
        cliCopyId: 'gcp_networking_cli',
        termDefinitions: [
          {
            title: 'Private Google Access',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'A subnet setting that routes internal VM API requests directly to Google services (like GCS) over Google private fiber, avoiding NAT gateways or public internet hops.'
          },
          {
            title: 'VPC Service Controls',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'Creates a security perimeter around GCS resources, restricting access to authorized project VPCs and blocking external API calls to mitigate exfiltration risks.'
          },
          {
            title: 'Private Service Connect (PSC)',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-cyan',
            body: 'Enables exposing Google APIs (like GCS) as a local internal IP address inside your subnet. Traffic is routed privately over your virtual network.'
          }
        ]
      },
      s3_transfer: {
        id: 's3_transfer',
        category: 's3_advanced',
        title: 'Dual-Region Replication, CDN & Google WAN Ingest',
        heroBadge: 'GCS Ingest & Replication',
        desc: "Replicate GCS data automatically across regions for disaster recovery. GCS supports Single-region, Multi-region (geo-redundant), and Dual-region buckets (active-active replica across two regional zones). Enhance long-distance upload speeds by routing traffic through Google's global private WAN edge locations.",
        takeaway: "💡 Dual-Region buckets provide active-active replication and low latency. Google Edge Points (POPs) route ingest traffic directly onto Google's high-speed private WAN.",
        cliTitle: 'GCLOUD STORAGE COMMANDS — DUAL REGION CREATION',
        cliCommands: `# Create a dual-region GCS bucket (US East / West)\ngcloud storage buckets create gs://my-premium-bucket --location=us-east1,us-west1\n\n# Configure Turbo Replication (15-minute SLA) on dual-region bucket\n# (Configure via bucket settings parameters)`,
        cliCopyId: 'gcp_transfer_cli',
        termDefinitions: [
          {
            title: 'Dual-Region & Turbo Replication',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'Dual-Region replicates objects across 2 regions for active-active redundancy. Turbo Replication is a premium setting guaranteeing that 99.9% of objects are replicated in under 15 minutes.'
          },
          {
            title: 'Google Global WAN Ingestion',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: "Google routes storage requests through the closest Edge Point of Presence (POP) onto their private global WAN backbone, avoiding internet transit delays."
          },
          {
            title: 'Cloud CDN Integration',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-indigo',
            body: 'Integrates GCS with Cloud CDN to cache static media assets at edge POPs, accelerating content delivery speeds globally and reducing egress costs.'
          }
        ]
      },
      s3_operations: {
        id: 's3_operations',
        category: 's3_advanced',
        title: 'Pub/Sub Alerts, Transfer Jobs & Storage Insights',
        heroBadge: 'GCS Automation & Transfer',
        desc: "Automate event-driven architectures by sending Pub/Sub notifications when GCS objects change. Schedule large-scale asynchronous data migrations from other clouds using Storage Transfer Service. Analyze bucket utilization and audit metadata using Storage Insights daily inventory logs.",
        takeaway: "💡 Pub/Sub object change notifications trigger real-time serverless Cloud Functions. Use Storage Transfer Service to import data from AWS S3 or Azure Blob Storage easily.",
        cliTitle: 'GCLOUD STORAGE COMMANDS — PUBSUB CONFIGURATION',
        cliCommands: `# Configure Pub/Sub object change notification on a bucket\ngcloud storage buckets notifications create gs://my-premium-bucket --topic=my-storage-topic\n\n# List notifications on a GCS bucket\ngcloud storage buckets notifications list gs://my-premium-bucket`,
        cliCopyId: 'gcp_operations_cli',
        termDefinitions: [
          {
            title: 'Pub/Sub Object Notifications',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'Pub/Sub notifications publish message payloads to a target topic whenever objects are created, overwritten, or deleted, triggering real-time serverless workflows.'
          },
          {
            title: 'Storage Transfer Service (STS)',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'A serverless Google Cloud service that automates and schedules data migration jobs from AWS S3, Azure Blob, HTTP endpoints, or on-premise file systems into GCS.'
          },
          {
            title: 'Storage Insights Reports',
            pillText: '📖 Term Definitions',
            pillType: 'why',
            hlClass: 's3-hl-purple',
            body: 'Generates automated daily inventory reports listing object names, sizes, creation times, and access tiers in CSV or JSON format inside a target bucket.'
          }
        ]
      }
    }
  }
};
