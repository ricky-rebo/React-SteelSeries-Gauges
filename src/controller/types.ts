import { LedColor } from "steelseries";

export interface ControllerConfig {
	realTimeUrl: string,
	realtimeInterval: number,
	stationTimeout: number,
	pageUpdateLimit: number,
	useCookies: boolean,              
}

export type TempUnit = "°C"|"°F"|"";
export type RainUnit = "mm"|"in"|"";
export type PressUnit = "hPa"|"inHg"|"mb"|"kPa"|"";
export type WindUnit = "km/h"|"m/s"|"mph"|"kts"|"";
export type WindrunUnit = "km"|"miles"|"n.miles"|"";
export type CloudUnit = "m"|"ft"|"";
export interface DisplayUnits {
	temp: TempUnit,
	rain: RainUnit,
  press: PressUnit,
  wind: WindUnit,
  windrun: WindrunUnit,
  cloud: CloudUnit
}

export interface CustomConfig {
	// ****************************************************
	//            Controller Config properties
	// ****************************************************

	/** The location of your customclientraw.txt */
	realTimeUrl: string,

	/** Download data interval, set to your realtime data update interval in seconds (default: 15) */
	realtimeInterval?: number,
	
	/** Period of no data change before we declare the station off-line, in minutes (default: 3) */
	stationTimeout?: number,

	/** Period after which the page stops automatically updating, in minutes (default: 20) [Set to 0 (zero) to disable this feature] */
	pageUpdateLimit?: number,
		 
	/** Persistently store user preferences in a cookie? (default: true) */
	useCookies?: boolean,

	tempUnit?: TempUnit,
	rainUnit?: RainUnit,
  pressUnit?: PressUnit,
  windUnit?: WindUnit,
  cloudUnit?: CloudUnit
}


export enum StatusType { 
	LOADING = "LOADING",
	OK = "OK",
	WARNING = "WARNING",
	ERROR = "ERROR"
};

export interface StatusDef {
	readonly type: StatusType,

	readonly ledColor: LedColor,
	readonly ledState: "on"|"blink"|"off",
	//readonly ledBlink: boolean,

	readonly timerState: boolean,
	
	ledTitle: string,
	statusMsg: string,
	timerReset: number
}


export interface Lang {
	canvasnosupport: string,
	//
	led_title         : string,
	led_title_ok      : string,
	led_title_lost    : string,
	led_title_unknown : string,
	led_title_offline : string,
	//
	weather           : string,
	latitude          : string,
	longitude         : string,
	elevation         : string,
	//
	statusStr         : string,
	StatusMsg         : string,
	StatusHttp        : string,
	StatusRetry       : string,
	StatusRetryIn     : string,
	StatusTimeout     : string,
	StatusPageLimit   : string,
	//
	StatusLastUpdate  : string,
	StatusMinsAgo     : string,
	StatusHoursAgo    : string,
	StatusDaysAgo     : string,
	//
	realtimeCorrupt   : string,
	//
	timer             : string,
	at                : string,
	//
	temp_title_out    : string,
	temp_title_in     : string,
	temp_out_info     : string,
	temp_out_web      : string,
	temp_in_info      : string,
	temp_in_web       : string,
	temp_trend_info   : string,
	//
	dew_title         : string,
	dew_info          : string,
	dew_web           : string,
	apptemp_title     : string,
	apptemp_info      : string,
	apptemp_web       : string,
	chill_title       : string,
	chill_info        : string,
	chill_web         : string,
	heat_title        : string,
	heat_info         : string,
	heat_web          : string,
	humdx_title       : string,
	humdx_info        : string,
	humdx_web         : string,
	//
	rain_title        : string,
	rrate_title       : string,
	rrate_info        : string,
	LastRain_info     : string,
	LastRainedT_info  : string,
	LastRainedY_info  : string,
	//
	hum_title_out     : string,
	hum_title_in      : string,
	hum_out_info      : string,
	hum_in_info       : string,
	hum_out_web       : string,
	hum_in_web        : string,
	//
	baro_title        : string,
	baro_info         : string,
	baro_trend_info   : string,
	//
	wind_title        : string,
	tenminavg_title   : string,
	tenminavgwind_info: string,
	maxavgwind_info   : string,
	tenmingust_info   : string,
	maxgust_info      : string,
	latest_title      : string,
	latestwind_info   : string,
	bearing_info      : string,
	latest_web        : string,
	tenminavg_web     : string,
	dominant_bearing  : string,
	calm              : string,
	windrose          : string,
	windruntoday      : string,
	//
	uv_title     : string,
	uv_levels    : [string, string, string, string, string, string],
	uv_headlines : [string, string, string, string, string, string],
	uv_details   : [string, string, string, string, string, string],
	//
	solar_title          : string,
	solar_currentMax     : string,
	solar_ofMax          : string,
	solar_maxToday       : string,
	//
	cloudbase_title      : string,
	cloudbase_popup_title: string,
	cloudbase_popup_text : string,
	feet              : string,
	metres            : string,
	miles             : string,
	n_miles           : string,
	km                : string,
	//
	lowest_info       : string,
	highest_info      : string,
	lowestF_info      : string,     // for proper translation of feminine words
	highestF_info     : string,    // for proper translation of feminine words
	//
	RisingVeryRapidly : string,
	RisingQuickly     : string,
	Rising            : string,
	RisingSlowly      : string,
	Steady            : string,
	FallingSlowly     : string,
	Falling           : string,
	FallingQuickly    : string,
	FallingVeryRapidly: string,
	//
	maximum_info      : string,
	max_hour_info     : string,
	minimum_info      : string,
	//
	coords            : [string, string, string, string, string, string, string, string, string, string, string, string, string, string, string, string],
	compass           : [string, string, string, string, string, string, string, string],
	months            : [string, string, string, string, string, string, string, string, string, string, string, string, ]
}

export interface RawData {
	date: string,
	timeUTC: string,
	dateFormat: string,
	forecast: string,

	tempunit: string,
	temp: number,
	temptrend: number,
	tempTL: number,
	tempTH: number,
	dew: number,
	dewpointTL: number,
	dewpointTH: number,
	apptemp: number,
	apptempTL: number,
	apptempTH: number,
	wchill: number,
	wchillTL: number,
	heatindex: number,
	heatindexTH: number,
	humidex: number,
	intemp: number,
	intempTL: number,
	intempTH: number,

	TtempTL: string,
	TtempTH: string,
	TintempTL: string,
	TintempTH: string,
	TdewpointTL: string,
	TdewpointTH: string,
	TapptempTL: string,
	TapptempTH: string,
	TwchillTL: string,
	TheatindexTH: string,

	windunit: string,
	wlatest: number,
	wspeed: number,
	windTM: number,
	wgust: number,
	wgustTM: number,
	TwgustTM: string,

	domwinddir: string,
	bearing: number,
	avgbearing: number,
	BearingRangeFrom10: number,
	BearingRangeTo10: number,
	bearingTM: number,
	windrun: number,
	WindRoseData: number[],
	Tbeaufort: string, //FIXME change to number (also in customclientrawlacal.txt)

	pressunit: string,
	press: number,
	presstrendval: number,
	pressL: number,
	pressH: number,
	pressTL: number,
	pressTH: number,
	TpressTL: string,
	TpressTH: string,

	rainunit: string,
	rfall: number,
	hourlyrainTH: number,
	rrate: number,
	rrateTM: number,
	TrrateTM: string,
	ThourlyrainTH: string,
	LastRainTipISO: string,

	hum: number,
	humTL: number,
	humTH: number,
	inhum: number,
	inhumTL: number,
	inhumTH: number,
	ThumTL: string,
	ThumTH: string,
	TinhumTL: string,
	TinhumTH: string,

	UV: number,
	UVTH: number,
	SolarRad: number,
	CurrentSolarMax: number,
	SolarTM: number,
	
	cloudbaseunit: string,
	cloudbasevalue: number,

	version: string,
	build: string,
	ver: number
}


export interface RtData extends Omit<RawData, "tempunit"|"windunit"|"pressunit"|"rainunit"|"cloudbaseunit"> {
	tempunit: TempUnit,
	windunit: WindUnit,
	windrununit: WindrunUnit
	pressunit: PressUnit,
	rainunit: RainUnit,
	cloudbaseunit: CloudUnit,

	LastRained: string,

	ledTitle?: string,
	timerState: boolean,
	timerReset: boolean
}