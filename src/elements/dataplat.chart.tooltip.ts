import { Chart } from '../core/dataplat.chart.core.js';
/// <reference path="./types/core.d.ts" />
import { ChartDate } from './dataplat.chart.date.js';

import { css } from '../helpers/dataplat.chart.helpers.js';

export class ChartToolTip {
	private readonly _chart: Chart;
	private readonly _ctx: CanvasRenderingContext2D;

	readonly Canvas: HTMLCanvasElement;

	private _tooltip: HTMLDivElement | undefined;
	private _annotationLabel: HTMLDivElement | undefined;
	private _Date: ChartDate;

	private _annotations: Array<DPChartAnnotationLine>;
	private _colorAnnotations: string;

	private readonly _padding: number;
	private _container: HTMLDivElement | undefined;

	constructor(chart: Chart) {
		this._chart = chart;

		this.Canvas = document.createElement('canvas');
		// this.Canvas.classList.add('dp-chart-canvas')
		this._ctx = this.Canvas.getContext('2d')!;
		this._Date = new ChartDate(this._chart);

		this._annotations = [];
		this._colorAnnotations = '#FF0000';
		this._padding = 50;
	}

	setStylePointCanvas() {
		css(this.Canvas, { position: 'absolute' });
		css(this.Canvas, { width: this._chart._width + 'px' });
		css(this.Canvas, { height: this._chart._height + 'px' });
		css(this.Canvas, { top: 0 });
		css(this.Canvas, { left: 0 });

		this.Canvas.width = +this._chart._dpiWidth;
		this.Canvas.height = +this._chart._dpiHeight;
	}

	/**
	 * Перемещение мыши над графиком
	 * @param param0 - координаты по X and Y
	 */
	_mousemove = (e: MouseEvent) => {
		const { left, top } = this.Canvas.getBoundingClientRect() as DOMRect;

		const mouseX = e.clientX - left;
		const mouseY = e.clientY - top;

		this._ctx.beginPath();

		this._defineToolTipItems(mouseX, mouseY);

		this._ctx.closePath();
	};

	private _defineToolTipItems(mouseX: number, mouseY: number, annotation?: boolean, props?: DPChartAnnotationLine) {
		let renderedData = this._chart._renderedData[0];

		let tooltipItems = [];

		if (annotation && props) {
			let index = this._getNearIndex(renderedData, mouseX, mouseY, props);

			tooltipItems = this._getToolTipItems(renderedData, index, true)!;

			props.label = {
				title: 'toolip',
				items: tooltipItems
			};

			console.log(tooltipItems);
		}

		for (let i = 0; i < renderedData.data.points.length; i++) {
			const [, , calcX, calcY] = renderedData.data.points[i];

			const dx = mouseX - calcX;
			const dy = mouseY - calcY / 2;

			if (dx * dx < this._chart._pointRadius) {
				tooltipItems = this._getToolTipItems(renderedData, i)!;

				if (!annotation) {
					this._drawXLine(calcX);
					if (this._chart._renderedData.length === 1) {
						this._drawYLine(calcY);
					}

					this._show(mouseY, mouseX, {
						title: 'toolip',
						items: tooltipItems
					});
				}
				return;
			}
		}
	}

	private _getToolTipItems(renderedData: DPChartCalcData, index: number, annotation?: boolean) {
		let tooltipItems = [];
		for (let k = 0; k < this._chart._renderedData.length; k++) {
			const countSymbols = this._chart._data[k].countSymbols || 0;

			if (k === 0) {
				this._ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
				this._drawAnnotations();
				this._hideAnnotationLabel();
			}
			renderedData = this._chart._renderedData[k];

			const [pointX, pointY, x, y] = renderedData.data.points[index];

			if (!pointY) return;

			if (!annotation) {
				this._ctx.beginPath();
				this._ctx.arc(x, y, this._chart._pointRadius, 0, Math.PI * 2);
				this._ctx.fillStyle = renderedData.data.props.lineColor || '#00000';
				this._ctx.fill();
				this._ctx.closePath();
			}

			let xValue: any = pointX.toFixed(countSymbols);
			if (this._chart._data[0].xValueType === 'dateTime') {
				const format = this._chart._data[0].xValueFormat || 'dd.MM.yyyy HH:mm';
				xValue = this._Date._getTimeStampDate(format, xValue);
			}

			let name: any = renderedData.data.props.name;

			const tooltipItem = {
				xValue,
				name: `${name}`,
				value: `${pointY.toFixed(countSymbols)}`,
				lineColor: `${renderedData.data.props.lineColor}`
			};
			tooltipItems.push(tooltipItem);
		}

		return tooltipItems;
	}

	private _getNearIndex(renderedData: DPChartCalcData, mouseX: number, mouseY: number, props: DPChartAnnotationLine) {
		let diff: number | null = null;
		let point: any = [];
		let index = 0;

		const coordinate = props.mode === 'vertical' ? mouseX : mouseY;

		for (let i = 0; i < renderedData.data.points.length; i++) {
			const [, , calcX, calcY] = renderedData.data.points[i];

			const renderCoordinate = props.mode === 'vertical' ? calcX : calcY;

			const dxy = coordinate - renderCoordinate;

			if (!diff) diff = dxy;

			if (dxy < 0) break;

			if (diff > dxy) {
				diff = dxy;
				index = i;
			}
		}

		return index;
	}

	_drawXLine(x: number) {
		this._ctx.beginPath();
		const padding = this._chart._padding;
		this._ctx.setLineDash([6, 3]);
		this._ctx.moveTo(x + 0.5, padding);
		this._ctx.lineTo(x + 0.5, this._chart._dpiHeight - this._chart._paddingBottom);
		this._ctx.lineWidth = 1;
		this._ctx.globalCompositeOperation = 'destination-over';
		this._ctx.strokeStyle = '#212529';
		this._ctx.stroke();
		this._ctx.closePath();
	}

	_drawYLine(y: number) {
		this._ctx.beginPath();
		const padding = this._chart._padding + this._chart._paddingBottom;
		this._ctx.setLineDash([6, 3]);
		this._ctx.moveTo(this._chart._paddingLeft, y + 0.5);
		this._ctx.lineTo(this._chart._viewWidth + this._chart._paddingLeft, y + 0.5);
		this._ctx.globalCompositeOperation = 'destination-over';
		this._ctx.strokeStyle = '#212529';
		this._ctx.lineWidth = 1;
		this._ctx.stroke();
		this._ctx.closePath();
	}

	/** Срабатывает, когда мышь покидает пространство графика */
	_mouseleave = (e: MouseEvent) => {
		this._ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
		this._drawAnnotations();
		this._hide();
	};

	public clean() {
		this._ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
		this._annotations = [];
	}

	private _removeAnnotation = (e: MouseEvent) => {
		const annotations = this._annotations;
		if (!annotations?.length) return;

		const { left, top } = this.Canvas.getBoundingClientRect() as DOMRect;

		const mouseX = e.clientX - left;
		const mouseY = e.clientY - top;

		this._annotations = annotations.filter((model: any) => {
			if (model.mode === 'vertical') {
				if (!(mouseX >= model.mouseX - 5 && mouseX <= model.mouseX + 5)) {
					return model;
				}
			} else {
				if (!(mouseY >= model.mouseY - 5 && mouseY <= model.mouseY + 5)) {
					return model;
				}
			}
		});

		if (annotations.length !== this._annotations.length) {
			this._ctx.clearRect(0, 0, this.Canvas.width, this.Canvas.height);
			this._drawAnnotations();
		}
	};

	public onRemoveAnnotations() {
		this.Canvas.addEventListener('mousedown', this._removeAnnotation);
	}

	public offRemoveAnnotations() {
		this.Canvas.removeEventListener('mousedown', this._removeAnnotation);
	}

	_mousedown = (e: MouseEvent) => {
		const { left, top } = this.Canvas.getBoundingClientRect() as DOMRect;

		const mouseX = e.clientX - left;
		const mouseY = e.clientY - top;

		if (mouseX > this._chart._paddingLeft && mouseX < this._chart._dpiWidth - this._chart._paddingRight) {
			this._ctx.beginPath();

			const padding = this._chart._padding;

			let moveX = mouseX + 0.5;
			let moveY = padding;
			let lineX = mouseX + 0.5;
			let lineY = this._chart._dpiHeight - this._chart._paddingBottom;
			if (this._chart._annotation.mode !== 'vertical') {
				moveX = this._chart._paddingLeft;
				moveY = mouseY + 0.5;
				lineX = this._chart._viewWidth + this._chart._paddingLeft;
				lineY = mouseY + 0.5;
			}
			this._ctx.setLineDash([0, 0]);
			this._ctx.moveTo(moveX, moveY);
			this._ctx.lineTo(lineX, lineY);

			let annotationProperties = {
				mode: this._chart._annotation.mode || 'vertical',
				mouseX,
				mouseY,
				moveX,
				moveY,
				lineX,
				lineY,
				label: {}
			} as DPChartAnnotationLine;

			this._ctx.lineWidth = 1.5;
			this._ctx.strokeStyle = this._colorAnnotations;
			this._ctx.stroke();
			this._ctx.closePath();

			this._annotations.push(annotationProperties);

			this._defineToolTipItems(mouseX, mouseY, true, annotationProperties);
		}
	};

	private _drawAnnotations() {
		const annotations = this._annotations;
		if (!annotations?.length) return;

		for (let i = 0; i < annotations.length; i++) {
			const { mouseX, mouseY, moveX, moveY, lineX, lineY } = annotations[i];

			this._ctx.beginPath();

			this._ctx.setLineDash([0, 0]);
			this._ctx.moveTo(moveX, moveY);
			this._ctx.lineTo(lineX, lineY);

			this._ctx.lineWidth = 1.5;
			this._ctx.strokeStyle = this._colorAnnotations;
			this._ctx.stroke();
			this._ctx.closePath();
		}
	}

	private _showAnnotationLabel = (e: MouseEvent) => {
		const annotations = this._annotations;
		if (!annotations?.length) return;

		document.onmousedown = null;

		const { left, top } = this.Canvas.getBoundingClientRect() as DOMRect;

		const mouseX = e.clientX - left;
		const mouseY = e.clientY - top;

		for (let i = 0; i < annotations.length; i++) {
			const model = annotations[i];

			if (!model.label?.items?.length) return;

			const { moveX, moveY, lineX, lineY } = annotations[i];

			if (model.mode === 'vertical') {
				if (mouseX >= model.mouseX - 5 && mouseX <= model.mouseX + 5) {
					this._showAnnotationLabelBox(moveX, moveY, model);
				}
			} else {
				if (mouseY >= model.mouseY - 5 && mouseY <= model.mouseY + 5) {
					this._showAnnotationLabelBox(moveX, moveY, model);
				}
			}
		}
	};

	private _showAnnotationLabelBox(moveX: number, moveY: number, model: DPChartAnnotationLine) {
		this._annotationLabel!.dataset.visible = 'true';

		const { width, height } = this._getAnnotationLabelSize(this._annotationLabel!);

		let x = moveX;
		let y = moveY;

		if (model.mode === 'vertical') {
			x = moveX - width! / 2;
			y = moveY;
		}

		this._show(y, x, model.label!, this._annotationLabel!);

		document.onmousedown = (e: MouseEvent) => {
			if (model.box) {
				model.box.remove();
				model.box = undefined;
				return;
			}

			const labelBox = this._getNewAnnotationLabel(model);
			labelBox.dataset.visible = 'true';

			this._show(y, x, model.label!, labelBox);
		};
	}

	private _getNewAnnotationLabel(model: DPChartAnnotationLine) {
		const labelBox = this._createAnnotationLabel();
		this._container?.append(labelBox);
		model.box = labelBox;

		return labelBox;
	}

	private _getAnnotationLabelSize(box: HTMLDivElement) {
		const { height, width } = box.getBoundingClientRect();

		return { width, height };
	}

	/**
	 * Добавляем слушатели событий для работы tooltip
	 * @returns
	 */
	_addListeners() {
		if (!this.Canvas) return;

		this.Canvas.addEventListener('mousemove', this._mousemove);
		this.Canvas.addEventListener('mouseleave', this._mouseleave);
	}

	addMousedownListener() {
		if (this._chart._annotation.enable) {
			this.Canvas.addEventListener('mousedown', this._mousedown);
			this.Canvas.removeEventListener('mousemove', this._showAnnotationLabel);
		} else {
			this.Canvas.addEventListener('mousemove', this._showAnnotationLabel);
			this.Canvas.removeEventListener('mousedown', this._mousedown);
		}
	}

	/**
	 * Проверяем, находимся ли мы над графиком
	 * @param mouse - объект, содержащий координаты мыши
	 * @param x - скорректированная координата по оси X
	 * @param length
	 * @returns
	 */
	_isOver(mouse: any, x: number, length: number, type: string) {
		if (!mouse) return false;
		const width = this._chart._viewWidth / length;
		if (Math.abs(x - mouse.x) < width / 2) {
			return true;
		}
	}

	public addComponents(card: HTMLDivElement) {
		this._container = card;

		card.append(this._createTooltip());
		this._annotationLabel = this._createAnnotationLabel();
		card.append(this._annotationLabel);
	}

	/** Создаем tooltip */
	private _createTooltip() {
		this._tooltip = document.createElement('div');
		this._tooltip.classList.add('dp-chart-tooltip');
		this._tooltip.dataset.visible = 'false';

		return this._tooltip;
	}

	private _createAnnotationLabel() {
		const box = document.createElement('div');
		box.classList.add('dp-chart-tooltip');
		box.dataset.visible = 'false';

		return box;
	}

	/**
	 * Устанавливаем данные для отрисовки tooltip
	 * @param data - Данные для отрисовки tooltip
	 * @returns
	 */
	_dataBound(data: DPChartTooltipData, annotation?: HTMLDivElement) {
		if (!this._tooltip) return;

		const box = annotation || this._tooltip;

		let list = document.createElement('ul');
		list.classList.add('dp-chart-tooltip-list');

		box.append(list);

		let title = document.createElement('p');
		title.classList.add('dp-chart-tooltip-text');

		for (let model of data.items) {
			let item = document.createElement('li');
			item.classList.add('dp-chart-tooltip-item');

			title.innerText = model.xValue;

			let content = document.createElement('p');
			content.classList.add('dp-chart-tooltip-text');
			content.innerText = `${model.name}:`;
			if (model.lineColor) {
				content.style.color = model.lineColor;
			}

			let value = document.createElement('p');
			value.classList.add('dp-chart-tooltip-value');
			value.innerText = `${model.value}`;

			item.append(content, value);
			list.append(item);
		}

		list.prepend(title);
	}

	/**
	 * Показываем tooltip
	 * @param {top, left} - значение top and left
	 * @param data - Данные tooltip
	 * @returns - выходит из функции если элемент tooltip отсутствует
	 */
	_show(top: number, left: number, data: DPChartTooltipData, annotationBox?: HTMLDivElement) {
		if (!this._tooltip) return;

		const box = annotationBox || this._tooltip;

		const { height, width } = this._tooltip.getBoundingClientRect();

		box.innerHTML = '';
		box.removeAttribute('data-visible');

		box.style.top = top - height + 'px';
		box.style.left = left + this._padding + 'px';

		if (annotationBox) {
			box.style.top = top + 'px';
			box.style.left = left + 'px';
		}

		this._dataBound(data, annotationBox);
	}

	/** Скрываем tooltip */
	_hide() {
		if (!this._tooltip) return;
		this._tooltip.dataset.visible = 'false';
	}

	private _hideAnnotationLabel() {
		if (!this._annotationLabel) return;
		this._annotationLabel.dataset.visible = 'false';
	}
}
