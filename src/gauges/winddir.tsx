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
    //outTempRef: React.RefObject<HTMLInputElement>;
    //inTempRef: React.RefObject<HTMLInputElement>;
    gauge: any;
    params: any;
    style: any;

    constructor(props: Props) {
        super(props);

		this.canvasRef = React.createRef();
		
        this.state = {
			valueLatest: 0,
			valueAverage: 0,
			titles: [this.props.controller.lang.latest_web, this.props.controller.lang.tenminavg_web],
			VRB:'',
			area:[],
			section:[]
            
        }

        this.params = {
            ...this.props.controller.commonParams,
			size: Math.ceil(this.props.size * this.props.controller.config.gaugeScaling),
			lcdtitleStrings: this.state.titles,
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

    _initGauge() {
        if(this.canvasRef.current) {
            this.gauge = new steelseries.WindDirection(this.canvasRef.current, this.params);
			this.gauge.setValueAverage(this.state.valueAverage);
			this.gauge.setValueLatest(this.state.valueLatest)
        }
    }

    update(data: any) {
        let newState: any = {};

		let windSpd, windGst, range, i, 
			rosepoints=0, 
			roseMax=0, 
			roseSectionAngle=0, 
			roseAreas=[];


		newState.valueLatest=DataUtils.extractInteger(data.bearing);
		newState.valueAverage=DataUtils.extractInteger(data.avgbearing);
		newState.bearingFrom=DataUtils.extractInteger(data.BearingRangeFrom10);
		newState.bearingTo=DataUtils.extractInteger(data.BearingRangeTo10);


		if(newState.valueAverage===0){
			newState.valueLatest=0;
		}


		if(this.props.controller.config.showWindVariation){
			windSpd= DataUtils.extractDecimal(data.wspeed);
			windGst= DataUtils.extractDecimal(data.wgust);
			switch(data.windunit.toLowerCase()){
				case 'mph':
					newState.avgKnots = 0.868976242 * windSpd;
					newState.gstKnots = 0.868976242 * windGst;
					break;
				case 'kts':
					newState.avgKnots = windSpd;
					newState.gstKnots = windGst;
					break;
				case 'm/s':
					newState.avgKnots = 1.94384449 * windSpd;
					newState.gstKnots = 1.94384449 * windGst;
					break;
				case 'km/h':
					newState.avgKnots = 0.539956803 * windSpd;
					newState.gstKnots = 0.539956803 * windGst;
					break;
			}

			newState.avgKnots=Math.round(newState.avgKnots);
			newState.gstKnots=Math.round(newState.gstKnots);

			if(this.props.controller.config.showWindMetar){
				newState.VRB = 
					' - METAR: '+ ('0' + data.avgbearing).slice(-3) + 
					('0'+newState.avgKnots).slice(-2) +
					'G'+ ('0' +newState.gstKnots).slice(-2) + 'KT';
			}else{
				newState.VRB='';
			}

			if(windSpd>0){

				range= (newState.bearingTo < newState.bearingFrom ? 360 + (newState.bearingTo) : newState.bearingTo) - (newState.bearingFrom);

				if(newState.avgKnots < 3){
					if(this.props.controller.config.showRoseOnDirGauge){
						newState.section = [steelseries.Section(newState.bearingFrom, newState.bearingTo, this.props.controller.gaugeGlobals.windVariationSector)];
					}else{
						newState.section = [steelseries.Section(newState.bearingFrom, newState.bearingTo, this.props.controller.gaugeGlobals.minMaxArea)];
					}
					newState.area = [];
				}else if (this.props.controller.config.showRoseOnDirGauge){
					newState.section = [steelseries.Section(newState.bearingFrom, newState.bearingTo, this.props.controller.gaugeGlobals.windVariationSector)];
					newState.area = [];
				}else{
					newState.section = [];
					newState.area=[steelseries.Section(newState.bearingFrom, newState.bearingTo, this.props.controller.gaugeGlobals.minMaxArea)];
				}

				if(this.props.controller.config.showWindMetar){
					if((range<60 && range>0) || range===0 && newState.bearingFrom=== newState.valueAverage)
						newState.VRB +=' STDY';
					else if(newState.avgKnots<3){
						newState.VRB+= ' VRB';
					}else{
						newState.VRB+=' '+newState.bearingFrom + 'V' + newState.bearingTo;
					}
				}
			}else{
				if(this.props.controller.config.showWindMetar){
					newState.VRB=' - METAR: 00000KT';
				}
				newState.section = [];
				if(!this.props.controller.config.showRoseOnDirGauge){
					newState.area = [];
				}
			}
		}else{
			newState.VRB='';
		}

		if(this.props.controller.config.showRoseOnDirGauge && data.WindRoseData){
			rosepoints=data.WindRoseData.length;
			roseSectionAngle=360/rosepoints;

			//find total for all directions
			for(i=0;i<rosepoints;i++){
				roseMax=Math.max(roseMax,data.WindRoseData[i]);
			}

			//Check we actually have some data, bad things happen if roseMax=0!
			if(roseMax>0){
				// Find relative value for each point, and create a gauge area for it
				for(i=0; i<rosepoints;i++){
					roseAreas[i]=steelseries.Section(
						i*roseSectionAngle-roseSectionAngle/2,
						(i+1)* roseSectionAngle-roseSectionAngle/2,
						'rgba('+ GaugeUtils.gradient('2020D0', 'D04040', data.WindRoseData[i] / roseMax) + ',' +
						(data.WindRoseData[i]/roseMax).toFixed(2)+')'
					);
				}
			}
			newState.area=roseAreas;
		}


        this.setState(newState);
    }

    componentDidMount() {
        this._initGauge();
    }

    componentDidUpdate(_prevProps: Props, prevState: State) {
        if(prevState.VRB!==this.state.VRB){
			this.gauge.VRB=this.state.VRB;
		}

		if(prevState.area!== this.state.area){
			this.gauge.setArea(this.state.area);
		}

		if(prevState.section!==this.state.section){
			this.gauge.setSection(this.state.section)
		}

        //FIXME setValueAnimated() from steelseries lib not working!
		//this.gauge.setValueAnimated(this.state.value);
		this.gauge.setValueLatest(this.state.valueLatest);
        this.gauge.setValueAverage(this.state.valueAverage);
    }

    render() {
        return <div className={styles.gauge}>
			<canvas 
				ref={this.canvasRef}
				width={this.params.size}
				height={this.params.size}
				style={this.style}
			></canvas>
        </div>
    }
}

interface Props {
    controller: GaugesController,
    size: number
}

interface State {

	valueLatest: number,
	valueAverage: number,
	titles: [String, String],
	VRB: String,
	section:[],
	area:[],

}

export default WindDirGauge;