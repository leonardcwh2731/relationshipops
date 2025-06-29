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
  ExternalLink
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
  const [loading, setLoading] = useState(true);
  
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
        const { data, error } = await supabase
          .from('client_details')
          .select('email_address, full_name, first_name, last_name')
          .order('full_name');

        if (error) throw error;
        setClients(data || []);
        if (data && data.length > 0) {
          setSelectedClient(data[0].email_address);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
      }
    };

    loadClients();
  }, []);

  // Load data based on selected client
  useEffect(() => {
    if (!selectedClient) return;

    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadContacts(),
          loadValueAddArticles(),
          loadMeetings(),
          loadMessages()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedClient]);

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*')
        .eq('client_email', selectedClient)
        .order('last_interaction_date', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    }
  };

  const loadValueAddArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('potential_value_add')
        .select('*')
        .eq('client_email_address', selectedClient)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setValueAddArticles(data || []);
    } catch (error) {
      console.error('Error loading value add articles:', error);
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
    }
  };

  const clientOptions = clients.map(client => ({
    value: client.email_address,
    label: `${client.full_name} (${client.email_address})`,
    icon: <Mail className="w-4 h-4" />
  }));

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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
            <div className="w-64">
              <CustomDropdown
                value={selectedClient}
                onChange={setSelectedClient}
                options={clientOptions}
                placeholder="Select a client"
              />
            </div>
          </div>
        </div>
      </div>

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
          {/* Dormant Contacts */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <User className="w-6 h-6 mr-2 text-blue-500" />
              Dormant Contacts
            </h2>
            <div className="space-y-4">
              {contacts.slice(0, 5).map((contact, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{contact.full_name}</h4>
                      <p className="text-sm text-gray-600">{contact.job_title} at {contact.company_name}</p>
                      <p className="text-xs text-gray-500 mt-1">Last interaction: {formatDate(contact.last_interaction_date || '')}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Score: {contact.total_lead_score || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {contacts.length === 0 && (
                <p className="text-center text-gray-500 py-8">No dormant contacts found</p>
              )}
            </div>
          </div>

          {/* Value Add Articles */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="w-6 h-6 mr-2 text-purple-500" />
              Potential Value Add Articles
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {valueAddArticles.slice(0, 6).map((article, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">{article.article_headline}</h4>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-3">{article.article_short_summary}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{formatDate(article.created_at)}</span>
                    <a
                      href={article.article_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Read
                    </a>
                  </div>
                </div>
              ))}
              {valueAddArticles.length === 0 && (
                <div className="col-span-full text-center text-gray-500 py-8">
                  No value add articles found
                </div>
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