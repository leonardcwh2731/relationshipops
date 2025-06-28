import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { StatsCards } from './components/StatsCards';
import { ContactsTable } from './components/ContactsTable';

interface Contact {
  linkedin_profile_url: string;
  full_name: string;
  first_name: string;
  last_name: string;
  job_title: string;
  work_email: string;
  company_name: string;
  company_domain: string;
  lead_score: number;
  total_lead_score: number;
  client_email: string;
  client_full_name: string;
  last_interaction_date: string;
  sent_to_client: string;
}

function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Stats state
  const [totalContacts, setTotalContacts] = useState(0);
  const [totalGroups, setTotalGroups] = useState(0);
  const [leadsAbove80, setLeadsAbove80] = useState(0);
  const [readyToSendContacts, setReadyToSendContacts] = useState(0);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Debug: Let's check multiple queries to understand the discrepancy
      const clientEmail = 'leonard@ontenlabs.com';

      // Query 1: Count all contacts for this client email without any limits
      const { count: totalCount, error: countError } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*', { count: 'exact', head: true })
        .eq('client_email', clientEmail);

      // Query 2: Fetch all contacts without pagination to see actual count
      const { data: allContacts, error: allContactsError } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*')
        .eq('client_email', clientEmail)
        .order('last_interaction_date', { ascending: false });

      // Query 3: Check for any RLS issues by also checking client_email_id
      const { data: contactsByEmailId, error: emailIdError } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*')
        .eq('client_email_id', clientEmail)
        .order('last_interaction_date', { ascending: false });

      if (countError) {
        console.error('Count query error:', countError);
      }

      if (allContactsError) {
        console.error('All contacts query error:', allContactsError);
      }

      if (emailIdError) {
        console.error('Email ID query error:', emailIdError);
      }

      // Set debug information
      setDebugInfo({
        totalCount,
        allContactsCount: allContacts?.length || 0,
        contactsByEmailIdCount: contactsByEmailId?.length || 0,
        countError,
        allContactsError,
        emailIdError,
        sampleContact: allContacts?.[0] || null
      });

      console.log('Debug Info:', {
        totalCount,
        allContactsCount: allContacts?.length || 0,
        contactsByEmailIdCount: contactsByEmailId?.length || 0,
        firstFewContacts: allContacts?.slice(0, 3),
        lastFewContacts: allContacts?.slice(-3)
      });

      // Use the data that returns more contacts
      const contactsData = (allContacts?.length || 0) > (contactsByEmailId?.length || 0) 
        ? allContacts 
        : contactsByEmailId;

      if (contactsData) {
        setContacts(contactsData);
        setTotalContacts(contactsData.length);
        
        // Calculate stats
        const uniqueCompanies = new Set(contactsData.map(c => c.company_domain || c.company_name)).size;
        setTotalGroups(uniqueCompanies);
        
        const above80 = contactsData.filter(c => (c.total_lead_score || c.lead_score || 0) >= 80).length;
        setLeadsAbove80(above80);
        
        const ready = contactsData.filter(c => c.sent_to_client === 'Yes' || c.sent_to_client === 'yes').length;
        setReadyToSendContacts(ready);
      } else {
        setError('No contacts found');
      }

    } catch (err) {
      console.error('Error fetching contacts:', err);
      setError('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchContacts}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">RelationshipOps Dashboard</h1>
            <p className="text-gray-600">Manage your contacts and relationships</p>
          </div>

          <StatsCards 
            totalContacts={totalContacts}
            totalGroups={totalGroups}
            leadsAbove80={leadsAbove80}
            readyToSendContacts={readyToSendContacts}
          />

          {/* Debug Information Panel */}
          {debugInfo && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">Debug Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Total Count (HEAD query):</strong> {debugInfo.totalCount || 'N/A'}</p>
                  <p><strong>All Contacts Count:</strong> {debugInfo.allContactsCount}</p>
                  <p><strong>Contacts by Email ID:</strong> {debugInfo.contactsByEmailIdCount}</p>
                </div>
                <div>
                  <p><strong>Count Error:</strong> {debugInfo.countError ? 'Yes' : 'No'}</p>
                  <p><strong>Contacts Error:</strong> {debugInfo.allContactsError ? 'Yes' : 'No'}</p>
                  <p><strong>Email ID Error:</strong> {debugInfo.emailIdError ? 'Yes' : 'No'}</p>
                </div>
              </div>
              {debugInfo.sampleContact && (
                <div className="mt-2">
                  <p><strong>Sample Contact Fields:</strong></p>
                  <pre className="text-xs bg-white p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify({
                      client_email: debugInfo.sampleContact.client_email,
                      client_email_id: debugInfo.sampleContact.client_email_id,
                      linkedin_profile_url: debugInfo.sampleContact.linkedin_profile_url,
                      full_name: debugInfo.sampleContact.full_name
                    }, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          <ContactsTable contacts={contacts} />
        </div>
      </div>
    </div>
  );
}

export default App;