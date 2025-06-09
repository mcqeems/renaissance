// frontend/app/routes/register.tsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { auth, db } from '~/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import MainFooter from '~/components/myComponents/MainFooter';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Sign Up - Renaissance';
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setVerificationSent(false);

    if (!email || !password) {
      setError('Please enter both email and password.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (user) {
        await updateProfile(user, {
          displayName: `${firstName} ${lastName}`,
        });

        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, {
          uid: user.uid,
          username: username.toLowerCase(),
          firstName: firstName,
          lastName: lastName,
          email: user.email,
          createdAt: new Date(),
        });

        await sendEmailVerification(user);
        setVerificationSent(true);

        await signOut(auth);
      } else {
        setError('Failed to create user. Please try again.');
      }
    } catch (err: any) {
      console.error('Firebase registration error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Registration is currently disabled.');
      } else {
        setError('Failed to create an account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh p-4 bg-[#12151e] text-white">
        <Card className="p-6 max-w-lg w-full text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Email Verification Sent!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              A verification email has been sent to <strong>{email}</strong>. Please check your inbox (and spam folder)
              and click the link to verify your email address before logging in.
            </p>
          </CardContent>
          <CardFooter className="justify-center">
            <Button asChild>
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-svh p-4 bg-[#12151e] text-white">
      <Card className="p-3 max-w-lg w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl">Sign Up</CardTitle>
          <CardDescription className="text-lg">Create your account to continue</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="grid gap-4">
            {' '}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {' '}
              <div>
                <label htmlFor="firstName" className="text-sm block mb-1 font-medium">
                  First Name
                </label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="text-sm block mb-1 font-medium">
                  Last Name
                </label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="username" className="text-sm block mb-1 font-medium">
                Username
              </label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label htmlFor="email-input-register" className="text-sm block mb-1 font-medium">
                Email
              </label>
              <Input
                id="email-input-register"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div>
              <label htmlFor="password-input-register" className="text-sm block mb-1 font-medium">
                Password
              </label>
              <Input
                id="password-input-register"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm text-center col-span-full">{error}</p>}
          </CardContent>
          <CardFooter className="flex flex-col gap-3 mt-5">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link className="hover:underline text-primary" to="/login">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
      <MainFooter />
    </div>
  );
}
