define(function(require, exports){
var $ = jQuery;
var defaults = {
	box: null
	, items: null
	, btnPrev: null
	, btnNext: null
	, effect: 'scroll'
	, speed: 200
	, timeout: 4000
	, init: function(){}
	, ononce: function(){} // 一次轮换结束
}

var Slide = function( config ) {
	var conf = this.config = $.extend ({}, defaults, config);
	var box = this.box = conf.box;
	
	this.width = box.width();
	this.height = box.height();
	this.items = conf.items || box.children();
	
	this.init( conf );
}

Slide.prototype = {
	init: function( config ) {
		
		config.init(this);
	},
	prev: function() {
		
	},
	
	next: function() {
		
	},
	
	go: function() {
		
	},
	
	play: function() {
		
	},
	
	stop: function() {
		
	}
}

var effects = {
	'default': function() {
		
	},
	
	// 渐变
	fade: function() {
		
	},
	
	// 滑动，上面的层滑动走，下面的层自动显示出来
	slide: function() {
		
	},
	
	// 整体移动，前面的移动出去后，后面的紧跟着显示出来
	scroll: function() {
		
	},
	
	// 整体连续无缝滚动
	rolling: function() {
		
	}
}

$.fn.slide = function(){
	var self = $(this),
		config = self.data();
		
	return new Slide(config);
}
});