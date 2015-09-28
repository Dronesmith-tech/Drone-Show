'use strict';

angular.module('droneshowApp')
  .controller('MainCtrl', function ($scope, $http, ngAudio) {
    $scope.awesomeThings = [];
    $scope.scriptList = [];
    $scope.soundList = [];
    $scope.soundPath = "";
    $scope.audioStatus = {};

    $scope.action = function(thing) {
      if (thing.sound) {
        $scope.audioStatus[thing.sound] =
          ngAudio.play("assets/sounds/" + thing.sound);
      }

      if (thing.cmd || thing.script) {
        $http.post('/api/things', thing);
      }
    }

    $scope.stopMusic = function(thing) {
      if ($scope.audioStatus[thing.sound]) {
        $scope.audioStatus[thing.sound].stop();
      }
    }

    $scope.updateClear = function(thing) {
      thing.cmd = "";
      thing.name = "";
      thing.script = "";
      thing.sound = "";

      $http.put('/api/things', $scope.awesomeThings);
    }

    $scope.updateName = function(thing, selectedRaw, channel, value) {
      // if (selectedRaw && parseInt(value)) {
      //   thing.cmd = parseInt(channel) + 'c' + parseInt(value) + 'w';
      // }
      

      $http.put('/api/things', $scope.awesomeThings);
    }

    $http.get('/api/things').success(function(chunk) {
      $scope.awesomeThings = chunk.things;
      $scope.scriptList = chunk.scripts;
      $scope.soundList = chunk.sounds;
      $scope.soundPath = chunk.soundPath;
    });

  });
