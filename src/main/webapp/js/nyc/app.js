/** @export */
window.nyc = window.nyc || {};

/** @export */
nyc.App = (function(){	
	/**
	 * nyc.App - a class to manage user interaction with the hurricane map
	 * 
	 * @constructor
	 * @param {ol.Map} map
	 * @param {Object} featureDecorations
	 * @param {nyc.Content} content
	 * @param {nyc.Style} style
	 * @param {nyc.ol.control.ZoomSearch} controls
	 * @param {nyc.Locate} locate
	 * @param {nyc.Directions} directions
	 * @param {nyc.ol.Popup} popup
	 * 
	 */
	var appClass = function(map, featureDecorations, content, style, controls, locate, directions, popup){
		var me = this;
		me.map = map;
		me.content = content;
		me.view = map.getView();
		me.controls = controls;
		me.locate = locate;
		me.directions = directions;
		me.popup = popup;
		me.location = {};
		me.zoneOrders = {};
		me.tips = [];
		
		$('#copyright').html(content.message('copyright', {yr: new Date().getFullYear()}));	

		me.facilitySource = new nyc.ol.source.FilteringAndSorting(
			{},
			[content, featureDecorations.fieldAccessors, featureDecorations.htmlRenderer]
		);
		me.facilityLayer = new ol.layer.Vector({
			map: map, 
			source: me.facilitySource,
			style: $.proxy(style.facilityStyle, style)
		});
		$.ajax({
			url: 'facility.csv',
			dataType: 'text',
			success: function(csvData){
				var csvFeatures = $.csv.toObjects(csvData), wkt = new ol.format.WKT(), features = [];
				$.each(csvFeatures, function(id, f){
					var feature = wkt.readFeature('POINT (' + f.x + ' ' + f.y + ')');
					feature.setProperties(f);
					feature.setId(id);
					features.push(feature);
				});
				me.facilitySource.addFeatures(features);
				me.clearFirstLoad();
			},
			error: function(){
				me.alert('error');
			}
		});			

		me.facilityLayer = new ol.layer.Vector({
			map: map, 
			source: me.facilitySource,
			style: $.proxy(style.facilityStyle, style)
		});
		me.tips.push(
			new nyc.ol.FeatureTip(map, [{source: me.facilitySource, labelFunction: me.facilityTip}])
		);
		
		me.locationSource = new nyc.ol.source.Decorating({}, [{getName: function(){return this.get('name')}}]);
		new ol.layer.Vector({
			map: map, 
			source: me.locationSource,
			style: $.proxy(style.locationStyle, style)
		});
		me.tips.push(
			new nyc.ol.FeatureTip(map, [{source: me.locationSource, labelFunction: me.locationTip}])
		);

		$('#panel, .banner, .ctl').hover($.proxy(me.hideTips, me));

		$('#filters select').change($.proxy(me.filter, me));
		
		controls.on(nyc.ol.control.ZoomSearch.EventType.GEOLOCATE, $.proxy(locate.locate, locate));
		controls.on(nyc.ol.control.ZoomSearch.EventType.DISAMBIGUATED, $.proxy(me.zoomLocation, me));
		controls.on(nyc.ol.control.ZoomSearch.EventType.SEARCH, $.proxy(locate.search, locate));
		
		locate.on(nyc.Locate.LocateEventType.GEOCODE, $.proxy(me.zoomLocation, me));
		locate.on(nyc.Locate.LocateEventType.GEOLOCATION, $.proxy(me.zoomLocation, me));
		locate.on(nyc.Locate.LocateEventType.AMBIGUOUS, $.proxy(me.ambiguous, me));
		locate.on(nyc.Locate.LocateEventType.ERROR, function(){controls.searching(false);});
		
		directions.on(nyc.Directions.EventType.CHANGED, me.resize);
		$(window).resize(me.resize);
		
		map.on('click', $.proxy(me.mapClick, me));
		
		$('#transparency').change($.proxy(me.transparency, me));
		
		$('#map-tab-btn a').click($.proxy(me.mapSize, me));
		
	};
	
	appClass.prototype = {
		/** @private */
		map: null,
		/** @private */
		view: null,
		/** @private */
		zoneSource: null,
		/** @private */
		zoneLayer: null,
		/** @private */
		facilitySource: null,
		/** @private */
		facilityLayer: null,
		/** @private */
		locationSource: null,
		/** @private */
		content: null,
		/** @private */
		controls: null,
		/** @private */
		locate: null,
		/** @private */
		directions: null,
		/** @private */
		popup: null,
		/** @private */
		tips: null,
		/** @private */
		location: null,
		/** @private */
		zoneOrders: null,
		/** @export */
		initList: function(){
			if (!$('#facility-list div').length){
				this.list(this.location.coordinates);
				setTimeout(this.listHeight, 10);
			}
		},
		details: function(btn){
			console.info(btn);
			$(btn).parent().next().slideToggle();
		},
		clearFirstLoad: function(){
			if ($('#lang-choice-button').length){
				$('#first-load').fadeOut();				
			}else{
				setTimout(this.ready, 200);
			}
		},
		resize: function(){
			var h =  $('#dir-toggle').css('display') == 'block' ? $('#dir-toggle').height() : 0;
			$('#directions').height(
				$('#dir-panel').height() - 
				h - $('.banner').height() -
				$('.footer').height() -
				$('#dir-content').height() - 
				$('#copyright').height() - 15
			);
		},
		/** @export */
		layout: function(){
			var mobile = $('#panel').width() == $(window).width();
			$('#filter-tab').append($('#filters'));
			$(window).one('resize', $.proxy(this.layout, this));
			$('#tabs').tabs({
				activate: function(event, ui){
					$('#map-page .ui-content').css(
						'z-index', 
						mobile && ui.newPanel.attr('id') == 'map-tab' ? '1000' : 'auto'
					);
				}
			});
			$('#tabs li a').removeClass('ui-btn-active');
			$('#map-tab-btn')[mobile ? 'show' : 'hide']();
			$('#tabs').tabs('refresh').tabs({active: 1});
			$('#facility-tab-btn a').addClass('ui-btn-active');
			this.initList();
			this.map.updateSize()
			this.listHeight();
		},
		/**
		 * @export
		 * @param {string} id
		 */
		zoomFacility: function(id){
			var me = this, feature = me.facilitySource.getFeatureById(id);
			if ($('#panel').width() == $(window).width()){
				$('#tabs').tabs({active: 0});
				$('#tabs li a').removeClass('ui-btn-active');
				$('#map-tab-btn a').addClass('ui-btn-active');
			}
			me.zoomCoords(feature.getCoordinates());
			me.map.once('moveend', function(){
				me.showPopup(feature.getCoordinates(), feature.html('inf-pop'))
			});
		},
		/**
		 * @private
		 * @param {nyc.Locate.LocateResult} data
		 */
		zoomLocation: function(data){
			this.controls.val(data.type == nyc.Locate.LocateEventType.GEOLOCATION ? '' : data.name);
			this.list(data.coordinates);
			this.location = data;
			this.locationSource.clear();
			this.locationSource.addFeature(new ol.Feature({
				geometry: new ol.geom.Point(data.coordinates),
				name: data.name
			}));
			this.zoomCoords(data.coordinates);
		},
		/** 
		 * @private 
		 * @param {nyc.Locate.LocateAmbiguous} data
		 */
		ambiguous: function(data){
			if (data.possible.length){
				this.controls.disambiguate(data.possible);
			}else{
				this.controls.searching(false);
				this.alert(this.content.message('bad_input'));
			}
		},
		/**
		 * @export
		 * @param {string} id
		 */
		direct: function(id){
			var me = this,
				feature = me.facilitySource.getFeatureById(id),
				to = feature.getAddress(),
				name = feature.getName(),
				from = me.location.name || '';
			
			$('body').pagecontainer('change', $('#dir-page'), {transition: 'slideup'});
			if (me.lastDir != from + '|' + to){
				var args = {from: unescape(from), to: unescape(to), facility: unescape(name)};
				me.lastDir = from + '|' + to;
				me.directions.directions(args);
			}
		},
		/** @private */
		mapSize: function(){
			var map = this.map;
			setTimeout(function(){map.updateSize()}, 10);
		},
		/** 
		 * @private 
		 * @param {ol.Coordinate} coordinates
		 */
		list: function(coordinates){
			var container = $('#facility-list');
			container.empty();
			$.each(this.facilitySource.sort(coordinates), function(i, facility){
				var info = $(facility.html('inf-list'));
				if (i % 2 == 0) info.addClass('even-row');
				$(container).append(info).trigger('create');
			});
			this.listHeight();
		},
		/** @private */
		listHeight: function(){
			$('#facility-tab .facility-bottom').height(
				$('#facility-tab').height() - $('#facility-tab .facility-top').height() - $('#copyright').height() - 5
			);
		},
		/** 
		 * @export 
		 *@param {Element} button
		 */
		access: function(button){
			var me = this, parent = $(button).parent();
			parent.next().slideToggle(function(){
				if (parent.parent().hasClass('inf-pop')) {
					me.popup.pan();
				}				
			});
		},
		/** @private */
		qstr: function(qstr){
			var args = {};
			try{
				var params = qstr.substr(1).split("&");
				for (var i = 0; i < params.length; i++){
					var p = params[i].split("=");
					args[p[0]] = decodeURIComponent(p[1]);
				}
			}catch(ignore){}
			if (args.address){
				this.locate.search(args.address);
			}else{
				this.locate.locate();
			}
		},
		/**
		 * guarantee evac orders are updated every hour regardless of other caching strategies
		 * 
		 * @private
		 */
		ordersUrl: function(){
			var date = new Date(),
				mo = date.getMonth() + 1,
				dt = date.getDate(),
				yr = date.getFullYear(),
				hr = date.getHours();
			return 'order.json?' + yr + '-' + mo + '-' + dt + '-' + hr;
			
		},
		/** 
		 * @private 
		 * @param {Object} evt
		 */
		filter: function(){
			var filters = [];
			$('#filters select').each(function(_, select){
				var props = $(select).val().split(',');
				$.each(props, function(_, prop){
					if (prop != 'any')
						filters.push({property: prop, values: ["1"]});
				});
			});
			this.facilitySource.filter(filters);
			this.list(this.location.coordinates);
		},
		/** 
		 * @private 
		 * @param {ol.Coordinate} coordinates
		 */
		zoomCoords: function(coords){
			this.map.beforeRender(
				ol.animation.zoom({resolution: this.view.getResolution()}), 
				ol.animation.pan({source: this.view.getCenter()})
			);
			this.view.setZoom(7);
			this.view.setCenter(coords);
		},
		/** 
		 * @private 
		 * @param {Object} evt
		 */
		mapClick: function(evt){
			var me = this, map = me.map, px = evt.pixel;
			map.forEachFeatureAtPixel(px, function(feature, layer){
				var coords, html;
				if (layer == me.zoneLayer){
					coords = map.getCoordinateFromPixel(px);
					html = feature.html();
				}else if (layer == me.facilityLayer){
					coords = feature.getCoordinates();
					html = feature.html('inf-pop');
				}
				if (coords) return me.showPopup(coords, html);
			});
		},
		/** 
		 * @private 
		 * @param {ol.Coordinate} coordinates
		 * @param {string} html
		 */
		showPopup: function(coordinates, html){
			this.hideTips();
			this.popup.setOffset([0, -10]);
			this.popup.show({
				coordinates: coordinates,
				html: html
			});
		},
		/** @private */
		facilityTip: function(){
			return {
				cssClass: 'tip-facility',
				text:  this.message('facility_tip', {name: this.getName()})
			};
		},
		/** @private */
		locationTip: function(){
			return {
				cssClass: 'tip-location',
				text: this.getName().replace(/,/, '<br>')
			};			
		},
		/** @private */
		hideTips: function(){
			$.each(this.tips, function(_, tip){
				tip.hide();
			});
		},
		/** @private */
		error: function(){
			this.alert(this.content.message('data_load_error'));
		},
		/**
		 * @private 
		 * @param {string} msg
		 */
		alert: function(msg){
			$('body').append($('#alert'));
			$('#alert-msg').html(msg);
			$('#alert').fadeIn();
			$('#alert button').focus();
		}
	};
	
	return appClass;
}());

	