import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Edit3 } from 'lucide-react';
import { Contact } from '../types/Contact';
import { ContactDetailsModal } from './ContactDetailsModal';

interface ContactsListProps {
  contactsByEmail: Record<string, Contact[]>;
  loading: boolean;
}

export const ContactsList: React.FC<ContactsListProps> = ({ contactsByEmail, loading }) => {
  const [expandedEmails, setExpandedEmails] = useState<Record<string, boolean>>({});
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleEmail = (email: string) => {
    setExpandedEmails(prev => ({
      ...prev,
      [email]: !prev[email]
    }));
  };

  const handleShowDetails = (contact: Contact) => {
    setSelectedContact(contact);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedContact(null);
  };

  const handleEditContact = (contact: Contact) => {
    // TODO: Implement edit functionality
    console.log('Edit contact:', contact);
  };

  const getLeadsAbove80Count = (contacts: Contact[]) => {
    return contacts.filter(contact => (contact.total_lead_score || contact.lead_score || 0) >= 80).length;
  };

  if (loading) {
    return (
      <div className="px-8">
        <div className="bg-white rounded-2xl p-8">
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8">
      {/* Header aligned with search bar */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Contacts by Account Email</h2>
        <p className="text-sm text-gray-500">Sorted by lead score (highest first) • Auto-refreshes every 30 seconds</p>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden">
        <div className="p-8 space-y-3">
          {Object.entries(contactsByEmail)
            .sort(([, a], [, b]) => getLeadsAbove80Count(b) - getLeadsAbove80Count(a))
            .map(([email, contacts]) => (
            <div key={email} className="border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleEmail(email)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {expandedEmails[email] ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <span className="font-medium text-gray-900">{email}</span>
                  <span className="text-sm text-gray-500">
                    {contacts.length.toLocaleString()} contacts • Leads Above 80:
                    <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {getLeadsAbove80Count(contacts)}
                    </span>
                  </span>
                </div>
              </button>

              {expandedEmails[email] && (
                <div className="border-t border-gray-200 bg-white">
                  <div className="p-4">
                    <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
                      <div className="col-span-3">Contact</div>
                      <div className="col-span-2">Job Title</div>
                      <div className="col-span-3">Company</div>
                      <div className="col-span-1">Score</div>
                      <div className="col-span-3">Actions</div>
                    </div>

                    <div className="space-y-3">
                      {contacts
                        .sort((a, b) => (b.total_lead_score || b.lead_score || 0) - (a.total_lead_score || a.lead_score || 0))
                        .slice(0, 10) // Show first 10 contacts
                        .map((contact, index) => (
                          <div key={contact.linkedin_profile_url || index} className="grid grid-cols-12 gap-4 items-center py-3 hover:bg-gray-50 rounded-lg px-3 -mx-3 transition-colors">
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
                              <span className="inline-flex items-center justify-center w-10 h-10 bg-black text-white rounded-full text-sm font-bold">
                                {contact.total_lead_score || contact.lead_score || 'N/A'}
                              </span>
                            </div>
                            
                            <div className="col-span-3">
                              <div className="flex items-center space-x-3">
                                <button 
                                  onClick={() => handleShowDetails(contact)}
                                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center transition-colors"
                                >
                                  <ChevronRight className="w-4 h-4 mr-1" />
                                  Show Details
                                </button>
                                <button
                                  onClick={() => handleEditContact(contact)}
                                  className="text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                                  title="Edit contact"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                    
                    {contacts.length > 10 && (
                      <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                        <span className="text-sm text-gray-500">
                          Showing 10 of {contacts.length.toLocaleString()} contacts
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Details Modal */}
      <ContactDetailsModal
        contact={selectedContact}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};