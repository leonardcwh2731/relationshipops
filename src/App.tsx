import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  TrendingUp, 
  UserCheck, 
  Mail, 
  Search,
  ExternalLink,
  FileText
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { CustomDropdown } from './components/CustomDropdown';
import { Contact } from './types/Contact';

interface DashboardStats {
  totalContacts: number;
  totalMessages: number;
  totalMeetings: number;
  publishedArticles: number;
  topArticle: {
    count: number;
    headline: string;
    link: string;
  };
  leadsReplied: number;
}

interface Client {
  account_email: string;
  account_full_name: string;
  account_first_name: string;
  account_last_name: string;
}

const ITEMS_PER_PAGE = 20;

function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    totalMessages: 0,
    totalMeetings: 0,
    publishedArticles: 0,
    topArticle: {
      count: 0,
      headline: '',
      link: ''
    },
    leadsReplied: 0
  });
  const [loading, setLoading] = useState(true);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalContactsCount, setTotalContactsCount] = useState(0);

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = searchTerm === '' || 
      (contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (contact.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesClient = selectedClient === 'all' || contact.client_email === selectedClient;
    
    return matchesSearch && matchesClient;
  });

  const totalPages = Math.ceil(totalContactsCount / ITEMS_PER_PAGE);

  useEffect(() => {
    loadClients();
    loadStats();
  }, []);

  useEffect(() => {
    loadContacts();
  }, [selectedClient, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClient, searchTerm]);

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('onboarding_google_tokens')
        .select('account_email, account_full_name, account_first_name, account_last_name')
        .order('account_full_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);

      // Get total contacts
      const { count: totalContacts } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*', { count: 'exact', head: true });

      // Get total messages from email_calendar_combined
      const { data: messageData } = await supabase
        .from('email_calendar_combined')
        .select('number_of_messages_email')
        .not('number_of_messages_email', 'is', null);

      const totalMessages = messageData?.reduce((sum, item) => sum + (item.number_of_messages_email || 0), 0) || 0;

      // Get total meetings from email_calendar_combined
      const { data: meetingData } = await supabase
        .from('email_calendar_combined')
        .select('meeting_count_calendar')
        .not('meeting_count_calendar', 'is', null);

      const totalMeetings = meetingData?.reduce((sum, item) => sum + (item.meeting_count_calendar || 0), 0) || 0;

      // Get published articles count (articles that have been used as potential value adds)
      const { data: usedArticles } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('potential_value_add_link')
        .not('potential_value_add_link', 'is', null)
        .not('potential_value_add_link', 'eq', '');

      const uniqueUsedArticles = new Set(usedArticles?.map(item => item.potential_value_add_link) || []);
      const publishedArticles = uniqueUsedArticles.size;

      // Get top article used (most frequently used article)
      const articleUsage: { [key: string]: { count: number; headline: string } } = {};
      
      const { data: articleUsageData } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('potential_value_add_link, potential_value_add_headline')
        .not('potential_value_add_link', 'is', null)
        .not('potential_value_add_link', 'eq', '');

      articleUsageData?.forEach(item => {
        if (item.potential_value_add_link) {
          if (articleUsage[item.potential_value_add_link]) {
            articleUsage[item.potential_value_add_link].count++;
          } else {
            articleUsage[item.potential_value_add_link] = {
              count: 1,
              headline: item.potential_value_add_headline || 'Untitled Article'
            };
          }
        }
      });

      let topArticle = { count: 0, headline: '', link: '' };
      for (const [link, data] of Object.entries(articleUsage)) {
        if (data.count > topArticle.count) {
          topArticle = {
            count: data.count,
            headline: data.headline,
            link: link
          };
        }
      }

      // Get leads replied count
      const { count: leadsReplied } = await supabase
        .from('follow_up_conversations_leads_replied')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalContacts: totalContacts || 0,
        totalMessages,
        totalMeetings,
        publishedArticles,
        topArticle,
        leadsReplied: leadsReplied || 0
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      setContactsLoading(true);

      let query = supabase
        .from('icp_contacts_tracking_in_progress')
        .select(`
          *
        `)
        .order('created_at', { ascending: false });

      if (selectedClient !== 'all') {
        query = query.eq('client_email', selectedClient);
      }

      // Get total count for pagination
      const { count } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*', { count: 'exact', head: true });

      setTotalContactsCount(count || 0);

      // Get paginated results
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE - 1;

      const { data, error } = await query.range(startIndex, endIndex);

      if (error) throw error;

      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getScoreColor = (score: number | undefined) => {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (sentToClient: string | undefined) => {
    if (!sentToClient || sentToClient.toLowerCase() === 'no') {
      return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Not Sent</span>;
    }
    return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Sent</span>;
  };

  const clientOptions = [
    { value: 'all', label: 'All Clients', icon: <Users className="w-4 h-4" /> },
    ...clients.map(client => ({
      value: client.account_email,
      label: `${client.account_full_name || 'Unknown'} (${client.account_email})`,
      icon: <Mail className="w-4 h-4" />
    }))
  ];

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 text-sm font-medium rounded-lg ${
            currentPage === i
              ? 'bg-blue-500 text-white'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalContactsCount)} of {totalContactsCount} contacts
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          {pages}
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">RelationshipOps Dashboard</h1>
              <p className="text-gray-600 mt-1">Track and manage your relationship-building activities</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total Contacts */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Contacts</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {loading ? <span className="animate-pulse">---</span> : stats.totalContacts.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Total Messages */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <MessageSquare className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Messages</h3>
                <p className="text-3xl font-bold text-green-600">
                  {loading ? <span className="animate-pulse">---</span> : stats.totalMessages.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Total Meetings */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Total Meetings</h3>
                <p className="text-3xl font-bold text-purple-600">
                  {loading ? <span className="animate-pulse">---</span> : stats.totalMeetings.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Published Articles */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-orange-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Published Articles</h3>
                <p className="text-3xl font-bold text-orange-600">
                  {loading ? <span className="animate-pulse">---</span> : stats.publishedArticles.toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">Used as value adds</p>
              </div>
            </div>
          </div>

          {/* Top Article Used */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-indigo-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Top Article Used</h3>
                <p className="text-3xl font-bold text-indigo-600">
                  {loading ? <span className="animate-pulse">---</span> : `${stats.topArticle.count}x`}
                </p>
                {stats.topArticle.headline && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-700 mb-1 line-clamp-2">{stats.topArticle.headline}</p>
                    {stats.topArticle.link && (
                      <a
                        href={stats.topArticle.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Article
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Leads Replied */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCheck className="h-8 w-8 text-teal-500" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Leads Replied</h3>
                <p className="text-3xl font-bold text-teal-600">
                  {loading ? <span className="animate-pulse">---</span> : stats.leadsReplied.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Contacts
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name, company, or job title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="w-full sm:w-64">
              <label htmlFor="client" className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Client
              </label>
              <CustomDropdown
                value={selectedClient}
                onChange={setSelectedClient}
                options={clientOptions}
                placeholder="Select a client"
              />
            </div>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">ICP Contacts</h2>
            <p className="text-gray-600 text-sm">
              Showing {filteredContacts.length} of {totalContactsCount} contacts
              {selectedClient !== 'all' && ` for selected client`}
            </p>
          </div>

          {contactsLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading contacts...</p>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No contacts available for the selected filters.'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Score</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Interaction</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredContacts.map((contact, index) => (
                      <tr key={contact.linkedin_profile_url || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {contact.full_name || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500">{contact.job_title || 'N/A'}</div>
                            {contact.work_email && (
                              <div className="text-xs text-gray-400">{contact.work_email}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{contact.company_name || 'Unknown'}</div>
                          {contact.company_domain && (
                            <div className="text-xs text-gray-500">{contact.company_domain}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${getScoreColor(contact.total_lead_score)}`}>
                            {contact.total_lead_score || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(contact.sent_to_client)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(contact.last_interaction_date)}
                          </div>
                          {contact.last_interaction_platform && (
                            <div className="text-xs text-gray-500">{contact.last_interaction_platform}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {contact.client_full_name || 'Unknown'}
                          </div>
                          {contact.client_email && (
                            <div className="text-xs text-gray-500">{contact.client_email}</div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {renderPagination()}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;