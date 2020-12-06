import { ControllerConfig, DisplayUnits, GaugeConfig, StatusType, WProgram } from "./data-types";
// @ts-ignore
import { FrameDesign, BackgroundColor, ForegroundType, PointerType, ColorDef, GaugeType, LcdColor, LedColor, KnobType, KnobStyle, LabelNumberFormat, TickLabelOrientation } from "steelseries";
import { DewTemp } from "../gauges/data-types";

export const CONTROLLER_CONFIG: ControllerConfig = {
  weatherProgram: WProgram.CUMULUS,
  dashboardMode      : false,
  realTimeUrl: '',

  realtimeInterval   : 15,
  graphUpdateTime    : 15,
  stationTimeout     : 3,
  pageUpdateLimit    : 20,
  pageUpdatePswd     : 'its-me',
 
  showPopupData      : true,
  showPopupGraphs    : true,
  mobileShowGraphs   : false,

  roundCloudbaseVal  : true,

  useCookies         : true
}

export const GAUGE_CONFIG: GaugeConfig = {
  minMaxArea            : 'rgba(212,132,134,0.3)', // area sector for today's max/min. (red, green, blue, transparency)
  windAvgArea           : 'rgba(132,212,134,0.3)',
  windVariationSector   : 'rgba(120,200,120,0.7)', // only used when rose data is shown on direction gauge
  shadowColour          : 'rgba(0,0,0,0.3)',  // Colour to use for gauge shadows - default 30% transparent black
  
  gaugeScaling       : 1,
  gaugeMobileScaling : 0.85,
  showGaugeShadow    : true,
  
  digitalFont     : false,
  digitalForecast : false,

  frameDesign          : FrameDesign.TILTED_GRAY,
  background           : BackgroundColor.BEIGE,
  foreground           : ForegroundType.TYPE1,
  pointer              : PointerType.TYPE8,
  pointerColor        : ColorDef.RED,
  dirAvgPointer        : PointerType.TYPE8,
  dirAvgPointerColor  : ColorDef.BLUE,
  gaugeType            : GaugeType.TYPE4,
  lcdColor            : LcdColor.STANDARD,
  knob                 : KnobType.STANDARD_KNOB,
  knobStyle            : KnobStyle.SILVER,
  labelFormat          : LabelNumberFormat.STANDARD,
  tickLabelOrientation : TickLabelOrientation.HORIZONTAL, // was .NORMAL up to v1.6.4
  
  showTempTrend  : true,
  showIndoorTempHum : true,
  dewDisplayType    : DewTemp.APP,

  showPressTrend  : true,
  rainUseSectionColors : false,                                       // Only one of these colour options should be true
  rainUseGradientColors: false,                                       // Set both to false to use the pointer colour
  
  uvLcdDecimals   : 1,
  showSunshineLed : true,
  // sunshine threshold values
  sunshineThreshold    : 50,    // the value in W/m² above which we can consider the Sun to be shining, *if* the current value exceeds...
  sunshineThresholdPct : 75,    // the percentage of theoretical solar irradiance above which we consider the Sun to be shining
  
  showWindVariation  : true,
  showWindMetar      : false,
  showRoseGaugeOdo   : true,
  showRoseOnDirGauge : true,
  
  // default gauge ranges - before auto-scaling/ranging
  tempScaleDefMinC      : -20,
  tempScaleDefMaxC      : 40,
  tempScaleDefMinF      : 0,
  tempScaleDefMaxF      : 100,
  baroScaleDefMinhPa    : 990,
  baroScaleDefMaxhPa    : 1030,
  baroScaleDefMinkPa    : 99,
  baroScaleDefMaxkPa    : 103,
  baroScaleDefMininHg   : 29.2,
  baroScaleDefMaxinHg   : 30.4,
  windScaleDefMaxMph    : 20,
  windScaleDefMaxKts    : 20,
  windScaleDefMaxMs     : 10,
  windScaleDefMaxKmh    : 30,
  rainScaleDefMaxmm     : 10,
  rainScaleDefMaxIn     : 0.5,
  rainRateScaleDefMaxmm : 10,
  rainRateScaleDefMaxIn : 0.5,
  uvScaleDefMax         : 10,             // Northern Europe may be lower - max. value recorded in the UK is 8, so use a scale of 10 for UK
  solarGaugeScaleMax    : 1000,           // Max value to be shown on the solar gauge - theoretical max without atmosphere ~ 1374 W/m²
                                          // - but Davis stations can read up to 1800, use 1000 for Northern Europe?
  cloudScaleDefMaxft    : 3000,
  cloudScaleDefMaxm     : 1000,
}

export const DISPLAY_UNITS: DisplayUnits = {
  temp   : "°C",
  rain   : "mm",
  press  : "hPa",
  wind   : "km/h",
  windrun: "km",
  cloud  : "m"
}

export const Status = {
  Loading: {
    type: StatusType.LOADING
  },
  OK: {
    type: StatusType.OK,
    ledColor: LedColor.GREEN_LED,
    ledState: true

  },
  StationOffline: {
    type: StatusType.STATION_OFFLINE,
    ledColor: LedColor.RED_LED,
    ledBlink: true,
    ledTitle: '',

    statusString: ''
  },
  SensorContactLost: {
    type: StatusType.SENSOR_CONTACT_LOST,
    ledColor: LedColor.RED_LED,
    ledBlink: true,
    ledTitle: '',

    statusString: ''
  },
  GaugesTimeout: {
    type: StatusType.TIMEOUT,
    ledColor: LedColor.RED_LED,
    ledBlink: true,
    ledTitle: '',

    statusString: '',

    statusTimerStop: true,
    statusTimerReset: 0
  },
  Error: {
    type: StatusType.ERROR,
    ledColor: LedColor.RED_LED,
    ledState: false,
    ledTitle: '',

    statusString: '',
  },
  FatalError: {
    type: StatusType.FATAL_ERROR,
    ledColor: LedColor.RED_LED,
    ledState: false,
    ledTitle: '',

    statusString: '',

    statusTimerStop: true,
    statusTimerReset: 0
  }
}