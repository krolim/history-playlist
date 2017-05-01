
var mainApp = angular.module("mainApp", ['ngRoute']);
mainApp.config(['$routeProvider', function($routeProvider) {
  $routeProvider.

  when('/showTracks', {
   templateUrl: 'showTracks.htm',
   controller: 'TracksController'
  }).

  when('/setPlaylist', {
   templateUrl: 'setPlaylist.htm',
   controller: 'SetPlaylistController'
  }).

  otherwise({
    redrectTo: '/showTracks'
  });
}]);

mainApp.controller('HeaderController', function($scope, $location) {
	$scope.isActive = function (viewLocation) { 
    return viewLocation === $location.path();
  };	
});

mainApp.controller('TracksController', function($scope,$http) {
  var url = '/recent';

  $http.get(url).then( function(response) {
    $scope.tracks = response.data;
  });
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
      $scope.message = "Playlist saved!";
    },
    function error(response) {
      $scope.message = "Error: " + response;
    });	
  }
});