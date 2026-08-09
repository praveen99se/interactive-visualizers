import React from 'react';
import { 
  Activity, 
  FileText, 
  Bell, 
  Radio, 
  Shield, 
  Workflow,
  Layers
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface CloudWatchMAndEventsComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'logs' | 'metrics' | 'alarms' | 'insights' | 'events' | 'architect') => void;
}

export default function CloudWatchMAndEventsComparativeView({ onNavigateToDemo }: CloudWatchMAndEventsComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Centralized Log Aggregation',
      aws: 'Amazon CloudWatch Logs (Log Groups, Log Streams, Live Tail, Infrequent Access class)',
      azure: 'Azure Monitor Log Analytics Workspace (Kusto Tables, Basic vs Analytics log tier, DCR)',
      gcp: 'Google Cloud Logging (Log Router, Log Buckets, Storage/BigQuery/PubSub sinks)',
      icon: <FileText className="w-4 h-4 text-blue-500" />
    },
    {
      concept: 'Metrics & Performance Telemetry',
      aws: 'CloudWatch Metrics (1-min standard & 1-sec High-Res, Metric Streams via Firehose)',
      azure: 'Azure Monitor Metrics (Platform & Custom metrics, Managed Prometheus, Metrics Stream)',
      gcp: 'Google Cloud Monitoring (System, Custom & OpenTelemetry metrics, Managed Prometheus)',
      icon: <Activity className="w-4 h-4 text-blue-500" />
    },
    {
      concept: 'Alerting & Action Triggers',
      aws: 'CloudWatch Alarms (Static threshold, Anomaly detection, Composite Alarms, SNS / Auto Recovery)',
      azure: 'Azure Monitor Alerts (Dynamic thresholds, KQL Log alerts, Action Groups, Runbooks)',
      gcp: 'Cloud Monitoring Alerting Policies (Forecast/Thresholds, Notification Channels, PagerDuty)',
      icon: <Bell className="w-4 h-4 text-blue-500" />
    },
    {
      concept: 'Log Query Engine & Analytics',
      aws: 'CloudWatch Logs Insights (Specialized CloudWatch query syntax: fields, filter, stats, sort)',
      azure: 'Azure Log Analytics (Kusto Query Language - KQL: where, summarize, render, join)',
      gcp: 'Cloud Logging Log Analytics (Powered by Google BigQuery SQL engine: SELECT, WHERE, GROUP BY)',
      icon: <Workflow className="w-4 h-4 text-blue-500" />
    },
    {
      concept: 'Event Routing & System Automation',
      aws: 'Amazon EventBridge / CloudWatch Events (Default & Custom Buses, Schema Registry, 25+ AWS targets)',
      azure: 'Azure Event Grid (System & Custom Topics, Event Subscriptions, Azure Functions/Webhooks)',
      gcp: 'Google Cloud Eventarc (Cloud Audit Logs & Pub/Sub event triggers, Cloud Run/GKE targets)',
      icon: <Radio className="w-4 h-4 text-blue-500" />
    },
    {
      concept: 'Application APM & Tracing',
      aws: 'AWS X-Ray & CloudWatch Application Signals (ServiceLens, OpenTelemetry Collector)',
      azure: 'Azure Application Insights (Application Map, End-to-end transaction tracing, Live Metrics)',
      gcp: 'Google Cloud Trace, Cloud Profiler & Cloud Debugger (OpenTelemetry Collector)',
      icon: <Shield className="w-4 h-4 text-blue-500" />
    },
    {
      concept: 'Security Audit & Compliance',
      aws: 'AWS CloudTrail (Management & Data events) + AWS Config (Resource state compliance rules)',
      azure: 'Azure Activity Log (Subscription operations) + Azure Policy (Compliance & Remediation)',
      gcp: 'Google Cloud Audit Logs (Admin Activity, Data Access) + Security Command Center (SCC)',
      icon: <Layers className="w-4 h-4 text-blue-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'logs' | 'alarms' | 'events' | 'architect'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '📊 Centralized Logging & Log Analytics Engines',
      tab: 'logs',
      awsDesc: 'CloudWatch Logs ingests application and system logs via CloudWatch Agent. CloudWatch Logs Insights allows querying log groups using structured commands (filter, stats, sort, parse) with sub-second execution.',
      azureDesc: 'Azure Log Analytics Workspaces aggregate logs across Azure resources and Azure Monitor Agent (AMA). Uses Kusto Query Language (KQL) for powerful joins, aggregations, and visual chart rendering.',
      gcpDesc: 'Google Cloud Logging streams logs through Log Router to Log Buckets, BigQuery, or Pub/Sub. Cloud Logging Log Analytics allows running standard SQL queries directly over log data.',
    },
    {
      title: '🔔 Metric Threshold Alarms & Automated Remediation',
      tab: 'alarms',
      awsDesc: 'CloudWatch Alarms monitor metrics or math expressions, triggering SNS topics, Auto Scaling policies, or EC2 recovery actions when state transitions from OK ➔ ALARM.',
      azureDesc: 'Azure Monitor Alerts evaluate metric thresholds or KQL log queries at regular intervals, invoking Action Groups to send emails, SMS, or trigger Azure Automation Runbooks and Logic Apps.',
      gcpDesc: 'Cloud Monitoring Alerting Policies continuously evaluate metric conditions, triggering Incident Manager workflows and sending alerts to PagerDuty, Slack, or Webhooks.',
    },
    {
      title: '⚡ Event Routing & Serverless Event Bus Automation',
      tab: 'events',
      awsDesc: 'Amazon EventBridge acts as a serverless event bus that ingests real-time events from AWS services, SaaS apps, or custom producers, matching content rules to trigger 25+ AWS target endpoints.',
      azureDesc: 'Azure Event Grid provides high-throughput event routing using publish-subscribe models across System Topics and Custom Topics, routing events to Azure Functions, Logic Apps, or Webhooks.',
      gcpDesc: 'Google Cloud Eventarc routes events from Cloud Audit Logs, Pub/Sub, or custom sources directly to Cloud Run, GKE, or Workflows with unified CloudEvents formatting.',
    },
    {
      title: '🛡️ Security Audit Logging & Compliance Governance',
      tab: 'architect',
      awsDesc: 'AWS CloudTrail captures all API calls across your AWS account for security audits, while AWS Config continuously monitors resource configuration state and evaluates compliance rules.',
      azureDesc: 'Azure Activity Log tracks control-plane management operations at the subscription level, while Azure Policy enforces compliance rules and automatically remediates non-compliant resources.',
      gcpDesc: 'Google Cloud Audit Logs records Admin Activity and Data Access events across Google Cloud projects, integrated with Security Command Center (SCC) for continuous risk governance.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side Observability &amp; Monitoring Terminology Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 Amazon CloudWatch</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure Monitor</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP Cloud Monitoring &amp; Logging</th>
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
