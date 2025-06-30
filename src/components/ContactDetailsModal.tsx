import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { Contact } from '../types/Contact';

interface ContactDetailsModalProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ContactDetailsModal: React.FC<ContactDetailsModalProps> = ({ contact, isOpen, onClose }) => {
  if (!isOpen || !contact) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleBackdropClick}>
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">Contact Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lead Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h3 className="font-semibold text-gray-900">Lead Information</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Full Name:</label>
                  <p className="font-medium text-gray-900">{contact.full_name || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">First Name:</label>
                  <p className="font-medium text-gray-900">{contact.first_name || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Last Name:</label>
                  <p className="font-medium text-gray-900">{contact.last_name || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Job Title:</label>
                  <p className="font-medium text-gray-900">{contact.job_title || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Work Email:</label>
                  <p className="font-medium text-blue-600">{contact.work_email || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Country:</label>
                  <p className="font-medium text-gray-900">{contact.lead_country || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">LinkedIn Connections:</label>
                  <p className="font-medium text-gray-900">{contact.connection_count || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">LinkedIn Followers:</label>
                  <p className="font-medium text-gray-900">{contact.followers_count || 'N/A'}</p>
                </div>
                
                {contact.linkedin_profile_url && (
                  <div>
                    <a
                      href={contact.linkedin_profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Profile
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <h3 className="font-semibold text-gray-900">Company Information</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Company Name:</label>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{contact.company_name || 'N/A'}</p>
                    {contact.company_linkedin_url && (
                      <a
                        href={contact.company_linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Company Domain:</label>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-blue-600">{contact.company_domain || 'N/A'}</p>
                    {contact.company_domain && (
                      <a
                        href={`https://${contact.company_domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Company Industry:</label>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{contact.company_industry || 'N/A'}</p>
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Company Staff Range:</label>
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{contact.company_staff_count_range || 'N/A'}</p>
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                
                <div>
                  <a
                    href={contact.company_linkedin_url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View Company
                  </a>
                </div>
              </div>
            </div>

            {/* Daily Digest Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <h3 className="font-semibold text-gray-900">Daily Digest Information</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Last Interaction Summary:</label>
                  <p className="font-medium text-gray-900 text-right">{contact.last_interaction_summary || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Last Interaction Platform:</label>
                  <p className="font-medium text-gray-900 text-right">{contact.last_interaction_platform || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Last Interaction Date:</label>
                  <p className="font-medium text-gray-900 text-right">{formatDate(contact.last_interaction_date)}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Talking Point 1:</label>
                  <p className="font-medium text-gray-900 text-right">{contact.talking_point_1 || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Talking Point 2:</label>
                  <p className="font-medium text-gray-900 text-right">{contact.talking_point_2 || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Talking Point 3:</label>
                  <p className="font-medium text-gray-900 text-right">{contact.talking_point_3 || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Sent to Client:</label>
                  <p className="font-medium text-gray-900 text-right">{contact.sent_to_client || '-'}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Sent Date:</label>
                  <p className="font-medium text-gray-900 text-right">{formatDate(contact.exact_sent_date)}</p>
                </div>
                
                <div>
                  <label className="text-sm text-gray-500">Added On:</label>
                  <p className="font-medium text-gray-900 text-right">{formatDate(contact.created_at)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Lead Score Badge */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-800 rounded-full">
              <span className="text-2xl font-bold">{contact.total_lead_score || contact.lead_score || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};