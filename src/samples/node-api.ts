import { lstat } from 'node:fs/promises';
import { cwd } from 'node:process';
import { ipcRenderer } from 'electron';

ipcRenderer.on('main-process-message', (_event, ...args) => {
  console.log('[Receive Main-process message]:', ...args);
});

ipcRenderer.on("server-log-entry", (_event, data) => {
  console.log('server-log-entry', data);
});

lstat(cwd())
  .then((stats) => {
    console.log('[fs.lstat]', stats);
  })
  .catch((err) => {
    console.error(err);
  });
