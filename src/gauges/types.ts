import GaugesController from "../controller/controller";
// @ts-ignore
import { Radial, RadialBargraph, FrameDesign, BackgroundColor, ForegroundType, PointerType, ColorDef, GaugeType, LcdColor, LedColor, KnobType, KnobStyle, LabelNumberFormat, TickLabelOrientation } from "steelseries";


export type DewType = "app"|"dew"|"wnd"|"hea"|"hum";

export type InOutType = "in"|"out";

export type RGBAColor = `rgba(${number},${number},${number},${number})`;


export interface CommonProps {
  controller: GaugesController,
  size: number
}

export interface GaugeParams {
	fullScaleDeflectionTime: number,
	gaugeType              : GaugeType,
	minValue               : number,
	niceScale              : boolean,
	ledVisible             : boolean,
	frameDesign            : FrameDesign,
	backgroundColor        : BackgroundColor,
	foregroundType         : ForegroundType,
	pointerType            : PointerType,
	pointerColor           : ColorDef,
	knobType               : KnobType,
	knobStyle              : KnobStyle,
	lcdColor               : LcdColor,
	lcdDecimals            : number,
	digitalFont            : boolean,
	tickLabelOrientation   : TickLabelOrientation,
	labelNumberFormat      : LabelNumberFormat
}