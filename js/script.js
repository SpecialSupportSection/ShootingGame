//显示元素
var score = document.querySelectorAll(".score");
// 画布元素
var container = document.getElementById('game');
var canvas = document.getElementById('canvas');
var context = canvas.getContext('2d');
//游戏元素图片
var plane_img = new Image();
plane_img.src = "img/plane.png";
var enemy_img = new Image();
enemy_img.src = "img/enemy.png"
var boom_img = new Image();
boom_img.src = "img/boom.png"
// 背景音乐
var audio_menu = document.getElementById('menu');
var audio_play = document.getElementById('play');
/**
 * @description 飞机对象
 * @constructor
 * @param {number} x 表示飞机在画布上的期望横坐标
 * @param {string} direction 表示飞机的移动方向
 * @param {boolean} shoot 表示飞机是否正在射击
 */
function Plane(x) {
	this.x = x;
	this.direction = "stop";
	this.shoot_status = false;
};
Plane.prototype.moveLeft = function () {
	this.direction = "left";
};
Plane.prototype.moveRight = function () {
	this.direction = "right";
};
Plane.prototype.stop = function () {
	this.direction = "stop";
}
Plane.prototype.shoot = function () {
	Game.bullets.push(new Bullet(this.x + 30, 475));

};
/**
 * @description 子弹对象
 * @constructor
 * @param {number} x 表示子弹在画布上的横坐标
 * @param {number} y 表示子弹在画布上的纵坐标
 */
function Bullet(x, y) {
	this.x = x;
	this.y = y;
}
Bullet.prototype.fly = function () {
	this.y -= 10;
};
/** 
 * @description 怪兽对象
 * @constructor
 * @param {number} x 表示怪兽在画布上的横坐标
 * @param {number} y 表示怪兽在画布上的纵坐标
 * @param {string} direction 表示怪兽的移动方向，该属性由所有怪兽共享
 * alive 表示怪兽存活
 * boom 表示命中
 * die 表示死亡
 */
function Enemy(x, y) {
	this.x = x;
	this.y = y;
	this.status = "alive";
};
Enemy.prototype.direction = "right";
Enemy.prototype.move = function () {
	if (this.direction == "right") {
		this.x += 2;
	} else {
		this.x -= 2;
	}
};
Enemy.prototype.boom = function () {
	this.status = "boom";
	var self = this;
	var interval = setInterval(function () {
		self.status = "die";
		clearInterval(interval);
	}, 100);
};
/**
 * 整个游戏对象
 */
var GameWindow = {
	/**
	 * 初始化函数,这个函数只执行一次
	 */
	init: function () {
		var self = this;
		var playBtn = document.querySelector('.js-play');
		var replayBtn = document.querySelectorAll('.js-replay');
		this.status = 'start';
		// 开始游戏按钮绑定
		playBtn.onclick = function () {
			self.play();
		};
		replayBtn[0].onclick = function () {
			self.play();
		};
		replayBtn[1].onclick = function () {
			self.play();
		};
	},
	/**
	 * 更新游戏状态，分别有以下几种状态：
	 * start  游戏前
	 * playing 游戏中
	 * failed 游戏失败
	 * success 游戏成功
	 */
	setStatus: function (status) {
		this.status = status;
		container.setAttribute("game-status", status);
	},
	play: function () {
		Game.init();
		audio_menu.pause();
		this.setStatus('playing');
		Game.animate();
		audio_play.currentTime = 0;
		audio_play.play();
	},
	fail: function () {
		audio_play.pause();
		audio_menu.currentTime = 0;
		audio_menu.play();
		score[1].innerHTML = Game.score;
		context.clearRect(0, 0, canvas.width, canvas.height);
		GameWindow.setStatus("failed");
	},
	success: function () {
		audio_play.pause();
		audio_menu.currentTime = 0;
		audio_menu.play();
		context.clearRect(0, 0, canvas.width, canvas.height);
		score[2].innerHTML = Game.score;
		GameWindow.setStatus("success");
	},
};
// 初始化
GameWindow.init();
/**
 * 游戏实时数据对象
 * 包含一个游戏初始化方法
 */
var Game = {
	init: function () {
		this.plane = new Plane(320);
		this.enemys = this.createEnemys(7);
		this.bullets = [];
		this.score = 0;
		document.onkeydown = this.keydown_listener;
		document.onkeyup = this.keyup_listener;
	},
	animate: function () {
		// 游戏成功检测
		if (Game.score == Game.enemys.length) {
			var interval = setInterval(function () {
				GameWindow.success();
				clearInterval(interval);
			}, 500);
			return;
		}
		// 更新飞机坐标
		if (Game.plane.direction == "left" && Game.plane.x > 30) Game.plane.x -= 5;
		else if (Game.plane.direction == "right" && Game.plane.x < 610) Game.plane.x += 5;
		// 更新子弹坐标
		for (var i = 0; i < Game.bullets.length; i++) {
			Game.bullets[i].fly();
			if (Game.bullets[i].y < -5) {
				Game.bullets.splice(i, 1);
				i--;
			}
		}
		// 更新怪兽坐标
		for (var i = 0; i < Game.enemys.length; i++) {
			if (Game.enemys[i].direction == "left") {
				Game.enemys[i].x -= 2;
			} else {
				Game.enemys[i].x += 2;
			}
		}
		// 怪兽触边检测
		for (var i = 0; i < Game.enemys.length; i++) {
			if (Game.enemys[i].status == "alive" && Game.enemys[i].x < 30) { // 左侧碰撞
				Game.enemys[i].__proto__.direction = "right"; // 改变方向
				for (var j = 0; j < Game.enemys.length; j++) {
					Game.enemys[j].x += 2; // 撤销移动
					Game.enemys[j].y += 35; // 下移
					if (Game.enemys[j].y > 425) { // 触底游戏失败
						GameWindow.fail();
						return;
					}
				}
				break;
			} else if (Game.enemys[i].status == "alive" && Game.enemys[i].x > 620) { //右侧碰撞
				Game.enemys[i].__proto__.direction = "left"; // 改变方向
				for (var j = 0; j < Game.enemys.length; j++) {
					Game.enemys[j].x -= 2; // 撤销移动
					Game.enemys[j].y += 35; // 下移
					if (Game.enemys[j].y > 425) { // 触底游戏失败
						GameWindow.fail();
						return;
					}
				}
				break;
			}
		}
		// 子弹命中检测
		for (var i = 0; i < Game.enemys.length; i++) {
			for (var j = 0; j < Game.bullets.length; j++) {
				if (Game.bullets[j].x > Game.enemys[i].x &&
					Game.bullets[j].x < Game.enemys[i].x + 50 &&
					Game.bullets[j].y > Game.enemys[i].y &&
					Game.bullets[j].y < Game.enemys[i].y + 50 &&
					Game.enemys[i].status == "alive") {
					// 确认命中
					Game.enemys[i].boom();
					Game.bullets.splice(j, 1);
					Game.score++;
				}
			}
		}
		// 更新分数
		score[0].innerHTML = Game.score;
		// 擦除画布
		context.clearRect(0, 0, canvas.width, canvas.height);
		// 画出怪兽
		for (var i = 0; i < Game.enemys.length; i++) {
			if (Game.enemys[i].status == "alive") {
				context.drawImage(enemy_img, Game.enemys[i].x, Game.enemys[i].y, 50, 50);
			} else if (Game.enemys[i].status == "boom") {
				context.drawImage(boom_img, Game.enemys[i].x, Game.enemys[i].y, 50, 50);
			}
		}
		//画出子弹
		for (var i = 0; i < Game.bullets.length; i++) {
			context.beginPath();
			context.moveTo(Game.bullets[i].x, Game.bullets[i].y);
			context.lineTo(Game.bullets[i].x, Game.bullets[i].y + 10);
			context.strokeStyle = "white";
			context.stroke();
		}
		//画出飞机
		context.drawImage(plane_img, Game.plane.x, 475, 60, 100);
		requestAnimationFrame(Game.animate);
	},
	createEnemys: function (num) {
		var enemys = [];
		for (var i = 0; i < num; i++) {
			enemys.push(new Enemy(30 + i * 60, 75));
		}
		return enemys;
	},
	keydown_listener: function (e) {
		var keyNum = window.event ? e.keyCode : e.which;
		if (keyNum == 37) {
			//按下←键
			Game.plane.moveLeft();
		} else if (keyNum == 39) {
			//按下→键
			Game.plane.moveRight();
		} else if (keyNum == 32) {
			//按下空格
			if (!Game.plane.shoot_status) { // 每次按下空格都只能进行一次射击
				Game.plane.shoot();
				Game.plane.shoot_status = true;
			}
			return false; // 禁止屏幕滚动
		}
	},
	keyup_listener: function (e) {
		var keyNum = window.event ? e.keyCode : e.which;
		if (keyNum == 37 && Game.plane.direction == "left") {
			Game.plane.stop();
		} else if (keyNum == 39 && Game.plane.direction == "right") {
			Game.plane.stop();
		} else if (keyNum == 32) {
			Game.plane.shoot_status = false;
		}
	}
};
