import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
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
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <Router basename="/interactive-visualizers">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <nav className="max-w-7xl mx-auto px-4 py-4">
            <Link to="/" className="text-2xl font-bold text-cyan-600">
              🎨 Interactive Visualizers
            </Link>
            <p className="text-sm text-gray-600 mt-1">
              Learn cloud, networking, algorithms & data structures interactively
            </p>
          </nav>
        </header>

        {/* Routes */}
        <main className="max-w-7xl mx-auto px-4 py-8">
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
            <p>© 2025 Interactive Visualizers | Made with ❤️ by Praveen</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
