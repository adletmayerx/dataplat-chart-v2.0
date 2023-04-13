import { Chart } from '../core/dataplat.chart.core';
/// <reference path="./types/main.d.ts" />
/// <reference path="./types/core.d.ts" />
import { css, initTypePoints } from '../helpers/dataplat.chart.helpers';

export class ChartNavigator {
	_chart: Chart;
	_ctx: CanvasRenderingContext2D;

	padding: number;

	height: number | string | null;

	_width: number;
	_dpiHeight: number;
	_dpiWidth: number;
	_xRatio: number;
	_yRatio: number;
	_padding: number;
	_ratio: number;

	_startX: number;

	_defaultWidth: number;
	_minWidth: number;

	_Canvas: HTMLCanvasElement;
	_Slider: HTMLDivElement;
	_Container: HTMLDivElement;
	_ArrowLeft: HTMLDivElement;
	_ArrowRight: HTMLDivElement;
	_SideLeft: HTMLDivElement;
	_SideRight: HTMLDivElement;
	_Window: HTMLDivElement;

	onMove: Function | undefined;

	constructor(chart: Chart) {
		this._chart = chart;
		this._Canvas = document.createElement('canvas');
		this._Slider = document.createElement('div');
		this._ctx = this._Canvas.getContext('2d')!;
		this.height = 50;
		this._dpiHeight = 0;
		this._dpiWidth = 0;
		this._xRatio = 0;
		this._yRatio = 0;
		this._padding = 0;
		this._defaultWidth = 0;
		this._minWidth = 0;
		this._width = 0;
		this._ratio = 1;

		this._startX = 0;

		this.padding = 5;

		this._Container = document.createElement('div');
		this._ArrowLeft = document.createElement('div');
		this._ArrowRight = document.createElement('div');
		this._SideLeft = document.createElement('div');
		this._SideRight = document.createElement('div');
		this._Window = document.createElement('div');
	}

	/**
	 * Инициализируем слайдер
	 * @returns - DOM элемент слайдера
	 */
	_init(): HTMLDivElement {
		this._createSlider();
		this._setSize();
		return this._Slider;
	}

	render() {
		this._setPosition(0, +this._chart._width! - this._defaultWidth);
		this._drawData();
		this._addListeners();
	}

	_setPaddings() {
		this._chart._paddingBottom += +this.height! + this.padding;
	}

	/** Установить размеры слайдера */
	private _setSize(): void {
		this._ratio = window.devicePixelRatio || 1;

		this._width = +this._chart._viewWidth;

		this._dpiWidth = Math.floor(this._width * this._ratio);
		this._dpiHeight = Math.floor(+this.height! * this._ratio);

		this._Canvas.style.width = this._width + 'px';
		this._Canvas.style.height = this.height + 'px';

		this._Canvas.width = this._dpiWidth;
		this._Canvas.height = this._dpiHeight;

		this._minWidth = this._width * 0.001;

		this._defaultWidth = this._width * 1.11; // 30 %

		this._Container.style.width = this._width + 'px';
		this._Slider.style.paddingLeft = this._chart._paddingLeft + 'px';

		this._xRatio = this._chart._dpiWidth / (this._chart._data[0].dataPoints.length - 1);
	}

	/** Создать слайдер */
	private _createSlider() {
		this._Slider.classList.add('dp-chart-slider');
		this._Container.classList.add('dp-chart-slider-container');
		this._SideLeft.classList.add('dp-chart-slider-left');
		this._SideRight.classList.add('dp-chart-slider-right');
		this._Window.classList.add('dp-chart-slider-window');
		this._Window.dataset.type = 'window';
		this._fillSlider();
	}

	/**
	 * Наполняем слайдер составляющими элементами
	 * @param SlideElem  - элементы слайдера
	 */
	private _fillSlider() {
		let currentArrow = this._ArrowLeft;
		for (let i = 0; i < 2; i++) {
			if (i === 1) {
				currentArrow = this._ArrowRight;
			}

			currentArrow.innerHTML = '';

			currentArrow.classList.add('dp-resize-navigator');

			const span = document.createElement('span');
			span.classList.add('dp-resize-in');
			currentArrow.append(span);

			if (i < 1) {
				this._SideLeft.append(currentArrow);
				currentArrow.dataset.type = 'left';
				this._Container.append(this._Canvas, this._SideLeft, this._Window);
			} else {
				this._SideRight.append(currentArrow);
				currentArrow.dataset.type = 'right';
				this._Container.append(this._SideRight);
			}
		}
		this._Slider.append(this._Container);
	}

	private _drawData() {
		for (let i = 0; i < this._chart._data.length; i++) {
			const model = this._chart._data[i];

			this._yRatio = this._dpiHeight / this._chart._minmaxYAxis[i].diff;

			const coords = this._getCorrectData(model.dataPoints, i);

			this._drawLineSlider(this._ctx, model, coords);
		}
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

		data = this._chart.largestTriangleThreeBuckets(data, 1000);

		return data;
	}

	/**
	 * Получаем рассчитанные координаты
	 * @param i - индекс элемента в базе данных
	 * @param pointY - координата по оси Y
	 * @returns рассчитанные координаты
	 */
	private _getCalcCoord(i: number, pointX: number, pointY: number, index?: number) {
		let xCalc = Math.floor(i * this._xRatio);
		let yCalc = Math.floor(this._dpiHeight - (pointY - this._chart._minmaxYAxis[index!].min) * this._yRatio);
		return [pointX, pointY, xCalc, yCalc];
	}

	private _drawLineSlider(ctx: CanvasRenderingContext2D, model: DPChartDataSeries, coord: Array<number[]>) {
		let type = model.type || 'line';

		if (type === 'line') {
			this._drawTypeLine(ctx, model, coord);
		}
	}

	private _drawTypeLine(ctx: CanvasRenderingContext2D, model: DPChartDataSeries, coord: Array<number[]>) {
		ctx.beginPath();
		for (let i = 0; i < coord.length; i++) {
			const [, , calcX, calcY] = coord[i];
			ctx.lineTo(calcX, calcY);
		}

		ctx.lineWidth = 2;
		if (model.lineColor) ctx.strokeStyle = model.lineColor;

		ctx.stroke();
		this._drawArea(model);
		ctx.closePath();
	}

	/**
	 * Отрисовываем фон диаграммы
	 * @param model - модель данных
	 * @param start - стартовая точка
	 * @param end - конечная точка
	 */
	_drawArea(model: DPChartDataSeries, start: number | null = null, end: number | null = null) {
		this._ctx.save();

		const startVertical = end || this._dpiWidth;
		const startHorizontal = start || 0;
		const endLine = this._dpiHeight;

		this._ctx.lineTo(startVertical, endLine);
		this._ctx.lineTo(startHorizontal, endLine);

		this._ctx.lineWidth = 0.1;

		if (model.fillOpacity) {
			this._ctx.globalAlpha = model.fillOpacity;
		} else {
			this._ctx.globalAlpha = 0.5;
		}

		this._ctx.fillStyle = model.fillColor || model.lineColor || '#00000';
		this._ctx.globalCompositeOperation = 'source-over';
		this._ctx.fill();
		this._ctx.globalCompositeOperation = 'source-over';

		this._ctx.restore();
	}

	/**
	 * Срабатываем при нажатии на слайдер
	 * @param e - событие MouseEvent
	 * @returns
	 */
	private _mousedown = (e: MouseEvent) => {
		const elem = e.target as HTMLDivElement;

		let resizeBtn: HTMLDivElement | undefined = undefined;

		if (elem?.dataset.type) {
			resizeBtn = elem;
		} else {
			const el = elem.closest('.dp-resize-navigator') as HTMLDivElement;
			if (el) {
				resizeBtn = el;
			}
		}

		if (!resizeBtn) return;

		const dimensions = {
			wLeft: parseInt(this._Window.style.left),
			wRight: parseInt(this._Window.style.right),
			wWidth: parseInt(this._Window.style.width)
		} as sizeWindowSlider;

		this._move(resizeBtn.dataset.type!, e, dimensions);
	};

	/**
	 * Перемещаем слайдер
	 * @param type - тип элемента слайдера
	 * @param e - MouseEvent
	 * @param {wLeft, wRight, wWidth} - позиция окна слайдера
	 */
	private _move(type: string, e: MouseEvent, { wLeft, wRight, wWidth }: sizeWindowSlider) {
		let left = 0;
		let right = 0;
		const startX = e.pageX;
		document.onmousemove = e => {
			const delta = startX - e.pageX;
			if (!delta) return;

			if (type === 'window') {
				left = wLeft - delta;
				right = this._width - left - wWidth;
			} else if (type === 'left') {
				left = this._width - (wWidth + delta) - wRight;
				right = wRight;
			} else if (type === 'right') {
				right = this._width - (wWidth - delta) - wLeft;
				left = wLeft;
			}

			this._setPosition(left, right);
			if (typeof this.onMove === 'function') {
				this.onMove(this._getPosition());
			}
		};
	}

	/**
	 * Получаем текущую позицию слайдера для корректной отрисовки графика
	 * @returns [позиция слева, позиция справа]
	 */
	private _getPosition() {
		const left = parseInt(this._SideLeft.style.width);
		const right = this._width - parseInt(this._SideRight.style.width);

		return [(left * 100) / this._width, (right * 100) / this._width];
	}

	/**
	 * Устанавливаем позицию слайдера
	 * @param left - позиция слева
	 * @param right - позиция справа
	 * @returns выходи из функции, если не соответствует данным
	 */
	private _setPosition(left: number, right: number): void {
		const currentWidth = +this._width - right - left;

		if (currentWidth < this._minWidth) {
			this._Window.style.width = this._minWidth + 'px';
			css(this._Window, { width: this._minWidth + 'px' });
			return;
		}

		if (left < 0) {
			css(this._Window, { left: '0px' });
			css(this._SideLeft, { width: '0px' });
			return;
		}

		if (right < 0) {
			css(this._Window, { right: '0px' });
			css(this._SideRight, { width: '0px' });
			return;
		}

		css(this._Window, {
			width: currentWidth + 'px',
			left: left + 'px',
			right: right + 'px'
		});

		css(this._SideRight, { width: right + 'px' });
		css(this._SideLeft, { width: left + 'px' });
	}

	/** Удаляем слушатель события на документ при отпускании мыши */
	private _mouseup = () => {
		document.onmousemove = null;
	};

	/** Добавляем слушатели событий */
	private _addListeners(): void {
		this._Slider.addEventListener('mousedown', this._mousedown);
		document.addEventListener('mouseup', this._mouseup);
	}
}
