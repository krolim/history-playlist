'use strict';

const auth = require('./oauth/auth.js');
const playlist = require('./playlist.js');

const routeIt = (req, res, cb) => {
	const context = auth.getContext(req);
	if (!context.accessToken || !context.refreshToken) {
		res.redirect('/login');
		return cb('Not authenticated');
	}
	cb(null, context);
};

module.exports.getRecentPlaylist = (req, res) => {
	routeIt(req, res, (err, context) => {
		if (err) {
			console.log('Auth error: %j', err);
			return;
		} 
		playlist.getHistory(context, req.query.amount, (err, items) => {
			if (err) {
				console.log('Error extracting playlist', err)
				return res.status(500).send(err);
			}
			return res.send(items);
		});
	});
}