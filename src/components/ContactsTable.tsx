import React, { useState } from 'react';
import { ExternalLink, Search, Filter } from 'lucide-react';

interface Contact {
  linkedin_profile_url: string;
  full_name: string;
  first_name: string;
  last_name: string;
  job_title: string;
  company_name: string;
  company_domain: string;
  lead_score: number;
  total_lead_score: number;
  sent_to_client: string;
  last_interaction_date: string;
  last_interaction_platform: string;
  client_full_name: string;
}

interface ContactsTableProps {
  contacts: Contact[];
}

export function ContactsTable({ contacts }: ContactsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<keyof Contact>('total_lead_score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterSent, setFilterSent] = useState<'all' | 'yes' | 'no'>('all');

  // Filter contacts based on search term and sent status
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.job_title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterSent === 'all' || 
      (filterSent === 'yes' && contact.sent_to_client === 'Yes') ||
      (filterSent === 'no' && contact.sent_to_client !== 'Yes');

    return matchesSearch && matchesFilter;
  });

  // Sort contacts
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const aValue = a[sortField] || 0;
    const bValue = b[sortField] || 0;
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleSort = (field: keyof Contact) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSentStatusColor = (status: string) => {
    return status === 'Yes' 
      ? 'text-green-800 bg-green-100 border-green-200'
      : 'text-gray-600 bg-gray-100 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterSent}
                onChange={(e) => setFilterSent(e.target.value as 'all' | 'yes' | 'no')}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Contacts</option>
                <option value="yes">Sent to Client</option>
                <option value="no">Not Sent</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('full_name')}
              >
                Name
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('company_name')}
              >
                Company
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('job_title')}
              >
                Title
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('total_lead_score')}
              >
                Score
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('sent_to_client')}
              >
                Status
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('last_interaction_date')}
              >
                Last Interaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedContacts.map((contact) => (
              <tr key={contact.linkedin_profile_url} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">{contact.client_full_name || 'N/A'}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{contact.company_name || 'N/A'}</div>
                  <div className="text-sm text-gray-500">{contact.company_domain || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{contact.job_title || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getScoreColor(contact.total_lead_score || 0)}`}>
                    {contact.total_lead_score || 0}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getSentStatusColor(contact.sent_to_client || 'No')}`}>
                    {contact.sent_to_client || 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{formatDate(contact.last_interaction_date)}</div>
                  <div className="text-sm text-gray-500">{contact.last_interaction_platform || 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {contact.linkedin_profile_url && (
                    <a
                      href={contact.linkedin_profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      LinkedIn
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedContacts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No contacts found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}