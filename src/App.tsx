import React, { useState, useEffect } from 'react';
import { StatsCards } from './components/StatsCards';
import { ContactsTable } from './components/ContactsTable';
import { supabase } from './lib/supabase';

interface Contact {
  linkedin_profile_url: string;
  full_name: string;
  first_name: string;
  last_name: string;
  job_title: string;
  company_name: string;
  company_domain: string;
  lead_score: number;
  total_lead_score: number;
  sent_to_client: string;
  last_interaction_date: string;
  last_interaction_platform: string;
  client_full_name: string;
}

function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*')
        .order('total_lead_score', { ascending: false });

      if (error) {
        throw error;
      }

      setContacts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const totalContacts = contacts.length;
  const totalGroups = new Set(contacts.map(c => c.company_domain)).size;
  const leadsAbove80 = contacts.filter(c => (c.total_lead_score || 0) >= 80).length;
  const readyToSendContacts = contacts.filter(c => c.sent_to_client === 'Yes').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h2>
            <p className="text-red-600">{error}</p>
            <button 
              onClick={fetchContacts}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
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
            <p className="mt-2 text-gray-600">Track and manage your contact relationships</p>
          </div>

          <StatsCards
            totalContacts={totalContacts}
            totalGroups={totalGroups}
            leadsAbove80={leadsAbove80}
            readyToSendContacts={readyToSendContacts}
          />

          <ContactsTable contacts={contacts} />
        </div>
      </div>
    </div>
  );
}

export default App;