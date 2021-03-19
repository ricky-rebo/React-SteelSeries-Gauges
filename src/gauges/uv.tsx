import React, { Component } from 'react';
// @ts-ignore
import { RadialBargraph, Section, GaugeType, gradientWrapper, rgbaColor } from "steelseries";
import styles from '../style/common.css';
import { gaugeShadow, nextHighest } from './utils.js';
import { RtData } from '../controller/types.js';
import { CommonProps, RGBAColor } from './types';
import { getCommonParams, SHADOW_COLOR, SHOW_GAUGE_SHADOW, SolarScaleDef, UV_LCD_DECIMALS } from './defaults';


class UVGauge extends Component<CommonProps, State> {
	static NAME = "UV_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: RadialBargraph;

	config: Config;

	style: React.CSSProperties;

	constructor(props: CommonProps) {
		super(props);

		this.canvasRef = React.createRef();

		this.config = {
			scaleDefMax: SolarScaleDef.Max_UV,
			lcdDecimals: UV_LCD_DECIMALS,
			useGradient: true,
			showGaugeShadow: SHOW_GAUGE_SHADOW,
			shadowColor: SHADOW_COLOR
		}
	
		this.state = {
			value:  0.0001,
			maxValue:  this.config.scaleDefMax,
			risk: '',

			//popUpTxt: '',
		}

		this.style = this.config.showGaugeShadow
			? gaugeShadow(this.props.size, this.config.shadowColor)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(UVGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new RadialBargraph(this.canvasRef.current, {
				...getCommonParams(),
	
				size: this.props.size,
				gaugeType: GaugeType.TYPE3,
				maxValue: this.state.maxValue,
				titleString: this.props.controller.lang.uv_title,
				niceScale: false,
				section: [
					Section(0, 2.9, '#289500'),
					Section(2.9, 5.8, '#f7e400'),
					Section(5.8, 7.8, '#f85900'),
					Section(7.8, 10.9, '#d8001d'),
					Section(10.9, 20, '#6b49c8')
				],
				useSectionColors: !this.config.useGradient,
				valueGradient: new gradientWrapper(0, 16,
					[0, 0.1, 0.19, 0.31, 0.45, 0.625, 1],
					[
						new rgbaColor(0, 200, 0, 1),
						new rgbaColor(0, 200, 0, 1),
						new rgbaColor(255, 255, 0, 1),
						new rgbaColor(248, 89, 0, 1),
						new rgbaColor(255, 0, 0, 1),
						new rgbaColor(255, 0, 144, 1),
						new rgbaColor(153, 140, 255, 1)
					]
				),
				useValueGradient: this.config.useGradient,
				lcdDecimals: this.config.lcdDecimals,
			});
			this.gauge.setValue(this.state.value);
		}
	}

	async update({ UV }: RtData) {
		let newState: any = {};

		newState.value = UV;
	
		newState.maxValue = Math.max(
			nextHighest(newState.value, 2),
			this.config.scaleDefMax
		);

		let indx: number;
		if (newState.value === 0) 			indx = 0;
		else if (newState.value < 2.5) 	indx = 1;
		else if (newState.value < 5.5) 	indx = 2;
		else if (newState.value < 7.5) 	indx = 3;
		else if (newState.value < 10.5) indx = 4;
		else 														indx = 5;

		newState.risk = this.props.controller.lang.uv_levels[indx];

		//utili per i messaggi dettagliati ma non per il gauge in se
		//newState.headLine=this.props.controller.lang.uv_headlines[indx];
		//newState.detail=this.props.controller.lang.uv_details[indx];

		this.setState(newState);
	}

	componentDidUpdate(_prevProps: CommonProps, prevState: State) {
		if(prevState.maxValue !== this.state.maxValue) {
			this.gauge.setMaxValue(this.state.maxValue)
			this.gauge.setValue(0);
		}

		this.gauge.setUnitString(this.state.risk);
		this.gauge.setValueAnimated(this.state.value);
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
			</div>
		);
	}
}


interface Config {
	scaleDefMax: number,
	lcdDecimals: number,
	useGradient: boolean,
	showGaugeShadow: boolean,
	shadowColor: RGBAColor
}

interface State {
	value: number,
	maxValue: number,
	risk: string,

	//popUpTxt: string
}

export default UVGauge;