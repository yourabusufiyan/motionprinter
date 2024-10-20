import { acceptHMRUpdate, defineStore } from 'pinia';
import { reactive } from 'vue';
import path from 'path';
import os from 'os';
import { JSONFileSyncPreset } from 'lowdb/node';
import ip from 'ip'
import axios from 'axios'

import type { $lordData } from '../declarations'

console.log('[App.vue]', `store lord started`);

export const useLordStore = defineStore('lord', () => {

  const dbPath = path.join(os.homedir(), '/motionprinter/db/', `lordPrinter-${ip.address()}.json`);

  var apiURL = `http://${ip.address()}:9457/api/v1/data`
  var db = ref<$lordData>({} as $lordData)

  console.log('Database path: ' + dbPath, process.env);

  axios.get(apiURL).then((response) => {
    console.log('Online LordStore Updated', response.data);
    db.value = response.data
  }).catch(() => {
    // @ts-ignore
    db.value = JSONFileSyncPreset<$lordData>(dbPath, {} as $lordData);
    console.log('Offline LordStore Updated');
  })


  async function reloadDatabase() {
    console.log('Reloading database...');
    await axios.get(apiURL).then((response) => {
      db.value = response.data
      console.log('Online LordStore Updated', db.value);
    }).catch(() => {
      // @ts-ignore
      db.value = JSONFileSyncPreset<$lordData>(dbPath, {} as $lordData);
      console.log('Offline LordStore Updated');
    })
  }

  return {
    dbPath,
    db,
    reloadDatabase
  };

});


if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useLordStore, import.meta.hot));

console.log('[App.vue]', `store lord ended`);
