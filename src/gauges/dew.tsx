import React, { Component } from 'react';
import GaugeUtils from '../utils/gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import DataUtils from '../utils/data-utils';
import GaugesController from '../controller/gauges_controller';
import styles from '../style/common.css';
import Cookies from 'universal-cookie/es6';
import { UNITS } from '../controller/defaults';

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

		let sel: TempType;
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
			case TempType.DEW: title = props.controller.lang.dew_title; break;
			case TempType.APP: title = props.controller.lang.apptemp_title; break;
			case TempType.WND: title = props.controller.lang.chill_title; break;
			case TempType.HEA: title = props.controller.lang.heat_title; break;
			case TempType.HUM: title = props.controller.lang.humdx_title;
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
			minValue: (temp === UNITS.Temp.C)
				? this.props.controller.gaugeConfig.tempScaleDefMinC
				: this.props.controller.gaugeConfig.tempScaleDefMinF,
			maxValue: (temp === UNITS.Temp.C)
				? this.props.controller.gaugeConfig.tempScaleDefMaxC
				: this.props.controller.gaugeConfig.tempScaleDefMaxF,
			minMeasuredVisible: (sel === TempType.WND),
			maxMeasuredVisible: (sel === TempType.HEA),
			sections: GaugeUtils.createTempSections(temp === UNITS.Temp.C),
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
			? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
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

	async update(data: any) {
		this._setState(mapLocalData(data));
	}

	showTemp(sel: TempType) {
		if(this.state.data) {
			this._setState(this.state.data, sel);

			if(this.props.controller.controllerConfig.useCookies && this.cookies)
				this.cookies.set(COOKIE_NAME, sel);
		}
	}

	_setState(data: LocalDataDef, sel?: TempType) {
		let newState: any = {};

		if(data.tempunit !== this.state.displayUnit) {
			newState.displayUnit = data.tempunit,
			newState.sections = GaugeUtils.createTempSections(data.tempunit === UNITS.Temp.C)
		}

		if(sel) {
			newState.selected = sel;
			switch (sel) {
				case TempType.DEW:
					newState.title = this.props.controller.lang.dew_title;
					newState.minMeasuredVisible = newState.maxMeasuredVisible = false;
					break;
				case TempType.APP:
					newState.title = this.props.controller.lang.apptemp_title;
					newState.minMeasuredVisible = newState.maxMeasuredVisible = false;
				break;
				case TempType.WND:
					newState.title = this.props.controller.lang.chill_title;
					newState.minMeasuredVisible = true;
					newState.maxMeasuredVisible = false;
				break;
				case TempType.HEA:
					newState.title = this.props.controller.lang.heat_title;
					newState.minMeasuredVisible = false;
					newState.maxMeasuredVisible = true;
				break;
				case TempType.HUM:
					newState.title = this.props.controller.lang.humdx_title;
					newState.minMeasuredVisible = newState.maxMeasuredVisible = false;
			}
		}
		else {
			newState.selected = this.state.selected;
			newState.data = data;
		}

		newState.minValue = data.tempunit === UNITS.Temp.C
			? this.props.controller.gaugeConfig.tempScaleDefMinC
			: this.props.controller.gaugeConfig.tempScaleDefMinF;
		newState.maxValue = data.tempunit === UNITS.Temp.C
			? this.props.controller.gaugeConfig.tempScaleDefMaxC
			: this.props.controller.gaugeConfig.tempScaleDefMaxF;
		
		switch (newState.selected) {
			case TempType.DEW: // dew point
				newState.low = DataUtils.extractDecimal(data.dewpointTL);
				newState.high = DataUtils.extractDecimal(data.dewpointTH);
				newState.value = DataUtils.extractDecimal(data.dew);
				newState.areas = [steelseries.Section(newState.low, newState.high, this.props.controller.gaugeConfig.minMaxArea)];
				break;
			case TempType.APP: // apparent temperature
				newState.low = DataUtils.extractDecimal(data.apptempTL);
				newState.high = DataUtils.extractDecimal(data.apptempTH);
				newState.value = DataUtils.extractDecimal(data.apptemp);
				newState.areas = [steelseries.Section(newState.low, newState.high, this.props.controller.gaugeConfig.minMaxArea)];
				break;
			case TempType.WND: // wind chill
				newState.low = DataUtils.extractDecimal(data.wchillTL);
				newState.high = DataUtils.extractDecimal(data.wchill);
				newState.value = DataUtils.extractDecimal(data.wchill);
				newState.areas = [];
				break;
			case TempType.HEA: // heat index
				newState.low = DataUtils.extractDecimal(data.heatindex);
				newState.high = DataUtils.extractDecimal(data.heatindexTH);
				newState.value = DataUtils.extractDecimal(data.heatindex);
				newState.areas = [];
				break;
			case TempType.HUM: // humidex
				newState.low = DataUtils.extractDecimal(data.humidex);
				newState.high = DataUtils.extractDecimal(data.humidex);
				newState.value = DataUtils.extractDecimal(data.humidex);
				newState.areas = [];
				break;
		}

		// auto scale the ranges
		let lowScale = GaugeUtils.getMinTemp(newState.minValue, data),
				highScale = GaugeUtils.getMaxTemp(newState.maxValue, data),
				scaleStep = data.tempunit[1] === 'C' ? 10 : 20;
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
					<button onClick={() => this.showTemp(TempType.APP)}>App</button>
					<button onClick={() => this.showTemp(TempType.DEW)}>Dew</button>
					<button onClick={() => this.showTemp(TempType.WND)}>Wnd</button>
					<button onClick={() => this.showTemp(TempType.HEA)}>Hea</button>
					<button onClick={() => this.showTemp(TempType.HUM)}>Hum</button>
				</div>
				<div>
					<button onClick={() => this.props.controller.changeUnits({ tempUnit: UNITS.Temp.C})}>{UNITS.Temp.C}</button>
					<button onClick={() => this.props.controller.changeUnits({ tempUnit: UNITS.Temp.F})}>{UNITS.Temp.F}</button>
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
	displayUnit: string,
	selected: TempType,
	
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

enum TempType {
	APP = 'app',
	DEW = 'dew',
	WND = 'wnd',
	HEA = 'hea',
	HUM = 'hum'
}

interface LocalDataDef {
	tempunit: string, tempTL: any, tempTH: any
	dew: any, dewpointTL: any, dewpointTH: any,
	apptemp: any, apptempTL: any, apptempTH: any,
	wchill: any, wchillTL: any,
	heatindex: any, heatindexTH: any,
	humidex: any
}

function mapLocalData(data: any) {
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
export { DewGauge, TempType as DewTempType };