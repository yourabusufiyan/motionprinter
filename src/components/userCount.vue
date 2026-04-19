<script setup lang="ts">
import NumberFlow, { NumberFlowGroup } from '@number-flow/vue'
const { value, diff } = defineProps<{
  value: number
  diff: number
}>()
</script>

<template lang="pug">
NumberFlowGroup
  div(style="--number-flow-char-height: 0.85em", class="space-x-1 font-semibold inline-block")
    NumberFlow.popopo(:value, locales="en-US", class="~text-2xl/4xl")
    NumberFlow.hidden(:value="+diff", suffix="%", :prefix="diff > 0 ? '+' : ''" :class=`[
      '~text-lg/2xl transition-colors duration-300',
      diff < 0 ? 'text-red-500' : 'text-emerald-500'
    ]`)
</template>

<style lang="stylus" scoped>
.popopo
  &::after
    content: '●'
    vertical-align: super
    font-size: 0.8em
    color: #34c759
    margin-left: 1px
</style>