import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, Search, Edit, Save, X, ExternalLink, Mail, User, Trash2 } from 'lucide-react';
import { Contact } from './types/Contact';
import { supabase } from './lib/supabase';
import { CustomDropdown } from './components/CustomDropdown';

interface ContactGroup {
  accountEmail: string;
  contacts: Contact[];
  leadsAbove80: number;
}

interface Article {
  client_full_name?: string;
  client_first_name?: string;
  client_last_name?: string;
  client_email_address?: string;
  parent_site?: string;
  article_type?: string;
  article_headline?: string;
  article_link: string;
  article_overview?: string;
  article_background_story?: string;
  article_problems_solved?: string;
  article_short_summary?: string;
  article_combined_headline?: string;
  created_at?: string;
}

interface ArticleGroup {
  accountEmail: string;
  articles: Article[];
  totalArticles: number;
}

interface EditingState {
  contactId: string | null;
  field: string | null;
  value: string;
}

function App() {
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [articleGroups, setArticleGroups] = useState<ArticleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [articleSearchTerm, setArticleSearchTerm] = useState('');
  const [selectedAccountEmail, setSelectedAccountEmail] = useState('');
  const [selectedArticleAccountEmail, setSelectedArticleAccountEmail] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());
  const [expandedArticleGroups, setExpandedArticleGroups] = useState<Set<string>>(new Set());
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<EditingState>({ contactId: null, field: null, value: '' });
  const [articleEditing, setArticleEditing] = useState<EditingState>({ contactId: null, field: null, value: '' });
  const [totalMetrics, setTotalMetrics] = useState({
    totalContacts: 0,
    accountGroups: 0,
    leadsAbove80: 0,
    readyContacts: 0
  });
  const [articleMetrics, setArticleMetrics] = useState({
    totalArticles: 0,
    articleGroups: 0
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

  const fetchArticles = async () => {
    try {
      setArticlesLoading(true);
      console.log('📰 Fetching articles from potential_value_add...');

      const { data: articles, error } = await supabase
        .from('potential_value_add')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching articles:', error);
        // Use demo data on error
        const demoArticles = generateDemoArticles();
        processArticleData(demoArticles);
        return;
      }

      if (articles && articles.length > 0) {
        console.log(`✅ Fetched ${articles.length} articles`);
        processArticleData(articles);
      } else {
        console.log('⚠️ No articles found, using demo data');
        const demoArticles = generateDemoArticles();
        processArticleData(demoArticles);
      }
    } catch (err) {
      console.error('💥 Error in fetchArticles:', err);
      const demoArticles = generateDemoArticles();
      processArticleData(demoArticles);
    } finally {
      setArticlesLoading(false);
    }
  };

  const generateDemoArticles = (): Article[] => {
    return [
      {
        article_link: 'https://example.com/article1',
        client_email_address: 'leonard@ontenlabs.com',
        client_full_name: 'Leonard Chen',
        client_first_name: 'Leonard',
        client_last_name: 'Chen',
        parent_site: 'TechCrunch',
        article_type: 'Industry News',
        article_headline: 'AI Revolution in Sales Automation',
        article_overview: 'The latest trends in AI-powered sales automation tools',
        article_background_story: 'Companies are increasingly adopting AI to streamline sales processes',
        article_problems_solved: 'Reduces manual work and improves lead qualification',
        article_short_summary: 'AI tools are transforming sales workflows',
        article_combined_headline: 'AI Revolution: How Sales Teams Are Embracing Automation',
        created_at: '2025-01-15T10:30:00Z'
      },
      {
        article_link: 'https://example.com/article2',
        client_email_address: 'peter.kang@barrelny.com',
        client_full_name: 'Peter Kang',
        client_first_name: 'Peter',
        client_last_name: 'Kang',
        parent_site: 'Forbes',
        article_type: 'Case Study',
        article_headline: 'Marketing ROI Optimization Strategies',
        article_overview: 'How companies are maximizing their marketing investments',
        article_background_story: 'Marketing budgets are under scrutiny for ROI',
        article_problems_solved: 'Provides data-driven approaches to marketing spend',
        article_short_summary: 'Proven strategies for better marketing ROI',
        article_combined_headline: 'ROI Optimization: Data-Driven Marketing Strategies That Work',
        created_at: '2025-01-14T14:20:00Z'
      },
      {
        article_link: 'https://example.com/article3',
        client_email_address: 'peter.kang@barrelny.com',
        client_full_name: 'Peter Kang',
        client_first_name: 'Peter',
        client_last_name: 'Kang',
        parent_site: 'Harvard Business Review',
        article_type: 'Research',
        article_headline: 'Future of B2B Customer Engagement',
        article_overview: 'Research on evolving B2B customer expectations',
        article_background_story: 'B2B buyers are demanding more personalized experiences',
        article_problems_solved: 'Helps understand changing buyer behavior',
        article_short_summary: 'B2B engagement is becoming more consumer-like',
        article_combined_headline: 'B2B Evolution: Meeting New Customer Engagement Standards',
        created_at: '2025-01-13T09:45:00Z'
      }
    ];
  };

  const processArticleData = (articles: Article[]) => {
    console.log(`📊 Processing ${articles.length} articles for grouping`);
    
    // Group articles by client_email_address
    const groups: { [key: string]: Article[] } = {};
    
    articles.forEach(article => {
      const accountEmail = article.client_email_address || 'unknown@domain.com';
      if (!groups[accountEmail]) {
        groups[accountEmail] = [];
      }
      groups[accountEmail].push(article);
    });

    // Create article groups
    const articleGroups: ArticleGroup[] = Object.entries(groups).map(([accountEmail, articles]) => ({
      accountEmail,
      articles: articles.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()),
      totalArticles: articles.length
    }));

    // Sort groups by total articles
    articleGroups.sort((a, b) => b.totalArticles - a.totalArticles);

    console.log(`📈 Created ${articleGroups.length} article groups`);
    articleGroups.forEach(group => {
      console.log(`  📧 ${group.accountEmail}: ${group.articles.length} articles`);
    });

    setArticleGroups(articleGroups);

    // Calculate metrics
    setArticleMetrics({
      totalArticles: articles.length,
      articleGroups: articleGroups.length
    });

    console.log(`✅ Article metrics calculated:`, {
      totalArticles: articles.length,
      articleGroups: articleGroups.length
    });
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
    } catch (err) {
      console.error('💥 Error in fetchContacts:', err);
      // Fallback to demo data
      const demoContacts = generateDemoData();
      const totalCount = await fetchTotalContactCount();
      processContactData(demoContacts, totalCount);
    } finally {
      setLoading(false);
      setLastUpdated(new Date().toLocaleTimeString());
    }
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
        created_at: '2025-01-10T08:30:00Z',
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
        created_at: '2025-01-08T16:45:00Z',
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
        created_at: '2025-01-12T11:20:00Z',
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
    fetchArticles();
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

  const toggleArticleGroupExpansion = (accountEmail: string) => {
    const newExpanded = new Set(expandedArticleGroups);
    if (newExpanded.has(accountEmail)) {
      newExpanded.delete(accountEmail);
    } else {
      newExpanded.add(accountEmail);
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

  const startArticleEditing = (articleId: string, field: string, currentValue: string) => {
    setArticleEditing({ contactId: articleId, field, value: currentValue || '' });
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
    if (!articleEditing.contactId || !articleEditing.field) return;

    try {
      console.log('💾 Saving article edit:', articleEditing);
      
      // Update Supabase
      const { error } = await supabase
        .from('potential_value_add')
        .update({ [articleEditing.field]: articleEditing.value })
        .eq('article_link', articleEditing.contactId);

      if (error) {
        console.error('❌ Error updating article:', error);
        return;
      }

      // Update local state optimistically
      setArticleGroups(prevGroups => 
        prevGroups.map(group => ({
          ...group,
          articles: group.articles.map(article => 
            article.article_link === articleEditing.contactId
              ? { ...article, [articleEditing.field!]: articleEditing.value }
              : article
          )
        }))
      );

      setArticleEditing({ contactId: null, field: null, value: '' });
      console.log('✅ Article updated successfully');
    } catch (error) {
      console.error('❌ Error saving article edit:', error);
    }
  };

  const deleteArticle = async (articleLink: string) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('🗑️ Deleting article:', articleLink);
      
      // Delete from Supabase
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
          articles: group.articles.filter(article => article.article_link !== articleLink),
          totalArticles: group.articles.filter(article => article.article_link !== articleLink).length
        })).filter(group => group.articles.length > 0)
      );

      // Update metrics
      setArticleMetrics(prev => ({
        ...prev,
        totalArticles: prev.totalArticles - 1
      }));

      console.log('✅ Article deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting article:', error);
    }
  };

  const cancelEdit = () => {
    setEditing({ contactId: null, field: null, value: '' });
  };

  const cancelArticleEdit = () => {
    setArticleEditing({ contactId: null, field: null, value: '' });
  };

  const filteredGroups = contactGroups.map(group => {
    // Filter by selected account email first
    if (selectedAccountEmail && group.accountEmail !== selectedAccountEmail) {
      return null;
    }
    
    // If there's a search term, filter contacts within the group
    if (searchTerm && searchTerm.trim() !== '') {
      const searchLower = searchTerm.toLowerCase().trim();
      const filteredContacts = group.contacts.filter(contact => 
        (contact.full_name && contact.full_name.toLowerCase().includes(searchLower)) ||
        (contact.first_name && contact.first_name.toLowerCase().includes(searchLower)) ||
        (contact.last_name && contact.last_name.toLowerCase().includes(searchLower)) ||
        (contact.company_name && contact.company_name.toLowerCase().includes(searchLower)) ||
        (contact.job_title && contact.job_title.toLowerCase().includes(searchLower)) ||
        (contact.work_email && contact.work_email.toLowerCase().includes(searchLower)) ||
        (contact.company_domain && contact.company_domain.toLowerCase().includes(searchLower))
      );
      
      // Only return the group if it has matching contacts
      if (filteredContacts.length > 0) {
        return {
          ...group,
          contacts: filteredContacts,
          leadsAbove80: filteredContacts.filter(c => (c.total_lead_score || c.lead_score || 0) >= 80).length
        };
      }
      return null;
    }
    
    return group;
  }).filter(group => group !== null) as ContactGroup[];

  const filteredArticleGroups = articleGroups.map(group => {
    // Filter by selected account email first
    if (selectedArticleAccountEmail && group.accountEmail !== selectedArticleAccountEmail) {
      return null;
    }
    
    // If there's a search term, filter articles within the group
    if (articleSearchTerm && articleSearchTerm.trim() !== '') {
      const searchLower = articleSearchTerm.toLowerCase().trim();
      const filteredArticles = group.articles.filter(article => 
        (article.article_headline && article.article_headline.toLowerCase().includes(searchLower)) ||
        (article.article_type && article.article_type.toLowerCase().includes(searchLower)) ||
        (article.parent_site && article.parent_site.toLowerCase().includes(searchLower)) ||
        (article.article_short_summary && article.article_short_summary.toLowerCase().includes(searchLower)) ||
        (article.client_full_name && article.client_full_name.toLowerCase().includes(searchLower))
      );
      
      // Only return the group if it has matching articles
      if (filteredArticles.length > 0) {
        return {
          ...group,
          articles: filteredArticles,
          totalArticles: filteredArticles.length
        };
      }
      return null;
    }
    
    return group;
  }).filter(group => group !== null) as ArticleGroup[];

  const uniqueAccountEmails = contactGroups.map(group => group.accountEmail);
  const uniqueArticleAccountEmails = articleGroups.map(group => group.accountEmail);

  // Create dropdown options with icons
  const dropdownOptions = [
    {
      value: '',
      label: 'All Account Emails',
      icon: <User className="w-4 h-4" />
    },
    ...uniqueAccountEmails.map(email => ({
      value: email,
      label: email,
      icon: <Mail className="w-4 h-4" />
    }))
  ];

  const articleDropdownOptions = [
    {
      value: '',
      label: 'All Account Emails',
      icon: <User className="w-4 h-4" />
    },
    ...uniqueArticleAccountEmails.map(email => ({
      value: email,
      label: email,
      icon: <Mail className="w-4 h-4" />
    }))
  ];

  useEffect(() => {
    fetchContacts();
    fetchArticles();

    // Set up auto-refresh every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      fetchContacts();
      fetchArticles();
    }, 30000);

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
              disabled={loading || articlesLoading}
              className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${(loading || articlesLoading) ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
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
              placeholder="Search contacts by name, company, job title, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>
          <CustomDropdown
            value={selectedAccountEmail}
            onChange={setSelectedAccountEmail}
            options={dropdownOptions}
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
                            <th className="pb-3 pr-6 w-64">Contact</th>
                            <th className="pb-3 pr-6 w-48">Job Title</th>
                            <th className="pb-3 pr-6 w-56">Company</th>
                            <th className="pb-3 pr-4 w-20">Score</th>
                            <th className="pb-3 w-32">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {group.contacts.map((contact) => (
                            <React.Fragment key={contact.linkedin_profile_url || contact.id}>
                              {/* Contact Summary Row */}
                              <tr className="hover:bg-gray-50">
                                <td className="py-3 pr-6 w-64">
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
                                <td className="py-3 pr-6 w-48 text-sm text-gray-900">{formatFieldValue(contact.job_title)}</td>
                                <td className="py-3 pr-6 w-56">
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
                                <td className="py-3 pr-4 w-20">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getScoreColor(contact.total_lead_score || contact.lead_score || 0)}`}>
                                    {contact.total_lead_score || contact.lead_score || 0}
                                  </span>
                                </td>
                                <td className="py-3 w-32">
                                  <button
                                    onClick={() => toggleContactExpansion(contact.linkedin_profile_url || contact.id || '')}
                                    className="inline-flex items-center text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors duration-200"
                                  >
                                    <ChevronRight className="w-4 h-4 mr-1" />
                                    {expandedContacts.has(contact.linkedin_profile_url || contact.id || '') ? 'Hide Details' : 'Show Details'}
                                  </button>
                                </td>
                              </tr>

                              {/* Contact Details Row */}
                              {expandedContacts.has(contact.linkedin_profile_url || contact.id || '') && (
                                <tr>
                                  <td colSpan={5} className="py-6 bg-gray-50">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                      {/* Lead Information */}
                                      <div className="bg-white p-4 rounded-lg group">
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
                                                    {field === 'work_email' && value && value !== '-' ? (
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
                                      <div className="bg-white p-4 rounded-lg group">
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
                                                    {field === 'company_domain' && value && value !== '-' ? (
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
                                      <div className="bg-white p-4 rounded-lg group">
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
                                            { label: 'Sent Date', field: 'exact_sent_date', value: formatDate(contact.exact_sent_date) },
                                            { label: 'Added On', field: 'created_at', value: formatDate(contact.created_at) }
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
                                                    onClick={() => startEditing(contact.linkedin_profile_url || contact.id || '', field, field.includes('date') ? (field === 'last_interaction_date' ? contact.last_interaction_date || '' : field === 'exact_sent_date' ? contact.exact_sent_date || '' : contact.created_at || '') : value || '')}
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

        {/* Article Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-600 text-white rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold">{articleMetrics.articleGroups}</div>
            </div>
            <div className="text-sm opacity-80 mt-1">Article Groups</div>
          </div>
          <div className="bg-blue-600 text-white rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-2xl font-bold">{articleMetrics.totalArticles}</div>
            </div>
            <div className="text-sm opacity-80 mt-1">Total Articles</div>
          </div>
        </div>

        {/* Article Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search articles by headline, type, site, summary..."
              value={articleSearchTerm}
              onChange={(e) => setArticleSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
            />
          </div>
          <CustomDropdown
            value={selectedArticleAccountEmail}
            onChange={setSelectedArticleAccountEmail}
            options={articleDropdownOptions}
            placeholder="All Account Emails"
            className="min-w-[280px]"
          />
        </div>

        {/* Articles by Account Email */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Articles by Account Email</h2>
            <p className="text-sm text-gray-500">Sorted by creation date (newest first) • Auto-refreshes every 30 seconds</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredArticleGroups.map((group) => (
              <div key={group.accountEmail}>
                {/* Article Group Header */}
                <div
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleArticleGroupExpansion(group.accountEmail)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {expandedArticleGroups.has(group.accountEmail) ? (
                        <ChevronDown className="w-5 h-5 text-gray-400 mr-2" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400 mr-2" />
                      )}
                      <div className="flex items-center">
                        <span className="text-lg font-medium text-gray-900">{group.accountEmail}</span>
                        <span className="ml-2 text-sm text-gray-500">
                          {group.totalArticles} articles
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Article Group Content */}
                {expandedArticleGroups.has(group.accountEmail) && (
                  <div className="px-6 pb-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <th className="pb-3 pr-6 w-64">Article</th>
                            <th className="pb-3 pr-6 w-32">Type</th>
                            <th className="pb-3 pr-6 w-32">Source</th>
                            <th className="pb-3 pr-4 w-32">Created</th>
                            <th className="pb-3 w-32">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {group.articles.map((article) => (
                            <React.Fragment key={article.article_link}>
                              {/* Article Summary Row */}
                              <tr className="hover:bg-gray-50">
                                <td className="py-3 pr-6 w-64">
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatFieldValue(article.article_headline)}
                                  </div>
                                  {article.article_short_summary && (
                                    <div className="text-sm text-gray-500 truncate">
                                      {article.article_short_summary}
                                    </div>
                                  )}
                                </td>
                                <td className="py-3 pr-6 w-32 text-sm text-gray-900">{formatFieldValue(article.article_type)}</td>
                                <td className="py-3 pr-6 w-32 text-sm text-gray-900">{formatFieldValue(article.parent_site)}</td>
                                <td className="py-3 pr-4 w-32 text-sm text-gray-900">{formatDate(article.created_at)}</td>
                                <td className="py-3 w-32">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => toggleArticleExpansion(article.article_link)}
                                      className="inline-flex items-center text-gray-700 hover:text-gray-900 text-sm font-medium transition-colors duration-200"
                                    >
                                      <ChevronRight className="w-4 h-4 mr-1" />
                                      {expandedArticles.has(article.article_link) ? 'Hide' : 'Show'}
                                    </button>
                                    <button
                                      onClick={() => deleteArticle(article.article_link)}
                                      className="text-red-600 hover:text-red-800 transition-colors duration-200"
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
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                      {/* Client Information */}
                                      <div className="bg-white p-4 rounded-lg group">
                                        <div className="flex items-center justify-between mb-4">
                                          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                            Client Information
                                          </h4>
                                        </div>
                                        <div className="space-y-3">
                                          {[
                                            { label: 'Client Email', field: 'client_email_address', value: article.client_email_address },
                                            { label: 'Full Name', field: 'client_full_name', value: article.client_full_name },
                                            { label: 'First Name', field: 'client_first_name', value: article.client_first_name },
                                            { label: 'Last Name', field: 'client_last_name', value: article.client_last_name }
                                          ].map(({ label, field, value }) => (
                                            <div key={field} className="flex justify-between items-center group">
                                              <span className="text-sm text-gray-600">{label}:</span>
                                              {articleEditing.contactId === article.article_link && articleEditing.field === field ? (
                                                <div className="flex items-center space-x-2">
                                                  <input
                                                    type="text"
                                                    value={articleEditing.value}
                                                    onChange={(e) => setArticleEditing(prev => ({ ...prev, value: e.target.value }))}
                                                    className="text-sm border border-gray-300 rounded px-2 py-1 w-32 text-right"
                                                  />
                                                  <button onClick={saveArticleEdit} className="text-green-600 hover:text-green-800">
                                                    <Save className="w-4 h-4" />
                                                  </button>
                                                  <button onClick={cancelArticleEdit} className="text-red-600 hover:text-red-800">
                                                    <X className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <div className="flex items-center space-x-2">
                                                  <span className="text-sm text-gray-900 text-right">
                                                    {field === 'client_email_address' && value && value !== '-' ? (
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
                                                    onClick={() => startArticleEditing(article.article_link, field, value || '')}
                                                    className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  >
                                                    <Edit className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      {/* Article Details */}
                                      <div className="bg-white p-4 rounded-lg group">
                                        <div className="flex items-center justify-between mb-4">
                                          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                            Article Details
                                          </h4>
                                        </div>
                                        <div className="space-y-3">
                                          {[
                                            { label: 'Headline', field: 'article_headline', value: article.article_headline },
                                            { label: 'Type', field: 'article_type', value: article.article_type },
                                            { label: 'Parent Site', field: 'parent_site', value: article.parent_site },
                                            { label: 'Combined Headline', field: 'article_combined_headline', value: article.article_combined_headline }
                                          ].map(({ label, field, value }) => (
                                            <div key={field} className="flex justify-between items-start group">
                                              <span className="text-sm text-gray-600 mr-2">{label}:</span>
                                              {articleEditing.contactId === article.article_link && articleEditing.field === field ? (
                                                <div className="flex items-center space-x-2">
                                                  <textarea
                                                    value={articleEditing.value}
                                                    onChange={(e) => setArticleEditing(prev => ({ ...prev, value: e.target.value }))}
                                                    className="text-sm border border-gray-300 rounded px-2 py-1 w-40 h-16 resize-none text-right"
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
                                                  <span className="text-sm text-gray-900 text-right flex-1">
                                                    {formatFieldValue(value)}
                                                  </span>
                                                  <button
                                                    onClick={() => startArticleEditing(article.article_link, field, value || '')}
                                                    className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                                                  >
                                                    <Edit className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                          {article.article_link && (
                                            <div className="pt-2 text-right">
                                              <a
                                                href={article.article_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                                              >
                                                <ExternalLink className="w-4 h-4 mr-1" />
                                                View Article
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      {/* Article Content */}
                                      <div className="bg-white p-4 rounded-lg group">
                                        <div className="flex items-center justify-between mb-4">
                                          <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                                            <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                            Article Content
                                          </h4>
                                        </div>
                                        <div className="space-y-3">
                                          {[
                                            { label: 'Short Summary', field: 'article_short_summary', value: article.article_short_summary },
                                            { label: 'Overview', field: 'article_overview', value: article.article_overview },
                                            { label: 'Background Story', field: 'article_background_story', value: article.article_background_story },
                                            { label: 'Problems Solved', field: 'article_problems_solved', value: article.article_problems_solved },
                                            { label: 'Created At', field: 'created_at', value: formatDate(article.created_at) }
                                          ].map(({ label, field, value }) => (
                                            <div key={field} className="flex justify-between items-start group">
                                              <span className="text-sm text-gray-600 mr-2">{label}:</span>
                                              {articleEditing.contactId === article.article_link && articleEditing.field === field ? (
                                                <div className="flex items-center space-x-2">
                                                  <textarea
                                                    value={articleEditing.value}
                                                    onChange={(e) => setArticleEditing(prev => ({ ...prev, value: e.target.value }))}
                                                    className="text-sm border border-gray-300 rounded px-2 py-1 w-40 h-16 resize-none text-right"
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
                                                  <span className="text-sm text-gray-900 text-right flex-1">
                                                    {formatFieldValue(value)}
                                                  </span>
                                                  {field !== 'created_at' && (
                                                    <button
                                                      onClick={() => startArticleEditing(article.article_link, field, field === 'created_at' ? article.created_at || '' : value || '')}
                                                      className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                                                    >
                                                      <Edit className="w-4 h-4" />
                                                    </button>
                                                  )}
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

          {articlesLoading && (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading articles...</p>
            </div>
          )}

          {!articlesLoading && filteredArticleGroups.length === 0 && (
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