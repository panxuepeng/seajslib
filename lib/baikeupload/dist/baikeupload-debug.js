/*
 * baikeupload
 * 百科站点前台上传图片组件
 *
 * 1、理论上支持多个图片同时上传
 * 2、给每个按钮生成一套自己独用到form和iframe
 * 3、给按钮绑定点击事件，然后触发对应的file表单项的onchang事件
 * 4、给iframe绑定onload事件
 * 5、验证选择的文件是否是图片文件
 * 7、触发表单的submit方法
 * 
 * 2013-03-26 潘雪鹏
 */
define("baikeupload/0.1.0/baikeupload-debug", [], function(require, exports) {
    var options = {}, defaults = {
        url: "",
        uploading: function() {},
        success: function(imgUrl) {
            alert(imgUrl);
        },
        error: function(msg) {
            alert(msg);
        },
        complete: function() {}
    }, fileInputs = {}, msgs = [ "没有检测到上传文件!", // 0
    "图片超过规定大小，请压缩后再上传！", // 1
    "图片类型不支持，只允许上传jpg,jpeg,gif和png图片！", // 2
    "同步登录信息丢失，暂时不能上传图片！", // 3
    "您的权限不够，请与管理员联系！", // 4
    "", // 5
    "您上传的图片涉嫌违禁内容，请重新选择图片上传！", // 6
    "" ];
    /**
		$('#btn1,#btn2,#btn3').baikeUpload({
			url: url,
			uploading: function(){
				
			},
			success: function( imgUrl ){
				$('#image').attr('src', imgUrl);
				$('#pic_url').val(imgUrl);
			},
			error: function(msg){
				
			},
			complete: function(){
				
			}
		});
	 */
    $.fn.baikeUpload = function(option) {
        option = $.extend({}, defaults, option);
        this.each(function(index, el) {
            var id = "_" + Math.round(Math.random() * 1e5);
            options[id] = option;
            option.id = id;
            init(option);
            option.btn = $(el);
            // 给按钮绑定点击选择文件事件
            $(el).click(function() {
                fileInputs[id].click();
            });
        });
    };
    // 初始化
    function init(option) {
        var id = option.id, iframeid = option.iframeid = "__baikeUploadIframe" + id, formid = "baikeUploadForm" + id, html = '<div style="position:absolute;left:-1000px;width:1px;height:1px;overflow:hidden;">		<form id="' + formid + '" action="' + option.url + '" method="post" target="' + iframeid + '" enctype="multipart/form-data" >		<input name="img_src_action" value="baike_logo_upload"/>		<input name="picWidthHeight" value="2"/>		<input name="picAlign" value="center"/>		<input name="picAlt" value="1"/>		<input type="file" name="photofile" />		</form>		<iframe id="' + iframeid + '" name="' + iframeid + '"></iframe>		</div>';
        $("body").append(html);
        setTimeout(function() {
            var btn = option.btn;
            fileInputs[id] = $("#baikeUploadForm" + id + " input[type=file]");
            fileInputs[id].bind("change", function() {
                var filename = $(this).val();
                if (check(filename)) {
                    $.isFunction(option.uploading) && option.uploading();
                    $("#" + formid).trigger("submit");
                } else {
                    var msg = "提示：请选择一个有效的图片(jpg|jpeg|gif|png)文件";
                    $.isFunction(option.error) ? option.error(msg) : alert(msg);
                }
            });
            $("#" + iframeid).load(function() {
                onload(option);
            });
        }, 0);
    }
    // 验证图片格式
    function check(filename) {
        return filename && /\.(jpg|jpeg|gif|png)$/i.test(filename);
    }
    // 上传完成
    function onload(option) {
        var msg = "上传失败，请稍候再试", imgUrl = "", flag = false;
        try {
            var win = window.frames[option.iframeid];
            imgUrl = win.f;
            flag = win.info_flag;
        } catch (e) {
            msg = "可能存在跨域问题，对返回后的iframe没有读取权限";
            $.isFunction(option.error) ? option.error(msg) : alert(msg);
        }
        if (flag !== false) {
            msg = msgs[flag] || msg;
        }
        if (imgUrl) {
            // success
            $.isFunction(option.success) && option.success(imgUrl);
        } else {
            // error
            $.isFunction(option.error) ? option.error(msg) : alert(msg);
        }
        // complete
        $.isFunction(option.complete) && option.complete();
    }
});