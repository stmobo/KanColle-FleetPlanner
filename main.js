const {app, BrowserWindow} = require('electron');
const kcJSON = require('./js/KanColle-JSON-DB.js');

let win

function createWindow() {
	win = new BrowserWindow({width: 800, height: 600})

	win.loadURL(`file: //${__dirname}/html/index.html`)

	win.on('closed', () => {
		win = null
	})
}

app.on('ready', function() {
	
	createWindow();
});

app.on('window-all-closed', () => {
	if(process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', () => {
	if(win === null) {
		createWindow()
	}
})
