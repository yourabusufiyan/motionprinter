<template lang="pug">
.qr-scanner-container.min-h-screen.bg-gradient-to-br(
  class="from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800"
)
  .container.mx-auto.px-4.py-8(class="sm:px-6 lg:px-8")

    h1.text-2xl.font-bold.text-red-500.mb-4.text-center Cooming Soon: Scan to Receive

    // QR Scanner Card
    .text-center.mb-8
      vue-qr.aspect-square.bg-white.rounded-xl.shadow-md.overflow-hidden(
        class="dark:bg-gray-800"
        :text="qrText",
        size="250",
      )

    // Files Table Section
    .bg-white.rounded-xl.shadow-lg.overflow-hidden(:class=`{
      'dark:bg-gray-800': true
    }`)
      // Table Header
      .px-6.py-4.border-b.border-gray-200(:class=`{
        'dark:border-gray-700': true
      }`)
        .flex.items-center.justify-between.flex-wrap.gap-3
          div
            h3.text-lg.font-semibold.text-gray-900(class="dark:text-white") Received Files
            p.text-sm.text-gray-600.mt-1(class="dark:text-gray-400") Total: {{ filteredFiles.length }} files
          .flex.gap-2
            .relative
              Search.absolute.left-3.top-1-2.transform.-translate-y-1-2.w-5.h-5.text-gray-400
              input.pl-10.pr-4.py-2.border.border-gray-300.rounded-lg.text-sm(
                type="text",
                placeholder="Search files...",
                v-model="searchQuery",
                class="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              )


      // Table
      .overflow-x-auto
        table.min-w-full.divide-y.divide-gray-200(:class=`{
          'dark:divide-gray-700': true
        }`)
          thead.bg-gray-50(:class=`{
            'dark:bg-gray-900': true
          }`)
            tr
              th.px-6.py-3.text-left.text-xs.font-medium.text-gray-500.uppercase.tracking-wider(
                scope="col",
                :class=`{
                  'dark:text-gray-400': true
                }`
              ) File Name
              th.px-6.py-3.text-left.text-xs.font-medium.text-gray-500.uppercase.tracking-wider(
                scope="col",
                :class=`{
                  'dark:text-gray-400': true
                }`
              ) Size

              th.px-6.py-3.text-left.text-xs.font-medium.text-gray-500.uppercase.tracking-wider(
                scope="col",
                :class=`{
                  'dark:text-gray-400': true
                }`
              ) Date
              th.px-6.py-3.text-left.text-xs.font-medium.text-gray-500.uppercase.tracking-wider(
                scope="col",
                :class=`{
                  'dark:text-gray-400': true
                }`
              ) Actions
          tbody.bg-white.divide-y.divide-gray-200(:class=`{
            'dark:bg-gray-800': true,
            'dark:divide-gray-700': true
          }`)
            tr(v-for="file in paginatedFiles", :key="file.id")
              td.px-6.py-4.whitespace-nowrap
                .flex.items-center
                  .flex-shrink-0.h-10.w-10
                    .w-10.h-10.bg-blue-100.rounded-lg.flex.items-center.justify-center(:class=`{
                      'dark:bg-blue-900': true
                    }`)
                      File.w-6.h-6.text-blue-600
                  .ml-4
                    .text-sm.font-medium.text-gray-900(:class=`{
                      'dark:text-white': true
                    }`) {{ file.name }}
                    .text-xs.text-gray-500(:class=`{
                      'dark:text-gray-400': true
                    }`) {{ file.type || 'PDF Document' }}
              td.px-6.py-4.whitespace-nowrap
                .text-sm.text-gray-900(:class=`{
                  'dark:text-gray-300': true
                }`) {{ formatFileSize(file.size) }}

              td.px-6.py-4.whitespace-nowrap
                .text-sm.text-gray-900(:class=`{
                  'dark:text-gray-300': true
                }`) {{ formatDate(file.date) }}
              td.px-6.py-4.whitespace-nowrap.text-sm.font-medium
                button.text-blue-600.mr-3(
                  @click="printFile(file)",
                  :class=`{
                    'hover:text-blue-900': true,
                    'dark:text-blue-400': true,
                    'dark:hover:text-blue-300': true
                  }`
                )
                  Printer.inline-block.w-5.h-5
                button.text-red-600(
                  @click="deleteFile(file)",
                  :class=`{
                    'hover:text-red-900': true,
                    'dark:text-red-400': true,
                    'dark:hover:text-red-300': true
                  }`
                )
                  Trash2Icon.inline-block.w-5.h-5

          // Empty State
          .text-center.py-12.w-full(v-if="filteredFiles.length === 0")
            FileText.mx-auto.h-12.w-12.text-gray-400
            h3.mt-2.text-sm.font-medium.text-gray-900(:class=`{
              'dark:text-white': true
            }`) No files found
            p.mt-1.text-sm.text-gray-500(:class=`{
              'dark:text-gray-400': true
            }`) No files match your search criteria.

      // Pagination
      .bg-white.px-4.py-3.flex.items-center.justify-between.border-t.border-gray-200(
        v-if="filteredFiles.length > 0",
        :class=`{
          'dark:bg-gray-800': true,
          'dark:border-gray-700': true,
          'sm:px-6': true
        }`
      )
        .flex-1.flex.sm-hidden.justify-between.items-center
          button.relative.inline-flex.items-center.px-4.py-2.border.border-gray-300.text-sm.font-medium.rounded-md.text-gray-700.bg-white(
            @click="previousPage",
            :disabled="currentPage === 1",
            :class=`{
              'hover:bg-gray-50': true,
              'dark:bg-gray-700': true,
              'dark:text-gray-300': true,
              'dark:border-gray-600': true
            }`
          )
            | Previous
          .details
            .hidden.sm-flex-1.sm-flex.sm-items-center.sm-justify-between
              div
                p.text-sm.text-gray-700(:class=`{
                  'dark:text-gray-300': true
                }`)
                  | Showing 
                  span.font-medium {{ (currentPage - 1) * pageSize + 1 }}
                  |  to 
                  span.font-medium {{ Math.min(currentPage * pageSize, filteredFiles.length) }}
                  |  of 
                  span.font-medium {{ filteredFiles.length }}
                  |  results
          button.relative.inline-flex.items-center.px-4.py-2.border.border-gray-300.text-sm.font-medium.rounded-md.text-gray-700.bg-white.ml-3(
            @click="nextPage",
            :disabled="currentPage === totalPages",
            :class=`{
              'hover:bg-gray-50': true,
              'dark:bg-gray-700': true,
              'dark:text-gray-300': true,
              'dark:border-gray-600': true
            }`
          )
            | Next

</template>

<style scoped>
.scanner-line {
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% {
    top: 0;
  }

  100% {
    top: 100%;
  }
}

video {
  transform: scaleX(-1);
}

.scanner-frame {
  position: relative;
}

/* Custom utility classes that need to be defined */
.sm-hidden {
  display: none;
}

.top-1-2 {
  top: 50%;
}

.transform {
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

.-translate-y-1-2 {
  --tw-translate-y: -50%;
  transform: translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y));
}

@media (min-width: 640px) {
  .sm-hidden {
    display: flex;
  }

  .sm-flex-1 {
    flex: 1;
  }

  .sm-flex {
    display: flex;
  }

  .sm-items-center {
    align-items: center;
  }

  .sm-justify-between {
    justify-content: space-between;
  }

  .sm-px-6 {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}

.-space-x-px> :not([hidden])~ :not([hidden]) {
  --tw-space-x-reverse: 0;
  margin-right: calc(-1px * var(--tw-space-x-reverse));
  margin-left: calc(-1px * calc(1 - var(--tw-space-x-reverse)));
}
</style>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import VueQr from 'vue-qr'
import { Trash2Icon, Printer, File, Search, FileText } from 'lucide-vue-next'

const qrText = ref('https://example.com')

// Table state
const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

// Sample file data - replace with your actual data source
const files = ref([
  {
    id: 1,
    name: 'Annual Report 2024.pdf',
    size: 2048576,
    date: new Date('2024-12-15T10:30:00'),
    type: 'PDF Document'
  },
  {
    id: 2,
    name: 'Invoice_12345.pdf',
    size: 512000,
    date: new Date('2024-12-14T14:20:00'),
    type: 'PDF Document'
  },
  {
    id: 3,
    name: 'Contract_Signed.pdf',
    size: 1048576,
    date: new Date('2024-12-13T09:15:00'),
    type: 'PDF Document'
  },
  {
    id: 4,
    name: 'Presentation_Slides.pdf',
    size: 3145728,
    date: new Date('2024-12-12T16:45:00'),
    type: 'PDF Document'
  },
  {
    id: 5,
    name: 'Meeting_Minutes.pdf',
    size: 256000,
    date: new Date('2024-12-11T11:00:00'),
    type: 'PDF Document'
  }
])

// Computed properties for filtering and pagination
const filteredFiles = computed(() => {
  let result = files.value

  // Apply search filter
  if (searchQuery.value) {
    result = result.filter(file =>
      file.name.toLowerCase().includes(searchQuery.value.toLowerCase())
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



// Table functions
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}


const printFile = (file: any) => {
  console.log('Printing file:', file)
  // Implement print logic here
}

const deleteFile = (file: any) => {
  const index = files.value.findIndex(f => f.id === file.id)
  if (index !== -1) {
    files.value.splice(index, 1)
  }
}

// Pagination functions
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}


// Lifecycle hooks
onMounted(() => {
})

onUnmounted(() => {

})
</script>