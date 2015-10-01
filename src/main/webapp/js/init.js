$(document).ready(function(){

	var SURFACE_WATER_ZONE = 7,
		GEOCLIENT_URL = '//maps.nyc.gov/geoclient/v1/search.json?app_key=YOUR_APP_KEY&app_id=YOUR_APP_ID',
		GOOGLE_URL = 'https://maps.googleapis.com/maps/api/js?sensor=false&libraries=visualization',
		MESSAGES = {
			facility_info_field: '<div class="${css} notranslate" translate="no">${value}</div>',
			facility_info_web: '<li class="inf-web"><a href="${web}" target="_blank">${web}</a></li>',
			facility_info_phone: '<div class="capitalize inf-btn inf-phone"><a data-role="button" href="tel:${phone}" ${target}>${phone}</a></div>',
			facility_distance: '<div class="inf-dist">&#8226; ${distance} miles &#8226;</div>',
			facility_info_map: '<div class="capitalize inf-btn inf-map"><a data-role="button" onclick=\'nyc.app.zoomFacility("${id}");\'>map</a></div>',
			facility_info_dir: '<div class="capitalize inf-btn inf-dir"><a data-role="button" onclick=\'nyc.app.direct("${id}");\'>directions</a></div>',
			facility_info_detail: '<div class="capitalize inf-btn inf-detail"><a data-role="button" onclick=\'nyc.app.details(this);\'>details</a></div>',
			facility_info_in_patient: '<li>Inpatient service provider (this may require a prolonged stay)</li>',
			facility_info_resident: '<li>Residential program (TEXT TO COME)</li>',
			facility_info_lifenet: '<li><a href="tel:1-800-LIFENET">1-800-LIFENET</a> (1-800-543-3638) is a free, confidential help line for New York City residents. You can call 24 hours per day/7 days per week. The hotline\'s staff of trained mental health professionals help callers find mental health and substance abuse services.</li>',
			facility_tip: '<div class="${css}">${name}</div>',
			bad_input: 'The location you entered was not understood',
			data_load_error: 'There was a problem loading map data. Please refresh the page to try again.',
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
				isInPatient: function(){
					return this.get('in_pat') == '1';
				},
				isResidential: function(){
					return this.get('resi') == '1';
				},
				isIosAppMode: function(){
					return navigator.standalone && navigator.userAgent.match(/(iPad|iPhone|iPod|iOS)/g);
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
						.append(this.message('facility_info_field', {css: 'inf-addr', value: this.getAddress3()}));
					if (this.getPhone()){
						div.append(this.message('facility_info_phone', {
							phone: this.getPhone(), 
							target: this.isIosAppMode() ? 'target="blank"' : ''
						}))
					}
					div.append(this.message('facility_info_map', {id: id}))
						.append(this.message('facility_info_dir', {id: id}));
					this.details(div);
					if (!isNaN(this.getDistance()))
						div.prepend(this.message('facility_distance', {distance: (this.getDistance() / 5280).toFixed(2)}));
					return result.html();
				},
				details: function(div){
					var web = this.getWeb(), inPatient = this.isInPatient(), res = this.isResidential();
					var ul = $('<ul></ul>');
					div.append(this.message('facility_info_detail', {}));
					div.append(ul);
					if (web) ul.append(this.message('facility_info_web', {web: web}));
					if (inPatient) ul.append(this.message('facility_info_in_patient', {}));
					if (res) ul.append(this.message('facility_info_resident', {}));
					ul.append(this.message('facility_info_lifenet', {}));
				}				
			}
		};
	
	var lang = new nyc.Lang('#translate-container', LANGUAGES);
	
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