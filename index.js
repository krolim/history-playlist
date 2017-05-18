"use strict";

const express = require("express");
const app = express();
const querystring = require("querystring");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");

const oauth = require("./oauth/auth.js");
const playlists = require("./playlist.js");
const routes = require("./route.js");
app.use(cookieParser());
app.use(bodyParser.json());
app.use("/public", express.static("public"));

// rooting
app.get("/", (req, res) => {
  const storedToken = req.cookies ? req.cookies["spotifyHistoryToken"] : null;
  if (storedToken) {
    res.redirect("/public/index.html");
    console.log("Index");
  } else {
    res.redirect("/login");
    console.log("login");
  }
});

// app
app.put("/create-new", routes.createAsNewPlaylist);
app.put("/create", routes.createPlaylist);
app.get("/recent", routes.getRecentPlaylist);
app.get("/current", routes.getCurrentPlaylist);
app.get("/merged", routes.merge);
app.post("/set-playlist", routes.setPlaylist);
app.post("/add", routes.addTracks);

// app.get('/refresh', playlists.recentlyPlayed);
// app.post('/modify', playlists.modifyPlaylist);

// auth
app.get("/login", oauth.login);
app.get("/callback", oauth.callback);
// app.get('/refresh_token', oauth.refresh);

console.log("Listening on 8888");
app.listen(8888);
