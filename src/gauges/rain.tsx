import React, { Component } from 'react';

// @ts-ignore
import steelseries from '../libs/steelseries.js';

import GaugeUtils from './gauge-utils';
import GaugesController from '../controller/gauges_controller';
import styles from '../style/common.css';
import { UNITS } from '../controller/defaults.js';
import { extractDecimal } from '../controller/data-utils.js';
import { RainUnit } from '../controller/data-types.js';

//TODO docs
class RainGauge extends Component<Props, State> {
	static NAME = "RAIN_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: any;
	params: any;
	style: any;

	constructor(props: Props) {
			super(props);

			this.canvasRef = React.createRef();

			let { rain } = props.controller.getDisplayUnits();
			let { rainScaleDefMaxmm, rainScaleDefMaxIn, rainUseGradientColours, rainUseSectionColours } = props.controller.gaugeConfig;
			this.state = {
					maxValue: (rain === UNITS.Rain.MM) ? rainScaleDefMaxmm : rainScaleDefMaxIn,
					value: 0.0001,
					title: props.controller.lang.rain_title,

					displayUnit: rain,
					lcdDecimals: (rain === UNITS.Rain.MM) ? 1 : 2,
					scaleDecimals: (rain === UNITS.Rain.MM) ? 1 : (rainScaleDefMaxIn < 1 ? 2 : 1),
					labelNumberFormat: (rain === UNITS.Rain.MM)
						? steelseries.LabelNumberFormat
						: steelseries.LabelNumberFormat.FRACTIONAL,
					sections: rainUseGradientColours
						? GaugeUtils.createRainfallGradient(rain === UNITS.Rain.MM)
						: null,
					grandient: rainUseSectionColours
						? GaugeUtils.createRainfallSections(rain === UNITS.Rain.MM)
						: []
					
					//popUpTxt: '',
					//graph: '',
			}

			this.params = {
				...this.props.controller.commonParams,
				size: Math.ceil(this.props.size * this.props.controller.gaugeConfig.gaugeScaling),
				titleString: this.state.title,
				thresholdVisible: false,
				useValueGradient: rainUseGradientColours,
				useSectionColors: rainUseSectionColours,
				niceScale: false,

				maxValue: this.state.maxValue,
				unitString: this.state.displayUnit,
				lcdDecimals: this.state.lcdDecimals,
				valueColor: steelseries.ColorDef.BLUE,
				valueGradient: this.state.grandient,
				section: this.state.sections,
				labelNumberFormat: this.state.labelNumberFormat,
				fractionalScaleDecimals: this.state.scaleDecimals,
			};

			this.style = this.props.controller.gaugeConfig.showGaugeShadow
				? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
				: {};

			this.update = this.update.bind(this);

			this.props.controller.subscribe(RainGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new steelseries.RadialBargraph(this.canvasRef.current, this.params);
			this.gauge.setValue(this.state.value);
		}
	}

	async update({ rfall, rainunit }: DataParamDef) {
		let newState: any = {};

		if(rainunit !== this.state.displayUnit) {
			let { rainScaleDefMaxIn, rainUseGradientColours, rainUseSectionColours } = this.props.controller.gaugeConfig;
			newState.displayUnit = rainunit;
			newState.lcdDecimals = (rainunit === UNITS.Rain.MM) ? 1 : 2,
			newState.scaleDecimals = (rainunit === UNITS.Rain.MM) ? 1 : (rainScaleDefMaxIn < 1 ? 2 : 1),
			newState.labelNumberFormat = (rainunit === UNITS.Rain.MM)
				? steelseries.LabelNumberFormat
				: steelseries.LabelNumberFormat.FRACTIONAL,
			newState.sections = rainUseGradientColours
				? GaugeUtils.createRainfallGradient(rainunit === UNITS.Rain.MM)
				: null,
			newState.grandient = rainUseSectionColours
				? GaugeUtils.createRainfallSections(rainunit === UNITS.Rain.MM)
				: []
		}

		newState.value = extractDecimal(rfall);
		if (rainunit === UNITS.Rain.MM) { // 10, 20, 30...
			newState.maxValue = Math.max(GaugeUtils.nextHighest(newState.value, 10), this.props.controller.gaugeConfig.rainScaleDefMaxmm);
		}
		else {
			// inches 0.5, 1.0, 2.0, 3.0 ... 10.0, 12.0, 14.0
			if (newState.value <= 1) {
				newState.maxValue = Math.max(GaugeUtils.nextHighest(newState.value, 0.5), this.props.controller.gaugeConfig.rainScaleDefMaxIn);
			} else if (newState.value <= 6) {
				newState.maxValue = Math.max(GaugeUtils.nextHighest(newState.value, 1), this.props.controller.gaugeConfig.rainScaleDefMaxIn);
			} else {
				newState.maxValue = Math.max(GaugeUtils.nextHighest(newState.value, 2), this.props.controller.gaugeConfig.rainScaleDefMaxIn);
			}
			newState.scaleDecimals = newState.maxValue < 1 ? 2 : 1;
		}

		this.setState(newState);
	}

	componentDidUpdate(_prevProps: Props, prevState: State) {
		if(this.state.displayUnit !== prevState.displayUnit) {
			this.gauge.setUnitString(this.state.displayUnit);
			this.gauge.setSection(this.state.sections);
			this.gauge.setGradient(this.state.grandient);
			this.gauge.setFractionalScaleDecimals(this.state.scaleDecimals);
			this.gauge.setLabelNumberFormat(this.state.labelNumberFormat);
			this.gauge.setLcdDecimals(this.state.lcdDecimals);
		}

		if (this.state.maxValue !== this.gauge.getMaxValue()) {
			// Gauge scale is too low, increase it.
			this.gauge.setValue(0);
			this.gauge.setFractionalScaleDecimals(this.state.scaleDecimals);
			this.gauge.setMaxValue(this.state.maxValue);
		}
		//FIXME Twwen.js animation in ss lib not working
		//this.gauge.setValueAnimated(this.state.value);
		this.gauge.setValue(this.state.value);

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
					<button onClick={() => this.props.controller.changeUnits({ rain: UNITS.Rain.MM})}>{UNITS.Rain.MM}</button>
					<button onClick={() => this.props.controller.changeUnits({ rain: UNITS.Rain.IN})}>{UNITS.Rain.IN}</button>
				</div>
			</div>
		);
	}
}

interface Props {
		controller: GaugesController,
		size: number
}

interface State {
		title: string,

		value: number,
		maxValue: number,

		displayUnit: string,
		lcdDecimals: number,
		scaleDecimals: number,
		labelNumberFormat: steelseries.LabelNumberFormat,
		sections: any,
		grandient: any

		//popUpTxt?: string,
		//graph?: string
}

type DataParamDef = {
	rfall: any,
	rainunit: RainUnit
};

export default RainGauge;