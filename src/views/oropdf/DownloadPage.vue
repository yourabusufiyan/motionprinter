<script setup lang="ts">
import { ref } from 'vue'
import { filesize, partial } from "filesize";

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Download, Loader2, ArrowLeftCircleIcon } from 'lucide-vue-next'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

import { useLordStore } from '@/stores/LordStore'
// @ts-ignore
import type { uploadFile } from '../../../electron/main/express-app-d';

const totalSize = ref('3.2 MB')
const isAnyProtectedFile = ref(false)
const lordStore = useLordStore();
const route = useRoute()
const router = useRouter()
const oropdf = lordStore.db.oropdf.find((el: any) => el?.id === route.query.id);

const imageCount = computed(() => {
  return oropdf?.files.reduce((p: number, c: any, i: any) => {
    if (c.isPasswordProtected) {
      isAnyProtectedFile.value = true;
      return p;
    }
    return +Number(c?.info?.pages) + p
  }, 0)
})
const format = computed(() => {
  if (route.query.format === 'jpg') {
    return 'JPG'
  } else if (route.query.format === 'png') {
    return 'PNG'
  } else if (route.query.format === 'tiff') {
    return 'TIFF'
  } else if (route.query.format === 'svg') {
    return 'SVG'
  }
  return route.query.format
})

onMounted(() => {
  lordStore.reloadDatabase()
  if (!oropdf?.id) {
    router.push({ name: 'oropdf' })
  }
})

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
          h2.text-2xl.font-semibold.tracking-tight Zip File ready!
          p.text-muted-foreground All of your files compressed and ready for download.

        // Stats
        .flex.gap-4.justify-center
          .text-center
            .text-2xl.font-bold {{ imageCount }}{{ isAnyProtectedFile ? '+' : '' }} 
            .text-xs.text-muted-foreground Image{{ imageCount > 1 || isAnyProtectedFile ? 's': '' }}
          .text-center(v-if="oropdf?.options?.size !== undefined")
            .text-2xl.font-bold {{ filesize(oropdf?.options?.size) }}
            .text-xs.text-muted-foreground Size

        .flex.flex-row.flex-row-reverse.gap-2
          // Download Button
          a(:href="`http://${lordStore.db.ip}:9457/oropdf/${oropdf?.id}.zip`", download) 
            Button(
              size="lg"
              class="w-full gap-2" 
            )
              Download.h-4.w-4
              span Download ZIP

          .back-option.hidden
            TooltipProvider
              Tooltip
                TooltipTrigger(as-child)
                  Button(
                      size="lg"
                      class="px-3.5"
                      variant="outline"
                    )
                      ArrowLeftCircleIcon.h-4
                TooltipContent
                  p Convert Another File

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