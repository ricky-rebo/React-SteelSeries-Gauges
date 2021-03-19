import React, { Component } from 'react';
// @ts-ignore
import { WindDirection, Section, PointerType, ColorDef, rgbaColor } from "steelseries";
import styles from '../style/common.css';
import { gaugeShadow } from './utils.js';
import { RtData } from '../controller/types.js';
import { CommonProps, RGBAColor } from './types';
import { DIR_AVG_POINTER, DIR_AVG_POINTER_COLOR, getCommonParams, MIN_MAX_AREA_COLOR, POINTER, SHADOW_COLOR, SHOW_GAUGE_SHADOW, SHOW_ROSE_ON_DIR, SHOW_WIND_METAR, SHOW_WIND_VARIATION, WIND_VAR_SECTION_COLOR } from './defaults';


class WindDirGauge extends Component<CommonProps, State> {
	static NAME = "WINDDIR_GAUGE";
	
	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: WindDirection;

	config: Config;

	style: React.CSSProperties;

	constructor(props: CommonProps) {
		super(props);

		this.canvasRef = React.createRef();

		this.config = {
			dirLstPointer: POINTER,
			dirAvgPointer: DIR_AVG_POINTER,
			dirAvgPointerColor: DIR_AVG_POINTER_COLOR,
			showWindVariation: SHOW_WIND_VARIATION,
			variationSectorColor: WIND_VAR_SECTION_COLOR,
			minMaxAreaColor: MIN_MAX_AREA_COLOR,
			showRoseOnDirGauge: SHOW_ROSE_ON_DIR,
			showWindMetar: SHOW_WIND_METAR,
			showGaugeShadow: SHOW_GAUGE_SHADOW,
			shadowColor: SHADOW_COLOR
		};
	
		this.state = {
			valueLatest: 0,
			valueAverage: 0,
			VRB: '',
			area: [],
			section: []
		};

		this.style = this.config.showGaugeShadow
			? gaugeShadow(this.props.size, this.config.shadowColor)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(WindDirGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new WindDirection(this.canvasRef.current, {
				...getCommonParams(),
	
				size: this.props.size,
				lcdtitleStrings: [this.props.controller.lang.latest_web, this.props.controller.lang.tenminavg_web],
				pointerTypeLatest: this.config.dirLstPointer, 
				pointerTypeAverage: this.config.dirAvgPointer,
				pointerColorAverage: this.config.dirAvgPointerColor,
				degreeScale: true,
				pointSymbols: this.props.controller.lang.compass,
				roseVisible: false,
				useColorLabels: false, 
			});
			this.gauge.setValueAverage(this.state.valueAverage);
			this.gauge.setValueLatest(this.state.valueLatest)
		}
	}

	async update({ bearing, avgbearing, BearingRangeFrom10, BearingRangeTo10, wspeed, wgust, windunit, WindRoseData }: RtData) {
		let newState: any = {};

		newState.valueLatest = bearing;
		newState.valueAverage = avgbearing;
		let bearingFrom = BearingRangeFrom10;
		let bearingTo = BearingRangeTo10;

		if(newState.valueAverage === 0) {
			newState.valueLatest = 0;
		}

		if(this.config.showWindVariation) {
			let windSpd = wspeed;
			let windGst = wgust;
			let avgKnots: number, gstKnots: number;
			switch(windunit){
				case "mph":
					avgKnots = 0.868976242 * windSpd;
					gstKnots = 0.868976242 * windGst;
					break;
				case "kts":
					avgKnots = windSpd;
					gstKnots = windGst;
					break;
				case "m/s":
					avgKnots = 1.94384449 * windSpd;
					gstKnots = 1.94384449 * windGst;
					break;
				case "km/h":
					avgKnots = 0.539956803 * windSpd;
					gstKnots = 0.539956803 * windGst;
					break;
				default:
					avgKnots = 0;
					gstKnots = 0;
			}

			avgKnots = Math.round(avgKnots);
			gstKnots = Math.round(gstKnots);

			if(this.config.showWindMetar) {
				newState.VRB = ` - METAR: ${('0'+avgbearing).slice(-3)}${('0' + avgKnots).slice(-2)}G${('0' + gstKnots).slice(-2)}KT`;
			}
			else{
				newState.VRB = '';
			}

			if(windSpd > 0) {
				/*if(avgKnots < 3) { // Europe uses 3kts, USA 6kts as the threshold
					if(this.config.showRoseOnDirGauge) {
						newState.section = [Section(bearingFrom, bearingTo, this.config.variationSectorColor)];
					}
					else {
						newState.area = [Section(bearingFrom, bearingTo, this.config.minMaxAreaColor)];
					}
				}
				else*/ 
				if (this.config.showRoseOnDirGauge) {
					newState.section = [Section(bearingFrom, bearingTo, this.config.variationSectorColor)];
				}
				else {
					newState.area = [Section(bearingFrom, bearingTo, this.config.minMaxAreaColor)];
				}

				if(this.config.showWindMetar) {
					let range = (bearingTo < bearingFrom ? (360 + bearingTo) : bearingTo) - (bearingFrom);
					if((range>0 && range<60) || range === 0 && bearingFrom === newState.valueAverage)
						newState.VRB += ' STDY';
					else if(newState.avgKnots < 3) {
						newState.VRB += ' VRB';
					}
					else {
						newState.VRB += ' ' + newState.bearingFrom + 'V' + newState.bearingTo;
					}
				}
			}
			else {
				// Zero wind speed, calm
				if(this.config.showWindMetar){
					newState.VRB = ' - METAR: 00000KT';
				}
				
				newState.section = [];
				if(!this.config.showRoseOnDirGauge) {
					newState.area = [];
				}
			}
		}
		else {
			newState.VRB = '';
		}

		if(this.config.showRoseOnDirGauge && WindRoseData){
			let rosepoints = WindRoseData.length;
			let roseSectionAngle = 360/rosepoints;
			let roseAreas = [];

			//find total for all directions
			let roseMax = Math.max(...WindRoseData);
			
			//Check we actually have some data, bad things happen if roseMax=0!
			if(roseMax > 0) {
				// Find relative value for each point, and create a gauge area for it
				for(let i = 0; i < rosepoints; i++) {
					roseAreas[i] = Section(
						i*roseSectionAngle - roseSectionAngle/2,
						(i+1) * roseSectionAngle - roseSectionAngle/2,
						`rgba(${gradient('2020D0', 'D04040', WindRoseData[i] / roseMax)},${(WindRoseData[i] / roseMax).toFixed(2)})`
					);
				}
			}
			newState.area = roseAreas;
		}

		this.setState(newState);
	}

	componentDidUpdate() {
		this.gauge.setArea(this.state.area);
		if(this.config.showRoseOnDirGauge) {
			this.gauge.setSection(this.state.section);
		}

		this.gauge.setValueAnimatedLatest(this.state.valueLatest);
		this.gauge.setValueAnimatedAverage(this.state.valueAverage);
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
	dirLstPointer: PointerType,
	dirAvgPointer: PointerType,
	dirAvgPointerColor: ColorDef,
	showWindVariation: boolean,
	variationSectorColor: RGBAColor,
	minMaxAreaColor: RGBAColor,
	showRoseOnDirGauge: boolean,
	showWindMetar: boolean,
	showGaugeShadow: boolean,
	shadowColor: RGBAColor
}

interface State {
	valueLatest: number,
	valueAverage: number,
	VRB: string,
	section: Section[],
	area: Section[],
}


/**
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

export default WindDirGauge;