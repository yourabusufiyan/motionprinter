<script setup>
import { ref } from 'vue'
import { filesize, partial } from "filesize";

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Download, Loader2, RotateCcw } from 'lucide-vue-next'
import { useLordStore } from '@/stores/LordStore'

const imageCount = ref(8)
const totalSize = ref('3.2 MB')

const lordStore = useLordStore();
const route = useRoute()
const oropdf = lordStore.db.oropdf.find(el => el.id === route.query.id);

</script>


<template lang="pug">
.min-h-screen.bg-background.flex.items-center.justify-center.p-4
  Card(class="max-w-md w-full")
    CardContent.p-8
      .flex.flex-col.items-center.text-center.space-y-6

        // Success Animation
        .relative
          .absolute.inset-0.rounded-full.bg-green-500.animate-ping
          .rounded-full.bg-green-500.p-3
            CheckCircle2.h-12.w-12.text-green-500

        // Title
        .space-y-2
          h2.text-2xl.font-semibold.tracking-tight PDF Converted!
          p.text-muted-foreground Your PDF has been converted to JPG images

        // Stats
        .flex.gap-4.justify-center
          .text-center.hidden
            .text-2xl.font-bold {{ imageCount }}
            .text-xs.text-muted-foreground Images
          .text-center(v-if="oropdf?.options?.size !== undefined")
            .text-2xl.font-bold {{ filesize(oropdf?.options?.size) }}

        // Download Button
        a(:href="`http://${lordStore.db.ip}:9457/oropdf/${oropdf.id}.zip`", download) 
          Button(
            size="lg"
            class="w-full gap-2" 
          )
            Download.h-4.w-4
            span Download ZIP

        // Reset Button
        Button.hidden(
          variant="outline"
          size="sm"
          class="mt-2"
        )
          RotateCcw.h-3.w-3.mr-1
          span Convert Another
pre {{ oropdf }}
</template>

<style scoped lang="stylus">
.card-enter-active
  animation: slideUp 0.3s ease-out

@keyframes slideUp
  from
    opacity: 0
    transform: translateY(20px)
  to
    opacity: 1
    transform: translateY(0)
</style>