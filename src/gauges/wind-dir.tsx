import React, { Component } from 'react';
import GaugeUtils from '../utils/gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import DataUtils from '../utils/data-utils';
import GaugesController from '../gauges-controller';
import styles from '../style/common.css';

//TODO docs
class WindDirGauge extends Component<Props, State> {
	static NAME = "WINDDIR_GAUGE";
	
	canvasRef: React.RefObject<HTMLCanvasElement>;
	gauge: any;
	params: any;
	style: any;

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
				size: Math.ceil(this.props.size * this.props.controller.config.gaugeScaling),
				lcdtitleStrings: [this.props.controller.lang.latest_web, this.props.controller.lang.tenminavg_web],
				pointerTypeLatest: this.props.controller.gaugeGlobals.pointer, 
				pointerTypeAverage:this.props.controller.gaugeGlobals.dirAvgPointer,
				pointerColorAverage:this.props.controller.gaugeGlobals.dirAvgPointerColor,
				degreeScale: true,
				pointSymbols: this.props.controller.lang.compass,
				roseVisible: false,
				useColorLabels: false, 
			};

			this.style = this.props.controller.config.showGaugeShadow
				? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeGlobals.shadowColour)
				: {};

			this.update = this.update.bind(this);

			this.props.controller.subscribe(WindDirGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new steelseries.WindDirection(this.canvasRef.current, this.params);
			this.gauge.setValueAverage(this.state.valueAverage);
			this.gauge.setValueLatest(this.state.valueLatest)
		}
	}

	async update({ bearing, avgbearing, BearingRangeFrom10, BearingRangeTo10, wspeed, wgust, windunit, WindRoseData }: DataParamDef) {
		let newState: any = {};

		newState.valueLatest = DataUtils.extractInteger(bearing);
		newState.valueAverage = DataUtils.extractInteger(avgbearing);
		let bearingFrom = DataUtils.extractInteger(BearingRangeFrom10);
		let bearingTo = DataUtils.extractInteger(BearingRangeTo10);

		if(newState.valueAverage === 0) {
			newState.valueLatest = 0;
		}

		if(this.props.controller.config.showWindVariation) {
			let windSpd = DataUtils.extractDecimal(wspeed);
			let windGst = DataUtils.extractDecimal(wgust);
			let avgKnots: number, gstKnots: number;
			switch(windunit.toLowerCase()){
				case 'mph':
					avgKnots = 0.868976242 * windSpd;
					gstKnots = 0.868976242 * windGst;
					break;
				case 'kts':
					avgKnots = windSpd;
					gstKnots = windGst;
					break;
				case 'm/s':
					avgKnots = 1.94384449 * windSpd;
					gstKnots = 1.94384449 * windGst;
					break;
				case 'km/h':
					avgKnots = 0.539956803 * windSpd;
					gstKnots = 0.539956803 * windGst;
					break;
				default:
					avgKnots = 0;
					gstKnots = 0;
			}

			avgKnots = Math.round(avgKnots);
			gstKnots = Math.round(gstKnots);

			if(this.props.controller.config.showWindMetar) {
				newState.VRB = ` - METAR: ${('0'+avgbearing).slice(-3)}${('0' + avgKnots).slice(-2)}G${('0' + gstKnots).slice(-2)}KT`;
			}
			else{
				newState.VRB = '';
			}

			if(windSpd > 0) {
				//FIXME code redundancy?
				if(avgKnots < 3) { // Europe uses 3kts, USA 6kts as the threshold
					if(this.props.controller.config.showRoseOnDirGauge) {
						newState.section = [steelseries.Section(bearingFrom, bearingTo, this.props.controller.gaugeGlobals.windVariationSector)];
					}
					else {
						newState.area = [steelseries.Section(bearingFrom, bearingTo, this.props.controller.gaugeGlobals.minMaxArea)];
					}
				}
				else if (this.props.controller.config.showRoseOnDirGauge) {
					newState.section = [steelseries.Section(bearingFrom, bearingTo, this.props.controller.gaugeGlobals.windVariationSector)];
				}
				else {
					newState.area = [steelseries.Section(bearingFrom, bearingTo, this.props.controller.gaugeGlobals.minMaxArea)];
				}

				let range = (bearingTo < bearingFrom ? (360 + bearingTo) : bearingTo) - (bearingFrom);
				if(this.props.controller.config.showWindMetar) {
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
				if(this.props.controller.config.showWindMetar){
					newState.VRB=' - METAR: 00000KT';
				}
				
				newState.section = [];
				if(!this.props.controller.config.showRoseOnDirGauge) {
					newState.area = [];
				}
			}
		}
		else {
			newState.VRB = '';
		}

		if(this.props.controller.config.showRoseOnDirGauge && WindRoseData){
			let rosepoints = WindRoseData.length;
			let roseSectionAngle=360/rosepoints;
			let roseAreas = [];

			//find total for all directions
			let roseMax = Math.max(...WindRoseData);
			
			//Check we actually have some data, bad things happen if roseMax=0!
			if(roseMax > 0) {
				// Find relative value for each point, and create a gauge area for it
				for(let i = 0; i < rosepoints; i++) {
					roseAreas[i] = steelseries.Section(
						i*roseSectionAngle - roseSectionAngle/2,
						(i+1) * roseSectionAngle - roseSectionAngle/2,
						`rgba(${GaugeUtils.gradient('2020D0', 'D04040', WindRoseData[i] / roseMax)},${(WindRoseData[i] / roseMax).toFixed(2)})`
					);
				}
			}
			newState.area = roseAreas;
		}

		this.setState(newState);
	}

	componentDidUpdate() {
		this.gauge.setArea(this.state.area);
		this.gauge.setSection(this.state.section)

		//FIXME setValueAnimated() from steelseries lib not working!
		//this.gauge.setValueLatestAnimated(this.state.valueLatest);
		//this.gauge.setValueAverageAnimated(this.state.valueAverage);
		this.gauge.setValueLatest(this.state.valueLatest);
		this.gauge.setValueAverage(this.state.valueAverage);
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
	valueLatest: number,
	valueAverage: number,
	VRB: string,
	section:[],
	area:[],
}

type DataParamDef = { 
	bearing: any,
	avgbearing: any,
	BearingRangeFrom10: any,
	BearingRangeTo10: any,
	wspeed: any,
	wgust: any,
	windunit: string,
	WindRoseData: any[]
};

export default WindDirGauge;