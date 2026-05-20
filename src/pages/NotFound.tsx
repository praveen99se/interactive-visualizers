import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
      <p className="text-gray-600 mb-8">The visualizer you're looking for doesn't exist yet.</p>
      <Link to="/" className="inline-block px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
        ← Back to Home
      </Link>
    </div>
  );
}
