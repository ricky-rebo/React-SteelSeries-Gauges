import React, { Component } from 'react';
// @ts-ignore
import { RadialBargraph, LabelNumberFormat, ColorDef, gradientWrapper, rgbaColor, Section } from "steelseries";
import styles from '../style/common.css';
import { RainUnit, RtData } from '../controller/types.js';
import { gaugeShadow, nextHighest } from './utils.js';
import { CommonProps, RGBAColor } from './types';
import { getCommonParams, LABEL_FORMAT, RainScaleDef, RAIN_USE_GRADIENT_COLOR, RAIN_USE_SECTION_COLOR, SHADOW_COLOR, SHOW_GAUGE_SHADOW } from './defaults';


class RainGauge extends Component<CommonProps, State> {
	static NAME = "RAIN_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: RadialBargraph;

	config: Config;

	style: React.CSSProperties;

	constructor(props: CommonProps) {
			super(props);

			this.canvasRef = React.createRef();

			this.config = {
				scaleDef: RainScaleDef,
				useGradient: RAIN_USE_GRADIENT_COLOR,
				useSections: RAIN_USE_GRADIENT_COLOR ? false : RAIN_USE_SECTION_COLOR,
				labelFormat: LABEL_FORMAT,
				showGaugeShadow: SHOW_GAUGE_SHADOW,
				shadowColor: SHADOW_COLOR
			}

			let { rain } = props.controller.getDisplayUnits();
			this.state = {
					maxValue: (rain === "mm")
						? this.config.scaleDef.Max_mm
						: this.config.scaleDef.Max_In,
					value: 0.0001,
					title: props.controller.lang.rain_title,

					displayUnit: rain,
					lcdDecimals: (rain === "mm") ? 1 : 2,
					scaleDecimals: (rain === "mm")
						? 1
						: (this.config.scaleDef.Max_In < 1 ? 2 : 1),
					labelNumberFormat: (rain === "mm")
						? this.config.labelFormat
						: LabelNumberFormat.FRACTIONAL,
					grandient: this.config.useGradient
						? createRainfallGradient(rain === "mm")
						: null,
					sections: this.config.useSections
						? createRainfallSections(rain === "mm")
						: []
					
					//popUpTxt: '',
			}

			

			this.style = this.config.showGaugeShadow
				? gaugeShadow(this.props.size, this.config.shadowColor)
				: {};

			this.update = this.update.bind(this);

			this.props.controller.subscribe(RainGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new RadialBargraph(this.canvasRef.current, {
				...getCommonParams(),
				
				size: this.props.size,
				titleString: this.state.title,
				//thresholdVisible: false,
				useValueGradient: this.config.useGradient,
				useSectionColors: this.config.useSections,
				niceScale: false,

				maxValue: this.state.maxValue,
				unitString: this.state.displayUnit,
				lcdDecimals: this.state.lcdDecimals,
				valueColor: ColorDef.BLUE,
				valueGradient: this.state.grandient,
				section: this.state.sections,
				labelNumberFormat: this.state.labelNumberFormat,
				fractionalScaleDecimals: this.state.scaleDecimals,
			});
			this.gauge.setValue(this.state.value);
		}
	}

	async update({ rfall, rainunit }: RtData) {
		let newState: any = {};

		if(rainunit !== this.state.displayUnit) {
			newState.displayUnit = rainunit;
			newState.lcdDecimals = (rainunit === "mm") ? 1 : 2,
			newState.scaleDecimals = (rainunit === "mm")
				? 1
				: (this.config.scaleDef.Max_In < 1 ? 2 : 1),
			newState.labelNumberFormat = (rainunit === "mm")
				? this.config.labelFormat
				: LabelNumberFormat.FRACTIONAL,
			newState.sections = this.config.useGradient
				? createRainfallGradient(rainunit === "mm")
				: null,
			newState.grandient = this.config.useSections
				? createRainfallSections(rainunit === "mm")
				: []
		}

		newState.value = rfall;
		if (rainunit === "mm") { // 10, 20, 30...
			newState.maxValue = Math.max(nextHighest(newState.value, 10), this.config.scaleDef.Max_mm);
		}
		else {
			// inches 0.5, 1.0, 2.0, 3.0 ... 10.0, 12.0, 14.0
			let step = (newState.value <= 1) ? 0.5 : (newState.value <= 6) ? 1 : 2;
			newState.maxValue = Math.max(nextHighest(newState.value, step), this.config.scaleDef.Max_In);
			newState.scaleDecimals = newState.maxValue < 1 ? 2 : 1;
		}

		this.setState(newState);
	}

	componentDidUpdate(_prevProps: CommonProps, prevState: State) {
		if(this.state.displayUnit !== prevState.displayUnit) {
			this.gauge.setUnitString(this.state.displayUnit);
			this.gauge.setSection(this.state.sections);
			this.gauge.setGradient(this.state.grandient);
			this.gauge.setFractionalScaleDecimals(this.state.scaleDecimals);
			this.gauge.setLabelNumberFormat(this.state.labelNumberFormat);
			this.gauge.setLcdDecimals(this.state.lcdDecimals);
		}

		if (this.state.maxValue !== this.gauge.getMaxValue()) {
			this.gauge.setValue(0);
			this.gauge.setFractionalScaleDecimals(this.state.scaleDecimals);
			this.gauge.setMaxValue(this.state.maxValue);
		}
		
		this.gauge.setValueAnimated(this.state.value);

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
					<button onClick={() => this.props.controller.changeUnits({ rain: "mm"})}> mm </button>
					<button onClick={() => this.props.controller.changeUnits({ rain: "in"})}> in </button>
				</div>
			</div>
		);
	}
}


interface Config {
	scaleDef: typeof RainScaleDef,
	useGradient: boolean,
	useSections: boolean,
	labelFormat: LabelNumberFormat,
	showGaugeShadow: boolean,
	shadowColor: RGBAColor
}

interface State {
		title: string,

		value: number,
		maxValue: number,

		displayUnit: RainUnit,
		lcdDecimals: number,
		scaleDecimals: number,
		labelNumberFormat: LabelNumberFormat,
		sections: Section[],
		grandient: gradientWrapper|null

		//popUpTxt?: string,
}


/**
 * Returns an array of section highlights for total rainfall in mm or inches
 * @param metric 
 */
 export const createRainfallSections = (metric: boolean) => {
	var factor = metric ? 1 : 1 / 25;
	return [
		Section(0, 5 * factor, 'rgba(0, 250, 0, 1)'),
		Section(5 * factor, 10 * factor, 'rgba(0, 250, 117, 1)'),
		Section(10 * factor, 25 * factor, 'rgba(218, 246, 0, 1)'),
		Section(25 * factor, 40 * factor, 'rgba(250, 186, 0, 1)'),
		Section(40 * factor, 50 * factor, 'rgba(250, 95, 0, 1)'),
		Section(50 * factor, 65 * factor, 'rgba(250, 0, 0, 1)'),
		Section(65 * factor, 75 * factor, 'rgba(250, 6, 80, 1)'),
		Section(75 * factor, 100 * factor, 'rgba(205, 18, 158, 1)'),
		Section(100 * factor, 125 * factor, 'rgba(0, 0, 250, 1)'),
		Section(125 * factor, 500 * factor, 'rgba(0, 219, 212, 1)')
	];
}

/**
 * Returns an array of SS colours for continuous gradient colouring of the total rainfall LED gauge
 * @param metric 
 */
export const createRainfallGradient = (metric: boolean) => {
	var grad = new gradientWrapper(
		0,
		(metric ? 100 : 4),
		[0, 0.1, 0.62, 1],
		[
			new rgbaColor(15, 148, 0, 1),
			new rgbaColor(213, 213, 0, 1),
			new rgbaColor(213, 0, 25, 1),
			new rgbaColor(250, 0, 0, 1)
		]
	);
	return grad;
}


export default RainGauge;