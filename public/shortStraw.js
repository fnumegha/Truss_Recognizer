var ShortStraw = {
  run: function(sketch) {
    // return no corners for an empty sketch
    if (sketch.strokes.length === 0) {return []; }

    var strokes = sketch.strokes;
    var sketchCorners = [];
    for (var i = 0; i < strokes.length; i++) {
      var points = strokes[i].points;
      var strokeCorners = this.findShortStrawCorners(points);
      sketchCorners.push(strokeCorners);
    }
    return sketchCorners;
  },

  findShortStrawCorners: function(points) {
	
    var corners = [];
	
	console.log("Corners :",corners);
   
	// ----- start algorithm -----
    // add the first point index
    corners.push(0);
	
	console.log("AFTERPUSH ---------Corners :",corners);

    // handle singleton-stroke case
    if (points.length === 1) { return corners; }
	 for(var i=0;i<corners.length;i++) {
		console.log(i,"->", corners[i]);	
	}

    // create the straws and straw range
    var straws = [];
	console.log("1 ---- Corners :",corners);
    // collect the straw distances
    for (var i = this.W; i < points.length - this.W; i++) {
      var straw0 = points[i - this.W];
      var strawN = points[i + this.W];
      var strawDistance = SketchRecTools.calculateDistance(straw0.x, straw0.y, strawN.x, strawN.y);
      straws.push(strawDistance);
    }

    // calculate the pseudo-median
    var t = ShortStraw.calculateMedian(straws) * 0.95;
	console.log("2 ------ Corners :",corners);
    // iterate through each straw distance
    for (var i = 0; i < straws.length; i++) {

      // case: the current straw distance is less than the pseudo-median
      if (straws[i] < t) {

        // initialize the local min and min index's starting values
        var localMin = Number.MAX_SAFE_INTEGER;
        var localMinIndex = i;

        // iterate through the local straw distance cluster
        while (i < straws.length && straws[i] < t) {

          // local min (i.e., corner index) candidate found
          if (straws[i] < localMin) {
            localMin = straws[i];
            localMinIndex = i;
          }

          // iterate through the local cluster
          // note: need to iterate through i in inner loop to skip local cluster in outer loop
          i = i + 1;
        }

        // add the corner index of local cluster to the corner indices array
        // note: need to add W to offset between the straw indices and point indices
		console.log(localMinIndex, "W :", this.W);
		corners.push(localMinIndex + this.W);
		console.log("-------------HELLOOOOOOOOOOOOOOOOOO-----------");
      }
    }

    // add the last point index
    corners.push(points.length - 1);
	console.log("Corners before ppc: ", corners);
    corners = this.postProcessCorners(points, corners, straws);
    return corners;
  },

  postProcessCorners: function(points, corners, straws) {
    // ----- start corner post-processing check #1 -----
    var advance = false;
    while (!advance) {
      advance = true;
	  

      // iterate through the corner indices
      for (var i = 1; i < corners.length; i++) {
		console.log(corners.length);
        // get the previous and current corner indices
        var c1 = corners[i - 1];
        var c2 = corners[i];
		console.log(i,"--Corners before isLine", corners);
        // check if line is formed between previous and current corner indices
        var isLine = this.isLine(points, c1, c2);
        if (!this.isLine(points, c1, c2)) {

          // get the candidate halfway corner
          // offset it by W due to straw indices and points indices mis-match
          var newCorner = this.halfwayCorner(straws, c1, c2);
          newCorner = newCorner + this.W;

          // skip adding new corner, since it already exists
          // can happen during an overzealous halfway corner calculation
          if (newCorner === c2) {
            continue;
          }

          corners.splice(i, 0, newCorner);
          advance = false;
        }
      }
		
      // emergency stop
      if (corners.length > 15) { console.log("WARNING: Infinite Loop"); break; }
    }
    // ----- end corner post-processing check #1 -----

    // ----- start corner post-processing check #2 -----
    for (var i = 1; i < corners.length - 1; i++) {
      
	  var c1 = corners[i - 1];
      var c2 = corners[i + 1];
	  console.log("Corners before isLine", corners);
	  
      var isLine = this.isLine(points, c1, c2);
      if (isLine) {
        corners.splice(i, 1);
        i = i - 1;
      }
    }

    // ----- end corner post-processing check #2 -----
    return corners;
  },

  isLine: function(points, a, b) {
	
    var subset = points.slice(a, b + 1);
	
    var threshold = 0.95;
    var startPoint = points[a];
    var endPoint = points[b];

    var ax = startPoint.x;
    var ay = startPoint.y;
    var bx = endPoint.x;
    var by = endPoint.y;
    var distance = SketchRecTools.calculateDistance(ax, ay, bx, by);
    var pathDistance = SketchRecTools.calculatePathLength({ strokes: [ {points: subset} ] });
    return distance / pathDistance > threshold;
  },

  halfwayCorner: function(straws, a, b) {

    var quarter = Math.floor((b - a) / 4);
    var minValue = Number.MAX_SAFE_INTEGER;
    var minIndex = a + quarter;

    for (var i = a + quarter; i < b - quarter; i++) {
      if (straws[i] < minValue) {
        minValue = straws[i];
        minIndex = i;
      }
    }

    return minIndex;
  },

  calculateMedian: function(inputs) {
    var values = [];
    for (var i = 0; i < inputs.length; i++) {
      values.push(inputs[i]);
    }

    values.sort( function(a,b) {return a - b;} );
    var half = Math.floor(values.length/2);
    if (values.length % 2)
        return values[half];
    else
        return (values[half-1] + values[half]) / 2.0;
  },

  W: 3,
};
