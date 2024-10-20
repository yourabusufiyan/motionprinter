import { toDisplayString } from "vue";
import type { Printer, } from "pdf-to-printer";
import type { MutlerFileResp, toPrintsCommandsFile } from "../../electron/main/express-app-d"

export type lordData = {
  id: string,
  ip: string,
  username: string | null,
  computerName: string | undefined,
  defaultPrinter: Printer | null,
  printers: Printer[],
  toPrintsCommands: toPrintsCommandsFile[],
  lastPrinted: Date | number,
  ConnectedPCs: connectedPC[],
  recentlyConnectedPCs: connectedPC[],
  lastCheckConnectedPC: Date | number,
  offlineComputers: Array<connectedPC>,
};

export type computerProfile = {
  id: string,
  ip: string,
  username: string | null,
  computerName: string | undefined,
  lastSeen: Date | number,
  lastPrinted: Date | number,
  isConnected: boolean,
};

export type connectedPC = computerProfile & { printers: Printer[], printersDefault: Printer }
