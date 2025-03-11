import { toDisplayString } from "vue";
import type { Printer, } from "pdf-to-printer";
import type { toPrintsCommandsFile, Trash, cardMaker, uploadFile } from "../../electron/main/express-app-d"
import type { localPrinter } from "./PrintersList"

export type lordData = {
  id: string,
  ip: string,
  username: string | null,
  computerName: string | undefined,
  defaultPrinter: localPrinter | null,
  printers: localPrinter[],
  toPrintsCommands: toPrintsCommandsFile[],
  trashes: Trash[],
  lastPrinted: Date | number,
  ConnectedPCs: connectedPC[],
  recentlyConnectedPCs: connectedPC[],
  lastCheckConnectedPC: Date | number,
  offlineComputers: connectedPC[],
  cardMaker: cardMaker[],
  temp: Array<cardMaker | toPrintsCommandsFile | Trash | uploadFile | photoSheetPhoto>
};

export type computerProfile = {
  id?: string,
  ip: string,
  username?: string | null,
  computerName: string | undefined,
  lastSeen?: Date | number,
  lastPrinted?: Date | number,
  isConnected?: boolean,
};

export type connectedPC = computerProfile & { printers?: localPrinter[], printersDefault?: localPrinter }
