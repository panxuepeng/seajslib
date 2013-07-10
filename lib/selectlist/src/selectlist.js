/*
 * selectlist
 * https://github.com/Administrator/selectlist
 *
 * Copyright (c) 2013
 * Licensed under the MIT license.
 */

/*
	author : huzhiming
	date : 2012-02-07

	测试数据
	id: option的value值，
	name：option显示内容，
	parent_id: 父级菜单项的id，没有可以为空字符串或者null[也可以不加此属性]

var testData = [{id:1,parent_id:0,name:'一级1'},
				{id:2,parent_id:0,name:'一级2'},
				{id:21,parent_id:1,name:'二级1'},
				{id:22,parent_id:1,name:'二级2'},
				{id:31,parent_id:21,name:'三级1'},
				{id:32,parent_id:21,name:'三级2'},
				{id:41,parent_id:31,name:'四级1'},
				{id:51,parent_id:41,name:'四级2'},
				{id:52,parent_id:41,name:'四级2'},
				{id:221,parent_id:2,name:'二级一'},
				{id:222,parent_id:2,name:'二级二'},
				{id:331,parent_id:222,name:'三级一'},
				{id:332,parent_id:222,name:'三级二'},
				{id:441,parent_id:332,name:'四级一'},
				{id:442,parent_id:332,name:'四级二'},
				{id:551,parent_id:442,name:'五级一'},
				{id:552,parent_id:442,name:'五级二'}
				];
使用方法

$(document).ready(function(){
	var config = {select_text : '请选择', load_all : false,selected_id: 552, load_callback: function(){
		alert(1);
	}};
	//增加配置信息
	$('#test').SelectList(testData,config);
	//没有配置信息
	$('#test1').SelectList(testData);
	$('#test2').SelectList(testData);
});
*/


(function($){
define(function(require, exports){
	
});

$.fn.selectList = function(data,config){
	var self = this,
		selectList = new SelectList(self[0],data,config);
	return self;
}
/*
	@object box: 需要显示级联菜单的标签jquery对象[必须]
	@object data : 所有菜单项数据格式如testData[必须]
	@config :配置信息[可选,有默认值]
*/
function SelectList(box,data,config){
	/*
		@object default_config:默认配置信息.
			@string select_text : 默认为''，如果不需要则可以设置为空字符串,如果需要则直接写需要显示内容
			@boolean load_all : 代表是否一次加载所有子菜单
			@int selected_id :指定需要选中的菜单项id
			@Function load_callback : 组件初始化完成后回调方法
	*/
	var default_config = {
		select_text : '',
		load_all : true,
		selected_id : 0,
		load_callback : function(){}
	}
	/*
		@object tmp_data :存放组装后的data，格式如：
		{
			0:[{id:11,parent_id:0, name:'一级1'},{id:12,parent_id:0, name:'一级2'}],
			11:[{id:21,parent_id:0, name:'二级1'},{id:22,parent_id:0, name:'二级2'}],
			21:[{id:31,parent_id:0, name:'三级1'},{id:32,parent_id:0, name:'三级2'}],
		}
	*/
	this.tmp_data = {};
	/*
		@object data_map : 存放所有记录的key-value键值对，便于程序查找
		格式如：{
			1 : {id:1,parent_id:0, name:'一级1'},
			2 : {id:2,parent_id:0, name:'一级2'},
			3 : {id:3,parent_id:0, name:'三级2'}
		}
	*/
	this.data_map = {};
	/*
		@JQuery box: 显示下拉列表的标签
	*/
	this.box = $(box);
	/*
		@object config :配置信息.
		如果没有传配置信息参数则使用默认配置信息,提供了则覆盖默认配置信息
	*/
	this.config = typeof config == 'object' ? $.extend(default_config,config) : default_config;
	/*
		@object select_obj: 指定需要选中的菜单项
	*/
	this.select_obj = null;
	/*
		初始化组件,数据二次组装在该方法中进行
	*/
	this.init(data);
}
var fn = SelectList.prototype;
/*
	初始化方法
	@object data: 需要组装的数据.
	对data进行组装生产tmpData格式数据，同时显示一级列表
*/
fn.init = function(data){
	var self = this, tmp_data= self.tmp_data,
		tmp= null, config = self.config,
		parent_id = 0, load_select = null;
	//非数组或者空数组退出
	if(!(data instanceof Array) || !data.length || !self.box.length){
		return;
	}
	//重新组装数据列表
	for(var i = 0 ; i < data.length; i++){
		tmp = data[i];
		//不提供parent_id 或者parent_id为否值则默认为一级菜单,parent_id用0替代
		parent_id = tmp.parent_id ? tmp.parent_id : parent_id;
		//如果需要默认选中select_id  则记录默认选中菜单记录对象
		if(config.selected_id == tmp.id){
			self.select_obj = tmp;
		}
		//记录键值对
		self.data_map[tmp.id] = tmp;
		if(tmp_data[tmp.parent_id] instanceof Array){
			tmp_data[tmp.parent_id].push(tmp);
		}else{
			//如果配置了默认选项则在数组开始增加该项
			if(config.select_text.length){
				//默认项id为空字符串
				tmp_data[tmp.parent_id] = [{id: '', name: config.select_text}]
				tmp_data[tmp.parent_id].push(tmp);
			}else{
				tmp_data[tmp.parent_id] = [tmp];
			}
		}
	}
	//初始化时显示一级列表，parent_id = 0
	load_select = self.load_select(0);
	/*
		如果配置了默认选中项select_id 则显示默认选中项
		如果配置了一次加载所有子列表,且没有配置默认选中项，则触发子列表change事件
	*/
	if(self.select_obj){
		//设置默认选中项
		self.set_select();
	}else{
		if(config.load_all && load_select.length){
			load_select.trigger('change');
		}
	}
	//执行回调方法
	if(typeof config.load_callback === 'function'){
		config.load_callback();
	}
}
/*
	根据parent_id加载select
	@string parent_id : 父级列表项id.
	@return object 返回加载的select标签对象
*/
fn.load_select = function(parent_id){
	var self = this, tmp_data = self.tmp_data, load_data = tmp_data[parent_id],
		box = self.box, html= [], tmp = null, config= self.config,
		parent_obj = box.find('select[parent_id='+parent_id+']');
	if(!(load_data instanceof Array) || !load_data.length){
		return parent_obj;
	}
	for( var i = 0 ; i < load_data.length; i++ ){
		tmp = load_data[i];
		html.push('<option value="'+tmp.id+'">'+tmp.name+'</option>');
	}
	if(parent_obj.length){
		parent_obj.html(html.join(''));
	}else{
		parent_obj = $('<select parent_id="'+parent_id+'">'+html.join('')+'</select>');
		box.append(parent_obj);
		//对于新增的select需要绑定change事件
		parent_obj.change(function(){
			self.change($(this));
		});
	}
	return parent_obj;
}
/*
	change事件调用该方法
	@JQuery obj:触发change的jquery对象.
	功能：删除obj后面的select标签，如果存在id则加载该parent_id = id的所有列表项
*/
fn.change = function(obj){
	var self = this,
		parent_id = obj.attr('parent_id'),
		id= obj.val(),
		box = self.box,
		load_select = null,
		config = self.config;
	//清除当前select后面所有的select
	self.clear_next(parent_id);
	if(id.length){
		load_select = self.load_select(id);
		//如果配置了需要一次加载所有子列表则触发子列表的change事件
		if(config.load_all && load_select.length){
			load_select.trigger('change');
		}
	}
}

/*
	根据id设置默认选中项
*/
fn.set_select = function(selected_id){
	var self = this, data_map = self.data_map,
		obj = selected_id ? data_map[selected_id] : self.select_obj,
		objs = [], tmp = null, box = self.box;
	box.find('select[parent_id]').remove();
	while(obj){
		objs.push(obj);
		obj = data_map[obj.parent_id];
	}
	//最后一个select需要触发chang事件
	while(objs.length){
		obj = objs.pop();
		tmp = self.load_select(obj.parent_id);
		tmp.val(obj.id);
		if(objs.length == 0){
			tmp.trigger('change');
		}
	}
}

/*
	清除当前选中select后面相关的select
	@string parent_id : 当前select标签的parent_id属性值
*/
fn.clear_next = function(parent_id){
	var self = this, box = self.box,
		now_select = box.find('select[parent_id='+parent_id+']');
	if(now_select.length){
		while(now_select.next('select[parent_id]').length){
			now_select.next('select[parent_id]').remove();
		}
	}
}

})(jQuery);