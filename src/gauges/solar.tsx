import React, { Component } from 'react';
// @ts-ignore
import { Radial, LedColor, Section } from "steelseries";
import styles from '../style/common.css';
import { ERR_VAL } from '../controller/data-utils';
import { gaugeShadow, nextHighest } from './gauge-utils.js';
import { RtData } from '../controller/data-types.js';
import { Props } from './data-types';

//TODO docs
class SolarGauge extends Component<Props, State> {
	static NAME = "SOLAR_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: any;
	params: any;
	style: React.CSSProperties;

	constructor(props: Props) {
		super(props);

		this.canvasRef = React.createRef();
	
		this.state = {
			value:  0.0001,
			maxValue: this.props.controller.gaugeConfig.solarGaugeScaleMax,
			maxToday: 0,
			area: [],
			ledState : false,

			//popUpTxt: '',
			//popUpGraph: '',
		};

		this.params = {
			...this.props.controller.commonParams,
			size: Math.ceil(this.props.size * this.props.controller.gaugeConfig.gaugeScaling),
			section: [
				Section(0, 600, 'rgba(40,149,0,0.3)'),
				Section(600, 800, 'rgba(248,89,0,0.3)'),
				Section(800, 1000, 'rgba(216,0,29,0.3)'),
				Section(1000, 1800, 'rgba(107,73,200,0.3)')
			],
			maxValue: this.state.maxValue,
			titleString: this.props.controller.lang.solar_title,
			niceScale: false,
			unitString: 'W/m\u00B2',
			thresholdVisible: false,
			lcdDecimals: 0,
			userLedVisible : this.props.controller.gaugeConfig.showSunshineLed,
			userLedColor : LedColor.YELLOW_LED,
			maxMeasuredValueVisible: true,
		};

		this.style = this.props.controller.gaugeConfig.showGaugeShadow
			? gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(SolarGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new Radial(this.canvasRef.current, this.params);
			this.gauge.setValue(this.state.value);
		}
	}

	async update({ SolarRad, SolarTM, CurrentSolarMax } : RtData) {
		let newState: any = {};

		newState.value = SolarRad;
		newState.maxToday = SolarTM;
		newState.currMaxValue = CurrentSolarMax;

		newState.maxValue = Math.max(newState.value, newState.currMaxValue, newState.maxToday, this.props.controller.gaugeConfig.solarGaugeScaleMax);
		newState.maxValue = nextHighest(newState.maxValue, 100);


		let { sunshineThresholdPct, sunshineThreshold } = this.props.controller.gaugeConfig;
		if(CurrentSolarMax !== ERR_VAL){
			newState.area=[
				// Sunshine threshold
				Section(
					Math.max(newState.currMaxValue * sunshineThresholdPct / 100, sunshineThreshold),
					newState.currMaxValue,
					'rgba(255,255,50,0.4)'
				),
				// Over max threshold
				Section(
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
		
		
		this.gauge.setValueAnimated(this.state.value);
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

interface State {
	value: number,
	maxValue: number,
	maxToday: number,
	area: [],

	ledState: boolean,
}

export default SolarGauge;