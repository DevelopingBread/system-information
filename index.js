const { showConsole, hideConsole } = require('node-hide-console-window');
const { setTimeout } = require('timers/promises');
const discord_rpc = require('discord-rpc');
const os = require('os');
const activeWindow = require('active-win');
const checkDiskSpace = require('check-disk-space').default;

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

    'WindowsTerminal': 'app_terminal',

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
var slide = 0;
var mousex, mousey = 0;

// Functions
function Print(type, output) {
  console.log(`[${type}]: ${output}`)
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function CapitalizeFirstLetter(string) { 
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function Update() {
  Print('Update', 'Updating activity.');
  client.request('SET_ACTIVITY', activity_data);
  lastActivityData = activity_data;
}

function SetWindowData() {
  activity_data.activity.state = `Doing: ${currentWindow}`;

  Print('Window Data', 'Set Window data');
}

function SetWindowIconData() {
  activity_data.activity.assets.small_image = icons.apps[currentWindow] || 'nothing';
  activity_data.activity.assets.small_text = currentWindow || 'unknown app';

  Print('Icon', 'Set Icon data');
}

function ChangeSlide() {
  var pos = slide % 3

  switch (pos) {
    case 0:
      activity_data.activity.details = `${ CapitalizeFirstLetter( (icons.os[os_platform] || 'os_unknown').replace('os_', '') ) } ${os_platform} | User: ${os_user}`;
      break;
    case 1:
      checkDiskSpace(config.Disk).then(async (diskspace) => {
        activity_data.activity.details = `Size: ${ formatBytes(diskspace.size, 1) } | Free Space ${ formatBytes(diskspace.free, 1) }`;
        Update();
      })
      break;
    case 2:
      activity_data.activity.details = config.LastSlide;
      break;
    default:
  }

  slide += 1;
}

async function GetWindow() {
  var data = await activeWindow();

  Print('Get Window', 'Got Active Window');

  if (data == undefined) {
    return '--';
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

  // Update
  (async () => {
    while (true) {
      // Pre-Functions
      currentWindow = await GetWindow();
      currentWindow = replaceNames[currentWindow] || currentWindow;
      currentWindow = currentWindow.replace('.exe', '');

      console.log('\n');

      // Functions
      SetWindowData();
      SetWindowIconData();
      ChangeSlide();
  
      // Update
      Update();

      // Timeout
      await setTimeout(5000);
    }
  })();
})