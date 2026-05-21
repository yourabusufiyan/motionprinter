<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { Button } from '@/components/ui/button';

// Define props
const props = defineProps<{
  photo: {
    zoom: number;
    rotation: number;
    position: { x: number; y: number };
  },
  fitToFrame: boolean
}>();

// Define emits
const emit = defineEmits(['update-photo']);

// Reactive variables
const zoom = ref(props.photo.zoom);
const rotation = ref(props.photo.rotation);
const position = ref({ ...props.photo.position });
const isDragging = ref(false);
const startPos = ref({ x: 0, y: 0 });

// Computed style for image transformation
const imageStyle = computed(() => ({
  transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${zoom.value}) rotate(${rotation.value}deg)`,
  'object-fit': props.fitToFrame ? 'cover' : 'contain'
}));

// Watch for prop changes (if needed)
watch(
  () => props.photo,
  (newPhoto) => {
    zoom.value = newPhoto.zoom;
    rotation.value = newPhoto.rotation;
    position.value = { ...newPhoto.position };
  },
  { deep: true },
);

// Dragging functions
const startDrag = (e: MouseEvent | TouchEvent) => {
  return;
  isDragging.value = true;
  startPos.value = {
    //@ts-ignore
    x: 'clientX' in e ? e.clientX : e.touches[0].clientX,
    //@ts-ignore
    y: 'clientY' in e ? e.clientY : e.touches[0].clientY,
  };
  document.addEventListener('mousemove', handleDrag);
  document.addEventListener('touchmove', handleDrag);
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchend', stopDrag);
  e.preventDefault();
};

const handleDrag = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;
  const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
  const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;

  position.value.x += clientX - startPos.value.x;
  position.value.y += clientY - startPos.value.y;
  startPos.value = { x: clientX, y: clientY };

  emit('update-photo', {
    zoom: zoom.value,
    rotation: rotation.value,
    position: position.value,
  });
};

const stopDrag = (e: MouseEvent | TouchEvent) => {
  e.preventDefault();
  isDragging.value = false;
  document.removeEventListener('mousemove', handleDrag);
  document.removeEventListener('touchmove', handleDrag);
};

import { X } from 'lucide-vue-next';

</script>

<template lang="pug">
.photo-item(
  @mousedown="startDrag"
  @touchstart="startDrag"
)
  img(
    :src="photo.src"
    :style="imageStyle"
    alt="Collage photo"
    ref="image"
  )
  X.remove-icon(
    @click="$emit('remove')"
  )

</template>

<style lang="stylus" scoped>
.photo-item
  position absolute
  width 100%
  height 100%
  touch-action none

img
  position absolute
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;

.remove-icon
  position absolute
  top 0
  right 0
  width 20%
  height 20%
  color white
  background-color rgba(220, 38, 38, 0.5)
  padding 4px
  cursor pointer
  transition all 0.2s ease
  opacity 0
  
  &:hover
    background-color rgb(220, 38, 38)

.photo-item:hover .remove-icon
  opacity 1

  @media (prefers-color-scheme: dark)
    background-color rgba(220, 38, 38, 0.8)
    
    &:hover
      background-color rgb(220, 38, 38)
</style>