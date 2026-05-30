<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import VueQr from 'vue-qr'
import { Trash2Icon, Printer, File, Search, FileText, RefreshCw, Eye, HardDrive, Clock, CheckCircle, Settings } from 'lucide-vue-next'
import axios from 'axios'
import { useLordStore } from '@/stores/LordStore'
import { findIndex } from 'lodash'
import { ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron/renderer'

type CreateResponse = {
  success: boolean
  computerID: string
  token: string
  message: string
  createdAt: string
  updatedAt: string
}

type ScannerFileData = {
  id: string
  computerID: string
  fileName: string
  storedName: string
  filePath: string
  fileSize: number
  mimeType: string
  description: string
  uploadedAt: string
  downloadedAt: string | null
  downloadProgress?: number
  downloadSpeed?: number
}

// State
const qrText = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const lordStore = useLordStore()
const createdID = ref<CreateResponse>({} as CreateResponse)
const files = ref<ScannerFileData[]>(lordStore.db.scanner?.files?.reverse() || [])
const loading = ref(false)
const error = ref<string | null>(null)
const isPolling = ref(false)
const lastUpdated = ref('')
const updating = ref(false)
const showRefreshSettings = ref(false)
const refreshInterval = ref(5000)
let intervalId: any = null

// Refresh interval options
const refreshOptions = [
  { value: 1000, label: '1 second', icon: '⚡' },
  { value: 2000, label: '2 seconds', icon: '🔥' },
  { value: 3000, label: '3 seconds', icon: '👍' },
  { value: 5000, label: '5 seconds', icon: '📁' },
  { value: 10000, label: '10 seconds', icon: '⏱️' },
  { value: 15000, label: '15 seconds', icon: '🕐' },
  { value: 30000, label: '30 seconds', icon: '🕒' },
  { value: 60000, label: '1 minute', icon: '⏰' }
]

// Axios instance
const axiosInstance = axios.create({
  baseURL: `http://80.225.220.97:3000`,
})

// Computed properties
const filteredFiles = computed(() => {
  let result = files.value
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(file =>
      file.fileName.toLowerCase().includes(query) ||
      file.description?.toLowerCase().includes(query) ||
      file.mimeType.toLowerCase().includes(query)
    )
  }
  return result
})

const totalPages = computed(() => Math.ceil(filteredFiles.value.length / pageSize.value))
const paginatedFiles = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredFiles.value.slice(start, end)
})

const displayedPages = computed(() => {
  const pages = []
  const maxVisible = 5
  let startPage = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let endPage = Math.min(totalPages.value, startPage + maxVisible - 1)
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1)
  }
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i)
  }
  return pages
})

const totalSize = computed(() => {
  return files.value.reduce((sum, file) => sum + (file.fileSize || 0), 0)
})

const downloadedFiles = computed(() => {
  return files.value.filter(file => file.downloadedAt).length
})

const pendingFiles = computed(() => {
  return files.value.filter(file => !file.downloadedAt).length
})

const currentRefreshOption = computed(() => {
  return refreshOptions.find(opt => opt.value === refreshInterval.value) || refreshOptions[3]
})

// Utility functions
const formatFileSize = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format time
const formatTime = (seconds: number): string => {
  if (seconds < 60) return `${Math.floor(seconds)}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

// Calculate ETA
const calculateETA = (totalSize: number, speed: number, progress: number): string => {
  if (!speed || speed === 0 || progress >= 100) return '--'
  const remainingBytes = totalSize * (1 - progress / 100)
  const etaSeconds = remainingBytes / speed
  return formatTime(etaSeconds)
}

const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getFileIcon = (mimeType: string) => {
  if (mimeType?.includes('pdf')) return '📄'
  if (mimeType?.includes('image')) return '🖼️'
  if (mimeType?.includes('video')) return '🎥'
  if (mimeType?.includes('audio')) return '🎵'
  if (mimeType?.includes('zip') || mimeType?.includes('rar')) return '📦'
  return '📁'
}

const getStatusColor = (downloadedAt: string | null) => {
  return downloadedAt ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
}

const getStatusText = (downloadedAt: string | null) => {
  return downloadedAt ? 'Downloaded' : 'Pending'
}

// File actions
const printFile = (file: ScannerFileData) => {
  if (file.filePath) {
    const printWindow = window.open(file.filePath, '_blank')
    printWindow?.print()
  }
}

const previewFile = (file: ScannerFileData) => {
  if (file.storedName) {
    window.open(`http://${lordStore.db.ip}:9457/scanner/${file.storedName}`, '_blank')
  }
}

const deleteFile = async (file: ScannerFileData) => {
  if (!confirm(`Are you sure you want to delete "${file.fileName}"?`)) {
    return
  }

  try {
    const token = createdID.value.token
    const deleteResponse = await axios.delete(
      `http://${lordStore.db.ip}:9457/api/v1/oroscanner/delete-file/${file.id}`,
      {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log('Delete response:', deleteResponse.data)

    if (deleteResponse.data.success) {
      const index = files.value.findIndex(f => f.id === file.id)
      if (index !== -1) {
        files.value.splice(index, 1)
        lordStore.db.scanner.files = files.value
        saveToMain()
        console.log('File deleted successfully:', file.fileName)
        showMessage('File deleted successfully', 'success')
      }
    } else {
      throw new Error(deleteResponse.data.message || 'Failed to delete file')
    }
  } catch (err: any) {
    console.error('Error deleting file:', err)
    const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to delete file'
    error.value = errorMsg
    showMessage(errorMsg, 'error')
    setTimeout(() => { error.value = null }, 3000)
  }
}

const showMessage = (message: string, type: 'success' | 'error') => {
  const toast = document.createElement('div')
  toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} animate-fade-in`
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 3000)
}

// Pagination
const previousPage = () => { if (currentPage.value > 1) currentPage.value-- }
const nextPage = () => { if (currentPage.value < totalPages.value) currentPage.value++ }
const goToPage = (page: number) => { currentPage.value = page }

// Fetch files
async function fetchFiles(token: string) {
  if (!token || updating.value) return

  updating.value = true

  try {
    const response = await axiosInstance.get('/upload-display', {
      headers: { 'Authorization': token }
    })

    if (response.data?.files) {
      const newFiles = updateOrAddFiles(files.value, response.data.files)

      if (JSON.stringify(files.value) !== JSON.stringify(newFiles)) {
        files.value = newFiles
        lordStore.db.scanner.files = newFiles
        saveToMain()
      }

      lastUpdated.value = new Date().toLocaleTimeString()
    }
  } catch (err) {
    console.error('Error fetching files:', err)
  } finally {
    updating.value = false
  }
}

// Update or add files
function updateOrAddFiles(oldArray: ScannerFileData[], newArray: ScannerFileData[]): ScannerFileData[] {
  const result = [...oldArray]
  let hasChanges = false

  newArray.forEach(newFile => {
    const existingIndex = findIndex(result, { id: newFile.id })
    if (existingIndex !== -1) {
      if (JSON.stringify(result[existingIndex]) !== JSON.stringify(newFile)) {
        result[existingIndex] = {
          ...result[existingIndex],
          ...newFile,
          downloadedAt: newFile.downloadedAt || result[existingIndex].downloadedAt
        }
        hasChanges = true
      }
    } else {
      result.push(newFile)
      hasChanges = true
    }
  })

  return hasChanges ? result.filter(file => file !== null && file !== undefined) : oldArray
}

// Save to store
function saveToMain() {
  lordStore.lowdb.data.scanner = lordStore.lowdb.data.scanner || {}
  lordStore.lowdb.data.scanner.files = files.value
  lordStore.lowdb.data.scanner.registration = createdID.value
  lordStore.lowdb.data.scanner.refreshInterval = refreshInterval.value
  lordStore.saveLowDB()
}

// Load saved refresh interval
function loadRefreshInterval() {
  if (lordStore.lowdb.data.scanner?.refreshInterval) {
    refreshInterval.value = lordStore.lowdb.data.scanner.refreshInterval
  }
}

// Polling
const startPolling = () => {
  if (intervalId) clearInterval(intervalId)
  isPolling.value = true
  if (createdID.value.token) fetchFiles(createdID.value.token)

  intervalId = setInterval(() => {
    if (isPolling.value && createdID.value.token) {
      fetchFiles(createdID.value.token)
    }
  }, refreshInterval.value)
}

const stopPolling = () => {
  isPolling.value = false
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

// Change refresh interval
const changeRefreshInterval = async (newInterval: number) => {
  refreshInterval.value = newInterval
  saveToMain()

  if (isPolling.value) {
    stopPolling()
    startPolling()
  }

  const message = document.createElement('div')
  message.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in'
  message.textContent = `Refresh interval changed to ${refreshOptions.find(o => o.value === newInterval)?.label}`
  document.body.appendChild(message)
  setTimeout(() => message.remove(), 2000)
}

const toggleRefreshSettings = () => {
  showRefreshSettings.value = !showRefreshSettings.value
  if (showRefreshSettings.value) {
    setTimeout(() => {
      showRefreshSettings.value = false
    }, 5000)
  }
}

// Manual refresh
const manualRefresh = async () => {
  loading.value = true
  if (createdID.value.token) {
    await fetchFiles(createdID.value.token)
  }
  loading.value = false
}


// Watch for refresh interval changes
watch(refreshInterval, () => {
  if (isPolling.value) {
    stopPolling()
    startPolling()
  }
})

// Lifecycle
onMounted(() => {
  loadRefreshInterval()

  axiosInstance.post('/upload-create', { computerID: lordStore.db.id })
    .then(response => {
      createdID.value = response.data
      qrText.value = `http://80.225.220.97:3000/upload/${createdID.value.computerID}?token=${createdID.value.token}`
      saveToMain()
      startPolling()
    })
    .catch(error => {
      console.error('Error registering computer:', error)
    })

  ipcRenderer.on('downloadProgress', (event, data: { percent: number, speed: number, file: ScannerFileData }) => {
    const index = files.value.findIndex(f => f.id === data.file.id)
    if (index !== -1) {
      files.value[index].downloadProgress = data.percent
      files.value[index].downloadSpeed = data.speed
      // Trigger reactivity
      files.value = [...files.value]
    }
  })

  // Listen for download completion
  ipcRenderer.on('downloadComplete', (event, data: { file: ScannerFileData, downloadedAt: string }) => {
    const index = files.value.findIndex(f => f.id === data.file.id)
    if (index !== -1) {
      files.value[index].downloadedAt = data.downloadedAt
      files.value[index].downloadProgress = undefined
      files.value[index].downloadSpeed = undefined
      files.value = [...files.value]

      // Show notification
      showMessage(`${data.file.fileName} downloaded successfully`, 'success')
    }
  })


})

onUnmounted(() => {
  stopPolling()
  ipcRenderer.removeAllListeners('downloadProgress')
  ipcRenderer.removeAllListeners('downloadComplete')
})
</script>

<template lang="pug">
.qr-scanner-container.min-h-screen.bg-gradient-to-br.from-gray-50.to-gray-100
  .container.mx-auto.px-4.py-8.sm.px-6.lg.px-8
    // Header
    .mb-8.text-center
      h1.text-4xl.font-bold.text-gray-900.mb-2
        | 📱 Scanner File Manager
      p.text-gray-600
        | Manage and track all your scanned files

    // QR Code and Connection Status
    .grid.grid-cols-1.gap-6.mb-8(class="lg:grid-cols-2")
      // QR Code Card
      .bg-white.rounded-xl.shadow-lg.p-6.text-center
        h3.text-lg.font-semibold.text-gray-900.mb-4 Scan to Upload
        vue-qr.mx-auto.bg-white.rounded-xl.shadow-md(
          :text="qrText"
          size="180"
          v-if="qrText"
        )
        p.mt-4.text-sm.text-gray-600
          | Scan this QR code with your mobile device to upload files

      // Connection Status Card
      .bg-white.rounded-xl.shadow-lg.p-6(v-if="createdID.token")
        h3.text-lg.font-semibold.text-gray-900.mb-4 Connection Status
        .space-y-3
          .flex.items-center.justify-between
            span.text-sm.text-gray-600 Computer ID
            span.text-sm.font-mono.text-gray-900 {{ createdID.computerID }}
          .flex.items-center.justify-between
            span.text-sm.text-gray-600 Token
            span.text-xs.font-mono.text-gray-900.break-all {{ createdID.token }}
          .flex.items-center.justify-between
            span.text-sm.text-gray-600 Status
            span.inline-flex.items-center.gap-2
              .w-2.h-2.rounded-full.bg-green-500.animate-pulse
              span.text-sm.text-green-600 Connected
          .flex.items-center.justify-between
            span.text-sm.text-gray-600 Auto-Refresh
            .relative
              button.inline-flex.items-center.gap-2.px-3.py-1.bg-gray-100.rounded-lg.hover.bg-gray-200.transition-colors(
                @click="toggleRefreshSettings"
              )
                span.text-sm(:class="isPolling ? 'text-green-600' : 'text-red-600'") {{ isPolling ? 'Active' : 'Stopped' }}
                span.text-xs.font-mono {{ currentRefreshOption.label }}
                Settings.w-4.h-4.text-gray-600
              
              .absolute.top-full.right-0.mt-2.bg-white.rounded-lg.shadow-xl.border.border-gray-200.z-50(
                v-if="showRefreshSettings"
                style="min-width: 180px"
              )
                .p-2
                  .text-xs.font-semibold.text-gray-500.px-3.py-2 Refresh Interval
                  .divide-y.divide-gray-100
                    button.w-full.text-left.px-3.py-2.text-sm.hover.bg-gray-50.transition-colors.flex.items-center.justify-between(
                      v-for="option in refreshOptions"
                      :key="option.value"
                      @click="changeRefreshInterval(option.value)"
                      :class="{ 'bg-blue-50 text-blue-600': refreshInterval === option.value }"
                    )
                      span.flex.items-center.gap-2
                        span {{ option.icon }}
                        span {{ option.label }}
                      span(v-if="refreshInterval === option.value") ✓
          .flex.items-center.justify-between
            span.text-sm.text-gray-600 Pending
            span.inline-flex.items-center.gap-2
              span.text-sm.text-yellow-600 {{ pendingFiles }}
              .rounded-full.bg-yellow-100
                Clock.text-yellow-600.w-4.h-4
          .flex.items-center.justify-between
            span.text-sm.text-gray-600 Downloaded
            span.inline-flex.items-center.gap-2
              span.text-sm.text-green-600 {{ downloadedFiles }}
              .rounded-full.bg-green-100
                CheckCircle.text-green-600.w-4.h-4
          .flex.items-center.justify-between
            span.text-sm.text-gray-600 Total Size
            span.inline-flex.items-center.gap-2
              span.text-sm.text-gray-900 {{ formatFileSize(totalSize) }}
              .rounded-full.bg-green-100
                HardDrive.text-green-600.w-4.h-4

    // Files Table Section
    .bg-white.rounded-xl.shadow-lg.overflow-hidden
      // Table Header
      .px-6.py-4.border-b.border-gray-200
        .flex.flex-wrap.items-center.justify-between.gap-3
          div
            h3.text-lg.font-semibold.text-gray-900 Received Files
            p.text-sm.text-gray-600.mt-1
              | {{ filteredFiles.length }} files found
              span.ml-2(v-if="lastUpdated") • Last updated: {{ lastUpdated }}
              span.ml-2.text-green-600.text-xs(v-if="updating") Updating...
              span.ml-2.text-blue-600.text-xs(v-if="isPolling") • Refresh: {{ currentRefreshOption.label }}
          .flex.gap-2
            .relative
              Search.absolute.left-3.top-1-2.transform.-translate-y-1-2.w-5.h-5.text-gray-400
              input.pl-10.pr-4.py-2.border.border-gray-300.rounded-lg.text-sm(
                type="text"
                placeholder="Search files..."
                v-model="searchQuery"
                class="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              )
            button.px-3.py-2.bg-blue-600.text-white.rounded-lg.text-sm.flex.items-center.gap-2(
              @click="manualRefresh"
              :disabled="loading"
            )
              RefreshCw.w-4.h-4(:class="{ 'animate-spin': loading }")
              span {{ loading ? 'Loading...' : 'Refresh' }}

      // Loading State
      .text-center.py-12(v-if="loading")
        .inline-block.animate-spin.rounded-full.h-8.w-8.border-b-2.border-blue-600
        p.mt-4.text-gray-600 Loading files...

      // Error State
      .mx-4.my-4(v-if="error")
        .bg-red-100.border.border-red-400.text-red-700.px-4.py-3.rounded-lg.flex.items-center.justify-between
          span {{ error }}
          button(@click="error = null") ✕

      // Table
      .overflow-x-auto(v-if="!loading")
        table.min-w-full.divide-y.divide-gray-200
          thead.bg-gray-50
            tr
              th.px-6.py-3.text-left.text-xs.font-medium.text-gray-500.uppercase.tracking-wider File
              th.px-6.py-3.text-left.text-xs.font-medium.text-gray-500.uppercase.tracking-wider Size
              th.px-6.py-3.text-left.text-xs.font-medium.text-gray-500.uppercase.tracking-wider Uploaded
              th.px-6.py-3.text-left.text-xs.font-medium.text-gray-500.uppercase.tracking-wider Status
              th.px-6.py-3.text-left.text-xs.font-medium.text-gray-500.uppercase.tracking-wider Actions
          tbody.bg-white.divide-y.divide-gray-200
            tr(
              v-for="file in paginatedFiles" 
              :key="file.id" 
              class="hover:bg-gray-50 transition-colors duration-150"
            )
              td.px-6.py-4
                .flex.items-center.gap-3
                  .w-10.h-10.bg-blue-100.rounded-lg.flex.items-center.justify-center
                    span.text-xl {{ getFileIcon(file.mimeType) }}
                  div
                    .text-sm.font-medium.text-gray-900 {{ file.fileName }}
                    .text-xs.text-gray-500 {{ file.mimeType }}
              td.px-6.py-4.whitespace-nowrap
                .text-sm.text-gray-900 {{ formatFileSize(file.fileSize) }}
              td.px-6.py-4.whitespace-nowrap
                .text-sm.text-gray-900 {{ formatDate(file.uploadedAt) }}
              td.px-6.py-4.whitespace-nowrap
                // Download progress bar for active downloads
                div(v-if="(file.downloadProgress !== undefined && file.downloadProgress < 100)")
                  .flex.flex-col.gap-1(class="min-w-[150px]")
                    .flex.items-center.justify-between.text-xs
                      span.text-blue-600
                        | ⬇️ Downloading
                        span.text-green-600.ml-1(v-if="file.downloadProgress") {{ file.downloadProgress }}%
                      span.text-gray-500.font-mono
                        | {{ file.downloadSpeed ? formatFileSize(file.downloadSpeed) + '/s' : '0 B/s' }}
                    .w-full.bg-gray-200.rounded-full.h-2.overflow-hidden
                      .bg-gradient-to-r.from-blue-500.to-green-500.h-2.rounded-full.transition-all.duration-300(
                        :style="{ width: `${file.downloadProgress}%` }"
                      )
                    .flex.justify-between.text-xs.text-gray-400
                      span Elapsed: {{ formatTime(file.downloadProgress ? (Date.now() - new Date(file.uploadedAt).getTime()) / 1000 : 0) }}
                      span ETA: {{ calculateETA(file.fileSize, file.downloadSpeed, file.downloadProgress) }}
                // Completed/Pending status
                span(v-else).px-2.py-1.text-xs.rounded-full.font-medium(:class="getStatusColor(file.downloadedAt)")
                  | {{ getStatusText(file.downloadedAt) }}
              td.px-6.py-4.whitespace-nowrap
                .flex.gap-2
                  button.p-1.text-blue-600.hover.text-blue-800.transition-colors(
                    @click="previewFile(file)"
                    title="Preview"
                  )
                    Eye.w-5.h-5
                  button.p-1.text-green-600.hover.text-green-800.transition-colors(
                    @click="printFile(file)"
                    title="Print"
                  )
                    Printer.w-5.h-5
                  button.p-1.text-red-600.hover.text-red-800.transition-colors(
                    @click="deleteFile(file)"
                    title="Delete"
                  )
                    Trash2Icon.w-5.h-5

          // Empty State
          tr(v-if="filteredFiles.length === 0")
            td(colspan="5" class="text-center py-12")
              FileText.mx-auto.h-12.w-12.text-gray-400
              h3.mt-2.text-sm.font-medium.text-gray-900 No files found
              p.mt-1.text-sm.text-gray-500 No files have been uploaded yet

      // Pagination
      .bg-white.px-4.py-3.flex.items-center.justify-between.border-t.border-gray-200.sm.px-6(
        v-if="filteredFiles.length > 0"
      )
        .flex-1.flex.justify-between.sm-hidden
          button.relative.inline-flex.items-center.px-4.py-2.border.border-gray-300.text-sm.font-medium.rounded-md.text-gray-700.bg-white(
            @click="previousPage"
            :disabled="currentPage === 1"
          ) Previous
          button.relative.inline-flex.items-center.px-4.py-2.border.border-gray-300.text-sm.font-medium.rounded-md.text-gray-700.bg-white.ml-3(
            @click="nextPage"
            :disabled="currentPage === totalPages"
          ) Next
        .hidden.sm-flex-1.sm-flex.sm-items-center.sm-justify-between
          div
            p.text-sm.text-gray-700
              | Showing 
              span.font-medium {{ (currentPage - 1) * pageSize + 1 }}
              | to 
              span.font-medium {{ Math.min(currentPage * pageSize, filteredFiles.length) }}
              | of 
              span.font-medium {{ filteredFiles.length }}
              | results
          div
            nav.relative.z-0.inline-flex.rounded-md.shadow-sm.-space-x-px
              button.relative.inline-flex.items-center.px-2.py-2.rounded-l-md.border.border-gray-300.bg-white.text-sm.font-medium.text-gray-500(
                @click="previousPage"
                :disabled="currentPage === 1"
              ) &laquo;
              button(
                v-for="page in displayedPages"
                :key="page"
                @click="goToPage(page)"
                class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium"
                :class="page === currentPage ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'"
              ) {{ page }}
              button.relative.inline-flex.items-center.px-2.py-2.rounded-r-md.border.border-gray-300.bg-white.text-sm.font-medium.text-gray-500(
                @click="nextPage"
                :disabled="currentPage === totalPages"
              ) &raquo;

    // Footer
    .mt-8.text-center.text-xs.text-gray-500
      p Scanner File Manager v1.0 • Auto-refreshes every {{ currentRefreshOption.label }}
pre {{ files }}
</template>

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

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.top-1-2 {
  top: 50%;
}

.-translate-y-1-2 {
  --tw-translate-y: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.-space-x-px> :not([hidden])~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(-1px * var(--tw-space-x-reverse));
  margin-left: calc(-1px * calc(1 - var(--tw-space-x-reverse)));
}

.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}

.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}

.hover\:shadow-lg:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>