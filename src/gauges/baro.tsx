import React, { Component } from 'react';
import GaugeUtils from '../utils/gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import DataUtils from '../utils/data-utils';
import GaugesController from '../gauges-controller';
import styles from '../style/common.css';

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
				minValue: props.controller.gaugeGlobals.baroScaleDefMinhPa,
				maxValue: props.controller.gaugeGlobals.baroScaleDefMaxhPa,
				value: props.controller.gaugeGlobals.baroScaleDefMinhPa + 0.0001,
				trend: null
			}

			this.params = {
				...this.props.controller.commonParams,
				size: Math.ceil(this.props.size * this.props.controller.config.gaugeScaling),
				sections: this.state.sections,
				area: this.state.areas,
				minValue: this.state.minValue,
				maxValue: this.state.maxValue,
				thresholdVisible: false,
				niceScale: false,
				titleString: props.controller.lang.baro_title,
				unitString: props.controller.getDisplayUnits().press,
				lcdDecimals: 1,
				trendVisible: props.controller.gaugeGlobals.pressureTrendVisible,
				labelNumberFormat: props.controller.gaugeGlobals.labelFormat,
				fractionalScaleDecimals: 0
			};

			this.style = this.props.controller.config.showGaugeShadow
				? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeGlobals.shadowColour)
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

				newState.value = DataUtils.extractDecimal(press)
				let recLow = DataUtils.extractDecimal(pressL),
						recHigh = DataUtils.extractDecimal(pressH),
						todayLow = DataUtils.extractDecimal(pressTL),
						todayHigh = DataUtils.extractDecimal(pressTH);

				//let dps: number;
				if (pressunit === 'hPa' || pressunit === 'mb') {
					//  default min range 990-1030 - steps of 10 hPa
					let { baroScaleDefMinhPa, baroScaleDefMaxhPa } = this.props.controller.gaugeGlobals;
					newState.minValue = Math.min(GaugeUtils.nextLowest(recLow - 2, 10), baroScaleDefMinhPa);
					newState.maxValue = Math.max(GaugeUtils.nextHighest(recHigh + 2, 10), baroScaleDefMaxhPa);
					//dps = 1; // 1 decimal place
				}
				else if (pressunit === 'kPa') {
						//  default min range 99-105 - steps of 1 kPa
						let { baroScaleDefMinkPa, baroScaleDefMaxkPa } = this.props.controller.gaugeGlobals;
						newState.minValue = Math.min(GaugeUtils.nextLowest(recLow - 0.2, 1), baroScaleDefMinkPa);
						newState.maxValue = Math.max(GaugeUtils.nextHighest(recHigh + 0.2, 1), baroScaleDefMaxkPa);
						//dps = 2;
				}
				else {
						// inHg: default min range 29.5-30.5 - steps of 0.5 inHg
						let { baroScaleDefMininHg, baroScaleDefMaxinHg } = this.props.controller.gaugeGlobals;
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
					newState.areas = [steelseries.Section(todayLow, todayHigh, this.props.controller.gaugeGlobals.minMaxArea)];
				}
				else {
					newState.sections = [
							steelseries.Section(newState.minValue, recLow, 'rgba(255,0,0,0.5)'),
							steelseries.Section(recHigh, newState.maxValue, 'rgba(255,0,0,0.5)')
					];
					newState.areas = [
							steelseries.Section(newState.minValue, recLow, 'rgba(255,0,0,0.5)'),
							steelseries.Section(recHigh, newState.maxValue, 'rgba(255,0,0,0.5)'),
							steelseries.Section(todayLow, todayHigh, this.props.controller.gaugeGlobals.minMaxArea)
					];
				}

				if (this.params.trendVisible) {
					// Convert the WD change over 3 hours to an hourly rate
					let trendVal = DataUtils.extractDecimal(presstrendval) / (this.props.controller.config.weatherProgram === 2 ? 3 : 1);
					
					// Use the baroTrend rather than simple arithmetic test - steady is more/less than zero!
					newState.trend = GaugeUtils.baroTrend(trendVal, pressunit, false);
			}

			this.setState(newState);
			//End of update()
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
	trend: any
}

export default BaroGauge;