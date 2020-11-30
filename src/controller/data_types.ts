import { DewTempType } from '../gauges/dew.js';
// @ts-ignore
import steelseries from '../libs/steelseries.js';

export interface ControllerConfig {
	weatherProgram: WProgram,
	realTimeUrl: string,

	realtimeInterval: number,
	graphUpdateTime: number,
	stationTimeout: number,
	pageUpdateLimit: number,
	pageUpdatePswd: string,

	showPopupData: boolean,
	showPopupGraphs: boolean,
	mobileShowGraphs: boolean,

	roundCloudbaseVal: boolean, 

	useCookies: boolean,
	dashboardMode: boolean,                 
}

export interface GaugeConfig {
	minMaxArea            : string,
	windAvgArea           : string,
	windVariationSector   : string,
	shadowColour          : string,

	gaugeScaling: number,
	gaugeMobileScaling: number,
	showGaugeShadow: boolean,

	digitalFont: boolean,
	digitalForecast: boolean,

	frameDesign           : steelseries.FrameDesign,
	background            : steelseries.BackgroundColor,
	foreground            : steelseries.ForegroundType,
	pointer               : steelseries.PointerType,
	pointerColour         : steelseries.ColorDef,
	dirAvgPointer         : steelseries.PointerType,
	dirAvgPointerColour   : steelseries.ColorDef,
	gaugeType             : steelseries.GaugeType,
	lcdColour             : steelseries.LcdColor,
	knob                  : steelseries.KnobType,
	knobStyle             : steelseries.KnobStyle,
	labelFormat           : steelseries.LabelNumberFormat,
	tickLabelOrientation  : steelseries.TickLabelOrientation,

	tempTrendVisible      : boolean,
	showIndoorTempHum: boolean,
	dewDisplayType: DewTempType,

	pressureTrendVisible  : boolean,
	rainUseSectionColours : boolean,
	rainUseGradientColours: boolean,
	
	uvLcdDecimals         : number,
	showSunshineLed: boolean,
	sunshineThreshold     : number,
	sunshineThresholdPct  : number,

	showWindVariation: boolean,
	showWindMetar: boolean,
	showRoseGaugeOdo: boolean,
	showRoseOnDirGauge: boolean,

	tempScaleDefMinC      : number,
	tempScaleDefMaxC      : number,
	tempScaleDefMinF      : number,
	tempScaleDefMaxF      : number,
	baroScaleDefMinhPa    : number,
	baroScaleDefMaxhPa    : number,
	baroScaleDefMinkPa    : number,
	baroScaleDefMaxkPa    : number,
	baroScaleDefMininHg   : number,
	baroScaleDefMaxinHg   : number,
	windScaleDefMaxMph    : number,
	windScaleDefMaxKts    : number,
	windScaleDefMaxMs     : number,
	windScaleDefMaxKmh    : number,
	rainScaleDefMaxmm     : number,
	rainScaleDefMaxIn     : number,
	rainRateScaleDefMaxmm : number,
	rainRateScaleDefMaxIn : number,
	uvScaleDefMax         : number,
	solarGaugeScaleMax    : number,

	cloudScaleDefMaxft    : number,
	cloudScaleDefMaxm     : number
}

export interface DisplayUnits {
	temp   : string,
	rain   : string,
  press  : string,
  wind   : string,
  windrun: string,
  cloud  : string
}


export interface CustomConfig {
	// ****************************************************
	//            Controller Config properties
	// ****************************************************

	/** The Wheather program that provides real time data (Type.Program.[...]) */
	weatherProgram: WProgram,
	/** The location of your customclientraw.txt */
	realTimeUrl: string,

	/** Download data interval, set to your realtime data update interval in seconds (default: 15) */
	realtimeInterval?: number,
	
	/** Period of pop-up data graph refresh, in minutes (default: 15) */
	graphUpdateTime?: number,
	
	/** Period of no data change before we declare the station off-line, in minutes (default: 3) */
	stationTimeout?: number,

	/** Period after which the page stops automatically updating, in minutes (default: 20) [Set to 0 (zero) to disable this feature] */
	pageUpdateLimit?: number,
	/** Password to override the page updates time-out, do not set to blank even if you do not use a password - http://<RealTimeURL>&pageUpdate=its-me */
	pageUpdatePswd?: string,

	
	//TODO rimuovere?
	gaugeScaling?: number,	
	gaugeMobileScaling?: number, // scaling factor to apply when displaying the gauges mobile devices, set to 1 to disable (default 0.85)
	
	
	/** Font control for the gauges & timer (default: false) */
	digitalFont?: boolean,
	/** 
	 * Font control for the status display (default: false)
	 * @description set this to false for languages that use accented characters in the forecasts!
	 */
	digitalForecast?: boolean,


	//TODO rimuovere?
	showPopupData?: boolean,                   // Pop-up data displayed
	showPopupGraphs?: boolean,                   // If pop-up data is displayed, show the graphs?
	mobileShowGraphs?: boolean,                  // If false, on a mobile/narrow display, always disable the graphs

	/** Round the value shown on the cloud base gauge to make it easier to read (default: true) */
	roundCloudbaseVal?: boolean,

		 
	/** Persistently store user preferences in a cookie? (default: true) */
	useCookies?: boolean,

	/** Used by Cumulus MX dashboard, ignored with other wheather programs (default: false) */
	dashboardMode?: boolean,



	// ****************************************************
	//             Gauge Config properties
	// ****************************************************

	/** Sector color for today's max/min
	 * @description Must be an'rgba color! ['rgba(RED, GREEN, BLUE, TRANSPARENCY)']
	 */
	minMaxArea?          : string,
	/** Sector color for today's avg/latest wind direction
	 * @description Must be an'rgba color! ['rgba(RED, GREEN, BLUE, TRANSPARENCY)']
	 */
	windAvgArea?         : string,
	/** Sector color for rose data in WindDir Gauge
	 * @description Must be an'rgba color! ['rgba(RED, GREEN, BLUE, TRANSPARENCY)']
	 */
	windVariationSector? : string, // only used when rose data is shown on direction gauge

	frameDesign?          : steelseries.FrameDesign,
	background?           : steelseries.BackgroundColor,
	foreground?           : steelseries.ForegroundType,
	pointer?              : steelseries.PointerType,
	pointerColour?        : steelseries.ColorDef,
	dirAvgPointer?        : steelseries.PointerType,
	dirAvgPointerColour?  : steelseries.ColorDef,
	gaugeType?            : steelseries.GaugeType,
	lcdColour?            :  steelseries.LcdColor,
	knob?                 : steelseries.KnobType,
	knobStyle?            : steelseries.KnobStyle,
	labelFormat?				  : steelseries.LabelNumberFormat,
	tickLabelOrientation? : steelseries.TickLabelOrientation, // was .NORMAL up to v1.6.4

	
	/** Show a drop shadow outside the gauges (default: true) */
	showGaugeShadow?: boolean,
	/** Colour to use for gauge shadows - default 30% transparent black */
	shadowColour?: string

	/** Show the indoor temperature/humidity options (default: false) */
	showIndoorTempHum?: boolean,
	/** Show Trend in Temp gauge (default: true) */
	tempTrendVisible?       : boolean,
	/** Show trend in Baro Gauge (default: true) */
	pressureTrendVisible?   : boolean,

	/** Initial 'scale' to display on the Dew Gauge (default: Type.DewDisplay.APPARENT) */
	dewDisplayType?: DewTempType
	/** Show variation in wind direction over the last 10 minutes on the direction gauge (dfault: true) */
	showWindVariation?: boolean,
	/** Show the METAR substring for wind speed/direction over the last 10 minutes on the direction gauge popup (dafeult: false) */
	showWindMetar?: boolean,
	
	/** Show 'sun shining now' LED on Solar Gauge (default: true) */
	showSunshineLed?: boolean,

	/** Show  wind run Odometer on Wind Rose Gauge (default: true) */
	showRoseGaugeOdo?: boolean,
	/** Show the wind rose data as sectors on the  Wind Direction Gauge (default: true) */
	showRoseOnDirGauge?: boolean,

	/** Use section color in Rain Gauge. (default: false)
	 * @description Use this instead of rainUseGradientColours!
	 */
	rainUseSectionColours?  : boolean, 
	/** Use gradient color in Rain Gauge. (default: false)
	 * @description Use this instead of rainUseSectionColours!
	 */
	rainUseGradientColours? : boolean,


	// ****************************************************
	//             Measure Units properties
	// ****************************************************
	tempUnit?: string,
	rainUnit?: string,
	pressUnit?: string,
	windUnit?: string,
	cloudUnit?: string
}

export enum WProgram {
	CUMULUS, WHEATHER_DISPLAY, VWS,
	WHEATHER_CAT, METEO_BRIDGE, W_VIEW,
	WEE_WX, WLCOM
}

export enum StatusType { 
	LOADING, OK, STATION_OFFLINE, SENSOR_CONTACT_LOST, TIMEOUT, ERROR, FATAL_ERROR 
};