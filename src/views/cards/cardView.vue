<script setup>
import { useLordStore } from '@/stores/LordStore';
import { useRoute } from 'vue-router'

const route = useRoute()
const cardID = route.params.id
// const lordStore = useLordStore()
// const card = computed(() => find(lordStore.db.cardMaker, ['id', cardID]))

</script>

<template lang="pug">
h1 card viewerdfsd
pre {{ route.params }}
//- pre {{card}}
</template>
