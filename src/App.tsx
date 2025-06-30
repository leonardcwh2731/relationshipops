import React, { useState, useEffect } from 'react';
import { 
  User, 
  FileText, 
  Trophy, 
  Activity, 
  Mail, 
  Calendar, 
  MessageSquare,
  Building,
  Globe,
  ExternalLink,
  Edit,
  Trash2,
  Eye
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

interface ValueAddArticle {
  article_headline: string;
  article_link: string;
  article_short_summary: string;
  client_full_name: string;
  created_at: string;
}

interface Meeting {
  meeting_id: string;
  client_full_name: string;
  meeting_summary: string;
  start_date_time: string;
  attendee_emails: string;
  platform: string;
}

interface Message {
  message_id: string;
  subject: string;
  from_name: string;
  to_name: string;
  message_date: string;
  platform: string;
  client_full_name: string;
}

const App: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedArticleClient, setSelectedArticleClient] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [valueAddArticles, setValueAddArticles] = useState<ValueAddArticle[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Load clients for dropdown
  useEffect(() => {
    const loadClients = async () => {
      try {
        setError('');
        console.log('Loading clients...');
        
        const { data, error } = await supabase
          .from('client_details')
          .select('email_address, full_name, first_name, last_name')
          .order('full_name');

        console.log('Clients response:', { data, error });

        if (error) {
          console.error('Supabase error:', error);
          throw error;
        }
        
        setClients(data || []);
        if (data && data.length > 0) {
          setSelectedClient(data[0].email_address);
          setSelectedArticleClient(data[0].email_address);
        } else {
          // Set mock data if no real data
          const mockClients = [
            { email_address: 'demo@example.com', full_name: 'Demo User', first_name: 'Demo', last_name: 'User' }
          ];
          setClients(mockClients);
          setSelectedClient('demo@example.com');
          setSelectedArticleClient('demo@example.com');
        }
      } catch (error) {
        console.error('Error loading clients:', error);
        setError('Failed to load clients. Using demo data.');
        // Set mock data
        const mockClients = [
          { email_address: 'demo@example.com', full_name: 'Demo User', first_name: 'Demo', last_name: 'User' }
        ];
        setClients(mockClients);
        setSelectedClient('demo@example.com');
        setSelectedArticleClient('demo@example.com');
      }
    };

    loadClients();
  }, []);

  // Load data based on selected client
  useEffect(() => {
    if (!selectedClient) return;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        console.log('Loading data for client:', selectedClient);
        await Promise.all([
          loadContacts(),
          loadValueAddArticles(),
          loadMeetings(),
          loadMessages()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load some data. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure proper loading
    const timer = setTimeout(loadData, 100);
    return () => clearTimeout(timer);
  }, [selectedClient]);

  // Load articles based on selected article client
  useEffect(() => {
    if (!selectedArticleClient) return;
    loadValueAddArticles();
  }, [selectedArticleClient]);

  const loadContacts = async () => {
    try {
      console.log('Loading contacts for:', selectedClient);
      const { data, error } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*')
        .eq('client_email', selectedClient)
        .order('last_interaction_date', { ascending: false });

      if (error) throw error;
      console.log('Contacts loaded:', data?.length || 0);
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setContacts([]);
    }
  };

  const loadValueAddArticles = async () => {
    try {
      console.log('Loading articles for:', selectedArticleClient);
      const { data, error } = await supabase
        .from('potential_value_add')
        .select('*')
        .eq('client_email_address', selectedArticleClient)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Articles loaded:', data?.length || 0);
      setValueAddArticles(data || []);
    } catch (error) {
      console.error('Error loading value add articles:', error);
      setValueAddArticles([]);
    }
  };

  const loadMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('all_valid_calendar_event')
        .select('*')
        .eq('client_email', selectedClient)
        .order('start_date_time', { ascending: false });

      if (error) throw error;
      setMeetings(data || []);
    } catch (error) {
      console.error('Error loading meetings:', error);
      setMeetings([]);
    }
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('all_valid_email_messages')
        .select('*')
        .eq('client_email', selectedClient)
        .order('message_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const handleDeleteArticle = async (articleLink: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;

    try {
      const { error } = await supabase
        .from('potential_value_add')
        .delete()
        .eq('article_link', articleLink);

      if (error) throw error;
      
      // Reload articles
      loadValueAddArticles();
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('Failed to delete article');
    }
  };

  const clientOptions = [
    {
      value: 'all',
      label: 'All Client Emails',
      icon: <User className="w-4 h-4" />
    },
    ...clients.map(client => ({
      value: client.email_address,
      label: client.email_address,
      icon: <Mail className="w-4 h-4" />
    }))
  ];

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">RelationshipOps Dashboard</h1>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      )}

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <User className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Dormant Contacts</p>
                <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Value Add Articles</p>
                <p className="text-2xl font-bold text-gray-900">{valueAddArticles.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Trophy className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Meetings Booked</p>
                <p className="text-2xl font-bold text-gray-900">{meetings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Activity className="w-8 h-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Recent Messages</p>
                <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Dormant Contacts Section */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Dormant Contacts</h2>
              <p className="text-sm text-gray-500">Sorted by lead score (highest first) • Auto-refreshes every 30 seconds</p>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <CustomDropdown
                  value={selectedClient}
                  onChange={setSelectedClient}
                  options={clientOptions}
                  placeholder="Select client"
                  className="w-64"
                />
              </div>

              <div className="space-y-2">
                {clients.map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{client.email_address}</div>
                        <div className="text-sm text-gray-500">{contacts.length} contacts • Leads Above 80: 
                          <span className="inline-flex items-center ml-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {contacts.filter(c => (c.total_lead_score || 0) > 80).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {contacts.length === 0 && (
                <p className="text-center text-gray-500 py-8">No dormant contacts found</p>
              )}
            </div>
          </div>

          {/* Potential Value Add Section */}
          <div className="bg-black rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Potential Value Add</h2>
              <p className="text-sm text-gray-300">Sorted by lead score (highest first) • Auto-refreshes every 30 seconds</p>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <CustomDropdown
                  value={selectedArticleClient}
                  onChange={setSelectedArticleClient}
                  options={clientOptions}
                  placeholder="Select client"
                  className="w-64"
                />
              </div>

              <div className="space-y-2">
                {valueAddArticles.map((article, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-600 rounded-lg hover:bg-gray-800 transition-colors">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="text-gray-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-white">{article.article_headline}</div>
                        <div className="text-sm text-gray-300 mt-1">{article.article_short_summary}</div>
                        <div className="text-xs text-gray-400 mt-2">
                          Source: <a href={article.article_link} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">{article.article_link}</a>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 ml-4">
                      <button 
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        className="p-2 text-gray-400 hover:text-yellow-400 transition-colors"
                        title="Edit Article"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteArticle(article.article_link)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete Article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              {valueAddArticles.length === 0 && (
                <p className="text-center text-gray-400 py-8">No value add articles found</p>
              )}
            </div>
          </div>

          {/* Client Wins */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Trophy className="w-6 h-6 mr-2 text-green-500" />
              Client Wins (Recent Meetings)
            </h2>
            <div className="space-y-4">
              {meetings.slice(0, 5).map((meeting, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{meeting.meeting_summary || 'Meeting'}</h4>
                      <p className="text-sm text-gray-600">
                        <Calendar className="w-4 h-4 inline mr-1" />
                        {formatDate(meeting.start_date_time)}
                      </p>
                      <p className="text-sm text-gray-600">
                        <Building className="w-4 h-4 inline mr-1" />
                        Platform: {meeting.platform || 'N/A'}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Booked
                    </span>
                  </div>
                </div>
              ))}
              {meetings.length === 0 && (
                <p className="text-center text-gray-500 py-8">No meetings found</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Activity className="w-6 h-6 mr-2 text-orange-500" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {messages.slice(0, 5).map((message, index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{message.subject}</h4>
                      <p className="text-sm text-gray-600">
                        From: {message.from_name} → To: {message.to_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        {formatDate(message.message_date)} • {message.platform}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-center text-gray-500 py-8">No recent activity found</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;