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
  Menu,
  Settings,
  BarChart3,
  Plus,
  Trash2,
  Edit
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

interface AppUser {
  email: string;
  password: string;
  role: 'Admin' | 'Member';
  allowedEmails?: string[]; // For member access restriction
}

const App: React.FC = () => {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');

  // Settings states
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState<{
    email: string;
    password: string;
    role: 'Admin' | 'Member';
    allowedEmails: string[];
  }>({
    email: '',
    password: '',
    role: 'Member',
    allowedEmails: []
  });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [users, setUsers] = useState<AppUser[]>([
    {
      email: 'leonard.chin@veraops.com',
      password: '1410202832',
      role: 'Admin'
    },
    {
      email: 'peter.kang@veraops.com',
      password: 'relationshipopsadmin2',
      role: 'Admin'
    }
  ]);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

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
    const authData = localStorage.getItem('relationshipops_auth');
    if (authData) {
      try {
        const { user } = JSON.parse(authData);
        const storedUsers = JSON.parse(localStorage.getItem('relationshipops_users') || '[]');
        setUsers(storedUsers.length > 0 ? storedUsers : users);
        setCurrentUser(user);
        setIsAuthenticated(true);
        loadData();
      } catch (error) {
        localStorage.removeItem('relationshipops_auth');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  // Save users to localStorage whenever users state changes
  useEffect(() => {
    localStorage.setItem('relationshipops_users', JSON.stringify(users));
  }, [users]);

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
      localStorage.setItem('relationshipops_auth', JSON.stringify({ user }));
      setLoginError('');
      loadData();
    } else {
      setLoginError('Invalid email or password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('relationshipops_auth');
    setLoginForm({ email: '', password: '' });
    setActiveTab('dashboard');
  };

  // User management functions
  const handleCreateUser = () => {
    if (!newUser.email || !newUser.password) return;
    
    const userExists = users.some(u => u.email === newUser.email);
    if (userExists) {
      alert('User with this email already exists');
      return;
    }

    const userData: AppUser = {
      email: newUser.email,
      password: newUser.password,
      role: newUser.role,
      ...(newUser.role === 'Member' && newUser.allowedEmails.length > 0 && {
        allowedEmails: newUser.allowedEmails
      })
    };

    setUsers([...users, userData]);
    setNewUser({
      email: '',
      password: '',
      role: 'Member',
      allowedEmails: []
    });
    setShowCreateUser(false);
  };

  const handleDeleteUser = (email: string) => {
    if (currentUser?.email === email) {
      alert('Cannot delete your own account');
      return;
    }
    
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(u => u.email !== email));
    }
  };

  const handleEditUser = (user: AppUser) => {
    setEditingUser({ ...user });
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;
    
    setUsers(users.map(u => u.email === editingUser.email ? editingUser : u));
    setEditingUser(null);
  };

  const handleChangePassword = () => {
    if (!currentUser) return;
    
    if (currentUser.password !== passwordForm.currentPassword) {
      alert('Current password is incorrect');
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      alert('New password must be at least 6 characters long');
      return;
    }

    const updatedUser = { ...currentUser, password: passwordForm.newPassword };
    setUsers(users.map(u => u.email === currentUser.email ? updatedUser : u));
    setCurrentUser(updatedUser);
    localStorage.setItem('relationshipops_auth', JSON.stringify({ user: updatedUser }));
    
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowChangePassword(false);
    alert('Password changed successfully');
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
      const { data, error } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('client_email')
        .not('client_email', 'is', null)
        .neq('client_email', '')
        .limit(100000); // Fetch all records

      if (error) throw error;
      
      console.log('Fetched unique client emails data length:', data?.length || 0);
      
      // Get unique emails with normalization
      const uniqueEmails = [...new Set(
        data?.map(contact => contact.client_email?.trim().toLowerCase()).filter(Boolean)
      )];
      setUniqueClientEmails(uniqueEmails);
    } catch (error) {
      console.error('Error loading unique client emails:', error);
      setUniqueClientEmails([]);
    }
  };

  const loadSentContactsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*', { count: 'exact', head: true })
        .not('sent_to_client', 'is', null)
        .neq('sent_to_client', '')
        .neq('sent_to_client', '-');

      if (error) throw error;
      setSentContactsCount(count || 0);
    } catch (error) {
      console.error('Error loading sent contacts count:', error);
      setSentContactsCount(0);
    }
  };

  const loadContactCountsByEmail = async () => {
    try {
      const { data, error } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('client_email')
        .limit(100000); // Fetch all records

      if (error) throw error;
      
      console.log('Fetched contact counts data length:', data?.length || 0);
      
      // Count contacts per email with normalization
      const counts: ContactCountByEmail = {};
      data?.forEach(contact => {
        const email = contact.client_email?.trim().toLowerCase() || 'unknown';
        counts[email] = (counts[email] || 0) + 1;
      });
      
      console.log('Contact counts by email:', counts);
      setContactCountsByEmail(counts);
    } catch (error) {
      console.error('Error loading contact counts by email:', error);
      setContactCountsByEmail({});
    }
  };

  const loadTotalContactsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('icp_contacts_tracking_in_progress')
        .select('*', { count: 'exact', head: true });

      if (error) throw error;
      console.log('Total contacts count from Supabase:', count);
      setTotalContactsCount(count || 0);
    } catch (error) {
      console.error('Error loading total contacts count:', error);
      // Fallback to filtered contacts length if Supabase fails
      setTotalContactsCount(contacts.length);
    }
  };

  const loadClients = async () => {
    try {
      const { data, error } = await supabase
        .from('client_details')
        .select('email_address, full_name, first_name, last_name')
        .order('full_name')
        .limit(100000); // Fetch all records

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
        .order('total_lead_score', { ascending: false })
        .limit(100000); // Fetch all records

      if (error) throw error;
      console.log('Fetched contacts data length:', data?.length || 0);
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

  // Helper function to get lead score color
  const getLeadScoreColor = (score: number | undefined): string => {
    if (!score) return 'bg-red-100 text-red-800';
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Filter contacts based on search, selected client, and user permissions
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchTerm || 
      contact.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.work_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const normalizedContactEmail = contact.client_email?.trim().toLowerCase();
    const normalizedSelectedClient = selectedClient?.trim().toLowerCase();
    const matchesClient = selectedClient === 'all' || normalizedContactEmail === normalizedSelectedClient;
    
    // Check user permissions
    const hasAccess = currentUser?.role === 'Admin' || 
      !currentUser?.allowedEmails || 
      currentUser.allowedEmails.length === 0 ||
      currentUser.allowedEmails.some(allowed => allowed.trim().toLowerCase() === normalizedContactEmail);
    
    return matchesSearch && matchesClient && hasAccess;
  });

  // Group contacts by client email
  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const email = contact.client_email?.trim().toLowerCase() || 'unknown';
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

  // Get allowed client emails for current user
  const getAllowedClientEmails = () => {
    if (currentUser?.role === 'Admin') {
      return uniqueClientEmails;
    }
    if (currentUser?.allowedEmails && currentUser.allowedEmails.length > 0) {
      return currentUser.allowedEmails.filter(email => 
        uniqueClientEmails.includes(email.trim().toLowerCase())
      );
    }
    return uniqueClientEmails;
  };

  // Calculate metrics - these stay constant regardless of search/filter but respect user permissions
  const allowedEmails = getAllowedClientEmails();
  const allowedContacts = contacts.filter(contact => {
    const normalizedContactEmail = contact.client_email?.trim().toLowerCase();
    return currentUser?.role === 'Admin' || 
      !currentUser?.allowedEmails || 
      currentUser.allowedEmails.length === 0 ||
      allowedEmails.some(allowed => allowed.trim().toLowerCase() === normalizedContactEmail);
  });

  const metricsData = [
    {
      title: 'Account Groups',
      value: allowedEmails.length // Allowed account groups for current user
    },
    {
      title: 'Total Contacts', 
      value: allowedContacts.length // Total allowed contacts for current user
    },
    {
      title: 'Relevant Leads',
      value: allowedContacts.filter(contact => isRelevantLead(contact)).length // From allowed contacts
    },
    {
      title: 'Sent Contacts',
      value: allowedContacts.filter(contact => 
        contact.sent_to_client && 
        contact.sent_to_client !== '' && 
        contact.sent_to_client !== '-'
      ).length // Sent contacts from allowed contacts
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
    if (currentUser?.role !== 'Admin') return; // Only admin can edit
    
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

  // Format date function
  const formatDate = (dateString: string | null | undefined): string => {
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
    const canEdit = currentUser?.role === 'Admin';

    return (
      <div className="flex justify-between items-start group">
        <span className="text-sm text-gray-500 pt-1 min-w-[120px]">{label}:</span>
        <div className="flex items-start flex-1 ml-4">
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
            <div className="flex items-center justify-end w-full">
              {isLink && fieldName === 'work_email' ? (
                <a 
                  href={`mailto:${displayValue}`}
                  className="text-sm text-blue-600 text-right hover:underline break-all"
                >
                  {displayValue}
                </a>
              ) : isLink && fieldName === 'company_domain' ? (
                <a 
                  href={`https://${displayValue}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 text-right hover:underline break-all"
                >
                  {displayValue}
                </a>
              ) : isLink ? (
                <span className="text-sm text-blue-600 text-right break-all">{displayValue}</span>
              ) : (
                <span className={`text-sm text-gray-900 ${isRight ? 'text-right' : ''} break-words`}>
                  {displayValue}
                </span>
              )}
              {canEdit && (
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
    const canEdit = currentUser?.role === 'Admin';

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
            {canEdit && (
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
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-gray-900">RelationshipOps</h1>
                <p className="text-sm text-gray-500">Powered By VeraOps</p>
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            <li>
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-5 h-5 mr-3" />
                {sidebarOpen && <span>Dashboard</span>}
              </button>
            </li>
            {currentUser?.role === 'Admin' && (
              <li>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === 'settings' 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  {sidebarOpen && <span>Settings</span>}
                </button>
              </li>
            )}
          </ul>
        </nav>

        <div className="p-4 border-t border-gray-200">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-sm text-gray-500">Signed in as</p>
              <p className="text-sm font-medium text-gray-900">{currentUser?.email}</p>
              <p className="text-xs text-gray-400">{currentUser?.role}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'dashboard' ? (
          <>
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-600 mt-1">Contact Management</p>
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
            <div className="flex-1 overflow-y-auto">
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
                      options={allowedEmails.map(email => ({
                        value: email,
                        label: email,
                        icon: <User className="w-4 h-4" />
                      }))}
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
          /* Settings Tab */
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage users and access permissions</p>
              </div>

              {/* Change Password Section */}
              <div className="bg-white rounded-lg shadow mb-8">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                  <p className="text-sm text-gray-500 mt-1">Update your account password</p>
                </div>
                <div className="p-6">
                  {!showChangePassword ? (
                    <button
                      onClick={() => setShowChangePassword(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </button>
                  ) : (
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleChangePassword}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Update Password
                        </button>
                        <button
                          onClick={() => {
                            setShowChangePassword(false);
                            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          }}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* User Management Section */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage dashboard users and their permissions</p>
                    </div>
                    <button
                      onClick={() => setShowCreateUser(true)}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create User
                    </button>
                  </div>
                </div>

                {/* Create User Form */}
                {showCreateUser && (
                  <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={newUser.email}
                          onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="user@example.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                          type="password"
                          value={newUser.password}
                          onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                          value={newUser.role}
                          onChange={(e) => setNewUser({...newUser, role: e.target.value as 'Admin' | 'Member'})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="Member">Member</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                      {newUser.role === 'Member' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Emails (Optional)</label>
                          <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                            {uniqueClientEmails.map(email => (
                              <label key={email} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={newUser.allowedEmails.includes(email)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setNewUser({
                                        ...newUser,
                                        allowedEmails: [...newUser.allowedEmails, email]
                                      });
                                    } else {
                                      setNewUser({
                                        ...newUser,
                                        allowedEmails: newUser.allowedEmails.filter(e => e !== email)
                                      });
                                    }
                                  }}
                                  className="mr-2"
                                />
                                <span className="text-sm">{email}</span>
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Leave empty to allow access to all emails</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={handleCreateUser}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Create User
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateUser(false);
                          setNewUser({ email: '', password: '', role: 'Member', allowedEmails: [] });
                        }}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Users List */}
                <div className="divide-y divide-gray-200">
                  {users.map((user) => (
                    <div key={user.email} className="p-6">
                      {editingUser?.email === user.email ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                              <input
                                type="email"
                                value={editingUser.email}
                                onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                              <select
                                value={editingUser.role}
                                onChange={(e) => setEditingUser({...editingUser, role: e.target.value as 'Admin' | 'Member'})}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="Member">Member</option>
                                <option value="Admin">Admin</option>
                              </select>
                            </div>
                            {editingUser.role === 'Member' && (
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Emails</label>
                                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                                  {uniqueClientEmails.map(email => (
                                    <label key={email} className="flex items-center">
                                      <input
                                        type="checkbox"
                                        checked={editingUser.allowedEmails?.includes(email) || false}
                                        onChange={(e) => {
                                          const currentAllowed = editingUser.allowedEmails || [];
                                          if (e.target.checked) {
                                            setEditingUser({
                                              ...editingUser,
                                              allowedEmails: [...currentAllowed, email]
                                            });
                                          } else {
                                            setEditingUser({
                                              ...editingUser,
                                              allowedEmails: currentAllowed.filter(e => e !== email)
                                            });
                                          }
                                        }}
                                        className="mr-2"
                                      />
                                      <span className="text-sm">{email}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={handleUpdateUser}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Save Changes
                            </button>
                            <button
                              onClick={() => setEditingUser(null)}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-medium text-gray-900">{user.email}</h3>
                              {currentUser?.email === user.email && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">You</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">Role: {user.role}</p>
                            {user.role === 'Member' && user.allowedEmails && user.allowedEmails.length > 0 && (
                              <p className="text-sm text-gray-600">
                                Access to: {user.allowedEmails.length} specific email{user.allowedEmails.length !== 1 ? 's' : ''}
                              </p>
                            )}
                            {user.role === 'Member' && (!user.allowedEmails || user.allowedEmails.length === 0) && (
                              <p className="text-sm text-gray-600">Access to: All emails</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="p-2 text-blue-600 hover:text-blue-800 rounded-lg hover:bg-blue-50"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {currentUser?.email !== user.email && (
                              <button
                                onClick={() => handleDeleteUser(user.email)}
                                className="p-2 text-red-600 hover:text-red-800 rounded-lg hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
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
                  gridTemplateColumns: '1.5fr 1.5fr 2fr', // More space for Lead Info and Company Info
                  gap: '3rem' // More spacing between sections
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
                      <EditableField label="Work Email" fieldName="work_email" value={selectedContact.work_email} isRight isLink />
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
                      <EditableField label="Company Domain" fieldName="company_domain" value={selectedContact.company_domain} isRight isLink />
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
                        value={formatDate(selectedContact.last_interaction_date)}
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
                      <EditableField 
                        label="Sent Date" 
                        fieldName="exact_sent_date" 
                        value={formatDate(selectedContact.exact_sent_date)} 
                        isRight
                      />
                      <EditableField 
                        label="Added On" 
                        fieldName="created_at"
                        value={formatDate(selectedContact.created_at)}
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