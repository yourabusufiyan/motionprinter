<script setup lang="ts">
import { ref } from "vue";
import axios from "axios";
import { address } from "ip";
import { useLordStore } from "@/stores/LordStore";
import { v7 as uuidv7 } from 'uuid';
import { ipcRenderer } from 'electron';
import { clone, cloneDeep, isNull } from 'lodash'
import path from 'path';

import type { $cardMaker, $cardMakerPDF } from '@/declarations/index'


import { Input } from '@/components/ui/input'
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { RocketIcon } from '@radix-icons/vue'

// Define the structure for each repeater field entry
interface RepeaterItem {
  id: string;
  cardType: 'eshrem' | null;
  file: File | null;
  password?: string | null;
  message?: string | null;
}

// Reactive state for repeater fields
const repeater = ref<RepeaterItem[]>([
  { id: uuidv7(), cardType: null, file: null }
]);
let page = ref<$cardMaker | null>(null)
const message = ref('')
const messageFile = ref('')
const messageWarning = ref('')
const messageWarningFile = ref('')
const lordStore = useLordStore()

// Options for select field
const options = ref([
  { label: "E-Shram", value: "eshram" },
]);


const addRepeaterField = () => {
  repeater.value.push({ id: uuidv7(), cardType: null, file: null });
};

const removeRepeaterField = (index: number) => {
  repeater.value.splice(index, 1);
};

// Function to handle file selection
const handleFileUpload = (event: Event, index: number) => {
  const target = event.target as HTMLInputElement;
  const file = ref<File | null>(null);

  if (target.files && target.files[0]) {

    repeater.value[index].file = target.files[0];
    file.value = target.files[0]

    var formData = new FormData();
    formData.append("sampleFile", file.value as Blob);
    formData.append("cardMaker", 'true');
    formData.append("index", index.toString());
    formData.append("cardType", repeater.value[index].cardType as string);
    formData.append("id", repeater.value[index].id as string);
    formData.append("password", repeater.value[index]?.password || '' as string);

    if (page.value?.id) {
      formData.append("makerID", page.value.id);
    }

    axios.post(`http://${lordStore.db.ip}:9457/api/v1/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then((res) => {
        page.value = res.data
        message.value = "File uploaded successfully!";
      })
      .catch(e => {
        repeater.value[index].file = null;
        message.value = e.response.data.message || "An error occurred while uploading the file.";
        console.error(e);
      })

  }
};

const submitData = async () => {


};

// Function to reset the repeater fields
const resetFields = () => {
  repeater.value = [{ id: uuidv7(), cardType: null, file: null, password: '' }];
  if (!isNull(page.value)) {
    page.value.pdfs = []
  }
};


watch(page, () => {
  if (page?.value?.id && page.value?.pdfs?.length) {
    ipcRenderer.send('cardMaker', cloneDeep(page.value))
    console.log('page', page)
  }
});

watch(message, () => {
  setTimeout(() => {
    message.value = ''
  }, 10_000)
})

ipcRenderer.on('cardMaker-failure', (event, { file, card }: { file: $cardMaker, card: $cardMakerPDF }) => {
  message.value = 'Something went wrong while converting the pdf.'
  messageFile.value = card.originalName as string
  page.value = file
  lordStore.db.cardMaker = lordStore.db.cardMaker.map((el: $cardMaker) => {
    if (el.id == file?.id) {
      console.log('Updated', el)
      return file
    }
    return el
  })
  lordStore.saveMain()
});

ipcRenderer.on('cardMaker-success', (event, file: $cardMaker) => {
  message.value = `Card has been converted successfully`
  page.value = file
  lordStore.db.cardMaker = lordStore.db.cardMaker.map((el: $cardMaker) => {
    if (el.id == file?.id) {
      console.log('Updated', el)
      return file
    }
    return el
  })
  lordStore.saveMain()
});

ipcRenderer.on('cardMaker-image-extracted-failure', (event, { file, card }: { file: $cardMaker, card: $cardMakerPDF }) => {
  message.value = `Something went wrong while cropping card from pdf`
  messageFile.value = card.originalName as string
});

ipcRenderer.on('cardMaker-image-extracted-success', (event, file: $cardMaker) => {
  message.value = `card image extracted successfully`
  page.value = file
  ipcRenderer.send('cardMakerCreatePDF', cloneDeep(page.value))

  file.pdfs?.filter((el: $cardMakerPDF) => {
    if (el?.warningMessage) {
      messageWarning.value = el.warningMessage
      messageWarningFile.value = el.originalName as string
    }
  })

});

ipcRenderer.on('cardMakerCreatePDF-failure', (event, returnPage: $cardMaker) => {
  message.value = `Something went wrong during PDF file creating.`
  console.log('cardMakerCreatePDF-failure', returnPage)
  page.value = returnPage
});

ipcRenderer.on('cardMakerCreatePDF-success', (event, returnPage: $cardMaker) => {
  message.value = `PDF file created successfully`
  console.log('cardMakerCreatePDF-success', returnPage)
  page.value = returnPage
  lordStore.db.cardMaker = lordStore.db.cardMaker.map((el: $cardMaker) => {
    if (el.id == returnPage?.id) {
      console.log('Updated', el)
      return returnPage
    }
    return el
  })
  lordStore.saveMain()
});

function onDownload(): void {
  console.log('onDownload', page.value)
  try {
    if (page.value?.outputFile) {
      let file: any = {
        destination: page.value.outputFile as string,
        originalName: path.basename(page.value.outputFile as string),
      }
      ipcRenderer.send('download-file', cloneDeep(file))
    }
  } catch (error) {
    console.error("Download failed:", error);
  }
}

</script>

<template lang="pug">
.container.mx-auto.p-4
  h2.text-xl.font-bold.mb-4 Make card sheet for 100% free!

  .space-y-4
    
    Alert( v-if="message?.length" variant="info" ) 
      RocketIcon(class="h-4 w-4")
      AlertTitle {{ message }}
      AlertDescription(v-if="messageFile.length") {{ messageFile }}
    
    div( v-if="messageWarning.length" class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md")
      strong Warning! "{{ messageWarningFile }}"
      p {{ messageWarning }}

    div(v-for="(field, index) in repeater" :key="field.id" class="flex flex-wrap gap-2 items-center border p-3 rounded-lg shadow-sm")
      
      .select-container.w-40
        Select(@update:modelValue="(value) => field.cardType = value")
          SelectTrigger.p-5
            SelectValue(placeholder="Select Option")
          SelectContent
            SelectItem(v-for="option in options" :key="option.value" :value="option.value") {{ option.label }}
      
      .password-container.w-40(v-if="field.cardType == 'aadhaar'")
        Input(
          v-model="field.password"
          placeholder="Enter PDF's Password"
          class="border rounded-lg text-sm w-full")

      .grid.w-full.max-w-sm.items-center(
        class="gap-1.5"
          :class="{'hover:cursor-not-allowed': !field.cardType}"
      )
        Input(
          :disabled="!field.cardType"
          @change="(e) => handleFileUpload(e, index)"
          type="file"
          accept=".pdf"
          class="border rounded-lg text-sm m-0 p-0 sm:w-full sm:max-w-full"
        )

      Button(@click="removeRepeaterField(index)" variant="destructive") Remove


  // Action buttons
  Button(@click="addRepeaterField" variant="outline" class="mt-3") + Add New Card
  div.flex.gap-3.mt-4
    Button(@click="submitData" v-if="page?.id" variant="default") Create PDF File
    Button(@click="resetFields" variant="secondary" class="border border-gray-300") Remove All Cards
    Button(@click="onDownload()" :disabled="!page?.outputFile" variant="outline" class="bg-green-400 text-white") Download PDF

.display-container.mt-10(
    v-if="page?.id"
    class="border p-4 rounded-lg shadow-sm"
  )
    h2.text-xl.font-bold.mb-4 Generated PDF
    .card-container.flex.gap-4( v-for="card in page.pdfs" :key="page.id")
      .flex-1.mb-4.border.border-gray-200.rounded-lg.min-h-32
        img( :src="`http://${lordStore.db.ip}:9457/upload/${card.cardFront}`" alt="Generated PDF" class=" w-full h-auto")
      .flex-1.mb-4.border.border-gray-200.rounded-lg.min-h-32
        img( :src="`http://${lordStore.db.ip}:9457/upload/${card.cardBack}`" alt="Generated PDF" class=" w-full h-auto")

</template>
