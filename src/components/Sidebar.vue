<script lang="ts" setup>
import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router';
import { useLordStore } from '../stores/LordStore';
import ip from 'ip'
import { HomeIcon, CountdownTimerIcon, TokensIcon, ChatBubbleIcon } from '@radix-icons/vue'
import { Network, IdCard  } from 'lucide-vue-next';

import { ipcRenderer } from 'electron';

const routes = ref([
  { path: '/home', display: 'Home' },
  { path: '/card-maker', display: 'Card Maker' },
  { path: '/connected-pc', display: 'Connected PC' },
  { path: '/history', display: 'History' },
])

const route = useRoute()
const lordStore = useLordStore()
const localIP = ip.address()
const version = ref('1.0.0')


onMounted(async () => {
  let o = await ipcRenderer.invoke('version')
  version.value = o;
})
</script>

<template lang="pug">
aside.top-0.left-0.fixed
  .sidebar.flex.flex-col.w-64.min-w-44.h-screen.px-5.py-8.overflow-y-auto.bg-white.border-r(
    class="rtl:border-r-0 rtl:border-l dark:bg-slate-900 dark:border-slate-700"
  )
    .logo
      h1.text-2xl.font-medium(
        class="dark:text-slate-100"
      )
        | MotionPrinter
        code.text-xs.block.text-gray-500.m-0.p-0 Beta {{ version }}
      p.text-sm.text-zinc-600.leading-tight.mt-1(
        class="dark:text-slate-500"
      ) Printer sharing application to others devices.
      hr.mt-3.border-slate-200(
        class="sm:mx-auto dark:border-slate-700 xl:my-8"
      )
    .flex.flex-col.justify-between.flex-1.mt-3
      nav.sidebar-nav.flex-1.-mx-3.space-y-3
        router-link.flex.items-center.px-3.py-2.text-slate-600.transition-colors.duration-300.transform.rounded-lg(
          class="dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 hover:text-slate-700"
          v-for="r in routes"
          :to="r.path"
          activeClass=`
            bg-slate-400 text-slate-800 hover:bg-slate-400 hover:text-slate-800
            dark:bg-slate-300 dark:text-slate-700 dark:hover:bg-slate-100 dark:hover:text-slate-900
          `
        )
          HomeIcon(v-if="r.path == '/home'")
          IdCard(stroke-width="2" size="16" v-if="r.path == '/card-maker'")
          CountdownTimerIcon(v-else-if="r.path == '/history'")
          Network(stroke-width="1" size="16" color="black" v-else-if="r.path == '/connected-pc'")
          ChatBubbleIcon(stroke-width="2" size="16" color="black" v-else-if="r.path == '/inbox'")
          span.mx-2.text-sm.font-medium
            | {{ r.display }}

      .mt-6(class="sm:mt-3")

        .p-3.bg-slate-100.rounded-lg.pt-2.hidden(class="dark:bg-slate-800")
          h2.text-sm.font-medium.text-slate-800(class="dark:text-white")
            | Sponsored
          img.object-cover.w-full.h-24.mt-2.rounded-lg.transition-all(
            src="https://placehold.jp/3d4070/ffffff/50x50.png"
            alt="sponsored logo"
            class="md:h-32"
          )

        .mt-6(class="sm:mt-3")

          .small-nav.text-xs.font-semibold(class="space-x-1.5")
            router-link( to="/help" class="underline hover:no-underline") HELP
            router-link( to="/help#faq" class="underline hover:no-underline") FAQs

          .flex.items-center.gap-x-2
            a.hidden(href="#")
              img.object-cover.rounded-full.h-7.w-7(
                src="https://placehold.jp/3d4070/ffffff/50x50.png",
                alt="avatar"
              )
            span.text-sm.font-medium.text-slate-700(
              class="dark:text-slate-200"
            ) {{ lordStore?.db?.computerName }} : {{ localIP }}

</template>
