import React, { useState, useEffect } from 'react';
import { 
  User, 
  Search,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { CustomDropdown } from './components/CustomDropdown';
import { supabase } from './lib/supabase';
import { Contact } from './types/Contact';

interface Client {
  email_address: string;
  full_name: string;
  first_name: string;
  last_name: string;
}

const App: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  
  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  // Mock data for demonstration
  useEffect(() => {
    const mockClients: Client[] = [
      {
        email_address: 'peter.kang@barrelny.com',
        full_name: 'Peter Kang',
        first_name: 'Peter',
        last_name: 'Kang'
      },
      {
        email_address: 'leonard@ontenlabs.com',
        full_name: 'Leonard Chen',
        first_name: 'Leonard',
        last_name: 'Chen'
      }
    ];
    
    setClients(mockClients);

    // Mock contacts data
    const mockContacts: Contact[] = [
      {
        linkedin_profile_url: '1',
        full_name: 'Nadav Eitan',
        first_name: 'Nadav',
        last_name: 'Eitan',
        job_title: 'CEO',
        company_name: 'Emporus Technologies',
        company_domain: 'emporus.com',
        work_email: 'Nadav@emporus.com',
        total_lead_score: 94,
        client_email: 'peter.kang@barrelny.com',
        last_interaction_date: '2024-01-09',
        last_interaction_summary: 'Had planned future meetings',
        last_interaction_platform: 'Email',
        talking_point_1: 'Discuss maximizing insights using deep learning methodologies',
        talking_point_2: 'Recommend strategies for integrating additional data sources effectively',
        talking_point_3: 'Share best practices for continuously analyzing vast data sets',
        company_industry: 'Computer Software',
        company_staff_count_range: '11 - 50',
        connection_count: 1131,
        followers_count: 1128,
        lead_country: 'United States',
        sent_to_client: '-',
        exact_sent_date: null,
        created_at: '2025-06-28T00:30:29Z'
      },
      {
        linkedin_profile_url: '2',
        full_name: 'Jacob Sussman',
        first_name: 'Jacob',
        last_name: 'Sussman',
        job_title: 'CEO',
        company_name: 'BX Studio',
        company_domain: 'bx.studio',
        work_email: 'jacob@bx.studio',
        total_lead_score: 94,
        client_email: 'peter.kang@barrelny.com',
        last_interaction_date: '2024-01-08',
        company_industry: 'Design',
        company_staff_count_range: '11 - 50'
      },
      {
        linkedin_profile_url: '3',
        full_name: 'David Kong',
        first_name: 'David',
        last_name: 'Kong',
        job_title: 'Founder',
        company_name: 'Somm',
        company_domain: 'somm.ai',
        work_email: 'david@somm.ai',
        total_lead_score: 94,
        client_email: 'peter.kang@barrelny.com',
        last_interaction_date: '2024-01-07'
      },
      {
        linkedin_profile_url: '4',
        full_name: 'Andrew Vuu',
        first_name: 'Andrew',
        last_name: 'Vuu',
        job_title: 'Founder',
        company_name: 'Confetti',
        company_domain: 'confetti.io',
        work_email: 'andrew@confetti.io',
        total_lead_score: 94,
        client_email: 'peter.kang@barrelny.com',
        last_interaction_date: '2024-01-06'
      },
      {
        linkedin_profile_url: '5',
        full_name: 'Greg Hausheer',
        first_name: 'Greg',
        last_name: 'Hausheer',
        job_title: 'Head of Engineering',
        company_name: 'Cactus',
        company_domain: 'lightmatter.com',
        work_email: 'greg@lightmatter.com',
        total_lead_score: 94,
        client_email: 'peter.kang@barrelny.com',
        last_interaction_date: '2024-01-05'
      },
      {
        linkedin_profile_url: '6',
        full_name: 'Sarah Wilson',
        first_name: 'Sarah',
        last_name: 'Wilson',
        job_title: 'Product Manager',
        company_name: 'TechStart',
        company_domain: 'techstart.com',
        work_email: 'sarah@techstart.com',
        total_lead_score: 78,
        client_email: 'leonard@ontenlabs.com',
        last_interaction_date: '2024-01-04'
      }
    ];

    setContacts(mockContacts);
    setLastUpdated(new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }));
  }, []);

  const handleRefresh = () => {
    setLastUpdated(new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    }));
  };

  const clientOptions = clients.map(client => ({
    value: client.email_address,
    label: client.email_address,
    icon: <User className="w-4 h-4" />
  }));

  // Filter contacts based on search and selected client
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchTerm || 
      contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.work_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClient = selectedClient === 'all' || contact.client_email === selectedClient;
    
    return matchesSearch && matchesClient;
  });

  // Group contacts by client email
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const email = contact.client_email || 'unknown';
    if (!acc[email]) {
      acc[email] = [];
    }
    acc[email].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  const toggleAccountExpansion = (email: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(email)) {
      newExpanded.delete(email);
    } else {
      newExpanded.add(email);
    }
    setExpandedAccounts(newExpanded);
  };

  const handleShowDetails = (contact: Contact) => {
    setSelectedContact(contact);
    setShowContactDetails(true);
  };

  const handleHideDetails = () => {
    setShowContactDetails(false);
    setSelectedContact(null);
  };

  const totalContacts = filteredContacts.length;
  const accountGroups = Object.keys(groupedContacts).length;
  const leadsAbove80 = filteredContacts.filter(c => (c.total_lead_score || 0) > 80).length;
  const readyContacts = 0; // Placeholder

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">RelationshipOps Dashboard</h1>
              <p className="text-gray-600 mt-1">Powered By VeraOps</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Last updated: {lastUpdated}</span>
              <button
                onClick={handleRefresh}
                className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-black text-white rounded-lg p-6">
            <div className="text-3xl font-bold mb-2">{accountGroups}</div>
            <div className="text-sm text-gray-300">Account Groups</div>
          </div>
          
          <div className="bg-black text-white rounded-lg p-6">
            <div className="text-3xl font-bold mb-2">{totalContacts.toLocaleString()}</div>
            <div className="text-sm text-gray-300">Total Contacts</div>
          </div>
          
          <div className="bg-black text-white rounded-lg p-6">
            <div className="text-3xl font-bold mb-2">{leadsAbove80}</div>
            <div className="text-sm text-gray-300">Leads Above 80</div>
          </div>
          
          <div className="bg-black text-white rounded-lg p-6">
            <div className="text-3xl font-bold mb-2">{readyContacts}</div>
            <div className="text-sm text-gray-300">Ready Contacts</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search contacts by name, company, job title, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="w-64">
            <CustomDropdown
              value={selectedClient}
              onChange={setSelectedClient}
              options={clientOptions}
              placeholder="All Account Emails"
            />
          </div>
        </div>

        {/* Contacts Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Contacts by Account Email</h2>
            <p className="text-sm text-gray-500 mt-1">Sorted by lead score (highest first) • Auto-refreshes every 30 seconds</p>
          </div>

          <div className="divide-y divide-gray-200">
            {Object.entries(groupedContacts).map(([email, emailContacts]) => {
              const isExpanded = expandedAccounts.has(email);
              const leadsAbove80Count = emailContacts.filter(c => (c.total_lead_score || 0) > 80).length;
              
              return (
                <div key={email} className="p-4">
                  <button
                    onClick={() => toggleAccountExpansion(email)}
                    className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-gray-400 mr-2" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 mr-2" />
                      )}
                      <span className="font-medium text-gray-900">{email}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        {emailContacts.length} contacts • Leads Above 80: 
                        <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          {leadsAbove80Count}
                        </span>
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="mt-4 overflow-x-auto">
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
                          {emailContacts
                            .sort((a, b) => (b.total_lead_score || 0) - (a.total_lead_score || 0))
                            .map((contact) => (
                            <tr key={contact.linkedin_profile_url} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{contact.full_name}</div>
                                  <div className="text-sm text-blue-600">{contact.work_email}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {contact.job_title}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm text-gray-900">{contact.company_name}</div>
                                  <div className="text-sm text-blue-600">{contact.company_domain}</div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                  {contact.total_lead_score || 0}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <button
                                  onClick={() => handleShowDetails(contact)}
                                  className="text-blue-600 hover:text-blue-900 flex items-center"
                                >
                                  <ChevronRight className="w-4 h-4 mr-1" />
                                  Show Details
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {Object.keys(groupedContacts).length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No contacts found matching your criteria.
            </div>
          )}
        </div>

        {/* Contact Details Modal */}
        {showContactDetails && selectedContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedContact.full_name}</h3>
                    <p className="text-sm text-blue-600">{selectedContact.work_email}</p>
                  </div>
                  <button
                    onClick={handleHideDetails}
                    className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg"
                  >
                    <EyeOff className="w-4 h-4 mr-2" />
                    Hide Details
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Lead Information */}
                  <div>
                    <h4 className="text-sm font-medium text-blue-600 mb-4 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Lead Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Full Name:</span>
                        <span className="text-sm text-gray-900">{selectedContact.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">First Name:</span>
                        <span className="text-sm text-gray-900">{selectedContact.first_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Last Name:</span>
                        <span className="text-sm text-gray-900">{selectedContact.last_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Job Title:</span>
                        <span className="text-sm text-gray-900">{selectedContact.job_title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Work Email:</span>
                        <span className="text-sm text-blue-600">{selectedContact.work_email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Country:</span>
                        <span className="text-sm text-gray-900">{selectedContact.lead_country}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">LinkedIn Connections:</span>
                        <span className="text-sm text-gray-900">{selectedContact.connection_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">LinkedIn Followers:</span>
                        <span className="text-sm text-gray-900">{selectedContact.followers_count}</span>
                      </div>
                      <div className="pt-4">
                        <a href="#" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Profile
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Company Information */}
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-4 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Company Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Company Name:</span>
                        <span className="text-sm text-gray-900">{selectedContact.company_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Company Domain:</span>
                        <span className="text-sm text-blue-600">{selectedContact.company_domain}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Company Industry:</span>
                        <span className="text-sm text-gray-900">{selectedContact.company_industry}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Company Staff Range:</span>
                        <span className="text-sm text-gray-900">{selectedContact.company_staff_count_range}</span>
                      </div>
                      <div className="pt-4">
                        <a href="#" className="text-blue-600 hover:text-blue-800 text-sm flex items-center">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          View Company
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Daily Digest Information */}
                  <div>
                    <h4 className="text-sm font-medium text-purple-600 mb-4 flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      Daily Digest Information
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Last Interaction Summary:</span>
                        <span className="text-sm text-gray-900 text-right">{selectedContact.last_interaction_summary}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Last Interaction Platform:</span>
                        <span className="text-sm text-gray-900">{selectedContact.last_interaction_platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Last Interaction Date:</span>
                        <span className="text-sm text-gray-900">
                          {selectedContact.last_interaction_date && new Date(selectedContact.last_interaction_date).toLocaleDateString('en-US', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}, {selectedContact.last_interaction_date && new Date(selectedContact.last_interaction_date).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Talking Point 1:</span>
                        <span className="text-sm text-gray-900 text-right">{selectedContact.talking_point_1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Talking Point 2:</span>
                        <span className="text-sm text-gray-900 text-right">{selectedContact.talking_point_2}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Talking Point 3:</span>
                        <span className="text-sm text-gray-900 text-right">{selectedContact.talking_point_3}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Sent to Client:</span>
                        <span className="text-sm text-gray-900">{selectedContact.sent_to_client}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Sent Date:</span>
                        <span className="text-sm text-gray-900">-</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Added On:</span>
                        <span className="text-sm text-gray-900">
                          {selectedContact.created_at && new Date(selectedContact.created_at).toLocaleDateString('en-US', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}, {selectedContact.created_at && new Date(selectedContact.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                            hour12: false
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;