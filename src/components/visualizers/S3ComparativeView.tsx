import { 
  Zap, 
  Globe, 
  Sliders, 
  Database, 
  RefreshCw, 
  FileText, 
  Info,
  Clock,
  CreditCard,
  Network
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface S3ComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'overview' | 'security' | 'encryption' | 'versioning' | 'storage' | 'networking' | 'transfer' | 'operations' | 'notebook') => void;
}

export default function S3ComparativeView({ onNavigateToDemo }: S3ComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Storage Service',
      aws: 'Amazon S3 (Simple Storage Service)',
      azure: 'Azure Blob Storage',
      gcp: 'Google Cloud Storage (GCS)',
      icon: <Database className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Storage Container',
      aws: 'S3 Bucket (Globally unique DNS namespace)',
      azure: 'Blob Container (Scoped in Storage Account)',
      gcp: 'GCS Bucket (Globally unique DNS namespace)',
      icon: <Database className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Stored Object',
      aws: 'S3 Object (Key + Data + Metadata)',
      azure: 'Blob (Block, Page, or Append Blob)',
      gcp: 'Object (Key + Data + Metadata)',
      icon: <FileText className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Event Ingest Engine',
      aws: 'S3 Event Notifications',
      azure: 'Event Grid',
      gcp: 'Eventarc / Pub/Sub',
      icon: <Zap className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Serverless Functions',
      aws: 'AWS Lambda',
      azure: 'Azure Functions',
      gcp: 'Cloud Functions',
      icon: <CpuIcon className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Point-to-Point Queue',
      aws: 'Amazon SQS Queue',
      azure: 'Service Bus Queue',
      gcp: 'Pub/Sub Subscription',
      icon: <TerminalIcon className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Publish/Subscribe Topic',
      aws: 'Amazon SNS Topic',
      azure: 'Event Grid Topic',
      gcp: 'Pub/Sub Topic',
      icon: <Zap className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Standard Tier equivalent',
      aws: 'S3 Standard',
      azure: 'Hot Tier',
      gcp: 'Standard Storage',
      icon: <Sliders className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Infrequent Tier equivalent',
      aws: 'S3 Standard-IA',
      azure: 'Cool Tier',
      gcp: 'Nearline',
      icon: <Sliders className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Instant Archive equivalent',
      aws: 'S3 Glacier Instant Retrieval',
      azure: 'Cool Tier',
      gcp: 'Coldline',
      icon: <Sliders className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Flexible Archive equivalent',
      aws: 'S3 Glacier Flexible Retrieval',
      azure: 'Archive Tier',
      gcp: 'Archive',
      icon: <Sliders className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Deep Archive equivalent',
      aws: 'S3 Glacier Deep Archive',
      azure: 'Archive Tier',
      gcp: 'Archive',
      icon: <Sliders className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Billing Minimums',
      aws: 'Standard: None; IA: 128KB, 30d; Glacier IR: 128KB, 90d; Glacier Flexible: 90d; Glacier Deep: 180d.',
      azure: 'Hot: None; Cool: 30d; Cold: 90d; Archive: 180d. No minimum object size constraint.',
      gcp: 'Standard: None; Nearline: 30d; Coldline: 90d; Archive: 365d. No minimum object size constraint.',
      icon: <CreditCard className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Archive Rehydration Speed',
      aws: 'Glacier IR: Milliseconds. Glacier Flexible: 1-5 mins (Expedited) or 3-5 hrs. Glacier Deep: 12-48 hrs.',
      azure: 'Cool: Milliseconds. Archive: Standard priority 1-15 hrs; High priority under 1 hr.',
      gcp: 'Coldline/Archive: Milliseconds. All classes are fully online and instantly readable; zero rehydration.',
      icon: <Clock className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Network Interfaces',
      aws: 'Gateway Endpoints (free routing); Interface Endpoints (PrivateLink ENIs, hourly/GB fee)',
      azure: 'VNet Service Endpoints (free); Private Endpoints (Private Link private IP, hourly/GB fee)',
      gcp: 'Private Google Access (free routing); Private Service Connect (Local VPC IP, free)',
      icon: <Network className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Redundancy Levels',
      aws: 'Standard (3+ AZs); One Zone-IA (1 AZ); CRR (Cross-Region); SRR (Same-Region)',
      azure: 'LRS (1 DC, 3 copies); ZRS (3 AZs); GRS (3 local + 3 geo-replicated); RA-GRS; GZRS',
      gcp: 'Single-region (1 region); Dual-region (2 regions); Multi-region (geographic area)',
      icon: <Globe className="w-4 h-4 text-purple-500" />
    },
    {
      concept: 'Durability SLA',
      aws: '99.999999999% (11 9s) annual durability across minimum of 3 AZs',
      azure: '99.999999999% (11 9s) LRS / 99.99999999999999% (16 9s) GRS geo-redundancy',
      gcp: '99.999999999% (11 9s) annual durability SLA across geographic regions',
      icon: <RefreshCw className="w-4 h-4 text-purple-500" />
    }
  ];

  const comparativeDetails = [
    {
      title: '📁 Namespace & Addressing Hierarchy',
      tab: 'overview' as const,
      awsDesc: 'S3 uses a completely flat key-value namespace. Buckets are globally unique DNS endpoints: https://bucket-name.s3.region.amazonaws.com. Folders are simulated directories using prefix path strings. Baseline performance scales up to 3,500 PUT and 5,500 GET requests per second per prefix.',
      azureDesc: 'Azure Storage Accounts act as the global DNS namespace: https://account.blob.core.windows.net. Within it, containers act as folders grouping blobs. HNS (Hierarchical Namespace) can be enabled to allow true POSIX directory operations and atomic folder locks.',
      gcpDesc: 'GCS uses globally unique buckets addressed via DNS URLs: https://storage.googleapis.com/bucket-name. Prefixes simulate folder trees. Unlike S3, GCS request rates scale dynamically and automatically without prefix-partitioning configuration.',
    },
    {
      title: '🛡️ Policies, Firewalls & Access Controls',
      tab: 'security' as const,
      awsDesc: 'AWS evaluates organization-level SCPs, resource-level Bucket Policies, and identity-level IAM. Block Public Access (BPA) overrides public access configurations globally. Access Control Lists (ACLs) are legacy and disabled by default.',
      azureDesc: 'Azure evaluates Subscription policies, Microsoft Entra RBAC assignments, and whitelisted Virtual Network firewalls. Shared Access Signatures (SAS) delegate temporary container/blob keys, and can be revoked using Stored Access Policies.',
      gcpDesc: 'GCP evaluates IAM binding configurations at the project, bucket, or object level. Uniform Bucket-Level Access overrides object ACLs, enforcing bucket-wide IAM control. VPC Service Controls act as a logical network perimeter to block exfiltration.',
    },
    {
      title: '🔒 Server-Side Encryption (SSE)',
      tab: 'encryption' as const,
      awsDesc: 'SSE-S3 encrypts data using AWS-managed keys. SSE-KMS uses Customer-Managed Keys (CMK) with envelope encryption. S3 Bucket Keys cache KMS keys at the bucket layer to reduce outbound KMS API call volumes and billing by up to 99%.',
      azureDesc: 'SSE encrypts data at rest using Microsoft-Managed Keys by default. Customer-Managed Keys (CMK) use Azure Key Vault. Encryption Scopes apply distinct customer-managed keys per container or blob tenant to isolate multi-tenant data.',
      gcpDesc: 'All objects are encrypted at rest automatically using Google-Managed Keys. CMEK maps keys managed in Cloud KMS using envelope encryption (wrapping Data Encryption Keys with Key Encryption Keys). CSEK lets customers supply raw keys directly in API headers.',
    },
    {
      title: '🔄 Versioning & WORM Lock Compliance',
      tab: 'versioning' as const,
      awsDesc: 'Versioning stores previous file states in a stack. Suspending versioning or deleting historical files can be protected by MFA Delete. S3 Object Lock enforces WORM compliance in Governance (bypassable) or Compliance (absolute lock) modes.',
      azureDesc: 'Versioning preserves history, and Soft Delete serves as a recycling bin for deleted blobs/containers. Immutability Policies enforce time-based WORM locks at the container or version level, preventing edits/deletes even by subscription admins.',
      gcpDesc: 'Object Versioning keeps previous iterations indexed by Generation Numbers. Retention Policies establish duration limits to enforce bucket-level WORM. Object temporary or legal holds lock individual items until explicitly cleared.',
    },
    {
      title: '📈 Storage Lifecycle Cost Optimizations',
      tab: 'storage' as const,
      awsDesc: 'S3 standard is optimized for active files. Standard-IA (30-day min) and Glacier IR (90-day min) provide millisecond retrievals. Glacier FR (90-day min, minutes/hours rehydrate) and Deep Archive (180-day min, 12-48 hr rehydrate) offer offline storage.',
      azureDesc: 'Hot tier is for active files, Cool tier is for infrequent access (30-day min), Cold is for longer-term infrequent (90-day min), and Archive is offline (180-day min) requiring Standard (1-15 hr) or High (<1 hr) priority rehydration.',
      gcpDesc: 'GCS Standard is for hot data. Nearline (30-day min) and Coldline (90-day min) offer cost optimization. GCS Archive (365-day min) is the cheapest tier. Crucially, GCS Archive remains fully online and accessible in milliseconds; no rehydration delay.',
    },
    {
      title: '🌐 Network Interfaces & Endpoints',
      tab: 'networking' as const,
      awsDesc: 'Private subnets access S3 natively using Gateway VPC Endpoints, adding regional public prefix lists (e.g. pl-63a) directly to Route Tables at zero cost. Interface VPC Endpoints (PrivateLink) place a private IP inside VPC subnets for cross-network access.',
      azureDesc: 'Azure uses VNet Service Endpoints to optimize routing by extending subnet identity to storage. Private Endpoints (Private Link) allocate a private IP inside the virtual network subnet to connect securely via private routes.',
      gcpDesc: 'VPC resources access GCS privately using Private Google Access. Private Service Connect (PSC) routes GCS traffic over internal IP endpoints inside user subnets, allowing secure cross-network access to Google APIs.',
    },
    {
      title: '⚡ Acceleration, Replication & GRS redundancy',
      tab: 'transfer' as const,
      awsDesc: 'Replication copies objects asynchronously in the Same Region (SRR) or Cross Region (CRR). Transfer Acceleration utilizes CloudFront Edge location servers to speed uploads by routing bytes over AWS\'s private WAN backbone.',
      azureDesc: 'Redundancy formats include LRS (local), ZRS (zonal), and GRS (replicates to secondary region). Azure Front Door or Object Replication rules copy blobs asynchronously between accounts/containers across regions.',
      gcpDesc: 'GCS provides Single-region, Dual-region (asynchronous replication across 2 regions), and Multi-region (geographic area replication) options. Dual-region supports Turbo Replication (15-min SLA). Upload Edge POPs route bytes onto Google private WAN.',
    },
    {
      title: '⚙️ Events, Storage Inventory & Batch Tasks',
      tab: 'operations' as const,
      awsDesc: 'Event Notifications trigger SQS, SNS, or Lambda when writes complete. Batch Operations coordinate job manifests (generated by Athena SQL or S3 Inventory) to run bulk modifications, copies, or locks over billions of objects.',
      azureDesc: 'Event Grid publishes blob triggers to Webhooks or Azure Functions. Storage Tasks execute serverless lifecycle tasks (tiering, tagging, locking) across billions of blobs in parallel based on user-defined query rules.',
      gcpDesc: 'Pub/Sub notifications push real-time events to topics, triggering Cloud Functions. Storage Transfer Service schedules large-scale transfers from other clouds, and Storage Insights generates inventory logs daily.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Introduction Card */}
      <div className="s3-card">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 font-display">
          ⚖️ Multi-Cloud Storage Comparison Dashboard
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-sans font-semibold">
          Cloud architects must map storage semantics across providers. Below is a comprehensive cross-provider mapping of storage concepts, durability profiles, replication targets, security architectures, and automation layers.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="s3-card overflow-x-auto" style={{ padding: '0px' }}>
        <table className="acad-table" style={{ margin: 0, width: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 16px', fontSize: '12.5px', minWidth: '130px' }}>Concept</th>
              <th style={{ padding: '12px 16px', fontSize: '12.5px', color: '#f97316' }}>🧡 AWS S3</th>
              <th style={{ padding: '12px 16px', fontSize: '12.5px', color: '#3b82f6' }}>💙 Azure Blob</th>
              <th style={{ padding: '12px 16px', fontSize: '12.5px', color: '#0f9d58' }}>💚 Google Cloud Storage</th>
            </tr>
          </thead>
          <tbody>
            {comparisonRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30" style={{ borderBottom: '1px solid var(--s3-card-border)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', border: 'none' }}>
                  {row.icon}
                  {row.concept}
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--color-text-primary)' }}>
                  {row.aws}
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--color-text-primary)' }}>
                  {row.azure}
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--color-text-primary)' }}>
                  {row.gcp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Concept Breakdown Grid */}
      <div className="s3-sec">Side-by-Side Module Breakdowns &amp; Interactive Demos</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {comparativeDetails.map((detail, idx) => (
          <div key={idx} className="s3-card flex flex-col justify-between" style={{ borderTop: '4px solid var(--theme-color)' }}>
            <div>
              <h4 style={{ fontWeight: 'bold', fontSize: '13.5px', color: 'var(--color-text-primary)', marginBottom: '10px' }}>
                {detail.title}
              </h4>
              
              <div className="space-y-3 mt-2" style={{ fontSize: '11.5px' }}>
                <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(249, 115, 22, 0.05)', borderLeft: '3px solid #f97316' }}>
                  <span style={{ fontWeight: 'bold', color: '#ea580c', display: 'block', fontSize: '10.5px' }}>AWS S3 Approach:</span>
                  <p style={{ marginTop: '3px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>{detail.awsDesc}</p>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '3px solid #3b82f6' }}>
                  <span style={{ fontWeight: 'bold', color: '#2563eb', display: 'block', fontSize: '10.5px' }}>Azure Blob Approach:</span>
                  <p style={{ marginTop: '3px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>{detail.azureDesc}</p>
                </div>
                <div style={{ padding: '8px 10px', borderRadius: '6px', background: 'rgba(15, 157, 88, 0.05)', borderLeft: '3px solid #0f9d58' }}>
                  <span style={{ fontWeight: 'bold', color: '#0b7a44', display: 'block', fontSize: '10.5px' }}>Google Cloud Approach:</span>
                  <p style={{ marginTop: '3px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>{detail.gcpDesc}</p>
                </div>
              </div>
            </div>

            {/* Launch Demo Shortcuts */}
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <button 
                onClick={() => onNavigateToDemo('aws', detail.tab)} 
                className="s3-btn text-[11px]" 
                style={{ flex: '1 1 30%', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                🧡 AWS
              </button>
              <button 
                onClick={() => onNavigateToDemo('azure', detail.tab)} 
                className="s3-btn text-[11px]"
                style={{ flex: '1 1 30%', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                💙 Azure
              </button>
              <button 
                onClick={() => onNavigateToDemo('gcp', detail.tab)} 
                className="s3-btn text-[11px]"
                style={{ flex: '1 1 30%', padding: '4px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
              >
                💚 GCP
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Extensibility Advice Alert */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-[12px] leading-relaxed text-slate-400 font-semibold space-y-2">
        <span className="text-white font-extrabold flex items-center gap-1.5 text-[13px]">
          <Info className="w-4 h-4 text-purple-400" /> Extensibility Architecture: Dynamic Multi-Cloud Models
        </span>
        <p>
          This comparative dashboard is fully data-driven. Adding Google Cloud (GCS) expanded the system seamlessly by appending GCS definitions to <code>cloudStorageProviders.ts</code> and updating this comparison matrix layout. The visualizer translation engine reads these parameters directly to render the selected cloud in real-time.
        </p>
      </div>
    </div>
  );
}

// Dummy helper subcomponents to resolve local visualizer references
function CpuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="16" height="16" x="4" y="4" rx="2"/>
      <rect width="6" height="6" x="9" y="9" rx="1"/>
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3"/>
    </svg>
  );
}

function TerminalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="4 17 10 11 4 5"/>
      <line x1="12" x2="20" y1="19" y2="19"/>
    </svg>
  );
}
