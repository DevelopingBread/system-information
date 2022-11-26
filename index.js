const { setTimeout } = require('timers/promises');
const discord_rpc = require('discord-rpc');
const os = require('os');
const activeWindow = require('active-win');
const checkDiskSpace = require('check-disk-space').default;
const systeminfo = require('systeminformation');

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

    timestamps: { start: 1 },

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

function formatBytes(bytes, decimals = 2) { // Totally not stolen from stackoverflow
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function pad(num, size) {
  num = num.toString();
  while (num.length < size) num = "0" + num;
  return num;
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
  var pos = slide % 6

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
      var total_memory = os.totalmem();
      var free_memory = os.freemem();
      var memory_usage = (total_memory - free_memory) / total_memory;

      activity_data.activity.details = `Memory Usage: ${Math.round(memory_usage * 100)}% | ${formatBytes(total_memory, 1)}`;

      break;
    case 3:
      var cpu = os.cpus();

      activity_data.activity.details = `CPU: ${cpu[0].model}`;

      os.version

      break;
    case 4:
      var date = new Date();

      var mins = date.getMinutes();
      var hours = date.getHours();
      var am_pm = hours >= 12 ? 'PM' : 'AM';

      hours = hours % 12
      hours = hours ? hours : 12;

      activity_data.activity.details = `My Time: ${hours}:${pad(mins, 2)} ${am_pm}`;

      break;
    case 5:
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
  activity_data.activity.timestamps.start = Math.round(new Date().getTime() / 1000) - os.uptime();

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