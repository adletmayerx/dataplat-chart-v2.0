import { Chart } from './core/dataplat.chart.core.js';

customElements.define(
	'dataplat-chart',
	class DataplatChart extends HTMLElement {
		public isRender: boolean;

		private _Chart: Chart;

		constructor() {
			super();

			this.isRender = false;
			this._Chart = new Chart(this);
		}

		connectedCallback() {
			// браузер вызывает этот метод при добавлении элемента в документ
			// (может вызываться много раз, если элемент многократно добавляется/удаляется)
			const readyState = document.readyState!;

			if (readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', () => {
					this.classList.add('dp-chart');
					if (this.data?.length) this._Chart._render();
					this.isRender = true;
				});
			} else {
				this.classList.add('dp-chart');
				if (this.data?.length) this._Chart._render();
				this.isRender = true;
			}
		}

		disconnectedCallback() {
			// браузер вызывает этот метод при удалении элемента из документа
			// (может вызываться много раз, если элемент многократно добавляется/удаляется)
			this._Chart._destroy();
			this?.remove();
		}

		static get observedAttributes() {
			return [
				/* массив имён атрибутов для отслеживания их изменений */
			];
		}

		attributeChangedCallback(name: string, oldValue: string, newValue: string) {
			this._setProperty(name, newValue, oldValue);
			// вызывается при изменении одного из перечисленных выше атрибутов
		}

		/**
		 * Обработка входящих значение
		 * @param name  - Имя свойства
		 * @param newValue  - Новое значение
		 * @param oldValue  - Старое значение (Не обязательный параметр);
		 */
		private _setProperty(name: string, newValue: string | any, oldValue: string = '') {
			switch (name) {
				case 'data':
					if (newValue instanceof Array<DPChartDataSeries>) {
						this.isRender ? this.setData(newValue) : (this._Chart._data = newValue);
					} else {
						throw new Error(
							'переданное значение для dataSource не является экземпляром объекта DPDataSource'
						);
					}
					break;
				default:
					break;
			}
		}

		public setData(data: Array<DPChartDataSeries>) {
			if (data instanceof Array<DPChartDataSeries>) {
				this._Chart._data = data;
				this._Chart._render();
			}
		}

		public cleanAnnotations() {
			if (!this._Chart._Tooltip) return;
			this._Chart._Tooltip.clean();
		}

		public onRemoveAnnotations() {
			if (!this._Chart._Tooltip) return;
			this._Chart._Tooltip.onRemoveAnnotations();
		}

		public offRemoveAnnotations() {
			if (!this._Chart._Tooltip) return;
			this._Chart._Tooltip.offRemoveAnnotations();
		}

		get data(): Array<DPChartDataSeries> {
			return this._Chart._data;
		}

		set data(value: Array<DPChartDataSeries>) {
			this._setProperty('data', value);
		}

		get width(): string | number {
			return this._Chart._width;
		}

		set width(value: string | number) {
			this._Chart._width = value;
		}

		get height(): string | number {
			return this._Chart._height;
		}

		set height(value: string | number) {
			this._Chart._height = value;
		}

		get chartTitle(): DPChartTitle {
			return this._Chart._chartTitle;
		}

		set chartTitle(value: DPChartTitle) {
			this._Chart._setPropertyChartTitle(value);
		}

		get axisY(): DPChartAxisY | Array<DPChartAxisY> {
			return this._Chart._axisY;
		}

		set axisY(value: DPChartAxisY | Array<DPChartAxisY>) {
			this._Chart._setPropertyAxisY(value);
		}

		get axisX(): DPChartAxisX {
			return this._Chart._axisX;
		}

		set axisX(value: DPChartAxisX) {
			this._Chart._setPropertyAxisX(value);
		}

		get legend(): DPChartLegend | null {
			return this._Chart._Legend?._legend!;
		}

		set legend(value: DPChartLegend | null) {
			this._Chart._setPropertyChartLegend(value);
		}

		get downsampled(): boolean {
			return this._Chart._downsampled;
		}

		set downsampled(value: boolean) {
			this._Chart._downsampled = value;
		}

		get backgroundColor(): string {
			return this._Chart._backgroundColor;
		}

		set backgroundColor(value: string) {
			this._Chart._backgroundColor = value;
		}

		get navigator(): boolean {
			return this._Chart._navigator;
		}

		set navigator(value: boolean) {
			this._Chart._navigator = value;
		}

		get substrateColor(): string {
			return this._Chart._substrateColor;
		}

		set substrateColor(value: string) {
			this._Chart._substrateColor = value;
		}

		get annotation(): DPChartAnnotation {
			return this._Chart._annotation;
		}

		set annotation(value: DPChartAnnotation) {
			this._Chart._setPropertyAnnotation(value);
		}
	}
);
