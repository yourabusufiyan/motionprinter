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
import { pick, toString, dropRight, floor, last, concat, uniqBy, find, findIndex, sortBy, omit, merge, size } from "lodash";
import ip from 'ip'
import axios, { AxiosResponse } from 'axios'
import fileUpload from 'express-fileupload'
import { v7 as uuidv7 } from 'uuid';
import { app, BrowserWindow } from 'electron'

import { localPrinter } from './../../src/declarations/PrintersList';
import type { Request, Response, NextFunction } from 'express';
import type { lordData, connectedPC, computerProfile } from './../../src/declarations/LordStore.d';
import type { uploadFile, toPrintsCommandsFile, cardMaker, cardMakerPDF } from './express-app-d'
import type { Printer, PrintOptions } from 'pdf-to-printer'
import type { UploadedFile } from 'express-fileupload'

import { Chat, Inbox, Message } from "../../src/declarations/inbox";
import { ip_to_sequence, sleep } from '../../helpers/both'

import dayjs from 'dayjs'


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
    join(os.homedir(), app.getName(), "./db/"),
    join(os.homedir(), app.getName(), "./temp/")
  ]

  static computerName: string | undefined = process.env.COMPUTERNAME
  static dbName: string = `lordPrinter-${this.ip}.json`
  static dbPath: string = join(this.dir[2], this.dbName)
  static db = JSONFileSyncPreset<lordData>(this.dbPath, this.defaultLordData());

  static inboxDBPath: string = join(this.dir[2], expressAppClass.db.data.id.toString() + '.json')
  static inboxDB = JSONFileSyncPreset<Inbox>(this.inboxDBPath, this.defaultInbox());

  static win: BrowserWindow | null = null;

  static isFirstLoop = true
  static onlineAddresses: { [key: string]: connectedPC } = {}
  static addresses = ip_to_sequence({ ip: this.ip, arraySize: 300 })
  static addressesProcessing: string[] = []

  static startListening(): void {

    if (!this.isServerRunning) {
      this.isServerRunning = true;
      this.server.listen(this.port);
    }

    this.db.data.recentlyConnectedPCs = this.db.data.ConnectedPCs.map(el => merge(el, { isConnected: false }))
    this.db.data.ConnectedPCs = []
    this.db.write();
    this.win?.webContents.send('reloadDatabase')

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
      trashes: [],
      lastPrinted: 0,
      ConnectedPCs: [],
      recentlyConnectedPCs: [],
      lastCheckConnectedPC: 0,
      offlineComputers: [],
      cardMaker: [],
      temp: []
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

  }

  static beforeStartSever(): void {

    // if db file does not exist, create it
    this.dir.map(el => (!existsSync(el)) && mkdirSync(el, { recursive: true }))
    this.db.data = { ...this.defaultLordData(), ...this.db.data, ...pick(this.defaultLordData(), ['computerName']) }
    this.db.write()

    this.routesInit()
    this.middlewareInit()

    this.server = http.createServer(this.app);

    this.intervalInit()

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
    this.app.use('/public/', express.static(this.dir[0]));
    this.app.use('/upload/', express.static(this.dir[1]));
    this.app.use('/temp/', express.static(this.dir[3]));
    this.app.use("/api/v1/", this.router);
    this.app.use((_req: any, _res: any, next: any) => next(createError(404)));
    this.app.use((err: any, req: any, res: any, _next: any) => {
      res.locals.title = "error";
      res.locals.message = err.message;
      res.locals.error = req.app.get("env") === "development" ? err : {};
      res.status(err.status || 500).send("error " + err.status);
    });

  }

  static intervalInit(): void {

    setTimeout(async () => {
      while (true) {

        if (ip.address() != this.ip) {
          console.log('Changed IP, reloading server')
          app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) })
          app.exit(0)
          break;
        }

        if (this.ip == '127.0.0.1') {
          console.log('Local IP, waiting for 10 seconds')
          this.addresses = ['127.0.0.1']
          this.isFirstLoop || await sleep(10_000)
        }

        if (this.isFirstLoop) {
          this.db.data.ConnectedPCs = []
          this.db.write();
          this.win?.webContents.send('reloadDatabase')
          await sleep(1_00)
          this.isFirstLoop = false
        }

        this.addresses.sort((a: string) => a == this.ip ? -1 : 1)

        this.addresses.filter(async (ip: string, i: any) => {

          if (ip in this.addressesProcessing || this.onlineAddresses[ip])
            return false;

          this.addressesProcessing.push(ip)

          let data;

          try {
            let url = `http://${ip}:9457/api/v1`
            data = await axios.get(`${url}/ping`, { timeout: 3000 })
            data = data.data
            let pc = { ip, computerName: data, isConnected: true };
            console.log('Online PC from backend ', ip, data)
            this.onlineAddresses[ip] = pc
            let msg = ip == this.ip ? 'You are online.' : `"${data}" is online.`
            this.win?.webContents.send('notification', { msg })
            this.db.data.ConnectedPCs.push(pc)
            this.db.data.ConnectedPCs = uniqBy(this.db.data.ConnectedPCs, 'ip')
            this.db.write();
            await sleep(100)
            this.win?.webContents.send('reloadDatabase')

            let profile: AxiosResponse<computerProfile> = await axios.get(`${url}/profile`)
            this.db.data.ConnectedPCs = this.db.data.ConnectedPCs
              .map(pc => pc.ip === ip ? { ...pc, ...profile.data } : pc)
            this.db.write()
            await sleep(100)
            this.win?.webContents.send('reloadDatabase')

            let printers: AxiosResponse<Array<localPrinter>> = await axios.get(`${url}/printers/`)
            this.db.data.ConnectedPCs = this.db.data.ConnectedPCs
              .map(pc => pc.ip === ip ? { ...pc, ...{ printers: printers.data } } : pc)
            this.db.write()
            await sleep(100)
            this.win?.webContents.send('reloadDatabase')

            let defaultPrinters: AxiosResponse<localPrinter> = await axios.get(`${url}/printers/default`)
            this.db.data.ConnectedPCs = this.db.data.ConnectedPCs
              .map(pc => pc.ip === ip ? { ...pc, ...{ defaultPrinter: defaultPrinters.data } } : pc)
            this.db.write()
            await sleep(100)
            this.win?.webContents.send('reloadDatabase')

          } catch (e) {
            e = !e;
          } finally {
            this.addressesProcessing = this.addressesProcessing.filter(el => el != ip);
          }

        })

        await sleep(10_000)

      }
    }, 2_000)

    setTimeout(async () => {
      while (true) {

        if (!size(this.onlineAddresses)) {
          await sleep(1000)
          continue;
        }

        for (const [ip, data] of Object.entries(this.onlineAddresses)) {
          axios.get(`http://${ip}:9457/api/v1/ping`)
            .catch(async () => {
              console.error(`${data.computerName} is offline.`)
              delete this.onlineAddresses[ip];
              this.win?.webContents.send('notification', { msg: `${data.computerName} is offline.` })
              this.db.data.ConnectedPCs = this.db.data.ConnectedPCs.filter(a => a.ip != ip)
              this.db.write();
              await sleep(100)
              this.win?.webContents.send('reloadDatabase')
            })
        }

        await sleep(3_000)

      }
    }, 10_000)

  }

  static shutdown(): void {
    console.log("Shutting down Express server...");
    this.server.close();
  }

  static routesInit(): void {
    this.router.get("/ping", (req: Request, res: any) => res.send(this.db.data.computerName))

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
    this.router.post('/upload', this.uploadMethod as any)
    this.router.post('/print', this.printMethod)
    this.router.get('/printers', async (req, res) => {
      res.json(await this?.win?.webContents.getPrintersAsync())
    })
    this.router.get('/printers/default', async (req, res) => {
      res.json((await this?.win?.webContents.getPrintersAsync())?.filter(el => el.isDefault)[0])
    })
    this.router.get('/defaultData', async (req: any, res: any) => res.json(this.defaultLordData()))
    this.router.get('/data', async (req: any, res: any) => res.json(this.db.data))
    this.router.post('/savedata', async (req: any, res: any) => {
      console.log('save data', last(req.body?.data?.cardMaker))
      if (req.body?.data) {
        this.db.data = req.body.data;
        this.db.write()
        res.json({ status: 'ok' })
        expressAppClass.win?.webContents.send('reloadDatabase')
      } else {
        res.json({ status: 'error' })
      }
    })
    this.router.get('/profile', this.profileMethod)
    this.router.get('/connected-pc', this.connectedPCMethod)
    this.router.get('/inbox', async (req, res) => {
      let inboxesPC = this.inboxDB.data.map(el => el.id);
      let newComputers = this.db.data.ConnectedPCs
        // .filter(el => !inboxesPC.includes(el.id))
        .map(el => omit(el, ['printers', 'printersDefault', 'lastPrinted']))
      res.json([...this.inboxDB.data, ...newComputers])
      // this.inboxDB.data = [...this.inboxDB.data, ...newComputers]
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

    this.router.post('/cardMaker', function (req: Request, res: Response) {
      // req.file is the name of your file in the form above, here 'uploaded_file'
      // req.body will hold the text fields, if there were any 
      console.log(req.files, req.body)

      if (!req.files || req.files.length) {
        res.status(400).json({ message: "No files uploaded!" });
      }

      // Send response with file details
      res.json({
        message: "Files uploaded successfully!",
        // @ts-ignore
        files: req?.files?.map((file: any) => ({
          filename: file.filename,
          path: `/uploads/${file.filename}`,
        })),
      });


    });


  }

  static async uploadMethod(req: Request, res: Response, next: NextFunction) {

    // console.log('uploaded file : ', req?.files)

    let sampleFile = {} as UploadedFile;
    let uploadPath;

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    // @ts-ignore
    sampleFile = req.files.sampleFile as UploadedFile;
    let newFileName: string = uuidv7() + extname(sampleFile.name)
    uploadPath = expressAppClass.dir[1] + newFileName;

    if (req.body?.temp == 'true') {
      uploadPath = expressAppClass.dir[3] + newFileName;
    }

    // Use the mv() method to place the file somewhere on your server
    sampleFile.mv(uploadPath, function (err) {
      if (err)
        return res.status(500).send(err);


      const fileData = {} as uploadFile;

      fileData.originalName = sampleFile.name
      fileData.encoding = sampleFile.encoding
      fileData.mimetype = sampleFile.mimetype
      fileData.destination = uploadPath
      fileData.filename = newFileName
      fileData.path = expressAppClass.dir[1]
      fileData.size = sampleFile.size
      fileData.temp = req.body?.temp == 'true'

      let o: toPrintsCommandsFile = {
        ...fileData, ...{
          uploaded: true,
          addedTime: Date.now(),
          isPrinted: false,
          addedBy: req.body?.addedBy || null,
          addedTo: req.body?.addedTo || null,
          printOptions: req.body?.printOptions || null,
        }
      }

      console.log('File uploaded!', o);

      if (req.body?.cardMaker) {

        let cardData: cardMakerPDF = o as cardMakerPDF
        cardData.cardType = req.body?.cardType
        cardData.id = req.body?.id
        cardData.password = req.body?.password

        if (req.body?.makerID) {

          let card = expressAppClass.db.data.cardMaker.find(el => el.id === req.body?.makerID)

          if (!card?.id) {
            res.status(400).send('Card maker not found')
            return;
          }

          if (card?.pdfs && card.pdfs.length) {
            let index = req.body?.index || card.pdfs.length
            card.pdfs[index] = cardData
          } else {
            card.pdfs = [cardData]
          }

          expressAppClass.db.data.cardMaker = expressAppClass.db.data.cardMaker.map(el => el.id === req.body.makerID ? card : el)
          res.json(card);

        } else {
          let newCardMaker: cardMaker = {
            path: expressAppClass.dir[1],
            id: uuidv7(),
            pdfs: [cardData]
          }
          expressAppClass.db.data.cardMaker.push(newCardMaker)
          res.json(newCardMaker);
        }

      } else {
        if (req.body?.temp == 'true') {
          expressAppClass.db.data.temp.push(o)
        } else {
          expressAppClass.db.data.toPrintsCommands.push(o)
        }
        res.json(o);
      }


      expressAppClass.db.write()
      expressAppClass.win?.webContents.send('reloadDatabase')
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

    let pickResponse = pick(
      expressAppClass.db.data,
      ['id', 'ip', 'username', 'computerName', 'lastSeen', 'lastPrinted', 'isConnected', 'printers', 'printersDefault']
    )

    res.json(pickResponse)

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

  static initOnLoad() {
    this.db.data.toPrintsCommands = this.db.data.toPrintsCommands.filter(file => {

      const fileDate = dayjs(file.addedTime);

      if (fileDate.isBefore(dayjs().subtract(3, 'month'))) {

        this.db.data.trashes.push({
          ...file, ...{
            trashedBy: 'auto',
            isDeleted: false,
            deletedBy: null,
            deletedTime: null,
            trashedTime: Date.now()
          }
        })

        return false;
      }

      return true;
    })

  }



}

export default expressAppClass;
