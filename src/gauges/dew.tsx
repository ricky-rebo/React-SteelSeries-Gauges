import React, { Component } from 'react';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import GaugesController from '../controller/gauges_controller';
import styles from '../style/common.css';
import Cookies from 'universal-cookie/es6';
import { DewTemp } from './data-types';
import { RtData, TempUnit } from '../controller/data-types';
import { createTempSections, gaugeShadow, getMinTemp, getMaxTemp } from './gauge-utils.js';

const COOKIE_NAME = 'dew-display';

//TODO docs
class DewGauge extends Component<Props, State> {
	static NAME = "DEW_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: any;
	params: any;
	style: any;
	cookies: Cookies;

	constructor(props: Props) {
		super(props);

		this.canvasRef = React.createRef();

		let sel: DewTemp;
		if(props.controller.controllerConfig.useCookies) {
			this.cookies = new Cookies();

			sel = this.cookies.get(COOKIE_NAME);

			if(!sel) {
				sel = props.controller.gaugeConfig.dewDisplayType;
				this.cookies.set(COOKIE_NAME, sel);
			}
		}
		else {
			sel = props.controller.gaugeConfig.dewDisplayType;
		}

		let title: string = '';
		switch(sel) {
			case DewTemp.DEW: title = props.controller.lang.dew_title; break;
			case DewTemp.APP: title = props.controller.lang.apptemp_title; break;
			case DewTemp.WND: title = props.controller.lang.chill_title; break;
			case DewTemp.HEA: title = props.controller.lang.heat_title; break;
			case DewTemp.HUM: title = props.controller.lang.humdx_title;
		}

		//TODO get temptype from cookies, if config.useCookies = true

		let startVal = this.props.controller.gaugeConfig.tempScaleDefMinC + 0.0001;
		let { temp } = this.props.controller.getDisplayUnits();
		this.state = {
			title: title,
			displayUnit: temp,
			selected: sel,

			value: startVal,
			low: startVal,
			high: startVal,
			minValue: (temp === "°C")
				? this.props.controller.gaugeConfig.tempScaleDefMinC
				: this.props.controller.gaugeConfig.tempScaleDefMinF,
			maxValue: (temp === "°C")
				? this.props.controller.gaugeConfig.tempScaleDefMaxC
				: this.props.controller.gaugeConfig.tempScaleDefMaxF,
			minMeasuredVisible: (sel === DewTemp.WND),
			maxMeasuredVisible: (sel === DewTemp.HEA),
			sections: createTempSections(temp === "°C"),
			areas: [],

			//popUpTxt: '',
			//graph: '',
		}

		this.params = {
			...this.props.controller.commonParams,
			size: Math.ceil(this.props.size * this.props.controller.gaugeConfig.gaugeScaling),
			section: this.state.sections,
			area: this.state.areas,
			minValue: this.state.minValue,
			maxValue: this.state.maxValue,
			thresholdVisible: false,
			titleString: this.state.title,
			unitString: this.state.displayUnit
		};

		this.style = this.props.controller.gaugeConfig.showGaugeShadow
			? gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(DewGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new steelseries.Radial(this.canvasRef.current, this.params);
			this.gauge.setValue(this.state.value);
		}
	}

	async update(data: RtData) {
		this._setState(mapLocalData(data));
	}

	showTemp(sel: DewTemp) {
		if(this.state.data) {
			this._setState(this.state.data, sel);

			if(this.props.controller.controllerConfig.useCookies && this.cookies)
				this.cookies.set(COOKIE_NAME, sel);
		}
	}

	_setState(data: LocalDataDef, sel?: DewTemp) {
		let newState: any = {};

		if(data.tempunit !== this.state.displayUnit) {
			newState.displayUnit = data.tempunit,
			newState.sections = createTempSections(data.tempunit === "°C")
		}

		if(sel) {
			newState.selected = sel;
			switch (sel) {
				case DewTemp.DEW:
					newState.title = this.props.controller.lang.dew_title;
					newState.minMeasuredVisible = newState.maxMeasuredVisible = false;
					break;
				case DewTemp.APP:
					newState.title = this.props.controller.lang.apptemp_title;
					newState.minMeasuredVisible = newState.maxMeasuredVisible = false;
				break;
				case DewTemp.WND:
					newState.title = this.props.controller.lang.chill_title;
					newState.minMeasuredVisible = true;
					newState.maxMeasuredVisible = false;
				break;
				case DewTemp.HEA:
					newState.title = this.props.controller.lang.heat_title;
					newState.minMeasuredVisible = false;
					newState.maxMeasuredVisible = true;
				break;
				case DewTemp.HUM:
					newState.title = this.props.controller.lang.humdx_title;
					newState.minMeasuredVisible = newState.maxMeasuredVisible = false;
			}
		}
		else {
			newState.selected = this.state.selected;
			newState.data = data;
		}

		newState.minValue = data.tempunit === "°C"
			? this.props.controller.gaugeConfig.tempScaleDefMinC
			: this.props.controller.gaugeConfig.tempScaleDefMinF;
		newState.maxValue = data.tempunit === "°C"
			? this.props.controller.gaugeConfig.tempScaleDefMaxC
			: this.props.controller.gaugeConfig.tempScaleDefMaxF;
		
		switch (newState.selected) {
			case DewTemp.DEW: // dew point
				newState.low = data.dewpointTL;
				newState.high = data.dewpointTH;
				newState.value = data.dew;
				newState.areas = [steelseries.Section(newState.low, newState.high, this.props.controller.gaugeConfig.minMaxArea)];
				break;
			case DewTemp.APP: // apparent temperature
				newState.low = data.apptempTL;
				newState.high = data.apptempTH;
				newState.value = data.apptemp;
				newState.areas = [steelseries.Section(newState.low, newState.high, this.props.controller.gaugeConfig.minMaxArea)];
				break;
			case DewTemp.WND: // wind chill
				newState.low = data.wchillTL;
				newState.high = data.wchill;
				newState.value = data.wchill;
				newState.areas = [];
				break;
			case DewTemp.HEA: // heat index
				newState.low = data.heatindex;
				newState.high = data.heatindexTH;
				newState.value = data.heatindex;
				newState.areas = [];
				break;
			case DewTemp.HUM: // humidex
				newState.low = data.humidex;
				newState.high = data.humidex;
				newState.value = data.humidex;
				newState.areas = [];
				break;
		}

		// auto scale the ranges
		let lowScale = getMinTemp(newState.minValue, data),
				highScale = getMaxTemp(newState.maxValue, data),
				scaleStep = data.tempunit === "°C" ? 10 : 20;
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
		if (this.state.selected !== prevState.selected) {
			this.gauge.setTitleString(this.state.title);

			//TODO change shown graph
		}

		if(this.state.displayUnit !== prevState.displayUnit) {
			this.gauge.setUnitString(this.state.displayUnit);
			this.gauge.setSection(this.state.sections)
		}

		if (this.state.minValue !== this.gauge.getMinValue() || this.state.maxValue !== this.gauge.getMaxValue()) {
			this.gauge.setMinValue(this.state.minValue);
			this.gauge.setMaxValue(this.state.maxValue);
			this.gauge.setValue(this.state.minValue);
		}

		this.gauge.setMinMeasuredValueVisible(this.state.minMeasuredVisible);
		this.gauge.setMaxMeasuredValueVisible(this.state.maxMeasuredVisible);
		this.gauge.setMinMeasuredValue(this.state.low);
		this.gauge.setMaxMeasuredValue(this.state.high);
		this.gauge.setArea(this.state.areas);
		//FIXME Tween.js anmation in steelseries lib not workig 
		//this.gauge.setValueAnimated(this.state.value);
		this.gauge.setValue(this.state.value);

		//TODO set popup text
	}

	render() {
		return (
			<div className={styles.gauge}>
				<div id="tip_1">
					<canvas 
						ref={this.canvasRef}
						width={this.params.size}
						height={this.params.size}
						style={this.style}
					></canvas>
				</div>
				<div>
					<button onClick={() => this.showTemp(DewTemp.APP)}>App</button>
					<button onClick={() => this.showTemp(DewTemp.DEW)}>Dew</button>
					<button onClick={() => this.showTemp(DewTemp.WND)}>Wnd</button>
					<button onClick={() => this.showTemp(DewTemp.HEA)}>Hea</button>
					<button onClick={() => this.showTemp(DewTemp.HUM)}>Hum</button>
				</div>
				<div>
					<button onClick={() => this.props.controller.changeUnits({ temp: "°C"})}> °C </button>
					<button onClick={() => this.props.controller.changeUnits({ temp: "°F"})}> °F </button>
				</div>
				
			</div>
		);
	}
}

interface Props {
	controller: GaugesController,
	size: number
}

interface State {
	data?: LocalDataDef,

	title: string,
	displayUnit: TempUnit,
	selected: DewTemp,
	
	minValue: number,
	maxValue: number,
	value: number,
	low: number,
	high: number,
	minMeasuredVisible: boolean,
	maxMeasuredVisible: boolean,

	sections: any[],
	areas: any[],

	//popUpTxt: string,
	//graph: string
}


interface LocalDataDef {
	tempunit: TempUnit, tempTL: number, tempTH: number
	dew: number, dewpointTL: number, dewpointTH: number,
	apptemp: number, apptempTL: number, apptempTH: number,
	wchill: number, wchillTL: number,
	heatindex: number, heatindexTH: number,
	humidex: number
}

function mapLocalData(data: RtData) {
	let localdata: LocalDataDef = {
		tempunit: data.tempunit,
		tempTL: data.tempTL,
		tempTH: data.tempTH,
		dew: data.dew,
		dewpointTL: data.dewpointTL,
		dewpointTH: data.dewpointTH,
		apptemp: data.apptemp,
		apptempTL: data.apptempTL,
		apptempTH: data.apptempTH,
		wchill: data.wchill,
		wchillTL: data.wchillTL,
		heatindex: data.heatindex,
		heatindexTH: data.heatindexTH,
		humidex: data.humidex
	}
	return localdata;
}

export default DewGauge;
export { DewGauge };