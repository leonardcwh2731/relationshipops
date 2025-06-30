import React from 'react';
import { Building, MapPin, Calendar, Star, ExternalLink, Mail, User } from 'lucide-react';
import { Contact } from '../types/Contact';

interface ContactCardProps {
  contact: Contact;
}

export const ContactCard: React.FC<ContactCardProps> = ({ contact }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const getLeadScoreBadge = (score?: number) => {
    if (!score) return { color: 'bg-gray-100 text-gray-800', label: 'N/A' };
    
    if (score >= 80) return { color: 'bg-green-100 text-green-800', label: 'High' };
    if (score >= 60) return { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' };
    return { color: 'bg-red-100 text-red-800', label: 'Low' };
  };

  const leadScoreBadge = getLeadScoreBadge(contact.total_lead_score || contact.lead_score);

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors duration-150">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown'}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${leadScoreBadge.color}`}>
                  <Star className="mr-1 h-3 w-3" />
                  {leadScoreBadge.label}
                </span>
              </div>
              
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Building className="mr-1 h-4 w-4" />
                <span className="font-medium">{contact.job_title || 'N/A'}</span>
                <span className="mx-2">at</span>
                <span>{contact.company_name || 'N/A'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <Mail className="mr-1 h-4 w-4" />
                  <span className="truncate">{contact.work_email || 'N/A'}</span>
                </div>
                
                <div className="flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  <span>{contact.lead_country || 'N/A'}</span>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span>Last: {formatDate(contact.last_interaction_date)}</span>
                </div>

                <div className="flex items-center">
                  <Building className="mr-1 h-4 w-4" />
                  <span>{contact.company_staff_count_range || 'N/A'}</span>
                </div>
              </div>

              {contact.last_interaction_summary && (
                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {contact.last_interaction_summary}
                  </p>
                </div>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {contact.talking_point_1 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                    {contact.talking_point_1}
                  </span>
                )}
                {contact.talking_point_2 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                    {contact.talking_point_2}
                  </span>
                )}
                {contact.talking_point_3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                    {contact.talking_point_3}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 ml-4">
          <div className="flex flex-col space-y-2">
            {contact.linkedin_profile_url && (
              <a
                href={contact.linkedin_profile_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ExternalLink className="mr-1 h-3 w-3" />
                LinkedIn
              </a>
            )}
            
            <div className="text-right text-xs text-gray-500">
              <div>Score: {contact.total_lead_score || contact.lead_score || 'N/A'}</div>
              <div>Messages: {contact.total_number_of_messages || 0}</div>
              <div>Meetings: {contact.total_meeting_count || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};