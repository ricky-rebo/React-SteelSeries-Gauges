import React, { Component } from 'react';
// @ts-ignore
import { Radial, LedColor, Section } from "steelseries";
import styles from '../style/common.css';
import { gaugeShadow, nextHighest } from './utils.js';
import { RtData } from '../controller/types.js';
import { CommonProps, RGBAColor } from './types';
import { getCommonParams, SHADOW_COLOR, SHOW_GAUGE_SHADOW, SHOW_SUNSHINE_LED, SolarScaleDef, SUNSHINE_PCT_TRESHOLD, SUNSHINE_TRESHOLD } from './defaults';


class SolarGauge extends Component<CommonProps, State> {
	static NAME = "SOLAR_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: Radial;

	config: Config;

	style: React.CSSProperties;

	constructor(props: CommonProps) {
		super(props);

		this.canvasRef = React.createRef();

		this.config = {
			scaleDefMax: SolarScaleDef.Max_Solar,
			showSunshineLed: SHOW_SUNSHINE_LED,
			showGaugeShadow: SHOW_GAUGE_SHADOW,
			shadowColor: SHADOW_COLOR,
			sunshineThreshold: SUNSHINE_TRESHOLD,
			sunshineThresholdPct: SUNSHINE_PCT_TRESHOLD
		}
	
		this.state = {
			value: 0.0001,
			maxValue: this.config.scaleDefMax,
			maxToday: 0,
			area: [],
			ledState : false,

			//popUpTxt: ''
		};

		this.style = this.config.showGaugeShadow
			? gaugeShadow(this.props.size, this.config.shadowColor)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(SolarGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new Radial(this.canvasRef.current, {
				...getCommonParams(),
	
				size: this.props.size,
				section: [
					Section(0, 600, 'rgba(40,149,0,0.3)'),
					Section(600, 800, 'rgba(248,89,0,0.3)'),
					Section(800, 1000, 'rgba(216,0,29,0.3)'),
					Section(1000, 1800, 'rgba(107,73,200,0.3)')
				],
				area: this.state.area,
				maxValue: this.state.maxValue,
				titleString: this.props.controller.lang.solar_title,
				niceScale: false,
				unitString: 'W/m\u00B2',
				thresholdVisible: false,
				lcdDecimals: 0,
				userLedVisible : this.config.showSunshineLed,
				userLedColor : LedColor.YELLOW_LED,
				maxMeasuredValueVisible: true,
			});
			this.gauge.setValue(this.state.value);
		}
	}

	async update({ SolarRad, SolarTM, CurrentSolarMax } : RtData) {
		let newState: any = {};

		newState.value = SolarRad;
		newState.maxToday = SolarTM;
		newState.currMaxValue = CurrentSolarMax;

		newState.maxValue = nextHighest(
			Math.max(newState.value, newState.currMaxValue, newState.maxToday, this.config.scaleDefMax), 
			100
		);

		newState.area=[
			// Sunshine threshold
			Section(
				Math.max(newState.currMaxValue * this.config.sunshineThresholdPct / 100, this.config.sunshineThreshold),
				newState.currMaxValue,
				'rgba(255,255,50,0.4)'
			),
			// Over max threshold
			Section(
				newState.currMaxValue,
				Math.min(newState.currMaxValue + newState.maxValue * 0.15, newState.maxValue),
				'rgba(220,0,0,0.5)'
			)
		]

		if(this.config.showSunshineLed) {
			let percent = newState.currMaxValue === 0 ? '--' : Math.round(newState.value / newState.currMaxValue * 100);
			newState.ledState = (percent !== '--') && (percent >= this.config.sunshineThresholdPct) && (newState.value >= this.config.sunshineThreshold);
		}

		this.setState(newState);
	}

	componentDidUpdate(_prevProps: CommonProps, prevState: State) {
		if(prevState.maxValue !== this.state.maxValue) {
			this.gauge.setValue(0);
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
					width={this.props.size}
					height={this.props.size}
					style={this.style}
				></canvas>
			</div>
		);
	}
}


interface Config {
	scaleDefMax: number,
	showSunshineLed: boolean,
	showGaugeShadow: boolean,
	shadowColor: RGBAColor,
	sunshineThreshold: number,
	sunshineThresholdPct: number
}

interface State {
	value: number,
	maxValue: number,
	maxToday: number,
	area: Section[],

	ledState: boolean,
}

export default SolarGauge;