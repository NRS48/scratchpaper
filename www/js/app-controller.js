angular.module('scratchpaper')

.controller('DrawingCtrl', function($scope, DrawingDelegate, $ionicPopup, $ionicLoading) {
    $scope.resetCanvas = function() {
      DrawingDelegate.clear();
    };
    $scope.userAgent = window.navigator.userAgent;

    $scope.savePopup = function() {
      $scope.padFile = {};
//      var popup = $ionicPopup.show({
//        // keyboard resizes canvas!
//        template: '<input type="text" ng-model="padFile.filename">',
//        title: 'Enter file name',
//        scope: $scope,
//        buttons: [
//          {text: 'Cancel'},
//          {
//            text: 'OK',
//            type: 'button-positive',
//            onTap: function(e) {
//              if (!$scope.padFile.filename) {
//                e.preventDefault();
//              } else {
//                return $scope.padFile.filename;
//              }
//            }
//          }
//        ]
//      });
//      popup.then(function(res) {
//        if (typeof res === 'undefined') return;
//        window.canvas2ImagePlugin.saveImageDataToLibrary(
//          function(msg) {
//            $ionicLoading.show({ template: msg, noBackdrop: true, duration: 2000 });
//          },
//          function(err) {
//            $ionicLoading.show({ template: err, noBackdrop: true, duration: 2000 });
//          },
//          'scratch'
//        );
//      })
      var popup = $ionicPopup.confirm({
        title: 'Save to Gallery'
//        template: ''
      });
      popup.then(function(res) {
        if (!res) return;
        window.canvas2ImagePlugin.saveImageDataToLibrary(
          function(msg) {
            $ionicLoading.show({ template: msg, noBackdrop: true, duration: 2000 });
          },
          function(err) {
            $ionicLoading.show({ template: err, noBackdrop: true, duration: 2000 });
          },
          'scratch'
        );
      })
    };
});