import React, { Component } from 'react';

// @ts-ignore
import steelseries from '../libs/steelseries.js';

import GaugeUtils from '../utils/gauge-utils';
import DataUtils from '../utils/data-utils';
import GaugesController from '../gauges-controller';
import styles from '../style/common.css';

//TODO docs
class RainRateGauge extends Component<Props, State> {
    static NAME = "RAINRATE_GAUGE";

    canvasRef: React.RefObject<HTMLCanvasElement>;
    gauge: any;
    params: any;
    style: any;

    constructor(props: Props) {
        super(props);

        this.canvasRef = React.createRef();

        this.state = {
          maxMeasured: 0,
          maxValue: props.controller.gaugeGlobals.rainRateScaleDefMaxmm,
          value: 0.0001,
          scaleDecimals: 1
          
          //popUpTxt: '',
          //graph: '',
        }

        this.params = {
          ...this.props.controller.commonParams,
          size: Math.ceil(this.props.size * this.props.controller.config.gaugeScaling),
          section: GaugeUtils.createRainRateSections(true),
          maxValue: this.state.maxValue,
          thresholdVisible: false,
          maxMeasuredValueVisible: true,
          titleString: props.controller.lang.rrate_title,
          //FIXME get unit string in a proper way, dont access directly data
          unitString: props.controller.data.rainunit+'/h',
          lcdDecimals: 1,
          labelNumberFormat: props.controller.gaugeGlobals.labelFormat,
          fractionalScaleDecimals: this.state.scaleDecimals,
          niceScale: false,
        };

        this.style = this.props.controller.config.showGaugeShadow
          ? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeGlobals.shadowColour)
          : {};

        this.update = this.update.bind(this);

        this.props.controller.subscribe(RainRateGauge.NAME, this.update);
    }

    _initGauge() {
      if(this.canvasRef.current) {
        this.gauge = new steelseries.Radial(this.canvasRef.current, this.params);
        this.gauge.setValue(this.state.value);
      }
    }

    update(data: any) {
      let newState: any = {};

      newState.value = DataUtils.extractDecimal(data.rrate);
      newState.maxMeasured = DataUtils.extractDecimal(data.rrateTM);
      let overallMax = Math.max(newState.maxMeasured, newState.value)

      if (data.rainunit === 'mm') { // 10, 20, 30...
        newState.maxValue = DataUtils.nextHighest(overallMax, 10);
      } else {
        // inches 0.5, 1.0, 2.0, 3.0 ... 10, 20, 30...
        if (overallMax <= 0.5) {
          newState.maxValue = 0.5;
        }
        else if (overallMax <= 10) {
          newState.maxValue = DataUtils.nextHighest(overallMax, 1);
        }
        else {
          newState.maxValue = DataUtils.nextHighest(overallMax, 10);
        }
        newState.scaleDecimals = newState.maxValue < 1 ? 2 : (newState.maxValue < 7 ? 1 : 0);
      }

      this.setState(newState);
    }

    componentDidMount() {
        this._initGauge();
    }

    componentDidUpdate() {
      if (this.state.maxValue !== this.gauge.getMaxValue()) {
        this.gauge.setValue(0.0001);
        this.gauge.setFractionalScaleDecimals(this.state.scaleDecimals);
        this.gauge.setMaxValue(this.state.maxValue);
      }
      
      //FIXME Twwen.js animation in ss lib not working
      //this.gauge.setValueAnimated(this.state.value);
      this.gauge.setValue(this.state.value);

      this.gauge.setMaxMeasuredValue(this.state.maxMeasured);

      //TODO set popup text
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
    maxMeasured: number,
    maxValue: number,
    scaleDecimals: number

    //popUpTxt?: string,
    //graph?: string
}

export default RainRateGauge;