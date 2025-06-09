import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { auth } from '~/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Spinner } from '~/components/ui/spinner';
import MainFooter from '~/components/myComponents/MainFooter';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Forgot Password - Renaissance';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(
        `If an account exists for ${email}, a password reset link has been sent. Please check your inbox (and spam folder).`
      );
    } catch (err: any) {
      console.error('Firebase forgot password error:', err);

      if (err.code === 'auth/invalid-email') {
        setError('Invalid email format.');
      } else if (err.code === 'auth/user-not-found') {
        setMessage(
          `If an account exists for ${email}, a password reset link has been sent. Please check your inbox (and spam folder).`
        );
      } else {
        setError('Failed to send password reset email. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-svh p-4">
      <Card className="p-3 max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Forgot Password</CardTitle>
          <CardDescription className="text-lg">
            Enter your email address and we'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent>
            {message && (
              <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded-md text-sm">
                {message}
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">{error}</div>
            )}
            {!message && (
              <div>
                <label htmlFor="email-forgot" className="text-sm block mb-1">
                  Email Address
                </label>
                <Input
                  id="email-forgot"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="mb-4"
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            {!message && (
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Spinner size="small" className="mr-2" /> : null}
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            )}
            <Button variant="link" asChild className="text-sm">
              <Link to="/login">Back to Login</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
      <MainFooter />
    </div>
  );
}
