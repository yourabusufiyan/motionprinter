<template lang="pug">
.pdf-tools-page

  //- Page Header
  header.page-header
    h1.text-center All OroPDF Tools for PDF
    p.text-center All the PDF tools you'll ever need, right at your fingertips. 100% FREE and effortless!

  //- Tools Grid
  .tools-grid
    router-link.tool-card(
      v-for="tool in toolsToShow"
      :key="tool.id"
      :to="{name: tool.routName}"
    )
      .tool-icon(:class="`ic-${tool.color}`")
        component(:is="'svg'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" v-html="tool.iconPath")
      h3 {{ tool.name }}
      p {{ tool.description }}

</template>

<script lang="ts" setup>
interface Tool {
  id: string
  name: string
  description: string
  color: string
  iconPath: string
  isAi?: boolean
  display: boolean,
  path?: string
  routName?: string
}

const tools: Tool[] = [
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'save each page as a separate JPG image',
    color: 'teal',
    iconPath: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><path d="M20 17l-2.5-2.5L15 17"/>',
    display: true,
    path: '/oropdf/pdf-to-jpg',
    routName: 'pdf-to-jpg',
  },
  {
    id: 'pdf-to-png',
    name: 'PDF to PNG',
    description: 'save each page as a separate PNG image',
    color: 'teal',
    iconPath: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><circle cx="10" cy="13" r="2"/><path d="M20 17l-2.5-2.5L15 17"/>',
    display: true
  },
  {
    id: 'pdf-to-html',
    name: 'PDF to HTML',
    description: 'Convert PDFs to editable HTML documents',
    color: 'blue',
    iconPath: '<path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    display: false
  },
  {
    id: 'pdf-to-text',
    name: 'PDF to Text',
    description: 'Extract text from your PDF documents',
    color: 'yellow',
    iconPath: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>',
    display: false
  },
  {
    id: 'delete-pdf-pages',
    name: 'Delete PDF Pages',
    description: 'Remove one or multiple pages from your PDF',
    color: 'red',
    iconPath: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/>',
    display: false
  },
  {
    id: 'extract-pdf-pages',
    name: 'Extract PDF Pages',
    description: 'Pick only the pages you need from a PDF',
    color: 'orange',
    iconPath: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    display: false
  },
  {
    id: 'merge-pdf',
    name: 'Merge PDF',
    description: 'Combine multiple PDFs into one unified document',
    color: 'green',
    iconPath: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    display: false
  },
  {
    id: 'organize-pdf',
    name: 'Organize PDF',
    description: 'Rearrange, delete, add pages, and rotate your PDFs',
    color: 'indigo',
    iconPath: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    display: false
  },
  {
    id: 'split-pdf',
    name: 'Split PDF',
    description: 'Extract pages from your PDF or save each page as a separate PDF',
    color: 'orange',
    iconPath: '<line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
    display: false
  },

  {
    id: 'unlock-pdf',
    name: 'Unlock PDF',
    description: 'Remove password, encryption, and permission from your PDF',
    color: 'yellow',
    iconPath: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 019.9-1"/>',
    display: false
  },
  {
    id: 'protect-pdf',
    name: 'Protect PDF',
    description: 'Add a password and encrypt your PDF file',
    color: 'red',
    iconPath: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    display: false
  },

]

const toolsToShow = computed(() => tools.filter(tool => tool.display))

function onToolClick(tool: Tool): void {
  console.log(`Navigating to: ${tool.id}`)
}
</script>

<style lang="stylus">
// ── Variables ──────────────────────────────────────────────
$green        = #2dce89
$green-dark   = #1fae72
$green-light  = #e9faf3
$text-dark    = #1a1a2e
$text-mid     = #4a4a68
$text-muted   = #8888a8
$border       = #e8e8f0
$bg           = #f7f7fc
$white        = #ffffff

// ── Reset ──────────────────────────────────────────────────
*
  box-sizing border-box
  margin 0
  padding 0

// ── Page Wrapper ───────────────────────────────────────────
.pdf-tools-page
  font-family 'Nunito', sans-serif
  background $bg
  color $text-dark
  min-height 100vh
  padding 0 24px 80px
  max-width 1100px
  margin 0 auto

// ── Breadcrumb ─────────────────────────────────────────────
.breadcrumb
  display flex
  align-items center
  gap 8px
  padding 20px 0 0
  font-size 13px
  color $text-muted

  a
    color $text-muted
    text-decoration none
    transition color .15s
    &:hover
      color $green

  .sep
    display flex
    align-items center
    svg
      width 12px
      height 12px

  .current
    color $text-muted

// ── Page Header ────────────────────────────────────────────
.page-header
  padding 28px 0 36px

  h1
    text-align center
    margin auto
    font-size 34px
    font-weight 800
    color $text-dark
    line-height 1.2
    margin-bottom 12px

  p
    margin auto
    font-size 16px
    color $text-mid
    font-weight 500
    max-width 620px
    line-height 1.6

// ── Tools Grid ─────────────────────────────────────────────
.tools-grid
  display grid
  grid-template-columns repeat(auto-fill, minmax(220px, 1fr))
  gap 14px

// ── Tool Card ──────────────────────────────────────────────
.tool-card
  background $white
  border 1.5px solid $border
  border-radius 16px
  padding 20px 18px 18px
  cursor pointer
  transition border-color .2s, box-shadow .2s, transform .2s
  display flex
  flex-direction column
  gap 10px
  position relative
  overflow hidden

  &:hover
    border-color $green
    box-shadow 0 4px 20px rgba(45, 206, 137, 0.12)
    transform translateY(-2px)

  &:active
    transform translateY(0)

  h3
    font-size 14px
    font-weight 800
    color $text-dark
    line-height 1.3

  p
    font-size 12.5px
    font-weight 500
    color $text-muted
    line-height 1.5

// ── Tool Icon ──────────────────────────────────────────────
.tool-icon
  width 44px
  height 44px
  border-radius 12px
  display flex
  align-items center
  justify-content center
  flex-shrink 0

  svg
    width 24px
    height 24px

// Icon color themes
.ic-red
  background #fff0f0
  svg
    color #e85454

.ic-orange
  background #fff5ec
  svg
    color #f5862e

.ic-yellow
  background #fffbec
  svg
    color #e8b124

.ic-green
  background $green-light
  svg
    color $green

.ic-teal
  background #e8faf8
  svg
    color #18b8a8

.ic-blue
  background #eef4ff
  svg
    color #3d7cfa

.ic-indigo
  background #f0eeff
  svg
    color #6b5ce7

.ic-purple
  background #f8eeff
  svg
    color #a044e0

.ic-pink
  background #fff0f6
  svg
    color #e84d8a

.ic-sky
  background #eafaff
  svg
    color #1ab8e8



// ── Responsive ─────────────────────────────────────────────
@media (max-width: 900px)
  .tools-grid
    grid-template-columns repeat(2, 1fr)

@media (max-width: 560px)
  .pdf-tools-page
    padding 0 16px 60px

  .page-header h1
    font-size 26px

  .tools-grid
    grid-template-columns 1fr
</style>
