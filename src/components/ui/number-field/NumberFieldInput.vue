<script setup lang="ts">
import { NumberFieldInput } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '@/utils/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <NumberFieldInput data-slot="input"
    :class="cn('flex h-9 w-full rounded-md border border-slate-200 bg-transparent py-1 text-sm text-center shadow-sm transition-colors placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300', props.class)" />
</template>
