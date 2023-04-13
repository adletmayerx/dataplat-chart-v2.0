/// <reference path="../src/widgets/dataplat.elements.ts" />
/// <reference path="../src/dataplat.chart.ts" />

import getData from './test.data';
import { DPDataSource } from '../src/widgets/dataplat.elements';

let chartConstructor: any = null;

let data: any = [];

let typeChart = '';

const selectPoints = document.getElementById('select-points') as DPElementSelect;
selectPoints.dataSource = new DPDataSource({
	list: [
		{ name: '100 points', id: '100' },
		{ name: '5,000 points', id: '5000' },
		{ name: '50,000 points', id: '50000' },
		{ name: '100,000 points', id: '100000' },
		{ name: '1,000,000 points', id: '1000000' },
		{ name: '5,000,000 points', id: '5000000' },
		{ name: '25,000,000 points', id: '25000000' }
	]
});
selectPoints.value = '100';
const selectButton = document.getElementById('select-button') as HTMLButtonElement;

const mousedown = () => {
	const value: string = String(selectPoints.value);

	data = getData(+value, typeChart);
	chartConstructor.update(data);
};

let axisY1 = {
	title: {
		name: 'Заголовок по оси Y 1',
		fontColor: '#f50000'
	},
	label: {
		fontColor: '#f50000'
	},
	line: {
		color: '#f50000'
	}
} as DPChartAxisY;

let axisY2 = {
	title: {
		name: 'Заголовок по оси Y 2',
		fontColor: '#3d9ad8'
	},
	label: {
		fontColor: '#3d9ad8'
	},
	line: {
		color: '#3d9ad8'
	}
} as DPChartAxisY;

let axisY3 = {
	title: {
		name: 'Заголовок по оси Y 3',
		fontColor: '#03a300'
	},
	label: {
		fontColor: '#03a300'
	},
	line: {
		color: '#03a300'
	}
} as DPChartAxisY;

let dataAxisY: Array<any> = [];

dataAxisY.push(axisY1, axisY2, axisY3);

function setChart(chart: DPChart, type: string) {
	if (!chart) return;

	typeChart = type;
	let limit = 100;

	data = getData(limit, type) as Array<DPChartDataSeries>;

	selectButton.removeEventListener('mousedown', mousedown);

	if (type === 'line' || type === 'multi-line') {
		chart.downsampled = true;
		chart.navigator = true;
	}

	if (type === 'line') {
		chart.axisY = {
			title: {
				name: 'Заголовок по оси Y'
			}
		};
	} else if (type === 'multi-line' || type === 'column') {
		chart.axisY = dataAxisY;
	}

	chart.legend = {
		horizontalAlign: 'center',
		verticalAlign: 'top'
	};

	if (type === 'line' || type === 'multi-line') {
		const points = document.getElementById('points');
		if (points) points.style.display = '';
		if (selectButton) selectButton.addEventListener('mousedown', mousedown);
	} else {
		const points = document.getElementById('points');
		if (points) points.style.display = 'none';
	}

	let textTitle = '';
	if (type === 'line') textTitle = 'Линейный график';
	if (type === 'multi-line') textTitle = 'Мульти график';
	if (type === 'scatter') textTitle = 'Точечный график';
	if (type === 'column') textTitle = 'Гистограмма';
	if (type === 'line-null') textTitle = 'График с некачественными данными';

	chart.chartTitle = {
		text: textTitle,
		fontStyle: 'italic',
		fontColor: '#000000'
	};

	chart.axisX = {
		title: {
			name: 'Заголовок по оси X',
			fontWeight: 'normal'
		}
	};

	chart.data = data;
}

// #region treeview

const treeview = document.getElementById('treeview') as DPElementTreeview;

if (treeview) {
	const data = [
		{ id: 'line', name: 'Линейный график' },
		{ id: 'multi-line', name: 'Мульти график' },
		{ id: 'line-null', name: 'График с некачественными данными' }
		// { id: 'scatter', name: 'Точечный график' },
		// { id: 'column', name: 'Гистограмма вертикальная' },
		// { id: 'bar', name: 'Гистограмма горизонтальная' },
		// { id: 'radar', name: 'Лепестковая диаграмма' }
	];

	treeview.dataSource = new DPDataSource({
		list: data,
		schema: {
			model: {
				id: 'id',
				parentId: 'ParentId',
				name: 'name'
			}
		}
	});

	treeview.addEventListener('loaded', e => {
		treeview.select = 'line';
	});

	treeview.addEventListener('select', e => {
		const charts = document.querySelectorAll('.dp-chart-window');
		if (charts?.length) {
			for (let chartWindow of charts) {
				if (chartWindow.id === treeview.select.id) {
					initDataplatChart(chartWindow, true, chartWindow.id);
				} else {
					initDataplatChart(chartWindow, false);
				}
			}
		}
	});
}

function initDataplatChart(chart: Element, visible: boolean = true, type?: string) {
	visible ? chart.classList.add('show-chart') : chart.classList.remove('show-chart');
	visible ? chart.classList.remove('hide-chart') : chart.classList.add('hide-chart');

	if (!visible || !type) return;

	const dataplatChart = chart.querySelector('dataplat-chart') as DPChart;
	if (dataplatChart) setChart(dataplatChart, type);
	chartConstructor = new ChartConstructor(dataplatChart);
	chartConstructor.init();
}

window.onload = () => {
	let dpChart = document.querySelector('.dp-chart') as DPChart;

	setChart(dpChart, 'line');
	chartConstructor = new ChartConstructor(dpChart);
	chartConstructor.init();
};

//#endregion

class ChartConstructor {
	Chart: DPChart;

	data: ChartConstructorData;
	titleEls: ChartConstructorTitle;
	legendEls: DPChartConstructorLegend;
	axisXEls: DPChartConstructorAxisX;
	axisYEls: DPChartConstructorAxisY;
	lineEls: DPChartConstructorView;
	backgroundEls: DPChartConstructorBackground;
	markerEls: DPChartConstructorMarker;
	fillEls: DPChartConstructorFill;
	gridEls: DPChartConstructorGrid;
	nullDataEls: DPChartConstructorNullData;
	navigator: DPChartConstructorNavigator;

	toolbar: DPElementToolbar;

	axisY: DPChartAxisY;
	axisX: DPChartAxisX;

	constructor(chart: DPChart) {
		this.Chart = chart;

		this.data = {
			verticalAlign: [
				{ id: 'top', name: 'Сверху' },
				{ id: 'center', name: 'По Центру' },
				{ id: 'bottom', name: 'Снизу' }
			],
			horizontalAlign: [
				{ id: 'left', name: 'Слева' },
				{ id: 'right', name: 'Справа' },
				{ id: 'center', name: 'По Центру' }
			],
			fontStyle: [
				{ id: 'normal', name: 'Обычный' },
				{ id: 'italic', name: 'Курсив' }
			],
			fontWeigth: [
				{ name: 'Нормальное', id: 'normal' },
				{ name: 'Тонкое', id: 'lighter' },
				{ name: 'Полужирное', id: 'bold' },
				{ name: 'Жирное', id: 'bolder' }
			],
			thickness: [
				{ name: '1пт', id: '1' },
				{ name: '2пт', id: '2' },
				{ name: '3пт', id: '3' },
				{ name: '4пт', id: '4' },
				{ name: '5пт', id: '5' }
			],
			lineType: [
				{ id: 'dash', name: 'Пунктирная линия' },
				{ id: 'solid', name: 'Сплошная линия' },
				{ id: 'dot', name: 'Точечная линия' },
				{ id: 'none', name: 'Без отображения' }
			]
		};

		this.titleEls = this.getTitleElements();
		this.legendEls = this.getLegendElements();
		this.axisXEls = this.getAxisXElements();
		this.axisYEls = this.getAxisYElements();
		this.lineEls = this.getLineElements();
		this.backgroundEls = this.getBackgroundElements();
		this.markerEls = this.getMarkerElements();
		this.fillEls = this.getFillElements();
		this.gridEls = this.getGridElements();
		this.nullDataEls = this.getNullDataElements();
		this.navigator = this.getNavigatorElements();

		this.toolbar = document.getElementById('tools') as DPElementToolbar;

		this.axisX = {};
		this.axisY = {};
	}

	init() {
		if (!this.Chart) return;
		this.initTitle();
		this.initLegend();
		this.initAxisX();
		this.initAxisY();
		this.initLine();
		this.initBackground();
		this.initMarker();
		this.initFill();
		this.initGrid();
		this.initNullData();
		this.initNavigator();
		this.initToolbar();
	}

	update(data: Array<DPChartDataSeries>) {
		if (!this.Chart) return;
		this.editTitle();
		this.editLegend();
		this.editAxisX();
		this.editAxisY();
		this.editLine();
		this.editBackground();
		this.editMarker();
		this.editFill();
		this.editGrid();
		this.editNullData();
		this.editNavigator();
		this.Chart.data = data;
	}

	handlerClickOnToolbar = (e: Event) => {
		const annotation = {
			enable: true,
			mode: 'vertical'
		};
		let target = e.target as DPElementToolbar;

		const btnHoz = target.querySelector('[action="gridline"]') as DPElementCheckboxButton;
		const btnVert = target.querySelector('[action="gridlinevertical"]') as DPElementCheckboxButton;
		const close = target.querySelector('[action="gridLineDelete"]') as DPElementCheckboxButton;
		const clean = target.querySelector('[action="gridLineClean"]') as DPElementCheckboxButton;

		if (target === this.toolbar) {
			if (target.selectedAction === 'save') {
				chartConstructor.update(data);
			} else if (target.selectedAction === 'gridlinevertical') {
				close.value = false;
				this.Chart.offRemoveAnnotations();
				if (btnHoz?.value && btnVert?.value) btnHoz.value = false;
				annotation.enable = btnVert.value;
				this.Chart.annotation = annotation;
			} else if (target.selectedAction === 'gridline') {
				close.value = false;
				this.Chart.offRemoveAnnotations();
				if (btnVert?.value && btnHoz.value) btnVert.value = false;
				annotation.mode = 'horizontal';
				annotation.enable = btnHoz.value;
				this.Chart.annotation = annotation;
			} else if (target.selectedAction === 'gridLineClean') {
				close.value = false;
				this.Chart.offRemoveAnnotations();
				this.Chart.cleanAnnotations();
			} else {
				btnHoz.value = false;
				btnVert.value = false;
				annotation.enable = false;
				this.Chart.annotation = annotation;

				if (close.value) {
					this.Chart.onRemoveAnnotations();
				} else {
					this.Chart.offRemoveAnnotations();
				}
			}
		}
	};

	initToolbar() {
		if (!this.toolbar) return;

		this.toolbar.removeEventListener('changed', this.handlerClickOnToolbar);
		this.toolbar.addEventListener('changed', this.handlerClickOnToolbar);
	}

	getTitleElements() {
		return {
			name: document.getElementById('titleName') as HTMLInputElement,
			fontSize: document.getElementById('titleSize') as HTMLInputElement,
			fontColor: document.getElementById('titleColor') as HTMLInputElement,
			fontStyle: document.getElementById('titleStyle') as DPElementSelect,
			fontWeigth: document.getElementById('titleWeight') as DPElementSelect,
			verticalAlign: document.getElementById('titlePositionVertical') as DPElementSelect,
			horizontalAlign: document.getElementById('titlePositionHorizontal') as DPElementSelect
		};
	}

	initTitle() {
		this.titleEls.fontStyle.dataSource = new DPDataSource({
			list: this.data.fontStyle
		});
		this.titleEls.verticalAlign.dataSource = new DPDataSource({
			list: this.data.verticalAlign
		});
		this.titleEls.horizontalAlign.dataSource = new DPDataSource({
			list: this.data.horizontalAlign
		});
		this.titleEls.fontWeigth.dataSource = new DPDataSource({
			list: this.data.fontWeigth
		});

		this.titleEls.name.value = this.Chart.chartTitle.text || '';
		this.titleEls.fontStyle.value = this.Chart.chartTitle.fontStyle || '';
		this.titleEls.fontWeigth.value = this.Chart.chartTitle.fontWeight || '';
		this.titleEls.verticalAlign.value = this.Chart.chartTitle.verticalAlign || '';
		this.titleEls.horizontalAlign.value = this.Chart.chartTitle.horizontalAlign || '';
		this.titleEls.fontColor.value = this.Chart.chartTitle.fontColor || '#000000';
		this.titleEls.fontSize.value = this.Chart.chartTitle.fontSize?.toString() || '';
	}

	editTitle() {
		const title = {
			text: this.titleEls.name.value,
			fontSize: +this.titleEls.fontSize.value,
			fontColor: this.titleEls.fontColor.value,
			fontStyle: this.titleEls.fontStyle.value,
			fontWeight: this.titleEls.fontWeigth.value,
			verticalAlign: this.titleEls.verticalAlign.value,
			horizontalAlign: this.titleEls.horizontalAlign.value
		} as DPChartTitle;

		this.Chart.chartTitle = title;
	}

	getLegendElements() {
		return {
			verticalAlign: document.getElementById('legendVerticalAlign') as DPElementSelect,
			horizontalAlign: document.getElementById('legendHorizontalAlign') as DPElementSelect,
			size: document.getElementById('legendSize') as DPElementNumber,
			weight: document.getElementById('legendWeight') as DPElementSelect,
			style: document.getElementById('legendStyle') as DPElementSelect,
			show: document.getElementById('legendShow') as DPElementCheckBox
		};
	}

	initLegend() {
		this.legendEls.verticalAlign.dataSource = new DPDataSource({
			list: this.data.verticalAlign
		});
		this.legendEls.horizontalAlign.dataSource = new DPDataSource({
			list: this.data.horizontalAlign
		});
		this.legendEls.weight.dataSource = new DPDataSource({
			list: this.data.fontWeigth
		});
		this.legendEls.style.dataSource = new DPDataSource({
			list: this.data.fontStyle
		});
		this.legendEls.verticalAlign.value = this.Chart.legend?.verticalAlign || 'top';
		this.legendEls.horizontalAlign.value = this.Chart.legend?.horizontalAlign || 'center';
		this.legendEls.size.value = this.Chart.legend?.fontSize || 14;
		this.legendEls.style.value = this.Chart.legend?.fontStyle || 'normal';
		this.legendEls.weight.value = this.Chart.legend?.fontWeight || 'normal';

		this.legendEls.show.value = this.Chart.data[0].showLegend!;
	}

	editLegend() {
		const legend = {
			verticalAlign: this.legendEls.verticalAlign.value,
			horizontalAlign: this.legendEls.horizontalAlign.value,
			fontSize: this.legendEls.size.value,
			fontStyle: this.legendEls.style.value,
			fontWeight: this.legendEls.weight.value
		} as DPChartLegend;

		this.Chart.data[0].showLegend = this.legendEls.show.value;
		this.Chart.legend = legend;
	}

	getAxisXElements() {
		return {
			title: document.getElementById('axisXTitle') as HTMLInputElement,
			titleSize: document.getElementById('axisXTitleSize') as HTMLInputElement,
			titleColor: document.getElementById('axisXTitleColor') as HTMLInputElement,
			titleStyle: document.getElementById('axisXTitleStyle') as DPElementSelect,
			titleWeigth: document.getElementById('axisXTitleWeight') as DPElementSelect,
			labelColor: document.getElementById('axisXLabelColor') as HTMLInputElement,
			labelAngle: document.getElementById('axisXAngle') as HTMLInputElement,
			labelSize: document.getElementById('axisXLabelSize') as DPElementNumber,
			axisColor: document.getElementById('axisXColor') as HTMLInputElement,
			countSymbols: document.getElementById('axisXSymbols') as DPElementNumber
		};
	}

	initAxisX() {
		this.axisXEls.titleStyle.dataSource = new DPDataSource({
			list: this.data.fontStyle
		});
		this.axisXEls.titleWeigth.dataSource = new DPDataSource({
			list: this.data.fontWeigth
		});

		this.axisXEls.title.value = this.Chart.axisX.title?.name || '';
		this.axisXEls.titleSize.value = this.Chart.axisX.title?.fontSize?.toString() || '';
		this.axisXEls.titleColor.value = this.Chart.axisX.title?.fontColor || '#000000';
		this.axisXEls.titleStyle.value = this.Chart.axisX.title?.fontStyle || '';
		this.axisXEls.titleWeigth.value = this.Chart.axisX.title?.fontWeight || '';
		this.axisXEls.labelColor.value = this.Chart.axisX.label?.fontColor || '#000000';
		this.axisXEls.labelAngle.value = this.Chart.axisX.label?.angle?.toString() || '';
		this.axisXEls.labelSize.value = this.Chart.axisX.label?.fontSize || '';
		this.axisXEls.axisColor.value = this.Chart.axisX.line?.color || '#000000';
		this.axisXEls.countSymbols.value = this.Chart.axisX.countSymbols || 0;
	}

	editAxisX() {
		this.axisX = {
			title: {
				name: this.axisXEls.title.value,
				fontColor: this.axisXEls.titleColor.value,
				fontSize: +this.axisXEls.titleSize.value,
				fontWeight: this.axisXEls.titleWeigth.value,
				fontStyle: this.axisXEls.titleStyle.value
			},
			label: {
				fontColor: this.axisXEls.labelColor.value,
				fontSize: this.axisXEls.labelSize.value,
				angle: +this.axisXEls.labelAngle.value
			},
			line: {},
			countSymbols: this.axisXEls.countSymbols.value
		} as DPChartAxisX;
		if (this.axisXEls.axisColor.value !== '#000000') {
			this.axisX.line!.color = this.axisXEls.axisColor.value;
		}
	}

	getAxisYElements() {
		return {
			title: document.getElementById('axisYTitle') as HTMLInputElement,
			titleSize: document.getElementById('axisYTitleSize') as HTMLInputElement,
			titleColor: document.getElementById('axisYTitleColor') as HTMLInputElement,
			titleStyle: document.getElementById('axisYTitleStyle') as DPElementSelect,
			titleWeigth: document.getElementById('axisYTitleWeight') as DPElementSelect,
			labelColor: document.getElementById('axisYLabelColor') as HTMLInputElement,
			labelAngle: document.getElementById('axisYAngle') as HTMLInputElement,
			labelSize: document.getElementById('axisYLabelSize') as DPElementNumber,
			currentAxis: document.getElementById('axisYSelect') as DPElementSelect,
			axisColor: document.getElementById('axisYColor') as HTMLInputElement,
			countSymbols: document.getElementById('axisYSymbols') as DPElementNumber
		};
	}

	initAxisY() {
		this.axisYEls.titleStyle.dataSource = new DPDataSource({
			list: this.data.fontStyle
		});
		this.axisYEls.titleWeigth.dataSource = new DPDataSource({
			list: this.data.fontWeigth
		});

		let axisY;

		if (Array.isArray(this.Chart.axisY)) {
			axisY = this.Chart.axisY[0];
			let data = [];
			for (let i = 1; i <= this.Chart.axisY.length; i++) {
				data.push({ id: i, name: this.Chart.axisY[i - 1].title?.name || `Ось ${i}` });
			}
			this.axisYEls.currentAxis.dataSource = new DPDataSource({
				list: data
			});
		} else {
			axisY = this.Chart.axisY;
			this.axisYEls.currentAxis.dataSource = new DPDataSource({
				list: [{ id: 1, name: this.Chart.axisY.title?.name }]
			});
		}

		this.axisYEls.currentAxis.value = '1';

		this.axisYEls.currentAxis.addEventListener('changed', () => {
			let axisY = Array.isArray(this.Chart.axisY)
				? this.Chart.axisY[+this.axisYEls.currentAxis.value - 1]
				: this.Chart.axisY;

			this.axisYEls.title.value = axisY.title?.name || '';
			this.axisYEls.titleSize.value = axisY.title?.fontSize?.toString() || '';
			this.axisYEls.titleColor.value = axisY.title?.fontColor || '#000000';
			this.axisYEls.titleStyle.value = axisY.title?.fontStyle || '';
			this.axisYEls.titleWeigth.value = axisY.title?.fontWeight || '';
			this.axisYEls.labelColor.value = axisY.label?.fontColor || '#000000';
			this.axisYEls.labelAngle.value = axisY.label?.angle?.toString() || '';
			this.axisYEls.labelSize.value = axisY.label?.fontSize || '';
			this.axisYEls.axisColor.value = axisY.line?.color || '#000000';
			this.axisXEls.countSymbols.value = axisY.countSymbols || 0;
		});

		// this.axisYEls.showAxis.value = true

		this.axisYEls.title.value = axisY.title?.name || '';
		this.axisYEls.titleSize.value = axisY.title?.fontSize?.toString() || '';
		this.axisYEls.titleColor.value = axisY.title?.fontColor || '#000000';
		this.axisYEls.titleStyle.value = axisY.title?.fontStyle || '';
		this.axisYEls.titleWeigth.value = axisY.title?.fontWeight || '';
		this.axisYEls.labelColor.value = axisY.label?.fontColor || '#000000';
		this.axisYEls.labelAngle.value = axisY.label?.angle?.toString() || '';
		this.axisYEls.labelSize.value = axisY.label?.fontSize || '';
		this.axisYEls.axisColor.value = axisY.line?.color || '#000000';
		this.axisYEls.countSymbols.value = axisY.countSymbols || 0;

		this.axisYEls.titleColor.removeEventListener('change', this.closeSyncColor);
		this.axisYEls.labelColor.removeEventListener('change', this.closeSyncColor);
		this.axisYEls.axisColor.removeEventListener('change', this.closeSyncColor);

		this.axisYEls.titleColor.addEventListener('change', this.closeSyncColor);
		this.axisYEls.labelColor.addEventListener('change', this.closeSyncColor);
		this.axisYEls.axisColor.addEventListener('change', this.closeSyncColor);
	}

	closeSyncColor = () => {
		this.lineEls.colorSync.value = false;
	};

	editAxisY() {
		if (this.lineEls.colorSync.value) {
			this.axisYEls.titleColor.value = this.lineEls.color.value;
			this.axisYEls.labelColor.value = this.lineEls.color.value;
			this.axisYEls.axisColor.value = this.lineEls.color.value;
		}

		this.axisY = {
			title: {
				name: this.axisYEls.title.value,
				fontColor: this.axisYEls.titleColor.value,
				fontSize: +this.axisYEls.titleSize.value,
				fontWeight: this.axisYEls.titleWeigth.value,
				fontStyle: this.axisYEls.titleStyle.value
			},
			label: {
				fontColor: this.axisYEls.labelColor.value,
				fontSize: this.axisYEls.labelSize.value,
				angle: +this.axisYEls.labelAngle.value
			},
			line: {},
			countSymbols: this.axisYEls.countSymbols.value
		} as DPChartAxisX;
		if (this.axisYEls.axisColor.value !== '#000000') {
			this.axisY.line!.color = this.axisYEls.axisColor.value;
		}
	}

	getLineElements() {
		return {
			spline: document.getElementById('lineModeSpline') as DPElementSwitch,
			step: document.getElementById('lineModeStep') as DPElementSwitch,
			currentMode: document.getElementById('lineCurrent') as DPElementSelect,
			thickness: document.getElementById('lineThickness') as DPElementSelect,
			color: document.getElementById('lineColor') as HTMLInputElement,
			type: document.getElementById('lineType') as DPElementSelect,
			symbols: document.getElementById('lineSymbols') as DPElementNumber,
			colorSync: document.getElementById('lineColorSync') as DPElementCheckBox
		};
	}

	handlerSwitchSplineMode = () => {
		if (!this.lineEls.spline.value) return;
		this.lineEls.step.value = !this.lineEls.spline.value;
	};

	handlerSwitchSteppedMode = () => {
		if (!this.lineEls.step.value) return;
		this.lineEls.spline.value = !this.lineEls.step.value;
	};

	initLine() {
		let data = [];
		for (let i = 1; i <= this.Chart.data.length; i++) {
			data.push({ id: i, name: this.Chart.data[i - 1].name || `Ось ${i}` });
		}
		this.lineEls.currentMode.dataSource = new DPDataSource({
			list: data
		});
		this.lineEls.thickness.dataSource = new DPDataSource({
			list: this.data.thickness
		});

		const lineType = this.data.lineType!.slice(0, 3);

		this.lineEls.type.dataSource = new DPDataSource({
			list: lineType
		});

		this.lineEls.currentMode.value = '1';

		let model = this.Chart.data[0];

		this.lineEls.currentMode.addEventListener('changed', () => {
			model = this.Chart.data[+this.lineEls.currentMode.value - 1];
			if (!model) return;
			this.lineEls.spline.value = model.spline || false;
			this.lineEls.step.value = model.stepped || false;
			this.lineEls.thickness.value = model.lineWidth?.toString() || '1';
			this.lineEls.color.value = model.lineColor || '#000000';
			this.lineEls.type.value = model.lineType || 'solid';
		});

		this.lineEls.spline.removeEventListener('changed', this.handlerSwitchSplineMode);
		this.lineEls.spline.addEventListener('changed', this.handlerSwitchSplineMode);

		this.lineEls.step.removeEventListener('changed', this.handlerSwitchSteppedMode);
		this.lineEls.step.addEventListener('changed', this.handlerSwitchSteppedMode);

		this.lineEls.spline.value = model.spline || false;
		this.lineEls.step.value = model.stepped || false;
		this.lineEls.thickness.value = model.lineWidth?.toString() || '1';
		this.lineEls.color.value = model.lineColor || '#000000';
		this.lineEls.type.value = model.lineType || 'solid';
		this.lineEls.symbols.value = model.countSymbols || 0;
	}

	editLine() {
		if (this.Chart.data.length > 1) {
			this.Chart.data[+this.lineEls.currentMode.value - 1].spline = this.lineEls.spline.value;
			this.Chart.data[+this.lineEls.currentMode.value - 1].stepped = this.lineEls.step.value;
			this.Chart.data[+this.lineEls.currentMode.value - 1].lineWidth = +this.lineEls.thickness.value;
			this.Chart.data[+this.lineEls.currentMode.value - 1].lineColor = this.lineEls.color.value;
			this.Chart.data[+this.lineEls.currentMode.value - 1].lineType = this.lineEls.type.value.toString();
			this.Chart.data[+this.lineEls.currentMode.value - 1].countSymbols = this.lineEls.symbols.value;
		} else {
			this.Chart.data[0].spline = this.lineEls.spline.value;
			this.Chart.data[0].stepped = this.lineEls.step.value;
			this.Chart.data[0].lineWidth = +this.lineEls.thickness.value;
			this.Chart.data[0].lineColor = this.lineEls.color.value;
			this.Chart.data[0].lineType = this.lineEls.type.value.toString();
			this.Chart.data[0].countSymbols = this.lineEls.symbols.value;
		}
	}

	getBackgroundElements() {
		return {
			backgroundParent: document.getElementById('backgroundParentColor') as HTMLInputElement,
			background: document.getElementById('backgroundColor') as HTMLInputElement
		};
	}

	initBackground() {
		if (this.Chart.backgroundColor?.length === 7) {
			this.backgroundEls.background.value = this.Chart.backgroundColor;
		}

		this.backgroundEls.backgroundParent.value = this.Chart.substrateColor || '#000000';
	}

	editBackground() {
		if (this.backgroundEls.background.value !== '#000000') {
			this.Chart.backgroundColor = this.backgroundEls.background.value;
		}
		if (this.backgroundEls.backgroundParent.value !== '#000000') {
			this.Chart.substrateColor = this.backgroundEls.backgroundParent.value;
		}
	}

	getMarkerElements() {
		return {
			type: document.getElementById('markerType') as DPElementSelect,
			color: document.getElementById('markerColor') as HTMLInputElement,
			size: document.getElementById('markerSize') as DPElementNumber,
			line: document.getElementById('markerLine') as DPElementSelect,
			show: document.getElementById('markerShow') as DPElementCheckBox
		};
	}

	initMarker() {
		let data = [];
		for (let i = 1; i <= this.Chart.data.length; i++) {
			data.push({ id: i, name: this.Chart.data[i - 1].name || `Ось ${i}` });
		}

		this.markerEls.line.dataSource = new DPDataSource({
			list: data
		});

		this.markerEls.line.value = '1';

		let model = this.Chart.data[0];

		const setValue = (model: DPChartDataSeries) => {
			this.markerEls.type.value = model.marker?.type || 'circle';
			this.markerEls.color.value = model.marker?.color || '#000000';
			this.markerEls.size.value = model.marker?.size || 1;
			this.markerEls.show.value = model.marker?.enabled || false;
		};

		setValue(model);

		this.markerEls.line.addEventListener('changed', () => {
			model = this.Chart.data[+this.markerEls.line.value - 1];
			if (!model) return;

			setValue(model);
		});

		this.markerEls.type.dataSource = new DPDataSource({
			list: [
				{ id: 'circle', name: 'Круг' },
				{ id: 'square', name: 'Квадрат' },
				{ id: 'triangle', name: 'Треуглольник' },
				{ id: 'cross', name: 'Крестик' }
			]
		});
	}

	editMarker() {
		let marker = {
			enabled: this.markerEls.show.value,
			type: this.markerEls.type.value.toString(),
			color: this.markerEls.color.value === '#000000' ? '' : this.markerEls.color.value,
			size: this.markerEls.size.value
		};

		this.Chart.data[+this.markerEls.line.value - 1].marker = marker;
	}

	getFillElements() {
		return {
			line: document.getElementById('fillLine') as DPElementSelect,
			enable: document.getElementById('fillEnable') as DPElementCheckBox,
			color: document.getElementById('fillColor') as HTMLInputElement
		};
	}

	initFill() {
		let data = [];
		for (let i = 1; i <= this.Chart.data.length; i++) {
			data.push({ id: i, name: this.Chart.data[i - 1].name || `Ось ${i}` });
		}

		this.fillEls.line.dataSource = new DPDataSource({
			list: data
		});

		this.fillEls.line.value = '1';

		let model = this.Chart.data[0];

		const setValue = (model: DPChartDataSeries) => {
			this.fillEls.color.value = model.fillColor || '#000000';
			this.fillEls.enable.value = model.fillArea || false;
		};

		setValue(model);

		this.fillEls.line.addEventListener('changed', () => {
			model = this.Chart.data[+this.fillEls.line.value - 1];
			if (!model) return;

			setValue(model);
		});
	}

	editFill() {
		if (this.fillEls.color.value !== '#000000') {
			this.Chart.data[+this.fillEls.line.value - 1].fillColor = this.fillEls.color.value;
		}
		this.Chart.data[+this.fillEls.line.value - 1].fillArea = this.fillEls.enable.value;
	}

	getGridElements() {
		return {
			gridX: document.getElementById('gridX') as DPElementCheckBox,
			gridY: document.getElementById('gridY') as DPElementCheckBox,
			colorX: document.getElementById('gridColorX') as HTMLInputElement,
			colorY: document.getElementById('gridColorY') as HTMLInputElement,
			intervalX: document.getElementById('gridIntervalX') as DPElementNumber,
			intervalY: document.getElementById('gridIntervalY') as DPElementNumber
		};
	}

	initGrid() {
		this.gridEls.gridX.value = this.Chart.axisX.grid?.enable || false;

		if (this.Chart.axisX.grid?.color?.length === 7) {
			this.gridEls.colorX.value = this.Chart.axisX.grid?.color || '#000000';
		}

		this.gridEls.intervalX.value = this.Chart.axisX.interval || '';

		if (Array.isArray(this.Chart.axisY)) {
			this.gridEls.gridY.value = this.Chart.axisY[0].grid?.enable || true;
			if (this.Chart.axisY[0].grid?.color?.length === 7) {
				this.gridEls.colorY.value = this.Chart.axisY[0].grid?.color || '#000000';
			}
			this.gridEls.intervalY.value = this.Chart.axisY[0].interval || '';
		} else {
			this.gridEls.gridY.value = this.Chart.axisY.grid?.enable || true;
			if (this.Chart.axisY.grid?.color?.length === 7) {
				this.gridEls.colorY.value = this.Chart.axisY.grid?.color || '#000000';
			}
			this.gridEls.intervalY.value = this.Chart.axisY.interval || '';
		}
	}

	editGrid() {
		this.axisY.grid = {
			enable: this.gridEls.gridY.value
		};
		this.axisY.interval = this.gridEls.intervalY.value;

		this.axisX.grid = {
			enable: this.gridEls.gridX.value
		};
		this.axisX.interval = this.gridEls.intervalX.value;

		if (this.gridEls.colorY.value !== '#000000') {
			this.axisY.grid.color = this.gridEls.colorY.value;
		}

		if (this.gridEls.colorX.value !== '#000000') {
			this.axisX.grid.color = this.gridEls.colorX.value;
		}

		if (Array.isArray(this.Chart.axisY)) {
			dataAxisY[0].grid = this.axisY.grid;
			dataAxisY[+this.axisYEls.currentAxis.value - 1] = this.axisY;
			this.Chart.axisY = dataAxisY;
		} else {
			this.Chart.axisY = this.axisY;
		}

		this.Chart.axisX = this.axisX;
	}

	getNullDataElements() {
		return {
			lineType: document.getElementById('nullLineType') as DPElementSelect,
			lineColor: document.getElementById('nullLineColor') as HTMLInputElement,
			showLegend: document.getElementById('nullLegend') as DPElementCheckBox,
			nameLegend: document.getElementById('nullLegendName') as HTMLInputElement
		};
	}

	initNullData() {
		this.nullDataEls.lineType.dataSource = new DPDataSource({
			list: this.data.lineType
		});
		this.nullDataEls.lineType.value = 'dash';
		this.nullDataEls.lineColor.value = this.Chart.data[0]?.nullData?.lineColor || '#000000';
	}

	editNullData() {
		const nullData = {
			lineType: this.nullDataEls.lineType.value,
			showLegend: this.nullDataEls.showLegend.value,
			nameLegend: this.nullDataEls.nameLegend.value
		} as DPChartNullData;

		if (this.nullDataEls.lineColor.value !== '#000000') {
			nullData.lineColor = this.nullDataEls.lineColor.value;
		}

		this.Chart.data[0].nullData = nullData;
	}

	getNavigatorElements() {
		return {
			enable: document.getElementById('navigator') as DPElementCheckBox
		};
	}

	initNavigator() {
		this.navigator.enable.value = this.Chart.navigator;
	}

	editNavigator() {
		this.Chart.navigator = this.navigator.enable.value;
	}
}

interface ChartConstructorTitle {
	name: HTMLInputElement;
	fontSize: HTMLInputElement;
	fontColor: HTMLInputElement;
	fontStyle: DPElementSelect;
	fontWeigth: DPElementSelect;
	verticalAlign: DPElementSelect;
	horizontalAlign: DPElementSelect;
}

interface DPChartConstructorAxisX {
	title: HTMLInputElement;
	titleSize: HTMLInputElement;
	titleColor: HTMLInputElement;
	titleStyle: DPElementSelect;
	titleWeigth: DPElementSelect;
	labelColor: HTMLInputElement;
	labelAngle: HTMLInputElement;
	labelSize: DPElementNumber;
	axisColor: HTMLInputElement;
	countSymbols: DPElementNumber;
}

interface DPChartConstructorAxisY extends DPChartConstructorAxisX {
	currentAxis: DPElementSelect;
	// showAxis: DPElementCheckBox
}

interface ChartConstructorData {
	verticalAlign: unknown;
	horizontalAlign: unknown;
	fontStyle: unknown;
	fontWeigth: unknown;
	thickness: unknown;
	lineType: Array<unknown>;
}

interface DPChartConstructorLegend {
	verticalAlign: DPElementSelect;
	horizontalAlign: DPElementSelect;
	size: DPElementNumber;
	weight: DPElementSelect;
	style: DPElementSelect;
	show: DPElementCheckBox;
}

interface DPChartConstructorView {
	spline: DPElementSwitch;
	step: DPElementSwitch;
	currentMode: DPElementSelect;
	thickness: DPElementSelect;
	color: HTMLInputElement;
	type: DPElementSelect;
	symbols: DPElementNumber;
	colorSync: DPElementCheckBox;
}

interface DPChartConstructorBackground {
	backgroundParent: HTMLInputElement;
	background: HTMLInputElement;
}

interface DPChartConstructorMarker {
	type: DPElementSelect;
	color: HTMLInputElement;
	size: DPElementNumber;
	show: DPElementCheckBox;
	line: DPElementSelect;
}

interface DPChartConstructorFill {
	line: DPElementSelect;
	enable: DPElementCheckBox;
	color: HTMLInputElement;
}

interface DPChartConstructorGrid {
	gridX: DPElementCheckBox;
	gridY: DPElementCheckBox;
	colorX: HTMLInputElement;
	colorY: HTMLInputElement;
	intervalX: DPElementNumber;
	intervalY: DPElementNumber;
}

interface DPChartConstructorNullData {
	lineType: DPElementSelect;
	lineColor: HTMLInputElement;
	showLegend: DPElementCheckBox;
	nameLegend: HTMLInputElement;
}

interface DPChartConstructorNavigator {
	enable: DPElementCheckBox;
}
