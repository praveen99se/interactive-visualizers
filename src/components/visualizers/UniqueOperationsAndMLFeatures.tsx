import { useState } from 'react';
import { 
  Sparkles, 
  Terminal, 
  Cpu, 
  HelpCircle
} from 'lucide-react';

interface UniqueOperationsAndMLFeaturesProps {
  provider: 'aws' | 'azure' | 'gcp';
}

export default function UniqueOperationsAndMLFeatures({ provider }: UniqueOperationsAndMLFeaturesProps) {
  // --- AWS STATES ---
  const [awsLogs, setAwsLogs] = useState<string[]>([]);

  // --- AZURE STATES ---
  const [azureLogs, setAzureLogs] = useState<string[]>([]);

  // --- GCP STATES ---
  const [gcpLogs, setGcpLogs] = useState<string[]>([]);

  // AWS Bedrock Guardrails Test
  const testAwsBedrockGuardrails = () => {
    setAwsLogs(prev => [
      `Sparkles [Amazon Bedrock] Invoked Claude 3.5 Sonnet with Guardrail "Enterprise-Safety-Policy".`,
      `🛡️ Guardrail filter checked prompt against PII masking & denied topic filters ("Competitor Pricing").`,
      `⚡ Sanitized prompt response returned in 340 ms. No data leakage or unverified output.`,
      ...prev.slice(0, 4)
    ]);
  };

  // Azure OpenAI GPT-4o Test
  const testAzureOpenAI = () => {
    setAzureLogs(prev => [
      `💙 [Azure OpenAI Service] Invoked GPT-4o deployment "gpt4o-prod-eastus".`,
      `⚡ Streamed 450 tokens with Content Safety filter evaluating harmful content categories in real time.`,
      `✅ Executed function call binding to Azure SQL Database safely via Azure Managed Identity.`,
      ...prev.slice(0, 4)
    ]);
  };

  // GCP Gemini 1M Token Test
  const testGcpGeminiContext = () => {
    setGcpLogs(prev => [
      `💚 [GCP Vertex AI Gemini 1.5 Pro] Ingested 850,000 token context window (entire codebase + video transcript).`,
      `⚡ Processed multi-modal context in 1.8 seconds using TPU v5p accelerator pod.`,
      `🔍 Grounding with Google Search verified facts with direct source citations!`,
      ...prev.slice(0, 4)
    ]);
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Overview Card */}
      <div className="anl-card" style={{ marginBottom: '14px' }}>
        <h2 style={{ fontSize: "18px", fontWeight: 800, color: "var(--color-text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>✨ Advanced Operations &amp; AI Machine Learning Sandboxes</h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", marginTop: "6px", lineHeight: "1.45" }}>Explore specialized AI &amp; operations capabilities including Amazon Bedrock Prompt Guardrails, Azure OpenAI GPT-4o streaming safety filters, and GCP Gemini 1.5 Pro 1M token context processing.</p>
      </div>

      {/* ========================================================================= */}
      {/* AWS BEDROCK GUARDRAILS                                                   */}
      {/* ========================================================================= */}
      {provider === 'aws' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Amazon Bedrock Guardrails &amp; PII Masking Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Bedrock Guardrails evaluates user prompts and model responses against safety policies, masking PII data (SSN, emails) and filtering hallucinated or harmful topics automatically.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {awsLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAwsBedrockGuardrails} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                ✨ Test Bedrock FM Prompt Guardrails
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #FF9900', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-5 h-5 text-amber-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>SSM Session Manager (No Inbound SSH Ports!)</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                SSM Session Manager opens encrypted interactive shell sessions to EC2 instances using the SSM Agent, eliminating open port 22, bastion hosts, or managing SSH keys.
              </p>
            </div>
            <div style={{ background: 'rgba(255,153,0,0.04)', border: '1px solid rgba(255,153,0,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#b45309' }}>
              💡 All terminal commands logged to CloudWatch &amp; S3 for security audit trails.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* AZURE OPENAI GPT-4O                                                      */}
      {/* ========================================================================= */}
      {provider === 'azure' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure OpenAI Service GPT-4o Streaming Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Azure OpenAI hosts OpenAI's latest GPT-4o multimodal models within Microsoft's private network compliance boundary, ensuring customer data is never used to train base models.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {azureLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testAzureOpenAI} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💙 Stream GPT-4o Token Response
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0078D4', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Azure Arc Hybrid Management</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Azure Arc projects external physical servers, VMware VMs, and K8s clusters into ARM, applying Azure RBAC policies and Defender security rules across multi-cloud infrastructure.
              </p>
            </div>
            <div style={{ background: 'rgba(0,120,212,0.04)', border: '1px solid rgba(0,120,212,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#005a9e' }}>
              💡 Manage AWS EC2 &amp; GCP Compute instances directly inside Azure portal.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GCP VERTEX AI GEMINI 1.5 PRO                                             */}
      {/* ========================================================================= */}
      {provider === 'gcp' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>GCP Vertex AI Gemini 1.5 Pro 1M Token Context Sandbox</h3>
              </div>
              <p style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginBottom: "14px", lineHeight: "1.45" }}>
                Gemini 1.5 Pro supports a groundbreaking 1,000,000+ token context window, allowing users to analyze entire codebases, hour-long videos, or massive PDF documents in a single prompt.
              </p>

              {/* Logs */}
              <div style={{ height: '100px', background: '#020617', padding: '8px', borderRadius: '6px', border: '1px solid var(--color-border-tertiary)', color: '#94a3b8', fontSize: '10.5px', fontFamily: 'monospace', overflowY: 'auto' }}>
                {gcpLogs.map((log, index) => <div key={index}>{log}</div>)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={testGcpGeminiContext} className="anl-btn anl-on-alb" style={{ width: '100%', fontWeight: 'bold', padding: '8px' }}>
                💚 Process 850k Token Codebase Prompt
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 anl-card flex flex-col justify-between" style={{ borderTop: '4px solid #0F9D58', marginBottom: 0 }}>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle className="w-5 h-5 text-emerald-500" />
                <h3 style={{ fontSize: "13.5px", fontWeight: "bold", color: "var(--color-text-primary)" }}>Google Cloud Deploy Canary Rules</h3>
              </div>
              <p style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', lineHeight: '1.45', marginBottom: '14px' }}>
                Cloud Deploy automates progressive delivery (canary deployments) to GKE and Cloud Run with automatic rollback rules based on Cloud Monitoring error rates.
              </p>
            </div>
            <div style={{ background: 'rgba(15,157,88,0.04)', border: '1px solid rgba(15,157,88,0.15)', borderRadius: '8px', padding: '10px', fontSize: '10.5px', color: '#0b7a44' }}>
              💡 Automatic zero-downtime canary rollouts for Kubernetes pods.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
