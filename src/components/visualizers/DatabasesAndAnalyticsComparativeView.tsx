import React from 'react';
import { 
  Database, 
  BarChart3, 
  Cpu, 
  Workflow, 
  Search,
  HardDrive
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface DatabasesAndAnalyticsComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'dynamo' | 'redshift' | 'emr' | 'opensearch' | 'glue' | 'architect') => void;
}

export default function DatabasesAndAnalyticsComparativeView({ onNavigateToDemo }: DatabasesAndAnalyticsComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Global NoSQL Database',
      aws: 'Amazon DynamoDB (Global Tables, Single-digit ms, On-Demand)',
      azure: 'Azure Cosmos DB (Multi-region write, NoSQL/MongoDB/Cassandra APIs)',
      gcp: 'Google Cloud Bigtable / Cloud Firestore',
      icon: <Database className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Serverless Data Warehouse',
      aws: 'Amazon Redshift (Serverless & Provisioned RA3 clusters)',
      azure: 'Azure Synapse Analytics (Dedicated & Serverless SQL pools)',
      gcp: 'Google BigQuery (Serverless, PB-scale SQL analysis)',
      icon: <BarChart3 className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Big Data Apache Spark / Hadoop',
      aws: 'Amazon EMR (Elastic MapReduce - EC2 & EKS)',
      azure: 'Azure HDInsight / Azure Databricks',
      gcp: 'Google Cloud Dataproc (Serverless Spark & Hadoop clusters)',
      icon: <Cpu className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Distributed Log Search & Analytics',
      aws: 'Amazon OpenSearch Service (Elasticsearch compatible)',
      azure: 'Azure Data Explorer (Kusto Query Language KQL) / Azure AI Search',
      gcp: 'Google Cloud Logging Analytics (BigQuery engine) / Vertex AI Search',
      icon: <Search className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'Serverless Data Integration & ETL',
      aws: 'AWS Glue (Data Catalog, Spark ETL jobs, Crawlers)',
      azure: 'Azure Data Factory (Pipelines, Data Flows, Integration Runtimes)',
      gcp: 'Google Cloud Dataflow (Apache Beam) / Cloud Data Fusion',
      icon: <Workflow className="w-4 h-4 text-emerald-500" />
    },
    {
      concept: 'In-Memory Caching Accelerator',
      aws: 'DynamoDB Accelerator (DAX - microsecond read cache)',
      azure: 'Azure Cosmos DB Integrated Cache (In-memory query cache)',
      gcp: 'Cloud Bigtable App Profiles & Memorystore cache',
      icon: <HardDrive className="w-4 h-4 text-emerald-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'dynamo' | 'redshift'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '⚡ Distributed NoSQL & Multi-Region Replication',
      tab: 'dynamo',
      awsDesc: 'DynamoDB partitions data automatically across SSD arrays. Global Tables provide multi-region active-active replication with microsecond reads via DAX.',
      azureDesc: 'Cosmos DB offers 99.999% availability with multi-region writes, custom consistency levels (Strong, Bounded Staleness, Session, Eventual), and SLA-backed low latency.',
      gcpDesc: 'Google Cloud Bigtable delivers high-throughput NoSQL storage built on Colossus file system, scaling to millions of reads/writes per second with sub-10ms latency.',
    },
    {
      title: '📊 Serverless Cloud Data Warehousing',
      tab: 'redshift',
      awsDesc: 'Amazon Redshift Serverless automatically provisions and scales data warehouse capacity (RPU) to execute complex SQL analytical queries over petabytes of data.',
      azureDesc: 'Azure Synapse Analytics unifies enterprise data warehousing and big data analytics, querying relational and non-relational data with serverless SQL pools.',
      gcpDesc: 'Google BigQuery is a serverless, highly scalable enterprise data warehouse with built-in ML, geospatial analysis, and BI Engine in-memory analysis.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side Databases & Big Data Analytics Terminology Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 AWS (DynamoDB / Redshift)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure (Cosmos DB / Synapse)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP (Bigtable / BigQuery)</th>
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
