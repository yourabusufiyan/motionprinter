import express from "express";
import cors from 'cors'
import { join, extname } from "path";
import logger from "morgan";
import bodyParser from "body-parser";
import http from "http";
import createError from "http-errors";
import { expressPort } from "../../package.json";
import crypto from 'crypto';
import { print } from 'pdf-to-printer';
import { existsSync, mkdirSync } from 'node:fs'
import os from 'node:os'
import { Low } from 'lowdb'
import { JSONFileSyncPreset } from 'lowdb/node';
import { getPrinters, getDefaultPrinter } from 'pdf-to-printer'
import { pick, toString, dropRight, floor, last, concat, uniqBy, find, findIndex, sortBy, omit } from "lodash";
import ip from 'ip'
import axios from 'axios'
import fileUpload from 'express-fileupload'
import { v7 as uuidv7 } from 'uuid';


import { computerProfile } from './../../src/declarations/LordStore.d';
import type { Request, Response, NextFunction } from 'express';
import type { lordData, connectedPC } from './../../src/declarations/LordStore.d';
import type { uploadFile, toPrintsCommandsFile } from './express-app-d'
import type { Printer, PrintOptions } from 'pdf-to-printer'
import type { UploadedFile } from 'express-fileupload'

import { app } from 'electron'
import { Chat, Inbox, Message } from "../../src/declarations/inbox";

class expressAppClass {

  static app = express()
  static router = express.Router();
  static port = 9457
  static server: any = ''
  static isServerRunning = false
  static ip = ip.address()
  static dir = [
    join(os.homedir(), app.getName(), "./public/"),
    join(os.homedir(), app.getName(), "./upload/"),
    join(os.homedir(), app.getName(), "./db/")
  ]
  static computerName: string | undefined = process.env.COMPUTERNAME
  static dbName: string = `lordPrinter-${this.ip}.json`
  static dbPath: string = join(this.dir[2], this.dbName)
  static db = JSONFileSyncPreset<lordData>(this.dbPath, this.defaultLordData());

  static inboxDBPath: string = join(this.dir[2], expressAppClass.db.data.id.toString() + '.json')
  static inboxDB = JSONFileSyncPreset<Inbox>(this.inboxDBPath, this.defaultInbox());

  static win: any = null;

  static startListening(): void {

    if (!this.isServerRunning) {
      this.isServerRunning = true;
      this.server.listen(this.port);
    }

  }

  static defaultLordData(): lordData {
    return {
      id: crypto.randomUUID(),
      ip: this.ip,
      username: '',
      computerName: toString(process?.env?.COMPUTERNAME),
      defaultPrinter: null,
      printers: [],
      toPrintsCommands: [],
      lastPrinted: 0,
      ConnectedPCs: [],
      recentlyConnectedPCs: [],
      lastCheckConnectedPC: 0,
      offlineComputers: [],
    };
  }

  static defaultInbox(): Inbox {
    return []
  }

  static reloadInbox(): void {
    this.inboxDB = JSONFileSyncPreset<Inbox>(
      join(this.dir[2], expressAppClass.db.data.id),
      this.defaultInbox()
    );
  }

  static reloadDatabase(): void {
    this.db = JSONFileSyncPreset<lordData>(this.dbPath, this.defaultLordData())
  }


  static startServer(): boolean {

    let o = false;
    console.log('Starting web server for main computer!', this.dbPath, this.db.data.computerName, app.getAppPath())
    this.beforeStartSever()
    process.on("SIGTERM", this.shutdown);
    process.on("SIGINT", this.shutdown);
    this.startListening();
    this.server.on("error", this.handleServerError);
    this.server.on("listening", () => console.log(`Listening on: http//localhost:${this.port}`));
    this.server.on("close", () => console.log("Express server closed."));
    return o;

    app.whenReady().then(() => {
      this.win = new BrowserWindow({ show: false })
    })

  }

  static beforeStartSever(): void {

    // if db file does not exist, create it
    this.dir.map(el => (!existsSync(el)) && mkdirSync(el, { recursive: true }))
    this.db.write()

    // if( this.db.data.ip != ip.address() )

    this.routesInit()
    this.middlewareInit()

    this.server = http.createServer(this.app);

  }
  static handleServerError(error: any) {
    if (error.syscall !== "listen") throw error;

    const bind = typeof this.port === "string" ? `Pipe ${expressAppClass.port}` : `Port ${expressAppClass.port}`;
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

  static middlewareInit(): void {
    this.app.set("port", expressPort);
    this.app.use((req, res, next) => {
      this.reloadDatabase()
      next()
    })
    this.app.use(cors())
    this.app.use(logger("dev"));
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(fileUpload())
    this.app.use('/public/', express.static(this.dir[1]));
    this.app.use('/upload/', express.static(this.dir[0]));
    this.app.use("/api/v1/", this.router);
    this.app.use((_req: any, _res: any, next: any) => next(createError(404)));
    this.app.use((err: any, req: any, res: any, _next: any) => {
      res.locals.title = "error";
      res.locals.message = err.message;
      res.locals.error = req.app.get("env") === "development" ? err : {};
      res.status(err.status || 500).send("error " + err.status);
    });

  }

  static shutdown(): void {
    console.log("Shutting down Express server...");
    this.server.close();
  }

  static routesInit(): void {
    this.router.get("/ping", (req: Request, res: Response) => res.send(this.db.data.computerName))

    this.router.get('/popo', (req, res) => {
      res.send(`<html>
                <body>
                  <form ref='uploadForm'
                    id='uploadForm'
                    action='/api/v1/upload/'
                    method='post'
                    encType="multipart/form-data">
                      <input type="file" name="sampleFile" />
                      <input type='submit' value='Upload!' />
                  </form>
                </body>
              </html>`);
    });
    this.router.post('/upload', this.uploadMethod)
    this.router.post('/print', this.printMethod)
    this.router.get('/printers', async (req, res) => {
      getPrinters().then((printers) => {
        res.json(printers)
      }).catch((err) => {
        res.status(400).json({
          message: 'Something went wrong. Please try again'
        })
      });
    })
    this.router.get('/printers/default', async (req, res) => {
      getDefaultPrinter().then((defaultPrinter) => {
        res.json(defaultPrinter)
      }).catch((err) => {
        res.status(400).json({
          message: 'Something went wrong. Please try again'
        })
      });
    })
    this.router.get('/defaultData', async (req, res) => res.json(this.defaultLordData()))
    this.router.get('/data', async (req, res) => res.json(this.db.data))
    this.router.get('/profile', this.profileMethod)
    this.router.get('/connected-pc', this.connectedPCMethod)
    this.router.get('/inbox', async (req, res) => {
      let inboxesPC = this.inboxDB.data.map(el => el.id);
      let newComputers = this.db.data.ConnectedPCs
        .filter(el => !inboxesPC.includes(el.id))
        .map(el => omit(el, ['printers', 'printersDefault', 'lastPrinted']))
      res.json([...this.inboxDB.data, ...newComputers])
      this.inboxDB.data = [...this.inboxDB.data, ...newComputers]
      this.inboxDB.write()
    })
    this.router.post('/inbox/message', async (req, res) => {
      console.log(req.body)
      if (req.body) {
        let newMessage: Message = {
          id: uuidv7(),
          chatId: req.body.chatId,
          senderId: req.body.senderId as string,
          message: req.body.message as string,
          MessageType: req.body.messageType as string,
          receivedAt: Date.now(),
          sentAt: req.body?.messageType || null,
          senderComputerName: req.body?.senderComputerName || '',
          senderIP: req.body?.senderIP || '',
        }
        let chat = this.inboxDB.data.find(el => el.id === req.body.chatId)
        if (chat) {
          chat.messages = [...(chat?.messages || []), newMessage]
          res.json(chat)
          this.inboxDB.write()
        } else {
          res.status(400).send('Chat not found')
        }
      }
    })
    this.router.get('/inbox/message', async (req, res) => {
      res.json({ status: 'success' })
    })

  }

  static async uploadMethod(req: Request, res: Response, next: NextFunction) {

    console.log('uploaded file : ', req?.files)



    let sampleFile = {} as UploadedFile;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    // @ts-ignore
    sampleFile = req.files.sampleFile as UploadedFile;
    let newFileName: string = uuidv7() + extname(sampleFile.name)
    uploadPath = expressAppClass.dir[1] + newFileName;


    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(uploadPath, function (err) {
      if (err)
        return res.status(500).send(err);

      console.log('File uploaded!');
      console.log('req.file', req.file)
      console.log('req.body', req.body)

      const fileData = {} as uploadFile;

      fileData.originalName = sampleFile.name
      fileData.encoding = sampleFile.encoding
      fileData.mimetype = sampleFile.mimetype
      fileData.destination = uploadPath
      fileData.filename = newFileName
      fileData.path = expressAppClass.dir[1]
      fileData.size = sampleFile.size

      let o: toPrintsCommandsFile = {
        ...fileData, ...{
          uploaded: true,
          addedTime: Date.now(),
          isPrinted: false,
          addedBy: req.body?.addedBy || null,
          printOptions: req.body?.printOptions || null,
        }
      }

      console.log(o)
      res.json(o);

      expressAppClass.db.data.toPrintsCommands.push(o)
      expressAppClass.db.write()

      return;

    });

  }

  static printMethod(req: Request, res: Response): void {

    if (req.body?.filename) {
      let file = find(expressAppClass.db.data.toPrintsCommands, ['filename', req.body.filename])
      let fileIndex = findIndex(expressAppClass.db.data.toPrintsCommands, ['filename', req.body.filename])
      console.log(req.body)

      if (file) {
        let options: PrintOptions | undefined = req.body?.options
        console.log(fileIndex, options)
        print(file.destination, options).then(() => {
          file.isPrinted = true
          res.json({ print: 'successful' })
          console.log(`Printed file: ${file.filename} : ${file.originalName}`)
        }).catch(err => {
          res.json({ print: 'failed' })
          file.isPrinted = false
          console.error(`Error printing file: ${req.body?.filename}`, err)
        })
        expressAppClass.db.data.toPrintsCommands[fileIndex] = { ...file, ...{ printOptions: options ? options : null } }
        expressAppClass.db.write()
      }
    }
  }

  static profileMethod(req: Request, res: Response): void {

    let o = {} as computerProfile;

    o.id = expressAppClass.db.data.id;
    o.lastSeen = Date.now()
    o.isConnected = true

    o = { ...expressAppClass.db.data, ...o }

    res.json(o)

  }
  static async connectedPCMethod(req: Request, res: Response) {

    let ipAddress: string = ip.address()
    let ipLeft = dropRight(ipAddress.split('.'))
    let ipSeries: number = floor(Number(last(ipAddress.split('.'))), -1)

    console.log(ipAddress, ipLeft, ipSeries)

    const query = req.query;
    const numbersToRefresh = query?.numbersToRefresh ? +query?.numbersToRefresh : 31
    console.log('query?.numbersToRefresh', query?.numbersToRefresh)

    let computers: connectedPC[] = []

    if (expressAppClass.db.data?.lastCheckConnectedPC) {
      let diff = Date.now() - +expressAppClass.db.data.lastCheckConnectedPC
      console.log('diff', diff)
      if (diff < 2 * 60 * 1000 && query.force != 'yes') { // 2 minutes
        res.json(expressAppClass.db.data.recentlyConnectedPCs)
        return;
      }
    }

    for (let i = 0; i < numbersToRefresh; i++) {

      if (ip.address() == '127.0.0.1') break;

      // Make a GET request to the server using the current IP address
      let url = `http://${ipLeft.join('.')}.${ipSeries + i}:9457`
      let ping = url + '/api/v1/'
      console.log('getting request to server : ', url)

      await axios.get(ping + 'ping', { timeout: 100 })
        .then(async response => {

          console.log('Found PC at : ', ping)

          let o = {} as connectedPC
          let profile = await axios.get(ping + 'profile')

          o = profile.data
          o.isConnected = true
          o.lastSeen = Date.now();
          computers.push(o)

        })
        .catch(error => { });
    }


    let computerNameList = computers.map(el => el?.ip);

    console.log('computerNameList', computerNameList)
    let remainingLastOfflinePCs = uniqBy(expressAppClass.db.data.recentlyConnectedPCs
      .filter(el => !computerNameList.includes(el?.ip))
      .map(el => {
        el.isConnected = false;
        return el;
      }), 'ip')
    console.log('remainingLastOfflinePCs', remainingLastOfflinePCs)


    expressAppClass.db.data.ConnectedPCs = computers
    expressAppClass.db.data.recentlyConnectedPCs = sortBy(uniqBy(concat(computers, remainingLastOfflinePCs), 'ip'), ['lastSeen'])
    expressAppClass.db.data.lastCheckConnectedPC = Date.now()

    expressAppClass.db.write()

    res.json(expressAppClass.db.data.recentlyConnectedPCs)

  }


}

export default expressAppClass;
