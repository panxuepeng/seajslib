define(function(require, exports){
	var Panel =  Backbone.Model.extend({
		defaults : {
			panel_class : '',
			initialize : function(){

			}
		}
	});
	var PanelShow = Backbone.View.extend({
		initialize : function(){
			this.render();
		},
		render : function(){
			var template = _.template($('#panel-container').html(),{panel:this.model.attributes});
			$(this.el).append(template);
		}
	});
	exports.Panel = Panel;
	exports.PanelShow = PanelShow;
});