import { useState } from 'react';
import ALBTab from '../../components/visualizers/alb-nlb/ALBTab';
import NLBTab from '../../components/visualizers/alb-nlb/NLBTab';
import SimulationTab from '../../components/visualizers/alb-nlb/SimulationTab';
import ConfigTab from '../../components/visualizers/alb-nlb/ConfigTab';
import ComparisonTab from '../../components/visualizers/alb-nlb/ComparisonTab';

type TabType = 'alb' | 'nlb' | 'simulation' | 'config' | 'comparison';

const tabs: { id: TabType; label: string; emoji: string }[] = [
  { id: 'alb', label: 'ALB Stickiness', emoji: '🍪' },
  { id: 'nlb', label: 'NLB Stickiness', emoji: '🔢' },
  { id: 'simulation', label: 'Live Simulation', emoji: '🎮' },
  { id: 'config', label: 'Config & Code', emoji: '⚙️' },
  { id: 'comparison', label: 'Comparison', emoji: '⚖️' },
];

export default function ALBNLBVisualizer() {
  const [activeTab, setActiveTab] = useState<TabType>('alb');

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🍪 ALB vs NLB Stickiness Visualizer
        </h1>
        <p className="text-gray-600">
          Understand how AWS Application Load Balancer and Network Load Balancer handle session stickiness
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-bar mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {activeTab === 'alb' && <ALBTab />}
        {activeTab === 'nlb' && <NLBTab />}
        {activeTab === 'simulation' && <SimulationTab />}
        {activeTab === 'config' && <ConfigTab />}
        {activeTab === 'comparison' && <ComparisonTab />}
      </div>
    </div>
  );
}
