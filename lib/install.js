// 安装Grunt相关模块

var shell = require('shelljs');

shell.exec('npm install -g grunt-cli', function(code, output) {
	shell.echo('\n npm install -g grunt-cli \n');
	shell.echo(output);
});

shell.exec('npm install -g grunt-init', function(code, output) {
	shell.echo('\n npm install -g grunt-init \n');
	shell.echo(output);
});

shell.exec('npm install', function(code, output) {
	shell.echo('\n npm install \n');
	shell.echo(output);
	
	shell.echo("replace path.resolve('node_modules') to path.resolve('..', 'node_modules')");
	
	shell.sed('-i', "path.resolve('node_modules')", "path.resolve('..', 'node_modules')", "node_modules/grunt/lib/grunt/task.js");
});

