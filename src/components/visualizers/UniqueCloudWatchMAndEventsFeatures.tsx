import { useState } from 'react';
import { 
  Activity, 
  FileText, 
  Bell, 
  HelpCircle
} from 'lucide-react';

interface UniqueCloudWatchMAndEventsFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueCloudWatchMAndEventsFeatures({ provider }: UniqueCloudWatchMAndEventsFeaturesProps) {
  // --- AWS STATES ---
  const [awsLogs, setAwsLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  const [kqlQuery, setKqlQuery] = useState("AppEvents | where ResultCode == '500' | summarize count() by bin(TimeGenerated, 5m)");
  const [azureLogs, setAzureLogs] = useState<string[]>([]);

  // --- GCP STATES ---
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // AWS Anomaly Detection
  const testAwsAnomalyDetection = () => {
    setAwsLogs(prev => [
      `📊 [CloudWatch Anomaly Detection] Evaluated CPUUtilization metric history over 14 days using ML model.`,
      `⚠️ Expected band: 12% – 38%. Current reading: 94% (Out of Band!).`,
      `🔔 Alarm state changed: OK ➔ ALARM. Triggered SNS Topic "Ops-Urgent-Alerts".`,
      ...prev.slice(0, 4)
    ]);
  };

  // Azure KQL Test
  const testAzureKQL = () => {
    setAzureLogs(prev => [
      `💙 [Azure Log Analytics] Executing KQL query against workspace "law-prod-eastus".`,
      `Query: ${kqlQuery}`,
      `📊 Returned 48 HTTP 500 error events in 0.12 seconds. Triggered Action Group webhook.`,
      ...prev.slice(0, 4)
    ]);
  };

  // GCP Log Router Test
  const testGcpLogRouter = () => {
    setGcpLogs(prev => [
      `💚 [GCP Cloud Logging Log Router] Ingested 10,000 log entries from GKE cluster.`,
      `🔀 Log Sink rule matched: "severity >= ERROR". Exported logs to BigQuery dataset "audit_logs_db" in real time.`,
      `🔒 Log Exclusions rule dropped 8,500 DEBUG level logs to reduce storage costs by 85%.`,
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced Observability &amp; Monitoring Feature Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Test specialized observability features including AWS CloudWatch ML Anomaly Detection bands, Azure Log Analytics KQL query execution, and GCP Cloud Logging Log Router export sinks.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS CLOUDWATCH ANOMALY DETECTION                                         */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AWS CloudWatch ML Anomaly Detection Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                CloudWatch Anomaly Detection applies machine learning algorithms to continuously analyze metric trends, creating an expected normal behavior band to alarm on unexpected spikes.
              </p>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {awsLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAwsAnomalyDetection} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                📊 Simulate Metric Anomaly &amp; Alarm Trigger
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>High-Resolution Metrics (1-Second)</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                CloudWatch custom high-resolution metrics allow publishing telemetry data with sub-minute resolution down to 1 second for ultra-sensitive trading and gaming applications.
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 Enables sub-minute alarm evaluation and auto-remediation triggers.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE LOG ANALYTICS KQL                                                  */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Log Analytics KQL Query Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Kusto Query Language (KQL) is a read-only request to process data and return results. KQL syntax allows building complex pipeline queries with operators like <code>where</code>, <code>summarize</code>, and <code>render</code>.
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <label className="block font-bold mb-1 text-[11px]">KQL Query Command:</label>
                <input 
                  type="text" 
                  value={kqlQuery} 
                  onChange={(e) => setKqlQuery(e.target.value)}
                  className="w-full p-1.5 border rounded dark:bg-slate-100 dark:bg-slate-900 text-[11px] font-mono"
                />
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {azureLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAzureKQL} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💙 Execute KQL Query in Log Analytics
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Action Groups</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Action Groups define a collection of notification preferences (Email, SMS, Azure App Push) and automated actions (Azure Function, Logic App, Automation Runbook) triggered by alerts.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Centralized notification routing shared across all Azure alert rules.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP LOG ROUTER & LOG ANALYTICS                                           */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Cloud Logging Log Router Sinks</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Log Router intercepts all incoming logs and routes them to destinations (Log Buckets, BigQuery, Pub/Sub, Storage Buckets) based on inclusion and exclusion filter rules.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {gcpLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testGcpLogRouter} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💚 Test Log Router Export Sink &amp; Exclusion Filter
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Log Analytics SQL Queries</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Log Buckets upgraded to use Log Analytics allow writing BigQuery standard SQL queries over live log events without exporting them out of Cloud Logging.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Runs full SQL join queries across security logs and application traces.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
