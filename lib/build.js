var shell = require('shelljs');
var fs = require('fs');
var path = require('path');

var _s = require('underscore.string');
var cmd = '';
var pwd = shell.pwd(); // D:\hudong\commonjs\jslib\lib
var logpath = path.dirname(pwd)+ path.sep +'buildlog';

if( !shell.test('-d', logpath) ){
	shell.mkdir(logpath);
	shell.echo('创建了日志目录 '+ logpath);
}

shell.echo('\n请输入要构建的组件名[全部构建请输入 all]:');

process.stdin.resume(); // 获取用户输入

process.stdin.on('data', function( name ) {
	var dirs = [];
	shell.cd(pwd);
	shell.echo('当前目录 '+ pwd);
	name = _s.trim(name).toLowerCase();
	cmd = name;
	if ( name === "all" || name === "version" ) {
		dirs = shell.ls('./').filter(function(file) {
			// 仅返回目录，并且过滤掉 node_modules 和 module-tpl 两个非组件目录
			// 以及其他一些特殊组件
			return !/^(node_modules|module-tpl|jquery|seajs|class|events|hello)$/i.test(file) && shell.test('-d', file);
		});
		
	} else if ( shell.test('-d', name) ) {
		dirs = [name];
	}
	
	if ( dirs.length ) {
		shell.rm('-f', '../buildlog/*');
		shell.echo('清理日志目录 buildlog\n');
		
		setTimeout(function(){
			console.log(dirs.join(', '));
			shell.echo('\n即将开始，共 '+dirs.length+' 个组件');
		}, 1000);
		
		setTimeout(function(){
			build(dirs);
		}, 6000);
	} else {
		shell.echo('\n输入错误或组件名不存在\n');
	}
});

var isStart = false; // 是否开始构建
var versions = [];
function build( dirs ){
	var name, version, pkgpath;
	if( dirs.length ){
		if( isStart ) {
			shell.echo('\n还有 '+ dirs.length + ' 个组件等待构建...\n');
		}
		isStart = true;
		name = dirs.shift();
		pkgpath = pwd+path.sep+name+path.sep+'seajs.json';
		version = pkg('version', pkgpath);
		
		shell.cd(pwd); // 这个不能少哦
		
		shell.echo('\n当前是 '+name + '@' + version +'\n');
		
		versions.push( '"'+name+'": ["'+ version +'"]');
		
		if ( cmd === 'version' ) {
		
			build(dirs);
			
		} else {
			
			if ( name !== 'seajs' ) {
				// seajs 需要使用自己的构建文件
				shell.cp('-f', 'Gruntfile.js', name+'/'); 
			}
			shell.cd(name);
			
			shell.exec('grunt', function(code, output) {
				// 疑问 2013-04-11
				// 仅执行 grunt 命令，可以得到完整的 output 内容
				// 执行 grunt jshint 或 grunt qunit 就可不到完整的 output 内容，为什么？
				
				if( output.indexOf('without errors') === -1 ){
					(output).to(logpath+'/'+name+'.log');
				}
				build(dirs);
			});
		}
	}else{
		fs.appendFile(logpath+'/version.txt', '\t'+versions.join(',\n\t'));
		shell.echo('\n构建完毕.\n');
	}
}

// 获取json配置文件的某项值
function pkg(key, file){
	var result;
	key = key || '';
	file = file || 'seajs.json';
	
	try {
		// 注意；readFileSync的返回值是object类型，不是string类型
		contents = fs.readFileSync(file); 
		
		result = JSON.parse(contents);
		return key ? result[key] : result;
	} catch(e) {
		throw Error('pkg(): JSON.parse error');
	}
}


