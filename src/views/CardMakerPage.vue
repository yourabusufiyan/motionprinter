<script setup lang="ts">
console.log('[App.vue]', `IdMakerPage.vue started`);
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const cards = ref([
  { title: "E-Shrem", thumbnail: "https://placehold.jp/150x150.png?text=E-Shrem", to: '{name: "eshrem"}' }
])

console.log('[App.vue]', `IdMakerPage.vue ended`);

</script>

<template lang="pug">
router-link(
  v-for="card in cards"
  :to="{name: 'eshrem'}"
)
  div(
    class="sm:w-6/12 md:w-4/12 lg:w-3/12 px-2 flex-xl-3"
  )
    Card.text-center.items-center.h-full
      CardHeader
        .w-full.bg-white.overflow-hidden.flex.items-center.justify-center
          img.rounded-full(
            :src="card.thumbnail", 
            style="max-width: 7rem; max-height: 7rem; width: auto; height: auto"
          )
      CardContent
        CardTitle {{card.title}}
</template>
