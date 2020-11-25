import React, { Component } from 'react';
import GaugesController from '../gauges-controller';
// @ts-ignore
import steelseries from '../libs/steelseries';

//TODO docs
class LedGauge extends Component<Props, State> {
	static NAME = "LED";

	canvasRef: React.RefObject<HTMLCanvasElement>;

	gauge: any;
	params: any;

	constructor(props: Props) {
		super(props);

		this.canvasRef = React.createRef();

		this.state = {
			title: '',
			color: steelseries.LedColor.GREEN_LED,
			isOn: false,
			blink: false
		}

		this.params = {
			ledColor: this.state.color,
			size    : props.size ? props.size : 25
		};

		this.update = this.update.bind(this);
		props.controller.subscribe(LedGauge.NAME, this.update);
	}

	componentDidMount() {
		if(this.canvasRef.current) {
			this.gauge = new steelseries.Led(this.canvasRef.current, this.params);
		}
	}

	async update({ ledTitle, ledColor, ledBlink, ledState }: any) {
		let newState: any = {};

		if(ledTitle !== undefined)
			newState.title = ledTitle;
		
		if(ledColor !== undefined)
			newState.color = ledColor;

		if(ledBlink !== undefined)
			newState.blink = ledBlink;
		
		if(ledState !== undefined)
			newState.isOn = ledState;
		
		this.setState(newState);
	}

	componentDidUpdate(_prevProps: Props, prevState: State) {
		if(this.gauge && this.canvasRef.current) {
			if(prevState.title !== this.state.title)
				this.canvasRef.current.title = this.state.title;

			if(prevState.color !== this.state.color)
				this.gauge.setLedColor(this.state.color);

			if(prevState.isOn !== this.state.isOn)
				this.gauge.setLedOnOff(this.state.isOn);
			
			if(prevState.blink !== this.state.blink)
				this.gauge.blink(this.state.blink);
		}
	}

	render() {
		return (
			<canvas
				ref={this.canvasRef}
				width={this.params.size}
				height={this.params.size}
			></canvas>
		);
	}
}

interface Props {
	controller: GaugesController,
	size?: number
}

interface State {
	title: string,
	color: any,
	isOn: boolean,
	blink: boolean
}

export default LedGauge;