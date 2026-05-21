import { merge, zip } from "lodash";
import path from "path";
// @ts-ignore
import pdf from 'pdf-poppler';
import fs from 'fs';
import { isEncrypted, decryptPDF } from '@pdfsmaller/pdf-decrypt';
import AdmZip from 'adm-zip';
import { PdfInfo } from "./express-app-d";



export async function pdf2image(file: any): Promise<any> {
  return new Promise(async (resolve, reject) => {

    console.time('oro-pdf pdf2image');

    const out_prefix = path.basename(
      file.destination,
      path.extname(file.destination)
    );

    let scale = 1754;
    switch (file?.dpi) {
      case 150:
        scale = 1754;
        break;
      case 300:
        scale = 3508;
        break;
      case 600:
        scale = 7016;
        break;
    }

    let opts: any = {
      format: file?.format || 'jpg',
      scale,
      out_dir: file?.out_dir || path.dirname(file.destination),
      out_prefix: file?.out_prefix || out_prefix,
      page: null,
      args: {}
    };

    opts = Object.assign({}, opts, file.opts)

    opts.args.opw = file?.password || '';
    opts.args.upw = file?.password || '';
    opts.args.r = file?.dpi || 150;

    opts = merge({}, opts, file?.opts);

    pdf
      .convert(file.destination, opts)
      .then((res: any) => {
        file.isConverted = true;
        file.opts = opts;
        file.output = out_prefix;
        console.log('Successfully converted', opts);
        resolve(file);
      })
      .catch((error: any) => {
        console.error(error);
        const errorMessage =
          error.message.match(/Command Line Error:\s*(.*)/)?.[1] ||
          'Unknown error';
        console.log(errorMessage);
        reject(error);
      }).finally(() => {
        console.timeEnd('oro-pdf pdf2image');
      });
  })
}

export async function checkProtected(file: string): Promise<boolean | PdfInfo> {
  return new Promise(async (resolve, reject) => {

    try {
      let result = await pdf.info(file, { args: { opw: 'Dummy Password With Secret Key' } })

      console.log('PDF is NOT PASSWORD PROTECTED', result);
      resolve(result);
    } catch (error) {
      console.log('PDF is password protected', error);
      resolve(true);
    }

  })
}

export async function verifyPassword(file: string, password: string): Promise<boolean> {
  return new Promise(async (resolve, reject) => {

    const pdfBuffer = fs.readFileSync(file);
    try {
      await decryptPDF(pdfBuffer, password);
      resolve(true)
    } catch (error) {
      resolve(false)
    }

  })
}


/**
 * Creates a folder, appending a number if it already exists
 * @param {string} folderPath - The desired folder path
 * @returns {Promise<string>} - The actual created folder path
 */
export async function createFolder(folderPath: string): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {

      // Check if folder exists
      if (!fs.existsSync(folderPath)) {
        // Create folder if it doesn't exist
        fs.mkdirSync(folderPath, { recursive: true });
        resolve(folderPath);
        return;
      }

      // If folder exists, find available name with number
      let counter = 1;
      let newPath = folderPath;

      while (fs.existsSync(newPath)) {
        const extension = path.extname(folderPath);
        const baseName = folderPath.replace(extension, '');
        newPath = `${baseName}-(${counter})${extension}`;
        counter++;
      }

      fs.mkdirSync(newPath, { recursive: true });
      resolve(newPath);
    } catch (error) {
      reject(new Error(`Failed to create folder: ${error}`));
    }
  });
}


/**
 * Compress a folder to zip file
 * @param {string} sourceDir - Source folder path to compress
 * @param {string} outputPath - Output zip file path
 * @returns {Promise<string>} - Path to created zip file
 */
export async function compressFolderToZip(sourceDir: string, outputPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const zip = new AdmZip();

      // Add entire folder recursively
      zip.addLocalFolder(sourceDir);

      // Write zip file
      zip.writeZip(outputPath + '.zip');

      console.log(`Folder compressed to: ${outputPath}`);
      resolve(outputPath);
    } catch (error) {
      reject(new Error(`Failed to compress folder: ${error}`));
    }
  });
}

