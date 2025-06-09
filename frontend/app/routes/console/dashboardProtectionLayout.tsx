import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router';
import { useAuth } from '~/context/authContext';
import { Spinner } from '~/components/ui/spinner';
import { Button } from '~/components/ui/button';
import { sendEmailVerification, signOut, type User } from 'firebase/auth';
import { auth as firebaseAuth } from '~/firebase';
import DashNavbar from '~/components/myComponents/DashNavbar';

const InformativeLoading: React.FC<{ message?: string; showSpinner?: boolean }> = ({ message, showSpinner = true }) => (
  <div className="flex flex-col items-center justify-center min-h-svh p-4 text-center text-white bg-[#12151e]">
    {showSpinner && <Spinner className="mb-4 text-[#c2d2ff]" size={'large'} />}
    <p className="text-lg font-medium">{message || 'Processing...'}</p>
    {!showSpinner && message && <p className="text-sm text-gray-600 mt-2">{message}</p>}{' '}
  </div>
);

const VerifyEmailPage: React.FC<{
  user: User;
  onResend: () => Promise<void>;
  onLogout: () => void;
}> = ({ user, onResend, onLogout }) => {
  const [resending, setResending] = useState(false);
  const [resentMessage, setResentMessage] = useState('');
  const [countdown, setCountdown] = useState(0);

  const handleResend = async () => {
    if (countdown > 0) return;

    setResending(true);
    setResentMessage('');
    try {
      await onResend();
      setResentMessage(`Verification email resent to ${user.email}. Please check your inbox.`);
      setCountdown(60);
    } catch (error) {
      console.error('Error resending verification email:', error);
      setResentMessage('Failed to resend verification email. Please try again.');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div className="flex flex-col items-center justify-center min-h-svh p-4">
      <div className="bg-card p-6 md:p-8 rounded-lg shadow-lg max-w-md w-full text-center border">
        {' '}
        <h1 className="text-2xl font-semibold mb-4 text-card-foreground">Verify Your Email</h1>
        <p className="mb-6 text-muted-foreground">
          A verification link has been sent to <strong>{user.email}</strong>. Please check your inbox (and spam folder)
          and click the link to activate your account.
        </p>
        <p className="mb-1 text-sm text-muted-foreground">
          After verifying, you may need to log out and log back in, or refresh this page.
        </p>
        <p className="mb-6 text-sm text-muted-foreground">
          If you don't see the email, please check your spam folder or click resend.
        </p>
        <Button onClick={handleResend} disabled={resending || countdown > 0} className="w-full mb-3">
          {resending ? 'Resending...' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Verification Email'}
        </Button>
        <Button variant="outline" onClick={onLogout} className="w-full">
          Logout
        </Button>
        {resentMessage && (
          <p
            className={`text-sm mt-4 ${
              resentMessage.startsWith('Failed') ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {resentMessage}
          </p>
        )}
      </div>
    </div>
  );
};

const DashboardProtectionLayout: React.FC = () => {
  const { currentUser, loading: authContextLoading, initialAuthChecked } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleResendVerification = async () => {
    if (currentUser) {
      await sendEmailVerification(currentUser);
    } else {
      console.error('Attempted to resend verification but no current user found.');
      throw new Error('No user to send verification email to.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during logout from verification page:', error);
      navigate('/login', { replace: true });
    }
  };

  if (!initialAuthChecked || authContextLoading) {
    return <InformativeLoading message="Checking your access..." />;
  }

  if (!currentUser) {
    return (
      <>
        <InformativeLoading message="You are not signed in. Redirecting you to login page." />
        <Navigate to="/login" replace />
      </>
    );
  }

  if (!currentUser.emailVerified) {
    return <VerifyEmailPage user={currentUser} onResend={handleResendVerification} onLogout={handleLogout} />;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <DashNavbar />
      <main className="flex-grow flex items-center justify-center p-4">
        {' '}
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardProtectionLayout;
