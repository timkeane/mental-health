$(document).ready(function(){

	var SURFACE_WATER_ZONE = 7,
		GEOCLIENT_URL = '//maps.nyc.gov/geoclient/v1/search.json?app_key=YOUR_APP_KEY&app_id=YOUR_APP_ID',
		GOOGLE_URL = 'https://maps.googleapis.com/maps/api/js?sensor=false&libraries=visualization',
		MESSAGES = {
			facility_info_field: '<div class="${css} notranslate" translate="no">${value}</div>',
			facility_info_web: '<li class="inf-web"><a href="${web}" target="_blank">${web}</a></li>',
			facility_info_phone: '<div class="inf-phone"><a data-role="button" href="tel:${href}" ${target}>${text}</a></div>',
			facility_distance: '<div class="inf-dist">&#8226; ${distance} miles &#8226;</div>',
			facility_info_map: '<a class="capitalize inf-map" data-role="button" onclick=\'nyc.app.zoomFacility("${id}");\'>map</a>',
			facility_info_dir: '<a class="capitalize inf-dir" data-role="button" onclick=\'nyc.app.direct("${id}");\'>directions</a>',
			facility_info_detail: '<a class="capitalize inf-detail" data-role="button" onclick=\'nyc.app.details(this);\'>details</a>',
			facility_info_resident: '<li class="inf-res">This may be an residential treatment service provider. (A 24-hour program which houses individuals in the community and provides a supervised, therapeutic environment, which seeks to develop the resident\'s skills and capacity to live in the community and attend school/ work as appropriate.)</li>',
			facility_info_in_patient: '<li class="inf-in">This may be an inpatient service provider. (A 24-hour hospital-based program which includes psychiatric, medical, nursing, and social services which are required for the assessment and or treatment of a person with a primary diagnosis of mental illness who can not be adequately served in the community.)</li>',
			facility_info_lifenet: '<li><a class="lifenet-word" href="tel:+${lifenet_word}">${lifenet_word}</a> <span class="lifenet-number">${lifenet_number}</span> is a free, confidential help line for New York City residents. You can call 24 hours per day/7 days per week. The hotline\'s staff of trained mental health professionals help callers find mental health and substance abuse services.</li>',
			facility_tip: '<div class="${css}">${name}</div>',
			bad_input: 'The location you entered was not understood',
			data_load_error: 'There was a problem loading map data. Please refresh the page to try again.',
			data_filter_warn: 'There are no facilities that meet the criteria of the applied filters.  Please modify your filter choices.',
			copyright: '&copy; ${yr} City of New York',
			lifenet_word: '1-800-LIFENET',
			lifenet_number: '(1-800-543-3638)',
			lifenet_word_es: '1-877-AYUDESE',
			lifenet_number_es: '(1-877-990-8585)',
			lifenet_word_ko: '1-877-990-8585',
			vcard: 'BEGIN:VCARD\nVERSION:2.1\nADR;WORK;PREF:${address}\nEMAIL:${email}\nGEO:${coordinates}\nKIND:organization\nLABEL;WORK;PREF;ENCODING=QUOTED-PRINTABLE:${address}\nLANG:en-US\nNOTE:This contact was downloaded from https://maps.nyc.gov/mental-health/\nORG:${name}\nPROFILE:VCARD\nREV:${now}\nROLE:Mental health service provider\nTEL;WORK;VOICE:${phone}\nTZ:-0500\nURL;WORK:${web}\nEND:VCARD',
			facility_vcard: '<a class="ui-btn" href="data:text/vcard,${vcard}" download="contact.vcf">add to contacts</a>'
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
					return this.get('name_1');
				},
				getName2: function(){
					return this.get('name_2');
				},
				getAddress: function(){
					return this.getAddress1() + ', ' + this.getAddress3();
				},
				getAddress1: function(){
					return this.get('street_1');
				},
				getAddress2: function(){
					return this.get('street_2');
				},
				getAddress3: function(){
					return this.capitalize(this.get('city')) + ', NY ' + this.get('zip');
				},
				getPhoneText: function(){
					var phone = this.get('phone').replace(/[\(\-\s\x]/g, '');
					if (phone.substr(0, 1) == '1') phone = phone.substr(1);
					if (phone.length == 10){
						phone = phone.replace(/(\w{3})(\w{3})(\w{4})/, '($1) $2-$3');
					}else if (phone.length > 10){
						phone = phone.replace(/(\w{3})(\w{3})(\w{4})/, '($1) $2-$3 x');
					}else{
						phone = '';
					}
					return phone;
				},
				getPhoneNumber: function(){
					var phone = this.get('phone').replace(/[\(\)\-\s\x]/g, '');
					if (phone.substr(0, 1) == '1') phone = phone.substr(1);
					if (phone.length > 10){
						phone = phone.replace(/(\w{3})(\w{3})(\w{4})(\w*)/, '$1-$2-$3,,$4');
					}else{
						phone = phone.replace(/(\w{3})(\w{3})(\w{4})/, '$1-$2-$3');
					}
					return '+1-' + phone;
				},
				getWeb: function(){
					return this.get('website');
				},
				isInPatient: function(){
					return this.get('filter_inpatient_svc') == 1;
				},
				isResidential: function(){
					return this.get('filter_residential_pgm') == 1;
				},
				isIos: function(){
					return navigator.userAgent.match(/(iPad|iPhone|iPod|iOS)/g);
				},
				isIosAppMode: function(){
					return navigator.standalone && this.isIos();
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
					if (this.getPhoneText()){
						div.append(this.message('facility_info_phone', {
							text: this.getPhoneText(),
							href: this.getPhoneNumber(), 
							target: this.isIosAppMode() ? 'target="blank"' : ''
						}))
					}
					this.buttonGrp(div, id);
					if (!isNaN(this.getDistance())){
						div.prepend(this.message('facility_distance', {distance: (this.getDistance() / 5280).toFixed(2)}));
					}
					this.vcard(result);
					return result.html();
				},
				vcard: function(div){
					var vcard = this.message('vcard', {
						address: this.getAddress(),
						coordinates: '',
						email: '',
						name:  this.getName() + (this.getName2() ? (' - ' + this.getName2()) : ''),
						date: new Date().getUTCDate(),
						phone: this.getPhoneNumber(),
						web: this.getWeb()
					});
					div.append(this.message('facility_vcard', {vcard: encodeURIComponent(vcard)}));
				},
				buttonGrp: function(div, id){
					var group = $('<div class="btn-grp" data-role="controlgroup" data-type="horizontal"></div>');
					group.append(this.message('facility_info_map', {id: id}))
						.append(this.message('facility_info_dir', {id: id}));
					this.details(div, group);
					div.append(group);
				},
				details: function(div, group){
					var web = this.getWeb(), inPatient = this.isInPatient(), res = this.isResidential();
					var ul = $('<ul></ul>');
					group.append(this.message('facility_info_detail'));
					div.append(ul);
					if (web) ul.append(this.message('facility_info_web', {web: web}));
					if (inPatient) ul.append(this.message('facility_info_in_patient'));
					if (res) ul.append(this.message('facility_info_resident'));
					ul.append(this.message('facility_info_lifenet', {
						lifenet_word: this.message('lifenet_word_' + nyc.lang.lang()) || this.message('lifenet_word'),
						lifenet_number: this.message('lifenet_number_' + nyc.lang.lang()) || this.message('lifenet_number')
					}));
				}				
			}
		};
	
	var content = new nyc.Content(MESSAGES);
	
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
	
	var lang = new nyc.Lang('#translate-container', LANGUAGES);
	
	nyc.app = new nyc.App(
		map,
		'MHF.csv?',
		FEATURE_DECORATIONS,
		content,
		new nyc.Style(),
		new nyc.ol.control.ZoomSearch(map),
		new nyc.ol.Locate(
			new nyc.Geoclient(GEOCLIENT_URL),
			nyc.EPSG_2263,
			nyc.EXTENT
		),
		new nyc.Directions('#dir-map', '#directions', GOOGLE_URL),
		new nyc.ol.Popup(map),
		new nyc.Pager(),
		lang
	);

});