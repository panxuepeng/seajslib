/*! Bkeditor - v0.9.0 - 2013-07-10
* https://github.com/daixianfeng/a
* Copyright (c) 2013 daixianfeng; Licensed MIT */
(function(E,$){
	var brushTag = {
		SPAN : false,
		EM : false,
		STRONG : false,
		SUB : false,
		SUP : false
	};
	var styleText = '';
	E.addPlugin({
		id : 'font',
		isEnable : true,
		brushOn : {},
		recordTag : brushTag,
		recordStyle : styleText,
		fontRecord : '',
		toggleBrush : function(){
			var oneBrush = this.brushOn[E.curId] ? true : false;
			this.brushOn[E.curId] = !oneBrush;
			if(this.brushOn[E.curId] === true){
				this.recordStyle();
			}else{
				this.fontRecord = '';
			}
		},
		clear : function(notCmd){
			var win = E.curEditor.win,
				dom = win.document;
			var curSelect = win.getSelection();
			var selRange = curSelect.getRangeAt(0);
            var commonAncestor = selRange.commonAncestorContainer;
			var oriOptArea = {
                ancestor : commonAncestor,
				firstNode : selRange.startContainer,
				firstOffset : selRange.startOffset,
				lastNode : selRange.endContainer,
				lastOffset : selRange.endOffset
			};
			var paragraphTag = ['td','th','dd','dt'];
			for(var oneTag in DTD.$block){
				oneTag = oneTag.toLowerCase();
				if(DTD.$block[oneTag] === 1){
					paragraphTag.push(oneTag);
				}
			}
			paragraphTag = paragraphTag.join(',');
			var lastParagraphNode = $(oriOptArea.lastNode).closest(paragraphTag)[0];
			var cutEndRange = selRange.cloneRange();
			cutEndRange.selectNodeContents(lastParagraphNode);
			cutEndRange.setStart(oriOptArea.lastNode,oriOptArea.lastOffset);
			var endPart = cutEndRange.extractContents();
			cutEndRange.insertNode(endPart);
			
			var fisrtParagraphNode = $(oriOptArea.firstNode).closest(paragraphTag)[0];
			var cutStartRange = selRange.cloneRange();
			cutStartRange.selectNodeContents(fisrtParagraphNode);
			cutStartRange.setEnd(oriOptArea.firstNode,oriOptArea.firstOffset);
			var startPart = cutStartRange.extractContents();
			cutStartRange.insertNode(startPart);
			selRange.setEnd(cutEndRange.startContainer,cutEndRange.startOffset);
			selRange.setStart(cutStartRange.endContainer,cutStartRange.endOffset);
			
			var comStartRange = selRange.cloneRange();
			comStartRange.collapse(true);
			var comEndRange = selRange.cloneRange();
			comEndRange.collapse(false);
			var comEndNode = comEndRange.endContainer.childNodes[comEndRange.endOffset];
			
			var clearNodeList = {};
			var commonAncestor = selRange.commonAncestorContainer;
			if(E.IE){
				clearNodeList = dom.createNodeIterator(commonAncestor);
			}else{
				clearNodeList = dom.createNodeIterator(commonAncestor,NodeFilter.SHOW_ALL);
			}
			var queryNode = clearNodeList.nextNode(),queryNode2 = queryNode;
			var startOpt = 0,endOpt = 1;
			while(queryNode){
				do{
					queryNode2 = clearNodeList.nextNode();
				}while(queryNode === queryNode2);
				
				if(startOpt === 0){
					var comRange = dom.createRange();
					comRange.selectNode(queryNode);
					var inStart = comRange.compareBoundaryPoints(comRange.START_TO_START,comStartRange);
				}
				if(endOpt === 1){
					if(queryNode2){
						var comRange2 = dom.createRange();
						comRange2.selectNode(queryNode2);
						var	inEnd = comRange2.compareBoundaryPoints(comRange2.START_TO_START,comEndRange);
					}else{
						var	inEnd = -1;
					}
				}
				var startCome = inStart > -1 && startOpt === 0;
				var	endCome = inEnd > -1 && endOpt === 1;
				if((startOpt && endOpt) || startCome){
					if(queryNode.nodeType === 1 && DTD.$font[queryNode.nodeName] === 1){
						var nextInsertNode = queryNode.nextSibling;
						var insertParent = queryNode.parentNode;
						var len = queryNode.childNodes.length;
						for(var i=len-1;i>=0;i--){
							if(nextInsertNode){
								insertParent.insertBefore(queryNode.childNodes[i],nextInsertNode);
							}else{
								insertParent.appendChild(queryNode.childNodes[i]);
							}
						}
						if(comEndNode){
							comEndRange.setEndBefore(comEndNode);
							comEndRange.collapse(false);
						}else{
							var comEndParent = comEndRange.endContainer.parentNode;
							comEndRange.setEnd(comEndParent,comEndParent.childNodes.length);
							comEndRange.collapse(false);
						}
						var tmpRange = dom.createRange();
						tmpRange.selectNode(queryNode);
						tmpRange.deleteContents();
						if(startCome){
							startOpt = 1;
							selRange.setStart(tmpRange.startContainer,tmpRange.startOffset);
						}
						if(endCome){
							if(nextInsertNode){
								selRange.setEndBefore(nextInsertNode);
							}else{
								selRange.setEnd(insertParent,insertParent.childNodes.length);
							}
							break;
						}
					}else{
						if(startCome){
							startOpt = 1;
							selRange.setStartBefore(queryNode);
						}
						if(endCome){
							selRange.setEndAfter(queryNode);
							break;
						}
					}
				}
				queryNode = queryNode2;
			}
			curSelect.removeAllRanges();
			curSelect.addRange(selRange);
			if(!notCmd){
				E.curEditor.baseFilter.excute('afterTextPre');
				E.curEditor.baseFilter.excute('afterText');
			}else{
				return selRange;
			}
		},
		brush : function(){
			if(this.brushOn[E.curId] === true){
				var fontRecord = this.fontRecord;
				var brushRange = this.clear(true);
				var win = E.curEditor.win,
					dom = win.document;
				var curSelect = win.getSelection();
				var selRange = curSelect.getRangeAt(0);
				var comStartRange = brushRange.cloneRange();
				comStartRange.collapse(true);
				var comEndRange = brushRange.cloneRange();
				comEndRange.collapse(false);
				var brushNodeList = {};
				var commonAncestor = brushRange.commonAncestorContainer;
				if(E.IE){
					brushNodeList = dom.createNodeIterator(commonAncestor,3);
				}else{
					brushNodeList = dom.createNodeIterator(commonAncestor,NodeFilter.SHOW_TEXT);
				}
				var queryNode = brushNodeList.nextNode(),queryNode2 = queryNode;
				var startOpt = 0,endOpt = 1;
				while(queryNode){
					queryNode2 = brushNodeList.nextNode();
					if(startOpt === 0){
						var comRange = dom.createRange();
						comRange.selectNode(queryNode);
						var inStart = comRange.compareBoundaryPoints(comRange.START_TO_START,comStartRange);
					}
					if(endOpt === 1){
						if(queryNode2){
							var comRange2 = dom.createRange();
							comRange2.selectNode(queryNode2);
							var	inEnd = comRange2.compareBoundaryPoints(comRange2.START_TO_START,comEndRange);
						}else{
							var	inEnd = -1;
						}
					}
					var startCome = inStart > -1 && startOpt === 0;
					var	endCome = inEnd > -1 && endOpt === 1;
					if((startOpt && endOpt) || startCome){
						var tmpRange = dom.createRange();
						tmpRange.selectNodeContents(queryNode);
						if(fontRecord.fontStyle !== ''){
							var spanTag = dom.createElement('span');
							spanTag.style.cssText = fontRecord.fontStyle;
							tmpRange.surroundContents(spanTag);
						}
						for(var tag in fontRecord.fontTag){
							if(tag !== 'SPAN' && fontRecord.fontTag[tag] === true){
								var eleTag = dom.createElement(tag);
								tmpRange.surroundContents(eleTag);
							}
						}
						if(startCome){
							startOpt = 1;
							selRange.setStart(tmpRange.startContainer,tmpRange.startOffset);
						}
						if(endCome){
							selRange.setEnd(tmpRange.endContainer,tmpRange.endOffset);
							break;
						}
					}
					
					queryNode = queryNode2;
				}
				curSelect.removeAllRanges();
				curSelect.addRange(selRange);
			}
			this.toggleBrush();
			E.curEditor.baseFilter.excute('afterTextPre');
			E.curEditor.baseFilter.excute('afterText');
		},
		recordStyle : function(){
			var elementList = E.utils.getCurElement();
			var len = elementList.length;
			var tagList = $.extend(true,{},this.recordTag);
			var styleText = '';
			for(var i=0;i<len;i++){
				if(elementList[i].nodeType !== 3 && typeof brushTag[elementList[i].nodeName] !== 'undefined'){
					tagList[elementList[i].nodeName] = true;
					styleText += elementList[i].style.cssText;
				}
			}
			this.fontRecord = {fontTag:tagList,fontStyle:styleText};
		}
	});
	E.addEvent({
		name : 'editareaBrush',
		type : ['mouseup'],
		area : 'editArea',
		fn : function(){
			if(E.curEditor.$toolbar.find('[cmd=formatmatch].bke-checked').length > 0){
				E.command('brush');
			}
		}
	});
})(window.jQuery.jQEditor,window.jQuery);