import { useEffect } from 'react';
import { useAuth } from '~/context/authContext';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Link } from 'react-router';

function profile() {
  const { userProfile } = useAuth();

  useEffect(() => {
    document.title = 'Profile - Renaissance';
  }, []);
  return (
    <div className="w-full max-w-[475px] h-full justify-self-center">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>Manage your profile here!</CardDescription>
          <hr />
        </CardHeader>
        <div className="h-[175px] flex justify-center items-center my-3">
          <div className="bg-gray-200 h-[180px] w-[180px] flex justify-center items-center rounded-full overflow-hidden">
            <img src="/others/catIcon.svg" alt="Cat Profile" className="h-[125px]" />
          </div>
        </div>

        <CardContent className="grid grid-cols-2 [&>*]:mb-4 scale-90 sm:scale-100">
          <p>Username</p>
          <p className="text-right  text-sm ">{userProfile?.username}</p>
          <p>Full Name</p>
          <p className="text-right text-sm ">
            {userProfile?.firstName} {userProfile?.lastName}
          </p>
          <p>First Name</p>
          <p className="text-right text-sm ">{userProfile?.firstName}</p>
          <p>Last Name</p>
          <p className="text-right text-sm ">{userProfile?.lastName}</p>
          <p>Email Account</p>
          <p className="text-right text-sm  break-words max-w-[200px] sm:max-w-full">{userProfile?.email}</p>
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-5">
          <Link to={'/dashboard/profile/change-password'}>
            <Button variant="outline" className="w-full text-sm font-medium cursor-pointer  text-white">
              Change Password
            </Button>
          </Link>
          <Link to={'/dashboard/profile/edit-profile'}>
            <Button variant="outline" className="w-full text-sm font-medium cursor-pointer  text-white">
              Edit Profile
            </Button>
          </Link>{' '}
        </CardFooter>
      </Card>
    </div>
  );
}

export default profile;
