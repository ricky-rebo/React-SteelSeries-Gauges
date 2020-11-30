import { ControllerConfig, GaugeConfig, StatusType, WProgram } from "./data_types";
// @ts-ignore
import steelseries from '../libs/steelseries';
import { DewTempType } from "../gauges/dew";

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

  frameDesign          : steelseries.FrameDesign.TILTED_GRAY,
  background           : steelseries.BackgroundColor.BEIGE,
  foreground           : steelseries.ForegroundType.TYPE1,
  pointer              : steelseries.PointerType.TYPE8,
  pointerColour        : steelseries.ColorDef.RED,
  dirAvgPointer        : steelseries.PointerType.TYPE8,
  dirAvgPointerColour  : steelseries.ColorDef.BLUE,
  gaugeType            : steelseries.GaugeType.TYPE4,
  lcdColour            : steelseries.LcdColor.STANDARD,
  knob                 : steelseries.KnobType.STANDARD_KNOB,
  knobStyle            : steelseries.KnobStyle.SILVER,
  labelFormat          : steelseries.LabelNumberFormat.STANDARD,
  tickLabelOrientation : steelseries.TickLabelOrientation.HORIZONTAL, // was .NORMAL up to v1.6.4
  
  tempTrendVisible  : true,
  showIndoorTempHum : true,
  dewDisplayType    : DewTempType.APP,

  pressureTrendVisible  : true,
  rainUseSectionColours : false,                                       // Only one of these colour options should be true
  rainUseGradientColours: false,                                       // Set both to false to use the pointer colour
  
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

export const UNITS = {
  Temp: {
    C: '°C',
    F: '°F'
  },
  Rain: {
    MM: 'mm',
    IN: 'in'
  },
  Press: {
    HPA: 'hPa',
    INHG: 'inHg',
    MB: 'mb',
    KPA: 'kPa'
  },
  Wind: {
    KM_H: 'km/h',
    M_S: 'm/s',
    MPH: 'mph',
    Knots: 'kts'
  },
  Windrun: {
    KM: 'km',
    Miles: 'miles',
    N_Miles: 'n.miles'
  },
  Cloud: {
    M: 'm',
    FT: 'ft'
  }
}

export const DISPLAY_UNITS = {
  temp   : UNITS.Temp.C,
  rain   : UNITS.Rain.MM,
  press  : UNITS.Press.HPA,
  wind   : UNITS.Wind.KM_H,
  windrun: UNITS.Windrun.KM,
  cloud  : UNITS.Cloud.M
}

export const Status = {
  Loading: {
    type: StatusType.LOADING
  },
  OK: {
    type: StatusType.OK,
    ledColor: steelseries.LedColor.GREEN_LED,
    ledState: true

  },
  StationOffline: {
    type: StatusType.STATION_OFFLINE,
    ledColor: steelseries.LedColor.RED_LED,
    ledBlink: true,
    ledTitle: '',

    statusString: ''
  },
  SensorContactLost: {
    type: StatusType.SENSOR_CONTACT_LOST,
    ledColor: steelseries.LedColor.RED_LED,
    ledBlink: true,
    ledTitle: '',

    statusString: ''
  },
  GaugesTimeout: {
    type: StatusType.TIMEOUT,
    ledColor: steelseries.LedColor.RED_LED,
    ledBlink: true,
    ledTitle: '',

    statusString: '',

    statusTimerStop: true,
    statusTimerReset: 0
  },
  Error: {
    type: StatusType.ERROR,
    ledColor: steelseries.LedColor.RED_LED,
    ledState: false,
    ledTitle: '',

    statusString: '',
  },
  FatalError: {
    type: StatusType.FATAL_ERROR,
    ledColor: steelseries.LedColor.RED_LED,
    ledState: false,
    ledTitle: '',

    statusString: '',

    statusTimerStop: true,
    statusTimerReset: 0
  }
}