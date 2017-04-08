'use strict'

const fs = require('fs');

const FILE_NAME = './data/users_settings.json';
const usersSettings = fs.existsSync(FILE_NAME) ?
				JSON.parse(fs.readFileSync(FILE_NAME)) : {};

const saveSettings = (userId, userSettings) => {
	usersSettings[userId] = userSettings;
	fs.writeFileSync(FILE_NAME, JSON.stringify(usersSettings));
}

module.exports.save = saveSettings;
module.exports.get = (userId) => {
	return usersSettings[userId];
}