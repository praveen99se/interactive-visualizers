import { useState } from 'react';
import { 
  Globe, 
  Zap, 
  Shield, 
  Cpu, 
  HelpCircle,
  Lock
} from 'lucide-react';

interface UniqueCloudfrontFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueCloudfrontFeatures({ provider }: UniqueCloudfrontFeaturesProps) {
  // --- AWS STATES ---
  // Field-Level Encryption & Function Benchmark
  const [awsFieldText, setAwsFieldText] = useState('4532-8891-0021-9944');
  const [awsLogs, setAwsLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  // Front Door Rules Engine & Private Link
  const [azureLogs, setAzureLogs] = useState<string[]>([]);

  // --- GCP STATES ---
  // Cloud CDN Signed URL & Media CDN
  const [gcpKeyName, setGcpKeyName] = useState('cdn-signing-key-v1');
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // AWS Field Level Encryption
  const testAwsFieldEncryption = () => {
    setAwsLogs(prev => [
      `🔐 [CloudFront Field-Level Encryption] Input credit card "${awsFieldText}" intercepted at Edge PoP.`,
      `⚡ Encrypted field using RSA 2048 public key: "K9a#f2...===".`,
      `📦 Forwarded encrypted payload to origin. Origin web server cannot read card data without private key in HSM!`,
      ...prev.slice(0, 4)
    ]);
  };

  // Azure Front Door Rules Engine
  const testAzureFrontDoorRules = () => {
    setAzureLogs(prev => [
      `⚡ [Azure Front Door Rules Engine] Inbound request header "X-Device-Type: Mobile".`,
      `🔄 Rewrote URI path from "/index.html" ➔ "/mobile/index.html" at Edge PoP.`,
      `🔒 Established Private Link connection to backend App Service (No public IP exposed).`,
      ...prev.slice(0, 4)
    ]);
  };

  // GCP Signed URL Generator
  const generateGcpSignedUrl = () => {
    const expires = Math.floor(Date.now() / 1000) + 3600;
    setGcpLogs(prev => [
      `🔑 [Cloud CDN] Generated Signed URL for video segment "video_1080p.mp4".`,
      `URL: https://cdn.example.com/video_1080p.mp4?Expires=${expires}&Signature=a8f9c2...&KeyName=${gcpKeyName}`,
      `✅ Validated signature at Edge PoP in 0.4 ms. Request authorized!`,
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced Edge CDN Feature Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Explore specialized edge technologies including Field-Level Encryption at edge PoPs, Azure Front Door Private Link origins, and GCP Cloud CDN Signed URL validation.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS CLOUDFRONT: FIELD LEVEL ENCRYPTION                                    */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AWS CloudFront Field-Level Encryption</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                CloudFront Field-Level Encryption encrypts specific sensitive data fields (like credit cards or SSNs) at the edge before sending them to application origins, ensuring web servers never see plaintext sensitive fields.
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <label className="block font-bold mb-1 text-[11px]">Sensitive Form Data (Credit Card):</label>
                <input 
                  type="text" 
                  value={awsFieldText} 
                  onChange={(e) => setAwsFieldText(e.target.value)}
                  className="w-full p-1.5 border rounded dark:bg-slate-100 dark:bg-slate-900 text-[11px]"
                />
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {awsLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAwsFieldEncryption} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                🔐 Encrypt Sensitive Field at Edge
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>CloudFront Functions vs Lambda@Edge</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                CloudFront Functions execute lightweight JavaScript in &lt;1 ms at 600+ PoPs (viewer request/response). Lambda@Edge executes full Node.js/Python code at regional edge caches (origin request/response).
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 CloudFront Functions scale to 10,000,000+ RPS at 1/6th the cost of Lambda@Edge.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE: FRONT DOOR RULES ENGINE                                           */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Front Door Rules Engine & Private Link</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Azure Front Door allows building rules engine pipelines to modify HTTP headers, rewrite request paths, and forward traffic directly into Private VNets via Azure Private Link.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {azureLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAzureFrontDoorRules} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💙 Test Front Door Rules Engine
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Front Door Private Origins</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Azure Front Door Private Link origins connect to App Service, Storage Accounts, or Internal Load Balancers directly without public IP addresses or firewall open rules.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Eliminates IP whitelisting maintenance for backend web application servers.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP: CLOUD CDN SIGNED URLS & MEDIA CDN                                   */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Cloud CDN Signed URL Generator</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Google Cloud CDN uses HMAC-SHA1 cryptographic signatures to restrict media content access. Edge PoPs validate Signed URLs instantly before delivering cached video segments.
              </p>

              <div className="anl-card" style={{ padding: '12px', background: 'var(--color-background-secondary)', marginBottom: '12px', border: '1px solid var(--color-border-tertiary)' }}>
                <label className="block font-bold mb-1 text-[11px]">HMAC Key Identifier:</label>
                <input 
                  type="text" 
                  value={gcpKeyName} 
                  onChange={(e) => setGcpKeyName(e.target.value)}
                  className="w-full p-1.5 border rounded dark:bg-slate-100 dark:bg-slate-900 text-[11px]"
                />
              </div>

              {/* Logs */}
              <div className="anl-log" style={{ height: '95px', overflowY: 'auto' }}>
                {gcpLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={generateGcpSignedUrl} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                🔑 Generate & Validate Signed URL
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Google Media CDN</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Media CDN uses the same YouTube edge infrastructure (thousands of edge nodes) for high-bitrate live video streaming, video-on-demand (VOD), and large game patch downloads.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Delivers 98%+ edge cache hit ratios for video streaming workloads.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
