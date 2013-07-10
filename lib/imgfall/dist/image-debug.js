define("imgfall/1.0.0/image-debug", [], function(require, exports) {
    var Image = Backbone.Model.extend({
        defaults: {
            id: "",
            url: "",
            desc: "",
            comments: "",
            img_width: "170px",
            //图片宽度
            initialize: function() {}
        }
    });
    var ImageShow = Backbone.View.extend({
        initialize: function() {
            this.render();
        },
        render: function() {
            var template = _.template($("#imgae-container").html(), {
                image: this.model.attributes
            });
            $(this.el).append(template);
        }
    });
    var ImageColl = Backbone.Collection.extend({
        model: Image
    });
    var imageCollection = new ImageColl();
    exports.Image = Image;
    exports.ImageShow = ImageShow;
    exports.imageCollection = imageCollection;
});