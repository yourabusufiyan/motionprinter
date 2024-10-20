<template lang="pug">
.max-w-5xl.mx-auto.px-4.py-5.min--screen(class="dark:bg-slate-800 dark:text-gray-200")

  .mb-6.flex.items-center.justify-between
    button(@click="toggleDark()")
      span.ml-2 {{ isDark ? `🌙 ${t('common.dark')}` : `💡 ${t('common.light')}` }} {{ t('common.theme') }}
    button.hidden(@click="toggleLocales")
      span {{ t('common.language') }}: 
      span.text-green-600 {{ locale }}

  p.text-center.mt-6.flex.items-center.justify-center
    router-link.block.mx-4.px-2.py-1.border-b-2.border-green-300.transition(
      to="/home" 
      class="hover:border-green-500"
    )
      | {{ t('homepage.home') }}
    router-link.block.mx-4.px-2.py-1.border-b-2.border-green-300.transition(
      to="/print-list" 
      class="hover:border-green-500"
    )
      | {{ t('printerListPage.printerList') }}
    router-link.block.mx-4.px-2.py-1.border-b-2.border-green-300.transition(
      to="/profile" 
      class="hover:border-green-500"
    )
      | Profile
    router-link.block.mx-4.px-2.py-1.border-b-2.border-green-300.transition(
      to="/about" 
      class="hover:border-green-500"
    )
      | {{ t('aboutPage.about') }}

  <router-view class="my-5"/>
pre {{ lordStore.$state }}
.flex.items-center.justify-center.mt-4
  p(v-html="t('footer.creditsToAuthor')")
</template>

<script setup lang="ts">
console.log('[App.vue]', `App.vue started successfully`);

import { useLordStore } from '@/stores/LordStore';

console.log('[App.vue]', `Hello world from Electron ${process.versions.electron}!`);

const isDark = useDark();
const toggleDark = useToggle(isDark);
const { t, availableLocales, locale } = useI18n();

const lordStore = useLordStore();

console.log('lordStore from App.vue', lordStore)

function toggleLocales() {
  // change to some real logic
  const locales = availableLocales;
  console.log(availableLocales);
  // locale.value = locales[(locales.indexOf(locale.value) + 1) % locales.length];
}


console.log('[App.vue]', `App.vue End`);
</script>
