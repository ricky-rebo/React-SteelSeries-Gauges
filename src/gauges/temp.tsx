import React, { Component } from 'react';
// @ts-ignore
import { Radial, TrendState, Section } from "steelseries";
import styles from '../style/common.css';
import Cookies from 'universal-cookie/es6';
import { InOutType, CommonProps } from './types';
import { createTempSections, gaugeShadow, getMinTemp, getMaxTemp, tempTrend } from './utils.js';
import { RtData, TempUnit } from '../controller/types.js';

const COOKIE_NAME = 'temp-display';


class TempGauge extends Component<CommonProps, State> {
	static NAME = "TEMP_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: any;
	params: any;
	style: React.CSSProperties;
	cookies: Cookies;

	constructor(props: CommonProps) {
		super(props);

		this.canvasRef = React.createRef();

		let tempType: InOutType = "out";
		if(props.controller.config.useCookies && props.controller.gaugeConfig.showIndoorTempHum) {
			this.cookies = new Cookies();

			let sel = this.cookies.get(COOKIE_NAME);
			if(sel) tempType = sel;
			else {
				//TODO set expire date
				this.cookies.set(COOKIE_NAME, tempType);
			}
		}
		
		let { temp } = props.controller.getDisplayUnits();
		this.state = {
			value: (temp === "°C")
				? this.props.controller.gaugeConfig.tempScaleDefMinC + 0.0001
				: this.props.controller.gaugeConfig.tempScaleDefMinF + 0.0001,
			minValue: (temp === "°C")
				? this.props.controller.gaugeConfig.tempScaleDefMinC
				: this.props.controller.gaugeConfig.tempScaleDefMinF,
			maxValue: (temp === "°C")
				? this.props.controller.gaugeConfig.tempScaleDefMaxC
				: this.props.controller.gaugeConfig.tempScaleDefMaxF,
			trend: TrendState.OFF,
			areas: [],

			title: (tempType === "out")
				? this.props.controller.lang.temp_title_out
				: this.props.controller.lang.temp_title_in,
			displayUnit: temp,
			sections: createTempSections(temp === "°C"),
			maxMinVisible: false,

			//popUpTxt: '',
			//graph: '',
			
			selected: tempType
		}

		this.params = {
			...this.props.controller.commonParams,
			size: Math.ceil(this.props.size * this.props.controller.gaugeConfig.gaugeScaling),
			section: this.state.sections,
			area: [],
			minValue: this.state.minValue,
			maxValue: this.state.maxValue,
			thresholdVisible: false,
			minMeasuredValueVisible: this.state.maxMinVisible,
			maxMeasuredValueVisible: this.state.maxMinVisible,
			titleString: this.state.title,
			unitString: this.state.displayUnit,
			trendVisible: this.props.controller.gaugeConfig.showTempTrend
		};

		this.style = this.props.controller.gaugeConfig.showGaugeShadow
			? gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(TempGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new Radial(this.canvasRef.current, this.params);
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

		newState.minValue = data.tempunit === "°C"
			? this.props.controller.gaugeConfig.tempScaleDefMinC
			: this.props.controller.gaugeConfig.tempScaleDefMinF;
		newState.maxValue = data.tempunit === "°C"
			? this.props.controller.gaugeConfig.tempScaleDefMaxC
			: this.props.controller.gaugeConfig.tempScaleDefMaxF;

		let lowScale: number, highScale: number;
		if(newState.selected === "out") {
			newState.value = data.temp;
			
			lowScale = newState.minValue, data;
			highScale = newState.maxValue, data;

			//loc = this.props.controller.lang.temp_out_info;
			
			if(this.params.trendVisible) {
				let trendVal = data.temptrend;
				newState.trend = tempTrend(trendVal, data.tempunit, false);
			}

			let low = data.tempTL;
			let high = data.tempTH;
			newState.areas = [Section(low, high, this.props.controller.gaugeConfig.minMaxArea)];
		}
		else {
			//Indoor selected 
			newState.value = data.intemp;

			if (data.intempTL && data.intempTH) { // Indoor - and Max/Min values supplied
				lowScale = getMinTemp(newState.minValue, data);
				highScale = getMaxTemp(newState.maxValue, data);

				let low = data.intempTL;
				let high = data.intempTH;
				newState.areas = [Section(low, high, this.props.controller.gaugeConfig.minMaxArea)];
			}
			else { // Indoor - no Max/Min values supplied
				lowScale = highScale = newState.value;
				newState.areas = [];
			}

			if (this.params.trendVisible) {
				newState.trend = TrendState.OFF;
			}
		}
		
		// auto scale the ranges
		let scaleStep = data.tempunit === "°C" ? 10 : 20;
		while (lowScale < newState.minValue) {
			newState.minValue -= scaleStep;
			if (highScale <= newState.maxValue - scaleStep) {
				newState.maxValue -= scaleStep;
			}
		}
		
		while (highScale > newState.maxValue) {
			newState.maxValue += scaleStep;
			if (newState.minValue >= newState.minValue + scaleStep) {
				newState.minValue += scaleStep;
			}
		}

		this.setState(newState);
	}

	componentDidUpdate(_prevProps: CommonProps, prevState: State) {
		if(prevState.selected !== this.state.selected) {
			this.gauge.setTitleString(this.state.title);
			this.gauge.setMaxMeasuredValueVisible(this.state.maxMinVisible);
			this.gauge.setMinMeasuredValueVisible(this.state.maxMinVisible);
		}

		if(this.state.displayUnit !== prevState.displayUnit) {
			this.gauge.setUnitString(this.state.displayUnit);
			this.gauge.setSection(this.state.sections);
		}

		if (this.state.minValue !== this.gauge.getMinValue() || this.state.maxValue !== this.gauge.getMaxValue()) {
			this.gauge.setMinValue(this.state.minValue);
			this.gauge.setMaxValue(this.state.maxValue);
			this.gauge.setValue(this.state.minValue);
		}

		if (this.params.trendVisible) {
			this.gauge.setTrend(this.state.trend);
		}

		this.gauge.setArea(this.state.areas);
		this.gauge.setValueAnimated(this.state.value);
	}

	render() {
		return <div className={styles.gauge}>
			<div id="tip_0">
				<canvas 
					ref={this.canvasRef}
					width={this.params.size}
					height={this.params.size}
					style={this.style}
				></canvas>
			</div>
			<div>
				<button onClick={() => this.setInOutTemp('out')}>Out</button>
				<button onClick={() => this.setInOutTemp('in')}>In</button>
			</div>
			<div>
				<button onClick={() => this.props.controller.changeUnits({ temp: "°C"})}> °C </button>
				<button onClick={() => this.props.controller.changeUnits({ temp: "°F"})}> °F </button>
			</div>
		</div>
	}
}

interface State {
	data?: LocalDataDef,

	displayUnit: TempUnit,
	maxMinVisible: boolean,
	selected: InOutType,

	value: number,
	minValue: number,
	maxValue: number,
	trend: any,
	title: string,
	areas: any[],
	sections: any

	//popUpTxt: string,
	//graph: string
}

export interface LocalDataDef {
	temp: number, tempunit: TempUnit, temptrend: number,
	tempTL: number, dewpointTL: number, apptempTL: number, wchillTL: number,
	tempTH: number, apptempTH: number, heatindexTH: number, humidex: number,
	intemp: number, intempTL?: number, intempTH?: number
}

function mapLocalData(data: RtData) {
	let locData: LocalDataDef = {
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
	return locData;
}

export default TempGauge;