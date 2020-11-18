import React, { Component } from 'react';
import GaugeUtils from '../utils/gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import DataUtils from '../utils/data-utils';
import GaugesController from '../gauges-controller';
import styles from '../style/common.css';

//TODO docs
class WindSpeedGauge extends Component<Props, State> {
    static NAME = "WINDSPEED_GAUGE";

    canvasRef: React.RefObject<HTMLCanvasElement>;
    gauge: any;
    params: any;
    style: any;

    constructor(props: Props) {
        super(props);

		this.canvasRef = React.createRef();
		
        this.state = {
			value:  0.0001,
			maxValue:  this.props.controller.gaugeGlobals.windScaleDefMaxKph,
			area: [],
			//maxMeasured: 0,
			maxGustToday:0,
			title: this.props.controller.lang.wind_title,

        }

        this.params = {
            ...this.props.controller.commonParams,
			size: Math.ceil(this.props.size * this.props.controller.config.gaugeScaling),
			maxValue: this.state.maxValue,
			niceScale: false,
			area: this.state.area,
			maxMeasuredValueVisible: true,
			titleString: this.state.title,
			unitString: this.props.controller.data.windunit,
			thresholdVisible: false,

        };

        this.style = this.props.controller.config.showGaugeShadow
            ? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeGlobals.shadowColour)
            : {};

        this.update = this.update.bind(this);

        this.props.controller.subscribe(WindSpeedGauge.NAME, this.update);
    }

    _initGauge() {
        if(this.canvasRef.current) {
            this.gauge = new steelseries.Radial(this.canvasRef.current, this.params);
			this.gauge.setValue(this.state.value);
        }
    }

    update(data: any) {
        let newState: any = {};

		newState.value= DataUtils.extractDecimal(data.wlatest);
		newState.average= DataUtils.extractDecimal(data.wspeed);
		newState.gust=DataUtils.extractDecimal(data.wgust);
		newState.maxGustToday= DataUtils.extractDecimal(data.wgustTM);
		newState.maxAvgToday=DataUtils.extractDecimal(data.windTM);


		switch (this.props.controller.data.windunit) {
			case 'mph':
			case 'kts':
				newState.maxValue = Math.max(DataUtils.nextHighest(newState.maxGustToday, 10), this.props.controller.gaugeGlobals.windScaleDefMaxMph);
				break;
			case 'm/s':
				newState.maxValue = Math.max(DataUtils.nextHighest(newState.maxGustToday, 5), this.props.controller.gaugeGlobals.windScaleDefMaxMs);
				break;
			default:
				newState.maxValue = Math.max(DataUtils.nextHighest(newState.maxGustToday, 20), this.props.controller.gaugeGlobals.windScaleDefMaxKmh);
		}

		newState.area=[
			steelseries.Section(0, +newState.average, this.props.controller.gaugeGlobals.windAvgArea),
            steelseries.Section(+newState.average, +newState.gust, this.props.controller.gaugeGlobals.minMaxArea)
		];

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

        //FIXME setValueAnimated() from steelseries lib not working!
		//this.gauge.setValueAnimated(this.state.value);
		this.gauge.setMaxMeasuredValue(this.state.maxGustToday)
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
    area: [],
	maxValue: number,
	//maxMeasured: number,
	maxGustToday:number,
	title: string
    //popUpTxt: string,
}

export default WindSpeedGauge;