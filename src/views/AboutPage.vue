<script setup lang="ts">
console.log('[App.vue]', `aboutpage.vue started`);

const { t } = useI18n();
console.log('[App.vue]', `aboutpage.vue ended`);

</script>

<template>
  <div class="text-center">
    <h1 class="text-2xl">
      {{ t('pageTitles.about') }}
    </h1>
  </div>
</template>
