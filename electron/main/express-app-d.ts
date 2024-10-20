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
  isPrinted: boolean,
  addedTime: Date | number,
  printerName?: string | undefined
}
