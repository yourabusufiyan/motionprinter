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
        a(:href="DownloadLink" target="_blank") Download Now

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
import { uniq, forEach, toString } from 'lodash';

import { ipcRenderer } from 'electron';
import { useLordStore } from './stores/LordStore';

const DownloadLink = ref('https://motionprinter.pages.dev/')
const lordDB = useLordStore()
const router = useRouter()
const route = useRoute()
const isAlertOpen = ref(false);

if (route.path == '/') {
  router.push('/home')
}

onMounted(async () => {
  axios.get('https://api.github.com/repos/yourabusufiyan/motionprinter/releases/latest').then(async (response) => {
    const data = response.data
    console.log('motionprinter from info.json');
    if (compare(toString(data.tag_name.slice(1)), toString(await ipcRenderer.invoke('version')), '>')) {
      console.log('New version available...')
      DownloadLink.value = data.assets[0].browser_download_url;
      isAlertOpen.value = true;
    }
  })
})


ipcRenderer.on("notification", (e, data) => {
  toast(data.msg)
  console.log('Got notification from Main Process ', data)
})

ipcRenderer.on("reloadDatabase", (e, data) => {
  lordDB.reloadDatabase()
})

console.log('[App.vue]', `App.vue End`);
</script>
