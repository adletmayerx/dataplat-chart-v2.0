/// <reference path="../dataplat.chart.ts" />

interface DPChart extends HTMLElement {
	width: null | number | string;
	height: null | number | string;
	backgroundColor: string;
	substrateColor: string;
	data: Array<DPChartDataSeries>;
	axisY: DPChartAxisY | Array<DPChartAxisY>;
	axisX: DPChartAxisX;
	chartTitle: DPChartTitle;
	legend: DPChartLegend;
	downsampled: boolean;
	navigator: boolean;
	annotation: DPChartAnnotation;

	cleanAnnotations(): Function;
	onRemoveAnnotations(): Function;
	offRemoveAnnotations(): Function;
}

interface DPChartAnnotation {
	enable?: boolean;
	type?: string;
	mode?: string;
}

interface DPChartDataSeries {
	name?: string;
	type?: string;
	lineWidth?: number;
	lineColor?: string;
	lineType?: string;
	xValueType?: string;
	showLegend?: boolean;
	legendText?: string;
	marker?: DPChartMarker;
	axisYType?: string;
	fillArea?: boolean;
	fillOpacity?: number;
	fillColor?: string;
	xValueFormat?: string;
	spline?: boolean;
	stepped?: boolean;
	stacked?: boolean;
	dataPoints: Array<number> | Array<DPChartDataPoints> | Array<number[]>;
	nullData: DPChartNullData;
	countSymbols?: number;
}

interface DPChartNullData {
	lineType?: string;
	lineColor?: string;
	showLegend?: boolean;
	nameLegend?: string;
}

interface DPChartMarker {
	enabled: boolean;
	type?: string;
	color?: string;
	size?: number;
}

interface DPChartLegend {
	fontSize?: number;
	fontFamily?: string;
	fontWeight?: string;
	fontColor?: string;
	fontStyle?: string;
	verticalAlign?: string;
	horizontalAlign?: string;
}

interface DPChartTitle {
	text?: string;
	verticalAlign?: string;
	horizontalAlign?: string;
	fontSize?: number;
	fontFamily?: string;
	fontWeight?: string;
	fontColor?: string;
	fontStyle?: string;
	borderThickness?: number;
	borderColor?: string;
	cornerRadius?: number;
	backgroundColor?: string | null;
	margin?: number;
	padding?: number | DPChartTitlePadding;
}

interface DPChartTitlePadding {
	top: number;
	right: number;
	bottom: number;
	left: number;
}
interface DPChartDataPoints {
	x: number;
	y: number;
	label?: string;
	name?: string;
}

interface DPChartAxisY {
	title?: DPChartAxisTitle;
	label?: DPChartAxisLabel;
	grid?: DPChartAxisGrid;
	tick?: DPChartAxisTick;
	line?: DPChartAxisLine;

	interval?: number;
	intervalType?: number;
	max?: number;
	min?: number;
	valueFormatString?: string;
	countSymbols?: number;
}

interface DPChartAxisX extends DPChartAxisY {}

interface DPChartAxisTitle {
	name?: string;
	fontFamily?: string;
	fontColor?: string;
	fontSize?: number;
	fontWeight?: string;
	fontStyle?: string;
}

interface DPChartAxisLabel {
	fontFamily?: string;
	fontColor?: string;
	fontSize?: number;
	fontWeight?: string;
	fontStyle?: string;
	angle?: number;
}

interface DPChartAxisGrid {
	enable?: boolean;
	thickness?: number;
	color?: string;
}

interface DPChartAxisLine {
	color?: string;
	thickness?: number;
	dashType?: string;
}

interface DPChartAxisTick {
	color?: string;
	length?: number;
	thickness?: number;
}
