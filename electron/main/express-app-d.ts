import { PrintOptions } from 'pdf-to-printer';

export type MutlerFileResponse = {
  originalName?: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
};

export interface PdfInfo {
  creator: string;
  producer: string;
  creationdate: string;
  moddate: string;
  tagged: 'yes' | 'no';
  userproperties: 'yes' | 'no';
  suspects: 'yes' | 'no';
  form: 'AcroForm' | 'XFA' | 'none';
  javascript: 'yes' | 'no';
  pages: string;
  encrypted: 'yes' | 'no';
  page_size: string;
  page_rot: string;
  file_size: string;
  optimized: 'yes' | 'no';
  pdf_version: string;
  width_in_pts: number;
  height_in_pts: number;
}

export type uploadFile = {
  id?: string;
  originalName?: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
  temp?: boolean;
  isPasswordProtected?: boolean;
  password: string | null;
  isPasswordRight?: boolean;
  thumbnail?: string | null;
  out_dir?: string | null;
  out_prefix?: string | null;
  dpi?: number | null;
  info?: PdfInfo | null
};

export type toPrintsCommandsFile = uploadFile & {
  id?: string;
  printOptions?: PrintOptions | null;
  addedBy?: string | null;
  addedTo?: string | null;
  isPrinted: boolean;
  addedTime: Date | number;
  printerName?: string | undefined;
  password?: string | null;
  uploaded?: boolean;
};

export type Trash = toPrintsCommandsFile & {
  id?: string;
  trashedBy: string | null;
  trashedTime: Date | number | null;
  isDeleted: boolean;
  deletedBy?: string | null;
  deletedTime?: Date | number | null;
};

export type cardMakerPDF = toPrintsCommandsFile & {
  id?: string;
  isConverted?: boolean;
  opts?: {
    format?: string;
    scale?: number;
    out_dir?: string;
    out_prefix?: string;
    page?: null | number | string;
  };
  isCropped?: boolean;
  cardBoth?: string | null;
  cardFront?: string | null;
  cardBack?: string | null;
  cardType:
  | 'eshram'
  | 'abha'
  | 'aadhaar'
  | 'ayushman'
  | 'custom'
  | 'pan'
  | 'voter_new'
  | 'abc_apaar'
  | 'csc_id'
  | 'nielit_student_id'
  | 'ration'
  | 'udid'
  | 'apaar'
  | null;
  provider?: 'uti' | 'nsdl' | null;
  abcTo?: 'abc' | 'apaar' | null;
  password?: string | null;
  errorMessage?: string | null;
  warningMessage?: string | null;
  dpi?: number | null;
};

export type cardMaker = {
  id: string;
  filename?: string;
  path?: string | null;
  outputFile?: string | null;
  cardPerSheet?: number;
  pdfs?: cardMakerPDF[];
};

export type Photo = {
  src?: string;
  zoom?: number;
  rotation?: number;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
};

export type photoSheetPhoto = uploadFile & Photo;

export type photoSheet = {
  id: string;
  filename?: string;
  path?: string | null;
  outputFile?: string | null;
  photos: photoSheetPhoto[];
};

export type oroPdfSettings = {
  id: string;
  addedTime: Date | number;
  dpi?: number | null;
  options?: {
    format?: string;
    scale?: number;
    out_dir?: string;
    out_prefix?: string;
    size?: number | null;
  }
  files: uploadFile[] | [];
  service?: 'pdf-to-image' | 'pdf-to-png' | 'pdf-to-jpg';

}

export type Scanner = {
  token?: string,
  files?: ScannerFileData[] | null,
}

export type ScannerFileData = {
  id: string,
  computerID: string,
  fileName: string,
  storedName: string,
  filePath: string,
  fileSize: number,
  mimeType: string,
  description: string,
  uploadedAt: string,
  downloadedAt: string | null,
}