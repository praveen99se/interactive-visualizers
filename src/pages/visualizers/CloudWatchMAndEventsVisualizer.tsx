import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  Copy,
  Check,
  Zap,
  Activity,
  Terminal,
  Shield,
  Eye,
  Sliders,
  Play,
  RefreshCw,
  Bell,
  CheckCircle,
  AlertTriangle,
  Database,
  FileText,
  Workflow,
  Search,
  Send,
  Download,
  Info
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import CloudWatchMAndEventsComparativeView from '../../components/visualizers/CloudWatchMAndEventsComparativeView';
import UniqueCloudWatchMAndEventsFeatures from '../../components/visualizers/UniqueCloudWatchMAndEventsFeatures';

type TabType = 'notebook' | 'intro' | 'logs' | 'metrics' | 'eventbridge' | 'compliance' | 'matrix' | 'unique';

interface LogRow {
  timestamp: string;
  source: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  requestId: string;
}

interface MetricPoint {
  time: string;
  cpu: number;
}

interface CloudWatchMAndEventsVisualizerProps {
  provider?: 'aws' | 'azure' | 'gcp' | 'comparative';
  setProvider?: (provider: 'aws' | 'azure' | 'gcp' | 'comparative') => void;
}

export default function CloudWatchMAndEventsVisualizer({ provider = 'aws', setProvider }: CloudWatchMAndEventsVisualizerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('notebook');

  // Visual Architect Notes & Theories Academy State
  const [selectedNote, setSelectedNote] = useState<string>('logs_metrics_traces');
  const [expandedCategory, setExpandedCategory] = useState<string>('obs_fundamentals');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Interactive Log Estimator State
  const [nbLogGbPerDay, setNbLogGbPerDay] = useState<number>(20);
  const [nbRetentionDays, setNbRetentionDays] = useState<number>(30);
  const [nbMetricCount, setNbMetricCount] = useState<number>(100);

  const isComparative = provider === 'comparative';
  const isAzure = provider === 'azure';
  const isGcp = provider === 'gcp';

  const t = (text: string) => {
    if (provider === 'azure') {
      return text
        .replace(/Amazon CloudWatch/gi, 'Azure Monitor')
        .replace(/CloudWatch Logs/gi, 'Azure Log Analytics Workspace')
        .replace(/CloudWatch/g, 'Azure Monitor')
        .replace(/EventBridge/g, 'Azure Event Grid')
        .replace(/CloudTrail/g, 'Azure Activity Log')
        .replace(/AWS Config/gi, 'Azure Policy')
        .replace(/SNS/g, 'Azure Action Group')
        .replace(/EC2/g, 'Azure VM')
        .replace(/S3 Bucket/gi, 'Azure Blob Storage')
        .replace(/LogGroup/g, 'Log Analytics Table')
        .replace(/Auto Scaling/gi, 'Azure VMSS AutoScale');
    }
    if (provider === 'gcp') {
      return text
        .replace(/Amazon CloudWatch/gi, 'Google Cloud Monitoring & Logging')
        .replace(/CloudWatch Logs/gi, 'Google Cloud Logging')
        .replace(/CloudWatch/g, 'Cloud Monitoring')
        .replace(/EventBridge/g, 'Google Cloud Eventarc')
        .replace(/CloudTrail/g, 'Cloud Audit Logs')
        .replace(/AWS Config/gi, 'Security Command Center (SCC)')
        .replace(/SNS/g, 'Pub/Sub Notification Channel')
        .replace(/EC2/g, 'Compute Engine Instance')
        .replace(/S3 Bucket/gi, 'Google Cloud Storage Bucket')
        .replace(/LogGroup/g, 'Log Bucket')
        .replace(/Auto Scaling/gi, 'MIG AutoScaler');
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
        if (node.type === 'pre' || node.type === 'code' || (node.props && (node.props.className === 'cw-terminal' || node.props.className === 'cw-log-box'))) {
          return node;
        }
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

  const handleNavigateToDemo = (prov: 'aws' | 'azure' | 'gcp', tab: any) => {
    if (setProvider) {
      setProvider(prov);
    }
    setActiveTab(tab === 'insights' ? 'logs' : tab === 'events' ? 'eventbridge' : tab === 'architect' ? 'intro' : tab);
  };
  const [isDark, setIsDark] = useState<boolean>(
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    // Check initial state
    setIsDark(document.documentElement.classList.contains('dark'));

    // Set up observer to watch for theme switches on <html> element
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // ==========================================
  // TAB 1 STATE: Comparison Matrix Toggle
  // ==========================================
  const [selectedComp, setSelectedComp] = useState<'cloudwatch' | 'cloudtrail' | 'config'>('cloudwatch');

  // ==========================================
  // TAB 2 STATE: Logs, Unified Agent & Insights
  // ==========================================
  const [logSource, setLogSource] = useState<'ec2' | 'lambda' | 'rds' | 'syslog'>('ec2');
  const [agentConfigured, setAgentConfigured] = useState<boolean>(true);
  const [logsState, setLogsState] = useState<'idle' | 'ingesting' | 'insights' | 'exported'>('idle');
  const [logsList, setLogsList] = useState<LogRow[]>([]);
  const [logTraceLogs, setLogTraceLogs] = useState<string[]>([]);
  const [insightsQuery, setInsightsQuery] = useState<string>('filter-errors');
  const [insightsResults, setInsightsResults] = useState<any[]>([]);
  const [insightsRunning, setInsightsRunning] = useState<boolean>(false);
  const [subscriptionTarget, setSubscriptionTarget] = useState<'lambda' | 'kinesis' | 'opensearch'>('lambda');

  // ==========================================
  // TAB 3 STATE: Metrics, Metric Streams & Alarms
  // ==========================================
  const [metricSpikeActive, setSpikeActive] = useState<boolean>(false);
  const [alarmCpuThreshold, setAlarmCpuThreshold] = useState<number>(80);
  const [metricCpuHistory, setMetricCpuHistory] = useState<MetricPoint[]>([
    { time: '18:40', cpu: 42 },
    { time: '18:41', cpu: 48 },
    { time: '18:42', cpu: 39 },
    { time: '18:43', cpu: 45 },
    { time: '18:44', cpu: 41 },
    { time: '18:45', cpu: 52 },
    { time: '18:46', cpu: 46 }
  ]);
  const [alarmState, setAlarmState] = useState<'OK' | 'ALARM'>('OK');
  const [alarmLogs, setAlarmLogs] = useState<string[]>([]);
  const [alarmActiveState, setAlarmActiveState] = useState<'idle' | 'monitoring' | 'breached' | 'notified' | 'remediating'>('idle');
  const [metricStreamTarget, setMetricStreamTarget] = useState<'s3' | 'firehose' | 'datadog'>('s3');

  // ==========================================
  // TAB 4 STATE: EventBridge Event Routing
  // ==========================================
  const [eventSourceType, setEventSourceType] = useState<'ec2_state' | 's3_api' | 'custom_order'>('ec2_state');
  const [eventPayload, setEventPayload] = useState<string>('');
  const [routerState, setRouterState] = useState<'idle' | 'received' | 'evaluating' | 'routed' | 'completed'>('idle');
  const [routerLogs, setRouterLogs] = useState<string[]>([]);
  const [matchedRulesList, setMatchedRulesList] = useState<string[]>([]);

  // ==========================================
  // TAB 5 STATE: CloudTrail vs Config Compliance
  // ==========================================
  const [auditAction, setAuditAction] = useState<'delete_bucket' | 'open_s3_public' | 'terminate_ec2'>('open_s3_public');
  const [complianceState, setComplianceState] = useState<'idle' | 'api_call' | 'cloudtrail_log' | 'config_eval' | 'non_compliant' | 'remediating' | 'compliant'>('idle');
  const [complianceLogs, setComplianceLogs] = useState<string[]>([]);

  // ==========================================
  // TAB 6 STATE: Observability Comparison & Aggregation Map
  // ==========================================
  const [matrixTopic, setMatrixTopic] = useState<'sources' | 'agents' | 'subscriptions' | 'metricstreams' | 'aggregation'>('sources');
  const [matrixSimState, setMatrixSimState] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [matrixPolicyCorrect, setMatrixPolicyCorrect] = useState<boolean>(true);
  const [matrixLogs, setMatrixLogs] = useState<string[]>([]);

  // ==========================================
  // LOGS PIPELINE SIMULATION LOGIC
  // ==========================================
  const runLogIngestion = async () => {
    if (logsState !== 'idle') return;
    setLogsState('ingesting');
    setLogTraceLogs([]);
    setLogsList([]);

    const time = new Date().toLocaleTimeString();
    setLogTraceLogs(prev => [`[${time}] SOURCE: Detected stream initiation on source [${logSource.toUpperCase()}]`, ...prev]);

    if (logSource === 'ec2') {
      await new Promise(r => setTimeout(r, 600));
      setLogTraceLogs(prev => [`[${time}] AGENT: Unified CloudWatch Agent checking log paths (/var/log/nginx/access.log)...`, ...prev]);
      if (!agentConfigured) {
        setLogTraceLogs(prev => [`[${time}] 🚨 ERROR: Unified Agent is not configured! Log tracking paths are offline.`, ...prev]);
        setLogsState('idle');
        return;
      }
      await new Promise(r => setTimeout(r, 800));
      setLogTraceLogs(prev => [`[${time}] AGENT: Consolidating OS System Metrics (CPU, RAM, DiskIO) and parsing files...`, ...prev]);
    } else if (logSource === 'lambda') {
      await new Promise(r => setTimeout(r, 600));
      setLogTraceLogs(prev => [`[${time}] CONTEXT: Lambda Runtime environment spawned. Connecting stdout stream...`, ...prev]);
    } else {
      await new Promise(r => setTimeout(r, 600));
      setLogTraceLogs(prev => [`[${time}] ENGINE: DB transaction stream active. Collecting slow logs...`, ...prev]);
    }

    await new Promise(r => setTimeout(r, 800));
    setLogTraceLogs(prev => [`[${time}] GATEWAY: Push logs safely encrypted to CloudWatch API LogStream endpoint.`, ...prev]);

    // Populate simulated logs
    const mockLogs: LogRow[] = [
      { timestamp: '18:50:02', source: logSource, level: 'INFO', message: `TCP connection successfully established from 192.168.1.48:5032.`, requestId: 'req-9a1b2c' },
      { timestamp: '18:50:05', source: logSource, level: 'INFO', message: `Parsed API Token header, user authenticated successfully: Praveen.`, requestId: 'req-9a1b2c' },
      { timestamp: '18:50:08', source: logSource, level: 'WARN', message: `Database read query pool connections near 85% exhaustion limit.`, requestId: 'req-4c5d6e' },
      { timestamp: '18:50:11', source: logSource, level: 'ERROR', message: `SQL transaction failed: connection timeout occurred querying dw_sales_history.`, requestId: 'req-4c5d6e' },
      { timestamp: '18:50:14', source: logSource, level: 'INFO', message: `Client stream connection clean disconnect. Retrying keep-alive socket.`, requestId: 'req-7f8g9h' }
    ];
    setLogsList(mockLogs);
    setLogTraceLogs(prev => [
      `[${time}] COMPLETED: Ingested 5 log lines successfully. Created LogGroup: /aws/${logSource}/prod`,
      `[${time}] SUBSCRIPTION: Dispatched active subscription filters targeting [${subscriptionTarget.toUpperCase()}]`,
      ...prev
    ]);
    setLogsState('idle');
  };

  const triggerLogS3Export = async () => {
    if (logsList.length === 0) return;
    setLogsState('exported');
    const time = new Date().toLocaleTimeString();
    setLogTraceLogs(prev => [
      `[${time}] ✅ EXPORT EXECUTED: Dispatched CreateExportTask API.`,
      `[${time}] S3 EXPORT: Compressing logs inside S3 Bucket: s3://cw-logs-archive-prod/year=2026/`,
      `[${time}] POLICY: Enforcing destination KMS bucket key decryption rules...`,
      ...prev
    ]);
    await new Promise(r => setTimeout(r, 1200));
    setLogsState('idle');
  };

  const runInsightsQueryAction = async () => {
    if (logsList.length === 0) return;
    setInsightsRunning(true);
    setInsightsResults([]);
    await new Promise(r => setTimeout(r, 1500));

    if (insightsQuery === 'filter-errors') {
      const filtered = logsList.filter(log => log.level === 'ERROR' || log.level === 'WARN');
      setInsightsResults(filtered);
    } else if (insightsQuery === 'count-levels') {
      setInsightsResults([
        { level: 'INFO', count: 3 },
        { level: 'WARN', count: 1 },
        { level: 'ERROR', count: 1 }
      ]);
    } else {
      setInsightsResults(logsList);
    }
    setInsightsRunning(false);
  };

  // ==========================================
  // METRICS & ALARMS SIMULATION LOGIC
  // ==========================================
  useEffect(() => {
    const interval = setInterval(() => {
      setMetricCpuHistory(prev => {
        const lastVal = prev[prev.length - 1].cpu;
        let nextVal = lastVal;
        
        if (metricSpikeActive) {
          nextVal = Math.min(100, lastVal + Math.floor(Math.random() * 8) + 4);
        } else {
          nextVal = Math.max(10, lastVal + Math.floor(Math.random() * 12) - 6);
          if (nextVal > 70) nextVal -= 10;
        }

        const now = new Date();
        const timeStr = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
        const newHistory = [...prev, { time: timeStr, cpu: nextVal }].slice(-8);

        // Check alarm status
        if (nextVal > alarmCpuThreshold) {
          setAlarmState('ALARM');
        } else {
          setAlarmState('OK');
        }

        return newHistory;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [metricSpikeActive, alarmCpuThreshold]);

  useEffect(() => {
    if (alarmState === 'ALARM' && alarmActiveState === 'idle') {
      triggerAlarmFlow();
    } else if (alarmState === 'OK' && alarmActiveState !== 'idle') {
      resetAlarmFlow();
    }
  }, [alarmState]);

  const triggerAlarmFlow = async () => {
    setAlarmActiveState('monitoring');
    setAlarmLogs([]);
    const time = new Date().toLocaleTimeString();
    
    setAlarmLogs(prev => [`[${time}] 📈 MONITOR: CPU utilization breached threshold limits (> ${alarmCpuThreshold}%)`, prev].flat());
    await new Promise(r => setTimeout(r, 1000));
    
    setAlarmActiveState('breached');
    setAlarmLogs(prev => [`[${time}] 🚨 ALARM STATUS: Transitioning status state to [ALARM] (Evaluation period breached)`, prev].flat());
    await new Promise(r => setTimeout(r, 1200));

    setAlarmActiveState('notified');
    setAlarmLogs(prev => [
      `[${time}] 📡 ACTIONS: Invoking registered AWS notification hooks...`,
      `[${time}] SNS DISPATCH: Sent alert notification to Topic [SysopsAlerts] (Target Email & SMS)`,
      `[${time}] EVENTBRIDGE: Published high-severity alert payload to default bus`,
      prev
    ].flat());
    await new Promise(r => setTimeout(r, 1200));

    setAlarmActiveState('remediating');
    setAlarmLogs(prev => [
      `[${time}] ⚙️ AUTO-SCALING: Invoking EC2 Auto Scaling Target Tracking policy!`,
      `[${time}] AUTO-SCALING: Spinning up 2 additional m5.xlarge instances to balance compute pools...`,
      `[${time}] SSM DOCUMENT: Executing runbook AWS-Recovery-EC2Utilization`,
      prev
    ].flat());
    
    await new Promise(r => setTimeout(r, 1500));
    setSpikeActive(false); // Cooling down spike automatically
  };

  const resetAlarmFlow = () => {
    setAlarmActiveState('idle');
    const time = new Date().toLocaleTimeString();
    setAlarmLogs(prev => [`[${time}] 🟢 STATUS OK: Metric returned inside acceptable limits. State restored to OK.`, prev].flat());
  };

  // ==========================================
  // EVENTBRIDGE SCHEMA AND ROUTING LOGIC
  // ==========================================
  useEffect(() => {
    if (eventSourceType === 'ec2_state') {
      setEventPayload(JSON.stringify({
        "version": "0",
        "id": "71b29a8c-902c-499d-82d8-1c828df9a28c",
        "detail-type": "EC2 Instance State-change Notification",
        "source": "aws.ec2",
        "account": "123456789012",
        "time": "2026-05-30T13:21:40Z",
        "region": "us-east-1",
        "resources": ["arn:aws:ec2:us-east-1:123456789012:instance/i-09a8bc8172"],
        "detail": {
          "instance-id": "i-09a8bc8172",
          "state": "terminated"
        }
      }, null, 2));
    } else if (eventSourceType === 's3_api') {
      setEventPayload(JSON.stringify({
        "version": "0",
        "id": "e9a182bc-812a-49da-9c8d-192a8cf21892",
        "detail-type": "Object Created",
        "source": "aws.s3",
        "account": "123456789012",
        "time": "2026-05-30T13:22:15Z",
        "region": "us-east-1",
        "resources": ["arn:aws:s3:::prod-customer-invoice-vault"],
        "detail": {
          "bucket": { "name": "prod-customer-invoice-vault" },
          "object": { "key": "invoice-9824b.pdf", "size": 142095 }
        }
      }, null, 2));
    } else {
      setEventPayload(JSON.stringify({
        "version": "0",
        "id": "90d182cb-2ca1-432d-91ca-19283cf218ab",
        "detail-type": "CustomOrderPlacement",
        "source": "custom.app.orders",
        "account": "123456789012",
        "time": "2026-05-30T13:22:50Z",
        "region": "us-east-1",
        "detail": {
          "orderId": "order-8924b-us",
          "value": 4250.00,
          "category": "HighValueEnterprise",
          "autoApprove": true
        }
      }, null, 2));
    }
  }, [eventSourceType]);

  const runEventRouteSim = async () => {
    if (routerState !== 'idle') return;
    setRouterState('received');
    setRouterLogs([]);
    setMatchedRulesList([]);

    const time = new Date().toLocaleTimeString();
    setRouterLogs(prev => [`[${time}] INGEST: Event received on Default Event Bus. Serializing JSON schema...`, ...prev]);

    await new Promise(r => setTimeout(r, 1000));
    setRouterState('evaluating');
    setRouterLogs(prev => [`[${time}] ROUTER: Evaluating schema fields against registered Rule Patterns...`, ...prev]);

    await new Promise(r => setTimeout(r, 1200));
    setRouterState('routed');
    
    let matched: string[] = [];
    if (eventSourceType === 'ec2_state') {
      matched = ['Ec2TerminationAlert', 'AutoscalingSyncRule'];
      setMatchedRulesList(matched);
      setRouterLogs(prev => [
        `[${time}] 🎯 RULE MATCHED: "Ec2TerminationAlert" matched: source === "aws.ec2" && detail.state === "terminated"`,
        `[${time}] 🎯 RULE MATCHED: "AutoscalingSyncRule" matched: source === "aws.ec2"`,
        `[${time}] TARGET: Triggering AWS Lambda recovery executor...`,
        `[${time}] TARGET: Dispatched alarm event to SNS topic`,
        ...prev
      ]);
    } else if (eventSourceType === 's3_api') {
      matched = ['InvoiceIngestPipeline'];
      setMatchedRulesList(matched);
      setRouterLogs(prev => [
        `[${time}] 🎯 RULE MATCHED: "InvoiceIngestPipeline" matched: source === "aws.s3" && bucket.name === "prod-customer-invoice-vault"`,
        `[${time}] TARGET: Routing invoice key details to Step Functions workflow (State Machine: InvoiceProcessor)`,
        ...prev
      ]);
    } else {
      matched = ['HighValueOrderApproveAlert'];
      setMatchedRulesList(matched);
      setRouterLogs(prev => [
        `[${time}] 🎯 RULE MATCHED: "HighValueOrderApproveAlert" matched: source === "custom.app.orders" && detail.value > 1000`,
        `[${time}] TARGET: Invoking API Destination webhook to enterprise Salesforce CRM gateway`,
        `[${time}] TARGET: Triggering Slack Notify lambda connector`,
        ...prev
      ]);
    }

    await new Promise(r => setTimeout(r, 1000));
    setRouterState('completed');
    setRouterLogs(prev => [`[${time}] ✅ COMPLETED: Event safely matching and routed to registered targets.`, ...prev]);
  };

  const resetRouterSim = () => {
    setRouterState('idle');
    setRouterLogs([]);
    setMatchedRulesList([]);
  };

  // ==========================================
  // COMPLIANCE AUDITING (CLOUDTRAIL VS CONFIG)
  // ==========================================
  const triggerAuditAction = async () => {
    if (complianceState !== 'idle') return;
    setComplianceState('api_call');
    setComplianceLogs([]);

    const time = new Date().toLocaleTimeString();
    
    if (auditAction === 'open_s3_public') {
      setComplianceLogs(prev => [`[${time}] 📱 API DISPATCH: Admin "alice_sec" invokes PutBucketPolicy on s3://corporate-confidential-vault`, ...prev]);
      await new Promise(r => setTimeout(r, 1000));
      
      setComplianceState('cloudtrail_log');
      setComplianceLogs(prev => [
        `[${time}] 📑 CLOUDTRAIL: Capturing API Management Event log...`,
        `[${time}] CLOUDTRAIL LOG: { eventName: "PutBucketPolicy", userIdentity: "alice_sec", status: "SUCCESS", sourceIp: "54.12.98.4" }`,
        `[${time}] CLOUDTRAIL ACTION: Storing cryptographically signed log block in s3://central-audit-trails/`,
        ...prev
      ]);

      await new Promise(r => setTimeout(r, 1200));
      setComplianceState('config_eval');
      setComplianceLogs(prev => [
        `[${time}] ⚙️ AWS CONFIG: Configuration Recorder intercepts resource metadata change.`,
        `[${time}] CONFIG RE-EVAL: Evaluating configuration against Config Managed Rule: "s3-bucket-public-read-prohibited"`,
        ...prev
      ]);

      await new Promise(r => setTimeout(r, 1200));
      setComplianceState('non_compliant');
      setComplianceLogs(prev => [
        `[${time}] 🚨 AWS CONFIG VIOLATION: Resource "corporate-confidential-vault" flagged as [NON_COMPLIANT]!`,
        `[${time}] CONFIG STATE: Recorded configuration timeline delta snapshot.`,
        ...prev
      ]);

      await new Promise(r => setTimeout(r, 1400));
      setComplianceState('remediating');
      setComplianceLogs(prev => [
        `[${time}] 🛠️ RE-REMEDIATION: Triggering AWS Config automated Systems Manager (SSM) document: "AWS-DisableS3BucketPublicAccess"`,
        `[${time}] SSM DOCUMENT: Revoking public read bucket policy descriptors...`,
        ...prev
      ]);

      await new Promise(r => setTimeout(r, 1400));
      setComplianceState('compliant');
      setComplianceLogs(prev => [
        `[${time}] ✅ COMPLIANCE RESTORED: S3 Bucket policy revoked. Resource configuration evaluated: [COMPLIANT]`,
        `[${time}] CONFIG MONITOR: State synchronized successfully. Configuration Recorder idle.`,
        ...prev
      ]);

    } else if (auditAction === 'terminate_ec2') {
      setComplianceLogs(prev => [`[${time}] 📱 API DISPATCH: Developer "bob_dev" invokes TerminateInstances on i-0ea1bc90a88`, ...prev]);
      await new Promise(r => setTimeout(r, 1000));

      setComplianceState('cloudtrail_log');
      setComplianceLogs(prev => [
        `[${time}] 📑 CLOUDTRAIL: Capturing API Management Event log...`,
        `[${time}] CLOUDTRAIL LOG: { eventName: "TerminateInstances", userIdentity: "bob_dev", status: "SUCCESS", instanceId: "i-0ea1bc90a88" }`,
        ...prev
      ]);

      await new Promise(r => setTimeout(r, 1200));
      setComplianceState('config_eval');
      setComplianceLogs(prev => [
        `[${time}] ⚙️ AWS CONFIG: Configuration Recorder logs resource state change to: [Terminated]`,
        `[${time}] RELATIONSHIPS: Terminating attached EBS Volumes, Elastic IPs, and Security Group relationship nodes.`,
        ...prev
      ]);

      await new Promise(r => setTimeout(r, 1200));
      setComplianceState('compliant');
      setComplianceLogs(prev => [
        `[${time}] ✅ COMPLIANCE SYNC: Resource terminated cleanly. Metastore historical baseline snapshot recorded inside AWS Config timeline logs.`,
        ...prev
      ]);
    } else {
      setComplianceLogs(prev => [`[${time}] 📱 API DISPATCH: Admin "alice_sec" invokes DeleteBucket on s3://finance-archive-glacier`, ...prev]);
      await new Promise(r => setTimeout(r, 1000));

      setComplianceState('cloudtrail_log');
      setComplianceLogs(prev => [
        `[${time}] 📑 CLOUDTRAIL: Capturing API Management Event log...`,
        `[${time}] CLOUDTRAIL LOG: { eventName: "DeleteBucket", userIdentity: "alice_sec", status: "FAILED (AccessDenied - MFA Lock active)", sourceIp: "54.12.98.4" }`,
        `[${time}] ⚠️ CLOUDTRAIL ALERT: Triggering CloudTrail Insight event: "Anomaly in DeleteBucket API failure spikes"`,
        ...prev
      ]);

      await new Promise(r => setTimeout(r, 1200));
      setComplianceState('compliant');
      setComplianceLogs(prev => [
        `[${time}] ✅ COMPLETED: Unauthorized delete attempt intercepted and logged. Config status remains unmodified.`,
        ...prev
      ]);
    }
  };

  const resetComplianceSim = () => {
    setComplianceState('idle');
    setComplianceLogs([]);
  };

  // ==========================================
  // TAB 6 SIMULATOR LOGIC
  // ==========================================
  const runMatrixSimulation = async () => {
    if (matrixSimState === 'running') return;
    setMatrixSimState('running');
    setMatrixLogs([]);
    const time = new Date().toLocaleTimeString();

    if (matrixTopic === 'aggregation') {
      setMatrixLogs(prev => [`[${time}] 🌐 INITIATING CROSS-ACCOUNT LOG AGGREGATION PIPELINE`, ...prev]);
      await new Promise(r => setTimeout(r, 600));
      setMatrixLogs(prev => [
        `[${time}] 📤 SENDER ACCOUNTS: Extracting Log Groups matching Subscription Filters`,
        `[${time}] Account-A (Region us-east-1) logs: /aws/ec2/prod-fleet`,
        `[${time}] Account-B (Region us-west-2) logs: /aws/lambda/payment-gateway`,
        `[${time}] Account-C (Region eu-west-1) logs: /aws/rds/db-cluster`,
        ...prev
      ]);
      await new Promise(r => setTimeout(r, 800));

      setMatrixLogs(prev => [
        `[${time}] 🔑 IAM SENDER ROLE: Assuming IAM Role in Sender Accounts...`,
        `[${time}] IAM AUTH: Trust relationship verified for [logs.amazonaws.com]`,
        ...prev
      ]);
      await new Promise(r => setTimeout(r, 800));

      setMatrixLogs(prev => [
        `[${time}] 🛡️ CROSSING BOUNDARY: Fanning logs to Recipient Account (112233445566)...`,
        `[${time}] GATEWAY: Evaluating Target Destination Policy...`,
        ...prev
      ]);
      await new Promise(r => setTimeout(r, 1000));

      if (matrixPolicyCorrect) {
        setMatrixSimState('success');
        setMatrixLogs(prev => [
          `[${time}] ✅ POLICY ALLOWED: Recipient Destination Access Policy validated successfully!`,
          `[${time}] 🌊 CENTRAL STREAM: Log payload written cleanly to Kinesis Data Stream [central-logs-kds]`,
          `[${time}] 🔥 BUFFERING: Kinesis Data Firehose buffering 5MB batches (S3 output: s3://corporate-logs-lake/)`,
          `[${time}] 🎉 AGGREGATION COMPLETED: Cross-account logs merged, encrypted and stored in central lake!`,
          ...prev
        ]);
      } else {
        setMatrixSimState('failed');
        setMatrixLogs(prev => [
          `[${time}] 🚨 POLICY DENIED: AccessDenied - Recipient Destination Access Policy blocks requests from Source accounts!`,
          `[${time}] REASON: The principal logs.amazonaws.com cannot AssumeRole or PutRecords due to missing account ID in Destination policy resource blocks.`,
          `[${time}] 💥 PIPELINE HALTED: Cross-account logs routing terminated at boundary block!`,
          ...prev
        ]);
      }
    } else if (matrixTopic === 'subscriptions') {
      setMatrixLogs(prev => [`[${time}] ⚡ INITIATING REAL-TIME SUBSCRIPTION VS S3 EXPORT SIMULATION`, ...prev]);
      await new Promise(r => setTimeout(r, 650));
      setMatrixLogs(prev => [
        `[${time}] 📥 LOG ENTRY: Ingested new batch: "SQL transaction failed: connection timeout..."`,
        `[${time}] 🔍 EVALUATION: Subscription Filter checking match pattern: { $.level = "ERROR" }`,
        `[${time}] ⚡ REAL-TIME: Match found! Ingestion filter fanning out event immediately (latency: 12ms)`,
        `[${time}] ⚡ ROUTING: Dispatching log payload directly to AWS Lambda & Kinesis Data Streams...`,
        ...prev
      ]);
      await new Promise(r => setTimeout(r, 1000));
      setMatrixLogs(prev => [
        `[${time}] ⏳ S3 EXPORT PATH: Running createExportTask API check for cold archival...`,
        `[${time}] ⏳ DELAY METRIC: Log export task buffered inside CloudWatch storage layer.`,
        `[${time}] ⚠️ S3 EXPORT LATENCY: "createExportTask" is not real-time. Buffering logs for up to 12 hours...`,
        `[${time}] ⏳ S3 EXPORT STATUS: Log chunks remaining in cold partition. Export scheduled.`,
        `[${time}] ✅ SIMULATION COMPLETE: Subscriptions fired instantly. S3 Export buffered with 12h block restriction.`,
        ...prev
      ]);
      setMatrixSimState('success');
    } else if (matrixTopic === 'metricstreams') {
      setMatrixLogs(prev => [`[${time}] 🌊 INITIATING LOW-LATENCY METRIC STREAMS ROUTING`, ...prev]);
      await new Promise(r => setTimeout(r, 700));
      setMatrixLogs(prev => [
        `[${time}] 📈 TELEMETRY FEED: AWS/EC2 CPUUtilization & NetworkOut metrics continuously collected.`,
        `[${time}] 🌊 STREAMING PIPELINE: Metric Stream fanning out namespaces straight to Kinesis Data Firehose.`,
        `[${time}] 🌊 SAAS CONNECTORS: Streaming data to Datadog, Dynatrace & New Relic at 3.2MB/s.`,
        `[${time}] 🎚️ SUBSET FILTER: Excluding AWS/S3 storage metrics to optimize network bandwidth cost.`,
        `[${time}] ✅ COMPLETED: Metric Streams low latency active (latency: <3 seconds). API rate limit blocks avoided.`,
        ...prev
      ]);
      setMatrixSimState('success');
    } else {
      // sources & agents
      setMatrixLogs(prev => [`[${time}] 🔎 ANALYZING CONTEXT: Evaluating sources & agent telemetry footprints...`, ...prev]);
      await new Promise(r => setTimeout(r, 800));
      setMatrixLogs(prev => [
        `[${time}] 🛠️ TELEMETRY GATHERING: Unified CloudWatch Agent running daemon baseline scans.`,
        `[${time}] 🛠️ METRIC COLLECTION: Pulling OS-level DiskIO, SwapUsage & core memory buffers.`,
        `[${time}] 📂 LOG WATCH: Tailing syslog & nginx log files. Sending log sequences to Log Streams...`,
        `[${time}] ✅ FOOTPRINT COMPLETED: Ingestion pipelines active for SDK, Elastic Beanstalk & ECS container stdout.`,
        ...prev
      ]);
      setMatrixSimState('success');
    }
  };

  const resetMatrixSim = () => {
    setMatrixSimState('idle');
    setMatrixLogs([]);
  };

  return (
    <div className="cw-container animate-fadeIn">
      {/* isolated isolated visualizer styling */}
      <style>{`
        .cw-container {
          font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
          color: var(--cw-text);
          background-color: var(--cw-bg);
          padding: 24px;
          border-radius: 16px;
          transition: all 0.25s ease;

          /* Light Mode Colors */
          --cw-bg: #f8fafc;
          --cw-text: #1e293b;
          --cw-text-title: #0f172a;
          --cw-text-muted: #475569;
          --cw-card-bg: rgba(255, 255, 255, 0.75);
          --cw-card-border: rgba(226, 232, 240, 0.85);
          --cw-card-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.08), 0 2px 8px -1px rgba(148, 163, 184, 0.04);
          
          --cw-tab-bg: rgba(255, 255, 255, 0.85);
          --cw-tab-border: rgba(226, 232, 240, 0.85);
          --cw-tab-text: #475569;
          --cw-tab-hover-bg: #f8fafc;
          --cw-tab-hover-border: #cbd5e1;
          --cw-tab-hover-text: #1e293b;
          
          --cw-input-bg: #ffffff;
          --cw-input-color: #0f172a;
          --cw-input-border: rgba(226, 232, 240, 0.85);
          
          --cw-btn-sec-bg: #ffffff;
          --cw-btn-sec-color: #334155;
          --cw-btn-sec-border: #cbd5e1;
          --cw-btn-sec-hover-bg: #f1f5f9;
          
          --cw-code-bg: #090d16;
          --cw-code-border: #1e293b;
          --cw-code-text: #94a3b8;
          
          --cw-table-border: rgba(226, 232, 240, 0.85);
          --cw-table-th-bg: #f8fafc;
          --cw-table-th-text: #475569;
          --cw-table-td-text: #334155;
          --cw-table-hover-bg: #f8fafc;

          --cw-main-content-bg: #ffffff;
          --cw-main-content-border: #e2e8f0;

          /* SVG standard colors */
          --cw-svg-bg: #f8fafc;
          --cw-svg-grid: radial-gradient(rgba(99, 102, 241, 0.08) 1.5px, transparent 1.5px);
          --cw-svg-text-dark: #1e293b;
          --cw-svg-text-light: #ffffff;
          
          --cw-svg-indigo-bg: #e0e7ff;
          --cw-svg-indigo-border: #6366f1;
          --cw-svg-indigo-text: #4f46e5;
          
          --cw-svg-green-bg: #effaf3;
          --cw-svg-green-border: #10b981;
          --cw-svg-green-text: #15803d;
          
          --cw-svg-red-bg: #fdf2f2;
          --cw-svg-red-border: #ef4444;
          --cw-svg-red-text: #b91c1c;
          
          --cw-svg-purple-bg: #faf5ff;
          --cw-svg-purple-border: #a855f7;
          --cw-svg-purple-text: #7e22ce;
          
          --cw-svg-amber-bg: #fff7ed;
          --cw-svg-amber-border: #ea580c;
          --cw-svg-amber-text: #c2410c;

          --cw-svg-node-fill: #ffffff;
          --cw-svg-node-border: #cbd5e1;
        }

        .dark .cw-container {
          background-color: #020617 !important;
          color: #cbd5e1 !important;

          /* Dark Mode Colors */
          --cw-bg: #020617;
          --cw-text: #cbd5e1;
          --cw-text-title: #ffffff;
          --cw-text-muted: #94a3b8;
          --cw-card-bg: rgba(15, 23, 42, 0.75);
          --cw-card-border: rgba(51, 65, 85, 0.6);
          --cw-card-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
          
          --cw-tab-bg: rgba(15, 23, 42, 0.6);
          --cw-tab-border: rgba(51, 65, 85, 0.6);
          --cw-tab-text: #94a3b8;
          --cw-tab-hover-bg: rgba(30, 41, 59, 0.8);
          --cw-tab-hover-border: rgba(51, 65, 85, 0.6);
          --cw-tab-hover-text: #f8fafc;
          
          --cw-input-bg: #0f172a;
          --cw-input-color: #f1f5f9;
          --cw-input-border: rgba(51, 65, 85, 0.8);
          
          --cw-btn-sec-bg: rgba(15, 23, 42, 0.8);
          --cw-btn-sec-color: #cbd5e1;
          --cw-btn-sec-border: rgba(51, 65, 85, 0.6);
          --cw-btn-sec-hover-bg: rgba(30, 41, 59, 0.8);
          
          --cw-code-bg: #020617;
          --cw-code-border: rgba(51, 65, 85, 0.6);
          --cw-code-text: #38bdf8;
          
          --cw-table-border: rgba(51, 65, 85, 0.6);
          --cw-table-th-bg: rgba(15, 23, 42, 0.8);
          --cw-table-th-text: #94a3b8;
          --cw-table-td-text: #cbd5e1;
          --cw-table-hover-bg: rgba(30, 41, 59, 0.4);

          --cw-main-content-bg: rgba(15, 23, 42, 0.5);
          --cw-main-content-border: rgba(51, 65, 85, 0.6);

          /* SVG standard colors */
          --cw-svg-bg: #020617;
          --cw-svg-grid: radial-gradient(rgba(51, 65, 85, 0.5) 1.2px, transparent 1.2px);
          --cw-svg-text-dark: #cbd5e1;
          --cw-svg-text-light: #ffffff;
          
          --cw-svg-indigo-bg: rgba(99, 102, 241, 0.15);
          --cw-svg-indigo-border: rgba(99, 102, 241, 0.5);
          --cw-svg-indigo-text: #a5b4fc;
          
          --cw-svg-green-bg: rgba(16, 185, 129, 0.15);
          --cw-svg-green-border: rgba(16, 185, 129, 0.4);
          --cw-svg-green-text: #4ade80;
          
          --cw-svg-red-bg: rgba(239, 68, 68, 0.15);
          --cw-svg-red-border: rgba(239, 68, 68, 0.5);
          --cw-svg-red-text: #f87171;
          
          --cw-svg-purple-bg: rgba(168, 85, 247, 0.15);
          --cw-svg-purple-border: rgba(168, 85, 247, 0.5);
          --cw-svg-purple-text: #e9d5ff;
          
          --cw-svg-amber-bg: rgba(245, 158, 11, 0.15);
          --cw-svg-amber-border: rgba(245, 158, 11, 0.5);
          --cw-svg-amber-text: #fbbf24;

          --cw-svg-node-fill: rgba(15, 23, 42, 0.8);
          --cw-svg-node-border: rgba(51, 65, 85, 0.8);
        }

        .acad-dir-container {
          background: var(--cw-card-bg);
          border: 1px solid var(--cw-card-border);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: var(--cw-card-shadow);
        }
        .acad-dir-header {
          padding: 10px 14px;
          background: var(--cw-tab-bg);
          border-bottom: 1px solid var(--cw-card-border);
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--cw-text-title);
        }
        .acad-dir-folder-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          font-size: 12px;
          font-weight: 700;
          border: none;
          background: var(--cw-card-bg);
          color: var(--cw-text);
          border-bottom: 1px solid var(--cw-card-border);
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .acad-dir-folder-btn:hover {
          background: var(--cw-tab-hover-bg);
          color: var(--cw-text-title);
        }
        .acad-dir-item-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px 8px 24px;
          font-size: 11px;
          font-weight: 600;
          color: var(--cw-text-muted);
          border: none;
          border-left: 3px solid transparent;
          background: var(--cw-card-bg);
          transition: all 0.15s ease;
          text-align: left;
          cursor: pointer;
        }
        .acad-dir-item-btn:hover {
          background: var(--cw-tab-hover-bg);
          color: var(--cw-text-title);
          border-left-color: var(--cw-card-border);
        }
        .acad-dir-item-btn.acad-active {
          background: rgba(99, 102, 241, 0.12);
          color: #6366f1;
          border-left-color: #6366f1;
          font-weight: 800;
        }
        .dark .acad-dir-item-btn.acad-active {
          background: rgba(129, 140, 248, 0.2);
          color: #818cf8;
          border-left-color: #818cf8;
        }
        .acad-detail-card {
          background: var(--cw-card-bg);
          border: 1px solid var(--cw-card-border);
          border-radius: 16px;
          padding: 24px;
          box-shadow: var(--cw-card-shadow);
        }
        .acad-hero-badge {
          background: rgba(99, 102, 241, 0.1);
          border: 1.5px solid rgba(99, 102, 241, 0.3);
          color: #4f46e5;
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
        .dark .acad-hero-badge {
          background: rgba(129, 140, 248, 0.18);
          border-color: rgba(129, 140, 248, 0.4);
          color: #c7d2fe;
        }
        .acad-plain-english {
          background: rgba(99, 102, 241, 0.08);
          border-left: 4px solid #6366f1;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 16px;
          font-size: 12.5px;
          line-height: 1.6;
          color: var(--cw-text);
          border-top: 1px solid var(--cw-card-border);
          border-right: 1px solid var(--cw-card-border);
          border-bottom: 1px solid var(--cw-card-border);
        }
        .dark .acad-plain-english {
          background: rgba(99, 102, 241, 0.18);
          color: #f1f5f9;
        }
        .acad-analogy-box {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(217, 119, 6, 0.03) 100%);
          border: 1.5px solid rgba(245, 158, 11, 0.35);
          border-radius: 12px;
          padding: 16px;
          margin: 16px 0;
          font-size: 12px;
          line-height: 1.6;
          color: var(--cw-text);
        }
        .dark .acad-analogy-box {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.14) 0%, rgba(217, 119, 6, 0.06) 100%);
          border-color: rgba(245, 158, 11, 0.4);
          color: #f1f5f9;
        }
        .acad-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid var(--cw-table-border);
        }
        .acad-table th {
          background: var(--cw-table-th-bg);
          color: var(--cw-table-th-text);
          font-weight: 800;
          padding: 10px 12px;
          border-bottom: 1.5px solid var(--cw-table-border);
          text-align: left;
        }
        .acad-table td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--cw-table-border);
          color: var(--cw-table-td-text);
        }
        .acad-terminal {
          background: #090d16;
          border: 1px solid #1e293b;
          border-radius: 12px;
          padding: 12px;
          font-family: 'Fira Code', 'Courier New', Courier, monospace;
          color: #cbd5e1;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.8);
        }
        .acad-advice-box {
          background: var(--cw-card-bg);
          border: 1px solid var(--cw-card-border);
          color: var(--cw-text-muted);
        }

        .cw-card {
          background: var(--cw-card-bg);
          border: 1.5px solid var(--cw-card-border);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(16px);
          margin-bottom: 24px;
          box-shadow: var(--cw-card-shadow);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .cw-card:hover {
          border-color: #6366f1;
          box-shadow: 0 12px 24px -4px rgba(99, 102, 241, 0.08), 0 4px 12px -2px rgba(99, 102, 241, 0.03);
          transform: translateY(-1px);
        }
        .cw-card-title {
          font-size: 16.5px;
          font-weight: 800;
          color: var(--cw-text-title);
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.02em;
        }
        .cw-card-desc {
          font-size: 12.5px;
          color: var(--cw-text-muted);
          line-height: 1.65;
        }
        .cw-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          border-bottom: 1.5px solid var(--cw-card-border);
          padding-bottom: 10px;
        }
        .cw-tb {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 12px;
          border: 1.5px solid var(--cw-tab-border);
          font-size: 12px;
          font-weight: 600;
          color: var(--cw-tab-text);
          background: var(--cw-tab-bg);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease-in-out;
          outline: none;
        }
        .cw-tb:hover {
          background: var(--cw-tab-hover-bg);
          border-color: var(--cw-tab-hover-border);
          color: var(--cw-tab-hover-text);
        }
        .cw-tb.cw-on {
          background: #6366f1;
          color: #ffffff;
          border-color: #6366f1;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
        }

        .cw-svg-bg {
          background-color: var(--cw-svg-bg) !important;
          background-image: var(--cw-svg-grid) !important;
          background-size: 16px 16px;
          border: 1.5px solid var(--cw-card-border);
        }
        
        .cw-flow-blue {
          stroke: #3b82f6;
          stroke-dasharray: 6,4;
          animation: cwFlowDash 1s linear infinite;
        }
        .cw-flow-green {
          stroke: #10b981;
          stroke-dasharray: 6,4;
          animation: cwFlowDash 0.8s linear infinite;
        }
        .cw-flow-purple {
          stroke: #8b5cf6;
          stroke-dasharray: 6,4;
          animation: cwFlowDash 1.2s linear infinite;
        }
        .cw-flow-orange {
          stroke: #f97316;
          stroke-dasharray: 6,4;
          animation: cwFlowDash 1s linear infinite;
        }
        @keyframes cwFlowDash {
          to { stroke-dashoffset: -20; }
        }

        .cw-node-btn {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .cw-node-btn:hover {
          filter: drop-shadow(0 4px 12px rgba(99, 102, 241, 0.3));
          opacity: 0.95;
        }
        
        .pulse-circle {
          animation: cwPing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes cwPing {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .flashing-alarm {
          animation: cwFlashRed 1s infinite alternate;
        }
        @keyframes cwFlashRed {
          0% { fill: rgba(239, 68, 68, 0.2); stroke: #ef4444; }
          100% { fill: rgba(239, 68, 68, 0.8); stroke: #ef4444; }
        }

        /* Scoped styling overrides inside cw-container */
        .cw-container h1,
        .cw-container h2,
        .cw-container h3,
        .cw-container h4,
        .cw-container th {
          color: var(--cw-text-title) !important;
        }
        
        .cw-container p,
        .cw-container td,
        .cw-container li {
          color: var(--cw-text-muted) !important;
        }

        .cw-container .text-slate-900,
        .cw-container .text-slate-800,
        .cw-container .text-slate-700,
        .cw-container .text-gray-900,
        .cw-container .text-indigo-950 {
          color: var(--cw-text-title) !important;
        }
        
        .cw-container .text-slate-650,
        .cw-container .text-slate-600,
        .cw-container .text-slate-500 {
          color: var(--cw-text-muted) !important;
        }

        .cw-container .bg-white {
          background-color: var(--cw-card-bg) !important;
        }
        
        .cw-container .bg-slate-50,
        .cw-container .bg-slate-100 {
          background-color: var(--cw-bg) !important;
        }

        .cw-container .hover\:bg-slate-50:hover,
        .cw-container .hover\:bg-slate-100:hover,
        .cw-container .hover\:bg-indigo-50:hover {
          background-color: var(--cw-tab-hover-bg) !important;
        }

        .cw-container .border-slate-200,
        .cw-container .border-slate-100,
        .cw-container .border-slate-150,
        .cw-container .border-gray-200 {
          border-color: var(--cw-card-border) !important;
        }

        .dark .cw-terminal,
        .dark .cw-log {
          background: #020617 !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #38bdf8 !important;
        }

        /* Scoped input/form components */
        .cw-container select,
        .cw-container input,
        .cw-container textarea {
          background-color: var(--cw-input-bg) !important;
          color: var(--cw-input-color) !important;
          border: 1.5px solid var(--cw-input-border) !important;
          border-radius: 8px;
          outline: none;
          transition: all 0.2s ease;
        }

        .cw-container select option {
          background-color: var(--cw-input-bg) !important;
          color: var(--cw-input-color) !important;
        }

        .cw-container select:focus,
        .cw-container input:focus,
        .cw-container textarea:focus {
          border-color: #6366f1 !important;
        }

        /* Alert overrides in dark mode */
        .dark .cw-container .bg-indigo-50 {
          background-color: rgba(99, 102, 241, 0.15) !important;
          color: #a5b4fc !important;
        }
        
        .dark .cw-container .bg-sky-50 {
          background-color: rgba(14, 165, 233, 0.15) !important;
          color: #7dd3fc !important;
        }
        
        .dark .cw-container .bg-amber-50 {
          background-color: rgba(245, 158, 11, 0.15) !important;
          color: #fef08a !important;
        }

        .dark .cw-container .bg-rose-50 {
          background-color: rgba(244, 63, 94, 0.15) !important;
          color: #fca5a5 !important;
        }
          `}</style>

      {/* Header bar */}
      <Translate>
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 mb-6">
          <div className="flex items-center gap-2">
            <span className={`p-2 rounded-lg text-white ${provider === 'azure' ? 'bg-blue-600' : provider === 'gcp' ? 'bg-emerald-600' : 'bg-indigo-500'}`}>
              <Eye className="w-6 h-6" />
            </span>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900">
                {provider === 'azure' ? 'Azure Monitor, Event Grid & Policy Compliance Hub' :
                 provider === 'gcp' ? 'Google Cloud Monitoring, Logging, Eventarc & Audit Hub' :
                 'AWS Observability, Events & Compliance Hub'}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {provider === 'azure' ? 'Explore Azure Monitor Log Analytics, Metrics Streams, Event Grid routing rules, Activity Log audits, and Azure Policy guardrails' :
                 provider === 'gcp' ? 'Explore Google Cloud Logging Log Router, Cloud Monitoring telemetry, Eventarc routing rules, Audit Logs, and Security Command Center guardrails' :
                 'Explore CloudWatch Metric Streams, Log Agent Ingestion, EventBridge routing rules, CloudTrail audits, and AWS Config compliance guardrails'}
              </p>
            </div>
          </div>
        </div>
      </Translate>

      {/* Tab navigation bar */}
      {!isComparative && (
        <Translate>
        <div className="cw-tabs">
          <button className={`cw-tb ${activeTab === 'notebook' ? 'cw-on' : ''}`} onClick={() => setActiveTab('notebook')}>
            <BookOpen className="w-4 h-4 text-indigo-500" /> 📖 1) Visual Notes &amp; Theories
          </button>
          <button className={`cw-tb ${activeTab === 'intro' ? 'cw-on' : ''}`} onClick={() => setActiveTab('intro')}>
            <Sliders className="w-4 h-4 text-sky-500" /> 🎯 2) Observability vs Auditing
          </button>
          <button className={`cw-tb ${activeTab === 'logs' ? 'cw-on' : ''}`} onClick={() => setActiveTab('logs')}>
            <FileText className="w-4 h-4" /> 📑 3) {provider === 'azure' ? 'Azure Log Analytics' : provider === 'gcp' ? 'Cloud Logging' : 'CloudWatch Logs & Insights'}
          </button>
          <button className={`cw-tb ${activeTab === 'metrics' ? 'cw-on' : ''}`} onClick={() => setActiveTab('metrics')}>
            <Activity className="w-4 h-4" /> 📊 4) {provider === 'azure' ? 'Azure Metrics & Alerts' : provider === 'gcp' ? 'Cloud Monitoring & Alerts' : 'Metric Streams & Alarms'}
          </button>
          <button className={`cw-tb ${activeTab === 'eventbridge' ? 'cw-on' : ''}`} onClick={() => setActiveTab('eventbridge')}>
            <Workflow className="w-4 h-4" /> 🔀 5) {provider === 'azure' ? 'Event Grid Router' : provider === 'gcp' ? 'Eventarc Event Router' : 'EventBridge Schema Router'}
          </button>
          <button className={`cw-tb ${activeTab === 'compliance' ? 'cw-on' : ''}`} onClick={() => setActiveTab('compliance')}>
            <Shield className="w-4 h-4" /> 🛡️ 6) {provider === 'azure' ? 'Activity Log & Azure Policy' : provider === 'gcp' ? 'Audit Logs & SCC Remediation' : 'CloudTrail & Config Remediation'}
          </button>
          <button className={`cw-tb ${activeTab === 'matrix' ? 'cw-on' : ''}`} onClick={() => setActiveTab('matrix')}>
            <Sliders className="w-4 h-4" /> 🗺️ 7) Observability Comparison &amp; Map
          </button>
          <button className={`cw-tb ${activeTab === 'unique' ? 'cw-on' : ''}`} onClick={() => setActiveTab('unique')}>
            ✨ Unique Features
          </button>
        </div>
      </Translate>
      )}

      {isComparative && (
        <CloudWatchMAndEventsComparativeView onNavigateToDemo={handleNavigateToDemo} />
      )}

      {!isComparative && activeTab === 'unique' && (
        <UniqueCloudWatchMAndEventsFeatures provider={provider as 'aws' | 'azure' | 'gcp'} />
      )}

      {!isComparative && activeTab !== 'unique' && (
        <Translate>
          <>

      {/* ========================================================================= */}
      {/* TAB 1: HOW TO CHOOSE THE RIGHT TELEMETRY ENGINE & COMPARISON MATRIX       */}
      {/* ========================================================================= */}
            {activeTab === 'notebook' && (
        <div className="space-y-6 animate-fadeIn text-left" style={{ color: 'var(--cw-text)' }}>
          
          {/* Header Hero Card */}
          <div className="cw-card text-left" style={{ borderLeft: '4px solid #6366f1', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 font-display" style={{ color: 'var(--cw-text-title)' }}>
                  <BookOpen className="w-5 h-5 text-indigo-500" /> CloudWatch, EventBridge &amp; Audit Compliance Notes &amp; Mental Models
                </h2>
                <p className="text-xs mt-1.5 leading-relaxed font-sans font-semibold" style={{ color: 'var(--cw-text-muted)' }}>
                  Simplified, beginner-friendly observability theories sorted progressively from Logs vs Metrics vs Traces to CloudWatch Alarms, EventBridge Bus routing rules, CloudTrail Security Audits, and AWS Config compliance remediation.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="acad-hero-badge">🎓 Beginner to Pro</span>
                <span className="acad-hero-badge" style={{ background: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.35)', color: '#d97706' }}>💡 Everyday Mental Models</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Sidebar Category Explorer */}
            <div className="lg:col-span-3 space-y-4 text-left">
              <span className="text-[10px] font-black uppercase tracking-widest block pl-1 font-mono" style={{ color: 'var(--cw-text-muted)' }}>Curriculum Directory:</span>
              
              <div className="acad-dir-container">
                <div className="acad-dir-header">
                  <Eye className="w-4 h-4 text-indigo-500" />
                  <span>Observability Modules</span>
                </div>

                {/* LEVEL 1: OBSERVABILITY FUNDAMENTALS */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'obs_fundamentals' ? '' : 'obs_fundamentals')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      🐣 Level 1 · Fundamentals
                    </span>
                    {expandedCategory === 'obs_fundamentals' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'obs_fundamentals' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--cw-card-bg)', borderBottom: '1px solid var(--cw-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('logs_metrics_traces')}
                        className={`acad-dir-item-btn ${selectedNote === 'logs_metrics_traces' ? 'acad-active' : ''}`}
                      >
                        1.1 Logs vs Metrics vs Traces (Journal vs Gauge)
                      </button>
                      <button 
                        onClick={() => setSelectedNote('cloudwatch_logs')}
                        className={`acad-dir-item-btn ${selectedNote === 'cloudwatch_logs' ? 'acad-active' : ''}`}
                      >
                        1.2 CloudWatch Logs &amp; Insights (Filing Cabinet)
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 2: METRICS & ALARMS */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'metrics_alarms' ? '' : 'metrics_alarms')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-sky-500" />
                      ⚙️ Level 2 · Metrics &amp; Alarms
                    </span>
                    {expandedCategory === 'metrics_alarms' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'metrics_alarms' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--cw-card-bg)', borderBottom: '1px solid var(--cw-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('cloudwatch_metrics')}
                        className={`acad-dir-item-btn ${selectedNote === 'cloudwatch_metrics' ? 'acad-active' : ''}`}
                      >
                        2.1 Telemetry Metrics (Cockpit Dashboard)
                      </button>
                      <button 
                        onClick={() => setSelectedNote('cloudwatch_alarms')}
                        className={`acad-dir-item-btn ${selectedNote === 'cloudwatch_alarms' ? 'acad-active' : ''}`}
                      >
                        2.2 Alarms &amp; Auto-Scaling (Smoke Alarm)
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 3: EVENT-DRIVEN ROUTING */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'event_routing' ? '' : 'event_routing')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Workflow className="w-3.5 h-3.5 text-purple-500" />
                      🔀 Level 3 · EventBridge Bus
                    </span>
                    {expandedCategory === 'event_routing' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'event_routing' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--cw-card-bg)', borderBottom: '1px solid var(--cw-card-border)' }}>
                      <button 
                        onClick={() => setSelectedNote('eventbridge_bus')}
                        className={`acad-dir-item-btn ${selectedNote === 'eventbridge_bus' ? 'acad-active' : ''}`}
                      >
                        3.1 EventBridge Bus &amp; Rules (Post Office Depot)
                      </button>
                      <button 
                        onClick={() => setSelectedNote('schema_pipes')}
                        className={`acad-dir-item-btn ${selectedNote === 'schema_pipes' ? 'acad-active' : ''}`}
                      >
                        3.2 Schema Registry &amp; EventBridge Pipes
                      </button>
                    </div>
                  )}
                </div>

                {/* LEVEL 4: AUDIT LOGGING & COMPLIANCE */}
                <div>
                  <button 
                    onClick={() => setExpandedCategory(expandedCategory === 'audit_compliance' ? '' : 'audit_compliance')}
                    className="acad-dir-folder-btn"
                  >
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      🛡️ Level 4 · Audit &amp; Config
                    </span>
                    {expandedCategory === 'audit_compliance' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                  {expandedCategory === 'audit_compliance' && (
                    <div className="py-1 font-semibold" style={{ background: 'var(--cw-card-bg)' }}>
                      <button 
                        onClick={() => setSelectedNote('cloudtrail_audits')}
                        className={`acad-dir-item-btn ${selectedNote === 'cloudtrail_audits' ? 'acad-active' : ''}`}
                      >
                        4.1 AWS CloudTrail (Security CCTV Camera)
                      </button>
                      <button 
                        onClick={() => setSelectedNote('aws_config_remediation')}
                        className={`acad-dir-item-btn ${selectedNote === 'aws_config_remediation' ? 'acad-active' : ''}`}
                      >
                        4.2 AWS Config &amp; Auto-Remediation Wrench
                      </button>
                    </div>
                  )}
                </div>

              </div>

              <div className="acad-advice-box rounded-2xl p-4 text-[11px] leading-relaxed font-semibold space-y-1">
                <span className="font-extrabold flex items-center gap-1.5 mb-1 text-[11.5px]" style={{ color: 'var(--cw-text-title)' }}>
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Interactive Quick-Launch
                </span>
                Click any topic to explore real-world analogies, interactive log cost calculators, and copyable CLI/Filter rules!
              </div>
            </div>

            {/* Right Active Note Workspace */}
            <div className="lg:col-span-9 space-y-6 text-left">

              {/* NOTE 1.1: LOGS VS METRICS VS TRACES */}
              {selectedNote === 'logs_metrics_traces' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--cw-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🐣 Level 1 · Fundamentals</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--cw-text-title)' }}>
                        1.1 The 3 Pillars of Observability: Logs vs Metrics vs Traces
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('intro')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Overview Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> Observability gives you complete insight into cloud infrastructure health:
                    <br />• <strong>Logs (What happened?)</strong>: Detailed text records of events, stack traces, and application print statements.
                    <br />• <strong>Metrics (How much / How fast?)</strong>: Numerical data points over time (CPU %, Memory MB, Latency ms, Error Count).
                    <br />• <strong>Traces (Where is the bottleneck?)</strong>: End-to-end request lifecycle paths across microservices (AWS X-Ray).
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Security Guard Journal vs Building Thermometer vs Package GPS Tracker
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      • <strong>Logs (Security Guard Logbook)</strong>: Handwritten timestamps recording every person entering the building: &ldquo;10:04 AM: John entered room #302&rdquo;.
                      <br />• <strong>Metrics (Building Thermometer)</strong>: A wall thermometer checking the room temperature every minute: &ldquo;72°F, 74°F, 98°F (SPIKE!)&rdquo;.
                      <br />• <strong>Traces (FedEx Package GPS Tracker)</strong>: Tracks a parcel from Origin Warehouse &rarr; Delivery Truck &rarr; Doorstep, showing exactly 40 minutes stuck in traffic at Highway 101!
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="acad-table">
                      <thead>
                        <tr>
                          <th>Observability Pillar</th>
                          <th>AWS Service</th>
                          <th>Data Structure</th>
                          <th>Primary Use Case</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><strong style={{ color: 'var(--cw-text-title)' }}>Logs</strong></td>
                          <td>Amazon CloudWatch Logs</td>
                          <td>Timestamped String/JSON text events</td>
                          <td>Debugging errors, auditing, exception tracebacks</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--cw-text-title)' }}>Metrics</strong></td>
                          <td>CloudWatch Metrics &amp; Alarms</td>
                          <td>Numeric Time-Series values</td>
                          <td>System health dashboards, auto-scaling triggers</td>
                        </tr>
                        <tr>
                          <td><strong style={{ color: 'var(--cw-text-title)' }}>Traces</strong></td>
                          <td>AWS X-Ray / Amazon CloudWatch ServiceLens</td>
                          <td>Segment trees &amp; trace IDs</td>
                          <td>Microservice latency bottleneck analysis &amp; map</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* NOTE 1.2: CLOUDWATCH LOGS & INSIGHTS */}
              {selectedNote === 'cloudwatch_logs' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--cw-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🐣 Level 1 · Fundamentals</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--cw-text-title)' }}>
                        1.2 CloudWatch Log Groups, Log Streams &amp; Logs Insights Queries
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('logs')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to CloudWatch Logs Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **CloudWatch Logs** collects logs from EC2, Lambda, ECS, and API Gateway:
                    <br />• <strong>Log Group</strong>: A folder organizing logs of a specific application (e.g. `/aws/lambda/PaymentService`).
                    <br />• <strong>Log Stream</strong>: Individual log files written by a specific server instance or Lambda container.
                    <br />• <strong>CloudWatch Logs Insights</strong>: A fast, SQL-like query engine that searches terabytes of log data in seconds!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Central Filing Drawer &amp; High-Speed Scanner
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      • <strong>Log Group (Filing Cabinet Drawer)</strong>: A drawer labeled &ldquo;2024 Accounting Invoices&rdquo;.
                      <br />• <strong>Log Stream (Individual Folder inside Drawer)</strong>: Folder #4 written by Accountant Alex.
                      <br />• <strong>Logs Insights (High-Speed Scanner Wrench)</strong>: You feed 10,000 invoices into an optical scanner, and it immediately highlights every invoice containing the word &ldquo;REJECTED&rdquo; in 2 seconds!
                    </p>
                  </div>

                  {/* Interactive Log Cost & Retention Estimator */}
                  <div className="acad-detail-card p-4 rounded-xl space-y-3" style={{ border: '1px solid var(--cw-card-border)' }}>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider block" style={{ color: 'var(--cw-text-muted)' }}>Interactive CloudWatch Logs Monthly Cost Estimator</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="flex justify-between font-semibold mb-1" style={{ color: 'var(--cw-text-muted)' }}>
                          <span>Daily Ingestion: {nbLogGbPerDay} GB/day</span>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="200" 
                          step="1" 
                          value={nbLogGbPerDay} 
                          onChange={(e) => setNbLogGbPerDay(parseInt(e.target.value))}
                          className="accent-indigo-600 w-full"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold mb-1" style={{ color: 'var(--cw-text-muted)' }}>
                          <span>Retention Policy: {nbRetentionDays} days</span>
                        </div>
                        <input 
                          type="range" 
                          min="7" 
                          max="365" 
                          step="7" 
                          value={nbRetentionDays} 
                          onChange={(e) => setNbRetentionDays(parseInt(e.target.value))}
                          className="accent-indigo-600 w-full"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between font-semibold mb-1" style={{ color: 'var(--cw-text-muted)' }}>
                          <span>Custom Metrics: {nbMetricCount} metrics</span>
                        </div>
                        <input 
                          type="range" 
                          min="10" 
                          max="2000" 
                          step="10" 
                          value={nbMetricCount} 
                          onChange={(e) => setNbMetricCount(parseInt(e.target.value))}
                          className="accent-indigo-600 w-full"
                        />
                      </div>
                    </div>

                    {(() => {
                      const monthlyIngestionGb = nbLogGbPerDay * 30;
                      const ingestionCost = monthlyIngestionGb * 0.50; // $0.50 per GB
                      const storageGb = monthlyIngestionGb * (nbRetentionDays / 30);
                      const storageCost = storageGb * 0.03; // $0.03 per GB/mo
                      const metricsCost = nbMetricCount * 0.30; // $0.30 per metric/mo
                      const totalCost = ingestionCost + storageCost + metricsCost;
                      return (
                        <div className="p-3 rounded-lg font-mono text-[10.5px] space-y-1.5" style={{ background: 'var(--cw-tab-bg)', border: '1px solid var(--cw-card-border)' }}>
                          <p>Monthly Log Ingestion: <span className="text-indigo-500 font-bold">{monthlyIngestionGb.toLocaleString()} GB / month</span> (${ingestionCost.toFixed(2)})</p>
                          <p>Estimated Total CloudWatch Monthly Bill: <span className="text-emerald-500 font-bold">${totalCost.toFixed(2)} / month</span></p>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Copyable Logs Insights Query */}
                  <div className="acad-advice-box p-4 rounded-xl flex flex-col justify-between" style={{ background: 'var(--cw-card-bg)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold font-mono" style={{ color: 'var(--cw-text-muted)' }}>CloudWatch Logs Insights Query Snippet</span>
                      <button 
                        onClick={() => {
                          const snippet = `fields @timestamp, @message, @requestId\n| filter @message like /ERROR/ or @message like /Exception/\n| sort @timestamp desc\n| limit 50`;
                          navigator.clipboard.writeText(snippet);
                          setCopiedNoteId('insights-query');
                          setTimeout(() => setCopiedNoteId(null), 2000);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-mono flex items-center gap-1 transition-all"
                      >
                        {copiedNoteId === 'insights-query' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <pre className="acad-terminal text-[9.5px] leading-relaxed overflow-x-auto h-24">
{`fields @timestamp, @message, @requestId
| filter @message like /ERROR/ or @message like /Exception/
| sort @timestamp desc
| limit 50`}
                    </pre>
                  </div>
                </div>
              )}

              {/* NOTE 2.1: CLOUDWATCH METRICS */}
              {selectedNote === 'cloudwatch_metrics' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--cw-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">⚙️ Level 2 · Metrics &amp; Alarms</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--cw-text-title)' }}>
                        2.1 CloudWatch Metrics, Resolution &amp; Metric Streams
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('metrics')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Metrics &amp; Alarms Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **CloudWatch Metrics** track numeric data over time (e.g., `CPUUtilization`, `DBLoad`, `5XXErrorCount`).
                    <br />• <strong>Standard Resolution (1-min)</strong>: Metrics published every 60 seconds (Default for AWS services).
                    <br />• <strong>High-Resolution (1-sec)</strong>: Tracks critical telemetry per second for high-frequency trading or ultra-fast scaling.
                    <br />• <strong>Metric Streams</strong>: Streams real-time metrics continuously to S3 or Datadog/Splunk using Kinesis Firehose!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Airplane Cockpit Speedometer Gauges
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      An airplane cockpit display panel shows airspeed, altitude, and engine RPM gauges. Standard resolution checks fuel level once per minute. High-resolution telemetry checks engine vibration every second during high-speed takeoffs!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 2.2: CLOUDWATCH ALARMS */}
              {selectedNote === 'cloudwatch_alarms' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--cw-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">⚙️ Level 2 · Metrics &amp; Alarms</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--cw-text-title)' }}>
                        2.2 CloudWatch Alarms &amp; Auto-Remediation Actions
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('metrics')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Metrics &amp; Alarms Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> A **CloudWatch Alarm** monitors a single metric over a specified period. When the metric crosses a threshold (e.g. `CPUUtilization &gt; 85%` for 3 consecutive minutes), the alarm transitions from `OK` to `ALARM` and automatically triggers actions: EC2 Auto Scaling, SNS Email/SMS notifications, or Systems Manager automation scripts!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Kitchen Smoke Alarm &amp; Automatic Sprinkler
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      A smoke alarm continuously measures air smoke density. When smoke exceeds 50 ppm for 10 seconds (`ALARM`), it automatically triggers 2 actions: sound the loud siren (SNS Notification) and open the ceiling water sprinkler valve (EC2 Auto-Scaling / Remediation)!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 3.1: EVENTBRIDGE BUS */}
              {selectedNote === 'eventbridge_bus' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--cw-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🔀 Level 3 · EventBridge Bus</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--cw-text-title)' }}>
                        3.1 Amazon EventBridge Event Bus, Rules &amp; JSON Event Pattern Matching
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('eventbridge')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to EventBridge Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **Amazon EventBridge** is a serverless event bus that connects application data from AWS services, SaaS applications (Salesforce, Zendesk), and custom microservices. **Event Rules** evaluate incoming JSON events against filter patterns and route events asynchronously to 20+ targets (Lambda, SQS, Step Functions, Kinesis).
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Central Automated Postal Sorting Depot
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      Thousands of packages drop onto a high-speed conveyor belt (Event Bus). An automated scanner (EventBridge Rule) reads package labels. If ZIP Code == 90210 (`JSON Filter Rule`), it drops the box into Shuttle Bus A (Lambda). If label says &ldquo;Fragile Glass&rdquo;, it sends a copy to Vault B (SQS Queue)!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 3.2: SCHEMA REGISTRY & PIPES */}
              {selectedNote === 'schema_pipes' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--cw-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🔀 Level 3 · EventBridge Bus</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--cw-text-title)' }}>
                        3.2 EventBridge Schema Registry &amp; EventBridge Pipes
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('eventbridge')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to EventBridge Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong>
                    <br />• <strong>Schema Registry</strong>: Automatically detects and stores JSON event structures, generating TypeScript/Java code bindings for developer IDE autocomplete.
                    <br />• <strong>EventBridge Pipes</strong>: Connects point-to-point event producers (DynamoDB Streams, SQS, Kinesis) directly to consumers (Lambda, Step Functions) with built-in filtering, enrichment, and transformation—without writing glue code!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: Universal Adapter Plug &amp; Inline Luggage Filter
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      • <strong>Schema Registry (Universal Adapter Dictionary)</strong>: Translates French electrical plugs into US sockets so developer code plugs in with zero friction.
                      <br />• <strong>EventBridge Pipes (Inline Conveyor Belt Adapter)</strong>: Connects Factory A directly to Truck B, automatically stripping off plastic wrapping (JSON Filtering &amp; Transformation) along the way!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 4.1: AWS CLOUDTRAIL */}
              {selectedNote === 'cloudtrail_audits' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--cw-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🛡️ Level 4 · Audit &amp; Config</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--cw-text-title)' }}>
                        4.1 AWS CloudTrail: Governance, Compliance &amp; API Security Audit Logs
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('compliance')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Compliance &amp; Audit Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **AWS CloudTrail** records all API calls and user activity across your AWS account. It answers 4 critical security questions for every single action: **Who** (IAM User/Role), **What** (API call e.g. `TerminateInstances`), **When** (Exact timestamp), and **From Where** (Source IP address &amp; User Agent).
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: 24/7 Security CCTV Camera Recording
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      A 4K CCTV camera records every movement in a bank vault 24 hours a day. If a safety deposit box goes missing at 3:15 AM, security guards rewind the video footage (CloudTrail Event History) to see exactly who unlocked the door using keycard #402!
                    </p>
                  </div>
                </div>
              )}

              {/* NOTE 4.2: AWS CONFIG */}
              {selectedNote === 'aws_config_remediation' && (
                <div className="acad-detail-card space-y-5 animate-fadeIn">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b pb-4" style={{ borderColor: 'var(--cw-card-border)' }}>
                    <div>
                      <span className="acad-hero-badge">🛡️ Level 4 · Audit &amp; Config</span>
                      <h3 className="text-xl font-black mt-2 font-display" style={{ color: 'var(--cw-text-title)' }}>
                        4.2 AWS Config: Resource Inventory, Compliance &amp; Auto-Remediation
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setActiveTab('compliance')}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> Go to Compliance &amp; Audit Tab
                      </button>
                    </div>
                  </div>

                  {/* Plain English Box */}
                  <div className="acad-plain-english">
                    <strong>✨ In Plain English:</strong> **AWS Config** continuously monitors, records, and evaluates resource configuration changes against security rules (e.g. `s3-bucket-public-read-prohibited`, `ec2-volume-inuse-check`). If a resource becomes `NON_COMPLIANT` (e.g. someone accidentally makes an S3 bucket public), AWS Config triggers Systems Manager Automation to **automatically lock the bucket in real-time**!
                  </div>

                  {/* Everyday Analogy Box */}
                  <div className="acad-analogy-box">
                    <div style={{ fontWeight: 800, color: '#d97706', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                      <Lightbulb style={{ width: '15px', height: '15px' }} /> 💡 The Everyday Real-World Analogy: The Building Safety Inspector &amp; Auto-Locking Wrench
                    </div>
                    <p style={{ margin: 0, fontSize: '11.8px', lineHeight: '1.6' }}>
                      A building inspector walks the floor carrying a building code checklist. If an employee unlocks a fire exit door and leaves it wide open (`NON_COMPLIANT`), the inspector&apos;s automatic remote tool (Auto-Remediation Wrench) immediately swings the door shut and locks the bolt in 0.5 seconds!
                    </p>
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
            
            {/* Architectural Overview Card */}
            <div className="lg:col-span-5 cw-card flex flex-col justify-between text-left">
              <div>
                <h3 className="cw-card-title text-indigo-700">
                  <Sliders className="w-5 h-5" /> AWS Observability vs Compliance Matrix
                </h3>
                <p className="cw-card-desc mb-5">
                  AWS provides distinct systems for keeping applications healthy, monitoring operational logs, auditing user commands, and regulating infrastructure configurations.
                </p>

                <div className="space-y-3 text-xs">
                  <button
                    onClick={() => setSelectedComp('cloudwatch')}
                    className={`w-full p-3 text-left border rounded-xl transition-all ${
                      selectedComp === 'cloudwatch'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold ring-1 ring-indigo-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold'
                    }`}
                  >
                    📈 CloudWatch: Telemetry &amp; System Health
                    <span className="block text-[9.5px] text-slate-400 font-medium mt-0.5">Metrics streams, log groups, system metrics, threshold alarms</span>
                  </button>

                  <button
                    onClick={() => setSelectedComp('cloudtrail')}
                    className={`w-full p-3 text-left border rounded-xl transition-all ${
                      selectedComp === 'cloudtrail'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold ring-1 ring-indigo-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold'
                    }`}
                  >
                    📑 CloudTrail: API Auditing &amp; Activity
                    <span className="block text-[9.5px] text-slate-400 font-medium mt-0.5">Captures WHO invoked WHICH API command, WHEN, and from WHERE</span>
                  </button>

                  <button
                    onClick={() => setSelectedComp('config')}
                    className={`w-full p-3 text-left border rounded-xl transition-all ${
                      selectedComp === 'config'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold ring-1 ring-indigo-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold'
                    }`}
                  >
                    🛡️ AWS Config: Inventory &amp; Compliance Rules
                    <span className="block text-[9.5px] text-slate-400 font-medium mt-0.5">Evaluates state compliance, records configuration timelines</span>
                  </button>
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-150 rounded-xl p-3 text-[11px] leading-relaxed text-indigo-900 mt-6">
                <span className="font-bold text-indigo-950 block mb-1">Architect's Observability Guideline:</span>
                "CloudWatch checks if the server is healthy. CloudTrail audits who broke it via API. AWS Config reports if its open ports violated company network protocols."
              </div>
            </div>

            {/* In-depth Dynamic Observability Panels */}
            <div className="lg:col-span-7 cw-card space-y-4 text-left">
              <h3 className="cw-card-title text-slate-800">
                <BookOpen className="w-5 h-5 text-indigo-500" /> Deep-Dive: Observability &amp; Event-Driven Architecture
              </h3>

              {selectedComp === 'cloudwatch' && (
                <div className="space-y-4 animate-fadeIn text-xs leading-relaxed text-slate-650">
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <span className="font-extrabold text-indigo-700 block mb-1.5 text-[12.5px]">📈 Amazon CloudWatch Metrics, Streams &amp; Log Groups</span>
                    <p className="mb-2">
                      CloudWatch serves as the centralized telemetry data vault for AWS infrastructure. It handles:
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>Log Groups:</strong> Organized directory folders collecting sequential Log Streams from EC2 (via CloudWatch Agent), Lambda, container stdout, or API gateways.</li>
                      <li><strong>Unified CloudWatch Agent:</strong> Ingests system logs alongside bare-metal hardware hypervisor performance counters (DiskIO, active memory slots) that hypervisors can't natively see.</li>
                      <li><strong>Metric Streams:</strong> Streams custom or standard system logs in near-real-time to external analytics platforms or S3 warehouses bypassing static query API limits.</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                      <span className="font-bold text-slate-800 block mb-1">📟 CloudWatch Logs Insights</span>
                      Query gigabytes of logs in seconds using a robust SQL-like custom syntax to parse, filter, aggregate, or limit search indices.
                    </div>
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50">
                      <span className="font-bold text-slate-800 block mb-1">🔔 Observability Alarms</span>
                      Define metric static thresholds or anomaly-detection boundaries to automatically trigger SNS alerts, EC2 scaling, or SSM restoration.
                    </div>
                  </div>
                </div>
              )}

              {selectedComp === 'cloudtrail' && (
                <div className="space-y-4 animate-fadeIn text-xs leading-relaxed text-slate-650">
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <span className="font-extrabold text-teal-700 block mb-1.5 text-[12.5px]">📑 AWS CloudTrail: Governance &amp; Action Log Auditing</span>
                    <p className="mb-2">
                      CloudTrail monitors and archives absolute security accounts audits by documenting every single API operation invoked across your AWS Account.
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>Management Events:</strong> Captures resource creation, modification, or teardown operations (e.g., <code>RunInstances</code>, <code>CreateBucket</code>). Included by default.</li>
                      <li><strong>Data Events:</strong> Records item-level bucket manipulations (e.g., S3 <code>PutObject</code>, Lambda <code>Invoke</code>) targeting high-traffic indexes.</li>
                      <li><strong>CloudTrail Insights:</strong> Detects anomalies in API request rates (e.g. sudden failed API authentication spikes, aggressive bulk deletes).</li>
                    </ul>
                  </div>

                  <div className="bg-sky-50 border border-sky-150 rounded-xl p-3 flex gap-2">
                    <Info className="w-5 h-5 text-sky-600 shrink-0" />
                    <div>
                      <span className="font-bold text-sky-950 block">Security Best Practice:</span>
                      Logs are written to an S3 bucket configured with Object Lock (WORM) and log file integrity verification, ensuring auditors can verify no security logs were altered.
                    </div>
                  </div>
                </div>
              )}

              {selectedComp === 'config' && (
                <div className="space-y-4 animate-fadeIn text-xs leading-relaxed text-slate-650">
                  <div className="bg-white border border-slate-200 rounded-xl p-4">
                    <span className="font-extrabold text-amber-700 block mb-1.5 text-[12.5px]">🛡️ AWS Config: Inventory, History &amp; Automated Guardrails</span>
                    <p className="mb-2">
                      AWS Config maintains a complete historical record of configuration baseline changes, mapping inter-resource relationships (e.g., which EBS is attached to which ENI) and enforcing corporate compliance rules.
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li><strong>Configuration Recorder:</strong> Captures structural modifications to AWS metadata, storing baseline configurations as incremental snapshot deltas.</li>
                      <li><strong>Config Managed Rules:</strong> Pre-built policies that continuously evaluate resources (e.g., verifying EBS drives are encrypted, S3 buckets are private).</li>
                      <li><strong>Automated Remediation:</strong> Connects non-compliant resource alerts directly to Systems Manager (SSM) automation runbooks to auto-repair configurations instantly.</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50 border border-amber-150 rounded-xl p-3 flex gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold text-amber-950 block">Continuous Compliance:</span>
                      AWS Config performs continuous evaluations based on config change triggers rather than static daily schedules, ensuring minimal exposure times to security vulnerabilities.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Unified Comparison Matrix Table */}
          <div className="cw-card bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6 text-left">
            <h3 className="cw-card-title text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-500" /> CloudWatch vs CloudTrail vs AWS Config Comparison Matrix
            </h3>
            
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-extrabold text-[10.5px]">
                    <th className="p-3 border-r border-slate-200">Comparison Dimension</th>
                    <th className="p-3 border-r border-slate-200">📈 Amazon CloudWatch</th>
                    <th className="p-3 border-r border-slate-200">📑 AWS CloudTrail</th>
                    <th className="p-3">🛡️ AWS Config</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-150 hover:bg-slate-50 text-slate-600">
                    <td className="p-3 border-r border-slate-200 font-extrabold text-slate-900">Primary Focus</td>
                    <td className="p-3 border-r border-slate-200 font-semibold">Application performance, CPU, logs, system metrics health.</td>
                    <td className="p-3 border-r border-slate-200">API call auditing, security tracing, authorization tracking.</td>
                    <td className="p-3">Resource inventory configurations, continuous baseline compliance.</td>
                  </tr>

                  <tr className="border-b border-slate-150 hover:bg-slate-50 text-slate-600">
                    <td className="p-3 border-r border-slate-200 font-extrabold text-slate-900">Captured Data Type</td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      • System metrics (numeric values)<br />
                      • Log entries &amp; streams (string blocks)<br />
                      • Heartbeat latency gauges
                    </td>
                    <td className="p-3 border-r border-slate-200 leading-normal">
                      • API execution metadata<br />
                      • JSON audits (Caller identity, IP, parameters, response)
                    </td>
                    <td className="p-3 leading-normal">
                      • Resource configuration states<br />
                      • Dependency mapping links<br />
                      • Compliance evaluation history
                    </td>
                  </tr>

                  <tr className="border-b border-slate-150 hover:bg-slate-50 text-slate-600">
                    <td className="p-3 border-r border-slate-200 font-extrabold text-slate-900">Active Ingest Mechanism</td>
                    <td className="p-3 border-r border-slate-200">Unified agent daemon pushing logs, hypervisor background checks.</td>
                    <td className="p-3 border-r border-slate-200">AWS API Control Plane logging triggers.</td>
                    <td className="p-3">Resource configuration change recorders.</td>
                  </tr>

                  <tr className="border-b border-slate-150 hover:bg-slate-50 text-slate-600">
                    <td className="p-3 border-r border-slate-200 font-extrabold text-slate-900">Automation Trigger</td>
                    <td className="p-3 border-r border-slate-200 font-semibold">Alarms based on threshold limits, metric stream alerts.</td>
                    <td className="p-3 border-r border-slate-200">EventBridge routing based on API event patterns.</td>
                    <td className="p-3 font-semibold">Systems Manager (SSM) automated compliance remediation runbooks.</td>
                  </tr>

                  <tr className="hover:bg-slate-50 text-slate-600">
                    <td className="p-3 border-r border-slate-200 font-extrabold text-slate-900">Auditor Fitment</td>
                    <td className="p-3 border-r border-slate-200">No (Operational monitoring).</td>
                    <td className="p-3 border-r border-slate-200 font-semibold text-teal-800">Yes: "Who deleted the database?"</td>
                    <td className="p-3 font-semibold text-amber-800">Yes: "Was public access restricted yesterday?"</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CLOUDWATCH LOGS PIPELINE & LOGS INSIGHTS SIMULATOR                 */}
      {/* ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <div className="cw-card text-left">
            <h2 className="cw-card-title text-indigo-700">
              <FileText className="w-5 h-5" /> CloudWatch Logs, Unified Agent &amp; Insights Sandbox
            </h2>
            <p className="cw-card-desc">
              Applications generate raw files, stdout streams, and error trace lines. The **Unified CloudWatch Agent** collects these logs from EC2, encrypts them, and streams them into **CloudWatch Log Streams**. Use Log Insights to execute aggregates over historical files.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Interactive log ingestion SVG */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
              <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 mb-4 gap-2 text-left">
                <div>
                  <h3 className="font-bold text-sm text-slate-800">Log Ingestion &amp; Streams Pipeline</h3>
                  <p className="text-[11px] text-slate-500">Inject logs from compute sources, configure agents, and verify subscription routing</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <select
                    value={logSource}
                    onChange={(e) => setLogSource(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs outline-none font-semibold text-slate-700"
                  >
                    <option value="ec2">Source: EC2 Instance</option>
                    <option value="lambda">Source: AWS Lambda</option>
                    <option value="rds">Source: Amazon RDS</option>
                  </select>

                  <select
                    value={subscriptionTarget}
                    onChange={(e) => setSubscriptionTarget(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs outline-none font-semibold text-slate-700"
                  >
                    <option value="lambda">Route: Lambda Target</option>
                    <option value="kinesis">Route: Kinesis Stream</option>
                    <option value="opensearch">Route: OpenSearch</option>
                  </select>

                  <button
                    onClick={() => setAgentConfigured(!agentConfigured)}
                    className={`px-2 py-1 rounded text-[10px] font-extrabold border ${
                      agentConfigured ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-rose-50 border-rose-200 text-rose-700'
                    }`}
                  >
                    {agentConfigured ? '🟢 UNIFIED AGENT ACTIVE' : '❌ NO AGENT CONFIGURED'}
                  </button>

                  <button
                    disabled={logsState === 'ingesting'}
                    onClick={runLogIngestion}
                    className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold disabled:bg-slate-200 transition flex items-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5" /> Push Log Event
                  </button>
                </div>
              </div>

              {/* Ingestion SVG Canvas */}
              <div className="w-full h-[240px] rounded-xl border border-slate-200 p-2 relative overflow-hidden flex items-center justify-center shadow-inner bg-slate-50">
                <svg className="w-full h-full max-w-[620px] cw-svg-bg" viewBox="0 0 600 240">
                  <defs>
                    <marker id="log-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--cw-svg-node-border)" />
                    </marker>
                  </defs>

                  {/* Pipelines paths */}
                  <path d="M 80 120 H 140" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" markerEnd="url(#log-arrow)" />
                  <path d="M 230 120 H 270" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" markerEnd="url(#log-arrow)" />
                  
                  {/* Subscription flows */}
                  <path d="M 370 120 Q 420 60, 480 60" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#log-arrow)" />
                  <path d="M 370 120 Q 420 180, 480 180" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#log-arrow)" />

                  {/* Active Ingestion Flow */}
                  {logsState === 'ingesting' && (
                    <>
                      <path d="M 80 120 H 140" fill="none" stroke="var(--cw-svg-indigo-border)" strokeWidth="3" className="cw-flow-blue" />
                      <path d="M 230 120 H 270" fill="none" stroke="var(--cw-svg-green-border)" strokeWidth="3" className="cw-flow-green" />
                      <path d="M 370 120 Q 420 60, 480 60" fill="none" stroke="var(--cw-svg-purple-border)" strokeWidth="2.5" className="cw-flow-purple" />
                      <path d="M 370 120 Q 420 180, 480 180" fill="none" stroke="var(--cw-svg-amber-border)" strokeWidth="2.5" className="cw-flow-orange" />
                    </>
                  )}

                  {/* Source Node */}
                  <g transform="translate(10, 85)" className="cw-node-btn">
                    <rect width="70" height="70" rx="8" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-indigo-border)" strokeWidth="2" />
                    <text x="35" y="24" fill="var(--cw-svg-indigo-text)" fontSize="8" fontWeight="bold" textAnchor="middle">COMPUTE SOURCE</text>
                    <rect x="5" y="32" width="60" height="15" rx="3" fill="var(--cw-svg-indigo-bg)" />
                    <text x="35" y="42" fill="var(--cw-svg-indigo-text)" fontSize="7" fontWeight="bold" textAnchor="middle" style={{ textTransform: 'uppercase' }}>{logSource}</text>
                    <text x="35" y="60" fill="var(--cw-text-muted)" fontSize="6.5" textAnchor="middle">Raw stdout logs</text>
                  </g>

                  {/* Agent Node */}
                  <g transform="translate(140, 85)" className="cw-node-btn">
                    <rect width="90" height="70" rx="8" fill="var(--cw-svg-node-fill)" stroke={agentConfigured ? 'var(--cw-svg-green-border)' : 'var(--cw-svg-red-border)'} strokeWidth="2" />
                    <text x="45" y="22" fill={agentConfigured ? 'var(--cw-svg-green-text)' : 'var(--cw-svg-red-text)'} fontSize="8" fontWeight="extrabold" textAnchor="middle">UNIFIED AGENT</text>
                    <text x="45" y="38" fill="var(--cw-svg-text-dark)" fontSize="7" textAnchor="middle">CloudWatch Daemon</text>
                    <rect x="8" y="46" width="74" height="15" rx="3" fill={agentConfigured ? 'var(--cw-svg-green-bg)' : 'var(--cw-svg-red-bg)'} />
                    <text x="45" y="56" fill={agentConfigured ? 'var(--cw-svg-green-text)' : 'var(--cw-svg-red-text)'} fontSize="7" fontWeight="extrabold" textAnchor="middle">
                      {agentConfigured ? 'Status: Active' : 'Status: Offline'}
                    </text>
                  </g>

                  {/* CloudWatch Logs Node */}
                  <g transform="translate(270, 75)" className="cw-node-btn">
                    <rect width="100" height="90" rx="12" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-indigo-border)" strokeWidth="2.5" />
                    <rect x="5" y="5" width="90" height="16" rx="4" fill="var(--cw-svg-indigo-bg)" />
                    <text x="50" y="16" fill="var(--cw-svg-indigo-text)" fontSize="8" fontWeight="extrabold" textAnchor="middle">☁️ CLOUDWATCH LOGS</text>
                    
                    <rect x="8" y="28" width="84" height="12" rx="2.5" fill="var(--cw-svg-bg)" stroke="var(--cw-svg-node-border)" strokeWidth="0.5" />
                    <text x="14" y="36.5" fill="var(--cw-text-muted)" fontSize="6.5" fontWeight="bold">LogGroup: /aws/app</text>
                    
                    <rect x="8" y="45" width="84" height="12" rx="2.5" fill="var(--cw-svg-bg)" stroke="var(--cw-svg-node-border)" strokeWidth="0.5" />
                    <text x="14" y="53.5" fill="var(--cw-text-muted)" fontSize="6.5" fontWeight="bold">Stream: i-0912ab8</text>

                    <g transform="translate(10, 64)">
                      <circle cx="5" cy="5" r="3" fill="var(--cw-svg-green-border)" />
                      <text x="14" y="8" fill="var(--cw-text-muted)" fontSize="7" fontWeight="bold">Ingestion Gateway</text>
                    </g>
                    <g transform="translate(10, 76)">
                      <circle cx="5" cy="5" r="3" fill="var(--cw-svg-indigo-border)" className="pulse-circle" />
                      <circle cx="5" cy="5" r="3" fill="var(--cw-svg-indigo-border)" />
                      <text x="14" y="20" fill="var(--cw-svg-indigo-text)" fontSize="7" fontWeight="bold" transform="translate(0,-12)">Retention: 30 Days</text>
                    </g>
                  </g>

                  {/* Export / Subscriptions Target Nodes */}
                  <g transform="translate(480, 25)" className="cw-node-btn">
                    <rect width="110" height="70" rx="8" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-purple-border)" strokeWidth="1.5" />
                    <text x="55" y="20" fill="var(--cw-svg-purple-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">📨 SUBSCRIPTION</text>
                    <rect x="10" y="28" width="90" height="15" rx="3.5" fill="var(--cw-svg-purple-bg)" />
                    <text x="55" y="38" fill="var(--cw-svg-purple-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Lambda/Kinesis</text>
                    <text x="55" y="56" fill="var(--cw-text-muted)" fontSize="7" textAnchor="middle">Near-Real-Time Stream</text>
                  </g>

                  <g transform="translate(480, 145)" className="cw-node-btn">
                    <rect width="110" height="70" rx="8" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-amber-border)" strokeWidth="1.5" />
                    <text x="55" y="20" fill="var(--cw-svg-amber-text)" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">🪣 S3 DATA ARCHIVE</text>
                    <rect x="10" y="28" width="90" height="15" rx="3.5" fill="var(--cw-svg-amber-bg)" />
                    <text x="55" y="38" fill="var(--cw-svg-amber-text)" fontSize="7" fontWeight="bold" textAnchor="middle">Bulk Logs Export</text>
                    <text x="55" y="56" fill="var(--cw-text-muted)" fontSize="7" textAnchor="middle">Cold storage archive</text>
                  </g>
                </svg>
              </div>

              {/* Ingestion console trace */}
              <div className="bg-slate-900 border border-slate-950 rounded-xl p-3 h-[90px] font-mono text-[9.5px] text-slate-300 overflow-y-auto space-y-1 text-left mt-3">
                {logTraceLogs.length === 0 ? (
                  <span className="text-slate-500 italic block text-center mt-6">Log pipeline idle. Configure agent settings and click "Push Log Event".</span>
                ) : (
                  logTraceLogs.map((log, i) => {
                    let color = 'text-slate-350';
                    if (log.includes('ERROR') || log.includes('🚨')) color = 'text-rose-400 font-bold';
                    if (log.includes('COMPLETED') || log.includes('✅')) color = 'text-emerald-400 font-bold';
                    if (log.includes('AGENT')) color = 'text-indigo-300 font-bold';
                    return <div key={i} className={`${color} border-b border-slate-800/40 pb-0.5`}>{log}</div>;
                  })
                )}
              </div>
            </div>

            {/* Logs Insights Sandbox */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between text-left">
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Search className="w-4 h-4 text-indigo-600" /> CloudWatch Logs Insights
                </h3>

                {/* Query select */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Select Sample SQL-like Insights Query:</label>
                  <select
                    value={insightsQuery}
                    onChange={(e) => setInsightsQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none font-bold text-slate-700"
                  >
                    <option value="filter-errors">🔍 Query: Filter ERROR &amp; WARN logs</option>
                    <option value="count-levels">📊 Query: Count logs grouped by Level</option>
                    <option value="all-fields">📑 Query: Get all columns ordered by timestamp</option>
                  </select>
                </div>

                {/* SQL display */}
                <div className="bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-[9.5px] leading-relaxed text-indigo-300">
                  {isAzure ? (
                    insightsQuery === 'filter-errors' ? (
                      <>
                        <span className="text-blue-400">Syslog</span><br />
                        <span className="text-blue-400">| where</span> SeverityLevel in ("Error", "Warning")<br />
                        <span className="text-blue-400">| sort by</span> TimeGenerated desc<br />
                        <span className="text-blue-400">| take</span> 10
                      </>
                    ) : insightsQuery === 'count-levels' ? (
                      <>
                        <span className="text-blue-400">Syslog</span><br />
                        <span className="text-blue-400">| summarize</span> count() <span className="text-blue-400">by</span> SeverityLevel<br />
                        <span className="text-blue-400">| order by</span> count_ desc
                      </>
                    ) : (
                      <>
                        <span className="text-blue-400">Syslog</span><br />
                        <span className="text-blue-400">| project</span> TimeGenerated, SeverityLevel, SyslogMessage, ProcessName<br />
                        <span className="text-blue-400">| sort by</span> TimeGenerated desc
                      </>
                    )
                  ) : isGcp ? (
                    insightsQuery === 'filter-errors' ? (
                      <>
                        <span className="text-emerald-400">SELECT</span> timestamp, severity, textPayload<br />
                        <span className="text-emerald-400">FROM</span> `project.global._Default._AllLogs`<br />
                        <span className="text-emerald-400">WHERE</span> severity IN ('ERROR', 'WARNING')<br />
                        <span className="text-emerald-400">ORDER BY</span> timestamp DESC LIMIT 10
                      </>
                    ) : insightsQuery === 'count-levels' ? (
                      <>
                        <span className="text-emerald-400">SELECT</span> severity, COUNT(*) as count<br />
                        <span className="text-emerald-400">FROM</span> `project.global._Default._AllLogs`<br />
                        <span className="text-emerald-400">GROUP BY</span> severity <span className="text-emerald-400">ORDER BY</span> count DESC
                      </>
                    ) : (
                      <>
                        <span className="text-emerald-400">SELECT</span> timestamp, severity, textPayload, insertId<br />
                        <span className="text-emerald-400">FROM</span> `project.global._Default._AllLogs`<br />
                        <span className="text-emerald-400">ORDER BY</span> timestamp DESC
                      </>
                    )
                  ) : (
                    insightsQuery === 'filter-errors' ? (
                      <>
                        <span className="text-indigo-400">fields</span> @timestamp, @message<br />
                        <span className="text-indigo-400">| filter</span> level in ["ERROR", "WARN"]<br />
                        <span className="text-indigo-400">| sort</span> @timestamp desc<br />
                        <span className="text-indigo-400">| limit</span> 10
                      </>
                    ) : insightsQuery === 'count-levels' ? (
                      <>
                        <span className="text-indigo-400">stats</span> count(*) <span className="text-indigo-400">by</span> level<br />
                        <span className="text-indigo-400">| sort</span> count(*) desc
                      </>
                    ) : (
                      <>
                        <span className="text-indigo-400">fields</span> @timestamp, level, message, requestId<br />
                        <span className="text-indigo-400">| sort</span> @timestamp desc
                      </>
                    )
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={insightsRunning || logsList.length === 0}
                    onClick={runInsightsQueryAction}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition disabled:bg-slate-200 flex items-center justify-center gap-1"
                  >
                    <Play className="w-3.5 h-3.5" /> Execute Query
                  </button>
                  <button
                    disabled={logsList.length === 0}
                    onClick={triggerLogS3Export}
                    className="p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-slate-650 flex items-center gap-1 text-xs font-bold"
                  >
                    <Download className="w-4 h-4" /> Export S3
                  </button>
                </div>
              </div>

              {/* Query Results Panel */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 mt-4 min-h-[140px] flex flex-col justify-between">
                <div>
                  <span className="font-extrabold text-[9px] text-slate-400 block uppercase tracking-wider mb-2">Query output rows</span>
                  {insightsRunning ? (
                    <div className="text-center py-6">
                      <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin mx-auto mb-2" />
                      <span className="text-[10px] text-slate-500 font-bold block">Executing custom filter index query...</span>
                    </div>
                  ) : insightsResults.length === 0 ? (
                    <span className="text-[10px] text-slate-400 italic block text-center py-8">No queries executed. Push logs then run above.</span>
                  ) : (
                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                      {insightsQuery === 'count-levels' ? (
                        insightsResults.map((res, i) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-lg p-2 text-[9.5px] leading-normal flex justify-between font-mono font-bold">
                            <span className={res.level === 'ERROR' ? 'text-rose-600' : res.level === 'WARN' ? 'text-amber-600' : 'text-slate-600'}>{res.level}</span>
                            <span className="text-indigo-700">{res.count} instances</span>
                          </div>
                        ))
                      ) : (
                        insightsResults.map((res, i) => (
                          <div key={i} className="bg-white border border-slate-200 rounded-lg p-2 text-[9.5px] leading-normal space-y-1">
                            <div className="flex justify-between font-mono font-bold">
                              <span className={res.level === 'ERROR' ? 'text-rose-600' : res.level === 'WARN' ? 'text-amber-600' : 'text-indigo-600'}>
                                {res.level}
                              </span>
                              <span className="text-slate-400 text-[8.5px]">{res.timestamp}</span>
                            </div>
                            <div className="text-slate-600 text-left font-mono text-[9px] leading-tight truncate">{res.message}</div>
                            <div className="text-[8px] font-bold text-slate-400 font-mono text-left pt-0.5 border-t border-slate-100">reqId: {res.requestId}</div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: METRIC STREAMS, LIVE CHART & ALARMS SANDBOX                        */}
      {/* ========================================================================= */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <div className="cw-card text-left">
            <h2 className="cw-card-title text-indigo-700">
              <Activity className="w-5 h-5" /> CloudWatch Metric Streams &amp; Active Alarms Sandbox
            </h2>
            <p className="cw-card-desc">
              Metric Streams let you forward continuous system health counters directly to S3 Data Lakes or external analysis partners (like Datadog/NewRelic) under 1 minute. CloudWatch Alarms inspect these metrics and launch auto-recovery when thresholds are breached.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Alarm Control panel */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between text-left">
              <div className="space-y-5">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Bell className="w-4 h-4 text-indigo-600" /> Observability Threshold Settings
                </h3>

                {/* Spike trigger */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Simulated Server Workload State:</label>
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">Simulated CPU Spike</span>
                      <span className="text-[10px] text-slate-500">Inject heavy transaction compute load</span>
                    </div>
                    <button
                      onClick={() => setSpikeActive(!metricSpikeActive)}
                      className={`px-4 py-1.5 rounded-lg font-extrabold text-[10px] border transition-all ${
                        metricSpikeActive 
                          ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-650'
                      }`}
                    >
                      {metricSpikeActive ? '🔥 CPU SURGE HOT' : '🟢 NORMAL LOAD'}
                    </button>
                  </div>
                </div>

                {/* Metric streams configure */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Configure CloudWatch Metric Stream Target:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['s3', 'firehose', 'datadog'].map(t => (
                      <button
                        key={t}
                        onClick={() => setMetricStreamTarget(t as any)}
                        className={`p-2 border rounded-lg font-extrabold text-[9px] uppercase transition-all outline-none ${
                          metricStreamTarget === t
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {t === 's3' ? '🪣 S3 Lake' : t === 'firehose' ? '📡 Firehose' : '📊 Datadog'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-slate-500 leading-normal font-semibold">
                    Real-time Kinesis stream delivers metric data block updates every 15 seconds.
                  </p>
                </div>

                {/* Threshold slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>Alarm CPU Threshold:</span>
                    <span className="text-rose-600 font-mono">{alarmCpuThreshold}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="95"
                    value={alarmCpuThreshold}
                    onChange={(e) => setAlarmCpuThreshold(Number(e.target.value))}
                    className="w-full accent-indigo-600"
                  />
                </div>
              </div>

              {/* Dynamic Status card */}
              <div className={`mt-6 border rounded-2xl p-4 transition-all duration-300 ${
                alarmState === 'ALARM' 
                  ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-[0_0_15px_rgba(239,68,68,0.15)] animate-pulse'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-950'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">Alarm Observation State</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold ${
                    alarmState === 'ALARM' ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {alarmState}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {alarmState === 'ALARM' ? (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  )}
                  <p className="text-[11px] leading-relaxed font-bold">
                    {alarmState === 'ALARM' 
                      ? 'WARNING: Threshold limit breached. Invoking ASG Scale-out and SNS Alert policies!'
                      : 'NORMAL: Compute CPU bounds currently within configured threshold values.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Live Chart & Alarms topology diagram */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4 text-left">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">Telemetry Performance &amp; Actions Dispatcher</h4>
                    <p className="text-[11px] text-slate-500">Live CPU metrics and subsequent threshold trigger pathways</p>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    Latest Metric: {metricCpuHistory[metricCpuHistory.length - 1].cpu}% CPU
                  </span>
                </div>

                {/* Recharts Performance Area Chart */}
                <div className="w-full h-[180px] mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={metricCpuHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={alarmState === 'ALARM' ? '#ef4444' : '#6366f1'} stopOpacity={0.4}/>
                          <stop offset="95%" stopColor={alarmState === 'ALARM' ? '#ef4444' : '#6366f1'} stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fontWeight: 'bold', fill: isDark ? '#94a3b8' : '#64748b' }} stroke={isDark ? '#475569' : '#cbd5e1'} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: isDark ? '#94a3b8' : '#64748b' }} stroke={isDark ? '#475569' : '#cbd5e1'} />
                      <Tooltip labelClassName={isDark ? 'font-mono font-bold text-slate-200' : 'font-mono font-bold text-slate-800'} contentStyle={{ fontSize: 10, borderRadius: 8, backgroundColor: isDark ? '#0f172a' : '#ffffff', borderColor: isDark ? '#1e293b' : '#e2e8f0', color: isDark ? '#f1f5f9' : '#0f172a' }} />
                      <Area type="monotone" dataKey="cpu" stroke={alarmState === 'ALARM' ? '#ef4444' : '#6366f1'} strokeWidth={2.5} fillOpacity={1} fill="url(#colorCpu)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Topology SVG map for Alarms actions */}
                <div className="w-full h-[140px] rounded-xl border border-slate-200 relative flex items-center justify-center shadow-inner bg-slate-50 overflow-hidden">
                  <svg className="w-full h-full max-w-[500px] cw-svg-bg" viewBox="0 0 450 140">
                    <defs>
                      <marker id="al-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--cw-svg-node-border)" />
                      </marker>
                    </defs>

                    {/* Pipelines */}
                    <path d="M 120 70 H 180" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" markerEnd="url(#al-arrow)" />
                    <path d="M 220 70 Q 280 30, 320 30" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" markerEnd="url(#al-arrow)" />
                    <path d="M 220 70 H 320" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" markerEnd="url(#al-arrow)" />
                    <path d="M 220 70 Q 280 110, 320 110" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" markerEnd="url(#al-arrow)" />

                    {/* Active flow animations during Alarm */}
                    {alarmState === 'ALARM' && (
                      <>
                        <path d="M 120 70 H 180" fill="none" stroke="var(--cw-svg-red-border)" strokeWidth="2.5" className="cw-flow-orange" />
                        <path d="M 220 70 Q 280 30, 320 30" fill="none" stroke="var(--cw-svg-red-border)" strokeWidth="2.5" className="cw-flow-orange" />
                        <path d="M 220 70 H 320" fill="none" stroke="var(--cw-svg-red-border)" strokeWidth="2.5" className="cw-flow-orange" />
                        <path d="M 220 70 Q 280 110, 320 110" fill="none" stroke="var(--cw-svg-red-border)" strokeWidth="2.5" className="cw-flow-orange" />
                      </>
                    )}

                    {/* Metrics Stream custom target conduit */}
                    <path d="M 60 40 Q 60 10, 150 10" fill="none" stroke="var(--cw-svg-indigo-border)" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#al-arrow)" />
                    <g transform="translate(150, 0)">
                      <rect width="110" height="20" rx="4" fill="var(--cw-svg-indigo-bg)" stroke="var(--cw-svg-indigo-border)" strokeWidth="1" />
                      <text x="55" y="12" fill="var(--cw-svg-indigo-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">STREAMING TO {metricStreamTarget.toUpperCase()}</text>
                    </g>

                    {/* Nodes */}
                    <g transform="translate(10, 40)" className="cw-node-btn">
                      <rect width="110" height="60" rx="8" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-indigo-border)" strokeWidth="2" />
                      <text x="55" y="24" fill="var(--cw-svg-indigo-text)" fontSize="8" fontWeight="bold" textAnchor="middle">📊 CPU METRIC</text>
                      <text x="55" y="40" fill="var(--cw-svg-text-dark)" fontSize="11" fontWeight="black" textAnchor="middle" className="font-mono">
                        {metricCpuHistory[metricCpuHistory.length - 1].cpu}%
                      </text>
                      <text x="55" y="50" fill="var(--cw-text-muted)" fontSize="6.5" textAnchor="middle">Granularity: 10s</text>
                    </g>

                    {/* Alarm Node */}
                    <g transform="translate(180, 50)" className="cw-node-btn">
                      <circle cx="20" cy="20" r="16" className={alarmState === 'ALARM' ? 'flashing-alarm' : ''} fill={alarmState === 'ALARM' ? 'var(--cw-svg-red-border)' : 'var(--cw-svg-green-border)'} stroke="var(--cw-svg-node-fill)" strokeWidth="2" />
                      <text x="20" y="23" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">🔔</text>
                    </g>

                    {/* Action Targets */}
                    <g transform="translate(320, 10)" className="cw-node-btn">
                      <rect width="120" height="30" rx="6" fill="var(--cw-svg-red-bg)" stroke="var(--cw-svg-red-border)" strokeWidth="1" />
                      <text x="60" y="18" fill="var(--cw-svg-red-text)" fontSize="8" fontWeight="bold" textAnchor="middle">📧 SNS Sysops Topic</text>
                    </g>

                    <g transform="translate(320, 55)" className="cw-node-btn">
                      <rect width="120" height="30" rx="6" fill="var(--cw-svg-amber-bg)" stroke="var(--cw-svg-amber-border)" strokeWidth="1" />
                      <text x="60" y="18" fill="var(--cw-svg-amber-text)" fontSize="8" fontWeight="bold" textAnchor="middle">📈 EC2 Auto-Scaling</text>
                    </g>

                    <g transform="translate(320, 100)" className="cw-node-btn">
                      <rect width="120" height="30" rx="6" fill="var(--cw-svg-green-bg)" stroke="var(--cw-svg-green-border)" strokeWidth="1" />
                      <text x="60" y="18" fill="var(--cw-svg-green-text)" fontSize="8" fontWeight="bold" textAnchor="middle">🛠️ SSM Automation</text>
                    </g>
                  </svg>
                </div>
              </div>

              {/* Alarm actions logs console */}
              <div className="bg-slate-900 border border-slate-950 rounded-xl p-3 h-[90px] font-mono text-[9px] text-slate-300 overflow-y-auto space-y-1 text-left mt-3">
                {alarmLogs.length === 0 ? (
                  <span className="text-slate-500 italic block text-center mt-6">Telemetry Alarm monitor running... Click "CPU SURGE HOT" to trigger threshold alerts.</span>
                ) : (
                  alarmLogs.map((log, i) => {
                    let color = 'text-slate-350';
                    if (log.includes('ALARM') || log.includes('🚨')) color = 'text-rose-400 font-bold';
                    if (log.includes('DISPATCH') || log.includes('SSM')) color = 'text-indigo-300 font-bold';
                    if (log.includes('🟢') || log.includes('RESTORED')) color = 'text-emerald-400 font-bold';
                    return <div key={i} className={`${color} border-b border-slate-800/40 pb-0.5`}>{log}</div>;
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EVENTBRIDGE SCHEMA & ROUTING MATRICES                              */}
      {/* ========================================================================= */}
      {activeTab === 'eventbridge' && (
        <div className="space-y-6">
          <div className="cw-card text-left">
            <h2 className="cw-card-title text-indigo-700">
              <Workflow className="w-5 h-5" /> Amazon EventBridge Serverless Event Bus Sandbox
            </h2>
            <p className="cw-card-desc">
              Amazon EventBridge is a serverless event bus that simplifies building event-driven architectures. It receives JSON schemas from AWS services, SaaS partners, or custom apps, matches them against declarative **Rules**, and targets down-stream execution nodes automatically.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Payload editor and source select */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between text-left">
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Terminal className="w-4 h-4 text-indigo-600" /> Event Ingestion &amp; Payload Editor
                </h3>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Select Simulated Event Source Pattern:</label>
                  <select
                    value={eventSourceType}
                    onChange={(e) => setEventSourceType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none font-bold text-slate-700"
                  >
                    <option value="ec2_state">aws.ec2: Instance State Terminated</option>
                    <option value="s3_api">aws.s3: Object Created (Invoice Vault)</option>
                    <option value="custom_order">custom.app.orders: High Value Order Placement</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500">Live JSON Event Payload Schema:</label>
                  <textarea
                    readOnly
                    value={eventPayload}
                    className="w-full h-[180px] bg-slate-950 border border-slate-900 rounded-xl p-3 font-mono text-[9px] leading-relaxed text-indigo-300 outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={routerState !== 'idle'}
                    onClick={runEventRouteSim}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition disabled:bg-slate-200 flex items-center justify-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Dispatch Event to Bus
                  </button>
                  <button
                    onClick={resetRouterSim}
                    className="p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                  >
                    <RefreshCw className="w-4 h-4 text-slate-650" />
                  </button>
                </div>
              </div>
            </div>

            {/* Event routing visualization map */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4 text-left">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">EventBridge Rules Matching Pipeline</h4>
                    <p className="text-[11px] text-slate-500">Evaluates event envelopes against JSON rules and routes to targets</p>
                  </div>
                  <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold ${
                    routerState === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {routerState.toUpperCase()}
                  </span>
                </div>

                {/* Event Routing SVG Diagram */}
                <div className="w-full h-[220px] rounded-xl border border-slate-200 relative flex items-center justify-center shadow-inner bg-slate-50 overflow-hidden">
                  <svg className="w-full h-full max-w-[480px]" viewBox="0 0 450 200">
                    <defs>
                      <marker id="eb-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--cw-svg-node-border)" />
                      </marker>
                    </defs>

                    {/* Path routing channels */}
                    <path d="M 80 100 H 140" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" markerEnd="url(#eb-arrow)" />
                    
                    {/* Rules splits */}
                    <path d="M 230 100 L 285 45" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" />
                    <path d="M 230 100 H 285" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" />
                    <path d="M 230 100 L 285 155" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" />

                    {/* Target channels */}
                    <path d="M 375 45 H 410" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" />
                    <path d="M 375 100 H 410" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" />
                    <path d="M 375 155 H 410" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" />

                    {/* Active lasers during evaluation & routing */}
                    {routerState === 'received' && (
                      <path d="M 80 100 H 140" fill="none" stroke="var(--cw-svg-indigo-border)" strokeWidth="3" className="cw-flow-blue" />
                    )}

                    {routerState === 'evaluating' && (
                      <>
                        <path d="M 80 100 H 140" fill="none" stroke="var(--cw-svg-indigo-border)" strokeWidth="2.5" />
                        <circle cx="185" cy="100" r="28" fill="var(--cw-svg-indigo-bg)" stroke="var(--cw-svg-indigo-border)" className="pulse-circle" strokeWidth="1" />
                      </>
                    )}

                    {routerState === 'routed' && (
                      <>
                        <path d="M 80 100 H 140" fill="none" stroke="var(--cw-svg-indigo-border)" strokeWidth="2" />
                        {eventSourceType === 'ec2_state' && (
                          <>
                            <path d="M 230 100 L 285 45" fill="none" stroke="var(--cw-svg-purple-border)" strokeWidth="2.5" className="cw-flow-purple" />
                            <path d="M 230 100 H 285" fill="none" stroke="var(--cw-svg-purple-border)" strokeWidth="2.5" className="cw-flow-purple" />
                            <path d="M 375 45 H 410" fill="none" stroke="var(--cw-svg-purple-border)" strokeWidth="2" />
                            <path d="M 375 100 H 410" fill="none" stroke="var(--cw-svg-purple-border)" strokeWidth="2" />
                          </>
                        )}
                        {eventSourceType === 's3_api' && (
                          <>
                            <path d="M 230 100 L 285 155" fill="none" stroke="var(--cw-svg-green-border)" strokeWidth="2.5" className="cw-flow-green" />
                            <path d="M 375 155 H 410" fill="none" stroke="var(--cw-svg-green-border)" strokeWidth="2" />
                          </>
                        )}
                        {eventSourceType === 'custom_order' && (
                          <>
                            <path d="M 230 100 H 285" fill="none" stroke="var(--cw-svg-amber-border)" strokeWidth="2.5" className="cw-flow-orange" />
                            <path d="M 375 100 H 410" fill="none" stroke="var(--cw-svg-amber-border)" strokeWidth="2" />
                          </>
                        )}
                      </>
                    )}

                    {/* Source Node */}
                    <g transform="translate(10, 75)" className="cw-node-btn">
                      <rect width="70" height="50" rx="6" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-indigo-border)" strokeWidth="1.5" />
                      <text x="35" y="24" fill="var(--cw-svg-indigo-text)" fontSize="8" fontWeight="bold" textAnchor="middle">🗳️ SOURCE</text>
                      <text x="35" y="38" fill="var(--cw-text-muted)" fontSize="7" textAnchor="middle" style={{ textTransform: 'uppercase' }}>{eventSourceType.split('_')[0]}</text>
                    </g>

                    {/* Event Bus Coordinator */}
                    <g transform="translate(140, 65)" className="cw-node-btn">
                      <rect width="90" height="70" rx="10" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-indigo-border)" strokeWidth="2.5" />
                      <rect x="5" y="5" width="80" height="15" rx="3.5" fill="var(--cw-svg-indigo-bg)" />
                      <text x="45" y="16" fill="var(--cw-svg-indigo-text)" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">EVENT BUS</text>
                      <text x="45" y="38" fill="var(--cw-svg-text-dark)" fontSize="8" fontWeight="bold" textAnchor="middle">rules match</text>
                      <text x="45" y="52" fill="var(--cw-text-muted)" fontSize="7.5" textAnchor="middle">Default Bus</text>
                    </g>

                    {/* Declarative Rules */}
                    <g transform="translate(285, 25)" className="cw-node-btn">
                      <rect width="90" height="40" rx="6" fill="var(--cw-svg-node-fill)" stroke={matchedRulesList.includes('Ec2TerminationAlert') ? 'var(--cw-svg-purple-border)' : 'var(--cw-svg-node-border)'} strokeWidth="1.5" />
                      <text x="45" y="18" fill="var(--cw-svg-text-dark)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Rule: EC2Term</text>
                      <text x="45" y="30" fill={matchedRulesList.includes('Ec2TerminationAlert') ? 'var(--cw-svg-purple-text)' : 'var(--cw-text-muted)'} fontSize="7" fontWeight="bold" textAnchor="middle">
                        {matchedRulesList.includes('Ec2TerminationAlert') ? '🎯 MATCHED' : 'Skip'}
                      </text>
                    </g>

                    <g transform="translate(285, 80)" className="cw-node-btn">
                      <rect width="90" height="40" rx="6" fill="var(--cw-svg-node-fill)" stroke={
                        matchedRulesList.includes('HighValueOrderApproveAlert') || matchedRulesList.includes('AutoscalingSyncRule') ? 'var(--cw-svg-purple-border)' : 'var(--cw-svg-node-border)'
                      } strokeWidth="1.5" />
                      <text x="45" y="18" fill="var(--cw-svg-text-dark)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Rule: HighValOrder</text>
                      <text x="45" y="30" fill={
                        matchedRulesList.includes('HighValueOrderApproveAlert') || matchedRulesList.includes('AutoscalingSyncRule') ? 'var(--cw-svg-purple-text)' : 'var(--cw-text-muted)'
                      } fontSize="7" fontWeight="bold" textAnchor="middle">
                        {matchedRulesList.includes('HighValueOrderApproveAlert') || matchedRulesList.includes('AutoscalingSyncRule') ? '🎯 MATCHED' : 'Skip'}
                      </text>
                    </g>

                    <g transform="translate(285, 135)" className="cw-node-btn">
                      <rect width="90" height="40" rx="6" fill="var(--cw-svg-node-fill)" stroke={matchedRulesList.includes('InvoiceIngestPipeline') ? 'var(--cw-svg-green-border)' : 'var(--cw-svg-node-border)'} strokeWidth="1.5" />
                      <text x="45" y="18" fill="var(--cw-svg-text-dark)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Rule: S3Invoice</text>
                      <text x="45" y="30" fill={matchedRulesList.includes('InvoiceIngestPipeline') ? 'var(--cw-svg-green-text)' : 'var(--cw-text-muted)'} fontSize="7" fontWeight="bold" textAnchor="middle">
                        {matchedRulesList.includes('InvoiceIngestPipeline') ? '🎯 MATCHED' : 'Skip'}
                      </text>
                    </g>

                    {/* Routing Target Outlets */}
                    <circle cx="420" cy="45" r="10" fill="var(--cw-svg-purple-border)" stroke="var(--cw-svg-node-fill)" strokeWidth="1.5" className="cw-node-btn" />
                    <text x="420" y="48" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">λ</text>

                    <circle cx="420" cy="100" r="10" fill="var(--cw-svg-amber-border)" stroke="var(--cw-svg-node-fill)" strokeWidth="1.5" className="cw-node-btn" />
                    <text x="420" y="103" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">🔔</text>

                    <circle cx="420" cy="155" r="10" fill="var(--cw-svg-green-border)" stroke="var(--cw-svg-node-fill)" strokeWidth="1.5" className="cw-node-btn" />
                    <text x="420" y="158" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">⚙️</text>
                  </svg>
                </div>
              </div>

              {/* Event routing logs */}
              <div className="bg-slate-900 border border-slate-950 rounded-xl p-3 h-[90px] font-mono text-[9px] text-slate-300 overflow-y-auto space-y-1 text-left mt-3">
                {routerLogs.length === 0 ? (
                  <span className="text-slate-500 italic block text-center mt-6">Event router ready. Select a payload and click "Dispatch Event to Bus".</span>
                ) : (
                  routerLogs.map((log, i) => {
                    let color = 'text-slate-350';
                    if (log.includes('RULE MATCHED') || log.includes('🎯')) color = 'text-purple-300 font-bold bg-purple-950/30 px-1 rounded';
                    if (log.includes('TARGET')) color = 'text-amber-400 font-semibold';
                    if (log.includes('COMPLETED') || log.includes('✅')) color = 'text-emerald-400 font-bold';
                    return <div key={i} className={`${color} border-b border-slate-800/40 pb-0.5`}>{log}</div>;
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: COMPLIANCE AUDITING: CLOUDTRAIL VS CONFIG                          */}
      {/* ========================================================================= */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="cw-card text-left">
            <h2 className="cw-card-title text-indigo-700">
              <Shield className="w-5 h-5" /> Governance Sandbox: CloudTrail API Auditing vs AWS Config Continuous Compliance
            </h2>
            <p className="cw-card-desc">
              Understand how AWS auditing operates. **CloudTrail** records API control plane events to audit user actions. **AWS Config** tracks resource inventory configuration states, checks continuous compliance policies, and triggers System Manager (SSM) auto-remediations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left side actions selector */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between text-left">
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Sliders className="w-4 h-4 text-indigo-600" /> Compliance Sandbox Scenarios
                </h3>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Trigger API Action Call:</label>
                  <div className="grid grid-cols-1 gap-2.5">
                    <button
                      onClick={() => setAuditAction('open_s3_public')}
                      className={`p-3 text-left border rounded-xl transition-all text-xs font-semibold ${
                        auditAction === 'open_s3_public'
                          ? 'bg-rose-50 border-rose-400 text-rose-950 ring-1 ring-rose-300'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      🔓 PutBucketPolicy (Make S3 Public)
                      <span className="block text-[9px] text-slate-400 font-medium mt-0.5">Captures API call + Config auto-remediation response</span>
                    </button>

                    <button
                      onClick={() => setAuditAction('terminate_ec2')}
                      className={`p-3 text-left border rounded-xl transition-all text-xs font-semibold ${
                        auditAction === 'terminate_ec2'
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-1 ring-indigo-300'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      💥 TerminateInstances (Delete Server)
                      <span className="block text-[9px] text-slate-400 font-medium mt-0.5">Logs audit trail events + Config relationships breakdown</span>
                    </button>

                    <button
                      onClick={() => setAuditAction('delete_bucket')}
                      className={`p-3 text-left border rounded-xl transition-all text-xs font-semibold ${
                        auditAction === 'delete_bucket'
                          ? 'bg-amber-50 border-amber-400 text-amber-950 ring-1 ring-amber-300'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      ❌ Unauthorized DeleteBucket attempt
                      <span className="block text-[9px] text-slate-400 font-medium mt-0.5">Logs failed API trail + CloudTrail Insights anomaly tracking</span>
                    </button>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    disabled={complianceState !== 'idle'}
                    onClick={triggerAuditAction}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition disabled:bg-slate-200 flex items-center justify-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" /> Dispatch API Action
                  </button>
                  <button
                    onClick={resetComplianceSim}
                    className="p-2.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition text-slate-650"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right side auditing visualizer */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4 text-left">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800">CloudTrail &amp; Config Remediation Flow</h4>
                    <p className="text-[11px] text-slate-500">How API logs link to configuration timelines and auto-remediation Systems Manager tasks</p>
                  </div>
                  <span className={`text-[9px] px-2.5 py-0.5 rounded font-extrabold uppercase ${
                    complianceState === 'non_compliant' || complianceState === 'remediating' 
                      ? 'bg-rose-600 text-white flashing-alarm' 
                      : complianceState === 'compliant'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-800'
                  }`}>
                    {complianceState || 'idle'}
                  </span>
                </div>

                {/* CloudTrail vs Config visual topology */}
                <div className="w-full h-[220px] rounded-xl border border-slate-200 relative flex items-center justify-center shadow-inner bg-slate-50 overflow-hidden">
                  <svg className="w-full h-full max-w-[500px] cw-svg-bg" viewBox="0 0 450 200">
                    <defs>
                      <marker id="au-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--cw-svg-node-border)" />
                      </marker>
                    </defs>

                    {/* Pathways */}
                    {/* User API dispatch */}
                    <path d="M 75 100 H 130" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" markerEnd="url(#au-arrow)" />
                    
                    {/* CloudTrail splits */}
                    <path d="M 210 100 Q 250 45, 290 45" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" markerEnd="url(#au-arrow)" />
                    {/* Config splits */}
                    <path d="M 210 100 Q 250 155, 290 155" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" markerEnd="url(#au-arrow)" />

                    {/* Remediation conduit */}
                    <path d="M 370 155 Q 310 185, 210 185" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1" strokeDasharray="3 3" />
                    <path d="M 210 185 Q 110 185, 75 105" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Active conduits during auditing */}
                    {complianceState === 'api_call' && (
                      <path d="M 75 100 H 130" fill="none" stroke="var(--cw-svg-indigo-border)" strokeWidth="3" className="cw-flow-blue" />
                    )}

                    {complianceState === 'cloudtrail_log' && (
                      <path d="M 210 100 Q 250 45, 290 45" fill="none" stroke="var(--cw-svg-green-border)" strokeWidth="3" className="cw-flow-green" />
                    )}

                    {complianceState === 'config_eval' && (
                      <path d="M 210 100 Q 250 155, 290 155" fill="none" stroke="var(--cw-svg-amber-border)" strokeWidth="3" className="cw-flow-orange" />
                    )}

                    {complianceState === 'non_compliant' && (
                      <>
                        <path d="M 210 100 Q 250 155, 290 155" fill="none" stroke="var(--cw-svg-red-border)" strokeWidth="3" />
                        <circle cx="330" cy="155" r="28" fill="none" stroke="var(--cw-svg-red-border)" strokeWidth="1.5" className="pulse-circle" />
                      </>
                    )}

                    {complianceState === 'remediating' && (
                      <>
                        <path d="M 370 155 Q 310 185, 210 185" fill="none" stroke="var(--cw-svg-purple-border)" strokeWidth="2.5" className="cw-flow-purple" />
                        <path d="M 210 185 Q 110 185, 75 105" fill="none" stroke="var(--cw-svg-purple-border)" strokeWidth="2.5" className="cw-flow-purple" />
                      </>
                    )}

                    {/* Nodes */}
                    <g transform="translate(10, 75)" className="cw-node-btn">
                      <rect width="65" height="50" rx="6" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-indigo-border)" strokeWidth="2" />
                      <text x="32.5" y="22" fill="var(--cw-svg-indigo-text)" fontSize="8" fontWeight="bold" textAnchor="middle">📱 USER API</text>
                      <text x="32.5" y="36" fill="var(--cw-svg-text-dark)" fontSize="7" textAnchor="middle">alice_sec</text>
                      <text x="32.5" y="44" fill="var(--cw-text-muted)" fontSize="6.5" fontStyle="italic" textAnchor="middle">PutBucketPolicy</text>
                    </g>

                    <g transform="translate(130, 75)" className="cw-node-btn">
                      <rect width="80" height="50" rx="8" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" />
                      <text x="40" y="24" fill="var(--cw-svg-text-dark)" fontSize="8" fontWeight="bold" textAnchor="middle">AWS Bucket</text>
                      <text x="40" y="38" fill="var(--cw-text-muted)" fontSize="7.5" textAnchor="middle">Target S3 Pool</text>
                    </g>

                    {/* CloudTrail logging node */}
                    <g transform="translate(290, 15)" className="cw-node-btn">
                      <rect width="115" height="60" rx="8" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-green-border)" strokeWidth="2" />
                      <rect x="5" y="5" width="105" height="15" rx="3" fill="var(--cw-svg-green-bg)" />
                      <text x="57.5" y="15" fill="var(--cw-svg-green-text)" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">📑 CLOUDTRAIL AUDIT</text>
                      <text x="57.5" y="36" fill="var(--cw-svg-text-dark)" fontSize="7" textAnchor="middle">API management log</text>
                      <text x="57.5" y="48" fill="var(--cw-text-muted)" fontSize="6.5" fontStyle="italic" textAnchor="middle">s3://central-trails/</text>
                    </g>

                    {/* AWS Config Compliance node */}
                    <g transform="translate(290, 125)" className="cw-node-btn">
                      <rect width="115" height="60" rx="8" fill="var(--cw-svg-node-fill)" stroke={
                        complianceState === 'non_compliant' || complianceState === 'remediating' ? 'var(--cw-svg-red-border)' :
                        complianceState === 'compliant' ? 'var(--cw-svg-green-border)' : 'var(--cw-svg-amber-border)'
                      } strokeWidth="2" />
                      <rect x="5" y="5" width="105" height="15" rx="3" fill={
                        complianceState === 'non_compliant' || complianceState === 'remediating' ? 'var(--cw-svg-red-bg)' :
                        complianceState === 'compliant' ? 'var(--cw-svg-green-bg)' : 'var(--cw-svg-amber-bg)'
                      } />
                      <text x="57.5" y="15" fill={
                        complianceState === 'non_compliant' || complianceState === 'remediating' ? 'var(--cw-svg-red-text)' :
                        complianceState === 'compliant' ? 'var(--cw-svg-green-text)' : 'var(--cw-svg-amber-text)'
                      } fontSize="7.5" fontWeight="extrabold" textAnchor="middle">🛡️ AWS CONFIG compliance</text>
                      
                      <text x="57.5" y="36" fill="var(--cw-svg-text-dark)" fontSize="7.5" textAnchor="middle">Rule: s3-public-prohibited</text>
                      <text x="57.5" y="48" fill={
                        complianceState === 'non_compliant' || complianceState === 'remediating' ? 'var(--cw-svg-red-text)' :
                        complianceState === 'compliant' ? 'var(--cw-svg-green-text)' : 'var(--cw-svg-amber-text)'
                      } fontSize="7.5" fontWeight="extrabold" textAnchor="middle">
                        {complianceState === 'non_compliant' ? '❌ NON_COMPLIANT' :
                         complianceState === 'compliant' ? '✅ COMPLIANT' : 'Evaluating...'}
                      </text>
                    </g>
                  </svg>
                </div>
              </div>

              {/* Compliance trace logs */}
              <div className="bg-slate-900 border border-slate-950 rounded-xl p-3 h-[90px] font-mono text-[9px] text-slate-300 overflow-y-auto space-y-1 text-left mt-3">
                {complianceLogs.length === 0 ? (
                  <span className="text-slate-500 italic block text-center mt-6">Compliance auditor idle. Select an API action and click "Dispatch API Action".</span>
                ) : (
                  complianceLogs.map((log, i) => {
                    let color = 'text-slate-350';
                    if (log.includes('NON_COMPLIANT') || log.includes('🚨')) color = 'text-rose-400 font-bold bg-rose-950/30 px-1 rounded animate-pulse';
                    if (log.includes('CLOUDTRAIL') || log.includes('📑')) color = 'text-emerald-300 font-bold';
                    if (log.includes('RE-REMEDIATION') || log.includes('SSM')) color = 'text-purple-300 font-bold bg-purple-950/30 px-1 rounded';
                    if (log.includes('✅') || log.includes('RESTORED')) color = 'text-emerald-400 font-bold';
                    return <div key={i} className={`${color} border-b border-slate-800/40 pb-0.5`}>{log}</div>;
                  })
                )}
              </div>
            </div>
          </div>

          {/* CloudWatch Resource-Based Policies / Streams theory descriptions at the bottom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-left">
            <div className="border border-slate-150 rounded-2xl p-4 bg-white shadow-sm hover:border-indigo-300 transition-all">
              <h4 className="font-bold text-xs text-indigo-850 block mb-2">📑 CloudWatch Resource-Based Policies &amp; Log Streams</h4>
              <p className="text-[11px] leading-relaxed text-slate-650 mb-2">
                By default, CloudWatch Log Groups are isolated resources. To route logs across AWS Accounts, or ingest logs generated by other service gates (such as Route 53 DNS Queries or Amazon OpenSearch), you configure **CloudWatch Resource-Based Policies**. These JSON trust policies explicitly authorize external service principals to execute <code>PutLogEvents</code> API writes straight into your target Log Streams.
              </p>
            </div>

            <div className="border border-slate-150 rounded-2xl p-4 bg-white shadow-sm hover:border-indigo-300 transition-all">
              <h4 className="font-bold text-xs text-indigo-850 block mb-2">🛡️ EventBridge SaaS Integration &amp; Custom Event Buses</h4>
              <p className="text-[11px] leading-relaxed text-slate-650 mb-2">
                EventBridge goes beyond AWS internal pipelines. Setting up a **SaaS Partner Event Bus** lets you ingest telemetry directly from external systems like Zendesk, Datadog, or Auth0. Custom applications write native JSON envelopes to dedicated **Custom Event Buses**. EventBridge Rule matching filters evaluate structural payloads, matching custom tags under 2ms to split, fan-out, and dispatch events to up to 5 concurrent target pipelines.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: COMPARATIVE OBSERVABILITY MATRIX & AGGREGATION MAP SANDBOX         */}
      {/* ========================================================================= */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="cw-card text-left">
            <h2 className="cw-card-title text-indigo-700">
              <Sliders className="w-5 h-5" /> Architectural Comparative Matrix &amp; Aggregation Sandbox
            </h2>
            <p className="cw-card-desc">
              Examine the differences between core observability topics. Choose a comparative dimension on the left to see memory mnemonics, strict performance grids, code policies, and a state-driven dynamic topological diagram.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left side actions selector & grid */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between text-left">
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-3">
                  <Sliders className="w-4 h-4 text-indigo-650" /> Select Comparison Area
                </h3>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => { setMatrixTopic('sources'); resetMatrixSim(); }}
                    className={`p-2.5 text-left border rounded-xl transition-all text-xs font-semibold ${
                      matrixTopic === 'sources'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-1 ring-indigo-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    🔍 1. Log Sources &amp; Formats
                    <span className="block text-[9.5px] text-slate-400 font-medium mt-0.5">VPC Flow vs API Gateway vs DNS Queries vs CloudTrail</span>
                  </button>

                  <button
                    onClick={() => { setMatrixTopic('agents'); resetMatrixSim(); }}
                    className={`p-2.5 text-left border rounded-xl transition-all text-xs font-semibold ${
                      matrixTopic === 'agents'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-1 ring-indigo-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    ⚙️ 2. Telemetry Ingress Agents
                    <span className="block text-[9.5px] text-slate-400 font-medium mt-0.5">SDK writes vs Legacy logs vs Unified System Agent</span>
                  </button>

                  <button
                    onClick={() => { setMatrixTopic('subscriptions'); resetMatrixSim(); }}
                    className={`p-2.5 text-left border rounded-xl transition-all text-xs font-semibold ${
                      matrixTopic === 'subscriptions'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-1 ring-indigo-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    ⚡ 3. Real-Time Subs vs S3 Exports
                    <span className="block text-[9.5px] text-slate-400 font-medium mt-0.5">Filter dispatch (12ms) vs Batch Exports (12h buffer task)</span>
                  </button>

                  <button
                    onClick={() => { setMatrixTopic('metricstreams'); resetMatrixSim(); }}
                    className={`p-2.5 text-left border rounded-xl transition-all text-xs font-semibold ${
                      matrixTopic === 'metricstreams'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-1 ring-indigo-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    🌊 4. Metric Streams vs Polling
                    <span className="block text-[9.5px] text-slate-400 font-medium mt-0.5">Continuous low-latency push vs getMetricData pulls</span>
                  </button>

                  <button
                    onClick={() => { setMatrixTopic('aggregation'); resetMatrixSim(); }}
                    className={`p-2.5 text-left border rounded-xl transition-all text-xs font-semibold ${
                      matrixTopic === 'aggregation'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-1 ring-indigo-300'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    🌐 5. Cross-Account Aggregation Map
                    <span className="block text-[9.5px] text-slate-400 font-medium mt-0.5">Multi-account boundary fanning via IAM Role &amp; Access Policies</span>
                  </button>
                </div>

                {/* Comparative details display */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] leading-relaxed text-slate-750">
                  {matrixTopic === 'sources' && (
                    <div className="space-y-2.5">
                      <div className="bg-indigo-950 text-indigo-100 p-2 rounded-lg font-bold border-l-4 border-indigo-500 text-[10.5px]">
                        🧠 Memory Hook:
                        <span className="block font-semibold mt-0.5 text-[9.5px] text-indigo-200">
                          "VPC Flow audits raw IP packet interfaces. API GW tracks HTTP API payloads. Route 53 audits DNS resolvers. CloudTrail tracks WHO deleted WHAT resource."
                        </span>
                      </div>
                      <table className="w-full text-[9.5px]">
                        <tbody>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1 w-20 text-slate-900">VPC Flow</td><td className="text-slate-600">IP packets at ENI network cards (ACCEPT/REJECT status).</td></tr>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1 text-slate-900">API Gateway</td><td className="text-slate-600">L7 HTTP latency, Client IPs, status codes, and execution errors.</td></tr>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1 text-slate-900">Route 53</td><td className="text-slate-600">Domain queries, Query Type (A/AAAA/CNAME), Resolver IPs.</td></tr>
                          <tr><td className="font-bold py-1 text-slate-900">CloudTrail</td><td className="text-slate-600">API call auditing (JSON trails including user Identity &amp; sourceIp).</td></tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {matrixTopic === 'agents' && (
                    <div className="space-y-2.5">
                      <div className="bg-indigo-950 text-indigo-100 p-2 rounded-lg font-bold border-l-4 border-indigo-500 text-[10.5px]">
                        🧠 Memory Hook:
                        <span className="block font-semibold mt-0.5 text-[9.5px] text-indigo-200">
                          "SDK speaks direct code custom APIs. Legacy Agent only ships basic file lines. Unified Agent is the king—compiling system metrics + syslog file streams."
                        </span>
                      </div>
                      <table className="w-full text-[9.5px]">
                        <tbody>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1 w-20 text-slate-900">SDK Writes</td><td className="text-slate-600">Direct `PutLogEvents` calls. High flexibility, no host daemon required.</td></tr>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1 text-slate-900">Legacy Agent</td><td className="text-slate-600">Basic file logging only. Zero host metrics visibility. (Deprecated).</td></tr>
                          <tr><td className="font-bold py-1 text-slate-900">Unified Agent</td><td className="text-slate-600">Aggregates CPU/RAM/Disk IO metrics AND log files. Multi-OS compliant.</td></tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {matrixTopic === 'subscriptions' && (
                    <div className="space-y-2.5">
                      <div className="bg-indigo-950 text-indigo-100 p-2 rounded-lg font-bold border-l-4 border-indigo-500 text-[10.5px]">
                        🧠 Memory Hook:
                        <span className="block font-semibold mt-0.5 text-[9.5px] text-indigo-200">
                          "S3 Export is the cold archive slow turtle (12-hour lag). Real-time subscription is the cheetah fanning filter matches (12ms) down to Kinesis/Lambda."
                        </span>
                      </div>
                      <table className="w-full text-[9.5px]">
                        <tbody>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1 w-20 text-slate-900">S3 Exports</td><td className="text-slate-600">Via `CreateExportTask`. High latency (up to 12h cold lag). Batch retention.</td></tr>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1 text-slate-900">Subscription</td><td className="text-slate-600">Instant direct streams (latency &lt; 50ms) via pattern Subscription Filters.</td></tr>
                          <tr><td className="font-bold py-1 text-slate-900">Destinations</td><td className="text-slate-600">Direct to Lambda, Kinesis Data Streams (KDS), or Firehose (KDF).</td></tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {matrixTopic === 'metricstreams' && (
                    <div className="space-y-2.5">
                      <div className="bg-indigo-950 text-indigo-100 p-2 rounded-lg font-bold border-l-4 border-indigo-500 text-[10.5px]">
                        🧠 Memory Hook:
                        <span className="block font-semibold mt-0.5 text-[9.5px] text-indigo-200">
                          "Polling is pulling metrics through rate-limited gates. Metric Streams are high-speed firehoses pushing system telemetry straight to SaaS endpoints."
                        </span>
                      </div>
                      <table className="w-full text-[9.5px]">
                        <tbody>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1 w-20 text-slate-900">Standard Pull</td><td className="text-slate-600">`GetMetricData` polling. Latency of 1-5 minutes. Prone to API throttling.</td></tr>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1 text-slate-900">Metric Stream</td><td className="text-slate-600">Continuous push streaming. Low latency (&lt;3s delay). Auto-scale throughput.</td></tr>
                          <tr><td className="font-bold py-1 text-slate-900">SaaS Sync</td><td className="text-slate-600">Native KDF routing to Datadog, Splunk, Dynatrace, New Relic, or S3.</td></tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {matrixTopic === 'aggregation' && (
                    <div className="space-y-2.5">
                      <div className="bg-indigo-950 text-indigo-100 p-2 rounded-lg font-bold border-l-4 border-indigo-500 text-[10.5px]">
                        🧠 Memory Hook:
                        <span className="block font-semibold mt-0.5 text-[9.5px] text-indigo-200">
                          "Sender Account creates the Subscription Filter &amp; assumes the IAM Role. Recipient Account owns the Central KDS &amp; opens the gate with a Destination Access Policy."
                        </span>
                      </div>
                      <table className="w-full text-[9.5px]">
                        <tbody>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1 w-24 text-slate-900">IAM Role (Sender)</td><td className="text-slate-600">Created in Source Account. Grants `logs.amazonaws.com` permission to put records to central KDS.</td></tr>
                          <tr className="border-b border-slate-200"><td className="font-bold py-1 text-slate-900">Resource Policy</td><td className="text-slate-600">Created in Central Account. Authorizes source account root to write to central Destination.</td></tr>
                          <tr><td className="font-bold py-1 text-slate-900">Central Hub</td><td className="text-slate-600">Combines multi-region fanned traffic inside Kinesis Data Streams &rarr; Firehose &rarr; S3 lake.</td></tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {matrixTopic === 'aggregation' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                    <span className="text-xs font-bold text-slate-800 block">Security Policy Configurator:</span>
                    <label className="flex items-center gap-2 text-xs text-slate-650 cursor-pointer font-semibold select-none">
                      <input
                        type="checkbox"
                        checked={matrixPolicyCorrect}
                        onChange={(e) => {
                          setMatrixPolicyCorrect(e.target.checked);
                          resetMatrixSim();
                        }}
                        className="rounded border-slate-350 text-indigo-650 accent-indigo-600 w-4 h-4"
                      />
                      Enable Correct Destination Access Policy
                    </label>
                    <p className="text-[9.5px] text-slate-400">
                      Disabling simulating is a great way to verify how Destination Access Policies block rogue account logs at the Recipient Account boundary!
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  onClick={runMatrixSimulation}
                  disabled={matrixSimState === 'running'}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-white shadow transition-all ${
                    matrixSimState === 'running'
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-150 active:scale-95'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  {matrixSimState === 'running' ? 'Streaming Simulation...' : 'Simulate Telemetry Flow'}
                </button>
                
                <button
                  onClick={resetMatrixSim}
                  disabled={matrixSimState === 'running'}
                  className="px-3 border border-slate-250 hover:bg-slate-50 text-slate-650 rounded-xl transition-all"
                  title="Reset"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right column: Beautiful Dynamic SVG Topology */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative">
              <div className="w-full border-b border-slate-100 pb-3 mb-4 text-left">
                <h3 className="font-bold text-sm text-slate-800">
                  {matrixTopic === 'sources' && 'Topology Map: Ingress Logs & CloudTrail Auditing'}
                  {matrixTopic === 'agents' && 'Topology Map: Systems Agent Telemetry Footprint'}
                  {matrixTopic === 'subscriptions' && 'Topology Map: Real-Time Subscriptions vs 12h Cold S3 Exports'}
                  {matrixTopic === 'metricstreams' && 'Topology Map: Metric Streams Low-Latency Pipelines'}
                  {matrixTopic === 'aggregation' && 'Topology Map: Cross-Account Multi-Region Log Aggregation'}
                </h3>
                <p className="text-[11px] text-slate-500">Interactive live schematic showing telemetry paths, data shapes, and gatekeepers</p>
              </div>

              <div className="w-full h-[280px] bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden flex items-center justify-center cw-svg-bg">
                {/* Visual indicator alert badges */}
                {matrixSimState === 'running' && (
                  <span className="absolute top-3 left-3 bg-sky-100 border border-sky-300 text-sky-700 font-extrabold text-[9px] px-2 py-0.5 rounded animate-pulse select-none z-10">
                    ⚡ SIMULATOR ACTIVE
                  </span>
                )}
                {matrixSimState === 'success' && (
                  <span className="absolute top-3 left-3 bg-emerald-100 border border-emerald-300 text-emerald-700 font-extrabold text-[9px] px-2 py-0.5 rounded select-none z-10 animate-bounce">
                    ✅ DELIVERY SUCCESSFUL
                  </span>
                )}
                {matrixSimState === 'failed' && (
                  <span className="absolute top-3 left-3 bg-rose-100 border border-rose-300 text-rose-700 font-extrabold text-[9px] px-2 py-0.5 rounded select-none z-10 animate-pulse">
                    🚨 403 API BLOCKED
                  </span>
                )}

                <svg className="w-full h-full" viewBox="0 0 280 180">
                  <defs>
                    <marker id="arrow-matrix" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--cw-svg-node-border)" />
                    </marker>
                    <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--cw-svg-indigo-border)" />
                    </marker>
                    <marker id="arrow-rose" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--cw-svg-red-border)" />
                    </marker>
                    <marker id="arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--cw-svg-green-border)" />
                    </marker>
                  </defs>

                  {/* 1. SOURCES DIAGRAM */}
                  {matrixTopic === 'sources' && (
                    <g>
                      {/* Left: 4 Sources */}
                      <g transform="translate(15, 10)">
                        <rect x="0" y="0" width="60" height="22" rx="4" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-node-border)" strokeWidth="1" />
                        <text x="30" y="14" fill="var(--cw-svg-text-dark)" fontSize="7" fontWeight="bold" textAnchor="middle">🌐 VPC Flow</text>
                        <path d="M 60 11 L 100 50" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1" markerEnd="url(#arrow-matrix)" />
                        {matrixSimState === 'running' && <circle r="2.5" fill="var(--cw-svg-indigo-border)"><animateMotion dur="1.5s" repeatCount="indefinite" path="M 60 11 L 100 50" /></circle>}
                      </g>

                      <g transform="translate(15, 45)">
                        <rect x="0" y="0" width="60" height="22" rx="4" fill="var(--cw-svg-purple-bg)" stroke="var(--cw-svg-purple-border)" strokeWidth="1" />
                        <text x="30" y="14" fill="var(--cw-svg-purple-text)" fontSize="7" fontWeight="bold" textAnchor="middle">📲 API Gateway</text>
                        <path d="M 60 11 L 100 20" fill="none" stroke="var(--cw-svg-purple-border)" strokeWidth="1" markerEnd="url(#arrow-matrix)" />
                        {matrixSimState === 'running' && <circle r="2.5" fill="var(--cw-svg-purple-border)"><animateMotion dur="1.2s" repeatCount="indefinite" path="M 60 11 L 100 20" /></circle>}
                      </g>

                      <g transform="translate(15, 80)">
                        <rect x="0" y="0" width="60" height="22" rx="4" fill="var(--cw-svg-amber-bg)" stroke="var(--cw-svg-amber-border)" strokeWidth="1" />
                        <text x="30" y="14" fill="var(--cw-svg-amber-text)" fontSize="7" fontWeight="bold" textAnchor="middle">🗄️ Route 53 DNS</text>
                        <path d="M 60 11 L 100 -10" fill="none" stroke="var(--cw-svg-amber-border)" strokeWidth="1" markerEnd="url(#arrow-matrix)" />
                        {matrixSimState === 'running' && <circle r="2.5" fill="var(--cw-svg-amber-border)"><animateMotion dur="1.4s" repeatCount="indefinite" path="M 60 11 L 100 -10" /></circle>}
                      </g>

                      <g transform="translate(15, 115)">
                        <rect x="0" y="0" width="60" height="22" rx="4" fill="var(--cw-svg-green-bg)" stroke="var(--cw-svg-green-border)" strokeWidth="1.5" />
                        <text x="30" y="14" fill="var(--cw-svg-green-text)" fontSize="7" fontWeight="extrabold" textAnchor="middle">📑 CloudTrail</text>
                        <path d="M 60 11 L 100 -40" fill="none" stroke="var(--cw-svg-green-border)" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#arrow-matrix)" />
                        {matrixSimState === 'running' && <circle r="2.5" fill="var(--cw-svg-green-border)"><animateMotion dur="1.1s" repeatCount="indefinite" path="M 60 11 L 100 -40" /></circle>}
                      </g>

                      {/* Middle: CloudWatch Logs Hub */}
                      <g transform="translate(115, 50)">
                        <rect x="0" y="0" width="55" height="40" rx="6" fill="var(--cw-svg-indigo-bg)" stroke="var(--cw-svg-indigo-border)" strokeWidth="1.5" />
                        <text x="27.5" y="16" fill="var(--cw-svg-indigo-text)" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">📈 CloudWatch</text>
                        <text x="27.5" y="27" fill="var(--cw-svg-indigo-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">Logs Hub</text>
                        {matrixSimState === 'running' && <rect x="-2" y="-2" width="59" height="44" rx="8" fill="none" stroke="var(--cw-svg-indigo-border)" strokeWidth="1.5" className="pulse-circle" style={{ transformOrigin: '27.5px 20px' }} />}
                      </g>

                      {/* Right: Streams & Encryption */}
                      <g transform="translate(195, 48)">
                        <path d="M -25 22 L 0 0" fill="none" stroke="var(--cw-svg-indigo-border)" strokeWidth="1.2" markerEnd="url(#arrow-matrix)" />
                        <path d="M -25 22 L 0 35" fill="none" stroke="var(--cw-svg-indigo-border)" strokeWidth="1.2" markerEnd="url(#arrow-matrix)" />

                        <g transform="translate(0, -10)">
                          <rect x="0" y="0" width="65" height="18" rx="3" fill="var(--cw-svg-indigo-bg)" stroke="var(--cw-svg-indigo-border)" strokeWidth="1" />
                          <text x="32.5" y="11" fill="var(--cw-svg-indigo-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">🔒 Encrypted Stream</text>
                        </g>

                        <g transform="translate(0, 25)">
                          <rect x="0" y="0" width="65" height="18" rx="3" fill="var(--cw-svg-green-bg)" stroke="var(--cw-svg-green-border)" strokeWidth="1" />
                          <text x="32.5" y="11" fill="var(--cw-svg-green-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">🗂️ Log Group Folder</text>
                        </g>
                      </g>
                    </g>
                  )}

                  {/* 2. TELEMETRY AGENTS DIAGRAM */}
                  {matrixTopic === 'agents' && (
                    <g>
                      {/* Left: EC2 Host */}
                      <g transform="translate(10, 10)">
                        <rect x="0" y="0" width="115" height="135" rx="6" fill="var(--cw-svg-bg)" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" />
                        <text x="57.5" y="12" fill="var(--cw-svg-text-dark)" fontSize="7" fontWeight="extrabold" textAnchor="middle">💻 EC2 Server Host</text>

                        {/* Sub-node A: Application logs */}
                        <g transform="translate(10, 20)">
                          <rect x="0" y="0" width="95" height="20" rx="3" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-node-border)" strokeWidth="1" />
                          <text x="47.5" y="13" fill="var(--cw-svg-text-dark)" fontSize="6.5" fontWeight="semibold" textAnchor="middle">📦 Node.js App (syslog)</text>
                        </g>

                        {/* Sub-node B: Legacy Agent */}
                        <g transform="translate(10, 50)">
                          <rect x="0" y="0" width="95" height="20" rx="3" fill="var(--cw-svg-red-bg)" stroke="var(--cw-svg-red-border)" strokeWidth="1" />
                          <text x="47.5" y="11" fill="var(--cw-svg-red-text)" fontSize="6" fontWeight="extrabold" textAnchor="middle">🔴 Legacy Agent (Deprecated)</text>
                          <text x="47.5" y="17" fill="var(--cw-svg-red-text)" fontSize="5" textAnchor="middle">Tails files only</text>
                          <path d="M 95 10 L 135 40" fill="none" stroke="var(--cw-svg-red-border)" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#arrow-matrix)" />
                        </g>

                        {/* Sub-node C: Unified CloudWatch Agent */}
                        <g transform="translate(10, 85)">
                          <rect x="0" y="0" width="95" height="38" rx="4" fill="var(--cw-svg-green-bg)" stroke="var(--cw-svg-green-border)" strokeWidth="1.5" />
                          <text x="47.5" y="11" fill="var(--cw-svg-green-text)" fontSize="6.5" fontWeight="extrabold" textAnchor="middle">🟢 Unified CW Agent</text>
                          <text x="47.5" y="21" fill="var(--cw-svg-green-text)" fontSize="5.5" textAnchor="middle">📂 App logs + OS CPU/Disk</text>
                          <text x="47.5" y="31" fill="var(--cw-svg-green-text)" fontSize="5" textAnchor="middle">Aggregates Performance</text>
                          <path d="M 95 18 L 135 25" fill="none" stroke="var(--cw-svg-green-border)" strokeWidth="1.2" markerEnd="url(#arrow-matrix)" />
                          {matrixSimState === 'running' && <circle r="2.5" fill="var(--cw-svg-green-border)"><animateMotion dur="1s" repeatCount="indefinite" path="M 95 18 L 135 25" /></circle>}
                        </g>
                      </g>

                      {/* Right: Ingestion endpoints */}
                      <g transform="translate(145, 10)">
                        {/* Other Out-of-box Sources */}
                        <g transform="translate(0, 0)">
                          <rect x="0" y="0" width="115" height="45" rx="5" fill="var(--cw-svg-purple-bg)" stroke="var(--cw-svg-purple-border)" strokeWidth="1" />
                          <text x="57.5" y="12" fill="var(--cw-svg-purple-text)" fontSize="7" fontWeight="bold" textAnchor="middle">🚀 Native Telemetry Ingest</text>
                          
                          <g transform="translate(5, 18)">
                            <rect x="0" y="0" width="30" height="20" rx="2" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-purple-border)" />
                            <text x="15" y="12" fill="var(--cw-svg-purple-text)" fontSize="5" fontWeight="bold" textAnchor="middle">EB App</text>
                          </g>
                          <g transform="translate(42, 18)">
                            <rect x="0" y="0" width="30" height="20" rx="2" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-purple-border)" />
                            <text x="15" y="12" fill="var(--cw-svg-purple-text)" fontSize="5" fontWeight="bold" textAnchor="middle">ECS Cont.</text>
                          </g>
                          <g transform="translate(80, 18)">
                            <rect x="0" y="0" width="30" height="20" rx="2" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-purple-border)" />
                            <text x="15" y="12" fill="var(--cw-svg-purple-text)" fontSize="5" fontWeight="bold" textAnchor="middle">Lambda</text>
                          </g>
                        </g>

                        {/* Central Storage */}
                        <g transform="translate(5, 65)">
                          <rect x="0" y="0" width="110" height="60" rx="6" fill="var(--cw-svg-bg)" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" />
                          <text x="55" y="15" fill="var(--cw-svg-text-dark)" fontSize="7.5" fontWeight="bold" textAnchor="middle">📁 CloudWatch</text>
                          <text x="55" y="27" fill="var(--cw-svg-text-dark)" fontSize="7" fontWeight="bold" textAnchor="middle">Log Groups</text>
                          
                          <g transform="translate(8, 34)">
                            <rect x="0" y="0" width="94" height="20" rx="2" fill="var(--cw-svg-indigo-bg)" stroke="var(--cw-svg-indigo-border)" />
                            <text x="47" y="12" fill="var(--cw-svg-indigo-text)" fontSize="5.5" fontWeight="extrabold" textAnchor="middle">🔒 Encrypted by Default</text>
                          </g>
                        </g>
                      </g>
                    </g>
                  )}

                  {/* 3. SUBSCRIPTIONS VS EXPORTS */}
                  {matrixTopic === 'subscriptions' && (
                    <g>
                      {/* Left: CloudWatch Logs Hub */}
                      <g transform="translate(10, 50)">
                        <rect x="0" y="0" width="55" height="60" rx="6" fill="var(--cw-svg-indigo-bg)" stroke="var(--cw-svg-indigo-border)" strokeWidth="1.5" />
                        <text x="27.5" y="18" fill="var(--cw-svg-indigo-text)" fontSize="8" fontWeight="bold" textAnchor="middle">📈 CW</text>
                        <text x="27.5" y="32" fill="var(--cw-svg-indigo-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Logs</text>
                        <text x="27.5" y="47" fill="var(--cw-svg-indigo-text)" fontSize="6" fontWeight="bold" textAnchor="middle">Ingest Hub</text>
                      </g>

                      {/* TOP PATH: S3 Export (createExportTask) - Late (12h) */}
                      <g transform="translate(80, 25)">
                        <path d="M -15 35 L 5 -7.5 L 15 -7.5" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#arrow-matrix)" />
                        
                        <g transform="translate(15, -20)">
                          <rect x="0" y="0" width="85" height="25" rx="4" fill="var(--cw-svg-amber-bg)" stroke="var(--cw-svg-amber-border)" strokeWidth="1.2" />
                          <text x="42.5" y="10" fill="var(--cw-svg-amber-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">⏳ S3 Export Task</text>
                          <text x="42.5" y="18" fill="var(--cw-svg-amber-text)" fontSize="5.5" fontWeight="extrabold" textAnchor="middle">⚠️ Latency: Up to 12 Hours</text>
                          
                          {matrixSimState === 'running' && (
                            <circle cx="75" cy="12" r="3" fill="var(--cw-svg-red-border)" className="pulse-circle" />
                          )}
                        </g>

                        <g transform="translate(115, -20)">
                          <path d="M -15 12.5 L 0 12.5" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1" markerEnd="url(#arrow-matrix)" />
                          <rect x="0" y="0" width="45" height="25" rx="4" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-node-border)" strokeWidth="1" />
                          <text x="22.5" y="15" fill="var(--cw-text-muted)" fontSize="7" fontWeight="bold" textAnchor="middle">🗄️ S3 Cold</text>
                        </g>
                      </g>

                      {/* BOTTOM PATH: Real-Time Subscriptions - Fast (<50ms) */}
                      <g transform="translate(80, 85)">
                        <path d="M -15 -10 L 5 15 L 15 15" fill="none" stroke="var(--cw-svg-green-border)" strokeWidth="1.5" markerEnd="url(#arrow-emerald)" />
                        {matrixSimState === 'running' && (
                          <circle r="2.5" fill="var(--cw-svg-green-border)"><animateMotion dur="0.8s" repeatCount="indefinite" path="M -15 -10 L 5 15 L 15 15" /></circle>
                        )}

                        {/* Subscription Filter Gate */}
                        <g transform="translate(15, 0)">
                          <rect x="0" y="0" width="85" height="35" rx="4" fill="var(--cw-svg-green-bg)" stroke="var(--cw-svg-green-border)" strokeWidth="1.2" />
                          <text x="42.5" y="11" fill="var(--cw-svg-green-text)" fontSize="7" fontWeight="extrabold" textAnchor="middle">⚡ Subscription Filter</text>
                          <text x="42.5" y="21" fill="var(--cw-svg-green-text)" fontSize="6" fontWeight="bold" textAnchor="middle">Pattern: {"{ $.level = \"ERROR\" }"}</text>
                          <text x="42.5" y="29" fill="var(--cw-svg-green-text)" fontSize="5.5" textAnchor="middle">Ingest Latency: &lt; 50ms</text>
                        </g>

                        {/* Streams Fan-out */}
                        <g transform="translate(115, 0)">
                          {/* Arrows fanning out */}
                          <path d="M -15 17 L 0 -22" fill="none" stroke="var(--cw-svg-green-border)" strokeWidth="1" markerEnd="url(#arrow-emerald)" />
                          <path d="M -15 17 L 0 17" fill="none" stroke="var(--cw-svg-green-border)" strokeWidth="1" markerEnd="url(#arrow-emerald)" />
                          <path d="M -15 17 L 0 55" fill="none" stroke="var(--cw-svg-green-border)" strokeWidth="1" markerEnd="url(#arrow-emerald)" />

                          {matrixSimState === 'running' && (
                            <g>
                              <circle r="2" fill="var(--cw-svg-green-border)"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -15 17 L 0 -22" /></circle>
                              <circle r="2" fill="var(--cw-svg-green-border)"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -15 17 L 0 17" /></circle>
                              <circle r="2" fill="var(--cw-svg-green-border)"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -15 17 L 0 55" /></circle>
                            </g>
                          )}

                          <g transform="translate(0, -35)">
                            <rect x="0" y="0" width="60" height="18" rx="2" fill="var(--cw-svg-green-bg)" stroke="var(--cw-svg-green-border)" />
                            <text x="30" y="11" fill="var(--cw-svg-green-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">⚙️ Lambda</text>
                          </g>

                          <g transform="translate(0, 8)">
                            <rect x="0" y="0" width="60" height="18" rx="2" fill="var(--cw-svg-indigo-bg)" stroke="var(--cw-svg-indigo-border)" />
                            <text x="30" y="11" fill="var(--cw-svg-indigo-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">🌊 Kinesis KDS</text>
                          </g>

                          <g transform="translate(0, 48)">
                            <rect x="0" y="0" width="60" height="18" rx="2" fill="var(--cw-svg-purple-bg)" stroke="var(--cw-svg-purple-border)" />
                            <text x="30" y="11" fill="var(--cw-svg-purple-text)" fontSize="5.5" fontWeight="bold" textAnchor="middle">🔥 Kinesis KDF</text>
                          </g>
                        </g>
                      </g>
                    </g>
                  )}

                  {/* 4. METRIC STREAMS POLLING */}
                  {matrixTopic === 'metricstreams' && (
                    <g>
                      {/* Left: AWS Resources metrics generator */}
                      <g transform="translate(10, 50)">
                        <rect x="0" y="0" width="55" height="60" rx="6" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" />
                        <text x="27.5" y="18" fill="var(--cw-svg-text-dark)" fontSize="8.5" fontWeight="bold" textAnchor="middle">⚙️ AWS</text>
                        <text x="27.5" y="32" fill="var(--cw-svg-text-dark)" fontSize="7.5" fontWeight="bold" textAnchor="middle">Resources</text>
                        <text x="27.5" y="47" fill="var(--cw-text-muted)" fontSize="5.5" textAnchor="middle">Telemetry data</text>
                      </g>

                      {/* TOP PATH: Standard Polling (GetMetricData API) */}
                      <g transform="translate(80, 25)">
                        <path d="M -15 35 L 5 -8 L 15 -8" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#arrow-matrix)" />
                        
                        <g transform="translate(15, -20)">
                          <rect x="0" y="0" width="85" height="24" rx="4" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-node-border)" strokeWidth="1.2" />
                          <text x="42.5" y="10" fill="var(--cw-svg-text-dark)" fontSize="6.5" fontWeight="bold" textAnchor="middle">📊 getMetricData API</text>
                          <text x="42.5" y="18" fill="var(--cw-text-muted)" fontSize="5.5" textAnchor="middle">Pull: 1-5 minutes delay</text>
                          {matrixSimState === 'running' && (
                            <text x="75" y="15" fill="var(--cw-svg-amber-text)" fontSize="7" className="animate-spin" style={{ transformOrigin: '75px 13px' }}>⚙️</text>
                          )}
                        </g>

                        <g transform="translate(115, -20)">
                          <path d="M -15 12 L 0 12" fill="none" stroke="var(--cw-svg-node-border)" strokeWidth="1" markerEnd="url(#arrow-matrix)" />
                          <rect x="0" y="0" width="45" height="24" rx="4" fill="var(--cw-svg-purple-bg)" stroke="var(--cw-svg-purple-border)" strokeWidth="1" />
                          <text x="22.5" y="15" fill="var(--cw-svg-purple-text)" fontSize="7" fontWeight="bold" textAnchor="middle">📈 Console</text>
                        </g>
                      </g>

                      {/* BOTTOM PATH: Metric Streams (Push) */}
                      <g transform="translate(80, 85)">
                        <path d="M -15 -10 L 5 15 L 15 15" fill="none" stroke="var(--cw-svg-indigo-border)" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
                        {matrixSimState === 'running' && (
                          <circle r="2.5" fill="var(--cw-svg-indigo-border)"><animateMotion dur="0.7s" repeatCount="indefinite" path="M -15 -10 L 5 15 L 15 15" /></circle>
                        )}

                        <g transform="translate(15, 0)">
                          <rect x="0" y="0" width="85" height="34" rx="4" fill="var(--cw-svg-indigo-bg)" stroke="var(--cw-svg-indigo-border)" strokeWidth="1.2" />
                          <text x="42.5" y="11" fill="var(--cw-svg-indigo-text)" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">🌊 Metric Stream</text>
                          <text x="42.5" y="21" fill="var(--cw-svg-indigo-text)" fontSize="6" fontWeight="bold" textAnchor="middle">Push Mode: &lt; 3s delay</text>
                          <text x="42.5" y="29" fill="var(--cw-svg-indigo-text)" fontSize="5.5" textAnchor="middle">Filter namespaces (EC2)</text>
                        </g>

                        <g transform="translate(115, 0)">
                          <path d="M -15 17 L 0 0" fill="none" stroke="var(--cw-svg-indigo-border)" strokeWidth="1" markerEnd="url(#arrow-blue)" />
                          <path d="M -15 17 L 0 35" fill="none" stroke="var(--cw-svg-indigo-border)" strokeWidth="1" markerEnd="url(#arrow-blue)" />

                          {matrixSimState === 'running' && (
                            <g>
                              <circle r="2" fill="var(--cw-svg-indigo-border)"><animateMotion dur="0.8s" repeatCount="indefinite" path="M -15 17 L 0 0" /></circle>
                              <circle r="2" fill="var(--cw-svg-indigo-border)"><animateMotion dur="0.8s" repeatCount="indefinite" path="M -15 17 L 0 35" /></circle>
                            </g>
                          )}

                          <g transform="translate(0, -10)">
                            <rect x="0" y="0" width="60" height="20" rx="3" fill="var(--cw-svg-indigo-bg)" stroke="var(--cw-svg-indigo-border)" strokeWidth="1" />
                            <text x="30" y="12" fill="var(--cw-svg-indigo-text)" fontSize="6" fontWeight="bold" textAnchor="middle">🔥 Kinesis KDF</text>
                          </g>

                          <g transform="translate(0, 25)">
                            <rect x="0" y="0" width="60" height="20" rx="3" fill="var(--cw-svg-purple-bg)" stroke="var(--cw-svg-purple-border)" strokeWidth="1" />
                            <text x="30" y="12" fill="var(--cw-svg-purple-text)" fontSize="6.5" fontWeight="bold" textAnchor="middle">📊 Datadog/Splunk</text>
                          </g>
                        </g>
                      </g>
                    </g>
                  )}

                  {/* 5. MULTI-ACCOUNT LOG AGGREGATION */}
                  {matrixTopic === 'aggregation' && (
                    <g>
                      {/* Left: 3 Sender Accounts */}
                      <g transform="translate(10, 15)">
                        <rect x="0" y="0" width="75" height="135" rx="5" fill="var(--cw-svg-bg)" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" />
                        <text x="37.5" y="12" fill="var(--cw-svg-text-dark)" fontSize="6.5" fontWeight="extrabold" textAnchor="middle">📤 SENDER REGION</text>

                        {/* Account A */}
                        <g transform="translate(5, 18)">
                          <rect x="0" y="0" width="65" height="22" rx="3" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-node-border)" strokeWidth="1" />
                          <text x="32.5" y="14" fill="var(--cw-svg-text-dark)" fontSize="6" fontWeight="bold" textAnchor="middle">A: /aws/ec2/prod</text>
                          <path d="M 65 11 L 110 50" fill="none" stroke={matrixSimState === 'failed' ? 'var(--cw-svg-red-border)' : 'var(--cw-svg-green-border)'} strokeWidth="1" markerEnd={matrixSimState === 'failed' ? 'url(#arrow-rose)' : 'url(#arrow-emerald)'} />
                        </g>

                        {/* Account B */}
                        <g transform="translate(5, 50)">
                          <rect x="0" y="0" width="65" height="22" rx="3" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-node-border)" strokeWidth="1" />
                          <text x="32.5" y="14" fill="var(--cw-svg-text-dark)" fontSize="6" fontWeight="bold" textAnchor="middle">B: /aws/lambda/pay</text>
                          <path d="M 65 11 L 110 12" fill="none" stroke={matrixSimState === 'failed' ? 'var(--cw-svg-red-border)' : 'var(--cw-svg-green-border)'} strokeWidth="1" markerEnd={matrixSimState === 'failed' ? 'url(#arrow-rose)' : 'url(#arrow-emerald)'} />
                        </g>

                        {/* Account C */}
                        <g transform="translate(5, 82)">
                          <rect x="0" y="0" width="65" height="22" rx="3" fill="var(--cw-svg-node-fill)" stroke="var(--cw-svg-node-border)" strokeWidth="1" />
                          <text x="32.5" y="14" fill="var(--cw-svg-text-dark)" fontSize="6" fontWeight="bold" textAnchor="middle">C: /aws/rds/core</text>
                          <path d="M 65 11 L 110 -25" fill="none" stroke={matrixSimState === 'failed' ? 'var(--cw-svg-red-border)' : 'var(--cw-svg-green-border)'} strokeWidth="1" markerEnd={matrixSimState === 'failed' ? 'url(#arrow-rose)' : 'url(#arrow-emerald)'} />
                        </g>

                        {/* IAM Sender Role indicator */}
                        <g transform="translate(5, 114)">
                          <rect x="0" y="0" width="65" height="14" rx="2" fill="var(--cw-svg-purple-bg)" stroke="var(--cw-svg-purple-border)" />
                          <text x="32.5" y="9" fill="var(--cw-svg-purple-text)" fontSize="5" fontWeight="bold" textAnchor="middle">🔑 IAM Sender Role</text>
                        </g>
                      </g>

                      {/* Account Boundary Dotted Line */}
                      <line x1="95" y1="5" x2="95" y2="155" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" strokeDasharray="3,3" />
                      <text x="95" y="165" fill="var(--cw-text-muted)" fontSize="5" fontWeight="extrabold" textAnchor="middle">AWS BOUNDARY</text>

                      {/* Middle Gatekeeper Shield */}
                      <g transform="translate(102, 50)">
                        <circle cx="15" cy="15" r="14" fill={matrixPolicyCorrect ? 'var(--cw-svg-green-bg)' : 'var(--cw-svg-red-bg)'} stroke={matrixPolicyCorrect ? 'var(--cw-svg-green-border)' : 'var(--cw-svg-red-border)'} strokeWidth="2" />
                        <text x="15" y="19" fill="#ffffff" fontSize="11" textAnchor="middle" className={matrixSimState === 'failed' ? 'animate-pulse' : ''}>
                          {matrixPolicyCorrect ? '🛡' : '🚨'}
                        </text>
                        
                        <text x="15" y="38" fill={matrixPolicyCorrect ? 'var(--cw-svg-green-text)' : 'var(--cw-svg-red-text)'} fontSize="5.5" fontWeight="extrabold" textAnchor="middle">
                          {matrixPolicyCorrect ? 'Allowed' : '403 Denied'}
                        </text>

                        {matrixSimState === 'running' && matrixPolicyCorrect && (
                          <g>
                            <circle r="2" fill="var(--cw-svg-green-border)"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -27 12 L 15 15" /></circle>
                            <circle r="2" fill="var(--cw-svg-green-border)"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -27 -20 L 15 15" /></circle>
                            <circle r="2" fill="var(--cw-svg-green-border)"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -27 44 L 15 15" /></circle>
                          </g>
                        )}
                        {matrixSimState === 'running' && !matrixPolicyCorrect && (
                          <g>
                            <circle r="2" fill="var(--cw-svg-red-border)"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -27 12 L 15 15" /></circle>
                            <circle r="2" fill="var(--cw-svg-red-border)"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -27 -20 L 15 15" /></circle>
                            <circle r="2" fill="var(--cw-svg-red-border)"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -27 44 L 15 15" /></circle>
                          </g>
                        )}
                      </g>

                      {/* Right: Recipient Monitoring Account Central Hub */}
                      <g transform="translate(150, 15)">
                        <rect x="0" y="0" width="120" height="135" rx="5" fill="var(--cw-svg-bg)" stroke="var(--cw-svg-node-border)" strokeWidth="1.5" />
                        <text x="60" y="12" fill="var(--cw-svg-text-dark)" fontSize="6.5" fontWeight="extrabold" textAnchor="middle">📥 RECIPIENT ACCOUNT</text>

                        {/* Central Destination Ingest */}
                        <g transform="translate(12, 18)">
                          <rect x="0" y="0" width="96" height="24" rx="3" fill="var(--cw-svg-indigo-bg)" stroke="var(--cw-svg-indigo-border)" strokeWidth="1" />
                          <text x="48" y="11" fill="var(--cw-svg-indigo-text)" fontSize="6" fontWeight="extrabold" textAnchor="middle">💼 Central KDS Ingest</text>
                          <text x="48" y="20" fill="var(--cw-svg-indigo-text)" fontSize="5" textAnchor="middle">Stream central-logs-kds</text>
                        </g>

                        {/* Buffering KDF */}
                        <g transform="translate(12, 52)">
                          <rect x="0" y="0" width="96" height="24" rx="3" fill="var(--cw-svg-purple-bg)" stroke="var(--cw-svg-purple-border)" strokeWidth="1" />
                          <text x="48" y="11" fill="var(--cw-svg-purple-text)" fontSize="6" fontWeight="extrabold" textAnchor="middle">🔥 Central Firehose KDF</text>
                          <text x="48" y="20" fill="var(--cw-svg-purple-text)" fontSize="5" textAnchor="middle">Buffers logs in batches</text>
                        </g>

                        {/* Central storage */}
                        <g transform="translate(12, 86)">
                          <rect x="0" y="0" width="96" height="38" rx="4" fill="var(--cw-svg-green-bg)" stroke="var(--cw-svg-green-border)" strokeWidth="1" />
                          <text x="48" y="12" fill="var(--cw-svg-green-text)" fontSize="7.5" fontWeight="bold" textAnchor="middle">🗄️ Central Logging Lake</text>
                          <text x="48" y="23" fill="var(--cw-svg-green-text)" fontSize="6" fontWeight="extrabold" textAnchor="middle">s3://corporate-logs-lake/</text>
                          <text x="48" y="32" fill="var(--cw-svg-green-text)" fontSize="5" textAnchor="middle">WORM Retention &amp; KMS Keys</text>
                        </g>
                      </g>
                    </g>
                  )}
                </svg>
              </div>

              {/* Aggregation code JSON policies comparative viewer */}
              {matrixTopic === 'aggregation' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 text-left">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-700 block">🔑 IAM Sender Role Policy (Source Account)</span>
                    <div className="bg-slate-900 border border-slate-950 rounded-lg p-2 font-mono text-[8px] text-indigo-200 overflow-x-auto h-[100px]">
                      <pre>{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "logs.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    },
    {
      "Effect": "Allow",
      "Action": "kinesis:PutRecord",
      "Resource": "arn:aws:kinesis:us-east-1:112233445566:stream/central-logs-kds"
    }
  ]
}`}</pre>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-700 block">🛡️ Recipient Destination Access Policy (Central Account)</span>
                    <div className="bg-slate-900 border border-slate-950 rounded-lg p-2 font-mono text-[8px] text-emerald-300 overflow-x-auto h-[100px]">
                      <pre>{`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCrossAccountWrites",
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "arn:aws:iam::111111111111:root",
          "arn:aws:iam::222222222222:root"
        ]
      },
      "Action": "logs:PutSubscriptionFilter",
      "Resource": "arn:aws:logs:us-east-1:112233445566:destination:central-logs"
    }
  ]
}`}</pre>
                    </div>
                  </div>
                </div>
              )}

              {matrixTopic === 'sources' && (
                <div className="pt-3 text-left">
                  <span className="text-[10px] font-bold text-slate-700 block">📂 VPC Flow Logs JSON Packet Schema Sample</span>
                  <div className="bg-slate-900 border border-slate-950 rounded-lg p-2 font-mono text-[8px] text-slate-200 overflow-x-auto">
                    <pre>{`{
  "version": "2",
  "account-id": "123456789012",
  "interface-id": "eni-0ea9b182cb82",
  "srcaddr": "192.168.1.48",
  "dstaddr": "54.12.98.4",
  "srcport": "5032",
  "dstport": "443",
  "protocol": "6",
  "packets": "12",
  "bytes": "8240",
  "start": "1780137182",
  "end": "1780137242",
  "action": "ACCEPT",
  "log-status": "OK"
}`}</pre>
                  </div>
                </div>
              )}

              {matrixTopic === 'agents' && (
                <div className="pt-3 text-left">
                  <span className="text-[10px] font-bold text-slate-700 block">⚙️ amazon-cloudwatch-agent.json Performance Config</span>
                  <div className="bg-slate-900 border border-slate-950 rounded-lg p-2 font-mono text-[8px] text-slate-200 overflow-x-auto">
                    <pre>{`{
  "metrics": {
    "metrics_collected": {
      "cpu": {
        "measurement": ["usage_idle", "usage_user", "usage_system"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["used_percent", "inodes_free"],
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent", "mem_active"]
      }
    }
  }
}`}</pre>
                  </div>
                </div>
              )}

              {matrixTopic === 'subscriptions' && (
                <div className="pt-3 text-left">
                  <span className="text-[10px] font-bold text-slate-700 block">⚡ Subscription Filter JSON Configuration</span>
                  <div className="bg-slate-900 border border-slate-950 rounded-lg p-2 font-mono text-[8px] text-emerald-300 overflow-x-auto">
                    <pre>{`{
  "destinationArn": "arn:aws:kinesis:us-east-1:112233445566:stream/central-logs-kds",
  "filterPattern": "{ $.level = \\"ERROR\\" }",
  "filterName": "HighSeverityErrorFilter",
  "logGroupName": "/aws/ec2/prod-nginx-fleet",
  "roleArn": "arn:aws:iam::111111111111:role/CWLogsToKinesisRole"
}`}</pre>
                  </div>
                </div>
              )}

              {matrixTopic === 'metricstreams' && (
                <div className="pt-3 text-left">
                  <span className="text-[10px] font-bold text-slate-700 block">🌊 Metric Stream Namespace Filters JSON Structure</span>
                  <div className="bg-slate-900 border border-slate-950 rounded-lg p-2 font-mono text-[8px] text-sky-300 overflow-x-auto">
                    <pre>{`{
  "Name": "EC2AndRDSMetricStream",
  "FirehoseArn": "arn:aws:firehose:us-east-1:123456789012:deliverystream/metrics-datadog-hose",
  "OutputFormat": "json",
  "IncludeFilters": [
    { "Namespace": "AWS/EC2" },
    { "Namespace": "AWS/RDS" }
  ]
}`}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Terminal trace console */}
          <div className="cw-card bg-slate-950 border border-slate-900 rounded-2xl p-4 text-left shadow-lg">
            <h3 className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5 font-mono">
              <Terminal className="w-4 h-4 text-slate-450" /> TELEMETRY AGGREGATOR SIMULATOR TRACE LOGS
            </h3>
            
            <div className="bg-slate-900 border border-slate-950 rounded-xl p-3 h-[110px] font-mono text-[9.5px] text-slate-300 overflow-y-auto space-y-1">
              {matrixLogs.length === 0 ? (
                <span className="text-slate-500 italic block text-center mt-8">Simulator Console Idle. Select an area and click "Simulate Telemetry Flow".</span>
              ) : (
                matrixLogs.map((log, i) => {
                  let color = 'text-slate-350';
                  if (log.includes('SUCCESS') || log.includes('✅') || log.includes('ALLOWED')) color = 'text-emerald-400 font-bold bg-emerald-950/20 px-1 rounded';
                  if (log.includes('DENIED') || log.includes('🚨') || log.includes('HALTED') || log.includes('403')) color = 'text-rose-400 font-bold bg-rose-950/30 px-1 rounded animate-pulse';
                  if (log.includes('SENDER') || log.includes('🔑') || log.includes('IAM')) color = 'text-purple-300 font-semibold';
                  if (log.includes('🌐') || log.includes('CROSS-ACCOUNT') || log.includes('AGGREGATION')) color = 'text-sky-300 font-bold';
                  if (log.includes('⚡') || log.includes('REAL-TIME')) color = 'text-amber-400';
                  if (log.includes('⏳') || log.includes('LATENCY') || log.includes('12h') || log.includes('12 Hours')) color = 'text-amber-300';
                  return <div key={i} className={`${color} border-b border-slate-800/40 pb-0.5`}>{log}</div>;
                })
              )}
            </div>
          </div>
        </div>
      )}
          </>
        </Translate>
      )}
    </div>
  );
}
