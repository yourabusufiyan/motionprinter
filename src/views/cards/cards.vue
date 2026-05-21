<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useLordStore } from '@/stores/LordStore';
import { v7 as uuidv7 } from 'uuid';
import { ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron/renderer';
import {
  cloneDeep,
  isEqual,
  isNull,
  isObject,
  toString,
  merge,
  last,
  find,
  unionBy,
  uniqBy,
  reduce,
} from 'lodash';
import path from 'path';
import { shell } from 'electron';

// Type imports
import type { $cardMaker, $cardMakerPDF } from '@/declarations/index';

// Components
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton';
import { RocketIcon, QuestionMarkCircledIcon } from '@radix-icons/vue';
import {
  Loader2,
  RotateCcw,
  FileText,
  Download,
  Plus,
  Trash2,
  IdCard,
  Printer,
  ImageDown,
  ArrowLeftCircleIcon
} from 'lucide-vue-next';

type cardType =
  | 'custom'
  | 'aadhaar'
  | 'abc_apaar'
  | 'apaar'
  | 'abha'
  | 'ayushman'
  | 'csc_id'
  | 'eshrem'
  | 'nielit_student_id'
  | 'pan'
  | 'voter_new'
  | 'ration'
  | 'udid'
  | null;

interface RepeaterItem {
  id: string;
  cardType: cardType;
  provider?: 'uti' | 'nsdl' | null;
  abcTo?: 'abc' | 'apaar' | null;
  file: File | null;
  password?: string;
  message?: string;
}

const lordStore = useLordStore();
const router = useRouter();
const route = useRoute();

const repeater = ref<RepeaterItem[]>([createNewRepeaterItem()]);
const page = ref<$cardMaker | null>(null);
const message = ref('');
const messageFile = ref('');
const messageWarning = ref('');
const messageWarningFile = ref('');
const isProcessing = ref(false);
const isDataToProcess = ref(false);
const isChangedAfterCreatingPDF = ref(false);

const options = ref(
  [
    { label: 'Custom Card', value: 'custom' },
    { label: 'E-Shram Card', value: 'eshram' },
    { label: 'Abha Card', value: 'abha' },
    { label: 'Aadhaar Card', value: 'aadhaar' },
    { label: 'Ayushman Card', value: 'ayushman' },
    { label: 'Pan Card', value: 'pan' },
    { label: 'Voter ID(New/e-EPIC) Card', value: 'voter_new' },
    { label: 'ABC', value: 'abc_apaar' },
    { label: 'APAAR', value: 'apaar' },
    { label: 'CSC ID Card', value: 'csc_id' },
    { label: 'NIELIT Student ID Card', value: 'nielit_student_id' },
    { label: 'Ration Card', value: 'ration' },
    { label: 'UDID Card', value: 'udid' },
  ].sort((a, b) => {
    if (b.value == 'custom') return 1;
    return a.label.localeCompare(b.label);
  }),
);
const providers = ref([
  { label: 'UTIITSL', value: 'uti' },
  { label: 'NSDL', value: 'nsdl' },
]);

const abcTo = ref([
  { label: 'ABC', value: 'abc' },
  { label: 'APAAR', value: 'apaar' },
]);

function resetCreatedPDF() {
  if (page.value?.pdfs?.length && page.value?.outputFile) {
    page.value.outputFile = null;
    page.value.filename = '';
    saveToMain();
  }
}

function createNewRepeaterItem(): RepeaterItem {
  return {
    id: uuidv7(),
    cardType: null,
    file: null,
  };
}

function saveToMain() {
  console.log(lordStore.lowdb.data);
  isChangedAfterCreatingPDF.value = true;
  let data = lordStore.db.cardMaker.map((el: $cardMaker, i: number) => {
    if (el.id === page.value?.id) {
      if (page.value?.pdfs) {
        page.value.pdfs = page.value?.pdfs?.filter((pdf: $cardMakerPDF) =>
          isObject(pdf),
        );
      }
      el = merge(el, page.value);
    }
    return el;
  });
  console.log('last page: ', last(data));
  lordStore.lowdb.data = lordStore.db;
  lordStore.saveLowDB();
}

const addRepeaterField = () => repeater.value.push(createNewRepeaterItem());
const removeRepeaterField = (index: number) => {
  if (page.value?.pdfs) {
    page.value.pdfs = page.value?.pdfs?.filter(
      (el: $cardMakerPDF) => el?.id != repeater.value[index]?.id,
    );
  }
  repeater.value.splice(index, 1);
  resetCreatedPDF();
  saveToMain();
};
const handlePasswordChange = async (
  event: Event,
  index: number,
  card: $cardMakerPDF,
) => {
  if (
    page.value?.pdfs?.length &&
    page.value?.pdfs?.some((el: $cardMakerPDF) => el?.id === card.id)
  ) {
    page.value.pdfs[index].password = toString(repeater.value[index].password);
    message.value = 'Card processing in high quality. Please wait...';
    isProcessing.value = true;
    ipcRenderer.send('cardMaker', cloneDeep(page.value));
  }

};

const handleFileUpload = async (event: Event, index: number) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  let card = repeater.value[index];
  const password = card?.password;

  if (!file) return;

  resetCreatedPDF();

  if (!card.cardType) {
    message.value = 'Please select the card type first';
    return;
  }

  if (isProcessing.value) {
    messageWarning.value = 'Please wait while processing the card...';
    isDataToProcess.value = true;
  }

  messageFile.value = file.name;
  repeater.value[index].file = file;
  isProcessing.value = true;

  const formData = new FormData();
  formData.append('sampleFile', file);
  formData.append('cardMaker', 'true');
  formData.append('index', index?.toString());
  formData.append('cardType', repeater.value[index].cardType?.toString() || '');
  formData.append('id', repeater.value[index].id.toString());
  formData.append(
    'password',
    repeater.value[index]?.password?.toString() || '',
  );
  formData.append('addedBy', lordStore.db.computerName || '');

  if (card.cardType == 'pan' && card?.provider) {
    formData.append('provider', card.provider.toString() as string);
  }
  console.log('abcTo', repeater.value[index]);
  console.log('abcTo', repeater.value[index]?.abcTo);
  console.log('cardType', repeater.value[index].cardType);
  if (repeater.value[index].cardType == 'abc_apaar' && repeater.value[index]?.abcTo) {
    formData.append('abcTo', repeater.value[index].abcTo.toString() as string);
  }


  if (repeater.value[index].cardType?.toString() == 'custom') {
    if (target.id == 'card-front') {
      formData.append('cardFront', 'true');
    } else if (target.id == 'card-back') {
      formData.append('cardBack', 'true');
    }
  }

  if (page.value?.id) {
    formData.append('makerID', page.value.id);
  }

  console.log('going to make a upload request');

  try {
    const response = await axios.post(
      `http://${lordStore.db.ip}:9457/api/v1/upload/`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    message.value = 'File uploaded successfully!';

    console.log(response.data);

    if (response?.data?.pdfs?.length && !isEqual(page.value, response.data)) {
      message.value = 'Card processing. Please wait...';
      ipcRenderer.send('cardMaker', cloneDeep(response.data));
    }

    if (response?.data?.pdfs?.length && page.value?.pdfs?.length) {
      page.value = response.data as $cardMaker;

      let temp = cloneDeep(response.data?.pdfs);
      page.value.pdfs = [];
      repeater.value.filter((el, i) => {
        if (page.value?.pdfs?.length) {
          page.value.pdfs.push(find(temp, ['id', el.id]));
        }
      });
    }
  } catch (error) {
    repeater.value[index].file = null;
    message.value = axios.isAxiosError(error)
      ? error.response?.data.message || 'Upload failed'
      : 'An error occurred while uploading the file.';
    console.error('Upload error:', error);
    isProcessing.value = false;
  }
};

const resetFields = () => {
  repeater.value = [createNewRepeaterItem()];
  message.value = '';
  messageFile.value = '';
  messageWarning.value = '';
  messageWarningFile.value = '';
  isProcessing.value = false;
  isDataToProcess.value = false;
  resetCreatedPDF();
  saveToMain();
};

// IPC Event Handlers
const ipcHandlers = {
  'cardMaker-failure': (
    event: IpcRendererEvent,
    response: { page: $cardMaker; card: $cardMakerPDF },
  ) => {
    message.value = response.card.errorMessage || 'PDF conversion failed';
    if (
      ['aadhaar', 'pan'].includes(response.card?.cardType as string) &&
      !response.card.password?.length &&
      response.card?.errorMessage?.length
    ) {
      message.value = `Please enter the password for the ${response.card.cardType} card`;
    }
    messageFile.value = response.card.originalName || '';
    page.value = merge(page.value, response.page);
    isProcessing.value = false;
  },
  'cardMaker-success': (event: IpcRendererEvent, returnPage: $cardMaker) => {
    message.value = `Card converted successfully`;
    page.value = merge(page.value, returnPage);
    saveToMain();
  },
  'cardMaker-image-extracted-failure': (
    event: IpcRendererEvent,
    { file, card }: { file: $cardMaker; card: $cardMakerPDF },
  ) => {
    message.value = `Image extraction failed`;
    messageFile.value = card.originalName || '';
    isProcessing.value = false;
  },
  'cardMaker-image-extracted-success': (
    event: IpcRendererEvent,
    returnPage: $cardMaker,
  ) => {
    message.value = `Image extracted successfully`;
    page.value = merge(page.value, returnPage);
    saveToMain();
    console.log(returnPage);

    const warning = returnPage.pdfs?.find(
      (el: $cardMakerPDF) => el?.warningMessage,
    );
    if (warning) {
      messageWarning.value = warning.warningMessage || '';
      messageWarningFile.value = warning.originalName || '';
    }
    isProcessing.value = false;
    if (isDataToProcess.value) {
      ipcRenderer.send('cardMaker', cloneDeep(page.value));
    }
  },
  'cardMakerCreatePDF-failure': (
    event: IpcRendererEvent,
    returnPage: $cardMaker,
  ) => {
    message.value = `PDF creation failed`;
    page.value = merge(page.value, returnPage);
    isProcessing.value = false;
  },
  'cardMakerCreatePDF-success': (
    event: IpcRendererEvent,
    returnPage: $cardMaker,
  ) => {
    message.value = `PDF created successfully. You can download the PDF free!`;
    messageFile.value = returnPage.filename || '';
    page.value = merge(page.value, returnPage);
    saveToMain();
    isProcessing.value = false;
  },
};

// Register IPC listeners
Object.entries(ipcHandlers).forEach(([event, handler]) => {
  ipcRenderer.on(event, handler);
});

// Cleanup listeners
onBeforeUnmount(() => {
  Object.keys(ipcHandlers).forEach((event) => {
    ipcRenderer.removeAllListeners(event);
  });
});

const onDownload = () => {
  if (!page.value?.outputFile) return;

  const file = {
    destination: page.value.outputFile,
    originalName: path.basename(page.value.outputFile),
  };

  try {
    ipcRenderer.send('download-file', cloneDeep(file));
  } catch (error) {
    console.error('Download failed:', error);
  }
};

const onImageDownload = (card: $cardMakerPDF, side: 'front' | 'back') => {

  let ImageName = side === 'front' ? card.cardFront : card.cardBack;
  const file = {
    fileUrl: `http://${lordStore.db.ip}:9457/upload/${ImageName}`,
    originalName: card.id + (side === 'front' ? '-front' : '-back') + path.extname(ImageName as string),
  };

  try {
    ipcRenderer.send('download-file', cloneDeep(file));
  } catch (error) {
    console.error('Download failed:', error);
  }
};

const onSelectChange = (value: cardType, index: number) => {
  if (page.value?.pdfs?.length) {
    page.value.pdfs = page.value?.pdfs?.filter(
      (el: $cardMakerPDF) => el?.id != repeater.value[index]?.id,
    );
    repeater.value[index].file = null;
    saveToMain();
  }
  repeater.value[index].cardType = value as 'abha' | 'eshrem';
  resetCreatedPDF();
};

const onCreate = () => {
  if (page.value?.pdfs?.length) {
    message.value = 'Please wait while creating PDF...';
    messageFile.value = '';
    isProcessing.value = true;
    isDataToProcess.value = false;
    ipcRenderer.send('cardMakerCreatePDF', cloneDeep(page.value));
  }
};

const onPrint = async () => {
  ipcRenderer.send('printFile', {
    path: page.value?.outputFile?.toString(),
    options: { printDialog: true },
  });
};

const onMakeNewPDF = async () => {
  repeater.value = [createNewRepeaterItem()];
  page.value = null;
  message.value = '';
  messageFile.value = '';
  messageWarning.value = '';
  messageWarningFile.value = '';
  isProcessing.value = false;
  isDataToProcess.value = false;
};

const disabledUploadFile = (field: RepeaterItem) => {
  if (!field.cardType) return true;

  if (field.cardType === 'pan' && !field.provider) return true;

  return false;
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
      AlertDescription(v-else) 
        Skeleton(class="w-[210px] h-4 rounded-none mt-2")

    .bg-yellow-100.border-l-4.border-yellow-500.text-yellow-700.p-4.rounded-md(
      v-if="messageWarning"
    )
      strong Warning! "{{ messageWarningFile }}"
      p {{ messageWarning }}

    .flex.flex-wrap.gap-2.items-center.border.p-3.rounded-lg.shadow-sm.space-y-4.space-x-4(
      v-for="(field, index) in repeater"
      :key="field.id"
    )
      .select-container.card-type-container.w-40.place-self-end
        Label.mb-1(:for="'cardType-' + field.id") 
          | Card Type 
          Dialog
            DialogTrigger 
              QuestionMarkCircledIcon.inline.align-text-top(v-if="field.cardType")
            DialogContent
              DialogHeader
                DialogTitle.text-center.mb-3 Demo File of "{{  options.filter(el => el.value == field.cardType)?.[0].label }}"
                DialogDescription 
                  img.border.border-2(
                    v-if="field?.cardType"
                    :src="`http://${lordStore.db.ip}:9457/upload/demo-${field.cardType}-9457ai.jpg`"
                  )

        NativeSelect( :id="'cardType-' + field.id" @update:modelValue="(value: string) => onSelectChange(value, index)" )
          NativeSelectOption(value="") Select the Card
          NativeSelectOption(
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            :disabled="option.disabled || false"
          ) {{ option.label }}
      
      .select-container.w-40.place-self-end(v-if="field.cardType === 'pan'")
        Label.mb-1(for="pan-provider") Pan Provider 
        Select#pan-provider(v-model="field.provider")
          SelectTrigger.p-5
            SelectValue(placeholder="Select the Provider")
          SelectContent
            SelectItem(
              v-for="provider in providers"
              :key="provider.value"
              :value="provider.value"
            ) {{ provider.label }}

      .select-container.w-40.place-self-end(v-if="field.cardType === 'abc_apaar'")
        Label.mb-1(for="abc_apaar") To
        Select#abc_apaar(v-model="field.abcTo")
          SelectTrigger.p-5
            SelectValue(placeholder="Select the Provider")
          SelectContent
            SelectItem(
              v-for="t in abcTo"
              :key="t.value"
              :value="t.value"
            ) {{ t.label }}

      .password-container.w-40.place-self-end(v-if="['aadhaar', 'pan'].includes(field.cardType)")
        Input(
          v-model="field.password"
          @change="(e: Event) => handlePasswordChange(e, index, field)"
          placeholder="PDF Password"
          class="border rounded-lg text-sm w-full"
          
        )

      
      .grid.w-full.max-w-sm.items-center.place-self-end(
        class="gap-1.5"
        :class="{ 'hover:cursor-not-allowed': disabledUploadFile(field) }"
        v-if="field.cardType != 'custom'"
      )  
        Label(for="card-pdf") Card's PDF
        Input#card-pdf(
          :disabled="disabledUploadFile(field)"
          :key="field.cardType"
          @change="(e: Event) => handleFileUpload(e, index)"
          type="file"
          accept=".pdf"
          class="border rounded-lg text-sm m-0 p-0 sm:w-full sm:max-w-full"
        )

      .grid.w-full.max-w-sm.items-center.place-self-end(
        class="gap-1.5"
        :class="{ 'hover:cursor-not-allowed': !field.cardType }"
        v-if="field.cardType === 'custom'"
      )  
        Label(for="card-front") Card Front
        Input#card-front(
          :disabled="!field.cardType"
          :key="field.cardType"
          @change="(e: Event) => handleFileUpload(e, index)"
          type="file"
          accept="image/*"
          class="border rounded-lg text-sm m-0 p-0 sm:w-full sm:max-w-full"
        )

      .grid.w-full.max-w-sm.items-center.place-self-end(
        class="gap-1.5"
        v-if="field.cardType === 'custom'"
      )  
        Label(for="card-back") Card Back 
        Input#card-back(
          :disabled="!field.cardType"
          :key="field.cardType"
          @change="(e: Event) => handleFileUpload(e, index)"
          type="file"
          accept="image/*"
          class="border rounded-lg text-sm m-0 p-0 sm:w-full sm:max-w-full"
          
        )

      Button.place-self-end(
        @click="removeRepeaterField(index)"
        variant="destructive"
      ) #[Trash2.py-1] Remove

  .flex.gap-3.mt-8.flex-wrap
    Button(@click="addRepeaterField" variant="outline" :disabled="isProcessing") #[Plus.m-0.-ml-2] Add New Card
    Button(@click="resetFields" variant="destructive" class="border border-gray-300" ) 
      | #[RotateCcw.-ml-1] Remove All
    Button(@click="onCreate" variant="default")
      | #[Loader2.w-4.h-4.-ml-1.animate-spin(v-if="isProcessing && false")] #[FileText.-ml-1(v-else)] {{ page?.outputFile ? 'Re-Submit' : 'Submit' }}
    Button(
      @click="onDownload"
      v-if="page?.outputFile"
      variant="outline"
      class="bg-green-400 text-white"
      
    ) #[Download.-ml-1] Save as PDF
    Button(
      @click="onPrint()"
      v-if="page?.outputFile"
      variant="outline"
      class="bg-slate-600 text-white"
    ) #[Printer.-ml-1] Print 
    Button(
      @click="onMakeNewPDF()"
      v-if="page?.outputFile"
      variant="outline"
      class="bg-blue-600 text-white"
    ) #[ArrowLeftCircleIcon.-ml-1] New 

  .display-container.mt-10.border.p-4.rounded-lg.shadow-sm.max-w-4xl.h-auto(v-if="!isNull(page)")
    h2.text-xl.font-bold.mb-4 Generated PDF
    .card-container(v-if="!page?.outputFile")
      .flex.items-center.justify-center.gap-4.mb-4(v-for="card in page?.pdfs?.filter(isObject)" :key="card.id")
        .card-front.flex-1.border.border-gray-200.rounded-lg.min-h-32.max-h-64.relative
          .download-icon.absolute.top-0.right-0.bg-black.text-white.p-2.transition-all.ease-out.opacity-20(
            class="border border-black rounded-bl-lg",
            class="hover:cursor-pointer hover:bg-white hover:text-black hover:opacity-100 ",
            @click="onImageDownload(card, 'front')"
          )
            ImageDown
          img(
            v-if="card?.cardFront"
            :src="`http://${lordStore.db.ip}:9457/upload/${card.cardFront}`"
            alt="Card front"
            class="w-full h-auto max-h-64"
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
        .card-back.flex-1.border.border-gray-200.rounded-lg.min-h-32.max-h-64.relative
          .download-icon.absolute.top-0.right-0.bg-black.text-white.p-2.transition-all.ease-out.opacity-20(
            class="border border-black rounded-bl-lg",
            class="hover:cursor-pointer hover:bg-white hover:text-black hover:opacity-100",
            @click="onImageDownload(card, 'back')"
          )
            ImageDown
          img(
            v-if="card?.cardBack"
            :src="`http://${lordStore.db.ip}:9457/upload/${card.cardBack}`"
            alt="Card front"
            class="w-full h-auto max-h-64"
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
    .card-container(v-if="page?.outputFile")
      embed(
        :src="`http://${lordStore.db.ip}:9457/upload/${page?.filename}`"
        type="application/pdf",
        width="100%",
        height="600px"
      )
pre.hidden {{ page }}
</template>

<style lang="stylus">
.card-container
  & .card-front > .w-full, & .card-back > .w-full {
    aspect-ratio: 1011/638;
  }
.card-type-container > div > svg {
  display none !important
}
</style>
