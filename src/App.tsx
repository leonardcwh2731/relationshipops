import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronRight, RefreshCw, Search, Edit, Save, X, ExternalLink } from 'lucide-react';
import { Contact } from './types/Contact';
import { supabase } from './lib/supabase';

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

function App() {
  const [contactGroups, setContactGroups] = useState<ContactGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountEmail, setSelectedAccountEmail] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedContacts, setExpandedContacts] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<EditingState>({ contactId: null, field: null, value: '' });
  const [totalMetrics, setTotalMetrics] = useState({
    totalContacts: 0,
    accountGroups: 0,
    leadsAbove80: 0,
    readyContacts: 0
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

  const startEditing = (contactId: string, field: string, currentValue: string) => {
    setEditing({ contactId, field, value: currentValue || '' });
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

  const cancelEdit = () => {
    setEditing({ contactId: null, field: null, value: '' });
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

  const uniqueAccountEmails = contactGroups.map(group => group.accountEmail);

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
          <select
            value={selectedAccountEmail}
            onChange={(e) => setSelectedAccountEmail(e.target.value)}
            className="px-4 py-2 pr-6 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px] appearance-none bg-white"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em'
            }}
          >
            <option value="">All Account Emails</option>
            {uniqueAccountEmails.map(email => (
              <option key={email} value={email}>{email}</option>
            ))}
          </select>
        </div>

        {/* Contact Groups */}
        <div className="bg-white rounded-lg shadow">
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
                                            { label: 'LinkedIn Followers', field: 'followers_count', value: contact.followers_count?.toString() },
                                            { label: 'Added On', field: 'created_at', value: formatDate(contact.created_at) }
                                          ].map(({ label, field, value }) => (
                                            <div key={field} className="flex justify-between items-center group">
                                              <span className="text-sm text-gray-600">{label}:</span>
                                              {editing.contactId === (contact.linkedin_profile_url || contact.id) && editing.field === field ? (
                                                <div className="flex items-center space-x-2">
                                                  <input
                                                    type="text"
                                                    value={editing.value}
                                                    onChange={(e) => setEditing(prev => ({ ...prev, value: e.target.value }))}
                                                    className="text-sm border border-gray-300 rounded px-2 py-1 w-32"
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
                                                  <span className="text-sm text-gray-900">
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
                                                    onClick={() => startEditing(contact.linkedin_profile_url || contact.id || '', field, field === 'created_at' ? contact.created_at || '' : value || '')}
                                                    className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  >
                                                    <Edit className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                          {contact.linkedin_profile_url && (
                                            <div className="pt-2">
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
                                                    className="text-sm border border-gray-300 rounded px-2 py-1 w-32"
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
                                                  <span className="text-sm text-gray-900">
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
                                            <div className="pt-2">
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
                                            { label: 'Sent Date', field: 'exact_sent_date', value: formatDate(contact.exact_sent_date) }
                                          ].map(({ label, field, value }) => (
                                            <div key={field} className="flex justify-between items-start group">
                                              <span className="text-sm text-gray-600 mr-2">{label}:</span>
                                              {editing.contactId === (contact.linkedin_profile_url || contact.id) && editing.field === field ? (
                                                <div className="flex items-center space-x-2">
                                                  <textarea
                                                    value={editing.value}
                                                    onChange={(e) => setEditing(prev => ({ ...prev, value: e.target.value }))}
                                                    className="text-sm border border-gray-300 rounded px-2 py-1 w-40 h-16 resize-none"
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
                                                    onClick={() => startEditing(contact.linkedin_profile_url || contact.id || '', field, field.includes('date') ? (field === 'last_interaction_date' ? contact.last_interaction_date || '' : contact.exact_sent_date || '') : value || '')}
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
      </div>
    </div>
  );
}

export default App;