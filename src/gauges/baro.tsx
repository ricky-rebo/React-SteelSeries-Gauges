import React, { Component } from 'react';
import GaugeUtils from './gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import GaugesController from '../controller/gauges_controller';
import styles from '../style/common.css';
import { UNITS } from '../controller/defaults';
import { extractDecimal } from '../controller/data-utils';

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
				lcdDecimals: (press === UNITS.Press.HPA || press === UNITS.Press.MB) ? 1 : 2,
				scaleDecimals: (press === UNITS.Press.HPA || press === UNITS.Press.MB) ? 0 : 1,
				labelNumberFormat: (press === UNITS.Press.HPA || press === UNITS.Press.MB)
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
				? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
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

		async update({press, pressL, pressH, pressTL, pressTH, presstrendval, pressunit}: DataParamsDef) {
			let newState: any = {};

			if(pressunit !== this.state.displayUnit) {
				newState.displayUnit = pressunit;
				newState.lcdDecimals = (pressunit === UNITS.Press.HPA || pressunit === UNITS.Press.MB) ? 1 : 2,
				newState.scaleDecimals = (pressunit === UNITS.Press.HPA || pressunit === UNITS.Press.MB) ? 0 : 1,
				newState.labelNumberFormat = (pressunit === UNITS.Press.HPA || pressunit === UNITS.Press.MB)
					? this.props.controller.gaugeConfig.labelFormat
					: steelseries.LabelNumberFormat.FRACTIONAL
			}

			newState.value = extractDecimal(press)
			let low = extractDecimal(pressL),
					high = extractDecimal(pressH),
					todayLow = extractDecimal(pressTL),
					todayHigh = extractDecimal(pressTH);

			//let dps: number;
			switch(pressunit) {
				case UNITS.Press.HPA:
				case UNITS.Press.MB:
					//  default min range 990-1030 - steps of 10 hPa
					let { baroScaleDefMinhPa, baroScaleDefMaxhPa } = this.props.controller.gaugeConfig;
					newState.minValue = Math.min(GaugeUtils.nextLowest(low - 2, 10), baroScaleDefMinhPa);
					newState.maxValue = Math.max(GaugeUtils.nextHighest(high + 2, 10), baroScaleDefMaxhPa);
					//dps = 1; // 1 decimal place
					break;
				case UNITS.Press.KPA:
					//  default min range 99-105 - steps of 1 kPa
					let { baroScaleDefMinkPa, baroScaleDefMaxkPa } = this.props.controller.gaugeConfig;
					newState.minValue = Math.min(GaugeUtils.nextLowest(low - 0.2, 1), baroScaleDefMinkPa);
					newState.maxValue = Math.max(GaugeUtils.nextHighest(high + 0.2, 1), baroScaleDefMaxkPa);
					//dps = 2;
					break;
				case UNITS.Press.INHG:
					// inHg: default min range 29.5-30.5 - steps of 0.5 inHg
					let { baroScaleDefMininHg, baroScaleDefMaxinHg } = this.props.controller.gaugeConfig;
					newState.minValue = Math.min(GaugeUtils.nextLowest(low - 0.1, 0.5), baroScaleDefMininHg);
					newState.maxValue = Math.max(GaugeUtils.nextHighest(high + 0.1, 0.5), baroScaleDefMaxinHg);
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
				let trendVal = extractDecimal(presstrendval) / (this.props.controller.controllerConfig.weatherProgram === 2 ? 3 : 1);
				
				// Use the baroTrend rather than simple arithmetic test - steady is more/less than zero!
				newState.trend = GaugeUtils.baroTrend(trendVal, pressunit, false);
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
						<button onClick={() => this.props.controller.changeUnits({ press: UNITS.Press.HPA})}>{UNITS.Press.HPA}</button>
						<button onClick={() => this.props.controller.changeUnits({ press: UNITS.Press.KPA})}>{UNITS.Press.KPA}</button>
						<button onClick={() => this.props.controller.changeUnits({ press: UNITS.Press.INHG})}>{UNITS.Press.INHG}</button>
						<button onClick={() => this.props.controller.changeUnits({ press: UNITS.Press.MB})}>{UNITS.Press.MB}</button>
					</div>
					
				</div>
		}
}

type DataParamsDef = {
	press: any,
	pressL: any,
	pressH: any,
	pressTL: any,
	pressTH: any,
	presstrendval: any,
	pressunit: string
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
	trend: any,

	displayUnit: string,
	lcdDecimals: number,
	scaleDecimals: number,
	labelNumberFormat: steelseries.LabelNumberFormat
}

export default BaroGauge;