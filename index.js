const { app, BrowserWindow, Menu, dialog, ipcMain } = require("electron");
const path = require("path");
const contextMenu = require('electron-context-menu');

const mainMenuTemplate = [
  {
    label: "File",
    submenu: [
      {
        label: "Exit",
        accelerator: process.platform == "darwin" ? "Command+Q" : "Ctrl+Q",
        click() {
          app.quit();
        },
      },
    ],
  },
  {
    label: "Help",
    submenu: [
      {
        label: "Report an Issue",
        type: "submenu",
        submenu: [
          {
            label: "via Email",
            click: async () => {
              const { shell } = require('electron')
              await shell.openExternal('mailto:giorgos.iliopoulos97@gmail.com');
            }
          },
        ],
      },
      { type: "separator" },
      {
        label: `About ${app.getName()}`,
        click: () => {
          app.showAboutPanel();
        },
      },
    ],
  },
];

contextMenu({
	showSaveImageAs: false,
  showInspectElement:false,
  showSelectAll:false,
});

if(require('electron-squirrel-startup')) return;

const loadMainWindow = () => {
  const mainMenu = Menu.buildFromTemplate(mainMenuTemplate);
  Menu.setApplicationMenu(mainMenu);
  const mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    frame: true,
    icon: __dirname + '/assets/aade.gr-favicon.ico',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  app.setAboutPanelOptions({
    applicationName: app.getName(),
    applicationVersion: 'Version: ' + app.getVersion(),
    copyright: '© Giorgos Iliopoulos',
    iconPath: __dirname + '/assets/aade.gr-favicon.png',
});

  mainWindow.loadFile(path.join(__dirname, "index.html"));
  // mainWindow.webContents.openDevTools();
};

ipcMain.on("alert",(event,message)=>{
    dialog.showMessageBox({
        type: 'info',
        message: message
    });
});

app.on("ready", loadMainWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    loadMainWindow();
  }
});