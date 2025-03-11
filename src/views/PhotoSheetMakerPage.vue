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


import { useLordStore } from '@/stores/LordStore';
import axios from 'axios';
import { merge } from 'lodash';

import type { photoSheet, photoSheetPhoto } from '../../electron/main/express-app-d';

const lordStore = useLordStore();

// State management
const currentPage = ref<photoSheet>({
  id: '',
  photos: [],
})
const pages = ref<photoSheet[]>([{ id: '', photos: [] }])
const currentPageIndex = ref(0)
const selectedGrid = ref('6x6')
const selectedPaperSize = ref('a4')
const cellWidth = ref(50)
const cellHeight = ref(50)
const cellGap = ref(2)
const paperZoom = ref(1)
const isRotating = ref(false)
const rotationStartAngle = ref(0)
const initialRotation = ref(0)
const selectedCellIndex = ref<number | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// Constants
const gridLayouts = [
  { label: 'Custom', value: 'custom' },
  { label: '1 Photo', value: '1x1' },
  { label: '2 Photos', value: '1x2' },
  { label: '4 Photos', value: '2x2' },
  { label: '9 Photos', value: '3x3' },
  { label: '16 Photos', value: '4x4' },
  { label: '24 Photos', value: '4x6' },
  { label: '25 Photos', value: '5x5' },
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
  const [cols, rows] = selectedGrid.value.split('x').map(Number)
  return cols * rows
})

const gridStyle = computed(() => {
  const [cols, rows] = selectedGrid.value.split('x');
  const isCustom = selectedGrid.value === 'custom';

  return {
    gridTemplateColumns: `repeat(${cols}, ${isCustom ? `${cellWidth.value}mm` : '1fr'})`,
    gridTemplateRows: `repeat(${rows}, ${isCustom ? `${cellHeight.value}mm` : '1fr'})`,
    ...(isCustom ? {} : { gap: `${cellGap.value}mm` })
  };
});


const paperStyle = computed(() => ({
  transform: `scale(${paperZoom.value})`,
  transformOrigin: 'center center',
  width: `${paperSize.value.width}mm`,
  height: `${paperSize.value.height}mm`,
}))

// Methods
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
    console.log('selected cell ', currentPage.value.photos[index])
    currentPage.value.photos.splice(index + 1, 0, { ...currentPage.value.photos[index] })
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
  pages.value[pageIndex].photos.splice(photoIndex, 1)
}

const handleFileSelect = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files
  if (!files || files.length === 0) return

  const isSingle = files.length === 1
  for (let i = 0; i < files.length; i++) {

    const file = files[i]
    const reader = new FileReader()
    let o: photoSheetPhoto = {
      src: '',
      zoom: 1,
      rotation: 0,
      position: { x: 0, y: 0 },
      width: 0,
      height: 0,
    } as photoSheetPhoto;
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

      let res: photoSheetPhoto = response.data;
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

</script>

<template lang="pug">
.parent-container.flex.w-full.overflow-hidden
  .scroll-container.left-container.flex-1.bg-blue-200
    .paper-container(@wheel="handlePaperZoom")
      .paper-sheet.bg-white.shadow-lg.mx-auto(:style="paperStyle")
        .grid-container.text-center(:style="gridStyle")
          .grid-cell(
            v-for="(cell, index) in gridCells"
            :key="index"
            @click="handleCellClick(index, $event, true)"
            :ref="(el) => setCellRef(el, index)"
          )
            PhotoItem(
              v-if="currentPage.photos[index]"
              :photo="currentPage.photos[index]"
              @remove="removePhoto(currentPageIndex, index)"
              :update-photo="currentPage.photos[index]"
            )
            .placeholder.p-3(
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
    pre {{ currentPage}}
  .scroll-container.right-container.w-52.border-l
    .controls.flex.gap-4.my-8.px-6.flex-wrap
      .info 
        p {{CellWidth}}#[span.font-bold x]{{CellHeight}} (PX)
        p {{parseFloat(CellWidth*0.2645833333).toFixed(2)}}#[span.font-bold x]{{parseFloat(CellHeight*0.2645833333).toFixed(2)}} (MM)
      
      Button.hidden(@click="addNewPage" variant="outline") New Page
      Button.hidden(@click="removeCurrentPage" variant="outline" :disabled="pages.length <= 1") Remove Page
      .hidden
        Select(v-model="currentPageIndex")
          SelectTrigger.w-32
            SelectValue(placeholder="Page")
          SelectContent
            SelectItem(v-for="(_, index) in pages" :value="index") Page {{ index + 1 }}

      Select(v-model="selectedPaperSize")
        SelectTrigger.w-48
          SelectValue(placeholder="Paper Size")
        SelectContent
          SelectGroup
            SelectLabel Paper Sizes
            SelectItem(v-for="size in paperSizes" :value="size.value") {{ size.name }}

      Select(v-model="selectedGrid")
        SelectTrigger.w-48
          SelectValue(placeholder="Grid Layout")
        SelectContent
          SelectGroup
            SelectLabel Grid Layouts
            SelectItem(v-for="layout in gridLayouts" :value="layout.value") {{ layout.label }}

      NumberField#gap(v-model="cellGap" :min="0" :max="20")
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
  border 1px dashed #ccc
  position relative
  overflow hidden

.placeholder
  display flex
  align-items center
  justify-content center
  height 100%
  color #666
  cursor pointer
</style>