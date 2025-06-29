import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Mail, 
  TrendingUp, 
  Search, 
  Filter,
  User,
  Building,
  MapPin,
  Briefcase,
  Star,
  MessageCircle,
  Clock,
  ExternalLink,
  Globe,
  ChevronDown
} from 'lucide-react';
import { supabase } from './lib/supabase';
import { Contact } from './types/Contact';
import { CustomDropdown } from './components/CustomDropdown';

interface PotentialValueMetrics {
  drafted: number;
  total: number;
}

function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const [potentialValueMetrics, setPotentialValueMetrics] = useState<PotentialValueMetrics>({
    drafted: 0,
    total: 0
  });
  
  const contactsPerPage = 20;

  // Get unique client options for the dropdown
  const clientOptions = React.useMemo(() => {
    const uniqueClients = Array.from(
      new Set(contacts.map(contact => contact.client_email).filter(Boolean))
    ).map(email => {
      const contact = contacts.find(c => c.client_email === email);
      return {
        value: email!,
        label: `${contact?.client_full_name || 'Unknown'} (${email})`,
        icon: <User className="w-4 h-4" />
      };
    });
    
    return [
      { value: '', label: 'All Clients', icon: <Users className="w-4 h-4" /> },
      ...uniqueClients.sort((a, b) => a.label.localeCompare(b.label))
    ];
  }, [contacts]);

  // Fetch potential value add metrics
  const fetchPotentialValueMetrics = async () => {
    try {
      // Get count of unique articles for total
      const { data: uniqueArticles, error: articlesError } = await supabase
        .from('potential_value_add')
        .select('article_headline')
        .not('article_headline', 'is', null);

      if (articlesError) {
        console.error('Error fetching potential value add articles:', articlesError);
        return;
      }

      // Count unique headlines
      const uniqueHeadlines = new Set(uniqueArticles?.map(item => item.article_headline) || []);
      const totalCount = uniqueHeadlines.size;

      // Set metrics for only drafted and total
      setPotentialValueMetrics({
        drafted: 0,  // Set based on your business logic
        total: totalCount
      });
    } catch (error) {
      console.error('Error calculating potential value metrics:', error);
    }
  };

  // Fetch contacts with pagination
  const fetchContacts = async (page: number = 1, client: string = '', search: string = '') => {
    try {
      setLoading(true);
      
      // Build the query
      let query = supabase
        .from('icp_contacts_tracking_in_progress')
        .select(`
          *,
          onboarding_google_tokens!left(account_email)
        `, { count: 'exact' });

      // Apply client filter
      if (client) {
        query = query.eq('client_email', client);
      }

      // Apply search filter
      if (search) {
        query = query.or(`
          full_name.ilike.%${search}%,
          company_name.ilike.%${search}%,
          job_title.ilike.%${search}%,
          work_email.ilike.%${search}%
        `);
      }

      // Apply pagination and ordering
      const from = (page - 1) * contactsPerPage;
      const to = from + contactsPerPage - 1;
      
      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching contacts:', error);
        return;
      }

      // Process the data to flatten the joined data
      const processedContacts = data?.map(contact => ({
        ...contact,
        account_email: contact.onboarding_google_tokens?.[0]?.account_email || null
      })) || [];

      setContacts(page === 1 ? processedContacts : [...contacts, ...processedContacts]);
      setTotalContacts(count || 0);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    setCurrentPage(1);
    setContacts([]);
    fetchContacts(1, selectedClient, searchTerm);
  }, [selectedClient, searchTerm]);

  // Initial load
  useEffect(() => {
    fetchContacts();
    fetchPotentialValueMetrics();
  }, []);

  // Load more contacts
  const loadMore = () => {
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    fetchContacts(nextPage, selectedClient, searchTerm);
  };

  const hasMore = contacts.length < totalContacts;

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  const getLeadScoreColor = (score: number | undefined) => {
    if (!score) return 'text-gray-400';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLeadScoreBadge = (score: number | undefined) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">RelationshipOps Dashboard</h1>
            <p className="mt-2 text-gray-600">Track and manage your business relationships</p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Contacts */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Contacts</p>
                <p className="text-2xl font-semibold text-gray-900">{totalContacts.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Meetings This Month */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Meetings This Month</p>
                <p className="text-2xl font-semibold text-gray-900">42</p>
              </div>
            </div>
          </div>

          {/* Email Responses */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Mail className="h-8 w-8 text-purple-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Email Responses</p>
                <p className="text-2xl font-semibold text-gray-900">156</p>
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-black" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                <p className="text-2xl font-semibold text-gray-900">12.4%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Potential Value Add Section - Updated to 2 columns */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Potential Value Add</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{potentialValueMetrics.drafted}</div>
                <div className="text-sm text-gray-600">Drafted</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-2">{potentialValueMetrics.total}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
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
            <CustomDropdown
              value={selectedClient}
              onChange={setSelectedClient}
              options={clientOptions}
              placeholder="Select client..."
              className="w-full"
            />

            {/* Filter Button */}
            <button className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Filter className="h-5 w-5 mr-2" />
              More Filters
            </button>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Contacts ({totalContacts.toLocaleString()})</h2>
          </div>

          {loading && contacts.length === 0 ? (
            <div className="p-8 text-center">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          ) : (
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
                      Lead Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Interaction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.map((contact, index) => (
                    <tr key={contact.linkedin_profile_url || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-6 w-6 text-gray-500" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {contact.full_name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {contact.job_title || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {contact.work_email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{contact.company_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{contact.company_domain || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLeadScoreBadge(contact.total_lead_score)}`}>
                          {contact.total_lead_score || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>{formatDate(contact.last_interaction_date)}</div>
                        <div className="text-xs text-gray-400">{contact.last_interaction_platform || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>{contact.client_full_name || 'N/A'}</div>
                        <div className="text-xs text-gray-400">{contact.client_email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
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
                          {contact.work_email && (
                            <a
                              href={`mailto:${contact.work_email}`}
                              className="text-green-600 hover:text-green-800"
                              title="Send Email"
                            >
                              <Mail className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Load More Button */}
              {hasMore && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Loading...
                      </div>
                    ) : (
                      'Load More'
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;