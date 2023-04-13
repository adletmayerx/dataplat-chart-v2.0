interface sizeWindowSlider {
	wLeft: number;
	wRight: number;
	wWidth: number;
}

interface DPChartTooltipData {
	title: string;
	items: Array<{
		xValue: string;
		name: string;
		value: string;
		lineColor?: string;
	}>;
}

interface DPChartCalcData {
	data: {
		props: {
			name: string;
			lineColor?: string;
		};
		points: Array<DPChartPoints>;
	};
}

interface DPChartAnnotationLine {
	mode: string;
	mouseX: number;
	mouseY: number;
	moveX: number;
	moveY: number;
	lineX: number;
	lineY: number;
	label?: DPChartTooltipData;
}

type DPChartPoints = [pointX: number, pointY: number, x: number, y: number];

interface DPChartMinMax {
	min: number;
	max: number;
	diff: number;
}

interface DPChartAxisYSizes {
	labelPadding: number;
	titlePadding: number;
	sum: Function;
}

interface DPChartAxisYPrevSizes {
	leftAxis: number;
	rightAxis: number;
}
