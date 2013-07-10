/*! Bkeditor - v0.9.0 - 2013-07-10
* https://github.com/daixianfeng/a
* Copyright (c) 2013 daixianfeng; Licensed MIT */
(function(E){
if( !window.FileReader || !window.XMLHttpRequest ){return;}

// 注册UI插件
E.addUi({
	id: 'ajaxuploaddialog',
	html: '<div class="bke-ajaxupload-progress"><div>文件上传中,请稍等...</div><span>10% ( 1.1MB / 2.0MB )</span><ol></ol></div>'
});

// 注册命令插件
E.addPlugin({
	id: 'ajaxupload',
	title: '文件上传',
	ui: 'ajaxuploaddialog',
	type: 'dialog'
});

// html5 粘帖剪切板图片到编辑器
// 火狐下不需要特殊处理，图片可以直接粘帖到编辑器
// chrome浏览器需要添加这个事件
if (/Chrome/i.test(navigator.userAgent)) {
	E.bind('ajaxupload-paste', 'paste', function(e){
		if( !e ){ return; }
		var clipboardData = e.event.originalEvent.clipboardData,
			items = clipboardData.items,
			item = items[0];
		
		if( item.kind=='file' && item.type.match(/^image\//i) ){
			var imagefile = item.getAsFile(),
				reader = new FileReader();
				
			reader.onload = function( ev ){
				var sHtml='<img src="'+ev.target.result+'"/>';
				E.pasteHTML(sHtml);
			}
			reader.readAsDataURL(imagefile);
			return false;
		}
	});
}

E.bind('ajaxupload-dragover', 'dragover', function(e) {
	// 如果编辑器内有选中的文本内容，则直接返回
	// 否则会导致文字不同用鼠标拖动
	var text = E.curEditor.getSelectionText();
	if ( text ) {
		return;
	}
	
	var dragimage = E.plugin("dragimage");
	if( dragimage && dragimage.mousedown ) {
		// 什么也不做
	} else {
		e.event.stopPropagation();
		e.event.preventDefault();
	}
});

E.bind('ajaxupload-drop', 'drop', function(e) {
	if( !e.event.originalEvent.dataTransfer.files.length ) {
		return;
	}
	
	var files = [],
		errors = [],
		conf = E.curEditor.config.cBase.ajaxupload,
		plugin = E.plugin('ajaxupload'),
		Client = {
			event: e.event,
			minsize: 1024*1024,
			maxsize: 1024*1024*1024*10,
			action: conf.uploadUrl,
			inputName: 'filedata',
			init: function( fileList ){
				plugin.click();
			},
			onprogress: function( o ){
				var el = $("#ajaxuploaddialog").find(".bke-ajaxupload-progress span");
				el.text(o.totalPercent+'% ( '+o.completeCount +'/'+o.totalCount+' )');
			},
			
			callback: function( file , data ){
				if( typeof data === 'object' ){
					if ( data.success ) {
						files.push( {url: data.url, file:file} );
					} else {
						// 上传失败时，要给出提示信息
						file.data = data;
						errors.push(file);
						var msg = data.msg || '未知错误';
						this.error(file, msg);
					}
				}
			},
			
			// 上传完成，将图片插入到编辑器
			oncomplete: function(){
				var html = []
				
				for( var i in files ){
					if ( files[i]['file'].type.match(/^image\//i) ) {
						html.push('<img src="'+ files[i].url +'" style="max-width:600px;" />');
					} else {
						html.push('<a href="'+ files[i].url +'" target="_blank">'+files[i].file.name+'</a>');
					}
				}
				
				E.curEditor.insert(html.join(''));
				
				// 有错误，弹窗不关闭
				console.log(errors);
				if ( errors.length ) {
					setTimeout(function(){
						$("#ajaxuploaddialog").find(".bke-ajaxupload-progress div").html('');
					}, 500);
				} else {
				// 如果没有错误，则弹窗自动关闭
					setTimeout(function(){
						E.dialog.close();
					}, 1000);
				}
				
			},
			
			
			
			error: function(file, msg) {
				$("#ajaxuploaddialog").find(".bke-ajaxupload-progress ol")
					.append('<li>'+ file.name +' 上传失败，原因: '+msg+'</li>')
			}
		};
	MainAjaxUpload.ondrop( Client );
});

// ajax 上传对象
var MainAjaxUpload = {
	xhr: new XMLHttpRequest(),
	
	// 调用者
	Client: null,
	
	// 已经完成上传的文件数
	completeCount: 0,
	
	// 所有文件的总数
	totalCount: 0,
	
	// 所有文件的总大小
	totalSize: 0,
	
	// 上传完成的文件总大小，默认值是1
	completeSize: 1,
	
	//是否正在上传图片
	isUploading: false,
	
	// 待上传的文件列表
	fileList: [],
	
	// 上传成功的文件列表
	successFileList: [],
	
	// 上传失败的文件列表
	failureFileList: [],
	
	// 初始化
	init: function( fileList ){
		if( this.isUploading ){
			return;
		}
		
		var self = this;
		self.completeCount = 1;
		//self.totalSize = 0;
		//self.completeSize = 0;
		
		self.fileList = fileList;
		self.successFileList = [];
		self.failureFileList = [];
		self.isUploading = true;
		self.totalCount = fileList.length;
		self.start( );
	},
	
	
	ondrop: function( Client ){
		var self = this,
			dataTransfer = Client.event.originalEvent.dataTransfer,
			fileList = [],
			files = dataTransfer.files;
			
		self.Client = Client;
		Client.event.stopPropagation();
		Client.event.preventDefault();
		
		for (var i=0, len = files.length; i<len; i++) {
			if ( files[i].size ) {
				fileList.push( files[i] );
				self.totalSize += files[i].size;
			}
		}
		
		if ( fileList.length ) {
			Client.init( fileList );
			self.init(fileList);
		}
	},
	
	// 开始上传
	start: function( ){
		var self = this,
			fileList = self.fileList,
			file = fileList.shift();
			
		if( file ){
			self.post( file );
		}else{
			// 所有文件上传完成
			self.complete();
		}
	},
	
	// 所有文件上传完成
	complete: function( ){
		var self = this;
		//setTimeout(function(){
			self.Client.oncomplete( );
			self.isUploading = false;
		//}, 1000);
	},
	
	// 每个文件上传完毕后调用
	callback: function( file, responseText ){
		var self = this, data;
		self.completeCount += 1;
		self.completeSize += (file.size || file.fileSize);
		
		try{
			data = $.parseJSON(responseText);
		}catch(ex){};
		
		//self.Client.callback( self.fileList[0], data ); // ? nextfile
		self.Client.callback( file, data );
	},
	
	// 显示进度条
	onprogress: function( ev, file ){
		var self = this;
		if( ev && ev.loaded >= 0 ) {
			var size = file.size || file.fileSize,
				currentPercent = Math.round( (ev.loaded * 100)/ size ),
				totalPercent = Math.round( ((ev.loaded + self.completeSize) * 100) / self.totalSize );
			var progress = {
				totalPercent: totalPercent, // 总进度百分数
				currentPercent: currentPercent, //当前文件进度百分数
				loaded: self.formatBytes(ev.loaded), //当前上传的块大小
				size: self.formatBytes(size), //当前上传的文件大小
				name: file.name || file.fileName, //当前上传的文件名称
				
				//当前已经上传完成的总大小
				completeSize: self.formatBytes(ev.loaded + self.completeSize), 
				totalSize: self.formatBytes(self.totalSize), //所有文件总大小
				completeCount: self.completeCount, //正在上传第几个文件
				totalCount: self.totalCount //总文件数
			};
			self.Client.onprogress( progress );
		} else {
			//不支持进度
			
		}
	},
	
	// 使用ajax方式向服务器发送文件
	// 每次发送一个文件
	post: function( file ){
		var self = this, xhr = self.xhr;
		xhr.onreadystatechange = function(){
			if (xhr.readyState === 4) {
				if ( xhr.status == 200 ) {
					// 上传成功
					self.successFileList.push( file );
					self.callback( file, xhr.responseText );
					// 继续下一个文件上传
					self.start();
				} else {
					// 上传错误
					self.failureFileList.push( file );
				}
			}
		};
		
		if ( xhr.upload ) {
			xhr.upload.onprogress = function( ev ){
				self.onprogress( ev, file );
			};
		} else {
			self.onprogress( false ); //不支持进度
		}
		
		xhr.open("POST", self.Client.action);
		xhr.setRequestHeader('Content-Type', 'application/octet-stream');
		xhr.setRequestHeader('Content-Disposition', 'attachment; name="'+self.Client.inputName+'"; filename="'+(file.name||file.fileName)+'"');
		
		if ( xhr.sendAsBinary ) {
			// Firefox 支持 sendAsBinary() 和 send() 方法
			// sendAsBinary() 不是标准方法，只能在firefox3.6+当中使用
			xhr.sendAsBinary( file.getAsBinary() );
		} else {
			// 2011-07-21
			// Chrome 浏览器不支持sendAsBinary方法，使用send()方法
			xhr.send(file);
		}
	},
	
	formatBytes: function(bytes) {
		var s = ['Byte', 'KB', 'MB', 'GB', 'TB', 'PB'];
		var e = Math.floor(Math.log(bytes)/Math.log(1024));
		return (bytes/Math.pow(1024, Math.floor(e))).toFixed(2)+s[e];
	}
}

})(jQuery.jQEditor);
(function(E, $){
var isToolbarFixed = false;

// 要想避免IE6下滚动时，固定(通过css表达式)元素发生抖动，
// 给 html 或 body 设置背景静止定位即可。
// 注意：IE6下如 body 已设置了背景静止定位，
// 	     再给 html 标签设置会让 body 设置的背景静止失效

if (E.IE6 && document.body.currentStyle.backgroundAttachment !== 'fixed') {
	var html = document.getElementsByTagName('html')[0];
	html.style.backgroundImage = 'url(about:blank)';
	html.style.backgroundAttachment = 'fixed';
}

// 调整所有编辑器的高度
E.addEvent({
	name : 'autoHeight',
	type : ['complete'],
	fn : function(arg){
		function f(t) {
			setTimeout(function(){
				$.each(E.editorList, function(i, editor){
					if ( editor.config.autoHeight) {
						autoHeight(editor);
					}
				});
			}, t);
			return f;
		}
		f(0)(300)(1000)(2000)(5000);
	}
});

// 调整当前编辑器的高度
E.addEvent({
	name : 'autoHeight',
	type : ['afterCommand', 'keyup'],
	fn : function(arg){
		if( E.curEditor.config.autoHeight) {
			autoHeight(E.curEditor);
		}
	}
});

// 必须激活当前编辑器，工具栏才会浮动
$(window).scroll(function(){
	$.each(E.editorList, function(i, editor){
		if ( E.curEditor === editor ) {
			fixedToolbar(editor);
		} else {
			var option = editor.config
				, toolbar = $('#'+editor.Eid).find('.bke-toolbar')

			toolbar.removeClass( option.fixedClassName );
		}
	});
});

// 记录每个编辑器工具栏距离顶部的距离
// 内容区域变化导致页面高度变化时，不会触发resize事件
// 所以，当编辑器被激活时，需要即时计算一下
function setToolbarTop(){
	function f( editor ) {
		var option = editor.config,
			toolbar = $('#'+editor.Eid).find('.bke-toolbar');
			
		if( toolbar.size() ){
			option.toolbarTop = toolbar.offset().top ? toolbar.offset().top : option.toolbarTop;
			// 给工具栏的父标签
			toolbar.parent().height( toolbar.outerHeight()-1 );
		}
	}
	
	$.each(E.editorList, function(i, editor){
		f( editor );
	});
}

E.addEvent({
	name : 'setToolbarTop',
	type : ['complete', 'active'],
	fn : function(arg){
		setTimeout(function(){setToolbarTop()}, 0);
	}
});

var timer2 = 0;
$(window).resize(function(){
	clearTimeout(timer2);
	timer2 = setTimeout(function(){setToolbarTop()}, 200);
});

// 根据内容自动调整编辑器的高度
function autoHeight( editor ){
	var dom = editor.dom,
		height = 0,
		tmpDiv = dom.createElement("DIV");
	
	tmpDiv.style.clear = "both";
	tmpDiv.style.display = "block";
	dom.body.appendChild(tmpDiv);
	
	height = Math.max(tmpDiv.offsetTop + 20, editor.config.height);
	dom.body.removeChild(tmpDiv);
	
	var o = $('#'+editor.Eid);
	
	if ( o.find('iframe').is(':visible') ){
		o.find('iframe:visible').height( height );
		o.find('.bke-iframeholder').height(height);
	}
	o.find('.bke-iframeholder textarea').height(height);
}

// 滚动时，将工具栏固定在页面顶部
function fixedToolbar( editor ){
	var scrollTop = $(window).scrollTop(),
		option = editor.config,
		o = $('#'+editor.Eid),
		toolbar = o.find('.bke-toolbar'),
		maxScroll = 0;
	
	if( !toolbar.size() || !option.autoHeight ){
		return;
	}
	// 编辑器的左上角Y坐标 + 编辑器的高度 - 30
	maxScroll = o.offset().top + o.height() - 30;
	
	if( option.toolbarTop && (scrollTop < option.toolbarTop || scrollTop > maxScroll)){
		// 满足如下条件时，还原工具栏
		// 1. 工具栏超过了编辑器区域最下面的边
		// 2. 页面滚动的高度尚未达到工具栏最小浮动高度
		
		toolbar.removeClass( option.fixedClassName );
		if ( E.IE6 ) {
			toolbar[0].style.removeExpression('top');
			toolbar[0].style.position='static';
		}
		isToolbarFixed = false;
	}else{
		// 仅首次浮动事件触发操作
		if( !isToolbarFixed ){
			toolbar.width(toolbar.width()).addClass(option.fixedClassName);
			if ( E.IE6 ) {
				toolbar[0].style.setExpression('top', 'eval(document.documentElement.scrollTop)+"px"');
				toolbar[0].style.position='absolute';
			}
		}
		
		isToolbarFixed = true;
	}
}
})(jQuery.jQEditor, jQuery);
(function(E, $){

E.addEvent({
	name: 'contextmenu',
	type: ['contextmenu'],
	area: 'editArea',
	fn: function( e ) {
		var shortcutmenu = E.plugin("shortcutmenu");
		if( shortcutmenu && !shortcutmenu.contextmenu() ){
			return;
		}
		var menulist = [];
		menulist.push(
			{name: '全选', cmd: 'selectall', icon: 'bke-SelectAll'},
			{name: '清空文档', cmd: 'cleardoc', icon:'bke-ClearDoc'},
			{name: 'separator'}
		);
		
		var $table = $(e.target).closest('table');
		if ( $table.length ) {
			menulist = intable(menulist, $table);
		} else {
			menulist.push(
				{name: '段落格式', icon:'bke-JustifyFull', submenu: [
					{name:'左对齐',cmd:'justifyleft', icon:'bke-JustifyLeft'},
					{name:'右对齐',cmd:'justifyright', icon:'bke-JustifyRight'},
					{name:'居中对齐',cmd:'justifycenter', icon:'bke-JustifyCenter'},
					{name:'两端对齐',cmd:'justifyfull', icon:'bke-JustifyFull'}
				]},
				{name: '插入表格', icon:'bke-InsertTable', submenu: E.utils.execPlugin('tablemenu','getTablePanel')}
			);
		}
		
		menulist.push(
			{name: 'separator'},
			{name: '段前插入段落', cmd: 'insertparagraphbefore', param: ''},
			{name: '段后插入段落', cmd: 'insertparagraphafter', param: ''},
			{name: '复制(Ctrl + c)', icon:'bke-Copy', cmd: 'copy'},
			{name: '粘帖(Ctrl + v)', icon:'bke-Paste', cmd: 'paste'},
			{name: '插入代码', icon:'bke-Code', cmd: 'highlightcode'}
		);
		
		E.Menu.contextmenu(menulist, e);
		
		// 选中区域点击
		if($(e.target).hasClass('selectCellClass')){
			
		}
	}
});

// 构造表格相关右键菜单
function intable(menulist, $table) {
	var tmenu = {
		name: '表格',
		icon: 'bke-InsertTable', 
		submenu: [
			{name:'删除表格', icon:'bke-RemoveTable', cmd:'deletetable'},
			{name:'-'},
			{name:'左插入列', icon:'bke-ColumnInsertBefore', cmd:'insertcolbefore'},
			{name:'右插入列', icon:'bke-ColumnInsertAfter', cmd:'insertcolafter'},
			{name:'上插入行', icon:'bke-RowInsertBefore', cmd:'insertrowbefore'},
			{name:'下插入行', icon:'bke-RowInsertAfter', cmd:'insertrowafter'},
			{name:'-'},
			{},
			{},
			{name:'-'},
			{name:'合并单元格', icon:'bke-CellCombine', cmd:'combinecells'},
			{name:'向下合并', icon:'bke-RowMergeAfter', cmd:'combinerowafter'},
			{name:'向右合并', icon:'bke-ColumnMergeAfter', cmd:'combinecolafter'},
			{name:'-'},
			{name:'表格属性', icon:'bke-TableProps', cmd:'tableprops'}
		]};
	
	if( $table.find('caption').length ){
		tmenu.submenu[7] = {name:'删除表格名称', cmd:'tabletitle'};
	} else {
		tmenu.submenu[7] = {name:'插入表格名称', cmd:'tabletitle'};
	}
	
	if( $table.find('th').length ){
		tmenu.submenu[8] = {name:'删除表格标题行', cmd:'tablehead'};
	} else {
		tmenu.submenu[8] = {name:'插入表格标题行', cmd:'tablehead'};
	}
	menulist.push(tmenu);
	
	menulist.push(
		{name:'单元格对齐方式', icon:'bke-JustifyFull', submenu:[
			{name:'居左', cmd:'celljustify', param:'4'},
			{name:'居中', cmd:'celljustify', param:'5'},
			{name:'居右', cmd:'celljustify', param:'6'},
			{name:'-'},
			{name:'居左（靠上）', cmd:'celljustify', param:'1'},
			{name:'居中（靠上）', cmd:'celljustify', param:'2'},
			{name:'居右（靠上）', cmd:'celljustify', param:'3'},
			{name:'-'},
			{name:'居左（靠下）', cmd:'celljustify', param:'7'},
			{name:'居中（靠下）', cmd:'celljustify', param:'8'},
			{name:'居右（靠下）', cmd:'celljustify', param:'9'}
		]},
		{name:'表格对齐方式', submenu:[
			{name:'左浮动', cmd:'tablefloat', param:'1'},
			{name:'居中', cmd:'tablefloat', param:'2'},
			{name:'右浮动', cmd:'tablefloat', param:'3'}
		]}
	);
	
	var cellBackgroundColor = {
			name: '单元格背景色',
			submenu: E.utils.execPlugin('colormenu','getCellcolorPicker')
		};
		
	menulist.push(cellBackgroundColor);
	
	return menulist;
}

})(jQuery.jQEditor, jQuery);
(function(E, $){

E.addEvent({
	name: 'cursorelements',
	type: ['mousedown','keyup'],
	area: 'editArea',
	fn: function(e) {
		var target = e.target;
		
		// 注意
		// keyup 事件时得到的e.target是body元素，需要修正为光标处的元素
		if ( $(target).is('body') ) {
			var tree = E.utils.getCurElement();
			tree.pop();
			target = tree.pop();
		}
		
		var els = {}
			, o = E.$(target)
			, hn = o.closest('h1,h2,h3,h4,h5,h6,h7')
			, a = o.closest('a')
			, img = o.closest('img')
			, pre = o.closest('pre')
			, sub = o.closest('sub')
			, refer = o.closest('sup.refer')
			, sup = o.closest('sup')
			, cell = o.closest('td,th')
			, row = cell.closest('tr')
			, table = row.closest('table')
			, ol = o.closest('ol')
			, ul = o.closest('ul')
			, embed = o.closest('embed')
			
		if ( hn.length ) els['hn'] = hn[0]
		if ( a.length ) els['a'] = a[0]
		if ( img.length ) els['img'] = img[0]
		if ( pre.length ) els['pre'] = pre[0]
		if ( sub.length ) els['sub'] = sub[0]
		if ( refer.length ) els['refer'] = refer[0]
		if ( sup.length ) els['sup'] = sup[0]
		if ( cell.length ) els['cell'] = cell[0]
		if ( row.length ) els['row'] = row[0]
		if ( table.length ) els['table'] = table[0]
		if ( ol.length ) els['ol'] = ol[0]
		if ( ul.length ) els['ul'] = ul[0]
		if ( embed.length ) els['embed'] = embed[0]
		
		E.curEditor.cursorElements = els;
	}
});

})(jQuery.jQEditor, jQuery);
(function(E,$){
	/**
	* @description 为工具条上的各个图标添加a标签，防止编辑器失去焦点，并且添加说明
	* @author	潘雪鹏
	* @createTime 2013.01.21 
	**/
	function _appendA(o){
		var method='html', text = '', cmd=o.closest('[cmd]').attr('cmd'), title="";
		if ($.trim(o.text())) {
			text = o.text();
			title = o.text();
		} else {
			title = E.getLang('labelMap.'+cmd.toLowerCase()) || o.text();
		}
		
		if ( o.children().size() ) {
			method = 'prepend';
		}
		
		o[method]('<a href="javascript: void(\''+ cmd +'\')" title="'+title+'">'+text+'</a>');
	}	
	/****************************************************************************/
	/** 编辑器执行流程时相关事件                                               **/
	/****************************************************************************/

	// E.addEvent({
		// name : 'initCustomEvent',
		// type : ['ready','create','complete','afterUi','afterPlugin',
				// 'beforePaste','beforeCommand','afterCommand','afterLoad'],
		// fn : function(arg){
		//	E.log.writeLog('Custom-Event Start.','event');return false;
		// }
	// });
	
	// 在执行命令之前隐藏工具栏的面板、记录历史记录
	E.addEvent({
		name: 'commandHidePanel',
		type: ['beforeCommand'],
		fn: function(arg){
			var cmd = arg.commandName;
			E.toolbar.hidePanel(cmd);
			
			if (E.curEditor.baseHistory) {
				if(cmd !== 'revert' && cmd !== 'redo' && cmd !== 'codemirror' && cmd !== 'source'){
					E.curEditor.baseHistory.prepareHistory();
				}
			}
		}
	});
	
	// 在命令执行之后记录历史记录
	E.addEvent({
		name : 'recordHistory',
		type : ['afterCommand'],
		fn : function(arg){
			if(E.curEditor.baseHistory){
				if(arg.commandName !== 'revert' && arg.commandName !== 'redo'){
					E.curEditor.baseHistory.recordHistory();
				}
			}
			
			// 这这些代码应该以事件形式，分别放到各自的代码里面
			// if(E.pluginList['element']){
				// E.pluginList['element'].click();
			// }
			// if(E.pluginList['icon']){
				// E.pluginList['icon'].click();
			// }
		}
	});
	
	/**
	* @description 在编辑器实例化完成时，初始化工具条，并填充面板（菜单）
	* @author	方龙
	* @createTime 2013.01.21 
	**/
	E.addEvent({
		name : 'toolbarinit',
		type : ['complete'],
		fn : function(arg){
			var config = E.editorList[arg.Eid].config;
			var toolbar =$('[ref="'+arg.Eid+'"] .bke-toolbar');
			
			toolbar.find('.bke-icon, .bke-caret').each(function(){
				_appendA($(this));
			});
			
			//根据配置cTools让工具栏显示隐藏
			// var tools = [];
			// if(typeof config.toolbar !== 'string'){
				// tools = config.toolbar;
			// }else if(typeof config.cTools[config.toolbar] === 'undefined'){
				// tools = config.cTools['all'];
			// }else{
				// tools = config.cTools[config.toolbar];
			// }
			
			toolbar.find('div[cmd],span[cmd]').each(function(){
				var o = $(this),
					cmd = o.attr('cmd');
					
				// 暂时不考虑根据配置文件修改工具条
				// if (!o.hasClass('bke-caret')){
					// if ($.inArray(cmd.toLowerCase(),tools)<0){
						// var submenu = o.closest('.bke-submenu');
						// if(!submenu.size()){
							// var menu = o.closest('.bke-icon-menu');
							// if (menu.size()){
								// menu.hide();
							// } else {
								// o.hide();
							// }
						// }
						
					// }
				// }
				
				//为了定位图标节点，使用id查找在ie下查找会快很多
				o.attr('id','icon-'+cmd);
			});
			toolbar.find('.bke-text').each(function(){
				var o = $(this);
				if( o.find('.bke-caret').size() ){
					o.find('.bke-caret').prev().each(function(){
						_appendA($(this));
					});
				} else {
					_appendA(o);
				}
			});
			
			//根据配置cTools调整工具栏显示顺序
			/*
			for (var i=0;i< tools.length; i++){
				var currentcmd = toolbar.find('div[cmd='+tools[i]+'],span[cmd='+tools[i]+']'),
					closestcmd = currentcmd.closest('.bke-icon-menu');
				if (closestcmd.size()){
					toolbar.append(closestcmd);
				} else {
					toolbar.append(currentcmd);
				}
			}
			*/
			//$('#'+arg.Eid+' .bke-toolbarbox').show();

			// 在编辑器创建完成时重置工具栏图标
			//if(E.pluginList['icon']){
			//	E.pluginList['icon'].click();
			//}
		}
	});
})(jQuery.jQEditor, jQuery);
(function(E,$){
	/**
	* @description
	* 委托点击事件，带有cmd属性的，将会执行编辑器命令
	**/
	$('.bke-dialog').live('click',function(e){
		var tar = $(e.target);
		var cmd = tar.attr('cmd');
		var param = tar.attr('param');
		var id = tar.closest(".bke-dialog").attr('id');
		if( tar.attr('cmd') ){
			E.command(id,cmd,param);
			return false;
		}
	});
})(window.jQuery.jQEditor,window.jQuery);
(function(E, $) {

E.addPlugin({
	id: 'dragimage',
	
	// 此属性在 ajaxupload.event.js 被使用
	mousedown: false
});

var index = 0

// 给图片和其外部的div增加id属性
function reset() {
	var imgs = E.$("img");
	
	imgs.each(function() {
		var o = $(this);
		o.attr('id', "img-"+index);
		o.closest('div.img').attr('id', "wrap-img-"+index);
		index += 1;
	});
}

// 拖动图片
// @param img {jQueryElement}
function dragImage(img) {
	var wrap = img.closest("div.img"),
		id = img.attr('id');
		
	// 如果图片未被拖拽走，则终止
	if ( wrap.length ) {
		return;
	}
	
	
	// 2012-01-17 22:24 潘雪鹏
	// 必须延迟执行，ie否则可能不成功
	// 当图片外面有超链接时，拖动时会带着超链接一起拖走
	
	E.$("#wrap-"+id).hide();
	E.curEditor.baseHistory.prepareHistory();
	setTimeout(function() {
		var img = E.$("#"+id), wrap = E.$("#wrap-"+id);
		if( img.parent().is('a') ) {
			img.parent().after( wrap );
			wrap.prepend( img.parent() );
		} else {
			img.after( wrap );
			wrap.prepend( img );
		}
		wrap.show();
		E.curEditor.baseHistory.recordHistory(1);
		E.trigger('mouseup');
	}, 0);
}

var image;
E.addEvent({
	name : 'dragimage-mousedown',
	type : ['mousedown'],
	area : 'editArea',
	fn : function(e) {
		if( e.target.nodeName.toLowerCase() === 'img' ){
			// 将图片选中
			image = e.target;
			E.plugin("dragimage").mousedown = true;
			// 针对 ie8/7/6 需要在这里绑定dragend事件
			if (/MSIE [678]\.0/i.test(navigator.userAgent)) {
				E.$(image).unbind('dragend').bind('dragend', function(){
					dragImage( E.$(this) );
				});
			}
		} else {
			image = null;
		}
		
	}
});

E.bind('dragimage-mouseup', 'mouseup', function() {
	E.plugin("dragimage").mousedown = false;
});

// 目前(2013-05-31)
// dragend 事件 chrome/firefox/ie9+ 都支持，ie8/7/6需将此事件绑定到图片节点上
E.addEvent({
	name : 'dragimage-dragend',
	type : ['dragend'],
	area : 'editArea',
	fn : function( ) {
		if ( image ) {
			dragImage( E.$(image) );
		}
		
		// chrome下面有点特殊
		// 当使用鼠标点击图片并拖动时，会丢失超链接
		// 如果是先点击一下图片，放开鼠标，再拖动图片则可以带着超链接一起拖动
	}
});

// 初始化图片id，给拖动操作使用
E.addEvent({
	name : 'dragimage-complete',
	type : ['complete'],
	fn : function( ) {
		reset();
	}
});
})(jQuery.jQEditor, jQuery);

(function(E,$){
	var elist = 'click,mousedown,mouseup,mouseenter,mouseleave,scroll,keypress,keyup,keydown,paste,beforepaste,dragenter,dragover,drop,dragleave,dragend'.split(',');
	
	// 事件关联
	function ln($dom, type, curEditor) {
		// IE 下的粘帖事件不能绑定到document上，否则不起作用
		if ( E.IE && /paste/i.test(type) ) {
			$dom = $dom.find('body');
		}
		
		$dom.bind(type, function(e) {
			return E.trigger(type, {
				targetElement: e.target,
				target: e.target,
				event: e,
				targetEditor: curEditor
			});
		});	
	}
	
	/**
	* @description
	* 监听编辑区域浏览事件
	* 之后触发对应自定义事件，
	* ps:编辑区域的事件相当于特殊的自定义事件，需要在此委托到浏览器
	**/
	E.listenEditarea = function(curEditor){
		var $dom = $(curEditor.dom);
		
		// 处理右键菜单
		$dom.bind('contextmenu', function(e) {
			if( e.ctrlKey || e.shiftKey || e.altKey ){
				return true;
			} else {
				E.trigger('contextmenu', {
					targetElement: e.target,
					target: e.target,
					clientX: e.clientX,
					clientY: e.clientY,
					targetEditor: curEditor
				});
				return false;
			}
		});
		
		for( var i=0, len=elist.length; i< len; i++ ){
			var type = $.trim(elist[i]);
			ln($dom, type, curEditor);
		}
		var pasteTime = E.IE ? 'beforepaste' : 'paste';
		//必须绑定到dom下面的某一个节点上面，不能绑定到dom上，在ie不会被触发
		$dom.find('body').bind(pasteTime,function(e){
			E.utils.execPlugin('paste','paste');
		});
		$dom.find('body').bind('beforecopy',function(e){
			$dom.find('body').unbind(pasteTime);
			setTimeout(function(){
				$dom.find('body').bind(pasteTime,function(e){
					E.utils.execPlugin('paste','paste');
				});
			},0);
			E.IE && E.errorMessage('请使用 Ctrl+v 进行粘贴');
		});
		$dom.bind('keydown',function(e){
			if (e.shiftKey && e.which === 13){//shift+enter
			//alert(1);return false;
			}else if (e.ctrlKey && e.which === 13){//ctrl+enter
			//alert(2);return false;
			}else if (e.ctrlKey && e.which === 67){//ctrl+c
				//alert(3);
			}else if (e.ctrlKey && e.which === 86){//ctrl+v
				//alert(4);
			}else if (e.ctrlKey && e.which === 88){//ctrl+x
				//alert(5);
			}else if (e.ctrlKey && e.which === 66){//ctrl+b
				E.command('bold');return false;
			}else if (e.ctrlKey && e.which === 73){//ctrl+i
				E.command('italic');return false;
			}else if (e.ctrlKey && e.which === 85){//ctrl+u
				E.command('underline');return false;
			}else if (e.ctrlKey && e.which === 90){//ctrl+z
				E.command('undo');return false;
			}else if (e.ctrlKey && e.which === 89){//ctrl+y
				E.command('redo');return false;
			}else if (e.ctrlKey && e.which === 65){//ctrl+a
				E.curEditor.selectAll();return false;
			}else if (e.ctrlKey && e.which === 70){//ctrl+f
				E.command('search');return false;
			}else if (e.ctrlKey && e.which === 72){//ctrl+h
				E.command('replace');return false;
			}else if (e.ctrlKey && e.which === 83){//ctrl+s
				//alert(11);return false;
			}else if (e.which === 13){//enter
				E.curEditor.baseHistory.prepareHistory();
				setTimeout(function(){
					E.curEditor.baseHistory.recordHistory();
				},0);
			}else if (e.which === 8){//backspace

			}else if (e.which === 46){//delete

			}else{

			}
			setTimeout(function(){
				var curTime = +(new Date());
				if(curTime - curEditor.baseHistory.getLastTime() > 3000){
					E.curEditor.baseHistory.prepareHistory();
					E.curEditor.baseHistory.recordHistory();
				}
			},0);
		});

		// 鼠标移入到某个编辑区域时，设置相关属性值
		$dom.bind('mouseenter',function(e){
			if ( E.curId !== curEditor.Eid ) {
				E.curId = curEditor.Eid;
				E.curEditor = curEditor;
				// 触发编辑器激活事件
				E.trigger('active', {editor:curEditor});
			}
		}).bind('mousedown',function(e){
		
			$dom.bind('mousemove.drag',function(e){
				E.trigger('drag',{
					targetElement : e,
					targetEditor : curEditor
				});
			});
		}).bind('mouseup',function(e){
			$dom.unbind('mousemove.drag');
		});
	};
	/****************************************************************************/
	/** 编辑器内容区域相关事件                                                 **/
	/****************************************************************************/
	// 点击参考资料时，修正光标位置到参考资料的后面
	E.addEvent({
		name : 'modify-refer-range',
		type : ['keydown'],
		area : 'editArea',
		fn : function(e){
			var editor = E.curEditor
				, el = editor.getCursorNode();
				
			if ( E.$(el).is('sup.refer') ) {
				var range = editor.getRange()
					, text = editor.createTextNode()
					
				E.$(el).after(text);
				editor.selectNode(text);
			}
		}
	});
	
	// 在点击编辑区域或是编辑区域输入时隐藏工具栏的面板
	E.addEvent({
		name : 'editareaHidePanel',
		type : ['mousedown','keydown'],
		area : 'editArea',
		fn : function(){
			E.toolbar.hidePanel();
		}
	});
	
	// webkit内核浏览器下，点击图片默认不会像ie/firefox一样选中图片
	// 需特殊处理，使其点击图片将图片处于选中状态
	if (/AppleWebKit/i.test(navigator.userAgent)) {
		E.addEvent({
			name : 'selectimg',
			type : ['mousedown'],
			area : 'editArea',
			fn : function(arg) {
				if( arg.target.nodeName.toLowerCase() === 'img' ){
					// 将图片选中
					E.utils.selectNode(E.curEditor.win, arg.target);
				}
				
			}
		});
	}
})(window.jQuery.jQEditor,window.jQuery);
(function(E,$){

	/****************************************************************************/
	/** 编辑器执行流程时相关事件                                               **/
	/****************************************************************************/

	
	/****************************************************************************/
	/** 编辑器内容区域相关事件                                                 **/
	/****************************************************************************/
	E.listenEditareaExt = function(curEditor){
		var $dom = $(curEditor.dom);
		/******************************************************/
		/** 表格相关扩展事件                                 **/
		/******************************************************/
		var selectTableClass = E.config.selectTableClass;
		var selectCellClass = E.config.selectCellClass;
		
		$dom.delegate('td,th', 'mousedown', function(e){
			// 这里不再需要设置E.Eid等属性
			// 鼠标一进步编辑区域就会自动设置上这些属性
			
			//开始操作前更新表格，防止属性遗失不能操作;
			E.utils.execPlugin('table','freshTableIndex',$(e.target).closest('table'));
			// 如果是拖动边线调整单元格大小则不选中
			var cursorState = $dom.find('body').css('cursor');
			if(cursorState === 'row-resize' || cursorState === 'col-resize'){
				//不影响后续事件触发（调整单元格大小）
				return true;
			}
			// [TODO]
			if(e.which === 1){
				//记录起始位置
				var scope = {
					col_1 : $(e.target).attr('col'),
					row_1 : $(e.target).attr('row')
				};
				var $cells = $(e.target).closest('table').find('th,td');
				//绑定选中事件（鼠标移动事件）
				$cells.not($(e.target)).bind('mousemove.selectCell',function(e2){
					var $target = $(e2.target), $table = $target.closest('table');
					//选中
					E.utils.removeSelection(E.curEditor.win);
					$cells.removeClass(selectCellClass);
					scope['col_2'] = $target.attr('col');
					scope['row_2'] = $target.attr('row');
					var col_2 = Math.max(scope['col_1'],scope['col_2']),
						col_1 = Math.min(scope['col_1'],scope['col_2']);
					var row_2 = Math.max(scope['row_1'],scope['row_2']),
						row_1 = Math.min(scope['row_1'],scope['row_2']);
					//获取最小范围的矩形，已知的两端坐标
					var selectIndex = getRectangleCells($table,{colStart:col_1,colEnd:col_2,rowStart:row_1,rowEnd:row_2});
					col_2 = selectIndex['colEnd'],col_1 = selectIndex['colStart'];
					row_2 = selectIndex['rowEnd'],row_1 = selectIndex['rowStart'];
					var selTr = $table.find('tr:not(:gt('+row_2+'),:lt('+row_1+'))');
					/*
					不能这样写，因为如果同一行有th又有td会错位
					var selTd = selTr.find('td:not(:gt('+col_2+'),:lt('+col_1+')),th:not(:gt('+col_2+'),:lt('+col_1+'))');
					*/
					var selTd = $();
					selTr.each(function(){
						selTd = selTd.add($(this).find('td,th').not(':gt('+col_2+'),:lt('+col_1+')'));
					});
					selTd.addClass(selectCellClass);
					E.utils.removeSelection(E.curEditor.win);
				});
				$cells.bind('mouseenter',function(e2){
					$cells.removeClass(selectCellClass);
					if(E.curEditor.win.getSelection().type === 'None'){
						/*当拖动时移出编辑器内容区时，会产生编辑器内容区域无选中区*/
						$cells.unbind('mouseenter mousemove.selectCell');
					}else{
						E.utils.setCursor(E.curEditor.win,e.target,true);
					}
				}).bind('mouseup',function(e2){
					$cells.unbind('mouseenter');
				});
			}
		});
		
		$dom.delegate('body', 'mousedown', function(e){
			// 点击内容区域取消表格选中效果
			
			if(e.which === 1){
				var o = $(this);
				o.find('table').removeClass(selectTableClass);
				o.find('td,th').removeClass(selectCellClass);
			}
			
		}).delegate('body', 'mouseup', function(e){
			// 解除单元格的事件绑定
			// this = body 元素
			$(this).find('td,th').unbind('mouseenter mousemove.selectCell mouseup');
			
		});
		
		var timer = 0;
		// 鼠标移动掉表格上时
		// 在表格左上角显示一个全选表格的小图标
		$dom.delegate('table', 'mouseenter', function(){
			clearTimeout(timer);
			//显示全选图标
			var o = $(this),
				offset = o.offset();
				
			$('.bke-selecttablebar').data('table', o).css({
				top: offset.top - 20,
				left: offset.left - 20
			}).show();
			
		}).delegate('table', 'mouseleave', function(){
			// 鼠标手势变成默认情况
			$dom.find('body').css('cursor','default');
			// 鼠标移出表格时删除全选图标
			clearTimeout(timer);
			timer = setTimeout(function(){
				$('.bke-selecttablebar').hide();
			}, 200);
		});
		
		$('#'+curEditor.Eid).delegate('.bke-selecttablebar', 'click', function(){
			// 全选表格时，是给整个表格加背景色，不再针对单元格
			var table = $(this).data('table');
			
			// 移除单元格背景样式
			table.find('td,th').removeClass(selectCellClass);
			
			// 给表格加背景样式
			table.toggleClass(selectTableClass);
			
			return false;
		}).delegate('.bke-selecttablebar', 'mouseenter', function(){
			clearTimeout(timer);
		}).delegate('.bke-selecttablebar', 'mouseleave', function(){
			// 鼠标移出表格时删除全选图标
			clearTimeout(timer);
			timer = setTimeout(function(){
				$('.bke-selecttablebar').hide();
			}, 200);
		});
		
		$dom.delegate('td','mousemove.cursorState',function(e){
			lineState(e);
		});
		
	};
	
	// 获取一个矩形的单元格选择区域
	function getRectangleCells(table,index){
		var pluTable = E.pluginList['table'];
		var maxRow = $(table).find('tr').length-1;
		var maxCol = $(table).find('tr:first').find('th,td').length-1;
		var colStart = index.colStart,
			colEnd = index.colEnd,
			rowStart = index.rowStart,
			rowEnd = index.rowEnd;
		checkall:while(1){
			var curCell = {};
			var colInfo = {},rowInfo = {};
			if(colStart > 0){
				checkleft:for(var i=rowStart;i<=rowEnd;i++){
					curCell = $(table).find('[col='+colStart+'][row='+i+']');
					rowInfo = pluTable._rowInfo(curCell);
					if(rowInfo.isInRow < 0){
						if(rowInfo.lastColspan > 1){
							if(rowInfo.isInRow + rowInfo.lastColspan > 0){
								colStart -= 1;
								continue checkall;
							}
						}
					}else{
						colInfo = pluTable._colInfo(curCell);
						if(colInfo.isInCol >= 0){
							colStart -= 1;
							continue checkall;
						}
					}
				}
			}else{
				colStart = 0;
			}
			if(rowStart > 0){
				checktop:for(var j=colStart;j<=colEnd;j++){
					curCell = $(table).find('[row='+rowStart+'][col='+j+']');
					colInfo = pluTable._colInfo(curCell);
					if(colInfo.isIncol < 0){
						if(colInfo.lastRowspan > 1){
							if(colInfo.isIncol + colInfo.lastRowspan > 0){
								rowStart -= 1;
								continue checkall;
							}
						}
					}else{
						rowInfo = pluTable._rowInfo(curCell);
						if(rowInfo.isInRow >= 0){
							rowStart -= 1;
							continue checkall;
						}
					}
				}
			}else{
				rowStart = 0;
			}
			if(colEnd < maxCol){
				checkright:for(var i=rowStart;i<=rowEnd;i++){
					curCell = $(table).find('[col='+colEnd+'][row='+i+']');
					rowInfo = pluTable._rowInfo(curCell);
					if(rowInfo.isInRow < 0){
						if(rowInfo.lastColspan > 1){
							if(rowInfo.isInRow < -1){
								colEnd += 1;
								continue checkall;
							}
						}
					}
				}
			}else{
				colEnd = maxCol;
			}
			if(rowEnd < maxRow){
				checkbottom:for(var j=colStart;j<=colEnd;j++){
					curCell = $(table).find('[row='+rowEnd+'][col='+j+']');
					colInfo = pluTable._colInfo(curCell);
					if(colInfo.isInCol < 0){
						if(colInfo.lastRowspan > 1){
							if(colInfo.isInCol < -1){
								rowEnd += 1;
								continue checkall;
							}
						}
					}
				}
			}else{
				rowEnd = maxRow;
			}
			break checkall;
		}
		return {
			colStart :colStart,
			colEnd : colEnd,
			rowStart: rowStart,
			rowEnd : rowEnd
		};
	}
	function lineState(e){
		var curTd = e.target,
			curTable = $(curTd).closest('table'),
			curBody = $(curTd).closest('body');
		var cursorLeft = e.offsetX;
		var tdWidth = curTd.offsetWidth;
		var cursorTop = e.offsetY;
		var tdHeight = curTd.offsetHeight;
		curTable.unbind('mousedown.dragLine');
		if(cursorLeft < 4){
			curBody.css('cursor','col-resize');
			dragLine(curTable,{leftTd:$(curTd).prev('td').not(':hidden')[0] ,rightTd:curTd},false);
		}else if(tdWidth - cursorLeft < 4){
			curBody.css('cursor','col-resize');
			dragLine(curTable,{leftTd:curTd,rightTd:$(curTd).next('td').not(':hidden')[0]},false);
		}else if(cursorTop < 4){
			curBody.css('cursor','row-resize');
			var colIndex = parseInt($(curTd).attr('col'));
			var topTd = $(curTd.parentNode).prev('tr').length ? $(curTd.parentNode).prev('tr').find('td').eq(colIndex).not(':hidden')[0] : undefined;
			dragLine(curTable,{topTd:topTd,bottomTd:curTd},true);
		}else if(tdHeight - cursorTop < 4){
			curBody.css('cursor','row-resize');
			var bottomTd = $(curTd.parentNode).next('tr').length ? $(curTd.parentNode).next('tr').find('td').eq(colIndex).not(':hidden')[0] : undefined;
			dragLine(curTable,{topTd:curTd,bottomTd:bottomTd},true);
		}else{
			curBody.css('cursor','default');
			curTable.unbind('mousedown.dragLine');
		}
	}
	function dragLine(curTable,changeTd,ver){
		var curBody = $(curTable).closest('body');
		if(changeTd.topTd === undefined && ver === true){
			return 0;
		}else if(changeTd.leftTd === undefined && ver === false){
			return 0;
		}
		$(curTable).bind('mousedown.dragLine',function(e){
			$(curTable).find('td').unbind('mousemove.cursorState');
			var oriClientX = e.clientX;
			var oriClientY = e.clientY;
			$(curTable).parent().append('<div></div>');
			var cellLine = $(curTable).parent().children(':last');
			cellLine.css('position','absolute');
			cellLine.css('display','block');
			cellLine.css('width','1px');
			cellLine.css('height','1px');
			cellLine.css('z-index','11');
			ver  === true ? cellLine.width($(curTable).find('tbody').width()) : cellLine.height($(curTable).find('tbody').height());
			var tdTop = $(curTable).offset()['top'],tdLeft = $(curTable).offset()['left'];
			ver  === true ? tdTop += $(changeTd.topTd)[0].offsetTop + $(changeTd.topTd)[0].offsetHeight : tdLeft += $(changeTd.leftTd)[0].offsetLeft + $(changeTd.leftTd)[0].offsetWidth;
			cellLine.css('top',tdTop);
			cellLine.css('left',tdLeft);
			cellLine.css('background-color','green');
			$(curBody).bind('mousemove.changeCell',function(e){
				E.utils.removeSelection(E.curEditor.win);
				var newClientX = e.clientX;
				var newClientY = e.clientY;
				if(ver){
					if(newClientY-oriClientY + $(changeTd.topTd)[0].offsetHeight > 45){
						cellLine.css('top',tdTop+newClientY-oriClientY);
					}
				}else{
					if(newClientX-oriClientX + $(changeTd.leftTd)[0].offsetWidth > 45 && (!changeTd.rightTd || $(changeTd.rightTd)[0].offsetWidth - (newClientX-oriClientX) > 45)){
						cellLine.css('left',tdLeft+newClientX-oriClientX);
					}
				}
				E.utils.removeSelection(E.curEditor.win);
			}).bind('mouseup.changeCell',function(e){
				var newClientX = e.clientX;
				var newClientY = e.clientY;
				var changePx = 0;
				if(ver){
					if(newClientY-oriClientY + $(changeTd.topTd)[0].offsetHeight > 45){
						changePx = newClientY-oriClientY;
					}else{
						changePx = 45-$(changeTd.topTd)[0].offsetHeight;
					}
				}else{
					if(newClientX-oriClientX + $(changeTd.leftTd)[0].offsetWidth > 45 && (!changeTd.rightTd || $(changeTd.rightTd)[0].offsetWidth - (newClientX-oriClientX) > 45)){
						changePx = newClientX-oriClientX;
					}else if(newClientX-oriClientX + $(changeTd.leftTd)[0].offsetWidth > 45){
						changePx = $(changeTd.rightTd)[0].offsetWidth-45;
					}else{
						changePx = 45-$(changeTd.leftTd)[0].offsetWidth;
					}
				}
				moveLine(changeTd,changePx,ver);
				E.utils.removeSelection(E.curEditor.win);
				$(curTable).find('td').bind('mousemove.cursorState',function(e2){
					lineState(e2);
				});
				cellLine.remove();
				$(curTable).unbind('mousedown.dragLine');
				curBody.unbind('mousemove.changeCell');
				curBody.unbind('mouseup.changeCell');
			});
		});
	}
	function moveLine(curTd,changePx,ver){
		if(ver){
			// 只改变选择线顶部的单元格的高度
			var rows = $(curTd.topTd).attr('rowspan') ? parseInt($(curTd.topTd).attr('rowspan')) : 1;
			var rowIndex = parseInt($(curTd.topTd).attr('row'))+rows;
			var changeCells = [];
			$(curTd.topTd).closest('table').find('td:visible,th:visible').each(function(){
				var tmpRows = $(this).attr('rowspan') ? parseInt($(this).attr('rowspan')) : 1;
				if(parseInt($(this).attr('row'))+tmpRows === rowIndex){
					var oriTopHeight = parseFloat($(this).height());
					changeCells.push({cell:$(this),height:oriTopHeight+changePx});
				}
			});
			var changeLen = changeCells.length;
			for(var i=0;i<changeLen;i++){
				changeCells[i].cell.height(changeCells[i].height);
			}
		}else{
			// 同时改变选择线左侧和右侧的宽度
			var cols = $(curTd.leftTd).attr('colspan') ? parseInt($(curTd.leftTd).attr('colspan')) : 1;
			var changeCells = [];
			var colIndex = parseInt($(curTd.leftTd).attr('col'))+cols;
			$(curTd.leftTd).closest('table').find('td:visible,th:visible').each(function(){
				var tmpCols = $(this).attr('colspan') ? parseInt($(this).attr('colspan')) : 1
				if(parseInt($(this).attr('col'))+tmpCols === colIndex){
					var oriLeftWidth = parseFloat($(this).width());
					var oriRightWidth = parseFloat($(this).next('td,th').width());
					changeCells.push({cell:$(this),width:oriLeftWidth+changePx});
					
					$(this).next('td,th').length && changeCells.push({cell:$(this).next('td,th'),width:oriRightWidth-changePx});
					var maxTableWidth = 760;
					var finalWidth = parseFloat($(this).closest('table').width())+changePx > 760 ? 760 : parseFloat($(this).closest('table').width())+changePx;
					$(this).next('td,th').length || changeCells.push({cell:$(this).closest('table'),width:finalWidth});
				}
			});
			var changeLen = changeCells.length;
			for(var i=0;i<changeLen;i++){
				changeCells[i].cell.width(changeCells[i].width);
			}
		}
	}
})(window.jQuery.jQEditor,window.jQuery);
(function(E){
	// 编辑器核心完成时，记录日志
	E.addEvent({
		name : 'readyLog',
		type : ['ready'],
		fn : function(arg){
			E.log.writeLog('Core is ready','core');return false;
		}
	});
	// 编辑器实例创建前，记录日志
	E.addEvent({
		name : 'createLog',
		type : ['create'],
		fn : function(arg){
			//E.log.writeLog('Editor '+arg.Eid+' is creating','core');return false;
		}
	});
	// 编辑器实例创建完成，记录日志
	E.addEvent({
		name : 'completeLog',
		type : ['complete'],
		fn : function(arg){
			//E.log.writeLog('Editor '+arg.Eid+' is completed','core');return false;
		}
	});
})(window.jQuery.jQEditor);
(function(E,$){
	var $dom = $(document);
	
	// 如需 return false 请详细说明为什么
	/**
	* @description 在点击其他位置时隐藏工具栏的面板
	* @author	戴显峰
	* @createTime 2013.01.11 
	**/
	$dom.bind('click',function(e){
		var o = $(e.target);
		if( !o.closest('.bke-btn').size() ){
			// 如果点击的不是编辑器按钮，则隐藏当前显示的面板
			E.toolbar.hidePanel();
		}
	});
	
	/**
	* @description 点击工具栏按钮时内容区域光标焦点不丢失,并且激活编辑器
	*	如果不在 mousedown 事件返回false，
	*	在ie9下点击工具栏按钮时内容区域将丢失光标焦点，
	*	return false 在ie6/7/8貌似没有效果，
	*	导致命令不能正确应用到选择的文本上。
	*	针对这个问题，还有另外一个解决办法。将工具栏按钮使用a链接标签。
	* @author	潘雪鹏
	* @createTime 2013.01.11 
	**/
	$dom.delegate('.bke-toolbar', 'mousedown', function(e){
		var Eid = $(e.target).closest(".bke-toolbarbox").attr('ref');
		E.curId = Eid;
		E.curEditor = E.editorList[Eid];
		E.curEditor.win.focus();
		return false;
	});
	
	/**
	* @description 点击编辑器工具栏，带有cmd属性时执行相关命令
	* @author	戴显峰
	* @createTime 2013.01.06 
	**/
	$dom.delegate('.bke-toolbar', 'click', function(e){
		var target = $(e.target).closest("[cmd]");
		
		// 使禁用的按钮点击无效
		if( target.closest('.bke-disabled').length ){
			return true;
		}
		
		if( target.length ){
			var cmd = target.attr('cmd'),
				param = target.attr('param'),
				args = target.attr('args');
			
			E.command(cmd, param, args);
			
			return false;
		}
	});
	
	// 点击面板上的命令按钮后，隐藏面板
	$dom.delegate('.bke-submenu [cmd]', 'click', function(e){
		E.toolbar.hidePanel();
	});
	
	
})(jQuery.jQEditor, jQuery);
(function(E, $){
E.addUi({
	id: 'imagedialog',
	
	// 点击弹窗确定按钮时会先执行此验证
	// 返回false时将组织弹窗关闭
	// 同时，可以使用shis.error()方法显示错误提示信息
	// 信息会显示在弹窗的左下角
	check: function( ) {
		if ( $(".bke-dialog div[name=tab1]").is(":visible") ) {
		// 如果是单张插入，则需要输入图片地址
			var data = this.getValues();
			if ( !data.link ) {
				this.error('请输入正确的图片地址');
				return false
			}
		} else {
		// 批量上传，不需要检查
			return true;
		}
	},
	
	// 要判断当前显示的是哪个标签，单张插入 or 批量上传
	submit: function() {
		var html = '';
		
		if ( $(".bke-dialog div[name=tab1]").is(":visible") ) {
			// 单张插入
			var data = this.getValues();
			
			html = '<a href="'+data.link+'" target="'+data.target+'"><img src="'+data.url+'"';
			if (data.title) html += ' title="'+data.title+'"';
			if (data.align) html += ' align="'+data.align+'"';
			if (data.width) html += ' width="'+data.width+'"';
			if (data.height) html += ' height="'+data.height+'"';
			
			html += '/></a>';
		} else {
			// 多张上传
			$(".bke-dialog .bke-image-filelist img").each(function(){
				html += '<img src="'+$(this).attr('src')+'"/>';
			})
			
		}
		
		return html
	},
	
	callback: function() {
		setTimeout(function(){
			onePlupload();
			multPlupload();
		}, 0);
	},
	
	// 在弹窗关闭时销毁上传实例
	beforeunload: function(){
		uploader1.destroy();
		uploader2.destroy();
	}
});

// 标签切换
$(document).delegate('.bke-tabs a', 'click', function() {
	var name = $(this).attr('name');
	$('.bke-tabs a')
	.removeClass('bke-tabs-selected')
	.filter('a[name='+name+']').addClass('bke-tabs-selected');
	
	$("div[name=tab1],div[name=tab2]").hide();
	$("div[name="+name+"]").show();
	if ( name === 'tab2' ) {
		multPlupload();
	}
});

// 单张插入时，图片预览
$(document).delegate('.bke-dialog :input[name=url]', 'change', function() {
	var url = $.trim(this.value);
	if ( url ) {
		var img = new Image()
		
		img.onload = function(){
			$('.bke-dialog .bke-image-preview').html('<img src="'+url+'" width="160" />');
			$('.bke-dialog .bke-image-size').html('宽：'+this.width+'px<br>高：'+this.height+'px');
		}
		img.onerror = function(){
			$('.bke-dialog .bke-image-preview').html('图片加载失败！');
			$('.bke-dialog .bke-image-size').html('');
		}
		
		img.src = url;
		
	}
});

var uploader1, uploader2;

// 单张插入
function onePlupload() {
	if ( $(".bke-dialog div[name=tab1]").is(":hidden") ) {
		return;
	}
	if (uploader1) {
		uploader1.destroy();
	}
	
	var conf = E.curEditor.config.cBase.plupload;
	
	uploader1 = new plupload.Uploader({
		runtimes : 'flash',
		browse_button : 'pickfile',
		multi_selection : false,
		container : 'container1',
		max_file_size : conf.max_file_size,
		url : conf.url,
		flash_swf_url : conf.pluploadswf,
		filters : [
			{title : "Image files", extensions : "jpg,gif,png"}
		],
		resize : {width : 1024, height : 768, quality : 90}
	});

	uploader1.init();

	uploader1.bind('FilesAdded', function(up, files) {
		up.refresh(); // Reposition Flash/Silverlight
		uploader1.start();
	});

	uploader1.bind('UploadProgress', function(up, file) {
		$('#container1 span').html('已上传'+file.percent + '%');
	});

	uploader1.bind('Error', function(up, err) {
		up.refresh(); // Reposition Flash/Silverlight
	});

	uploader1.bind('FileUploaded', function(up, file, obj) {
		eval('var o = '+obj.response);
		if ( o.url ) {
			$('#imagedialog').find('input[name=url]').val(o.url);
		}
		setTimeout(function(){$('#container1 span').html('');}, 1000);
	});
}

// 批量上传
function multPlupload() {
	if ( $(".bke-dialog div[name=tab2]").is(":hidden") ) {
		return;
	}
	if (uploader2) {
		uploader2.destroy();
	}
	var conf = E.curEditor.config.cBase.plupload;
	uploader2 = new plupload.Uploader({
		runtimes : 'flash',
		browse_button : 'pickfiles',
		container : 'container2',
		max_file_size : conf.max_file_size,
		url : conf.url,
		flash_swf_url : conf.pluploadswf,
		filters : [
			{title : "Image files", extensions : "jpg,gif,png"}
		],
		resize : {width : 1024, height : 768, quality : 90}
	});
	
	uploader2.init();

	uploader2.bind('FilesAdded', function(up, files) {
		$.each(files, function(i, file) {
			$('#filelist').append(
				'<a id="' + file.id + '" class="bke-image-thumb">' +
				file.name + ' (' + plupload.formatSize(file.size) + ') <b></b>' +
			'</a>');
		});
		
		$("#container2").css({position:'relative',left:0,top:0});
		
		up.refresh(); // Reposition Flash/Silverlight
		uploader2.start();
	});

	uploader2.bind('UploadProgress', function(up, file) {
		$('#' + file.id + " b").html(file.percent + "%");
	});

	uploader2.bind('Error', function(up, err) {
		$('#filelist').append("<div>Error: " + err.code +
			", Message: " + err.message +
			(err.file ? ", File: " + err.file.name : "") +
			"</div>"
		);

		up.refresh(); // Reposition Flash/Silverlight
	});

	uploader2.bind('FileUploaded', function(up, file, obj) {
		eval('var o = '+obj.response);
		if ( o.url ) {
			$('#' + file.id).html('<img src="'+o.url+'" width="100%"><span title="删除">×</span>');
		} else {
			
		}
	});
}
})(jQuery.jQEditor ,jQuery);
(function(E){
	E.addUi({
		id : 'mapdialog',
		submit : function(win){
			var curDialog = $('#mapdialog');
			if(curDialog.size() !== 0){
				var Main = win.Main,
					geocoder = Main.geocoder,
					map = Main.map,
					center = map.getCenter().lat() + ',' + map.getCenter().lng(),
					marker = Main.marker ? Main.marker.position : center,
					zoom = map.getZoom(),
					maptype = map.getMapTypeId(),
					// http://maps.googleapis.com/maps/api/staticmap
					src = 'http://maps.google.com/maps/api/staticmap'
						+ '?center=' + center
						+ '&zoom=' + zoom
						+ '&size=520x340'
						+ '&maptype=' + maptype
						+ '&markers=' + marker
						+ '&language=zh-cn'
						+ '&sensor=false',
					html = '<img class="googlemap" src="'+ src +'" title="'+Main.address+'" alt="'+Main.address+'"/>';
				E.utils.pasteHTML(html);
			}else{
				return false;
			}
		}
	});
})(window.jQuery.jQEditor);
(function(E,$){
	

})(jQuery.jQEditor, jQuery);
(function(E,$){
	E.addUi({
		id : 'tabledialog',
		submit : function(){
			var curDialog = $('#tabledialog');
			if(curDialog.size() !== 0){
				var title = curDialog.find('[name=title]')[0].checked,
					col = curDialog.find('[name=col]').val(),
					row = curDialog.find('[name=row]').val(),
					//align = curDialog.find('[name=align]:checked').val(),
					float = curDialog.find('[name=float]:checked').val(),
					head = curDialog.find('[name=head]')[0].checked;
				//对于操作复杂的拼接处理，可以使用此方式
				var insertHtml = E.utils.execPlugin('table','preInsert',{
					title : title,
					head : head,
					col : col,
					row : row,
					//align : align
					float : float
				});
				return insertHtml;
			}else{
				return false;
			}
		},
		changeAttr : function(){
			var curDialog = $('#tableattrdialog');
			if(curDialog.size() !== 0){
				var title = curDialog.find('[name=title]')[0].checked,
					col = curDialog.find('[name=col]').val(),
					row = curDialog.find('[name=row]').val(),
				//align = curDialog.find('[name=align]:checked').val(),
					float = curDialog.find('[name=float]:checked').val(),
					head = curDialog.find('[name=head]')[0].checked;
				E.utils.execPlugin('table','changeTableAttr',{
					title : title,
					head : head,
					col : col,
					row : row,
					//align : align
					float : float
				});
			}else{
				return false;
			}
		},
		setValues : function(args){
			var curDialog = $('#tableattrdialog:visible');
			if(curDialog.length > 0){
				curDialog.find('[name=float][value='+args.float+']')[0].checked = true;
				if(args.title){
					curDialog.find('[name=title]')[0].checked = true;
				}else{
					curDialog.find('[name=title]')[0].checked = false;
				}
				if(args.head){
					curDialog.find('[name=head]')[0].checked = true;
				}else{
					curDialog.find('[name=head]')[0].checked = false;
				}
				if(args.row){
					curDialog.find('[name=row]').val(args.row);
				}
				curDialog.find('[name=row]')[0].disabled = true;
				if(args.col){
					curDialog.find('[name=col]').val(args.col);
				}
				curDialog.find('[name=col]')[0].disabled = true;
			}
		}
	});
})(window.jQuery.jQEditor ,window.jQuery);
(function(E){E.dialogHtml["imagedialog"] ="<div ui=\"imagedialog\" style=\"width:580px; height:300px\"><div class=\"bke-tabs\"><a class=\"bke-tabs-first bke-tabs-selected\" name=\"tab1\">\u5355\u5f20\u63d2\u5165<\/a><a name=\"tab2\">\u6279\u91cf\u4e0a\u4f20<\/a><\/div><div name=\"tab1\"><table><tr><td width=\"60\">\u5730 \u5740\uff1a<span style=\"color:red\">*<\/span><\/td><td width=\"300\"><input type=\"text\" name=\"url\" style=\"width:280px\"\/><\/td><td width=\"180\" rowspan=\"8\" align=\"right\" valign=\"top\"><div class=\"bke-image-preview\">\u56fe\u7247\u9884\u89c8<\/div><div class=\"bke-image-size\"><\/div><\/td><\/tr><tr><td><\/td><td id=\"container1\">\u8f93\u5165\u56fe\u7247\u5730\u5740 \u6216 <a id=\"pickfile\" title=\"\u4e0a\u4f20\u6210\u529f\u4e4b\u540e\uff0c\u4f1a\u81ea\u52a8\u751f\u6210\u5730\u5740\">\u4e0a\u4f20\u4e00\u5f20\u56fe\u7247<\/a> <span><\/span><\/td><\/tr><tr><td>\u94fe \u63a5\uff1a<\/td><td><input type=\"text\" name=\"link\" style=\"width:280px\"\/><\/td><\/tr><tr><td><\/td><td><select name=\"target\"><option value=\"_blank\" selected=\"selected\">\u65b0\u7a97\u53e3\u6253\u5f00\u94fe\u63a5<\/option><option value=\"_top\">\u5f53\u524d\u7a97\u53e3\u6253\u5f00\u94fe\u63a5<\/option><\/select><\/td><\/tr><tr><td>\u63cf \u8ff0\uff1a<\/td><td><input type=\"text\" name=\"title\" style=\"width:280px\"\/><\/td><\/tr><tr><td>\u5bbd \u5ea6\uff1a<\/td><td><input type=\"text\" name=\"width\"\/> px<\/td><\/tr><tr><td>\u9ad8 \u5ea6\uff1a<\/td><td><input type=\"text\" name=\"height\"\/> px<\/td><td>&nbsp;<\/td><\/tr><tr><td>\u5bf9 \u9f50\uff1a<\/td><td><select name=\"align\"><option value=\"left\" selected=\"selected\">\u56fe\u7247\u5c40\u5de6<\/option><option value=\"center\">\u56fe\u7247\u5c45\u4e2d<\/option><option value=\"right\">\u56fe\u7247\u5c40\u53f3<\/option><\/select><\/td><\/tr><\/table><\/div><div name=\"tab2\" style=\"display:none; \"><div id=\"container2\" style=\"line-height:25px;font-size:14px;position:absolute;left:45%;top:45%;\"><a id=\"pickfiles\">\u9009\u62e9\u56fe\u7247<\/a><span><\/span><\/div><div id=\"filelist\" class=\"bke-image-filelist\"><\/div><\/div><\/div>"})(jQuery.jQEditor);
(function(E){E.dialogHtml["tabledialog"] ="<TABLE ui=\"tabledialog\"><TR><TD>\u8868\u683c\u6a21\u677f<\/TD><TD><select id=\"table-template\" name=\"template\"><option value=\"tpl1\" selected=\"selected\">\u6a21\u677f1<\/option><option value=\"tpl2\">\u6a21\u677f2<\/option><\/select><\/TD><TD> &nbsp <\/TD><\/TR><TR><TD>\u8868\u683c\u6807\u9898<\/TD><TD><input type=\"checkbox\" id=\"table-title\" name=\"title\" \/><\/TD><\/TR><TR><TD>\u8868\u5934<\/TD><TD><input type=\"checkbox\" id=\"table-head\" name=\"head\" \/><\/TD><TD> &nbsp <\/TD><\/TR><TR><TD>\u884c<\/TD><TD><input type=\"text\" id=\"table-col\" name=\"row\" value=\"4\"\/><\/TD><TD> &nbsp <\/TD><\/TR><TR><TD>\u5217<\/TD><TD><input type=\"text\" id=\"table-row\" name=\"col\" value=\"3\"\/><\/TD><TD> &nbsp <\/TD><\/TR><TR><TD>\u6d6e\u52a8\u65b9\u5f0f<\/TD><TD><p><input type=\"radio\" id=\"table-float-left\" name=\"float\" value=\"1\"\/>\u5de6\u6d6e\u52a8<input type=\"radio\" id=\"table-align-center\" name=\"float\" checked=\"checked\" value=\"2\"\/>\u5c45\u4e2d<input type=\"radio\" id=\"table-align-right\" name=\"float\" value=\"3\"\/>\u53f3\u6d6e\u52a8<\/p><\/TD><!--<TD><p><input type=\"radio\" id=\"table-align-lt\" name=\"align\" value=\"1\"\/>\u5c45\u5de6\u4e0a<input type=\"radio\" id=\"table-align-ct\" name=\"align\" value=\"2\"\/>\u5c45\u4e2d\u4e0a<input type=\"radio\" id=\"table-align-rt\" name=\"align\" value=\"3\"\/>\u5c45\u53f3\u4e0a<\/p><p><input type=\"radio\" id=\"table-align-lm\" name=\"align\" value=\"4\"\/>\u5c45\u5de6\u4e2d<input type=\"radio\" id=\"table-align-cm\" name=\"align\" checked=\"checked\" value=\"5\"\/>\u5c45&nbsp&nbsp\u4e2d<input type=\"radio\" id=\"table-align-rm\" name=\"align\" value=\"6\"\/>\u5c45\u53f3\u4e2d<\/p><p><input type=\"radio\" id=\"table-align-lb\" name=\"align\" value=\"7\"\/>\u5c45\u5de6\u4e0b<input type=\"radio\" id=\"table-align-cb\" name=\"align\" value=\"8\"\/>\u5c45\u4e2d\u4e0b<input type=\"radio\" id=\"table-align-rb\" name=\"align\" value=\"9\"\/>\u5c45\u53f3\u4e0b<\/p><\/TD>  --><TD> &nbsp <\/TD><\/TR><\/TABLE>"})(jQuery.jQEditor);
(function(E, $){
	// 注册UI插件
	E.addUi({
		id: 'aboutdialog',
		
		html: '<p><strong style="color:blue;">version</strong> : '+'0.7.0'+'</p>'+
				'<p style="text-indent:2em;">编辑器正处于开发阶段，欢迎各种意见及建议</p>'+
				'<p><strong style="color:blue;">快捷键</strong></p>'+
				'<p style="text-indent:2em;">1,	ctrl+a : 全选</p>'+
				'<p style="text-indent:2em;">2,	ctrl+c : 复制</p>'+
				'<p style="text-indent:2em;">3,	ctrl+x : 剪切</p>'+
				'<p style="text-indent:2em;">4,	ctrl+v : 粘贴</p>'+
				'<p style="text-indent:2em;">5,	ctrl+z : 撤销</p>'+
				'<p style="text-indent:2em;">6,	ctrl+y : 重做</p>'+
				'<p style="text-indent:2em;">7,	ctrl+s : 保存</p>'+
				'<p style="text-indent:2em;">8,	ctrl+b : 加粗</p>'+
				'<p style="text-indent:2em;">9,	ctrl+i : 斜体</p>'+
				'<p style="text-indent:2em;">10,ctrl+u : 下划线</p>'
		
	});
	
	// 注册命令插件
	E.addPlugin({
		id: 'about',
		title: '关于',
		ui: 'aboutdialog',
		type: 'dialog'
	});
	
})(jQuery.jQEditor, jQuery);
(function(E, $){
// 注册UI插件
E.addUi({
	id: 'anchordialog',
	
	html: '<div style="width:350px;padding:10px;">锚点名称：<input name="name" style="width:200px;height:20px;"/></div>',
	
	submit: function() {
		var name = $('#anchordialog').find('input[name=name]').val();
		name = $.trim(name);
		if ( name ) {
			return '<img name="'+name+'" title="'+name+'" class="bke-anchor"/>';
		}
	}
});

// 注册命令插件
E.addPlugin({
	id: 'anchor'
	, title: '锚点'
	, ui: 'anchordialog'
	, type: 'dialog'
	/*
	, getData: function(editor) {
		var data = {
				name: 'name'
			};
			
		return data;
	}
	*/
});

})(jQuery.jQEditor, jQuery);
(function(E, $){
	// 仅匹配开通的空格，不是匹配所有空格
	var space = /^(\s|&nbsp;|　)+/i;

	// 注册插件
	E.addPlugin({
		id: 'autoformat',
		
		click: function() {
			autoFormat(E.curEditor.dom);
		}
	});
	
	// 替换空格
	function replaceSpace(o) {
		if( o.children().eq(0).size() ){
			o = o.children().eq(0);
			o.html( o.html().replace(space, '') );
			replaceSpace(o);
		}
	}

	function autoFormat( dom ){
		var node, childs = $("body", dom)[0].childNodes;
		
		for (var i = 0, len = childs.length; i < len; i++){
			node = childs[i];
			if (1 === node.nodeType){
				var o = $(node);
				if( /^(p|h2|h3)$/i.test(node.nodeName) ){
					// && space.test(o.text()) ie下匹配失败 ？
					o.html( o.html().replace(space, 'a') );
					replaceSpace(o);
				}
			}
		}
	}
})(jQuery.jQEditor, jQuery);
(function(E){
E.addPlugin({
	id : 'baikelink',
	isEnable : true,
	linkName : 'baikelink',
	
	click: function( ){
		var self = this,
			url = "http://www.baike.com/wiki/",
			html='',
			text = E.utils.getSelectionText();
		if( text ){
			if( text.length > 80 ){
				E.errorMessage('百科链接，不能选择超过80个字符的长度！');
			}else if( /[`~!\\\/]/.test(text) ){
				E.errorMessage('百科链接，不能包含特殊字符“`~!\/”！');
			}else{
				html = '<a href="'+url + encodeURIComponent (text) +'" class="'+self.linkName+'" title="'+text+'" target="_blank">'+text+'</a>';
				E.utils.pasteHTML( html );
			}
		}else{
			E.errorMessage('请选择需要设置为百科链接的文字！');
		}
		return 1;
	}
});
})(jQuery.jQEditor);
(function(E, $){
	// 注册命令插件
	E.addPlugin({
		id: 'blockquote'
		, title: '引用'
		, click: function(){
			var editor = E.curEditor
				// 记录光标范围
				, range = E.utils.getSelectionRange(editor.win, 'node')
				, eles = null
				, startContainer = null
				, endContainer = null
			
			// 将范围区域的body子节点全部放到blockquote标签里面
			eles = $(range.startContainer).parents().get();
			eles.pop(); // html
			eles.pop(); // body
			startContainer = eles.pop(); // body 的子元素
			
			eles = $(range.endContainer).parents().get();
			eles.pop(); // html
			eles.pop(); // body
			endContainer = eles.pop(); // body 的子元素
			
			var o = $(startContainer);
			
			if ( startContainer === endContainer ) {
				if ( o.is('blockquote') ) {
					//o.replaceWith(o.html()); // 取消引用时会导致选取丢失
					
					// 这种方式取消引用时不会导致选取丢失
					o.after(o.children()).remove();
				} else {
					o.wrap('<blockquote></blockquote>');
				}
				
			} else {
			
				var blockquote = editor.dom.createElement('blockquote');
				o.before(blockquote);
				
				o.nextAll().each(function() {
					$(blockquote).append(this);
					if  ( endContainer === this ) {
						return false;
					}
				});
				
				$(blockquote).prepend(startContainer);
			}
			
			// 还原光标范围
			E.utils.setSelectionRange(editor.win, range, 'node');
		}
	});
	
})(jQuery.jQEditor, jQuery);
(function(E, $){
	E.addPlugin({
		id: 'cleardoc',
		title: '清空文档',
		isEnable: true,
		click: function() {
			if ( confirm('确定要删除当前所有内容吗？') ) {
				var body = E.get('body'),
					editor = E.get('editor');
				
				var p = editor.dom.createElement('p');
				p.innerHTML = '&#8203;';
				$(body).empty().append(p);
				E.utils.setCursor(editor.win, p, true);
			}
		}
	});
})(jQuery.jQEditor, jQuery);
(function(E, $){
var selOffset = '';
var isShowSource = false, codeEditor;

// 注册命令插件
E.addPlugin({
	id: 'codemirror',
	title: '源代码',
	
	click: function() {
		var editor = E.curEditor,
			textarea = $("#"+editor.Eid+" textarea"),
			content = '';
		
		if ( isShowSource ) {
			// 显示编辑状态，将源码内容写道iframe当中
			content = codeEditor.getValue();
			editor.setContent(content);
			$(".CodeMirror").remove();
			$("#"+editor.Eid+" iframe").show();
			isShowSource = false;
			this.clicked(false);
			if(selOffset){
				E.utils.setSelectionByOffset(E.curEditor.win,selOffset);
			}
			selOffset = '';
		} else {
			// 显示源码状态
			selOffset = E.utils.getSelectionOffset(editor.win);
			this.clicked(true);
			content = formatHtml(editor.getContent());
			textarea.val( content );
			var iframe = $("#"+editor.Eid+" iframe");
			iframe.hide();
			codeEditor = CodeMirror.fromTextArea(textarea[0], {
				//mode: {name: "xml",alignCDATA: true},
				mode: 'text/html',
				lineNumbers: true,
				lineWrapping: true,
				tabMode: "indent",
				autoCloseTags: true
			});
			isShowSource = true;
			
			iframe.closest('.bke-iframeholder').height($(".CodeMirror").height());
		}
		
		editor.isShowSource = isShowSource;
	}
});

// 源码简单格式化
function formatHtml( html ){
	html = html.replace(/\n+/g, '');
	
	var wrap = $('<div></div>').append( html ),
		itemHtml='',
		child = null;
		
	wrap.children().each(function(i, el){
		// jquery-1.4.2 IE下会出现异常
		try{
			child = $(this);
			// itemHtml = child.text();
			// if(itemHtml.length > 80){
				// child.html('\n'+itemHtml+'\n');
			// }
			child.after('\n\n');
		}catch(e){}
	});
	
	var table = wrap.find("table");
	if( table.size() ){
		table.find("tr,td,th").after('\n').before('\n');
	}
	
	html = wrap.html();
	html = html.replace(/\n{3,}/g, '\n\n');
	html = html.replace(/<BR>/ig, '<br>\n');
	
	html = html.replace(/<.+?>/ig, function($0){
		$0 = $0.replace(/COLOR:/g, 'color:');
		$0 = $0.replace(/rgb\(\d+,(?: |&nbsp;)?\d+,(?: |&nbsp;)?\d+\)/ig, function($0){
			return Utils.colorToHex($0);
		});
		return $0;
	});
	
	// IE下将标签转为小写
	if( E.IE ){
		html = html.replace(/<(\w+)/ig, function($0, tagName){
			return '<'+tagName.toLowerCase();
		});
		html = html.replace(/(\w+)>/ig, function($0, tagName){
			return tagName.toLowerCase()+'>';
		});
	}
	
	return html;
}
})(jQuery.jQEditor, jQuery);
(function(E,$){
	E.addPlugin({
		id : 'colormenu',
		type : 'panel',
		isEnable : true,
		fill : function(){
			var colorPanel = '';
			E.fillPanel('forecolormenu',genColorPicker('清除颜色','forecolor',E));
			E.fillPanel('backcolormenu',genColorPicker('清除颜色','backcolor',E));
			E.fillPanel('cellcolormenu',genColorPicker('清除颜色','cellcolor',E));
		},
		forecolor:function(){
			E.toolbar.togglePanel('forecolormenu');
		},
		backcolor:function(){
			E.toolbar.togglePanel('backcolormenu');
		},
		cellcolor:function(){
			E.toolbar.togglePanel('cellcolormenu');
		},
		getCellcolorPicker:function(){
			return genColorPicker('清除颜色','cellcolor',E);
		}
	});
	
	$(document).delegate('.edui-box td a', 'mouseenter', function(){
		var o = $(this),
			preview = $('.edui-colorpicker-preview');
		preview.css({'background-color':o.attr('param')});
	});
	
	$(document).delegate('.edui-box td a', 'mouseleave', function(){
		var o = $(this),
			preview = $('.edui-colorpicker-preview');
		preview.css({'background-color':''});
	});
	
	function genColorPicker(noColorText,cmd,editor){
		var COLORS = (
            'ffffff,000000,eeece1,1f497d,4f81bd,c0504d,9bbb59,8064a2,4bacc6,f79646,' +
            'f2f2f2,7f7f7f,ddd9c3,c6d9f0,dbe5f1,f2dcdb,ebf1dd,e5e0ec,dbeef3,fdeada,' +
            'd8d8d8,595959,c4bd97,8db3e2,b8cce4,e5b9b7,d7e3bc,ccc1d9,b7dde8,fbd5b5,' +
            'bfbfbf,3f3f3f,938953,548dd4,95b3d7,d99694,c3d69b,b2a2c7,92cddc,fac08f,' +
            'a5a5a5,262626,494429,17365d,366092,953734,76923c,5f497a,31859b,e36c09,' +
            '7f7f7f,0c0c0c,1d1b10,0f243e,244061,632423,4f6128,3f3151,205867,974806,' +
            'c00000,ff0000,ffc000,ffff00,92d050,00b050,00b0f0,0070c0,002060,7030a0,').split(',');
        var html = '<div id="##" class="edui-colorpicker">' +
            '<div class="edui-colorpicker-topbar edui-clearfix">' +
             '<div unselectable="on" id="##_preview" class="edui-colorpicker-preview"></div>' +
             '<div unselectable="on" class="edui-colorpicker-nocolor" >'+ noColorText +'</div>' +
            '</div>' +
            '<table  class="edui-box" style="border-collapse: collapse;" cellspacing="0" cellpadding="0">' +
            '<tr style="border-bottom: 1px solid #ddd;font-size: 13px;line-height: 25px;color:#39C;padding-top: 2px"><td colspan="10">'+editor.getLang("themeColor")+'</td> </tr>'+
            '<tr class="edui-colorpicker-tablefirstrow" >';
        for (var i=0; i<COLORS.length; i++) {
            if (i && i%10 === 0) {
                html += '</tr>'+(i==60?'<tr style="border-bottom: 1px solid #ddd;font-size: 13px;line-height: 25px;color:#39C;"><td colspan="10">'+editor.getLang("standardColor")+'</td></tr>':'')+'<tr'+(i==60?' class="edui-colorpicker-tablefirstrow"':'')+'>';
            }
            html += i<70 ? '<td style="padding: 0 2px;"><a hidefocus cmd="'+cmd+'" title="'+COLORS[i]+'" onclick="return false;" href="javascript:" unselectable="on" class="edui-box edui-colorpicker-colorcell"' +
                        ' param="#'+ COLORS[i] +'"'+
                        ' style="background-color:#'+ COLORS[i] +';border:solid #ccc;'+
                        (i<10 || i>=60?'border-width:1px;':
                         i>=10&&i<20?'border-width:1px 1px 0 1px;':

                        'border-width:0 1px 0 1px;')+
                        '"' +
                    '></a></td>':'';
        }
        html += '</tr></table></div>';
        return html;
    }
})(window.jQuery.jQEditor,window.jQuery);
(function(E){
	E.addPlugin({
		id : 'datemenu',
		type : 'panel',
		isEnable : true,
		fill : function(Eid){
			var familyPanel = '';
			var menulist = [
				{name:'Y-m-d',cmd:'insertdate', param:'type_1'},
				{name:'Y/m/d',cmd:'insertdate', param:'type_2'},
				{name:'Y.m.d',cmd:'insertdate', param:'type_3'},
				{name:'Y年m月d日',cmd:'insertdate', param:'type_4'}
		   ];
			familyPanel = E.Menu.create(menulist);
			E.fillPanel('datemenu',familyPanel,Eid);
		},
		type_1:function (){
			E.utils.pasteHTML(getDate ('Y-m-d'));
		},
		type_2:function (){
			E.utils.pasteHTML(getDate ('Y/m/d'));
		},
		type_3:function (){
			E.utils.pasteHTML(getDate ('Y.m.d'));
		},
		type_4:function (){
			E.utils.pasteHTML(getDate ('Y年m月d日'));
		}
	});

	function getDate( name ){
		if( typeof name !== "string" || !name ){
			name = "Y-m-d";
		}
		var D = new Date(), s = {}, d = '';
		s.Y = D.getFullYear();
		s.m = D.getMonth() + 1;
		s.d = D.getDate();

		return name.replace("Date_", "").replace("Y", s.Y).replace("m", s.m).replace("d", s.d);
	}
})(window.jQuery.jQEditor);
(function(E, $){

E.addEvent({
	name : 'elementpath',
	type : ['mouseup'],
	area : 'editArea',
	fn : function(arg){
		var $path = $('#'+E.curId+' .bke-elementpath'),
			elementList = E.utils.getCurElement(),
			html = [];
			
		for(var i=0, len = elementList.length; i<len; i++){
			if( elementList[i].nodeType !==3 ){
				html.push('<a>'+elementList[i].nodeName.toLowerCase()+'</a>');
			}
		}
		
		$path.html('元素路径：'+html.join('&gt;'));
	}
});

})(jQuery.jQEditor, jQuery);
(function(E, $){
	var menulist = [
		{name:'宋体',cmd:'fontfamily', param:'SimSun','styleName':'bke-SimSun'},
		{name:'仿宋体',cmd:'fontfamily', param:'FangSong_GB2312','styleName':'bke-FangSong_GB2312'},
		{name:'微软雅黑',cmd:'fontfamily', param:'Microsoft YaHei','styleName':'bke-Microsoft_YaHei'},
		{name:'黑体',cmd:'fontfamily', param:'SimHei','styleName':'bke-SimHei'},
		{name:'楷体',cmd:'fontfamily', param:'KaiTi_GB2312','styleName':'bke-KaiTi_GB2312'},
		//{name:'CourierNew',cmd:'fontfamily', param:'Courier New','styleName':'bke-Courier_New'},
		//{name:'TimesNewRoman',cmd:'fontfamily', param:'Times New Roman','styleName':'bke-Times_New_Roman'},
		{name:'Impact',cmd:'fontfamily', param:'Impact','styleName':'bke-Impact'},
		{name:'Georgia',cmd:'fontfamily', param:'Georgia','styleName':'bke-Georgia'},
		{name:'Arial',cmd:'fontfamily', param:'Arial','styleName':'bke-Arial'},
		{name:'Verdana',cmd:'fontfamily', param:'Verdana','styleName':'bke-Verdana'},
		{name:'Tahoma',cmd:'fontfamily', param:'Tahoma','styleName':'bke-Tahoma'}
	];
	
	E.addPlugin({
		id: 'fontfamilymenu',
		type: 'panel',
		isEnable: true,
		fill: function(Eid){
			var familyPanel = E.Menu.create(menulist);
			E.fillPanel('fontfamilymenu', familyPanel, Eid);
		},
		
		// 将当前字体回显到工具栏
		echo: function($btn, value){
			value = value.replace(/'/g, '')||'';
			value = value.toLowerCase();
			
			$.each(menulist, function(i, n){
				if ( n.param.toLowerCase() === value ){
					$btn.find('#icon-fontfamilymenu').find('.bke-Font a').html(n.name);
					return false;
				}
			})
		}
	});
})(jQuery.jQEditor, jQuery);
(function(E){
	var menulist = [
		{'name':'12px','cmd':'fontsize','param':'12px','styleName':'bke-font12'},
		{'name':'14px','cmd':'fontsize','param':'14px','styleName':'bke-font14'},
		{'name':'18px','cmd':'fontsize','param':'18px','styleName':'bke-font18'},
		{'name':'24px','cmd':'fontsize','param':'24px','styleName':'bke-font24'},
		{'name':'36px','cmd':'fontsize','param':'36px','styleName':'bke-font36'}
   ];
	E.addPlugin({
		id : 'fontsizemenu',
		type : 'panel',
		isEnable : true,
		fill : function(){
			var sizePanel = E.Menu.create(menulist);
			E.fillPanel('fontsizemenu', sizePanel);
		},
		
		// 将当前字号回显到工具栏
		echo: function($btn, value){
			$btn.find('#icon-fontsizemenu').find('.bke-FontSize a').html(value);
		}
	});
})(window.jQuery.jQEditor);
(function(E, $){
	var langs = {
		'html': 'HTML/XML',
		'js': 'Javascript',
		'css': 'CSS',
		'php': 'PHP',
		'java': 'Java',
		'py': 'Python',
		'pl': 'Perl',
		'rb': 'Ruby',
		'cs': 'C#',
		'c': 'C++/C',
		'vb': 'VB/ASP'
	};
	
	var html = '<div><select name="code_language" style="margin:2px 0;">';
	for( var i in langs) {
		html += '<option value="'+i+'">' + langs[i]+'</option>';
	}
	html += '</select></div>';
	html += '<textarea name="content" style="width:600px;height:300px;resize:none;"></textarea>';
	
	// 注册UI插件
	E.addUi({
		id: 'codedialog',
		html: html,
		
		submit: function() {
			var panel = $('#codedialog'),
				code_language = panel.find('select[name=code_language]').val(),
				content = panel.find('textarea').val();
			content = E.utils.escape(content);
			
			return '\n<pre class="prettyprint lang-' + code_language + '">' + content + '</pre>\n';
		}
	});
	
	// 注册命令插件
	E.addPlugin({
		id: 'highlightcode',
		title: '插入代码',
		ui: 'codedialog',
		type: 'dialog',
		
		getData: function(editor) {
			var el = editor.getCursorElement();
			var content = $(el).closest('pre').text();
			
			var data = {
					content: content
				};
				
			return data;
		}
	});
	
})(jQuery.jQEditor, jQuery);
(function(E){
	E.addPlugin({
		id : 'hn',
		isEnable : true,
		paramStr: function(htype){
			var html='',
				text = E.utils.getSelectionText();
			
			if( text ){
				if( text.length > 80 ){
					E.log.writeLog('不能选择超过80个字符的长度！');
				}else if( /[`~!\\\/]/.test(text) ){
					E.log.writeLog('不能包含特殊字符“`~!\/”！');
				}else{
					html = '<'+htype+' class="'+htype+'">'+text+'</'+htype+'>';
					
					E.utils.pasteHTML( html );
				}
			}else{
				E.log.writeLog('请选择需要设置为百科链接的文字！');
			}
			return 1;
		},
		h2:function () {
			this.paramStr ('h2');
		},
		h3:function () {
			this.paramStr ('h3');
		}
	});
})(window.jQuery.jQEditor);
(function(E, $){
/**
 * @type {object} 工具条图标列表
 */
var cmdConfig = E.config.cCommand
var iconList = {
	browserChecked : {},
	customChecked : {},
	browserValue : {},
	customValue : {},
	tableChecked : {}
};
for(var cmdType in cmdConfig){
	for(var tmpCmd in cmdConfig[cmdType]){
		var objCmd = cmdConfig[cmdType][tmpCmd];
		if(objCmd.icon !== ''){
			if(objCmd.icon === 'customChecked' || objCmd.icon === 'browserChecked'){
				if(objCmd.param === ''){
					iconList[objCmd.icon][tmpCmd] = {tag : objCmd.cmd,state:'_off'};
				}else if(cmdType === 'pluginCommand'){
					iconList[objCmd.icon][tmpCmd] = {tag : objCmd.param,state:'_off'};
				}else{
					iconList[objCmd.icon][tmpCmd] = {style : objCmd.cmd,value : objCmd.param,state:'_off'};
				}
			}else{
				iconList[objCmd.icon][tmpCmd] = {style : objCmd.cmd, value : objCmd.param, state : '_off'};
			}
		}
	}
}
//表格相关图标的状态，_off为可用状态，_unknown为需继续判定状态
var tableIconState = {
	tableSelect : {
		tableprops : '_off',
		deletetable : '_off'
	},
	cellSelect : {
		cellcolor : '_off',
		cellcolormenu : '_off',
		insertcolbefore : '_off',
		insertcolafter : '_off',
		insertrowbefore : '_off',
		insertrowafter : '_off',
		deletecol : '_off',
		deleterow : '_off',
		combinecells : '_off',
		tableprops : '_off',
		deletetable : '_off'
	},
	cellIn : {
		cellcolor : '_off',
		cellcolormenu : '_off',
		deletecol : '_off',
		deleterow : '_off',
		splittocols : '_split',
		splittorows : '_split',
		splittocells : '_split',
		combinecolafter : '_combine',
		combinerowafter : '_combine',
		insertcolbefore : '_off',
		insertcolafter : '_off',
		insertrowbefore : '_off',
		insertrowafter : '_off',
		tableprops : '_off',
		deletetable : '_off'
	},
	tableOut : {
		inserttable : '_off',
		inserttablemenu : '_off'
	}
};

E.addEvent({
	name: 'iconstate',
	type: ['mouseup','keyup', 'afterCommand'],
	area: 'editArea',
	fn: function(e) {
		main();
	}
});

function main(){
	//try{
		var iconState = {};
		var tagList = {};
		var styleList = {};
		var elementList = E.utils.getCurElement();
		var Elen = elementList.length;
		var cmdName = '';
		/**
		* @description 查找并合并父节点的样式
		**/
		for(var i=0;i<Elen;i++){
			var tagName = elementList[i].nodeName.toLowerCase();
			tagList[tagName] = true;
			if($(elementList[i]).attr('style')){
				var cssArr = $(elementList[i]).attr('style').split(';');
				var Slen = cssArr.length;
				for(var j=0;j<Slen;j++){
					var styleArr = cssArr[j].split(':');
					if(typeof styleArr[1] === 'string'){
						styleArr[0] = styleArr[0].replace(/^[ ]+/g,"");
						styleList[styleArr[0]] = styleArr[1].replace(/^[ ]+/g,"");
					}
					//styleList[elementList[i].style[j]] = elementList[i].style[elementList[i].style[j]];
				}
			}
		}
		/**
		* @description 自定义判断图标状态是否开启
		**/
		for(cmdName in iconList.customChecked){
			var iconTag = iconList.customChecked[cmdName].tag;
			var iconStyle = iconList.customChecked[cmdName].style;
			if(iconTag && tagList[iconTag] === true){
				iconState[cmdName] = '_on';
			}else if(iconStyle && styleList[iconStyle] === iconList.customChecked[cmdName].value){
				iconState[cmdName] = '_on';
			}else{
				iconState[cmdName] = '_off';
			}
			if(iconState['justifycenter'] === '_off' && iconState['justifyright'] === '_off'){
				iconState['justifyleft'] = '_on';
			}
		}
		/**
		* @description 自定义获取图标的值
		**/
		for(cmdName in iconList.customValue){
			var iconStyle = iconList.customValue[cmdName].style;
			if(iconStyle && styleList[iconStyle]){
				iconState[cmdName] = styleList[iconStyle];
			}else{
				iconState[cmdName] = iconList.customValue[cmdName].state;
			}
		}
		/**
		* @description 浏览器判断图标状态是否开启
		**/
		for(cmdName in iconList.browserChecked){
			if(E.curEditor.dom.queryCommandState(cmdName) === true){
				iconState[cmdName] = '_on';
			}else{
				iconState[cmdName] = '_off';
			}
		}
		/**
		* @description 浏览器获取图标的值
		**/
		for(cmdName in iconList.browserValue){
			if(E.curEditor.dom.queryCommandValue(cmdName)){
				iconState[cmdName] = E.curEditor.dom.queryCommandValue(cmdName);
				if(cmdName === 'ForeColor' || cmdName === 'BackColor'){
					var regColor = /[0-9]+/g;
					var colorArr = iconState[cmdName].match(regColor);
					iconState[cmdName] = '#';
					for(var i=0;i<colorArr.length;i++){
						var oriColor = parseInt(colorArr[i],16);
						if(oriColor < 128){
							iconState[cmdName] += '0';
						}
						iconState[cmdName] += oriColor;
					}
				}
			}else{
				iconState[cmdName] = iconList.browserValue[cmdName].state;
			}
		}
		/**
		 * @description 判断表格图标
		 **/
		var selectedTableLen = $(E.curEditor.dom).find('table.'+ E.curEditor.config.selectTableClass).length;
		var selectedCellLen = $(E.curEditor.dom).find('td.'+ E.curEditor.config.selectCellClass,'th.'+ E.curEditor.config.selectCellClass).length ;
		for(cmdName in iconList.tableChecked){
			iconState[cmdName] = '_freeze';
			if(selectedTableLen !== 0){
				//表格被整体选中的时候
				if(typeof tableIconState.tableSelect[cmdName] !== 'undefined'){
					iconState[cmdName] = tableIconState.tableSelect[cmdName];
				}
			}else if(selectedCellLen !== 0){
				//表格中单元格处于选中状态的时候
				if(typeof tableIconState.cellSelect[cmdName] !== 'undefined'){
					iconState[cmdName] = tableIconState.cellSelect[cmdName];
				}
			}else if(tagList['td'] === true || tagList['th'] === true){
				//tagList在判断自定义样式的时候已经被复制，所以有依赖关系
				//光标在表格的单元格中的时候
				if(typeof tableIconState.cellIn[cmdName] !== 'undefined'){
					iconState[cmdName] = tableIconState.cellIn[cmdName];
				}
				if(iconState[cmdName] === '_split'){
					//还需其他判定的时候，拆分判断
					var curTd = $(E.utils.getCurElement().pop()).closest('td,th');
					iconState[cmdName] = '_freeze';
					if(curTd.attr('colspan') && parseInt(curTd.attr('colspan')) > 1){
						iconState['splittocols'] = '_off';
						iconState['splittocells'] = '_off';
					}
					if(curTd.attr('rowspan') && parseInt(curTd.attr('rowspan')) > 1){
						iconState['splittorows'] = '_off';
						iconState['splittocells'] = '_off';
					}
				}
				if(iconState[cmdName] === '_combine'){
					//还需其他判定的时候，合并判断
					iconState[cmdName] = '_freeze';
					if(E.utils.execPlugin('table','combineRowAfter',true)){
						iconState['combinerowafter'] = '_off';
					}
					if(E.utils.execPlugin('table','combineColAfter',true)){
						iconState['combinecolafter'] = '_off';
					}
				}
			}else{
				//与表格无关的时候
				if(typeof tableIconState.tableOut[cmdName] !== 'undefined'){
					iconState[cmdName] = tableIconState.tableOut[cmdName];
				}
			}
		}
		/**
		* @description 特殊情况Redo，Undo,pastetotext,stylebrush
		**/
		var historyTmp = E.curEditor.baseHistory;
		if(historyTmp){
			iconState['redo'] = historyTmp.redoState ? '_off':'_freeze';
			iconState['undo'] = historyTmp.revertState ? '_off':'_freeze';
		}
		if(E.curEditor.pasteToText === true){
			iconState['pastetotext'] = '_on';
		}
		if(E.pluginList['font']){
			iconState['formatmatch'] = E.pluginList['font'].brushOn[E.curId] ? '_on' : '_off';
		}
		
		// 当前标签是目录时，需要禁用的功能
		if (E.curEditor.cursorElements) {
			$.each(['hn', 'table', 'a', 'sub', 'sup', 'pre'], function(i, tagname){
				if (E.curEditor.cursorElements[tagname]) {
					$.each(E.curEditor.config.cTagDisable[tagname], function(i, n){
						iconState[n] = '_freeze';
					});
				}
			});
		}
		
		/**
		* @description 更新工具条图标状态
		**/
		var o = E.curEditor.$toolbar;
		
		// 显示源码时，禁用所有工具栏按钮，除了源码、帮助、全屏等按钮
		if ( E.curEditor.isShowSource ) {
			o.children('.bke-btn').not('[cmd=codemirror],[cmd=about],[cmd=fullscreen]').addClass('bke-disabled');
			return;
		}
		
		
		/*对于有下拉菜单的项不能移除checked样式，会导致已经打开的面板被隐藏掉
		* 是由于checked样式直接影响打开面板（即图标状态与面板显示耦合）
		* */
		o.children('.bke-btn').not(':has(div.bke-submenu)').removeClass('bke-checked');
		o.children('.bke-btn').removeClass('bke-disabled');

		for(cmdName in iconState){
			if(iconState[cmdName] === '_on'){
				o.find('#icon-'+cmdName).closest('.bke-btn').addClass('bke-checked');
			}else if(iconState[cmdName] === '_freeze'){
				o.find('#icon-'+cmdName).closest('.bke-btn').addClass('bke-disabled');
			}else if(iconState[cmdName] === '_off'){
				// nothing to do
			}else{
				// 字体、字号、颜色、背景色需要将值设置到指定位置
				if (cmdName === 'backcolor' || cmdName === 'forecolor') {
					o.find('#icon-'+cmdName).find('i').css('backgroundColor', iconState[cmdName]);
				} else if (cmdName === 'fontsize' || cmdName === 'fontfamily'){
					var Plugin = E.plugin(cmdName+'menu');
					if ( Plugin && typeof Plugin.echo === 'function' ) {
						Plugin.echo(o, iconState[cmdName]);
					}
				}
			}
		}
		
	//}catch(error){
	//	this.writeError('changeIcon',3);
	//}
}

})(jQuery.jQEditor, jQuery);
(function(E){
E.addPlugin({
	id : 'image',
	type : 'dialog',
	showDialog : function(curEditor){
		var self = this;
		
		E.utils.loadDialog(this.id, E.config.cBase.uiDir+'image/',function(){
			var id = curEditor.Eid;
			E.dialog.open({
				id: 'imagedialog',
				editor: id,
				title: '图片',
				content: $('[ui=imagedialog]'),
				ok: function(){
					if ( E.ui('imagedialog').check() ) {
						E.dialog.revertSelection();
						E.command('imagedialog');
					} else {
						return false;
					}
				},
				cancel: function(){
					E.dialog.close('imagedialog');
				},
				init: function(){
					E.ui('imagedialog').callback();
				},
				beforeunload: function(){
					E.ui('imagedialog').beforeunload();
				},
				icon: 'succeed'
			});
		});
	},
	imgFloat : function(arg){
		var floatStyle = '';
		arg = parseInt(arg);
		switch(arg){
			case 1 : floatStyle = 'left';break;
			case 2 : floatStyle = 'none';break;
			case 3 : floatStyle = 'right';break;
			default :floatStyle = 'none';break;
		}
		var curImg = getCurrentImg();
		$(curImg).css('float',floatStyle);
	},
	preInsert : function(args){
		return '<a href="'+args.link+'" target="'+args.target+'"><img src="'+args.url+'" style="width:'+args.width+';height:'+args.height+';"/></a>';
	}
});

function getCurrentImg(){
	//获取光标所在的图片
	var selectTable = $(E.curEditor.dom).find('.'+ E.curEditor.config.selectImgClass);
	if(selectTable.length > 0){
		return selectTable;
	}else{
		return $(E.utils.getCurElement().pop()).prev('img');
	}
}
})(jQuery.jQEditor);
(function(E){
var menulist = [
	{'cmd':'insertcode','name':'HTML/XML','param':'html'},
	{'cmd':'insertcode','name':'Javascript','param':'js'},
	{'cmd':'insertcode','name':'CSS','param':'css'},
	{'cmd':'insertcode','name':'PHP','param':'php'},
	{'cmd':'insertcode','name':'Java','param':'java'},
	{'cmd':'insertcode','name':'Python','param':'py'},
	{'cmd':'insertcode','name':'Perl','param':'pl'},
	{'cmd':'insertcode','name':'Ruby','param':'rb'},
	{'cmd':'insertcode','name':'C#','param':'cs'},
	{'cmd':'insertcode','name':'C++/C','param':'c'},
	{'cmd':'insertcode','name':'VB/ASP','param':'vb'},
	{'cmd':'insertcode','name':'Coffee','param':'coffee'},
	{'cmd':'insertcode','name':'Shell','param':'sh'}
];

E.addPlugin({
	id: 'insertcodemenu',
	type: 'panel',
	fill: function() {
		var sizePanel = E.Menu.create(menulist);
		E.fillPanel('insertcodemenu', sizePanel);
	},
	// 将当前字号回显到工具栏
	echo: function($btn, value){
		
	}
});

E.addEvent({
	name: 'insertcode',
	type: ['click', 'keyup'],
	fn: function(arg) {
		var key = arg.event.keyCode;
		if (key && (key < 37 || key >40)) {
			// 键盘事件时，仅需要监听 上下左右 移动鼠标的按键
			return;
		}
		
		var text = '插入代码', pre = E.curEditor.cursorElements.pre;
		if (pre) {
			var code_language = $(pre).attr('name');
			
			
			$.each(menulist, function(i, n){
				if ( n.param.toLowerCase() === code_language ){
					text = n.name;
				}
			})
		}
		E.curEditor.$toolbar.find('#icon-insertcodemenu').find('.bke-InsertCode a').html(text);
	}
});

E.addPlugin({
	id: 'insertcode',
	
	click: function( code_language ) {
		var html = '<pre name="'+ code_language +'" id="prettyprint" class="prettyprint lang-' + code_language + '">&#8203;<br></pre>';
		
		var editor = E.curEditor;
		editor.insert(html);
		
		setTimeout(function(){
			var pre = E.$('#prettyprint').removeAttr('id');
			editor.setCursor(pre[0], true);
		}, 0);
	}
});

})(window.jQuery.jQEditor);
(function(E, $){
	E.addPlugin({
		id: 'insertparagraph',
		title: '插入段落',
		isEnable: true,
		click: function( action ) {
			var editor = E.curEditor;
			var el = editor.getCursorElement();
			var $o = $(el).closest('p,pre,table,ul,ol,div');
			var p = editor.dom.createElement('p');
			p.innerHTML = '&#8203;';
			$o[action](p);
			E.utils.setCursor(editor.win, p, true);
		}
	});
})(jQuery.jQEditor, jQuery);
(function(E){
	E.addPlugin({
		id : 'inserttime',
		click : function(){
			var time = new Date();
			var tmpH = time.getHours(),tmpM = time.getMinutes(),tmpS = time.getSeconds();
			tmpH = tmpH>9?tmpH:'0'+tmpH;
			tmpM = tmpM>9?tmpM:'0'+tmpM;
			tmpS = tmpS>9?tmpS:'0'+tmpS;
			var timeStr = ' '+tmpH+':'+tmpM+':'+tmpS+' ';
			E.command('insert',timeStr);
		}
	});
})(window.jQuery.jQEditor);
(function(E, $){
// 注册UI插件
E.addUi({
	id: 'linkdialog',
	
	html: '<table width="300">\
		  <tr>\
			<td>链接文字：</td>\
			<td><input type="text" name="text" style="width:200px"/></td>\
		  </tr>\
		  <tr>\
			<td>链接地址：</td>\
			<td><input type="text" name="link" value="http://" style="width:200px"/></td>\
		  </tr>\
		  <tr>\
			<td></td>\
			<td><select name="target">\
				<option value="_blank" selected="true">新窗口打开</option>\
				<option value="_top">当前窗口打开</option>\
			</select></td>\
		  </tr>\
		  </table>',
	
	// 不检查数据，没入输入文字时直接关闭
	check: function( ) {
		// var data = this.getValues();
		// if ( !data.text ) {
			// return false
		// }
	},
	
	submit: function() {
		var data = this.getValues();
		
		if ( data.text ) {
			var insertHtml = '<a href="'+data.link+'" target="'+data.target+'">'+data.text+'</a>';
			E.utils.pasteHTML(insertHtml);
		}
	}
});

// 注册命令插件
E.addPlugin({
	id: 'link'
	, title: '超链接'
	, ui: 'linkdialog'
	, type: 'dialog'
	, getData: function(editor) {
		var data = {
				text: E.utils.getSelectionText()
			};
			
		return data;
	}
});

})(jQuery.jQEditor, jQuery);
(function(E){
	var win = null;
	E.addPlugin({
		id : 'map',
		type : 'dialog',
		showDialog : function(curEditor){
			E.utils.loadDialog(this.id);
			var id = curEditor.Eid;
			E.dialog.open({
				id : 'mapdialog',
				editor : id,
				title: '插入地图',
				content: '<iframe src="'+ E.config.cBase.skinDir +'googlemap.htm" name="googlemapframe" style="width: 600px; height: 350px; border: 0px none;" frameborder="0" allowtransparency="true"></iframe>',
				ok: function(){
					E.dialog.revertSelection();
					E.command('mapdialog','submit',win);
				},
				cancel: function(){
					E.dialog.close('mapdialog');
				},
				init: function () {
					win= window.frames['googlemapframe'];
				},
				icon: 'succeed'
			});
		}
	});
})(window.jQuery.jQEditor);
(function(E){
	E.addPlugin({
		id : 'olmenu',
		type : 'panel',
		isEnable : true,
		fill : function(Eid){
			var familyPanel = '';
			var menulist = [
				{name:'1.2.3...',cmd:'insertorderedlist', param:'decimal'},
				{name:'a,b,c...',cmd:'insertorderedlist', param:'lower-alpha'},
				{name:'A,B,C...',cmd:'insertorderedlist', param:'upper-alpha'},
				{name:'i,ii,iii...',cmd:'insertorderedlist', param:'lower-roman'},
				{name:'I,II,III...',cmd:'insertorderedlist', param:'upper-roman'}
		   ];
			familyPanel = E.Menu.create(menulist);
			E.fillPanel('insertorderedlistmenu',familyPanel,Eid);
		}
	});
})(window.jQuery.jQEditor);
(function(E,$){

	E.addPlugin({
		id : 'paste',
		isEnable : true,
		// 点击右键菜单粘帖操作时执行
		click : function(){
			if(window.clipboardData){
				E.curEditor.dom.execCommand('paste');
			}else{
				E.errorMessage('请使用 Ctrl+v 进行粘贴');
			}
		},
		
		// 点击右键菜单剪切操作时执行
		cut : function(){
			if(E.IE){
				E.curEditor.dom.execCommand('cut');
			}else{
				E.errorMessage('请使用 Ctrl+x 进行剪切');
			}
		},
		
		// 点击右键菜单复制操作时执行
		copy : function(){
			if(E.IE){
				E.curEditor.dom.execCommand('copy');
			}else{
				E.errorMessage('请使用 Ctrl+c 进行复制');
			}
		},

		// 发生粘帖事件时执行
		paste : function(){
			var self = this;
			E.utils.getBoardContent(E.curEditor,function(container){
				var afterFilterHtml = '';
				if( E.curEditor.isPastetotext ) {
					afterFilterHtml = $(container).text();
				} else {
					afterFilterHtml = E.utils.filterInner(E.curEditor,container.innerHTML);
				}
				
				E.command('insert', afterFilterHtml);
			});
			if( E.IE ){
				return false;
			}
		},

		// 点击工具栏粘帖纯文本按钮时执行
		toggleTextpaste : function(){
			var isText = E.curEditor.isPastetotext = !E.curEditor.isPastetotext;
			this.clicked(isText, 'pastetotext');
		}
	});
})(window.jQuery.jQEditor,window.jQuery);
(function(E, $){
// 注册UI插件
E.addUi({
	id: 'pasteworddialog',
	
	html: '<p>请将Word当中的内容粘贴到下面的方框里，然后点击确定按钮。</p>\
		<textarea id="content" name="content" rows="20" cols="75"></textarea>',
	
	submit: function() {
		var data = this.getValues();
		
		if ( data.url ) {
			var html = '';
			
			E.utils.pasteHTML(html);
		}
	}
});

// 注册命令插件
E.addPlugin({
	id: 'pasteword'
	, title: '从 MS Word 粘帖'
	, ui: 'pasteworddialog'
	, type: 'dialog'
	, getData: function(editor) {
		var data = {};
		
		return data;
	}
});

})(jQuery.jQEditor, jQuery);
(function(E){
	E.addPlugin({
		id : 'redo',
		isEnable : true,
		click : function(){
			try{
				E.curEditor.baseHistory.redo();
			}catch(error){
				this.writeError('redo',2);
			}
		}
	});
})(window.jQuery.jQEditor);
(function(E){
	E.addPlugin({
		id : 'revert',
		isEnable : true,
		click : function(){
			try{
				E.curEditor.baseHistory.revert();
			}catch(error){
				this.writeError('revert',2);
			}
		}
	});
})(window.jQuery.jQEditor);
(function(E, $){
	E.addPlugin({
		id: 'selectall',
		title: '清空文档',
		isEnable: true,
		click: function() {
			E.curEditor.selectAll();
		}
	});
})(jQuery.jQEditor, jQuery);
(function(E, $){

var element, position, ismove = false;

E.addPlugin({
	id : 'shortcutmenu',
	
	// 转换成文本
	totext: function(){
		var text = $(element).text();
		E.$(element).replaceWith( text );
	},
	
	// 取消链接
	unlink: function(){
		var html = $(element).html();
		E.$(element).replaceWith( html );
		return true;
	},
	
	// 删除
	remove: function(){
		element.parentNode.removeChild(element);
	},
	
	// 编辑参考资料
	editRefer : function() {
		
		return true;
	},
	
	// 删除图片
	removeImage: function() {
		
		var o = $(element);
		
		if(o.closest('div.img').length){
			o = o.closest('div.img');
		}else if(o.closest('a').length){
			o = o.closest('a');
		}
		
		if ( confirm('确定删除这个图片？') ) {
			o.remove();
		}
	},
	
	// 调整图片对齐方式
	alignImage: function(args) {
		Img.update(element, args, 'align');
	},
	
	// 调整图片尺寸
	resizeImage: function(args) {
		Img.update(element, args, 'resize');
	},
	
	// 移动图片
	moveImage: function() {
		ismove = true;
	},
	
	// 图片添加描述
	descImage: function() {
		var parentNode = $(element).closest('div.img'),
			align_class = '';
		if(parentNode.length) {
			align_class = parentNode.attr('class');
			if(align_class.indexOf('img_l') > -1){
				align_class = 'left';
			}else if(align_class.indexOf('img_c') > -1) {
				align_class = 'center';
			}else if(align_class.indexOf('img_r') > -1) {
				align_class = 'right';
			}
		}
		Img.update(element, align_class, 'desc');
	},
	
	// 右键时取消移动
	// 此方法在 contextmenu.event.js 被使用
	contextmenu: function() {
		if (ismove) {
			ismove = false;
			return false;
		}
		
		return true;
	},
	
	// 选中
	select: function() {
		E.curEditor.selectNode( element );
	}
});

/**
 * 点击快捷菜单，带有cmd属性时执行相关命令
 * 
 */
$(document).delegate('.bke-shortcutmenu', 'click', function(e){
	var target = $(e.target).closest("[cmd]");
	// 被禁用的按钮点击无效
	if ( target.closest('.bke-disabled').length ) {
		return true;
	}
	
	if ( target.length ) {
		var cmd = target.attr('cmd'),
			param = target.attr('param'),
			args = target.attr('args');
		
		E.command(cmd, param, args);
		
		// 隐藏快捷菜单
		$(this).css({top: '-2000px'});
		return false;
	}
});

// 鼠标按下时记录当前元素
E.addEvent({
	name : 'shortcutmenu-mousedown',
	type : ['mousedown'],
	area : 'editArea',
	fn : function(e) {
		var o = E.$(e.target);
		if ( ismove ) {
			// 什么也不做...
			
		} else {
			position = null;
			element = null;
			
			if ( o.is('img') ) {
				if ( o.closest('div.img').length ) {
					o = o.closest('div.img');
				}
			}
			
			if ( o.is('div.img,img,h2,h3,a,sup.refer,pre') ) {
				position = o.offset()
				position.top += o.outerHeight() + 2;
				
				element = e.target;
			} else {
				// 表格判断优先级低
				// if ( o.closest('table').length ) {
					// o = o.closest('table');
					// position = o.offset();
					// position.top += o.outerHeight() + 2;
					// element = o[0];
				// }
			}
		}
	}
	
});

// 显示快捷菜单
// 2013-06-05 潘雪鹏
// 提示：
// 绑定click事件，则ie下首次点击图片时不触发click事件，比较奇怪。
// 按下鼠标拖动后，放开鼠标将不会再出发mouseup事件，
// 所以不用担心拖动操作也会出发快捷菜单。
E.addEvent({
	name : 'shortcutmenu-mouseup',
	type : ['mouseup'],
	area : 'editArea',
	fn : function(e) {
		var o = E.$(e.target);
		// 排除右键操作
		if ( e.event.which === 3 ) {
			return;
		}
		if ( ismove ) {
			// 将图片插入到当前位置
			
			if ( o.is('div.img,img,h2,h3,a,sup.refer') ) {
				// 图片、链接、参考资料、目录等标签不能放置图片
				E.errorMessage('此处不适合放置图片，请重新选择');
			} else {
				var range = E.curEditor.getRange();
				if ( $(element).closest('div.img').length ) {
					element = $(element).closest('div.img')[0];
				}
				range.insertNode(element);
				ismove = false;
			}
		} else {
			o = $('.bke-shortcutmenu');
			var $el = $(element)
				, tagName = null
				
			if ( position ) {
				tagName = element.tagName.toLowerCase();
				o.removeClass('bke-shortcutmenu-img bke-shortcutmenu-sup bke-shortcutmenu-other');
				
				if ( $el.is('img') ) {
					o.addClass('bke-shortcutmenu-img');
					// 图片快捷菜单
					setTimeout(function(){
						Img.callback(element, o);
					}, 0);
				} else if ( $el.is('sup') ) {
					o.addClass('bke-shortcutmenu-sup');
				} else if ( $el.is('pre') ) {
					o.addClass('bke-shortcutmenu-pre');
				} else {
					o.addClass('bke-shortcutmenu-other');
				}
				
				o.css(position);
				o.html( HTML[tagName]() );
				
			} else {
				o.css({top: '-2000px'});
			}
		}
	}
});

E.addEvent({
	name : 'shortcutmenu-keyup',
	type : ['keyup'],
	area : 'editArea',
	fn : function(e) {
		if ( e.event.keyCode === 27 ) {
			var text = '';
			if ( text ) {
				// 设置百科链接
				
			} else {
				E.plugin('shortcutmenu').totext();
			}
		}
	}
});


var HTML = {
	h2: function() {
		var html = [];
		html.push('<a cmd="shortcutmenu" param="totext">取消目录(Esc)</a>');
		html.push('<span class="bke-vline">|</span>');
		html.push('<a  cmd="shortcutmenu" param="remove">删除目录</a>');
		return html.join('');
	},
	
	h3: function (){return this.h2()},
	
	a: function() {
		var html = [], o = $(element),
		text = o.text(), url, href = o.attr('href');
		
		html.push('<a cmd="shortcutmenu" param="unlink" title="将链接转为纯文本">取消链接(Esc)</a>');
		if( href ){
			if( /^http:\/\/www\.(hudong|baike)\.com\/wiki\//.test(href)
				|| o.hasClass('baikelink')
				|| o.hasClass('innerlink')
			){
				url = 'http://www.baike.com/wiki/'+encodeURI(text);
			}else{
				url = href;
			}
			
			html.push('<span class="bke-vline">|</span>');
			html.push(' <a href="'+url+'" title="'+url+'" target="_blank">打开链接</a>');
		}
		return html.join('');
	},
	
	sup: function() {
		return '<a cmd="shortcutmenu" param="editRefer">编辑</a><span class="bke-vline">|</span><a cmd="shortcutmenu" param="remove">删除</a>';
	},
	
	pre: function() {
		return '<a cmd="shortcutmenu" param="select">选中</a><span class="bke-vline">|</span><a cmd="shortcutmenu" param="remove">删除</a>';
	},
	
	img: function( ) {
		var html = []
			// 只有互动的图片才可以调整尺寸
			, is_hdong_img = /a\d\.att\.(hudong|baike)\.com/i.test(element.src)
		
		html.push('<div style="height:25px;"><span style="float:left;">');
		html.push('<a cmd="shortcutmenu" param="descImage">添加描述</a>');
		html.push('<span class="bke-vline">|</span>');
		html.push('<a cmd="shortcutmenu" param="moveImage" title="点击我，然后将光标移到到新的位置，左键插入右键取消">移动图片</a></span>');
		html.push('<a cmd="shortcutmenu" param="removeImage" style="float:right;color:red;">删除</a>');
		html.push('</div>');
		html.push('<div class="bke-dottedline"></div>');
		html.push('排版：');
		html.push('<a cmd="shortcutmenu" param="alignImage" args="left">居左</a> ');
		html.push('<a cmd="shortcutmenu" param="alignImage" args="center">居中</a> ');
		html.push('<a cmd="shortcutmenu" param="alignImage" args="right">居右</a>');
		html.push('<span class="bke-vline">|</span>');
		if (is_hdong_img) {
			html.push('<a cmd="shortcutmenu" param="resizeImage" args="_950">大图</a> ');
			html.push('<a cmd="shortcutmenu" param="resizeImage" args="_s">中图</a> ');
			html.push('<a cmd="shortcutmenu" param="resizeImage" args="_140">小图</a>');
		} else {
			html.push('大图 中图 小图');
		}
		
		return html.join('');
	},
	
	table: function() {
		return '<a cmd="shortcutmenu" param="editRefer">表格全选</a><span class="bke-vline">|</span><a cmd="shortcutmenu" param="remove">行列拖拽</a>';
	}
}

// 图片快捷菜单操作对象
var Img = {
	/**
		el : 图片节点
		param : 参数【对齐方式或者大小】
		action : 标志操作类型[resize:大小，align：对齐方式，desc ：添加描述]
	*/
	update: function(el, param, action) {
		var max_width= 600,
			img_obj = $(el),
			img_width = img_obj.width(),
			align_list = {'left': 'img_l', 'center': 'img_c', 'right': 'img_r'},
			title = '',
			new_src = '';
		
		//判断是否是站点图片
		if (action=='resize' && /a\d\.att\.(hudong|baike)\.com/i.test(img_obj.attr('src'))) {
			new_src = img_obj.attr('src').replace(/_140|_s|_950/i, param);
			img_obj.attr('src',new_src);
			var tmp_img = new Image();
			tmp_img.onload = function(){
				img_obj.attr('width',tmp_img.width);
				update_view(tmp_img.width);
			};
			tmp_img.src = new_src;
		}else {
			update_view();
		}
		
		function update_view(new_width) {
			//这里需要在后面获取src值
			var link = img_obj.attr('src'),
				align_class = align_list[param] ? align_list[param]: 'img_c';//默认值img_c;跟大小操作无关，所以可以在这里赋值
			if(typeof new_width == 'number') {
				img_width = new_width;
			}
			//图片宽度超过最大值这加width属性
			if(img_width > max_width) {
				img_width = max_width;
				img_obj.width = img_width;
			}
			//外层有a标签则将a标签和img标签看陈一个整体
			if(img_obj.closest('a').length) {
				img_obj = img_obj.closest('a');
			}
			var parentNode = img_obj.closest('div.img');//div
			//img_obj外面有div.img标签情况
			if(parentNode.length) {
				if(action =='resize') {
					parentNode.width(img_width).find('img').width(img_width);
				}else {
					parentNode.removeClass('img_l img_c img_r').addClass(align_class);
				}
			}else {
				parentNode = E.$('<div class="img '+align_class+'" style="width:'+img_width+'px"></div>').append(img_obj.clone());
				img_obj.replaceWith(parentNode);
			}
			
			if(action == 'desc'){
				if( img_obj.attr('title') ){
					title = img_obj.attr('title');
				}else if( img_obj.attr('alt') ){
					title = img_obj.attr('alt');
				} else {
					title = '图片描述';
				}
				
				if( parentNode.find('strong').length ){
					parentNode.find('strong').text(title);
				}else{
					parentNode.append('<strong>'+title+'</strong>');
				}
			}else{
				//删除描述strong标签style属性，该属性中的width会导致图片大小缩放是文字不居中
				parentNode.find('strong').removeAttr('style');
			}
		}
	},
	
	// 重置图片快捷菜单的当前状态
	// 如图片已经是居右状态时，则将“右”置为不可操作状态
	callback: function(el, menu) {
		var parentNode = $(el).closest('div.img'),//div
			selected_size = null,
			selected_align = null,
			align_list = {'left': 'img_l', 'center': 'img_c', 'right': 'img_r'},
			size_list = ['_950', '_s', '_140'],
			selected_css = {'color': '#666666','cursor': 'default','text-decoration': 'none'};
			//判断最外层是否有DIV标签
		if(parentNode.length) {
			//判断是否有img样式类
			if(parentNode.attr('class').indexOf('img') > -1) {
				var class_value = parentNode.attr('class');
				//判断是否有控制位置的类
				for(var key in align_list) {
					var item = align_list[key];
					if(class_value.indexOf(item) > -1) {
						selected_align = key;
						break;
					}
				}
				if(selected_align) {
					var align_obj = menu.find('[args='+selected_align+']');
					align_obj.css(selected_css).removeAttr('cmd');
				}
				//是否存在描述标签，并且内容不为空
				var disc_obj = parentNode.find('strong');
				if(disc_obj.length > 0 && $.trim(disc_obj.text()) ) {
					disc_obj = menu.find('[param=descImage]');
					disc_obj.css(selected_css).removeAttr('cmd').attr('title', '已存在图片描述，直接修改即可');
				}
			}
		}
		
		//是互动的图片
		if(/a\d\.att\.(hudong|baike)\.com/i.test(el.src)) {
			var img_src = el.src;
			for(var i = 0; i < size_list.length ; i++) {
				var item = size_list[i];
				if(img_src.indexOf(item) > -1) {
					var size_obj = menu.find('[args='+item+']');
					size_obj.css(selected_css).removeAttr('cmd');
					break;
				}
			}
		}
	}
}


})(jQuery.jQEditor, jQuery);
(function(E, $){
	var selOffset = '';
	// 注册UI插件
	E.addUi({
		id: 'sourcedialog',
		html: '<textarea name="content" style="width:700px;height:400px;resize:none;"></textarea>',
		
		submit: function() {
			var content = $('#sourcedialog').find('textarea').val();
			E.curEditor.setContent(content);
			if(selOffset){
				E.utils.setSelectionByOffset(E.curEditor.win,selOffset);
			}
			selOffset = '';
		}
	});
	
	// 注册命令插件
	E.addPlugin({
		id: 'source',
		title: '源代码',
		ui: 'sourcedialog',
		type: 'dialog',
		
		getData: function(editor) {
			selOffset = E.utils.getSelectionOffset(editor.win);
			var data = {
					content: formatHtml(editor.getContent())
				};
				
			return data;
		}
		/*
		, check: function() {
			var self = this;
			//var values = E.uiList[self.ui].getValues();
			
			return true;
		}
		*/
	});
	
	
	function formatHtml( html ){
		html = html.replace(/\n+/g, '');
		
		var wrap = $('<div></div>').append( html ),
			itemHtml='',
			child = null;
			
		wrap.children().each(function(i, el){
			// jquery-1.4.2 IE下会出现异常
			try{
				child = $(this);
				itemHtml = child.html();
				if(itemHtml.length > 50){
					child.html('\n'+itemHtml+'\n');
				}
				child.after('\n');
			}catch(e){}
		});
		
		var table = wrap.find("table");
		if( table.size() ){
			table.find("tr,td,th").after('\n').before('\n');
		}
		
		html = wrap.html();
		html = html.replace(/\n+/g, '\n');
		html = html.replace(/<BR>/ig, '<br>\n');
		
		html = html.replace(/<.+?>/ig, function($0){
			$0 = $0.replace(/COLOR:/g, 'color:');
			$0 = $0.replace(/rgb\(\d+,(?: |&nbsp;)?\d+,(?: |&nbsp;)?\d+\)/ig, function($0){
				return Utils.colorToHex($0);
			});
			return $0;
		});
		
		// IE下将标签转为小写
		if( E.IE ){
			html = html.replace(/<(\w+)/ig, function($0, tagName){
				return '<'+tagName.toLowerCase();
			});
			html = html.replace(/(\w+)>/ig, function($0, tagName){
				return tagName.toLowerCase()+'>';
			});
		}
		
		return html;
	}
})(jQuery.jQEditor, jQuery);
(function(E){
	var bottommenulist = [
		{'name':'0px','cmd':'spacebottom','param':'0px','styleName':''},
		{'name':'5px','cmd':'spacebottom','param':'5px','styleName':''},
		{'name':'10px','cmd':'spacebottom','param':'10px','styleName':''},
		{'name':'15px','cmd':'spacebottom','param':'15px','styleName':''},
		{'name':'20px','cmd':'spacebottom','param':'20px','styleName':''}
   ];
   var topmenulist = [
		{'name':'0px','cmd':'spacetop','param':'0px','styleName':''},
		{'name':'5px','cmd':'spacetop','param':'5px','styleName':''},
		{'name':'10px','cmd':'spacetop','param':'10px','styleName':''},
		{'name':'15px','cmd':'spacetop','param':'15px','styleName':''},
		{'name':'20px','cmd':'spacetop','param':'20px','styleName':''}
   ];
   var linemenulist = [
		{'name':'0行距','cmd':'linespace','param':'1em','styleName':''},
		{'name':'0.5倍行距','cmd':'linespace','param':'1.5em','styleName':''},
		{'name':'单倍行距','cmd':'linespace','param':'2em','styleName':''},
		{'name':'1.25倍行距','cmd':'linespace','param':'2.25em','styleName':''},
		{'name':'1.5倍行距','cmd':'linespace','param':'2.5em','styleName':''},
		{'name':'1.75倍行距','cmd':'linespace','param':'2.75em','styleName':''},
		{'name':'2倍行距','cmd':'linespace','param':'3em','styleName':''},
		{'name':'3倍行距','cmd':'linespace','param':'4em','styleName':''}
   ];
	E.addPlugin({
		id : 'spacemenu',
		type : 'panel',
		isEnable : true,
		fill : function(){
			var topPanel = E.Menu.create(topmenulist);
			var bottomPanel = E.Menu.create(bottommenulist);
			var linePanel = E.Menu.create(linemenulist);
			E.fillPanel('spacebottommenu', bottomPanel);
			E.fillPanel('spacetopmenu', topPanel);
			E.fillPanel('linespacemenu', linePanel);
		},
		bottom:function(){
			E.toolbar.togglePanel('spacebottommenu');
		},
		top:function(){
			E.toolbar.togglePanel('spacetopmenu');
		},
		line:function(){
			E.toolbar.togglePanel('linespacemenu');
		}
	});
})(window.jQuery.jQEditor);
(function(E, $){
	var charTable = [
		['±','×','÷','∶','∑','∏','∪','∩','∈','∷'],
		['√','⊥','∥','∠','⌒','∫','∮','≡','≌','≈'],
		['∝','≠','≮','≯','≤','≥','∞','∵','∴','㏑'],
		['㏒'],
		['＄','￠','￡','㏎','㎎','㎏','㎜','㎝','㎞','㎡'],
		['㏄','㏕','№'],
		['ā','á','ǎ','à','ē','é','ě','è','ī','í'],
		['ǐ','ì','ō','ó','ǒ','ò','ū','ú','ǔ','ù'],
		['ǖ','ǘ','ǚ','ǜ','ü']
	];
	
	E.addPlugin({
		id: 'specharsmenu'
		, type: 'panel'
		
		, fill: function(){
			var colorPanel = '';
			E.fillPanel('specharsmenu', getHtml());
		}
		
		, click: function(){
			E.toolbar.togglePanel('specharsmenu');
		}
	});

	function getHtml() {
		var html = '<table>';
		
			for(var i = 0; i < charTable.length; i++) {
			
				var item = charTable[i];
				html += '<tr>';
				
				for(var j= 0; j< item.length; j++) {
					html += '<td><a href="javascript:void(0)"'
						+ ' cmd="spechars" param="'+ item[j] +'"'
						+ ' class="special_num">'
						+ item[j]
						+ '</a></td>';
				}
				
				html+= '</tr>';
			}
			
			html+='</table>';
			
		return html;
	}
	
})(jQuery.jQEditor, jQuery);
(function(E,$){
	E.addPlugin({
		id : 'table',
		type : 'dialog',
		selectCellClass : 'bke-cell-selected',
		selectTableClass : 'bke-table-selected',
		tableFreshed : '',
		showDialog : function(curEditor){
			//加载表格弹窗，初始化并打开
			E.utils.loadDialog(this.id,E.config.cBase.uiDir+'table/',function(){
				var id = curEditor ? curEditor.Eid : E.curEditor.Eid;
				E.dialog.open({
					id : 'tabledialog',
					editor : id,
					title: '插入表格',
					content: $('[ui=tabledialog]'),
					ok : function(){
						E.dialog.revertSelection();
						E.command('tabledialog');
					},
					cancel : function(){
						E.dialog.close('tabledialog');
					},
					icon: 'succeed'
				});
			});
		},
		insert : function(col_row){
			//插入表格到当前光标处
			var ij =  col_row.split('-');
			var inAttr = {
				row : ij[0],
				col : ij[1],
				floatStyle : '',
				head : 0,
				title : ''
			}
			var tableHtml = this.getTableHtml(inAttr);
			E.coreCommand.editInsert(tableHtml);
		},
		
		getTableHtml: function( conf ) {
			
			var row = parseInt(conf.row) < 50 ? parseInt(conf.row) : 4,
				col = parseInt(conf.col) < 20 ? parseInt(conf.col) : 3,
				className = '';
			
			className = conf.floatStyle? ' table-'+conf.floatStyle : '';
			
			var html = '<table class="table '+className+'" border="1" cellpadding="0" border-style="solid" style="width:760px"><tbody>';
			
			// 表格名称行
			if(conf.title){
				html += '<caption>'+E.utils.spaceText+'</caption>';
			}
			
			for(var i= 0;i<row;i++){
				html += '<tr>';
				for(var j=0;j<col;j++){
					if(conf.head && i === 0){
						// 表格标题行
						html += '<th row="'+i+'" col="'+j+'">'+E.utils.spaceText+'</th>';
					}else{
						html += '<td row="'+i+'" col="'+j+'">'+E.utils.spaceText+'</td>';
					}
				}
				html += '</tr>';
			}
			
			html += '</tbody></table>';
			return html;
		},
		
		preInsert : function(attr){
			//插入弹窗前，进行html拼接
			var newTable = E.curEditor.dom.createElement('table');
			//表格基本参数
			var row = parseInt(attr.row) < 50 ? parseInt(attr.row) : 4,
				col = parseInt(attr.col) < 20 ? parseInt(attr.col) : 3,
				//align = parseInt(attr.align) < 10 ? parseInt(attr.align) : 5,
				float = parseInt(attr.float) < 4 ? parseInt(attr.float) : 2,
				title = attr.title ? true : false,
				head = attr.head ? true : false;
				
			//此处定义表格的基本样式
			$(newTable).attr({'border':1, 'Cellpadding':0, 'border-style':'solid'});
			
			//表格的宽度选择
			$(newTable).width('100%');
			
			//标题
			if(title){
				$(newTable).prepend('<caption>title</caption>');
			}
			//内容区域，是否有表头
			for(var i= 0;i<row;i++){
				$(newTable).append('<tr></tr>');
				for(var j=0;j<col;j++){
					var curTr = $(newTable).find('tr:eq('+i+')');
					if(head && i === 0){
						curTr.append('<th row='+i+' col='+j+'>'+E.utils.spaceText+'</th>');
					}else{
						curTr.append('<td row='+i+' col='+j+'>'+E.utils.spaceText+'</td>');
					}
				}
			}
			//浮动方式
			var floatStyle = '';
			switch(float){
				case 1 : floatStyle = 'left';break;
				case 2 : floatStyle = 'none';break;
				case 3 : floatStyle = 'right';break;
				default : floatStyle = 'none';break;
			}
			$(newTable).css('float',floatStyle);
			return newTable.outerHTML;
		},
		insertRow : function(pos){
			/*插入一行，pos选择在上还是在下插入*/
			//开始操作前更新表格，防止属性遗失不能操作;
			this.freshTableIndex(getCurrentTable());
			var selectRectangle = getSelectedRectangle();
			//总列数
			var colNums = $(selectRectangle.curTable).find('tr').first().find('th,td').length;
			var insertColPosition = {},newCell = {},oldCell = {};
			//选中区域跨的行数，循环次数为要插入的行数
			for(var i=selectRectangle.startRow;i<=selectRectangle.endRow;i++){
					var newTr = E.curEditor.dom.createElement('tr');
					//hideBefore为前一个插入的单元格是否是隐藏的单元格，并且隐藏还未结束
					//使用整型变量控制，正数时对应该单元格仍需继续隐藏
					var cloneCell = {},hideBefore = 0;
					if(pos === 'forward'){
						//获得待复制的行，然后逐个复制单元格,向上插入为选中区域最顶行
						insertColPosition = $(selectRectangle.curTable).find('tr:eq('+i+')');
						for(var j=0;j<colNums;j++){
							oldCell = insertColPosition.find('td,th').eq(j);
							cloneCell = this._cloneRowCell(oldCell,pos,hideBefore);
							newCell = cloneCell['cloneCell'];
							hideBefore = cloneCell['hideCells'] ? cloneCell['hideCells'] :hideBefore - 1;
							$(newTr).append(newCell);
						}
						insertColPosition.before($(newTr));
					}else if(pos === 'backward'){
						//获得待复制的行，然后逐个复制单元格,向下插入为选中区域最底行
						insertColPosition = $(selectRectangle.curTable).find('tr:eq('+selectRectangle.endRow+')');
						for(var j=0;j<colNums;j++){
							oldCell = insertColPosition.find('td,th').eq(j);
							cloneCell = this._cloneRowCell(oldCell,pos,hideBefore);
							newCell = cloneCell['cloneCell'];
							hideBefore = cloneCell['hideCells'] ? cloneCell['hideCells'] :hideBefore - 1;
							$(newTr).append(newCell);
						}
						insertColPosition.after($(newTr));
					}else{
						E.errorMessage('参数错误');
					}
			}
			//插入结束之后要重新整理表格的索引col，row属性
			this.freshTableIndex(selectRectangle.curTable,true);
		},
		insertCol : function(pos){
			/*插入一列，pos选择在左还是在右插入*/
			//开始操作前更新表格，防止属性遗失不能操作;
			this.freshTableIndex(getCurrentTable());
			var selectRectangle = getSelectedRectangle();
			//总行数
			var rowNums = $(selectRectangle.curTable).find('tr').length;
			var insertCellPosition = {},curInsertCol = {},newCell = {};
			//hideBefore为前一个插入的单元格是否是隐藏的单元格，并且隐藏还未结束
			//使用整型变量控制，正数时对应该单元格仍需继续隐藏
			var cloneCell = {},hideBefore = 0;
			for(var j=0;j<rowNums;j++){
				curInsertCol = $(selectRectangle.curTable).find('tr:eq('+j+')');
				//选中区域跨的列数，循环次数为要插入的列数
				for(var i=selectRectangle.startCol;i<=selectRectangle.endCol;i++){
					if(pos === 'forward'){
						//获得待复制的单元格，向前插入为选中区域最左边
						insertCellPosition = curInsertCol.find('td,th').eq(i);
						cloneCell = this._cloneColCell(insertCellPosition,pos,hideBefore);
						newCell = cloneCell['cloneCell'];
						insertCellPosition.before(newCell);
					}else if(pos === 'backward'){
						//获得待复制的单元格，向后插入为选中区域最右边
						insertCellPosition = curInsertCol.find('td,th').eq(selectRectangle.endCol);
						cloneCell = this._cloneColCell(insertCellPosition,pos,hideBefore);
						newCell = cloneCell['cloneCell'];
						insertCellPosition.after(newCell);
					}else{
						E.errorMessage('参数错误');
					}
				}
				hideBefore = cloneCell['hideCells'] ? cloneCell['hideCells'] :hideBefore - 1;
			}
			//插入结束之后要重新整理表格的索引col，row属性
			this.freshTableIndex(selectRectangle.curTable,true);
		},
		combineCell : function(){
			/*合并单元格，根据选择区域*/
			//开始操作前更新表格，防止属性遗失不能操作;
			this.freshTableIndex(getCurrentTable());
			var selectedCell =  getSelectedCell();
			var cellLen = selectedCell.length;
			if(cellLen > 1){
				//选取最后一个单元格，获得最后一个单元格的行列，合并行，合并列属性
				//[warning]与表格选择的耦合性很大，需要确定最后一个选择的单元格时最右下角的单元格
				var oldColSpan = $(selectedCell[cellLen-1]).attr('colspan') ? parseInt($(selectedCell[cellLen-1]).attr('colspan')) : 1,
					oldRowSpan = $(selectedCell[cellLen-1]).attr('rowspan') ? parseInt($(selectedCell[cellLen-1]).attr('rowspan')) : 1;
				//与第一个单元格位置做差，得到合并后的单元格需要的合并行，和并列属性
				var newRowSpan = parseInt($(selectedCell[cellLen-1]).attr('row')) - parseInt($(selectedCell[0]).attr('row')),
					newColSpan= parseInt($(selectedCell[cellLen-1]).attr('col')) - parseInt($(selectedCell[0]).attr('col'));
				$(selectedCell[0]).attr('colspan',newColSpan+oldColSpan);
				$(selectedCell[0]).attr('rowspan',newRowSpan+oldRowSpan);
				selectedCell.not(selectedCell[0]).hide();
				selectedCell.not(selectedCell[0]).attr('rowspan',1).attr('colspan',1);
				selectedCell.not(selectedCell[0]).removeClass(E.curEditor.config.selectCellClass);
			}
		},
		combineColAfter : function(judge){
			/*合并单元格，同行向后一个单元格合并*/
			//开始操作前更新表格，防止属性遗失不能操作;
			this.freshTableIndex(getCurrentTable());
			var curCell = getCurrentCell();
			if(curCell.length > 0){
				var oldRowSpan = $(curCell[0]).attr('rowspan') ? parseInt($(curCell[0]).attr('rowspan')) : 1,
					oldColSpan = $(curCell[0]).attr('colspan') ? parseInt($(curCell[0]).attr('colspan')) : 1;
				//获取同行，之后列中第一个不隐藏的单元格
				var nextCell = $(curCell[0]).nextAll('td,th').eq(oldColSpan-1).not(':hidden');
				if(nextCell.length > 0){
					var nextRowSpan = nextCell.attr('rowspan') ? parseInt(nextCell.attr('rowspan')) : 1,
						nextColSpan = nextCell.attr('colspan') ? parseInt(nextCell.attr('colspan')) : 1;
					//如果所占行数一样，则可以合并
					if(oldRowSpan === nextRowSpan){
						if(judge){
							return true;
						}else{
							nextCell.attr('colspan','1').attr('rowspan','1').hide();
							curCell.attr('colspan',oldColSpan+nextColSpan);
						}
					}else{
						if(judge){
							return false;
						}else{
							E.errorMessage('合并失败，单元格行跨度不一致');
						}
					}
				}else{
					if(judge){
						return false;
					}else{
						E.errorMessage('没有单元格可以合并');
					}
				}
			}
		},
		combineRowAfter : function(judge){
			/*合并单元格，同列向后一个单元格合并*/
			//开始操作前更新表格，防止属性遗失不能操作;
			this.freshTableIndex(getCurrentTable());
			var curCell = getCurrentCell();
			if(curCell.length > 0){
				var oldRowSpan = $(curCell[0]).attr('rowspan') ? parseInt($(curCell[0]).attr('rowspan')) : 1,
					oldColSpan = $(curCell[0]).attr('colspan') ? parseInt($(curCell[0]).attr('colspan')) : 1;
				var oldCol = parseInt($(curCell[0]).attr('col'));
				//获取同列，下面行中第一个不隐藏的单元格
				var nextCell = $(curCell[0]).closest('tr').nextAll('tr:eq('+(oldRowSpan-1)+')').first().find('td[col='+oldCol+']:visible,th[col='+oldCol+']:visible');
				if(nextCell.length > 0){
					var nextRowSpan = nextCell.attr('rowspan') ? parseInt(nextCell.attr('rowspan')) : 1,
						nextColSpan = nextCell.attr('colspan') ? parseInt(nextCell.attr('colspan')) : 1;
					//如果所占列数一样，则可以合并
					if(nextColSpan === oldColSpan){
						if(judge){
							return true;
						}else{
							nextCell.attr('colspan','1').attr('rowspan','1').hide();
							curCell.attr('rowspan',oldRowSpan+nextRowSpan);
						}
					}else{
						if(judge){
							return false;
						}else{
							E.errorMessage('合并失败，单元格列跨度不一致');
						}
					}
				}else{
					if(judge){
						return false;
					}else{
						E.errorMessage('没有单元格可以合并');
					}
				}
			}
		},
		splitCellWhole : function(cell){
			/*完全拆分单元格*/
			//开始操作前更新表格，防止属性遗失不能操作;
			this.freshTableIndex(getCurrentTable());
			var curCell = typeof cell === 'object' ? $(cell) : getCurrentCell();
			if(curCell.length > 0){
				var oldRowSpan = $(curCell[0]).attr('rowspan') ? parseInt($(curCell[0]).attr('rowspan')) : 1;
				var oldColSpan = $(curCell[0]).attr('colspan') ? parseInt($(curCell[0]).attr('colspan')) : 1;
				var oldCol = parseInt($(curCell[0]).attr('col'));
				//获取那些因为当前单元格的列合并，行合并所隐藏的单元格
				var nextCell = $(curCell[0]).closest('tr').nextAll('tr:lt('+(oldRowSpan-1)+')').andSelf().find('td:lt('+(oldCol+oldColSpan)+'):gt('+(oldCol-1)+'),th:lt('+(oldCol+oldColSpan)+'):gt('+(oldCol-1)+')').not(':visible');
				if(nextCell.length > 0){
					curCell.attr('colspan','1').attr('rowspan','1').addClass(E.curEditor.config.selectCellClass);
					nextCell.attr('colspan','1').attr('rowspan','1').addClass(E.curEditor.config.selectCellClass).show();
				}else{
					E.errorMessage('没有单元格供拆分');
				}
			}
		},
		splitToRows : function(cell){
			/*拆分成行单元格，根据光标位置*/
			//开始操作前更新表格，防止属性遗失不能操作;
			this.freshTableIndex(getCurrentTable());
			var curCell = typeof cell === 'object' ? $(cell) : getCurrentCell();
			if(curCell.length > 0){
				var oldRowSpan = $(curCell[0]).attr('rowspan') ? parseInt($(curCell[0]).attr('rowspan')) : 1;
				var oldColSpan = $(curCell[0]).attr('colspan') ? parseInt($(curCell[0]).attr('colspan')) : 1;
				var oldCol = parseInt($(curCell[0]).attr('col'));
				//获取那些因为当前单元格的列合并所隐藏的单元格
				var nextCell = $(curCell[0]).closest('tr').nextAll('tr:lt('+(oldRowSpan-1)+')').find('td[col='+oldCol+']:hidden,th[col='+oldCol+']:hidden');
				if(nextCell.length > 0){
					curCell.attr('rowspan','1').addClass(E.curEditor.config.selectCellClass);
					if(oldColSpan > 1){
						nextCell.attr('colspan',oldColSpan);
					}
					nextCell.attr('rowspan','1').addClass(E.curEditor.config.selectCellClass).show();
				}else{
					E.errorMessage('没有行单元格供拆分');
				}
			}
		},
		splitToCols : function(cell){
			/*拆分列单元格，根据光标位置*/
			//开始操作前更新表格，防止属性遗失不能操作;
			this.freshTableIndex(getCurrentTable());
			var curCell =  typeof cell === 'object' ? $(cell) : getCurrentCell();
			if(curCell.length > 0){
				var oldRowSpan = $(curCell[0]).attr('rowspan') ? parseInt($(curCell[0]).attr('rowspan')) : 1;
				var oldColSpan = $(curCell[0]).attr('colspan') ? parseInt($(curCell[0]).attr('colspan')) : 1;
				//获取那些因为当前单元格的行合并所隐藏的单元格
				var nextCell = $(curCell[0]).nextAll('td:lt('+(oldColSpan-1)+'),th:lt('+(oldColSpan-1)+')').not(':visible');
				if(nextCell.length > 0){
					curCell.attr('colspan','1').addClass(E.curEditor.config.selectCellClass);
					if(oldRowSpan > 1){
						nextCell.attr('rowspan',oldRowSpan);
					}
					nextCell.attr('colspan','1').addClass(E.curEditor.config.selectCellClass).show();
				}else{
					E.errorMessage('没有列单元格供拆分');
				}
			}
		},
		deleteCol : function(){
			/*删除一行，根据光标位置*/
			//开始操作前更新表格，防止属性遗失不能操作;
			this.freshTableIndex(getCurrentTable());
			var selectRectangle = getSelectedRectangle();
			//总列数
			var colNums = $(selectRectangle.curTable).find('tr').first().find('th,td').length;
			var deleteColPosition = {},oldCell = {};
			//使用遍历选中行的方式，从后到前依次便利，不会带来因为删除而要用的索引值错误的情况
			for(var i=selectRectangle.endRow;i>=selectRectangle.startRow;i--){
				deleteColPosition = $(selectRectangle.curTable).find('tr:eq('+i+')');
				//从后到前依次便利，不会带来因为删除而要用的索引值错误的情况
				for(var j=colNums-1;j>=0;j--){
					oldCell = deleteColPosition.find('td,th').eq(j);
					var colInfo = this._colInfo(oldCell);
					//单元格在一个行合并区域（详见 _colInfor 函数）
					if(colInfo.isInCol < 0){
						//拥有行合并属性
						if(colInfo.lastRowspan > 1){
							// if在行合并区域的顶端,else在行合并区域的中间或底端
							if(colInfo.isInCol + colInfo.lastRowspan === 0){
								var nextRowCell = deleteColPosition.next('tr').find('[col='+j+']');
								nextRowCell.attr('rowspan',colInfo.lastRowspan-1).show();
							}else{
								colInfo.lastVisibleCell.attr('rowspan',colInfo.lastRowspan-1);
							}
						}
					}
					oldCell.remove();
				}
				deleteColPosition.remove();
			}
			//删除结束之后要重新整理表格的索引col，row属性
			this.freshTableIndex(selectRectangle.curTable,true);
		},
		deleteRow : function(){
			/*删除一列，根据光标位置*/
			//开始操作前更新表格，防止属性遗失不能操作;
			this.freshTableIndex(getCurrentTable());
			var selectRectangle = getSelectedRectangle();
			var rowNums = $(selectRectangle.curTable).find('tr').length;
			var deleteCellPosition = {},curDeleteCol = {};
			//使用便利所有的方式，从后到前依次便利，不会带来因为删除而要用的索引值错误的情况
			for(var j=rowNums-1;j>=0;j--){
				curDeleteCol = $(selectRectangle.curTable).find('tr:eq('+j+')');
				//遍历选中列，从后到前依次便利，不会带来因为删除而要用的索引值错误的情况
				for(var i=selectRectangle.endCol;i>=selectRectangle.startCol;i--){
					deleteCellPosition = curDeleteCol.find('td,th').eq(i);
					var rowInfo = this._rowInfo(deleteCellPosition);
					//单元格在一个列合并区域（详见 _rowInfo 函数）
					if(rowInfo.isInRow < 0){
						//拥有列合并属性
						if(rowInfo.lastColspan > 1){
							// if在列合并区域的左端,else在列合并区域的中间或右端
							if(rowInfo.isInRow + rowInfo.lastColspan === 0){
								var nextRowCell = deleteCellPosition.next('td,th');
								nextRowCell.attr('colspan',rowInfo.lastColspan-1).html('del').show();
							}else{
								rowInfo.lastVisibleCell.attr('colspan',rowInfo.lastColspan-1);
							}
						}
					}
					deleteCellPosition.remove();
				}
			}
			//删除结束之后要重新整理表格的索引col，row属性
			this.freshTableIndex(selectRectangle.curTable,true);
		},
		//deleteColRow : function(){/*删除所在行和列，根据选择区域*/},
		deleteTable : function(){
			/*删除整个表格，根据光标位置或整个选择的表*/
		    var curTable = getCurrentTable();
			$(curTable).remove();
		},
		tableAttrDialog : function(){
			/*打开弹窗*/
			E.utils.loadDialog(this.id,E.config.cBase.uiDir+'table/',function(){
				var curTable = getCurrentTable();
				//为打开的弹窗设置待显示的参数
				var args = {};
				switch(curTable.css('float')){
					case 'left' : args.float = 1;break;
					case 'none' : args.float = 2;break;
					case 'right' : args.float = 3;break;
					default : args.float = 2;break;
				}
				var hasTh = curTable.find('th').length;
				args.head = hasTh ? true : false;
				var hasTitle = curTable.find('caption:first-child').length;
				args.title = hasTitle ? true : false;
				var rowLen = curTable.find('tr').length;
				args.row = rowLen ? rowLen : false;
				var colLen = curTable.find('tr:first').find('th,td').length;
				args.col = colLen ? colLen : false;
				//ui属性指定要使用的ui类，默认为id
				var id = E.curEditor.Eid;
				E.dialog.open({
					id : 'tableattrdialog',
					editor : id,
					ui : 'tabledialog',
					title: '表格属性',
					content: $('[ui=tabledialog]'),
					ok : function(){
						E.command('tabledialog','changeAttr');
					},
					cancel : function(){
						E.dialog.close('tabledialog');
					},
					icon: 'succeed'
				},args);
			});
		},
		freshTableIndex : function(tableNode,force){
			if(this.tableFreshed === $(tableNode)[0] && force !== true){
				return ;
			}
			var curSelect = E.utils.getSelectionRange(E.curEditor.win,'node');
			var jTable = tableNode ? $(tableNode) : $(E.curEditor.dom).find('table');
			//遍历所有表格，如果传递了待修改的表格，则只修改传递的表格
			jTable.each(function(e1){
				var cellArr = [];
				var colIndex = 0,rowIndex = 0;
				var maxColLen = 0;
				//优先移除所有隐藏的单元格，方便定位，这样也不会影响现有显示的单元格的内容
				$(this).find('td:hidden,th:hidden').remove();
				var jTr = $(this).find('tr');
				//遍历行
				jTr.each(function(e2){
					var jCell = $(this).find('td,th');
					//为表格数组拓展第二维空间
					if(typeof cellArr[rowIndex] === 'undefined'){
						cellArr[rowIndex] = [];
					}
					//遍历行内单元格
					jCell.each(function(e3){
						var sCol = $(this).attr('colspan') ? parseInt($(this).attr('colspan')) : 1;
						var sRow = $(this).attr('rowspan') ? parseInt($(this).attr('rowspan')) : 1;
						var colIndexTmp = colIndex;
						//使用占位方式，如果已经有其他单元格占位则向后边空位置占位
						while(typeof cellArr[rowIndex][colIndexTmp] !== 'undefined'){
							colIndexTmp += 1;
						}
						cellArr[rowIndex][colIndexTmp] = $(this);
						//有行列合并的情况
						if(sCol > 1 || sRow > 1){
							//遍历行（列合并数）
							while(sCol > 1){
								//克隆一个隐藏的单元格，重置行列合并属性，占位
								var newCellCol = $(this).clone(true);
								newCellCol.attr('colspan','1').attr('rowspan','1');
								newCellCol.html(' ').hide();
								cellArr[rowIndex][colIndexTmp+sCol-1] = newCellCol;
								var sRowTmp = sRow;
								//如果还有rowspan属性
								while(sRowTmp > 1){
									//克隆一个隐藏的单元格，重置行列合并属性，占位
									var newCellRow = $(this).clone(true);
									newCellRow.attr('colspan','1').attr('rowspan','1');
									newCellRow.html(' ').hide();
									if(typeof cellArr[rowIndex+sRowTmp-1] === 'undefined'){
										cellArr[rowIndex+sRowTmp-1] = [];
									}
									cellArr[rowIndex+sRowTmp-1][colIndexTmp+sCol-1] = newCellRow;
									sRowTmp -= 1;
								}
								sCol -= 1;
								$(this).after(newCellCol);
							}
							//遍历列（行合并数）
							while(sRow > 1){
								//克隆一个隐藏的单元格，重置行列合并属性，占位
								var newCellRow = $(this).clone(true);
								newCellRow.attr('colspan','1').attr('rowspan','1');
								newCellRow.html(' ').hide();
								if(typeof cellArr[rowIndex+sRow-1] === 'undefined'){
									cellArr[rowIndex+sRow-1] = [];
								}
								cellArr[rowIndex+sRow-1][colIndexTmp] = newCellRow;
								sRow -= 1;
							}
						}
						colIndex += 1;
					});
					//获取最大的列数
					maxColLen = Math.max(maxColLen,cellArr[rowIndex].length);
					rowIndex += 1;
					colIndex = 0;
				});
				var rowLen = cellArr.length;
				var jTrLen = $(this).find('tr').length;
				//根据数组的占位补全行
				while(jTrLen < rowLen){
					$(this).append('<tr></tr>');
					jTrLen += 1;
				}
				//遍历数组，重排填充表格，如果数组内为 undefined，则用新单元格补齐
				for(var i=0;i<rowLen;i++){
					var colLen = Math.max(maxColLen,cellArr[i].length);
					var jTrContain = $(this).find('tr:eq('+i+')');
					for(var j=0;j<colLen;j++){
						if(typeof cellArr[i][j] === 'undefined'){
							cellArr[i][j] = $('<td row="'+i+'" col="'+j+'"></td>');
						}
						(cellArr[i][j]).attr('row',i).attr('col',j);
						jTrContain.append(cellArr[i][j]);
					}
				}
			});
			E.utils.setSelectionRange(E.curEditor.win,curSelect,'node');
			this.tableFreshed = tableNode ? $(tableNode)[0] : '';
		},
		toggleHead : function(hasHead){
			//设置取消表格列头
			var curTable = getCurrentTable();
			if(typeof hasHead === 'undefined' || hasHead === ''){
				hasHead = $(curTable).find('tr:first').find('th').length !== 0 ? true : false;
			}
			if(!hasHead && $(curTable).find('tr:first').find('th').length === 0){
				var colLen = $(curTable).find('tr:first').find('td').length;
				var trContain = E.curEditor.dom.createElement('tr'), th=[];
				for(var i=0;i<colLen;i++){
					th[i] = E.curEditor.dom.createElement('th');
					th[i].innerHTML = '&#8203;';
					$(trContain).append(th[i]);
				}
				$(curTable).find('tr:first').before(trContain);
				E.utils.setCursor(E.curEditor.win, th[0], true);
				this.freshTableIndex(curTable,true);
			}else if(hasHead && $(curTable).find('tr:first').find('th').length !== 0){
				$(curTable).find('tr:first').remove();
				this.freshTableIndex(curTable,true);
			}
		},
		
		// 设置取消表格标题名称
		// 插入成功后将光标定位到表格名称处
		toggleTitle : function(hasTitle){
			var curTable = getCurrentTable();
			if(typeof hasTitle === 'undefined' || hasTitle === ''){
				hasTitle = $(curTable).find('caption:first-child').length !== 0 ? true : false;
			}
			if(!hasTitle && $(curTable).find('caption:first-child').length === 0){
				var editor = E.curEditor;
				var caption = editor.dom.createElement('caption');
				caption.innerHTML = '&#8203;';
				$(curTable).prepend(caption);
				E.utils.setCursor(editor.win, caption, true);
			}else if(hasTitle && $(curTable).find('caption:first-child').length !== 0){
				$(curTable).find('caption:first-child').remove();
			}
		},
		changeTableAttr : function(attr){
			/*改变表格属性，根据attr修改*/
			var curTable = getCurrentTable();
			var //align = parseInt(attr.align) < 10 ? parseInt(attr.align) : 5,
				float = parseInt(attr.float) < 4 ? parseInt(attr.float) : 2,
				title = attr.title ? true : false,
				head = attr.head ? true : false;
			//标题
			this.toggleTitle(!title);
			
			//表头
			this.toggleHead(!head);
			//表格浮动
			var floatStyle = '';
			switch(float){
				case 1 : floatStyle = 'left';break;
				case 2 : floatStyle = 'none';break;
				case 3 : floatStyle = 'right';break;
				default : floatStyle = 'none';break;
			}
			$(curTable).css('float',floatStyle);
		},
		cellJustify : function(align){
			var alignStyle = '',valignStyle = '';
			align = parseInt(align);
			switch(align){
				case 1 : alignStyle = 'left';valignStyle = 'top';break;
				case 2 : alignStyle = 'center';valignStyle = 'top';break;
				case 3 : alignStyle = 'right';valignStyle = 'top';break;
				case 4 : alignStyle = 'left';valignStyle = 'middle';break;
				case 5 : alignStyle = 'center';valignStyle = 'middle';break;
				case 6 : alignStyle = 'right';valignStyle = 'middle';break;
				case 7 : alignStyle = 'left';valignStyle = 'bottom';break;
				case 8 : alignStyle = 'center';valignStyle = 'bottom';break;
				case 9 : alignStyle = 'right';valignStyle = 'bottom';break;
				default :alignStyle = 'center';valignStyle = 'middle';break;
			}
			var selectedCell = getSelectedCell();
			if($(selectedCell).length === 0){
				selectedCell = getCurrentCell();
				if($(selectedCell).length === 0){
					return ;
				}
			}
			$(selectedCell).css('text-align',alignStyle);
			$(selectedCell).css('vertical-align',valignStyle);
		},
		cellColor : function(color){
			var selectedCell = $(E.curEditor.dom).find('body table .'+E.curEditor.config.selectCellClass);
			if(selectedCell.length === 0){
				selectedCell = $(E.utils.getCurElement().pop()).closest('td,th');
			}
			selectedCell.css('background-color',color);
		},
		tableFloat : function(arg){
			var floatStyle = '';
			arg = parseInt(arg);
			switch(arg){
				case 1 : floatStyle = 'left';break;
				case 2 : floatStyle = 'none';break;
				case 3 : floatStyle = 'right';break;
				default :floatStyle = 'none';break;
			}
			var curTable = getCurrentTable();
			$(curTable).css('float',floatStyle);
		},
		/**
		 * @desciption 为插入行克隆单元格，需要确定克隆后的单元格是否需要被隐藏
		 * @param oldCell {object} 待克隆的单元格
		 * @param toward {string} emnu['forward','backward'] 向前还是后插入的克隆
		 * @param hideBefore {number} 隐藏信息，正数为隐藏
		 * @returns {object} 克隆单元格，及其隐藏信息
		 * @private
		 */
		_cloneRowCell : function(oldCell,toward,hideBefore){
			var returnCell = {};
			var newCell = oldCell.clone().html('newcell');
			var towardFlag = toward === 'forward' ? true : false;
			var rowInfo = this._rowInfo(oldCell);
			//在合并行中
			if(rowInfo.isInRow < 0){
				//向后插入并且有行合并属性
				if(!towardFlag && rowInfo.addRowspan > 1){
					newCell.hide();
					//就是拥有行合并属性的单元格，第一个增加了rowspan的值，之后的不增加
					if(rowInfo.isInRow + rowInfo.lastColspan === 0){
						rowInfo.lastVisibleCell.attr('rowspan',rowInfo.addRowspan+1);
					}
				}else{
					newCell.show();
				}
			}else{
				var colInfo = this._colInfo(oldCell);
				//在合并列中
				if(colInfo.isInCol < 0){
					//拥有行合并属性
					if(colInfo.lastRowspan > 1){
						//向后插入并且不在最后，向前插入并且不在最前
						if((!towardFlag && colInfo.isInCol < -1) || (towardFlag && colInfo.isInCol + colInfo.lastRowspan > 0)){
							newCell.hide();
							//增加隐藏信息，为下一个单元格准备
							returnCell['hideCells'] = colInfo.addColspan;
							colInfo.lastVisibleCell.attr('rowspan',colInfo.lastRowspan+1);
						}else{
							newCell.show();
						}
					}else{
						newCell.show();
					}
				}else{
					if(hideBefore > 0){
						newCell.hide();
					}else{
						newCell.show();
					}
				}
			}
			newCell.removeClass(E.curEditor.config.selectCellClass);
			newCell.attr('colspan',1).attr('rowspan',1);
			newCell.attr('col',-1).attr('row',-1);
			returnCell['cloneCell'] = newCell;
			return returnCell;
		},
		/**
		 * @desciption 为插入行克隆单元格，需要确定克隆后的单元格是否需要被隐藏
		 * @param oldCell {object} 待克隆的单元格
		 * @param toward {string} emnu['before','after'] 向前还是后插入的克隆
		 * @param hideBefore {number} 隐藏信息，正数为隐藏
		 * @returns {object} 克隆单元格，及其隐藏信息
		 * @private
		 */
		_cloneColCell : function(oldCell,toward,hideBefore){
			var returnCell = {};
			var newCell = oldCell.clone().html('&#8203;');
			var towardFlag = toward === 'forward' ? true : false;
			var colInfo = this._colInfo(oldCell);
			//在合并列中
			if(colInfo.isInCol < 0){
				//向后插入并且有列合并属性
				if(!towardFlag && colInfo.addColspan > 1){
					newCell.hide();
					//就是拥有列合并属性的单元格，第一个增加了colspan的值，之后的不增加
					if(colInfo.isInCol + colInfo.lastRowspan === 0){
						colInfo.lastVisibleCell.attr('colspan',colInfo.addColspan+1);
					}
				}else{
					newCell.show();
				}
			}else{
				var rowInfo = this._rowInfo(oldCell);
				//在合并行中
				if(rowInfo.isInRow < 0){
					//拥有列合并属性
					if(rowInfo.lastColspan > 1){
						//向后插入并且不在最右，向前插入并且不在最左
						if((!towardFlag && rowInfo.isInRow < -1) || (towardFlag && rowInfo.isInRow + rowInfo.lastColspan > 0)){
							newCell.hide();
							//增加隐藏信息，为下一个单元格准备
							returnCell['hideCells'] = rowInfo.addRowspan;
							rowInfo.lastVisibleCell.attr('colspan',rowInfo.lastColspan+1);
						}else{
							newCell.show();
						}
					}else{
						newCell.show();
					}
				}else{
					if(hideBefore > 0){
						newCell.hide();
					}else{
						newCell.show();
					}
				}
			}
			newCell.removeClass(E.curEditor.config.selectCellClass);
			newCell.attr('colspan',1).attr('rowspan',1);
			newCell.attr('col',-1).attr('row',-1);
			returnCell['cloneCell'] = newCell;
			return returnCell;
		},
		_rowInfo : function(oldCell){
			//同行前一个未隐藏的单元格，也可以是自身
			var lastVisibleCell = {};
			if(oldCell.not(':visible').length !== 0){
				lastVisibleCell = oldCell.prevAll(':visible').first();
			}else{
				lastVisibleCell = oldCell;
			}
			var visibleColIndex = lastVisibleCell.length === 0 ? -1 :parseInt(lastVisibleCell.attr('col'));
			//未隐藏的单元格的colspan属性
			var lastColspan = lastVisibleCell.attr('colspan') ? parseInt(lastVisibleCell.attr('colspan')) : 1;
			//未隐藏的单元格的rowspan属性
			var addRowspan = lastVisibleCell.attr('rowspan') ? parseInt(lastVisibleCell.attr('rowspan')) : 1;
			//传入的单元格是否在这个未隐藏的单元格的合并行中
			var isInRow = parseInt(oldCell.attr('col')) - visibleColIndex - lastColspan;
			return {isInRow:isInRow,lastColspan:lastColspan,addRowspan:addRowspan,lastVisibleCell:lastVisibleCell};
		},
		_colInfo : function(oldCell){
			//同列前一个未隐藏的单元格，也可以是自身
			var lastVisibleCell = {};
			if(oldCell.not(':visible').length !== 0){
				lastVisibleCell = oldCell.closest('table').find('[col='+parseInt(oldCell.attr('col'))+']:lt('+parseInt(oldCell.attr('row'))+')').not(':hidden').last();
			}else{
				lastVisibleCell = oldCell;
			}
			var visibleRowIndex = lastVisibleCell.length === 0 ? -1 :parseInt(lastVisibleCell.attr('row'));
			//未隐藏的单元格的rowspan属性
			var lastRowspan = lastVisibleCell.attr('rowspan') ? parseInt(lastVisibleCell.attr('rowspan')) : 1;
			//未隐藏的单元格的colspan属性
			var addColspan = lastVisibleCell.attr('colspan') ? parseInt(lastVisibleCell.attr('colspan')) : 1;
			//传入的单元格是否在这个未隐藏的单元格的合并列中
			var isInCol = parseInt(oldCell.attr('row')) - visibleRowIndex - lastRowspan;
			return {isInCol:isInCol,lastRowspan:lastRowspan,addColspan:addColspan,lastVisibleCell:lastVisibleCell};
		}
	});

	function getSelectedCell(tableNode){
	   //获取被选中的单元格
		if(tableNode){
			return $(E.curEditor.dom).find(tableNode).find('.'+ E.curEditor.config.selectCellClass);
		}else{
			return $(E.curEditor.dom).find('.'+ E.curEditor.config.selectCellClass);
		}
	}
	function getCurrentCell(){
		//获取光标所在单元格
		return $(E.utils.getCurElement().pop()).closest('td,th');
	}
	function getCurrentTable(){
		//获取光标所在单元格
		var selectTable = $(E.curEditor.dom).find('.'+ E.curEditor.config.selectTableClass);
		if(selectTable.length > 0){
			return selectTable;
		}else{
			return $(E.utils.getCurElement().pop()).closest('table');
		}
	}
	function getSelectedRectangle(tableNode){
		//获得选择区域的矩形范围
		var cellRectangle = {
			curTable : tableNode,
			startCol : -1,
			endCol : -1,
			startRow : -1,
			endRow : -1
		};
		var jSelectedCell = getSelectedCell(tableNode);
		if(jSelectedCell.length !== 0){
			var jStartCell = $(jSelectedCell[0]);
			var jEndCell = $(jSelectedCell[jSelectedCell.length-1]);
			cellRectangle['startCol'] = parseInt(jStartCell.attr('col'));
			cellRectangle['startRow'] = parseInt(jStartCell.attr('row'));
			cellRectangle['endCol'] = parseInt(jEndCell.attr('col'));
			cellRectangle['endRow'] = parseInt(jEndCell.attr('row'));
			var sEndCol = jEndCell.attr('colspan') ? parseInt(jEndCell.attr('colspan')) : 1;
			var sEndRow = jEndCell.attr('rowspan') ? parseInt(jEndCell.attr('rowspan')) : 1;
			cellRectangle['endCol'] += sEndCol-1;
			cellRectangle['endRow'] += sEndRow-1;
		}else{
			jSelectedCell = $(getCurrentCell());
			cellRectangle['startCol'] = parseInt(jSelectedCell.attr('col'));
			cellRectangle['startRow'] = parseInt(jSelectedCell.attr('row'));
			var sEndCol = jSelectedCell.attr('colspan') ? parseInt(jSelectedCell.attr('colspan')) : 1;
			var sEndRow = jSelectedCell.attr('rowspan') ? parseInt(jSelectedCell.attr('rowspan')) : 1;
			cellRectangle['endCol'] = cellRectangle['startCol'] + sEndCol - 1;
			cellRectangle['endRow'] = cellRectangle['startRow'] + sEndRow - 1;
		}
		cellRectangle['curTable'] = jSelectedCell.closest('table');
		return cellRectangle;
	}
})(window.jQuery.jQEditor,window.jQuery);
(function(E, $){
	E.addPlugin({
		id : 'tablemenu',
		type : 'panel',
		isEnable : true,
		fill : function(){
			//填充table面板
			E.fillPanel('inserttablemenu', createTablePanel(10,10));
			
			$(document).delegate('.bke-plugin-table td', 'mouseenter',function(e){
			
				var ij =  $(e.target).closest('td[args]').attr('args').split('-'),
					row = parseInt(ij[0]),
					col = parseInt(ij[1]),
					table = $(e.target).closest('.bke-plugin-table');
					
				table.parent().children('.bke-info').text(ij[0]+'行 '+ij[1]+'列');
				table.find('td').removeClass('cell-hover');
				table.find('tr:lt('+row+')').find('td:lt('+col+')').addClass('cell-hover');
				
			}).delegate('.bke-plugin-table', 'mouseleave',function(e){
			
				var table = $(e.target).closest('.bke-plugin-table');
				
				table.parent().children('.bke-info').text('0行 0列');
				table.find('td').removeClass('cell-hover');
			});
		},
		
		getTablePanel: function(){
			return createTablePanel(10,10);
		}
	});

	// 构造表格下拉菜单
	function createTablePanel(row,col){
		//拼接table面板html字符串
		// 面板样式[TODO]
		var tablePanel = document.createElement('div');
		var newTable = document.createElement('table');
		$(newTable).addClass('bke-plugin-table');
		for(var i= 0;i<row;i++){
			$(newTable).append('<tr></tr>');
			for(var j=0;j<col;j++){
				var curTr = $(newTable).find('tr:eq('+i+')');
				curTr.append('<td args="'+(i+1)+'-'+(j+1)+'" cmd="inserttable" param="insert"><a></a></td>');
			}
		}
		var insertMenu = E.Menu.create([{name:'插入表格',cmd:'inserttable', param:'showDialog'}]);
		
		$(tablePanel).append('<div class="bke-info">0行 0列</div>');
		$(tablePanel).append(newTable);
		//$(tablePanel).append(insertMenu);
		return tablePanel.innerHTML;
	}

})(jQuery.jQEditor, jQuery);
(function(E){
	E.addPlugin({
		id : 'ulmenu',
		type : 'panel',
		isEnable : true,
		fill : function(Eid){
			var familyPanel = '';
			var menulist = [
				{name:'小圆圈',cmd:'insertunorderedlist', param:'disc'},
				{name:'小圆点',cmd:'insertunorderedlist', param:'circle'},
				{name:'小方块',cmd:'insertunorderedlist', param:'square'}
		   ];
			familyPanel = E.Menu.create(menulist);
			E.fillPanel('insertunorderedlistmenu',familyPanel,Eid);
		}
	});
})(window.jQuery.jQEditor);
(function(E, $){

var domain = location.hostname
	, remoteImages = []

E.addPlugin({
	id: 'uploadremoteimage'
	, domains: [location.hostname]
	, click: function(){
		Main.check(E.curEditor.dom);
	}
});

var Main = {
	//正在上传第几张图片
	index: 0,
	
	// 检查内容当中是否存在需要上传的远程图片
	check: function( dom ) {
		var images = dom.getElementsByTagName('img'),
			plugin = E.plugin('uploadremoteimage'),
			i=0, len = images.length,
			src, host;
			
		remoteImages = [];
		
		for(i=0; i<len; i++ ) {
			src = E.$(images[i]).attr('src');
			host = this.getHostname(src);
			
			if ( host && $.inArray(host, plugin.domains) ) {
				remoteImages.push(images[i]);
			}
		}
		
		if ( remoteImages.length ) {
			// 提示有几张图片需要上传
			E.message('有 '+ remoteImages.length +' 张图片等待上传，请稍等...');
			this.upload();
		} else {
			// 提示没有需要上传的图片
			E.message('未检测到需要上传的图片')
		}
	},
	
	getHostname: function( url ){
		var parts, host='';
		url = $.trim(url);
		if ( /^https?:/i.test(url) ){
			parts = url.split('/');
			host = parts[2];
		}
		return host;
	},
	
	// 上传图片
	upload: function( ){
		var self = this
			, image = remoteImages.shift()
			, src = $(image).attr('src')
			, remoteImgSaveAction = '/upload.php?action=saveFromUrl';
			
		self.index += 1;

		$.ajax({
			type: 'POST',
			url: remoteImgSaveAction,
			data: {saveFromUrl: src},
			dataType: 'json',
			success: function( data ) {
				E.$(image).attr('src', data['url'] );
			},
			
			complete: function(xhr, status) {
				// 检查下一张
				if ( remoteImages.length ) {
					E.message('第 '+self.index+' 张图片上传完成');
					setTimeout(function(){self.upload()}, 500);
				} else {
					// 上传完毕
					self.index = 0;
					E.message('所有图片上传完成');
				}
			}
		});
	}
}
})(jQuery.jQEditor, jQuery);
(function(E, $){
// 注册UI插件
E.addUi({
	id: 'videodialog',
	
	html: '<table width="300">\
			<tr>\
			<td>视频地址：</td>\
			<td><input type="text" name="url" style="width:200px"/></td>\
			</tr><tr>\
			<td>宽：</td>\
			<td><input type="text" name="width" value="800" style="width:60px"/> px</td>\
			</tr><tr>\
			<td>高：</td>\
			<td><input type="text" name="height" value="600" style="width:60px"/> px</td>\
			</tr></table>',
	
	// 不检查数据，没入输入文字时直接关闭
	check: function( ) {
		// var data = this.getValues();
		// if ( !data.text ) {
			// return false
		// }
	},
	
	submit: function() {
		var data = this.getValues();
		
		if ( data.url ) {
			var insertHtml = '<embed src="'+data.url+'" quality="high" width="'+data.width+'" height="'+data.height+'" align="middle" allowScriptAccess="sameDomain" allowFullscreen="true" type="application/x-shockwave-flash"></embed>';
			
			E.utils.pasteHTML(insertHtml);
		}
	}
});

// 注册命令插件
E.addPlugin({
	id: 'video'
	, title: '视频'
	, ui: 'videodialog'
	, type: 'dialog'
	, getData: function(editor) {
		var data = {};
		
		return data;
	}
});

})(jQuery.jQEditor, jQuery);