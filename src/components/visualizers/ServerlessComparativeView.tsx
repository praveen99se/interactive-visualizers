import React from 'react';
import { 
  Zap, 
  Clock, 
  Cpu, 
  Shield, 
  Activity,
  Layers
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface ServerlessComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'overview' | 'concurrency' | 'snapstart' | 'stream' | 'architect' | 'sim') => void;
}

export default function ServerlessComparativeView({ onNavigateToDemo }: ServerlessComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Serverless Function Service',
      aws: 'AWS Lambda (Zip package or OCI Container Image)',
      azure: 'Azure Functions (Flex Consumption / Premium Plan)',
      gcp: 'Google Cloud Functions (2nd Gen) / Cloud Run',
      icon: <Zap className="w-4 h-4 text-amber-500" />
    },
    {
      concept: 'Cold Start Mitigation',
      aws: 'Lambda SnapStart (MicroVM Snapshot) & Provisioned Concurrency',
      azure: 'Azure Functions Pre-warmed Instances & Always Ready instances',
      gcp: 'Cloud Functions Minimum Instances (Min Instances setting)',
      icon: <Clock className="w-4 h-4 text-amber-500" />
    },
    {
      concept: 'Event Source Integrations',
      aws: 'Event Source Mapping (DynamoDB Streams, Kinesis, SQS, MSK)',
      azure: 'Azure Functions Triggers & Bindings (Blob, Cosmos DB, Event Hubs)',
      gcp: 'Eventarc Triggers (Pub/Sub, Cloud Storage, Audit Logs)',
      icon: <Layers className="w-4 h-4 text-amber-500" />
    },
    {
      concept: 'Max Timeout & Memory',
      aws: 'Up to 15 minutes timeout; 128 MB to 10,240 MB RAM (6 vCPUs)',
      azure: 'Up to 60 minutes (Flex/Premium); 2,048 MB to 12,288 MB RAM',
      gcp: 'Up to 60 minutes (Cloud Run / 2nd Gen); 128 MB to 32,768 MB RAM',
      icon: <Cpu className="w-4 h-4 text-amber-500" />
    },
    {
      concept: 'VPC / Private Network Access',
      aws: 'Lambda VPC Dual-Stack ENI Attachment',
      azure: 'VNet Integration / Private Endpoints',
      gcp: 'Serverless VPC Access Connector / Direct VPC Egress',
      icon: <Shield className="w-4 h-4 text-amber-500" />
    },
    {
      concept: 'Response Streaming',
      aws: 'AWS Lambda Response Streaming (AWS SDK streamifyResponse)',
      azure: 'Azure Functions SignalR / HTTP Output Streaming',
      gcp: 'Cloud Run HTTP/2 & gRPC Server-Sent Events (SSE) streaming',
      icon: <Activity className="w-4 h-4 text-amber-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'concurrency' | 'snapstart'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '⚡ Concurrency Models & Event Driven Triggers',
      tab: 'concurrency',
      awsDesc: 'AWS Lambda scales per-request, allocating 1 execution environment per concurrent request. Reserved Concurrency guarantees limits while Provisioned Concurrency eliminates cold starts entirely.',
      azureDesc: 'Azure Functions Flex Consumption dynamically scales instances based on incoming triggers (Service Bus, Event Hubs, Cosmos DB DB streams) with per-function concurrency limits.',
      gcpDesc: 'Google Cloud Functions (2nd Gen) is built on Cloud Run and Knative, allowing single function instances to handle up to 1,000 concurrent HTTP requests simultaneously.',
    },
    {
      title: '🚀 MicroVM Snapshots & Cold Start Elimination',
      tab: 'snapstart',
      awsDesc: 'Lambda SnapStart for Java/Python initializes function code at deployment time, takes a Firecracker MicroVM snapshot, and restores initialized execution environments in < 200 ms.',
      azureDesc: 'Azure Functions Premium plan keeps pre-warmed instances running constantly, ensuring zero cold starts for enterprise web APIs and scheduled background jobs.',
      gcpDesc: 'Cloud Functions 2nd Gen utilizes Min Instances settings to keep initialized container runtimes warm at edge locations worldwide, preventing cold starts during traffic spikes.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side Serverless Compute Terminology Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 AWS Lambda</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure Functions</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP Cloud Functions / Cloud Run</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, idx) => (
                <tr 
                  key={idx} 
                  style={{ 
                    borderBottom: '1px solid var(--color-border-tertiary)', 
                    transition: 'background 0.2s' 
                  }}
                  className="hover:bg-slate-50 dark:hover:bg-slate-900/50"
                >
                  <td style={{ padding: '10px 12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-primary)' }}>
                    {row.icon}
                    {row.concept}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>{row.aws}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>{row.azure}</td>
                  <td style={{ padding: '10px 12px', color: 'var(--color-text-secondary)' }}>{row.gcp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Concept Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {comparativeDetails.map((detail, idx) => (
          <div 
            key={idx} 
            className="asg-card flex flex-col justify-between" 
            style={{ 
              padding: '16px', 
              border: '1px solid var(--asg-card-border)', 
              background: 'var(--asg-card-bg)',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 'bold', color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                {detail.title}
              </div>
              <div className="space-y-3" style={{ fontSize: '11.5px', lineHeight: '1.45' }}>
                <div style={{ paddingLeft: '8px', borderLeft: '2.5px solid #FF9900' }}>
                  <strong style={{ color: '#FF9900' }}>AWS:</strong> <span style={{ color: 'var(--color-text-secondary)' }}>{detail.awsDesc}</span>
                </div>
                <div style={{ paddingLeft: '8px', borderLeft: '2.5px solid #0078D4' }}>
                  <strong style={{ color: '#0078D4' }}>Azure:</strong> <span style={{ color: 'var(--color-text-secondary)' }}>{detail.azureDesc}</span>
                </div>
                <div style={{ paddingLeft: '8px', borderLeft: '2.5px solid #0F9D58' }}>
                  <strong style={{ color: '#0F9D58' }}>GCP:</strong> <span style={{ color: 'var(--color-text-secondary)' }}>{detail.gcpDesc}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }} className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <button 
                onClick={() => onNavigateToDemo('aws', detail.tab)}
                className="asg-btn text-[10px] py-1 px-2.5 flex items-center gap-1"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                🧡 Launch AWS Demo
              </button>
              <button 
                onClick={() => onNavigateToDemo('azure', detail.tab)}
                className="asg-btn text-[10px] py-1 px-2.5 flex items-center gap-1"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                💙 Launch Azure Demo
              </button>
              <button 
                onClick={() => onNavigateToDemo('gcp', detail.tab)}
                className="asg-btn text-[10px] py-1 px-2.5 flex items-center gap-1"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                💚 Launch GCP Demo
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
