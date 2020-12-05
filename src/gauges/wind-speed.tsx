import React, { Component } from 'react';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import GaugesController from '../controller/gauges_controller';
import styles from '../style/common.css';
import { gaugeShadow, nextHighest } from './gauge-utils.js';
import { RtData, WindUnit } from '../controller/data-types.js';

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
			case "mph": maxVal = props.controller.gaugeConfig.windScaleDefMaxMph; break;
			case "kts": maxVal = props.controller.gaugeConfig.windScaleDefMaxKts; break;
			case "km/h": maxVal = props.controller.gaugeConfig.windScaleDefMaxKmh; break;
			case "m/s": 	maxVal = props.controller.gaugeConfig.windScaleDefMaxMs; break;
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
			? gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
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

	async update({ wlatest, wgustTM, wspeed, wgust, windunit }: RtData) {
		let newState: any = {};

		if(windunit !== this.state.displayUnit) {
			newState.displayUnit = windunit;
		}

		newState.value = wlatest;
		newState.maxGustToday = wgustTM;

		let average = wspeed, gust = wgust;
		
		//let maxAvgToday = extractDecimal(data.windTM);

		switch (windunit) {
			case "mph":
			case "kts":
				newState.maxValue = Math.max(
					nextHighest(newState.maxGustToday, 10),
					this.props.controller.gaugeConfig.windScaleDefMaxMph
				);
				break;
			case "m/s":
				newState.maxValue = Math.max(
					nextHighest(newState.maxGustToday, 5),
					this.props.controller.gaugeConfig.windScaleDefMaxMs
				);
				break;
			default:
				newState.maxValue = Math.max(
					nextHighest(newState.maxGustToday, 20),
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
					<button onClick={() => this.props.controller.changeUnits({ wind: "km/h" })}> km/h </button>
					<button onClick={() => this.props.controller.changeUnits({ wind: "kts" })}> kts </button>
					<button onClick={() => this.props.controller.changeUnits({ wind: "m/s" })}> m/s </button>
					<button onClick={() => this.props.controller.changeUnits({ wind: "mph" })}> mph </button>
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
	displayUnit: WindUnit

	//popUpTxt: string,
	//graph: string
}

export default WindSpeedGauge;