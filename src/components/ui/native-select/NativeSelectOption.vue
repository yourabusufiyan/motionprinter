<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{ class?: HTMLAttributes["class"] }>()
</script>

<template>
  <option data-slot="native-select-option" :class="cn('bg-white text-slate-950 dark:bg-slate-950 dark:text-slate-50', props.class)">
    <slot />
  </option>
</template>
