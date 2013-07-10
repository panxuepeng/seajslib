/* 2013-04-11 */
(function($) {
    define("edittable/0.1.0/edittable-debug", [], function(require, exports) {
        return EditTable;
    });
    var reEmail = /^[a-z0-9]([a-z0-9]*[-_.]?[a-z0-9]+)*@([a-z0-9]*[-_]?[a-z0-9]+)+[\.][a-z]{2,3}([\.][a-z]{2,3})?$/i, win = $(window), dom = $(document), isEditing = false, // 是否正在编辑某个单元格
    // 默认配置
    defaults = {
        url: "",
        // 保存时，提交到那个url地址
        id: "id",
        // 唯一标识，用于保存的唯一条件
        // 实时编辑的类型，默认为单行文本框
        // 取值：text(默认) |int|qq|email|moble|date|textarea|selec
        type: "text",
        values: null,
        // 实时编辑类型为下拉列表框、复选框、单选框时的选项，目前仅支持下拉列表
        method: "GET",
        // 保存表单提交方式 GET(默认) POST
        dataType: "json",
        // 返回值的数据类型，json(默认) html text xml
        postData: {
            // 保存时需要提交的数据
            itemid: 0,
            // 用于构造SQL使用，大致如 "UPDATE table SET key='$value' WHERE id=$itemid"
            key: "",
            //key, 如 username
            value: "",
            // 修改后的值，以value参数发送
            ajax: 1,
            // 默认发送ajax=1参数，告诉服务器当前是 ajax 请求
            // 为了兼容目前已有的代码，如果不需要这些可以删除
            val: "",
            //key, 如 username
            formhash: "",
            modifysubmit: "yes",
            datatype: "json",
            in_ajax: 1
        },
        action: "dblclick",
        // dblclick(默认)：双击编辑， click：点击编辑
        showError: true,
        // 是否提示错误信息，默认alert方式弹出
        // 执行成功后的回调函数
        callback: function(data) {
            var msg = "";
            // 注意：typeof null == object
            if (data && typeof data === "object") {
                // 默认期望 
                // data: {status: 1, msg: ''}
                // data: {status: 0, msg: '参数错误'}
                if (typeof data.status != "undefined") {
                    if (data.status == 1) {} else {
                        // 失败，提示错误
                        if (data.msg) {
                            msg = data.msg;
                        }
                    }
                }
            }
            return msg;
        }
    };
    /*
例如：
option = {
	username: {url:"save.php", id:"uid", type:"text"},
	usertype: {url:"save.php", id:"uid", type:"select", values:{"1":"普通", "2":"中级", "3":"高级"}},
	comment: {url:"save.php", id:"uid", type:"textarea"}
}
*/
    $("head").append("<style>.edit-cell{background: url(http://www.huimg.cn/xiaobaike/images/public/girdbtbg.gif) no-repeat bottom left;}.edit-cell-save{}.edit-cell-success{}.edit-cell-error{}</style>");
    // 外部使用对象，jQuery 插件形式
    $.fn.extend({
        editTable: function(option) {
            EditTable($(this), option);
        }
    });
    $.editTable = function(table, option) {
        EditTable(table, option);
    };
    $.editTable.setDefaults = function(_defaults) {
        defaults = $.extend(defaults, _defaults);
    };
    $.editTable.setDefault = function(key, value) {
        defaults[key] = value;
    };
    // 初始化表格
    function initGird(table, option) {
        var name, cells, rows = table[0].rows, fistCells = rows[0].cells;
        for (var i = 1, len = rows.length; i < len; i++) {
            cells = rows[i].cells;
            for (var j = 0, len2 = cells.length; j < len2; j++) {
                name = $(fistCells[j]).attr("grid");
                // name 在option规则当中存在，才设置为可编辑
                if (name && option[name]) {
                    $(cells[j]).attr("grid", name);
                }
            }
        }
        table.find("td[grid]");
    }
    // 构造方法
    function EditTable(table, option) {
        initGird(table, option);
        table.find("td[grid]").addClass("edit-cell");
        if (defaults.action === "dblclick") {
            table.delegate("td[grid]", "mousedown", function(e) {});
        } else {
            defaults.action = "click";
        }
        table.delegate("td[grid]", defaults.action, function(e) {
            var td = $(this), name = td.attr("grid"), op = $.extend({}, defaults, option[name]);
            // 转为编辑状态
            var input = toInput(td, op);
            // 设置事件，修改后保存
            if (op.type === "select") {
                input.change(function() {
                    save(td, op, input, option);
                });
            }
            input.blur(function() {
                save(td, op, input, option);
            });
            return false;
        });
    }
    // 转为编辑状态
    function toInput(td, op) {
        var text = td.text(), width = "99", html = "";
        if (op.type === "select") {
            var o = op.values;
            html = '<select _value="' + text + '">';
            for (var key in o) {
                html += '<option value="' + key + '">' + o[key] + "</option>";
            }
            html += "</select>";
            setTimeout(function() {
                td.find("option").each(function() {
                    var o = $(this);
                    if (o.text() == text) {
                        o.attr("selected", true);
                    }
                });
            }, 0);
        } else if (/^(text|int|qq|email|moble|date)$/i.test(op.type)) {
            html = '<input style="width:' + width + '%;height:99%;margin:0;border:0;" type="text" value="' + text + '"  _value="' + text + '"/>';
        } else if (op.type === "textarea") {
            html = '<textarea style="width:' + width + '%;height:95%;margin:0;border:0;" _value="' + text + '">' + text + "</textarea>";
            setTimeout(function() {
                td.find("textarea").each(function() {
                    var o = $(this);
                    if (o.height() < 40) {
                        o.height(40);
                    }
                });
            }, 0);
        }
        td.html(html);
        return td.find(":input").focus();
    }
    function save(td, op, input, option) {
        var msg = check(td, op, input, option);
        if (msg) {
            alert(msg);
        } else {
            td.addClass("edit-cell-save");
            new Data(td, op, input, option).post();
        }
    }
    // 数据内容格式验证
    function check(td, op, input, option) {
        var value = $.trim(input.val());
        if (typeof op.check === "function") {
            return op.check(value);
        } else {
            if (/^int$/i.test(op.type) && !/^-?\d+$/i.test(value)) {
                return "类型错误，请输入数字";
            } else if (/^unsigned$/i.test(op.type) && !/^\d+$/i.test(value)) {
                return "类型错误，请输入数字";
            } else if (/^qq$/i.test(op.type) && !/^\d{5,13}$/i.test(value)) {
                return "类型错误，请输入QQ号";
            } else if (/^moble$/i.test(op.type) && !/^\d{11}$/i.test(value)) {
                return "类型错误，请输入手机号";
            } else if (/^date$/i.test(op.type) && isNaN(Date.parse(value))) {
                return "类型错误，请输入日期格式的内容";
            } else if (/^email$/i.test(op.type) && !reEmail.test(value)) {
                return "类型错误，请输入email格式的内容";
            }
        }
    }
    // 2012-01-30 潘雪鹏
    // 因保存操作涉及网络请求，有时可能会有几秒钟的延时
    // 为了保证用户可以同时编辑多个单元格后，分别执行保存操作
    // 顾采用类方式，保存时 new 一个实例出来即可
    // 编辑后保存
    function Data(td, op, input, option) {
        this.td = td;
        this.op = op;
        this.input = input;
        this.option = option;
    }
    Data.prototype.post = function() {
        var td = this.td, op = this.op, input = this.input, option = this.option;
        var value = $.trim(input.val()), selectValue = "", _value = input.attr("_value");
        if (input.is("select")) {
            selectValue = value;
            value = input.children("option[value=" + value + "]").text();
            input.unbind("change");
        }
        input.unbind("blur");
        td.text(value);
        if (value != _value) {
            // 发送ajax保存数据到服务器
            var url = op.url, name = td.attr("grid"), postData = op.postData, method = op.method || "GET", dataType = op.dataType || "json", o = td.parent().find("td[grid=" + op.id + "]");
            if (o.size()) {
                postData["itemid"] = o.text();
            } else {
                postData["itemid"] = td.parent().find("input[name=" + op.id + "]").val();
            }
            postData["key"] = name;
            postData["dataType"] = dataType;
            postData[name] = selectValue || value;
            postData["value"] = selectValue || value;
            postData["val"] = name;
            // 兼容以前，不需要的话可以删除
            postData["formhash"] = option.formhash;
            // 兼容以前，不需要的话可以删除
            // 浏览器地址栏，GET方式发送数据有最大长度限制
            // IE浏览器本身对地址栏URL长度有最大长度限制：2083字符
            // Firefox, Opera, Chrome ：4098
            if (encodeURI(value).length > 900) {
                method = "POST";
            }
            $.ajax({
                url: url,
                type: method,
                cache: false,
                data: postData,
                dataType: dataType,
                success: function(data) {
                    // 成功，执行回调函数
                    var msg = op.callback(data);
                    // 错误时返回错误信息，成功返回空
                    if (msg) {
                        td.addClass("edit-cell-error");
                        td.text(_value);
                        if (op.showError) {
                            alert(msg);
                        }
                    } else {
                        td.addClass("edit-cell-success");
                    }
                },
                error: function(xhr, status) {
                    // 失败了提示错误，并将原始值恢复到单元格
                    if (op.showError) {
                        if (status === "timeout") {
                            alert("提示：连接超时，保存失败");
                        } else if (status === "parsererror") {
                            alert("提示：JSON 解析错误，保存失败");
                        } else {
                            alert("提示：未知错误，保存失败");
                        }
                    }
                    // 恢复原值
                    td.text(_value);
                    td.addClass("edit-cell-error");
                }
            });
        }
    };
})(jQuery);