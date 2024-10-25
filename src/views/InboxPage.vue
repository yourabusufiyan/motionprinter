<script setup>
import { onMounted, toRefs } from 'vue'
import { initDropdowns } from 'flowbite'

onMounted(() => initDropdowns())

</script>

<template lang="pug">
.inbox-page.-mx-5
  .inbox-container.flex.border.rounded-md.py-3.overflow-hidden(style="height: calc(100vh - 140px)")
    .user-list-container.overflow-y-auto(class="basis-2/6")
      ul.px-2.space-y-1
        li.flex.content-center.px-2.py-1.rounded.activated-chat
          .profile-photo.m-auto.mr-2
            img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
          .message-details.flex-1.mb-1
            .flex.flex-row.justify-between.mb-0
              h3.font-semibold.mb-0 abu sufiyan
              small.mb-0 01/10/199
            .flex.flex-row.justify-between
              .text-gray-500.text-sm hello abu sufiyan
              .notification.text-sm.bg-zinc-500.text-white.rounded-full(class="px-1.5") 2
        li.flex.content-center.px-2.py-1.rounded
          .profile-photo.m-auto.mr-2
            img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
          .message-details.flex-1.mb-1
            .flex.flex-row.justify-between.mb-0
              h3.font-semibold.mb-0 abu sufiyan
              small.mb-0 01/10/199
            .flex.flex-row.justify-between
              .text-gray-500.text-sm hello abu sufiyan
              .notification.text-sm.bg-zinc-500.text-white.rounded-full(class="px-1.5") 2
        li.flex.content-center.px-2.py-1.rounded.activated-chat
          .profile-photo.m-auto.mr-2
            img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
          .message-details.flex-1.mb-1
            .flex.flex-row.justify-between.mb-0
              h3.font-semibold.mb-0 abu sufiyan
              small.mb-0 01/10/199
            .flex.flex-row.justify-between
              .text-gray-500.text-sm hello abu sufiyan
              .notification.text-sm.bg-zinc-500.text-white.rounded-full(class="px-1.5") 2
        li.flex.content-center.px-2.py-1.rounded
          .profile-photo.m-auto.mr-2
            img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
          .message-details.flex-1.mb-1
            .flex.flex-row.justify-between.mb-0
              h3.font-semibold.mb-0 abu sufiyan
              small.mb-0 01/10/199
            .flex.flex-row.justify-between
              .text-gray-500.text-sm hello abu sufiyan
              .notification.text-sm.bg-zinc-500.text-white.rounded-full(class="px-1.5") 2
        li.flex.content-center.px-2.py-1.rounded.activated-chat
          .profile-photo.m-auto.mr-2
            img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
          .message-details.flex-1.mb-1
            .flex.flex-row.justify-between.mb-0
              h3.font-semibold.mb-0 abu sufiyan
              small.mb-0 01/10/199
            .flex.flex-row.justify-between
              .text-gray-500.text-sm hello abu sufiyan
              .notification.text-sm.bg-zinc-500.text-white.rounded-full(class="px-1.5") 2
        li.flex.content-center.px-2.py-1.rounded
          .profile-photo.m-auto.mr-2
            img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
          .message-details.flex-1.mb-1
            .flex.flex-row.justify-between.mb-0
              h3.font-semibold.mb-0 abu sufiyan
              small.mb-0 01/10/199
            .flex.flex-row.justify-between
              .text-gray-500.text-sm hello abu sufiyan
              .notification.text-sm.bg-zinc-500.text-white.rounded-full(class="px-1.5") 2
        li.flex.content-center.px-2.py-1.rounded.activated-chat
          .profile-photo.m-auto.mr-2
            img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
          .message-details.flex-1.mb-1
            .flex.flex-row.justify-between.mb-0
              h3.font-semibold.mb-0 abu sufiyan
              small.mb-0 01/10/199
            .flex.flex-row.justify-between
              .text-gray-500.text-sm hello abu sufiyan
              .notification.text-sm.bg-zinc-500.text-white.rounded-full(class="px-1.5") 2
        li.flex.content-center.px-2.py-1.rounded
          .profile-photo.m-auto.mr-2
            img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
          .message-details.flex-1.mb-1
            .flex.flex-row.justify-between.mb-0
              h3.font-semibold.mb-0 abu sufiyan
              small.mb-0 01/10/199
            .flex.flex-row.justify-between
              .text-gray-500.text-sm hello abu sufiyan
              .notification.text-sm.bg-zinc-500.text-white.rounded-full(class="px-1.5") 2
        li.flex.content-center.px-2.py-1.rounded.activated-chat
          .profile-photo.m-auto.mr-2
            img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
          .message-details.flex-1.mb-1
            .flex.flex-row.justify-between.mb-0
              h3.font-semibold.mb-0 abu sufiyan
              small.mb-0 01/10/199
            .flex.flex-row.justify-between
              .text-gray-500.text-sm hello abu sufiyan
              .notification.text-sm.bg-zinc-500.text-white.rounded-full(class="px-1.5") 2
        li.flex.content-center.px-2.py-1.rounded
          .profile-photo.m-auto.mr-2
            img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
          .message-details.flex-1.mb-1
            .flex.flex-row.justify-between.mb-0
              h3.font-semibold.mb-0 abu sufiyan
              small.mb-0 01/10/199
            .flex.flex-row.justify-between
              .text-gray-500.text-sm hello abu sufiyan
              .notification.text-sm.bg-zinc-500.text-white.rounded-full(class="px-1.5") 2
        li.flex.content-center.px-2.py-1.rounded.activated-chat
          .profile-photo.m-auto.mr-2
            img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
          .message-details.flex-1.mb-1
            .flex.flex-row.justify-between.mb-0
              h3.font-semibold.mb-0 abu sufiyan
              small.mb-0 01/10/199
            .flex.flex-row.justify-between
              .text-gray-500.text-sm hello abu sufiyan
              .notification.text-sm.bg-zinc-500.text-white.rounded-full(class="px-1.5") 2
        li.flex.content-center.px-2.py-1.rounded
          .profile-photo.m-auto.mr-2
            img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
          .message-details.flex-1.mb-1
            .flex.flex-row.justify-between.mb-0
              h3.font-semibold.mb-0 abu sufiyan
              small.mb-0 01/10/199
            .flex.flex-row.justify-between
              .text-gray-500.text-sm hello abu sufiyan
              .notification.text-sm.bg-zinc-500.text-white.rounded-full(class="px-1.5") 2
        li.flex.content-center.px-2.py-1.rounded.activated-chat
          .profile-photo.m-auto.mr-2
            img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
          .message-details.flex-1.mb-1
            .flex.flex-row.justify-between.mb-0
              h3.font-semibold.mb-0 abu sufiyan
              small.mb-0 01/10/199
            .flex.flex-row.justify-between
              .text-gray-500.text-sm hello abu sufiyan
              .notification.text-sm.bg-zinc-500.text-white.rounded-full(class="px-1.5") 2
        li.flex.content-center.px-2.py-1.rounded
          .profile-photo.m-auto.mr-2
            img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
          .message-details.flex-1.mb-1
            .flex.flex-row.justify-between.mb-0
              h3.font-semibold.mb-0 abu sufiyan
              small.mb-0 01/10/199
            .flex.flex-row.justify-between
              .text-gray-500.text-sm hello abu sufiyan
              .notification.text-sm.bg-zinc-500.text-white.rounded-full(class="px-1.5") 2


    .chat-container.flex-1.overflow-y-auto

      .chat-header.flex.content-center.rounded.py-2.border-gray-300.border-b.px-2
        .profile-photo.mr-3
          img.h-10.rounded-full(src="https://placehold.jp/150x150.png")
        .message-details
            h3.font-semibold.m-0.p-0 abu sufiyan
            small.status.mb-0.font-medium.text-green-500 Online

      .chat-messages.px-2.py-4.overflow-auto

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
              span.text-sm.font-semibold.text-gray-900(class='dark:text-white') Bonnie Green
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
              span.text-sm.font-semibold.text-gray-900(class='dark:text-white') Bonnie Green
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
              span.text-sm.font-semibold.text-gray-900(class='dark:text-white') Bonnie Green
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
              span.text-sm.font-semibold.text-gray-900(class='dark:text-white') Bonnie Green
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
