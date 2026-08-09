import { useState } from 'react';
import { 
  Network, 
  Share2, 
  Shield, 
  HelpCircle
} from 'lucide-react';

interface UniqueNetworkingVPCFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueNetworkingVPCFeatures({ provider }: UniqueNetworkingVPCFeaturesProps) {
  // --- AWS STATES ---
  const [awsLogs, setAwsLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  const [azureLogs, setAzureLogs] = useState<string[]>([]);

  // --- GCP STATES ---
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // AWS Transit Gateway Test
  const testAwsTransitGateway = () => {
    setAwsLogs(prev => [
      `🌐 [AWS Transit Gateway] Attached VPC-A (10.1.0.0/16) and VPC-B (10.2.0.0/16) to TGW hub "tgw-09941a".`,
      `🔀 Route table propagation rule updated: 10.2.0.0/16 ➔ Target tgw-attach-vpcb.`,
      `⚡ Transitive inter-VPC packet routing activated across 50 spoke VPCs without point-to-point mesh!`,
      ...prev.slice(0, 4)
    ]);
  };

  // Azure Private Link Test
  const testAzurePrivateLink = () => {
    setAzureLogs(prev => [
      `💙 [Azure Private Link] Provisioned Private Endpoint inside Subnet "App-Subnet" (10.0.1.5).`,
      `🔒 Automated Private DNS Zone binding created: "myaccount.privatelink.blob.core.windows.net" ➔ 10.0.1.5.`,
      `✅ Internal VM traffic securely accesses Storage Blob over private Azure backbone! Zero internet exposure.`,
      ...prev.slice(0, 4)
    ]);
  };

  // GCP Global VPC Test
  const testGcpGlobalVpc = () => {
    setGcpLogs(prev => [
      `💚 [GCP Global VPC] Single VPC "vpc-global-prod" created without regional boundaries.`,
      `📍 Subnet us-central1 (10.128.0.0/20) and Subnet europe-west1 (10.132.0.0/20) added under SAME VPC.`,
      `⚡ VM in Iowa communicates with VM in Frankfurt over Google private fiber with 0 ms VPN overhead!`,
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced Virtual Networking Feature Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Test specialized networking capabilities including AWS Transit Gateway transitive hub routing, Azure Private Link Private DNS zone resolution, and GCP Global VPC cross-continental subnets.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS TRANSIT GATEWAY                                                      */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Share2 className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>AWS Transit Gateway Transitive Hub Routing Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                AWS Transit Gateway acts as a cloud router. Each new VPC connects to TGW with a single attachment, avoiding the N*(N-1)/2 mesh scaling limit of standard VPC Peering.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {awsLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAwsTransitGateway} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                🌐 Propagate TGW Transitive Routes Across VPC Hub
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Network className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>VPC Secondary IPv4 CIDR Expansion</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                AWS VPCs support adding up to 4 secondary IPv4 CIDR blocks (e.g. 100.64.0.0/16 Carrier-Grade NAT IPs) to expand subnet IP availability without re-creating the VPC.
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 Ideal for EKS cluster IP exhaustion recovery.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE PRIVATE LINK                                                       */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Private Link Private Endpoint Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Azure Private Link maps PaaS services directly to a private IP inside your VNet subnet, securing SQL databases and Storage accounts from public internet access.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {azureLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAzurePrivateLink} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💙 Bind Azure Private Endpoint &amp; Private DNS
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Virtual WAN Hubs</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Azure Virtual WAN provisions managed hubs in Microsoft data centers, uniting ExpressRoute, Site-to-Site VPN, and VNet spokes under a unified routing policy.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Global automated branch-to-cloud and VNet-to-VNet routing.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP GLOBAL VPC                                                            */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Network className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Global VPC Cross-Continental Subnet Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Google Cloud VPCs are global resources, not regional! A single GCP VPC network can contain subnets in Tokyo, London, and Oregon, communicating over Google private fiber without peering.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {gcpLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testGcpGlobalVpc} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💚 Test Global VPC Subnet Cross-Continental Route
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Private Service Connect (PSC)</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Private Service Connect connects consumer VPCs to producer services (Google APIs or third-party SaaS) using internal IP endpoints without external IP routing.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Zero IP overlap issues between producer and consumer VPC networks.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
