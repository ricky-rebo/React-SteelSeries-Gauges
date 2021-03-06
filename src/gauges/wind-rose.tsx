import React, { Component } from 'react';
// @ts-ignore
import { drawFrame, drawForeground, drawBackground, Odometer } from "steelseries";
// @ts-ignore
import RGraph from '../libs/RGraph.rose.js';
import styles from '../style/common.css';
import { gaugeShadow } from './gauge-utils.js';
import { RtData, WindrunUnit } from '../controller/data-types.js';
import { Props } from './data-types.js';

function createCanvas(size: number) {
	let canvas = document.createElement('canvas');
	canvas.width = size;
	canvas.height = size;
	return canvas;
}

//TODO docs
class WindRoseGauge extends Component<Props, State> {
	static NAME = "WINDROSE_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
	odoRef: React.RefObject<HTMLCanvasElement>;
	plotRef: React.RefObject<HTMLCanvasElement>;
	buffers: any;

	gaugeParams: {
		size: number,
		size2: number,
		plotSize: number,
		plotSize2: number,
		titleString: string,
		compassStrings: string[],

		style?: React.CSSProperties
	};

	showOdo: boolean;
	odoParams: {
		odoDigits: number,

		width: number,
		height: number,
		style?: string
	}
	odoGauge: any;
		
	constructor(props: Props) {
		super(props);

		this.canvasRef = React.createRef();
		this.plotRef = React.createRef();

		let { windrun } = props.controller.getDisplayUnits();
		this.state = {
			WindRoseData: [],
			odoValue: 0,
			odoUnit: props.controller.lang[windrun]
		}

		let size = Math.ceil(props.size * props.controller.gaugeConfig.gaugeScaling)
		this.gaugeParams = {
			size: size,
			size2: size / 2,
			plotSize: Math.floor(size * 0.68),
			plotSize2: Math.floor(size * 0.68) / 2,

			compassStrings: props.controller.lang.compass,
			titleString: props.controller.lang.windrose
		}
		this.gaugeParams.style = props.controller.gaugeConfig.showGaugeShadow
			? gaugeShadow(this.gaugeParams.size, props.controller.gaugeConfig.shadowColour)
			: {}

		
		this.showOdo = props.controller.gaugeConfig.showRoseGaugeOdo;
		let digits = 5,	h = Math.ceil(this.gaugeParams.size * 0.08); // Sets the size of the odometer
		this.odoParams = {
			odoDigits:  digits,
			height: h,
			width: Math.ceil(Math.floor(h * 0.68) * digits)  // 'Magic' number, do not alter
		}
		if(this.showOdo) {
			this.odoRef = React.createRef();
		}

		this.buffers = {};

		this.update = this.update.bind(this);
		this.props.controller.subscribe(WindRoseGauge.NAME, this.update);
	}

	componentDidMount() {
		let roseCanvas = this.canvasRef.current;
		let rosePlot = this.plotRef.current;
		if(roseCanvas && rosePlot) {
			//this.buffers.plot = rosePlot;
			this.buffers.ctxRoseCanvas = roseCanvas.getContext('2d');
			this.buffers.ctxPlot = rosePlot.getContext('2d');

			// Create a steelseries gauge frame
			this.buffers.frame = createCanvas(this.gaugeParams.size);
			this.buffers.ctxFrame = this.buffers.frame.getContext('2d');
			drawFrame(
				this.buffers.ctxFrame,
				this.props.controller.gaugeConfig.frameDesign,
				this.gaugeParams.size2,
				this.gaugeParams.size2,
				this.gaugeParams.size,
				this.gaugeParams.size
			);

			// Create a steelseries gauge background
			this.buffers.background = createCanvas(this.gaugeParams.size);
			this.buffers.ctxBackground = this.buffers.background.getContext('2d');
			drawBackground(
				this.buffers.ctxBackground,
				this.props.controller.gaugeConfig.background,
				this.gaugeParams.size2,
				this.gaugeParams.size2,
				this.gaugeParams.size,
				this.gaugeParams.size
			);

			// Add the compass points
			this._drawCompassPoints(this.buffers.ctxBackground, this.gaugeParams.size);

			// Create a steelseries gauge foreground
			this.buffers.foreground = createCanvas(this.gaugeParams.size);
			this.buffers.ctxForeground = this.buffers.foreground.getContext('2d');
			drawForeground(
				this.buffers.ctxForeground,
				this.props.controller.gaugeConfig.foreground,
				this.gaugeParams.size,
				this.gaugeParams.size,
				false
			);

			
			if(this.buffers.ctxRoseCanvas) {
				// Render an empty gauge, looks better than just the shadow background and odometer ;)
				this._drawEmptyGauge(this.buffers.ctxRoseCanvas);

				if (this.showOdo && this.odoRef.current && this.odoParams) {
					let top = Math.ceil(this.gaugeParams.size * 0.7 + roseCanvas.offsetTop);
					let left = Math.ceil((this.gaugeParams.size - this.odoParams.width) / 2 + roseCanvas.offsetLeft);
					this.odoParams.style = `position: absolute; top: ${top}px; left: ${left}px`
					this.odoRef.current.setAttribute('style', this.odoParams.style);
					
					// Create the odometer
					this.odoGauge = new Odometer(
						this.odoRef.current, {
							height  : this.odoParams.height,
							digits  : this.odoParams.odoDigits - 1,
							decimals: 1
					});
				}
			}
		}
	}

	async update({ WindRoseData, windrun }: RtData) {
		if(WindRoseData) {
			let newState: any = {
				WindRoseData: WindRoseData,
				odoValue: windrun
			}

			let { windrun: windrunUnit } = this.props.controller.getDisplayUnits();
			if(this.state.odoUnit !== windrunUnit) {
				newState.odoUnit = windrunUnit;
			}

			this.setState(newState);
		}
	}

	componentDidUpdate(_prevProps: Props, prevState: State) {
		if(this.canvasRef.current && this.plotRef.current) {
			// Clear the gauge
			this.buffers.ctxRoseCanvas.clearRect(0, 0, this.gaugeParams.size, this.gaugeParams.size);
			this.buffers.ctxPlot.clearRect(0, 0, this.gaugeParams.plotSize, this.gaugeParams.plotSize);

			//Redraw the empty gauge
			this._drawEmptyGauge(this.buffers.ctxRoseCanvas);

			// Create a new rose plot
			let rose = new RGraph.Rose(this.plotRef.current, this.state.WindRoseData);
			rose.Set('chart.strokestyle', 'black');
			rose.Set('chart.background.axes.color', 'gray');
			rose.Set('chart.colors.alpha', 0.5);
			rose.Set('chart.colors', ['Gradient(#408040:red:#7070A0)']);
			rose.Set('chart.margin', Math.ceil(40 / this.state.WindRoseData.length));

			rose.Set('chart.title', this.gaugeParams.titleString);
			rose.Set('chart.title.size', Math.ceil(0.05 * this.gaugeParams.plotSize));
			rose.Set('chart.title.bold', false);
			rose.Set('chart.title.color', this.props.controller.gaugeConfig.background.labelColor.getRgbColor());
			rose.Set('chart.gutter.top', 0.2 * this.gaugeParams.plotSize);
			rose.Set('chart.gutter.bottom', 0.2 * this.gaugeParams.plotSize);

			rose.Set('chart.tooltips.effect', 'snap');
			rose.Set('chart.labels.axes', '');
			rose.Set('chart.background.circles', true);
			rose.Set('chart.background.grid.spokes', 16);
			rose.Set('chart.radius', this.gaugeParams.plotSize2);
			rose.Draw();

			// Add title to windrun odometer to the plot
			if (this.showOdo) {
				this._drawOdoTitle(this.buffers.ctxPlot);
			}

			// Paint the rose plot
			let offset = Math.floor(this.gaugeParams.size2 - this.gaugeParams.plotSize2);
			this.buffers.ctxRoseCanvas.drawImage(this.plotRef.current, offset, offset);

			// update the odometer
			if (this.showOdo) {
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
					width={this.gaugeParams.size}
					height={this.gaugeParams.size}
					style={this.gaugeParams.style}
				></canvas>
				{
					(this.showOdo && this.odoParams)
						? <canvas
								ref={this.odoRef}
								width={this.odoParams.width}
								height={this.odoParams.height}
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
						width={this.gaugeParams.plotSize}
						height={this.gaugeParams.plotSize}
					></canvas>
				</div>
			</div>
		);
	}


	/* ADDITIONAL FUNCTIONS FOR DRAWING ROSE */
	_drawEmptyGauge(ctx: any) {
		// Paint the gauge frame
		ctx.drawImage(this.buffers.frame, 0, 0);

		// Paint the gauge background
		ctx.drawImage(this.buffers.background, 0, 0);

		// Paint the gauge foreground
		ctx.drawImage(this.buffers.foreground, 0, 0);
	}

	// Helper function to put the compass points on the background
	_drawCompassPoints(ctx: any, size: number) {
			ctx.save();
			// set the font
			ctx.font = 0.08 * size + 'px serif';
			ctx.strokeStyle = this.props.controller.gaugeConfig.background.labelColor.getRgbaColor();
			ctx.fillStyle = this.props.controller.gaugeConfig.background.labelColor.getRgbColor();
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';

			// Draw the compass points
			for (var i = 0; i < 4; i++) {
					ctx.translate(size / 2, size * 0.125);
					ctx.fillText(this.gaugeParams.compassStrings[i * 2], 0, 0, size);
					ctx.translate(-size / 2, -size * 0.125);
					// Move to center
					ctx.translate(size / 2, size / 2);
					ctx.rotate(Math.PI / 2);
					ctx.translate(-size / 2, -size / 2);
			}
			ctx.restore();
	}

	_drawOdoTitle(ctx: any) {
			ctx.save();
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.font = 0.05 * this.gaugeParams.size + 'px Arial,Verdana,sans-serif';
			ctx.strokeStyle = this.props.controller.gaugeConfig.background.labelColor.getRgbaColor();
			ctx.fillStyle = this.props.controller.gaugeConfig.background.labelColor.getRgbaColor();
			ctx.fillText(
				this.state.odoUnit,
				this.gaugeParams.plotSize2,
				this.gaugeParams.plotSize * 0.75,
				this.gaugeParams.plotSize * 0.5
			);
			ctx.restore();
	}
}

interface State {
	WindRoseData: number[],
	odoValue: number,
	odoUnit: WindrunUnit
}

export default WindRoseGauge;