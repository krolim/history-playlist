'use strict'

const request = require('request'); // "Request" library
const querystring = require('querystring');

// let accessToken = '';
// let refreshToken = '';
const stateKey = 'spotify_auth_state';

const clientId = process.env.CLIENT_ID || ''; // Your client id
const clientSecret = process.env.CLIENT_SECRET || ''; // Your secret
const redirectUri = process.env.REDIRECT_URL || 'http://localhost:8888/callback/'; // Your redirect uri

const scope = 'user-read-private user-read-email user-read-recently-played ' +
   						'playlist-modify-private playlist-read-private';
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


const login = (req, res) => {
	console.log('Login');

  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: clientId,
      scope: scope,
      redirect_uri: redirectUri,
      state: state
    }));
}

const callback = (req, res, cb) => {

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
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(clientId + ':' + clientSecret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, (error, response, body) => {
      if (!error && response.statusCode === 200) {

        const accessToken = body.access_token;
        const refreshToken = body.refresh_token;
        let userId;

        // GET https://api.spotify.com/v1/me
        const options = {
			    url: 'https://api.spotify.com/v1/me',
			    headers: { 'Authorization': 'Bearer ' + accessToken },
			    json: true
			  };
				request.get(options, (error, response, body) => {
					if (!error) {
						userId = body.id;
						console.log('User ID:', userId);
					} else {
						return res.statusCode(401).send();
					}
				});
				// res.send('Logged as id: ' + userId);	
        // we can also pass the token to the browser to make requests from there
        res.cookie('spotifyHistoryToken', accessToken);
        res.cookie('spotifyRefreshToken', refreshToken);
        res.cookie('spotifyHistoryUserId', userId);
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
}

const refresh = (req, resp) => {
	 // requesting access token from refresh token
	const storedToken = req.cookies ? req.cookies['spotifyRefreshToken'] : null;
	if (!storedToken) {
		return res.redirect('/login');
	}
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: storedToken
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      const accessToken = body.accessToken;
      res.cookie('spotifyHistoryToken', accessToken);
      res.send({
        'access_token': accessToken
      });
    }
  });
};

const authHeader = (req) => { 
	const accessToken = req.cookies ? req.cookies['spotifyHistoryToken'] : '';
	return { 'Authorization': 'Bearer ' + accessToken }; 
}

const userId = (req) => {
	return req.cookies ? req.cookies['spotifyHistoryUserId'] : null;
}

module.exports.login = login;
module.exports.callback = callback;
module.exports.refresh = refresh;
module.exports.authHeader = authHeader;
module.exports.userId = userId;