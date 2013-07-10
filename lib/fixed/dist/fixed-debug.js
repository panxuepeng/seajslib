/**
 * fixed
 * 三种情况；
 * 1. 根据窗口定位工具条，常见于右下角回顶部等按钮
 * 2. 根据页面偏移位置定位工具条，常见于文章目录导航等按钮
 * 3. 页面顶部或底部浮动工具条
 * 
 */
define("fixed/0.4.0/fixed-debug", [], function(require, exports) {
    function getScrollTop() {
        return document.documentElement.scrollTop || document.body.scrollTop;
    }
    function getScrollLeft() {
        return document.documentElement.scrollLeft || document.body.scrollLeft;
    }
    var $ = jQuery, IE6 = window.VBArray && !window.XMLHttpRequest, defaults = {
        // type:
        // ontop 固定在窗口顶部
        // onbottom 固定在窗口底部
        // onright 相对屏幕右下角定位
        // oncenter 相对页面中心定位
        type: "onright",
        offset: 0,
        right: 0,
        top: "auto",
        bottom: 0,
        trigger: "auto"
    }, fixedList = [];
    function _ie6Init() {
        // 要想避免IE6下滚动时，固定(通过css表达式)元素发生抖动，
        // 给 html 或 body 设置背景静止定位即可。
        // 注意：IE6下如 body 已设置了背景静止定位，
        // 	     再给 html 标签设置会让 body 设置的背景静止失效
        if (IE6 && document.body.currentStyle.backgroundAttachment !== "fixed") {
            var _style = $("html")[0].style;
            _style.backgroundImage = "url(about:blank)";
            _style.backgroundAttachment = "fixed";
        }
    }
    _ie6Init();
    $.fn.fixed = function() {
        this.each(function(index, el) {
            var o = $(el), option = o.data();
            // 注意 .data() 需要jQuery1.4.3+
            option = $.extend({}, defaults, option);
            option.element = el;
            option._css = {
                position: o.css("position") || "static",
                left: o.css("left") || "auto",
                right: o.css("right") || "auto",
                top: o.css("top") || "auto",
                marginLeft: o.css("marginLeft") || "0",
                offsetTop: o.offset().top
            };
            option.type = option.type.toLowerCase();
            fixedList.push(option);
            Tool.fixed(option);
        });
        return this;
    };
    var Tool = {
        fixed: IE6 ? function(option) {
            var elem = option.element, style = elem.style, top = 0;
            if (IE6Postion[option.type]) {
                if (option.trigger === "auto") {
                    // absolute() 要在 IE6Postion[option.type] 方法之前执行
                    this.absolute(elem);
                    top = IE6Postion[option.type](option);
                    style.setExpression("top", "eval(document.documentElement.scrollTop+" + top + ')+"px"');
                } else {
                    top = IE6Postion[option.type](option);
                    option._top = top;
                    // 如果已经是浮动状态
                    if (option._isFlow) {
                        style.removeExpression("top");
                        style.setExpression("top", "eval(document.documentElement.scrollTop+" + top + ')+"px"');
                    }
                }
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
                // top 和 bottom 同时出现时，top优先级高
                css.top = o.data("top") || "auto";
                if (css.top === "auto") {
                    css.bottom = o.data("bottom") || 0;
                }
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
                offset -= getScrollLeft();
                css.marginLeft = offset;
                option.offset = offset;
                break;

              default:
                break;
            }
            option.css = css;
            if (option.trigger === "auto") {
                o.css(css);
            } else {
                // 如果已经是浮动状态
                if (option._isFlow) {
                    o.css(css);
                }
            }
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
            var elem = option.element, o = $(elem), elemHeight = o.height(), winHeight = $(window).height(), right = o.data("right-ie6") || o.data("right") || 0, bottom = o.data("bottom-ie6") || o.data("bottom") || 0;
            // setExpression 设置 right 貌似不管用，left 好使
            // 所有需要将right转换为left
            if (option.trigger === "auto" || option._isFlow) {
                var left = $(window).width() - right - o.outerWidth();
                elem.style.removeExpression("left");
                elem.style.setExpression("left", "eval(document.documentElement.scrollLeft+" + left + ')+"px"');
            }
            return winHeight - bottom - elemHeight;
        },
        // 相对文档中心便宜定位
        oncenter: function(option) {
            var elem = option.element, o = $(elem), elemHeight = o.height(), winHeight = $(window).height(), winWidth = $(window).width(), domWidth = $(document).width(), offset = o.data("offset-ie6") || o.data("offset") || 0, top = o.data("top-ie6") || o.data("top") || "auto", bottom = o.data("bottom-ie6") || o.data("bottom") || 0;
            // 当出现横向滚动条时，需要修正一下offset偏移量
            if (domWidth - winWidth > 25) {
                //offset = offset + (domWidth - winWidth)/2;
                offset = offset + (domWidth - winWidth) / 2;
            }
            if (option.trigger === "auto" || option._isFlow) {
                o.css({
                    right: "auto",
                    left: "50%",
                    "margin-left": offset
                });
            }
            return top === "auto" ? winHeight - bottom - elemHeight : top;
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
        function onscrollCheck() {
            // 处理当滚动高度达到一定值之后才出发浮动的情况
            $.each(fixedList, function(i, option) {
                var o = $(option.element), style = option.element.style;
                if (option.trigger !== "auto") {
                    if (getScrollTop() + option.top >= option._css.offsetTop) {
                        // 浮动
                        if (!option._isFlow) {
                            // 避免浮动状态下代码重复执行
                            if (IE6) {
                                style.position = "absolute";
                                style.removeExpression("top");
                                style.setExpression("top", "eval(document.documentElement.scrollTop+" + option._top + ')+"px"');
                            } else {
                                o.css(option.css);
                            }
                            option._isFlow = true;
                            // 同时触发开始浮动事件
                            o.trigger("startfloat");
                        } else {
                            o.trigger("floating");
                        }
                    } else {
                        if (option._isFlow) {
                            // 还原
                            IE6 && style.removeExpression("top");
                            o.css(option._css);
                            option._isFlow = false;
                            // 同时触发取消浮动事件
                            o.trigger("endfloat");
                            // 重新计算一下浮动临界值
                            // 以尽量避免由于页面动态变化导致定位不准
                            option._css.offsetTop = o.offset().top;
                        }
                    }
                } else {
                    o.trigger("floating");
                }
            });
        }
        var _scrollLeft = 0, timer2 = 0;
        $(window).bind("scroll.fixed", function() {
            onscrollCheck();
            clearTimeout(timer2);
            timer2 = setTimeout(function() {
                var sl = getScrollLeft();
                if (sl !== _scrollLeft) {
                    // 横向滚动
                    _scrollLeft = getScrollLeft();
                    $.each(fixedList, function(i, option) {
                        if (option.type === "oncenter") {
                            var o = $(option.element);
                            // 横向滚动时，动态修正marginLeft的值
                            option.css.marginLeft = option.offset - sl;
                            o.css(option.css);
                        }
                    });
                }
            }, 200);
        });
        var timer = 0;
        $(window).bind("resize.fixed", function() {
            if (IE6) {
                clearTimeout(timer);
                timer = setTimeout(function() {
                    $.each(fixedList, function(i, option) {
                        Tool.fixed(option);
                    });
                }, 0);
            } else {
                $.each(fixedList, function(i, option) {
                    Tool.fixed(option);
                });
            }
        });
        // 初始化检查一下当前状态
        onscrollCheck();
    }, 100);
});