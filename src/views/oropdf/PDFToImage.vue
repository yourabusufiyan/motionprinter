<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { ArrowRightIcon, Plus, Check, Lock } from 'lucide-vue-next'

import { ref, onMounted, computed } from 'vue'
import axios from 'axios'
import { useLordStore } from '@/stores/LordStore'
import type { oroPdfSettings, uploadFile } from '../../../electron/main/express-app-d'
import { isObject, merge } from 'lodash'
import { useRouter } from 'vue-router'


const router = useRouter()
const route = useRoute()

const pageId = ref<string>('')
const creatingPageId = ref(false)
const lordStore = useLordStore()
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadedFile = ref<any>(null)
const error = ref('')
const selectedOption = ref('page')
const selectedQuality = ref('normal')
const fileInput = ref<HTMLInputElement>()
const generatingThumbnails = ref<Set<string>>(new Set())
const showPasswordDialog = ref(false)
const protectedFiles = ref<Map<string, string>>(new Map())
const currentPasswordFile = ref<any>(null)
const passwordInput = ref('')
const verifyingPassword = ref(false)


const qualityOptions = {
  good: { label: 'Good', dpi: 150 },
  normal: { label: 'Normal', dpi: 300 },
  high: { label: 'High', dpi: 600 }
}

const pageData = ref<oroPdfSettings>({
  id: '',
  addedTime: 0,
  dpi: 150,
  files: []
} as oroPdfSettings)
const toDisplay = computed(() => {
  return lordStore.db.oropdf.find((o: any) => o.id === pageId.value)
})

function saveToMain() {
  console.log('Saving to main process with data:', pageData.value);
  let data = lordStore.db.oropdf.map((el: oroPdfSettings, i: number) => {
    if (el.id === pageData.value.id) {
      if (pageData.value?.files) {
        pageData.value.files = pageData.value?.files?.filter((file: any) => isObject(file));
      }
      el = merge(el, pageData.value);
    }
    return el;
  });
  lordStore.lowdb.data.oropdf = data;
  lordStore.saveLowDB();
}


/**
 * Create page ID on mount
 */
const createPageId = async () => {
  creatingPageId.value = true
  try {
    const response = await axios.post(`http://${lordStore.db.ip}:9457/api/v1/oropdf/create-oro`, {
      options: {
        format: route.query.format || 'jpg',
      }
    })
    if (response.data && response.data.id) {
      pageData.value = response.data
      pageId.value = response.data.id
      console.log('Page ID created successfully:', pageId.value, 'at', response.data.addedTime)
    } else {
      console.error('Failed to create page ID:', response.data)
    }
  } catch (err: any) {
    console.error('Error creating page ID:', err)
  } finally {
    creatingPageId.value = false
  }
}

/**
 * Trigger file input dialog
 */
const triggerFileInput = () => {
  fileInput.value?.click()
}

/**
 * Handle file input change - supports multiple files
 */
const handleFileInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    // Upload all selected files
    for (let i = 0; i < target.files.length; i++) {
      uploadFile(target.files[i])
    }
    // Reset the input so the same file can be selected again
    target.value = ''
  }
}

/**
 * Handle file drop - supports multiple files
 */
const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files) {
    // Upload all dropped files
    for (let i = 0; i < files.length; i++) {
      uploadFile(files[i])
    }
  }
}


/**
 * Handle drag over
 */
const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  isDragging.value = true
}

/**
 * Handle drag leave
 */
const handleDragLeave = () => {
  isDragging.value = false
}

/**
 * Upload PDF file to server
 */
const uploadFile = async (file: File) => {
  // Validate file type
  if (file.type !== 'application/pdf') {
    error.value = 'Only PDF files are allowed'
    return
  }

  // Validate file size (50MB max)
  if (file.size > 50 * 1024 * 1024) {
    error.value = 'File size exceeds 50MB limit'
    return
  }

  uploading.value = true
  uploadProgress.value = 0
  error.value = ''

  const formData = new FormData()
  formData.append('sampleFile', file)
  formData.append('oropdfId', pageId.value)

  try {
    const response = await axios.post(`http://${lordStore.db.ip}:9457/api/v1/oropdf/upload-pdf`, formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      }
    })

    if (response.data.success && response.data.step === 'uploaded') {
      console.log('Step 1 Complete: File uploaded successfully', response.data)
      uploadedFile.value = response.data.fileInfo
      // Store the original file object for frontend thumbnail generation
      response.data.fileInfo.originalFile = file

      console.log('File Info Details:', {
        id: response.data.fileInfo.id,
        originalName: response.data.fileInfo.originalName,
        isPasswordProtected: response.data.fileInfo.isPasswordProtected,
        pageCount: response.data.fileInfo.pageCount
      })

      // Append the uploaded file to pageData.files
      if (pageData.value.files) {
        pageData.value.files.push(response.data.fileInfo as uploadFile)
        console.log('Added to pageData.files:', pageData.value.files)
        // Start generating thumbnail in background (frontend first, fallback to backend)
        generateThumbnail(response.data.fileInfo)
      }
      console.log('Upload Response:', response.data)
    } else {
      error.value = 'Upload failed: Invalid response from server'
    }

  } catch (err: any) {
    console.error('Upload error:', err)
    error.value = err.response?.data?.error || 'Failed to upload file'
  } finally {
    uploading.value = false
    saveToMain();
  }
}

/**
 * Generate thumbnail for uploaded file (Frontend First, Fallback to Backend)
 */
const generateThumbnail = async (file: uploadFile) => {

  generatingThumbnails.value.add(file.id as string)
  try {

    // Step 1: Try frontend generation using PDF.js
    const uploadedFile = pageData.value.files?.find(f => f.id === file.id)
    if (file) {
      const thumbnail = await generateThumbnailFrontend(file)
      if (thumbnail) {
        console.log('Frontend thumbnail generated successfully for file:', file.id)
        file.thumbnail = thumbnail
        generatingThumbnails.value.delete(file.id?.toString() || '')
        return
      }
    }

    // Step 2: Fallback to backend if frontend generation fails
    console.log('Frontend generation failed, falling back to backend for file:', file.id)
    const response = await axios.post(`http://${lordStore.db.ip}:9457/api/v1/oropdf/generate-thumbnail`, file)

    if (response.data.success && response.data.step === 'thumbnail_generated') {
      console.log('Backend thumbnail generated successfully for file:', file.id)
      pageData.value.files = pageData.value.files?.map(f => {
        if (f.id === file.id) {
          return { ...f, thumbnail: response.data.thumbnail }
        }
        return f
      })
    }
    saveToMain();
  } catch (err: any) {
    console.error('Error generating thumbnail for file:', file.id, err)
  } finally {
    generatingThumbnails.value.delete(file.id?.toString() || '')
  }
}

/**
 * Generate thumbnail from PDF file in frontend using PDF.js
 */
const generateThumbnailFrontend = async (file: any): Promise<any | null> => {
  try {
    // Read the file as ArrayBuffer
    const arrayBuffer = await readFileAsArrayBuffer(file)

    // Load PDF document
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise

    // Get first page
    const page = await pdf.getPage(1)

    // Set up canvas
    const scale = 1.1
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')

    canvas.width = viewport.width
    canvas.height = viewport.height

    if (!context) {
      throw new Error('Could not get canvas context')
    }

    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise

    // Convert canvas to base64
    const base64 = canvas.toDataURL('image/jpeg', 0.8)

    return {
      url: base64,
      base64: base64,
      filename: file.filename,
      size: file.size
    }
  } catch (err: any) {
    console.error('Frontend thumbnail generation failed:', err)
    return null
  }
}

/**
 * Read file as ArrayBuffer
 */
const readFileAsArrayBuffer = (file: any): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    // If file is already a File object stored from upload
    if (file.originalFile instanceof File) {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = reject
      reader.readAsArrayBuffer(file.originalFile)
      return
    }

    // If file needs to be fetched from server
    axios.get(`http://${lordStore.db.ip}:9457/api/v1/oropdf/${file.id}.pdf`, {
      responseType: 'arraybuffer'
    })
      .then(response => resolve(response.data))
      .catch(reject)
  })
}

/**
 * Handle convert button click - prompt for passwords if needed
 */
const handleConvert = async () => {

  error.value = '';

  // Find all protected files that need passwords
  const protectedFilesNeedingPassword = pageData.value.files?.filter(
    f => f.isPasswordProtected && !protectedFiles.value.has(f.id as string)
  ) || []

  if (protectedFilesNeedingPassword.length > 0) {
    // Show password dialog for first protected file
    currentPasswordFile.value = protectedFilesNeedingPassword[0]
    passwordInput.value = ''
    showPasswordDialog.value = true
  } else {
    saveToMain();
    // All passwords collected or no protected files - proceed with conversion
    console.log('All files ready for conversion:', {
      option: selectedOption.value,
      quality: selectedQuality.value,
      passwords: Object.fromEntries(protectedFiles.value)
    })
    // TODO: Send conversion request to backend
    console.log('Final pageData being sent for conversion:', pageData.value)
    router.push({
      name: 'OroLoading',
      query: { id: pageData.value.id }
    })
  }
}

/**
 * Submit password for protected PDF
 */
const submitPassword = async () => {
  if (!passwordInput.value) {
    error.value = 'Please enter the password'
    return
  }

  verifyingPassword.value = true
  error.value = ''

  try {
    // Verify password by attempting thumbnail generation (optional verification)
    const response = await axios.post(`http://${lordStore.db.ip}:9457/api/v1/oropdf/verify-password`, {
      path: currentPasswordFile.value.destination,
      password: passwordInput.value
    })

    if (!response.data.isValid) {
      error.value = 'incorrect password'
      return
    }

    // For now, just store the password
    protectedFiles.value.set(currentPasswordFile.value.id, passwordInput.value)
    console.log(`Password stored for file: ${currentPasswordFile.value.id}`)
    pageData.value.files = pageData.value.files?.map(f => {
      if (f.id === currentPasswordFile.value.id) {
        return { ...f, ...{ password: passwordInput.value as string } }
      }
      return f
    }) || []

    // Check if there are more protected files needing passwords
    const protectedFilesNeedingPassword = pageData.value.files?.filter(
      f => f.isPasswordProtected && !protectedFiles.value.has(f.id)
    ) || []

    if (protectedFilesNeedingPassword.length > 0) {
      // Move to next protected file
      currentPasswordFile.value = protectedFilesNeedingPassword[0]
      passwordInput.value = ''
    } else {
      // All passwords collected
      showPasswordDialog.value = false
      passwordInput.value = ''
      // Now proceed with conversion
      console.log('All passwords collected, proceeding with conversion:', {
        option: selectedOption.value,
        quality: selectedQuality.value,
        passwords: Object.fromEntries(protectedFiles.value)
      })
    }
  } finally {
    verifyingPassword.value = false
    await saveToMain();
    handleConvert();
  }
}

// Create page ID on component mount
onMounted(() => {
  createPageId();

})

</script>

<template lang="pug">
.w-full.h-screen
  .flex.items-center.justify-center.items-stretch.h-full
    .upload-area.bg-red-100.flex-1(
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      :class="{ 'bg-blue-100 border-2 border-blue-400': isDragging }"
      class="border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer flex flex-col overflow-auto"
    )
      div(v-if="!uploading && pageData.files?.length === 0")
        p.text-lg.font-medium.text-gray-700.mb-4 Drop PDF file here
        p.text-sm.text-gray-600.mb-6 or
        .add-file.flex.flex-col.items-center.justify-center.gap-3.p-8.border-2.border-dashed.border-gray-300.rounded-lg.cursor-pointer.transition(
          @click="triggerFileInput"
          class="hover:border-blue-400 hover:bg-blue-50"
        )
          Plus(class="w-8 h-8 text-gray-600")
          p.text-sm.font-medium.text-gray-700 Click to browse
      
      input(
        ref="fileInput"
        type="file"
        accept=".pdf"
        multiple
        class="hidden"
        @change="handleFileInput"
      )
      
      div(v-if="uploading")
        p.text-lg.font-medium.text-blue-600 Uploading...
        p.text-sm.text-blue-600.mt-2 {{ uploadProgress }}%
        .bg-blue-200.rounded-full.h-2.w-48.mt-4
          .bg-blue-600.rounded-full.h-2.transition-all(:style="{ width: `${uploadProgress}%` }")
      
      div(v-if="pageData.files && pageData.files.length > 0" class="w-full")
        .grid.grid-cols-2.gap-4(class="sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5")
          .flex.flex-col.items-center.gap-1.border.border-2.border-round(v-for="file in pageData.files" :key="file.id")
            div.relative.h-full(class="min-h-[160px] w-full")
              img.object-cover.bg-gray-200.rounded-lg.w-20.h-24(
                :src="file.thumbnail?.base64 || file.thumbnail?.url || 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect fill=%27%23ddd%27 width=%27100%27 height=%27100%27/%3E%3Ctext x=%2750%27 y=%2750%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 font-size=%2714%27 fill=%27%23999%27%3EPDF%3C/text%3E%3C/svg%3E'"
                :alt="file.originalName"
              )
              div.absolute.top-1.right-1(v-if="file.isPasswordProtected")
                .bg-red-500.rounded-full.p-1
                  Lock(class="w-4 h-4 text-white")
              div.absolute.inset-0.flex.items-center.justify-center.bg-black.bg-opacity-20.rounded-lg(v-if="generatingThumbnails.has(file.id)")
                .animate-spin.w-6.h-6.border-2.border-white.border-t-transparent.rounded-full
            p.text-xs.text-gray-700.text-center.truncate.w-20.pb-1 {{ file.originalName }}
          
          div.flex.flex-col.items-center.gap-2.cursor-pointer.transition(
            @click="triggerFileInput"
            class="hover:opacity-75"
          )
            .flex.flex-1.items-center.w-full.justify-center.bg-gray-100.border-2.border-dashed.border-gray-300.transition(
              class="hover:bg-gray-200 hover:border-blue-400"
            )
              Plus(class="w-8 h-8 text-gray-400")
            p.text-xs.text-gray-700.text-center.truncate.w-20 ADD FILE

      div(v-if="error")
        p.text-lg.font-medium.text-red-600 Error
        p.text-sm.text-red-600.mt-2 {{ error }}
      
    .options(class="basis-1/3 md:basis-1/3 lg:basis-1/4 ")
        
        // Content
        .flex.flex-col.h-full.justify-between
          h3.text-2xl.font-bold.leading-none.tracking-tight.py-6.text-center PDF to JPG options
          .extract-options.flex-1
            .flex.items-start.space-x-3.rounded-lg.border.p-4.cursor-pointer(
              :class="{ 'border-primary bg-primary/5': selectedOption === 'page' }"
              @click="selectedOption = 'page'"
            )
              .flex-1
                .flex.items-center.gap-2
                  label.font-medium.cursor-pointer(@click="selectedOption = 'page'") PAGE TO JPG
                  Check(v-if="selectedOption === 'page'" class="w-5 h-5 text-green-600")
                p.text-sm.text-muted-foreground.mt-1
                  | Every page of this PDF will be converted into a JPG file.

            .flex.items-start.space-x-3.rounded-lg.border.p-4.cursor-pointer(
                :class="{ 'border-primary bg-primary/5': selectedOption === 'extract' }"
                @click="selectedOption = 'extract'"
              )
                .flex-1
                  .flex.items-center.gap-2
                    label.font-medium.cursor-pointer(@click="selectedOption = 'extract'") EXTRACT IMAGES
                    Check(v-if="selectedOption === 'extract'" class="w-5 h-5 text-green-600")
                  p.text-sm.text-muted-foreground.mt-1
                    | All embedded images inside the PDF will be extracted as JPG images.

            .image-quality.mt-2.px-2
              h3.font-medium.mb-3 Image quality
              .flex.flex-row.gap-2
                Button.flex.items-center.justify-between.h-auto(
                  :variant="pageData.dpi === 150 ? 'default' : 'outline'"
                  @click="pageData.dpi = 150"
                  class="text-left basis-1/3"
                )
                  .flex.flex-col
                    span.text-sm.font-medium Good
                    span.text-xs.text-muted-foreground 150 DPI
                  Check.hidden(v-if="pageData.dpi === 150" class="w-4 h-4")
                
                Button.flex.items-center.justify-between.h-auto(
                  :variant="pageData.dpi === 300 ? 'default' : 'outline'"
                  @click="pageData.dpi = 300"
                  class="text-left"
                )
                  .flex.flex-col
                    span.text-sm.font-medium Normal
                    span.text-xs.text-muted-foreground 300 DPI
                  Check.hidden(v-if="pageData.dpi === 300" class="w-4 h-4")
                
                Button.flex.items-center.justify-between.h-auto(
                  :variant="pageData.dpi === 600 ? 'default' : 'outline'"
                  @click="pageData.dpi = 600"
                  class="text-left"
                )
                  .flex.flex-col
                    span.text-sm.font-medium High
                    span.text-xs.text-muted-foreground 600 DPI
                  Check.hidden(v-if="pageData.dpi === 600" class="w-4 h-4")

          // Convert Button
          .submit-section.mx-2.mb-2
            Button.w-full.p-5(
              size="xlg"
              @click="handleConvert"
              :disabled="!pageData.files || pageData.files.length === 0"
            )
              | Convert to JPG 
              ArrowRightIcon

  // Password Dialog
  .password-dialog(v-if="showPasswordDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50")
    .bg-white.rounded-lg.p-6.max-w-md.w-full
      h3.text-lg.font-semibold.mb-2 PDF is Password Protected
      p.text-sm.text-gray-600.mb-1 File: #[b {{ currentPasswordFile?.originalName }}] 
      p.text-sm.text-red-600.mb-4(v-if="error") {{ error }}  
      p.text-sm.text-gray-600.mb-4(v-else) Please enter the password to continue
      
      input.w-full.px-3.py-2.border.border-gray-300.rounded-lg.mb-4(
        type="password"
        v-model="passwordInput"
        placeholder="Enter PDF password"
        @keyup.enter="submitPassword"
      )
      
      .flex.justify-end.gap-2
        Button(variant="outline" @click="showPasswordDialog = false" :disabled="verifyingPassword") Cancel
        Button(@click="submitPassword" :disabled="verifyingPassword")
          span(v-if="verifyingPassword") Verifying...
          span(v-else) Submit

</template>
