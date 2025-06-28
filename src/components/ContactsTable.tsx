import React from 'react';
import { ExternalLink, Mail, Building2, User, Calendar, Star } from 'lucide-react';

interface Contact {
  linkedin_profile_url: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  company_domain?: string;
  job_title?: string;
  work_email?: string;
  last_interaction_date?: string;
  last_interaction_summary?: string;
  lead_score?: number;
  total_lead_score?: number;
  sent_to_client?: string;
  exact_sent_date?: string;
  talking_point_1?: string;
  talking_point_2?: string;
  talking_point_3?: string;
  client_email?: string;
  client_email_id?: string;
  client_full_name?: string;
  client_first_name?: string;
  client_last_name?: string;
  last_interaction_platform?: string;
  potential_value_add_link?: string;
  potential_value_add_headline?: string;
  linkedin_profile_urn?: string;
  connection_count?: number;
  followers_count?: number;
  current_company_join_month?: number;
  current_company_join_year?: number;
  lead_country?: string;
  company_industry?: string;
  company_staff_count_range?: string;
  total_thread_count?: number;
  total_number_of_messages?: number;
  total_trust_score?: number;
  total_meeting_count?: number;
  unique_platforms_count?: number;
  signals_lead_score?: number;
  company_id?: number;
  created_at?: string;
}

interface ContactsTableProps {
  contacts: Contact[];
}

export function ContactsTable({ contacts }: ContactsTableProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const getLeadScore = (contact: Contact) => {
    return contact.total_lead_score || contact.lead_score || 0;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getStatusColor = (status?: string) => {
    if (!status) return 'text-gray-500 bg-gray-100';
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus === 'yes') return 'text-green-600 bg-green-100';
    if (normalizedStatus === 'no') return 'text-red-600 bg-red-100';
    return 'text-gray-500 bg-gray-100';
  };

  if (contacts.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-8 text-center">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
        <p className="text-gray-500">There are no contacts to display at this time.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Interaction
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.map((contact, index) => {
              const leadScore = getLeadScore(contact);
              const fullName = contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown';
              
              return (
                <tr key={contact.linkedin_profile_url || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-500" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{fullName}</div>
                        <div className="text-sm text-gray-500">{contact.job_title || 'N/A'}</div>
                        {contact.work_email && (
                          <div className="flex items-center text-xs text-gray-400 mt-1">
                            <Mail className="h-3 w-3 mr-1" />
                            {contact.work_email}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm text-gray-900">{contact.company_name || 'N/A'}</div>
                        {contact.company_domain && (
                          <div className="text-xs text-gray-500">{contact.company_domain}</div>
                        )}
                        {contact.company_industry && (
                          <div className="text-xs text-gray-400">{contact.company_industry}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(leadScore)}`}>
                        {leadScore}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm text-gray-900">{formatDate(contact.last_interaction_date)}</div>
                        {contact.last_interaction_platform && (
                          <div className="text-xs text-gray-500">{contact.last_interaction_platform}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contact.sent_to_client)}`}>
                      {contact.sent_to_client || 'Pending'}
                    </span>
                    {contact.exact_sent_date && (
                      <div className="text-xs text-gray-400 mt-1">
                        Sent: {formatDate(contact.exact_sent_date)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      {contact.linkedin_profile_url && (
                        <a
                          href={contact.linkedin_profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800"
                          title="View LinkedIn Profile"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      {contact.potential_value_add_link && (
                        <a
                          href={contact.potential_value_add_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800"
                          title="Value Add Content"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {contacts.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-700">
            Showing {contacts.length} contact{contacts.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}
    </div>
  );
}