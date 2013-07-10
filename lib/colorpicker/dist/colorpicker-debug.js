/*
 * colorpicker
 * https://github.com/Administrator/colorpicker
 *
 * Copyright (c) 2013
 * Licensed under the MIT license.
 */
define("colorpicker/0.1.0/colorpicker-debug", [], function(require, exports) {
    require.async("./colorpicker-debug.css");
});

(function($) {
    function getColorPicker(noColorText) {
        var COLORS = ("ffffff,000000,eeece1,1f497d,4f81bd,c0504d,9bbb59,8064a2,4bacc6,f79646," + "f2f2f2,7f7f7f,ddd9c3,c6d9f0,dbe5f1,f2dcdb,ebf1dd,e5e0ec,dbeef3,fdeada," + "d8d8d8,595959,c4bd97,8db3e2,b8cce4,e5b9b7,d7e3bc,ccc1d9,b7dde8,fbd5b5," + "bfbfbf,3f3f3f,938953,548dd4,95b3d7,d99694,c3d69b,b2a2c7,92cddc,fac08f," + "a5a5a5,262626,494429,17365d,366092,953734,76923c,5f497a,31859b,e36c09," + "7f7f7f,0c0c0c,1d1b10,0f243e,244061,632423,4f6128,3f3151,205867,974806," + "c00000,ff0000,ffc000,ffff00,92d050,00b050,00b0f0,0070c0,002060,7030a0").split(",");
        var html = '<div id="edui-colorpicker" class="edui-colorpicker" style="display:none;background-color:#FFF;position:absolute;">' + '<div class="edui-colorpicker-topbar edui-clearfix">' + '<div unselectable="on" id="##_preview" class="edui-colorpicker-preview"></div>' + '<div unselectable="on" class="edui-colorpicker-nocolor" >' + noColorText + "</div>" + "</div>" + '<table  class="edui-box" style="border-collapse: collapse;" cellspacing="0" cellpadding="0">' + '<tr style="border-bottom: 1px solid #ddd;font-size: 13px;line-height: 25px;color:#39C;padding-top: 2px"><td colspan="10">' + "主题颜色" + "</td> </tr>" + '<tr class="edui-colorpicker-tablefirstrow" >';
        for (var i = 0; i < COLORS.length; i++) {
            if (i && i % 10 === 0) {
                html += "</tr>" + (i == 60 ? '<tr style="border-bottom: 1px solid #ddd;font-size: 13px;line-height: 25px;color:#39C;"><td colspan="10">' + "标准颜色" + "</td></tr>" : "") + "<tr" + (i == 60 ? ' class="edui-colorpicker-tablefirstrow"' : "") + ">";
            }
            html += i < 70 ? '<td style="padding: 0 2px;"><a hidefocus  title="' + COLORS[i] + '"  href="javascript:" class="edui-box edui-colorpicker-colorcell"' + ' value="#' + COLORS[i] + '"' + ' style="background-color:#' + COLORS[i] + ";border:solid #ccc;" + (i < 10 || i >= 60 ? "border-width:1px;" : i >= 10 && i < 20 ? "border-width:1px 1px 0 1px;" : "border-width:0 1px 0 1px;") + '"' + "></a></td>" : "";
        }
        html += "</tr></table></div>";
        return html;
    }
    var dom = $(document), colorPanel = getColorPicker("清除颜色"), targetInput = null;
    $("body").append(colorPanel);
    // setTimeout 是为了防止ie6下刚添加到页面的元素，
    // 下面紧接着使用，可能会找不到的问题
    setTimeout(function() {
        dom.delegate(".edui-colorpicker-colorcell", "click", function() {
            targetInput.val($(this).attr("value"));
        });
        var panel = $("#edui-colorpicker");
        var preview = panel.find(".edui-colorpicker-preview");
        dom.delegate(".edui-colorpicker-colorcell", "mouseenter", function() {
            var o = $(this);
            preview.css({
                "background-color": o.attr("value")
            });
        });
        dom.delegate(".edui-colorpicker-colorcell", "mouseleave", function() {
            preview.css({
                "background-color": ""
            });
        });
        dom.delegate("input[data-toggle=colorpicker]", "click.colorpicker.data-api", function(e) {
            var self = $(e.target);
            targetInput = self;
            var pos = self.offset();
            panel.css({
                top: pos.top + self.outerHeight() + "px",
                left: pos.left + "px"
            }).show();
            dom.bind("click.close-colorpicker", function() {
                $("#edui-colorpicker").hide();
                dom.unbind("click.close-colorpicker");
            });
        });
    }, 0);
})(jQuery);