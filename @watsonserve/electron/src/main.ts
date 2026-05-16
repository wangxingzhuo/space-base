import { app, Tray, Menu, BrowserWindow, globalShortcut } from 'electron';
import Srv from './service';
import { createWindow } from './utils';
import path from 'path';

const origin = process.env.NODE_ENV === 'production' ? `file://${__dirname}`: 'http://localhost:3000';

const mainWindowAttrs = {
  url: `${origin}/views/index.html#/music/`,
  preload: './preload.js',
  show: true
};

const bgWindowAttrs = {
  url: `${origin}/bg/index.html`,
  preload: './bg-preload.js',
  show: false,
  noWebSecurity: true
}

function createMainWindow() {
  if (BrowserWindow.getAllWindows().length === 1) createWindow(mainWindowAttrs);
}



// 这段程序将会在 Electron 结束初始化
// 和创建浏览器窗口的时候调用
// 部分 API 在 ready 事件触发后才能使用。
(async () => {
  app.on('will-quit', () => {
    // 注销所有快捷键
    globalShortcut.unregisterAll();
  });

  const [service] = await Promise.all([Srv.init(), app.whenReady()]);
  service.reqFilter();

  // 系统托盘图标
  const ctxMenu = Menu.buildFromTemplate([{ label: 'quit', click: () => app.quit() }]);
  const tray = new Tray(path.resolve(__dirname, `ico${process.platform === 'win32' ? '.ico' : 'Template.png'}`));
  tray.on('click', createMainWindow);
  tray.on('right-click', () => tray.popUpContextMenu(ctxMenu));

  // 通常在 macOS 上，当点击 dock 中的应用程序图标时，如果没有其他打开的窗口，那么程序会重新创建一个窗口。
  app.on('activate', createMainWindow);

  // 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此，通常对程序和它们在
  // 任务栏上的图标来说，应当保持活跃状态，直到用户使用 Cmd + Q 退出。
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  });

  service.listen(createWindow(bgWindowAttrs).on('closed', () => process.platform !== 'darwin' && app.quit()).id);
  createMainWindow();
})();
