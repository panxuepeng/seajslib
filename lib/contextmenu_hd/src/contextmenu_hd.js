/*
 * contextmenu_hd
 * https://github.com/Administrator/contextmenu_hd
 *
 * Copyright (c) 2013
 * Licensed under the MIT license.
 */
(function ($) {
	var dom = $(document),
		setTimeVal = null,
		menuLeft = 0,
		menuTop = 0;

	var Menu = {
		//创建菜单
		create: function( menu ) {
			var htmlstr = '<div class="hd-menu">\
					<div class="hd-shadow hd-default"></div>\
					<div class="hd-menu-body">';
			for (var k in menu ){
				var submenu = divmore = '';
				if (menu[k].submenu != undefined){
					submenu = Menu.create(menu[k].submenu);
					divmore = '<div class="hd-menu-more"></div>';
				}
				if (k == 'sep1'){
					htmlstr +='<div class="hd-menu-item hd-menu-separator">\
						<div class="hd-menu-separator-inner"></div>\
						</div>';
				} else {
					var disabledClass = '',
						icon ='';
					if (menu[k].disabled){
						disabledClass = ' disabled';
					}
					if (menu[k].icon){
						icon = ' hd-'+menu[k].icon;
					}
					htmlstr += '<div class="hd-menu-item " evt="'+menu[k]['event']+'">\
								<div class="hd-menu-icon'+icon+disabledClass+'"></div>\
								<div class="hd-menu-label">'+menu[k].name+submenu+'</div>'+divmore+'</div>';
				}
			}
			htmlstr += '</div></div>';
			return htmlstr;
		},
		setPosition: function (event) {
			var clientX = event.clientX,
				clientY = event.clientY,
				redge = $(window).width() - clientX,
				bedge = $(window).height() - clientY;

			var menu = $('.hd-menu'),
				menu_width = menu.width(),
				menu_height = menu.outerHeight();
			if (redge < menu_width) {
				menuLeft = dom.scrollLeft() + clientX - menu.outerWidth();
			}else{
				menuLeft = dom.scrollLeft() + clientX;
			}
			if (bedge < menu_height){
				menuTop = dom.scrollTop() + clientY - menu.outerHeight();
			}else{
				menuTop = dom.scrollTop() + clientY;
			}
			//设置父菜单的位置
			menuTop = (menuTop < 0 ) ? 0 : menuTop;
			menuLeft = (menuLeft < 0 ) ? 0 : menuLeft;
			$('.hd-menu:visible').css ({'position':'absolute','top':menuTop+'px','left':menuLeft+'px','z-index':10});

		},

		remove: function(){
			$('.hd-menu').remove();
		}
	}
	$.fn.contextmenu = function (conf) {
		$(this).bind('contextmenu' ,function (event) {
			$('.hd-menu').remove();
			$('body').append(Menu.create(conf.items));
			Menu.setPosition(event);
			//返回false ,阻止系统右键菜单出现
			return false;
		});
		if (typeof conf.callback === 'function'){
			dom.delegate('.hd-menu-item','click', function(){
				conf.callback($(this));
				Menu.remove();
				return false;
			});
		}
		return this;
	}

	//单击,清除菜单
	dom.bind('click.contextmenu', function (){
		Menu.remove();
	});

	//滑动到更多,显示子菜单
	dom.delegate('.hd-menu-item','mouseenter',function(e) {
		var submenu = $(this).children('.hd-menu-label').children('.hd-menu');
		clearTimeout (setTimeVal);
		if (submenu.size()) {
			setTimeVal = setTimeout(function () {submenu.show ();},200);
			var pos = $(this).position(),
				swidth = submenu.outerWidth(),
				sheight = submenu.outerHeight();
			if (menuTop+pos.top+sheight > $(window).height()){
				var h =-1-sheight+25;
				submenu.css ({'top':h+'px'});
			}
			if (menuLeft+pos.left+$('.hd-menu').width()+swidth > $(window).width()){
				var w =0-swidth;
				submenu.css ({'left':w+'px'});
			}
		}
	})
	//移动,隐藏子菜单
	dom.delegate('.hd-menu-item','mouseleave',function(){
		var submenu = $(this).find('.hd-menu');
		if (submenu.size()) {
			setTimeout ( function () {submenu.hide();},200);
		}
	});

})(jQuery);

define(function(require, exports){
	require.async('./contextmenu_hd.css');
	return $;
});
