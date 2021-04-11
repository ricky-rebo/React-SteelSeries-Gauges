// @ts-ignore
import { drawFrame, drawBackground, drawForeground, BackgroundColor, ColorDef, FrameDesign, ForegroundType, Odometer } from "steelseries"

class Rose {
	setValue: (newValue: number[]) => this
	getValue: () => number[]
	setFrameDesign: (newFrameDesign: any) => this
	setBackgroundColor: (newBackgroundColor: any) => this
	setForegroundType: (newForegroundType: any) => this
	repaint: () => void

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

			//TODO disegnare unitstring quando necessario

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

		let value: number[] = []

		const imageWidth = size
		const imageHeight = size

		const centerX = imageWidth / 2
		const centerY = imageHeight / 2

		let odoPosX: number;
		const odoPosY = imageHeight * 0.67;

		let initialized = false

		// **************   Buffer creation  ********************
		// Buffer for all static background painting code
		const backgroundBuffer = createBuffer(size, size)
		let backgroundContext = backgroundBuffer.getContext('2d')

		// Buffer for static foreground painting code
		const foregroundBuffer = createBuffer(size, size)
		let foregroundContext = foregroundBuffer.getContext('2d')

		//Buffer for Rose chart plot
		const plotBuffer = createBuffer(plotSize, plotSize);
		let plotContext = plotBuffer.getContext("2d");

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

		// **************   Initialization  ********************
		// Draw all static painting code to background
		const init = function () {
			initialized = true

			if (frameVisible) {
				drawFrame(
					backgroundContext,
					frameDesign,
					centerX,
					centerY,
					imageWidth,
					imageHeight
				)
			}

			if (backgroundVisible && backgroundContext) {
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

			if (foregroundVisible) {
				drawForeground(
					foregroundContext,
					foregroundType,
					imageWidth,
					imageHeight,
					false
				)
			}

			if(useOdometer) {
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
          value: value
        })
				odoPosX = (imageWidth - odoBuffer.width) / 2
			}
		}

		const resetBuffers = function () {
			backgroundBuffer.width = size
			backgroundBuffer.height = size
			backgroundContext = backgroundBuffer.getContext('2d')

			// Buffer for pointer image painting code
			//pointerBuffer.width = size
			//pointerBuffer.height = size
			//pointerContext = pointerBuffer.getContext('2d')

			// Buffer for step pointer image painting code
			//stepPointerBuffer.width = size
			//stepPointerBuffer.height = size
			//stepPointerContext = stepPointerBuffer.getContext('2d')

			// Buffer for static foreground painting code
			foregroundBuffer.width = size
			foregroundBuffer.height = size
			foregroundContext = foregroundBuffer.getContext('2d')
		}

		//* *********************************** Public methods **************************************
		this.setValue = function (newValue: number[]) {
			if (value !== newValue) {
				

				this.repaint()
			}
			return this
		}

		this.getValue = function () {
			return value
		}

		this.setFrameDesign = function (newFrameDesign) {
			resetBuffers()
			frameDesign = newFrameDesign
			init()
			this.repaint()
			return this
		}

		this.setBackgroundColor = function (newBackgroundColor) {
			resetBuffers()
			backgroundColor = newBackgroundColor
			init()
			this.repaint()
			return this
		}

		this.setForegroundType = function (newForegroundType) {
			resetBuffers()
			foregroundType = newForegroundType
			init()
			this.repaint()
			return this
		}

		this.repaint = function () {
			if (!initialized) {
				init()
			}

			mainCtx.save()
			mainCtx.clearRect(0, 0, mainCtx.canvas.width, mainCtx.canvas.height)

			// Draw buffered image to visible canvas
			if (frameVisible || backgroundVisible) {
				mainCtx.drawImage(backgroundBuffer, 0, 0)
			}

			//Draw Rose
			//TODO - draw rose chart

			//Draw Odometer
			if (useOdometer) {
        odoGauge.setValue(value)
        mainCtx.drawImage(odoBuffer, odoPosX, odoPosY)
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

/*const Rose = function (canvas: HTMLCanvasElement|string, parameters: any) {
  
}*/
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
