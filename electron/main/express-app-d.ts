import { PrintOptions } from 'pdf-to-printer'

export type MutlerFileResponse = {
  originalName?: string,
  encoding: string,
  mimetype: string,
  destination: string,
  filename: string,
  path: string,
  size: number,
}


export type uploadFile = {
  originalName?: string,
  encoding: string,
  mimetype: string,
  destination: string,
  filename: string,
  path: string,
  size: number,
}

export type toPrintsCommandsFile = uploadFile & {
  printOptions?: PrintOptions | null,
  addedBy?: string | null,
  addedTo?: string | null,
  isPrinted: boolean,
  addedTime: Date | number,
  printerName?: string | undefined
}

export type Trash = toPrintsCommandsFile & {
  trashedBy: string | null,
  trashedTime: Date | number | null,
  isDeleted: boolean,
  deletedBy?: string | null,
  deletedTime?: Date | number | null,
}

export type cardMakerPDF = toPrintsCommandsFile & {
  isConverted: boolean,
  opts?: {
    format: string,
    scale: number,
    out_dir: string,
    out_prefix: string,
    page: null | number | string
  },
  isCropped: boolean,
  cardBoth?: string | null,
  cardFront?: string | null,
  cardBack?: string | null,
}

export type cardMaker = {
  id: string,
  cardType: "eshrem" | "abha" | "aadhaar",
  outputFile?: string | null,
  pdfs?: cardMakerPDF[],
}