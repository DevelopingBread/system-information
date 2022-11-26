const { showConsole, hideConsole } = require('node-hide-console-window');
const { setTimeout } = require('timers/promises');
const discord_rpc = require('discord-rpc');
const os = require('os');
const activeWindow = require('active-win')

const client = new discord_rpc.Client({ transport: 'ipc' });

const config = require('./config.json');

// System Variables
const os_release = os.release();
const os_type = os.type();
const os_platform = os.platform();
const os_user = os.userInfo().username;

// Tables
const activity_data = {
  pid: process.pid,
  activity: {
    details: '[Details]',
    state: '[State]',

    timestamps: { start: Date.now() },

    assets: {
      large_image: 'os_windows',
      small_image: 'unknown',

      large_text: `Windows v${os_release}`,
      small_text: 'unknown'
    },

    buttons: config.Buttons
  }
}

const icons = {
  os: {
    'Mac OS': 'os_mac',
    'win32': 'os_windows',
    'linux': 'os_linux'
  }
}

// Functions
function Print(type, output) {
  console.log(`[${type}]: ${output}`)
}

function Update() {
  Print('Update', 'Updating activity.')
  client.request('SET_ACTIVITY', activity_data)
}

function CapitalizeFirstLetter(string) { 
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Main
console.clear();

Print('Info', 'Attempting to log in...');

client.login({ clientId: config.ClientId }).catch(console.error);
client.on('ready', async () => {
  Print('Info', 'Presence loaded.');
  
  activity_data.activity.assets.large_image = icons.os[os_platform] || 'os_unknown';

  activity_data.activity.details = `${ CapitalizeFirstLetter( (icons.os[os_platform] || 'os_unknown').replace('os_', '') ) }: ${os_platform.toUpperCase()} [${os_user}]`;

  Update();

  Print('Info', 'Running active window capture');

  (async () => {
    while (1 > 0) { 
      console.log(activeWindow());

      await setTimeout(5000);
    }
  })
})