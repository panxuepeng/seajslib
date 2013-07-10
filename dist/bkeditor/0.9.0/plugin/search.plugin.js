/*! Bkeditor - v0.9.0 - 2013-07-10
* https://github.com/daixianfeng/a
* Copyright (c) 2013 daixianfeng; Licensed MIT */
(function(E,$){
	E.addUi({
		id : 'searchdialog',
		search : function(arg){
			var backward = (arg === 'prev' ? false : true);  
			var curDialog = $('#searchdialog');
			if(curDialog.size() !== 0){
				var sourceword = curDialog.find('#sourceword').val(),
					whole = curDialog.find('[name=whole]')[0].checked,
					sensitive = curDialog.find('[name=sensitive]')[0].checked;
				
				E.utils.execPlugin('search','search',{
					backward : backward,
					sourceword : sourceword,
					whole : whole,
					sensitive : sensitive
				});
				return false;
			}else{
				return false;
			}
		},
		replace : function(){
			var curDialog = $('#searchdialog');
			if(curDialog.size() !== 0){
				var sourceword = curDialog.find('#sourceword').val(),
					targetword = curDialog.find('#targetword').val(),
					whole = curDialog.find('[name=whole]')[0].checked,
					sensitive = curDialog.find('[name=sensitive]')[0].checked;
				
				E.utils.execPlugin('search','replace',{
					backward : true,
					sourceword : sourceword,
					targetword : targetword,
					whole : whole,
					sensitive : sensitive
				});
				return false;
			}else{
				return false;
			}
		}
	});
	
})(window.jQuery.jQEditor ,window.jQuery);
(function(E){E.dialogHtml["searchdialog"] ="<TABLE ui=\"searchdialog\"><TR><TD>\u67e5\u627e\uff1a<\/TD><TD><input type=\"text\" id=\"sourceword\" name=\"sourceword\" \/><\/TD><\/TR><TR><TD>\u66ff\u6362\uff1a<\/TD><TD><input type=\"text\" id=\"targetword\" name=\"targetword\"\/><\/TD><\/TR><TR><TD><input type=\"checkbox\" id=\"whole\" name=\"whole\"\/>\u5168\u8bcd\u5339\u914d<\/TD><TD>&nbsp;<\/TD><\/TR><TR><TD><input type=\"checkbox\" id=\"sensitive\" name=\"sensitive\"\/>\u5927\u5c0f\u5199\u76f8\u5173<\/TD><TD>&nbsp;<\/TD><\/TR><\/TABLE>"})(jQuery.jQEditor);
(function(E){
	E.addPlugin({
		id : 'search',
		type : 'dialog',
		showDialog : function(curEditor){
			var self = this;
			E.utils.loadDialog(this.id, E.config.cBase.uiDir+'search/',function(){
				var id = curEditor.Eid;
				E.dialog.open({
					id : 'searchdialog',
					editor : id,
					title: '查找',
					content: $('[ui=searchdialog]'),
					button : [
						{value:'<< 查找',callback:function(){
							E.command('searchdialog','search','prev');
							return false;
						}},
						{value:'查找 >>',callback:function(){
							E.command('searchdialog','search','next');
							return false;
						}},
						{value:'替换 ≒',callback:function(){
							E.command('searchdialog','replace');
							return false;
						}}
					],
					icon: 'succeed'
				});
			});
		},
		search : function(args){
			var win = E.curEditor.win;
			var searchResult = false;
			if(E.IE){
				var bodyRange = win.document.body.createTextRange();
				win.focus();
				var selRange = win.document.selection.createRange().duplicate();
				try{
					if(args.backward){
						bodyRange.setEndPoint('StartToEnd',selRange);
					}else{
						bodyRange.setEndPoint('EndToStart',selRange);
					}
				}catch(ex){
					win.focus();
				}
				var searchword = args.sourceword,
					wholeBit = args.whole === true ? 2 : 0,
					sensitiveBit = args.sensitive === true ? 4 : 0,
					towardBit = args.backward === true ? 0 : -1;
				var searchBit = wholeBit | sensitiveBit;
				
				searchResult = bodyRange.findText(searchword,towardBit,searchBit);
				searchResult && bodyRange.select();
			}else{
				var searchword = args.sourceword,
					wholeBool = args.whole,
					sensitiveBool = args.sensitive,
					towardBool = args.backward === true ? false : true;
				searchResult = win.find(searchword,sensitiveBool,towardBool,false,wholeBool);
				
			}
			if(!searchResult){
				E.errorMessage('没有找到目标！');
			}
		},
		replace : function(args){
			var win = E.curEditor.win;
			var selectedText = E.utils.getSelectionText();
			if(selectedText.toLowerCase() !== args.sourceword.toLowerCase()){
				this.search(args);
			}else{
				E.utils.replaceSelectedText(E.curEditor.win,args.targetword);
				this.search(args);
			}
			
		}
	});

})(window.jQuery.jQEditor);