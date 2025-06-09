import React from 'react';

function MainFooter() {
  return (
    <>
      <footer className="py-8 text-center border-t mt-12 bg-[#12151e]">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Renaissance. Hak cipta dilindungi.
        </p>
      </footer>
    </>
  );
}

export default MainFooter;
