import React, { useState, useEffect } from 'react';
import { SignInPage } from './components/SignInPage';
import { Dashboard } from './components/Dashboard';
import { supabase } from './lib/supabase';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already signed in
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Get user details from client_details table
          const { data: clientData } = await supabase
            .from('client_details')
            .select('*')
            .eq('email_address', session.user.email)
            .single();

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: clientData?.full_name || '',
            first_name: clientData?.first_name || '',
            last_name: clientData?.last_name || ''
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: clientData } = await supabase
          .from('client_details')
          .select('*')
          .eq('email_address', session.user.email)
          .single();

        setUser({
          id: session.user.id,
          email: session.user.email || '',
          full_name: clientData?.full_name || '',
          first_name: clientData?.first_name || '',
          last_name: clientData?.last_name || ''
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <SignInPage onSignIn={setUser} />;
  }

  return <Dashboard user={user} onSignOut={() => setUser(null)} />;
}

export default App;