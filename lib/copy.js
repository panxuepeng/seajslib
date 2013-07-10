var shell = require('shelljs');
var _s = require('underscore.string');
var path = require('path');

var pwd = shell.pwd(); // D:\hudong\commonjs\jslib\lib
var dist = path.dirname(pwd)+ path.sep +'dist';

var path1 = 'D:/hudong/huimg/libs';
var path2 = 'D:/hudong/Branch_B20130301_huimg_32/libs';
var isok = true;

if( !shell.test('-d', path1) ){
	shell.echo('目录'+path1+'不存在，请修改 copy.js path1');
	isok = false;
}

if( !shell.test('-d', path2) ){
	shell.echo('目录'+path2+'不存在，请修改 copy.js path2');
	isok = false;
}

if( isok ){
	shell.echo('\n请输入要复制的组件名[全部复制请输入 all]:');

	process.stdin.resume(); // 获取用户输入

	process.stdin.on('data', function( name ) {
		shell.cd(pwd);
		shell.echo('当前目录 '+ pwd);
		
		name = _s.trim(name).toLowerCase();
		
		if( name === 'all' ){
		
			shell.cp('-Rf', dist+'/*', path1);
			shell.cp('-Rf', dist+'/*', path2);
			
		} else if(shell.test('-d', name)) {
			shell.echo(path1+'/'+name);
			shell.cp('-Rf', dist+'/'+name+'/*', path1+'/'+name);
			
			shell.echo(path2+'/'+name);
			shell.cp('-Rf', dist+'/'+name+'/*', path2+'/'+name);
			
		} else {
		
			shell.echo('\n输入错误或组件名不存在\n');
		}
		shell.echo('复制完成.');
	});
}
