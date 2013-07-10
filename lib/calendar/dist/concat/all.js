/* 2013-04-11 */
define("calendar/1.0.0/calendar", [], function(require, exports, module) {
    $(document).delegate("input[data-toggle=calendar]", "click.calendar.data-api", function(e) {
        var d = new Date(), data = $(this).data(), // 主要data获取的参数名将自动转为小写
        // 如 data-beginYear，得到的key其实是beginyear
        beginyear = data.beginyear || 2e3, endyear = data.endyear || d.getFullYear();
        new Calendar(beginyear, endyear, 0, "-", "yyyy-MM-dd", "ymd").show(e.target);
    });
    /**
 * Calendar
 * @param   beginYear           1990
 * @param   endYear             2010
 * @param   language            0(zh_cn)|1(en_us)|2(en_en)|3(zh_tw)|4(jp)
 * @param   patternDelimiter    "-"
 * @param   date2StringPattern  "yyyy-MM-dd"
 * @param   string2DatePattern  "ymd"
 * @version V20060401
 * @version V20061217
 * @version V20080809 add to google project
 * @version V20081226 add language support for japanese 
 * @version V20090104 add fix some bugs in help.html
					  use style.display replace the style.visibility
					  some enhancements and changes
 * @author  KimSoft (jinqinghua [at] gmail.com)
 */
    function Calendar(beginYear, endYear, language, patternDelimiter, date2StringPattern, string2DatePattern) {
        this.beginYear = beginYear || 1990;
        this.endYear = endYear || 2020;
        this.language = language || 0;
        this.patternDelimiter = patternDelimiter || "-";
        this.date2StringPattern = date2StringPattern || Calendar.language["date2StringPattern"][this.language].replace(/\-/g, this.patternDelimiter);
        if (string2DatePattern) {
            string2DatePattern = string2DatePattern.toLowerCase();
        }
        this.string2DatePattern = string2DatePattern || Calendar.language["string2DatePattern"][this.language];
        this.dateControl = null;
        this.panel = $("#calendarPanel")[0];
        this.iframe = window.frames["calendarIframe"];
        this.form = null;
        this.date = new Date();
        this.year = this.date.getFullYear();
        this.month = this.date.getMonth();
        this.colors = {
            bg_cur_day: "#00CC33",
            bg_over: "#EFEFEF",
            bg_out: "#FFCC00"
        };
    }
    Calendar.language = {
        year: [ "年", "", "", "年", "年" ],
        months: [ [ "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月" ], [ "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC" ], [ "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC" ], [ "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月" ], [ "一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月" ] ],
        weeks: [ [ "日", "一", "二", "三", "四", "五", "六" ], [ "Sun", "Mon", "Tur", "Wed", "Thu", "Fri", "Sat" ], [ "Sun", "Mon", "Tur", "Wed", "Thu", "Fri", "Sat" ], [ "日", "一", "二", "三", "四", "五", "六" ], [ "日", "月", "火", "水", "木", "金", "土" ] ],
        clear: [ "清空", "Clear", "Clear", "清空", "削除" ],
        today: [ "今天", "Today", "Today", "今天", "今日" ],
        close: [ "关闭", "Close", "Close", "關閉", "戻る" ],
        date2StringPattern: [ "yyyy-MM-dd", "yyyy-MM-dd", "yyyy-MM-dd", "yyyy-MM-dd", "yyyy-MM-dd" ],
        string2DatePattern: [ "ymd", "ymd", "ymd", "ymd", "ymd" ]
    };
    Calendar.prototype.draw = function() {
        calendar = this;
        var _cs = [];
        _cs[_cs.length] = '<form id="__calendarForm" name="__calendarForm" method="post">';
        _cs[_cs.length] = '<table id="__calendarTable" width="100%" border="0" cellpadding="3" cellspacing="1" align="center">';
        _cs[_cs.length] = " <tr>";
        _cs[_cs.length] = '  <th><input class="l" name="goPrevMonthButton" type="button" id="goPrevMonthButton" value="&lt;" /></th>';
        _cs[_cs.length] = '  <th colspan="5"><select class="year" name="yearSelect" id="yearSelect"></select><select class="month" name="monthSelect" id="monthSelect"></select></th>';
        _cs[_cs.length] = '  <th><input class="r" name="goNextMonthButton" type="button" id="goNextMonthButton" value="&gt;" /></th>';
        _cs[_cs.length] = " </tr>";
        _cs[_cs.length] = " <tr>";
        for (var i = 0; i < 7; i++) {
            _cs[_cs.length] = '<th class="theader">';
            _cs[_cs.length] = Calendar.language["weeks"][this.language][i];
            _cs[_cs.length] = "</th>";
        }
        _cs[_cs.length] = "</tr>";
        for (var i = 0; i < 6; i++) {
            _cs[_cs.length] = '<tr align="center">';
            for (var j = 0; j < 7; j++) {
                switch (j) {
                  case 0:
                    _cs[_cs.length] = '<td class="sun">&nbsp;</td>';
                    break;

                  case 6:
                    _cs[_cs.length] = '<td class="sat">&nbsp;</td>';
                    break;

                  default:
                    _cs[_cs.length] = '<td class="normal">&nbsp;</td>';
                    break;
                }
            }
            _cs[_cs.length] = "</tr>";
        }
        _cs[_cs.length] = " <tr>";
        _cs[_cs.length] = '  <th colspan="2"><input type="button" class="b" name="clearButton" id="clearButton" /></th>';
        _cs[_cs.length] = '  <th colspan="3"><input type="button" class="b" name="selectTodayButton" id="selectTodayButton" /></th>';
        _cs[_cs.length] = '  <th colspan="2"><input type="button" class="b" name="closeButton" id="closeButton" /></th>';
        _cs[_cs.length] = " </tr>";
        _cs[_cs.length] = "</table>";
        _cs[_cs.length] = "</form>";
        this.iframe.document.body.innerHTML = _cs.join("");
        this.form = this.iframe.document.forms["__calendarForm"];
        this.form.clearButton.value = Calendar.language["clear"][this.language];
        this.form.selectTodayButton.value = Calendar.language["today"][this.language];
        this.form.closeButton.value = Calendar.language["close"][this.language];
        this.form.goPrevMonthButton.onclick = function() {
            calendar.goPrevMonth(this);
        };
        this.form.goNextMonthButton.onclick = function() {
            calendar.goNextMonth(this);
        };
        this.form.yearSelect.onchange = function() {
            calendar.update(this);
        };
        this.form.monthSelect.onchange = function() {
            calendar.update(this);
        };
        this.form.clearButton.onclick = function() {
            calendar.dateControl.value = "";
            calendar.hide();
        };
        this.form.closeButton.onclick = function() {
            calendar.hide();
        };
        this.form.selectTodayButton.onclick = function() {
            var today = new Date();
            calendar.date = today;
            calendar.year = today.getFullYear();
            calendar.month = today.getMonth();
            calendar.dateControl.value = today.format(calendar.date2StringPattern);
            calendar.hide();
        };
    };
    Calendar.prototype.bindYear = function() {
        var ys = this.form.yearSelect;
        ys.length = 0;
        for (var i = this.beginYear; i <= this.endYear; i++) {
            ys.options[ys.length] = new Option(i + Calendar.language["year"][this.language], i);
        }
    };
    Calendar.prototype.bindMonth = function() {
        var ms = this.form.monthSelect;
        ms.length = 0;
        for (var i = 0; i < 12; i++) {
            ms.options[ms.length] = new Option(Calendar.language["months"][this.language][i], i);
        }
    };
    Calendar.prototype.goPrevMonth = function(e) {
        if (this.year == this.beginYear && this.month == 0) {
            return;
        }
        this.month--;
        if (this.month == -1) {
            this.year--;
            this.month = 11;
        }
        this.date = new Date(this.year, this.month, 1);
        this.changeSelect();
        this.bindData();
    };
    Calendar.prototype.goNextMonth = function(e) {
        if (this.year == this.endYear && this.month == 11) {
            return;
        }
        this.month++;
        if (this.month == 12) {
            this.year++;
            this.month = 0;
        }
        this.date = new Date(this.year, this.month, 1);
        this.changeSelect();
        this.bindData();
    };
    Calendar.prototype.changeSelect = function() {
        var ys = this.form.yearSelect;
        var ms = this.form.monthSelect;
        for (var i = 0; i < ys.length; i++) {
            if (ys.options[i].value == this.date.getFullYear()) {
                ys[i].selected = true;
                break;
            }
        }
        for (var i = 0; i < ms.length; i++) {
            if (ms.options[i].value == this.date.getMonth()) {
                ms[i].selected = true;
                break;
            }
        }
    };
    Calendar.prototype.update = function(e) {
        this.year = e.form.yearSelect.options[e.form.yearSelect.selectedIndex].value;
        this.month = e.form.monthSelect.options[e.form.monthSelect.selectedIndex].value;
        this.date = new Date(this.year, this.month, 1);
        this.changeSelect();
        this.bindData();
    };
    Calendar.prototype.bindData = function() {
        var calendar = this;
        var dateArray = this.getMonthViewDateArray(this.date.getFullYear(), this.date.getMonth());
        var tds = this.getElementsByTagName("td", this.getElementById("__calendarTable", this.iframe.document));
        for (var i = 0; i < tds.length; i++) {
            tds[i].style.backgroundColor = calendar.colors["bg_over"];
            tds[i].onclick = null;
            tds[i].onmouseover = null;
            tds[i].onmouseout = null;
            tds[i].innerHTML = dateArray[i] || "&nbsp;";
            if (i > dateArray.length - 1) continue;
            if (dateArray[i]) {
                tds[i].onclick = function() {
                    if (calendar.dateControl) {
                        calendar.dateControl.value = new Date(calendar.date.getFullYear(), calendar.date.getMonth(), this.innerHTML).format(calendar.date2StringPattern);
                    }
                    calendar.hide();
                };
                tds[i].onmouseover = function() {
                    this.style.backgroundColor = calendar.colors["bg_out"];
                };
                tds[i].onmouseout = function() {
                    this.style.backgroundColor = calendar.colors["bg_over"];
                };
                var today = new Date();
                if (today.getFullYear() == calendar.date.getFullYear()) {
                    if (today.getMonth() == calendar.date.getMonth()) {
                        if (today.getDate() == dateArray[i]) {
                            tds[i].style.backgroundColor = calendar.colors["bg_cur_day"];
                            tds[i].onmouseover = function() {
                                this.style.backgroundColor = calendar.colors["bg_out"];
                            };
                            tds[i].onmouseout = function() {
                                this.style.backgroundColor = calendar.colors["bg_cur_day"];
                            };
                        }
                    }
                }
            }
        }
    };
    Calendar.prototype.getMonthViewDateArray = function(y, m) {
        var dateArray = new Array(42);
        var dayOfFirstDate = new Date(y, m, 1).getDay();
        var dateCountOfMonth = new Date(y, m + 1, 0).getDate();
        for (var i = 0; i < dateCountOfMonth; i++) {
            dateArray[i + dayOfFirstDate] = i + 1;
        }
        return dateArray;
    };
    Calendar.prototype.show = function(dateControl, popuControl) {
        if (this.panel.style.display == "block") {
            this.panel.style.display = "none";
        }
        if (!dateControl) {
            throw new Error("arguments[0] is necessary!");
        }
        this.dateControl = dateControl;
        popuControl = popuControl || dateControl;
        this.draw();
        this.bindYear();
        this.bindMonth();
        if (dateControl.value.length > 0) {
            this.date = new Date(dateControl.value.toDate(this.patternDelimiter, this.string2DatePattern));
            this.year = this.date.getFullYear();
            this.month = this.date.getMonth();
        }
        this.changeSelect();
        this.bindData();
        var xy = this.getAbsPoint(popuControl);
        this.panel.style.left = xy.x + "px";
        this.panel.style.top = xy.y + dateControl.offsetHeight + "px";
        this.panel.style.display = "block";
    };
    Calendar.prototype.hide = function() {
        this.panel.style.display = "none";
    };
    Calendar.prototype.getElementById = function(id, object) {
        object = object || document;
        return document.getElementById ? object.getElementById(id) : document.all(id);
    };
    Calendar.prototype.getElementsByTagName = function(tagName, object) {
        object = object || document;
        return document.getElementsByTagName ? object.getElementsByTagName(tagName) : document.all.tags(tagName);
    };
    Calendar.prototype.getAbsPoint = function(e) {
        var x = e.offsetLeft;
        var y = e.offsetTop;
        while (e = e.offsetParent) {
            x += e.offsetLeft;
            y += e.offsetTop;
        }
        return {
            x: x,
            y: y
        };
    };
    /**
 * @param   d the delimiter
 * @param   p the pattern of your date
 */
    Date.prototype.format = function(style) {
        var o = {
            "M+": this.getMonth() + 1,
            //month
            "d+": this.getDate(),
            //day
            "h+": this.getHours(),
            //hour
            "m+": this.getMinutes(),
            //minute
            "s+": this.getSeconds(),
            //second
            "w+": "日一二三四五六".charAt(this.getDay()),
            //week
            "q+": Math.floor((this.getMonth() + 3) / 3),
            //quarter
            S: this.getMilliseconds()
        };
        if (/(y+)/.test(style)) {
            style = style.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        }
        for (var k in o) {
            if (new RegExp("(" + k + ")").test(style)) {
                style = style.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
            }
        }
        return style;
    };
    /**
 * @param d the delimiter
 * @param p the pattern of your date
 * @version build 2012.01.36
 */
    String.prototype.toDate = function(delimiter, pattern) {
        delimiter = delimiter || "-";
        pattern = pattern || "ymd";
        var a = this.split(delimiter);
        var y = parseInt(a[pattern.indexOf("y")], 10);
        //remember to change this next century ;)
        if (y.toString().length <= 2) y += 2e3;
        if (isNaN(y)) y = new Date().getFullYear();
        var m = parseInt(a[pattern.indexOf("m")], 10) - 1;
        var d = parseInt(a[pattern.indexOf("d")], 10);
        if (isNaN(d)) d = 1;
        return new Date(y, m, d);
    };
    var calendar;
    function initCalendar() {
        var html = '<div id="calendarPanel" style="position:absolute;display:none;background-color:#FFFFFF;border:1px solid #666666;width:210px;height:216px;">';
        html += '<iframe name="calendarIframe" id="calendarIframe" width="100%" height="100%" scrolling="no" frameborder="0" style="margin:0px;"></iframe>';
        html += "</div>";
        var oDiv = document.createElement("DIV");
        oDiv.innerHTML = html;
        document.body.appendChild(oDiv);
        var ciframe = window.frames["calendarIframe"];
        html = '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">';
        html += '<html xmlns="http://www.w3.org/1999/xhtml">';
        html += "<head>";
        html += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';
        html += "<title>Web Calendar</title>";
        html += '<style type="text/css">';
        html += "body {font-size:12px;margin:0px;text-align:center;}";
        html += "form {margin:0px;}";
        html += "select {font-size:12px;background-color:#EFEFEF;}";
        html += "table {border:0px solid #CCCCCC;background-color:#FFFFFF}";
        html += "th {font-size:12px;font-weight:normal;background-color:#FFFFFF;}";
        html += "th.theader {font-weight:normal;background-color:#666666;color:#FFFFFF;width:24px;}";
        html += "select.year {width:66px;margin-right:2px;}";
        html += "select.month {width:62px;}";
        html += "td {font-size:12px;text-align:center;cursor:default;}";
        html += "td.sat {color:#0000FF;background-color:#EFEFEF;}";
        html += "td.sun {color:#FF0000;background-color:#EFEFEF;}";
        html += "td.normal {background-color:#EFEFEF;}";
        html += "input.l {border: 1px solid #CCCCCC;background-color:#EFEFEF;width:20px;height:20px;}";
        html += "input.r {border: 1px solid #CCCCCC;background-color:#EFEFEF;width:20px;height:20px;}";
        html += "input.b {border: 1px solid #CCCCCC;background-color:#EFEFEF;width:100%;height:20px;}";
        html += "</style>";
        html += "</head>";
        html += "<body>";
        html += "</body>";
        html += "</html>";
        ciframe.document.write(html);
        ciframe.document.close();
        calendar = new Calendar();
        // 增加：页面点击隐藏日历
        if (typeof jQuery == "function") {
            jQuery(document).click(function(e) {
                if (!$(e.target).is(":input")) {
                    $("#calendarPanel").hide();
                }
            });
        }
    }
    if (document.body) {
        initCalendar();
    } else {
        setTimeout(initCalendar, 0);
    }
    module.exports = Calendar;
});