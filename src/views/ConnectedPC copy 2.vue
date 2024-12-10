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

onMounted(loadComputers)

const isRefreshed = ref(false)
const isRefreshing = ref(false)
const ipCounts = ref(50)
const addresses = ref<Array<string>>([])
const onlineComputers = ref<string[]>([])
const onlineComputersData = ref<any>({})
const defaultAccordion = ref('')

function loadComputers() {
  isRefreshing.value = true;
  onlineComputers.value = []
  onlineComputersData.value = {}
  addresses.value = ip_to_sequence({ ip: '192.168.0.105', arraySize: isRefreshed.value ? +ipCounts.value + 10 : ipCounts.value })
  addresses.value.map(async (ip: any, i: any) => {
    axios.get(`http://${ip}:9457/api/v1/ping`)
      .then((res) => {
        let name = res.data as string;
        onlineComputers.value.push(ip)
        onlineComputersData.value[name] = {}
        //@ts-ignore
        onlineComputersData.value[name]['isConnected'] = true
        //@ts-ignore
        onlineComputersData.value[name]['lastSeen'] = true
        //@ts-ignore
        onlineComputersData.value[name]['ip'] = ip
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

function loadComputerProfile() {

}

</script>


<template lang="pug">
    .connectedPC-container
      pre {{ onlineComputers }}

      .reload-button-container.mb-8(
        :class="{'cursor-not-allowed': isRefreshing}"
      )

        uiButton(
          @click="loadComputers(true)"
          variant="default"
          :disabled="isRefreshing"
        )
          ReloadIcon.w-4.h-4.mr-2.animate-spin.mr-1(v-if="isRefreshing")
          | {{ isRefreshing ? 'Refreshing...' : 'Refresh' }}

      Accordion(
        type="single" collapsible
        v-if="onlineComputers.length"
        :default-value="defaultAccordion"
        class="w-full sm:w-5/6 md:w-10/12 lg:w-8/12"
      )
        AccordionItem(
          @click="loadComputerProfile"
          :key="onlineComputer?.ip"
          :value="onlineComputer?.name"
          v-for="(onlineComputer, name) in onlineComputersData"
        )
          AccordionTrigger(
            class="px-3 bg-slate-200 dark:bg-slate-800 dark:text-slate-100"
          )
            .flex.items-center
              span.inline-block.border-2.border-slate-400.rounded-full.w-4.h-4.mr-2(
                class="dark:border-slate-900  rtl:mr-2 rtl:ml-2"
                :class="[onlineComputer.isConnected ? 'bg-green-400' : 'bg-red-600']"
              )
              span {{ name }} {{ name == lordStore.db.computerName ? '(You)' : '' }}
          AccordionContent(
            class="px-3 py-4 bg-slate-100 dark:bg-slate-700 dark:text-slate-300"
          )
            p.text-sm.text-stone-800(class="dark:text-stone-300") Computer Name : {{ name }}
            p.text-sm.text-stone-800(class="dark:text-stone-300") Computer IP : {{ onlineComputer?.ip }}
            p.text-sm.text-stone-800(v-if="item?.lastPrinted") {{ item?.lastPrinted }}
            hr.my-5.border-slate-800.m-auto(class="w-2/3 dark:border-slate-100")

      .searching-connected-pc.text-center(v-else)
        h1.text-slate-600(class="dark:text-slate-300") Searching Connected PCs......

    pre {{ onlineComputersData }}
</template>
