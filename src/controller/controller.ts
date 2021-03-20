import LedGauge from '../gauges/led';
import StatusScrollerGauge from '../gauges/status-scroller';
import StatusTimerGauge from '../gauges/status-timer';

import Cookies from 'universal-cookie/es6';

import { ControllerConfig, CustomConfig, DisplayUnits, /*GaugeConfig,*/ Lang, RawData, RtData, StatusDef, StatusType } from './types';
import { CONTROLLER_DEF/*, GAUGE_DEF*/, DISPLAY_UNITS, Status } from './defaults';
import { convBaroData, convCloudBaseData, convRainData, convTempData, convWindData, getWindrunUnits, isStationOffline, parseLastRain, parseRawData } from './utils';

const MIN_SCHEME_VER = 14;
const COOKIE_NAME = 'units';

export default class GaugesController {
	lang: Lang;
	config: ControllerConfig;
	//gaugeConfig: GaugeConfig;
	//commonParams: any;

	fetchController: AbortController;
	status: StatusDef = Status.Loading;
	displayUnits: DisplayUnits;
	data: RtData;

	gauges: string[] = [];
	dataUpdate: any[] = [];
	statusUpdate: any[] = [];
	
	firstRun: boolean = true;
	customUnits: boolean = false;
	cookies: Cookies;
	rtDownLoadTimer: NodeJS.Timeout;

	constructor(lang: Lang, config: CustomConfig) {
		this.config = {
			realTimeUrl       : config.realTimeUrl,
			realtimeInterval  : config.realtimeInterval ? config.realtimeInterval : CONTROLLER_DEF.realtimeInterval,
			stationTimeout    : config.stationTimeout ? config.stationTimeout : CONTROLLER_DEF.stationTimeout,
			pageUpdateLimit   : config.pageUpdateLimit ? config.pageUpdateLimit : CONTROLLER_DEF.pageUpdateLimit,
			useCookies        : (config.useCookies !== undefined) ? config.useCookies : CONTROLLER_DEF.useCookies,  
		}

		if(this.config.useCookies) {
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

		this.lang = lang;

		this.fetchController = new AbortController();

		this._checkRtRes = this._checkRtRes.bind(this);
		this._checkRtErr = this._checkRtErr.bind(this);
	}

	subscribe = (gaugeName: string, dataUpdFunct: any, statusUpdFunct?: any) => {
		this.gauges = this.gauges.concat(gaugeName);
		
		if(dataUpdFunct !== null)
			this.dataUpdate = this.dataUpdate.concat(dataUpdFunct);
		
		if(statusUpdFunct !== null && statusUpdFunct !== undefined)
			this.statusUpdate = this.statusUpdate.concat(statusUpdFunct);
	}

	start = () => {
		if(!this.gauges.some(gauge => gauge === LedGauge.NAME)) {
			throw "Led Gauge needed to start SteelSeries Wheather Gauges controller";
		}
		if(!this.gauges.some(gauge => gauge === StatusScrollerGauge.NAME)) {
			throw "StatusScroller Gauge needed to start SteelSeries Wheather Gauges controller";
		}
		if(!this.gauges.some(gauge => gauge === StatusTimerGauge.NAME)) {
			throw "Timer Gauge needed to start SteelSeries Wheather Gauges controller";
		}

		this._getRealTime();
		//DEBUG setTimeout(() => this._getRealTime(), 2000);

		if(this.config.pageUpdateLimit > 0) {
			setTimeout(
				() => {
					this._updateStatus(Status.Error, this.lang.StatusTimeout, this.lang.StatusPageLimit);
					console.log("[INFO] Controller Timeout")
				},
				this.config.pageUpdateLimit * 60 * 1000
			);	
		}
	}

	//FIXME check if it works
	stop() {
		clearTimeout(this.rtDownLoadTimer);
		this.fetchController.abort();
	}

	changeUnits({ temp, rain, press, wind, cloud }: Partial<DisplayUnits>) {
		let units: DisplayUnits = {...this.displayUnits};
		let somethingChanged = false;

		if(temp) {
			if(temp !== units.temp) {
				units.temp = temp;
				convTempData(this.data, temp);
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
				convWindData(this.data, wind);
				somethingChanged = true;
			}
		}

		if(cloud) {
			if(cloud !== units.cloud) {
				units.cloud = cloud;
				convCloudBaseData(this.data, cloud);
				somethingChanged = true;
			}
		}
		
		if(somethingChanged) {
			this.displayUnits = units;
			this._updateUnits(units);

			if(this.config.useCookies) {
				let expireDate = new Date();
				expireDate.setFullYear(expireDate.getFullYear() + 1);
				this.cookies.set('units', units, { path: '/', expires: expireDate })
			}
		}
	}

	getDisplayUnits = () => (this.displayUnits);

	_getRealTime = () => {
		//DEBUG
		//console.log("[CTRL] _getRealTime()");

		fetch(this.config.realTimeUrl, { method: 'get', signal: this.fetchController.signal })
		.then(res => res.json())
		.then(this._checkRtRes, this._checkRtErr);
	}

	_checkRtRes(dataObj: RawData) {
		//DEBUG
		//console.log("[CTRL] _checkRtRes()");

		if(dataObj.ver && dataObj.ver >= MIN_SCHEME_VER) {
			this._processData(dataObj);
			if(this.config.realtimeInterval > 0)
				this.rtDownLoadTimer = setTimeout(this._getRealTime, this.config.realtimeInterval * 1000);
			else
				this._getRealTime();
		}
		else {
			let rtFile = this.config.realTimeUrl.substr(this.config.realTimeUrl.lastIndexOf('/') + 1);
			this._updateStatus(
				Status.Error,
				`Your ${rtFile} file template needs to be updated! - Minimum version: ${MIN_SCHEME_VER} (Your version: ${dataObj.ver})`
			);
		}

		/*let delay: number = -1;
		if(this._processData(dataObj))
			delay = this.config.realtimeInterval;
		else 
			delay = 5//ERR_RT_RETRY;
		
		if(delay > 0)
			this.rtDownLoadTimer = setTimeout(this._getRealTime, delay * 1000);
		else
			this._getRealTime();*/
	}

	_checkRtErr(err: any) {
		//DEBUG
		console.log(`[CTRL] _checkRtErr(${err.name})`);

		// AbortError can be ignored
		// It's throwed when the controller manually abort the fetch request
		if(err.name === 'AbortError') return;

		let msg = err;
		if(err.name === "SyntaxError")
			msg = "Error: \"customclientraw.txt\" file not found! ";

		this._updateStatus(Status.Error, msg);
		//this.rtDownLoadTimer = setTimeout(this._getRealTime, ERR_RT_RETRY * 1000);

	}

	async _processData(rawData: RawData) {
		//DEBUG
		//console.log("[CTRL] _processData()");

		let data = parseRawData(rawData);

		if(this.status.type === StatusType.LOADING) {
			let units = undefined;
			if(this.config.useCookies && this.cookies) {
				units = this.cookies.get('units');
			}

			if(!units) {
				units = {
					temp: data.tempunit,
					rain: data.rainunit,
					press: data.pressunit,
					wind: data.windunit,
					windrun: getWindrunUnits(data.windunit),
					cloud: data.cloudbaseunit
				};

				if(this.config.useCookies && this.cookies) {
					let expireDate = new Date();
					expireDate.setFullYear(expireDate.getFullYear() + 1);
					this.cookies.set('units', units, { path: '/', expires: expireDate })
				}
			}

			this._updateUnits(units);

			data.timerState = true;
			this.firstRun = false;
		}


		
		// *** CHECK IF STATION IS OFFLINE ***
		let stationOffMsg = isStationOffline(data, this.config.stationTimeout, this.lang);
		if(!stationOffMsg || !this.data) {
			//TODO remove?
			data.dateFormat = data.dateFormat.replace('%', ''); //WD leaves a trailing % char from the tag
			

			// mainpulate the last rain time into something more friendly
			data.LastRained = parseLastRain(data, this.lang);


			// de-encode the forecast string if required (Cumulus support for extended characters)
			
			data.forecast = stationOffMsg ? stationOffMsg : stripHtml(data.forecast).trim();


			/* *** EVENTUAL DATA CONVERSION *** */
			
			// Temperature data conversion for display required?
			if (data.tempunit !== this.displayUnits.temp) {
				convTempData(data, this.displayUnits.temp); // temp needs converting
			}

			// Rain data conversion for display required?
			if (data.rainunit !== this.displayUnits.rain) {
				convRainData(data, this.displayUnits.rain); // rain needs converting
			}

			// Wind data conversion for display required?
			if (data.windunit !== this.displayUnits.wind) {
				convWindData(data, this.displayUnits.wind); // wind needs converting
			}

			// Pressure data conversion for display required?
			if (data.pressunit !== this.displayUnits.press) {
				convBaroData(data, this.displayUnits.press);
			}

			if (data.cloudbaseunit !== this.displayUnits.cloud) {
				convCloudBaseData(data, this.displayUnits.cloud); // Cloud height needs converting
			}

			//data.timerReset = this.config.realtimeInterval;

			if(stationOffMsg && this.status.type !== StatusType.WARNING) {
				this._updateStatus(Status.Warning, this.lang.led_title_offline);
			}
			else if(this.status.type !== StatusType.OK) {
				this._updateStatus(Status.OK);
				data.ledTitle = `${this.lang.led_title_ok}. ${this.lang.StatusLastUpdate}: ${data.date}`;
			}
			else if(this.status.type === StatusType.OK) {
				data.ledTitle = `${this.lang.led_title_ok}. ${this.lang.StatusLastUpdate}: ${data.date}`;
			}

			this.data = data;
		}
		else if(stationOffMsg) {
			this.data.forecast = stationOffMsg;
			this.data.timerReset = true;

			if(this.status.type !== StatusType.WARNING) {
				this._updateStatus(Status.Warning, this.lang.led_title_offline);
			}
		}

		/*
		if(stationOffMsg) {
			data.forecast = stationOffMsg;
			data.timerReset = this.config.realtimeInterval;
		}
		else if(this.status.type !== StatusType.OK) {
			this._updateStatus(Status.OK);
		}

		if(this.status.type === StatusType.OK) {
			data.ledTitle = `${this.lang.led_title_ok}. ${this.lang.StatusLastUpdate}: ${data.date}`;
		}*/

		//data.timerReset = this.config.realtimeInterval;

		//DEBUG
		console.log("[CTRL] Data processed:");
		console.log(this.data);

		//this.data = data;
		this._updateData(/*this.data*/);
	}


	/* *** Updates Pubblish *** */
	_updateData = (/*data: RtData*/) => {
		//DEBUG
		//console.log("[CTRL] _updateData()");

		if(this.data) {
			this.dataUpdate.forEach(fun => fun(this.data));
			this.data.timerReset = false;
		}
	}

	_updateUnits = (units: any) => {
		//DEBUG
		//console.log("[CTRL] _updateUnits()");

		this.displayUnits = units;
		this._updateData();
	}

	_updateStatus = (status: StatusDef, title?: string, msg?: string, timer?: number) => {
		//DEBUG
		console.log("[CTRL] _updateStatus()");

		if(title) status.ledTitle = title;
		if(msg) status.statusMsg = msg;
		if(timer && status.timerState) status.timerReset = timer;

		if(status.type === StatusType.ERROR) {
			//TODO use this.stop()?
			clearTimeout(this.rtDownLoadTimer);
			this.fetchController.abort();
		}

		console.log(`[CTRL] Status Update: ${this.status.type} > ${status.type}`)
		this.status = status;
		this.statusUpdate.forEach(upd => upd(this.status));
	}
}

/*
const setGaugeConfigs = (conf: CustomConfig) => {
	const def = GAUGE_DEF;
	let gaugeConfig: GaugeConfig = {
		minMaxArea          : conf.minMaxArea ? conf.minMaxArea : def.minMaxArea,
		windAvgArea         : conf.windAvgArea ? conf.windAvgArea : def.windAvgArea,
		windVariationSector : conf.windVariationSector ? conf.windVariationSector : def.windVariationSector,
		shadowColour        : conf.shadowColor ? conf.shadowColor : def.shadowColour,

		gaugeScaling       : conf.gaugeScaling ? conf.gaugeScaling : def.gaugeScaling,
		showGaugeShadow    : (conf.showGaugeShadow !== undefined) ? conf.showGaugeShadow : def.showGaugeShadow,

		frameDesign          : conf.frameDesign ? conf.frameDesign : def.frameDesign,
		background           : conf.background ? conf.background : def.background,
		foreground           : conf.foreground ? conf.foreground : def.foreground,
		pointer              : conf.pointer ? conf.pointer : def.pointer,
		pointerColor        : conf.pointerColor ? conf.pointerColor : def.pointerColor,
		dirAvgPointer        : conf.dirAvgPointer ? conf.dirAvgPointer : def.dirAvgPointer,
		dirAvgPointerColor  : conf.dirAvgPointerColor ? conf.dirAvgPointerColor : def.dirAvgPointerColor,
		gaugeType            : conf.gaugeType ? conf.gaugeType : def.gaugeType,
		lcdColor            : conf.lcdColor ? conf.lcdColor : def.lcdColor,
		knob                 : conf.knob ? conf.knob : def.knob,
		knobStyle            : conf.knobStyle ? conf.knobStyle : def.knobStyle,
		labelFormat          : conf.labelFormat ? conf.labelFormat : def.labelFormat,
		tickLabelOrientation : conf.tickLabelOrientation ? conf.tickLabelOrientation : def.tickLabelOrientation,

		showTempTrend      : (conf.showTempTrend !== undefined) ? conf.showTempTrend : def.showTempTrend,
		showIndoorTempHum : (conf.showIndoorTempHum !== undefined) ? conf.showIndoorTempHum : def.showIndoorTempHum,
		dewDisplayType    : conf.dewDisplayType ? conf.dewDisplayType : def.dewDisplayType ,

		showPressTrend   : (conf.showPressTrend !== undefined) ? conf.showPressTrend : def.showPressTrend,
		rainUseSectionColors  : (conf.rainUseSectionColors !== undefined) ? conf.rainUseSectionColors : def.rainUseSectionColors,
		rainUseGradientColors : (conf.rainUseGradientColors !== undefined) ? conf.rainUseGradientColors : def.rainUseGradientColors,
		
		uvLcdDecimals        : def.uvLcdDecimals,
		showSunshineLed      : (conf.showSunshineLed !== undefined) ? conf.showSunshineLed : def.showSunshineLed,
		sunshineThreshold    : def.sunshineThreshold,
		sunshineThresholdPct : def.sunshineThresholdPct,

		showWindVariation  : (conf.showWindVariation !== undefined) ? conf.showWindVariation : def.showWindVariation,
		showWindMetar      : (conf.showWindMetar !== undefined) ? conf.showWindMetar : def.showWindMetar,
		showRoseGaugeOdo   : (conf.showRoseGaugeOdo !== undefined) ? conf.showRoseGaugeOdo : def.showRoseGaugeOdo,
		showRoseOnDirGauge : (conf.showRoseOnDirGauge !== undefined) ? conf.showRoseOnDirGauge : def.showRoseOnDirGauge,     

		roundCloudbaseVal : (conf.roundCloudbaseVal !== undefined) ? conf.roundCloudbaseVal : def.roundCloudbaseVal,                   

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
}*/

const setDisplayUnits = ({ tempUnit, rainUnit, pressUnit, windUnit, cloudUnit }: CustomConfig) => {
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