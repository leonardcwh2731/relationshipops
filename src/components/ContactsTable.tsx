import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit2, Save, X, Mail, User, Building, FileText, ExternalLink } from 'lucide-react';
import { GroupedContacts, Contact } from '../types/contact';

interface ContactsTableProps {
  groupedContacts: GroupedContacts;
  onUpdateContact: (id: string, field: string, value: any) => Promise<void>;
  loading: boolean;
}

export function ContactsTable({ groupedContacts, onUpdateContact, loading }: ContactsTableProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());
  const [editingContact, setEditingContact] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const toggleGroup = (email: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(email)) {
      newExpanded.delete(email);
    } else {
      newExpanded.add(email);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleContact = (contactId: string) => {
    const newExpanded = new Set(expandedContacts);
    if (newExpanded.has(contactId)) {
      newExpanded.delete(contactId);
    } else {
      newExpanded.add(contactId);
    }
    setExpandedContacts(newExpanded);
  };

  const startSectionEdit = (contactId: string, section: string) => {
    setEditingContact(contactId);
    setEditingSection(section);
    setEditingField(null);
    setEditValue('');
  };

  const startEditing = (contactId: string, field: string, currentValue: string) => {
    setEditingContact(contactId);
    setEditingField(field);
    setEditValue(currentValue || '');
  };

  const cancelEditing = () => {
    setEditingContact(null);
    setEditingSection(null);
    setEditingField(null);
    setEditValue('');
  };

  const saveEdit = async () => {
    if (editingContact && editingField) {
      try {
        await onUpdateContact(editingContact, editingField, editValue);
        setEditingField(null);
        setEditValue('');
      } catch (error) {
        console.error('Failed to update contact:', error);
      }
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatJoinDate = (month?: number, year?: number) => {
    if (!month || !year) return 'Not provided';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[month - 1]} ${year}`;
  };

  const accountEmails = Object.keys(groupedContacts).sort(); // Show all account emails

  if (accountEmails.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>No contacts found</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      {accountEmails.map(email => {
        const contacts = groupedContacts[email];
        const isGroupExpanded = expandedGroups.has(email);
        const leadsAbove80 = contacts.filter(c => (c.total_lead_score || 0) >= 80).length;

        return (
          <div key={email} className="border-b border-gray-200 last:border-b-0">
            {/* Group Header */}
            <div
              className="px-6 py-4 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
              onClick={() => toggleGroup(email)}
            >
              <div className="flex items-center space-x-3">
                {isGroupExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
                <Mail className="w-5 h-5 text-black" />
                <div>
                  <h3 className="text-lg font-semibold text-black">{email}</h3>
                  <p className="text-sm text-gray-600">
                    {contacts.length} contact{contacts.length !== 1 ? 's' : ''} • 
                    Leads Above 80: <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-600">
                      {leadsAbove80}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Contacts List */}
            {isGroupExpanded && (
              <div className="bg-white">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Job Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Company
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {contacts.map(contact => {
                        const isContactExpanded = expandedContacts.has(contact.id);
                        
                        return (
                          <React.Fragment key={contact.id}>
                            {/* Summary Row */}
                            <tr className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">
                                  {contact.full_name}
                                </div>
                                {contact.work_email && (
                                  <div className="text-sm text-gray-500">{contact.work_email}</div>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {contact.job_title}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {contact.company_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(contact.total_lead_score || 0)}`}>
                                  {contact.total_lead_score || 0}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button
                                  onClick={() => toggleContact(contact.id)}
                                  className="text-black hover:text-gray-700 flex items-center space-x-1"
                                >
                                  {isContactExpanded ? (
                                    <>
                                      <ChevronDown className="w-4 h-4" />
                                      <span>Hide Details</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronRight className="w-4 h-4" />
                                      <span>Show Details</span>
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>

                            {/* Expanded Details Row - Horizontal Layout */}
                            {isContactExpanded && (
                              <tr>
                                <td colSpan={5} className="px-6 py-6 bg-gray-50">
                                  <div className="overflow-x-auto">
                                    <div className="flex space-x-8 min-w-max">
                                      {/* Lead Information */}
                                      <div className="min-w-[300px] space-y-2">
                                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                            <User className="w-5 h-5 mr-2 text-blue-500" />
                                            Lead Information
                                          </h4>
                                          <button
                                            onClick={() => startSectionEdit(contact.id, 'lead')}
                                            className="text-gray-400 hover:text-gray-600"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                        
                                        {[
                                          { field: 'full_name', label: 'Full Name', value: contact.full_name },
                                          { field: 'first_name', label: 'First Name', value: contact.first_name },
                                          { field: 'last_name', label: 'Last Name', value: contact.last_name },
                                          { field: 'job_title', label: 'Job Title', value: contact.job_title },
                                          { field: 'work_email', label: 'Work Email', value: contact.work_email, isClickable: true },
                                          { field: 'company_join_date', label: 'Company Join Date', value: formatJoinDate(contact.current_company_join_month, contact.current_company_join_year) },
                                          { field: 'lead_country', label: 'Country', value: contact.lead_country },
                                          { field: 'connection_count', label: 'LinkedIn Connections', value: contact.connection_count?.toLocaleString() },
                                          { field: 'followers_count', label: 'LinkedIn Followers', value: contact.followers_count?.toLocaleString() }
                                        ].map(({ field, label, value, isClickable }) => (
                                          <div key={field} className="flex items-center py-1.5">
                                            <span className="text-sm font-medium text-gray-700 min-w-[160px]">{label}: </span>
                                            <div className="flex items-center space-x-2 flex-1">
                                              {editingContact === contact.id && editingSection === 'lead' && editingField === field ? (
                                                <div className="flex items-center space-x-2 w-full">
                                                  <input
                                                    type={field.includes('count') ? 'number' : 'text'}
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    autoFocus
                                                  />
                                                  <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                                                    <Save className="w-4 h-4" />
                                                  </button>
                                                  <button onClick={cancelEditing} className="text-red-600 hover:text-red-800">
                                                    <X className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <div className="flex items-center w-full">
                                                  {isClickable && value ? (
                                                    <a
                                                      href={field === 'work_email' ? `mailto:${value}` : value}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-sm text-blue-600 hover:text-blue-800 flex-1 cursor-pointer"
                                                      onClick={(e) => {
                                                        if (editingContact === contact.id && editingSection === 'lead' && field !== 'company_join_date') {
                                                          e.preventDefault();
                                                          startEditing(contact.id, field, value || '');
                                                        }
                                                      }}
                                                    >
                                                      {value || 'Not provided'}
                                                    </a>
                                                  ) : (
                                                    <span 
                                                      className={`text-sm text-gray-900 flex-1 ${
                                                        editingContact === contact.id && editingSection === 'lead' && field !== 'company_join_date' 
                                                          ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded' 
                                                          : ''
                                                      }`}
                                                      onClick={() => {
                                                        if (editingContact === contact.id && editingSection === 'lead' && field !== 'company_join_date') {
                                                          startEditing(contact.id, field, value || '');
                                                        }
                                                      }}
                                                    >
                                                      {value || 'Not provided'}
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}

                                        <div className="pt-4">
                                          <span className="text-sm font-medium text-gray-700 min-w-[160px]">LinkedIn Profile URL: </span>
                                          {contact.linkedin_profile_url ? (
                                            <a
                                              href={contact.linkedin_profile_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                              <ExternalLink className="w-4 h-4 mr-1" />
                                              View Profile
                                            </a>
                                          ) : (
                                            <span className="text-sm text-gray-900">Not provided</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Company Information */}
                                      <div className="min-w-[300px] space-y-2">
                                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                            <Building className="w-5 h-5 mr-2 text-green-500" />
                                            Company Information
                                          </h4>
                                          <button
                                            onClick={() => startSectionEdit(contact.id, 'company')}
                                            className="text-gray-400 hover:text-gray-600"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                        
                                        {[
                                          { field: 'company_name', label: 'Company Name', value: contact.company_name },
                                          { field: 'company_domain', label: 'Company Domain', value: contact.company_domain, isClickable: true },
                                          { field: 'company_industry', label: 'Company Industry', value: contact.company_industry },
                                          { field: 'company_staff_count_range', label: 'Company Staff Range', value: contact.company_staff_count_range }
                                        ].map(({ field, label, value, isClickable }) => (
                                          <div key={field} className="flex items-center py-1.5">
                                            <span className="text-sm font-medium text-gray-700 min-w-[160px]">{label}: </span>
                                            <div className="flex items-center space-x-2 flex-1">
                                              {editingContact === contact.id && editingSection === 'company' && editingField === field ? (
                                                <div className="flex items-center space-x-2 w-full">
                                                  <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    autoFocus
                                                  />
                                                  <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                                                    <Save className="w-4 h-4" />
                                                  </button>
                                                  <button onClick={cancelEditing} className="text-red-600 hover:text-red-800">
                                                    <X className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <div className="flex items-center w-full">
                                                  {isClickable && value ? (
                                                    <a
                                                      href={`https://${value}`}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-sm text-blue-600 hover:text-blue-800 flex-1 cursor-pointer"
                                                      onClick={(e) => {
                                                        if (editingContact === contact.id && editingSection === 'company') {
                                                          e.preventDefault();
                                                          startEditing(contact.id, field, value || '');
                                                        }
                                                      }}
                                                    >
                                                      {value || 'Not provided'}
                                                    </a>
                                                  ) : (
                                                    <span 
                                                      className={`text-sm text-gray-900 flex-1 ${
                                                        editingContact === contact.id && editingSection === 'company' 
                                                          ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded' 
                                                          : ''
                                                      }`}
                                                      onClick={() => {
                                                        if (editingContact === contact.id && editingSection === 'company') {
                                                          startEditing(contact.id, field, value || '');
                                                        }
                                                      }}
                                                    >
                                                      {value || 'Not provided'}
                                                    </span>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}

                                        <div className="pt-4">
                                          <span className="text-sm font-medium text-gray-700 min-w-[160px]">Company LinkedIn URL: </span>
                                          {contact.company_linkedin_url ? (
                                            <a
                                              href={contact.company_linkedin_url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                            >
                                              <ExternalLink className="w-4 h-4 mr-1" />
                                              View Company
                                            </a>
                                          ) : (
                                            <span className="text-sm text-gray-900">Not provided</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Daily Digest Information */}
                                      <div className="min-w-[400px] space-y-1.5">
                                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                                          <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                            <FileText className="w-5 h-5 mr-2 text-purple-500" />
                                            Daily Digest Information
                                          </h4>
                                          <button
                                            onClick={() => startSectionEdit(contact.id, 'digest')}
                                            className="text-gray-400 hover:text-gray-600"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                        </div>

                                        {/* Last Interaction Summary - Now Editable */}
                                        <div className="flex items-center py-1.5">
                                          <span className="text-sm font-medium text-gray-700 min-w-[180px]">Last Interaction Summary: </span>
                                          <div className="flex items-center space-x-2 flex-1">
                                            {editingContact === contact.id && editingSection === 'digest' && editingField === 'last_interaction_summary' ? (
                                              <div className="flex items-center space-x-2 w-full">
                                                <input
                                                  type="text"
                                                  value={editValue}
                                                  onChange={(e) => setEditValue(e.target.value)}
                                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                  autoFocus
                                                />
                                                <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                                                  <Save className="w-4 h-4" />
                                                </button>
                                                <button onClick={cancelEditing} className="text-red-600 hover:text-red-800">
                                                  <X className="w-4 h-4" />
                                                </button>
                                              </div>
                                            ) : (
                                              <span 
                                                className={`text-sm text-gray-900 flex-1 ${
                                                  editingContact === contact.id && editingSection === 'digest' 
                                                    ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded' 
                                                    : ''
                                                }`}
                                                onClick={() => {
                                                  if (editingContact === contact.id && editingSection === 'digest') {
                                                    startEditing(contact.id, 'last_interaction_summary', contact.last_interaction_summary || '');
                                                  }
                                                }}
                                              >
                                                {contact.last_interaction_summary || 'Not provided'}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Last Interaction Platform - Now Editable */}
                                        <div className="flex items-center py-1.5">
                                          <span className="text-sm font-medium text-gray-700 min-w-[180px]">Last Interaction Platform: </span>
                                          <div className="flex items-center space-x-2 flex-1">
                                            {editingContact === contact.id && editingSection === 'digest' && editingField === 'last_interaction_platform' ? (
                                              <div className="flex items-center space-x-2 w-full">
                                                <input
                                                  type="text"
                                                  value={editValue}
                                                  onChange={(e) => setEditValue(e.target.value)}
                                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                  autoFocus
                                                />
                                                <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                                                  <Save className="w-4 h-4" />
                                                </button>
                                                <button onClick={cancelEditing} className="text-red-600 hover:text-red-800">
                                                  <X className="w-4 h-4" />
                                                </button>
                                              </div>
                                            ) : (
                                              <span 
                                                className={`text-sm text-gray-900 flex-1 ${
                                                  editingContact === contact.id && editingSection === 'digest' 
                                                    ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded' 
                                                    : ''
                                                }`}
                                                onClick={() => {
                                                  if (editingContact === contact.id && editingSection === 'digest') {
                                                    startEditing(contact.id, 'last_interaction_platform', contact.last_interaction_platform || '');
                                                  }
                                                }}
                                              >
                                                {contact.last_interaction_platform || 'Not provided'}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Last Interaction Date - Now Editable */}
                                        <div className="flex items-center py-1.5">
                                          <span className="text-sm font-medium text-gray-700 min-w-[180px]">Last Interaction Date: </span>
                                          <div className="flex items-center space-x-2 flex-1">
                                            {editingContact === contact.id && editingSection === 'digest' && editingField === 'last_interaction_date' ? (
                                              <div className="flex items-center space-x-2 w-full">
                                                <input
                                                  type="datetime-local"
                                                  value={editValue}
                                                  onChange={(e) => setEditValue(e.target.value)}
                                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                  autoFocus
                                                />
                                                <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                                                  <Save className="w-4 h-4" />
                                                </button>
                                                <button onClick={cancelEditing} className="text-red-600 hover:text-red-800">
                                                  <X className="w-4 h-4" />
                                                </button>
                                              </div>
                                            ) : (
                                              <span 
                                                className={`text-sm text-gray-900 flex-1 ${
                                                  editingContact === contact.id && editingSection === 'digest' 
                                                    ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded' 
                                                    : ''
                                                }`}
                                                onClick={() => {
                                                  if (editingContact === contact.id && editingSection === 'digest') {
                                                    // Convert the date to the format expected by datetime-local input
                                                    const dateValue = contact.last_interaction_date 
                                                      ? new Date(contact.last_interaction_date).toISOString().slice(0, 16)
                                                      : '';
                                                    startEditing(contact.id, 'last_interaction_date', dateValue);
                                                  }
                                                }}
                                              >
                                                {formatDate(contact.last_interaction_date)}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* Talking Points and Value Add */}
                                        {[
                                          { field: 'talking_point_1', label: 'Talking Point 1' },
                                          { field: 'talking_point_2', label: 'Talking Point 2' },
                                          { field: 'talking_point_3', label: 'Talking Point 3' }
                                        ].map(({ field, label }) => (
                                          <div key={field} className="flex items-center py-1.5">
                                            <span className="text-sm font-medium text-gray-700 min-w-[180px]">{label}: </span>
                                            <div className="flex items-center space-x-2 flex-1">
                                              {editingContact === contact.id && editingSection === 'digest' && editingField === field ? (
                                                <div className="flex items-center space-x-2 w-full">
                                                  <input
                                                    type="text"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    autoFocus
                                                  />
                                                  <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                                                    <Save className="w-4 h-4" />
                                                  </button>
                                                  <button onClick={cancelEditing} className="text-red-600 hover:text-red-800">
                                                    <X className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <span 
                                                  className={`text-sm text-gray-900 flex-1 ${
                                                    editingContact === contact.id && editingSection === 'digest' 
                                                      ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded' 
                                                      : ''
                                                  }`}
                                                  onClick={() => {
                                                    if (editingContact === contact.id && editingSection === 'digest') {
                                                      startEditing(contact.id, field, (contact as any)[field] || '');
                                                    }
                                                  }}
                                                >
                                                  {(contact as any)[field] || 'Not provided'}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        ))}

                                        {/* Value Add */}
                                        <div className="flex items-center py-1.5">
                                          <span className="text-sm font-medium text-gray-700 min-w-[180px]">Value Add: </span>
                                          <div className="flex items-center space-x-2 flex-1">
                                            {editingContact === contact.id && editingSection === 'digest' && editingField === 'potential_value_add_headline' ? (
                                              <div className="flex items-center space-x-2 w-full">
                                                <input
                                                  type="text"
                                                  value={editValue}
                                                  onChange={(e) => setEditValue(e.target.value)}
                                                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                  autoFocus
                                                />
                                                <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                                                  <Save className="w-4 h-4" />
                                                </button>
                                                <button onClick={cancelEditing} className="text-red-600 hover:text-red-800">
                                                  <X className="w-4 h-4" />
                                                </button>
                                              </div>
                                            ) : (
                                              <div className="flex items-center w-full">
                                                {contact.potential_value_add_link && contact.potential_value_add_headline ? (
                                                  <a
                                                    href={contact.potential_value_add_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 text-sm underline flex-1 cursor-pointer"
                                                    onClick={(e) => {
                                                      if (editingContact === contact.id && editingSection === 'digest') {
                                                        e.preventDefault();
                                                        startEditing(contact.id, 'potential_value_add_headline', contact.potential_value_add_headline || '');
                                                      }
                                                    }}
                                                  >
                                                    {contact.potential_value_add_headline}
                                                  </a>
                                                ) : (
                                                  <span 
                                                    className={`text-sm text-gray-900 flex-1 ${
                                                      editingContact === contact.id && editingSection === 'digest' 
                                                        ? 'cursor-pointer hover:bg-gray-100 px-2 py-1 rounded' 
                                                        : ''
                                                    }`}
                                                    onClick={() => {
                                                      if (editingContact === contact.id && editingSection === 'digest') {
                                                        startEditing(contact.id, 'potential_value_add_headline', contact.potential_value_add_headline || '');
                                                      }
                                                    }}
                                                  >
                                                    {contact.potential_value_add_headline || 'Not provided'}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Sent to Client */}
                                        <div className="flex items-center py-1.5">
                                          <span className="text-sm font-medium text-gray-700 min-w-[180px]">Sent to Client: </span>
                                          <span className={`text-sm px-2 py-1 rounded-full text-xs font-medium ${
                                            contact.sent_to_client === 'Yes' 
                                              ? 'bg-green-100 text-green-600' 
                                              : 'bg-red-100 text-red-600'
                                          }`}>
                                            {contact.sent_to_client || 'No'}
                                          </span>
                                        </div>

                                        {/* Sent Date - Always show, even if empty */}
                                        <div className="flex items-center py-1.5">
                                          <span className="text-sm font-medium text-gray-700 min-w-[180px]">Sent Date: </span>
                                          <span className="text-sm text-gray-900 flex-1">
                                            {contact.exact_sent_date ? formatDate(contact.exact_sent_date) : 'Not provided'}
                                          </span>
                                        </div>

                                        {/* Added on */}
                                        <div className="flex items-center py-1.5 border-t border-gray-100 pt-3 mt-4">
                                          <span className="text-sm font-medium text-gray-700 min-w-[180px]">Added on: </span>
                                          <span className="text-sm text-gray-900 flex-1">
                                            {formatDate(contact.created_at)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}