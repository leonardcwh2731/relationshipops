import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { Contact } from '../types/Contact';

interface ContactsTableProps {
  contactsByEmail: Record<string, Contact[]>;
  loading: boolean;
}

export const ContactsTable: React.FC<ContactsTableProps> = ({ contactsByEmail, loading }) => {
  const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>({});

  const toggleEmail = (email: string) => {
    setExpandedEmails(prev => ({
      ...prev,
      [email]: !prev[email]
    }));
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getLeadsAbove80Count = (contacts: Contact[]) => {
    return contacts.filter(contact => (contact.total_lead_score || contact.lead_score || 0) >= 80).length;
  };

  if (loading) {
    return (
      <div className="px-6 py-8">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Contacts by Account Email</h2>
        <p className="text-sm text-gray-500">Sorted by lead score (highest first) • Auto-refreshes every 30 seconds</p>
      </div>

      <div className="space-y-2">
        {Object.entries(contactsByEmail).map(([email, contacts]) => (
          <div key={email} className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleEmail(email)}
              className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                {expandedEmails[email] ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
                <span className="font-medium text-gray-900">{email}</span>
                <span className="text-sm text-gray-500">
                  {contacts.length} contacts • Leads Above 80: 
                  <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {getLeadsAbove80Count(contacts)}
                  </span>
                </span>
              </div>
            </button>

            {expandedEmails[email] && (
              <div className="border-t border-gray-200">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="col-span-3">Contact</div>
                    <div className="col-span-2">Job Title</div>
                    <div className="col-span-3">Company</div>
                    <div className="col-span-1">Score</div>
                    <div className="col-span-3">Actions</div>
                  </div>
                </div>

                <div className="divide-y divide-gray-200">
                  {contacts
                    .sort((a, b) => (b.total_lead_score || b.lead_score || 0) - (a.total_lead_score || a.lead_score || 0))
                    .map((contact, index) => (
                      <div key={contact.linkedin_profile_url || index} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-3">
                            <div className="font-medium text-gray-900">
                              {contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown'}
                            </div>
                            <div className="text-sm text-blue-600">
                              {contact.work_email || 'N/A'}
                            </div>
                          </div>
                          
                          <div className="col-span-2">
                            <div className="text-sm text-gray-900">{contact.job_title || 'N/A'}</div>
                          </div>
                          
                          <div className="col-span-3">
                            <div className="font-medium text-gray-900">{contact.company_name || 'N/A'}</div>
                            <div className="text-sm text-blue-600">
                              {contact.company_domain || 'N/A'}
                            </div>
                          </div>
                          
                          <div className="col-span-1">
                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getScoreColor(contact.total_lead_score || contact.lead_score)}`}>
                              {contact.total_lead_score || contact.lead_score || 'N/A'}
                            </span>
                          </div>
                          
                          <div className="col-span-3">
                            <div className="flex items-center space-x-2">
                              <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center">
                                <ChevronRight className="w-4 h-4 mr-1" />
                                Show Details
                              </button>
                              {contact.linkedin_profile_url && (
                                <a
                                  href={contact.linkedin_profile_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};