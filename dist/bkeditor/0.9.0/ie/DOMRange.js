/*! Bkeditor - v0.9.0 - 2013-07-10
* https://github.com/daixianfeng/a
* Copyright (c) 2013 daixianfeng; Licensed MIT */
(function(){
/**
* 有关节点的函数库
* @type {object}
*/
var DOMUtils = {
	/**
	* @description 判断是否是body节点（最外层节点）
	* @param {object.<node>} node 待判断节点
	* @return {boolean} 判断结果
	*/
	isBody:function ( node ) {
        return  node && node.nodeType == 1 && node.tagName.toLowerCase() == 'body';
    },
	/**
	* @description 查看节点在父元素中的位置
	* @param {object.<node>} node 待查看节点
	* @return {number} 位置索引
	*/
	nodeIndex: function (node) {
		for (var i = 0; node = node.previousSibling; i++)
			continue;
		return i;
	},
	/**
	* @description 查找节点的父节点
	* @param {object.<node>} node 待查找节点
	* @return {object.<node> | null} 父节点或空
	*/
	findParent:function ( node ) {
        if ( !DOMUtils.isBody( node ) ) {
            return node.parentNode;
        }
        return null;
    },
	/**
	* @description 查找节点的祖先节点
	* @param {object.<node>} node 待查找节点
	* @param {object.<node>} anctor 终止处祖先节点
	* @return {array(object.<node>)} 祖先节点集合
	*/
	findParents:function ( node, anctor ) {
        var parents = [];
        while ( node !== null && node !== anctor) {
            parents.push( node );
			node = DOMUtils.findParent( node );
        }
        return parents;
    },
	/**
	* @description 查找范围的公共祖先
	* @param {object.<DOMRange>} range 待查找范围
	* @return {object.<node> | null} 公共父节点或空
	*/
	getCommonAncestor:function ( range ) {
        var start = range.startContainer,
            end = range.endContainer,
			startOffset = range.startOffset,
			endOffset = range.endOffset;
		if ( start === end ) {
			if ( start.nodeType == 1 ) {
				return start;
			}
			//只有在上来就相等的情况下才会出现是文本的情况
			return start.nodeType == 3 ? start.parentNode : start;
		}
        var parentsA = [start] , parentsB = [end], parent = start, i = -1;
        while ( parent = parent.parentNode ) {
            if ( parent === end ) {
                return parent;
            }
            parentsA.push( parent );
        }
        parent = end;
        while ( parent = parent.parentNode ) {
            if ( parent === start )
                return parent;
            parentsB.push( parent );
        }
        parentsA.reverse();
        parentsB.reverse();
        while ( i++, parentsA[i] === parentsB[i] ) {
        }
        return i == 0 ? null : parentsA[i - 1];
    },
	/**
	* @description 判断是否是文本节点
	* @param {object.<node>} node 待判断节点
	* @return {boolean} 判断结果
	*/
	isDataNode: function (node) {
		return node && node.nodeValue !== null && node.data !== null;
	},
	/**
	* @description 判断是否是祖先
	* @param {object.<node>} parent 待判断祖先节点
	* @param {object.<node>} node 待判断节点
	* @return {boolean} 判断结果
	*/
	isAncestorOf: function (parent, node) {
		return !DOMUtils.isDataNode(parent) &&
		    (parent.contains(DOMUtils.isDataNode(node) ? node.parentNode : node) ||		    
		    node.parentNode == parent);
	},
	/**
	* @description 判断是否是祖先或自身
	* @param {object.<node>} root 待判断祖先节点
	* @param {object.<node>} node 待判断节点
	* @return {boolean} 判断结果
	*/
	isAncestorOrSelf: function (root, node) {
		return DOMUtils.isAncestorOf(root, node) || root == node;
	},
	/**
	* @description 查看节点中子节点的数目或文本长度
	* @param {object.<node>} node 待判断节点
	* @return {number} 子节点的数目或文本长度
	*/
	getNodeLength: function (node) {
		return DOMUtils.isDataNode(node) ? node.length : node.childNodes.length;
	},
	/**
	* @description 拆分文本节点，前边节点为原节点，后边节点为新节点
	* @param {object.<node>} node 待判断节点
	* @param {object.<node>} offset 拆分偏移量
	* @return {boolean} 不是文本节点时为false
	*/
	splitDataNode: function (node, offset) {
		if (!DOMUtils.isDataNode(node))
			return false;
		var newNode = node.cloneNode(false);
		node.deleteData(offset, node.length);
		newNode.deleteData(0, offset);
		node.parentNode.insertBefore(newNode, node.nextSibling);
	},
	/**
	* @description 根据节点类型，将节点添加到节点列表中
	* 为线性遍历节点服务
	* @param {object.<node>} node 待判断节点
	* @param {array(object.<node>)} nodelist 节点列表
	* @param {number} filter 过滤节点类型，必须是数字
	*/
	pushNode : function(node,nodelist,filter){
		var child = node.firstChild;
		while(child){
			if(child.nodeType === filter || typeof filter === 'undefined'){
				nodelist.push(child);
			}
			DOMUtils.pushNode(child,nodelist,filter);
			child = child.nextSibling;
		}
	}
};

/**
* @description 获取范围的边缘信息
* 用于将textRange转化为DOMRange
* @param {object.<textRange>} range 待获取范围
* @param {boolean} start 开头还是结尾true为头，false为尾
* @return {object} 范围边缘信息对象（包含边缘节点和边缘偏移量）
*/
function getBoundaryInformation( range, start ) {
	var getIndex = DOMUtils.nodeIndex;
	range = range.duplicate();
	range.collapse( start );
	var parent = range.parentElement();
	//如果节点里没有子节点，直接退出
	if ( !parent.hasChildNodes() ) {
		return  {container:parent, offset:0};
	}
	var siblings = parent.children,
			child,
			testRange = range.duplicate(),
			startIndex = 0, endIndex = siblings.length - 1, index = -1,
			distance;
	while ( startIndex <= endIndex ) {
		index = Math.floor( (startIndex + endIndex) / 2 );
		child = siblings[index];
		testRange.moveToElementText( child );
		var position = testRange.compareEndPoints( "StartToStart", range );
		if ( position > 0 ) {
			endIndex = index - 1;
		} else if ( position < 0 ) {
			startIndex = index + 1;
		} else {
			//trace:1043
			return  {container:parent, offset:getIndex( child )};
		}
	}
	if ( index == -1 ) {
		testRange.moveToElementText( parent );
		testRange.setEndPoint( "StartToStart", range );
		distance = testRange.text.replace( /(\r\n|\r)/g, '\n' ).length;
		siblings = parent.childNodes;
		if ( !distance ) {
			child = siblings[siblings.length - 1];
			return  {container:child, offset:child.nodeValue.length};
		}

		var i = siblings.length;
		while ( distance > 0 ){
			distance -= siblings[ --i ].nodeValue.length;
		}
		return {container:siblings[i], offset:-distance};
	}
	testRange.collapse( position > 0 );
	testRange.setEndPoint( position > 0 ? "StartToStart" : "EndToStart", range );
	distance = testRange.text.replace( /(\r\n|\r)/g, '\n' ).length;
	if ( !distance ) {
		if(typeof DTD === 'undefined'){
			var DTD = window.parent.DTD;
		}
		return  DTD.$empty[child.tagName] || DTD.$nonChild[child.tagName] ?
			{container:parent, offset:getIndex( child ) + (position > 0 ? 0 : 1)} :
			{container:child, offset:position > 0 ? 0 : child.childNodes.length};
	}
	while ( distance > 0 ) {
		try {
			var pre = child;
			child = child[position > 0 ? 'previousSibling' : 'nextSibling'];
			distance -= child.nodeValue.length;
		} catch ( e ) {
			return {container:parent, offset:getIndex( pre )};
		}
	}
	return  {container:child, offset:position > 0 ? -distance : child.nodeValue.length + distance};
}
/**
* @description 将textRange转化为DOMRange
* @param {object.<textRange>} ieRange 待转化的textRange
* @param {object.<DOMRange>} range 转化后的range
* @return {object.<DOMRange>} 转化后的range
*/
function transformIERangeToRange( ieRange, range ) {
	if ( ieRange.item ) {
		range.selectNode( ieRange.item( 0 ) );
	} else {
		var bi = getBoundaryInformation( ieRange, true );
		range.setStart( bi.container, bi.offset );
		if ( ieRange.compareEndPoints( "StartToEnd", ieRange ) != 0 ) {
			bi = getBoundaryInformation( ieRange, false );
			range.setEnd( bi.container, bi.offset );
		}else{
			 range.collapse( true );
		}
	}
	return range;
}
	
var TextRangeUtils = {
	convertToDOMRange: function (textRange, document) {
		function adoptBoundary(domRange, textRange, bStart) {
			// iterate backwards through parent element to find anchor location
			var cursorNode = document.createElement('a'), cursor = textRange.duplicate();
			cursor.collapse(bStart);
			var parent = cursor.parentElement();
			do {
				parent.insertBefore(cursorNode, cursorNode.previousSibling);
				cursor.moveToElementText(cursorNode);
			} while (cursor.compareEndPoints(bStart ? "StartToStart" : "StartToEnd", textRange) > 0 && cursorNode.previousSibling);

			// when we exceed or meet the cursor, we've found the node
			if (cursor.compareEndPoints(bStart ? "StartToStart" : "StartToEnd", textRange) == -1 && cursorNode.nextSibling) {
				// data node
				cursor.setEndPoint(bStart ? "EndToStart" : "EndToEnd", textRange);
				domRange[bStart ? 'setStart' : 'setEnd'](cursorNode.nextSibling, cursor.text.length);
			} else {
				// element
				domRange[bStart ? 'setStartBefore' : 'setEndBefore'](cursorNode);
			}
			cursorNode.parentNode.removeChild(cursorNode);
		}
	
		// return a DOM range
		var domRange = new DOMRange(document);
		adoptBoundary(domRange, textRange, true);
		adoptBoundary(domRange, textRange, false);
		return domRange;
	},

	convertFromDOMRange: function (domRange) {
		function adoptEndPoint(textRange, domRange, bStart) {
			// find anchor node and offset
			var container = domRange[bStart ? 'startContainer' : 'endContainer'];
			var offset = domRange[bStart ? 'startOffset' : 'endOffset'], textOffset = 0;
			var anchorNode = DOMUtils.isDataNode(container) ? container : container.childNodes[offset];
			var anchorParent = DOMUtils.isDataNode(container) ? container.parentNode : container;
			// visible data nodes need a text offset
			if (container.nodeType == 3 || container.nodeType == 4)
				textOffset = offset;

			// create a cursor element node to position range (since we can't select text nodes)
			var cursorNode = domRange._document.createElement('a');
			if(anchorNode){
				anchorParent.insertBefore(cursorNode, anchorNode);
			}else{
				anchorParent.appendChild(cursorNode);
			}
			var cursor = domRange._document.body.createTextRange();
			cursor.moveToElementText(cursorNode);
			cursorNode.parentNode.removeChild(cursorNode);
			// move range
			textRange.setEndPoint(bStart ? "StartToStart" : "EndToStart", cursor);
			textRange[bStart ? "moveStart" : "moveEnd"]("character", textOffset);
		}
		
		// return an IE text range
		var textRange = domRange._document.body.createTextRange();
		adoptEndPoint(textRange, domRange, false);
		adoptEndPoint(textRange, domRange, true);
		return textRange;
	}
};
/**
* @description 线性遍历节点下的所有节点
* @param {object.<node>} node 根节点
* @param {number} filter 过滤节点类型，必须为数字
* @return {object.<node>} 第一个节点，包含数据类型nextNode只向下一个节点
*/
document.createNodeIterator = function(node,filter){
	var nodelist = [];
	var child = node.firstChild;
	var index = 0;
	node.nextNode = function(){
		return nodelist.shift();
	};
	while(child){
		if(child.nodeType === filter || typeof filter === 'undefined'){
			nodelist.push(child);
		}
		DOMUtils.pushNode(child,nodelist,filter);
		child = child.nextSibling;
	}
	return node;
};
/**
* @description 创建DOMRange，挂载到document上，并向范围列表中添加，供维护
* @return {object.<DOMRange>} 被创建的范围
*/
document.createRange = function(){
	var newRange = new DOMRange(document);
	var index = newRange._index;
	DOMRange._rangeQuery[index] = newRange;
	return newRange;
};
/**
* DOMRange构造函数，模拟实现标准规则下的range
* @constructor
* @param {object} document 确定在那个document内模拟
**/
DOMRange = function(document){
	this._document = document;
	this._index = DOMRange._rangeQuery.length;
	this.startContainer = document;
	this.endContainer = document;
	this.startOffset = 0;
	this.endOffset = 0;
	this.commonAncestorContainer = document;
	this.collapsed = true;
	this._startBefore = document;
	this._startAfter = document;
	this._endBefore = document;
	this._endAfter = document;
	/**
	*范围开始位置和结束位置发生变更
	*或者document文档发生变更(变更到现在位置，如果不存在，变更到前一个存在节点)
	*就需要重新更新DOMRange的属性值。
	**/
};
/**
* 范围列表，用于维护
* @type {array(object.<DOMRange>)}
*/
DOMRange._rangeQuery = [];
/**
 * 定义常量，用作比较
 * @type {number}
 */
DOMRange.START_TO_START = 0;
DOMRange.START_TO_END = 1;
DOMRange.END_TO_END = 2;
DOMRange.END_TO_START = 3;
/**
* @description 更新范围列表，用于维护节点遭到修改后的范围
* 如果 startContainer/endContainer 不存在了，将开始/结束位置设为初始值
* 如果都不存在了，置为初始值
* 如果 _startBefore/_startAfter（_endBefore/_endAfter）都不存在，则将该范围置为初始值
* 如果_startAfter/_endBefore存在，则将起始位置设为_startAfter后/将结束位置设为_endBefore前
* 如果文字节点的offset位置不存在，则不变
* @param {number} index 范围索引
**/
DOMRange._refreshRange = function(index){
	var rangeList = DOMRange._rangeQuery;
	var len = rangeList.length;
	for(var i=0;i<len;i++){
		if(index === i){
			continue;
		}
		var tmpRange = rangeList[i];
		var _document = tmpRange._document;
		var startChange = false , endChange = false;
		//减少维护的范围（有初始值，空范围不维护）
		if(tmpRange && tmpRange.startContainer !== _document && tmpRange.endContainer !== _document){
			//startContainer存在
			if(tmpRange.startContainer && tmpRange.startContainer.nodeType !== 3){
				if(tmpRange.startContainer.childNodes[tmpRange.startOffset-1]){
					if(tmpRange.startContainer.childNodes[tmpRange.startOffset-1] !== tmpRange._startBefore){
						startChange = true;
					}
				}else{
					if(tmpRange._startBefore !== 'firstChild'){
						startChange = true;
					}
				}
				if(tmpRange.startContainer.childNodes[tmpRange.startOffset]){
					if(tmpRange.startContainer.childNodes[tmpRange.startOffset] !== tmpRange._startAfter){
						startChange = true;
					}
				}else{
					if(tmpRange._startAfter !== 'lastChild'){
						startChange = true;
					}
				}
				//文本节点则不去修改
				if(tmpRange._startAfter === 'text'){
					startChange = false;
				}
				if(startChange === true){
					/*优先选择_startAfter前面进行范围的设置，
					* 如果不行，则放在_startBefore的后面
					*/
					if(tmpRange._startAfter === 'lastChild'){
						tmpRange.startOffset = tmpRange.startContainer.childNodes.length;
					}
					else if(tmpRange._startAfter && tmpRange._startAfter.parentNode === tmpRange.startContainer){
						tmpRange.setStartBefore(tmpRange._startAfter,1);
					}else if(tmpRange._startBefore === 'firstChild'){
						tmpRange.startOffset = 0;
					}
					else if(tmpRange._startBefore && tmpRange._startBefore.parentNode === tmpRange.startContainer){
						tmpRange.setStartAfter(tmpRange._startBefore,1);
					}else{
						tmpRange.startContainer = _document;
						tmpRange.startOffset = 0;
					}
				}
			}else{
				if(!tmpRange.startContainer){
					tmpRange.startContainer = _document;
					tmpRange.startOffset = 0;
				}
			}
			if(tmpRange.endContainer && tmpRange.endContainer.nodeType !== 3){
				if(tmpRange.endContainer.childNodes[tmpRange.endOffset-1]){
					if(tmpRange.endContainer.childNodes[tmpRange.endOffset-1] !== tmpRange._endBefore){
						endChange = true;
					}
				}else{
					if(tmpRange._endBefore !== 'firstChild'){
						endChange = true;
					}
				}
				if(tmpRange.endContainer.childNodes[tmpRange.endOffset]){
					if(tmpRange.endContainer.childNodes[tmpRange.endOffset] !== tmpRange._endAfter){
						endChange = true;
					}
				}else{
					if(tmpRange._endAfter !== 'lastChild'){
						endChange = true;
					}
				}
				//文本节点不去修改
				if(tmpRange._endBefore === 'text'){
					endChange = false;
				}
				if(endChange === true){
					/*优先选择_endBefore后面进行范围的设置，
					* 如果不行，则放在_endAfter的前面
					*/
					if(tmpRange._endBefore === 'firstChild'){
						tmpRange.endOffset = 0;
					}else if(tmpRange._endBefore && tmpRange._endBefore.parentNode === tmpRange.endContainer){
						tmpRange.setEndAfter(tmpRange._endBefore,2);
					}else if(tmpRange._endAfter === 'lastChild'){
						tmpRange.endOffset = tmpRange.endContainer.childNodes.length;
					}else if(tmpRange._endAfter && tmpRange._endAfter.parentNode === tmpRange.endContainer){
						tmpRange.setEndBefore(tmpRange._endAfter,2);
					}else{
						tmpRange.endContainer = _document;
						tmpRange.endOffset = 0;
					}
				}
			}else{
				if(!tmpRange.endContainer){
					tmpRange.endContainer = _document;
					tmpRange.endOffset = 0;
				}
			}
		}
	}
};
DOMRange.prototype = {
	START_TO_START : 0,
	START_TO_END : 1,
	END_TO_END : 2,
	END_TO_START : 3,
	/**
	* @description 更新范围属性信息，其中有是否闭合，公共父节点，
	* 	以及用于维护因节点发生变化导致范围不准确的变量
	* @param {number} flag 更新维护位置 0-无，1-前，2-后，3-前后
	**/
	_refreshProperties: function (flag) {
		flag = typeof flag === 'undefined' ? 3 : flag;
		// collapsed attribute
		this.collapsed = (this.startContainer == this.endContainer && this.startOffset == this.endOffset);
		// find common ancestor
		this.commonAncestorContainer = DOMUtils.getCommonAncestor(this);
		//更新用来维护范围的变量，以便于在DOM发生变化的时候，一些范围还可以使用
		if(flag & 1){
			if(this.startContainer.nodeType !== 3){
				if(this.startContainer.childNodes[this.startOffset-1]){
					this._startBefore = this.startContainer.childNodes[this.startOffset-1];
				}else{
					this._startBefore = 'firstChild';
				}
				if(this.startContainer.childNodes[this.startOffset]){
					this._startAfter = this.startContainer.childNodes[this.startOffset];
				}else{
					this._startAfter = 'lastChild';
				}
			}else{
				this._startBefore = this._startAfter = 'text';
			}
		}
		if(flag & 2){
			if(this.endContainer.nodeType !== 3){
				if(this.endContainer.childNodes[this.endOffset-1]){
					this._endBefore = this.endContainer.childNodes[this.endOffset-1];
				}else{
					this._endBefore = 'firstChild';
				}
				if(this.endContainer.childNodes[this.endOffset]){
					this._endAfter = this.endContainer.childNodes[this.endOffset];
				}else{
					this._endAfter = 'lastChild';
				}
			}else{
				this._endBefore = this._endAfter = 'text';
			}
		}
	},
	/**
	* @description设置范围起始位置
	* @param {object.<node>} startNode 起始节点
	* @param {number} offset 偏移量
	* @param {number} flag 更新维护位置 0-无，1-前，2-后，3-前后
	**/
	setStart : function(startNode,offset,flag){
		flag = typeof flag === 'undefined' ? 3 : flag;
		this.startContainer = startNode;
		this.startOffset = offset;
		this._refreshProperties(flag);
	},
	/**
	* @description 设置范围结束位置
	* @param {object.<node>} endNode 结束节点
	* @param {number} offset 偏移量
	* @param {number} flag 更新维护位置 0-无，1-前，2-后，3-前后
	**/
	setEnd : function(endNode,offset,flag){
		flag = typeof flag === 'undefined' ? 3 : flag;
		this.endContainer = endNode;
		this.endOffset = offset;
		this._refreshProperties(flag);
	},
	/**
	* @description 设置起始位置在节点之前
	* @param {object.<node>} startNode 目标节点
	* @param {number} flag 更新维护位置 0-无，1-前，2-后，3-前后
	**/
	setStartBefore : function(startNode,flag){
		flag = typeof flag === 'undefined' ? 3 : flag;
		this.setStart(startNode.parentNode, DOMUtils.nodeIndex(startNode),flag);
	},
	/**
	* @description 设置起始位置在节点之后
	* @param {object.<node>} startNode 目标节点
	* @param {number} flag 更新维护位置 0-无，1-前，2-后，3-前后
	**/
	setStartAfter : function(startNode,flag){
		flag = typeof flag === 'undefined' ? 3 : flag;
		this.setStart(startNode.parentNode, DOMUtils.nodeIndex(startNode)+1,flag);
	},
	/**
	* @description 设置结束位置在节点之前
	* @param {object.<node>} endNode 目标节点
	* @param {number} flag 更新维护位置 0-无，1-前，2-后，3-前后
	**/
	setEndBefore : function(endNode,flag){
		flag = typeof flag === 'undefined' ? 3 : flag;
		this.setEnd(endNode.parentNode, DOMUtils.nodeIndex(endNode),flag);
	},
	/**
	* @description 设置结束位置在节点之后
	* @param {object.<node>} endNode 目标节点
	* @param {number} flag 更新维护位置 0-无，1-前，2-后，3-前后
	**/
	setEndAfter : function(endNode,flag){
		flag = typeof flag === 'undefined' ? 3 : flag;
		this.setEnd(endNode.parentNode, DOMUtils.nodeIndex(endNode)+1,flag);
	},
	/**
	* @description 选择一个节点为范围
	* @param {object.<node>} node 目标节点
	**/
	selectNode : function(node){
		this.setStartBefore(node);
		this.setEndAfter(node);
	},
	/**
	* @description 选择一个节点的内容为范围
	* @param {object.<node>} node 目标节点
	**/
	selectNodeContents : function(node){
		this.setStart(node, 0);
		this.setEnd(node, DOMUtils.getNodeLength(node));
	},
	/**
	* @description 折叠范围
	* @param {number} toStart 折叠到开始位置
	**/
	collapse : function(toStart){
		if (toStart){
			this.setEnd(this.startContainer, this.startOffset);
		}else{
			this.setStart(this.endContainer, this.endOffset);
		}
		this._refreshProperties();
	},
	/**
	* @description 删除范围区域
	**/
	deleteContents : function(){
	/**
	如果起始/终止节点是元素节点，向上找到到公共父节点，
	之后遍历公共父节点的子节点，如果是起始/终止节点：
		然后依次找到目标节点的各个父节点，删除，之后/之前的节点，
	如果是中间节点：直接删除
	如果起始/终止节点是文字节点，创建文字节点，向后/向前删除文字节点
	遍历文字节点的父节点，删除目标节点，之后/之前的文字节点，
		然后以文字父节点为目标，按照元素节点方法进行删除
	**/
		var del = true,clone = false;
		this._optContents(del,clone);
	},
	/**
	* @description 复制范围区域到文档片段
	* @return {object.<fragment>} 范围区域的片段
	**/
	cloneContents : function(){
	/**
	创建fragment，
	如果起始/终止节点是元素节点，向上找到到公共父节点，
	之后遍历公共父节点的子节点，如果是起始/终止节点：
		然后依次克隆父节点，插入目标节点，之后/之前的节点，
	如果是中间节点：直接插入
	如果起始/终止节点是文字节点，创建文字节点，向后/向前截断文字节点
	遍历文字节点的父节点，克隆父节点，插入目标节点，之后/之前的文字节点，
		然后以文字父节点为目标，按照元素节点方法进行插入，
		然后替换起始节点的第一个叶子元素节点为截断后的插入到的克隆出来的父节点
	返回fragment
	**/
		var del = false,clone = true;
		return this._optContents(del,clone);
	},
	/**
	* @description 删除并获取范围区域
	* 	change:范围折叠
	* @return {object.<fragment>} 范围区域的片段
	**/
	extractContents : function(){
		var del = true,clone = true;
		return this._optContents(del,clone);
	},
	/**
	* @description 对范围区域进行处理（删除，克隆操作）
	* 	change:如果删除则范围折叠
	* @param {boolean} del 是否要删除范围区域
	* @param {boolean} clone 是否要返回范围区域
	* @return {object.<fragment>} 范围区域的片段
	**/
	_optContents : function(del,clone){
		var start = this.startContainer,
			end = this.endContainer,
			startOffset = this.startOffset,
			endOffset = this.endOffset,
			anctor = this.commonAncestorContainer;
			frag = document.createDocumentFragment(),
			tmpStart={}, tmpEnd={}, 
			startType = false,endType = false;
		if(this.collapsed){
			return frag;
		}
		//用来判断截断的是不是文本节点中的内容
		if(start.nodeType === 3){
			startType = true;
		}
		if(end.nodeType === 3){
			endType = true;
		}
		//如果全部是文本节点，并且在同一个节点上，则可以单独处理，直接将文本节点放在frag上
		if(start === end && startType && endType){
			var startText = start.nodeValue.slice(startOffset,endOffset);
			var startTextNode = document.createTextNode(startText);
			if(del){
				var tmpStartText = start.nodeValue.slice(0,startOffset);
				var tmpEndText = start.nodeValue.slice(endOffset);
				var startSliceNode = document.createTextNode(tmpStartText);
				var endSliceNode = document.createTextNode(tmpEndText);
				start.parentNode.replaceChild(endSliceNode,start);
				endSliceNode.parentNode.insertBefore(startSliceNode,endSliceNode);
				this.setStart(endSliceNode.parentNode,DOMUtils.nodeIndex(startSliceNode)+1);
				this.collapse(true);
			}
			frag.appendChild(startTextNode);
			if(clone){
				return frag;
			}else{
				return;
			}
		}else{
			//处理文本节点的截断，将文本节点的截断部分取出，如果要删除截取部分，则改变文本节点的值
			if(startType){
				var startText = start.nodeValue.slice(startOffset);
				var startTextNode = document.createTextNode(startText);
				if(del){
					start.nodeValue = start.nodeValue.slice(0,startOffset);
				}
				startOffset = DOMUtils.nodeIndex(start);
				start = start.parentNode;
			}
			if(endType){
				var endText = end.nodeValue.slice(0,endOffset);
				var endTextNode = document.createTextNode(endText);
				if(del){
					end.nodeValue = end.nodeValue.slice(endOffset);
				}
				endOffset = DOMUtils.nodeIndex(end)+1;
				end = end.parentNode;
			}
		}
		//将公共父节点之前的所有父节点取出待遍历
		var startParents = DOMUtils.findParents(start,anctor);
		var endParents = DOMUtils.findParents(end,anctor);
		var startNode = start.childNodes[startOffset],endNode = end.childNodes[endOffset-1];
		startParents.unshift(startNode);
		endParents.unshift(endNode);
		tmpStart = startParents.pop();tmpEnd = endParents.pop();
		//遍历截取范围最外层的节点，如果是头尾节点进行处理，如果是中间节点，则直接剪切
		var tmpNode = tmpStart.nextSibling;
		if(tmpStart === tmpEnd){
			tmpNode = null;
		}
		var pasteFrag = frag;
		//定制操作结束后的范围
		var rangeIndex = DOMUtils.nodeIndex(tmpStart);
		if(startParents.length !== 0 || startType){
			rangeIndex += 1;
		}
		//处理头节点
		while(typeof(tmpStart) === "object"){
			if(tmpStart === startNode){
				if(startType){
					if(pasteFrag.firstChild){
						pasteFrag.insertBefore(startTextNode, pasteFrag.firstChild);
					}else{
						pasteFrag.appendChild(startTextNode);
					}
					var popStart = startParents.pop();
				}
				else{
					if(tmpStart !== endNode && tmpStart !== tmpEnd){
						if(pasteFrag.firstChild){
							pasteFrag.insertBefore(tmpStart, pasteFrag.firstChild);
						}else{
							pasteFrag.appendChild(tmpStart);
						}
					}else{
						var emptyStart = true;
					}
					break;
				}
			}else{
				var popStart = startParents.pop();
				var startIndex = (typeof(popStart) === "object") ? DOMUtils.nodeIndex(popStart) : startOffset;
				var startNext = tmpStart.childNodes[startIndex] ? tmpStart.childNodes[startIndex].nextSibling : undefined;
				var tmpParent = tmpStart.cloneNode(false);
				if(pasteFrag.firstChild){
					pasteFrag.insertBefore(tmpParent, pasteFrag.firstChild);
				}else{
					pasteFrag.appendChild(tmpParent);
				}
				while(startNext){
					var tmpNext = startNext.nextSibling;
					if(del){
						tmpParent.appendChild(startNext);
					}else{
						var cloneNode = tmpNode.cloneNode(true);
						tmpParent.appendChild(cloneNode);
					}
					startNext = tmpNext;
				}
			}
			pasteFrag = tmpParent;
			tmpStart = popStart;
		}
		//处理中间节点
		pasteFrag = frag;
		while(tmpNode !== null && tmpNode !== anctor.lastChild && tmpNode !== tmpEnd){
			var tmpNext = tmpNode.nextSibling;
			if(del){
				frag.appendChild(tmpNode);
			}else{
				var cloneNode = tmpNode.cloneNode(true);
				frag.appendChild(cloneNode);
			}
			tmpNode = tmpNext;
		}
		//如果头尾节点不处于重合父节点区域，不用考虑节点是否已经被加入到fragment中
		if(tmpNode === tmpEnd){
			emptyStart = true;
		}
		//处理尾节点
		pasteFrag = frag;
		while(typeof(tmpEnd) === "object"){
			if(tmpEnd === endNode){
				if(endType){
					pasteFrag.appendChild(endTextNode);
					var popEnd = endParents.pop();
				}else{
					if(emptyStart){
						pasteFrag.appendChild(tmpEnd);
					}
					break;
				}
			}else{
				var endNext = tmpEnd.firstChild;
				var tmpParent = tmpEnd.cloneNode(false);
				var popEnd = endParents.pop();
				var endIndex = (typeof(popEnd) === "object") ? DOMUtils.nodeIndex(popEnd) : endOffset;
				var finalNode = tmpEnd.childNodes[endIndex];
				while(endNext && endNext !== finalNode){
					var tmpNext = endNext.nextSibling;
					if(del){
						tmpParent.appendChild(endNext);
					}else{
						var cloneNode = tmpNode.cloneNode(true);
						tmpParent.appendChild(cloneNode);
					}
					endNext = tmpNext;
				}
				pasteFrag.appendChild(tmpParent);
			}
			pasteFrag = tmpParent;
			tmpEnd = popEnd;
		}
		if(del){
			DOMRange._refreshRange(this._index);
			this.setStart(anctor,rangeIndex);
			this.collapse(true);
		}
		if(clone){
			return frag;
		}
	},
	/**
	* @description 复制范围
	* @return {object.<DOMRange>} 新的DOMRange，拥有原DOMRange的属性值
	**/
	cloneRange : function(){
		var range = new DOMRange(this._document);
		range.setStart(this.startContainer, this.startOffset);
		range.setEnd(this.endContainer, this.endOffset);
		var index = range._index
		DOMRange._rangeQuery[index] = range;
		return range;
	},
	/**
	* @description 插入节点
	*	change:范围折叠，然后范围选中插入内容
	*@param {object.<node> | object.<fragment>} node 插入的内容
	*
	**/
	insertNode : function(node){
		if(node.nodeType === 11){
			var tmpNode = node.lastChild;
			var tmpStart = node.firstChild;
			var tmpEnd = node.lastChild;
			var nodeLen = node.childNodes.length;
			while(tmpNode){
				preNode = tmpNode.previousSibling;
				var offset = this.insertNode(tmpNode);
				if(tmpNode === tmpStart){
					var tmpStartOffset = offset;
				}
				tmpNode = preNode;
			}
			if(nodeLen){
				var tmpEndOffset = tmpStartOffset + nodeLen;
				DOMRange._refreshRange(this._index);
				this.setStart(this.startContainer,tmpStartOffset);
				this.setEnd(this.startContainer,tmpEndOffset);
			}
		}else{
			// set original anchor and insert node
			if (DOMUtils.isDataNode(this.startContainer)) {
				DOMUtils.splitDataNode(this.startContainer, this.startOffset);
				this.startContainer.parentNode.insertBefore(node, this.startContainer.nextSibling);
			} else {
				if(this.startContainer.childNodes[this.startOffset]){
					this.startContainer.insertBefore(node, this.startContainer.childNodes[this.startOffset]);
				}else{
					this.startContainer.appendChild(node);
				}
			}
			// resync start anchor
			DOMRange._refreshRange(this._index);
			this.setStart(this.startContainer, this.startOffset);
			this.setEnd(this.startContainer,this.startOffset+1);
			return this.startOffset;
		}	
	},
	/**
	* @description 包裹范围
	*	change:范围选中包裹后的内容
	* @param {object.<node>} node 用于包裹的节点
	**/
	surroundContents : function(node){
		/**
		该方法将把当前范围的父节点重定为 newParent，然后把 newParent 插在文档中范围的开始位置。
		如果 newParent 已经是文档的一部分，那么它首先将从文档中删除，它的子节点也将被舍弃。
		**/
		// extract and surround contents
		var content = this.extractContents();
		this.insertNode(node);
		node.appendChild(content);
		DOMRange._refreshRange(this._index);
		this.selectNode(node);
	},
	/**
	* @description 释放范围
	*	change:范围失效
	**/
	detach : function(){
		DOMRange._rangeQuery.splice(this._index,1);
	},
	/**
	* @description 根据字符串创建文档片段
	* @param {string} tagString 待创建片段的字符串内容
	* @return {object.<fragment>} 生成的文档片段
	**/
	createContextualFragment: function (tagString) {
		// parse the tag string in a context node
		var content = (DOMUtils.isDataNode(this.startContainer) ? this.startContainer.parentNode : this.startContainer).cloneNode(false);
		content.innerHTML = tagString;
		// return a document fragment from the created node
		for (var fragment = this._document.createDocumentFragment(); content.firstChild; )
			fragment.appendChild(content.firstChild);
		return fragment;
	},
	/**
	* @description 方法比较两个范围的位置
	* @param {object.<DOMRange> | number} how 声明如何执行比较操作（即比较哪些边界点）
	* @param {object.<DOMRange>} sourceRange 要与当前范围进行比较的范围
	* @return {number}
	*	当前范围的指定边界点位于 sourceRange 指定的边界点之前，则返回 -1。
	*	指定的两个边界点相同，则返回 0。
	*	当前范围的边界点位于 sourceRange 指定的边界点之后，则返回 1
	**/
	compareBoundaryPoints : function(how,sourceRange){
		// get anchors
		var containerA, offsetA, containerB, offsetB;
		switch (how) {
			case DOMRange.START_TO_START:
			case DOMRange.END_TO_START:
				containerA = this.startContainer;
				offsetA = this.startOffset;
				if(containerA.nodeType !== 3){
					if(containerA.childNodes.length <= offsetA && containerA.lastChild){
						containerA = containerA.lastChild;
						offsetA = 2147483647;
					}else{
						containerA = containerA.childNodes[offsetA];
						offsetA = -1;
					}
				}
				break;
			case DOMRange.END_TO_END:
			case DOMRange.START_TO_END:
				containerA = this.endContainer;
				offsetA = this.endOffset;
				if(containerA.nodeType !== 3){
					if(containerA.childNodes.length <= offsetA && containerA.lastChild){
						containerA = containerA.lastChild;
						offsetA = 2147483647;
					}else{
						containerA = containerA.childNodes[offsetA];
						offsetA = -1;
					}
				}
				break;
		}
		switch (how) {
			case DOMRange.START_TO_START:
			case DOMRange.START_TO_END:
				containerB = sourceRange.startContainer;
				offsetB = sourceRange.startOffset;
				if(containerB.nodeType !== 3){
					if(containerB.childNodes.length <= offsetB && containerB.lastChild){
						containerB = containerB.lastChild;
						offsetB = 2147483647;
					}else{
						containerB = containerB.childNodes[offsetB];
						offsetB = -1;
					}
				}
				break;
			case DOMRange.END_TO_START:
			case DOMRange.END_TO_END:
				containerB = sourceRange.endContainer;
				offsetB = sourceRange.endOffset;
				if(containerB.nodeType !== 3){
					if(containerB.childNodes.length <= offsetB && containerB.lastChild){
						containerB = containerB.lastChild;
						offsetB = 2147483647;
					}else{
						containerB = containerB.childNodes[offsetB];
						offsetB = -1;
					}
				}
				break;
		}
		if(containerA === containerB){
			 return offsetA < offsetB ? -1 : offsetA == offsetB ? 0 : 1;
		}else{
			var a1 = this._document.createElement('a'),a2 = this._document.createElement('a');;
			containerA.parentNode.insertBefore(a1,containerA);
			containerB.parentNode.insertBefore(a2,containerB);
			var comResult;
			if(a1.nextSibling === a2){
				comResult =  0;
			}else if(a1.sourceIndex < a2.sourceIndex){
				comResult = -1;
			}else{
				comResult = 1;
			}
			containerA.parentNode.removeChild(a1);
			containerB.parentNode.removeChild(a2);
			return comResult;
			/*var indexA = -1;
			if(containerA.nodeType === 3){
				indexA = DOMUtils.nodeIndex(containerA);
				containerA = containerA.parentNode;
			}
			var indexB = -1;
			if(containerB.nodeType === 3){
				indexB = DOMUtils.nodeIndex(containerB);
				containerB = containerB.parentNode;
			}
			var textRangeA = this._document.body.createTextRange();
			textRangeA.moveToElementText(containerA);
			var textRangeB = this._document.body.createTextRange();
			textRangeB.moveToElementText(containerB);
			var iResult = textRangeA.compareEndPoints('StartToStart', textRangeB);

			// compare
			if(iResult === -1){
				return -1;
			}else if(iResult === 0){
				 if(indexA < indexB){
					 return -1;
				 }else if(indexA === indexB){
					 if(offsetA < offsetB){
						 return -1;
					 }else if(offsetA === offsetB){
						  return 0;
					 }else{
						 return 1;
					 }
				 }else{
					 return 1;
				 }
			}else{
				return 1;
			}*/
		}
	},
	/**
	* @description 获取范围区域的纯文本内容
	* @return {string} 纯文本内容
	**/
	toString : function(){
		return TextRangeUtils.convertFromDOMRange(this).text;
	},
	constructor : DOMRange
};

/*
  DOM Selection
 */
 
//[NOTE] This is a very shallow implementation of the Selection object, based on Webkit's
// implementation and without redundant features. Complete selection manipulation is still
// possible with just removeAllRanges/addRange/getRangeAt.

/**
* 仿标准window.getSelection()方法生成的selection对象的构造函数
* @constructor
* @param {object} document 生效的document文档
**/
function DOMSelection(document) {
	// save document parameter
	this._document = document;
	
	// add DOM selection handler
	var selection = this;
	document.attachEvent('onselectionchange', function () { selection._selectionChangeHandler(); });
}

DOMSelection.prototype = {
	// public properties
	rangeCount: 0,
	// private properties
	_document: null,
	
	// private methods
	_selectionChangeHandler: function () {
		// check if there exists a range
		this.rangeCount = this._selectionExists(this._document.selection.createRange()) ? 1 : 0;
	},
	_selectionExists: function (textRange) {
		// checks if a created text range exists or is an editable cursor
		try{
			return textRange.compareEndPoints("StartToEnd", textRange) != 0 ||
				textRange.parentElement().isContentEditable;
		}catch(ex){
			return false;
		}

	},
	
	// public methods
	addRange: function (range) {
		// add range or combine with existing range
		var selection = this._document.body.createTextRange(), textRange = TextRangeUtils.convertFromDOMRange(range);
		if (this._selectionExists(selection))
		{
			// select range
			textRange.select();
		}
		else
		{	
			selection.setEndPoint("StartToStart", textRange);
			selection.setEndPoint("EndToEnd", textRange);
			selection.select();
		}
	},
	removeAllRanges: function () {
		// remove all ranges
		this._document.selection.empty();
	},
	getRangeAt: function (index) {
		// return any existing selection, or a cursor position in content editable mode
		var textRange = this._document.selection.createRange();
		var domRange = new DOMRange(this._document);
		if (this._selectionExists(textRange)){
			//return TextRangeUtils.convertToDOMRange(textRange, this._document);
			var oriRange = transformIERangeToRange(textRange,domRange);
			var startNode = oriRange.startContainer.childNodes[oriRange.startOffset];
			var endNode = oriRange.endContainer.childNodes[oriRange.endOffset-1];
			if(startNode){
				while(startNode.nextSibling){
					var content = startNode.nodeType === 3 ? startNode.nodeValue : startNode.innerText;
					if(content.length == 0){
						startNode = startNode.nextSibling;
					}else{
						break;
					}
				}
				while(startNode.firstChild){
					startNode = startNode.firstChild;
				}
				oriRange.setStart(startNode,0);
			}
			if(endNode){
				while(endNode.nextSibling){
					var content = endNode.nodeType === 3 ? endNode.nodeValue : endNode.innerText;
					if(content.length == 0){
						endNode = endNode.previousSibling;
					}else{
						break;
					}
				}
				while(endNode.lastChild){
					endNode = endNode.lastChild;
				}
				if(endNode.nodeType === 3){
					oriRange.setEnd(endNode,endNode.nodeValue.length);
				}else{
					oriRange.setEnd(endNode,endNode.childNodes.length);
				}
				
			}
			return oriRange;
		}
		return null;
	},
	toString: function () {
		// get selection text
		return this._document.selection.createRange().text;
	}	
};
var selection = new DOMSelection(document);
window.getSelection = function () {
	// 此处使用 window.focus() 会导致ie下点击图片时，光标被定位到文档顶部
	//window.focus();
	return selection;
};
})();