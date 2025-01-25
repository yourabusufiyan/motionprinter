import type { RouteRecordRaw } from 'vue-router';

const NestedRoutes: RouteRecordRaw[] = [
  {
    path: '', // Default child route
    component: () => import('../views/CardMakerPage.vue'),
    meta: { title: 'Card Maker' },
  },
  {
    path: 'eshrem', // Default child route
    name: 'eshrem',
    component: () => import('@/views/cards/Eshrem.vue'),
  },
];

export default NestedRoutes;