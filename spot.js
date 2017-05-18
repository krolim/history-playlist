'use strict';

const request = require('request'); // "Request" library
const querystring = require('querystring');
const oauth = require('./oauth/auth.js');

const RETRIES = 1;

const GET_RECENT_TRACKS_URL =  
		'https://api.spotify.com/v1/me/player/recently-played';

const getRecentlyPlayedTracks = (context, cb) => {
	const url = `${GET_RECENT_TRACKS_URL}?limit=50`;
	spotRequest(context, url, 'GET', null, 
		(err, responseCode, body) => {
			if (err) 
				return cb(err);
			if (responseCode !== 200) {
				return cb('Request received error code: ' + responseCode + ' -> ' + body);
			}
			if (!body.items)
				return cb('Not a valid response body: ' + body);
			cb(null, body.items);
		}
	);
}

const getPlaylist = (context, playlistId, fields, cb) => {
	const userId = context.userId;
	if (!userId) {
		return cb('User not authenticated');
	}
	let url = `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}`;
	if (fields)
		url = url + `?fields=${fields}`;
	spotRequest(context, 
		url, 'GET', {}, 
		(err, responseCode, body) => {
			if (err)
				return cb(err);
			if (responseCode !== 200) {
				return cb('error ' + responseCode);
			}
			return cb(null, body);
		}
	);	
}

const createPlaylist = (context, name, cb) => {
	const userId = context.userId;
	if (!userId) {
		return cb('User not authenticated');
	}
	spotRequest(context, 
		`https://api.spotify.com/v1/users/${userId}/playlists`,
		'POST', { name: name, public: false }, 
		(err, responseCode, body) => {
			if (err)
				return cb(err);
			if (responseCode !== 201) {
				return cb('Request received error code: %d -> %s', responseCode, body);
			}
			return cb(null, body.id, body.name);
		}
	);
}

const modifyPlaylist = (context, playlistId, tracksUris, cb) => {
	const userId = context.userId;
	if (!userId) {
		return cb('User not authenticated');
	}
	spotRequest(context, 
		`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
		'PUT', { uris: tracksUris }, 
		(err, responseCode, body) => {
			if (err)
				return cb(err);
			if (responseCode !== 201) {
				console.log('Error modifying playlist [code: %d] msg: %j', responseCode, body);
				return cb('Error modifying playlist: ' + responseCode);
			}
			return cb(null, body.id, body.name);
		}
	);
}

const addTracksToPlaylist = (context, playlistId, tracksUris, cb) => {
	const userId = context.userId;
	if (!userId) {
		return cb('User not authenticated');
	}
	spotRequest(context, 
		`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
		'POST', { uris: tracksUris, "position": 0 }, 
		(err, responseCode, body) => {
			if (err)
				return cb(err);
			if (responseCode !== 201) {
				console.log('Error modifying (add tracks) playlist [code: %d] msg: %j', responseCode, body);
				return cb('Error adding tracks: ' + responseCode);
			}
			return cb(null, body.id, body.name);
		}
	);
}

const spotRequest = (context, url, method, body, cb) => {
	const options = {
		method: method,
    url: url,
    headers: oauth.getAuthHeader(context),
    json: true
  };
  if (body) 
  	options.body = body;
  console.log('Call with options', options);
  // use the access token to access the Spotify Web API
	request(options, (error, response, body) => {
		console.log('Error: %j; Response code: %d; body: %j', error, response.statusCode, body);
		if (error)
			return cb(err);
  	if (response.statusCode === 401) {
			// refresh the token and repeat the request
			console.log('Refreshing token for user: ', context.userId);
			oauth.refreshToken(context, (err, statusCode) => {
				if (!err && statusCode === 200) {
					console.log('Successfully fetched new token %j', context);
					options.headers = oauth.getAuthHeader(context);
					request(options, (error, response, body) => {
						if (error)
							return cb(error);
						if (response.statusCode >= 300)
							return cb('Not authenticated', response.statusCode, body);
						return cb(null, response.statusCode, body);
					});
				} else {
					console.log('Error fetching token', err, 'Response code', statusCode);
					return cb('Unable to authentcate');
				}
			});
		} else {
			return cb(null, response.statusCode, body);
		}
	});
}

module.exports.getRecentlyPlayedTracks = getRecentlyPlayedTracks;
module.exports.createPlaylist = createPlaylist;
module.exports.modifyPlaylist = modifyPlaylist;
module.exports.getPlaylist = getPlaylist;
module.exports.addTracksToPlaylist = addTracksToPlaylist;