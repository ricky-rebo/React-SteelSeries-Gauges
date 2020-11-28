import React, { Component } from 'react';
import GaugeUtils from '../utils/gauge-utils';
// @ts-ignore
import steelseries from '../libs/steelseries.js';
import DataUtils from '../utils/data-utils';
import GaugesController from '../controller/gauges_controller';
import styles from '../style/common.css';


//TODO docs
class HumGauge extends Component<Props, State> {
	static NAME = "HUM_GAUGE";

	canvasRef: React.RefObject<HTMLCanvasElement>;
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
			size: Math.ceil(this.props.size * this.props.controller.gaugeConfig.gaugeScaling),
			section: [
				steelseries.Section(0, 20, 'rgba(255,255,0,0.3)'),
				steelseries.Section(20, 80, 'rgba(0,255,0,0.3)'),
				steelseries.Section(80, 100, 'rgba(255,0,0,0.3)')
			],
			area: [],
			maxValue: 100,
			thresholdVisible: false,
			titleString: this.state.title,
			unitString: 'RH%',
		};

		this.style = this.props.controller.gaugeConfig.showGaugeShadow
			? GaugeUtils.gaugeShadow(this.params.size, this.props.controller.gaugeConfig.shadowColour)
			: {};

		this.update = this.update.bind(this);

		this.props.controller.subscribe(HumGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new steelseries.Radial(this.canvasRef.current, this.params);
			this.gauge.setValue(this.state.value);
		}
	}

	async update(data: any) {
		this._setState(mapLocalData(data));
	}

	setInOutHum(sel: string) {
		if(this.state.data)
			this._setState(this.state.data, sel);
	}

	_setState(data: LocalDataDef, sel?: string) {
		let newState: any = {};

		if(sel) {
			newState.selected = sel
			if(sel === 'out') newState.title = this.props.controller.lang.hum_title_out;
			else 							newState.title = this.props.controller.lang.hum_title_in;
		}
		else {
			newState.selected = this.state.selected;
			newState.data = data;
		}

		if(newState.selected == 'out') {
			newState.value = DataUtils.extractDecimal(data.hum);
		
			newState.areas = [
				steelseries.Section(
					DataUtils.extractDecimal(data.humTL), 
					DataUtils.extractDecimal(data.humTH), 
					this.props.controller.gaugeConfig.minMaxArea
				)
			];
		}
		else {
			newState.value = DataUtils.extractDecimal(data.inhum);
			if (data.inhumTL && data.inhumTH) {
				// Indoor - and Max/Min values supplied
				newState.areas=[
					steelseries.Section(
						DataUtils.extractDecimal(data.inhumTL), 
						DataUtils.extractDecimal(data.inhumTH), 
						this.props.controller.gaugeConfig.minMaxArea
					)
				];
			}
			else {
				// Indoor - no Max/Min values supplied
				newState.areas=[];
			}
		}

		this.setState(newState);
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
		return (
			<div className={styles.gauge}>
				<div id="tip_4">
					<canvas 
						ref={this.canvasRef}
						width={this.params.size}
						height={this.params.size}
						style={this.style}
					></canvas>
				</div>
				<button onClick={() => this.setInOutHum('out')}>Out</button>
				<button onClick={() => this.setInOutHum('in')}>In</button>
			</div>
		);
	}
}

interface Props {
	controller: GaugesController,
	size: number
}

interface State {
	data?: LocalDataDef,

	value: number,
	title: string,
	areas: any[],

	selected: string,

	//popUpTxt: string,
	//graph: string
}

interface LocalDataDef {
	hum: any, 
	humTL: any,
	humTH: any,
	inhum: any,
	inhumTL: any,
	inhumTH: any
}

function mapLocalData(data: any) {
	let locData: LocalDataDef = {
		hum			: data.hum,
		humTL		: data.humTL,
		humTH		: data.humTH,
		inhum		: data.inhum,
		inhumTL	: data.inhumTL,
		inhumTH	: data.inhumTH
	}
	return locData;
}

export default HumGauge;