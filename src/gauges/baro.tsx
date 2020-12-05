import React, { Component } from 'react';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import GaugesController from '../controller/gauges_controller';
import styles from '../style/common.css';
import { PressUnit, RtData, WProgram } from '../controller/data-types';
import { baroTrend, gaugeShadow, nextHighest, nextLowest } from './gauge-utils.js';

//TODO docs
class BaroGauge extends Component<Props, State> {
		static NAME = "BARO_GAUGE";

		canvasRef: React.RefObject<HTMLCanvasElement>;
		gauge: any;
		params: any;
		style: any;

		constructor(props: Props) {
			super(props);

			this.canvasRef = React.createRef();

			let { press } = props.controller.getDisplayUnits();
			this.state = {
				value: props.controller.gaugeConfig.baroScaleDefMinhPa + 0.0001,
				minValue: props.controller.gaugeConfig.baroScaleDefMinhPa,
				maxValue: props.controller.gaugeConfig.baroScaleDefMaxhPa,
				sections: [],
				areas: [],
				trend: steelseries.TrendState.OFF,

				displayUnit: press,
				lcdDecimals: (press === "hPa" || press === "mb") ? 1 : 2,
				scaleDecimals: (press === "hPa" || press === "mb") ? 0 : 1,
				labelNumberFormat: (press === "hPa" || press === "mb")
					? props.controller.gaugeConfig.labelFormat
					: steelseries.LabelNumberFormat.FRACTIONAL
			}

			this.params = {
				...this.props.controller.commonParams,
				size: Math.ceil(this.props.size * this.props.controller.gaugeConfig.gaugeScaling),
				sections: this.state.sections,
				area: this.state.areas,
				minValue: this.state.minValue,
				maxValue: this.state.maxValue,
				thresholdVisible: false,
				niceScale: false,
				titleString: props.controller.lang.baro_title,
				unitString: this.state.displayUnit,
				lcdDecimals: this.state.lcdDecimals,
				trendVisible: props.controller.gaugeConfig.pressureTrendVisible,
				labelNumberFormat: this.state.labelNumberFormat,
				fractionalScaleDecimals: this.state.scaleDecimals
			};

			this.style = this.props.controller.gaugeConfig.showGaugeShadow
				? gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
				: {};

			this.update = this.update.bind(this);

			this.props.controller.subscribe(BaroGauge.NAME, this.update);
		}

		componentDidMount() {
			if(this.canvasRef.current) {
				this.gauge = new steelseries.Radial(this.canvasRef.current, this.params);
				this.gauge.setValue(this.state.value);
			}
		}

		async update({press, pressL, pressH, pressTL, pressTH, presstrendval, pressunit}: RtData) {
			let newState: any = {};

			if(pressunit !== this.state.displayUnit) {
				newState.displayUnit = pressunit;
				newState.lcdDecimals = (pressunit === "hPa" || pressunit === "mb") ? 1 : 2,
				newState.scaleDecimals = (pressunit === "hPa" || pressunit === "mb") ? 0 : 1,
				newState.labelNumberFormat = (pressunit === "hPa" || pressunit === "mb")
					? this.props.controller.gaugeConfig.labelFormat
					: steelseries.LabelNumberFormat.FRACTIONAL
			}

			newState.value = press
			let low = pressL,
					high = pressH,
					todayLow = pressTL,
					todayHigh = pressTH;

			//let dps: number;
			switch(pressunit) {
				case "hPa":
				case "mb":
					//  default min range 990-1030 - steps of 10 hPa
					let { baroScaleDefMinhPa, baroScaleDefMaxhPa } = this.props.controller.gaugeConfig;
					newState.minValue = Math.min(nextLowest(low - 2, 10), baroScaleDefMinhPa);
					newState.maxValue = Math.max(nextHighest(high + 2, 10), baroScaleDefMaxhPa);
					//dps = 1; // 1 decimal place
					break;
				case "kPa":
					//  default min range 99-105 - steps of 1 kPa
					let { baroScaleDefMinkPa, baroScaleDefMaxkPa } = this.props.controller.gaugeConfig;
					newState.minValue = Math.min(nextLowest(low - 0.2, 1), baroScaleDefMinkPa);
					newState.maxValue = Math.max(nextHighest(high + 0.2, 1), baroScaleDefMaxkPa);
					//dps = 2;
					break;
				case "inHg":
					// inHg: default min range 29.5-30.5 - steps of 0.5 inHg
					let { baroScaleDefMininHg, baroScaleDefMaxinHg } = this.props.controller.gaugeConfig;
					newState.minValue = Math.min(nextLowest(low - 0.1, 0.5), baroScaleDefMininHg);
					newState.maxValue = Math.max(nextHighest(high + 0.1, 0.5), baroScaleDefMaxinHg);
					//dps = 3;
			}
			/*let trendValRnd = trendVal.toFixed(dps),
					todayLowRnd = todayLow.toFixed(dps),
					todayHighRnd = todayHigh.toFixed(dps);*/
			
			if (high === todayHigh && low === todayLow) {
				// VWS does not provide record hi/lo values
				newState.sections = [];
				newState.areas = [steelseries.Section(todayLow, todayHigh, this.props.controller.gaugeConfig.minMaxArea)];
			}
			else {
				newState.sections = [
						steelseries.Section(newState.minValue, low, 'rgba(255,0,0,0.5)'),
						steelseries.Section(high, newState.maxValue, 'rgba(255,0,0,0.5)')
				];
				newState.areas = [
						steelseries.Section(newState.minValue, low, 'rgba(255,0,0,0.5)'),
						steelseries.Section(high, newState.maxValue, 'rgba(255,0,0,0.5)'),
						steelseries.Section(todayLow, todayHigh, this.props.controller.gaugeConfig.minMaxArea)
				];
			}

			if (this.params.trendVisible) {
				// Convert the WD change over 3 hours to an hourly rate
				let trendVal = presstrendval / (this.props.controller.controllerConfig.weatherProgram === WProgram.WHEATHER_DISPLAY ? 3 : 1);
				
				// Use the baroTrend rather than simple arithmetic test - steady is more/less than zero!
				newState.trend = baroTrend(trendVal, pressunit, false);
			}

			this.setState(newState);
			//End of update()
		}

		componentDidUpdate(_prevProps: Props, prevState: State) {
			if(this.gauge) {
				if(this.state.displayUnit !== prevState.displayUnit) {
					this.gauge.setUnitString(this.state.displayUnit);
					this.gauge.setLcdDecimals(this.state.lcdDecimals);
					this.gauge.setFractionalScaleDecimals(this.state.scaleDecimals);
					this.gauge.setLabelNumberFormat(this.state.labelNumberFormat);
				}

				if (this.state.minValue !== this.gauge.getMinValue() || this.state.maxValue !== this.gauge.getMaxValue()) {
					this.gauge.setMinValue(this.state.minValue);
					this.gauge.setMaxValue(this.state.maxValue);
					this.gauge.setValue(this.state.minValue);
				}

				if(this.params.trendVisible)
					this.gauge.setTrend(this.state.trend);

				
				this.gauge.setArea(this.state.areas);
				this.gauge.setSection(this.state.sections);
				//FIXME TweenJS anomation broken in setValueAniimated()
				//this.gauge.setValueAnimated(this.state.value);
				this.gauge.setValue(this.state.value);
			}
			
		}

		render() {
				return <div className={styles.gauge}>
					<canvas 
							ref={this.canvasRef}
							width={this.params.size}
							height={this.params.size}
							style={this.style}
					></canvas>
					<div>
						<button onClick={() => this.props.controller.changeUnits({ press: "hPa"})}>hPa</button>
						<button onClick={() => this.props.controller.changeUnits({ press: "kPa"})}>kPa</button>
						<button onClick={() => this.props.controller.changeUnits({ press: "inHg"})}>inHg</button>
						<button onClick={() => this.props.controller.changeUnits({ press: "mb"})}>mb</button>
					</div>
					
				</div>
		}
}

interface Props {
		controller: GaugesController,
		size: number
}

interface State {
	value: number,
	minValue: number,
	maxValue: number,
	sections: { start: number, stop: number, color: any}[],
	areas: { start: number, stop: number, color: any}[],
	trend: steelseries.TrendState,

	displayUnit: PressUnit,
	lcdDecimals: number,
	scaleDecimals: number,
	labelNumberFormat: steelseries.LabelNumberFormat
}

export default BaroGauge;