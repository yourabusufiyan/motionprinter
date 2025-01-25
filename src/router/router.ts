import { createWebHistory, createRouter, RouteRecordRaw } from 'vue-router';

import { useLordStore } from '@/stores/LordStore';
import CardMakerRoutes from './cardmaker-routes'; // Import nested routes

console.log('[App.vue]', `router started`);

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'entry',
    redirect: '/home',
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('../views/HomePage.vue'),
    meta: { title: 'Home' }
  },
  {
    path: '/inbox',
    name: 'inbox',
    component: () => import('../views/inboxPage.vue'),
    meta: { title: 'Inbox' }
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('../views/HistoryPage.vue'),
    meta: { title: 'History' }
  },
  {
    path: '/connected-pc',
    name: 'connected-pc',
    component: () => import('../views/ConnectedPC.vue'),
    meta: { title: 'Connected PC' }
  },
  {
    path: '/help',
    name: 'help',
    component: () => import('../views/HelpPage.vue'),
    meta: { title: 'Help & Supports' }
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('../views/SettingsPage.vue'),
  },
  {
    path: '/card-maker',
    children: CardMakerRoutes
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: function (to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    if (to.hash) {
      return { el: to.hash, behavior: "smooth" };
    } else {
      console.log("moving to top of the page");
      window.scrollTo(0, 0);
    }
  }
});

router.beforeEach(async (to, from, next) => {
  const store = useLordStore()
  await store.reloadDatabase()
  console.log('after reloading database in router execution before each');
  console.log('before each', from?.name, ' to ', to?.name);
  if (to.hash) {
    document.querySelector(to.hash)?.scrollIntoView()
  }
  next()
});
// router.afterEach(async (to, from) => {
//   if (to.hash) {
//     document.getElementById(to.hash)?.scrollIntoView()
//   }
// });

export default router;
console.log('[App.vue]', `router ended`);
