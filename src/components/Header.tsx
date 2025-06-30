import React from 'react';
import { LogOut, Building2 } from 'lucide-react';
import { CustomDropdown } from './CustomDropdown';
import { User } from '../App';

interface HeaderProps {
  user: User;
  onSignOut: () => void;
  availableEmails: string[];
  selectedEmail: string;
  onEmailChange: (email: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  onSignOut, 
  availableEmails, 
  selectedEmail, 
  onEmailChange 
}) => {
  const dropdownOptions = availableEmails.map(email => ({
    value: email,
    label: email
  }));

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RelationshipOps</h1>
              <p className="text-sm text-gray-600">Contact Management Dashboard</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="w-64">
              <CustomDropdown
                value={selectedEmail}
                onChange={onEmailChange}
                options={dropdownOptions}
                placeholder="All Account Emails"
              />
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user.full_name || user.first_name || 'User'}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              
              <button
                onClick={onSignOut}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};