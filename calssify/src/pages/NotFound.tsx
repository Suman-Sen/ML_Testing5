import React from 'react';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">404 — Not Found</h1>
      <p className="mb-3">The page you’re looking for doesn’t exist.</p>
      <Link to="/" className="text-blue-600 underline">Go to Scan</Link>
    </div>
  );
};

export default NotFound;