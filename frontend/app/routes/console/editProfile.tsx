import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { useAuth, type UserProfile } from '~/context/authContext';
import { auth as firebaseAuth, db } from '~/firebase';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { Spinner } from '~/components/ui/spinner';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  username: string;
}

export default function EditProfilePage() {
  const { currentUser, userProfile, loading: authLoading, initialAuthChecked } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    username: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    document.title = 'Edit Profile - Renaissance';
  }, []);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        username: userProfile.username || '',
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (initialAuthChecked && !authLoading && !currentUser) {
      navigate('/login', { replace: true });
    }
  }, [currentUser, authLoading, initialAuthChecked, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!currentUser) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.username) {
      setError('First name, last name, and username are required.');
      setLoading(false);
      return;
    }

    try {
      const newDisplayName = `${formData.firstName} ${formData.lastName}`;
      if (currentUser.displayName !== newDisplayName) {
        await updateFirebaseProfile(currentUser, {
          displayName: newDisplayName,
        });
      }

      const userDocRef = doc(db, 'users', currentUser.uid);
      const dataToUpdate: Partial<UserProfile> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username.toLowerCase(),
      };

      await updateDoc(userDocRef, dataToUpdate);

      setSuccessMessage('Profile updated successfully!');
      setTimeout(navigateLink, 500);
      function navigateLink() {
        return navigate('/dashboard/profile', { replace: true });
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      if (err.code === 'firestore/permission-denied') {
        setError('You do not have permission to update this profile.');
      } else {
        setError('Failed to update profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !initialAuthChecked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-svh p-4 bg-[#12151e] text-white">
        {' '}
        <Spinner className="mb-2 text-[#c2d2ff]" size={'large'} />
        <div>Checking authentication...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <p className="p-4">Redirecting to login...</p>;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-0 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Edit Profile</CardTitle>
          <CardDescription>Update your personal information.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {successMessage && (
              <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-md text-sm">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">{error}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <Input
                  type="text"
                  name="firstName"
                  id="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <Input
                  type="text"
                  name="lastName"
                  id="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <Input
                type="text"
                name="username"
                id="username"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="mt-8 flex flex-col">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Spinner size="small" className="mr-2" /> : null}
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button variant="link" asChild className="text-sm mt-3">
              <Link to="/dashboard/profile">Back to profile</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
