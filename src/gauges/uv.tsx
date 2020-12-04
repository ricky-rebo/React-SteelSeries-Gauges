import React, { Component } from 'react';
import GaugeUtils from './gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import GaugesController from '../controller/gauges_controller';
import styles from '../style/common.css';
import { extractDecimal } from '../controller/data-utils';

//TODO docs
class UVGauge extends Component<Props, State> {
	static NAME = "UV_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: any;
	params: any;
	style: any;

	constructor(props: Props) {
		super(props);

		this.canvasRef = React.createRef();
	
		this.state = {
			value:  0.0001,
			maxValue:  this.props.controller.gaugeConfig.uvScaleDefMax,
			risk: '',

			//popUpTxt: '',
			//graph: ''
		}

		this.params = {
			...this.props.controller.commonParams,
			size: Math.ceil(this.props.size * this.props.controller.gaugeConfig.gaugeScaling),
			gaugeType: steelseries.GaugeType.TYPE3,
			maxValue: this.state.maxValue,
			titleString: this.props.controller.lang.uv_title,
			niceScale: false,
			section: [
				steelseries.Section(0, 2.9, '#289500'),
				steelseries.Section(2.9, 5.8, '#f7e400'),
				steelseries.Section(5.8, 7.8, '#f85900'),
				steelseries.Section(7.8, 10.9, '#d8001d'),
				steelseries.Section(10.9, 20, '#6b49c8')
			],
			useSectionColors: false,
			valueGradient: new steelseries.gradientWrapper(0, 16,
				[0, 0.1, 0.19, 0.31, 0.45, 0.625, 1],
				[
					new steelseries.rgbaColor(0, 200, 0, 1),
					new steelseries.rgbaColor(0, 200, 0, 1),
					new steelseries.rgbaColor(255, 255, 0, 1),
					new steelseries.rgbaColor(248, 89, 0, 1),
					new steelseries.rgbaColor(255, 0, 0, 1),
					new steelseries.rgbaColor(255, 0, 144, 1),
					new steelseries.rgbaColor(153, 140, 255, 1)
				]
			),
			useValueGradient: true,
			lcdDecimals:this.props.controller.gaugeConfig.uvLcdDecimals,
		};

		this.style = this.props.controller.gaugeConfig.showGaugeShadow
			? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(UVGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new steelseries.RadialBargraph(this.canvasRef.current, this.params);
			this.gauge.setValue(this.state.value);
		}
	}

	async update({ UV }: DataParamDef) {
		let newState: any = {};

		newState.value = extractDecimal(UV);
	
		let indx: number;
		if (+newState.value === 0) 			indx = 0;
		else if (newState.value < 2.5) 	indx = 1;
		else if (newState.value < 5.5) 	indx = 2;
		else if (newState.value < 7.5) 	indx = 3;
		else if (newState.value < 10.5) indx = 4;
		else 														indx = 5;

		newState.maxValue = Math.max(
			GaugeUtils.nextHighest(newState.value, 2),
			this.props.controller.gaugeConfig.uvScaleDefMax
		);

		newState.risk = this.props.controller.lang.uv_levels[indx];

		//utili per i messaggi dettagliati ma non per il gauge in se
		//newState.headLine=this.props.controller.lang.uv_headlines[indx];
		//newState.detail=this.props.controller.lang.uv_details[indx];

		this.setState(newState);
	}

	componentDidUpdate(_prevProps: Props, prevState: State) {
		if(prevState.maxValue !== this.state.maxValue) {
			this.gauge.setMaxValue(this.state.maxValue)
		}

		this.gauge.setUnitString(this.state.risk);
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
	risk: string,

	//popUpTxt: string,
	//graph: string
}

type DataParamDef = {
	UV: any
}

export default UVGauge;