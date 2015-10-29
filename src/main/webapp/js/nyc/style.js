/** @export */
window.nyc = window.nyc || {};

/** @export */
nyc.Style = (function(){	
	/** 
	 * @constructor  
	 * @param {boolean} isIe
	 */
	var styleClass = function(){
		this.facilityCache = {};
		this.locationCache = {};
	};
	
	styleClass.prototype = {
		facilityCache: null,
		locationCache: null,
		isIe: function(){
			return 'ActiveXObject' in window;
		},
		imgExt: function(){
			return this.isIe() ? '.png' : '.svg';
		},
		zoom: function(resolution){
			var resolutions = nyc.ol.layer.BaseLayer.RESOLUTIONS, zoom = resolutions.indexOf(resolution);
			if (zoom == -1) {
				for (var z = 0; z < resolutions.length; z++){
					if (resolution > resolutions[z]){
						zoom = z;
						break;
					}
				}
			}
			return zoom > -1 ? zoom : resolutions.length - 1;
		},
		locationStyle: function(feature, resolution){
			var zoom = this.zoom(resolution), 
				image = 'img/me0' + this.imgExt();
			if (!this.locationCache[zoom]){
				this.locationCache[zoom] = [new ol.style.Style({
					image: new ol.style.Icon({
						scale: 48 / 512,
						src: image,
						offset: navigator.userAgent.match(/(iPad|iPhone|iPod|iOS)/g) ? undefined : [0, 24]
					})
				})];
			}
			return this.locationCache[zoom];
		},
		facilityStyle: function(feature, resolution){
			var zoom = this.zoom(resolution),
				radius = [8, 8, 8, 12, 12, 12, 16, 16, 16, 16, 16][zoom];
			if (!this.facilityCache[zoom]){
				this.facilityCache[zoom] = [new ol.style.Style({
					image: new ol.style.Circle({
						radius: radius,
						fill: new ol.style.Fill({color: '#085095'}),
						stroke: new ol.style.Stroke({color: 'white', width: radius < 12 ? 1.5 : 2})
					})
				})];
			}
			return this.facilityCache[zoom];
		}
	};

	return styleClass;
}());
