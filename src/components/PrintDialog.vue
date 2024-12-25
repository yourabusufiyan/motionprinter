<script setup lang="ts">
import { Button as uiButton } from '@/components/ui/button'
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue, } from '@/components/ui/select'
import { NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, } from '@/components/ui/number-field'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog'
import { toast } from 'vue-sonner'


import { useLordStore } from '@/stores/LordStore';
import { ref, computed, onMounted, watch } from 'vue'
import { find, size, isNumber } from 'lodash'
import { ChevronDownIcon, MinusIcon, PlusIcon } from '@radix-icons/vue'
import axios from 'axios'
import { VuePDF, usePDF } from '@tato30/vue-pdf'

import type { connectedPC } from '@/declarations/LordStore'

import '@tato30/vue-pdf/style.css'

const lordStore = useLordStore()

const computersList = computed(() => lordStore.db.ConnectedPCs)
const selectedComputer = ref('')
const selectedComputerData = computed(() => find(lordStore.db.ConnectedPCs, ['ip', selectedComputer.value]))

const printerList = computed(() => selectedComputerData.value?.printers || [])
const selectedPrinter = ref('')
const selectedPrinterData = computed(() => find(selectedComputerData.value?.printers, ['deviceId', selectedPrinter.value]))


const copies = ref(1)
const pages = ref('all')
const customPages = ref('')
const colorMode = ref('black_and_white')
const paperSizes = ref('A4')
const paperSizesData = computed(() => {
  let o: { [property: string]: string } = {
    ...{
      "A2": "A2",
      "A6": "A6",
      "A3": "A3",
      "A4": "A4",
      "A5": "A5",
      "letter": "Letter",
      "legal": "Legal",
      "tabloid": "Tabloid",
      "statement": "Statement",
    },
    ...selectedPrinterData.value?.paperSizes?.reduce((a, v) => ({ ...a, [v]: v }), {})
  }
  return Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {} as { [property: string]: string })
})
const scale = ref('fit')
const customScale = ref(100)
const paperPerSheet = ref('1')
const margin = ref('default')
const towSidedPrinting = ref('simplex')

const isDialogOpen = ref(false)
const fileInput = ref<any>(null) // for resetting the file input only
const file = ref() // for storing the file data
const isFileUploading = ref(false)
const isFileUploaded = ref(false)
const uploadFiled = ref({}) // storing the uploaded file responded data
const pdfBuffer = ref('')
const { pdf, pages: pdfPages, info } = usePDF(pdfBuffer)
const isRangeValid = ref(true)
const rangeErrorMessage = ref('Number should be under the range.')


// I do not have know about Event type. that why i assigned it to :any
function handleFileUpload(event: any) {

  console.log(event)

  isDialogOpen.value = true

  if (event?.target?.files && event.target.files[0]) {

    console.log(event?.target?.files[0]?.type)

    file.value = event.target.files[0]
    const reader = new FileReader();

    reader.onload = function (e) {
      console.log('e.target.result', typeof e?.target?.result)
      if (e?.target?.result) {
        pdfBuffer.value = e?.target?.result as string;
      }
    };

    reader.readAsDataURL(event.target.files[0]);

  }

}

function commandToPrint(filename: string = '') {

  const options = {
    printer: selectedPrinter.value,
    pages: pages.value == 'all' ? 'all' : pages.value == 'custom' ? customScale.value : '',
    // @ts-expect-error : here we want pages value to be even or odd only
    subset: pages.value == 'odd' && pages.value == 'even' ? pages.value : '',
    monochrome: colorMode.value != 'color',
    paperSize: paperSizes.value,
    scale: scale.value,
    silent: true,
    printDialog: false,
    side: towSidedPrinting.value,
    copies: +copies.value
  }

  axios.post(`http://${selectedComputerData.value?.ip}:9457/api/v1/print/`, { filename, options }, {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  }).then((response) => {
    if (response.data?.print == 'successful') {
      console.log('Print successful')
      if (file.value?.name) {
        toast.success('Printed' + (selectedComputerData.value?.computerName ? ' from ' + selectedComputerData.value.computerName : '...'), {
          description: file.value?.name
        })
      }
    } else {
      toast.error('Something went wrong...', {
        description: file.value?.name
      })
    }
    isDialogOpen.value = false
    if (fileInput.value?.value) {
      fileInput.value.value = ''
    } else {
      fileInput.value.value = null
    }
    file.value = null
    isFileUploading.value = false
    isFileUploaded.value = false
    uploadFiled.value = {}
    pdfBuffer.value = ''
    console.log('commandToPrint : ', response.data)
  }).catch((err: any) => {
    console.log('commandToPrint : ', err)
  })
}

function handlePrint() {

  if (size(file)) {

    console.log('handlePrint - file : ', selectedComputerData)

    isDialogOpen.value = false

    toast.info('Printing' + (selectedComputerData.value?.computerName ? ' to ' + selectedComputerData.value.computerName : '...'), {
      description: file.value?.name ? file.value?.name : ''
    })

    isFileUploading.value = true

    console.log('handlePrint', file.value)

    var formData = new FormData();
    console.log('file.value', file.value)
    formData.append("sampleFile", file.value);
    if (lordStore.db?.computerName) {
      formData.append("addedBy", lordStore.db.computerName);
    }
    if (selectedComputerData.value?.ip != undefined) {

      axios.post(`http://${lordStore.db.ip}:9457/api/v1/upload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).catch(e => e = !e)

      axios.post(`http://${selectedComputerData.value.ip}:9457/api/v1/upload/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }).then((response) => {
        isFileUploaded.value = true;
        uploadFiled.value = response.data
        console.log('uploaded : ', response.data)
        commandToPrint(response.data.filename)
      }).catch(() => {
        toast.error('Something went wrong...')
        isFileUploaded.value = false;
        console.log('Not uploaded')
      })
    }
  } else {
    toast.warning('No file selected.')
    console.log('No file selected', file.value, size(file))
  }

}

function handleCancel() {
  isDialogOpen.value = false
  if (fileInput.value?.value) {
    fileInput.value.value = ''
  } else {
    fileInput.value = null
  }
  file.value = null
  isFileUploading.value = false
  isFileUploaded.value = false
  uploadFiled.value = {}
  pdfBuffer.value = ''
}

function isRangeValidation() {

  let o = customPages.value || '';
  let max = isNumber(pdfPages.value) ? pdfPages.value : 100
  console.log(o.split(','))

  isRangeValid.value = typeof o == 'string'
    && o.split(',').every(el => {

      el = el.trim()
      console.log('Every : ', el)

      if (el.includes('-')) {
        let range = el.split('-')
        // console.log('range : ',  el, +el[0] < +el[1], el.every(el => +el > 0 && +el <= max ) )

        // if (+range[0] > +range[1]) {
        //   rangeErrorMessage.value = 'The “from” page number must be smaller than the “to” page number.'
        // } else if (range.every(el => +el > 0 && +el <= max)) {
        //   rangeErrorMessage.value = 'Range must be a number between 1 and ' + max + '.'
        // }

        return +range[0] < +range[1] && range.every(el => +el > 0 && +el <= max)
      }

      if (isNumber(+el)) {
        // console.log('Number : ', +el > 0 && +el <= max)
        return +el > 0 && +el <= max
      }

      return false;

    })
}

onMounted(async () => {


  if (lordStore.db.ConnectedPCs?.length == 1) {
    selectedComputer.value = lordStore.db.ConnectedPCs[0]?.ip ? lordStore.db.ConnectedPCs[0]?.ip : ''
    selectedPrinter.value = lordStore.db.ConnectedPCs[0]?.printersDefault?.deviceId ? lordStore.db.ConnectedPCs[0]?.printersDefault?.deviceId : ''
  }

})

</script>

<template lang="pug">
.upload-container.border.border-dash.border-gray-200.my-16.bg-gray-50(
  class="hover:border-gray-300 hover:bg-gray-100"
)
    form#uploadForm(
      role="form",
      method="post",
      enctype="multipart/form-data"
    )
      .w-full.text-center
        p.block.py-16.w-full.cursor-not-allowed(v-if="isFileUploading") Processing to print the file....
        label.block.py-16.w-full.cursor-pointer(
          for="sampleFile"
          v-else
        ) Choose a File to Print
        input#sampleFile.hidden(
          ref="fileInput"
          name="sampleFile"
          type="file"
          accept=".pdf"
          @change="handleFileUpload( $event )"
        )

Dialog(v-model:open="isDialogOpen")

  DialogContent(
    class="p-0 w-[90dvw] max-w-7xl h-[90dvh] max-h-xl rounded-none sm:rounded-none"
  )
    DialogHeader.p-6.pb-0.hidden
      DialogTitle Edit profile
      DialogDescription
        | Make changes to your profile here. Click save when you're done.
      DialogClose(aria-label="Close")
        span(aria-hidden) x
    .dialog-content-wrapper(
      class="grid gap-4 overflow-y-auto"
    )
        .flex.justify-between.max-w-full.max-w-full.overflow-hidden

          .preview-content-container.overflow-auto.bg-neutral-300.w-full
            .preview-content.flex.justify-center.my-4.shadow-sm.flex-col.items-center
              pre.hidden {{ pages == 'custom' ? 'df' : true }}
              pre.hidden selectedComputer : {{ selectedComputer }}
              pre.hidden selectedComputerData.length : {{ selectedComputerData?.computerName }}
              pre.hidden selectedPrinter : {{ selectedPrinter }}
              pre.hidden printerList  : {{ printerList?.length }}
              div(v-for="page in pdfPages" :key="page")
                VuePDF.mb-4(:pdf="pdf" :page="page" text-layer ref="el")
                  p Loadings the Document.....

          .options-content-container.min-w-52.mt-0.border-l-2.flex.justify-between.flex-col(
            class="md:min-w-60 lg:min-w-64 xl:min-w-64"
          )
            .options-title-container.p-2.pb-0.flex.justify-between.w-full
              h1.title.text-xl Print
              p.text-right {{ pdfPages }} page(s)
            .border-t.mx-3.my-1.mt-2.border-gray-400

            .max-h-screen.overflow-y-auto.flex-1
              .computer-select-container.block.p-2
                p.text-sm.text-black.mb-2 Computers
                Select(v-model="selectedComputer")
                  SelectTrigger(class='w-[180px] bg-gray-100')
                    SelectValue(placeholder='Select a Computer')
                  SelectContent
                      SelectItem(
                        v-if="lordStore.db?.ConnectedPCs?.length"
                        v-for="computer in lordStore.db.ConnectedPCs"
                        :value="computer.ip"
                        class="text-sm"
                      ) {{ computer.computerName }} {{ computer.isConnected ? '' : ' : Offline' }}

              .printer-select-container.block.p-2( v-if="selectedComputer" )
                p.text-sm.text-black.mb-2 Printers
                Select(v-model="selectedPrinter")
                  SelectTrigger(class='w-[180px] bg-gray-100')
                    SelectValue(placeholder='Select a Printer')
                  SelectContent
                      SelectItem(
                        v-if="printerList?.length"
                        v-for="printer in printerList"
                        :value="printer.deviceId"
                      ) {{ printer.name }} {{ printer.name == selectedComputer?.printersDefault?.name ? ' : Default' : ''}}

              .copies-select-container.block.p-2
                Label.text-sm.text-black.mb-2.block.font-normal Copies
                NumberField.w-20(
                  v-model="copies"
                  :min="1"
                  :max="100"
                  :step="1"
                )
                  NumberFieldContent
                    NumberFieldDecrement(class="p-3")
                      MinusIcon.h-3.w-3
                    NumberFieldInput(class="py-2 px-1 h-9 w-24")
                    NumberFieldIncrement(class="p-3")
                      PlusIcon.h-3.w-3

              .pages-select-container.block.p-2
                p.text-sm.text-black.mb-2 Pages
                Select(v-model="pages")
                  SelectTrigger(class='w-[180px] bg-gray-100')
                    SelectValue(placeholder='Select a page(s)')
                  SelectContent
                    SelectItem( value="all" ) All
                    SelectItem( value="odd" ) Odd
                    SelectItem( value="even" ) Even
                    SelectItem( value="custom" ) Custom
                Input(
                  type="text",
                  v-model="customPages",
                  @input="isRangeValidation()"
                  v-if="pages == 'custom'",
                  placeholder="3,6,4,1 | 1-10 | 1-3,6-9"
                )
                p.font-medium.text-red-500.mt-1(
                  class="text-[0.8rem]"
                  v-if="!isRangeValid && pages == 'custom'"
                ) {{ rangeErrorMessage }}

              .colorMode-select-container.block.p-2
                p.text-sm.text-black.mb-2 Color Mode
                Select(v-model="colorMode" default-value="black_and_white")
                  SelectTrigger(class='w-[180px] bg-gray-100')
                    SelectValue(placeholder='Select a Printer')
                  SelectContent
                      SelectItem( value="color" ) Color
                      SelectItem( value="black_and_white" ) Black and White

              .border-t.mt-2.border-gray-400( class="w-[90%] mx-auto" )

              Accordion(type="single" collapsible)
                AccordionItem( value="item-1"  class="border-none" )
                  AccordionTrigger(
                    class="max-w-[90%] mx-auto"
                  ) More Settings
                  AccordionContent

                    .paperSizes-select-container.block.p-2
                      p.text-sm.text-black.mb-2 Paper Size
                      Select(v-model="paperSizes" default-value="a4")
                        SelectTrigger(class='w-[180px] bg-gray-100')
                          SelectValue(placeholder='Select a Printer')
                        SelectContent
                            SelectItem( v-for="(value, key) in paperSizesData" :key="key" :value="key" ) {{ value }}

                    .scale-select-container.block.p-2
                      p.text-sm.text-black.mb-2 Scale
                      RadioGroup( v-model="scale" default-value="fit")
                        .flex.items-center.space-x-2
                          RadioGroupItem#fit(value="fit")
                          label.cursor-pointer(for="fit") Fit to page width
                        .flex.items-center.space-x-2
                          RadioGroupItem#shrink(value="shrink")
                          label.cursor-pointer(for="shrink") Shrink
                          NumberField.hidden(
                            v-if="scale == 'scale'"
                            v-model="customScale"
                            id="customScale"
                            :min="0"
                            :max="1000"
                            :step="1"
                            class="text-sm"
                          )
                            NumberFieldContent
                              NumberFieldDecrement(class="p-1 py-2")
                                MinusIcon.h-3.w-3
                              NumberFieldInput(class="py-0 px-1 h-7 w-20")
                              NumberFieldIncrement(class="p-1 py-2")
                                PlusIcon.h-3.w-3

                        .flex.items-center.space-x-2
                          RadioGroupItem#noscale(value="noscale")
                          label.cursor-pointer(for="noscale") No scale

                    .pagePerSheet-select-container.block.p-2
                      p.text-sm.text-black.mb-2 Paper per sheet
                      Select(v-model="paperPerSheet", defaultValue="1")
                        SelectTrigger(class='w-[180px] bg-gray-100')
                          SelectValue(placeholder='Paper per sheet')
                        SelectContent
                            SelectItem( value="1" ) 1
                            SelectItem( value="2" ) 2
                            SelectItem( value="4" ) 4
                            SelectItem( value="6" ) 6
                            SelectItem( value="9" ) 9
                            SelectItem( value="16" ) 16

                    .margin-select-container.block.p-2.hidden
                      p.text-sm.text-black.mb-2 Margin
                      Select(v-model="margin", defaultValue="default")
                        SelectTrigger(class='w-[180px] bg-gray-100')
                          SelectValue(placeholder='Select a Printer')
                        SelectContent
                            SelectItem( value="default" ) Default
                            SelectItem( value="minimum" ) Minimum
                            SelectItem( value="none" ) None
                            SelectItem( value="custom" ) Custom (mm)

                    .towSidedPrinting-select-container.block.p-2
                      p.text-sm.text-black.mb-2 Two-sided printing
                      Select(v-model="towSidedPrinting", defaultValue="simplex")
                        SelectTrigger(class='w-[180px] bg-gray-100')
                          SelectValue(placeholder='Paper per sheet')
                        SelectContent
                            SelectItem( value="simplex" ) Off
                            SelectItem( value="duplexlong" ) Flip on long edge
                            SelectItem( value="duplexshort" ) Flip on short edge

            .bottom-0.bg-white.width-full.max-w-full
              .button-container.flex.justify-end.gap-3.p-3.bg-white.border-t.border-1
                uiButton( class="md:px-8" @click="handlePrint()" :disabled="pages == 'custom' ? !isRangeValid : !true" ) Print
                uiButton( variant="secondary" class="md:px-8" @click="handleCancel()" ) Cancel

</template>
