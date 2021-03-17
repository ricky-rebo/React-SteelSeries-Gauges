import { Component } from "react";
import GaugesController from "../controller/controller";
// @ts-ignore
import { Radial, RadialBargraph, FrameDesign, BackgroundColor, ForegroundType, PointerType, ColorDef, GaugeType, LcdColor, LedColor, KnobType, KnobStyle, LabelNumberFormat, TickLabelOrientation } from "steelseries";
import { RtData } from "../controller/types";


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


export interface GaugeComponent<P, S, C> extends Component<P, S> {
  readonly NAME: string;

  canvasRef: React.RefObject<HTMLCanvasElement>;
  gauge?: Radial|RadialBargraph;

  config: C;
  style: React.CSSProperties;

  update: (data: RtData) => void;
}

/*
export interface CommonParams {
  frameDesign: FrameDesign,
  background: BackgroundColor,
  foreground: ForegroundType,
  pointer: PointerType,
  pointerColor: ColorDef,
  gaugeType: GaugeType,
  lcdColor: LcdColor,
  knob: KnobType,
  knobStyle: KnobStyle,
  labelFormat: LabelNumberFormat,
  tickLabelOrientation: TickLabelOrientation, // was .NORMAL up to v1.6.4

  showGaugeShadow: true,
  shadowColour: RGBAColor,

  minMaxArea: RGBAColor, // area sector for today's max/min. (red, green, blue, transparency)
}

export interface IndoorData {
  showIndoor: boolean
} 

export interface Trend {
  showTrend: boolean
}

export interface TempScaleDef {
  tempScaleDefMinC      : -20,
  tempScaleDefMaxC      : 40,
  tempScaleDefMinF      : 0,
  tempScaleDefMaxF      : 100,
}*/