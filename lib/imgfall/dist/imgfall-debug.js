/*
 * imgfall
 * https://github.com/daixianfeng/imgfall
 *
 * Copyright (c) 2013 daixianfeng
 * Licensed under the MIT license.
 */
define("imgfall/1.0.0/imgfall-debug", [ "./image-debug", "./panel-debug" ], function(require, exports) {
    var interImage = require("./image-debug");
    var interPanel = require("./panel-debug");
    var SwitchShow = Backbone.View.extend({
        initialize: function() {
            this.render();
        },
        render: function() {
            var template = _.template($("#switch-container").html());
            $(this.el).append(template);
        }
    });
    /**
	 *瀑布流方法，首先初始化，计算用到的数据，生成需要用到的html标签（如div），然后开始获取数据
	 *数据已json串方式传过来，解析成为数组，先按固定顺序插入到id为panel*的标签中，最后几条根据panel*的高度，插入到最短的panel*中去
	 *通过switch_div中的a标签内容来控制时候需要加载数据，防止在前一页数据没有加载成功的情况下还去请求下一页数据
	 *最后以stop方法取消绑定滚轮，结束瀑布流
	 */
    var Fall = Backbone.Model.extend({
        defaults: {
            id: "container",
            //使用fall的div
            dataUrl: "index.php",
            //获取数据的url
            panel_class: "panel",
            //容器样式类
            last_panel_class: "last_panel",
            //最后一列容器样式类
            per_page: 20,
            //每页的数据
            panel_count: 5,
            //列数
            end_distance: 20,
            //出发获取新数据时，滚轮距底部的距离
            page: 1,
            //从第几页开始获取
            del_show: false,
            //是否显示删除图标
            inner_contain: "dl",
            //容器图片容器标签，用于查找
            end_tips: ""
        },
        initialize: function() {
            //初始化，计算数据，生成div
            var self = this;
            self.set("per_panel", parseInt(self.attributes.per_page / (self.attributes.panel_count + 1)));
            self.set("fix_count", self.attributes.per_page - self.attributes.per_panel * self.attributes.panel_count);
            self.create_panel(self.attributes.panel_count);
            self.create_pause();
        },
        create_panel: function(n) {
            //生成id为panel*的div
            var self = this;
            var attr = {}, panel = {}, panel_div = {};
            for (var i = 0; i < n - 1; i++) {
                attr = {
                    id: "panel_" + i,
                    classStyle: self.attributes.panel_class
                };
                panel = new interPanel.Panel(attr);
                panel_div = new interPanel.PanelShow({
                    model: panel,
                    el: $("#" + self.attributes.id)
                });
            }
            attr = {
                id: "panel_" + i,
                classStyle: self.attributes.last_panel_class
            };
            panel = new interPanel.Panel(attr);
            panel_div = new interPanel.PanelShow({
                model: panel,
                el: $("#" + self.attributes.id)
            });
        },
        create_pause: function() {
            //生成控制请求数据的开关
            var self = this;
            panel_div = new SwitchShow({
                el: $("#" + self.attributes.id)
            });
        },
        load_image: function(image_array) {
            //向页面加载图片，分为顺序加载，和最后几条的适应加载
            var self = this;
            var image_flag = 0;
            if (!image_array) {
                this.stop();
                return true;
            }
            var image_length = image_array.length;
            if (image_length < self.attributes.per_page) {
                for (var j = 0; j < image_length; j++, image_flag++) {
                    var shortest = self.min_height();
                    self.into_panel(image_array[image_flag], shortest);
                }
                $("#next_page").html("没有了");
                if (this.attributes.end_tips instanceof jQuery) {
                    this.attributes.end_tips.html("没有更多啦");
                }
                self.stop();
            } else {
                for (var i = 0; i < self.attributes.per_panel && image_flag < image_length; i++) {
                    for (var k = 0; k < self.attributes.panel_count; k++, image_flag++) {
                        self.into_panel(image_array[image_flag], k);
                    }
                }
                for (var j = 0; j < self.attributes.fix_count; j++, image_flag++) {
                    var shortest = self.min_height();
                    self.into_panel(image_array[image_flag], shortest);
                }
                self.attributes.page++;
                self.pause_end();
            }
            setTimeout(function() {
                self.revise(self);
            }, 3e3);
        },
        into_panel: function(image, flag) {
            //将图片的div放入panel*中
            var self = this;
            var panel_id = "panel_" + flag;
            var attr = {
                id: image["id"],
                url: image["photo_url"],
                desc: image["desc"],
                comments: image["comment"]
            };
            var newImage = new interImage.Image(attr);
            interImage.imageCollection.add(newImage);
            var showImage = new interImage.ImageShow({
                model: newImage,
                el: $("#" + panel_id)
            });
        },
        calc_height: function(flag) {
            //计算某一个panel的高度
            var self = this;
            var panel_id = "panel_" + flag;
            var height = $("#" + panel_id).height();
            return height;
        },
        min_height: function() {
            //比较哪一个panel最短
            var self = this;
            var height_array = [];
            var min_index = 0;
            for (var i = 0; i < self.attributes.panel_count; i++) {
                height_array[i] = self.calc_height(i);
            }
            for (var i = 1; i < self.attributes.panel_count; i++) {
                min_index = height_array[min_index] > height_array[i] ? i : min_index;
            }
            return min_index;
        },
        max_height: function() {
            var self = this;
            var height_array = [];
            var max_index = 0;
            for (var i = 0; i < self.attributes.panel_count; i++) {
                height_array[i] = self.calc_height(i);
            }
            for (var i = 1; i < self.attributes.panel_count; i++) {
                max_index = height_array[max_index] <= height_array[i] ? i : max_index;
            }
            return max_index;
        },
        ajax_get_image: function(page_num) {
            //获得图片数据，成功后调用load_image方法加载图片
            var self = this;
            $.get(self.attributes.dataUrl, {
                page: page_num
            }, function(data) {
                self.load_image(data);
            }, "json");
        },
        start: function() {
            //开始瀑布流
            var self = this;
            //self.ajax_get_image(self.attributes.page);
            $(window).bind("scroll", function() {
                // 然后判断窗口的滚动条是否接近页面底部
                if ($(document).scrollTop() + $(window).height() > $(document).height() - self.attributes.end_distance && !self.isPause()) {}
            });
        },
        revise: function(self) {
            //最后修正
            var i = 0;
            while (i < self.attributes.per_page) {
                var highest_panel = self.max_height();
                var shortest_panel = self.min_height();
                var highest = $("#panel_" + highest_panel).height();
                var shortest = $("#panel_" + shortest_panel).height();
                var last_photo = $("#panel_" + highest_panel).find(self.attributes.inner_contain).last();
                var last_height = last_photo.height();
                var last_margin = parseInt(last_photo.css("margin-top")) + parseInt(last_photo.css("margin-bottom"));
                if (highest > shortest + last_height + last_margin) {
                    last_photo.appendTo("#panel_" + shortest_panel);
                    i++;
                } else {
                    break;
                }
            }
        },
        pause: function() {
            //控制开关，暂停请求数据
            $("#next_page").html("loading...");
            if (this.attributes.end_tips instanceof jQuery) {
                this.attributes.end_tips.html("正在加载...");
            }
        },
        pause_end: function() {
            //控制开关，重新开始可以请求数据
            $("#next_page").html("next page");
            if (this.attributes.end_tips instanceof jQuery) {
                this.attributes.end_tips.html("");
            }
        },
        isPause: function() {
            //是否在暂停请求数据的状态
            return $("#next_page").html() === "loading...";
        },
        stop: function() {
            //解除绑定，结束瀑布流
            $("#no_more").show();
            $(window).unbind("scroll");
        }
    });
    var imgFall = function(options) {
        var fall = new Fall(options);
        fall.start();
        return fall;
    };
    /*$(document).ready(function(){
		$('.fall').each(function(){
			ImgFall();
		});
	});*/
    exports.imgFall = imgFall;
});