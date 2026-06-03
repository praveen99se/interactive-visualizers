import { useState, useEffect } from 'react';
import {
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
  Info,
  BookOpen
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

type TabType = 'intro' | 'logs' | 'metrics' | 'eventbridge' | 'compliance' | 'matrix';

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

export default function CloudWatchMAndEventsVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('intro');

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
    <div className="da-container animate-fadeIn">
      {/* isolated isolated visualizer styling */}
      <style>{`
        .da-container {
          font-family: 'Outfit', 'Inter', system-ui, -apple-system, sans-serif;
          color: #1e293b;
          background-color: #f8fafc;
          padding: 24px;
          border-radius: 16px;
        }
        .da-card {
          background: rgba(255, 255, 255, 0.75);
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          border-radius: 16px;
          padding: 24px;
          backdrop-filter: blur(16px);
          margin-bottom: 24px;
          box-shadow: 0 4px 20px -2px rgba(148, 163, 184, 0.08), 0 2px 8px -1px rgba(148, 163, 184, 0.04);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .da-card:hover {
          border-color: #0ea5e9;
          box-shadow: 0 12px 24px -4px rgba(14, 165, 233, 0.08), 0 4px 12px -2px rgba(14, 165, 233, 0.03);
          transform: translateY(-1px);
        }
        .da-card-title {
          font-size: 16.5px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          letter-spacing: -0.02em;
        }
        .da-card-desc {
          font-size: 12.5px;
          color: #475569;
          line-height: 1.65;
        }
        .da-tabs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          margin-bottom: 20px;
          border-bottom: 1.5px solid rgba(226, 232, 240, 0.8);
          padding-bottom: 10px;
        }
        .da-tb {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 12px;
          border: 1.5px solid rgba(226, 232, 240, 0.85);
          font-size: 12px;
          font-weight: 600;
          color: #475569;
          background: rgba(255, 255, 255, 0.85);
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s ease-in-out;
          outline: none;
        }
        .da-tb:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #1e293b;
        }
        .da-tb.da-on {
          background: #6366f1;
          color: #ffffff;
          border-color: #6366f1;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
        }

        .da-svg-bg {
          background-color: #f8fafc;
          background-image: radial-gradient(rgba(99, 102, 241, 0.08) 1.5px, transparent 1.5px);
          background-size: 16px 16px;
        }
        
        .da-flow-blue {
          stroke: #3b82f6;
          stroke-dasharray: 6,4;
          animation: flowDash 1s linear infinite;
        }
        .da-flow-green {
          stroke: #10b981;
          stroke-dasharray: 6,4;
          animation: flowDash 0.8s linear infinite;
        }
        .da-flow-purple {
          stroke: #8b5cf6;
          stroke-dasharray: 6,4;
          animation: flowDash 1.2s linear infinite;
        }
        .da-flow-orange {
          stroke: #f97316;
          stroke-dasharray: 6,4;
          animation: flowDash 1s linear infinite;
        }
        @keyframes flowDash {
          to { stroke-dashoffset: -20; }
        }

        .da-node-btn {
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .da-node-btn:hover {
          filter: drop-shadow(0 4px 12px rgba(99, 102, 241, 0.3));
          opacity: 0.95;
        }
        
        .pulse-circle {
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .flashing-alarm {
          animation: flashRed 1s infinite alternate;
        }
        @keyframes flashRed {
          0% { fill: rgba(239, 68, 68, 0.2); stroke: #ef4444; }
          100% { fill: rgba(239, 68, 68, 0.8); stroke: #ef4444; }
        }

        /* Centralized Dark Mode Overrides for CloudWatchMAndEventsVisualizer.tsx */
        .dark .da-container {
          background: #020617 !important;
          color: #f8fafc !important;
        }
        .dark .da-card,
        .dark [class*="da-card"] {
          background: rgba(15, 23, 42, 0.75) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3) !important;
        }
        .dark .da-card b,
        .dark .da-card strong,
        .dark .da-card h3,
        .dark .da-card h4 {
          color: #ffffff !important;
        }
        .dark .da-tabs {
          border-bottom-color: rgba(51, 65, 85, 0.6) !important;
        }
        .dark .da-tb {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #94a3b8 !important;
        }
        .dark .da-tb:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #f8fafc !important;
        }
        .dark .da-sec,
        .dark .da-kk {
          color: #94a3b8 !important;
        }
        .dark .da-log,
        .dark .da-terminal {
          background: #020617 !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #38bdf8 !important;
        }
        .dark .da-btn {
          background: rgba(15, 23, 42, 0.8) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .da-btn:hover {
          background: rgba(30, 41, 59, 0.8) !important;
          color: #ffffff !important;
        }
        .dark .da-met {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark ul.da-ck li {
          color: #cbd5e1 !important;
        }
        .dark .da-inst,
        .dark .da-instance {
          background: rgba(15, 23, 42, 0.6) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
          color: #cbd5e1 !important;
        }
        .dark .da-inst .meta,
        .dark .da-instance .meta {
          color: #94a3b8 !important;
        }
        .dark .da-svg-bg {
          background-color: #020617 !important;
          background-image: radial-gradient(rgba(51, 65, 85, 0.5) 1.2px, transparent 1.2px) !important;
          border-color: rgba(51, 65, 85, 0.6) !important;
        }
        
        /* Node Status Overrides */
        .dark .da-ok {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.15) !important;
          color: #4ade80 !important;
        }
        .dark .da-warm {
          border-color: #f59e0b !important;
          background: rgba(245, 158, 11, 0.15) !important;
          color: #fbbf24 !important;
        }
        .dark .da-drain {
          border-color: #3b82f6 !important;
          background: rgba(59, 130, 246, 0.15) !important;
          color: #60a5fa !important;
        }
        .dark .da-down {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.15) !important;
          color: #f87171 !important;
        }
        
        /* General form overrides */
        .dark select,
        .dark input,
        .dark textarea {
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
          border-color: rgba(51, 65, 85, 0.8) !important;
        }
        .dark select option {
          background-color: #0f172a !important;
          color: #f1f5f9 !important;
        }
          `}</style>

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-gray-200 mb-6">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-indigo-500 rounded-lg text-white">
            <Eye className="w-6 h-6" />
          </span>
          <div className="text-left">
            <h1 className="text-2xl font-bold text-gray-900">AWS Observability, Events &amp; Compliance Hub</h1>
            <p className="text-xs text-slate-500 mt-0.5">Explore CloudWatch Metric Streams, Log Agent Ingestion, EventBridge routing rules, CloudTrail audits, and AWS Config compliance guardrails</p>
          </div>
        </div>
      </div>

      {/* Tab navigation bar */}
      <div className="da-tabs">
        <button className={`da-tb ${activeTab === 'intro' ? 'da-on' : ''}`} onClick={() => setActiveTab('intro')}>
          <BookOpen className="w-4 h-4" /> 1. Choosing Observability vs Auditing
        </button>
        <button className={`da-tb ${activeTab === 'logs' ? 'da-on' : ''}`} onClick={() => setActiveTab('logs')}>
          <FileText className="w-4 h-4" /> 2. CloudWatch Logs &amp; Insights
        </button>
        <button className={`da-tb ${activeTab === 'metrics' ? 'da-on' : ''}`} onClick={() => setActiveTab('metrics')}>
          <Activity className="w-4 h-4" /> 3. Metric Streams &amp; Alarms
        </button>
        <button className={`da-tb ${activeTab === 'eventbridge' ? 'da-on' : ''}`} onClick={() => setActiveTab('eventbridge')}>
          <Workflow className="w-4 h-4" /> 4. EventBridge Schema Router
        </button>
        <button className={`da-tb ${activeTab === 'compliance' ? 'da-on' : ''}`} onClick={() => setActiveTab('compliance')}>
          <Shield className="w-4 h-4" /> 5. CloudTrail &amp; Config Remediation
        </button>
        <button className={`da-tb ${activeTab === 'matrix' ? 'da-on' : ''}`} onClick={() => setActiveTab('matrix')}>
          <Sliders className="w-4 h-4" /> 6. Observability Comparison &amp; Aggregation Map
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: HOW TO CHOOSE THE RIGHT TELEMETRY ENGINE & COMPARISON MATRIX       */}
      {/* ========================================================================= */}
      {activeTab === 'intro' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Architectural Overview Card */}
            <div className="lg:col-span-5 da-card flex flex-col justify-between text-left">
              <div>
                <h3 className="da-card-title text-indigo-700">
                  <Sliders className="w-5 h-5" /> AWS Observability vs Compliance Matrix
                </h3>
                <p className="da-card-desc mb-5">
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
            <div className="lg:col-span-7 da-card space-y-4 text-left">
              <h3 className="da-card-title text-slate-800">
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
          <div className="da-card bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mt-6 text-left">
            <h3 className="da-card-title text-slate-800 border-b border-slate-100 pb-3 mb-4 flex items-center gap-2">
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
          <div className="da-card text-left">
            <h2 className="da-card-title text-indigo-700">
              <FileText className="w-5 h-5" /> CloudWatch Logs, Unified Agent &amp; Insights Sandbox
            </h2>
            <p className="da-card-desc">
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
                <svg className="w-full h-full max-w-[620px] da-svg-bg" viewBox="0 0 600 240">
                  <defs>
                    <marker id="log-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="#94a3b8" />
                    </marker>
                  </defs>

                  {/* Pipelines paths */}
                  <path d="M 80 120 H 140" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#log-arrow)" />
                  <path d="M 230 120 H 270" fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#log-arrow)" />
                  
                  {/* Subscription flows */}
                  <path d="M 370 120 Q 420 60, 480 60" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#log-arrow)" />
                  <path d="M 370 120 Q 420 180, 480 180" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" markerEnd="url(#log-arrow)" />

                  {/* Active Ingestion Flow */}
                  {logsState === 'ingesting' && (
                    <>
                      <path d="M 80 120 H 140" fill="none" stroke="#6366f1" strokeWidth="3" className="da-flow-blue" />
                      <path d="M 230 120 H 270" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                      <path d="M 370 120 Q 420 60, 480 60" fill="none" stroke="#8b5cf6" strokeWidth="2.5" className="da-flow-purple" />
                      <path d="M 370 120 Q 420 180, 480 180" fill="none" stroke="#f97316" strokeWidth="2.5" className="da-flow-orange" />
                    </>
                  )}

                  {/* Source Node */}
                  <g transform="translate(10, 85)" className="da-node-btn">
                    <rect width="70" height="70" rx="8" fill="rgba(255, 255, 255, 0.95)" stroke="#6366f1" strokeWidth="2" />
                    <text x="35" y="24" fill="#4f46e5" fontSize="8" fontWeight="bold" textAnchor="middle">COMPUTE SOURCE</text>
                    <rect x="5" y="32" width="60" height="15" rx="3" fill="#e0e7ff" />
                    <text x="35" y="42" fill="#4f46e5" fontSize="7" fontWeight="bold" textAnchor="middle" style={{ textTransform: 'uppercase' }}>{logSource}</text>
                    <text x="35" y="60" fill="#64748b" fontSize="6.5" textAnchor="middle">Raw stdout logs</text>
                  </g>

                  {/* Agent Node */}
                  <g transform="translate(140, 85)" className="da-node-btn">
                    <rect width="90" height="70" rx="8" fill="rgba(255, 255, 255, 0.95)" stroke={agentConfigured ? '#10b981' : '#ef4444'} strokeWidth="2" />
                    <text x="45" y="22" fill={agentConfigured ? '#047857' : '#b91c1c'} fontSize="8" fontWeight="extrabold" textAnchor="middle">UNIFIED AGENT</text>
                    <text x="45" y="38" fill="#1e293b" fontSize="7" textAnchor="middle">CloudWatch Daemon</text>
                    <rect x="8" y="46" width="74" height="15" rx="3" fill={agentConfigured ? '#d1fae5' : '#fee2e2'} />
                    <text x="45" y="56" fill={agentConfigured ? '#047857' : '#b91c1c'} fontSize="7" fontWeight="extrabold" textAnchor="middle">
                      {agentConfigured ? 'Status: Active' : 'Status: Offline'}
                    </text>
                  </g>

                  {/* CloudWatch Logs Node */}
                  <g transform="translate(270, 75)" className="da-node-btn">
                    <rect width="100" height="90" rx="12" fill="rgba(255, 255, 255, 0.95)" stroke="#6366f1" strokeWidth="2.5" />
                    <rect x="5" y="5" width="90" height="16" rx="4" fill="#e0e7ff" />
                    <text x="50" y="16" fill="#4f46e5" fontSize="8" fontWeight="extrabold" textAnchor="middle">☁️ CLOUDWATCH LOGS</text>
                    
                    <rect x="8" y="28" width="84" height="12" rx="2.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
                    <text x="14" y="36.5" fill="#475569" fontSize="6.5" fontWeight="bold">LogGroup: /aws/app</text>
                    
                    <rect x="8" y="45" width="84" height="12" rx="2.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="0.5" />
                    <text x="14" y="53.5" fill="#475569" fontSize="6.5" fontWeight="bold">Stream: i-0912ab8</text>

                    <g transform="translate(10, 64)">
                      <circle cx="5" cy="5" r="3" fill="#10b981" />
                      <text x="14" y="8" fill="#64748b" fontSize="7" fontWeight="bold">Ingestion Gateway</text>
                    </g>
                    <g transform="translate(10, 76)">
                      <circle cx="5" cy="5" r="3" fill="#6366f1" className="pulse-circle" />
                      <circle cx="5" cy="5" r="3" fill="#6366f1" />
                      <text x="14" y="20" fill="#4f46e5" fontSize="7" fontWeight="bold" transform="translate(0,-12)">Retention: 30 Days</text>
                    </g>
                  </g>

                  {/* Export / Subscriptions Target Nodes */}
                  <g transform="translate(480, 25)" className="da-node-btn">
                    <rect width="110" height="70" rx="8" fill="rgba(255, 255, 255, 0.95)" stroke="#8b5cf6" strokeWidth="1.5" />
                    <text x="55" y="20" fill="#6d28d9" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">📨 SUBSCRIPTION</text>
                    <rect x="10" y="28" width="90" height="15" rx="3.5" fill="#faf5ff" />
                    <text x="55" y="38" fill="#6d28d9" fontSize="7" fontWeight="bold" textAnchor="middle">Lambda/Kinesis</text>
                    <text x="55" y="56" fill="#64748b" fontSize="7" textAnchor="middle">Near-Real-Time Stream</text>
                  </g>

                  <g transform="translate(480, 145)" className="da-node-btn">
                    <rect width="110" height="70" rx="8" fill="rgba(255, 255, 255, 0.95)" stroke="#f97316" strokeWidth="1.5" />
                    <text x="55" y="20" fill="#c2410c" fontSize="8.5" fontWeight="extrabold" textAnchor="middle">🪣 S3 DATA ARCHIVE</text>
                    <rect x="10" y="28" width="90" height="15" rx="3.5" fill="#fff7ed" />
                    <text x="55" y="38" fill="#c2410c" fontSize="7" fontWeight="bold" textAnchor="middle">Bulk Logs Export</text>
                    <text x="55" y="56" fill="#64748b" fontSize="7" textAnchor="middle">Cold storage archive</text>
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
                  {insightsQuery === 'filter-errors' && (
                    <>
                      <span className="text-indigo-400">fields</span> @timestamp, @message<br />
                      <span className="text-indigo-400">| filter</span> level in ["ERROR", "WARN"]<br />
                      <span className="text-indigo-400">| sort</span> @timestamp desc<br />
                      <span className="text-indigo-400">| limit</span> 10
                    </>
                  )}
                  {insightsQuery === 'count-levels' && (
                    <>
                      <span className="text-indigo-400">stats</span> count(*) <span className="text-indigo-400">by</span> level<br />
                      <span className="text-indigo-400">| sort</span> count(*) desc
                    </>
                  )}
                  {insightsQuery === 'all-fields' && (
                    <>
                      <span className="text-indigo-400">fields</span> @timestamp, level, message, requestId<br />
                      <span className="text-indigo-400">| sort</span> @timestamp desc
                    </>
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
          <div className="da-card text-left">
            <h2 className="da-card-title text-indigo-700">
              <Activity className="w-5 h-5" /> CloudWatch Metric Streams &amp; Active Alarms Sandbox
            </h2>
            <p className="da-card-desc">
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
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#94a3b8' }} stroke="#cbd5e1" />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} stroke="#cbd5e1" />
                      <Tooltip labelClassName="font-mono font-bold text-slate-800" contentStyle={{ fontSize: 10, borderRadius: 8 }} />
                      <Area type="monotone" dataKey="cpu" stroke={alarmState === 'ALARM' ? '#ef4444' : '#6366f1'} strokeWidth={2.5} fillOpacity={1} fill="url(#colorCpu)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Topology SVG map for Alarms actions */}
                <div className="w-full h-[140px] rounded-xl border border-slate-200 relative flex items-center justify-center shadow-inner bg-slate-50 overflow-hidden">
                  <svg className="w-full h-full max-w-[500px]" viewBox="0 0 450 140">
                    <defs>
                      <marker id="al-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#cbd5e1" />
                      </marker>
                    </defs>

                    {/* Pipelines */}
                    <path d="M 120 70 H 180" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#al-arrow)" />
                    <path d="M 220 70 Q 280 30, 320 30" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#al-arrow)" />
                    <path d="M 220 70 H 320" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#al-arrow)" />
                    <path d="M 220 70 Q 280 110, 320 110" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#al-arrow)" />

                    {/* Active flow animations during Alarm */}
                    {alarmState === 'ALARM' && (
                      <>
                        <path d="M 120 70 H 180" fill="none" stroke="#ef4444" strokeWidth="2.5" className="da-flow-orange" />
                        <path d="M 220 70 Q 280 30, 320 30" fill="none" stroke="#ef4444" strokeWidth="2.5" className="da-flow-orange" />
                        <path d="M 220 70 H 320" fill="none" stroke="#ef4444" strokeWidth="2.5" className="da-flow-orange" />
                        <path d="M 220 70 Q 280 110, 320 110" fill="none" stroke="#ef4444" strokeWidth="2.5" className="da-flow-orange" />
                      </>
                    )}

                    {/* Metrics Stream custom target conduit */}
                    <path d="M 60 40 Q 60 10, 150 10" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#al-arrow)" />
                    <g transform="translate(150, 0)">
                      <rect width="110" height="20" rx="4" fill="rgba(224, 231, 255, 0.95)" stroke="#6366f1" strokeWidth="1" />
                      <text x="55" y="12" fill="#4f46e5" fontSize="7.5" fontWeight="bold" textAnchor="middle">STREAMING TO {metricStreamTarget.toUpperCase()}</text>
                    </g>

                    {/* Nodes */}
                    <g transform="translate(10, 40)" className="da-node-btn">
                      <rect width="110" height="60" rx="8" fill="rgba(255, 255, 255, 0.95)" stroke="#6366f1" strokeWidth="2" />
                      <text x="55" y="24" fill="#4f46e5" fontSize="8" fontWeight="bold" textAnchor="middle">📊 CPU METRIC</text>
                      <text x="55" y="40" fill="#1e293b" fontSize="11" fontWeight="black" textAnchor="middle" className="font-mono">
                        {metricCpuHistory[metricCpuHistory.length - 1].cpu}%
                      </text>
                      <text x="55" y="50" fill="#64748b" fontSize="6.5" textAnchor="middle">Granularity: 10s</text>
                    </g>

                    {/* Alarm Node */}
                    <g transform="translate(180, 50)" className="da-node-btn">
                      <circle cx="20" cy="20" r="16" className={alarmState === 'ALARM' ? 'flashing-alarm' : ''} fill={alarmState === 'ALARM' ? '#ef4444' : '#10b981'} stroke="#ffffff" strokeWidth="2" />
                      <text x="20" y="23" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">🔔</text>
                    </g>

                    {/* Action Targets */}
                    <g transform="translate(320, 10)" className="da-node-btn">
                      <rect width="120" height="30" rx="6" fill="rgba(254, 242, 242, 0.95)" stroke="#ef4444" strokeWidth="1" />
                      <text x="60" y="18" fill="#b91c1c" fontSize="8" fontWeight="bold" textAnchor="middle">📧 SNS Sysops Topic</text>
                    </g>

                    <g transform="translate(320, 55)" className="da-node-btn">
                      <rect width="120" height="30" rx="6" fill="rgba(254, 243, 199, 0.95)" stroke="#d97706" strokeWidth="1" />
                      <text x="60" y="18" fill="#b45309" fontSize="8" fontWeight="bold" textAnchor="middle">📈 EC2 Auto-Scaling</text>
                    </g>

                    <g transform="translate(320, 100)" className="da-node-btn">
                      <rect width="120" height="30" rx="6" fill="rgba(240, 253, 244, 0.95)" stroke="#10b981" strokeWidth="1" />
                      <text x="60" y="18" fill="#047857" fontSize="8" fontWeight="bold" textAnchor="middle">🛠️ SSM Automation</text>
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
          <div className="da-card text-left">
            <h2 className="da-card-title text-indigo-700">
              <Workflow className="w-5 h-5" /> Amazon EventBridge Serverless Event Bus Sandbox
            </h2>
            <p className="da-card-desc">
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
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#cbd5e1" />
                      </marker>
                    </defs>

                    {/* Path routing channels */}
                    <path d="M 80 100 H 140" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#eb-arrow)" />
                    
                    {/* Rules splits */}
                    <path d="M 230 100 L 285 45" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                    <path d="M 230 100 H 285" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                    <path d="M 230 100 L 285 155" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

                    {/* Target channels */}
                    <path d="M 375 45 H 410" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                    <path d="M 375 100 H 410" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />
                    <path d="M 375 155 H 410" fill="none" stroke="#cbd5e1" strokeWidth="1.5" />

                    {/* Active lasers during evaluation & routing */}
                    {routerState === 'received' && (
                      <path d="M 80 100 H 140" fill="none" stroke="#6366f1" strokeWidth="3" className="da-flow-blue" />
                    )}

                    {routerState === 'evaluating' && (
                      <>
                        <path d="M 80 100 H 140" fill="none" stroke="#6366f1" strokeWidth="2.5" />
                        <circle cx="185" cy="100" r="28" fill="rgba(99, 102, 241, 0.1)" stroke="#6366f1" className="pulse-circle" strokeWidth="1" />
                      </>
                    )}

                    {routerState === 'routed' && (
                      <>
                        <path d="M 80 100 H 140" fill="none" stroke="#6366f1" strokeWidth="2" />
                        {eventSourceType === 'ec2_state' && (
                          <>
                            <path d="M 230 100 L 285 45" fill="none" stroke="#a855f7" strokeWidth="2.5" className="da-flow-purple" />
                            <path d="M 230 100 H 285" fill="none" stroke="#a855f7" strokeWidth="2.5" className="da-flow-purple" />
                            <path d="M 375 45 H 410" fill="none" stroke="#a855f7" strokeWidth="2" />
                            <path d="M 375 100 H 410" fill="none" stroke="#a855f7" strokeWidth="2" />
                          </>
                        )}
                        {eventSourceType === 's3_api' && (
                          <>
                            <path d="M 230 100 L 285 155" fill="none" stroke="#10b981" strokeWidth="2.5" className="da-flow-green" />
                            <path d="M 375 155 H 410" fill="none" stroke="#10b981" strokeWidth="2" />
                          </>
                        )}
                        {eventSourceType === 'custom_order' && (
                          <>
                            <path d="M 230 100 H 285" fill="none" stroke="#f97316" strokeWidth="2.5" className="da-flow-orange" />
                            <path d="M 375 100 H 410" fill="none" stroke="#f97316" strokeWidth="2" />
                          </>
                        )}
                      </>
                    )}

                    {/* Source Node */}
                    <g transform="translate(10, 75)" className="da-node-btn">
                      <rect width="70" height="50" rx="6" fill="rgba(255, 255, 255, 0.95)" stroke="#6366f1" strokeWidth="1.5" />
                      <text x="35" y="24" fill="#4f46e5" fontSize="8" fontWeight="bold" textAnchor="middle">🗳️ SOURCE</text>
                      <text x="35" y="38" fill="#64748b" fontSize="7" textAnchor="middle" style={{ textTransform: 'uppercase' }}>{eventSourceType.split('_')[0]}</text>
                    </g>

                    {/* Event Bus Coordinator */}
                    <g transform="translate(140, 65)" className="da-node-btn">
                      <rect width="90" height="70" rx="10" fill="rgba(255, 255, 255, 0.95)" stroke="#6366f1" strokeWidth="2.5" />
                      <rect x="5" y="5" width="80" height="15" rx="3.5" fill="#e0e7ff" />
                      <text x="45" y="16" fill="#4f46e5" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">EVENT BUS</text>
                      <text x="45" y="38" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">rules match</text>
                      <text x="45" y="52" fill="#64748b" fontSize="7.5" textAnchor="middle">Default Bus</text>
                    </g>

                    {/* Declarative Rules */}
                    <g transform="translate(285, 25)" className="da-node-btn">
                      <rect width="90" height="40" rx="6" fill="rgba(255, 255, 255, 0.95)" stroke={matchedRulesList.includes('Ec2TerminationAlert') ? '#a855f7' : '#cbd5e1'} strokeWidth="1.5" />
                      <text x="45" y="18" fill="#1e293b" fontSize="7.5" fontWeight="bold" textAnchor="middle">Rule: EC2Term</text>
                      <text x="45" y="30" fill={matchedRulesList.includes('Ec2TerminationAlert') ? '#7e22ce' : '#64748b'} fontSize="7" fontWeight="bold" textAnchor="middle">
                        {matchedRulesList.includes('Ec2TerminationAlert') ? '🎯 MATCHED' : 'Skip'}
                      </text>
                    </g>

                    <g transform="translate(285, 80)" className="da-node-btn">
                      <rect width="90" height="40" rx="6" fill="rgba(255, 255, 255, 0.95)" stroke={
                        matchedRulesList.includes('HighValueOrderApproveAlert') || matchedRulesList.includes('AutoscalingSyncRule') ? '#8b5cf6' : '#cbd5e1'
                      } strokeWidth="1.5" />
                      <text x="45" y="18" fill="#1e293b" fontSize="7.5" fontWeight="bold" textAnchor="middle">Rule: HighValOrder</text>
                      <text x="45" y="30" fill={
                        matchedRulesList.includes('HighValueOrderApproveAlert') || matchedRulesList.includes('AutoscalingSyncRule') ? '#6d28d9' : '#64748b'
                      } fontSize="7" fontWeight="bold" textAnchor="middle">
                        {matchedRulesList.includes('HighValueOrderApproveAlert') || matchedRulesList.includes('AutoscalingSyncRule') ? '🎯 MATCHED' : 'Skip'}
                      </text>
                    </g>

                    <g transform="translate(285, 135)" className="da-node-btn">
                      <rect width="90" height="40" rx="6" fill="rgba(255, 255, 255, 0.95)" stroke={matchedRulesList.includes('InvoiceIngestPipeline') ? '#10b981' : '#cbd5e1'} strokeWidth="1.5" />
                      <text x="45" y="18" fill="#1e293b" fontSize="7.5" fontWeight="bold" textAnchor="middle">Rule: S3Invoice</text>
                      <text x="45" y="30" fill={matchedRulesList.includes('InvoiceIngestPipeline') ? '#047857' : '#64748b'} fontSize="7" fontWeight="bold" textAnchor="middle">
                        {matchedRulesList.includes('InvoiceIngestPipeline') ? '🎯 MATCHED' : 'Skip'}
                      </text>
                    </g>

                    {/* Routing Target Outlets */}
                    <circle cx="420" cy="45" r="10" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" className="da-node-btn" />
                    <text x="420" y="48" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">λ</text>

                    <circle cx="420" cy="100" r="10" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" className="da-node-btn" />
                    <text x="420" y="103" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">🔔</text>

                    <circle cx="420" cy="155" r="10" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" className="da-node-btn" />
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
          <div className="da-card text-left">
            <h2 className="da-card-title text-indigo-700">
              <Shield className="w-5 h-5" /> Governance Sandbox: CloudTrail API Auditing vs AWS Config Continuous Compliance
            </h2>
            <p className="da-card-desc">
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
                  <svg className="w-full h-full max-w-[500px]" viewBox="0 0 450 200">
                    <defs>
                      <marker id="au-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#cbd5e1" />
                      </marker>
                    </defs>

                    {/* Pathways */}
                    {/* User API dispatch */}
                    <path d="M 75 100 H 130" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#au-arrow)" />
                    
                    {/* CloudTrail splits */}
                    <path d="M 210 100 Q 250 45, 290 45" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#au-arrow)" />
                    {/* Config splits */}
                    <path d="M 210 100 Q 250 155, 290 155" fill="none" stroke="#cbd5e1" strokeWidth="1.5" markerEnd="url(#au-arrow)" />

                    {/* Remediation conduit */}
                    <path d="M 370 155 Q 310 185, 210 185" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
                    <path d="M 210 185 Q 110 185, 75 105" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />

                    {/* Active conduits during auditing */}
                    {complianceState === 'api_call' && (
                      <path d="M 75 100 H 130" fill="none" stroke="#6366f1" strokeWidth="3" className="da-flow-blue" />
                    )}

                    {complianceState === 'cloudtrail_log' && (
                      <path d="M 210 100 Q 250 45, 290 45" fill="none" stroke="#10b981" strokeWidth="3" className="da-flow-green" />
                    )}

                    {complianceState === 'config_eval' && (
                      <path d="M 210 100 Q 250 155, 290 155" fill="none" stroke="#f97316" strokeWidth="3" className="da-flow-orange" />
                    )}

                    {complianceState === 'non_compliant' && (
                      <>
                        <path d="M 210 100 Q 250 155, 290 155" fill="none" stroke="#ef4444" strokeWidth="3" />
                        <circle cx="330" cy="155" r="28" fill="none" stroke="#ef4444" strokeWidth="1.5" className="pulse-circle" />
                      </>
                    )}

                    {complianceState === 'remediating' && (
                      <>
                        <path d="M 370 155 Q 310 185, 210 185" fill="none" stroke="#8b5cf6" strokeWidth="2.5" className="da-flow-purple" />
                        <path d="M 210 185 Q 110 185, 75 105" fill="none" stroke="#8b5cf6" strokeWidth="2.5" className="da-flow-purple" />
                      </>
                    )}

                    {/* Nodes */}
                    <g transform="translate(10, 75)" className="da-node-btn">
                      <rect width="65" height="50" rx="6" fill="rgba(255, 255, 255, 0.95)" stroke="#6366f1" strokeWidth="2" />
                      <text x="32.5" y="22" fill="#4f46e5" fontSize="8" fontWeight="bold" textAnchor="middle">📱 USER API</text>
                      <text x="32.5" y="36" fill="#1e293b" fontSize="7" textAnchor="middle">alice_sec</text>
                      <text x="32.5" y="44" fill="#64748b" fontSize="6.5" fontStyle="italic" textAnchor="middle">PutBucketPolicy</text>
                    </g>

                    <g transform="translate(130, 75)" className="da-node-btn">
                      <rect width="80" height="50" rx="8" fill="rgba(255, 255, 255, 0.95)" stroke="#cbd5e1" strokeWidth="1.5" />
                      <text x="40" y="24" fill="#1e293b" fontSize="8" fontWeight="bold" textAnchor="middle">AWS Bucket</text>
                      <text x="40" y="38" fill="#64748b" fontSize="7.5" textAnchor="middle">Target S3 Pool</text>
                    </g>

                    {/* CloudTrail logging node */}
                    <g transform="translate(290, 15)" className="da-node-btn">
                      <rect width="115" height="60" rx="8" fill="rgba(255, 255, 255, 0.95)" stroke="#10b981" strokeWidth="2" />
                      <rect x="5" y="5" width="105" height="15" rx="3" fill="#d1fae5" />
                      <text x="57.5" y="15" fill="#047857" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">📑 CLOUDTRAIL AUDIT</text>
                      <text x="57.5" y="36" fill="#1e293b" fontSize="7" textAnchor="middle">API management log</text>
                      <text x="57.5" y="48" fill="#64748b" fontSize="6.5" fontStyle="italic" textAnchor="middle">s3://central-trails/</text>
                    </g>

                    {/* AWS Config Compliance node */}
                    <g transform="translate(290, 125)" className="da-node-btn">
                      <rect width="115" height="60" rx="8" fill="rgba(255, 255, 255, 0.95)" stroke={
                        complianceState === 'non_compliant' || complianceState === 'remediating' ? '#ef4444' :
                        complianceState === 'compliant' ? '#10b981' : '#f59e0b'
                      } strokeWidth="2" />
                      <rect x="5" y="5" width="105" height="15" rx="3" fill={
                        complianceState === 'non_compliant' || complianceState === 'remediating' ? '#fee2e2' :
                        complianceState === 'compliant' ? '#d1fae5' : '#fef3c7'
                      } />
                      <text x="57.5" y="15" fill={
                        complianceState === 'non_compliant' || complianceState === 'remediating' ? '#b91c1c' :
                        complianceState === 'compliant' ? '#047857' : '#b45309'
                      } fontSize="7.5" fontWeight="extrabold" textAnchor="middle">🛡️ AWS CONFIG compliance</text>
                      
                      <text x="57.5" y="36" fill="#1e293b" fontSize="7.5" textAnchor="middle">Rule: s3-public-prohibited</text>
                      <text x="57.5" y="48" fill={
                        complianceState === 'non_compliant' || complianceState === 'remediating' ? '#b91c1c' :
                        complianceState === 'compliant' ? '#047857' : '#b45309'
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
          <div className="da-card text-left">
            <h2 className="da-card-title text-indigo-700">
              <Sliders className="w-5 h-5" /> Architectural Comparative Matrix &amp; Aggregation Sandbox
            </h2>
            <p className="da-card-desc">
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

              <div className="w-full h-[280px] bg-slate-50 border border-slate-200 rounded-xl relative overflow-hidden flex items-center justify-center da-svg-bg">
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
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#94a3b8" />
                    </marker>
                    <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#2563eb" />
                    </marker>
                    <marker id="arrow-rose" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#dc2626" />
                    </marker>
                    <marker id="arrow-emerald" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 2 L 8 5 L 0 8 z" fill="#059669" />
                    </marker>
                  </defs>

                  {/* 1. SOURCES DIAGRAM */}
                  {matrixTopic === 'sources' && (
                    <g>
                      {/* Left: 4 Sources */}
                      <g transform="translate(15, 10)">
                        <rect x="0" y="0" width="60" height="22" rx="4" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1" />
                        <text x="30" y="14" fill="#334155" fontSize="7" fontWeight="bold" textAnchor="middle">🌐 VPC Flow</text>
                        <path d="M 60 11 L 100 50" fill="none" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrow-matrix)" />
                        {matrixSimState === 'running' && <circle r="2.5" fill="#3b82f6"><animateMotion dur="1.5s" repeatCount="indefinite" path="M 60 11 L 100 50" /></circle>}
                      </g>

                      <g transform="translate(15, 45)">
                        <rect x="0" y="0" width="60" height="22" rx="4" fill="#faf5ff" stroke="#c084fc" strokeWidth="1" />
                        <text x="30" y="14" fill="#6b21a8" fontSize="7" fontWeight="bold" textAnchor="middle">📲 API Gateway</text>
                        <path d="M 60 11 L 100 20" fill="none" stroke="#c084fc" strokeWidth="1" markerEnd="url(#arrow-matrix)" />
                        {matrixSimState === 'running' && <circle r="2.5" fill="#9333ea"><animateMotion dur="1.2s" repeatCount="indefinite" path="M 60 11 L 100 20" /></circle>}
                      </g>

                      <g transform="translate(15, 80)">
                        <rect x="0" y="0" width="60" height="22" rx="4" fill="#fffbeb" stroke="#fcd34d" strokeWidth="1" />
                        <text x="30" y="14" fill="#92400e" fontSize="7" fontWeight="bold" textAnchor="middle">🗄️ Route 53 DNS</text>
                        <path d="M 60 11 L 100 -10" fill="none" stroke="#fcd34d" strokeWidth="1" markerEnd="url(#arrow-matrix)" />
                        {matrixSimState === 'running' && <circle r="2.5" fill="#d97706"><animateMotion dur="1.4s" repeatCount="indefinite" path="M 60 11 L 100 -10" /></circle>}
                      </g>

                      <g transform="translate(15, 115)">
                        <rect x="0" y="0" width="60" height="22" rx="4" fill="#f0fdfa" stroke="#0d9488" strokeWidth="1.5" />
                        <text x="30" y="14" fill="#0f766e" fontSize="7" fontWeight="extrabold" textAnchor="middle">📑 CloudTrail</text>
                        <path d="M 60 11 L 100 -40" fill="none" stroke="#0d9488" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#arrow-matrix)" />
                        {matrixSimState === 'running' && <circle r="2.5" fill="#0d9488"><animateMotion dur="1.1s" repeatCount="indefinite" path="M 60 11 L 100 -40" /></circle>}
                      </g>

                      {/* Middle: CloudWatch Logs Hub */}
                      <g transform="translate(115, 50)">
                        <rect x="0" y="0" width="55" height="40" rx="6" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" />
                        <text x="27.5" y="16" fill="#312e81" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">📈 CloudWatch</text>
                        <text x="27.5" y="27" fill="#4338ca" fontSize="6.5" fontWeight="bold" textAnchor="middle">Logs Hub</text>
                        {matrixSimState === 'running' && <rect x="-2" y="-2" width="59" height="44" rx="8" fill="none" stroke="#6366f1" strokeWidth="1.5" className="pulse-circle" style={{ transformOrigin: '27.5px 20px' }} />}
                      </g>

                      {/* Right: Streams & Encryption */}
                      <g transform="translate(195, 48)">
                        <path d="M -25 22 L 0 0" fill="none" stroke="#6366f1" strokeWidth="1.2" markerEnd="url(#arrow-matrix)" />
                        <path d="M -25 22 L 0 35" fill="none" stroke="#6366f1" strokeWidth="1.2" markerEnd="url(#arrow-matrix)" />

                        <g transform="translate(0, -10)">
                          <rect x="0" y="0" width="65" height="18" rx="3" fill="#e0f2fe" stroke="#0369a1" strokeWidth="1" />
                          <text x="32.5" y="11" fill="#0369a1" fontSize="6.5" fontWeight="bold" textAnchor="middle">🔒 Encrypted Stream</text>
                        </g>

                        <g transform="translate(0, 25)">
                          <rect x="0" y="0" width="65" height="18" rx="3" fill="#ccfbf1" stroke="#0f766e" strokeWidth="1" />
                          <text x="32.5" y="11" fill="#0f766e" fontSize="6.5" fontWeight="bold" textAnchor="middle">🗂️ Log Group Folder</text>
                        </g>
                      </g>
                    </g>
                  )}

                  {/* 2. TELEMETRY AGENTS DIAGRAM */}
                  {matrixTopic === 'agents' && (
                    <g>
                      {/* Left: EC2 Host */}
                      <g transform="translate(10, 10)">
                        <rect x="0" y="0" width="115" height="135" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                        <text x="57.5" y="12" fill="#475569" fontSize="7" fontWeight="extrabold" textAnchor="middle">💻 EC2 Server Host</text>

                        {/* Sub-node A: Application logs */}
                        <g transform="translate(10, 20)">
                          <rect x="0" y="0" width="95" height="20" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                          <text x="47.5" y="13" fill="#334155" fontSize="6.5" fontWeight="semibold" textAnchor="middle">📦 Node.js App (syslog)</text>
                        </g>

                        {/* Sub-node B: Legacy Agent */}
                        <g transform="translate(10, 50)">
                          <rect x="0" y="0" width="95" height="20" rx="3" fill="#fef2f2" stroke="#fca5a5" strokeWidth="1" />
                          <text x="47.5" y="11" fill="#991b1b" fontSize="6" fontWeight="extrabold" textAnchor="middle">🔴 Legacy Agent (Deprecated)</text>
                          <text x="47.5" y="17" fill="#b91c1c" fontSize="5" textAnchor="middle">Tails files only</text>
                          <path d="M 95 10 L 135 40" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#arrow-matrix)" />
                        </g>

                        {/* Sub-node C: Unified CloudWatch Agent */}
                        <g transform="translate(10, 85)">
                          <rect x="0" y="0" width="95" height="38" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                          <text x="47.5" y="11" fill="#065f46" fontSize="6.5" fontWeight="extrabold" textAnchor="middle">🟢 Unified CW Agent</text>
                          <text x="47.5" y="21" fill="#047857" fontSize="5.5" textAnchor="middle">📂 App logs + OS CPU/Disk</text>
                          <text x="47.5" y="31" fill="#065f46" fontSize="5" textAnchor="middle">Aggregates Performance</text>
                          <path d="M 95 18 L 135 25" fill="none" stroke="#10b981" strokeWidth="1.2" markerEnd="url(#arrow-matrix)" />
                          {matrixSimState === 'running' && <circle r="2.5" fill="#34d399"><animateMotion dur="1s" repeatCount="indefinite" path="M 95 18 L 135 25" /></circle>}
                        </g>
                      </g>

                      {/* Right: Ingestion endpoints */}
                      <g transform="translate(145, 10)">
                        {/* Other Out-of-box Sources */}
                        <g transform="translate(0, 0)">
                          <rect x="0" y="0" width="115" height="45" rx="5" fill="#faf5ff" stroke="#d8b4fe" strokeWidth="1" />
                          <text x="57.5" y="12" fill="#5b21b6" fontSize="7" fontWeight="bold" textAnchor="middle">🚀 Native Telemetry Ingest</text>
                          
                          <g transform="translate(5, 18)">
                            <rect x="0" y="0" width="30" height="20" rx="2" fill="#ffffff" stroke="#c7d2fe" />
                            <text x="15" y="12" fill="#4338ca" fontSize="5" fontWeight="bold" textAnchor="middle">EB App</text>
                          </g>
                          <g transform="translate(42, 18)">
                            <rect x="0" y="0" width="30" height="20" rx="2" fill="#ffffff" stroke="#c7d2fe" />
                            <text x="15" y="12" fill="#4338ca" fontSize="5" fontWeight="bold" textAnchor="middle">ECS Cont.</text>
                          </g>
                          <g transform="translate(80, 18)">
                            <rect x="0" y="0" width="30" height="20" rx="2" fill="#ffffff" stroke="#c7d2fe" />
                            <text x="15" y="12" fill="#4338ca" fontSize="5" fontWeight="bold" textAnchor="middle">Lambda</text>
                          </g>
                        </g>

                        {/* Central Storage */}
                        <g transform="translate(5, 65)">
                          <rect x="0" y="0" width="110" height="60" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                          <text x="55" y="15" fill="#334155" fontSize="7.5" fontWeight="bold" textAnchor="middle">📁 CloudWatch</text>
                          <text x="55" y="27" fill="#475569" fontSize="7" fontWeight="bold" textAnchor="middle">Log Groups</text>
                          
                          <g transform="translate(8, 34)">
                            <rect x="0" y="0" width="94" height="20" rx="2" fill="#e0f2fe" stroke="#0ea5e9" />
                            <text x="47" y="12" fill="#0369a1" fontSize="5.5" fontWeight="extrabold" textAnchor="middle">🔒 Encrypted by Default</text>
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
                        <rect x="0" y="0" width="55" height="60" rx="6" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1.5" />
                        <text x="27.5" y="18" fill="#312e81" fontSize="8" fontWeight="bold" textAnchor="middle">📈 CW</text>
                        <text x="27.5" y="32" fill="#312e81" fontSize="7.5" fontWeight="bold" textAnchor="middle">Logs</text>
                        <text x="27.5" y="47" fill="#4338ca" fontSize="6" fontWeight="bold" textAnchor="middle">Ingest Hub</text>
                      </g>

                      {/* TOP PATH: S3 Export (createExportTask) - Late (12h) */}
                      <g transform="translate(80, 25)">
                        <path d="M -15 35 L 5 -7.5 L 15 -7.5" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#arrow-matrix)" />
                        
                        <g transform="translate(15, -20)">
                          <rect x="0" y="0" width="85" height="25" rx="4" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.2" />
                          <text x="42.5" y="10" fill="#78350f" fontSize="6.5" fontWeight="bold" textAnchor="middle">⏳ S3 Export Task</text>
                          <text x="42.5" y="18" fill="#b45309" fontSize="5.5" fontWeight="extrabold" textAnchor="middle">⚠️ Latency: Up to 12 Hours</text>
                          
                          {matrixSimState === 'running' && (
                            <circle cx="75" cy="12" r="3" fill="#ef4444" className="pulse-circle" />
                          )}
                        </g>

                        <g transform="translate(115, -20)">
                          <path d="M -15 12.5 L 0 12.5" fill="none" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrow-matrix)" />
                          <rect x="0" y="0" width="45" height="25" rx="4" fill="#f8fafc" stroke="#64748b" strokeWidth="1" />
                          <text x="22.5" y="15" fill="#334155" fontSize="7" fontWeight="bold" textAnchor="middle">🗄️ S3 Cold</text>
                        </g>
                      </g>

                      {/* BOTTOM PATH: Real-Time Subscriptions - Fast (<50ms) */}
                      <g transform="translate(80, 85)">
                        <path d="M -15 -10 L 5 15 L 15 15" fill="none" stroke="#059669" strokeWidth="1.5" markerEnd="url(#arrow-emerald)" />
                        {matrixSimState === 'running' && (
                          <circle r="2.5" fill="#10b981"><animateMotion dur="0.8s" repeatCount="indefinite" path="M -15 -10 L 5 15 L 15 15" /></circle>
                        )}

                        {/* Subscription Filter Gate */}
                        <g transform="translate(15, 0)">
                          <rect x="0" y="0" width="85" height="35" rx="4" fill="#ecfdf5" stroke="#059669" strokeWidth="1.2" />
                          <text x="42.5" y="11" fill="#065f46" fontSize="7" fontWeight="extrabold" textAnchor="middle">⚡ Subscription Filter</text>
                          <text x="42.5" y="21" fill="#047857" fontSize="6" fontWeight="bold" textAnchor="middle">Pattern: {"{ $.level = \"ERROR\" }"}</text>
                          <text x="42.5" y="29" fill="#065f46" fontSize="5.5" textAnchor="middle">Ingest Latency: &lt; 50ms</text>
                        </g>

                        {/* Streams Fan-out */}
                        <g transform="translate(115, 0)">
                          {/* Arrows fanning out */}
                          <path d="M -15 17 L 0 -22" fill="none" stroke="#059669" strokeWidth="1" markerEnd="url(#arrow-emerald)" />
                          <path d="M -15 17 L 0 17" fill="none" stroke="#059669" strokeWidth="1" markerEnd="url(#arrow-emerald)" />
                          <path d="M -15 17 L 0 55" fill="none" stroke="#059669" strokeWidth="1" markerEnd="url(#arrow-emerald)" />

                          {matrixSimState === 'running' && (
                            <g>
                              <circle r="2" fill="#10b981"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -15 17 L 0 -22" /></circle>
                              <circle r="2" fill="#10b981"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -15 17 L 0 17" /></circle>
                              <circle r="2" fill="#10b981"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -15 17 L 0 55" /></circle>
                            </g>
                          )}

                          <g transform="translate(0, -35)">
                            <rect x="0" y="0" width="60" height="18" rx="2" fill="#ecfdf5" stroke="#059669" />
                            <text x="30" y="11" fill="#065f46" fontSize="5.5" fontWeight="bold" textAnchor="middle">⚙️ Lambda</text>
                          </g>

                          <g transform="translate(0, 8)">
                            <rect x="0" y="0" width="60" height="18" rx="2" fill="#e0e7ff" stroke="#6366f1" />
                            <text x="30" y="11" fill="#312e81" fontSize="5.5" fontWeight="bold" textAnchor="middle">🌊 Kinesis KDS</text>
                          </g>

                          <g transform="translate(0, 48)">
                            <rect x="0" y="0" width="60" height="18" rx="2" fill="#f5f3ff" stroke="#7c3aed" />
                            <text x="30" y="11" fill="#581c87" fontSize="5.5" fontWeight="bold" textAnchor="middle">🔥 Kinesis KDF</text>
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
                        <rect x="0" y="0" width="55" height="60" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                        <text x="27.5" y="18" fill="#334155" fontSize="8.5" fontWeight="bold" textAnchor="middle">⚙️ AWS</text>
                        <text x="27.5" y="32" fill="#334155" fontSize="7.5" fontWeight="bold" textAnchor="middle">Resources</text>
                        <text x="27.5" y="47" fill="#475569" fontSize="5.5" textAnchor="middle">Telemetry data</text>
                      </g>

                      {/* TOP PATH: Standard Polling (GetMetricData API) */}
                      <g transform="translate(80, 25)">
                        <path d="M -15 35 L 5 -8 L 15 -8" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3,2" markerEnd="url(#arrow-matrix)" />
                        
                        <g transform="translate(15, -20)">
                          <rect x="0" y="0" width="85" height="24" rx="4" fill="#f1f5f9" stroke="#64748b" strokeWidth="1.2" />
                          <text x="42.5" y="10" fill="#334155" fontSize="6.5" fontWeight="bold" textAnchor="middle">📊 getMetricData API</text>
                          <text x="42.5" y="18" fill="#475569" fontSize="5.5" textAnchor="middle">Pull: 1-5 minutes delay</text>
                          {matrixSimState === 'running' && (
                            <text x="75" y="15" fill="#d97706" fontSize="7" className="animate-spin" style={{ transformOrigin: '75px 13px' }}>⚙️</text>
                          )}
                        </g>

                        <g transform="translate(115, -20)">
                          <path d="M -15 12 L 0 12" fill="none" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrow-matrix)" />
                          <rect x="0" y="0" width="45" height="24" rx="4" fill="#faf5ff" stroke="#c084fc" strokeWidth="1" />
                          <text x="22.5" y="15" fill="#6b21a8" fontSize="7" fontWeight="bold" textAnchor="middle">📈 Console</text>
                        </g>
                      </g>

                      {/* BOTTOM PATH: Metric Streams (Push) */}
                      <g transform="translate(80, 85)">
                        <path d="M -15 -10 L 5 15 L 15 15" fill="none" stroke="#2563eb" strokeWidth="1.5" markerEnd="url(#arrow-blue)" />
                        {matrixSimState === 'running' && (
                          <circle r="2.5" fill="#3b82f6"><animateMotion dur="0.7s" repeatCount="indefinite" path="M -15 -10 L 5 15 L 15 15" /></circle>
                        )}

                        <g transform="translate(15, 0)">
                          <rect x="0" y="0" width="85" height="34" rx="4" fill="#eff6ff" stroke="#2563eb" strokeWidth="1.2" />
                          <text x="42.5" y="11" fill="#1e3a8a" fontSize="7.5" fontWeight="extrabold" textAnchor="middle">🌊 Metric Stream</text>
                          <text x="42.5" y="21" fill="#1d4ed8" fontSize="6" fontWeight="bold" textAnchor="middle">Push Mode: &lt; 3s delay</text>
                          <text x="42.5" y="29" fill="#1e40af" fontSize="5.5" textAnchor="middle">Filter namespaces (EC2)</text>
                        </g>

                        <g transform="translate(115, 0)">
                          <path d="M -15 17 L 0 0" fill="none" stroke="#2563eb" strokeWidth="1" markerEnd="url(#arrow-blue)" />
                          <path d="M -15 17 L 0 35" fill="none" stroke="#2563eb" strokeWidth="1" markerEnd="url(#arrow-blue)" />

                          {matrixSimState === 'running' && (
                            <g>
                              <circle r="2" fill="#3b82f6"><animateMotion dur="0.8s" repeatCount="indefinite" path="M -15 17 L 0 0" /></circle>
                              <circle r="2" fill="#3b82f6"><animateMotion dur="0.8s" repeatCount="indefinite" path="M -15 17 L 0 35" /></circle>
                            </g>
                          )}

                          <g transform="translate(0, -10)">
                            <rect x="0" y="0" width="60" height="20" rx="3" fill="#e0f2fe" stroke="#0ea5e9" strokeWidth="1" />
                            <text x="30" y="12" fill="#0369a1" fontSize="6" fontWeight="bold" textAnchor="middle">🔥 Kinesis KDF</text>
                          </g>

                          <g transform="translate(0, 25)">
                            <rect x="0" y="0" width="60" height="20" rx="3" fill="#fdf4ff" stroke="#c084fc" strokeWidth="1" />
                            <text x="30" y="12" fill="#701a75" fontSize="6.5" fontWeight="bold" textAnchor="middle">📊 Datadog/Splunk</text>
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
                        <rect x="0" y="0" width="75" height="135" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                        <text x="37.5" y="12" fill="#475569" fontSize="6.5" fontWeight="extrabold" textAnchor="middle">📤 SENDER REGION</text>

                        {/* Account A */}
                        <g transform="translate(5, 18)">
                          <rect x="0" y="0" width="65" height="22" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                          <text x="32.5" y="14" fill="#334155" fontSize="6" fontWeight="bold" textAnchor="middle">A: /aws/ec2/prod</text>
                          <path d="M 65 11 L 110 50" fill="none" stroke={matrixSimState === 'failed' ? '#ef4444' : '#10b981'} strokeWidth="1" markerEnd={matrixSimState === 'failed' ? 'url(#arrow-rose)' : 'url(#arrow-emerald)'} />
                        </g>

                        {/* Account B */}
                        <g transform="translate(5, 50)">
                          <rect x="0" y="0" width="65" height="22" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                          <text x="32.5" y="14" fill="#334155" fontSize="6" fontWeight="bold" textAnchor="middle">B: /aws/lambda/pay</text>
                          <path d="M 65 11 L 110 12" fill="none" stroke={matrixSimState === 'failed' ? '#ef4444' : '#10b981'} strokeWidth="1" markerEnd={matrixSimState === 'failed' ? 'url(#arrow-rose)' : 'url(#arrow-emerald)'} />
                        </g>

                        {/* Account C */}
                        <g transform="translate(5, 82)">
                          <rect x="0" y="0" width="65" height="22" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
                          <text x="32.5" y="14" fill="#334155" fontSize="6" fontWeight="bold" textAnchor="middle">C: /aws/rds/core</text>
                          <path d="M 65 11 L 110 -25" fill="none" stroke={matrixSimState === 'failed' ? '#ef4444' : '#10b981'} strokeWidth="1" markerEnd={matrixSimState === 'failed' ? 'url(#arrow-rose)' : 'url(#arrow-emerald)'} />
                        </g>

                        {/* IAM Sender Role indicator */}
                        <g transform="translate(5, 114)">
                          <rect x="0" y="0" width="65" height="14" rx="2" fill="#f5f3ff" stroke="#c084fc" />
                          <text x="32.5" y="9" fill="#6b21a8" fontSize="5" fontWeight="bold" textAnchor="middle">🔑 IAM Sender Role</text>
                        </g>
                      </g>

                      {/* Account Boundary Dotted Line */}
                      <line x1="95" y1="5" x2="95" y2="155" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" />
                      <text x="95" y="165" fill="#64748b" fontSize="5" fontWeight="extrabold" textAnchor="middle">AWS BOUNDARY</text>

                      {/* Middle Gatekeeper Shield */}
                      <g transform="translate(102, 50)">
                        <circle cx="15" cy="15" r="14" fill={matrixPolicyCorrect ? '#ecfdf5' : '#fef2f2'} stroke={matrixPolicyCorrect ? '#10b981' : '#ef4444'} strokeWidth="2" />
                        <text x="15" y="19" fill="#ffffff" fontSize="11" textAnchor="middle" className={matrixSimState === 'failed' ? 'animate-pulse' : ''}>
                          {matrixPolicyCorrect ? '🛡' : '🚨'}
                        </text>
                        
                        <text x="15" y="38" fill={matrixPolicyCorrect ? '#065f46' : '#991b1b'} fontSize="5.5" fontWeight="extrabold" textAnchor="middle">
                          {matrixPolicyCorrect ? 'Allowed' : '403 Denied'}
                        </text>

                        {matrixSimState === 'running' && matrixPolicyCorrect && (
                          <g>
                            <circle r="2" fill="#10b981"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -27 12 L 15 15" /></circle>
                            <circle r="2" fill="#10b981"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -27 -20 L 15 15" /></circle>
                            <circle r="2" fill="#10b981"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -27 44 L 15 15" /></circle>
                          </g>
                        )}
                        {matrixSimState === 'running' && !matrixPolicyCorrect && (
                          <g>
                            <circle r="2" fill="#ef4444"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -27 12 L 15 15" /></circle>
                            <circle r="2" fill="#ef4444"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -27 -20 L 15 15" /></circle>
                            <circle r="2" fill="#ef4444"><animateMotion dur="0.9s" repeatCount="indefinite" path="M -27 44 L 15 15" /></circle>
                          </g>
                        )}
                      </g>

                      {/* Right: Recipient Monitoring Account Central Hub */}
                      <g transform="translate(150, 15)">
                        <rect x="0" y="0" width="120" height="135" rx="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                        <text x="60" y="12" fill="#0369a1" fontSize="6.5" fontWeight="extrabold" textAnchor="middle">📥 RECIPIENT ACCOUNT</text>

                        {/* Central Destination Ingest */}
                        <g transform="translate(12, 18)">
                          <rect x="0" y="0" width="96" height="24" rx="3" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1" />
                          <text x="48" y="11" fill="#312e81" fontSize="6" fontWeight="extrabold" textAnchor="middle">💼 Central KDS Ingest</text>
                          <text x="48" y="20" fill="#4338ca" fontSize="5" textAnchor="middle">Stream central-logs-kds</text>
                        </g>

                        {/* Buffering KDF */}
                        <g transform="translate(12, 52)">
                          <rect x="0" y="0" width="96" height="24" rx="3" fill="#fdf4ff" stroke="#d946ef" strokeWidth="1" />
                          <text x="48" y="11" fill="#701a75" fontSize="6" fontWeight="extrabold" textAnchor="middle">🔥 Central Firehose KDF</text>
                          <text x="48" y="20" fill="#a21caf" fontSize="5" textAnchor="middle">Buffers logs in batches</text>
                        </g>

                        {/* Central storage */}
                        <g transform="translate(12, 86)">
                          <rect x="0" y="0" width="96" height="38" rx="4" fill="#ecfdf5" stroke="#059669" strokeWidth="1" />
                          <text x="48" y="12" fill="#065f46" fontSize="7.5" fontWeight="bold" textAnchor="middle">🗄️ Central Logging Lake</text>
                          <text x="48" y="23" fill="#047857" fontSize="6" fontWeight="extrabold" textAnchor="middle">s3://corporate-logs-lake/</text>
                          <text x="48" y="32" fill="#065f46" fontSize="5" textAnchor="middle">WORM Retention &amp; KMS Keys</text>
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
          <div className="da-card bg-slate-950 border border-slate-900 rounded-2xl p-4 text-left shadow-lg">
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
    </div>
  );
}
