const discord_rpc = require('discord-rpc');

const client = new rpc.Client({ transport: 'ipc' });

const config = require('config.json');