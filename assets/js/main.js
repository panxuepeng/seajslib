
(function($, seajs){
	var IE6 = window.VBArray && !window.XMLHttpRequest;
	
	seajs.config({
	  alias: {
		
	  }
	});
	
	function resizeSidebar() {
		$("#sidebar").height( $(window).height() - 45 );
	}
	
	if( IE6 ){
		resizeSidebar();
		$(window).resize(resizeSidebar);
	}

	$.get('server/readme.php?name=Readme', function( html ){
		html = html.replace(/<a/g, '<a target="_blank"');
		$("#markdown-Readme").html(html);
	});

	$.get('server/readme.php?name=use', function( html ){
		html = html.replace(/<a/g, '<a target="_blank"');
		$("#markdown-use").html(html);
	});

	$.get('server/readme.php?name=changelog', function( html ){
		html = html.replace(/<a/g, '<a target="_blank"');
		$("#markdown-changelog").html(html);
	});

	$.get('server/readme.php?name=libs', function( html ){
		var o = $("#markdown-libs");
		html = html.replace(/<a/g, '<a target="_blank"');
		o.html(html);
		
		var list = [];
		setTimeout(function(){
			
			o.find('h3').each(function(i){
				var name = $.trim($(this).text());
				if( name ){
					list.push('<li>- <a href="#lib'+i+'">'+name+'</a></li>');
					$(this).before('<a name="lib'+i+'"></a>');
				}
			});
			
			$("#liblist").empty().html(list.join(''));
		}, 0);
		
		runInit();
		
		seajs.autoload();
	});

	function runInit(){
		$('pre').attr('data-toggle', 'prettify')
		.each(function(){
			var o = $(this);
			if(o.text().indexOf('seajs.use')>-1){
				o.after('<input name="run" value="运行..." type="button" onclick="runCode(this)" />');
			}
		});
	}

	function runCode(btn){
		var code = [], list = $(btn).prev('pre').find('li');
		list.each(function(){
			code.push($(this).text());
		});
		var codeStr = code.join('\n');
		try{
			eval(codeStr);
		}catch(e){
			alert('error: \n'+codeStr);
		}
	}
	
	window.runCode = runCode;
})(jQuery, seajs);