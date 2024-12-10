<template lang="pug">
Toaster(class="pointer-events-auto" :expand="false" richColors)
.app
  Sidebar
  .ml-64.min-h-screen.flex.flex-col
    Header
    main.flex-1.flex.justify-between.flex-col.bg-white
      .router-container.container.my-3.flex-1
        <router-view v-if="ip.address() != '127.0.0.1' "/>
        .min-h-full.w-full(v-else)
          p.flex-1 You are not connected to any network
      Footer

AlertDialog(v-model:open="isAlertOpen")
  AlertDialogContent
    AlertDialogHeader
      AlertDialogTitle New version of MotionPrinter available.
      AlertDialogDescription
        | Get new features to install newest version of MotionPrinter
    AlertDialogFooter
      AlertDialogCancel Later
      AlertDialogAction
        a(href="https://motionprinter.pages.dev/" target="_blank") Download Now

</template>

<script setup lang="ts">
console.log('[App.vue]', `Hello world from Electron ${process.env.npm_package_version}!`);
console.log('[App.vue]', `App.vue started successfully`);

import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
import Footer from '@/components/Footer.vue';

import { Toaster } from '@/components/ui/sonner'
import { toast } from 'vue-sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog/'
import { Button } from '@/components/ui/button'

import { useRouter, useRoute } from 'vue-router'
import { onMounted, ref } from 'vue'
import axios from 'axios';
import ip from 'ip'
import { compare } from 'compare-versions';
import { uniq, forEach } from 'lodash';

import { ipcRenderer } from 'electron';
import { useLordStore } from './stores/LordStore';

import { ip_to_sequence, sleep } from './../helpers/both'


const router = useRouter()
const route = useRoute()
const isAlertOpen = ref(false);

if (route.path == '/') {
  router.push('/home')
}

onMounted(() => {
  axios.get('https://motionprinter.pages.dev/info.json').then(async (response) => {
    console.log('[App.vue] .... ... .',)

    if (compare(response.data.version || '1.0.0', await ipcRenderer.invoke('version') as string, '>')) {
      console.log('New version available...')
      isAlertOpen.value = true;
    }
  })
})


const isFirstLoop = ref(true);
const addresses = ref<string[]>([])
const addressesProcessing = ref<string[]>([])
const onlineAddresses = ref<{ [key: string]: string }>({})

const lordDB = useLordStore()

addresses.value = ip_to_sequence({ ip: ip.address(), arraySize: 50 })

setTimeout(async function () {
  while (true) {

    if (ip.address() == '127.0.0.1') break;
    addresses.value = uniq(addresses.value)

    addresses.value.map(async (ip: string, i: any) => {

      if (ip in addressesProcessing || ip in Object.keys(onlineAddresses.value)) return;

      addressesProcessing.value.push(ip)
      axios.get(`http://${ip}:9457/api/v1/ping`, { timeout: 3000 })
        .then((res: any) => {
          console.log('[App.vue] Ping response from', ip, res.data)
          if (!onlineAddresses.value[ip]?.length) {
            onlineAddresses.value[ip] = res.data as string;
            if (!isFirstLoop.value) {
              toast.success(`${res.data} is online now.`)
            }
          }
        })
        .catch((error) => {
          console.log('');
        })
        .finally(() => {
          addressesProcessing.value = addressesProcessing.value.filter(el => el != ip);
        })

    })

    await sleep(10_000)
    isFirstLoop.value = true
  }
}, 10_000)


setTimeout(async function () {
  while (true) {
    for (const [ip, computerName] of Object.entries(onlineAddresses.value)) {
      axios.get(`http://${ip}:9457/api/v1/ping`, { timeout: 3000 })
        .catch(() => {
          delete onlineAddresses.value[ip];
          toast.error(`${computerName} is offline.`)
        })
    }
    await sleep(5_000)
  }
}, 5_000)


async function testmain() {
  ipcRenderer.send('searchOnlinePCs')
}

ipcRenderer.on("eventFromMain", (e, data) => {
  console.log("data from main process: " + data);
})

console.log('[App.vue]', `App.vue End`);
</script>
