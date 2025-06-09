import React from 'react';
import { useAuth } from '~/context/authContext'; // Impor useAuth

function Dashboard() {
  const { currentUser, userProfile, loading } = useAuth(); // Dapatkan userProfile dari context
  if (loading && !userProfile) {
    // Tampilkan loading jika data profil belum ada
    return (
      <div className="p-4">
        <p>Loading user data...</p>
        {/* Atau Spinner */}
      </div>
    );
  }
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">
        Welcome, {userProfile?.firstName || currentUser?.displayName || 'User'}!
      </h1>
    </div>
  );
}

export default Dashboard;
