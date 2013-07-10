/* 2013-04-11 */
define("fixed/0.1.0/fixed-debug", [], function(require, exports) {
    function getScrollTop() {
        return document.documentElement.scrollTop || document.body.scrollTop;
    }
    function getScrollLeft() {
        return document.documentElement.scrollLeft || document.body.scrollLeft;
    }
    var $ = jQuery, IE6 = window.VBArray && !window.XMLHttpRequest, html = document.getElementsByTagName("html")[0], defaults = {
        // type:
        // ontop 固定在窗口顶部
        // onbottom 固定在窗口底部
        // onright 相对屏幕右下角定位
        // oncenter 相对页面中心定位
        type: "onright",
        right: 10,
        offset: false,
        bottom: 50
    }, fixedList = [];
    // 要想避免IE6下滚动时，固定元素发生抖动，
    // 给 html 或 body 设置背景静止定位即可。
    // 注意：IE6下如 body 已设置了背景静止定位，
    // 	     再给 html 标签设置会让 body 设置的背景静止失效
    if (IE6 && document.body.currentStyle.backgroundAttachment !== "fixed") {
        html.style.backgroundImage = "url(about:blank)";
        html.style.backgroundAttachment = "fixed";
    }
    $.fn.fixed = function() {
        this.each(function(index, el) {
            var option = $(el).data();
            option = $.extend({}, defaults, option);
            option.element = el;
            option.type = option.type.toLowerCase();
            fixedList.push(option);
            position.fixed(option);
        });
        return this;
    };
    var position = {
        fixed: IE6 ? function(option) {
            var elem = option.element, style = elem.style, top = 0;
            if (IE6Postion[option.type]) {
                this.absolute(elem);
                top = IE6Postion[option.type](option);
                style.setExpression("top", "eval(document.documentElement.scrollTop+" + top + ')+"px"');
            }
        } : function(option) {
            var elem = option.element, o = $(elem), css = {
                position: "fixed"
            };
            switch (option.type) {
              case "ontop":
                css.top = 0;
                break;

              case "onbottom":
                css.bottom = 0;
                break;

              case "onright":
                css.right = o.data("right") || 0;
                css.top = "auto";
                css.bottom = o.data("bottom") || 0;
                break;

              case "oncenter":
                css.top = "auto";
                css.bottom = o.data("bottom") || 0;
                css.left = "50%";
                var winWidth = $(window).width(), domWidth = $(document).width(), offset = o.data("offset") || 0;
                // 当出现横向滚动条时，需要修正一下offset偏移量
                if (domWidth - winWidth > 25) {
                    offset = offset + Math.round((domWidth - winWidth) / 2);
                    // 2013-03-28 潘雪鹏
                    // 测试中发现会有小量误差，
                    // 包括ie系列/Chrome/Firefox等浏览器
                    // 所以再修正一下。
                    // 原因尚不明确。
                    offset += 4;
                }
                css.marginLeft = offset;
                break;

              default:
                break;
            }
            o.css(css);
        },
        absolute: IE6 ? function(elem) {
            var style = elem.style;
            style.position = "absolute";
            style.removeExpression("top");
            style.removeExpression("left");
        } : function(elem) {
            elem.style.position = "absolute";
        }
    };
    // 下面几个方法仅针对ie6
    var IE6Postion = {
        // 相对于浏览器窗口右下角定位
        onright: function(option) {
            var elem = option.element, o = $(elem), elemHeight = o.height(), winHeight = $(window).height(), right = o.data("right") || 0, bottom = o.data("bottom") || 0;
            var left = $(window).width() - right - o.outerWidth();
            // setExpression 设置 right 貌似不管用，left 好使
            // 所有需要将right转换为left
            elem.style.setExpression("left", "eval(document.documentElement.scrollLeft+" + left + ')+"px"');
            return winHeight - bottom - elemHeight;
        },
        // 相对文档中心便宜定位
        oncenter: function(option) {
            var elem = option.element, o = $(elem), elemHeight = o.height(), winHeight = $(window).height(), winWidth = $(window).width(), domWidth = $(document).width(), offset = o.data("offset") || 0, bottom = o.data("bottom") || 0;
            // 当出现横向滚动条时，需要修正一下offset偏移量
            if (domWidth - winWidth > 25) {
                offset = offset + (domWidth - winWidth) / 2;
            }
            o.css({
                right: "auto",
                left: "50%",
                "margin-left": offset
            });
            return winHeight - bottom - elemHeight;
        },
        // 固定在浏览器窗口顶部
        ontop: function(option) {
            return 0;
        },
        // 固定在浏览器窗口底部
        onbottom: function(option) {
            return $(window).height() - $(option.element).outerHeight();
        }
    };
    exports.fixed = function() {
        $("[data-toggle=fixed]").fixed();
    };
    setTimeout(function() {
        exports.fixed();
    }, 0);
    // 为了避免页面打开时可能触发 resize 事件，
    // 顾将 resize 事件绑定时机向后延迟一下。
    setTimeout(function() {
        $(window).bind("scroll.fixed", function() {}).bind("resize.fixed", function() {
            //onresize();
            $.each(fixedList, function(i, option) {
                position.fixed(option);
            });
        });
    }, 100);
});