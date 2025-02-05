<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";
import axios from "axios";
import { useLordStore } from "@/stores/LordStore";
import { v7 as uuidv7 } from 'uuid';
import { ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron/renderer';
import { cloneDeep, isEqual, isNull, isObject, toString, merge } from 'lodash';
import path from 'path';

// Type imports
import type { $cardMaker, $cardMakerPDF } from '@/declarations/index'

// Components
import { Input } from '@/components/ui/input'
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Skeleton } from '@/components/ui/skeleton'
import { RocketIcon } from '@radix-icons/vue'
import { Loader2 } from 'lucide-vue-next'

interface RepeaterItem {
  id: string;
  cardType: 'eshrem' | 'abha' | 'aadhaar' | null;
  file: File | null;
  password?: string;
  message?: string;
}

const lordStore = useLordStore();
const repeater = ref<RepeaterItem[]>([createNewRepeaterItem()]);
const page = ref<$cardMaker | null>(null);
const message = ref('');
const messageFile = ref('');
const messageWarning = ref('');
const messageWarningFile = ref('');
const isProcessing = ref(false);
const isDataToProcess = ref(false);

const options = ref([
  { label: "E-Shram", value: "eshram" },
  { label: "Abha", value: "abha" },
  { label: "Aadhaar", value: "aadhaar" },
].sort((a, b) => a.label.localeCompare(b.label)));

function createNewRepeaterItem(): RepeaterItem {
  return {
    id: uuidv7(),
    cardType: null,
    file: null
  };
}

function saveToMain() {
  lordStore.db.cardMaker = lordStore.db.cardMaker.map((el: $cardMaker) => {
    if (el.id === page.value?.id) {
      if (page.value?.pdfs) {
        page.value.pdfs = page.value?.pdfs?.filter((pdf: $cardMakerPDF) => isObject(pdf));
      }
      return page.value
    }
    return el;
  });
  lordStore.saveMain();
}

const addRepeaterField = () => repeater.value.push(createNewRepeaterItem());
const removeRepeaterField = (index: number) => {
  if (page.value?.pdfs) {
    page.value.pdfs = page.value?.pdfs?.filter((el: $cardMakerPDF) => el?.id != repeater.value[index]?.id);
  }
  repeater.value.splice(index, 1)
};
const handlePasswordChange = async (event: Event, index: number, card: $cardMakerPDF) => {
  console.log('password chnge', page.value?.pdfs?.length, page.value?.pdfs?.some((el: $cardMakerPDF) => el?.id === card.id), card)
  if (page.value?.pdfs?.length && page.value?.pdfs?.some((el: $cardMakerPDF) => el?.id === card.id)) {
    page.value.pdfs[index].password = toString(repeater.value[index].password);
    console.log('password sentttttt', page.value)
    message.value = 'Card processing. Please wait...'
    ipcRenderer.send('cardMaker', cloneDeep(page.value));
  }
}

const handleFileUpload = async (event: Event, index: number) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  let card = repeater.value[index]
  const password = card?.password;

  if (!file) return;

  if (card?.cardType == 'aadhaar' && !password) {
    message.value = 'Please enter the password for the Aadhaar card';
    // return;
  }

  if (isProcessing.value) {
    messageWarning.value = 'Please wait while processing the card...';
    isDataToProcess.value = true;
    return;
  }

  messageFile.value = file.name;
  repeater.value[index].file = file;
  isProcessing.value = true;

  const formData = new FormData();
  formData.append("sampleFile", file);
  formData.append("cardMaker", 'true');
  formData.append("index", index.toString());
  formData.append("cardType", repeater.value[index].cardType || '');
  formData.append("id", repeater.value[index].id);
  formData.append("password", repeater.value[index]?.password || '');

  if (page.value?.id) {
    formData.append("makerID", page.value.id);
  }

  try {
    const response = await axios.post(
      `http://${lordStore.db.ip}:9457/api/v1/upload/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    message.value = "File uploaded successfully!";

    if (response?.data?.pdfs?.length && !isEqual(page.value, response.data)) {
      message.value = 'Card processing. Please wait...'
      ipcRenderer.send('cardMaker', cloneDeep(response.data));
    }
    page.value = response.data;
  } catch (error) {
    repeater.value[index].file = null;
    message.value = axios.isAxiosError(error)
      ? error.response?.data.message || "Upload failed"
      : "An error occurred while uploading the file.";
    console.error("Upload error:", error);
    isProcessing.value = false;
  }
};

const resetFields = () => {
  repeater.value = [createNewRepeaterItem()];
  page.value?.pdfs?.splice(0);
};

// IPC Event Handlers
const ipcHandlers = {
  'cardMaker-failure': (event: IpcRendererEvent, response: { page: $cardMaker; card: $cardMakerPDF }) => {
    message.value = response.card.errorMessage || 'PDF conversion failed';
    messageFile.value = response.card.originalName || '';
    page.value = merge(page.value, response.page);
    isProcessing.value = false;
    if (isDataToProcess.value) {
      ipcRenderer.send('cardMaker', cloneDeep(page.value));
    }
  },
  'cardMaker-success': (event: IpcRendererEvent, returnPage: $cardMaker) => {
    message.value = `Card converted successfully`;
    page.value = merge(page.value, returnPage);
  },
  'cardMaker-image-extracted-failure': (event: IpcRendererEvent, { file, card }: { file: $cardMaker; card: $cardMakerPDF }) => {
    message.value = `Image extraction failed`;
    messageFile.value = card.originalName || '';
    isProcessing.value = false;
    if (isDataToProcess.value) {
      ipcRenderer.send('cardMaker', cloneDeep(page.value));
    }
  },
  'cardMaker-image-extracted-success': (event: IpcRendererEvent, file: $cardMaker) => {
    message.value = `Image extracted successfully`;
    page.value = merge(page.value, file);;
    console.log(file)

    const warning = file.pdfs?.find((el: $cardMakerPDF) => el?.warningMessage);
    if (warning) {
      messageWarning.value = warning.warningMessage || '';
      messageWarningFile.value = warning.originalName || '';
    }
    isProcessing.value = false;
    if (isDataToProcess.value) {
      ipcRenderer.send('cardMaker', cloneDeep(page.value));
    }
  },
  'cardMakerCreatePDF-failure': (event: IpcRendererEvent, returnPage: $cardMaker) => {
    message.value = `PDF creation failed`;
    page.value = merge(page.value, returnPage);
    isProcessing.value = false;
  },
  'cardMakerCreatePDF-success': (event: IpcRendererEvent, returnPage: $cardMaker) => {
    message.value = `PDF created successfully. You can download the PDF free!`;
    messageFile.value = returnPage.filename || '';
    page.value = merge(page.value, returnPage);
    saveToMain()
    isProcessing.value = false;
  }
};

// Register IPC listeners
Object.entries(ipcHandlers).forEach(([event, handler]) => {
  ipcRenderer.on(event, handler);
});

// Cleanup listeners
onBeforeUnmount(() => {
  Object.keys(ipcHandlers).forEach(event => {
    ipcRenderer.removeAllListeners(event);
  });
});

const onDownload = () => {
  if (!page.value?.outputFile) return;

  const file = {
    destination: page.value.outputFile,
    originalName: path.basename(page.value.outputFile)
  };

  try {
    ipcRenderer.send('download-file', cloneDeep(file));
  } catch (error) {
    console.error("Download failed:", error);
  }
};

const onSelectChange = (value: string, index: number) => {
  if (page.value?.pdfs?.length) {
    page.value.pdfs = page.value?.pdfs?.filter((el: $cardMakerPDF) => el?.id != repeater.value[index]?.id);
    repeater.value[index].file = null;
    saveToMain()
  }
  repeater.value[index].cardType = value as 'abha' | 'eshrem';
};

const onCreate = () => {
  if (page.value?.pdfs?.length) {
    message.value = "Please wait while creating PDF...";
    messageFile.value = ''
    isProcessing.value = true;
    ipcRenderer.send('cardMakerCreatePDF', cloneDeep(page.value));
  }
};
</script>

<template lang="pug">
.container.mx-auto.p-4
  h2.text-xl.font-bold.mb-4 Make card sheet for 100% free!
  .space-y-4
    Alert(v-if="message" variant="info")
      Loader2.w-4.h-4.animate-spin(v-if="isProcessing")
      RocketIcon.h-4.w-4(v-else)
      AlertTitle {{ message }}
      AlertDescription(v-if="messageFile") {{ messageFile }}

    .bg-yellow-100.border-l-4.border-yellow-500.text-yellow-700.p-4.rounded-md(
      v-if="messageWarning"
    )
      strong Warning! "{{ messageWarningFile }}"
      p {{ messageWarning }}

    div(
      v-for="(field, index) in repeater"
      :key="field.id"
      class="flex flex-wrap gap-2 items-center border p-3 rounded-lg shadow-sm"
    )
      .select-container.w-40
        Select(@update:modelValue="(value: string) => onSelectChange(value, index)")
          SelectTrigger.p-5
            SelectValue(placeholder="Select the Card")
          SelectContent
            SelectItem(
              v-for="option in options"
              :key="option.value"
              :value="option.value"
            ) {{ option.label }}

      .password-container.w-40(v-if="field.cardType === 'aadhaar'")
        Input(
          v-model="field.password"
          @change="(e: Event) => handlePasswordChange(e, index, field)"
          placeholder="PDF Password"
          class="border rounded-lg text-sm w-full"
        )

      .grid.w-full.max-w-sm.items-center(
        class="gap-1.5"
        :class="{ 'hover:cursor-not-allowed': !field.cardType }"
      )
        Input(
          :disabled="!field.cardType"
          :key="field.cardType"
          @change="(e: Event) => handleFileUpload(e, index)"
          type="file"
          accept=".pdf"
          class="border rounded-lg text-sm m-0 p-0 sm:w-full sm:max-w-full"
        )

      Button(
        @click="removeRepeaterField(index)"
        variant="destructive"
      ) Remove

  .flex.gap-3.mt-4
    Button(@click="addRepeaterField" variant="outline") + Add New Card
    Button(
      @click="resetFields"
      variant="secondary"
      class="border border-gray-300"
    ) Reset All

    Button(@click="onCreate" variant="default") Create PDF

    Button(
      @click="onDownload"
      :disabled="!page?.outputFile"
      variant="outline"
      class="bg-green-400 text-white"
    ) Download PDF

  .display-container.mt-10.border.p-4.rounded-lg.shadow-sm.max-w-4xl.h-auto(v-if="page?.id")
    h2.text-xl.font-bold.mb-4 Generated PDF

    .card-container
      .flex.items-center.justify-center.gap-4(v-for="card in page.pdfs?.filter(isObject)" :key="card.id")
        .flex-1.mb-4.border.border-gray-200.rounded-lg.min-h-32
          img(
            v-if="card?.cardFront"
            :src="`http://${lordStore.db.ip}:9457/upload/${card.cardFront}`"
            alt="Card front"
            class="w-full h-auto"
          )
          .w-full.p-4.shadow-sm(v-else)
            Skeleton.w-full.rounded-lg.mb-4(class="h-[100px]")
            .space-y-2.mb-4
              Skeleton.h-4(class="w-[80%]")
              Skeleton.h-4(class="w-[60%]")
            .space-y-2
              Skeleton.h-3.w-full
              Skeleton.h-3(class="w-[90%]")
              Skeleton.h-3(class="w-[85%]")
        .flex-1.mb-4.border.border-gray-200.rounded-lg.min-h-32
          img(
            v-if="card?.cardBack"
            :src="`http://${lordStore.db.ip}:9457/upload/${card.cardBack}`"
            alt="Card front"
            class="w-full h-auto"
          )
          .w-full.p-4.shadow-sm(v-else)
            Skeleton.w-full.rounded-lg.mb-4(class="h-[100px]")
            .space-y-2.mb-4
              Skeleton.h-4(class="w-[80%]")
              Skeleton.h-4(class="w-[60%]")
            .space-y-2
              Skeleton.h-3.w-full
              Skeleton.h-3(class="w-[90%]")
              Skeleton.h-3(class="w-[85%]")

</template>