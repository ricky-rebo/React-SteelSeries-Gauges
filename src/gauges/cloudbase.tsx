import React, { Component } from 'react';
import GaugeUtils from '../utils/gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import DataUtils from '../utils/data-utils';
import GaugesController from '../controller/gauges_controller';
import styles from '../style/common.css';
import { UNITS } from '../controller/defaults';

//TODO docs
class CloudBaseGauge extends Component<Props, State> {
	static NAME = "CLOUDBASE_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: any;
	params: any;
	style: any;

	constructor(props: Props) {
		super(props);

		this.canvasRef = React.createRef();
	
		this.state = {
			value:  0.0001,
			sections: GaugeUtils.createCloudBaseSections(true),
			maxValue:  props.controller.gaugeConfig.cloudScaleDefMaxm,
			displayUnit: props.controller.getDisplayUnits().cloud === UNITS.Cloud.M
				? this.props.controller.lang.metres
				: this.props.controller.lang.feet

			//popUpTxt: '',
			//popUpGraph: '',
					
		}

		this.params = {
			...this.props.controller.commonParams,
			size: Math.ceil(this.props.size * this.props.controller.gaugeConfig.gaugeScaling),
			maxValue: this.state.maxValue,
			titleString: this.props.controller.lang.cloudbase_title,
			section: this.state.sections,
			unitString: this.props.controller.lang.metres,
			thresholdVisible: false,
			lcdDecimals: 0,
		};

		this.style = this.props.controller.gaugeConfig.showGaugeShadow
			? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
			: {};

		this.update = this.update.bind(this);
		this.unitUpdate = this.unitUpdate.bind(this);

		this.props.controller.subscribe(CloudBaseGauge.NAME, this.update, this.unitUpdate);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new steelseries.Radial(this.canvasRef.current, this.params);
			this.gauge.setValue(this.state.value);
		}
	}

	async update({cloudbasevalue, cloudbaseunit} : DataParamsDef) {
		let newState: any = {};

		newState.value=DataUtils.extractInteger(cloudbasevalue);

		if(cloudbaseunit === UNITS.Cloud.M) {
			// adjust metre gauge in jumps of 1000 metres, don't downscale during the session
			newState.maxValue = Math.max(GaugeUtils.nextHighest(newState.value, 1000), this.props.controller.gaugeConfig.cloudScaleDefMaxm);
			
			if(newState.value <= 1000 && this.props.controller.controllerConfig.roundCloudbaseVal) {
				// and round the value to the nearest  10 m
				newState.value = Math.round(newState.value / 10) * 10;
			}
			else if(this.props.controller.controllerConfig.roundCloudbaseVal) {
				// and round the value to the nearest 50 m
				newState.value = Math.round(newState.value / 50) * 50;
			}
		}
		else {
			newState.maxValue = Math.max(GaugeUtils.nextHighest(newState.value, 2000), this.props.controller.gaugeConfig.cloudScaleDefMaxft);
			
			if(newState.value <= 2000 && this.props.controller.controllerConfig.roundCloudbaseVal){
				// and round the value to the nearest  50 ft
				newState.value = Math.round(newState.value / 50) * 50;
			}
			else if(this.props.controller.controllerConfig.roundCloudbaseVal) {
				// and round the value to the nearest 10 ft
				newState.value = Math.round(newState.value / 100) * 100;
			}
		}

		this.setState(newState);
	}

	async unitUpdate({ cloud }: { cloud: string }) {
		let unitStr = cloud === UNITS.Cloud.M
			? this.props.controller.lang.metres
			: this.props.controller.lang.feet
		if(unitStr !== this.state.displayUnit) {
			this.setState({ displayUnit: unitStr });
		}
	}

	componentDidUpdate(_prevProps: Props, prevState: State) {
		if(this.state.maxValue !== this.gauge.getMaxValue()) {
			this.gauge.setMaxValue(this.state.maxValue);
		}

		if(this.state.displayUnit !== prevState.displayUnit) {
			this.gauge.setUnitString(this.state.displayUnit);
		}

		//FIXME setValueAnimated() from steelseries lib not working!
		//this.gauge.setValueAnimated(this.state.value);
		this.gauge.setValue(this.state.value);
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
					<button onClick={() => this.props.controller.changeUnits({ cloudUnit: UNITS.Cloud.M })}>{UNITS.Cloud.M}</button>
					<button onClick={() => this.props.controller.changeUnits({ cloudUnit: UNITS.Cloud.FT })}>{UNITS.Cloud.FT}</button>
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
	value: number,
	sections: any[],
	maxValue: number,
	displayUnit: string
	//popUpTxt: string,
}

type DataParamsDef = {
	cloudbasevalue: any,
	cloudbaseunit: string
};

export default CloudBaseGauge;