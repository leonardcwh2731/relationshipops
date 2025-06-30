import React, { useState, useEffect } from 'react';
import { ContactsList } from './ContactsList';
import { StatsCards } from './StatsCards';
import { Header } from './Header';
import { supabase } from '../lib/supabase';
import { Contact } from '../types/Contact';
import { User } from '../App';

interface DashboardProps {
  user: User;
  onSignOut: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onSignOut }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<string>('all');
  const [availableEmails, setAvailableEmails] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const [totalContactsForEmail, setTotalContactsForEmail] = useState(0);
  const contactsPerPage = 50;

  // Fetch available client emails
  useEffect(() => {
    const fetchAvailableEmails = async () => {
      try {
        const { data, error } = await supabase
          .from('client_details')
          .select('email_address, full_name')
          .order('full_name', { ascending: true });

        if (error) throw error;

        const emails = data?.map(client => client.email_address) || [];
        setAvailableEmails(emails);
      } catch (error) {
        console.error('Error fetching available emails:', error);
      }
    };

    fetchAvailableEmails();
  }, []);

  // Fetch contacts and total counts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get total contacts count (all contacts regardless of filter)
        const { count: allContactsCount, error: countAllError } = await supabase
          .from('icp_contacts_tracking_in_progress')
          .select('*', { count: 'exact', head: true });

        if (countAllError) throw countAllError;
        setTotalContacts(allContactsCount || 0);

        // Build query for filtered contacts
        let query = supabase
          .from('icp_contacts_tracking_in_progress')
          .select(`
            *,
            onboarding_google_tokens!left(account_email)
          `);

        // Apply email filter if not 'all'
        if (selectedEmail !== 'all') {
          query = query.eq('client_email', selectedEmail);
        }

        // Get count for current filter
        const { count: filteredCount, error: countFilteredError } = await query
          .select('*', { count: 'exact', head: true });

        if (countFilteredError) throw countFilteredError;
        setTotalContactsForEmail(filteredCount || 0);

        // Get paginated results
        const startIndex = (currentPage - 1) * contactsPerPage;
        const endIndex = startIndex + contactsPerPage - 1;

        const { data: contactsData, error: contactsError } = await query
          .order('created_at', { ascending: false })
          .range(startIndex, endIndex);

        if (contactsError) throw contactsError;

        // Transform data to include account_email
        const transformedContacts = contactsData?.map(contact => ({
          ...contact,
          account_email: contact.onboarding_google_tokens?.account_email || contact.client_email
        })) || [];

        setContacts(transformedContacts);
      } catch (error) {
        console.error('Error fetching contacts:', error);
        setContacts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedEmail, currentPage]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      onSignOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const totalPages = Math.ceil(totalContactsForEmail / contactsPerPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user} 
        onSignOut={handleSignOut}
        availableEmails={availableEmails}
        selectedEmail={selectedEmail}
        onEmailChange={setSelectedEmail}
      />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        <StatsCards 
          totalContacts={totalContacts}
          filteredContacts={totalContactsForEmail}
          selectedEmail={selectedEmail}
        />
        
        <ContactsList
          contacts={contacts}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalContacts={totalContactsForEmail}
          onPageChange={setCurrentPage}
          selectedEmail={selectedEmail}
        />
      </main>
    </div>
  );
};