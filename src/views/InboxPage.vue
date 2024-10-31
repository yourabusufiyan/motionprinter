<script setup>
import { initDropdowns } from 'flowbite'
import { Button as uiButton } from '@/components/ui/button'
import { Textarea as uiTextarea } from '@/components/ui/textarea'

import { onMounted, toRefs, ref, reactive } from 'vue'
import ip from 'ip'
import axios from 'axios'
import moment from 'moment'
import { uniq, isNumber } from 'lodash'
import { useLordStore } from '@/stores/LordStore'

const lordStore = useLordStore();
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


let messageWriter = ref('');
function sendMessage() {
  console.log(currentInbox.value)
  axios.post(`http://${currentInbox.value.ip}:9457/api/v1/inbox/message`, {
    chatId: currentInbox.value.id,
    senderId: lordStore.db.id,
    message: messageWriter.value.toString(),
    MessageType: 'text',
    sentAt: Date.now(),
    senderComputerName: lordStore.db.computerName,
    senderIP: lordStore.db.ip,
  })
    .then(function (response) {
      console.log(response);
      inboxes.value = inboxes.value.map(el => {
        if (el.id === response.data.id) {
          currentInbox.value.messages = response.data.messages;
          el.messages = response.data.messages
        }
        return el
      })
      messageWriter.value = 'success';
    })
    .catch(function (error) {
      console.log(error);
      messageWriter.value = 'success';
    });
}

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

      .chat-header.content-center.rounded.py-2.border-gray-300.border-b.px-2.chat-is-selected
        .flex
          .profile-photo.mr-3
            img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
          .message-details
              h3.font-semibold.m-0.p-0 {{ currentInbox?.computerName }}
              small.status.mb-0(
                :class="{ 'font-medium text-green-500': onlineUsers.includes(currentInbox?.id) }"
              ) {{ onlineUsers.includes(currentInbox?.id) ? "Online" : "Offline" }}

      .chat-messages.flex-1.px-2.py-4.space-y-3.overflow-x-auto

        .chat-message.flex.items-start(
          class='gap-2.5'
          v-for="message in currentInbox.messages"
          v-if="currentInbox?.messages"
          :class="{ 'chat-message-sent' : currentInbox?.id != message.senderId, 'message.messageType': true }"
        )
          img.w-8.h-8.rounded-full(src='https://placehold.jp/150x150.png' alt='Jese image')
          .flex.flex-col.gap-1.w-full(class='max-w-[320px]')
            .flex.items-center.space-x-2
              span.text-sm.font-semibold.text-gray-900(class='dark:text-white') {{ message?.senderComputerName }}
              span.text-sm.font-normal.text-gray-500(class='dark:text-gray-400')
                | {{ moment(currentInbox?.id != message.senderId ? message.sentAt : message.receivedAt).format('hh:mm A') }}
            .message-content-container.flex.flex-col.p-4.border-gray-200.bg-gray-200.rounded-xl.rounded-tl-none(class='leading-1.5 dark:bg-gray-700')
              p.text-sm.font-normal.text-gray-900(class='dark:text-white') {{ message.message }}

      .message-writer
        .flex.items-end.px-2.space-x-2
          .message-textarea.flex-1
            uiTextarea.leading-1.outline-none(
              class="!outline-none focus:outline-none"
              placeholder="Type your message here."
              v-model="messageWriter"
            )
          .message-sender
            uiButton( @click="sendMessage" ) send
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
    .message-content-container
      @apply rounded-tr-none rounded-tl-xl
    .message-status
      text-align right
      display inline-block
</style>
