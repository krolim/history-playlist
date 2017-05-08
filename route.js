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

const reportError = (resp, err) => {
	console.log('Error: %j', err);
	resp.status(err.status).send(err.msg);
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