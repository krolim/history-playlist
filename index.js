'use strict'

const express = require('express');
const app = express();
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');

const oauth = require('./oauth/auth.js');
const playlists = require('./playlist.js');
const routes = require('./route.js');

// let resp = '<html><body><a href="/recent">Recent</a><br/><a href="/login">Login</a></body></html>';


app.use(cookieParser());
app.use(bodyParser.json());
app.use('/public', express.static('public'));


// rooting
app.get('/', (req, res) => {
  const storedToken = req.cookies ? req.cookies['spotifyHistoryToken'] : null;
  if (storedToken) {
    res.redirect('/public/index.html');
    console.log('Index');
  } else {
    res.redirect('/login');
    console.log('login');
  }
});

// app
app.put('/create', playlists.createPlaylist);
// app.get('/recent-old', playlists.getRecentlyPlayed);
app.get('/recent', routes.getRecentPlaylist);
app.post('/set-playlist', routes.setPlaylist);
// app.get('/refresh', playlists.recentlyPlayed);
// app.post('/modify', playlists.modifyPlaylist);

// auth
app.get('/login', oauth.login);
app.get('/callback', oauth.callback);
// app.get('/refresh_token', oauth.refresh);

console.log('Listening on 8888');
app.listen(8888);
