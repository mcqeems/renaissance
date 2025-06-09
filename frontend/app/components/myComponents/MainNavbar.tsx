import React from 'react';
import { Button } from '../ui/button'; //
import { AlignJustify } from 'lucide-react'; // Menambahkan ikon X dan sosial media
import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from '../ui/drawer'; //

const navItems = [
  { name: 'Home', link: '/' },
  { name: 'Education', link: '/education' },
  { name: 'Articles', link: '/articles' },
  { name: 'Feedback', link: '/feedback' },
  { name: 'About', link: '/about' },
  { name: 'Login', link: '/login' },
  { name: 'Register', link: '/register' },
];

function MainNavbar() {
  return (
    <Drawer>
      <div className="fixed bottom-0 left-0 right-0 text-center mb-10 z-50">
        <DrawerTrigger>
          <Button className="scale-125 rounded-full cursor-pointer bg-black hover:bg-gray-800 text-white ease-in focus:border-2 transition duration-400 hover:rotate-y-[360deg]">
            <AlignJustify className="" />
          </Button>
        </DrawerTrigger>
      </div>
      <DrawerContent className="bg-[#12151e] text-white p-8 outline-none border-none h-screen flex flex-col">
        <div className="flex-grow mt-16 space-y-3">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.link}
              className="block text-5xl font-medium hover:opacity-75 transition-opacity"
            >
              {item.name}
            </a>
          ))}
        </div>

        <div className="mt-auto">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs text-gray-400">Silahkan login untuk merasakan sensasi dari Renaissance!</p>

            <DrawerClose asChild>
              <Button
                variant="outline"
                className="bg-white text-black rounded-full px-4 py-2 hover:bg-gray-200 flex items-center space-x-2"
              >
                <span>Close</span>
              </Button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default MainNavbar;
