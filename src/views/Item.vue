<template lang="pug">
  div.collage-editor
    //- Controls
    div.controls.flex.gap-4.mb-8
      Select(v-model="selectedPaperSize")
        SelectTrigger.w-48
          SelectValue(placeholder="Select Paper Size")
        SelectContent
          SelectGroup
            SelectLabel Paper Sizes
            SelectItem(
              v-for="size in paperSizes"
              :key="size.value"
              :value="size.value"
            ) {{ size.name }}
  
      Select(v-model="selectedGrid")
        SelectTrigger.w-48
          SelectValue(placeholder="Select Grid Layout")
        SelectContent
          SelectGroup
            SelectLabel Grid Layouts
            SelectItem(
              v-for="layout in gridLayouts"
              :key="layout.value"
              :value="layout.value"
            ) {{ layout.label }}
  
    //- Paper Sheet
    div.paper-sheet.bg-white.shadow-lg.mx-auto(
      :style="paperStyle"
    )
      div.grid-container(:style="gridStyle")
        div.grid-cell(
          v-for="(cell, index) in gridCells"
          :key="index"
          @click="selectCell(index)"
        )
          PhotoItem(
            v-if="photos[index]"
            :photo="photos[index]"
            @update-photo="updatePhoto"
          )
          div.placeholder(v-else) Click to add photo
  
    //- Hidden File Input
    input(
      type="file"
      ref="fileInput"
      style="display: none"
      @change="handleFileSelect"
    )
  </template>

<script lang="ts">
import { ref, computed } from 'vue'
import PhotoItem from './PhotoItem.vue'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Photo {
  id: number
  src: string
  zoom: number
  rotation: number
  position: { x: number; y: number }
}

export default {
  components: { PhotoItem, Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue },
  setup() {
    const selectedGrid = ref('2x2')
    const selectedPaperSize = ref('a4')
    const photos = ref<Photo[]>([])
    const selectedCellIndex = ref<number | null>(null)
    const fileInput = ref<HTMLInputElement | null>(null)

    const gridLayouts = [
      { label: '1 Photo', value: '1x1' },
      { label: '2 Photos', value: '2x1' },
      { label: '4 Photos', value: '2x2' },
      { label: '9 Photos', value: '3x3' },
    ]

    const paperSizes = [
      { name: 'A4', value: 'a4', width: 210, height: 297 },
      { name: 'Letter', value: 'letter', width: 216, height: 279 },
      { name: 'Passport', value: 'passport', width: 35, height: 45 },
    ]

    const gridStyle = computed(() => {
      const [cols, rows] = selectedGrid.value.split('x')
      return {
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }
    })

    const paperStyle = computed(() => {
      const size = paperSizes.find((s) => s.value === selectedPaperSize.value)
      return {
        width: `${size?.width}mm`,
        height: `${size?.height}mm`,
      }
    })

    const gridCells = computed(() => {
      const [cols, rows] = selectedGrid.value.split('x')
      return cols * rows
    })

    const selectCell = (index: number) => {
      selectedCellIndex.value = index
      fileInput.value?.click()
    }

    const handleFileSelect = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        photos.value[selectedCellIndex.value!] = {
          id: Date.now(),
          src: event.target?.result as string,
          zoom: 1,
          rotation: 0,
          position: { x: 0, y: 0 },
        }
      }
      reader.readAsDataURL(file)
    }

    const updatePhoto = (updatedPhoto: Photo) => {
      photos.value[selectedCellIndex.value!] = updatedPhoto
    }

    return {
      selectedGrid,
      selectedPaperSize,
      photos,
      selectedCellIndex,
      fileInput,
      gridLayouts,
      paperSizes,
      gridStyle,
      paperStyle,
      gridCells,
      selectCell,
      handleFileSelect,
      updatePhoto,
    }
  },
}
</script>

<style lang="stylus">
  .collage-editor
    padding 2rem
    background-color #f3f4f6
    min-height 100vh
  
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