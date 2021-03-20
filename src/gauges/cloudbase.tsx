import React, { Component } from 'react';
// @ts-ignore
import { Radial, Section } from "steelseries";
import styles from '../style/common.css';
import { RtData } from '../controller/types';
import { gaugeShadow, nextHighest } from './utils.js';
import { CommonProps, RGBAColor } from './types';
import { CloudScaleDef, getCommonParams, ROUND_CLOUDBASE_VALUE, SHADOW_COLOR, SHOW_GAUGE_SHADOW } from './defaults';


class CloudBaseGauge extends Component<CommonProps, State> {
	static NAME = "CLOUDBASE_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: Radial;

	config: Config;

	style: React.CSSProperties;

	constructor(props: CommonProps) {
		super(props);

		this.canvasRef = React.createRef();
	
		//TODO implementare custom config tramite props
		this.config = {
			scaleDef: CloudScaleDef,
			roundValue: ROUND_CLOUDBASE_VALUE,

			showGaugeShadow: SHOW_GAUGE_SHADOW,
			shadowColor: SHADOW_COLOR
		} 

		let { cloud } = props.controller.getDisplayUnits();
		this.state = {
			value:  0.0001,
			sections: createSections(cloud === "m"),
			displayUnit: (cloud === "m") ? props.controller.lang.metres : props.controller.lang.feet,
			maxValue:  (cloud === "m") ? this.config.scaleDef.Max_m : this.config.scaleDef.Max_ft

			//popUpTxt: '',
		}

		/*this.params = {
			...getCommonParams(),

			size: this.props.size,
			maxValue: this.state.maxValue,
			titleString: this.props.controller.lang.cloudbase_title,
			section: this.state.sections,
			unitString: this.props.controller.lang.metres,
			thresholdVisible: false,
			lcdDecimals: 0,
		};*/

		this.style = this.config.showGaugeShadow
			? gaugeShadow(props.size, this.config.shadowColor)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(CloudBaseGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new Radial(this.canvasRef.current, {
				...getCommonParams(),
	
				size: this.props.size,
				maxValue: this.state.maxValue,
				titleString: this.props.controller.lang.cloudbase_title,
				section: this.state.sections,
				unitString: this.props.controller.lang.metres,
				thresholdVisible: false,
				lcdDecimals: 0,
			});

			this.gauge.setValue(this.state.value);
		}
	}

	async update({ cloudbasevalue, cloudbaseunit } : RtData) {
		let newState: any = {};

		if(cloudbaseunit !== this.state.displayUnit) {
			newState.displayUnit = (cloudbaseunit === "m")
				? this.props.controller.lang.metres
				: this.props.controller.lang.feet
			newState.sections = createSections(cloudbaseunit === "m");
		}

		newState.value = cloudbasevalue;

		if(cloudbaseunit === "m") {
			// adjust metre gauge in jumps of 1000 metres, don't downscale during the session
			newState.maxValue = Math.max(nextHighest(newState.value, 1000), this.config.scaleDef.Max_m);
			
			if(newState.value <= 1000 && this.config.roundValue) {
				// and round the value to the nearest  10 m
				newState.value = Math.round(newState.value / 10) * 10;
			}
			else if(this.config.roundValue) {
				// and round the value to the nearest 50 m
				newState.value = Math.round(newState.value / 50) * 50;
			}
		}
		else {
			newState.maxValue = Math.max(nextHighest(newState.value, 2000), this.config.scaleDef.Max_ft);
			
			if(newState.value <= 2000 && this.config.roundValue){
				// and round the value to the nearest  50 ft
				newState.value = Math.round(newState.value / 50) * 50;
			}
			else if(this.config.roundValue) {
				// and round the value to the nearest 10 ft
				newState.value = Math.round(newState.value / 100) * 100;
			}
		}

		this.setState(newState);
	}

	componentDidUpdate(_prevProps: CommonProps, prevState: State) {
		if(this.state.displayUnit !== prevState.displayUnit) {
			this.gauge.setUnitString(this.state.displayUnit);
			this.gauge.setSection(this.state.sections);
		}

		if(this.state.maxValue !== this.gauge.getMaxValue()) {
			this.gauge.setMaxValue(this.state.maxValue);
			this.gauge.setValue(this.gauge.getMinValue());
		}

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
					<button onClick={() => this.props.controller.changeUnits({ cloud: "m" })}> m </button>
					<button onClick={() => this.props.controller.changeUnits({ cloud: "ft" })}> ft </button>
				</div>
					
			</div>
		);
	}
}


interface State {
	value: number,
	sections: Section[],
	maxValue: number,
	displayUnit: string
	//popUpTxt: string,
}

interface Config {
	scaleDef: typeof CloudScaleDef,
	roundValue: boolean,

	showGaugeShadow: boolean,
	shadowColor: RGBAColor
}


function createSections(metric: boolean) {
	if (metric) {
		return [
			Section(0, 150, 'rgba(245, 86, 59, 0.5)'),
			Section(150, 300, 'rgba(225, 155, 105, 0.5)'),
			Section(300, 750, 'rgba(212, 203, 109, 0.5)'),
			Section(750, 1000, 'rgba(150, 203, 150, 0.5)'),
			Section(1000, 1500, 'rgba(80, 192, 80, 0.5)'),
			Section(1500, 2500, 'rgba(0, 140, 0, 0.5)'),
			Section(2500, 5500, 'rgba(19, 103, 186, 0.5)')
		];
	} else {
		return [
			Section(0, 500, 'rgba(245, 86, 59, 0.5)'),
			Section(500, 1000, 'rgba(225, 155, 105, 0.5)'),
			Section(1000, 2500, 'rgba(212, 203, 109, 0.5)'),
			Section(2500, 3500, 'rgba(150, 203, 150, 0.5)'),
			Section(3500, 5500, 'rgba(80, 192, 80, 0.5)'),
			Section(5500, 8500, 'rgba(0, 140, 0, 0.5)'),
			Section(8500, 18000, 'rgba(19, 103, 186, 0.5)')
		];
	}
}

export default CloudBaseGauge;