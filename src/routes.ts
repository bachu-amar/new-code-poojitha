import HomeRoute from '@routes/index.route';
import userRoutes from '@/routes/auth/user.route';
import artistRoutes from '@/routes/auth/artist.route';
import googleAuthRoutes from '@routes/auth/google.route';
import facebookAuthRoutes from '@routes/auth/facebook.route';
import audioRoutes from '@/routes/audio.route';
import adminRoutes from '@/routes/admin.route';
import videoRoutes from "@/routes/video.route"

const routes = [
  {
    path: '/',
    func: HomeRoute,
  },
  {
    path: '/auth',
    func: userRoutes,
  },
  {
    path: '/auth',
    func: artistRoutes,
  },
  {
    path: '/audio',
    func: audioRoutes,
  },
{
  path: '/admin',
  func: adminRoutes,
},
{
  path: '/video',
  func: videoRoutes,
}

  // {
  //   path: '/auth/google',
  //   func: googleAuthRoutes,
  // },
  // {
  //   path: '/auth/facebook',
  //   func: facebookAuthRoutes,
  // },
];

export default routes;
