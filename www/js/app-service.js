angular.module('scratchpaper')

.factory("DrawingDelegate", function() {
    var delegates = [];

    return {
//    for multiple instances of the same directive
      _delegates: delegates,
      _registerMe: function(id, delegate) {
          delegates[id] = delegate;
      }
    };
});

