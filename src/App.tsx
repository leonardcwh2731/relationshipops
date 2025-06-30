import React from 'react';
import { Dashboard } from './components/Dashboard';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
}

function App() {
  // Mock user data for direct dashboard access
  const mockUser: User = {
    id: 'mock-user-id',
    email: 'demo@relationshipops.com',
    full_name: 'Demo User',
    first_name: 'Demo',
    last_name: 'User'
  };

  const handleSignOut = () => {
    // Mock sign out - just reload the page or handle as needed
    window.location.reload();
  };

  return <Dashboard user={mockUser} onSignOut={handleSignOut} />;
}

export default App;