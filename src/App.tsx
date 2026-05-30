import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Cloud, Terminal, GitBranch } from 'lucide-react';
import Home from './pages/Home';
import ALBNLBVisualizer from './pages/visualizers/ALBNLBVisualizer';
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
import NotFound from './pages/NotFound';
import ScrollToTop from './components/ScrollToTop';

export default function App() {
  const isGithubPages = window.location.pathname.startsWith('/interactive-visualizers');
  const basename = isGithubPages ? '/interactive-visualizers' : '';

  return (
    <Router basename={basename}>
      <ScrollToTop />
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
        
        {/* Ultra-Premium Glassmorphic Sticky Header */}
        <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 shadow-[0_4px_30px_rgba(0,0,0,0.1)] transition-all duration-300">
          {/* Subtle Accent Glow Top Line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500"></div>
          
          <nav className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Branding Logo */}
            <Link to="/" className="flex items-center gap-3.5 group transition-all duration-300">
              <div className="bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 p-2.5 rounded-2xl shadow-[0_0_15px_rgba(16,185,129,0.25)] group-hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] group-hover:scale-105 transition-all duration-300">
                <Cloud className="w-5.5 h-5.5 stroke-[2.2]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black text-white tracking-tight flex items-center gap-2 group-hover:text-emerald-400 transition-colors duration-300">
                  AWS Cloud Architect 
                  <span className="text-emerald-400 font-mono text-[9px] bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800 shadow-[inset_0_1px_4px_rgba(16,185,129,0.2)]">
                    WORKBENCH
                  </span>
                </span>
                <span className="text-[10.5px] text-slate-400 font-medium tracking-wide">
                  Interactive Telemetry &amp; System Simulation Sandboxes
                </span>
              </div>
            </Link>

            {/* Developer Metadata & Status Badges */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/80 rounded-xl px-3 py-1.5 text-[10px] font-mono text-slate-300 hover:border-emerald-500/30 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>ENG: <span className="text-emerald-400 font-bold">REACT_TS</span></span>
              </div>
              
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800/80 rounded-xl px-3 py-1.5 text-[10px] font-mono text-slate-300 hover:border-amber-500/30 transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.2)]">
                <GitBranch className="w-3.5 h-3.5 text-amber-400" />
                <span>SANDBOXES: <span className="text-amber-400 font-bold">14_LIVE</span></span>
              </div>
              
              <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl px-3 py-1.5 text-[10px] font-mono text-emerald-300 font-bold shadow-[0_2px_10px_rgba(16,185,129,0.1)] hover:bg-emerald-950/60 transition-all duration-300">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>STATUS: STABLE</span>
              </div>
            </div>

          </nav>
        </header>

        {/* Core Main Display Wrapper */}
        <main className="max-w-7xl w-full mx-auto px-4 md:px-8 py-8 flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/visualizers/alb-nlb" element={<ALBNLBVisualizer />} />
            <Route path="/visualizers/asg" element={<ASGVisualizer />} />
            <Route path="/visualizers/rds" element={<RDSVisualizer />} />
            <Route path="/visualizers/aurora" element={<AuroraVisualizer />} />
            <Route path="/visualizers/elasticache" element={<ElastiCacheVisualizer />} />
            <Route path="/visualizers/route53" element={<Route53Visualizer />} />
            <Route path="/visualizers/ec2" element={<EC2Visualizer />} />
            <Route path="/visualizers/s3" element={<S3Visualizer />} />
            <Route path="/visualizers/cloudfront" element={<CloudfrontVisualizer />} />
            <Route path="/visualizers/storage-fs" element={<FilesAndStorageVisualizer />} />
            <Route path="/visualizers/integration-messaging" element={<IntegrationAndMessagingVisualizer />} />
            <Route path="/visualizers/elastic-containers" element={<ElasticContainersVisualizer />} />
            <Route path="/visualizers/serverless" element={<ServerlessVisualizer />} />
            <Route path="/visualizers/databases-analytics" element={<DatabasesAndAnalyticsVisualizer />} />
            <Route path="/visualizers/cloudwatch-events" element={<CloudWatchMAndEventsVisualizer />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* Global Premium Footer */}
        <footer className="bg-[#0b0f19] border-t border-slate-800 text-slate-400 py-10 mt-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
            
            <div className="flex flex-col gap-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 text-white font-bold text-sm">
                <Cloud className="w-4 h-4 text-emerald-400" /> AWS Interactive Visualizers Hub
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
              <p>© 2026 AWS Architect Hub | Designed by Praveen</p>
              <p className="text-[9px] text-slate-600 mt-0.5">Strict TypeScript Compiler Checked</p>
            </div>

          </div>
        </footer>
      </div>
    </Router>
  );
}
