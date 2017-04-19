'use strict';

const request = require('request'); // "Request" library
const querystring = require('querystring');
const oauth = require('./oauth/auth.js');

const getRecentlyPlayedTracks = (context, limit, before, cb) => {
	spotRequest(context, 'https://api.spotify.com/v1/me/player/recently-played', 
		'GET', { limit: limit, before: before }, (err, responseCode, body) => {
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

const spotRequest = (context, url, method, body, cb) => {
	const options = {
		method: method,
    url: url,
    headers: oauth.getAuthHeader(context),
    body: body,
    json: true
  };

  // use the access token to access the Spotify Web API
	request(options, (error, response, body) => {
		if (error) {
			cb(err);
	  } else {
	  	if (response.statusCode === 401) {
	  		oauth.refreshToken(context, (err, statusCode) => {
	  			if (!err && response.statusCode === 200) {
	  				return spotRequest = (context, url, method, body, cb);
	  			}
	  		});
	  	}
	  	cb(null, response.statusCode, body);
	  }
			
	}	
}