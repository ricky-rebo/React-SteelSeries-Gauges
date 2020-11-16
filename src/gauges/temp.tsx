import React, { Component } from 'react';
import PropTypes from 'prop-types';
import GaugeUtils from '../utils/gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import DataUtils from '../utils/data-utils';


class TempGauge extends Component<Props, State> {
    static propTypes: { controller: PropTypes.Validator<any>; size: PropTypes.Validator<number>; };
    static NAME: string;

    canvasRef: React.RefObject<HTMLCanvasElement>;
    //outTempRef: React.RefObject<HTMLInputElement>;
    //inTempRef: React.RefObject<HTMLInputElement>;
    gauge: any;
    params: any;
    style: any;

    constructor(props: any) {
        super(props);

        this.canvasRef = React.createRef();
        let { temp } = this.props.controller.getDisplayUnits();
        this.state = {
            sections: GaugeUtils.createTempSections(true),
            areas: [],
            minValue: this.props.controller.gaugeGlobals.tempScaleDefMinC,
            maxValue: this.props.controller.gaugeGlobals.tempScaleDefMaxC,
            title: this.props.controller.lang.temp_title_out,
            displayUnit: temp,
            value: this.props.controller.gaugeGlobals.tempScaleDefMinC + 0.0001,
            maxMinVisible: false,

            trend: null,
            popUpTxt: '',
            //popUpGraph: '',
            
            selected: 'out'
        }

        this.params = {
            ...this.props.controller.commonParams,
            size: Math.ceil(this.props.size * this.props.controller.config.gaugeScaling),
            section: this.state.sections,
            area: [],
            minValue: this.state.minValue,
            maxValue: this.state.maxValue,
            thresholdVisible: false,
            minMeasuredValueVisible: this.state.maxMinVisible,
            maxMeasuredValueVisible: this.state.maxMinVisible,
            titleString: this.state.title,
            //FIXME fix unit from data!
            unitString: this.props.controller.data.tempunit,
            trendVisible: this.props.controller.gaugeGlobals.tempTrendVisible
        };

        this.style = this.props.controller.config.showGaugeShadow
            ? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeGlobals.shadowColour)
            : {};

        this.update = this.update.bind(this);

        this.props.controller.subscribe(TempGauge.NAME, this.update);
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

        newState.minValue = this.state.displayUnit === 'C'
            ? this.props.controller.gaugeGlobals.tempScaleDefMinC
            : this.props.controller.gaugeGlobals.tempScaleDefMinF;
        newState.maxValue = this.state.displayUnit === 'C'
            ? this.props.controller.gaugeGlobals.tempScaleDefMaxC
            : this.props.controller.gaugeGlobals.tempScaleDefMaxF;
        
        let low: number, high: number,
            lowScale: number, highScale: number,
            trendVal: number/*, loc: string;*/
        if(newState.selected === 'out') {
            low = DataUtils.extractDecimal(data.tempTL);
            high = DataUtils.extractDecimal(data.tempTH);
            lowScale = DataUtils.getMinTemp(newState.minValue, data);
            highScale = DataUtils.getMaxTemp(newState.maxValue, data);
            newState.value = DataUtils.extractDecimal(data.temp);
            newState.title = this.props.controller.lang.temp_title_out;
            //loc = this.props.controller.lang.temp_out_info;
            trendVal = DataUtils.extractDecimal(data.temptrend);

            if(this.params.trendVisible) {
                let t1 = DataUtils.tempTrend(+trendVal, data.tempunit, false);
                if (t1 === -9999) newState.trend = steelseries.TrendState.OFF;
                else if (t1 > 0)  newState.trend = steelseries.TrendState.UP;
                else if (t1 < 0)  newState.trend = steelseries.TrendState.DOWN;
                else              newState.trend = steelseries.TrendState.STEADY;
            }
        }
        else {
            //Indoor selected
            newState.title = this.props.controller.lang.temp_title_in;
            //loc = this.props.controller.lang.temp_in_info;
            newState.value = DataUtils.extractDecimal(data.intemp);
            //cache.popupImg = 1;
            if (data.intempTL && data.intempTH) {
                // Indoor - and Max/Min values supplied
                low = DataUtils.extractDecimal(data.intempTL);
                high = DataUtils.extractDecimal(data.intempTH);
                lowScale = DataUtils.getMinTemp(newState.minValue, data);
                highScale = DataUtils.getMaxTemp(newState.maxValue, data);
            } else {
                // Indoor - no Max/Min values supplied
                low = lowScale = high = highScale = newState.value;
            }
            if (this.params.trendVisible) {
                newState.trend = steelseries.TrendState.OFF;
            }
        }

        // has the gauge type changed?
        if(newState.selected !== this.state.selected) {
            //TODO change title and setMin/MaxMeasuredValueVisible of gauge
            //Here or in componentDidUpdate? And How?
        }

        // auto scale the ranges
        let scaleStep = data.tempunit[1] === 'C' ? 10 : 20;
        while (lowScale < newState.minValue) {
            newState.minValue -= scaleStep;
            if (highScale <= newState.maxValue - scaleStep) {
                newState.maxValue -= scaleStep;
            }
        }
        while (highScale > newState.maxValue) {
            newState.maxValue += scaleStep;
            if (newState.minValue >= newState.minValue + scaleStep) {
                newState.minValue += scaleStep;
            }
        }

        if (newState.selected === 'out') {
            newState.areas = [steelseries.Section(low, high, this.props.controller.gaugeGlobals.minMaxArea)];
        } else if (data.intempTL && data.intempTH) {
            // Indoor and min/max avaiable
            newState.areas = [steelseries.Section(low, high, this.props.controller.gaugeGlobals.minMaxArea)];
        } else {
            // Nndoor no min/max avaiable
            newState.areas = [];
        }

        this.setState(newState);
    }

    componentDidMount() {
        this._initGauge();
    }

    componentDidUpdate(_prevProps: Props, prevState: State) {
        if(prevState.selected !== this.state.selected) {
            this.gauge.setTitleString(this.state.title);
            this.gauge.setMaxMeasuredValueVisible(this.state.maxMinVisible);
            this.gauge.setMinMeasuredValueVisible(this.state.maxMinVisible);
        }

        if (this.state.minValue !== this.gauge.getMinValue() || this.state.maxValue !== this.gauge.getMaxValue()) {
            this.gauge.setMinValue(this.state.minValue);
            this.gauge.setMaxValue(this.state.maxValue);
            this.gauge.setValue(this.state.minValue);
        }

        if (this.params.trendVisible) {
            this.gauge.setTrend(this.state.trend);
        }

        this.gauge.setArea(this.state.areas);
        //FIXME setValueAnimated() from steelseries lib not working!
        //this.gauge.setValueAnimated(this.state.value);
        this.gauge.setValue(this.state.value);
        //console.log("Value: " + this.state.value)
        //console.log("Gauge Value: " + this.gauge.getValue());
    }

    render() {
        return <div className="gauge">
            <div id="tip_0">
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
    controller: any,
    size: number
}

interface State {
    sections: any[],
    
    displayUnit: string,
    maxMinVisible: boolean,
    selected: string,

    value: number,
    minValue: number,
    maxValue: number,
    trend: any,
    title: string,
    popUpTxt: string,
    areas: any[],
}


TempGauge.NAME = "TEMP_GAUGE";

TempGauge.propTypes = {
    controller: PropTypes.any.isRequired,
    size: PropTypes.number.isRequired
}

export default TempGauge;