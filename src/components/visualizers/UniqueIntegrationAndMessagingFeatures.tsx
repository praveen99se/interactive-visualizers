import { useState } from 'react';
import { 
  MessageSquare, 
  Radio, 
  GitFork, 
  Workflow, 
  HelpCircle
} from 'lucide-react';

interface UniqueIntegrationAndMessagingFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueIntegrationAndMessagingFeatures({ provider }: UniqueIntegrationAndMessagingFeaturesProps) {
  // --- AWS STATES ---
  const [dedupId, setDedupId] = useState('order-10492');
  const [groupId, setGroupId] = useState('user-user-88');
  const [awsLogs, setAwsLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  const [azureLogs, setAzureLogs] = useState<string[]>([]);

  // --- GCP STATES ---
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // AWS SQS FIFO Test
  const testAwsFifoDeduplication = () => {
    setAwsLogs(prev => [
      `📩 [SQS FIFO Queue] Enqueued message payload with MessageGroupId="${groupId}".`,
      `🔍 Deduplication Check: MessageDeduplicationId="${dedupId}". SHA-256 hash matched previous entry within 5-min window.`,
      `⚡ Duplicate message dropped automatically! Zero duplicate processing in consumer workers.`,
      ...prev.slice(0, 4)
    ]);
  };

  // Azure Service Bus Sessions
  const testAzureServiceBusSessions = () => {
    setAzureLogs(prev => [
      `💼 [Azure Service Bus Session] Session Lock acquired for SessionId="tenant-us-east".`,
      `🔒 Guaranteeing strict FIFO ordering for all messages belonging to session "tenant-us-east".`,
      `✅ Worker processed batch and released session lock.`,
      ...prev.slice(0, 4)
    ]);
  };

  // GCP Pub/Sub Exactly Once Delivery
  const testGcpPubSubExactlyOnce = () => {
    setGcpLogs(prev => [
      `💚 [Cloud Pub/Sub] Subscription configured with Exactly-Once Delivery enabled.`,
      `📨 Message ID "98421034" delivered to subscriber worker in us-central1.`,
      `⚡ Acknowledged before ack deadline. Redelivery prevented globally across all GCP regions.`,
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced Integration &amp; Messaging Feature Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Test specialized messaging guarantees including AWS SQS FIFO content-based deduplication, Azure Service Bus session locking, and GCP Cloud Pub/Sub exactly-once delivery.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS SQS FIFO & EVENTBRIDGE                                               */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AWS SQS FIFO Content-Based Deduplication Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                SQS FIFO queues guarantee exact single delivery when messages contain a <code>MessageDeduplicationId</code> or when content-based deduplication is enabled on the queue.
              </p>

              <div className="anl-card space-y-3" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <div>
                  <label className="block font-bold mb-1 text-[11px]">MessageDeduplicationId:</label>
                  <input 
                    type="text" 
                    value={dedupId} 
                    onChange={(e) => setDedupId(e.target.value)}
                    className="w-full p-1.5 border rounded dark:bg-slate-100 dark:bg-slate-900 text-[11px]"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1 text-[11px]">MessageGroupId:</label>
                  <input 
                    type="text" 
                    value={groupId} 
                    onChange={(e) => setGroupId(e.target.value)}
                    className="w-full p-1.5 border rounded dark:bg-slate-100 dark:bg-slate-900 text-[11px]"
                  />
                </div>
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {awsLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAwsFifoDeduplication} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                📩 Send SQS FIFO Message
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GitFork className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>EventBridge Content Filtering</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                EventBridge rules match JSON attributes (prefix matching, numeric ranges, anything-but filters) so downstream Lambda workers only receive relevant event payloads.
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 Reduces Lambda invocation costs by filtering noise at the event bus level.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE: SERVICE BUS SESSIONS                                              */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Radio className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Service Bus Session Locking</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Azure Service Bus Sessions provide joint handler grouping (FIFO) for related message sets, preventing competing receivers from interleaving messages of different tenants.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {azureLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAzureServiceBusSessions} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💙 Test Service Bus Session Lock
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Logic Apps Visual Workflows</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Logic Apps visual workflow designer allows chaining Office 365, Salesforce, Azure Functions, and Blob Storage actions into automated enterprise pipelines without code.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Out-of-the-box connectors for 500+ SaaS platforms.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP: PUB/SUB EXACTLY ONCE                                                */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Workflow className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Cloud Pub/Sub Exactly-Once Delivery</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Google Cloud Pub/Sub supports Exactly-Once Delivery subscriptions, avoiding duplicate processing by tracking acknowledgment states globally across subscriber instances.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {gcpLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testGcpPubSubExactlyOnce} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💚 Publish &amp; Verify Exactly-Once Message
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GitFork className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Google Cloud Eventarc</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Eventarc standardizes event delivery from Cloud Storage buckets, Audit Logs, or custom Pub/Sub topics directly to Cloud Run microservices with CloudEvents format compliance.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Built on open-source CloudEvents specification.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
