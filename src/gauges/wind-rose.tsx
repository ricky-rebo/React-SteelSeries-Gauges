import React, { Component } from 'react';
// @ts-ignore
import { drawFrame, drawForeground, drawBackground, Odometer, FrameDesign, BackgroundColor, ForegroundType } from "steelseries";
// @ts-ignore
import RGraph from '../libs/RGraph.rose.js';
import styles from '../style/common.css';
import { gaugeShadow } from './utils';
import { RtData, WindrunUnit } from '../controller/types';
import { CommonProps, RGBAColor } from './types';
import { BACKGROUND, FOREGROUND, FRAME_DESIGN, SHADOW_COLOR, SHOW_GAUGE_SHADOW, SHOW_ODO_ROSE_GAUGE } from './defaults';
import { Rose } from 'steelseries-rose-gauge';


class WindRoseGauge extends Component<CommonProps, State> {
	static NAME = "WINDROSE_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: Rose;

	config: Config;

	style: React.CSSProperties;
		
	constructor(props: CommonProps) {
		super(props);

		this.canvasRef = React.createRef();

		this.config = {
			showGaugeShadow: SHOW_GAUGE_SHADOW,
			shadowColor: SHADOW_COLOR,

			size: props.size,
			title: props.controller.lang.windrose,
			compass: props.controller.lang.compass,
			frameDesign: FRAME_DESIGN,
			bgColor: BACKGROUND,
			fgType: FOREGROUND,

			showOdo: SHOW_ODO_ROSE_GAUGE
		}

		let { windrun } = props.controller.getDisplayUnits();
		this.state = {
			roseData: [],
			odoValue: 0,
			odoUnit: props.controller.lang[windrun]
		}

		this.style = this.config.showGaugeShadow
			? gaugeShadow(this.config.size, this.config.shadowColor)
			: {}

		this.update = this.update.bind(this);
		this.props.controller.subscribe(WindRoseGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new Rose(this.canvasRef.current, {
				size: this.config.size,
				frameDesign: this.config.frameDesign,
				backgroundColor: this.config.bgColor,
				foregroundType: this.config.fgType,
				useOdometer: true,
				titleString: this.config.title,
				unitString: this.state.odoUnit,
				pointSymbols: this.config.compass 
			});
		}
	}

	async update({ WindRoseData, windrun, windrununit }: RtData) {
		if(WindRoseData) {
			let newState: any = {
				roseData: WindRoseData,
				odoValue: windrun
			}

			if(this.state.odoUnit !== windrununit) {
				newState.odoUnit = windrununit;
			}

			this.setState(newState);
		}
	}

	componentDidUpdate(_prevProps: CommonProps, prevState: State) {
		if(this.canvasRef.current && this.gauge) {
			if(prevState.odoUnit !== this.state.odoUnit) {
				this.gauge.setOdoValue(0);
				this.gauge.setUnitString(this.state.odoUnit);
			}

			this.gauge.setValue(this.state.roseData);
			this.gauge.setOdoValueAnimated(this.state.odoValue);
		}
	}

	render() {
		return (
			<div className={styles.gauge}>
				<canvas 
					ref={this.canvasRef}
					width={this.config.size}
					height={this.config.size}
					style={this.style}
				></canvas>
				<div>
					<button onClick={() => this.props.controller.changeUnits({ wind: "km/h" })}> km/h </button>
					<button onClick={() => this.props.controller.changeUnits({ wind: "kts" })}> kts </button>
					<button onClick={() => this.props.controller.changeUnits({ wind: "mph" })}> mph </button>
					<button onClick={() => this.props.controller.changeUnits({ wind: "m/s" })}> m/s </button>
				</div>
			</div>
		);
	}
}


interface Config {
	showGaugeShadow: boolean,
	shadowColor: RGBAColor,

	size: number
	title: string,
	compass: string[],
	frameDesign: FrameDesign,
	bgColor: BackgroundColor,
	fgType: ForegroundType,

	showOdo: boolean
}

interface State {
	roseData: number[],
	odoValue: number,
	odoUnit: WindrunUnit
}

export default WindRoseGauge;