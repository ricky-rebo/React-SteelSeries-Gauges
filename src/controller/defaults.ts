import { ControllerConfig, DisplayUnits, GaugeConfig, StatusType } from "./types";
// @ts-ignore
import { FrameDesign, BackgroundColor, ForegroundType, PointerType, ColorDef, GaugeType, LcdColor, LedColor, KnobType, KnobStyle, LabelNumberFormat, TickLabelOrientation } from "steelseries";


export const CONTROLLER_DEF: ControllerConfig = {
  realTimeUrl: '',

  realtimeInterval   : 15,
  stationTimeout     : 3,
  pageUpdateLimit    : 20,

  useCookies         : true
}

export const GAUGE_DEF: GaugeConfig = {
  frameDesign          : FrameDesign.TILTED_GRAY,
  background           : BackgroundColor.BEIGE,
  foreground           : ForegroundType.TYPE1,
  pointer              : PointerType.TYPE8,
  pointerColor        : ColorDef.RED,
  gaugeType            : GaugeType.TYPE4,
  lcdColor            : LcdColor.STANDARD,
  knob                 : KnobType.STANDARD_KNOB,
  knobStyle            : KnobStyle.SILVER,
  labelFormat          : LabelNumberFormat.STANDARD,
  tickLabelOrientation : TickLabelOrientation.HORIZONTAL, // was .NORMAL up to v1.6.4
  gaugeScaling       : 1,
  minMaxArea            : 'rgba(212,132,134,0.3)', // area sector for today's max/min. (red, green, blue, transparency)
  shadowColour          : 'rgba(0,0,0,0.3)',  // Colour to use for gauge shadows - default 30% transparent black
  showGaugeShadow    : true,

  showTempTrend  : true,

  showIndoorTempHum : true,

  dewDisplayType    : "app",

  dirAvgPointer        : PointerType.TYPE8,
  dirAvgPointerColor  : ColorDef.BLUE,
  
  showPressTrend  : true,

  rainUseSectionColors : false,                                       // Only one of these colour options should be true
  rainUseGradientColors: false,                                       // Set both to false to use the pointer colour
  
  uvLcdDecimals   : 1,

  showSunshineLed : true,
  // sunshine threshold values
  sunshineThreshold    : 50,    // the value in W/m² above which we can consider the Sun to be shining, *if* the current value exceeds...
  sunshineThresholdPct : 75,    // the percentage of theoretical solar irradiance above which we consider the Sun to be shining
  
  windAvgArea           : 'rgba(132,212,134,0.3)',
  windVariationSector   : 'rgba(120,200,120,0.7)', // only used when rose data is shown on direction gauge
  showWindVariation  : true,
  showWindMetar      : false,
  showRoseGaugeOdo   : true,
  showRoseOnDirGauge : true,
  
  roundCloudbaseVal  : true,

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

//TODO remove? (usare units di data?)
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
    type: StatusType.LOADING,

    ledColor: LedColor.GREEN_LED,
    ledBlink: true,
    ledState: false,
    ledTitle: '',

    statusMsg: '',

    timerState: false,
    timerReset: -1
  },
  OK: {
    type: StatusType.OK,

    ledColor: LedColor.GREEN_LED,
    ledBlink: false,
    ledState: true,
    ledTitle: '',

    statusMsg: '',

    timerState: true,
    timerReset: -1
  },
  Warning: {
    type: StatusType.WARNING,

    ledColor: LedColor.ORANGE_LED,
    ledBlink: true,
    ledState: false,
    ledTitle: '',

    statusMsg: '',

    timerState: true,
    timerReset: -1
  },

  Error: {
    type: StatusType.ERROR,

    ledColor: LedColor.RED_LED,
    ledBlink: false,
    ledState: false,
    ledTitle: '',

    statusMsg: '',

    timerState: false,
    timerReset: 0
  }
}