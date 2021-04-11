// @ts-ignore
import { drawFrame, drawBackground, drawForeground, BackgroundColor, ColorDef, FrameDesign, ForegroundType, Odometer } from "steelseries"
// @ts-ignore
import RGraph from '../libs/RGraph.rose.js';
// @ts-ignore
import Tween from "steelseries/docs/tween.js";

class Rose {
	setValue: (newValue: number[]) => this
	getValue: () => number[]
	setFrameDesign: (newFrameDesign: any) => this
	setBackgroundColor: (newBackgroundColor: any) => this
	setForegroundType: (newForegroundType: any) => this
	repaint: () => void
	setOdoValue: (newValue: number) => this;
	setOdoValueAnimated: (newValue: number, callback?: () => void) => this;
	getOdoValue: () => number;
	setTitleString: (newTitle: string | number) => this;
	setUnitString: (newUnit: string) => this;

	constructor(canvas: HTMLCanvasElement | string, parameters: any) {
		parameters = parameters || {}
		let size = undefined === parameters.size ? 0 : parameters.size
		let titleString = undefined === parameters.titleString	
			? ""
			: parameters.titleString;
		let unitString = undefined === parameters.unitString
			? ""
			: parameters.unitString;
		let pointSymbols: string[] = undefined === parameters.pointSymbols
			? ["N", "E", "S", "W"]
			: parameters.pointSymbols;

		let frameDesign =
			undefined === parameters.frameDesign
				? FrameDesign.METAL
				: parameters.frameDesign
		const frameVisible =
			undefined === parameters.frameVisible ? true : parameters.frameVisible
		
		let backgroundColor =
			undefined === parameters.backgroundColor
				? BackgroundColor.DARK_GRAY
				: parameters.backgroundColor
		const backgroundVisible =
			undefined === parameters.backgroundVisible
				? true
				: parameters.backgroundVisible
		
		let foregroundType =
			undefined === parameters.foregroundType
				? ForegroundType.TYPE1
				: parameters.foregroundType
		const foregroundVisible =
			undefined === parameters.foregroundVisible
				? true
				: parameters.foregroundVisible
		
		const useOdometer =
			undefined === parameters.useOdometer ? false : parameters.useOdometer
		const odometerParams =
			undefined === parameters.odometerParams ? {} : parameters.odometerParams


		// Get the canvas context and clear it
		const mainCtx = getCanvasContext(canvas)
		// Has a size been specified?
		if (size === 0) {
			size = Math.min(mainCtx.canvas.width, mainCtx.canvas.height)
		}

		const plotSize = Math.floor(size * 0.68);

		// Set the size - also clears the canvas
		mainCtx.canvas.width = size
		mainCtx.canvas.height = size

		let repainting = false
		let tween: any

		let value: number[] = []
		let odoValue: number;

		const imageWidth = size
		const imageHeight = size

		const centerX = imageWidth / 2
		const centerY = imageHeight / 2

		let odoPosX: number;
		const odoPosY = imageHeight * 0.67;

		let initialized = false

		// **************   Buffer creation  ********************
		const frameBuffer = createBuffer(size, size);
		let frameContext = frameBuffer.getContext("2d");

		// Buffer for static background painting code
		const backgroundBuffer = createBuffer(size, size)
		let backgroundContext = backgroundBuffer.getContext('2d')

		// Buffer for static foreground painting code
		const foregroundBuffer = createBuffer(size, size)
		let foregroundContext = foregroundBuffer.getContext('2d')

		//Buffer for Rose chart plot
		const plotBuffer = createBuffer(plotSize, plotSize);
		//let plotContext = plotBuffer.getContext("2d");

		let odoGauge: Odometer, odoBuffer: HTMLCanvasElement, odoContext: CanvasRenderingContext2D|null;
		if(useOdometer) {
			odoBuffer = createBuffer(10, 10);
			odoContext = odoBuffer.getContext('2d')
		}

		// **************   Image creation  ********************
		function drawCompassPoints(ctx: CanvasRenderingContext2D) {
			if((pointSymbols.length !== 4) && (pointSymbols.length !== 8)) {
				return;
			}

			let mul = (pointSymbols.length === 4) ? 1 : 2;
			
			ctx.save();
			// set the font
			ctx.font = 0.08 * size + 'px serif';
			ctx.strokeStyle = backgroundColor.labelColor.getRgbaColor();
			ctx.fillStyle = backgroundColor.labelColor.getRgbColor();
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
		
			// Draw the compass points
			for (var i = 0; i < 4; i++) {
					ctx.translate(size / 2, size * 0.125);
					ctx.fillText(pointSymbols[i * mul], 0, 0, size);
					ctx.translate(-size / 2, -size * 0.125);
					// Move to center
					ctx.translate(size / 2, size / 2);
					ctx.rotate(Math.PI / 2);
					ctx.translate(-size / 2, -size / 2);
			}
			ctx.restore();
		}

		function drawOdoTitle(ctx: CanvasRenderingContext2D) {
			ctx.save();
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.font = `${0.05 * size}px ${stdFontName}`;
			ctx.strokeStyle = backgroundColor.labelColor.getRgbaColor();
			ctx.fillStyle = backgroundColor.labelColor.getRgbaColor();
			ctx.fillText(unitString, plotSize/2, plotSize*0.79, plotSize*0.5);
			ctx.restore();
		}

		// **************   Initialization  ********************
		// Draw all static painting code to background
		const init = function (parameters?: { frame?: boolean, background?: boolean, rose?: boolean, foreground?: boolean, odo?: boolean }) {
			parameters = parameters || {}
			const drawFrame2 =
      undefined === parameters.frame ? false : parameters.frame
			const drawBackground2 =
				undefined === parameters.background ? false : parameters.background
			const drawRose = undefined === parameters.rose ? false : parameters.rose;
			const drawForeground2 =
				undefined === parameters.foreground ? false : parameters.foreground
			const drawOdo = undefined === parameters.odo ? false : parameters.odo

			initialized = true

			if (drawFrame2 && frameVisible && frameContext) {
				drawFrame(
					frameContext,
					frameDesign,
					centerX,
					centerY,
					imageWidth,
					imageHeight
				)
			}

			if (drawBackground2 && backgroundVisible && backgroundContext) {
				drawBackground(
					backgroundContext,
					backgroundColor,
					centerX,
					centerY,
					imageWidth,
					imageHeight
				)
				drawCompassPoints(backgroundContext);
			}

			if (drawRose && value !== []) {
				// Create a new rose plot
				const rose = new RGraph.Rose(plotBuffer, value);
				rose.Set('chart.strokestyle', 'black');
				rose.Set('chart.background.axes.color', 'gray');
				rose.Set('chart.colors.alpha', 0.5);
				rose.Set('chart.colors', ['Gradient(#408040:red:#7070A0)']);
				rose.Set('chart.margin', Math.ceil(40 / value.length));
			
				rose.Set('chart.title', titleString);
				rose.Set('chart.title.size', Math.ceil(0.05 * plotSize));
				rose.Set('chart.title.bold', false);
				rose.Set('chart.title.color', backgroundColor.labelColor.getRgbColor());
				rose.Set('chart.gutter.top', 0.2 * plotSize);
				rose.Set('chart.gutter.bottom', 0.2 * plotSize);
			
				rose.Set('chart.tooltips.effect', 'snap');
				rose.Set('chart.labels.axes', '');
				rose.Set('chart.background.circles', true);
				rose.Set('chart.background.grid.spokes', 16);
				rose.Set('chart.radius', plotSize/2);
				rose.Draw();
			}

			if (drawForeground2 && foregroundVisible && foregroundContext) {
				drawForeground(
					foregroundContext,
					foregroundType,
					imageWidth,
					imageHeight,
					false
				)
			}

			if (drawOdo && useOdometer && odoContext) {
				//TODO controllare correttezza parametri
				// wind-rose.tsx for reference
				odoGauge = new Odometer('', {
          _context: odoContext,
          height: Math.ceil(size * 0.08),
          decimals: odometerParams.decimals === undefined ? 1 : odometerParams.decimals,
          digits: odometerParams.digits === undefined ? 5 : odometerParams.digits,
          valueForeColor: odometerParams.valueForeColor,
          valueBackColor: odometerParams.valueBackColor,
          decimalForeColor: odometerParams.decimalForeColor,
          decimalBackColor: odometerParams.decimalBackColor,
          font: odometerParams.font,
          value: odoValue
        })
				odoPosX = (imageWidth - odoBuffer.width) / 2
			}
		}

		const resetBuffers = function (buffers?: { frame?: boolean, background?: boolean, rose?: boolean, foreground?: boolean }) {
			buffers = buffers || {}
			const resetFrame = undefined === buffers.frame ? false : buffers.frame
			const resetBackground =
				undefined === buffers.background ? false : buffers.background
			const resetPlot = undefined === buffers.rose ? false : buffers.rose
			const resetForeground =
				undefined === buffers.foreground ? false : buffers.foreground

			if (resetFrame && frameVisible) {
				frameBuffer.width = size;
				frameBuffer.height = size;
				frameContext = frameBuffer.getContext("2d");
			}
			
			if(resetBackground && backgroundVisible) {
				backgroundBuffer.width = size
				backgroundBuffer.height = size
				backgroundContext = backgroundBuffer.getContext('2d')
			}
			
			if(resetPlot) {
				plotBuffer.width = plotSize
				plotBuffer.height = plotSize
			}
			
			if(resetForeground && foregroundVisible) {
				foregroundBuffer.width = size
				foregroundBuffer.height = size
				foregroundContext = foregroundBuffer.getContext('2d')
			}
		}

		//* *********************************** Public methods **************************************
		this.setValue = function (newValue: number[]) {
			if (value !== newValue) {
				resetBuffers({ rose: true })
				value = newValue
				init({ rose: true })

				this.repaint()
			}
			return this
		}

		this.getValue = function () {
			return value
		}

		this.setOdoValue = function (newValue: number) {
			odoValue = newValue < 0 ? 0 : newValue;
			this.repaint();
			return this
		}

		this.getOdoValue = function () {
			return odoValue;
		}

		this.setOdoValueAnimated = function (newVal: number, callback?: () => void) {
			const gauge = this
			if(newVal < 0) newVal = 0

			if (odoValue !== newVal) {
				//TODO define animated odometer value update 
				// see Odometer.setValueAnimated() for reference

				if (undefined !== tween && tween.isPlaying) {
					tween.stop()
				}
	
				tween = new Tween({}, '', Tween.strongEaseOut, value, newVal, 2)
				tween.onMotionChanged = function (event: any) {
					value = event.target._pos
					if (!repainting) {
						repainting = true
						requestAnimFrame(gauge.repaint)
					}
				}
	
				// do we have a callback function to process?
				if (callback && typeof callback === 'function') {
					tween.onMotionFinished = callback
				}
	
				tween.start()
			}
			return this
		}

		this.setTitleString = function (newTitle: string|number) {
			resetBuffers({ rose: true })
			titleString = newTitle
			init({ rose: true })
			this.repaint();
			return this
		}

		this.setUnitString = function (newUnit: string) {
			unitString = newUnit;
			this.repaint();
			return this
		}

		this.setFrameDesign = function (newFrameDesign) {
			resetBuffers({ frame: true })
			frameDesign = newFrameDesign
			init({ frame: true })
			this.repaint()
			return this
		}

		this.setBackgroundColor = function (newBackgroundColor) {
			resetBuffers({
				background: true,
				rose: true
			})
			backgroundColor = newBackgroundColor
			init({
				background: true,
				rose: true
			})
			this.repaint()
			return this
		}

		this.setForegroundType = function (newForegroundType) {
			resetBuffers({ foreground: true })
			foregroundType = newForegroundType
			init({ foreground: true })
			this.repaint()
			return this
		}

		this.repaint = function () {
			if (!initialized) {
				init({ frame: true, background: true, foreground: true, odo: useOdometer });
			}

			mainCtx.save()
			mainCtx.clearRect(0, 0, mainCtx.canvas.width, mainCtx.canvas.height)

			// Draw buffered image to visible canvas
			if(frameVisible) {
				mainCtx.drawImage(frameBuffer, 0, 0)
			}
			if (backgroundVisible) {
				mainCtx.drawImage(backgroundBuffer, 0, 0)
			}

			// Paint the rose plot
			let offset = Math.floor(size/2 - plotSize/2);
			mainCtx.drawImage(plotBuffer, offset, offset);

			//Draw Odometer
			if (useOdometer) {
        odoGauge.setValue(odoValue)
        mainCtx.drawImage(odoBuffer, odoPosX, odoPosY)
				
				if (unitString !== "") {
					drawOdoTitle(mainCtx);
				}
      }

			// Draw foreground
			if (foregroundVisible) {
				mainCtx.drawImage(foregroundBuffer, 0, 0)
			}

			mainCtx.restore()

			repainting = false
		}

		// Visualize the component
		this.repaint()

		return this
	}
}

export default Rose


const stdFontName = 'Arial,Verdana,sans-serif';

function createBuffer (width: number, height: number) {
  const buffer = document.createElement('canvas')
  buffer.width = width
  buffer.height = height
  return buffer
}

function getCanvasContext (elementOrId: HTMLCanvasElement | string) {
  const element =
    typeof elementOrId === 'string'
      ? document.getElementById(elementOrId)
      : elementOrId
	// @ts-ignore
	return (element) ? element.getContext('2d') : null
}

export const requestAnimFrame = (function () {
  return (
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    //window.mozRequestAnimationFrame ||
    //window.oRequestAnimationFrame ||
    //window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 16)
    }
  )
})()
