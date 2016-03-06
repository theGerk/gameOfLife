//namespaces
var gameOfLife = gameOfLife || {};
var specificPrompt = specificPrompt || {};
var standard = standard || {};

var canvas = document.getElementById('interact');
var render = canvas.getContext('2d');
gameOfLife.colors = {
	foreground: 'black',
	background: 'white'
};

Math.getPeriod = function(input, func) {
	var copy = standard.deepCopy(input);
	var itr = 0;
	do {
		input = func(input);
		itr++;
	} while(!(standard.deepEqual(input, copy)));
	return itr;
};

standard.deepCopy = function(input) {
	//dealing with primitives
	if(!(input instanceof Object))
		return input;

	//all other types
	var output = new input.constructor;
	for(var i in input)
		if(input.hasOwnProperty(i))
			output[i] = standard.deepCopy(input[i]);
	return output;
};

standard.deepEqual = function(a, b) {
	//dealling with primitives
	if(!((a instanceof Object) && (b instanceof Object)))
		return a === b;

	//all other types
	for(var i in a)
		standard.deepEqual(a[i], b[i]);
};

standard.initMatrix = function(xSize, ySize, init) {
	var tmp = new Array(ySize).fill(init);	//create one row of inner array
	var output = new Array(xSize);			//create array for output of the correct length
	
	//fill output array with copies of inner array
	for(var i = 0; i < xSize; i++) {
		output[i] = tmp.slice();
	}
	
	//return
	return output;
};

specificPrompt.gen = function(initStr, correctionStr, paramater, initExample, correctionExample) {
	var output = prompt(initStr, initExample);
	while(!paramater(output))
		output = prompt(correctionStr, correctionExample);
	return output;
};

specificPrompt.naturalNumber = function(initStr, correctionStr, initExample, correctionExample) {
	return +specificPrompt.gen(initStr, correctionStr, function(input) {
		return Number.isInteger(+input) && input >= 0;
	}, initExample, correctionExample);
};

specificPrompt.positiveInteger = function(initStr, correctionStr, initExample, correctionExample) {
	return +specificPrompt.gen(initStr, correctionStr, function(input){
		return Number.isInteger(+input) && input >= 1;
	}, initExample, correctionExample);
};

gameOfLife.start = function(funct) {
	//set default funct to random
	if(!(funct instanceof Function))
		funct = gameOfLife.initGrid.rand;

	//get size of cell
	var size = specificPrompt.positiveInteger('Please enter size of cell in pixels.', 'Please enter a positive integer.');

	//set size of canvas
	var height = specificPrompt.positiveInteger('Please enter the height in cells.\nEach cell is ' + size + ' pixels tall.', 'This must be a positive integer');
	var width = specificPrompt.positiveInteger('Please enter the width in cells.\nEach cell is ' + size + ' pixels wide.', 'This must be a positive integer');
	canvas.height = size * height;
	canvas.width = size * width;

	//set up arrays
	var grid = funct(width, height);
	var grid2 = standard.deepCopy(grid);

	//draw main grid to screen
	drawBitMatrix(grid, render, colors, size);

	//ask for speed
	var speed = specificPrompt.naturalNumber('What speed would you like to run this at (in milliseconds per frame, 0 will go as fast as possible)?', 'Please enter a number greater then or equal to 0.');

	//run simulation
	if(speed === 0)	//if speed is 0 run quick version
		gameOfLife.runThroughFast(grid, grid2, render, colors, size, lifeOf(grid));
	else
		gameOfLife.runThrough(grid, grid2, render, colors, size, speed, 0, lifeOf(grid));
};

var drawBitMatrix = function(grid, element, color, pixelSize) {
	//set up constants for function
	var x_max = grid.length;
	var y_max = grid[0].length;
	
	//resent background
	element.fillStyle = color.background;
	element.fillRect(0, 0, x_max * pixelSize, y_max * pixelSize);
	
	//change to foreground color
	element.fillStyle = color.foreground;
	for(var x = 0; x < x_max; x++) {
		var tmp = grid[x];
		for(var y = 0; y < y_max; y++) {
			if(tmp[y]) {
				element.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
			}
		}
	}
};

gameOfLife.runThroughFast = function(grid, backgroundGrid, element, color, size, startNumb) {
	//get iterations between renders
	var iterationsBetweenRender = specificPrompt.naturalNumber('Please enter number of iterations between rendering.\n(0 is reserved for no rendering.)', 'Number must be greater then or equal to 0');
	
	//run loop
	var iterations = 0;
	do {
		//apply iteration to main grid, and two to background grid
		grid = applyItteration(grid);
		backgroundGrid = applyIteration(applyIteration(backgroundGrid));
		
		//draw to canvas
		if(iterations % iterationsBetweenRender === 0)
			drawBitMatrix(grid, element, color, size);
	} while(!standard.deepEqual(grid, backgroundGrid));
	
	//output end information
	gameOfLife.outputInfo(iterations, grid, startNumb);
};

gameOfLife.runThroughSlow = function(grid, backgroundGrid, element, color, size, speed, iterations, startNumb) {
	//apply one iteration to main grid, and two to the background grid
	grid = applyIteration(grid);
	backgroundGrid = applyIteration(applyIteration(backgroundGrid));
	
	//draw to canvas
	drawBitMatrix(grid, element, color, size);
	
	//check if we've hit the end
	if(standard.deepEqual(grid, backgroundGrid))
		gameOfLife.outputInfo(iterations, grid, startNumb);
	else
		setTimeout(function(){
			runThrough(grid, element, color, size, speed, backgroundGrid, iterations + 1, startNumb);
		}, speed);
};

gameOfLife.outputInfo = function(iterations, grid, startNumb) {
	alert('Hit stability at around ' + iterations + ' iterations.\nYou are on a period of: ' + gameOfLife.getPeriod(grid) + '\nYou started with ' + startNumb + 'and...\n there are currently ' + gameOfLife.lifeOf(grid) + ' cells out of ' + grid.length * grid[0].length);
};

gameOfLife.lifeOf = function(input) {
	var output = 0;
	for(var i = 0; i < input.length; i++)
		for(var j = 0; j < input[i].length; j++)
			if(input[i][j] === true)
				output++;
	return output;
};

gameOfLife.getPeriod = function(start) {
	return Math.getPeriod(start, gameOfLife.applyIteration);
};

gameOfLife.initGrid = {
	solidSquareInCenter: function(width, height) {
		var output = [];

		var cords = {h: {start: Math.floor(height / 4), end: Math.ceil(3 * height / 4)},
					 w: {start: Math.floor(width / 4) , end: Math.ceil(3 * width / 4)}};


		//iterate for each bit
		for(var w = 0; w < width; w++) {
			var addin = [];
			for(var h = 0; h < height; h++) {
				addin.push(h > cords.h.start && h < cords.h.end && w > cords.w.start && w < cords.w.end);
			}
			output.push(addin);
		}

		return output;
	},

	solidCircle: function(width, height) {
		var output = [];

		var radius = (height < width) ? height / 3 : width / 3;
		var center = {h: height / 2, w: width / 2};

		//iterate for each bit
		for(var w = 0; w < width; w++) {
			var addin = [];
			for(var h = 0; h < height; h++) {
				addin.push((h - center.h) * (h - center.h) + (w - center.w) * (w - center.h) < radius * radius);
			}
			output.push(addin);
		}

		return output;
	},

	dead: function(width, height) {
		var output = [];

		for(var w = 0; w < width; w++) {
			var addin = [];
			addin.length = height;
			output.push(addin);
		}

		return output;
	},

	randCircle: function(width, height) {
		var output = [];

		var radius = (height < width) ? height / 3 : width / 3;
		var center = {h: height / 2, w: width / 2};

		//iterate for each bit
		for(var w = 0; w < width; w++) {
			var addin = [];
			for(var h = 0; h < height; h++) {
				addin.push((Math.random() < .5) && ((h - center.h) * (h - center.h) + (w - center.w) * (w - center.h) < radius * radius));
			}
			output.push(addin);
		}

		return output;
	},

	rand: function(width, height) {
		var output = [];

		//iterate for each bit
		for(var w = 0; w < width; w++) {
			var addin = [];
			for(var h = 0; h < height; h++) {
				addin.push(Math.random() >= .5);
			}
			output.push(addin);
		}

		return output;
	},

	randSquareInCenter: function(width, height) {
		var output = [];

		var cords = {h: {start: Math.floor(height / 4), end: Math.ceil(3 * height / 4)},
					 w: {start: Math.floor(width / 4) , end: Math.ceil(3 * width / 4)}};

		for(var w = 0; w < width; w++) {
			var addin = [];
			for(var h = 0; h < height; h++) {
				addin.push(Math.random() < .5 && h > cords.h.start && h < cords.h.end && w > cords.w.start && w < cords.w.end);
			}
			output.push(addin);
		}
		return output;
	}
};

gameOfLife.createNumberGrid = function(input) {
	//create any constants needed
	var I_MAX = input.length;
	var J_MAX = input[0].length;
	
	//create output array with 0s everywhere
	var output = standard.initMatrix(I_MAX, J_MAX, 0);
	
	//iterate through all integer vectors in the range [<-1, -1>, <1, 1>], not including <0, 0>
	for(var x = -1; x <= 1; x++) {
		for(var y = -1; y <= 1; y++) {
			//skip <0, 0>
			if(x === 0 && y === 0)
				continue;
			
			//setup x and i initilizations
			var iStart = 0, iMax = I_MAX;
			if(x === -1)
				iStart++;
			else if(x === 1)
				iMax--;
			
			//setup y and j inilitizations
			var jStart = 0, jMax = J_MAX;
			if( y === -1)
				jStart++;
			else if(x === 1)
				jMax--;
			
			//for loops
			for(i = iStart; i < iMax; i++) {
				
				//make temp grid (less derefrencing)
				var tmpInput = input[i];
				var tmpOut = output[i + x];
				for(j = jStart; j < jMax; j++) {
					tmpOut[j] += tmpInput[j + y];
				}
			}
		}
	}
	
	//give otuput
	return output;
};

gameOfLife.applyIteration = function(grid) {
	//create number grid
	var numbers = gameOfLife.createNumberGrid(grid);
	
	//create max values for loop
	var IMAX = grid.length, JMAX = grid[0].length;
	
	//create array to use for output
	var output = new Array(IMAX);

	for(var i = 0; i < IMAX; i++) {
		var tmpNumb = numbers[i];
		var tmpGrid = grid[i];
		var tmpOutput = new Array(JMAX);
		for(var j = 0; j < JMAX; j++) {
			tmpOutput[j] = gameOfLife.compute(tmpGrid[j], tmpNumb[j]);
		}
		output[i] = tmpOutput;
	}
	
	return output;
};


gameOfLife.compute = function(prevVal, numbAdjacent) {
	if(prevVal)
		if(numbAdjacent === 2 || numbAdjacent === 3)
			return true;
		else
			return false;
	else
		if(numbAdjacent === 3)
			return true;
		else
			return false;
};