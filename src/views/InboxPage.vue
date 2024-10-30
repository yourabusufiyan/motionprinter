<script setup>
import { initDropdowns } from 'flowbite'
import { Button as uiButton } from '@/components/ui/button'
import { Textarea as uiTextarea } from '@/components/ui/textarea'

import { onMounted, toRefs, ref, reactive } from 'vue'
import ip from 'ip'
import axios from 'axios'
import moment from 'moment'
import { uniq } from 'lodash'


let inboxes = ref()
let currentInbox = ref()
let onlineUsers = ref([])
let intervalId = ref(null);

function checkOnlinePCs() {
  if (inboxes.value?.length) {
    inboxes.value.forEach(el => {
      axios.get(`http://${el.ip}:9457/api/v1/ping`, { timeout: 50 }).then((response) => {
        onlineUsers.value = onlineUsers.value.concat(el.id)
      }).catch((e) => { })
      return true;
    })
  }
  onlineUsers.value = uniq(onlineUsers.value)
}

onMounted(() => {
  initDropdowns()
  intervalId = setInterval(checkOnlinePCs, 5000);
})

axios.get(`http://${ip.address()}:9457/api/v1/inbox`).then((response) => {
  console.log('inbox response', response.data);
  response.data.sort((a) => ip.address() == a.ip ? -1 : 1)
  inboxes.value = response.data
  checkOnlinePCs()
}).catch(() => {
  console.log('inbox response error');
})

onUnmounted(() => {
  clearInterval(intervalId);
});

</script>

<template lang="pug">
.inbox-page.-mx-5
  .inbox-container.flex.border.rounded-md.overflow-hidden(
    style="height: calc(100vh - 140px)"
  )
    .user-list-container.overflow-y-auto.border-r.pt-1(class="basis-2/6")
      ul.px-2.space-y-1

        li.flex.content-center.px-2.py-1.rounded(
          v-for="inbox in inboxes"
          :key="inbox.id"
          @click="currentInbox = inbox"
          :class="{ 'activated-chat': currentInbox?.id === inbox.id }"
        )

          .profile-photo.m-auto.mr-2
            img.h-10.rounded-full(src="https://placehold.jp/150x150.png")

          .message-details.flex-1.mb-1

            .flex.flex-row.justify-between.mb-0
              h3.text-sm.font-semibold.mb-0 {{ inbox.computerName }} {{ ip.address() == inbox.ip ? ' (You)' : '' }}
              small.mb-0(
                :class="{ 'font-medium text-green-500': onlineUsers.includes(inbox.id) }"
              ) {{ onlineUsers.includes(inbox.id) ? "Online" : "Offline" }}

            .flex.flex-row.justify-between
              .text-gray-500.text-sm hello abu sufiyan
              .notification.text-sm.bg-zinc-500.text-white.rounded-full(class="px-1.5") 2

    .chat-container.flex-1.flex.flex-col

      .chat-is-not-selected.flex-1.flex.justify-center.items-center.bg-gray-50(
        v-if="!currentInbox?.id"
      )
        h1 Select the user to start the chat.

      .chat-is-selected(v-else)

        .chat-header.content-center.rounded.py-2.border-gray-300.border-b.px-2
          .flex
            .profile-photo.mr-3
              img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
            .message-details
                h3.font-semibold.m-0.p-0 {{ currentInbox?.computerName }}
                small.status.mb-0(
                  :class="{ 'font-medium text-green-500': onlineUsers.includes(currentInbox?.id) }"
                ) {{ onlineUsers.includes(currentInbox?.id) ? "Online" : "Offline" }}

        .chat-messages.flex-1.px-2.py-4.overflow-x-auto

          // simple message
          .chat-message.flex.items-start(class='gap-2.5')
            img.w-8.h-8.rounded-full(src='https://placehold.jp/150x150.png' alt='Jese image')
            .flex.flex-col.gap-1.w-full(class='max-w-[320px]')
              .flex.items-center.space-x-2(class='rtl:space-x-reverse')
                span.text-sm.font-semibold.text-gray-900(class='dark:text-white') Bonnie Green
                span.text-sm.font-normal.text-gray-500(class='dark:text-gray-400') 11:46
              .flex.flex-col.p-4.border-gray-200.bg-gray-100.rounded-e-xl.rounded-es-xl(class='leading-1.5 dark:bg-gray-700')
                p.text-sm.font-normal.text-gray-900(class='dark:text-white')  That&apos;s awesome. I think our users will really appreciate the improvements.
              span.text-sm.font-normal.text-gray-500(class='dark:text-gray-400') Delivered
            button#dropdownMenuIconButton.inline-flex.self-center.items-center.p-2.text-sm.font-medium.text-center.text-gray-900.bg-white.rounded-lg(
              data-dropdown-toggle='dropdownDots'
              data-dropdown-placement='bottom-start'
              class='hover:bg-gray-100 focus:ring-4 focus:outline-none dark:text-white focus:ring-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:ring-gray-600'
              type='button'
            )
              svg.w-4.h-4.text-gray-500(class='dark:text-gray-400' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewbox='0 0 4 15')
                path(d='M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z')
            #dropdownDots.z-10.hidden.bg-white.divide-y.divide-gray-100.rounded-lg.shadow.w-40(class='dark:bg-gray-700 dark:divide-gray-600')
              ul.py-2.text-sm.text-gray-700(class='dark:text-gray-200' aria-labelledby='dropdownMenuIconButton')
                li
                  a.block.px-4.py-2(href='#' class='hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white') Reply
                li
                  a.block.px-4.py-2(href='#' class='hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white') Forward
                li
                  a.block.px-4.py-2(href='#' class='hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white') Copy
                li
                  a.block.px-4.py-2(href='#' class='hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white') Report
                li
                  a.block.px-4.py-2(href='#' class='hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white') Delete

          .chat-message.chat-message-sent.flex.items-start(class='gap-2.5')
            img.w-8.h-8.rounded-full(src='https://placehold.jp/150x150.png' alt='Jese image')
            .flex.flex-col.gap-1.w-full(class='max-w-[320px]')
              .flex.items-center.space-x-2(class='rtl:space-x-reverse')
                span.text-sm.font-semibold.text-gray-900(class='dark:text-white') Sendear
                span.text-sm.font-normal.text-gray-500(class='dark:text-gray-400') 11:46
              .flex.flex-col.p-4.border-gray-200.bg-gray-100.rounded-e-xl.rounded-es-xl(class='leading-1.5 dark:bg-gray-700')
                p.text-sm.font-normal.text-gray-900(class='dark:text-white')  That&apos;s awesome. I think our users will really appreciate the improvements.
              .message-status.span.text-sm.font-normal.text-gray-500(class='dark:text-gray-400') Delivered
            button#dropdownMenuIconButton.inline-flex.self-center.items-center.p-2.text-sm.font-medium.text-center.text-gray-900.bg-white.rounded-lg(
              data-dropdown-toggle='dropdownDots'
              data-dropdown-placement='bottom-start'
              class='hover:bg-gray-100 focus:ring-4 focus:outline-none dark:text-white focus:ring-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800 dark:focus:ring-gray-600'
              type='button'
            )
              svg.w-4.h-4.text-gray-500(class='dark:text-gray-400' aria-hidden='true' xmlns='http://www.w3.org/2000/svg' fill='currentColor' viewbox='0 0 4 15')
                path(d='M3.5 1.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 6.041a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm0 5.959a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z')
            #dropdownDots.z-10.hidden.bg-white.divide-y.divide-gray-100.rounded-lg.shadow.w-40(class='dark:bg-gray-700 dark:divide-gray-600')
              ul.py-2.text-sm.text-gray-700(class='dark:text-gray-200' aria-labelledby='dropdownMenuIconButton')
                li
                  a.block.px-4.py-2(href='#' class='hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white') Reply
                li
                  a.block.px-4.py-2(href='#' class='hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white') Forward
                li
                  a.block.px-4.py-2(href='#' class='hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white') Copy
                li
                  a.block.px-4.py-2(href='#' class='hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white') Report
                li
                  a.block.px-4.py-2(href='#' class='hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white') Delete

        .message-writer
          .flex.items-end.px-2.space-x-2
            .message-textarea.flex-1
              uiTextarea.leading-1.outline-none(
                class="!outline-none focus:outline-none"
                placeholder="Type your message here."
              )
            .message-sender
              uiButton send
pre {{ inboxes }}
</template>


<style lang="stylus" scoped>
.user-list-container > ul > li
  &.activated-chat
    @apply bg-zinc-200
  &:hover
    @apply bg-zinc-300

.chat-container
  .message-details
    line-height 1.1

.chat-message-sent
  @apply flex-row-reverse
  & > .flex
    & > .flex
      @apply items-end justify-end
    .message-status
      text-align right

</style>
