import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  dialog,
  Tray,
  Menu,
} from 'electron';
import { release } from 'os';
import path from 'path';
import os from 'os';
import fs from 'fs';
import axios from 'axios';
import { address } from 'ip';
// @ts-ignore
import pdf from 'pdf-poppler';
import { execFile } from 'child_process';
import { Jimp, loadFont, measureText, measureTextHeight } from "jimp";
import { sleep } from '../../helpers/both';
import { print } from 'pdf-to-printer';

import { isUndefined, last, range, merge } from 'lodash';
import QRCodeGenerator from "qrcode";
import QrCodeReader from "qrcode-reader";

import expressAppClass from './express-app';
import type { cardMaker, cardMakerPDF } from './express-app-d';
import {
  createA4PDFwithEshremCards,
  createA4WithImagesPDF,
  cropImage,
  extractEshramCard,
  extractAadhaarCard,
  extractPanCard,
  extractNielitStudentIDCard,
  extractRationCard,
} from '../helpers/cardmakers';
import { writer } from 'repl';


process.env.DIST_ELECTRON = path.join(__dirname, '..');
process.env.DIST = path.join(process.env.DIST_ELECTRON, '../dist');
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST;

const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
const autoLaunchArgs = ['--hidden'];
const cleanupAutoLaunchArgs = [
  '--squirrel-uninstall',
  '--squirrel-obsolete',
  '--uninstall',
];
const isHiddenLaunch = process.argv.includes('--hidden');

function setAutoLaunch(openAtLogin: boolean) {
  if (process.platform !== 'win32') return;

  app.setLoginItemSettings({
    openAtLogin,
    path: app.getPath('exe'),
    args: autoLaunchArgs,
  });
}

if (cleanupAutoLaunchArgs.some((arg) => process.argv.includes(arg))) {
  setAutoLaunch(false);
  app.quit();
  process.exit(0);
}

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

app.on('before-quit', () => {
  isQuitting = true;
});

// Here, you can also use other preload
const preload = path.join(__dirname, '../preload/index.js');
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = path.join(process.env.DIST, 'index.html');

const dir = [
  path.join(os.homedir(), app.getName(), '/public/'),
  path.join(os.homedir(), app.getName(), '/upload/pdf/'),
  path.join(os.homedir(), app.getName(), '/upload/image/'),
  path.join(os.homedir(), app.getName(), '/db/'),
  path.join(os.homedir(), app.getName(), '/oropdf/'),
];


dir.map((el) => !fs.existsSync(el) && fs.mkdirSync(el, { recursive: true }));

if (app.isPackaged) {
  setAutoLaunch(true);
}

// Global settings for dev and production
if (!process.env.VITE_DEV_SERVER_URL) {
  // For production
  Menu.setApplicationMenu(null);
}

async function createWindow() {
  if (!expressAppClass.isServerRunning) {
    expressAppClass.startServer();
  }

  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.PUBLIC, 'favicon.ico'),
    width: 1220,
    height: 600,
    show: !isHiddenLaunch,

    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    win.loadURL(url);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
    win.setMenuBarVisibility(false);
  }

  expressAppClass.win = win;

  // Create a tray icon
  tray = new Tray(path.join(process.env.PUBLIC, 'favicon.ico')); // Replace with your icon path
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => win?.show(),
    },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setToolTip('OroPrinter'); // Tooltip for the tray icon
  tray.setContextMenu(contextMenu);

  // Handle tray icon click
  tray.on('click', () => {
    if (win?.isVisible()) {
      win?.hide();
    } else {
      win?.show();
      win?.focus();
    }
  });

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault(); // Prevent the window from closing
      win?.hide(); // Hide the window instead
    }
  });

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // Keep the process alive so the tray/background service continues running.
});

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  }
});

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

ipcMain.handle('version', () => app.getVersion());

// Handle file read and save
ipcMain.on('download-file', async (event, file) => {
  try {
    console.log('filePath', file);

    // Open Save Dialog
    const { canceled, filePath: savePath } = await dialog.showSaveDialog(
      win as BrowserWindow,
      {
        title: 'Save File',
        defaultPath: path.join(os.homedir(), 'Downloads', file.originalName),
      },
    );

    if (canceled || !savePath) {
      event.reply('download-cancelled', file);
      return;
    }

    // Read the local file and write to the chosen location
    const writeStream = fs.createWriteStream(savePath);

    if (file?.fileUrl) {

      const response = await axios({
        method: 'GET',
        url: file?.fileUrl,
        responseType: 'stream'
      });

      // Pipe the response data to a file
      response.data.pipe(writeStream);

    } else {
      const readStream = fs.createReadStream(file.destination);
      readStream.pipe(writeStream);
    }



    writeStream.on('finish', () => {
      event.reply('download-success', file);
    });

    writeStream.on('error', (error) => {
      event.reply('download-error', error.message, file);
    });
  } catch (error: any) {
    event.reply('download-error', error.message, file);
  }
});

async function pdf2image(file: cardMakerPDF): Promise<cardMakerPDF> {
  return new Promise(async (resolve, reject) => {
    console.time('pdf2image');


    let opts: any = {
      format: 'png',
      scale: 3_508,
      out_dir: path.dirname(file.destination),
      out_prefix: path.basename(
        file.destination,
        path.extname(file.destination),
      ),
      page: null,
      args: {}
    };

    console.log(
      'opts',
      file.originalName as string,
      path.extname(file.originalName as string),
      path.basename(file.originalName as string),
      path
        .basename(
          file.originalName as string,
          path.extname(file.originalName as string),
        )
        .toUpperCase(),
    );

    let filePassword =
      file?.password ||
      path
        .basename(
          file.originalName as string,
          path.extname(file.originalName as string),
        )
        .toUpperCase();

    opts.args.opw = filePassword;
    opts.args.upw = filePassword;

    console.log('pdf.info', file.destination, opts);
    pdf
      .info(file.destination, opts)
      .then((pdfinfo: any) => {


        if (file.cardType == 'aadhaar') {
          opts.scale = Math.floor(Math.abs(pdfinfo.width_in_pts * (240 / 72)));
        } else if (file.cardType == 'nielit_student_id') {
          opts.scale = 5262;
        } else if (file.cardType == 'udid') {
          opts.args.r = file.dpi;
          opts.scale = Math.floor(Math.abs(pdfinfo.height_in_pts * (300 / 72)));
        } else {
          opts.scale = Math.floor(Math.abs(pdfinfo.height_in_pts * (300 / 72)));
        }

        opts = merge({}, opts, file?.opts);

        pdf
          .convert(file.destination, opts)
          .then((res: any) => {
            file.isConverted = true;
            file.opts = opts;
            file.cardBoth = `${opts.out_prefix}-1.png`;
            console.log('Successfully converted', opts);
            console.timeEnd('pdf2image');
            resolve(file);
          })
          .catch((error: any) => {
            console.error(error);
            const errorMessage =
              error.message.match(/Command Line Error:\s*(.*)/)?.[1] ||
              'Unknown error';
            console.log(errorMessage);
            reject(error);
          });
      })
      .catch((error: any) => {
        console.error(error);
        console.timeEnd('pdf2image');
        reject(error);
      });
  });
}

ipcMain.on('pdf2image', async (event, file) => {
  let opts = {
    format: 'jpeg',
    scale: 3_508,
    out_dir: path.dirname(file.destination),
    out_prefix: path.basename(file.destination, path.extname(file.destination)),
    page: null,
  };

  pdf.info(file.destination).then((pdfinfo: any) => {
    opts.scale = pdfinfo.height_in_pts * (600 / 72);

    pdf
      .convert(file.destination, opts)
      .then((res: any) => {
        file.isConverted = true;
        file.opts = opts;
        file.cardBoth = `${opts.out_prefix}-1.jpg`;
        event.reply('pdf2image-success', file);
        console.log('Successfully converted', opts);
      })
      .catch((error: any) => {
        event.reply('pdf2image-failed', file);
        console.error(error);
      });
  });
});

ipcMain.on('cardMaker', async (event, page: cardMaker) => {
  console.log(page);

  if (!isUndefined(page)) {
    page?.pdfs?.filter(async (card, i) => {
      if (card?.isConverted) return true;

      if (['eshram', 'csc_id', 'apaar'].includes(card?.cardType as string) || (card?.cardType == 'abc_apaar' && card.abcTo == 'apaar')) {

        let execFilePath = path.join(pdf.path, 'pdfimages');

        execFile(
          execFilePath,
          [
            '-png',
            card.destination,
            path.join(
              card.path,
              path.basename(card?.filename, path.extname(card?.filename)),
            ),
          ],
          async (error, stdout, stderr) => {
            if (error) {
              console.error('Error executing script:', error);
              card.isConverted = false;
              card.errorMessage =
                'Something went wrong while converting the pdf.';
              // @ts-ignore
              page.pdfs[i] = card;
              event.reply('cardMaker-failure', { page, card });
              return;
            }

            card.isConverted = true;
            event.reply('cardMaker-success', page);
            console.log('cardMaker-success:', card.originalName);

            if (card?.isCropped) return;

            let cardName = path.basename(card?.filename, path.extname(card?.filename));

            // for Eshram Card processing
            if (card?.cardType == 'eshram') {
              let imagePath = path.join(card.path, `${cardName}-000.png`);
              const image = await Jimp.read(imagePath);
              const { width, height } = image.bitmap;

              if (width < 600) {
                card.warningMessage =
                  'Card has very low resolution, it can be cropped incorrectly.';
              }

              card.cardBoth = imagePath;
              if (await extractEshramCard(card.cardBoth, card.path, cardName)) {
                card.cardFront = `${cardName}-front.png`;
                card.cardBack = `${cardName}-back.png`;
                card.isCropped = true;
                if (page.pdfs?.length) {
                  page.pdfs[i] = card;
                }
                event.reply('cardMaker-image-extracted-success', page);
                console.log('cardMaker-image-extracted-success');
              } else {
                event.reply('cardMaker-image-extracted-failure', { page, card });
              }
              // for APAAR Card processing
            } else if ((card?.cardType == 'abc_apaar' && card.abcTo == 'apaar') || card?.cardType == 'apaar') {

              execFile(
                path.join(pdf.path, 'pdftotext'),
                [
                  card.destination,
                  path.join(card.path, `${cardName}-text.txt`)
                ],
                async (error, stdout, stderr) => {

                  if (error) {
                    console.error('Error executing script:', error);
                    card.isConverted = false;
                    card.errorMessage = 'Something went wrong while extracting text from the pdf.';
                    // @ts-ignore
                    page.pdfs[i] = card;
                    event.reply('cardMaker-failure', { page, card });
                    return;
                  }

                  let isApaar = card?.cardType == 'apaar';
                  let photoPath = path.join(card.path, `${cardName}-020.png`);
                  let qr = path.join(card.path, `${cardName}-021.png`);
                  let textFilePath = path.join(card.path, `${cardName}-text.txt`);
                  let textContent = '';

                  if (isApaar) {
                    photoPath = path.join(card.path, `${cardName}-023.png`);
                    qr = path.join(card.path, `${cardName}-024.png`);
                    textFilePath = path.join(card.path, `${cardName}-text.txt`);
                    textContent = '';
                  }

                  if (fs.existsSync(textFilePath)) {
                    textContent = fs.readFileSync(textFilePath, 'utf-8');
                    // fs.unlinkSync(textFilePath);
                  }

                  let arr = textContent.split('\n').filter(el => el.length > 1).map(el => el.replace(/\r/g, ""));
                  let apaarData = {
                    name: arr[3],
                    dob: arr[5],
                    gender: arr[7],
                    abc_id: arr[9].replace(/(.{4})/g, "$1 ").trim(),
                    signed_time: arr[11],
                  }

                  if (isApaar) {
                    const lines = textContent.split('\n').filter(l => l.trim() !== '');
                    apaarData.name = lines[5]?.trim() || '';
                    apaarData.dob = lines[6]?.trim() || '';
                    apaarData.gender = lines[7]?.trim() || '';
                    apaarData.abc_id = lines[8]?.trim().replace(/(\d{4})(?=\d)/g, '$1 ') || '';
                    apaarData.signed_time = lines[10]?.trim() || '';
                  }

                  console.log('Extracted Text:', apaarData);

                  // Load base image 
                  // apaar-front.png
                  let image = await Jimp.read(path.join(os.homedir(), app.getName(), './upload/apaar-front.png'));
                  let fontPath = path.join(os.homedir(), app.getName(), './upload/open-sans-32-black.fnt');
                  let font = await loadFont(fontPath);

                  // setting profile photo
                  const photo = await Jimp.read(photoPath);
                  image.composite(photo, 117.5, 278);

                  // writing texts and positioning them correctly
                  const texts = [
                    { x: 347, y: 278, text: apaarData.name, font },
                    { x: 347, y: 350, text: apaarData.dob, font },
                    { x: 347, y: 409, text: apaarData.gender, font },
                    { x: 330, y: 515, font, text: apaarData.abc_id, scale: 42 / 32 }, // big/bold
                  ];

                  // Print texts
                  for (const t of texts) {
                    const tempImage = new Jimp({ width: 1000, height: 100, color: 0x00000000 });
                    tempImage.print({ font: t.font, x: 0, y: 0, text: t.text });
                    tempImage.scale(t?.scale ? t.scale : 1);
                    image.composite(tempImage, t.x, t.y);
                  }

                  // Position QR code
                  const qrImage = await Jimp.read(qr);
                  qrImage.resize({ w: 256, h: 256 }); // resize to fit
                  image.composite(qrImage, 705, 300);

                  // Save final result
                  await image.write(`${path.join(card.path, `${cardName}-front`)}.png`);

                  card.cardBoth = `${cardName}-front.png`;
                  card.cardFront = `${cardName}-front.png`;
                  card.cardBack = `apaar-back.png`;
                  card.isCropped = true;
                  if (page.pdfs?.length) {
                    page.pdfs[i] = card;
                  }
                  event.reply('cardMaker-image-extracted-success', page);
                  console.log('cardMaker-image-extracted-success');

                  await sleep(1000);
                  range(0, 30).map((el) => {
                    let filePath = path.join(card.path, `${cardName}-${String(el).padStart(3, '0')}.png`);
                    if (fs.existsSync(filePath)) {
                      try {
                        fs.unlinkSync(filePath);
                        console.log(`Deleted: ${cardName}-${String(el).padStart(3, '0')}.png`);
                      } catch (err) { err = !err; }
                    }
                  });

                }
              );



            } else if (card?.cardType == 'csc_id') {
              try {

                let baseImagePath = path.join(card.path, "csc-front-template.png");
                let photoPath = path.join(card.path, `${cardName}-002.png`);
                let qrPath = path.join(card.path, `${cardName}-003.png`);
                let fontPath = path.join(os.homedir(), app.getName(), './upload/open-sans-32-black.fnt');

                // Loading images
                const image = await Jimp.read(baseImagePath);
                const photo = await Jimp.read(photoPath);
                const qr = await Jimp.read(qrPath);
                const font = await loadFont(fontPath);
                let qrText: string[] = ["ownerName", "CSC ID", "KIOSK name", "KIOSK address", "Mobile number"];

                // setting profile photo
                photo.resize({ w: 231, h: 233 });
                image.composite(photo, 88, 206);

                let qrcode = new QrCodeReader();
                qrcode.callback = function (err: any, value: { result: string }) {
                  if (err) console.error(err);
                  qrText = value.result.split("|");
                  console.log('qrText', qrText);
                };
                // Decoding the QR code
                qrcode.decode(qr.bitmap);

                // writing texts and positioning them correctly
                type textsType = { x: number, y: number, text?: string, font: any, scale?: number };
                const texts: textsType[] = [
                  { x: 408, y: 156, font },
                  { x: 631, y: 210, font, scale: 22 / 32 },
                  { x: 631, y: 250, font, scale: 25 / 32 },
                  { x: 631, y: 294, font, scale: 26 / 32 },
                  { x: 631, y: 338, font, scale: 25 / 32 },
                ];

                texts.map((t, i) => {
                  t.text = qrText[i] || "";
                  t.text = i === 0 ? t.text.toUpperCase() : t.text;
                  t.text = i === 4 ? t.text : t.text;
                  return t;
                });

                // Print texts
                texts.forEach((t, i) => {
                  const tempImage = new Jimp({
                    width: 1000,
                    height: 100,
                    color: 0x00000000,
                  });
                  if (i === 0) {
                    tempImage.print({
                      font: t.font, x: 0, y: 0, text: t.text as string, cb: (xy) => {
                        console.log(xy);
                        tempImage.scan(0, 0, xy.x, xy.y, function (xx, yy, idx) {
                          // Apply tint manually
                          tempImage.bitmap.data[idx + 0] = 0;   // Red
                          tempImage.bitmap.data[idx + 1] = 110; // Green
                          tempImage.bitmap.data[idx + 2] = 170; // Blue
                        });
                      }
                    });
                  } else {
                    tempImage.print({ font: t.font, x: 0, y: 0, text: t.text as string });
                  }
                  tempImage.scale(t?.scale ? t.scale : 1);
                  image.composite(tempImage, t.x, t.y);
                })

                // Generate QR code
                const qrPngBuffer = await QRCodeGenerator.toBuffer(
                  JSON.stringify(qrText.join("|")),
                  {
                    type: "png",
                    errorCorrectionLevel: "M",
                    margin: 5,
                    width: 154,
                  }
                );
                const qrImage = await Jimp.read(qrPngBuffer);
                image.composite(qrImage, 816, 444); // Position QR code

                // Save final result
                await image.write(`${path.join(card.path, `${cardName}-front`)}.png`);

                card.cardBoth = `${cardName}-front.png`;
                card.cardFront = `${cardName}-front.png`;
                card.cardBack = `csc-back.png`;
                card.isCropped = true;
                if (page.pdfs?.length) {
                  page.pdfs[i] = card;
                }
                event.reply('cardMaker-image-extracted-success', page);
                console.log('cardMaker-image-extracted-success');

                console.log("✅ CSC Card Done — saved to");
              } catch (error) {
                console.error('❌Error executing script:', error);
                card.isConverted = false;
                card.errorMessage = 'Something went wrong while extracting text from the pdf.';
                // @ts-ignore
                page.pdfs[i] = card;
                event.reply('cardMaker-failure', { page, card });
                return;
              }
            }
          }
        );
      } else if (['abha', 'ayushman', 'voter_new', 'abc_apaar', 'udid'].includes(card?.cardType as string)) {

        if (card?.cardType == 'udid') {
          card.dpi = 300;
        }

        pdf2image(card)
          .then(async (newCard: cardMakerPDF) => {
            // @ts-ignore
            page.pdfs[i] = card = newCard;
            event.reply('cardMaker-success', page);
            console.log('pdf2image cardMaker-success:', card.originalName);

            if (card?.isCropped) return;

            let cardName = path.basename(
              card?.filename,
              path.extname(card?.filename),
            );
            let imagePath = path.join(card.path, card.cardBoth as string);

            card.cardFront = `${cardName}-front.png`;
            const frontOutputPath = path.join(card.path, card.cardFront);
            const frontCropOptions = {
              left: 44,
              top: 44,
              width: 1848,
              height: 1131,
            };

            card.cardBack = `${cardName}-back.png`;
            const backOutputPath = path.join(card.path, card.cardBack);
            const backCropOptions = {
              left: 44,
              top: 1223,
              width: 1848,
              height: 1131,
            };

            if (card?.cardType == 'ayushman') {
              frontCropOptions.left = 438;
              frontCropOptions.top = 397;
              frontCropOptions.width = 1272;
              frontCropOptions.height = 638;

              backCropOptions.left = 1856;
              backCropOptions.top = 397;
              backCropOptions.width = 1270;
              backCropOptions.height = 638;
            } else if (card.cardType == 'voter_new') {
              frontCropOptions.left = 136;
              frontCropOptions.top = 396;
              frontCropOptions.width = 1019;
              frontCropOptions.height = 640;

              backCropOptions.left = 1363;
              backCropOptions.top = 396;
              backCropOptions.width = 1019;
              backCropOptions.height = 640;
            } else if (card.cardType == 'abc_apaar' && card.abcTo == 'abc') {
              frontCropOptions.left = 589;
              frontCropOptions.top = 15;
              frontCropOptions.width = 1296;
              frontCropOptions.height = 1009;
            } else if (card.cardType == 'udid') {
              frontCropOptions.left = 216;
              frontCropOptions.top = 1139;
              frontCropOptions.width = 1046;
              frontCropOptions.height = 653;

              backCropOptions.left = 216;
              backCropOptions.top = 212;
              backCropOptions.width = 1046;
              backCropOptions.height = 653;
            }


            try {
              await cropImage(imagePath, frontOutputPath, frontCropOptions);
              if (card.cardType == 'abc_apaar' && card.abcTo == 'abc') {
                card.cardBack = `abc-back.png`;
              } else {
                await cropImage(imagePath, backOutputPath, backCropOptions);
              }
              card.isCropped = true;
              if (page.pdfs?.length) {
                page.pdfs[i] = card;
              }
              event.reply('cardMaker-image-extracted-success', page);
              console.log('cardMaker-image-extracted-success');
            } catch (error) {
              event.reply('cardMaker-image-extracted-failure', { page, card });
            }
          })
          .catch((error) => {
            console.log('ddddddddddddddddddddddddddddd', error);
            card.isConverted = false;
            card.errorMessage =
              error.message.match(/Command Line Error:\s*(.*)/)?.[1] ||
              'Something went wrong while converting the pdf.';
            if (page?.pdfs) {
              page.pdfs[i] = card;
            }
            event.reply('cardMaker-failure', { page, card });
          });
      } else if (['aadhaar', 'pan', 'nielit_student_id', 'ration'].includes(card?.cardType as string)) {
        console.log('aadhaar', card);

        pdf2image(card)
          .then(async (newCard: cardMakerPDF) => {
            // @ts-ignore
            page.pdfs[i] = card = newCard;
            event.reply('cardMaker-success', page);
            console.log('pdf2image cardMaker-success:', card.originalName);

            if (card?.isCropped) return;

            let cardName = path.basename(
              card?.filename,
              path.extname(card?.filename),
            );
            let imagePath = path.join(card.path, card.cardBoth as string);

            card.cardFront = `${cardName}-front.png`;
            card.cardBack = `${cardName}-back.png`;

            try {
              if (card?.cardType == 'aadhaar') {
                await extractAadhaarCard(card);
              } else if (card?.cardType == 'nielit_student_id') {
                await extractNielitStudentIDCard(card);
              } else if (card?.cardType == 'ration') {
                await extractRationCard(card);
              } else if (card?.cardType == 'pan') {
                card.cardFront = `${cardName}-front.png`;
                const frontOutputPath = path.join(card.path, card.cardFront);
                const frontCropOptions = {
                  left: 0,
                  top: 0,
                  width: 0,
                  height: 0,
                };

                card.cardBack = `${cardName}-back.png`;
                const backOutputPath = path.join(card.path, card.cardBack);
                const backCropOptions = {
                  left: 0,
                  top: 0,
                  width: 0,
                  height: 0,
                };

                await extractPanCard(card);
                console.log('pan card cropping and provider ', card.provider);

                if (card.provider == 'uti') {
                  frontCropOptions.left = 84;
                  frontCropOptions.top = 2678;
                  frontCropOptions.width = 1015;
                  frontCropOptions.height = 636;

                  backCropOptions.left = 1245;
                  backCropOptions.top = 2678;
                  backCropOptions.width = 1015;
                  backCropOptions.height = 636;
                } else if (card.provider == 'nsdl') {
                  frontCropOptions.left = 202;
                  frontCropOptions.top = 2629;
                  frontCropOptions.width = 971;
                  frontCropOptions.height = 610;

                  backCropOptions.left = 1201;
                  backCropOptions.top = 2629;
                  backCropOptions.width = 971;
                  backCropOptions.height = 610;
                }

                await cropImage(imagePath, frontOutputPath, frontCropOptions);
                await cropImage(imagePath, backOutputPath, backCropOptions);
              }

              card.isCropped = true;
              if (page.pdfs?.length) {
                page.pdfs[i] = card;
              }
              event.reply('cardMaker-image-extracted-success', page);
              console.log('cardMaker-image-extracted-success');
            } catch (error) {
              event.reply('cardMaker-image-extracted-failure', { page, card });
            }
          })
          .catch((error) => {
            card.isConverted = false;
            card.errorMessage =
              error.message.match(/Command Line Error:\s*(.*)/)?.[1] ||
              'Something went wrong while converting the pdf.';
            // @ts-ignore
            page.pdfs[i] = card;
            event.reply('cardMaker-failure', { page, card });
          });
      } else if (card?.cardType == 'custom') {
        // @ts-ignore
        page.pdfs[i] = card;
        event.reply('cardMaker-success', page);
        console.log('pdf2image cardMaker-success:', card.originalName);

        await sleep(500);
        card.isCropped = true;
        event.reply('cardMaker-image-extracted-success', page);
        console.log('cardMaker-image-extracted-success');
      }
    });
  }
  return;
});

ipcMain.on('cardMakerCreatePDF', async (event, page: cardMaker) => {
  page.filename = `mp-cardmaker-${last(page.id.split('-'))}.pdf`;
  page.outputFile = path.join(page?.path as string, page.filename);
  await sleep(500);
  let cardsPDF = await createA4WithImagesPDF(page);
  console.log('cardsPDF', cardsPDF);
  if (cardsPDF) {
    event.reply('cardMakerCreatePDF-success', page);
  } else {
    event.reply('cardMakerCreatePDF-failure', page);
  }
});

ipcMain.on('printFile', async (event, file: any) => {
  print(file.path, { ...file.options, ...{ silent: true } })
    .then(() => {
      console.log(`Printed file: ${file}`);
    })
    .catch((err) => {
      console.error(`Error printing file: ${file}`, err);
    });
});

ipcMain.on(
  'generate-pdf',
  async (
    event,
    obj: {
      htmlContent: string;
      head: string;
      printSheet?: boolean;
      filename?: string;
      saveAs?: 'pdf' | 'png' | 'jpg' | 'tiff';
    },
  ) => {

    const win = new BrowserWindow({
      show: isDev,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });
    const id: string = crypto.randomUUID().substring(0, 8);

    try {
      let cssFiles: string[] = [];

      if (!isDev) {
        console.log('Running in production mode');
        const cssDir = path.join(
          process.resourcesPath,
          'app.asar.unpacked/dist/assets',
        );
        const files = fs.readdirSync(cssDir);

        // Read all .css files
        cssFiles = files
          .filter((file) => file.endsWith('.css'))
          .map((file) => fs.readFileSync(path.join(cssDir, file), 'utf8'));
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            ${cssFiles.map((el, i) => `<style type="text/css" id="inserted-${i}">${el}</style>`).join('\n')}
            ${obj.head}
          </head>
          <body>
            ${obj.htmlContent}
          </body>
        </html>
      `;

      await win.loadURL(
        `data:text/html;charset=UTF-8,${encodeURIComponent(htmlContent)}`,
      );

      await sleep(500);


      let data: Buffer = '' as unknown as Buffer;
      const tempFolder = path.join(os.homedir(), app.getName(), './temp/')
      const tempFile = path.join(tempFolder, `mp-temp-${id}.pdf`);

      const pdfOptions = {
        color: true,
        margins: {
          marginType: 'printableArea' as 'printableArea', // 'none', 'printableArea', or custom
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
        pageSize: 'A4' as 'A4',
        printBackground: true,
        printSelectionOnly: false,
        landscape: false,
      };

      data = await win.webContents.printToPDF(pdfOptions);

      // Save to temp
      fs.writeFileSync(tempFile, data);

      if (obj?.printSheet) {
        print(tempFile, { silent: false, printDialog: true })
          .then(() => {
            console.log(`Printed file: ${tempFile}`);
            win.close();
            event.reply('generate-pdf-reply', {
              success: true,
              message: 'Photosheet is send to print.',
            });
            return;
          })
          .catch((err) => {
            console.error(`Error printing file: ${tempFile}`, err);
            win.close();
            event.reply('generate-pdf-reply', {
              success: false,
              message: 'something went wrong during sending to print.',
            });
            return;
          });
      }

      if (!!obj?.saveAs) {

        console.log('Saving as ', obj.saveAs);
        let defaultExt;
        let defaultTitle;

        const { canceled, filePath } = await dialog.showSaveDialog(
          win as BrowserWindow,
          {
            title: 'Save File',
            defaultPath: path.join(
              os.homedir(),
              'Downloads',
              `${obj?.filename}.${obj?.saveAs}` || `mp-photosheet-${crypto.randomUUID().substring(0, 8)}.${obj?.saveAs}`,
            ),
          },
        );

        win.close(); // There is no need to keep the window open after getting the PDF data and showing the save dialog

        if (canceled) {
          event.reply('generate-pdf-reply', {
            success: false,
            message: 'Canceled by user',
          });
          return;
        };

        if (obj?.saveAs == 'pdf') {

          defaultExt = '.pdf';
          defaultTitle = "Save PDF";

          if (!canceled || filePath) {
            fs.writeFileSync(filePath, data);
          }

          event.reply('generate-pdf-reply', {
            success: true,
            message: 'PDF saved successfully!',
          });

          fs.unlinkSync(tempFile);

        } else if (['jpg', 'png', 'tiff'].includes(obj?.saveAs?.toLowerCase())) {

          switch (obj?.saveAs) {
            case 'png':
              defaultExt = '.png';
              defaultTitle = "Save PNG";
              break;
            case 'jpg':
              defaultExt = '.jpg';
              defaultTitle = "Save JPG";
              break;
            case 'tiff':
              defaultExt = '.tiff';
              defaultTitle = "Save TIFF";
              break;

            default:
              break;
          }

          let opts = {
            format: obj?.saveAs,
            scale: 7016,
            out_dir: path.dirname(filePath),
            out_prefix: path.basename(filePath, path.extname(filePath)),
            page: null,
            args: { r: 600 },
          };

          pdf.convert(tempFile, opts)
            .then(() => {
              event.reply('generate-pdf-reply', {
                success: true,
                message: 'File saved successfully!',
              });
            })
            .catch((error: any) => {
              event.reply('generate-pdf-reply', {
                success: false,
                message: 'Failed to save file!',
              });
              console.error(error);
            })
            .finally(() => {
              fs.unlinkSync(tempFile);
            });

        }


      }


    } catch (error) {
      console.error(error);
    }
  },
);

const fsPromise = require('fs').promises;
ipcMain.handle('read-css-file', async (event, fileUrl) => {
  try {
    // Convert file:// URL to filesystem path
    const filePath = fileUrl.replace('file://', '');
    // Read the CSS file from app.asar
    const content = await fsPromise.readFile(filePath, 'utf-8');
    return content;
  } catch (error: any) {
    throw new Error(`Failed to read CSS file: ${error.message}`);
  }
});
