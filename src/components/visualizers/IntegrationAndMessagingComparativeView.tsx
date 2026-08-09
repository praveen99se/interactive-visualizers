import React from 'react';
import { 
  MessageSquare, 
  Radio, 
  GitFork, 
  Workflow, 
  Shield, 
  Zap
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface IntegrationAndMessagingComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'concept' | 'sqs' | 'sns' | 'eventbridge' | 'stepfunctions' | 'sim') => void;
}

export default function IntegrationAndMessagingComparativeView({ onNavigateToDemo }: IntegrationAndMessagingComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Decoupled Queue Service',
      aws: 'Amazon SQS (Standard & FIFO Queues, DLQ, Visibility Timeout)',
      azure: 'Azure Queue Storage / Azure Service Bus Queues (Sessions, DLQ)',
      gcp: 'Google Cloud Pub/Sub (Pull subscriptions, Dead Letter Topics, Replay)',
      icon: <MessageSquare className="w-4 h-4 text-orange-500" />
    },
    {
      concept: 'Pub/Sub Fan-Out Messaging',
      aws: 'Amazon SNS (Simple Notification Service - Push to SQS/Lambda/HTTP)',
      azure: 'Azure Service Bus Topics & Subscriptions (SqlFilter rules)',
      gcp: 'Google Cloud Pub/Sub (Topics & Push/Pull Subscriptions, Multi-region)',
      icon: <Radio className="w-4 h-4 text-orange-500" />
    },
    {
      concept: 'Serverless Event Bus & Filtering',
      aws: 'Amazon EventBridge (Schema Registry & Custom Event Buses)',
      azure: 'Azure Event Grid (System & Custom Topics, Event Domains)',
      gcp: 'Google Cloud Eventarc (Cloud Audit Logs & Event routing to Cloud Run)',
      icon: <GitFork className="w-4 h-4 text-orange-500" />
    },
    {
      concept: 'High-Throughput Event Streaming',
      aws: 'Amazon Kinesis Data Streams / MSK (Managed Kafka) & Firehose',
      azure: 'Azure Event Hubs (Kafka protocol compatible, Event Hubs Capture)',
      gcp: 'Google Cloud Pub/Sub Streams / Managed Service for Apache Kafka',
      icon: <Zap className="w-4 h-4 text-orange-500" />
    },
    {
      concept: 'Visual Workflow Orchestration',
      aws: 'AWS Step Functions (Standard & Express State Machines)',
      azure: 'Azure Logic Apps (500+ connectors) / Durable Functions',
      gcp: 'Google Cloud Workflows (YAML/JSON state orchestration)',
      icon: <Workflow className="w-4 h-4 text-orange-500" />
    },
    {
      concept: 'Managed Message Broker',
      aws: 'Amazon MQ (Managed Apache ActiveMQ & RabbitMQ)',
      azure: 'Azure Service Bus (AMQP 1.0) / Azure Event Grid MQTT broker',
      gcp: 'GCP Managed Service for RabbitMQ / Pub/Sub Lite',
      icon: <Shield className="w-4 h-4 text-orange-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'sqs' | 'sns' | 'sim' | 'concept'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '✉️ Asynchronous Queuing & Message Buffer Topologies',
      tab: 'sqs',
      awsDesc: 'Amazon SQS decouples microservices by storing messages until processed. SQS FIFO guarantees exact single delivery and message group ordering.',
      azureDesc: 'Azure Service Bus Queues support enterprise messaging features like transactions, sessions, duplicate detection, and auto-dead-lettering.',
      gcpDesc: 'Google Cloud Pub/Sub offers global event ingestion with zero provisioning. Messages are delivered to push endpoints or pull workers asynchronously with high throughput.',
    },
    {
      title: '📡 Pub/Sub Fan-Out & Content-Based Message Filtering',
      tab: 'sns',
      awsDesc: 'Amazon SNS fans out messages to multiple SQS queues, Lambda functions, or HTTP webhooks. SNS Message Filtering evaluates JSON attributes before dispatching.',
      azureDesc: 'Azure Service Bus Topics fan out messages to multiple Subscriptions. SqlFilter rules evaluate message properties to filter messages per subscriber.',
      gcpDesc: 'Google Cloud Pub/Sub Topics distribute messages to multiple Subscriptions. Filter expressions route messages based on attributes without modifying code.',
    },
    {
      title: '⚡ Event Streaming & High-Volume Telemetry Pipelines',
      tab: 'sim',
      awsDesc: 'Amazon Kinesis Data Streams ingests streaming telemetry via partition keys. Kinesis Firehose buffers streams and delivers compressed Parquet files to S3/OpenSearch.',
      azureDesc: 'Azure Event Hubs captures real-time data streams into Azure Blob Storage or Azure Data Lake using Event Hubs Capture with native Apache Kafka protocol support.',
      gcpDesc: 'Google Cloud Pub/Sub Streams stream data into Dataflow or BigQuery for real-time analytics with autoscale streaming capacity.',
    },
    {
      title: '🔄 Visual State Machine & Workflow Orchestration',
      tab: 'concept',
      awsDesc: 'AWS Step Functions orchestrate complex microservice workflows using Amazon States Language (ASL) with visual debugging and automatic error handling.',
      azureDesc: 'Azure Logic Apps provides a visual drag-and-drop workflow editor with 500+ connectors to automate enterprise SaaS integrations without code.',
      gcpDesc: 'Google Cloud Workflows links Cloud Run services, Cloud Functions, and external APIs together using concise YAML or JSON step definitions.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side Integration &amp; Messaging Terminology Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 AWS (SQS / SNS / EventBridge)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure (Service Bus / Event Grid)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP (Cloud Pub/Sub / Eventarc)</th>
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
