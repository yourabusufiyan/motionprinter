import { merge } from "lodash";
import path from "path";
// @ts-ignore
import pdf from 'pdf-poppler';
import fs from 'fs';
import { isEncrypted, decryptPDF } from '@pdfsmaller/pdf-decrypt';


export async function pdf2image(file: any): Promise<any> {
  return new Promise(async (resolve, reject) => {

    console.time('oro-pdf pdf2image');

    const out_prefix = path.basename(
      file.destination,
      path.extname(file.destination)
    );

    let opts: any = {
      format: 'png',
      scale: 0,
      out_dir: path.dirname(file.destination),
      out_prefix: out_prefix,
      page: null,
      args: {}
    };

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

export async function checkProtected(file: string): Promise<boolean> {
  return new Promise(async (resolve, reject) => {

    try {
      const pdfBuffer = fs.readFileSync(file);
      const result = await isEncrypted(pdfBuffer)

      if (result.encrypted) {
        console.log('🔒 PDF is PASSWORD PROTECTED');
        resolve(true);
      } else {
        console.log('🔓 PDF is NOT password protected');
        resolve(false);
      }
    } catch (error) {
      resolve(false);
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

export async function pdfToJPG(file: string): Promise<void> {
}