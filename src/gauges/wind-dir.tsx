import React, { Component } from 'react';
// @ts-ignore
import { WindDirection, Section } from "steelseries";
import styles from '../style/common.css';
import { gaugeShadow, gradient } from './gauge-utils.js';
import { RtData } from '../controller/data-types.js';
import { Props } from './data-types';

//TODO docs
class WindDirGauge extends Component<Props, State> {
	static NAME = "WINDDIR_GAUGE";
	
	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: any;
	params: any;
	style: React.CSSProperties;

	constructor(props: Props) {
		super(props);

		this.canvasRef = React.createRef();
	
		this.state = {
			valueLatest: 0,
			valueAverage: 0,
			VRB:'',
			area:[],
			section:[]
		};

		this.params = {
			...this.props.controller.commonParams,
			size: Math.ceil(this.props.size * this.props.controller.gaugeConfig.gaugeScaling),
			lcdtitleStrings: [this.props.controller.lang.latest_web, this.props.controller.lang.tenminavg_web],
			pointerTypeLatest: this.props.controller.gaugeConfig.pointer, 
			pointerTypeAverage:this.props.controller.gaugeConfig.dirAvgPointer,
			pointerColorAverage:this.props.controller.gaugeConfig.dirAvgPointerColor,
			degreeScale: true,
			pointSymbols: this.props.controller.lang.compass,
			roseVisible: false,
			useColorLabels: false, 
		};

		this.style = this.props.controller.gaugeConfig.showGaugeShadow
			? gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(WindDirGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new WindDirection(this.canvasRef.current, this.params);
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

		if(this.props.controller.gaugeConfig.showWindVariation) {
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

			if(this.props.controller.gaugeConfig.showWindMetar) {
				newState.VRB = ` - METAR: ${('0'+avgbearing).slice(-3)}${('0' + avgKnots).slice(-2)}G${('0' + gstKnots).slice(-2)}KT`;
			}
			else{
				newState.VRB = '';
			}

			if(windSpd > 0) {
				//FIXME code redundancy?
				if(avgKnots < 3) { // Europe uses 3kts, USA 6kts as the threshold
					if(this.props.controller.gaugeConfig.showRoseOnDirGauge) {
						newState.section = [Section(bearingFrom, bearingTo, this.props.controller.gaugeConfig.windVariationSector)];
					}
					else {
						newState.area = [Section(bearingFrom, bearingTo, this.props.controller.gaugeConfig.minMaxArea)];
					}
				}
				else if (this.props.controller.gaugeConfig.showRoseOnDirGauge) {
					newState.section = [Section(bearingFrom, bearingTo, this.props.controller.gaugeConfig.windVariationSector)];
				}
				else {
					newState.area = [Section(bearingFrom, bearingTo, this.props.controller.gaugeConfig.minMaxArea)];
				}

				let range = (bearingTo < bearingFrom ? (360 + bearingTo) : bearingTo) - (bearingFrom);
				if(this.props.controller.gaugeConfig.showWindMetar) {
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
				if(this.props.controller.gaugeConfig.showWindMetar){
					newState.VRB = ' - METAR: 00000KT';
				}
				
				newState.section = [];
				if(!this.props.controller.gaugeConfig.showRoseOnDirGauge) {
					newState.area = [];
				}
			}
		}
		else {
			newState.VRB = '';
		}

		if(this.props.controller.gaugeConfig.showRoseOnDirGauge && WindRoseData){
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
		if(this.props.controller.gaugeConfig.showRoseOnDirGauge) {
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
					width={this.params.size}
					height={this.params.size}
					style={this.style}
				></canvas>
			</div>
		);
	}
}

interface State {
	valueLatest: number,
	valueAverage: number,
	VRB: string,
	section:[],
	area:[],
}

export default WindDirGauge;