const { showConsole, hideConsole } = require('node-hide-console-window');
const { setTimeout } = require('timers/promises');
const discord_rpc = require('discord-rpc');
const os = require('os');
const activeWindow = require('active-win')
const Thread = require('worker_threads')

const client = new discord_rpc.Client({ transport: 'ipc' });

const config = require('./config.json');

// System Variables
const os_release = os.release();
const os_type = os.type();
const os_platform = os.platform();
const os_user = os.userInfo().username;

// Tables
const icons = {
  os: {
    'Mac OS': 'os_mac',
    'win32': 'os_windows',
    'linux': 'os_linux'
  },

  apps: {
    'Visual Studio Code': 'app_vsc',
    'RobloxStudio': 'app_rblx_studio',

    'Windows Explorer': 'app_explorer',
    'Notepad': 'app_notepad',
    'Settings': 'app_win_settings',

    'Discord': 'app_discord',

    'Google Chrome': 'app_chrome',
    'Firefox': 'app_firefox'
  }
}

const replaceNames = {
  'SearchHost.exe': 'Settings',
  'Notepad.exe': 'Notepad'
}

var activity_data = {
  pid: process.pid,
  activity: {
    details: '[Details]',
    state: '[State]',

    timestamps: { start: Date.now() },

    assets: {
      large_image: 'os_windows',
      small_image: 'unknown',

      large_text: `${ CapitalizeFirstLetter( (icons.os[os_platform] || 'unknown os').replace('os_', '') ) } v${os_release}`,
      small_text: 'unknown'
    },

    buttons: config.Buttons
  }
}

// Variables
var currentWindow = '';

// Functions
function Print(type, output) {
  console.log(`[${type}]: ${output}`)
}

function Update() {
  Print('Update', 'Updating activity.');
  client.request('SET_ACTIVITY', activity_data);
  lastActivityData = activity_data;
}

function CapitalizeFirstLetter(string) { 
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function SetWindowData() {
  activity_data.activity.state = `Doing: ${currentWindow}`;

  Print('Window Data', 'Set Window data');
}

function SetWindowIconData() {
  activity_data.activity.assets.small_image = icons.apps[currentWindow] || 'app_unknown';
  activity_data.activity.assets.small_text = currentWindow || 'unknown app';

  Print('Icon', 'Set Icon data');
}

async function GetWindow() {
  var data = await activeWindow();

  Print('Get Window', 'Got Active Window');

  if (data == undefined) {
    return 'Nothing';
  }

  return data.owner.name;
}

// Main
console.clear();

Print('Info', 'Attempting to log in...');

client.login({ clientId: config.ClientId }).catch(console.error);
client.on('ready', async () => {
  Print('Info', 'Presence loaded.');
  
  activity_data.activity.assets.large_image = icons.os[os_platform] || 'os_unknown';

  activity_data.activity.details = `${ CapitalizeFirstLetter( (icons.os[os_platform] || 'os_unknown').replace('os_', '') ) } ${os_platform} | User: ${os_user}`;

  // Update
  (async () => {
    while (true) {
      // Pre-Functions
      currentWindow = await GetWindow();
      currentWindow = replaceNames[currentWindow] || currentWindow;
      currentWindow = currentWindow.replace('.exe', '');

      // Functions
      SetWindowData();
      SetWindowIconData();
  
      // Update
      Update();

      // Timeout
      await setTimeout(2500);
    }
  })();
})