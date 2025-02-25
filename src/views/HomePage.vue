<script setup lang="ts">
import axios from 'axios'
import { ref, defineAsyncComponent } from 'vue'
import { useRouter } from 'vue-router'

import { useLordStore } from '../stores/LordStore';
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button as uiButton } from '@/components/ui/button'
const PrintDialog = defineAsyncComponent(() =>
  import('@/components/PrintDialog.vue')
)

const lordStore = useLordStore()
const router = useRouter()
const file = ref({})

function handleFileUpload(event: any) {

  console.log(event)

  if (event?.target?.files) {
    console.log(event.target.files[0].type)
    file.value = event.target.files[0]
    console.log(file.value)

    var formData = new FormData();
    formData.append("sampleFile", event.target.files[0]);
    axios.post(`http://${lordStore.db.ip}:9457/api/v1/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }).then((response) => {
      console.log('uploaded : ', response)
    }).catch(() => {
      console.log('Not uploaded')
    })

  }

}

if (!lordStore.db.ConnectedPCs.length) {
  router.push('/connected-pc')
}

</script>

<template lang="pug">
.container.w-100
  PrintDialog

</template>
