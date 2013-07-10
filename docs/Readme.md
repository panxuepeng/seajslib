
JavaScript 组件库
=================

## 简介

**让组件呼之即来，再也不需要写 script 标签来引用某个功能相关的js文件了。如有相关的css文件， Sea.js 也会自动帮你引入。只要是你看好的JS功能，基本上都可以成为这里的组件。** 

每个组件都是[Sea.js](http://www.seajs.org)的模块，所以组件的使用依赖于Sea.js，也就是说要使用这些组件，需要在页面上先引入Sea.js。另外，考虑到现有项目大多依赖于jQuery，所以jQuery也需要直接引入，如下

	<script src="http://www.huimg.cn/lib/jquery-1.6.4.min.js"></script> (jQuery的版本需 1.4+)
	<script src="http://www.huimg.cn/libs/seajs/2.1.0/seajs.js" id="seajsnode"></script>
	<script>seajs.use('config/1.1.1/config')</script>

其中 dist/config 是全局的配置文件，在这个文件当中对Sea.js进行了扩展。Sea.js本身没有自动加载组件的功能，为了简化组件的使用，我们给Sea.js扩展了这个功能。

*组件开发使用了 Grunt <http://gruntjs.com/>。Grunt 是针对Javascript项目的一个自动化工具，包括初始化文件、代码审查、单元测试，合并、压缩等一系列常用功能，还有其他插件，也可以自定义插件。总之，这是一个很牛X的工具。*

	
<a name="usage1"></a>
## 超级使用方法

给标签增加一个属性(data-toggle="组件名")即可，比如需要调用日历组件（在引入jquery和Sea.js之后），仅需要给input标签增加一个 data-toggle="calendar"  的属性，日历就可以工作了。如下

```
	<input type="text" data-toggle="calendar"/>
```
<br>**demo** 演示日历组件
<input type="text" data-toggle="calendar"/>

**注意：** 如果带有 data-toggle 属性的标签是ajax方式异步加载的，则需要在加载之后调用一下 seajs.autoload(); 以激活自动加载。如下

	$.get('server/readme.php?name=libs', function( html ){
		$("#markdown-libs").html(html);
		seajs.autoload();
	});
	