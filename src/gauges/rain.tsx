import React, { Component } from 'react';

// @ts-ignore
import steelseries from '../libs/steelseries.js';

import GaugeUtils from '../utils/gauge-utils';
import DataUtils from '../utils/data-utils';
import GaugesController from '../gauges-controller';
import styles from '../style/common.css';

//TODO docs
class RainGauge extends Component<Props, State> {
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

        this.state = {
            maxValue: this.props.controller.gaugeGlobals.rainScaleDefMaxmm,
            value: 0.0001,
            title: props.controller.lang.rain_title,
            scaleDecimals: 1,

            
            //popUpTxt: '',
            //graph: '',
        }

        this.params = {
          ...this.props.controller.commonParams,
          size: Math.ceil(this.props.size * this.props.controller.config.gaugeScaling),
          maxValue: this.state.maxValue,
          thresholdVisible: false,
          titleString: this.state.title,
          valueColor: steelseries.ColorDef.BLUE,
          useValueGradient: props.controller.gaugeGlobals.rainUseGradientColours,
          useSectionColors: props.controller.gaugeGlobals.rainUseSectionColour,
          labelNumberFormat: props.controller.gaugeGlobals.labelFormat,
          fractionalScaleDecimals: this.state.scaleDecimals,
          niceScale: false,

          //FIXME fix unit from data!
          unitString: this.props.controller.data.rainunit
        };
        this.params.valueGradient = props.controller.gaugeGlobals.rainUseGradientColours
          ? GaugeUtils.createRainfallGradient(true)
          : null;
        this.params.section = props.controller.gaugeGlobals.rainUseSectionColours
          ? GaugeUtils.createRainfallSections(true)
          : [];

        this.style = this.props.controller.config.showGaugeShadow
          ? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeGlobals.shadowColour)
          : {};

        this.update = this.update.bind(this);

        this.props.controller.subscribe(RainGauge.NAME, this.update);
    }

    _initGauge() {
      if(this.canvasRef.current) {
        this.gauge = new steelseries.RadialBargraph(this.canvasRef.current, this.params);
        this.gauge.setValue(this.state.value);
      }
    }

    update(data: any) {
        let newState: any = {};

        newState.value = DataUtils.extractDecimal(data.rfall);
        if (data.rainunit === 'mm') { // 10, 20, 30...
          newState.maxValue = Math.max(DataUtils.nextHighest(newState.value, 10), this.props.controller.gaugeGlobals.rainScaleDefMaxmm);
        }
        else {
          // inches 0.5, 1.0, 2.0, 3.0 ... 10.0, 12.0, 14.0
          if (newState.value <= 1) {
            newState.maxValue = Math.max(DataUtils.nextHighest(newState.value, 0.5), this.props.controller.gaugeGlobals.rainScaleDefMaxIn);
          } else if (newState.value <= 6) {
            newState.maxValue = Math.max(DataUtils.nextHighest(newState.value, 1), this.props.controller.gaugeGlobals.rainScaleDefMaxIn);
          } else {
            newState.maxValue = Math.max(DataUtils.nextHighest(newState.value, 2), this.props.controller.gaugeGlobals.rainScaleDefMaxIn);
          }
          newState.scaleDecimals = newState.maxValue < 1 ? 2 : 1;
      }

        this.setState(newState);
    }

    componentDidMount() {
        this._initGauge();
    }

    componentDidUpdate() {
      if (this.state.maxValue !== this.gauge.getMaxValue()) {
        // Gauge scale is too low, increase it.
        // First set the pointer back to zero so we get a nice animation
        this.gauge.setValue(0);
        // and redraw the gauge with the new scale
        this.gauge.setFractionalScaleDecimals(this.state.scaleDecimals);
        this.gauge.setMaxValue(this.state.maxValue);
      }
      //FIXME Twwen.js animation in ss lib not working
      //this.gauge.setValueAnimated(this.state.value);
      this.gauge.setValue(this.state.value);

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
    maxValue: number,
    title: string,
    scaleDecimals: number

    //popUpTxt?: string,
    //graph?: string
}

export default RainGauge;