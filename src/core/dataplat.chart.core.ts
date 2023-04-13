/// <reference path="../types/dataplat.chart.d.ts" />
/// <reference path="../types/dataplat.chart.core.d.ts" />

import { ChartLegend } from '../elements/dataplat.chart.legend';
import { ChartToolTip } from '../elements/dataplat.chart.tooltip';
import { ChartDate } from '../elements/dataplat.chart.date';
import { ChartNavigator } from '../elements/dataplat.chart.navigator';
import { initTypePoints } from '../helpers/dataplat.chart.helpers';

export class Chart {
	//#region properties for custom class
	_width: number | string;
	_height: number | string;
	_data: Array<DPChartDataSeries>;
	_axisY: DPChartAxisY | Array<DPChartAxisY>;
	_axisX: DPChartAxisX;
	_chartTitle: DPChartTitle;
	_annotation: DPChartAnnotation;
	_backgroundColor: string;
	_substrateColor: string;
	_downsampled: boolean;
	_navigator: boolean;

	//#endregion

	_ctx: CanvasRenderingContext2D;
	_defaultColor: string;
	_defaultAxisColor: string;
	_defaultNullLineType: string;

	_dpiHeight: number;
	_dpiWidth: number;
	_viewHeight: number; // Видимая часть диаграммы с учетом padding
	_viewWidth: number;
	_axisYMax: number | null;
	_axisYMin: number | null;
	_axisXMax: number | null;
	_axisXMin: number | null;
	_yRatio: number;
	_xRatio: number;
	_pointRadius: number;
	_proxy: any;
	_renderedData: Array<DPChartCalcData>;
	_currentLength: number;
	_spacingAxisY: number;
	_spacingAxisX: number;
	_propsAxisY: DPChartAxisY;
	_renderedAxisY: Array<unknown>;
	_type: string;
	_widthBar: number;
	_heightBar: number;
	_minmaxYAxis: Array<DPChartMinMax>;
	_minmaxXAxis: Array<DPChartMinMax>;
	_ratio: number;
	_niceYLabels: Array<Array<number>>;
	_niceXLabels: Array<number>;
	_isNullData: boolean;

	_axisYPaddings: DPChartAxisYSizes;
	_axisYPrevSizes: DPChartAxisYPrevSizes;

	_elemSize: Array<any>;

	// Отступы графика
	_paddingLeft: number;
	_paddingRight: number;
	_padding: number;
	_paddingBottom: number;

	_xLabelWidth: number;
	_xLabelHeight: number;

	_Tooltip: ChartToolTip;
	_Slider: ChartNavigator;
	_Date: ChartDate;
	_Legend: ChartLegend | null;

	_Elem: any;
	_Canvas: HTMLCanvasElement;

	_resizeObserver: ResizeObserver | null;

	constructor(elem: HTMLElement) {
		this._Elem = elem;
		this._data = [];
		this._chartTitle = this._initTitle();

		this._width = 1000;
		this._height = 350;
		this._axisY = this._initAxis();
		this._axisX = this._initAxis();
		this._annotation = this._initAnnotation();
		this._backgroundColor = '#11ffee00';
		this._substrateColor = '';
		this._downsampled = false;
		this._navigator = false;

		this._defaultColor = '#212529';
		this._defaultNullLineType = 'dash';

		this._dpiHeight = 0;
		this._dpiWidth = 0;
		this._viewHeight = 0;
		this._viewWidth = 0;
		this._axisYMax = null;
		this._axisYMin = null;
		this._axisXMax = null;
		this._axisXMin = null;
		this._yRatio = 0;
		this._xRatio = 0;
		this._pointRadius = 5;
		this._renderedData = [];
		this._currentLength = 0;
		this._spacingAxisY = 0;
		this._spacingAxisX = 0;
		this._propsAxisY = {};
		this._renderedAxisY = [];
		this._type = 'line';
		this._widthBar = 0;
		this._heightBar = 0;
		this._minmaxYAxis = []; // Массив для хранения максимальных и минимальных значений каждой из модели в порядке, расположенном в data
		this._minmaxXAxis = [];
		this._ratio = 1;
		this._niceYLabels = [];
		this._niceXLabels = [];
		this._isNullData = false;

		this._defaultAxisColor = '#6F7174';

		this._elemSize = [0, 0];

		this._axisYPaddings = {
			labelPadding: 3,
			titlePadding: 25,
			sum: function () {
				return this.labelPadding + this.titlePadding;
			}
		};

		this._axisYPrevSizes = {
			leftAxis: 0,
			rightAxis: 0
		};

		this._paddingLeft = 30;
		this._paddingRight = 30;
		this._paddingBottom = 20;
		this._padding = 20;

		this._xLabelWidth = 0;
		this._xLabelHeight = 0;

		this._Canvas = document.createElement('canvas');
		this._ctx = this._Canvas.getContext('2d')!;
		this._Tooltip = new ChartToolTip(this);
		this._Slider = new ChartNavigator(this);
		this._Date = new ChartDate(this);
		this._Legend = null;

		this._resizeObserver = null;
	}
	/**
	 * Инициализируем свойства заголовка
	 * @returns
	 */
	private _initTitle() {
		return {
			text: 'Chart Title',
			horizontalAlign: 'center',
			verticalAlign: 'top',
			fontSize: 20,
			fontFamily: 'Ubuntu, sans-serif',
			fontWeight: 'bold',
			fontColor: this._defaultColor,
			fontStyle: 'normal',
			borderThickness: 0,
			borderColor: this._defaultColor,
			cornerRadius: 0,
			backgroundColor: null,
			margin: 5,
			padding: 0
		};
	}

	/**
	 * Инициализируем свойства осей
	 * @returns
	 */
	private _initAxis() {
		return {
			title: {
				name: '',
				fontWeight: 'normal',
				fontStyle: 'normal',
				fontSize: 18,
				fontColor: this._defaultColor,
				fontFamily: 'Ubuntu, sans-serif'
			},
			label: {
				fontFamily: 'Ubuntu, sans-serif',
				fontColor: this._defaultColor,
				fontSize: 14,
				fontWeight: 'normal',
				fontStyle: 'normal',
				angle: 0
			},
			grid: {
				enable: false,
				color: 'rgba(0, 0, 0, 0.1)',
				thickness: 1
			},
			tick: {
				color: this._defaultColor,
				length: 12,
				thickness: 1
			},
			line: {
				color: this._defaultColor,
				thickness: 1
			}
		};
	}

	private _initAnnotation() {
		return {
			enable: false,
			type: 'solid',
			mode: 'vertical'
		};
	}

	/**
	 * Поиск свойств и присвоение новых значений объекту заголовка графика
	 * @param value - объект со свойствами, которые назначил разрабочтик
	 */
	_setPropertyChartTitle(value: DPChartTitle) {
		for (let key in value) {
			const prop = key as keyof DPChartTitle;
			this._chartTitle[prop] = value[prop] as any;
		}
		// this._drawChart();
	}

	/**
	 * Поиск свойств и присвоение новых значений объекту оси графика по Y
	 * @param value - объект или массив объектов со свойствами, которые назначил разрабочтик
	 */
	_setPropertyAxisY(value: DPChartAxisY | Array<DPChartAxisY>) {
		this._axisY = this._initAxis();
		if (!this._propsAxisY?.title?.fontFamily) this._propsAxisY = this._axisY as DPChartAxisY;
		if (Array.isArray(value)) {
			this._axisY = [];
			for (let i = 0; i < value.length; i++) {
				const model = value[i];
				this._axisY.push(structuredClone(this._propsAxisY));
				for (let key in model) {
					const prop = key as keyof DPChartAxisY;
					if (typeof model[prop] === 'object') {
						let obj = model[prop] as any;

						for (let property in obj) {
							const sourceObj = this._axisY[i][prop] as any;
							if (sourceObj) {
								sourceObj[property] = obj[property];
							}
						}
					} else {
						this._axisY[i][prop] = model[prop] as any;
					}
				}
			}
		} else {
			this._axisY = this._propsAxisY;
			for (let key in value) {
				const prop = key as keyof DPChartAxisY;
				if (typeof value[prop] === 'object') {
					let obj = value[prop] as any;
					for (let property in obj) {
						const sourceObj = this._axisY[prop] as any;
						if (sourceObj) {
							sourceObj[property] = obj[property];
						}
					}
				} else {
					this._axisY[prop] = value[prop] as any;
				}
			}
		}
	}

	/**
	 * Поиск свойств и присвоение новых значений объекту оси графика по X
	 * @param value - объект или массив объектов со свойствами, которые назначил разрабочтик
	 */
	_setPropertyAxisX(value: DPChartAxisX) {
		this._axisX = this._initAxis();
		for (let key in value) {
			const prop = key as keyof DPChartAxisX;
			if (typeof value[prop] === 'object') {
				let obj = value[prop] as any;
				for (let property in obj) {
					const sourceObj = this._axisX[prop] as any;
					if (sourceObj) {
						sourceObj[property] = obj[property];
					}
				}
			} else {
				this._axisX[prop] = value[prop] as any;
			}
		}
	}

	/**
	 * Поиск свойств и присвоение новых значений объекту легенды
	 * @param value - объект со свойствами, которые назначил разрабочтик
	 */
	_setPropertyChartLegend(value: DPChartLegend | null) {
		if (!this._Legend) {
			this._Legend = new ChartLegend(this);
		}

		for (let key in value) {
			const prop = key as keyof DPChartLegend;
			this._Legend._legend[prop] = value[prop] as any;
		}
	}

	_setPropertyAnnotation(value: DPChartAnnotation | null) {
		for (let key in value) {
			const prop = key as keyof DPChartAnnotation;
			this._annotation[prop] = value[prop] as any;
		}

		this._Tooltip.addMousedownListener();
	}

	/** Отрисовка элемента canvas */
	_render() {
		if (this._Elem) this._Elem.innerHTML = '';

		const card = document.createElement('div');
		card.classList.add('dp-chart-card');

		this._Canvas.classList.add('dp-chart-canvas');

		card.append(this._Tooltip._createTooltip());
		card.append(this._Canvas);
		card.append(this._Tooltip.Canvas);

		this._Elem?.append(card);

		this._resetProperties();

		this._setProxy();

		this._drawChart();

		this._Tooltip._addListeners();

		if (this._navigator) {
			card.append(this._Slider._init());
			this._Slider.onMove = (position: Array<number>) => this._onMoveSlider(position);
			this._Slider.render();
		}
	}

	/**
	 * Срабатываем при изменении позиции слайдера
	 * @param position - позиция слайдера
	 */
	private _onMoveSlider(position: Array<number>) {
		this._proxy.position = position;
	}

	_setProxy() {
		const _setAnimationFrame = () => {
			requestAnimationFrame(this._drawChart);
		};
		this._proxy = new Proxy(
			{},
			{
				set(...arg) {
					const result = Reflect.set(...arg);
					_setAnimationFrame();
					return result;
				}
			}
		);
	}

	/**
	 * Установить размер компонента
	 * @returns выходит из метода, если компонент отсутствует
	 */
	private _setChartSize() {
		this._ratio = window.devicePixelRatio || 1;

		this._width = this._Elem.clientWidth;
		this._height = this._Elem.clientHeight;

		this._dpiWidth = Math.floor(+this._width * this._ratio);
		this._dpiHeight = Math.floor(+this._height * this._ratio);

		this._Canvas.width = this._dpiWidth;
		this._Canvas.height = this._dpiHeight;

		this._Canvas.style.width = `${this._width}px`;
		this._Canvas.style.height = `${this._height}px`;

		this._ctx.setTransform(1, 0, 0, 1, 0, 0);
		this._ctx.scale(this._ratio, this._ratio);

		this._viewHeight = this._dpiHeight - (this._padding + this._paddingBottom);
		this._viewWidth = Math.floor(this._dpiWidth - (this._paddingLeft + this._paddingRight));

		this._ctx.lineCap = 'round';
		this._ctx.lineJoin = 'round';

		this._setBackground();

		this._Tooltip.setStylePointCanvas();

		this._resize();
	}

	private _setBackground() {
		this._ctx.fillStyle = this._backgroundColor;
		this._ctx.fillRect(0, 0, this._dpiWidth, this._dpiHeight);

		const parentElem = this._Elem.parentElement;
		if (parentElem && this._substrateColor) parentElem.style.background = this._substrateColor;
	}

	// private _resize = () => {
	//     this._resetProperties();
	//     this._setChartSize();
	//     this._drawChart();
	// }

	private _resize() {
		if (this._resizeObserver) this._resizeObserver.disconnect();
		this._resizeObserver = new ResizeObserver(entries => {
			for (const entry of entries) {
				let size = [];
				size = [this._Elem.clientWidth, this._Elem.clientHeight];
				if (entry.contentBoxSize) {
					const diff = [size[0] - this._elemSize[0], size[1] - this._elemSize[1]];
					if (Math.abs(diff[0]) > 3 || Math.abs(diff[1]) > 3) {
						if (entry.target === this._Elem) {
							this._resetProperties();
							this._setChartSize();
							this._drawChart();
							this._elemSize = [size[0], size[1]];
						}
					}
				}
			}
		});

		this._resizeObserver.observe(this._Elem);
	}

	/**
	 * Нарисовать диаграмму
	 * @returns выходит из метода, если контекст отсутствует
	 */
	_drawChart = () => {
		this._clearCanvas();

		const data = this._data[0]?.dataPoints;

		if (this._data[0]?.showLegend && !this._Legend) {
			this._Legend = new ChartLegend(this);
		}

		if (!data?.length) return;

		this._resetProperties();

		this._setMinMax();

		this._setPaddings();
		this._setChartSize();

		this._xRatio = this._viewWidth / (data.length - 1);

		this._drawAxisY();

		this._ctx.beginPath();
		this._drawAxisX();
		this._ctx.closePath();

		this._drawData();

		this._drawTitle();

		this._drawAxisXTitle();
	};

	/** Обнуляем свойства */
	private _resetProperties() {
		this._renderedData = [];
		this._minmaxXAxis = [];
		this._minmaxYAxis = [];
		this._niceYLabels = [];
		this._widthBar = 0;
		this._axisYMax = null;
		this._axisYMin = null;
		this._paddingLeft = 30;
		this._paddingRight = 30;
		this._paddingBottom = 20;
		this._padding = 20;
		this._xLabelWidth = 0;
		this._axisYPrevSizes = {
			leftAxis: 0,
			rightAxis: 0
		};
		this._isNullData = false;
	}

	/**
	 * Понижение дискретизации
	 * @param data - данные x,y
	 * @param threshold - порог понижения дискретизации
	 * @returns
	 */
	largestTriangleThreeBuckets(data: any, threshold: number) {
		let floor = Math.floor,
			abs = Math.abs;

		let data_length = data.length;
		if (threshold >= data_length || threshold === 0) {
			return data; // Nothing to do
		}

		let sampled = [],
			sampled_index = 0;

		// Bucket size. Leave room for start and end data points
		let every = (data_length - 2) / (threshold - 2);

		let a = 0, // Initially a is the first point in the triangle
			max_area_point = 0,
			max_area = 0,
			area = 0,
			next_a = 0;

		sampled[sampled_index++] = data[a]; // Always add the first point

		for (let i = 0; i < threshold - 2; i++) {
			// Calculate point average for next bucket (containing c)
			let avg_x = 0,
				avg_y = 0,
				avg_range_start = floor((i + 1) * every) + 1,
				avg_range_end = floor((i + 2) * every) + 1;
			avg_range_end = avg_range_end < data_length ? avg_range_end : data_length;

			let avg_range_length = avg_range_end - avg_range_start;

			for (; avg_range_start < avg_range_end; avg_range_start++) {
				avg_x += data[avg_range_start][0] * 1; // * 1 enforces Number (value may be Date)
				avg_y += data[avg_range_start][1] * 1;
			}
			avg_x /= avg_range_length;
			avg_y /= avg_range_length;

			// Get the range for this bucket
			let range_offs = floor((i + 0) * every) + 1,
				range_to = floor((i + 1) * every) + 1;

			// Point a
			let point_a_x = data[a][0] * 1, // enforce Number (value may be Date)
				point_a_y = data[a][1] * 1;

			max_area = area = -1;

			for (; range_offs < range_to; range_offs++) {
				// Calculate triangle area over three buckets
				area =
					abs(
						(point_a_x - avg_x) * (data[range_offs][1] - point_a_y) -
							(point_a_x - data[range_offs][0]) * (avg_y - point_a_y)
					) * 0.5;
				if (area > max_area) {
					max_area = area;
					max_area_point = data[range_offs];
					next_a = range_offs; // Next a is this b
				}
			}

			sampled[sampled_index++] = max_area_point; // Pick this point from the bucket
			a = next_a; // This a is the next a (chosen b)
		}

		sampled[sampled_index++] = data[data_length - 1]; // Always add last

		return sampled;
	}

	/**
	 * Нарисовать линию по координатам
	 * @param ctx  - контекст canvas
	 * @returns
	 */
	private _drawData = () => {
		if (!this._data?.length) return;

		for (let i = 0; i < this._data.length; i++) {
			const model = this._data[i];

			let dataPoints = model.dataPoints;

			if (this._proxy.position) {
				dataPoints = this._definePosition(dataPoints);
			}

			// Рассчитал соотношение для корректной отрисовки графика
			this._yRatio = this._viewHeight / this._minmaxYAxis[i].diff;

			const coords = this._getCorrectData(dataPoints, i);

			this._pushRenderedData(model, coords);

			this._defineChartType(model, coords, i);
		}

		if (this._data[0]?.showLegend) this._Legend?.draw();
	};

	private _getCurrentPoints() {
		let max = 0;
		let currentPoints: any = null;

		for (let i = 0; i < this._data.length; i++) {
			if (max < this._data[i].dataPoints.length) {
				max = this._data[i].dataPoints.length;
				currentPoints = this._data[i].dataPoints;
			}
		}

		return currentPoints;
	}

	/** Определяем количество элементов, отоносительно позиции слайдера */
	private _definePosition(points: any) {
		let leftIndex = Math.round((points.length * this._proxy.position[0]) / 100);
		let rightIndex = Math.round((points.length * this._proxy.position[1]) / 100);

		if (rightIndex < 3) rightIndex = 3;

		let dataPoints = points.slice(leftIndex, rightIndex);

		this._xRatio = this._viewWidth / (dataPoints.length - 1);

		return dataPoints;
	}

	/** Заполняем массив отрисованных данных, для корректного отображения tooltip */
	private _pushRenderedData(model: DPChartDataSeries, coords: Array<DPChartPoints>) {
		const calcDataModel = {
			data: {
				props: {
					name: model.name,
					lineColor: model.lineColor
				},
				points: coords
			}
		} as DPChartCalcData;

		this._renderedData.push(calcDataModel);
	}

	/** Определяем тип диаграммы */
	private _defineChartType(model: DPChartDataSeries, coords: Array<DPChartPoints>, i: number) {
		if (model.type === 'column') {
			this._type = 'column';
			this._drawBar(model, coords, i);
		} else {
			this._type = model.type || 'line';

			if (model.type === 'scatter') {
				this._drawScatter(this._ctx, model, coords);
			} else {
				this._drawLine(model, coords);
			}
		}
	}

	/**
	 * Отрисовываем гистограмму
	 * @param model  - модель данных
	 * @param coords - массив точек с координатами
	 * @param index - индекс модели
	 */
	private _drawBar(model: DPChartDataSeries, coords: Array<DPChartPoints>, index: number) {
		const length = this._data.length;

		for (let i = 0; i < coords.length; i++) {
			let [x, , calcX, calcY] = coords[i];

			const padding = 100;

			const difWidth = (coords.length - 1) * padding;

			let columnWidth = (this._viewWidth - difWidth) / coords.length;

			calcX = i * (columnWidth + padding) + this._paddingLeft;
			const columnHeight = Math.round(this._viewHeight - calcY + this._padding);

			this._ctx.beginPath();

			this._ctx.strokeStyle = model.lineColor! || '#000000';
			this._ctx.fillStyle = model.lineColor! || '#000000';

			if (!model.stacked) columnWidth = columnWidth / length;
			if (i === 0 && index > 0 && !model.stacked) this._widthBar += columnWidth;

			this._ctx.fillRect(calcX + this._widthBar, calcY, columnWidth, columnHeight);

			this._ctx.closePath();
		}
	}

	/**
	 * Отрисовываем линейный график
	 * @param model - модель данных
	 * @param coords - массив точек с координатами
	 */
	private _drawLine(model: DPChartDataSeries, coords: Array<DPChartPoints>) {
		if (model.spline) {
			this._drawSplineCurve(coords, 1.5, model);
		} else if (model.stepped) {
			this._drawStepLine(coords, model);
		} else {
			this._drawLineCurve(coords, model);
		}
	}

	/**
	 * Отрисовываем фон диаграммы
	 * @param model - модель данных
	 * @param start - стартовая точка
	 * @param end - конечная точка
	 */
	_drawArea(model: DPChartDataSeries, start: number | null = null, end: number | null = null) {
		this._ctx.save();

		const startVertical = end || this._viewWidth + this._paddingLeft;
		const startHorizontal = start || 0 + this._paddingLeft;
		const endLine = this._viewHeight + this._padding;

		this._ctx.lineTo(startVertical, endLine);
		this._ctx.lineTo(startHorizontal, endLine);

		this._ctx.lineWidth = 0.1;

		if (model.fillOpacity) {
			this._ctx.globalAlpha = model.fillOpacity;
		} else {
			this._ctx.globalAlpha = 0.1;
		}

		this._ctx.fillStyle = model.fillColor || model.lineColor || '#00000';
		this._ctx.globalCompositeOperation = 'source-over';
		this._ctx.fill();
		this._ctx.globalCompositeOperation = 'source-over';

		this._ctx.restore();
	}

	/**
	 * Отрисовываем обычный линейный график
	 * @param coords - набор координат
	 * @param model - модель данных
	 * @param startIndex - начальный индекс, с которго начинается отрисовка элемента, по умолчанию - 0
	 */
	private _drawLineCurve(coords: Array<DPChartPoints>, model: DPChartDataSeries, startIndex: number = 0) {
		let startX = 0;
		let endX = 0;

		this._ctx.beginPath();
		let nullObj = { enabled: false, index: -1 };
		for (let i = startIndex; i < coords.length; i++) {
			let [, pointY, calcX, calcY] = coords[i];

			if (i === startIndex) startX = calcX;

			if (pointY === null) {
				calcY = pointY;
				nullObj.enabled = true;
				nullObj.index = i - 1;
				const diff = calcX - endX;

				endX = calcX - diff;
				break;
			}

			endX = calcX;

			if (model.lineType) {
				if (model.lineType === 'dash') {
					this._ctx.setLineDash([10, 10]);
				} else if (model.lineType === 'dot') {
					this._ctx.setLineDash([1, 15]);
				}
			}

			this._ctx.lineTo(calcX, calcY);
		}

		this._ctx.lineWidth = model.lineWidth || 2;
		if (model.lineColor) this._ctx.strokeStyle = model.lineColor;

		this._ctx.lineCap = 'round';
		this._ctx.stroke();
		if (model.fillArea) {
			if (nullObj.index > -1) {
				this._drawArea(model, startX, endX);
			} else {
				if (startIndex > 0) {
					this._drawArea(model, startX, endX);
				} else {
					this._drawArea(model);
				}
			}
		}
		this._ctx.closePath();

		if (nullObj.enabled) {
			this._isNullData = true;
			this._drawNullData(nullObj, coords, model);
			this._drawLineCurve(coords, model, nullObj.index + 2);
		}

		if (model.marker?.enabled) {
			this._drawScatter(this._ctx, model, coords);
		}
	}

	/**
	 * Отрисовываем пунктирную линию за место некачественных данных
	 * @param nullObj - объект, содержащий индекс элемента, у которого некачественные данные
	 * @param coords - набор координат
	 * @param model - модель данных
	 * @returns если, набор кооридант пуст, возвращает false
	 */
	private _drawNullData(nullObj: any, coords: Array<DPChartPoints>, model: DPChartDataSeries) {
		if (!coords.length || model.nullData?.lineType === 'none') return;

		this._ctx.beginPath();
		this._ctx.save();
		for (let i = nullObj.index; i < nullObj.index + 3; i++) {
			if (!coords[i]) continue;
			const [, pointY, calcX, calcY] = coords[i];

			if (pointY === null) {
				continue;
			}

			if (model.nullData?.lineType === 'dash' || !model.nullData?.lineType) {
				this._ctx.setLineDash([15, 10]);
			} else if (model.nullData?.lineType === 'dot') {
				this._ctx.setLineDash([1, 15]);
			}
			this._ctx.lineTo(calcX, calcY);
		}

		this._ctx.strokeStyle = model.nullData.lineColor || model.lineColor || this._defaultColor;
		this._ctx.stroke();
		this._ctx.restore();
		this._ctx.closePath();
	}

	/**
	 * Отрисовываем сглаженный график
	 * @param coords - набор координат
	 * @param tension - степень сглаживания
	 * @param model - модель данных
	 */
	private _drawSplineCurve(coords: Array<DPChartPoints>, tension: number, model: DPChartDataSeries) {
		this._ctx.beginPath();

		const [, , calcXFirst, calcYFirst] = coords[0];
		this._ctx.moveTo(calcXFirst, calcYFirst);

		for (let i = 0; i < coords.length - 1; i++) {
			const [, , calcX, calcY] = coords[i];

			const [, , calcX1, calcY1] = coords[i + 1];

			const xc = (calcX + calcX1) / 2;
			const yc = (calcY + calcY1) / 2;

			const cp_x1 = (xc + calcX) / 2;
			const cp_x2 = (xc + calcX1) / 2;

			this._ctx.quadraticCurveTo(cp_x1, calcY, xc, yc);

			this._ctx.quadraticCurveTo(cp_x2, calcY1, calcX1, calcY1);
		}

		this._ctx.lineWidth = model.lineWidth || 3;
		if (model.lineColor) this._ctx.strokeStyle = model.lineColor;
		this._ctx.stroke();

		if (model.fillArea) this._drawArea(model);
		this._ctx.closePath();

		if (model.marker?.enabled) {
			this._drawScatter(this._ctx, model, coords);
		}
	}

	/**
	 * Отрисовываем ступенчатый график
	 * @param coords - набор координат
	 * @param model - модель данных
	 */
	private _drawStepLine(coords: Array<DPChartPoints>, model: DPChartDataSeries) {
		this._ctx.beginPath();

		for (let i = 0; i < coords.length; i++) {
			let [, pointY, calcX, calcY] = coords[i];

			if (!pointY) calcY = pointY;

			if (!coords[i + 1]) break;
			const [, , xTo, Y] = coords[i + 1];

			this._ctx.moveTo(calcX, calcY);
			this._ctx.lineTo(calcX, Y);

			this._ctx.moveTo(calcX, Y);
			this._ctx.lineTo(xTo, Y);
		}

		this._ctx.lineWidth = model.lineWidth || 3;
		if (model.lineColor) this._ctx.strokeStyle = model.lineColor;
		this._ctx.stroke();

		this._ctx.closePath();

		if (model.marker?.enabled) {
			this._drawScatter(this._ctx, model, coords);
		}
	}

	/**
	 * Отрисовываем точечную диаграмму
	 * @param ctx - контекст
	 * @param model - модель данных
	 * @param coord - набор координат
	 */
	private _drawScatter(ctx: CanvasRenderingContext2D, model: DPChartDataSeries, coord: Array<DPChartPoints>) {
		for (let i = 0; i < coord.length; i++) {
			const [, pointY, calcX, calcY] = coord[i];

			if (!pointY) continue;

			ctx.beginPath();

			let size = model.marker?.size;

			if (size === undefined) size = model.marker?.type === 'circle' ? 2 : 5;

			if (!model.marker?.type) {
				ctx.ellipse(calcX, calcY, size, size, 0, 0, Math.PI * 2);
			} else {
				switch (model.marker?.type) {
					case 'circle':
						ctx.ellipse(calcX, calcY, size, size, 0, 0, Math.PI * 2);
						break;
					case 'square':
						ctx.rect(calcX - size / 2, calcY - size / 2, size, size);
						break;
					case 'triangle':
						ctx.lineCap = 'butt';
						ctx.lineJoin = 'miter';
						const X = calcX - size / 2;
						const Y = calcY - size / 2;
						ctx.lineTo(X + size / 2, Y);
						ctx.lineTo(X + size, Y + size);
						ctx.lineTo(X, Y + size);
						break;
					case 'cross':
						ctx.moveTo(calcX - size, calcY - size);
						ctx.lineTo(calcX + size, calcY + size);

						ctx.moveTo(calcX + size, calcY - size);
						ctx.lineTo(calcX - size, calcY + size);

						ctx.lineWidth = size ? size / 2 : 5;
				}
			}

			ctx.strokeStyle = model.marker?.color || model.lineColor || this._defaultColor;
			ctx.fillStyle = model.marker?.color || model.lineColor || this._defaultColor;

			ctx.fill();
			ctx.stroke();
			ctx.closePath();
		}
	}

	private _setPaddings() {
		this._padding = 20;
		this._paddingBottom = 20;
		this._setAxisYPadding();
		this._setTitlePadding();
		this._setXLabelPadding();
		if (this._data[0]?.showLegend) this._Legend?.changePaddings();
		if (this._navigator) this._Slider._setPaddings();
	}

	private _setTitlePadding() {
		const vert = this._chartTitle.verticalAlign;
		const hoz = this._chartTitle.horizontalAlign;

		if (vert === 'top' || (vert === 'center' && hoz === 'center')) {
			this._padding += this._chartTitle.fontSize!;
		} else if (vert === 'bottom') {
			this._paddingBottom += this._chartTitle.fontSize! + 10;
		}

		if ((vert === 'center' && hoz === 'left') || (vert === 'center' && hoz === 'right')) {
			const width = this._chartTitle.fontSize!;

			if (hoz === 'left') this._paddingLeft += width;
			if (hoz === 'right') this._paddingRight += width;
		}

		if (this._axisX.title?.name) {
			this._paddingBottom += this._axisX.title.fontSize!;
		}
	}

	private _setAxisYPadding() {
		this._paddingLeft = 0;
		this._paddingRight = 0;

		for (let i = 0; i < this._data.length; i++) {
			if (Array.isArray(this._axisY)) {
				if (this._axisY[i]) {
					this._setLRPadding(this._axisY[i], i, true);
				} else {
					this._setLRPadding(this._propsAxisY, i);
				}
			} else {
				this._setLRPadding(this._axisY, i);
			}
		}

		if (!this._paddingLeft) this._paddingLeft = 30;
		if (!this._paddingRight) this._paddingRight = 30;
	}

	private _setLRPadding(axis: DPChartAxisY, i: number, isArray: boolean = false) {
		const model = this._data[i];
		if (!model) return;

		let props = axis || this._propsAxisY;
		this._setAxisTextParams(props, 'label');

		const labelMaxLength = this._getLabelMaxLength(i, props);
		const size = this._axisYPaddings.sum() + props.tick?.length! + labelMaxLength;

		if (model.axisYType === 'secondary') {
			if (!isArray && this._paddingRight > 30) return;
			this._paddingRight += size;
			if (props.title?.name) {
				this._paddingRight += props.title.fontSize!;
			}
			this._renderedAxisY.push({ id: i, position: 'right' });
		} else {
			if (!isArray && this._paddingLeft > 30) return;
			this._paddingLeft += size;
			if (props.title?.name) {
				this._paddingLeft += props.title.fontSize!;
			}
			this._renderedAxisY.push({ id: i, position: 'left' });
		}

		if (props.label?.fontSize && i === 0) {
			this._padding += props.label.fontSize;
		}
	}

	private _setXLabelPadding() {
		const labelAngle = this._axisX.label?.angle!;

		this._setAxisTextParams(this._axisX, 'label');

		let text: any = this._minmaxXAxis[0].max;
		if (this._data[0].xValueType === 'dateTime') {
			const format = this._data[0].xValueFormat || 'dd.MM.yyyy HH:mm';
			text = this._Date._getTimeStampDate(format, text);
		} else {
			if (typeof text === 'number') {
				text = text.toFixed(this._axisX.countSymbols || 0);
			}
		}

		const width = this._ctx.measureText(String(text)).width;

		let angle = ((90 - labelAngle) * Math.PI) / 180;
		let y = width * Math.cos(angle);

		// if (labelAngle > 90) {
		//     y += this._axisX.label!.fontSize!;
		// }

		if (labelAngle > 180) {
			y = -y + this._axisX.label!.fontSize!;
		}

		if (labelAngle > 10 && labelAngle < 359) {
			this._xLabelWidth = y + this._axisX.label!.fontSize!;
			this._paddingBottom += y + this._axisX.label!.fontSize!;
		} else {
			this._paddingBottom += this._axisX.label!.fontSize!;
		}
	}

	/** Рисуем заголовок графика */
	private _drawTitle() {
		this._ctx.beginPath();

		this._ctx.font = `${this._chartTitle.fontStyle} ${this._chartTitle.fontWeight} ${this._chartTitle.fontSize}px ${this._chartTitle.fontFamily}, sans-serif`;
		this._ctx.strokeStyle = '#000';
		this._ctx.fillStyle = this._chartTitle.fontColor || '#000';

		const value = this._chartTitle.text;

		const hoz = this._chartTitle.horizontalAlign;
		const vert = this._chartTitle.verticalAlign;

		if (!value) return;

		this._ctx.save();
		this._ctx.textAlign = 'center';

		let rotate = 0;
		let x = 0;
		let y = 0 + this._chartTitle.fontSize!;

		// if (this._Legend?._legend) {
		//     if (this._Legend?._legend.verticalAlign === 'top') {
		//         if (this._chartTitle.fontSize) y = this._chartTitle.fontSize
		//     }
		// }

		const width = this._ctx.measureText(value).width;

		if (vert === 'bottom') {
			y = this._dpiHeight - 10;

			if (this._navigator) {
				y -= +this._Slider.height!;
			}
		}

		if (hoz === 'left') {
			this._ctx.textAlign = 'left';
			x = 0;
		} else if (hoz === 'right') {
			this._ctx.textAlign = 'left';
			x = this._dpiWidth - width;
		} else {
			x = this._dpiWidth / 2;
		}

		let isAlignCenter = false;

		if (vert === 'center' && hoz === 'right') {
			this._ctx.textAlign = 'center';
			x = this._dpiWidth - this._chartTitle.fontSize!;
			y = this._dpiHeight / 2;
			rotate = 1.58;
			isAlignCenter = true;
			this._ctx.translate(x, y);
			this._ctx.rotate(rotate);
		} else if (vert === 'center' && hoz === 'left') {
			this._ctx.textAlign = 'center';
			x = this._chartTitle.fontSize!;
			y = this._dpiHeight / 2;
			rotate = -Math.PI / 2;
			isAlignCenter = true;
			this._ctx.translate(x, y);
			this._ctx.rotate(rotate);
		}

		if (isAlignCenter) {
			this._ctx.fillText(value.toString(), 0, 0);
		} else {
			this._ctx.fillText(value.toString(), x, y);
		}

		this._ctx.restore();
		this._ctx.closePath();
	}

	/**
	 * Получаем рассчитанные данные для отрисовки графика
	 * @param dataPoints - массив данных (точек)
	 * @returns рассчитанные данные
	 */
	_getCorrectData(dataPoints: Array<number> | Array<DPChartDataPoints> | Array<number[]>, index?: number) {
		let data = [];

		for (let i = 0; i < dataPoints?.length; i++) {
			let points = dataPoints[i];

			if (points) {
				const { pointX, pointY } = initTypePoints(points!);

				const coord = this._getCalcCoord(i, pointX, pointY, index);

				data.push(coord);
			}
		}

		if (this._downsampled) data = this.largestTriangleThreeBuckets(data, 1000);

		return data;
	}

	/**
	 * Получаем рассчитанные координаты
	 * @param i - индекс элемента в базе данных
	 * @param pointY - координата по оси Y
	 * @returns рассчитанные координаты
	 */
	private _getCalcCoord(i: number, pointX: number, pointY: number, index?: number) {
		let xCalc = Math.floor(i * this._xRatio + this._paddingLeft);
		let yCalc = Math.floor(
			this._dpiHeight - this._paddingBottom - (pointY - this._minmaxYAxis[index!].min) * this._yRatio
		);
		return [pointX, pointY, xCalc, yCalc];
	}

	/**
	 * Нарисовать сетку диаграммы по оси y
	 * @param ctx  - контекст canvas
	 * @param type - тип оси, по умолчанию - y
	 * @returns выходит из метода если контекст отсутствует
	 */
	private _drawAxisY() {
		for (let i = 0; i < this._data.length; i++) {
			const renderedAxis = this._renderedAxisY.find((item: any) => item.id === i);
			if (!renderedAxis) continue;

			const model = this._data[i];

			const step = this._niceYLabels[i].length - 1;
			const interval = this._viewHeight / step;

			this._drawAxisYLine(i, interval, step);

			this._drawAxisYLabel(i, model, interval, step);

			this._drawAxisYTitle(i);

			this._drawYVerticalLine(i, model);
		}
	}

	/**
	 *
	 * @param i - индекс модели данных
	 * @returns выходит из метода, если title отсутствует
	 */
	private _drawAxisYTitle(i: number) {
		this._ctx.beginPath();
		this._ctx.save();

		const renderedAxis = this._renderedAxisY.find((item: any) => item.id === i);
		if (!renderedAxis) return;

		let axis: DPChartAxisY | undefined;
		if (Array.isArray(this._axisY)) {
			axis = this._axisY[i];
		} else {
			axis = this._axisY;
		}

		if (!axis?.title?.name) return;

		let props = axis || this._propsAxisY;

		this._setAxisTextParams(props, 'label');
		const labelMaxLength = this._getLabelMaxLength(i, props);

		this._setAxisTextParams(props);
		const widthTitle = this._ctx.measureText(axis.title.name).width;
		const size = this._axisYPaddings.titlePadding / 2 + axis.tick?.length! + labelMaxLength;

		let x = this._paddingLeft - size - this._axisYPrevSizes.leftAxis;
		let y = this._dpiHeight / 2 + widthTitle / 2;
		let rotate = -Math.PI / 2;

		if (this._data[i].axisYType === 'secondary') {
			x = this._viewWidth + size + this._paddingLeft + this._axisYPrevSizes.rightAxis;
			y = this._dpiHeight / 2 - widthTitle / 2;
			rotate = 1.58;
		}

		this._ctx.translate(x, y);
		this._ctx.rotate(rotate);
		this._ctx.fillText(axis.title.name.toString(), 0, 0);
		this._ctx.restore();

		this._ctx.closePath();
	}

	/**
	 * Отрисовка вертикальных линий осей Y
	 * @param i - индекс модели данных
	 * @param model - модель данных
	 * @param max - максимальное значение данных
	 * @param prevSizes - прдыдущие значения размеров осей для корректной отрисовки последующей
	 */
	private _drawYVerticalLine(i: number, model: DPChartDataSeries) {
		let axis: DPChartAxisY | undefined;
		let x = this._paddingLeft;

		this._ctx.beginPath();

		if (Array.isArray(this._axisY)) {
			if (this._axisY[i]) axis = this._axisY[i];
		} else {
			axis = this._axisY;
		}

		if (!axis) return;

		this._setAxisTextParams(axis, 'label');
		const labelMaxLength = this._getLabelMaxLength(i, axis);
		const size = this._axisYPaddings.sum() + axis.tick?.length! + labelMaxLength + axis.title?.fontSize;

		if (model.axisYType === 'secondary') {
			x = Math.floor(this._dpiWidth - this._paddingRight + this._axisYPrevSizes.rightAxis);
			this._axisYPrevSizes.rightAxis += size;
		} else {
			x = Math.floor(this._paddingLeft - this._axisYPrevSizes.leftAxis);
			this._axisYPrevSizes.leftAxis += size;
		}

		// Отрисовка вертикальной линии
		this._ctx.moveTo(x + 0.5, this._padding);
		this._ctx.lineTo(x + 0.5, this._dpiHeight - this._paddingBottom);
		this._ctx.lineWidth = 1;
		this._ctx.strokeStyle = axis.line?.color || model.lineColor || this._defaultColor;
		this._ctx.stroke();

		this._ctx.closePath();

		const type = model.axisYType || 'first';
		this._drawAxisYTick(i, type, x);
	}

	/**
	 * Получаем длину максимального текста
	 * @param i - индекс модели данных
	 * @returns длину значения
	 */
	private _getLabelMaxLength(i: number, axis: DPChartAxisY | DPChartAxisX) {
		const countSymbols = axis?.countSymbols || 0;
		const maxText = this._minmaxYAxis[i].max;
		const minText = this._minmaxYAxis[i].min;

		const maxTextLength = this._ctx.measureText(String(maxText.toFixed(countSymbols))).width + 10;
		const minTextLength = this._ctx.measureText(String(minText.toFixed(countSymbols))).width + 10;

		return maxTextLength > minTextLength ? maxTextLength : minTextLength;
	}

	/**
	 * Отрисовка отрезков на оси Y
	 * @param d - индекс модели данных
	 * @param type - тип оси, правый или левый
	 * @param x - позиция отрезка по оси X
	 */
	private _drawAxisYTick(d: number, type: string = 'first', x: number) {
		const step = this._niceYLabels[d].length - 1;
		const interval = this._viewHeight / step;

		this._ctx.save();
		this._ctx.beginPath();
		this._ctx.lineWidth = 1;

		let tickLength = 10;

		let xEnd = x - tickLength;

		if (type === 'secondary') {
			xEnd = x + tickLength;
		}

		for (let i = 0; i <= step; i++) {
			let y = Math.floor(interval * i + this._padding) + 0.5;

			if (Array.isArray(this._axisY)) {
				this._ctx.strokeStyle = this._axisY[d].tick?.color || this._defaultColor;
				tickLength = this._axisY[d].tick?.length!;
			} else {
				this._ctx.strokeStyle = this._axisY.tick?.color || this._defaultColor;
				tickLength = this._axisY.tick?.length!;
			}

			this._ctx.moveTo(x, y);
			this._ctx.lineTo(xEnd, y);
		}
		this._ctx.restore();
		this._ctx.stroke();
		this._ctx.closePath();
	}

	/**
	 * Отрисовка горизонтальных линий осей Y
	 * @param d - индекс модели данных
	 * @param interval - интервал, с которым отображаются label
	 * @param step - шаг с которым отображаются label
	 */
	private _drawAxisYLine(d: number, interval: number, step: number) {
		this._ctx.beginPath();

		let yBottom = 0;

		let axis = Array.isArray(this._axisY) ? this._axisY[d] : this._axisY;
		let gridColor = axis.grid?.color || '#000000';

		for (let i = 0; i <= step; i++) {
			let y = Math.floor(interval * i + this._padding) + 0.5;

			const x = Math.floor(this._viewWidth + this._paddingLeft);

			if (d === 0) {
				this._ctx.moveTo(Math.floor(this._paddingLeft), y);
				this._ctx.lineTo(x, y);
			}

			if (i === step + 1 && d === 0) {
				yBottom = y;
			}
		}

		this._ctx.strokeStyle = gridColor;
		this._ctx.lineWidth = 1;
		this._ctx.stroke();

		this._ctx.closePath();

		this._ctx.beginPath();
		this._drawBottomLine(yBottom);
		this._ctx.lineWidth = 1;
		this._ctx.stroke();
		this._ctx.closePath();
	}

	/**
	 * Отрисовка label по оси Y
	 * @param d - индекс модели данных
	 * @param model - модель данных
	 * @param interval - интервал, с которым отображаются label
	 * @param step - шаг с которым отображаются label
	 */
	private _drawAxisYLabel(d: number, model: DPChartDataSeries, interval: number, step: number) {
		this._niceYLabels[d].reverse();
		let axis = Array.isArray(this._axisY) ? this._axisY[d] : this._axisY;

		this._setAxisTextParams(axis, 'label');

		for (let i = 0; i <= step; i++) {
			this._ctx.save();
			this._ctx.textAlign = 'end';
			// this._ctx.textBaseline = 'middle'
			if (model.axisYType === 'secondary') this._ctx.textAlign = 'left';

			let y = interval * i;

			let value = this._niceYLabels[d][i];

			let x =
				this._paddingLeft -
				this._axisYPrevSizes.leftAxis -
				axis.tick?.length! -
				this._axisYPaddings.labelPadding;

			if (model.axisYType === 'secondary') {
				x =
					this._dpiWidth -
					this._paddingRight +
					this._axisYPrevSizes.rightAxis +
					axis.tick?.length! +
					this._axisYPaddings.labelPadding;
			}

			let angle;

			if (axis.label?.angle) {
				angle = (axis.label?.angle * Math.PI) / 180;
			}

			const fixedSymbols = axis.countSymbols || 0;

			if (angle) {
				const labelAngle = axis.label?.angle!;

				if (!model.axisYType || model.axisYType === 'primary') {
					if (labelAngle > 90 && labelAngle < 250) {
						this._ctx.textBaseline = 'top';
						this._ctx.textAlign = 'left';
					}
				} else {
					if (labelAngle > 90 && labelAngle < 250) {
						this._ctx.textBaseline = 'bottom';
						this._ctx.textAlign = 'right';
					}
				}

				this._ctx.translate(x, y + this._padding);
				this._ctx.rotate(angle);
				this._ctx.fillText(value.toFixed(fixedSymbols).toString(), 0, 0);
			} else {
				this._ctx.fillText(value.toFixed(fixedSymbols).toString(), x, y + this._padding);
			}
			this._ctx.restore();
		}
	}

	/**
	 * Отрисовка верхней линии
	 * @param y - позиция по Y
	 */
	private _drawBottomLine(y: number) {
		const paddingTop = this._dpiHeight - y - this._paddingBottom;
		const startLine = this._paddingLeft;
		const endLine = this._viewWidth + this._paddingLeft;

		this._ctx.strokeStyle = this._axisX.line?.color || this._defaultAxisColor;
		this._ctx.moveTo(startLine, paddingTop + 0.5);
		this._ctx.lineTo(endLine, paddingTop + 0.5);
	}

	/**
	 * Нарисовать сетку по оси X
	 * @param dataPoints  - данные
	 * @returns
	 */
	private _drawAxisX() {
		//* Требуется дороботка для корректного определения интервала

		const step = this._niceXLabels.length;

		let renderedLabels = [];

		let currentPoints = this._getCurrentPoints();

		if (this._proxy.position) {
			currentPoints = this._definePosition(currentPoints);
		}

		let interval = Math.round(currentPoints.length / step);

		for (let i = 0; i < currentPoints.length; i += interval) {
			if (interval === 0) interval = 1;

			const calcX = Math.floor(i * this._xRatio + this._paddingLeft);

			const { pointX, label } = initTypePoints(currentPoints[i]);

			renderedLabels.push([calcX, pointX, label]);
		}

		this._drawAxisXLabel(this._axisX, renderedLabels);
		if (this._axisX.grid?.enable) this._drawAxisXLine(renderedLabels);
	}

	private _drawAxisXTitle() {
		if (!this._axisX.title?.name) return;

		this._ctx.beginPath();
		this._ctx.save();
		this._setAxisTextParams(this._axisX);

		this._ctx.textAlign = 'center';

		let x = this._dpiWidth / 2;

		let tickLength = 10;
		let padding = 10;

		let viewHeight = this._viewHeight + this._padding + tickLength;

		if (this._xLabelWidth) {
			viewHeight += this._xLabelWidth;
		} else {
			viewHeight += this._xLabelHeight + 5;
		}

		let actualHeight = this._getActualTextHeight(this._axisX.title.name);

		let y = viewHeight + actualHeight + padding;

		this._ctx.fillText(this._axisX.title.name.toString(), x, y);

		this._ctx.restore();
		this._ctx.closePath();
	}

	/**
	 * Получаем корректную высоту текста
	 * @param text - текст
	 * @returns корректную высоту
	 */
	private _getActualTextHeight(text: string) {
		let metrics = this._ctx.measureText(text);
		return metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
	}

	private _drawAxisXLabel(axis: DPChartAxisX, renderedLabels: Array<any>) {
		this._drawAxisXTick(renderedLabels);

		this._setAxisTextParams(axis, 'label');

		let widthAllText = 0;

		widthAllText = this._getXLabelWidth(widthAllText, renderedLabels);

		for (let i = 0; i < renderedLabels.length; i++) {
			this._ctx.beginPath();
			this._ctx.save();

			let [calcX, pointX, label] = renderedLabels[i];

			let text: any = label || pointX;

			if (this._data[0].xValueType === 'dateTime' && !label) {
				const format = this._data[0].xValueFormat || 'dd.MM.yyyy HH:mm';

				text = this._Date._getTimeStampDate(format, pointX);
			} else {
				if (typeof text === 'number') {
					text = text.toFixed(axis.countSymbols || 0);
				}
			}

			this._ctx.textAlign = 'center';

			let tickLength = 10;
			let padding = 5;
			let angle = 0;

			if (this._axisX.label?.angle) {
				angle = (this._axisX.label?.angle * Math.PI) / 180;
			}

			let actualHeight = this._getActualTextHeight(text);

			this._xLabelHeight = actualHeight;

			let y = this._viewHeight + this._padding + tickLength + padding + actualHeight;

			if (angle || widthAllText > this._viewWidth) {
				const labelAngle = this._axisX.label?.angle!;

				if (labelAngle > 0 && labelAngle < 130) {
					this._ctx.textAlign = 'start';
					this._ctx.textBaseline = 'middle';
				} else if (labelAngle >= 130 && labelAngle < 181) {
					this._ctx.textAlign = 'left';
					this._ctx.textBaseline = 'top';
				} else if (labelAngle >= 181 && labelAngle <= 359) {
					this._ctx.textAlign = 'right';
					this._ctx.textBaseline = 'middle';
				}

				if (widthAllText > this._viewWidth && !angle) {
					angle = 6;
				}
				this._ctx.translate(calcX, y);
				this._ctx.rotate(angle);
				this._ctx.fillText(text.toString(), 0, 0);
			} else {
				this._ctx.fillText(text.toString(), calcX, y);
			}

			this._ctx.restore();
			this._ctx.stroke();
			this._ctx.closePath();
		}
	}

	private _drawAxisXLine(renderedLabels: Array<any>) {
		this._ctx.beginPath();
		for (let i = 0; i < renderedLabels.length; i++) {
			const [calcX] = renderedLabels[i];

			let yStart = Math.floor(this._padding);

			let yEnd = Math.floor(this._dpiHeight - this._paddingBottom);

			const secondaryAxis = this._data.find((item: any) => item.axisYType === 'secondary');

			if (i > 0 && i < renderedLabels.length) {
				if (i === renderedLabels.length - 1 && secondaryAxis) break;
				this._ctx.moveTo(calcX + 0.5, yStart);
				this._ctx.lineTo(calcX + 0.5, yEnd);
			}
		}

		this._ctx.strokeStyle = this._axisX.grid?.color || '#000000';
		this._ctx.lineWidth = 1;
		this._ctx.stroke();
	}

	private _drawAxisXTick(renderedLabels: Array<any>) {
		this._ctx.beginPath();

		for (let i = 0; i < renderedLabels.length; i++) {
			const [calcX] = renderedLabels[i];

			let yStart = Math.floor(this._dpiHeight - this._paddingBottom);
			let yEnd = Math.floor(this._dpiHeight - this._paddingBottom + 10);

			this._ctx.moveTo(calcX + 0.5, yStart);
			this._ctx.lineTo(calcX + 0.5, yEnd);
		}
		this._ctx.lineWidth = 1;
		this._ctx.strokeStyle = '#000000';
		this._ctx.stroke();
		this._ctx.closePath();
	}

	private _getXLabelWidth(widthAllText: number, renderedLabels: Array<any>) {
		for (let i = 0; i < renderedLabels.length; i++) {
			let [, pointX, label] = renderedLabels[i];

			let text: any = label || pointX;

			if (this._data[0].xValueType === 'dateTime' && !label) {
				const format = this._data[0].xValueFormat || 'dd.MM.yyyy HH:mm';

				text = this._Date._getTimeStampDate(format, pointX);
			}

			widthAllText += this._ctx.measureText(text).width;
		}

		return widthAllText;
	}

	private _setAxisTextParams(axis: DPChartAxisX | DPChartAxisY, param: string = 'title') {
		let style = param === 'title' ? axis.title?.fontStyle : axis.label!.fontStyle;
		let weight = param === 'title' ? axis.title?.fontWeight : axis.label!.fontWeight;
		let size = param === 'title' ? axis.title?.fontSize : axis.label!.fontSize;
		let family = param === 'title' ? axis.title?.fontFamily : axis.label!.fontFamily;
		let color = param === 'title' ? axis.title?.fontColor : axis.label!.fontColor;

		this._ctx.font = `${style} ${weight} ${size}px ${family}`;
		this._ctx.strokeStyle = color || '#000';
		this._ctx.fillStyle = color || '#000';
	}

	/** Определить минимальное и максимальное значение */
	private _setMinMax(dataPoints?: Array<number> | Array<DPChartDataPoints> | Array<number[]>) {
		// if (typeof this._axisY.max === 'number') this._axisMax = this._axisY.max
		// if (typeof this._axisY.min === 'number') this._axisMin = this._axisY.min

		if (!dataPoints) {
			for (const model of this._data) {
				if (this._proxy.position) {
					let leftIndex = Math.round((model.dataPoints.length * this._proxy.position[0]) / 100);
					let rightIndex = Math.round((model.dataPoints.length * this._proxy.position[1]) / 100);

					if (rightIndex < 3) rightIndex = 3;

					let data = model.dataPoints.slice(leftIndex, rightIndex);

					this._setMinMaxValue(data);
				} else {
					this._setMinMaxValue(model.dataPoints);
				}
			}
		} else {
			this._setMinMaxValue(dataPoints);
		}
	}

	private _setMinMaxValue(dataPoints: Array<number> | Array<DPChartDataPoints> | Array<number[]>) {
		let x = 0;
		let y = 0;
		let minY: number | null = null;
		let maxY: number | null = null;
		let minX: number | null = null;
		let maxX: number | null = null;

		for (const points of dataPoints) {
			if (typeof points === 'number') {
			} else if (Array.isArray(points)) {
				x = this._getTimestamp(points[0]) || 0;
				y = points[1] || 0;
			} else {
				x = this._getTimestamp(points.x) || 0;
				y = points.y || 0;
			}

			if (typeof minY !== 'number') minY = y;
			if (typeof maxY !== 'number') maxY = y;

			if (typeof minX !== 'number') minX = x;
			if (typeof maxX !== 'number') maxX = x;

			if (minY! > y) minY = y;
			if (maxY! < y) maxY = y;

			if (minX! > x) minX = x;
			if (maxX! < x) maxX = x;
		}

		for (let i = 0; i < 2; i++) {
			let type = '';

			if (i === 0) type = 'y';
			if (i > 0) type = 'x';

			let min = i === 0 ? minY : minX;
			let max = i === 0 ? maxY : maxX;

			const { niceMinimum, niceMaximum, tickSpacing } = this._niceScale(min!, max!, type);

			let minmax = i === 0 ? this._minmaxYAxis : this._minmaxXAxis;

			minmax.push({
				min: niceMinimum,
				max: niceMaximum,
				diff: niceMaximum - niceMinimum
			});

			if (i === 0) this._spacingAxisY = tickSpacing;
			if (i > 0) this._spacingAxisX = tickSpacing;
		}
	}

	private _getTimestamp(value: Date | number) {
		if (typeof value === 'number' || !value) return value;

		return Math.floor(value.getTime() / 1000);
	}

	private _niceScale(min: number, max: number, type: string) {
		let minPoint;
		let maxPoint;

		minPoint = min;
		maxPoint = max;
		const { niceMin, niceMax, tickSpacing } = this._calcNiceMinMax(minPoint, maxPoint, type);
		return {
			tickSpacing: tickSpacing,
			niceMinimum: niceMin,
			niceMaximum: niceMax
		};
	}

	private _calcNiceMinMax(minPoint: number, maxPoint: number, type: string) {
		if (type === 'x') this._niceXLabels = [];

		let tickSpacing;
		let range;
		let niceMin;
		let niceMax;
		let maxTicks = 10;

		range = this._niceNum(maxPoint - minPoint, false);

		tickSpacing = this._niceNum(range / (maxTicks - 1), true);

		if (type === 'x') {
			if (this._axisX.interval) {
				tickSpacing = this._axisX.interval;
			}
		} else {
			if (Array.isArray(this._axisY)) {
				if (this._axisY[0].interval) {
					tickSpacing = this._axisY[0].interval;
				}
			} else {
				if (this._axisY.interval) {
					tickSpacing = this._axisY.interval;
				}
			}
		}

		niceMin = Math.floor(minPoint / tickSpacing) * tickSpacing;
		niceMax = Math.ceil(maxPoint / tickSpacing) * tickSpacing;

		let niceLabels = [];

		if (type === 'y') {
			for (let i = niceMin; i <= niceMax; i += tickSpacing) {
				niceLabels.push(+i.toFixed(2));
			}
			this._niceYLabels.push(niceLabels);
		}

		if (type === 'x') {
			for (let i = minPoint; i < maxPoint; i += tickSpacing) {
				this._niceXLabels.push(+i.toFixed(2));
				// if (i + tickSpacing >= maxPoint) {
				//     this._niceXLabels.push(+maxPoint.toFixed(2));
				// }
			}
		}

		return { niceMin, niceMax, tickSpacing };
	}

	private _niceNum(localRange: number, round: boolean) {
		var exponent; /** exponent of localRange */
		var fraction; /** fractional part of localRange */
		var niceFraction; /** nice, rounded fraction */

		exponent = Math.floor(Math.log10(localRange));
		fraction = localRange / Math.pow(10, exponent);

		if (round) {
			if (fraction < 1.5) niceFraction = 1;
			else if (fraction < 3) niceFraction = 2;
			else if (fraction < 7) niceFraction = 5;
			else niceFraction = 10;
		} else {
			if (fraction <= 1) niceFraction = 1;
			else if (fraction <= 2) niceFraction = 2;
			else if (fraction <= 5) niceFraction = 5;
			else niceFraction = 10;
		}

		return niceFraction * Math.pow(10, exponent);
	}

	/** Очищаем график */
	private _clearCanvas() {
		this._ctx.clearRect(0, 0, this._dpiWidth, this._dpiHeight);
	}

	/** Удаляем слушатели событий */
	_destroy() {
		this._Canvas.removeEventListener('mousemove', this._Tooltip._mousemove);
		this._Canvas.removeEventListener('mouseleave', this._Tooltip._mouseleave);
		// this._Canvas.remove();
	}
}
