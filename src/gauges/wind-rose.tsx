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


class WindRoseGauge extends Component<CommonProps, State> {
	static NAME = "WINDROSE_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	odoRef: React.RefObject<HTMLCanvasElement>;
	plotRef: React.RefObject<HTMLCanvasElement>;

	config: Config;

	buffer: RoseBuffer;

	odoGauge: Odometer;

	style: React.CSSProperties;
		
	constructor(props: CommonProps) {
		super(props);

		this.canvasRef = React.createRef();
		this.plotRef = React.createRef();

		let odoH = Math.ceil(this.props.size * 0.08); // Sets the size of the odometer
		this.config = {
			showGaugeShadow: SHOW_GAUGE_SHADOW,
			shadowColor: SHADOW_COLOR,

			size: props.size,
			plotSize: Math.floor(props.size * 0.68),
			title: props.controller.lang.windrose,
			compass: props.controller.lang.compass,
			frameDesign: FRAME_DESIGN,
			bgColor: BACKGROUND,
			fgType: FOREGROUND,

			showOdo: SHOW_ODO_ROSE_GAUGE,
			odoDigits: 5,
			odoH: odoH,
			odoW: Math.ceil(Math.floor(odoH * 0.68) * 5)  // 0.68 = 'Magic' number, do not alter // 5 = number of digits
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

		if(this.config.showOdo) {
			this.odoRef = React.createRef();
		}

		this.update = this.update.bind(this);
		this.props.controller.subscribe(WindRoseGauge.NAME, this.update);
	}

	componentDidMount() {
		let roseCanvas = this.canvasRef.current;
		let plotCanvas = this.plotRef.current;
		if(roseCanvas && plotCanvas) {
			this.buffer = initBuffers(roseCanvas, this.config, plotCanvas);
			
			if(this.buffer.roseCtx) {
				// Render an empty gauge, looks better than just the shadow background and odometer ;)
				drawGaugeBase(
					this.buffer.roseCtx,
					this.buffer.frameCanvas,
					this.buffer.bgCanvas,
					this.buffer.fgCanvas
				)

				if (this.config.showOdo && this.odoRef.current) {
					this.odoGauge = new Odometer(
						this.odoRef.current, {
							height  : this.config.odoH,
							digits  : this.config.odoDigits - 1,
							decimals: 1
					});
				}
			}
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
		if(this.canvasRef.current && this.plotRef.current && this.buffer.roseCtx && this.buffer.plotCtx) {
			// Clear the gauge
			this.buffer.roseCtx.clearRect(0, 0, this.config.size, this.config.size);
			this.buffer.plotCtx.clearRect(0, 0, this.config.plotSize, this.config.plotSize);

			//Redraw the empty gauge
			drawGaugeBase(
				this.buffer.roseCtx,
				this.buffer.frameCanvas,
				this.buffer.bgCanvas,
				this.buffer.fgCanvas
			)

			drawRose(this.buffer.plotCanvas, this.state.roseData, this.config);

			// Add title to windrun odometer to the plot
			if (this.config.showOdo) {
				drawOdoTitle(this.buffer.plotCtx, this.state.odoUnit, this.config);
			}

			// Paint the rose plot
			let offset = Math.floor(this.config.size/2 - this.config.plotSize/2);
			this.buffer.roseCtx.drawImage(this.plotRef.current, offset, offset);

			// update the odometer
			if (this.config.showOdo) {
				if(this.state.odoUnit !== prevState.odoUnit) {
					this.odoGauge.setValue(0);
				}

				this.odoGauge.setValueAnimated(this.state.odoValue);
			}
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
				{
					(this.config.showOdo)
						? <canvas
								ref={this.odoRef}
								width={this.config.odoW}
								height={this.config.odoH}
								className={styles.odo}
							></canvas>
						: ''
				}
				<div>
					<button onClick={() => this.props.controller.changeUnits({ wind: "km/h" })}> km/h </button>
					<button onClick={() => this.props.controller.changeUnits({ wind: "kts" })}> kts </button>
					<button onClick={() => this.props.controller.changeUnits({ wind: "mph" })}> mph </button>
					<button onClick={() => this.props.controller.changeUnits({ wind: "m/s" })}> m/s </button>
				</div>

				<div style={{ display: 'none' }}>
					<canvas
						ref={this.plotRef}
						width={this.config.plotSize}
						height={this.config.plotSize}
					></canvas>
				</div>
			</div>
		);
	}
}


interface Config {
	showGaugeShadow: boolean,
	shadowColor: RGBAColor,

	size: number,
	plotSize: number,
	title: string,
	compass: string[],
	frameDesign: FrameDesign,
	bgColor: BackgroundColor,
	fgType: ForegroundType,

	showOdo: boolean,
	odoDigits: number,
	odoH: number,
	odoW: number
}

interface RoseBuffer {
	roseCanvas: HTMLCanvasElement,
	roseCtx: CanvasRenderingContext2D | null,

	plotCanvas: HTMLCanvasElement,
	plotCtx: CanvasRenderingContext2D | null,

	frameCanvas: HTMLCanvasElement,
	frameCtx: CanvasRenderingContext2D | null,

	bgCanvas: HTMLCanvasElement,
	bgCtx: CanvasRenderingContext2D | null,

	fgCanvas: HTMLCanvasElement,
	fgCtx: CanvasRenderingContext2D | null
}

interface State {
	roseData: number[],
	odoValue: number,
	odoUnit: WindrunUnit
}


function createCanvas(size: number) {
	let canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	return canvas;
}

function drawGaugeBase(ctx: CanvasRenderingContext2D, frame: HTMLCanvasElement, bg: HTMLCanvasElement, fg: HTMLCanvasElement) {
	// Paint the gauge frame
	ctx.drawImage(frame, 0, 0);

	// Paint the gauge background
	ctx.drawImage(bg, 0, 0);

	// Paint the gauge foreground
	ctx.drawImage(fg, 0, 0);
}

// Helper function to put the compass points on the background
function drawCompassPoints(ctx: CanvasRenderingContext2D, { size, bgColor, compass }: Config) {
	ctx.save();
	// set the font
	ctx.font = 0.08 * size + 'px serif';
	ctx.strokeStyle = bgColor.labelColor.getRgbaColor();
	ctx.fillStyle = bgColor.labelColor.getRgbColor();
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';

	// Draw the compass points
	for (var i = 0; i < 4; i++) {
			ctx.translate(size / 2, size * 0.125);
			ctx.fillText(compass[i * 2], 0, 0, size);
			ctx.translate(-size / 2, -size * 0.125);
			// Move to center
			ctx.translate(size / 2, size / 2);
			ctx.rotate(Math.PI / 2);
			ctx.translate(-size / 2, -size / 2);
	}
	ctx.restore();
}

function drawOdoTitle(ctx: CanvasRenderingContext2D, title: string, { size, bgColor, plotSize }: Config) {
	ctx.save();
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.font = 0.05 * size + 'px Arial,Verdana,sans-serif';
	ctx.strokeStyle = bgColor.labelColor.getRgbaColor();
	ctx.fillStyle = bgColor.labelColor.getRgbaColor();
	ctx.fillText(title, plotSize/2, plotSize*0.79, plotSize*0.5);
	ctx.restore();
}

function drawRose(canvas: HTMLCanvasElement, data: number[], { title, plotSize, bgColor }: Config) {
	// Create a new rose plot
	let rose = new RGraph.Rose(canvas, data);
	rose.Set('chart.strokestyle', 'black');
	rose.Set('chart.background.axes.color', 'gray');
	rose.Set('chart.colors.alpha', 0.5);
	rose.Set('chart.colors', ['Gradient(#408040:red:#7070A0)']);
	rose.Set('chart.margin', Math.ceil(40 / data.length));

	rose.Set('chart.title', title);
	rose.Set('chart.title.size', Math.ceil(0.05 * plotSize));
	rose.Set('chart.title.bold', false);
	rose.Set('chart.title.color', bgColor.labelColor.getRgbColor());
	rose.Set('chart.gutter.top', 0.2 * plotSize);
	rose.Set('chart.gutter.bottom', 0.2 * plotSize);

	rose.Set('chart.tooltips.effect', 'snap');
	rose.Set('chart.labels.axes', '');
	rose.Set('chart.background.circles', true);
	rose.Set('chart.background.grid.spokes', 16);
	rose.Set('chart.radius', plotSize/2);
	rose.Draw();
}

function initBuffers(mainCanvas: HTMLCanvasElement, config: Config, plotCanvas: HTMLCanvasElement): RoseBuffer {
	let { size, frameDesign, bgColor, fgType } = config;
	let frameCanvas = createCanvas(size);
	let bgCanvas = createCanvas(size);
	let fgCanvas = createCanvas(size);

	let buffers: RoseBuffer = {
		roseCanvas: mainCanvas,
		roseCtx: mainCanvas.getContext('2d'),

		plotCanvas: plotCanvas,
		plotCtx: plotCanvas.getContext('2d'),

		frameCanvas: frameCanvas,
		frameCtx: frameCanvas.getContext("2d"),

		bgCanvas: bgCanvas,
		bgCtx: bgCanvas.getContext("2d"),

		fgCanvas: fgCanvas,
		fgCtx: fgCanvas.getContext("2d")
	}

	let size2 = size/2;
	if(buffers.frameCtx) {
		drawFrame(buffers.frameCtx, frameDesign, size2, size2, size, size);
	}
	
	if(buffers.bgCtx) {
		drawBackground(buffers.bgCtx, bgColor, size2, size2, size, size);

		// Add the compass points
		drawCompassPoints(buffers.bgCtx, config);
	}
	
	if(buffers.fgCtx) {
		drawForeground(buffers.fgCtx, fgType, size, size, false);
	}

	return buffers;
}

export default WindRoseGauge;