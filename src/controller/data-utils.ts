import { CloudUnit, PressUnit, RainUnit, RawData, RtData, TempUnit, WindUnit } from "./data-types";

export const ERR_VAL = -9999;

export const parseRawData = (rawData: RawData) => {
	let data: RtData = {
		date: rawData.date ? rawData.date : "",
		timeUTC: rawData.timeUTC ? rawData.timeUTC : "",
		dateFormat: rawData.dateFormat ? rawData.dateFormat : "",
		SensorContactLost: rawData.SensorContactLost ? +rawData.SensorContactLost : 0,
		forecast: rawData.forecast ? rawData.forecast : "",

		tempunit: extractTempunit(rawData.tempunit),
		temp: extractDecimal(rawData.temp),
		temptrend: extractDecimal(rawData.temptrend),
		tempTL: extractDecimal(rawData.tempTL),
		tempTH: extractDecimal(rawData.tempTH),
		dew: extractDecimal(rawData.dew),
		dewpointTL: extractDecimal(rawData.dewpointTL),
		dewpointTH: extractDecimal(rawData.dewpointTH),
		apptemp: extractDecimal(rawData.apptemp),
		apptempTL: extractDecimal(rawData.apptempTL),
		apptempTH: extractDecimal(rawData.apptempTH),
		wchill: extractDecimal(rawData.wchill),
		wchillTL: extractDecimal(rawData.wchillTL),
		heatindex: extractDecimal(rawData.heatindex),
		heatindexTH: extractDecimal(rawData.heatindexTH),
		humidex: extractDecimal(rawData.humidex),
		intemp: extractDecimal(rawData.intemp),
		intempTL: rawData.intempTL ? extractDecimal(rawData.intempTL) : undefined,
		intempTH: rawData.intempTH ? extractDecimal(rawData.intempTH) : undefined,
		
		TtempTL: rawData.TtempTL ? rawData.TtempTL : "",
		TtempTH: rawData.TtempTH ? rawData.TtempTH : "",
		TintempTL: rawData.TintempTL,
		TintempTH: rawData.TintempTH,
		TdewpointTL: rawData.TdewpointTL ? rawData.TdewpointTL : "",
		TdewpointTH: rawData.TdewpointTH ? rawData.TdewpointTH : "",
		TapptempTL: rawData.TapptempTL ? rawData.TapptempTL : "",
		TapptempTH: rawData.TapptempTH ? rawData.TapptempTH : "",
		TwchillTL: rawData.TwchillTL ? rawData.TwchillTL : "",
		TheatindexTH: rawData.TheatindexTH ? rawData.TheatindexTH : "",

		windunit: extractWindunit(rawData.windunit),                                                                                                                                            
		wlatest: extractDecimal(rawData.wlatest),
		wspeed: extractDecimal(rawData.wspeed),
		windTM: extractDecimal(rawData.windTM),
		wgust: extractDecimal(rawData.wgust),
		wgustTM: extractDecimal(rawData.wgustTM),
		
		domwinddir: rawData.domwinddir ? rawData.domwinddir : "",
		bearing: extractInteger(rawData.bearing),
		avgbearing: extractInteger(rawData.bearing),
		BearingRangeFrom10: extractInteger(rawData.bearing),
		BearingRangeTo10: extractInteger(rawData.bearing),
		bearingTM: extractInteger(rawData.bearing),
		windrun: extractDecimal(rawData.windrun),
		WindRoseData: rawData.WindRoseData,
		Tbeaufort: rawData.Tbeaufort ? rawData.Tbeaufort : "",
		TwgustTM: rawData.TwgustTM ? rawData.TwgustTM : "",

		pressunit: extractPressunit(rawData.pressunit),
		press: extractDecimal(rawData.press),
		presstrendval: extractDecimal(rawData.presstrendval),
		pressL: extractDecimal(rawData.pressL),
		pressH: extractDecimal(rawData.pressH),
		pressTL: extractDecimal(rawData.pressTL),
		pressTH: extractDecimal(rawData.pressTH),
		TpressTL: rawData.TpressTL ? rawData.TpressTL : "",
		TpressTH: rawData.TpressTH ? rawData.TpressTH : "",

		rainunit: extractRainunit(rawData.rainunit),
		rfall: extractDecimal(rawData.rfall),
		hourlyrainTH: extractDecimal(rawData.hourlyrainTH),
		rrate: extractDecimal(rawData.rrate),
		rrateTM: extractDecimal(rawData.rrateTM),
		TrrateTM: rawData.TrrateTM ? rawData.TrrateTM : '',
		ThourlyrainTH: rawData.ThourlyrainTH ? rawData.ThourlyrainTH : '',
		LastRainTipISO: rawData.LastRainTipISO ? rawData.LastRainTipISO : '',
		LastRained: '',

		hum: extractDecimal(rawData.hum),
		humTL: extractDecimal(rawData.humTL),
		humTH: extractDecimal(rawData.humTH),
		inhum: extractDecimal(rawData.inhum),
		inhumTL: rawData.inhumTL ? extractDecimal(rawData.inhumTL) : undefined,
		inhumTH: rawData.inhumTH ? extractDecimal(rawData.inhumTH) : undefined,
		ThumTL: rawData.ThumTL ? rawData.ThumTL : '',
		ThumTH: rawData.ThumTH ? rawData.ThumTH : '',
		TinhumTL: rawData.TinhumTL,
		TinhumTH: rawData.TinhumTH,
		
		UV: extractDecimal(rawData.UV),
		UVTH: extractDecimal(rawData.UVTH),
		SolarRad: extractInteger(rawData.SolarRad),
		CurrentSolarMax: extractInteger(rawData.CurrentSolarMax),
		SolarTM: extractInteger(rawData.SolarTM),

		cloudbaseunit: extractCloudunit(rawData.cloudbaseunit),
		cloudbasevalue: extractInteger(rawData.cloudbasevalue),

		version: rawData.version ? rawData.version : '',
		build: rawData.build ? rawData.build : '0',
		ver: rawData.ver ? +rawData.ver : -1
	}
	return data;
}


/**
 * 
 * @param data
 * @param lang 
 */
export const parseLastRain = ({ LastRainTipISO, dateFormat }: RtData, lang: any) => {
	try {
		let [date, time] = LastRainTipISO.split(' '); 
		let dt = date.replace(/\//g, '-').split('-');  // WD uses dd/mm/yyyy, we use a '-'
		let tm = time.split(':');

		let then: Date;
		switch(dateFormat) {
			case 'y/m/d':   // ISO/Cumulus format
				then = new Date(+dt[0], +dt[1] - 1, +dt[2], +tm[0], +tm[1], 0, 0); break;

			case 'd/m/y':
				then = new Date(+dt[2], +dt[1] - 1, +dt[0], +tm[0], +tm[1], 0, 0); break;
			
			default:  // US format (mm/dd/yyyyy)
				then = new Date(+dt[2], +dt[0] - 1, +dt[1], +tm[0], +tm[1], 0, 0);
		}

		let today: Date = new Date();
		today.setHours(0, 0, 0, 0);
		if (then.getTime() >= today.getTime()) {
			return lang.LastRainedT_info + ' ' + tm;
		}
		else if (then.getTime() + 86400000 >= today.getTime()) {
			return lang.LastRainedY_info + ' ' + tm;
		}
		else {
			return then.getDate().toString() + ' ' + lang.months[then.getMonth()] + ' ' + lang.at + ' ' + time;
		}
	}
	catch(e) { return LastRainTipISO }
	
}

/**
 * //TODO
 * @param data 
 * @param stationTimeout 
 * @param lang 
 */
export const isStationOffline = ({ timeUTC }: RtData, stationTimeout: number, lang: any) => {
	let now = Date.now();
	let tmp = timeUTC.split(',');
	//console.log("tmp: " + tmp);
	let sampleDate = Date.UTC(+tmp[0], +tmp[1] - 1, +tmp[2], +tmp[3], +tmp[4], +tmp[5]);

	let elapsedMins = Math.floor((now - sampleDate) / (1000 * 60));
	//console.log("now: " + now)
	//console.log("sample date: " + +sampleDate)
	//console.log("elapsed mins: " + elapsedMins)
	if(elapsedMins > stationTimeout) {
		let timeAgo: string;
		if(elapsedMins < 120) // up to 2 hours ago
			timeAgo = `${elapsedMins} ${lang.StatusMinsAgo}`;
		else if(elapsedMins < (2 * 24 * 60)) // up to 48 hours ago
			timeAgo = `${Math.floor(elapsedMins / 60)} ${lang.StatusHoursAgo}`;
		else // days ago
			timeAgo = `${Math.floor(elapsedMins / (60 * 24))} ${lang.StatusDaysAgo}`;
		return `${lang.led_title_offline} ${lang.StatusLastUpdate} ${timeAgo}`;
	}
	
	return null;
}

/**
 * //TODO 
 * @param data 
 */
export const calcCloudbase = ({ temp, tempunit, dew, cloudbaseunit }: RtData) => {
	var sprd = temp - dew;
	var cb = sprd * (tempunit === "°C" ? 400 : 227.3); // cloud base in feet
	if (cloudbaseunit === "m") {
			cb = +ft2m(cb);
	}
	return cb;
}

/**
 * convTempData() converts all the temperature values using the supplied conversion function
 * //TODO
 * @param data 
 */
export const convTempData = (data: RtData, to: TempUnit) => {
	if(data.tempunit === to) return;

	const convFunc = (to === "°C") ? f2c : c2f;
	data.apptemp = convFunc(data.apptemp);
	data.apptempTH = convFunc(data.apptempTH);
	data.apptempTL = convFunc(data.apptempTL);
	data.dew = convFunc(data.dew);
	data.dewpointTH = convFunc(data.dewpointTH);
	data.dewpointTL = convFunc(data.dewpointTL);
	data.heatindex = convFunc(data.heatindex);
	data.heatindexTH = convFunc(data.heatindexTH);
	data.humidex = convFunc(data.humidex);
	data.intemp = convFunc(data.intemp);
	if (data.intempTL && data.intempTH) {
			data.intempTL = convFunc(data.intempTL);
			data.intempTH = convFunc(data.intempTH);
	}
	data.temp = convFunc(data.temp);
	data.tempTH = convFunc(data.tempTH);
	data.tempTL = convFunc(data.tempTL);
	data.wchill = convFunc(data.wchill);
	data.wchillTL = convFunc(data.wchillTL);
	data.temptrend = to === "°F"
		? toFixedNumber((data.temptrend * 9 / 5), 1)
		: toFixedNumber((data.temptrend * 5 / 9), 1)
	data.tempunit = to;
}

/**
 * convRainData() converts all the rain data units using the supplied conversion function
 * //TODO
 * @param data 
 */
export const convRainData = (data: RtData, to: RainUnit) => {
	if(data.rainunit === to) return;

	const convFunc = to === "in" ? mm2in : in2mm;
	data.rfall = convFunc(data.rfall);
	data.rrate = convFunc(data.rrate);
	data.rrateTM = convFunc(data.rrateTM);
	data.hourlyrainTH = convFunc(data.hourlyrainTH);
	data.rainunit = to;
}

/**
 * convWindData() converts all the wind values using the supplied conversion function
 * //TODO
 * @param data
 * @param to 
 */
export const convWindData = function (data: RtData, to: WindUnit) {
	if(data.windunit === to) return;

	const from = data.windunit;
	let fromFunc1, toFunc1,
			fromFunc2, toFunc2;
	const dummy = (val: any) => val;

	// convert to m/s & km
	switch (from) {
		case 'mph':
				fromFunc1 = mph2ms;
				fromFunc2 = miles2km;
				break;
		case 'kts':
				fromFunc1 = kts2ms;
				fromFunc2 = nmiles2km;
				break;
		case 'km/h':
				fromFunc1 = kmh2ms;
				fromFunc2 = dummy;
				break;
		case 'm/s':
		default:
				fromFunc1 = dummy;
				fromFunc2 = dummy;
	}
	// conversion function from km to required units
	switch (to) {
		case 'mph':
				toFunc1 = ms2mph;
				toFunc2 = km2miles;
				break;
		case 'kts':
				toFunc1 = ms2kts;
				toFunc2 = km2nmiles;
				break;
		case 'km/h':
				toFunc1 = ms2kmh;
				toFunc2 = dummy;
				break;
		case 'm/s':
		default:
				toFunc1 = dummy;
				toFunc2 = dummy;
	}
	// do the conversions
	data.wgust = toFunc1(fromFunc1(data.wgust));
	data.wgustTM = toFunc1(fromFunc1(data.wgustTM));
	data.windTM = toFunc1(fromFunc1(data.windTM));
	data.windrun = toFunc2(fromFunc2(data.windrun));
	data.wlatest = toFunc1(fromFunc1(data.wlatest));
	data.wspeed = toFunc1(fromFunc1(data.wspeed));
	data.windunit = to;
}

/**
 * convBaroData() converts all the pressure values using the supplied conversion function
 * @param data 
 * @param to 
 */
export const convBaroData = function (data: RtData, to: PressUnit) {
	if(data.pressunit === to) return;
	let fromFunc, toFunc;
	const dummy = (val: any) => val;

	// convert to hPa
	switch (data.pressunit) {
		case 'hPa':
		case 'mb':
			fromFunc = dummy;
			break;
		case 'inHg':
			fromFunc = inhg2hpa;
			break;
		case 'kPa':
			fromFunc = kpa2hpa;
			break;
		default:
			throw "Invalid starting unit!";
	}
	// convert to required units
	switch (to) {
		case 'hPa':
		case 'mb':
			toFunc = dummy;
			break;
		case 'inHg':
			toFunc = hpa2inhg;
			break;
		case 'kPa':
			toFunc = hpa2kpa;
			break;
		default:
			throw "Invalid conversion unit!";
	}

	data.press = toFunc(fromFunc(data.press));
	data.pressH = toFunc(fromFunc(data.pressH));
	data.pressL = toFunc(fromFunc(data.pressL));
	data.pressTH = toFunc(fromFunc(data.pressTH));
	data.pressTL = toFunc(fromFunc(data.pressTL));
	data.presstrendval = toFunc(fromFunc(data.presstrendval), 3);
	data.pressunit = to;
}

/**
 * convCloudBaseData() converts all the cloud base data units using the supplied conversion function
 * @param data 
 */
export const convCloudBaseData = (data: RtData, to: CloudUnit) => {
	if(data.cloudbaseunit === to) return;

	const convFunc = to === "m" ? ft2m : m2ft;
	data.cloudbasevalue = convFunc(data.cloudbasevalue);
	data.cloudbaseunit = to;
}


// ======================================
// ===        UNITS CONVERSION        ===
// ======================================
const toFixedNumber = (num: number, digits: number, base?: number) => {
  var pow = Math.pow(base||10, digits);
  return Math.round(num * pow) / pow;
}

// Celsius to Fahrenheit
const c2f = (val: number) => toFixedNumber(((val * 9 / 5) + 32), 1);

// Fahrenheit to Celsius
const f2c = (val: number) => toFixedNumber(((val - 32) * 5 / 9), 1);

// mph to ms
const mph2ms = (val: number) => toFixedNumber((val * 0.447), 1);

// knots to ms
const kts2ms = (val: number) => toFixedNumber((val * 0.515), 1);

// kph to ms
const kmh2ms = (val: number) => toFixedNumber((val * 0.2778), 1);

// ms to kts
const ms2kts = (val: number) => toFixedNumber((val * 1.9426), 1);

// ms to mph
const ms2mph = (val: number) => toFixedNumber((val * 2.237), 1);

// ms to kph
const ms2kmh = (val: number) => toFixedNumber((val * 3.6), 1);

// mm to inches
const mm2in = (val: number) => toFixedNumber((val / 25.4), 2);

// inches to mm
const in2mm = (val: number) => toFixedNumber((val * 25.4), 1);

// miles to km
const miles2km = (val: number) => toFixedNumber((val * 1.609344), 1);

// nautical miles to km
const nmiles2km = (val: number) => toFixedNumber((val * 1.85200), 1);

// km to miles
const km2miles = (val: number) => toFixedNumber((val / 1.609344), 1);

// km to nautical miles
const km2nmiles = (val: number) => toFixedNumber((val / 1.85200), 1);

// hPa to inHg (@0°C)
const hpa2inhg = (val: number, decimals?: number) => toFixedNumber((val * 0.029528744), decimals || 3);

// inHg to hPa (@0°C)
const inhg2hpa = (val: number) => toFixedNumber((val / 0.029528744), 1);

// kPa to hPa
const kpa2hpa = (val: number) => toFixedNumber((val * 10), 1);

// hPa to kPa
const hpa2kpa = (val: number, decimals?: number) => toFixedNumber((val / 10), decimals || 2);

// m to ft
const m2ft = (val: number) => toFixedNumber((val * 3.2808399), 0);

//feet to meters
const ft2m = (val: number) => toFixedNumber((val / 3.2808399), 0);



// =======================================
// ===         OTHER FUNCTIONS         ===
// =======================================
const extractTempunit = (str?: string) => {
	if(str) {
		// clean up temperature units - remove html encoded degree symbols
		if(str.length > 1) str = str.replace(/&\S*;/, '°');
		else str = "°" + str;

		if(str === "°C" || str === "°F")
			return str;
	}
	return "";
}
const extractRainunit = (str?: string) => {
	if(str) {
		// WView sends ' mm' etc
		str = str.trim();

		if(str === "mm" || str === "in")
			return str;
	}
	return "";
}
const extractPressunit = (str?: string) => {
	if(str) {
		// WView sends ' in', ' mb', or ' hPa'
		str = str.trim();
		if(str === 'in') str = "inHg"; // Cumulus and WView send 'in'

		if(str === "hPa" || str === "inHg" || str === "mb" || str === "kPa")
			return str;
	}
	return "";
}
const extractWindunit = (str?: string) => {
	if(str) {
		// WView sends ' kmh' etc -- WeatherCat sends "MPH"
		str = str.trim().toLowerCase();
		if (str === 'knots') // WeatherCat/weewx send "Knots", we use "kts"
			str = "kts" 
		else if (str === 'kmh' || str === 'kph') // WD wind unit omits '/', weewx sends 'kph' 
			str = "km/h";

		if(str === "km/h" || str === "m/s" || str === "mph" || str === "kts")
			return str;
	}
	return "";
}
const extractCloudunit = (str?: string) => {
	if(str) {
		// change WeatherCat units from Metres/Feet to m/ft
		if (str.toLowerCase() === 'metres')
			str = "m";
		else if (str.toLowerCase() === 'feet')
			str = "ft";

		if(str === "m" || str === "ft")
			return str;
	}
	return "";
}

/**
 * extractDecimal() returns a decimal number from a string, the decimal point can be either a dot or a comma
 * it ignores any text such as pre/appended units
 * @param str 
 * @param errVal 
 */
export const extractDecimal = (str?: string, errVal?: number) => {
	if(str) {
		str = str.replace(',', '.');
		let val;
		if(val = (/[-+]?[0-9]+\.?[0-9]*/).exec(str))
			return +val[0];
	}

	return errVal || ERR_VAL; // error condition
}

/**
 * extractInteger() returns an integer from a string
 * it ignores any text such as pre/appended units
 * @param str 
 * @param errVal 
 */
export const extractInteger = (str?: string, errVal?: number) => {
	if(str) {
		let val;
		if(val = (/[-+]?[0-9]+/).exec(str))
			return +val[0];
	}
	
	return errVal || ERR_VAL;
}

/**
 * 
 * @param spdUnits 
 */
export const getWindrunUnits = function (spdUnits: WindUnit) {
	switch (spdUnits) {
		case 'mph': return 'miles';
		case 'kts': return 'n.miles';
		case 'km/h':
		case 'm/s':
		default: return 'km';
	}
}