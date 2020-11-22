import React, { Component } from 'react';
import GaugeUtils from '../utils/gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import DataUtils from '../utils/data-utils';
import GaugesController from '../gauges-controller';
import styles from '../style/common.css';

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
	
		this.state = {
			value:  0.0001,
			maxValue:  this.props.controller.gaugeGlobals.windScaleDefMaxKph,
			area: [],
			maxGustToday:0
		}

		this.params = {
			...this.props.controller.commonParams,
			size: Math.ceil(this.props.size * this.props.controller.config.gaugeScaling),
			maxValue: this.state.maxValue,
			niceScale: false,
			area: this.state.area,
			maxMeasuredValueVisible: true,
			titleString: this.props.controller.lang.wind_title,
			unitString: this.props.controller.getDisplayUnits().wind,
			thresholdVisible: false,
		};

		this.style = this.props.controller.config.showGaugeShadow
			? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeGlobals.shadowColour)
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

		newState.value = DataUtils.extractDecimal(wlatest);
		newState.maxGustToday = DataUtils.extractDecimal(wgustTM);

		let average = DataUtils.extractDecimal(wspeed);
		let gust = DataUtils.extractDecimal(wgust);
		
		//let maxAvgToday = DataUtils.extractDecimal(data.windTM);

		switch (windunit) {
			case 'mph':
			case 'kts':
				newState.maxValue = Math.max(
					GaugeUtils.nextHighest(newState.maxGustToday, 10),
					this.props.controller.gaugeGlobals.windScaleDefMaxMph
				);
				break;
			case 'm/s':
				newState.maxValue = Math.max(
					GaugeUtils.nextHighest(newState.maxGustToday, 5),
					this.props.controller.gaugeGlobals.windScaleDefMaxMs
				);
				break;
			default:
				newState.maxValue = Math.max(
					GaugeUtils.nextHighest(newState.maxGustToday, 20),
					this.props.controller.gaugeGlobals.windScaleDefMaxKmh
				);
		}

		newState.area=[
			steelseries.Section(0, average, this.props.controller.gaugeGlobals.windAvgArea),
			steelseries.Section(average, gust, this.props.controller.gaugeGlobals.minMaxArea)
		];

		this.setState(newState);
	}

	componentDidUpdate() {
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
	maxGustToday:number,

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