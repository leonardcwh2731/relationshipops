import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { CustomDropdown } from './components/CustomDropdown';
import { Contact } from './types/Contact';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  TrendingUp,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Mail,
  Linkedin,
  Building,
  MapPin,
  Star,
  ExternalLink
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [totalContacts, setTotalContacts] = useState(0);
  const [totalMeetings, setTotalMeetings] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [valueAddCount, setValueAddCount] = useState(0);
  const [clientOptions, setClientOptions] = useState<Array<{value: string, label: string}>>([]);

  // Fetch contacts and metrics
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch contacts with client info from Google tokens
      const { data: contactsData, error: contactsError } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select(`
          *,
          onboarding_google_tokens!inner(account_email)
        `)
        .order('created_at', { ascending: false });

      if (contactsError) {
        console.error('Error fetching contacts:', contactsError);
        return;
      }

      // Transform the data to include account_email
      const transformedContacts = contactsData?.map(contact => ({
        ...contact,
        account_email: contact.onboarding_google_tokens?.account_email
      })) || [];

      setContacts(transformedContacts);
      setFilteredContacts(transformedContacts);

      // Get unique client emails for filter dropdown
      const uniqueClients = [...new Set(transformedContacts.map(contact => contact.account_email).filter(Boolean))];
      const clientOpts = uniqueClients.map(email => ({
        value: email,
        label: email
      }));
      setClientOptions(clientOpts);

      // Calculate metrics
      setTotalContacts(transformedContacts.length);

      // Count contacts with value add data
      const valueAddContacts = transformedContacts.filter(contact => 
        contact.potential_value_add_link || contact.potential_value_add_headline
      );
      setValueAddCount(valueAddContacts.length);

      // Fetch meetings count
      const { data: meetingsData, error: meetingsError } = await supabase
        .from('all_valid_calendar_event')
        .select('meeting_id', { count: 'exact' });

      if (!meetingsError && meetingsData) {
        setTotalMeetings(meetingsData.length);
      }

      // Fetch messages count
      const { data: messagesData, error: messagesError } = await supabase
        .from('all_valid_email_messages')
        .select('message_id', { count: 'exact' });

      if (!messagesError && messagesData) {
        setTotalMessages(messagesData.length);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter contacts based on search and client selection
  useEffect(() => {
    let filtered = contacts;

    // Filter by selected client
    if (selectedClient) {
      filtered = filtered.filter(contact => contact.account_email === selectedClient);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(contact =>
        contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.work_email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredContacts(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [contacts, selectedClient, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredContacts.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentContacts = filteredContacts.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusColor = (leadScore: number | undefined) => {
    if (!leadScore) return 'bg-gray-100 text-gray-800';
    if (leadScore >= 80) return 'bg-green-100 text-green-800';
    if (leadScore >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getStatusText = (leadScore: number | undefined) => {
    if (!leadScore) return 'No Score';
    if (leadScore >= 80) return 'High Quality';
    if (leadScore >= 60) return 'Medium Quality';
    return 'Low Quality';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">RelationshipOps Dashboard</h1>
          <p className="mt-2 text-gray-600">Track and manage your business relationships</p>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{totalContacts}</div>
                <div className="text-sm text-gray-600">Total Contacts</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageSquare className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{totalMessages}</div>
                <div className="text-sm text-gray-600">Total Messages</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{totalMeetings}</div>
                <div className="text-sm text-gray-600">Total Meetings</div>
              </div>
            </div>
          </div>

          <div className="bg-black text-white rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold">{valueAddCount}</div>
                <div className="text-sm opacity-80">Value Add Articles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Client Filter */}
              <div className="w-full sm:w-64">
                <CustomDropdown
                  value={selectedClient}
                  onChange={setSelectedClient}
                  options={[
                    { value: '', label: 'All Clients' },
                    ...clientOptions
                  ]}
                  placeholder="Filter by client"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Interaction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {currentContacts.map((contact) => (
                  <tr key={contact.linkedin_profile_url} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim()}
                          </div>
                          <div className="text-sm text-gray-500">{contact.job_title}</div>
                          {contact.work_email && (
                            <div className="text-xs text-gray-400 flex items-center mt-0.5">
                              <Mail className="w-3 h-3 mr-1" />
                              {contact.work_email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{contact.company_name}</div>
                      <div className="text-sm text-gray-500">{contact.company_industry}</div>
                      {contact.company_staff_count_range && (
                        <div className="text-xs text-gray-400">{contact.company_staff_count_range} employees</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(contact.total_lead_score)}`}>
                        {getStatusText(contact.total_lead_score)}
                      </span>
                      {contact.total_lead_score && (
                        <div className="text-xs text-gray-400 mt-1">Score: {contact.total_lead_score}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {contact.last_interaction_date ? (
                        <div>
                          <div>{new Date(contact.last_interaction_date).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-400">{contact.last_interaction_platform}</div>
                        </div>
                      ) : (
                        'No recent interaction'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {contact.linkedin_profile_url && (
                        <a
                          href={contact.linkedin_profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center"
                        >
                          <Linkedin className="w-4 h-4 mr-1" />
                          LinkedIn
                        </a>
                      )}
                      {contact.potential_value_add_link && (
                        <a
                          href={contact.potential_value_add_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800 hover:underline inline-flex items-center"
                          title={contact.potential_value_add_headline}
                        >
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Article
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{' '}
                      <span className="font-medium">{startIndex + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(endIndex, filteredContacts.length)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{filteredContacts.length}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {[...Array(totalPages)].map((_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              currentPage === page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Empty State */}
        {filteredContacts.length === 0 && !loading && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No contacts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || selectedClient
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by connecting your data sources.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;