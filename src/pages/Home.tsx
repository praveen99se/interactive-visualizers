import { Link } from 'react-router-dom';

const visualizers = [
  {
    id: 'alb-nlb',
    title: '🍪 ALB vs NLB Stickiness',
    description: 'Understand load balancer stickiness mechanisms - cookies vs flow hashing',
    tags: ['Cloud', 'AWS', 'Load Balancing'],
    path: '/visualizers/alb-nlb',
    icon: '⚡',
  },
  {
    id: 'asg',
    title: '📈 ASG Auto Scaling Group',
    description: 'Visualize how ASG scales EC2 instances and integrates with load balancers',
    tags: ['Cloud', 'AWS', 'Auto Scaling'],
    path: '/visualizers/asg',
    icon: '📈',
  },
  {
    id: 'rds',
    title: '🛢️ AWS RDS',
    description: 'Diagrams and a live model for RDS Multi-AZ and read replicas',
    tags: ['Cloud', 'AWS', 'Databases'],
    path: '/visualizers/rds',
    icon: '🛢️',
  },
  {
    id: 'aurora',
    title: '🌌 Amazon Aurora',
    description: 'Aurora architecture, serverless ACU simulation, and failover playbook',
    tags: ['Cloud', 'AWS', 'Databases'],
    path: '/visualizers/aurora',
    icon: '🌌',
  },
  // Add more visualizers here as you create them
  {
    id: 'sorting-algorithms',
    title: '🔀 Sorting Algorithms',
    description: 'Visualize how different sorting algorithms work in real-time',
    tags: ['Algorithms', 'Data Structures'],
    path: '/visualizers/sorting',
    icon: '📊',
    comingSoon: true,
  },
  {
    id: 'network-topology',
    title: '🌐 Network Topology',
    description: 'Explore OSI model, TCP/IP stack, and network protocols',
    tags: ['Networking', 'Education'],
    path: '/visualizers/network',
    icon: '📡',
    comingSoon: true,
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Interactive Learning Visualizers
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Complex cloud, networking, and algorithm concepts made simple through interactive visualizations.
          Click, explore, and understand how technology works under the hood.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-3 gap-4 py-8 mb-12">
        <div className="bg-blue-50 rounded-lg p-6 text-center border border-blue-200">
          <div className="text-3xl font-bold text-blue-600">1+</div>
          <div className="text-sm text-gray-600 mt-2">Visualizers</div>
        </div>
        <div className="bg-green-50 rounded-lg p-6 text-center border border-green-200">
          <div className="text-3xl font-bold text-green-600">100%</div>
          <div className="text-sm text-gray-600 mt-2">Interactive</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-6 text-center border border-purple-200">
          <div className="text-3xl font-bold text-purple-600">∞</div>
          <div className="text-sm text-gray-600 mt-2">Learning Value</div>
        </div>
      </section>

      {/* Visualizers Grid */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Available Visualizers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visualizers.map((viz) => (
            <Link
              key={viz.id}
              to={viz.path}
              className={`rounded-lg border transition-all ${
                viz.comingSoon
                  ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                  : 'bg-white border-gray-200 hover:shadow-lg hover:border-cyan-300'
              } p-6`}
              onClick={(e) => viz.comingSoon && e.preventDefault()}
            >
              <div className="text-4xl mb-3">{viz.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{viz.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{viz.description}</p>
              <div className="flex flex-wrap gap-2">
                {viz.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs font-medium bg-cyan-100 text-cyan-700 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              {viz.comingSoon && (
                <div className="mt-4 text-xs font-semibold text-gray-500">
                  🚀 Coming Soon
                </div>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="mt-16 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-8 border border-cyan-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">How This Project Works</h2>
        <ul className="space-y-3 text-gray-700">
          <li>✨ <strong>Interactive Learning:</strong> No passive reading. Play with visualizations to understand concepts.</li>
          <li>💻 <strong>Live Coding:</strong> See state changes, simulations, and animations in real-time.</li>
          <li>🎯 <strong>Scalable Design:</strong> Add new visualizers easily. Each one is self-contained and modular.</li>
          <li>📱 <strong>Responsive:</strong> Works on desktop, tablet, and mobile devices.</li>
        </ul>
      </section>
    </div>
  );
}
