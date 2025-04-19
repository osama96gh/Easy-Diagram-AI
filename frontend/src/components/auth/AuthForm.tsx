import React from 'react';
import './Auth.css';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const AuthForm: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();

  // Redirect to home if already authenticated
  React.useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  return (
    <div className="auth-container">
      <h2>Welcome to Easy Diagram AI</h2>
      <Auth
        supabaseClient={supabase}
        view="sign_in"
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#007bff',
                brandAccent: '#0056b3'
              }
            }
          },
          className: {
            container: 'auth-form-container',
            button: 'auth-button',
            input: 'auth-input'
          }
        }}
        providers={[]}
        redirectTo={`${window.location.origin}/`}
      />
    </div>
  );
};
