<script setup lang="ts">
//import libraries
import { ReloadIcon } from '@radix-icons/vue'


// import the Type
import type { Printer, localPrinter } from '../declarations/PrintersList';
import type { connectedPC } from './../declarations/LordStore.d'
import { ip_to_sequence, checkPing } from '../../helpers/both'

// Vue and its dependencies
import { ref, onMounted, toDisplayString } from 'vue';
import { useLordStore } from '../stores/LordStore';
import ip, { address } from 'ip'
import axios from 'axios'
import { last, uniq } from 'lodash'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './../components/ui/accordion'
import { Button as uiButton } from '../components/ui/button';


const lordStore = useLordStore()
console.log('lordStore', lordStore)

const refreshed = ref(false)
const numbersToRefresh = ref(10)
const initialVisit = ref(true)
const connectedPCs = ref<Array<connectedPC>>([])
const connectedPCSearching = ref(false)
const defaultAccordion = ref('')

async function loadComputers(force: boolean = false) {

  if (connectedPCSearching.value) return;

  if (force) {
    connectedPCs.value = []
    refreshed.value = true
    if ((!initialVisit.value) && refreshed.value) {
      numbersToRefresh.value = +numbersToRefresh.value + 5;
    }
  }


  connectedPCSearching.value = true;
  const params = new URLSearchParams({
    force: force ? 'yes' : 'no',
    numbersToRefresh: toDisplayString(numbersToRefresh.value),
  });
  const getConnectedPCs = await axios.get(`http://${ip.address()}:9457/api/v1/connected-pc?${params.toString()}`)
  console.log(getConnectedPCs)
  getConnectedPCs?.data?.sort((a: connectedPC) => a.ip == lordStore.db.ip ? -1 : 1)
  connectedPCs.value = getConnectedPCs?.data
  connectedPCSearching.value = false;
  initialVisit.value = false;

}

onMounted(loadComputers)

const isRefreshed = ref(false);
const isRefreshing = ref(false)
const ipCounts = ref(20)
const addresses = ref<Array<string>>([])
const onlineComputers = ref<string[]>([])

function getiplist() {
  isRefreshing.value = true;
  addresses.value = ip_to_sequence({ ip: '192.168.0.105', arraySize: isRefreshed.value ? +ipCounts.value + 10 : ipCounts.value })
  addresses.value.map(async (ip: any, i: any) => {
    axios.get(`http://${ip}:9457/api/v1/ping`)
      .then((expiresAt) => {
        onlineComputers.value.push(ip)
        onlineComputers.value = uniq(onlineComputers.value)
        console.log('checkPing : ', ip, ' : true')
        return true
      })
      .catch((err) => {
        console.log('checkPing : ', ip, ' : false')
        return false;
      }).finally(() => {
        if (last(addresses.value) == ip) {
          isRefreshing.value = false;
        }
      });
    console.log(`http://${ip}:9457/api/v1/ping`)
  })
  isRefreshed.value = true;
}

</script>


<template lang="pug">
    .connectedPC-container
      pre {{ onlineComputers }}

      .reload-button-container.mb-8(
        :class="{'cursor-not-allowed': connectedPCSearching}"
      )

        uiButton(
          @click="loadComputers(true)"
          variant="default"
          :disabled="connectedPCSearching"
        )
          ReloadIcon.w-4.h-4.mr-2.animate-spin.mr-1(v-if="connectedPCSearching")
          | {{ refreshed ? 'Again' : '' }}
          | {{ connectedPCSearching ? 'Refreshing...' : 'Refresh' }}

        uiButton(
          @click="getiplist()"
          :disabled="isRefreshing"
        )
          ReloadIcon.w-4.h-4.mr-2.animate-spin.mr-1(v-if="isRefreshing")
          New Refresh
      pre {{ isRefreshing }}

      Accordion(
        type="single" collapsible
        v-if="connectedPCs.length || initialVisit"
        :default-value="defaultAccordion"
        class="w-full sm:w-5/6 md:w-10/12 lg:w-8/12"
      )
        AccordionItem(
          v-for="item in (initialVisit ? lordStore.db.ConnectedPCs : connectedPCs )" :key="item?.id" :value="item?.ip"
        )
          AccordionTrigger(
            class="px-3 bg-slate-200 dark:bg-slate-800 dark:text-slate-100"
          )
            .flex.items-center
              span.inline-block.border-2.border-slate-400.rounded-full.w-4.h-4.mr-2(
                class="dark:border-slate-900  rtl:mr-2 rtl:ml-2"
                :class="[item.isConnected ? 'bg-green-400' : 'bg-red-600']"
              )
              span {{ item?.computerName }} {{ item?.ip == lordStore.db.ip ? '(My PC)' : '' }}
          AccordionContent(
            class="px-3 py-4 bg-slate-100 dark:bg-slate-700 dark:text-slate-300"
          )
            p.text-sm.text-stone-800(class="dark:text-stone-300") Computer Name : {{ item?.computerName }}
            p.text-sm.text-stone-800(class="dark:text-stone-300") Computer IP : {{ item?.ip }}
            p.text-sm.text-stone-800(v-if="item?.lastPrinted") {{ item?.lastPrinted }}
            hr.my-5.border-slate-800.m-auto(class="w-2/3 dark:border-slate-100")

            ol.list-decimal.printers-list.list-inside(v-if="item?.printers && !connectedPCSearching")
              li.pb-1(
                v-for="printer in item.printers"
              )
                span(:class="{'text-slate-700 font-bold dark:text-slate-200':  printer.name == item.printersDefault.name}")
                  | {{ printer.name }} {{ printer.name == item.printersDefault.name ? ' : Default' : ''}}
                // span.text-xs.block.mt-1.ml-4.text-stone-800(v-if="printer.paperSizes.length")
                //   | Supported Size(s) -
                //   | {{ Array.isArray(printer.paperSizes) ? printer.paperSizes.map((el, i) => '"' + el + '"').join(', ') : printer.paperSizes }}

      .searching-connected-pc.text-center(v-else)
        h1.text-slate-600(class="dark:text-slate-300") Searching Connected PCs......


</template>
