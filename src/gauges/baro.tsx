import React, { Component } from 'react';
import GaugeUtils from '../utils/gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import DataUtils from '../utils/data-utils';
import GaugesController from '../controller/gauges_controller';
import styles from '../style/common.css';
import { UNITS } from '../controller/defaults';

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

			this.state = {
				sections: [],
				areas: [],
				minValue: props.controller.gaugeConfig.baroScaleDefMinhPa,
				maxValue: props.controller.gaugeConfig.baroScaleDefMaxhPa,
				value: props.controller.gaugeConfig.baroScaleDefMinhPa + 0.0001,
				trend: steelseries.TrendState.OFF,
				displayUnit: props.controller.getDisplayUnits().press
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
				lcdDecimals: 1,
				trendVisible: props.controller.gaugeConfig.pressureTrendVisible,
				labelNumberFormat: props.controller.gaugeConfig.labelFormat,
				fractionalScaleDecimals: 0
			};

			this.style = this.props.controller.gaugeConfig.showGaugeShadow
				? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
				: {};

			this.update = this.update.bind(this);
			this.unitUpdate = this.unitUpdate.bind(this);

			this.props.controller.subscribe(BaroGauge.NAME, this.update, this.unitUpdate);
		}

		componentDidMount() {
			if(this.canvasRef.current) {
				this.gauge = new steelseries.Radial(this.canvasRef.current, this.params);
				this.gauge.setValue(this.state.value);
			}
		}

		async update({press, pressL, pressH, pressTL, pressTH, presstrendval, pressunit}: DataParamsDef) {
			let newState: any = {};

				newState.value = DataUtils.extractDecimal(press)
				let recLow = DataUtils.extractDecimal(pressL),
						recHigh = DataUtils.extractDecimal(pressH),
						todayLow = DataUtils.extractDecimal(pressTL),
						todayHigh = DataUtils.extractDecimal(pressTH);

				//let dps: number;
				if (pressunit === UNITS.Press.HPA || pressunit === UNITS.Press.MB) {
					//  default min range 990-1030 - steps of 10 hPa
					let { baroScaleDefMinhPa, baroScaleDefMaxhPa } = this.props.controller.gaugeConfig;
					newState.minValue = Math.min(GaugeUtils.nextLowest(recLow - 2, 10), baroScaleDefMinhPa);
					newState.maxValue = Math.max(GaugeUtils.nextHighest(recHigh + 2, 10), baroScaleDefMaxhPa);
					//dps = 1; // 1 decimal place
				}
				else if (pressunit === UNITS.Press.KPA) {
						//  default min range 99-105 - steps of 1 kPa
						let { baroScaleDefMinkPa, baroScaleDefMaxkPa } = this.props.controller.gaugeConfig;
						newState.minValue = Math.min(GaugeUtils.nextLowest(recLow - 0.2, 1), baroScaleDefMinkPa);
						newState.maxValue = Math.max(GaugeUtils.nextHighest(recHigh + 0.2, 1), baroScaleDefMaxkPa);
						//dps = 2;
				}
				else {
						// inHg: default min range 29.5-30.5 - steps of 0.5 inHg
						let { baroScaleDefMininHg, baroScaleDefMaxinHg } = this.props.controller.gaugeConfig;
						newState.minValue = Math.min(GaugeUtils.nextLowest(recLow - 0.1, 0.5), baroScaleDefMininHg);
						newState.maxValue = Math.max(GaugeUtils.nextHighest(recHigh + 0.1, 0.5), baroScaleDefMaxinHg);
						//dps = 3;
				}
				/*let trendValRnd = trendVal.toFixed(dps),
						todayLowRnd = todayLow.toFixed(dps),
						todayHighRnd = todayHigh.toFixed(dps);*/
				
				if (recHigh === todayHigh && recLow === todayLow) {
					// VWS does not provide record hi/lo values
					newState.sections = [];
					newState.areas = [steelseries.Section(todayLow, todayHigh, this.props.controller.gaugeConfig.minMaxArea)];
				}
				else {
					newState.sections = [
							steelseries.Section(newState.minValue, recLow, 'rgba(255,0,0,0.5)'),
							steelseries.Section(recHigh, newState.maxValue, 'rgba(255,0,0,0.5)')
					];
					newState.areas = [
							steelseries.Section(newState.minValue, recLow, 'rgba(255,0,0,0.5)'),
							steelseries.Section(recHigh, newState.maxValue, 'rgba(255,0,0,0.5)'),
							steelseries.Section(todayLow, todayHigh, this.props.controller.gaugeConfig.minMaxArea)
					];
				}

				if (this.params.trendVisible) {
					// Convert the WD change over 3 hours to an hourly rate
					let trendVal = DataUtils.extractDecimal(presstrendval) / (this.props.controller.controllerConfig.weatherProgram === 2 ? 3 : 1);
					
					// Use the baroTrend rather than simple arithmetic test - steady is more/less than zero!
					newState.trend = GaugeUtils.baroTrend(trendVal, pressunit, false);
			}

			this.setState(newState);
			//End of update()
		}

		async unitUpdate({ press }: { press: string }) {
			//TODO remove
			console.log("baro unitUpdate() called")
			if(press !== this.state.displayUnit) {
				//TODO remove
				console.log("baro unit updated")
				let newState = {...this.state};
				newState.displayUnit = press;
				this.setState(newState);
			}
		}

		componentDidUpdate() {
			if(this.gauge) {
				if (this.state.minValue !== this.gauge.getMinValue() || this.state.maxValue !== this.gauge.getMaxValue()) {
					this.gauge.setMinValue(this.state.minValue);
					this.gauge.setMaxValue(this.state.maxValue);
					this.gauge.setValue(this.state.minValue);
				}

				if(this.params.trendVisible)
					this.gauge.setTrend(this.state.trend);

				this.gauge.setUnitString(this.state.displayUnit);

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
						<button onClick={() => this.props.controller.changeUnits({ pressUnit: UNITS.Press.HPA})}>{UNITS.Press.HPA}</button>
						<button onClick={() => this.props.controller.changeUnits({ pressUnit: UNITS.Press.KPA})}>{UNITS.Press.KPA}</button>
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
	sections: { start: number, stop: number, color: any}[],
	areas: { start: number, stop: number, color: any}[],
	minValue: number,
	maxValue: number,
	value: number,
	trend: any,
	displayUnit: string
}

export default BaroGauge;