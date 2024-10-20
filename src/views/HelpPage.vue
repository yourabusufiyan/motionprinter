<script lang="ts" setup>
import { ref, defineAsyncComponent } from 'vue'

const Help = defineAsyncComponent(() => import('@/components/Help.vue'))
const Faq = defineAsyncComponent(() => import('@/components/Faq.vue'))
const AboutUs = defineAsyncComponent(() => import('@/components/AboutUs.vue'))

</script>


<template lang="pug">
.help-page
  .help-page-container
    Help
  .faq-container
    Faq
    .divider.border-b.border-white.border-b.border-gray-200.w-64.mx-auto.my-10
</template>
