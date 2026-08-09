import React from 'react';
import { 
  Box, 
  Cpu, 
  Layers, 
  Shield, 
  Zap,
  Activity
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface ElasticContainersComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'ecs' | 'fargate' | 'eks' | 'ecr' | 'sim' | 'architect') => void;
}

export default function ElasticContainersComparativeView({ onNavigateToDemo }: ElasticContainersComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Managed Kubernetes Engine',
      aws: 'Amazon EKS (Elastic Kubernetes Service)',
      azure: 'Azure Kubernetes Service (AKS)',
      gcp: 'Google Kubernetes Engine (GKE Autopilot / Standard)',
      icon: <Layers className="w-4 h-4 text-cyan-500" />
    },
    {
      concept: 'Serverless Container Runtime',
      aws: 'AWS Fargate (Serverless compute for ECS & EKS)',
      azure: 'Azure Container Apps (ACA) / Azure Container Instances (ACI)',
      gcp: 'Google Cloud Run (Knative-based serverless containers)',
      icon: <Cpu className="w-4 h-4 text-cyan-500" />
    },
    {
      concept: 'Native Container Orchestration',
      aws: 'Amazon ECS (Elastic Container Service - AWS native engine)',
      azure: 'Azure Container Apps (KEDA & Dapr microservices)',
      gcp: 'Google Cloud Run / GKE Autopilot',
      icon: <Box className="w-4 h-4 text-cyan-500" />
    },
    {
      concept: 'Private Container Image Registry',
      aws: 'Amazon ECR (Elastic Container Registry)',
      azure: 'Azure Container Registry (ACR)',
      gcp: 'Google Artifact Registry / Container Registry',
      icon: <Shield className="w-4 h-4 text-cyan-500" />
    },
    {
      concept: 'Auto-Scaling Mechanism',
      aws: 'ECS Service Auto Scaling & EKS Karpenter / Cluster Autoscaler',
      azure: 'AKS Cluster Autoscaler & KEDA (Kubernetes Event-driven Autoscaling)',
      gcp: 'GKE Cluster Autoscaler & Cloud Run automatic HTTP concurrency scaling',
      icon: <Zap className="w-4 h-4 text-cyan-500" />
    },
    {
      concept: 'Service Mesh & Telemetry',
      aws: 'AWS App Mesh (Envoy proxy) / EKS VPC CNI',
      azure: 'AKS Istio Service Mesh addon / Azure CNI',
      gcp: 'Anthos Service Mesh (Managed Istio) / Dataplane v2 (Cilium eBPF)',
      icon: <Activity className="w-4 h-4 text-cyan-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'eks' | 'fargate'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '☸️ Managed Kubernetes Control Planes',
      tab: 'eks',
      awsDesc: 'Amazon EKS runs high-availability Kubernetes control planes across 3 AZs. EKS Karpenter dynamically launches rightsized EC2 nodes in seconds based on pending pod resource requests.',
      azureDesc: 'AKS provides a free or SLA-backed managed control plane. Integrates seamlessly with Azure AD for RBAC security, Azure CNI overlay networking, and Defender for Containers vulnerability scanning.',
      gcpDesc: 'GKE is the pioneer managed Kubernetes service. GKE Autopilot fully manages node provisioning, scaling, security hardening, and OS patching with a per-pod SLA pricing model.',
    },
    {
      title: '⚡ Serverless Container Execution',
      tab: 'fargate',
      awsDesc: 'AWS Fargate removes the need to provision, scale, or patch EC2 instances. You define vCPU and RAM requirements at the task/pod level, and Fargate isolates compute using dedicated microVMs.',
      azureDesc: 'Azure Container Apps (ACA) is built on Kubernetes, KEDA, and Dapr. Scales container instances down to zero based on HTTP requests, CPU, or message queue depth without managing K8s manifests.',
      gcpDesc: 'Google Cloud Run deploys stateless container images directly to Google Anycast edge network. Automatically scales instances from zero to thousands based on incoming HTTP concurrency in milliseconds.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side Container Platform Terminology Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 AWS (ECS / EKS / Fargate)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure (AKS / Container Apps)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP (GKE / Cloud Run)</th>
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
