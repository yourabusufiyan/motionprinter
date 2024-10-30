<script lang="ts" setup>
import moment from 'moment'
import { chunk, fill, sortBy } from 'lodash'
import { ref, computed, reactive } from 'vue'

import { useLordStore } from '../stores/LordStore';
import { humanFileSize } from './../utils/short-functions'

import type { $toPrintsCommandsFile, $lordData } from './../declarations'


import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './../components/ui/select'

const lordStore = useLordStore();
const numberOfColumnsToDisplay = ref(10)
const pagination = computed<$toPrintsCommandsFile[][]>(() => chunk(sortBy(lordStore.db?.toPrintsCommands, ['addedTime']).toReversed(), numberOfColumnsToDisplay.value))
const currentPage = ref(0)
const paginationNumbers = computed(() => {

  if (pagination.value.length <= 7)
    return fill(Array(pagination.value.length), 'a').map((el, i) => i);

  if (currentPage.value <= 4) {
    return fill(Array(7), 'a').map((el, i) => i)
  } else if (currentPage.value >= pagination.value.length - 4) {
    return fill(Array(pagination.value.length), 'a').splice(0, 7).map((el, i) => pagination.value.length - 1 - i).sort()
  } else {
    return [-3, -2, -1, 0, 1, 2, 3].map(el => currentPage.value + Number(el));
  }

})

let selectedItems = ref<$toPrintsCommandsFile[]>([])
const isAllSelected = computed<boolean>(() => selectedItems.value.length == numberOfColumnsToDisplay.value)

function selectAllItems() {
  console.log("selectAllItems")
  if (isAllSelected.value) {
    console.log("isAllSelected is true", isAllSelected.value)
    selectedItems.value = []
  } else {
    console.log("isAllSelected", isAllSelected.value, pagination.value[currentPage.value])
    selectedItems.value = pagination.value[currentPage.value]
  }
}

function displayFileName(fileNames: string) {
  var leftRightStrings = fileNames.split('.');
  var fName = leftRightStrings[0];
  var fExtension = leftRightStrings[1];
  var lengthFname = fName.length;
  //if file name without extension contains more than 15 characters
  if (lengthFname > 40) {
    return fName.substr(0, 26) + " ..... " + fName.substr(-4) + "." + fExtension;
  }
  return fileNames
}


onMounted(() => {
  lordStore.reloadDatabase()
})

</script>

<template lang="pug">
.tasks-view
  .check-files-exits(v-if="lordStore.db?.toPrintsCommands?.length")

    .table-options(class="dark:text-slate-300", v-if="lordStore.db?.toPrintsCommands?.length >= 11")
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
              SelectItem(value="20" v-if="lordStore.db?.toPrintsCommands?.length > 21") 20
              SelectItem(value="30" v-if="lordStore.db?.toPrintsCommands?.length > 31") 30
              SelectItem(value="40" v-if="lordStore.db?.toPrintsCommands?.length > 41") 40
              SelectItem(value="50" v-if="lordStore.db?.toPrintsCommands?.length > 51") 50


    .flex.flex-col.mt-6
      .-mx-4.-my-2.overflow-x-auto(class="sm:-mx-6 lg:-mx-8")
        .inline-block.min-w-full.py-2.align-middle( class="md:px-6 lg:px-8")
          .overflow-hidden.border.border-gray-200( class="dark:border-gray-700 md:rounded-lg")
            table.min-w-full.divide-y.divide-gray-200( class="dark:divide-gray-700" )

              thead.bg-gray-50(class="dark:bg-gray-800")
                tr

                  th.px-4.text-sm.font-normal.text-left(
                    scope="col"
                    class=".py-3.5 rtl:text-right text-gray-500 dark:text-gray-400"
                  ) #

                  th.px-4.text-sm.font-normal.text-left.text-gray-500(
                    scope="col"
                    class="py-3.5 rtl:text-right dark:text-gray-400"
                  )
                    .flex.items-center.gap-x-3
                      input.hidden.text-blue-500.border-gray-300.rounded(
                        @click="selectAllItems(pagination[currentPage])"
                        :checked="isAllSelected"
                        type="checkbox"
                        class="dark:bg-gray-900 dark:ring-offset-gray-900 dark:border-gray-700"
                      )
                      span File name

                  th.px-4.text-sm.font-normal.text-left(
                    scope="col"
                    class=".py-3.5 rtl:text-right text-gray-500 dark:text-gray-400"
                  )
                    | Printed Date

                  th.px-4.text-sm.font-normal.text-left(
                    scope="col"
                    class=".py-3.5 rtl:text-right text-gray-500 dark:text-gray-400"
                  )
                    | Printer

                  th.px-4.text-sm.font-normal.text-left(
                    scope="col"
                    class=".py-3.5 rtl:text-right text-gray-500 dark:text-gray-400"
                  )
                    | Added by

                  th.relative.px-4(
                    scope="col"
                    class="py-3.5"
                  )
                    span.sr-only Edit

              tbody.bg-white.divide-y.divide-gray-200( class="dark:divide-gray-700 dark:bg-gray-900")

                tr(v-if="lordStore?.db?.toPrintsCommands" v-for="tr, i in pagination[currentPage]")

                  td.px-4.py-4.text-sm.text-gray-500.whitespace-nowrap(
                    class="dark:text-gray-300"
                  ) {{ i < 9 ? '0' + (i + 1) : i + 1 }}

                  td.px-4.py-4.text-sm.font-medium.text-gray-700.whitespace-nowrap
                    .inline-flex.items-center.gap-x-3
                      input.hidden.text-blue-500.border-gray-300.rounded(
                        :value="tr"
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
                          ) {{ displayFileName(tr.originalName) }}
                          p.text-xs.font-normal.text-gray-500(
                            class="dark:text-gray-400"
                          ) {{ humanFileSize(tr.size) }}

                  td.px-4.py-4.text-sm.text-gray-500.whitespace-nowrap(
                    class="dark:text-gray-300"
                  )
                    | {{ moment(tr.addedTime).format('hh:mm A') }} <br/>
                    | {{ moment(tr.addedTime).format('MMM D, YYYY') }}

                  td.px-4.py-4.text-sm.text-gray-500.whitespace-nowrap(
                    class="dark:text-gray-300"
                  ) {{ tr?.printOptions?.printer || '' }}

                  td.px-4.py-4.text-sm.text-gray-500.whitespace-nowrap(
                    class="dark:text-gray-300"
                  ) {{ tr?.addedBy || '' }}

                  td.px-4.py-4.text-sm.whitespace-nowrap
                    button.px-1.py-1.text-gray-500.transition-colors.duration-200.rounded-lg(
                      class="dark:text-gray-300 hover:bg-gray-100"
                    )
                      svg.w-6.h-6(xmlns="http://www.w3.org/2000/svg", fill="none", viewBox="0 0 24 24", stroke-width="1.5", stroke="currentColor")
                        path(stroke-linecap="round", stroke-linejoin="round", d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z")

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
  div(v-if="!lordStore.db?.toPrintsCommands?.length")
    .no-item-available-container
      h1.font-normal.text-gray-800.text-xl.text-center.my-16(
        class="dark:text-white"
      ) There is no history...

</template>