// @ts-ignore
import { Section, TrendState, gradientWrapper, rgbaColor } from "steelseries";
import { RtData } from '../controller/types';
import { LocalDataDef as TempData } from './temp';
import { LocalDataDef as DewData } from './dew';

/**
 * Creates an array of gauge sections appropriate for Celsius or Fahrenheit scales
 * @param useCelsius True id you're using Celsius, False otherwise
 */
//Used by Temp and Dew gauges
export const createTempSections = (useCelsius: boolean) => {
	if (useCelsius) {
		return [
			Section(-100, -35, 'rgba(195, 92, 211, 0.4)'),
			Section(-35, -30, 'rgba(139, 74, 197, 0.4)'),
			Section(-30, -25, 'rgba(98, 65, 188, 0.4)'),
			Section(-25, -20, 'rgba(62, 66, 185, 0.4)'),
			Section(-20, -15, 'rgba(42, 84, 194, 0.4)'),
			Section(-15, -10, 'rgba(25, 112, 210, 0.4)'),
			Section(-10, -5, 'rgba(9, 150, 224, 0.4)'),
			Section(-5, 0, 'rgba(2, 170, 209, 0.4)'),
			Section(0, 5, 'rgba(0, 162, 145, 0.4)'),
			Section(5, 10, 'rgba(0, 158, 122, 0.4)'),
			Section(10, 15, 'rgba(54, 177, 56, 0.4)'),
			Section(15, 20, 'rgba(111, 202, 56, 0.4)'),
			Section(20, 25, 'rgba(248, 233, 45, 0.4)'),
			Section(25, 30, 'rgba(253, 142, 42, 0.4)'),
			Section(30, 40, 'rgba(236, 45, 45, 0.4)'),
			Section(40, 100, 'rgba(245, 109, 205, 0.4)')
		];
	} else {
		return [
			Section(-200, -30, 'rgba(195, 92, 211, 0.4)'),
			Section(-30, -25, 'rgba(139, 74, 197, 0.4)'),
			Section(-25, -15, 'rgba(98, 65, 188, 0.4)'),
			Section(-15, -5, 'rgba(62, 66, 185, 0.4)'),
			Section(-5, 5, 'rgba(42, 84, 194, 0.4)'),
			Section(5, 15, 'rgba(25, 112, 210, 0.4)'),
			Section(15, 25, 'rgba(9, 150, 224, 0.4)'),
			Section(25, 32, 'rgba(2, 170, 209, 0.4)'),
			Section(32, 40, 'rgba(0, 162, 145, 0.4)'),
			Section(40, 50, 'rgba(0, 158, 122, 0.4)'),
			Section(50, 60, 'rgba(54, 177, 56, 0.4)'),
			Section(60, 70, 'rgba(111, 202, 56, 0.4)'),
			Section(70, 80, 'rgba(248, 233, 45, 0.4)'),
			Section(80, 90, 'rgba(253, 142, 42, 0.4)'),
			Section(90, 110, 'rgba(236, 45, 45, 0.4)'),
			Section(110, 200, 'rgba(245, 109, 205, 0.4)')
		];
	}
}


/**
 * Returns the lowest temperature today for gauge scaling
 * @param deflt 
 * @param data 
 */
export const getMinTemp = (deflt: number, { tempTL, dewpointTL, apptempTL, wchillTL }: RtData|TempData|DewData) => {
	tempTL = tempTL ? tempTL : deflt;
	dewpointTL = dewpointTL ? dewpointTL : deflt;
	apptempTL = apptempTL ? apptempTL : deflt;
	wchillTL = wchillTL ? wchillTL : deflt;
	return Math.min(tempTL, dewpointTL, apptempTL, wchillTL);
}

/**
 * Returns the highest temperature today for gauge scaling
 * @param deflt 
 * @param data 
 */
export const getMaxTemp = (deflt: number, { tempTH, apptempTH, heatindexTH, humidex }: RtData|TempData|DewData) => {
	tempTH = tempTH ? tempTH : deflt;
	apptempTH = apptempTH ? apptempTH : deflt;
	heatindexTH = heatindexTH ? heatindexTH : deflt;
	humidex = humidex ? humidex : deflt;
	return Math.max(tempTH, apptempTH, heatindexTH, humidex);
}


/**
 * Create a shadow effect for the gauge using CSS
 * @param size The size of the gauge
 * @param color The color of the shadow (specified in the controller's config)
 */
export const gaugeShadow = (size: number, color: string) => {
	var offset = Math.floor(size * 0.015);
	return {
		boxShadow   : offset + 'px ' + offset + 'px ' + offset + 'px ' + color,
		borderRadius: Math.floor(size / 2) + 'px'
	};
}



/**
 * //TODO move in WindDir Gauge
 * @param startCol 
 * @param endCol 
 * @param fraction 
 */
export const gradient = (startCol : string, endCol : string, fraction :number) => {
	var redOrigin, grnOrigin, bluOrigin,
			gradientSizeRed, gradientSizeGrn, gradientSizeBlu;

	redOrigin = parseInt(startCol.substr(0, 2), 16);
	grnOrigin = parseInt(startCol.substr(2, 2), 16);
	bluOrigin = parseInt(startCol.substr(4, 2), 16);

	gradientSizeRed = parseInt(endCol.substr(0, 2), 16)  - redOrigin; // Graduation Size Red
	gradientSizeGrn = parseInt(endCol.substr(2, 2), 16)  - grnOrigin;
	gradientSizeBlu = parseInt(endCol.substr(4, 2), 16)  - bluOrigin;

	return (redOrigin + (gradientSizeRed * fraction)).toFixed(0) + ',' +
		(grnOrigin + (gradientSizeGrn * fraction)).toFixed(0) + ',' +
		(bluOrigin + (gradientSizeBlu * fraction)).toFixed(0);
}


/**
 * Returns the next highest number in the step sequence
 * @param value 
 * @param step 
 */
export const nextHighest = (value: number, step: number) => (value == 0 ? step : Math.ceil(value / step) * step)

/**
 * Returns the next lowest number in the step sequence
 * @param value 
 * @param step 
 */
export const nextLowest = (value: number, step: number) => (value == 0 ? -step : Math.floor(value / step) * step)