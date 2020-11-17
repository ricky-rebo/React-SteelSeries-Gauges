import React, { Component } from 'react';
import GaugeUtils from '../utils/gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import DataUtils from '../utils/data-utils';
import GaugesController from '../gauges-controller';
import styles from '../style/common.css';

//TODO docs
class DewGauge extends Component<Props, State> {
    static NAME = "DEW_GAUGE";

    canvasRef: React.RefObject<HTMLCanvasElement>;
    //outTempRef: React.RefObject<HTMLInputElement>;
    //inTempRef: React.RefObject<HTMLInputElement>;
    gauge: any;
    params: any;
    style: any;

    constructor(props: Props) {
        super(props);

        this.canvasRef = React.createRef();

        //TODO get selected radio from cookie, if null get from config
        let sel = props.controller.config.dewDisplayType;
        
        let title;
        switch (sel) {
          case 'dew': title = props.controller.lang.dew_title; break;
          case 'app': title = props.controller.lang.apptemp_title; break;
          case 'wnd': title = props.controller.lang.chill_title; break;
          case 'hea': title = props.controller.lang.heat_title; break;
          case 'hum': title = props.controller.lang.humdx_title;
          // no default
        }

        this.state = {
            sections: GaugeUtils.createTempSections(true),
            areas: [],
            minValue: this.props.controller.gaugeGlobals.tempScaleDefMinC,
            maxValue: this.props.controller.gaugeGlobals.tempScaleDefMaxC,
            displayUnit: this.props.controller.getDisplayUnits().temp,
            value: this.props.controller.gaugeGlobals.tempScaleDefMinC + 0.0001,
            low: this.props.controller.gaugeGlobals.tempScaleDefMinC + 0.0001,
            high: this.props.controller.gaugeGlobals.tempScaleDefMinC + 0.0001,
            minMeasuredVisible: false,
            maxMeasuredVisible: false,
            title: title,

            trend: null,
            popUpTxt: '',
            //graph: '',
            
            selected: sel
        }

        this.params = {
          ...this.props.controller.commonParams,
          size: Math.ceil(this.props.size * this.props.controller.config.gaugeScaling),
          section: this.state.sections,
          area: this.state.areas,
          minValue: this.state.minValue,
          maxValue: this.state.maxValue,
          thresholdVisible: false,
          titleString: this.state.title,
          //FIXME fix unit from data!
          unitString: this.props.controller.data.tempunit
        };

        this.style = this.props.controller.config.showGaugeShadow
          ? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeGlobals.shadowColour)
          : {};

        this.update = this.update.bind(this);

        this.props.controller.subscribe(DewGauge.NAME, this.update);
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
        //TODO save cookie of sel

        newState.minValue = this.state.displayUnit === 'C'
            ? this.props.controller.gaugeGlobals.tempScaleDefMinC
            : this.props.controller.gaugeGlobals.tempScaleDefMinF;
        newState.maxValue = this.state.displayUnit === 'C'
            ? this.props.controller.gaugeGlobals.tempScaleDefMaxC
            : this.props.controller.gaugeGlobals.tempScaleDefMaxF;
        
        let lowScale = DataUtils.getMinTemp(newState.minValue, data),
            highScale = DataUtils.getMaxTemp(newState.maxValue, data);
        switch (newState.selected) {
          case 'dew': // dew point
            newState.low = DataUtils.extractDecimal(data.dewpointTL);
            newState.high = DataUtils.extractDecimal(data.dewpointTH);
            newState.value = DataUtils.extractDecimal(data.dew);
            newState.areas = [steelseries.Section(newState.low, newState.high, this.props.controller.gaugeGlobals.minMaxArea)];
            newState.title = this.props.controller.lang.dew_title;
            newState.minMeasuredVisible = false;
            newState.maxMeasuredVisible = false;
            //cache.popupImg = 0;
            /*tip = strings.dew_info + ':' +
                  '<br>' +
                  '- ' + strings.lowest_info + ': ' + cache.low + data.tempunit + ' ' + strings.at + ' ' + data.TdewpointTL +
                  ' | ' + strings.highest_info + ': ' + cache.high + data.tempunit + ' ' + strings.at + ' ' + data.TdewpointTH;
            */
            break;
          case 'app': // apparent temperature
            newState.low = DataUtils.extractDecimal(data.apptempTL);
            newState.high = DataUtils.extractDecimal(data.apptempTH);
            newState.value = DataUtils.extractDecimal(data.apptemp);
            newState.areas = [steelseries.Section(newState.low, newState.high, this.props.controller.gaugeGlobals.minMaxArea)];
            newState.title = this.props.controller.lang.apptemp_title;
            newState.minMeasuredVisible = false;
            newState.maxMeasuredVisible = false;
            //cache.popupImg = 1;
            /*tip = tip = strings.apptemp_info + ':' +
                  '<br>' +
                  '- ' + strings.lowestF_info + ': ' + cache.low + data.tempunit + ' ' + strings.at + ' ' + data.TapptempTL +
                  ' | ' + strings.highestF_info + ': ' + cache.high + data.tempunit + ' ' + strings.at + ' ' + data.TapptempTH;
            */
            break;
          case 'wnd': // wind chill
            newState.low = DataUtils.extractDecimal(data.wchillTL);
            newState.high = DataUtils.extractDecimal(data.wchill);
            newState.value = DataUtils.extractDecimal(data.wchill);
            newState.areas = [];
            newState.title = this.props.controller.lang.chill_title;
            newState.minMeasuredVisible = true;
            newState.maxMeasuredVisible = false;
            //cache.popupImg = 2;
            //tip = strings.chill_info + ':' +
            //    '<br>' +
            //    '- ' + strings.lowest_info + ': ' + cache.low + data.tempunit + ' ' + strings.at + ' ' + data.TwchillTL;
            break;
          case 'hea': // heat index
            newState.low = DataUtils.extractDecimal(data.heatindex);
            newState.high = DataUtils.extractDecimal(data.heatindexTH);
            newState.value = DataUtils.extractDecimal(data.heatindex);
            newState.areas = [];
            newState.title = this.props.controller.lang.heat_title;
            newState.minMeasuredVisible = false;
            newState.maxMeasuredVisible = true;
            //cache.popupImg = 3;
            //tip = strings.heat_info + ':' +
            //    '<br>' +
            //    '- ' + strings.highest_info + ': ' + cache.high + data.tempunit + ' ' + strings.at + ' ' + data.TheatindexTH;
            break;
          case 'hum': // humidex
            newState.low = DataUtils.extractDecimal(data.humidex);
            newState.high = DataUtils.extractDecimal(data.humidex);
            newState.value = DataUtils.extractDecimal(data.humidex);
            newState.areas = [];
            newState.title = this.props.controller.lang.humdx_title;
            newState.minMeasuredVisible = false;
            newState.maxMeasuredVisible = false;
            //cache.popupImg = 4;
            //tip = strings.humdx_info + ': ' + cache.value + data.tempunit;
            break;
          // no default
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

        this.setState(newState);
    }

    componentDidMount() {
        this._initGauge();
    }

    componentDidUpdate(_prevProps: Props, prevState: State) {
      if (this.state.selected !== prevState.selected) {
        // change gauge title
        this.gauge.setTitleString(this.state.title);

        //TODO change shown graph
      }

      if (this.state.minValue !== this.gauge.getMinValue() || this.state.maxValue !== this.gauge.getMaxValue()) {
        this.gauge.setMinValue(this.state.minValue);
        this.gauge.setMaxValue(this.state.maxValue);
        this.gauge.setValue(this.state.minValue);
      }

      this.gauge.setMinMeasuredValueVisible(this.state.minMeasuredVisible);
      this.gauge.setMaxMeasuredValueVisible(this.state.maxMeasuredVisible);
      this.gauge.setMinMeasuredValue(this.state.low);
      this.gauge.setMaxMeasuredValue(this.state.high);
      this.gauge.setArea(this.state.areas);
      //FIXME Tween.js anmationa in steelseries lib not workig 
      //this.gauge.setValueAnimated(this.state.value);
      this.gauge.setValue(this.state.value);

      //TODO set popup text
    }

    render() {
        return <div className={styles.gauge}>
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
    controller: GaugesController,
    size: number
}

interface State {
    sections: any[],
    
    displayUnit: string,
    minMeasuredVisible: boolean,
    maxMeasuredVisible: boolean,
    selected: string,

    value: number,
    low: number,
    high: number,
    minValue: number,
    maxValue: number,
    trend: any,
    title: string,
    popUpTxt: string,
    areas: any[],
}

export default DewGauge;