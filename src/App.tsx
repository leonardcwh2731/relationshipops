import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Search,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Eye,
  EyeOff,
  ChevronLeft,
  Save,
  X,
  Pencil,
  Lock,
  LogOut,
  Settings,
  Home,
  Plus,
  Edit,
  Trash2
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

interface ContactCountByEmail {
  [email: string]: number;
}

interface User {
  email: string;
  password: string;
  role: 'admin' | 'member';
  name: string;
  allowedEmails: string[];
}

const App: React.FC = () => {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Sidebar states
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');
  const [users, setUsers] = useState<User[]>([
    {
      email: 'leonard.chin@veraops.com',
      password: '1410202832',
      role: 'admin',
      name: 'Leonard Chin',
      allowedEmails: []
    },
    {
      email: 'peter.kang@veraops.com',
      password: 'relationshipopsadmin2',
      role: 'admin',
      name: 'Peter Kang',
      allowedEmails: []
    }
  ]);

  // Settings states
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'member' as 'admin' | 'member',
    name: '',
    allowedEmails: [] as string[]
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [changePasswordUser, setChangePasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Modal ref for click outside
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Editing states
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  const [editedContact, setEditedContact] = useState<Contact | null>(null);
  
  // Data states
  const [clients, setClients] = useState<Client[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [totalContactsCount, setTotalContactsCount] = useState<number>(0);
  const [sentContactsCount, setSentContactsCount] = useState<number>(0);
  const [contactCountsByEmail, setContactCountsByEmail] = useState<ContactCountByEmail>({});
  const [uniqueClientEmails, setUniqueClientEmails] = useState<string[]>([]);

  // Check authentication on load
  useEffect(() => {
    const userData = localStorage.getItem('relationshipops_user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
        setIsAuthenticated(true);
        loadData();
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('relationshipops_user');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedClient]);

  // Click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleHideDetails();
      }
    };

    if (showContactDetails) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContactDetails]);

  // Authentication functions
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find(u => u.email === loginForm.email && u.password === loginForm.password);
    
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('relationshipops_user', JSON.stringify(user));
      setLoginError('');
      loadData();
    } else {
      setLoginError('Invalid email or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('relationshipops_user');
    setLoginForm({ email: '', password: '' });
    setCurrentView('dashboard');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadClients(), 
        loadContacts(), 
        loadTotalContactsCount(), 
        loadSentContactsCount(),
        loadContactCountsByEmail(),
        loadUniqueClientEmails()
      ]);
      setLastUpdated(new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }));
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUniqueClientEmails = async () => {
    try {
      console.log('📧 Loading unique client emails from database...');
      
      const { data, error } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('client_email')
        .not('client_email', 'is', null)
        .neq('client_email', '');

      if (error) {
        console.error('❌ Supabase error loading unique client emails:', error);
        throw error;
      }
      
      // Get unique emails
      const uniqueEmails = [...new Set(data?.map(contact => contact.client_email).filter(Boolean))];
      console.log('✅ Unique client emails loaded:', uniqueEmails.length, 'emails');
      setUniqueClientEmails(uniqueEmails);
    } catch (error) {
      console.error('❌ Error loading unique client emails:', error);
      setUniqueClientEmails([]);
    }
  };

  const loadSentContactsCount = async () => {
    try {
      console.log('📤 Loading sent contacts count from database...');
      
      const { count, error } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*', { count: 'exact', head: true })
        .not('sent_to_client', 'is', null)
        .neq('sent_to_client', '')
        .neq('sent_to_client', '-');

      if (error) {
        console.error('❌ Supabase error loading sent contacts count:', error);
        throw error;
      }
      
      console.log('✅ Sent contacts count from database:', count);
      setSentContactsCount(count || 0);
    } catch (error) {
      console.error('❌ Error loading sent contacts count:', error);
      setSentContactsCount(0);
    }
  };

  const loadContactCountsByEmail = async () => {
    try {
      console.log('📊 Loading contact counts by email from database...');
      
      // Get aggregated counts directly from database for better performance
      const { data, error } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('client_email')
        .not('client_email', 'is', null)
        .neq('client_email', '');

      if (error) {
        console.error('❌ Supabase error loading contact counts by email:', error);
        throw error;
      }
      
      // Count contacts per email
      const counts: ContactCountByEmail = {};
      data?.forEach(contact => {
        const email = contact.client_email || 'unknown';
        counts[email] = (counts[email] || 0) + 1;
      });
      
      console.log('✅ Contact counts by email loaded:', counts);
      console.log('📈 Summary of counts by email:');
      Object.entries(counts).forEach(([email, count]) => {
        console.log(`   📧 ${email}: ${count} contacts`);
      });
      
      setContactCountsByEmail(counts);
    } catch (error) {
      console.error('❌ Error loading contact counts by email:', error);
      setContactCountsByEmail({});
    }
  };

  const loadTotalContactsCount = async () => {
    try {
      console.log('📊 Loading total contacts count from Supabase...');
      
      const { count, error } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.error('❌ Supabase error loading total contacts count:', error);
        throw error;
      }
      
      console.log('✅ Total contacts count from database:', count);
      setTotalContactsCount(count || 0);
    } catch (error) {
      console.error('❌ Error loading total contacts count:', error);
      console.log('🔄 Falling back to contacts array length...');
      setTotalContactsCount(contacts.length);
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('client_details')
        .select('email_address, full_name, first_name, last_name')
        .order('full_name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error loading clients:', error);
      // Fallback to mock data
      setClients([
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
      ]);
    }
  };

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*')
        .order('total_lead_score', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
      // Fallback to mock data
      const mockContacts: Contact[] = [
        {
          linkedin_profile_url: 'https://www.linkedin.com/in/nadav-eitan/',
          full_name: 'Nadav Eitan',
          first_name: 'Nadav',
          last_name: 'Eitan',
          job_title: 'CEO',
          company_name: 'Emporus Technologies',
          company_domain: 'emporus.com',
          company_linkedin_url: 'https://www.linkedin.com/company/emporus-technologies/',
          work_email: 'Nadav@emporus.com',
          total_lead_score: 94,
          client_email: 'peter.kang@barrelny.com',
          last_interaction_date: '2024-01-09',
          last_interaction_summary: 'Had planned future meetings',
          last_interaction_platform: 'Email',
          talking_point_1: 'Discuss maximizing insights using deep learning methodologies',
          talking_point_2: 'Recommend strategies for integrating additional data sources effectively',
          talking_point_3: 'Share best practices for continuously analyzing vast data sets',
          company_industry: 'Computer Software',
          company_staff_count_range: '11 - 50',
          connection_count: 1131,
          followers_count: 1128,
          lead_country: 'United States',
          sent_to_client: '-',
          exact_sent_date: null,
          created_at: '2025-06-28T00:30:29Z'
        },
        {
          linkedin_profile_url: 'https://www.linkedin.com/in/jacob-sussman/',
          full_name: 'Jacob Sussman',
          first_name: 'Jacob',
          last_name: 'Sussman',
          job_title: 'CEO',
          company_name: 'BX Studio',
          company_domain: 'bx.studio',
          company_linkedin_url: 'https://www.linkedin.com/company/bx-studio/',
          work_email: 'jacob@bx.studio',
          total_lead_score: 94,
          client_email: 'peter.kang@barrelny.com',
          last_interaction_date: '2024-01-08',
          company_industry: 'Design',
          company_staff_count_range: '11 - 50'
        },
        {
          linkedin_profile_url: 'https://www.linkedin.com/in/david-kong/',
          full_name: 'David Kong',
          first_name: 'David',
          last_name: 'Kong',
          job_title: 'Founder',
          company_name: 'Somm',
          company_domain: 'somm.ai',
          company_linkedin_url: 'https://www.linkedin.com/company/somm/',
          work_email: 'david@somm.ai',
          total_lead_score: 94,
          client_email: 'peter.kang@barrelny.com',
          last_interaction_date: '2023-05-07' // More than 6 months ago
        }
      ];
      setContacts(mockContacts);
    }
  };

  const handleRefresh = () => {
    loadData();
  };

  // User management functions
  const handleAddUser = () => {
    if (!newUser.email || !newUser.password || !newUser.name) {
      alert('Please fill in all required fields');
      return;
    }

    if (users.some(u => u.email === newUser.email)) {
      alert('User with this email already exists');
      return;
    }

    const updatedUsers = [...users, { ...newUser }];
    setUsers(updatedUsers);
    setNewUser({
      email: '',
      password: '',
      role: 'member',
      name: '',
      allowedEmails: []
    });
    setShowAddUser(false);
  };

  const handleDeleteUser = (email: string) => {
    if (email === currentUser?.email) {
      alert('You cannot delete your own account');
      return;
    }
    
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.email !== email));
    }
  };

  const handleChangePassword = () => {
    if (!newPassword) {
      alert('Please enter a new password');
      return;
    }

    const updatedUsers = users.map(u => 
      u.email === changePasswordUser?.email 
        ? { ...u, password: newPassword }
        : u
    );
    setUsers(updatedUsers);
    
    if (changePasswordUser?.email === currentUser?.email) {
      const updatedCurrentUser = { ...currentUser, password: newPassword };
      setCurrentUser(updatedCurrentUser);
      localStorage.setItem('relationshipops_user', JSON.stringify(updatedCurrentUser));
    }
    
    setChangePasswordUser(null);
    setNewPassword('');
  };

  const handleToggleEmailAccess = (userEmail: string, clientEmail: string) => {
    const updatedUsers = users.map(user => {
      if (user.email === userEmail) {
        const allowedEmails = user.allowedEmails.includes(clientEmail)
          ? user.allowedEmails.filter(email => email !== clientEmail)
          : [...user.allowedEmails, clientEmail];
        return { ...user, allowedEmails };
      }
      return user;
    });
    setUsers(updatedUsers);
  };

  // Use unique client emails from the contacts table instead of client_details
  const clientOptions = uniqueClientEmails.map(email => ({
    value: email,
    label: email,
    icon: <User className="w-4 h-4" />
  }));

  // Helper function to check if interaction is older than 6 months
  const isRelevantLead = (contact: Contact) => {
    if (!contact.last_interaction_date) return false;
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const lastInteraction = new Date(contact.last_interaction_date);
    return lastInteraction < sixMonthsAgo;
  };

  // Filter contacts based on search, selected client, and user permissions
  const getFilteredContacts = () => {
    let filtered = contacts.filter(contact => {
      const matchesSearch = !searchTerm || 
        contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.work_email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesClient = selectedClient === 'all' || contact.client_email === selectedClient;
      
      // Check user permissions
      let hasPermission = true;
      if (currentUser?.role === 'member' && currentUser.allowedEmails.length > 0) {
        hasPermission = currentUser.allowedEmails.includes(contact.client_email || '');
      }
      
      return matchesSearch && matchesClient && hasPermission;
    });

    return filtered;
  };

  const filteredContacts = getFilteredContacts();

  // Group contacts by client email
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const email = contact.client_email || 'unknown';
    if (!acc[email]) {
      acc[email] = [];
    }
    acc[email].push(contact);
    return acc;
  }, {} as Record<string, Contact[]>);

  // Pagination for grouped contacts
  const accountEmails = Object.keys(groupedContacts);
  const totalAccounts = accountEmails.length;
  const totalPages = Math.ceil(totalAccounts / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAccountEmails = accountEmails.slice(startIndex, endIndex);
  const paginatedGroupedContacts = paginatedAccountEmails.reduce((acc, email) => {
    acc[email] = groupedContacts[email];
    return acc;
  }, {} as Record<string, Contact[]>);

  // Calculate metrics - these stay constant regardless of search/filter
  const metricsData = [
    {
      title: 'Account Groups',
      value: uniqueClientEmails.length // Total unique account groups
    },
    {
      title: 'Total Contacts', 
      value: totalContactsCount // Total count from database, not filtered
    },
    {
      title: 'Relevant Leads',
      value: contacts.filter(contact => isRelevantLead(contact)).length // From all contacts, not filtered
    },
    {
      title: 'Sent Contacts',
      value: sentContactsCount // Total sent contacts from database
    }
  ];

  const toggleAccountExpansion = (email: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(email)) {
      newExpanded.delete(email);
    } else {
      newExpanded.add(email);
    }
    setExpandedAccounts(newExpanded);
  };

  const handleShowDetails = (contact: Contact) => {
    setSelectedContact(contact);
    setEditedContact({ ...contact });
    setShowContactDetails(true);
    setEditingFields(new Set());
  };

  const handleHideDetails = () => {
    setShowContactDetails(false);
    setSelectedContact(null);
    setEditedContact(null);
    setEditingFields(new Set());
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedAccounts(new Set()); // Collapse all when changing pages
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    setExpandedAccounts(new Set());
  };

  // Editing functions
  const handleEditField = (fieldName: string) => {
    if (currentUser?.role === 'member') {
      alert('Members do not have permission to edit fields');
      return;
    }
    const newEditingFields = new Set(editingFields);
    newEditingFields.add(fieldName);
    setEditingFields(newEditingFields);
  };

  const handleSaveField = async (fieldName: string) => {
    const newEditingFields = new Set(editingFields);
    newEditingFields.delete(fieldName);
    setEditingFields(newEditingFields);
    
    // Save to database
    if (editedContact && selectedContact) {
      try {
        const { error } = await supabase
          .from('icp_contacts_tracking_in_progress')
          .update({ [fieldName]: editedContact[fieldName as keyof Contact] })
          .eq('linkedin_profile_url', selectedContact.linkedin_profile_url);

        if (error) throw error;
        
        // Update the selected contact
        setSelectedContact({ ...selectedContact, [fieldName]: editedContact[fieldName as keyof Contact] });
        
        console.log('Field saved successfully:', fieldName);
      } catch (error) {
        console.error('Error saving field:', error);
      }
    }
  };

  const handleCancelEdit = (fieldName: string) => {
    const newEditingFields = new Set(editingFields);
    newEditingFields.delete(fieldName);
    setEditingFields(newEditingFields);
    // Revert the edited value
    if (selectedContact && editedContact) {
      setEditedContact({
        ...editedContact,
        [fieldName]: selectedContact[fieldName as keyof Contact]
      });
    }
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    if (editedContact) {
      setEditedContact({
        ...editedContact,
        [fieldName]: value
      });
    }
  };

  // Get lead score color
  const getLeadScoreColor = (score: number | undefined) => {
    if (!score) return 'bg-gray-100 text-gray-800';
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Format date function
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // Pagination component
  const Pagination: React.FC<{
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    itemsPerPage: number;
    onItemsPerPageChange: (items: number) => void;
    totalItems: number;
  }> = ({ 
    currentPage, 
    totalPages, 
    onPageChange, 
    itemsPerPage, 
    onItemsPerPageChange, 
    totalItems
  }) => {
    const getVisiblePages = () => {
      const pages = [];
      const maxVisible = 5;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {getVisiblePages().map((page, index) => (
              <button
                key={index}
                onClick={() => typeof page === 'number' ? onPageChange(page) : null}
                disabled={page === '...'}
                className={`px-3 py-2 rounded border text-sm ${
                  page === currentPage
                    ? 'bg-blue-600 text-white border-blue-600'
                    : page === '...'
                    ? 'border-transparent cursor-default'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Editable field component
  const EditableField: React.FC<{ 
    label: string; 
    fieldName: string;
    value: string | number | null | undefined;
    isRight?: boolean;
    isLink?: boolean;
    type?: 'text' | 'textarea';
  }> = ({ label, fieldName, value, isRight = false, isLink = false, type = 'text' }) => {
    const isEditing = editingFields.has(fieldName);
    const displayValue = editedContact?.[fieldName as keyof Contact] || value || 'N/A';

    const renderValue = () => {
      if (fieldName === 'last_interaction_date' || fieldName === 'exact_sent_date' || fieldName === 'created_at') {
        return formatDate(value as string);
      }
      return displayValue;
    };

    return (
      <div className="flex justify-between items-start group">
        <span className="text-sm text-gray-500 pt-1 flex-shrink-0 mr-4">{label}:</span>
        <div className="flex items-start flex-1 min-w-0">
          {isEditing ? (
            <div className="flex flex-col gap-2 w-full">
              {type === 'textarea' ? (
                <textarea
                  value={displayValue}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 w-full resize-none"
                  rows={3}
                />
              ) : (
                <input
                  type="text"
                  value={displayValue}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
                />
              )}
              <div className="flex gap-1">
                <button
                  onClick={() => handleSaveField(fieldName)}
                  className="p-1 text-green-600 hover:text-green-800"
                >
                  <Save className="w-3 h-3" />
                </button>
                <button
                  onClick={() => handleCancelEdit(fieldName)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-end w-full min-w-0">
              {isLink && fieldName === 'work_email' ? (
                <a 
                  href={`mailto:${displayValue}`}
                  className="text-sm text-blue-600 text-right hover:underline truncate"
                >
                  {displayValue}
                </a>
              ) : isLink && fieldName === 'company_domain' ? (
                <a 
                  href={`https://${displayValue}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 text-right hover:underline truncate"
                >
                  {displayValue}
                </a>
              ) : isLink ? (
                <span className="text-sm text-blue-600 text-right truncate">{displayValue}</span>
              ) : (
                <span className={`text-sm text-gray-900 ${isRight ? 'text-right' : ''} truncate`}>
                  {renderValue()}
                </span>
              )}
              {currentUser?.role === 'admin' && (
                <button
                  onClick={() => handleEditField(fieldName)}
                  className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-blue-600 flex-shrink-0"
                >
                  <Pencil className="w-3 h-3 text-gray-400" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Editable link component for View Profile and View Company
  const EditableLink: React.FC<{ 
    label: string; 
    fieldName: string;
    href: string;
    target?: string;
  }> = ({ label, fieldName, href, target = "_blank" }) => {
    const isEditing = editingFields.has(fieldName);
    const displayValue = editedContact?.[fieldName as keyof Contact] || href || '';

    return (
      <div className="pt-4 group">
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={displayValue}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
              placeholder="Enter full URL"
            />
            <div className="flex gap-1">
              <button
                onClick={() => handleSaveField(fieldName)}
                className="p-1 text-green-600 hover:text-green-800"
              >
                <Save className="w-3 h-3" />
              </button>
              <button
                onClick={() => handleCancelEdit(fieldName)}
                className="p-1 text-red-600 hover:text-red-800"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <a 
              href={displayValue || href}
              target={target}
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              {label}
            </a>
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => handleEditField(fieldName)}
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-blue-600"
              >
                <Pencil className="w-3 h-3 text-gray-400" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center bg-black rounded-full">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              RelationshipOps Dashboard
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Powered By VeraOps - Secure Access Required
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter password"
                />
              </div>
            </div>

            {loginError && (
              <div className="text-red-600 text-sm text-center">
                {loginError}
              </div>
            )}

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Sign In
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-lg font-semibold text-gray-900">RelationshipOps</h1>
          <p className="text-sm text-gray-500">Powered By VeraOps</p>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Home className="w-4 h-4 mr-3" />
              Dashboard
            </button>
            
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setCurrentView('settings')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentView === 'settings'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </button>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentView === 'dashboard' ? (
          <>
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Contact relationship management</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">Last updated: {lastUpdated}</span>
                    <button
                      onClick={handleRefresh}
                      className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Content */}
            <div className="flex-1 overflow-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {metricsData.map((metric, index) => (
                    <div key={index} className="bg-black text-white rounded-lg p-6">
                      <div className="text-3xl font-bold mb-2">
                        {metric.value.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-300">{metric.title}</div>
                    </div>
                  ))}
                </div>

                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search contacts by name, company, job title, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="w-64">
                    <CustomDropdown
                      value={selectedClient}
                      onChange={setSelectedClient}
                      options={clientOptions}
                      placeholder="All Account Emails"
                    />
                  </div>
                </div>

                {/* Contacts Section */}
                <div className="bg-white rounded-lg shadow">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Contacts by Account Email</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Sorted by lead score (highest first) • Auto-refreshes every 30 seconds
                    </p>
                  </div>

                  <div className="divide-y divide-gray-200">
                    {Object.entries(paginatedGroupedContacts).map(([email, emailContacts]) => {
                      const isExpanded = expandedAccounts.has(email);
                      const relevantLeadsCount = emailContacts.filter(contact => isRelevantLead(contact)).length;
                      const totalContactsForEmail = contactCountsByEmail[email] || emailContacts.length;
                      
                      return (
                        <div key={email} className="p-4">
                          <button
                            onClick={() => toggleAccountExpansion(email)}
                            className="w-full flex items-center justify-between text-left hover:bg-gray-50 p-2 rounded-lg transition-colors"
                          >
                            <div className="flex items-center">
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-400 mr-2" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-400 mr-2" />
                              )}
                              <span className="font-medium text-gray-900">{email}</span>
                              <span className="ml-2 text-sm text-gray-500">
                                {totalContactsForEmail} contacts • Relevant Leads: 
                                <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                  {relevantLeadsCount}
                                </span>
                              </span>
                            </div>
                          </button>

                          {isExpanded && (
                            <div className="mt-4">
                              <div className="max-w-full overflow-x-auto">
                                <table className="min-w-full table-fixed" style={{ width: '100%', maxWidth: '100vw' }}>
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="w-44 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                      </th>
                                      <th className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Job Title
                                      </th>
                                      <th className="w-40 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Company
                                      </th>
                                      <th className="w-16 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Score
                                      </th>
                                      <th className="w-28 px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {emailContacts
                                      .sort((a, b) => (b.total_lead_score || 0) - (a.total_lead_score || 0))
                                      .map((contact) => (
                                      <tr key={contact.linkedin_profile_url} className="hover:bg-gray-50">
                                        <td className="w-44 px-2 py-4">
                                          <div className="min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate" title={contact.full_name}>
                                              {contact.full_name}
                                            </div>
                                            <a 
                                              href={`mailto:${contact.work_email}`}
                                              className="text-xs text-blue-600 truncate hover:underline block"
                                              title={contact.work_email}
                                            >
                                              {contact.work_email}
                                            </a>
                                          </div>
                                        </td>
                                        <td className="w-28 px-2 py-4">
                                          <div className="text-sm text-gray-900 truncate" title={contact.job_title}>
                                            {contact.job_title}
                                          </div>
                                        </td>
                                        <td className="w-40 px-2 py-4">
                                          <div className="min-w-0">
                                            <div className="text-sm text-gray-900 truncate" title={contact.company_name}>
                                              {contact.company_name}
                                            </div>
                                            <a 
                                              href={`https://${contact.company_domain}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-blue-600 truncate hover:underline block"
                                              title={contact.company_domain}
                                            >
                                              {contact.company_domain}
                                            </a>
                                          </div>
                                        </td>
                                        <td className="w-16 px-2 py-4">
                                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getLeadScoreColor(contact.total_lead_score)}`}>
                                            {contact.total_lead_score || 0}
                                          </span>
                                        </td>
                                        <td className="w-28 px-2 py-4">
                                          <button
                                            onClick={() => handleShowDetails(contact)}
                                            className="text-black hover:text-gray-700 text-sm whitespace-nowrap flex items-center w-full"
                                          >
                                            <ChevronRight className="w-4 h-4 mr-1 flex-shrink-0" />
                                            <span className="flex-shrink-0">Show Details</span>
                                          </button>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {Object.keys(paginatedGroupedContacts).length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                      No contacts found matching your criteria.
                    </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      itemsPerPage={itemsPerPage}
                      onItemsPerPageChange={handleItemsPerPageChange}
                      totalItems={totalAccounts}
                    />
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Settings View */
          <div className="flex-1 overflow-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage users and permissions</p>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                  <button
                    onClick={() => setShowAddUser(true)}
                    className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email Access
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.email}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.role === 'admin' ? (
                              <span className="text-sm text-gray-500">All accounts</span>
                            ) : (
                              <div className="space-y-2">
                                {uniqueClientEmails.map((email) => (
                                  <label key={email} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      checked={user.allowedEmails.includes(email)}
                                      onChange={() => handleToggleEmailAccess(user.email, email)}
                                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{email}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => setChangePasswordUser(user)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Change Password
                            </button>
                            {user.email !== currentUser?.email && (
                              <button
                                onClick={() => handleDeleteUser(user.email)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Add New User</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value as 'admin' | 'member'})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUser}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Add User
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {changePasswordUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Changing password for {changePasswordUser.name}
                </p>
              </div>
              <div className="p-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter new password"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setChangePasswordUser(null);
                    setNewPassword('');
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Update Password
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Details Modal */}
        {showContactDetails && selectedContact && editedContact && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div 
              ref={modalRef}
              className="bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto"
              style={{ maxWidth: '90vw', width: 'auto', minWidth: '1200px' }}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedContact.full_name}</h3>
                    <a 
                      href={`mailto:${selectedContact.work_email}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {selectedContact.work_email}
                    </a>
                  </div>
                  <button
                    onClick={handleHideDetails}
                    className="flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Hide Details
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 1.5fr 2fr', // Lead Info: 1.2 units, Company Info: 1.5 units, Daily Digest: 2 units
                  gap: '2rem'
                }}>
                  {/* Lead Information */}
                  <div>
                    <h4 className="text-sm font-medium text-blue-600 mb-4 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Lead Information
                    </h4>
                    <div className="space-y-3">
                      <EditableField label="Full Name" fieldName="full_name" value={selectedContact.full_name} isRight />
                      <EditableField label="First Name" fieldName="first_name" value={selectedContact.first_name} isRight />
                      <EditableField label="Last Name" fieldName="last_name" value={selectedContact.last_name} isRight />
                      <EditableField label="Job Title" fieldName="job_title" value={selectedContact.job_title} isRight />
                      <EditableField label="Work Email" fieldName="work_email" value={selectedContact.work_email} isLink isRight />
                      <EditableField label="Country" fieldName="lead_country" value={selectedContact.lead_country} isRight />
                      <EditableField label="LinkedIn Connections" fieldName="connection_count" value={selectedContact.connection_count} isRight />
                      <EditableField label="LinkedIn Followers" fieldName="followers_count" value={selectedContact.followers_count} isRight />
                      <EditableLink 
                        label="View Profile" 
                        fieldName="linkedin_profile_url" 
                        href={selectedContact.linkedin_profile_url || '#'} 
                      />
                    </div>
                  </div>

                  {/* Company Information */}
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-4 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Company Information
                    </h4>
                    <div className="space-y-3">
                      <EditableField label="Company Name" fieldName="company_name" value={selectedContact.company_name} isRight />
                      <EditableField label="Company Domain" fieldName="company_domain" value={selectedContact.company_domain} isLink isRight />
                      <EditableField label="Company Industry" fieldName="company_industry" value={selectedContact.company_industry} isRight />
                      <EditableField label="Company Staff Range" fieldName="company_staff_count_range" value={selectedContact.company_staff_count_range} isRight />
                      <EditableLink 
                        label="View Company" 
                        fieldName="company_linkedin_url" 
                        href={selectedContact.company_linkedin_url || `https://${selectedContact.company_domain}`} 
                      />
                    </div>
                  </div>

                  {/* Daily Digest Information */}
                  <div>
                    <h4 className="text-sm font-medium text-purple-600 mb-4 flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      Daily Digest Information
                    </h4>
                    <div className="space-y-3">
                      <EditableField 
                        label="Last Interaction Summary" 
                        fieldName="last_interaction_summary"
                        value={selectedContact.last_interaction_summary} 
                        isRight 
                        type="textarea"
                      />
                      <EditableField label="Last Interaction Platform" fieldName="last_interaction_platform" value={selectedContact.last_interaction_platform} isRight />
                      <EditableField 
                        label="Last Interaction Date" 
                        fieldName="last_interaction_date"
                        value={selectedContact.last_interaction_date}
                        isRight
                      />
                      <EditableField 
                        label="Talking Point 1" 
                        fieldName="talking_point_1"
                        value={selectedContact.talking_point_1} 
                        isRight 
                        type="textarea"
                      />
                      <EditableField 
                        label="Talking Point 2" 
                        fieldName="talking_point_2"
                        value={selectedContact.talking_point_2} 
                        isRight 
                        type="textarea"
                      />
                      <EditableField 
                        label="Talking Point 3" 
                        fieldName="talking_point_3"
                        value={selectedContact.talking_point_3} 
                        isRight 
                        type="textarea"
                      />
                      <EditableField label="Sent to Client" fieldName="sent_to_client" value={selectedContact.sent_to_client} isRight />
                      <EditableField label="Sent Date" fieldName="exact_sent_date" value={selectedContact.exact_sent_date} isRight />
                      <EditableField 
                        label="Added On" 
                        fieldName="created_at"
                        value={selectedContact.created_at}
                        isRight
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;