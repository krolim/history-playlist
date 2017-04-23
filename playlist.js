'use strict'

const request = require('request'); // "Request" library
const querystring = require('querystring');
const oauth = require('./oauth/auth.js');
const spotify = require('./spot.js');
const async = require('async');

let playlistId='1vkvNT34d3fcr29EgqlN74';
const playlists = {};

const createPlaylist = (req, res) => {
	if (!playlistId) {
		const options = {
	    url: `https://api.spotify.com/v1/users/${userId}/playlists`,
	    headers: oauth.authHeader(req),
	    body: { name: 'Recently Played', public: false },
	    json: true
	  };
		request.post(options, (error, response, body) => {
			if (!error) {
				console.log(body);
				console.log('Playlist', body.name, ' ', body.id);
				playlistId = body.id;
				res.send('Playlist created: ' + playlistId + ' for user ' + userId);	
			} else {
				console.log(error);
				res.send(error);
			}			
		});	
	} else {
		res.send('OK');
	}
}

const recentlyPlayed = (req, res) => {
	const oauthHeader = oauth.authHeader(req); 
	const userId = oauth.userId(req);
	if (!userId) {
		return res.statusCode(401).send('User ID not known');
	}
	const playlist = playlists[userId];
	if (playlist) {
		res.send(playlist.tracks);
	} else {
		console.log('No tracks found');
		res.send([]);
	}
}

const processTracks = (items, trackIds, amount, playlist) => {
	let lastTrackTime;
	for (let i=0; i < items.length; i++) {
		const track = items[i].track;
		lastTrackTime = new Date(items[i].played_at);
		if (!trackIds[track.id]) {
			playlist.tracks.push({ track: track, last_played_at: lastTrackTime });
			trackIds[track.id] = 1;
			if (trackIds.length >= amount) {
				return 0;
			}	
		}	
	}
	return lastTrackTime ? lastTrackTime.getTime():0;
}

const getHistory = (context, amount, cb) => {
	let time;
	const trackIds = {};
	const playlist = {
		tracks: []
	};

	async.whilst(
    function() { 
      return time != 0; 
    },
    function(cb) {
      spotify.getRecentlyPlayedTracks(context, 50, time, (err, items) => {
				if (err) {
					return cb(err);
				}
				console.log('tracks', items);
				time = processTracks(items, trackIds, amount, playlist);
				return cb();
			});	
    },
    function(err) {
       cb(err, playlist.tracks);
    }
  );


	// const tracksGen = function *tracksGen(context, trackIds, playlist) {
	// 	yield spotify.getRecentlyPlayedTracks(context, 50, time, (err, items) => {
	// 		if (err) {
	// 			throw(new Error(err));
	// 		}
	// 		console.log('tracks', items);
	// 		return processTracks(items, trackIds, amount, playlist);
	// 	});	
	// }

	// try {
	// 	let tracks = tracksGen(context, trackIds, playlist);
	// 	// while(tracks.next();
	// 		console.log('Last played', time);
	// 		if (time.value == 0) {
	// 			return cb(null, playlist.tracks);
	// 		}
	// 	// }
	// } catch(err) {
	// 	return cb(err);
	// }
}

// const getRecentlyPlayed = (req, res) => {
// 	const oauthHeader = oauth.authHeader(req); 
// 	const userId = oauth.userId(req);
// 	if (!userId) {
// 		return res.statusCode(401).send('User ID not known');
// 	}
// 	const options = {
//     url: 'https://api.spotify.com/v1/me/player/recently-played',
//     headers: oauthHeader,
//     body: { limit: 50 },
//     json: true
//   };

//   // use the access token to access the Spotify Web API
// 	request.get(options, (error, response, body) => {
// 		if (!error) {
// 			console.log('sfy resp code', response.statusCode);
// 			if (response.statusCode == 401) {
// 				const storedToken = req.cookies ? req.cookies['spotifyRefreshToken'] : null;
// 				if (req.cookies && req.cookies['spotifyRefreshToken']) {
// 					oauth.refresh(req, res);
// 				} else {
// 					res.statusCode(401).send();
// 				}
// 				return;
// 			}
// 			const items = body.items;
// 			const trackIds = {};
// 			const trackUris = [];
// 			const playlist = {
// 				tracks: [],
// 				uris: []
// 			};
// 			if (items && items.length != 0) {
// 				for (let i=0; i < items.length; i++) {
// 					const track = items[i].track;
// 					// for (let j=0; j < items[i].track.artists.length; j++) {
// 					// 	track.artists.push(items[i].track.artists[j].name);	
// 					// }
// 					if (!trackIds[track.id]) {
// 						playlist.uris.push(items[i].track.uri);
// 						playlist.tracks.push(track);
// 						trackIds[track.id] = 1;			
// 					}	
// 				}
// 				playlists[userId] = playlist;
// 				// console.log('URIS: ' + playlist.uris);
				
// 				res.send(playlist.tracks);
// 			} else {
// 				res.send('No songs found: ' + body);
// 			}	
// 		} else {
// 			res.send("Error occured: " + error); 
// 		}
	  
// 	});
// } 

const modifyPlaylist = (req, res) => {
	const oauthHeader = oauth.authHeader(req); 
	const userId = oauth.userId(req);;
	if (!userId) {
		return res.statusCode(401).send('User ID not known');
	}
	const playlist = playlists[userId];
	if (!playlist) {
		return res.statusCode(404).send('No tracks found');
	}
	const trackUris = playlist.uris;
	const modifyopt = {
    url: `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
    headers: oauthHeader,
    body: { uris: trackUris },
    json: true
  };				
  request.put(modifyopt, (error, response, body) => {
  	if (error) {
  		console.log(error);
  		res.send(error);
  		return;
  	}
  	console.log('Modify: ', body);
  	console.log('Stats code: ', response.statusCode);
  	res.send('Playlist created!');
  });
} 

// module.exports.getRecentlyPlayed = getRecentlyPlayed;
module.exports.createPlaylist = createPlaylist;
module.exports.recentlyPlayed = recentlyPlayed;
module.exports.modifyPlaylist = modifyPlaylist;
module.exports.getHistory = getHistory;

