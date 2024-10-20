<script setup lang="ts">
console.log('[App.vue]', `aboutpage.vue started`);

import ip from 'ip'

const localIP = ip.address()


const { t } = useI18n();


console.log('[App.vue]', `aboutpage.vue ended`);

</script>

<template lang="pug">
.profile-view
  .container.px-10
    h1.mb-3 Profile 
    h2 IP Address is  "{{ localIP }}"
</template>
