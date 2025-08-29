import type { RouteRecordRaw } from 'vue-router';

const NestedRoutes: RouteRecordRaw[] = [
  {
    path: '',
    component: () => import('../views/cards/cards.vue'),
    meta: { title: 'Card Maker' },
  },
  {
    path: '/:id',
    name: 'cardView',
    component: () => import('@/views/cards/cardView.vue'),
  },
];

export default NestedRoutes;