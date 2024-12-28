var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { lstat } from 'node:fs/promises';
import { cwd } from 'node:process';
import { ipcRenderer } from 'electron';
ipcRenderer.on('main-process-message', function (_event) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    console.log.apply(console, __spreadArray(['[Receive Main-process message]:'], args, false));
});
ipcRenderer.on("server-log-entry", function (_event, data) {
    console.log('server-log-entry', data);
});
lstat(cwd())
    .then(function (stats) {
    console.log('[fs.lstat]', stats);
})
    .catch(function (err) {
    console.error(err);
});
