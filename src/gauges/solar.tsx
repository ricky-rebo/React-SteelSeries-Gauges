import React, { Component } from 'react';
import GaugeUtils from '../utils/gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import DataUtils from '../utils/data-utils';
import GaugesController from '../gauges-controller';
import styles from '../style/common.css';

//TODO docs
class SolarGauge extends Component<Props, State> {
    static NAME = "SOLAR_GAUGE";

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
			value:  0.0001,
            sections: [
				steelseries.Section(0, 600, 'rgba(40,149,0,0.3)'),
                steelseries.Section(600, 800, 'rgba(248,89,0,0.3)'),
                steelseries.Section(800, 1000, 'rgba(216,0,29,0.3)'),
                steelseries.Section(1000, 1800, 'rgba(107,73,200,0.3)')
			],
			
			maxValue:  this.props.controller.gaugeGlobals.solarGaugeScaleMax,
			maxToday: 0,

			area: [],

			ledState : false,
            //popUpTxt: '',
            //popUpGraph: '',
            
        }

        this.params = {
            ...this.props.controller.commonParams,
			size: Math.ceil(this.props.size * this.props.controller.config.gaugeScaling),
			section: this.state.sections,
			maxValue: this.state.maxValue,
			titleString: this.props.controller.lang.solar_title,
			niceScale: false,
			unitString: 'W/m\u00B2',
			thresholdVisible: false,
			lcdDecimals: 0,
			userLedVisible : this.props.controller.config.showSunshineLed,
			userLedColor : steelseries.LedColor.YELLOW_LED
		};

        this.style = this.props.controller.config.showGaugeShadow
            ? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeGlobals.shadowColour)
            : {};

        this.update = this.update.bind(this);

        this.props.controller.subscribe(SolarGauge.NAME, this.update);
    }

    _initGauge() {
        if(this.canvasRef.current) {
            this.gauge = new steelseries.Radial(this.canvasRef.current, this.params);
			this.gauge.setValue(this.state.value);
        }
    }

    update(data: any) {
        let newState: any = {};

		newState.value = +DataUtils.extractInteger(data.SolarRad);
		newState.maxToday = +DataUtils.extractInteger(data.SolarTM);
		newState.currMaxValue = +DataUtils.extractInteger(data.CurrentSolarMax);

		newState.maxValue = Math.max(newState.value, newState.currMaxValue, newState.maxToday, this.props.controller.gaugeGlobals.solarGaugeScaleMax);
		newState.maxValue = DataUtils.nextHighest(newState.maxValue, 100);


		let sunshineThresholdPct = this.props.controller.gaugeGlobals.sunshineThresholdPct;
		let sunshineThreshold = this.props.controller.gaugeGlobals.sunshineThreshold;

		if(data.CurrentSolarMax!== 'N/A'){
			newState.area=[
				// Sunshine threshold
				steelseries.Section(
					Math.max(newState.currMaxValue * sunshineThresholdPct / 100, sunshineThreshold),
					newState.currMaxValue,
					'rgba(255,255,50,0.4)'
				),
				// Over max threshold
				steelseries.Section(
					newState.currMaxValue,
					Math.min(newState.currMaxValue + newState.maxValue * 0.15,newState.maxValue),
					'rgba(220,0,0,0.5)'
				)
			]
		}

		let percent = ( +newState.currMaxValue === 0 ? '--' : Math.round( +newState.value / +newState.currMaxValue * 100 ));
		console.log("prova");
		if(this.params.userLedVisible){
			newState.ledState = (percent !== '--') && (percent >= sunshineThresholdPct) && (newState.value >= sunshineThreshold);
		}

        this.setState(newState);
    }

    componentDidMount() {
        this._initGauge();
    }

    componentDidUpdate(_prevProps: Props, prevState: State) {
        if(prevState.maxValue !== this.state.maxValue) {
            this.gauge.setMaxValue(this.state.maxValue)
		}
		
		if(prevState.area !== this.state.area){
			this.gauge.setArea(this.state.area);
		}

		if(prevState.ledState !== this.state.ledState){
			this.gauge.setUserLedOnOff(this.state.ledState);
		}
		

        //FIXME setValueAnimated() from steelseries lib not working!
		//this.gauge.setValueAnimated(this.state.value);
		this.gauge.setMaxMeasuredValue(this.state.maxToday);
        this.gauge.setValue(this.state.value);
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

	value: number,
    sections: any[],

	maxValue: number,
	maxToday: number,
	area: [],

	ledState: boolean,
}

export default SolarGauge;