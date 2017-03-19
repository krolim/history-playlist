'use strict'

const express = require('express');
const app = express();
const request = require('request'); // "Request" library
const querystring = require('querystring');
const cookieParser = require('cookie-parser');

const client_id = ''; // Your client id
const client_secret = ''; // Your secret
const redirect_uri = 'http://localhost:8888/callback/'; // Your redirect uri

let resp = '<html><body><a href="/recent">Recent</a><br/><a href="/login">Login</a></body></html>';
let access_token = '';
let refresh_token = '';
let userId;
let playlistId='1vkvNT34d3fcr29EgqlN74';

app.get('/', (req, res) => {
  res.send(resp);
});

app.get('/refresh', (req, res) => {
	if (!playlistId) {
		const options = {
	    url: `https://api.spotify.com/v1/users/${userId}/playlists`,
	    headers: { 'Authorization': 'Bearer ' + access_token },
	    body: { name: 'Recently Played', public: false },
	    json: true
	  };
		request.post(options, (error, response, body) => {
			if (!error) {
				console.log(body);
				console.log('Playlist', body.name, ' ', body.id);
				playlistId=body.id;
				res.send('Playlist created: ' + playlistId + ' for user ' + userId);	
			} else {
				console.log(error);
				res.send(error);
			}
			
		});	
	} else {

		res.send('OK');
	} 
	

});

app.get('/recent', (req, res) => {
	const options = {
    url: 'https://api.spotify.com/v1/me/player/recently-played',
    headers: { 'Authorization': 'Bearer ' + access_token },
    body: { limit: 50 },
    json: true
  };

  // use the access token to access the Spotify Web API
	request.get(options, (error, response, body) => {
		if (!error) {
			resp = body;
			const items = resp.items;
			const playlist = {};
			const trackUris = [];
			if (items && items.length != 0) {
				for (let i=0; i < items.length; i++) {
					let track = {};
					track.name = items[i].track.name;
					track.id = items[i].track.id;
					track.artists = [];
					for (let j=0; j < items[i].track.artists.length; j++) {
						track.artists.push(items[i].track.artists[j].name);	
					}
					if (!playlist[track.id])
						trackUris.push(items[i].track.uri);
					playlist[track.id] = track;
				}
				console.log('URIS: ' + trackUris);
				const modifyopt = {
			    url: `https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`,
			    headers: { 'Authorization': 'Bearer ' + access_token },
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
			  });
				res.send(playlist);
			} else {
				res.send('No songs found: ' + body);
			}	
		} else {
			res.send("Error occured: " + error); 
		}
	  
	});

});

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
const generateRandomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const stateKey = 'spotify_auth_state';

app.use(cookieParser());

app.get('/login', (req, res) => {

  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  const scope = 'user-read-private user-read-email user-read-recently-played ' +
   							'playlist-modify-private playlist-read-private';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/callback', (req, res) => {

  // your application requests refresh and access tokens
  // after checking the state parameter

  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        access_token = body.access_token;
        refresh_token = body.refresh_token;

        // GET https://api.spotify.com/v1/me
        const options = {
			    url: 'https://api.spotify.com/v1/me',
			    headers: { 'Authorization': 'Bearer ' + access_token },
			    json: true
			  };
				request.get(options, (error, response, body) => {
					if (!error) {
						userId = body.id;
						console.log('User ID:', userId);
					}
				});
				res.send('Logged as id: ' + userId);	
        // we can also pass the token to the browser to make requests from there
        res.redirect('/');
        // res.redirect('/#' +
        //   querystring.stringify({
        //     access_token: access_token,
        //     refresh_token: refresh_token
        //   }));
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  const refresh_token = req.query.refresh_token;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);
