import { c2f, f2c, ft2m, hpa2inhg, hpa2kpa, in2mm, inhg2hpa, km2miles, km2nmiles, kmh2ms, kpa2hpa, kts2ms, m2ft, miles2km, mm2in, mph2ms, ms2kmh, ms2kts, ms2mph, nmiles2km } from "weather-units-conversion";
import { CloudUnit, Lang, PressUnit, RainUnit, RawData, RtData, TempUnit, WindUnit } from "./types";

//TODO remove
export const ERR_VAL = -9999;
/*
export const OLD_parseRawData = (rawData: RawData) => {
	let data: RtData = {
		date: rawData.date,
		timeUTC: rawData.timeUTC,
		dateFormat: rawData.dateFormat,
		SensorContactLost: +rawData.SensorContactLost,
		forecast: rawData.forecast,

		tempunit: parseTempunit(rawData.tempunit),
		temp: rawData.temp,
		temptrend: rawData.temptrend,
		tempTL: rawData.tempTL,
		tempTH: rawData.tempTH,
		dew: rawData.dew,
		dewpointTL: rawData.dewpointTL,
		dewpointTH: rawData.dewpointTH,
		apptemp: rawData.apptemp,
		apptempTL: rawData.apptempTL,
		apptempTH: rawData.apptempTH,
		wchill: rawData.wchill,
		wchillTL: rawData.wchillTL,
		heatindex: rawData.heatindex,
		heatindexTH: rawData.heatindexTH,
		humidex: rawData.humidex,
		intemp: rawData.intemp,
		intempTL: rawData.intempTL,
		intempTH: rawData.intempTH,
		
		TtempTL: rawData.TtempTL,
		TtempTH: rawData.TtempTH,
		TintempTL: rawData.TintempTL,
		TintempTH: rawData.TintempTH,
		TdewpointTL: rawData.TdewpointTL,
		TdewpointTH: rawData.TdewpointTH,
		TapptempTL: rawData.TapptempTL,
		TapptempTH: rawData.TapptempTH,
		TwchillTL: rawData.TwchillTL,
		TheatindexTH: rawData.TheatindexTH,

		windunit: parseWindunit(rawData.windunit),                                                                                                                                            
		wlatest: rawData.wlatest,
		wspeed: rawData.wspeed,
		windTM: rawData.windTM,
		wgust: rawData.wgust,
		wgustTM: rawData.wgustTM,
		
		domwinddir: rawData.domwinddir,
		bearing: rawData.bearing,
		avgbearing: rawData.bearing,
		BearingRangeFrom10: rawData.bearing,
		BearingRangeTo10: rawData.bearing,
		bearingTM: rawData.bearing,
		windrun: rawData.windrun,
		WindRoseData: rawData.WindRoseData,
		Tbeaufort: rawData.Tbeaufort,
		TwgustTM: rawData.TwgustTM,

		pressunit: parsePressunit(rawData.pressunit),
		press: rawData.press,
		presstrendval: rawData.presstrendval,
		pressL: rawData.pressL,
		pressH: rawData.pressH,
		pressTL: rawData.pressTL,
		pressTH: rawData.pressTH,
		TpressTL: rawData.TpressTL,
		TpressTH: rawData.TpressTH,

		rainunit: parseRainunit(rawData.rainunit),
		rfall: rawData.rfall,
		hourlyrainTH: rawData.hourlyrainTH,
		rrate: rawData.rrate,
		rrateTM: rawData.rrateTM,
		TrrateTM: rawData.TrrateTM,
		ThourlyrainTH: rawData.ThourlyrainTH,
		LastRainTipISO: rawData.LastRainTipISO,
		LastRained: '',

		hum: rawData.hum,
		humTL: rawData.humTL,
		humTH: rawData.humTH,
		inhum: rawData.inhum,
		inhumTL: rawData.inhumTL,
		inhumTH: rawData.inhumTH,
		ThumTL: rawData.ThumTL,
		ThumTH: rawData.ThumTH,
		TinhumTL: rawData.TinhumTL,
		TinhumTH: rawData.TinhumTH,
		
		UV: rawData.UV,
		UVTH: rawData.UVTH,
		SolarRad: rawData.SolarRad,
		CurrentSolarMax: rawData.CurrentSolarMax,
		SolarTM: rawData.SolarTM,

		cloudbaseunit: parseCloudunit(rawData.cloudbaseunit),
		cloudbasevalue: rawData.cloudbasevalue,

		version: rawData.version,
		build: rawData.build,
		ver: rawData.ver
	}
	return data;
}
*/

export const parseRawData = (raw: RawData): RtData => {
	return {
		...raw,

		tempunit: parseTempunit(raw.tempunit),
		windunit: parseWindunit(raw.windunit),
		pressunit: parsePressunit(raw.pressunit),
		rainunit: parseRainunit(raw.rainunit),
		cloudbaseunit: parseCloudunit(raw.cloudbaseunit),

		LastRained: "",

		timerState: true,
		timerReset: true
	}
}


/**
 * 
 * @param data
 * @param lang 
 */
export const parseLastRain = ({ LastRainTipISO, dateFormat }: RtData, lang: Lang) => {
	try {
		let [date, time] = LastRainTipISO.split(' '); 
		//let dt = date.replace(/\//g, '-').split('-');  // WD uses dd/mm/yyyy, we use a '-' //CLEANUP
		let dt = date.split('/');
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


export const isStationOffline = ({ timeUTC }: RtData, stationTimeout: number, lang: Lang) => {
	let now = Date.now();
	let tmp = timeUTC.split(',');
	//console.log("tmp: " + tmp);
	let sampleDate = Date.UTC(+tmp[0], +tmp[1] - 1, +tmp[2], +tmp[3], +tmp[4], +tmp[5]);

	let elapsedMins = Math.floor((now - sampleDate) / (1000 * 60));
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
	
	return;
}



// =======================================
// ===         DATA CONVERSION         ===
// =======================================

/**
 * convTempData() converts all the temperature values using the supplied conversion function
 * @param data 
 */
export const convTempData = (data: RtData, to: TempUnit) => {
	if(data.tempunit === to) return;

	const convFunc = (to === "°C") ? f2c : c2f;
	data.apptemp = convFunc(data.apptemp, 1);
	data.apptempTH = convFunc(data.apptempTH, 1);
	data.apptempTL = convFunc(data.apptempTL, 1);
	data.dew = convFunc(data.dew, 1);
	data.dewpointTH = convFunc(data.dewpointTH, 1);
	data.dewpointTL = convFunc(data.dewpointTL, 1);
	data.heatindex = convFunc(data.heatindex, 1);
	data.heatindexTH = convFunc(data.heatindexTH, 1);
	data.humidex = convFunc(data.humidex, 1);
	data.intemp = convFunc(data.intemp, 1);
	if (data.intempTL && data.intempTH) {
			data.intempTL = convFunc(data.intempTL, 1);
			data.intempTH = convFunc(data.intempTH, 1);
	}
	data.temp = convFunc(data.temp, 1);
	data.tempTH = convFunc(data.tempTH, 1);
	data.tempTL = convFunc(data.tempTL, 1);
	data.wchill = convFunc(data.wchill, 1);
	data.wchillTL = convFunc(data.wchillTL, 1);
	data.temptrend = to === "°F"
		? toFixedNumber((data.temptrend * 9 / 5), 1)
		: toFixedNumber((data.temptrend * 5 / 9), 1)
	data.tempunit = to;
}

/**
 * convRainData() converts all the rain data units using the supplied conversion function
 * @param data 
 */
export const convRainData = (data: RtData, to: RainUnit) => {
	if(data.rainunit === to) return;

	const convFunc = to === "in" ? mm2in : in2mm;
	const precision = to === "in" ? 2 : 1;
	data.rfall = convFunc(data.rfall, precision);
	data.rrate = convFunc(data.rrate, precision);
	data.rrateTM = convFunc(data.rrateTM, precision);
	data.hourlyrainTH = convFunc(data.hourlyrainTH, precision);
	data.rainunit = to;
}

/**
 * convWindData() converts all the wind values using the supplied conversion function
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
	data.wgust = toFunc1(fromFunc1(data.wgust), 1);
	data.wgustTM = toFunc1(fromFunc1(data.wgustTM), 1);
	data.windTM = toFunc1(fromFunc1(data.windTM), 1);
	data.windrun = toFunc2(fromFunc2(data.windrun), 1);
	data.wlatest = toFunc1(fromFunc1(data.wlatest), 1);
	data.wspeed = toFunc1(fromFunc1(data.wspeed), 1);
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



// =======================================
// ===         OTHER FUNCTIONS         ===
// =======================================

const toFixedNumber = (num: number, digits: number, base?: number) => {
  var pow = Math.pow(base||10, digits);
  return Math.round(num * pow) / pow;
}


const parseTempunit = (str: string) => {
	if(str) {
			str = "°" + str;

		if(str === "°C" || str === "°F")
			return str;
	}
	return "";
}
const parseRainunit = (str: string) => {
	if(str === "mm" || str === "in")
		return str;
	
	return "";
}
const parsePressunit = (str: string) => {
	if(str) {
		// WView sends ' in', ' mb', or ' hPa'
		//str = str.trim();
		//if(str === 'in') str = "inHg"; // Cumulus and WView send 'in'

		if(str === "hPa" || str === "inHg" || str === "mb" || str === "kPa")
			return str;
	}
	return "";
}
const parseWindunit = (str: string) => {
	if(str) {
		// WView sends ' kmh' etc -- WeatherCat sends "MPH"
		//str = str.trim().toLowerCase();
		/*if (str === 'knots') // WeatherCat/weewx send "Knots", we use "kts"
			str = "kts" 
		else if (str === 'kmh' || str === 'kph') // WD wind unit omits '/', weewx sends 'kph' 
			str = "km/h";*/

		if (str === 'kmh') str = "km/h"

		if(str === "km/h" || str === "m/s" || str === "mph" || str === "kts")
			return str;
	}
	return "";
}
const parseCloudunit = (str: string) => {
	if(str) {
		// change WeatherCat units from Metres/Feet to m/ft
		/*if (str.toLowerCase() === 'metres')
			str = "m";
		else if (str.toLowerCase() === 'feet')
			str = "ft";*/

		if(str === "m" || str === "ft")
			return str;
	}
	return "";
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