import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, Search, Edit, Save, X, ExternalLink, Trash2, User, Mail } from 'lucide-react';
import { Contact } from './types/Contact';
import { supabase } from './lib/supabase';
import { CustomDropdown } from './components/CustomDropdown';

interface ContactGroup {
  accountEmail: string;
  contacts: Contact[];
  leadsAbove80: number;
}

interface EditingState {
  contactId: string | null;
  field: string | null;
  value: string;
}

interface Article {
  article_link: string;
  client_full_name?: string;
  client_first_name?: string;
  client_last_name?: string;
  client_email_address?: string;
  parent_site?: string;
  article_type?: string;
  article_headline?: string;
  article_overview?: string;
  article_background_story?: string;
  article_problems_solved?: string;
  article_short_summary?: string;
  article_combined_headline?: string;
  created_at?: string;
}

interface ArticleGroup {
  clientEmail: string;
  articles: Article[];
}

function App() {
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [articleGroups, setArticleGroups] = useState<ArticleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountEmail, setSelectedAccountEmail] = useState('');
  const [selectedArticleClientEmail, setSelectedArticleClientEmail] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());
  const [expandedArticleGroups, setExpandedArticleGroups] = useState<Set<string>>(new Set());
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<EditingState>({ contactId: null, field: null, value: '' });
  const [editingArticle, setEditingArticle] = useState<EditingState>({ contactId: null, field: null, value: '' });
  const [totalMetrics, setTotalMetrics] = useState({
    totalContacts: 0,
    accountGroups: 0,
    leadsAbove80: 0,
    readyContacts: 0
  });
  const [articleMetrics, setArticleMetrics] = useState({
    totalArticles: 0,
    clientGroups: 0
  });

  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTotalContactCount = async () => {
    try {
      console.log('🔢 Fetching total contact count...');

      const { count, error } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Error fetching contact count:', error);
        return 0;
      }

      console.log('✅ Total contacts found:', count);
      return count || 0;
    } catch (err) {
      console.error('💥 Error in fetchTotalContactCount:', err);
      return 0;
    }
  };

  const fetchAllContactsPaginated = async () => {
    try {
      console.log('🔄 Fetching all contacts with pagination...');

      const pageSize = 1000; // Supabase default limit
      let allContacts: any[] = [];
      let currentPage = 0;
      let hasMoreData = true;

      while (hasMoreData) {
        const startRange = currentPage * pageSize;
        const endRange = startRange + pageSize - 1;

        console.log(`📄 Fetching page ${currentPage + 1} (records ${startRange}-${endRange})`);

        const { data: contacts, error } = await supabase
          .from('icp_contacts_tracking_in_progress')
          .select('*')
          .order('total_lead_score', { ascending: false })
          .range(startRange, endRange);

        if (error) {
          console.error('❌ Error fetching contacts page:', error);
          throw error;
        }

        if (contacts && contacts.length > 0) {
          allContacts = [...allContacts, ...contacts];
          console.log(`✅ Fetched ${contacts.length} contacts (total so far: ${allContacts.length})`);
          
          // If we got fewer records than the page size, we've reached the end
          if (contacts.length < pageSize) {
            hasMoreData = false;
          } else {
            currentPage++;
          }
        } else {
          hasMoreData = false;
        }
      }

      console.log(`🎉 Completed pagination. Total contacts fetched: ${allContacts.length}`);
      return allContacts;
    } catch (err) {
      console.error('💥 Error in fetchAllContactsPaginated:', err);
      return [];
    }
  };

  const fetchArticles = async () => {
    try {
      console.log('🔄 Fetching articles...');

      const { data: articles, error } = await supabase
        .from('potential_value_add')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching articles:', error);
        return [];
      }

      console.log(`✅ Fetched ${articles?.length || 0} articles`);
      return articles || [];
    } catch (err) {
      console.error('💥 Error in fetchArticles:', err);
      return [];
    }
  };

  const fetchContacts = async () => {
    try {
      console.log('🔄 Fetching contacts with pagination...');

      // Try to fetch all contacts using pagination
      const allContacts = await fetchAllContactsPaginated();

      if (allContacts && allContacts.length > 0) {
        // Add simulated account_email based on client_email or client_email_id
        const contactsWithAccountEmail = allContacts.map(contact => ({
          ...contact,
          account_email: contact.client_email || contact.client_email_id || 'unknown@domain.com'
        }));
        
        console.log(`✅ Processing ${contactsWithAccountEmail.length} contacts`);
        processContactData(contactsWithAccountEmail);
      } else {
        // Fallback to demo data if no real data is available
        console.log('⚠️ No real data found, using demo data');
        const demoContacts = generateDemoData();
        const totalCount = await fetchTotalContactCount();
        processContactData(demoContacts, totalCount);
      }

      // Fetch articles
      const articles = await fetchArticles();
      processArticleData(articles);
    } catch (err) {
      console.error('💥 Error in fetchContacts:', err);
      // Fallback to demo data
      const demoContacts = generateDemoData();
      const totalCount = await fetchTotalContactCount();
      processContactData(demoContacts, totalCount);
      
      // Try to fetch articles even if contacts failed
      const articles = await fetchArticles();
      processArticleData(articles);
    } finally {
      setLoading(false);
      setLastUpdated(new Date().toLocaleTimeString());
    }
  };

  const processArticleData = (articles: Article[]) => {
    console.log(`📊 Processing ${articles.length} articles for grouping`);
    
    // Group articles by client email
    const groups: { [key: string]: Article[] } = {};
    
    articles.forEach(article => {
      const clientEmail = article.client_email_address || 'unknown@domain.com';
      if (!groups[clientEmail]) {
        groups[clientEmail] = [];
      }
      groups[clientEmail].push(article);
    });

    // Create article groups
    const articleGroups: ArticleGroup[] = Object.entries(groups).map(([clientEmail, articles]) => ({
      clientEmail,
      articles: articles.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    }));

    // Sort groups by number of articles
    articleGroups.sort((a, b) => b.articles.length - a.articles.length);

    console.log(`📈 Created ${articleGroups.length} article groups`);
    articleGroups.forEach(group => {
      console.log(`  📧 ${group.clientEmail}: ${group.articles.length} articles`);
    });

    setArticleGroups(articleGroups);

    // Calculate article metrics
    setArticleMetrics({
      totalArticles: articles.length,
      clientGroups: articleGroups.length
    });

    console.log(`✅ Article metrics calculated:`, {
      totalArticles: articles.length,
      clientGroups: articleGroups.length
    });
  };

  const generateDemoData = (): any[] => {
    return [
      {
        id: '1',
        full_name: 'Raghuram R Menon',
        first_name: 'Raghuram',
        last_name: 'R Menon',
        job_title: 'Customer Success Manager',
        company_name: 'Smartlead',
        company_domain: 'smartlead.ai',
        company_linkedin_url: 'https://linkedin.com/company/smartlead',
        company_industry: 'Computer Software',
        company_staff_count_range: '11 - 50',
        work_email: 'raghuram@smartlead.ai',
        total_lead_score: 70,
        lead_score: 70,
        sent_to_client: 'No',
        last_interaction_date: '2025-05-06T10:01:00Z',
        last_interaction_platform: 'Email',
        last_interaction_summary: 'Addressed API needs for campaigns',
        talking_point_1: "Mention Smartlead's unique cold email features driving client success",
        talking_point_2: 'Discuss recent awards from Clay partnership and customer benefits',
        talking_point_3: "Check feedback on Smartlead.ai's features enhancing email efficiency",
        linkedin_profile_url: 'https://linkedin.com/in/raghuram-menon',
        connection_count: 0,
        followers_count: 0,
        lead_country: 'India',
        account_email: 'leonard@ontenlabs.com'
      },
      {
        id: '2',
        full_name: 'Sarah Johnson',
        first_name: 'Sarah',
        last_name: 'Johnson',
        job_title: 'VP of Sales',
        company_name: 'TechCorp',
        company_domain: 'techcorp.com',
        company_linkedin_url: 'https://linkedin.com/company/techcorp',
        company_industry: 'Technology',
        company_staff_count_range: '51 - 200',
        work_email: 'sarah@techcorp.com',
        total_lead_score: 95,
        lead_score: 95,
        sent_to_client: 'Yes',
        last_interaction_date: '2025-01-15T14:30:00Z',
        last_interaction_platform: 'LinkedIn',
        last_interaction_summary: 'Discussed integration possibilities',
        talking_point_1: 'Focus on ROI improvements',
        talking_point_2: 'Mention case studies from similar companies',
        talking_point_3: 'Discuss implementation timeline',
        linkedin_profile_url: 'https://linkedin.com/in/sarah-johnson',
        connection_count: 500,
        followers_count: 1200,
        lead_country: 'United States',
        account_email: 'peter.kang@barrelny.com'
      },
      {
        id: '3',
        full_name: 'Michael Chen',
        first_name: 'Michael',
        last_name: 'Chen',
        job_title: 'Director of Marketing',
        company_name: 'GrowthLabs',
        company_domain: 'growthlabs.com',
        company_linkedin_url: 'https://linkedin.com/company/growthlabs',
        company_industry: 'Marketing',
        company_staff_count_range: '11 - 50',
        work_email: 'michael@growthlabs.com',
        total_lead_score: 88,
        lead_score: 88,
        sent_to_client: 'Yes',
        last_interaction_date: '2025-01-14T09:15:00Z',
        last_interaction_platform: 'Email',
        last_interaction_summary: 'Requested demo for team',
        talking_point_1: 'Highlight automation features',
        talking_point_2: 'Share success metrics',
        talking_point_3: 'Discuss team training options',
        linkedin_profile_url: 'https://linkedin.com/in/michael-chen',
        connection_count: 750,
        followers_count: 890,
        lead_country: 'Canada',
        account_email: 'peter.kang@barrelny.com'
      }
    ];
  };

  const processContactData = (contacts: any[], totalContactCount: number = 0) => {
    console.log(`📊 Processing ${contacts.length} contacts for grouping`);
    
    // Group contacts by account_email
    const groups: { [key: string]: Contact[] } = {};
    
    contacts.forEach(contact => {
      const accountEmail = contact.account_email || contact.client_email || contact.client_email_id || 'unknown@domain.com';
      if (!groups[accountEmail]) {
        groups[accountEmail] = [];
      }
      groups[accountEmail].push(contact);
    });

    // Create contact groups with metrics
    const contactGroups: ContactGroup[] = Object.entries(groups).map(([accountEmail, contacts]) => ({
      accountEmail,
      contacts: contacts.sort((a, b) => (b.total_lead_score || b.lead_score || 0) - (a.total_lead_score || a.lead_score || 0)),
      leadsAbove80: contacts.filter(c => (c.total_lead_score || c.lead_score || 0) >= 80).length
    }));

    // Sort groups by total lead score of their best contact
    contactGroups.sort((a, b) => {
      const aMaxScore = Math.max(...a.contacts.map(c => c.total_lead_score || c.lead_score || 0));
      const bMaxScore = Math.max(...b.contacts.map(c => c.total_lead_score || c.lead_score || 0));
      return bMaxScore - aMaxScore;
    });

    console.log(`📈 Created ${contactGroups.length} account groups`);
    contactGroups.forEach(group => {
      console.log(`  📧 ${group.accountEmail}: ${group.contacts.length} contacts, ${group.leadsAbove80} leads above 80`);
    });

    setContactGroups(contactGroups);

    // Calculate metrics using actual contact data
    const allContacts = contacts;
    const actualTotalCount = totalContactCount > 0 ? totalContactCount : allContacts.length;
    
    setTotalMetrics({
      totalContacts: actualTotalCount,
      accountGroups: contactGroups.length,
      leadsAbove80: allContacts.filter(c => (c.total_lead_score || c.lead_score || 0) >= 80).length,
      readyContacts: allContacts.filter(c => ['Yes', 'yes'].includes(c.sent_to_client || '')).length
    });

    console.log(`✅ Metrics calculated:`, {
      totalContacts: actualTotalCount,
      accountGroups: contactGroups.length,
      leadsAbove80: allContacts.filter(c => (c.total_lead_score || c.lead_score || 0) >= 80).length,
      readyContacts: allContacts.filter(c => ['Yes', 'yes'].includes(c.sent_to_client || '')).length
    });
  };

  const handleManualRefresh = () => {
    setLoading(true);
    fetchContacts();
  };

  const toggleGroupExpansion = (accountEmail: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(accountEmail)) {
      newExpanded.delete(accountEmail);
    } else {
      newExpanded.add(accountEmail);
    }
    setExpandedGroups(newExpanded);
  };

  const toggleContactExpansion = (contactId: string) => {
    const newExpanded = new Set(expandedContacts);
    if (newExpanded.has(contactId)) {
      newExpanded.delete(contactId);
    } else {
      newExpanded.add(contactId);
    }
    setExpandedContacts(newExpanded);
  };

  const toggleArticleGroupExpansion = (clientEmail: string) => {
    const newExpanded = new Set(expandedArticleGroups);
    if (newExpanded.has(clientEmail)) {
      newExpanded.delete(clientEmail);
    } else {
      newExpanded.add(clientEmail);
    }
    setExpandedArticleGroups(newExpanded);
  };

  const toggleArticleExpansion = (articleId: string) => {
    const newExpanded = new Set(expandedArticles);
    if (newExpanded.has(articleId)) {
      newExpanded.delete(articleId);
    } else {
      newExpanded.add(articleId);
    }
    setExpandedArticles(newExpanded);
  };

  const startEditing = (contactId: string, field: string, currentValue: string) => {
    setEditing({ contactId, field, value: currentValue || '' });
  };

  const startEditingArticle = (articleId: string, field: string, currentValue: string) => {
    setEditingArticle({ contactId: articleId, field, value: currentValue || '' });
  };

  const saveEdit = async () => {
    if (!editing.contactId || !editing.field) return;

    try {
      console.log('💾 Saving edit:', editing);
      
      // Update Supabase
      const { error } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .update({ [editing.field]: editing.value })
        .eq('linkedin_profile_url', editing.contactId);

      if (error) {
        console.error('❌ Error updating contact:', error);
        return;
      }

      // Update local state optimistically
      setContactGroups(prevGroups => 
        prevGroups.map(group => ({
          ...group,
          contacts: group.contacts.map(contact => 
            (contact.linkedin_profile_url === editing.contactId || contact.id === editing.contactId)
              ? { ...contact, [editing.field!]: editing.value }
              : contact
          )
        }))
      );

      setEditing({ contactId: null, field: null, value: '' });
      console.log('✅ Contact updated successfully');
    } catch (error) {
      console.error('❌ Error saving edit:', error);
    }
  };

  const saveArticleEdit = async () => {
    if (!editingArticle.contactId || !editingArticle.field) return;

    try {
      console.log('💾 Saving article edit:', editingArticle);
      
      // Update Supabase
      const { error } = await supabase
        .from('potential_value_add')
        .update({ [editingArticle.field]: editingArticle.value })
        .eq('article_link', editingArticle.contactId);

      if (error) {
        console.error('❌ Error updating article:', error);
        return;
      }

      // Update local state optimistically
      setArticleGroups(prevGroups => 
        prevGroups.map(group => ({
          ...group,
          articles: group.articles.map(article => 
            article.article_link === editingArticle.contactId
              ? { ...article, [editingArticle.field!]: editingArticle.value }
              : article
          )
        }))
      );

      setEditingArticle({ contactId: null, field: null, value: '' });
      console.log('✅ Article updated successfully');
    } catch (error) {
      console.error('❌ Error saving article edit:', error);
    }
  };

  const cancelEdit = () => {
    setEditing({ contactId: null, field: null, value: '' });
  };

  const cancelArticleEdit = () => {
    setEditingArticle({ contactId: null, field: null, value: '' });
  };

  const deleteArticle = async (articleLink: string) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      console.log('🗑️ Deleting article:', articleLink);
      
      const { error } = await supabase
        .from('potential_value_add')
        .delete()
        .eq('article_link', articleLink);

      if (error) {
        console.error('❌ Error deleting article:', error);
        return;
      }

      // Update local state
      setArticleGroups(prevGroups => 
        prevGroups.map(group => ({
          ...group,
          articles: group.articles.filter(article => article.article_link !== articleLink)
        })).filter(group => group.articles.length > 0)
      );

      console.log('✅ Article deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting article:', error);
    }
  };

  const filteredGroups = contactGroups.filter(group => {
    if (selectedAccountEmail && group.accountEmail !== selectedAccountEmail) {
      return false;
    }
    if (searchTerm) {
      return group.contacts.some(contact => 
        contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.job_title?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return true;
  });

  const filteredArticleGroups = articleGroups.filter(group => {
    if (selectedArticleClientEmail && group.clientEmail !== selectedArticleClientEmail) {
      return false;
    }
    return true;
  });

  const uniqueAccountEmails = contactGroups.map(group => group.accountEmail);
  const uniqueArticleClientEmails = articleGroups.map(group => group.clientEmail);

  // Create dropdown options for account emails
  const accountEmailOptions = [
    { value: '', label: 'All Account Emails', icon: <User className="w-4 h-4" /> },
    ...uniqueAccountEmails.map(email => ({
      value: email,
      label: email,
      icon: <Mail className="w-4 h-4" />
    }))
  ];

  // Create dropdown options for article client emails
  const articleClientEmailOptions = [
    { value: '', label: 'All Client Emails', icon: <User className="w-4 h-4" /> },
    ...uniqueArticleClientEmails.map(email => ({
      value: email,
      label: email,
      icon: <Mail className="w-4 h-4" />
    }))
  ];

  useEffect(() => {
    fetchContacts();

    // Set up auto-refresh every 30 seconds
    refreshIntervalRef.current = setInterval(fetchContacts, 30000);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatFieldValue = (value: string | number | undefined) => {
    if (value === null || value === undefined || value === '') return '-';
    return value.toString();
  };

  if (loading && contactGroups.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contacts...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching all records with pagination...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">RelationshipOps Dashboard</h1>
            <p className="text-gray-600 mt-1">Powered By VeraOps</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">Last updated: {lastUpdated}</span>
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Dormant Contacts Header */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Dormant Contacts</h2>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-black text-white rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold">{totalMetrics.accountGroups}</div>
            </div>
            <div className="text-sm opacity-80 mt-1">Account Groups</div>
          </div>
          <div className="bg-black text-white rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold">{totalMetrics.totalContacts.toLocaleString()}</div>
            </div>
            <div className="text-sm opacity-80 mt-1">Total Contacts</div>
          </div>
          <div className="bg-black text-white rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold">{totalMetrics.leadsAbove80}</div>
            </div>
            <div className="text-sm opacity-80 mt-1">Leads Above 80</div>
          </div>
          <div className="bg-black text-white rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold">{totalMetrics.readyContacts}</div>
            </div>
            <div className="text-sm opacity-80 mt-1">Ready Contacts</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <CustomDropdown
            value={selectedAccountEmail}
            onChange={setSelectedAccountEmail}
            options={accountEmailOptions}
            placeholder="All Account Emails"
            className="min-w-[280px]"
          />
        </div>

        {/* Contact Groups */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Contacts by Account Email</h2>
            <p className="text-sm text-gray-500">Sorted by lead score (highest first) • Auto-refreshes every 30 seconds</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredGroups.map((group) => (
              <div key={group.accountEmail}>
                {/* Group Header */}
                <div
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleGroupExpansion(group.accountEmail)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {expandedGroups.has(group.accountEmail) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400 mr-2" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 mr-2" />
                      )}
                      <div className="flex items-center">
                        <span className="text-lg font-medium text-gray-900">{group.accountEmail}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          {group.contacts.length} contacts • Leads Above 80: 
                          <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            {group.leadsAbove80}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group Content */}
                {expandedGroups.has(group.accountEmail) && (
                  <div className="px-6 pb-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <th className="pb-3 pr-8">Contact</th>
                            <th className="pb-3 pr-8">Job Title</th>
                            <th className="pb-3 pr-8">Company</th>
                            <th className="pb-3 pr-8">Score</th>
                            <th className="pb-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {group.contacts.map((contact) => (
                            <React.Fragment key={contact.linkedin_profile_url || contact.id}>
                              {/* Contact Summary Row */}
                              <tr className="hover:bg-gray-50">
                                <td className="py-3 pr-8">
                                  <div className="text-sm font-medium text-gray-900">
                                    {contact.full_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown'}
                                  </div>
                                  {contact.work_email && (
                                    <div className="text-sm text-gray-500">
                                      <a 
                                        href={`mailto:${contact.work_email}`}
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        {contact.work_email}
                                      </a>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 pr-8 text-sm text-gray-900">{formatFieldValue(contact.job_title)}</td>
                                <td className="py-3 pr-8">
                                  <div className="text-sm text-gray-900">{formatFieldValue(contact.company_name)}</div>
                                  {contact.company_domain && (
                                    <div className="text-sm text-gray-500">
                                      <a 
                                        href={`https://${contact.company_domain}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        {contact.company_domain}
                                      </a>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 pr-8">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(contact.total_lead_score || contact.lead_score || 0)}`}>
                                    {contact.total_lead_score || contact.lead_score || 0}
                                  </span>
                                </td>
                                <td className="py-3">
                                  <button
                                    onClick={() => toggleContactExpansion(contact.linkedin_profile_url || contact.id || '')}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    {expandedContacts.has(contact.linkedin_profile_url || contact.id || '') ? 'Hide Details' : 'View Details'}
                                  </button>
                                </td>
                              </tr>

                              {/* Contact Details Row */}
                              {expandedContacts.has(contact.linkedin_profile_url || contact.id || '') && (
                                <tr>
                                  <td colSpan={5} className="py-6 bg-gray-50">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                      {/* Lead Information */}
                                      <div className="bg-white p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-4">
                                          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                            Lead Information
                                          </h4>
                                        </div>
                                        <div className="space-y-3">
                                          {[
                                            { label: 'Full Name', field: 'full_name', value: contact.full_name },
                                            { label: 'First Name', field: 'first_name', value: contact.first_name },
                                            { label: 'Last Name', field: 'last_name', value: contact.last_name },
                                            { label: 'Job Title', field: 'job_title', value: contact.job_title },
                                            { label: 'Work Email', field: 'work_email', value: contact.work_email },
                                            { label: 'Country', field: 'lead_country', value: contact.lead_country },
                                            { label: 'LinkedIn Connections', field: 'connection_count', value: contact.connection_count?.toString() },
                                            { label: 'LinkedIn Followers', field: 'followers_count', value: contact.followers_count?.toString() }
                                          ].map(({ label, field, value }) => (
                                            <div key={field} className="flex justify-between items-center group">
                                              <span className="text-sm text-gray-600">{label}:</span>
                                              {editing.contactId === (contact.linkedin_profile_url || contact.id) && editing.field === field ? (
                                                <div className="flex items-center space-x-2">
                                                  <input
                                                    type="text"
                                                    value={editing.value}
                                                    onChange={(e) => setEditing(prev => ({ ...prev, value: e.target.value }))}
                                                    className="text-sm border border-gray-300 rounded px-2 py-1 w-32 text-right"
                                                  />
                                                  <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                                                    <Save className="w-4 h-4" />
                                                  </button>
                                                  <button onClick={cancelEdit} className="text-red-600 hover:text-red-800">
                                                    <X className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-sm text-gray-900 text-right">
                                                    {field === 'work_email' && value ? (
                                                      <a 
                                                        href={`mailto:${value}`}
                                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                                      >
                                                        {formatFieldValue(value)}
                                                      </a>
                                                    ) : (
                                                      formatFieldValue(value)
                                                    )}
                                                  </span>
                                                  <button
                                                    onClick={() => startEditing(contact.linkedin_profile_url || contact.id || '', field, value || '')}
                                                    className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  >
                                                    <Edit className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                          {contact.linkedin_profile_url && (
                                            <div className="pt-2 text-right">
                                              <a
                                                href={contact.linkedin_profile_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                              >
                                                <ExternalLink className="w-4 h-4 mr-1" />
                                                View Profile
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Company Information */}
                                      <div className="bg-white p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-4">
                                          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                            Company Information
                                          </h4>
                                        </div>
                                        <div className="space-y-3">
                                          {[
                                            { label: 'Company Name', field: 'company_name', value: contact.company_name },
                                            { label: 'Company Domain', field: 'company_domain', value: contact.company_domain },
                                            { label: 'Company Industry', field: 'company_industry', value: contact.company_industry },
                                            { label: 'Company Staff Range', field: 'company_staff_count_range', value: contact.company_staff_count_range }
                                          ].map(({ label, field, value }) => (
                                            <div key={field} className="flex justify-between items-center group">
                                              <span className="text-sm text-gray-600">{label}:</span>
                                              {editing.contactId === (contact.linkedin_profile_url || contact.id) && editing.field === field ? (
                                                <div className="flex items-center space-x-2">
                                                  <input
                                                    type="text"
                                                    value={editing.value}
                                                    onChange={(e) => setEditing(prev => ({ ...prev, value: e.target.value }))}
                                                    className="text-sm border border-gray-300 rounded px-2 py-1 w-32 text-right"
                                                  />
                                                  <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                                                    <Save className="w-4 h-4" />
                                                  </button>
                                                  <button onClick={cancelEdit} className="text-red-600 hover:text-red-800">
                                                    <X className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-sm text-gray-900 text-right">
                                                    {field === 'company_domain' && value ? (
                                                      <a 
                                                        href={`https://${value}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                                      >
                                                        {formatFieldValue(value)}
                                                      </a>
                                                    ) : (
                                                      formatFieldValue(value)
                                                    )}
                                                  </span>
                                                  <button
                                                    onClick={() => startEditing(contact.linkedin_profile_url || contact.id || '', field, value || '')}
                                                    className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  >
                                                    <Edit className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                          {contact.company_linkedin_url && (
                                            <div className="pt-2 text-right">
                                              <a
                                                href={contact.company_linkedin_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                              >
                                                <ExternalLink className="w-4 h-4 mr-1" />
                                                View Company
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Daily Digest Information */}
                                      <div className="bg-white p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-4">
                                          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                            Daily Digest Information
                                          </h4>
                                        </div>
                                        <div className="space-y-3">
                                          {[
                                            { label: 'Last Interaction Summary', field: 'last_interaction_summary', value: contact.last_interaction_summary },
                                            { label: 'Last Interaction Platform', field: 'last_interaction_platform', value: contact.last_interaction_platform },
                                            { label: 'Last Interaction Date', field: 'last_interaction_date', value: formatDate(contact.last_interaction_date) },
                                            { label: 'Talking Point 1', field: 'talking_point_1', value: contact.talking_point_1 },
                                            { label: 'Talking Point 2', field: 'talking_point_2', value: contact.talking_point_2 },
                                            { label: 'Talking Point 3', field: 'talking_point_3', value: contact.talking_point_3 },
                                            { label: 'Sent to Client', field: 'sent_to_client', value: contact.sent_to_client },
                                            { label: 'Sent Date', field: 'exact_sent_date', value: formatDate(contact.exact_sent_date) }
                                          ].map(({ label, field, value }) => (
                                            <div key={field} className="flex justify-between items-start group">
                                              <span className="text-sm text-gray-600 mr-2">{label}:</span>
                                              {editing.contactId === (contact.linkedin_profile_url || contact.id) && editing.field === field ? (
                                                <div className="flex items-center space-x-2">
                                                  <textarea
                                                    value={editing.value}
                                                    onChange={(e) => setEditing(prev => ({ ...prev, value: e.target.value }))}
                                                    className="text-sm border border-gray-300 rounded px-2 py-1 w-40 h-16 resize-none text-right"
                                                  />
                                                  <div className="flex flex-col space-y-1">
                                                    <button onClick={saveEdit} className="text-green-600 hover:text-green-800">
                                                      <Save className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={cancelEdit} className="text-red-600 hover:text-red-800">
                                                      <X className="w-4 h-4" />
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="flex items-start space-x-2 flex-1">
                                                  <span className="text-sm text-gray-900 text-right flex-1">
                                                    {formatFieldValue(value)}
                                                  </span>
                                                  <button
                                                    onClick={() => startEditing(contact.linkedin_profile_url || contact.id || '', field, value || '')}
                                                    className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                                                  >
                                                    <Edit className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredGroups.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No contacts found matching your criteria.</p>
            </div>
          )}
        </div>

        {/* Potential Value Add Header */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Potential Value Add</h2>
        </div>

        {/* Article Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-black text-white rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold">{articleMetrics.clientGroups}</div>
            </div>
            <div className="text-sm opacity-80 mt-1">Client Groups</div>
          </div>
          <div className="bg-black text-white rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold">{articleMetrics.totalArticles}</div>
            </div>
            <div className="text-sm opacity-80 mt-1">Total Articles</div>
          </div>
          <div className="bg-black text-white rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold">0</div>
            </div>
            <div className="text-sm opacity-80 mt-1">Published</div>
          </div>
          <div className="bg-black text-white rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold">0</div>
            </div>
            <div className="text-sm opacity-80 mt-1">In Review</div>
          </div>
        </div>

        {/* Article Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1"></div>
          <CustomDropdown
            value={selectedArticleClientEmail}
            onChange={setSelectedArticleClientEmail}
            options={articleClientEmailOptions}
            placeholder="All Client Emails"
            className="min-w-[280px]"
          />
        </div>

        {/* Article Groups */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Articles by Client Email</h2>
            <p className="text-sm text-gray-500">Sorted by creation date (newest first) • Auto-refreshes every 30 seconds</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredArticleGroups.map((group) => (
              <div key={group.clientEmail}>
                {/* Group Header */}
                <div
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleArticleGroupExpansion(group.clientEmail)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {expandedArticleGroups.has(group.clientEmail) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400 mr-2" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 mr-2" />
                      )}
                      <div className="flex items-center">
                        <span className="text-lg font-medium text-gray-900">{group.clientEmail}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          {group.articles.length} articles
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Group Content */}
                {expandedArticleGroups.has(group.clientEmail) && (
                  <div className="px-6 pb-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <th className="pb-3 pr-8">Article</th>
                            <th className="pb-3 pr-8">Type</th>
                            <th className="pb-3 pr-8">Source</th>
                            <th className="pb-3 pr-8">Created</th>
                            <th className="pb-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {group.articles.map((article) => (
                            <React.Fragment key={article.article_link}>
                              {/* Article Summary Row */}
                              <tr className="hover:bg-gray-50">
                                <td className="py-3 pr-8">
                                  <div className="text-sm font-medium text-gray-900">
                                    {article.article_headline || 'Untitled Article'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {article.article_short_summary && article.article_short_summary.substring(0, 100)}
                                    {article.article_short_summary && article.article_short_summary.length > 100 && '...'}
                                  </div>
                                </td>
                                <td className="py-3 pr-8 text-sm text-gray-900">{formatFieldValue(article.article_type)}</td>
                                <td className="py-3 pr-8">
                                  <div className="text-sm text-gray-900">
                                    {article.article_link ? (
                                      <a 
                                        href={article.article_link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        {article.article_link.length > 30 ? 
                                          `${article.article_link.substring(0, 30)}...` : 
                                          article.article_link
                                        }
                                      </a>
                                    ) : (
                                      '-'
                                    )}
                                  </div>
                                </td>
                                <td className="py-3 pr-8 text-sm text-gray-900">{formatDate(article.created_at)}</td>
                                <td className="py-3">
                                  <div className="flex items-center space-x-4">
                                    <button
                                      onClick={() => toggleArticleExpansion(article.article_link)}
                                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                    >
                                      {expandedArticles.has(article.article_link) ? 'Hide Details' : 'View Details'}
                                    </button>
                                    <button
                                      onClick={() => deleteArticle(article.article_link)}
                                      className="text-red-600 hover:text-red-800"
                                      title="Delete Article"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Article Details Row */}
                              {expandedArticles.has(article.article_link) && (
                                <tr>
                                  <td colSpan={5} className="py-6 bg-gray-50">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                      {/* Article Details */}
                                      <div className="bg-white p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-4">
                                          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                            Article Details
                                          </h4>
                                        </div>
                                        <div className="space-y-3">
                                          {[
                                            { label: 'Headline', field: 'article_headline', value: article.article_headline },
                                            { label: 'Type', field: 'article_type', value: article.article_type },
                                            { label: 'Parent Site', field: 'parent_site', value: article.parent_site },
                                            { label: 'Link', field: 'article_link', value: article.article_link },
                                            { label: 'Combined Headline', field: 'article_combined_headline', value: article.article_combined_headline }
                                          ].map(({ label, field, value }) => (
                                            <div key={field} className="flex justify-between items-start group">
                                              <span className="text-sm text-gray-600 mr-2">{label}:</span>
                                              {editingArticle.contactId === article.article_link && editingArticle.field === field ? (
                                                <div className="flex items-center space-x-2">
                                                  <textarea
                                                    value={editingArticle.value}
                                                    onChange={(e) => setEditingArticle(prev => ({ ...prev, value: e.target.value }))}
                                                    className="text-sm border border-gray-300 rounded px-2 py-1 w-40 h-16 resize-none text-left"
                                                  />
                                                  <div className="flex flex-col space-y-1">
                                                    <button onClick={saveArticleEdit} className="text-green-600 hover:text-green-800">
                                                      <Save className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={cancelArticleEdit} className="text-red-600 hover:text-red-800">
                                                      <X className="w-4 h-4" />
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="flex items-start space-x-2 flex-1">
                                                  <span className="text-sm text-gray-900 text-left flex-1">
                                                    {field === 'article_link' && value ? (
                                                      <a 
                                                        href={value}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                                                      >
                                                        {formatFieldValue(value)}
                                                      </a>
                                                    ) : (
                                                      <span className="break-words">{formatFieldValue(value)}</span>
                                                    )}
                                                  </span>
                                                  <button
                                                    onClick={() => startEditingArticle(article.article_link, field, value || '')}
                                                    className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                                                  >
                                                    <Edit className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Article Content */}
                                      <div className="bg-white p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-4">
                                          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                            Article Content
                                          </h4>
                                        </div>
                                        <div className="space-y-3">
                                          {[
                                            { label: 'Overview', field: 'article_overview', value: article.article_overview },
                                            { label: 'Background Story', field: 'article_background_story', value: article.article_background_story },
                                            { label: 'Problems Solved', field: 'article_problems_solved', value: article.article_problems_solved },
                                            { label: 'Short Summary', field: 'article_short_summary', value: article.article_short_summary }
                                          ].map(({ label, field, value }) => (
                                            <div key={field} className="flex justify-between items-start group">
                                              <span className="text-sm text-gray-600 mr-2">{label}:</span>
                                              {editingArticle.contactId === article.article_link && editingArticle.field === field ? (
                                                <div className="flex items-center space-x-2">
                                                  <textarea
                                                    value={editingArticle.value}
                                                    onChange={(e) => setEditingArticle(prev => ({ ...prev, value: e.target.value }))}
                                                    className="text-sm border border-gray-300 rounded px-2 py-1 w-40 h-20 resize-none text-left"
                                                  />
                                                  <div className="flex flex-col space-y-1">
                                                    <button onClick={saveArticleEdit} className="text-green-600 hover:text-green-800">
                                                      <Save className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={cancelArticleEdit} className="text-red-600 hover:text-red-800">
                                                      <X className="w-4 h-4" />
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="flex items-start space-x-2 flex-1">
                                                  <span className="text-sm text-gray-900 text-left flex-1 break-words">
                                                    {formatFieldValue(value)}
                                                  </span>
                                                  <button
                                                    onClick={() => startEditingArticle(article.article_link, field, value || '')}
                                                    className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                                                  >
                                                    <Edit className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredArticleGroups.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No articles found matching your criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;