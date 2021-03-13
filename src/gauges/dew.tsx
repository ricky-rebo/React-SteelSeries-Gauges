import React, { Component } from 'react';
// @ts-ignore
import { Radial, Section } from "steelseries";
import styles from '../style/common.css';
import Cookies from 'universal-cookie/es6';
import { DewType, CommonProps, RGBAColor } from './types';
import { Lang, RtData, TempUnit } from '../controller/types';
import { createTempSections, gaugeShadow, getMinTemp, getMaxTemp } from './utils';
import { DEW_DISPLAY_TYPE, getCommonParams, MIN_MAX_AREA_COLOR, SHADOW_COLOR, SHOW_GAUGE_SHADOW, TempScaleDef } from './defaults';

const COOKIE_NAME = 'dew-display';


class DewGauge extends Component<CommonProps, State> {
	static NAME = "DEW_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: Radial;

	config: Config;

	//params: any;
	style: React.CSSProperties;
	cookies: Cookies;

	constructor(props: CommonProps) {
		super(props);

		this.canvasRef = React.createRef();

		this.config = {
			scaleDef: TempScaleDef,

			displayTemp: DEW_DISPLAY_TYPE,
			minMaxAreaColor: MIN_MAX_AREA_COLOR,

			showGaugeShadow: SHOW_GAUGE_SHADOW,
			shadowColor: SHADOW_COLOR
		}

		let sel: DewType;
		if(props.controller.config.useCookies) {
			this.cookies = new Cookies();

			sel = this.cookies.get(COOKIE_NAME);

			if(!sel) {
				sel = this.config.displayTemp;
				this.cookies.set(COOKIE_NAME, sel);
			}
		}
		else {
			sel = this.config.displayTemp;
		}

		let title: string = getTitle(sel, props.controller.lang);


		let { temp } = this.props.controller.getDisplayUnits();
		let startVal = (temp === "°C" 
			? this.config.scaleDef.Min_C
			: this.config.scaleDef.Min_F
		) + 0.0001;
		
		this.state = {
			title: title,
			displayUnit: temp,
			selected: sel,

			value: startVal,
			low: startVal,
			high: startVal,
			minValue: (temp === "°C")
				? this.config.scaleDef.Min_C
				: this.config.scaleDef.Min_F,
			maxValue: (temp === "°C")
				? this.config.scaleDef.Max_C
				: this.config.scaleDef.Max_F,
			minMeasuredVisible: (sel === "wnd"),
			maxMeasuredVisible: (sel === "hea"),
			sections: createTempSections(temp === "°C"),
			areas: [],

			//popUpTxt: '',
			//graph: '',
		}

		/*this.params = {
			...this.props.controller.commonParams,
			size: this.props.size,
			section: this.state.sections,
			area: this.state.areas,
			minValue: this.state.minValue,
			maxValue: this.state.maxValue,
			thresholdVisible: false,
			titleString: this.state.title,
			unitString: this.state.displayUnit
		};*/

		this.style = this.config.showGaugeShadow
			? gaugeShadow(this.props.size, this.config.shadowColor)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(DewGauge.NAME, this.update);
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
				titleString: this.state.title,
				unitString: this.state.displayUnit
			});

			this.gauge.setValue(this.state.value);
		}
	}

	async update(data: RtData) {
		this._setState(mapLocalData(data));
	}

	showTemp(sel: DewType) {
		if(this.state.data) {
			this._setState(this.state.data, sel);

			if(this.props.controller.config.useCookies && this.cookies)
				this.cookies.set(COOKIE_NAME, sel);
		}
	}

	_setState(data: LocalDataDef, sel?: DewType) {
		let newState: any = {};

		if(data.tempunit !== this.state.displayUnit) {
			newState.displayUnit = data.tempunit,
			newState.sections = createTempSections(data.tempunit === "°C")
		}

		if(sel) {
			newState.selected = sel;
			newState.title = getTitle(sel, this.props.controller.lang);
			newState.minMeasuredVisible = (sel === "wnd");
			newState.maxMeasuredVisible = (sel === "hea");
		}
		else {
			newState.selected = this.state.selected;
			newState.data = data;
		}

		newState.minValue = data.tempunit === "°C"
			? this.config.scaleDef.Min_C
			: this.config.scaleDef.Min_F;
		newState.maxValue = data.tempunit === "°C"
			? this.config.scaleDef.Max_C
			: this.config.scaleDef.Max_F;
		
		switch (newState.selected) {
			case "dew": // dew point
				newState.low = data.dewpointTL;
				newState.high = data.dewpointTH;
				newState.value = data.dew;
				newState.areas = [Section(newState.low, newState.high, this.config.minMaxAreaColor)];
				break;
			case "app": // apparent temperature
				newState.low = data.apptempTL;
				newState.high = data.apptempTH;
				newState.value = data.apptemp;
				newState.areas = [Section(newState.low, newState.high, this.config.minMaxAreaColor)];
				break;
			case "wnd": // wind chill
				newState.low = data.wchillTL;
				newState.high = data.wchill;
				newState.value = data.wchill;
				newState.areas = [];
				break;
			case "hea": // heat index
				newState.low = data.heatindex;
				newState.high = data.heatindexTH;
				newState.value = data.heatindex;
				newState.areas = [];
				break;
			case "hum": // humidex
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

	componentDidUpdate(_prevProps: CommonProps, prevState: State) {
		if (this.state.selected !== prevState.selected) {
			this.gauge.setTitleString(this.state.title);
			this.gauge.setMinMeasuredValueVisible(this.state.minMeasuredVisible);
			this.gauge.setMaxMeasuredValueVisible(this.state.maxMeasuredVisible);
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

		if(this.state.minMeasuredVisible) this.gauge.setMinMeasuredValue(this.state.low);
		if(this.state.maxMeasuredVisible) this.gauge.setMaxMeasuredValue(this.state.high);

		this.gauge.setArea(this.state.areas);
		this.gauge.setValueAnimated(this.state.value);

		//TODO set popup text
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
					<button onClick={() => this.showTemp("app")}>App</button>
					<button onClick={() => this.showTemp("dew")}>Dew</button>
					<button onClick={() => this.showTemp("wnd")}>Wnd</button>
					<button onClick={() => this.showTemp("hea")}>Hea</button>
					<button onClick={() => this.showTemp("hum")}>Hum</button>
				</div>
				<div>
					<button onClick={() => this.props.controller.changeUnits({ temp: "°C"})}> °C </button>
					<button onClick={() => this.props.controller.changeUnits({ temp: "°F"})}> °F </button>
				</div>
				
			</div>
		);
	}
}


interface State {
	data?: LocalDataDef,

	title: string,
	displayUnit: TempUnit,
	selected: DewType,
	
	minValue: number,
	maxValue: number,
	value: number,
	low: number,
	high: number,
	minMeasuredVisible: boolean,
	maxMeasuredVisible: boolean,

	sections: any[],
	areas: any[],

	//popUpTxt: string
}

interface Config {
	scaleDef: typeof TempScaleDef,

	displayTemp: DewType,
	minMaxAreaColor: RGBAColor,

	showGaugeShadow: boolean,
	shadowColor: RGBAColor
}


export interface LocalDataDef {
	tempunit: TempUnit,
	tempTL: number,
	tempTH: number
	dew: number,
	dewpointTL: number,
	dewpointTH: number,
	apptemp: number,
	apptempTL: number,
	apptempTH: number,
	wchill: number,
	wchillTL: number,
	heatindex: number,
	heatindexTH: number,
	humidex: number
}


function getTitle(sel: string, lang: Lang) {
	switch (sel) {
		case "dew": return lang.dew_title;
		case "app": return lang.apptemp_title;
		case "wnd": return lang.chill_title;
		case "hea": return lang.heat_title;
		case "hum": return lang.humdx_title;
		default: return "";
	}
}

const mapLocalData = (data: RtData): LocalDataDef => ({
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
})

export default DewGauge;
export { DewGauge };