import type { MutlerFileResp, toPrintsCommandsFile, cardMaker, cardMakerPDF } from "../../electron/main/express-app-d"
import type { lordData } from "./LordStore"
import type inbox from "./inbox"

export type $MutlerFileResp = MutlerFileResp;
export type $toPrintsCommandsFile = toPrintsCommandsFile;
export type $lordData = lordData;

export type $cardMakerPDF = cardMakerPDF;
export type $cardMaker = cardMaker;

export default inbox;