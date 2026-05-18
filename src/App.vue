<template lang="pug">
Toaster(class="pointer-events-auto" :expand="false" richColors)
.app
  Sidebar
  .ml-64.flex.flex-col
    main.bg-white.min-h-screen(class="dark:bg-slate-950")
      <router-view/>

AlertDialog(v-model:open="isAlertOpen")
  AlertDialogContent
    AlertDialogHeader
      AlertDialogTitle New version of OroPrinter available.
      AlertDialogDescription
        | Get new features to install newest version of OroPrinter
    AlertDialogFooter
      AlertDialogCancel Later
      AlertDialogAction
        a(:href="DownloadLink" target="_blank") Download Now

</template>

<script setup lang="ts">
console.log(
  '[App.vue]',
  `Hello world from Electron ${process.env.npm_package_version}!`,
);
console.log('[App.vue]', `App.vue started successfully`);

import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
import Footer from '@/components/Footer.vue';

import { Toaster } from '@/components/ui/sonner';
import { toast } from 'vue-sonner';
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
} from '@/components/ui/alert-dialog/';
import { Button } from '@/components/ui/button';

import { useRouter, useRoute } from 'vue-router';
import { onMounted, ref } from 'vue';
import axios from 'axios';
import ip from 'ip';
import { compare } from 'compare-versions';
import { uniq, forEach, toString } from 'lodash';

import { ipcRenderer } from 'electron';
import { useLordStore } from './stores/LordStore';

const DownloadLink = ref('https://motionprinter.pages.dev/');
const lordDB = useLordStore();
const router = useRouter();
const route = useRoute();
const isAlertOpen = ref(false);

if (route.path == '/') {
  router.push('/home');
}

onMounted(async () => {
  axios
    .get(
      'https://api.github.com/repos/yourabusufiyan/motionprinter/releases/latest',
    )
    .then(async (response) => {
      const data = response.data;
      console.log('Latest Release: ', data);
      if (
        compare(
          toString(data.tag_name.slice(1)),
          toString(await ipcRenderer.invoke('version')),
          '>',
        )
      ) {
        console.log('New version available...');
        DownloadLink.value = data.assets[0].browser_download_url;
        isAlertOpen.value = true;
      }
    });
});

ipcRenderer.on('notification', (e, data) => {
  toast(data.msg);
  console.log('Got notification from Main Process ', data);
});

ipcRenderer.on('reloadDatabase', (e, data) => {
  lordDB.reloadDatabase();
});

console.log('[App.vue]', `App.vue End`);
</script>
