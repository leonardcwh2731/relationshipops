import React from 'react';
import { RefreshCw } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  lastUpdated: string;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, lastUpdated }) => {
  return (
    <header className="bg-white px-6 py-4">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">RelationshipOps Dashboard</h1>
          <p className="text-gray-600">Powered By VeraOps</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">Last updated: {lastUpdated}</span>
          <button
            onClick={onRefresh}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
    </header>
  );
};