function Blox(id)
{
	// Constants
	this.cols = 64;
	this.rows = 25;
	this.tileWidth = this.tileHeight = 11;
	this.smallBallSize = 22;
	this.normalBallSize = 44;
	this.ballSize = this.smallBallSize;
	this.pillSize = 24;

	// Variables
	this.frames = 0;
	this.redraw = true;
	this.lastTime = new Date();

	// Canvas
	$('#' + id).html('<canvas id="blox" width="675" height="500"></canvas>');

	this.canvas = document.getElementById('blox');
	this.context = this.canvas.getContext('2d');

	// Resources counter
	this.resourcesLoading = 0;

	// Tiles
	this.numTiles = 6;
	this.tiles = new Array(this.numTiles);

	// Balls
	this.numBalls = 3;
	this.balls = new Array(this.numBalls);
	this.playBalls = new Array();

	// Pills
	this.numPills = 8;
	this.pills = new Array(this.numPills);

	this.playPills = new Array();

	// Paddles
	this.numPaddles = 1;
	this.paddles = new Array(this.numPaddles);

	// Players
	this.numPlayers = 1;
	this.players = new Array();

	// Create players
	for (var i = 0; i < this.numPlayers; i++)
	{
		this.players[i] = new Player(this, i, 'Player ' + (i + 1));
		this.players[i].lastX = this.players[i].x = this.canvas.width / 2 - this.players[i].width / 2;
		this.players[i].lastY = this.players[i].y = this.canvas.height - this.players[i].height;
	}

	// Blocks
	this.blocks = new Array(this.cols);
	this.invalidate = new Array(this.cols);
	for (var x = 0; x < this.cols; x++) this.blocks[x] = new Array(this.rows);
	for (var x = 0; x < this.cols; x++) this.invalidate[x] = new Array(this.rows);

	for (var y = 0; y < this.rows; y++)
	{
		for (var x = 0; x < this.cols; x++)
		{
			this.blocks[x][y] = undefined;
			this.invalidate[x][y] = true;
		}
	}

	// Init display
	this.updateBalls();
	this.updateScore();

	// Reset power ups
	this.resetPowerUps(0);
}

Blox.prototype.updateStuck = function(p)
{
	// Move stuck balls with paddle
	for (var i = 0; i < this.playBalls.length; i++)
	{
		if (this.playBalls[i] != undefined)
		{
			if (this.playBalls[i].stuck)
			{
				this.playBalls[i].x = this.players[p].x + this.playBalls[i].stuckX;
				this.playBalls[i].y = this.players[p].y + this.playBalls[i].stuckY;
			}
		}
	}
}

Blox.prototype.init = function()
{
	var me = this;

	// Display loading screen
	$('#init').fadeIn();

	$('#init').click(function()
	{
		$('#init').fadeOut();
	});

	// Load the paddles
	for (var i = 0; i < this.numPaddles; i++)
	{
		this.paddles[i] = new Image();
		this.paddles[i].src = 'img/404/paddle/' + i + '.png';

		this.resourcesLoading++;
		this.paddles[i].onload = function() { me.resourcesLoading--; };
	}

	// Load the balls
	for (var i = 0; i < this.numBalls; i++)
	{
		this.balls[i] = new Image();
		this.balls[i].src = 'img/404/ball/' + i + '.png';

		this.resourcesLoading++;
		this.balls[i].onload = function() { me.resourcesLoading--; };
	}

	// Load the pills
	for (var i = 0; i < this.numPills; i++)
	{
		this.pills[i] = new Image();
		this.pills[i].src = 'img/404/pill/' + i + '.png';

		this.resourcesLoading++;
		this.pills[i].onload = function() { me.resourcesLoading--; };
	}

	// Input devices
	$('html').mousemove(function(e)
	{
		var b = document.getElementById('blox');

		me.players[0].x = (e.pageX - b.offsetLeft) - (me.players[0].width / 2);

		// X position check on player paddle
		if (me.players[0].x < 0) me.players[0].x = 0;
		if (me.players[0].x + me.players[0].width > b.width) me.players[0].x = b.width - me.players[0].width;

		me.updateStuck(0);
	});

	$('#blox').click(function()
	{
		for (var i = 0; i < me.playBalls.length; i++)
		{
			if (me.playBalls[i] != undefined)
			{
				if (me.playBalls[i].stuck)
				{
					me.playBalls[i].dx = me.playBalls[i].stuckX < me.players[0].width / 2 ? -me.playBalls[i].maxXspeed : me.playBalls[i].maxXspeed;
					me.playBalls[i].dy = -me.playBalls[i].maxYspeed;
					me.playBalls[i].stuck = false;
				}
			}
		}

		if (!me.checkPlay())
		{
			if (me.players[0].balls > 0)
			{
				me.players[0].balls--;
				me.createBall();
				me.updateBalls();
			}
		}
	});

	// Keyboard controls
	$(document).keydown(function(e)
	{
		if ((e.keyCode || e.which) == 37) me.players[0].left();
		else if ((e.keyCode || e.which) == 39) me.players[0].right();
		else if ((e.keyCode || e.which) == 32) $('#blox').click();
		else if ((e.keyCode || e.which) == 27) me.get_name();
	});

	$(document).keyup(function(e)
	{
		me.players[0].stop();
	});

	// Load level
	this.loadLevel(level_404);

	// Rendering timer
	this.renderTimer();
}

Blox.prototype.loadLevel = function(l)
{
	for (var y = 0; y < this.rows; y++)
		for (var x = 0; x < this.cols; x++)
			this.blocks[x][y] = l[y][x] == 9 ? undefined : l[y][x];
}

Blox.prototype.randomLevel = function()
{
	// Random level
	for (var y = 0; y < this.rows; y++)
		for (var x = 0; x < this.cols; x++)
			this.blocks[x][y] = random(this.numTiles);
}

Blox.prototype.createBall = function()
{
	var b = new Ball(this, 0);

	b.lastX = b.x = (this.canvas.width / 2) + (random(this.tileWidth * 8) - this.tileWidth * 4);
	b.lastY = b.y = ((this.canvas.height / 4) * 2) + (this.tileHeight * 5);
	b.dx = random(2) ? -0.5 : 0.5;
	b.dy = 0.5;

	this.playBalls.push(b);
}

Blox.prototype.invalidateArea = function(x, y, w, h, redraw)
{
	if (x < 0) x = 0;
	else if (x >= this.canvas.width) x = this.canvas.width;

	if (y < 0) y = 0;
	else if (y >= this.canvas.height) y = this.canvas.height;

	if (x + w < 0) w = 0;
	else if (x + w >= this.canvas.width) w = this.canvas.width - x;

	if (y + h < 0) h = 0;
	else if (y + h >= this.canvas.height) h = this.canvas.height - y;

	this.context.clearRect(x, y, w, h);

	if (redraw)
	{
		var r1 = new BlockRect(x, y, x + w, y + h);

		for (var y = 0; y < this.rows; y++)
		{
			for (var x = 0; x < this.cols; x++)
			{
				var r2 = this.getBlockRect(x, y);
				if (this.blocks[x][y] != undefined && r2.intersect(r1)) this.invalidate[x][y] = true;
			}
		}
	}
}

Blox.prototype.renderTimer = function()
{
	var me = this;
	setTimeout(function() { me.render(); });
}

Blox.prototype.renderTiles = function()
{
	this.context.fillStyle = "#7e091b";

	// Tiles
	for (var y = 0; y < this.rows; y++)
	{
		for (var x = 0; x < this.cols; x++)
		{
			if (this.redraw || this.invalidate[x][y])
			{
				if (this.blocks[x][y] != undefined)
				{
					this.context.fillRect(this.tileWidth * x + 1, this.tileHeight * y + 1, this.tileWidth - 2, this.tileHeight - 2);
				}
				else this.invalidateArea(this.tileWidth * x, this.tileHeight * y, this.tileWidth, this.tileHeight);

				this.invalidate[x][y] = false;
			}
		}
	}
}

Blox.prototype.renderPlayers = function()
{
	// Players with paddles
	for (var i = 0; i < this.numPlayers; i++)
	{
		// Keyboard movement
		this.players[i].x += this.players[i].speed;
		this.players[i].speed *= 1.01;

		if (this.players[i].x < 0) this.players[i].x = 0;
		if (this.players[i].x + this.players[i].width > this.canvas.width) this.players[i].x = this.canvas.width - this.players[i].width;

		// Redraw stuff
		this.invalidateArea(0, this.players[i].lastY, this.canvas.width, this.players[i].height);

		// FF fix
		if (isNaN(this.players[i].x)) this.players[i].x = 0;

		this.context.drawImage(this.paddles[i],
				0, 0, this.paddles[i].width, this.paddles[i].height,
				this.players[i].x, this.players[i].y, this.players[i].width, this.players[i].height);

		this.players[i].lastX = this.players[i].x;
		this.players[i].lastY = this.players[i].y;

		this.updateStuck(i);
	}
}

Blox.prototype.renderPills = function()
{
	// Pills
	for (var i = 0; i < this.playPills.length; i++)
	{
		if (this.playPills[i] != undefined)
		{
			if (this.redraw ||
				this.playPills[i].x != this.playPills[i].lastX ||
				this.playPills[i].y != this.playPills[i].lastY)
			{
				this.invalidateArea(this.playPills[i].lastX - 1, this.playPills[i].lastY - 1, this.pillSize + 2, this.pillSize + 2, true);

				this.context.drawImage(this.playPills[i].img,
						0, 0, this.playPills[i].img.width, this.playPills[i].img.height,
						this.playPills[i].x, this.playPills[i].y, this.pillSize, this.pillSize);

				this.playPills[i].lastX = this.playPills[i].x;
				this.playPills[i].lastY = this.playPills[i].y;
			}

			// Vertical movement
			this.playPills[i].y += this.timeFactor(this.playPills[i].dy);
			this.playPills[i].dy += 0.01;

			if (this.playPills[i].y > this.canvas.height + this.pillSize)
			{
				this.playPills[i] = undefined;
				continue;
			}

			// Player collision check
			for (var j = 0; j < this.numPlayers; j++)
			{
				if (this.playPills[i].bounce(this.players[j].getRect()))
				{
					// Add score
					this.players[j].score += 100;
					this.updateScore();

					// Reset power ups
					this.resetPowerUps(0);

					// Player caught it
					switch (this.playPills[i].type)
					{
						// Extra ball
						case 0:
							this.createBall();
						break;

						// Extend paddle
						case 1:
							this.players[j].width = 128;
						break;

						// Smaller paddle
						case 2:
							this.players[j].width = 64;
						break;

						// Power ball
						case 3:
							this.powerBall = true;
							this.ballType(2);
						break;

						// Paddle glue
						case 4:
							this.paddleGlue = true;
							this.ballType(1);
						break;

						// Multi-ball
						case 5:
							this.ballSize = this.normalBallSize;
						break;

						// Extra ball
						case 6:
							this.players[j].balls++;
							this.updateBalls();
						break;

						// Drop rows
						case 7:
							for (var y = 0; y < this.rows; y++)
							{
								for (var x = 0; x < this.cols; x++)
								{
									if (y < this.rows - 1) this.blocks[x][y] = this.blocks[x][y + 1];
									else this.blocks[x][y] = undefined;
								}
							}

							this.redraw = true;
							this.checkLevel();
						break;
					}

					// Remove pill
					this.invalidateArea(this.playPills[i].lastX, this.playPills[i].lastY, this.pillSize, this.pillSize);
					this.playPills[i] = undefined;
				}
			}
		}
	}
}

Blox.prototype.renderBalls = function(clear)
{
	// Balls
	for (var i = 0; i < this.playBalls.length; i++)
	{
		if (this.playBalls[i] != undefined)
		{
			if (this.redraw ||
				this.playBalls[i].x != this.playBalls[i].lastX ||
				this.playBalls[i].y != this.playBalls[i].lastY)
			{
				this.invalidateArea(this.playBalls[i].lastX - 1, this.playBalls[i].lastY - 1, this.ballSize + 2, this.ballSize + 2, true);

				if (clear != true) this.context.drawImage(this.playBalls[i].img,
						0, 0, this.smallBallSize, this.smallBallSize,
						this.playBalls[i].x, this.playBalls[i].y, this.ballSize, this.ballSize);

				this.playBalls[i].lastX = this.playBalls[i].x;
				this.playBalls[i].lastY = this.playBalls[i].y;
			}

			// Curve ball
			this.playBalls[i].dx += (this.playBalls[i].dx >= 0 ? -(Math.random() / 300) : Math.random() / 300);

			// Horizontal movement
			this.playBalls[i].x += this.timeFactor(this.playBalls[i].dx);

			if (this.playBalls[i].x > this.canvas.width - this.ballSize)
			{
				this.playBalls[i].x = this.canvas.width - this.ballSize;
				this.playBalls[i].dx = -Math.abs(this.playBalls[i].dx);
				this.playBalls[i].immune = false;
			}
			else if (this.playBalls[i].x < 0)
			{
				this.playBalls[i].x = 0;
				this.playBalls[i].dx = Math.abs(this.playBalls[i].dx);
				this.playBalls[i].immune = false;
			}

			// Vertical movement
			this.playBalls[i].y += this.timeFactor(this.playBalls[i].dy);

			if (this.playBalls[i].y < 0)
			{
				this.playBalls[i].y = 0;
				this.playBalls[i].dy = Math.abs(this.playBalls[i].dy);
				this.playBalls[i].immune = false;
			}
			else if (this.playBalls[i].y > this.canvas.height + 50)
			{
				this.playBalls[i] = undefined;
				this.checkLevel();
				continue;
			}

			// Block collision check
			var done = false;

			for (var y = 0; y < this.rows; y++)
			{
				for (var x = 0; x < this.cols; x++)
				{
					if (this.blocks[x][y] != undefined)
					{
						if (this.playBalls[i].bounce(this.getBlockRect(x, y), false, this.blocks[x][y]))
						{
							this.hitBlock(x, y);
							if (this.playBalls[i] != undefined) this.playBalls[i].immune = false;
							done = true;
							break;
						}
					}
				}

				if (done) break;
			}

			// Player collision check
			for (var j = 0; j < this.numPlayers; j++)
			{
				if (this.playBalls[i] != undefined)
				{
					if (!this.playBalls[i].immune)
					{
						if (this.playBalls[i].bounce(this.players[j].getRect(), true))
						{
							// Immune to paddle bounce while the balls goes up.
							this.playBalls[i].immune = true;

							// Check for paddle glue
							if (this.paddleGlue)
							{
								this.playBalls[i].stuck = true;
								this.playBalls[i].stuckX = this.playBalls[i].x - this.players[j].x;
								this.playBalls[i].stuckY = this.playBalls[i].y - this.players[j].y;
								this.playBalls[i].dx = 0;
								this.playBalls[i].dy = 0;
							}
						}
					}
				}
			}
		}
	}
}

Blox.prototype.render = function()
{
	// Verifications
	if (this.resourcesLoading == 0)
	{
		this.redraw = (this.frames % 100) == 0;

		this.renderBalls();
		this.renderPills();
		this.renderPlayers();
		this.renderTiles();
	}

	this.frames++;
	this.renderTimer();

	this.lastTime = new Date();
}

Blox.prototype.getBlockRect = function(x, y)
{
	return new BlockRect(x * this.tileWidth, y * this.tileHeight, (x + 1) * this.tileWidth, (y + 1) * this.tileHeight);
}

Blox.prototype.resetPowerUps = function(n)
{
	this.renderBalls(true);
	this.ballSize = this.smallBallSize;
	this.players[n].width = 96;
	this.powerBall = false;
	this.paddleGlue = false;
	this.ballType(0);
}

Blox.prototype.ballType = function(n)
{
	for (var i = 0; i < this.playBalls.length; i++)
	{
		if (this.playBalls[i] != undefined) this.playBalls[i].img = this.balls[n];
	}
}

Blox.prototype.updateBalls = function()
{
	$('#balls').html(this.players[0].balls);
}

Blox.prototype.updateScore = function()
{
	var s = this.players[0].score + '';
	var t = '';

	// Add zeroes
	while (s.length < 12) s = '0' + s;

	// Add spaces
	while (s.length > 0)
	{
		t = (' ' + s.substr(s.length - 3, 3)) + t;
		s = s.substr(0, s.length - 3);
	}

	// Update html
	$('#score').html(t);
}

Blox.prototype.checkPlay = function()
{
	for (var i = 0; i < this.playBalls.length; i++) if (this.playBalls[i] != undefined) return true;
	for (var i = 0; i < this.playPills.length; i++) if (this.playPills[i] != undefined) return true;

	return false;
}

Blox.prototype.checkLevel = function()
{
	// Check all blocks
	var cleared = true;

	for (var y = 0; y < this.rows && cleared; y++)
	{
		for (var x = 0; x < this.cols && cleared; x++)
		{
			if (this.blocks[x][y] != undefined && this.blocks[x][y] != 0) cleared = false;
		}
	}

	var inplay = false;

	for (var i = 0; i < this.playBalls.length; i++) if (this.playBalls[i] != undefined)
	{
		inplay = true;
		break;
	}

	if ((this.players[0].balls <= 0 && !inplay) || cleared)
	{
		// Collect 1000 pts for each remaining ball
		this.players[0].score += (1000 * this.players[0].balls);
		this.players[0].balls = 0;
		this.updateScore();

		// clear balls
		for (i = 0; i < this.playBalls.length; i++) this.playBalls[i] = undefined;

		// Display score window
		this.get_name();
	}
}

Blox.prototype.get_name = function()
{
	$('#popup').fadeIn();
	$('#name').focus();
}

Blox.prototype.hitBlock = function(x, y)
{
	if (this.blocks[x][y] > 0)
	{
		this.invalidate[x][y] = true;
		this.players[0].score += 10;
		this.updateScore();
	}

	switch (this.blocks[x][y])
	{
		case 1:
			this.blocks[x][y] = undefined;
			this.checkLevel();
		break;

		case 2:
		case 3:
		case 4:
			this.blocks[x][y]--;
		break;

		case 5:
			this.blocks[x][y]--;

			// Spawn a random pill
			var p = new Pill(this, random(this.numPills));
			p.lastX = p.x = x * this.tileWidth + (this.tileWidth / 2) - (this.pillSize / 2);
			p.lastY = p.y = y * (this.tileHeight + 1);
			this.playPills.push(p);
		break;
	}
}

Blox.prototype.timeFactor = function(v)
{
	// Base is 250 FPS
	var base = 250;
	var now = new Date();
	var diff = now.getTime() - this.lastTime.getTime();
	var r = diff / (1000 / base);

	// The delta should never be greater than half the size of the ball
	if (v * r > this.ballSize / 2) return this.ballSize / 2;
	else if (v * r < -(this.ballSize / 2)) return -(this.ballSize / 2);

	return v * r;
}

function refresh_scores()
{
	// Init scoreboard
	$.ajax(
	{
		async: true,
		url: '/wp-content/themes/lubie/404/lib/score.php',
		success: function(data)
		{
			$('#scoreboard').html(data);
		}
	});
}

// Startup
$(document).ready(function()
{
	$('#popup').hide();

	// Canvas check
	var test_canvas = document.createElement("canvas");
	var canvascheck = (test_canvas.getContext) ? true : false;

	// Browser check
	if ((BrowserDetect.browser == 'Explorer' && BrowserDetect.version <= 8) || !canvascheck)
	{
		$('#blox-content').html('<img src="img/404.png" alt="404" /><br /><p class="center">Nous sommes d&eacute;sol&eacute;, votre fureteur ne supporte pas le HTML 5 et le jeu n\'est pas disponible.</p>');
	}
	else
	{
		$('#name').keypress(function(e)
		{
			if ((e.keyCode || e.which) == 13)
			{
				$.ajax(
				{
					asyc: false,
					url: '/wp-content/themes/lubie/404/lib/score.php',
					data:
					{
						name: $('#name').val(),
						score: $('#score').text(),
						code: MD5($('#name').val() + $('#score').text())
					},
					success: function(data)
					{
						$('#scoreboard').html(data);
						$('#popup').fadeOut();
						window.location.reload();
					}
				});
			}
		});

		var blox = new Blox('blox-content');
		blox.init();
		refresh_scores();
	}
});
