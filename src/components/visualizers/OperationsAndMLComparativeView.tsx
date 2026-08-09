import React from 'react';
import { 
  Bot, 
  Cpu, 
  Settings, 
  Workflow, 
  Sparkles,
  Terminal
} from 'lucide-react';

interface ComparisonRow {
  concept: string;
  aws: string;
  azure: string;
  gcp: string;
  icon: React.ReactNode;
}

interface OperationsAndMLComparativeViewProps {
  onNavigateToDemo: (provider: 'aws' | 'azure' | 'gcp', tab: 'sysmgr' | 'sagemaker' | 'bedrock' | 'cicd' | 'architect') => void;
}

export default function OperationsAndMLComparativeView({ onNavigateToDemo }: OperationsAndMLComparativeViewProps) {
  const comparisonRows: ComparisonRow[] = [
    {
      concept: 'Generative AI & LLM Foundation Models',
      aws: 'Amazon Bedrock (Claude 3.5, Llama 3, Titan, Mistral)',
      azure: 'Azure OpenAI Service (GPT-4o, GPT-4 Turbo, DALL-E 3)',
      gcp: 'Google Vertex AI Model Garden (Gemini 1.5 Pro/Flash, PaLM 2)',
      icon: <Sparkles className="w-4 h-4 text-indigo-500" />
    },
    {
      concept: 'End-to-End Machine Learning Platform',
      aws: 'Amazon SageMaker (Studio, Pipelines, Model Registry)',
      azure: 'Azure Machine Learning (AML Studio, AutoML, MLflow)',
      gcp: 'Google Vertex AI (AutoML, Custom Training, Pipelines)',
      icon: <Cpu className="w-4 h-4 text-indigo-500" />
    },
    {
      concept: 'Systems Management & Fleet Operations',
      aws: 'AWS Systems Manager (SSM Agent, Run Command, Patch Mgr)',
      azure: 'Azure Automation & Azure Arc (Runbooks, Update Mgr)',
      gcp: 'Google Cloud OS Config & Compute Engine Agent',
      icon: <Settings className="w-4 h-4 text-indigo-500" />
    },
    {
      concept: 'Continuous Delivery & CI/CD Pipelines',
      aws: 'AWS CodePipeline, CodeBuild & CodeDeploy',
      azure: 'Azure DevOps Pipelines & GitHub Actions integration',
      gcp: 'Google Cloud Build, Cloud Deploy & Artifact Registry',
      icon: <Workflow className="w-4 h-4 text-indigo-500" />
    },
    {
      concept: 'Interactive Shell & Agent Access',
      aws: 'SSM Session Manager (SSH-less secure terminal)',
      azure: 'Azure Arc Serial Console / Bastion SSH',
      gcp: 'Google Cloud OS Login & Cloud Shell',
      icon: <Terminal className="w-4 h-4 text-indigo-500" />
    },
    {
      concept: 'MLOps Feature Store & Model Monitoring',
      aws: 'SageMaker Feature Store & SageMaker Model Monitor',
      azure: 'Azure Machine Learning Feature Store & Data Drift Monitoring',
      gcp: 'Vertex AI Feature Store & Vertex AI Model Monitoring',
      icon: <Bot className="w-4 h-4 text-indigo-500" />
    }
  ];

  const comparativeDetails: { title: string; tab: 'bedrock' | 'sagemaker'; awsDesc: string; azureDesc: string; gcpDesc: string }[] = [
    {
      title: '✨ Serverless Generative AI & Foundation Models',
      tab: 'bedrock',
      awsDesc: 'Amazon Bedrock provides a serverless API to invoke leading foundation models (Anthropic Claude 3.5, Meta Llama 3, Amazon Titan) with enterprise data privacy and Guardrails.',
      azureDesc: 'Azure OpenAI Service provides managed access to OpenAI models (GPT-4o, DALL-E 3) hosted inside Microsoft enterprise security boundaries with fine-tuning capabilities.',
      gcpDesc: 'Google Vertex AI Model Garden gives access to Gemini 1.5 Pro and Gemini Flash models with 1M+ token context windows, integrated with Google Search grounding.',
    },
    {
      title: '🤖 End-to-End MLOps & Model Deployment Pipelines',
      tab: 'sagemaker',
      awsDesc: 'Amazon SageMaker automates model training, hyperparameter tuning, and real-time endpoint deployment with automatic multi-model hosting on GPU/Inferentia hardware.',
      azureDesc: 'Azure Machine Learning provides automated ML (AutoML), drag-and-drop designer interfaces, and native integration with MLflow for tracking experiments across compute clusters.',
      gcpDesc: 'Google Vertex AI unifies Google Cloud data services (BigQuery ML) with custom TensorFlow/PyTorch training and serverless endpoint scaling.',
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn text-left mt-4">
      {/* Side-by-Side Terminology Mapping */}
      <div className="asg-card" style={{ padding: '20px', border: '1px solid var(--asg-card-border)', background: 'var(--asg-card-bg)' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '12px', color: 'var(--color-text-primary)' }}>
          ⚖️ Side-by-Side Operations, MLOps & AI Terminology Mapping
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', minWidth: '600px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Concept</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>🧡 AWS (Bedrock / SageMaker / SSM)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💙 Azure (Azure OpenAI / AML / Arc)</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>💚 GCP (Vertex AI / Gemini / Cloud Build)</th>
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
