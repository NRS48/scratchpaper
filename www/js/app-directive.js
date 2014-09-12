angular.module('scratchpaper')

.directive("nrsDrawingPad", function($window, DrawingDelegate) {

    function copyTouch(touch, color) {
        return { identifier: touch.identifier, clientX: touch.clientX, clientY: touch.clientY, color: color };
    }

    // Returns a random integer between min (included) and max (excluded)
    // Using Math.round() will give you a non-uniform distribution!
    function getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    function colorForTouch(touch) {
//        var r = touch.identifier % 16;
//        var g = Math.floor(touch.identifier / 3) % 16;
//        var b = Math.floor(touch.identifier / 7) % 16;
        var r = getRandomInt(0, 254);
        var g = getRandomInt(0, 254);
        var b = getRandomInt(0, 254);
        r = r.toString(16); // make it a hex digit
        g = g.toString(16); // make it a hex digit
        b = b.toString(16); // make it a hex digit
        var color = "#" + r + g + b;
        return color;
    }

    function ongoingTouchIndexById(idToFind, ongoingTouches) {
        for (var i=0; i < ongoingTouches.length; i++) {
            var id = ongoingTouches[i].identifier;
            if (id == idToFind) {
                return i;
            }
        }
        return -1;    // not found
    }

    function findPosition(obj) {
//        var curleft = 0,
//            curtop = 0;
//        if (obj.offsetParent) {
//            do {
//                curleft += obj.offsetLeft;
//                curtop += obj.offsetTop;
//            } while (obj = obj.offsetParent);
//
//            return { x: curleft-document.body.scrollLeft, y: curtop-document.body.scrollTop };
//        }
        var rect = obj.getBoundingClientRect();
        return { x: rect.left, y: rect.top, width: rect.right - rect.left, height: rect.bottom - rect.top};
    }

    return {
      restrict: "E",
      templateUrl: 'nrs-drawing-pad.html',
      replace: true,
      scope: {},
      link: function(scope, element){
        // ToDo: check if canvas; if not, fail fast
        var drawingElement = angular.element(element.children()[0]);
        var drawingCanvas = drawingElement[0];
        var ctx = drawingCanvas.getContext('2d');

        // variable that decides if something should be drawn on mousemove
        var drawing = false;
        // the last coordinates before the current move
        var lastX;
        var lastY;
        var ongoingTouches = new Array();

        // http://www.html5rocks.com/en/tutorials/casestudies/gopherwoord-studios-resizing-html5-games/
        var widthToHeight = 3/4;
        var window = angular.element($window);
        scope.resize = function() {
          var parent = element;
          var topParent = parent.parent();
          var newWidth = topParent[0].clientWidth;
          var newHeight = topParent[0].clientHeight;
          var newWidthToHeight = newWidth / newHeight;

          if (newWidthToHeight > widthToHeight) {
              newWidth = newHeight * widthToHeight;
              parent[0].style.height = newHeight + 'px';
              parent[0].style.width = newWidth + 'px';
          } else {
              newHeight = newWidth / widthToHeight;
              parent[0].style.width = newWidth + 'px';
              parent[0].style.height = newHeight + 'px';
          }
          parent[0].style.marginTop = (-newHeight / 2) + 'px';
          parent[0].style.marginLeft = (-newWidth / 2) + 'px';

          var imgData = getImageData();
          drawingCanvas.width = newWidth;
          drawingCanvas.height = newHeight;
          ctx.putImageData(imgData, 0, 0);
          console.log("resize called");
        }
        scope.debouncedResize = ionic.debounce(scope.resize, 500);
        window.bind('resize', function() {
          scope.debouncedResize();
          // ToDo: Update models
//            scope.$digest();
        });

        // Initialize canvas
        scope.resize();
        reset();

        function drawStart(event){
            if(event.offsetX !== undefined){
              lastX = event.offsetX;
              lastY = event.offsetY;
            } else {
              lastX = event.layerX - event.currentTarget.offsetLeft;
              lastY = event.layerY - event.currentTarget.offsetTop;
            }

            // begins new line
            ctx.beginPath();

            drawing = true;
        }
        function drawUpdate(event){
            if(drawing){
                // get current mouse position
                if(event.offsetX!==undefined){
                    currentX = event.offsetX;
                    currentY = event.offsetY;
                } else {
                    currentX = event.layerX - event.currentTarget.offsetLeft;
                    currentY = event.layerY - event.currentTarget.offsetTop;
                }

                draw(lastX, lastY, currentX, currentY);

                // set current coordinates to last one
                lastX = currentX;
                lastY = currentY;
            }
        }
        function drawStop(event){
            // stop drawing
            drawing = false;
        }
        drawingElement.bind('mousedown', drawStart);
        drawingElement.bind('mousemove', drawUpdate);
        drawingElement.bind('mouseup', drawStop);

        function touchDrawStart(event){
            event.preventDefault();
            var touches = event.changedTouches;
            var elementOffset = findPosition(drawingCanvas);

            for (var i=0; i < touches.length; i++) {
                var tX = touches[i].clientX - elementOffset.x;
                var tY = touches[i].clientY - elementOffset.y;
                if (tX < 0 ||
                    tX > elementOffset.width ||
                    tY < 0 ||
                    tY > elementOffset.height
                    ) {
                    continue;
                }
                var color = colorForTouch(touches[i]);
                ongoingTouches.push(copyTouch(touches[i], color));
                ctx.beginPath();
                ctx.arc(tX, tY, 2, 0, 2 * Math.PI, false);  // a circle at the start
                ctx.fillStyle = color;
                ctx.fill();
            }
        }
        function touchDrawUpdate(event){
            event.preventDefault();
            var touches = event.changedTouches;
            var elementOffset = findPosition(drawingCanvas);

            for (var i=0; i < touches.length; i++) {
                var tX = touches[i].clientX - elementOffset.x;
                var tY = touches[i].clientY - elementOffset.y;
                if (tX < 0 ||
                    tX > elementOffset.width ||
                    tY < 0 ||
                    tY > elementOffset.height
                    ) {
                    continue;
                }
                var idx = ongoingTouchIndexById(touches[i].identifier, ongoingTouches);

                if(idx >= 0) {
                    ctx.beginPath();
                    ctx.moveTo(ongoingTouches[idx].clientX - elementOffset.x, ongoingTouches[idx].clientY - elementOffset.y);
                    ctx.lineTo(touches[i].clientX - elementOffset.x, touches[i].clientY - elementOffset.y);
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = ongoingTouches[idx].color;
                    ctx.stroke();

                    ongoingTouches.splice(idx, 1, copyTouch(touches[i], ongoingTouches[idx].color));  // swap in the new touch record
                } else {
                    console.log("can't figure out which touch to continue");
                }
            }
        }
        function touchDrawStop(event){
            event.preventDefault();
            var touches = event.changedTouches;
            var elementOffset = findPosition(drawingCanvas);

            for (var i=0; i < touches.length; i++) {
                var tX = touches[i].clientX - elementOffset.x;
                var tY = touches[i].clientY - elementOffset.y;
                if (tX < 0 ||
                    tX > elementOffset.width ||
                    tY < 0 ||
                    tY > elementOffset.height
                    ) {
                    continue;
                }
                var idx = ongoingTouchIndexById(touches[i].identifier, ongoingTouches);

                if(idx >= 0) {
                    ctx.lineWidth = 1;
                    ctx.fillStyle = ongoingTouches[idx].color;
                    ctx.beginPath();
                    ctx.moveTo(ongoingTouches[idx].clientX - elementOffset.x, ongoingTouches[idx].clientY - elementOffset.y);
                    ctx.lineTo(touches[i].clientX - elementOffset.x, touches[i].clientY - elementOffset.y);
//                        ctx.fillRect(touches[i].pageX-4, touches[i].pageY-4, 8, 8);  // and a square at the end
                    ongoingTouches.splice(idx, 1);  // remove it; we're done
                } else {
                    console.log("can't figure out which touch to end");
                }
            }
        }
        function touchDrawCancel(event) {
            event.preventDefault();
            var touches = event.changedTouches;
            for (var i=0; i < touches.length; i++) {
                var idx = ongoingTouchIndexById(touches[i].identifier, ongoingTouches);
                if(idx >= 0) {
                    ongoingTouches.splice(idx, 1);  // remove it; we're done
                } else {
                    console.log("can't figure out which touch to end");
                }
            }
        }
        drawingElement.bind('touchstart', touchDrawStart);
        drawingElement.bind('touchmove', touchDrawUpdate);
        drawingElement.bind('touchend', touchDrawStop);
        drawingElement.bind('touchleave', touchDrawStop);
        drawingElement.bind('touchcancel', touchDrawCancel);

        // canvas reset
        // http://stackoverflow.com/questions/2142535/how-to-clear-the-canvas-for-redrawing
        function reset(){
            // Store the current transformation matrix
            ctx.save();

            // Use the identity matrix while clearing the canvas
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, drawingCanvas.width, drawingCanvas.height);

            // Restore the transform
            ctx.restore();
        }

        function getImageData() {
          return ctx.getImageData(0, 0, drawingCanvas.width, drawingCanvas.height);
        }

        function draw(lX, lY, cX, cY){
            // line from
            ctx.moveTo(lX,lY);
            // to
            ctx.lineTo(cX,cY);
            // color
            ctx.strokeStyle = "#4bf";
            // draw it
            ctx.stroke();
        }

        // Register delegate
        DrawingDelegate.clear = reset;
      }
  };
});