<template lang="pug">
Toaster(class="pointer-events-auto" :expand="true" )
.app
  Sidebar
  .ml-64.min-h-screen.flex.flex-col
    Header
    main.flex-1.flex.justify-between.flex-col.bg-white
      .router-container.container.my-3.flex-1
        <router-view v-if="ip.address() != '127.0.0.1'"/>
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

import { ipcRenderer } from 'electron';


const router = useRouter()
const route = useRoute()
const isAlertOpen = ref(false);

if (route.path == '/') {
  router.push('/home')
}

onMounted(() => {
  axios.get('https://motionprinter.pages.dev/info.json').then(async (response) => {
    console.log('[App.vue] .... ... .',)

    if (compare(response.data.version, await ipcRenderer.invoke('version') as string, '>')) {
      console.log('New version available...')
      isAlertOpen.value = true;
    }
  })
})

console.log('[App.vue]', `App.vue End`);
</script>
