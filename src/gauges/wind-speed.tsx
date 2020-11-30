import React, { Component } from 'react';
import GaugeUtils from '../utils/gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import DataUtils from '../utils/data-utils';
import GaugesController from '../controller/gauges_controller';
import styles from '../style/common.css';
import { UNITS } from '../controller/defaults';

//TODO docs
class WindSpeedGauge extends Component<Props, State> {
	static NAME = "WINDSPEED_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: any;
	params: any;
	style: any;

	constructor(props: Props) {
		super(props);

		this.canvasRef = React.createRef();
	
		let { wind } = props.controller.getDisplayUnits();
		let maxVal: number;
		switch (wind) {
			case UNITS.Wind.MPH: maxVal = props.controller.gaugeConfig.windScaleDefMaxMph; break;
			case UNITS.Wind.Knots: maxVal = props.controller.gaugeConfig.windScaleDefMaxKts; break;
			case UNITS.Wind.KM_H: maxVal = props.controller.gaugeConfig.windScaleDefMaxKmh; break;
			case UNITS.Wind.M_S: 	maxVal = props.controller.gaugeConfig.windScaleDefMaxMs; break;
			default: maxVal = 0.0001;
		}
		this.state = {
			value: 0.0001,
			maxValue: maxVal,
			area: [],
			maxGustToday: 0.0001,
			displayUnit: wind
		}

		this.params = {
			...props.controller.commonParams,
			size: Math.ceil(props.size * props.controller.gaugeConfig.gaugeScaling),
			maxValue: this.state.maxValue,
			niceScale: false,
			area: this.state.area,
			maxMeasuredValueVisible: true,
			titleString: props.controller.lang.wind_title,
			unitString: this.state.displayUnit,
			thresholdVisible: false,
		};

		this.style = this.props.controller.gaugeConfig.showGaugeShadow
			? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(WindSpeedGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new steelseries.Radial(this.canvasRef.current, this.params);
			this.gauge.setValue(this.state.value);
		}
	}

	async update({ wlatest, wgustTM, wspeed, wgust, windunit }: DataParamDef) {
		let newState: any = {};

		if(windunit !== this.state.displayUnit) {
			newState.displayUnit = windunit;
		}

		newState.value = DataUtils.extractDecimal(wlatest);
		newState.maxGustToday = DataUtils.extractDecimal(wgustTM);

		let average = DataUtils.extractDecimal(wspeed);
		let gust = DataUtils.extractDecimal(wgust);
		
		//let maxAvgToday = DataUtils.extractDecimal(data.windTM);

		switch (windunit) {
			case UNITS.Wind.MPH:
			case UNITS.Wind.Knots:
				newState.maxValue = Math.max(
					GaugeUtils.nextHighest(newState.maxGustToday, 10),
					this.props.controller.gaugeConfig.windScaleDefMaxMph
				);
				break;
			case UNITS.Wind.M_S:
				newState.maxValue = Math.max(
					GaugeUtils.nextHighest(newState.maxGustToday, 5),
					this.props.controller.gaugeConfig.windScaleDefMaxMs
				);
				break;
			default:
				newState.maxValue = Math.max(
					GaugeUtils.nextHighest(newState.maxGustToday, 20),
					this.props.controller.gaugeConfig.windScaleDefMaxKmh
				);
		}

		newState.area=[
			steelseries.Section(0, average, this.props.controller.gaugeConfig.windAvgArea),
			steelseries.Section(average, gust, this.props.controller.gaugeConfig.minMaxArea)
		];

		this.setState(newState);
	}

	componentDidUpdate(_prevProps: Props, prevState: State) {
		if(this.state.displayUnit !== prevState.displayUnit) {
			this.gauge.setUnitString(this.state.displayUnit);
		}

		if(this.gauge.getMaxValue() !== this.state.maxValue) {
				this.gauge.setMaxValue(this.state.maxValue)
		}
	
		this.gauge.setArea(this.state.area);
		this.gauge.setMaxMeasuredValue(this.state.maxGustToday)
		//FIXME setValueAnimated() from steelseries lib not working!
		//this.gauge.setValueAnimated(this.state.value);
		this.gauge.setValue(this.state.value);
	}

	render() {
		return (
			<div className={styles.gauge}>
				<canvas 
					ref={this.canvasRef}
					width={this.params.size}
					height={this.params.size}
					style={this.style}
				></canvas>
				<div>
					<button onClick={() => this.props.controller.changeUnits({ windUnit: UNITS.Wind.KM_H })}>{UNITS.Wind.KM_H}</button>
					<button onClick={() => this.props.controller.changeUnits({ windUnit: UNITS.Wind.Knots })}>{UNITS.Wind.Knots}</button>
					<button onClick={() => this.props.controller.changeUnits({ windUnit: UNITS.Wind.MPH })}>{UNITS.Wind.MPH}</button>
					<button onClick={() => this.props.controller.changeUnits({ windUnit: UNITS.Wind.M_S })}>{UNITS.Wind.M_S}</button>
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
	value: number,
	area: [],
	maxValue: number,
	maxGustToday: number,
	displayUnit: string

	//popUpTxt: string,
	//graph: string
}

type DataParamDef = {
	wlatest: any,
	wgustTM: any,
	wspeed: any,
	wgust: any,
	windunit: string
};

export default WindSpeedGauge;