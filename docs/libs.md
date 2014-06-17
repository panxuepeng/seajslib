<a name="list"></a>
## 组件列表


### 互动弹窗

互动百科目前使用的弹窗组件，通过给超链接(“a"标签)添加属性data-toggle="dialog"，点击超链接后，使用ajax方式加载弹出窗口内容。如果href使用“#”号开头（如#dialog-demo），则相当去获取 $("#dialog-demo").html() 内容赋值给弹窗。  
<a href="lib/dialog/examples/data.txt" data-toggle="dialog"><img src="assets/img/dialog.jpg" style="width:240px;"/></a>

支持的data属性包括：

	data-width="400" // 宽
	data-height="200" // 高
	data-skin="hudong" // 皮肤 hudong(默认)|xiaobaike|greybox|default|noborder
	data-zindex="200" // 层高
	data-opacity="0.7" // 遮罩层的透明度
	
<a href="#dialog-demo" data-toggle="dialog" data-skin="xiaobaike">data-skin="xiaobaike"</a> 
<a href="#dialog-demo" data-toggle="dialog" data-skin="greybox">data-skin="greybox"</a> 
<a href="#dialog-demo" data-toggle="dialog" data-skin="default">data-skin="default"</a> 
<a href="#dialog-demo" data-toggle="dialog" data-skin="noborder">data-skin="noborder"</a>

快速演示：
	
	<a href="lib/dialog/examples/data.txt" data-toggle="dialog">请点击我（ajax方式拿到内容）</a>
	<a href="#dialog-demo" data-toggle="dialog">请点击我（选择器方式拿到内容）</a>
	<div id="dialog-demo" data-toggle="dialog" style="display:none">我是弹窗的内容</div>
	
<div id="dialog-demo" data-toggle="dialog" style="display:none">我是弹窗的内容</div>
<a href="lib/dialog/examples/data.txt" data-toggle="dialog">请点击我（ajax方式拿到内容）</a>
<a href="#dialog-demo" data-toggle="dialog">请点击我（选择器方式拿到内容）</a>

普通使用方式：

	seajs.use(['dialog'], function( Dialog ){
		var dialog = Dialog({
			id: 'ajax',
			title: '提示',
			content: '内容',
			width: 500,
			height: 200,
			onok: function( panel, dialog ){
				dialog.close();
			},
			offsetY: -50
		}).show();
	});

详细参数

	seajs.use(['dialog'], function( Dialog ){
		$.dialog({
			id: 'default',
			title: '标题',
			type: 'html', // html img ajax iframe selector
			content: '',
			align: 'left',
			valign: 'center',
			width: 340,
			height: 150,
			fixedSize: false, // 窗口大小自适应内容，并自动根据内容重新定位窗口
			offsetX: 0, // 水平方向位置调整，负值会使窗口偏左
			offsetY: 0, // 垂直方向位置调整，负值会使窗口偏上

			// 中间center 中上center-top 中下center-bottom
			// 右下right-bottom 左上left-top
			position: 'center',
			fixed: true, // 固定，不随屏幕滚动
			draggable: true, // 是否可拖动，拖动功能依赖于 jquery-dragdrop.js

			zIndex: 0, // 默认为0，除非要使用置顶窗口，否则不要使用此设置
			autoClose: 0, // 自动关闭

			// 遮罩层
			overlay: {
				opacity: 0.2, // 透明度 0 - 1
				bgColor: '#000' // 背景色，默认黑色
			},

			// 光标默认位置，在输入框的开始或末尾
			focusInput: '', // '', start, end

			// 事件
			one: null, // 仅首次显示后执行
			callback: null, // 弹窗每次显示完成后执行
			onclose: null,
			oncancel: null,
			onok: null,
			onclick: null,
			onmouseover: null,
			onmouseout: null,

			textOk:'确 定',
			textCancel:'取 消',

			// 正在加载的提示信息
			loadding: 'loadding...',
			loadErrorInfo:'加载失败',

			// 皮肤
			skin: 'hudong', //默认有：default noborder bluebox greybox xiaobaike hudong

			// 自定义样式，方便在不更换皮肤的情况下进行样式微调
			// style: {title: {key:value, key2:value2, .....}}
			style: {
				'outter-wrap':'',
				'inner-wrap':'',
				'title':'',
				'content':'',
				'bottom':'',
				'ok':'',
				'cancel':'',
				'close':'',
				'error':'',
				'success':'',
				'status':''
			}
		});
	});

常见问题
1. 
	
目前状态: 已引入  
组件路径: dialog/2.8.0/dialog  
使用文档: [演示及使用手册](lib/dialog/examples/)


### artDialog（弹窗）

artDialog 是一个设计得十分巧妙的对话框组件，小巧身材却拥有丰富的接口与漂亮的外观。通过给超链接(“a"标签)添加属性data-toggle="artdialog"，点击超链接后，使用ajax方式加载弹出窗口内容。如果href使用“#”号开头（如#artdialog-demo），则相当去获取 $("#artdialog-demo").html() 内容赋值给弹窗。  
<a href="lib/artdialog/examples/data.txt" data-toggle="artdialog"><img src="assets/img/artdialog.jpg" style="width:240px;"/></a>

*注意：*ie6下只能使用default样式，其他浏览器可以使用green皮肤。也就是说ie6和其他浏览器是两种样式。所以，目前来看可能比较适合后台使用。

支持的data属性包括：

	data-width="400" // 宽
	data-height="200" // 高
	data-zindex="200" // 层高
	data-lock="true" // true|false(默认) 是否使用遮罩层
	
快速演示：

	<a href="lib/artdialog/examples/data.txt" data-toggle="artdialog">请点击我（ajax方式拿到内容）</a>
	<a href="#artdialog-demo" data-toggle="artdialog">请点击我（选择器方式拿到内容）</a>
	<div id="artdialog-demo" data-toggle="artdialog" style="display:none">我是artDialog弹窗的内容</div>
	
<div id="artdialog-demo" data-toggle="artdialog" style="display:none">我是artDialog弹窗的内容</div>
<a href="lib/artdialog/examples/data.txt" data-toggle="artdialog" data-lock="true">请点击我（ajax方式拿到内容）</a>
<a href="#artdialog-demo" data-toggle="artdialog" >请点击我（选择器方式拿到内容）</a>


	seajs.use(['artdialog'], function(dialog){
		dialog({
			fixed: true,
			title: '提示',
			width: 500,
			height: 200,
			content: '内容'
		});
	});
	
目前状态: 已引入  
组件路径: artDialog/5.0.3/artDialog  
使用文档: [演示及使用手册](lib/artdialog/examples/)



### 日历

一个简单的日历组件，通过给input标签 &lt;input type="text" **data-toggle="calendar"**/&gt; 增加 data-toggle="calendar" 属性即可。   
<img src="assets/img/calendar.jpg" style="width:240px;"/>

支持的data属性包括：

	data-beginyear="2000" // 起始年份
	data-endyear="2013" // 结束年份
	
演示 <input type="text" data-toggle="calendar"/>

目前状态: 已引入  
组件路径: calendar/0.1.0/calendar  
使用文档: [演示及使用手册](lib/calendar/examples/)



### 小百科图片上传

百科站点前台上传图片组件  

	seajs.use('baikeupload', function( ){
		var url="*";
			
		$('#baikeupload').baikeUpload({
			url: url,
			uploading: function(){
				
			},
			success: function( imgUrl ){
				alert(imgUrl);
			},
			error: function(msg){
				alert(msg);
			},
			complete: function(){
				
			}
		});
	});
	
<button id="baikeupload">选择图片</button>（需先点击【运行】按钮）

目前状态: 已开发  
组件路径: baikeupload/0.1.0/baikeupload  
使用文档: [演示及使用手册](lib/baikeupload/examples/)



### 表单验证(HTML5 风格)

HTML5风格的意思是,表单验证规则是通过给表单项增加属性定义的，而不是通过定义纯js对象。关于HTML5 表单属性的详细内容，可以参考[这里](http://www.w3school.com.cn/html5/html_5_form_attributes.asp)

目前 type 的类型支持 email/tel/url/range/number 等 HTML5 Form API 支持的类型，当 type 不存在，但为验证项时，则测试表单是否有空；当有标记 `maxLength` 的时候验证表单值的长度；当有 min/max 的时候和 `type=range` 一样验证当前值是否在 min/max 区间：`min <= value <= max`。


同时，如果表单存在 pattern 属性，则不使用 type 作为验证，保持与 HTML5 API 一致，可以作为一种表单自定义验证的方式。比如下面这个表项，将不按 type="email" 来验证，而是使用 pattern 中的正则表达式来验证：

```
<input type="email" pattern="参照 HTML5 规范的正则表达式" />
```

**异步验证**

在表单添加一个 data-url 的属性指定异步验证的 URL 那可，有几个可选的项：

	data-url: 异步验证的 url
	data-method: [可选] AJAX 请求的方法: get,post,getJSON 等，默认是 get
	data-key: [可选] 发送当前表单值时用的 key，默认是 'key'：$.get(url, {key: 表单的值})

如
```
<input type="text" data-url="https://api.github.com/legacy/user/search/china" data-method="getJSON" required>
```

**自定义事件**

可以在 html 中添加 `data-event` 以在单独的元素中触发自定义事件。假设我们设置一个 `hello` 事件，最终会触发在验证这个表单前触发 `before.hello` 事件，并且在验证完当前表单后触发一个 `after.hello` 事件。默认不触发任何事件：

```html
<input id="event" type="text" data-event="hello" required>
```

可以使用标准的 jQuery `on`(jQuery1.7+) 或 `bind`(jQuery1.4+) 方法来监听这个事件：

	$('#event').on('before:hello', function(event, element){
	  alert('`before.hello` event trigger on $("#' + element.id + '")');
	});

	$('#event').on('after:hello', function(event, element){
	  alert('`after.hello` event trigger on $("#' + element.id + '")');
	});
	
**参数设置**
	
	$('#formid').validator({
		// 验证失败是给表单项添加到classname，默认是error
		errorClass: 'error'
		
		// 指定classnaqme添加到父标签上
		, isErrorOnParent: true
		
		// 表单在提交时，如果有验证失败，将调用此方法
		// 参数 unvalidFields 是未通过验证的表单项列表
		, submitError: function(unvalidFields){
			$(unvalidFields).each(function(i, item){
			
			});
			//return false; 将阻止表单提交
		}
		
		// 所有的表单项，验证失败时都会执行这个方法
		, inputError: function( $el ){
			
		}
		
		// 在表单提交前/后执行的方法
		// 参数是表单项集合的jQuery对象
		, before: function($items) {}
		
		// 如果没有验证失败的表单项，将执行after方法
		// 如果after方法返回false，将阻止表单提交
		, after: function($items) {return true}
		
	});


目前状态: 已引入  
组件路径: validator/1.1.0/validator   
使用文档: [演示及使用手册](lib/validator/examples/)  
兼容测试：主流浏览器（包括IE6）

### SlidesJS(幻灯片)
SlidesJS 是一个简单的容易定制和风格化的jQuery幻灯片插件。
SlidesJS提供褪色或幻灯片过渡效果，图像淡入淡出，图像预压，自动生成分页，循环，自动播放的自定义等很多选项。

目前状态: 已引入  
组件路径: slidesjs/3.0.3/slidesjs  
使用文档: [演示](lib/slidesjs/examples/)，[官方手册](http://slidesjs.com/)  
注意事项：依赖jQuery (1.7.1+) 


### Underscore（函数库）
Underscore(<http://underscorejs.org>)是一个非常实用的JavaScript库，提供许多编程时需要的功能的支持，他在不扩展任何JavaScript的原生对象的情况下提供很多实用的功能。代码1000来行，包含60多个函数，提供完整的[测试用例集合](http://documentcloud.github.com/underscore/test/test.html)，
提供[带注释的源码](http://documentcloud.github.com/underscore/docs/underscore.html)

	seajs.use(['underscore'], function(_){
		_.each([1, 2, 3], function(i){alert(i)});
	});
	
目前状态: 已引入  
组件路径: underscore/1.4.4/underscore  
使用文档: 请参考[官方手册](http://underscorejs.org)



### Moment(日期处理类库)

Moment.js是一个简单易用的轻量级JavaScript日期处理类库，提供了日期格式化、日期解析等功能。它支持在浏览器和NodeJS两种环境中运行。此类库能够将给定的任意日期转换成多种不同的格式，具有强大的日期计算功能，同时也内置了能显示多样的日期形式的函数。

	seajs.use(['moment'], function(moment){
		var now = moment();
		alert(now.format('YYYY-MM-DD'));
	});
	
目前状态: 已引入  
组件路径: moment/2.0.0/moment  
使用文档: 请参考[官方手册](http://momentjs.com/docs/)
	


### 自动完成

一个基本jquery的自动完成组件 
<input type="text" data-toggle="autocomplete" data-url="lib/autocomplete/examples/search.php">

目前状态: 已引入  
组件路径: autocomplete/2.4.4/autocomplete  
使用文档: [演示](lib/autocomplete/examples/)，[官方手册](https://github.com/dyve/jquery-autocomplete/blob/master/doc/jquery.autocomplete.txt)



### 树形菜单ztree

zTree 是一个依靠 jQuery 实现的多功能 “树插件”。优异的性能、灵活的配置、多种功能的组合是 zTree 最大优点。

目前状态: 已引入  
组件路径: ztree/3.5.12/ztree  
使用文档: [官方手册](http://www.ztree.me/v3/demo.php#_101)



### JSON

一个js封装的 JSON 操作库，Chrome、Firefox、IE8+已经原生支持 JSON 对象，不需要引用此库。ie6/7下如有json相关操作，可考虑使用。

	seajs.use(['json'], function(JSON){
		var str = '{"key":"value","name":"panxuepeng"}';
		var obj = JSON.parse(str); //由JSON字符串转换为JSON对象
		var str = JSON.stringify(obj); //将JSON对象转化为JSON字符
		alert(str); // {"key":"value","name":"panxuepeng"}
	});

目前状态: 已引入  
组件路径: json/2.0.0/json  
使用文档: 请参考[官方手册](http://www.json.org/)



### 可实时编辑的表格

双击单元格使其处于可编辑状态

目前状态: 已开发  
组件路径: edittable/0.1.0/edittable  
使用文档: [演示及使用手册](lib/edittable/examples/)



### 级联下拉菜单

一个select 多级选择 操作库

目前状态: 已开发  
组件路径: selectlist/0.1.0/selectlist  
使用文档: [演示及使用手册](lib/selectlist/examples/)



### fixed(固定元素)
将标签固定在页面某个位置上，兼容ie6。本文档右下角的返回顶部按钮，就正在使用fixed组件。

三种情况：

1. 根据窗口定位工具条，常见于右下角回顶部等按钮
2. 根据页面偏移位置定位工具条，常见于文章目录导航等按钮，或者右侧浮动区块等
3. 页面顶部或底部浮动工具条


支持的data属性包括：

	data-type="ontop" // 4个值：ontop onbottom onright oncenter
	data-right="10" // 距离窗口右侧的距离，data-type="onright"时有效
	data-bottom="80" // 距离窗口底部的距离，data-type="onright|oncenter"时有效
	data-offset="200" // 距离窗口中心向右偏移的距离，data-type="oncenter"时有效
	data-top="30" // 距离窗口顶部多大距离时开始浮动，data-type="oncenter"时有效
	data-trigger="scrolltop" // 当 scrollTop === data-top的值时触发浮动

例如  

	<div class="fixedbar1" data-toggle="fixed" data-type="ontop">固定元素到窗口顶部</div>
	<div class="fixedbar1" data-toggle="fixed" data-type="onbottom">固定元素到窗口底部</div>
	<div class="fixedbar2" data-toggle="fixed" data-type="onright" data-right="10" data-bottom="80">返回顶部</div>
	<div class="fixedbar2" data-toggle="fixed" data-type="oncenter" data-offset="200" data-bottom="100">目录</div>

使用时，仅需要引入即可
	
	seajs.use('fixed');
	
目前状态: 开发中  
组件路径: fixed/0.2.0/fixed  
使用文档: [演示及使用手册](lib/fixed/examples/)



### 幻灯片

目前状态: 开发中  
组件路径: slide/0.1.0/slide  
使用文档: [演示及使用手册](lib/slide/examples/)


### 右键菜单

一块基于jQuery的右键菜单

目前状态: 已引入  
组件路径: contextmenu_hd/0.1.0/contextmenu_hd  
使用文档: [演示及使用手册](lib/contextmenu_hd/examples/)，请参考[官方手册](http://medialize.github.com/jQuery-contextMenu/demo.html)



### 通用的拖拽效果

目前状态: 已开发  
组件路径: easydrag/0.1.0/easydrag   
使用文档: [演示及使用手册](lib/artdialog/examples/)



### 下拉菜单

目前状态: 待开发  
组件路径: select/0.1.0/select  
使用文档: 请参考[官方手册](http://momentjs.com/docs/)


### 取色器(word样式)
&lt;input type="input" class="btn" **data-toggle="colorpicker"**/&gt;
演示 <input type="input" value="点击选择颜色" class="btn" data-toggle="colorpicker"/>


目前状态: 已开发  
组件路径: colorpicker/0.1.0/colorpicker  
使用文档: [演示及使用手册](lib/colorpicker/examples/)




### 文件上传plupload

Plupload 是一个Web浏览器上的界面友好的文件上传模块，可显示上传进度、图像自动缩略和上传分块。可同时上传多个文件，可以将图片在浏览器压缩后在上传，并且会保留图片的Exif信息。

	seajs.use(['plupload'], function(plupload){
		
	});

目前状态: 已引入  
组件路径: plupload/1.5.6/plupload  
使用文档: 请参考[官方手册](http://www.plupload.com/documentation.php)



### 语法高亮(SyntaxHighlighter)

目前状态: 待引入  
组件路径:  
使用文档: 请参考[官方手册]()



### 代码高亮(google-code-prettify)

Google Code Prettify是一个JavaScript库，用来对各种页面上的源码进行语法着色高亮显示。Google Code Prettify很小巧，约15K。支持大部分常用的编程语言。使用时不需要指定语言。

给pre标签加上data-toggle="prettify"属性即可自动实现代码高亮。本文档的源码部分文字就是使用这个组件高亮的！

普通使用方法，主要是没有使用data-toggle="prettify"属性时使用

	seajs.use('prettify', function( Prettify ){
		Prettify.prettyPrint();
	});

注意，上面这个运行按钮点击后可能没有任何效果。因为代码已经高亮过了。
	
目前状态: 已引入  
组件路径:  prettify/2.0.0/prettify  
使用文档: [演示](lib/prettify/examples/)，详情请参考[官方手册](https://code.google.com/p/google-code-prettify/wiki/GettingStarted)



### 图表库(highcharts)

Highcharts 是一个用纯JavaScript编写的一个图表库, 能够很简单便捷的在web网站或是web应用程序添加有交互性的图表。目前HighCharts支持的图表类型有曲线图、区域图、柱状图、饼状图、散状点图和综合图表。

目前状态: 已引入   
组件路径:highcharts/2.3.5/highcharts  
使用文档: [演示](lib/highcharts/examples/)，详情请参考[官方演示](http://www.highcharts.com/demo/)



### 图表库(highstock)

曲线图、折线图、趋势图等

目前状态: 已引入  
组件路径: plupload/1.0.0/plupload  
使用文档: [演示](lib/highcharts/examples/)，详情请参考[官方演示](http://www.highcharts.com/stock/demo/)



### md5
js 封装的  md5 操作库，用户的秘密可以在客户端md5之后再发送到服务器

	seajs.use(['md5'], function(md5){
		alert(md5('111111')); // 96e79218965eb72c92a549dd5a330112
	});

目前状态: 已引入  
组件路径: md5/1.0.0/md5  
使用文档: 请参考[官方手册](http://momentjs.com/docs/)



### Bootstrap
Bootstrap是快速开发Web应用程序的前端工具包。它是一个CSS和HTML的集合，它使用了最新的浏览器技术，给你的Web开发提供了时尚的版式，表单，buttons，表格，网格系统等等。

Bootstrap 并不是严格的seajs模块，这里主要使用seajs加载文件。Bootstrap还是使用jQuery插件的形式使用即可。

	seajs.use(['bootstrap'], function(){
		
	});

目前状态: 已引入  
组件路径: bootstrap/2.3.1/bootstrap  
使用文档: [演示](lib/bootstrap/examples/)，详情请参考[官方手册](http://twitter.github.com/bootstrap/)



### 图片瀑布流

目前状态: 待整理  
组件路径:   
使用文档: 



### 编辑器

目前状态: 开发中...  
组件路径: bkeditor/0.9.0/bkeditor  
使用文档: [演示](lib/bkeditor/examples/)

