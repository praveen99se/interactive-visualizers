import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Cloud } from 'lucide-react';
import Home from './pages/Home';
import LoadBalancerVisualizer from './pages/visualizers/LoadBalancerVisualizer';
import ASGVisualizer from './pages/visualizers/ASGVisualizer';
import RDSVisualizer from './pages/visualizers/RDSVisualizer';
import AuroraVisualizer from './pages/visualizers/AuroraVisualizer';
import ElastiCacheVisualizer from './pages/visualizers/ElastiCacheVisualizer';
import Route53Visualizer from './pages/visualizers/Route53Visualizer';
import EC2Visualizer from './pages/visualizers/EC2Visualizer';
import S3Visualizer from './pages/visualizers/S3Visualizer';
import CloudfrontVisualizer from './pages/visualizers/CloudfrontVisualizer';
import FilesAndStorageVisualizer from './pages/visualizers/FilesAndStorageVisualizer';
import IntegrationAndMessagingVisualizer from './pages/visualizers/IntegrationAndMessagingVisualizer';
import ElasticContainersVisualizer from './pages/visualizers/ElasticContainersVisualizer';
import ServerlessVisualizer from './pages/visualizers/ServerlessVisualizer';
import DatabasesAndAnalyticsVisualizer from './pages/visualizers/DatabasesAndAnalyticsVisualizer';
import CloudWatchMAndEventsVisualizer from './pages/visualizers/CloudWatchMAndEventsVisualizer';
import GovernanceAndIdentityVisualizer from './pages/visualizers/GovernanceAndIdentityVisualizer';
import SecretsAndKMSEncryptionVisualizer from './pages/visualizers/SecretsAndKMSEncryptionVisualizer';
import NetworkAndEdgeSecurityVisualizer from './pages/visualizers/NetworkAndEdgeSecurityVisualizer';
import NetworkingVPCVisualizer from './pages/visualizers/NetworkingVPCVisualizer';
import DisasterRecoveryVisualizer from './pages/visualizers/DisasterRecoveryVisualizer';
import OperationsAndMLVisualizer from './pages/visualizers/OperationsAndMLVisualizer';
import NotFound from './pages/NotFound';
import ScrollToTop from './components/ScrollToTop';

function AppContent() {
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [provider, setProvider] = useState<'aws' | 'azure' | 'gcp' | 'comparative'>('aws');
  const location = useLocation();
  const showSelector = location.pathname.includes('/visualizers/');

  const providerConfig = {
    aws: {
      name: 'AWS Cloud Architect',
      logoClass: 'from-amber-500 to-orange-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] group-hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]',
      hoverText: 'group-hover:text-amber-400',
      badgeClass: 'text-amber-400 bg-amber-950/80 border-amber-800 shadow-[inset_0_1px_4px_rgba(245,158,11,0.2)]',
    },
    azure: {
      name: 'Azure Cloud Architect',
      logoClass: 'from-blue-500 to-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.25)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.5)]',
      hoverText: 'group-hover:text-blue-400',
      badgeClass: 'text-blue-400 bg-blue-950/80 border-blue-800 shadow-[inset_0_1px_4px_rgba(59,130,246,0.2)]',
    },
    gcp: {
      name: 'Google Cloud Architect',
      logoClass: 'from-emerald-500 to-teal-400 shadow-[0_0_15px_rgba(16,185,129,0.25)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]',
      hoverText: 'group-hover:text-emerald-400',
      badgeClass: 'text-emerald-400 bg-emerald-950/80 border-emerald-800 shadow-[inset_0_1px_4px_rgba(16,185,129,0.2)]',
    },
    comparative: {
      name: 'Multi-Cloud Architect',
      logoClass: 'from-violet-500 to-fuchsia-400 shadow-[0_0_15px_rgba(139,92,246,0.25)] group-hover:shadow-[0_0_25px_rgba(139,92,246,0.5)]',
      hoverText: 'group-hover:text-violet-400',
      badgeClass: 'text-violet-400 bg-violet-950/80 border-violet-800 shadow-[inset_0_1px_4px_rgba(139,92,246,0.2)]',
    },
  };

  const currentConfig = providerConfig[provider];

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-500 ${isDarkTheme ? 'dark bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-800'
      }`}>

      {/* Ultra-Premium Glassmorphic Sticky Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300">
        {/* Subtle Accent Glow Top Line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500"></div>

        <nav className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col lg:flex-row items-center justify-between gap-4">

          {/* Branding Logo */}
          <Link to="/" className="flex items-center gap-3.5 group transition-all duration-300">
            <div className={`bg-gradient-to-tr ${currentConfig.logoClass} text-slate-950 p-2.5 rounded-2xl transition-all duration-300`}>
              <Cloud className="w-5.5 h-5.5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className={`text-lg font-black text-white tracking-tight flex items-center gap-2 ${currentConfig.hoverText} transition-colors duration-300`}>
                {currentConfig.name}
                <span className={`font-mono text-[9px] px-2 py-0.5 rounded-md border shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)] ${currentConfig.badgeClass}`}>
                  WORKBENCH
                </span>
              </span>
              <span className="text-[10.5px] text-slate-400 font-medium tracking-wide">
                Interactive Telemetry &amp; System Simulation Sandboxes
              </span>
            </div>
          </Link>

          {/* Header Controls: Cloud Selector + Theme Switcher */}
          <div className="flex items-center gap-3 flex-wrap justify-center lg:justify-end">
            {/* Cloud Provider Selector */}
            {showSelector && (
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-[inset_0_1px_4px_rgba(0,0,0,0.4)]">
                <button
                  onClick={() => setProvider('aws')}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wide uppercase transition-all duration-200 flex items-center gap-1 hover:scale-105 active:scale-95 ${
                    provider === 'aws'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  🧡 AWS
                </button>
                <button
                  onClick={() => setProvider('azure')}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wide uppercase transition-all duration-200 flex items-center gap-1 hover:scale-105 active:scale-95 ${
                    provider === 'azure'
                      ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30 shadow-[0_0_8px_rgba(59,130,246,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  💙 Azure
                </button>
                <button
                  onClick={() => setProvider('gcp')}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wide uppercase transition-all duration-200 flex items-center gap-1 hover:scale-105 active:scale-95 ${
                    provider === 'gcp'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  💚 GCP
                </button>
                <div className="w-[1px] h-4 bg-slate-800 self-center mx-0.5" />
                <button
                  onClick={() => setProvider('comparative')}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold tracking-wide uppercase transition-all duration-200 flex items-center gap-1 hover:scale-105 active:scale-95 ${
                    provider === 'comparative'
                      ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30 shadow-[0_0_8px_rgba(139,92,246,0.15)]'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  ⚖️ Compare
                </button>
              </div>
            )}

            {/* Premium Theme Switcher Toggle */}
            <button
              onClick={() => setIsDarkTheme(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl border transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95 text-[10.5px] font-bold font-mono shadow-[0_2px_8px_rgba(0,0,0,0.2)] ${isDarkTheme
                ? 'bg-slate-900 border-slate-800 text-amber-400 hover:text-amber-300 hover:bg-slate-800'
                : 'bg-slate-900 border-slate-850 text-slate-300 hover:text-white hover:bg-slate-850'
                }`}
              title={isDarkTheme ? "Switch to Light Theme" : "Switch to Dark Theme"}
            >
              {isDarkTheme ? (
                <span className="flex items-center gap-1.5">
                  ☀️ Light Mode
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  🌙 Dark Mode
                </span>
              )}
            </button>
          </div>

        </nav>
      </header>

      {/* Core Main Display Wrapper */}
      <main className="max-w-7xl w-full mx-auto px-4 md:px-8 py-8 flex-grow">
        <Routes>
          <Route path="/" element={<Home isDarkTheme={isDarkTheme} />} />
          <Route path="/visualizers/ec2" element={<EC2Visualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/load-balancer" element={<LoadBalancerVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/asg" element={<ASGVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/rds" element={<RDSVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/aurora" element={<AuroraVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/elasticache" element={<ElastiCacheVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/route53" element={<Route53Visualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/s3" element={<S3Visualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/cloudfront" element={<CloudfrontVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/storage-fs" element={<FilesAndStorageVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/integration-messaging" element={<IntegrationAndMessagingVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/elastic-containers" element={<ElasticContainersVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/serverless" element={<ServerlessVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/databases-analytics" element={<DatabasesAndAnalyticsVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/cloudwatch-events" element={<CloudWatchMAndEventsVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/governance-identity" element={<GovernanceAndIdentityVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/secrets-kms" element={<SecretsAndKMSEncryptionVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/network-security" element={<NetworkAndEdgeSecurityVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/networking-vpc" element={<NetworkingVPCVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/disaster-recovery" element={<DisasterRecoveryVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="/visualizers/operations-ml" element={<OperationsAndMLVisualizer provider={provider} setProvider={setProvider} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Global Premium Footer */}
      <footer className="bg-[#0b0f19] border-t border-slate-800 text-slate-400 py-10 mt-20">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">

          <div className="flex flex-col gap-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-white font-bold text-sm">
              <Cloud className="w-4 h-4 text-emerald-400" /> Multi-Cloud Interactive Visualizers Hub
            </div>
            <p className="text-[11px] text-slate-500 max-w-sm mt-1">
              Visualizing systems, queues, replicas, networks, and caching topologies in strict real-time pipelines.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 font-medium">
            <span className="hover:text-slate-300 transition-colors">Architecture Checklists</span>
            <span className="hover:text-slate-300 transition-colors">Strict Sandbox Auditing</span>
            <span className="hover:text-slate-300 transition-colors">Developer Console</span>
          </div>

          <div className="text-center md:text-right text-[11px] text-slate-500 font-mono">
            <p>© 2026 Multi-Cloud Architect Hub | Designed by Praveen</p>
            <p className="text-[9px] text-slate-600 mt-0.5">Strict TypeScript Compiler Checked</p>
          </div>

        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const isGithubPages = window.location.pathname.startsWith('/interactive-visualizers');
  const basename = isGithubPages ? '/interactive-visualizers' : '';

  return (
    <Router basename={basename}>
      <ScrollToTop />
      <AppContent />
    </Router>
  );
}
