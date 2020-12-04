// @ts-ignore
import steelseries from '../libs/steelseries';
// @ts-ignore
import LANG from './language';

import LedGauge from '../gauges/led';
import StatusScrollerGauge from '../gauges/status-scroller';
import StatusTimerGauge from '../gauges/status-timer';

// @ts-ignore
import { ControllerConfig, CustomConfig, DisplayUnits, GaugeConfig, RawData, RtData, StatusType, WProgram } from './data-types';
import { CONTROLLER_CONFIG, GAUGE_CONFIG, DISPLAY_UNITS, Status, UNITS } from './defaults';
import CloudBaseGauge from '../gauges/cloudbase';
import Cookies from 'universal-cookie/es6';
import { calcCloudbase, convBaroData, convCloudBaseData, convRainData, convTempData, getWindrunUnits, isStationOffline, parseLastRain } from './data-utils';

const ERR_RT_RETRY = 5;
const COOKIE_NAME = 'units';

export default class GaugesController {
	min_rt_ver: number
	controllerConfig: ControllerConfig;
	gaugeConfig: GaugeConfig;
	commonParams: any;

	lang: any;

	fetchController: AbortController;
	data: any = {};
	status: any = Status.Loading;

	gauges: string[] = [];
	dataUpdate: any[] = [];
	unitsUpdate: any[] = [];
	statusUpdate: any[] = [];
	
	displayUnits: DisplayUnits;
	firstRun: any = true;
	customUnits: boolean = false;
	cookies: Cookies;

	rtDownLoadTimer: NodeJS.Timeout;

	constructor(lang: LANG, config: CustomConfig) {
		this.controllerConfig = setControllerConfig(config);
		this.gaugeConfig = setGaugeConfigs(config);

		if(this.controllerConfig.useCookies) {
			this.cookies = new Cookies();
			let units = this.cookies.get(COOKIE_NAME);
			if(units) {
				this.displayUnits = units;
				this.customUnits = true;
			}
			else {
				let displUnits = setDisplayUnits(config);
				this.displayUnits = displUnits.units;
				this.customUnits = displUnits.customUnits;
				this.cookies.set(COOKIE_NAME, this.displayUnits, { path: '/' }); //TODO set expire date
			}
		}

		//dashboard mode used only by Cumulus MX!
		if(this.controllerConfig.weatherProgram !== WProgram.CUMULUS)
			this.controllerConfig.dashboardMode = false;

		this.lang = lang;


		// Common parameters for all the SteelSeries gauges
		this.commonParams = {
				fullScaleDeflectionTime: 4,             // Bigger numbers (seconds) slow the gauge pointer movements more
				gaugeType              : this.gaugeConfig.gaugeType,
				minValue               : 0,
				niceScale              : true,
				ledVisible             : false,
				frameDesign            : this.gaugeConfig.frameDesign,
				backgroundColor        : this.gaugeConfig.background,
				foregroundType         : this.gaugeConfig.foreground,
				pointerType            : this.gaugeConfig.pointer,
				pointerColor           : this.gaugeConfig.pointerColour,
				knobType               : this.gaugeConfig.knob,
				knobStyle              : this.gaugeConfig.knobStyle,
				lcdColor               : this.gaugeConfig.lcdColour,
				lcdDecimals            : 1,
				digitalFont            : this.gaugeConfig.digitalFont,
				tickLabelOrientation   : this.gaugeConfig.tickLabelOrientation,
				labelNumberFormat      : this.gaugeConfig.labelFormat
		}

		this.fetchController = new AbortController();

		this._checkRtRes = this._checkRtRes.bind(this);
		this._checkRtErr = this._checkRtErr.bind(this);
	}

	subscribe = (gaugeName: string, dataUpdFunct: any, unitsUpdFunct?: any, statusUpdFunct?: any) => {
		this.gauges = this.gauges.concat(gaugeName);
		
		if(dataUpdFunct !== null)
			this.dataUpdate = this.dataUpdate.concat(dataUpdFunct);

		if(unitsUpdFunct !== null && unitsUpdFunct !== undefined)
			this.unitsUpdate = this.unitsUpdate.concat(unitsUpdFunct);
		
		if(statusUpdFunct !== null && statusUpdFunct !== undefined)
			this.statusUpdate = this.statusUpdate.concat(statusUpdFunct);
	}

	start = () => {
		//TODO
		if(!this.gauges.some(gauge => gauge === LedGauge.NAME)) {
			throw "Led Gauge needed to start SteelSeries Wheather Gauges controller";
		}
		if(!this.gauges.some(gauge => gauge === StatusScrollerGauge.NAME)) {
			throw "StatusScroller Gauge needed to start SteelSeries Wheather Gauges controller";
		}
		if(!this.gauges.some(gauge => gauge === StatusTimerGauge.NAME)) {
			throw "Timer Gauge needed to start SteelSeries Wheather Gauges controller";
		}

		switch(this.controllerConfig.weatherProgram) {
			case WProgram.CUMULUS:
				this.min_rt_ver = 12;
				break;
			case WProgram.WHEATHER_DISPLAY:
				this.min_rt_ver = 12; //FIXME set to 14
				break;
			case WProgram.VWS:
				this.min_rt_ver = 11;
				//FIXME throw error if rose is present? + eventually disable showRoseOnDirGauge?
				//FIXME throw error if cloudbase gauge is present? why?
				break;
			case WProgram.WHEATHER_CAT:
				this.min_rt_ver = 14;
				break;
			case WProgram.METEO_BRIDGE:
				this.min_rt_ver = 10;
				this.controllerConfig.showPopupGraphs = false;        // config.tipImgs - no Meteobridge images available
				this.gaugeConfig.showWindVariation = false;      // no wind variation data from MB
				//FIXME throw error if rose is present? + eventually disable showRoseOnDirGauge?
				//FIXME throw error if cloudbase gauge is present? why?
				break;
			case WProgram.W_VIEW:
				this.min_rt_ver = 11;
				this.gaugeConfig.showSunshineLed = false;     // WView does not provide the current theoretical solar max required to determine sunshine
				this.gaugeConfig.showWindVariation = false;   // no wind variation from WView
				//FIXME throw error if rose is present? + eventually disable showRoseOnDirGauge?
				//FIXME throw error if cloudbase gauge is present? why?
				break;
			case WProgram.WEE_WX:
				this.min_rt_ver = 14;
				break;
			case WProgram.WLCOM:
				this.min_rt_ver = 10;
				this.controllerConfig.showPopupGraphs = false;        // config.tipImgs - no WL images available
				this.gaugeConfig.showWindVariation = false;      // no wind variation data from WL
				//FIXME throw error if rose is present? + eventually disable showRoseOnDirGauge?
				//FIXME throw error if cloudbase gauge is present? why?
				break;
			default:
				throw "[SS Gauges] Invalid Wheather Program Type";
		}

		//TODO get user sets units from cookie

		if(!this.controllerConfig.dashboardMode) {
			this._getRealTime();

			//TODO override page update if url param present and valid
			if(this.controllerConfig.pageUpdateLimit > 0) {
				setTimeout(() => this._updateStatus(Status.GaugesTimeout), this.controllerConfig.pageUpdateLimit * 60 * 1000);
			}
		}


		
	}

	changeUnits({ temp, rain, press, wind, cloud }: Partial<DisplayUnits>) {
		//TODO remove
		//console.log("changeUnits() called")
		let units: DisplayUnits = {...this.displayUnits};
		let somethingChanged = false;

		if(temp) {
			if(temp !== units.temp) {
				units.temp = temp;
				convTempData(this.data);
				somethingChanged = true;
			}
		}
	
		if(rain) {
			if(rain !== units.rain) {
				units.rain = rain;
				convRainData(this.data, rain);
				somethingChanged = true;
			}
		}

		if(press) {
			if(press !== units.press) {
				units.press = press;
				convBaroData(this.data, press);
				somethingChanged = true;
			}
		}

		if(wind) {
			if(wind !== units.wind) {
				units.wind = wind;
				units.windrun = getWindrunUnits(wind);
				convRainData(this.data, wind);
				somethingChanged = true;
			}
		}

		if(cloud) {
			if(cloud !== units.cloud) {
				units.cloud = cloud;
				convCloudBaseData(this.data);
				somethingChanged = true;
			}
		}
		
		if(somethingChanged) {
			this.displayUnits = units;
			this._updateUnits(units);

			if(this.controllerConfig.useCookies) {
				let expireDate = new Date();
				expireDate.setFullYear(expireDate.getFullYear() + 1);
				this.cookies.set('units', units, { path: '/', expires: expireDate })
			}
		}
		
		this.dataUpdate.forEach(upd => upd(this.data));
	}

	getDisplayUnits = () => (this.displayUnits);

	_getRealTime = () => {
		fetch(this.controllerConfig.realTimeUrl, { method: 'get', signal: this.fetchController.signal })
		.then(res => res.json())
		.then(this._checkRtRes, this._checkRtErr);
	}

	_checkRtRes(dataObj: any) {
		let delay: number;
		if(this._processData(dataObj))
			delay = this.controllerConfig.realtimeInterval;
		else 
			delay = ERR_RT_RETRY;
		
		if(delay > 0)
			this.rtDownLoadTimer = setTimeout(this._getRealTime, delay * 1000);
		else
			this._getRealTime();
	}

	_checkRtErr(err: any) {
		if(err.substr(0, err.indexOf(':')) !== 'AbortError') {
			this._updateStatus(Status.Error, err, ERR_RT_RETRY);
			this.rtDownLoadTimer = setTimeout(this._getRealTime, ERR_RT_RETRY * 1000);
		}
	}

	_processData = (/*rawdata: RawData*/rawdata: any) => {
		if(rawdata.ver && +rawdata.ver >= this.min_rt_ver) {  
			
			// *** CHECK IF STATION IS OFFLINE ***
			let stationOffMsg = isStationOffline(rawdata, this.controllerConfig.stationTimeout, this.lang);
			if(stationOffMsg !== null) {
				this._updateStatus(Status.StationOffline);
				rawdata.forecast = stationOffMsg;
			}
			else if(+rawdata.SensorContactLost === 1) {
				this._updateStatus(Status.SensorContactLost);
			} 
			else if(this.status.type !== 'OK') {
				this._updateStatus(Status.OK);
			}


			if(!rawdata.dateFormat) rawdata.dateFormat = 'y/m/d';
			else rawdata.dateFormat = rawdata.dateFormat.replace('%', ''); //WD leaves a trailing % char from the tag
			

			// mainpulate the last rain time into something more friendly
			rawdata.LastRained = parseLastRain(rawdata, this.lang);
	

			// de-encode the forecast string if required (Cumulus support for extended characters)
			rawdata.forecast = stripHtml(rawdata.forecast).trim();


			// clean up temperature units - remove html encoded degree symbols
			if(rawdata.tempunit.length > 1) rawdata.tempunit = rawdata.tempunit.replace(/&\S*;/, '°');  
			else rawdata.tempunit = '°' + rawdata.tempunit;
			

			// WView sends ' in', ' mb', or ' hPa'
			rawdata.pressunit = rawdata.pressunit.trim();
			if (rawdata.pressunit === 'in') // Cumulus and WView send 'in'
				rawdata.pressunit = UNITS.Press.INHG


			// WView sends ' kmh' etc -- WeatherCat sends "MPH"
			rawdata.windunit = rawdata.windunit.trim().toLowerCase();
			if (rawdata.windunit === 'knots') // WeatherCat/weewx send "Knots", we use "kts"
				rawdata.windunit = UNITS.Wind.Knots 
			else if (rawdata.windunit === 'kmh' || rawdata.windunit === 'kph') // WD wind unit omits '/', weewx sends 'kph' 
				rawdata.windunit = UNITS.Wind.KM_H 

			
			// WView sends ' mm' etc
			rawdata.rainunit = rawdata.rainunit.trim(); 


			// change WeatherCat units from Metres/Feet to m/ft
			if(!rawdata.cloudbaseunit)
				rawdata.cloudbaseunit = '';
			else if (rawdata.cloudbaseunit.toLowerCase() === 'metres')
				rawdata.cloudbaseunit = UNITS.Cloud.M;
			else if (rawdata.cloudbaseunit.toLowerCase() === 'feet')
				rawdata.cloudbaseunit = UNITS.Cloud.FT;
			if (this.gauges.some(gauge => gauge === CloudBaseGauge.NAME) && rawdata.cloudbasevalue === '' ) {
				// Some Wheather Programs (MeteoBridge? WeatherCat? VWS? WView?) do not provide a cloud base value, so we have to calculate it...
				// It isn't clear which programs, there are many logic inconsistencies in the original gauges.js
				// assume if the station uses an imperial wind speed they want cloud base in feet, otherwise metres
				rawdata.cloudbaseunit = (rawdata.windunit === UNITS.Wind.MPH || rawdata.windunit === UNITS.Wind.Knots)
					? UNITS.Cloud.FT
					: UNITS.Cloud.M;
				rawdata.cloudbasevalue = calcCloudbase(rawdata);
			}


			/* *** EVENTUAL DATA CONVERSION *** */
			if(this.firstRun) {
				//TODO get user pref units from cookie

				let units = null;
				if(this.controllerConfig.useCookies && this.cookies) {
					units = this.cookies.get('units');
				}

				if(!units || units === null) {
					units = {
						temp: rawdata.tempunit,
						rain: rawdata.rainunit,
						press: rawdata.pressunit,
						wind: rawdata.windunit,
						windrun: getWindrunUnits(rawdata.windunit),
						cloud: rawdata.cloudbaseunit
					};

					if(this.controllerConfig.useCookies && this.cookies) {
						let expireDate = new Date();
						expireDate.setFullYear(expireDate.getFullYear() + 1);
						this.cookies.set('units', units, { path: '/', expires: expireDate })
					}
				}

				this._updateUnits(units);

				rawdata.statusTimerStart = true;
				this.firstRun = false;
			}
			
			// Temperature data conversion for display required?
			if (rawdata.tempunit !== this.displayUnits.temp) {
				convTempData(rawdata); // temp needs converting
			}

			// Rain data conversion for display required?
			if (rawdata.rainunit !== this.displayUnits.rain) {
				convRainData(rawdata, this.displayUnits.rain); // rain needs converting
			}

			// Wind data conversion for display required?
			if (rawdata.windunit !== this.displayUnits.wind) {
				convRainData(rawdata, this.displayUnits.wind); // wind needs converting
			}

			// Pressure data conversion for display required?
			if (rawdata.pressunit !== this.displayUnits.press) {
				convBaroData(rawdata, this.displayUnits.press);
			}

			if (rawdata.cloudbaseunit !== this.displayUnits.cloud) {
				// Cloud height needs converting
				convCloudBaseData(rawdata);
				
			}

			rawdata.statusTimerReset = this.controllerConfig.realtimeInterval;

			//TODO remove
			console.log(rawdata);
			this._updateData(rawdata);

			return true;
		}
		else {
			if(rawdata.ver < this.min_rt_ver)
				this._updateStatus(Status.FatalError, `Your ${this.controllerConfig.realTimeUrl.substr(this.controllerConfig.realTimeUrl.lastIndexOf('/') + 1)} file template needs updating!`);
			else
				this._updateStatus(Status.Error, this.lang.realtimeCorrupt);
			return false;
		}
	}


	/* *** Updates Pubblish *** */
	_updateData = (data: any) => {
		this.data = data;
		this.dataUpdate.forEach(upd => upd(this.data));
	}

	_updateUnits = (units: any) => {
		this.displayUnits = units;
		this.unitsUpdate.forEach(upd => upd(units));
	}

	_updateStatus = (status: any, msg?: string, timer?: number) => {
		switch(status.type) {
			case StatusType.STATION_OFFLINE:
				status.ledTitle = this.lang.led_title_offline;
				//status.statusString = msg;
				break;
			case StatusType.SENSOR_CONTACT_LOST:
				status.ledTitle = this.lang.led_title_lost;
				status.statusString = this.lang.led_title_lost;
				break;
			case StatusType.TIMEOUT:
				status.ledTitle = this.lang.StatusTimeout;
				status.statusString = this.lang.StatusPageLimit;
				clearTimeout(this.rtDownLoadTimer);
				this.fetchController.abort();
				break;
			case StatusType.ERROR:
				status.ledTitle = this.lang.led_title_unknown;
				if(msg && msg !== "") status.statusString = msg;
				if(timer) status.statusTimerReset = timer;
				if(this.status.type === StatusType.LOADING) status.statusTimerStart = true;
				break;
			case StatusType.FATAL_ERROR:
				status.ledTitle = this.lang.led_title_unknown;
				if(msg && msg !== "") status.statusString = msg;
				clearTimeout(this.rtDownLoadTimer);
				this.fetchController.abort();
		}

		this.status = status;
		this.statusUpdate.forEach(upd => upd(this.status));
	}
}



const setControllerConfig = (conf: CustomConfig) => {
	let ret: ControllerConfig = {
		weatherProgram    : conf.weatherProgram,
		dashboardMode     : (conf.dashboardMode !== undefined) ? conf.dashboardMode : CONTROLLER_CONFIG.dashboardMode,
		realTimeUrl       : conf.realTimeUrl,
		realtimeInterval  : conf.realtimeInterval ? conf.realtimeInterval : CONTROLLER_CONFIG.realtimeInterval,
		graphUpdateTime   : conf.graphUpdateTime ? conf.graphUpdateTime : CONTROLLER_CONFIG.graphUpdateTime,
		stationTimeout    : conf.stationTimeout ? conf.stationTimeout : CONTROLLER_CONFIG.stationTimeout,
		pageUpdateLimit   : conf.pageUpdateLimit ? conf.pageUpdateLimit : CONTROLLER_CONFIG.pageUpdateLimit,
		pageUpdatePswd    : conf.pageUpdatePswd ? conf.pageUpdatePswd : CONTROLLER_CONFIG.pageUpdatePswd,

		showPopupData     : (conf.showPopupData !== undefined) ? conf.showPopupData : CONTROLLER_CONFIG.showPopupData,
		showPopupGraphs   : (conf.showPopupGraphs !== undefined) ? conf.showPopupGraphs : CONTROLLER_CONFIG.showPopupGraphs,
		mobileShowGraphs  : (conf.mobileShowGraphs !== undefined) ? conf.mobileShowGraphs : CONTROLLER_CONFIG.mobileShowGraphs, 
		roundCloudbaseVal : (conf.roundCloudbaseVal !== undefined) ? conf.roundCloudbaseVal : CONTROLLER_CONFIG.roundCloudbaseVal,                   

		useCookies        : (conf.useCookies !== undefined) ? conf.useCookies : CONTROLLER_CONFIG.useCookies,  
	}
	return ret;
}

const setGaugeConfigs = (conf: CustomConfig) => {
	const def = GAUGE_CONFIG;
	let gaugeConfig: GaugeConfig = {
		minMaxArea          : conf.minMaxArea ? conf.minMaxArea : def.minMaxArea,
		windAvgArea         : conf.windAvgArea ? conf.windAvgArea : def.windAvgArea,
		windVariationSector : conf.windVariationSector ? conf.windVariationSector : def.windVariationSector,
		shadowColour        : conf.shadowColour ? conf.shadowColour : def.shadowColour,

		gaugeScaling       : conf.gaugeScaling ? conf.gaugeScaling : def.gaugeScaling,
		gaugeMobileScaling : conf.gaugeMobileScaling ? conf.gaugeMobileScaling : def.gaugeMobileScaling,
		showGaugeShadow    : (conf.showGaugeShadow !== undefined) ? conf.showGaugeShadow : def.showGaugeShadow,

		digitalFont     : (conf.digitalFont !== undefined) ? conf.digitalFont : def.digitalFont,
		digitalForecast : (conf.digitalForecast !== undefined) ? conf.digitalForecast : def.digitalForecast,

		frameDesign          : conf.frameDesign ? conf.frameDesign : def.frameDesign,
		background           : conf.background ? conf.background : def.background,
		foreground           : conf.foreground ? conf.foreground : def.foreground,
		pointer              : conf.pointer ? conf.pointer : def.pointer,
		pointerColour        : conf.pointerColour ? conf.pointerColour : def.pointerColour,
		dirAvgPointer        : conf.dirAvgPointer ? conf.dirAvgPointer : def.dirAvgPointer,
		dirAvgPointerColour  : conf.dirAvgPointerColour ? conf.dirAvgPointerColour : def.dirAvgPointerColour,
		gaugeType            : conf.gaugeType ? conf.gaugeType : def.gaugeType,
		lcdColour            : conf.lcdColour ? conf.lcdColour : def.lcdColour,
		knob                 : conf.knob ? conf.knob : def.knob,
		knobStyle            : conf.knobStyle ? conf.knobStyle : def.knobStyle,
		labelFormat          : conf.labelFormat ? conf.labelFormat : def.labelFormat,
		tickLabelOrientation : conf.tickLabelOrientation ? conf.tickLabelOrientation : def.tickLabelOrientation,

		tempTrendVisible      : (conf.tempTrendVisible !== undefined) ? conf.tempTrendVisible : def.tempTrendVisible,
		showIndoorTempHum : (conf.showIndoorTempHum !== undefined) ? conf.showIndoorTempHum : def.showIndoorTempHum,
		dewDisplayType    : conf.dewDisplayType ? conf.dewDisplayType : def.dewDisplayType ,

		pressureTrendVisible   : (conf.pressureTrendVisible !== undefined) ? conf.pressureTrendVisible : def.pressureTrendVisible,
		rainUseSectionColours  : (conf.rainUseSectionColours !== undefined) ? conf.rainUseSectionColours : def.rainUseSectionColours,
		rainUseGradientColours : (conf.rainUseGradientColours !== undefined) ? conf.rainUseGradientColours : def.rainUseGradientColours,
		
		uvLcdDecimals        : def.uvLcdDecimals,
		showSunshineLed      : (conf.showSunshineLed !== undefined) ? conf.showSunshineLed : def.showSunshineLed,
		sunshineThreshold    : def.sunshineThreshold,
		sunshineThresholdPct : def.sunshineThresholdPct,

		showWindVariation  : (conf.showWindVariation !== undefined) ? conf.showWindVariation : def.showWindVariation,
		showWindMetar      : (conf.showWindMetar !== undefined) ? conf.showWindMetar : def.showWindMetar,
		showRoseGaugeOdo   : (conf.showRoseGaugeOdo !== undefined) ? conf.showRoseGaugeOdo : def.showRoseGaugeOdo,
		showRoseOnDirGauge : (conf.showRoseOnDirGauge !== undefined) ? conf.showRoseOnDirGauge : def.showRoseOnDirGauge,     

		tempScaleDefMinC      : def.tempScaleDefMinC,
		tempScaleDefMaxC      : def.tempScaleDefMaxC,
		tempScaleDefMinF      : def.tempScaleDefMinF,
		tempScaleDefMaxF      : def.tempScaleDefMaxF,
		baroScaleDefMinhPa    : def.baroScaleDefMinhPa,
		baroScaleDefMaxhPa    : def.baroScaleDefMaxhPa,
		baroScaleDefMinkPa    : def.baroScaleDefMinkPa,
		baroScaleDefMaxkPa    : def.baroScaleDefMaxkPa,
		baroScaleDefMininHg   : def.baroScaleDefMininHg,
		baroScaleDefMaxinHg   : def.baroScaleDefMaxinHg,
		windScaleDefMaxMph    : def.windScaleDefMaxMph,
		windScaleDefMaxKts    : def.windScaleDefMaxKts,
		windScaleDefMaxMs     : def.windScaleDefMaxMs,
		windScaleDefMaxKmh    : def.windScaleDefMaxKmh,
		rainScaleDefMaxmm     : def.rainScaleDefMaxmm,
		rainScaleDefMaxIn     : def.rainScaleDefMaxIn,
		rainRateScaleDefMaxmm : def.rainRateScaleDefMaxmm,
		rainRateScaleDefMaxIn : def.rainRateScaleDefMaxIn,
		uvScaleDefMax         : def.uvScaleDefMax,
		solarGaugeScaleMax    : def.solarGaugeScaleMax,

		cloudScaleDefMaxft    : def.cloudScaleDefMaxft,
		cloudScaleDefMaxm     : def.cloudScaleDefMaxm
	};
	return gaugeConfig;
}

const setDisplayUnits = ({ tempUnit, rainUnit, pressUnit, windUnit, cloudUnit }: Partial<CustomConfig>) => {
	let customUnits: boolean = false;
	if(tempUnit || rainUnit || pressUnit || windUnit || cloudUnit)
		customUnits = true;
	
	let displayUnits: DisplayUnits = {...DISPLAY_UNITS};
	if(tempUnit)
		displayUnits.temp = tempUnit;
	
	if(rainUnit)
		displayUnits.rain = rainUnit;

	if(pressUnit)
		displayUnits.press = pressUnit;

	if(windUnit) {
		displayUnits.wind = windUnit;
		displayUnits.windrun = getWindrunUnits(windUnit);
	}

	if(cloudUnit)
		displayUnits.cloud = cloudUnit;
	
	return {
		units: displayUnits,
		customUnits: customUnits
	}
}




function stripHtml(html: string) {
	var tmpDiv = document.createElement("div");
	tmpDiv.innerHTML = html;

	// Retrieve the text property of the element (cross-browser support)
	let ret = tmpDiv.textContent || tmpDiv.innerText || "";

	//FIXME fix special chars from wheather display
	ret = ret.replace('Ã', 'à');
	return ret;
}