<script setup lang="ts">
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ref } from 'vue';
import { ipcRenderer } from 'electron';
import axios from 'axios';
import { useLordStore } from '@/stores/LordStore';
import { size, isNull, cloneDeep } from 'lodash';
import { sleep } from '../../../helpers/both';

import type { $cardMaker, $cardMakerPDF } from '@/declarations/index'

let lordStore = useLordStore()
let page = ref<$cardMaker | null>(null)
const message = ref<string>('');
const files = ref<File[]>([]);

// Handle file selection
const handleFileChange = (event: any, i:number) => {

  const target = event.target as HTMLInputElement;
  if (event?.target?.files && event.target.files[0]) {
    files.value[i] = event.target.files[0];

    

  }

};

function submitHandler(event: Event) {
  event.preventDefault();
  message.value = 'Processing...';
  files.value.forEach( async (file, i) => {
    
    var formData = new FormData();
    formData.append("sampleFile", file as Blob);
    formData.append("cardMaker", 'true');

    if (page.value?.id) {
      formData.append("makerID", page.value.id);
    }

    try {
      let createOrGet = await axios.post(`http://${lordStore.db.ip}:9457/api/v1/upload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      console.log('createOrGet', createOrGet)
      let data: $cardMaker = createOrGet.data
      page.value = data
    } catch (error) {
      message.value = 'Something went wrong! Please try again.';
    }

  });
}

</script>



<template lang="pug">
pre {{message}}
pre {{page}}
div(class="p-8 max-w-7xl mx-auto")
  div(class="flex flex-wrap -mx-4")
    div(class="w-full mb-4 md:mb-5")
      div(class="flex flex-col md:flex-row justify-between items-center")
        h1(class="text-xl md:text-2xl font-bold mb-2 md:mb-0 flex items-center")
          i(class="mr-3")
          | Make E-Shram (Cards)

  div(class="flex flex-wrap -mx-4 eshrem-page-content")
    div(class="w-full md:w-1/2 px-4 mb-4")
    
      div(class="bg-white border border-gray-200 rounded-lg shadow-sm")
        div(class="border-b border-gray-200 p-4")
          h5(class="text-lg font-semibold") Make E-Shram (Cards)
          p(class="text-sm text-gray-600") Please enter the details in the input field(s) to generate the E-Shram card(s).

        form(method="POST")
          div(class="p-4")
            
            div(class="mb-3")
              label(class="block text-sm font-medium text-gray-700 mb-1") Select File 
                span(class="text-red-500") *
              input(
                @change="handleFileChange( $event, 0 )"
                type="file" 
                name="file" 
                class="w-full p-2 border border-gray-300 rounded-md"
                accept=".pdf"
                required
              )

            div(class="mb-3")
              label(class="block text-sm font-medium text-gray-700 mb-1") Select File
              input(@change="handleFileChange( $event, 1 )" type="file" name="file1" class="w-full p-2 border border-gray-300 rounded-md" accept=".pdf")

            div(class="mb-3")
              label(class="block text-sm font-medium text-gray-700 mb-1") Select File
              input(@change="handleFileChange( $event, 2 )" type="file" name="file2" class="w-full p-2 border border-gray-300 rounded-md" accept=".pdf")

            div(class="mb-3")
              label(class="block text-sm font-medium text-gray-700 mb-1") Select File
              input(@change="handleFileChange( $event, 3 )" type="file" name="file3" class="w-full p-2 border border-gray-300 rounded-md" accept=".pdf")

            div(class="mb-3")
              label(class="block text-sm font-medium text-gray-700 mb-1") Select File
              input(@change="handleFileChange( $event, 4 )" type="file" name="file4" class="w-full p-2 border border-gray-300 rounded-md" accept=".pdf")

            div(class="mb-3 hidden" style="display: none;")
              label(class="block text-sm font-medium text-gray-700 mb-1") Card Quality
              select(name="scale" class="w-full p-2 border border-gray-300 rounded-md")
                option(value="1" selected) Normal
                option(value="2") Good
                option(value="3") High
                option(value="4") Super

          div(class="border-t border-gray-200 p-4")
            div(class="text-center")
              button(
                @click="submitHandler( $event )"
                type="submit"
                class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              )
                span Submit

    div(class="w-full md:w-1/2 px-4 mb-4")
      div(class="bg-white border border-gray-200 rounded-lg shadow-sm")
        div(class="border-b border-gray-200 p-4")
          h5(class="text-lg font-semibold") Front and Back
          p(class="text-sm text-gray-600") Please click on the &lt; and &gt; to slide the images.

        div(class="p-0")
          div(id="carouselExample" class="relative")
            div(class="carousel-inner")
              div(class="carousel-item active")
                img(
                  v-if="page?.pdfs?.length && page?.pdfs[0]?.OutputFile"
                  :src="'http://localhost:9457/upload/' + page.pdfs[0].cardFront"
                  class="w-full"
                  alt="Front"
                )
              div(class="carousel-item")
                img(
                  v-if="page?.pdfs?.length && page?.pdfs[0]?.OutputFile"
                  :src="'http://localhost:9457/upload/' + page.pdfs[0].cardBack"
                  class="w-full"
                  alt="Back"
                )

            button(class="absolute top-1/2 left-0 transform -translate-y-1/2 p-2" type="button" data-bs-target="#carouselExample" data-bs-slide="prev")
              i(class="fa-regular fa-circle-left fa-beat fa-2xl text-blue-900")
              span(class="sr-only") Previous

            button(class="absolute top-1/2 right-0 transform -translate-y-1/2 p-2" type="button" data-bs-target="#carouselExample" data-bs-slide="next")
              i(class="fa-regular fa-circle-right fa-beat fa-2xl text-blue-900")
              span(class="sr-only") Next

        div.hidden(class="border-t border-gray-200 p-4")
          div(class="text-center")
            button(type="button" class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600")
              i(class="fa fa-download mr-2")
              span Download

    div(class="w-full px-4 mb-4")
      div(class="bg-white border border-gray-200 rounded-lg shadow-sm")
        div(class="border-b border-gray-200 p-4")
          h5(class="text-lg font-semibold") A4 size PDF.
          p(class="text-sm text-gray-600") This is A4 size page. This page might not work for PVC card.

        div(class="aspect-w-16 aspect-h-9")
          iframe(
            v-if="page?.pdfs?.length && page?.pdfs[0]?.OutputFile"
            :src="'http://localhost:9457/upload/' + page.pdfs[0].OutputFile" 
            title="A4 size PDF." 
            class="w-full h-full"
          )

        div(class="border-t border-gray-200 p-4")
          div(class="text-center")
            button( 
              @click.prevent="onDownload"
              type="button"
              class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
            )
              i(class="fa fa-download mr-2")
              span Download

</template>
