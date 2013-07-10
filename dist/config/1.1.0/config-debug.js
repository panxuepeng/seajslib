/* 2013-05-22 */
define("config/1.1.0/config-debug", [], function(require, exports) {
    return seajs;
});

/* 可以使用的组件和其版本号
==================================*/
seajs.libs = {
    artdialog: [ "5.0.3" ],
    autocomplete: [ "2.4.4" ],
    baikeupload: [ "0.1.0" ],
    bootstrap: [ "2.3.1" ],
    calendar: [ "1.0.0" ],
    colorpicker: [ "0.1.0" ],
    contextmenu: [ "0.1.0" ],
    contextmenu_hd: [ "0.1.0" ],
    dialog: [ "2.8.0" ],
    edittable: [ "0.1.0" ],
    fixed: [ "0.3.0" ],
    highcharts: [ "2.3.5" ],
    highstock: [ "1.2.5" ],
    imgfall: [ "1.0.0" ],
    json: [ "2.0.0" ],
    markdown: [ "0.1.0" ],
    md5: [ "1.0.0" ],
    moment: [ "2.0.0" ],
    plupload: [ "1.5.6" ],
    prettify: [ "2.0.0" ],
    qunit: [ "1.11.0" ],
    selectlist: [ "0.1.0" ],
    slide: [ "0.1.0" ],
    slidesjs: [ "3.0.3" ],
    underscore: [ "1.4.4" ],
    validator: [ "1.1.0" ],
    ztree: [ "3.5.02" ]
};

/* 下面是对 seajs 的一些自定义扩展
==================================*/
// 修改 seajs.use 方法，使其支持 underscore@1.4.4 这种形式的版本号
// underscore@1.4.4 === underscore/1.4.4/underscore
seajs.__use = seajs.use;

seajs.use = function(uris, callback) {
    if (typeof uris === "string") {
        uris = [ uris ];
    }
    for (var i = 0; i < uris.length; i++) {
        uris[i] = uris[i].replace(/\\/g, "/");
        var parts = uris[i].match(/([\w]+)@(\d\d?\.\d\d?\.\d\d?)/);
        if (parts) {
            uris[i] = parts[1] + "/" + parts[2] + "/" + parts[1];
        } else if (uris[i].indexOf("/") < 0) {
            // 仅指定了组件名，没有指定版本号
            if (seajs.libs[uris[i]]) {
                // 如果存在这个组件
                if (!seajs.config.data.alias[uris[i]]) {
                    // 同时，不是seajs的别名
                    var version = seajs.libs[uris[i]][0];
                    uris[i] = uris[i] + "/" + version + "/" + uris[i];
                }
            }
        }
    }
    return seajs.__use(uris, callback);
};

seajs.__config = seajs.config;

seajs.config = function(config) {
    var re = /([\w]+)@(\d\d?\.\d\d?\.\d\d?)/, parts;
    if (config.alias) {
        for (var name in config.alias) {
            parts = config.alias[name].match(re);
            if (parts) {
                config.alias[name] = parts[1] + "/" + parts[2] + "/" + parts[1];
            }
        }
    }
    if (config.preload) {
        for (var i = 0; i < config.preload.length; i++) {
            parts = config.preload[i].match(re);
            if (parts) {
                config.preload[i] = parts[1] + "/" + parts[2] + "/" + parts[1];
            }
        }
    }
    return seajs.__config(config);
};

seajs.config.data = seajs.__config.data;

/* 自动加载已经在页面当中使用的组件
==================================*/
seajs.autoload = function() {
    var used = {};
    if (typeof jQuery === "function") {
        jQuery("[data-toggle]").each(function() {
            var path = "", onload = $(this).data("onload"), libName = $(this).data("toggle").split("@"), version;
            if (seajs.libs[libName[0]]) {
                // 如果存在这个组件，则自动加载
                if (libName.length > 1) {
                    // 指定了版本号
                    version = libName[1];
                } else {
                    // 未指定版本号，则加载最新版本
                    version = seajs.libs[libName[0]][0];
                }
                path = libName[0] + "/" + version + "/" + libName[0];
                if (!used[path]) {
                    used[path] = 1;
                    if (onload) {
                        $(window).one("load", function() {
                            use(path);
                        });
                    } else {
                        use(path);
                    }
                }
            }
            function use(path) {
                seajs.use(path, function(o) {
                    // 有的组件（就是jQuery插件），
                    // 所以可能没有不会返回组件对象，此时 o == null
                    if (o && typeof o.autorun === "function") {
                        o.autorun();
                    }
                });
            }
        });
    } else {
        if (window.console) {
            console.error("组件库依赖 jQuery");
        } else {
            alert("组件库依赖 jQuery");
        }
    }
};

setTimeout(function() {
    seajs.autoload();
}, 0);