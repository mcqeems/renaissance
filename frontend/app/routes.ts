import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('routes/landing/home.tsx'),
  route('login', 'routes/landing/login.tsx'),
  route('register', 'routes/landing/register.tsx'),
  route('education', 'routes/landing/education.tsx'),
  route('about', 'routes/landing/about.tsx'),
  route('forgot-password', 'routes/landing/forgotPassword.tsx'),
  route('feedback', 'routes/landing/feedback.tsx'),
  // --- UPDATED ARTICLE ROUTES ---
  route(
    'articles',
    'routes/landing/articles/layout.tsx', // <--- FIX: Path to your new layout file
    [
      index('routes/landing/articles/index.tsx'), // For '/articles'
      route(':slug', 'routes/landing/articles/slug.tsx'), // For '/articles/:some-slug'
    ]
  ),
  // --- END UPDATED ARTICLE ROUTES ---

  route('dashboard', 'routes/console/dashboardProtectionLayout.tsx', [
    index('routes/console/dashboardHome.tsx'),
    route('curhat', 'routes/console/curhat.tsx'),
    route('cekmental', 'routes/console/cekMental.tsx'),
    route('chat', 'routes/console/chatbot.tsx'),
    route('profile', 'routes/console/profile.tsx'),
    route('profile/change-password', 'routes/console/changePassword.tsx'),
    route('profile/edit-profile', 'routes/console/editProfile.tsx'),
  ]),
] satisfies RouteConfig;
