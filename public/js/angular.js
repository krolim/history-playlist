
var mainApp = angular.module("mainApp", ['ngRoute']);

mainApp.config(['$routeProvider', function($routeProvider) {
  $routeProvider.

  when('/showTracks', {
   templateUrl: 'view/show-tracks.htm',
   controller: 'TracksController'
  }).

  when('/setPlaylist', {
   templateUrl: 'view/set-playlist.htm',
   controller: 'SetPlaylistController'
  }).

  otherwise({
    redrectTo: '/showTracks'
  });
}]);

mainApp.run(function($rootScope) {
  $rootScope.showAlert = function (msg, lvl) {
    var alertType = 'info';
    if (lvl) {
      alertType = lvl;
    } 
    $rootScope.alertType = alertType;
    $rootScope.alertMsg = msg;
  };
});


mainApp.controller('HeaderController', function($scope, $location) {
	$scope.isActive = function (viewLocation) { 
    return viewLocation === $location.path();
  };	
});

mainApp.controller('TracksController', function($scope,$http) {
  // alert('get');  
  $scope.viewId = "0"; 
  $scope.selectAll = function() {
    for (track of $scope.tracks) {
      track.selected = $scope.allSelected;
    }
    $scope.apply();
  };
  $scope.addTracks = function() {
    let selTracksUris = [];
    for(let item of $scope.tracks) {
      if (item.selected) {
        selTracksUris.push(item.track.uri);
      } 
    }
    // $scope.showAlert('Tracks: ' + selTracksUris, 'success');
    $http.post('/add', { trackUris : selTracksUris }).then(
      function success(response) {
        $scope.playlistUrl = response.data.url;
        $scope.playlistName = response.data.name;
        $scope.showAlert('Tracks added to playlist ' + $scope.playlistName, 'success');
      },
      function error(response) {
        $scope.showAlert('Error: ' + response.data, 'danger');
      }
    );
  }
  $scope.createNewPlaylist = function() {
    
    // $scope.showAlert('Playlist ' + $scope.newPlaylistName + ' created');
    let trackUris = [];
    for (let item of $scope.tracks) {
      if (item.selected) 
        trackUris.push(item.track.uri);
    }
    let body = { name: $scope.newPlaylistName, trackUris: trackUris };
    $http.put('/create-new', body).then(
      function success(response) {
        $scope.playlistUrl = response.data.url;
        $scope.playlistName = response.data.name;
        $scope.showAlert('Playlist ' + $scope.newPlaylistName + ' created', 'success');
      },
      function error(response) {
        $scope.showAlert('Error: ' + response.data, 'danger');
      }
    );
    $scope.showAlert(trackUris);
  };
  $scope.updateView = function() {
    var url = '/recent';
    if ($scope.viewId == "0") {
      url = '/recent';
      $scope.timeHeader = 'Last Played';
    }
    else if ($scope.viewId == "1") {
      url = '/current';
      $scope.timeHeader = 'Added';
    }
    else if ($scope.viewId == "2")
      url = '/merged';

    $http.get(url).then( 
      function success(response) {
        $scope.tracks = response.data;
        $scope.showAlert('Succesfully fetched tracks', 'success');
      },
      function error(response) {
        $scope.showAlert('Error: ' + response.data, 'danger');
      }
    );
  }
  $scope.updateView();
});

mainApp.controller('SetPlaylistController', function($scope,$http) {
	$scope.playlistName = "Recently Played Tracks";
  // $scope.message = "";
  $scope.create = function() {
    $scope.message = "Playlist " + $scope.playlistName + " created";
  }
  $scope.update = function() {
    $http.post('/set-playlist', { url: $scope.playlistUrl }).then(
      function success(response) {
        $scope.playlistUrl = response.data.url;
        $scope.playlistName = response.data.name;

        $scope.showAlert('Succesfully fetched tracks', 'success');
      },
      function error(response) {
        $scope.showAlert('Error: ' + response, 'error');
      }
    );	
  }
});