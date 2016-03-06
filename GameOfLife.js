//namespaces
var gameOfLife = gameOfLife || {};
var specificPrompt = specificPrompt || {};
var standard = standard || {};

var canvas = document.getElementById('interact');
var render = canvas.getContext('2d');
var colors = {foreground: 'black', background: 'white'};

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

specificPrompt.gen = function(initStr, correctionStr, paramater, initExample, correctionExample) {
	var output = prompt(initStr, initExample);
	while(!paramater(output))
		output = prompt(correctionStr, correctionExample);
	return output;
};

specificPrompt.positiveInteger = function(initStr, correctionStr, initExample, correctionExample) {
	return +specificPrompt.gen(initStr, correctionStr, function(input){
		return Number.isInteger(+input) && input >= 1;
	}, initExample, correctionExample);
};

gameOfLife.runGrid = function(funct) {
	//set default funct to random
	if(!(funct instanceof Function))

	//get size of cell
	var size = specificPrompt.positiveInteger('Please enter size of cell in pixels.', 'Please enter a positive integer.');

	//set size of canvas
	var height = specificPrompt.positiveInteger('Please enter the height in cells.\nEach cell is ' + size + ' pixels tall.', 'This must be a positive integer');
	var width = specificPrompt.positiveInteger('Please enter the width in cells.\nEach cell is ' + size + ' pixels wide.', 'This must be a positive integer');
	canvas.height = size * height;
	canvas.width = size * width;

	//set up arrays
	var grid = funct(height, width);
	var grid2 = standard.deepCopy(grid);

	//draw main grid to screen
	drawBitMaxtrix(grid, render, colors, size);

	//ask for speed
	var speed = specificPrompt.positiveInteger('What speed would you like to run this at (in milliseconds)?', 'Please enter a number greater then or equal to 1.');

	//run simulation
	runThrough(grid, grid2, render, colors, size, speed, 0, lifeOf(grid));
};

var drawBitMaxtrix = function(grid, element, color, size) {
	element.fillStyle = color.background;
	element.fillRect(0, 0, grid[0].length * size, grid.length * size);
	element.fillStyle = color.foreground;
	for(var i = 0; i < grid.length; i++) {
		for(var j = 0; j < grid[i].length; j++) {
			if(grid[i][j]) {
				element.fillRect(j * size, i * size, size, size);
			}
		}
	}
};

var runThrough = function(grid, backgroundGrid, element, color, size, speed, iterations, startNumb) {
	grid = applyIteration(grid);
	backgroundGrid = applyIteration(applyIteration(backgroundGrid));
	drawBitMaxtrix(grid, element, color, size);
	if(equal(grid, backgroundGrid))
		alert("Hit consistancy at around " + iterations + " iterations.\nYou are on a period of: " + getPeriod(grid) + "\nYou started with " + startNumb + " and...\nthere are currently " + lifeOf(grid) + " cells out of " + grid.length * grid[0].length);
	else
		setTimeout(function(){
			runThrough(grid, element, color, size, speed, backgroundGrid, iterations + 1, startNumb);
		}, speed);
};

var lifeOf = function(input) {
	var output = 0;
	for(var i = 0; i < input.length; i++)
		for(var j = 0; j < input[i].length; j++)
			if(input[i][j] === true)
				output++;
	return output;
};

var getPeriod = function(start) {
	var iter = applyIteration(start);
	for(var output = 1; !equal(start, iter); output++)
		iter = applyIteration(start);
	return output;
};


var equal = function(a, b) {
	for(var i = 0; i < a.length; i++)
		for(var j = 0; j < a[i].length; j++)
			if(a[i][j] !== b[i][j])
				return false;
	return true;
};


var initGrid = {
	solidSquareInCenter: function(height, width) {
		var output = [];

		var cords = {h: {start: Math.floor(height / 4), end: Math.ceil(3 * height / 4)},
					 w: {start: Math.floor(width / 4) , end: Math.ceil(3 * width / 4)}};


		//iterate for each bit
		for(var h = 0; h < height; h++) {
			var addin = [];
			for(var w = 0; w < width; w++) {
				addin.push(h > cords.h.start && h < cords.h.end && w > cords.w.start && w < cords.w.end);
			}
			output.push(addin);
		}

		return output;
	},

	solidCircle: function(height, width) {
		var output = [];

		var radius = (height < width) ? height / 3 : width / 3;
		var center = {h: height / 2, w: width / 2};

		//iterate for each bit
		for(var h = 0; h < height; h++) {
			var addin = [];
			for(var w = 0; w < width; w++) {
				addin.push((h - center.h) * (h - center.h) + (w - center.w) * (w - center.h) < radius * radius);
			}
			output.push(addin);
		}

		return output;
	},

	dead: function(height, width) {
		var output = [];

		for(var h = 0; h < height; h++) {
			var addin = [];
			addin.length = width;
			output.push(addin);
		}

		return output;
	},

	randCircle: function(height, width) {
		var output = [];

		var radius = (height < width) ? height / 3 : width / 3;
		var center = {h: height / 2, w: width / 2};

		//iterate for each bit
		for(var h = 0; h < height; h++) {
			var addin = [];
			for(var w = 0; w < width; w++) {
				addin.push((Math.random() < .5) && ((h - center.h) * (h - center.h) + (w - center.w) * (w - center.h) < radius * radius));
			}
			output.push(addin);
		}

		return output;
	},

	rand: function(height, width) {
		var output = [];

		//iterate for each bit
		for(var h = 0; h < height; h++) {
			var addin = [];
			for(var w = 0; w < width; w++) {
				addin.push(Math.random() >= .5);
			}
			output.push(addin);
		}

		return output;
	},

	randSquareInCenter: function(height, width) {
		var output = [];

		var cords = {h: {start: Math.floor(height / 4), end: Math.ceil(3 * height / 4)},
					 w: {start: Math.floor(width / 4) , end: Math.ceil(3 * width / 4)}};

		for(var h = 0; h < height; h++) {
			var addin = [];
			for(var w = 0; w < width; w++) {
				addin.push(Math.random() < .5 && h > cords.h.start && h < cords.h.end && w > cords.w.start && w < cords.w.end);
			}
			output.push(addin);
		}
		return output;
	}
};


/*
 * @param grid: array of arrays of booleans
 */
var applyIteration = function(grid) {
	var output = [];

	//iterate through grid
	for(var i = 0; i < grid.length; i++) {
		var addin = [];
		for(var j = 0; j < grid[i].length; j++) {
			addin.push(compute(grid, i, j));
		}
		output.push(addin);
	}
	return output;
};


var compute = function(grid, x, y) {
	var sum = summiate(grid, x, y);
	if(!grid[x][y] && sum === 3)
		return true;
	else if(grid[x][y] && (sum === 3 || sum === 2))
		return true;
	else
		return false;
};

var summiate = function(grid, x, y) {
	var out = 0;
	var xm = x - 1 >= 0;
	var xp = x + 1 < grid.length;
	var ym = y - 1 >= 0;
	var yp = y + 1 < grid[0].length;
	if(xm) {
		out += grid[x - 1][y];
		if(ym)
			out += grid[x - 1][y - 1];
		if(yp)
			out += grid[x - 1][y + 1];
	}
	if(xp) {
		out += grid[x + 1][y];
		if(ym)
			out += grid[x + 1][y - 1];
		if(yp)
			out += grid[x + 1][y + 1];
	}
	if(ym)
		out += grid[x][y - 1];
	if(yp)
		out += grid[x][y + 1];

	return out;
};
