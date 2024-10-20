import express from "express";
import path from "path";
import logger from "morgan";
import bodyParser from "body-parser";
import http from "http";
import createError from "http-errors";
import { expressPort } from "../../package.json";
import multer from 'multer';
import mime from 'mime';
import crypto from 'crypto';
import { JSONFilePreset } from 'lowdb/node'
import type { defaultDataType, MutlerFileResp } from './express-app-d'
import { getPrinters, getDefaultPrinter, print } from 'pdf-to-printer';
import fs from 'node:fs'

const expressApp = express();
const router = express.Router();


const defaultData: defaultDataType = {
  printers: [],
  toPrintsCommands: []
}

var db: any;

(async function () {
  db = await JSONFilePreset<defaultDataType>(path.join(__dirname, '/printers.json'), defaultData)
})()

var dir = [
  path.join(__dirname, "/upload/pdf"),
  path.join(__dirname, "/public/")
]
dir.map(el => (!fs.existsSync(el)) && fs.mkdirSync(el, { recursive: true }))

var storage = multer.diskStorage({
  destination: dir[0],
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err: any, raw: any) {
      if (err) return cb(err, file.originalname)
      cb(null, raw.toString('hex') + path.extname(file.originalname))
    })
  }
})
const upload = multer({ storage: storage });

expressApp.get('/popo', function (req, res) {
  res.send(`<html>
            <body>
              <form ref='uploadForm'
                id='uploadForm'
                action='/upload'
                method='post'
                encType="multipart/form-data">
                  <input type="file" name="avatar" />
                  <input type='submit' value='Upload!' />
              </form>
            </body>
          </html>`);
});
expressApp.post('/upload', upload.single('avatar'), async (req, res, next) => {
  console.log('uploaded file : ', req?.file)
  if (req?.file) {
    await db.data.toPrintsCommands.push(
      {
        ...req.file,
        ...{
          addedTime: Date.now(),
          isDone: false,
        }
      }
    )
    await db.write()
  }
  if (req.file?.path) {
    print(req.file?.path).then(() => {
      console.log(`Printed file: ${req.file?.path}`)
    }).catch(err => {
      console.error(`Error printing file: ${req.file?.path}`, err)
    })
  }
  res.json(req?.file);
  // req.file is the `avatar` file
  // req.body will hold the text fields, if there were any
})

expressApp.get('/commands', async (req, res) => {
  res.json(await db.data.toPrintsCommands)
})

router.get('/', (req: any, res: any) => {
  res.send('Welcome')
})

expressApp.set("port", expressPort);

expressApp.use(logger("dev"));
expressApp.use(bodyParser.json());
expressApp.use(bodyParser.urlencoded({ extended: false }));

expressApp.use(express.static(dir[1]));
expressApp.use(express.static(dir[0]));

expressApp.use("/", router);
expressApp.use((_req: any, _res: any, next: any) => next(createError(404)));
expressApp.use((err: any, req: any, res: any, _next: any) => {
  res.locals.title = "error";
  res.locals.message = err.message;
  res.locals.error = req.expressApp.get("env") === "development" ? err : {};

  res.status(err.status || 500).send("error");
});

const server = http.createServer(expressApp);

function handleServerError(error: any) {
  if (error.syscall !== "listen") throw error;

  const bind = typeof expressPort === "string" ? `Pipe ${expressPort}` : `Port ${expressPort}`;
  switch (error.code) {
    case "EACCES":
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

function shutdown() {
  console.log("Shutting down Express server...");
  server.close();
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

server.listen(expressPort);
server.on("error", handleServerError);
server.on("listening", () => console.log(`Listening on: ${expressPort}`));
server.on("close", () => console.log("Express server closed."));
