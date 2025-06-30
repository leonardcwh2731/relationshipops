import React from 'react';
import { Search, User } from 'lucide-react';

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedEmail: string;
  onEmailChange: (value: string) => void;
  availableEmails: string[];
}

export const SearchAndFilter: React.FC<SearchAndFilterProps> = ({
  searchTerm,
  onSearchChange,
  selectedEmail,
  onEmailChange,
  availableEmails
}) => {
  return (
    <div className="px-8 pb-8">
      <div className="flex gap-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search contacts by name, company, job title, email..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
          />
        </div>
        
        <div className="relative">
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <User className="w-5 h-5 text-gray-400" />
          </div>
          <select
            value={selectedEmail}
            onChange={(e) => onEmailChange(e.target.value)}
            className="appearance-none bg-white border border-gray-300 rounded-xl pl-12 pr-10 py-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[250px] text-base"
          >
            <option value="all">All Account Emails</option>
            {availableEmails.map(email => (
              <option key={email} value={email}>{email}</option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};