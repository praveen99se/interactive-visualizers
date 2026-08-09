import { useState } from 'react';
import { 
  ShieldAlert, 
  Shield, 
  Flame, 
  HelpCircle
} from 'lucide-react';

interface UniqueNetworkAndEdgeSecurityFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueNetworkAndEdgeSecurityFeatures({ provider }: UniqueNetworkAndEdgeSecurityFeaturesProps) {
  // --- AWS STATES ---
  const [awsLogs, setAwsLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  const [azureLogs, setAzureLogs] = useState<string[]>([]);

  // --- GCP STATES ---
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // AWS WAF Bot Control Test
  const testAwsWafBotControl = () => {
    setAwsLogs(prev => [
      `🛡️ [AWS WAF Bot Control] Inbound HTTP POST request from IP 198.51.100.42.`,
      `🔍 Inspected browser TLS fingerprint & User-Agent header. Matched Category="SearchEngineCrawler" / Risk="HIGH_BOT".`,
      `🚫 Action executed: BLOCK (HTTP 403 Forbidden). Prevented credential stuffing attack on /api/login in 0.4 ms.`,
      ...prev.slice(0, 4)
    ]);
  };

  // Azure WAF Geo Filtering Test
  const testAzureWafGeoFilter = () => {
    setAzureLogs(prev => [
      `💙 [Azure WAF Custom Rule] Inbound request to Application Gateway.`,
      `🌐 Client IP geo-located to country code "XX" matching Custom Deny Rule "Block-HighRisk-Regions".`,
      `❌ Dropped TCP connection at Front Door edge before reaching backend VM pool.`,
      ...prev.slice(0, 4)
    ]);
  };

  // GCP Cloud Armor Adaptive Protection Test
  const testGcpCloudArmorAdaptive = () => {
    setGcpLogs(prev => [
      `💚 [GCP Cloud Armor Adaptive Protection] ML anomaly detector flagged 15,000 req/sec spike on URL "/search".`,
      `⚡ Machine Learning model generated signature rule: "request.headers['user-agent'].contains('attack-bot')".`,
      `🛡️ Dynamically deployed auto-generated WAF rule to Google Edge LB. Traffic normalized in 4.2 seconds!`,
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced Edge &amp; Network Security Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Test specialized network security capabilities including AWS WAF Bot Control TLS fingerprinting, Azure WAF Geo-filtering custom rules, and GCP Cloud Armor Adaptive Protection ML auto-mitigation.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS WAF BOT CONTROL                                                       */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AWS WAF Bot Control &amp; Rate-Based Rule Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                AWS WAF Bot Control evaluates request headers, IP reputation, and browser TLS signatures to block malicious scraping and credential stuffing bots in real time.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {awsLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAwsWafBotControl} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                🛡️ Simulate Bot Attack &amp; Inspect WAF Block
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Shield Advanced 24/7 DRT Response</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Shield Advanced provides proactive engagement during active DDoS events. The AWS DDoS Response Team (DRT) writes custom WAF rules on your behalf during large-scale attacks.
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 Financial cost protection covers AWS resource scaling surges caused by DDoS.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE WAF GEO FILTERING                                                  */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure WAF Custom Rule &amp; Geo-Filtering Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Azure WAF custom rules allow creating precise matching criteria based on client IP geolocation, HTTP headers, request body parameters, and URI path patterns.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {azureLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAzureWafGeoFilter} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💙 Test Azure WAF Geo-Match Drop
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Firewall Premium IDPS</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Azure Firewall Premium provides TLS inspection and Intrusion Detection &amp; Prevention (IDPS) with over 67,000 signature rules updated continuously.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Deep packet inspection for encrypted HTTPS VNet egress traffic.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP CLOUD ARMOR ADAPTIVE PROTECTION                                      */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Cloud Armor Adaptive Protection ML Model</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Adaptive Protection continuously trains ML models on your web application's baseline traffic, generating suggested rules during attacks to stop volumetric L7 DDoS without false positives.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {gcpLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testGcpCloudArmorAdaptive} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💚 Test Cloud Armor Adaptive ML Mitigation
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>reCAPTCHA Enterprise Integration</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Cloud Armor integrates directly with Google reCAPTCHA Enterprise to issue friction-free risk scores (0.0 to 1.0) and enforce challenge pages at edge load balancers.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Zero friction human validation powered by Google AI search telemetry.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
