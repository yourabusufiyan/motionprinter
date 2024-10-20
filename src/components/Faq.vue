<script setup lang="ts">
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const defaultValue = 'Is it free?'


const accordionItems = [
  { title: 'Is it free?', content: 'Yes, Absolutely! MotionPrinter is provided free of charge for both personal and commercial use, allowing users to benefit from its full functionality without any associated costs, regardless of the intended purpose.' },
  { title: 'Is installation of MotionPrinter required on all computers for connectivity?', content: 'Yes, MotionPrinter must be installed on all of your computers to ensure seamless and efficient operation across the network.' },
  { title: 'Is an internet connection required?', content: 'No, an internet connection is not required. However, all devices must be connected to the same local network to ensure proper functionality and seamless communication between them.' },
  { title: 'Does MotionPrinter retain a history of printed files?', content: 'Yes, MotionPrinter maintains a history of printed files. You can view this history by selecting the "History" navigation button located in the sidebar of the MotionPrinter interface.' },
]
</script>

<template lang="pug">
#faq.flex.justify-center.items-center.flex-col.min-h-fit
  h3.text-2xl.font-medium.mb-4.text-center Frequently Asked Questions(FAQs)
  .divider.border-b.border-gray-300.border-b.border-gray-200.w-48.mx-auto.mb-6
  Accordion(type='single' collapsible='' :default-value='defaultValue' class="w-full sm:w-5/6 md:w-10/12 lg:w-9/12")
    AccordionItem(v-for='item in accordionItems' :key='item.title' :value='item.title')
      AccordionTrigger(class="text-md") {{ item.title }}
      AccordionContent
        span(v-html="item.content")
</template>
