<script setup lang="ts">
const flagUrl = new URL(`/src/assets/india-48.png`, import.meta.url).href;
</script>

<template lang="pug">
footer.footer.bg-white.px-5.py-4.border-t( class="dark:bg-gray-900" )
  div.text-sm.text-gray-500(
    class="sm:flex sm:items-center sm:justify-between sm:text-center dark:text-gray-400"
  )
    span
      | © 2024
      a(
        href="https://motionprinter.pages.dev?ref=motionprinter"
        target="_blank"
        class="hover:underline ml-1"
      ) MotionPrinter
      | . All Rights Reserved.

    .flex.mt-4(class="sm:justify-center sm:mt-0")
      p 
        | Made with &#10084; in
        img.inline.w-auto.mx-1(:src="flagUrl" style="height: 2cap")
        | by #[a.uppercase.font-medium.font-sm(href="https://yourabusufiyan.pages.dev/" class="hover:underline" target="_blank") abu sufiyan's Team ]
</template>
