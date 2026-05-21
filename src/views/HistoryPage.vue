<script lang="ts" setup>
import moment from 'moment';
import { chunk, fill, sortBy, concat, cloneDeep } from 'lodash';
import { ref, computed, reactive } from 'vue';

import { useLordStore } from '../stores/LordStore';
import { humanFileSize } from './../utils/short-functions';

import type { $toPrintsCommandsFile, $lordData, $cardMaker } from './../declarations';

import { ipcRenderer } from 'electron';

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './../components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'vue-sonner';

const lordStore = useLordStore();

// Unified history item - represents a GROUP (not individual files)
interface UnifiedHistoryItem {
  id: string;
  type: 'print' | 'cardmaker' | 'oropdf';
  title: string | undefined;
  filename: string | undefined,
  fileCount: number;
  totalSize: number;
  addedTime: number;
  addedBy: string;
  addedTo: string | null;
  // Download info
  downloadPath: string;
  downloadFilename: string;
  // Source-specific data
  cardType?: string;
  dpi?: number;
  pageCount?: number;
  // Original data reference
  originalData: any;
}

// Combine all histories into one array (group level)
const unifiedHistory = computed<UnifiedHistoryItem[]>(() => {
  const items: UnifiedHistoryItem[] = [];

  // 1. Print items - each is individual
  (lordStore.lowdb.data?.toPrintsCommands || []).forEach((item: any) => {
    items.push({
      id: item.id || item.filename,
      type: 'print',
      title: item.originalName,
      filename: item.originalName,
      fileCount: 1,
      totalSize: item.size,
      addedTime: item.addedTime as number,
      addedBy: item.addedBy as string,
      addedTo: item.addedTo || null,
      downloadPath: item.destination,
      downloadFilename: item.filename,
      originalData: item,
    });
  });

  // 2. CardMaker groups - each group contains multiple PDFs
  (lordStore.lowdb.data?.cardMaker || []).forEach((group: any) => {
    const totalSize = (group.pdfs || []).reduce((sum: number, pdf: any) => sum + (pdf.size || 0), 0);
    const firstPdf = group.pdfs?.[0];

    items.push({
      id: group.id,
      type: 'cardmaker',
      filename: group.filename,
      title: `Card Bundle: ${firstPdf?.cardType || ''} (${group.pdfs?.length || 0} cards)`,
      fileCount: group.pdfs?.length || 0,
      totalSize: totalSize,
      addedTime: firstPdf?.addedTime || group.addedTime || Date.now(),
      addedBy: firstPdf?.addedBy || '',
      addedTo: firstPdf?.addedTo || null,
      downloadPath: group.outputFile,
      downloadFilename: group.filename,
      cardType: firstPdf?.cardType,
      originalData: group,
    });
  });

  // 3. OROPDF groups - each group contains multiple converted files
  (lordStore.lowdb.data?.oropdf || []).forEach((group: any) => {
    const totalSize = (group.files || []).reduce((sum: number, file: any) => sum + (file.size || 0), 0);
    const firstFile = group.files?.[0];

    // Get output directory path - the converted images are stored here
    const outputDir = group.options?.out_dir || firstFile?.out_dir;

    if (!group.files?.length) return;

    items.push({
      id: group.id,
      type: 'oropdf',
      filename: group.id + '.zip',
      title: `PDF Conversion: ${group.files?.length || 0} file(s)`,
      fileCount: group.files?.length || 0,
      totalSize: totalSize,
      addedTime: group.addedTime,
      addedBy: firstFile?.addedBy || '',
      addedTo: null,
      downloadPath: group.options?.out_dir + '.zip',
      downloadFilename: `${group.id}.zip`, // Would need to zip the folder
      dpi: group.dpi,
      pageCount: firstFile?.pageCount,
      originalData: group,
    });
  });

  // Sort by addedTime (newest first)
  return sortBy(items, ['addedTime']).reverse();
});

const numberOfColumnsToDisplay = ref('10');
const pagination = computed<UnifiedHistoryItem[][]>(() =>
  chunk(unifiedHistory.value, +numberOfColumnsToDisplay.value),
);
const currentPage = ref(0);
const paginationNumbers = computed(() => {
  if (pagination.value.length <= 7)
    return fill(Array(pagination.value.length), 'a').map((el, i) => i);

  if (currentPage.value <= 4) {
    return fill(Array(7), 'a').map((el, i) => i);
  } else if (currentPage.value >= pagination.value.length - 4) {
    return fill(Array(pagination.value.length), 'a')
      .splice(0, 7)
      .map((el, i) => pagination.value.length - 1 - i)
      .sort();
  } else {
    return [-3, -2, -1, 0, 1, 2, 3].map((el) => currentPage.value + Number(el));
  }
});

let selectedItems = ref<UnifiedHistoryItem[]>([]);
const isAllSelected = computed<boolean>(
  () => selectedItems.value.length == +numberOfColumnsToDisplay.value,
);

function selectAllItems() {
  if (isAllSelected.value) {
    selectedItems.value = [];
  } else {
    selectedItems.value = pagination.value[currentPage.value];
  }
}

function displayFileName(fileNames: string) {
  var leftRightStrings = fileNames.split('.');
  var fName = leftRightStrings[0];
  var fExtension = leftRightStrings[1];
  var lengthFname = fName.length;
  if (lengthFname > 40) {
    return (
      fName.substr(0, 26) + ' ..... ' + fName.substr(-4) + '.' + fExtension
    );
  }
  return fileNames;
}

function getSourceBadgeClass(type: string): string {
  switch (type) {
    case 'print':
      return 'bg-blue-500';
    case 'cardmaker':
      return 'bg-purple-500';
    case 'oropdf':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
}

function getSourceLabel(type: string): string {
  switch (type) {
    case 'print':
      return 'Print';
    case 'cardmaker':
      return 'Card Maker';
    case 'oropdf':
      return 'ORO PDF';
    default:
      return '';
  }
}

function deleteGroup(item: UnifiedHistoryItem): boolean {
  let isDeleted = false;

  if (!lordStore.lowdb.data) return isDeleted;

  console.log('deleteGroup', item);

  if (item.type === 'print') {
    const beforeCount = lordStore.lowdb.data.toPrintsCommands?.length || 0;

    const removeFiled = (lordStore.lowdb.data.toPrintsCommands || []).filter((el: any) => {
      if (el.id !== item.id && el.filename !== item.downloadFilename) return true;
      isDeleted = true;
      return false;
    });

    lordStore.lowdb.data.trashes = concat(lordStore.lowdb.data.trashes || [], {
      ...item.originalData,
      trashedBy: 'auto',
      isDeleted: false,
      deletedBy: null,
      deletedTime: null,
      trashedTime: Date.now(),
      sourceType: item.type,
    });

    lordStore.lowdb.data.toPrintsCommands = removeFiled;

    console.log('before count', beforeCount, 'after count', lordStore.lowdb.data.toPrintsCommands?.length);
  }
  else if (item.type === 'cardmaker') {
    const beforeCount = lordStore.lowdb.data.cardMaker?.length || 0;

    const removeGroup = (lordStore.lowdb.data.cardMaker || []).filter((group: any) => {
      if (group.id !== item.id) return true;
      isDeleted = true;
      return false;
    });

    lordStore.lowdb.data.trashes = concat(lordStore.lowdb.data.trashes || [], {
      ...item.originalData,
      trashedBy: 'auto',
      isDeleted: false,
      deletedBy: null,
      deletedTime: null,
      trashedTime: Date.now(),
      sourceType: item.type,
    });

    lordStore.lowdb.data.cardMaker = removeGroup;

    console.log('before count', beforeCount, 'after count', lordStore.lowdb.data.cardMaker?.length);
  }
  else if (item.type === 'oropdf') {
    const beforeCount = lordStore.lowdb.data.oropdf?.length || 0;

    const removeGroup = (lordStore.lowdb.data.oropdf || []).filter((group: any) => {
      if (group.id !== item.id) return true;
      isDeleted = true;
      return false;
    });

    lordStore.lowdb.data.trashes = concat(lordStore.lowdb.data.trashes || [], {
      ...item.originalData,
      trashedBy: 'auto',
      isDeleted: false,
      deletedBy: null,
      deletedTime: null,
      trashedTime: Date.now(),
      sourceType: item.type,
    });

    lordStore.lowdb.data.oropdf = removeGroup;

    console.log('before count', beforeCount, 'after count', lordStore.lowdb.data.oropdf?.length);
  }

  if (isDeleted) {
    lordStore.saveLowDB();
    lordStore.reloadDatabase();
  }

  return isDeleted;
}

function onDelete(item: UnifiedHistoryItem): void {
  const isDeleted = deleteGroup(item);
  if (isDeleted) {
    toast.success('Item moved to trash.', {
      description: item.title,
    });
  } else {
    toast.error('Something went wrong.', {
      description: item.title,
    });
  }
}

function onDownload(item: UnifiedHistoryItem): void {
  console.log('onDownload', item)
  try {
    if (item.type === 'cardmaker') {
      // Download the merged output file
      const downloadData = {
        originalName: item.downloadFilename,
        filename: item.downloadFilename,
        destination: item.downloadPath,
        size: item.totalSize,
        path: item.downloadPath,
        type: 'cardmaker',
      };
      ipcRenderer.send('download-file', cloneDeep(downloadData));
    }
    else if (item.type === 'oropdf') {
      // For OROPDF, download the entire output directory (or zip it)
      const downloadData = {
        originalName: `oropdf_${item.id}.zip`,
        filename: `oropdf_${item.id}.zip`,
        destination: item.downloadPath,
        size: item.totalSize,
        path: item.downloadPath,
        type: 'oropdf',
      };
      ipcRenderer.send('download-file', cloneDeep(downloadData));
    }
    else {
      // Print item - single file download
      const downloadData = {
        originalName: item.originalData?.originalName || item.title,
        filename: item.downloadFilename,
        destination: item.downloadPath,
        size: item.totalSize,
        path: item.downloadPath,
        type: 'print',
      };
      ipcRenderer.send('download-file', cloneDeep(downloadData));
    }
  } catch (error) {
    console.error('Download error:', error);
    toast.error('Download failed', {
      description: item.title,
    });
  }
}

// IPC event handlers
ipcRenderer.on('download-success', (event, data) => {
  toast.success('Download completed successfully.', {
    description: data.originalName || data.filename,
  });
});

ipcRenderer.on('download-error', (event, data) => {
  toast.error('Download failed.', {
    description: data.originalName || data.filename,
  });
});

ipcRenderer.on('download-cancelled', (event, data) => {
  toast.info('Download cancelled.', {
    description: data.originalName || data.filename,
  });
});

ipcRenderer.on('conversion-success', (event, result) => {
  console.log('Converted images:', result);
});

ipcRenderer.on('conversion-error', (event, error) => {
  console.log(`Error: ${error}`);
});
</script>

<template lang="pug">
.tasks-view.container.w-100.py-8
  .check-files-exits(v-if="unifiedHistory.length")

    .table-options(class="dark:text-slate-300", v-if="unifiedHistory.length >= 11")
      p.inline-block.mr-3 Rows per page
      div.inline-block
        Select.bg-white.inline-block(
          v-model="numberOfColumnsToDisplay"
          default-value="10"
        )
          SelectTrigger
            SelectValue(placeholder="10") {{ numberOfColumnsToDisplay }}
          SelectContent
              SelectItem(value="10") 10
              SelectItem(value="20") 20
              SelectItem(value="30") 30
              SelectItem(value="40") 40
              SelectItem(value="50") 50

    .flex.flex-col.mt-6
      .-mx-4.-my-2.overflow-x-auto(class="sm:-mx-6 lg:-mx-8")
        .inline-block.min-w-full.py-2.align-middle( class="md:px-6 lg:px-8")
          .overflow-hidden.border.border-gray-200( class="dark:border-gray-700 md:rounded-lg")
            table.min-w-full.divide-y.divide-gray-200( class="dark:divide-gray-700" )

              thead.bg-gray-50(class="dark:bg-gray-800")
                tr
                  th.px-4.text-sm.font-normal.text-left(
                    scope="col"
                    class="py-3.5 rtl:text-right text-gray-500 dark:text-gray-400"
                  ) #
                  th.px-4.text-sm.font-normal.text-left.text-gray-500(
                    scope="col"
                    class="py-3.5 rtl:text-right dark:text-gray-400"
                  )
                    .flex.items-center.gap-x-3
                      input.hidden.text-blue-500.border-gray-300.rounded(
                        @click="selectAllItems"
                        :checked="isAllSelected"
                        type="checkbox"
                        class="dark:bg-gray-900 dark:ring-offset-gray-900 dark:border-gray-700"
                      )
                      span Item
                  th.px-4.text-sm.font-normal.text-left(
                    scope="col"
                    class="py-3.5 rtl:text-right text-gray-500 dark:text-gray-400"
                  ) Type
                  th.px-4.text-sm.font-normal.text-left(
                    scope="col"
                    class="py-3.5 rtl:text-right text-gray-500 dark:text-gray-400"
                  ) Date
                  th.px-4.text-sm.font-normal.text-left(
                    scope="col"
                    class="py-3.5 rtl:text-right text-gray-500 dark:text-gray-400"
                  ) Details
                  th.px-4.text-sm.font-normal.text-left(
                    scope="col"
                    class="py-3.5 rtl:text-right text-gray-500 dark:text-gray-400"
                  ) Added By
                  th.relative.px-4(
                    scope="col"
                    class="py-3.5"
                  )
                    span.sr-only Actions

              tbody.bg-white.divide-y.divide-gray-200( class="dark:divide-gray-700 dark:bg-gray-900")
                tr(v-if="unifiedHistory.length" v-for="item, i in pagination[currentPage]")
                  td.px-4.py-4.text-sm.text-gray-500.whitespace-nowrap(
                    class="dark:text-gray-300"
                  ) {{ ('0' + (((currentPage * +numberOfColumnsToDisplay) + i) + 1)).slice(-2) }}
                  
                  td.px-4.py-4.text-sm.font-medium.text-gray-700.whitespace-nowrap
                    .inline-flex.items-center.gap-x-3
                      input.hidden.text-blue-500.border-gray-300.rounded(
                        :value="item"
                        v-model="selectedItems"
                        type="checkbox"
                        class="dark:bg-gray-900 dark:ring-offset-gray-900 dark:border-gray-700"
                      )
                      .flex.items-center.gap-x-2
                        .flex.items-center.justify-center.w-8.h-8.text-blue-500.bg-blue-100.rounded-full(
                          class="dark:bg-gray-800"
                        )
                          svg.w-5.h-5(xmlns="http://www.w3.org/2000/svg", fill="none", viewBox="0 0 24 24", stroke-width="1.5", stroke="currentColor")
                            path(stroke-linecap="round", stroke-linejoin="round", d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z")
                        div
                          h2.font-normal.text-gray-800(
                            class="dark:text-white"
                          ) {{ displayFileName(item.title) }}
                          p.text-xs.font-normal.text-gray-500(
                            class="dark:text-gray-400"
                          )
                            | {{ item.fileCount }} file(s) • {{ humanFileSize(item.totalSize) }}
                            Badge.bg-green-400.uppercase.ml-1(
                              v-if="item.type === 'print' && item.originalData?.isPrinted"
                              class="py-0 px-1"
                              style="font-size:10px"
                            ) Printed
                            Badge.bg-yellow-500.uppercase.ml-1(
                              v-if="item.type === 'print' && item.originalData?.isPrinted === false"
                              class="py-0 px-1"
                              style="font-size:10px"
                            ) Pending

                  td.px-4.py-4.text-sm.whitespace-nowrap
                    Badge(:class="getSourceBadgeClass(item.type)" class="text-white px-2 py-1 rounded-full text-xs") {{ getSourceLabel(item.type) }}
                  
                  td.px-4.py-4.text-sm.text-gray-500.whitespace-nowrap(
                    class="dark:text-gray-300"
                  )
                    | {{ moment(item.addedTime).format('hh:mm A') }} <br/>
                    | {{ moment(item.addedTime).format('MMM D, YYYY') }}
                  
                  td.px-4.py-4.text-sm.text-gray-500.whitespace-nowrap(
                    class="dark:text-gray-300"
                  )
                    template(v-if="item.type === 'print'")
                      | Printer: {{ item.originalData?.printOptions?.printer || 'N/A' }}
                      br
                      | Pages: {{ item.originalData?.printOptions?.pages || 'all' }}
                    template(v-else-if="item.type === 'cardmaker'")
                      | Cards: {{ item.fileCount }}
                      br
                      | Type: {{ item.cardType || 'Multiple' }}
                    template(v-else)
                      | DPI: {{ item.dpi || 300 }}
                      span(v-if="item.pageCount")  • {{ item.pageCount }} pg(s)
                      br
                      | Format: {{ item.originalData?.options?.format || 'png' }}
                  
                  td.px-4.py-4.text-sm.text-gray-500.whitespace-nowrap(
                    class="dark:text-gray-300"
                  )
                    template(v-if="item.type === 'print'")
                      | {{ item.addedBy == lordStore.lowdb.data?.computerName ? `Self to ${item.addedTo == lordStore.lowdb.data?.computerName ? 'Self' : item.addedTo}` : item.addedBy }}
                    template(v-else-if='item.type == "oropdf"')
                      | {{ lordStore.lowdb.data?.computerName }}
                    template(v-else)
                      | {{ item.addedBy }}
                  
                  td.px-4.py-4.text-sm.whitespace-nowrap
                    DropdownMenu
                      DropdownMenuTrigger(as-Child)
                        button.px-1.py-1.text-gray-500.transition-colors.duration-200.rounded-lg(
                          class="dark:text-gray-300 hover:bg-gray-100"
                        )
                          svg.w-6.h-6(xmlns="http://www.w3.org/2000/svg", fill="none", viewBox="0 0 24 24", stroke-width="1.5", stroke="currentColor")
                            path(stroke-linecap="round", stroke-linejoin="round", d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z")
                      DropdownMenuContent(align="end" class="w-[160px]")
                        DropdownMenuLabel Actions
                        DropdownMenuSeparator
                        DropdownMenuItem(
                          class="hover:cursor-pointer" 
                          @click.prevent="onDownload(item)"
                        ) 
                          | Download
                          span.text-xs.text-gray-400.ml-1(v-if="item.type === 'cardmaker'") (.pdf)
                          span.text-xs.text-gray-400.ml-1(v-if="item.type === 'oropdf'") (.zip)
                        DropdownMenuItem(
                          class="hover:cursor-pointer" 
                          @click.prevent="onDelete(item)"
                        ) Move to Trash

    .flex.items-center.justify-between.mt-6
      a.flex.items-center.px-5.py-2.text-sm.text-gray-700.capitalize.transition-colors.duration-200.bg-white.border.rounded-md.gap-x-2.transition-all.cursor-pointer(
        class="hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800"
        @click.prevent="currentPage > 0 ? currentPage-- : null"
        :class="{invisible: currentPage <= 0 }"
      )
        svg.w-5.h-5(class="rtl:-scale-x-100" xmlns="http://www.w3.org/2000/svg", fill="none", viewBox="0 0 24 24", stroke-width="1.5", stroke="currentColor")
          path(stroke-linecap="round", stroke-linejoin="round", d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18")
        span previous

      .items-center(class="md:flex gap-x-3")
        a.px-2.py-1.text-sm.text-blue-500.rounded-md.cursor-pointer(
          @click.prevent="currentPage = page"
          :class=`{
            'dark:bg-gray-800 bg-slate-100/60 dark:text-slate-200': page == currentPage,
            'dark:hover:bg-gray-800 dark:text-gray-300 hover:bg-gray-100': page != currentPage
          }`
          v-for="page in paginationNumbers"
        ) {{ page + 1 }}

      a.flex.items-center.px-5.py-2.text-sm.text-gray-700.capitalize.transition-colors.duration-200.bg-white.border.rounded-md.gap-x-2.cursor-pointer(
        class="hover:bg-gray-100 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700 dark:hover:bg-gray-800"
        @click.prevent="currentPage < pagination.length - 1 ? currentPage++ : null"
        :class="{invisible: currentPage >= pagination.length -1 }"
      )
        span Next
        svg.w-5.h-5(class="rtl:-scale-x-100" xmlns="http://www.w3.org/2000/svg", fill="none", viewBox="0 0 24 24", stroke-width="1.5", stroke="currentColor")
          path(stroke-linecap="round", stroke-linejoin="round", d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3")
  
  div(v-else)
    .no-item-available-container
      h1.font-normal.text-gray-800.text-xl.text-center.my-16(
        class="dark:text-white"
      ) There is no history...
</template>