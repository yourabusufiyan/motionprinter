<script lang="ts" setup>

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from '@/components/ui/number-field'
import PhotoItem from './PhotoItem.vue'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area';

import { Loader2 } from 'lucide-vue-next'
import axios from 'axios'
import { ipcRenderer } from 'electron';
import { cloneDeep, isNull, isUndefined, merge } from 'lodash';
import { useLordStore } from '@/stores/LordStore';
import { v7 as uuidv7 } from 'uuid';

import type { $photoSheetPhoto, $photoSheet } from '@/declarations';

const lordStore = useLordStore();

// State management
const currentPage = ref<$photoSheet>({
  id: uuidv7().split('-').slice(0, 3).join(''),
  photos: [],
})
const pages = ref<$photoSheet[]>([{ id: '', photos: [] }])
const currentPageIndex = ref(0)
const selectedGrid = ref('6x7')
const selectedPaperSize = ref('a4')
const cellWidth = ref(50)
const cellHeight = ref(50)
const cellGap = ref(5)
const paperZoom = ref(1)
const isRotating = ref(false)
const rotationStartAngle = ref(0)
const initialRotation = ref(0)
const selectedCellIndex = ref<number | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const pdfContent = ref<HTMLElement | null>(null);
const isPrinting = ref(false);
const isPdfDownloading = ref(false);
const defaultAccordion = 'options';

// Constants
const gridLayouts = [
  // { label: 'Custom', value: 'custom' },
  { label: '1 Photo', value: '1x1' },
  { label: '2 Photos', value: '1x2' },
  { label: '4 Photos', value: '2x2' },
  { label: '9 Photos', value: '3x3' },
  { label: '16 Photos', value: '4x4' },
  { label: '24 Photos', value: '4x6' },
  { label: '30 Photos(5x6)', value: '5x6' },
  { label: '30 Photos(6x5)', value: '6x5' },
  { label: '36 Photos', value: '6x6' },
  { label: '42 Photos', value: '6x7' },
]

const paperSizes = [
  { name: 'A4', value: 'a4', width: 210, height: 297 },
  { name: 'Letter', value: 'letter', width: 216, height: 279 },
]

// Computed properties
const paperSize = computed(() => paperSizes.find((s) => s.value === selectedPaperSize.value)!)
const gridCells = computed(() => {
  return gridCellsFunc(selectedGrid.value)
})
const gridStyle = computed(() => {
  return gridStyleFunc(selectedGrid.value, cellGap.value.toString() + 'mm')
});
const paperStyle = computed(() => ({
  transform: `scale(${paperZoom.value})`,
  transformOrigin: 'center center',
  width: `${paperSize.value.width}mm`,
  height: `${paperSize.value.height}mm`,
}))
const isInAction = computed(() => isPrinting.value || isPdfDownloading.value)


// Methods

function gridCellsFunc(val: string) {
  const [cols, rows] = val.split('x').map(Number)
  return cols * rows
}
function gridStyleFunc(val: string, gap: string = '5mm') {
  const [cols, rows] = val.split('x');
  const isCustom = val === 'custom';
  return {
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridTemplateRows: `repeat(${rows}, 1fr)`,
    gap
  }
}

const handlePaperZoom = (e: WheelEvent) => {
  if (e.ctrlKey) {
    e.preventDefault()
    paperZoom.value *= e.deltaY > 0 ? 0.95 : 1.05
    paperZoom.value = Math.min(Math.max(0.5, paperZoom.value), 3)
  }

}

const handleCellClick = (index: number, e: MouseEvent, copy: false) => {
  e.stopPropagation()
  if (copy && e.altKey && currentPage.value.photos[index]) {

    console.log('selected cell ', currentPage.value.photos[index], currentPage.value.photos.length)
    // currentPage.value.photos.splice(index + 1, 0, { ...currentPage.value.photos[index] })

    let arr = currentPage.value.photos;
    let totalGrid = gridCells.value;
    let i = index;

    if (totalGrid == (i + 1)) {
      console.log('no next to copy')
      return;
    }

    let nextFilled = -1;
    for (let j = i + 1; j <= totalGrid; j++) {
      if (arr[j] && nextFilled < 0 && arr[i]?.id != arr[j]?.id) {
        nextFilled = j
        console.log('Next Filled value is  : ', j)
        break;
      }
      if (j >= arr.length) {
        if (!arr[j]) {
          nextFilled = j
          break;
        } else if (arr[i]?.id == arr[j]?.id) {
          continue;
        }
      }
    }
    console.log('nextFilled', nextFilled)

    if (nextFilled > 0) {
      for (let k = i + 1; k <= nextFilled; k++) {
        if (k == nextFilled) {
          console.log("no null between next filled, replacing with splice")
          arr.splice(i, 0, arr[i])
          break;
        }

        if (!arr[k]) {
          console.log('copied to ', k)
          arr.splice(k, 1, arr[i])
          break;
        }
      }
    }

    if (arr.length > totalGrid) {
      arr.splice(totalGrid)
    }

    console.log('final arr length: ', arr.length)

  } else if (!copy) {
    selectedCellIndex.value = index
    fileInput.value?.click()
  }
}



const addNewPage = () => {
  pages.value.push({ id: '', photos: [] })
  currentPageIndex.value = pages.value.length - 1
}

const removeCurrentPage = () => {
  if (pages.value.length > 1) {
    pages.value.splice(currentPageIndex.value, 1)
    currentPageIndex.value = Math.max(0, currentPageIndex.value - 1)
  }
}

const findNextEmptyCell = (startIndex: number) => {
  for (let i = startIndex + 1; i < gridCells.value; i++) {
    if (!currentPage.value.photos[i]) return i
  }
  return -1
}

const removePhoto = (pageIndex: number, photoIndex: number) => {
  currentPage.value.photos.splice(photoIndex, 1)
}

const handleFileSelect = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return

  const isSingle = files.length === 1
  for (let i = 0; i < files.length; i++) {

    const file = files[i]
    const reader = new FileReader()
    let o: $photoSheetPhoto = {
      src: '',
      zoom: 1,
      rotation: 0,
      position: { x: 0, y: 0 },
      width: 0,
      height: 0,
    } as $photoSheetPhoto;
    let index: number = selectedCellIndex.value as number;

    reader.onload = (event) => {

      var image = new Image();
      image.src = reader.result as string;
      image.onload = function () {
        // o.src = event.target?.result as string;
        o.width = image.width;
        o.height = image.height;
      };

    }
    reader.readAsDataURL(file)

    const formData = new FormData();
    formData.append("sampleFile", file);
    formData.append("temp", 'true');
    formData.append("addedBy", lordStore.db.computerName || '');

    try {
      const response = await axios.post(
        `http://${lordStore.db.ip}:9457/api/v1/upload/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      let res: $photoSheetPhoto = response.data;
      console.log('response', response.data);

      o = {
        ...o,
        ...response.data,
        ...{ src: `http://localhost:9457/temp/${response.data.filename}` }
      };

      if (isSingle) {
        currentPage.value.photos[index as number] = o
      } else {
        index = selectedCellIndex.value as number + 1 + i;
        currentPage.value.photos.splice(index, 0, o)
      }

    } catch (error) {
      let message = axios.isAxiosError(error)
        ? error.response?.data.message || "Upload failed"
        : "An error occurred while uploading the file.";
      console.error("Upload error:", error);
    }

  }

  if (fileInput.value) {
    fileInput.value.value = ''
  }


}

const CellRefs = ref<(HTMLElement | null)[]>([]);
const CellWidth = ref<number>(0)
const CellHeight = ref<number>(0)
let resizeObserver: ResizeObserver | null = null;

const setCellRef = (el: HTMLElement | null, index: number) => {
  if (el) CellRefs.value[index] = el;
};
const updateDimensions = () => {
  if (CellRefs.value.length > 0 && CellRefs.value[0]) {
    const firstElement = CellRefs.value[0];
    CellWidth.value = firstElement.clientWidth;
    CellHeight.value = firstElement.clientHeight;
  }
};


const doAction = (printPDF: boolean = false) => {

  if (!pdfContent.value) {
    console.error('Element not found', pdfContent.value);
    return;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>MP Photosheet - ${currentPage.value.id}</title>
        ${Array.from(document.querySelectorAll('style')).map(element => element.outerHTML).join('')}
        <style>
          @media print {
            body { margin, padding, border: 0; }
          }
          .grid-cell.cell-empty {
            visibility: hidden;
          }
          .cell-placeholder, .cell-controls {
            display: none !important;
          }
          .grid-container.text-center {
            width: 210mm;
            height: 297mm;
          }
        </style>
      </head>
      <body>
        ${pdfContent.value.innerHTML}
      </body>
    </html>
  `;

  console.log('printPDF', printPDF);

  isPdfDownloading.value = printPDF
  isPrinting.value = !printPDF

  let obj = {
    htmlContent,
    printPDF: printPDF,
    isPrint: !printPDF,
    filename: `mp-photosheet-${currentPage.value.id}.pdf`,
  }

  ipcRenderer.send('generate-pdf', obj);

};


onMounted(() => {
  updateDimensions();
  resizeObserver = new ResizeObserver(updateDimensions);
  if (CellRefs.value.length > 0 && CellRefs.value[0]) {
    resizeObserver.observe(CellRefs.value[0]);
  }
});

onUnmounted(() => {
  if (resizeObserver) resizeObserver.disconnect();
});

ipcRenderer.on('generate-pdf-reply', (event) => {
  isPdfDownloading.value = false;
  isPrinting.value = false;
});

</script>

<template lang="pug">
.parent-container.flex.w-full.overflow-hidden
  .scroll-container.left-container.flex-1.bg-blue-200
    .paper-container.flex.justify-center.items-center
      .paper-sheet.bg-white.shadow-lg.mx-auto(:style="paperStyle" ref="pdfContent" @wheel="handlePaperZoom")
        .grid-container.text-center( :style="gridStyle")
          .grid-cell(
            v-for="(cell, index) in gridCells"
            :key="index"
            @click="handleCellClick(index, $event, true)"
            :ref="(el) => setCellRef(el, index)"
            :class=`{
              "cell-empty": !currentPage.photos[index]
            }`
          )
            PhotoItem(
              v-if="currentPage.photos[index]"
              :photo="currentPage.photos[index]"
              @remove="removePhoto(currentPageIndex, index)"
              :update-photo="currentPage.photos[index]"
            )
            .cell-placeholder.p-3(
              v-else
              @click="handleCellClick(index, $event, false)"
            ) Click to add photo

    input(
      type="file"
      ref="fileInput"
      style="display: none"
      multiple
      @change="handleFileSelect"
    )
    pre.hidden {{ currentPage}}
  .scroll-container.right-container.w-52.border-l.flex.flex-col.space-y-4
    .info.px-6.pt-4
      p {{CellWidth}} #[span.font-bold x] {{CellHeight}}(px)
      p {{parseFloat(CellWidth*0.2645833333).toFixed(2)}} #[span.font-bold x] {{parseFloat(CellHeight*0.2645833333).toFixed(2)}}(mm)
    ScrollArea.flex-1.px-6.shadow-inner.shadow-sm.border-y
      Accordion(:default-value="defaultAccordion" type="multiple")
        AccordionItem(value="options")
          AccordionTrigger.text-lg Page Options
          AccordionContent.space-y-4.w-full

            Button.hidden(@click="addNewPage" variant="outline") New Page
            Button.hidden(@click="removeCurrentPage" variant="outline" :disabled="pages.length <= 1") Remove Page
            .hidden
              Select(v-model="currentPageIndex")
                SelectTrigger.w-32
                  SelectValue(placeholder="Page")
                SelectContent
                  SelectItem(v-for="(_, index) in pages" :value="index") Page {{ index + 1 }}

            Select.max-w-full(v-model="selectedPaperSize")
              SelectTrigger.w-48
                SelectValue(placeholder="Paper Size")
              SelectContent
                SelectGroup
                  SelectLabel Paper Sizes
                  SelectItem(v-for="size in paperSizes" :value="size.value") {{ size.name }}
            
            div
              Label Grid Layouts
              select.mt-1.p-1.w-full(v-model="selectedGrid")
                option Grid Layouts
                option(v-for="layout in gridLayouts" :value="layout.value") {{ layout.label }}
            

            NumberField#gap(v-model="cellGap" v-if="selectedGrid != '1x1'" :min="0" :max="20")
              Label(for="gap") Gap
              NumberFieldContent
                NumberFieldDecrement
                NumberFieldInput
                NumberFieldIncrement

            NumberField#cellWidth(v-model="cellWidth" v-if="selectedGrid.value === 'custom'" :min="10" :max="500")
              Label(for="cellWidth") Cell Width (mm):
              NumberFieldContent
                NumberFieldDecrement
                NumberFieldInput
                NumberFieldIncrement

            NumberField#cellHeight(v-model="cellHeight" v-if="selectedGrid.value === 'custom'" :min="10" :max="500")
              Label(for="cellHeight") Cell Height (mm):
              NumberFieldContent
                NumberFieldDecrement
                NumberFieldInput
                NumberFieldIncrement

        AccordionItem(value="grids")
          AccordionTrigger.text-lg Layouts
          AccordionContent.bg-gray-50.py-4
            .space-y-3.mx-4.bg-white.shadow-sm( :style="{ aspectRatio: '210/297' }")
              .grid-container.text-center.w-full.border.border-2.p-1(
                v-for="layout in gridLayouts"
                @click.prevent="selectedGrid = layout.value"
                :class=`{"border-slate-500" : selectedGrid == layout.value}`
                :style="gridStyleFunc(layout.value, '1mm')"
                class="hover:cursor-pointer"
              )
                Skeleton(class="w-full h-full rounded animate-none" v-for="(cell, index) in gridCellsFunc(layout.value)" key="index" :key="index")
                
    .action-container.flex.flex-col.px-6.pb-4.space-y-2(:class="{'cursor-not-allowed': isInAction}")
      Button.bg-slate-700(@click="doAction(false)" :disabled="isInAction" ) 
        Loader2.w-4.h-4.mr-2.animate-spin(v-if="isPrinting")
        | Print
      Button(@click="doAction(true)" variant="outline" :disabled="isInAction") 
        Loader2.w-4.h-4.mr-2.animate-spin(v-if="isPdfDownloading")
        | Download PDF
</template>

<style lang="stylus" scoped>
.parent-container
  height calc(100vh - 111px)

.scroll-container
  height 100%
  overflow-y auto
  &::-webkit-scrollbar
    width 4px
  &::-webkit-scrollbar-track
    background #f1f1f1
  &::-webkit-scrollbar-thumb
    background #888
    border-radius 2px
    &:hover
      background #555

.paper-container
  background-color #f3f4f6
  min-height calc(100vh - 111px)
  
.controls
  margin-bottom 2rem

.paper-sheet
  background white
  box-shadow 0 2px 8px rgba(0, 0, 0, 0.1)
  margin 0 auto

.grid-container
  display grid
  height 100%
  gap 2mm
  padding 5mm

.grid-cell 
  position relative
  overflow hidden
  border 1px solid #000
  &.cell-empty
    border 1px dashed #ccc

.cell-placeholder
  display flex
  align-items center
  justify-content center
  height 100%
  color #666
  cursor pointer
</style>