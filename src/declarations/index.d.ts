import type { MutlerFileResponse, toPrintsCommandsFile, cardMaker, cardMakerPDF, photoSheetPhoto, photoSheet } from "../../electron/main/express-app-d"
import type { lordData } from "./LordStore"
import type inbox from "./inbox"

export type $MutlerFileResp = MutlerFileResponse;
export type $toPrintsCommandsFile = toPrintsCommandsFile;
export type $lordData = lordData;

export type $cardMakerPDF = cardMakerPDF;
export type $cardMaker = cardMaker;

export type $photoSheetPhoto = photoSheetPhoto;
export type $photoSheet = photoSheet;

export default inbox;