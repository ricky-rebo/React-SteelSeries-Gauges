import React, { Component } from 'react';

// @ts-ignore
import steelseries from '../libs/steelseries.js';

import GaugeUtils from '../utils/gauge-utils';
import DataUtils from '../utils/data-utils';
import GaugesController from '../controller/gauges_controller';
import styles from '../style/common.css';

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

			this.state = {
					maxValue: this.props.controller.gaugeConfig.rainScaleDefMaxmm,
					value: 0.0001,
					title: props.controller.lang.rain_title,
					scaleDecimals: 1,
					
					//popUpTxt: '',
					//graph: '',
			}
			let { rainUseGradientColours, rainUseSectionColour } = props.controller.gaugeConfig;

			this.params = {
				...this.props.controller.commonParams,
				size: Math.ceil(this.props.size * this.props.controller.gaugeConfig.gaugeScaling),
				maxValue: this.state.maxValue,
				thresholdVisible: false,
				titleString: this.state.title,
				unitString: this.props.controller.getDisplayUnits().rain,
				valueColor: steelseries.ColorDef.BLUE,
				useValueGradient: rainUseGradientColours,
				valueGradient: rainUseGradientColours ? GaugeUtils.createRainfallGradient(true) : null,
				useSectionColors: rainUseSectionColour,
				section: rainUseSectionColour ? GaugeUtils.createRainfallSections(true) : [],
				labelNumberFormat: props.controller.gaugeConfig.labelFormat,
				fractionalScaleDecimals: this.state.scaleDecimals,
				niceScale: false
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

		newState.value = DataUtils.extractDecimal(rfall);
		if (rainunit === 'mm') { // 10, 20, 30...
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

	componentDidUpdate() {
		if (this.state.maxValue !== this.gauge.getMaxValue()) {
			// Gauge scale is too low, increase it.
			// First set the pointer back to zero so we get a nice animation
			this.gauge.setValue(0);
			// and redraw the gauge with the new scale
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
			</div>
		);
	}
}

interface Props {
		controller: GaugesController,
		size: number
}

interface State {
		value: number,
		maxValue: number,
		title: string,
		scaleDecimals: number

		//popUpTxt?: string,
		//graph?: string
}

type DataParamDef = {
	rfall: any,
	rainunit: string
};

export default RainGauge;