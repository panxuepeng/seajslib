/*! Bkeditor - v0.9.0 - 2013-07-10
* https://github.com/daixianfeng/a
* Copyright (c) 2013 daixianfeng; Licensed MIT */
define("bkeditor/0.9.0/bkeditor",[],function(require, exports){
	require.async('./bkeditor.ext.js');
	return jQuery.jQEditor;
});
(function($){

// 编辑器核心，内部对象，对外不可见
var jQEditor = {
	IE: window.VBArray ? true : false,
	IE6: (window.VBArray && !window.XMLHttpRequest) ? true : false,
	
	// 编辑器状态
	state : 'loading',
	// 编辑器实例集合
	editorList : {},
	// 当前激活的编辑器id
	curId : '',
	// 当前活动的编辑器实例对象
	curEditor : {},
	// 当前活动的编辑器实例对象
	curToolbar : jQuery(),
	// 日志处理对象
	log : {},
	// 错误处理对象
	error : {},
	// 插件集合
	pluginList : {},
	// 插件的UI集合
	uiList : {},
	// 语言包对象
	lang : {},
	// 监听编辑区域事件
	listenEditarea : {},
	// 监听编辑区域事件扩展
	listenEditareaExt : {},
	// 添加过滤器接口
	addFilter : function(){},
	// 挂载各种内部实现命令，为其他文件提供挂在位置，执行其下面命令不走命令大流程
	coreCommand : {},
	// 执行命令接口
	command : function(cmd,param){},
	// 历史记录核心对象
	histroy : {},
	// 通用方法集对象
	utils : {},
	// 文件加载器对象
	load :{},
	// 工具栏关联对象
	toolbar : {},
	// 工具栏下拉菜单缓存
	toolbarPanel : {},
	// 对话框html缓存
	dialogHtml : {},
	// 对话框接口对象
	dialog : {},
	// 主题列表，用于判断主题是否加载。
	themeList : {
		toolbar:{},
		editArea:{}
	},
	/**
	* @description
	* 初始化JQEditor，加载config文件，合并options配置，根据config加载并初始化各个对象
	* @param {object} options 配置参数
	**/
	init : function(options){

	},

	// 创建编辑器，使用jQuery方法的，比较简洁

	/**
	* @description
	* 绘制编辑器，获取html，css添加到dom中，注册编辑区域事件
	* @param {object.<jQEditor>} targetObj 创建的目标编辑器
	* @param {function} callback 回调函数
	**/
	create: function(targetObj,callback){
		var self = this,
			conf = targetObj.config,
			textarea = null;
			
		//添加指定id的编辑器
		//var timestamp = +new Date();
		var timestamp = 'debug';
		var editorHtml = '<div id="'+conf.id+'" ref="editor" style="width:'+conf.editWidth+';">';
		editorHtml += '<div class="bke-toolbarbox" ref="'+conf.id+'"></div>';
		editorHtml += '<div class="bke-contentarea">';
			editorHtml += '<div class="bke-iframeholder"></div>';
				editorHtml += '<div class="bke-bottombar">';
					editorHtml += '<span class="bke-elementpath">元素路径：<a>body</a></span>';
					editorHtml += '<span class="bke-wordcount">字数统计</span>';
				editorHtml += '</div>';
			editorHtml += '</div>';
		editorHtml += '</div>';
		
		editorHtml += '<!--[if IE]>';
		editorHtml+= '<script type="text/javascript" src="'+conf.cBase.ieDir+'DOMRange.js?'+timestamp+'"></script>';
		editorHtml+= '<![endif]-->';
		
		if(conf.position instanceof jQuery){
			conf.position.before(editorHtml);
			conf.position.hide();
			textarea = conf.position;
		}else{
			// 这个分支是针对工具栏和内容区域分别指定位置
			// 需要在配置文件当中给position项指定
			// 如{content: $(el), toolbar: $(el)}
			conf.position.content.before(editorHtml);
			var toolbarObj = conf.position.content.prev().find('.bke-toolbarbox');
			conf.position.toolbar.append(toolbarObj);
			conf.position.content.hide();
			textarea = conf.position.content;
		}
		conf.textarea = textarea;
		
		// 该区域用来存放编辑器需要加载的弹窗
		if($(document.body).find('#ui-dialog').length === 0){
			$(document.body).append('<div id="ui-dialog" style="display:none;"></div>');
		}
		//添加编辑区域iframe
		var iframe = document.createElement('iframe');
		$(iframe).attr({
			frameBorder: 0,
			tabIndex: '0',
			'width': '100%',
			scrolling: conf.editScroll,
			height: conf.editHeight
		}).addClass('show-content');
		
		$('#'+conf.id).find('.bke-iframeholder')
			.append(iframe)
			.append(textarea)
			.append('<div class="bke-shortcutmenu"></div>')
			.append('<a class="bke-selecttablebar"></a>');
			
		// 获取编辑区域的document和window对象，添加到配置中，
		// 这样才能对相应的编辑区域做出操作和绑定事件，相当重要
		var win = iframe.contentWindow, dom = win.document;
		// 向编辑区域的iframe中添加应有的元素，如果是ie浏览器还要加载仿Range，Selection内容
		dom.open();
		var html = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" ';
		html+= '"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
		html+= '<html><head>';
		html+= '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';
		html+= '<link rel="stylesheet" type="text/css" href="'+conf.cBase.skinDir+'skin-inner.css">';
		html+= '<!--[if IE]>';
		html+= '<script type="text/javascript" src="'+conf.cBase.ieDir+'DOMRange.js?'+timestamp+'"></script>';
		html+= '<![endif]-->';
		html+='</head><body contentEditable="true" style="height:98%"></body></html>';
		dom.write(html);
		dom.close();
		
		self.editWin = win;
		self.editDom = dom;
		targetObj.win  = win;
		targetObj.dom  = dom;

		// 填充工具条区域 不支持同一页面多种风格的工具条
		// 此处必须使用原生的DOM方法加载css文件，不能使用jQuery的append方法加载
		// 主题的变换目前以加载不同css的方法实现，不能满足同一页面多种风格的需求
		if( !self.themeList.toolbar[conf.skin]) {
			self.loadCss(conf.cBase.skinDir+conf.skin+'/skin.css');
			self.themeList.toolbar[conf.skin] = true;
		}
		
		var rangeCheck = setInterval(function(){
			if(typeof self.editWin.getSelection !== 'undefined'){
				var toolbar = 'toolbar';
				if ( conf.toolbar ) {
					toolbar += '_'+conf.toolbar;
				}
				var toolsrc = conf.cBase.skinDir+conf.skin+'/'+toolbar+'.json';
				
				if( self[toolsrc] ){
					$('[ref="'+conf.id+'"].bke-toolbarbox').html(self[toolsrc]);
					callback();
				} else {
					$.get(toolsrc,function(data){
						// 工具条的html内容为被编译好的json对象，存储在jQEditor.tool中
						// 如果toolbar文件加载成功，jQEditor.tool就会有相应的html代码
						$('[ref="'+conf.id+'"].bke-toolbarbox').html(data);
						
						callback();
						self[toolsrc] = data;
					});
				}
				clearInterval(rangeCheck);
			}
		},50);
	},
	/**
	* @description
	* 触发已注册的事件
	* @param {string} type 事件类型
	* @param {object} arg 事件参数
	* @override
	**/
	trigger : function(type,arg){},
	/**
	* @description
	* 填充下拉菜单，如果已经加载了E.toolbar则直接填充
	* 	如果没有则填充到缓存，等待E.toolbar加载时填充所有缓存
	* @param {string} cmd 要填充到的插件命令
	* @param {string} html 填充的html
	* @override
	**/
	fillPanel : function(cmd,html){
		if(this.toolbar.fillPanel){
			this.toolbar.fillPanel(cmd,html);
		}else{
			this.toolbarPanel[cmd] = html;
		}
	},
	/**
	* @description
	* 获得JQEditor的属性
	* @return {object} 编辑器属性
	**/
	getAttr : function(){},
	/**
	* @description
	* 使编辑器获得焦点，在编辑区域
	**/
	focus : function(){
		var focusId = this.curId;
		if(this.editorList[focusId]){
			this.editorList[focusId].focus();
		}
	},
	/**
	* @description
	* 锁定编辑器，使编辑器变得不可编辑
	**/
	lock : function(){},
	/**
	* @description
	* 解锁编辑器
	**/
	unlock : function(){},
	/**
	* @description
	* 销毁编辑器
	**/
	destroy : function(){
		var deId = this.curId;
		if(this.editorList[deId]){
			this.editorList[deId].destroy();
		}
	},
	/**
	* @description
	* 编辑器核心准备就绪
	* @param {function} callback 回调函数
	**/
	ready : function(callback){
		var self = this, stateChange = '', stateCheck = '';
		
		if(self.state !== 'ready'){
			stateChange = setInterval(function(){
				var coreReady = (
					self.error.ready
					&& self.log.ready
					&& self.load.ready
					&& self.utils.ready
					&& self.command.ready
					&& self.EditorEvent.ready
					&& self.EditorHistory.ready
					&& self.EditorHistory.ready
					&& self.addPlugin.ready
					&& self.addUi.ready
					&& self.dialog.ready
				);
				
				if(coreReady === true){
					self.state = 'ready';
					clearInterval(stateChange);
				}
			},50);
			stateCheck = setInterval(function(){
				if(self.state === 'ready'){
					callback();
					clearInterval(stateCheck);
				}
			},50);
		}else{
			callback();
		}
	},
	getLang:function (path) {
		var lang = this.lang;
		path = (path || "").split( "." );
		for ( var i = 0, ci; ci = path[i++]; ) {
			lang = lang[ci];
			if ( !lang ){
				break;
			}
		}
		if (lang === undefined && $.browser.mozilla ){
			console.log (path[path.length-1]);
		}
		return lang === undefined ? path[path.length-1]: lang ;
	},
	
	// 在工具栏下方显示红色信息条
	errorMessage: function(msg) {
		this.curEditor.error(msg);
	},
	
	// 在工具栏下方显示绿色信息条
	message: function(msg, timeout) {
		this.curEditor.error(msg, 'green', timeout);
	},
	
	// 获取当前编辑的某个对象
	get: function(name){
		switch(name){
			case 'editor':
				return jQEditor.curEditor;
			break;
			case 'list':
				return jQEditor.editorList;
			break;
			case 'window':
				return jQEditor.curEditor.win;
			break;
			case 'document':
				return jQEditor.curEditor.dom;
			break;
			case 'body':
				return jQEditor.curEditor.dom.body;
			break;
		}
	},
	
	$: function(selector){
		return $(selector, this.curEditor.dom);
	},
	
	// 主题的变换目前以加载不同css的方法实现，不能满足同一页面多种风格的需求
	loadCss: function( url ) {
		var link = document.createElement("link");
		
		link.setAttribute('type', 'text/css');
		link.setAttribute('rel', 'stylesheet');
		link.setAttribute('href', url);
		
		// 此处必须使用原生的DOM方法加载css文件，不能使用jQuery的append方法加载
		$("head")[0].appendChild(link);
	}
};

//创建编辑器核心对象，并初始化，然后赋值到jquery上
jQEditor.init();
$.jQEditor = jQEditor;

/*******************************************************************/

/**
* @description
* 封装编辑器构造函数为方法
* @param {object} options 编辑器配置参数
* @return {object.<Editor>} 编辑器实例
**/
var editor = function(options){
	jQEditor.trigger('create',{Eid:options.id});
	return new Editor(options);
};
/**
* 单个编辑器
* @constructor
* @param {object} options 编辑器配置参数
**/
function Editor(options){
	var self = this;
	this.state = 'init';
	options.id = options.id ? options.id : 'bkeditor_'+(new Date()).getTime();
	this.Eid = options.id;
	jQEditor.editorList[this.Eid] = this;
	this.config = $.extend(true,{},jQEditor.config,options);
	jQEditor.curEditor = this;
	jQEditor.curId = this.Eid;
	this.pasteToText = false;
	this.pasteToWord = false;
	this.revertList = [];
	this.redoList = [];
	this.cursorElements = {};// 当前元素
	jQEditor.create(this,function(){
		var config = self.config;
		//try{
			// 将历史，过滤器，事件核心实例化，将实例附加到jQEditor上
			self.baseEvent = new jQEditor.EditorEvent(self);
			self.baseHistory = new jQEditor.EditorHistory(self);
			self.baseFilter = new jQEditor.EditorFilter(self);
			self.pluginEnable = jQEditor.configPlugin(config);
			self.toolbar = new jQEditor.Toolbar(self);
			self.fillPanel();
			// 为编辑器编辑区域内容赋值
			var content = config.oriHtml;
			
			// 在初始化时，对原始内容进行全面过滤
			var finalContent = jQEditor.utils.filterInner(self, content);
			self.dom.body.innerHTML = finalContent;
			$(self.dom.body).css(config.bodyStyle);
			self.baseFilter.excute('dom');
			
			//初始化历史记录的第一个值
			self.baseHistory.setFirstHistory(self.dom.body.innerHTML);
			self.state = 'ready';
			jQEditor.trigger('complete',{Eid:options.id});
			
			// 在外部表单提交时，自动将编辑器内容更新到对应的表单项当中
			$(config.textarea).closest('form').submit(function(){
				$(config.textarea).val(self.getContent());
			});
		//}catch(ex){
		//	jQEditor.error.writeError('editor init error: '+ex.message,5,'core');
		//	jQEditor.utils.message(jQEditor.lang['createError'],'finish');
		//}
	});
}
Editor.prototype = {
	pluginEnable : {},
	/**
	* @description
	* 编辑器核心准备就绪
	* @param {function} callback 回调函数
	**/
	ready : function(callback){
		var self = this;
		var stateChange = '',stateCheck = '' ;
		if(self.state !== 'ready'){
			stateCheck = setInterval(function(){
				if(self.state === 'ready'){
					callback();
					clearInterval(stateCheck);
				}
			},50);
		}else{
			callback();
		}
	},
	/**
	* @description
	* 填充插件的面板区域
	**/
	fillPanel : function(){
		try{
			for(var plugin in jQEditor.pluginList){
				jQEditor.pluginList[plugin].fill();
			}
		}catch(ex){
			jQEditor.error.writeError('fill panel error: '+ex.message,3,'plugin');
		}
	},

	/**
	* @description
	* 改变某一个编辑器实例的主题
	* 主题以中的css均以.{theme} 开头，这样只需要在改变主题时改变toolbar或是editor的class即可
	* @param {string} theme 主题样式
	* @param {enum}{'editArea'|'toolbar'} position 哪的主题
	**/
	changeTheme : function(theme,position){
		//[TODO]
		if(position !== 'editArea'){
			if(typeof jQEditor.themeList.toolbar[theme] === false){

			}
		}
		if(position !== 'toolbar'){
			if(typeof jQEditor.themeList.editArea[theme] === false){

			}
		}
	},
	
	// 获取编辑器内容
	getContent: function() {
		var html = this.dom.body.innerHTML;
		return jQEditor.utils.filterInner(this, html);
	},
	
	// 设置编辑器内容
	setContent: function( html ) {
		this.dom.body.innerHTML = html;
		this.baseFilter.excute('dom');
	},

	// 激活编辑器
	enable: function(){

	},

	// 禁用编辑器
	disable: function(){

	},

	// 执行命令
	execCommand: function(){

	},

	// 根据传入的command命令，查选编辑器当前的选区，返回命令的状态
	queryCommandState: function(){

	},

	// 根据传入的command命令，查选编辑器当前的选区，根据命令返回相关的值
	queryCommandValue: function(){

	},

	/**
	* @description
	* 向光标处插入html代码
	* @param {string} html 要插入的html代码
	**/
	insert: function ( html ) {
		jQEditor.command('insert', html);
	},
	
	// 在工具栏下方显示红色信息条
	error: function(msg, color, timeout) {
		color = color || 'red';
		if ( typeof color === 'number' ) {
			timeout = color;
			color = 'red';
		}
		timeout = timeout || 3000;
		var o = $("#"+this.Eid).find('.bke-message');
		o.stop().text(msg).css({color:color}).fadeIn(200);
		
		clearTimeout(this.timer);
		this.timer = setTimeout(function(){
			o.fadeOut(100);
		}, timeout);
	},
	
	// 全选编辑区域内容
	selectAll: function() {
		this.dom.execCommand("selectAll");
		this.win.focus();
		return this;
	},
	
	focus: function(){
		this.win.focus();
		return this;
	},
	
	// 获取光标处的元素
	getElementTree: function() {
		return jQEditor.utils.getCurElement();
	},
	
	// 获取光标处的元素
	getCursorText: function() {
		var elsTree = this.getElementTree();
		return elsTree.pop();
	},
	
	// 获取光标处的元素
	getCursorElement: function() {
		var elsTree = this.getElementTree();
		return elsTree.pop();
	},
	
	// 获取光标处的元素
	getCursorNode: function() {
		var elsTree = this.getElementTree();
		elsTree.pop();
		
		return elsTree.pop();
	},
	
	getRange: function() {
		return jQEditor.utils.getSelectionRange(this.win);
	},
	
	getSelectionText: function(){
		var range = this.getRange();
		return range.toString();
	},
	
	insertNode: function(node) {
		var range = this.getRange();
		range.insertNode(node);
	},
	
	setCursor: function(node, start) {
		jQEditor.utils.setCursor(this.win, node, true);
	},
	
	selectNode: function(node) {
		jQEditor.utils.selectNode(this.win, node);
	},
	
	createTextNode: function(text) {
		text = text || (jQEditor.IE6 ? '\ufeff' : '\u200B');
		return jQEditor.curEditor.dom.createTextNode(text);
	}
};
//将编辑器实例构造方法复制到jQuery上
$.editor = editor;

jQEditor.ready(function(){
	// 此处必须使用原生的DOM方法加载css文件，不能使用jQuery的append方法加载
	// 主题的变换目前以加载不同css的方法实现，不能满足同一页面多种风格的需求
	
	// console.log("editTheme"+jQEditor.config.editTheme)
	// if(jQEditor.config.editTheme && !jQEditor.themeList.editArea[jQEditor.config.editTheme]){
		// jQEditor.loadCss(jQEditor.config.cBase.skinDir+jQEditor.config.editTheme+'/skin-'+jQEditor.config.editTheme+'.css');
		// jQEditor.themeList.editArea[jQEditor.config.editTheme] = true;
	// }
	
	$('textarea.bkeditor').each(function(i, el){
		var o = $(el)
			, timestamp = (new Date()).getTime()
		
		var newEditor = editor({
			id : 'bkeditor_'+timestamp,
			position : o,
			editWidth : o.css('width'),
			editHeight : o.css('height'),
			oriHtml : o.val()
		});
		
		// 将编辑器实例挂到元素对象上
		o.data('editor', newEditor);
	});
});
})(window.jQuery);
(function(E , $){
	var rootDir = 'http://bkeditor.com/';
	//var rootDir = 'http://localhost/bkeditor/';
	var isLog = true,
		isError = true,
		isHistory = true;
		
	var cTools = {
		all : ['codemirror','bold','italic','superscript','subscript','baikelink',
			'strikethrough','underline','removeformat','formatmatch',
			'tolowercase','touppercase','undo','redo','h2','h3','blockquote',
			'fontsizemenu','fontfamilymenu','justifyleft','justifycenter','justifyright',
			'pastetotext','pasteword','image','map','preview','cleardoc',
			'reference','inserttime','insertdate','highlightcode',
			'insertvideo','inserttablemenu','tableprops','combinecells',
			'combinecolafter','combinerowafter','splittocols','splittorows','splittocells',
			'insertcolbefore','insertcolafter','insertrowbefore','insertrowafter',
			'deleterow','deletecol','deletetable',
			'specharsmenu','link','anchor','backcolor','forecolor',
			'linespacemenu','spacebottommenu','spacetopmenu',
			'outdent','indent','insertunorderedlist','insertorderedlist',
			'source','autoformat','search','about'],
		base : ['bold','italic','underline','strikethrough','superscript','subscript',
			'lowercase','uppercase','redo','undo','pastetotext','pasteword',
			'specharsmenu','link','backcolor','forecolor','fontsizemenu','fontfamilymenu',
			'insertunorderedlist','insertorderedlist','source','search'
			]
	};
	
	// 某标签需要禁用的功能，有的插件不需要检查，如redo、undo、html等
	var _allDisabledPlugin = [
		'bold','italic','superscript','subscript','baikelink',
		'strikethrough','underline','formatmatch',
		'h2','h3','blockquote',
		'fontsizemenu','fontfamilymenu',
		'pasteword','image','map',
		'reference','highlightcode',
		'insertvideo','inserttablemenu',
		'specharsmenu','link','anchor','backcolor','forecolor',
		'linespacemenu','spacebottommenu','spacetopmenu',
		'outdent','indent','insertunorderedlist','insertorderedlist',
		'forecolormenu'
	];
	var cTagDisable = {
		// 标签对应的需要禁用的插件，如
		'a': _allDisabledPlugin,
		'table': ['h2','h3'],
		'hn': _allDisabledPlugin,
		'sub': _allDisabledPlugin,
		'sup': _allDisabledPlugin,
		'pre': _allDisabledPlugin,
		'img': _allDisabledPlugin,
		'selectedTable': []
	};
	
	var config = {
		rootDir : rootDir,
		
		// 基础配置
		cBase : {
			// ie浏览器使用需要额外加载文件的路径
			ieDir : rootDir+'src/core/base/ie/',
			pluginDir : rootDir+'src/core/plugin/',
			uiDir : rootDir+'src/core/ui/',
			skinDir : rootDir+'src/skin/',
			
			// 是否需要记录日志
			isLog : isLog,
			
			// 是否需要记录错误
			isError : isError,
			
			// {array.<string>} 必须要加载的文件
			mustFile : [],
			
			// {array.<string>} 可以延时加载的文件
			delayFile : [],
			
			lang : 'zh-cn',
			
			plupload: {
				max_file_size: '10mb',
				url: '/plupload.php',
				pluploadswf: rootDir+'libs/plupload/plupload.swf'
			},
			ajaxupload: {
				uploadUrl: '../upload.php?action=saveFromDrag'
			}
		},
		
		// 事件配置
		cEvent : {
			// {array.<string>} 白名单，启用的事件名，优先级高于黑名单
			whiteList : [],
			
			// {array.<string>} 黑名单，禁用的事件名，优先级低于白名单
			blackList : []
		},
		
		// 插件配置
		cPlugin : {
			// {array.<string>} 白名单，启用的插件名，优先级高于黑名单
			whiteList : [],
			
			// {array.<string>} 黑名单，禁用的插件名，优先级低于白名单
			blackList : []
		},
		
		// ui配置
		cUi : {
		},
		
		// 过滤器配置
		cFilter : {
			// {array.<string>} 白名单，启用的过滤器名，优先级高于黑名单
			whiteList : ['block','combine','replace','space'],
			
			// {array.<string>} 黑名单，禁用的过滤器名，优先级低于白名单
			blackList : []
		},
		
		// 历史记录配置
		cHistory : {
			// {boolean} 是否开启历史记录功能
			onHistory : isHistory,
			
			// {number} 历史记录最多记录数目
			times : 100
		},
		
		// 错误处理配置
		cError : {
			// {boolean} 是否需要记录错误
			onError : isError,
			
			// {string} 错误发送到服务端的地址
			errorSendAddr : '',

			// {number} 最长错误记录数，达到数目向服务端发送
			length : 5
		},

		// 日志处理配置
		cLog : {
			// {boolean} 是否需要记录日志
			onLog : isLog,

			// {string} 日志发送到服务端的地址
			logSendAddr : '',

			// {boolean} 最长日志记录数，达到数目向服务端发送
			length : 100
		},

		// {object.<array>.<string>} 工具栏分类对象，存储多种预设的工具条内容及顺序
		cTools : cTools,
		
		// 鼠标点击到某标签上，需要禁用的功能
		cTagDisable : cTagDisable,
		
		// {array.<string> | string} 工具栏显示的工具，有顺序
		// 当为string类型时有固定的一类工具条功能
		toolbar : '',
		
		// {string} 编辑器主题风格
		//editTheme : '',
		
		// {string} 编辑器工具栏风格
		skin : 'default',
		
		cSkin : {
			
		},

		// {string} 编辑区域宽，如果是数字需要带上px，如800px
		editWidth : 'auto',

		// {string} 编辑区域高，如果是数字需要带上px，如300px
		editHeight : 'auto',

		// {boolean} 编辑区域是否有滚动条
		editScroll : 'no',
		
		// {object.<jQuery> | object{
		//							toolbar:object.<jQyery>,
		//							content:object.<jQuery>}
		//		} 编辑器位置
		position : '',

		// {string} 编辑区域的原始内容
		// 一般是在编辑器初始化时从textarea表单项获取初始内容
		oriHtml : '',

		 // {string} 表格选中样式
		selectTableClass : 'bke-table-selected',

		 // {string} 单元格选中样式
		selectCellClass : 'bke-cell-selected',

		 // {string} 图片选中样式
		selectImgClass : 'bke-img-selected',
		
		// 编辑器高度是否根据内容高度自动调整
		autoHeight: 1,
		
		// 编辑器默认高度
		height: 200,
		
		fixedClassName: 'bke-toolbar-fixed',
		
		// 编辑区域body的默认样式
		bodyStyle: {'font-size':'14px', 'font-family': 'SimSun'}
	};
	
	E.config = $.extend(true, {}, E.config, config);

})(jQuery.jQEditor , jQuery);
(function(E, $){
	var rootDir = 'http://bkeditor.com/bke/0.9.0/';
	//var rootDir = 'http://localhost/bkeditor/bke/0.9.0/';
	var param = window.location.search;
	if(param.search('debug=true')){
		//rootDir = 'http://localhost/bkeditor/dist/0.9.0/';
		rootDir = 'http://bkeditor.com/dist/0.9.0/';
	}
	
	if( typeof BKEROOT === 'string' ){
		rootDir = BKEROOT;
	}
	
	var config = {
		rootDir : rootDir,
		cBase : {
			ieDir : rootDir+'ie/',
			pluginDir : rootDir+'plugin/',
			uiDir : rootDir+'ui/',
			skinDir : rootDir+'skin/'
		}
	};
	
	E.config = $.extend(true, {}, E.config, config);
	
})(jQuery.jQEditor, jQuery);
(function(E , $){
	var config = {
		/**
		* @type {object} 命令配置，包含命令过滤，命令分发，命令对应图标
		*	如： textCommand['bold']  {cmd: 'strong',param: '',icon: 'browserChecked'}中
		*	textCommand为命令类型，bold为原始命令（对应html），cmd为待执行命令（对应编辑器）
		*	param为待执行命令所带参数，icon为命令对应图标的判断方式，为空则没有对应图标
		*/
		cCommand: {
			/**
			* @type {object} 文本修改类命令
			*/
			textCommand: {
				'bold': {cmd: 'strong',param: '',icon: 'browserChecked'},
				'italic': {cmd: 'em',param: '',icon: 'browserChecked'},
				'underline': {cmd: 'text-decoration',param: 'underline',icon: 'browserChecked'},
				'strikethrough': {cmd: 'text-decoration',param: 'line-through',icon: 'browserChecked'},
				'superscript': {cmd: 'sup',param: '',icon: 'customChecked'},
				'subscript': {cmd: 'sub',param: '',icon: 'customChecked'},
				'fontsize': {cmd: 'font-size',param: '',icon: 'customValue'},
				'fontfamily': {cmd: 'font-family',param: '',icon: 'customValue'},
				'forecolor': {cmd: 'color',param: '',icon: 'customValue'},
				'backcolor': {cmd: 'background-color',param: '',icon: 'customValue'},
				'tolowercase': {cmd: 'wordcase',param: 'lower',icon: ''},
				'touppercase': {cmd: 'wordcase',param: 'upper',icon: ''}
			},
			/**
			 * @type {object} 段落修改类命令
			 */
			paragraphCommand: {
				'justifyleft': {cmd: 'text-align',param: 'left',icon: 'customChecked'},
				'justifycenter': {cmd: 'text-align',param: 'center',icon: 'customChecked'},
				'justifyright': {cmd: 'text-align',param: 'right',icon: 'customChecked'},
				'justifyfull': {cmd: 'text-align',param: 'justify',icon: 'customChecked'},
				'insertorderedlist': {cmd: 'ol',param: '',icon: 'customValue'},
				'insertunorderedlist': {cmd: 'ul',param: '',icon: 'customValue'},
				'spacetop': {cmd: 'margin-top',param: '',icon: ''},
				'spacebottom': {cmd: 'margin-bottom',param: '',icon: ''},
				'linespace': {cmd: 'line-height',param: '',icon: ''},
				'outdent': {cmd: 'padding-left',param: '-14px',icon: ''},
				'indent': {cmd: 'padding-left',param: '14px',icon: ''}
			},
			/**
			* @type {object} 插件命令
			*/
			pluginCommand: {
				'icon': {cmd: 'icon',param: '',icon: ''},
				'element': {cmd: 'element',param: '',icon: ''},
				'redo': {cmd: 'redo',param: '',icon: ''},
				'undo': {cmd: 'revert',param: '',icon: ''},
				'cut': {cmd: 'paste',param: 'cut',icon: ''},
				'copy': {cmd: 'paste',param: 'copy',icon: ''},
				'paste': {cmd: 'paste',param: '',icon: ''},
				'pastetotext': {cmd: 'paste',param: 'toggleTextpaste',icon: ''},
				'removeformat' : {cmd : 'font',param : 'clear',icon : ''},
				'formatmatch' : {cmd : 'font',param : 'toggleBrush',icon : ''},
				'brush' : {cmd : 'font',param : 'brush',icon : ''},

				'boldmenu': {cmd: 'boldmenu',param: '',icon: ''},
				'forecolormenu': {cmd: 'colormenu',param: 'forecolor',icon: ''},
				'backcolormenu': {cmd: 'colormenu',param: 'backcolor',icon: ''},
				'fontsizemenu': {cmd: 'fontsizemenu',param: '',icon: ''},
				'fontfamilymenu': {cmd: 'fontfamilymenu',param: '',icon: ''},
				'spacebottommenu': {cmd: 'spacemenu',param: 'bottom',icon: ''},
				'spacetopmenu': {cmd: 'spacemenu',param: 'top',icon: ''},
				'linespacemenu': {cmd: 'spacemenu',param: 'line',icon: ''},
				'h2': {cmd: 'hn',param: 'h2',icon: 'customChecked'},
				'h3': {cmd: 'hn',param: 'h3',icon: 'customChecked'},
				'blockquote': {cmd: 'blockquote',param: 'h3',icon: 'customChecked'},
				'image': {cmd: 'image',param: '',icon: ''},
				'imageFloat': {cmd: 'image',param: 'imgFloat',icon: ''},
				'link': {cmd: 'link',param: '',icon: ''},
				'map': {cmd: 'map',param: '',icon: ''},
				'insertvideo': {cmd: 'video',param: '',icon: ''},
				'pasteword': {cmd: 'pasteword',param: '',icon: ''},

				'specharsmenu': {cmd: 'specharsmenu',param: '',icon: ''},
				'baikelink': {cmd: 'baikelink',param: '',icon: ''},
				'inserttable': {cmd: 'table',param: '',icon: 'tableChecked'},
				'inserttablemenu': {cmd: 'tablemenu',param: '',icon: 'tableChecked'},
				'inserttime': {cmd: 'inserttime',param: '',icon: ''},
				'datemenu': {cmd: 'datemenu',param: '',icon: ''},
				'insertdate': {cmd: 'datemenu',param: '',icon: ''},
				'multiimage': {cmd: '',param: '',icon: ''},
				'insertunorderedlistmenu': {cmd: 'ulmenu',param: '',icon: ''},
				'insertorderedlistmenu': {cmd: 'olmenu',param: '',icon: ''},

				'combinecells': {cmd: 'table',param: 'combineCell',icon: 'tableChecked'},
				'combinecolafter': {cmd: 'table',param: 'combineColAfter',icon: 'tableChecked'},
				'combinerowafter': {cmd: 'table',param: 'combineRowAfter',icon: 'tableChecked'},
				'splittocols': {cmd: 'table',param: 'splitToCols',icon: 'tableChecked'},
				'splittorows': {cmd: 'table',param: 'splitToRows',icon: 'tableChecked'},
				'splittocells': {cmd: 'table',param: 'splitCellWhole',icon: 'tableChecked'},
				'insertcolbefore': {cmd: 'table',param: 'insertCol',args: 'forward',icon: 'tableChecked'},
				'insertcolafter': {cmd: 'table',param: 'insertCol',args: 'backward',icon: 'tableChecked'},
				'insertrowbefore': {cmd: 'table',param: 'insertRow',args: 'forward',icon: 'tableChecked'},
				'insertrowafter': {cmd: 'table',param: 'insertRow',args: 'backward',icon: 'tableChecked'},
				'deleterow': {cmd: 'table',param: 'deleteCol',icon: 'tableChecked'},
				'deletecol': {cmd: 'table',param: 'deleteRow',icon: 'tableChecked'},
				'deletetable': {cmd: 'table',param: 'deleteTable',icon: 'tableChecked'},
				'tableprops': {cmd: 'table',param: 'tableAttrDialog',icon: 'tableChecked'},
				'cellcolor': {cmd: 'table',param: 'cellColor',icon: ''},
				'celljustify': {cmd:'table',param: 'cellJustify',icon: ''},
				'tablefloat': {cmd:'table',param: 'tableFloat',icon: ''},
				'tablehead': {cmd:'table',param: 'toggleHead',icon: ''},
				'tabletitle': {cmd:'table',param: 'toggleTitle',icon: ''},

				'reference': {cmd: '',param: '',icon: ''},
				'highlightcode': {cmd: 'highlightcode',param: '',icon: ''},
				'cleardoc': {cmd: 'cleardoc',param: '',icon: ''},
				'preview': {cmd: '',param: '',icon: ''},
				'source': {cmd: 'source',param: '',icon: ''},
				'anchor': {cmd: 'anchor',param: '',icon: ''},
				'autoformat': {cmd: 'autoformat',param: '',icon: ''},
				'selectall': {cmd: 'selectall',param: '',icon: ''},
				'insertparagraphbefore': {cmd: 'insertparagraph',param: 'before',icon: ''},
				'insertparagraphafter': {cmd: 'insertparagraph',param: 'after',icon: ''},
				'codemirror': {cmd: 'codemirror',param: '',icon: ''},
				'about': {cmd: 'about',param: '',icon: ''},
				'search': {cmd: 'search',param: '',icon: ''},
				'shortcutmenu': {cmd: 'shortcutmenu',param: '',icon: ''},
				'dragimage': {cmd: 'dragimage',param: '',icon: ''},
				'ajaxupload': {cmd: 'ajaxupload',param: '',icon: ''},
				'replace': {cmd: 'search',param: '',icon: ''},
				'uploadremoteimage': {cmd: 'uploadremoteimage',param: '',icon: ''},
				'insertcode': {cmd: 'insertcode',param: '',icon: ''},
				'insertcodemenu': {cmd: 'insertcodemenu',param: '',icon: ''}
			},
			/**
			* @type {object} 插入类命令
			*/
			insertCommand: {
				'insert': {cmd: 'insert',param: '',icon: ''},
				'spechars': {cmd: 'insert',param: '',icon: ''}
			},
			/**
			* @type {object} 交互类命令，如对话框内的操作命令
			*/
			uiCommand: {
				'codedialog': {cmd: 'codedialog',param: '',icon: ''},
				'imagedialog': {cmd: 'imagedialog',param: '',icon: ''},
				'tabledialog': {cmd: 'tabledialog',param: '',icon: ''},
				'videodialog': {cmd: 'videodialog',param: '',icon: ''},
				'linkdialog': {cmd: 'linkdialog',param: '',icon: ''},
				'mapdialog': {cmd: 'mapdialog',param: '',icon: ''},
				'pasteworddialog': {cmd: 'pasteworddialog',param: '',icon: ''},
				'sourcedialog': {cmd: 'sourcedialog',param: '',icon: ''},
				'searchdialog': {cmd: 'searchdialog',param: '',icon: ''},
				'aboutdialog': {cmd: 'aboutdialog',param: '',icon: ''},
				'anchordialog': {cmd: 'anchordialog',param: '',icon: ''}
			}
		}
	};
	E.config = $.extend({},E.config,config);
})(window.jQuery.jQEditor , window.jQuery);
var DTD = (function() {
	function _( s ) {
        for (var k in s) {
            s[k.toUpperCase()] = s[k];
        }
        return s;
    }
    function con( t ) {
        var a = arguments;
        for ( var i=1; i<a.length; i++ ) {
            var x = a[i];
            for ( var k in x ) {
                if (!t.hasOwnProperty(k)) {
                    t[k] = x[k];
                }
            }
        }
        return t;
    }

	/**
	 * 标签对应的可以嵌套的标签，键为目标标签，值为可以嵌套的标签
	 * 没有对应的值标签为不能嵌套，值标签对应的数字为
	 * 0：不能嵌套，1：可以正常嵌套，2：嵌套冲突（有你没我的），3：意义相同（理论可以替代），parent：不能独立存在，需要父节点存在才能存在 ，child：不能为空，需要有默认的子元素
	 */
    var block = _({address:1,blockquote:1,center:1,dir:1,div:1,dl:1,fieldset:1,form:1,h1:1,h2:1,h3:1,h4:1,h5:1,h6:1,hr:1,isindex:1,menu:1,noframes:1,ol:1,p:1,pre:1,table:1,ul:1,li:1,noscript:1}),
        //针对优酷的embed他添加了结束标识，导致粘贴进来会变成两个，暂时去掉 ,embed:1
        empty =  _({area:1,base:1,br:1,col:1,hr:1,img:1,input:1,link:1,meta:1,param:1,embed:1}),
		inline = _({iframe:1,sub:1,img:1,embed:1,object:1,sup:1,basefont:1,map:1,applet:1,font:1,big:1,small:1,b:1,acronym:1,bdo:1,'var':1,'#':1,abbr:1,code:1,br:1,i:1,cite:1,kbd:1,u:1,strike:1,s:1,tt:1,strong:1,q:1,samp:1,em:1,dfn:1,span:1,ins:1,del:1,script:1,style:1,input:1,button:1,select:1,textarea:1,label:1,a:1});
	var font = _({strong:1,em:1,sub:1,sup:1,span:1,b:1,i:1,u:1,font:1,tt:1,big:1,small:1,q:1,code:1,cite:1,dfn:1,samp:1,kbd:1,abbr:1,acronym:1,bdo:1});
	return  _({

        // $ 表示自定的属性
		//:2表示互斥，不可以相互嵌套，只能替换
		
        //块结构元素列表
        $block : con( {}, block ),

        //内联元素列表
        $inline : con( _({a:0}), inline ),
		
		//文字样式标签
		$font : font,
		
        $body : con( _({script:1,style:1}), block ),

        $cdata : _({script:1,style:1}),

        //自闭和元素
        $empty : empty,

        //不是自闭合，但不能让range选中里边
        $nonChild : _({iframe:1,textarea:1}),
        //列表元素列表
        $listItem : _({dd:1,dt:1,li:1}),

        //列表根元素列表
        $list: _({ul:1,ol:1,dl:1}),

        //不能认为是空的元素
        $isNotEmpty : _({table:1,ul:1,ol:1,dl:1,iframe:1,area:1,base:1,col:1,hr:1,img:1,embed:1,input:1,link:1,meta:1,param:1}),
		//可以为空的内联元素
		$emptyInline : _({'hr':1,'br':1,'img':1,'embed':1}),
        //如果没有子节点就可以删除的元素列表，像span,a
        $removeEmpty : _({a:1,abbr:1,acronym:1,address:1,b:1,bdo:1,big:1,cite:1,code:1,del:1,dfn:1,em:1,font:1,i:1,ins:1,label:1,kbd:1,q:1,s:1,samp:1,small:1,span:1,strike:1,strong:1,sub:1,sup:1,tt:1,u:1,'var':1}),

        $removeEmptyBlock : _({'p':1,'div':1,'ol':1,'ul':1,'dl':1}),
		
        //在table元素里的元素列表
		$tableContent : _({caption:1,col:1,colgroup:1,tbody:1,td:1,tfoot:1,th:1,thead:1,tr:1,table:1}),
        //不转换的标签
        $notTransContent : _({pre:1,script:1,style:1,textarea:1}),
		//段落样式标签
		$paragraph : con(_({body:0,legend:1,caption:1,dl:0,ul:0,ol:0,dir:0,div:0,table:0}),block),
		
		html : _({body:1,script:1}),
		body : con(_({child:'p'}),block,inline),
		/**	block标签
		*/
		ul : con(_({li:1,ol:2,dir:2,child:'li'}),block),
		ol : con(_({li:1,ul:2,dir:2,child:'li'}),block),
		li : con(_({li:0,parent:'ul'}),block,inline),
		dir : _({li:1,ul:2,ol:2,child:'dd'}),
		dl : _({dt:1,dd:1,child:'dd'}),
		dt : con(_({dd:2,parent:'dl'}),inline),
		dd : con(_({dt:2,parent:'dl'}),inline,block),
		table : _({thead:1,tbody:1,tfoot:1,tr:1,colgroup:1,caption:1,col:1,child:'tbody'}),
		tbody : _({thead:2,tfoot:2,tr:1,parent:'table',child:'tr'}),
		tfoot : _({thead:2,tbody:2,tr:1,parent:'table',child:'tr'}),
		thead : _({tbody:2,tfoot:2,tr:1,parent:'table',child:'tr'}),
		caption : con(_({parent:'table'}),inline),
		colgroup : _({col:1,parent:'table'}),
		col : {},
		tr : _({td:1,th:1,parent:'tbody',child:'td'}),
		td : con(_({th:2,parent:'tr'}),block,inline),
		th : con(_({td:2,parent:'tr'}),block,inline),
		center : con(block,inline),
		p : inline,
		h1 : inline,
		h2 : inline,
		h3 : inline,
		h4 : inline,
		h5 : inline,
		h6 : inline,
		div : con(_({child:'p'}),block,inline),
		pre : con(_({img:0,object:0,big:0,small:0,sub:0,sup:0}),inline),
		blockquote : block,
		noscript : con(block,inline),
		address : inline,
		fieldset : con(_({legend:1}),block,inline),
		legend : inline,
		form : con(_({form:0}),block,inline),
		/**	inline标签
		*/
		img : {},
		span : _({br:1}),
		i : _({span:1,em:3,cite:2}),
		cite : _({span:1,em:3,i:3}),
		b : _({span:1,em:1,strong:3}),
		em : _({span:1,i:2,cite:2}),
		u : _({span:1,i:1,cite:1}),
		strong : _({span:1,em:1,cite:1,i:1,b:2}),
		sub : _({span:1,em:1,cite:1,i:1,sup:2,strong:1}),
		sup : _({span:1,em:1,cite:1,i:1,sub:2,strong:1}),
		big : _({span:1,em:1,cite:1,i:1,sub:1,sup:1,strong:1,small:2}),
		small : _({span:1,em:1,cite:1,i:1,sub:1,sup:1,strong:1,big:2}),
		font : _({span:1,em:1,cite:1,i:1,sub:1,sup:1,strong:1,small:1,big:1}),
		code : _({span:1,em:1,cite:1,i:1,sub:1,sup:1,strong:1,small:1,big:1,font:1,samp:2}),
		samp : _({span:1,em:1,cite:1,i:1,sub:1,sup:1,strong:1,small:1,big:1,font:1,code:2}),
		tt : con(_({tt:0,kbd:2}),inline),
		kbd : con(_({kbd:0,tt:2}),inline),
		dfn : con(_({dfn:0}),inline),
		abbr : con(_({abbr:0}),inline),
		acronym : con(_({acronym:0}),inline),
		q : con(_({q:0}),inline),
		bdo: con(_({bdo:0}),inline),
		label : con(_({label:0}),inline),
		br : {},
		hr : {},
		input : {},
		textarea : {},
		iframe : {},
		a : con(_({a:0}),inline),
		select : _({optgroup:1,option:1}),
		optgroup : _({option:1}),
		option : {},
		object : con(_({param:1}),block,inline),
		param : {},
		map : con(_({area:1}),block),
		area : {},
		button : con(_({a:0,input:0,select:0,textarea:0,label:0,button:0,form:0,fieldset:0}),block,inline)
    });
})();
(function(E,$){
	var error = {
		enabled : true,
		length : 1,
		sendAddr : '',
		errorList : [],
		/**
		* @description
		* 初始化错误处理
		* 确定是否开启错误处理，以及错误报告发送地址
		* @param {object} config 错误处理配置参数
		**/
		initError : function(config){
			if(config.onError){
				this.enabled = true;
			}else{
				this.enabled = false;
			}
			this.sendAddr = config.sendAddr;
			this.length = config.length;
		},
		/**
		* @description
		* 记录错误信息
		* @param {string} msg 错误消息
		* @param {number} level 错误级别
		* @param {string} mod 错误位置
		* @param {string} time 发生错误时间
		**/
		writeError : function(msg,level,mod,time){
			var curTime = new Date();
			time = time || curTime.toString();
			this.errorList.push([msg,level,mod,time]);
			if(this.enabled){
				window.console.error('level'+level+' error:'+mod+' module "'+msg+'" at '+time);
			}
		},
		/**
		* @description
		* 发送错误报告到服务前，连带着发送相关日志
		**/
		sendError : function(){
			var self = this;
			$.ajax({
				type : 'POST',
				url : self.sendAddr,
				data : self.errorList,
				success : function(){
					self.errorList = [];
				}
			});
		}
	};

	error.initError(E.config.cError);
	error.ready = true;
	E.error = error;
})(window.jQuery.jQEditor,window.jQuery);
(function(E){
	/**
	* 编辑历史记录类
	* @constructor
	* @param {object} editor 编辑器实例
	**/
	var History = function(editor){
		this.initHistory(editor);
		this.redoList = [];
		this.revertList = [];
		this.lastRecordTime = +(new Date());
	};
	History.prototype = {
		/**
		* @type {object} 编辑区域的body
		*/
		frameBody : {},
		enabled : true,
		length : 3,
		redoState : false,
		revertState : false,
		/**
		* @description
		* 初始化历史记录
		* @param {object} editor 编辑器实例
		**/
		initHistory : function(editor){
			if(editor.config.cHistory.onHistory){
				this.enabled = true;
			}else{
				this.enabled = false;
			}
			this.length = editor.config.cHistory.times;
			this.frameBody = editor.dom.body;
			this.lastHistory = {historyHtml : editor.config.oriHtml,historySelect : ''};
			this.win = editor.win;
		},
		/**
		 * @description
		 * 置空重做数组
		 **/
		getLastTime : function(){
			return this.lastRecordTime;
		},
		/**
		* @description
		* 置空重做数组
		* @param {string} firstHtml 初始内容
		**/
		setFirstHistory : function(firstHtml){
			this.redoList = [];
			this.revertList = [];
			this.lastHistory = {historyHtml : firstHtml,historySelect : ''};
		},
		/**
		* @description
		* 置空重做数组
		**/
		emptyRedo : function(){
			this.redoList = [];
		},
		/**
		* @description
		* 预记录历史，为历史添加选择状态
		**/
		prepareHistory : function(){
			//为lastHistory添加选择状态
			this.lastHistory.historySelect = E.utils.getSelectionOffset(this.win);
		},
		/**
		* @description
		* 记录历史
		* @param {number} recordLv 记录级别
		* 0：普通级别（默认），1：强制级别
		**/
		recordHistory : function(recordLv){
			recordLv = recordLv ? 1 : 0;
			var isDiff = (this.lastHistory.historyHtml !== this.frameBody.innerHTML);
			var diffLen = this.lastHistory.historyHtml.length - this.frameBody.innerHTML.length;
			if(diffLen > 3 || diffLen < -3 || (isDiff && recordLv===1)){
				var his = {};
				his.historyHtml = this.frameBody.innerHTML;
				if(this.lastHistory){
					this.revertList.push(this.lastHistory);
				}
				this.lastHistory = his;
				if(this.revertList.length > this.length){
					this.revertList.unshift();
				}
				this.emptyRedo();
			}
			this.changeState();
			this.lastRecordTime = +(new Date());
		},
		/**
		* @description
		* 重做
		**/
		redo : function(){
			var content = this.redoList.pop();
			if(content){
				if(this.lastHistory){
					this.revertList.push(this.lastHistory);
				}
				this.lastHistory = content;
				this.frameBody.innerHTML = content.historyHtml;
				E.utils.setSelectionByOffset(this.win,content.historySelect);
				if(this.revertList.length > this.length){
					this.revertList.unshift();
				}
			}
			this.changeState();
		},
		/**
		* @description
		* 还原
		**/
		revert : function(){
			var content = this.revertList.pop();
			if(content){
				if(this.lastHistory){
					this.redoList.push(this.lastHistory);
				}
				this.lastHistory = content;
				this.frameBody.innerHTML = content.historyHtml;
				E.utils.setSelectionByOffset(this.win,content.historySelect);
				if(this.redoList.length > this.length){
					this.redoList.unshift();
				}
			}
			this.changeState();
		},
		/**
		* @description
		* 变更重做与还原图标状态
		**/
		changeState : function(){
			this.redoState = this.redoList.length >0 ? true : false;
			this.revertState = this.revertList.length >0 ? true : false;
		}
	};
	History.ready = true;
	E.EditorHistory = History;
})(window.jQuery.jQEditor);
(function(E,$){
	var load = {
		mustFile : [],
		delayFile : [],
		//checkBrowser : function(browser){},
		/**
		初始化载入，载入用得上的js文件。
		**/
		initLoad : function(config){
			/*this.mustFile = config.mustFile;
			var lang = './lang/'+config.lang+'.js';
			this.mustFile.push(lang);
			this.loadMustFile();
			if(this.checkBrowser('ie')){
				jQuery.getScript('./core/base/ie/DOMRange.js');
				jQuery.getScript('./core/base/ie/DOMSelection.js');
			}
			if(config.isLog){
				jQuery.getScript('./core/base/log.js');
			}
			if(config.isHistory){
				jQuery.getScript('./core/base/history.js');
			}
			if(config.isError){
				jQuery.getScript('./core/base/error.js');
			}
			*/
		},
		/**载入必须的文件**/
		loadMustFile : function(){
			var len = this.mustFile.length;
			for(var i=0;i<len;i++){
				$.getScript(this.mustFile[i]);
			}
		},
		/**载入延时加载的文件**/
		loadDelayFile : function(){},
		/**载入单个文件**/
		loadOneFile : function(addr,callback){
			$.getScript(addr,function(){
				E.trigger('afterLoad');
				callback();
			});
		},
		/**载入多个文件，应该压缩**/
		loadMultiFile : function(){}
		
	};
	load.initLoad(E.config.base);
	load.ready = true;
	E.load = load;
})(window.jQuery.jQEditor,window.jQuery);
(function(E,$){
	var log = {
		enabled : true,
		length : 1,
		sendAddr : '',
		logList : [],
		/**
		* @description
		* 初始化日志处理
		* 确定是否开启日志处理，以及日志记录发送地址
		* @param {object} config 日志处理配置参数
		**/
		initLog : function(config){
			if(config.onLog){
				this.enabled = true;
			}else{
				this.enabled = false;
			}
			this.sendAddr = config.sendAddr;
			this.length = config.length;
		},
		/**
		* @description
		* 记录日志信息
		* @param {string} msg 日志消息
		* @param {string} mod 日志位置
		* @param {string} time 发生记录日志时间
		**/
		writeLog : function(msg,mod,time){
			var curTime = new Date();
			time = time || curTime.toString();
			this.logList.push([msg,mod,time]);
			if(this.enabled && window.console){
				window.console.log(mod+' module "'+msg+'" at '+time);
			}

		},
		/**
		* @description
		* 发送日志到服务器
		**/
		sendLog : function(){
			var self = this;
			$.ajax({
				type : 'POST',
				url : self.sendAddr,
				data : self.logList,
				success : function(){
					self.logList = [];
				}
			});
		}
	};
	log.initLog(E.config.cLog);
	log.ready = true;
	E.log = log;
})(window.jQuery.jQEditor,window.jQuery);
(function(E, $){
var Selection = function(dom, win) {
	this.dom = dom;
	this.win = win;
}

Selection.prototype = {
	getText: function( ){
		var range = this.win.getSelection().getRangeAt(0);
		return range.toString();
	},
	
	getSelection: function( ){
		return this.win.getSelection();
	},
	
	getRange: function( ){
		var sel = this.win.getSelection(), range = {};
		if (sel.type !== 'None') {
			range = sel.getRangeAt(0);
		} else {
			var newRange = this.dom.createRange();
			newRange.selectNodeContents(this.dom.body);
			newRange.collapse(true);
			sel.addRange(newRange);
			range = sel.getRangeAt(0);
		}
		
		return range;
	},

	/**
	* @description
	* 获得当前光标所在位置的节点
	* @return {array} 当前光标所在位置的节点
	**/
	getElementTree: function(){
		var elementList = [],
			dom = this.dom,
			range = this.getRange(),
			el = range.startContainer;
			
		while(el && el.nodeName && !$.nodeName(el, 'HTML') && el !== dom) {
			elementList.unshift(el);
			el = el.parentNode;
		}
		
		return elementList;
	},
	
	find: function(text) {
		var self = this, bool=false;
		if( $.trim(text) ){
			var range = self.getRange();
			if( E.IE ){
				if(range && range.findText(text)){
					range.select();
					bool= true;
				}
			}else{
				bool= this.win.find(text);
			}
		}
		return bool;
	},
	
	/**
	 * @description
	 * 选中元素
	 * @param node {object} 光标要设置到的节点
	 * @param start {boolean} 设置在节点头还是尾
	 **/
	selectNode: function(node, start){
		var win = this.win;
		var range = win.getSelection().getRangeAt(0);
		range.selectNodeContents(node);
		if( typeof start === 'boolean' ) {
			range.collapse(start);
		}
		
		win.getSelection().removeAllRanges();
		win.getSelection().addRange(range);
	}
}

E.Selection = Selection;

})(jQuery.jQEditor, jQuery);
(function(E,$){
	var utils = {
		/**
		 * @type {string} 空的文本占位符
		 */
		spaceText : E.IE6 ? '\ufeff' : '\u200B',
		/**
		 * @description 查看节点在父元素中的位置
		 * @param {object.<node>} node 待查看节点
		 * @return {number} 位置索引
		 */
		nodeIndex: function (node) {
			for (var i = 0; node = node.previousSibling; i++) {
				continue;
			}
			return i;
		},
		showTips : function(tips){
			$('#'+E.curId+' .tips').html(tips);
			$('#'+E.curId+' .tips').show();
		},
		/**
		* @description
		* 获得当前光标所在位置的节点
		* @return {array} 当前光标所在位置的节点
		**/
		getCurElement : function(){
			try{
				var elementList = [];
				var curSelect = E.curEditor.win.getSelection();
				if(curSelect.type === 'None'){
					var selRange = E.curEditor.dom.createRange();
					selRange.selectNodeContents(E.curEditor.dom.body);
					selRange.collapse(false);
					curSelect.addRange(selRange);
				}
				var range = curSelect.getRangeAt(0);
				if(range === null){
					E.log.writeLog('get no Element');
				}else{
					var curElement = range.startContainer;
					while(curElement.nodeName && curElement.nodeName !== 'HTML' && curElement !== E.curEditor.dom){
						elementList.unshift(curElement);
						curElement = curElement.parentNode;
					}
					
					// 如果点击的是单标签元素（如img），则将其加入到元素列表
					
					var elem, container = range.commonAncestorContainer;
					if (!range.collapsed 
						&& range.startContainer === range.endContainer 
						&& range.startOffset - range.endOffset < 2
						&& range.startContainer.hasChildNodes()
					){
						elem = range.startContainer.childNodes[range.startOffset];
					}
					while (elem && elem.nodeType == 3 && elem.parentNode) {
						elem = elem.parentNode;
					}
					
					if (elem && elem !== elementList[elementList.length - 1]) {
						elementList.push(elem);
					}
				}
				
				return elementList;
			}catch(ex){
				E.error.writeError('getElement error: '+ex.message,3,'utils');
			}
		},
		/**
		 * @description
		 * 获得选中节点偏移量，为还原准备
		 * @param {object} win 执行在的window区域
		 * @return {array} 当前光标所在位置的节点
		 **/
		getSelectionOffset : function(win){
			try{
				var offsetList = {start:[],end:[]};
				win.focus();
				var curSelect = win.getSelection();
				if(curSelect.type === 'None'){
					var selRange = win.document.createRange();
					selRange.selectNodeContents(win.document.body);
					selRange.collapse(false);
					curSelect.addRange(selRange);
				}
				var sRange = curSelect.getRangeAt(0);
				var curStartElement = sRange.startContainer,
					curEndElement = sRange.endContainer;
				offsetList['start'].unshift(sRange.startOffset);
				offsetList['end'].unshift(sRange.endOffset);
				while(curStartElement.nodeName && curStartElement.nodeName !== 'BODY' && curStartElement !== win.document){
					var startIndex = this.nodeIndex(curStartElement);
					offsetList['start'].unshift(startIndex);
					curStartElement = curStartElement.parentNode;
				}
				while(curEndElement.nodeName && curEndElement.nodeName !== 'BODY' && curEndElement !== win.document){
					var endIndex = this.nodeIndex(curEndElement);
					offsetList['end'].unshift(endIndex);
					curEndElement = curEndElement.parentNode;
				}
				return offsetList;
			}catch(ex){
				E.error.writeError('getSelectionOffset error: '+ex.message,3,'utils');
			}
		},
		/**
		 * @description
		 * 根据节点偏移量还原选中区域
		 * @param {object} win 执行在的window区域
		 **/
		setSelectionByOffset : function(win,oriOffsetList){
			try{
				win.focus();
				var offsetList = [];
				$.extend(true,offsetList,oriOffsetList)
				var dom = win.document;
				var startIndex = offsetList['start'].shift(),
					endIndex = offsetList['end'].shift();
				var startContainer = dom.body,endContainer = dom.body,startOffset = 0,endOffset = 0;
				var tmpStartContainer = dom.body.childNodes[startIndex],
					tmpEndContainer = dom.body.childNodes[endIndex];
				while(1){
					if(!tmpStartContainer){
						startOffset = 0;
						break;
					}
					startContainer = tmpStartContainer;
					startIndex = offsetList['start'].shift();
					if(typeof startIndex !== 'undefined'){
						if(tmpStartContainer.nodeType === 3){
							if(tmpStartContainer.nodeValue.length > startIndex){
								startOffset = startIndex;
							}else{
								startOffset = tmpStartContainer.nodeValue.length;
							}
							break;
						}else{
							if(tmpStartContainer.childNodes.length > startIndex){
								tmpStartContainer = tmpStartContainer.childNodes[startIndex];
								startOffset = startIndex;
							}else{
								startOffset = tmpStartContainer.childNodes.length;
								tmpStartContainer = tmpStartContainer.lastChild;
							}
						}
					}else{
						break;
					}
				}
				while(1){
					if(!tmpEndContainer){
						endOffset = 0;
						break;
					}
					endContainer = tmpEndContainer;
					endIndex = offsetList['end'].shift();
					if(typeof endIndex !== 'undefined'){
						if(tmpEndContainer.nodeType === 3){
							if(tmpEndContainer.nodeValue.length > endIndex){
								endOffset = endIndex;
							}else{
								endOffset = tmpEndContainer.nodeValue.length;
							}
							break;
						}else{
							if(tmpEndContainer.childNodes.length > endIndex){
								tmpEndContainer = tmpEndContainer.childNodes[endIndex];
								endOffset = endIndex;
							}else{
								endOffset = tmpEndContainer.childNodes.length;
								tmpEndContainer = tmpEndContainer.lastChild;
							}
						}
					}else{
						break;
					}
				}
				var curSelect = win.getSelection();
				if(curSelect.type !== 'None'){
					curSelect.removeAllRanges();
				}
				var selRange = dom.createRange();
				selRange.setStart(startContainer,startOffset);
				selRange.setEnd(endContainer,endOffset);
				curSelect.addRange(selRange);
			}catch(ex){
				E.error.writeError('setSelectionByOffset error: '+ex.message,3,'utils');
			}
		},
		/**
		* @description
		* 获得节点所在的dom片段，如果node本身就是dom片段类型，则将node变为body
		* @param {object.<node>} node 待查找节点
		* @return {object.<#document>} 节点所在的document对象
		**/
		getNodeDom : function(node){
			if(node.nodeType === 9){
				node = node.body;
			}
			return {dom:node.ownerDocument,node:node};
		},
		/**
		* @description
		* 弹出消息
		* @param {string} msg 弹出的消息内容
		* @param {boolean} isEnd 是否终止该执行程序
		**/
		message : function(msg , isEnd){
			E.dialog.open({
				id:'error',
				content:msg,
				title:'Error tips'
			});
			if(isEnd){
				throw(E.lang['unexpectedEnd']);
			}
		},
		/**
		* @description
		* 执行插件命令
		* @param {string} pcmd 插件命令名称
		* @param {string} pvalue 插件方法名称
		* @param {object} arg 命令参数,对应html中的arg属性，一般只能带一个字符串参数
		**/
		execPlugin : function(pcmd,pvalue,arg){
			function _exec() {
				var plugin = E.pluginList[pcmd];
				if(E.curEditor.pluginEnable[pcmd]){
					if(typeof plugin[pvalue] === 'function'){
						return plugin[pvalue](arg);
					}else{
						return plugin['click'](pvalue);
					}
				} else {
					E.messageError('plugin '+pcmd+' disabled!');
				}
			}
			
			if ( E.pluginList[pcmd] ) {
				return _exec();
			} else {
				E.loadPlugin(pcmd, _exec);
			}
		},
		/**
		* @description
		* 执行ui命令
		* @param {string} pcmd ui命令名称
		* @param {string} pvalue ui方法名称
		* @param {object} args 命令参数
		* @param {function} callback 回调函数
		**/
		execUi : function(pcmd,pvalue,args,callback){
			var insertHtml = '';
			if(E.uiList[pcmd]){
				insertHtml = E.uiList[pcmd][pvalue](args);
				if(insertHtml && callback){
					callback(insertHtml);
				}
			}else{
				E.loadUi(pcmd,function(){
					insertHtml = E.uiList[pcmd][pvalue](args);
					if(insertHtml && callback){
						callback(insertHtml);
					}
				});
			}
		},
		/**
		* @description
		* 将html字符串转化为node节点
		* @param {string} fromString 传入待转换字符串
		* @param {object.<node> | undefined} toNode 返回节点
		**/
		stringToNode : function(fromString,toNode){
			if(typeof toNode === 'undefined'){
				toNode = document.createElement('div');
			}
			toNode.innerHTML = fromString;
			return toNode;
		},
		/**
		* @description
		* 过滤将传入的html字符串，经过html和dom双重过滤
		* @param {object.<editor>} exeditor 过滤编辑器实例
		* @param {string} fromString 传入待转换字符串
		**/
		filterInner : function(exeditor,fromString){
			var fliterContent = exeditor.baseFilter.excute('html',fromString);
			var filterNode = this.stringToNode(fliterContent);
			var finalContent = exeditor.baseFilter.excute('beforeInsert',filterNode).innerHTML;
			return finalContent;
		},
		/**
		* @description
		* 加载对话框
		* @param {string} dialogId 对话框id
		* @param {string} dialogAddr 对话框地址
		* @param {function} callback 回调函数
		**/
		loadDialog : function(dialogId,dialogAddr,callback){
			if(typeof E.uiList[dialogId+'dialog'] === 'undefined'){
				E.loadUi(dialogId+'dialog',function(){});
			}
			if(typeof dialogAddr !== 'undefined'){
				var htmlAddr = dialogAddr+dialogId+'.dialog.json';
				var dialogSelector = '[ui='+dialogId+']';
				if($(dialogSelector).length === 0){
					if(typeof E.dialogHtml[dialogId+'dialog'] === 'undefined'){
						E.load.loadOneFile(htmlAddr,function(){
							var dialogHtml = E.dialogHtml[dialogId+'dialog'];
							$('#ui-dialog').append(dialogHtml);
							callback();
						});
					}else{
						var dialogHtml = E.dialogHtml[dialogId+'dialog'];
						$('#ui-dialog').append(dialogHtml);
						callback();
					}
				}else{
					callback();
				}
			}
			
		},
		/**
		* @description
		* 获取选中区域的纯文本信息
		* @return {string} 纯文本
		**/
		getSelectionText :function () {
			try{
				var sRange = E.curEditor.win.getSelection().getRangeAt(0);
				return sRange.toString();
			}catch(ex){
				E.error.writeError('getText error: '+ex.message,3,'utils');
			}
		},
		/**
		 * @description
		 * 删除选中区域选中情况
		 * @param win {object} 待处理区域的window对象
		 **/
		removeSelection :function (win) {
			try{
				win.getSelection().removeAllRanges();
			}catch(ex){
				E.error.writeError('removeSelection error: '+ex.message,3,'utils');
			}
		},
		/**
		 * @description
		 * 设置光标位置
		 * @param win {object} 待处理区域的window对象
		 * @param node {object} 光标要设置到的节点
		 * @param start {boolean} 设置在节点头还是尾
		 **/
		setCursor :function (win,node,start) {
			try{
				/*如果为占位符节点一定要设置start的值为true，否则会报错*/
				start = start ? true : false;
				var selRange = {};
				var curSelection = win.getSelection();
				if(curSelection.rangeCount === 0){
					selRange = win.document.createRange();
				}else{
					selRange = curSelection.getRangeAt(0);
				}
				selRange.selectNodeContents(node);
				selRange.collapse(start);
				curSelection.removeAllRanges();
				curSelection.addRange(selRange);
			}catch(ex){
				E.error.writeError('setCursor error: '+ex.message,3,'utils');
			}
		},
		/**
		 * @description
		 * 获得选中区域的范围，没有则设置在文档头
		 * @param win {object} 待处理区域的window对象
		 * @param depend {string} 'node'|'range' 根据节点还是范围,在chrome下range会执行维护，ie不会
		 **/
		getSelectionRange :function (win,depend) {
			try{
				var curSelection = win.getSelection(),selRange = {};
				if(curSelection.type !== 'None'){
					selRange = curSelection.getRangeAt(0);
				}else{
					var newRange = win.document.createRange();
					newRange.selectNodeContents(win.document.body);
					newRange.collapse(true);
					curSelection.addRange(newRange);
					selRange = curSelection.getRangeAt(0);
				}
				if(depend === 'node'){
					selRange = {
						startContainer : selRange.startContainer,
						startOffset : selRange.startOffset,
						endContainer : selRange.endContainer,
						endOffset : selRange.endOffset
					};
				}
				return selRange;
			}catch(ex){
				E.error.writeError('getSelectionRange error: '+ex.message,3,'utils');
			}
		},
		/**
		 * @description
		 * 根据范围设置选中区域,没有范围则设置到文档头处
		 * @param win {object} 待处理区域的window对象
		 * @param range {object} 要选中的范围
		 **/
		setSelectionRange :function (win,range,depend) {
			try{
				var selRange = {};
				if(typeof range !== 'object'){
					selRange = win.document.createRange();
					selRange.selectNodeContents(win.document.body);
					selRange.collapse(true);
				}else if(depend === 'node'){
					selRange = win.document.createRange();
					selRange.setStart(range.startContainer,range.startOffset);
					selRange.setEnd(range.endContainer,range.endOffset);
				}else{
					selRange = range;
				}
				var curSelection = win.getSelection();
				curSelection.removeAllRanges();
				curSelection.addRange(selRange);
			}catch(ex){
				E.error.writeError('setSelectionRange error: '+ex.message,3,'utils');
			}
		},
		/**
		* @description
		* 向光标处添加html代码
		* @param {string} html 要插入的html代码
		**/
		pasteHTML:function ( html ) {
			E.coreCommand.editInsert(html);
		},

		/**
		 * @description
		 * 将剪贴板的内容放到DOM节点上，获取内容进行处理后再放到编辑区域中
		 * 获得剪贴板中的内容
		 * @param {object} curEditor 编辑器实例
		 * @param {function} callback 获取数据后的回调函数
		 **/
		getBoardContent:function (curEditor,callback) {
			var win = curEditor.win , dom = curEditor.dom;
			var domContainer = dom.createElement('div');
			domContainer.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;left:-1000px;white-space:nowrap;";
			domContainer.innerHTML = this.spaceText;
			if(false){
				/*ie中也不使用操作剪贴板，剪贴板只能处理纯文本
				* 统一使用在编辑区域的一块新区域上设置光标，等待插入结束
				* 然后将插入内容再经过处理后放在原来应该在的位置上
				* */
			}else{
				var oriRange = win.getSelection().getRangeAt(0).cloneRange();
				var insertRange = win.getSelection().getRangeAt(0);
				insertRange.setStart(dom.body,0);
				insertRange.collapse(true);
				insertRange.surroundContents(domContainer);
				insertRange.selectNodeContents(domContainer);
				insertRange.collapse(true);
				win.getSelection().removeAllRanges();
				win.getSelection().addRange(insertRange);
				/*
				//等待同步过程将数据插入到光标处（即容器节点中）
				$(domContainer).bind('change',function(){
					alert(3);
					win.getSelection().removeAllRanges();
					win.getSelection().addRange(oriRange);
					callback(domContainer);
					$(domContainer).unbind('change');
					dom.body.removeChild(domContainer);
				});
				*/
				setTimeout(function(){
					win.getSelection().removeAllRanges();
					win.getSelection().addRange(oriRange);
					callback(domContainer);
					dom.body.removeChild(domContainer);
				},0);
			}
		},
		
		/**
		* @description
		* 将选中区域的文本，替换成新文本
		* 如果选中区域不在同一个文本节点中，则不替换
		* @param {string} newText 新文本
		*/
		replaceSelectedText : function(win,newText){
			try{
				var curSelection = win.getSelection(),selRange = {};
				if(curSelection.type !== 'None'){
					selRange = curSelection.getRangeAt(0);
					if(selRange.startContainer.nodeType === 3 && selRange.startContainer === selRange.endContainer){
						var textParent = selRange.startContainer.parentNode;
						var textFrag = selRange.extractContents();
						textFrag.firstChild.nodeValue = newText;
						selRange.insertNode(textFrag);
						E.curEditor.baseFilter.excuteOne('combine',textParent);
					}else{
						return false;
					}
				}else{
					return false;
				}
			}catch(ex){
				E.error.writeError('replaceSelectedText error: '+ex.message,3,'utils');
			}
		},
		/**
		* @description
		* 使一个节点处于选中状态
		* @param {object} win 选中区的window对象
		* @param {object.<node>} node 带选中节点
		**/
		selectNode : function(win,node){
			try{
				var selRange = {};
				var dom = typeof node === 'object' ? node.ownerDocument : doucment;
				if(dom === win.document){
					selRange = dom.createRange();
					if(typeof node !== 'object'){
						selRange.selectNodeContents(dom.body);
						selRange.collapse(true);
					}else{
						selRange.selectNode(node);
					}
					var curSelection = win.getSelection();
					curSelection.removeAllRanges();
					curSelection.addRange(selRange);
				}
			}catch(ex){
				E.error.writeError('selectNode error: '+ex.message,3,'utils');
			}
		},
		
		//new API function
		/**
		* @description
		* 新API函数需求书写规范，在此处添加函数
		* 说明详细功能，输入输出，记得加上[TODO]说明待实现
		* @param {string} arg1 参数1
		* @param {string} arg2 参数2
		* @return {string} 返回值
		**/
		newApi : function(arg1,arg2){
			alert(arg1+arg2);
			//[TODO] 输出arg1+arg2
		},
		
		
		/**
		 * html特殊字符转义为html实体字符串
		 * @param {String} html
		 * @returns {String}
		 */
		escape: function(html) {
			if(!html || typeof html !== 'string'){return html}
			return html.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/ /g, "&nbsp;");
		}
	};
	utils.ready = true;
	E.utils = utils;
})(window.jQuery.jQEditor,window.jQuery);
(function (E) {
	var lang = {
    'labelMap':{
        'anchor':'锚点', 'undo':'撤销', 'redo':'重做', 'bold':'加粗', 'indent':'增加缩进量', 'snapscreen':'截图',
        'italic':'斜体', 'underline':'下划线', 'strikethrough':'删除线', 'subscript':'下标',
        'superscript':'上标', 'formatmatch':'格式刷',
		'codemirror':'源代码', 'source':'源代码', 'blockquote':'引用',
        'pasteplain':'纯文本粘贴模式', 'selectall':'全选', 'print':'打印', 'preview':'预览',
        'horizontal':'分隔线', 'removeformat':'清除格式', 'inserttime':'时间', 'insertdate':'日期',
        'unlink':'取消链接', 'insertrowbefore':'前插入行', 'insertcolbefore':'前插入列','insertrowafter':'后插入行', 'insertcolafter':'后插入列', 'combinecolafter':'右合并单元格', 'combinerowafter':'下合并单元格',
        'deleterow':'删除行', 'deletecol':'删除列', 'splittorows':'拆分成行', 'splittocols':'拆分成列', 'splittocells':'完全拆分单元格',
        'combinecells':'合并多个单元格', 'deletetable':'删除表格', 
		'tableprops':'表格属性', 'insertparagraphbeforetable':'表格前插行', 'cleardoc':'清空文档',
        'fontfamily':'字体', 'fontsize':'字号', 'paragraph':'段落格式', 'image':'图片', 'inserttablemenu':'表格', 'link':'超链接',
        'emotion':'表情', 'specharsmenu':'特殊字符', 'searchreplace':'查询替换', 'search':'查找', 'replace':'替换', 'bmap':'Baidu地图', 'map':'Google地图',
        'insertvideo':'视频', 'help':'帮助', 'justifyleft':'居左对齐', 'justifyright':'居右对齐', 'justifycenter':'居中对齐',
        'justifyjustify':'两端对齐', 'forecolor':'字体颜色', 'backcolor':'背景色', 'insertorderedlist':'有序列表',
        'insertunorderedlist':'无序列表', 'fullscreen':'全屏', 'directionalityltr':'从左向右输入', 'directionalityrtl':'从右向左输入',
        'spacetopmenu':'段前距', 'spacebottommenu':'段后距', 'highlightcode':'插入代码', 'pagebreak':'分页', 'insertframe':'插入Iframe', 'imagenone':'默认',
        'imageleft':'左浮动', 'imageright':'右浮动', 'attachment':'附件', 'imagecenter':'居中', 'wordimage':'图片转存',
        'linespacemenu':'行间距','edittd':'单元格', 'customstyle':'自定义标题', 'autoformat':'自动排版',
        'touppercase':'字母大写', 'tolowercase':'字母小写','background':'背景','template':'模板','scrawl':'涂鸦','music':'音乐',
		'cut':'剪切',
		'fontsizemenu':'字体',
		'fontfamilymenu':'字号',
		'pastetotext':'粘贴为纯文本',
		'pasteword':'从 MS Word 粘帖',
		'reference':'参考资料',
		'insertdatemenu':'更多时间格式',
		'multiimage':'多图上传',
		'baikelink':'百科链接',
		'outdent':'减少缩进量',
		'insertunorderedlistmenu':'无序列表样式',
		'insertorderedlistmenu':'有序列表样式',
		'about':'关于',
		'forecolormenu':'更多颜色', 'backcolormenu':'更多颜色', 
		'h2':'一级目录',
		'h3':'二级目录'
    },
    'insertorderedlist':{
        'decimal':'1,2,3...',
        'lower-alpha':'a,b,c...',
        'lower-roman':'i,ii,iii...',
        'upper-alpha':'A,B,C...',
        'upper-roman':'I,II,III...'
    },
    'insertunorderedlist':{
        'circle':'○ 小圆圈',
        'disc':'● 小圆点',
        'square':'■ 小方块 '
    },
    'paragraph':{'p':'段落', 'h1':'标题 1', 'h2':'标题 2', 'h3':'标题 3', 'h4':'标题 4', 'h5':'标题 5', 'h6':'标题 6'},
    'fontfamily':{
           'songti':'宋体',
           'kaiti':'楷体',
           'heiti':'黑体',
           'lishu':'隶书',
           'yahei':'微软雅黑',
           'andaleMono':'andale mono',
           'arial': 'arial',
           'arialBlack':'arial black',
           'comicSansMs':'comic sans ms',
           'impact':'impact',
           'timesNewRoman':'times new roman'
    },
    'customstyle':{
            'tc':'标题居中',
            'tl':'标题居左',
            'im':'强调',
            'hi':'明显强调'
        },
	/*
    elementPathTip:"元素路径",
    'wordCountTip':"字数统计",
    'wordCountMsg':'当前已输入{#count}个字符, 您还可以输入{#leave}个字符。 ',
    'wordOverFlowMsg':'<span style="color:red;">字数超出最大允许值，服务器可能拒绝保存！</span>',
    'ok':"确认",
    'cancel':"取消",
    'closeDialog':"关闭对话框",
    'tableDrag':"表格拖动必须引入uiUtils.js文件！",
    'autofloatMsg':"工具栏浮动依赖编辑器UI，您首先需要引入UI文件!",
    'snapScreen_plugin':{
        'browserMsg':"仅支持IE浏览器！",
        'callBackErrorMsg':"服务器返回数据有误，请检查配置项之后重试。",
        'uploadErrorMsg':"截图上传失败，请检查服务器端环境! "
    },
    'confirmClear':"确定清空当前文档么？",
    'contextMenu':{
        'delete':"删除",
        'selectall':"全选",
        'deletecode':"删除代码",
        'cleardoc':"清空文档",
        'confirmclear':"确定清空当前文档么？",
        'unlink':"删除超链接",
        'paragraph':"段落格式",
        'edittable':"表格属性",
        'edittd':"单元格属性",
        'justifyleft':'左对齐',
        'justifyright':'右对齐',
        'justifycenter':'居中对齐',
        'justifyjustify':'两端对齐',
        'table':"表格",
        'inserttable':'插入表格',
        'deletetable':"删除表格",
        'insertparagraphbeforetable':"表格前插入行",
        'deleterow':"删除行",
        'deletecol':"删除列",
        'insertrow':"插入行",
        'insertcol':"插入列",
        'mergeright':"向右合并",
        'mergeleft':"向左合并",
        'mergedown':"向下合并",
        'mergecells':"合并单元格",
        'splittocells':"完全拆分单元格",
        'splittocols':"拆分成列",
        'splittorows':"拆分成行",
        'copy':"复制(Ctrl + c)",
        'copymsg':"请使用 'Ctrl + c'执行复制操作",
        'paste':"粘贴(Ctrl + v)",
        'pastemsg':"请使用'Ctrl + v'执行复制操作",
        'highlightcode':'插入代码'
    },

    'anthorMsg':"链接",
    'clearColor':'清空颜色',
    'standardColor':'标准颜色',
    'themeColor':'主题颜色',
    'property':'属性',
    'default':'默认',
    'modify':'修改',
    'justifyleft':'左对齐',
    'justifyright':'右对齐',
    'justifycenter':'居中',
    'justify':'默认',
    'clear':'清除',
    'anchorMsg':'锚点',
    'delete':'删除',
    'clickToUpload':"点击上传",
    'unset':'尚未设置语言文件',
    't_row':'行',
    't_col':'列',
    'more':'更多',
    'autoTypeSet':{
        mergeLine:"合并空行",
        delLine:"清除空行",
        removeFormat:"清除格式",
        indent:"首行缩进",
        alignment:"对齐方式",
        imageFloat:"图片浮动",
        removeFontsize:"清除字号",
        removeFontFamily:"清除字体",
        removeHtml:"清除冗余HTML代码",
        pasteFilter:"粘贴过滤",
        run:"执行"
    },

    'background':{
        'static':{
            'lang_background_normal':'背景设置',
            'lang_background_local':'本地图片',
            'lang_background_set':'选项',
            'lang_background_none':'无',
            'lang_background_color':'颜色设置',
            'lang_background_netimg':'网络图片',
            'lang_background_align':'对齐方式',
            'lang_background_position':'精确定位',
            'repeatType':{options:["居中", "横向重复", "纵向重复", "平铺","自定义"]}

        },
        'noUploadImage':"当前未上传过任何图片！",
        'toggleSelect':"单击可切换选中状态\n原图尺寸: "
    },
    //===============dialog i18N=======================
    'insertimage':{
        'static':{
            lang_tab_remote:"远程图片", //节点
            lang_tab_local:"本地上传",
            lang_tab_imgManager:"在线管理",
            lang_tab_imgSearch:"图片搜索",
            lang_input_url:"地 址：",
            lang_input_width:"宽 度：",
            lang_input_height:"高 度：",
            lang_input_border:"边 框：",
            lang_input_vhspace:"边 距：",
            lang_input_title:"描 述：",
            lang_input_remoteAlign:'对 齐：',
            lang_imgLoading:"　图片加载中……",
            'lock':{title:"锁定宽高比例"}, //属性
            'imgType':{title:"图片类型", options:["新闻", "壁纸", "表情", "头像"]}, //select的option
            'imgSearchTxt':{value:"请输入搜索关键词"},
            'imgSearchBtn':{value:"搜索"},
            'imgSearchReset':{value:"清空搜索"},
            'upload':{style:'background: url(upload.png);'},
            'duiqi':{style:'background: url(imglabel.png) -12px 2px no-repeat;'}
        },
        'netError':"网络链接错误，请检查配置后重试！",
        'noUploadImage':"当前未上传过任何图片！",
        'imageLoading':"图片加载中，请稍后……",
        'tryAgain':" :( ，抱歉，没有找到图片！请重试一次！",
        'toggleSelect':"单击可切换选中状态\n原图尺寸: ",
        'searchInitInfo':"请输入搜索关键词",
        'numError':"请输入正确的长度或者宽度值！例如：123，400",
        'fileType':"图片",
        'imageUrlError':"不允许的图片格式或者图片域！",
        'imageLoadError':"图片加载失败！请检查链接地址或网络状态！",
        'flashError':'Flash插件初始化失败，请更新您的FlashPlayer版本之后重试！',
        'floatDefault':"默认",
        'floatLeft':"左浮动",
        'floatRight':"右浮动",
        'floatCenter':"居中",
        'flashI18n':{} //留空默认中文
    },
    template:{
        'static':{
            'lang_template_bkcolor':'背景颜色',
            'lang_template_clear' : '保留原有内容',
            'lang_template_select' : '选择模板'
        },
        'blank':"空白文档",
        'blog':"博客文章",
        'resume':"个人简历",
        'richText':"图文混排",
        'sciPapers':"科技论文"
    },
    'anchor':{
        'static':{
            'lang_input_anchorName':'锚点名字：'
        }
    },
    'attachment':{
        'static':{
            'lang_input_fileStatus':' 当前未上传文件',
            'startUpload':{style:"background:url(upload.png) no-repeat;"}
        },
        'browseFiles':'文件浏览…',
        'uploadSuccess':'上传成功!',
        'delSuccessFile':'从成功队列中移除',
        'delFailSaveFile':'移除保存失败文件',
        'statusPrompt':' 个文件已上传！ ',
        'flashVersionError':'当前Flash版本过低，请更新FlashPlayer后重试！',
        'flashLoadingError':'Flash加载失败!请检查路径或网络状态',
        'fileUploadReady':'等待上传……',
        'delUploadQueue':'从上传队列中移除',
        'limitPrompt1':'单次不能选择超过',
        'limitPrompt2':'个文件！请重新选择！',
        'delFailFile':'移除失败文件',
        'fileSizeLimit':'文件大小超出限制！',
        'emptyFile':'空文件无法上传！',
        'fileTypeError':'文件类型错误！',
        'unknownError':'未知错误！',
        'fileUploading':'上传中，请等待……',
        'cancelUpload':'取消上传',
        'netError':'网络错误',
        'failUpload':'上传失败!',
        'serverIOError':'服务器IO错误！',
        'noAuthority':'无权限！',
        'fileNumLimit':'上传个数限制',
        'failCheck':'验证失败，本次上传被跳过！',
        'fileCanceling':'取消中，请等待……',
        'stopUploading':'上传已停止……'
    },
    'highlightcode':{
        'static':{
            'lang_input_selectLang':'选择语言'
        },
        importCode:'请输入代码'
    },
    'gmap':{
        'static':{
            'lang_input_address':'地址',
            'lang_input_search':'搜索',
            'address':{value:"北京"}
        },
        searchError:'无法定位到该地址!'
    },
    'help':{
        'static':{
            'lang_input_about':'关于BKEditor',
            'lang_input_shortcuts':'快捷键',
            'lang_input_version':'版本',
            'lang_input_introduction':'BKEditor是由互动百科web前端研发部开发的所见即所得富文本web编辑器，具有轻量，可定制，注重用户体验等特点。开源基于BSD协议，允许自由使用和修改代码。',
            'lang_Txt_shortcuts':'快捷键',
            'lang_Txt_func':'功能',
            'lang_Txt_bold':'给选中字设置为加粗',
            'lang_Txt_copy':'复制选中内容',
            'lang_Txt_cut':'剪切选中内容',
            'lang_Txt_Paste':'粘贴',
            'lang_Txt_undo':'重新执行上次操作',
            'lang_Txt_redo':'撤销上一次操作',
            'lang_Txt_italic':'给选中字设置为斜体',
            'lang_Txt_underline':'给选中字加下划线',
            'lang_Txt_selectAll':'全部选中',
            'lang_Txt_removeFormat':'清除页面文字格式',
            'lang_Txt_leftJustification':'页面文字居左显示',
            'lang_Txt_rightJustification':'页面文字居右显示',
            'lang_Txt_visualEnter':'软回车'
        }
    },
    'insertframe':{
        'static':{
            'lang_input_address':'地址：',
            'lang_input_width':'宽度：',
            'lang_input_height':'高度：',
            'lang_input_isScroll':'允许滚动条：',
            'lang_input_frameborder':'显示框架边框：',
            'lang_input_alignMode':'对齐方式：',
            'align':{title:"对齐方式", options:["默认", "左对齐", "右对齐", "居中"]}
        },
        'enterAddress':'请输入地址!'
    },
    'link':{
        'static':{
            'lang_input_text':'文本内容：',
            'lang_input_url':'链接地址：',
            'lang_input_title':'标题：',
            'lang_input_target':'是否在新窗口打开：'
        },
        'validLink':'只支持选中一个链接时生效',
        'httpPrompt':'您输入的超链接中不包含http等协议名称，默认将为您添加http://前缀'
    },
    'map':{
        'static':{
            lang_city:"城市",
            lang_address:"地址",
            city:{value:"北京"},
            lang_search:"搜索"
        },
        cityMsg:"请选择城市",
        errorMsg:"抱歉，找不到该位置！"
    },
    'searchreplace':{
        'static':{
            lang_tab_search:"查找",
            lang_tab_replace:"替换",
            lang_search1:"查找",
            lang_search2:"查找",
            lang_replace:"替换",
            lang_case_sensitive1:"区分大小写",
            lang_case_sensitive2:"区分大小写",
            nextFindBtn:{value:"下一个"},
            preFindBtn:{value:"上一个"},
            nextReplaceBtn:{value:"下一个"},
            preReplaceBtn:{value:"上一个"},
            repalceBtn:{value:"替换"},
            repalceAllBtn:{value:"全部替换"}
        },
        getEnd:"已经搜索到文章末尾！",
        getStart:"已经搜索到文章头部",
        countMsg:"总共替换了{#count}处！"
    },
    'insertvideo':{
        'static':{
            lang_tab_insertV:"插入视频",
            lang_tab_searchV:"搜索视频",
            lang_video_url:"视频网址",
            lang_video_size:"视频尺寸",
            lang_videoW:"宽度",
            lang_videoH:"高度",
            lang_alignment:"对齐方式",
            videoSearchTxt:{value:"请输入搜索关键字！"},
            videoType:{options:["全部", "热门", "娱乐", "搞笑", "体育", "科技", "综艺"]},
            videoSearchBtn:{value:"搜索"},
            videoSearchReset:{value:"清空结果"}
        },
        numError:"请输入正确的数值，如123,400",
        floatLeft:"左浮动",
        floatRight:"右浮动",
        "default":"默认",
        block:"独占一行",
        urlError:"输入的视频地址有误，请检查后再试！",
        loading:" &nbsp;视频加载中，请等待……",
        clickToSelect:"点击选中",
        goToSource:'访问源视频',
        noVideo:" &nbsp; &nbsp;抱歉，找不到对应的视频，请重试！"
    },
    'spechars':{
        'static':{},
        tsfh:"特殊字符",
        lmsz:"罗马字符",
        szfh:"数学字符",
        rwfh:"日文字符",
        xlzm:"希腊字母",
        ewzm:"俄文字符",
        pyzm:"拼音字母",
        zyzf:"注音及其他"
    },
    'inserttable':{
        'static':{
            lang_baseInfo:"基础信息",
            lang_rows:"行数",
            lang_rowUnit:"行",
            lang_width:"宽度",
            lang_widthUnit:"px",
            lang_height:"高度",
            lang_heightUnit:"px",
            lang_cols:"列数",
            lang_colUnit:"列",
            lang_warmPrompt:"温馨提示",
            lang_maxPadding:"边距最大不能超过13px! ",
            lang_extendInfo:"扩展信息",
            lang_preview:"可预览",
            lang_tableBorder:"表格边框",
            lang_borderSize:"大小",
            lang_borderColor:"颜色",
            lang_mar_pad:"边距间距",
            lang_margin:"边距",
            lang_padding:"间距",
            lang_table_background:"表格的背景颜色",
            lang_table_alignment:"表格的对齐方式",
            lang_borderFor:"边框设置作用于",
            align:{options:["默认", "居中", "居左", "居右"]},
            borderType:{options:["仅表格", "所有单元格"]},
            lang_forPreview:"这是用来预览的"
        },
        errorNum:"请输入正确的数值，如124,358",
        errorColor:"请输入正确的颜色值，如#34abdd，red",
        clearColor:"清除颜色",
        overflowMsg:"最大值不能超过{#value}px!",
        overflowPreviewMsg:"超过{#value} px时将不再提供实时预览。"
    },
    'edittd':{
        'static':{
            lang_background:"背景颜色",
            lang_alignment:"对齐方式",
            lang_horizontal:"水平",
            lang_vertical:"垂直",
            vAlign:{options:["默认", "居中对齐", "顶端对齐", "底部对齐"]},
            align:{options:["默认", "居中对齐", "左对齐", "右对齐"]}
        },
        clearColor:"清除颜色"
    },
	*/
	fontsize : '字号',
	fontfamily : '字体',
	createError : '编辑器创建失败',
	fillError : '填充panel错误',
	eventInitError : '事件模块初始化错误',
	eventRefreshError : '事件重置错误',
	filterInitError : '过滤器模块初始化错误',
	filterRefreshError : '过滤器重置错误',
	pluginInitError : '插件添加并初始化错误',
	pluginLoadError : '插件文件加载错误',
	pluginConfigError : '插件配置错误',
	uiInitError : 'ui添加并初始化错误',
	uiLoadError : 'ui文件加载错误',
	initError : '初始化失败',
	noCommand : '未检测到该命令，请在config中添加。'
};
	E.lang = lang;
})(window.jQuery.jQEditor);
(function(E){
	/**
	* 命令核心对象
	* @type {object}
	**/
	var coreCommand = {
		initCommand : function(config){
			this.Eid = config.id;
			this.win = E.curEditor.win;
			this.dom = E.curEditor.dom;
			this.startTime = '';
			this.endTime = '';
		},
		/**
		* @description
		* 修改文本样式命令
		* @param {string} cmd 文本样式方法
		* @param {string} value 文本样式修改值
		**/
		editText: function(cmd, value){

		},
		/**
		* @description
		* 光标处插入
		* @param {string} html 插入的html
		**/
		editInsert: function(html){

		},
		/**
		* @description
		* 命令前执行方法，此处没有用事件的方式，而是直接在该方法中触发事件
		* 是想表示该方法可以做更多的独立操作，不需要寄托在事件中。
		**/
		beforeCommand : function(pcmd){
			this.startTime = +(new Date());
			E.trigger('beforeCommand',{targetEditor : E.curEditor , commandName : pcmd});
			this.endTime = +(new Date());
			E.log.writeLog('command '+pcmd+' after excute '+(this.endTime-this.startTime)+'ms','command');
		},
		/**
		* @description
		* 命令前执行方法，此处没有用事件的方式，而是直接在该方法中触发事件
		* 是想表示该方法可以做更多的独立操作，不需要寄托在事件中。
		* @param {string} pcmd 命令方法
		* @param {string} pvalue 命令值（或pluginCommand对应方法对象的参数）
		* @param {object} args uiCommand对应方法对象的参数
		**/
		excuteCommand : function(pcmd,pvalue,args){
			var self = this;
			this.beforeCommand(pcmd);
			var commandType = '';
			try{
				for(var cmdType in E.config.cCommand){
					var commandName = E.config.cCommand[cmdType];
					if(commandName[pcmd]){
						if(commandName[pcmd].param !== ''){
							if(pvalue){
								args = pvalue;
							}
							pvalue = commandName[pcmd].param;
						}
						if(typeof commandName[pcmd].args !== 'undefined'){
							args = commandName[pcmd].args;
						}
						pcmd = commandName[pcmd].cmd;
						commandType = cmdType;
						break;
					}
				}
			}catch(ex){
				E.error.writeError('command config error: '+ex.message,4,'command');
				E.utils.message(E.lang['commandError'],'finish');
			}
			//try{
				if(pcmd === ''){
					throw('config cmd no defined');
				}
				if(commandType === 'textCommand'){
					self.editText(pcmd,pvalue);
				}else if(commandType === 'paragraphCommand'){
					self.editParagraph(pcmd,pvalue);
				}else if(commandType === 'insertCommand'){
					self.editInsert(pvalue);
				}else if(commandType === 'pluginCommand'){
					pvalue = pvalue || 'click';
					args = args || '';
					E.utils.execPlugin(pcmd,pvalue,args);
				}else if(commandType === 'uiCommand'){
					pvalue = pvalue || 'submit';
					args = args || '';
					var insertHtml = false;
					E.utils.execUi(pcmd,pvalue,args,function(insertHtml){
						if(insertHtml !== false && typeof insertHtml !== 'undefined'){
							self.editInsert(insertHtml);
						}
					});
				}else{
					throw(E.lang['noCommand']+pcmd);
				}
			//}catch(ex){
			//	E.error.writeError(pcmd+pvalue+' error: '+ex.message,4,'command');
			//}
			this.endTime = +(new Date());
			E.log.writeLog('command '+pcmd+' after excute '+(this.endTime-this.startTime)+'ms','command');
			this.afterCommand(pcmd);
		},
		/**
		* @description
		* 命令后执行方法，此处没有用事件的方式，而是直接在该方法中触发事件
		* 是想表示该方法可以做更多的独立操作，不需要寄托在事件中。
		**/
		afterCommand : function(pcmd){
			E.trigger('afterCommand',{targetEditor : E.curEditor , commandName : pcmd});
			this.endTime = +(new Date());
			E.log.writeLog('command '+pcmd+' after excute '+(this.endTime-this.startTime)+'ms','command');
		}
	};
	
	E.coreCommand = coreCommand;
	E.command = function(cmd,param,args){
		coreCommand.excuteCommand(cmd,param,args);
	};
	E.command.ready = true;
	
})(window.jQuery.jQEditor);
(function(E){
	var _win,_dom;
	/**
	* @description 插入入口，每次插入生成一个新的对象
	* @param {string} html 插入的html代码
	* @return {boolean} 是否插入成功
	*/
	var insert = function(html){
		var insertObj = new Insert();
		insertObj.init(_win,_dom);
		html = E.utils.filterInner(E.curEditor,html);
		insertObj.insert(html);
		return insertObj;
	};
	/**
	* 插入对象构造函数
	* @constructor
	*/
	function Insert(){
		_win = E.curEditor.win;
		_dom = E.curEditor.dom;
	}
	Insert.prototype = {
		mainRange : {},
		mainSelection : {},
		document : {},
		win : {},
		tmpBoard : {},
		/**
		* @description 插入对象初始化
		* @param {object} win 插入执行的window对象
		* @param {object} dom 插入执行的document对象
		*/
		init : function(win,dom){
            this.win = win;
			this.document = dom;
			this.mainRange = dom.createRange();
			this.mainSelection = win.getSelection();
			if(this.mainSelection.type === 'None'){
                this.mainSelection.addRange(this.mainRange);
            }else{
                this.mainRange = this.mainSelection.getRangeAt(0);
            }
		},
		/**
		* @description 执行插入操作
		* @param {string} innerHtml 插入的html代码
		*/
		insert : function(innerHtml){
			//预处理插入的字符串
			var nextHtml = this._preDoHtml(innerHtml);
			//将字符串变成node节点放到DOM上
			var pasteNode = this._copyToBoard(nextHtml);
			if(pasteNode !== false){
				for(var i=0;i<pasteNode.length;i++){
					//粘贴节点
					this._paste(pasteNode[i]);
				}
			}
			this.tmpBoard.nodeValue = "";
			E.curEditor.baseFilter.excute('afterInsert');
		},
		/**
		* @description 预处理插入代码
		* @param {string} preHtml 未处理的待插入的html代码
		* @return {string} 处理后的待插入的html代码
		*/
		_preDoHtml : function(preHtml){
			//[TODO] html字符串过滤，过滤掉合理的html
			return preHtml;
		},
		/**
		* @description 将hmtl代码转化成文档片段
		* @param {string} nextHtml 处理后的待插入的html代码
		* @return {object.<fragment>} 待插入的文档片段
		*/
		_copyToBoard : function(nextHtml){
			var pasteNode = {};
			var boardRange = this.document.createRange();
			boardRange.selectNodeContents(this.document.body);
			//在DOM树上将要插入的字符串变成node节点
			this.tmpBoard = boardRange.createContextualFragment(nextHtml);
			/*
			this.tmpBoard = this.document.createElement('div')
			this.tmpBoard.style.visibility = "hidden";
			this.tmpBoard.setAttribute('id','tmpBoard');
			this.tmpBoard.innerHTML = nextHtml;
			this.document.body.appendChild(this.tmpBoard);
			*/
			//处理每一个节点（最外层）
			pasteNode = this._cutInsertNode(this.tmpBoard);
			return pasteNode;
		},
		/**
		* @description 插入单个node节点
		* @param {object.<fragment>} queryNode 待插入的文档片段
		*/
		_paste : function(queryNode){
			if(!this.mainRange.collapsed){
				this.mainRange.deleteContents();
			}
			var cutRange = this.mainRange.cloneRange();
			var cutNode = cutRange.startContainer;
			//监测范围是否在标签头部或尾部，并且可以设置到标签的外面去
			var startFlag = false , endFlag = false;
			if(cutRange.startContainer.childNodes.length === cutRange.startOffset){
				endFlag = true;
			}
			if(0 === cutRange.startOffset){
				startFlag = true;
			}
			if(queryNode.insertType !== 'text'){
				if(!this._hasParentNode(queryNode.insertType,cutNode)){
					//补全标签的父标签
					this._fillNode(queryNode);
				}
				//遍历选区节点的父节点，确定能够包裹插入节点的位置
				while(cutNode.tagName !== 'BODY' && (cutNode.nodeType === 3 || (cutNode.nodeType !== 3 && DTD[cutNode.tagName][queryNode.insertType] !== 1)) ){
					/*if(cutNode.firstChild !== cutNode){
						startFlag = false;
					}
					if(cutNode.lastChild !== cutNode){
						endFlag = false;
					}
					if(startFlag){
						cutRange.setStartBefore(cutNode);
						cutRange.collapse(true);
					}
					if(endFlag){
						cutRange.setEndAfter(cutNode);
						cutRange.collapse(false);
					}*/
					cutRange.setStartBefore(cutNode);
					cutNode = cutNode.parentNode;
				}
				//进行截断
				var startPart = cutRange.extractContents();
				cutRange.insertNode(startPart);
				cutRange.collapse(false);
				cutRange.insertNode(queryNode.insertValue);
			}else if(cutRange.startContainer.nodeType !== 3){
				//为与元素节点并列的节点添加p标签
				cutRange.insertNode(queryNode.insertValue);
				var prevNode = cutRange.startContainer.childNodes[cutRange.startOffset-1];
				if(prevNode && prevNode.nodeType !== 3 && DTD.$block[prevNode.nodeName] === 1){
					var tmpP = this.document.createElement('p');
					cutRange.surroundContents(tmpP);
				}
			}else{
				cutRange.insertNode(queryNode.insertValue);
			}
			//设置光标在插入节点的后边
			cutRange.selectNode(queryNode.insertOri);
			cutRange.collapse(false);
			this.mainRange = cutRange;
			this.mainSelection.removeAllRanges();
			this.mainSelection.addRange(this.mainRange);
		},
		/**
		* @description 整理待插入节点
		* @param {object.<fragment>} queryNode 待插入的文档片段
		* @return {array.<node>} 待插入的节点信息数组
		*/
		_cutInsertNode : function(queryNode){
			//打断被插入节点，取出最外层节点存入数组，信息包括插入节点值，节点标签类型，原始节点
			var insertArray = [];
			for(var i=0;i<queryNode.childNodes.length;i++){
				var insertOne = new Object({insetType:'',insertValue:{},insertOri:{}});
				if(queryNode.childNodes[i].nodeType === 3){
					insertOne.insertType = 'text';
					insertOne.insertValue = queryNode.childNodes[i];
					insertOne.insertOri = queryNode.childNodes[i];
				}else{
					insertOne.insertType = queryNode.childNodes[i].tagName;
					insertOne.insertValue = queryNode.childNodes[i];
					insertOne.insertOri = queryNode.childNodes[i];
				}
				insertArray[i] = insertOne;
			}
			return insertArray;
		},
		/**
		* @description 检查是否外层有可以包裹该标签的节点
		* @param {string} tagName 待检查的标签
		* @param {object.<node>} searchNode 检查的节点
		* @return {boolean} 是否存在可包裹该标签的节点
		*/
		_hasParentNode : function(tagName,searchNode){
			var hasParent = false;
			while(searchNode.tagName !== 'HTML'){
				if(searchNode.nodeType !== 3 && DTD[searchNode.tagName][tagName] === 1){
					hasParent = true;
					break;
				}
				searchNode = searchNode.parentNode;
			}
			return hasParent;
		},
		/**
		* @description 填充父标签，如li没有ul，td没有tr、table等
		* @param {object.<node>} partNode 不完整的节点
		*/
		_fillNode : function(partNode){
			var partRange = this.document.createRange();
			partRange.selectNode(partNode.insertValue);
			var tagName = partNode.insertType;
			while(DTD[tagName]['parent']){
				var elementTag = this.document.createElement(DTD[tagName]['parent']);
				partRange.surroundContents(elementTag);
				tagName = DTD[tagName]['parent'];
				partNode.insertType = tagName;
				partNode.insertValue = elementTag;
			}
		}
	};
	E.coreCommand.editInsert = insert;
})(window.jQuery.jQEditor);
(function(E,$){
	var _win,_dom;
	/**
	* @description 段落修改入口，每次修改段落生成一个新的对象
	* @param {string} cmd 修改命令
	* @param {string} value 修改参数
	* @return {boolean} 是否修改成功
	*/
	var paragraph = function(cmd,value){
		var result = true;
		var paragraphObj = new Paragraph();
		var selRangeObj = paragraphObj.init(_win,_dom);
		paragraphObj.mainRange = selRangeObj.rangeSet[0];
		for(var i=0;i<selRangeObj.len;i++){
			paragraphObj.mainRange = selRangeObj.rangeSet[i];
			result = paragraphObj.changeParagraph(cmd,value);
		}
		return result;
	};
	/**
	* 段落对象构造函数
	* @constructor
	*/
	function Paragraph(){
		_win = E.curEditor.win;
		_dom = E.curEditor.dom;
	}
	Paragraph.prototype = {
		mainRange : {},
		mainSelection : {},
		document : {},
		win : {},
		/**
		* @description 修改段落对象初始化
		* @param {object} win 修改执行的window对象
		* @param {object} dom 修改执行的document对象
		*/
		init : function(win,dom){
			var rangeObj = {len:0,rangeSet:[]};
            this.win = win;
			this.document = dom;
			var mainRange = dom.createRange();
			this.mainSelection = win.getSelection();
			/*表格选中情况区分多个带改变范围*/
			var selectedCell = $(E.curEditor.dom).find('.'+ E.curEditor.config.selectCellClass);
			var selectedTable = $(E.curEditor.dom).find('.'+ E.curEditor.config.selectTableClass);
			if(selectedTable.length !== 0){
				rangeObj.len = selectedTable.length;
				for(var i=0;i<selectedTable.length;i++){
					mainRange.selectNodeContents(selectedTable[i]);
					rangeObj.rangeSet[i] = mainRange.cloneRange();
				}
			}else if(selectedCell.length !== 0){
				rangeObj.len = selectedCell.length;
				for(var i=0;i<selectedCell.length;i++){
					mainRange.selectNodeContents(selectedCell[i]);
					rangeObj.rangeSet[i] = mainRange.cloneRange();
				}
			}else{
				if(this.mainSelection.type === 'None'){
					rangeObj.len = 0;
				}else{
					rangeObj.len = 1;
					rangeObj.rangeSet[0] = this.mainSelection.getRangeAt(0);
				}
			}
			return rangeObj;
		},
		/**
		 * @description 执行段落修改操作
		 * @param {string} styleType 待修改的样式
		 * @param {string} styleValue 修改的参数值
		 */
		changeParagraph : function(styleType,styleValue){
			var on_off = '';
			if(!styleValue){
				if(styleType === 'ul'){
					styleValue = 'disc';
				}
				if(styleType === 'ol'){
					styleValue = 'decimal';
				}
			}else{
				if(styleType === 'padding-left'){
					var tmpValue = styleValue;
					styleValue =  function(index,value){
						var finalValue = parseFloat(value) + parseFloat(tmpValue);
						return (finalValue > 0 ? finalValue : 0) + 'px';
					};
				}
			}
			var changeRange = this.mainRange;
			var commonAncestor = changeRange.commonAncestorContainer;
			var oriOptArea = {
				ancestor : commonAncestor,
				firstNode : changeRange.startContainer,
				firstOffset : changeRange.startOffset,
				lastNode : changeRange.endContainer,
				lastOffset : changeRange.endOffset,
				styleNode : $()
			};
			var comStartRange = changeRange.cloneRange();
			comStartRange.collapse(true);
			var comEndRange = changeRange.cloneRange();
			comEndRange.collapse(false);
			if(styleType === 'ul' || styleType === 'ol'){
				on_off = this.judgeValue(styleType,styleValue);
				this._setParagraph(oriOptArea,styleType,styleValue,on_off);
				return true;
			}
			var ancestorList = {};
			if(navigator.userAgent.indexOf("MSIE") <= 0){
				ancestorList = this.document.createNodeIterator(commonAncestor,NodeFilter.SHOW_TEXT);
			}else{
				ancestorList = this.document.createNodeIterator(commonAncestor,3);
			}
			var endRange = {},startRange = {},midRange = {};
			var queryNode = ancestorList.nextNode();
			var queryNode2 = {};
			var startOpt = 0,endOpt = 1;
			while(queryNode){
				queryNode2 = ancestorList.nextNode();
				if(startOpt === 0){
					var comRange = this.document.createRange();
					comRange.selectNode(queryNode);
					var inStart = comRange.compareBoundaryPoints(comRange.START_TO_START,comStartRange);
				}
				if(endOpt === 1){
					if(queryNode2){
						var comRange2 = this.document.createRange();
						comRange2.selectNode(queryNode2);
						var	inEnd = comRange2.compareBoundaryPoints(comRange2.START_TO_START,comEndRange);
					}else{
						var	inEnd = -1;
					}
				}
				var startCome = inStart > -1 && startOpt === 0;
				var endCome = inEnd > -1 && startOpt === 1 && endOpt === 1;
				if(queryNode === oriOptArea.lastNode || endCome){
					endRange = this._setStyle(queryNode,oriOptArea,styleType,styleValue);
					endOpt = 0;
					break;
				}
				if(startOpt && endOpt){
					midRange = this._setStyle(queryNode,oriOptArea,styleType,styleValue);
				}
				if( !startOpt && (queryNode === oriOptArea.firstNode || startCome) ){
					startRange = this._setStyle(queryNode,oriOptArea,styleType,styleValue);
					startOpt = 1;
				}
				//指向下一个要修改的节点
				queryNode = queryNode2;
			}
		},
		_setStyle : function(queryNode,oriOptArea,styleType,styleValue){
			var dom = this.document;
			var isDoneNode = $(queryNode).closest(oriOptArea.styleNode).length;
			if(isDoneNode){
				return ;
			}else{
				var specialTag = 'td,th,dt,dd,li';
				var paragraphTag = [],needChildTag = [],childNodeTag = [];
				for(var oneTag in DTD.$paragraph){
					oneTag = oneTag.toLowerCase();
					if(DTD.$paragraph[oneTag] === 1){
						paragraphTag.push(oneTag);
					}else if(DTD.$paragraph[oneTag] === 0){
						needChildTag.push(oneTag);
					}
				}
				paragraphTag = paragraphTag.join(',');
				needChildTag = needChildTag.join(',');
				var hasSpecial = $(queryNode).closest(specialTag);
				if(hasSpecial.length > 0){
					$(hasSpecial[0]).css(styleType,styleValue);
					oriOptArea.styleNode = hasSpecial[0];
				}else{
					var hasParentOnly = $(queryNode).closest(needChildTag);
					if(hasParentOnly.length > 0){
						var parentTag = hasParentOnly[0].nodeName;
						if(parentTag.toLowerCase() === 'body' || parentTag.toLowerCase() === 'div'){
							var hasParagraph = $(queryNode).closest(paragraphTag);
							if(hasParagraph.length > 0){
								$(hasParagraph[0]).css(styleType,styleValue);
								oriOptArea.styleNode = hasParagraph[0];
							}else{
								var defaultChild = dom.createElement(DTD[parentTag]['child']);
								var childLen = hasParentOnly[0].childNodes.length;
								for(var i=0;i<childLen;i++){
									childNodeTag = hasParentOnly[0].childNodes[i];
									if(childNodeTag.nodeType === 3 || DTD[parentTag][childNodeTag.nodeName] !== 1){
										$(childNodeTag).wrap(defaultChild);
										if($(queryNode).closest(childNodeTag).length > 0){
											$(childNodeTag.parentNode).css(styleType,styleValue);
											oriOptArea.styleNode = defaultChild;
										}
									}
								}
							}
						}
						else{
							var defaultChild = dom.createElement(DTD[parentTag]['child']);
							var childLen = hasParentOnly[0].childNodes.length;
							for(var i=0;i<childLen;i++){
								childNodeTag = hasParentOnly[0].childNodes[i];
								if(childNodeTag.nodeType === 3 || DTD[parentTag][childNodeTag.nodeName] !== 1){
									$(childNodeTag).wrap(defaultChild);
									if($(queryNode).closest(childNodeTag).length > 0){
										$(childNodeTag.parentNode).css(styleType,styleValue);
										oriOptArea.styleNode = defaultChild;
									}
								}
							}
						}
					}else{
						E.utils.message('has no paragraph');
					}
				}
			}
		},
		_setParagraph : function(oriOptArea,styleType,styleValue,on_off){
			var startNode = this.mainRange.startContainer,
				endNode = this.mainRange.endContainer;
			var startBlock = {},endBlock = {};
			var startList = $(startNode).closest('ol,ul'),endList = $(endNode).closest('ol,ul');
			var on_off_array = on_off.split('_');
			var blockTag = [];
			for(var oneTag in DTD.$block){
				oneTag = oneTag.toLowerCase();
				if(DTD.$block[oneTag] === 1 && DTD.$listItem[oneTag] !== 1 && DTD.$list[oneTag] !== 1){
					blockTag.push(oneTag);
				}
			}
			blockTag = blockTag.join(',');
			if(startList.length > 0){
				startBlock = $(startNode).closest('li')[0];
				startList = startList[0];
			}else{
				startBlock = $(startNode).closest(blockTag)[0];
				startList = '';
			}
			if(endList.length > 0){
				endBlock =$(endNode).closest('li')[0];
				endList = endList[0];
			}else{
				endBlock =$(endNode).closest(blockTag)[0];
				endList = '';
			}
			var firstRange = this.document.createRange(),
				lastRange = firstRange.cloneRange();
			var cutRange = this.document.createRange();
			if($(oriOptArea.ancestor).closest(startBlock).length > 0){
				oriOptArea.ancestor = startBlock.parentNode;
			}
			if($(oriOptArea.ancestor).closest(endBlock).length > 0){
				oriOptArea.ancestor = endBlock.parentNode;
			}
			if($(oriOptArea.ancestor).closest(startList).length > 0){
				oriOptArea.ancestor = startList.parentNode;
			}
			if($(oriOptArea.ancestor).closest(endList).length > 0){
				oriOptArea.ancestor = endList.parentNode;
			}
			firstRange.selectNodeContents(oriOptArea.ancestor);
			firstRange.setEndBefore(startBlock);
			lastRange.selectNodeContents(oriOptArea.ancestor);
			lastRange.setStartAfter(endBlock);
			var lastCut = lastRange.extractContents();
			lastRange.insertNode(lastCut);
			var firstCut = firstRange.extractContents();
			firstRange.insertNode(firstCut);
			cutRange.setEnd(lastRange.startContainer,lastRange.startOffset);
			cutRange.setStart(firstRange.endContainer,firstRange.endOffset);
			var cutNodefrag = cutRange.extractContents();
			var queryNode = cutNodefrag.firstChild,queryNode2 = {};
			while(queryNode){
				queryNode2 = queryNode.nextSibling;
				var innerList = '';
				if(queryNode.nodeName !== 'UL' && queryNode.nodeName !== 'OL'){
					innerList = $(queryNode).find('ul,ol');
				}else{
					innerList = $(queryNode);
				}
				innerList.each(function(){
					var removeList = this;
					$(this).find('li').children().each(function(){
						removeList.parentNode.insertBefore(this,removeList);
					});
					$(this).remove();
				});
				queryNode = queryNode2;
			}
			cutRange.insertNode(cutNodefrag);
			if(on_off_array[0] === 'on'){
				var newList = this.document.createElement(styleType);
				newList.style['list-style-type'] = styleValue;
				var ListitemTpl = this.document.createElement('li');
				cutRange.surroundContents(newList);
				$(newList).children().each(function(){
					$(this).wrap(ListitemTpl.cloneNode());
				});
			}
			E.curEditor.baseFilter.excute('afterList');
			this.mainRange.setStart(oriOptArea.firstNode,oriOptArea.firstOffset);
			this.mainRange.setEnd(oriOptArea.lastNode,oriOptArea.lastOffset);
			this.mainSelection.removeAllRanges();
			this.mainSelection.addRange( this.mainRange );
		},
		judgeValue : function(styleType,styleValue){
			var startNode = this.mainRange.startContainer,
				endNode = this.mainRange.endContainer;
			var on_off_array = [];
			if($(startNode).closest(styleType).length > 0){
				if($(startNode).closest(styleType).css('list-style-type') === styleValue){
					on_off_array[0] = 'off';
				}else{
					on_off_array[0] = 'on';
				}
			}else{
				on_off_array[0] = 'on';
			}
			if($(endNode).closest(styleType).length > 0){
				if($(endNode).closest(styleType).css('list-style-type') === styleValue){
					on_off_array[1] = 'off';
				}else{
					on_off_array[1] = 'on';
				}
			}else{
				on_off_array[1] = 'on';
			}
			return on_off_array.join('_');
		}
	};
	E.coreCommand.editParagraph = paragraph;
})(window.jQuery.jQEditor,window.jQuery);
(function(E,$){
	var _win,_dom;
	/**
	* @description 修改文字样式入口，每次修改生成一个新的对象
	* @param {string} cmd 修改命令
	* @param {string} value 修改参数
	* @return {boolean} 是否修改成功
	*/
	var text = function(cmd,value){
		var textObj = new Text();
		var selRangeObj = textObj.init(_win,_dom);
		textObj.mainRange = selRangeObj.rangeSet[0];
		if(!value || cmd === 'text-decoration'){
			value = textObj.judgeValue(cmd,value);
		}
		for(var i=0;i<selRangeObj.len;i++){
			textObj.mainRange = selRangeObj.rangeSet[i];
			var result = textObj.changeText(cmd,value);
		}
		E.curEditor.baseFilter.excute('afterTextPre');
		E.curEditor.baseFilter.excute('afterText');
		return result;
	};
	/**
	* 修改文字样式对象构造函数
	* @constructor
	*/
	function Text(){
		_win = E.curEditor.win;
		_dom = E.curEditor.dom;
	}
	Text.prototype = {
		mainRange : {},
		mainSelection : {},
		document : {},
		win : {},
		/**
		* @description 修改文字样式对象初始化
		* @param {object} win 修改执行的window对象
		* @param {object} dom 修改执行的document对象
		*/
		init : function(win,dom){
			var rangeObj = {len:0,rangeSet:[]};
			this.spaceText = E.IE6 ? '\ufeff' : '\u200B';
            this.win = win;
			this.document = dom;
			var mainRange = dom.createRange();
			this.mainSelection = win.getSelection();
			/*表格选中情况区分多个带改变范围*/
			var selectedCell = $(E.curEditor.dom).find('.'+ E.curEditor.config.selectCellClass);
			var selectedTable = $(E.curEditor.dom).find('.'+ E.curEditor.config.selectTableClass);
			if(selectedTable.length !== 0){
				rangeObj.len = selectedTable.length;
				for(var i=0;i<selectedTable.length;i++){
					mainRange.selectNodeContents(selectedTable[i]);
					rangeObj.rangeSet[i] = mainRange.cloneRange();
				}
			}else if(selectedCell.length !== 0){
				rangeObj.len = selectedCell.length;
				for(var i=0;i<selectedCell.length;i++){
					mainRange.selectNodeContents(selectedCell[i]);
					rangeObj.rangeSet[i] = mainRange.cloneRange();
				}
			}else{
				if(this.mainSelection.type === 'None'){
					rangeObj.len = 0;
				}else{
					rangeObj.len = 1;
					rangeObj.rangeSet[0] = this.mainSelection.getRangeAt(0);
				}
			}

			return rangeObj;
		},
		/**
		* @description 执行文本修改操作
		* @param {string} styleType 待修改的样式
		* @param {string} styleValue 修改的参数值
		*/
		changeText : function(styleType,styleValue){
			if(!styleValue || (styleType === 'text-decoration' && styleValue !== 'none')){
				styleValue = this.judgeValue(styleType,styleValue);
			}
			if(this.mainRange.collapsed){
				//设置样式
				this.setChange(this.mainRange,styleType,styleValue);
			}else{
				//修改样式
                this.excuteChange(this.mainRange,styleType,styleValue);
			}
		},
		/**
		* @description 根据参数分发修改操作
		* @param {object.<range>} setRange 待修改的范围
		* @param {string} styleType 待修改的样式
		* @param {string} styleValue 修改的参数值
		*/
		setChange : function(setRange,styleType,styleValue){
			if(styleValue !== "_on" && styleValue !== "_off"){
				//新增span样式
				this._setSpan(setRange,styleType,styleValue);
            }else if(styleValue === "_on"){
				//开启标签样式
				this._setTag(setRange,styleType); 
            }else{
				//关闭标签样式
                this._unsetTag(setRange,styleType);
            }
            var span = this.document.createElement("span");
		},
		/**
		* @description 执行修改
		* @param {object.<range>} setRange 待修改的范围
		* @param {string} styleType 待修改的样式
		* @param {string} styleValue 修改的参数值
		*/
		excuteChange : function(excuteRange,styleType,styleValue){
            var changeType = 'style';
			if(styleType === 'wordcase'){
				changeType = 'wordcase';
			}else if(styleValue === "_on"){
                changeType = 'tag_on';
            }else if(styleValue === "_off"){
				changeType = 'tag_off';
            }
			var comStartRange = excuteRange.cloneRange();
			comStartRange.collapse(true);
			var comEndRange = excuteRange.cloneRange();
			comEndRange.collapse(false);
            var commonAncestor = excuteRange.commonAncestorContainer;
			var oriOptArea = {
                ancestor : commonAncestor,
				firstNode : excuteRange.startContainer,
				firstOffset : excuteRange.startOffset,
				lastNode : excuteRange.endContainer,
				lastOffset : excuteRange.endOffset
			};
			var startRange = '',endRange = '',tmpEndRange = '',midRange = '';
			if(oriOptArea.firstNode !== oriOptArea.lastNode || oriOptArea.firstNode.nodeType !== 3){
				//线性遍历公共父节点
				var ancestorList = {};
				if(navigator.userAgent.indexOf("MSIE") <= 0){
					ancestorList = this.document.createNodeIterator(commonAncestor,NodeFilter.SHOW_TEXT);
				}else{
					ancestorList = this.document.createNodeIterator(commonAncestor,3);
				}
				var queryNode = ancestorList.nextNode();
				var queryNode2 = {};
				var startOpt = 0,endOpt = 1,startEmpty = 0;
				while(queryNode){
					//指向下一个节点，因为可能会对当前节点做修改
					queryNode2 = ancestorList.nextNode();
					if(startOpt === 0){
						var comRange = this.document.createRange();
						comRange.selectNode(queryNode);
						var inStart = comRange.compareBoundaryPoints(comRange.START_TO_START,comStartRange);
					}
					if(endOpt === 1){
						if(queryNode2){
							var comRange2 = this.document.createRange();
							comRange2.selectNode(queryNode2);
							var	inEnd = comRange2.compareBoundaryPoints(comRange2.START_TO_START,comEndRange);
						}else{
							var	inEnd = -1;
						}
					}
					var startCome = inStart > -1 && startOpt === 0;
					var	endCome = inEnd > -1 && startOpt === 1 && endOpt === 1;
					//修改尾部被截断的节点
					if(queryNode === oriOptArea.lastNode || endCome){
                        if(changeType === 'style'){
                            endRange = this._addSpan(queryNode,oriOptArea,styleType,styleValue,'last');
                        }else if(changeType === 'wordcase'){
	                        endRange = this._wordCase(queryNode,oriOptArea,styleType,styleValue,'last');
                        }else if(changeType === 'tag_on'){
                            endRange = this._addTag(queryNode,oriOptArea,styleType,'last','on');
                        }else{
							endRange = this._addTag(queryNode,oriOptArea,styleType,'last','off');
						}
						if(!endRange){
							endRange = tmpEndRange;
						}else{
							if(!startRange){
								startRange = endRange;
							}
						}
						endOpt = 0;
						this.mainRange.setStart(startRange.startContainer,startRange.startOffset);
						this.mainRange.setEnd(endRange.endContainer,endRange.endOffset);
						this.mainSelection.removeAllRanges();
						this.mainSelection.addRange( this.mainRange );
						break;
					}
					//修改中间完整节点
					if(startOpt && endOpt){
                        if(changeType === 'style'){
                            midRange = this._addSpan(queryNode,oriOptArea,styleType,styleValue,'mid');
                        }else if(changeType === 'wordcase'){
	                        midRange = this._wordCase(queryNode,oriOptArea,styleType,styleValue,'mid');
                        }else if(changeType === 'tag_on'){
                            midRange = this._addTag(queryNode,oriOptArea,styleType,'mid','on');
                        }else{
							midRange = this._addTag(queryNode,oriOptArea,styleType,'mid','off');
						}
						if(midRange){
							tmpEndRange = midRange;
							if(!startRange){
								startRange = midRange;
							}
						}
					}
					//修改头部被截断的节点
					if( !startOpt && (queryNode === oriOptArea.firstNode || startCome) ){
                        if(changeType === 'style'){
                            startRange = this._addSpan(queryNode,oriOptArea,styleType,styleValue,'first');
						}else if(changeType === 'wordcase'){
	                        startRange = this._wordCase(queryNode,oriOptArea,styleType,styleValue,'first');
                        }else if(changeType === 'tag_on'){
                            startRange = this._addTag(queryNode,oriOptArea,styleType,'first','on');
                        }else{
							startRange = this._addTag(queryNode,oriOptArea,styleType,'first','off');
						}
                        startOpt = 1;
						if(startRange && queryNode.nodeType !== 3){
							startEmpty = 1;
						}
					}
					//指向下一个要修改的节点
					queryNode = queryNode2;
				}
			}else{
				//选区在同一个节点上，截断选区前后，修改选区
                if(changeType === 'style'){
					startRange = this._addSpan(oriOptArea.firstNode,oriOptArea,styleType,styleValue,'cut');
                }else if(changeType === 'wordcase'){
	                startRange = this._wordCase(oriOptArea.firstNode,oriOptArea,styleType,styleValue,'cut');
                }else if(changeType === 'tag_on'){
                    startRange = this._addTag(oriOptArea.firstNode,oriOptArea,styleType,'cut','on');    
                }else{
					startRange = this._addTag(oriOptArea.firstNode,oriOptArea,styleType,'cut','off');
				}
				this.mainRange = startRange;
				this.mainSelection.removeAllRanges();
                this.mainSelection.addRange( this.mainRange );
			}
		},
		/**
		* @description 添加span标签
		* @param {object.<node>} queryNode 待修改的单个节点
		* @param {object} oriOptArea 待修改的原始范围信息
		* @param {string} styleType 待修改的样式
		* @param {string} styleValue 修改的参数值
		* @param {string} position 待修改的节点位置
		*/
		_addSpan : function(queryNode,oriOptArea,styleType,styleValue,position){
			var tmpSpan = this.document.createElement("span");
			if(queryNode.nodeType === 3 && /\S/.test(queryNode.nodeValue)){//Text节点
				var tmpRange = this.document.createRange();
				tmpRange.selectNode(queryNode);
				var lastRange = tmpRange.cloneRange();
				var firstRange = tmpRange.cloneRange();
				//设置截断的尾部范围
				if(position === 'last' || position === 'cut'){
					tmpRange.setEnd(queryNode,oriOptArea.lastOffset);
					lastRange.setEndAfter(queryNode.parentNode);
					lastRange.setStart(queryNode,oriOptArea.lastOffset);
				}
				//设置截断的头部范围
				if(position === 'first' || position === 'cut'){
					tmpRange.setStart(queryNode,oriOptArea.firstOffset);
					firstRange.setStartBefore(queryNode.parentNode);
					firstRange.setEnd(queryNode,oriOptArea.firstOffset);
				}
				if(queryNode.parentNode.tagName === 'SPAN'){
					var lastCut = '',firstCut = '';
					if(position === 'cut'){
						//截断头尾，中间修改
						lastCut = lastRange.extractContents();
						lastRange.insertNode(lastCut);
						firstCut = firstRange.extractContents();
						firstRange.insertNode(firstCut);
						this.setStyleType(styleType,styleValue,queryNode.parentNode);
						tmpRange.selectNodeContents(queryNode);
					}else{
						//截断尾
						if(position === 'last'){
							lastCut = lastRange.extractContents();
							lastRange.insertNode(lastCut);
						}
						//截断头
						if(position === 'first'){
							firstCut = firstRange.extractContents();
							firstRange.insertNode(firstCut);
						}
						if(queryNode.parentNode.firstChild !== queryNode.parentNode.lastChild){
							var endCut = '',startCut = '';
							if(position === 'first'){
								tmpRange.setStartBefore(queryNode.parentNode);
								tmpRange.setEndAfter(queryNode);
								startCut = tmpRange.extractContents();
								queryNode = startCut.firstChild.firstChild;
								tmpRange.insertNode(startCut);
							}else if(position === 'last'){
								tmpRange.setEndAfter(queryNode.parentNode);
								tmpRange.setStartBefore(queryNode);
								endCut = tmpRange.extractContents();
								queryNode = endCut.firstChild.firstChild;
								tmpRange.insertNode(endCut);
							}else if(position === 'mid'){
								tmpRange.setStartBefore(queryNode.parentNode);
								tmpRange.setEndAfter(queryNode);
								startCut = tmpRange.extractContents();
								tmpRange.insertNode(startCut);
								tmpRange.setStartBefore(queryNode);
								endCut = tmpRange.extractContents();
								queryNode = endCut.firstChild.firstChild;
								tmpRange.insertNode(endCut);
							}
						}
						/**包裹span标签
						if(queryNode.parentNode === this.mainRange.commonAncestorContainer){
							tmpRange.selectNode(queryNode);
							tmpRange.surroundContents(tmpSpan);
						}
						*/
						this.setStyleType(styleType,styleValue,queryNode.parentNode);
						tmpRange.selectNodeContents(queryNode);
					}
				}else{
					//直接包裹span标签
					this.setStyleType(styleType,styleValue,tmpSpan);
					tmpRange.surroundContents(tmpSpan);
				}
				return tmpRange;
			}
		},
		/**
		 * @description 大小写转化
		 * @param {object.<node>} queryNode 待修改的单个节点
		 * @param {object} oriOptArea 待修改的原始范围信息
		 * @param {string} styleType 待修改的样式
		 * @param {string} styleValue 修改的参数值
		 * @param {string} position 待修改的节点位置
		 */
		_wordCase : function(queryNode,oriOptArea,styleType,styleValue,position){
			if(queryNode.nodeType === 3 && /\S/.test(queryNode.nodeValue)){//Text节点
				var tmpRange = this.document.createRange();
				tmpRange.selectNode(queryNode);
				//设置截断的尾部范围
				if(position === 'last' || position === 'cut'){
					tmpRange.setEnd(queryNode,oriOptArea.lastOffset);
				}
				//设置截断的头部范围
				if(position === 'first' || position === 'cut'){
					tmpRange.setStart(queryNode,oriOptArea.firstOffset);
				}
				var tmpTextFrag = tmpRange.extractContents();
				var wordText = tmpTextFrag.firstChild.nodeValue;
				var newText =(styleValue === 'lower' ? wordText.toLowerCase() : wordText.toUpperCase());
				tmpTextFrag.firstChild.nodeValue = newText;
				tmpRange.insertNode(tmpTextFrag);
				return tmpRange;
			}
		},
		/**
		* @description 添加（或取消）其他样式标签
		* @param {object.<node>} queryNode 待修改的单个节点
		* @param {object} oriOptArea 待修改的原始范围信息
		* @param {string} styleType 待修改的样式
		* @param {string} position 待修改的节点位置
		* @param {string} on_off 添加标签还是取消标签
		*/
		_addTag : function(queryNode,oriOptArea,styleType,position,on_off){
			var tmpTag = this.document.createElement(styleType);
			if(queryNode.nodeType === 3 && /\S/.test(queryNode.nodeValue)){//Text节点
				var tmpRange = this.document.createRange();
				tmpRange.selectNode(queryNode);
				var cutFirstRange = tmpRange.cloneRange();
				var cutLastRange = tmpRange.cloneRange();
				//设置头部截断范围
				if(position === 'first' || position === 'cut'){
					tmpRange.setStart(queryNode,oriOptArea.firstOffset);
					cutFirstRange.setStartBefore(queryNode);
					cutFirstRange.setEnd(queryNode,oriOptArea.firstOffset);
				}
				//设置尾部截断范围
				if(position === 'last' || position === 'cut'){
					tmpRange.setEnd(queryNode,oriOptArea.lastOffset);
					cutLastRange.setEndAfter(queryNode);
					cutLastRange.setStart(queryNode,oriOptArea.lastOffset);
				}
				//遍历父标签，直到不能被包裹的标签终止
				while(DTD[styleType][queryNode.parentNode.tagName] === 1 && DTD.$block[queryNode.parentNode.tagName] !== 1){
					if(queryNode.parentNode.firstChild !== queryNode.parentNode.lastChild){
                        //父节点不再是紧贴文本节点的标签了
						break;
                    }else{
						//设置头部截断范围，修改区起始范围
						if(position === 'first' || position === 'mid' || position === 'cut'){
							tmpRange.setEndAfter(queryNode.parentNode);
							cutFirstRange.setStartBefore(queryNode.parentNode);
						}
						//设置尾部截断范围，修改区终止范围
						if(position === 'last' || position === 'mid' || position === 'cut'){
							tmpRange.setStartBefore(queryNode.parentNode);
							cutLastRange.setEndAfter(queryNode.parentNode);
						}
                        queryNode = queryNode.parentNode;  
                    }
                }
				//已经被需要的标签包裹
                if(queryNode.parentNode.tagName === styleType.toUpperCase()){
                    if(on_off === 'on'){
						return tmpRange;
					}else{
						var canDel = true;
					}
                }
				//没有被需要的标签包裹
				else{
					if(on_off === 'off'){
						return tmpRange;
					}
				}
				var cutLastTag = '',cutFirstTag = '';
				//尾部截断，设置修改区终止范围
				if(position === 'cut' || position === 'last'){
					cutLastTag = cutLastRange.extractContents();
					cutLastRange.insertNode(cutLastTag);
					tmpRange.setEnd(cutLastRange.startContainer,cutLastRange.startOffset);
				}
				//头部截断，设置修改区起始范围
				if(position === 'cut' || position === 'first'){
					cutFirstTag = cutFirstRange.extractContents();
					cutFirstRange.insertNode(cutFirstTag);
					tmpRange.setStart(cutFirstRange.endContainer,cutFirstRange.endOffset);
				}
				//修改区节点的父标签与修改标签不能共存
                if(DTD[styleType][queryNode.parentNode.tagName] === 2 || canDel === true){
                    var upNode = queryNode.parentNode;
					//截断修改区域，保存
					var cutTag = tmpRange.extractContents();
					//尾部截断
					if(position === 'cut' || position === 'last'){
						cutLastRange.setEndAfter(upNode);
						cutLastTag = cutLastRange.extractContents();
						cutLastRange.insertNode(cutLastTag);
						cutLastRange.collapse(true);
						tmpRange = cutLastRange;
					}
					//头部截断
					if(position === 'cut' || position === 'first' || position === 'mid'){
						cutFirstRange.setEnd(tmpRange.startContainer,tmpRange.startOffset);
						cutFirstRange.setStartBefore(upNode);
						cutFirstTag = cutFirstRange.extractContents();
						cutFirstRange.insertNode(cutFirstTag);
						cutFirstRange.collapse(false);
						tmpRange = cutFirstRange;
					}
					
                    tmpRange.insertNode(cutTag);
					if(canDel !== true){
						tmpRange.surroundContents(tmpTag);
					}
                }else{
					//直接包裹需要标签
					if(position === 'cut'){
						tmpRange.setStart(cutFirstRange.endContainer,cutFirstRange.endOffset);
						tmpRange.setEnd(cutLastRange.startContainer,cutLastRange.startOffset);
					}
                    tmpRange.surroundContents(tmpTag);
                }
				return tmpRange;
			}
		},
		/**
		* @description 设置其他样式标签
		* @param {object.<range>} queryRange 待修改的范围
		* @param {string} styleType 待修改的样式
		*/
        _setTag : function(queryRange,styleType){
            var queryNode = queryRange.startContainer;
            var tag = this.document.createElement(styleType);
            if(queryNode.nodeType === 3 && /\S/.test(queryNode.nodeValue)){//Text节点
                //创建空节点
				var selText = this.document.createTextNode(this.spaceText);
                queryRange.insertNode(selText);
                queryNode = selText;
                var tmpRange = queryRange.cloneRange();
				tmpRange.setStartBefore(selText);
				tmpRange.setEndAfter(selText);
				var tmpTag = tag.cloneNode();
				var tagRange = this.document.createRange(tmpTag);
				tagRange.selectNodeContents(tmpTag);
				//设置头尾截断范围
				var cutFirstRange = tmpRange.cloneRange();
				var cutLastRange = tmpRange.cloneRange();
				cutFirstRange.setStartBefore(queryNode);
				cutFirstRange.setEndBefore(selText);
                cutLastRange.setEndAfter(queryNode);
                cutLastRange.setStartAfter(selText);
				//遍历父节点，直到不能被包裹的节点
				while(DTD[styleType][queryNode.parentNode.tagName] === 1 && DTD.$block[queryNode.parentNode.tagName] !== 1){
                    if(queryNode.parentNode.firstChild !== queryNode.parentNode.lastChild){
                        break;
                    }
                    else{
                        cutFirstRange.setStartBefore(queryNode.parentNode);
                        cutLastRange.setEndAfter(queryNode.parentNode);
                        queryNode = queryNode.parentNode;  
                    }
                }
                if(queryNode.parentNode.tagName === styleType.toUpperCase()){
                    return;
                }
				//截断头尾
				var cutLastTag = cutLastRange.extractContents();
				cutLastRange.insertNode(cutLastTag);
                var cutFirstTag = cutFirstRange.extractContents();
                cutFirstRange.insertNode(cutFirstTag);
				//如果父标签不能与设置标签共存
                if(DTD[styleType][queryNode.parentNode.tagName] === 2){
                    var upNode = queryNode.parentNode;
					//截取空节点
                    tmpRange.setStart(cutFirstRange.endContainer,cutFirstRange.endOffset);
                    tmpRange.setEnd(cutLastRange.startContainer,cutLastRange.startOffset);
                    var cutTag = tmpRange.extractContents();
					//截断头尾
					cutLastRange.setEndAfter(upNode);
                    cutLastTag = cutLastRange.extractContents();
                    cutLastRange.insertNode(cutLastTag);
                    cutFirstRange.setStartBefore(upNode);
                    cutFirstTag = cutFirstRange.extractContents();
                    cutFirstRange.insertNode(cutFirstTag);
					//删除不能共存的节点，插入截取的空节点，包裹设置标签
                    tmpRange.setStart(cutFirstRange.endContainer,cutFirstRange.endOffset);
                    tmpRange.setEnd(cutLastRange.startContainer,cutLastRange.startOffset);
                    tmpRange.deleteContents();
                    tmpRange.insertNode(cutTag);
                    tmpRange.surroundContents(tag);
                }else{
					//直接包裹设置标签
                    tmpRange.setStart(cutFirstRange.endContainer,cutFirstRange.endOffset);
                    tmpRange.setEnd(cutLastRange.startContainer,cutLastRange.startOffset);
                    tmpRange.surroundContents(tmpTag);
                }
                //设置光标在刚刚建立的空节点中
                this.mainSelection.removeAllRanges();
                this.mainRange.setStart(selText,0);
                this.mainRange.setEnd(selText,1);
                this.mainSelection.addRange( this.mainRange );
			}
        },
		/**
		* @description 设置（或取消设置）span标签，带style样式
		* @param {object.<range>} queryRange 待修改的范围
		* @param {string} styleType 待修改的样式
		* @param {string} styleValue 待修改的样式值
		*/
        _setSpan : function(queryRange,styleType,styleValue){
            var tmpSpan = this.document.createElement("span");
            var queryNode = queryRange.startContainer;
			if(queryNode.nodeType === 3 && /\S/.test(queryNode.nodeValue)){//Text节点
				var tmpRange = queryRange.cloneRange();
				if(queryNode.parentNode.tagName === 'SPAN'){
					var styleString = styleType + ': ' + styleValue;
					var styleExist = queryNode.parentNode.style.cssText.search(styleString);
					if(styleExist !== -1){
						return;
					}else{
						//截断父span
                        tmpRange.setStartBefore(queryNode.parentNode);
						var cutSpan = tmpRange.extractContents();
						tmpRange.insertNode(cutSpan);
						tmpRange.collapse(false);
                    }
				}
				//建立空节点，并插入到截断位置，设置光标位置在空节点中
				var selRange = this.document.createRange();
				selRange.selectNodeContents(tmpSpan);
				var selText = this.document.createTextNode(this.spaceText);
				selRange.insertNode(selText);
				this.setStyleType(styleType,styleValue,tmpSpan);
				tmpRange.insertNode(tmpSpan);
				this.mainSelection.removeAllRanges();
				this.mainRange.setStart(selText,1);
				this.mainSelection.addRange(this.mainRange);

			}
        },
		/**
		* @description 取消设置其他样式标签
		* @param {object.<range>} queryRange 待修改的范围
		* @param {string} styleType 待修改的样式
		*/
        _unsetTag : function(queryRange,styleType){
            var firstRange = queryRange.cloneRange();
            var lastRange = queryRange.cloneRange();
            var selRange = queryRange.cloneRange();
            var tmpRange = queryRange.cloneRange();
			//建立空节点
            var selText = this.document.createTextNode(this.spaceText);
            selRange.insertNode(selText);
            firstRange.setEndBefore(selText);
            lastRange.setStartAfter(selText);
            var queryNode = queryRange.startContainer;
			//找到取消设置的标签节点
            while(queryNode.parentNode && styleType.toUpperCase() !== queryNode.parentNode.tagName ){
				queryNode = queryNode.parentNode;
            }
			//截断头尾，插入空节点
            if(styleType.toUpperCase() === queryNode.parentNode.tagName){
				var upNode = queryNode.parentNode;
				var cutLastTag = '',cutFirstTag = '';
					//截取空节点
                    selRange.setStart(firstRange.endContainer,firstRange.endOffset);
                    selRange.setEnd(lastRange.startContainer,lastRange.startOffset);
                    var cutTag = selRange.extractContents();
					//截断头尾
					lastRange.setEndAfter(upNode);
                    cutLastTag = lastRange.extractContents();
                    lastRange.insertNode(cutLastTag);
                    firstRange.setStartBefore(upNode);
                    cutFirstTag = firstRange.extractContents();
                    firstRange.insertNode(cutFirstTag);
					//删除不能共存的节点，插入截取的空节点，包裹设置标签
                    selRange.setStart(firstRange.endContainer,firstRange.endOffset);
                    selRange.setEnd(lastRange.startContainer,lastRange.startOffset);
                    selRange.deleteContents();
                    selRange.insertNode(cutTag);
				/*	
                firstRange.setStartBefore(queryNode);
                lastRange.setEndAfter(queryNode);
                var tmpLast = lastRange.extractContents();
                lastRange.insertNode(tmpLast);
				var tmpFirst = firstRange.extractContents();
                firstRange.insertNode(tmpFirst);
				selRange.setStart(firstRange.endContainer,firstRange.endOffset);
                selRange.setEnd(lastRange.startContainer,lastRange.startOffset);
                var cutTag = selRange.extractContents();
				lastRange.setEndAfter(upNode);
                tmpLast = lastRange.extractContents();
                lastRange.insertNode(tmpLast);
				firstRange.setStartBefore(upNode);
                tmpFirst = firstRange.extractContents();
                firstRange.insertNode(tmpFirst);
				selRange.selectNode(selRange.commonAncestorContainer);
				selRange.deleteContents();
				selRange.insertNode(cutTag);*/
            }
			//将光标设置在空节点中
            this.mainSelection.removeAllRanges();
            this.mainRange.setStart(selText,0);
            this.mainRange.setEnd(selText,1);
            this.mainSelection.addRange( this.mainRange );
        },
		/**
		* @description 设置节点的style属性
		* @param {string} styleType 待修改的样式
		* @param {string} styleValue 待修改的样式值
		* @param {object.<node>} optNode 待修改的节点
		*/
		setStyleType : function(styleType,styleValue,optNode){
			optNode.style.cssText += ';'+styleType + ': ' + styleValue+';';
		},
		/**
		* @description 判断该选中区域是应该添加标签样式，还是取消标签样式
		* @param {string} styleType 待修改的样式
		* @param {string} styleValue 待修改的样式值
		* @return {string} '_on'为应该添加标签，'_off'为应该取消标签
		*/
		judgeValue : function(styleType,styleValue){
			var on_off = "_on";
			var tmpElement = this.mainRange.startContainer;
			var isTextEnd = tmpElement.nodeType !== 3 || tmpElement.nodeValue.length <= this.mainRange.startOffset;
			if(!this.mainRange.collapsed && isTextEnd){
				var ancestorList = {};
				var commonAncestor = this.mainRange.commonAncestorContainer;
				if(navigator.userAgent.indexOf("MSIE") <= 0){
					ancestorList = this.document.createNodeIterator(commonAncestor,NodeFilter.SHOW_ALL);
				}else{
					ancestorList = this.document.createNodeIterator(commonAncestor);
				}
				var hasConRange = this.document.createRange();
				var judgeNode = ancestorList.nextNode();
				var isFind = false;
				while(judgeNode) {
					if(judgeNode === tmpElement || isFind === true)  {
						isFind = true;
						if(judgeNode.nodeType === 3 && judgeNode.nodeValue.length > 0){
							hasConRange.selectNodeContents(judgeNode);
							if(this.mainRange.compareBoundaryPoints(hasConRange.START_TO_START,hasConRange) < 1){
								tmpElement = judgeNode;
								break;
							}
						}
					}
					judgeNode = ancestorList.nextNode();
				}
				hasConRange.detach();
			}
			if(typeof styleValue === 'string'){
				on_off = styleValue;
				if(E.curEditor.dom.queryCommandState('underline') === true){
					if(styleValue === 'underline'){
						on_off = "none";
					}
				}
				if(E.curEditor.dom.queryCommandState('strikethrough') === true){
					if(styleValue === 'line-through'){
						on_off = "none";
					}
				}
			}else{
				while(tmpElement && tmpElement.nodeName !== 'BODY'){
					if( tmpElement.nodeType !== 3 && (DTD[tmpElement.nodeName][styleType] === 3 || styleType === tmpElement.nodeName.toLowerCase() ) ){
						on_off = "_off";

						break;
					}
					tmpElement = tmpElement.parentNode;
				}
			}
			return on_off;
		}
	};

	E.coreCommand.editText = text;
})(window.jQuery.jQEditor,window.jQuery);
(function(E){
	/**
	* 单个事件构造函数
	* @constructor
	* @param {object} attr 事件参数
	**/
	function CustomEvent(attr){
		this.name = attr.name;
		this.type = attr.type;
		this.area = attr.area?attr.area:'custom';
		this.fn = attr.fn;
		this.isEnable = attr.isEnable?attr.isEnable:true;
	}
	/**
	* 事件核心构造函数
	* @constructor
	**/
	function Event(){
		// 编辑区域事件对象
		this.editAreaEvents = {};
		// 自定义事件对象
		this.customEvents = {};
		// 自定义事件列表
		this.customEventList = {};
		this.delegate();
	}

	Event.allList = {};

	Event.prototype = {
		/**
		* @description
		* 添加并初始化一个事件
		* 如果自定义事件列表中没有则向列表中添加，
		* 如果有则将该事件绑定到相应的类型中，如果没有该类型事件，则创建
		* @param {object} attr 事件配置参数
		**/
		addEvent: function(attr) {
			var oneEvent = {};
			if(typeof this.customEventList[attr.name] === 'undefined'){
				oneEvent = new CustomEvent(attr);
			}else{
				oneEvent = this.customEventList[attr.name];
			}
			var len = attr.type.length;
			for(var i=0;i<len;i++){
				if(typeof this.customEvents[attr.type[i]] === 'undefined'){
					this.customEvents[attr.type[i]] = {};
				}
				this.customEvents[attr.type[i]][oneEvent.name] = oneEvent;
			}
			this.customEventList[oneEvent.name] = oneEvent;
		},
		/**
		* @description
		* 启用事件
		* @param {string} name 事件名称
		**/
		bindEvent: function(name) {
			this.customEventList[name].isEnable = true;
		},
		/**
		* @description
		* 禁用事件
		* @param {string} name 事件名称
		**/
		unbindEvent: function(name) {
			this.customEventList[name].isEnable = true;
		},
		/**
		* @description
		* 执行某一类事件
		* @param {string} type 执行事件类型
		* @param {string | undefined} name 执行事件名称
		* @param {object | undefined} arg 执行事件参数
		**/
		triggerEvent : function(type,arg) {
			var exeType = this.customEvents[type];
			//var len = exeType.length;
			for(var name in exeType){
				if(exeType[name].isEnable !== false){
					exeType[name].fn(arg);
				}
			}
		},
		/**
		* @description
		* 移除事件类型
		* @param {string} type 事件类型

		removeEvent: function(type) {
			var listeners = this._listener[type];
			if (listeners instanceof Array) {
				if (typeof key === "function") {
					for (var i=0, length=listeners.length; i<length; i+=1){
						if (listeners[i] === listener){
							listeners.splice(i, 1);
							break;
						}
					}
				} else if (key instanceof Array) {
					for (var lis=0, lenkey = key.length; lis<lenkey; lis+=1) {
						this.removeEvent(type, key[lenkey]);
					}
				} else {
					delete this._listener[type];
				}
			}
			return this;
		},**/

		/**
		注册整个浏览器事件
		**/
		delegate : function(){

		}
		/*
		listenEditarea : function(curEditor,targetDom){
			this._listenEditClick(curEditor,targetDom);
		},
		_listenEditClick : function(curEditor,targetDom){
			var targetEditor = curEditor;
			$('body',targetDom).live('click',function(e){
				var tar = $(e.target);
				targetEditor.execCommand.excuteCommand('element','click');
				return false;
			});
		}*/
	};

	var coreEvent = new Event(E.config);

	/**
	* @description
	* 执行某一类型事件
	* @param {string} type 事件类型
	* @param {object | undefined} arg 执行参数
	**/
	E.trigger = function(type, arg) {
		var bool = true, exeType = coreEvent.customEvents[type];
		if( exeType ){
			for(var name in exeType){
				if(exeType[name] && exeType[name].isEnable !== false){
					try{
						if(arg && arg.targetEditor && arg.targetEditor.baseEvent){
							var config = arg.targetEditor.baseEvent.eventConfig;
							if(config[exeType[name]] !== false){
								if (false === exeType[name].fn(arg)){
									bool = false;
								}
							}
						}else{
							if (false === exeType[name].fn(arg)){
								bool = false;
							}
						}
					}catch(ex){
						E.error.writeError(type+'type-name'+name+' event error: '+ex.message,4,'event');
					}
				}
			}
		}
		return bool;
	};
	/**
	* 编辑器实例关联的事件基类
	* @constructor
	* @param {object} editor 编辑器实例
	**/
	function EditorEvent(editor){
		try{
			this.editWin = editor.win;
			this.editDom = editor.dom;
			this.Eid = editor.config.id;
			this.curEditor = editor;
			this.customEvents = {};
			this.editAreaEvents = {};
			this.blackList = editor.config.cEvent.blackList;
			this.eventConfig = {};
			E.listenEditarea(this.curEditor);
			E.listenEditareaExt(this.curEditor);
			this.refreshList();
		}catch(ex){
			E.error.writeError('editor event init error: '+ex.message,5,'event');
			E.utils.message(E.lang['initError'],'finish');
		}
	}

	EditorEvent.prototype = {
		/**
		* @description
		* 添加事件，将已知事件绑定到指定类型下面，涉及其他编辑器实例
		* @param {string} name 事件名称
		* @param {string} type 事件类型
		**/
		add : function(type,name){
			var attr = {
				name : name,
				type : type
			};
			coreEvent.addEvent(attr);
		},
		/**
		* @description
		* 查找事件
		* @param {string} name 事件名称
		* @param {string} type 事件类型
		* @return {number | boolean} 是否找到,找到返回索引，没找到返回false
		**/
		_findEvent : function(type,name){
			if(typeof this.customEvents[type] !== 'undefined'){
				var len = this.customEvents[type].length;
				for(var i=0;i<len;i++){
					if(name === this.customEvents[type][i]){
						return i;
					}
				}
			}
			return false;
		},
		/**
		* @description
		* 移除事件，涉及其他编辑器实例的事件
		* @param {string} name 事件名称
		* @param {string} type 事件类型
		**/
		remove : function(type,name){
			try{
				if(type === '*'){
					if(name === '*'){
						for(var tmpType in coreEvent.customEvents){
							coreEvent.customEvents[tmpType] = {};
						}
					}else{
						for(var tmpType in coreEvent.customEvents){
							coreEvent.customEvents[tmpType][name] = undefined;
						}
					}
				}else{
					if(name === '*'){
						coreEvent.customEvents[type] = {};
					}else{
						coreEvent.customEvents[type][name] = undefined;
					}
				}
			}catch(ex){
				E.error.writeError(type+' type - '+name+' remove error: '+ex.message,3,'event');
			}
		},
		/**
		* @description
		* 禁用事件，不涉及其他编辑器实例
		* @param {string} name 事件名称
		* @param {string} type 事件类型
		**/
		disable : function(type,name){
			try{
				var index = '';
				if(type === '*'){
					if(name === '*'){
						for(var tmpType in this.customEvents){
							this.customEvents[tmpType] = [];
						}
					}else{
						for(var tmpType in this.customEvents){
							index = this._findEvent(tmpType,name);
							if(index !== false){
								this.customEvents[tmpType].splice(index,1);
							}
						}
					}
				}else{
					if(name === '*'){
						this.customEvents[type] = [];
					}else{
						index = this._findEvent(type,name);
							if(index !== false){
								this.customEvents[type].splice(index,1);
							}
					}
				}
			}catch(ex){
				E.error.writeError(type+' type - '+name+' disable error：'+ex.message,3,'event');
			}
		},
		/**
		* @description
		* 启用事件，不涉及其他编辑器实例
		* '*'为全部，可以是全部类型下的某一个事件，也可以是某个类型下的全部事件
		* @param {string} name 事件名称
		* @param {string} type 事件类型
		**/
		enable : function(type,name){
			try{
				var index = '';
				if(type === '*'){
					if(name === '*'){
						for(var tmpType in coreEvent.customEvents){
							var len = coreEvent.customEvents[tmpType].length;
							for(var i=0;i<len;i++){
								index = this._findEvent(tmpType,coreEvent.customEvents[tmpType][i].name);
								if(index === false){
									this.customEvents[tmpType].push(coreEvent.customEvents[tmpType][i].name);
								}
							}
						}
					}else{
						if(typeof coreEvent.customEventList[name] !== 'undefined'){
							for(var tmpType in coreEvent.customEvents){
								index = this._findEvent(tmpType,name);
								if(index === false){
									this.customEvents[tmpType].push(name);
								}
							}
						}
					}
				}else{
					if(name === '*'){
						var len = coreEvent.customEvents[type].length;
						for(var i=0;i<len;i++){
							index = this._findEvent(type,coreEvent.customEvents[type][i].name);
							if(index === false){
								this.customEvents[type].push(coreEvent.customEvents[type][i].name);
							}
						}
					}else{
						index = this._findEvent(type,name);
						if(index === false){
							if(typeof coreEvent.customEventList[name] !== 'undefined'){
								this.customEvents[type].push(name);
							}
						}
					}
				}
			}catch(ex){
				E.error.writeError(type+' type - '+name+' enabel error '+ex.message,3,'event');
			}
		},
		/**
		* @description
		* 刷新事件，根据已有的事件，和配置文件
		* 将可用的事件添加到其中
		**/
		refreshList : function(){
			try{
				this.customEvents = {};
				this.eventConfig = {};
				for(var tmpType in coreEvent.customEvents){
					var typeList = coreEvent.customEvents[tmpType];
					if(typeof this.customEvents[tmpType] === 'undefined'){
						this.customEvents[tmpType] = [];
					}
					for(var tmpName in typeList){
						this.customEvents[tmpType].push(tmpName);
						this.eventConfig[tmpName] = true;
					}
				}
				var len = this.blackList.length;
				for(var i=0;i<len;i++){
					var black = this.blackList[i].split('.');
					this.disable(black[0],black[1]);
				}
			}catch(ex){
				E.error.writeError('event refresh error: '+ex.message,4,'event');
			}
		}

	};
	EditorEvent.ready = true;
	E.EditorEvent = EditorEvent;
	
	// 支持两种事件绑定方式
	E.addEvent = function( attr ){
		coreEvent.addEvent( attr );
	};
	
	E.bind = function(name, type, fn) {
		if ( typeof type === 'string' ) {
			type = [type];
		}
		
		coreEvent.addEvent( {
			name: name, type: type, fn:fn
		} );
	}
})(window.jQuery.jQEditor);
(function(E){
	/**
	* 过滤器基类
	* @constructor
	* @param {object} attr 过滤器配置参数
	**/
	function Filter(attr){
		this.name = attr.name;
		this.order = attr.order?attr.order:'third';
		this.type = attr.type?attr.type:['dom'];
		this.replace = attr.replace?attr.replace:function(){};
	}
	
	/**
	* 过滤器执行对象
	* 这样分类的目的是减少
	* key(过滤类型) => value(执行优先级对象 
	*					@type {object} key(优先级) => value(过滤器对象数组 
	*													@type {Array}) )
	* @type {object}
	**/
	Filter.exeList = {
		// 过滤器的类型（过滤字符串还是过滤节点）类型不能同时属于 dom 和 html
		/** 
		* 根据触发时机就应该可以区分过滤的类型，只有在编辑内容进出编辑区域的时候才会使用html类型的过滤
		* 对于既要使用 dom 类型，又要使用 html 类型过滤的，应当分成两个时机
		* 如在将一段html插入编辑器中，先执行 html 类型的beforePaste 再执行 dom 类型的 beforeInsert
		**/
		'dom' : {
			// 所有 dom 类型过滤器
			'dom' : {first:[],second:[],third:[],fourth:[],fifth:[]},
			// 以下类型属于触发时机，可以同时属于以下类型的多个，应属于 dom 类型
			'afterTextPre' : {first:[],second:[],third:[],fourth:[],fifth:[]},
			'afterText' : {first:[],second:[],third:[],fourth:[],fifth:[]},
			'afterList' : {first:[],second:[],third:[],fourth:[],fifth:[]},
			'beforeSubmit' : {first:[],second:[],third:[],fourth:[],fifth:[]},
			'beforeCmd' : {first:[],second:[],third:[],fourth:[],fifth:[]},
			'afterCmd' : {first:[],second:[],third:[],fourth:[],fifth:[]},
			'beforeInsert' : {first:[],second:[],third:[],fourth:[],fifth:[]},
			'afterInsert' : {first:[],second:[],third:[],fourth:[],fifth:[]}
		},
		'html' : {
			// 所有 html 类型过滤器
			'html' :{first:[],second:[],third:[],fourth:[],fifth:[]},
			// 以下类型属于触发时机，可以同时属于以下类型的多个，应属于 html 类型
			'beforePaste' : {first:[],second:[],third:[],fourth:[],fifth:[]}
		}
	};
	/**
	* 过滤器列表对象
	* key(过滤器名) => value(过滤器对象)
	* @type {object}
	**/
	Filter.list = {};
	/**
	* @description
	* 添加并初始化一个过滤器
	* @param {object} attr 插件配置对象
	**/
	E.addFilter = function(attr){
		try{
			var oneFilter = new Filter(attr);
			var len = oneFilter.type.length;
			
			for(var i=0;i<len;i++){
			
				if(oneFilter.type[i] === 'dom'){
					Filter.exeList['dom']['dom'][oneFilter.order].push(oneFilter);
					
				} else if ( Filter.exeList['dom'][oneFilter.type[i]] ){
				
					Filter.exeList['dom'][oneFilter.type[i]][oneFilter.order].push(oneFilter);
					Filter.exeList['dom']['dom'][oneFilter.order].push(oneFilter);
				}
				
				if(oneFilter.type[i] === 'html'){
					Filter.exeList['html']['html'][oneFilter.order].push(oneFilter);
					
				} else if ( Filter.exeList['html'][oneFilter.type[i]] ){
				
					Filter.exeList['html'][oneFilter.type[i]][oneFilter.order].push(oneFilter);
					Filter.exeList['html']['html'][oneFilter.order].push(oneFilter);
				}
			}
			Filter.list[oneFilter.name] = oneFilter;
			
		}catch(ex){
			E.error.writeError(attr.name+' filter add error: ' + ' '+ex.message,3,'filter');
		}
	};
	/**
	* @description
	* 动态加载一个过滤器
	* @param {object} 插件配置对象
	**/
	E.loadFilter = function(addr){
		E.load.loadOneFile(addr,function(){
			for(var Eid in E.editorList){
				E.editorList[Eid].baseFilter.refreshList();
			}
		});
	};
	Filter.prototype = {
		/**
		* @description
		* 过滤替换，会被重写
		* @override
		**/
		replace : function(){}
		
	};
	/**
	* 编辑器实例关联的过滤器基类
	* @constructor
	* @param {object} editor 编辑器实例
	**/
	function EditorFilter(editor){
		try{
			this.editWin = editor.win;
			this.editDom = editor.dom;
			this.Eid = editor.Eid;
			this.curEditor = editor;
			this.enableList = this.configFilter(editor.config);
			this.exeList = {};
			this.refreshList();
		}catch(ex){
			E.error.writeError('editor filter init error: '+ex.message,5,'filter');
			E.utils.message(E.lang['initError'],'finish');
		}
	}
	
	EditorFilter.prototype = {
		/**
		* @description
		* 按过滤顺序合并过滤器对象，并添加到 this.exeList 中
		**/
		refreshList : function(){
			try{
				for(var type in Filter.exeList['dom']){
					var empty = [];
					var first = Filter.exeList['dom'][type]['first'],
						second = Filter.exeList['dom'][type]['second'],
						third = Filter.exeList['dom'][type]['third'],
						fourth = Filter.exeList['dom'][type]['fourth'],
						fifth = Filter.exeList['dom'][type]['fifth'];
					this.exeList[type] = empty.concat(first,second,third,fourth,fifth);
				}
				for(var type in Filter.exeList['html']){
					var empty = [];
					var first = Filter.exeList['html'][type]['first'],
						second = Filter.exeList['html'][type]['second'],
						third = Filter.exeList['html'][type]['third'],
						fourth = Filter.exeList['html'][type]['fourth'],
						fifth = Filter.exeList['html'][type]['fifth'];
					this.exeList[type] = empty.concat(first,second,third,fourth,fifth);
				}
			}catch(ex){
				E.error.writeError('filter refresh error: '+ex.message,3,'filter');
			}
		},
		/**
		* @description
		* 根据白名单和黑名单为所有编辑器实例配置过滤器
		* @return {object} config 插件配置对象
		**/
		configFilter : function(config){
			var filterEnable = {};
			// 在白名单中出现的均为启用，在黑名单中出现的均为禁用
			// 在白名单黑名单中都出现的为启用，其余为过滤器中编写的默认情况
			var blackList = config.cFilter.blackList,
				whiteList = config.cFilter.whiteList;
			var blackLen = blackList.length,whiteLen = whiteList.length;
			for(var i=0;i<blackLen;i++){
				filterEnable[blackList[i]] = false;
			}
			for(var i=0;i<whiteLen;i++){
				filterEnable[whiteList[i]] = true;
			}
			return filterEnable;
		},
		/**
		* @description
		* 执行一组过滤器
		* @param {string} type 过滤类型
		* @param {object | string} arg 过滤内容参数
		* @return {void} 修改DOM无返回 | {object |string} 过滤后的内容
		**/
		excute : function(type,arg){
			var len = this.exeList[type].length;
			if(typeof arg === 'string'){
				var reStr = undefined;
				var backStr = arg;
				for(var i=0;i<len;i++){
					var exName = this.exeList[type][i].name;
					if(this.enableList[exName] !== false){
						try{
							reStr = this.exeList[type][i].replace(this.editWin,backStr);
							if(typeof reStr !== 'undefined'){
								backStr = reStr;
							}
						}catch(ex){
							E.error.writeError(type+' type-'+exName+' filter error '+ex.message,2,'filter');
						}
					}
				}
				return backStr;
			}else{
				if(typeof arg === 'undefined'){
					arg = this.editDom;
				}
				var backNode = arg;
				for(var i=0;i<len;i++){
					var exName = this.exeList[type][i].name;
					if(this.enableList[exName] !== false){
						try{
							this.exeList[type][i].replace(this.editWin,backNode);
						}catch(ex){
							E.error.writeError(type+' type-'+exName+' filter error '+ex.message,2,'filter');
						}
					}
				}
				return backNode;
			}
		},
		/**
		* @description
		* 执行单个过滤器
		* @param {string} name 过滤名称
		* @param {object | string} arg 过滤内容参数
		* @return {void} 修改DOM无返回 | {object |string} 过滤后的内容
		**/
		excuteOne : function(name,arg){
			if(Filter.list[name] && this.enableList[name] !== false){
				if(typeof arg === 'string'){
					var reStr = undefined;
					var backStr = arg;
					try{
						reStr = Filter.list[name].replace(this.editWin,backStr);
						if(typeof reStr !== 'undefined'){
							backStr = reStr;
						}
					}catch(ex){
						E.error.writeError(name+' filter error '+ex.message,2,'filter');
					}
					return backStr;
				}else{
					if(typeof arg === 'undefined'){
						arg = this.editDom;
					}
					try{
						var backNode = arg;
						Filter.list[name].replace(this.editWin,backNode);
					}catch(ex){
						E.error.writeError(name+' filter error '+ex.message,2,'filter');
					}
					return backNode;
				}
			}
		},
		/**
		* @description
		* 启用过滤器
		* @param {string} name 过滤器名
		**/
		enable : function(name){
			this.enableList[name] = true;
		},
		/**
		* @description
		* 禁用过滤器
		* @param {string} name 过滤器名
		**/
		disable : function(name){
			this.enableList[name] = false;
		}
	};
	EditorFilter.ready = true;
	E.EditorFilter = EditorFilter;
})(window.jQuery.jQEditor);
(function(E){
	// 不需要 scriptAddr，根据路径规则知道id即可拼出完整路径
	// 所有插件的列表，用于确定要加载的插件的位置和配置
	var cmdConfig = E.config.cCommand;
	var allList = {};
	for(var tmpCmd in cmdConfig.pluginCommand){
		var objCmd = cmdConfig.pluginCommand[tmpCmd];
		allList[objCmd.cmd] = {htmlCmd : tmpCmd,isEnable : true,scriptAddr : E.config.cBase.pluginDir+objCmd.cmd+'.plugin.js'};
	}
	/*
	var allList = {
		'forecolormenu' : {
			isEnable : true,
			scriptAddr : './core/plugin/forecolor.plugin.js'
		},
		...
	};*/

	/**
	* @description
	* 加载插件文件
	* @param {string} id 插件名称
	* @param {function} callback 回调函数
	**/
	E.loadPlugin = function(id,callback){
		var addr = allList[id].scriptAddr;
		if(typeof allList[id].click === 'undefined'){
			E.load.loadOneFile(addr,function(){callback();});
		}else{
			callback();
		}
	};
	/**
	* 插件基类
	* @constructor
	* @param {object} attr 插件配置参数
	**/
	function Plugin(attr){
		this.ui = '';
		
		if(attr){
			for(var one in attr){
				this[one] = attr[one];
			}
			var o = Plugin.allList[this.id];
			if( !o ) {
				alert('添加插件之后，还需要到command-conig.js进行注册喲');
			}
			o.title = E.getLang(this.id);
			o.isEnable = this.isEnable;
			this.htmlCmd = o.htmlCmd;
			for(var edit in E.editorList){
				if(typeof E.editorList[edit].pluginEnable[this.id] === 'undefined'){
					E.editorList[edit].pluginEnable[this.id] = this.isEnable;
				}
			}
			this.fill();
		}
	}
	Plugin.allList = allList;
	/**
	* @description
	* 为所有编辑器实例配置插件
	* 根据白名单和黑名单，且优先级更高
	* @param {object} config 插件配置对象
	* @return {object} 插件启用情况对象
	**/
	E.configPlugin = function(config){
		try{
			var pluginEnable = {};
			for(var one in Plugin.allList){
				if(Plugin.allList[one].isEnable === 'undefined'){
					pluginEnable[one] = Plugin.allList[one].isEnable;
				}else{
					pluginEnable[one] = true;
				}
			}
			// 在白名单中出现的均为启用，在黑名单中出现的均为禁用
			// 在白名单黑名单中都出现的为启用，其余为插件中编写的默认情况
			var blackList = config.cPlugin.blackList,
				whiteList = config.cPlugin.whiteList;
			var blackLen = blackList.length,whiteLen = whiteList.length;
			for(var i=0;i<blackLen;i++){
				pluginEnable[blackList[i]] = false;
			}
			for(var i=0;i<whiteLen;i++){
				pluginEnable[whiteList[i]] = true;
			}
			return pluginEnable;
		}catch(ex){
			E.error.writeError('plugin config error: '+ex.message,3,'plugin');
		}
	};
	Plugin.prototype = {
		/**
		* @description
		* 初始化插件
		**/
		initPlugin : function(){

		},
		/**
		* @description
		* 插件点击，被继承重写
		* 默认为打开相应的ui弹窗，或面板
		* @override
		**/
		click : function(){
			if(this.type === 'panel'){
				E.toolbar.togglePanel(this.htmlCmd);
			}else if(this.type === 'dialog' && this.showDialog){
				this.showDialog(E.curEditor);
			}
		},
		
		/**
		 * 获取插件相关的值，需重写
		 * @return null
		 */
		getData: function (editor) {
			return {};
		},
		
		/**
		 * 弹窗
		 * @return null
		 */
		showDialog: function(editor) {
			var self = this;
			
			//E.utils.loadDialog(self.id, E.config.cBase.uiDir+ self.id +'/', function(){
				E.dialog.open({
					id: self.ui,
					editor: editor.Eid,
					title: self.title,
					//content: E.utils.execUi(self.ui,'getHtml'),
					content: E.uiList[self.ui].getHtml(),
					
					ok: function() {
						if ( self.check() ) {
							E.dialog.revertSelection();
							E.command(self.ui);
						} else {
							return false;
						}
					},
					cancel: function(){
						E.dialog.close(self.ui);
					}
					
				// data对象的值，会根据key被自动赋值到弹窗上name=key的表单项里
				// 比如，data={content:'内容'}，则“内容”会被赋值到name="content"的表单项
				}, self.getData(editor));
			//});
		},
		
		/**
		 * 检查插件命令是否可以正常执行，默认true
		 * @return boolean 
		 */
		check: function(){
			return true;
		},
		/**
		* @description
		* 插件填充，被继承重写
		* 默认为无填充
		* @override
		**/
		fill : function(){

		},
		/**
		* @description
		* 启用插件
		* @param {object.<Editor>} curEditor 启用插件的编辑器
		**/
		enable : function(curEditor){
			if(!curEditor){
				curEditor = E.curEditor;
			}
			curEditor.pluginEnable[this.id] = true;
		},
		/**
		* @description
		* 禁用插件
		* @param {object.<Editor>} curEditor 禁用插件的编辑器
		**/
		disable : function(curEditor){
			if(!curEditor){
				curEditor = E.curEditor;
			}
			curEditor.pluginEnable[this.id] = false;
		},
		/**
		* @description
		* 获得标题
		**/
		getTitle : function(){
			return E.lang.pluginTitle[this.title];
		},
		/**
		* @description
		* 写日志
		* @param {string} opt 操作
		**/
		writeLog : function(opt){
			var msg = 'The operate '+opt+' !';
			var mod = 'plugin';
			var date = new Date();
			var time = date.toLocaleString();
			E.log.writeLog(msg,mod,time);
		},
		/**
		* @description
		* 写错误
		* @param {string} opt 操作
		* @param {number} level 错误级别
		**/
		writeError : function(opt,level){
			var msg = 'The operate '+opt+' error !';
			var mod = 'plugin';
			var date = new Date();
			var time = date.toLocaleString();
			E.error.writeError(msg,level,mod,time);
		},
		/**
		* @description
		* 显示提示信息
		* @param {string} msg 提示信息
		**/
		showTips : function(msg){
			var tips = '';
			if(!msg){
				msg = this.tips;
			}
			if(E.lang.pluginTips[msg]){
				tips = E.lang.pluginTips[msg];
			}else{
				tips = msg;
			}
			E.utils.showTips(tips);
		},
		
		/**
		 * 加载插件相关UI
		 *
		 */
		loadUiTpl: function(callback) {
			E.utils.loadDialog(this.id, E.config.cBase.uiDir+this.id+'/', callback);
		},
		
		clicked: function( on, id ) {
			id = id || this.id;
			var o = E.curEditor.$toolbar;
			
			o.find('#icon-'+id).closest('.bke-btn')[on?'addClass':'removeClass']('bke-clicked');
		}
	};
	//创建插件基础对象，并初始化，然后赋值到编辑器核心对象jQEditor上
	//将插件的构造函数赋值到编辑器核心对象jQEditor上
	//将加载插件的方法赋值到编辑器核心对象jQEditor上
	var basePlugin = new Plugin();
	basePlugin.initPlugin();
	/**
	* @description
	* 初始化插件，实例一个插件，将它挂载到基础插件 basePlugin下
	* 插件的构造函数被挂载到插件构造对象 pluginCon下
	* @param {object} obj 插件配置参数
	**/
	function addPlugin(obj){
		//try{
			if(obj.id){
			//	var pluginAttr = {};
				var pluginId = obj.id;
			//	var objPluginInterface = obj.id;
				/**
				* 单个插件
				* @constructor
				* @extends {object.<Plugin>}
				* @param {object} attr 插件配置参数
				**/
				function Fn(attr){
					Plugin.call(this,attr);
				}
				Fn.prototype = basePlugin;

				E.pluginList[pluginId] = new Fn(obj);
				E.trigger('afterPlugin');
			}
		//}catch(ex){
		//	E.error.writeError(obj.id+' plugin add error: '+ex.message,3,'plugin');
		//}
	}
	//初始化插件的方法被挂载到编辑器核心对象jQEditor上
	addPlugin.ready = true;
	E.addPlugin = addPlugin;
	E.plugin = function(id){
		return E.pluginList[id];
	}
})(window.jQuery.jQEditor);
(function(E,$){
	// 不需要 scriptAddr，根据路径规则知道id即可拼出完整路径
	// 所有UI的列表，用于确定要加载的UI的位置和配置
	var cmdConfig = E.config.cCommand;
	var allList = {};
	for(var tmpCmd in cmdConfig.uiCommand){
		var objCmd = cmdConfig.uiCommand[tmpCmd];
		var shortId = objCmd.cmd.replace('dialog','');
		allList[objCmd.cmd] = {isEnable : true,scriptAddr : E.config.cBase.uiDir+shortId+'/'+shortId+'.dialog.js'};
	}/*
	var allList = {
		'colorPanel' : {
			id : 'colorPanel',
			scriptAddr : './core/ui/color/color.panel.js'
		},
		'linkDialog' : {
			id : 'linkDialog',
			scriptAddr : './core/ui/link/link.dialog.js'
		},
		'videoDialog' : {
			id : 'videoDialog',
			scriptAddr : './core/ui/video/video.dialog.js'
		},
		'mapDialog' : {
			id : 'mapDialog',
			scriptAddr : './core/ui/map/map.dialog.js'
		},
		'pastewordDialog' : {
			id : 'pastewordDialog',
			scriptAddr : './core/ui/pasteword/pasteword.dialog.js'
		},
		'imageDialog' : {
			id : 'imageDialog',
			scriptAddr : './core/ui/image/image.dialog.js'
		}
	};*/
	/**
	* @description
	* 加载UI文件
	* @param {string} id UI名称
	* @param {function} callbcak 回调函数
	**/
	E.loadUi = function(id,callbcak){
		var addr = allList[id].scriptAddr;
		E.load.loadOneFile(addr,function(){callbcak();});
	};
	/**
	* UI基类
	* @constructor
	* @param {object} attr UI配置参数
	**/
	function Ui(attr){
		this.html = '';
		
		if(attr){
			for(var one in attr){
				this[one] = attr[one];
			}
			/*
			this.id = attr.id;
			this.isEnable = attr.isEnable;
			this.scriptAddr = attr.scriptAddr;
			*/
		}
	}
	Ui.prototype = {
		initUi : function(){
			this.allList = allList;
		},
		//点击确定按钮时，提前验证的方法
		check : function(){
			return true;
		},
		//点击确定按钮
		submit : function(){
			return false;
		},
		//点击取消按钮
		cancel : function(){
			return false;
		},
		// 返回UI的html
		getHtml: function(){
			return this.html;
		},
		
		/**
		* @description
		* ui获取信息
		* @override
		**/
		getValues : function(){
			var data = {}, inputs = $('#'+this.id+' :input');
			inputs.each(function(){
				if (this.name) {
					data[this.name] = $(this).val();
				}
			});
			return data;
		},
		
		/**
		 * @description
		 * 设置ui中的值，被继承重写
		 * @override
		 **/
		setValues : function(args){
			var inputs = $('#'+this.id+' :input');
			inputs.each(function(){
				if ( this.name && typeof args[this.name] !== 'undefinded' ) {
					$(this).val( args[this.name] );
				}
			});
		},
		/**
		* @description
		* 隐藏ui，被继承重写
		* @override
		**/
		hide : function(){

		},
		/**
		* @description
		* 启用UI
		**/
		enable : function(){
			this.isEnable = true;
		},
		/**
		* @description
		* 禁用UI
		**/
		disable : function(){
			this.isEnable = false;
		},
		
		
		// 显示错误提示
		error: function(msg){
			E.dialog.error(msg);
		},
		
		// 显示成功提示
		success: function(msg){
			E.dialog.success(msg);
		},
		
		/**
		* @description
		* 写日志
		* @param {string} opt 操作
		**/
		writeLog : function(opt){
			var msg = 'The operate '+opt+' !';
			var mod = 'ui';
			var date = new Date();
			var time = date.toLocaleString();
			E.log.writeLog(msg,mod,time);
		},
		/**
		* @description
		* 写错误
		* @param {string} opt 操作
		* @param {number} level 错误级别
		**/
		writeError : function(opt,level){
			var msg = 'The operate '+opt+' error !';
			var mod = 'ui';
			var date = new Date();
			var time = date.toLocaleString();
			E.error.writeError(msg,level,mod,time);
		},
		/**
		* @description
		* 显示提示信息
		* @param {string} msg 提示信息
		**/
		showTips : function(msg){
			var tips = '';
			if(!msg){
				msg = this.tips;
			}
			if(E.lang.UiTips[msg]){
				tips = E.lang.UiTips[msg];
			}else{
				tips = msg;
			}
			E.utils.showTips(tips);
		}
	};
	// 创建UI基础对象，并初始化，然后赋值到编辑器核心对象jQEditor上
	// 将UI的构造函数赋值到编辑器核心对象jQEditor上
	// 将加载UI的方法赋值到编辑器核心对象jQEditor上
	var baseUi = new Ui();
	baseUi.initUi();
	/**
	* @description
	* 初始化UI，实例一个UI，将它挂载到基础UI baseUi下
	* UI的构造函数被挂载到UI构造对象 UiCon下
	* @param {object} obj UI配置参数
	**/
	function addUi(obj){
		try{
			if(obj.id){
				var uiId = obj.id;
				/**
				* 单个Ui
				* @constructor
				* @extends {object.<Ui>}
				* @param {object} attr ui配置参数
				**/
				function Fn(attr){
					Ui.call(this,attr);
				}
				Fn.prototype = baseUi;

				E.uiList[uiId] = new Fn(obj);
				E.uiList[uiId].initUi();
				E.trigger('afterUi');
			}
		}catch(ex){
			E.error.writeError(obj.id+' ui add error: '+ex.message,3,'ui');
		}
	}
	//初始化UI的方法被挂载到编辑器核心对象jQEditor上
	addUi.ready = true;
	E.addUi = addUi;
	E.ui = function(id){
		return E.uiList[id];
	}
})(window.jQuery.jQEditor,window.jQuery);
(function(E,$){

// 用于记录初始的选中范围，这样会防止在操作弹窗的时候范围丢失
// 在打开弹窗的时候记录，关闭弹窗的时候恢复
var oriRange = '', currentId = null, newDialog

function ArtDialog() {}

ArtDialog.prototype = {
	/**
	* @description
	* 初始化弹窗
	* @return {object.<Art>} 新生成的artDialog对象
	**/
	init : function(attr){
		var dialogID = attr.id,
			content = attr.content instanceof jQuery ?attr.content[0].outerHTML:attr.content,
			title = attr.title,
			ok = attr.ok,
			cancel = attr.cancel,
			init = attr.init|| attr.initialize,
			button = attr.button,
			url = attr.url;
			
		newDialog = $.artDialog({
				id: dialogID,
				content: content,
				title: title,
				//lock: true,
				fixed: true,
				ok: ok,
				cancel: cancel,
				button: button,
				okValue: ' 确定 ',
				cancelValue: ' 取消 ',
				initialize: init
			});
			
		newDialog.dom.dialog
			.addClass('bke-dialog')
			.attr('id', attr.id)
			.find('.d-buttons').prepend('<div class="d-error"></div>');
			
		return newDialog;

	},
	/**
	* @description
	* 打开弹窗
	* @param {object} attr 弹窗配置
	**/
	open: function(attr,args){
		oriRange = E.utils.getSelectionRange(E.curEditor.win);
		if($.artDialog.get(attr.id)){
			$.artDialog.get(attr.id).dom.dialog.attr('editor',attr.editor);
		}else{
			newDialog = this.init(attr);
			newDialog.dom.dialog.attr('editor',attr.editor);
		}
		if(typeof args !== 'undefined'){
			currentId = attr.ui ? attr.ui : attr.id;
			E.utils.execUi(currentId,'setValues',args);
		}
	},
	/**
	* @description
	* 关闭弹窗
	* @param {string} id 弹窗id
	**/
	close: function(id){
		id = id || currentId;
		if($.artDialog.get(id)){
			$.artDialog.get(id).close();
		}
		this.revertSelection();
		E.curEditor.win.focus();
	},
	/**
	* @description
	* 弹窗中提交
	* @param {string} 弹窗id
	**/
	submit: function(id ){
		this.close(id);
	},
	revertSelection: function() {
		if (oriRange) {
			E.utils.setSelectionRange(E.curEditor.win,oriRange);
		}
	},
	
	// 显示错误提示
	error: function(msg, color) {
		color = color || 'red'
		newDialog.dom.dialog
			.find('.d-error').css('color', color).html(msg).show();
	},
	
	// 显示成功提示
	success: function(msg) {
		this.error(msg, 'green');
	},
	
	// 清楚提示信息
	clear: function() {
		newDialog.dom.dialog.find('.d-error').fadeOut();
	}
};
//art.dialog.open('login_iframe.html', {title: '提示'});
var dialog = new ArtDialog();
dialog.ready = true;
E.dialog = dialog;

// 窗口输入框被点击时，清除提示消息
$(document).delegate('.d-content :input', 'click', function(){
	dialog.clear();
})

})(jQuery.jQEditor, jQuery);
(function (E, $) {
var menuLeft = 0, menuTop = 0, timer = 0, $menu;

setTimeout(function(){
	$('body').append('<div id="bke-contextmenu" class="bke-contextmenu" style="display:none;"></div>');
}, 0);

// 隐藏右键菜单
$(document).bind('click',function(e){
	$('#bke-contextmenu').hide();
});

var Menu = {
	create: function(menu ) {
		var htmlstr = '<div class="bke-menu">'
						+'<div class="bke-shadow bke-default"></div>'
						+'<div class="bke-menu-body">';
				
		var menuLen = menu.length
		for (var i=0;i < menuLen ; i++ ){
			var submenu ='', divmore = '';
			
			if ( menu[i].submenu ) {
			
				submenu = (typeof menu[i].submenu === 'object') 
					? Menu.create(menu[i].submenu) 
					: '<div class="bke-menu">'+menu[i].submenu+'</div>';
					
				divmore = '<div class="bke-menu-more"></div>';
			}
			
			if (menu[i].name === 'separator' || menu[i].name === '-'){
				htmlstr +='<div class="bke-menu-separator">'
							+'<div class="bke-menu-separator-inner"></div>'
						+'</div>';
			} else {
			
				var icon =  menu[i].icon || '',
					cmdStr = '',
					styleName = '';
					
				if (menu[i].disabled){
					icon += ' disabled';
				}

				if (menu[i].styleName){
					styleName = menu[i].styleName;
				}
				if(menu[i]['cmd']){
					cmdStr = ' cmd="'+menu[i]['cmd']+'"';
				}
				if(menu[i]['param']){
					cmdStr += ' param="'+menu[i]['param']+'"';
				}
				if(menu[i]['args']){
					cmdStr += ' args="'+menu[i]['args']+'"';
				}
				htmlstr += '<div class="bke-menu-item '+styleName+'"'+ cmdStr +'>'
								+ '<div class="bke-menu-icon '+icon +'"></div>'
								+ '<div class="bke-menu-label"><a href="javascript:'+menu[i]['cmd']+'" onclick="return false;">'
									+menu[i].name
								+ '</a></div>'
								+ divmore
								+ submenu
							+ '</div>';
			}
		}

		htmlstr += '</div></div>';
		return htmlstr;
	},
	
	contextmenu: function(conf, event) {
		var self = this;
		$menu = $('#bke-contextmenu');
		
		$menu.html( self.create(conf) );
		self._show($menu, event);
		self._setEvent($menu);
	},
	
	_show: function(menu, event){
		menu.css({'z-index':10, 'top':-1000, 'left':-1000}).show();
		
		var self = this, 
			pos = self._setPosition(menu, event);
		
		//设置菜单的位置
		menu.css(pos);
	},
	
	// 绑定事件
	_setEvent: function(menu) {
		// 事件绑定仅需要执行一次
		this._setEvent = function(){};
		
		var self = this, dom = E.curEditor.dom;
		$(dom).bind('click.contextmenu', function(){
			// 单击时清除右键菜单
			menu.hide();
		});
		
		menu.delegate('.bke-menu-item', 'mouseenter', function(e){
			var children = $(this).find('.bke-menu, .bke-submenu');
			clearTimeout(timer);
			
			if (children.size()) {
				timer = setTimeout(function(){children.show ()}, 200);
				/*
				var pos = $(this).position(),
					swidth = children.outerWidth(),
					sheight = children.outerHeight();
				
				// 二级子菜单，默认是和一级菜单水平位置，向下显示
				// 如果下面的空间不足，而上面的空间足，则向上显示
				// 如果上下空间都不足，则二级菜单的底边和窗口底边对齐即可
				if (menuTop + pos.top + sheight > $(window).height()) {
					var h =-1-sheight+25;
					//children.css({'top':h});
				}
				
				if (menuLeft + pos.left + $('.bke-menu').width() + swidth > $(window).width()) {
					var w =0-swidth;
					children.css({'left':w});
				}
				*/
				var pos = self._setSubPosition(children, e);
				children.css( pos );
				children.css({'z-index':150});
			}
			
		}).delegate('.bke-menu-item', 'mouseleave', function(){
		
			$(this).find('.bke-menu').hide();
			
		}).delegate('.bke-menu-item', 'mousedown', function(e){
		
			E.curEditor.win.focus();
			return false;
			
		}).delegate('.bke-menu-item', 'click', function(e){
		
			var target = $(e.target).closest("[cmd]");
			if( target.length ){
				var cmd = target.attr('cmd'),
					param = target.attr('param'),
					args = target.attr('args');
					
				E.command(cmd, param, args);
				menu.hide();
			}
			
			return false;
		});
	},
	
	// 设置一级菜单的位置
	_setPosition: function (menu, event) {
		var offset = $('#'+E.curId).find('iframe').offset(),
			frameX = offset.left,
			frameY = offset.top,
			scrollTop = $(document).scrollTop(),
			scrollLeft = $(document).scrollLeft(),
			clientX = event.clientX + frameX +5,
			clientY = event.clientY + frameY +5 - scrollTop,
			redge = $(window).width() - clientX, // 当前鼠标点击的点距离视窗右边距的距离
			bedge = $(window).height() - clientY; // 当前鼠标点击的点距离视窗下边距的距离
			
		if (redge < menu.outerWidth()) {
			menuLeft = scrollLeft + clientX - menu.outerWidth();
		}else{
			menuLeft = scrollLeft + clientX;
		}
		
		if (bedge < menu.outerHeight()){
			if ( clientY > menu.outerHeight() ) {
				menuTop = scrollTop + clientY - menu.outerHeight();
			} else {
				menuTop = scrollTop + 30;
			}
		}else{
			menuTop = scrollTop + clientY;
		}
		
		return ({'top':menuTop, 'left':menuLeft});
	},
	
	// 设置二级菜单的位置
	_setSubPosition: function (submenu, event) {
		
		
		
		
		return ({'top':0});
	}
}

	E.Menu = Menu ;
})(jQuery.jQEditor ,jQuery);
(function(E, $){

var reBaike=/^http:\/\/(\w+\.){0,2}(?:hudong|baike|hoodong)\.com/i,
	
	// 0 不过滤；1 过滤(默认)
	isFilterExternal = (typeof g_filterExternal === "function") 
		? g_filterExternal
		: function(){return 1};
	
E.addFilter({
	name: 'baike',
	type: ['dom'],
	
	replace: function(win, dom) {
	
		if(typeof dom !== 'object' || !dom.body){return dom;}
		var links = $('a', dom);
		
		links.each(function(){
			var link = $(this),
				href = link.attr('href'),
				text = link.text();
			
			if (
				( link.is('.innerlink,.baikelink') || /www\.(hudong|baike)\.com\/wiki\//i.test( href ) ) 
				&& !reBaike.test(text)
			){
			// 修复百科链接
				link.attr('href', 'http:/'+'/www.baike.com/wiki/' + encodeURI(text) );
			}else if( href && isFilterExternal() ){
				href = href.toLowerCase();
				var pos = href.indexOf(location.hostname);
				
				if( /^\w+:/i.test(href) 
					&& (!reBaike.test(href) && (!location.hostname || pos < 0 || pos > 10) )
				) {
					link.replaceWith(link.html());
				}
			}
		});
		
		// 过滤旧的目录，将div转为h2/3
		$('.hdwiki_tmml', dom).each(function(){
			var o = $(this),
				text = o.text();
			o.replaceWith('<h2>'+ text +'</h2>');
		});
		$('.hdwiki_tmmll', dom).each(function(){
			var o = $(this),
				text = o.text();
			o.replaceWith('<h3>'+ text +'</h3>');
		});
	}
});

})(jQuery.jQEditor, jQuery);
(function(E){
	var name = 'block';
	/**
	* @description
	* 添加p标签，是内联元素不会直接出现在body的子节点上
	* @param {object} dom 过滤的document文档
	* @param {object.<node>} queryNode 过滤的根节点
	**/
	var _addOneBlock = function(win,dom,queryNode){
		var tmpNode = {};
		var inlineFlag = false;
		var optNode = queryNode.firstChild;
		if(optNode === null){
			return;
		}
		var optNodeNext = {};
		var addRange = dom.createRange();
		addRange.setStartBefore(optNode);
		addRange.collapse(true);
		while(optNode !== null){
			optNodeNext = optNode.nextSibling;
			if(typeof DTD.$inline[optNode.tagName] !== 'undefined' || (optNode.nodeType === 3 && /\S/.test(optNode.nodeValue))){
				//内联节点或者是非空文本节点，设置可加 p 标签位为true
				addRange.setEndAfter(optNode);
				inlineFlag = true;
			}else if(typeof DTD.$block[optNode.tagName] !== 'undefined'){
				//块节点时，就到了加 p 标签的时候了，加完之后将位设为false
				if(inlineFlag === true){
					var tmpP = dom.createElement('p');
					addRange.surroundContents(tmpP);
				}
				addRange.setStartAfter(optNode);
				addRange.collapse(true);
				inlineFlag = false;
			}
			if(optNode === queryNode.lastChild && inlineFlag === true){
				//如果最后都没发现块标签，但是需要加 p 标签则添加
				var tmpP = dom.createElement('p');
				addRange.surroundContents(tmpP);
			}
			optNode = optNodeNext;
		}
		return;
	};
	/**
	* @description
	* 执行过滤
	* @param {object} node 过滤的跟节点
	**/
	var func = function(win,node){
		var nodeInfo = E.utils.getNodeDom(node);
		var dom = nodeInfo.dom;
		node = nodeInfo.node;
		_addOneBlock(win,dom,node);
		return node;
	};
	/**
	* @description
	* 添加该过滤到编辑器的过滤中
	**/
	E.addFilter({
		name : 'block',
		type : ['afterText','afterInsert'],
		replace : func
	});
})(window.jQuery.jQEditor);
(function(E, $){

//允许保留的标签、属性和样式
/*
var allowTags = {
		'font':[],
		'span' : ['class','style', '.font-weight', '.font-style', '.text-decoration'],
		'div' : ['class','id','style','.width','.text-align'],
		'a' : ['class','href', 'target', 'title', 'alt', 'name'],
		'img' : ['class', 'id', 'src', 'alt', 'title', 'align', 'usemap', 'border', 'name', 'width', '/'],
		'hr' : ['/'],
		'br' : ['/'],
		'p' : ['class','align','style','.text-align'],
		'table' : [
			'class','style','width','.width','align',
			'border','bordercolor', 'cellpadding',
			'.margin', '.margin-left','.margin-right'
			],
		'tbody': [],
		'tr': [],
		'th': ['class','align','colspan','rowspan','width'],
		'td': ['class','align','colspan','rowspan','width'],
		'ol': ['class'],
		'ul': ['class'],
		'li': ['class'],
		'sub': ['class'],
		'sup': ['class','name'],
		'blockquote': ['style', '.margin', '.padding'],
		'h2': [],
		'h3': [],
		'h4': [],
		'h5': [],
		'h6': [],
		'em': [],
		'strong': ['style','.width'],
		'b': [],
		'i':[],
		'u': [],
		'strike': [],
		'object':['classid','class','id','width','height','codebase'],
		'embed' : ['style','src', 'type', 'loop', 'autostart', 'quality', '.width', '.height','flename','width','height','volume','pluginspage','console','controls','/'],
		'param':['name','value'],
		'map':['id', 'name'],
		'area':['shape', 'coords', 'href', 'title', '/']
	};
	*/
var allowTags = {
		'font':[],
		'span' : ['class','style', '.font-weight', '.font-size', '.font-family', '.font-style', '.text-decoration'],
		'div' : ['class','id','style','.width','.text-align'],
		'a' : ['class','href', 'target', 'title', 'alt', 'name'],
		'img' : ['class', 'id', 'src', 'alt', 'title', 'align', 'usemap', 'border', 'name', 'width', '/'],
		'hr' : ['/'],
		'br' : ['/'],
		'p' : ['class','align','style','.text-align','.padding-left','.margin-top','.margin-bottom','.line-height'],
		'table' : [
			'class','style','width','.width','align',
			'border','bordercolor', 'cellpadding',
			'.margin', '.margin-left','.margin-right'
			],
		'tbody': [],
		'tr': [],
		'th': ['class','align','colspan','rowspan','width'],
		'td': ['class','align','colspan','rowspan','width'],
		'ol': ['class','style','.text-align','.padding-left','.margin-top','.margin-bottom','.line-height'],
		'ul': ['class','style','.text-align','.padding-left','.margin-top','.margin-bottom','.line-height'],
		'li': ['class'],
		'sub': ['class'],
		'sup': ['class','name'],
		'pre': ['class','name'],
		'blockquote': ['style', '.margin', '.padding'],
		'h2': [],
		'h3': [],
		'h4': [],
		'h5': [],
		'h6': [],
		'em': [],
		'strong': ['style','.width'],
		'b': [],
		'i':[],
		'u': [],
		'strike': [],
		'object':['classid','class','id','width','height','codebase'],
		'embed' : ['style','src', 'type', 'loop', 'autostart', 'quality', '.width', '.height','flename','width','height','volume','pluginspage','console','controls','/'],
		'param':['name','value'],
		'map':['id', 'name'],
		'area':['shape', 'coords', 'href', 'title', '/']
	};
	
	var nodeAttrs = ['onerror','onclick','onmouseout','onmouseover','onmousemove','align'
	,'color','font','height','vspace','hspace','id','class','style','left'
	,'right','name','rel','size','title','width','valign','bgcolor','dir'];

/**
 * @description
 * 添加该过滤到编辑器的过滤中
 */
E.addFilter({
	name: 'cleanup',
	order: 'first', // 指定过滤器优先级，first优先执行
	type: ['dom'], // beforeSubmit
	replace: function(win, dom){
		scanNodes( dom.body );
	}
});

/**
 * 扫描标签和标签属性，清除到不在保留列表的标签和属性
 * 
 */
function scanNodes ( el ){
	var attList=[], nodes = el.childNodes;
	for (var i = 0; i < nodes.length; i++){
		var node = nodes[i];
		if (1 === node.nodeType){
			// nodeType = 1 是元素节点
			var tagName = node.tagName.toLowerCase();
			
			if (allowTags[tagName]){
				// 2011-07-22 潘雪鹏
				// IE也支持node.attributes属性，但是node.attributes将返回标签支持的所有属性，
				// 多达100多个，而非iE浏览器仅返回标签里面出现的属性，
				// 所以ie下的node.attributes在此处会导致严重的性能问题，
				// 解决办法就是，ie下给一个指定好的属性黑名单。
				var attrList = (E.IE)? nodeAttrs : $.makeArray(node.attributes);
				var attrs = allowTags[tagName], styles = '';
				
				var attrName;
				// 先过滤属性
				for (var j = 0, len = attrList.length; j < len; j++){
					attrName = (E.IE) ? attrList[j] : attrList[j].name.toLowerCase();
					if ($.inArray(attrName, attrs) === -1){
						node.removeAttribute(attrName);
						//E.log('run', '清理标签'+node.tagName+'的属性'+attrName);
						attList[attrName] = node.getAttribute(attrName);
					}
				}
				
				styles = E.IE ? node.style.cssText : node.getAttribute('style');
				
				// 后过滤样式
				if( styles ){
					styles = styles.replace(/; /g, ';').toLowerCase();
					var _style, styleList = styles.split(';');
					for (var j=0, len = styleList.length; j<len; j++){
						_style = styleList[j].split(':');
						if (_style.length === 2 && $.inArray('.'+_style[0], attrs) === -1){
							styles = styles.replace(new RegExp(_style[0]+":"+_style[1]+";?", 'i'), '');
						}
					}
					styles = $.trim(styles);
					if( styles ){
						E.IE ?	(node.style.cssText = styles)
							: node.setAttribute('style', styles);
					}else{
						node.removeAttribute('style');
					}
				}
				
				// 针对表格节点，进行特殊处理
				if( (tagName === 'table') ){
					var table = $(node), bordercolor = table.attr('bordercolor');
					if( !table.hasClass('jqe-table') ){
						table.addClass('jqe-table');
					}
					if( !bordercolor ){
						table.attr('bordercolor', '#cccccc');
					}
					
					table.attr('border', 1);
				}
				
				if (node.hasChildNodes()) {
					scanNodes(node);
				}
			}else if (node.hasChildNodes()){
				//对于有子元素的不合法标签进行深入遍历，保证删除标签而保留其内容。
				for(var j=0; j<node.childNodes.length; j++){
					scanNodes(node.childNodes[j]);
					node.parentNode.insertBefore(node.childNodes[j].cloneNode(true), node);
				}
				node.parentNode.removeChild(node);
			}else{
				//没有子元素的不合法标签，直接删除
				node.parentNode.removeChild(node);
			}
		}
	}
	
	return el.innerHTML;
}

})(jQuery.jQEditor, jQuery);
(function(E){
	var name = 'combine';
	var func = function(win,node){
		var nodeInfo = E.utils.getNodeDom(node);
		var dom = nodeInfo.dom;
		node = nodeInfo.node;
		var curSel = win.getSelection();
		var selRange = curSel.rangeCount !== 0 ? curSel.getRangeAt(0) :' ';
		var ancestorList = [];
		if(navigator.userAgent.indexOf("MSIE") <= 0){
			ancestorList = dom.createNodeIterator(node,NodeFilter.SHOW_ELEMENT);
		}else{
			ancestorList = dom.createNodeIterator(node,1);
		}
		var queryNode = ancestorList.nextNode();
		while(queryNode){
			var selIn = false;
			queryLoop : 
			while(queryNode.nextSibling && queryNode.tagName === queryNode.nextSibling.tagName && DTD.$font[queryNode.tagName] === 1){
				if(queryNode.tagName === 'SPAN'){
					var len = queryNode.style.cssText.split(';').length;
					var nextLen = queryNode.nextSibling.style.cssText.split(';').length;
					if(len !== nextLen){
						break queryLoop;
					}
					for(var i=0;i<len;i++){
						if(queryNode.nextSibling.style[queryNode.style[i]] !== queryNode.style[queryNode.style[i]]){
							break queryLoop;
						}
					}
				}
				var startSel = {},endSel = {};
				if(selRange){
					startSel = {
						container : selRange.startContainer,
						offset: selRange.startOffset
					},endSel = {
						container : selRange.endContainer,
						offset: selRange.endOffset
					};
					if(selRange.startContainer.childNodes[selRange.startOffset] === queryNode.nextSibling){
						selRange.setStartAfter(queryNode);
						selIn = true;
					}
					if(selRange.endContainer.childNodes[selRange.endOffset] === queryNode.nextSibling){
						selRange.setEndAfter(queryNode);
						selIn = true;
					}
					var outIndex = E.utils.nodeIndex(queryNode.nextSibling);
					if(selRange.startContainer === queryNode.parentNode && selRange.startOffset > outIndex){
						startSel.offset = outIndex;
						selIn = true;
					}
					if(selRange.endContainer === queryNode.parentNode && selRange.endOffset > outIndex){
						endSel.offset = outIndex;
						selIn = true;
					}
				}

				var insertRange = dom.createRange();
				var cutRange = dom.createRange();
				insertRange.selectNodeContents(queryNode);
				insertRange.collapse(false);
				cutRange.selectNodeContents(queryNode.nextSibling);
				var cutValue = cutRange.extractContents();
				cutRange.selectNode(queryNode.nextSibling);
				cutRange.deleteContents();
				insertRange.insertNode(cutValue);
				if(selRange){
					selRange.setStart(startSel.container,startSel.offset);
					selRange.setEnd(endSel.container,endSel.offset);
					curSel.removeAllRanges();
					curSel.addRange(selRange);
				}
			}
			queryNode = ancestorList.nextNode();
		}
		if(navigator.userAgent.indexOf("MSIE") <= 0){
			ancestorList = dom.createNodeIterator(node,NodeFilter.SHOW_TEXT);
		}else{
			ancestorList = dom.createNodeIterator(node,3);
		}
		var combineFlag = false;
		queryNode = ancestorList.nextNode();
		while(queryNode){
			if(queryNode.nextSibling && queryNode.nextSibling.nodeType === 3){
				combineFlag = true;
			}else{
				if(combineFlag === true){
					var combineNode = queryNode.previousSibling;
					while(combineNode && combineNode.nodeType === 3){
						var startSel = {},endSel = {},selOut = '',selIn = '';
						if(selRange){
							selOut = false;
							selIn = false;
							startSel = {
									container : selRange.startContainer,
									offset: selRange.startOffset
								},endSel = {
									container : selRange.endContainer,
									offset: selRange.endOffset
								};
							var outIndex = E.utils.nodeIndex(combineNode.nextSibling);
							if(selRange.startContainer === queryNode.parentNode){
								if(outIndex < selRange.startOffset){
									selOut = 'start';
									startSel.offset =  selRange.startOffset - 1;
									selIn = true;
								}
							}else if(selRange.startContainer === combineNode.nextSibling){
								var combineLen = combineNode.length;
								startSel.offset =  combineLen + selRange.startOffset;
								selIn = true;
							}else if(selRange.startContainer === combineNode){
								startSel.container = combineNode.nextSibling;
								selIn = true;
							}

							if(selRange.endContainer === queryNode.parentNode){
								if(outIndex < selRange.startOffset){
									selOut = 'end';
									endSel.offset =  selRange.endOffset - 1;
									selIn = true;
								}
							}else if(selRange.endContainer === combineNode.nextSibling){
								var combineLen = combineNode.length;
								endSel.offset =  combineLen + selRange.endOffset;
								selIn = true;
							} else if(selRange.endContainer === combineNode){
								endSel.container = combineNode.nextSibling;
								selIn = true;
							}
						}
						queryNode.nodeValue = combineNode.nodeValue + queryNode.nodeValue;
						var preNode = combineNode.previousSibling;
						combineNode.parentNode.removeChild(combineNode);
						combineNode = preNode;
						if(selRange){
							selRange.setStart(startSel.container,startSel.offset);
							selRange.setEnd(endSel.container,endSel.offset);
							if(selIn === true){
								curSel.removeAllRanges();
								curSel.addRange(selRange);
							}
						}
					}
					combineFlag = false;
				}
			}
			queryNode = ancestorList.nextNode();
		}
	};
	E.addFilter({
		name : 'combine',
		type : ['afterText','beforeInsert','afterInsert'],
		order : 'second',
		replace : func
	});
})(window.jQuery.jQEditor);
(function(E, $){

E.addFilter({
	name: 'default',
	type: ['html'],
	replace: function(win, html) {
		if(typeof html !== 'string' || !html){ return html; }
		// 去掉多余空白
		html = html.replace(/^\s+/g, '');
		html = html.replace(/\s+$/g, '');
		html = html.replace(/>\s+</g, '><');
		
		// 给空td标签添加空格&nbsp;
		html = html.replace(/(<td[^>]*>)<\/td>/g, '$1&#8203;<br></td>');
		
		// 将参考资料标签sup前后各添加&nbsp;以方便用户输入
		html = html.replace(/<\/sup>(\s|&nbsp;)*/ig, '<\/sup> ');
		
		html = html.replace(/(\s|&nbsp;)*<sup/ig, '<sup');
		
		html = html.replace(/<\/?textarea>/ig, '');
		html = html.replace(/<!--[\s\S]*?-->/gi, '');
		
		if( /http:\/\/www\.(hudong|baike)\.com\/editdocauth/i.test(location.href) ){
			//替换所有的font标签
			html = html.replace(/<\/?font[^>]*>/ig, '');
		}
		
		//替换掉所有的空标签
		//需保留锚点a标签
		html = html.replace(/<(div|strong|span)[^>]*?>\s*<\/\1>/ig, '');
		
		// 替换无意义的多余标签，如<span>abc</span>替换为abc
		html = html.replace(/<(span|font)>([^<]+)<\/\1>/ig, '$2');		
		//
		html = html.replace(/<\??xml(:\w+)?(\s+[^>]*?)?>([\s\S]*?<\/xml>)?/ig, '');
		html = html.replace(/<\/?(html|head|body|meta|title|iframe|frame)(\s+[^>]*?)?>/ig, '');

		//
		html = html.replace(/<link(\s+[^>]*?)?>/ig, '');
		//
		html = html.replace(/<script(\s+[^>]*?)?>[\s\S]*?<\/script>/ig, '');
		//
		html=html.replace(/(<\w+)(\s+[^>]*?)?\s+on(?:error|click|dblclick|mousedown|mouseup|mousemove|mouseover|mouseout|mouseenter|mouseleave|keydown|keypress|keyup|change|select|submit|reset|blur|focus|load|unload)\s*=\s*(["']?).*?\3((?:\s+[^>]*?)?\/?>)/ig,'$1$2$4');
		//
		html = html.replace(/<style(\s+[^>]*?)?>[\s\S]*?<\/style>/ig, '');
		
		// 2011-11-09 潘雪鹏
		// 下面这个替换会导致问题，暂时取消。比如当p标签嵌套div时
		//html=html.replace(/(<\w+)(\s+[^>]*?)?\s+(style|class)\s*=\s*(["']?).*?\3((?:\s+[^>]*?)?\/?>)/ig,'$1$2$4');
		
		html=html.replace(/<\/(strong|b|u|strike|em|i)>((?:\s|<br\/?>|&nbsp;)*?)<\1(\s+[^>]*?)?>/ig,'$2');
		/*
		if(!Consts.IE){
			//非IE浏览器，则需将 strong 和 em 标签转为 b 和 i，
			//否则加粗、斜体操作对于已经存在的strong和em不起作用。
			html = html.replace(/<(\/?)(strong|em)>/ig, function($0, $1, $2){
				var o={strong:'b', em:'i'};
				return '<'+$1+o[$2]+'>';
			});
		}*/
		
		html = html.replace(/class=\"Apple-style-span\"/ig, '');
		// 去除jQuery添加到临时属性
		html = html.replace(/ jquery\d+=\"?\d+\"?/ig, ' ');
		
		// word
		html = cleanWord(html);
		return html;
	}
});

function cleanWord(html){
	// Remove <!--[if gte mso 9|10]>...<![endif]-->
	html = html.replace(/<!--\[if gte mso [0-9]{1,2}\]>[\s\S]*?<!\[endif\]-->/ig, "");

	// Remove <style> ...mso...</style>
	html = html.replace(/<style>[\s\S]*?mso[\s\S]*?<\/style>/ig, "");

	// Remove lang="..."
	html = html.replace(/ lang=".+?"/ig, "");

	// Remove <o:p></o:p>
	html = html.replace(/<o:p><\/o:p>/ig, "");

	// Remove class="MsoNormal"
	html = html.replace(/ class="Mso.+?"/ig, "");
	
	html = html.replace(/ mso-spacerun: 'yes'/ig, "");
	return html;
}

})(jQuery.jQEditor, jQuery);
(function(E,$){
	var name = 'list';
	/**
	* @description
	* 合并相邻的并且标签，符号样式相同的列表（ul，ol）
	* @param {object} dom 过滤的document文档
	* @param {object.<node>} queryNode 过滤的根节点
	**/
	var _combineList = function(win,dom,queryNode){
		$(queryNode).find('ul,ol').each(function(){
			if($(this).find('li').length === 0){
				$(this).remove();
			}else if(this.previousSibling && this.previousSibling.nodeName === this.nodeName){
				if($(this.previousSibling).css('list-style-type') === $(this).css('list-style-type')){
					var combineNode = this;
					$(this.previousSibling).find('li').each(function(){
						$(combineNode).prepend(this);
					});
					$(this.previousSibling).remove();
				}
			}
		});
	};
	/**
	* @description
	* 执行过滤
	* @param {object} node 过滤的跟节点
	**/
	var func = function(win,node){
		var nodeInfo = E.utils.getNodeDom(node);
		var dom = nodeInfo.dom;
		node = nodeInfo.node;
		_combineList(win,dom,node);
		return node;
	};
	/**
	* @description
	* 添加该过滤到编辑器的过滤中
	**/
	E.addFilter({
		name : 'list',
		type : ['afterList'],
		replace : func
	});
})(window.jQuery.jQEditor,window.jQuery);
(function(E){
	var name = 'replace';
	//设置节点的style属性
	var setStyleType = function(styleType,styleValue,optNode){
		optNode.style.cssText += styleType + ': ' + styleValue;
	};
	var tagChange = {
		'B' : {styleType:'STRONG',styleValue:undefined},
		'I' : {styleType:'EM',styleValue:undefined},
		'U' : {styleType:'text-decoration',styleValue:'underline'},
		'DEL' : {styleType:'text-decoration',styleValue:'line-through'}
	};
	var _addSpan = function(dom,optNode,styleType,styleValue){
		var tmpSpan = dom.createElement("span");
		if(optNode.nodeType === 3 && /\S/.test(optNode.nodeValue)){//Text节点
			var tmpRange = dom.createRange();
			tmpRange.selectNode(optNode);
			var midRange = tmpRange.cloneRange();
			if(optNode.parentNode.tagName === 'SPAN'){
				setStyleType(styleType,styleValue,optNode.parentNode);
			}else{
				//直接包裹span标签
				setStyleType(styleType,styleValue,tmpSpan);
				tmpRange.surroundContents(tmpSpan);
			}
		}
	};
	var _replaceOneTag = function(win,dom,queryNode){
		if(queryNode.nodeType === 3){
			return;
		}else if(tagChange[queryNode.tagName] !== undefined){
			var styleType = tagChange[queryNode.tagName].styleType,
				styleValue = tagChange[queryNode.tagName].styleValue;
			if(styleValue === undefined){
				var outerRange = dom.createRange();
				outerRange.selectNodeContents(queryNode);
				var innerNode = outerRange.extractContents();
				outerRange.selectNode(queryNode);
				outerRange.deleteContents();
				outerRange.insertNode(innerNode);
				var newTag = dom.createElement(styleType);
				outerRange.surroundContents(newTag);
			}else{
				var ancestorList = {};
				if(E.IE){
					ancestorList = dom.createNodeIterator(queryNode,3);
				}else{
					ancestorList = dom.createNodeIterator(queryNode,NodeFilter.SHOW_TEXT);
				}
				var optNode = ancestorList.nextNode(),optNode2 = {};
				while(optNode){
					//指向下一个节点，因为可能会对当前节点做修改
					optNode2 = ancestorList.nextNode();
					_addSpan(dom,optNode,styleType,styleValue);
					optNode = optNode2;
				}
				var outerRange = dom.createRange();
				outerRange.selectNodeContents(queryNode);
				var innerNode = outerRange.extractContents();
				outerRange.selectNode(queryNode);
				outerRange.deleteContents();
				outerRange.insertNode(innerNode);
			}
		}
		return;
	};
	var _replaceLoop = function(win,dom,node){
		var optNode = node.firstChild;
		if(optNode === null){
			return;
		}
		var optNodeNext = {};
		while(optNode !== null){
			optNodeNext = optNode.nextSibling;
			_replaceLoop(win,dom,optNode);
			_replaceOneTag(win,dom,optNode);
			optNode = optNodeNext;
		}
		return;
	};
	var func = function(win,node){
		var nodeInfo = E.utils.getNodeDom(node);
		var dom = nodeInfo.dom;
		node = nodeInfo.node;
		_replaceLoop(win,dom,node);
	};
	E.addFilter({
		name : 'replace',
		type : ['beforeInsert'],
		replace : func
	});
})(window.jQuery.jQEditor);
(function(E){
	var name = 'space';
	var func = function(win,node){
		var nodeInfo = E.utils.getNodeDom(node);
		var dom = nodeInfo.dom;
		node = nodeInfo.node;
		var curSel = win.getSelection();
		var selRange = curSel.rangeCount !== 0 ? curSel.getRangeAt(0) : '';
		var selNode = '';
		var selIn = false;
		var bodyTextList = [];
		if(E.IE){
			bodyTextList = dom.createNodeIterator(node,3);
		}else{
			bodyTextList = dom.createNodeIterator(node,NodeFilter.SHOW_TEXT);
		}
		var queryNode = bodyTextList.nextNode(),queryNode2 = {};
		while(queryNode){
			queryNode2 = bodyTextList.nextNode();
			var space = /(^[ ]+$)/g;
			var newValue = queryNode.nodeValue.replace(space,"");
			space = /([\t\n\r])/g;
			newValue = queryNode.nodeValue.replace(space,"");
			if(newValue !== queryNode.nodeValue ){
				queryNode.nodeValue = newValue;
			}
			//必须使用range的方式删除节点，否则会出现选中区域出错的情况
			
			if(!queryNode.nodeValue){
				if(selRange && selRange.startRange === queryNode){
					selNode = queryNode;
				}else{
					var tmpRange = dom.createRange();
					tmpRange.selectNode(queryNode);
					tmpRange.deleteContents();
					tmpRange.detach();
				}
			}
			queryNode = queryNode2;
		}
		var bodyElementList = [];
		if(E.IE){
			bodyElementList = dom.createNodeIterator(node,1);
		}else{
			bodyElementList = dom.createNodeIterator(node,NodeFilter.SHOW_ELEMENT);
		}
		var queryNode = bodyElementList.nextNode();
		selIn = false;
		while(queryNode){
			queryNode2 = bodyElementList.nextNode();
			if(DTD.$emptyInline[queryNode.nodeName] === 1
				// 不过滤锚点
				|| (queryNode.nodeName.toUpperCase() === 'A' && queryNode.name)
			){
				queryNode = queryNode2;
				continue;
			}
			if(queryNode.children.length == 0 && queryNode.innerText.length === 0 && queryNode !== selNode && DTD.$block[queryNode.nodeName] !== 1 && queryNode.nodeName !== 'BODY'){
				var cutRange = dom.createRange();
				cutRange.selectNode(queryNode);
				//如果范围节点在queryNode上，需要移动，并且重置选择范围
				if(selRange){
					if(queryNode === selRange.startContainer){
						selRange.setStartBefore(queryNode);
						selIn = true;
					}
					if(queryNode === selRange.endContainer){
						selRange.setEndAfter(queryNode);
						selIn = true;
					}
				}
				var spaceNode = queryNode.parentNode;
				//检查空标签的父节点是不是只有空标签本身，如果是，也要删除
				while(spaceNode.firstChild === spaceNode.lastChild && (DTD.$removeEmpty[spaceNode.tagName] === 1 || DTD.$removeEmptyBlock[spaceNode.tagName] === 1)&& spaceNode.tagName !== 'BODY'){
					cutRange.selectNode(spaceNode);
					if(selRange){
						//如果范围节点在spaceNode上，需要移动，并且重置选择范围
						if(spaceNode === selRange.startContainer){
							selRange.setStartBefore(spaceNode);
							selIn = true;
						}
						if(spaceNode === selRange.endContainer){
							selRange.setEndAfter(spaceNode);
							selIn = true;
						}
					}
					spaceNode = spaceNode.parentNode;
				}
				if(selRange){
					//重新设置选中区的范围
					if(selIn){
						curSel.removeAllRanges();
						curSel.addRange(selRange);
					}
				}
				cutRange.deleteContents();
			}
			queryNode = queryNode2;
		}
	};
	E.addFilter({
		name : 'space',
		type : ['afterText','afterTextPre','beforeInsert','afterInsert'],
		order : 'fourth',
		replace : func
	});
})(window.jQuery.jQEditor);
(function(E, $){

E.addFilter({
	name: 'video',
	type: ['dom'],
	
	replace: function(win, dom) {
		var video_whiteList = E.curEditor.config.video_whiteList 
			|| ["youku.com","tudou.com","iqiyi.com","qiyi.com","sohu.com","sina.com.cn","sina.com","qq.com","xunlei.com","ku6.com","56.com","cntv.cn","cctv.com","ifeng.com","baofeng.com","joy.cn","pps.tv","mtime.com","m1905.com","pptv.com","baidu.com","163.com"];
		
		if(typeof dom !=='object' 
			|| !(video_whiteList instanceof Array)
		){
			return;
		}
		
		var video_urls = video_whiteList.slice(0),//复制一份合法的域名
			videos = $('object,embed', dom),
			reg = null,
			del = true, 
			tmp = '', 
			obj = null ,
			item='';
			
		//把所有网址都转为正则表达式，同时去掉http://
		video_urls = video_urls.join('|').toUpperCase().replace(/http:\/\//ig, '').replace(/\./g,'\\\.');
		video_urls = '('+ video_urls + ')$';
		reg = new RegExp(video_urls,'i');
		videos.each(function(){
			obj = $(this);
			tmp = obj.attr('src');
			if(tmp.length){
				tmp = tmp.replace('http://','').replace(/(\?|#)/g,'/').split('/');//去掉src的http://
				if(tmp && tmp.length > 0){
					if(reg.test(tmp[0])){
						del = false;
					}
				}
			}
			if(del){
				obj.remove();
			}
			del = true;
		});
	}
});

})(jQuery.jQEditor, jQuery);
(function(E, $){

E.addFilter({
	name: 'xhtml',
	type: ['html'],
	
	replace: function(win, html) {
	
		if(typeof html !=='string' || !html){return html;}
		var re;
		//对于个别没有结束标签的，加上反斜杠
		html = html.replace(/<(br|hr)>/ig, '<$1 />');
		
		//对于没有反斜杠结尾的img标签，加上反斜杠
		html = html.replace(/<(img[^>]*)([^\/])>/ig, '<$1$2 />');
		
		if( !E.IE ){
			// 如果不是IE浏览器，则仅需要上面的处理
			return html;
		}
		
		// IE浏览器换需要继续进行下面的处理
		
		//将形如<A>或</A>这样标签的转为<a></a>
		re=/(<\/?)([A-Z]+)>/g;
		html = html.replace(re, function($0, $1, $2){
			return $1+$2.toLowerCase()+'>';
		});
		
		//转换带属性的标签，和大写的属性名，以及没有引号的属性值
		//注意：replace 里面的 function 的参数必须从$0开始，即便是仅需要$1，$2等
		re=/<([A-Z]+)([^>]*)>/g;
		html = html.replace(re, function($0,$1,$2){
			//将大写的属性名转为小写
			$2 = $2.replace(/\s([A-Z]+)=/g, function($_0, $_1){
				return ' '+$_1.toLowerCase() + '=';
			});
			
			//将不带双引号的属性值加上双引号
			$2 = $2.replace(/\s+(\w+=)(\w[^\s]+)/g, function($_0, $_1, $_2){
				return ' '+$_1 + '"' + $_2 + '"';
			});
			return '<'+$1.toLowerCase()+ $2 +'>';
		});

		return html;
	}
});

})(jQuery.jQEditor, jQuery);
(function(E, $){
var re = /^javascript:/i;

E.addFilter({
	name: 'xss',
	type: ['dom'],
	
	replace: function(win, dom) {
	
		if ( typeof dom !=='object') {
			return ;
		}
		
		$('a', dom).each(function(){
			var o = $(this), url = o.attr('href');
			if(!url) {return;}
			url = url.replace(/\s/g, '');
			if( re.test(url) ){
				o.replaceWith( o.html() );
			}
		});
		
		$('img', dom).each(function(){
			var o = $(this), url = o.attr('src');
			if(!url) {return;}
			url = url.replace(/\s/g, '');
			if( re.test(url) ){
				o.remove();
			}
		});
	}
});

})(jQuery.jQEditor, jQuery);
(function(E, $){
function Toolbar(editor) {
	if ( editor ) {
		editor.$toolbar = $('#'+editor.Eid+' .bke-toolbar');
	}
}

Toolbar.prototype = {
	isShow : function(cmd){
		var target = $('#'+E.curId+' [cmd='+cmd+']');
		return target.closest('.bke-btn').hasClass('bke-checked');
	},
	openPanel : function(cmd){
		var target = $('#'+E.curId+' [cmd='+cmd+']');
		var btn = target.closest('.bke-btn');
		var submenu = btn.find('.bke-submenu');
		if( submenu.length ){
			btn.addClass('bke-checked');
		}
	},
	closePanel : function(cmd){
		var target = $('#'+E.curId+' [cmd='+cmd+']');
		var btn = target.closest('.bke-btn');
		var submenu = btn.find('.bke-submenu');
		if( submenu.length ){
			btn.removeClass('bke-checked');
		}
	},
	fillPanel : function(cmd, html){
		var target = $('[cmd='+cmd+']');
		var btn = target.closest('.bke-btn');
		var submenu = btn.find('.bke-submenu');
		
		if( submenu.length ){
			submenu.each(function(){
				var o = $(this);
				if($.trim(o.html()) === ''){
					o.html(html);
				}
			});
		}
	},
	clearPanel : function(cmd){
		var target = $('[cmd='+cmd+']');
		var btn = target.closest('.bke-btn');
		var submenu = btn.find('.bke-submenu');
		if( submenu.length ){
			submenu.empty();
		}
	},
	hidePanel : function(except){
		var hideObj = E.curEditor.$toolbar.children('.bke-checked').has('div.bke-submenu');
		if(except){
			var target = E.curEditor.$toolbar.find('#icon-'+except);
			var btn = target.closest('.bke-btn');
			hideObj = hideObj.not(btn);
		}
		
		hideObj.removeClass('bke-checked');
	},
	
	togglePanel: function(cmd){
		if( !this.isShow(cmd) ){
			this.openPanel(cmd);
		}else{
			this.closePanel(cmd);
		}
	},
	
	// 禁用工具栏按钮，除了在names数组中指定的几个
	disabledAll: function( names ) {
		if ( !names || !(names instanceof Array) ) {
			names = [];
		}
		
		var cmds = [], o = E.curEditor.$toolbar;
		$.each(names, function(i, n){
			cmds.push('[cmd='+n+']')
		});
		
		o.children('.bke-btn').not(cmds.join(',')).addClass('bke-disabled');
	}
};

var toolbar = new Toolbar();
toolbar.ready = true;

//将缓存中的需要填充到下拉菜单中
//for(var panelCmd in E.toolbarPanel){
//	toolbar.fillPanel(panelCmd,E.toolbarPanel[panelCmd]);
//}

E.toolbar = toolbar;
E.Toolbar = Toolbar;

// ie6 下给工具栏增加鼠标触摸样式
if ( E.IE6 ) {
	$(document).delegate(".bke-btn", "mouseover", function(){
		$(this).addClass('bke-clicked');
	}).delegate(".bke-btn", "mouseleave", function(){
		$(this).removeClass('bke-clicked');
	});
	
	$(document).delegate(".bke-menu-item", "mouseover", function(){
		$(this).addClass('bke-menu-item-hover').children('.bke-menu-icon').addClass('bke-menu-icon-hover');
	}).delegate(".bke-menu-item", "mouseleave", function(){
		$(this).removeClass('bke-menu-item-hover').children('.bke-menu-icon').removeClass('bke-menu-icon-hover');
	});
}
})(jQuery.jQEditor, jQuery);