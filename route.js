'use strict';

const auth = require('./oauth/auth.js');
const playlist = require('./playlist.js');

const routeIt = (req, cb) => {
	const context = auth.getContext(req);
	console.log('Login context %j', context);
	if (!context.accessToken || !context.refreshToken) {
		cb('Not authenticated');
	} else
		cb(null, context);
};

const reportError = (resp, err, statusCode = 500) => {
	console.log('Error: %j', err);
	resp.status(statusCode).send(err);
}

module.exports.getRecentPlaylist = (req, res) => {
	routeIt(req, (err, context) => {
		if (err) {
			return reportError(res, err);
		} 
		playlist.getHistory(context, (err, items) => {
			if (err) {
				console.log('Error extracting playlist', err)
				return res.status(500).send(err);
			}
			return res.send(items);
		});
	});
};

module.exports.getCurrentPlaylist = (req, res) => {
	routeIt(req, (err, context) => {
		if (err) {
			return reportError(res, err);
		} 
		playlist.getUserCurrentPlaylist(context, (err, items) => {
			if (err) {
				console.log('Error extracting user playlist', err)
				return res.status(500).send(err);
			}
			return res.send(items);
		});
	});
};


module.exports.setPlaylist = (req, res) => {
	const url = req.body.url;
	if (!url)
		return reportError(res, 'Bad request! Url not found');
	routeIt(req, (err, context) => {
		if (err) {
			return reportError(res, err);
		} 
		playlist.setPlaylist(context, url, (err, items) => {
			if (err) {
				console.log('Error extracting playlist', err)
				return res.status(500).send(err);
			}
			return res.send(items);
		});
	});	
};

module.exports.createPlaylist = (req, res) => {
	const name = req.body.name;
	// if (!url)
	// 	return reportError(res, 'Bad request! Url not found');
	routeIt(req, (err, context) => {
		if (err) {
			return reportError(res, err);
		} 
		playlist.createPlaylist(context, name, (err, playlist) => {
			if (err) {
				console.log('Error creating playlist', err)
				return res.status(500).send(err);
			}
			return res.send(playlist);
		});
	});	
};

module.exports.createAsNewPlaylist = (req, res) => {
	const name = req.body.name;
	const trackUris = req.body.trackUris;
	if (!name || !trackUris) 
		return reportError(res, 'Bad request! Name or trackUris missing');
	routeIt(req, (err, context) => {
		if (err) {
			return reportError(res, err);
		} 
		playlist.createAsNewPlaylist(context, name, trackUris, (err, playlist) => {
			if (err) {
				console.log('Error creating playlist', err)
				return res.status(500).send(err);
			}
			return res.send(playlist);
		});
	});	
};

module.exports.addTracks = (req, res) => {
	const trackUris = req.body.trackUris;
	if (!trackUris) 
		return reportError(res, 'Bad request! Name or trackUris missing');
	routeIt(req, (err, context) => {
		if (err) {
			return reportError(res, err);
		} 
		playlist.addTracksToUserPlaylist(context, trackUris, (err, playlist) => {
			if (err) {
				console.log('Error adding tracks to user playlist', err)
				return res.status(500).send(err);
			}
			return res.send(playlist);
		});
	});	
};

module.exports.merge = (req, res) => {
	routeIt(req, (err, context) => {
		if (err) {
			return reportError(res, err);
		} 
		playlist.mergePlaylists(context, (err, items) => {
			if (err) {
				console.log('Error extracting merged playlist', err)
				return res.status(500).send(err);
			}
			return res.send(items);
		});
	});
};