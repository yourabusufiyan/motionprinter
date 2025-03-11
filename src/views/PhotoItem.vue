<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button } from '@/components/ui/button'

// Define props
const props = defineProps<{
  photo: {
    zoom: number;
    rotation: number;
    position: { x: number; y: number };
  };
}>()

// Define emits
const emit = defineEmits(['update-photo'])

// Reactive variables
const zoom = ref(props.photo.zoom)
const rotation = ref(props.photo.rotation)
const position = ref({ ...props.photo.position })
const isDragging = ref(false)
const startPos = ref({ x: 0, y: 0 })

// Computed style for image transformation
const imageStyle = computed(() => ({
  transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${zoom.value}) rotate(${rotation.value}deg)`,
}))

// Watch for prop changes (if needed)
watch(() => props.photo, (newPhoto) => {
  zoom.value = newPhoto.zoom
  rotation.value = newPhoto.rotation
  position.value = { ...newPhoto.position }
}, { deep: true })

// Dragging functions
const startDrag = (e: MouseEvent | TouchEvent) => {
  return;
  isDragging.value = true
  startPos.value = {
    x: 'clientX' in e ? e.clientX : e.touches[0].clientX,
    y: 'clientY' in e ? e.clientY : e.touches[0].clientY,
  }
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('touchmove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  document.addEventListener('touchend', stopDrag)
  e.preventDefault()
}

const handleDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return
  const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX
  const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY

  position.value.x += clientX - startPos.value.x
  position.value.y += clientY - startPos.value.y
  startPos.value = { x: clientX, y: clientY }

  emit('update-photo', { zoom: zoom.value, rotation: rotation.value, position: position.value })
}

const stopDrag = (e: MouseEvent | TouchEvent) => {
  e.preventDefault()
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('touchmove', handleDrag)
}

</script>


<template lang="pug">
div.photo-item(
  @mousedown="startDrag"
  @touchstart="startDrag"
)
  img(
    :src="photo.src"
    :style="imageStyle"
    alt="Collage photo"
    ref="image"
  )

  .cell-controls
    Button(@click="$emit('remove')" variant="destructive" size="sm") Remove
</template>

<style lang="stylus" scoped>
  .photo-item
    position absolute
    width 100%
    height 100%
    touch-action none
  
  img
    position absolute
    // cursor move
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  
  .cell-controls
    position absolute
    bottom 10px
    left 50%
    transform translateX(-50%)
    background rgba(255, 255, 255, 0.8)
    padding 5px
    border-radius 5px
  </style>