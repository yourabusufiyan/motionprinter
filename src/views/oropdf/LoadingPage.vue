<template lang="pug">
.flex.items-center.justify-center.relative.min-h-screen
  .max-w-md.w-full.mx-4.animate-in.zoom-in-95.duration-300
    // Main Card
    .bg-card.rounded-xl.border.overflow-hidden
      // Header Section
      .p-8.text-center.border-b.border-border.bg-gradient-to-r.from-primary.to-transparent
        .flex.justify-center
          .relative
            .absolute.inset-0.rounded-full.bg-primary.animate-ping
            .relative.rounded-full.bg-primary.mb-2
              Loader2.animate-spin.h-20.w-20.text-primary(v-if="progress < 100")
              CheckCircle.h-12.w-12.text-primary(v-else)
        p.text-sm.text-muted-foreground.mt-2.text-center {{ message }}
      
      // Body Section
      .p-8.space-y-6
        
        // Progress Bar with Label
        .w-full.space-y-2
          .flex.justify-between.text-xs.text-muted-foreground
            span Progress
            span {{ progress }}%
          .h-2.overflow-hidden
            Progress(:model-value="progress")
        
        // Info Text
        .text-center.space-y-3
          p.text-sm.text-muted-foreground This may take a few moments
          
          // Warning Badges
          .flex.flex-wrap.gap-2.justify-center
            Badge.inline-flex.items-center.gap-1.px-2.py-1(variant="destructive")
              Ban.h-3.w-3
              span Don't close
            Badge.inline-flex.items-center.gap-1.px-2.py-1(variant="destructive")
              ArrowLeft.h-3.w-3
              span Don't go back
      
      // Footer
      .px-8.py-4.bg-muted.border-t.border-border.text-center
        p.text-xs.text-muted-foreground Please wait while we complete your request

</template>

<script setup lang="ts">
// @ts-ignore
import type { oroPdfSettings } from '../../../electron/main/express-app-d'

import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'

import { Loader2, Ban, ArrowLeft, CheckCircle } from 'lucide-vue-next'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useLordStore } from '@/stores/LordStore'
import { merge, isObject } from 'lodash'
import axios from 'axios'
import { ipcRenderer } from 'electron';

const router = useRouter()
const route = useRoute()
const progress = ref(13)
const message = ref('Processing your request')
const lordStore = useLordStore()
const pageData = computed(() => {
  return lordStore.db.oropdf.find((el: oroPdfSettings) => el.id === route.query.id)
})

function saveToMain() {
  if (pageData.value) {

    console.log('Saving to main process with data:', pageData);
    let data = lordStore.db.oropdf.map((el: oroPdfSettings, i: number) => {
      if (el.id === pageData?.value?.id) {
        if (pageData.value?.files) {
          pageData.value.files = pageData.value?.files?.filter((file: any) => isObject(file));
        }
        el = merge(el, pageData.value);
      }
      return el;
    });
    lordStore.lowdb.data.oropdf = data;
    lordStore.saveLowDB();
  }
}

ipcRenderer.on('oroLoading', (event, args) => {
  console.log('Received oroLoading event with args:', args);
  if (args.id === pageData.value?.id) {
    if (args.progress) {
      progress.value = args.progress;
    }
    if (args.message) {
      message.value = args.message;
    }
  }
});

onBeforeMount(() => {
  if (!pageData.value) {
    router.push({ name: 'oropdf', query: { id: route.query.id, format: route.query.format } })
  }
})

onMounted(() => {
  axios.post(`http://${lordStore.db.ip}:9457/api/v1/oropdf/oro-loading`, { id: pageData.value?.id }).then((res) => {
    console.log('Progress response:', res.data);
    if (res.data && res.data.progress) {
      progress.value = res.data.progress;
      message.value = res.data.message
    }
    router.push({ name: 'OroDownload', query: { id: pageData.value?.id } })
  }).catch((err) => {
    console.error('Error fetching progress:', err);
  });
});


</script>

<style scoped>
.animation-delay-150 {
  animation-delay: 150ms;
}
</style>