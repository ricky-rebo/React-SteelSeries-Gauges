import React, { Component } from 'react';
// @ts-ignore
import { Radial, TrendState, Section, Trendstate } from "steelseries";
import styles from '../style/common.css';
import Cookies from 'universal-cookie/es6';
import { InOutType, CommonProps, RGBAColor } from './types';
import { gaugeShadow, getMinTemp, getMaxTemp } from './utils.js';
import { Lang, RtData, TempUnit } from '../controller/types.js';
import { getCommonParams, MIN_MAX_AREA_COLOR, SHADOW_COLOR, SHOW_GAUGE_SHADOW, SHOW_TEMP_INDOOR, SHOW_TEMP_TREND, TempScaleDef } from './defaults';

const COOKIE_NAME = 'temp-display';

class TempGauge extends Component<CommonProps, State> {
	static NAME = "TEMP_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: Radial;

	config: Config;

	style: React.CSSProperties;
	cookies: Cookies;

	constructor(props: CommonProps) {
		super(props);

		this.canvasRef = React.createRef();

		this.config = {
			scaleDef: TempScaleDef,
			showIndoor: SHOW_TEMP_INDOOR,
			showTrend: SHOW_TEMP_TREND,
			minMaxAreaColor: MIN_MAX_AREA_COLOR,


			showGaugeShadow: SHOW_GAUGE_SHADOW,
			shadowColor: SHADOW_COLOR
		}

		let tempType: InOutType = "out";
		if(props.controller.config.useCookies && this.config.showIndoor) {
			this.cookies = new Cookies();

			let sel = this.cookies.get(COOKIE_NAME);
			if(sel) tempType = sel;
			else {
				let expireDate = new Date();
				expireDate.setFullYear(expireDate.getFullYear() + 1);
				this.cookies.set(COOKIE_NAME, tempType, { path: "/", expires: expireDate });
			}
		}
		
		let { temp } = props.controller.getDisplayUnits();
		this.state = {
			value: (temp === "°C")
				? this.config.scaleDef.Min_C + 0.0001
				: this.config.scaleDef.Min_F + 0.0001,
			minValue: (temp === "°C")
				? this.config.scaleDef.Min_C
				: this.config.scaleDef.Min_F,
			maxValue: (temp === "°C")
				? this.config.scaleDef.Max_C
				: this.config.scaleDef.Max_F,
			trend: TrendState.OFF,
			areas: [],

			title: (tempType === "out")
				? this.props.controller.lang.temp_title_out
				: this.props.controller.lang.temp_title_in,
			displayUnit: temp,
			sections: createTempSections(temp === "°C"),

			//popUpTxt: ''
			
			selected: tempType
		}

		this.style = this.config.showGaugeShadow
			? gaugeShadow(this.props.size, this.config.shadowColor)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(TempGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new Radial(this.canvasRef.current, {
				...getCommonParams(),
				
				size: this.props.size,
				section: this.state.sections,
				area: [],
				minValue: this.state.minValue,
				maxValue: this.state.maxValue,
				thresholdVisible: false,
				minMeasuredValueVisible: false,
				maxMeasuredValueVisible: false,
				titleString: this.state.title,
				unitString: this.state.displayUnit,
				trendVisible: this.config.showTrend
			});
			this.gauge.setValue(this.state.value);
		}
	}

	async update(data: RtData) {
		this._setState(mapLocalData(data));
	}

	setInOutTemp(sel: InOutType) {
		if(this.state.data) {
			this._setState(this.state.data, sel);
		}
	}

	_setState(data: LocalDataDef, sel?: InOutType) {
		let newState: any = {};

		if(data.tempunit !== this.state.displayUnit) {
			newState.displayUnit = data.tempunit,
			newState.sections = createTempSections(data.tempunit === "°C")
		}

		if(sel) {
			newState.title = (sel === "out")
				? this.props.controller.lang.temp_title_out
				: this.props.controller.lang.temp_title_in;
			newState.selected = sel;
		} 
		else {
			newState.data = data;
			newState.selected = this.state.selected;
		}

		newState.value = (newState.selected === "out")
			? data.temp
			: data.intemp;

		if(this.config.showTrend) {
			if(newState.selected === "out")
				newState.trend = tempTrend(data.temptrend, data.tempunit);
			else
				newState.trend = TrendState.OFF;
		}

		let low = (newState.selected === "out")
			? data.tempTL
			: data.intempTL;
		let high = (newState.selected === "out")
			? data.tempTH
			: data.intempTH;
		newState.areas = [Section(low, high, this.config.minMaxAreaColor)];


		// auto scale the ranges
		let minValue = (data.tempunit === "°C")
			? this.config.scaleDef.Min_C
			: this.config.scaleDef.Min_F;
		let maxValue = (data.tempunit === "°C")
			? this.config.scaleDef.Max_C
			: this.config.scaleDef.Max_F;
		let lowScale = getMinTemp(minValue, data);
		let highScale = getMaxTemp(maxValue, data);
		let scaleStep = data.tempunit === "°C" ? 10 : 20;
		while (lowScale < newState.minValue) {
			minValue -= scaleStep;
			if (highScale <= newState.maxValue - scaleStep) {
				maxValue -= scaleStep;
			}
		}
		
		while (highScale > newState.maxValue) {
			maxValue += scaleStep;
			if (newState.minValue >= newState.minValue + scaleStep) {
				minValue += scaleStep;
			}
		}

		if(minValue < this.state.minValue) newState.minValue = minValue;
		if(maxValue > this.state.maxValue) newState.maxValue = maxValue;
		
		this.setState(newState);
	}

	componentDidUpdate(_prevProps: CommonProps, prevState: State) {
		if(prevState.selected !== this.state.selected) {
			this.gauge.setTitleString(this.state.title);
		}

		if(this.state.displayUnit !== prevState.displayUnit) {
			this.gauge.setUnitString(this.state.displayUnit);
			this.gauge.setSection(this.state.sections);
		}

		if (this.state.minValue !== this.gauge.getMinValue() || this.state.maxValue !== this.gauge.getMaxValue()) {
			this.gauge.setMinValue(this.state.minValue);
			this.gauge.setValue(this.state.minValue);
			this.gauge.setMaxValue(this.state.maxValue);
		}

		if (this.config.showTrend) {
			this.gauge.setTrend(this.state.trend);
		}

		this.gauge.setArea(this.state.areas);
		this.gauge.setValueAnimated(this.state.value);
	}

	render() {
		return (
			<div className={styles.gauge}>
				<canvas 
					ref={this.canvasRef}
					width={this.props.size}
					height={this.props.size}
					style={this.style}
				></canvas>
				<div>
					<button onClick={() => this.setInOutTemp('out')}>Out</button>
					<button onClick={() => this.setInOutTemp('in')}>In</button>
				</div>
				<div>
					<button onClick={() => this.props.controller.changeUnits({ temp: "°C"})}> °C </button>
					<button onClick={() => this.props.controller.changeUnits({ temp: "°F"})}> °F </button>
				</div>
			</div>
		)
	}
}


interface Config {
	scaleDef: typeof TempScaleDef,
	showIndoor: boolean,
	showTrend: boolean,
	minMaxAreaColor: RGBAColor,


	showGaugeShadow: boolean,
	shadowColor: RGBAColor
}

interface State {
	data?: LocalDataDef,

	displayUnit: TempUnit,
	selected: InOutType,

	value: number,
	minValue: number,
	maxValue: number,
	trend: TrendState,
	title: string,
	areas: Section[],
	sections: Section[]

	//popUpTxt: string
}

export type LocalDataDef = Pick<RtData, "temp"|"tempunit"|"temptrend"|"tempTL"|"dewpointTL"|"apptempTL"|"wchillTL"|"tempTH"|"apptempTH"|"heatindexTH"|"humidex"|"intemp"|"intempTL"|"intempTH">


function mapLocalData(data: RtData): LocalDataDef {
	return {
		temp				: data.temp,
		tempunit		: data.tempunit,
		temptrend		: data.temptrend,
		tempTL			: data.tempTL,
		dewpointTL	: data.dewpointTL,
		apptempTL		: data.apptempTL,
		wchillTL		: data.wchillTL,
		tempTH			: data.tempTH,
		apptempTH		: data.apptempTH,
		heatindexTH	: data.heatindexTH,
		humidex			: data.humidex,
		intemp			: data.intemp,
		intempTL		: data.intempTL,
		intempTH		: data.intempTH
	}
}

/**
 * //TODO move in Temp Gauge
 * Creates an array of gauge sections appropriate for Celsius or Fahrenheit scales
 * @param useCelsius True id you're using Celsius, False otherwise
 */
function createTempSections (useCelsius: boolean) {
	if (useCelsius) {
		return [
			Section(-100, -35, 'rgba(195, 92, 211, 0.4)'),
			Section(-35, -30, 'rgba(139, 74, 197, 0.4)'),
			Section(-30, -25, 'rgba(98, 65, 188, 0.4)'),
			Section(-25, -20, 'rgba(62, 66, 185, 0.4)'),
			Section(-20, -15, 'rgba(42, 84, 194, 0.4)'),
			Section(-15, -10, 'rgba(25, 112, 210, 0.4)'),
			Section(-10, -5, 'rgba(9, 150, 224, 0.4)'),
			Section(-5, 0, 'rgba(2, 170, 209, 0.4)'),
			Section(0, 5, 'rgba(0, 162, 145, 0.4)'),
			Section(5, 10, 'rgba(0, 158, 122, 0.4)'),
			Section(10, 15, 'rgba(54, 177, 56, 0.4)'),
			Section(15, 20, 'rgba(111, 202, 56, 0.4)'),
			Section(20, 25, 'rgba(248, 233, 45, 0.4)'),
			Section(25, 30, 'rgba(253, 142, 42, 0.4)'),
			Section(30, 40, 'rgba(236, 45, 45, 0.4)'),
			Section(40, 100, 'rgba(245, 109, 205, 0.4)')
		];
	} else {
		return [
			Section(-200, -30, 'rgba(195, 92, 211, 0.4)'),
			Section(-30, -25, 'rgba(139, 74, 197, 0.4)'),
			Section(-25, -15, 'rgba(98, 65, 188, 0.4)'),
			Section(-15, -5, 'rgba(62, 66, 185, 0.4)'),
			Section(-5, 5, 'rgba(42, 84, 194, 0.4)'),
			Section(5, 15, 'rgba(25, 112, 210, 0.4)'),
			Section(15, 25, 'rgba(9, 150, 224, 0.4)'),
			Section(25, 32, 'rgba(2, 170, 209, 0.4)'),
			Section(32, 40, 'rgba(0, 162, 145, 0.4)'),
			Section(40, 50, 'rgba(0, 158, 122, 0.4)'),
			Section(50, 60, 'rgba(54, 177, 56, 0.4)'),
			Section(60, 70, 'rgba(111, 202, 56, 0.4)'),
			Section(70, 80, 'rgba(248, 233, 45, 0.4)'),
			Section(80, 90, 'rgba(253, 142, 42, 0.4)'),
			Section(90, 110, 'rgba(236, 45, 45, 0.4)'),
			Section(110, 200, 'rgba(245, 109, 205, 0.4)')
		];
	}
}

/**
 * //TODO move in Temp Gauge
 * Converts a temperature trend value into a localised string, or +1, 0, -1 depending on the value of bTxt
 * @param trend 
 * @param units 
 * @param bTxt 
 * @param strings 
 */
function tempTrend(trend: number, units: TempUnit, strings?: Lang): Trendstate|string {
	// Scale is over 3 hours, in Celsius
	var val = trend * 3 * (units === "°C" ? 1 : (5 / 9));
			
	if (trend === -9999) 	return (strings ? '--' : TrendState.OFF);
	else if (val > 5) 		return (strings ? strings.RisingVeryRapidly : TrendState.UP);
	else if (val > 3)			return (strings ? strings.RisingQuickly : TrendState.UP);
	else if (val > 1) 		return (strings ? strings.Rising : TrendState.UP);
	else if (val > 0.5) 	return (strings ? strings.RisingSlowly : TrendState.UP);
	else if (val >= -0.5) return (strings ? strings.Steady : TrendState.STEADY);
	else if (val >= -1) 	return (strings ? strings.FallingSlowly : TrendState.DOWN);
	else if (val >= -3) 	return (strings ? strings.Falling : TrendState.DOWN);
	else if (val >= -5) 	return (strings ? strings.FallingQuickly : TrendState.DOWN);
	else									return (strings ? strings.FallingVeryRapidly : TrendState.DOWN);
}

export default TempGauge;