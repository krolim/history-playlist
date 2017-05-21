'use strict';

const querystring = require('querystring');
const oauth = require('./oauth/auth.js');
const spotify = require('./spot.js');
const settings = require('./settings.js');

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
		url: `https://open.spotify.com/user/${context.userId}/playlist/${playlistId}` 
	} 
}

const createAsNewPlaylist = (context, name, trackUris, cb) => {
	spotify.createPlaylist(context, name, (err, playlistId, playlistName) => {
		if (err)
			return cb(err);
		spotify.modifyPlaylist(context, playlistId, trackUris, (err, id, name) => {
			if (err)
				return cb(err);
			return cb(null, getPlaylistObj(context, playlistId, playlistName));
		});
	});
}

const addTracksToUserPlaylist = (context, trackUris, cb) => {
	const userSettings = settings.get(context.userId);
	if (!userSettings || !userSettings.playlist)
		return cb('Playlist was not configured. Please specify the playllist in settings!');
	addTracksToPlaylis(context, userSettings.playlist.id, trackUris, cb);
}

const addTracksToPlaylis = (context, playlistId, trackUris, cb) => {
	spotify.addTracksToPlaylist(context, playlistId, trackUris, (err, id, name) => {
		if (err)
			return cb(err);
		return cb(null, getPlaylistObj(context, playlistId, name));
	});
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


const processRecentTracks = (items, trackIds, playlist) => {
	for (let i=0; i < items.length; i++) {
		const track = items[i].track;
		if (!trackIds[track.id]) {
			playlist.tracks.push({ track: track, last_played_at: items[i].played_at });
			trackIds[track.id] = 1;
		}	
	}
}

const processPlaylistTracks = (response, playlist) => {
	const items = response.tracks.items;
	for (let i=0; i < items.length; i++) {
		const track = items[i].track;
		playlist.tracks.push({ track: track, last_played_at: items[i].added_at });	
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
		processRecentTracks(items, trackIds, playlist);
		return cb(null, playlist.tracks, trackIds);
	});
}

const getUserCurrentPlaylist = (context, cb) => {
	const playlist = {
		tracks: []
	};
	const userSettings = settings.get(context.userId);
	if (!userSettings.playlist)
		return cb(null, playlist);
	spotify.getPlaylist(context, userSettings.playlist.id, null, (err, val) => {
		if (err)
			return cb(err);
		processPlaylistTracks(val, playlist);
		return cb(null, playlist.tracks);
	});
}

const mergePlaylists = (context, cb) => {
	getHistory(context, (err, val, trackIds) => {
		if (err)
			return cb(err);
		const tracks = val;
		getUserCurrentPlaylist(context, (err, val) => {
			if (err)
				return cb(err);
			for(let i=0; i < val.length; i++) {
				const track = val[i];
				if (!trackIds[track.id]) {
					tracks.push(track);
					trackIds[track.id] = 1;
				}
			}
			return cb(null, tracks);
		});
	});
}

// module.exports.getRecentlyPlayed = getRecentlyPlayed;
module.exports.createPlaylist = createPlaylist;
module.exports.createAsNewPlaylist = createAsNewPlaylist;
// module.exports.modifyPlaylist = modifyPlaylist;
module.exports.getHistory = getHistory;
module.exports.setPlaylist = setPlaylist;
module.exports.getUserCurrentPlaylist = getUserCurrentPlaylist;
module.exports.mergePlaylists = mergePlaylists;
module.exports.addTracksToUserPlaylist = addTracksToUserPlaylist;