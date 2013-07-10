/* 2013-04-11 */
(function($) {
    var defaults = {
        picArr: "#photo li",
        txtArr: "#title li",
        navArr: "#nav span",
        current: "current",
        timeout: 2e3,
        speed: 500,
        box: "#photo",
        playtype: "display"
    };
    var Slide = function(opt) {
        this.config = o = $.extend({}, defaults, opt);
        this.current = 0;
        this.photoArr = $(o.picArr);
        this.navArr = $(o.navArr);
        this.titleArr = $(o.txtArr);
        this.count = this.photoArr.size();
        this.zindex = this.count + 2;
        this.width = this.photoArr.width();
        this.height = this.photoArr.height();
        this.InterVal = null;
        this.init(o);
    };
    Slide.prototype = {
        init: function(opt) {
            var self = this, o = self.config, navStr = "";
            for (var i = 1; i <= self.count; i++) {
                var cur = i == 1 ? 'class="' + o.current + '"' : "";
                navStr += "<span " + cur + ">" + i + "</span>";
            }
            if (o.playtype == "sideslip") {
                self.photoArr.each(function(i) {
                    $(self.photoArr[i]).css("z-index", self.count - 1 - i).show();
                });
            }
            self.navArr.html(navStr);
            self.photoArr.hover(//鼠标移动在图片上，暂时循环
            function() {
                clearInterval(self.InterVal);
            }, //鼠标移走，继续循环
            function() {
                self.InterVal = setInterval(function() {
                    self.play(o.playtype);
                }, o.timeout);
            });
            self.navArr.find("span").hover(//鼠标移动到导航上，切换到当前图片
            function() {
                self.current = $(this).index() - 1;
                self.play(o.playtype);
                clearInterval(self.InterVal);
            }, //鼠标移走，从当前位置继续开始
            function() {
                self.InterVal = setInterval(function() {
                    self.play(o.playtype);
                }, o.timeout);
            });
            //定义器设置，让每2秒执行一次播放函数
            self.InterVal = setInterval(function() {
                self.play(o.playtype);
            }, o.timeout);
        },
        play: function(type) {
            if (!this[type]) {
                type = "display";
            }
            this[type]();
        },
        //直接显隐效果
        display: function() {
            var self = this, o = self.config;
            self.current++;
            if (self.current == self.count) {
                self.current = 0;
            }
            self.photoArr.hide().eq(self.current).show();
            self.navArr.find("span").removeClass(o.current).eq(self.current).addClass(o.current);
            self.titleArr.hide().eq(self.current).show();
        },
        //滑动效果
        slide: function() {
            var self = this, o = self.config, width = self.photoArr.outerWidth(), height = self.photoArr.outerHeight();
            self.current++;
            if (self.current == self.count) {
                self.current = 0;
            }
            if (o.direction == "top") {
                $(o.box).animate({
                    scrollTop: self.current * self.height
                }, o.speed);
            } else {
                $(o.box).animate({
                    scrollLeft: self.current * self.width
                }, o.speed);
            }
            self.navArr.find("span").removeClass(o.current).eq(self.current).addClass(o.current);
            //self.titleArr.hide().eq(self.current).show();
            if (o.direction == "top") {
                $(self.photoArr.parent()).height(self.count * self.height);
            } else {
                $(self.photoArr.parent()).width(self.count * self.width);
            }
        },
        //渐变效果
        shadow: function() {
            var self = this, o = self.config;
            self.photoArr.each(function(i) {
                $(self.photoArr[i]).css("z-index", self.count - i).show();
            });
            $(self.photoArr[self.current]).css("z-index", self.zindex).fadeOut(o.speed);
            self.current++;
            if (self.current == self.count) {
                self.current = 0;
            }
            $(self.photoArr[self.current]).css("z-index", self.zindex - 1).show();
            self.navArr.find("span").removeClass(o.current).eq(self.current).addClass(o.current);
            self.zindex = self.zindex + 1;
        },
        //侧滑效果
        sideslip: function() {
            var self = this, o = self.config;
            self.photoArr.css({
                position: "absolute",
                top: 0,
                left: 0,
                overflow: "hidden",
                width: self.width,
                height: self.height
            });
            //重设略图zIndex
            self.resetIndex(self.current);
            //当前图片滑走
            $(self.photoArr[self.current]).animate({
                left: -self.width
            }, self.timeout);
            self.current++;
            if (self.current == self.count) {
                self.current = 0;
            }
            $(self.photoArr[self.current]).animate({
                zIndex: self.count - 2
            }, self.timeout);
            self.navArr.find("span").removeClass(o.current).eq(self.current).addClass(o.current);
            self.zindex = self.zindex + 1;
        },
        resetIndex: function(cur) {
            //alert (cur);
            var self = this, n = self.count - 1;
            $(self.photoArr).each(function(i) {
                n--;
                if (i < cur) {
                    n = self.current - 1 - i;
                }
                if (i == cur) {
                    n = self.count - 1;
                }
                $(self.photoArr[i]).css("z-index", n);
            });
        }
    };
    $.fn.slide = function(opt) {
        var self = $(this), def = self.data();
        if (self.find("li").size()) {
            def["picArr"] = self.find("li");
        } else {
            def["picArr"] = self.find(".item");
        }
        def["box"] = self.find(".box");
        def["navArr"] = self.find(".nav");
        config = def || {};
        new Slide(config);
    };
})(jQuery);

define("slide/0.1.0/slide-debug", [], function(require, exports) {
    return $;
});