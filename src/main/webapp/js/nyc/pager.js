/** @export */
window.nyc = window.nyc || {};

/** @export */
nyc.Pager = function(list){
	this.list = list;
};

nyc.Pager.prototype = {
	list: null,
	index: 0,
	reset: function(list){
		this.list = list;
		this.index = 0;
	},
	next: function(){
		var result = this.list.slice(this.index, this.index + 10);
		this.index = this.index + 10;
		return result;
	}
};