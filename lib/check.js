// 批量检查所有组件

var shell = require('shelljs');
var pwd = shell.pwd(); // D:\hudong\commonjs\jslib\lib

var dirs = shell.ls('./').filter(function(file) {
	// 仅返回目录，并且过滤掉 node_modules 和 module-tpl 两个非组件目录
	// 以及其他一些引入的组件
	return !/^(node_modules|module-tpl|jquery|seajs|class|events|bootstrap|highcharts|highstock|json|moment|plupload|prettify|qunit|slidesjs|underscore|ztree)$/i.test(file) && shell.test('-d', file);
});

//dirs = ['artdialog'];

console.log(dirs);

shell.rm('-f', '../checklog/*');

dirs.forEach(function(name){
	shell.cd(pwd);
	shell.cp('-f', 'Gruntfile.js', name+'/'); 
	shell.cd(name);
	shell.exec('grunt qunit', function(code, output) {
		if( output.indexOf('without errors') === -1 ){
			(output).to('../../checklog/'+name+'.log');
		}
	});
});




