<a name="usage2"></a>
## 普通使用方法

除了上面这种超级简单的使用方式，一般情况下会这么使用，比如使用 underscore 组件

	seajs.use(['underscore'], function(_){
		_.each([1, 2, 3], alert);
	});
	
**注意**，组件都是有版本的，如 seajs.use(['underscore/1.4.4/underscore'],...) 或 seajs.use(['underscore@1.4.4'],...) ，如果不指定版本seajs.use(['underscore'],...)，则默认使用最新版本。

<a name="usage3"></a>
## 组件开发注意事项

+ 尽量避免使用jQuery的live方法(jQuery1.9版本不再支持这个方法)，以及on\off(需1.7+)
+ 尽量避免使用$.browser，jQuery1.9版本不再支持此对象
+ 组件需要标明依赖的jQuery版本
+ 组件需要有友好的演示示例
+ 组件组件名称必须符合js变量命名（比如不能包含“-”等）
+ 如果有css文件，css文件和js文件命名要相同（除了后缀.css的部分）。css文件也放在src目录，如有很多文件，在scr目录创建子目录即可。可参考autocomplete和artdialog两个组件的src目录。


<a name="usage4"></a>
## 工具安装说明
 
#### 第一：下载到本地
下载地址 https://github.com/panxuepeng/seajslib/archive/gh-pages.zip  
假设目录是 D:\seajslib，下面会用到。
 
#### 第二：安装 Node.js
参考 http://nodejs.org
 
#### 第三：安装 Grunt 相关工具

1. 初始化：在命令行窗口进入 seajslib/lib 目录，执行 npm install shelljs。或者windows系统下，可以双击lib目录下的 shelljs.bat 文件，自动执行相关命令。因为第2步的安装依赖于shelljs。

2. 模块安装：在命令行窗口进入 seajslib/lib 目录，执行 node install.js ，安装 Grunt 相关模块。或者windows系统下，可以双击lib目录下的 install.bat 文件，自动执行相关命令。

 
#### 第四：例如创建一个 hello 组件
seajslib/lib 目录下有一个 new.bat 批处理文件，双击它，然后会出现命令窗口，提示你输入要创建的组件名，回车，窗口会问你一些问题，基本一路回车即可。组件命名需要符合JS变量命名规范。


<a name="usage5"></a>
## 组件库架构
JS组件库的目的就是将常用的、通用的js组件整理成独立的产品，方便大家使用。组件库在架构上是基于 SeaJS<http://seajs.org>进行的。 SeaJS 是一个web端模块加载器，所以所有的组件也就可以说是以SeaJS的模块方式存在。关于使用SeaJS有什么好处，可以从其官方网站获取一些信息。我感受到的好处主要是，帮我们解决了组件之前的相互依赖问题，当然好处不止这些。JS模块化是未来发展的趋势，这样做在大方向上应该是正确的。

组件库的目录结构参考了这个文档：[文件命名与目录结构](https://github.com/aralejs/aralejs.org/wiki/%E6%96%87%E4%BB%B6%E5%91%BD%E5%90%8D%E4%B8%8E%E7%9B%AE%E5%BD%95%E7%BB%93%E6%9E%84)