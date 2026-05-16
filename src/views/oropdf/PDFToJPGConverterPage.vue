<template lang="pug">
.w-full.max-w-4xl.mx-auto.p-6
  h1.text-2xl.font-bold.mb-6 PDF Uploader with Sequential Processing
  
  // Step 1: Drop Zone for Upload
  .upload-zone.border-2.border-dashed.rounded-lg.p-8.text-center.cursor-pointer(
    :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @click="triggerFileInput"
    v-if="!uploadedFile"
  )
    input(
      ref="fileInput"
      type="file"
      accept=".pdf"
      class="hidden"
      @change="handleFileSelect"
    )
    
    .space-y-3
      .flex.justify-center
        svg.w-12.h-12.text-gray-400(fill="none" stroke="currentColor" viewBox="0 0 24 24")
          path(stroke-linecap="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12")
      
      div
        p.text-lg.font-medium Drop PDF file here or click to upload
        p.text-sm.text-gray-500 Maximum file size: 50MB
      
      .upload-progress(v-if="uploading")
        .bg-blue-100.rounded-full.h-2.w-full.mt-4
          .bg-blue-600.rounded-full.h-2.transition-all(:style="{ width: `${uploadProgress}%` }")
        p.text-sm.text-blue-600.mt-2 Uploading... {{ uploadProgress }}%
  
  // Password Dialog (if needed)
  .password-dialog(v-if="showPasswordDialog" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50")
    .bg-white.rounded-lg.p-6.max-w-md.w-full
      h3.text-lg.font-semibold.mb-2 PDF is Password Protected
      p.text-sm.text-gray-600.mb-4 Please enter the password to continue
      
      input.w-full.px-3.py-2.border.rounded-lg.mb-4(
        type="password"
        v-model="pdfPassword"
        placeholder="Enter PDF password"
        @keyup.enter="submitPassword"
      )
      
      .flex.justify-end.gap-2
        Button(variant="outline" @click="showPasswordDialog = false") Cancel
        Button(@click="submitPassword" :disabled="verifyingPassword")
          span(v-if="verifyingPassword") Verifying...
          span(v-else) Submit
  
  // Step 2: Thumbnail Generation Status
  .thumbnail-section.mt-6(v-if="uploadedFile && !thumbnail")
    .bg-yellow-50.border.border-yellow-200.rounded-lg.p-4
      .flex.items-center.gap-3
        .animate-spin
          svg.w-5.h-5.text-yellow-600(fill="none" stroke="currentColor" viewBox="0 0 24 24")
            circle(cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none")
            path(d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="2" fill="none")
        div
          p.font-medium.text-yellow-800 Generating Thumbnail...
          p.text-sm.text-yellow-600 Processing page 1 of {{ uploadedFile.pageCount || '?' }}
  
  // Step 3: Display Uploaded File with Thumbnail
  .uploaded-file.mt-6(v-if="thumbnail && uploadedFile")
    .bg-white.rounded-lg.shadow-lg.overflow-hidden
      .flex.flex-col(class="md:flex-row")
        // Thumbnail Preview
        .thumbnail-container.bg-gray-100.p-4.flex.items-center.justify-center(class="md:w-64")
          img(
            :src="thumbnail.base64 || thumbnail.url"
            :alt="uploadedFile.originalName"
            class="max-w-full h-auto rounded shadow cursor-pointer"
            @click="showFullPreview = true"
          )
        
        // File Info
        .file-info.flex-1.p-4
          h3.text-lg.font-semibold.mb-2 {{ uploadedFile.originalName }}
          
          .space-y-2.text-sm
            .flex.justify-between
              span.text-gray-600 File size:
              span.font-medium {{ formatFileSize(uploadedFile.size) }}
            
            .flex.justify-between
              span.text-gray-600 Pages:
              span.font-medium {{ uploadedFile.pageCount || 'Unknown' }}
            
            .flex.justify-between(v-if="uploadedFile.isPasswordProtected")
              span.text-gray-600 Protection:
              span.text-yellow-600.font-medium Password Protected
          
          .action-buttons.mt-4.flex.gap-2
            Button(variant="outline" size="sm" @click="regenerateThumbnail")
              RefreshCw
              span.ml-1 Regenerate Thumbnail
            Button(size="sm" @click="convertPDF")
              ArrowRight
              span.ml-1 Convert to JPG
  
  // Full Preview Modal
  .preview-modal(v-if="showFullPreview" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" @click="showFullPreview = false")
    .max-w-4xl.max-h-full.p-4
      img(:src="thumbnail?.base64 || thumbnail?.url" class="max-w-full max-h-full mx-auto rounded shadow-lg")
      button.absolute.top-4.right-4.text-white.bg-black.bg-opacity-50.rounded-full.p-2(@click.stop="showFullPreview = false")
        X(class="w-5 h-5")
  
  // Error Display
  .error-message.mt-4(v-if="error")
    .bg-red-50.border.border-red-200.rounded-lg.p-4
      .flex.items-center.gap-2
        AlertCircle(class="w-5 h-5 text-red-600")
        p.text-red-600 {{ error }}
      button.mt-2.text-sm.text-red-500(@click="error = ''") Dismiss
  
  // Debug Info (remove in production)
  .debug-info.mt-8.p-4.bg-gray-100.rounded-lg.text-xs(v-if="debug")
    pre {{ JSON.stringify({ uploadedFile, thumbnail: thumbnail?.filename, error }, null, 2) }}
</template>

<script setup lang="ts">
import { ref } from 'vue'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { RefreshCw, ArrowRight, X, AlertCircle } from 'lucide-vue-next'
import { useLordStore } from '@/stores/LordStore'
// Types
interface FileInfo {
  id: string
  filename: string
  originalName: string
  size: number
  isPasswordProtected: boolean
  pageCount?: number
  requiresPassword?: boolean
}

interface ThumbnailData {
  url: string
  base64: string
  filename: string
  size: number
}

// State
const lordStore = useLordStore();
const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const uploadedFile = ref<FileInfo | null>(null)
const thumbnail = ref<ThumbnailData | null>(null)
const showPasswordDialog = ref(false)
const pdfPassword = ref('')
const verifyingPassword = ref(false)
const error = ref('')
const showFullPreview = ref(false)
const debug = ref(true) // Set to false in production

// Helper Functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    uploadFile(target.files[0])
  }
}

const handleDrop = (event: DragEvent) => {
  isDragging.value = false
  const files = event.dataTransfer?.files
  if (files && files[0]) {
    uploadFile(files[0])
  }
}

/**
 * STEP 1: Upload PDF file to server
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
  formData.append('oropdf', 'true')

  try {
    const response = await axios.post(`http://${lordStore.db.ip}:9457/api/v1/upload-pdf`, formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          uploadProgress.value = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        }
      }
    })

    if (response.data.success && response.data.step === 'uploaded') {
      console.log('Step 1 Complete: File uploaded successfully', response.data)
      uploadedFile.value = response.data.fileInfo

      // Check if password is required
      if (uploadedFile.value.isPasswordProtected) {
        showPasswordDialog.value = true
      } else {
        // Step 2: Generate thumbnail automatically
        await generateThumbnail()
      }
    } else {
      error.value = 'Upload failed: Invalid response from server'
    }

  } catch (err: any) {
    console.error('Upload error:', err)
    error.value = err.response?.data?.error || 'Failed to upload file'
  } finally {
    uploading.value = false
  }
}

/**
 * Submit password for protected PDF
 */
const submitPassword = async () => {
  if (!pdfPassword.value) {
    error.value = 'Please enter the password'
    return
  }

  verifyingPassword.value = true
  error.value = ''

  try {
    // Try to generate thumbnail with password
    await generateThumbnail(pdfPassword.value)
    showPasswordDialog.value = false
    pdfPassword.value = ''

  } catch (err: any) {
    if (err.response?.status === 401) {
      error.value = 'Invalid password. Please try again.'
    } else {
      error.value = err.response?.data?.error || 'Failed to verify password'
    }
  } finally {
    verifyingPassword.value = false
  }
}

/**
 * STEP 2: Generate thumbnail from uploaded PDF
 */
const generateThumbnail = async (password?: string) => {
  if (!uploadedFile.value) {
    error.value = 'No file uploaded. Please upload a file first.'
    return
  }

  thumbnail.value = null

  const requestData = {
    fileId: uploadedFile.value.id,
    pageNumber: 1
  }

  if (password) {
    Object.assign(requestData, { password })
  }

  try {
    const response = await axios.post('/api/v1/generate-thumbnail', requestData)

    if (response.data.success && response.data.step === 'thumbnail_generated') {
      console.log('Step 2 Complete: Thumbnail generated successfully', response.data)
      thumbnail.value = response.data.thumbnail

      // Update file info with page count if available
      if (response.data.fileInfo?.pageCount) {
        uploadedFile.value.pageCount = response.data.fileInfo.pageCount
      }
    } else {
      error.value = 'Thumbnail generation failed'
    }

  } catch (err: any) {
    console.error('Thumbnail generation error:', err)

    if (err.response?.status === 401) {
      if (!password) {
        showPasswordDialog.value = true
      }
      error.value = err.response?.data?.error || 'Password required'
    } else {
      error.value = err.response?.data?.error || 'Failed to generate thumbnail'
    }

    throw err
  }
}

/**
 * Regenerate thumbnail (e.g., for different page)
 */
const regenerateThumbnail = async () => {
  await generateThumbnail()
}

/**
 * Convert PDF to JPG (next step)
 */
const convertPDF = () => {
  console.log('Ready to convert PDF:', uploadedFile.value)
  // Implement conversion logic here
}

// Reset everything
const reset = () => {
  uploadedFile.value = null
  thumbnail.value = null
  error.value = ''
  uploadProgress.value = 0
  showPasswordDialog.value = false
  pdfPassword.value = ''
}
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>