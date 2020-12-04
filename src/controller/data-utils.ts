import { RawData, RtData } from "./data-types";
import { UNITS } from "./defaults";


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
 * @param param0 
 * @param lang 
 */
export const parseLastRain = ({ LastRainTipISO, dateFormat }: {LastRainTipISO: string, dateFormat: string}, lang: any) => {
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
 * @param param0 
 * @param stationTimeout 
 * @param lang 
 */
export const isStationOffline = ({ timeUTC }: { timeUTC: string }, stationTimeout: number, lang: any) => {
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
 * @param param0 
 */
export const calcCloudbase = ({temp, tempunit, dew, cloudbaseunit}: {temp: string, tempunit: string, dew: string, cloudbaseunit: string}) => {
	var sprd = +temp - +dew;
	var cb = sprd * (tempunit[1] === 'C' ? 400 : 227.3); // cloud base in feet
	if (cloudbaseunit === 'm') {
			cb = +ft2m(cb);
	}
	return cb;
}

/**
 * convTempData() converts all the temperature values using the supplied conversion function
 * //TODO
 * @param data 
 */
export const convTempData = (data: any) => {
	const convFunc = data.tempunit[1] === 'C' ? c2f : f2c;
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
	if (data.tempunit[1] === 'C') {
			data.temptrend = (+extractDecimal(data.temptrend) * 9 / 5).toFixed(1);
			data.tempunit = '°F';
	} else {
			data.temptrend = (+extractDecimal(data.temptrend) * 5 / 9).toFixed(1);
			data.tempunit = '°C';
	}

	//TODO REMOVE
	data.DEBUG = "TEMP DATA CONVERTED"
}

/**
 * convRainData() converts all the rain data units using the supplied conversion function
 * //TODO
 * @param data 
 */
export const convRainData = (data: any, to: string) => {
	const convFunc = to === UNITS.Rain.IN ? in2mm : mm2in;
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
export const convWindData = function (data: any, to: string) {
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
		// falls through
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
		// falls through
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
export const convBaroData = function (data: any, to: string) {
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
		// falls through
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
export const convCloudBaseData = (data: any) => {
	const convFunc = data.cloudbaseunit === 'm' ? m2ft : ft2m;
	data.cloudbasevalue = convFunc(data.cloudbasevalue);
	data.cloudbaseunit = data.cloudbaseunit === 'm' ? 'ft' : 'm';
}


// ======================================
// ===        UNITS CONVERSION        ===
// ======================================

// Celsius to Fahrenheit
const c2f = (val: any) => (extractDecimal(val) * 9 / 5 + 32).toFixed(1)

// Fahrenheit to Celsius
const f2c = (val: any) => ((extractDecimal(val) - 32) * 5 / 9).toFixed(1)

// mph to ms
const mph2ms = (val: any) => (extractDecimal(val) * 0.447).toFixed(1)

// knots to ms
const kts2ms = (val: any) => (extractDecimal(val) * 0.515).toFixed(1)

// kph to ms
const kmh2ms = (val: any) => (extractDecimal(val) * 0.2778).toFixed(1)

// ms to kts
const ms2kts = (val: any) => (extractDecimal(val) * 1.9426).toFixed(1)

// ms to mph
const ms2mph = (val: any) => (extractDecimal(val) * 2.237).toFixed(1)

// ms to kph
const ms2kmh = (val: any) => (extractDecimal(val) * 3.6).toFixed(1)

// mm to inches
const mm2in = (val: any) => (extractDecimal(val) / 25.4).toFixed(2)

// inches to mm
const in2mm = (val: any) => (extractDecimal(val) * 25.4).toFixed(1)

// miles to km
const miles2km = (val: any) => (extractDecimal(val) * 1.609344).toFixed(1)

// nautical miles to km
const nmiles2km = (val: any) => (extractDecimal(val) * 1.85200).toFixed(1)

// km to miles
const km2miles = (val: any) => (extractDecimal(val) / 1.609344).toFixed(1)

// km to nautical miles
const km2nmiles = (val: any) => (extractDecimal(val) / 1.85200).toFixed(1)

// hPa to inHg (@0°C)
const hpa2inhg = (val: any, decimals?: number) => (extractDecimal(val) * 0.029528744).toFixed(decimals || 3)

// inHg to hPa (@0°C)
const inhg2hpa = (val: any) => (extractDecimal(val) / 0.029528744).toFixed(1)

// kPa to hPa
const kpa2hpa = (val: any) => (extractDecimal(val) * 10).toFixed(1)

// hPa to kPa
const hpa2kpa = (val: any, decimals?: number) => (extractDecimal(val) / 10).toFixed(decimals || 2)

// m to ft
const m2ft = (val: any) => (val * 3.2808399).toFixed(0)

//feet to meters
const ft2m = (val: number) => (val / 3.2808399).toFixed(0)



// =======================================
// ===         OTHER FUNCTIONS         ===
// =======================================
const extractTempunit = (str?: string) => {
	if(str && (str === "°C" || str === "°F")) {
		return str;
	}
	return "";
}
const extractRainunit = (str?: string) => {
	if(str  && (str === "mm" || str === "in")) {
		return str;
	}
	return "";
}
const extractPressunit = (str?: string) => {
	if(str && (str === "hPa" || str === "inHg" || str === "mb" || str === "kPa")) {
		return str;
	}
	return "";
}
const extractWindunit = (str?: string) => {
	if(str && (str === "km/h" || str === "m/s" || str === "mph" || str === "kts")) {
		return str;
	}
	return "";
}
const extractCloudunit = (str?: string) => {
	if(str && (str === "m" || str === "ft")) {
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
export const extractDecimal = (str?: string|number, errVal?: number) => {
	if(str) {
		let newStr = str.toString();
		let val;
		if(val = (/[-+]?[0-9]+\.?[0-9]*/).exec(newStr.replace(',', '.')))
			return +val[0];
	}

	return errVal || -9999; // error condition
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
	
	return errVal || -9999;
}

/**
 * 
 * @param spdUnits 
 */
export const getWindrunUnits = function (spdUnits: string) {
	switch (spdUnits) {
		case 'mph': return 'miles';
		case 'kts': return 'n.miles';
		case 'km/h':
		case 'm/s':
		default: return 'km';
	}
}