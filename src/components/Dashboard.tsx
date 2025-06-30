import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { MetricsCards } from './MetricsCards';
import { SearchAndFilter } from './SearchAndFilter';
import { ContactsTable } from './ContactsTable';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<string>('all');
  const [availableEmails, setAvailableEmails] = useState<string[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch available client emails
  useEffect(() => {
    const fetchAvailableEmails = async () => {
      try {
        const { data, error } = await supabase
          .from('client_details')
          .select('email_address')
          .order('email_address', { ascending: true });

        if (error) throw error;

        const emails = data?.map(client => client.email_address) || [];
        setAvailableEmails(emails);
      } catch (error) {
        console.error('Error fetching available emails:', error);
      }
    };

    fetchAvailableEmails();
  }, []);

  // Fetch contacts
  const fetchContacts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*');

      if (selectedEmail !== 'all') {
        query = query.eq('client_email', selectedEmail);
      }

      const { data, error } = await query.order('total_lead_score', { ascending: false, nullsLast: true });

      if (error) throw error;

      let filteredContacts = data || [];

      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredContacts = filteredContacts.filter(contact =>
          contact.full_name?.toLowerCase().includes(searchLower) ||
          contact.first_name?.toLowerCase().includes(searchLower) ||
          contact.last_name?.toLowerCase().includes(searchLower) ||
          contact.company_name?.toLowerCase().includes(searchLower) ||
          contact.job_title?.toLowerCase().includes(searchLower) ||
          contact.work_email?.toLowerCase().includes(searchLower)
        );
      }

      setContacts(filteredContacts);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [selectedEmail, searchTerm]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchContacts();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedEmail, searchTerm]);

  // Group contacts by email
  const contactsByEmail = contacts.reduce((acc, contact) => {
    const email = contact.client_email || 'unknown';
    if (!acc[email]) {
      acc[email] = [];
    }
    acc[email].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  // Calculate metrics
  const totalContacts = contacts.length;
  const accountGroups = Object.keys(contactsByEmail).length;
  const leadsAbove80 = contacts.filter(contact => (contact.total_lead_score || contact.lead_score || 0) >= 80).length;
  const readyContacts = contacts.filter(contact => contact.sent_to_client === 'Yes').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <Header onRefresh={fetchContacts} lastUpdated={lastUpdated} />
        
        <MetricsCards
          accountGroups={accountGroups}
          totalContacts={totalContacts}
          leadsAbove80={leadsAbove80}
          readyContacts={readyContacts}
        />
        
        <SearchAndFilter
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedEmail={selectedEmail}
          onEmailChange={setSelectedEmail}
          availableEmails={availableEmails}
        />
      </div>
    </div>
  );
};