import { useState, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Link, useNavigate } from 'react-router';
import { auth } from '~/firebase';
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut,
  sendEmailVerification,
} from 'firebase/auth';
import { useAuth } from '~/context/authContext';
import { Spinner } from '~/components/ui/spinner';
import MainFooter from '~/components/myComponents/MainFooter';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  const navigate = useNavigate();
  const authContext = useAuth();

  const currentUser = authContext?.currentUser;
  const initialAuthLoading = !authContext?.initialAuthChecked || authContext?.loading;

  useEffect(() => {
    document.title = 'Sign In - Renaissance';
  }, []);

  useEffect(() => {
    if (!initialAuthLoading && currentUser && currentUser.emailVerified) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, initialAuthLoading, navigate]);

  if (initialAuthLoading && !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh p-4 bg-[#12151e] text-white">
        {' '}
        <Spinner className="mb-2 text-[#c2d2ff]" size={'large'} />
        <div>Checking authentication...</div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResendMessage('');
    setShowResendVerification(false);
    setLoading(true);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (userCredential.user) {
        if (!userCredential.user.emailVerified) {
          setError(
            'Your email address has not been verified. Please check your inbox (and spam folder) for the verification link.'
          );
          setShowResendVerification(true);
          await signOut(auth);
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('Firebase login error:', err);
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        setError('Invalid email or password.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed login attempts. Please try again later or reset your password.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerificationEmail = async () => {
    if (auth.currentUser && auth.currentUser.email === email && !auth.currentUser.emailVerified) {
      setResending(true);
      setResendMessage('');
      try {
        await sendEmailVerification(auth.currentUser);
        setResendMessage('Verification email resent. Please check your inbox.');
        setShowResendVerification(false); // Sembunyikan tombol setelah berhasil
      } catch (error) {
        console.error('Error resending verification email:', error);
        setResendMessage('Failed to resend verification email.');
      } finally {
        setResending(false);
      }
    } else {
      setResendMessage(
        'Could not resend. Please ensure your email is correct or try logging in again after checking your inbox.'
      );

      setError(
        'Please check your email for the verification link. If you need it resent, try registering again or contact support.'
      );
      setShowResendVerification(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-svh p-4">
      {' '}
      <Card className="p-3 max-w-lg w-full">
        {' '}
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Sign In</CardTitle>
          <CardDescription className="text-lg">Please enter your email and password</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="[&>*]:my-3">
            <div>
              <label htmlFor="email-input" className="text-sm block mb-1">
                Email
              </label>
              <Input
                id="email-input"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || resending}
                required
              />
            </div>
            <div>
              <label htmlFor="password-input" className="text-sm block mb-1">
                Password
              </label>
              <Input
                id="password-input"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || resending}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            {resendMessage && (
              <p
                className={`text-sm text-center mt-2 ${
                  resendMessage.startsWith('Failed') || resendMessage.startsWith('Could not')
                    ? 'text-destructive'
                    : 'text-green-600'
                }`}
              >
                {resendMessage}
              </p>
            )}

            {showResendVerification && (
              <Button
                type="button"
                variant="link"
                className="w-full cursor-pointer"
                onClick={handleResendVerificationEmail}
                disabled={resending || loading}
              >
                {resending ? 'Resending...' : 'Resend Verification Email'}
              </Button>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-5">
            <div className="flex w-full items-center justify-between">
              <label
                htmlFor="terms1"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center cursor-pointer"
              >
                <Checkbox
                  className="mr-2"
                  id="terms1"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                  disabled={loading || resending}
                />
                Remember me
              </label>
              <p className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                <Link className="hover:underline hover:text-gray-600" to="/forgot-password">
                  Forgot password?
                </Link>
              </p>
            </div>
            <Button type="submit" className="w-full" disabled={loading || resending}>
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            <p className="text-sm font-medium leading-none text-center text-muted-foreground">
              Don't have an account?{' '}
              <Link className="hover:underline text-primary" to="/register">
                Sign up
              </Link>
            </p>
            <p className="text-sm font-medium leading-none text-center text-muted-foreground">
              Go back to{' '}
              <Link className="hover:underline text-primary" to="/">
                HomePage
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      <MainFooter />
    </div>
  );
}
