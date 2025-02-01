<script setup lang="ts">
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button as uiButton } from '@/components/ui/button'
import { ReloadIcon } from '@radix-icons/vue'

import { ref } from 'vue';
import { ipcRenderer } from 'electron';
import axios from 'axios';
import { useLordStore } from '@/stores/LordStore';
import { size, isNull, cloneDeep, last } from 'lodash';
import { sleep } from '../../../helpers/both';
import { v7 as uuidv7 } from 'uuid';
import { useRouter } from 'vue-router';

import type { $cardMaker, $cardMakerPDF } from '@/declarations/index'

const router = useRouter();
let lordStore = useLordStore()
let page = ref<$cardMaker | null>(null)
const message = ref<string>('');
let showPDF = ref(false)
let isProcessing = ref(true)
let isUploading = ref(false)
let isDirty = ref(false)

// Handle file selection
const handleFileChange = (event: any) => {

  showPDF.value = false
  isProcessing.value = true
  isDirty.value = true

  const target = event.target as HTMLInputElement;
  event.target.parentNode.style.display = "none";
  const file = ref<File | null>(null);

  if (event?.target?.files && event.target.files[0]) {

    isUploading.value = true;
    file.value = event.target.files[0]

    var formData = new FormData();
    formData.append("sampleFile", file.value as Blob);
    formData.append("cardMaker", 'true');

    if (page.value?.id) {
      formData.append("makerID", page.value.id);
    }

    axios.post(`http://${lordStore.db.ip}:9457/api/v1/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then((res) => {
        let data: $cardMaker = res.data
        page.value = data
        lordStore.reloadDatabase();
      })
      .catch(e => console.log('error', e))

  } else {
    console.log('No file selected', file.value, size(file))
    isProcessing.value = false
  }


  console.log(file.value, target)
};

watch(page, () => {
  if (page?.value?.id) {
    if (page.value?.pdfs?.length) {
      page.value?.pdfs?.filter((pdf: $cardMakerPDF) => {
        if (pdf?.isConverted) {
          console.log('already converted to jpeg', pdf.filename)
        } else {
          console.log('converting to jpeg', pdf)
          ipcRenderer.send('pdf2image', cloneDeep(pdf))
        }
      })
    }
  }
});


// Listen for upload response
ipcRenderer.on('pdf2image-success', async (event, file: $cardMakerPDF) => {
  message.value = `PDF converted to ${file.originalName} successfully`
  console.log('pdf2image-success', file)
  if (!isNull(page.value)) {
    page.value.pdfs = page.value?.pdfs?.map((pdf: $cardMakerPDF) => pdf.filename === file.filename ? file : pdf)
    await sleep(100)
    ipcRenderer.send('eshrem', cloneDeep(page.value))
  }
});

// Listen for upload response
ipcRenderer.on('pdf2image-failed', (event, file: $cardMakerPDF) => {
  message.value = `PDF conversion failed for ${file.originalName}`
});

// Listen for upload response
ipcRenderer.on('eshrem-success', (event, file: $cardMaker) => {
  message.value = `E-Shram card generated successfully`
  page.value = file
  lordStore.db.cardMaker = lordStore.db.cardMaker.map((el: $cardMaker) => {
    if (el.id == file?.id) {
      console.log('Updated', el)
      return file
    }
    return el
  })
  lordStore.saveMain()
  isProcessing.value = false
  isUploading.value = false
});


function onDownload(): void {
  try {
    if (page.value?.id) {
      let file: any = {
        destination: page.value.outputFile as string,
        originalName: 'eshrem-motionprinter-' + last(uuidv7().split('-')) + '.pdf'
      }
      ipcRenderer.send('download-file', cloneDeep(file))
    }
  } catch (error) {
    error = !error
  }
}

ipcRenderer.on('download-success', (event, file) => {
  router.go(0);
});

</script>



<template lang="pug">
pre "{{message}}"
div(class="p-8 max-w-7xl mx-auto")
  div(class="flex flex-wrap -mx-4")
    div(class="w-full mb-4 md:mb-5")
      div(class="flex flex-col md:flex-row justify-between items-center")
        h1(class="text-xl md:text-2xl font-bold mb-2 md:mb-0 flex items-center")
          i(class="mr-3")
          | Make E-Shram Cards Size Free 

  div(class="flex flex-wrap -mx-4 eshrem-page-content")
    div(class="w-full md:w-1/2 px-4 mb-4")
    
      div(class="bg-white border border-gray-200 rounded-lg shadow-sm")
        div(class="border-b border-gray-200 p-4")
          h6(class="text-lg font-semibold") Make E-Shram (Cards)
          p(class="text-sm text-gray-600") Please select downloaded file to generate the E-Shram card(s).

        form(method="POST")
          div(class="p-4")
            
            div(class="mb-3")
              label(class="block text-sm font-medium text-gray-700 mb-1") Select File 
                span(class="text-red-500") *
              input(
                @change="handleFileChange( $event )"
                :disabled="isUploading"
                :class="{'hover:cursor-not-allowed': isUploading}"
                type="file" 
                name="file" 
                class="w-full p-2 border border-gray-300 rounded-md"
                accept=".pdf"
                required
              )

            div(class="mb-3")
              label(class="block text-sm font-medium text-gray-700 mb-1") Select File
              input.w-full.p-2.border.border-gray-300.rounded-md(
                @change="handleFileChange( $event )"
                :disabled="isUploading"
                :class="{'hover:cursor-not-allowed': isUploading}"
                type="file"
                name="file1"
                accept=".pdf"
              )

            div(class="mb-3")
              label(class="block text-sm font-medium text-gray-700 mb-1") Select File
              input.w-full.p-2.border.border-gray-300.rounded-md(
                @change="handleFileChange( $event )"
                :disabled="isUploading"
                :class="{'hover:cursor-not-allowed': isUploading}"
                type="file"
                name="file2"
                accept=".pdf"
              )

            div(class="mb-3")
              label(class="block text-sm font-medium text-gray-700 mb-1") Select File
              input.w-full.p-2.border.border-gray-300.rounded-md(
                @change="handleFileChange( $event )"
                :disabled="isUploading"
                :class="{'hover:cursor-not-allowed': isUploading}"
                type="file"
                name="file3"
                accept=".pdf"
              )

            div(class="mb-3")
              label(class="block text-sm font-medium text-gray-700 mb-1") Select File
              input.w-full.p-2.border.border-gray-300.rounded-md(
                @change="handleFileChange( $event )"
                :disabled="isUploading"
                :class="{'hover:cursor-not-allowed': isUploading}"
                type="file"
                name="file4"
                accept=".pdf"
              )

    div(class="w-full md:w-1/2 px-4 mb-4")
      div(class="bg-white border border-gray-200 rounded-lg shadow-sm")

        .py-12.px-6

          .w-full.items-center(
            :class="{'hidden': !(isDirty && isProcessing) }"
          )
            .loader
          
          uiButton.mt-6(
            @click="onDownload()"
            size="lg"
            :class="{'hover:cursor-not-allowed': isProcessing}"
            :disabled="isProcessing"
          )
            ReloadIcon.hidden.w-4.h-4.mr-2.animate-spin
            | Download Card

        div.hidden(class="border-b border-gray-200 p-4")
          h5(class="text-lg font-semibold") Front and Back
          p(class="text-sm text-gray-600") Please click on the &lt; and &gt; to slide the images.

</template>
