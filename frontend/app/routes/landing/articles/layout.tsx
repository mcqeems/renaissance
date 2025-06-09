import { Outlet } from 'react-router';

export default function ArticlesLayout() {
  return (
    <>
      <Outlet /> {/* This is where the child route (index or :slug) will render */}
    </>
  );
}
