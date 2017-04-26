'use strict';

const request = require('request'); // "Request" library
const querystring = require('querystring');
const oauth = require('./oauth/auth.js');

const RETRIES = 1;

const getRecentlyPlayedTracks = (context, limit, before, cb) => {
	const options = { limit: limit };
	if (before) {
		options.before = before;
	}
	spotRequest(context, 'https://api.spotify.com/v1/me/player/recently-played',
		'GET', options, (err, responseCode, body) => {
			if (err) {
				return cb(err);
			}
			if (responseCode !== 200) {
				return cb('error ' + responseCode);
			}
			cb(null, body.items);
		}
	);
}

const spotRequest = (context, url, method, body, cb, retry = 0) => {
	const options = {
		method: method,
    url: url,
    headers: oauth.getAuthHeader(context),
    body: body,
    json: true
  };
  // use the access token to access the Spotify Web API
	request(options, (error, response, body) => {
		if (error)
			rerurn cb(err);
  	if (response.statusCode === 401) {
				// refresh the token and repeat the request
				oauth.refreshToken(context, (err, statusCode) => {
					if (!err && response.statusCode === 200) {
						options.headers = oauth.getAuthHeader(context);
						request(options, (error, response, body) => {
							if (error)
								return cb(error);
							if (response.statusCode !== 200)
								return cb('Not authenticated', response.statusCode, body);
							return cb(null, response.statusCode, body);
						});
					} else
				});
			} else {
			}
  	}
  	return cb(null, response.statusCode, body);
	});
}

module.exports.getRecentlyPlayedTracks = getRecentlyPlayedTracks;
