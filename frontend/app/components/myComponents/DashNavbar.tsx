// ~/components/DashNavbar.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '~/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '~/components/ui/sheet';
import { Menu as MenuIcon, LogOut } from 'lucide-react';
import { cn } from '~/lib/utils';
import { useAuth } from '~/context/authContext';
import { signOut } from 'firebase/auth';
import { auth as firebaseAuth } from '~/firebase';

// Daftar item navigasi
const navItems = [
  { title: 'Dashboard', href: '/dashboard' },
  { title: 'Curhat', href: '/dashboard/curhat' },
  { title: 'Chat', href: '/dashboard/chat' },
  { title: 'Cek Mental', href: '/dashboard/cekmental' },
  { title: 'Profile', href: '/dashboard/profile' },
];

function DashNavbar() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const navigate = useNavigate();
  const authContext = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth);
      setIsSheetOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 plus-jakarta-sans-500">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between p-4">
        <Link to={'/'} className="flex items-center space-x-2">
          <img src="/logo/RenaissanceWhite.svg" className="h-[30px]"></img>
          <span className="plus-jakarta-sans-800">Renaissance</span>
        </Link>

        {/* Navigasi Desktop (Terlihat di layar md ke atas) */}
        <nav className="hidden md:flex md:items-center md:space-x-1">
          {navItems.map((item) => (
            <Button key={item.title} variant="ghost" asChild className="text-sm font-medium">
              <Link to={item.href}>{item.title}</Link>
            </Button>
          ))}
          {authContext?.currentUser && (
            <Button variant="outline" onClick={handleLogout} className="text-sm font-medium cursor-pointer ">
              <LogOut className="mr-2 h-4 w-4 " /> <p>Logout</p>
            </Button>
          )}
        </nav>

        {/* Tombol Hamburger & Sheet Menu untuk Mobile (Terlihat di layar kecil dari md) */}
        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <MenuIcon className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              {' '}
              <SheetHeader>
                <SheetTitle>
                  <Link
                    to={authContext?.currentUser ? '/dashboard' : '/'}
                    className="flex items-center space-x-2"
                    onClick={() => setIsSheetOpen(false)}
                  >
                    <span className="font-bold">Renaissance</span>
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col space-y-3">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.title}>
                    <Link
                      to={item.href}
                      className="block rounded-md px-3 py-2 text-base font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
                      onClick={() => setIsSheetOpen(false)}
                    >
                      {item.title}
                    </Link>
                  </SheetClose>
                ))}
                {authContext?.currentUser && (
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start px-3 py-2 text-base font-medium"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export default DashNavbar;
