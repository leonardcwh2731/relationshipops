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
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [valueAddArticles, setValueAddArticles] = useState<ValueAddArticle[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

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
    if (mockClients.length > 0) {
      setSelectedClient(mockClients[0].email_address);
    }

    // Mock data
    setContacts([
      {
        full_name: 'John Smith',
        job_title: 'VP of Engineering',
        company_name: 'Tech Corp',
        last_interaction_date: '2024-01-15',
        total_lead_score: 85
      },
      {
        full_name: 'Sarah Johnson',
        job_title: 'Product Manager',
        company_name: 'StartupXYZ',
        last_interaction_date: '2024-01-10',
        total_lead_score: 72
      }
    ]);

    setValueAddArticles([
      {
        article_headline: 'How AI is Transforming Customer Support',
        article_link: 'https://example.com/article1',
        article_short_summary: 'A comprehensive look at how artificial intelligence is revolutionizing customer support operations.',
        client_full_name: 'Peter Kang',
        created_at: '2024-01-20'
      },
      {
        article_headline: 'The Future of Remote Work Technology',
        article_link: 'https://example.com/article2',
        article_short_summary: 'Exploring the latest tools and technologies enabling effective remote work.',
        client_full_name: 'Leonard Chen',
        created_at: '2024-01-18'
      }
    ]);

    setMeetings([
      {
        meeting_id: 'meeting1',
        client_full_name: 'Peter Kang',
        meeting_summary: 'Product Demo and Q&A Session',
        start_date_time: '2024-01-25T10:00:00Z',
        attendee_emails: 'peter.kang@barrelny.com',
        platform: 'Zoom'
      }
    ]);

    setMessages([
      {
        message_id: 'msg1',
        subject: 'Follow-up on our conversation',
        from_name: 'Peter Kang',
        to_name: 'Sales Team',
        message_date: '2024-01-22T14:30:00Z',
        platform: 'Email',
        client_full_name: 'Peter Kang'
      }
    ]);
  }, []);

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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;