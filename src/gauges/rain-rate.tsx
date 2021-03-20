import React, { Component } from 'react';
// @ts-ignore
import { Radial, LabelNumberFormat, Section } from "steelseries";
import styles from '../style/common.css';
import { gaugeShadow, nextHighest } from './utils.js';
import { RtData } from '../controller/types.js';
import { CommonProps, RGBAColor } from './types';
import { getCommonParams, LABEL_FORMAT, RainRateScaleDef, SHADOW_COLOR, SHOW_GAUGE_SHADOW } from './defaults';


class RainRateGauge extends Component<CommonProps, State> {
	static NAME = "RAINRATE_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: Radial;

	config: Config;

	style: React.CSSProperties;

	constructor(props: CommonProps) {
			super(props);

			this.canvasRef = React.createRef();

			this.config = {
				scaleDef: RainRateScaleDef,
				labelFormat: LABEL_FORMAT,
				showGaugeShadow: SHOW_GAUGE_SHADOW,
				shadowColor: SHADOW_COLOR
			}

			let { rain } = props.controller.getDisplayUnits();
			this.state = {
				value: 0.0001,
				maxMeasured: 0,
				maxValue: (rain === "mm")
					? this.config.scaleDef.Max_mm
					: this.config.scaleDef.Max_In,

				displayUnit: rain + '/h',
				sections: createRainRateSections(rain === "mm"),
				lcdDecimals: (rain === "mm") ? 1 : 2,
				scaleDecimals: (rain === "mm") 
					? 0 
					: (this.config.scaleDef.Max_In < 1 ? 2 : 1),
				labelNumberFormat: (rain === "mm")
					? this.config.labelFormat
					: LabelNumberFormat.FRACTIONAL
				
				//popUpTxt: '',
			}

			this.style = this.config.showGaugeShadow
				? gaugeShadow(this.props.size, this.config.shadowColor)
				: {};

			this.update = this.update.bind(this);

			this.props.controller.subscribe(RainRateGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new Radial(this.canvasRef.current, {
				...getCommonParams(),

				size: this.props.size,
				section: this.state.sections,
				maxValue: this.state.maxValue,
				thresholdVisible: false,
				maxMeasuredValueVisible: true,
				titleString: this.props.controller.lang.rrate_title,
				unitString: this.state.displayUnit,
				lcdDecimals: 1,
				labelNumberFormat: this.state.labelNumberFormat,
				fractionalScaleDecimals: this.state.scaleDecimals,
				niceScale: false,
			});
			this.gauge.setValue(this.state.value);
		}
	}

	async update({ rrate, rrateTM, rainunit }: RtData) {
		let newState: any = {};

		if(`${rainunit}/h` !== this.state.displayUnit) {
			newState.displayUnit = `${rainunit}/h`;
			newState.sections = createRainRateSections(rainunit === "mm");
			newState.lcdDecimals = (rainunit === "mm") ? 1 : 2;
			newState.labelNumberFormat = (rainunit === "mm")
				? this.config.labelFormat
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
					width={this.props.size}
					height={this.props.size}
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


interface Config {
	scaleDef: typeof RainRateScaleDef,
	labelFormat: LabelNumberFormat,
	showGaugeShadow: boolean,
	shadowColor: RGBAColor
}

interface State {
		value: number,
		maxMeasured: number,
		maxValue: number,

		displayUnit: string,
		sections: Section[],
		lcdDecimals: number,
		scaleDecimals: number,
		labelNumberFormat: LabelNumberFormat

		//popUpTxt?: string
}


/**
 * //TODO move in RainRate Gauge
 * Returns an array of section highlights for the Rain Rate gauge.
 * Assumes 'standard' descriptive limits from UK met office:
 *  < 0.25 mm/hr - Very light rain
 *  0.25mm/hr to 1.0mm/hr - Light rain
 *  1.0 mm/hr to 4.0 mm/hr - Moderate rain
 *  4.0 mm/hr to 16.0 mm/hr - Heavy rain
 *  16.0 mm/hr to 50 mm/hr - Very heavy rain
 *  > 50.0 mm/hour - Extreme rain

	* Roughly translated to the corresponding Inch rates
	*  < 0.001
	*  0.001 to 0.05
	*  0.05 to 0.20
	*  0.20 to 0.60
	*  0.60 to 2.0
	*  > 2.0
* @param metric 
*/      
export const createRainRateSections = (metric: boolean) => {
	var factor = metric ? 1 : 1 / 25;
	return [
		Section(0, 0.25 * factor, 'rgba(0, 140, 0, 0.5)'),
		Section(0.25 * factor, 1 * factor, 'rgba(80, 192, 80, 0.5)'),
		Section(1 * factor, 4 * factor, 'rgba(150, 203, 150, 0.5)'),
		Section(4 * factor, 16 * factor, 'rgba(212, 203, 109, 0.5)'),
		Section(16 * factor, 50 * factor, 'rgba(225, 155, 105, 0.5)'),
		Section(50 * factor, 1000 * factor, 'rgba(245, 86, 59, 0.5)')
	];
}

export default RainRateGauge;