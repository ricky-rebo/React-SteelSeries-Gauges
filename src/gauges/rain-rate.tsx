import React, { Component } from 'react';
// @ts-ignore
import { Radial, LabelNumberFormat } from "steelseries";
import styles from '../style/common.css';
import { createRainRateSections, gaugeShadow, nextHighest } from './utils.js';
import { RtData } from '../controller/types.js';
import { CommonProps } from './types';


class RainRateGauge extends Component<CommonProps, State> {
		static NAME = "RAINRATE_GAUGE";

		canvasRef: React.RefObject<HTMLCanvasElement>;
		gauge: any;
		params: any;
		style: React.CSSProperties;

		constructor(props: CommonProps) {
				super(props);

				this.canvasRef = React.createRef();

				let { rain } = props.controller.getDisplayUnits();
				let max = (rain === "mm")
					? this.props.controller.gaugeConfig.rainRateScaleDefMaxmm
					: 0.5;
				this.state = {
					value: 0.0001,
					maxMeasured: 0,
					maxValue: max,

					displayUnit: rain + '/h',
					sections: createRainRateSections(rain === "mm"),
					lcdDecimals: (rain === "mm") ? 1 : 2,
					scaleDecimals: (rain === "mm") ? 0 : (props.controller.gaugeConfig.rainRateScaleDefMaxIn < 1 ? 2 : 1),
					labelNumberFormat: (rain === "mm") ? props.controller.gaugeConfig.labelFormat : LabelNumberFormat.FRACTIONAL
					
					//popUpTxt: '',
					//graph: '',
				}

				this.params = {
					...this.props.controller.commonParams,
					size: Math.ceil(this.props.size * this.props.controller.gaugeConfig.gaugeScaling),
					section: this.state.sections,
					maxValue: this.state.maxValue,
					thresholdVisible: false,
					maxMeasuredValueVisible: true,
					titleString: props.controller.lang.rrate_title,
					unitString: this.state.displayUnit,
					lcdDecimals: 1,
					labelNumberFormat: this.state.labelNumberFormat,
					fractionalScaleDecimals: this.state.scaleDecimals,
					niceScale: false,
				};

				this.style = this.props.controller.gaugeConfig.showGaugeShadow
					? gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
					: {};

				this.update = this.update.bind(this);

				this.props.controller.subscribe(RainRateGauge.NAME, this.update);
		}

		componentDidMount() {
			if(this.canvasRef.current) {
				this.gauge = new Radial(this.canvasRef.current, this.params);
				this.gauge.setValue(this.state.value);
			}
		}

		async update({ rrate, rrateTM, rainunit }: RtData) {
			let newState: any = {};

			if(rainunit+'/h' !== this.state.displayUnit) {
				newState.displayUnit = rainunit+'/h';
				newState.sections = createRainRateSections(rainunit === "mm");
				newState.lcdDecimals = (rainunit === "mm") ? 1 : 2;
				newState.labelNumberFormat = (rainunit === "mm")
					? this.props.controller.gaugeConfig.labelFormat
					: LabelNumberFormat.FRACTIONAL
					
			}

			newState.value = rrate;
			newState.maxMeasured = rrateTM;
			let overallMax = Math.max(newState.maxMeasured, newState.value)

			if (rainunit === "mm") { // 10, 20, 30...
				newState.maxValue = nextHighest(overallMax, 10);
				newState.scaleDecimals = 1;
			}
			else {
				// inches 0.5, 1.0, 2.0, 3.0 ... 10, 20, 30...
				if (overallMax <= 0.5) {
					newState.maxValue = 0.5;
				}
				else if (overallMax <= 10) {
					newState.maxValue = nextHighest(overallMax, 1);
				}
				else {
					newState.maxValue = nextHighest(overallMax, 10);
				}
				newState.scaleDecimals = newState.maxValue < 1 ? 2 : (newState.maxValue < 7 ? 1 : 0);
			}

			this.setState(newState);
		}

		componentDidUpdate(_prevProps: CommonProps, prevState: State) {
			if(this.state.displayUnit !== prevState.displayUnit) {
				this.gauge.setUnitString(this.state.displayUnit);
				this.gauge.setSection(this.state.sections);
				this.gauge.setLabelNumberFormat(this.state.labelNumberFormat);
				this.gauge.setLcdDecimals(this.state.lcdDecimals);
			}

			if (this.state.maxValue !== this.gauge.getMaxValue()) {
				this.gauge.setValue(0.0001);
				this.gauge.setFractionalScaleDecimals(this.state.scaleDecimals);
				this.gauge.setMaxValue(this.state.maxValue);
			}
			
			this.gauge.setValueAnimated(this.state.value);

			this.gauge.setMaxMeasuredValue(this.state.maxMeasured);

			//TODO set popup text
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
						<button onClick={() => this.props.controller.changeUnits({ rain: "mm"} )}> mm </button>
						<button onClick={() => this.props.controller.changeUnits({ rain: "in"} )}> in </button>
					</div>
						
				</div>
			);
		}
}

interface State {
		value: number,
		maxMeasured: number,
		maxValue: number,

		displayUnit: string,
		sections: any,
		lcdDecimals: number,
		scaleDecimals: number,
		labelNumberFormat: any

		//popUpTxt?: string,
		//graph?: string
}

export default RainRateGauge;