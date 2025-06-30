import React from 'react';
import { ContactCard } from './ContactCard';
import { Pagination } from './Pagination';
import { Contact } from '../types/Contact';
import { Users } from 'lucide-react';

interface ContactsListProps {
  contacts: Contact[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  totalContacts: number;
  onPageChange: (page: number) => void;
  selectedEmail: string;
}

export const ContactsList: React.FC<ContactsListProps> = ({
  contacts,
  loading,
  currentPage,
  totalPages,
  totalContacts,
  onPageChange,
  selectedEmail
}) => {
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-12 text-center">
        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No contacts found</h3>
        <p className="text-gray-600">
          {selectedEmail === 'all' 
            ? 'No contacts are available in the database.' 
            : `No contacts found for ${selectedEmail}.`}
        </p>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * 50 + 1;
  const endIndex = Math.min(currentPage * 50, totalContacts);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            Contacts {selectedEmail !== 'all' && `for ${selectedEmail}`}
          </h2>
          <p className="text-sm text-gray-500">
            Showing {startIndex}-{endIndex} of {totalContacts.toLocaleString()} contacts
          </p>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {contacts.map((contact, index) => (
          <ContactCard key={contact.linkedin_profile_url || index} contact={contact} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
};