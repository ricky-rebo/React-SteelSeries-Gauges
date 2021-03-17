import React, { Component } from 'react';
// @ts-ignore
import { Radial, TrendState, LabelNumberFormat, Section } from "steelseries";
import styles from '../style/common.css';
import { Lang, PressUnit, RtData } from '../controller/types';
import { gaugeShadow, nextHighest, nextLowest } from './utils.js';
import { CommonProps, RGBAColor } from './types';
import { BaroScaleDef, getCommonParams, LABEL_FORMAT, MIN_MAX_AREA_COLOR, SHADOW_COLOR, SHOW_GAUGE_SHADOW, SHOW_PRESS_TREND } from './defaults';

class BaroGauge extends Component<CommonProps, State> {
	static NAME = "BARO_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: Radial;

	config: Config;

	//params: any;
	style: React.CSSProperties;

	constructor(props: CommonProps) {
		super(props);

		this.canvasRef = React.createRef();

		//TODO implementare custom config tramite props
		this.config = {
			scaleDef: BaroScaleDef,

			showTrend: SHOW_PRESS_TREND,
			labelFormat: LABEL_FORMAT,
			minMaxAreaColor: MIN_MAX_AREA_COLOR,

			showGaugeShadow: SHOW_GAUGE_SHADOW,
			shadowColor: SHADOW_COLOR,
		}

		let { press } = props.controller.getDisplayUnits();
		this.state = {
			value: this.config.scaleDef.Min_hPa + 0.0001,
			minValue: this.config.scaleDef.Min_hPa,
			maxValue: this.config.scaleDef.Max_hPa,
			sections: [],
			areas: [],
			trend: TrendState.OFF,

			displayUnit: press,
			lcdDecimals: (press === "hPa" || press === "mb") ? 1 : 2,
			scaleDecimals: (press === "hPa" || press === "mb") ? 0 : 1,
			labelNumberFormat: (press === "hPa" || press === "mb")
				? this.config.labelFormat
				: LabelNumberFormat.FRACTIONAL
		}

		/*this.params = {
			...getCommonParams(),

			size: this.props.size,
			sections: this.state.sections,
			area: this.state.areas,
			minValue: this.state.minValue,
			maxValue: this.state.maxValue,
			thresholdVisible: false,
			niceScale: false,
			titleString: props.controller.lang.baro_title,
			unitString: this.state.displayUnit,
			lcdDecimals: this.state.lcdDecimals,
			trendVisible: this.config.showTrend,
			labelNumberFormat: this.state.labelNumberFormat,
			fractionalScaleDecimals: this.state.scaleDecimals
		};*/

		this.style = this.config.showGaugeShadow
			? gaugeShadow(this.props.size, this.config.shadowColor)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(BaroGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new Radial(this.canvasRef.current, {
				...getCommonParams(),
				
				size: this.props.size,
				section: this.state.sections,
				area: this.state.areas,
				minValue: this.state.minValue,
				maxValue: this.state.maxValue,
				thresholdVisible: false,
				niceScale: false,
				titleString: this.props.controller.lang.baro_title,
				unitString: this.state.displayUnit,
				lcdDecimals: this.state.lcdDecimals,
				trendVisible: this.config.showTrend,
				labelNumberFormat: this.state.labelNumberFormat,
				fractionalScaleDecimals: this.state.scaleDecimals
			});

			this.gauge.setValue(this.state.value);
		}
	}

	async update({press, pressL, pressH, pressTL, pressTH, presstrendval, pressunit}: RtData) {
		let newState: any = {};

		if(pressunit !== this.state.displayUnit) {
			newState.displayUnit = pressunit;
			newState.lcdDecimals = (pressunit === "hPa" || pressunit === "mb") ? 1 : 2,
			newState.scaleDecimals = (pressunit === "hPa" || pressunit === "mb") ? 0 : 1,
			newState.labelNumberFormat = (pressunit === "hPa" || pressunit === "mb")
				? this.config.labelFormat
				: LabelNumberFormat.FRACTIONAL
		}

		newState.value = press
		let low = pressL,
				high = pressH,
				todayLow = pressTL,
				todayHigh = pressTH;

		//let dps: number;
		switch(pressunit) {
			case "hPa":
			case "mb":
				//  default min range 990-1030 - steps of 10 hPa
				newState.minValue = Math.min(nextLowest(low - 2, 10), this.config.scaleDef.Min_hPa);
				newState.maxValue = Math.max(nextHighest(high + 2, 10), this.config.scaleDef.Max_hPa);
				//dps = 1; // 1 decimal place
				break;
			case "kPa":
				//  default min range 99-105 - steps of 1 kPa
				newState.minValue = Math.min(nextLowest(low - 0.2, 1), this.config.scaleDef.Min_kPa);
				newState.maxValue = Math.max(nextHighest(high + 0.2, 1), this.config.scaleDef.Max_kPa);
				//dps = 2;
				break;
			case "inHg":
				// inHg: default min range 29.5-30.5 - steps of 0.5 inHg
				newState.minValue = Math.min(nextLowest(low - 0.1, 0.5), this.config.scaleDef.Min_inHg);
				newState.maxValue = Math.max(nextHighest(high + 0.1, 0.5), this.config.scaleDef.Max_inHg);
				//dps = 3;
		}
		/*let trendValRnd = trendVal.toFixed(dps),
				todayLowRnd = todayLow.toFixed(dps),
				todayHighRnd = todayHigh.toFixed(dps);*/
		
		if (high === todayHigh && low === todayLow) {
			// VWS does not provide record hi/lo values
			newState.sections = [];
			newState.areas = [Section(todayLow, todayHigh, this.config.minMaxAreaColor)];
		}
		else {
			newState.sections = [
					Section(newState.minValue, low, 'rgba(255,0,0,0.5)'),
					Section(high, newState.maxValue, 'rgba(255,0,0,0.5)')
			];
			newState.areas = [
					Section(newState.minValue, low, 'rgba(255,0,0,0.5)'),
					Section(high, newState.maxValue, 'rgba(255,0,0,0.5)'),
					Section(todayLow, todayHigh, this.config.minMaxAreaColor)
			];
		}

		if (this.config.showTrend) {
			// Convert the WD change over 3 hours to an hourly rate
			let trendVal = presstrendval / 3;
			
			// Use the baroTrend rather than simple arithmetic test - steady is more/less than zero!
			newState.trend = baroTrend(trendVal, pressunit);
		}

		this.setState(newState);
		//End of update()
	}

	componentDidUpdate(_prevProps: CommonProps, prevState: State) {
		if(this.gauge) {
			if(this.state.displayUnit !== prevState.displayUnit) {
				this.gauge.setUnitString(this.state.displayUnit);
				this.gauge.setLcdDecimals(this.state.lcdDecimals);
				this.gauge.setFractionalScaleDecimals(this.state.scaleDecimals);
				this.gauge.setLabelNumberFormat(this.state.labelNumberFormat);
			}

			if (this.state.minValue !== this.gauge.getMinValue() || this.state.maxValue !== this.gauge.getMaxValue()) {
				this.gauge.setMinValue(this.state.minValue);
				this.gauge.setMaxValue(this.state.maxValue);
				this.gauge.setValue(this.state.minValue);
			}

			if(this.config.showTrend)
				this.gauge.setTrend(this.state.trend);

			this.gauge.setArea(this.state.areas);
			this.gauge.setSection(this.state.sections);
			this.gauge.setValueAnimated(this.state.value);
		}
		
	}

	render() {
			return <div className={styles.gauge}>
				<canvas 
						ref={this.canvasRef}
						width={this.props.size}
						height={this.props.size}
						style={this.style}
				></canvas>
				<div>
					<button onClick={() => this.props.controller.changeUnits({ press: "hPa"})}>hPa</button>
					<button onClick={() => this.props.controller.changeUnits({ press: "kPa"})}>kPa</button>
					<button onClick={() => this.props.controller.changeUnits({ press: "inHg"})}>inHg</button>
					<button onClick={() => this.props.controller.changeUnits({ press: "mb"})}>mb</button>
				</div>
				
			</div>
	}
}


interface State {
	value: number,
	minValue: number,
	maxValue: number,
	sections: { start: number, stop: number, color: any}[],
	areas: { start: number, stop: number, color: any}[],
	trend: TrendState,

	displayUnit: PressUnit,
	lcdDecimals: number,
	scaleDecimals: number,
	labelNumberFormat: LabelNumberFormat
}

interface Config {
	scaleDef: typeof BaroScaleDef,

	showTrend: boolean,
	labelFormat: LabelNumberFormat,
	minMaxAreaColor: RGBAColor,

	showGaugeShadow: boolean,
	shadowColor: RGBAColor,
}


function baroTrend(trend: number, units: PressUnit, strings?: Lang) {
	if(units === "") return (strings ? '--' : TrendState.OFF);

	// The terms below are the UK Met Office terms for a 3 hour change in hPa
	// trend is supplied as an hourly change, so multiply by 3
	var val = trend * 3;
	
	if (units === "inHg") 		val *= 33.8639;
	else if (units === "kPa") val *= 10;
	
	if (val > 6.0)  	return (strings ? strings.RisingVeryRapidly : TrendState.UP);
	else if (val > 3.5) 	return (strings ? strings.RisingQuickly : TrendState.UP);
	else if (val > 1.5) 	return (strings ? strings.Rising : TrendState.UP);
	else if (val > 0.1) 	return (strings ? strings.RisingSlowly : TrendState.UP);
	else if (val >= -0.1) return (strings ? strings.Steady : TrendState.STEADY);
	else if (val >= -1.5) return (strings ? strings.FallingSlowly : TrendState.DOWN);
	else if (val >= -3.5) return (strings ? strings.Falling : TrendState.DOWN);
	else if (val >= -6.0) return (strings ? strings.FallingQuickly : TrendState.DOWN);
	else 									return (strings ? strings.FallingVeryRapidly : TrendState.DOWN);
}

export default BaroGauge;