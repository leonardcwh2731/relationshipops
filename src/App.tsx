import React, { useState, useEffect } from 'react';
import { StatsCards } from './components/StatsCards';
import { ContactsTable } from './components/ContactsTable';
import { supabase } from './lib/supabase';

interface Contact {
  linkedin_profile_url: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  company_domain?: string;
  job_title?: string;
  work_email?: string;
  last_interaction_date?: string;
  last_interaction_summary?: string;
  lead_score?: number;
  total_lead_score?: number;
  sent_to_client?: string;
  exact_sent_date?: string;
  talking_point_1?: string;
  talking_point_2?: string;
  talking_point_3?: string;
  client_email?: string;
  client_email_id?: string;
  client_full_name?: string;
  client_first_name?: string;
  client_last_name?: string;
  last_interaction_platform?: string;
  potential_value_add_link?: string;
  potential_value_add_headline?: string;
  linkedin_profile_urn?: string;
  connection_count?: number;
  followers_count?: number;
  current_company_join_month?: number;
  current_company_join_year?: number;
  lead_country?: string;
  company_industry?: string;
  company_staff_count_range?: string;
  total_thread_count?: number;
  total_number_of_messages?: number;
  total_trust_score?: number;
  total_meeting_count?: number;
  unique_platforms_count?: number;
  signals_lead_score?: number;
  company_id?: number;
  created_at?: string;
}

interface DebugInfo {
  totalTableRecords: number | null;
  totalCount: number | null;
  allContactsCount: number;
  contactsByEmailIdCount: number;
  countError: any;
  tableCountError: any;
  sampleContact: Contact | null;
}

const PAGE_SIZE = 1000;

async function fetchAllPages(
  table: string,
  column: string,
  value: string
): Promise<Contact[]> {
  let all: Contact[] = [];
  let from = 0;
  let pageCount = 0;
  
  console.log(`🔄 Starting to fetch all pages for ${column}=${value}`);
  
  while (true) {
    pageCount++;
    const to = from + PAGE_SIZE - 1;
    
    console.log(`📄 Fetching page ${pageCount}: range ${from}-${to}`);
    
    const { data, error } = await supabase
      .from<Contact>(table)
      .select('*')
      .eq(column, value)
      .order('last_interaction_date', { ascending: false })
      .range(from, to);

    if (error) {
      console.error(`❌ Paging error on ${column}=${value}`, error);
      break;
    }
    if (!data || data.length === 0) {
      console.log(`🛑 No more data on page ${pageCount}`);
      break;
    }

    console.log(`✅ Page ${pageCount} returned ${data.length} records`);
    all = all.concat(data);
    
    if (data.length < PAGE_SIZE) {
      console.log(`🎯 Last page detected (${data.length} < ${PAGE_SIZE})`);
      break;  // last page
    }
    from += PAGE_SIZE;
  }
  
  console.log(`📊 Total records fetched for ${column}=${value}: ${all.length} (across ${pageCount} pages)`);
  return all;
}

function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalContacts, setTotalContacts] = useState(0);
  const [totalGroups, setTotalGroups] = useState(0);
  const [leadsAbove80, setLeadsAbove80] = useState(0);
  const [readyToSendContacts, setReadyToSendContacts] = useState(0);
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      const clientEmail = 'leonard@ontenlabs.com';

      console.log('🚀 Starting contact fetch process...');
      console.log(`🎯 Target client email: ${clientEmail}`);

      // 0) Get total table record count (equivalent to: SELECT COUNT(*) FROM public.icp_contacts_tracking_in_progress)
      console.log('\n📊 Step 0: Getting total table record count...');
      console.log('🗃️  Executing: SELECT COUNT(*) AS record_count FROM public.icp_contacts_tracking_in_progress');
      
      const { count: totalTableRecords, error: tableCountError } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*', { count: 'exact', head: true });

      console.log(`📊 Total records in entire table: ${totalTableRecords}`);
      if (tableCountError) {
        console.error('❌ Table count error:', tableCountError);
      }

      // 1) get exact count for client email
      console.log('\n📊 Step 1: Getting exact count for client email filter...');
      const { count: totalCount, error: countError } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*', { count: 'exact', head: true })
        .eq('client_email', clientEmail);

      console.log(`📈 Filtered count result (client_email = '${clientEmail}'): ${totalCount}`);
      if (countError) {
        console.error('❌ Count error:', countError);
      }

      // 2) page through client_email
      console.log('\n📊 Step 2: Fetching by client_email...');
      const allContacts = await fetchAllPages(
        'icp_contacts_tracking_in_progress',
        'client_email',
        clientEmail
      );

      // 3) page through client_email_id
      console.log('\n📊 Step 3: Fetching by client_email_id...');
      const contactsByEmailId = await fetchAllPages(
        'icp_contacts_tracking_in_progress',
        'client_email_id',
        clientEmail
      );

      // Log comprehensive results
      console.log('\n📊 === CONTACT DATA COUNT SUMMARY ===');
      console.log(`🗃️  Total table records: ${totalTableRecords} (entire table)`);
      console.log(`🔢 Exact count (HEAD request): ${totalCount} (filtered by client_email)`);
      console.log(`📧 client_email results: ${allContacts.length}`);
      console.log(`🆔 client_email_id results: ${contactsByEmailId.length}`);
      console.log(`📊 Table count error: ${tableCountError ? tableCountError.message : 'None'}`);
      console.log(`📊 Filter count error: ${countError ? countError.message : 'None'}`);
      
      // Compare results
      if (allContacts.length !== contactsByEmailId.length) {
        console.log(`⚠️  MISMATCH: client_email (${allContacts.length}) vs client_email_id (${contactsByEmailId.length})`);
      } else {
        console.log(`✅ MATCH: Both queries returned ${allContacts.length} records`);
      }

      // Check against exact count
      const maxResults = Math.max(allContacts.length, contactsByEmailId.length);
      if (totalCount !== null && totalCount !== maxResults) {
        console.log(`⚠️  COUNT DISCREPANCY: Exact count (${totalCount}) vs Max results (${maxResults})`);
      } else {
        console.log(`✅ COUNT MATCH: Exact count matches results`);
      }

      // Check table vs filtered ratios
      if (totalTableRecords !== null && totalCount !== null) {
        const percentage = ((totalCount / totalTableRecords) * 100).toFixed(2);
        console.log(`📊 Client data represents ${percentage}% of total table (${totalCount}/${totalTableRecords})`);
      }

      setDebugInfo({
        totalTableRecords,
        totalCount,
        allContactsCount: allContacts.length,
        contactsByEmailIdCount: contactsByEmailId.length,
        countError,
        tableCountError,
        sampleContact: allContacts[0] || null,
      });

      // pick the larger result set
      const contactsData =
        allContacts.length >= contactsByEmailId.length
          ? allContacts
          : contactsByEmailId;

      console.log(`🎯 Using ${allContacts.length >= contactsByEmailId.length ? 'client_email' : 'client_email_id'} results (${contactsData.length} records)`);

      if (contactsData.length === 0) {
        console.log('❌ No contacts found');
        setError('No contacts found');
      } else {
        setContacts(contactsData);
        setTotalContacts(contactsData.length);

        const uniqueCompanies = new Set(
          contactsData.map((c) => c.company_domain || c.company_name)
        ).size;
        setTotalGroups(uniqueCompanies);

        const above80 = contactsData.filter(
          (c) => (c.total_lead_score || c.lead_score || 0) >= 80
        ).length;
        setLeadsAbove80(above80);

        const ready = contactsData.filter((c) =>
          ['Yes', 'yes'].includes(c.sent_to_client)
        ).length;
        setReadyToSendContacts(ready);

        // Log final statistics
        console.log('\n📊 === FINAL STATISTICS ===');
        console.log(`👥 Total Contacts: ${contactsData.length}`);
        console.log(`🏢 Unique Companies: ${uniqueCompanies}`);
        console.log(`🎯 Leads Above 80: ${above80}`);
        console.log(`✅ Ready to Send: ${ready}`);
        console.log('==============================\n');
      }
    } catch (err) {
      console.error('💥 Error fetching contacts:', err);
      setError('Failed to fetch contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading contacts...</p>
        </div>
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
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              RelationshipOps Dashboard
            </h1>
            <p className="text-gray-600">
              {totalContacts} contacts • Leads Above 80: {leadsAbove80}
            </p>
          </div>

          <StatsCards
            totalContacts={totalContacts}
            totalGroups={totalGroups}
            leadsAbove80={leadsAbove80}
            readyToSendContacts={readyToSendContacts}
          />

          {debugInfo && (
            <div className="mb-6 p-4 bg-gray-100 rounded-lg">
              <h3 className="font-semibold mb-2">Debug Info (also check browser console for detailed logs):</h3>
              <div className="text-sm space-y-1">
                <p><strong>Total Table Records:</strong> {debugInfo.totalTableRecords} (entire table)</p>
                <p><strong>Filtered Count (exact):</strong> {debugInfo.totalCount} (client_email filter)</p>
                <p><strong>client_email results:</strong> {debugInfo.allContactsCount}</p>
                <p><strong>client_email_id results:</strong> {debugInfo.contactsByEmailIdCount}</p>
                {debugInfo.totalTableRecords && debugInfo.totalCount && (
                  <p><strong>Filter Percentage:</strong> {((debugInfo.totalCount / debugInfo.totalTableRecords) * 100).toFixed(2)}% of total data</p>
                )}
                {debugInfo.tableCountError && (
                  <p className="text-red-600">Table Count Error: {debugInfo.tableCountError.message}</p>
                )}
                {debugInfo.countError && (
                  <p className="text-red-600">Filter Count Error: {debugInfo.countError.message}</p>
                )}
                {debugInfo.sampleContact && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Sample Contact</summary>
                    <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                      {JSON.stringify(debugInfo.sampleContact, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          <ContactsTable contacts={contacts} />
        </div>
      </div>
    </div>
  );
}

export default App;