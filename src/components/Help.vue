<script setup lang="ts">
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const defaultValue = 'Is it free?'

const accordionItems = [
  { title: 'Is it free?', content: 'Yes. MotionPrinter will always be free for your personal uses or commercial uses.' },
  { title: 'Do i install MotionPrinter in all computer to connect each other', content: 'Yes. You need to install MotionPrinter in all your computers to works smoothly.' },
  { title: 'Do i need internet connection?', content: 'No! You do not need to be connected with internet. But, You have to be <b>connected to same Network</b>' },
]
</script>

<template lang="pug">
.help-components.my-4.mb-8

  .about-motionprinter.makeHalfScreen.flex.justify-center.items-center.flex-col.-mt-12
    .px-2(class="md:px-6 lg:px-12")
      h3.text-2xl.font-medium.mb-4.text-center What is the MotionPrinter?
      .divider.border-b.border-gray-300.border-b.border-gray-200.w-48.mx-auto.mb-6
      p MotionPrinter is a robust and user-friendly printer sharing application across multiple computers within the same local network
        | with track printed files designed for enhancing collaboration and efficiency for Windows users only for now
        | at zero cost for both personal and commercial use.

  .reason-to-choose.makeHalfScreen.flex.justify-start.items-start.flex-col
    .content.px-2(class="md:px-6 lg:px-12")
      h3.text-2xl.font-medium.mb-4.text-center Why you choose MotionPrinter?
      .divider.border-b.border-gray-300.border-b.border-gray-200.w-48.mx-auto.mb-6
      ul.list-disc.list-inside
        li Proudly made in India.
        li Super easy interface to use.
        li Save your lot of time to unwanted works.
        li Effortless.
        li Innovative.
        li Very helpful
</template>

<style lang="stylus" scoped>
.makeHalfScreen {
  min-height: 50vh
}

</style>
