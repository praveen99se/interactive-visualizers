import { useState } from 'react';
import { 
  Globe, 
  Activity, 
  Shield, 
  Network, 
  HelpCircle
} from 'lucide-react';

interface UniqueRoute53FeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueRoute53Features({ provider }: UniqueRoute53FeaturesProps) {
  // --- AWS STATES ---
  // Route 53 Alias Record Apex & Resolver Simulator
  const [awsRecordType, setAwsRecordType] = useState<'alias_a' | 'cname'>('alias_a');
  const [awsLogs, setAwsLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  // Traffic Manager Nested Profiles & Private DNS Links
  const [azureLogs, setAzureLogs] = useState<string[]>([]);

  // --- GCP STATES ---
  // Cloud DNS SEC Auto Signing & Forwarding Zones
  const [dnssecEnabled, setDnssecEnabled] = useState(true);
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // AWS Alias Apex Test
  const testAwsAliasRecord = () => {
    if (awsRecordType === 'alias_a') {
      setAwsLogs(prev => [
        `✅ [Route 53 Alias] Apex Query "example.com (Type A)" ➔ Internal Alias resolve to ALB (108.156.44.12). Zero DNS lookup charge!`,
        `💡 Alias records dynamically track ALB/CloudFront IP changes without TTL propagation delays.`,
        ...prev.slice(0, 4)
      ]);
    } else {
      setAwsLogs(prev => [
        `❌ [DNS Standard] CNAME query on Root Apex "example.com" violates RFC 1034 standard! Cannot attach CNAME to zone apex.`,
        ...prev.slice(0, 4)
      ]);
    }
  };

  // Azure Traffic Manager Query
  const testAzureTrafficManager = () => {
    setAzureLogs(prev => [
      `🌐 [Traffic Manager Profile] Inbound client query from Germany. Performance routing matched Frankfurt Endpoint (13.79.12.44).`,
      `🔒 Private DNS Zone linked to VNet "vnet-prod-westeurope". Single-label hostname resolved internally.`,
      ...prev.slice(0, 4)
    ]);
  };

  // GCP Cloud DNSSEC Test
  const testGcpDnssec = () => {
    if (dnssecEnabled) {
      setGcpLogs(prev => [
        `🛡️ [Cloud DNSSEC] Response signed with Key-Signing Key (KSK) & Zone-Signing Key (ZSK). RRSIG validated.`,
        `🔒 Protects clients against DNS cache poisoning and spoofing attacks.`,
        ...prev.slice(0, 4)
      ]);
    } else {
      setGcpLogs(prev => [
        `⚠️ [Cloud DNSSEC Disabled] Standard DNS response returned without cryptographic RRSIG signature verification.`,
        ...prev.slice(0, 4)
      ]);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced DNS & Traffic Routing Feature Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Test provider-specific DNS capabilities including Route 53 Apex Alias resolution, Azure Traffic Manager nested routing profiles, and GCP Cloud DNSSEC validation.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS ROUTE 53: ALIAS RECORD APEX & RESOLVER                                */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AWS Route 53 Zone Apex Alias Record Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Standard DNS (RFC 1034) prohibits CNAME records at the Zone Apex (naked domain like <code>example.com</code>). AWS Route 53 solves this with proprietary Alias Records, allowing apex domains to point directly to ALBs, CloudFront distributions, or S3 buckets.
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <label className="block font-bold mb-1 text-[11px]">Apex Record Configuration:</label>
                <select 
                  value={awsRecordType} 
                  onChange={(e) => setAwsRecordType(e.target.value as any)}
                  className="w-full p-1.5 border rounded bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-[11px]"
                >
                  <option value="alias_a">Route 53 Alias Record (A Record to ALB Target)</option>
                  <option value="cname">Standard CNAME Record (Violates RFC on Apex)</option>
                </select>
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {awsLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAwsAliasRecord} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                🌐 Resolve Zone Apex (example.com)
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Network className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Route 53 Resolver Endpoints</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Route 53 Resolver Endpoints (Inbound and Outbound) enable hybrid cloud DNS resolution between AWS VPCs and on-premises data centers over Direct Connect or VPN tunnels.
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 Outbound forwarding rules query corporate DNS servers (`corp.internal`) seamlessly.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE: TRAFFIC MANAGER                                                   */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Traffic Manager Performance & Private DNS</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Azure Traffic Manager routes DNS queries using performance profiles (directing clients to the Azure region with lowest network latency) and supports Private DNS VNet links.
              </p>

              {/* Logs */}
              <div style={{ height: '110px', background: 'var(--color-background-secondary)', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: 'var(--color-text-secondary)', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {azureLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAzureTrafficManager} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💙 Test Traffic Manager Performance Profile
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Nested Traffic Manager Profiles</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Azure allows nesting Traffic Manager profiles (e.g. combining Geographic routing at top level with Priority failover at child profile level) for multi-tiered global DR schemes.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Enables sophisticated multi-region failover trees without custom proxy scripts.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP: CLOUD DNSSEC                                                        */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Cloud DNSSEC Cryptographic Validation</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Google Cloud DNS features 1-click automatic DNSSEC signing. Cloud DNS automatically manages Key-Signing Keys (KSK) and Zone-Signing Keys (ZSK) rotation schedules.
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', marginBottom: '6px' }}>
                  <span>DNSSEC Status:</span>
                  <span style={{ color: dnssecEnabled ? '#16a34a' : '#dc2626' }}>{dnssecEnabled ? 'ACTIVE (Signed RRSIG)' : 'DISABLED'}</span>
                </div>
                <button 
                  onClick={() => setDnssecEnabled(!dnssecEnabled)}
                  className={`w-full py-1.5 rounded text-[11px] font-bold ${dnssecEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}
                >
                  Toggle DNSSEC ({dnssecEnabled ? 'ON' : 'OFF'})
                </button>
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {gcpLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testGcpDnssec} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                🛡️ Query DNSSEC Signed Record
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>100% SLA Global Anycast DNS</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Google Cloud DNS operates from Google's global Anycast name server locations around the world, providing 100% availability SLA for DNS resolution queries.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Serves billions of DNS queries per second with ultra-low latency worldwide.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
