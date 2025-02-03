<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from "vue";
import axios from "axios";
import { useLordStore } from "@/stores/LordStore";
import { v7 as uuidv7 } from 'uuid';
import { ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron/renderer';
import { cloneDeep, isNull } from 'lodash';
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

interface RepeaterItem {
  id: string;
  cardType: 'eshrem' | 'abha' | null;
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
].sort((a, b) => a.label.localeCompare(b.label)));

function createNewRepeaterItem(): RepeaterItem {
  return {
    id: uuidv7(),
    cardType: null,
    file: null
  };
}

const addRepeaterField = () => repeater.value.push(createNewRepeaterItem());
const removeRepeaterField = (index: number) => repeater.value.splice(index, 1);

const handleFileUpload = async (event: Event, index: number) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];

  if (!file) return;

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

    page.value = response.data;
    message.value = "File uploaded successfully!";
  } catch (error) {
    repeater.value[index].file = null;
    message.value = axios.isAxiosError(error)
      ? error.response?.data.message || "Upload failed"
      : "An error occurred while uploading the file.";
    console.error("Upload error:", error);
  } finally {
    isProcessing.value = false;
  }
};

const resetFields = () => {
  repeater.value = [createNewRepeaterItem()];
  page.value?.pdfs?.splice(0);
};

// IPC Event Handlers
const ipcHandlers = {
  'cardMaker-failure': (event: IpcRendererEvent, { file, card }: { file: $cardMaker; card: $cardMakerPDF }) => {
    message.value = 'PDF conversion failed';
    messageFile.value = card.originalName || '';
    page.value = file;
    isProcessing.value = false;
  },
  'cardMaker-success': (event: IpcRendererEvent, returnPage: $cardMaker) => {
    message.value = `Card converted successfully`;
    isProcessing.value = false;
  },
  'cardMaker-image-extracted-failure': (event: IpcRendererEvent, { file, card }: { file: $cardMaker; card: $cardMakerPDF }) => {
    message.value = `Image extraction failed`;
    messageFile.value = card.originalName || '';
    isProcessing.value = false;
  },
  'cardMaker-image-extracted-success': (event: IpcRendererEvent, file: $cardMaker) => {
    message.value = `Image extracted successfully`;
    page.value = file;
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
    page.value = returnPage;
    isProcessing.value = false;
  },
  'cardMakerCreatePDF-success': (event: IpcRendererEvent, returnPage: $cardMaker) => {
    message.value = `PDF created successfully. You can download the PDF free!`;
    messageFile.value = returnPage.filename || '';
    page.value = returnPage;
    lordStore.db.cardMaker = lordStore.db.cardMaker.map((el: $cardMaker) =>
      el.id === returnPage?.id ? returnPage : el
    );
    lordStore.saveMain();
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

// Watch page changes
watch(
  () => page.value?.pdfs?.length,
  (newLength, oldLength) => {
    console.log(!isProcessing.value, newLength, newLength !== oldLength)
    if (!isProcessing.value && newLength && newLength !== oldLength) {
      isProcessing.value = true;
      message.value = 'Card processing...'
      ipcRenderer.send('cardMaker', cloneDeep(page.value));
    } else if (isProcessing.value) {
      isDataToProcess.value = true;
    }
  }
);

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
  if (repeater.value[index].cardType && page.value?.pdfs?.length) {
    page.value.pdfs.splice(index, 1);
    repeater.value[index].file = null;
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
      RocketIcon.h-4.w-4
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
          placeholder="PDF Password"
          class="border rounded-lg text-sm w-full"
        )

      .grid.w-full.max-w-sm.items-center(
        class="gap-1.5"
        :class="{ 'hover:cursor-not-allowed': !field.cardType }"
      )
        Input(
          :disabled="!field.cardType"
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
      .flex.items-center.justify-center.gap-4(v-for="card in page.pdfs" :key="card.id")
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