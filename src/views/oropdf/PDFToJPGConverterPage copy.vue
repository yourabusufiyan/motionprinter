<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ArrowRightIcon } from 'lucide-vue-next'

import { ref } from 'vue'
import vue3Dropzone from '@jaxtheprime/vue3-dropzone'
import "@jaxtheprime/vue3-dropzone/dist/style.css"



const newFiles = ref([])
const existingFiles = ref([
  'https://placehold.jp/150x150.png',
  'https://placehold.jp/150x150.png',
  'https://placehold.jp/150x150.png',
  'https://example.com/document.pdf'
])
const state = ref('indeterminate')
const pagg = ref('page')
</script>

<template lang="pug">
.w-full.h-screen
  .flex.items-center.justify-center.items-stretch.h-full
    .upload-area.bg-red-100.flex-1
        vue3Dropzone.w-full.h-full(
          multiple
          v-model="newFiles"
          v-model:previews="existingFiles"
          mode="edit"
          selectFileStrategy="merge"
          previewPosition="inside"
          
          :maxFileSize="1024"
          :maxFiles="20"

          width="100%" 
          height="100%" 
          imgWidth="150px" 
          imgHeight="150px"
          :state="state"
        )
    .options(class="basis-1/3 md:basis-1/3 lg:basis-1/4 ")

        // Header
        
        // Content
        .flex.flex-col.h-full.justify-between
          h3.text-2xl.font-bold.leading-none.tracking-tight.py-6.text-center PDF to JPG options
          .extract-options.flex-1
            .flex.items-start.space-x-3.rounded-lg.border.p-4.cursor-pointer(
              :class="{ 'border-primary bg-primary/5': selectedOption === 'page' }"
              @click="selectedOption = 'page'"
            )
              .flex-1
                label.font-medium.cursor-pointer(@click="selectedOption = 'page'") PAGE TO JPG
                p.text-sm.text-muted-foreground.mt-1
                  | Every page of this PDF will be converted into a JPG file.

            .flex.items-start.space-x-3.rounded-lg.border.p-4.cursor-pointer(
                :class="{ 'border-primary bg-primary/5': selectedOption === 'extract' }"
                @click="selectedOption = 'extract'"
              )
                .flex-1
                  label.font-medium.cursor-pointer(@click="selectedOption = 'extract'") EXTRACT IMAGES
                  p.text-sm.text-muted-foreground.mt-1
                    | All embedded images inside the PDF will be extracted as JPG images.

            .image-quality.mt-6.px-2
              h3.font-medium.mb-3 Image quality
              .flex.gap-2
                Button.flex.flex-col.items-center(class="basis-1/2" size="md" variant="outline")
                  .text-sm.font-medium.leading-none.cursor-pointer Normal
                  span.text-xs.text-muted-foreground.ms-1 Recommended
                Button.flex.items-center.justify-center(class="basis-1/2" size="md" variant="outline")
                  .p-6.text-lg.font-medium.leading-none.cursor-pointer High

          // Convert Button
          .submit-section.mx-2.mb-2
            Button.w-full.p-5( size="xlg" )
              | Convert to JPG 
              ArrowRightIcon


</template>

