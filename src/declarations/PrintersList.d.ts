export type Printer = {
    deviceId: string;
    name: string;
    paperSizes: string | string[];
};
export type localPrinter = {
    name: string;
    displayName: string;
    description: string;
    status: number;
    isDefault: boolean;
    options?: {
        'copies'?: string;
        'device-uri'?: string;
        'finishings'?: string;
        'job-cancel-after'?: number;
        'job-hold-until'?: string;
        'job-priority'?: number;
        'job-sheets'?: string;
        'marker-change-time'?: number;
        'number-up'?: number;
        'printer-commands'?: string;
        'printer-info'?: string;
        'printer-is-accepting-jobs'?: boolean;
        'printer-is-shared'?: boolean;
        'printer-is-temporary'?: boolean;
        'printer-location'?: string;
        'printer-make-and-model'?: string;
        'printer-state'?: number;
        'printer-state-change-time'?: number;
        'printer-state-reasons'?: string;
        'printer-type'?: number;
        'printer-uri-supported'?: string;
        'system_driverinfo'?: string;
    };
};
