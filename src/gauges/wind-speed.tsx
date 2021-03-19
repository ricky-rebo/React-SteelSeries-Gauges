import React, { Component } from 'react';
// @ts-ignore
import { Radial, Section } from "steelseries";
import styles from '../style/common.css';
import { gaugeShadow, nextHighest } from './utils';
import { RtData, WindUnit } from '../controller/types';
import { CommonProps, RGBAColor/*, GaugeComponent*/ } from './types';
import { getCommonParams, MIN_MAX_AREA_COLOR, SHADOW_COLOR, SHOW_GAUGE_SHADOW, WindScaleDef, WIND_AVG_AREA_COLOR } from './defaults';


class WindSpeedGauge extends Component<CommonProps, State> { //GaugeComponent<CommonProps, State, Config> {
	static NAME = "WINDSPEED_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: Radial;

	config: Config;

	style: React.CSSProperties;

	constructor(props: CommonProps) {
		super(props);

		this.canvasRef = React.createRef();

		this.config = {
			scaleDef: WindScaleDef,
			windAvgAreaColor: WIND_AVG_AREA_COLOR,
			minMaxAreaColor: MIN_MAX_AREA_COLOR,

			showGaugeShadow: SHOW_GAUGE_SHADOW,
			shadowColor: SHADOW_COLOR
		}
	
		let { wind } = props.controller.getDisplayUnits();
		this.state = {
			value: 0.0001,
			maxValue: getMax(wind, 0.0001, this.config.scaleDef),
			area: [],
			maxGustToday: 0.0001,
			displayUnit: wind
		}

		this.style = this.config.showGaugeShadow
			? gaugeShadow(this.props.size, this.config.shadowColor)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(WindSpeedGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new Radial(this.canvasRef.current, {
				...getCommonParams(),
	
				size: this.props.size,
				maxValue: this.state.maxValue,
				niceScale: false,
				area: this.state.area,
				maxMeasuredValueVisible: true,
				titleString: this.props.controller.lang.wind_title,
				unitString: this.state.displayUnit,
				thresholdVisible: false,
			});
			this.gauge.setValue(this.state.value);
		}
	}

	async update({ wlatest, wspeed, wgust, wgustTM, windunit }: RtData) {
		let newState: any = {};

		if(windunit !== this.state.displayUnit) {
			newState.displayUnit = windunit;
		}

		newState.value = wlatest;
		newState.maxGustToday = wgustTM;

		let average = wspeed, gust = wgust;
		
		//let maxAvgToday = extractDecimal(data.windTM);

		newState.maxValue = getMax(windunit, newState.maxGustToday, this.config.scaleDef);

		newState.area=[
			Section(0, average, this.config.windAvgAreaColor),
			Section(average, gust, this.config.minMaxAreaColor)
		];

		this.setState(newState);
	}

	componentDidUpdate(_prevProps: CommonProps, prevState: State) {
		if(this.state.displayUnit !== prevState.displayUnit) {
			this.gauge.setUnitString(this.state.displayUnit);
		}

		if(this.gauge.getMaxValue() !== this.state.maxValue) {
				this.gauge.setMaxValue(this.state.maxValue)
				this.gauge.setValue(this.gauge.getMinValue());
		}
	
		this.gauge.setArea(this.state.area);
		this.gauge.setMaxMeasuredValue(this.state.maxGustToday)
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
					<button onClick={() => this.props.controller.changeUnits({ wind: "km/h" })}> km/h </button>
					<button onClick={() => this.props.controller.changeUnits({ wind: "kts" })}> kts </button>
					<button onClick={() => this.props.controller.changeUnits({ wind: "m/s" })}> m/s </button>
					<button onClick={() => this.props.controller.changeUnits({ wind: "mph" })}> mph </button>
				</div>
			</div>
		);
	}
}


interface Config {
	scaleDef: typeof WindScaleDef,
	windAvgAreaColor: RGBAColor,
	minMaxAreaColor: RGBAColor,

	showGaugeShadow: boolean,
	shadowColor: RGBAColor
}

interface State {
	value: number,
	area: [],
	maxValue: number,
	maxGustToday: number,
	displayUnit: WindUnit

	//popUpTxt: string
}


function getMax(unit: WindUnit, value: number, scaleDef: typeof WindScaleDef) {
	switch (unit) {
		case "mph":
			return Math.max(nextHighest(value, 10), scaleDef.Max_Mph);
		case "kts":
			return Math.max(nextHighest(value, 10), scaleDef.Max_Kts);
		case "m/s":
			return Math.max(nextHighest(value, 5), scaleDef.Max_Ms);
		case "km/h":
			return Math.max(nextHighest(value, 20), scaleDef.Max_Kmh);
		default:
			return 0.0001
	}
}

export default WindSpeedGauge;