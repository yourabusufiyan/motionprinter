export type Printer = {
  deviceId: string;
  name: string;
  paperSizes: string | string[];
};

export type localPrinter = {
  name: string,
  displayName: string,
  description: string,
  status: boolean,
  isDefault: boolean,
  options: {
    "printer-location": string,
    "printer-make-and-model": string,
    "system_driverinfo": string
  }
}
