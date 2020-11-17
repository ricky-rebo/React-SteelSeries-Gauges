import React, { Component } from 'react';
import GaugeUtils from '../utils/gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import DataUtils from '../utils/data-utils';
import GaugesController from '../gauges-controller';
import styles from '../style/common.css';


//TODO docs
class HumGauge extends Component<Props, State> {
    static NAME = "HUM_GAUGE";

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
            areas: [],
            title: this.props.controller.lang.hum_title_out,
            value: 0.0001,

            //popUpTxt: '',
			//popUpGraph: '',
			
            selected: 'out'
        }

        this.params = {
            ...this.props.controller.commonParams,
            size: Math.ceil(this.props.size * this.props.controller.config.gaugeScaling),
            section: [
				steelseries.Section(0, 20, 'rgba(255,255,0,0.3)'),
				steelseries.Section(20, 80, 'rgba(0,255,0,0.3)'),
				steelseries.Section(80, 100, 'rgba(255,0,0,0.3)')
			],
            area: [],
            maxValue: 100,
            thresholdVisible: false,
			titleString: this.state.title,
            unitString: this.props.controller.data.humUnit,
        };

        this.style = this.props.controller.config.showGaugeShadow
            ? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeGlobals.shadowColour)
            : {};

        this.update = this.update.bind(this);

        this.props.controller.subscribe(HumGauge.NAME, this.update);
    }

    _initGauge() {
        if(this.canvasRef.current) {
            this.gauge = new steelseries.Radial(this.canvasRef.current, this.params);
            this.gauge.setValue(this.state.value);
        }
    }

    update(data: any, sel?: string) {
        let newState = {...this.state};

        if(sel) newState.selected = sel;
        //TODO set cookie sel

        
        if(newState.selected === 'out') {
			newState.value = DataUtils.extractDecimal(data.hum);
			
            newState.title = this.props.controller.lang.hum_title_out;
			newState.areas = [
				steelseries.Section(
					+DataUtils.extractDecimal(data.humTL), 
					+DataUtils.extractDecimal(data.humTH), 
					this.props.controller.gaugeGlobals.minMaxArea
				)
			];
			//cache.popupImg = 0;

        }
        else {
            //Indoor selected
            newState.title = this.props.controller.lang.hum_title_in;
            newState.value = DataUtils.extractDecimal(data.inHum);
            //cache.popupImg = 1;
            if (data.intempTL && data.intempTH) {
				// Indoor - and Max/Min values supplied
				newState.areas=[
					steelseries.Section(
						+DataUtils.extractDecimal(data.inhumTL), 
						+DataUtils.extractDecimal(data.inhumTH), 
						this.props.controller.gaugeGlobals.minMaxArea
					)
				];
            } else {
                // Indoor - no Max/Min values supplied
                newState.areas=[];
            }
        }

        // has the gauge type changed?
        if(newState.selected !== this.state.selected) {
            //TODO change title and setMin/MaxMeasuredValueVisible of gauge
            //Here or in componentDidUpdate? And How?
		}
		
        this.setState(newState);
    }

    componentDidMount() {
        this._initGauge();
    }

    componentDidUpdate(_prevProps: Props, prevState: State) {
        if(prevState.selected !== this.state.selected) {
            this.gauge.setTitleString(this.state.title);
        }

        this.gauge.setArea(this.state.areas);
        //FIXME setValueAnimated() from steelseries lib not working!
        //this.gauge.setValueAnimated(this.state.value);
		this.gauge.setValue(this.state.value);
    }

    render() {
        return <div className={styles.gauge}>
            <div id="tip_4">
                <canvas 
                    ref={this.canvasRef}
                    width={this.params.size}
                    height={this.params.size}
                    style={this.style}
                ></canvas>
				
            </div>
			//TODO add radiobox
        </div>
    }
}

interface Props {
    controller: GaugesController,
    size: number
}

interface State {
    selected: string,

    value: number,
    title: string,
    //popUpTxt: string,
    areas: any[],
}

export default HumGauge;