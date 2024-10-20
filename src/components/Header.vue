<script lang="ts" setup>
const isDark = useDark();
const toggleDark = useToggle(isDark);
const { t, availableLocales, locale } = useI18n();
import { useRoute, useRouter } from 'vue-router';
const route = useRoute()

</script>

<template lang="pug">
header.header.bg-slate-100.border-b.shadow-sm.shadow-slate-900(
  class="dark:bg-slate-800 dark:text-slate-200 dark:border-slate-400 dark:shadow-slate-200"
)
  .container.py-4.flex.items-center.justify-start
    h2.text-lg {{ route.meta.title }}
    //- button(@click="toggleDark()")
      span.ml-2.transition-all {{ isDark ? `🌙` : `💡` }}
</template>
