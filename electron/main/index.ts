import { app, BrowserWindow, shell, ipcMain, dialog, Tray, Menu, } from 'electron';
import { release } from 'os';
import path from 'path';
import os from 'os'
import fs from 'fs'
import axios from 'axios'
import { address } from 'ip'
// @ts-ignore
import pdf from 'pdf-poppler'
import { execFile } from 'child_process'
import { Jimp } from "jimp";
import { intToRGBA } from "@jimp/utils";
import { sleep } from '../../helpers/both'

import { isUndefined, last } from 'lodash';

import expressAppClass from './express-app'
import type { cardMaker, cardMakerPDF } from './express-app-d'
import { createA4PDFwithEshremCards, createA4WithImagesPDF, cropImage, extractEshramCard, extractAadhaarCard } from './../helpers/cardmakers'

process.env.DIST_ELECTRON = path.join(__dirname, '..');
process.env.DIST = path.join(process.env.DIST_ELECTRON, '../dist');
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? path.join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST;

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
let tray = null;
// Here, you can also use other preload
const preload = path.join(__dirname, '../preload/index.js');
const url = process.env.VITE_DEV_SERVER_URL;
const indexHtml = path.join(process.env.DIST, 'index.html');


const dir = [
  path.join(os.homedir(), app.getName(), "/public/"),
  path.join(os.homedir(), app.getName(), "/upload/pdf/"),
  path.join(os.homedir(), app.getName(), "/upload/image/"),
  path.join(os.homedir(), app.getName(), "/db/"),
]

dir.map(el => (!fs.existsSync(el)) && fs.mkdirSync(el, { recursive: true }))

app.setLoginItemSettings({
  openAtLogin: true,
  args: ['--hidden']
});


async function createWindow() {

  if (!expressAppClass.isServerRunning) {
    expressAppClass.startServer()
  }

  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.PUBLIC, 'favicon.ico'),
    width: 1220,
    height: 600,

    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    // electron-vite-vue#298
    win.loadURL(url);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
    win.setMenuBarVisibility(false)
  }

  expressAppClass.win = win;

  // Create a tray icon
  tray = new Tray(path.join(process.env.PUBLIC, 'favicon.ico')); // Replace with your icon path
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        win?.show();
      },
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);
  tray.setToolTip('MotionPrinter');
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

  win.on("close", (event) => {
    // @ts-ignore
    if (!app?.isQuitting) {
      event.preventDefault(); // Prevent the window from closing
      win?.hide(); // Hide the window instead
    }
    // win = null;
    // expressAppClass.shutdown();
  });

  // Quit the app when the tray icon is right-clicked and "Quit" is selected
  app.on('before-quit', () => {
    // @ts-ignore
    app.isQuitting = true;
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
  // win = null;
  // if (process.platform !== 'darwin') app.quit();
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

ipcMain.on('ping', () => {
})

ipcMain.on('reloadDatabase', () => {
})

ipcMain.handle('version', () => app.getVersion());

ipcMain.on("searchOnlinePCs", (event) => {
  event.sender.send("eventFromMain", 'someReply');
})


// Handle file read and save
ipcMain.on('download-file', async (event, file) => {

  try {
    console.log('filePath', file)

    // Open Save Dialog
    const { canceled, filePath: savePath } = await dialog.showSaveDialog(win as BrowserWindow, {
      title: 'Save File',
      defaultPath: path.join(os.homedir(), 'Downloads', file.originalName),
    });

    if (canceled || !savePath) {
      event.reply('download-cancelled', file);
      return;
    }

    // Read the local file and write to the chosen location
    const readStream = fs.createReadStream(file.destination);
    const writeStream = fs.createWriteStream(savePath);

    readStream.pipe(writeStream);

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
  return new Promise((resolve, reject) => {
    let opts = {
      format: 'png',
      scale: 3_508,
      out_dir: path.dirname(file.destination),
      out_prefix: path.basename(file.destination, path.extname(file.destination)),
      page: null,
      args: {}
    };

    if (file?.password) {
      opts.args = {
        'opw': file.password || path.basename(file.destination, path.extname(file.destination)).toUpperCase()
      }
    }

    pdf.info(file.destination, opts)
      .then((pdfinfo: any) => {

        opts.scale = Math.abs(pdfinfo.height_in_pts * (300 / 72))

        pdf.convert(file.destination, opts)
          .then((res: any) => {
            file.isConverted = true;
            file.opts = opts;
            file.cardBoth = `${opts.out_prefix}-1.png`
            console.log('Successfully converted', opts);
            resolve(file);
          })
          .catch((error: any) => {
            console.error(error);
            const errorMessage = error.message.match(/Command Line Error:\s*(.*)/)?.[1] || "Unknown error";
            console.log(errorMessage);
            reject(error);
          })


      })
      .catch((error: any) => {
        console.error(error);
        reject(error);
      })
  })
}

ipcMain.on('pdf2image', async (event, file) => {

  let opts = {
    format: 'jpeg',
    scale: 3_508,
    out_dir: path.dirname(file.destination),
    out_prefix: path.basename(file.destination, path.extname(file.destination)),
    page: null
  }

  pdf.info(file.destination)
    .then((pdfinfo: any) => {

      opts.scale = pdfinfo.height_in_pts * (600 / 72)

      pdf.convert(file.destination, opts)
        .then((res: any) => {
          file.isConverted = true;
          file.opts = opts;
          file.cardBoth = `${opts.out_prefix}-1.jpg`
          event.reply('pdf2image-success', file);
          console.log('Successfully converted', opts);
        })
        .catch((error: any) => {
          event.reply('pdf2image-failed', file);
          console.error(error);
        })

    });


});

ipcMain.on("eshrem", async (event, page: cardMaker) => {
  let eshremPage = await createA4PDFwithEshremCards(page)
  console.log('eshremPage', eshremPage)
  event.reply('eshrem-success', eshremPage);
})


ipcMain.on("cardMaker", async (event, page: cardMaker) => {

  console.log(page)

  if (!isUndefined(page)) {
    page?.pdfs?.filter(async (card, i) => {

      if (card?.isConverted) return true;

      if (card?.cardType == 'eshram') {

        execFile(
          path.join(pdf.path, 'pdfimages'),
          [
            '-png',
            card.destination,
            path.join(card.path, path.basename(card?.filename, path.extname(card?.filename)))
          ],
          async (error, stdout, stderr) => {

            if (error) {
              console.error("Error executing script:", error);
              card.isConverted = false;
              card.errorMessage = 'Something went wrong while converting the pdf.'
              // @ts-ignore
              page.pdfs[i] = card;
              event.reply('cardMaker-failure', { page, card });
              return;
            }

            card.isConverted = true;
            event.reply('cardMaker-success', page);
            console.log("cardMaker-success:", card.originalName);

            if (card?.isCropped) return;

            let cardName = path.basename(card?.filename, path.extname(card?.filename))
            let imagePath = path.join(card.path, `${cardName}-000.png`)

            const image = await Jimp.read(imagePath);
            const { width, height } = image.bitmap;

            if (width < 600) {
              card.warningMessage = 'Card has very low resolution, it can be cropped incorrectly.'
            }

            card.cardBoth = imagePath
            if (await extractEshramCard(card.cardBoth, card.path, cardName)) {
              card.cardFront = `${cardName}-front.png`
              card.cardBack = `${cardName}-back.png`
              card.isCropped = true;
              if (page.pdfs?.length) {
                page.pdfs[i] = card;
              }
              event.reply('cardMaker-image-extracted-success', page);
              console.log("cardMaker-image-extracted-success");
            } else {
              event.reply('cardMaker-image-extracted-failure', { page, card });
            }

          }
        );

      } else if (card?.cardType == 'abha') {

        pdf2image(card)
          .then(async (newCard: cardMakerPDF) => {

            // @ts-ignore
            page.pdfs[i] = card = newCard;
            event.reply('cardMaker-success', page);
            console.log("pdf2image cardMaker-success:", card.originalName);

            if (card?.isCropped) return;

            let cardName = path.basename(card?.filename, path.extname(card?.filename))
            let imagePath = path.join(card.path, card.cardBoth as string);

            card.cardFront = `${cardName}-front.png`
            const frontOutputPath = path.join(card.path, card.cardFront);
            const frontCropOptions = {
              left: 44,
              top: 44,
              width: 1892,
              height: 1131,
            };

            card.cardBack = `${cardName}-back.png`
            const backOutputPath = path.join(card.path, card.cardBack);
            const backCropOptions = {
              left: 44,
              top: 1223,
              width: 1892,
              height: 1131,
            };

            try {
              await cropImage(imagePath, frontOutputPath, frontCropOptions);
              await cropImage(imagePath, backOutputPath, backCropOptions)
              card.isCropped = true;
              if (page.pdfs?.length) {
                page.pdfs[i] = card;
              }
              event.reply('cardMaker-image-extracted-success', page);
              console.log("cardMaker-image-extracted-success");
            } catch (error) {
              event.reply('cardMaker-image-extracted-failure', { page, card });
            }


          })
          .catch((error) => {
            console.log('ddddddddddddddddddddddddddddd', error);
            card.isConverted = false;
            card.errorMessage = error.message.match(/Command Line Error:\s*(.*)/)?.[1] || 'Something went wrong while converting the pdf.';
            // @ts-ignore
            page.pdfs[i] = card;
            event.reply('cardMaker-failure', { page, card });
          });
      } else if (card?.cardType == 'aadhaar') {

        pdf2image(card)
          .then(async (newCard: cardMakerPDF) => {
            // @ts-ignore
            page.pdfs[i] = card = newCard;
            event.reply('cardMaker-success', page);
            console.log("pdf2image cardMaker-success:", card.originalName);

            if (card?.isCropped) return;

            let cardName = path.basename(card?.filename, path.extname(card?.filename))
            let imagePath = path.join(card.path, card.cardBoth as string);

            card.cardFront = `${cardName}-front.png`
            card.cardBack = `${cardName}-back.png`

            try {
              await extractAadhaarCard(card)
              card.isCropped = true;
              if (page.pdfs?.length) {
                page.pdfs[i] = card;
              }
              event.reply('cardMaker-image-extracted-success', page);
              console.log("cardMaker-image-extracted-success");
            } catch (error) {
              event.reply('cardMaker-image-extracted-failure', { page, card });
            }


          })
          .catch((error) => {
            card.isConverted = false;
            card.errorMessage = error.message.match(/Command Line Error:\s*(.*)/)?.[1] || 'Something went wrong while converting the pdf.';
            // @ts-ignore
            page.pdfs[i] = card;
            event.reply('cardMaker-failure', { page, card });
          });

      }


    })
  }
  return;
});

ipcMain.on("cardMakerCreatePDF", async (event, page: cardMaker) => {
  page.filename = `mp-cardmaker-${last(page.id.split('-'))}.pdf`
  page.outputFile = path.join(page?.path as string, page.filename)
  await sleep(500)
  let cardsPDF = await createA4WithImagesPDF(page)
  console.log('cardsPDF', cardsPDF)
  if (cardsPDF) {
    event.reply('cardMakerCreatePDF-success', page);
  } else {
    event.reply('cardMakerCreatePDF-failure', page);
  }
})
