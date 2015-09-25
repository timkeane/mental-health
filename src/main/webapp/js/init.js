$(document).ready(function(){

	var SURFACE_WATER_ZONE = 7,
		GEOCLIENT_URL = '//maps.nyc.gov/geoclient/v1/search.json?app_key=YOUR_APP_KEY&app_id=YOUR_APP_ID',
		GOOGLE_URL = 'https://maps.googleapis.com/maps/api/js?sensor=false&libraries=visualization',
		MESSAGES = {
			yes_order: '<div class="order active-order">You are required to evacuate</div>',
			no_order: '<div class="order">No evacuation order currently in effect</div>',
			splash_yes_order: '<div class="capitalize inf-name">an evacutation order is in effect for</div>',
			splash_zone_order: '<div class="zone">${zones}</div>',
			location_no_zone: '<div class="inf-location"><div class="inf-name">You are not located in an Evacuation Zone</div><div class="inf-name">${name}</div></div>',
			location_zone_order: '<div class="inf-location"><div class="inf-name">You are located in Zone ${zone}</div>${order}<div class="inf-name">${name}</div></div>',
			location_zone_unkown: '<div class="inf-location"><div class="inf-name">Zone Finder cannot determine Zone for your address.</div><div>Try alternative address or determine Zone by examining map and clicking on your location.</div><div class="inf-name">${name}</div></div>',
			zone_info: '<div class="inf-zone"><div class="inf-name">Zone ${zone}</div>${order}</div>',
			zone_tip: '<div class="capitalize">evacuation zone ${zone}</div><div>${order}</div>',
			facility_info_field: '<div class="${css} notranslate" translate="no">${value}</div>',
			facility_cross_st_field: '<div class="inf-addr inf-cross">Between <span class="notranslate" translate="no">${cross1}</span> and <span class="notranslate" translate="no">${cross2}</span>',
			facility_distance: '<div class="inf-dist">&#8226; ${distance} miles &#8226;</div>',
			facility_info_map: '<div class="capitalize inf-btn inf-map"><a data-role="button" onclick=\'nyc.app.zoomFacility("${id}");\'>map</a></div>',
			facility_info_dir: '<div class="capitalize inf-btn inf-dir"><a data-role="button" onclick=\'nyc.app.direct("${id}");\'>directions</a></div>',
			facility_info_access: '<div class="capitalize inf-btn inf-detail-btn"><a data-role="button" onclick=\'nyc.app.access(this);\'>details...</a></div><div class="inf-detail">${detail}</div>',
			facility_tip: '<div class="${css}">${name}</div>',
			bad_input: 'The location you entered was not understood',
			data_load_error: 'There was a problem loading map data. Please refresh the page to try again.',
			trip_planner: 'For directions with information regarding wheelchair accessible subway stations use the <a href="http://tripplanner.mta.info/MyTrip/ui_phone/cp/idefault.aspx" target="_blank">MTA Trip Planner</a>.',
			copyright: '&copy; ${yr} City of New York'
		},
		LANGUAGES = {
		    en: {val: 'English', desc: 'English', hint: 'Translate'},
		    ar: {val: 'Arabic', desc: '&#x627;&#x644;&#x639;&#x631;&#x628;&#x64A;&#x629;' /* العربية */, hint: '&#x62A;&#x631;&#x62C;&#x645;' /* ترجم */},
		    bn: {val: 'Bengali', desc: '&#x9AC;&#x9BE;&#x999;&#x9BE;&#x9B2;&#x9BF;' /* বাঙালি */, hint: '&#x985;&#x9A8;&#x9C1;&#x9AC;&#x9BE;&#x9A6; &#x995;&#x9B0;&#x9BE;' /* অন�?বাদ করা */},
		    'zh-CN': {val: 'Chinese (Simplified)', desc: '&#x4E2D;&#x56FD;' /* 中国 */, hint: '&#x7FFB;&#x8BD1;' /* 翻译 */},
		    fr: {val: 'French', desc: 'Fran&#231;ais' /* Français */, hint: 'Traduire'},
		    ht: {val: 'Haitian Creole', desc: 'Krey&#242;l Ayisyen' /* Kreyòl Ayisyen */, hint: 'Tradui'},
		    ko: {val: 'Korean', desc: '&#xD55C;&#xAD6D;&#xC758;' /* 한국�?� */, hint: '&#xBC88;&#xC5ED;' /* 번역 */},
		    ru: {val: 'Russian', desc: 'P&#x443;&#x441;&#x441;&#x43A;&#x438;&#x439;' /* Pу�?�?кий */, hint: '&#x43F;&#x435;&#x440;&#x435;&#x432;&#x435;&#x441;&#x442;&#x438;' /* переве�?ти */},
		    es: {val: 'Spanish', desc: 'Espa&#241;ol' /* Español */, hint: 'Traducir'},
		    ur: {val: 'Urdu', desc: '&#x627;&#x631;&#x62F;&#x648;' /* اردو */, hint: '&#x62A;&#x631;&#x62C;&#x645;&#x6C1; &#x6A9;&#x631;&#x6CC;&#x6BA;' /* ترجم�? کریں */}
		},
		FEATURE_DECORATIONS = {
			fieldAccessors: {
				getCoordinates: function(){
					var g = this.getGeometry();
					return g ? g.getCoordinates() : null;
				},
				getName: function(){
					return this.get('name1');
				},
				getName2: function(){
					return this.get('name2');
				},
				getAddress: function(){
					return this.getAddress1() + ', ' + this.getAddress2();
				},
				getAddress1: function(){
					return this.get('address1');
				},
				getAddress2: function(){
					return this.get('address2');
				},
				getAddress3: function(){
					return this.capitalize(this.get('city')) + ', NY ' + this.get('zip');
				},
				getPhone: function(){
					return this.get('phone');
				},
				getWeb: function(){
					return this.get('web');
				},
				isMentalHealth: function(){
					return this.get('mhf') == 1;
				},
				isSubstanceAbuse: function(){
					return this.get('saf') == 1;
				},
				isMedicare: function(){
					return this.get('mc') == 1;
				},
				isMedicaid: function(){
					return this.get('md') == 1;
				},
				isPrivateInsure: function(){
					return this.get('pi') == 1;
				},
				isNoInsure: function(){
					return this.get('np_ss') == 1;
				},
				isVeteran: function(){
					return this.get('vet') == 1 ||
						this.get('adm') == 1 ||
						this.get('mf') == 1;
				},
				isLgbtq: function(){
					return this.get('gl') == 1;
				},
				isPregnant: function(){
					return this.get('pw') == 1;
				},
				isViolence: function(){
					return this.get('dv') == 1;
				},
				isHiv: function(){
					return this.get('hv') == 1;
				},
				getDistance: function(){
					return this.get('distance');
				},
				setDistance: function(distance){
					this.set('distance', distance);
				},
				capitalize: function(s){
					var words = s.split(' '), result = '';
					$.each(words, function(i, w){
						var word = w.toLowerCase();
						result += word.substr(0, 1).toUpperCase();
						result += word.substr(1).toLowerCase();
						result += ' ';
					});
					return result.trim();
				}				
			},
			htmlRenderer: {
				html: function(renderFor){
					var id = this.getId(), div = $('<div></div>'), result = $('<div></div>');
					result.append(div);
					div.addClass(renderFor)
						.addClass('inf-facility')
						.append(this.message('facility_info_field', {css: 'inf-name', value: this.getName()}))
						.append(this.message('facility_info_field', {css: 'inf-name', value: this.getName2()}))
						.append(this.message('facility_info_field', {css: 'inf-addr', value: this.getAddress1()}))
						.append(this.message('facility_info_field', {css: 'inf-addr', value: this.getAddress2()}))
						.append(this.message('facility_info_field', {css: 'inf-addr', value: this.getAddress3()}))
						.append(this.message('facility_info_field', {css: 'inf-phone', value: this.getPhone()}))
						.append(this.message('facility_info_field', {css: 'inf-web', value: this.getWeb()}))
						.append(this.message('facility_info_map', {id: id}))
						.append(this.message('facility_info_dir', {id: id}));
					if (!isNaN(this.getDistance()))
						div.prepend(this.message('facility_distance', {distance: (this.getDistance() / 5280).toFixed(2)}));
					return result.html();
				}
			}
		};
	
	var loadingComplete = function(){
		if ($('#splash .orders').html()){
			$('#first-load').fadeOut();			
		}else{
			setTimeout(loadingComplete, 100);
		}
	};
	var lang = new nyc.Lang('#translate-container', LANGUAGES);
	lang.on(nyc.Lang.EventType.READY, loadingComplete);
	
	new nyc.Share('#map');
	
	var map = new ol.Map({
		target: $('#map')[0],
		layers: [new nyc.ol.layer.BaseLayer()],
		view: new ol.View({
			projection: nyc.EPSG_2263,
			resolutions: nyc.ol.layer.BaseLayer.RESOLUTIONS
		})
	});
	map.getView().fit(nyc.EXTENT, map.getSize());
	
	nyc.app = new nyc.App(
		map,
		FEATURE_DECORATIONS,
		new nyc.Content(MESSAGES),
		new nyc.Style(),
		new nyc.ol.control.ZoomSearch(map),
		new nyc.ol.Locate(
			new nyc.Geoclient(GEOCLIENT_URL),
			nyc.EPSG_2263,
			nyc.EXTENT
		),
		new nyc.Directions('#dir-map', '#directions', GOOGLE_URL),
		new nyc.ol.Popup(map)
	);

});