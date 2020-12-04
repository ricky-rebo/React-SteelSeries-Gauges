import React, { Component } from 'react';
import GaugeUtils from './gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import GaugesController from '../controller/gauges_controller';
import styles from '../style/common.css';
import { UNITS } from '../controller/defaults';
import Cookies from 'universal-cookie/es6';
import { InOutTemp } from './data-types';
import { extractDecimal } from '../controller/data-utils';

const COOKIE_NAME = 'temp-display';

//TODO docs
class TempGauge extends Component<Props, State> {
	static NAME = "TEMP_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: any;
	params: any;
	style: any;
	cookies: Cookies;

	constructor(props: Props) {
		super(props);

		this.canvasRef = React.createRef();

		let tempType: InOutTemp = InOutTemp.OUT;;
		if(props.controller.controllerConfig.useCookies && props.controller.gaugeConfig.showIndoorTempHum) {
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
			value: (temp === UNITS.Temp.C)
				? this.props.controller.gaugeConfig.tempScaleDefMinC + 0.0001
				: this.props.controller.gaugeConfig.tempScaleDefMinF + 0.0001,
			minValue: (temp === UNITS.Temp.C)
				? this.props.controller.gaugeConfig.tempScaleDefMinC
				: this.props.controller.gaugeConfig.tempScaleDefMinF,
			maxValue: (temp === UNITS.Temp.C)
				? this.props.controller.gaugeConfig.tempScaleDefMaxC
				: this.props.controller.gaugeConfig.tempScaleDefMaxF,
			trend: steelseries.TrendState.OFF,
			areas: [],

			title: (tempType === InOutTemp.OUT)
				? this.props.controller.lang.temp_title_out
				: this.props.controller.lang.temp_title_in,
			displayUnit: temp,
			sections: GaugeUtils.createTempSections(temp === UNITS.Temp.C),
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
			trendVisible: this.props.controller.gaugeConfig.tempTrendVisible
		};

		this.style = this.props.controller.gaugeConfig.showGaugeShadow
			? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(TempGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new steelseries.Radial(this.canvasRef.current, this.params);
			this.gauge.setValue(this.state.value);
		}
	}

	async update(data: any) {
		this._setState(mapLocalData(data));
	}

	setInOutTemp(sel: string) {
		if(this.state.data) {
			this._setState(this.state.data, sel);
		}
	}

	_setState(data: LocalDataDef, sel?: string) {
		let newState: any = {};

		if(data.tempunit !== this.state.displayUnit) {
			newState.displayUnit = data.tempunit,
			newState.sections = GaugeUtils.createTempSections(data.tempunit === UNITS.Temp.C)
		}

		if(sel) {
			newState.title = this.props.controller.lang.temp_title_out;
			newState.selected = sel;
		} 
		else {
			newState.data = data;
			newState.selected = this.state.selected;
		}

		newState.minValue = data.tempunit === UNITS.Temp.C
			? this.props.controller.gaugeConfig.tempScaleDefMinC
			: this.props.controller.gaugeConfig.tempScaleDefMinF;
		newState.maxValue = data.tempunit === UNITS.Temp.C
			? this.props.controller.gaugeConfig.tempScaleDefMaxC
			: this.props.controller.gaugeConfig.tempScaleDefMaxF;

		let lowScale: number, highScale: number;
		if(newState.selected === InOutTemp.OUT) {
			newState.value = extractDecimal(data.temp);
			
			lowScale = GaugeUtils.getMinTemp(newState.minValue, data);
			highScale = GaugeUtils.getMaxTemp(newState.maxValue, data);

			//loc = this.props.controller.lang.temp_out_info;
			
			if(this.params.trendVisible) {
				let trendVal = extractDecimal(data.temptrend);
				newState.trend = GaugeUtils.tempTrend(trendVal, data.tempunit, false);
			}

			let low = extractDecimal(data.tempTL);
			let high = extractDecimal(data.tempTH);
			newState.areas = [steelseries.Section(low, high, this.props.controller.gaugeConfig.minMaxArea)];
		}
		else {
			//Indoor selected 
			newState.value = extractDecimal(data.intemp);

			if (data.intempTL && data.intempTH) { // Indoor - and Max/Min values supplied
				lowScale = GaugeUtils.getMinTemp(newState.minValue, data);
				highScale = GaugeUtils.getMaxTemp(newState.maxValue, data);

				let low = extractDecimal(data.intempTL);
				let high = extractDecimal(data.intempTH);
				newState.areas = [steelseries.Section(low, high, this.props.controller.gaugeConfig.minMaxArea)];
			}
			else { // Indoor - no Max/Min values supplied
				lowScale = highScale = newState.value;
				newState.areas = [];
			}

			if (this.params.trendVisible) {
				newState.trend = steelseries.TrendState.OFF;
			}
		}
		
		// auto scale the ranges
		let scaleStep = data.tempunit === UNITS.Temp.C ? 10 : 20;
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

	componentDidUpdate(_prevProps: Props, prevState: State) {
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
		//FIXME setValueAnimated() from steelseries lib not working!
		//this.gauge.setValueAnimated(this.state.value);
		this.gauge.setValue(this.state.value);
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
				<button onClick={() => this.props.controller.changeUnits({ temp: UNITS.Temp.C})}>{UNITS.Temp.C}</button>
				<button onClick={() => this.props.controller.changeUnits({ temp: UNITS.Temp.F})}>{UNITS.Temp.F}</button>
			</div>
		</div>
	}
}

interface Props {
	controller: GaugesController,
	size: number
}

interface State {
	data?: LocalDataDef,

	displayUnit: string,
	maxMinVisible: boolean,
	selected: InOutTemp,

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

interface LocalDataDef {
	temp: any, tempunit: string, temptrend: any,
	tempTL: any, dewpointTL: any, apptempTL: any, wchillTL: any,
	tempTH: any, apptempTH: any, heatindexTH: any, humidex: any,
	intemp: any, intempTL: any, intempTH: any
}

function mapLocalData(data: any) {
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