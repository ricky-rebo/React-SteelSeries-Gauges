import { FrameDesign, BackgroundColor, ForegroundType, PointerType, ColorDef, GaugeType, LcdColor, KnobType, KnobStyle, LabelNumberFormat, TickLabelOrientation } from "steelseries";
import { GaugeParams } from "./types";

// Common Gauge Params
export const FRAME_DESIGN = FrameDesign.TILTED_GRAY;
export const BACKGROUND = BackgroundColor.BEIGE;
export const FOREGROUND = ForegroundType.TYPE1;
export const POINTER = PointerType.TYPE8;
export const POINTER_COLOR = ColorDef.RED;
export const GAUGE_TYPE = GaugeType.TYPE4;
export const LCD_COLOR = LcdColor.STANDARD;
export const KNOB = KnobType.STANDARD_KNOB;
export const KNOB_STYLE = KnobStyle.SILVER;
export const LABEL_FORMAT = LabelNumberFormat.STANDARD;
export const TICK_LABEL_ORIENTATION = TickLabelOrientation.HORIZONTAL;

export const MIN_MAX_AREA_COLOR = 'rgba(212,132,134,0.3)';

// Specfic Gauge Params
export const SHOW_TEMP_TREND = true;
export const SHOW_TEMP_INDOOR = true;
export const DEW_DISPLAY_TYPE = "app";

export const SHOW_HUM_INDOOR = true;

export const SHOW_PRESS_TREND = true;

export const WIND_AVG_AREA_COLOR = 'rgba(132,212,134,0.3)'
export const SHOW_WIND_VARIATION = true;
export const WIND_VAR_SECTION_COLOR = 'rgba(120,200,120,0.7)'
export const DIR_AVG_POINTER = PointerType.TYPE8;
export const DIR_AVG_POINTER_COLOR = ColorDef.BLUE;
export const SHOW_WIND_METAR = false;
export const SHOW_ROSE_ON_DIR = false;

export const SHOW_ODO_ROSE_GAUGE = true;

export const RAIN_USE_SECTION_COLOR = false;
export const RAIN_USE_GRADIENT_COLOR = false;

export const UV_LCD_DECIMALS = 1;
export const SHOW_SUNSHINE_LED = true;
export const SUNSHINE_TRESHOLD = 50;     // the value in W/m² above which we can consider the Sun to be shining, *if* the current value exceeds...
export const SUNSHINE_PCT_TRESHOLD = 75; // the percentage of theoretical solar irradiance above which we consider the Sun to be shining

export const ROUND_CLOUDBASE_VALUE = true;


// Other Params
export const SHOW_GAUGE_SHADOW = true;
export const SHADOW_COLOR = 'rgba(0,0,0,0.3)';


//Default Scales
export const TempScaleDef = {
	Min_C      : -20,
  Max_C      : 40,
  Min_F      : 0,
  Max_F      : 100,
};

export const BaroScaleDef = {
	Min_hPa    : 990,
  Max_hPa    : 1030,
  Min_kPa    : 99,
  Max_kPa    : 103,
  Min_inHg   : 29.2,
  Max_inHg   : 30.4,
};

export const WindScaleDef = {
	Max_Mph    : 20,
  Max_Kts    : 20,
  Max_Ms     : 10,
  Max_Kmh    : 30,
}

export const RainScaleDef = {
	Max_mm     : 10,
  Max_In     : 0.5,
}

export const RainRateScaleDef = {
	Max_mm : 10,
  Max_In : 0.5,
}

export const SolarScaleDef = {
	Max_Solar: 1000,
	Max_UV: 10
};

export const CloudScaleDef = {
	Max_ft    : 3000,
  Max_m     : 1000,
}



export const getCommonParams = (/*custom: any*/): GaugeParams => ({
	fullScaleDeflectionTime: 4, // Bigger numbers (seconds) slow the gauge pointer movements more
	gaugeType              : GAUGE_TYPE,
	minValue               : 0,
	niceScale              : true,
	ledVisible             : false,
	frameDesign            : FRAME_DESIGN,
	backgroundColor        : BACKGROUND,
	foregroundType         : FOREGROUND,
	pointerType            : POINTER,
	pointerColor           : POINTER_COLOR,
	knobType               : KNOB,
	knobStyle              : KNOB_STYLE,
	lcdColor               : LCD_COLOR,
	lcdDecimals            : 1,
	digitalFont            : false,
	tickLabelOrientation   : TICK_LABEL_ORIENTATION,
	labelNumberFormat      : LABEL_FORMAT
})

//TODO
/**
 * Creare Gauge Props com unione di:
 * CommonProps +
 * GaugeParams +
 * Eventuali parametri specifici di un Gauge
 */