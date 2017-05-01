'use strict'

const request = require('request'); // "Request" library
const querystring = require('querystring');
const oauth = require('./oauth/auth.js');
const spotify = require('./spot.js');
const settings = require('./settings.js')

const createPlaylist = (context, name, cb) => {
	if (!name)
		return cb('Name must be specified');
	spotify.createPlaylist(context, name, (err, playlistId, playlistName) => {
		if (err)
			return cb(err);
		const userSettings = settings.get(context.userId);
		userSettings.playlist = getPlaylistObj(context, playlistId, playlistName);
		settings.save(context.userId, userSettings);
		return cb(null, getPlaylistObj(context, playlistId, playlistName));
	});
}

const getPlaylistObj = (context, playlistId, playlistName) => {
	return {
		id: playlistId,
		name: playlistName,
		url: `https://open.spotify.com/user/${context.userId}/playlist/playlistId` 
	} 
}

const setPlaylist = (context, playlistUrl, cb) => {
	if (!playlistUrl) 
		return cb('Playlist URL must be provided');
	const playlist = retrievePlaylistId(playlistUrl);
	if (playlist.userId !== context.userId)
		return cb('Playlist must be owned by you');
	spotify.getPlaylist(context, playlist.id, 'id,name', (err, val) => {
		if (err)
			return cb(err);
		const userSettings = settings.get(context.userId);
		userSettings.playlist = getPlaylistObj(context, val.id, val.name);
		settings.save(context.userId, userSettings);
		return cb(null, userSettings.playlist);
	});
}

const retrievePlaylistId = (url) => {
	let userId, playlistId;
	const tokens = url.split('/');
	tokens.forEach((currentValue, index, arr) => {
		if (currentValue === 'user')
			userId = arr[index+1];
		else if (currentValue === 'playlist')
			playlistId = arr[index+1];
	});
	return { userId: userId, id: playlistId };
}


const processTracks = (items, trackIds, playlist) => {
	for (let i=0; i < items.length; i++) {
		const track = items[i].track;
		if (!trackIds[track.id]) {
			playlist.tracks.push({ track: track, last_played_at: items[i].played_at });
			trackIds[track.id] = 1;
		}	
	}
}

const getHistory = (context, cb) => {
	const trackIds = {};
	const playlist = {
		tracks: []
	};

	spotify.getRecentlyPlayedTracks(context, (err, items) => {
		if (err) {
			return cb(err);
		}
		// console.log('tracks', items);
		processTracks(items, trackIds, playlist);
		return cb(null, playlist.tracks);
	});
}

// module.exports.getRecentlyPlayed = getRecentlyPlayed;
module.exports.createPlaylist = createPlaylist;
// module.exports.modifyPlaylist = modifyPlaylist;
module.exports.getHistory = getHistory;
module.exports.setPlaylist = setPlaylist;