
// const express = require('express')
// import { getPrinters, getDefaultPrinter } from 'pdf-to-printer';
// const fileUpload = require('express-fileupload');
// import path from 'path';
// import os from 'os';
// import multer from 'multer';


// import type { Printer } from '../declarations/PrintersList'

// export class MainComputerClass {

//   static app = express()
//   static port = 9457
//   static server: any = ''
//   static isServerRunning = false
//   static uploadPath = path.join(os.homedir(), '/');
//   static upload = multer({ dest: MainComputerClass.uploadPath })

//   static startServer(): boolean {
//     console.log('staring the server...')
//     let o = false;
//     this.middlewareInit()
//     this.routesInit()
//     this.server = this.app.listen(this.port, () => {
//       o = true;
//       this.isServerRunning = true
//       console.log(`Main Computer Server is Started ${this.port}`)
//     })
//     return o;
//   }

//   static stopServer(): void {
//     console.log(`Main Computer Server is stopped ${this.port}`)
//     this.server.close();
//     this.isServerRunning = false;
//   }

//   static middlewareInit(): void {
//     this.app.use(fileUpload())
//     this.app.use(express.json())
//     this.app.use(express.urlencoded({ extended: true }))
//   }

//   static routesInit(): void {
//     this.app.get('/api/v1/printers/', (req, res) => {
//       const printers = MainComputerClass.getPrinters();
//       console.log('/api/v1/printers/', printers, Date.now());
//       // res.json(printers);
//       getPrinters().then((resp) => {
//         res.json(resp);
//       })
//     });

//     this.app.post('/api/v1/uploadFile', this.uploadFile)
//     this.app.post('/profile', this.upload.single('avatar'), this.profile)

//     this.app.get('/popo', function (req, res) {
//       res.send(`<html>
//             <body>
//               <form ref='uploadForm'
//                 id='uploadForm'
//                 action='/profile'
//                 method='post'
//                 encType="multipart/form-data">
//                   <input type="file" name="sampleFile" />
//                   <input type='submit' value='Upload!' />
//               </form>
//             </body>
//           </html>`);
//     });
//   }

//   static printTheFile(fileName: string, options?: {}) {

//   }

//   static profile(req, res, next) {
//     console.log(req.file)
//     // req.file is the `avatar` file
//     // req.body will hold the text fields, if there were any
//   }

//   static uploadFile(req: any, res: any) {

//     let fileToPrint;

//     if (!req.files || Object.keys(req.files).length === 0) {
//       return res.status(400).send('No files were uploaded.');
//     }

//     // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
//     fileToPrint = req.files.fileToPrint;

//     try {

//       // Use the mv() method to place the file somewhere on your server
//       fileToPrint.mv(this.uploadPath + fileToPrint.name, function (err: any) {
//         if (err)
//           return res.status(500).send(err);
//         res.send({ status: 'success' });
//       });

//     } catch (error) {
//       console.log(error);
//     }

//   }

//   static getPrinters(): { status: 'failed' | 'success', printers: Printer[] } {

//     console.log(`getPrinters Main Computer Printers list...`)
//     const o: { status: 'failed' | 'success', printers: Printer[] } = { status: 'failed', printers: [] };
//     getPrinters().then((resp) => {
//       o.status = 'success'
//       o.printers = resp;
//       return o;
//     }).catch((e) => {
//       console.error(e)
//       o.status = 'failed';
//       o.printers = [];
//       return o;
//     })
//     return o;
//   }

// }
