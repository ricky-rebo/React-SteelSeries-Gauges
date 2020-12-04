import React, { Component } from 'react';
import GaugeUtils from './gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import GaugesController from '../controller/gauges_controller';
import styles from '../style/common.css';
import { extractInteger } from '../controller/data-utils';

//TODO docs
class SolarGauge extends Component<Props, State> {
	static NAME = "SOLAR_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: any;
	params: any;
	style: any;

	constructor(props: Props) {
		super(props);

		this.canvasRef = React.createRef();
	
		this.state = {
			value:  0.0001,
			maxValue: this.props.controller.gaugeConfig.solarGaugeScaleMax,
			maxToday: 0,
			sections: [
				steelseries.Section(0, 600, 'rgba(40,149,0,0.3)'),
				steelseries.Section(600, 800, 'rgba(248,89,0,0.3)'),
				steelseries.Section(800, 1000, 'rgba(216,0,29,0.3)'),
				steelseries.Section(1000, 1800, 'rgba(107,73,200,0.3)')
			],
			area: [],
			ledState : false,

			//popUpTxt: '',
			//popUpGraph: '',
		};

		this.params = {
			...this.props.controller.commonParams,
			size: Math.ceil(this.props.size * this.props.controller.gaugeConfig.gaugeScaling),
			section: this.state.sections,
			maxValue: this.state.maxValue,
			titleString: this.props.controller.lang.solar_title,
			niceScale: false,
			unitString: 'W/m\u00B2',
			thresholdVisible: false,
			lcdDecimals: 0,
			userLedVisible : this.props.controller.gaugeConfig.showSunshineLed,
			userLedColor : steelseries.LedColor.YELLOW_LED,
			maxMeasuredValueVisible: true,
		};

		this.style = this.props.controller.gaugeConfig.showGaugeShadow
			? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(SolarGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new steelseries.Radial(this.canvasRef.current, this.params);
			this.gauge.setValue(this.state.value);
		}
	}

	async update({ SolarRad, SolarTM, CurrentSolarMax } : DataParamDef) {
		let newState: any = {};

		newState.value = extractInteger(SolarRad);
		newState.maxToday = extractInteger(SolarTM);
		newState.currMaxValue = extractInteger(CurrentSolarMax);

		newState.maxValue = Math.max(newState.value, newState.currMaxValue, newState.maxToday, this.props.controller.gaugeConfig.solarGaugeScaleMax);
		newState.maxValue = GaugeUtils.nextHighest(newState.maxValue, 100);


		let { sunshineThresholdPct, sunshineThreshold } = this.props.controller.gaugeConfig;
		if(CurrentSolarMax !== 'N/A'){
			newState.area=[
				// Sunshine threshold
				steelseries.Section(
					Math.max(newState.currMaxValue * sunshineThresholdPct / 100, sunshineThreshold),
					newState.currMaxValue,
					'rgba(255,255,50,0.4)'
				),
				// Over max threshold
				steelseries.Section(
					newState.currMaxValue,
					Math.min(newState.currMaxValue + newState.maxValue * 0.15,newState.maxValue),
					'rgba(220,0,0,0.5)'
				)
			]
		}

		if(this.params.userLedVisible) {
			let percent = newState.currMaxValue === 0 ? '--' : Math.round(newState.value / newState.currMaxValue * 100);
			newState.ledState = (percent !== '--') && (percent >= sunshineThresholdPct) && (newState.value >= sunshineThreshold);
		}

		this.setState(newState);
	}

	componentDidUpdate(_prevProps: Props, prevState: State) {
		if(prevState.maxValue !== this.state.maxValue) {
			this.gauge.setMaxValue(this.state.maxValue)
		}
		
		if(prevState.area !== this.state.area){
			this.gauge.setArea(this.state.area);
		}

		if(prevState.ledState !== this.state.ledState){
			this.gauge.setUserLedOnOff(this.state.ledState);
		}
		
		//FIXME setValueAnimated() from steelseries lib not working!
		//this.gauge.setValueAnimated(this.state.value);
		this.gauge.setValue(this.state.value);
		this.gauge.setMaxMeasuredValue(this.state.maxToday);
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
	sections: any[],
	maxValue: number,
	maxToday: number,
	area: [],

	ledState: boolean,
}

type DataParamDef = { 
	SolarRad: any,
	SolarTM: any,
	CurrentSolarMax: any
}

export default SolarGauge;